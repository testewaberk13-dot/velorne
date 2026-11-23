'use strict';
// ===================== Phase C (5) — septième rangée : le monde souterrain (y 432–504) =====================
// Mines de Mithral (x 0–96), Cavernes de Lave (x 96–192), Temple Enfoui (x 192–288). Noms : Bible V0.1 §4.2.
// Régions très sombres : la lumière vient du joueur, des braseros et des cristaux. Contenu : PROPOSITIONS.
const ROW5_Y = 432;
const _regionIdxR5 = regionIdx;
regionIdx = function (tx, ty) {
  if (ty >= ROW5_Y) { const X = tx + Math.sin(ty * 0.35) * 2 + Math.sin(ty * 0.11 + 1) * 3; return 18 + (X < W0 ? 0 : X < 2 * W0 ? 1 : 2); }
  return _regionIdxR5(tx, ty);
};
REGION_NAMES.push('Mines de Mithral', 'Cavernes de Lave', 'Temple Enfoui');
Object.assign(BIOME_TILES, {
  30: { src: 'env/terrain_summer.png', G: ['#1a1e28', '#5a6274'], D: ['#22222a', '#5e5a62'] },
  31: { src: 'env/terrain_summer.png', W: ['#0a0c14', '#3a4a6a'] },
  32: { src: 'env/terrain_summer.png', G: ['#1e1412', '#5a3e34'], D: ['#2a140c', '#6a3a22'] },
  33: { src: 'env/terrain_summer.png', W: ['#6a1000', '#ffb02a'] },
  34: { src: 'env/terrain_summer.png', G: ['#142218', '#4a6a4a'], D: ['#1e2218', '#5e6a4e'] }
});
REGION_TILES.push({ land: 30, water: 31 }, { land: 32, water: 33 }, { land: 34, water: 15 });
if (typeof GRASS_PAL !== 'undefined') GRASS_PAL.push(
  { c: ['#2a2e3a', '#4a5262', '#8a9ab0'], dens: 0.2 },
  { c: ['#2a1a14', '#4a2a1a', '#8a4a2a'], dens: 0.15 },
  { c: ['#1a2e1e', '#2e5a34', '#6aa06a'], dens: 0.7, flower: ['#9ff3c8'] });
if (typeof R25_ZONE !== 'undefined') Object.assign(R25_ZONE, {
  mines: { grade: 'rgb(150,170,220)', ga: 0.22, fog: '20,24,40', fa: 0.5, rays: 0 },
  lave: { grade: 'rgb(255,120,50)', ga: 0.26, fog: '60,16,6', fa: 0.5, rays: 0 },
  temple: { grade: 'rgb(130,220,170)', ga: 0.24, fog: '14,40,30', fa: 0.5, rays: 0 }
});
Object.assign(ENEMIES, {
  mineur_maudit: E2('orc_warrior', { name: 'Mineur maudit', hp: 3200, dmg: 134, xp: 560, gold: [130, 190], res: { terre: 0.5 } }),
  chauve_mithral: E2('bat', { name: 'Chauve-souris de mithral', hp: 2600, dmg: 128, xp: 530, gold: [124, 182], res: { physique: 0.3 } }),
  golem_mithral: E2('demon_brute', { name: 'Golem de mithral', hp: 4200, dmg: 146, xp: 620, gold: [150, 210], res: { physique: 0.6, foudre: -0.5 } }),
  salamandre_geante: E2('lizard_spearman', { name: 'Salamandre géante', hp: 3600, dmg: 142, xp: 600, gold: [140, 200], el: 'feu', res: { feu: 0.9, glace: -0.5 } }),
  elementaire_magma: E2('demon_brute', { name: 'Élémentaire de magma', hp: 4000, dmg: 150, xp: 640, gold: [150, 214], el: 'feu', res: { feu: 0.9, eau: -0.6 } }),
  chauve_lave: E2('bat', { name: 'Chauve-souris de lave', hp: 2800, dmg: 136, xp: 560, gold: [130, 190], el: 'feu', res: { feu: 0.8 } }),
  gardien_temple: E2('skeleton_archer', { name: 'Gardien du temple', hp: 3800, dmg: 148, xp: 630, gold: [146, 206], res: { ombre: 0.4 } }),
  pretre_enfoui: E2('dark_mage', { name: 'Prêtre enfoui', hp: 3400, dmg: 150, xp: 640, gold: [150, 210], el: 'ombre', res: { ombre: 0.7, lumiere: -0.4 } }),
  serpent_temple: E2('snake', { name: 'Serpent du temple', hp: 3000, dmg: 140, xp: 600, gold: [140, 200], el: 'poison', res: { poison: 0.9 } })
});
const ROW5_LOOT = { mineur_maudit: [['fer', 0.8, 2, 4], ['mithril', 0.3, 1, 2]], chauve_mithral: [['mithril', 0.4, 1, 1]], golem_mithral: [['mithril', 0.9, 2, 4]],
  salamandre_geante: [['ecaille_drake', 0.8, 2, 4], ['cendres', 0.6, 1, 3]], elementaire_magma: [['cendres', 0.9, 2, 4]], chauve_lave: [['cendres', 0.6, 1, 2]],
  gardien_temple: [['fragment_runique', 0.7, 1, 3]], pretre_enfoui: [['cristal_magique', 0.8, 2, 3]], serpent_temple: [['ecaille_drake', 0.6, 1, 2]] };
for (const k in ROW5_LOOT) if (typeof LOOT !== 'undefined') LOOT[k] = { mats: ROW5_LOOT[k].filter(m => REG[m[0]]), weapon: 0.15, tier: 5, seal: 0.08, relic: 0.09 };
const RBOSS5 = {
  boss_mines: { key: 'mines', x: 24, y: 484, def: { name: 'Durgrim, roi des mines', short: 'Durgrim', look: 'orc_warrior', res: { physique: 0.4, terre: 0.6 }, hp: 44000, dmg: 160, spd: 64, xp: 19500, atk: 'slash', range: 72, minion: ['mineur_maudit', 'golem_mithral'] } },
  boss_lave: { key: 'lave', x: 176, y: 488, def: { name: 'Pyrrhos, cœur de magma', short: 'Pyrrhos', look: 'demon_brute', demon: 1, el: 'feu', res: { feu: 0.95, eau: -0.6 }, hp: 48000, dmg: 168, spd: 62, xp: 21000, atk: 'slash', range: 74, minion: ['elementaire_magma', 'salamandre_geante'] } },
  boss_temple: { key: 'temple', x: 272, y: 484, def: { name: 'L\'Oracle enfoui', short: 'Oracle', look: 'king_specter', el: 'ombre', res: { ombre: 0.8, lumiere: -0.4 }, hp: 52000, dmg: 176, spd: 70, xp: 23000, atk: 'slash', range: 72, minion: ['gardien_temple', 'pretre_enfoui'] } }
};
for (const k in RBOSS5) { ENEMIES[k] = Object.assign({ ai: 'boss', cd: 1.1, wind: 0.5, gold: [1000, 1500], r: 30, boss: 1, scale: 2, bw: 28, bh: 12 }, RBOSS5[k].def); if (typeof LOOT !== 'undefined') LOOT[k] = { mats: [['mithril', 1, 5, 8], ['cristal_magique', 1, 4, 6], ['fragment_runique', 1, 3, 5]].filter(m => REG[m[0]]), weapon: 0.85, tier: 5, seal: 0.8, relic: 0.7 }; }
const _regionTerrainR5 = regionTerrain;
regionTerrain = function (disc, path, reserve, R) {
  _regionTerrainR5(disc, path, reserve, R);
  const RS = mulberry(8585);
  path([[40, 392], [44, 410], [48, 432], [46, 444], [40, 458]], 2.2);  // île de Vess -> Mines (galerie sous la mer)
  path([[141, 392], [144, 410], [146, 432], [146, 444], [140, 458]], 1.4); // première île d'Aether -> Cavernes (escalier de pierre)
  path([[242, 420], [242, 432], [242, 446], [236, 460]], 1.1);           // Terres Corrompues -> Temple Enfoui
  path([[40, 458], [70, 466], [96, 466], [118, 462], [140, 458]], 1.1);
  path([[140, 458], [170, 466], [192, 466], [214, 464], [236, 460]], 1.1);
  for (let i = 0; i < 8; i++) { const x = 8 + RS() * 80, y = 438 + RS() * 62; if (Math.hypot(x - 40, y - 458) < 12 || Math.abs(y - 466) < 4 || Math.abs(x - 47) < 4 || Math.hypot(x - 24, y - 484) < 12) continue; disc(x, y, 1.5 + RS() * 2, 1.5, T_WATER, 0.1); }
  for (let i = 0; i < 22; i++) { const x = 102 + RS() * 86, y = 438 + RS() * 62; if (Math.hypot(x - 140, y - 458) < 12 || Math.abs(y - 466) < 4 || Math.abs(x - 145) < 4 || Math.hypot(x - 176, y - 488) < 12) continue; disc(x, y, 2 + RS() * 3, 1.5 + RS() * 2, T_WATER, 0.12); }
  for (let i = 0; i < 10; i++) { const x = 198 + RS() * 86, y = 438 + RS() * 62; if (Math.hypot(x - 236, y - 460) < 12 || Math.abs(y - 464) < 4 || Math.abs(x - 242) < 4 || Math.hypot(x - 272, y - 484) < 12) continue; disc(x, y, 1.5 + RS() * 2, 1.5 + RS() * 2, T_WATER, 0.1); }
  disc(40, 458, 6, 4, T_DIRT, 0.06); reserve(32, 452, 50, 464);
  disc(140, 458, 6, 4, T_DIRT, 0.06); reserve(132, 452, 150, 464);
  disc(236, 460, 6, 4, T_DIRT, 0.06); reserve(228, 454, 246, 466);
  for (const k in RBOSS5) { const b = RBOSS5[k]; disc(b.x, b.y, 9, 6, T_DIRT, 0.08); reserve(b.x - 11, b.y - 8, b.x + 11, b.y + 8); }
};
const ROW5_WALLS = [[0, 431, 42, 433], [54, 431, 140, 433], [152, 431, 236, 433], [248, 431, 288, 433], [95, 433, 97, 460], [95, 472, 97, 504], [191, 433, 193, 460], [191, 472, 193, 504]];
const _genRegionsR5 = genRegions;
genRegions = function (c) {
  _genRegionsR5(c);
  const { add, sp, chestAt, tileFree } = c, T = TILE, RS = mulberry(1515);
  WORLD.props = WORLD.props.filter(p => !(p.y > 429 * T && p.y < 435 * T && ((p.x > 41 * T && p.x < 55 * T) || (p.x > 139 * T && p.x < 153 * T) || (p.x > 235 * T && p.x < 249 * T))));
  for (const w of ROW5_WALLS) REGION_WALLS.push(w);
  const line = (x0, y0, x1, y1, t) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 1.4)); for (let i = 0; i <= n; i++) { const tx = x0 + (x1 - x0) * i / n, ty = y0 + (y1 - y0) * i / n; add(typeof t === 'function' ? t(tx, ty) : t, tx * T + 16, ty * T + 30 + RS() * 6); } };
  const wallT = (tx, ty) => { const r = regionIdx(Math.floor(tx), Math.floor(Math.min(503, ty + 1.5))); return r === 18 ? choice2(RS, ['rockgreybig', 'ironore']) : r === 19 ? choice2(RS, ['obsidian', 'rockgreybig']) : choice2(RS, ['pillar', 'rocktall']); };
  for (const w of ROW5_WALLS.slice(4)) line(w[0] + 1, w[1], w[0] + 1, w[3], wallT);
  line(1.5, 433, 1.5, 502, 'rockgreybig'); line(287, 433, 287, 502, 'rocktall'); line(1.5, 502.5, 287, 502.5, 'rockgreybig');
  // Mines de Mithral : camp des mineurs
  add('tent', 35 * T, 455 * T); add('tent', 45 * T, 455 * T); add('brazier', 37 * T, 461 * T); add('brazier', 43 * T, 461 * T); add('anvil', 40 * T, 462 * T); add('ironore', 32 * T, 462 * T);
  WORLD.npcs.push({ look: 'npc_smith', x: 40 * T, y: 457 * T, name: 'Brann, contremaître des mines', role: 'south', key: 'mines', saga: 'mines', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 37 * T, y: 461 * T + 8, name: 'Varn le marchand de minerai', role: 'shop', dir: 2 });
  sp('mineur_maudit', 20, 444, 3, 3); sp('mineur_maudit', 72, 490, 3, 3); sp('chauve_mithral', 70, 444, 3, 4); sp('chauve_mithral', 18, 470, 2, 3); sp('golem_mithral', 62, 476, 2, 2); sp('golem_mithral', 84, 456, 1, 2);
  chestAt(10, 440, ['mithril', 'gold:1900', 'potion']); chestAt(86, 498, ['eclat_exception', 'gold:2000', 'mithril']);
  // Cavernes de Lave : forge souterraine
  add('obsidian', 134 * T, 455 * T); add('obsidian', 146 * T, 455 * T); add('brazier', 137 * T, 461 * T); add('brazier', 143 * T, 461 * T); add('anvil', 140 * T, 462 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 140 * T, y: 457 * T, name: 'Iska, gardienne des cavernes', role: 'south', key: 'lave', saga: 'lave', dir: 2 });
  WORLD.npcs.push({ look: 'npc_smith', x: 143 * T, y: 461 * T + 8, name: 'Dorgan l\'Ancien, forgeron du magma', role: 'smith', dir: 1 });
  sp('salamandre_geante', 116, 442, 3, 3); sp('salamandre_geante', 172, 444, 2, 3); sp('elementaire_magma', 120, 486, 2, 3); sp('elementaire_magma', 184, 466, 2, 2); sp('chauve_lave', 104, 466, 3, 4); sp('chauve_lave', 160, 496, 3, 4);
  chestAt(104, 498, ['cendres', 'gold:2100', 'mithril']); chestAt(186, 440, ['eclat_exception', 'gold:2150']);
  // Temple Enfoui : campement d'archéologues
  add('pillar', 231 * T, 456 * T); add('pillar', 241 * T, 456 * T); add('crystal', 230 * T, 463 * T); add('crystal', 242 * T, 463 * T); add('campfire', 236 * T, 462 * T);
  WORLD.npcs.push({ look: 'npc_mage', x: 236 * T, y: 459 * T, name: 'Orvann, archéologue du temple', role: 'south', key: 'temple', saga: 'temple', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 233 * T, y: 463 * T, name: 'Nymor le copiste', role: 'shop', dir: 2 });
  sp('gardien_temple', 210, 444, 3, 3); sp('gardien_temple', 270, 456, 2, 3); sp('pretre_enfoui', 214, 482, 2, 3); sp('pretre_enfoui', 262, 444, 2, 3); sp('serpent_temple', 220, 498, 3, 4); sp('serpent_temple', 200, 466, 2, 3);
  chestAt(200, 440, ['fragment_runique', 'gold:2200', 'cristal_magique']); chestAt(282, 500, ['eclat_exception', 'gold:2300', 'mithril']);
  for (const k in RBOSS5) { const b = RBOSS5[k]; sp(k, b.x, b.y, 1, 0); const d = { mines: 'brazier', lave: 'obsidian', temple: 'pillar' }[b.key]; [[-9, -6], [9, -6], [-9, 6], [9, 6]].forEach(([dx, dy]) => add(d, (b.x + dx) * T, (b.y + dy) * T)); }
  const deco = (x0, y0, x1, y1, types, dens, spacing) => {
    for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) {
      if (!tileFree(tx, ty) || RS() > dens) continue; const t = types[Math.floor(RS() * types.length)], d = PROPS[t]; const px = tx * T + 16, py = ty * T + 28;
      if (d.fade || d.col) { let ok = true; for (let i = WORLD.props.length - 1; i >= 0 && i > WORLD.props.length - 400; i--) { const p = WORLD.props[i]; if (Math.abs(p.x - px) < spacing && Math.abs(p.y - py) < spacing * 0.8) { ok = false; break; } } if (!ok) continue; }
      add(t, px + RS() * 6, py);
    }
  };
  deco(3, 434, 94, 502, ['rocktall', 'rockgreybig', 'ironore', 'crystal', 'rocksm', 'pebble', 'brazier'], 0.05, 44);
  deco(98, 434, 190, 502, ['obsidian', 'obsidian', 'rockgreybig', 'rocksm', 'bones', 'pebble'], 0.05, 44);
  deco(194, 434, 286, 502, ['pillar', 'crystal', 'mangrove', 'bigfern', 'fern', 'bones', 'rockgrey'], 0.05, 44);
};
const _genWorldR5 = genWorld;
genWorld = function () {
  _genWorldR5();
  WORLD.zones.splice(WORLD.zones.length - 1, 0,
    { id: 'mines', name: 'Mines de Mithral', x0: 0, y0: 432, x1: 96, y1: 504, music: 'forest', dark: 0.5 },
    { id: 'lave', name: 'Cavernes de Lave', x0: 96, y0: 432, x1: 192, y1: 504, music: 'forest', dark: 0.42 },
    { id: 'temple', name: 'Temple Enfoui', x0: 192, y0: 432, x1: 288, y1: 504, music: 'forest', dark: 0.48 });
};
TRAVEL.push({ id: 'mineurs', n: 'Camp des mineurs (Mines de Mithral)', x: 40, y: 461 }, { id: 'forgesout', n: 'Forge souterraine (Cavernes de Lave)', x: 140, y: 461 }, { id: 'fouilles', n: 'Fouilles du Temple Enfoui', x: 236, y: 463 });
SAFE_ZONES.push({ id: 'mineurs', n: 'Camp des mineurs', c: [40, 458], r: 7 }, { id: 'forgesout', n: 'Forge souterraine', c: [140, 458], r: 7 }, { id: 'fouilles', n: 'Fouilles du Temple Enfoui', c: [236, 460], r: 7 });
Object.assign(TIPS, {
  reg_mines: ['Mines de Mithral (niv. 66+)', () => `Des galeries profondes sous l'archipel, où brille le mithral.<br><br>• <b>Camp des mineurs</b> : Brann et un marchand de minerai.<br>• Mineurs maudits, chauves-souris de mithral, golems de mithral. Il fait très sombre.`],
  reg_lave: ['Cavernes de Lave (niv. 70+)', () => `Des cavernes de lave sous les îles d'Aether.<br><br>• <b>Forge souterraine</b> : Iska et un forgeron du magma.<br>• Salamandres géantes, élémentaires de magma, chauves-souris de lave.`],
  reg_temple: ['Temple Enfoui (niv. 74+)', () => `Un temple englouti sous les Terres Corrompues.<br><br>• <b>Fouilles</b> : Orvann, archéologue, et un copiste.<br>• Gardiens du temple, prêtres enfouis, serpents du temple.`]
});
SIDEQ.push(
  { id: 'q045', npc: 'mines', n: 'Q045 — Les mineurs maudits', desc: 'Une malédiction a frappé les mineurs disparus. Libère <b>8</b> mineurs maudits.', t: 'kill', k: ['mineur_maudit'], c: 8, gold: 3000, xp: 4500, it: [REG.mithril ? 'mithril' : 'potion', 3] },
  { id: 'q046', npc: 'mines', n: 'Q046 — Le roi sous la montagne', desc: '<b>Durgrim</b>, roi des mines, garde le filon le plus pur au sud-ouest. Il ne laissera passer personne.', t: 'kill', k: ['boss_mines'], c: 1, gold: 6500, xp: 10800, it: [REG.mithril ? 'mithril' : 'potion', 8] },
  { id: 'q065', npc: 'lave', n: 'Q065 — Épreuve du magma', desc: 'Première épreuve légendaire : abats <b>6</b> élémentaires de magma.', t: 'kill', k: ['elementaire_magma'], c: 6, gold: 3200, xp: 4800, it: ['potion', 6] },
  { id: 'q066', npc: 'lave', n: 'Q066 — Le cœur de la montagne', desc: '<b>Pyrrhos</b>, cœur de magma, bat au sud-est des cavernes. Éteins-le.', t: 'kill', k: ['boss_lave'], c: 1, gold: 7000, xp: 11500, it: [REG.eclat_exception ? 'eclat_exception' : 'potion', 3] },
  { id: 'q047', npc: 'temple', n: 'Q047 — Les gardiens du seuil', desc: 'Les gardiens du temple empêchent les fouilles. Écarte-en <b>8</b>.', t: 'kill', k: ['gardien_temple'], c: 8, gold: 3400, xp: 5100, it: [REG.fragment_runique ? 'fragment_runique' : 'potion', 4] },
  { id: 'q048', npc: 'temple', n: 'Q048 — L\'Oracle enfoui', desc: 'Au sud-est du temple, <b>l\'Oracle</b> connaît la vérité sur Aether et Nyx. Il faudra le vaincre pour l\'entendre.', t: 'kill', k: ['boss_temple'], c: 1, gold: 7500, xp: 12500, it: [REG.eclat_exception ? 'eclat_exception' : 'potion', 3] }
);
Object.assign(SOUTH_TALK, {
  mines: 'Le mithral de ces galeries a servi à forger la Couronne d\'Aube. Depuis que Durgrim s\'est réveillé, les galeries profondes sont maudites. Le Cercle des Artisans paie le moindre éclat.',
  lave: 'Sous les îles d\'Aether coule un fleuve de feu. Les anciens forgeaient ici les armes de rang S. Pyrrhos, le cœur de magma, s\'agite : la montagne pourrait céder.',
  temple: 'Ce temple a été englouti quand Nyx a touché la terre. Les fresques racontent le Premier Souffle, et ce qu\'Aether a perdu ce jour-là. Aide-moi à atteindre l\'Oracle.'
});
Object.assign(SOUTH_REP, { mines: 'artisans', lave: 'cendre', temple: 'archives' });
