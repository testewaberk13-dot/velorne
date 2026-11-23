'use strict';
// ===================== LE GRAND MONDE : 5 nouvelles régions autour de la forêt =====================
// Plan (en tuiles) : haut = forêt (0-96) | désert (96-192) | cimes enneigées (192-288) ; bas = marais (0-96) | volcan (96-192) | citadelle (192-288)
const REGION_NAMES = ['Forêt', 'Désert d\'Arkhan', 'Pics de Givrenuit', 'Marais de Grisebrume', 'Cratère de Cendrefeu', 'Citadelle de Malvorak'];
// murs infranchissables entre régions (x0,y0,x1,y1 en tuiles) — les passages sont les trous
const REGION_WALLS = [
  [95, 0, 97, 28], [95, 40, 97, 72],          // forêt | désert (passage y 28-40)
  [0, 71, 42, 73], [54, 71, 96, 73],          // forêt | marais (passage x 42-54)
  [191, 0, 193, 30], [191, 42, 193, 72],      // désert | cimes (passage y 30-42)
  [96, 71, 140, 73], [152, 71, 192, 73],      // désert | volcan (passage x 140-152)
  [192, 71, 288, 73],                          // cimes | citadelle (fermé)
  [95, 72, 97, 100], [95, 112, 97, 144],      // marais | volcan (passage y 100-112)
  [191, 72, 193, 100], [191, 112, 193, 144]   // volcan | citadelle (porte y 100-112)
];
const GATE = [191, 100, 193, 112];
function sagaSeals() { const F = (G && G.flags) || {}; return (F.dead_boss_sultan ? 1 : 0) + (F.dead_boss_marais ? 1 : 0) + (F.dead_boss_neige ? 1 : 0) + (F.dead_boss_volcan ? 1 : 0); }
function gateOpen() { return sagaSeals() >= 4; }
function regionWallBlocked(x, y, w, h) {
  const x0 = x / TILE, y0 = y / TILE, x1 = (x + w) / TILE, y1 = (y + h) / TILE;
  for (const r of REGION_WALLS) if (x1 > r[0] && x0 < r[2] && y1 > r[1] && y0 < r[3]) return true;
  if (!gateOpen() && x1 > GATE[0] && x0 < GATE[2] && y1 > GATE[1] && y0 < GATE[3]) return true;
  return false;
}

// ---------- relief : mares, lave, oasis, chemins ----------
function regionTerrain(disc, path, reserve, R) {
  // chemins reliant les passages
  path([[90, 34], [100, 34], [112, 34], [130, 34], [150, 32]], 1.1);          // forêt -> oasis -> palais
  path([[150, 32], [170, 36], [190, 36], [206, 36], [230, 32], [260, 26]], 1.1); // désert -> cimes
  path([[146, 36], [146, 55], [146, 72], [146, 80], [148, 100], [150, 126]], 1.1); // désert -> volcan
  path([[48, 70], [48, 80], [48, 84], [46, 100], [44, 126]], 1.1);            // forêt -> marais
  path([[48, 90], [70, 104], [94, 106], [112, 106], [130, 108], [150, 124]], 1.1); // marais -> volcan
  path([[112, 106], [160, 106], [192, 106], [206, 106], [240, 108]], 1.1);     // volcan -> citadelle
  // oasis
  disc(114, 40, 6, 4, T_WATER, 0.05); reserve(106, 35, 123, 46);
  // arènes de boss
  disc(150, 30, 10, 7, T_DIRT, 0.08); reserve(138, 21, 163, 40);
  disc(262, 26, 10, 7, T_GRASS, 0.05); reserve(250, 17, 275, 36);
  disc(44, 127, 10, 7, T_DIRT, 0.08); reserve(32, 118, 57, 137);
  disc(150, 126, 10, 7, T_DIRT, 0.08); reserve(138, 117, 163, 136);
  disc(246, 108, 14, 9, T_DIRT, 0.05); reserve(228, 96, 266, 122);
  // villages
  disc(112, 34, 6, 4, T_DIRT, 0.06); reserve(104, 28, 122, 40);
  disc(210, 36, 6, 4, T_DIRT, 0.06); reserve(202, 30, 220, 42);
  disc(48, 86, 6, 4, T_DIRT, 0.06); reserve(40, 80, 58, 92);
  disc(112, 106, 6, 4, T_DIRT, 0.06); reserve(104, 100, 122, 112);
  disc(206, 106, 5, 4, T_DIRT, 0.06); reserve(200, 100, 214, 112);
  // marais : mares
  for (let i = 0; i < 34; i++) { const x = 6 + R() * 84, y = 76 + R() * 64; if (Math.hypot(x - 48, y - 86) < 12 || Math.hypot(x - 44, y - 127) < 13) continue; if (Math.abs(x - 48) < 3 && y < 128) continue; disc(x, y, 2 + R() * 4, 1.5 + R() * 3, T_WATER, 0.1); }
  // volcan : lacs de lave
  for (let i = 0; i < 26; i++) { const x = 100 + R() * 88, y = 76 + R() * 64; if (Math.hypot(x - 112, y - 106) < 10 || Math.hypot(x - 150, y - 126) < 14) continue; if (Math.abs(x - 146) < 3.5 && y < 128) continue; if (Math.abs(y - 106) < 3.5) continue; disc(x, y, 2 + R() * 3, 1.5 + R() * 2.5, T_WATER, 0.1); }
  // cimes : lacs gelés
  for (let i = 0; i < 12; i++) { const x = 200 + R() * 80, y = 6 + R() * 60; if (Math.hypot(x - 210, y - 36) < 10 || Math.hypot(x - 262, y - 26) < 14) continue; if (Math.abs(y - 33) < 4) continue; disc(x, y, 2 + R() * 3, 1.5 + R() * 2, T_WATER, 0.08); }
  // citadelle : gouffres
  for (let i = 0; i < 18; i++) { const x = 198 + R() * 84, y = 78 + R() * 60; if (Math.hypot(x - 246, y - 108) < 18 || Math.abs(y - 106) < 4 || Math.hypot(x - 206, y - 106) < 8) continue; disc(x, y, 1.5 + R() * 2.5, 1.5 + R() * 2, T_WATER, 0.1); }
}

// ---------- contenu ----------
function genRegions(c) {
  const { R, add, reserve, tileFree, sp, chestAt } = c;
  const T = TILE;
  // --- murs décoratifs le long des barrières et du pourtour ---
  const wallProp = (tx, ty) => {
    const r = regionIdx(tx, ty);
    const pick = [['wall4', 'wall10'], ['rockgreybig', 'rocktall', 'cactus'], ['icespike', 'snowpine'], ['mangrove', 'deadtree'], ['obsidian', 'rockgreybig'], ['pillar', 'obsidian']][r] || ['rockgreybig'];
    return pick[Math.floor(R() * pick.length)];
  };
  const line = (x0, y0, x1, y1) => { // segment de mur (en tuiles), props tous les ~1.4 tuile
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 1.4));
    for (let i = 0; i <= n; i++) { const tx = x0 + (x1 - x0) * i / n, ty = y0 + (y1 - y0) * i / n; add(wallProp(Math.floor(tx), Math.floor(ty)), tx * T + 16, ty * T + 30 + R() * 6); }
  };
  for (const w of REGION_WALLS) { const horiz = (w[2] - w[0]) > (w[3] - w[1]); if (horiz) line(w[0], w[1] + 1, w[2], w[1] + 1); else line(w[0] + 1, w[1], w[0] + 1, w[3]); }
  line(96, 1.5, 287, 1.5); line(287, 1.5, 287, 143); line(1.5, 143, 287, 143); line(1.5, 73, 1.5, 143);
  line(192, 73, 287, 73);
  // la porte de la citadelle
  const gate = add('darkgate', GATE[0] * T + 28, 106 * T + 40); gate.isGate = 1; WORLD.gateProp = gate;
  add('brazier', 189 * T, 99 * T + 20); add('brazier', 189 * T, 113 * T + 10);

  WORLD.npcs.push({ look: 'npc_guard', x: 44 * T, y: 52 * T, name: 'Rowan, chasseur de primes', role: 'saga', saga: 'bourg', dir: 2 });
  // --- DÉSERT : camp d'Arkhan ---
  add('tent', 108 * T, 31 * T); add('tent', 117 * T, 31 * T); add('campfire', 112 * T, 35 * T); add('crate', 109 * T, 38 * T); add('barrel', 116 * T, 38 * T); add('palm', 120 * T, 41 * T); add('palm', 107 * T, 43 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 113 * T, y: 33 * T, name: 'Nadir, chef caravanier', role: 'saga', saga: 'desert', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 110 * T, y: 36 * T + 8, name: 'Zaïra la marchande', role: 'shop', dir: 2 });
  WORLD.npcs.push({ look: 'npc_smith', x: 116 * T, y: 35 * T + 8, name: 'Hakim le forgeron', role: 'smith', dir: 1 });
  // palais du sultan
  [[142, 24], [158, 24], [142, 36], [158, 36], [150, 20]].forEach(([x, y]) => add('pillar', x * T, y * T)); [[146, 27], [154, 27], [146, 33], [154, 33]].forEach(([x, y]) => add('brazier', x * T, y * T));
  [[145, 38], [156, 22], [140, 30]].forEach(([x, y]) => add('bones', x * T, y * T));
  sp('boss_sultan', 150, 30, 1, 0);
  sp('chacal', 118, 14, 3, 4); sp('chacal', 130, 52, 3, 4); sp('serpent_sable', 126, 24, 3, 4); sp('serpent_sable', 104, 58, 2, 3); sp('pillard', 135, 46, 3, 3); sp('pillard', 170, 20, 3, 4);
  sp('guerrier_sable', 160, 52, 2, 3); sp('guerrier_sable', 142, 14, 2, 3); sp('momie_archere', 176, 48, 3, 4); sp('momie_archere', 166, 62, 2, 3); sp('chacal', 180, 12, 3, 4); sp('guerrier_sable', 150, 46, 2, 3);
  chestAt(128, 12, ['potion', 'gold:180', 'eclat_exception']); chestAt(180, 60, ['mithril', 'gold:220', 'potion']); chestAt(102, 62, ['cristal_magique', 'gold:150']); chestAt(150, 18, ['sceau_lame', 'gold:320', 'ar_barbute']);

  // --- CIMES DE GIVRENUIT : village d'Orélia ---
  add('house_a', 205 * T, 33 * T); add('house_b', 214 * T, 33 * T); add('campfire', 210 * T, 37 * T); add('barrel', 207 * T, 40 * T); add('crate', 213 * T, 40 * T); add('snowpine', 203 * T, 41 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 210 * T, y: 35 * T, name: 'Orélia, veilleuse des cimes', role: 'saga', saga: 'neige', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 207 * T, y: 38 * T + 8, name: 'Tavik le colporteur', role: 'shop', dir: 2 });
  WORLD.npcs.push({ look: 'npc_mage', x: 214 * T, y: 37 * T, name: 'Sœur Brume', role: 'mage', dir: 2 });
  [[254, 21], [270, 21], [254, 32], [270, 32]].forEach(([x, y]) => add('icespike', x * T, y * T)); add('campfire', 262 * T, 30 * T);
  sp('boss_neige', 262, 26, 1, 0);
  sp('loup_neiges', 224, 14, 3, 4); sp('loup_neiges', 236, 54, 3, 4); sp('squelette_gele', 244, 44, 3, 4); sp('ogre_glace', 230, 24, 2, 3); sp('ogre_glace', 272, 52, 2, 3); sp('mage_givre', 250, 8, 2, 3); sp('mage_givre', 220, 56, 2, 3); sp('loup_neiges', 276, 10, 3, 4); sp('squelette_gele', 205, 14, 3, 4); sp('ogre_glace', 262, 58, 2, 3);
  chestAt(226, 10, ['mithril', 'gold:300', 'potion']); chestAt(274, 60, ['cristal_magique', 'gold:260', 'eclat_exception']); chestAt(212, 60, ['sceau_lame', 'gold:240']); chestAt(262, 16, ['potion', 'gold:420', 'ar_jambieres']);

  // --- MARAIS : pilotis de Vasebourg ---
  add('house_c', 44 * T, 83 * T); add('house_a', 53 * T, 84 * T); add('campfire', 48 * T, 88 * T); add('barrel', 43 * T, 90 * T); add('crate', 54 * T, 90 * T); add('mangrove', 40 * T, 81 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 48 * T, y: 85 * T, name: 'Mère Odile, guérisseuse', role: 'saga', saga: 'marais', dir: 2 });
  WORLD.npcs.push({ look: 'npc_alchemist', x: 45 * T, y: 88 * T + 8, name: 'Brin l\'alchimiste', role: 'alchimie', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 52 * T, y: 88 * T, name: 'Gobo le passeur', role: 'shop', dir: 2 });
  [[36, 122], [52, 122], [36, 133], [52, 133]].forEach(([x, y]) => add('mangrove', x * T, y * T)); [[40, 126], [48, 126]].forEach(([x, y]) => add('bones', x * T, y * T));
  sp('boss_marais', 44, 127, 1, 0);
  sp('gelee_toxique', 24, 96, 3, 4); sp('gelee_toxique', 70, 90, 3, 4); sp('moustique', 30, 112, 3, 4); sp('moustique', 74, 124, 3, 4); sp('ombre_marais', 20, 130, 2, 3); sp('ombre_marais', 66, 108, 2, 3); sp('lezard_marais', 24, 118, 2, 3); sp('lezard_marais', 76, 100, 2, 3); sp('revenant', 60, 134, 3, 4); sp('revenant', 12, 84, 2, 3);
  chestAt(14, 100, ['potion', 'gold:340', 'cristal_magique']); chestAt(84, 80, ['mithril', 'gold:360']); chestAt(80, 136, ['eclat_exception', 'gold:300', 'potion']); chestAt(10, 136, ['sceau_lame', 'gold:280']);

  // --- VOLCAN : forge de Cendrefeu ---
  add('house_b', 108 * T, 103 * T); add('anvil', 116 * T, 107 * T); add('brazier', 112 * T, 109 * T); add('barrel', 118 * T, 109 * T); add('crate', 106 * T, 109 * T); add('obsidian', 120 * T, 102 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 112 * T, y: 105 * T, name: 'Kaïra, gardienne de la forge', role: 'saga', saga: 'volcan', dir: 2 });
  WORLD.npcs.push({ look: 'npc_smith', x: 115 * T, y: 108 * T + 8, name: 'Dorn, maître de forge', role: 'smith', dir: 1 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 109 * T, y: 108 * T + 8, name: 'Pyra la marchande', role: 'shop', dir: 2 });
  WORLD.npcs.push({ look: 'npc_runemaster', x: 118 * T, y: 105 * T, name: 'Ember, maître runique', role: 'runique', dir: 1 });
  [[140, 120], [160, 120], [140, 132], [160, 132]].forEach(([x, y]) => add('obsidian', x * T, y * T)); [[146, 124], [154, 124], [146, 130], [154, 130]].forEach(([x, y]) => add('brazier', x * T, y * T));
  sp('boss_volcan', 150, 126, 1, 0);
  sp('chauve_ardente', 110, 84, 3, 4); sp('chauve_ardente', 170, 90, 3, 4); sp('salamandre', 130, 92, 3, 4); sp('salamandre', 176, 124, 3, 4); sp('orc_forge', 124, 128, 2, 3); sp('orc_forge', 100, 124, 2, 3); sp('elementaire', 166, 100, 2, 3); sp('elementaire', 132, 118, 2, 3); sp('mage_cendre', 182, 84, 2, 3); sp('mage_cendre', 104, 86, 2, 3);
  chestAt(180, 80, ['mithril', 'gold:520', 'potion']); chestAt(102, 136, ['cristal_magique', 'gold:480', 'eclat_exception']); chestAt(184, 134, ['sceau_lame', 'gold:500']); chestAt(150, 140, ['potion', 'gold:680', 'ar_brassards']);

  // --- CITADELLE ---
  add('pillar', 203 * T, 100 * T); add('pillar', 203 * T, 112 * T); add('brazier', 207 * T, 104 * T); add('brazier', 207 * T, 109 * T);
  WORLD.npcs.push({ look: 'npc_elder', x: 206 * T, y: 106 * T, name: 'Esprit d\'Aldaran', role: 'saga', saga: 'final', dir: 2 });
  for (let i = 0; i < 6; i++) { add('pillar', (222 + i * 8) * T, 96 * T); add('pillar', (222 + i * 8) * T, 120 * T); }
  [[232, 104], [260, 104], [232, 112], [260, 112]].forEach(([x, y]) => add('brazier', x * T, y * T));
  [[240, 100], [252, 116], [236, 118]].forEach(([x, y]) => add('bones', x * T, y * T));
  sp('boss_malvorak', 246, 108, 1, 0);
  sp('chevalier_demon', 218, 90, 2, 3); sp('chevalier_demon', 262, 128, 2, 3); sp('cultiste', 230, 84, 3, 4); sp('cultiste', 270, 90, 3, 4); sp('garde_ossements', 220, 128, 3, 4); sp('garde_ossements', 272, 114, 3, 4); sp('chevalier_demon', 276, 100, 2, 3); sp('cultiste', 214, 134, 3, 4);
  chestAt(214, 84, ['mithril', 'gold:800', 'potion']); chestAt(280, 134, ['eclat_exception', 'gold:900', 'cristal_magique']); chestAt(280, 84, ['sceau_lame', 'gold:760']); chestAt(212, 134, ['potion', 'gold:700', 'relique_inconnue']);

  // --- décor de chaque région ---
  const dec = (r, types, dens, spacing) => {
    const [x0, y0, x1, y1] = r;
    for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) {
      if (!tileFree(tx, ty)) continue; if (R() > dens) continue;
      const t = types[Math.floor(R() * types.length)], def = PROPS[t];
      if (def.fade || def.col) { let ok = true; const px = tx * T + 16, py = ty * T + 28; for (const p of WORLD.props) { if (Math.abs(p.x - px) < (spacing || 40) && Math.abs(p.y - py) < (spacing || 40) * 0.7 && p.def.col) { ok = false; break; } } if (!ok) continue; }
      add(t, tx * T + 16 + R() * 8, ty * T + 28); reserve(tx, ty, tx, ty);
    }
  };
  dec([98, 3, 190, 70], ['cactus', 'cactus', 'palm', 'rockmed', 'rocksm', 'rockflat', 'bones', 'deadtree', 'witheredtree'], 0.035);
  dec([194, 3, 286, 70], ['snowpine', 'snowpine', 'snowpine', 'icespike', 'rockmed', 'rocksm', 'rockgrey'], 0.06);
  dec([3, 75, 94, 142], ['mangrove', 'mangrove', 'deadtree', 'witheredtree', 'bush0', 'bush1', 'rockmed', 'tallgrass1', 'reed1'], 0.07);
  dec([98, 75, 190, 142], ['obsidian', 'obsidian', 'rockmed', 'rocksm', 'rockgrey', 'bones', 'deadtree'], 0.04);
  dec([196, 75, 286, 142], ['pillar', 'bones', 'rockgrey', 'obsidian', 'brazier'], 0.015, 56);
}
