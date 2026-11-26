import assert from "node:assert/strict";
import { mapEmotionV2 } from "./emotionMappingV2.mjs";

/**
 * Test coverage for new artistic emotion traits.
 * Offline fixtures are NOT live AI4Thai responses.
 */
function ssense(text, mood) {
  const pos = mood === "positive";
  const neg = mood === "negative";
  return {
    sentiment: {
      polarity: mood,
      "polarity-pos": pos,
      "polarity-neg": neg,
      score: "0"
    },
    preprocess: {
      input: text,
      pos: pos ? ["ตัวอย่างคำบวก"] : [],
      neg: neg ? ["ตัวอย่างคำลบ"] : []
    }
  };
}
function pathumma(primary, secondary = "none") {
  return {
    primaryEmotion: primary,
    secondaryEmotion: secondary,
    relationship: secondary === "none" ? "aligned" : "mixed",
    interpretation: "Example interpretation",
    visualMetaphor: "Abstract layered light",
    artworkTitle: "Sample Artwork"
  };
}

const tests = [
  ["Relief (neutral S-Sense)", "neutral", "relief"],
  ["Hope", "positive", "hope"],
  ["Trust", "positive", "trust"],
  ["Surprise", "neutral", "surprise"],
  ["Anticipation", "neutral", "anticipation"],
  ["Anger", "negative", "anger"],
  ["Fear", "negative", "fear"],
  ["Disgust", "negative", "disgust"],
  ["Excitement", "positive", "excitement"],
  ["Satisfaction", "positive", "satisfaction"],
  ["Frustration", "negative", "frustration"],
  ["Determination", "positive", "determination"],
  ["Existing Calmness", "neutral", "calmness"]
];

let passed = 0;
for (const [name, mood, primary] of tests) {
  const result = mapEmotionV2(ssense("ข้อความจำลอง", mood), pathumma(primary));
  assert.equal(result.analysis.primaryEmotion, primary);
  assert.equal(result.analysis.mood, mood); // Base S-Sense mood unchanged
  assert.equal(result.emotionProfile.source, "emotion-traits");
  assert.ok(result.visual.palette.every(x => /^#[0-9A-F]{6}$/.test(x)));
  assert.ok(result.visual.flowSpeed >= 0.1 && result.visual.flowSpeed <= 0.95);
  assert.equal(result.visual.style, "aurora-typography");
  assert.equal(typeof result.visual.blur, "number");
  passed++;
  console.log(`PASS: ${name}`);
}

// Unknown vocabulary is preserved and handled by the existing fallback.
const unknown = mapEmotionV2(
  ssense("ข้อความจำลอง", "neutral"),
  pathumma("sonder", "wistfulness")
);
assert.equal(unknown.emotionProfile.source, "base-mood-fallback");
assert.equal(unknown.analysis.primaryEmotion, "sonder");
passed++;
console.log("PASS: Unknown labels → fallback");

// Hybrid with a known and unknown label uses the known one.
const partial = mapEmotionV2(
  ssense("ข้อความจำลอง", "neutral"),
  pathumma("relief", "novel-emotion-label")
);
assert.equal(partial.emotionProfile.source, "emotion-traits");
passed++;
console.log("PASS: Partial known label → known trait");

// The original frontend contract stays unchanged.
const result = mapEmotionV2(
  ssense("ข้อความจำลอง", "positive"),
  pathumma("joy", "pride")
);
const required = [
  "palette", "blur", "fontWeight", "flowSpeed",
  "letterSpacing", "layerCount", "distortion", "style"
];
for (const field of required) assert.ok(field in result.visual, `Missing visual.${field}`);
passed++;
console.log("PASS: Frontend contract preserved");

console.log(`\nSUMMARY: ${passed}/${tests.length + 3} tests passed`);
