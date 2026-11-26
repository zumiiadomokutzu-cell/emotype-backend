import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { mapEmotion } from './emotionMapping.mjs';
import { mapEmotionV3 } from './emotionMappingV3.mjs';
import { analyzeWithPathumma } from './pathummaClient.mjs';
import { refinePathummaFields, applyExpressionArtHints } from './qualityFieldGuardV2.mjs';
import { applyEmotionArtPalette } from './emotionArtPaletteV1.mjs';

// Development-only, separate entrypoint. Does not change serverHybrid.mjs.
const app=express();
/*const allowedOrigins=new Set([
  'http://localhost:5173','http://127.0.0.1:5173',
  'http://localhost:5174','http://127.0.0.1:5174'
]);
app.use(cors({ origin(origin,cb) {
  if(!origin || allowedOrigins.has(origin)) return cb(null,true);
  cb(new Error('Origin not allowed'));
}}));*/
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGINS || [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174'
  ].join(','))
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed'));
  }
}));
app.use(express.json({limit:'10kb'}));

app.get('/api/health',(_req,res)=>res.json({
  success:true,service:'emotype',version:'quality-v4-grounding-v2-art-palette-v1',
  features:['reflectionMessage','visualFamily','fieldSources','field-wise-fallback','emotion-grounding-v2','anger-art-palette-v1']
}));

app.post('/api/generate',async (req,res)=>{
  const text=req.body?.text;
  if(typeof text!=='string' || !text.trim() || text.length>200) {
    return res.status(400).json({success:false,error:'Text must be 1-200 characters.'});
  }
  if(!process.env.AIFORTHAI_API_KEY) {
    return res.status(503).json({success:false,error:'AI4Thai key not configured.'});
  }
  const input=text.trim();
  let ssenseRaw, base;
  try {
    const url=new URL('https://api.aiforthai.in.th/ssense');
    url.searchParams.set('text',input);
    const response=await fetch(url,{
      headers:{Apikey:process.env.AIFORTHAI_API_KEY},
      signal:AbortSignal.timeout(15000)
    });
    if(!response.ok) throw new Error(`S-Sense HTTP ${response.status}`);
    ssenseRaw=await response.json();
    base=mapEmotion(ssenseRaw);
  } catch(error) {
    console.error('S-Sense failed:',error.message);
    return res.status(502).json({success:false,error:'S-Sense analysis failed.'});
  }

  let rawPathumma={}, pathummaAvailable=false;
  try {
    rawPathumma=await analyzeWithPathumma(input);
    if(rawPathumma && typeof rawPathumma==='object' && !Array.isArray(rawPathumma)) {
      pathummaAvailable=true;
    }
  } catch(error) {
    // Failure is not fatal: S-Sense and the v3 art contract remain available.
    console.warn('Pathumma unavailable:',error.message);
  }

  try {
    const quality=refinePathummaFields(input,base.analysis.mood,rawPathumma);
    const enriched=mapEmotionV3(ssenseRaw,quality.modelForMapping);
    const presentation=quality.completeWithFamily(enriched.visual.visualFamily);
    const visual=applyEmotionArtPalette(applyExpressionArtHints(enriched.visual,quality.expressionCue));
    const hasUsefulModelOutput=pathummaAvailable && quality.acceptedModelFields.length>0;
    const mode=hasUsefulModelOutput ? 'hybrid' : 'ssense-only';
    return res.json({
      success:true,mode,...enriched,
      analysis:{
        ...enriched.analysis,
        interpretation:presentation.interpretation,
        visualMetaphor:presentation.visualMetaphor,
        artworkTitle:presentation.artworkTitle,
        reflectionMessage:presentation.reflectionMessage,
        reflectionSource:presentation.reflectionSource,
        fieldSources:presentation.fieldSources,
        expressionCue:quality.expressionCue
      },
      visual:{...visual,artDirection:presentation.artworkTitle}
    });
  } catch(error) {
    console.error('Quality mapping failed:',error.message);
    return res.status(500).json({success:false,error:'Emotion mapping failed.'});
  }
});

const PORT=Number(process.env.PORT)||3001;
app.listen(PORT,()=>console.log(`EMOTYPE Grounding v2 + Art Palette v1: http://localhost:${PORT}`));
