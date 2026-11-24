// =====================================================================
//  VÉLORNE v4 · PROGRAMME PRINCIPAL : village pilote, joueur, caméra, interactions, secrets, évolution, sauvegarde propre à la démo
//  Clé de sauvegarde : « velorne_demo_v4 » (distincte de toute sauvegarde du jeu, qui n'est jamais lue ni écrite)
// =====================================================================
import { THREE, rnd, lerp, clamp, angLerp, smooth, scene, camera, renderer, view, STATE, U, time, DAY, applyDay, buildTerrain, buildWater, buildPost, resize, render, POST,
  walkH, heightAt, blocked, slopeOk, COL, POND, inCave, CAVE, MOBILE, skyU } from './core.js';
import { buildNature, singleTree, NATURE, updateLod } from './nature.js';
import { buildVillage, V, VM, L2W, W2L } from './village.js';
import { loadSheets, Sprite8, Critter, CAMI, sectorOf, buildGrid, regrid, findPath, walkableAt, NPCS, Npc, updateNpcs, GRID } from './life.js';
import { SECRETS, LEVELS, TEXT, CHAT, talk, VILLAGE_NAME } from './story.js';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'velorne_demo_v4';
const S = { found: {}, items: {}, flags: {}, story: {}, repair: 0, repairAt: 0, fete: 0, day: 1, h: 8.5, px: 0.6, pz: 9.5 };
try { const raw = localStorage.getItem(SAVE_KEY); if (raw) Object.assign(S, JSON.parse(raw)); } catch (e) { }
function save() { S.h = DAY.h; S.px = P.x; S.pz = P.z; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
DAY.h = S.h;

// ---------------- construction ----------------
const t0 = performance.now();
buildPost(); const terrain = buildTerrain(); const water = buildWater();
buildVillage(water.mat);
buildNature(V.reserved);
singleTree(V.oak.x, V.oak.z, 1.15, 0.4);
resize(); addEventListener('resize', resize);
const buildMs = Math.round(performance.now() - t0);

// ---------------- personnages ----------------
const SHEETS = ['hero_walk', 'hero_idle', 'npc_elder_walk', 'npc_merchant_walk', 'npc_guard_walk', 'npc_guard_slash', 'npc_alchemist_walk', 'npc_smith_walk', 'npc_artisan_walk', 'npc_relic_walk', 'npc_runemaster_walk'];
// points supplémentaires
const POI = V.pois;
for (const d of V.doors) if (!d.fake) POI[d.b.id + '_porte'] = { id: d.b.id + '_porte', x: d.out.x, z: d.out.z, face: null };
Object.assign(POI, { lisiere: { x: -24.5, z: -21.5, face: null }, cascade: { x: -11.2, z: -23.8, face: null }, place_c: { x: 0, z: 4.2, face: Math.PI } });
const PATROL = ['place_n', 'chapelle_porte', 'place_e', 'pont', 'place_s', 'edran_porte', 'place_o', 'liora_porte'];

const NPC_DEFS = [
  { id: 'edran', name: 'Édran', title: "l'archiviste", sheet: 'npc_elder_walk', home: 'edran', start: [-8, 7], speed: 1.0,
    sched: [[0, 'edran_lit', 'sleep'], [7, 'edran_bureau', 'work'], [11, 'banc_chene', 'sit'], [13, 'aub_t1', 'sit'], [14.5, 'edran_bureau', 'work'], [17, 'fontaine_0', 'chat'], [19, 'aub_t1', 'sit'], [21.5, 'edran_lit', 'sleep']] },
  { id: 'maelys', name: 'Maëlle', title: 'la marchande', sheet: 'npc_merchant_walk', home: 'echoppe', start: [6, 4],
    sched: [[0, 'echoppe_lit', 'sleep'], [7, 'etal_maelle', 'work'], [12, 'aub_t2', 'sit'], [13.5, 'etal_maelle', 'work'], [17.5, 'echoppe_comptoir', 'work'], [19, 'fontaine_1', 'chat'], [21, 'echoppe_lit', 'sleep']] },
  { id: 'borin', name: 'Borin', title: 'le forgeron', sheet: 'npc_smith_walk', home: 'auberge', start: [8, -5],
    sched: [[0, 'aub_lit', 'sleep'], [6.5, 'forge_enclume', 'work'], [12, 'aub_t3', 'sit'], [13, 'forge_enclume', 'work'], [18, 'aub_t3', 'sit'], [22, 'aub_lit', 'sleep']] },
  { id: 'hugues', name: 'Hugues', title: 'le garde', sheet: 'npc_guard_walk', slash: 'npc_guard_slash', home: null, start: [2, -6], speed: 1.25,
    sched: [[0, 'pont', 'guard'], [6, 'place_n', 'work'], [7, 'place_n', 'patrol', PATROL], [12, 'aub_t4', 'sit'], [13, 'place_n', 'patrol', PATROL], [19, 'fontaine_2', 'chat'], [20.5, 'pont', 'guard']] },
  { id: 'liora', name: 'Liora', title: "l'herboriste", sheet: 'npc_alchemist_walk', home: 'liora', start: [-15, -4],
    sched: [[0, 'liora_lit', 'sleep'], [6, 'lisiere', 'gather', 3.5], [9, 'potager', 'gather', 1.2], [11, 'liora_table', 'work'], [13.5, 'aub_t2', 'sit'], [14.5, 'cascade', 'gather', 2.2], [16.5, 'liora_table', 'work'], [18.5, 'chap_banc', 'sit'], [19.5, 'fontaine_3', 'chat'], [21, 'liora_lit', 'sleep']] },
  { id: 'torven', name: 'Torven', title: 'le bûcheron', sheet: 'npc_artisan_walk', home: 'auberge', start: [-15, 1],
    sched: [[0, 'aub_lit', 'sleep'], [7, 'torven_etabli', 'work'], [12, 'aub_feu', 'sit'], [13, 'torven_etabli', 'work'], [17, 'place_e', 'chat'], [18, 'aub_feu', 'sit'], [21.5, 'aub_lit', 'sleep']] },
  { id: 'gwenna', name: 'Gwenna', title: "l'aubergiste", sheet: 'npc_relic_walk', home: 'auberge', start: [-8, -5],
    sched: [[0, 'aub_lit', 'sleep'], [6.5, 'aub_comptoir', 'work'], [23, 'aub_lit', 'sleep']] },
  { id: 'anselme', name: 'Frère Anselme', title: 'le chapelain', sheet: 'npc_runemaster_walk', home: 'chapelle', start: [0, -12], speed: 1.0,
    sched: [[0, 'chap_autel', 'sleep'], [6, 'chap_autel', 'pray'], [9, 'place_c', 'wander', 3], [11, 'chap_autel', 'pray'], [13.5, 'banc_chene2', 'sit'], [16, 'chap_autel', 'pray'], [19, 'place_o', 'chat'], [21, 'chap_autel', 'sleep']] }
];
// routines modifiées par l'évolution du village
function schedFor(d) {
  let s = d.sched;
  if (d.id === 'torven' && S.repair >= 1 && S.repair < 2) s = s.map(e => e[2] === 'work' ? [e[0], 'ab_atelier', 'work'] : e);
  if (S.fete) s = s.map(e => (e[0] >= 17 && e[0] < 21 && e[2] !== 'sleep' && d.id !== 'gwenna') ? [e[0], ['fontaine_0', 'fontaine_1', 'fontaine_2', 'fontaine_3', 'place_e', 'place_o', 'place_c', 'place_s'][NPC_DEFS.indexOf(d)], 'chat'] : e);
  return s;
}

// ---------------- joueur ----------------
const P = { x: S.px, z: S.pz, face: Math.PI, walkT: 0, moving: false, y: 0, r: 0.3, inside: null };
let hero;
const CAM = { yaw: 0, yawT: 0, dist: 14, distT: 14, pitch: 0.78, pitchT: 0.78, look: new THREE.Vector3() };
const PITCH_MIN = 0.45, PITCH_MAX = 1.25;

// ---------------- animaux ----------------
const CRIT = [];
function setupAnimals() {
  // poules dans le poulailler
  for (let i = 0; i < 6; i++) CRIT.push(new Critter('poule', { x: lerp(V.coop.x0, V.coop.x1, rnd()), z: lerp(V.coop.z0, V.coop.z1, rnd()), area: V.coop, beh: 'peck', tint: i % 3 === 0 ? '#c8905a' : null, speed: 0.9 }));
  // moutons dans l'enclos
  for (let i = 0; i < 5; i++) CRIT.push(new Critter('mouton', { x: lerp(V.pen.x0 + 1, V.pen.x1 - 1, rnd()), z: lerp(V.pen.z0 + 1, V.pen.z1 - 1, rnd()), area: V.pen, beh: 'graze', speed: 0.55, scale: 0.9 + rnd() * 0.25, tint: i === 3 ? '#8a8078' : null }));
  // cheval à l'écurie
  { const p = POI.ecurie_box; CRIT.push(new Critter('cheval', { x: p.x, z: p.z, beh: 'horse', home: p })); }
  // canards sur le bassin
  for (let i = 0; i < 3; i++) CRIT.push(new Critter('canard', { beh: 'duck', ang: i * 0.5, rad: 2.2, speed: 0.25, swim: true, tint: i === 2 ? '#e0d8c8' : null }));
  // oiseaux sur la place
  for (let i = 0; i < 7; i++) { const a = rnd() * 6.28, r = 3.6 + rnd() * 2.8; CRIT.push(new Critter('oiseau', { x: Math.cos(a) * r, z: Math.sin(a) * r, beh: 'bird', hx: Math.cos(a) * r, hz: Math.sin(a) * r })); }
  // Mousse, le chat de l'auberge ; Pataud, le chien du garde
  const ad = V.doors.find(d => d.b.id === 'auberge'); const [cx, cz] = L2W(ad.b, 2.4, ad.b.d / 2 + 0.9);
  CRIT.push(Object.assign(new Critter('chat', { x: cx, z: cz, beh: 'cat', home: { x: cx, z: cz }, speed: 1.1, tint: '#ffffff' }), { id: 'mousse' }));
  CRIT.push(Object.assign(new Critter('chien', { x: 2, z: -4, beh: 'dog', speed: 2.4 }), { id: 'pataud' }));
  // le renard blanc (la nuit seulement)
  CRIT.push(Object.assign(new Critter('renard', { x: 39, z: 1.5, beh: 'fox', speed: 3.4, wp: [[39, 1.5], [43.5, 5.5], [42.5, 10.5], [41.5, 13.7]], wi: 0 }), { id: 'renard' }));
}
const crit = id => CRIT.find(c => c.id === id);
function inArea(a, x, z) { return x > a.x0 && x < a.x1 && z > a.z0 && z < a.z1; }
function updateCritters(dt) {
  const night = DAY.cur ? DAY.cur.night : 0;
  for (const c of CRIT) {
    c.t += dt; c.st -= dt; let moving = false; const pd = Math.hypot(P.x - c.x, P.z - c.z);
    const step = (tx, tz, sp) => { const dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz); if (d < 0.05) { c.vx = c.vz = 0; return true; } const s = Math.min(d, sp * dt); const nx = c.x + dx / d * s, nz = c.z + dz / d * s; c.vx = dx / d; c.vz = dz / d; c.x = nx; c.z = nz; moving = true; return false; };
    switch (c.beh) {
      case 'peck': case 'graze': {
        if (pd < 2.2 && c.beh === 'peck') { const a = Math.atan2(c.x - P.x, c.z - P.z); c.tx = clamp(c.x + Math.sin(a) * 1.5, c.area.x0 + 0.3, c.area.x1 - 0.3); c.tz = clamp(c.z + Math.cos(a) * 1.5, c.area.z0 + 0.3, c.area.z1 - 0.3); c.state = 'walk'; c.st = 1; }
        if (c.st <= 0) { if (c.state === 'walk' || rnd() < 0.4) { c.state = 'eat'; c.st = 1.5 + rnd() * 3; } else { c.state = 'walk'; c.st = 4; c.tx = clamp(c.x + (rnd() - 0.5) * 3, c.area.x0 + 0.3, c.area.x1 - 0.3); c.tz = clamp(c.z + (rnd() - 0.5) * 3, c.area.z0 + 0.3, c.area.z1 - 0.3); }
          if (c.beh === 'graze' && rnd() < 0.08) c.bubble = { t: 'Bêê…', d: 2 }; if (c.beh === 'peck' && rnd() < 0.05) c.bubble = { t: 'Cot !', d: 1.5 }; }
        if (c.state === 'walk') { if (step(c.tx, c.tz, c.speed)) c.st = 0; c.setFrame(Math.floor(c.t * 6) % 2); } else { c.vx = c.vz = 0; c.setFrame(Math.floor(c.t * (c.beh === 'peck' ? 3 : 0.8)) % 2 ? 2 : 0); }
        break; }
      case 'horse': { c.setFrame(Math.floor(c.t * 0.7) % 2); if (c.st <= 0) { c.st = 5 + rnd() * 6; c.tx = c.home.x + (rnd() - 0.5) * 1.2; c.tz = c.home.z + (rnd() - 0.5) * 0.6; } step(c.tx ?? c.x, c.tz ?? c.z, 0.4); break; }
      case 'duck': { c.ang += dt * c.speed * (1 + Math.sin(c.t * 0.3) * 0.3); const r = c.rad + Math.sin(c.t * 0.21) * 0.6; const nx = POND.x + Math.cos(c.ang) * r, nz = POND.z + Math.sin(c.ang) * r * 0.85; c.vx = nx - c.x; c.vz = nz - c.z; c.x = nx; c.z = nz; c.setFrame(Math.floor(c.t * 2) % 2); c.y = -0.68; c.show(!inCave(P.x, P.z) || true); c.draw(); continue; }
      case 'bird': {
        if (c.state === 'fly') { c.fly += dt * 3.5; step(c.fx, c.fz, 5); c.setFrame(2); if (c.st <= 0) { c.state = 'back'; } }
        else if (c.state === 'back') { c.fly = Math.max(0, c.fly - dt * 2.5); if (step(c.hx, c.hz, 4) && c.fly <= 0) c.state = 'idle'; c.setFrame(2); }
        else { c.fly = 0; if (pd < 3.2) { c.state = 'fly'; c.st = 10 + rnd() * 8; const a = Math.atan2(c.x - P.x, c.z - P.z) + (rnd() - 0.5); c.fx = c.x + Math.sin(a) * 25; c.fz = c.z + Math.cos(a) * 25; }
          else { if (c.st <= 0) { c.st = 0.6 + rnd() * 1.6; c.hop = rnd() < 0.5; c.tx = c.x + (rnd() - 0.5) * 0.8; c.tz = c.z + (rnd() - 0.5) * 0.8; } if (c.hop) step(c.tx, c.tz, 0.8); c.setFrame(Math.floor(c.t * 4) % 2); } }
        break; }
      case 'cat': {
        const day = DAY.h > 8 && DAY.h < 19;
        if (c.follow > 0) { c.follow -= dt; const d = pd; if (d > 1.6) { step(P.x - Math.sin(P.face) * 1.0, P.z - Math.cos(P.face) * 1.0, Math.min(3.2, 1 + d)); c.setFrame(Math.floor(c.t * 8) % 2); } else c.setFrame(3); }
        else if (day) { if (Math.hypot(c.x - c.home.x, c.z - c.home.z) > 0.2) { step(c.home.x, c.home.z, c.speed); c.setFrame(Math.floor(c.t * 7) % 2); } else c.setFrame(2); }
        else { if (c.st <= 0) { c.st = 4 + rnd() * 6; const a = rnd() * 6.28, r = 2 + rnd() * 6; const x = c.home.x + Math.cos(a) * r, z = c.home.z + Math.sin(a) * r; if (walkableAt(x, z)) { c.tx = x; c.tz = z; } } if (c.tx != null && !step(c.tx, c.tz, c.speed)) c.setFrame(Math.floor(c.t * 7) % 2); else c.setFrame(3); }
        break; }
      case 'dog': {
        const g = NPCS.find(n => n.id === 'hugues'); if (!g) break; const tx = g.x - Math.sin(g.face) * 1.3 + 0.6, tz = g.z - Math.cos(g.face) * 1.3; const d = Math.hypot(tx - c.x, tz - c.z);
        if (d > 0.4) { step(tx, tz, Math.min(4, 1 + d * 1.2)); c.setFrame(Math.floor(c.t * 9) % 2); } else c.setFrame(2);
        c.show(g.visible); if (pd < 2 && rnd() < dt * 0.3) c.bubble = { t: 'Waf !', d: 1.2 };
        break; }
      case 'fox': {
        const nightOk = DAY.h >= 21 || DAY.h < 5; if (!nightOk || S.found.renard) { c.show(false); c.x = c.wp[0][0]; c.z = c.wp[0][1]; c.wi = 0; continue; } c.show(true);
        if (c.wi >= c.wp.length) { c.show(false); continue; }
        const [tx, tz] = c.wp[c.wi]; const atWp = Math.hypot(tx - c.x, tz - c.z) < 0.15;
        if (atWp) { c.setFrame(2); c.vx = (P.x - c.x) * 0.01; c.vz = (P.z - c.z) * 0.01; if (pd < 6.5) { if (c.wi < c.wp.length - 1) c.wi++; else { S.flags.renard = 1; c.show(false); c.wi = c.wp.length; banner('Le renard blanc a disparu près d’une souche creuse…'); save(); } } }
        else { step(tx, tz, c.speed); c.setFrame(Math.floor(c.t * 10) % 2); }
        if (c.wi >= c.wp.length) { c.show(false); continue; }
        break; }
    }
    c.y = c.fly > 0 ? walkH(c.x, c.z) : walkH(c.x, c.z); if (c.swim) c.y = -0.68; c.draw();
  }
}

// ---------------- particules (fumée, étincelles, lucioles, pollen, feuilles, gouttes, brume, papillons) ----------------
const PN = 1400; const pg = new THREE.BufferGeometry(); const pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pSize = new Float32Array(PN), pA = new Float32Array(PN);
pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pCol, 3)); pg.setAttribute('size', new THREE.BufferAttribute(pSize, 1)); pg.setAttribute('alpha', new THREE.BufferAttribute(pA, 1));
const pMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uScale: { value: 300 } },
  vertexShader: 'attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float uScale; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); vA = alpha * smoothstep(3.0, 7.0, -mv.z); gl_PointSize = min(size * uScale / -mv.z, uScale * 0.08); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'varying vec3 vC; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; gl_FragColor = vec4(vC, vA * smoothstep(0.5, 0.15, r)); }' });
const pts = new THREE.Points(pg, pMat); pts.frustumCulled = false; pts.renderOrder = 5; scene.add(pts);
const parts = []; for (let i = 0; i < PN; i++) parts.push({ life: 0 });
let pHead = 0; function emit(o) { for (let k = 0; k < PN; k++) { const p = parts[pHead]; pHead = (pHead + 1) % PN; if (p.life <= 0) { Object.assign(p, { vx: 0, vy: 0, vz: 0, g: 0, grow: 0, size: 0.2, a: 1, fade: 1, col: [1, 1, 1], wob: 0, ph: rnd() * 6.28 }, o); p.max = p.life; return p; } } }
const colOf = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const SMOKE = colOf('#d8d4cc'), SPARK = colOf('#ffb040'), FLY = colOf('#e8ff8a'), POLLEN = colOf('#fff6c8'), DROP = colOf('#d8f4ff'), MIST = colOf('#e8f4f8');
const LEAF = ['#c47e26', '#dca23a', '#8fb856', '#a0621e'].map(colOf), BUTTER = ['#f6c84a', '#ffffff', '#e898c0', '#9ab8ff'].map(colOf);
let emitT = 0;
function updateParticles(dt) {
  const night = DAY.cur ? DAY.cur.night : 0; emitT += dt;
  if (emitT > 0.05) { emitT = 0;
    for (const s of V.smoke) if (rnd() < 0.5) emit({ x: s.x + (rnd() - 0.5) * 0.2, y: s.y, z: s.z + (rnd() - 0.5) * 0.2, vy: 0.6 + rnd() * 0.3, vx: 0.25, vz: 0.1, life: 4 + rnd() * 2, size: 0.35, grow: 0.5, a: 0.45, col: SMOKE });
    if (V.forgeFire && forgeWorking()) for (let i = 0; i < 2; i++) emit({ x: V.forgeFire.x + (rnd() - 0.5) * 0.4, y: V.forgeFire.y, z: V.forgeFire.z + (rnd() - 0.5) * 0.4, vy: 1.5 + rnd() * 1.5, vx: (rnd() - 0.5), vz: (rnd() - 0.5), g: -2, life: 0.6 + rnd() * 0.5, size: 0.06, a: 1, col: SPARK });
    // fontaine
    for (let i = 0; i < 3; i++) { const a = rnd() * 6.28; emit({ x: Math.cos(a) * 0.3, y: V.fountain.y + 2.5, z: Math.sin(a) * 0.3, vx: Math.cos(a) * 0.9, vz: Math.sin(a) * 0.9, vy: 0.8, g: -6, life: 0.8, size: 0.07, a: 0.8, col: DROP }); }
    // brume de la cascade
    if (Math.hypot(P.x - POND.x, P.z - POND.z) < 30) emit({ x: POND.x + (rnd() - 0.5) * 3, y: -0.5, z: POND.z - 3.2 + (rnd() - 0.5), vy: 0.4, vx: (rnd() - 0.5) * 0.4, vz: 0.4, life: 2.5, size: 0.7, grow: 0.6, a: 0.25, col: MIST });
    // autour du joueur : lucioles la nuit, pollen et papillons le jour, feuilles qui tombent
    const ax = P.x + (rnd() - 0.5) * 30, az = P.z + (rnd() - 0.5) * 24, ay = heightAt(ax, az);
    if (night > 0.5) { if (rnd() < 0.6) emit({ x: ax, y: ay + 0.4 + rnd() * 1.5, z: az, life: 5 + rnd() * 4, size: 0.09, a: 1, col: FLY, wob: 0.6, fade: 2 }); }
    else { if (rnd() < 0.5) emit({ x: ax, y: ay + 0.5 + rnd() * 2, z: az, vx: 0.2, life: 6, size: 0.04, a: 0.7, col: POLLEN, wob: 0.25 }); if (rnd() < 0.12) emit({ x: ax, y: ay + 0.3 + rnd(), z: az, life: 7, size: 0.1, a: 1, col: BUTTER[Math.floor(rnd() * 4)], wob: 1.2, flap: 1 }); }
    if (rnd() < 0.35) { const t = NATURE.trees[Math.floor(rnd() * NATURE.trees.length)]; if (t && Math.hypot(t.x - P.x, t.z - P.z) < 22) emit({ x: t.x + (rnd() - 0.5) * 3, y: heightAt(t.x, t.z) + 5, z: t.z + (rnd() - 0.5) * 3, vy: -0.5, vx: 0.4, life: 9, size: 0.09, a: 1, col: LEAF[Math.floor(rnd() * 4)], wob: 0.8 }); }
  }
  let n = 0;
  for (const p of parts) { if (p.life <= 0) continue; p.life -= dt; p.vy += p.g * dt; p.x += (p.vx + Math.sin(time.value * 2 + p.ph) * p.wob) * dt; p.y += p.vy * dt + (p.flap ? Math.sin(time.value * 9 + p.ph) * 0.02 : 0); p.z += (p.vz + Math.cos(time.value * 1.7 + p.ph) * p.wob) * dt; p.size += p.grow * dt;
    const k = p.life / p.max; let a = p.a * Math.min(1, k * 3) * Math.min(1, (1 - k) * 6); if (p.fade === 2) a *= 0.5 + 0.5 * Math.sin(time.value * 3 + p.ph);
    pPos[n * 3] = p.x; pPos[n * 3 + 1] = p.y; pPos[n * 3 + 2] = p.z; pCol.set(p.col, n * 3); pSize[n] = p.flap ? p.size * (0.6 + Math.abs(Math.sin(time.value * 12 + p.ph))) : p.size; pA[n] = a; n++; }
  pg.setDrawRange(0, n); for (const k of ['position', 'color', 'size', 'alpha']) pg.attributes[k].needsUpdate = true;
}
const forgeWorking = () => { const b = NPCS.find(n => n.id === 'borin'); return b && b.act === 'work' && b.arrived; };

// ---------------- interface ----------------
const dlg = $('dlg'), prompt = $('prompt');
let DLG = null; // { name, lines, i, choices, resolve }
function say(name, lines, choices) { return new Promise(res => { DLG = { name, lines: [].concat(lines), i: 0, choices, res }; showDlg(); }); }
function showDlg() {
  if (!DLG) { dlg.style.display = 'none'; return; } const last = DLG.i >= DLG.lines.length - 1; dlg.style.display = 'block';
  dlg.innerHTML = (DLG.name ? `<b>${DLG.name}</b><br>` : '') + DLG.lines[DLG.i] + (last && DLG.choices ? '<div class="ch">' + DLG.choices.map((c, k) => `<button data-k="${k}">${c}</button>`).join('') + '</div>' : `<small>${last ? 'E / toucher : fermer' : 'E / toucher : suite'}</small>`);
  dlg.querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); const d = DLG; DLG = null; showDlg(); d.res(+b.dataset.k); });
}
function advance() { if (!DLG) return false; if (DLG.choices && DLG.i >= DLG.lines.length - 1) return true; DLG.i++; if (DLG.i >= DLG.lines.length) { const d = DLG; DLG = null; showDlg(); d.res(-1); } else showDlg(); return true; }
dlg.addEventListener('pointerdown', e => { if (e.target.tagName !== 'BUTTON') advance(); });
let bannerT = 0; function banner(t) { $('banner').textContent = t; $('banner').style.opacity = 1; bannerT = 4; }
function discover(id) { if (S.found[id]) return; S.found[id] = Date.now(); const s = SECRETS[id]; banner(`Secret découvert — ${s.name} (niveau ${s.lvl} : ${LEVELS[s.lvl]})`); checkEvolution(); save(); updHud(); }
function journal() {
  const ids = Object.keys(SECRETS); const n = ids.filter(i => S.found[i]).length;
  let h = `<h3>Journal de Brumeval</h3><p>Secrets : ${n} / ${ids.length}</p><ul>`;
  for (const lvl of [1, 2, 3, 4, 5]) for (const id of ids.filter(i => SECRETS[i].lvl === lvl)) { const s = SECRETS[id]; h += `<li class="${S.found[id] ? 'ok' : ''}"><i>Niv. ${lvl} · ${LEVELS[lvl]}</i><br>${S.found[id] ? '✔ ' + s.name : (S.flags['hint_' + id] ? '… ' + s.hint : '???')}</li>`; }
  h += '</ul><h3>Objets</h3><p>' + (Object.keys(S.items).map(k => ITEM_NAMES[k] || k).join(', ') || '—') + '</p>';
  const tr = ['ab_lettre', 'ab_berceau', 'ab_portrait', 'ab_journal'].filter(k => S.story[k]).length; if (tr) h += `<p>Maison abandonnée : ${tr}/4 indices.</p>`;
  h += `<h3>Village</h3><p>${S.repair === 2 ? 'La maison des Vey est réparée.' : S.repair === 1 ? 'Torven répare la maison des Vey.' : ''} ${S.fete ? 'La fête de Brumeval a lieu chaque soir sur la place.' : ''}</p>`;
  $('journal').innerHTML = h + '<button id="jClose">Fermer</button>'; $('journal').style.display = 'block'; $('jClose').onclick = () => $('journal').style.display = 'none';
}
const ITEM_NAMES = { registre: 'Registre de Brumeval', carte: 'Fragment de carte', cle_aube: "Clé de l'aube", pendentif: "Pendentif d'argent « Pour Ilya »", lettre_torven: 'Lettre scellée « À mon frère Torven »' };

// ---------------- interactions ----------------
function insideOf(x, z) { for (const b of V.buildings) if ((b.enter) && b.contains(x, z, 0.05)) return b; return null; }
function nearestAction() {
  let best = null, bd = 1e9; const inB = P.inside ? P.inside.id : null;
  for (const n of NPCS) { if (!n.visible) continue; const d = Math.hypot(n.x - P.x, n.z - P.z); if (d < 1.7 && d < bd) { bd = d; best = { type: 'npc', n, label: `Parler à ${n.name}` }; } }
  const cat = crit('mousse'); if (cat) { const d = Math.hypot(cat.x - P.x, cat.z - P.z); if (d < 1.3 && d < bd) { bd = d; best = { type: 'cat', label: 'Caresser le chat' }; } }
  for (const it of V.interact) { if ((it.inside || null) !== inB && it.inside) continue; const d = Math.hypot(it.x - P.x, it.z - P.z); if (d < it.r && d < bd + 0.3) { bd = d; best = { type: 'it', it, label: it.label }; } }
  for (const d of V.doors) { const dd = Math.hypot(d.out.x - P.x, d.out.z - P.z); if ((d.fake || d.locked) && dd < 1.3 && dd < bd) { bd = dd; best = { type: 'door', d, label: 'Porte' }; } }
  return best;
}
async function doAction() {
  if (advance()) return; const a = nearestAction(); if (!a) return;
  if (a.type === 'npc') { const n = a.n; n.talking = true; const lines = talk(n, ctxTalk()); markHints(n); await say(`${n.name}, ${n.title}`, lines); n.talking = false; checkEvolution(); save(); return; }
  if (a.type === 'cat') { const c = crit('mousse'); c.follow = 45; c.bubble = { t: 'Rrrr… rrr…', d: 3 }; if (!S.found.chat) { await say(null, ["Le chat s'étire, ronronne bruyamment et se frotte contre vos jambes.", "Sur son collier, un petit médaillon : « Mousse ». Il semble décidé à vous suivre un moment."]); discover('chat'); } return; }
  if (a.type === 'door') { await say(null, a.d.fake ? TEXT.porte_fermee : TEXT.porte_nuit); return; }
  const id = a.it.id;
  switch (id) {
    case 'initiales': await say(null, S.found.initiales ? TEXT.initiales_re : TEXT.initiales); discover('initiales'); break;
    case 'puits': await say(null, TEXT.puits); break;
    case 'panneau': await say(null, TEXT.panneau); break;
    case 'note_edran': await say(null, TEXT.note_edran); S.flags.note = 1; S.flags.hint_bibliotheque = 1; break;
    case 'livres': { const liv0 = a.it;
      if (S.found.bibliotheque || V.bookcase.target) { await say(null, ["La bibliothèque reste écartée. Derrière, la petite pièce d'Édran."]); break; }
      await say(null, TEXT.livres_intro); const BOOKS = ['Chroniques du Zénith', "Traité de l'Aube", 'Contes du Crépuscule', 'Herbier des Brumes', 'Annales de la Lune']; const want = [1, 0, 2]; let ok = true;
      for (let k = 0; k < 3; k++) { const c = await say(null, [k === 0 ? 'Quel livre enfoncer en premier ?' : k === 1 ? 'Le livre s’enfonce avec un léger déclic. Et ensuite ?' : 'Un deuxième déclic. Le dernier ?'], BOOKS); if (c !== want[k]) { ok = false; break; } }
      if (ok) { V.bookcase.target = 1; V.bookcase.seg.off = true; regrid(liv0.x, liv0.z, 3); await say(null, TEXT.livres_ok); discover('bibliotheque'); } else await say(null, TEXT.livres_ko); break; }
    case 'coffre_edran': if (!V.bookcase.target) break; if (!S.items.registre) { S.items.registre = 1; await say(null, TEXT.coffre_edran); save(); } else await say(null, ["Le coffre ne contient plus que de la poussière."]); break;
    case 'grotte_runes': await say(null, TEXT.grotte_runes); break;
    case 'grotte_coffre': if (!S.items.carte) { S.items.carte = 1; await say(null, TEXT.grotte_coffre); discover('grotte'); } else await say(null, TEXT.grotte_vide); break;
    case 'grenouille': {
      const dawn = DAY.h >= 5 && DAY.h < 7.2;
      if (S.items.cle_aube) await say(null, TEXT.grenouille_vu); else if (dawn) { S.items.cle_aube = 1; V.statue.eyes.material.color.set('#7aff9a'); await say(null, TEXT.grenouille_aube); discover('grenouille'); } else { await say(null, TEXT.grenouille_jour); }
      break; }
    case 'souche_renard': if (S.items.pendentif) await say(null, TEXT.souche_vide); else if (S.flags.renard) { S.items.pendentif = 1; await say(null, TEXT.souche_renard); discover('renard'); } else await say(null, TEXT.souche_jour); break;
    case 'ab_lettre': case 'ab_berceau': case 'ab_portrait': case 'ab_journal': {
      await say(null, TEXT[id]); const before = ['ab_lettre', 'ab_berceau', 'ab_portrait', 'ab_journal'].filter(k => S.story[k]).length; S.story[id] = 1; S.flags.hint_maison = 1;
      const after = ['ab_lettre', 'ab_berceau', 'ab_portrait', 'ab_journal'].filter(k => S.story[k]).length; if (after === 4 && before < 4) await say(null, TEXT.ab_trace_toutes); save(); break; }
    case 'ab_plancher': {
      const all = ['ab_lettre', 'ab_berceau', 'ab_portrait', 'ab_journal'].every(k => S.story[k]);
      if (!all) await say(null, TEXT.ab_plancher_tot); else if (S.items.lettre_torven) await say(null, TEXT.ab_plancher_vide); else if (!S.items.cle_aube) await say(null, TEXT.ab_plancher_ferme);
      else { S.items.lettre_torven = 1; await say(null, TEXT.ab_plancher_ok); discover('maison'); }
      break; }
  }
  save(); updHud();
}
function ctxTalk() { return { h: DAY.h, found: S.found, items: S.items, flags: S.flags, repair: S.repair, fete: S.fete }; }
function markHints(n) { const map = { edran: 'initiales', gwenna: 'chat', liora: 'grotte', anselme: 'grenouille', hugues: 'renard' }; if (map[n.id]) S.flags['hint_' + map[n.id]] = 1; if (n.id === 'gwenna') S.flags.hint_bibliotheque = 1; }

// ---------------- évolution du village ----------------
function checkEvolution() {
  if (S.flags.torven_lettre && !S.repair) { S.repair = 1; S.repairAt = S.day + DAY.h / 24; banner('Torven commence à réparer la maison des Vey.'); refreshNpcScheds(); }
  if (S.repair === 1 && (S.day + DAY.h / 24) - S.repairAt >= 1) { S.repair = 2; banner('La maison des Vey est réparée.'); refreshNpcScheds(); }
  const n = Object.keys(S.found).length; if (n >= 4 && !S.fete) { S.fete = 1; banner('Brumeval prépare une fête : rendez-vous sur la place, le soir venu !'); refreshNpcScheds(); }
  applyEvolution();
}
function applyEvolution() {
  const ab = V.abandoned; ab.scaffold.visible = S.repair === 1; ab.repairedRoof.visible = S.repair === 2; ab.rf.roof.visible = S.repair !== 2; ab.rf.trimMesh.visible = S.repair !== 2; if (ab.boardsM) ab.boardsM.visible = S.repair !== 2;
  ab.name = S.repair === 2 ? 'Maison des Vey (restaurée)' : 'La maison abandonnée';
  V.festival.visible = !!S.fete && (DAY.h >= 16 || DAY.h < 1);
  if (V.bookcase && S.found.bibliotheque && !V.bookcase.seg.off) { V.bookcase.target = 1; V.bookcase.seg.off = true; if (GRID.walk) { const it = V.interact.find(i => i.id === 'livres'); regrid(it.x, it.z, 3); } }
  if (S.items.cle_aube) V.statue.eyes.material.color.set('#7aff9a');
}
function refreshNpcScheds() { for (const n of NPCS) { const d = NPC_DEFS.find(x => x.id === n.id); n.sched = schedFor(d); n.entry = null; } }

// ---------------- commandes ----------------
const keys = {};
addEventListener('keydown', e => { if (e.repeat) return; keys[e.code] = true;
  if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); doAction(); }
  if (e.code === 'KeyQ' && !DLG) CAM.yawT -= Math.PI / 4; if (e.code === 'KeyR') CAM.yawT += Math.PI / 4;
  if (e.code === 'PageUp' || e.code === 'KeyT') CAM.pitchT = clamp(CAM.pitchT + 0.08, PITCH_MIN, PITCH_MAX); if (e.code === 'PageDown' || e.code === 'KeyG') CAM.pitchT = clamp(CAM.pitchT - 0.08, PITCH_MIN, PITCH_MAX);
  if (e.code === 'KeyJ') journal(); if (e.code === 'Escape') { $('journal').style.display = 'none'; } });
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('wheel', e => { CAM.distT = clamp(CAM.distT + Math.sign(e.deltaY) * 1.2, 7, 24); }, { passive: true });
const stick = { on: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }, stickEl = $('stick'), knob = $('knob');
view.addEventListener('touchstart', e => { for (const t of e.changedTouches) if (!stick.on && t.clientX < innerWidth * 0.55) { Object.assign(stick, { on: true, id: t.identifier, ox: t.clientX, oy: t.clientY, x: 0, y: 0 }); stickEl.style.display = 'block'; stickEl.style.left = (t.clientX - 55) + 'px'; stickEl.style.top = (t.clientY - 55) + 'px'; } else if (t.clientX >= innerWidth * 0.55) { stick.swipe = { x: t.clientX, y: t.clientY, id: t.identifier }; } e.preventDefault(); }, { passive: false });
view.addEventListener('touchmove', e => { for (const t of e.changedTouches) { if (t.identifier === stick.id) { let dx = t.clientX - stick.ox, dy = t.clientY - stick.oy; const d = Math.hypot(dx, dy); if (d > 45) { dx *= 45 / d; dy *= 45 / d; } stick.x = dx / 45; stick.y = dy / 45; knob.style.left = (35 + dx) + 'px'; knob.style.top = (35 + dy) + 'px'; }
  else if (stick.swipe && t.identifier === stick.swipe.id) { const dx = t.clientX - stick.swipe.x, dy = t.clientY - stick.swipe.y; CAM.yawT -= dx * 0.006; CAM.yaw -= dx * 0.006; CAM.pitchT = clamp(CAM.pitchT + dy * 0.003, PITCH_MIN, PITCH_MAX); stick.swipe.x = t.clientX; stick.swipe.y = t.clientY; } } e.preventDefault(); }, { passive: false });
view.addEventListener('touchend', e => { for (const t of e.changedTouches) { if (t.identifier === stick.id) { stick.on = false; stick.id = null; stick.x = stick.y = 0; stickEl.style.display = 'none'; knob.style.left = '35px'; knob.style.top = '35px'; } if (stick.swipe && t.identifier === stick.swipe.id) stick.swipe = null; } });
$('act').addEventListener('pointerdown', e => { e.preventDefault(); doAction(); });
$('bGear').onclick = () => $('bar').classList.toggle('fold');
$('bPix').onclick = () => { STATE.pix = !STATE.pix; $('bPix').classList.toggle('on', STATE.pix); resize(); };
$('bQual').onclick = () => { STATE.auto = false; STATE.qual = (STATE.qual + 1) % 3; $('bQual').textContent = 'Qualité : ' + ['basse', 'moyenne', 'haute'][STATE.qual]; resize(); };
$('bTime').onclick = () => { DAY.h = (DAY.h + 2) % 24; refreshNpcScheds(); };
$('bSpeed').onclick = () => { const sp = [24 / 480, 24 / 120, 0]; const i = (sp.indexOf(DAY.speed) + 1) % 3; DAY.speed = sp[i]; $('bSpeed').textContent = ['Temps ×1', 'Temps ×4', 'Temps figé'][i]; };
$('bRotL').onclick = () => CAM.yawT -= Math.PI / 4; $('bRotR').onclick = () => CAM.yawT += Math.PI / 4;
$('bUp').onclick = () => CAM.pitchT = clamp(CAM.pitchT + 0.08, PITCH_MIN, PITCH_MAX); $('bDn').onclick = () => CAM.pitchT = clamp(CAM.pitchT - 0.08, PITCH_MIN, PITCH_MAX);
$('bJournal').onclick = journal; $('jBtn').onclick = journal;
$('bReset').onclick = () => { if (confirm('Effacer la progression de la démo (secrets, évolution du village) ? Le jeu n’est pas concerné.')) { localStorage.removeItem(SAVE_KEY); location.reload(); } };

// ---------------- HUD, radar, bulles ----------------
const hhmm = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0');
function zoneName() {
  if (P.inside) return P.inside.name; if (inCave(P.x, P.z)) return 'Derrière la cascade'; const r = Math.hypot(P.x, P.z);
  if (r < 8) return 'Place de la fontaine'; if (Math.hypot(P.x - POND.x, P.z - POND.z) < 8) return 'Bassin de la cascade'; if (P.x > 25 && P.x < 35 && Math.abs(P.z + 3) < 3) return 'Pont de la Vire';
  if (P.x < -22) return 'Ferme Gaspard'; if (P.x > 34) return 'Rive est'; if (r < 27) return VILLAGE_NAME; return 'Lisière de la forêt';
}
function updHud() { $('hud').innerHTML = `<b>${VILLAGE_NAME}</b> · Jour ${S.day} · ${hhmm(DAY.h)}<br><span>${zoneName()}</span>`; $('jBtn').textContent = `Secrets ${Object.keys(S.found).length}/${Object.keys(SECRETS).length}`; }
const radar = $('radar'), rc = radar.getContext('2d');
function drawRadar() {
  const W = 96, s = 1.4; rc.clearRect(0, 0, W, W); rc.save(); rc.beginPath(); rc.arc(W / 2, W / 2, W / 2 - 1, 0, 6.3); rc.clip(); rc.fillStyle = 'rgba(30,50,30,.55)'; rc.fillRect(0, 0, W, W);
  rc.translate(W / 2, W / 2); rc.rotate(CAM.yaw); const T = (x, z) => [(x - P.x) * s, (z - P.z) * s];
  rc.fillStyle = 'rgba(80,140,170,.8)'; for (let z = -60; z < 60; z += 2) { const [a, b] = T(31 + Math.sin(z * 0.055) * 5, z); rc.fillRect(a - 3.5, b - 1, 7, 2.2); } { const [a, b] = T(POND.x, POND.z); rc.beginPath(); rc.arc(a, b, POND.r * s, 0, 6.3); rc.fill(); }
  rc.fillStyle = 'rgba(160,140,110,.85)'; { const [a, b] = T(0, 0); rc.beginPath(); rc.arc(a, b, 7.5 * s, 0, 6.3); rc.fill(); }
  for (const b of V.buildings) { const [a, c] = T(b.x, b.z); rc.save(); rc.translate(a, c); rc.rotate(-b.rot); rc.fillStyle = b.enter ? '#e8c890' : '#a89070'; rc.fillRect(-b.w * s / 2, -b.d * s / 2, b.w * s, b.d * s); rc.restore(); }
  for (const n of NPCS) if (n.visible) { const [a, b] = T(n.x, n.z); rc.fillStyle = '#ffe08a'; rc.fillRect(a - 1.5, b - 1.5, 3, 3); }
  rc.restore(); rc.fillStyle = '#fff'; rc.beginPath(); rc.arc(W / 2, W / 2, 3, 0, 6.3); rc.fill();
}
const bubbles = $('bubbles'); const bubEls = new Map(); const _v = new THREE.Vector3();
function updBubbles() {
  const list = [...NPCS.filter(n => n.bubble && n.visible).map(n => ({ k: n, t: n.bubble, x: n.x, y: n.y + 2.2, z: n.z })), ...CRIT.filter(c => c.bubble && c.mesh.visible).map(c => ({ k: c, t: c.bubble.t, x: c.x, y: c.y + 1.0, z: c.z }))];
  for (const c of CRIT) if (c.bubble) { c.bubble.d -= 1 / 30; if (c.bubble.d <= 0) c.bubble = null; }
  const seen = new Set(); for (const b of list) { _v.set(b.x, b.y, b.z).project(camera); if (_v.z > 1) continue; let el = bubEls.get(b.k); if (!el) { el = document.createElement('div'); el.className = 'bub'; bubbles.appendChild(el); bubEls.set(b.k, el); } el.textContent = b.t; el.style.left = ((_v.x + 1) / 2 * innerWidth) + 'px'; el.style.top = ((1 - _v.y) / 2 * innerHeight) + 'px'; seen.add(b.k); }
  for (const [k, el] of bubEls) if (!seen.has(k)) { el.remove(); bubEls.delete(k); }
}
function chatLines(a, b) { if (S.fete && DAY.h > 17) return pick(CHAT.fete); return rnd() < 0.5 ? pick(CHAT[a.id] || CHAT.any) : pick(CHAT.any); }
const pick = a => a[Math.floor(rnd() * a.length)];

// ---------------- boucle ----------------
const inLight = new THREE.PointLight('#ffc27a', 0, 9, 1.4); scene.add(inLight);
const PROF = { render: 0, js: 0 };
let last = performance.now(), fpsAcc = 0, fpsN = 0, fps = 60, hudT = 0, saveT = 0, prevH = DAY.h;
function frame(now) {
  const rdt = (now - last) / 1000, dt = Math.min(0.05, rdt); last = now; time.value += dt; fpsAcc += rdt; fpsN++;
  if (fpsAcc > 1) { fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; $('fps').textContent = Math.round(fps) + ' i/s'; if (STATE.auto) { if (fps < 26 && STATE.qual > 0) { STATE.qual--; resize(); } else if (fps > 55 && STATE.qual < (MOBILE ? 1 : 2)) { STATE.qual++; resize(); } } }
  // temps
  if (!DLG) DAY.h += dt * DAY.speed; if (DAY.h >= 24) { DAY.h -= 24; S.day++; checkEvolution(); } if (Math.floor(DAY.h) !== Math.floor(prevH)) { checkEvolution(); } prevH = DAY.h;
  // joueur
  let ix = 0, iz = 0; if (!DLG) { if (keys.KeyW || keys.KeyZ || keys.ArrowUp) iz -= 1; if (keys.KeyS || keys.ArrowDown) iz += 1; if (keys.KeyA || keys.ArrowLeft) ix -= 1; if (keys.KeyD || keys.ArrowRight) ix += 1; if (stick.on) { ix += stick.x; iz += stick.y; } }
  const il = Math.hypot(ix, iz); P.moving = il > 0.15;
  if (P.moving) { if (il > 1) { ix /= il; iz /= il; } const r = [Math.cos(CAM.yaw), -Math.sin(CAM.yaw)], t = [Math.sin(CAM.yaw), Math.cos(CAM.yaw)];
    const wx = ix * r[0] + iz * t[0], wz = ix * r[1] + iz * t[1]; const sp = 4.2 * Math.min(1, il) * (keys.ShiftLeft ? 1.5 : 1); P.face = Math.atan2(wx, wz);
    const tryMove = (nx, nz) => !blocked(nx, nz, P.r) && slopeOk(P.x, P.z, nx, nz) && !npcBlock(nx, nz);
    const nx = P.x + wx * sp * dt, nz = P.z + wz * sp * dt; if (tryMove(nx, nz)) { P.x = nx; P.z = nz; } else if (tryMove(nx, P.z)) P.x = nx; else if (tryMove(P.x, nz)) P.z = nz;
    P.walkT += dt * 10 * Math.min(1, il); }
  P.y = walkH(P.x, P.z); P.inside = insideOf(P.x, P.z);
  hero.set('walk', P.moving ? 1 + (Math.floor(P.walkT) % 8) : 0, sectorOf(P.face)); hero.place(P.x, P.y, P.z);
  // portes : s'ouvrent quand quelqu'un approche (sauf verrouillées)
  const night = DAY.cur ? DAY.cur.night : 0;
  for (const d of V.doors) { if (d.fake) continue; const lock = d.b.id !== 'auberge' && d.b.id !== 'chapelle' && (DAY.h >= 22.5 || DAY.h < 6) && !P.inside; if (lock !== d.locked) { d.locked = lock; if (!d.lockSeg) { const [ax, az] = L2W(d.b, -0.7, d.b.d / 2), [bx, bz] = L2W(d.b, 0.7, d.b.d / 2); d.lockSeg = { ax, az, bx, bz, kind: 'porte', th: 0.12 }; COL.segs.push(d.lockSeg); } d.lockSeg.off = !lock; }
    if (!d.lockSeg) { const [ax, az] = L2W(d.b, -0.7, d.b.d / 2), [bx, bz] = L2W(d.b, 0.7, d.b.d / 2); d.lockSeg = { ax, az, bx, bz, kind: 'porte', th: 0.12, off: true }; COL.segs.push(d.lockSeg); }
    let near = !d.locked && (Math.hypot(P.x - d.out.x, P.z - d.out.z) < 1.8 || Math.hypot(P.x - d.in.x, P.z - d.in.z) < 1.8); if (!near && !d.locked) for (const n of NPCS) if (n.visible && (Math.hypot(n.x - d.out.x, n.z - d.out.z) < 1.6 || Math.hypot(n.x - d.in.x, n.z - d.in.z) < 1.6)) { near = true; break; }
    d.open = lerp(d.open, near ? 1 : 0, Math.min(1, dt * 6)); d.piv.rotation.y = d.open * 1.55; }
  // vue en coupe : toit et haut des murs masqués quand on est à l'intérieur
  for (const b of V.buildings) { const tgt = (P.inside === b) ? 1 : 0; b.cut = lerp(b.cut, tgt, Math.min(1, dt * 8)); const hide = b.cut > 0.5; if (b.roofG.visible === hide) { b.roofG.visible = !hide; b.upG.visible = !hide; if (b.repairedRoof && S.repair === 2) b.repairedRoof.visible = !hide; if (b.scaffold) b.scaffold.visible = !hide && S.repair === 1; } }
  if (V.cave) V.cave.roof.visible = !inCave(P.x, P.z); water.fallMat.uniforms.uFade.value = lerp(water.fallMat.uniforms.uFade.value, inCave(P.x, P.z) ? 0.18 : 1, Math.min(1, dt * 4));
  if (P.inside) { inLight.position.set(P.inside.x, P.inside.fy + 2.2, P.inside.z); inLight.intensity = lerp(inLight.intensity, 12, dt * 4); } else inLight.intensity = lerp(inLight.intensity, 0, dt * 4);
  // bibliothèque coulissante
  if (V.bookcase) { V.bookcase.open = lerp(V.bookcase.open, V.bookcase.target, Math.min(1, dt * 1.5)); V.bookcase.m.position.z = -1.9 + V.bookcase.open * 1.25; }
  // vie
  updateNpcs(dt, { pois: POI, player: P, chatLines, onArrive: null });
  updateCritters(dt); updateParticles(dt);
  // lumières de nuit
  const lamp = smooth((night - 0.25) / 0.5); VM.glass.emissiveIntensity = lamp * 1.3 + (P.inside ? 0 : 0); VM.stained.emissiveIntensity = 0.15 + lamp * 0.9;
  for (const L of V.lights) { if (L.type === 'lantern') L.m.material.color.setRGB(lerp(0.35, 1.0, lamp), lerp(0.3, 0.82, lamp), lerp(0.25, 0.45, lamp)); else if (L.type === 'plight') L.l.intensity = L.base * lamp; else if (L.type === 'fire') L.l.intensity = (forgeWorking() ? L.base : L.base * 0.35) * (0.85 + Math.sin(time.value * 13) * 0.08 + Math.sin(time.value * 7.3) * 0.07); }
  VM.fire.color.setHSL(0.07, 1, 0.55 + Math.sin(time.value * 10) * 0.05);
  V.festival.visible = !!S.fete && (DAY.h >= 16 || DAY.h < 1);
  for (const a of V.anim) if (a.type === 'cloth') a.m.rotation.x = Math.sin(time.value * 1.6 + a.m.position.x) * 0.03;
  // caméra
  CAM.yaw = angLerp(CAM.yaw, CAM.yawT, Math.min(1, dt * 6)); CAMI.yaw = CAM.yaw; const inside = !!P.inside || inCave(P.x, P.z);
  const portrait = innerHeight > innerWidth ? 1.45 : 1; const dT = (inside ? Math.min(CAM.distT, 10) : CAM.distT) * portrait, pT = inside ? Math.max(CAM.pitchT, 0.95) : CAM.pitchT; CAM.dist = lerp(CAM.dist, dT, Math.min(1, dt * 3)); CAM.pitch = lerp(CAM.pitch, pT, Math.min(1, dt * 3));
  CAM.look.lerp(new THREE.Vector3(P.x, P.y + 0.9, P.z), Math.min(1, dt * 7)); const cd = CAM.dist;
  camera.position.set(CAM.look.x + Math.sin(CAM.yaw) * Math.cos(CAM.pitch) * cd, CAM.look.y + Math.sin(CAM.pitch) * cd, CAM.look.z + Math.cos(CAM.yaw) * Math.cos(CAM.pitch) * cd); camera.lookAt(CAM.look);
  // position du héros à l'écran (découpe des feuillages et des murs devant lui)
  _v.set(P.x, P.y + 1.0, P.z).project(camera); U.uPS.value.set((_v.x + 1) / 2, (_v.y + 1) / 2); U.uPD.value = _v.z * 0.5 + 0.5; U.uOR.value = 0.11 * 14 / CAM.dist;
  pMat.uniforms.uScale.value = renderer.domElement.height * 0.9;
  water.mat.uniforms.uTime.value = time.value; water.fallMat.uniforms.uTime.value = time.value; water.mat.uniforms.uSunDir.value.copy(U.uSunDir.value); if (DAY.cur) { water.mat.uniforms.uSky.value.copy(DAY.cur.mid); water.mat.uniforms.uNight.value = DAY.cur.night; }
  applyDay(P.x, P.y, P.z); updateLod(CAM.look.x, CAM.look.z);
  const tR0 = performance.now(); render(); PROF.render = PROF.render * 0.9 + (performance.now() - tR0) * 0.1; PROF.js = PROF.js * 0.9 + (tR0 - now) * 0.1;
  // interface
  const a = DLG ? null : nearestAction(); prompt.style.display = a ? 'block' : 'none'; if (a) prompt.textContent = (MOBILE ? '' : 'E — ') + a.label; $('act').style.opacity = a ? 1 : 0.45;
  hudT -= dt; if (hudT <= 0) { hudT = 0.5; updHud(); drawRadar(); }
  updBubbles(); if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('banner').style.opacity = 0; }
  saveT += dt; if (saveT > 10) { saveT = 0; save(); }
  requestAnimationFrame(frame);
}
function npcBlock(x, z) { for (const n of NPCS) if (n.visible && Math.hypot(n.x - x, n.z - z) < 0.45 && Math.hypot(n.x - P.x, n.z - P.z) > Math.hypot(n.x - x, n.z - z)) return true; return false; }

// ---------------- vérifications automatiques (accès, chevauchements, apparitions) ----------------
function checks() {
  const R = { buildMs, counts: NATURE.counts, buildings: V.buildings.length, doors: [], overlaps: [], unreachablePois: [], blockedSpawns: [], unreachableInteract: [], npcs: NPCS.length, critters: CRIT.length };
  const from = [0, 5.5];
  for (const d of V.doors) { if (d.fake) continue; const p = findPath(from[0], from[1], d.out.x, d.out.z), q = findPath(d.out.x, d.out.z, d.in.x, d.in.z); R.doors.push({ id: d.b.id, outside: !!p && endOk(p, d.out), inside: !!q && endOk(q, d.in) }); }
  // chevauchements (rectangles tournés, test par échantillonnage)
  for (let i = 0; i < V.buildings.length; i++) for (let j = i + 1; j < V.buildings.length; j++) { const a = V.buildings[i], b = V.buildings[j]; let hit = false;
    for (let u = -0.5; u <= 0.5 && !hit; u += 0.1) for (let v = -0.5; v <= 0.5 && !hit; v += 0.1) { const [x, z] = L2W(a, u * a.w, v * a.d); if (b.contains(x, z, -0.3)) hit = true; } if (hit) R.overlaps.push(a.id + ' / ' + b.id); }
  for (const [k, p] of Object.entries(POI)) { const path = findPath(from[0], from[1], p.x, p.z); if (!path || !endOk(path, p)) R.unreachablePois.push(k + ':' + (blocked(p.x, p.z, 0.34) || '?')); }
  for (const n of NPC_DEFS) if (blocked(n.start[0], n.start[1], 0.28)) R.blockedSpawns.push(n.id);
  for (const it of V.interact) { if (it.inside === 'edran' && it.need) continue; /* coffre d'Édran : accessible seulement après l'énigme (testé à part) */ const path = findPath(from[0], from[1], it.x, it.z); if (!path || Math.hypot(path.at(-2)[0] - it.x, path.at(-2)[1] - it.z) > it.r + 0.3) R.unreachableInteract.push(it.id); }
  R.ok = R.doors.every(d => d.outside && d.inside) && !R.overlaps.length && !R.unreachablePois.length && !R.blockedSpawns.length && !R.unreachableInteract.length;
  return R;
}
const endOk = (path, p) => Math.hypot(path.at(-2)[0] - p.x, path.at(-2)[1] - p.z) < 0.9;

// ---------------- démarrage ----------------
await loadSheets(SHEETS);
hero = new Sprite8('hero_walk', { idle: 'hero_idle' });
buildGrid();
for (const d of NPC_DEFS) { const n = new Npc({ ...d, sched: schedFor(d) }); const e = n.sched.find(x => true); }
// placer chaque habitant directement à son poste actuel (pas de longue marche au chargement)
for (const n of NPCS) { const e = (() => { let r = n.sched[n.sched.length - 1]; for (const s of n.sched) if (DAY.h >= s[0]) r = s; return r; })(); const p = POI[e[1]]; if (p) { n.x = p.x; n.z = p.z; } }
setupAnimals();
applyEvolution();
$('loading').style.display = 'none';
requestAnimationFrame(frame);
function walkTo(x, z, maxSteps = 6000) {
  const path = findPath(P.x, P.z, x, z); if (!path) return { ok: false, why: 'pas de chemin' }; if (blocked(x, z, P.r)) { path.pop(); } let i = 1, steps = 0, stuck = 0;
  while (i < path.length && steps++ < maxSteps) { const [tx, tz] = path[i]; const dx = tx - P.x, dz = tz - P.z, d = Math.hypot(dx, dz); if (d < 0.12) { i++; continue; }
    const s = Math.min(d, 0.08), nx = P.x + dx / d * s, nz = P.z + dz / d * s; if (!blocked(nx, nz, P.r) && slopeOk(P.x, P.z, nx, nz)) { P.x = nx; P.z = nz; stuck = 0; } else if (++stuck > 30) return { ok: false, why: 'bloqué', at: [+P.x.toFixed(2), +P.z.toFixed(2)], by: blocked(nx, nz, P.r) || 'pente' }; }
  P.inside = insideOf(P.x, P.z); return { ok: Math.hypot(P.x - x, P.z - z) < 1.2, at: [+P.x.toFixed(2), +P.z.toFixed(2)] };
}
window.__demo = { water, THREE, PROF, renderer, walkTo, checks, S, P, V, NPCS, CRIT, DAY, POI, findPath, blocked, walkH, tp: (x, z) => { P.x = x; P.z = z; }, setHour: h => { DAY.h = h; refreshNpcScheds(); }, act: doAction, near: nearestAction, advance, get dlg() { return DLG; }, save, STATE, CAM, SECRETS, choose: k => { const b = dlg.querySelectorAll('button')[k]; if (b) b.click(); } };
