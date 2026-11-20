'use strict';
// ===================== biomes : jeux de tuiles teintés + décors dessinés en code =====================
// Clés : 0 été (forêt) · 1 hiver · 2 désert · 3 marais (sol) · 4 marais (eau) · 5 volcan (sol) · 6 lave · 7 citadelle (sol) · 8 citadelle (abîme)
const BIOME_TILES = {
  2: { src: 'env/terrain_summer.png', G: ['#c89a4a', '#f4dc98'], D: ['#80562e', '#cf9e60'] },
  3: { src: 'env/terrain_summer.png', G: ['#18261a', '#5a7a3c'], D: ['#2a2016', '#625034'] },
  4: { src: 'env/terrain_summer.png', W: ['#0e2a22', '#52946a'] },
  5: { src: 'env/terrain_summer.png', G: ['#1a1414', '#5e4e4a'], D: ['#2e1a10', '#84502e'] },
  6: { src: 'env/terrain_summer.png', W: ['#6a1200', '#ffb82a'] },
  7: { src: 'env/terrain_summer.png', G: ['#12101e', '#4a4464'], D: ['#1e142c', '#5e4a80'] },
  8: { src: 'env/terrain_summer.png', W: ['#0a0616', '#42306e'] }
};
const _tsCache = {};
function tsMix(c0, c1, t) { return [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t]; }
function tilesetFor(k) {
  if (!k) return img('env/terrain_summer.png');
  if (k === 1) return img('env/terrain_winter.png');
  if (_tsCache[k]) return _tsCache[k];
  const B = BIOME_TILES[k], src = img(B.src), c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const x = c.getContext('2d'); x.drawImage(src, 0, 0); const d = x.getImageData(0, 0, c.width, c.height), a = d.data;
  const G = B.G && [hexRGB(B.G[0]), hexRGB(B.G[1])], D = B.D && [hexRGB(B.D[0]), hexRGB(B.D[1])], W = B.W && [hexRGB(B.W[0]), hexRGB(B.W[1])];
  for (let i = 0; i < a.length; i += 4) {
    if (a[i + 3] === 0) continue;
    const r = a[i], g = a[i + 1], b = a[i + 2], L = Math.min(1, Math.max(0, ((0.3 * r + 0.59 * g + 0.11 * b) / 255 - 0.12) / 0.7));
    const pal = W ? W : (g > r * 1.08 && g > b * 1.1 ? G : D);
    const o = tsMix(pal[0], pal[1], L); a[i] = o[0]; a[i + 1] = o[1]; a[i + 2] = o[2];
  }
  x.putImageData(d, 0, 0); return (_tsCache[k] = c);
}
// région (0 forêt, 1 désert, 2 neige, 3 marais, 4 volcan, 5 citadelle) -> clés de jeux de tuiles
const REGION_TILES = [{ land: 0, water: 0 }, { land: 2, water: 0 }, { land: 1, water: 1 }, { land: 3, water: 4 }, { land: 5, water: 6 }, { land: 7, water: 8 }];

// ---------- décors dessinés en code ----------
function genSprite(name, w, h, fn, frames) {
  const c = document.createElement('canvas'); c.width = w * (frames || 1); c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  for (let f = 0; f < (frames || 1); f++) { x.save(); x.translate(f * w, 0); fn(x, w, h, f); x.restore(); }
  IMG['gen/' + name + '.png'] = { im: c, p: Promise.resolve(c) };
}
const _px = (x, col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
genSprite('cactus', 28, 44, (x, w, h) => { _px(x, '#2e5a28', 10, 6, 8, 38); _px(x, '#4a8a3a', 11, 6, 6, 38); _px(x, '#7ab85a', 12, 8, 2, 34); _px(x, '#2e5a28', 2, 18, 8, 5); _px(x, '#4a8a3a', 3, 18, 6, 4); _px(x, '#2e5a28', 2, 10, 4, 12); _px(x, '#4a8a3a', 3, 10, 2, 11); _px(x, '#2e5a28', 18, 22, 8, 5); _px(x, '#4a8a3a', 19, 22, 6, 4); _px(x, '#2e5a28', 22, 14, 4, 12); _px(x, '#4a8a3a', 23, 14, 2, 11); _px(x, '#e8e0c0', 13, 12, 1, 1); _px(x, '#e8e0c0', 15, 20, 1, 1); _px(x, '#e8e0c0', 12, 28, 1, 1); _px(x, '#d8506a', 13, 4, 3, 3); });
genSprite('palm', 64, 92, (x, w, h) => { for (let i = 0; i < 70; i++) { const px = 30 + Math.round(Math.sin(i * 0.09) * 5 + i * 0.05), py = 90 - i; _px(x, i % 6 < 3 ? '#8a5a2a' : '#6a4220', px, py, 5, 1); } for (let k = 0; k < 7; k++) { const a = -2.7 + k * 0.75; for (let t = 0; t < 22; t++) { const px = 34 + Math.cos(a) * t * 1.35, py = 22 + Math.sin(a) * t * 0.6 + t * t * 0.018; _px(x, k % 2 ? '#2f7a30' : '#3f9a3a', px, py, 3, 2); } } _px(x, '#6a4220', 31, 20, 5, 4); _px(x, '#6a4220', 35, 22, 3, 3); });
genSprite('icespike', 36, 56, (x, w, h) => { const sp = (cx, bw, hh, c1, c2) => { x.fillStyle = c1; x.beginPath(); x.moveTo(cx - bw, 54); x.lineTo(cx, 54 - hh); x.lineTo(cx + bw, 54); x.closePath(); x.fill(); x.fillStyle = c2; x.beginPath(); x.moveTo(cx, 54 - hh); x.lineTo(cx + bw, 54); x.lineTo(cx + 1, 54); x.closePath(); x.fill(); }; sp(10, 7, 30, '#8ed0f0', '#5aa0d8'); sp(24, 8, 46, '#b4e6ff', '#74b8e8'); sp(17, 5, 22, '#d8f4ff', '#8cc8ee'); _px(x, '#ffffff', 22, 14, 2, 8); });
genSprite('snowpine', 48, 76, (x, w, h) => { _px(x, '#5a4030', 22, 62, 5, 12); const L = [[8, 62, 26], [12, 48, 22], [15, 34, 17], [18, 20, 12]]; L.forEach(([r, y, hh], i) => { x.fillStyle = '#244a34'; x.beginPath(); x.moveTo(24 - r - 6, y + 12); x.lineTo(24, y - hh + 10); x.lineTo(24 + r + 6, y + 12); x.closePath(); x.fill(); x.fillStyle = '#eef8ff'; x.beginPath(); x.moveTo(24 - r - 6, y + 12); x.lineTo(24, y - hh + 10); x.lineTo(24 - 4, y + 2); x.lineTo(24 + 2, y + 6); x.lineTo(24 + 4, y + 2); x.lineTo(24, y - hh + 10); x.lineTo(24 + r + 6, y + 12); x.lineTo(24 + r - 2, y + 8); x.lineTo(24, y - hh + 16); x.lineTo(24 - r + 2, y + 8); x.closePath(); x.fill(); }); });
genSprite('obsidian', 36, 60, (x, w, h) => { const sp = (cx, bw, hh) => { x.fillStyle = '#17101e'; x.beginPath(); x.moveTo(cx - bw, 58); x.lineTo(cx - 1, 58 - hh); x.lineTo(cx + bw, 58); x.closePath(); x.fill(); x.fillStyle = '#3a2848'; x.beginPath(); x.moveTo(cx - 1, 58 - hh); x.lineTo(cx + bw, 58); x.lineTo(cx + 1, 58); x.closePath(); x.fill(); x.fillStyle = '#ff7a20'; x.fillRect(cx - bw + 1, 56, 3, 2); }; sp(10, 8, 34); sp(25, 9, 52); sp(17, 5, 22); });
genSprite('pillar', 28, 64, (x, w, h) => { _px(x, '#3a3646', 4, 56, 20, 6); _px(x, '#58546a', 7, 8, 14, 50); _px(x, '#77728c', 9, 8, 4, 50); _px(x, '#3a3646', 18, 8, 3, 50); for (let i = 0; i < 5; i++) _px(x, '#46425a', 7, 14 + i * 9, 14, 1); _px(x, '#3a3646', 5, 4, 18, 5); _px(x, '#58546a', 7, 1, 14, 4); _px(x, '#9a60e0', 12, 28, 4, 5); });
genSprite('bones', 34, 18, (x) => { _px(x, '#d8d0b8', 4, 10, 22, 3); _px(x, '#ece6d0', 4, 9, 22, 1); _px(x, '#d8d0b8', 2, 8, 4, 4); _px(x, '#d8d0b8', 24, 8, 4, 4); _px(x, '#d8d0b8', 10, 4, 10, 8); _px(x, '#ece6d0', 11, 4, 8, 2); _px(x, '#2a2028', 12, 7, 2, 2); _px(x, '#2a2028', 16, 7, 2, 2); _px(x, '#d8d0b8', 20, 13, 12, 2); });
genSprite('mangrove', 72, 96, (x) => { _px(x, '#2a2018', 30, 40, 12, 54); _px(x, '#3a2c20', 30, 40, 4, 54); for (let i = 0; i < 5; i++) { _px(x, '#2a2018', 18 + i * 8, 88 - i * 2, 5, 8); } x.fillStyle = '#1e3a22'; x.beginPath(); x.ellipse(36, 34, 32, 22, 0, 0, 7); x.fill(); x.fillStyle = '#2c5a30'; x.beginPath(); x.ellipse(30, 28, 20, 13, 0, 0, 7); x.fill(); for (let i = 0; i < 9; i++) { _px(x, '#4a7a3a', 10 + i * 6, 44, 1, 10 + (i * 7) % 16); } });
genSprite('brazier', 24, 40, (x, w, h, f) => { _px(x, '#2a2630', 9, 18, 6, 20); _px(x, '#3e3a48', 4, 12, 16, 6); _px(x, '#1a1620', 5, 14, 14, 3); const fl = [[10, 14], [12, 10], [11, 12], [13, 9]][f]; _px(x, '#c82a10', 7, 6 + f % 2, 10, 7); _px(x, '#ff7a20', 8, 4 + (f % 2), 8, 7); _px(x, '#ffd860', 10, 3 + (f % 3 === 1 ? 1 : 0), 4, 6); }, 4);
genSprite('darkgate', 72, 104, (x, w, h, f) => { _px(x, '#1a1424', 0, 8, 12, 96); _px(x, '#1a1424', 60, 8, 12, 96); _px(x, '#2e2640', 2, 8, 6, 96); _px(x, '#2e2640', 62, 8, 6, 96); _px(x, '#1a1424', 0, 0, 72, 10); _px(x, '#46395e', 4, 2, 64, 4); for (let y = 10; y < 102; y += 2) for (let xx = 12; xx < 60; xx += 2) { const v = Math.sin(xx * 0.3 + y * 0.2 + f * 1.6) + Math.sin(xx * 0.15 - y * 0.25 + f); x.fillStyle = v > 0.6 ? '#9a50e8' : v > -0.2 ? '#4a2a88' : '#1e1038'; x.fillRect(xx, y, 2, 2); } _px(x, '#e0b0ff', 34, 36 + f * 4, 4, 4); }, 4);
Object.assign(PROPS, {
  cactus: { im: 'gen/cactus.png', r: [0, 0, 28, 44], col: [-8, -8, 16, 8], sh: 14 },
  palm: { im: 'gen/palm.png', r: [0, 0, 64, 92], col: [-6, -8, 12, 8], sh: 22, fade: 1 },
  icespike: { im: 'gen/icespike.png', r: [0, 0, 36, 56], col: [-12, -10, 24, 10], sh: 14 },
  snowpine: { im: 'gen/snowpine.png', r: [0, 0, 48, 76], col: [-8, -8, 16, 8], sh: 20, fade: 1 },
  obsidian: { im: 'gen/obsidian.png', r: [0, 0, 36, 60], col: [-12, -10, 24, 10], sh: 14, light: [0, -4, 40, '255,120,40'] },
  pillar: { im: 'gen/pillar.png', r: [0, 0, 28, 64], col: [-9, -10, 18, 10], sh: 12 },
  bones: { im: 'gen/bones.png', r: [0, 0, 34, 18], flat: 1 },
  mangrove: { im: 'gen/mangrove.png', r: [0, 0, 72, 96], col: [-12, -10, 24, 10], sh: 26, fade: 1 },
  brazier: { im: 'gen/brazier.png', r: [0, 0, 24, 40], anim: [[0, 0, 24, 40], [24, 0, 24, 40], [48, 0, 24, 40], [72, 0, 24, 40]], col: [-8, -8, 16, 8], light: [0, -26, 120, '255,140,50'] },
  darkgate: { im: 'gen/darkgate.png', r: [0, 0, 72, 104], anim: [[0, 0, 72, 104], [72, 0, 72, 104], [144, 0, 72, 104], [216, 0, 72, 104]], light: [0, -50, 120, '170,90,255'] },
  zz_winter: { im: 'env/terrain_winter.png', r: [0, 0, 1, 1] }
});
