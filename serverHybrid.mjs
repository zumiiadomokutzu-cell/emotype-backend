import "dotenv/config";
import express from "express";
import cors from "cors";
import { mapEmotion } from "./emotionMapping.mjs";
import { mapEmotionV3} from "./emotionMappingV3.mjs";
import { analyzeWithPathumma } from "./pathummaClient.mjs";
import { chooseReflection, isGroundedPathumma } from "./reflectionGuard.mjs";

const app = express();
// For local Vite development. Add origins if your teammate uses a different port.
const allowedOrigins = new Set([
  "http://localhost:5173", "http://127.0.0.1:5173",
  "http://localhost:5174", "http://127.0.0.1:5174"
]);
app.use(cors({ origin(origin, callback) {
  if (!origin || allowedOrigins.has(origin)) return callback(null, true);
  callback(new Error("Origin not allowed"));
}}));
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_req, res) => res.json({ success: true, service: "emotype" }));

app.post("/api/generate", async (req, res) => {
  const text = req.body?.text;
  // Keep frontend and backend validation in agreement (the demo accepts 1..200 chars).
  if (typeof text !== "string" || !text.trim() || text.length > 200) {
    return res.status(400).json({ success: false, error: "Text must be 1-200 characters." });
  }
  if (!process.env.AIFORTHAI_API_KEY) {
    return res.status(503).json({ success: false, error: "AI4Thai key not configured." });
  }

  let ssenseRaw;
  try {
    // S-Sense stays the required/base model.
    const url = new URL("https://api.aiforthai.in.th/ssense");
    url.searchParams.set("text", text.trim());
    const aiResponse = await fetch(url, {
      headers: { Apikey: process.env.AIFORTHAI_API_KEY },
      signal: AbortSignal.timeout(15000)
    });
    if (!aiResponse.ok) throw new Error(`S-Sense HTTP ${aiResponse.status}`);
    ssenseRaw = await aiResponse.json();
  } catch (error) {
    console.error("S-Sense request failed:", error.message);
    return res.status(502).json({ success: false, error: "S-Sense analysis failed." });
  }

  let base;
  try {
    base = mapEmotion(ssenseRaw);
  } catch (error) {
    console.error("S-Sense result invalid:", error.message);
    return res.status(502).json({ success: false, error: "Invalid S-Sense result." });
  }

  try {
    // Pathumma is optional. Reject suspect outputs rather than treating
    // a syntactically valid JSON as a reliable interpretation.
    const pathumma = await analyzeWithPathumma(text.trim());
    if (!isGroundedPathumma(text.trim(), pathumma)) {
      throw new Error("Pathumma output failed grounding checks");
    }

    const enriched = mapEmotionV3(ssenseRaw, pathumma);
    const reflection = chooseReflection(
      text.trim(),
      pathumma.reflectionMessage,
      base.analysis.mood
    );

    const title = enriched.analysis.artworkTitle?.trim() || "Untitled Emotion";
    return res.json({
      success: true,
      mode: "hybrid",
      ...enriched,
      analysis: {
        ...enriched.analysis,
        artworkTitle: title,
        reflectionMessage: reflection.message,
        reflectionSource: reflection.source
      },
      visual: {
        ...enriched.visual,
        artDirection: title
      }
    });
  } catch (error) {
    console.warn("Pathumma unavailable or invalid; using S-Sense fallback:", error.message);
    const reflection = chooseReflection(text.trim(), null, base.analysis.mood);
    return res.json({
      success: true,
      mode: "ssense-only",
      ...base,
      analysis: {
        ...base.analysis,
        reflectionMessage: reflection.message,
        reflectionSource: reflection.source
      }
    });
  }
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`EMOTYPE Hybrid Backend: http://localhost:${PORT}`));
