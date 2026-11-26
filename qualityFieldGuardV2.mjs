/**
 * EMOTYPE field-wise Pathumma quality gate.
 *
 * Heuristic safeguards for an art prototype, NOT a guarantee of factual or
 * psychological accuracy. Never use these values as clinical measurements.
 * A rejected field gets its own conservative, explicitly sourced fallback.
 */

const clean = (x) => typeof x === 'string' ? x.trim().slice(0, 500) : '';
const lower = (x) => clean(x).toLowerCase();

const ALIASES = {
  happy:'joy', happiness:'joy', proud:'pride', tired:'fatigue', exhausted:'fatigue',
  sad:'sadness', worried:'anxiety', anxious:'anxiety', angry:'anger', calm:'calmness',
  'ความสุข':'joy','ดีใจ':'joy','ความดีใจ':'joy',
  'ความภูมิใจ':'pride','ภูมิใจ':'pride',
  'ความเหนื่อย':'fatigue','เหนื่อย':'fatigue','เหนื่อยล้า':'fatigue',
  'ความเศร้า':'sadness','เศร้า':'sadness',
  'ความผิดหวัง':'disappointment','ผิดหวัง':'disappointment',
  'ความกังวล':'anxiety','กังวล':'anxiety',
  'ความกลัว':'fear','กลัว':'fear',
  'ความโกรธ':'anger','โกรธ':'anger',
  'ความโล่งใจ':'relief','โล่งใจ':'relief',
  'ความสงบ':'calmness','สงบ':'calmness',
  'ความหวัง':'hope','ความพึงพอใจ':'satisfaction',
  'none':'none','uncertain':'uncertain'
};
const ACCEPTED_LABELS = new Set([
  'joy','pride','fatigue','sadness','disappointment','anxiety','fear','anger',
  'frustration','disgust','calmness','relief','trust','hope','surprise',
  'anticipation','determination','excitement','satisfaction','nostalgia',
  'melancholy','gratitude','affection','love','grief','awe','wonder',
  'acceptance','serenity','irritation','rage','unease','nervousness',
  'exhaustion','perseverance'
]);
// Sentiment is a signal, not a diagnosis. Only refuse an LLM label when
// the S-Sense direction conflicts AND no explicit counter-evidence is present.
// This is intentionally conservative for very short / ambiguous inputs.
const POSITIVE_FAMILY = new Set([
  'joy','pride','satisfaction','gratitude','hope','love','affection',
  'excitement','relief','calmness','trust','serenity','acceptance'
]);
const NEGATIVE_FAMILY = new Set([
  'sadness','disappointment','anxiety','fear','anger','frustration',
  'disgust','fatigue','grief','melancholy','irritation','rage',
  'unease','nervousness','exhaustion'
]);

const EVIDENCE = [
  ['disappointment',['ผิดหวัง']],
  ['fatigue',['เหนื่อย','อ่อนล้า','เหนื่อยล้า']],
  ['joy',['ดีใจ','มีความสุข','สุขใจ']],
  ['pride',['ภูมิใจ']],
  ['sadness',['เศร้า','เสียใจ']],
  ['anger',['โกรธ','โมโห']],
  ['anxiety',['กังวล','วิตก']],
  ['fear',['กลัว','หวาด']],
  ['relief',['โล่งใจ','สบายใจขึ้น']],
  ['calmness',['สงบ','นิ่งใจ']],
  ['hope',['มีหวัง','ความหวัง']],
  ['surprise',['ประหลาดใจ','ตกใจ','เซอร์ไพรส์']],
  ['trust',['ไว้ใจ','เชื่อใจ']],
  ['disgust',['รังเกียจ','ขยะแขยง']]
];

// Lack of enough context is not an invitation to guess a specific emotion.
function lowContextWithoutEvidence(input, cues) {
  return cues.length===0 && [...input.replace(/\s/g,'')].length<=6;
}
function contradictsGroundedMood(label, mood, cues) {
  // A mixed sentence may legitimately carry both positive and negative meaning.
  const hasPositiveCue=cues.some(x=>POSITIVE_FAMILY.has(x));
  const hasNegativeCue=cues.some(x=>NEGATIVE_FAMILY.has(x));
  if (mood==='negative' && POSITIVE_FAMILY.has(label) && !hasPositiveCue) return true;
  if (mood==='positive' && NEGATIVE_FAMILY.has(label) && !hasNegativeCue) return true;
  return false;
}

const ECHO_PHRASES = [
  'หากข้อความกำกวม','ให้สะท้อน','ห้ามสรุป','ห้ามวินิจฉัย',
  'ห้ามแต่ง','ตอบเป็น json','primaryemotion','secondaryemotion',
  'reflectionmessage','visualmetaphor','จากข้อความเท่านั้น',
  'เพื่อออกแบบแสง สี พื้นที่ว่าง'
];
// High-risk invented details repeatedly seen in the live QA samples.
const UNSUPPORTED_TERMS = [
  'รางวัล','เวที','คอมพิวเตอร์','หน้าจอ','แข่งขัน','โบนัส','สอบตก',
  'ของขวัญ','ได้รับของขวัญ','ยิ้มแฉ่ง',
  'คนรัก','ครอบครัว','คนรอบข้าง','เพื่อนของคุณ','โรงพยาบาล',
  'เหตุการณ์ที่ไม่คาดคิด','ภาระที่มีอยู่','การทำงาน','ทำงานหนัก'
];
const SCENE_TERMS = [
  'ดวงอาทิตย์','เมฆ','ท้องฟ้า','ทะเล','ภูเขา','ถนน','อุโมงค์',
  'ดวงตา','ใบหน้า','หน้าจอ','คอมพิวเตอร์','เวที','เกาะ','ทะเลทราย',
  'พระจันทร์','ดวงดาว','พระอาทิตย์'
];
const PATRONIZING_OR_CERTAIN = [
  'ฉันเข้าใจว่าคุณ','ฉันรู้ว่าคุณ','อย่าลืม','คุณต้อง','ขอให้',
  'จะดีขึ้นแน่นอน','สิ่งดีๆรออยู่','สิ่งดี ๆ รออยู่','ข้างหน้าเสมอ',
  'เป็นแรงบันดาลใจให้','ควรจะ','/ค่ะ','/ครับ'
];

function containsAny(s, phrases) {
  const t = lower(s);
  return phrases.some(p => t.includes(p));
}
function containsUnsupported(input, output) {
  const t = lower(input), v = lower(output);
  return UNSUPPORTED_TERMS.some(term => v.includes(term) && !t.includes(term));
}
function borrowedExample(input, output) {
  const t = lower(input), v = lower(output);
  return (!t.includes('พัก') && v.includes('ขอพักหน่อยนะ')) ||
    (!t.includes('สอบ') && v.includes('สอบผ่าน'));
}
function extraFatigue(input, output) {
  return !/เหนื่อย|อ่อนล้า|เพลีย|หมดแรง|ล้า/.test(input) &&
    /คุณรู้สึกเหนื่อย|รู้สึกเหนื่อยล้า|กำลังเหนื่อยล้า|คุณเหนื่อยล้า|หมดไฟ/.test(output);
}
// Reject statements naming an emotion that was not expressed by the writer.
// This is intentionally a small, high-precision list; a keyword heuristic
// cannot validate every nuanced Thai sentence.
const EMOTION_CLAIM_TERMS = [
  ['disappointment', ['ผิดหวัง']],
  ['fatigue', ['เหนื่อย','อ่อนล้า','เพลีย','หมดแรง']],
  ['joy', ['ดีใจ','มีความสุข','สุขใจ']],
  ['sadness', ['เสียใจ','เศร้า']],
  ['anger', ['โกรธ','โมโห','หงุดหงิด']],
  ['anxiety', ['วิตก','กังวล']],
  ['fear', ['กลัว','หวาด']],
  ['pride', ['ภูมิใจ']],
  ['relief', ['โล่งใจ']]
];
function inventedEmotionClaim(input, candidate) {
  const t=clean(input), v=clean(candidate);
  return EMOTION_CLAIM_TERMS.some(([,words]) =>
    words.some(w => v.includes(w)) && !words.some(w=>t.includes(w))
  );
}

// Interjections can be energetic without revealing *which* emotion they mean.
// Keep the label uncertain; attach art-direction energy instead.
export function expressionCueFor(text, emotion='uncertain') {
  if(emotion!=='uncertain') return 'none';
  const t=clean(text).replace(/\s/g,'');
  return /^(?:โว้ย+|อ้าก+|อ๊าก+|เฮ้ย+|เห้ย+|ว๊าก+|โอ๊ย+)[!！?？~]*$/u.test(t)
    ? 'ambiguous-expressive' : 'none';
}

/** Additive art modifier only; never overwrites the recognized emotion. */
export function applyExpressionArtHints(visual, cue) {
  if(cue!=='ambiguous-expressive') return visual;
  const cap=n=>Number(Math.max(0,Math.min(1,n)).toFixed(2));
  return {
    ...visual,
    // Preserve all existing family and preset IDs for React v3 compatibility.
    flowSpeed:cap(Math.max(Number(visual.flowSpeed)||0,0.48)),
    distortion:cap(Math.max(Number(visual.distortion)||0,0.15)),
    modifiers:[...new Set([...(Array.isArray(visual.modifiers)?visual.modifiers:[]),'ambiguous-expressive'])],
    expressionModifier:'ambiguous-expressive',
    renderHints:{
      ...(visual.renderHints||{}),
      jitter:cap(Math.max(Number(visual.renderHints?.jitter)||0,0.3)),
      grain:cap(Math.max(Number(visual.renderHints?.grain)||0,0.22)),
      fracture:cap(Math.max(Number(visual.renderHints?.fracture)||0,0.12))
    }
  };
}

function safeBasic(input, output) {
  const t = clean(output);
  return t.length >= 8 && t.length <= 240 &&
    !containsAny(t, ECHO_PHRASES) &&
    !containsUnsupported(input,t) &&
    !borrowedExample(input,t) &&
    !extraFatigue(input,t) &&
    !inventedEmotionClaim(input,t);
}

function explicitCues(text) {
  const t = clean(text);
  return EVIDENCE.filter(([,terms]) => terms.some(x => t.includes(x)))
    .map(([emotion]) => emotion)
    .filter(e => !(e === 'joy' && /ไม่ดีใจ|ไม่มีความสุข/.test(t)));
}
function ambiguousRest(text, cues) {
  return /พัก/.test(text) && cues.length === 0;
}
function sameCluster(emotion, cues) {
  if(cues.includes(emotion)) return true;
  const clusters = [
    ['joy','pride','excitement','satisfaction','gratitude','hope'],
    ['sadness','disappointment','melancholy','grief','fatigue'],
    ['anxiety','fear','unease','nervousness'],
    ['anger','frustration','irritation','rage'],
    ['calmness','relief','trust','serenity','acceptance']
  ];
  return clusters.some(group => group.includes(emotion) && cues.some(c=>group.includes(c)));
}
function normalizeEmotion(value) {
  const raw=lower(value);
  return ALIASES[raw] || raw;
}
function fallbackInterpretation(input, mood) {
  if(/ผิดหวัง/.test(input)) return 'ข้อความนี้บอกถึงความผิดหวัง โดยไม่ได้ระบุสาเหตุ';
  if(/สอบผ่าน/.test(input) && /ดีใจ|สุข/.test(input)) return 'ข้อความนี้บอกถึงความดีใจที่สอบผ่าน';
  if(/พัก/.test(input)) return 'ข้อความนี้เป็นการขอเวลาพัก โดยยังไม่ได้ระบุอารมณ์หรือสาเหตุอย่างชัดเจน';
  if(/เหนื่อย/.test(input) && /ดีใจ|ภูมิใจ/.test(input)) return 'ข้อความนี้สะท้อนทั้งความเหนื่อยและความรู้สึกเชิงบวกที่เกิดขึ้นพร้อมกัน';
  if(/เหนื่อย/.test(input)) return 'ข้อความนี้ระบุถึงความเหนื่อยล้า';
  if(/เศร้า|เสียใจ/.test(input)) return 'ข้อความนี้ระบุถึงความเศร้าหรือเสียใจ';
  if(/โกรธ/.test(input)) return 'ข้อความนี้ระบุถึงความโกรธ';
  if(mood==='positive') return 'ข้อความนี้มีน้ำเสียงเชิงบวก แต่ยังมีรายละเอียดไม่มาก';
  if(mood==='negative') return 'ข้อความนี้มีน้ำเสียงเชิงลบ แต่ยังมีรายละเอียดไม่มาก';
  if(mood==='mixed') return 'ข้อความนี้มีสัญญาณของความรู้สึกมากกว่าหนึ่งด้าน';
  return 'ข้อความนี้ยังไม่ได้ระบุอารมณ์อย่างชัดเจน';
}
function fallbackReflection(input, mood) {
  if(/ผิดหวัง/.test(input)) return 'ความผิดหวังที่คุณบอกมาไม่จำเป็นต้องถูกเปลี่ยนให้เป็นความรู้สึกอื่นทันที';
  if(/สอบผ่าน/.test(input) && /ดีใจ|สุข/.test(input)) return 'ดีใจด้วยกับการสอบผ่านครั้งนี้นะ ความรู้สึกดีใจของคุณมีความหมาย';
  if(/พัก/.test(input)) return 'การขอเวลาพักสักครู่ก็มีความหมาย โดยไม่จำเป็นต้องอธิบายทุกอย่างในตอนนี้';
  if(/เหนื่อย/.test(input) && /ดีใจ|ภูมิใจ/.test(input)) return 'ความเหนื่อยและความรู้สึกดี ๆ เกิดขึ้นพร้อมกันได้ คุณไม่จำเป็นต้องเลือกแค่อย่างใดอย่างหนึ่ง';
  if(/เศร้า|เสียใจ/.test(input)) return 'วันนี้มีความเศร้าอยู่ในข้อความของคุณ และความรู้สึกนั้นมีพื้นที่ของมันเอง';
  if(/โกรธ|โมโห/.test(input)) return 'ข้อความนี้มีความโกรธอยู่ และความรู้สึกนั้นสามารถมีพื้นที่ได้โดยไม่ต้องรีบอธิบาย';
  if(mood==='positive') return 'ในข้อความนี้มีความรู้สึกดี ๆ อยู่บางส่วน';
  if(mood==='negative') return 'ข้อความนี้มีความรู้สึกหนักอยู่บางส่วน และคุณไม่จำเป็นต้องรีบเปลี่ยนมัน';
  if(mood==='mixed') return 'ความรู้สึกหลายอย่างสามารถอยู่ร่วมกันได้ โดยไม่ต้องเลือกอย่างใดอย่างหนึ่ง';
  return 'บางความรู้สึกก็ไม่จำเป็นต้องมีชื่อเรียกที่ชัดเจน';
}
function fallbackTitle(input, mood) {
  if(/ผิดหวัง/.test(input)) return 'รอยจางของความคาดหวัง';
  if(/สอบผ่าน/.test(input) && /ดีใจ|สุข/.test(input)) return 'จังหวะของความสำเร็จ';
  if(/พัก/.test(input)) return 'พักระหว่างบรรทัด';
  if(/เหนื่อย/.test(input) && /ภูมิใจ/.test(input)) return 'น้ำหนักของความพยายาม';
  if(/เหนื่อย/.test(input) && /ดีใจ/.test(input)) return 'สองจังหวะในวันเดียว';
  if(mood==='positive') return 'แสงที่ค่อย ๆ เปิด';
  if(mood==='negative') return 'พื้นที่ของความเงียบ';
  return 'ระหว่างความรู้สึก';
}
const ABSTRACT_BY_FAMILY = {
  'gentle-veil':'แผ่นแสงโปร่งบางซ้อนกัน มีพื้นที่ว่างและจังหวะเคลื่อนไหวช้า',
  'solar-silk':'ริ้วแสงสีอุ่นไหลเป็นชั้นอย่างโปร่งเบา แล้วค่อย ๆ แผ่ออก',
  'mist-dissolve':'ชั้นสีหม่นโปร่งทึบค่อย ๆ ละลายเป็นพื้นผิวเนื้อนุ่ม',
  'burn-fracture':'ริ้วสีเข้มตัดกับแสงร้อน แตกตัวเป็นเส้นคมและมีแรงปะทะ',
  'nervous-haze':'ชั้นเงาจางที่สั่นไม่สม่ำเสมอ และพื้นที่ว่างที่ไม่สมดุล',
  'granular-liquid':'พื้นผิวเม็ดละเอียดไหลอย่างหนืดและซ้อนเป็นชั้น',
  'radiant-bloom':'แสงนามธรรมกระจายจากจุดเล็กเป็นวง ก่อนค่อย ๆ ลดความเข้ม',
  'forward-tension':'เส้นแสงยืดตัวไปในทิศทางเดียวกันอย่างมีแรงดึง'
};
function accepted(modelOutput, input, kind) {
  const value=clean(modelOutput);
  if(!safeBasic(input,value)) return false;
  if(kind==='interpretation') {
    if(/^(ฉัน|ดีใจที่ได้ยิน|ขอให้|อย่าลืม)/.test(value)) return false;
    if(/สำหรับทุกคน|เป็นสิ่งจำเป็นสำหรับทุกคน|ในชีวิตประจำวัน/.test(value)) return false;
    return true;
  }
  if(kind==='reflectionMessage') {
    if(value.length>180 || containsAny(value,PATRONIZING_OR_CERTAIN)) return false;
    if(/ในอนาคต|สำคัญสำหรับทุกคน|พัฒนาตัวเอง|ชีวิตก็มี|ให้เรียนรู้และเติบโต|นำไปสู่การเรียนรู้|มองในแง่ดี|โอกาสใหม่|เป็นบทเรียน/.test(value)) return false;
    return true;
  }
  return true;
}

/** Returns sanitized model fields, provenance, and conservative UI fallbacks. */
export function refinePathummaFields(inputText, mood, pathummaRaw={}) {
  const input=clean(inputText);
  const raw=pathummaRaw && typeof pathummaRaw==='object' && !Array.isArray(pathummaRaw) ? pathummaRaw : {};
  const cues=explicitCues(input);
  const rest=ambiguousRest(input,cues);
  const fieldSources={};
  const modelPrimary=normalizeEmotion(raw.primaryEmotion);
  // Reject unsupported high-confidence stories when the user wrote too little
  // or the LLM's sentiment conflicts with S-Sense and has no text evidence.
  // Do not reject genuine mixed-emotion sentences (both sides have cues).
  const lowContext=lowContextWithoutEvidence(input,cues);
  const oppositeWithoutEvidence=contradictsGroundedMood(modelPrimary,mood,cues);
  const unsafeModelNarrative=lowContext || oppositeWithoutEvidence;
  const primaryValid=ACCEPTED_LABELS.has(modelPrimary) && !rest &&
    !unsafeModelNarrative && (cues.length===0 || sameCluster(modelPrimary,cues));
  const primaryEmotion=primaryValid ? modelPrimary : (cues[0] || 'uncertain');
  fieldSources.primaryEmotion=primaryValid ? 'pathumma' : cues.length ? 'text-cue' : 'local-fallback';

  const modelSecondary=normalizeEmotion(raw.secondaryEmotion);
  // A secondary emotion needs its *own* evidence. A generic negative label
  // must not replace an explicitly written feeling such as fatigue.
  const secondaryEvidence=cues.includes(modelSecondary) ||
    (modelSecondary==='pride' && /สอบผ่าน|ทำสำเร็จ|ประสบความสำเร็จ/.test(input));
  const secondaryValid=primaryEmotion!=='uncertain' && !unsafeModelNarrative &&
    !rest && ACCEPTED_LABELS.has(modelSecondary) &&
    modelSecondary!==primaryEmotion && secondaryEvidence;
  // If Pathumma missed a second *explicit* emotion, recover it from text cues.
  // No guesses from broad emotion clusters.
  const alternateCue=cues.find(label=>label!==primaryEmotion);
  const secondaryEmotion=secondaryValid ? modelSecondary : (alternateCue || 'none');
  fieldSources.secondaryEmotion=secondaryValid ? 'pathumma' :
    alternateCue ? 'text-cue' : 'local-fallback';

  const primaryPolarity=POSITIVE_FAMILY.has(primaryEmotion) ? 'positive' :
    NEGATIVE_FAMILY.has(primaryEmotion) ? 'negative' : 'unknown';
  const secondaryPolarity=POSITIVE_FAMILY.has(secondaryEmotion) ? 'positive' :
    NEGATIVE_FAMILY.has(secondaryEmotion) ? 'negative' : 'unknown';
  // Relationship is deterministic when explicit evidence is available.
  // Pathumma cannot say 'aligned' for contradictory joy+fatigue.
  const relationship=primaryEmotion==='uncertain' ? 'uncertain' :
    secondaryEmotion==='none' ? 'aligned' :
    primaryPolarity!=='unknown' && secondaryPolarity!=='unknown'
      ? (primaryPolarity===secondaryPolarity ? 'aligned' : 'mixed') : 'uncertain';
  fieldSources.relationship = fieldSources.primaryEmotion==='pathumma' &&
    (secondaryEmotion==='none' || fieldSources.secondaryEmotion==='pathumma') &&
    relationship===lower(raw.relationship) ? 'pathumma' : 'local-fallback';

  const rawInterpretation=clean(raw.interpretation);
  const goodInterpretation=!unsafeModelNarrative && accepted(rawInterpretation,input,'interpretation');
  const interpretation=goodInterpretation ? rawInterpretation : fallbackInterpretation(input,mood);
  fieldSources.interpretation=goodInterpretation ? 'pathumma' : 'local-fallback';

  const rawReflection=clean(raw.reflectionMessage);
  const goodReflection=!unsafeModelNarrative && accepted(rawReflection,input,'reflectionMessage');
  const reflectionMessage=goodReflection ? rawReflection : fallbackReflection(input,mood);
  fieldSources.reflectionMessage=goodReflection ? 'pathumma' : 'local-fallback';

  const rawMetaphor=clean(raw.visualMetaphor);
  const goodMetaphor=!unsafeModelNarrative && safeBasic(input,rawMetaphor) && rawMetaphor.length<=180 &&
    !containsAny(rawMetaphor,SCENE_TERMS) &&
    /แสง|สี|เส้น|รูปทรง|พื้นผิว|โปร่ง|ทึบ|ชั้น|หมอก|เงา|จังหวะ|พื้นที่ว่าง|ริ้ว|เกรน|layer|light|gradient|texture/i.test(rawMetaphor);
  const visualMetaphor=goodMetaphor ? rawMetaphor : '';
  fieldSources.visualMetaphor=goodMetaphor ? 'pathumma' : 'local-fallback';

  const rawTitle=clean(raw.artworkTitle);
  const goodTitle=!unsafeModelNarrative && rawTitle.length>=3 && rawTitle.length<=65 &&
    !['untitled emotion','untitled','none'].includes(rawTitle.toLowerCase()) &&
    !containsAny(rawTitle,SCENE_TERMS) && !containsAny(rawTitle,ECHO_PHRASES) &&
    !containsUnsupported(input,rawTitle) &&
    !(mood==='negative' && /หวัง|ชัยชนะ|ความสำเร็จ/.test(rawTitle) && !/ความหวัง|มีหวัง|หวังว่า|ยังมีหวัง|ชัยชนะ|สำเร็จ/.test(input));
  const artworkTitle=goodTitle ? rawTitle : fallbackTitle(input,mood);
  fieldSources.artworkTitle=goodTitle ? 'pathumma' : 'local-fallback';

  const modelForMapping={
    primaryEmotion,secondaryEmotion,relationship,
    interpretation,reflectionMessage,visualMetaphor,artworkTitle
  };
  const acceptedModelFields=['primaryEmotion','secondaryEmotion','interpretation','reflectionMessage','visualMetaphor','artworkTitle']
    .filter(field=>fieldSources[field]==='pathumma');
  return {
    modelForMapping, fieldSources,
    acceptedModelFields,
    expressionCue:expressionCueFor(input,primaryEmotion),
    completeWithFamily(visualFamily) {
      const metaphor=visualMetaphor || ABSTRACT_BY_FAMILY[visualFamily] || ABSTRACT_BY_FAMILY['gentle-veil'];
      return {
        interpretation,reflectionMessage,visualMetaphor:metaphor,artworkTitle,
        reflectionSource:fieldSources.reflectionMessage,
        fieldSources:{...fieldSources}
      };
    }
  };
}
