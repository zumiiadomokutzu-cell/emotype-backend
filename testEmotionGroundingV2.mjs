import assert from 'node:assert/strict';
import { refinePathummaFields, expressionCueFor, applyExpressionArtHints } from './qualityFieldGuardV2.mjs';

let passed=0;
function check(name,fn) {fn();passed++;console.log(`PASS: ${name}`);}
const run=(text,mood,pathumma)=>refinePathummaFields(text,mood,pathumma);
const invalidMixed={
  primaryEmotion:'joy', secondaryEmotion:'disappointment', relationship:'mixed',
  interpretation:'แม้จะมีความผิดหวังบ้างแต่ก็ยังคงรู้สึกดีใจ',
  reflectionMessage:'เหนื่อยแต่ดีใจที่ทำสำเร็จ',
  visualMetaphor:'ริ้วสีอ่อนละลายทับกันในพื้นที่ว่าง',
  artworkTitle:'ความสำเร็จภายใต้สายฝน'
};
const text='วันนี้เหนื่อยมาก แต่ดีใจที่ทำสำเร็จ';
const mixed=run(text,'mixed',invalidMixed);
check('Real mixed bug: unsupported disappointment removed',()=>{
  assert.equal(mixed.modelForMapping.primaryEmotion,'joy');
  assert.notEqual(mixed.modelForMapping.secondaryEmotion,'disappointment');
});
check('Real mixed bug: fatigue recovered from original text',()=>{
  assert.equal(mixed.modelForMapping.secondaryEmotion,'fatigue');
  assert.equal(mixed.fieldSources.secondaryEmotion,'text-cue');
});
check('Mixed relationship remains mixed after repair',()=>{
  assert.equal(mixed.modelForMapping.relationship,'mixed');
  assert.equal(mixed.fieldSources.relationship,'local-fallback');
});
check('Interpretation mentioning hallucinated disappointment rejected',()=>{
  assert.equal(mixed.fieldSources.interpretation,'local-fallback');
  assert.ok(!mixed.modelForMapping.interpretation.includes('ผิดหวัง'));
});
check('Reasonable original reflection can still be preserved',()=>{
  assert.equal(mixed.fieldSources.reflectionMessage,'pathumma');
});
check('Direct joy+fatigue both from Pathumma stay intact',()=>{
  const r=run(text,'mixed',{
    primaryEmotion:'joy',secondaryEmotion:'fatigue',relationship:'mixed',
    interpretation:'มีทั้งความเหนื่อยและความดีใจจากความสำเร็จ'
  });
  assert.equal(r.modelForMapping.secondaryEmotion,'fatigue');
  assert.equal(r.fieldSources.secondaryEmotion,'pathumma');
  assert.equal(r.modelForMapping.relationship,'mixed');
  assert.equal(r.fieldSources.relationship,'pathumma');
});
check('Unrelated secondary sadness is rejected for explicit joy',()=>{
  const r=run('วันนี้ดีใจมาก','positive',{
    primaryEmotion:'joy',secondaryEmotion:'sadness', relationship:'mixed'
  });
  assert.equal(r.modelForMapping.secondaryEmotion,'none');
  assert.equal(r.modelForMapping.relationship,'aligned');
});
check('Secondary pride can be inferred for completed exam',()=>{
  const r=run('วันนี้ดีใจมากที่สอบผ่าน','positive',{
    primaryEmotion:'joy',secondaryEmotion:'pride',relationship:'aligned'
  });
  assert.equal(r.modelForMapping.secondaryEmotion,'pride');
  assert.equal(r.fieldSources.secondaryEmotion,'pathumma');
});
check('Expressive short interjection stays uncertain',()=>{
  const r=run('โว้ย','neutral',{
    primaryEmotion:'anger',relationship:'uncertain',interpretation:'ผู้ใช้โกรธรุนแรง'
  });
  assert.equal(r.modelForMapping.primaryEmotion,'uncertain');
  assert.equal(r.modelForMapping.relationship,'uncertain');
  assert.equal(r.fieldSources.relationship,'local-fallback');
  assert.equal(r.expressionCue,'ambiguous-expressive');
});
check('Ambiguous short yell has expressiveness without fake emotion',()=>{
  const r=run('อ้าก','neutral',{});
  assert.equal(r.modelForMapping.primaryEmotion,'uncertain');
  assert.equal(r.expressionCue,'ambiguous-expressive');
});
check('Ellipsis stays quiet neutral, not expressive',()=>{
  const r=run('...','neutral',{});
  assert.equal(r.expressionCue,'none');
  assert.equal(r.modelForMapping.primaryEmotion,'uncertain');
});
check('Explicit anger does not become ambiguous',()=>{
  const r=run('วันนี้โกรธมาก','negative',{primaryEmotion:'anger',relationship:'aligned'});
  assert.equal(r.modelForMapping.primaryEmotion,'anger');
  assert.equal(r.expressionCue,'none');
});
check('Expression art modifier is additive and accessible',()=>{
  const v={visualFamily:'gentle-veil',flowSpeed:0.19,distortion:0,modifiers:[],renderHints:{jitter:0,grain:0.03,fracture:0.01}, accessibility:{reducedMotionSupported:true,flashFree:true,thaiTextMustRemainReadable:true}};
  const changed=applyExpressionArtHints(v,'ambiguous-expressive');
  assert.equal(changed.visualFamily,'gentle-veil');
  assert.equal(changed.expressionModifier,'ambiguous-expressive');
  assert.equal(changed.renderHints.jitter,0.3);
  assert.ok(changed.flowSpeed>v.flowSpeed);
  assert.deepEqual(v.modifiers,[]);
  assert.equal(changed.accessibility.thaiTextMustRemainReadable,true);
});
check('Without expression cue visuals are unchanged',()=>{
  const v={visualFamily:'gentle-veil',renderHints:{jitter:0}};
  assert.equal(applyExpressionArtHints(v,'none'),v);
});
check('Uncertain is never incorrectly tagged Pathumma relationship',()=>{
  const r=run('โว้ย','neutral',{primaryEmotion:'uncertain',relationship:'uncertain'});
  assert.equal(r.fieldSources.relationship,'local-fallback');
  assert.equal(r.acceptedModelFields.length,0);
});
check('Unknown short negative remains conservative; no fake joy or anger',()=>{
  const r=run('สาส','negative',{
    primaryEmotion:'joy',secondaryEmotion:'anger',relationship:'mixed',
    interpretation:'ดีใจที่ได้รับของขวัญ',reflectionMessage:'ดีใจมากกับของขวัญ'
  });
  assert.equal(r.modelForMapping.primaryEmotion,'uncertain');
  assert.equal(r.modelForMapping.secondaryEmotion,'none');
  assert.equal(r.fieldSources.interpretation,'local-fallback');
});
check('Directly disappointed text can keep disappointment',()=>{
  const r=run('วันนี้ผิดหวังมาก','negative',{
    primaryEmotion:'disappointment',secondaryEmotion:'none',relationship:'aligned'
  });
  assert.equal(r.modelForMapping.primaryEmotion,'disappointment');
});
check('Fabricated secondary emotion contaminating reflection is rejected',()=>{
  const r=run(text,'mixed',{
    primaryEmotion:'joy',secondaryEmotion:'disappointment', relationship:'mixed',
    reflectionMessage:'ความผิดหวังบางครั้งเป็นบทเรียน'
  });
  assert.equal(r.fieldSources.reflectionMessage,'local-fallback');
});
check('Clear neutral request stays non-expressive',()=>{
  const r=run('ขอพักหน่อยนะ','neutral',{primaryEmotion:'relief'});
  assert.equal(r.expressionCue,'none');
  assert.equal(r.modelForMapping.primaryEmotion,'uncertain');
});
check('Short positive affirmation does not gain invented grief',()=>{
  const r=run('ดีใจมาก','positive',{
    primaryEmotion:'joy',secondaryEmotion:'grief',relationship:'mixed'
  });
  assert.equal(r.modelForMapping.secondaryEmotion,'none');
});
console.log(`\nSUMMARY: ${passed}/20 grounding v2 regression tests passed`);
