// =====================================================================
//  VÉLORNE 3D — MOTEUR DE RENDU DU JEU
//  Dessine en 3D l'état du jeu (G, WORLD) : sol par blocs, décors, personnages en 8 directions, effets au sol et en volume,
//  caméra réglable (angle 24°–69°, rotation, distance), visée immersive, cycle jour/nuit, qualité automatique.
//  La logique reste entièrement celle du jeu (voir js3d/bridge2d.js).
// =====================================================================
import { THREE, scene, camera, renderer, STATE, U, time, DAY, applyDay, buildPost, resize as resize3d, render as render3d, MOBILE, FOGU, POST, COL } from '../assets/demo/v4/core.js';
import { updateGuide3D, GUIDE3D } from './guide3d.js';
import { updateWorld, forceBuildAround, groundH } from './world3d.js';
import { MAP } from './kit3d.js';
import { BRU, updateBrumeval, brumevalLights, settleNpcs } from './brumeval3d.js';
import { startBrumevalLife, updateBrumevalLife, drawBubbles, BRULIFE } from './brumevalLife.js';
startBrumevalLife().catch(e => console.warn('brumeval vie', e));
import { VM } from '../assets/demo/v4/village.js';
import { updateMagic3D, MAGIC3D, flashLights } from './magic3d.js';
import { updateRegion, lavaLight } from './regions3d.js';
import { updateRegionDecor } from './regionDecor3d.js';

const B = B2D; const T = 32; // pixels par mètre
const m = v => v / T;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const angLerp = (a, b, k) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
buildPost(); resize3d(); addEventListener('resize', resize3d);
STATE.pix = true;
DAY.speed = 24 / 480; // un jour complet en 8 minutes de jeu (comme le village pilote)

// ---------------- réglages 3D (conservés avec les paramètres du jeu) ----------------
// CAMÉRA OBLIQUE (24/11, direction visuelle « personnages 2D + monde 3D ») : derrière le héros et au-dessus de lui, inclinée
// vers le terrain (34° par défaut au lieu de 49°), plus proche (10,5 m), regard porté devant le héros pour voir le chemin et
// l'horizon, et qui se replace doucement derrière lui quand il avance. Les anciens réglages sont migrés une fois (v: 2).
const PMIN = 18 * Math.PI / 180, PMAX = 69 * Math.PI / 180, DMIN = 6, DMAX = 26, PDEF = 0.6, DDEF = 10.5;
const C3 = () => { if (!SET.c3d) SET.c3d = {}; const c = SET.c3d; if (c.v !== 2) { c.v = 2; c.pitch = PDEF; c.dist = DDEF; c.follow = true; } if (c.follow == null) c.follow = true; if (c.pitch == null) c.pitch = PDEF; if (c.yaw == null) c.yaw = 0; if (c.dist == null) c.dist = DDEF; if (c.slow == null) c.slow = true; if (c.day == null) c.day = true; if (c.btns == null) c.btns = true; if (c.wx == null) c.wx = true; return c; };
let setDirty = 0; const markSet = () => { setDirty = performance.now(); };
B.cam3d = {
  rot(d) { CAM.yawT += d; C3().yaw = CAM.yawT; CAM.manualT = performance.now(); markSet(); },
  tilt(d) { CAM.pitchT = clamp(CAM.pitchT + d, PMIN, PMAX); C3().pitch = CAM.pitchT; markSet(); },
  reset() { const c = C3(); c.pitch = PDEF; c.yaw = 0; c.dist = DDEF; CAM.pitchT = PDEF; CAM.yawT = Math.round(CAM.yaw / (Math.PI * 2)) * Math.PI * 2; CAM.distT = DDEF; markSet(); },
  angleDeg() { return Math.round(CAM.pitchT * 180 / Math.PI); },
};

// qualité graphique : réglage du jeu (auto / haute / moyenne / basse) appliqué au moteur 3D
function syncQual() {
  const g = SET.gfx || 'auto', q = { haute: 2, moyenne: 1, basse: 0 }[g];
  if (q == null) STATE.auto = true; else { STATE.auto = false; if (STATE.qual !== q) { STATE.qual = q; resize3d(); setLights(); } }
}
B.qualLabel = () => (SET.gfx === 'auto' || !SET.gfx ? 'auto (' : '') + ['basse', 'moyenne', 'haute'][STATE.qual] + (SET.gfx === 'auto' || !SET.gfx ? ')' : '');

// ---------------- mesure du temps par image (diagnostic) ----------------
const PROF = { world: 0, actors: 0, fx: 0, render: 0, frame: 0, fps: 0, nAct: 0, fxUp: 0 };
const pm = (k, t0) => { PROF[k] = PROF[k] * 0.92 + (performance.now() - t0) * 0.08; };

// ---------------- personnages, ennemis, PNJ, butin : panneaux dessinés par les fonctions du jeu ----------------
const ACT = new Map();
function actor(o, kind) {
  let a = ACT.get(o); if (a) return a;
  const S = kind === 'enemy' && o.def && o.def.boss ? 288 : kind === 'drop' || kind === 'proj' ? 96 : 192;
  const c = document.createElement('canvas'); c.width = c.height = S; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  const mat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.4, side: THREE.DoubleSide, emissive: new THREE.Color(0.2, 0.2, 0.22), emissiveMap: tex });
  // volume du panneau : normale arrondie (gauche/droite, haut/bas) pour que la lumière du soleil modèle le personnage
  // au lieu de l'éclairer comme une feuille plate ; un liseré de lumière souligne le bord exposé
  if (kind !== 'proj' && kind !== 'drop') mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n { vec2 q = vMapUv - vec2(0.5, 0.42); normal = normalize(vec3(clamp(q.x * 7.0, -0.8, 0.8), clamp(q.y * 2.0, -0.35, 0.45) + 0.12, 1.0)); }'); };
  const foot = Math.round(S * 0.8); const g = new THREE.PlaneGeometry(m(S), m(S)); g.translate(0, m(S) / 2 - m(S - foot), 0);
  const mesh = new THREE.Mesh(g, mat); mesh.castShadow = kind !== 'proj' && kind !== 'drop'; mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.4 }); scene.add(mesh);
  a = { o, kind, c, tex, mesh, seen: 0, sig: '', n: 0 }; ACT.set(o, a); return a;
}
// signature d'image : on ne redessine un panneau que si ce qu'il montre a changé (PNJ, butin) ou à cadence réduite au loin
function sigOf(o, kind, d2) {
  if (kind === 'npc') return (o.moving ? 1 + Math.floor(o.t * 8) % 8 : 0) + ':' + B.sectorOf(o);
  if (kind === 'drop') return Math.floor(G.t * 6) + '';
  if (kind === 'enemy' && d2 > 110) return Math.floor(G.t * 15) + ''; // au-delà d'environ 10 m : 15 images par seconde suffisent
  return null; // toujours redessiné
}
let frameId = 0;
const yawQ = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0);
function updateActors(px, pz) {
  frameId++; const near = o => Math.abs(m(o.x) - px) < 26 && Math.abs(m(o.y) - pz) < 22;
  const list = [[G.player, 'player']]; for (const e of G.enemies) if (near(e)) list.push([e, 'enemy']); for (const n of G.npcs) if (near(n) && !n.bru3d) list.push([n, 'npc']); for (const d of G.drops) if (near(d)) list.push([d, 'drop']); for (const p of G.projs) if (near(p)) list.push([p, 'proj']);
  yawQ.setFromAxisAngle(_up, CAM.yaw); let n = 0;
  for (const [o, kind] of list) {
    const a = actor(o, kind); a.seen = frameId; const ox = m(o.x), oz = m(o.y), d2 = (ox - px) ** 2 + (oz - pz) ** 2;
    const s = sigOf(o, kind, d2);
    if (s === null || s !== a.sig) { B.drawActor(a.c, kind, o); a.tex.needsUpdate = true; a.sig = s === null ? '' : s; n++; }
    a.mesh.position.set(ox, groundH(ox, oz) + (kind === 'proj' ? 0.6 : 0), oz); a.mesh.quaternion.copy(yawQ); a.mesh.visible = true;
  }
  PROF.nAct = n;
  for (const g of G.npcs) if (g.glow3d && near(g) && Math.random() < 0.5) MAGIC3D.emit('amb', m(g.x) + (Math.random() - 0.5) * 0.4, groundH(m(g.x), m(g.y)) + 0.3, m(g.y) + (Math.random() - 0.5) * 0.4, { S: { g: -1.2, sp: 0.4, sz: 0.12, life: 1.2, col2: '#ffe08a', flick: 1 }, col: g.glow3d });
  for (const [o, a] of ACT) if (a.seen !== frameId) { scene.remove(a.mesh); a.tex.dispose(); a.mesh.material.dispose(); a.mesh.geometry.dispose(); ACT.delete(o); }
}

// ---------------- effets ----------------
// couche au sol (télégraphes, cercles, zones, ondes) et couche en volume (coups, impacts, particules, éclairs, tornades)
// tournée vers la caméra, pour que les effets aient la même présence que les personnages.
const GW = 1280, GS = MOBILE ? 0.4 : 0.5; // sol : carré de 40 m autour du joueur
const AW = 1024, AH = 900, AS = MOBILE ? 0.45 : 0.55, AFY = 0.62; // volume : le joueur est à 62 % de la hauteur
// bords des couches d'effets fondus (les voiles plein écran du jeu ne laissent plus de rectangle visible)
const EDGE = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 30, 64, 64, 64); g.addColorStop(0, '#fff'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
function fxLayer(w, h, s, mat) {
  mat.alphaMap = EDGE;
  const c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
  mat.map = t; return { c, t, empty: false };
}
const gMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false });
const GL = fxLayer(GW, GW, GS, gMat);
const gMesh = new THREE.Mesh(new THREE.PlaneGeometry(m(GW), m(GW)).rotateX(-Math.PI / 2), gMat); gMesh.renderOrder = 3; scene.add(gMesh);
const aMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false });
const AL = fxLayer(AW, AH, AS, aMat);
const aMesh = new THREE.Mesh(new THREE.PlaneGeometry(m(AW), m(AH)), aMat); aMesh.renderOrder = 10; aMesh.frustumCulled = false; scene.add(aMesh);
let arcProps = null;
const any = a => a && a.length > 0;
function updateEffects() {
  const P = G.player; if (!arcProps) arcProps = WORLD.props.filter(p => p.def.arcane || p.def.circle);
  // sol
  const gx = Math.round(P.x - GW / 2), gy = Math.round(P.y - GW / 2);
  const arcNear = arcProps.some(p => Math.abs(p.x - P.x) < GW / 2 + 90 && Math.abs(p.y - P.y) < GW / 2 + 90);
  const gAny = arcNear || G.sacred || any(G.zones2) || any(G.rifts) || any(G.voids) || any(G.mfx) || any(G.rings) || any(G.fx);
  let up = 0;
  if (gAny || !GL.empty) { B.drawEffects(GL.c, gx, gy, GW, GW, GS, 'ground', 0); GL.t.needsUpdate = true; GL.empty = !gAny; up++; }
  gMesh.visible = !GL.empty; gMesh.position.set(m(gx + GW / 2), Math.max(0, groundH(m(P.x), m(P.y))) + 0.12, m(gy + GW / 2));
  // volume
  const ax = Math.round(P.x - AW / 2), ay = Math.round(P.y - AH * AFY);
  const aAny = any(G.fx) || any(G.parts) || any(G.mfx) || any(G.bolts) || any(G.beams) || any(G.tornados) || any(G.pillars);
  if (aAny || !AL.empty) { B.drawEffects(AL.c, ax, ay, AW, AH, AS, 'air', CAM.yaw); AL.t.needsUpdate = true; AL.empty = !aAny; up++; }
  aMesh.visible = !AL.empty;
  if (aMesh.visible) {
    // plan face à la caméra, ancré aux pieds du joueur ; la profondeur du sol est écrasée par sin(angle) comme à l'écran
    const sp = Math.sin(CAM.pitch), fy = groundH(m(P.x), m(P.y));
    aMesh.quaternion.copy(camera.quaternion); aMesh.scale.set(1, sp, 1);
    const vC = -(AH / 2 - AH * AFY) / T * sp; // décalage vertical du centre de la toile par rapport aux pieds
    _v.set(0, 1, 0).applyQuaternion(camera.quaternion);
    aMesh.position.set(m(P.x), fy, m(P.y)).addScaledVector(_v, vC);
  }
  PROF.fxUp = up;
}

// ---------------- lumières : torches et sorts du jeu, lanterne du héros la nuit ----------------
// un seul ensemble de lumières ponctuelles (2, 4 ou 6 selon la qualité) partagé entre la lanterne du héros, les éclairs des sorts,
// la lueur de la lave et les lumières du jeu (torches, sorts) : les plus fortes et les plus proches sont gardées.
const PL = []; const _c = new THREE.Color();
function setLights() {
  const n = [2, 4, 6][STATE.qual]; while (PL.length < n) { const l = new THREE.PointLight('#ffcc88', 0, 8, 1.5); scene.add(l); PL.push(l); }
  while (PL.length > n) scene.remove(PL.pop());
}
setLights();
function updateLights(darkK) {
  const P = G.player, px = m(P.x), pz = m(P.y), gy = groundH(px, pz), C = [];
  const night = DAY.cur ? DAY.cur.night : 0, k = Math.max(night, darkK);
  VM.glass.emissiveIntensity = sstep(0.25, 0.75, k) * 1.3; // fenêtres allumées la nuit et dans l'obscurité
  const hl = 3.2 * sstep(0.15, 0.8, k); if (hl > 0.05) C.push({ x: px, y: gy + 1.7, z: pz, col: '#ffd6a0', int: hl, dist: 7.5, decay: 1.3, pri: 2 });
  for (const f of flashLights()) C.push(f);
  const lv = lavaLight(); if (lv.int > 0.05) C.push(lv);
  for (const b of brumevalLights(night)) C.push(b);
  for (const l of G.lights || []) { if (!l || l.x == null) continue; const d = Math.hypot(l.x - P.x, l.y - P.y); if (d > 520) continue; C.push({ x: m(l.x), y: 1.2 + groundH(m(l.x), m(l.y)), z: m(l.y), col: l.col ? 'rgb(' + l.col + ')' : '#ffd9a0', int: 6 * (l.a ?? 1), dist: Math.max(4, m(l.r || 90) * 1.6), decay: 1.5, dd: d }); }
  for (const c of C) c.score = c.int / (1 + Math.hypot(c.x - px, c.z - pz) * 0.3) + (c.pri || 0);
  C.sort((a, b) => b.score - a.score);
  PL.forEach((pl, i) => { const c = C[i]; if (!c) { pl.intensity = 0; return; } pl.position.set(c.x, c.y, c.z); pl.color.set(c.col); pl.intensity = c.int; pl.distance = c.dist; pl.decay = c.decay; });
}

// ---------------- caméra ----------------
const c0 = C3();
const CAM = { dist: c0.dist, distT: c0.dist, pitch: c0.pitch, pitchT: c0.pitch, yaw: c0.yaw, yawT: c0.yaw, look: new THREE.Vector3(), aimK: 0, aimA: 0, slowB: 2.5, slowIdle: 0 };
B.yaw = CAM.yaw;
const openUI = () => !!document.querySelector('.ov.show,.panel.show,#dlg.show');
addEventListener('wheel', e => { if (G.mode === 'play' && !openUI()) { CAM.distT = clamp(CAM.distT + Math.sign(e.deltaY) * 1.2, DMIN, DMAX); C3().dist = CAM.distT; markSet(); } }, { passive: true });
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), _p = new THREE.Vector3(), _v = new THREE.Vector3();
const gameCv = document.getElementById('game');
const MS = { x: 0, y: 0, ok: false, drag: false, lx: 0, ly: 0 };
gameCv.addEventListener('mousemove', e => {
  MS.x = e.clientX; MS.y = e.clientY; MS.ok = true;
  if (MS.drag) { B.cam3d.rot(-(e.clientX - MS.lx) * 0.008); B.cam3d.tilt((e.clientY - MS.ly) * 0.004); MS.lx = e.clientX; MS.ly = e.clientY; }
});
// bouton du milieu (molette enfoncée) : faire tourner la caméra et changer son angle
gameCv.addEventListener('mousedown', e => { if (e.button === 1 && B.on && G.mode === 'play') { e.preventDefault(); MS.drag = true; MS.lx = e.clientX; MS.ly = e.clientY; } });
addEventListener('mouseup', e => { if (e.button === 1) MS.drag = false; });
function mouseToWorld(py) {
  if (!MS.ok || IS_TOUCH) return; ndc.set(MS.x / innerWidth * 2 - 1, -(MS.y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); ground.constant = -py;
  if (ray.ray.intersectPlane(ground, hit)) B.setMouseWorld(hit.x * T, hit.z * T, false);
}
// boutons de caméra à l'écran (tactile et souris)
const cbar = document.getElementById('cam3d');
if (cbar) cbar.addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); const k = b.dataset.c;
  if (k === 'l') B.cam3d.rot(-Math.PI / 4); if (k === 'r') B.cam3d.rot(Math.PI / 4); if (k === 'u') B.cam3d.tilt(0.1); if (k === 'd') B.cam3d.tilt(-0.1); });
// projection d'un point du monde vers la toile d'interface du jeu (h en mètres au-dessus du sol)
B.project = (x, y, h) => { const X = m(x), Z = m(y); _p.set(X, (h || 0) + groundH(X, Z), Z).project(camera); if (_p.z > 1) return null; const r = gameCv.getBoundingClientRect(), [w, hh] = B.view(); const sx = (_p.x + 1) / 2 * innerWidth, sy = (1 - _p.y) / 2 * innerHeight; return { x: (sx - r.left) / r.width * w, y: (sy - r.top) / r.height * hh }; };

// la caméra ne passe pas derrière un bâtiment : elle se rapproche du héros (les arbres, eux, s'estompent autour du héros)
let HOUSES = null;
function camLimit(lx, ly, lz, yaw, pitch, dist) {
  if (!HOUSES) HOUSES = WORLD.props.filter(p => !BRU.inWorld(p.x / T, p.y / T) && MAP[p.type] && /^(house|sanctuary|darkgate|tent)$/.test(MAP[p.type][0])).map(p => { const s = MAP[p.type][0] === 'house' ? (p.def.r ? p.def.r[2] / T / 5.2 : 1) : 1.2; return { x: m(p.x), z: m(p.y), hw: 3.1 * s, hd: 2.4 * s, h: 5.2 * s }; });
  const dx = Math.sin(yaw) * Math.cos(pitch), dy = Math.sin(pitch), dz = Math.cos(yaw) * Math.cos(pitch); let best = dist;
  for (const H of HOUSES) {
    if (Math.abs(H.x - lx) > 34 || Math.abs(H.z - lz) > 34) continue;
    // intersection rayon / boîte (méthode des dalles)
    let t0 = 0, t1 = best; const gy = groundH(H.x, H.z);
    for (const [o, d, a, b] of [[lx, dx, H.x - H.hw, H.x + H.hw], [ly, dy, gy - 1, gy + H.h], [lz, dz, H.z - H.hd, H.z + H.hd]]) {
      if (Math.abs(d) < 1e-6) { if (o < a || o > b) { t0 = 1; t1 = 0; break; } continue; }
      let ta = (a - o) / d, tb = (b - o) / d; if (ta > tb) [ta, tb] = [tb, ta]; t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) break;
    }
    if (t0 <= t1 && t0 > 0.3) best = Math.min(best, Math.max(3.2, t0 - 0.6));
  }
  // maisons du village pilote (murs en segments) : la caméra oblique, plus basse, se rapproche au lieu de traverser un mur
  if (BRU.inWorld(lx, lz) && !BRU.insideNow()) {
    const sd = (x, z, s) => { const vx = s.bx - s.ax, vz = s.bz - s.az, L = vx * vx + vz * vz || 1e-6; let k = ((x - s.ax) * vx + (z - s.az) * vz) / L; k = Math.max(0, Math.min(1, k)); return Math.hypot(x - s.ax - vx * k, z - s.az - vz * k); };
    const walls = COL.segs.filter(s => !s.off && (s.kind === 'mur' || s.kind === 'paroi'));
    for (let t = 1.4; t < best; t += 0.35) { const x = lx + dx * t, y = ly + dy * t, z = lz + dz * t; if (y - groundH(x, z) > 6.2) break; const X = x - BRU.OX, Z = z - BRU.OZ;
      if (walls.some(s => Math.abs((s.ax + s.bx) / 2 - X) < 9 && Math.abs((s.az + s.bz) / 2 - Z) < 9 && sd(X, Z, s) < 0.32)) { best = Math.max(3.2, t - 0.5); break; } }
  }
  return best;
}

// visée immersive : zoom progressif, cadrage décalé vers la cible, ralenti maîtrisé (55 %, 2,5 s au plus par visée)
function updateAim(dt, rdt) {
  const A = B.aimInfo ? B.aimInfo() : null; const P = G.player;
  const strong = !!(A && (A.held || (A.bow && A.f.src !== 'mouse')));
  CAM.aimK = lerp(CAM.aimK, strong ? 1 : 0, Math.min(1, dt * (strong ? 2.2 : 4)));
  if (A) CAM.aimA = A.a;
  if (strong && A.held && C3().slow && CAM.slowB > 0 && !G.paused && !openUI()) {
    if (G.slowT <= 0.02 || G.slowF >= 0.55) { G.slowT = Math.max(G.slowT, 0.06); G.slowF = 0.55; }
    CAM.slowB -= rdt; CAM.slowIdle = 0; // temps réel : la limite de 2,5 s ne dépend pas de la fluidité
  } else if (!strong) { CAM.slowIdle += rdt; if (CAM.slowIdle > 0.8) CAM.slowB = 2.5; }
}

// ---------------- météo : pluie (reprise des prototypes v1 à v3, perdue dans la v4) et neige dans les régions froides ----------------
// Fréquences et répartition par région : PROPOSITION de réglage.
const WX_RAIN = { village: 0.25, forest: 0.3, ruins: 0.35, camp: 0.25, boss: 0.25, marais: 0.55, cote: 0.35, plaines: 0.25, jungle: 0.55, archipel: 0.3, oasis: 0.08, corrompues: 0.3 };
const WX_SNOW = { neige: 0.6, monts: 0.45, hurlevents: 0.5, fjord: 0.45 };
function precip(n, h, snow) {
  const pos = new Float32Array(n * (snow ? 3 : 6)); let r = 9;
  const R = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  for (let i = 0; i < n; i++) { const x = (R() - 0.5) * 44, y = R() * h, z = (R() - 0.5) * 44; if (snow) pos.set([x, y, z], i * 3); else pos.set([x, y, z, x + 0.04, y - 0.7, z + 0.02], i * 6); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = snow ? new THREE.PointsMaterial({ color: '#f4f8ff', size: 0.11, transparent: true, opacity: 0, depthWrite: false }) : new THREE.LineBasicMaterial({ color: '#cfe0f4', transparent: true, opacity: 0, depthWrite: false });
  const grp = new THREE.Group(); for (const dy of [0, h]) { const o = snow ? new THREE.Points(g, mat) : new THREE.LineSegments(g, mat); o.position.y = dy; o.frustumCulled = false; grp.add(o); }
  grp.visible = false; scene.add(grp); return { grp, mat, h };
}
const RAIN = precip(MOBILE ? 900 : 1500, 22, false), SNOW = precip(MOBILE ? 700 : 1200, 18, true);
const WX = { kind: null, k: 0, t: 40 + Math.random() * 60, zone: null };
function updateWeather(dt, z, darkS) {
  const c = C3(), id = z && z.id; if (id !== WX.zone) { WX.zone = id; WX.t = Math.min(WX.t, 8); }
  WX.t -= dt;
  if (WX.t <= 0) { const pr = WX_RAIN[id] || 0, ps = WX_SNOW[id] || 0; const r = Math.random(); WX.kind = r < ps ? 'snow' : r < ps + pr ? 'rain' : null; WX.t = WX.kind ? 60 + Math.random() * 100 : 50 + Math.random() * 90; }
  const want = c.wx !== false && WX.kind && darkS < 0.45 && (WX.kind === 'snow' ? WX_SNOW[id] : WX_RAIN[id]) ? 1 : 0;
  WX.k = lerp(WX.k, want, Math.min(1, dt * 0.35));
  for (const [P, kind, sp] of [[RAIN, 'rain', 17], [SNOW, 'snow', 1.6]]) {
    const k = WX.kind === kind ? WX.k : Math.max(0, WX.k - 1); P.grp.visible = k > 0.02;
    if (!P.grp.visible) continue;
    P.mat.opacity = (kind === 'rain' ? 0.5 : 0.85) * k;
    P.grp.position.set(Math.round(CAM.look.x), CAM.look.y - 4 - ((time.value * sp) % P.h), Math.round(CAM.look.z));
    if (kind === 'snow') P.grp.position.x += Math.sin(time.value * 0.7) * 0.6;
  }
  B.weather = WX;
}

// ---------------- une image ----------------
let built = false, lastT = performance.now(), darkS = 0, HOUR = null, hourSave = 0;
let fpsN = 0, fpsAcc = 0;
const info = document.getElementById('v3dinfo');
const zoneOf = () => G.zone || WORLD.zones[0];
B.frame3d = function () {
  const now = performance.now(), rdt = Math.min(1, (now - lastT) / 1000), dt = Math.min(0.05, rdt); lastT = now; time.value += dt;
  const P = G.player, px = m(P.x), pz = m(P.y), c = C3();
  if (!built) { built = true; forceBuildAround(px, pz); syncQual(); }
  if (HOUR == null) HOUR = G.flags && G.flags.h3d != null ? +G.flags.h3d : 9.5;
  // commandes de caméra au clavier (touches modifiables dans les paramètres)
  if (!openUI()) { if (IN.held.camL) B.cam3d.rot(-dt * 1.7); if (IN.held.camR) B.cam3d.rot(dt * 1.7); if (IN.held.camU) B.cam3d.tilt(dt * 0.7); if (IN.held.camD) B.cam3d.tilt(-dt * 0.7); }
  if (setDirty && now - setDirty > 800) { setDirty = 0; saveSet(); }
  const t0 = performance.now();
  updateWorld(px - Math.sin(CAM.yaw) * 12, pz - Math.cos(CAM.yaw) * 12, time.value); updateBrumeval(dt, P, CAM.look); updateBrumevalLife(dt, CAM.yaw); if ((frameId & 31) === 0) settleNpcs(); pm('world', t0);
  const t1 = performance.now(); updateActors(px, pz); pm('actors', t1);
  updateAim(dt, rdt);
  // caméra qui suit le joueur (secousses du jeu reprises), en mode portrait plus éloignée
  // elle se replace doucement derrière le héros quand il avance (pas quand il revient vers la caméra, ni pendant la visée)
  { const vx = (px - (CAM.ppx ?? px)) / Math.max(1e-3, dt), vz = (pz - (CAM.ppz ?? pz)) / Math.max(1e-3, dt); CAM.ppx = px; CAM.ppz = pz; const sp = Math.hypot(vx, vz);
    if (c.follow !== false && sp > 1.2 && sp < 40 && CAM.aimK < 0.1 && !openUI() && !BRU.insideNow() && now - (CAM.manualT || 0) > 2500) {
      const a = Math.atan2(vz, vx), want = Math.atan2(-Math.cos(a), -Math.sin(a)); let d = (want - CAM.yawT) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
      const rate = 1.5 * Math.max(0, 1 - Math.abs(d) / 1.9) * Math.min(1, sp / 4); CAM.yawT += Math.sign(d) * Math.min(Math.abs(d), rate * dt); } }
  CAM.yaw = angLerp(CAM.yaw, CAM.yawT, Math.min(1, dt * 7)); B.yaw = CAM.yaw;
  const inB = !!BRU.insideNow(); CAM.pitch = lerp(CAM.pitch, inB ? Math.max(CAM.pitchT, 0.95) : CAM.pitchT, Math.min(1, dt * 5));
  const portrait = innerHeight > innerWidth ? 1.45 : 1;
  CAM.dist = lerp(CAM.dist, (inB ? Math.min(CAM.distT, 10) : CAM.distT) * portrait * (1 - 0.2 * CAM.aimK), Math.min(1, dt * 4));
  const sh = G.shake && SET.shake !== false ? G.shake * 0.02 : 0, py = groundH(px, pz);
  // regard porté devant le héros (dans le sens de la caméra) : on voit le chemin et le décor qui s'étend vers le haut de l'écran
  const ahead = inB ? 0 : 2.6 * (1 - CAM.aimK) * sstep(0.5, 0.95, 1.25 - CAM.pitch), fwx = -Math.sin(CAM.yaw), fwz = -Math.cos(CAM.yaw);
  const off = 2.2 * CAM.aimK; _p.set(px + Math.cos(CAM.aimA) * off + fwx * ahead, py + 0.8 + (inB ? 0 : 0.35), pz + Math.sin(CAM.aimA) * off + fwz * ahead);
  CAM.look.lerp(_p, Math.min(1, dt * 8));
  const lim = camLimit(CAM.look.x, CAM.look.y, CAM.look.z, CAM.yaw, CAM.pitch, CAM.dist); CAM.lim = lerp(CAM.lim || lim, lim, Math.min(1, dt * (lim < (CAM.lim || lim) ? 14 : 2.5)));
  const cd = Math.min(CAM.dist, CAM.lim), hd = Math.cos(CAM.pitch) * cd;
  camera.position.set(CAM.look.x + Math.sin(CAM.yaw) * hd + (Math.random() - 0.5) * sh, CAM.look.y + Math.sin(CAM.pitch) * cd, CAM.look.z + Math.cos(CAM.yaw) * hd + (Math.random() - 0.5) * sh); camera.lookAt(CAM.look);
  camera.updateMatrixWorld();
  mouseToWorld(py);
  const t2 = performance.now(); updateEffects(); updateMagic3D(G.paused ? 0 : dt * (G.slowT > 0 ? G.slowF : 1)); pm('fx', t2);
  // découpe des arbres devant le héros
  _p.set(px, py + 1.0, pz).project(camera); U.uPS.value.set((_p.x + 1) / 2, (_p.y + 1) / 2); U.uPD.value = _p.z * 0.5 + 0.5; U.uOR.value = 0.12 * 15 / cd * (1 + 0.6 * sstep(1.0, 0.55, CAM.pitch));
  // heure : cycle jour/nuit continu (sauvegardé avec la partie) ; les zones sombres du jeu (grottes, ombres, donjons) assombrissent la lumière
  if (c.day && !G.paused && !G.dlg && !openUI()) HOUR = (HOUR + dt * DAY.speed) % 24;
  if (now - hourSave > 1000) { hourSave = now; if (G.flags) G.flags.h3d = Math.round(HOUR * 100) / 100; }
  const z = zoneOf(); darkS += (((z && z.dark) || 0) - darkS) * Math.min(1, dt * 2);
  const k = sstep(0.12, 0.6, darkS); let hEff = HOUR;
  if (k > 0 && HOUR >= 4.5 && HOUR < 21) hEff = lerp(HOUR, HOUR >= 12 ? 23 : 1, k);
  DAY.h = hEff;
  applyDay(px, 0, pz); updateRegion(dt, z, CAM.look, k); updateRegionDecor(dt, CAM.look); updateLights(k); updateWeather(dt, z, darkS);
  // profondeur : brume minimale qui fond l'horizon chargé, flou léger de l'arrière-plan (mise au point sur le héros)
  { const k = sstep(1.1, 0.5, CAM.pitch); if (scene.fog && scene.fog.density != null) { scene.fog.density = Math.max(scene.fog.density, 0.024 * k); FOGU.d.value = scene.fog.density; }
    if (POST.mat && POST.mat.uniforms.uDof) { POST.mat.uniforms.uDof.value = c.dof === false ? 0 : k; POST.mat.uniforms.uFocus.value = cd; } }
  updateGuide3D(dt, P, px, pz);
  const t3 = performance.now(); render3d(); pm('render', t3);
  pm('frame', now);
  // qualité automatique (mesurée en temps réel)
  fpsN++; fpsAcc += rdt; if (fpsAcc > 1.5) { PROF.fps = fpsN / fpsAcc; fpsN = 0; fpsAcc = 0; syncQual();
    if (STATE.auto) { if (PROF.fps < 26 && STATE.qual > 0) { STATE.qual--; resize3d(); setLights(); } else if (PROF.fps > 55 && STATE.qual < (MOBILE ? 1 : 2)) { STATE.qual++; resize3d(); setLights(); } } }
  if (cbar) cbar.classList.toggle('on', !!c.btns);
  if (info) info.textContent = 'Vélorne 3D · ' + (z ? z.name : '') + ' · ' + String(Math.floor(HOUR)).padStart(2, '0') + ' h ' + String(Math.floor(HOUR % 1 * 60)).padStart(2, '0');
};
B.extraOverlay = ctx => { drawBubbles(ctx); const h = window.fishHint && window.fishHint(); if (h) { const P = G.player, s = B.project(P.x, P.y, 2.1); if (s) { ctx.save(); ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(Math.round(s.x - 34), Math.round(s.y - 9), 68, 12); ctx.fillStyle = '#9fe3ff'; ctx.fillText('[' + actLabel('interact') + '] ' + h, Math.round(s.x), Math.round(s.y)); ctx.restore(); } } };
B.on = true;
window.V3D = { GUIDE: GUIDE3D, BRULIFE, BRU, MAGIC3D, THREE, scene, camera, renderer, CAM, ACT, PROF, STATE, DAY, hour: () => HOUR, setHour: h => { HOUR = h; } };
