'use strict';
// ===================== Phase C (1) — trois nouvelles régions au sud (rangée y 144–216) =====================
// Côte des Épaves (x 0–96), Plaines d'Or (x 96–192), Forêt de Cristal (x 192–288). Noms : cahier des charges 2.
// Contenu détaillé (PNJ, monstres, niveaux, villages) : PROPOSITIONS. Générées APRÈS le monde existant, avec leur propre
// générateur aléatoire : le monde d'origine, les coffres et les sauvegardes restent identiques.
const SOUTH_Y = 144;
// ---------- régions (index 6, 7, 8) ----------
const _regionIdxS = regionIdx;
regionIdx = function (tx, ty) {
  if (ty >= SOUTH_Y) { const X = tx + Math.sin(ty * 0.35) * 2 + Math.sin(ty * 0.11 + 1) * 3; return 6 + (X < W0 ? 0 : X < 2 * W0 ? 1 : 2); }
  return _regionIdxS(tx, ty);
};
REGION_NAMES.push('Côte des Épaves', 'Plaines d\'Or', 'Forêt de Cristal');
Object.assign(BIOME_TILES, {
  9: { src: 'env/terrain_summer.png', G: ['#7a7a3a', '#cfc884'], D: ['#a08654', '#f2e2b0'] },
  10: { src: 'env/terrain_summer.png', W: ['#08304e', '#4ab4dc'] },
  11: { src: 'env/terrain_summer.png', G: ['#7a6418', '#f2d25a'], D: ['#6a4824', '#c8945e'] },
  12: { src: 'env/terrain_summer.png', G: ['#18263e', '#6a8ed0'], D: ['#1e1636', '#7e6eaa'] },
  13: { src: 'env/terrain_summer.png', W: ['#0e1e40', '#86e6ff'] }
});
REGION_TILES.push({ land: 9, water: 10 }, { land: 11, water: 0 }, { land: 12, water: 13 });
if (typeof GRASS_PAL !== 'undefined') GRASS_PAL.push(
  { c: ['#6a6a34', '#a0a058', '#d6d68e'], dens: 0.45 },
  { c: ['#7a5a14', '#c8a030', '#f6dc78'], dens: 1.25, flower: ['#ffffff', '#e86a8a', '#ffd23f'] },
  { c: ['#2a3a7a', '#5a7ed8', '#bfe8ff'], dens: 0.6, flower: ['#9ff3ff', '#e2c4ff'] });
if (typeof R25_ZONE !== 'undefined') Object.assign(R25_ZONE, {
  cote: { grade: 'rgb(190,230,255)', ga: 0.16, fog: '200,226,240', fa: 0.36, rays: 0.08 },
  plaines: { grade: 'rgb(255,220,140)', ga: 0.18, fog: '246,226,170', fa: 0.3, rays: 0.12 },
  cristal: { grade: 'rgb(150,170,255)', ga: 0.24, fog: '120,140,220', fa: 0.42, rays: 0.05 }
});
// ---------- décors dessinés en code ----------
genSprite('wreck', 96, 56, (x) => {
  _px(x, '#3a2818', 6, 30, 84, 14); _px(x, '#5a3e24', 10, 26, 76, 6); _px(x, '#6e4c2c', 14, 22, 30, 5); _px(x, '#2a1c10', 8, 42, 80, 4);
  for (let i = 0; i < 9; i++) _px(x, '#7a5634', 12 + i * 8, 30, 2, 12);
  _px(x, '#4a3420', 44, 2, 4, 28); _px(x, '#d8ccb0', 48, 6, 18, 14); _px(x, '#b8ac90', 48, 14, 18, 2); _px(x, '#2a1c10', 70, 18, 14, 4);
});
genSprite('crystal', 34, 58, (x) => {
  const sp = (a, b, w, h, c1, c2) => { for (let i = 0; i < h; i++) { const ww = Math.max(1, Math.round(w * (1 - i / h))); _px(x, i < h * 0.4 ? c2 : c1, a + Math.round((w - ww) / 2), b + h - i, ww, 1); } };
  sp(10, 4, 14, 52, '#5a7ed8', '#c4f0ff'); sp(2, 26, 9, 30, '#7a5ad8', '#e2c4ff'); sp(23, 20, 9, 36, '#4a9ad8', '#bfe8ff'); _px(x, '#ffffff', 16, 12, 2, 10);
});
genSprite('crystaltree', 60, 90, (x) => {
  _px(x, '#3a3a6a', 27, 50, 6, 40); _px(x, '#5a5a9a', 28, 50, 2, 40);
  const blob = (cx, cy, r, c) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) _px(x, c, cx + xx, cy + yy, 1, 1); };
  blob(30, 32, 22, '#3e5ec0'); blob(26, 26, 15, '#6a8ee8'); blob(22, 20, 7, '#b4e4ff'); blob(40, 38, 8, '#8a6ae0');
});
genSprite('haystack', 40, 34, (x) => { _px(x, '#a8842c', 4, 12, 32, 20); _px(x, '#d8b44c', 6, 8, 28, 18); _px(x, '#f0d070', 10, 6, 20, 6); for (let i = 0; i < 8; i++) _px(x, '#8a6a20', 6 + i * 4, 16 + (i % 2) * 6, 1, 6); });
genSprite('wheat', 26, 30, (x) => { for (let i = 0; i < 6; i++) { const bx = 3 + i * 4; _px(x, '#b08a2a', bx, 10, 1, 20); _px(x, '#f2d25a', bx - 1, 4 + (i % 2) * 2, 3, 7); } });
Object.assign(PROPS, {
  wreck: { im: 'gen/wreck.png', r: [0, 0, 96, 56], col: [-40, -16, 80, 14], sh: 34, fade: 1 },
  crystal: { im: 'gen/crystal.png', r: [0, 0, 34, 58], col: [-12, -10, 24, 10], sh: 14, light: [0, -24, 46, '140,200,255'] },
  crystaltree: { im: 'gen/crystaltree.png', r: [0, 0, 60, 90], col: [-8, -8, 16, 8], sh: 24, fade: 1 },
  haystack: { im: 'gen/haystack.png', r: [0, 0, 40, 34], col: [-16, -12, 32, 10], sh: 16 },
  wheat: { im: 'gen/wheat.png', r: [0, 0, 26, 30] }
});
// ---------- monstres (silhouettes existantes, noms et statistiques propres) ----------
Object.assign(ENEMIES, {
  crabe_epave: E2('slime', { name: 'Crabe des épaves', hp: 260, dmg: 28, xp: 62, gold: [14, 26], res: { eau: 0.6, foudre: -0.4 } }),
  pirate_noye: E2('skeleton_archer', { name: 'Pirate noyé', hp: 300, dmg: 30, xp: 70, gold: [18, 30], res: { eau: 0.5 } }),
  sirene_brume: E2('dark_mage', { name: 'Sirène des brumes', hp: 280, dmg: 32, xp: 76, gold: [18, 32], el: 'eau', res: { eau: 0.8, foudre: -0.4 } }),
  loup_dore: E2('wolf_brute', { name: 'Loup des plaines', hp: 420, dmg: 38, xp: 96, gold: [24, 40] }),
  brigand: E2('goblin_rogue', { name: 'Brigand des routes', hp: 380, dmg: 36, xp: 92, gold: [30, 50] }),
  frelon_dore: E2('bee', { name: 'Frelon doré', hp: 300, dmg: 34, xp: 84, gold: [20, 34] }),
  golem_cristal: E2('orc_warrior', { name: 'Golem de cristal', hp: 820, dmg: 52, xp: 150, gold: [40, 64], res: { physique: 0.3, foudre: 0.5, terre: -0.4 } }),
  oeil_prisme: E2('eyeball', { name: 'Œil prismatique', hp: 520, dmg: 46, xp: 130, gold: [34, 56], res: { lumiere: 0.6, ombre: -0.3 } }),
  sylphe_cristal: E2('bat', { name: 'Sylphe de cristal', hp: 460, dmg: 44, xp: 120, gold: [30, 50], res: { vent: 0.6 } })
});
const SOUTH_LOOT = { crabe_epave: [['ecaille_drake', 0.5, 1, 2]], pirate_noye: [['fer', 0.6, 1, 3], ['essence_spectrale', 0.4, 1, 1]], sirene_brume: [['cristal_magique', 0.6, 1, 2]],
  loup_dore: [['croc', 0.7, 1, 3], ['cuir', 0.6, 1, 2]], brigand: [['acier', 0.5, 1, 2], ['cuir', 0.5, 1, 2]], frelon_dore: [['cuir', 0.4, 1, 1]],
  golem_cristal: [['cristal_magique', 0.9, 2, 4], ['mithril', 0.4, 1, 2]], oeil_prisme: [['cristal_magique', 0.7, 1, 3], ['fragment_runique', 0.5, 1, 2]], sylphe_cristal: [['cristal_magique', 0.6, 1, 2]] };
const SOUTH_TIER = { crabe_epave: 3, pirate_noye: 3, sirene_brume: 3, loup_dore: 4, brigand: 4, frelon_dore: 4, golem_cristal: 4, oeil_prisme: 4, sylphe_cristal: 4 };
for (const k in SOUTH_LOOT) if (typeof LOOT !== 'undefined') LOOT[k] = { mats: SOUTH_LOOT[k].filter(m => REG[m[0]]), weapon: 0.08, tier: SOUTH_TIER[k], seal: 0.04, relic: 0.05 };

// ---------- relief : chemins, villages, mer et lacs ----------
const _regionTerrainS = regionTerrain;
regionTerrain = function (disc, path, reserve, R) {
  _regionTerrainS(disc, path, reserve, R);
  const RS = mulberry(4242);
  path([[48, 146], [48, 150], [46, 158], [40, 170]], 1.1);                    // marais -> Port-Épave
  path([[146, 146], [146, 150], [144, 158], [140, 166]], 1.1);                // volcan -> Hameau des Blés
  path([[40, 170], [70, 176], [96, 178], [118, 174], [140, 166]], 1.1);       // côte <-> plaines
  path([[140, 166], [170, 176], [192, 178], [214, 178]], 1.1);                // plaines -> sanctuaire de cristal
  path([[214, 178], [240, 190], [262, 200]], 1);
  // côte : la mer au sud et des criques
  for (let x = 2; x < 94; x += 3) disc(x, 208 + Math.sin(x * 0.2) * 3, 4, 5, T_WATER, 0.05);
  for (let i = 0; i < 10; i++) { const x = 8 + RS() * 80, y = 150 + RS() * 44; if (Math.hypot(x - 40, y - 170) < 12 || Math.abs(x - 48) < 4) continue; disc(x, y, 2 + RS() * 3, 2 + RS() * 2, T_WATER, 0.1); }
  // plaines : quelques étangs
  for (let i = 0; i < 6; i++) { const x = 104 + RS() * 80, y = 152 + RS() * 54; if (Math.hypot(x - 140, y - 166) < 12 || Math.abs(y - 176) < 4) continue; disc(x, y, 2 + RS() * 2, 2, T_WATER, 0.1); }
  // cristal : lacs scintillants
  for (let i = 0; i < 10; i++) { const x = 200 + RS() * 82, y = 150 + RS() * 58; if (Math.hypot(x - 214, y - 178) < 12 || Math.abs(y - 178) < 4) continue; disc(x, y, 2 + RS() * 3, 2 + RS() * 2, T_WATER, 0.1); }
  // villages
  disc(40, 170, 6, 4, T_DIRT, 0.06); reserve(32, 164, 50, 176);
  disc(140, 166, 6, 4, T_DIRT, 0.06); reserve(132, 160, 150, 172);
  disc(214, 178, 6, 4, T_DIRT, 0.06); reserve(206, 172, 224, 184);
};
// ---------- murs entre régions (ajoutés après la génération d'origine) ----------
const SOUTH_WALLS = [
  [0, 143, 42, 145], [54, 143, 140, 145], [152, 143, 288, 145], // rangée du dessus (passages marais x 42-54, volcan x 140-152)
  [95, 145, 97, 172], [95, 184, 97, 216],                        // côte | plaines (passage y 172-184)
  [191, 145, 193, 172], [191, 184, 193, 216]                     // plaines | cristal (passage y 172-184)
];
const _genRegionsS = genRegions;
genRegions = function (c) {
  _genRegionsS(c);
  const { add, sp, chestAt, tileFree } = c, T = TILE, RS = mulberry(777);
  // ouvrir les passages dans l'ancienne bordure sud décorative
  WORLD.props = WORLD.props.filter(p => !(p.y > 141 * T && p.y < 147 * T && ((p.x > 41 * T && p.x < 55 * T) || (p.x > 139 * T && p.x < 153 * T))));
  for (const w of SOUTH_WALLS) REGION_WALLS.push(w);
  const pickWall = (tx, ty) => { const r = regionIdx(tx, ty); return r === 6 ? choice2(RS, ['rockgreybig', 'palm']) : r === 7 ? choice2(RS, ['rockgreybig', 'oak1']) : r === 8 ? choice2(RS, ['crystal', 'rocktall']) : 'rockgreybig'; };
  const line = (x0, y0, x1, y1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 1.4)); for (let i = 0; i <= n; i++) { const tx = x0 + (x1 - x0) * i / n, ty = y0 + (y1 - y0) * i / n; add(pickWall(Math.floor(tx), Math.floor(Math.min(215, ty + 1.5))), tx * T + 16, ty * T + 30 + RS() * 6); } };
  for (const w of SOUTH_WALLS.slice(3)) line(w[0] + 1, w[1], w[0] + 1, w[3]);
  line(1.5, 145, 1.5, 214); line(287, 145, 287, 214); line(1.5, 214.5, 287, 214.5);
  // --- CÔTE DES ÉPAVES : Port-Épave ---
  add('house_c', 36 * T, 167 * T); add('house_b', 45 * T, 167 * T); add('campfire', 40 * T, 171 * T); add('barrel', 35 * T, 173 * T); add('crate', 46 * T, 173 * T); add('palm', 31 * T, 166 * T); add('palm', 50 * T, 175 * T);
  add('wreck', 20 * T, 196 * T); add('wreck', 70 * T, 198 * T); add('wreck', 84 * T, 156 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 40 * T, y: 169 * T, name: 'Nyméa, capitaine du port', role: 'south', key: 'cote', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 37 * T, y: 172 * T + 8, name: 'Corven le marin', role: 'shop', dir: 2 });
  WORLD.npcs.push({ look: 'npc_smith', x: 44 * T, y: 172 * T + 8, name: 'Sira la charpentière', role: 'smith', dir: 1 });
  sp('crabe_epave', 22, 186, 3, 4); sp('crabe_epave', 66, 190, 3, 4); sp('pirate_noye', 20, 198, 3, 3); sp('pirate_noye', 72, 160, 2, 3); sp('sirene_brume', 82, 196, 2, 3); sp('crabe_epave', 12, 154, 2, 3); sp('pirate_noye', 60, 150, 2, 3);
  chestAt(16, 204, ['potion', 'gold:380', 'cristal_magique']); chestAt(86, 150, ['mithril', 'gold:420']); chestAt(76, 200, ['eclat_exception', 'gold:360']);
  // --- PLAINES D'OR : Hameau des Blés ---
  add('house_a', 135 * T, 163 * T); add('house_b', 145 * T, 163 * T); add('haystack', 133 * T, 169 * T); add('haystack', 148 * T, 170 * T); add('barrel', 141 * T, 170 * T); add('campfire', 140 * T, 167 * T);
  WORLD.npcs.push({ look: 'npc_guard', x: 140 * T, y: 165 * T, name: 'Samir, intendant des Blés', role: 'south', key: 'plaines', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 137 * T, y: 168 * T + 8, name: 'Nahlia la marchande', role: 'shop', dir: 2 });
  sp('loup_dore', 116, 152, 3, 4); sp('loup_dore', 176, 196, 3, 4); sp('brigand', 120, 190, 3, 3); sp('brigand', 166, 156, 3, 3); sp('frelon_dore', 104, 170, 3, 4); sp('frelon_dore', 182, 170, 2, 3); sp('brigand', 150, 204, 2, 3);
  chestAt(104, 206, ['potion', 'gold:480', 'acier']); chestAt(186, 150, ['mithril', 'gold:520', 'eclat_exception']); chestAt(160, 196, ['cristal_magique', 'gold:460']);
  // --- FORÊT DE CRISTAL : Sanctuaire de Lumen ---
  add('pillar', 209 * T, 174 * T); add('pillar', 219 * T, 174 * T); add('crystal', 207 * T, 181 * T); add('crystal', 221 * T, 181 * T); add('campfire', 214 * T, 180 * T);
  WORLD.npcs.push({ look: 'npc_mage', x: 214 * T, y: 177 * T, name: 'Aelion, archéologue', role: 'south', key: 'cristal', dir: 2 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 211 * T, y: 181 * T, name: 'Miriel, gardienne des éclats', role: 'shop', dir: 2 });
  sp('golem_cristal', 236, 156, 2, 3); sp('golem_cristal', 266, 200, 2, 3); sp('oeil_prisme', 250, 170, 3, 4); sp('oeil_prisme', 206, 200, 2, 3); sp('sylphe_cristal', 274, 160, 3, 4); sp('sylphe_cristal', 232, 204, 3, 4); sp('golem_cristal', 280, 182, 1, 2);
  chestAt(276, 150, ['mithril', 'gold:700', 'cristal_magique']); chestAt(262, 206, ['eclat_exception', 'gold:650']); chestAt(200, 152, ['cristal_magique', 'gold:600', 'potion']);
  // --- décor ---
  const deco = (x0, y0, x1, y1, types, dens, spacing) => {
    for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) {
      if (!tileFree(tx, ty) || RS() > dens) continue; const t = types[Math.floor(RS() * types.length)], d = PROPS[t]; const px = tx * T + 16, py = ty * T + 28;
      if (d.fade || d.col) { let ok = true; for (let i = WORLD.props.length - 1; i >= 0 && i > WORLD.props.length - 400; i--) { const p = WORLD.props[i]; if (Math.abs(p.x - px) < spacing && Math.abs(p.y - py) < spacing * 0.8) { ok = false; break; } } if (!ok) continue; }
      add(t, px + RS() * 6, py);
    }
  };
  deco(3, 146, 94, 214, ['palm', 'rockgrey', 'rocksm', 'pebble', 'reed1', 'grass1', 'barrel'], 0.035, 48);
  deco(98, 146, 190, 214, ['oak1', 'oak2', 'haystack', 'wheat', 'wheat', 'tallgrass1', 'tallgrass2', 'grass1', 'flower0', 'flower3'], 0.05, 44);
  deco(194, 146, 286, 214, ['crystaltree', 'crystaltree', 'crystal', 'crystal', 'rocktall', 'grass2', 'pebble'], 0.05, 46);
};
// ---------- zones, villages, voyage, zones sûres, conseils ----------
const _genWorldS = genWorld;
genWorld = function () {
  _genWorldS();
  WORLD.zones.splice(WORLD.zones.length - 1, 0,
    { id: 'cote', name: 'Côte des Épaves', x0: 0, y0: 144, x1: 96, y1: 216, music: 'forest', dark: 0.02 },
    { id: 'plaines', name: 'Plaines d\'Or', x0: 96, y0: 144, x1: 192, y1: 216, music: 'forest', dark: 0 },
    { id: 'cristal', name: 'Forêt de Cristal', x0: 192, y0: 144, x1: 288, y1: 216, music: 'forest', dark: 0.12 });
};
TRAVEL.push({ id: 'portepave', n: 'Port-Épave (Côte des Épaves)', x: 40, y: 173 }, { id: 'bles', n: 'Hameau des Blés (Plaines d\'Or)', x: 140, y: 169 }, { id: 'lumen', n: 'Sanctuaire de Lumen (Forêt de Cristal)', x: 214, y: 182 });
SAFE_ZONES.push({ id: 'portepave', n: 'Port-Épave', c: [40, 170], r: 8 }, { id: 'bles', n: 'Hameau des Blés', c: [140, 166], r: 8 }, { id: 'lumen', n: 'Sanctuaire de Lumen', c: [214, 178], r: 7 });
Object.assign(TIPS, {
  reg_cote: ['Côte des Épaves (niv. 16+)', () => `Une côte battue par les vents, jonchée d'épaves.<br><br>• <b>Port-Épave</b> (au centre-ouest) : <b>Nyméa</b>, un marchand et une charpentière.<br>• Crabes, pirates noyés et sirènes des brumes.<br>• À l'est : les <b>Plaines d'Or</b>.`],
  reg_plaines: ['Plaines d\'Or (niv. 20+)', () => `De grandes plaines dorées, traversées par les routes commerciales.<br><br>• <b>Hameau des Blés</b> : <b>Samir</b> et une marchande.<br>• Loups des plaines, brigands et frelons dorés.<br>• À l'est : la <b>Forêt de Cristal</b>.`],
  reg_cristal: ['Forêt de Cristal (niv. 26+)', () => `Une forêt où les arbres sont devenus cristal.<br><br>• <b>Sanctuaire de Lumen</b> : <b>Aelion</b>, archéologue.<br>• Golems de cristal, yeux prismatiques et sylphes.<br>• Région dangereuse : viens bien équipé.`]
});
// la porte d'entrée : arrivée depuis l'ancien bord sud (passages marais et volcan) — et mention dans le guide
const _interactS = interact;
interact = function (n) {
  if (!n || n.role !== 'south') return _interactS(n);
  const T = {
    cote: 'Bienvenue à Port-Épave. Les navires qui s\'échouent ici viennent de la Mer Intérieure… et les noyés ne restent pas toujours au fond. La Ligue des Navigateurs cherche des marins courageux.',
    plaines: 'Les Plaines d\'Or nourrissent la moitié de Vélorne. Depuis que les sceaux faiblissent, les brigands pillent nos convois. Les routes ont besoin de protecteurs.',
    cristal: 'Cette forêt s\'est cristallisée en une nuit, il y a mille ans, quand la Couronne d\'Aube s\'est brisée. Je cherche à comprendre pourquoi. Les éclats chantent encore, écoute…'
  }[n.key];
  try { codexAdd('p', n.name, n.name); if (relData()[n.name] === undefined) relGain(n.name, 20); if (n.key === 'cote') repGain('navigateurs', 40); if (n.key === 'cristal') repGain('archives', 40); } catch (e) {}
  dialog(n.name, T, [['Au revoir', closePanel]]);
};
