'use strict';
// =====================================================================
//  ZONES SÛRES (canon V2 CONFIRMÉ — Bible maîtresse §4.3 et §7.5)
//  Les villages sont réellement sûrs : les monstres ordinaires n'y entrent pas,
//  ne ciblent pas le joueur qui s'y trouve, et ne peuvent pas le blesser.
//  À l'approche d'une limite, l'IA interrompt la poursuite et se retire.
//  Exception possible seulement si scénarisée : G.safeOverride = true (jamais aléatoire).
//  Rectangles en tuiles. Les boss ne sont jamais dans un village (arènes dédiées).
// =====================================================================
const SAFE_ZONES = [
  { id: 'brumeval', name: 'Village de Brumeval', x0: 28, y0: 49, x1: 70, y1: 72 },
  { id: 'arkhan', name: 'Camp d\'Arkhan', x0: 104, y0: 28, x1: 122, y1: 40 },
  { id: 'orelia', name: 'Village d\'Orélia', x0: 202, y0: 30, x1: 220, y1: 42 },
  { id: 'vasebourg', name: 'Pilotis de Vasebourg', x0: 40, y0: 80, x1: 58, y1: 92 },
  { id: 'forge', name: 'Forge de Cendrefeu', x0: 104, y0: 100, x1: 122, y1: 112 },
  { id: 'aldaran', name: 'Sanctuaire d\'Aldaran', x0: 200, y0: 100, x1: 214, y1: 112 },
];
function safeAt(x, y) {
  if (typeof G !== 'undefined' && G.safeOverride) return null;
  const tx = x / TILE, ty = y / TILE;
  for (const z of SAFE_ZONES) if (tx >= z.x0 && tx < z.x1 && ty >= z.y0 && ty < z.y1) return z;
  return null;
}
// pousse un monstre ordinaire hors de la zone sûre (par le bord le plus proche) et coupe sa poursuite
function safeEnforce(e) {
  if (e.def.boss || e.def.dummy || e.dead) return;
  const z = safeAt(e.x, e.y); if (!z) return;
  const T = TILE, m = 10;
  const dl = e.x - z.x0 * T, dr = z.x1 * T - e.x, dt = e.y - z.y0 * T, db = z.y1 * T - e.y; const mn = Math.min(dl, dr, dt, db);
  if (mn === dl) e.x = z.x0 * T - m; else if (mn === dr) e.x = z.x1 * T + m; else if (mn === dt) e.y = z.y0 * T - m; else e.y = z.y1 * T + m;
  e.aggro = false; e.kbx = e.kby = 0;
}
// annonce discrète à l'entrée d'une zone sûre
function safeAnnounce() {
  const P = G.player; if (!P) return;
  const z = safeAt(P.x, P.y);
  if (z && z.id !== G.safeId) { G.safeId = z.id; if (!G.safeToastT || G.t - G.safeToastT > 90) { G.safeToastT = G.t; if (typeof toast === 'function') toast('Zone sûre : les monstres ordinaires ne peuvent pas y entrer.', '#9fe6a8'); } }
  else if (!z) G.safeId = null;
}
