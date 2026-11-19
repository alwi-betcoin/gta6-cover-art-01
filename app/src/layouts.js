// Poster layouts for Palmwave Cover Studio. Each layout is a set of panels in unit space (x and y in
// 0..1, y down); the renderer stretches them over the chosen export size, clips each panel's photo to
// its polygon and strokes the seams. `titlePos` says where the caption block sits: over the art at
// the top, over the art at the bottom, or in the hero's sky. Polygons are listed back to front.

/** One panel: a polygon of [x, y] points in unit space. */
function panel(points) {
  return points;
}

export const LAYOUTS = [
  {
    id: 'hero',
    name: 'Hero',
    blurb: 'One full-bleed photo, a slashed second panel, the title in the sky.',
    titlePos: 'top',
    panels: [
      panel([[0, 0], [1, 0], [1, 1], [0, 1]]),
      panel([[0.58, 1], [1, 0.60], [1, 1]]),
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    blurb: 'Three slanted columns, the classic poster wall.',
    titlePos: 'top',
    panels: [
      panel([[0, 0], [0.365, 0], [0.285, 1], [0, 1]]),
      panel([[0.385, 0], [0.695, 0], [0.615, 1], [0.305, 1]]),
      panel([[0.715, 0], [1, 0], [1, 1], [0.635, 1]]),
    ],
  },
  {
    id: 'coverstory',
    name: 'Cover Story',
    blurb: 'A tall cover portrait beside two stacked scenes.',
    titlePos: 'bottom',
    panels: [
      panel([[0, 0], [0.56, 0], [0.52, 1], [0, 1]]),
      panel([[0.578, 0], [1, 0], [1, 0.47], [0.556, 0.502]]),
      panel([[0.55, 0.528], [1, 0.498], [1, 1], [0.536, 1]]),
    ],
  },
  {
    id: 'shards',
    name: 'Shards',
    blurb: 'One tall shard and three diagonal slices.',
    titlePos: 'bottom',
    panels: [
      panel([[0, 0], [0.44, 0], [0.382, 1], [0, 1]]),
      panel([[0.462, 0], [1, 0], [1, 0.318], [0.424, 0.362]]),
      panel([[0.418, 0.388], [1, 0.344], [1, 0.658], [0.398, 0.702]]),
      panel([[0.392, 0.728], [1, 0.684], [1, 1], [0.376, 1]]),
    ],
  },
  {
    id: 'skyline',
    name: 'Skyline',
    blurb: 'A wide establishing shot over two ground-level panels.',
    titlePos: 'top',
    panels: [
      panel([[0, 0], [1, 0], [1, 0.575], [0, 0.655]]),
      panel([[0, 0.682], [0.52, 0.612], [0.472, 1], [0, 1]]),
      panel([[0.546, 0.606], [1, 0.578], [1, 1], [0.498, 1]]),
    ],
  },
  {
    id: 'fan',
    name: 'Fan',
    blurb: 'Four panels fanning up from one point, like a hand of cards.',
    titlePos: 'bottom',
    panels: [
      panel([[0, 0], [0.25, 0], [0.467, 1], [0, 1]]),
      panel([[0.25, 0], [0.5, 0], [0.5, 1], [0.467, 1]]),
      panel([[0.5, 0], [0.75, 0], [0.533, 1], [0.5, 1]]),
      panel([[0.75, 0], [1, 0], [1, 1], [0.533, 1]]),
    ],
  },
  {
    id: 'quad',
    name: 'Quad',
    blurb: 'Four scenes in a grid cut by one diagonal seam.',
    titlePos: 'top',
    panels: [
      panel([[0, 0], [0.525, 0], [0.5, 0.492], [0, 0.492]]),
      panel([[0.545, 0], [1, 0], [1, 0.492], [0.52, 0.492]]),
      panel([[0, 0.512], [0.48, 0.512], [0.455, 1], [0, 1]]),
      panel([[0.5, 0.512], [1, 0.512], [1, 1], [0.475, 1]]),
    ],
  },
];

/** The layout with this id, or the first layout when the id is unknown. */
export function layoutById(id) {
  return LAYOUTS.find((layout) => layout.id === id) ?? LAYOUTS[0];
}

/** The bounding box of a panel polygon, in unit space. */
export function panelBounds(poly) {
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const [x, y] of poly) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/** True when the unit-space point (x, y) falls inside the polygon (ray casting). */
export function pointInPanel(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
