// =====================================================================
//  VÉLORNE 3D — MOTEUR DE RENDU DU JEU
//  Dessine en 3D l'état du jeu (G, WORLD) : sol par blocs, décors, personnages en 8 directions, effets au sol et en volume,
//  caméra réglable (angle 24°–69°, rotation, distance), visée immersive, cycle jour/nuit, qualité automatique.
//  La logique reste entièrement celle du jeu (voir js3d/bridge2d.js).
// =====================================================================
import { THREE, scene, camera, renderer, STATE, U, time, DAY, applyDay, buildPost, resize as resize3d, render as render3d, MOBILE, FOGU, POST, COL, RES } from '../assets/demo/v4/core.js';
import { updateGuide3D, GUIDE3D } from './guide3d.js';
import { updateWorld, forceBuildAround, groundH } from './world3d.js';
import { MAP } from './kit3d.js';
import { BRU, updateBrumeval, brumevalLights, settleNpcs } from './brumeval3d.js';
import { startBrumevalLife, updateBrumevalLife, drawBubbles, BRULIFE } from './brumevalLife.js';
startBrumevalLife().catch(e => console.warn('brumeval vie', e));
import { VM, V as VIL, W2L } from '../assets/demo/v4/village.js';
import { updateMagic3D, MAGIC3D, flashLights } from './magic3d.js';
import { updateRegion, lavaLight } from './regions3d.js';
import { updateRegionDecor } from './regionDecor3d.js';

const B = B2D; const T = 32; // pixels par mètre
const m = v => v / T;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const angLerp = (a, b, k) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
RES.pix = [288, 352, 420]; // personnages et décor plus fins, toujours en pixel art
buildPost(); resize3d(); addEventListener('resize', resize3d);
STATE.pix = true;
DAY.speed = 24 / 480; // un jour complet en 8 minutes de jeu (comme le village pilote)

// ---------------- réglages 3D (conservés avec les paramètres du jeu) ----------------
// CAMÉRA OBLIQUE (24/11, direction visuelle « personnages 2D + monde 3D ») : derrière le héros et au-dessus de lui, inclinée
// vers le terrain (34° par défaut au lieu de 49°), plus proche (10,5 m), regard porté devant le héros pour voir le chemin et
// l'horizon, et qui se replace doucement derrière lui quand il avance. Les anciens réglages sont migrés une fois (v: 3).
const PMIN = 22 * Math.PI / 180, PMAX = 70 * Math.PI / 180, DMIN = 8, DMAX = 30, PDEF = 0.64, DDEF = 15;
const C3 = () => { if (!SET.c3d) SET.c3d = {}; const c = SET.c3d; if (c.v !== 4) { c.v = 4; c.pitch = PDEF; c.dist = DDEF; c.follow = false; } if (c.follow == null) c.follow = false; if (c.pitch == null) c.pitch = PDEF; if (c.yaw == null) c.yaw = 0; if (c.dist == null) c.dist = DDEF; if (c.slow == null) c.slow = true; if (c.day == null) c.day = true; if (c.btns == null) c.btns = true; if (c.wx == null) c.wx = true; if (c.stick == null) c.stick = true; return c; };
camera.fov = 30; camera.updateProjectionMatrix();
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
// ombre de contact douce sous chaque personnage (ancrage au sol, en plus de l'ombre portée du soleil)
const BLOB_G = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), BLOB_M = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.55, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); })();
const _lq = new THREE.Quaternion(), _fw = new THREE.Vector3();
function actor(o, kind) {
  let a = ACT.get(o); if (a) return a;
  const S = kind === 'enemy' && o.def && o.def.boss ? 288 : kind === 'drop' || kind === 'proj' ? 96 : 192;
  const c = document.createElement('canvas'); c.width = c.height = S; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  const mat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.4, side: THREE.DoubleSide, emissive: new THREE.Color(0.2, 0.2, 0.22), emissiveMap: tex });
  // VOLUME DES PERSONNAGES (refonte du 24/11) : le dessin reste du pixel art 2D, mais chaque pixel reçoit une orientation
  // calculée sur la carte graphique à partir de la silhouette (distance au bord dans 8 directions : le corps est bombé,
  // les bords tournés vers l'extérieur) et des nuances du dessin (relief fin des vêtements, cheveux, armes). Le soleil, le ciel
  // et les lumières du jeu éclairent donc un volume, avec un contre-jour sur le bord opposé à la caméra quand le soleil est derrière.
  if (kind !== 'proj' && kind !== 'drop') {
    mat.emissive.setRGB(0.1, 0.1, 0.11);
    mat.userData.tx = { value: 1 / S };
    mat.onBeforeCompile = sh => {
      sh.uniforms.uTx = mat.userData.tx;
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_pars_fragment>', '#include <map_pars_fragment>\nuniform float uTx; float gEdge = 0.0; vec2 gPQ = vec2(0.0);\nfloat lum3(vec2 u){ vec4 t = texture2D(map, u); return t.a < 0.4 ? 0.0 : dot(t.rgb, vec3(0.3, 0.59, 0.11)); }')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          vec2 pq = vec2(0.0); float ed = 0.0;
          for (int i = 0; i < 8; i++) { float an = float(i) * 0.7853982; vec2 d = vec2(cos(an), sin(an));
            for (int j = 0; j < 3; j++) { float r = j == 0 ? 1.5 : (j == 1 ? 3.0 : 5.5); float w = j == 0 ? 1.0 : (j == 1 ? 0.55 : 0.25);
              if (texture2D(map, vMapUv + d * r * uTx).a < 0.4) { pq += d * w; ed = max(ed, w); } } }
          pq *= 0.58;
          vec2 bm = vec2(lum3(vMapUv - vec2(uTx, 0.0)) - lum3(vMapUv + vec2(uTx, 0.0)), lum3(vMapUv - vec2(0.0, uTx)) - lum3(vMapUv + vec2(0.0, uTx)));
          gEdge = ed; gPQ = pq;
          normal = normalize(vec3(pq + bm * 0.9 + vec2(0.0, 0.12), 1.0));
        }`)
        .replace('#include <opaque_fragment>', `
        #if NUM_DIR_LIGHTS > 0
        { vec3 ld = directionalLights[0].direction; float rim = gEdge * max(0.0, dot(normalize(gPQ + 1e-4), normalize(ld.xy + 1e-4))) * (0.25 + 0.75 * clamp(-ld.z + 0.3, 0.0, 1.0));
          outgoingLight += directionalLights[0].color * diffuseColor.rgb * rim * 0.55; }
        #endif
        outgoingLight *= 1.0 - 0.14 * gEdge * (1.0 - max(0.0, normal.y)); // bords et dessous légèrement dans l'ombre : le corps paraît rond
        #include <opaque_fragment>`);
    };
    mat.customProgramCacheKey = () => 'actorVol3';
  }
  const foot = Math.round(S * 0.8); const g = new THREE.PlaneGeometry(m(S), m(S)); g.translate(0, m(S) / 2 - m(S - foot), 0);
  const mesh = new THREE.Mesh(g, mat); mesh.castShadow = kind !== 'proj' && kind !== 'drop'; mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.4 }); scene.add(mesh);
  let blob = null; if (kind === 'player' || kind === 'npc' || kind === 'enemy') { blob = new THREE.Mesh(BLOB_G, BLOB_M); blob.renderOrder = 1; scene.add(blob); }
  a = { o, kind, c, tex, mesh, blob, seen: 0, sig: '', n: 0, ph: Math.random() * 6.28, lx: o.x, ly: o.y, lean: 0, spd: 0 }; ACT.set(o, a); return a;
}
// signature d'image : on ne redessine un panneau que si ce qu'il montre a changé (PNJ, butin) ou à cadence réduite au loin
function sigOf(o, kind, d2) {
  if (kind === 'npc') return (o.moving ? 1 + Math.floor(o.t * 8) % 8 : 0) + ':' + B.sectorOf(o);
  if (kind === 'drop') return Math.floor(G.t * 6) + '';
  if (kind === 'enemy' && d2 > 110) return Math.floor(G.t * 15) + ''; // au-delà d'environ 10 m : 15 images par seconde suffisent
  return null; // toujours redessiné
}
let frameId = 0, LDT = 1 / 60;
const yawQ = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0);
function updateActors(px, pz) {
  frameId++; const near = o => Math.abs(m(o.x) - px) < 26 && Math.abs(m(o.y) - pz) < 22;
  const list = [[G.player, 'player']]; for (const e of G.enemies) if (near(e)) list.push([e, 'enemy']); for (const n of G.npcs) if (near(n) && !n.bru3d) list.push([n, 'npc']); for (const d of G.drops) if (near(d)) list.push([d, 'drop']); for (const p of G.projs) if (near(p)) list.push([p, 'proj']);
  yawQ.setFromAxisAngle(_up, CAM.yaw); let n = 0;
  for (const [o, kind] of list) {
    const a = actor(o, kind); a.seen = frameId; const ox = m(o.x), oz = m(o.y), d2 = (ox - px) ** 2 + (oz - pz) ** 2;
    const s = sigOf(o, kind, d2);
    if (s === null || s !== a.sig) { B.drawActor(a.c, kind, o); a.tex.needsUpdate = true; a.sig = s === null ? '' : s; n++; }
    const gy = groundH(ox, oz);
    if (a.blob) {
      // mouvement : vitesse lissée, rebond de pas, respiration au repos, légère inclinaison dans le sens de la marche (vu de la caméra)
      const ddx = o.x - a.lx, ddy = o.y - a.ly; a.lx = o.x; a.ly = o.y; const v = Math.min(8, Math.hypot(ddx, ddy) / T / Math.max(1e-3, LDT)); a.spd += (v - a.spd) * Math.min(1, LDT * 10);
      const mv = sstep(0.3, 1.5, a.spd), t = G.t || 0; a.ph += LDT * (2.2 + a.spd * 2.2);
      const scrX = (ddx / T) * Math.cos(CAM.yaw) - (ddy / T) * Math.sin(CAM.yaw); a.lean += ((Math.abs(scrX) > 1e-4 ? -Math.sign(scrX) * 0.05 * mv : 0) - a.lean) * Math.min(1, LDT * 8);
      const bob = Math.abs(Math.sin(a.ph * 1.0)) * 0.05 * mv, breath = (1 - mv) * Math.sin(t * 2.3 + a.ph * 0.0) * 0.012;
      a.mesh.position.set(ox, gy + bob, oz); a.mesh.scale.set(1 - breath * 0.5, 1 + breath, 1);
      _lq.setFromAxisAngle(_fw.set(0, 0, 1), a.lean); a.mesh.quaternion.copy(yawQ).multiply(_lq);
      const big = kind === 'enemy' && o.def && o.def.boss ? 2.2 : 1; a.blob.position.set(ox, gy + 0.03, oz); a.blob.scale.set(1.15 * big * (1 - bob * 2), 1, 0.7 * big * (1 - bob * 2)); a.blob.visible = o.state !== 'dead' && !o.dead;
    } else { a.mesh.position.set(ox, gy + (kind === 'proj' ? 0.6 : 0), oz); a.mesh.quaternion.copy(yawQ); }
    a.mesh.visible = true;
  }
  PROF.nAct = n;
  for (const g of G.npcs) if (g.glow3d && near(g) && Math.random() < 0.5) MAGIC3D.emit('amb', m(g.x) + (Math.random() - 0.5) * 0.4, groundH(m(g.x), m(g.y)) + 0.3, m(g.y) + (Math.random() - 0.5) * 0.4, { S: { g: -1.2, sp: 0.4, sz: 0.12, life: 1.2, col2: '#ffe08a', flick: 1 }, col: g.glow3d });
  for (const [o, a] of ACT) if (a.seen !== frameId) { if (a.blob) scene.remove(a.blob); scene.remove(a.mesh); a.tex.dispose(); a.mesh.material.dispose(); a.mesh.geometry.dispose(); ACT.delete(o); }
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
  if (k === 'l') B.cam3d.rot(-Math.PI / 4); if (k === 'r') B.cam3d.rot(Math.PI / 4); if (k === 'u') B.cam3d.tilt(0.1); if (k === 'd') B.cam3d.tilt(-0.1); if (k === 'zi') B.cam3d.zoom(-1.5); if (k === 'zo') B.cam3d.zoom(1.5); if (k === 'c') B.cam3d.recenter(); });
// ---------------- double joystick tactile (directive du 24/11) ----------------
// Stick gauche : déplacement (jeu d'origine). Stick droit : toucher n'importe où dans la moitié droite, hors bouton, puis glisser :
// rotation libre à 360° (horizontal) et inclinaison (vertical), vitesse proportionnelle à la poussée, comme le stick de caméra du
// village pilote mais en joystick. Deux doigts écartés ou rapprochés dans la moitié droite : zoom. Boutons + − ◎ (recentrer).
const CS = { on: false, id: null, ox: 0, oy: 0, x: 0, y: 0, pinch: null };
const csBase = document.createElement('div'); csBase.id = 'camstick'; const csKnob = document.createElement('div'); csBase.appendChild(csKnob); document.body.appendChild(csBase);
B.cam3d.zoom = d => { CAM.distT = clamp(CAM.distT + d, DMIN, DMAX); C3().dist = CAM.distT; markSet(); };
B.cam3d.recenter = () => { const P = G.player; if (!P) return; const v = DIRV[P.dir] || [0, 1], a = Math.atan2(v[1], v[0]), want = Math.atan2(-Math.cos(a), -Math.sin(a));
  let d = (want - CAM.yawT) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; CAM.yawT += d; CAM.pitchT = PDEF; CAM.distT = DDEF; const c = C3(); c.yaw = CAM.yawT; c.pitch = PDEF; c.dist = DDEF; CAM.manualT = 0; markSet(); };
B.CAMSTICK = CS;
{ const tb = document.getElementById('touch'), isBtn = t => { const el = document.elementFromPoint(t.clientX, t.clientY); return !!(el && el.closest && el.closest('.tbtn,#cam3d')); };
  const freeRight = e => [...e.touches].filter(t => t.clientX >= innerWidth * 0.5 && !isBtn(t) && !(TOUCH.stick.on && t.identifier === TOUCH.stick.id));
  if (tb) {
    tb.addEventListener('touchstart', e => { if (G.mode !== 'play' || TOUCH.edit || C3().stick === false) return;
      const fr = freeRight(e);
      if (fr.length >= 2) { CS.on = false; csBase.style.display = 'none'; CS.pinch = { a: fr[0].identifier, b: fr[1].identifier, d: Math.hypot(fr[0].clientX - fr[1].clientX, fr[0].clientY - fr[1].clientY), d0: CAM.distT }; return; }
      for (const t of e.changedTouches) if (!CS.on && t.clientX >= innerWidth * 0.5 && !isBtn(t)) {
        Object.assign(CS, { on: true, id: t.identifier, ox: t.clientX, oy: t.clientY, x: 0, y: 0 }); csBase.style.display = 'block'; csBase.style.left = (t.clientX - 50) + 'px'; csBase.style.top = (t.clientY - 50) + 'px'; csKnob.style.transform = 'translate(0px,0px)'; } }, { passive: true });
    tb.addEventListener('touchmove', e => {
      if (CS.pinch) { const A = [...e.touches].find(t => t.identifier === CS.pinch.a), Bt = [...e.touches].find(t => t.identifier === CS.pinch.b);
        if (A && Bt) { const d = Math.hypot(A.clientX - Bt.clientX, A.clientY - Bt.clientY); CAM.distT = clamp(CS.pinch.d0 * CS.pinch.d / Math.max(20, d), DMIN, DMAX); C3().dist = CAM.distT; markSet(); } return; }
      for (const t of e.changedTouches) if (CS.on && t.identifier === CS.id) { let dx = t.clientX - CS.ox, dy = t.clientY - CS.oy; const mm = Math.hypot(dx, dy), R = 44;
        if (mm > R) { dx *= R / mm; dy *= R / mm; } CS.x = mm < 5 ? 0 : dx / R; CS.y = mm < 5 ? 0 : dy / R; csKnob.style.transform = `translate(${dx}px,${dy}px)`; } }, { passive: true });
    const end = e => { for (const t of e.changedTouches) { if (CS.on && t.identifier === CS.id) { CS.on = false; CS.x = CS.y = 0; csBase.style.display = 'none'; }
      if (CS.pinch && (t.identifier === CS.pinch.a || t.identifier === CS.pinch.b)) CS.pinch = null; } };
    tb.addEventListener('touchend', end, { passive: true }); tb.addEventListener('touchcancel', end, { passive: true });
  }
}
// mouvement continu, adouci (courbe quadratique : précis au centre, rapide en bout de course)
function updateCamStick(dt) {
  if (C3().padCam && PAD.active && !openUI() && G.mode === 'play') { const k = v => Math.sign(v) * v * v; if (PAD.rx) B.cam3d.rot(k(PAD.rx) * dt * 2.8); if (PAD.ry) B.cam3d.tilt(-k(PAD.ry) * dt * 1.2); }
  if (!CS.on || openUI() || G.mode !== 'play') { if (CS.on && G.mode !== 'play') { CS.on = false; csBase.style.display = 'none'; } return; }
  const k = v => Math.sign(v) * v * v; if (CS.x) B.cam3d.rot(k(CS.x) * dt * 3.0); if (CS.y) B.cam3d.tilt(k(CS.y) * dt * 1.3);
}
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
    for (let t = 1.4; t < best; t += 0.35) { const x = lx + dx * t, y = ly + dy * t, z = lz + dz * t; const X = x - BRU.OX, Z = z - BRU.OZ;
      // volume complet des maisons (murs + toit) : la caméra haute ne se retrouve jamais dans un bâtiment
      if (VIL.buildings.some(b => { if (Math.abs(b.x - X) > 12 || Math.abs(b.z - Z) > 12) return false; const [u, v] = W2L(b, X, Z); return Math.abs(u) < b.w / 2 + 0.6 && Math.abs(v) < b.d / 2 + 0.6 && y < (b.fy || 0) + b.h + Math.min(b.w, b.d) * 0.62 + 0.6; })) { best = Math.max(9, t - 0.6); break; } // jamais plus près que 9 m : le reste du mur est fondu
      if (y - groundH(x, z) > 6.2) continue;
      if (walls.some(s => Math.abs((s.ax + s.bx) / 2 - X) < 9 && Math.abs((s.az + s.bz) / 2 - Z) < 9 && sd(X, Z, s) < 0.32)) { best = Math.max(9, t - 0.5); break; } }
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
  updateCamStick(dt);
  if (!openUI()) { if (IN.held.camL) B.cam3d.rot(-dt * 1.7); if (IN.held.camR) B.cam3d.rot(dt * 1.7); if (IN.held.camU) B.cam3d.tilt(dt * 0.7); if (IN.held.camD) B.cam3d.tilt(-dt * 0.7); }
  if (setDirty && now - setDirty > 800) { setDirty = 0; saveSet(); }
  const t0 = performance.now();
  updateWorld(px - Math.sin(CAM.yaw) * 12, pz - Math.cos(CAM.yaw) * 12, time.value); updateBrumeval(dt, P, CAM.look); updateBrumevalLife(dt, CAM.yaw); if ((frameId & 31) === 0) settleNpcs(); pm('world', t0);
  const t1 = performance.now(); LDT = Math.max(1e-3, Math.min(0.1, dt)); updateActors(px, pz); pm('actors', t1);
  updateAim(dt, rdt);
  // ---------------- caméra (24/11, refonte) ----------------
  // Style « HD-2D » : focale longue (30°), caméra haute et éloignée, donc pas de déformation des premiers plans, et le décor
  // garde sa profondeur sans boucher la vue. Tous les mouvements passent par des ressorts amortis (aucun à-coup, aucune
  // oscillation, indépendants du nombre d'images par seconde). Le regard se porte doucement dans le sens de la marche.
  // La caméra ne tourne plus d'elle-même (option « derrière le héros » toujours disponible), ne descend jamais sous le relief
  // et se rapproche devant les maisons.
  const SD = CAM.sd || (CAM.sd = { lx: 0, lz: 0, vx: 0, vz: 0, ax: 0, az: 0, avx: 0, avz: 0, py: null, pyv: 0, yv: 0, pv: 0, dv: 0, init: false });
  const damp = (x, t, v, k, dt) => { const w = 2 / k, e = w * dt, f = 1 / (1 + e + 0.48 * e * e + 0.235 * e * e * e), ch = x - t, tmp = (v + w * ch) * dt; const nv = (v - w * tmp) * f; return [t + (ch + tmp) * f, nv]; };
  const vx = (px - (CAM.ppx ?? px)) / Math.max(1e-3, dt), vz = (pz - (CAM.ppz ?? pz)) / Math.max(1e-3, dt); CAM.ppx = px; CAM.ppz = pz; const sp = Math.hypot(vx, vz);
  if (c.follow === true && sp > 1.2 && sp < 40 && CAM.aimK < 0.1 && !openUI() && !BRU.insideNow() && now - (CAM.manualT || 0) > 2500) {
    const a = Math.atan2(vz, vx), want = Math.atan2(-Math.cos(a), -Math.sin(a)); let d = (want - CAM.yawT) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
    const rate = 0.9 * Math.max(0, 1 - Math.abs(d) / 1.9) * Math.min(1, sp / 4); CAM.yawT += Math.sign(d) * Math.min(Math.abs(d), rate * dt); }
  { let d = (CAM.yawT - CAM.yaw) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; const r = damp(0, d, SD.yv, 0.16, dt); CAM.yaw += d - r[0]; SD.yv = r[1]; } B.yaw = CAM.yaw;
  const inB = !!BRU.insideNow();
  { const r = damp(CAM.pitch, inB ? Math.max(CAM.pitchT, 0.95) : CAM.pitchT, SD.pv, 0.2, dt); CAM.pitch = r[0]; SD.pv = r[1]; }
  const portrait = innerHeight > innerWidth ? 1.45 : 1;
  { const r = damp(CAM.dist, (inB ? Math.min(CAM.distT, 11) : CAM.distT) * portrait * (1 - 0.18 * CAM.aimK), SD.dv, 0.28, dt); CAM.dist = r[0]; SD.dv = r[1]; }
  const sh = G.shake && SET.shake !== false ? G.shake * 0.02 : 0, py = groundH(px, pz);
  // regard porté dans le sens de la marche (vitesse lissée), plafonné, nul en intérieur et pendant la visée
  const tAx = inB || sp > 40 ? 0 : clamp(vx * 0.32, -2.2, 2.2) * (1 - CAM.aimK), tAz = inB || sp > 40 ? 0 : clamp(vz * 0.32, -2.2, 2.2) * (1 - CAM.aimK);
  { let r = damp(SD.ax, tAx, SD.avx, 0.55, dt); SD.ax = r[0]; SD.avx = r[1]; r = damp(SD.az, tAz, SD.avz, 0.55, dt); SD.az = r[0]; SD.avz = r[1]; }
  const off = 2.2 * CAM.aimK, tx = px + Math.cos(CAM.aimA) * off + SD.ax, tz = pz + Math.sin(CAM.aimA) * off + SD.az;
  if (!SD.init || Math.hypot(tx - SD.lx, tz - SD.lz) > 25) { SD.lx = tx; SD.lz = tz; SD.vx = SD.vz = 0; SD.py = py; SD.init = true; } // téléportation : pas de long travelling
  { let r = damp(SD.lx, tx, SD.vx, 0.12, dt); SD.lx = r[0]; SD.vx = r[1]; r = damp(SD.lz, tz, SD.vz, 0.12, dt); SD.lz = r[0]; SD.vz = r[1]; r = damp(SD.py, py, SD.pyv, 0.3, dt); SD.py = r[0]; SD.pyv = r[1]; }
  CAM.look.set(SD.lx, SD.py + 0.9, SD.lz);
  const lim = camLimit(CAM.look.x, CAM.look.y, CAM.look.z, CAM.yaw, CAM.pitch, CAM.dist); CAM.lim = lerp(CAM.lim || lim, lim, Math.min(1, dt * (lim < (CAM.lim || lim) ? 10 : 2)));
  const cd = Math.min(CAM.dist, CAM.lim), hd = Math.cos(CAM.pitch) * cd;
  let cx = CAM.look.x + Math.sin(CAM.yaw) * hd, cz = CAM.look.z + Math.cos(CAM.yaw) * hd, cy = CAM.look.y + Math.sin(CAM.pitch) * cd;
  cy = Math.max(cy, groundH(cx, cz) + 1.6); // jamais sous une colline
  const shx = sh ? (Math.sin(now * 0.09) + Math.sin(now * 0.053)) * 0.5 * sh : 0, shy = sh ? Math.sin(now * 0.071) * 0.5 * sh : 0;
  camera.position.set(cx + shx, cy + shy, cz); camera.lookAt(CAM.look);
  camera.updateMatrixWorld();
  mouseToWorld(py);
  const t2 = performance.now(); updateEffects(); updateMagic3D(G.paused ? 0 : dt * (G.slowT > 0 ? G.slowF : 1)); pm('fx', t2);
  // découpe des arbres devant le héros
  _p.set(px, py + 1.0, pz).project(camera); U.uPS.value.set((_p.x + 1) / 2, (_p.y + 1) / 2); U.uPD.value = _p.z * 0.5 + 0.5; U.uCutSoft.value = 1; U.uOR.value = 1.5; U.uNearF.value = 4.2; U.uHV.value.set(px, py + 0.9, pz).applyMatrix4(camera.matrixWorldInverse); // tunnel : 4,2 m de rayon côté caméra, 1,5 m au héros // premiers plans proches de la caméra fondus
  // heure : cycle jour/nuit continu (sauvegardé avec la partie) ; les zones sombres du jeu (grottes, ombres, donjons) assombrissent la lumière
  if (c.day && !G.paused && !G.dlg && !openUI()) HOUR = (HOUR + dt * DAY.speed) % 24;
  if (now - hourSave > 1000) { hourSave = now; if (G.flags) G.flags.h3d = Math.round(HOUR * 100) / 100; }
  const z = zoneOf(); darkS += (((z && z.dark) || 0) - darkS) * Math.min(1, dt * 2);
  const k = sstep(0.12, 0.6, darkS); let hEff = HOUR;
  if (k > 0 && HOUR >= 4.5 && HOUR < 21) hEff = lerp(HOUR, HOUR >= 12 ? 23 : 1, k);
  DAY.h = hEff;
  applyDay(px, 0, pz); updateRegion(dt, z, CAM.look, k); updateRegionDecor(dt, CAM.look); updateLights(k); updateWeather(dt, z, darkS);
  // profondeur : brume minimale qui fond l'horizon chargé, flou léger de l'arrière-plan (mise au point sur le héros)
  if (POST.mat && POST.mat.uniforms.uDof) { POST.mat.uniforms.uDof.value = c.dof === false ? 0 : 0.55; POST.mat.uniforms.uFocus.value = cd + 8; }
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
// ---------------- ÉCRAN TITRE CINÉMATIQUE (24/11) ----------------
// Derrière le menu : le vrai monde 3D du jeu, Brumeval à l'heure dorée, filmé par un lent travelling circulaire autour de la
// place (fontaine, maisons, étals), avec lucioles et braises. Aucune partie n'est lancée : seul le décor est rendu.
const TT = { t: 0, built: false, look: new THREE.Vector3() };
B.title3d = function () {
  const now = performance.now(), dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; time.value += dt; TT.t += dt;
  const cx = BRU.OX + 1, cz = BRU.OZ + 2;
  if (!TT.built) { TT.built = true; forceBuildAround(cx, cz); }
  const yaw = 0.6 + TT.t * 0.04, pitch = 0.5 + Math.sin(TT.t * 0.07) * 0.04, dist = 27 + Math.sin(TT.t * 0.05) * 2.5;
  const gy = groundH(cx, cz); TT.look.set(cx + Math.sin(TT.t * 0.11) * 1.5, gy + 2.2, cz + Math.cos(TT.t * 0.09) * 1.5);
  updateWorld(cx - Math.sin(yaw) * 10, cz - Math.cos(yaw) * 10, time.value);
  try { updateBrumeval(dt, { x: (cx + 40) * T, y: cz * T }, TT.look); } catch (e) { }
  const hd = Math.cos(pitch) * dist; camera.position.set(TT.look.x + Math.sin(yaw) * hd, TT.look.y + Math.sin(pitch) * dist, TT.look.z + Math.cos(yaw) * hd);
  camera.position.y = Math.max(camera.position.y, groundH(camera.position.x, camera.position.z) + 2); camera.lookAt(TT.look); camera.updateMatrixWorld();
  DAY.h = 17.5 + Math.sin(TT.t * 0.03) * 0.2; applyDay(cx, 0, cz);
  const z = WORLD.zones.find(z => z.id === 'village') || WORLD.zones[0]; try { updateRegion(dt, z, TT.look, 0); updateRegionDecor(dt, TT.look); } catch (e) { }
  VM.glass.emissiveIntensity = 0.9; for (const l of PL) l.intensity = 0;
  // lucioles et braises dorées
  if (Math.random() < 0.6) MAGIC3D.emit('amb', TT.look.x + (Math.random() - 0.5) * 22, gy + 0.4 + Math.random() * 2.5, TT.look.z + (Math.random() - 0.5) * 22, { S: { g: -0.25, sp: 0.35, sz: 0.1, life: 3.5, col2: '#fff2b0', flick: 1 }, col: '#ffd36a' });
  updateMagic3D(dt);
  // tunnel de visibilité vers la place : aucun toit ni feuillage ne bouche le plan
  U.uCutSoft.value = 1; U.uOR.value = 4; U.uNearF.value = 7; U.uHV.value.copy(TT.look).applyMatrix4(camera.matrixWorldInverse);
  if (POST.mat && POST.mat.uniforms.uDof) { POST.mat.uniforms.uDof.value = 0.7; POST.mat.uniforms.uFocus.value = dist + 6; }
  render3d();
};
B.on = true;
window.V3D = { GUIDE: GUIDE3D, BRULIFE, BRU, MAGIC3D, THREE, scene, camera, renderer, CAM, ACT, PROF, STATE, DAY, hour: () => HOUR, setHour: h => { HOUR = h; } };
