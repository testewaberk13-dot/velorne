'use strict';
// ===================== MONDE VIVANT : embuscades + quêtes secondaires =====================
// ---------- embuscades ----------
const AMBUSH = {
  forest: { k: ['goblin_rogue', 'wolf_brute', 'orc_warrior', 'bee'], say: 'Des brigands surgissent des fourrés !' },
  ruins: { k: ['skeleton_archer', 'bat', 'dark_mage'], say: 'Des morts se relèvent autour de toi !' },
  camp: { k: ['goblin_rogue', 'orc_warrior'], say: 'Les gobelins te tendent un piège !' },
  desert: { k: ['chacal', 'pillard', 'serpent_sable', 'guerrier_sable'], say: 'Des pillards jaillissent des dunes !' },
  neige: { k: ['loup_neiges', 'ogre_glace', 'squelette_gele', 'mage_givre'], say: 'Une meute sort de la tempête !' },
  marais: { k: ['gelee_toxique', 'moustique', 'ombre_marais', 'revenant'], say: 'Le marais s\'agite : des créatures t\'encerclent !' },
  volcan: { k: ['salamandre', 'chauve_ardente', 'orc_forge', 'mage_cendre'], say: 'Des créatures de braise t\'encerclent !' },
  citadelle: { k: ['chevalier_demon', 'cultiste', 'garde_ossements'], say: 'Des sbires de Malvorak te cernent !' }
};
let _amb = { dist: 0, need: 4200, last: 0, px: 0, py: 0 };
function ambushNow(force) {
  const P = G.player, z = G.zone; if (!z || !AMBUSH[z.id] || G.ambush) return false;
  const A = AMBUSH[z.id]; toast('Des bruits suspects autour de toi…', '#ffb36b');
  G.later = G.later || [];
  G.later.push({ t: 1.4, fn: () => {
    if (G.mode !== 'play' || !G.player || G.ambush) return;
    const P = G.player, n = 3 + (P.lvl > 8 ? 1 : 0) + (P.lvl > 18 ? 1 : 0), kinds = [A.k[Math.floor(Math.random() * A.k.length)], A.k[Math.floor(Math.random() * A.k.length)]];
    const list = []; let tries = 0;
    while (list.length < n && tries++ < 60) {
      const a = Math.random() * 6.28, r = 230 + Math.random() * 120, x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r;
      if (rectBlocked(x - 8, y - 8, 16, 8)) continue;
      const e = spawnEnemy(kinds[list.length % 2], x, y); e.aggro = true; e.ambush = 1; list.push(e);
    }
    if (!list.length) return;
    G.ambush = { list, zone: G.zone.id, n: list.length };
    toast('EMBUSCADE ! ' + A.say, '#ff8a5a'); flashScreen('#ff5a3a', 0.28); shake(5); try { sfx('roar'); } catch (e) { }
  } });
  return true;
}
setInterval(() => {
  try {
    if (!G || !G.player || G.mode !== 'play' || G.paused || G.ui || G.dlg) return;
    const P = G.player, z = G.zone;
    // embuscade en cours : fin ou abandon
    if (G.ambush) {
      const A = G.ambush, alive = A.list.filter(e => !e.dead && G.enemies.includes(e));
      if (!alive.length) {
        const gold = Math.round(A.n * (25 + P.lvl * 3) * (1 + ['forest', 'ruins', 'camp', 'desert', 'marais', 'neige', 'volcan', 'citadelle'].indexOf(A.zone) * 0.15));
        P.gold += gold; toast(`Embuscade repoussée ! +${gold} or`, '#ffe27a'); if (Math.random() < 0.35) giveItem(P, 'potion', 1, 'Butin d\'embuscade');
        G.ambush = null; _amb.dist = 0; _amb.need = 3600 + Math.random() * 3200; _amb.last = G.t;
      } else if ((z && z.id === 'village') || alive.every(e => dist(e.x, e.y, P.x, P.y) > 900)) { for (const e of alive) e.dead = true, e.deadT = 9; G.ambush = null; _amb.dist = 0; }
      return;
    }
    // distance parcourue
    if (_amb.px) _amb.dist += Math.min(400, dist(P.x, P.y, _amb.px, _amb.py)); _amb.px = P.x; _amb.py = P.y;
    if (!z || !AMBUSH[z.id] || G.boss || !hasStyle(P) || G.t - _amb.last < 40) return;
    if (G.enemies.some(e => e.aggro && !e.dead && dist(e.x, e.y, P.x, P.y) < 500)) return;
    if (_amb.dist > _amb.need) { _amb.dist = 0; ambushNow(); }
  } catch (e) { }
}, 500);

// ---------- quêtes secondaires ----------
const SIDEQ = [
  { id: 'nuisibles', npc: 'bourg', n: 'Nuisibles de la forêt', desc: 'Les gelées, abeilles et serpents saccagent nos récoltes. Élimines-en <b>8</b>.', t: 'kill', k: ['slime', 'bee', 'snake'], c: 8, gold: 90, xp: 60, it: ['potion', 2] },
  { id: 'osfoss', npc: 'bourg', n: 'Archers du cimetière', desc: 'Des archers squelettes tirent sur les voyageurs, à l\'ouest. Détruis-en <b>6</b>.', t: 'kill', k: ['skeleton_archer'], c: 6, gold: 160, xp: 100, it: ['sceau_lame', 1] },
  { id: 'crocs', npc: 'bourg', n: 'Crocs de bêtes', desc: 'Rapporte-moi <b>4 crocs de bête</b> (loups, chacals, serpents) : un artisan en a besoin.', t: 'item', i: 'croc', c: 4, gold: 140, xp: 80, it: ['potion', 2] },
  { id: 'pillards', npc: 'desert', n: 'Pillards des dunes', desc: 'Les pillards attaquent nos caravanes. Élimines-en <b>6</b>.', t: 'kill', k: ['pillard'], c: 6, gold: 280, xp: 180, it: ['potion', 2] },
  { id: 'ecailles', npc: 'desert', n: 'Écailles de drake', desc: 'Les guerriers des sables portent des écailles précieuses. Rapporte-m\'en <b>3</b>.', t: 'item', i: 'ecaille_drake', c: 3, gold: 340, xp: 200, it: ['mithril', 1] },
  { id: 'gelees', npc: 'marais', n: 'Gelées toxiques', desc: 'Les gelées empoisonnent l\'eau du village. Détruis-en <b>6</b>.', t: 'kill', k: ['gelee_toxique'], c: 6, gold: 380, xp: 240, it: ['potion', 3] },
  { id: 'cristaux', npc: 'marais', n: 'Cristaux magiques', desc: 'Je prépare un remède : il me faut <b>3 cristaux magiques</b> (ombres du marais).', t: 'item', i: 'cristal_magique', c: 3, gold: 440, xp: 260, it: ['eclat_exception', 1] },
  { id: 'loupsb', npc: 'neige', n: 'La meute blanche', desc: 'Les loups des neiges attaquent le village. Abats-en <b>6</b>.', t: 'kill', k: ['loup_neiges'], c: 6, gold: 560, xp: 340, it: ['potion', 3] },
  { id: 'archers', npc: 'neige', n: 'Archers gelés', desc: 'Des squelettes gelés tirent depuis le brouillard. Détruis-en <b>5</b>.', t: 'kill', k: ['squelette_gele'], c: 5, gold: 600, xp: 360, it: ['mithril', 1] },
  { id: 'salam', npc: 'volcan', n: 'Salamandres', desc: 'Les salamandres rongent nos conduites de lave. Élimines-en <b>5</b>.', t: 'kill', k: ['salamandre'], c: 5, gold: 760, xp: 450, it: ['potion', 3] },
  { id: 'cendres', npc: 'volcan', n: 'Cendres pures', desc: 'La forge manque de cendres. Rapporte-moi <b>5 cendres</b>.', t: 'item', i: 'cendres', c: 5, gold: 820, xp: 480, it: ['eclat_exception', 1] },
  { id: 'chev', npc: 'final', n: 'Chevaliers déchus', desc: 'Les chevaliers démons étaient mes soldats. Libère-les : détruis-en <b>4</b>.', t: 'kill', k: ['chevalier_demon'], c: 4, gold: 1300, xp: 800, it: ['mithril', 2] }
];
function sideState(id) { const Q = G.quests; Q.side = Q.side || {}; return Q.side[id]; }
function sideCount(q) { const s = sideState(q.id); if (!s) return 0; return q.t === 'item' ? Math.min(q.c, countItem(G.player, q.i)) : Math.min(q.c, s.n || 0); }
function sideKill(kind) {
  const Q = G.quests; if (!Q.side) return;
  for (const q of SIDEQ) { const s = Q.side[q.id]; if (q.t !== 'kill' || !s || s.st !== 1 || !q.k.includes(kind)) continue; s.n = (s.n || 0) + 1; if (s.n === q.c) toast(`Quête « ${q.n} » : objectif atteint ! Retourne voir le donneur`, '#ffe27a'); else if (s.n < q.c) toast(`${q.n} : ${s.n}/${q.c}`, '#c4b5fd'); }
}
const _questEvent0 = questEvent;
questEvent = function (t, a) { _questEvent0(t, a); if (t === 'kill') sideKill(a); };
function sideMenu(n) {
  const list = SIDEQ.filter(q => q.npc === n.saga), P = G.player;
  const btns = [];
  for (const q of list) {
    const s = sideState(q.id); if (s && s.st === 2) continue;
    if (!s) btns.push([`${q.n} (nouvelle)`, () => dialog(n.name, `<b>${q.n}</b><br><br>${q.desc}<br><br><small>Récompense : ${q.gold} or, ${q.xp} XP, ${q.it[1]} × ${REG[q.it[0]] ? REG[q.it[0]].name : q.it[0]}</small>`, [['Accepter', () => { G.quests.side[q.id] = { st: 1, n: 0 }; toast('Quête acceptée : ' + q.n, '#c4b5fd'); closePanel(); }], ['Plus tard', () => sideMenu(n)]])]);
    else { const c = sideCount(q); btns.push([`${q.n} (${c}/${q.c})`, () => {
      if (c < q.c) return dialog(n.name, `<b>${q.n}</b><br><br>${q.desc}<br><br>Progression : <b>${c}/${q.c}</b>.`, [['Compris', () => sideMenu(n)]]);
      dialog(n.name, `Parfait, tu as fini ! Voici ta récompense.`, [['Récupérer', () => { if (q.t === 'item' && !takeItem(P, q.i, q.c)) return closePanel(); s.st = 2; P.gold += q.gold; gainXp(q.xp); giveItem(P, q.it[0], q.it[1], 'Quête secondaire'); toast(`Quête terminée : +${q.gold} or, +${q.xp} XP`, '#ffe27a'); closePanel(); }]]); } ]); }
  }
  if (!btns.length) return dialog(n.name, "Tu as déjà tout fait pour moi. Merci, héros !", [['À bientôt', closePanel]]);
  btns.push(['Retour', () => sagaTalk(n)]);
  dialog(n.name, 'Voici ce dont j\'ai besoin :', btns);
}
const _sagaTalk0 = sagaTalk;
sagaTalk = function (n) {
  if (!SIDEQ.some(q => q.npc === n.saga)) return _sagaTalk0(n);
  const free = SIDEQ.filter(q => q.npc === n.saga && !(sideState(q.id) && sideState(q.id).st === 2)).length;
  dialog(n.name, n.saga === 'bourg' ? 'Je suis chasseur de primes. Les petits contrats ne manquent pas dans le coin, si tu as du temps…' : 'Que puis-je faire pour toi ?',
    [...(n.saga === 'bourg' ? [] : [['Parler', () => _sagaTalk0(n)]]), ['Quêtes secondaires' + (free ? ` (${free})` : ''), () => sideMenu(n)], ['Au revoir', closePanel]]);
};
function sideQuestList() {
  const Q = G.quests; if (!Q.side) return '';
  const act = SIDEQ.filter(q => Q.side[q.id]);
  if (!act.length) return '';
  return `<div class="q"><b>Quêtes secondaires</b><p>${act.map(q => { const s = Q.side[q.id]; return s.st === 2 ? `✔ ${q.n}` : `${sideCount(q) >= q.c ? '❗' : '•'} ${q.n} : ${sideCount(q)}/${q.c}`; }).join('<br>')}</p></div>`;
}
