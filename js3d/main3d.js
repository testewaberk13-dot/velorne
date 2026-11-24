// =====================================================================
//  VÉLORNE 3D — MOTEUR DE RENDU DU JEU (socle, étape 1)
//  Dessine en 3D l'état du jeu (G, WORLD) : sol par blocs, décors, personnages, effets, caméra, lumière.
//  La logique reste entièrement celle du jeu (voir js3d/bridge2d.js).
// =====================================================================
import { THREE, scene, camera, renderer, STATE, U, time, DAY, applyDay, buildPost, resize as resize3d, render as render3d, MOBILE, patch } from '../assets/demo/v4/core.js';

const B = B2D; const T = 32; // pixels par mètre
const m = v => v / T;
buildPost(); resize3d(); addEventListener('resize', resize3d);
STATE.pix = true;
DAY.speed = 0; // l'heure suit pour l'instant la lumière de la zone du jeu (voir plus bas)

// ---------------- sol : blocs de 32 × 32 tuiles, peints avec les tuiles du jeu ----------------
const CH = 32, CHUNKS = new Map();
function chunkKey(i, j) { return i + ',' + j; }
const groundGeo = (() => { const g = new THREE.PlaneGeometry(CH, CH, 1, 1); g.rotateX(-Math.PI / 2); g.translate(CH / 2, 0, CH / 2); return g; })();
function buildChunk(i, j) {
  const k = chunkKey(i, j); if (CHUNKS.has(k)) return CHUNKS.get(k);
  const res = MOBILE ? 12 : 16, c = document.createElement('canvas'); c.width = c.height = CH * res;
  B.bakeGround(c, i * CH, j * CH, CH, res / T);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  const mesh = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ map: tex })); mesh.position.set(i * CH, 0, j * CH); mesh.receiveShadow = true; scene.add(mesh);
  const ch = { i, j, mesh, tex }; CHUNKS.set(k, ch); return ch;
}
function updateChunks(px, pz) {
  const ci = Math.floor(px / CH), cj = Math.floor(pz / CH), R = 1;
  for (let j = cj - R; j <= cj + R; j++) for (let i = ci - R; i <= ci + R; i++) if (i >= 0 && j >= 0 && i * CH < MW && j * CH < MH) buildChunk(i, j);
  for (const [k, ch] of CHUNKS) if (Math.abs(ch.i - ci) > R + 1 || Math.abs(ch.j - cj) > R + 1) { scene.remove(ch.mesh); ch.tex.dispose(); ch.mesh.material.dispose(); CHUNKS.delete(k); }
}

// ---------------- décors debout : panneaux verticaux peints avec l'image du jeu ----------------
const PROP_TEX = new Map(), PROP_MAT = new Map(), PROP_GEO = new Map();
function propMaterial(p) {
  const key = B.propKey(p); let mat = PROP_MAT.get(key); if (mat) return mat;
  const c = document.createElement('canvas'); const r = B.drawPropSprite(c, p);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  mat = patch(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }), p.def.fade ? { cut: true, near: false } : {});
  mat.userData = { w: r[2], h: r[3], depth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 }) }; PROP_MAT.set(key, mat); return mat;
}
function geoFor(w, h) { const k = w + 'x' + h; let g = PROP_GEO.get(k); if (!g) { g = new THREE.PlaneGeometry(m(w), m(h)); g.translate(0, m(h) / 2, 0); PROP_GEO.set(k, g); } return g; }
const PROP_MESH = new Map(); let propCenter = null;
function updateProps(px, pz, force) {
  if (!force && propCenter && Math.hypot(px - propCenter[0], pz - propCenter[1]) < 3) { for (const [p, mesh] of PROP_MESH) refreshProp(p, mesh); return; }
  propCenter = [px, pz]; const R = 34, keep = new Set();
  for (const p of WORLD.props) { if (p.def.flat) continue; const x = m(p.x), z = m(p.y); if (Math.abs(x - px) > R || Math.abs(z - pz) > R * 0.8) continue; keep.add(p);
    if (!PROP_MESH.has(p)) { const mat = propMaterial(p); const mesh = new THREE.Mesh(geoFor(mat.userData.w, mat.userData.h), mat); mesh.position.set(x, 0, z); mesh.castShadow = true; mesh.receiveShadow = true; mesh.customDepthMaterial = mat.userData.depth; scene.add(mesh); PROP_MESH.set(p, mesh); }
    refreshProp(p, PROP_MESH.get(p)); }
  for (const [p, mesh] of PROP_MESH) if (!keep.has(p)) { scene.remove(mesh); PROP_MESH.delete(p); }
}
function refreshProp(p, mesh) {
  const P = G.player; const vis = !p.hidden || p.opened || G.reveal > 0 || Math.hypot(p.x - P.x, p.y - P.y) < 26; mesh.visible = vis;
  if (p.def.anim || p.def.open) { const mat = propMaterial(p); if (mesh.material !== mat) { mesh.material = mat; mesh.customDepthMaterial = mat.userData.depth; mesh.geometry = geoFor(mat.userData.w, mat.userData.h); } }
}

// ---------------- personnages, ennemis, PNJ, butin : panneaux dessinés chaque image par les fonctions du jeu ----------------
const ACT = new Map();
function actor(o, kind) {
  let a = ACT.get(o); if (a) return a;
  const S = kind === 'enemy' && o.def && o.def.boss ? 288 : kind === 'drop' || kind === 'proj' ? 96 : 192;
  const c = document.createElement('canvas'); c.width = c.height = S; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  const mat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.4, side: THREE.DoubleSide });
  const foot = Math.round(S * 0.8); const g = new THREE.PlaneGeometry(m(S), m(S)); g.translate(0, m(S) / 2 - m(S - foot), 0);
  const mesh = new THREE.Mesh(g, mat); mesh.castShadow = kind !== 'proj'; mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.4 }); scene.add(mesh);
  a = { o, kind, c, tex, mesh, seen: 0 }; ACT.set(o, a); return a;
}
let frameId = 0;
function updateActors(px, pz) {
  frameId++; const near = o => Math.abs(m(o.x) - px) < 26 && Math.abs(m(o.y) - pz) < 20;
  const list = [[G.player, 'player']]; for (const e of G.enemies) if (near(e)) list.push([e, 'enemy']); for (const n of G.npcs) if (near(n)) list.push([n, 'npc']); for (const d of G.drops) if (near(d)) list.push([d, 'drop']); for (const p of G.projs) if (near(p)) list.push([p, 'proj']);
  for (const [o, kind] of list) { const a = actor(o, kind); a.seen = frameId; B.drawActor(a.c, kind, o); a.tex.needsUpdate = true; a.mesh.position.set(m(o.x), kind === 'proj' ? 0.6 : 0, m(o.y)); a.mesh.visible = true; }
  for (const [o, a] of ACT) if (a.seen !== frameId) { scene.remove(a.mesh); a.tex.dispose(); a.mesh.material.dispose(); ACT.delete(o); }
}

// ---------------- effets : couche au sol couvrant la zone autour du joueur ----------------
const FXW = 1408, FXH = 1024, FXS = MOBILE ? 0.4 : 0.5; // en pixels du jeu ; échelle de la toile
const fxCanvas = document.createElement('canvas'); fxCanvas.width = Math.round(FXW * FXS); fxCanvas.height = Math.round(FXH * FXS);
const fxTex = new THREE.CanvasTexture(fxCanvas); fxTex.colorSpace = THREE.SRGBColorSpace; fxTex.magFilter = THREE.NearestFilter; fxTex.minFilter = THREE.LinearFilter; fxTex.generateMipmaps = false;
const fxMesh = new THREE.Mesh((() => { const g = new THREE.PlaneGeometry(m(FXW), m(FXH)); g.rotateX(-Math.PI / 2); return g; })(), new THREE.MeshBasicMaterial({ map: fxTex, transparent: true, depthWrite: false, toneMapped: false }));
fxMesh.renderOrder = 3; scene.add(fxMesh);
function updateEffects() {
  const P = G.player, cx = Math.round(P.x - FXW / 2), cy = Math.round(P.y - FXH / 2);
  B.drawEffects(fxCanvas, cx, cy, FXW, FXH, FXS); fxTex.needsUpdate = true; fxMesh.position.set(m(cx + FXW / 2), 0.04, m(cy + FXH / 2));
}

// ---------------- lumières dynamiques du jeu (torches, sorts) → quelques lumières 3D ----------------
const PL = []; for (let i = 0; i < 6; i++) { const l = new THREE.PointLight('#ffcc88', 0, 8, 1.5); scene.add(l); PL.push(l); }
const _c = new THREE.Color();
function updateLights() {
  const P = G.player; const L = (G.lights || []).filter(l => l && l.x != null).map(l => [l, Math.hypot(l.x - P.x, l.y - P.y)]).sort((a, b) => a[1] - b[1]).slice(0, PL.length);
  PL.forEach((pl, i) => { const it = L[i]; if (!it) { pl.intensity = 0; return; } const l = it[0]; pl.position.set(m(l.x), 1.2, m(l.y)); pl.distance = Math.max(4, m(l.r || 90) * 1.6); if (l.col) _c.set('rgb(' + l.col + ')'); else _c.set('#ffd9a0'); pl.color.copy(_c); pl.intensity = 6 * (l.a ?? 1); });
}

// ---------------- caméra ----------------
const CAM = { dist: 15, pitch: 0.92, look: new THREE.Vector3() };
addEventListener('wheel', e => { if (G.mode === 'play' && !document.querySelector('.ov.show,.panel.show')) CAM.dist = Math.max(8, Math.min(26, CAM.dist + Math.sign(e.deltaY) * 1.2)); }, { passive: true });
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), _p = new THREE.Vector3();
const gameCv = document.getElementById('game');
gameCv.addEventListener('mousemove', e => { if (!B.on || G.mode !== 'play') return; ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); if (ray.ray.intersectPlane(ground, hit)) B.setMouseWorld(hit.x * T, hit.z * T); });
// projection d'un point du monde vers la toile d'interface du jeu
B.project = (x, y, h) => { _p.set(m(x), h || 0, m(y)).project(camera); if (_p.z > 1) return null; const r = gameCv.getBoundingClientRect(), [w, hh] = B.view(); const sx = (_p.x + 1) / 2 * innerWidth, sy = (1 - _p.y) / 2 * innerHeight; return { x: (sx - r.left) / r.width * w, y: (sy - r.top) / r.height * hh }; };

// ---------------- une image ----------------
let built = false, lastT = performance.now(), darkS = 0;
const info = document.getElementById('v3dinfo');
B.frame3d = function () {
  const now = performance.now(), dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; time.value += dt;
  const P = G.player, px = m(P.x), pz = m(P.y);
  if (!built) { built = true; propCenter = null; }
  updateChunks(px, pz); updateProps(px, pz); updateActors(px, pz); updateEffects(); updateLights();
  // caméra qui suit le joueur (secousses du jeu reprises)
  const sh = G.shake && SET.shake !== false ? G.shake * 0.02 : 0;
  CAM.look.lerp(_p.set(px, 0.8, pz), Math.min(1, dt * 8));
  camera.position.set(CAM.look.x + (Math.random() - 0.5) * sh, CAM.look.y + Math.sin(CAM.pitch) * CAM.dist, CAM.look.z + Math.cos(CAM.pitch) * CAM.dist); camera.lookAt(CAM.look);
  // découpe des arbres devant le héros
  _p.set(px, 1.0, pz).project(camera); U.uPS.value.set((_p.x + 1) / 2, (_p.y + 1) / 2); U.uPD.value = _p.z * 0.5 + 0.5; U.uOR.value = 0.12 * 15 / CAM.dist;
  // lumière : zones sombres du jeu (grottes, nuit, donjons) → heure et intensité
  const z = G.zone || WORLD.zones[0]; darkS += (((z && z.dark) || 0) - darkS) * Math.min(1, dt * 2); const dark = darkS;
  DAY.h = dark > 0.55 ? 23 : dark > 0.3 ? 19.5 : 11;
  applyDay(px, 0, pz);
  render3d();
  if (info) info.textContent = 'Vélorne 3D — socle (étape 1) · ' + (z ? z.name : '');
};
B.on = true;
window.V3D = { THREE, scene, camera, renderer, CAM, CHUNKS, PROP_MESH, ACT };
