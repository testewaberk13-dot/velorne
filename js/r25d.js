'use strict';
// ===================== Phase G0 — rendu 2.5D simulé (canvas 2D) =====================
// Sol texturé sans quadrillage visible, herbe vivante, ombres douces, profondeur de champ,
// brume atmosphérique, rayons de lumière, étalonnage couleur par région, qualité réglable.
// Aucun effet sur le gameplay, les collisions ni la sauvegarde.

const GFXQ = { haute: { tex: 1, grass: 3, dof: 1, rays: 1, grade: 1, front: 1, soft: 1 },
  moyenne: { tex: 1, grass: 2, dof: 0, rays: 1, grade: 1, front: 1, soft: 1 },
  basse: { tex: 0, grass: 0, dof: 0, rays: 0, grade: 0, front: 0, soft: 0 } };
if (!SET.gfx) SET.gfx = 'auto';
const R25 = { level: SET.gfx === 'auto' ? (IS_TOUCH ? 'moyenne' : 'haute') : SET.gfx, fps: 60, low: 0, last: 0 };
function gfxQ() { return GFXQ[R25.level] || GFXQ.moyenne; }
function gfxLabel() { return SET.gfx === 'auto' ? 'auto (' + R25.level + ')' : SET.gfx; }
function gfxCycle() { const o = ['auto', 'haute', 'moyenne', 'basse']; SET.gfx = o[(o.indexOf(SET.gfx) + 1) % o.length]; R25.level = SET.gfx === 'auto' ? (IS_TOUCH ? 'moyenne' : 'haute') : SET.gfx; R25.low = 0; }
// détection automatique : on descend d'un cran si le jeu reste sous 45 i/s pendant 3 s
function gfxAuto() {
  const now = performance.now(); const dt = now - (R25.last || now); R25.last = now;
  if (dt <= 0 || dt > 250) return;
  R25.fps = R25.fps * 0.95 + (1000 / dt) * 0.05;
  if (SET.gfx !== 'auto') return;
  if (R25.fps < 45) R25.low += dt; else R25.low = Math.max(0, R25.low - dt * 0.5);
  if (R25.low > 3000) { R25.low = 0; if (R25.level === 'haute') R25.level = 'moyenne'; else if (R25.level === 'moyenne') R25.level = 'basse'; }
}

// ---------- textures de bruit (sans couture) ----------
function r25Noise(size, cellsList, seed, speck) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const d = x.createImageData(size, size), a = d.data; const acc = new Float32Array(size * size);
  let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  let wsum = 0;
  cellsList.forEach((cells, oi) => {
    const g = new Float32Array(cells * cells); for (let i = 0; i < g.length; i++) g[i] = rnd();
    const w = 1 / (oi + 1); wsum += w; const k = cells / size;
    for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
      const fx = px * k, fy = py * k, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const i0 = ix % cells, i1 = (ix + 1) % cells, j0 = iy % cells, j1 = (iy + 1) % cells;
      const v = (g[j0 * cells + i0] * (1 - sx) + g[j0 * cells + i1] * sx) * (1 - sy) + (g[j1 * cells + i0] * (1 - sx) + g[j1 * cells + i1] * sx) * sy;
      acc[py * size + px] += v * w;
    }
  });
  for (let i = 0; i < acc.length; i++) {
    let v = acc[i] / wsum; v = 0.5 + (v - 0.5) * 1.6;
    if (speck && rnd() < speck) v -= 0.25 + rnd() * 0.2; // petits cailloux / grains
    const g = Math.max(0, Math.min(255, v * 255)); a[i * 4] = a[i * 4 + 1] = a[i * 4 + 2] = g; a[i * 4 + 3] = 255;
  }
  x.putImageData(d, 0, 0); return c;
}
let R25T = null;
function r25Init() {
  if (R25T) return R25T;
  const detail = r25Noise(256, [16, 32, 64], 9137, 0.012);
  const macroSmall = r25Noise(128, [3, 6], 4271, 0);
  const macro = document.createElement('canvas'); macro.width = macro.height = 768; const mx = macro.getContext('2d'); mx.imageSmoothingEnabled = true; mx.drawImage(macroSmall, 0, 0, 768, 768);
  const sh = document.createElement('canvas'); sh.width = 64; sh.height = 32; const sx = sh.getContext('2d');
  const g = sx.createRadialGradient(32, 16, 2, 32, 16, 32); g.addColorStop(0, 'rgba(8,6,18,1)'); g.addColorStop(0.6, 'rgba(8,6,18,0.8)'); g.addColorStop(1, 'rgba(8,6,18,0)');
  sx.setTransform(1, 0, 0, 0.5, 0, 8); sx.fillStyle = g; sx.fillRect(0, -16, 64, 64);
  R25T = { detail, macro, shadow: sh, pats: {} };
  return R25T;
}

// ---------- herbe vivante : touffes pré-dessinées par région ----------
// région : 0 forêt, 1 désert, 2 neige, 3 marais, 4 volcan, 5 citadelle
const GRASS_PAL = [
  { c: ['#2f6424', '#4f8e33', '#86c04a'], dens: 1, flower: ['#f4e27a', '#ffffff', '#e86a8a', '#b9a4ff'] },
  { c: ['#8a7438', '#b39a58', '#dcc681'], dens: 0.35 },
  { c: ['#7e94a6', '#b3c6d6', '#eef6fb'], dens: 0.3 },
  { c: ['#1e3422', '#365430', '#5b7c40'], dens: 0.9 },
  { c: ['#2e2422', '#4c3a34', '#6e5240'], dens: 0.25 },
  { c: ['#25213a', '#3f3760', '#64568c'], dens: 0.35 }
];
const TUFT = {}; // TUFT[region] = canvas : 6 variantes (lignes) × 5 inclinaisons (colonnes), cases 12×14
function tuftSheet(rg) {
  if (TUFT[rg]) return TUFT[rg];
  const P = GRASS_PAL[rg] || GRASS_PAL[0]; const c = document.createElement('canvas'); c.width = 12 * 5; c.height = 14 * 6; const x = c.getContext('2d');
  let s = 777 + rg * 31; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let v = 0; v < 6; v++) {
    const blades = []; const n = 3 + Math.floor(rnd() * 3);
    for (let b = 0; b < n; b++) blades.push({ bx: 3 + Math.floor(rnd() * 6), h: 5 + Math.floor(rnd() * 6), k: (rnd() - 0.5) * 1.2 });
    const fl = P.flower && rnd() < 0.3 ? P.flower[Math.floor(rnd() * P.flower.length)] : null;
    for (let f = 0; f < 5; f++) {
      const lean = f - 2; const ox = f * 12, oy = v * 14;
      for (const bl of blades) {
        for (let yy = 0; yy < bl.h; yy++) {
          const t = yy / bl.h; const px = Math.round(bl.bx + (lean + bl.k) * t * t * 1.4);
          x.fillStyle = t < 0.34 ? P.c[0] : t < 0.75 ? P.c[1] : P.c[2];
          x.fillRect(ox + px, oy + 13 - yy, 1, 1);
        }
      }
      if (fl) { const bl = blades[0]; const px = Math.round(bl.bx + (lean + bl.k) * 1.4); x.fillStyle = fl; x.fillRect(ox + px - 1, oy + 13 - bl.h, 2, 2); }
    }
  }
  return (TUFT[rg] = c);
}
function r25Grassy() {
  if (WORLD.grassy && WORLD.grassy.length === MW * MH) return WORLD.grassy;
  const g = new Uint8Array(MW * MH);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (WORLD.solid[y * MW + x]) continue;
    if (vget(x, y) === T_GRASS && vget(x + 1, y) === T_GRASS && vget(x, y + 1) === T_GRASS && vget(x + 1, y + 1) === T_GRASS) g[y * MW + x] = 1;
  }
  return (WORLD.grassy = g);
}
function tuftLean(px, py) {
  let l = Math.sin(G.t * 1.7 + px * 0.06 + py * 0.025) * 1.1 + Math.sin(G.t * 0.6 + px * 0.01) * 0.6;
  const P = G.player; if (P) { const dx = px - P.x, dy = py - P.y; if (Math.abs(dx) < 12 && Math.abs(dy) < 7) l = dx >= 0 ? 2.5 : -2.5; }
  return Math.max(-2, Math.min(2, Math.round(l)));
}
function forEachTuft(tx0, ty0, tx1, ty1, per, fn) {
  const gr = r25Grassy();
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
    if (!gr[y * MW + x]) continue;
    const rg = WORLD.region[y * MW + x]; const P = GRASS_PAL[rg] || GRASS_PAL[0];
    let h = hash(x * 7 + 3, y * 13 + 1);
    const n = Math.round(per * P.dens + ((h & 7) / 8 - 0.5));
    for (let i = 0; i < n; i++) { h = hash(h & 0xffff, i + 17); fn(x * TILE + (h & 31), y * TILE + 4 + ((h >> 5) % 28), rg, (h >> 10) % 6); }
  }
}
function drawTufts(ctx, cx, cy, per) {
  const x0 = Math.max(0, Math.floor(cx / TILE)), y0 = Math.max(0, Math.floor(cy / TILE));
  const x1 = Math.min(MW - 1, Math.floor((cx + W) / TILE)), y1 = Math.min(MH - 1, Math.floor((cy + H + 14) / TILE));
  forEachTuft(x0, y0, x1, y1, per, (px, py, rg, v) => {
    const f = tuftLean(px, py) + 2; ctx.drawImage(tuftSheet(rg), f * 12, v * 14, 12, 14, Math.round(px - 6 - cx), Math.round(py - 13 - cy), 12, 14);
  });
}

// ---------- sol : détail + grandes taches (casse la répétition des tuiles) ----------
function drawGroundTexture(ctx, cx, cy) {
  const T = r25Init();
  if (!T.pats.d) { T.pats.d = ctx.createPattern(T.detail, 'repeat'); T.pats.m = ctx.createPattern(T.macro, 'repeat'); }
  const z = G.zone || WORLD.zones[0]; const snow = z.id === 'neige';
  ctx.save(); ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = snow ? 0.12 : 0.2; ctx.translate(-(((cx % 768) + 768) % 768), -(((cy % 768) + 768) % 768)); ctx.fillStyle = T.pats.m; ctx.fillRect(0, 0, W + 768, H + 768);
  ctx.restore(); ctx.save(); ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = snow ? 0.18 : 0.3; ctx.translate(-(((cx % 256) + 256) % 256), -(((cy % 256) + 256) % 256)); ctx.fillStyle = T.pats.d; ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}
const _drawTerrain0 = drawTerrain;
drawTerrain = function (ctx, cx, cy) {
  _drawTerrain0(ctx, cx, cy);
  const Q = gfxQ();
  if (Q.tex) drawGroundTexture(ctx, cx, cy);
  if (Q.grass) drawTufts(ctx, cx, cy, Q.grass);
};

// ---------- ombres douces ----------
const _drawShadow0 = drawShadow;
drawShadow = function (ctx, x, y, w, a) {
  if (!gfxQ().soft) return _drawShadow0(ctx, x, y, w, a);
  const T = r25Init(); ctx.globalAlpha = Math.min(1, (a || 0.32) * 2.3);
  ctx.drawImage(T.shadow, Math.round(x - w * 1.1 + w * 0.12), Math.round(y - w * 0.58), Math.round(w * 2.2), Math.round(w));
  ctx.globalAlpha = 1;
};
const _drawProp0 = drawProp;
drawProp = function (ctx, p, cx, cy, alpha) {
  const d = p.def;
  if (gfxQ().soft && !d.flat && !d.sh && d.col && d.col[2] >= 16) {
    // ombre de contact sous les rochers, murs, maisons, tonneaux… (volume posé sur le sol)
    const w = d.col[2] * 0.62; const T = r25Init(); ctx.globalAlpha = alpha !== undefined ? 0.45 * alpha : 0.55;
    ctx.drawImage(T.shadow, Math.round(p.x - cx - w + w * 0.1), Math.round(p.y - cy - w * 0.36 - 1), Math.round(w * 2), Math.round(w * 0.72));
    ctx.globalAlpha = 1;
  }
  _drawProp0(ctx, p, cx, cy, alpha);
};
// herbe qui passe devant les pieds du joueur (profondeur)
const _drawPlayer0 = drawPlayer;
drawPlayer = function (ctx, P, cx, cy) {
  _drawPlayer0(ctx, P, cx, cy);
  if (!gfxQ().front || P.state === 'dead') return;
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
  forEachTuft(Math.max(0, tx - 1), Math.max(0, ty - 1), Math.min(MW - 1, tx + 1), Math.min(MH - 1, ty + 1), gfxQ().grass, (px, py, rg, v) => {
    if (py > P.y && py < P.y + 7 && Math.abs(px - P.x) < 10) { const f = tuftLean(px, py) + 2; ctx.drawImage(tuftSheet(rg), f * 12, v * 14, 12, 14, Math.round(px - 6 - cx), Math.round(py - 13 - cy), 12, 14); }
  });
};

// ---------- ambiance de région : étalonnage, brume, rayons, profondeur de champ ----------
const R25_ZONE = {
  village: { grade: 'rgb(255,232,186)', ga: 0.16, fog: '186,214,200', fa: 0.30, rays: 0.09 },
  forest: { grade: 'rgb(214,255,190)', ga: 0.14, fog: '170,205,180', fa: 0.34, rays: 0.08 },
  camp: { grade: 'rgb(255,214,170)', ga: 0.14, fog: '180,190,160', fa: 0.32, rays: 0.06 },
  ruins: { grade: 'rgb(150,170,220)', ga: 0.22, fog: '120,130,160', fa: 0.45, rays: 0 },
  desert: { grade: 'rgb(255,196,120)', ga: 0.2, fog: '240,214,166', fa: 0.36, rays: 0.12 },
  neige: { grade: 'rgb(176,206,255)', ga: 0.2, fog: '226,236,248', fa: 0.42, rays: 0.06 },
  marais: { grade: 'rgb(120,170,130)', ga: 0.24, fog: '128,160,138', fa: 0.48, rays: 0 },
  volcan: { grade: 'rgb(255,126,64)', ga: 0.22, fog: '120,64,44', fa: 0.4, rays: 0 },
  citadelle: { grade: 'rgb(130,92,210)', ga: 0.24, fog: '62,42,96', fa: 0.45, rays: 0 },
  boss: { grade: 'rgb(210,70,60)', ga: 0.2, fog: '70,30,30', fa: 0.4, rays: 0 }
};
function zoneLook(z) { return R25_ZONE[z.id] || R25_ZONE.forest; }
const R25B = { small: document.createElement('canvas'), band: document.createElement('canvas'), rays: document.createElement('canvas'), key: '' };
function r25Buffers() {
  const key = W + 'x' + H; if (R25B.key === key) return; R25B.key = key;
  const bh = Math.round(H * 0.3); R25B.bh = bh;
  R25B.small.width = Math.ceil(W / 3); R25B.small.height = Math.ceil(bh / 3);
  R25B.band.width = W; R25B.band.height = bh;
  const bc = R25B.band.getContext('2d'); const g = bc.createLinearGradient(0, 0, 0, bh); g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(0.55, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); R25B.mask = g;
  R25B.rays.width = W; R25B.rays.height = H; const rc = R25B.rays.getContext('2d');
  for (let i = 0; i < 6; i++) {
    const x0 = W * (i / 6) + 30 * Math.sin(i * 2.1), w = 18 + (i * 37) % 30;
    const gr = rc.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,248,214,0.9)'); gr.addColorStop(0.7, 'rgba(255,248,214,0.15)'); gr.addColorStop(1, 'rgba(255,248,214,0)');
    rc.fillStyle = gr; rc.beginPath(); rc.moveTo(x0, 0); rc.lineTo(x0 + w, 0); rc.lineTo(x0 + w + H * 0.55, H); rc.lineTo(x0 + H * 0.55, H); rc.closePath(); rc.fill();
  }
  R25B.fogG = {};
}
function drawAtmosphere(ctx) {
  const Q = gfxQ(); const z = G.zone || WORLD.zones[0]; const L = zoneLook(z);
  r25Buffers();
  if (Q.grade && L.ga) { ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = L.ga; ctx.fillStyle = L.grade; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  if (Q.dof) {
    // profondeur de champ : le haut de l'écran (le lointain) est légèrement flou
    const s = R25B.small, sc = s.getContext('2d'), b = R25B.band, bc = b.getContext('2d');
    sc.imageSmoothingEnabled = true; sc.globalCompositeOperation = 'copy'; sc.drawImage(cv, 0, 0, W, R25B.bh, 0, 0, s.width, s.height);
    bc.imageSmoothingEnabled = true; bc.globalCompositeOperation = 'copy'; bc.drawImage(s, 0, 0, W, R25B.bh);
    bc.globalCompositeOperation = 'destination-in'; bc.fillStyle = R25B.mask; bc.fillRect(0, 0, W, R25B.bh); bc.globalCompositeOperation = 'source-over';
    ctx.drawImage(b, 0, 0);
  }
  // brume atmosphérique vers le lointain
  const fk = L.fog + H; let fg = R25B.fogG[fk];
  if (!fg) { fg = ctx.createLinearGradient(0, 0, 0, H * 0.4); fg.addColorStop(0, 'rgba(' + L.fog + ',' + (L.fa * 0.6) + ')'); fg.addColorStop(1, 'rgba(' + L.fog + ',0)'); R25B.fogG[fk] = fg; }
  ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H * 0.4);
  if (Q.rays && L.rays && (G.darkSmooth || 0) < 0.2) {
    const off = ((G.t * 6) % (W / 6)); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = L.rays * 0.7 * (0.75 + Math.sin(G.t * 0.4) * 0.25);
    ctx.drawImage(R25B.rays, off - W / 6, 0); ctx.drawImage(R25B.rays, off - W / 6 + W, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
}
const _drawVignette0 = drawVignette;
drawVignette = function (ctx) {
  gfxAuto();
  if (G.mode === 'play') { try { drawAtmosphere(ctx); } catch (e) { console.warn('r25d', e); } }
  _drawVignette0(ctx);
};
