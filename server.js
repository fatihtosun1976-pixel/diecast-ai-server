import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// TEST
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "DieCast AI API",
    port: process.env.PORT
  });
});

// 🔥 AI ENDPOINT
app.post("/ai", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "image gerekli" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: "Bu diecast aracı analiz et: marka, model, ölçek tahmin et" },
              {
                type: "input_image",
                image_url: image
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    res.json({
      success: true,
      result: data.output_text
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI hata verdi" });
  }
});

// Render PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
