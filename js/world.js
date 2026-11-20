'use strict';
// ===================== définitions des décors =====================
// sprite: [image, sx, sy, sw, sh], ancre = bas-centre ; col = boîte de collision relative à l'ancre [x, y, w, h]
const PROPS = {
  oak1: { im: 'env/trees_summer.png', r: [129, 16, 94, 93], col: [-11, -10, 22, 10], sh: 30, fade: 1 },
  oak2: { im: 'env/trees_summer.png', r: [225, 16, 94, 100], col: [-14, -10, 28, 10], sh: 32, fade: 1 },
  oak3: { im: 'env/trees_summer.png', r: [321, 16, 94, 125], col: [-10, -9, 20, 9], sh: 30, fade: 1 },
  oak6: { im: 'env/trees_summer.png', r: [417, 112, 94, 125], col: [-10, -9, 20, 9], sh: 30, fade: 1 },
  oak8: { im: 'env/trees_summer.png', r: [129, 144, 94, 93], col: [-11, -10, 22, 10], sh: 30, fade: 1 },
  oak9: { im: 'env/trees_summer.png', r: [225, 144, 94, 100], col: [-14, -10, 28, 10], sh: 32, fade: 1 },
  dark13: { im: 'env/trees_summer.png', r: [129, 272, 94, 93], col: [-11, -10, 22, 10], sh: 30, fade: 1 },
  dark14: { im: 'env/trees_summer.png', r: [225, 272, 94, 100], col: [-14, -10, 28, 10], sh: 32, fade: 1 },
  dark15: { im: 'env/trees_summer.png', r: [321, 272, 94, 125], col: [-10, -9, 20, 9], sh: 30, fade: 1 },
  pine17: { im: 'env/trees_summer.png', r: [420, 357, 85, 136], col: [-9, -9, 18, 9], sh: 26, fade: 1 },
  pine18: { im: 'env/trees_summer.png', r: [132, 389, 85, 104], col: [-10, -9, 20, 9], sh: 26, fade: 1 },
  pine19: { im: 'env/trees_summer.png', r: [228, 389, 85, 111], col: [-12, -9, 24, 9], sh: 28, fade: 1 },
  wall4: { im: 'env/trees_summer.png', r: [417, 16, 94, 80], col: [-40, -44, 80, 40], fade: 1 },
  wall10: { im: 'env/trees_summer.png', r: [321, 176, 94, 80], col: [-40, -44, 80, 40], fade: 1 },
  wall16: { im: 'env/trees_summer.png', r: [417, 272, 94, 80], col: [-40, -44, 80, 40], fade: 1 },
  wall20: { im: 'env/trees_summer.png', r: [324, 421, 85, 91], col: [-34, -40, 68, 36], fade: 1 },
  deadtree: { im: 'env/trees_summer.png', r: [3, 274, 90, 123], col: [-8, -8, 16, 8], sh: 20 },
  stump: { im: 'env/trees_summer.png', r: [26, 437, 43, 31], col: [-14, -14, 28, 12] },
  witheredtree: { im: 'env/sot_whitheredtree1.png', r: [0, 0, 76, 92], col: [-8, -8, 16, 8], sh: 18 },
  bush0: { im: 'env/plants_summer.png', r: [0, 0, 32, 32], col: [-12, -12, 24, 10] },
  bush1: { im: 'env/plants_summer.png', r: [32, 0, 32, 32], col: [-12, -12, 24, 10] },
  bush2: { im: 'env/plants_summer.png', r: [64, 0, 32, 32], col: [-12, -12, 24, 10] },
  bush3: { im: 'env/plants_summer.png', r: [96, 32, 32, 32], col: [-12, -12, 24, 10] },
  bush4: { im: 'env/plants_summer.png', r: [128, 32, 32, 32], col: [-12, -12, 24, 10] },
  bush5: { im: 'env/plants_summer.png', r: [160, 0, 32, 32], col: [-12, -12, 24, 10] },
  conifer: { im: 'env/plants_summer.png', r: [67, 77, 28, 49], col: [-8, -8, 16, 8] },
  fern: { im: 'env/plants_summer.png', r: [99, 77, 55, 51] },
  bigfern: { im: 'env/plants_summer.png', r: [160, 76, 87, 52] },
  tallgrass1: { im: 'env/plants_summer.png', r: [355, 0, 25, 53] },
  tallgrass2: { im: 'env/plants_summer.png', r: [386, 0, 27, 53] },
  grass1: { im: 'env/plants_summer.png', r: [263, 23, 22, 28], flat: 1 },
  grass2: { im: 'env/plants_summer.png', r: [295, 23, 22, 28], flat: 1 },
  grass3: { im: 'env/plants_summer.png', r: [259, 63, 27, 43] },
  lily1: { im: 'env/plants_summer.png', r: [386, 74, 26, 16], flat: 1 },
  lily2: { im: 'env/plants_summer.png', r: [419, 74, 25, 17], flat: 1 },
  lily3: { im: 'env/plants_summer.png', r: [391, 107, 17, 13], flat: 1 },
  reed1: { im: 'env/plants_summer.png', r: [456, 69, 13, 18], flat: 1 },
  reed2: { im: 'env/plants_summer.png', r: [457, 102, 12, 16], flat: 1 },
  rockbig: { im: 'env/rocks.png', r: [0, 0, 64, 91], col: [-28, -26, 56, 24] },
  rockmed: { im: 'env/rocks.png', r: [130, 3, 59, 54], col: [-26, -22, 52, 20] },
  rocktall: { im: 'env/rocks.png', r: [64, 96, 55, 95], col: [-24, -24, 48, 22] },
  rockflat: { im: 'env/rocks.png', r: [64, 65, 58, 30], col: [-26, -18, 52, 16] },
  rocksm: { im: 'env/rocks.png', r: [129, 71, 29, 24], col: [-12, -12, 24, 10] },
  pebble: { im: 'env/rocks.png', r: [163, 77, 27, 14], flat: 1 },
  rockgrey: { im: 'env/rocks.png', r: [130, 259, 59, 54], col: [-26, -22, 52, 20] },
  rockgreybig: { im: 'env/rocks.png', r: [0, 256, 64, 91], col: [-28, -26, 56, 24] },
  house_a: { im: 'env/house_a.png', r: [0, 0, 256, 224], col: [-104, -112, 208, 92], fade: 1 },
  house_b: { im: 'env/house_b.png', r: [0, 0, 192, 192], col: [-66, -100, 132, 84], fade: 1 },
  house_c: { im: 'env/house_c.png', r: [0, 0, 160, 160], col: [-80, -92, 160, 70], fade: 1 },
  fountain: { im: 'env/fountain.png', r: [0, 0, 64, 77], col: [-28, -30, 56, 26], sh: 0 },
  barrel: { im: 'env/barrel.png', r: [2, 10, 28, 37], col: [-12, -10, 24, 9] },
  barrel2: { im: 'env/barrel.png', r: [96, 2, 48, 61], col: [-22, -14, 44, 12] },
  crate: { im: 'env/crate.png', r: [69, 37, 22, 24], col: [-10, -9, 20, 8] },
  crates: { im: 'env/crate.png', r: [0, 0, 64, 128], col: [-30, -40, 60, 38] },
  lamp: { im: 'env/lamp.png', r: [7, 4, 18, 80], col: [-4, -5, 8, 5], light: [0, -64, 70, '255,200,120'] },
  anvil: { im: 'env/anvils.png', r: [75, 3, 46, 27], col: [-20, -10, 40, 9] },
  tent: { im: 'env/sot_tent.png', r: [2, 5, 124, 150], col: [-56, -70, 112, 64], fade: 1 },
  grave1: { im: 'env/sot_gravestones.png', r: [32, 20, 57, 76], col: [-24, -20, 48, 16] },
  grave2: { im: 'env/sot_gravestones.png', r: [98, 1, 61, 94], col: [-26, -22, 52, 18] },
  grave3: { im: 'env/sot_gravestones.png', r: [70, 66, 18, 29], col: [-8, -8, 16, 6] },
  mushroom: { im: 'env/sot_mushrooms.png', r: [7, 5, 17, 24], flat: 1 },
  campfire: { im: 'env/campfire.png', anim: [[0, 32, 32, 32], [32, 32, 32, 32], [64, 32, 32, 32], [96, 32, 32, 32]], r: [0, 32, 32, 32], col: [-12, -10, 24, 9], light: [0, -12, 110, '255,150,60'] },
  chest: { im: 'env/chest.png', r: [66, 0, 28, 27], open: [66, 32, 28, 27], col: [-13, -10, 26, 9], interact: 'chest' },
  arcane_circle: { im: 'env/rocks.png', r: [0, 0, 1, 1], flat: true, arcane: '196,181,253', label: 'Cercle des Arcanes' },
  sanctuary: { im: 'env/rocks.png', r: [64, 65, 58, 30], col: [-26, -16, 52, 14], interact: 'spin_weapon', circle: '255,214,120', label: 'Sanctuaire des lames' },
  altar: { im: 'env/rocks.png', r: [0, 256, 64, 91], col: [-26, -24, 52, 22], interact: 'spin_exc', circle: '255,93,143', label: 'Autel de l\'Exception' },
  stash: { im: 'env/chest.png', r: [0, 0, 64, 64], col: [-28, -18, 56, 16], interact: 'stash', label: 'Réserve du village' },
  ore_iron: { im: 'env/rocks.png', r: [129, 71, 29, 24], col: [-12, -10, 24, 9], interact: 'gather', yields: [['fer', 1, 3]], glint: '#ffb36b', label: 'Filon de fer', respawn: 90 },
  ore_mithril: { im: 'env/rocks.png', r: [130, 259, 59, 54], col: [-26, -20, 52, 18], interact: 'gather', yields: [['mithril', 1, 2], ['fer', 1, 2]], glint: '#7dd3fc', label: 'Filon de mithril', respawn: 180 },
  herb: { im: 'env/plants_summer.png', r: [99, 77, 55, 51], interact: 'gather', yields: [['herbe', 1, 3]], glint: '#9dff8a', label: 'Herbes médicinales', respawn: 60 },
  oldwood: { im: 'env/trees_summer.png', r: [26, 437, 43, 31], col: [-14, -12, 28, 10], interact: 'gather', yields: [['bois_ancien', 1, 3]], glint: '#e0b070', label: 'Souche de bois ancien', respawn: 80 },
  cache: { im: 'env/chest.png', r: [98, 0, 28, 27], open: [98, 32, 28, 27], interact: 'cache', label: 'Cache secrète' },
  tomb: { im: 'env/sot_gravestones.png', r: [98, 1, 61, 94], col: [-26, -22, 52, 18], interact: 'tomb', label: 'Tombeau royal' },
};
for (let i = 0; i < 6; i++) PROPS['flower' + i] = { im: 'env/wildflowers_summer.png', r: [[4, 10, 6, 6], [21, 5, 7, 11], [52, 7, 8, 9], [68, 9, 7, 7], [84, 23, 8, 9], [116, 25, 8, 7]][i], flat: 1 };

// ===================== carte =====================
// Terrain par sommets : 0 terre, 1 herbe, 2 eau
const MW = 288, MH = 144, W0 = 96, H0 = 72; // carte entière / forêt d'origine
const WORLD = { V: null, cells: null, solid: null, props: [], grid: null, zones: [], spawns: [], chests: [], npcs: [] };
const T_DIRT = 0, T_GRASS = 1, T_WATER = 2;
function vget(x, y) { if (x < 0 || y < 0 || x > MW || y > MH) return T_GRASS; return WORLD.V[y * (MW + 1) + x]; }
function vset(x, y, t) { if (x < 0 || y < 0 || x > MW || y > MH) return; WORLD.V[y * (MW + 1) + x] = t; }

// tuiles (colonne, ligne) dans terrain_summer.png
const TS = {
  grass: { 8: [0, 0], 12: [1, 0], 4: [2, 0], 10: [0, 1], 15: [1, 1], 5: [2, 1], 2: [0, 2], 3: [1, 2], 1: [2, 2], 7: [0, 6], 11: [1, 6], 13: [0, 7], 14: [1, 7] },
  water: { 8: [0, 10], 12: [1, 10], 4: [2, 10], 10: [0, 11], 15: [1, 11], 5: [2, 11], 2: [0, 12], 3: [1, 12], 1: [2, 12], 7: [0, 13], 11: [1, 13], 13: [0, 14], 14: [1, 14] },
  grassFill: [[3, 1], [4, 1], [5, 1], [3, 2], [4, 2], [5, 2], [1, 1]],
  dirtFill: [[3, 3], [4, 3], [5, 3], [3, 4], [4, 4], [5, 4]],
  waterFill: [[1, 11]],
};
// masque : NW=1, NE=2, SW=4, SE=8
function cornerOps(mask, set, fillSet, h) {
  if (mask === 0) return [];
  if (mask === 15) return [fillSet[h % fillSet.length]];
  if (mask === 9) return [set[1], set[8]];
  if (mask === 6) return [set[2], set[4]];
  return [set[mask]];
}
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return (h ^ (h >> 16)) >>> 0; }
function regionIdx(tx, ty) { const X = tx + Math.sin(ty * 0.35) * 2 + Math.sin(ty * 0.11 + 1) * 3, Y = ty + Math.sin(tx * 0.31) * 2 + Math.cos(tx * 0.13) * 3; return (Y < H0 ? 0 : 3) + (X < W0 ? 0 : X < 2 * W0 ? 1 : 2); }
function buildCells() {
  WORLD.region = new Uint8Array(MW * MH); for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) WORLD.region[y * MW + x] = regionIdx(x, y);
  // numérotation : 0 forêt, 1 désert, 2 neige (3e colonne, haut), 3 marais, 4 volcan, 5 citadelle
  const MAPR = [0, 1, 2, 3, 4, 5]; for (let i = 0; i < WORLD.region.length; i++) WORLD.region[i] = MAPR[WORLD.region[i]];
  WORLD.cells = new Array(MW * MH);
  WORLD.solid = new Uint8Array(MW * MH);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const c = [vget(x, y), vget(x + 1, y), vget(x, y + 1), vget(x + 1, y + 1)];
    const h = hash(x, y);
    let ops = [];
    const rg = REGION_TILES[WORLD.region[y * MW + x]] || REGION_TILES[0];
    let gm = 0, wm = 0;
    for (let i = 0; i < 4; i++) { if (c[i] >= T_GRASS) gm |= 1 << i; if (c[i] === T_WATER) wm |= 1 << i; }
    if (wm === 9 || wm === 6) wm = 15;
    const L = a => a.map(o => [o[0], o[1], rg.land]), Wt = a => a.map(o => [o[0], o[1], rg.water]);
    if (wm === 15) { ops.push(...Wt([TS.waterFill[0]])); }
    else {
      if (gm !== 15) ops.push(...L([TS.dirtFill[h % TS.dirtFill.length]]));
      ops.push(...L(cornerOps(gm, TS.grass, TS.grassFill, h)));
      if (wm) ops.push(...Wt(cornerOps(wm, TS.water, TS.waterFill, h)));
    }
    WORLD.cells[y * MW + x] = ops;
    let wc = 0; for (let i = 0; i < 4; i++) if (c[i] === T_WATER) wc++;
    if (wc >= 3 || wm === 15) WORLD.solid[y * MW + x] = 1;
  }
}
function isSolidTile(tx, ty) { if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true; return WORLD.solid[ty * MW + tx] === 1; }

// ===================== génération (village + forêt) =====================
function genWorld() {
  const R = mulberry(1337);
  WORLD.V = new Uint8Array((MW + 1) * (MH + 1)).fill(T_GRASS);
  WORLD.props = []; WORLD.spawns = []; WORLD.zones = []; WORLD.chests = []; WORLD.npcs = [];
  const occupied = new Uint8Array(MW * MH); // tuiles réservées (pas d'arbres)
  const reserve = (x0, y0, x1, y1) => { for (let y = Math.max(0, y0); y <= Math.min(MH - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(MW - 1, x1); x++) occupied[y * MW + x] = 1; };
  const disc = (cx, cy, rx, ry, t, noise) => {
    for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
      const n = noise ? (Math.sin(x * 0.9 + y * 0.4) + Math.cos(y * 0.8 - x * 0.3)) * noise : 0;
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + n) vset(x, y, t);
    }
  };
  const path = (pts, w) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
      for (let k = 0; k <= n; k++) {
        const t = k / n; const x = lerp(x0, x1, t) + Math.sin((k + i * 7) * 0.35) * 0.6, y = lerp(y0, y1, t) + Math.cos((k + i * 5) * 0.3) * 0.6;
        disc(x, y, w, w, T_DIRT);
        reserve(Math.floor(x - w - 1), Math.floor(y - w - 1), Math.ceil(x + w), Math.ceil(y + w));
      }
    }
  };
  // zones
  WORLD.zones = [
    { id: 'village', name: 'Village de Brumeval', x0: 26, y0: 48, x1: 72, y1: 72, music: 'village', dark: 0 },
    { id: 'boss', name: 'Clairière du Chef Orc', x0: 36, y0: 0, x1: 62, y1: 14, music: 'boss', dark: 0.25 },
    { id: 'ruins', name: 'Cimetière oublié', x0: 6, y0: 4, x1: 30, y1: 24, music: 'forest', dark: 0.35 },
    { id: 'camp', name: 'Camp gobelin', x0: 66, y0: 24, x1: 92, y1: 44, music: 'forest', dark: 0.18 },
    { id: 'forest', name: 'Forêt de Sylvemousse', x0: 0, y0: 0, x1: 96, y1: 72, music: 'forest', dark: 0.18 },
  ];
  // place du village
  disc(48, 59, 7, 5, T_DIRT, 0.04); reserve(38, 50, 58, 70);
  reserve(28, 48, 70, 71);
  // chemins
  path([[48, 64], [48, 70], [48, 72]], 1.4);
  path([[48, 55], [47, 46], [45, 36], [47, 26], [48, 16], [48, 9]], 1.3);
  path([[46, 36], [36, 33], [26, 28], [20, 18]], 1.1);
  path([[47, 30], [58, 31], [70, 33], [78, 34]], 1.1);
  path([[44, 60], [33, 61]], 1.1); path([[52, 60], [64, 60]], 1.1);
  path([[47, 22], [58, 20], [64, 18]], 1.0);
  // étang
  disc(17, 41, 7, 5, T_WATER, 0.06); reserve(8, 34, 26, 48);
  disc(12, 38, 3, 2.5, T_WATER, 0);
  // clairières
  disc(48, 8, 9, 6, T_DIRT, 0.08); reserve(37, 1, 60, 15);
  disc(79, 34, 7, 6, T_DIRT, 0.1); reserve(70, 27, 88, 41);
  disc(18, 14, 8, 6, T_GRASS, 0); reserve(9, 7, 28, 21);
  for (let i = 0; i < 18; i++) disc(10 + R() * 18, 8 + R() * 12, 1.2, 1, T_DIRT, 0);
  disc(66, 17, 4, 3, T_DIRT, 0.1); reserve(61, 13, 71, 21);
  regionTerrain(disc, path, reserve, R);
  // le bord de l'eau reste en herbe (anneau)
  for (let y = 1; y < MH; y++) for (let x = 1; x < MW; x++) if (vget(x, y) === T_WATER) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (vget(x + dx, y + dy) === T_DIRT) vset(x + dx, y + dy, T_GRASS);
  }
  buildCells();
  const tileFree = (tx, ty) => tx > 0 && ty > 0 && tx < MW - 1 && ty < MH - 1 && !occupied[ty * MW + tx] && !WORLD.solid[ty * MW + tx];
  const add = (type, x, y, extra) => { const p = Object.assign({ type, x, y, def: PROPS[type] }, extra || {}); WORLD.props.push(p); return p; };
  // ---- village ----
  add('house_a', 36 * TILE, 56 * TILE); add('house_b', 60 * TILE, 55 * TILE); add('house_c', 37 * TILE, 68 * TILE);
  add('house_b', 61 * TILE, 68 * TILE);
  add('fountain', 48 * TILE + 16, 59 * TILE + 18);
  [[43, 55], [53, 55], [43, 64], [53, 64], [48, 50], [46, 70], [50, 70]].forEach(([x, y]) => add('lamp', x * TILE + 16, y * TILE + 20));
  add('anvil', 55 * TILE, 59 * TILE + 10); add('barrel', 57 * TILE, 58 * TILE); add('barrel', 57 * TILE + 26, 58 * TILE + 4);
  add('crates', 41 * TILE, 61 * TILE + 26); add('barrel2', 33 * TILE, 62 * TILE + 8); add('crate', 39 * TILE + 8, 58 * TILE + 26);
  for (let i = 0; i < 8; i++) add('flower' + (i % 6), (40 + R() * 16) * TILE, (52 + R() * 3) * TILE);
  // ---- PNJ ----
  WORLD.npcs.push({ look: 'npc_elder', x: 46 * TILE, y: 57 * TILE, name: 'Ancien Théobald', role: 'quest', dir: 2 });
  WORLD.npcs.push({ look: 'npc_smith', x: 56 * TILE, y: 60 * TILE + 8, name: 'Borin le forgeron', role: 'smith', dir: 1 });
  WORLD.npcs.push({ look: 'npc_merchant', x: 41 * TILE, y: 63 * TILE + 8, name: 'Maëlle la marchande', role: 'shop', dir: 2 });
  WORLD.npcs.push({ look: 'npc_mage', x: 51 * TILE, y: 63 * TILE, name: 'Isolde la mage', role: 'mage', dir: 2 });
  WORLD.npcs.push({ look: 'npc_guard', x: 47 * TILE, y: 49 * TILE, name: 'Garde Aldric', role: 'guard', dir: 2 });
  WORLD.npcs.push({ look: 'npc_artisan', x: 52 * TILE, y: 56 * TILE + 8, name: 'Maëlys l\'artisane', role: 'artisan', dir: 2 });
  WORLD.npcs.push({ look: 'npc_alchemist', x: 45 * TILE, y: 64 * TILE + 8, name: 'Eldrin l\'alchimiste', role: 'alchimie', dir: 2 });
  WORLD.npcs.push({ look: 'npc_runemaster', x: 55 * TILE + 8, y: 63 * TILE + 8, name: 'Thalor, maître runique', role: 'runique', dir: 1 });
  WORLD.npcs.push({ look: 'npc_relic', x: 43 * TILE, y: 57 * TILE + 8, name: 'Séraphine, spécialiste des reliques', role: 'reliques', dir: 3 });
  // ---- camp gobelin ----
  add('campfire', 79 * TILE, 34 * TILE + 8); add('tent', 74 * TILE, 31 * TILE); add('tent', 84 * TILE, 31 * TILE);
  add('crate', 76 * TILE, 38 * TILE); add('barrel', 82 * TILE, 38 * TILE);
  // ---- cimetière ----
  [[13, 11], [17, 10], [21, 11], [14, 16], [18, 15], [22, 16], [25, 13]].forEach(([x, y], i) => add(['grave1', 'grave2', 'grave3'][i % 3], x * TILE, y * TILE));
  add('witheredtree', 10 * TILE, 18 * TILE); add('witheredtree', 26 * TILE, 9 * TILE); add('deadtree', 24 * TILE, 19 * TILE);
  // ---- clairière du chef ----
  add('campfire', 44 * TILE, 7 * TILE); add('campfire', 52 * TILE, 7 * TILE); add('tent', 48 * TILE, 4 * TILE);
  add('rockgreybig', 40 * TILE, 11 * TILE); add('rocktall', 57 * TILE, 11 * TILE);
  // ---- étang ----
  for (let i = 0; i < 14; i++) {
    const a = R() * 6.28, r = R() * 5; const x = 17 + Math.cos(a) * r, y = 41 + Math.sin(a) * r * 0.7;
    if (isSolidTile(Math.floor(x), Math.floor(y))) add(i % 3 === 0 ? 'lily1' : i % 3 === 1 ? 'lily2' : 'lily3', x * TILE, y * TILE);
  }
  for (let i = 0; i < 16; i++) { const a = R() * 6.28; const x = 17 + Math.cos(a) * 8, y = 41 + Math.sin(a) * 6; add(i % 2 ? 'reed1' : 'tallgrass1', x * TILE, y * TILE); }
  // ---- coffres ----
  const chestAt = (x, y, loot) => { const p = add('chest', x * TILE + 16, y * TILE + 20, { loot, opened: false, id: 'c' + x + '_' + y }); WORLD.chests.push(p); };
  chestAt(20, 13, ['ka_crepuscule', 'potion', 'gold:60']);
  chestAt(84, 37, ['ar_cotte', 'potion', 'recipe:r_nodachi', 'gold:40']);
  chestAt(12, 45, ['la_trident', 'gold:25']);
  chestAt(66, 16, ['arc_veilleur', 'ar_barbute', 'gold:30']);
  chestAt(31, 30, ['ac_talisman', 'potion', 'recipe:r_pierre']);
  chestAt(48, 4, ['bo_bastion', 'ar_jambieres', 'ar_brassards', 'sceau_lame', 'gold:150']);
  // ---- introduction : Cercle des Arcanes, terrain d'entraînement, maîtres des styles ----
  storyPlaceWorld(add, reserve);
  // ---- lieux de la Partie 5 ----
  add('sanctuary', 54 * TILE, 51 * TILE + 20); add('altar', 42 * TILE + 8, 51 * TILE + 22); add('stash', 50 * TILE + 20, 55 * TILE + 10);
  const tombIdx = WORLD.props.findIndex(p => p.type === 'grave2' && Math.abs(p.x - 17 * TILE) < 2); if (tombIdx >= 0) { WORLD.props[tombIdx].type = 'tomb'; WORLD.props[tombIdx].def = PROPS.tomb; }
  const node = (type, x, y) => { const p = add(type, x * TILE + 16, y * TILE + 26, { id: type + x + '_' + y }); reserve(x - 1, y - 1, x + 1, y); return p; };
  [[40, 31], [58, 27], [72, 23], [30, 45], [62, 41], [52, 19], [35, 22], [76, 44]].forEach(([x, y]) => node('ore_iron', x, y));
  [[25, 7], [41, 3], [57, 4]].forEach(([x, y]) => node('ore_mithril', x, y));
  [[33, 38], [44, 26], [60, 34], [24, 32], [70, 28], [53, 42], [15, 27], [83, 20]].forEach(([x, y]) => node('herb', x, y));
  [[28, 26], [64, 12], [19, 30], [86, 26], [38, 16], [56, 36]].forEach(([x, y]) => node('oldwood', x, y));
  const cache = (x, y, loot) => { const p = add('cache', x * TILE + 16, y * TILE + 20, { loot, opened: false, hidden: true, id: 'h' + x + '_' + y }); WORLD.chests.push(p); reserve(x - 1, y - 1, x + 1, y + 1); };
  cache(7, 30, ['eclat_exception', 'mithril']); cache(89, 9, ['sceau_lame', 'sceau_lame', 'cristal_magique']);
  cache(29, 57, ['relique_inconnue', 'chronique']); cache(71, 50, ['eclat_exception', 'ecaille_drake', 'ecaille_drake']);
  // ---- forêt : arbres ----
  const trees = ['oak1', 'oak2', 'oak3', 'oak8', 'oak9', 'dark13', 'dark14', 'dark15', 'pine17', 'pine18', 'pine19'];
  const walls = ['wall4', 'wall10', 'wall16', 'wall20'];
  // bordure dense
  for (let x = 0; x < W0; x += 2) { add(choice2(R, walls), x * TILE + 32, 2 * TILE + R() * 8); if (x < 40 || x > 56) add(choice2(R, walls), x * TILE + 32, H0 * TILE - 4 + R() * 6); }
  for (let y = 2; y < H0; y += 2) { add(choice2(R, walls), 1 * TILE + R() * 6, y * TILE + 40); if (y < 26 || y > 42) add(choice2(R, walls), (W0 - 1) * TILE - R() * 6, y * TILE + 40); }
  for (let ty = 3; ty < H0 - 2; ty++) for (let tx = 2; tx < W0 - 2; tx++) {
    if (!tileFree(tx, ty)) continue;
    const inVillage = ty > 46 && tx > 26 && tx < 72;
    const dens = inVillage ? 0.025 : (ty > 44 ? 0.14 : 0.3);
    if (R() < dens && hash(tx, ty) % 2 === 0) {
      // espacement
      let ok = true;
      for (const p of WORLD.props) if (p.def.fade && Math.abs(p.x - tx * TILE) < 48 && Math.abs(p.y - ty * TILE) < 34) { ok = false; break; }
      if (!ok) continue;
      add(choice2(R, trees), tx * TILE + 16 + R() * 8, ty * TILE + 28);
      reserve(tx - 1, ty - 1, tx + 1, ty);
    }
  }
  // végétation basse et rochers
  for (let ty = 3; ty < H0 - 2; ty++) for (let tx = 2; tx < W0 - 2; tx++) {
    const free = !WORLD.solid[ty * MW + tx];
    if (!free) continue;
    const r = R(); const isDirt = vget(tx, ty) === T_DIRT && vget(tx + 1, ty + 1) === T_DIRT;
    const inVillage = ty > 46 && tx > 26 && tx < 72;
    if (occupied[ty * MW + tx]) { if (!isDirt && r < 0.05) add(choice2(R, ['grass1', 'grass2', 'flower0', 'flower1', 'flower3']), tx * TILE + R() * 32, ty * TILE + R() * 32); continue; }
    if (r < 0.035) add(choice2(R, ['bush0', 'bush1', 'bush2', 'bush3', 'bush4', 'bush5', 'conifer']), tx * TILE + 16, ty * TILE + 28);
    else if (r < 0.05 && !inVillage) add(choice2(R, ['fern', 'bigfern', 'tallgrass1', 'tallgrass2', 'grass3']), tx * TILE + 16, ty * TILE + 28);
    else if (r < 0.058 && !inVillage) add(choice2(R, ['rockmed', 'rocksm', 'rockflat', 'stump', 'rockgrey']), tx * TILE + 16, ty * TILE + 26);
    else if (r < 0.13) add(choice2(R, ['grass1', 'grass2', 'flower0', 'flower1', 'flower2', 'flower3', 'flower4', 'flower5', 'pebble', 'mushroom']), tx * TILE + R() * 32, ty * TILE + R() * 32);
  }
  // ---- apparitions d'ennemis ----
  const sp = (kind, x, y, n, r) => WORLD.spawns.push({ kind, x: x * TILE, y: y * TILE, n: n || 1, r: (r || 3) * TILE });
  sp('slime', 44, 40, 3, 3); sp('slime', 54, 44, 2); sp('bee', 30, 40, 2); sp('snake', 26, 46, 2);
  sp('bat', 18, 12, 3, 4); sp('skeleton_archer', 15, 12, 2, 3); sp('skeleton_archer', 22, 14, 1);
  sp('goblin_rogue', 78, 33, 3, 4); sp('orc_warrior', 80, 36, 1); sp('goblin_rogue', 70, 32, 1);
  sp('wolf_brute', 66, 17, 2, 3); sp('lizard_spearman', 34, 33, 2, 3); sp('dark_mage', 22, 26, 1);
  sp('eyeball', 58, 30, 2, 3); sp('slime', 38, 24, 2); sp('bee', 60, 38, 2); sp('lizard_spearman', 54, 24, 1);
  sp('demon_brute', 30, 18, 1); sp('orc_warrior', 47, 12, 2, 4); sp('boss_orc_chief', 48, 7, 1, 0);
  genRegions({ R, add, reserve, tileFree, sp, chestAt });
  WORLD.zones.splice(WORLD.zones.length - 1, 0,
    { id: 'desert', name: 'Désert d\'Arkhan', x0: 96, y0: 0, x1: 192, y1: 72, music: 'forest', dark: 0 },
    { id: 'neige', name: 'Cimes de Givrenuit', x0: 192, y0: 0, x1: 288, y1: 72, music: 'forest', dark: 0.1 },
    { id: 'marais', name: 'Marais de Grisebrume', x0: 0, y0: 72, x1: 96, y1: 144, music: 'forest', dark: 0.14 },
    { id: 'volcan', name: 'Cratère de Cendrefeu', x0: 96, y0: 72, x1: 192, y1: 144, music: 'forest', dark: 0.04 },
    { id: 'citadelle', name: 'Citadelle de Malvorak', x0: 192, y0: 72, x1: 288, y1: 144, music: 'forest', dark: 0.18 });
  buildSolidGrid();
}
function choice2(R, a) { return a[Math.floor(R() * a.length)]; }
function zoneAt(x, y) { const tx = x / TILE, ty = y / TILE; for (const z of WORLD.zones) if (tx >= z.x0 && tx < z.x1 && ty >= z.y0 && ty < z.y1) return z; return WORLD.zones[WORLD.zones.length - 1]; }

// ===================== collisions =====================
const GCELL = 128;
function buildSolidGrid() {
  WORLD.grid = new Map();
  for (const p of WORLD.props) {
    const c = p.def.col; if (!c) continue;
    p.box = { x: p.x + c[0], y: p.y + c[1], w: c[2], h: c[3] };
    gridAdd(p.box);
  }
}
function gridAdd(b) {
  for (let gy = Math.floor(b.y / GCELL); gy <= Math.floor((b.y + b.h) / GCELL); gy++) for (let gx = Math.floor(b.x / GCELL); gx <= Math.floor((b.x + b.w) / GCELL); gx++) {
    const k = gx + ',' + gy; if (!WORLD.grid.has(k)) WORLD.grid.set(k, []); WORLD.grid.get(k).push(b);
  }
}
function boxesNear(x, y, w, h) {
  const out = new Set();
  for (let gy = Math.floor(y / GCELL); gy <= Math.floor((y + h) / GCELL); gy++) for (let gx = Math.floor(x / GCELL); gx <= Math.floor((x + w) / GCELL); gx++) {
    const L = WORLD.grid.get(gx + ',' + gy); if (L) for (const b of L) out.add(b);
  }
  return out;
}
function rectBlocked(x, y, w, h) {
  if (x < TILE || y < TILE || x + w > (MW - 1) * TILE || y + h > (MH - 1) * TILE) return true;
  if (typeof regionWallBlocked === 'function' && regionWallBlocked(x, y, w, h)) return true;
  for (let ty = Math.floor(y / TILE); ty <= Math.floor((y + h) / TILE); ty++) for (let tx = Math.floor(x / TILE); tx <= Math.floor((x + w) / TILE); tx++) if (isSolidTile(tx, ty)) return true;
  for (const b of boxesNear(x, y, w, h)) if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) return true;
  return false;
}
// déplace une entité (pieds : boîte w x h centrée en x, en bas à y)
function moveBody(e, dx, dy) {
  const hw = e.bw / 2, bh = e.bh;
  let hit = false;
  if (dx) { const nx = e.x + dx; if (!rectBlocked(nx - hw, e.y - bh, e.bw, bh)) e.x = nx; else { hit = true; } }
  if (dy) { const ny = e.y + dy; if (!rectBlocked(e.x - hw, ny - bh, e.bw, bh)) e.y = ny; else { hit = true; } }
  return hit;
}
function lineClear(x0, y0, x1, y1) {
  const n = Math.ceil(dist(x0, y0, x1, y1) / 12);
  for (let i = 1; i < n; i++) { const t = i / n; const x = lerp(x0, x1, t), y = lerp(y0, y1, t); if (isSolidTile(Math.floor(x / TILE), Math.floor(y / TILE))) return false; }
  return true;
}

// ===================== rendu du terrain =====================
function drawTerrain(ctx, cx, cy) {
  const x0 = Math.max(0, Math.floor(cx / TILE)), y0 = Math.max(0, Math.floor(cy / TILE));
  const x1 = Math.min(MW - 1, Math.floor((cx + W) / TILE)), y1 = Math.min(MH - 1, Math.floor((cy + H) / TILE));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const ops = WORLD.cells[y * MW + x]; const dx = x * TILE - cx, dy = y * TILE - cy;
    for (const o of ops) ctx.drawImage(tilesetFor(o[2]), o[0] * TILE, o[1] * TILE, TILE, TILE, dx, dy, TILE, TILE);
  }
}
function propSprite(p) {
  const d = p.def; let r = d.r;
  if (d.anim) r = d.anim[Math.floor(G.t * 8 + p.x) % d.anim.length];
  if (d.open && p.opened) r = d.open;
  return r;
}
function drawProp(ctx, p, cx, cy, alpha) {
  const d = p.def; const r = propSprite(p);
  const dx = Math.round(p.x - r[2] / 2 - cx), dy = Math.round(p.y - r[3] - cy);
  if (d.sh) drawShadow(ctx, p.x - cx, p.y - cy - 2, d.sh, 0.22);
  if (alpha !== undefined && alpha < 1) ctx.globalAlpha = alpha;
  ctx.drawImage(img(d.im), r[0], r[1], r[2], r[3], dx, dy, r[2], r[3]);
  ctx.globalAlpha = 1;
}
