'use strict';
// ===================== chargement des images =====================
const IMG = {};
function loadImage(path) {
  if (IMG[path]) return IMG[path].p;
  const im = new Image();
  const p = new Promise((res) => { im.onload = () => res(im); im.onerror = () => { console.warn('img fail', path); res(im); }; });
  im.src = 'assets/' + path;
  IMG[path] = { im, p };
  return p;
}
function img(path) { return IMG[path] && IMG[path].im; }
async function loadAll(onprog) {
  const list = [];
  for (const k in CHARS.items) list.push(CHARS.items[k].file);
  for (const k in CHARS.looks) list.push(CHARS.looks[k].file);
  const need = new Set(['env/terrain_summer.png']); for (const k in PROPS) need.add(PROPS[k].im); need.forEach(p => list.push(p));
  for (const k in ENV.mon) { list.push(ENV.mon[k].img); if (ENV.mon[k].death) list.push(ENV.mon[k].death); }
  for (const k in ENV.fx) list.push(ENV.fx[k].img);
  list.push('ui/icons.png');
  ['spell_firelion', 'spell_icetacle', 'spell_lightning', 'spell_shield', 'spell_snakebite', 'spell_watertacle'].forEach(n => list.push('ui/' + n + '.png'));
  let done = 0;
  await Promise.all(list.map(p => loadImage(p).then(() => { done++; onprog && onprog(done / list.length); })));
}

// ===================== palettes / recoloration LPC =====================
function hexRGB(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function findPalette(mat, name) {
  const P = CHARS.palettes;
  if (P[mat + '_ulpc'] && P[mat + '_ulpc'][name]) return P[mat + '_ulpc'][name];
  for (const k in P) if (P[k][name]) return P[k][name];
  return null;
}
const RECOLOR_CACHE = {};
function recolored(itemId, choice) {
  const it = CHARS.items[itemId];
  const key = itemId + '|' + JSON.stringify(choice || {});
  if (RECOLOR_CACHE[key]) return RECOLOR_CACHE[key];
  const src = img(it.file);
  const pairs = [];
  for (const ch of it.ch) {
    const nm = choice && choice[ch.id];
    if (!nm) continue;
    const tgt = findPalette(ch.mat, nm);
    if (!tgt) continue;
    for (let i = 0; i < ch.src.length && i < tgt.length; i++) pairs.push([hexRGB(ch.src[i]), hexRGB(tgt[i])]);
  }
  if (!pairs.length) { RECOLOR_CACHE[key] = src; return src; }
  const cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
  const c = cv.getContext('2d'); c.drawImage(src, 0, 0);
  const id = c.getImageData(0, 0, cv.width, cv.height), d = id.data;
  const memo = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    let r = memo.get(k);
    if (r === undefined) {
      r = null; let bd = 36;
      for (const [s, t] of pairs) { const dd = Math.abs(s[0] - d[i]) + Math.abs(s[1] - d[i + 1]) + Math.abs(s[2] - d[i + 2]); if (dd < bd) { bd = dd; r = t; if (dd === 0) break; } }
      memo.set(k, r);
    }
    if (r) { d[i] = r[0]; d[i + 1] = r[1]; d[i + 2] = r[2]; }
  }
  c.putImageData(id, 0, 0);
  RECOLOR_CACHE[key] = cv;
  return cv;
}

// ===================== composition des personnages =====================
// equip : [{id, c:{color_1:..}}] -> sprite grille (une toile par animation)
function composeCharacter(equip) {
  const layers = [];
  for (const e of equip) {
    const it = CHARS.items[e.id];
    if (!it) continue;
    const src = recolored(e.id, e.c);
    for (const L of it.layers) layers.push({ z: L.z, a: L.a, src });
  }
  layers.sort((a, b) => a.z - b.z);
  const spr = { kind: 'grid', anims: {} };
  for (const an in CHARS.anims) {
    const [cols, rows] = CHARS.anims[an];
    let fs = 0;
    for (const L of layers) if (L.a[an] || (an === 'idle' && L.a.walk)) fs = Math.max(fs, (L.a[an] || L.a.walk).fs);
    if (an === 'idle' && !layers.some(L => L.a.idle)) fs = 0;
    if (!fs) continue;
    const cv = document.createElement('canvas'); cv.width = cols * fs; cv.height = rows * fs;
    const c = cv.getContext('2d');
    for (const L of layers) {
      let A = L.a[an];
      // pose d'attente : les couches sans animation dédiée (armes, ceinture…) reprennent la 1re image de marche
      if (!A && an === 'idle' && L.a.walk) { const W0 = L.a.walk; A = { fs: W0.fs, f: W0.f.map(row => [row[0], row[0]]) }; }
      if (!A) continue;
      const off = (fs - A.fs) / 2;
      for (let r = 0; r < A.f.length; r++) for (let k = 0; k < A.f[r].length; k++) {
        const f = A.f[r][k]; if (!f) continue;
        c.drawImage(L.src, f[0], f[1], f[2], f[3], k * fs + off + f[4], r * fs + off + f[5], f[2], f[3]);
      }
    }
    spr.anims[an] = { fs, cols, rows, cv };
  }
  return spr;
}
function lookSprite(id) { const L = CHARS.looks[id]; return { kind: 'packed', im: img(L.file), a: L.a }; }
function hasAnim(spr, an) { return spr.kind === 'grid' ? !!spr.anims[an] : !!spr.a[an]; }
function animLen(spr, an) { return CHARS.anims[an] ? CHARS.anims[an][0] : 1; }
// dessine l'image (pieds à x,y)
const FLASH = document.createElement('canvas'); FLASH.width = FLASH.height = 192;
const FLC = FLASH.getContext('2d');
function drawChar(ctx, spr, an, dir, fr, x, y, flash, alpha, sc) {
  sc = sc || 1;
  let src, sx, sy, sw, sh, dx, dy, fs;
  if (spr.kind === 'grid') {
    const A = spr.anims[an] || spr.anims.walk; if (!A) return;
    fs = A.fs; const r = A.rows === 1 ? 0 : dir; const k = Math.min(fr, A.cols - 1);
    src = A.cv; sx = k * fs; sy = r * fs; sw = fs; sh = fs; dx = x - fs / 2; dy = y - 60 - (fs - 64) / 2;
  } else {
    const A = spr.a[an] || spr.a.walk; if (!A) return;
    fs = A.fs; const r = A.f.length === 1 ? 0 : dir; const row = A.f[r]; const f = row[Math.min(fr, row.length - 1)];
    if (!f) return;
    src = spr.im; sx = f[0]; sy = f[1]; sw = f[2]; sh = f[3]; dx = x - fs / 2 + f[4]; dy = y - 60 - (fs - 64) / 2 + f[5];
  }
  if (sc !== 1) { dx = x + (dx - x) * sc; dy = y + (dy - y) * sc; }
  dx = Math.round(dx); dy = Math.round(dy); const dw = sw * sc, dh = sh * sc;
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  if (flash) {
    FLC.clearRect(0, 0, 192, 192); FLC.globalCompositeOperation = 'source-over';
    FLC.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
    FLC.globalCompositeOperation = 'source-atop'; FLC.fillStyle = flash; FLC.fillRect(0, 0, sw, sh);
    ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.drawImage(FLASH, 0, 0, sw, sh, dx, dy, dw, dh);
  } else ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
  if (alpha !== undefined) ctx.globalAlpha = 1;
}
function drawShadow(ctx, x, y, w, a) {
  ctx.fillStyle = 'rgba(10,8,20,' + (a || 0.32) + ')';
  ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), w, w * 0.42, 0, 0, Math.PI * 2); ctx.fill();
}
// petits monstres (feuilles 3x4, aller-retour)
function drawMon(ctx, key, dir, t, x, y, flash, alpha) {
  const M = ENV.mon[key]; const im = img(M.img); if (!im) return;
  const seq = [0, 1, 2, 1]; const k = seq[Math.floor(t * 8) % 4];
  const sx = k * M.fw, sy = dir * M.fh;
  const dx = Math.round(x - M.fw / 2), dy = Math.round(y - M.fh + 4);
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  if (flash) {
    FLC.clearRect(0, 0, 192, 192); FLC.globalCompositeOperation = 'source-over'; FLC.drawImage(im, sx, sy, M.fw, M.fh, 0, 0, M.fw, M.fh);
    FLC.globalCompositeOperation = 'source-atop'; FLC.fillStyle = flash; FLC.fillRect(0, 0, M.fw, M.fh);
    ctx.drawImage(im, sx, sy, M.fw, M.fh, dx, dy, M.fw, M.fh); ctx.drawImage(FLASH, 0, 0, M.fw, M.fh, dx, dy, M.fw, M.fh);
  } else ctx.drawImage(im, sx, sy, M.fw, M.fh, dx, dy, M.fw, M.fh);
  ctx.globalAlpha = 1;
}
function drawMonDeath(ctx, key, dir, k, x, y) {
  const M = ENV.mon[key]; if (!M.death) return; const im = img(M.death);
  const fw = 32, fh = 32; const sx = Math.min(4, k) * fw, sy = dir * fh;
  ctx.drawImage(im, sx, sy, fw, fh, Math.round(x - fw / 2), Math.round(y - fh + 4), fw, fh);
}
// effet animé (feuille de cases)
function drawFx(ctx, key, k, x, y, scale, alpha, comp) {
  const F = ENV.fx[key]; const im = img(F.img); if (!im) return;
  const n = F.cols * F.rows; k = Math.min(n - 1, Math.max(0, Math.floor(k)));
  const sx = (k % F.cols) * F.fw, sy = Math.floor(k / F.cols) * F.fh;
  const s = scale || 1; const w = F.fw * s, h = F.fh * s;
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  if (comp) ctx.globalCompositeOperation = comp;
  ctx.drawImage(im, sx, sy, F.fw, F.fh, Math.round(x - w / 2), Math.round(y - h / 2), w, h);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function fxFrames(key) { const F = ENV.fx[key]; return F.cols * F.rows; }
function drawIcon(ctx, name, x, y, s) {
  const p = ENV.icons[name]; if (!p) return; s = s || 1;
  ctx.drawImage(img('ui/icons.png'), p[0], p[1], 32, 32, x, y, 32 * s, 32 * s);
}
function iconCSS(name) { const p = ENV.icons[name]; if (!p) return ''; return `background-image:url(assets/ui/icons.png);background-position:-${p[0]}px -${p[1]}px;`; }
