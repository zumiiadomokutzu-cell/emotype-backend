// EMOTYPE – Artwork color roles v1. This is visual art direction, not an emotion classifier.
// Safe post-processing: never mutate the input or alter emotion labels / S-Sense results.
// This first pass adjusts ONLY burn-fracture; all other families retain their current palettes.
const BURN_FRACTURE_COLORS = Object.freeze({
  palette: Object.freeze(['#290A13', '#B62432', '#FF613F']),
  artColors: Object.freeze({
    canvas: '#17080E',      // Artwork canvas only; NOT the whole page background
    textPrimary: '#FFF2E9', // Readable artwork message
    textAccent: '#FF9C80',  // Short accented fragments / strokes, not paragraphs
    glow: '#FF4B38',
    fractureShadow: '#66101F',
    fineLine: '#EF705C'
  })
});

export function applyEmotionArtPalette(visual) {
  if (!visual || typeof visual !== 'object' || Array.isArray(visual)) {
    throw new TypeError('Expected a visual object');
  }
  if (visual.visualFamily !== 'burn-fracture') return visual;
  return {
    ...visual,
    palette: [...BURN_FRACTURE_COLORS.palette],
    artColors: { ...BURN_FRACTURE_COLORS.artColors },
    paletteSource: 'visual-family:burn-fracture'
  };
}
