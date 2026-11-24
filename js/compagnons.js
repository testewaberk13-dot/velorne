'use strict';
// =====================================================================
//  COMPAGNONS, CAMP ET CUISINE — PROPOSITION (module indépendant ; aucune donnée existante modifiée)
//  - Compagnons débloqués par les missions : Kaël (Q064, archer) et la panthère d'ombre (Q040, mêlée).
//  - Camp : onglet du menu. Repos (soins), sauvegarde, choix du compagnon, cuisine.
//  - Cuisine : repas préparés avec des matériaux existants ; bonus temporaires ; niveau de cuisinier.
//  État sauvegardé dans G.flags.camp (G.flags est déjà sauvegardé).
// =====================================================================
const COMPANIONS = {
  kael: { n: 'Kaël, chasseur', look: 'npc_m_arc', unlock: () => narrWs('compagnon_kael'), how: 'Mission « Kaël le chasseur » (Destinées personnelles).', range: 210, cd: 1.2, k: 0.45, desc: 'Archer : tire de loin sur les ennemis que tu combats.' },
  panthere: { n: 'Panthère d\'ombre', look: 'wolf_brute', unlock: () => narrWs('compagnon_panthere'), how: 'Mission « Le lien » (Créatures et liens).', range: 36, cd: 0.9, k: 0.55, desc: 'Mêlée : bondit sur les ennemis proches et les fait reculer.' }
};
const MEALS = [
  { id: 'ragout', n: 'Ragoût du chasseur', need: [['croc', 2], ['herbe', 1]], buff: { atk: 1.15 }, dur: 300, d: '+15 % d\'attaque pendant 5 min.' },
  { id: 'infusion', n: 'Infusion des marais', need: [['herbe', 2], ['gelee', 1]], buff: { regenHp: 3 }, dur: 300, d: '+3 PV par seconde pendant 5 min.' },
  { id: 'bouillon', n: 'Bouillon d\'écailles', need: [['ecaille_drake', 1], ['herbe', 2]], buff: { mag: 1.15 }, dur: 300, d: '+15 % de magie pendant 5 min.' },
  { id: 'soupe', n: 'Soupe de cristal', need: [['cristal_magique', 1], ['herbe', 1]], buff: { maxmp: 1.2, regenMp: 2 }, dur: 300, d: '+20 % de mana max. et +2 mana/s pendant 5 min.' },
  { id: 'festin', n: 'Festin des braves', need: [['cuir', 2], ['croc', 2], ['herbe', 2]], buff: { atk: 1.1, maxhp: 1.1 }, dur: 480, d: '+10 % d\'attaque et de PV max. pendant 8 min.' }
];
function CS() { const F = G.flags; if (!F.camp) F.camp = { comp: null, cook: 0, buff: null, rest: -999 }; return F.camp; }
function cookLevel() { return 1 + Math.floor(Math.sqrt(CS().cook || 0)); } // 1, puis 2 à 1 repas… courbe douce

// ---------- bonus de repas appliqués au calcul des statistiques (enveloppe) ----------
const _computeStatsC = computeStats;
computeStats = function (P) {
  const S = _computeStatsC(P);
  try { const b = G.flags && G.flags.camp && G.flags.camp.buff; if (b && b.left > 0) for (const k in b.mods) { if (k === 'regenHp' || k === 'regenMp') S[k] += b.mods[k]; else S[k] *= b.mods[k]; } } catch (e) { }
  return S;
};
function cook(r) {
  const P = G.player; for (const [it, q] of r.need) if (countItem(P, it) < q) return toast('Ingrédients manquants', '#ff9a9a');
  for (const [it, q] of r.need) takeItem(P, it, q);
  const C = CS(); C.cook = (C.cook || 0) + 1; const lv = cookLevel(); const dur = r.dur * (1 + (lv - 1) * 0.1);
  C.buff = { id: r.id, n: r.n, mods: r.buff, left: dur }; P.dirty = true; refreshStats(P);
  toast(`${r.n} : ${r.d.replace(/pendant .*/, '')}(${Math.round(dur / 60)} min)`, '#ffe27a'); sfx('level');
  if (typeof nLog === 'function') nLog('evenement', `Au camp, tu as préparé : <b>${r.n}</b>.`);
  openMenu('camp');
}
// ---------- compagnon actif ----------
let compNpc = null;
function compSync() {
  const C = CS(); const want = C.comp && COMPANIONS[C.comp] && COMPANIONS[C.comp].unlock() ? C.comp : null;
  if (compNpc && (!want || compNpc.compKey !== want)) { const i = G.npcs.indexOf(compNpc); if (i >= 0) G.npcs.splice(i, 1); compNpc = null; }
  if (want && !compNpc && G.player) { const D = COMPANIONS[want], P = G.player; compNpc = { look: D.look, spr: lookSprite(D.look), x: P.x - 30, y: P.y + 10, name: D.n, role: 'comp', comp: true, compKey: want, noTalk: true, dir: 2, t: 0, cdT: 0 }; G.npcs.push(compNpc); }
}
const _updateNpcC = updateNpc;
updateNpc = function (n, dt) {
  if (!n.comp) return _updateNpcC(n, dt);
  const P = G.player, D = COMPANIONS[n.compKey]; n.t += dt; n.cdT -= dt;
  const dP = dist(n.x, n.y, P.x, P.y);
  if (dP > 520) { n.x = P.x - 26; n.y = P.y + 12; } // rejoint le héros s'il est distancé (voyage, monture)
  // cible : l'ennemi vivant le plus proche du héros, déjà engagé
  let tgt = null, bd = 260; for (const e of G.enemies) { if (e.dead || !e.aggro) continue; const d = dist(e.x, e.y, P.x, P.y); if (d < bd) { bd = d; tgt = e; } }
  let tx = P.x - 28, ty = P.y + 14, spd = 150;
  if (tgt) { const d = dist(n.x, n.y, tgt.x, tgt.y); if (d > D.range * 0.85) { tx = tgt.x; ty = tgt.y; spd = 170; } else { tx = n.x; ty = n.y; n.dir = dirOf(tgt.x - n.x, tgt.y - n.y);
      if (n.cdT <= 0) { n.cdT = D.cd; const dmg = Math.round((8 + P.lvl * 4) * D.k * (0.85 + Math.random() * 0.3)); const a = Math.atan2(tgt.y - n.y, tgt.x - n.x);
        if (D.range > 100) for (let i = 0; i < 6; i++) part(n.x + (tgt.x - n.x) * i / 6, n.y - 20 + (tgt.y - n.y) * i / 6, { col: '#e8d8a0', life: 0.25, size: 2 });
        damageEnemy(tgt, dmg, false, Math.cos(a), Math.sin(a), D.range > 100 ? 40 : 120); } } }
  const d = dist(n.x, n.y, tx, ty);
  if (d > (tgt ? 4 : 34)) { const a = Math.atan2(ty - n.y, tx - n.x); n.bw = 12; n.bh = 6; moveBody(n, Math.cos(a) * spd * dt, Math.sin(a) * spd * dt); n.dir = dirOf(Math.cos(a), Math.sin(a)); n.moving = true; } else n.moving = false;
};
// ---------- onglet Camp ----------
if (typeof MENU_TABS !== 'undefined' && !MENU_TABS.some(t => t[0] === 'camp')) MENU_TABS.splice(MENU_TABS.findIndex(t => t[0] === 'quetes') + 1, 0, ['camp', 'Camp']);
const _openMenuC = openMenu;
openMenu = function (tab) {
  if (tab) menuTab = tab;
  if (menuTab !== 'camp') return _openMenuC(tab);
  sfx('ui'); const P = G.player, C = CS(); G.ui = { kind: 'menu' };
  const danger = G.boss || G.enemies.some(e => !e.dead && e.aggro && dist(e.x, e.y, P.x, P.y) < 420);
  const restCd = Math.max(0, Math.ceil(C.restLeft || 0));
  let h = '<div class="quests">';
  h += `<div class="q"><b>Feu de camp</b><p>${danger ? 'Impossible de camper : des ennemis sont trop proches.' : 'Tu installes un petit feu. Ici, tu peux te reposer, préparer un repas et choisir qui t\'accompagne.'}</p>`;
  if (!danger) h += `<button data-camp="rest" ${restCd ? 'disabled' : ''}>Se reposer${restCd ? ' (' + restCd + ' s)' : ' (PV et mana au maximum)'}</button> <button data-camp="save">Sauvegarder</button>`;
  h += '</div>';
  h += '<h4>Compagnon</h4>';
  for (const k in COMPANIONS) { const D = COMPANIONS[k], ok = D.unlock(); h += `<div class="q"><b>${D.n}</b>${C.comp === k ? ' <small>· avec toi</small>' : ''}<p>${ok ? D.desc : '??? — ' + D.how}</p>${ok ? `<button data-camp="comp:${C.comp === k ? '' : k}">${C.comp === k ? 'Le laisser au camp' : 'L\'emmener'}</button>` : ''}</div>`; }
  const b = C.buff && C.buff.left > 0 ? C.buff : null;
  h += `<h4>Cuisine <small>· niveau ${cookLevel()} (${C.cook || 0} repas)</small></h4>`;
  if (b) h += `<p class="hint">Repas actif : <b>${b.n}</b> — encore ${Math.ceil(b.left / 60)} min.</p>`;
  for (const r of MEALS) { const can = r.need.every(([it, q]) => countItem(P, it) >= q); h += `<div class="q"><b>${r.n}</b><p>${r.d}<br><small>${r.need.map(([it, q]) => `${q} × ${REG[it] ? REG[it].name : it} (${countItem(P, it)})`).join(' · ')}</small></p>${!danger ? `<button data-camp="cook:${r.id}" ${can ? '' : 'disabled'}>Cuisiner</button>` : ''}</div>`; }
  h += '<p class="hint">Chaque niveau de cuisinier allonge la durée des repas de 10 %. Un seul repas à la fois.</p></div>';
  openPanel(tabsHTML(MENU_TABS, 'camp', 'tab', `<span class="gold">${P.gold} or</span>`) + '<div class="pbody">' + h + '</div>', 'menu');
};
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-camp]'); if (!btn) return; e.stopPropagation();
  const v = btn.dataset.camp, P = G.player, C = CS();
  if (v === 'rest') { if ((C.restLeft || 0) > 0) return; C.restLeft = 120; P.hp = P.st8.maxhp; P.mp = P.st8.maxmp; toast('Tu te reposes au coin du feu. PV et mana restaurés.', '#9fe3ff'); if (typeof nLog === 'function') nLog('evenement', 'Une halte au coin du feu.'); openMenu('camp'); }
  else if (v === 'save') { saveGame(); toast('Partie sauvegardée', '#9fe3ff'); }
  else if (v.startsWith('comp:')) { C.comp = v.slice(5) || null; compSync(); toast(C.comp ? COMPANIONS[C.comp].n + ' t\'accompagne.' : 'Ton compagnon reste au camp.', '#e9d5ff'); openMenu('camp'); }
  else if (v.startsWith('cook:')) { const r = MEALS.find(x => x.id === v.slice(5)); if (r) cook(r); }
}, true);
// ---------- boucle légère ----------
setInterval(() => {
  try {
    if (!G || G.mode !== 'play' || !G.player || !G.flags) return;
    compSync();
    const C = CS(); if (!G.paused) { if (C.restLeft > 0) C.restLeft -= 0.6; if (C.buff && C.buff.left > 0) C.buff.left -= 0.6; }
    if (C.buff && C.buff.left <= 0 && !C.buff.ended) { C.buff.ended = 1; G.player.dirty = true; refreshStats(G.player); toast('L\'effet du repas se dissipe.', '#cbd5e1'); }
  } catch (e) { }
}, 600);
