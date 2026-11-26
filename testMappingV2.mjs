import assert from "node:assert/strict";
import { mapEmotionV2 } from "./emotionMappingV2.mjs";

const cases = [
  {
    name: "Tired but happy", text: "วันนี้เหนื่อยมาก แต่ดีใจที่ทำงานสำเร็จ",
    ssense: { sentiment: { polarity: "positive", "polarity-pos": true, "polarity-neg": true, score: "66.67" }, preprocess: { input: "วันนี้เหนื่อยมาก แต่ดีใจที่ทำงานสำเร็จ", pos: ["ดีใจ", "สำเร็จ"], neg: ["เหนื่อย"] } },
    pathumma: { primaryEmotion: "happy", secondaryEmotion: "tired", relationship: "mixed", interpretation: "รู้สึกดีที่ได้ทำงานสำเร็จแม้วันนี้จะเหนื่อยมาก", visualMetaphor: "แสงสว่างจากความสำเร็จและความมืดของความเหนื่อยล้า", artworkTitle: "Success and Fatigue" },
    expected: { mood: "mixed", primaryEmotion: "joy", secondaryEmotion: "fatigue" }
  },
  {
    name: "Positive only", text: "วันนี้มีความสุขมาก ได้ทำสิ่งที่ชอบ",
    ssense: { sentiment: { polarity: "positive", "polarity-pos": true, "polarity-neg": false, score: "66.67" }, preprocess: { input: "วันนี้มีความสุขมาก ได้ทำสิ่งที่ชอบ", pos: ["มีความสุข"], neg: [] } },
    pathumma: { primaryEmotion: "joy", secondaryEmotion: "none", relationship: "aligned", interpretation: "รู้สึกดีใจที่ได้ทำสิ่งที่ชอบ", visualMetaphor: "แสงสว่างจากดวงอาทิตย์", artworkTitle: "Sun Rays of Joy" },
    expected: { mood: "positive", primaryEmotion: "joy", secondaryEmotion: "none" }
  },
  {
    name: "Negative only", text: "วันนี้ผิดหวังและเสียใจมาก",
    ssense: { sentiment: { polarity: "negative", "polarity-pos": false, "polarity-neg": true, score: "92.31" }, preprocess: { input: "วันนี้ผิดหวังและเสียใจมาก", pos: [], neg: ["ผิดหวัง", "เสียใจ"] } },
    pathumma: { primaryEmotion: "sadness", secondaryEmotion: "disappointment or none", relationship: "aligned", interpretation: "รู้สึกผิดหวังและเสียใจมากในวันนี้", visualMetaphor: "แสงสว่างที่จางหายไป", artworkTitle: "Lost Light" },
    expected: { mood: "negative", primaryEmotion: "sadness", secondaryEmotion: "disappointment" }
  },
  {
    name: "Tired but proud", text: "วันนี้เหนื่อยมาก แต่ก็ภูมิใจที่ทำสำเร็จ",
    ssense: { sentiment: { polarity: "positive", "polarity-pos": true, "polarity-neg": true, score: "66.67" }, preprocess: { input: "วันนี้เหนื่อยมาก แต่ก็ภูมิใจที่ทำสำเร็จ", pos: ["ภูมิใจ", "ทำสำเร็จ"], neg: ["เหนื่อย"] } },
    pathumma: { primaryEmotion: "Tired", secondaryEmotion: "Proud", relationship: "mixed", interpretation: "เหนื่อยแต่ภูมิใจที่ทำสำเร็จ", visualMetaphor: "แสงสว่างในความมืด", artworkTitle: "Tired Yet Proud" },
    expected: { mood: "mixed", primaryEmotion: "fatigue", secondaryEmotion: "pride" }
  },
  {
    name: "Unknown emotions → fallback", text: "ตัวอย่างคำอารมณ์ใหม่",
    ssense: { sentiment: { polarity: "neutral", "polarity-pos": false, "polarity-neg": false, score: "0" }, preprocess: { input: "ตัวอย่างคำอารมณ์ใหม่", pos: [], neg: [] } },
    pathumma: { primaryEmotion: "sonder", secondaryEmotion: "wistfulness", relationship: "uncertain", interpretation: "", visualMetaphor: "", artworkTitle: "Unknown Mood" },
    expected: { mood: "neutral", primaryEmotion: "sonder", secondaryEmotion: "wistfulness", source: "base-mood-fallback" }
  }
];

let passed = 0;
const results = [];
for (const t of cases) {
  try {
    const result = mapEmotionV2(t.ssense, t.pathumma);
    assert.equal(result.analysis.mood, t.expected.mood);
    assert.equal(result.analysis.primaryEmotion, t.expected.primaryEmotion);
    assert.equal(result.analysis.secondaryEmotion, t.expected.secondaryEmotion);
    if (t.expected.source) assert.equal(result.emotionProfile.source, t.expected.source);
    assert.equal(result.visual.palette.length, 3);
    assert.ok(result.visual.palette.every(color => /^#[0-9A-F]{6}$/.test(color)));
    assert.ok(result.visual.flowSpeed >= 0.1 && result.visual.flowSpeed <= 0.95);
    results.push({ name: t.name, result });
    passed++;
    console.log(`PASS: ${t.name}`);
    console.log(JSON.stringify({mood:result.analysis.mood, emotions:[result.analysis.primaryEmotion,result.analysis.secondaryEmotion], profile:result.emotionProfile, palette:result.visual.palette, flowSpeed:result.visual.flowSpeed}, null, 2));
  } catch (e) {
    console.error(`FAIL: ${t.name}: ${e.message}`);
    process.exitCode = 1;
  }
}
const happy = results.find(x => x.name === "Tired but happy")?.result;
const proud = results.find(x => x.name === "Tired but proud")?.result;
try {
  assert.ok(happy && proud);
  assert.notDeepEqual(happy.visual.palette, proud.visual.palette);
  assert.notEqual(happy.visual.flowSpeed, proud.visual.flowSpeed);
  console.log("PASS: two mixed emotions generate distinct visuals");
  passed++;
} catch (e) {
  console.error("FAIL: mixed emotion differentiation", e.message);
  process.exitCode = 1;
}
console.log(`\nSUMMARY: ${passed}/6 tests passed`);
