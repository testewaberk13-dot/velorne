// =====================================================================
//  VÉLORNE 3D — VIE DE BRUMEVAL (étape 5, phase 2 et 3)
//  Code du village pilote v4 repris tel quel (habitants et routines, animaux, ambiance, secrets, maison des Vey, fête),
//  branché sur le jeu : dialogues dans la fenêtre du jeu, état sauvegardé dans la partie (G.flags.bru), interactions
//  par la touche d'action du jeu, habitants du jeu et du village pilote réunis (mêmes personnes).
//  Les parties « reprises » sont extraites automatiquement de assets/demo/v4/main.js (tools/gen_brumeval_life.py).
// =====================================================================
import { THREE, rnd, lerp, clamp, angLerp, smooth, scene, camera, DAY, time, walkH, heightAt, blocked, COL, POND, inCave, MOBILE } from '../assets/demo/v4/core.js';
import { NATURE } from '../assets/demo/v4/nature.js';
import { V, VM, L2W } from '../assets/demo/v4/village.js';
import { loadSheets, Sprite8, Critter, CAMI, sectorOf, buildGrid, regrid, findPath, walkableAt, NPCS, Npc, updateNpcs, GRID } from '../assets/demo/v4/life.js';
import { SECRETS, LEVELS, TEXT, CHAT, talk, VILLAGE_NAME } from '../assets/demo/v4/story.js';
import { BRU, OX, OZ } from './brumeval3d.js';

const SCENE_AT_LOAD = new Set(scene.children); // ce qui existait avant le village vivant
// ---------- adaptateurs ----------
const S = { found: {}, items: {}, flags: {}, story: {}, repair: 0, repairAt: 0, fete: 0, day: 1 };
function bindState() { if (!G.flags) return; if (!G.flags.bru) G.flags.bru = JSON.parse(JSON.stringify(S)); const B = G.flags.bru; for (const k of Object.keys(S)) { if (B[k] == null) B[k] = JSON.parse(JSON.stringify(S[k])); } Object.keys(S).forEach(k => delete S[k]); return B; }
let SB = S; // état courant (pointe vers G.flags.bru une fois la partie lancée)
const P = { x: 0, z: 0, face: 0, r: 0.3, inside: null, moving: false };
function save() { }
function updHud() { }
function banner(t) { try { toast(t); } catch (e) { } }
// dialogue : répliques une à une dans la fenêtre du jeu, choix à la dernière
function say(name, lines, choices) {
  return new Promise(res => {
    const ls = [].concat(lines); let i = 0;
    const show = () => { const last = i >= ls.length - 1;
      const opts = last && choices ? choices.map((c, k) => [c, () => { closePanel(); res(k); }]) : [[last ? 'Fermer' : 'Suite', () => { if (last) { closePanel(); res(-1); } else { i++; show(); } }]];
      dialog(name || VILLAGE_NAME, ls[i], opts); };
    show();
  });
}
function advance() { return false; }

const POI = V.pois;
for (const d of V.doors) if (!d.fake) POI[d.b.id + '_porte'] = { id: d.b.id + '_porte', x: d.out.x, z: d.out.z, face: null };
Object.assign(POI, { lisiere: { x: -24.5, z: -21.5, face: null }, cascade: { x: -11.2, z: -23.8, face: null }, place_c: { x: 0, z: 4.2, face: Math.PI } });
const PATROL = ['place_n', 'chapelle_porte', 'place_e', 'pont', 'place_s', 'edran_porte', 'place_o', 'liora_porte'];

const NPC_DEFS = [
  { id: 'edran', name: 'Édran', title: "l'archiviste", sheet: 'npc_elder_walk', home: 'edran', start: [-8, 7], speed: 1.0,
    sched: [[0, 'edran_lit', 'sleep'], [7, 'edran_bureau', 'work'], [11, 'banc_chene', 'sit'], [13, 'aub_t1', 'sit'], [14.5, 'edran_bureau', 'work'], [17, 'fontaine_0', 'chat'], [19, 'aub_t1', 'sit'], [21.5, 'edran_lit', 'sleep']] },
  { id: 'maelys', name: 'Maëlys', title: 'la marchande', sheet: 'npc_merchant_walk', home: 'echoppe', start: [6, 4],
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


function discover(id) { if (S.found[id]) return; S.found[id] = Date.now(); const s = SECRETS[id]; banner(`Secret découvert — ${s.name} (niveau ${s.lvl} : ${LEVELS[s.lvl]})`); checkEvolution(); save(); updHud(); }
function journal_v4() {
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

function chatLines(a, b) { if (S.fete && DAY.h > 17) return pick(CHAT.fete); return rnd() < 0.5 ? pick(CHAT[a.id] || CHAT.any) : pick(CHAT.any); }
const pick = a => a[Math.floor(rnd() * a.length)];
function npcBlock(x, z) { for (const n of NPCS) if (n.visible && Math.hypot(n.x - x, n.z - z) < 0.45 && Math.hypot(n.x - P.x, n.z - P.z) > Math.hypot(n.x - x, n.z - z)) return true; return false; }

// ---------- habitants du jeu et du village pilote : les mêmes personnes ----------
const MERGE = { 'Borin le forgeron': 'borin', 'Maëlle la marchande': 'maelys', 'Édran, archiviste': 'edran', 'Torven, bûcheron': 'torven', 'Liora, herboriste': 'liora' };
const NAMES = {}; // la marchande du jeu s'appelle Maëlle ; Maëlys est l'artisane du jeu
const PROXY = new Map(); // habitant du village pilote sans équivalent dans le jeu → PNJ du jeu (Hugues, Gwenna, Frère Anselme)
const ITEMS = new Map(); // objets à examiner, chat, portes → points d'interaction du jeu
let ready = false, prevH = 0;
const toW = (x, z) => [(x + OX) * 32, (z + OZ) * 32];
function mkProxy(key, o) { let p = PROXY.get(key); if (!p) { p = Object.assign({ bru: true, bru3d: true, look: 'npc_elder', dir: 2, spr: null, t: 0, role: 'bru' }, o); PROXY.set(key, p); } return p; }
function syncProxies() {
  if (!G.npcs) return;
  const P2 = G.player; P.x = P2.x / 32 - OX; P.z = P2.y / 32 - OZ; P.inside = BRU.insideNow(); const fa = P2.aim != null ? P2.aim : 0; P.face = Math.atan2(Math.cos(fa), Math.sin(fa));
  for (const n of NPCS) {
    const merged = G.npcs.find(g => MERGE[g.name] === n.id && !g.bru);
    if (merged) { const [x, y] = toW(n.x, n.z); merged.x = x; merged.y = y; merged.bru3d = true; merged.noTalk = !n.visible; merged.bruN = n; n.gameNpc = merged; continue; }
    const p = mkProxy('npc:' + n.id, { name: (NAMES[n.id] || n.name) + ', ' + n.title, bruKind: 'npc', bruN: n });
    const [x, y] = toW(n.x, n.z); p.x = x; p.y = y; p.noTalk = !n.visible; if (!G.npcs.includes(p)) G.npcs.push(p);
  }
  const cat = crit('mousse'); if (cat) { const p = mkProxy('cat', { name: 'Mousse, le chat', bruKind: 'cat' }); const [x, y] = toW(cat.x, cat.z); p.x = x; p.y = y; if (!G.npcs.includes(p)) G.npcs.push(p); }
  for (const it of V.interact) { if ((it.inside || null) && (!P.inside || P.inside.id !== it.inside)) { const p = PROXY.get('it:' + it.id); if (p) p.noTalk = true; continue; }
    const p = mkProxy('it:' + it.id, { name: it.label, bruKind: 'it', it }); const [x, y] = toW(it.x, it.z); p.x = x; p.y = y; p.noTalk = false; if (!G.npcs.includes(p)) G.npcs.push(p); }
  for (const d of V.doors) { const key = 'door:' + V.doors.indexOf(d), on = d.fake || d.locked; const p = mkProxy(key, { name: 'Porte', bruKind: 'door', d }); const [x, y] = toW(d.out.x, d.out.z); p.x = x; p.y = y; p.noTalk = !on; if (!G.npcs.includes(p)) G.npcs.push(p); }
}
// action du joueur sur un élément de Brumeval : même logique que le village pilote
async function bruAction(n) {
  if (n.bruKind === 'npc') { const v = n.bruN; v.talking = true; const lines = talk(v, ctxTalk()); markHints(v); await say(`${NAMES[v.id] || v.name}, ${v.title}`, lines); v.talking = false; checkEvolution(); return; }
  const a = n.bruKind === 'cat' ? { type: 'cat' } : n.bruKind === 'door' ? { type: 'door', d: n.d } : { type: 'it', it: n.it };
  nearestAction = () => a; await doAction(); nearestAction = nearestAction0;
}
let nearestAction0 = null;
const interact0 = window.interact;
window.interact = function (n) {
  if (n && n.bru) { try { G.player.dir = dirOf(n.x - G.player.x, n.y - G.player.y); } catch (e) { } bruAction(n); return; }
  // habitant réuni : quelques mots de sa vie au village (indices des secrets), puis son rôle habituel dans le jeu
  if (n && n.bruN && !n.bruTalked) { const v = n.bruN; n.bruTalked = true; setTimeout(() => n.bruTalked = false, 20000); v.talking = true; const lines = talk(v, ctxTalk()); markHints(v);
    return say(`${n.name}`, lines).then(() => { v.talking = false; checkEvolution(); interact0(n); }); }
  return interact0(n);
};
// bulles des habitants et des animaux (dessinées dans l'interface du jeu)
export function drawBubbles(ctx) {
  if (!ready || !B2D.project) return; ctx.save(); ctx.font = '7px sans-serif'; ctx.textAlign = 'center';
  const list = [...NPCS.filter(n => n.bubble && n.visible).map(n => [n.bubble, n.x, n.z, 2.2]), ...CRIT.filter(c => c.bubble && c.mesh.visible).map(c => [c.bubble.t, c.x, c.z, 1.0])];
  for (const [t, x, z, h] of list) { const s = B2D.project((x + OX) * 32, (z + OZ) * 32, h); if (!s) continue; const w = ctx.measureText(t).width + 8; ctx.fillStyle = 'rgba(255,250,235,0.92)'; ctx.fillRect(Math.round(s.x - w / 2), Math.round(s.y - 9), Math.round(w), 11); ctx.fillStyle = '#3a2a1a'; ctx.fillText(t, Math.round(s.x), Math.round(s.y)); }
  ctx.restore();
}
// journal de Brumeval dans la fenêtre du jeu
export function bruJournal() {
  const ids = Object.keys(SECRETS); const n = ids.filter(i => SB.found[i]).length; let h = `<p>Secrets : ${n} / ${ids.length}</p><ul>`;
  for (const lvl of [1, 2, 3, 4, 5]) for (const id of ids.filter(i => SECRETS[i].lvl === lvl)) { const s = SECRETS[id]; h += `<li><i>Niv. ${lvl} · ${LEVELS[lvl]}</i> — ${SB.found[id] ? '✔ ' + s.name : (SB.flags['hint_' + id] ? '… ' + s.hint : '???')}</li>`; }
  h += '</ul><p>Objets : ' + (Object.keys(SB.items).map(k => ITEM_NAMES[k] || k).join(', ') || '—') + '</p>';
  return h;
}
export async function startBrumevalLife() {
  await loadSheets(['npc_elder_walk', 'npc_merchant_walk', 'npc_guard_walk', 'npc_guard_slash', 'npc_alchemist_walk', 'npc_smith_walk', 'npc_artisan_walk', 'npc_relic_walk', 'npc_runemaster_walk']);
  buildGrid(); const pre = new Set(scene.children);
  for (const d of NPC_DEFS) new Npc({ ...d, sched: schedFor(d) });
  for (const n of NPCS) { const e = (() => { let r = n.sched[n.sched.length - 1]; for (const s of n.sched) if (DAY.h >= s[0]) r = s; return r; })(); const p = POI[e[1]]; if (p) { n.x = p.x; n.z = p.z; } }
  setupAnimals();
  // personnages et animaux construits dans la scène : rattachés au repère de Brumeval
  for (const o of [...scene.children]) if (!pre.has(o) && o !== BRU.ROOT && !o.isLight) BRU.ROOT.add(o);
  BRU.ROOT.add(pts);
  nearestAction0 = nearestAction; ready = true;
}
const LIFE_NEW = o => !SCENE_AT_LOAD.has(o);
export function updateBrumevalLife(dt, camYaw) {
  if (!ready || G.mode !== 'play') return;
  const B = bindState(); const fresh = B && SB !== B; if (fresh) SB = B;
  Object.assign(S, SB); // les fonctions reprises lisent S
  if (fresh) { applyEvolution(); refreshNpcScheds(); }
  CAMI.yaw = camYaw; syncProxies();
  if (DAY.h < prevH - 12) { S.day++; checkEvolution(); } if (Math.floor(DAY.h) !== Math.floor(prevH)) checkEvolution(); prevH = DAY.h;
  const far = Math.hypot(P.x, P.z) > 120; if (far) return;
  updateNpcs(G.paused ? 0 : dt, { pois: POI, player: P, chatLines, onArrive: null });
  updateCritters(G.paused ? 0 : dt); updateParticles(dt);
  if (V.bookcase) { V.bookcase.open = lerp(V.bookcase.open, V.bookcase.target, Math.min(1, dt * 1.5)); V.bookcase.m.position.z = -1.9 + V.bookcase.open * 1.25; }
  for (const d of V.doors) { if (d.fake || !d.piv) continue; let near = !d.locked && (Math.hypot(P.x - d.out.x, P.z - d.out.z) < 1.8 || Math.hypot(P.x - d.in.x, P.z - d.in.z) < 1.8); if (!near && !d.locked) for (const n of NPCS) if (n.visible && (Math.hypot(n.x - d.out.x, n.z - d.out.z) < 1.6 || Math.hypot(n.x - d.in.x, n.z - d.in.z) < 1.6)) { near = true; break; }
    d.locked = !d.lockSeg ? false : !d.lockSeg.off; d.open = lerp(d.open || 0, near ? 1 : 0, Math.min(1, dt * 6)); d.piv.rotation.y = d.open * 1.55; }
  const night = DAY.cur ? DAY.cur.night : 0, lamp = smooth((night - 0.25) / 0.5);
  if (VM.stained) VM.stained.emissiveIntensity = 0.15 + lamp * 0.9;
  for (const Lt of V.lights) if (Lt.type === 'lantern' && Lt.m) Lt.m.material.color.setRGB(lerp(0.35, 1.0, lamp), lerp(0.3, 0.82, lamp), lerp(0.25, 0.45, lamp));
  if (VM.fire) VM.fire.color.setHSL(0.07, 1, 0.55 + Math.sin(time.value * 10) * 0.05);
  V.festival.visible = !!S.fete && (DAY.h >= 16 || DAY.h < 1);
  for (const a of V.anim) if (a.type === 'cloth') a.m.rotation.x = Math.sin(time.value * 1.6 + a.m.position.x) * 0.03;
  Object.assign(SB, S); // écrit l'état dans la sauvegarde
}
export const BRULIFE = { S: () => SB, NPCS, CRIT: () => CRIT, SECRETS, discover: id => discover(id), ready: () => ready, proxies: PROXY };
