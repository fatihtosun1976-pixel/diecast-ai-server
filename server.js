import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "DieCast AI API",
    port: process.env.PORT
  });
});

app.get("/ai", (req, res) => {
  res.json({
    ok: true,
    message: "AI endpoint ayakta. POST ile kullan."
  });
});

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
              {
                type: "input_text",
                text: "Bu diecast aracı analiz et. diecastBrand, vehicleMake, model, year, scale, series, color, condition, notes, estimatedValue alanlarını tahmin et."
              },
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

    return res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "AI hata verdi",
      details: String(err)
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
