'use strict';
// ===================== Phase A (2/2) — codex, titres, réputation, relations =====================
// Rangs de réputation et niveaux de relation : cahier des charges 2 (§20, §21). Seuils, gains et effets : PROPOSITIONS.
const REP_RANKS = ['Inconnu', 'Connu', 'Reconnu', 'Apprécié', 'Respecté', 'Éminent', 'Légendaire'];
const REP_AT = [0, 100, 300, 700, 1500, 3000, 6000];
const FACTIONS = {
  garde: { n: 'Garde des Routes', d: 'Protège les routes et les voyageurs. Réputation : chasser les monstres, aider les villages.' },
  artisans: { n: 'Cercle des Artisans', d: 'Forgerons, alchimistes et fabricants. Réputation : fabriquer et améliorer. Effet : réduction chez les marchands.' },
  cartographes: { n: 'Cartographes de l\'Aube', d: 'Explorateurs qui dressent la carte de Vélorne. Réputation : explorer. Effet : voyage rapide moins cher.' },
  vivant: { n: 'Gardiens du Vivant', d: 'Veillent sur les marais et les créatures. Réputation : libérer les marais.' },
  navigateurs: { n: 'Ligue des Navigateurs', d: 'Maîtres des mers et des côtes (régions maritimes à venir).' },
  archives: { n: 'Veilleurs des Archives', d: 'Gardiens du savoir ancien. Réputation : remplir le codex.' },
  cendre: { n: 'Ordre de la Cendre', d: 'Ordre forgé au cœur du volcan. Réputation : briser le sceau du cratère.' },
  pacte: { n: 'Pacte des Peuples Libres', d: 'Alliance des peuples du désert et des cimes. Réputation : briser les sceaux du désert et des Pics.' },
  voile: { n: 'Veilleurs du Voile', d: 'Surveillent la frontière entre le monde et Nyx. Réputation : affronter Malvorak.' }
};
const REL_LV = ['Méfiance', 'Indifférence', 'Connaissance', 'Confiance', 'Amitié', 'Lien profond'];
const REL_AT = [-1e9, 0, 20, 60, 120, 220];
const TITLES = [
  { id: 'eveille', n: 'l\'Éveillé', r: 1, d: 'Faire révéler sa magie innée.', ok: P => !!P.magic },
  { id: 'initie', n: 'l\'Initié', r: 1, d: 'Apprendre un premier style de combat.', ok: P => Object.keys(P.stylesKnown || {}).length >= 1 },
  { id: 'voyageur', n: 'le Voyageur', r: 1, d: 'Découvrir 4 régions.', ok: () => Object.keys(codex().r).length >= 4 },
  { id: 'chasseur', n: 'le Chasseur', r: 1, d: 'Vaincre 100 monstres.', ok: P => (P.kills || 0) >= 100 },
  { id: 'ami', n: 'l\'Ami des villages', r: 1, d: 'Atteindre « Amitié » avec un habitant.', ok: () => Object.values(relData()).some(v => v >= REL_AT[4]) },
  { id: 'fleau_orcs', n: 'le Fléau des orcs', r: 2, d: 'Vaincre Grakhul, le Chef orc.', ok: () => !!G.flags.bossDead },
  { id: 'cartographe', n: 'le Cartographe', r: 2, d: 'Révéler la moitié de la carte.', ok: () => fogRatio() >= 0.5 },
  { id: 'savant', n: 'le Savant', r: 2, d: 'Réunir 40 entrées dans le codex.', ok: () => codexCount() >= 40 },
  { id: 'trois_armes', n: 'aux Trois Armes', r: 2, d: 'Apprendre 3 styles de combat.', ok: P => Object.keys(P.stylesKnown || {}).length >= 3 },
  { id: 'briseur', n: 'le Briseur de sceaux', r: 3, d: 'Briser les quatre sceaux noirs.', ok: () => typeof SEAL_KEYS !== 'undefined' && SEAL_KEYS.every(k => G.flags[SAGA[k].flag]) },
  { id: 'sept_armes', n: 'Maître des sept armes', r: 3, d: 'Apprendre les sept styles de combat.', ok: P => Object.keys(P.stylesKnown || {}).length >= 7 },
  { id: 'legende', n: 'la Légende de Vélorne', r: 3, d: 'Vaincre Malvorak.', ok: () => typeof sagaDone === 'function' && sagaDone() }
];
const TITLE_RAR = { 1: ['Ordinaire', '#d7dce4'], 2: ['Rare', '#4aa3ff'], 3: ['Prestigieux', '#ffb43a'] };

function codex() { const f = G.flags; if (!f.codex) f.codex = { r: {}, p: {}, c: {}, m: {} }; return f.codex; }
function codexCount() { const c = codex(); return Object.keys(c.r).length + Object.keys(c.p).length + Object.keys(c.c).length + Object.keys(c.m).length; }
function codexAdd(cat, key, label) { const c = codex(); if (c[cat][key]) return false; c[cat][key] = label || 1; repGain('archives', 8); return true; }
function repData() { if (!G.flags.rep) G.flags.rep = {}; return G.flags.rep; }
function repRank(f) { const v = repData()[f] || 0; let r = 0; for (let i = 0; i < REP_AT.length; i++) if (v >= REP_AT[i]) r = i; return r; }
function repGain(f, n) {
  const R = repData(); const before = R[f] === undefined ? -1 : repRank(f); R[f] = (R[f] || 0) + n; const after = repRank(f);
  if (before === -1) toast('Faction découverte : ' + FACTIONS[f].n, '#c4b5fd');
  else if (after > before) toast(FACTIONS[f].n + ' : rang « ' + REP_RANKS[after] + ' »', '#ffe27a');
}
function relData() { if (!G.flags.rel) G.flags.rel = {}; return G.flags.rel; }
function relLevel(name) { const v = relData()[name]; if (v === undefined) return 1; let l = 0; for (let i = 0; i < REL_AT.length; i++) if (v >= REL_AT[i]) l = i; return l; }
function relGain(name, n) {
  const R = relData(); const before = relLevel(name); R[name] = (R[name] || 0) + n; const after = relLevel(name);
  if (after > before && after >= 2) {
    toast(name.split(',')[0] + ' : relation « ' + REL_LV[after] + ' »', '#9be7a8');
    if (after === 4 && G.player) { giveItem(G.player, 'potion', 2, 'Cadeau : ' + name.split(',')[0]); toast('Cadeau d\'amitié : 2 potions', '#9be7a8'); }
  }
}
function fogRatio() { if (typeof FOG === 'undefined' || !FOG.bits) return 0; let n = 0; for (const b of FOG.bits) n += b; return n / FOG.bits.length; }
// effets concrets : réduction marchande (relation avec le marchand + rang Artisans), voyage moins cher (rang Cartographes)
function shopDiscount() { const n = G.shopNpc; let d = [0, 0, 0, 0.05, 0.1, 0.15][n ? relLevel(n.name) : 1] || 0; d += [0, 0, 0.02, 0.04, 0.06, 0.08, 0.1][repRank('artisans')]; return Math.min(0.22, d); }
function buyPrice(d) { return Math.max(1, Math.round(basePrice(d) * (1 - shopDiscount()))); }
function travelCost() { return Math.max(10, 25 - 2 * repRank('cartographes')); }
function currentTitle() { const id = G.flags.title; const t = TITLES.find(x => x.id === id); return t || null; }

// ---------- branchements ----------
const _interactP = interact;
interact = function (n) {
  try {
    if (n && n.name && n.role) {
      codexAdd('p', n.name, n.name);
      const R = relData(); const now = G.t;
      if (R[n.name] === undefined) relGain(n.name, 20); // première rencontre : Connaissance
      else { G.relT = G.relT || {}; if (!G.relT[n.name] || now - G.relT[n.name] > 90) { G.relT[n.name] = now; relGain(n.name, 3); } }
    }
  } catch (e) { console.warn(e); }
  return _interactP(n);
};
const _killEnemyP = killEnemy;
killEnemy = function (e) {
  const r = _killEnemyP(e);
  try { if (!e.def.dummy) { if (codexAdd('c', e.kind, e.def.name || e.kind)) toast('Codex : ' + (e.def.name || e.kind), '#c4b5fd'); if ((G.player.kills || 0) % 5 === 0) repGain('garde', e.def.boss ? 120 : 6); } } catch (er) {}
  return r;
};
const _giveItemP = giveItem;
giveItem = function (P, id, n, origin, quiet) {
  const r = _giveItemP(P, id, n, origin, quiet);
  try { if (origin && /fabri|forg|amélior|alchim|craft/i.test(origin) && G.flags) repGain('artisans', 15); } catch (e) {}
  return r;
};
let _progFog = 0;
setInterval(() => {
  try {
    const P = G.player; if (!P || G.mode !== 'play') return;
    if (G.zone) codexAdd('r', G.zone.id, G.zone.name);
    if (P.magic) codexAdd('m', P.magic, MAGIC_DATA[P.magic].n); if (P.magic2) codexAdd('m', P.magic2, MAGIC_DATA[P.magic2].n);
    // exploration -> Cartographes
    const fr = Math.floor(fogRatio() * 1000); if (_progFog && fr > _progFog) repGain('cartographes', (fr - _progFog) * 4); _progFog = fr;
    // quêtes secondaires terminées -> relation avec le donneur + Garde des Routes
    const Q = G.quests; if (Q && Q.side && typeof SIDEQ !== 'undefined') { G.flags.sqc = G.flags.sqc || {}; for (const q of SIDEQ) { const s = Q.side[q.id]; if (s && s.st === 2 && !G.flags.sqc[q.id]) { G.flags.sqc[q.id] = 1; const n = G.npcs.find(x => x.saga === q.npc); if (n) relGain(n.name, 40); repGain('garde', 60); } } }
    // sceaux et saga -> factions régionales
    const SEAL_F = { desert: 'pacte', neige: 'pacte', marais: 'vivant', volcan: 'cendre' }; G.flags.repSeal = G.flags.repSeal || {};
    if (typeof SAGA !== 'undefined') for (const k in SEAL_F) if (SAGA[k] && G.flags[SAGA[k].flag] && !G.flags.repSeal[k]) { G.flags.repSeal[k] = 1; repGain(SEAL_F[k], 800); }
    if (G.flags.bossDead && !G.flags.repSeal.orc) { G.flags.repSeal.orc = 1; repGain('garde', 300); }
    if (typeof sagaDone === 'function' && sagaDone() && !G.flags.repSeal.final) { G.flags.repSeal.final = 1; repGain('voile', 3000); }
    // titres
    G.flags.titles = G.flags.titles || {};
    for (const t of TITLES) if (!G.flags.titles[t.id] && t.ok(P)) { G.flags.titles[t.id] = 1; toast('Titre obtenu : ' + P.name + ' ' + t.n + ' (' + TITLE_RAR[t.r][0] + ')', TITLE_RAR[t.r][1]); }
  } catch (e) { console.warn('progression', e); }
}, 1000);

// ---------- onglet « Codex » du menu ----------
MENU_TABS.splice(4, 0, ['codex', 'Codex']);
function codexHTML(P) {
  const c = codex(), T = G.flags.titles || {}, R = repData(), L = relData();
  const box = (t, inner) => `<div class="sk"><div style="width:100%"><b>${t}</b><div style="margin-top:4px;line-height:1.5">${inner}</div></div></div>`;
  const cur = currentTitle();
  let h = '<div class="guide">';
  h += box('Titres' + (cur ? ' — porté : ' + esc(P.name) + ' ' + cur.n : ''), TITLES.map(t => { const own = T[t.id]; const col = TITLE_RAR[t.r][1]; return `<div style="display:flex;justify-content:space-between;gap:6px;align-items:center;opacity:${own ? 1 : 0.55}"><span><b style="color:${col}">${own ? t.n : '???'}</b> <small>(${TITLE_RAR[t.r][0]})</small><br><small>${t.d}</small></span>${own ? `<button data-title="${t.id}">${G.flags.title === t.id ? 'Porté' : 'Porter'}</button>` : ''}</div>`; }).join(''));
  h += box('Réputation auprès des factions', Object.keys(FACTIONS).map(f => { const known = R[f] !== undefined; if (!known) return `<div style="opacity:.5">??? <small>— faction pas encore rencontrée</small></div>`; const r = repRank(f), v = R[f], nx = REP_AT[r + 1]; return `<div><b>${FACTIONS[f].n}</b> : ${REP_RANKS[r]} <small>(${v}${nx ? ' / ' + nx : ''})</small><br><small>${FACTIONS[f].d}</small></div>`; }).join('') + `<small>Effets actuels : réduction marchande de base ${Math.round([0, 0, 0.02, 0.04, 0.06, 0.08, 0.1][repRank('artisans')] * 100)} %, voyage rapide ${travelCost()} or.</small>`);
  const met = Object.keys(L);
  h += box('Relations', met.length ? met.map(n => `<div>${esc(n)} : <b>${REL_LV[relLevel(n)]}</b></div>`).join('') + '<small>Confiance : −5 % chez ce marchand · Amitié : −10 % et un cadeau · Lien profond : −15 %.</small>' : 'Parle aux habitants pour faire connaissance.');
  const list = (o) => Object.values(o).length ? Object.values(o).map(v => esc(String(v))).join(' · ') : '<i>rien encore</i>';
  h += box('Codex (' + codexCount() + ' entrées)', `<b>Régions</b> : ${list(c.r)}<br><b>Personnages</b> : ${list(c.p)}<br><b>Créatures</b> : ${list(c.c)}<br><b>Magies</b> : ${list(c.m)}`);
  h += '<small style="opacity:.7">Seuils, gains et effets de la réputation, des relations et des titres : propositions à valider.</small></div>';
  return h;
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-title]'); if (!b) return;
  G.flags.title = G.flags.title === b.dataset.title ? null : b.dataset.title; sfx('ui'); openMenu('codex');
});
const _persoHTMLP = persoHTML;
persoHTML = function (P) { const t = currentTitle(); return (t ? `<p style="text-align:center;margin:0 0 4px"><b style="color:${TITLE_RAR[t.r][1]}">${esc(P.name)} ${t.n}</b></p>` : '') + _persoHTMLP(P); };
