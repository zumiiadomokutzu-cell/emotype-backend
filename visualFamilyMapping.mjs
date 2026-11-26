// EMOTYPE - Visual Families v3 (pure post-processing over the v2 API)
// Values are art-direction presets, not diagnostic or psychological scores.
// All existing v2 fields remain intact.
export const VISUAL_FAMILIES = Object.freeze({
  "solar-silk": {
    shaderPreset: "luminous-silk-flow", motionPreset: "expanding-wave",
    typographyPreset: "airy-display", compositionPreset: "open-radiance",
    familyName: "Solar Silk",
    hints: { grain: 0.08, fracture: 0.03, jitter: 0.02, veil: 0.18, spread: 0.72, anchor: 0.25, direction: 0.28 }
  },
  "mist-dissolve": {
    shaderPreset: "diffused-mist-layers", motionPreset: "slow-dissolve",
    typographyPreset: "light-dissolving", compositionPreset: "descending-layers",
    familyName: "Mist & Dissolve",
    hints: { grain: 0.20, fracture: 0.02, jitter: 0.01, veil: 0.80, spread: 0.22, anchor: 0.35, direction: 0.12 }
  },
  "burn-fracture": {
    shaderPreset: "hot-fractured-fluid", motionPreset: "directional-rupture",
    typographyPreset: "angular-tension", compositionPreset: "fractured-convergence",
    familyName: "Burn Fracture",
    hints: { grain: 0.38, fracture: 0.90, jitter: 0.24, veil: 0.05, spread: 0.42, anchor: 0.68, direction: 0.82 }
  },
  "nervous-haze": {
    shaderPreset: "unstable-vignette-fluid", motionPreset: "uneasy-drift",
    typographyPreset: "controlled-offset", compositionPreset: "asymmetric-void",
    familyName: "Nervous Haze",
    hints: { grain: 0.24, fracture: 0.25, jitter: 0.66, veil: 0.58, spread: 0.17, anchor: 0.30, direction: 0.44 }
  },
  "gentle-veil": {
    shaderPreset: "translucent-soft-veils", motionPreset: "slow-breathing",
    typographyPreset: "balanced-air", compositionPreset: "spacious-center",
    familyName: "Gentle Veil",
    hints: { grain: 0.03, fracture: 0.01, jitter: 0.00, veil: 0.62, spread: 0.66, anchor: 0.53, direction: 0.10 }
  },
  "granular-liquid": {
    shaderPreset: "viscous-grain-folds", motionPreset: "resistant-flow",
    typographyPreset: "compressed-readable", compositionPreset: "folded-tension",
    familyName: "Granular Liquid",
    hints: { grain: 0.78, fracture: 0.23, jitter: 0.16, veil: 0.35, spread: 0.13, anchor: 0.58, direction: 0.17 }
  },
  "radiant-bloom": {
    shaderPreset: "radial-particle-bloom", motionPreset: "expand-and-decay",
    typographyPreset: "sudden-reveal", compositionPreset: "radial-opening",
    familyName: "Radiant Bloom",
    hints: { grain: 0.19, fracture: 0.18, jitter: 0.03, veil: 0.10, spread: 0.95, anchor: 0.40, direction: 0.67 }
  },
  "forward-tension": {
    shaderPreset: "converging-direction-lines", motionPreset: "forward-drift",
    typographyPreset: "purposeful-slant", compositionPreset: "directed-layers",
    familyName: "Forward Tension",
    hints: { grain: 0.12, fracture: 0.18, jitter: 0.06, veil: 0.15, spread: 0.42, anchor: 0.77, direction: 0.92 }
  }
});

// Open vocabulary: this is a lookup for renderer families, NOT a restriction
// on what Pathumma may analyze. Unknown labels fall back to the v2 mood.
const EMOTION_FAMILY = {
  joy:"solar-silk", happy:"solar-silk", happiness:"solar-silk",
  delight:"solar-silk", excitement:"solar-silk", satisfaction:"solar-silk",
  pride:"solar-silk", gratitude:"solar-silk",
  sadness:"mist-dissolve", sad:"mist-dissolve", fatigue:"mist-dissolve",
  tired:"mist-dissolve", exhaustion:"mist-dissolve",
  disappointment:"mist-dissolve", melancholy:"mist-dissolve",
  nostalgia:"mist-dissolve", grief:"mist-dissolve",
  anger:"burn-fracture", frustration:"burn-fracture", irritation:"burn-fracture",
  rage:"burn-fracture",
  fear:"nervous-haze", anxiety:"nervous-haze", unease:"nervous-haze",
  worry:"nervous-haze", nervousness:"nervous-haze",
  trust:"gentle-veil", calmness:"gentle-veil", calm:"gentle-veil",
  relief:"gentle-veil", serenity:"gentle-veil", acceptance:"gentle-veil",
  affection:"gentle-veil", love:"gentle-veil",
  disgust:"granular-liquid", aversion:"granular-liquid",
  surprise:"radiant-bloom", awe:"radiant-bloom", wonder:"radiant-bloom",
  anticipation:"forward-tension", determination:"forward-tension",
  hope:"forward-tension", perseverance:"forward-tension"
};

const ALIASES = {
  "ความสุข": "joy", "ดีใจ": "joy",
  "ความเหนื่อย": "fatigue", "เหนื่อยล้า": "fatigue",
  "ความภูมิใจ": "pride", "ภูมิใจ": "pride",
  "ความเศร้า": "sadness", "เศร้า": "sadness",
  "ความผิดหวัง": "disappointment", "ผิดหวัง": "disappointment",
  "ความโกรธ": "anger", "โกรธ": "anger",
  "ความกลัว": "fear", "กลัว": "fear",
  "ความกังวล": "anxiety", "กังวล": "anxiety",
  "ความสงบ": "calmness", "สงบ": "calmness",
  "ความโล่งใจ": "relief", "โล่งใจ": "relief",
  "ความหวัง": "hope", "ความพึงพอใจ": "satisfaction"
};
const MOOD_FALLBACK = {
  positive: "solar-silk",
  negative: "mist-dissolve",
  mixed: "gentle-veil",
  neutral: "gentle-veil"
};
const clamp = (n) => Number(Math.min(1, Math.max(0, n)).toFixed(2));

function canonicalLabel(value) {
  const key = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ALIASES[key] ?? key;
}

function knownFamily(emotion) {
  return EMOTION_FAMILY[canonicalLabel(emotion)] ?? null;
}

function familyOrFallback(emotion, fallbackMood) {
  const found = knownFamily(emotion);
  return found ?? MOOD_FALLBACK[fallbackMood] ?? "gentle-veil";
}

function mixHints(main, second, weight) {
  const result = {};
  for (const key of Object.keys(main)) {
    result[key] = clamp((1 - weight) * main[key] + weight * second[key]);
  }
  return result;
}

/**
 * Adds an expressive visual-family contract to a full v2 response.
 * Does not edit the source data. Safe for unit-testing without an AI key.
 */
export function attachVisualFamily(v2) {
  if (!v2?.analysis || !v2?.visual) {
    throw new TypeError("Expected a v2 result with analysis and visual");
  }

  const { analysis, visual } = v2;
  const primary = canonicalLabel(analysis.primaryEmotion);
  const secondary = canonicalLabel(analysis.secondaryEmotion);
  const pFamily = knownFamily(primary);
  const sFamily = knownFamily(secondary);
  const selected = pFamily ?? sFamily ?? familyOrFallback("", analysis.mood);
  const familySource = pFamily ? "primary" : sFamily ? "secondary" : "mood-fallback";
  const main = VISUAL_FAMILIES[selected];
  // Never turn an unknown emotion into a fabricated, recognized emotion.
  const hasSecondary = Boolean(pFamily && sFamily && primary !== secondary && secondary !== "none");
  const weight = hasSecondary
    ? analysis.relationship === "mixed" || analysis.relationship === "contrasting" ? 0.38
      : analysis.relationship === "aligned" ? 0.23 : 0.15
    : 0;
  const blended = hasSecondary
    ? mixHints(main.hints, VISUAL_FAMILIES[sFamily].hints, weight)
    : { ...main.hints };

  const modifiers = [];
  if (hasSecondary) modifiers.push(`secondary-${sFamily}`);
  if (secondary === "fatigue") {
    blended.veil = clamp(blended.veil + 0.16);
    blended.spread = clamp(blended.spread - 0.09);
    modifiers.push("fatigue-softening");
  }
  if (secondary === "pride") {
    blended.anchor = clamp(blended.anchor + 0.22);
    modifiers.push("pride-anchor");
  }
  if (secondary === "anxiety") {
    blended.jitter = clamp(blended.jitter + 0.17);
    modifiers.push("anxiety-instability");
  }
  if (secondary === "relief") {
    blended.spread = clamp(blended.spread + 0.15);
    blended.jitter = clamp(blended.jitter - 0.08);
    modifiers.push("relief-opening");
  }

  // Preserve v2 visual.numeric defaults: new renderer hints are additive.
  const resultVisual = {
    ...visual,
    visualFamily: selected,
    visualFamilyName: main.familyName,
    familySource,
    secondaryFamily: hasSecondary ? sFamily : null,
    blendMode: !hasSecondary ? "single-family"
      : ["mixed","contrasting"].includes(analysis.relationship) ? "dual-layer-contrast"
      : analysis.relationship === "aligned" ? "coherent-blend" : "soft-crossfade",
    shaderPreset: main.shaderPreset,
    motionPreset: main.motionPreset,
    typographyPreset: main.typographyPreset,
    compositionPreset: main.compositionPreset,
    renderHints: blended,
    modifiers,
    accessibility: {
      reducedMotionSupported: true,
      flashFree: true,
      thaiTextMustRemainReadable: true
    }
  };

  return {
    ...v2,
    visual: resultVisual
  };
}
