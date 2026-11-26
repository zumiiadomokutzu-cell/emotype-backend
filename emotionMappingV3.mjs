import { mapEmotionV2 } from "./emotionMappingV2.mjs";
import { attachVisualFamily } from "./visualFamilyMapping.mjs";

// Use inside the existing Hybrid API in place of mapEmotionV2.
// Never modify the S-Sense-only fallback.
export function mapEmotionV3(ssenseRaw, pathummaParsed) {
  return attachVisualFamily(mapEmotionV2(ssenseRaw, pathummaParsed));
}
