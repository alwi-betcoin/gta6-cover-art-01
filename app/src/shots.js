// Fixed scenes for screenshots: a `?shot=` query configures the studio exactly as a person would
// (samples loaded, layout, grade, size, caption), then either exports the cover through the app's
// own Export path and leaves the PNG bytes on window.__exportPng, or, for `shot=editor`, leaves the
// editor open with a photo loaded and a panel selected. window.__shotReady is set once it is done.

import { state, photos, loadSamples, loadPosterFonts, setSize, redraw } from './studio.js';
import { EXPORT_SIZES, exportCoverPng } from './render.js';

/** Reads a blob as base64 without its data-URL prefix. */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Applies the query's scene settings to the studio state. */
function applyScene(query) {
  if (query.get('layout')) state.layoutId = query.get('layout');
  if (query.get('grade')) state.gradeId = query.get('grade');
  if (query.get('mode')) state.mode = query.get('mode');
  if (query.get('title')) {
    state.title = query.get('title');
    document.getElementById('title').value = state.title;
  }
  if (query.get('sub')) {
    state.sub = query.get('sub');
    document.getElementById('sub').value = state.sub;
  }
  if (query.get('assign')) state.panelPhoto = query.get('assign').split(',').map(Number);
  if (query.get('spreadPhoto')) state.spreadPhoto = Number(query.get('spreadPhoto'));
  if (query.get('sel')) state.selected = Number(query.get('sel'));
  const size = EXPORT_SIZES.find((s) => s.id === query.get('size')) ?? EXPORT_SIZES[1];
  setSize(size);
}

/** Sets up the scene named by the query and signals when the page is ready to capture. */
export async function runShot(shot, query) {
  await loadPosterFonts();
  const names = (query.get('photos') ?? 'speedboat,rooftop,lowrider').split(',');
  await loadSamples(names);
  applyScene(query);
  redraw();
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const blob = await exportCoverPng(state, photos);
    window.__exportPng = await blobToBase64(blob);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
