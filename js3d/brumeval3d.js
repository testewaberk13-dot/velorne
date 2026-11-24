// =====================================================================
//  VÉLORNE 3D — BRUMEVAL COMPLET DANS LE JEU (étape 5 : Brumeval unifié)
//  Le village pilote v4 (terrain sculpté, rivière, pont, étang, cascade et grotte, 6 bâtiments avec intérieurs en coupe,
//  végétation) est construit tel quel dans le monde du jeu, à l'emplacement du village. La zone du village est agrandie
//  (autorisation du 24/11) : le village pilote occupe environ 80 × 58 m au lieu de 46 × 24 m.
//  Repère : point (x, z) du village pilote = point (OX + x, OZ + z) du monde du jeu, en mètres (1 m = 1 case).
//  Les collisions, la hauteur du sol et les intérieurs du village pilote remplacent ceux du jeu dans cette zone.
//  Les zones voisines du jeu (camp gobelin, cimetière, clairière du chef) sont exclues et restent intactes.
// =====================================================================
import { THREE, scene, DAY, time, U, walkH, blocked, buildTerrain, buildWater, inCave, COL } from '../assets/demo/v4/core.js';
import { buildVillage, V, VM, L2W } from '../assets/demo/v4/village.js';
import { buildNature, singleTree, updateLod } from '../assets/demo/v4/nature.js';
import { HOOK } from './world3d.js';

export const OX = 48, OZ = 58; // la place du village pilote tombe sur la place du village du jeu (fontaine en 48, 59)
const X0 = -44, X1 = 37, Z0 = -44, Z1 = 14;
// dedans : rectangle du village pilote, moins le camp gobelin (nord-est) et le cimetière (nord-ouest), qui restent ceux du jeu
export function inLocal(lx, lz) { return lx > X0 && lx < X1 && lz > Z0 && lz < Z1 && !(lx > 16 && lz < -12) && !(lx < -17 && lz < -33); }
export const inWorld = (x, z) => inLocal(x - OX, z - OZ);

// ---------------- construction (au chargement, avant les blocs du monde) ----------------
const before = new Set(scene.children);
const terrain = buildTerrain(); const water = buildWater();
buildVillage(water.mat); buildNature(V.reserved); singleTree(V.oak.x, V.oak.z, 1.15, 0.4);
const ROOT = new THREE.Group(); ROOT.position.set(OX, 0, OZ);
const added = scene.children.filter(o => !before.has(o));
// lumières du village (lanternes, forge, cheminées) : retirées de la scène et confiées à l'ensemble de lumières partagé du jeu
export const LIGHTS = [];
for (const o of added) { scene.remove(o); if (o.isPointLight) { LIGHTS.push({ l: o, base: o.intensity || 1 }); continue; } ROOT.add(o); }
ROOT.traverse(o => { if (o.isPointLight) LIGHTS.push({ l: o, base: o.intensity || 1, nested: true }); });
for (const L of LIGHTS) { if (L.nested && L.l.parent) { L.wp = new THREE.Vector3(); L.l.getWorldPosition(L.wp); } L.l.intensity = 0; L.l.visible = false; }
scene.add(ROOT); ROOT.updateMatrixWorld(true);
for (const L of LIGHTS) if (!L.nested) L.wp = new THREE.Vector3(L.l.position.x + OX, L.l.position.y, L.l.position.z + OZ);
for (const L of V.lights) { if (L.type === 'plight' || L.type === 'fire') { const e = LIGHTS.find(x => x.l === L.l); if (e) { e.kind = L.type; e.base = L.base || e.base; } } }

// découpe : terrain et eau du village pilote n'apparaissent que dans la zone de Brumeval
const CLIP = `{ vec2 bl = vWP.xz - vec2(${OX.toFixed(1)}, ${OZ.toFixed(1)}); bool inz = bl.x > ${X0.toFixed(1)} && bl.x < ${X1.toFixed(1)} && bl.y > ${Z0.toFixed(1)} && bl.y < ${Z1.toFixed(1)} && !(bl.x > 16.0 && bl.y < -12.0) && !(bl.x < -17.0 && bl.y < -33.0); if (!inz) discard; }`;
function clipMat(mat) {
  if (mat.isShaderMaterial) { mat.fragmentShader = mat.fragmentShader.replace(/void main\(\)\s*\{/, m => m + CLIP); mat.needsUpdate = true; return; }
  const prev = mat.onBeforeCompile, pk = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = sh => { if (prev) prev(sh); if (sh.fragmentShader.includes('varying vec3 vWP')) sh.fragmentShader = sh.fragmentShader.replace(/void main\(\)\s*\{/, m => m + CLIP); };
  mat.customProgramCacheKey = () => pk() + '|bru'; mat.needsUpdate = true;
}
clipMat(terrain.material); for (const m of [water.mat, water.fallMat]) clipMat(m);
// végétation et décors du village pilote hors zone : instances retirées (le camp, le cimetière et le reste du monde gardent les leurs)
const _m = new THREE.Matrix4(), _v = new THREE.Vector3();
ROOT.traverse(o => {
  if (o.isInstancedMesh) { let n = 0; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, _m); _v.setFromMatrixPosition(_m); if (inLocal(_v.x, _v.z)) { if (n !== i) { o.setMatrixAt(n, _m); if (o.instanceColor) { const c = new THREE.Color(); o.getColorAt(i, c); o.setColorAt(n, c); } } n++; } } o.count = n; o.instanceMatrix.needsUpdate = true; if (o.instanceColor) o.instanceColor.needsUpdate = true; o.computeBoundingSphere && o.computeBoundingSphere(); }
  else if (o.isMesh && o !== terrain && o.geometry && o.parent === ROOT) { o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; if (bb) { const cx = (bb.min.x + bb.max.x) / 2 + o.position.x, cz = (bb.min.z + bb.max.z) / 2 + o.position.z; if (bb.max.x - bb.min.x < 30 && !inLocal(cx, cz)) o.visible = false; } }
});

// ---------------- le monde du jeu dans la zone : sol masqué, hauteur et collisions du village pilote ----------------
HOOK.height = (x, z) => inWorld(x, z) ? walkH(x - OX, z - OZ) : null;
HOOK.mask = (x, z) => inWorld(x, z);
// relief du reste du monde : ramené à plat à l'approche du village pilote, pour que les deux sols se raccordent
HOOK.flat = (x, z) => { const dx = Math.max(0, OX - 44 - x, x - (OX + 37)), dz = Math.max(0, OZ - 44 - z, z - (OZ + 14)); return Math.min(1, Math.hypot(dx, dz) / 10); };
// décors du jeu gardés dans la zone : ceux qui ont un rôle (coffres, ressources, réserve, sanctuaire, autel, cercle des Arcanes, cachettes)
const FUNC = /chest|ore|herb|stash|sanctuary|altar|arcane|circle|cache|lore|node|res_|mine|crystal_n/;
HOOK.keep = pr => !!(pr.loot || pr.hidden || pr.def && (pr.def.interact || pr.def.arcane || pr.def.circle || pr.def.res) || FUNC.test(pr.type));
const free = (lx, lz, r = 0.32) => !blocked(lx, lz, r);
function nearestFree(lx, lz, r = 0.32) {
  if (free(lx, lz, r)) return [lx, lz];
  for (let rad = 0.5; rad < 9; rad += 0.5) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, x = lx + Math.cos(a) * rad, z = lz + Math.sin(a) * rad; if (inLocal(x, z) && free(x, z, r)) return [x, z]; }
  return [lx, lz];
}
// collisions : dans la zone, celles du village pilote (murs, portes, clôtures, rivière, étang, arbres) ; ailleurs, celles du jeu
const rb0 = window.rectBlocked;
window.rectBlocked = function (x, y, w, h) {
  const cx = (x + w / 2) / 32, cz = (y + h / 2) / 32;
  if (inWorld(cx, cz)) { const k = blocked(cx - OX, cz - OZ, Math.max(w, h) / 64); if (k === 'eau' && G._pmove && G.player && /^(raie|dragon|griffon)$/.test(G.player.mount || '')) return false; return !!k; }
  return rb0(x, y, w, h);
};
// le village du jeu est agrandi à l'emprise du village pilote (zone sûre, musique, garde de l'introduction)
function enlargeVillage() {
  const z = WORLD.zones.find(z => z.id === 'village'); if (z && !z.bru) { z.bru = true; z.x0 = 21; z.y0 = 31; z.x1 = 65; z.y1 = 72;
    // l'ancienne partie est du village (ruelles, lanterne du chemin de l'est) reste au village, sans empiéter sur le camp gobelin
    WORLD.zones.splice(WORLD.zones.indexOf(z) + 1, 0, Object.assign({}, z, { x0: 65, y0: 46, x1: 72, y1: 72, bru2: true })); }
  if (typeof VILLAGE_BOUNDS !== 'undefined') Object.assign(VILLAGE_BOUNDS, { x0: 21, y0: 31, x1: 72, y1: 72 });
}
// habitants du jeu au village : postes de travail placés dans le village pilote (Borin à sa forge, la marchande à l'étal…)
const POSTS = { 'Ancien Théobald': [-2.5, 2.2], 'Borin le forgeron': [11, -3.4], 'Maëlle la marchande': [7.6, 3.6], 'Isolde la mage': [3.2, -12.5], 'Garde Aldric': [0, -25], "Maëlys l'artisane": [14.2, 2.4], "Eldrin l'alchimiste": [-16.5, 1.5], 'Thalor, maître runique': [-5, 4.8], 'Séraphine, spécialiste des reliques': [-6.5, 7.6] };
function placeEntity(o, post) {
  const lx = o.x / 32 - OX, lz = o.y / 32 - OZ; if (!post && !inLocal(lx, lz)) return false;
  const [x, z] = post ? nearestFree(post[0], post[1]) : nearestFree(lx, lz); o.x = (x + OX) * 32; o.y = (z + OZ) * 32; return true;
}
export function settleWorld() {
  enlargeVillage();
  for (const n of WORLD.npcs) placeEntity(n, POSTS[n.name]);
  for (const p of WORLD.props) if (HOOK.keep(p) && inWorld(p.x / 32, p.y / 32)) placeEntity(p);
}
export function settleNpcs() { for (const n of G.npcs) { const lx = n.x / 32 - OX, lz = n.y / 32 - OZ; if (inLocal(lx, lz) && !free(lx, lz)) placeEntity(n); } }
export function settleEnemies() { for (const e of G.enemies) { const lx = e.x / 32 - OX, lz = e.y / 32 - OZ; if (inLocal(lx, lz) && !free(lx, lz, 0.3)) placeEntity(e); } }

// ---------------- chaque image : intérieurs en coupe, portes fermées la nuit, eau, finesse de la végétation ----------------
let inside = null;
const insideOf = (lx, lz) => { for (const b of V.buildings) if (b.enter && b.contains(lx, lz, 0.05)) return b; return null; };
export function updateBrumeval(dt, P, look) {
  const lx = P.x / 32 - OX, lz = P.y / 32 - OZ;
  inside = inLocal(lx, lz) ? insideOf(lx, lz) : null;
  for (const b of V.buildings) { const tgt = inside === b ? 1 : 0; b.cut = (b.cut || 0) + (tgt - (b.cut || 0)) * Math.min(1, dt * 8); const hide = b.cut > 0.5; if (b.roofG && b.roofG.visible === hide) { b.roofG.visible = !hide; if (b.upG) b.upG.visible = !hide; } }
  if (V.cave && V.cave.roof) V.cave.roof.visible = !inCave(lx, lz);
  for (const d of V.doors) { if (d.fake) continue; const lock = d.b.id !== 'auberge' && d.b.id !== 'chapelle' && (DAY.h >= 22.5 || DAY.h < 6) && !inside;
    if (!d.lockSeg) { const [ax, az] = L2W(d.b, -0.7, d.b.d / 2), [bx, bz] = L2W(d.b, 0.7, d.b.d / 2); d.lockSeg = { ax, az, bx, bz, kind: 'porte', th: 0.12, off: true }; COL.segs.push(d.lockSeg); }
    d.lockSeg.off = !lock; }
  water.mat.uniforms.uTime.value = time.value; water.fallMat.uniforms.uTime.value = time.value; if (water.mat.uniforms.uSunDir) water.mat.uniforms.uSunDir.value.copy(U.uSunDir.value);
  if (DAY.cur) { if (water.mat.uniforms.uSky) water.mat.uniforms.uSky.value.copy(DAY.cur.mid); if (water.mat.uniforms.uNight) water.mat.uniforms.uNight.value = DAY.cur.night; }
  water.fallMat.uniforms.uFade.value += ((inCave(lx, lz) ? 0.18 : 1) - water.fallMat.uniforms.uFade.value) * Math.min(1, dt * 4);
  if (Math.abs(look.x - OX) < 80 && Math.abs(look.z - OZ) < 80) updateLod(look.x - OX, look.z - OZ);
  ROOT.visible = Math.abs(look.x - OX) < 110 && Math.abs(look.z - OZ) < 110;
}
// lumières candidates pour l'ensemble partagé (allumées la nuit, feux de forge selon l'activité)
export function brumevalLights(night) {
  const out = []; if (!ROOT.visible) return out; const lamp = Math.max(0, Math.min(1, (night - 0.25) / 0.5));
  for (const L of LIGHTS) { const k = L.kind === 'fire' ? 0.5 + lamp * 0.5 : lamp; if (k < 0.05) continue; out.push({ x: L.wp.x, y: L.wp.y, z: L.wp.z, col: '#' + L.l.color.getHexString(), int: L.base * k * (0.9 + Math.sin(time.value * 9 + L.wp.x) * 0.1), dist: L.l.distance || 8, decay: L.l.decay || 1.5 }); }
  return out;
}
export const BRU = { OX, OZ, V, ROOT, inLocal, inWorld, insideNow: () => inside, nearestFree, terrain, water };

// branchement sur le jeu : après la génération du monde et au lancement d'une partie
if (typeof WORLD !== 'undefined' && WORLD.npcs && WORLD.npcs.length) settleWorld();
{ const g0 = window.genWorld; window.genWorld = function (...a) { const r = g0.apply(this, a); settleWorld(); return r; }; }
{ const s0 = window.startGame; window.startGame = function (...a) { const r = s0.apply(this, a); try { const P = G.player, lx = P.x / 32 - OX, lz = P.y / 32 - OZ; if (inLocal(lx, lz)) { const [x, z] = nearestFree(lx, lz); P.x = (x + OX) * 32; P.y = (z + OZ) * 32; } settleNpcs(); settleEnemies(); } catch (e) { console.warn('brumeval', e); } return r; }; }

// eau du village pilote (rivière, étang) : pour la pêche
window.bruWaterNear = (x, y) => { const lx = x / 32 - OX, lz = y / 32 - OZ; if (!inLocal(lx, lz)) return false; for (const r of [0.9, 1.5, 2.1]) for (let a = 0; a < 8; a++) { const k = blocked(lx + Math.cos(a * 0.785) * r, lz + Math.sin(a * 0.785) * r, 0.1); if (k === 'eau') return true; } return false; };
