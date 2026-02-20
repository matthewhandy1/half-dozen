import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const ai = new GoogleGenAI({ apiKey });
  const { team } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this Pokemon team: ${JSON.stringify(team)}`,
    });
    res.status(200).json({ analysis: response.text });
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
  }
}
