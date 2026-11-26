const emotionAliases = {
  happy: "joy",
  joyful: "joy",
  joy: "joy",

  tired: "fatigue",
  fatigue: "fatigue",

  proud: "pride",
  pride: "pride",

  sad: "sadness",
  sadness: "sadness",

  disappointed: "disappointment",
  disappointment: "disappointment",

  none: "none",
  uncertain: "uncertain"
};

function normalizeEmotionName(value) {
  if (!value || typeof value !== "string") {
    return "uncertain";
  }

  const cleaned = value.trim().toLowerCase();

  // แก้กรณี LLM ตอบแบบ "disappointment or none"
  if (cleaned.includes(" or ")) {
    const parts = cleaned.split(" or ").map(v => v.trim());
    for (const part of parts) {
      if (emotionAliases[part]) {
        return emotionAliases[part];
      }
    }
    return "uncertain";
  }

  return emotionAliases[cleaned] || cleaned;
}

function normalizeRelationship(value) {
  if (!value || typeof value !== "string") {
    return "uncertain";
  }

  const cleaned = value.trim().toLowerCase();

  const allowed = ["mixed", "aligned", "contrasting", "uncertain"];
  return allowed.includes(cleaned) ? cleaned : "uncertain";
}

export function normalizePathumma(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid Pathumma data");
  }

  return {
    primaryEmotion: normalizeEmotionName(raw.primaryEmotion),
    secondaryEmotion: normalizeEmotionName(raw.secondaryEmotion),
    relationship: normalizeRelationship(raw.relationship),
    interpretation:
      typeof raw.interpretation === "string"
        ? raw.interpretation.trim()
        : "",
    visualMetaphor:
      typeof raw.visualMetaphor === "string"
        ? raw.visualMetaphor.trim()
        : "",
    artworkTitle:
      typeof raw.artworkTitle === "string"
        ? raw.artworkTitle.trim()
        : "Untitled Emotion"
  };
}

// S-Sense + Pathumma

export function fuseAnalyses(ssenseAnalysis, pathummaAnalysis) {
  const pathumma = normalizePathumma(pathummaAnalysis);

  const hasPositive =
    Array.isArray(ssenseAnalysis.positiveWords) &&
    ssenseAnalysis.positiveWords.length > 0;

  const hasNegative =
    Array.isArray(ssenseAnalysis.negativeWords) &&
    ssenseAnalysis.negativeWords.length > 0;

  let fusedMood = "neutral";

  if (hasPositive && hasNegative) {
    fusedMood = "mixed";
  } else if (ssenseAnalysis.polarity === "positive") {
    fusedMood = "positive";
  } else if (ssenseAnalysis.polarity === "negative") {
    fusedMood = "negative";
  }

  return {
    fusedMood,
    primaryEmotion: pathumma.primaryEmotion,
    secondaryEmotion: pathumma.secondaryEmotion,
    relationship: pathumma.relationship,
    interpretation: pathumma.interpretation,
    visualMetaphor: pathumma.visualMetaphor,
    artworkTitle: pathumma.artworkTitle
  };
}