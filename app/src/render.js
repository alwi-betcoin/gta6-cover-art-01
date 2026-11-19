// The Palmwave cover renderer: draws the whole cover onto a 2D context at any size. Panels are
// clipped polygons filled with graded photos (one photo spread across every panel, or a photo per
// panel), the seams get a dark-and-light keyline, the grade washes over the art, and the caption is
// set in Anton with an accent offset shadow, GTA-poster style. The editor preview and the PNG export
// run through this same code, so what you see is what you share.

import { layoutById, panelBounds } from './layouts.js';
import { gradeById, gradedPhoto } from './grades.js';

export const EXPORT_SIZES = [
  { id: 'square', name: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

/** Traces a panel polygon, scaled from unit space to pixels, as the current path. */
export function tracePanel(ctx, poly, W, H) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x * W, y * H);
    else ctx.lineTo(x * W, y * H);
  });
  ctx.closePath();
}

/**
 * Draws `source` so it covers the target rectangle, zoomed by `tr.zoom`, focused on (fx, fy) of the
 * frame and shifted by the user's drag offset (in unit-canvas fractions). Wide panels pass a fy near
 * the top so faces stay in frame instead of being cropped away.
 */
function drawPhotoCover(ctx, source, tx, ty, tw, th, tr, fx, fy, W, H) {
  const sw = source.width, sh = source.height;
  const scale = Math.max(tw / sw, th / sh) * (tr?.zoom ?? 1);
  const dw = sw * scale, dh = sh * scale;
  const x = tx + (tw - dw) * fx + (tr?.dx ?? 0) * W;
  const y = ty + (th - dh) * fy + (tr?.dy ?? 0) * H;
  ctx.drawImage(source, x, y, dw, dh);
}

/** Fills a panel that has no photo yet: a deep gradient so the layout still reads as a poster. */
function drawEmptyPanel(ctx, poly, W, H, grade, index) {
  tracePanel(ctx, poly, W, H);
  const b = panelBounds(poly);
  const grad = ctx.createLinearGradient(b.minX * W, b.minY * H, b.maxX * W, b.maxY * H);
  grad.addColorStop(0, index % 2 ? '#3a1650' : '#571d54');
  grad.addColorStop(1, '#180a2a');
  ctx.fillStyle = grad;
  ctx.fill();
}

/** Draws one panel's photo, clipped to its polygon. */
function drawPanel(ctx, state, photos, grade, poly, index, W, H) {
  const b = panelBounds(poly);
  ctx.save();
  tracePanel(ctx, poly, W, H);
  ctx.clip();
  if (state.mode === 'spread') {
    const photo = photos.length ? photos[(state.spreadPhoto ?? 0) % photos.length] : null;
    if (photo) {
      const graded = gradedPhoto(photo.img, grade, photo.key);
      drawPhotoCover(ctx, graded, 0, 0, W, H, state.spread, 0.5, 0.40, W, H);
    } else {
      ctx.restore();
      drawEmptyPanel(ctx, poly, W, H, grade, index);
      return;
    }
  } else {
    const photo = photos[state.panelPhoto[index] % Math.max(1, photos.length)];
    if (photo) {
      const graded = gradedPhoto(photo.img, grade, photo.key);
      const wide = (b.w * W) / (b.h * H) > 1.5;
      drawPhotoCover(ctx, graded, b.minX * W, b.minY * H, b.w * W, b.h * H,
        state.transforms[index], 0.5, wide ? 0.20 : 0.5, W, H);
    } else {
      ctx.restore();
      drawEmptyPanel(ctx, poly, W, H, grade, index);
      return;
    }
  }
  ctx.restore();
}

/** The seams between panels: a wide dark stroke with a thin light one inside it. */
function drawKeylines(ctx, layout, W, H, grade) {
  const wide = Math.max(3, W * 0.0052);
  for (const poly of layout.panels) {
    tracePanel(ctx, poly, W, H);
    ctx.strokeStyle = 'rgba(14, 5, 20, 0.92)';
    ctx.lineWidth = wide;
    ctx.stroke();
    tracePanel(ctx, poly, W, H);
    ctx.strokeStyle = grade.keyline;
    ctx.lineWidth = Math.max(1, wide * 0.30);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(14, 5, 20, 0.92)';
  ctx.lineWidth = wide;
  ctx.strokeRect(0, 0, W, H);
}

/** The grade's wash and a vignette over the art, under the lettering. */
function drawWash(ctx, W, H, grade) {
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
  vig.addColorStop(0, 'rgba(10, 4, 18, 0)');
  vig.addColorStop(1, 'rgba(10, 4, 18, 0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

/** Fits the title: one line if it fits, otherwise two lines split near the middle word. */
function fitTitle(ctx, text, maxWidth, baseSize) {
  const set = (size) => { ctx.font = `${size}px Anton, 'Archivo Black', sans-serif`; };
  let size = baseSize;
  set(size);
  if (ctx.measureText(text).width <= maxWidth) return { lines: [text], size };
  const words = text.split(' ');
  if (words.length > 1) {
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
      const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
      if (!best || w < best.w) best = { lines: [a, b], w };
    }
    while (size > 10 && best.w * (size / baseSize) > maxWidth) size -= 2;
    set(size);
    if (Math.max(ctx.measureText(best.lines[0]).width, ctx.measureText(best.lines[1]).width) <= maxWidth) {
      return { lines: best.lines, size };
    }
    size = baseSize;
    set(size);
  }
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    set(size);
  }
  return { lines: [text], size };
}

/** The caption block: scrim, the title in poster lettering, the subline letterspaced under it. */
function drawCaption(ctx, state, layout, W, H, grade) {
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.sub || '').trim().toUpperCase();
  if (!title && !sub) return;
  const atTop = layout.titlePos === 'top';
  const baseSize = Math.min(H * 0.115, W * 0.16);
  const fit = title ? fitTitle(ctx, title, W * 0.92, baseSize) : { lines: [], size: baseSize };
  const titleH = fit.lines.length * fit.size * 1.04;
  const subSize = Math.max(11, fit.size * 0.30);
  const blockH = titleH + (sub ? subSize * 1.9 : 0);
  const top = atTop ? H * 0.038 : H - H * 0.038 - blockH;

  const scrim = ctx.createLinearGradient(0, atTop ? 0 : H, 0, atTop ? blockH + H * 0.10 : H - blockH - H * 0.10);
  scrim.addColorStop(0, 'rgba(10, 4, 16, 0.52)');
  scrim.addColorStop(1, 'rgba(10, 4, 16, 0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, atTop ? 0 : H - blockH - H * 0.10, W, blockH + H * 0.10);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let y = top;
  if (title) {
    ctx.save();
    ctx.translate(W / 2, 0);
    ctx.transform(1, 0, -0.045, 1, 0, 0);
    ctx.translate(-W / 2, 0);
    fit.lines.forEach((line, i) => {
      const ly = y + fit.size * (i + 0.92) * 1.04 - (i ? fit.size * 0.06 : 0);
      ctx.font = `${fit.size}px Anton, 'Archivo Black', sans-serif`;
      ctx.fillStyle = grade.accent;
      ctx.fillText(line, W / 2 + fit.size * 0.045, ly + fit.size * 0.062);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#160a1c';
      ctx.lineWidth = fit.size * 0.085;
      ctx.strokeText(line, W / 2, ly);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, W / 2, ly);
    });
    ctx.restore();
    y += titleH;
  }
  if (sub) {
    let fitted = subSize;
    ctx.font = `${fitted}px 'Archivo Black', Anton, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(fitted * 0.30)}px`; } catch { /* older engines */ }
    while (fitted > 9 && ctx.measureText(sub).width > W * 0.92) {
      fitted -= 1;
      ctx.font = `${fitted}px 'Archivo Black', Anton, sans-serif`;
      try { ctx.letterSpacing = `${Math.round(fitted * 0.30)}px`; } catch { /* older engines */ }
    }
    ctx.shadowColor = 'rgba(10, 4, 16, 0.8)';
    ctx.shadowBlur = fitted * 0.35;
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub, W / 2, y + fitted * 1.45);
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
  }
  // The studio bug, in the corner away from the caption.
  const bugSize = Math.max(10, H * 0.017);
  ctx.font = `${bugSize}px 'Archivo Black', sans-serif`;
  try { ctx.letterSpacing = `${Math.round(bugSize * 0.22)}px`; } catch { /* older engines */ }
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.fillText('PALMWAVE COVER STUDIO', W * 0.972, atTop ? H * 0.972 : bugSize * 1.7);
  try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
  ctx.textAlign = 'center';
}

/** Draws the finished cover for `state` onto ctx at W × H. `photos` is [{img, key}]. */
export function drawCover(ctx, W, H, state, photos) {
  const layout = layoutById(state.layoutId);
  const grade = gradeById(state.gradeId);
  ctx.fillStyle = '#180a2a';
  ctx.fillRect(0, 0, W, H);
  layout.panels.forEach((poly, i) => drawPanel(ctx, state, photos, grade, poly, i, W, H));
  drawKeylines(ctx, layout, W, H, grade);
  drawWash(ctx, W, H, grade);
  drawCaption(ctx, state, layout, W, H, grade);
}

/** Renders the cover at the state's export size onto a fresh canvas. */
export function renderCoverCanvas(state, photos) {
  const canvas = document.createElement('canvas');
  canvas.width = state.size.w;
  canvas.height = state.size.h;
  drawCover(canvas.getContext('2d'), canvas.width, canvas.height, state, photos);
  return canvas;
}

/** The cover as a PNG blob, at the state's export size: the Export button's own path. */
export function exportCoverPng(state, photos) {
  return new Promise((resolve) => renderCoverCanvas(state, photos).toBlob(resolve, 'image/png'));
}
