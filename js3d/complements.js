'use strict';
// =====================================================================
//  VÉLORNE — COMPLÉMENTS DE CONCEPTION (éléments « À COMPLÉTER » des bibles), chargés par la version 3D officielle
//  Chaque bloc indique sa source. Les noms, lieux et récits ajoutés ici sont des PROPOSITIONS (jamais présentés comme canon).
//  Les prix et principes validés par l'utilisateur sont repris tels quels.
// =====================================================================

// ---------------------------------------------------------------------
//  1. MONTURES RESTANTES — grille validée le 23/11 (velorne-decisions-23-11-analyse.md §5)
//     Destrier des Plaines 3 000 or · Monture rare régionale 8 000 or · Dragon : récompense de quête, non achetable
// ---------------------------------------------------------------------
Object.assign(MOUNTS, {
  destrier: { n: 'Destrier des Plaines', kind: 'terrestre', spd: 1.0, price: 3000, steady: true,
    d: 'Monture terrestre : +100 % de vitesse. Bien dressé, il ne te désarçonne pas au premier coup (il faut deux coups).',
    req: P => hasStyleAny(P) ? (P.lvl >= 10 ? null : 'Niveau 10 requis.') : 'Apprends d\'abord un style de combat.' },
  lynx: { n: 'Lynx des neiges de Givrenuit', kind: 'terrestre', spd: 0.95, price: 8000, steady: 'always', rare: true,
    d: 'Monture rare des Pics de Givrenuit : +95 % de vitesse, ne se laisse jamais désarçonner. Monture rare régionale (nom : PROPOSITION).',
    req: () => G.flags.dead_boss_neige ? null : 'Le lynx ne suit que celui qui a vaincu Kragh, gardien des Pics.' },
  dragon: { n: 'Dragon de Cendrefeu', kind: 'volante', spd: 1.25, price: 0, quest: true, steady: 'always',
    d: 'Monture volante, récompense de quête : +125 % de vitesse, survole l\'eau, la lave et le vide d\'Aether.', req: () => 'Ne s\'achète pas : il naît d\'un œuf (quête « L\'œuf de Cendrefeu »).' },
});
// déplacements : le dragon survole l'eau, la lave et le vide ; il ne peut pas se poser au-dessus
{ const iso = isSolidTile; isSolidTile = function (tx, ty) {
    if (G._pmove && G.player && G.player.mount === 'dragon' && tx > 0 && ty > 0 && tx < MW - 1 && ty < MH - 1 && WORLD.solid[ty * MW + tx] === 1) { const t = vget(tx, ty); if (t === T_WATER || WORLD.region[ty * MW + tx] === 16 || (typeof T_LAVA !== 'undefined' && t === T_LAVA)) return false; }
    return iso(tx, ty); }; }
{ const dm = dismount; dismount = function (P, manual) { if (P.mount === 'dragon' && rectBlockedFoot(P)) { if (manual) toast('Impossible de se poser ici', '#ffb36b'); return false; } return dm(P, manual); }; }
// coups : le destrier tient un coup sur deux, le lynx et le dragon ne désarçonnent jamais
{ const hp0 = hurtPlayer; hurtPlayer = function (P, dmg, sx, sy, src, el) {
    const m = P.mount, M = m && MOUNTS[m]; if (M && M.steady) { const keep = M.steady === 'always' || !(P.mountHit = !P.mountHit); if (keep) { P.mount = null; const r = hp0(P, dmg, sx, sy, src, el); P.mount = m; return r; } }
    return hp0(P, dmg, sx, sy, src, el); }; }
// dessin : silhouette du cheval recolorée (destrier, lynx), silhouette ailée (dragon)
function drawMountHorse(ctx, dir, f, bob, layer, x, y, pal) {
  const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b + bob, w, h); };
  const side = dir === 1 || dir === 3, fl = dir === 1 ? -1 : 1, { body, dark, mane, hoof, saddle, trim } = pal;
  if (side) { const S = (c, a, b, w, h) => R(c, fl > 0 ? a : -a - w, b, w, h);
    if (layer === 'back') { for (const [lx, ph] of [[-11, f], [-7, (f + 2) % 4], [7, (f + 1) % 4], [11, (f + 3) % 4]]) { const o = [0, 2, 0, -2][ph]; S(dark, lx + o * 0.5, -6, 3, 8); S(hoof, lx + o * 0.5, 1, 3, 2); }
      S(body, -16, -17, 32, 12); S(body, 12, -25, 7, 13); S(body, 15, -29, 10, 6); S(dark, 23, -27, 3, 3); S(mane, 11, -29, 4, 15); S(mane, -19, -16, 4, 10); if (pal.spots) for (let i = 0; i < 5; i++) S(pal.spots, -12 + i * 6, -15 + (i % 2) * 4, 2, 2); }
    else { S(body, -16, -14, 32, 8); S(saddle, -7, -15, 14, 6); S(trim, -7, -15, 14, 1); } }
  else { const back = dir === 0;
    if (layer === 'back') { const o = [0, 1, 0, -1][f]; R(dark, -7, -8 + o, 3, 9); R(dark, 4, -8 - o, 3, 9); R(hoof, -7, 0 + o, 3, 2); R(hoof, 4, 0 - o, 3, 2); R(body, -9, -19, 18, 13); R(saddle, -9, -19, 18, 4); R(trim, -9, -19, 18, 1); if (back) R(mane, -2, -10, 4, 8); }
    else if (!back) { R(body, -4, -31, 8, 15); R(mane, -2, -33, 4, 12); R(dark, -3, -19, 6, 4); R('#0e0a08', -3, -26, 2, 2); R('#0e0a08', 1, -26, 2, 2); if (pal.ears) { R(body, -5, -35, 2, 4); R(body, 3, -35, 2, 4); } } }
}
const MOUNT_PAL = {
  destrier: { body: '#3a2416', dark: '#24160c', mane: '#efe6d0', hoof: '#efe6d0', saddle: '#2a4a8a', trim: '#e8c860' },
  lynx: { body: '#d8dce4', dark: '#a8acb8', mane: '#ffffff', hoof: '#8a8e98', saddle: '#6a2a3a', trim: '#c8d8ff', spots: '#5a5e6a', ears: true },
};
{ const dmb = drawMountBody; drawMountBody = function (ctx, k, dir, f, bob, layer, x, y) {
    if (MOUNT_PAL[k]) return drawMountHorse(ctx, dir, f, bob, layer, x, y, MOUNT_PAL[k]);
    if (k === 'dragon') { const fl = Math.sin(G.t * 7) * 7, S = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
      if (layer === 'back') { ctx.fillStyle = '#8a1a14'; for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sg * 5, y - 18); ctx.lineTo(x + sg * 34, y - 30 - fl); ctx.lineTo(x + sg * 28, y - 14 - fl * 0.4); ctx.lineTo(x + sg * 18, y - 8); ctx.closePath(); ctx.fill(); }
        S('#b8281a', -13, -20, 26, 12); S('#e85a2a', -11, -14, 22, 4); S('#5a0e0a', -11, -9, 3, 8); S('#5a0e0a', 8, -9, 3, 8); S('#b8281a', -22, -16, 10, 4); S('#e8a030', -24, -15, 3, 2); }
      else if (dir !== 0) { S('#c8301e', -5, -30, 10, 10); S('#ffd040', -3, -26, 2, 2); S('#ffd040', 1, -26, 2, 2); S('#f0e0c0', -6, -33, 2, 4); S('#f0e0c0', 4, -33, 2, 4); }
      return; }
    return dmb(ctx, k, dir, f, bob, layer, x, y); }; }
// éleveurs (PROPOSITION de noms) : un dans les Plaines d'Or, une aux Pics de Givrenuit
function freeTileNear(tx, ty) { for (let r = 0; r < 20; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = tx + dx, y = ty + dy; if (!isSolidTile(x, y) && !isSolidTile(x + 1, y) && !isSolidTile(x, y - 1)) return [x, y]; } return [tx, ty]; }
function addComplementNpcs() {
  if (WORLD.npcs.some(n => n.role === 'stable2')) return;
  const zp = WORLD.zones.find(z => z.id === 'plaines'), zn = WORLD.zones.find(z => z.id === 'neige'), zv = WORLD.zones.find(z => z.id === 'volcan');
  if (zp) { const [x, y] = freeTileNear(Math.round((zp.x0 + zp.x1) / 2), Math.round(zp.y0 + 10)); WORLD.npcs.push({ look: 'npc_guard', x: x * TILE + 16, y: y * TILE + 16, name: 'Odo, éleveur des Plaines', role: 'stable2', mounts: ['destrier'], dir: 2 }); }
  if (zn) { const [x, y] = freeTileNear(Math.round(zn.x0 + 14), Math.round(zn.y1 - 12)); WORLD.npcs.push({ look: 'npc_relic', x: x * TILE + 16, y: y * TILE + 16, name: 'Yrsa, dresseuse de lynx', role: 'stable2', mounts: ['lynx'], dir: 2 }); }
  // nid du dragon, au cœur du cratère (quête « L'œuf de Cendrefeu »)
  if (zv) { const [x, y] = freeTileNear(Math.round((zv.x0 + zv.x1) / 2 + 12), Math.round((zv.y0 + zv.y1) / 2 - 8)); WORLD.dragonNest = { x: x * TILE + 16, y: y * TILE + 16 }; }
}
{ const gw = genWorld; genWorld = function () { gw(); addComplementNpcs(); }; if (typeof WORLD !== 'undefined' && WORLD.npcs && WORLD.npcs.length) addComplementNpcs(); }
// quête « L'œuf de Cendrefeu » (PROPOSITION) : après Ignaroth, Ulrik Braisefer parle d'un œuf ; on le trouve au nid, il le couve dans
// sa forge, et le dragon naît le lendemain (jour suivant du cycle jour/nuit).
const DRAGON_Q = { step: () => (G.flags.dragonQ || 0) };
function dayNow() { return (G.flags.bru && G.flags.bru.day) || 1; }
function ensureNestNpc() {
  if (!WORLD.dragonNest || !G.npcs) return; const st = G.flags.dragonQ || 0; let egg = G.npcs.find(n => n.role === 'dragon_egg');
  if (st === 1 && !egg) G.npcs.push({ role: 'dragon_egg', name: 'Œuf de dragon, chaud comme une braise', x: WORLD.dragonNest.x, y: WORLD.dragonNest.y, glow3d: '#ff7a2a', bru3d: true, look: 'npc_elder', dir: 2, t: 0 });
  if (st !== 1 && egg) G.npcs.splice(G.npcs.indexOf(egg), 1);
}
setInterval(() => { try { if (G.mode === 'play') ensureNestNpc(); } catch (e) { } }, 1000);
{ const it0 = interact; interact = function (n) {
    const P = G.player;
    if (n && n.role === 'stable2') { const k = n.mounts[0], M = MOUNTS[k], own = ownsMount(P, k), why = M.req(P), can = !own && !why && P.gold >= M.price;
      const opts = []; if (can) opts.push(['Acheter (' + M.price + ' or)', () => { P.gold -= M.price; P.mounts = (P.mounts || []).concat([k]); P.mountSel = k; sfx('gold'); toast('Nouvelle monture : ' + M.n, '#ffe9a0'); saveGame(); closePanel(); }]);
      if ((P.mounts || []).length > 1) opts.push(['Changer de monture active', () => { const L = P.mounts; P.mountSel = L[(L.indexOf(P.mountSel) + 1) % L.length]; toast('Monture active : ' + MOUNTS[P.mountSel].n, '#ffe9a0'); closePanel(); }]);
      opts.push(['Au revoir', closePanel]); try { codexAdd('p', n.name, n.name); } catch (e) { }
      return dialog(n.name, `<p><b>${M.n}</b> — ${M.d}<br>${own ? '<i>Déjà à toi.</i>' : why ? '<i>' + why + '</i>' : 'Prix : <b>' + M.price + ' or</b>'}</p>`, opts); }
    if (n && n.role === 'dragon_egg') { G.flags.dragonQ = 2; G.npcs.splice(G.npcs.indexOf(n), 1); giveItem(P, 'oeuf_dragon', 1, 'Nid de Cendrefeu'); toast('Œuf de dragon obtenu : rapporte-le à Ulrik Braisefer', '#ffb36b'); saveGame(); return; }
    if (n && /^Ulrik Braisefer/.test(n.name || '')) { const st = G.flags.dragonQ || 0;
      if (st === 0 && G.flags.dead_boss_volcan) return dialog(n.name, "Depuis qu'Ignaroth est tombé, la montagne respire autrement. Au cœur du cratère, sur le grand plateau à l'est de la coulée, j'ai vu une coquille rouge battre comme un cœur. Un œuf de dragon. Rapporte-le-moi : ma forge est le seul foyer assez chaud pour le couver.", [['« J\'y vais. »', () => { G.flags.dragonQ = 1; toast('Quête : L\'œuf de Cendrefeu', '#ffe9a0'); saveGame(); closePanel(); }], ['Ses services de forgeron', () => { closePanel(); it0(n); }]]);
      if (st === 1) return dialog(n.name, "L'œuf est au cœur du cratère, à l'est de la coulée. Suis la chaleur.", [['Compris', closePanel], ['Ses services de forgeron', () => { closePanel(); it0(n); }]]);
      if (st === 2 && countItem(P, 'oeuf_dragon') > 0) return dialog(n.name, "Le voilà… Je le pose au cœur des braises. Reviens demain, quand le soleil se sera levé : il aura besoin de voir celui qui l'a porté.", [['« À demain. »', () => { takeItem(P, 'oeuf_dragon', 1); G.flags.dragonQ = 3; G.flags.dragonDay = dayNow(); saveGame(); closePanel(); }]]);
      if (st === 3 && dayNow() > (G.flags.dragonDay || 0)) return dialog(n.name, "Il a brisé sa coquille cette nuit et n'a pas quitté la forge depuis. Il te reconnaît. Il est à toi : le Dragon de Cendrefeu.", [['Prendre le dragon', () => { G.flags.dragonQ = 4; P.mounts = (P.mounts || []).concat(['dragon']); P.mountSel = 'dragon'; sfx('gold'); toast('Nouvelle monture : Dragon de Cendrefeu', '#ffd040'); try { gainXp(800); } catch (e) { } saveGame(); closePanel(); }]]);
      if (st === 3) return dialog(n.name, "Patience. Il n'éclora pas avant le lever du jour prochain.", [['D\'accord', closePanel], ['Ses services de forgeron', () => { closePanel(); it0(n); }]]);
    }
    return it0(n); }; }
// objet de quête
if (typeof REG !== 'undefined' && !REG.oeuf_dragon) { const o = { id: 'oeuf_dragon', name: 'Œuf de dragon', kind: 'quest', stack: 1, rarity: 4, icon: 'KeySkull', price: 0, tradeRules: 'quest', desc: 'Une coquille rouge, brûlante, qui bat doucement. À couver dans la forge d\'Ulrik Braisefer.' }; REG.oeuf_dragon = C(o); }

// ---------------------------------------------------------------------
//  2. EFFETS DE LA RÉPUTATION — 7 rangs conservés (décision du 23/11 §4) : « dialogues, quêtes réservées, récompenses de rang ».
//     Montants, bonus et contrats : PROPOSITIONS d'équilibrage.
// ---------------------------------------------------------------------
const REP_REWARD = [null, { gold: 50 }, { gold: 120, items: [['potion', 2]] }, { gold: 250, items: [['cristal_magique', 2]] }, { gold: 500, contract: true }, { gold: 1000, items: [['mithril', 3], ['fragment_runique', 2]] }, { gold: 2500, title: true }];
// bonus concrets propres à chaque faction, croissants avec le rang (en plus des réductions des Artisans et du voyage des Cartographes)
const REP_BONUS = {
  garde: { d: 'Or ramassé +3 % par rang', k: 0.03 }, vivant: { d: 'Soins des potions +4 % par rang', k: 0.04 }, archives: { d: 'Expérience +2 % par rang', k: 0.02 },
  cendre: { d: 'Dégâts de feu subis −4 % par rang', k: 0.04 }, pacte: { d: 'Dégâts de glace et de vent subis −4 % par rang', k: 0.04 }, voile: { d: 'Dégâts contre les boss +2 % par rang', k: 0.02 },
  navigateurs: { d: 'Vitesse sur une monture aquatique +4 % par rang', k: 0.04 }, artisans: { d: 'Réduction chez les marchands (déjà active)' }, cartographes: { d: 'Voyage rapide moins cher (déjà actif)' },
};
const rk = f => (typeof repRank === 'function' && G.flags && G.flags.rep && G.flags.rep[f] !== undefined) ? repRank(f) : 0;
{ const rg0 = repGain; repGain = function (f, n) {
    const R = repData(), before = R[f] === undefined ? -1 : repRank(f); rg0(f, n); const after = repRank(f);
    if (before >= 0 && after > before) for (let r = before + 1; r <= after; r++) { const W = REP_REWARD[r]; if (!W) continue; const P = G.player; if (!P) continue;
      if (W.gold) P.gold += W.gold; for (const [id, q] of W.items || []) try { giveItem(P, id, q, 'Récompense : ' + FACTIONS[f].n); } catch (e) { }
      if (W.title) { const id = 'rep_' + f; if (!TITLES.some(t => t.id === id)) TITLES.push({ id, n: 'Légende de la ' + FACTIONS[f].n.replace(/^(La |Le |Les )/, ''), r: 3, d: 'Atteindre le rang Légendaire auprès de : ' + FACTIONS[f].n + '.', ok: () => repRank(f) >= 6 }); }
      toast(FACTIONS[f].n + ' — récompense de rang « ' + REP_RANKS[r] + ' »' + (W.gold ? ' : ' + W.gold + ' or' : '') + (W.contract ? ' · contrats de faction disponibles au panneau de Brumeval' : ''), '#ffe27a'); } }; }
// titres de légende déjà mérités (anciennes sauvegardes)
setInterval(() => { try { if (G.mode === 'play' && G.flags.rep) for (const f in FACTIONS) if (rk(f) >= 6 && !TITLES.some(t => t.id === 'rep_' + f)) TITLES.push({ id: 'rep_' + f, n: 'Légende de la ' + FACTIONS[f].n.replace(/^(La |Le |Les )/, ''), r: 3, d: 'Atteindre le rang Légendaire auprès de : ' + FACTIONS[f].n + '.', ok: () => repRank(f) >= 6 }); } catch (e) { } }, 3000);
// application des bonus
{ const gx0 = gainXp; gainXp = function (n) { return gx0(Math.round(n * (1 + REP_BONUS.archives.k * rk('archives')))); }; }
{ const hp0 = hurtPlayer; hurtPlayer = function (P, dmg, sx, sy, src, el) { let m = 1; if (el === 'feu' || el === 'lave') m -= REP_BONUS.cendre.k * rk('cendre'); if (el === 'glace' || el === 'vent') m -= REP_BONUS.pacte.k * rk('pacte'); return hp0(P, dmg * Math.max(0.7, m), sx, sy, src, el); }; }
{ const de0 = damageEnemy; damageEnemy = function (e, dmg, ...rest) { if (e && e.def && e.def.boss) dmg *= 1 + REP_BONUS.voile.k * rk('voile'); return de0(e, dmg, ...rest); }; }
if (typeof MOUNTS !== 'undefined') { const raie = MOUNTS.raie; const base = raie.spd; Object.defineProperty(raie, 'spd', { get: () => base * (1 + REP_BONUS.navigateurs.k * rk('navigateurs')), configurable: true }); }
// l'or ramassé et les potions passent par des fonctions du jeu dont les noms sont vérifiés à l'exécution
{ const co0 = collect; collect = function (d) { if (d && d.kind === 'gold' && !d.repB) { d.repB = 1; d.n = Math.round(d.n * (1 + REP_BONUS.garde.k * rk('garde'))); } return co0(d); }; }
{ const up0 = usePotion; usePotion = function (P) { const c0 = countItem(P, 'potion'); const r = up0(P); if (countItem(P, 'potion') < c0 && P.healRate) P.healRate *= 1 + REP_BONUS.vivant.k * rk('vivant'); return r; }; }
// dialogues : les membres et proches d'une faction saluent selon le rang
const REP_NPC = [[/Orlan|cartograph/i, 'cartographes'], [/Borin|forgeron|Ulrik|Dorgan|artisan/i, 'artisans'], [/Garde|Hugues|Bram/i, 'garde'], [/Édran|archiv|Séraphine/i, 'archives'], [/Liora|herbor|Lysa/i, 'vivant'], [/Selyne|voyante|Orvael/i, 'voile']];
const REP_LINE = ['', 'On m\'a parlé de toi.', 'Ton nom revient souvent chez nous.', 'Toujours un plaisir de te voir.', 'Tu as notre respect.', 'Nos portes te sont grandes ouvertes, ami.', 'Une légende parmi nous !'];
const repSaid = {};
{ const it0 = interact; interact = function (n) {
    const r = it0(n);
    try { if (n && n.name) for (const [re, f] of REP_NPC) if (re.test(n.name)) { const k = rk(f); if (k >= 1 && (!repSaid[n.name] || G.t - repSaid[n.name] > 90)) { repSaid[n.name] = G.t; toast(n.name.split(',')[0] + ' (' + FACTIONS[f].n + ', ' + REP_RANKS[k] + ') : « ' + REP_LINE[k] + ' »', '#c4b5fd'); } break; } } catch (e) { }
    return r; }; }
// quêtes réservées : contrats de faction, au rang Respecté, au panneau de Brumeval
const CONTRACTS = {
  garde: { n: 'Routes sûres', d: 'Vaincre 20 monstres hors des villages.', need: 20, test: e => true },
  artisans: { n: 'Commande du Cercle', d: 'Rapporter 5 acier et 3 mithril.', items: [['acier', 5], ['mithril', 3]] },
  cartographes: { n: 'Relevés lointains', d: 'Vaincre 15 monstres dans une région de niveau 14 ou plus.', need: 15, test: e => { const z = zoneAt(e.x, e.y); return z && /neige|volcan|citadelle|cristal|aether|ombres|corrompues|lave|temple/.test(z.id); } },
  vivant: { n: 'Purger les marais', d: 'Vaincre 15 créatures du Marais de Grisebrume.', need: 15, test: e => { const z = zoneAt(e.x, e.y); return z && z.id === 'marais'; } },
  navigateurs: { n: 'Écumeurs des côtes', d: 'Vaincre 15 monstres sur la côte ou dans l\'archipel.', need: 15, test: e => { const z = zoneAt(e.x, e.y); return z && /cote|archipel|fjord/.test(z.id); } },
  archives: { n: 'Pages manquantes', d: 'Rapporter 4 fragments runiques.', items: [['fragment_runique', 4]] },
  cendre: { n: 'Braises vivantes', d: 'Vaincre 15 créatures du Cratère de Cendrefeu ou des cavernes de lave.', need: 15, test: e => { const z = zoneAt(e.x, e.y); return z && /volcan|lave/.test(z.id); } },
  pacte: { n: 'Serment des peuples', d: 'Vaincre 15 monstres du désert ou des Pics.', need: 15, test: e => { const z = zoneAt(e.x, e.y); return z && /desert|neige|monts|hurlevents/.test(z.id); } },
  voile: { n: 'Échos de Nyx', d: 'Vaincre 10 monstres de la Citadelle ou des Terres de l\'Ombre.', need: 10, test: e => { const z = zoneAt(e.x, e.y); return z && /citadelle|ombres|corrompues/.test(z.id); } },
};
function contracts() { if (!G.flags.contracts) G.flags.contracts = {}; return G.flags.contracts; }
{ const ke0 = killEnemy; killEnemy = function (e) { const r = ke0(e); try { const C = contracts(); for (const f in C) { const c = C[f], D = CONTRACTS[f]; if (c.active && D.need && D.test(e)) { c.n = (c.n || 0) + 1; if (c.n === D.need) toast('Contrat « ' + D.n + ' » rempli : retourne au panneau de Brumeval', '#ffe27a'); } } } catch (er) { } return r; }; }
function openFactionBoard() {
  const P = G.player, C = contracts(), opts = []; let h = '<p>Contrats réservés aux membres respectés des factions (rang « Respecté » ou plus).</p><ul>';
  for (const f in CONTRACTS) { const D = CONTRACTS[f], k = rk(f), c = C[f] || {}; const done = D.need ? (c.n || 0) >= D.need : (D.items || []).every(([id, q]) => countItem(P, id) >= q);
    h += `<li><b>${FACTIONS[f].n}</b> (${REP_RANKS[k]}) — ${D.n} : ${D.d}${c.active ? (D.need ? ` <i>${Math.min(c.n || 0, D.need)}/${D.need}</i>` : '') : ''}${c.times ? ` · rempli ${c.times} fois` : ''}</li>`;
    if (k < 4) continue;
    if (!c.active) opts.push(['Accepter : ' + D.n, () => { C[f] = Object.assign(c, { active: true, n: 0 }); toast('Contrat accepté : ' + D.n, '#ffe27a'); saveGame(); closePanel(); }]);
    else if (done) opts.push(['Rendre : ' + D.n, () => { for (const [id, q] of D.items || []) takeItem(P, id, q); c.active = false; c.times = (c.times || 0) + 1; P.gold += 400 + 150 * k; repGain(f, 60); try { gainXp(300 + 100 * k); } catch (e) { } toast('Contrat rendu : ' + (400 + 150 * k) + ' or', '#ffe27a'); saveGame(); closePanel(); }]);
  }
  h += '</ul><p><small>Bonus de faction : ' + Object.keys(REP_BONUS).map(f => FACTIONS[f].n + ' — ' + REP_BONUS[f].d).join(' · ') + '</small></p>';
  opts.push(['Fermer', closePanel]); dialog('Panneau des contrats de Brumeval', h, opts);
}
window.openFactionBoard = openFactionBoard;

// ---------------------------------------------------------------------
//  3. MÉTIERS — bible V1.2 §6 « À COMPLÉTER : forgeron, joaillier, alchimiste, enchanteur, pêcheur, cartographe ».
//     Forgeron et alchimiste existaient comme stations d'artisanat (niveaux 1 à 10) : ils reçoivent leurs avantages de métier.
//     Joaillier, enchanteur, pêcheur et cartographe sont ajoutés (niveaux 1 à 10). Avantages et valeurs : PROPOSITIONS.
// ---------------------------------------------------------------------
const PROF = {
  joaillier: { n: 'Joaillier', d: 'Fabrique les bijoux et accessoires chez l\'artisan. +2 % de chances par niveau d\'en fabriquer un second.' },
  enchanteur: { n: 'Enchanteur', d: 'Progresse à chaque enchantement. Rembourse 3 % de l\'or des enchantements par niveau.' },
  pecheur: { n: 'Pêcheur', d: 'Pêche au bord de l\'eau (touche d\'action). Poissons plus rares et plus nombreux avec le niveau ; pêche dans la lave au niveau 6.' },
  cartographe: { n: 'Cartographe', d: 'Progresse en découvrant régions et lieux. Voyage rapide moins cher (−1 or par niveau).' },
};
const PROF_PERK = { forge: 'Amélioration des armes −3 % d\'or par niveau.', alchimie: '+5 % de chances par niveau de préparer une potion de plus.' };
function profLvl(P, k) { const c = P.craft[k] || (P.craft[k] = { lvl: 1, xp: 0 }); return c.lvl; }
function profXp(P, k, n) { profLvl(P, k); const c = P.craft[k]; c.xp += n; let up = false; while (c.lvl < 10 && c.xp >= CRAFT_XP(c.lvl)) { c.xp -= CRAFT_XP(c.lvl); c.lvl++; up = true; } if (up) toast((PROF[k] || { n: STATIONS[k] }).n + ' : niveau ' + c.lvl, '#9be7a8'); }
{ const dc0 = doCraft; doCraft = function (P, r) { const why = dc0(P, r); if (why) return why; const it = REG[r.result[0]] || {};
    if (it.kind === 'accessory') { profXp(P, 'joaillier', 4 + r.lvl * 2); if (Math.random() < 0.02 * profLvl(P, 'joaillier')) { giveItem(P, r.result[0], 1, 'Joaillier'); toast('Joaillier : un bijou de plus !', '#9be7a8'); } }
    if (r.station === 'alchimie' && Math.random() < 0.05 * profLvl(P, 'alchimie')) { giveItem(P, r.result[0], r.result[1], 'Alchimiste'); toast('Alchimiste : une préparation de plus !', '#9be7a8'); }
    return null; }; }
{ const uc0 = upgradeCost; upgradeCost = function (inst) { const c = uc0(inst); try { const k = 1 - 0.03 * profLvl(G.player, 'forge'); return Object.assign({}, c, { gold: Math.round(c.gold * k) }); } catch (e) { return c; } }; }
{ const de0 = doEnchant; doEnchant = function (P, inst, key) { const why = de0(P, inst, key); if (why) return why; profXp(P, 'enchanteur', 8); const back = Math.round(ENCHANTS[key].cost.gold * 0.03 * profLvl(P, 'enchanteur')); if (back) { P.gold += back; toast('Enchanteur : ' + back + ' or économisés', '#9be7a8'); } return null; }; }
{ const ca0 = codexAdd; codexAdd = function (cat, key, label) { const r = ca0(cat, key, label); if (r && G.player && (cat === 'r' || cat === 'm')) profXp(G.player, 'cartographe', cat === 'r' ? 12 : 3); return r; }; }
{ const tc0 = travelCost; travelCost = function () { let c = tc0(); try { c -= profLvl(G.player, 'cartographe') - 1; } catch (e) { } return Math.max(5, c); }; }
// carte révélée : un peu d'expérience de cartographe toutes les 2 % de carte découverte
setInterval(() => { try { if (G.mode !== 'play' || !G.player) return; const f = Math.floor(fogRatio() * 50); const P = G.player; if (P.cartoFog == null) P.cartoFog = f; if (f > P.cartoFog) { profXp(P, 'cartographe', 5 * (f - P.cartoFog)); P.cartoFog = f; } } catch (e) { } }, 4000);

// pêche : poissons par région (objets nouveaux, vendables, et un repas du pêcheur au camp)
const FISH = [
  { id: 'p_truite', name: 'Truite de Sylvemousse', z: /forest|village|ruins|camp|plaines|oasis/, lvl: 1, price: 12, r: 2 },
  { id: 'p_carpe', name: 'Carpe des brumes', z: /marais|jungle|corrompues/, lvl: 1, price: 16, r: 2 },
  { id: 'p_saumon', name: 'Saumon du fjord', z: /fjord|neige|monts|hurlevents/, lvl: 3, price: 30, r: 3 },
  { id: 'p_lune', name: 'Poisson-lune de l\'archipel', z: /cote|archipel/, lvl: 3, price: 34, r: 3 },
  { id: 'p_braise', name: 'Poisson-braise', z: /volcan|lave/, lvl: 6, price: 80, r: 4 },
  { id: 'p_ombre', name: 'Anguille d\'ombre', z: /ombres|citadelle|temple|mines/, lvl: 5, price: 60, r: 4 },
  { id: 'p_cristal', name: 'Poisson de cristal', z: /cristal|aether/, lvl: 7, price: 120, r: 4 },
  { id: 'p_or', name: 'Poisson d\'or', z: /./, lvl: 4, price: 300, r: 5, rare: 0.03 },
];
for (const f of FISH) if (!REG[f.id]) REG[f.id] = C({ id: f.id, name: f.name, kind: 'material', stack: 30, rarity: f.r, icon: 'Fish', price: f.price, desc: 'Poisson pêché. Se vend, ou se cuisine au camp (Grillade du pêcheur).' });
if (typeof MEALS !== 'undefined' && !MEALS.some(m => m.id === 'grillade')) MEALS.push({ id: 'grillade', n: 'Grillade du pêcheur', need: [['p_truite', 2], ['herbe', 1]], alt: true, buff: { maxhp: 1.12, regenHp: 2 }, dur: 360, d: '+12 % de PV max. et +2 PV/s pendant 6 min (PROPOSITION).' });
function waterNear(P) { if (window.bruWaterNear && window.bruWaterNear(P.x, P.y)) return { lava: false }; const tx = Math.floor(P.x / TILE), ty = Math.floor((P.y - 4) / TILE); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = vget(tx + dx, ty + dy); if (t === T_WATER || (typeof T_LAVA !== 'undefined' && t === T_LAVA)) return { lava: t !== T_WATER }; } return null; }
let FISHING = null;
function startFishing(P, w) {
  const z = zoneAt(P.x, P.y), lv = profLvl(P, 'pecheur');
  if (w.lava && lv < 6) { toast('Pêcher dans la lave demande le niveau 6 de pêcheur', '#ffb36b'); return; }
  FISHING = { t0: G.t, bite: 1.2 + Math.random() * 2.8, done: false };
  const finish = (ok) => { if (!FISHING || FISHING.done) return; FISHING.done = true; closePanel();
    if (!ok) { toast('Le poisson s\'est échappé…', '#aaa'); FISHING = null; return; }
    const pool = FISH.filter(f => f.z.test(z ? z.id : 'forest') && f.lvl <= lv && !f.rare); let f = pool[Math.floor(Math.random() * pool.length)] || FISH[0];
    if (Math.random() < FISH[7].rare * (1 + lv * 0.2) && lv >= FISH[7].lvl) f = FISH[7];
    const n = 1 + (Math.random() < lv * 0.06 ? 1 : 0); giveItem(P, f.id, n, 'Pêche'); toast('Pêche : ' + f.name + (n > 1 ? ' ×' + n : ''), '#9fe3ff'); profXp(P, 'pecheur', 4 + f.r * 2); try { repGain('navigateurs', 2); } catch (e) { } FISHING = null; };
  const wait = () => dialog('Pêche', '<p>La ligne est lancée… Attends que le bouchon plonge, puis ferre !</p>', [['Ferrer', () => finish(false)], ['Ranger la ligne', () => { FISHING.done = true; FISHING = null; closePanel(); }]]);
  wait();
  setTimeout(() => { if (!FISHING || FISHING.done) return; dialog('Pêche', '<p><b>Le bouchon plonge !</b></p>', [['Ferrer !', () => finish(true)], ['Ranger la ligne', () => { FISHING.done = true; FISHING = null; closePanel(); }]]); setTimeout(() => { if (FISHING && !FISHING.done) finish(false); }, 1300 + 120 * lv); }, FISHING.bite * 1000);
}
{ const up0 = updatePlayer; updatePlayer = function (P, dt) {
    if (IN.pressed.interact && !P.mount && P.state !== 'dead' && !G.npcs.some(n => !n.noTalk && dist(P.x, P.y, n.x, n.y) < 42) && !WORLD.props.some(c => c.def && c.def.interact && !c.opened && dist(P.x, P.y, c.x, c.y) < 34)) { const w = waterNear(P); if (w) { IN.pressed.interact = false; startFishing(P, w); } }
    return up0(P, dt); }; }
window.fishHint = () => { try { const P = G.player; return P && !P.mount && !G.near && waterNear(P) ? 'Pêcher' : null; } catch (e) { return null; } };
// métiers dans l'onglet Codex (liste complète)
{ const ch0 = codexHTML; codexHTML = function (P) {
    let h = ch0(P); const rows = Object.keys(PROF).map(k => { const c = P.craft[k]; return `<div>${PROF[k].n} : <b>niveau ${c ? c.lvl : 1}</b>${c && c.lvl < 10 ? ` <small>(${c.xp}/${CRAFT_XP(c.lvl)})</small>` : ''} — <small>${PROF[k].d}</small></div>`; }).join('') + Object.keys(PROF_PERK).map(k => `<div><small>${STATIONS[k]} : ${PROF_PERK[k]}</small></div>`).join('');
    return h.replace('<small>Récolteur', rows + '<small>Récolteur'); }; }

// ---------------------------------------------------------------------
//  CORRECTION — le titre « le Légendaire » (rareté 4) faisait planter l'onglet Codex : rareté 4 ajoutée (défaut aussi présent en 2D).
// ---------------------------------------------------------------------
if (typeof TITLE_RAR !== 'undefined' && !TITLE_RAR[4]) TITLE_RAR[4] = ['Légendaire', '#ff7ad9'];

// ---------------------------------------------------------------------
//  4. ÉCONOMIE RÉGIONALE — cahier V2 / Partie 5 §22 : « les prix doivent dépendre de la région, de la disponibilité,
//     de la valeur des matériaux » ; « spécialités régionales ». Chaque marchand vend les spécialités de sa région,
//     moins cher. Les prix montent dans les régions lointaines. Les produits d'autres régions se revendent mieux.
//     Coefficients : PROPOSITIONS d'équilibrage (sans spéculation abusive : écart borné de −20 % à +35 %).
// ---------------------------------------------------------------------
const REGION_ECO = {
  village: { f: 1.0, spec: ['herbe', 'bois_ancien', 'cuir', 'p_truite'] }, forest: { f: 1.0, spec: ['herbe', 'bois_ancien', 'cuir', 'p_truite'] },
  plaines: { f: 1.03, spec: ['cuir', 'herbe', 'p_truite'] }, desert: { f: 1.06, spec: ['ecaille_drake', 'croc'] }, oasis: { f: 1.05, spec: ['herbe', 'ecaille_drake'] },
  marais: { f: 1.08, spec: ['gelee', 'herbe', 'p_carpe'] }, jungle: { f: 1.1, spec: ['herbe', 'cuir', 'p_carpe'] },
  neige: { f: 1.1, spec: ['croc', 'acier', 'p_saumon'] }, monts: { f: 1.1, spec: ['fer', 'acier', 'mithril'] }, hurlevents: { f: 1.12, spec: ['croc', 'acier'] }, fjord: { f: 1.12, spec: ['p_saumon', 'cuir'] },
  mines: { f: 1.12, spec: ['fer', 'mithril', 'acier'] }, volcan: { f: 1.15, spec: ['cendres', 'ecaille_drake', 'p_braise'] }, lave: { f: 1.18, spec: ['cendres', 'mithril', 'p_braise'] },
  cote: { f: 1.06, spec: ['p_lune', 'cuir'] }, archipel: { f: 1.1, spec: ['p_lune', 'cristal_magique'] },
  cristal: { f: 1.15, spec: ['cristal_magique', 'fragment_runique', 'p_cristal'] }, aether: { f: 1.2, spec: ['cristal_magique', 'fragment_runique', 'p_cristal'] },
  temple: { f: 1.18, spec: ['fragment_runique', 'essence_spectrale'] }, ombres: { f: 1.22, spec: ['essence_spectrale', 'p_ombre'] },
  corrompues: { f: 1.2, spec: ['essence_spectrale', 'gelee'] }, citadelle: { f: 1.25, spec: ['essence_spectrale', 'cendres'] },
};
function shopZone() { const n = G.shopNpc; const z = n ? zoneAt(n.x, n.y) : (G.player ? zoneAt(G.player.x, G.player.y) : null); return (z && REGION_ECO[z.id]) ? z.id : 'village'; }
function isSpec(zid, id) { return (REGION_ECO[zid] || REGION_ECO.village).spec.includes(id); }
function isForeignSpec(zid, id) { if (isSpec(zid, id)) return false; for (const k in REGION_ECO) if (REGION_ECO[k].spec.includes(id)) return true; return false; }
{ const bp0 = buyPrice; buyPrice = function (d) { const z = shopZone(), E = REGION_ECO[z]; let k = E.f; if (d && isSpec(z, d.id)) k *= 0.8; return Math.max(1, Math.round(bp0(d) * k)); }; }
{ const sp0 = sellPrice; sellPrice = function (d) { const z = shopZone(); let k = 1; if (d && isSpec(z, d.id)) k = 0.8; else if (d && isForeignSpec(z, d.id)) k = 1.35; return Math.max(1, Math.floor(sp0(d) * k)); }; }
{ const os0 = openShop; openShop = function (n, tab) {
    const z = n ? zoneAt(n.x, n.y) : null, zid = z && REGION_ECO[z.id] ? z.id : 'village', spec = REGION_ECO[zid].spec.filter(id => REG[id]);
    const sp = SHOP.special; SHOP.special = sp.concat(spec.filter(id => !sp.includes(id)));
    try { os0(n, tab); } finally { SHOP.special = sp; }
    try { const body = document.querySelector('.panel.show .pbody'); if (body && (tab || 'buy') === 'buy') { const el = document.createElement('p'); el.className = 'hint'; el.innerHTML = `Économie de la région « ${z ? z.name : 'Brumeval'} » : prix ×${REGION_ECO[zid].f.toFixed(2)} ; spécialités locales −20 % (${spec.map(id => REG[id].name).join(', ')}) ; les spécialités d'autres régions se revendent ici +35 %.`; body.prepend(el); } } catch (e) { } }; }

// ---------------------------------------------------------------------
//  5. APPRENTISSAGE DES AUTRES FAMILLES — décisions du 23/11 §3 : « n'empêche pas d'utiliser d'autres familles ;
//     apprentissage complet À COMPLÉTER (grimoires, sanctuaires…) » ; cahier général §14 : « il apprend ensuite la magie
//     du feu grâce à un grimoire ». La magie innée reste celle du Magic Spin (taux jamais touchés).
//     Chaque famille a son grimoire. Le lire apprend la famille ; elle occupe l'emplacement de seconde magie (m2) et se maîtrise
//     comme les autres. Un sanctuaire permet de changer de seconde magie parmi les familles apprises.
//     Familles communes, inhabituelles et rares : grimoires chez Isolde la mage. Épiques et légendaires : sur les boss
//     régionaux et dans les coffres. Prix et chances : PROPOSITIONS.
// ---------------------------------------------------------------------
const GRIM_PRICE = { 1: 1500, 2: 3500, 3: 8000 };
for (const f of MAGIC_KEYS) { const id = 'gf_' + f, T = MAGIC_DATA[f].tier; if (!REG[id]) REG[id] = C({ id, name: 'Grimoire de ' + MAGIC_DATA[f].n, kind: 'grimoire', stack: 1, rarity: Math.min(5, T + 1), icon: 'Scroll0003', price: GRIM_PRICE[T] || 0, tradeRules: T >= 4 ? 'bound' : 'tradable', learnFam: f, desc: 'Apprend la famille ' + MAGIC_DATA[f].n + ' (' + MAGIC_TIERS[T].n + '). Elle devient ta seconde magie et se maîtrise comme les autres.' }); }
function learnedFams(P) { if (!P.learnedFams) P.learnedFams = []; return P.learnedFams; }
function learnFamily(P, f) {
  const L = learnedFams(P); if (f === P.magic || L.includes(f)) { toast('Famille déjà connue : ' + MAGIC_DATA[f].n, '#aaa'); return false; }
  L.push(f); if (!P.magic2) { P.magic2 = f; P.spells.m2 = 1; } P.mastery = P.mastery || {}; P.mastery[f] = P.mastery[f] || 0;
  try { rebuildPlayer(P); } catch (e) { } toast('Nouvelle famille apprise : ' + MAGIC_DATA[f].n + (P.magic2 === f ? ' (seconde magie active)' : ' — change de seconde magie dans un sanctuaire'), MAGIC_DATA[f].col); try { codexAdd('m', 'fam_' + f, MAGIC_DATA[f].n); } catch (e) { } return true;
}
// lecture des grimoires de famille (les grimoires de sorts secrets gardent leur fonctionnement)
{ const ui0 = useConsumable; useConsumable = function (P, inst, ...r) { const d = REG[inst && inst.id]; if (d && d.learnFam) { if (learnFamily(P, d.learnFam)) removeUid(P, inst.uid); return true; } return ui0(P, inst, ...r); }; }
// ancienne double magie : comptée comme apprise
setInterval(() => { try { const P = G.player; if (G.mode === 'play' && P && P.magic2 && !learnedFams(P).includes(P.magic2)) learnedFams(P).push(P.magic2); } catch (e) { } }, 2000);
// sanctuaires : changer de seconde magie
function sanctuaryChoose(P) {
  const L = learnedFams(P); if (!L.length) return dialog('Sanctuaire', '<p>Le sanctuaire vibre doucement. Tu ne connais encore aucune autre famille que ta magie innée : lis un grimoire de famille pour en apprendre une.</p>', [['Fermer', closePanel]]);
  dialog('Sanctuaire', '<p>Choisis la famille qui occupera ta <b>seconde magie</b> (emplacement 6). Ta magie innée ne change pas.</p>', L.map(f => [(P.magic2 === f ? '✔ ' : '') + MAGIC_DATA[f].n + ' (maîtrise ' + magLevel(P, f) + ')', () => { P.magic2 = f; P.spells.m2 = 1; delete (P.eqM || {}).m2; try { rebuildPlayer(P); } catch (e) { } toast('Seconde magie : ' + MAGIC_DATA[f].n, MAGIC_DATA[f].col); saveGame(); closePanel(); }]).concat([['Fermer', closePanel]]));
}
{ const it0 = interact; interact = function (n) {
    const P = G.player;
    if (n && n.type === 'sanctuary') return sanctuaryChoose(P);
    if (n && n.role === 'mage') { const sell = MAGIC_KEYS.filter(f => MAGIC_DATA[f].tier <= 3 && f !== P.magic && !learnedFams(P).includes(f));
      return dialog(n.name, (P.magic ? 'Ta magie innée est <b>' + MAGIC_DATA[P.magic].n + '</b>. ' : '') + 'Je tiens la bibliothèque des grimoires de familles : apprendre une autre famille ne retire rien à ta magie innée. Les grimoires épiques et légendaires, eux, dorment chez les grands boss de Vélorne.', [
        ['Bibliothèque des grimoires', () => { closePanel(); const opts = sell.slice(0, 12).map(f => { const d = REG['gf_' + f], pr = buyPrice(d); return [d.name + ' — ' + pr + ' or', () => { if (P.gold < pr) return toast('Pas assez d\'or', '#ffb36b'); if (!canReceive(P, [[d.id, 1]])) return toast('Inventaire plein', '#ffb36b'); P.gold -= pr; giveItem(P, d.id, 1, 'Bibliothèque d\'Isolde'); saveGame(); closePanel(); }]; }); G.shopNpc = n; dialog(n.name + ' — grimoires', '<p>Familles communes, inhabituelles et rares.</p>', opts.concat([['Fermer', closePanel]])); }],
        ['Ses autres conseils', () => { closePanel(); it0(n); }], ['Au revoir', closePanel]]); }
    return it0(n); }; }
// grimoires épiques et légendaires : sur les boss régionaux (une chance par victoire) et dans les coffres
{ const ke0 = killEnemy; killEnemy = function (e) { const r = ke0(e); try { if (e && e.def && e.def.boss) { const pool = MAGIC_KEYS.filter(f => MAGIC_DATA[f].tier >= 4 && f !== G.player.magic && !learnedFams(G.player).includes(f)); if (pool.length && Math.random() < 0.35) { const f = pool[Math.floor(Math.random() * pool.length)]; G.drops.push({ kind: 'item', id: 'gf_' + f, n: 1, x: e.x, y: e.y, vx: 0, vy: 0, vz: 110, z: 4, t: 0 }); toast('Un grimoire rare est tombé : ' + MAGIC_DATA[f].n, MAGIC_DATA[f].col); } } } catch (er) { } return r; }; }

// ---------------------------------------------------------------------
//  6. AMÉNAGEMENTS DU CAMP ET HABITATION — bible V1.2 §8 (camp existant) ; plan §3 « aménagements et stockage à étendre ».
//     Camp : 4 aménagements achetés avec des matériaux. Habitation : chambre à l'auberge du Chêne Tranquille, chez Gwenna.
//     On y trouve un lit (repos complet et passage de la nuit), la réserve et un établi, et elle s'agrandit.
//     Coûts et effets : PROPOSITIONS.
// ---------------------------------------------------------------------
const CAMP_UP = {
  tente: { n: 'Tente renforcée', d: 'Délai entre deux repos : 2 min → 1 min.', cost: [['cuir', 4], ['bois_ancien', 3]], gold: 300 },
  marmite: { n: 'Marmite de fonte', d: 'Les repas durent 25 % plus longtemps.', cost: [['fer', 4], ['acier', 1]], gold: 400 },
  feu: { n: 'Feu de camp runique', d: 'Le repos donne aussi 2 min de régénération de mana renforcée (+3 mana/s).', cost: [['fragment_runique', 2], ['cristal_magique', 2]], gold: 800 },
  coffre: { n: 'Coffre de voyage', d: 'Accès à la réserve depuis le camp.', cost: [['bois_ancien', 4], ['fer', 3]], gold: 600 },
};
function campUp() { const C = CS(); if (!C.up) C.up = {}; return C.up; }
function canPay(P, cost, gold) { return P.gold >= gold && cost.every(([id, q]) => countItem(P, id) >= q); }
function pay(P, cost, gold) { P.gold -= gold; for (const [id, q] of cost) takeItem(P, id, q); }
// rendu : section « Aménagements » ajoutée à l'onglet Camp
{ const om0 = openMenu; openMenu = function (tab) { const r = om0(tab); try { if (menuTab === 'camp') { const body = document.querySelector('.panel.show .pbody .quests'); if (body && !body.querySelector('[data-campup]')) { const U = campUp(), P = G.player;
    let h = '<div class="q"><b>Aménagements du camp</b>'; for (const k in CAMP_UP) { const A = CAMP_UP[k]; h += `<p><b>${A.n}</b> — ${A.d}<br><small>${A.cost.map(([id, q]) => `${q} × ${REG[id] ? REG[id].name : id} (${countItem(P, id)})`).join(', ')}, ${A.gold} or</small> ${U[k] ? '<i>installé</i>' : `<button data-campup="${k}" ${canPay(P, A.cost, A.gold) ? '' : 'disabled'}>Installer</button>`}</p>`; }
    if (U.coffre) h += '<p><button data-campup="stash">Ouvrir la réserve</button></p>';
    h += '</div>'; body.insertAdjacentHTML('beforeend', h); } } } catch (e) { } return r; }; }
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-campup]'); if (!b) return; e.stopPropagation(); const k = b.dataset.campup, P = G.player, U = campUp();
  if (k === 'stash') { openStash(); return; } const A = CAMP_UP[k]; if (!A || U[k] || !canPay(P, A.cost, A.gold)) return; pay(P, A.cost, A.gold); U[k] = 1; toast('Camp : ' + A.n + ' installé', '#9fe3ff'); saveGame(); openMenu('camp'); }, true);
// effets : délai de repos, durée des repas, mana après repos
setInterval(() => { try { const C = G.flags && G.flags.camp; if (!C || G.mode !== 'play') return; const U = C.up || {}; if (U.tente && C.restLeft > 60 && !C.restCut) { C.restLeft = 60; C.restCut = true; } if (!(C.restLeft > 0)) C.restCut = false;
  if (U.marmite && C.buff && C.buff.left && !C.buff.marm) { C.buff.left *= 1.25; C.buff.marm = 1; }
  if (U.feu && C.restLeft > 55 && !C.manaB) { C.manaB = G.t + 120; } if (C.manaB && G.t < C.manaB && G.player) G.player.mp = Math.min(G.player.st8.maxmp, G.player.mp + 3); if (C.manaB && G.t >= C.manaB) C.manaB = 0; } catch (e) { } }, 1000);

// habitation : chambre à l'auberge (Gwenna)
function home() { if (!G.flags.home) G.flags.home = { owned: false, lvl: 0 }; return G.flags.home; }
const HOME_UP = [{ n: 'Coffre agrandi', d: 'Réserve +20 places.', gold: 1500 }, { n: 'Établi', d: 'Forge, artisanat et alchimie depuis ta chambre.', gold: 3000 }, { n: 'Râtelier d\'honneur', d: 'Tes trophées de boss exposés : +3 % d\'expérience.', gold: 5000 }];
function openHome() {
  const H = home(), P = G.player, opts = [['Dormir jusqu\'au matin (repos complet)', () => { P.hp = P.st8.maxhp; P.mp = P.st8.maxmp; P.sta = P.st8.maxsta; try { const h = V3D.hour(); if (h > 6.5) { if (G.flags.bru) G.flags.bru.day = (G.flags.bru.day || 1) + 1; } V3D.setHour(7); } catch (e) { } toast('Tu as bien dormi. Le jour se lève sur Brumeval.', '#9fe3ff'); saveGame(); closePanel(); }], ['Ouvrir la réserve', () => { closePanel(); openStash(); }]];
  if (H.lvl >= 2) opts.push(['Établi : forge', () => { closePanel(); openCraftNpc('forge', { name: 'Établi' }); }], ['Établi : artisanat', () => { closePanel(); openCraftNpc('artisan', { name: 'Établi' }); }], ['Établi : alchimie', () => { closePanel(); openCraftNpc('alchimie', { name: 'Établi' }); }]);
  const nx = HOME_UP[H.lvl]; if (nx) opts.push([`Aménager : ${nx.n} (${nx.gold} or)`, () => { if (P.gold < nx.gold) return toast('Pas assez d\'or', '#ffb36b'); P.gold -= nx.gold; H.lvl++; toast('Chambre : ' + nx.n, '#ffe9a0'); saveGame(); closePanel(); openHome(); }]);
  opts.push(['Fermer', closePanel]);
  dialog('Ta chambre au Chêne Tranquille', `<p>Une chambre sous les poutres, un lit, un coffre.${H.lvl ? ' Aménagements : ' + HOME_UP.slice(0, H.lvl).map(u => u.n).join(', ') + '.' : ''}</p>`, opts);
}
window.bruNpcHook = function (n) {
  if (!/^Gwenna/.test(n.name || '')) return false; const H = home(), P = G.player, talk = () => { closePanel(); if (window.bruTalk) window.bruTalk(n); };
  if (!H.owned) dialog(n.name, "Tu passes souvent par ici… Une chambre se libère sous les toits : un lit, un coffre, et la paix. 2 000 or, et elle est à toi pour de bon.", [['Prendre la chambre (2 000 or)', () => { if (P.gold < 2000) return toast('Pas assez d\'or', '#ffb36b'); P.gold -= 2000; H.owned = true; toast('Tu as maintenant ta chambre au Chêne Tranquille', '#ffe9a0'); saveGame(); closePanel(); }], ['Parler', talk], ['Plus tard', closePanel]]);
  else dialog(n.name, 'Ta chambre est prête, comme toujours.', [['Aller dans ma chambre', () => { closePanel(); openHome(); }], ['Parler', talk], ['Au revoir', closePanel]]);
  return true;
};
{ const base = CONFIG.stashCapacity; Object.defineProperty(CONFIG, 'stashCapacity', { get: () => base + (G.flags && G.flags.home && G.flags.home.lvl >= 1 ? 20 : 0), configurable: true }); }
{ const gx0 = gainXp; gainXp = function (n) { return gx0(G.flags && G.flags.home && G.flags.home.lvl >= 3 ? Math.round(n * 1.03) : n); }; }

// ---------------------------------------------------------------------
//  7. PNJ MANQUANTS DU CAHIER 2 (§18, noms CANON) + ACTIVITÉS PERMANENTES (§28) + POST-GAME (§29)
//     17 noms du cahier n'étaient pas encore incarnés : ils sont placés dans la région de leur groupe. Chacun porte une
//     activité qui ne disparaît pas après l'histoire : livraisons, chasses, troc, collections, défis, arène, élites.
//     Sylva n'est pas incarnée : une mission la dit partie depuis des années. Zayra est Zaïra, la marchande déjà présente.
//     Rôles, biographies, relations et activités : PROPOSITIONS. Les activités de fin de jeu s'ouvrent après Malvorak.
// ---------------------------------------------------------------------
const NEW_NPC = [
  // groupe 2 — forêt et nature sauvage
  { name: 'Miri, jeune cueilleuse', look: 'npc_alchemist', zone: 'forest', at: [30, 36], bio: 'Petite-fille de Liora, vive et bavarde. Elle connaît chaque talus de Sylvemousse et rêve de devenir herboriste.', act: { type: 'deliver', items: [['herbe', 5]], reward: { gold: 60, items: [['potion', 2]], rel: 6, rep: ['vivant', 6] }, label: 'Herbes du jour' } },
  { name: 'Thalwen, druide de la canopée', look: 'npc_runemaster', zone: 'jungle', bio: 'Vieux druide qui parle aux arbres de la jungle. Il ne quitte jamais la canopée, dont il surveille les esprits troublés.', act: { type: 'hunt', zones: /jungle/, n: 10, reward: { gold: 240, items: [['bois_ancien', 4]], rel: 8, rep: ['vivant', 20] }, label: 'Esprits de la canopée' } },
  { name: 'Griv, gobelin repenti', look: 'npc_artisan', zone: 'forest', at: [62, 30], bio: 'Ancien pillard du camp gobelin. Il a déserté après la chute de Grakhul et vit de troc à la lisière.', act: { type: 'trade', offers: [[['croc', 3], ['cuir', 1]], [['essence_spectrale', 2], ['cristal_magique', 1]], [['fer', 4], ['acier', 1]], [['gelee', 3], ['herbe', 2]]], label: 'Troc' } },
  { name: 'Eryndor, elfe des premiers âges', look: 'npc_elder', zone: 'forest', at: [24, 28], bio: 'Il a vu la Couronne d\'Aube briller. Il récompense ceux qui apprennent le monde, région après région.', act: { type: 'collect', count: () => Object.keys(codex().r).length, steps: [4, 8, 12, 16, 20], unit: 'régions découvertes', reward: k => ({ gold: 150 * k, items: [['chronique', 1]], rep: ['archives', 30] }), label: 'Mémoire du monde' } },
  // groupe 3 — désert et commerce
  { name: 'Oraz, dresseur de bêtes', look: 'npc_guard', zone: 'desert', bio: 'Il tient la ménagerie des caravanes. Il note chaque espèce affrontée et paie bien les chasseurs qui nourrissent son bestiaire.', act: { type: 'collect', count: () => Object.keys(codex().c || {}).length, steps: [10, 20, 35, 50, 70], unit: 'créatures au codex', reward: k => ({ gold: 200 * k, items: [['ecaille_drake', 2 * k]], rep: ['garde', 25] }), label: 'Bestiaire des caravanes' } },
  { name: 'Tarek, garde caravanier', look: 'npc_guard', zone: 'desert', bio: 'Il escorte les caravanes d\'Arkhan. Taciturne, il ne fait confiance qu\'à ceux qui ont tenu une route avec lui.', act: { type: 'hunt', zones: /desert|oasis/, n: 12, reward: { gold: 300, rel: 8, rep: ['garde', 25] }, label: 'Route sûre' } },
  // groupe 6 — archéologie
  { name: 'Sareth, archéologue d\'Aether', look: 'npc_relic', zone: 'aether', bio: 'Elle dresse l\'inventaire des ruines flottantes et achète les fragments runiques qu\'elle relie en chroniques.', act: { type: 'deliver', items: [['fragment_runique', 3]], reward: { gold: 500, items: [['chronique', 1]], rel: 8, rep: ['archives', 30] }, label: 'Fragments d\'Aether' } },
  // groupe 7 — ombre et corruption
  { name: 'Amon, prêtre déchu', look: 'npc_runemaster', zone: 'corrompues', bio: 'Ancien prêtre du Voile, rongé par une marque de Nyx. Il purifie ce qu\'il peut pour racheter ce qu\'il a laissé faire.', act: { type: 'deliver', items: [['essence_spectrale', 4]], reward: { gold: 350, buff: true, rel: 8, rep: ['voile', 25] }, label: 'Purification' } },
  { name: 'Veyra, chasseuse de démons', look: 'npc_m_dagues', zone: 'ombres', bio: 'Elle traque les créatures nées de la corruption. Ses contrats font surgir les élites tapies dans l\'ombre.', act: { type: 'elite', zones: /ombres|corrompues|citadelle/, n: 3, reward: { gold: 900, items: [['mithril', 2]], rep: ['voile', 40] }, label: 'Élites corrompues' } },
  { name: 'Kaelor, chevalier repenti', look: 'npc_guard', zone: 'citadelle', bio: 'Ancien chevalier de Malvorak, libéré à sa chute. Il veut affronter les échos de ses anciens maîtres pour se racheter.', post: true, act: { type: 'arena', label: 'Échos du Sceau Noir', kinds: ['boss_sultan', 'boss_marais', 'boss_neige', 'boss_volcan'], mult: 1.6, reward: { gold: 2500, items: [['mithril', 4], ['cendres', 4]], rep: ['voile', 60] } } },
  // groupe 8 — itinérants et fin de jeu
  { name: 'Eolan, barde itinérant', look: 'npc_merchant', zone: 'village', roam: ['village', 'plaines', 'oasis', 'cote', 'fjord'], bio: 'Il chante ce qu\'il a vu et vend ses rumeurs. Il change de village chaque jour.', act: { type: 'rumor', label: 'Rumeurs' } },
  { name: 'Rhovan, marchand des routes', look: 'npc_merchant', zone: 'plaines', roam: ['plaines', 'desert', 'monts', 'cote', 'village'], bio: 'Il apporte des marchandises qu\'on ne trouve nulle part ailleurs. Son étal change chaque jour, comme son village.', act: { type: 'rotshop', label: 'Étal du jour' } },
  { name: 'Iséria, oracle des défis', look: 'npc_mage', zone: 'plaines', bio: 'Elle lit dans les étoiles trois épreuves par jour pour qui veut se dépasser.', act: { type: 'challenges', label: 'Défis du jour' } },
  { name: 'Theryn, maître de l\'Arène', look: 'npc_m_epee', zone: 'plaines', post: true, bio: 'Il a bâti l\'Arène des Échos après la chute de Malvorak : on y affronte le souvenir des grands boss.', act: { type: 'arena', label: 'Arène des Échos', kinds: ['boss_orc_chief', 'boss_mines', 'boss_lave', 'boss_temple', 'boss_sultan', 'boss_marais', 'boss_neige', 'boss_volcan'], mult: 2.2, reward: { gold: 4000, items: [['mithril', 6]], rep: ['garde', 60] } } },
  { name: 'Althéa, collectionneuse', look: 'npc_relic', zone: 'village', bio: 'Elle tient un cabinet de curiosités et récompense les collections complètes.', act: { type: 'collect', count: P => (P.history ? new Set(P.history.map(h => h.id || h)).size : 0) + Object.keys(P.recipes || {}).length, steps: [20, 40, 70, 100, 150], unit: 'objets et recettes collectionnés', reward: k => ({ gold: 300 * k, items: [['cristal_magique', 2 * k]], rep: ['artisans', 30] }), label: 'Cabinet de curiosités' } },
  { name: 'Varkos, forge des légendes', look: 'npc_smith', zone: 'lave', post: true, bio: 'Forgeron millénaire réveillé par la chute de Malvorak. Il pousse une arme au-delà de ses limites, une seule fois.', act: { type: 'legend', label: 'Forge des légendes' } },
  { name: 'Elyndra, gardienne des maîtrises', look: 'npc_mage', zone: 'cristal', bio: 'Elle consacre ceux qui ont poussé une magie ou une arme jusqu\'au bout.', act: { type: 'collect', count: P => Object.keys(P.mastery || {}).filter(f => magLevel(P, f) >= 10).length + Object.keys(P.styleXp || {}).filter(s => (P.styleXp[s] || 0) >= 4000).length, steps: [1, 2, 3, 5, 8], unit: 'maîtrises complètes (magie niveau 10 ou style accompli)', reward: k => ({ gold: 600 * k, items: [['fragment_runique', 3 * k]], rep: ['archives', 40] }), label: 'Consécrations' } },
];
function acts() { if (!G.flags.acts) G.flags.acts = {}; return G.flags.acts; }
function zoneCenterFree(zid, at) { const z = WORLD.zones.find(z => z.id === zid); if (!z) return null; const [x, y] = freeTileNear(at ? at[0] : Math.round((z.x0 + z.x1) / 2), at ? at[1] : Math.round((z.y0 + z.y1) / 2)); return [x * TILE + 16, y * TILE + 16]; }
function placeNewNpcs() {
  if (WORLD.npcs.some(n => n.role === 'cahier')) return;
  for (const D of NEW_NPC) { const p = zoneCenterFree(D.zone, D.at); if (!p) continue; WORLD.npcs.push({ look: D.look, x: p[0], y: p[1], name: D.name, role: 'cahier', dir: 2, cahier: D.name }); }
}
{ const gw = genWorld; genWorld = function () { gw(); placeNewNpcs(); }; if (typeof WORLD !== 'undefined' && WORLD.npcs && WORLD.npcs.length) placeNewNpcs(); }
const dayN = () => (G.flags.bru && G.flags.bru.day) || 1;
// itinérants : un village par jour
setInterval(() => { try { if (G.mode !== 'play') return; for (const D of NEW_NPC) if (D.roam) { const n = G.npcs.find(g => g.name === D.name); if (!n) continue; const zid = D.roam[dayN() % D.roam.length]; if (n.roamDay !== dayN()) { const p = zoneCenterFree(zid, zid === 'village' ? [50, 62] : null); if (p) { n.x = p[0]; n.y = p[1]; } n.roamDay = dayN(); } } } catch (e) { } }, 2000);
function giveReward(P, W, who) { if (!W) return; if (W.gold) P.gold += W.gold; for (const [id, q] of W.items || []) try { giveItem(P, id, q, who); } catch (e) { } if (W.rel) try { relGain(who, W.rel); } catch (e) { } if (W.rep) try { repGain(W.rep[0], W.rep[1]); } catch (e) { } if (W.buff) { P.purifT = G.t + 300; toast('Bénédiction d\'Amon : +10 % de résistance aux dégâts pendant 5 min', '#c4b5fd'); }
  toast(who.split(',')[0] + ' : ' + (W.gold ? W.gold + ' or' : 'récompense'), '#ffe27a'); try { gainXp(Math.round((W.gold || 100) * 0.6)); } catch (e) { } saveGame(); }
{ const hp0 = hurtPlayer; hurtPlayer = function (P, dmg, ...r) { if (P.purifT && G.t < P.purifT) dmg *= 0.9; return hp0(P, dmg, ...r); }; }
// défis du jour (Iséria) : trois épreuves tirées chaque jour
const CHAL_POOL = [
  { id: 'k30', d: 'Vaincre 30 monstres', n: 30, ev: 'kill' }, { id: 'el2', d: 'Vaincre 2 ennemis d\'élite', n: 2, ev: 'kill', test: e => e.def && e.def.elite },
  { id: 'sk25', d: 'Lancer 25 compétences magiques', n: 25, ev: 'cast' }, { id: 'ch1', d: 'Ouvrir un coffre', n: 1, ev: 'chest' },
  { id: 'fi3', d: 'Pêcher 3 poissons', n: 3, ev: 'fish' }, { id: 'ga5', d: 'Récolter 5 fois', n: 5, ev: 'gather' }, { id: 'cr2', d: 'Fabriquer 2 objets', n: 2, ev: 'craft' },
];
function chal() { const A = acts(); if (!A.chal || A.chal.day !== dayN()) { const pool = CHAL_POOL.slice(); const pick = []; let s = dayN() * 9301 + 49297; while (pick.length < 3) { s = (s * 9301 + 49297) % 233280; const i = Math.floor(s / 233280 * pool.length); pick.push(pool.splice(i, 1)[0].id); } A.chal = { day: dayN(), ids: pick, p: {}, done: {} }; } return A.chal; }
function chalEv(ev, e) { try { const C = chal(); for (const id of C.ids) { const D = CHAL_POOL.find(c => c.id === id); if (D.ev !== ev || C.done[id] || (D.test && !D.test(e))) continue; C.p[id] = (C.p[id] || 0) + 1; if (C.p[id] >= D.n) { C.done[id] = 1; toast('Défi du jour accompli : ' + D.d + ' (retourne voir Iséria)', '#ffe27a'); } } } catch (er) { } }
{ const ke0 = killEnemy; killEnemy = function (e) { const r = ke0(e); chalEv('kill', e); try { const A = acts(); for (const D of NEW_NPC) { const s = A[D.name]; if (!s || !s.active) continue; const z = zoneAt(e.x, e.y); if (D.act.type === 'hunt' && z && D.act.zones.test(z.id)) { s.n = (s.n || 0) + 1; if (s.n === D.act.n) toast(D.act.label + ' : objectif atteint, retourne voir ' + D.name.split(',')[0], '#ffe27a'); } if ((D.act.type === 'elite' || D.act.type === 'arena') && e.actOf === D.name) { s.n = (s.n || 0) + 1; } } } catch (er) { } return r; }; }
{ const cs0 = castSkill; castSkill = function (...a) { const r = cs0.apply(this, a); chalEv('cast'); return r; }; }
{ const dc0 = doCraft; doCraft = function (P, r) { const w = dc0(P, r); if (!w) chalEv('craft'); return w; }; }
{ const ga0 = gather; gather = function (n) { const r = ga0(n); chalEv('gather'); return r; }; }
{ const gi0 = giveItem; giveItem = function (P, id, n, src) { const r = gi0(P, id, n, src); if (src === 'Pêche') chalEv('fish'); return r; }; }
{ const oc0 = typeof openChest === 'function' ? openChest : null; if (oc0) openChest = function (...a) { const r = oc0.apply(this, a); chalEv('chest'); return r; }; }
// rumeurs (Eolan) : un coffre encore fermé ou un lieu non examiné, avec une direction seulement
function rumor(P) { const ch = WORLD.chests.filter(c => !c.opened); const c = ch[Math.floor(Math.random() * ch.length)]; if (!c) return 'Je n\'ai plus rien à t\'apprendre : tu as tout trouvé !'; const z = zoneAt(c.x, c.y), dx = c.x - P.x, dy = c.y - P.y; const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'l\'est' : 'l\'ouest') : (dy > 0 ? 'le sud' : 'le nord'); return `On raconte qu'un coffre attend encore quelque part vers ${dir}, du côté de « ${z ? z.name : 'la forêt'} »…`; }
// étal du jour (Rhovan) : 5 objets rares tirés chaque jour
function rotStock() { const ids = Object.keys(REG).filter(k => { const d = REG[k]; return (d.kind === 'weapon' || d.kind === 'armor' || d.kind === 'accessory') && (d.rarity || 1) >= 3 && (d.rarity || 1) <= 4 && d.tradeRules !== 'bound' && d.tradeRules !== 'quest'; }); const out = []; let s = dayN() * 7919 + 13; while (out.length < 5 && ids.length) { s = (s * 16807) % 2147483647; out.push(ids.splice(s % ids.length, 1)[0]); } return out; }
window.bruNpcHook2 = null;
{ const it0 = interact; interact = function (n) {
    if (!n || n.role !== 'cahier') return it0(n);
    const D = NEW_NPC.find(d => d.name === n.name); if (!D) return it0(n); const P = G.player, A = acts(), s = A[D.name] || (A[D.name] = {}), who = D.name, Q = D.act; try { codexAdd('p', who, who); relGain(who, 1); } catch (e) { }
    const opts = [], intro = `<p><i>${D.bio}</i></p>`; let h = intro;
    if (D.post && !sagaDone()) { h += '<p>« Reviens quand Malvorak sera tombé. Ce que j\'ai à t\'offrir n\'a de sens qu\'après. »</p>'; return dialog(who, h, [['Au revoir', closePanel]]); }
    if (Q.type === 'deliver') { const ok = Q.items.every(([id, q]) => countItem(P, id) >= q), cd = s.day === dayN(); h += `<p><b>${Q.label}</b> (une fois par jour) : ${Q.items.map(([id, q]) => q + ' × ' + (REG[id] ? REG[id].name : id)).join(', ')}.</p>`; if (cd) h += '<p><small>Déjà fait aujourd\'hui. Reviens demain.</small></p>'; else if (ok) opts.push(['Donner', () => { for (const [id, q] of Q.items) takeItem(P, id, q); s.day = dayN(); giveReward(P, Q.reward, who); closePanel(); }]); }
    if (Q.type === 'hunt') { if (!s.active) { h += `<p><b>${Q.label}</b> : vaincre ${Q.n} ennemis de la région.</p>`; if (s.day !== dayN()) opts.push(['Accepter', () => { s.active = true; s.n = 0; toast(Q.label + ' accepté', '#ffe27a'); closePanel(); }]); else h += '<p><small>Reviens demain pour un nouveau contrat.</small></p>'; } else { h += `<p><b>${Q.label}</b> : ${Math.min(s.n || 0, Q.n)} / ${Q.n}.</p>`; if ((s.n || 0) >= Q.n) opts.push(['Rendre le contrat', () => { s.active = false; s.day = dayN(); giveReward(P, Q.reward, who); closePanel(); }]); } }
    if (Q.type === 'trade') { h += '<p><b>Troc</b> : échanges fixes, sans or.</p>'; for (const [give, get] of Q.offers) { const ok = countItem(P, give[0]) >= give[1]; opts.push([`${give[1]} ${REG[give[0]] ? REG[give[0]].name : give[0]} → ${get[1]} ${REG[get[0]] ? REG[get[0]].name : get[0]}${ok ? '' : ' (manque)'}`, () => { if (!ok) return; takeItem(P, give[0], give[1]); giveItem(P, get[0], get[1], 'Troc avec Griv'); toast('Troc conclu', '#ffe27a'); closePanel(); interact(n); }]); } }
    if (Q.type === 'collect') { const c = Q.count(P), got = s.got || 0; h += `<p><b>${Q.label}</b> : ${c} ${Q.unit}. Paliers : ${Q.steps.map((v, i) => (i < got ? '✔ ' : '') + v).join(' · ')}</p>`; if (got < Q.steps.length && c >= Q.steps[got]) opts.push(['Recevoir la récompense du palier ' + (got + 1), () => { s.got = got + 1; giveReward(P, Q.reward(got + 1), who); closePanel(); }]); }
    if (Q.type === 'elite' || Q.type === 'arena') { const goal = Q.type === 'elite' ? Q.n : 1;
      if (!s.active) { h += `<p><b>${Q.label}</b>${Q.type === 'arena' ? ' : affronter l\'écho d\'un grand boss, plus puissant que l\'original' : ' : ' + Q.n + ' élites surgissent près d\'ici'}.</p>`; if (s.day === dayN()) h += '<p><small>Reviens demain.</small></p>'; else opts.push(['Commencer', () => { s.active = true; s.n = 0; closePanel(); spawnActFoes(D, n); }]); }
      else { h += `<p><b>${Q.label}</b> : ${Math.min(s.n || 0, goal)} / ${goal}.</p>`; if ((s.n || 0) >= goal) opts.push(['Réclamer la récompense', () => { s.active = false; s.day = dayN(); giveReward(P, Q.reward, who); closePanel(); }]); else opts.push(['Faire réapparaître', () => { closePanel(); spawnActFoes(D, n); }]); } }
    if (Q.type === 'rumor') { h += `<p>« ${rumor(P)} »</p>`; }
    if (Q.type === 'rotshop') { h += '<p><b>Étal du jour</b> (change chaque jour) :</p>'; for (const id of rotStock()) { const d = REG[id], pr = Math.round(basePrice(d) * 1.4); opts.push([`${d.name} — ${pr} or`, () => { if (P.gold < pr) return toast('Pas assez d\'or', '#ffb36b'); if (!canReceive(P, [[id, 1]])) return toast('Inventaire plein', '#ffb36b'); P.gold -= pr; giveItem(P, id, 1, 'Étal de Rhovan'); saveGame(); closePanel(); }]); } }
    if (Q.type === 'challenges') { const C = chal(); h += '<p><b>Défis du jour</b> :</p><ul>' + C.ids.map(id => { const c = CHAL_POOL.find(x => x.id === id); return `<li>${C.done[id] ? '✔ ' : ''}${c.d} (${Math.min(C.p[id] || 0, c.n)}/${c.n})${C.claimed && C.claimed[id] ? ' — récompensé' : ''}</li>`; }).join('') + '</ul>';
      for (const id of C.ids) if (C.done[id] && !(C.claimed && C.claimed[id])) opts.push(['Récompense : ' + CHAL_POOL.find(x => x.id === id).d, () => { C.claimed = C.claimed || {}; C.claimed[id] = 1; giveReward(P, { gold: 150 + 20 * (P.lvl || 1), items: [['cristal_magique', 1]] }, who); closePanel(); }]); }
    if (Q.type === 'legend') { const inst = P.equip && P.equip.weapon && findInst(P, P.equip.weapon); h += '<p><b>Forge des légendes</b> : une seule fois par arme, je repousse son amélioration maximale de 2 niveaux. Prix : 6 000 or, 5 mithril, 5 cendres.</p>'; if (inst && !inst.legend) opts.push(['Forger l\'arme équipée', () => { if (P.gold < 6000 || countItem(P, 'mithril') < 5 || countItem(P, 'cendres') < 5) return toast('Il manque de l\'or ou des matériaux', '#ffb36b'); P.gold -= 6000; takeItem(P, 'mithril', 5); takeItem(P, 'cendres', 5); inst.legend = 2; toast('Ton arme peut maintenant dépasser ses limites (+2 niveaux)', '#ffd040'); saveGame(); closePanel(); }]); else if (inst) h += '<p><small>Ton arme équipée a déjà été forgée ici.</small></p>'; }
    opts.push(['Au revoir', closePanel]); dialog(who, h, opts);
  }; }
// forge des légendes : plafond d'amélioration +2
{ const mu0 = maxUp; maxUp = function (inst) { return mu0(inst) + (inst && inst.legend ? inst.legend : 0); }; }
// adversaires des activités (élites, échos de boss) : apparaissent près du PNJ, marqués pour le décompte
function spawnActFoes(D, n) {
  const P = G.player, kinds = D.act.type === 'arena' ? [D.act.kinds[Math.floor(Math.random() * D.act.kinds.length)]] : null;
  const list = kinds || (() => { // élites à la mesure du joueur : choisies dans la tranche de puissance correspondant à son niveau
    const pool = Object.keys(ENEMIES).filter(k => ENEMIES[k].elite && !/^boss_/.test(k)).sort((a, b) => (ENEMIES[a].hp || 0) - (ENEMIES[b].hp || 0));
    const f = Math.min(1, (P.lvl || 1) / ((typeof CONFIG !== 'undefined' && CONFIG.maxLevel) || 60)), c = Math.round(f * (pool.length - 1)), lo = Math.max(0, c - 2), hi = Math.min(pool.length - 1, c + 2);
    return [0, 1, 2].map(() => pool[lo + Math.floor(Math.random() * (hi - lo + 1))]); })();
  list.forEach((k, i) => { const a = i * 2.1, x = n.x + Math.cos(a) * 140, y = n.y + Math.sin(a) * 140; try { const e = spawnEnemy(k, x, y); if (!e) return; e.def = Object.assign({}, e.def, { boss: false, elite: true, name: (D.act.type === 'arena' ? 'Écho de ' : '') + (e.def.name || k) }); const m = D.act.mult || 1.3; e.hp = e.maxhp = Math.round(e.maxhp * m); e.actOf = D.name; e.aggro = true; } catch (er) { } });
  toast(D.act.label + ' : ' + (kinds ? 'un écho surgit !' : 'des élites surgissent !'), '#ff8a6a');
}

// ---------------------------------------------------------------------
//  8. GARDE-FOU : halo lumineux (glow) appelé avec une opacité ou un rayon invalides (NaN) par certains effets.
//     Le dessin levait une erreur et s'interrompait ; il est désormais simplement ignoré pour cette image.
// ---------------------------------------------------------------------
if (typeof glow === 'function') { const gl0 = glow; glow = function (ctx, x, y, r, rgb, a, ...rest) { if (!isFinite(a) || !isFinite(r) || !isFinite(x) || !isFinite(y) || r <= 0) return; return gl0(ctx, x, y, r, rgb, a, ...rest); }; }
