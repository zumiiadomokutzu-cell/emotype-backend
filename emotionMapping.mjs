
const visualThemes = {
  positive: {
    palette: ["#F4B7DA", "#B9EBDD", "#BFA7F2"],
    blur: 16,
    fontWeight: 400,
    flowSpeed: 0.6,
    letterSpacing: "0.04em",
    layerCount: 2,
    distortion: 0.08
  },

  negative: {
    palette: ["#332455", "#6254A0", "#8290C0"],
    blur: 24,
    fontWeight: 300,
    flowSpeed: 0.2,
    letterSpacing: "0.12em",
    layerCount: 3,
    distortion: 0.18
  },

  mixed: {
    palette: ["#58438D", "#90DCCB", "#E9AFC9"],
    blur: 20,
    fontWeight: 350,
    flowSpeed: 0.35,
    letterSpacing: "0.08em",
    layerCount: 3,
    distortion: 0.12
  },

  neutral: {
    palette: ["#A9C0CD", "#E0DDE8", "#B5D9D8"],
    blur: 12,
    fontWeight: 400,
    flowSpeed: 0.25,
    letterSpacing: "0.05em",
    layerCount: 2,
    distortion: 0.02
  }
};

export function normalizeSsense(raw) {
  if (!raw?.sentiment || !raw?.preprocess) {
    throw new Error("Invalid S-Sense response");
  }

  const sentiment = raw.sentiment;
  const preprocess = raw.preprocess;

  const positiveWords = Array.isArray(preprocess.pos)
    ? preprocess.pos
    : [];

  const negativeWords = Array.isArray(preprocess.neg)
    ? preprocess.neg
    : [];

  const hasPositive =
    sentiment["polarity-pos"] === true ||
    positiveWords.length > 0;

  const hasNegative =
    sentiment["polarity-neg"] === true ||
    negativeWords.length > 0;

  let polarity = sentiment.polarity;

  if (!["positive", "negative", "neutral"].includes(polarity)) {
    polarity = "neutral";
  }

  let mood = polarity;

  if (hasPositive && hasNegative) {
    mood = "mixed";
  }

  return {
    text: preprocess.input ?? "",
    polarity,
    mood,
    positiveWords,
    negativeWords,
    score: sentiment.score ?? null
  };
}

export function mapEmotion(raw) {
  const analysis = normalizeSsense(raw);
  const theme = visualThemes[analysis.mood];

  return {
    analysis,
    visual: {
      ...theme,
      style: "aurora-typography"
    }
  };
}