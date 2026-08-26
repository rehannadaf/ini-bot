const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.get("/", (req, res) => {
  res.json({
    message: "INI Bot Gemini backend is running!",
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    console.log("User message:", message);

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

   const response = await ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: message,
});
    const reply = response.text;

    console.log("INI Bot:", reply);

    res.json({
      reply: reply,
    });
  } catch (error) {
    console.error("GEMINI ERROR:");
    console.error(error);

    res.status(500).json({
      error: error.message || "Gemini request failed",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`INI Bot backend running on port ${PORT}`);
});