import { mapEmotion } from "./emotionMapping.mjs";
import { fuseAnalyses } from "./pathummaFusion.mjs";

// These are *art-direction settings*, NOT measured psychological scores.
// Labels remain open-ended: an unknown label simply falls back to the base mood.
const TRAITS = {
  joy:            { valence: 0.9, arousal: 0.85, tension: 0.10, warmth: 0.90 },
  pride:          { valence: 0.7, arousal: 0.55, tension: 0.35, warmth: 0.55 },
  fatigue:        { valence:-0.4, arousal: 0.12, tension: 0.35, warmth:-0.30 },
  sadness:        { valence:-0.8, arousal: 0.18, tension: 0.45, warmth:-0.50 },
  disappointment: { valence:-0.7, arousal: 0.30, tension: 0.60, warmth:-0.40 },
  anxiety:        { valence:-0.7, arousal: 0.85, tension: 0.95, warmth:-0.35 },
  calmness:       { valence: 0.4, arousal: 0.12, tension: 0.08, warmth: 0.25 },
  nostalgia:      { valence: 0.0, arousal: 0.25, tension: 0.35, warmth: 0.15 },
  melancholy:     { valence:-0.5, arousal: 0.20, tension: 0.35, warmth:-0.20 },
  // Extension 2026-11-16: illustrative artistic values, not AI measurements
  relief:         { valence: 0.45, arousal: 0.15, tension: 0.07, warmth: 0.38 },
  hope:           { valence: 0.65, arousal: 0.45, tension: 0.18, warmth: 0.60 },
  trust:          { valence: 0.55, arousal: 0.22, tension: 0.12, warmth: 0.48 },
  surprise:       { valence: 0.20, arousal: 0.90, tension: 0.40, warmth: 0.30 },
  anticipation:   { valence: 0.30, arousal: 0.70, tension: 0.55, warmth: 0.38 },
  anger:          { valence:-0.85, arousal: 0.92, tension: 0.98, warmth: 0.85 },
  fear:           { valence:-0.80, arousal: 0.88, tension: 0.90, warmth:-0.55 },
  disgust:        { valence:-0.78, arousal: 0.56, tension: 0.88, warmth:-0.28 },
  excitement:     { valence: 0.85, arousal: 0.96, tension: 0.24, warmth: 0.75 },
  satisfaction:   { valence: 0.70, arousal: 0.35, tension: 0.12, warmth: 0.55 },
  frustration:    { valence:-0.68, arousal: 0.80, tension: 0.88, warmth: 0.48 },
  determination:  { valence: 0.28, arousal: 0.62, tension: 0.62, warmth: 0.32 }
};

const BASE_DIMENSIONS = {
  positive: { valence: 0.65, arousal: 0.60, tension: 0.15, warmth: 0.55 },
  negative: { valence:-0.65, arousal: 0.30, tension: 0.60, warmth:-0.45 },
  mixed:    { valence: 0.00, arousal: 0.40, tension: 0.45, warmth: 0.00 },
  neutral:  { valence: 0.00, arousal: 0.25, tension: 0.15, warmth: 0.00 }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = (value, digits = 2) => Number(value.toFixed(digits));

function computeDimensions(fusion) {
  const fallback = BASE_DIMENSIONS[fusion.fusedMood] ?? BASE_DIMENSIONS.neutral;
  const labels = [fusion.primaryEmotion, fusion.secondaryEmotion];
  const known = labels.map(label => TRAITS[label]).filter(Boolean);
  if (known.length === 0) return { ...fallback, source: "base-mood-fallback" };

  // If only one label is known, use it rather than treating unknown words as zero.
  const weights = known.length === 2 ? [0.6, 0.4] : [1];
  const dimensions = {};
  for (const key of ["valence", "arousal", "tension", "warmth"]) {
    dimensions[key] = round(known.reduce((sum, trait, i) => sum + trait[key] * weights[i], 0));
  }
  return { ...dimensions, source: "emotion-traits" };
}

// Rotate RGB color hue without assuming each possible emotion has its own theme.
function shiftHue(hex, degrees) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const number = parseInt(match[1], 16);
  const rgb = [(number >> 16) & 255, (number >> 8) & 255, number & 255];
  const [r, g, b] = rgb.map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  const light = (max + min) / 2;
  let saturation = 0;
  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * light - 1));
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
  }
  hue = ((hue + degrees) % 360 + 360) % 360;
  const c = (1 - Math.abs(2 * light - 1)) * saturation;
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = light - c / 2;
  const sector = Math.floor(hue / 60);
  const components = [
    [c, x, 0], [x, c, 0], [0, c, x],
    [0, x, c], [x, 0, c], [c, 0, x]
  ][sector];
  return "#" + components.map(v => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function mapEmotionV2(ssenseRaw, pathummaParsed) {
  // Retain all v1 contract fields and trust v1 for base theme and mood.
  const v1 = mapEmotion(ssenseRaw);
  const fusion = fuseAnalyses(v1.analysis, pathummaParsed);
  const d = computeDimensions(fusion);
  const base = v1.visual;

  const visual = {
    ...base,
    palette: base.palette.map((color, index) =>
      shiftHue(color, round(d.warmth * 25 + d.arousal * 7 + index * d.tension * 5, 1))
    ),
    blur: Math.round(clamp(base.blur + (0.45 - d.arousal) * 9, 8, 30)),
    flowSpeed: round(clamp(base.flowSpeed + (d.arousal - 0.4) * 0.38, 0.1, 0.95)),
    fontWeight: Math.round(clamp(base.fontWeight + (d.tension - 0.4) * 75, 250, 650)),
    distortion: round(clamp(base.distortion + (d.tension - 0.4) * 0.16, 0, 0.35)),
    // Additive fields: frontend may choose to use these later.
    composition: fusion.relationship === "mixed" ? "layered" : "flowing",
    artDirection: fusion.artworkTitle
  };

  return {
    ...v1,
    analysis: {
      ...v1.analysis,
      // mood remains identical to v1 for compatibility
      primaryEmotion: fusion.primaryEmotion,
      secondaryEmotion: fusion.secondaryEmotion,
      relationship: fusion.relationship,
      interpretation: fusion.interpretation,
      visualMetaphor: fusion.visualMetaphor,
      artworkTitle: fusion.artworkTitle
    },
    emotionProfile: {
      valence: d.valence,
      arousal: d.arousal,
      tension: d.tension,
      warmth: d.warmth,
      source: d.source
    },
    visual
  };
}
