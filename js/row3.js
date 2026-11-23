'use strict';
// ===================== Phase C (3) — cinquième rangée (y 288–360) =====================
// Hurlevents (x 0–96), Vallée des Ombres (x 96–192), Fjord des Baleines (x 192–288). Noms : Bible V0.1 §4.2 / cahier 2.
// Contenu, PNJ, boss, quêtes : PROPOSITIONS. Générées après tout le reste, aléatoire propre : monde existant identique.
const ROW3_Y = 288;
const _regionIdxR3 = regionIdx;
regionIdx = function (tx, ty) {
  if (ty >= ROW3_Y) { const X = tx + Math.sin(ty * 0.35) * 2 + Math.sin(ty * 0.11 + 1) * 3; return 12 + (X < W0 ? 0 : X < 2 * W0 ? 1 : 2); }
  return _regionIdxR3(tx, ty);
};
REGION_NAMES.push('Hurlevents', 'Vallée des Ombres', 'Fjord des Baleines');
Object.assign(BIOME_TILES, {
  19: { src: 'env/terrain_summer.png', G: ['#4a5a3a', '#a8b88a'], D: ['#5a5244', '#a8a08a'] },
  20: { src: 'env/terrain_summer.png', G: ['#14101e', '#4a3e62'], D: ['#1a1222', '#4e3e5a'] },
  21: { src: 'env/terrain_summer.png', W: ['#0a0614', '#3a2a5a'] },
  22: { src: 'env/terrain_winter.png', G: ['#6a7a8a', '#eef4fa'], D: ['#4a4a52', '#9aa0aa'] },
  23: { src: 'env/terrain_summer.png', W: ['#06223e', '#3a8ac0'] }
});
REGION_TILES.push({ land: 19, water: 0 }, { land: 20, water: 21 }, { land: 22, water: 23 });
if (typeof GRASS_PAL !== 'undefined') GRASS_PAL.push(
  { c: ['#4a5a34', '#7a8a52', '#b8c88a'], dens: 0.9 },
  { c: ['#1e1a2e', '#3a3058', '#6a5a90'], dens: 0.5, flower: ['#b07cff'] },
  { c: ['#6a7a88', '#a8b8c4', '#eef6fb'], dens: 0.35 });
if (typeof R25_ZONE !== 'undefined') Object.assign(R25_ZONE, {
  hurlevents: { grade: 'rgb(200,220,200)', ga: 0.16, fog: '200,210,200', fa: 0.5, rays: 0.06 },
  ombres: { grade: 'rgb(120,90,180)', ga: 0.28, fog: '50,36,80', fa: 0.55, rays: 0 },
  fjord: { grade: 'rgb(180,210,255)', ga: 0.2, fog: '214,228,244', fa: 0.44, rays: 0.05 }
});
// Hurlevents : le vent pousse le joueur (léger) — trait de région PROPOSITION
setInterval(() => { try { const P = G.player; if (P && G.mode === 'play' && !G.paused && G.zone && G.zone.id === 'hurlevents' && !(typeof playerSafe === 'function' && playerSafe())) { const w = Math.sin(G.t * 0.4) * 3; moveBody(P, w, 0); if (Math.random() < 0.6) part(G.cam.x + Math.random() * W, G.cam.y + Math.random() * H, { col: 'rgba(230,240,230,0.6)', life: 0.8, size: 1, vx: 120 * Math.sign(w || 1), vy: rnd(-6, 6), drag: 1 }); } } catch (e) {} }, 100);
Object.assign(ENEMIES, {
  loup_vent: E2('wolf_brute', { name: 'Loup des hurlevents', hp: 1300, dmg: 82, xp: 300, gold: [70, 100], res: { vent: 0.6 } }),
  harpie_tempete: E2('bee', { name: 'Harpie des tempêtes', hp: 1100, dmg: 78, xp: 290, gold: [64, 96], res: { vent: 0.8, foudre: -0.3 } }),
  geant_roc: E2('orc_warrior', { name: 'Géant des rocs', hp: 1800, dmg: 92, xp: 340, gold: [80, 120], res: { physique: 0.3 } }),
  ombre_errante: E2('dark_mage', { name: 'Ombre errante', hp: 1400, dmg: 90, xp: 330, gold: [76, 110], el: 'ombre', res: { ombre: 0.8, lumiere: -0.5 } }),
  chevalier_dechu: E2('skeleton_archer', { name: 'Chevalier déchu', hp: 1700, dmg: 96, xp: 360, gold: [84, 124], res: { ombre: 0.5, lumiere: -0.4 } }),
  oeil_vide: E2('eyeball', { name: 'Œil du Vide', hp: 1200, dmg: 88, xp: 320, gold: [72, 108], res: { ombre: 0.6 } }),
  pillard_fjord: E2('goblin_rogue', { name: 'Pillard du fjord', hp: 1600, dmg: 96, xp: 360, gold: [90, 130], res: { glace: 0.5 } }),
  ours_glace: E2('wolf_brute', { name: 'Ours des glaces', hp: 2200, dmg: 104, xp: 400, gold: [96, 140], res: { glace: 0.8, feu: -0.4 } }),
  serpent_mer: E2('snake', { name: 'Serpent des mers', hp: 1500, dmg: 98, xp: 370, gold: [88, 128], el: 'eau', res: { eau: 0.8, foudre: -0.5 } })
});
const ROW3_LOOT = { loup_vent: [['croc', 0.7, 1, 3]], harpie_tempete: [['cuir', 0.6, 1, 2]], geant_roc: [['acier', 0.8, 2, 4]], ombre_errante: [['cristal_magique', 0.8, 1, 3], ['fragment_runique', 0.5, 1, 2]],
  chevalier_dechu: [['acier', 0.6, 1, 3], ['essence_spectrale', 0.6, 1, 2]], oeil_vide: [['fragment_runique', 0.6, 1, 2]], pillard_fjord: [['fer', 0.6, 2, 4], ['cuir', 0.5, 1, 2]], ours_glace: [['cuir', 0.8, 2, 4], ['croc', 0.6, 1, 3]], serpent_mer: [['ecaille_drake', 0.8, 1, 3]] };
for (const k in ROW3_LOOT) if (typeof LOOT !== 'undefined') LOOT[k] = { mats: ROW3_LOOT[k].filter(m => REG[m[0]]), weapon: 0.12, tier: 5, seal: 0.06, relic: 0.07 };
const RBOSS3 = {
  boss_hurlevents: { key: 'hurlevents', x: 24, y: 340, def: { name: 'Skald, géant des vents', short: 'Skald', look: 'orc_warrior', res: { vent: 0.7, physique: 0.3 }, hp: 24000, dmg: 118, spd: 60, xp: 10800, atk: 'slash', range: 72, minion: ['loup_vent', 'geant_roc'] } },
  boss_ombres: { key: 'ombres', x: 176, y: 344, def: { name: 'Vaelor le Déchu', short: 'Vaelor', look: 'king_specter', el: 'ombre', res: { ombre: 0.8, lumiere: -0.5 }, hp: 27000, dmg: 126, spd: 70, xp: 12000, atk: 'slash', range: 70, minion: ['ombre_errante', 'chevalier_dechu'] } },
  boss_fjord: { key: 'fjord', x: 272, y: 340, def: { name: 'Hrafn, roi des pillards du fjord', short: 'Hrafn', look: 'wolf_brute', el: 'glace', res: { glace: 0.8, feu: -0.4 }, hp: 30000, dmg: 134, spd: 76, xp: 13500, atk: 'slash', range: 70, minion: ['pillard_fjord', 'ours_glace'] } }
};
for (const k in RBOSS3) { ENEMIES[k] = Object.assign({ ai: 'boss', cd: 1.1, wind: 0.5, gold: [600, 900], r: 30, boss: 1, scale: 2, bw: 28, bh: 12 }, RBOSS3[k].def); if (typeof LOOT !== 'undefined') LOOT[k] = { mats: [['acier', 1, 5, 7], ['mithril', 1, 3, 5], ['cristal_magique', 1, 3, 5]].filter(m => REG[m[0]]), weapon: 0.7, tier: 5, seal: 0.6, relic: 0.5 }; }
const _regionTerrainR3 = regionTerrain;
regionTerrain = function (disc, path, reserve, R) {
  _regionTerrainR3(disc, path, reserve, R);
  const RS = mulberry(6363);
  path([[48, 290], [46, 302], [40, 314]], 1.1);
  path([[146, 290], [146, 302], [140, 314]], 1.1);
  path([[242, 290], [242, 302], [236, 316]], 1.1);
  path([[40, 314], [70, 322], [96, 322], [118, 318], [140, 314]], 1.1);
  path([[140, 314], [170, 322], [192, 322], [214, 320], [236, 316]], 1.1);
  for (let i = 0; i < 6; i++) { const x = 8 + RS() * 80, y = 296 + RS() * 58; if (Math.hypot(x - 40, y - 314) < 12 || Math.abs(y - 322) < 4 || Math.abs(x - 47) < 4) continue; disc(x, y, 1.5 + RS() * 2, 1.5, T_WATER, 0.1); }
  for (let i = 0; i < 12; i++) { const x = 104 + RS() * 80, y = 294 + RS() * 60; if (Math.hypot(x - 140, y - 314) < 12 || Math.abs(y - 322) < 4 || Math.abs(x - 145) < 4) continue; disc(x, y, 1.5 + RS() * 2.5, 1.5 + RS() * 2, T_WATER, 0.12); }
  for (let x = 196; x < 286; x += 3) disc(x, 352 + Math.sin(x * 0.25) * 3, 4, 5, T_WATER, 0.05);
  for (let i = 0; i < 5; i++) { const y = 296 + i * 10; disc(260 + RS() * 20, y, 4 + RS() * 3, 1.5, T_WATER, 0.05); }
  disc(40, 314, 6, 4, T_DIRT, 0.06); reserve(32, 308, 50, 320);
  disc(140, 314, 6, 4, T_DIRT, 0.06); reserve(132, 308, 150, 320);
  disc(236, 316, 6, 4, T_DIRT, 0.06); reserve(228, 310, 246, 322);
  for (const k in RBOSS3) { const b = RBOSS3[k]; disc(b.x, b.y, 9, 6, T_DIRT, 0.08); reserve(b.x - 11, b.y - 8, b.x + 11, b.y + 8); }
};
const ROW3_WALLS = [
  [0, 287, 42, 289], [54, 287, 140, 289], [152, 287, 236, 289], [248, 287, 288, 289],
  [95, 289, 97, 316], [95, 328, 97, 360], [191, 289, 193, 316], [191, 328, 193, 360]
];
const _genRegionsR3 = genRegions;
genRegions = function (c) {
  _genRegionsR3(c);
  const { add, sp, chestAt, tileFree } = c, T = TILE, RS = mulberry(1213);
  WORLD.props = WORLD.props.filter(p => !(p.y > 285 * T && p.y < 291 * T && ((p.x > 41 * T && p.x < 55 * T) || (p.x > 139 * T && p.x < 153 * T) || (p.x > 235 * T && p.x < 249 * T))));
  for (const w of ROW3_WALLS) REGION_WALLS.push(w);
  const pick = (tx, ty) => { const r = regionIdx(tx, ty); return r === 12 ? choice2(RS, ['rockgreybig', 'rocktall']) : r === 13 ? choice2(RS, ['deadtree', 'pillar']) : r === 14 ? choice2(RS, ['icespike', 'snowpine']) : 'rockgreybig'; };
  const line = (x0, y0, x1, y1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 1.4)); for (let i = 0; i <= n; i++) { const tx = x0 + (x1 - x0) * i / n, ty = y0 + (y1 - y0) * i / n; add(pick(Math.floor(tx), Math.floor(Math.min(359, ty + 1.5))), tx * T + 16, ty * T + 30 + RS() * 6); } };
  for (const w of ROW3_WALLS.slice(4)) line(w[0] + 1, w[1], w[0] + 1, w[3]);
  line(1.5, 289, 1.5, 358); line(287, 289, 287, 358); line(1.5, 358.5, 287, 358.5);
  // Hurlevents : Refuge des Vents
  add('house_a', 35 * T, 311 * T); add('house_b', 45 * T, 311 * T); add('campfire', 40 * T, 315 * T); add('barrel', 34 * T, 317 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 40 * T, y: 313 * T, name: 'Ysold, gardienne du refuge', role: 'south', key: 'hurlevents', saga: 'hurlevents', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 37 * T, y: 317 * T, name: 'Eirik le colporteur', role: 'shop', dir: 2 });
  sp('loup_vent', 20, 300, 3, 4); sp('loup_vent', 72, 340, 3, 4); sp('harpie_tempete', 70, 300, 3, 4); sp('harpie_tempete', 16, 320, 2, 3); sp('geant_roc', 60, 330, 2, 3); sp('geant_roc', 84, 312, 1, 2);
  chestAt(10, 296, ['potion', 'gold:1200', 'mithril']); chestAt(86, 352, ['eclat_exception', 'gold:1250']);
  // Vallée des Ombres : Veille de Morwen
  add('pillar', 135 * T, 310 * T); add('pillar', 145 * T, 310 * T); add('brazier', 137 * T, 317 * T); add('brazier', 143 * T, 317 * T); add('bones', 130 * T, 318 * T);
  WORLD.npcs.push({ look: 'npc_mage', x: 140 * T, y: 313 * T, name: 'Morwen, veilleuse du Voile', role: 'south', key: 'ombres', saga: 'ombres', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 136 * T, y: 317 * T, name: 'Selka la receleuse', role: 'shop', dir: 2 });
  sp('ombre_errante', 116, 298, 3, 4); sp('ombre_errante', 170, 300, 2, 3); sp('chevalier_dechu', 120, 340, 3, 3); sp('chevalier_dechu', 184, 320, 2, 3); sp('oeil_vide', 104, 320, 3, 4); sp('oeil_vide', 160, 352, 2, 3);
  chestAt(104, 354, ['cristal_magique', 'gold:1300', 'fragment_runique']); chestAt(186, 296, ['mithril', 'gold:1350', 'eclat_exception']);
  // Fjord des Baleines : Port de Maelor
  add('house_c', 231 * T, 313 * T); add('house_b', 241 * T, 313 * T); add('wreck', 250 * T, 346 * T); add('campfire', 236 * T, 317 * T); add('crate', 230 * T, 319 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 236 * T, y: 315 * T, name: 'Maelor, maître du port', role: 'south', key: 'fjord', saga: 'fjord', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 233 * T, y: 319 * T, name: 'Olyss la baleinière', role: 'shop', dir: 2 });
  WORLD.npcs.push({ look: 'npc_smith', x: 240 * T, y: 319 * T, name: 'Délian le charpentier', role: 'smith', dir: 1 });
  sp('pillard_fjord', 210, 300, 3, 3); sp('pillard_fjord', 270, 320, 2, 3); sp('ours_glace', 214, 336, 2, 3); sp('ours_glace', 262, 300, 2, 3); sp('serpent_mer', 220, 346, 3, 4); sp('serpent_mer', 200, 320, 2, 3);
  chestAt(200, 296, ['mithril', 'gold:1400', 'potion']); chestAt(282, 302, ['eclat_exception', 'gold:1450']);
  for (const k in RBOSS3) { const b = RBOSS3[k]; sp(k, b.x, b.y, 1, 0); const d = { hurlevents: 'rocktall', ombres: 'brazier', fjord: 'icespike' }[b.key]; [[-9, -6], [9, -6], [-9, 6], [9, 6]].forEach(([dx, dy]) => add(d, (b.x + dx) * T, (b.y + dy) * T)); }
  const deco = (x0, y0, x1, y1, types, dens, spacing) => {
    for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) {
      if (!tileFree(tx, ty) || RS() > dens) continue; const t = types[Math.floor(RS() * types.length)], d = PROPS[t]; const px = tx * T + 16, py = ty * T + 28;
      if (d.fade || d.col) { let ok = true; for (let i = WORLD.props.length - 1; i >= 0 && i > WORLD.props.length - 400; i--) { const p = WORLD.props[i]; if (Math.abs(p.x - px) < spacing && Math.abs(p.y - py) < spacing * 0.8) { ok = false; break; } } if (!ok) continue; }
      add(t, px + RS() * 6, py);
    }
  };
  deco(3, 290, 94, 358, ['rocktall', 'rockgreybig', 'rocksm', 'deadtree', 'tallgrass2', 'grass3', 'pebble'], 0.045, 46);
  deco(98, 290, 190, 358, ['deadtree', 'witheredtree', 'bones', 'rockgrey', 'pebble', 'dark13'], 0.05, 44);
  deco(194, 290, 286, 358, ['snowpine', 'snowpine', 'icespike', 'rockgreybig', 'pebble'], 0.05, 46);
};
const _genWorldR3 = genWorld;
genWorld = function () {
  _genWorldR3();
  WORLD.zones.splice(WORLD.zones.length - 1, 0,
    { id: 'hurlevents', name: 'Hurlevents', x0: 0, y0: 288, x1: 96, y1: 360, music: 'forest', dark: 0.06 },
    { id: 'ombres', name: 'Vallée des Ombres', x0: 96, y0: 288, x1: 192, y1: 360, music: 'forest', dark: 0.32 },
    { id: 'fjord', name: 'Fjord des Baleines', x0: 192, y0: 288, x1: 288, y1: 360, music: 'forest', dark: 0.08 });
};
TRAVEL.push({ id: 'refuge', n: 'Refuge des Vents (Hurlevents)', x: 40, y: 317 }, { id: 'morwen', n: 'Veille de Morwen (Vallée des Ombres)', x: 140, y: 317 }, { id: 'maelor', n: 'Port de Maelor (Fjord des Baleines)', x: 236, y: 320 });
SAFE_ZONES.push({ id: 'refuge', n: 'Refuge des Vents', c: [40, 314], r: 7 }, { id: 'morwen', n: 'Veille de Morwen', c: [140, 314], r: 7 }, { id: 'maelor', n: 'Port de Maelor', c: [236, 316], r: 8 });
Object.assign(TIPS, {
  reg_hurlevents: ['Hurlevents (niv. 42+)', () => `Des hauts plateaux balayés par un vent qui te pousse.<br><br>• <b>Refuge des Vents</b> : <b>Ysold</b> et un colporteur.<br>• Loups des hurlevents, harpies des tempêtes, géants des rocs.`],
  reg_ombres: ['Vallée des Ombres (niv. 46+)', () => `Une vallée où la lumière de l'Aube n'arrive presque plus.<br><br>• <b>Veille de Morwen</b> : les Veilleurs du Voile surveillent la vallée.<br>• Ombres errantes, chevaliers déchus, yeux du Vide.`],
  reg_fjord: ['Fjord des Baleines (niv. 50+)', () => `Un fjord glacé où chantent les baleines.<br><br>• <b>Port de Maelor</b> : marchande baleinière et charpentier.<br>• Pillards du fjord, ours des glaces, serpents des mers.`]
});
SIDEQ.push(
  { id: 'q009', npc: 'hurlevents', n: 'Q009 — Les cols hurlants', desc: 'Les loups des hurlevents rôdent autour du refuge. Chasse-en <b>8</b>.', t: 'kill', k: ['loup_vent'], c: 8, gold: 1700, xp: 2600, it: ['potion', 4] },
  { id: 'q010', npc: 'hurlevents', n: 'Q010 — Le géant qui commande au vent', desc: '<b>Skald</b>, géant des vents, attise les tempêtes depuis le sud-ouest. Fais-le taire.', t: 'kill', k: ['boss_hurlevents'], c: 1, gold: 3600, xp: 6000, it: [REG.mithril ? 'mithril' : 'potion', 4] },
  { id: 'q049', npc: 'ombres', n: 'Q049 — Ce qui marche dans l\'ombre', desc: 'Les ombres errantes gagnent du terrain. Dissipe-en <b>8</b>.', t: 'kill', k: ['ombre_errante'], c: 8, gold: 1900, xp: 2900, it: [REG.cristal_magique ? 'cristal_magique' : 'potion', 4] },
  { id: 'q050', npc: 'ombres', n: 'Q050 — Le chevalier qui a trahi l\'Aube', desc: '<b>Vaelor le Déchu</b> sert désormais Nyx, au sud-est de la vallée. Les Veilleurs du Voile demandent sa fin.', t: 'kill', k: ['boss_ombres'], c: 1, gold: 4000, xp: 6700, it: [REG.eclat_exception ? 'eclat_exception' : 'potion', 2] },
  { id: 'q019', npc: 'fjord', n: 'Q019 — Le chant des baleines', desc: 'Les serpents des mers effraient les baleines. Chasse-en <b>6</b>.', t: 'kill', k: ['serpent_mer'], c: 6, gold: 2100, xp: 3200, it: ['potion', 4] },
  { id: 'q020', npc: 'fjord', n: 'Q020 — Le roi des pillards', desc: '<b>Hrafn</b> rançonne les baleiniers depuis le sud-est du fjord. Rends le port à Maelor.', t: 'kill', k: ['boss_fjord'], c: 1, gold: 4500, xp: 7500, it: [REG.mithril ? 'mithril' : 'potion', 5] }
);
// textes « Parler » des chefs de la cinquième rangée (affichés par le menu commun des chefs de village)
Object.assign(SOUTH_TALK, {
  hurlevents: 'Ici, le vent ne s\'arrête jamais. Les anciens disent qu\'il porte encore le dernier souffle d\'Aether. Tiens bon sur tes jambes, voyageur.',
  ombres: 'La Vallée des Ombres est la cicatrice laissée par Nyx. Les Veilleurs du Voile y montent la garde depuis mille ans. Si l\'Aube faiblit ici, elle faiblira partout.',
  fjord: 'Les baleines du fjord chantent quand la mer est en paix. Elles se taisent depuis l\'arrivée de Hrafn. La Ligue des Navigateurs paiera qui leur rendra leur chant.'
});
Object.assign(SOUTH_REP, { hurlevents: 'pacte', ombres: 'voile', fjord: 'navigateurs' });
