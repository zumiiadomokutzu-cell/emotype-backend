import assert from 'node:assert/strict';
import { applyEmotionArtPalette } from './emotionArtPaletteV1.mjs';
import { attachVisualFamily } from './visualFamilyMapping.mjs';

const oldPalette = ['#4A2455', '#8B54A0', '#9B82C0'];
const samples = [
  { name:'anger', primaryEmotion:'anger', expected:'burn-fracture' },
  { name:'sadness', primaryEmotion:'sadness', expected:'mist-dissolve' },
  { name:'joy', primaryEmotion:'joy', expected:'solar-silk' },
  { name:'relief', primaryEmotion:'relief', expected:'gentle-veil' },
];
let n=0;
function pass(name,fn) {fn();n++;console.log(`PASS ${n}: ${name}`);}
const attached = samples.map(s=>({
  ...s,
  result: attachVisualFamily({analysis:{primaryEmotion:s.primaryEmotion,secondaryEmotion:'none',relationship:'aligned',mood:s.primaryEmotion==='joy'?'positive':'negative'}, visual:{palette:[...oldPalette],blur:20,style:'aurora-typography'}})
}));
for(const item of attached) {
  pass(`${item.name} family recognized`,()=>assert.equal(item.result.visual.visualFamily,item.expected));
}
const angry=attached[0].result.visual;
const newAngry=applyEmotionArtPalette(angry);
pass('anger palette now warm/red instead of violet',()=>assert.deepEqual(newAngry.palette,['#290A13','#B62432','#FF613F']));
pass('anger artwork has separate type color roles',()=>assert.deepEqual(Object.keys(newAngry.artColors).sort(),['canvas','fineLine','fractureShadow','glow','textAccent','textPrimary'].sort()));
pass('anger existing family and render hints preserved',()=>{assert.equal(newAngry.visualFamily,'burn-fracture');assert.equal(newAngry.shaderPreset,angry.shaderPreset);assert.deepEqual(newAngry.renderHints,angry.renderHints);});
pass('anger source object is not mutated',()=>{assert.deepEqual(angry.palette,oldPalette);assert.equal(angry.artColors,undefined)});
pass('legacy visual.style preserved',()=>assert.equal(newAngry.style,'aurora-typography'));
for(const item of attached.slice(1)) {
  pass(`${item.name} palette unchanged`,()=>assert.deepEqual(applyEmotionArtPalette(item.result.visual).palette,oldPalette));
}
pass('mixed anger remains burn-fracture and red',()=>{
  const mixed=attachVisualFamily({analysis:{primaryEmotion:'anger',secondaryEmotion:'anxiety',relationship:'mixed',mood:'mixed'},visual:{palette:[...oldPalette]}});
  const colored=applyEmotionArtPalette(mixed.visual);
  assert.equal(colored.secondaryFamily,'nervous-haze');
  assert.equal(colored.blendMode,'dual-layer-contrast');
  assert.equal(colored.palette[1],'#B62432');
});
pass('unknown family untouched',()=>{const v={palette:[...oldPalette],visualFamily:'custom'};assert.equal(applyEmotionArtPalette(v),v)});
pass('invalid visual rejected safely',()=>assert.throws(()=>applyEmotionArtPalette(null),TypeError));
console.log(`\nSUMMARY: ${n}/${n} art palette tests passed`);
