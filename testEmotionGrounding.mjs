import assert from 'node:assert/strict';
import { refinePathummaFields } from './qualityFieldGuard.mjs';

// Integration tests for the actual wrong response observed from the React Network tab.
let count=0;
function check(name, fn) { fn(); count++; console.log('PASS:',name); }
const q=(text,mood,raw={})=>refinePathummaFields(text,mood,raw);

const wrongGift={
  primaryEmotion:'joy',secondaryEmotion:'none',relationship:'aligned',
  interpretation:'ความสุขจากการได้รับของขวัญ',
  visualMetaphor:'ริ้วแสงสีอุ่นไหลเป็นชั้นอย่างโปร่งเบา แล้วค่อย ๆ แผ่ออก',
  artworkTitle:'ความสุข',
  reflectionMessage:'ยิ้มแฉ่งเมื่อได้รับของขวัญที่ชอบ'
};
const corrected=q('สาส','negative',wrongGift);
check('Real bug: vague insult does not become joy',()=>{
  assert.equal(corrected.modelForMapping.primaryEmotion,'uncertain');
  assert.equal(corrected.fieldSources.primaryEmotion,'local-fallback');
});
check('Real bug: fabricated gift story is not displayed',()=>{
  assert.ok(!corrected.modelForMapping.interpretation.includes('ของขวัญ'));
  assert.ok(!corrected.modelForMapping.reflectionMessage.includes('ของขวัญ'));
  assert.ok(!corrected.modelForMapping.artworkTitle.includes('ความสุข'));
  assert.equal(corrected.fieldSources.interpretation,'local-fallback');
  assert.equal(corrected.fieldSources.reflectionMessage,'local-fallback');
  assert.equal(corrected.fieldSources.artworkTitle,'local-fallback');
});
check('Real bug: invalid primary cannot pass abstract metaphor through',()=>{
  assert.equal(corrected.fieldSources.visualMetaphor,'local-fallback');
  assert.equal(corrected.acceptedModelFields.length,0);
});
check('A negative cue without enough context is NOT forced to anger',()=>{
  const r=q('สาส','negative',{primaryEmotion:'anger',interpretation:'ข้อความนี้แสดงความโกรธอย่างรุนแรง'});
  assert.equal(r.modelForMapping.primaryEmotion,'uncertain');
  assert.equal(r.fieldSources.interpretation,'local-fallback');
});
check('Longer negative text with no positive cues rejects fabricated joy',()=>{
  const r=q('วันนี้ทุกอย่างแย่มาก','negative',{primaryEmotion:'joy',interpretation:'มีความสุขมาก'});
  assert.equal(r.modelForMapping.primaryEmotion,'uncertain');
  assert.equal(r.fieldSources.interpretation,'local-fallback');
});
check('Clear angry sentence still accepts anger',()=>{
  const r=q('วันนี้โกรธมาก','negative',{primaryEmotion:'anger',interpretation:'ข้อความนี้สื่อถึงความโกรธ'});
  assert.equal(r.modelForMapping.primaryEmotion,'anger');
  assert.equal(r.fieldSources.primaryEmotion,'pathumma');
});
check('Clear joy still accepts joy',()=>{
  const r=q('วันนี้ดีใจที่สอบผ่าน','positive',{primaryEmotion:'joy',interpretation:'ข้อความนี้สื่อถึงความดีใจ'});
  assert.equal(r.modelForMapping.primaryEmotion,'joy');
});
check('Genuine mixed emotion retains both joy and fatigue',()=>{
  const r=q('วันนี้เหนื่อยมาก แต่ดีใจที่ทำงานสำเร็จ','mixed',{
    primaryEmotion:'joy',secondaryEmotion:'fatigue',relationship:'mixed',
    interpretation:'มีทั้งความเหนื่อยและดีใจที่ทำสำเร็จ'
  });
  assert.equal(r.modelForMapping.primaryEmotion,'joy');
  assert.equal(r.modelForMapping.secondaryEmotion,'fatigue');
  assert.equal(r.modelForMapping.relationship,'mixed');
});
check('Contrary S-Sense mood with explicit positive text is not auto-rejected',()=>{
  const r=q('วันนี้เหนื่อยมากแต่ดีใจที่ทำสำเร็จ','negative',{
    primaryEmotion:'joy',secondaryEmotion:'fatigue',relationship:'mixed',
    interpretation:'ข้อความระบุทั้งความเหนื่อยและดีใจ'
  });
  assert.equal(r.modelForMapping.primaryEmotion,'joy');
  assert.equal(r.modelForMapping.secondaryEmotion,'fatigue');
});
check('Genuinely gifted and happy message can still mention gift',()=>{
  const r=q('ดีใจมากที่ได้รับของขวัญ','positive',{
    primaryEmotion:'joy',interpretation:'ดีใจที่ได้รับของขวัญนี้',
    reflectionMessage:'ของขวัญนี้ทำให้คุณดีใจ'
  });
  assert.equal(r.modelForMapping.primaryEmotion,'joy');
  assert.equal(r.fieldSources.interpretation,'pathumma');
});
check('Conflicting primary does not corrupt relationship or UI output',()=>{
  assert.equal(corrected.modelForMapping.relationship,'uncertain');
  const p=corrected.completeWithFamily('mist-dissolve');
  assert.ok(p.artworkTitle.length>0);
  assert.equal(p.fieldSources.visualMetaphor,'local-fallback');
  assert.ok(p.visualMetaphor.includes('ชั้นสี'));
});
check('Unrelated short neutral input stays uncertain',()=>{
  const r=q('...', 'neutral',{primaryEmotion:'joy',interpretation:'วันนี้มีความสุขมาก'});
  assert.equal(r.modelForMapping.primaryEmotion,'uncertain');
  assert.equal(r.fieldSources.interpretation,'local-fallback');
});
console.log(`\nSUMMARY: ${count}/12 grounding regression tests passed`);
