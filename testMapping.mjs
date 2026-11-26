
import { mapEmotion } from "./emotionMapping.mjs";

const tests = [
  {
    name: "Mixed: tired but happy",
    sentiment: {
      polarity: "positive",
      "polarity-pos": true,
      "polarity-neg": true,
      score: "66.67"
    },
    preprocess: {
      input: "วันนี้เหนื่อยมาก แต่ดีใจที่ทำงานสำเร็จ",
      pos: ["ดีใจ", "สำเร็จ"],
      neg: ["เหนื่อย"]
    }
  },
  {
    name: "Positive only",
    sentiment: {
      polarity: "positive",
      "polarity-pos": true,
      "polarity-neg": false,
      score: "66.67"
    },
    preprocess: {
      input: "วันนี้มีความสุขมาก ได้ทำสิ่งที่ชอบ",
      pos: ["มีความสุข"],
      neg: []
    }
  },
  {
    name: "Negative only",
    sentiment: {
      polarity: "negative",
      "polarity-pos": false,
      "polarity-neg": true,
      score: "92.31"
    },
    preprocess: {
      input: "วันนี้ผิดหวังและเสียใจมาก",
      pos: [],
      neg: ["ผิดหวัง", "เสียใจ"]
    }
  },
  {
    name: "Mixed: tired but proud",
    sentiment: {
      polarity: "positive",
      "polarity-pos": true,
      "polarity-neg": true,
      score: "66.67"
    },
    preprocess: {
      input: "วันนี้เหนื่อยมาก แต่ก็ภูมิใจที่ทำสำเร็จ",
      pos: ["ภูมิใจ", "ทำสำเร็จ"],
      neg: ["เหนื่อย"]
    }
  }
];

for (const test of tests) {
  const result = mapEmotion(test);

  console.log("\nTEST:", test.name);
  console.log("AI Polarity:", result.analysis.polarity);
  console.log("Visual Mood:", result.analysis.mood);
  console.log("Palette:", result.visual.palette);
  console.log("Flow Speed:", result.visual.flowSpeed);
}