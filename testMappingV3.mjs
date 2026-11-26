import assert from "node:assert/strict";
import { attachVisualFamily, VISUAL_FAMILIES } from "./visualFamilyMapping.mjs";

function fixture({ mood = "neutral", primaryEmotion = "none",
  secondaryEmotion = "none", relationship = "uncertain" } = {}) {
  return {
    success: true,
    mode: "hybrid",
    analysis: {
      text: "ข้อความตัวอย่าง",
      polarity: mood === "neutral" ? "neutral" : "positive",
      mood, primaryEmotion, secondaryEmotion, relationship,
      interpretation: "ตัวอย่าง Reflection",
      reflectionMessage: "ข้อความสะท้อน",
      reflectionSource: "pathumma",
      artworkTitle: "An Abstract Moment"
    },
    visual: {
      palette: ["#58438D","#90DCCB","#E9AFC9"],
      blur: 20, fontWeight: 350, flowSpeed: 0.35,
      letterSpacing: "0.08em", layerCount: 3, distortion: 0.12,
      style: "aurora-typography", composition: "flowing",
      artDirection: "An Abstract Moment"
    },
    emotionProfile: { valence: 0.1, arousal: 0.4, tension: 0.5,
      warmth: 0.2, source: "emotion-traits" }
  };
}
const tests = [
  ["Joy → Solar Silk", {mood:"positive",primaryEmotion:"joy"}, "solar-silk"],
  ["Sadness → Mist", {mood:"negative",primaryEmotion:"sadness"}, "mist-dissolve"],
  ["Anger → Burn Fracture", {mood:"negative",primaryEmotion:"anger"}, "burn-fracture"],
  ["Fear → Nervous Haze", {mood:"negative",primaryEmotion:"fear"}, "nervous-haze"],
  ["Relief → Gentle Veil", {mood:"neutral",primaryEmotion:"relief"}, "gentle-veil"],
  ["Disgust → Granular Liquid", {mood:"negative",primaryEmotion:"disgust"}, "granular-liquid"],
  ["Surprise → Radiant Bloom", {mood:"neutral",primaryEmotion:"surprise"}, "radiant-bloom"],
  ["Hope → Forward Tension", {mood:"positive",primaryEmotion:"hope"}, "forward-tension"],
  ["Thai emotion alias", {mood:"neutral",primaryEmotion:"ความสงบ"}, "gentle-veil"],
  ["Unknown → Neutral fallback", {mood:"neutral",primaryEmotion:"sonder"}, "gentle-veil"],
  ["Unknown → Negative fallback", {mood:"negative",primaryEmotion:"sonder"}, "mist-dissolve"]
];

let passed = 0;
function check(name, fn) {
  try {fn();console.log("PASS:",name);passed++;}
  catch (e){console.log("FAIL:",name);throw e;}
}
for (const [name, args, family] of tests) {
  check(name, () => {
    const result = attachVisualFamily(fixture(args));
    assert.equal(result.visual.visualFamily, family);
    assert.ok(result.visual.shaderPreset);
    assert.ok(result.visual.motionPreset);
    assert.ok(result.visual.typographyPreset);
  });
}
check("Joy+fatigue preserves joy base, adds veil",()=>{
  const joy=attachVisualFamily(fixture({mood:"mixed",primaryEmotion:"joy"}));
  const mix=attachVisualFamily(fixture({mood:"mixed",primaryEmotion:"joy",secondaryEmotion:"fatigue",relationship:"mixed"}));
  assert.equal(mix.visual.visualFamily,"solar-silk");
  assert.equal(mix.visual.secondaryFamily,"mist-dissolve");
  assert.equal(mix.visual.blendMode,"dual-layer-contrast");
  assert.ok(mix.visual.renderHints.veil > joy.visual.renderHints.veil);
  assert.ok(mix.visual.modifiers.includes("fatigue-softening"));
});
check("Fatigue+pride stays mist and adds anchor",()=>{
  const plain=attachVisualFamily(fixture({mood:"mixed",primaryEmotion:"fatigue"}));
  const mix=attachVisualFamily(fixture({mood:"mixed",primaryEmotion:"fatigue",secondaryEmotion:"pride",relationship:"mixed"}));
  assert.equal(mix.visual.visualFamily,"mist-dissolve");
  assert.ok(mix.visual.renderHints.anchor > plain.visual.renderHints.anchor);
});
check("Anger+anxiety adds jitter without changing family",()=>{
  const result=attachVisualFamily(fixture({mood:"negative",primaryEmotion:"anger",secondaryEmotion:"anxiety",relationship:"mixed"}));
  assert.equal(result.visual.visualFamily,"burn-fracture");
  assert.ok(result.visual.modifiers.includes("anxiety-instability"));
  assert.ok(result.visual.renderHints.jitter > VISUAL_FAMILIES["burn-fracture"].hints.jitter);
});
check("All old frontend fields and reflection preserved",()=>{
  const before=fixture({mood:"positive",primaryEmotion:"joy"});
  const after=attachVisualFamily(before);
  assert.deepEqual(after.analysis,before.analysis);
  assert.deepEqual(after.emotionProfile,before.emotionProfile);
  for(const [key,value] of Object.entries(before.visual)) {
    assert.deepEqual(after.visual[key],value,key);
  }
  assert.equal(after.visual.accessibility.flashFree,true);
});
check("Unknown primary, known secondary uses known family",()=>{
  const result=attachVisualFamily(fixture({mood:"mixed",primaryEmotion:"sonder",secondaryEmotion:"pride",relationship:"uncertain"}));
  assert.equal(result.visual.visualFamily,"solar-silk");
  assert.equal(result.visual.familySource,"secondary");
  assert.equal(result.visual.secondaryFamily,null);
});
check("Unknown emotion does not fabricate emotion label",()=>{
  const result=attachVisualFamily(fixture({mood:"neutral",primaryEmotion:"wistfulness"}));
  assert.equal(result.analysis.primaryEmotion,"wistfulness");
  assert.equal(result.visual.familySource,"mood-fallback");
});
check("All render hints are normalized",()=>{
  for(const f of Object.keys(VISUAL_FAMILIES)) {
    const value=attachVisualFamily(fixture({primaryEmotion:"unknown"}));
    const hints=VISUAL_FAMILIES[f].hints;
    for(const x of Object.values(hints)) assert.ok(x>=0 && x<=1);
    for(const x of Object.values(value.visual.renderHints)) assert.ok(x>=0 && x<=1);
  }
});
console.log(`\nSUMMARY: ${passed}/${tests.length+7} tests passed`);
