
import assert from "node:assert/strict";
import { fuseAnalyses } from "./pathummaFusion.mjs";

// Test cases จากผล S-Sense และ Pathumma ที่ทดลองจริง
const testCases = [
  {
    name: "Case 1: Tired but Happy",
    ssense: {
      polarity: "positive",
      positiveWords: ["ดีใจ", "สำเร็จ"],
      negativeWords: ["เหนื่อย"]
    },
    pathumma: {
      primaryEmotion: "happy",
      secondaryEmotion: "tired",
      relationship: "mixed",
      interpretation: "รู้สึกดีที่ได้ทำงานสำเร็จแม้วันนี้จะเหนื่อยมาก",
      visualMetaphor:
        "แสงสว่างจากความสำเร็จและความมืดของความเหนื่อยล้า",
      artworkTitle: "Success and Fatigue"
    },
    expected: {
      fusedMood: "mixed",
      primaryEmotion: "joy",
      secondaryEmotion: "fatigue",
      relationship: "mixed"
    }
  },

  {
    name: "Case 2: Positive Only",
    ssense: {
      polarity: "positive",
      positiveWords: ["มีความสุข"],
      negativeWords: []
    },
    pathumma: {
      primaryEmotion: "joy",
      secondaryEmotion: "none",
      relationship: "aligned",
      interpretation: "รู้สึกดีใจที่ได้ทำสิ่งที่ชอบ",
      visualMetaphor: "แสงสว่างจากดวงอาทิตย์",
      artworkTitle: "Sun Rays of Joy"
    },
    expected: {
      fusedMood: "positive",
      primaryEmotion: "joy",
      secondaryEmotion: "none",
      relationship: "aligned"
    }
  },

  {
    name: "Case 3: Negative Only",
    ssense: {
      polarity: "negative",
      positiveWords: [],
      negativeWords: ["ผิดหวัง", "เสียใจ"]
    },
    pathumma: {
      primaryEmotion: "sadness",
      secondaryEmotion: "disappointment or none",
      relationship: "aligned",
      interpretation: "รู้สึกผิดหวังและเสียใจมากในวันนี้",
      visualMetaphor: "แสงสว่างที่จางหายไป",
      artworkTitle: "Lost Light"
    },
    expected: {
      fusedMood: "negative",
      primaryEmotion: "sadness",
      secondaryEmotion: "disappointment",
      relationship: "aligned"
    }
  },

  {
    name: "Case 4: Tired but Proud",
    ssense: {
      polarity: "positive",
      positiveWords: ["ภูมิใจ", "ทำสำเร็จ"],
      negativeWords: ["เหนื่อย"]
    },
    pathumma: {
      primaryEmotion: "Tired",
      secondaryEmotion: "Proud",
      relationship: "mixed",
      interpretation: "เหนื่อยแต่ภูมิใจที่ทำสำเร็จ",
      visualMetaphor: "แสงสว่างในความมืด",
      artworkTitle: "Tired Yet Proud"
    },
    expected: {
      fusedMood: "mixed",
      primaryEmotion: "fatigue",
      secondaryEmotion: "pride",
      relationship: "mixed"
    }
  }
];

// เริ่มทดสอบ
let passed = 0;
let failed = 0;

for (const test of testCases) {
  console.log("\n==================================");
  console.log("TEST:", test.name);
  console.log("==================================");

  try {
    const result = fuseAnalyses(
      test.ssense,
      test.pathumma
    );

    console.log("Actual result:");
    console.log(JSON.stringify(result, null, 2));

    // ตรวจสอบผลลัพธ์กับค่าที่คาดหวัง
    for (const [field, expectedValue] of
      Object.entries(test.expected)) {

      assert.equal(
        result[field],
        expectedValue,
        `Mismatch at field: ${field}`
      );
    }

    // ตรวจว่า Text Fields ที่จำเป็นไม่หายไป
    assert.ok(result.interpretation);
    assert.ok(result.visualMetaphor);
    assert.ok(result.artworkTitle);

    console.log("\n✅ PASS:", test.name);
    passed++;

  } catch (error) {
    console.error("\n❌ FAIL:", test.name);
    console.error(error.message);
    failed++;
  }
}

console.log("\n==================================");
console.log("FUSION TEST SUMMARY");
console.log("==================================");
console.log("Passed:", passed);
console.log("Failed:", failed);
console.log("Total:", testCases.length);

if (failed > 0) {
  process.exitCode = 1;
}
