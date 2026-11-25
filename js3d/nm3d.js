// =====================================================================
//  VÉLORNE 3D — MODÈLES 3D DES TRANSFORMATIONS DES NOUVELLES MAGIES (25/11)
//  Modèles procéduraux en volume (géométrie construite en code) avec un squelette de groupes articulés animés à
//  chaque image : huit cous d'Orochi, ailes et queue du Phénix, colosse du Titan, queues et oreilles du Kitsune,
//  manteau, bras et présences des Dix Ombres, cornes, yeux et marques de la Possession, ailes / dragon complet /
//  hybride du Dragon divin, appendices et hôte du Léviathan, grandes formes des ultimes (huit têtes géantes, dévoreur).
//  Deux familles de modèles :
//   - les ATTACHES (cous, ailes, queues, cape, cornes, appendices) sont orientées vers la caméra, comme le personnage
//     dessiné : ce qui est « derrière » lui est réellement derrière, ce qui dépasse de sa silhouette reste visible ;
//   - les CORPS COMPLETS (Titan, Dragon, hybride) remplacent le personnage et sont orientés selon la visée.
//  Transitions : croissance à l'apparition, retrait à la fin. Caméra reculée pour les grandes formes.
//  Niveau de détail réduit sur mobile. Ce module ne change aucune mécanique : il lit l'état du jeu et dessine.
// =====================================================================
import { THREE, scene, camera, MOBILE } from '../assets/demo/v4/core.js';
import { groundH } from './world3d.js';
import { MAGIC3D } from './magic3d.js';

const T = 32, m = v => v / T, TAU = Math.PI * 2, LOD = MOBILE ? 0.6 : 1, SEG = MOBILE ? 10 : 16;
const R = (a, b) => a + Math.random() * (b - a);
// ---------------- matériaux (partagés) ----------------
const MATS = new Map();
function mat(col, o = {}) { const k = col + JSON.stringify(o); let M = MATS.get(k); if (M) return M;
  if (o.glow) M = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: o.op ?? 0.85, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: o.side || THREE.FrontSide });
  else M = new THREE.MeshStandardMaterial({ color: col, roughness: o.r ?? 0.55, metalness: o.mt ?? 0.05, emissive: o.em || '#000000', emissiveIntensity: o.ei ?? 0.5, flatShading: !!o.flat, transparent: o.op != null, opacity: o.op ?? 1, side: o.side || THREE.FrontSide, depthWrite: o.op == null || o.op > 0.9 });
  MATS.set(k, M); return M; }
// ---------------- géométries ----------------
const G3 = {
  ball: new THREE.SphereGeometry(0.5, SEG, Math.round(SEG * 0.75)), cone: new THREE.ConeGeometry(0.5, 1, SEG), cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, SEG), box: new THREE.BoxGeometry(1, 1, 1),
  caps: new THREE.CapsuleGeometry(0.5, 1, 6, SEG), torus: new THREE.TorusGeometry(0.5, 0.06, 6, 28),
  feather: (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.2, 0.25, 0.2, 0.7, 0, 1); s.bezierCurveTo(-0.14, 0.7, -0.14, 0.25, 0, 0); return new THREE.ShapeGeometry(s, 10); })(),
  membrane: (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1, 0.1); s.quadraticCurveTo(0.82, -0.25, 0.92, -0.62); s.quadraticCurveTo(0.62, -0.42, 0.58, -0.86); s.quadraticCurveTo(0.34, -0.5, 0.2, -0.72); s.quadraticCurveTo(0.12, -0.35, 0, -0.42); s.lineTo(0, 0); return new THREE.ShapeGeometry(s, 10); })(),
  fin: (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.5, 0.15, 1, 0.9); s.quadraticCurveTo(0.55, 0.45, 0.1, 0.55); s.lineTo(0, 0); return new THREE.ShapeGeometry(s, 8); })(),
};
const mesh = (geo, M, sx = 1, sy = 1, sz = 1, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, M); o.scale.set(sx, sy, sz); o.position.set(x, y, z); return o; };
const grp = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
const rot = (o, x = 0, y = 0, z = 0) => { o.rotation.set(x, y, z); return o; };
// chaîne articulée (cou, queue, appendice, ruban) : n os enfants les uns des autres ; chaque os = un segment le long de +Y
function chain(n, len, r0, r1, M, o = {}) { const root = grp(), bones = []; let par = root;
  for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) : 0, r = r0 + (r1 - r0) * (o.ease ? Math.sin(u * Math.PI * 0.5) : u), b = grp(0, i ? len : 0, 0);
    const M2 = (o.tipM && i === n - 1) ? o.tipM : (o.alt && i % 2 ? o.alt : M); b.add(o.flat ? mesh(G3.box, M2, r * 2, len * 1.08, r * 0.18, 0, len / 2, 0) : mesh(G3.caps, M2, r * 2, len * 0.62, r * 2 * (o.flatZ || 1), 0, len / 2, 0));
    if (o.spike && i % 2 === 0) b.add(rot(mesh(G3.cone, o.spike, r * 0.8, r * 1.8, r * 0.8, 0, len * 0.5, -r * 1.05), -0.9));
    par.add(b); bones.push(b); par = b; }
  return { root, bones, tip: par }; }
// tête de reptile (Orochi, dragon, léviathan) : crâne, museau, mâchoire articulée, crocs, yeux lumineux, cornes
function reptileHead(Ms, Mb, eye, s, o = {}) { const h = grp();
  h.add(mesh(G3.ball, Ms, 0.46 * s, 0.36 * s, 0.56 * s, 0, 0.02 * s, 0)); h.add(rot(mesh(G3.caps, Ms, 0.15 * s, 0.32 * s, 0.13 * s, 0, 0, 0.36 * s), Math.PI / 2));
  h.add(rot(mesh(G3.box, Mb, 0.3 * s, 0.05 * s, 0.34 * s, 0, 0.12 * s, 0.12 * s), -0.15)); // arcade
  const jaw = grp(0, -0.06 * s, 0.02 * s); jaw.add(rot(mesh(G3.caps, Mb, 0.12 * s, 0.32 * s, 0.07 * s, 0, -0.03 * s, 0.3 * s), Math.PI / 2)); h.add(jaw);
  for (const sx of [-1, 1]) { h.add(mesh(G3.ball, eye, 0.1 * s, 0.07 * s, 0.07 * s, sx * 0.16 * s, 0.1 * s, 0.24 * s));
    for (let k = 0; k < 3; k++) { h.add(rot(mesh(G3.cone, Mb, 0.035 * s, 0.11 * s, 0.035 * s, sx * 0.08 * s, -0.09 * s, (0.3 + k * 0.1) * s), Math.PI)); jaw.add(mesh(G3.cone, Mb, 0.03 * s, 0.09 * s, 0.03 * s, sx * 0.07 * s, 0.02 * s, (0.3 + k * 0.1) * s)); }
    if (o.horns) { const hn = grp(sx * 0.15 * s, 0.16 * s, -0.12 * s); hn.rotation.set(-0.9, 0, sx * 0.3); let p = hn; for (let k = 0; k < 4; k++) { const sg = grp(0, k ? 0.13 * s : 0, 0); sg.rotation.x = -0.25; sg.add(mesh(G3.cone, Mb, (0.09 - k * 0.018) * s, 0.16 * s, (0.09 - k * 0.018) * s, 0, 0.07 * s, 0)); p.add(sg); p = sg; } h.add(hn); }
    if (o.frill) for (let k = 0; k < 3; k++) h.add(rot(mesh(G3.fin, o.frill, sx * 0.3 * s, 0.3 * s, 1, sx * 0.2 * s, 0.05 * s, (-0.15 - k * 0.1) * s), 0, sx * 1.3, 0)); }
  h.userData.jaw = jaw; return h; }

// ---------------- repères : position du joueur, face à la caméra ----------------
const LIVE = []; let HIDE = false, PALE = 0, CAMX = 0;
const P0 = () => G.player;
const ppos = () => { const P = P0(); const x = m(P.x), z = m(P.y); return [x, groundH(x, z), z]; };
const camYaw = (x, z) => Math.atan2(camera.position.x - x, camera.position.z - z); // +Z du groupe vers la caméra
const aimYaw = (P) => -(P.aim ?? 0) + Math.PI / 2; // +Z du groupe vers la visée
function place(o, face) { const P = P0(); const [x, y, z] = ppos(); o.g.position.set(x, y, z); o.g.rotation.y = face === 'aim' ? aimYaw(P) : camYaw(x, z); return [x, y, z]; }
let lastAtk = 0; const pulse = () => Math.max(0, 1 - (performance.now() - lastAtk) / 320);
const now = () => performance.now() / 1000;
function spawn(o) { scene.add(o.g); o.t = 0; o.k = 0; LIVE.push(o); return o; }
function kill(o) { scene.remove(o.g); }

// ================================================================ 1. OROCHI : huit cous dans le dos
function buildOrochi(big) {
  const Ms = mat('#557a38', { r: 0.38, mt: 0.15, em: '#142008', ei: 0.5 }), Ma = mat('#6f9446', { r: 0.36, mt: 0.15 }), Mb = mat('#d9c98a', { r: 0.5 }), eye = mat('#ffd84a', { glow: 1, op: 1 }), Mk = mat('#2a3a1c', { r: 0.6 });
  const g = grp(), necks = []; const N = 8, segs = Math.round((big ? 11 : 9) * LOD + 1), L = big ? 0.62 : 0.17, r0 = big ? 0.42 : 0.15, r1 = big ? 0.26 : 0.1;
  for (let i = 0; i < N; i++) { const side = i < 4 ? -1 : 1, j = i % 4; const c = chain(segs, L, r0, r1, Ms, { alt: Ma, spike: big ? Mk : null });
    if (!big) { c.root.position.set(side * (0.08 + j * 0.04), 0.95 + j * 0.05, -0.18); c.root.rotation.set(0, 0, -side * (0.35 + j * 0.28)); }
    const hd = reptileHead(Ms, Mb, eye, big ? 1.6 : 0.62, { horns: big, frill: big ? mat('#5f7438', { side: THREE.DoubleSide, r: 0.5 }) : null }); hd.position.y = L; c.tip.add(hd);
    g.add(c.root); necks.push({ c, hd, side, j, ph: i * 0.83 }); }
  if (!big) { g.add(mesh(G3.ball, Ms, 0.62, 0.36, 0.34, 0, 1.02, -0.16)); for (let k = 0; k < 6; k++) g.add(mesh(G3.ball, Ma, 0.14, 0.09, 0.06, (k - 2.5) * 0.09, 1.12, -0.02)); } // écailles des épaules
  return { g, necks, big };
}
function upOrochi(o) { place(o, 'cam'); const t = now(), pk = pulse();
  o.necks.forEach((n, i) => { const bite = (i === (o.bi | 0) % 8) ? pk : 0; const nb = n.c.bones.length; let tot = 0;
    n.c.bones.forEach((b, j) => { const u = j / (nb - 1); const bx = (j === 0 ? -0.25 : 0.05 + u * 0.12) + Math.sin(t * 1.5 + n.ph + j * 0.5) * 0.06 + bite * (u > 0.4 ? 0.22 : -0.05); b.rotation.x = bx; if (j) b.rotation.z = Math.sin(t * 1.2 + n.ph + j * 0.6) * 0.05; tot += bx; });
    n.hd.rotation.x = -tot + Math.PI / 2 - 0.15; n.hd.userData.jaw.rotation.x = 0.15 + Math.max(0, Math.sin(t * 2 + n.ph)) * 0.18 + bite * 0.75; });
  o.g.scale.setScalar(Math.max(0.01, o.k)); }
// ultime : huit cous géants surgissent en cercle autour de la cible puis convergent
function orochiUlt(tx, tz) { const o = buildOrochi(true); const cx = m(tx), cz = m(tz), gy = groundH(cx, cz); o.g.position.set(cx, gy, cz);
  o.necks.forEach((n, i) => { const a = i / 8 * TAU; n.c.root.position.set(Math.cos(a) * 3.6, -7, Math.sin(a) * 2.6); n.c.root.rotation.set(0, -a - Math.PI / 2, 0); });
  return spawn({ kind: 'orochiU', g: o.g, life: 3.8, up(dt) { const t = this.t; o.necks.forEach((n, i) => { const rise = Math.min(1, Math.max(0, (t - i * 0.17) / 0.45)); n.c.root.position.y = -7 + rise * 7; const conv = t > 1.6 ? Math.min(1, (t - 1.6) / 0.6) : 0; let tot = 0;
        n.c.bones.forEach((b, j) => { const bx = (j ? 0.05 + conv * 0.17 : -0.1) + Math.sin(t * 3 + j + i) * 0.04; b.rotation.x = bx; tot += bx; }); n.hd.rotation.x = -tot + Math.PI / 2; n.hd.userData.jaw.rotation.x = t > 2.1 && t < 2.5 ? 1.0 : 0.25; });
      if (t > 3.1) o.g.position.y = gy - (t - 3.1) * 12; } }); }

// ================================================================ 2. PHÉNIX : grandes ailes de feu, plumage d'épaule, queue de plumes
function buildPhenix() { const Mr = mat('#c8320e', { em: '#ff4a10', ei: 0.9, r: 0.5, side: THREE.DoubleSide }), Mo = mat('#ff8a1e', { em: '#ff7a10', ei: 1.0, r: 0.5, side: THREE.DoubleSide }), Mg = mat('#ffd060', { em: '#ffc040', ei: 1.1, r: 0.4, side: THREE.DoubleSide }), Fl = mat('#ffb040', { glow: 1, op: 0.35, side: THREE.DoubleSide });
  const g = grp(), wings = [];
  for (const sx of [-1, 1]) { const sh = grp(sx * 0.16, 1.08, -0.16), el = grp(sx * 0.42, 0.1, 0), tip = grp(sx * 0.45, 0.06, 0); sh.add(el); el.add(tip);
    sh.add(rot(mesh(G3.caps, Mr, 0.06, 0.38, 0.06, sx * 0.2, 0.05, 0), 0, 0, sx * Math.PI / 2));
    const rows = [[sh, 5, 0.42, Mr], [el, 6, 0.62, Mo], [tip, 6, 0.95, Mg]];
    for (const [par, n, len, M] of rows) for (let i = 0; i < Math.round(n * LOD + 1); i++) { const f = mesh(G3.feather, M, 0.42, len * (0.8 + i * 0.05), 1, sx * i * 0.07, 0, 0.01 * i); f.rotation.set(0, 0, sx * (Math.PI / 2 + 0.35 + i * 0.13)); par.add(f); const fl = mesh(G3.feather, Fl, 0.5, len * 1.15, 1, sx * i * 0.07, 0, 0.02 + 0.01 * i); fl.rotation.copy(f.rotation); par.add(fl); }
    g.add(sh); wings.push({ sh, el, tip, sx }); }
  const tail = []; for (let i = 0; i < 5; i++) { const c = chain(Math.round(4 * LOD + 2), 0.2, 0.05, 0.03, Mo, { tipM: Mg }); c.root.position.set((i - 2) * 0.06, 0.62, -0.18); c.root.rotation.set(-2.5, 0, (i - 2) * 0.32); c.tip.add(mesh(G3.feather, Mg, 0.35, 0.55, 1, 0, 0.18, 0)); g.add(c.root); tail.push(c); }
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const f = mesh(G3.feather, i % 2 ? Mo : Mg, 0.22, 0.34, 1, sx * (0.16 + i * 0.05), 1.16, -0.04); f.rotation.set(-0.3, 0, sx * (1.1 + i * 0.22)); g.add(f); }
  return { g, wings, tail }; }
function upPhenix(o) { const P = P0(); const [x, y, z] = place(o, 'cam'); const t = now(); o.g.position.y = y + Math.sin(t * 3) * 0.03;
  const flap = Math.sin(t * (P.state === 'roll' ? 14 : 4.5)); o.wings.forEach(w => { w.sh.rotation.set(-0.25, w.sx * 0.35, w.sx * (0.35 + flap * 0.32)); w.el.rotation.z = w.sx * (0.05 + flap * 0.22); w.tip.rotation.z = w.sx * (-0.05 + flap * 0.18); });
  o.tail.forEach((c, i) => c.bones.forEach((b, j) => { if (j) { b.rotation.z = Math.sin(t * 3 + i + j * 0.8) * 0.12; b.rotation.x = 0.1; } }));
  o.g.scale.setScalar(Math.max(0.01, o.k)); if (Math.random() < 0.6) MAGIC3D.emit('phenix', x + R(-0.9, 0.9), y + R(0.8, 1.6), z + R(-0.4, 0.4), { k: 0.8 }); }

// ================================================================ 3 / 11. COLOSSE : Titan et hybride humanoïde-dragon (ultime du Dragon divin)
function buildColossus(kind) { const dra = kind === 'dragonu';
  const Mskin = dra ? mat('#d8b65a', { r: 0.32, mt: 0.55, em: '#3a2a08', ei: 0.3 }) : mat('#b88a76', { r: 0.62, mt: 0.02 }), Mshade = dra ? mat('#9a7a30', { r: 0.4, mt: 0.5 }) : mat('#9a6e5e', { r: 0.7 });
  const Mcloth = dra ? mat('#f2ead2', { r: 0.6, mt: 0.2 }) : mat('#4a3a52', { r: 0.85 }), Mmetal = dra ? mat('#fff0b8', { r: 0.25, mt: 0.85 }) : mat('#8a7898', { r: 0.35, mt: 0.7 }), Mglow = mat(dra ? '#fff4c8' : '#d8b8ff', { glow: 1, op: 0.85 }), Mhair = mat(dra ? '#f6f0e0' : '#2a1e2a', { r: 0.9 });
  const g = grp(), body = grp(); g.add(body); const S = dra ? 1.3 : 1.45; body.scale.setScalar(S);
  const hips = grp(0, 0.92, 0); body.add(hips); hips.add(mesh(G3.ball, Mshade, 0.56, 0.32, 0.36)); hips.add(rot(mesh(G3.torus, Mmetal, 0.62, 0.62, 1.2, 0, 0.08, 0), Math.PI / 2));
  hips.add(mesh(G3.box, Mcloth, 0.34, 0.42, 0.04, 0, -0.18, 0.17)); hips.add(mesh(G3.box, Mcloth, 0.4, 0.36, 0.04, 0, -0.16, -0.17)); // pagne
  const torso = grp(0, 0.1, 0); hips.add(torso);
  torso.add(mesh(G3.caps, Mskin, 0.42, 0.28, 0.3, 0, 0.3, 0)); torso.add(mesh(G3.ball, Mskin, 0.78, 0.5, 0.46, 0, 0.66, 0)); // abdomen, cage thoracique
  for (const sx of [-1, 1]) { torso.add(mesh(G3.ball, Mshade, 0.32, 0.22, 0.16, sx * 0.17, 0.7, 0.17)); torso.add(mesh(G3.ball, Mskin, 0.32, 0.3, 0.3, sx * 0.44, 0.84, 0)); } // pectoraux, deltoïdes
  for (let k = 0; k < 3; k++) for (const sx of [-1, 1]) torso.add(mesh(G3.ball, Mshade, 0.11, 0.08, 0.06, sx * 0.07, 0.24 + k * 0.1, 0.15)); // abdominaux
  for (let i = 0; i < 4; i++) torso.add(rot(mesh(G3.box, Mglow, 0.025, 0.2, 0.01, (i - 1.5) * 0.14, 0.52 + (i % 2) * 0.06, 0.24), 0, 0, (i - 1.5) * 0.25)); // marques lumineuses
  if (dra) for (let i = 0; i < 7; i++) torso.add(rot(mesh(G3.cone, Mmetal, 0.07, 0.16, 0.07, 0, 0.4 + i * 0.09, -0.24), -1.1)); // crête dorsale
  const neck = grp(0, 0.95, 0); torso.add(neck); neck.add(mesh(G3.cyl, Mskin, 0.2, 0.14, 0.2, 0, 0.05, 0)); let head;
  if (dra) { head = reptileHead(Mskin, Mmetal, mat('#fff3b0', { glow: 1, op: 1 }), 0.62, { horns: true }); head.position.set(0, 0.2, 0.06); neck.add(head); }
  else { head = grp(0, 0.24, 0); head.add(mesh(G3.ball, Mskin, 0.3, 0.34, 0.31)); head.add(mesh(G3.ball, Mhair, 0.33, 0.2, 0.33, 0, 0.1, -0.03)); head.add(mesh(G3.box, Mshade, 0.24, 0.05, 0.06, 0, 0.05, 0.13)); head.add(mesh(G3.ball, Mshade, 0.2, 0.14, 0.14, 0, -0.12, 0.08));
    for (const sx of [-1, 1]) head.add(mesh(G3.ball, Mglow, 0.05, 0.03, 0.02, sx * 0.07, 0.02, 0.15)); for (let k = 0; k < 5; k++) head.add(rot(mesh(G3.cone, Mhair, 0.07, 0.24, 0.07, (k - 2) * 0.06, 0.18, -0.08 - Math.abs(k - 2) * 0.02), -0.6 - Math.abs(k - 2) * 0.1, 0, (k - 2) * 0.25)); neck.add(head); }
  const limb = (par, x, y, up, lo, r, arm) => { const a = grp(x, y, 0); par.add(a); a.add(mesh(G3.caps, Mskin, r, up * 0.6, r * 0.95, 0, -up / 2, 0)); const b = grp(0, -up, 0); a.add(b); b.add(mesh(G3.ball, Mskin, r * 1.6, r * 1.4, r * 1.5)); b.add(mesh(G3.caps, Mskin, r * (arm ? 1.05 : 0.9), lo * 0.6, r * (arm ? 1.0 : 0.9), 0, -lo / 2, 0));
    if (arm) { b.add(mesh(G3.cyl, Mmetal, r * 2.15, lo * 0.3, r * 2.15, 0, -lo * 0.62, 0)); const hand = grp(0, -lo - r * 0.5, 0); hand.add(mesh(G3.ball, Mskin, r * 2.1, r * 2.0, r * 1.9)); hand.add(mesh(G3.caps, Mskin, r * 0.55, r * 0.8, r * 0.55, r * 0.9, 0.02, r * 0.6)); b.add(hand); return { a, b, hand }; }
    b.add(mesh(G3.cyl, Mmetal, r * 1.95, lo * 0.2, r * 1.95, 0, -lo * 0.72, 0)); b.add(mesh(G3.ball, Mshade, r * 2.1, r * 1.1, r * 3.0, 0, -lo - r * 0.3, r * 0.6)); return { a, b }; };
  const armL = limb(torso, -0.54, 0.86, 0.4, 0.38, 0.15, 1), armR = limb(torso, 0.54, 0.86, 0.4, 0.38, 0.15, 1), legL = limb(hips, -0.21, -0.1, 0.42, 0.42, 0.19), legR = limb(hips, 0.21, -0.1, 0.42, 0.42, 0.19);
  let wings = null, tail = null;
  if (dra) { const Mm = mat('#f6e6b0', { side: THREE.DoubleSide, r: 0.5, em: '#a07818', ei: 0.35, op: 0.92 }), Md = mat('#a88638', { r: 0.4, mt: 0.5 }); wings = [];
    for (const sx of [-1, 1]) { const W = dragonWing(sx, 1.5, Md, Mm); W.w.position.set(sx * 0.22, 0.85, -0.22); torso.add(W.w); wings.push({ ...W, sx }); }
    tail = chain(Math.round(8 * LOD + 2), 0.22, 0.13, 0.03, Mskin, { spike: Mmetal }); tail.root.position.set(0, 0, -0.2); tail.root.rotation.x = -2.0; hips.add(tail.root); }
  return { g, body, hips, torso, head, armL, armR, legL, legR, wings, tail, S }; }
function upColossus(o, dt) { const P = P0(); place(o, 'aim'); const t = now();
  const dx = P.x - (o.lx ?? P.x), dy = P.y - (o.ly ?? P.y); o.lx = P.x; o.ly = P.y; const sp = Math.min(1, Math.hypot(dx, dy) / Math.max(dt, 1e-3) / 90); o.sp = (o.sp || 0) + (sp - (o.sp || 0)) * Math.min(1, dt * 8); o.ph = (o.ph || 0) + dt * (2 + o.sp * 4);
  const w = Math.sin(o.ph) * 0.55 * o.sp, pk = pulse();
  o.legL.a.rotation.x = w; o.legR.a.rotation.x = -w; o.legL.b.rotation.x = Math.max(0, -w) * 0.9; o.legR.b.rotation.x = Math.max(0, w) * 0.9;
  o.armL.a.rotation.set(-w * 0.6, 0, 0.18); o.armR.a.rotation.set(w * 0.6 - pk * 1.7, 0, -0.18 - pk * 0.2); o.armR.b.rotation.x = -pk * 0.5 - 0.2; o.armL.b.rotation.x = -0.25;
  o.hips.position.y = 0.92 + Math.abs(Math.sin(o.ph)) * 0.05 * o.sp; o.torso.rotation.set(0.06 + Math.sin(t * 1.4) * 0.015 + pk * 0.08, -w * 0.15 + pk * 0.35, 0);
  if (o.wings) o.wings.forEach(v => { const f = Math.sin(t * 2.4); v.w.rotation.set(-0.15, v.sx * 0.5, v.sx * (0.35 + f * 0.15)); v.fore.rotation.z = v.sx * f * 0.15; }); if (o.tail) o.tail.bones.forEach((b, j) => { if (j) b.rotation.z = Math.sin(t * 2 + j * 0.7) * 0.12; });
  if (o.head.userData.jaw) o.head.userData.jaw.rotation.x = 0.1 + pk * 0.6;
  o.body.scale.setScalar(o.S * (0.2 + 0.8 * o.k)); }

// ================================================================ 4. KITSUNE : queues (selon la maîtrise), oreilles, marques
function buildKitsune() { const Mw = mat('#f8f1e6', { r: 0.95 }), Mo = mat('#e8742a', { r: 0.9 }), Mr = mat('#c42a2a', { r: 0.8, em: '#400000', ei: 0.3 }), Mg = mat('#ffd36a', { glow: 1, op: 0.55 });
  const P = P0(); const lv = typeof magLevel === 'function' ? magLevel(P, 'kitsune') : 5; const n = Math.max(1, Math.min(9, Math.round(1 + lv * 0.8)));
  const g = grp(), tails = [];
  for (let i = 0; i < n; i++) { const c = chain(Math.round(7 * LOD + 1), 0.16, 0.09, 0.14, Mo, { ease: 1, tipM: Mw }); const spread = Math.min(2.4, 0.7 + n * 0.2), a = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread; c.root.position.set(Math.sin(a) * 0.05, 0.58, -0.2); c.root.rotation.set(-0.35, 0, a);
    for (let k = 2; k < c.bones.length; k++) c.bones[k].add(mesh(G3.ball, k > c.bones.length - 3 ? Mw : Mo, 0.26, 0.22, 0.24, 0, 0.08, 0)); c.tip.add(mesh(G3.ball, Mg, 0.32, 0.32, 0.32, 0, 0.2, 0)); g.add(c.root); tails.push({ c, a, ph: i * 0.7 }); }
  const head = grp(0, 1.42, 0.02);
  for (const sx of [-1, 1]) { const ear = grp(sx * 0.13, 0.06, 0); ear.rotation.z = -sx * 0.3; ear.add(mesh(G3.cone, Mw, 0.16, 0.3, 0.08, 0, 0.13, 0)); ear.add(mesh(G3.cone, Mr, 0.08, 0.2, 0.03, 0, 0.11, 0.035)); head.add(ear); }
  for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) g.add(rot(mesh(G3.box, Mr, 0.09, 0.015, 0.01, sx * 0.09, 0.98 - k * 0.04, 0.2), 0, 0, -sx * 0.2)); // marques des joues
  g.add(head); return { g, tails, head }; }
function upKitsune(o) { place(o, 'cam'); const t = now(), pk = pulse();
  o.tails.forEach((q, i) => q.c.bones.forEach((b, j) => { if (!j) return; b.rotation.x = -0.16 + Math.sin(t * 1.6 + j) * 0.04 + (i === (o.bi | 0) % o.tails.length ? -pk * 0.3 : 0); b.rotation.z = Math.sin(t * 2 + q.ph + j * 0.5) * 0.12; }));
  o.head.rotation.z = Math.sin(t * 2) * 0.03; o.g.scale.setScalar(Math.max(0.01, o.k)); if (Math.random() < 0.15) { const [x, y, z] = ppos(); MAGIC3D.emit('kitsune', x + R(-0.8, 0.8), y + R(0.6, 1.8), z + R(-0.3, 0.3), { k: 0.6 }); } }

// ================================================================ 5. DIX OMBRES : manteau d'ombre, bras d'ombre griffus, dix présences
function buildShadows() { const Md = mat('#120a1c', { r: 1, em: '#06020c', ei: 0.5 }), Mc = mat('#1e1430', { r: 0.95, side: THREE.DoubleSide }), Mg = mat('#a890ff', { glow: 1, op: 0.75 });
  const g = grp(), cape = []; const cols = Math.round(6 * LOD + 3);
  for (let i = 0; i < cols; i++) { const u = i / (cols - 1) - 0.5; const c = chain(6, 0.22, 0.13, 0.17, Mc, { flat: 1 }); c.root.position.set(u * 0.6, 1.18, -0.2 - Math.cos(u * 3) * 0.04); c.root.rotation.set(Math.PI + 0.12, 0, -u * 0.5); g.add(c.root); cape.push({ c, ph: i * 0.6, u }); }
  const arms = []; for (const sx of [-1, 1]) { const c = chain(Math.round(4 * LOD + 1), 0.13, 0.065, 0.04, Md); c.root.position.set(sx * 0.32, 1.05, -0.1); c.root.rotation.set(-0.3, 0, -sx * 2.35); for (let k = -1; k <= 1; k++) c.tip.add(rot(mesh(G3.cone, Mg, 0.03, 0.18, 0.03, k * 0.04, 0.26, 0), 0, 0, k * 0.4)); g.add(c.root); arms.push({ c, sx }); }
  const pres = []; for (let i = 0; i < 10; i++) { const s = grp(); s.add(mesh(G3.ball, Md, 0.4, 0.34, 0.62, 0, 0.36, 0)); s.add(mesh(G3.ball, Md, 0.26, 0.24, 0.3, 0, 0.5, 0.32)); for (const sx of [-1, 1]) { s.add(mesh(G3.ball, Mg, 0.06, 0.05, 0.05, sx * 0.07, 0.55, 0.45)); s.add(rot(mesh(G3.cone, Md, 0.08, 0.2, 0.08, sx * 0.08, 0.68, 0.28), -0.3)); for (const fz of [0.18, -0.18]) s.add(mesh(G3.caps, Md, 0.07, 0.24, 0.07, sx * 0.12, 0.14, fz)); } s.visible = false; g.add(s); pres.push(s); }
  return { g, cape, arms, pres }; }
function upShadows(o) { const [x, y, z] = place(o, 'cam'); const t = now(), pk = pulse();
  o.cape.forEach(q => q.c.bones.forEach((b, j) => { if (!j) return; b.rotation.x = -0.06 + Math.sin(t * 2.2 + q.ph + j * 0.7) * 0.09; b.rotation.z = q.u * 0.08 + Math.sin(t * 1.7 + q.ph) * 0.04; }));
  o.arms.forEach(a => a.c.bones.forEach((b, j) => { if (!j) return; b.rotation.x = 0.08 + Math.sin(t * 2 + j + a.sx) * 0.1 - pk * 0.25; b.rotation.z = a.sx * (0.18 + Math.sin(t * 1.5 + j) * 0.06); }));
  const show = typeof NM !== 'undefined' && (NM.dxShow || 0) > performance.now(); o.pres.forEach((s, i) => { s.visible = show; if (show) { const a = i / 10 * TAU + t * 0.6; s.position.set(Math.cos(a) * 1.6, 0, Math.sin(a) * 1.1); s.rotation.y = -a; } });
  o.g.scale.setScalar(Math.max(0.01, o.k)); if (Math.random() < 0.35) MAGIC3D.emit('dixombres', x + R(-0.5, 0.5), y + R(0.1, 1.2), z + R(-0.4, 0.2), { k: 0.8 }); }

// ================================================================ 10. POSSESSION : cornes ancestrales, yeux rouges, marques, aura blanche et rouge
function buildPossession(level) { const Mh = mat('#f6f2ee', { r: 0.35, em: '#2a0006', ei: 0.15 }), Mt = mat('#2a0a10', { r: 0.6 }), Me = mat('#ff1428', { glow: 1, op: 1 }), Mm = mat('#ff2a3a', { glow: 1, op: 0.8 }), Mw = mat('#ffffff', { glow: 1, op: 0.22, side: THREE.DoubleSide }), Mr = mat('#ff2a3a', { glow: 1, op: 0.18, side: THREE.DoubleSide });
  const g = grp(), big = level >= 2, s = big ? 1 : 0.6; const head = grp(0, 1.4, 0.04); g.add(head);
  const horn = (sx, len, n, curl) => { const h = grp(sx * 0.11, 0.06, 0); h.rotation.set(-0.35, 0, -sx * 0.55); let p = h; for (let k = 0; k < n; k++) { const sg = grp(0, k ? len / n : 0, 0); sg.rotation.set(-curl, 0, -sx * 0.08); const r = 0.075 * s * (1 - k / n * 0.8); sg.add(mesh(G3.cone, k === n - 1 ? Mt : Mh, r * 2, len / n * 1.15, r * 2, 0, len / n * 0.5, 0)); p.add(sg); p = sg; } head.add(h); return h; };
  for (const sx of [-1, 1]) { horn(sx, 0.5 * s, 5, 0.32); if (big) { const h2 = horn(sx, 0.24, 4, 0.5); h2.position.set(sx * 0.17, -0.02, -0.03); h2.rotation.set(-0.8, 0, -sx * 1.2); } }
  const eyes = grp(0, 1.03, 0.16); for (const sx of [-1, 1]) { eyes.add(mesh(G3.ball, Me, 0.06, 0.035, 0.02, sx * 0.075, 0, 0)); eyes.add(mesh(G3.ball, Mr, 0.16, 0.08, 0.02, sx * 0.075, 0, -0.005)); } g.add(eyes);
  const marks = []; const nm = big ? 3 : 1; for (let i = 0; i < nm; i++) { const r = mesh(G3.torus, Mm, 0.62 + i * 0.08, 0.62 + i * 0.08, 0.12, 0, 0.5 + i * 0.32, 0); r.rotation.x = Math.PI / 2; g.add(r); marks.push(r); }
  if (big) { const sig = grp(0, 1.05, -0.3); for (let k = 0; k < 6; k++) sig.add(rot(mesh(G3.box, Mm, 0.7, 0.02, 0.01), 0, 0, k / 6 * Math.PI)); sig.add(mesh(G3.torus, Mm, 0.9, 0.9, 0.2)); g.add(sig); marks.push(sig); }
  const flames = []; if (big) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, f = mesh(G3.cone, i % 2 ? Mr : Mw, 0.22, 0.9, 0.06, Math.cos(a) * 0.4, 0.45, Math.sin(a) * 0.22); f.rotation.y = -a; g.add(f); flames.push({ f, ph: i }); }
  return { g, head, marks, flames, level }; }
function upPossession(o) { const [x, y, z] = place(o, 'cam'); const t = now();
  o.marks.forEach((r, i) => { if (r.isMesh) r.rotation.z = t * (1 + i * 0.5) * (i % 2 ? -1 : 1); else r.rotation.z = t * 0.6; });
  o.flames.forEach(q => { const k = 0.7 + Math.sin(t * 9 + q.ph * 1.7) * 0.3; q.f.scale.set(0.22, 0.9 * k + 0.3, 0.06); });
  if (o.level >= 2 && Math.random() < 0.7) MAGIC3D.emit('possession', x + R(-0.5, 0.5), y + R(0.2, 1.6), z + R(-0.3, 0.3), { k: 0.8, col: Math.random() < 0.5 ? '#ffffff' : '#ff2a3a' }); o.g.scale.setScalar(Math.max(0.01, o.k)); }

// ================================================================ 11. DRAGON : ailes sur le joueur (Ascension) ou dragon complet (Incarnation)
function dragonWing(sx, s, Mb, Mm) { const w = grp(); const arm = grp(); w.add(arm); arm.add(rot(mesh(G3.caps, Mb, 0.05 * s, 0.5 * s, 0.05 * s, sx * 0.3 * s, 0, 0), 0, 0, sx * Math.PI / 2));
  const fore = grp(sx * 0.6 * s, 0, 0); arm.add(fore); fore.add(rot(mesh(G3.caps, Mb, 0.04 * s, 0.5 * s, 0.04 * s, sx * 0.3 * s, 0.05 * s, 0), 0, 0, sx * (Math.PI / 2 - 0.2)));
  for (let k = 0; k < 4; k++) fore.add(rot(mesh(G3.caps, Mb, 0.025 * s, 0.55 * s, 0.025 * s, sx * (0.55 - k * 0.12) * s, -0.35 * s, 0.01), 0, 0, sx * (0.5 - k * 0.32)));
  fore.add(rot(mesh(G3.cone, Mb, 0.06 * s, 0.16 * s, 0.06 * s, sx * 0.62 * s, 0.12 * s, 0), 0, 0, -sx * 0.6));
  fore.add(mesh(G3.membrane, Mm, sx * 1.25 * s, 1.15 * s, 1, 0, 0, -0.005)); fore.add(mesh(G3.membrane, Mm, sx * 0.7 * s, 0.7 * s, 1, -sx * 0.55 * s, 0, -0.005));
  return { w, arm, fore }; }
function buildDragon(full) { const Ms = mat('#d8b65a', { r: 0.3, mt: 0.6, em: '#3a2808', ei: 0.3 }), Md = mat('#a88638', { r: 0.4, mt: 0.5 }), Mb = mat('#fff4cc', { r: 0.35, mt: 0.3 }), Mm = mat('#f4e2a6', { side: THREE.DoubleSide, r: 0.5, em: '#8a6010', ei: 0.4, op: 0.93 }), eye = mat('#fff3b0', { glow: 1, op: 1 });
  const g = grp(), wings = []; let neck = null, head = null, tail = null, body = null; const legs = [];
  if (!full) { for (const sx of [-1, 1]) { const W = dragonWing(sx, 1.25, Md, Mm); W.w.position.set(sx * 0.14, 1.12, -0.18); g.add(W.w); wings.push({ ...W, sx }); }
    tail = chain(Math.round(7 * LOD + 1), 0.17, 0.08, 0.02, Ms, { spike: Mb }); tail.root.position.set(0, 0.55, -0.16); tail.root.rotation.x = -2.3; g.add(tail.root);
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) g.add(rot(mesh(G3.cone, Mb, 0.03, 0.12, 0.03, sx * (0.3 + k * 0.03), 0.66, 0.15), 0.6)); // griffes
    return { g, wings, tail, full }; }
  body = grp(0, 1.5, 0); g.add(body);
  body.add(rot(mesh(G3.caps, Ms, 0.85, 1.25, 0.85, 0, 0, 0), Math.PI / 2)); body.add(rot(mesh(G3.caps, Mb, 0.56, 1.1, 0.4, 0, -0.28, 0.05), Math.PI / 2)); // corps et ventre
  for (let i = 0; i < 8; i++) body.add(rot(mesh(G3.cone, Mb, 0.12, 0.28, 0.12, 0, 0.5, 0.6 - i * 0.18), -0.5)); // crête
  neck = chain(Math.round(6 * LOD + 1), 0.3, 0.3, 0.2, Ms, { spike: Mb }); neck.root.position.set(0, 0.25, 0.75); neck.root.rotation.x = 0.85; body.add(neck.root);
  head = reptileHead(Ms, Mb, eye, 1.15, { horns: true }); head.position.y = 0.3; neck.tip.add(head);
  tail = chain(Math.round(9 * LOD + 2), 0.36, 0.26, 0.04, Ms, { spike: Mb }); tail.root.position.set(0, 0, -0.75); tail.root.rotation.x = -1.8; body.add(tail.root);
  for (const sx of [-1, 1]) { const W = dragonWing(sx, 2.6, Md, Mm); W.w.position.set(sx * 0.42, 0.35, 0.2); body.add(W.w); wings.push({ ...W, sx });
    for (const fz of [0.5, -0.45]) { const L = grp(sx * 0.45, -0.25, fz); L.add(mesh(G3.caps, Ms, 0.24, 0.42, 0.26, 0, -0.3, 0)); const f = grp(0, -0.62, 0); f.add(mesh(G3.caps, Ms, 0.16, 0.38, 0.17, 0, -0.28, 0.06)); for (let k = -1; k <= 1; k++) f.add(rot(mesh(G3.cone, Mb, 0.06, 0.18, 0.06, k * 0.07, -0.6, 0.2), 1.3)); L.add(f); body.add(L); legs.push({ L, f, ph: (sx > 0 ? 0 : Math.PI) + (fz > 0 ? 0 : Math.PI / 2) }); } }
  return { g, wings, tail, neck, head, legs, body, full }; }
function upDragon(o, dt) { const P = P0(); const t = now(), pk = pulse();
  if (!o.full) { place(o, 'cam'); o.wings.forEach(v => { const f = Math.sin(t * 3); v.w.rotation.set(-0.25, v.sx * 0.45, v.sx * (0.45 + f * 0.25)); v.fore.rotation.z = v.sx * (0.1 + f * 0.2); }); o.tail.bones.forEach((b, j) => { if (j) { b.rotation.z = Math.sin(t * 2.5 + j * 0.7) * 0.15; b.rotation.x = 0.06; } }); o.g.scale.setScalar(Math.max(0.01, o.k)); return; }
  place(o, 'aim'); const dx = P.x - (o.lx ?? P.x), dy = P.y - (o.ly ?? P.y); o.lx = P.x; o.ly = P.y; const sp = Math.min(1, Math.hypot(dx, dy) / Math.max(dt, 1e-3) / 90); o.sp = (o.sp || 0) + (sp - (o.sp || 0)) * Math.min(1, dt * 6);
  o.body.position.y = 1.85 + Math.sin(t * 2.2) * 0.12 + o.sp * 0.5; o.body.rotation.x = -o.sp * 0.12;
  const flap = Math.sin(t * (3 + o.sp * 3)); o.wings.forEach(v => { v.w.rotation.set(0, v.sx * 0.1, v.sx * (0.2 + flap * 0.5)); v.fore.rotation.z = v.sx * flap * 0.3; });
  let tot = 0; o.neck.bones.forEach((b, j) => { if (!j) return; const bx = -0.1 + Math.sin(t * 1.6 + j * 0.6) * 0.05 - pk * 0.08; b.rotation.x = bx; tot += bx; }); o.head.rotation.x = 0.7 - tot * 0.5; o.head.userData.jaw.rotation.x = 0.12 + pk * 0.8 + (typeof NM !== 'undefined' && NM.breath3d > performance.now() ? 0.7 : 0);
  o.tail.bones.forEach((b, j) => { if (j) { b.rotation.z = Math.sin(t * 2 + j * 0.6) * 0.14; b.rotation.x = 0.06; } }); o.legs.forEach(l => { l.L.rotation.x = Math.sin(t * 3 + l.ph) * 0.4 * o.sp + 0.35 * (1 - o.sp); l.f.rotation.x = -0.6; });
  o.g.scale.setScalar(0.25 + 0.75 * o.k); }

// ================================================================ 12. LÉVIATHAN : plaques, nageoires, appendices ; hôte complet ; dévoreur (ultime)
function buildLeviathan(full) { const Mb = mat('#e2d8c2', { r: 0.6 }), Mk = mat('#0c3a4e', { r: 0.35, mt: 0.25, em: '#021018', ei: 0.4 }), Mk2 = mat('#145a6e', { r: 0.35, mt: 0.2 }), Ml = mat('#3fe0d0', { glow: 1, op: 0.95 }), Mf = mat('#1d7a8a', { side: THREE.DoubleSide, op: 0.8, r: 0.3, em: '#0e4a50', ei: 0.4 });
  const g = grp(), apps = []; const n = full ? 6 : 4, s = full ? 1.5 : 1;
  for (let i = 0; i < n; i++) { const c = chain(Math.round((full ? 10 : 7) * LOD + 1), 0.2 * s, 0.1 * s, 0.025 * s, Mk, { alt: Mk2, tipM: Ml }); const side = i % 2 ? 1 : -1, j = Math.floor(i / 2); c.root.position.set(side * (0.1 + j * 0.05), 1.0 - j * 0.12, -0.2); c.root.rotation.set(-0.3, 0, -side * (0.7 + j * 0.45));
    c.bones.forEach((b, k) => { if (k % 2) b.add(mesh(G3.ball, Ml, 0.04 * s, 0.04 * s, 0.04 * s, 0, 0.1 * s, 0.07 * s)); }); g.add(c.root); apps.push({ c, ph: i * 1.1, side }); }
  for (let i = 0; i < 5; i++) g.add(rot(mesh(G3.box, Mb, 0.46 - i * 0.05, 0.07, 0.16, 0, 1.28 - i * 0.17, -0.2), 0.2)); // plaques osseuses dorsales
  for (let i = 0; i < 5; i++) g.add(rot(mesh(G3.cone, Mb, 0.07, 0.24 * s, 0.07, 0, 1.38 - i * 0.17, -0.3), -0.7)); // épines
  for (const sx of [-1, 1]) { const fin = mesh(G3.fin, Mf, sx * 0.6 * s, 0.6 * s, 1, sx * 0.26, 1.05, -0.12); fin.rotation.set(0, sx * 0.5, sx * 0.2); g.add(fin); const fa = mesh(G3.fin, Mf, sx * 0.35, 0.3, 1, sx * 0.38, 0.75, 0); fa.rotation.y = sx * 0.9; g.add(fa); for (let k = 0; k < 4; k++) g.add(mesh(G3.ball, Ml, 0.035, 0.035, 0.035, sx * 0.2, 0.62 + k * 0.17, 0.18)); }
  if (full) for (let k = 0; k < 7; k++) g.add(rot(mesh(G3.cone, Mb, 0.08, 0.36, 0.08, (k - 3) * 0.1, 1.62 - Math.abs(k - 3) * 0.04, -0.14), -0.4, 0, (k - 3) * 0.22)); // couronne d'os
  return { g, apps, full }; }
function upLeviathan(o) { const [x, y, z] = place(o, 'cam'); const t = now(), pk = pulse();
  o.apps.forEach((q, i) => q.c.bones.forEach((b, j) => { if (!j) return; b.rotation.x = 0.02 + Math.cos(t * 1.4 + j * 0.4 + q.ph) * 0.1 - (i === (o.bi | 0) % o.apps.length ? pk * 0.3 : 0); b.rotation.z = q.side * -0.06 + Math.sin(t * 1.8 + q.ph + j * 0.55) * 0.2; }));
  o.g.scale.setScalar(Math.max(0.01, o.k)); if (Math.random() < 0.35) MAGIC3D.emit('leviathan', x + R(-0.7, 0.7), y + R(0.3, 1.6), z + R(-0.4, 0.3), { k: 0.6 }); }
function devourer(tx, tz) { const Mk = mat('#0c3a4e', { r: 0.35, mt: 0.25 }), Mb = mat('#e8e0cc', { r: 0.6 }), eye = mat('#3fe0d0', { glow: 1, op: 1 }); const cx = m(tx), cz = m(tz), gy = groundH(cx, cz);
  const g = grp(cx, gy, cz), body = chain(Math.round(12 * LOD + 2), 0.9, 0.95, 0.35, Mk, { spike: Mb }); body.root.position.set(-6, -4, 0); body.root.rotation.set(0, 0, -0.9); g.add(body.root); const hd = reptileHead(Mk, Mb, eye, 3.4, { frill: mat('#1d7a8a', { side: THREE.DoubleSide }) }); hd.position.y = 0.9; body.tip.add(hd);
  const jaws = []; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3, jw = reptileHead(Mk, Mb, eye, 1.5, {}); jw.position.set(Math.cos(a) * m(75), -3, Math.sin(a) * m(44)); jw.rotation.set(-Math.PI / 2, 0, 0); g.add(jw); jaws.push({ jw, d: 0.5 + i * 0.26 }); }
  return spawn({ kind: 'devour', g, life: 3.6, up(dt) { const t = this.t; body.root.position.y = -4 + Math.min(1, t / 0.8) * 3.4 - (t > 3 ? (t - 3) * 8 : 0); body.bones.forEach((b, j) => { if (j) b.rotation.z = 0.12 + Math.sin(t * 2 + j * 0.5) * 0.05; }); hd.userData.jaw.rotation.x = t > 1.9 && t < 2.4 ? 0.95 : 0.2;
      jaws.forEach(q => { const u = t - q.d; q.jw.position.y = u < 0 ? -3 : u < 0.5 ? -3 + Math.sin(Math.min(1, u / 0.35) * Math.PI / 2) * 3.3 : 0.3 - (u - 0.5) * 6; q.jw.userData.jaw.rotation.x = u > 0.25 && u < 0.5 ? 0.15 : 0.95; }); } }); }

// ================================================================ formes des ultimes et des compétences, particules des familles
function registerUlts() { const F = MAGIC3D.FORMS3D; if (!F || !F.ULT) return; const U = F.ULT;
  U.orochi = c => { F.runeCircle('orochi', c.tx, c.tz, { r: 3.4, n: 8 }); };
  U.phenix = c => { F.wings('phenix', c.px, c.pz, { a: c.a, bird: 1, s: 2.2, life: 2.4 }); F.sun('phenix', c.px, c.pz, { s: 1.6, y: 1.2 }); };
  U.titan = c => { F.cracks('titan', c.px, c.pz, { chunks: 1 }); };
  U.kitsune = c => { F.runeCircle('kitsune', c.px, c.pz, { r: 3.6, n: 9, life: 2.4 }); };
  U.dixombres = c => { F.spirits('dixombres', c.tx, c.tz, { n: 10, r: 2.6 }); };
  U.arsenal = c => { F.chains('arsenal', c.tx, c.tz, { n: 3 }); F.rain('arsenal', c.tx, c.tz, { solid: 1, s: 1.2, r: 2.4 }); };
  U.architecte = () => { };
  U.energie = c => { F.orb('energie', c.px, c.pz, { tx: c.tx, tz: c.tz }); F.sun('energie', c.px, c.pz, { y: 2.2, s: 1.0 }); };
  U.decoupe = c => { for (let i = 0; i < 5; i++) F.slash('decoupe', c.tx + R(-2, 2), c.tz + R(-2, 2), { a: R(0, 3.14) }); };
  U.possession = c => { F.waves('possession', c.px, c.pz, { r: 5 }); };
  U.dragon = () => { };
  U.leviathan = c => { F.waves('leviathan', c.tx, c.tz, { r: 5 }); };
  // formes ponctuelles des 120 compétences : table choisie à la main (le reste est rendu par la couche d'effets et les
  // particules) ; jamais un golem, une pierre ou une forme d'une autre famille pour une transformation
  const NF = {
    'Rugissement polyphonique': (f, c) => F.waves(f, c.px, c.pz, { n: 8, r: 5 }), 'Rugissement de l\'Empereur': (f, c) => F.waves(f, c.px, c.pz, { vertical: 1, a: c.a }),
    'Souffle du jugement céleste': (f, c) => F.beam(f, c.px, c.pz, { tx: c.tx, tz: c.tz, w: 1.4 }), 'Rayon concentré': (f, c) => F.beam(f, c.px, c.pz, { tx: c.tx, tz: c.tz, w: 0.9 }), 'Décharge du Sceau': (f, c) => F.beam(f, c.px, c.pz, { tx: c.tx, tz: c.tz, w: 1.1 }),
    'Cercle de cendres': (f, c) => F.runeCircle(f, c.px, c.pz, { r: 2.2, n: 6 }), 'Palais des sceaux': (f, c) => F.runeCircle(f, c.tx, c.tz, { r: 2, n: 3 }), 'Champ de maîtrise': (f, c) => F.runeCircle(f, c.px, c.pz, { r: 3, n: 6 }), 'Salle du trône éphémère': (f, c) => F.runeCircle(f, c.px, c.pz, { r: 3.6, n: 8 }),
    'Chaînes du régent': (f, c) => F.chains(f, c.tx, c.tz, { n: 1 }), 'Ordre de succession': (f, c) => F.chains(f, c.tx, c.tz, { n: 1 }),
    'Impulsion énergétique': (f, c) => F.waves(f, c.px, c.pz, { r: 2 }), 'Onde de libération': (f, c) => F.waves(f, c.px, c.pz, { r: 4.5 }), 'Section circulaire': (f, c) => F.waves(f, c.px, c.pz, { r: 2.6 }), 'Pas sismique': (f, c) => F.waves(f, c.px, c.pz, { r: 2 }), 'Rupture d\'inertie': (f, c) => F.waves(f, c.px, c.pz, { r: 4 }),
    'Effondrement abyssal': (f, c) => F.hole(f, c.tx, c.tz, { y: 0.4, s: 1.2 }), 'Courant de dérive': (f, c) => F.waveWall(f, c.px, c.pz, { a: c.a + Math.PI / 2 }), 'Noyade silencieuse': (f, c) => F.cloud(f, c.tx, c.tz, {}),
    'Rappel des cendres': (f, c) => F.spirits(f, c.px, c.pz, { inward: 1, n: 8 }), 'Manifestation des dix': (f, c) => F.spirits(f, c.px, c.pz, { n: 10, r: 1.6 }), 'Aube incandescente': (f, c) => F.eruption(f, c.tx, c.tz, { h: 3 }),
    'Marteau du jugement royal': (f, c) => F.meteors(f, c.tx, c.tz, { n: 1, size: 1.2 }), 'Verdict des mille sections': (f, c) => { for (let i = 0; i < 4; i++) F.slash(f, c.tx + R(-2, 2), c.tz + R(-2, 2), { a: R(0, 3.14) }); }, 'Arc de section': (f, c) => F.slash(f, c.px, c.pz, { a: c.a }), 'Griffes du Dragon céleste': (f, c) => F.slash(f, c.px, c.pz, { a: c.a, n: 3 }),
  };
  const names = []; for (const k of NM.KEYS) for (const g of GRIMOIRE[k]) names.push(g.n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  F.RULES.unshift([new RegExp('^(' + names.join('|') + ')$'), (f, c) => { const fn = NF[c.name]; if (fn) fn(f, c); }]);
  Object.assign(MAGIC3D.STY, {
    orochi: { g: 1, sp: 2, sz: 0.12, life: 0.8, col2: '#c9b46a', shape: 1 }, phenix: { g: -2.8, sp: 2.4, sz: 0.15, life: 1.0, col2: '#ffe08a', flick: 1, light: 1.4 }, titan: { g: 12, sp: 3.5, up: 4, sz: 0.16, life: 0.9, col2: '#d6c6e0', shape: 1 },
    kitsune: { g: -0.6, sp: 1.8, sz: 0.12, life: 1.2, col2: '#ffd36a', flick: 1 }, dixombres: { g: -0.4, sp: 1.2, sz: 0.2, life: 1.4, col2: '#3d2c56' }, arsenal: { g: 6, sp: 3, sz: 0.12, life: 0.8, col2: '#f6e8b8', shape: 1 },
    architecte: { g: 9, sp: 2.6, up: 3, sz: 0.13, life: 0.9, col2: '#c8b08a', shape: 1 }, energie: { g: 0, sp: 3.2, sz: 0.1, life: 0.6, col2: '#ffffff', light: 1.6 }, decoupe: { g: 0, sp: 6, sz: 0.08, life: 0.35, col2: '#fff0f2', bolt: 1 },
    possession: { g: -1, sp: 1.6, sz: 0.12, life: 1.0, col2: '#ffffff', flick: 1 }, dragon: { g: -1.5, sp: 2.6, sz: 0.14, life: 1.0, col2: '#fff4c8', flick: 1, light: 1.6 }, leviathan: { g: 3, sp: 2, up: 2, sz: 0.13, life: 1.1, col2: '#3fe0d0', ring: 1 } }); }

// ================================================================ pilotage : forme active du joueur ↔ modèle 3D
const BUILD = { orochi: () => [buildOrochi(false), upOrochi], phenix: () => [buildPhenix(), upPhenix], titan: () => [buildColossus('titan'), upColossus], dragonu: () => [buildColossus('dragonu'), upColossus], kitsune: () => [buildKitsune(), upKitsune], dixombres: () => [buildShadows(), upShadows],
  possession1: () => [buildPossession(1), upPossession], possession: () => [buildPossession(2), upPossession], possessionu: () => [buildPossession(3), upPossession], dragonw: () => [buildDragon(false), upDragon], dragon: () => [buildDragon(true), upDragon], leviathanh: () => [buildLeviathan(false), upLeviathan], leviathan: () => [buildLeviathan(true), upLeviathan] };
const REPLACE = { titan: 1, dragon: 1, dragonu: 1 }; // le modèle remplace le corps du joueur
const CAMEXTRA = { titan: 4, dragonu: 4, dragon: 6.5, leviathan: 1.5, orochi: 1, dragonw: 1.5, phenix: 1 }; // recul de caméra pour cadrer la forme
let cur = null, registered = false; const seen = {};
export const NM3D = { live: LIVE, get cur() { return cur; }, BUILD, stats: () => ({ live: LIVE.length, form: cur && cur.kind, tris: LIVE.reduce((a, o) => { let n = 0; o.g.traverse(q => { if (q.geometry) n += (q.geometry.index ? q.geometry.index.count : q.geometry.attributes.position.count) / 3; }); return a + n; }, 0), meshes: LIVE.reduce((a, o) => { let n = 0; o.g.traverse(q => { if (q.isMesh) n++; }); return a + n; }, 0), cam: +CAMX.toFixed(2) }) };
export function nmHidePlayer() { return HIDE; }
export function nmPale() { return PALE; }
export function nmCamExtra() { return CAMX; }
let lastT = 0;
export function updateNM3D(dt0) {
  // horloge réelle (les transitions ne ralentissent pas quand l'image est lente) ; arrêt complet si le jeu est en pause
  const tn = performance.now(), dt = dt0 > 0 ? Math.min(0.1, (tn - (lastT || tn)) / 1000) : 0; lastT = tn;
  if (typeof NM === 'undefined' || typeof G === 'undefined' || !G.player) return;
  if (!registered) { registered = true; try { registerUlts(); } catch (e) { console.error(e); } }
  const P = G.player, want = P.nmForm && BUILD[P.nmForm.kind] ? P.nmForm.kind : null;
  if (P.state === 'attack' && P.animT < 0.05) { lastAtk = performance.now(); if (cur) cur.model.bi = (cur.model.bi | 0) + 1; }
  for (const id in NM.casts) { if (seen[id] !== NM.casts[id]) { const fresh = seen[id] !== undefined || NM.casts[id] === 1; seen[id] = NM.casts[id]; if (!fresh) continue; lastAtk = performance.now(); if (cur) cur.model.bi = (cur.model.bi | 0) + 3;
      if (id === 'NM-orochi-U') orochiUlt(P.x + Math.cos(P.aim) * 90, P.y + Math.sin(P.aim) * 90); if (id === 'NM-leviathan-U') devourer(P.x + Math.cos(P.aim) * 90, P.y + Math.sin(P.aim) * 90); if (id === 'NM-dixombres-09') NM.dxShow = performance.now() + 1600; if (id === 'NM-dragon-U' || id === 'NM-dragon-03') NM.breath3d = performance.now() + 1800; } }
  if (cur && cur.kind !== want) cur.end = true;
  if (want && (!cur || cur.end)) { const [model, up] = BUILD[want](); cur = spawn({ kind: want, g: model.g, model, upF: up, form: 1 }); }
  HIDE = !!(cur && !cur.end && REPLACE[cur.kind] && cur.k > 0.35); PALE = P.nmForm && /^possession/.test(P.nmForm.kind) ? (P.nmForm.kind === 'possession1' ? 0.35 : 1) : 0;
  const ce = cur && !cur.end ? (CAMEXTRA[cur.kind] || 0) * cur.k : 0; CAMX += (ce - CAMX) * Math.min(1, dt * 3);
  for (let i = LIVE.length - 1; i >= 0; i--) { const o = LIVE[i]; o.t += dt;
    if (o.form) { o.k = o.end ? Math.max(0, o.k - dt * 2.2) : Math.min(1, o.k + dt * 1.8); try { o.model.k = o.k; o.upF(o.model, dt); } catch (e) { console.error('NM3D', e); o.k = 0; o.end = true; } if (o.end && o.k <= 0) { kill(o); LIVE.splice(i, 1); } }
    else { try { o.up(dt); } catch (e) { o.t = o.life; } if (o.t >= o.life) { kill(o); LIVE.splice(i, 1); } } }
  if (cur && !LIVE.includes(cur)) cur = null;
}
