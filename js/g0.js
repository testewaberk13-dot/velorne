'use strict';
// =====================================================================
//  PHASE G0 — RENDU 2.5D SIMULÉ (canvas 2D, sans WebGL)
//  Sprites pixel art nets posés sur un décor à l'aspect volumétrique :
//  sol sans quadrillage (taches de couleur + grain + touffes d'herbe),
//  ombres portées longues, herbe qui se balance et s'écrase,
//  brume et profondeur de champ, rayons de lumière, étalonnage par région,
//  particules propres à chaque région. Qualité réglable (auto/haute/moyenne/basse).
//  Limite assumée : 2.5D SIMULÉ (aucune vraie 3D, pas de WebGL).
// =====================================================================
const G0 = { lvl: 2, max: 2, auto: true, acc: 0, n: 0, lastTs: 0, calm: 0, patch: null, grain: null, gpat: null, tuft: null, gr: null, ready: false, sil: {}, fog: [186, 211, 192], blur: null, ms: 16.7 };
const G0_REG_OF = { village: 0, boss: 0, ruins: 0, camp: 0, forest: 0, desert: 1, neige: 2, marais: 3, volcan: 4, citadelle: 5 };
// tons par région : brume [r,g,b], étalonnage [r,g,b,alpha], touffes [sombre, moyen, clair]
const G0_TONE = [
  { fog: [186, 211, 192], grade: [255, 233, 160, 0.07], tuft: ['#2f6a24', '#4f9a34', '#8cd05a'], mist: 0.07, rays: 1 },
  { fog: [236, 214, 160], grade: [255, 176, 80, 0.13], tuft: ['#9a7c3c', '#c8aa62', '#ecd9a0'], mist: 0.05, rays: 1 },
  { fog: [222, 236, 248], grade: [130, 184, 255, 0.13], tuft: ['#8aa6b8', '#c4dbe8', '#ffffff'], mist: 0.1, rays: 1 },
  { fog: [150, 168, 128], grade: [106, 140, 48, 0.15], tuft: ['#3c4a22', '#66763a', '#9eae52'], mist: 0.16, rays: 0 },
  { fog: [120, 64, 52], grade: [255, 92, 32, 0.12], tuft: ['#2e2220', '#5a3a30', '#d2602c'], mist: 0.1, rays: 0 },
  { fog: [112, 92, 150], grade: [122, 64, 192, 0.15], tuft: ['#2e2640', '#52446a', '#8a74b0'], mist: 0.1, rays: 0 },
];
function g0Reg(zone) { return zone && G0_REG_OF[zone.id] !== undefined ? G0_REG_OF[zone.id] : 0; }
function g0Level(l) { G0.lvl = clamp(l, 0, 2); }
function g0Apply() {
  const q = (typeof SET !== 'undefined' && SET.gfx) || 'auto'; let url = ''; try { url = new URLSearchParams(location.search).get('gfx') || ''; } catch (e) { }
  const m = url || q;
  G0.max = IS_TOUCH ? 1 : 2;
  if (m === 'high') { G0.auto = false; G0.max = 2; g0Level(2); }
  else if (m === 'med') { G0.auto = false; G0.max = 1; g0Level(1); }
  else if (m === 'low') { G0.auto = false; G0.max = 0; g0Level(0); }
  else { G0.auto = true; g0Level(G0.max); }
}
const G0_LABEL = { auto: 'automatique', high: 'haute', med: 'moyenne', low: 'basse' };
function g0Cycle() { const o = ['auto', 'high', 'med', 'low']; SET.gfx = o[(o.indexOf(SET.gfx || 'auto') + 1) % o.length]; saveSet(); g0Apply(); }
// qualité automatique : fenêtre glissante de 90 images
function g0Measure() {
  const now = performance.now(); const dt = now - G0.lastTs; G0.lastTs = now;
  if (dt > 100 || dt <= 0) return; // onglet masqué / pause
  G0.acc += dt; G0.n++;
  if (G0.n >= 90) {
    G0.ms = G0.acc / G0.n; G0.acc = 0; G0.n = 0;
    if (G0.auto) {
      if (G0.ms > 23 && G0.lvl > 0) { g0Level(G0.lvl - 1); G0.calm = 0; }
      else if (G0.ms < 15.5 && G0.lvl < G0.max) { if (++G0.calm >= 4) { g0Level(G0.lvl + 1); G0.calm = 0; } }
      else G0.calm = 0;
    }
  }
}
// ---------- bruit de valeur ----------
function g0vn(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const h = (a, b) => (hash(a + s * 131, b + s * 17) & 1023) / 1023;
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
}
const G0_PS = 3; // pixels de la carte de taches par tuile
function g0Init() {
  if (G0.ready || !WORLD.V) return; G0.ready = true;
  // 1. carte de taches de couleur à grande échelle
  const pw = MW * G0_PS, ph = MH * G0_PS; const pc = document.createElement('canvas'); pc.width = pw; pc.height = ph; const px = pc.getContext('2d'); const id = px.createImageData(pw, ph); const d = id.data;
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    const tx = x / G0_PS, ty = y / G0_PS;
    const n = 0.55 * g0vn(tx / 6, ty / 6, 1) + 0.3 * g0vn(tx / 2.4, ty / 2.4, 2) + 0.15 * g0vn(tx / 0.9, ty / 0.9, 3);
    const v = (n - 0.5) * 2.4, o = (y * pw + x) * 4;
    if (v > 0) { d[o] = 255; d[o + 1] = 244; d[o + 2] = 184; d[o + 3] = Math.min(60, v * 56); } else { d[o] = 10; d[o + 1] = 22; d[o + 2] = 44; d[o + 3] = Math.min(66, -v * 62); }
  }
  px.putImageData(id, 0, 0); G0.patch = pc;
  // 2. grain de sol (continu dans l'espace monde)
  const gc = document.createElement('canvas'); gc.width = gc.height = 128; const gx = gc.getContext('2d'); const R = mulberry(4242);
  for (let i = 0; i < 160; i++) { gx.fillStyle = `rgba(0,18,8,${0.1 + R() * 0.14})`; gx.fillRect(Math.floor(R() * 128), Math.floor(R() * 128), 1, 1); }
  for (let i = 0; i < 110; i++) { gx.fillStyle = `rgba(255,248,196,${0.08 + R() * 0.12})`; gx.fillRect(Math.floor(R() * 128), Math.floor(R() * 128), 1, 1); }
  for (let i = 0; i < 40; i++) { const x = Math.floor(R() * 126), y = Math.floor(R() * 126); gx.fillStyle = 'rgba(0,20,8,0.12)'; gx.fillRect(x, y, 2, 1); gx.fillStyle = 'rgba(255,255,210,0.1)'; gx.fillRect(x, y - 1, 1, 1); }
  G0.grain = gc; G0.gpat = ctx.createPattern(gc, 'repeat');
  // 3. masque des tuiles d'herbe pleine
  G0.gr = new Uint8Array(MW * MH);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) G0.gr[y * MW + x] = (vget(x, y) === T_GRASS && vget(x + 1, y) === T_GRASS && vget(x, y + 1) === T_GRASS && vget(x + 1, y + 1) === T_GRASS) ? 1 : 0;
  // 4. touffes d'herbe : 6 régions x 4 variantes x 4 poses (gauche, droite, droite-haute, écrasée)
  G0.tuft = [];
  for (let r = 0; r < 6; r++) {
    const cols = G0_TONE[r].tuft; const vars = [];
    for (let v = 0; v < 4; v++) {
      const frames = []; const R2 = mulberry(900 + r * 17 + v * 5);
      const blades = []; const nb = 3 + (v % 3); for (let b = 0; b < nb; b++) blades.push({ x: 1 + Math.floor(R2() * 6), h: 3 + Math.floor(R2() * 4), c: Math.floor(R2() * 2) });
      for (let f = 0; f < 4; f++) {
        const c = document.createElement('canvas'); c.width = 9; c.height = 9; const q = c.getContext('2d');
        const lean = f === 0 ? -1.4 : f === 1 ? 1.4 : f === 2 ? 0.2 : 0;
        for (const b of blades) {
          const hh = f === 3 ? 1 : b.h;
          for (let yy = 0; yy < hh; yy++) {
            const k = hh > 1 ? yy / (hh - 1) : 0; const xx = b.x + Math.round(lean * k) + (f === 3 ? (b.x % 2 ? 1 : -1) * yy : 0);
            q.fillStyle = yy === hh - 1 && f !== 3 ? cols[2] : (b.c ? cols[1] : cols[0]);
            q.fillRect(xx, 8 - yy, 1, 1);
          }
          q.fillStyle = 'rgba(0,0,0,0.2)'; q.fillRect(b.x, 8, 1, 1);
        }
        frames.push(c);
      }
      vars.push(frames);
    }
    G0.tuft.push(vars);
  }
  // 5. petits sprites de brume
  const f = document.createElement('canvas'); f.width = 160; f.height = 70; const fx = f.getContext('2d'); const g = fx.createRadialGradient(80, 35, 4, 80, 35, 78); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); fx.save(); fx.scale(1, 0.44); fx.fillStyle = g; fx.fillRect(0, 0, 160, 160); fx.restore(); G0.puff = f;
  G0.blur = { a: document.createElement('canvas'), b: document.createElement('canvas'), mask: null, w: 0, h: 0 };
}
// ---------- sol ----------
function g0Ground(ctx, cx, cy, zone) {
  if (!G0.ready) g0Init(); if (!G0.ready) return;
  const reg = g0Reg(zone);
  // taches de couleur à grande échelle (supprime le quadrillage)
  ctx.imageSmoothingEnabled = true; ctx.globalAlpha = 1;
  ctx.drawImage(G0.patch, cx * G0_PS / TILE, cy * G0_PS / TILE, W * G0_PS / TILE, H * G0_PS / TILE, 0, 0, W, H);
  ctx.imageSmoothingEnabled = false;
  // grain
  if (G0.lvl >= 1) { ctx.save(); ctx.translate(-(cx % 128), -(cy % 128)); ctx.globalAlpha = 0.85; ctx.fillStyle = G0.gpat; ctx.fillRect(0, 0, W + 128, H + 128); ctx.restore(); }
  // touffes d'herbe vivantes
  if (G0.lvl >= 1) {
    const per = G0.lvl >= 2 ? 3 : 2; const P = G.player; const t = G.t || 0;
    const x0 = Math.max(0, Math.floor(cx / TILE)), y0 = Math.max(0, Math.floor(cy / TILE)), x1 = Math.min(MW - 1, Math.floor((cx + W) / TILE)), y1 = Math.min(MH - 1, Math.floor((cy + H) / TILE));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (!G0.gr[ty * MW + tx]) continue;
      const rg = WORLD.region[ty * MW + tx]; const vs = G0.tuft[rg];
      for (let k = 0; k < per; k++) {
        const h = hash(tx * 7 + k * 131, ty * 13 + k * 17); const wx = tx * TILE + (h & 31), wy = ty * TILE + ((h >> 5) & 31);
        let fr = Math.floor((Math.sin(t * 1.5 + wx * 0.045 + wy * 0.03) + 1) * 0.99); // 0 gauche, 1 droite
        if (P && Math.abs(wx - P.x) < 15 && Math.abs(wy - P.y) < 11) fr = 3; // écrasée sous les pieds
        ctx.drawImage(vs[(h >> 10) & 3][fr], wx - 4 - cx, wy - 8 - cy);
      }
    }
  }
}
// ---------- décors : ombres portées + herbe qui bouge ----------
const G0_SWAY = { tallgrass1: 0.07, tallgrass2: 0.07, grass3: 0.06, fern: 0.045, bigfern: 0.04, reed1: 0.06, reed2: 0.06, grass1: 0.09, grass2: 0.09, conifer: 0.018, bush0: 0.022, bush1: 0.022, bush2: 0.022, bush3: 0.022, bush4: 0.022, bush5: 0.022, flower0: 0.1, flower1: 0.1, flower2: 0.1, flower3: 0.1, flower4: 0.1, flower5: 0.1 };
function g0Sil(p, r) {
  const d = p.def, key = d.im + '|' + r[0] + ',' + r[1] + ',' + r[2] + ',' + r[3];
  let c = G0.sil[key]; if (c) return c;
  const src = img(d.im); if (!src) return null;
  c = document.createElement('canvas'); c.width = r[2]; c.height = r[3]; const q = c.getContext('2d'); q.drawImage(src, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
  q.globalCompositeOperation = 'source-in'; q.fillStyle = 'rgb(6,10,26)'; q.fillRect(0, 0, r[2], r[3]); G0.sil[key] = c; return c;
}
const _drawProp0 = drawProp;
drawProp = function (ctx, p, cx, cy, alpha) {
  const d = p.def; const lvl = G0.lvl;
  if (lvl >= 1 && !d.flat && d.sh !== 0 && (d.col || d.fade)) {
    const r = propSprite(p); const h = r[3];
    if (h >= 26) {
      const s = g0Sil(p, r);
      if (s) {
        const dark = (G.darkSmooth || 0); const a = (alpha !== undefined ? alpha : 1) * (0.34 - dark * 0.18);
        const shx = Math.min(0.5, 44 / h), shy = Math.min(0.3, 20 / h);
        ctx.save(); ctx.globalAlpha = a;
        ctx.transform(1, 0, -shx, -shy, Math.round(p.x - cx - r[2] / 2 + shx * h), Math.round(p.y - cy + shy * h - 1));
        ctx.drawImage(s, 0, 0);
        ctx.restore(); ctx.globalAlpha = 1;
      }
    }
  }
  const amp = lvl >= 1 ? G0_SWAY[p.type] : 0;
  if (!amp) return _drawProp0(ctx, p, cx, cy, alpha);
  const r = propSprite(p); const bx = Math.round(p.x - cx), by = Math.round(p.y - cy);
  let s = Math.sin(G.t * 1.8 + p.x * 0.017 + p.y * 0.011) * amp + Math.sin(G.t * 0.7 + p.x * 0.05) * amp * 0.4;
  const P = G.player;
  if (P) { const dx = p.x - P.x, dy = p.y - P.y; if (Math.abs(dx) < 24 && dy > -8 && dy < 18) { const k = 1 - Math.hypot(dx, dy * 1.5) / 28; if (k > 0) s += (dx >= 0 ? 1 : -1) * k * 0.3; } }
  if (alpha !== undefined && alpha < 1) ctx.globalAlpha = alpha;
  if (d.sh) drawShadow(ctx, bx, by - 2, d.sh, 0.22);
  ctx.save(); ctx.translate(bx, by); ctx.transform(1, 0, -s, 1, 0, 0);
  ctx.drawImage(img(d.im), r[0], r[1], r[2], r[3], -Math.round(r[2] / 2), -r[3], r[2], r[3]);
  ctx.restore(); ctx.globalAlpha = 1;
};
// ---------- brume, profondeur de champ ----------
function g0Post(ctx, cx, cy) {
  g0Measure(); if (!G0.ready) return;
  const zone = G.zone || WORLD.zones[0]; const reg = g0Reg(zone); const T = G0_TONE[reg];
  for (let i = 0; i < 3; i++) G0.fog[i] = lerp(G0.fog[i], T.fog[i], 0.03);
  const fc = G0.fog.map(Math.round).join(',');
  const t = G.t || 0;
  // bancs de brume qui dérivent (parallaxe)
  if (G0.lvl >= 1) {
    const n = G0.lvl >= 2 ? 7 : 4; ctx.save();
    for (let i = 0; i < n; i++) {
      const w = 190 + (i % 3) * 70, hh = w * 0.42; const per = W + w * 2;
      const x = (((i * 211 + t * (4 + i * 1.3) - cx * 0.55) % per) + per) % per - w;
      const y = H * (0.22 + (i % 4) * 0.2) + Math.sin(t * 0.2 + i) * 8 - cy * 0.12 % 40;
      ctx.globalAlpha = T.mist * (reg === 3 ? 1.6 : 1) * (0.7 + 0.3 * Math.sin(t * 0.3 + i * 2));
      ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(G0.puff, x, y, w, hh);
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  // flou de profondeur sur le haut de l'écran (haute qualité)
  if (G0.lvl >= 2) {
    const bh = Math.round(H * 0.3), sw = Math.ceil(W / 3), sh = Math.ceil(bh / 3); const B = G0.blur;
    if (B.w !== W || B.h !== bh) {
      B.a.width = sw; B.a.height = sh; B.b.width = W; B.b.height = bh; B.w = W; B.h = bh;
      const m = document.createElement('canvas'); m.width = 2; m.height = bh; const mq = m.getContext('2d'); const g = mq.createLinearGradient(0, 0, 0, bh); g.addColorStop(0, 'rgba(0,0,0,0.78)'); g.addColorStop(1, 'rgba(0,0,0,0)'); mq.fillStyle = g; mq.fillRect(0, 0, 2, bh); B.mask = m;
    }
    const qa = B.a.getContext('2d'), qb = B.b.getContext('2d');
    qa.imageSmoothingEnabled = true; qa.drawImage(cv, 0, 0, W, bh, 0, 0, sw, sh);
    qb.globalCompositeOperation = 'source-over'; qb.clearRect(0, 0, W, bh); qb.imageSmoothingEnabled = true; qb.drawImage(B.a, 0, 0, sw, sh, 0, 0, W, bh);
    qb.globalCompositeOperation = 'destination-in'; qb.drawImage(B.mask, 0, 0, 2, bh, 0, 0, W, bh); qb.globalCompositeOperation = 'source-over';
    ctx.drawImage(B.b, 0, 0);
  }
  // dégradé atmosphérique : plus on regarde loin (haut de l'écran), plus c'est brumeux
  if (G0.lvl >= 1) {
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.5); g.addColorStop(0, `rgba(${fc},${0.5 * (reg === 3 ? 1.2 : 1)})`); g.addColorStop(1, `rgba(${fc},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.5);
  }
}
// ---------- lumière : rayons + étalonnage (appelé après l'éclairage) ----------
function g0Light(ctx, cx, cy) {
  if (!G0.ready || G0.lvl < 1) return;
  const zone = G.zone || WORLD.zones[0]; const reg = g0Reg(zone); const T = G0_TONE[reg]; const t = G.t || 0;
  const dark = G.darkSmooth || 0;
  if (T.rays && dark < 0.32) {
    const n = G0.lvl >= 2 ? 4 : 2; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const per = W + 260; const x = (((i * 181 + t * 5 - cx * 0.2) % per) + per) % per - 130; const w = 34 + (i % 2) * 18;
      const g = ctx.createLinearGradient(x, 0, x - 90, H * 0.85); const a = 0.075 * (1 - dark * 2.5) * (0.65 + 0.35 * Math.sin(t * 0.5 + i * 1.7));
      g.addColorStop(0, `rgba(255,240,190,${a})`); g.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w - 90, H * 0.85); ctx.lineTo(x - 90, H * 0.85); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  // étalonnage de couleur par région
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = T.grade[3]; ctx.fillStyle = `rgb(${T.grade[0]},${T.grade[1]},${T.grade[2]})`; ctx.fillRect(0, 0, W, H); ctx.restore();
}
// ---------- particules propres à chaque région ----------
const _ambient0 = ambientParticles;
ambientParticles = function (dt, zone, cx, cy) {
  const reg = g0Reg(zone); const k = G0.lvl >= 2 ? 1 : G0.lvl === 1 ? 0.6 : 0.3;
  if (reg === 0) {
    _ambient0(dt, zone, cx, cy);
    if (Math.random() < dt * 2.6 * k) part(cx + Math.random() * W, cy + Math.random() * H, { life: 5, vx: rnd(4, 10), vy: rnd(-4, 2), size: 1, col: 'rgba(255,246,190,0.85)', drag: 1, add: true });
    return;
  }
  const at = (fn) => { if (Math.random() < fn) return true; return false; };
  if (reg === 1) { if (at(dt * 7 * k)) part(cx - 10, cy + Math.random() * H, { life: 4.5, vx: rnd(40, 80), vy: rnd(-5, 5), size: 1, col: 'rgba(236,208,150,0.6)', drag: 1 }); }
  else if (reg === 2) { if (at(dt * 10 * k)) part(cx + Math.random() * W, cy - 6, { life: 6, vx: rnd(-6, 12), vy: rnd(18, 34), size: Math.random() < 0.3 ? 2 : 1, col: '#ffffff', drag: 1 }); }
  else if (reg === 3) {
    if (at(dt * 4 * k)) part(cx + Math.random() * W, cy + Math.random() * H, { life: 4, vx: rnd(-5, 5), vy: rnd(-9, -2), size: 1, col: '#c0ff9a', drag: 1, add: true });
    if (at(dt * 1.5 * k)) part(cx + Math.random() * W, cy + Math.random() * H, { life: 3, vx: rnd(-14, 14), vy: rnd(-10, 6), size: 1, col: '#f4ffc0', drag: 1, add: true });
  }
  else if (reg === 4) {
    if (at(dt * 8 * k)) part(cx + Math.random() * W, cy + H + 4, { life: 3.2, vx: rnd(-10, 10), vy: -rnd(24, 54), size: Math.random() < 0.4 ? 2 : 1, col: choice(['#ff8a3a', '#ffc15a', '#ff5a1a']), drag: 1, add: true });
    if (at(dt * 3 * k)) part(cx + Math.random() * W, cy - 6, { life: 6, vx: rnd(-4, 8), vy: rnd(10, 22), size: 1, col: 'rgba(150,140,140,0.6)', drag: 1 });
  }
  else { if (at(dt * 5 * k)) part(cx + Math.random() * W, cy + Math.random() * H, { life: 4, vx: rnd(-6, 6), vy: rnd(-14, -4), size: Math.random() < 0.3 ? 2 : 1, col: choice(['#b48aff', '#7a4ac8', '#e6d0ff']), drag: 1, add: true }); }
};
document.addEventListener('DOMContentLoaded', g0Apply); g0Apply();
