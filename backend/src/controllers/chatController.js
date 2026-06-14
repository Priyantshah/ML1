import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

// Basic in-memory rate limit (per-process, per-IP)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const ipRequestLog = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipRequestLog.get(ip) || { count: 0, start: now };

  if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
    ipRequestLog.set(ip, { count: 1, start: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  ipRequestLog.set(ip, entry);
  return false;
}

export const chatWithAssistant = async (req, res, next) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        status: "error",
        message: "Groq API key is not configured on the server",
      });
    }

    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    if (isRateLimited(ip)) {
      return res.status(429).json({
        status: "error",
        message: "Too many requests. Please slow down.",
      });
    }

    const { message, context } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Invalid request: 'message' must be a non-empty string.",
      });
    }

    const systemPrompt =
      "You are a futuristic AI assistant integrated inside an AutoML platform. " +
      "You help users understand datasets, preprocessing steps, EDA visualizations, " +
      "model training, evaluation metrics, and predictions. Your tone is professional, " +
      "intelligent, and precise. Explain concepts clearly and technically correctly. " +
      "Use the provided context (dataset summary, target column, model metrics, confusion " +
      "matrix, feature importance, predictions) when relevant. If information is missing, " +
      "state assumptions explicitly.";

    const contextText = context
      ? `Context from AutoML system:\n${JSON.stringify(context, null, 2).substring(0, 15000)}`
      : "No additional context was provided from the AutoML system.";

    const body = {
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: contextText },
        { role: "user", content: message },
      ],
      temperature: 0.4,
      stream: false,
    };

    const response = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      return res.status(500).json({
        status: "error",
        message: "Failed to get response from AI assistant. " + errorText,
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";

    return res.json({
      status: "success",
      data: {
        reply,
      },
    });
  } catch (err) {
    console.error("chatWithAssistant error:", err);
    import('fs').then(fs => fs.writeFileSync('chat_error.log', err.stack || err.toString()));
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

