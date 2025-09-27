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

  const { message, messages } = req.body;

  let reply = null;
  let errorMessage = null;
  let errorType = null;
  let fullResponse = null;

  // --- Validate input ---
  let chatMessages = [];
  if (Array.isArray(messages) && messages.length > 0) {
    chatMessages = messages;
  } else if (typeof message === "string" && message.trim() !== "") {
    chatMessages = [{ role: "user", content: message }];
  } else {
    return res.status(400).json({ error: "No message(s) provided" });
  }

  const client = new OpenAI({
    apiKey: process.env.API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });

  try {
    console.log("➡️ Sending to OpenRouter:", chatMessages);

    const response = await client.chat.completions.create({
      model: "x-ai/grok-4-fast:free",
      messages: chatMessages,
    });

    reply = response.choices?.[0]?.message?.content;
    fullResponse = response;

    console.log("✅ Got reply:", reply);
  } catch (err) {
    console.error("❌ Backend error:", err);
    if (err.response?.data) {
      errorMessage = err.response.data.message || "OpenRouter API Error";
      errorType = err.response.data.code || "ServerError";
      fullResponse = err.response.data;
    } else {
      errorMessage = err.message;
      errorType = "ServerError";
    }
  }

  res.status(200).json({ reply, error: errorMessage, type: errorType, fullResponse });
}
