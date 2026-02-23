import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import { db } from "@vercel/postgres";
import dotenv from "dotenv";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import * as bcrypt from "bcryptjs";

dotenv.config();

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const PostgresStore = connectPgSimple(session);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

// Initialize Database (Lazy & Thread-safe)
let isDbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

const initDb = async () => {
  if (isDbInitialized) return;
  if (dbInitPromise) return dbInitPromise;
  
  dbInitPromise = (async () => {
    if (!process.env.POSTGRES_URL) {
      console.warn("POSTGRES_URL not found. Database features will be disabled.");
      return;
    }
    try {
      console.log("Initializing database tables...");
      
      // Users table
      await db.sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT,
          google_id TEXT UNIQUE,
          name TEXT,
          avatar TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Sync data table
      await db.sql`
        CREATE TABLE IF NOT EXISTS sync_data (
          sync_id TEXT PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Migration
      await db.sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sync_data' AND column_name='user_id') THEN
            ALTER TABLE sync_data ADD COLUMN user_id INTEGER REFERENCES users(id);
          END IF;
        END $$;
      `;

      // Session table
      await db.sql`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL
        ) WITH (OIDS=FALSE);
        
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey') THEN
            ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
          END IF;
        END $$;
        
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
      `;

      isDbInitialized = true;
      console.log("Database initialized successfully.");
    } catch (error) {
      console.error("Database initialization failed:", error);
      dbInitPromise = null; // Allow retry
      throw error;
    }
  })();
  
  return dbInitPromise;
};

app.use(express.json({ limit: '10mb' }));

// Middleware to ensure DB is ready - MUST be before session
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && !isDbInitialized && req.path !== '/api/health') {
    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("DB Init Timeout")), 10000)
      );
      await Promise.race([initDb(), timeout]);
    } catch (err) {
      console.error("DB Init error in middleware:", err);
    }
  }
  next();
});

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Session Middleware
const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || "half-dozen-secret-key-123",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
};

if (process.env.POSTGRES_URL) {
  sessionConfig.store = new PostgresStore({
    conString: process.env.POSTGRES_URL,
    tableName: 'session',
    createTableIfMissing: false
  });
}

app.use(session(sessionConfig));

// Auth Middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Auth Routes
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 8);
    const result = await db.sql`
      INSERT INTO users (email, password, name)
      VALUES (${email}, ${hashedPassword}, ${name || null})
      RETURNING id, email, name;
    `;
    const user = result.rows[0];
    req.session.userId = user.id;
    res.status(201).json({ user });
  } catch (error: any) {
    if (error.code === '23505') return res.status(400).json({ error: "Email already exists" });
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.sql`SELECT * FROM users WHERE email = ${email}`;
    const user = result.rows[0];

    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.userId = user.id;
    res.json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  try {
    const result = await db.sql`SELECT id, email, name, avatar FROM users WHERE id = ${req.session.userId}`;
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// API Routes
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    console.error("RESEND_API_KEY not configured");
    return res.status(500).json({ error: "Email service not configured" });
  }

  const resend = new Resend(resendKey);

  try {
    const { data, error } = await resend.emails.send({
      from: "Half Dozen Contact <info@halfdozen.ca>",
      to: ["info@halfdozen.ca"],
      subject: `Contact Form: ${name || "New Submission"}`,
      replyTo: email,
      html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${name || "Not provided"}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    if (error) {
      console.error("Resend error details:", error);
      return res.status(500).json({ 
        error: "Failed to send email", 
        details: error.message || "Unknown Resend error" 
      });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Contact error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/sync/save", async (req, res) => {
  if (!process.env.POSTGRES_URL) {
    return res.status(503).json({ error: "Database not configured" });
  }
  const { syncId, data } = req.body;
  const userId = req.session.userId || null;

  if (!syncId || !data) {
    return res.status(400).json({ error: "Missing syncId or data" });
  }

  try {
    await db.sql`
      INSERT INTO sync_data (sync_id, user_id, data, updated_at)
      VALUES (${syncId}, ${userId}, ${JSON.stringify(data)}, CURRENT_TIMESTAMP)
      ON CONFLICT (sync_id) DO UPDATE
      SET data = EXCLUDED.data, user_id = COALESCE(EXCLUDED.user_id, sync_data.user_id), updated_at = CURRENT_TIMESTAMP;
    `;

    // If logged in, also update the user's profile info in the users table
    if (userId && data.profile) {
      await db.sql`
        UPDATE users 
        SET name = ${data.profile.name}, avatar = ${data.profile.avatar}
        WHERE id = ${userId};
      `;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Sync save error:", error);
    res.status(500).json({ error: "Failed to save sync data" });
  }
});

app.get("/api/sync/user", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.sql`
      SELECT sync_id, data, updated_at FROM sync_data WHERE user_id = ${req.session.userId} ORDER BY updated_at DESC;
    `;
    res.json({ syncs: rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user syncs" });
  }
});

app.get("/api/sync/load/:id", async (req, res) => {
  if (!process.env.POSTGRES_URL) {
    return res.status(503).json({ error: "Database not configured" });
  }
  const { id } = req.params;
  try {
    const { rows } = await db.sql`
      SELECT data FROM sync_data WHERE sync_id = ${id};
    `;
    if (rows.length === 0) {
      return res.status(404).json({ error: "Sync data not found" });
    }
    res.status(200).json({ data: rows[0].data });
  } catch (error) {
    console.error("Sync load error:", error);
    res.status(500).json({ error: "Failed to load sync data" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

// JSON 404 for API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global Error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

// Setup Vite or Static serving
if (process.env.NODE_ENV !== "production") {
  const setupDev = async () => {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  };
  setupDev();
}

export default app;
