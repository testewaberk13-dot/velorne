'use strict';
// ===================== Phase A — fondations du monde =====================
// ---------- ZONES SÛRES (canon) : aucun monstre ordinaire n'entre dans un village ni n'y attaque ----------
// Brumeval : zone du village entière ; autres villages : cercle autour de la place (PROPOSITION : rayons ajustables).
const SAFE_ZONES = [
  { id: 'brumeval', n: 'Brumeval', rect: [26, 48, 72, 72] },
  { id: 'arkhan', n: 'Camp d\'Arkhan', c: [113, 35], r: 8 },
  { id: 'vasebourg', n: 'Vasebourg', c: [48, 87], r: 7 },
  { id: 'orelia', n: 'Village d\'Orélia', c: [210, 37], r: 7 },
  { id: 'cendrefeu', n: 'Forge de Cendrefeu', c: [113, 106], r: 7 }
];
function safeZoneAt(x, y) {
  const tx = x / TILE, ty = y / TILE;
  for (const z of SAFE_ZONES) {
    if (z.rect) { if (tx >= z.rect[0] && tx < z.rect[2] && ty >= z.rect[1] && ty < z.rect[3]) return z; }
    else if (Math.hypot(tx - z.c[0], ty - z.c[1]) < z.r) return z;
  }
  return null;
}
function playerSafe() { const P = G.player; return !!(P && safeZoneAt(P.x, P.y)); }
const _enemyMoveA = enemyMove;
enemyMove = function (e, ang, spd, dt) {
  if (!e.def.boss && !e.def.dummy) {
    const k = (spd * dt) + 10, nx = e.x + Math.cos(ang) * k, ny = e.y + Math.sin(ang) * k;
    if (safeZoneAt(nx, ny) && !safeZoneAt(e.x, e.y)) { e.aggro = false; e.tx = e.home ? e.home.x : e.x; e.ty = e.home ? e.home.y : e.y; e.wanderT = 2; return true; }
  }
  return _enemyMoveA(e, ang, spd, dt);
};
// bannière à l'entrée / sortie d'une zone sûre
setInterval(() => {
  try {
    if (!G.player || G.mode !== 'play') return;
    const z = safeZoneAt(G.player.x, G.player.y), id = z ? z.id : null;
    if (id !== G.safeId) { if (G.safeId !== undefined) toast(z ? 'Zone sûre : ' + z.n + ' — les monstres n\'entrent pas ici' : 'Tu quittes la zone sûre', z ? '#9be7a8' : '#ffb36b'); G.safeId = id; }
  } catch (e) {}
}, 400);

// ---------- BROUILLARD DE CARTE (canon : carte révélée progressivement) ----------
// grille de 4×4 tuiles ; état sauvegardé dans G.flags.fog (base64) ; anciens joueurs : villages déjà vus révélés.
const FOG_C = 4; const FOG_W = Math.ceil(MW / FOG_C), FOG_H = Math.ceil(MH / FOG_C);
const FOG = { bits: null, cv: null, dirty: true };
function fogLoad() {
  FOG.bits = new Uint8Array(FOG_W * FOG_H);
  const s = G.flags && G.flags.fog;
  if (s) { try { const b = atob(s); for (let i = 0; i < FOG.bits.length; i++) FOG.bits[i] = (b.charCodeAt(i >> 3) >> (i & 7)) & 1; } catch (e) {} }
  else {
    const P = G.player; fogReveal(48 * TILE, 62 * TILE, 30);
    if (typeof TRAVEL !== 'undefined') for (const t of TRAVEL) if (G.flags['seen_' + t.id]) fogReveal(t.x * TILE, t.y * TILE, 14);
    if (P) fogReveal(P.x, P.y, 12);
  }
  FOG.player = G.player; FOG.dirty = true;
}
function fogSave() { let s = ''; for (let i = 0; i < FOG.bits.length; i += 8) { let c = 0; for (let k = 0; k < 8; k++) c |= (FOG.bits[i + k] || 0) << k; s += String.fromCharCode(c); } G.flags.fog = btoa(s); }
function fogReveal(x, y, rTiles) {
  const cx = x / TILE / FOG_C, cy = y / TILE / FOG_C, r = rTiles / FOG_C; let ch = false;
  for (let j = Math.max(0, Math.floor(cy - r)); j <= Math.min(FOG_H - 1, Math.ceil(cy + r)); j++) for (let i = Math.max(0, Math.floor(cx - r)); i <= Math.min(FOG_W - 1, Math.ceil(cx + r)); i++)
    if (!FOG.bits[j * FOG_W + i] && Math.hypot(i + 0.5 - cx, j + 0.5 - cy) <= r) { FOG.bits[j * FOG_W + i] = 1; ch = true; }
  if (ch) FOG.dirty = true; return ch;
}
function fogSeen(x, y) { if (!FOG.bits) return true; const i = Math.floor(x / TILE / FOG_C), j = Math.floor(y / TILE / FOG_C); return !!FOG.bits[j * FOG_W + i]; }
function drawFog(ctx, mx, my, mw, mh) {
  if (!FOG.bits) return;
  if (!FOG.cv) { FOG.cv = document.createElement('canvas'); FOG.cv.width = FOG_W; FOG.cv.height = FOG_H; }
  if (FOG.dirty) { const c = FOG.cv.getContext('2d'); const d = c.createImageData(FOG_W, FOG_H); for (let i = 0; i < FOG.bits.length; i++) { d.data[i * 4] = 14; d.data[i * 4 + 1] = 10; d.data[i * 4 + 2] = 24; d.data[i * 4 + 3] = FOG.bits[i] ? 0 : 245; } c.putImageData(d, 0, 0); FOG.dirty = false; }
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.drawImage(FOG.cv, mx, my, mw, mh); ctx.imageSmoothingEnabled = sm;
}
setInterval(() => {
  try {
    if (!G.player || G.mode !== 'play') return;
    if (FOG.player !== G.player) fogLoad();
    if (fogReveal(G.player.x, G.player.y, 12)) fogSave();
  } catch (e) {}
}, 500);
// ---------- GUIDAGE : actif (flèche à l'écran) ou léger (repère sur la minicarte seulement) ----------
if (!SET.guide) SET.guide = 'actif';
function guideLabel() { return SET.guide === 'leger' ? 'léger' : 'actif'; }
