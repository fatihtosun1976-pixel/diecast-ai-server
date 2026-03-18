import express from "express";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
app.get("/", (req, res) => res.json({ ok: true, service: "DieCast AI API", port: PORT }));
app.post("/ai", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) return res.status(500).json({ error: true, message: "OPENAI_API_KEY tanımlı değil." });
    const image = req.body?.image;
    if (!image) return res.status(400).json({ error: true, message: "image alanı gerekli." });
    const prompt = `Sen diecast koleksiyon uzmanısın. Sadece JSON döndür:
    {"diecastBrand":"","vehicleMake":"","model":"","year":"","scale":"","series":"","color":"","condition":"","notes":"","estimatedValue":""}`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: image } }] }]
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: true, message: "OpenAI isteği başarısız.", details: data });
    const text = data?.choices?.[0]?.message?.content || "{}";
    let parsed = {};
    try { parsed = JSON.parse(text); } catch { parsed = {}; }
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: true, message: "Sunucu hatası.", details: String(err) });
  }
});
app.listen(PORT, "0.0.0.0", () => console.log(`DieCast AI API çalışıyor: http://0.0.0.0:${PORT}`));