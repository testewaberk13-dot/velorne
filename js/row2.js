'use strict';
// ===================== Phase C (2) — quatrième rangée de régions (y 216–288) =====================
// Jungle Sangvert (x 0–96), Oasis des Mirages (x 96–192), Monts de Fer (x 192–288). Noms : cahier des charges 2.
// Contenu détaillé : PROPOSITIONS. Générées après tout le reste avec leur propre aléatoire : monde existant identique.
const ROW2_Y = 216;
const _regionIdxR2 = regionIdx;
regionIdx = function (tx, ty) {
  if (ty >= ROW2_Y) { const X = tx + Math.sin(ty * 0.35) * 2 + Math.sin(ty * 0.11 + 1) * 3; return 9 + (X < W0 ? 0 : X < 2 * W0 ? 1 : 2); }
  return _regionIdxR2(tx, ty);
};
REGION_NAMES.push('Jungle Sangvert', 'Oasis des Mirages', 'Monts de Fer');
Object.assign(BIOME_TILES, {
  14: { src: 'env/terrain_summer.png', G: ['#0c3418', '#3aa444'], D: ['#3a2814', '#7a5a30'] },
  15: { src: 'env/terrain_summer.png', W: ['#0a3628', '#3a9c7c'] },
  16: { src: 'env/terrain_summer.png', G: ['#9a7a34', '#f0d48a'], D: ['#9a6a36', '#eab872'] },
  17: { src: 'env/terrain_summer.png', G: ['#262630', '#7e7e8a'], D: ['#3a2a24', '#8e6e5e'] },
  18: { src: 'env/terrain_summer.png', W: ['#181828', '#5a6a8e'] }
});
REGION_TILES.push({ land: 14, water: 15 }, { land: 16, water: 10 }, { land: 17, water: 18 });
if (typeof GRASS_PAL !== 'undefined') GRASS_PAL.push(
  { c: ['#0e3a16', '#2a7a2c', '#5ac04a'], dens: 1.5, flower: ['#e8343a', '#ff9a2a', '#ffffff'] },
  { c: ['#7a6a30', '#a89448', '#d8c880'], dens: 0.3 },
  { c: ['#3a3a40', '#5e5e66', '#8e8e98'], dens: 0.35 });
if (typeof R25_ZONE !== 'undefined') Object.assign(R25_ZONE, {
  jungle: { grade: 'rgb(140,230,150)', ga: 0.22, fog: '110,170,120', fa: 0.46, rays: 0.1 },
  oasis: { grade: 'rgb(255,206,140)', ga: 0.2, fog: '250,226,180', fa: 0.38, rays: 0.12 },
  monts: { grade: 'rgb(200,205,225)', ga: 0.18, fog: '170,176,190', fa: 0.44, rays: 0.04 }
});
genSprite('ironore', 36, 30, (x) => { _px(x, '#3a3a42', 2, 8, 32, 20); _px(x, '#5a5a66', 4, 6, 26, 8); _px(x, '#c86a3a', 10, 12, 4, 3); _px(x, '#c86a3a', 22, 16, 5, 3); _px(x, '#e8a060', 11, 12, 2, 1); _px(x, '#2a2a30', 2, 26, 32, 2); });
Object.assign(PROPS, { ironore: { im: 'gen/ironore.png', r: [0, 0, 36, 30], col: [-14, -10, 28, 9], sh: 14 } });
Object.assign(ENEMIES, {
  serpent_jungle: E2('snake', { name: 'Serpent de Sangvert', hp: 520, dmg: 50, xp: 150, gold: [36, 56], el: 'poison', res: { poison: 0.8 } }),
  panthere: E2('wolf_brute', { name: 'Panthère d\'ombre', hp: 640, dmg: 56, xp: 170, gold: [40, 62], res: { ombre: 0.4 } }),
  lezard_sauvage: E2('lizard_spearman', { name: 'Chasseur lézard sauvage', hp: 700, dmg: 58, xp: 180, gold: [44, 66] }),
  scorpion_mirage: E2('snake', { name: 'Scorpion des mirages', hp: 640, dmg: 60, xp: 190, gold: [46, 70], el: 'poison', res: { feu: 0.5 } }),
  djinn: E2('dark_mage', { name: 'Djinn des sables', hp: 620, dmg: 64, xp: 210, gold: [50, 76], el: 'feu', res: { feu: 0.7, eau: -0.4 } }),
  momie_ancienne: E2('skeleton_archer', { name: 'Momie ancienne', hp: 700, dmg: 60, xp: 200, gold: [48, 72], res: { feu: -0.4 } }),
  ogre_fer: E2('orc_warrior', { name: 'Ogre des forges', hp: 1100, dmg: 72, xp: 240, gold: [60, 90], res: { physique: 0.3 } }),
  harpie: E2('bee', { name: 'Harpie des cols', hp: 760, dmg: 66, xp: 220, gold: [54, 80], res: { vent: 0.6 } }),
  golem_fer: E2('demon_brute', { name: 'Golem de fer', hp: 1400, dmg: 78, xp: 280, gold: [70, 100], res: { physique: 0.5, foudre: -0.5 } })
});
const ROW2_LOOT = { serpent_jungle: [['ecaille_drake', 0.6, 1, 2]], panthere: [['cuir', 0.7, 1, 3], ['croc', 0.5, 1, 2]], lezard_sauvage: [['ecaille_drake', 0.7, 1, 3]],
  scorpion_mirage: [['ecaille_drake', 0.5, 1, 2]], djinn: [['cristal_magique', 0.8, 1, 3], ['cendres', 0.5, 1, 2]], momie_ancienne: [['essence_spectrale', 0.8, 1, 3]],
  ogre_fer: [['acier', 0.8, 2, 4]], harpie: [['cuir', 0.6, 1, 2]], golem_fer: [['acier', 0.9, 2, 5], ['mithril', 0.6, 1, 3]] };
for (const k in ROW2_LOOT) if (typeof LOOT !== 'undefined') LOOT[k] = { mats: ROW2_LOOT[k].filter(m => REG[m[0]]), weapon: 0.1, tier: 4, seal: 0.05, relic: 0.06 };
const _regionTerrainR2 = regionTerrain;
regionTerrain = function (disc, path, reserve, R) {
  _regionTerrainR2(disc, path, reserve, R);
  const RS = mulberry(5151);
  path([[48, 198], [48, 210], [48, 218], [46, 230], [40, 242]], 1.4); // côte -> jungle (langue de sable à travers la mer)
  path([[146, 218], [146, 230], [140, 242]], 1.1);                    // plaines -> oasis
  path([[242, 218], [242, 230], [236, 244]], 1.1);                    // cristal -> monts
  path([[40, 242], [70, 250], [96, 250], [118, 246], [140, 242]], 1.1);
  path([[140, 242], [170, 250], [192, 250], [214, 248], [236, 244]], 1.1);
  for (let i = 0; i < 26; i++) { const x = 6 + RS() * 84, y = 222 + RS() * 60; if (Math.hypot(x - 40, y - 242) < 12 || Math.abs(y - 250) < 4 || Math.abs(x - 47) < 4) continue; disc(x, y, 2 + RS() * 3, 1.5 + RS() * 2, T_WATER, 0.12); }
  disc(140, 252, 7, 4, T_WATER, 0.05);
  for (let i = 0; i < 6; i++) { const x = 104 + RS() * 80, y = 224 + RS() * 58; if (Math.hypot(x - 140, y - 244) < 14 || Math.abs(y - 250) < 4) continue; disc(x, y, 2 + RS() * 2, 2, T_WATER, 0.08); }
  for (let i = 0; i < 8; i++) { const x = 200 + RS() * 82, y = 222 + RS() * 60; if (Math.hypot(x - 236, y - 244) < 12 || Math.abs(y - 248) < 4 || Math.abs(x - 242) < 4) continue; disc(x, y, 2 + RS() * 2, 1.5 + RS() * 2, T_WATER, 0.1); }
  disc(40, 242, 6, 4, T_DIRT, 0.06); reserve(32, 236, 50, 248);
  disc(140, 244, 6, 4, T_DIRT, 0.06); reserve(132, 238, 150, 250);
  disc(236, 244, 6, 4, T_DIRT, 0.06); reserve(228, 238, 246, 250);
};
const ROW2_WALLS = [
  [0, 215, 42, 217], [54, 215, 140, 217], [152, 215, 236, 217], [248, 215, 288, 217],
  [95, 217, 97, 244], [95, 256, 97, 288], [191, 217, 193, 244], [191, 256, 193, 288]
];
const _genRegionsR2 = genRegions;
genRegions = function (c) {
  _genRegionsR2(c);
  const { add, sp, chestAt, tileFree } = c, T = TILE, RS = mulberry(919);
  WORLD.props = WORLD.props.filter(p => !(p.y > 213 * T && p.y < 219 * T && ((p.x > 41 * T && p.x < 55 * T) || (p.x > 139 * T && p.x < 153 * T) || (p.x > 235 * T && p.x < 249 * T))));
  for (const w of ROW2_WALLS) REGION_WALLS.push(w);
  const pick = (tx, ty) => { const r = regionIdx(tx, ty); return r === 9 ? choice2(RS, ['mangrove', 'palm']) : r === 10 ? choice2(RS, ['rockgreybig', 'cactus']) : r === 11 ? choice2(RS, ['rocktall', 'rockgreybig']) : 'rockgreybig'; };
  const line = (x0, y0, x1, y1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 1.4)); for (let i = 0; i <= n; i++) { const tx = x0 + (x1 - x0) * i / n, ty = y0 + (y1 - y0) * i / n; add(pick(Math.floor(tx), Math.floor(Math.min(287, ty + 1.5))), tx * T + 16, ty * T + 30 + RS() * 6); } };
  for (const w of ROW2_WALLS.slice(4)) line(w[0] + 1, w[1], w[0] + 1, w[3]);
  line(1.5, 217, 1.5, 286); line(287, 217, 287, 286); line(1.5, 286.5, 287, 286.5);
  // Jungle Sangvert : camp
  add('tent', 36 * T, 239 * T); add('tent', 45 * T, 239 * T); add('campfire', 40 * T, 243 * T); add('palm', 32 * T, 238 * T); add('crate', 46 * T, 245 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 40 * T, y: 241 * T, name: 'Vaëlys, éclaireuse de Sangvert', role: 'south', key: 'jungle', dir: 2 });
  WORLD.npcs.push({ look: 'npc_alchemist', x: 37 * T, y: 245 * T, name: 'Rhogar l\'herboriste', role: 'alchimie', dir: 2 });
  sp('serpent_jungle', 20, 228, 3, 4); sp('serpent_jungle', 70, 270, 3, 4); sp('panthere', 72, 228, 2, 3); sp('panthere', 16, 272, 2, 3); sp('lezard_sauvage', 60, 256, 3, 3); sp('lezard_sauvage', 24, 252, 2, 3);
  chestAt(10, 280, ['potion', 'gold:800', 'cristal_magique']); chestAt(86, 224, ['mithril', 'gold:820', 'eclat_exception']);
  // Oasis des Mirages
  add('tent', 134 * T, 241 * T); add('tent', 147 * T, 241 * T); add('palm', 131 * T, 246 * T); add('palm', 150 * T, 247 * T); add('campfire', 140 * T, 245 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 140 * T, y: 243 * T, name: 'Ilyane, gardienne de l\'oasis', role: 'south', key: 'oasis', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 136 * T, y: 246 * T, name: 'Kharim le caravanier', role: 'shop', dir: 2 });
  sp('scorpion_mirage', 116, 226, 3, 4); sp('scorpion_mirage', 176, 272, 3, 4); sp('djinn', 170, 228, 2, 3); sp('djinn', 110, 272, 2, 3); sp('momie_ancienne', 124, 262, 3, 3); sp('momie_ancienne', 184, 252, 2, 3);
  chestAt(104, 282, ['potion', 'gold:900', 'mithril']); chestAt(186, 222, ['eclat_exception', 'gold:950']);
  // Monts de Fer : forteresse
  add('house_b', 231 * T, 241 * T); add('house_a', 241 * T, 241 * T); add('anvil', 236 * T, 246 * T); add('brazier', 232 * T, 247 * T); add('brazier', 240 * T, 247 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 236 * T, y: 243 * T, name: 'Haldor, seigneur de la forteresse', role: 'south', key: 'monts', dir: 2 });
  WORLD.npcs.push({ look: 'npc_smith', x: 239 * T, y: 246 * T + 8, name: 'Dorgan le forgeron', role: 'smith', dir: 1 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 233 * T, y: 246 * T + 8, name: 'Freya la marchande', role: 'shop', dir: 2 });
  sp('ogre_fer', 212, 228, 2, 3); sp('ogre_fer', 270, 270, 2, 3); sp('harpie', 262, 226, 3, 4); sp('harpie', 206, 272, 3, 4); sp('golem_fer', 276, 250, 1, 2); sp('golem_fer', 214, 258, 1, 2);
  chestAt(280, 282, ['mithril', 'gold:1100', 'eclat_exception']); chestAt(200, 222, ['acier', 'gold:1000', 'potion']);
  const deco = (x0, y0, x1, y1, types, dens, spacing) => {
    for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) {
      if (!tileFree(tx, ty) || RS() > dens) continue; const t = types[Math.floor(RS() * types.length)], d = PROPS[t]; const px = tx * T + 16, py = ty * T + 28;
      if (d.fade || d.col) { let ok = true; for (let i = WORLD.props.length - 1; i >= 0 && i > WORLD.props.length - 400; i--) { const p = WORLD.props[i]; if (Math.abs(p.x - px) < spacing && Math.abs(p.y - py) < spacing * 0.8) { ok = false; break; } } if (!ok) continue; }
      add(t, px + RS() * 6, py);
    }
  };
  deco(3, 218, 94, 286, ['palm', 'mangrove', 'bigfern', 'fern', 'bush2', 'bush4', 'tallgrass1', 'grass3'], 0.08, 40);
  deco(98, 218, 190, 286, ['palm', 'cactus', 'rockgreybig', 'rocksm', 'pebble', 'bones'], 0.03, 50);
  deco(194, 218, 286, 286, ['rocktall', 'rockgreybig', 'ironore', 'ironore', 'pine17', 'rocksm', 'pebble'], 0.045, 46);
};
const _genWorldR2 = genWorld;
genWorld = function () {
  _genWorldR2();
  WORLD.zones.splice(WORLD.zones.length - 1, 0,
    { id: 'jungle', name: 'Jungle Sangvert', x0: 0, y0: 216, x1: 96, y1: 288, music: 'forest', dark: 0.16 },
    { id: 'oasis', name: 'Oasis des Mirages', x0: 96, y0: 216, x1: 192, y1: 288, music: 'forest', dark: 0 },
    { id: 'monts', name: 'Monts de Fer', x0: 192, y0: 216, x1: 288, y1: 288, music: 'forest', dark: 0.08 });
};
TRAVEL.push({ id: 'sangvert', n: 'Camp de Sangvert (Jungle)', x: 40, y: 245 }, { id: 'mirages', n: 'Oasis des Mirages', x: 140, y: 247 }, { id: 'haldor', n: 'Forteresse de Haldor (Monts de Fer)', x: 236, y: 248 });
SAFE_ZONES.push({ id: 'sangvert', n: 'Camp de Sangvert', c: [40, 242], r: 7 }, { id: 'mirages', n: 'Oasis des Mirages', c: [140, 244], r: 8 }, { id: 'haldor', n: 'Forteresse de Haldor', c: [236, 244], r: 8 });
Object.assign(TIPS, {
  reg_jungle: ['Jungle Sangvert (niv. 30+)', () => `Une jungle étouffante, pleine de marais et de prédateurs.<br><br>• <b>Camp de Sangvert</b> : <b>Vaëlys</b> et un herboriste.<br>• Serpents, panthères d'ombre, chasseurs lézards sauvages.`],
  reg_oasis: ['Oasis des Mirages (niv. 34+)', () => `Un désert de mirages autour d'une grande oasis.<br><br>• <b>Oasis</b> : <b>Ilyane</b> et un caravanier.<br>• Scorpions, djinns des sables, momies anciennes.`],
  reg_monts: ['Monts de Fer (niv. 38+)', () => `Des montagnes riches en minerai, tenues par une forteresse.<br><br>• <b>Forteresse de Haldor</b> : forgeron et marchande.<br>• Ogres des forges, harpies, golems de fer. Le minerai de fer affleure partout.`]
});
const _interactR2 = interact;
interact = function (n) {
  if (!n || n.role !== 'south' || !['jungle', 'oasis', 'monts'].includes(n.key)) return _interactR2(n);
  const T = {
    jungle: 'Sangvert ne pardonne pas l\'imprudence. Les Gardiens du Vivant surveillent cette jungle : ses créatures étaient paisibles avant que l\'ombre de Nyx ne s\'étende.',
    oasis: 'Les mirages montrent ce que tu désires… ou ce que tu crains. Les caravanes de la route du sel passent toutes par ici. Bois, voyageur, l\'eau est gratuite.',
    monts: 'Le fer de ces montagnes a forgé les armes de la Couronne d\'Aube. Le Cercle des Artisans paie bien ceux qui rapportent du minerai et ceux qui gardent les cols.'
  }[n.key];
  try { codexAdd('p', n.name, n.name); if (relData()[n.name] === undefined) relGain(n.name, 20); repGain({ jungle: 'vivant', oasis: 'pacte', monts: 'artisans' }[n.key], 40); } catch (e) {}
  dialog(n.name, T, [['Au revoir', closePanel]]);
};
