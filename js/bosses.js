'use strict';
// ===================== Phase D (1) — boss régionaux et quêtes des nouvelles régions =====================
// Un boss par nouvelle région (arène dégagée) et deux quêtes par chef de village, rattachées aux arcs du cahier 2
// (Arc 3 Peuples de la mer, Arc 4 Routes commerciales, Arc 5 Créatures et liens, Arc 6 Archéologues d'Aether).
// Noms des boss, statistiques, récompenses et textes : PROPOSITIONS.
const RBOSS = {
  boss_cote: { key: 'cote', x: 74, y: 184, def: { name: 'Capitaine Morne, le noyé', short: 'Morne', look: 'skeleton_archer', el: 'eau', res: { eau: 0.7, foudre: -0.4 }, hp: 9000, dmg: 70, spd: 70, xp: 4200, atk: 'slash', range: 60, minion: ['pirate_noye', 'crabe_epave'] } },
  boss_plaines: { key: 'plaines', x: 176, y: 200, def: { name: 'Bralok, roi des brigands', short: 'Bralok', look: 'orc_warrior', res: { physique: 0.2 }, hp: 11500, dmg: 78, spd: 74, xp: 5200, atk: 'slash', range: 62, minion: ['brigand', 'loup_dore'] } },
  boss_cristal: { key: 'cristal', x: 270, y: 190, def: { name: 'Lumenor, colosse de cristal', short: 'Lumenor', look: 'demon_brute', el: 'lumiere', res: { lumiere: 0.7, foudre: 0.4, terre: -0.5 }, hp: 14500, dmg: 88, spd: 58, xp: 6400, atk: 'slash', range: 66, minion: ['golem_cristal', 'oeil_prisme'] } },
  boss_jungle: { key: 'jungle', x: 24, y: 268, def: { name: 'Ssyrath, reine-serpent', short: 'Ssyrath', look: 'lizard_spearman', el: 'poison', res: { poison: 0.9, glace: -0.4 }, hp: 16500, dmg: 94, spd: 80, xp: 7400, atk: 'thrust', range: 72, minion: ['serpent_jungle', 'lezard_sauvage'] } },
  boss_oasis: { key: 'oasis', x: 176, y: 276, def: { name: 'Azhar, djinn des mirages', short: 'Azhar', look: 'dark_mage', el: 'feu', res: { feu: 0.8, eau: -0.5 }, hp: 17500, dmg: 100, spd: 70, xp: 8200, atk: 'slash', range: 64, minion: ['djinn', 'scorpion_mirage'] } },
  boss_monts: { key: 'monts', x: 272, y: 272, def: { name: 'Gorvak, golem-roi des forges', short: 'Gorvak', look: 'demon_brute', res: { physique: 0.5, feu: 0.5, foudre: -0.5 }, hp: 21000, dmg: 110, spd: 54, xp: 9600, atk: 'slash', range: 70, minion: ['golem_fer', 'ogre_fer'] } }
};
for (const k in RBOSS) {
  ENEMIES[k] = Object.assign({ ai: 'boss', cd: 1.1, wind: 0.5, gold: [400, 600], r: 30, boss: 1, scale: 2, bw: 28, bh: 12 }, RBOSS[k].def);
  if (typeof LOOT !== 'undefined') LOOT[k] = { mats: [['acier', 1, 4, 6], ['mithril', 1, 2, 4], ['cristal_magique', 1, 2, 4]].filter(m => REG[m[0]]), weapon: 0.6, tier: 5, seal: 0.5, relic: 0.4 };
}
// arènes (terrain dégagé autour du boss)
const _regionTerrainB = regionTerrain;
regionTerrain = function (disc, path, reserve, R) {
  _regionTerrainB(disc, path, reserve, R);
  for (const k in RBOSS) { const b = RBOSS[k]; disc(b.x, b.y, 9, 6, T_DIRT, 0.08); reserve(b.x - 11, b.y - 8, b.x + 11, b.y + 8); }
};
const _genRegionsB = genRegions;
genRegions = function (c) {
  _genRegionsB(c);
  const { add, sp } = c, T = TILE;
  for (const k in RBOSS) {
    const b = RBOSS[k]; sp(k, b.x, b.y, 1, 0);
    const deco = { cote: 'wreck', plaines: 'haystack', cristal: 'crystal', jungle: 'mangrove', oasis: 'pillar', monts: 'brazier' }[b.key];
    [[-9, -6], [9, -6], [-9, 6], [9, 6]].forEach(([dx, dy]) => add(deco === 'wreck' ? 'rockgreybig' : deco, (b.x + dx) * T, (b.y + dy) * T));
  }
};
const _genWorldB = genWorld;
genWorld = function () { _genWorldB(); for (const n of WORLD.npcs) if (n.role === 'south') n.saga = n.key; };
// quêtes (format des quêtes secondaires existantes : suivi, récompenses et sauvegarde déjà gérés)
const RB_ITEM = id => REG[id] ? id : 'potion';
SIDEQ.push(
  { id: 'q017', npc: 'cote', n: 'Q017 — Les noyés de la baie', desc: 'Les pirates noyés remontent des épaves la nuit. Renvoie-en <b>6</b> au fond.', t: 'kill', k: ['pirate_noye'], c: 6, gold: 600, xp: 900, it: ['potion', 3] },
  { id: 'q018', npc: 'cote', n: 'Q018 — Le capitaine qui ne meurt pas', desc: 'Le <b>Capitaine Morne</b> commande les noyés depuis l\'épave à l\'est du port. Libère la baie.', t: 'kill', k: ['boss_cote'], c: 1, gold: 1500, xp: 2500, it: [RB_ITEM('mithril'), 2] },
  { id: 'q025', npc: 'plaines', n: 'Q025 — Routes sûres', desc: 'Les brigands rançonnent nos convois. Élimines-en <b>8</b>.', t: 'kill', k: ['brigand'], c: 8, gold: 800, xp: 1200, it: ['potion', 3] },
  { id: 'q026', npc: 'plaines', n: 'Q026 — La couronne de paille', desc: '<b>Bralok</b>, qui se dit roi des brigands, campe au sud-est des plaines. Mets fin à son règne.', t: 'kill', k: ['boss_plaines'], c: 1, gold: 1900, xp: 3100, it: [RB_ITEM('mithril'), 2] },
  { id: 'q041', npc: 'cristal', n: 'Q041 — Éclats chantants', desc: 'Les golems de cristal portent des éclats anciens. Brise <b>5</b> golems pour mes recherches.', t: 'kill', k: ['golem_cristal'], c: 5, gold: 1000, xp: 1500, it: [RB_ITEM('cristal_magique'), 3] },
  { id: 'q042', npc: 'cristal', n: 'Q042 — Le cœur de la forêt', desc: '<b>Lumenor</b>, colosse né de la Couronne brisée, garde l\'est de la forêt. Je dois savoir ce qu\'il protège.', t: 'kill', k: ['boss_cristal'], c: 1, gold: 2300, xp: 3800, it: [RB_ITEM('eclat_exception'), 1] },
  { id: 'q033', npc: 'jungle', n: 'Q033 — Le chant des panthères', desc: 'Les panthères d\'ombre ont perdu la raison. Apaise-en <b>5</b> (de force).', t: 'kill', k: ['panthere'], c: 5, gold: 1200, xp: 1800, it: ['potion', 4] },
  { id: 'q034', npc: 'jungle', n: 'Q034 — La reine-serpent', desc: '<b>Ssyrath</b> règne sur le sud-ouest de la jungle. Les Gardiens du Vivant veulent qu\'on l\'arrête.', t: 'kill', k: ['boss_jungle'], c: 1, gold: 2600, xp: 4300, it: [RB_ITEM('mithril'), 3] },
  { id: 'q027', npc: 'oasis', n: 'Q027 — Le sel et le sable', desc: 'Les scorpions des mirages attaquent la route du sel. Élimines-en <b>8</b>.', t: 'kill', k: ['scorpion_mirage'], c: 8, gold: 1300, xp: 2000, it: ['potion', 4] },
  { id: 'q028', npc: 'oasis', n: 'Q028 — Le djinn qui ment', desc: '<b>Azhar</b> fait boire aux voyageurs l\'eau de ses mirages. Il se cache au sud-est de l\'oasis.', t: 'kill', k: ['boss_oasis'], c: 1, gold: 2800, xp: 4700, it: [RB_ITEM('eclat_exception'), 1] },
  { id: 'q029', npc: 'monts', n: 'Q029 — Les cols gardés', desc: 'Les harpies empêchent les mineurs de passer. Abats-en <b>8</b>.', t: 'kill', k: ['harpie'], c: 8, gold: 1500, xp: 2300, it: [RB_ITEM('acier'), 4] },
  { id: 'q030', npc: 'monts', n: 'Q030 — Le roi de fer', desc: '<b>Gorvak</b>, golem-roi, s\'est réveillé au fond des forges du sud-est. Arrête-le avant qu\'il ne forge une armée.', t: 'kill', k: ['boss_monts'], c: 1, gold: 3200, xp: 5300, it: [RB_ITEM('mithril'), 4] }
);
// le chef de village propose ses quêtes
const _interactB = interact;
interact = function (n) {
  if (!n || n.role !== 'south') return _interactB(n);
  const free = SIDEQ.filter(q => q.npc === n.saga && !(sideState(q.id) && sideState(q.id).st === 2)).length;
  dialog(n.name, 'Que puis-je pour toi, voyageur ?', [['Parler', () => _interactB(n)], ['Quêtes' + (free ? ` (${free})` : ''), () => sideMenu(n)], ['Au revoir', closePanel]]);
};
const _sagaTalkB = sagaTalk;
sagaTalk = function (n) { if (n && n.role === 'south') return interact(n); return _sagaTalkB(n); };
