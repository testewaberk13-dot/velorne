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
