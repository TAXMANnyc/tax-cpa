require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());
app.use(cors());

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "";

    if (!userMessage) {
      return res
        .status(400)
        .json({ error: "Missing 'message' in request body" });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful tax CPA assistant for self-employed professionals.",
        },
        { role: "user", content: userMessage },
      ],
    });

    const reply = response.choices?.[0]?.message?.content || "";
    return res.json({ reply });
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({
      error: err?.message || "OpenAI error",
    });
  }
});

app.get("/", (req, res) => {
  res.send("tax-cpa server running on port 3000");
});

app.listen(port, () => {
  console.log(`tax-cpa server listening on http://localhost:${port}`);
});
