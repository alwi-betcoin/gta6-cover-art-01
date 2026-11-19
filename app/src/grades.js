// Colour grades for Palmwave Cover Studio. A grade is applied to a photo once, on an offscreen
// canvas, and cached: contrast and saturation first, then a posterize step that flattens the photo
// toward the illustrated poster look, then a gentle split tone (shadows toward the grade's cool
// colour, highlights toward its warm one) kept weak so skin tones stay plausible. The renderer also
// reads each grade's wash, accent and keyline colours for the finished cover.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    levels: 7, saturation: 1.18, contrast: 1.06,
    shadow: [38, 16, 66], highlight: [255, 166, 88], tone: 0.20,
    washTop: 'rgba(255, 170, 80, 0.10)', washBottom: 'rgba(255, 62, 122, 0.17)',
    accent: '#ff5e8a', keyline: '#fff1dc', swatch: 'linear-gradient(160deg, #ffb35c, #ff3e7a 70%, #5b2a86)',
  },
  {
    id: 'neon',
    name: 'Neon Night',
    levels: 7, saturation: 1.26, contrast: 1.12,
    shadow: [10, 30, 72], highlight: [120, 235, 255], tone: 0.22,
    washTop: 'rgba(49, 232, 255, 0.10)', washBottom: 'rgba(176, 38, 255, 0.16)',
    accent: '#31e8ff', keyline: '#e6fbff', swatch: 'linear-gradient(160deg, #31e8ff, #3150ff 55%, #ff2fd6)',
  },
  {
    id: 'gold',
    name: 'Gold Hour',
    levels: 9, saturation: 1.10, contrast: 1.03,
    shadow: [52, 30, 12], highlight: [255, 205, 105], tone: 0.16,
    washTop: 'rgba(255, 197, 61, 0.10)', washBottom: 'rgba(214, 110, 30, 0.14)',
    accent: '#ffc53d', keyline: '#fff6da', swatch: 'linear-gradient(160deg, #ffe29a, #ffc53d 55%, #b3541e)',
  },
  {
    id: 'candy',
    name: 'Candy Pop',
    levels: 6, saturation: 1.42, contrast: 1.08,
    shadow: [66, 14, 84], highlight: [255, 190, 230], tone: 0.18,
    washTop: 'rgba(255, 138, 216, 0.12)', washBottom: 'rgba(64, 190, 255, 0.15)',
    accent: '#ff8ad8', keyline: '#fff0fa', swatch: 'linear-gradient(160deg, #ff8ad8, #ff5e8a 50%, #40beff)',
  },
  {
    id: 'chrome',
    name: 'Chrome Mono',
    levels: 8, saturation: 0.24, contrast: 1.16,
    shadow: [16, 22, 44], highlight: [205, 228, 255], tone: 0.24,
    washTop: 'rgba(159, 216, 255, 0.08)', washBottom: 'rgba(30, 42, 84, 0.18)',
    accent: '#9fd8ff', keyline: '#eef6ff', swatch: 'linear-gradient(160deg, #e8f2ff, #8fa8c8 55%, #2c3a5e)',
  },
];

/** The grade with this id, or the first grade when the id is unknown. */
export function gradeById(id) {
  return GRADES.find((grade) => grade.id === id) ?? GRADES[0];
}

const cache = new Map();
const MAX_GRADE_WIDTH = 1200;

/**
 * Returns a canvas holding `img` graded with `grade`, at the photo's own size (capped in width so
 * the pixel pass stays fast). Cached per photo and grade: the editor redraws often, grades once.
 */
export function gradedPhoto(img, grade, key) {
  const cacheKey = `${key}|${grade.id}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const scale = Math.min(1, MAX_GRADE_WIDTH / img.naturalWidth);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  applyGrade(image.data, grade);
  ctx.putImageData(image, 0, 0);
  cache.set(cacheKey, canvas);
  return canvas;
}

/** The in-place pixel pass behind gradedPhoto: saturation, contrast, posterize, split tone. */
function applyGrade(data, grade) {
  const { saturation: sat, contrast: con, levels, shadow, highlight, tone } = grade;
  const step = 255 / (levels - 1);
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = luma + (r - luma) * sat;
    g = luma + (g - luma) * sat;
    b = luma + (b - luma) * sat;
    r = (r - 128) * con + 128;
    g = (g - 128) * con + 128;
    b = (b - 128) * con + 128;
    r = Math.round(r / step) * step;
    g = Math.round(g / step) * step;
    b = Math.round(b / step) * step;
    const t = Math.min(255, Math.max(0, luma)) / 255;
    const mixShadow = (1 - t) * tone;
    const mixHighlight = t * tone * 0.7;
    data[i] = r + (shadow[0] - r) * mixShadow + (highlight[0] - r) * mixHighlight;
    data[i + 1] = g + (shadow[1] - g) * mixShadow + (highlight[1] - g) * mixHighlight;
    data[i + 2] = b + (shadow[2] - b) * mixShadow + (highlight[2] - b) * mixHighlight;
  }
}
