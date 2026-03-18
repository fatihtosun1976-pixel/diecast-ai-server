import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "DieCast AI API",
    port: process.env.PORT || 10000
  });
});

app.get("/ai", (req, res) => {
  res.json({
    ok: true,
    message: "AI endpoint ayakta. POST ile kullan."
  });
});

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

app.post("/ai", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        ok: false,
        error: "image gerekli"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "OPENAI_API_KEY tanımlı değil"
      });
    }

    const prompt = `
Sen diecast koleksiyon uzmanısın.
Gönderilen görseli incele.
SADECE geçerli JSON döndür.
Açıklama, markdown, kod bloğu, ek metin yazma.

Şema:
{
  "diecastBrand": "",
  "vehicleMake": "",
  "model": "",
  "year": "",
  "scale": "",
  "series": "",
  "color": "",
  "condition": "",
  "notes": "",
  "estimatedValue": ""
}

Kurallar:
- Emin değilsen boş string ver.
- year sadece yıl olsun.
- scale mümkünse 1/64 gibi olsun.
- estimatedValue sayı değil, metin olarak dönsün.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: image }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: "OpenAI isteği başarısız",
        details: data
      });
    }

    const outputText =
      data?.output_text ||
      data?.output?.map(x => x?.content?.map(c => c?.text).join(" ")).join(" ") ||
      "";

    const parsed = safeJsonParse(outputText);

    if (!parsed) {
      return res.status(500).json({
        ok: false,
        error: "Model geçerli JSON döndürmedi",
        raw: outputText
      });
    }

    return res.json({
      ok: true,
      diecastBrand: parsed.diecastBrand || "",
      vehicleMake: parsed.vehicleMake || "",
      model: parsed.model || "",
      year: parsed.year || "",
      scale: parsed.scale || "",
      series: parsed.series || "",
      color: parsed.color || "",
      condition: parsed.condition || "",
      notes: parsed.notes || "",
      estimatedValue: parsed.estimatedValue || ""
    });
  } catch (err) {
    console.error("AI /ai error:", err);

    return res.status(500).json({
      ok: false,
      error: "AI hata verdi",
      details: String(err)
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
