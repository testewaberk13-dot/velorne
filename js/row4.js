'use strict';
// ===================== Phase C (4) — sixième rangée (y 360–432) =====================
// Archipel des Sirènes (x 0–96, îles : la raie traverse la mer), Îles flottantes d'Aether (x 96–192, îles au-dessus du vide :
// seul le griffon le survole), Terres Corrompues (x 192–288). Noms : Bible V0.1 §4.2. Contenu : PROPOSITIONS.
const ROW4_Y = 360;
const _regionIdxR4 = regionIdx;
regionIdx = function (tx, ty) {
  if (ty >= ROW4_Y) { const X = tx + Math.sin(ty * 0.35) * 2 + Math.sin(ty * 0.11 + 1) * 3; return 15 + (X < W0 ? 0 : X < 2 * W0 ? 1 : 2); }
  return _regionIdxR4(tx, ty);
};
REGION_NAMES.push('Archipel des Sirènes', 'Îles flottantes d\'Aether', 'Terres Corrompues');
Object.assign(BIOME_TILES, {
  24: { src: 'env/terrain_summer.png', G: ['#5a7a3a', '#c8d88a'], D: ['#b09a6a', '#f4e6c0'] },
  25: { src: 'env/terrain_summer.png', W: ['#04305a', '#3aa8e0'] },
  26: { src: 'env/terrain_summer.png', G: ['#4a7a5a', '#e0f4c8'], D: ['#7a7a98', '#e0e0f4'] },
  27: { src: 'env/terrain_summer.png', W: ['#02020c', '#4a6ab0'] },
  28: { src: 'env/terrain_summer.png', G: ['#240a14', '#7a2a48'], D: ['#180a10', '#5a2236'] },
  29: { src: 'env/terrain_summer.png', W: ['#180008', '#8a1a3a'] }
});
REGION_TILES.push({ land: 24, water: 25 }, { land: 26, water: 27 }, { land: 28, water: 29 });
if (typeof GRASS_PAL !== 'undefined') GRASS_PAL.push(
  { c: ['#3a6a2a', '#6aa04a', '#a8d87a'], dens: 0.9, flower: ['#ffffff', '#ff9ac0'] },
  { c: ['#3a7a5a', '#8ad8a8', '#e8fff0'], dens: 0.8, flower: ['#fff6b0', '#c8e8ff'] },
  { c: ['#2a0a18', '#5a1a34', '#9a3a5a'], dens: 0.5 });
if (typeof R25_ZONE !== 'undefined') Object.assign(R25_ZONE, {
  archipel: { grade: 'rgb(170,225,255)', ga: 0.18, fog: '200,232,250', fa: 0.36, rays: 0.1 },
  aether: { grade: 'rgb(220,230,255)', ga: 0.2, fog: '220,232,255', fa: 0.5, rays: 0.14 },
  corrompues: { grade: 'rgb(200,60,90)', ga: 0.28, fog: '60,10,24', fa: 0.55, rays: 0 }
});
Object.assign(ENEMIES, {
  sirene: E2('dark_mage', { name: 'Sirène de l\'archipel', hp: 2000, dmg: 108, xp: 420, gold: [100, 150], el: 'eau', res: { eau: 0.8, foudre: -0.5 } }),
  crabe_geant: E2('slime', { name: 'Crabe géant', hp: 2400, dmg: 112, xp: 440, gold: [104, 156], res: { eau: 0.6, physique: 0.3 } }),
  corsaire: E2('goblin_rogue', { name: 'Corsaire des sirènes', hp: 2100, dmg: 114, xp: 430, gold: [110, 160] }),
  sylphe_celeste: E2('bat', { name: 'Sylphe céleste', hp: 2000, dmg: 112, xp: 440, gold: [104, 156], res: { vent: 0.7, lumiere: 0.4 } }),
  golem_celeste: E2('orc_warrior', { name: 'Golem céleste', hp: 3000, dmg: 124, xp: 500, gold: [120, 176], res: { physique: 0.4, lumiere: 0.5 } }),
  gardien_aether: E2('skeleton_archer', { name: 'Gardien d\'Aether', hp: 2600, dmg: 120, xp: 480, gold: [116, 170], res: { lumiere: 0.7, ombre: -0.4 } }),
  horreur: E2('demon_brute', { name: 'Horreur corrompue', hp: 3400, dmg: 132, xp: 540, gold: [128, 186], res: { ombre: 0.6, lumiere: -0.5 } }),
  cultiste_nyx: E2('dark_mage', { name: 'Cultiste de Nyx', hp: 2400, dmg: 126, xp: 500, gold: [120, 176], el: 'ombre', res: { ombre: 0.8, lumiere: -0.5 } }),
  loup_corrompu: E2('wolf_brute', { name: 'Loup corrompu', hp: 2800, dmg: 128, xp: 520, gold: [124, 180], res: { ombre: 0.5 } })
});
const ROW4_LOOT = { sirene: [['cristal_magique', 0.8, 2, 3]], crabe_geant: [['ecaille_drake', 0.8, 2, 3]], corsaire: [['fer', 0.6, 2, 4], ['mithril', 0.2, 1, 1]],
  sylphe_celeste: [['cristal_magique', 0.7, 1, 3]], golem_celeste: [['mithril', 0.6, 1, 3], ['cristal_magique', 0.6, 1, 2]], gardien_aether: [['fragment_runique', 0.7, 1, 3]],
  horreur: [['cendres', 0.8, 2, 4], ['mithril', 0.4, 1, 2]], cultiste_nyx: [['cristal_magique', 0.8, 2, 3], ['fragment_runique', 0.6, 1, 2]], loup_corrompu: [['croc', 0.8, 2, 4]] };
for (const k in ROW4_LOOT) if (typeof LOOT !== 'undefined') LOOT[k] = { mats: ROW4_LOOT[k].filter(m => REG[m[0]]), weapon: 0.14, tier: 5, seal: 0.07, relic: 0.08 };
const RBOSS4 = {
  boss_archipel: { key: 'archipel', x: 70, y: 412, def: { name: 'Nérissa, reine des sirènes', short: 'Nérissa', look: 'dark_mage', el: 'eau', res: { eau: 0.85, foudre: -0.5 }, hp: 33000, dmg: 140, spd: 72, xp: 15000, atk: 'slash', range: 68, minion: ['sirene', 'corsaire'] } },
  boss_aether: { key: 'aether', x: 172, y: 414, def: { name: 'Séraphel, gardien des îles d\'Aether', short: 'Séraphel', look: 'king_specter', el: 'lumiere', res: { lumiere: 0.85, ombre: -0.4 }, hp: 36000, dmg: 146, spd: 74, xp: 16500, atk: 'slash', range: 72, minion: ['gardien_aether', 'golem_celeste'] } },
  boss_corrompues: { key: 'corrompues', x: 272, y: 412, def: { name: 'Nyrathos, rejeton de Nyx', short: 'Nyrathos', look: 'demon_brute', demon: 1, el: 'ombre', res: { ombre: 0.85, lumiere: -0.5 }, hp: 40000, dmg: 154, spd: 66, xp: 18000, atk: 'slash', range: 74, minion: ['horreur', 'cultiste_nyx'] } }
};
for (const k in RBOSS4) { ENEMIES[k] = Object.assign({ ai: 'boss', cd: 1.1, wind: 0.5, gold: [800, 1200], r: 30, boss: 1, scale: 2, bw: 28, bh: 12 }, RBOSS4[k].def); if (typeof LOOT !== 'undefined') LOOT[k] = { mats: [['mithril', 1, 4, 6], ['cristal_magique', 1, 4, 6], ['fragment_runique', 1, 2, 4]].filter(m => REG[m[0]]), weapon: 0.8, tier: 5, seal: 0.7, relic: 0.6 }; }
// îles : centre, rayons
const ISLES_A = [[40, 386, 8, 6], [70, 412, 10, 7], [16, 414, 6, 5], [80, 372, 5, 4], [24, 372, 4, 3]];
const ISLES_B = [[140, 386, 8, 6], [172, 414, 10, 7], [112, 414, 6, 5], [176, 376, 5, 4], [112, 372, 4, 3]];
const _regionTerrainR4 = regionTerrain;
regionTerrain = function (disc, path, reserve, R) {
  _regionTerrainR4(disc, path, reserve, R);
  // mer et vide : tout est « eau » sauf les îles (et les ponts de sable / de pierre vers la première île)
  for (const [x0, x1] of [[2, 94], [98, 190]]) for (let y = 364; y < 430; y += 3) for (let x = x0; x < x1; x += 3) disc(x, y, 2.2, 2.2, T_WATER, 0);
  for (const I of ISLES_A.concat(ISLES_B)) disc(I[0], I[1], I[2], I[3], T_GRASS, 0.05);
  path([[48, 362], [46, 372], [42, 382]], 1.4);    // Hurlevents -> île du village (archipel)
  path([[146, 362], [144, 372], [141, 382]], 1.4); // Vallée des Ombres -> première île d'Aether (pont de pierre)
  path([[242, 344], [242, 362], [242, 374], [236, 388]], 1.4); // Fjord -> Terres Corrompues (gué à travers la mer du fjord)
  path([[236, 388], [214, 396], [196, 396]], 1.1);
  const RS = mulberry(7474);
  for (let i = 0; i < 14; i++) { const x = 198 + RS() * 86, y = 366 + RS() * 62; if (Math.hypot(x - 236, y - 388) < 12 || Math.hypot(x - 272, y - 412) < 13 || Math.abs(x - 242) < 4) continue; disc(x, y, 2 + RS() * 3, 1.5 + RS() * 2, T_WATER, 0.12); }
  disc(40, 386, 6, 4, T_DIRT, 0.06); reserve(32, 380, 50, 392);
  disc(140, 386, 6, 4, T_DIRT, 0.06); reserve(132, 380, 150, 392);
  disc(236, 388, 6, 4, T_DIRT, 0.06); reserve(228, 382, 246, 394);
  for (const k in RBOSS4) { const b = RBOSS4[k]; disc(b.x, b.y, 7, 5, T_DIRT, 0.06); reserve(b.x - 9, b.y - 7, b.x + 9, b.y + 7); }
};
const ROW4_WALLS = [[0, 359, 42, 361], [54, 359, 140, 361], [152, 359, 236, 361], [248, 359, 288, 361], [95, 361, 97, 432], [191, 361, 193, 432]];
const _genRegionsR4 = genRegions;
genRegions = function (c) {
  _genRegionsR4(c);
  const { add, sp, chestAt, tileFree } = c, T = TILE, RS = mulberry(1414);
  WORLD.props = WORLD.props.filter(p => !(p.y > 357 * T && p.y < 363 * T && ((p.x > 41 * T && p.x < 55 * T) || (p.x > 139 * T && p.x < 153 * T) || (p.x > 235 * T && p.x < 249 * T))));
  for (const w of ROW4_WALLS) REGION_WALLS.push(w);
  const line = (x0, y0, x1, y1, t) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 1.4)); for (let i = 0; i <= n; i++) { const tx = x0 + (x1 - x0) * i / n, ty = y0 + (y1 - y0) * i / n; add(t, tx * T + 16, ty * T + 30 + RS() * 6); } };
  line(1.5, 361, 1.5, 430, 'rockgreybig'); line(287, 361, 287, 430, 'deadtree'); line(1.5, 430.5, 287, 430.5, 'rockgreybig');
  line(193, 361, 193, 430, 'deadtree');
  // Archipel : village de Vess
  add('house_c', 36 * T, 383 * T); add('house_b', 45 * T, 383 * T); add('palm', 32 * T, 389 * T); add('palm', 48 * T, 389 * T); add('campfire', 40 * T, 387 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 40 * T, y: 385 * T, name: 'Vess, cheffe de l\'archipel', role: 'south', key: 'archipel', saga: 'archipel', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 37 * T, y: 389 * T, name: 'Neroth le pêcheur de perles', role: 'shop', dir: 2 });
  sp('sirene', 70, 408, 2, 3); sp('corsaire', 16, 414, 2, 2); sp('crabe_geant', 80, 372, 2, 2); sp('crabe_geant', 44, 392, 1, 2); sp('corsaire', 24, 372, 1, 1);
  chestAt(16, 416, ['eclat_exception', 'gold:1600']); chestAt(80, 374, ['mithril', 'gold:1500', 'cristal_magique']);
  // Îles d'Aether : sanctuaire, dresseur de griffons
  add('pillar', 135 * T, 382 * T); add('pillar', 145 * T, 382 * T); add('crystal', 134 * T, 390 * T); add('crystal', 146 * T, 390 * T);
  WORLD.npcs.push({ look: 'npc_mage', x: 140 * T, y: 385 * T, name: 'Eshara, archéologue d\'Aether', role: 'south', key: 'aether', saga: 'aether', dir: 2 });
  WORLD.npcs.push({ look: 'npc_guard', x: 144 * T, y: 389 * T, name: 'Luthen, dresseur de griffons', role: 'stable', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 136 * T, y: 389 * T, name: 'Caldris le marchand d\'éclats', role: 'shop', dir: 2 });
  sp('sylphe_celeste', 140, 376, 2, 3); sp('golem_celeste', 172, 408, 2, 2); sp('gardien_aether', 112, 414, 2, 2); sp('sylphe_celeste', 176, 376, 2, 2); sp('gardien_aether', 112, 372, 1, 1);
  chestAt(112, 416, ['eclat_exception', 'gold:1700', 'fragment_runique']); chestAt(176, 378, ['mithril', 'gold:1650']); chestAt(112, 374, ['cristal_magique', 'gold:1500']);
  // Terres Corrompues : dernier bastion
  add('pillar', 231 * T, 384 * T); add('pillar', 241 * T, 384 * T); add('brazier', 233 * T, 391 * T); add('brazier', 239 * T, 391 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 236 * T, y: 387 * T, name: 'Drazek, chef du dernier bastion', role: 'south', key: 'corrompues', saga: 'corrompues', dir: 2 });
  WORLD.npcs.push({ look: 'npc_alchemist', x: 233 * T, y: 391 * T, name: 'Nyra la purificatrice', role: 'alchimie', dir: 2 });
  sp('horreur', 214, 372, 2, 3); sp('horreur', 270, 424, 2, 3); sp('cultiste_nyx', 262, 372, 3, 3); sp('cultiste_nyx', 206, 420, 2, 3); sp('loup_corrompu', 250, 400, 3, 4); sp('loup_corrompu', 220, 404, 2, 3);
  chestAt(282, 368, ['eclat_exception', 'gold:1800', 'mithril']); chestAt(200, 426, ['fragment_runique', 'gold:1700']);
  for (const k in RBOSS4) { const b = RBOSS4[k]; sp(k, b.x, b.y, 1, 0); const d = { archipel: 'palm', aether: 'crystal', corrompues: 'brazier' }[b.key]; [[-7, -5], [7, -5], [-7, 5], [7, 5]].forEach(([dx, dy]) => add(d, (b.x + dx) * T, (b.y + dy) * T)); }
  const deco = (x0, y0, x1, y1, types, dens, spacing) => {
    for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) {
      if (!tileFree(tx, ty) || RS() > dens) continue; const t = types[Math.floor(RS() * types.length)], d = PROPS[t]; const px = tx * T + 16, py = ty * T + 28;
      if (d.fade || d.col) { let ok = true; for (let i = WORLD.props.length - 1; i >= 0 && i > WORLD.props.length - 400; i--) { const p = WORLD.props[i]; if (Math.abs(p.x - px) < spacing && Math.abs(p.y - py) < spacing * 0.8) { ok = false; break; } } if (!ok) continue; }
      add(t, px + RS() * 6, py);
    }
  };
  deco(3, 362, 94, 430, ['palm', 'rocksm', 'pebble', 'grass1', 'reed1'], 0.05, 40);
  deco(98, 362, 190, 430, ['crystaltree', 'crystal', 'pillar', 'grass2', 'flower3'], 0.05, 40);
  deco(196, 362, 286, 430, ['deadtree', 'witheredtree', 'bones', 'obsidian', 'rockgrey', 'pebble'], 0.05, 44);
};
const _genWorldR4 = genWorld;
genWorld = function () {
  _genWorldR4();
  WORLD.zones.splice(WORLD.zones.length - 1, 0,
    { id: 'archipel', name: 'Archipel des Sirènes', x0: 0, y0: 360, x1: 96, y1: 432, music: 'forest', dark: 0.02 },
    { id: 'aether', name: 'Îles flottantes d\'Aether', x0: 96, y0: 360, x1: 192, y1: 432, music: 'forest', dark: 0 },
    { id: 'corrompues', name: 'Terres Corrompues', x0: 192, y0: 360, x1: 288, y1: 432, music: 'forest', dark: 0.36 });
};
TRAVEL.push({ id: 'vess', n: 'Village de Vess (Archipel des Sirènes)', x: 40, y: 389 }, { id: 'eshara', n: 'Sanctuaire d\'Aether (Îles flottantes)', x: 140, y: 389 }, { id: 'drazek', n: 'Dernier bastion (Terres Corrompues)', x: 236, y: 391 });
SAFE_ZONES.push({ id: 'vess', n: 'Village de Vess', c: [40, 386], r: 7 }, { id: 'eshara', n: 'Sanctuaire d\'Aether', c: [140, 386], r: 7 }, { id: 'drazek', n: 'Dernier bastion', c: [236, 388], r: 7 });
Object.assign(TIPS, {
  reg_archipel: ['Archipel des Sirènes (niv. 54+)', () => `Des îles perdues dans une mer chaude.<br><br>• <b>Village de Vess</b> sur l'île principale.<br>• Les autres îles se rejoignent par la mer : la <b>Raie des brumes</b> (Vasebourg) traverse les eaux de l'archipel.`],
  reg_aether: ['Îles flottantes d\'Aether (niv. 58+)', () => `Des îles suspendues au-dessus du vide, vestiges d'Aether.<br><br>• <b>Sanctuaire</b> sur la première île : <b>Luthen</b> y dresse des <b>griffons</b> (15 000 or), seule monture capable de survoler le vide.<br>• Gardiens d'Aether, golems et sylphes célestes.`],
  reg_corrompues: ['Terres Corrompues (niv. 62+)', () => `Le sol saigne là où Nyx a touché le monde.<br><br>• <b>Dernier bastion</b> : Drazek et Nyra la purificatrice.<br>• Horreurs corrompues, cultistes de Nyx, loups corrompus.`]
});
SIDEQ.push(
  { id: 'q021', npc: 'archipel', n: 'Q021 — Les corsaires des sirènes', desc: 'Des corsaires pillent les îles. Élimines-en <b>3</b> (prends la Raie pour rejoindre leurs îles).', t: 'kill', k: ['corsaire'], c: 3, gold: 2400, xp: 3600, it: ['potion', 5] },
  { id: 'q022', npc: 'archipel', n: 'Q022 — Le chant de Nérissa', desc: '<b>Nérissa</b>, reine des sirènes, attire les marins sur l\'île du sud-est. Brise son chant.', t: 'kill', k: ['boss_archipel'], c: 1, gold: 5000, xp: 8200, it: [REG.mithril ? 'mithril' : 'potion', 5] },
  { id: 'q043', npc: 'aether', n: 'Q043 — Les gardiens endormis', desc: 'Les gardiens d\'Aether se sont réveillés hostiles. Apaises-en <b>3</b>.', t: 'kill', k: ['gardien_aether'], c: 3, gold: 2600, xp: 3900, it: [REG.fragment_runique ? 'fragment_runique' : 'potion', 3] },
  { id: 'q044', npc: 'aether', n: 'Q044 — Le dernier gardien', desc: '<b>Séraphel</b> garde l\'île la plus haute, au sud-est. Il faudra un griffon pour l\'atteindre.', t: 'kill', k: ['boss_aether'], c: 1, gold: 5500, xp: 9000, it: [REG.eclat_exception ? 'eclat_exception' : 'potion', 2] },
  { id: 'q051', npc: 'corrompues', n: 'Q051 — Purifier le sol', desc: 'Les cultistes de Nyx entretiennent la corruption. Élimines-en <b>8</b>.', t: 'kill', k: ['cultiste_nyx'], c: 8, gold: 2800, xp: 4200, it: ['potion', 5] },
  { id: 'q052', npc: 'corrompues', n: 'Q052 — Le rejeton de Nyx', desc: '<b>Nyrathos</b>, né de la corruption, grandit au sud-est des Terres. Tue-le avant qu\'il ne devienne un second Malvorak.', t: 'kill', k: ['boss_corrompues'], c: 1, gold: 6000, xp: 10000, it: [REG.mithril ? 'mithril' : 'potion', 6] }
);
Object.assign(SOUTH_TALK, {
  archipel: 'Les sirènes chantaient pour guider les marins. Depuis que Nérissa règne, elles les noient. Pour aller d\'île en île, il te faudra une monture qui nage.',
  aether: 'Ces îles flottaient au-dessus de la Mer Intérieure bien avant la Couronne d\'Aube. Leurs ruines parlent d\'Aether lui-même. Sans griffon, tu ne verras que cette île.',
  corrompues: 'Ici, Nyx a laissé plus qu\'une cicatrice : la terre vit et elle a faim. Nous tenons ce bastion pour que la corruption ne descende pas vers les villages.'
});
Object.assign(SOUTH_REP, { archipel: 'navigateurs', aether: 'archives', corrompues: 'voile' });
