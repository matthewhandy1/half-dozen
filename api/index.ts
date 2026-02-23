import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import { db } from "@vercel/postgres";
import dotenv from "dotenv";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";

dotenv.config();

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const PostgresStore = connectPgSimple(session);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database (Non-blocking)
  const initDb = async () => {
    if (!process.env.POSTGRES_URL) {
      console.warn("POSTGRES_URL not found. Database features will be disabled.");
      return;
    }
    try {
      const client = await db.connect();
      
      // Users table
      await client.sql`
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

      // Sync data table (updated to link to user_id)
      await client.sql`
        CREATE TABLE IF NOT EXISTS sync_data (
          sync_id TEXT PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Migration: Add user_id to sync_data if it doesn't exist
      await client.sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sync_data' AND column_name='user_id') THEN
            ALTER TABLE sync_data ADD COLUMN user_id INTEGER REFERENCES users(id);
          END IF;
        END $$;
      `;

      // Session table for connect-pg-simple
      await client.sql`
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

      console.log("Database initialized and tables verified.");
    } catch (error) {
      console.error("Database initialization failed:", error);
    }
  };
  initDb();

  app.use(express.json({ limit: '10mb' }));

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Session Middleware
  app.use(session({
    store: new PostgresStore({
      conString: process.env.POSTGRES_URL,
      tableName: 'session',
      createTableIfMissing: false // We handle it in initDb
    }),
    secret: process.env.SESSION_SECRET || "half-dozen-secret-key-123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

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
      const hashedPassword = await bcrypt.hash(password, 10);
      const client = await db.connect();
      const result = await client.sql`
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
      const client = await db.connect();
      const result = await client.sql`SELECT * FROM users WHERE email = ${email}`;
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
      const client = await db.connect();
      const result = await client.sql`SELECT id, email, name, avatar FROM users WHERE id = ${req.session.userId}`;
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
  app.post("/api/analyze", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { team } = req.body;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this Pokemon team for competitive play: ${JSON.stringify(team)}`,
      });
      res.status(200).json({ analysis: response.text });
    } catch (error) {
      console.error("Analysis failed:", error);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

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
      const client = await db.connect();
      await client.sql`
        INSERT INTO sync_data (sync_id, user_id, data, updated_at)
        VALUES (${syncId}, ${userId}, ${JSON.stringify(data)}, CURRENT_TIMESTAMP)
        ON CONFLICT (sync_id) DO UPDATE
        SET data = EXCLUDED.data, user_id = COALESCE(EXCLUDED.user_id, sync_data.user_id), updated_at = CURRENT_TIMESTAMP;
      `;
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Sync save error:", error);
      res.status(500).json({ error: "Failed to save sync data" });
    }
  });

  app.get("/api/sync/user", requireAuth, async (req, res) => {
    try {
      const client = await db.connect();
      const { rows } = await client.sql`
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
      const client = await db.connect();
      const { rows } = await client.sql`
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
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "..", "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "..", "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  return app;
}

const appPromise = startServer();
export default appPromise;
