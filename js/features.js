'use strict';
// ===================== EXTRAS DE GAMEPLAY : voyage rapide, enchaînement de tués, champions =====================
// ---------- voyage rapide entre les villages découverts ----------
const TRAVEL = [
  { id: 'brumeval', n: 'Village de Brumeval', x: 48, y: 66 },
  { id: 'arkhan', n: 'Camp d\'Arkhan (désert)', x: 113, y: 37 },
  { id: 'vasebourg', n: 'Vasebourg (marais)', x: 48, y: 89 },
  { id: 'givrenuit', n: 'Village d\'Orélia (Pics de Givrenuit)', x: 210, y: 39 },
  { id: 'cendrefeu', n: 'Forge de Cendrefeu (volcan)', x: 112, y: 107 },
  { id: 'citadelle', n: 'Entrée de la Citadelle', x: 206, y: 108, gate: 1 }
];
const TRAVEL_COST = 25;
MENU_TABS.splice(3, 0, ['voyage', 'Voyage']);
function travelHTML() {
  const P = G.player, F = G.flags, fight = G.enemies.some(e => e.aggro && !e.dead && dist(e.x, e.y, P.x, P.y) < 500) || !!G.boss;
  let h = `<div class="guide"><div class="sk"><div><b>Voyage rapide</b><div style="margin-top:4px;line-height:1.45">Rends-toi dans un village déjà visité pour <b>${TRAVEL_COST} or</b>. Impossible pendant un combat.${fight ? '<br><b style="color:#ff8a5a">Combat en cours : voyage indisponible.</b>' : ''}</div></div></div>`;
  TRAVEL.forEach((t, i) => {
    const seen = F['seen_' + t.id] || t.id === 'brumeval', locked = t.gate && !gateOpen();
    h += `<div class="sk"><div><b>${seen && !locked ? t.n : '???'}</b><div style="opacity:.7">${locked ? 'Porte scellée' : seen ? '' : 'Pas encore découvert'}</div></div>${seen && !locked ? `<button data-travel="${i}" ${fight || P.gold < TRAVEL_COST ? 'disabled' : ''}>Y aller</button>` : ''}</div>`;
  });
  return h + '</div>';
}
function fastTravel(i) {
  const t = TRAVEL[i], P = G.player; if (!t || P.gold < TRAVEL_COST) return;
  if (G.enemies.some(e => e.aggro && !e.dead && dist(e.x, e.y, P.x, P.y) < 500) || G.boss) return toast('Impossible pendant un combat', '#ffb36b');
  P.gold -= TRAVEL_COST; closePanel(); P.x = t.x * TILE; P.y = t.y * TILE; flashScreen('#c4b5fd', 0.5); toast('Voyage vers ' + t.n, '#c4b5fd'); G.cam && (G.cam.x = P.x - W / 2, G.cam.y = P.y - H / 2);
}
const _openMenu0 = openMenu;
openMenu = function (tab) { if (tab === 'voyage') { menuTab = 'voyage'; } return _openMenu0(tab); };
setInterval(() => {
  try {
    if (!G || !G.player || G.mode !== 'play') return; const P = G.player;
    for (const t of TRAVEL) if (!G.flags['seen_' + t.id] && Math.hypot(P.x - t.x * TILE, P.y - t.y * TILE) < 11 * TILE) { G.flags['seen_' + t.id] = 1; if (t.id !== 'brumeval') toast('Lieu découvert : ' + t.n + ' — voyage rapide disponible (Menu → Voyage)', '#c4b5fd'); }
  } catch (e) { console.error('travel', e.message); }
}, 800);

// ---------- enchaînement de tués : bonus d'XP ----------
let _streak = { n: 0, t: -99 };
const _gainXp0 = gainXp;
gainXp = function (n) {
  if (G.t - _streak.t < 9 && _streak.n >= 3) n = Math.round(n * (1 + Math.min(0.5, (_streak.n - 2) * 0.05)));
  return _gainXp0(n);
};
const _qe1 = questEvent;
questEvent = function (t, a) { _qe1(t, a); if (t === 'kill') { _streak.n = (G.t - _streak.t < 9) ? _streak.n + 1 : 1; _streak.t = G.t; if (_streak.n >= 3 && _streak.n % 3 === 0) toast(`Enchaînement x${_streak.n} ! XP +${Math.round(Math.min(0.5, (_streak.n - 2) * 0.05) * 100)} %`, '#ffd23f'); } };
const _drawHUD1 = drawHUD;
drawHUD = function (ctx) { _drawHUD1(ctx); try { if (_streak.n >= 3 && G.t - _streak.t < 9) { const k = 1 - (G.t - _streak.t) / 9; txt(ctx, 'Chaîne x' + _streak.n, 6, 72, '#ffd23f', 8); ctx.fillStyle = '#ffd23f'; ctx.fillRect(6, 75, Math.round(46 * k), 2); } } catch (e) { } };

// ---------- champions : monstres élites dans les embuscades ----------
function makeChampion(e) {
  const d = e.def; if (d.boss) return;
  e.def = Object.assign({}, d, { name: 'Champion · ' + d.name, scale: (d.scale || 1) * 1.3, hp: d.hp * 2.6, dmg: d.dmg * 1.3, xp: d.xp * 4, gold: d.gold ? [d.gold[0] * 3, d.gold[1] * 3] : d.gold, r: (d.r || 14) * 1.2 });
  e.hp = e.maxhp = e.def.hp; e.champion = 1;
}
const _ambushNow0 = ambushNow;
setInterval(() => { try { const A = G && G.ambush; if (A && !A.champ) { A.champ = 1; if (Math.random() < 0.4 && A.list[0]) { makeChampion(A.list[0]); toast('Un CHAMPION mène l\'embuscade !', '#ffd23f'); } } } catch (e) { } }, 400);

// ---------- correctifs ----------
// les monstres volants ne traversent plus les murs de régions
const _enemyMove0 = enemyMove;
enemyMove = function (e, ang, spd, dt) {
  if (e.def.fly) { const ox = e.x, oy = e.y; const r = _enemyMove0(e, ang, spd, dt); if (regionWallBlocked(e.x - 8, e.y - 8, 16, 8)) { e.x = ox; e.y = oy; } return r; }
  return _enemyMove0(e, ang, spd, dt);
};
