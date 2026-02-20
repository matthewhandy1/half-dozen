import { Resend } from "resend";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const resend = new Resend(resendKey);
  const { name, email, message } = req.body;

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
        error: 'Failed to send email',
        details: error.message || "Unknown Resend error"
      });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
