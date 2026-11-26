
import "dotenv/config";
import express from "express";
import cors from "cors";
import { mapEmotion } from "./emotionMapping.mjs";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/generate", async (req, res) => {
  const text = req.body?.text;

  // 1. ตรวจสอบข้อความที่ได้รับ
  if (typeof text !== "string" ||
      text.trim().length === 0 ||
      text.length > 500) {
    return res.status(400).json({
      error: "Please provide 1-500 characters."
    });
  }

  // 2. ตรวจสอบว่ามี API Key หรือไม่
  if (!process.env.AIFORTHAI_API_KEY) {
    return res.status(503).json({
      error: "API Key is not configured."
    });
  }

  try {
    // 3. เตรียม URL ของ AI4Thai
    const url = new URL(
      "https://api.aiforthai.in.th/ssense"
    );

    url.searchParams.set("text", text.trim());

    // 4. เรียก AI4Thai
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Apikey: process.env.AIFORTHAI_API_KEY
      },
      signal: AbortSignal.timeout(15000)
    });

    // 5. ตรวจสอบสถานะ API
    if (!response.ok) {
      throw new Error(
        `AI4Thai returned ${response.status}`
      );
    }

    // 6. รับ JSON จาก AI4Thai
    const aiResult = await response.json();

    // 7. ส่งผล AI เข้า Emotion Mapping
    const result = mapEmotion(aiResult);

    // 8. ส่งข้อมูลกลับไปหา Frontend
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error("API Error:", error.message);

    res.status(502).json({
      success: false,
      error: "AI analysis failed."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `EMOTYPE Backend running on port ${PORT}`
  );
});
