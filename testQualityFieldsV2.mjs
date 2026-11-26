import assert from 'node:assert/strict';
import { refinePathummaFields } from './qualityFieldGuardV2.mjs';

const q=(text,mood,raw={})=>refinePathummaFields(text,mood,raw);
let passed=0;
function run(name, fn) {
  try { fn(); passed++; console.log('PASS:',name); }
  catch(err) { console.error('FAIL:',name,err.message); process.exitCode=1; }
}

run('Ambiguous rest: reject understanding label, fatigue claim, and copied tone',()=>{
 const r=q('ขอพักหน่อยนะ','neutral',{
  primaryEmotion:'ความเข้าใจ', secondaryEmotion:'none',relationship:'uncertain',
  interpretation:'คุณรู้สึกเหนื่อยล้าและต้องการพักผ่อน',
  reflectionMessage:'ฉันเข้าใจว่าคุณรู้สึกเหนื่อยล้าและต้องการพักผ่อน',
  visualMetaphor:'',artworkTitle:''
 });
 assert.equal(r.modelForMapping.primaryEmotion,'uncertain');
 assert.equal(r.fieldSources.interpretation,'local-fallback');
 assert.equal(r.fieldSources.reflectionMessage,'local-fallback');
 assert.equal(r.fieldSources.artworkTitle,'local-fallback');
 assert.equal(r.modelForMapping.artworkTitle,'พักระหว่างบรรทัด');
 assert.equal(r.acceptedModelFields.length,0);
});
run('Ambiguous rest: do not treat relief as proven emotion',()=>{
 const r=q('ขอพักหน่อยนะ','neutral',{primaryEmotion:'relief',reflectionMessage:'คุณสามารถพักได้สักครู่เพื่อให้เวลากับตัวเอง'});
 assert.equal(r.modelForMapping.primaryEmotion,'uncertain');
 assert.equal(r.fieldSources.primaryEmotion,'local-fallback');
});
run('Explicit relief is retained',()=>{
 const r=q('วันนี้รู้สึกโล่งใจมาก','positive',{primaryEmotion:'relief',reflectionMessage:'ความโล่งใจครั้งนี้คงมีความหมายกับคุณไม่น้อย'});
 assert.equal(r.modelForMapping.primaryEmotion,'relief');
 assert.equal(r.fieldSources.primaryEmotion,'pathumma');
});
run('Exam success: valid joy retained, empty art fields replaced',()=>{
 const r=q('วันนี้ดีใจมากที่สอบผ่าน','positive',{
  primaryEmotion:'joy',secondaryEmotion:'none',relationship:'aligned',
  interpretation:'ผู้ใช้ดีใจที่สอบผ่าน',
  reflectionMessage:'ดีใจด้วยกับการสอบผ่านครั้งนี้นะ',
  visualMetaphor:'',artworkTitle:''
 });
 assert.equal(r.modelForMapping.primaryEmotion,'joy');
 assert.equal(r.fieldSources.interpretation,'pathumma');
 assert.equal(r.fieldSources.reflectionMessage,'pathumma');
 const presentation=r.completeWithFamily('solar-silk');
 assert.ok(presentation.visualMetaphor.includes('ริ้วแสง'));
 assert.equal(presentation.artworkTitle,'จังหวะของความสำเร็จ');
});
run('Invented computer screen scene rejected, valid interpretation kept',()=>{
 const r=q('วันนี้ดีใจมากที่สอบผ่าน','positive',{
  primaryEmotion:'joy', interpretation:'ข้อความนี้แสดงความดีใจที่สอบผ่าน',
  visualMetaphor:'แสงสว่างบนหน้าจอคอมพิวเตอร์ของคุณ', artworkTitle:'ความสำเร็จ'
 });
 assert.equal(r.fieldSources.interpretation,'pathumma');
 assert.equal(r.fieldSources.visualMetaphor,'local-fallback');
 assert.equal(r.fieldSources.artworkTitle,'pathumma');
});
run('Disappointment: invented backstory, false hope title and pep talk rejected',()=>{
 const r=q('วันนี้ผิดหวังมาก','negative',{
  primaryEmotion:'disappointment',secondaryEmotion:'none',
  interpretation:'ผู้ใช้ผิดหวังหลังจากเหตุการณ์ที่ไม่คาดคิด',
  visualMetaphor:'แสงสว่างที่ปลายอุโมงค์',
  artworkTitle:'แสงแห่งความหวัง',
  reflectionMessage:'บางครั้งชีวิตก็มีความยากลำบาก แต่ยังมีสิ่งดีๆรออยู่ข้างหน้าเสมอ'
 });
 assert.equal(r.modelForMapping.primaryEmotion,'disappointment');
 for(const field of ['interpretation','visualMetaphor','artworkTitle','reflectionMessage']) {
  assert.equal(r.fieldSources[field],'local-fallback');
 }
 assert.equal(r.modelForMapping.artworkTitle,'รอยจางของความคาดหวัง');
});
run('Good abstract metaphor survives the quality gate',()=>{
 const r=q('วันนี้ผิดหวังมาก','negative',{
  primaryEmotion:'disappointment',
  visualMetaphor:'ชั้นสีน้ำเงินหม่นค่อย ๆ ละลายทับกันในพื้นที่ว่าง'
 });
 assert.equal(r.fieldSources.visualMetaphor,'pathumma');
});
run('Prompt echo rejected without discarding good emotion',()=>{
 const r=q('วันนี้ดีใจมากที่สอบผ่าน','positive',{
  primaryEmotion:'joy',
  reflectionMessage:'หากข้อความกำกวม ให้สะท้อนข้อความจากผู้ใช้'
 });
 assert.equal(r.fieldSources.primaryEmotion,'pathumma');
 assert.equal(r.fieldSources.reflectionMessage,'local-fallback');
});
run('Two mixed emotions are retained',()=>{
 const r=q('วันนี้เหนื่อยมาก แต่ดีใจที่ทำงานสำเร็จ','mixed',{
  primaryEmotion:'joy',secondaryEmotion:'fatigue',relationship:'mixed',
  interpretation:'วันนี้มีทั้งความเหนื่อยและความดีใจที่งานสำเร็จ'
 });
 assert.equal(r.modelForMapping.primaryEmotion,'joy');
 assert.equal(r.modelForMapping.secondaryEmotion,'fatigue');
 assert.equal(r.modelForMapping.relationship,'mixed');
});
run('Known text cue repairs unsupported emotion label',()=>{
 const r=q('วันนี้ผิดหวังมาก','negative',{
  primaryEmotion:'ความเข้าใจ',interpretation:'ข้อความนี้สื่อถึงความผิดหวัง'
 });
 assert.equal(r.modelForMapping.primaryEmotion,'disappointment');
 assert.equal(r.fieldSources.primaryEmotion,'text-cue');
 assert.equal(r.fieldSources.interpretation,'pathumma');
});
run('No Pathumma data still gives coherent local fields',()=>{
 const r=q('ข้อความสั้น ๆ','neutral',{});
 assert.equal(r.modelForMapping.primaryEmotion,'uncertain');
 assert.equal(r.acceptedModelFields.length,0);
 const p=r.completeWithFamily('gentle-veil');
 for(const f of ['interpretation','reflectionMessage','artworkTitle','visualMetaphor']) {
  assert.ok(p[f].length>0);
  assert.equal(p.fieldSources[f],'local-fallback');
 }
});
run('Old other-example leak is rejected',()=>{
 const r=q('วันนี้ผิดหวังมาก','negative',{
  primaryEmotion:'disappointment',interpretation:'ขอพักหน่อยนะ'
 });
 assert.equal(r.fieldSources.interpretation,'local-fallback');
});
run('Positive advice does not masquerade as grounded reflection',()=>{
 const r=q('วันนี้ดีใจมากที่สอบผ่าน','positive',{
  primaryEmotion:'joy',reflectionMessage:'อย่าลืมว่าการเรียนรู้และพัฒนาตัวเองสำคัญสำหรับทุกคน'
 });
 assert.equal(r.fieldSources.reflectionMessage,'local-fallback');
});
run('Unsupported award claim rejected only in its field',()=>{
 const r=q('วันนี้ดีใจมากที่สอบผ่าน','positive',{
  primaryEmotion:'joy',interpretation:'ได้รับรางวัลอันยิ่งใหญ่',
  reflectionMessage:'ดีใจด้วยกับการสอบผ่านครั้งนี้นะ'
 });
 assert.equal(r.fieldSources.interpretation,'local-fallback');
 assert.equal(r.fieldSources.reflectionMessage,'pathumma');
});

console.log(`\nSUMMARY: ${passed}/14 offline quality tests passed`);
if(passed!==14) process.exitCode=1;
