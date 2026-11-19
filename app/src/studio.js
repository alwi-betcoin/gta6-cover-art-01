// Palmwave Cover Studio: the editor. Wires the page to the renderer: photos (your own files, read
// locally and never uploaded, plus the built-in samples), seven poster layouts, five colour grades,
// per-panel framing with drag and zoom, caption editing, and PNG export at the three post sizes.
// A `?shot=` query hands control to ./shots.js instead, which sets up a fixed scene for screenshots.

import { LAYOUTS, layoutById, pointInPanel } from './layouts.js';
import { GRADES } from './grades.js';
import { EXPORT_SIZES, drawCover, exportCoverPng, tracePanel } from './render.js';

const SAMPLES = [
  { name: 'speedboat', label: 'Speedboat' },
  { name: 'rooftop', label: 'Rooftop' },
  { name: 'lowrider', label: 'Lowrider' },
  { name: 'boardwalk', label: 'Boardwalk' },
  { name: 'pier', label: 'Pier' },
  { name: 'boulevard', label: 'Boulevard' },
];

export const state = {
  size: EXPORT_SIZES[1],
  layoutId: 'triptych',
  gradeId: 'sunset',
  mode: 'panels',
  title: 'Neon Coast',
  sub: 'Welcome to Palmwave',
  panelPhoto: [0, 1, 2, 3],
  transforms: [],
  spread: { dx: 0, dy: 0, zoom: 1 },
  spreadPhoto: 0,
  selected: 0,
};

export const photos = [];

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Loads the two poster fonts shipped under app/fonts (SIL Open Font License). */
export async function loadPosterFonts() {
  try {
    const faces = await Promise.all([
      new FontFace('Anton', "url('fonts/Anton-Regular.ttf')").load(),
      new FontFace('Archivo Black', "url('fonts/ArchivoBlack-Regular.ttf')").load(),
    ]);
    faces.forEach((face) => document.fonts.add(face));
  } catch {
    // The heavy system sans stands in; the studio still works.
  }
}

/** Keeps the per-panel arrays as long as the current layout needs, with default framing. */
export function syncPanelArrays() {
  const count = layoutById(state.layoutId).panels.length;
  while (state.transforms.length < count) state.transforms.push({ dx: 0, dy: 0, zoom: 1 });
  while (state.panelPhoto.length < count) state.panelPhoto.push(state.panelPhoto.length % Math.max(1, photos.length));
  if (state.selected >= count) state.selected = 0;
}

/** The transform the zoom slider and drag gestures edit right now. */
function activeTransform() {
  return state.mode === 'spread' ? state.spread : state.transforms[state.selected];
}

/** Redraws the preview, with the selected panel outlined when framing per panel. */
export function redraw() {
  syncPanelArrays();
  drawCover(ctx, canvas.width, canvas.height, state, photos);
  if (state.mode === 'panels' && photos.length) {
    const layout = layoutById(state.layoutId);
    tracePanel(ctx, layout.panels[state.selected], canvas.width, canvas.height);
    ctx.save();
    ctx.setLineDash([14, 9]);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.setLineDash([14, 9]);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#ff5e8a';
    ctx.stroke();
    ctx.restore();
  }
  document.getElementById('zoom').value = String(activeTransform().zoom);
  markActiveControls();
}

// ---------- controls ----------

function markActiveControls() {
  document.querySelectorAll('#layouts button').forEach((b) =>
    b.classList.toggle('active', b.dataset.layout === state.layoutId));
  document.querySelectorAll('#grades button').forEach((b) =>
    b.classList.toggle('active', b.dataset.grade === state.gradeId));
  document.querySelectorAll('#sizes button').forEach((b) =>
    b.classList.toggle('active', b.dataset.size === state.size.id));
  document.querySelectorAll('#fillSeg button').forEach((b) =>
    b.classList.toggle('active', b.dataset.mode === state.mode));
  const current = state.mode === 'spread'
    ? state.spreadPhoto
    : state.panelPhoto[state.selected];
  document.querySelectorAll('#thumbs button').forEach((b, i) =>
    b.classList.toggle('active', i === current));
  document.getElementById('photoHint').textContent = state.mode === 'spread'
    ? 'The lit photo spreads across every panel. Click a photo to choose it.'
    : `Panel ${state.selected + 1} is selected. Click a photo to put it in that panel.`;
}

function buildChoices() {
  const sizes = document.getElementById('sizes');
  for (const size of EXPORT_SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.size = size.id;
    b.textContent = `${size.w} × ${size.h}`;
    b.addEventListener('click', () => { setSize(size); });
    sizes.appendChild(b);
  }
  const layouts = document.getElementById('layouts');
  for (const layout of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = layout.id;
    b.innerHTML = `<strong></strong><span></span>`;
    b.querySelector('strong').textContent = layout.name;
    b.querySelector('span').textContent = layout.blurb;
    b.addEventListener('click', () => { state.layoutId = layout.id; redraw(); });
    layouts.appendChild(b);
  }
  const grades = document.getElementById('grades');
  for (const grade of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = grade.id;
    b.innerHTML = `<i></i><span></span>`;
    b.querySelector('i').style.background = grade.swatch;
    b.querySelector('span').textContent = grade.name;
    b.addEventListener('click', () => { state.gradeId = grade.id; redraw(); });
    grades.appendChild(b);
  }
  document.querySelectorAll('#fillSeg button').forEach((b) =>
    b.addEventListener('click', () => { state.mode = b.dataset.mode; redraw(); }));
}

/** Sets the export size and reshapes the preview canvas to match its aspect. */
export function setSize(size) {
  state.size = size;
  const scale = 1080 / Math.max(size.w, size.h);
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  redraw();
}

function addThumb(photo, index) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'thumb';
  const img = document.createElement('img');
  img.src = photo.thumbUrl;
  img.alt = photo.label;
  const span = document.createElement('span');
  span.textContent = photo.label;
  b.append(img, span);
  b.addEventListener('click', () => {
    if (state.mode === 'spread') state.spreadPhoto = index;
    else state.panelPhoto[state.selected] = index;
    redraw();
  });
  document.getElementById('thumbs').appendChild(b);
}

/** Adds a photo to the studio: {img, key, label, thumbUrl}. */
export function addPhoto(photo) {
  photos.push(photo);
  addThumb(photo, photos.length - 1);
  syncPanelArrays();
}

/** Loads the built-in sample photos, in picker order. */
export async function loadSamples(names = SAMPLES.map((s) => s.name)) {
  for (const sample of SAMPLES) {
    if (!names.includes(sample.name)) continue;
    const img = await loadImage(`samples/${sample.name}.jpg`);
    addPhoto({ img, key: `sample-${sample.name}`, label: sample.label, thumbUrl: `samples/${sample.name}.jpg` });
  }
}

// ---------- gestures ----------

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
}

let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  const p = canvasPoint(event);
  if (state.mode === 'panels') {
    const layout = layoutById(state.layoutId);
    for (let i = layout.panels.length - 1; i >= 0; i--) {
      if (pointInPanel(layout.panels[i], p.x, p.y)) { state.selected = i; break; }
    }
  }
  drag = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const tr = activeTransform();
  tr.dx = Math.max(-0.6, Math.min(0.6, tr.dx + (event.clientX - drag.x) / rect.width));
  tr.dy = Math.max(-0.6, Math.min(0.6, tr.dy + (event.clientY - drag.y) / rect.height));
  drag = { x: event.clientX, y: event.clientY };
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const tr = activeTransform();
  tr.zoom = Math.max(1, Math.min(3.5, tr.zoom * Math.exp(-event.deltaY * 0.0012)));
  redraw();
}, { passive: false });

document.getElementById('zoom').addEventListener('input', (event) => {
  activeTransform().zoom = Number(event.target.value);
  redraw();
});
document.getElementById('resetFrame').addEventListener('click', () => {
  const tr = activeTransform();
  tr.dx = 0; tr.dy = 0; tr.zoom = 1;
  redraw();
});
document.getElementById('title').addEventListener('input', (event) => { state.title = event.target.value; redraw(); });
document.getElementById('sub').addEventListener('input', (event) => { state.sub = event.target.value; redraw(); });
document.getElementById('files').addEventListener('change', async (event) => {
  for (const file of event.target.files) {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    addPhoto({ img, key: `user-${file.name}-${photos.length}`, label: file.name.replace(/\.[^.]+$/, ''), thumbUrl: url });
  }
  if (state.mode === 'panels') state.panelPhoto[state.selected] = photos.length - 1;
  status.textContent = 'Your photos stay on this machine — nothing is uploaded.';
  redraw();
});
document.getElementById('export').addEventListener('click', async () => {
  status.textContent = 'Rendering your cover…';
  const blob = await exportCoverPng(state, photos);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `palmwave-${state.layoutId}-${state.size.w}x${state.size.h}.png`;
  a.click();
  status.textContent = `Saved ${a.download}`;
});

// ---------- start ----------

const shot = new URLSearchParams(location.search).get('shot');
buildChoices();
if (shot) {
  import('./shots.js').then(({ runShot }) => runShot(shot, new URLSearchParams(location.search)));
} else {
  loadPosterFonts().then(redraw);
  loadSamples().then(redraw);
  redraw();
}
