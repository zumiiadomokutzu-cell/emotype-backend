// Guardrails for user-facing AI reflection. Heuristics, NOT a proof of
// factual grounding. When uncertain, provide a neutral local fallback.
const ECHO_MARKERS = [
  "หากข้อความกำกวม",
  "ให้สะท้อน",
  "ห้ามสรุป",
  "ไม่สรุปว่า",
  "ห้ามวินิจฉัย",
  "ห้ามแต่ง",
  "อย่าตีความ",
  "ตอบเป็น json",
  "primaryemotion",
  "secondaryemotion",
  "reflectionmessage",
  "จากข้อความเท่านั้น",
  "เพื่อออกแบบแสง สี พื้นที่ว่าง"
];

const UNSUPPORTED_DETAILS = [
  "รางวัล", "เวที", "ประกวด", "พิธีรับ", "โบนัส",
  "สอบตก", "คนรัก", "ลาออก", "โรงพยาบาล"
];

// Detects specific contradictions seen in early tests.
// Not a general fact checker.
function containsUngroundedDetail(input, output) {
  const source = input.toLowerCase();
  const candidate = output.toLowerCase();
  return UNSUPPORTED_DETAILS.some(term =>
    candidate.includes(term) && !source.includes(term)
  );
}

function includesInstructionEcho(value) {
  const str = String(value ?? "").toLowerCase();
  return ECHO_MARKERS.some(term => str.includes(term));
}

function repeatsOtherExample(input, output) {
  const text = input.toLowerCase();
  const value = output.toLowerCase();
  return !text.includes("พัก") && value.includes("ขอพักหน่อยนะ");
}

// Validate the full interpretation too; an invented scene in one field
// can otherwise contaminate the user-facing "What we notice" section.
export function isGroundedPathumma(input, data) {
  if (!data || typeof data !== "object") return false;
  const content = [
    data.interpretation,
    data.reflectionMessage,
    data.visualMetaphor,
    data.artworkTitle
  ].filter(x => typeof x === "string").join("\n");

  if (!content.trim()) return false;
  if (includesInstructionEcho(content)) return false;
  if (containsUngroundedDetail(input, content)) return false;
  if (repeatsOtherExample(input, content)) return false;
  return true;
}

function localFallback(input, mood) {
  const t = input.trim();
  // Only phrase a specific reflection when there is clear textual evidence.
  if (/พัก|หยุดพัก/.test(t)) {
    return "การขอเวลาพักสักครู่ก็มีความหมาย โดยไม่จำเป็นต้องอธิบายทุกอย่างในตอนนี้";
  }
  if (/สอบผ่าน|สอบได้|ผ่านสอบ/.test(t)) {
    return "ดีใจด้วยกับการสอบผ่านครั้งนี้นะ ดูเหมือนว่านี่เป็นช่วงเวลาที่มีความหมายสำหรับคุณ";
  }
  if (/ผิดหวัง/.test(t)) {
    return "ความผิดหวังอาจทำให้วันนี้รู้สึกหนักขึ้น คุณไม่จำเป็นต้องรีบจัดการทุกอย่างในทันที";
  }
  if (mood === "positive") {
    return "ข้อความนี้มีแง่มุมที่น่ายินดีอยู่ ลองเก็บความรู้สึกนี้ไว้ในแบบของคุณนะ";
  }
  if (mood === "negative") {
    return "ข้อความนี้อาจมีความรู้สึกหนักอยู่บางส่วน คุณให้เวลากับตัวเองได้";
  }
  if (mood === "mixed") {
    return "บางครั้งความรู้สึกหลายอย่างก็เกิดขึ้นพร้อมกันได้ โดยไม่จำเป็นต้องเลือกเพียงอย่างเดียว";
  }
  return "ข้อความสั้น ๆ ก็มีความหมายในแบบของมัน โดยไม่จำเป็นต้องนิยามทุกความรู้สึก";
}

export function chooseReflection(input, generated, mood) {
  const value = typeof generated === "string" ? generated.trim() : "";
  const valid = (
    value.length >= 12 &&
    value.length <= 220 &&
    !includesInstructionEcho(value) &&
    !containsUngroundedDetail(input, value) &&
    !repeatsOtherExample(input, value)
  );
  return valid
    ? { message: value, source: "pathumma" }
    : { message: localFallback(input, mood), source: "local-fallback" };
}
