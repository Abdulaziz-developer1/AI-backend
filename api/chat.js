import OpenAI from "openai";

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  let reply = null;
  let errorMessage = null;
  let errorType = null;
  let fullResponse = null;

  if (!message || typeof message !== "string") {
    errorMessage = "No message provided or invalid type";
    errorType = "BadRequest";
    return res.status(200).json({ reply, error: errorMessage, type: errorType, fullResponse });
  }

  const client = new OpenAI({
    apiKey: process.env.API_KEY,
    baseURL: "https://openrouter.ai/v1"
  });

  try {
    const response = await client.chat.completions.create({
      model: "x-ai/grok-4-fast:free",
      messages: [{ role: "user", content: message }]
    });

    reply = response.choices?.[0]?.message?.content;

    if (!reply) {
      errorMessage = "No reply from API. Check your model, key, or payload.";
      errorType = "NoReply";
      fullResponse = response;
    }

  } catch (err) {
    if (err.response?.data) {
      errorMessage = err.response.data.message || "OpenRouter API Error";
      errorType = err.response.data.code || "ServerError";
      fullResponse = err.response.data;
    } else {
      errorMessage = err.message;
      errorType = "ServerError";
    }
  }

  // Always return 200 for testing purposes
  res.status(200).json({ reply, error: errorMessage, type: errorType, fullResponse });
}
