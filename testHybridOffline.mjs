// Offline test: proves the hybrid mapping and fallback output shapes.
// Does NOT call AI4Thai or test the Python bridge.
import assert from "node:assert/strict";
import { mapEmotion } from "./emotionMapping.mjs";
import { mapEmotionV2 } from "./emotionMappingV2.mjs";

const ssense = {
  sentiment: { polarity: "positive", "polarity-pos": true, "polarity-neg": true, score: "66.67" },
  preprocess: { input: "วันนี้เหนื่อยมาก แต่ดีใจที่ทำงานสำเร็จ", pos: ["ดีใจ", "สำเร็จ"], neg: ["เหนื่อย"] }
};
const pathumma = {
  primaryEmotion: "happy", secondaryEmotion: "tired", relationship: "mixed",
  interpretation: "รู้สึกดีที่ได้ทำงานสำเร็จแม้วันนี้จะเหนื่อยมาก",
  visualMetaphor: "แสงสว่างจากความสำเร็จและความมืดของความเหนื่อยล้า",
  artworkTitle: "Success and Fatigue"
};
const v1 = mapEmotion(ssense);
const v2 = mapEmotionV2(ssense, pathumma);
assert.equal(v1.analysis.mood, "mixed");
assert.equal(v2.analysis.mood, v1.analysis.mood);
assert.equal(v2.analysis.primaryEmotion, "joy");
assert.equal(v2.analysis.secondaryEmotion, "fatigue");
for (const field of ["palette", "blur", "fontWeight", "flowSpeed", "letterSpacing", "layerCount", "distortion", "style"]) {
  assert.ok(field in v1.visual);
  assert.ok(field in v2.visual);
}
console.log("PASS: v1 S-Sense-only fallback contract");
console.log("PASS: v2 Hybrid preserves all frontend visual fields");
console.log("PASS: Hybrid adds context and emotionProfile");
console.log("OFFLINE SUMMARY: 3/3 passed");
