import assert from "node:assert/strict";
import { chooseReflection, isGroundedPathumma } from "./reflectionGuard.mjs";

// Three problematic outputs actually observed in Postman
const cases = [
  {
    name: "Prompt echo is rejected",
    input: "ขอพักหน่อยนะ",
    data: {
      interpretation: "หากมีความเหนื่อย ให้รับรู้ความรู้สึกโดยไม่ตัดสินหรือสั่งให้คิดบวก",
      artworkTitle: "แสงสว่าง",
      reflectionMessage: "หากข้อความกำกวม เช่น 'ขอพักหน่อยนะ' ให้สะท้อนความต้องการพัก โดยไม่สรุปว่าเศร้า หมดไฟ หรือป่วย"
    }
  },
  {
    name: "Invented award is rejected",
    input: "วันนี้ดีใจมากที่สอบผ่าน",
    data: {
      interpretation: "การได้รับรางวัลนี้เป็นการยืนยันถึงความสามารถ",
      artworkTitle: "",
      reflectionMessage: "ขอแสดงความยินดีกับการได้รับรางวัล"
    }
  },
  {
    name: "Previous test message contamination is rejected",
    input: "วันนี้ผิดหวังมาก",
    data: {
      interpretation: "ขอพักหน่อยนะ",
      artworkTitle: "ขอพักหน่อยนะ",
      reflectionMessage: "รับรู้ความต้องการพัก โดยไม่สรุปว่าเศร้า หมดไฟ หรือป่วย"
    }
  }
];
for(const c of cases) {
  assert.equal(isGroundedPathumma(c.input, c.data), false);
  console.log("PASS:",c.name);
}
const success = {
  interpretation: "ข้อความอาจสะท้อนความต้องการพัก",
  artworkTitle: "Quiet Interval",
  reflectionMessage: "การพักเล็กน้อยก็มีคุณค่า แม้จะยังไม่ต้องอธิบายความรู้สึกทั้งหมด"
};
assert.equal(isGroundedPathumma("ขอพักหน่อยนะ", success), true);
assert.equal(
  chooseReflection("ขอพักหน่อยนะ", success.reflectionMessage, "neutral").source,
  "pathumma"
);
console.log("PASS: Valid reflection accepted");
const fall = chooseReflection("วันนี้ผิดหวังมาก", "หากข้อความกำกวม ให้สะท้อน", "negative");
assert.equal(fall.source,"local-fallback");
assert.ok(fall.message.includes("ผิดหวัง"));
console.log("PASS: Failed reflection uses safe fallback");
console.log("SUMMARY: 5/5 checks passed");
