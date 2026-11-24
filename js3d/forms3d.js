// =====================================================================
//  VÉLORNE 3D — FORMES 3D PROPRES AUX COMPÉTENCES
//  Par-dessus les effets du jeu et les particules de famille (magic3d.js), certaines compétences prennent une forme
//  sculptée en 3D : lion de feu, phénix, piliers et stalagmites, colosses, météores, pluies de lames, tornades,
//  singularités, chaînes, portails, horloge du temps, hydres et léviathans, ondes sonores, miroirs, cercles runiques,
//  dômes protecteurs, cages, éruptions, croissants de lame. Chaque ultime des 27 familles a sa forme signature.
//  La mécanique des compétences (dégâts, effets, zones) n'est pas modifiée : ces formes sont purement visuelles.
// =====================================================================
import { THREE, scene, MOBILE } from '../assets/demo/v4/core.js';
import { groundH } from './world3d.js';

const T = 32, m = v => v / T, R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;
const colOf = f => (typeof MAGIC_DATA !== 'undefined' && MAGIC_DATA[f] && MAGIC_DATA[f].col) || '#ffffff';
const FORMS = []; const MAXF = MOBILE ? 8 : 16;

// ---------- matériaux : énergie (additive, lumineuse) ou matière (pierre, glace, cristal, métal, os) ----------
const SOLID = { terre: ['#7a5a3a', 0.95, 0], glace: ['#bfeaff', 0.25, 0.1], cristal: ['#e0c8ff', 0.2, 0.2], metal: ['#c8ccd4', 0.35, 0.9], lave: ['#3a1a10', 0.9, 0], necromancie: ['#d8d0b8', 0.8, 0], nature: ['#4a7a2a', 0.85, 0] };
function energyMat(col, op = 0.75) { return new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }); }
function solidMat(f, col) {
  const s = SOLID[f]; const c = new THREE.Color(s ? s[0] : col);
  return new THREE.MeshStandardMaterial({ color: c, roughness: s ? s[1] : 0.6, metalness: s ? s[2] : 0, emissive: new THREE.Color(col), emissiveIntensity: f === 'lave' ? 0.55 : 0.3, transparent: true, opacity: 1, flatShading: true });
}
const matFor = (f, solid, op) => (solid && SOLID[f]) ? solidMat(f, colOf(f)) : energyMat(colOf(f), op);

// ---------- géométries partagées ----------
const GEO = {
  cone: new THREE.ConeGeometry(0.35, 1, 6).translate(0, 0.5, 0),
  shard: new THREE.OctahedronGeometry(0.5, 0),
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.IcosahedronGeometry(0.5, 1),
  ball: new THREE.SphereGeometry(0.5, 12, 8),
  torus: new THREE.TorusGeometry(1, 0.06, 6, 40),
  link: new THREE.TorusGeometry(0.16, 0.045, 5, 10),
  ring: new THREE.RingGeometry(0.85, 1, 48),
  blade: (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.08, 0.15); s.lineTo(0.03, 1); s.lineTo(-0.03, 1); s.lineTo(-0.08, 0.15); s.closePath(); return new THREE.ShapeGeometry(s); })(),
  crescent: (() => { const s = new THREE.Shape(); s.absarc(0, 0, 1, -1.2, 1.2, false); s.absarc(-0.35, 0, 0.85, 1.05, -1.05, true); return new THREE.ShapeGeometry(s, 16); })(),
  wing: (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.6, 0.9, 1.6, 1.3, 2.4, 1.1); s.lineTo(1.9, 0.75); s.lineTo(2.2, 0.5); s.lineTo(1.6, 0.35); s.lineTo(1.8, 0.05); s.lineTo(1.1, 0.05); s.bezierCurveTo(0.7, -0.1, 0.3, -0.1, 0, 0); return new THREE.ShapeGeometry(s, 8); })(),
  twister: (() => { const g = new THREE.CylinderGeometry(1.4, 0.15, 1, 18, 12, true).translate(0, 0.5, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i), z = p.getZ(i), a = y * 5; p.setX(i, x * Math.cos(a) - z * Math.sin(a) + Math.sin(y * 7) * 0.12); p.setZ(i, x * Math.sin(a) + z * Math.cos(a)); } g.computeVertexNormals(); return g; })(),
  bar: new THREE.CylinderGeometry(0.05, 0.05, 1, 5).translate(0, 0.5, 0),
};

// ---------- moteur des formes ----------
function add(o) {
  if (FORMS.length >= MAXF) { const old = FORMS.shift(); dispose(old); }
  scene.add(o.g); o.age = 0; FORMS.push(o); return o;
}
function dispose(o) { scene.remove(o.g); o.g.traverse(n => { if (n.material) n.material.dispose(); }); }
const fade = (t, a = 0.12, b = 0.75) => t < a ? t / a : t > b ? Math.max(0, 1 - (t - b) / (1 - b)) : 1;
function setOp(g, k) { g.traverse(n => { if (n.material) { if (n.material.userData.op == null) n.material.userData.op = n.material.opacity; n.material.opacity = n.material.userData.op * k; } }); }
const gy = (x, z) => groundH(x, z);
function group(x, z) { const g = new THREE.Group(); g.position.set(x, gy(x, z), z); return g; }

// --- pics, stalagmites, piliers, épines : en cercle ou en ligne ---
function spikes(f, x, z, o = {}) {
  const g = group(x, z), n = o.n || 9, solid = o.solid !== false, mt = matFor(f, solid, 0.8), list = [];
  for (let i = 0; i < n; i++) {
    let px, pz; if (o.line) { const d = (i / (n - 1)) * (o.len || 5); px = Math.cos(o.a) * d; pz = Math.sin(o.a) * d; } else { const a = i / n * TAU + R(-0.2, 0.2), r = (o.r || 1.6) * R(0.7, 1); px = Math.cos(a) * r; pz = Math.sin(a) * r; }
    const ms = new THREE.Mesh(o.shard ? GEO.shard : GEO.cone, mt); const h = (o.h || 1.8) * R(0.6, 1.2); ms.position.set(px, gy(x + px, z + pz) - g.position.y, pz); ms.rotation.set(R(-0.25, 0.25), R(0, TAU), R(-0.25, 0.25)); ms.userData = { h, w: o.w || 1, d: i * (o.line ? 0.05 : 0.02) }; ms.scale.set(0.01, 0.01, 0.01); g.add(ms); list.push(ms);
  }
  if (o.center) { const ms = new THREE.Mesh(GEO.cone, mt); ms.userData = { h: o.center, w: 2.2, d: 0.1 }; ms.scale.set(0.01, 0.01, 0.01); g.add(ms); list.push(ms); }
  return add({ g, life: o.life || 1.8, up(t, A) { for (const s of list) { const u = Math.min(1, Math.max(0, (A - s.userData.d) / 0.18)); const k = u * (1 - Math.max(0, t - 0.8) / 0.2); const w = s.userData.w * (o.shard ? 0.9 : 1); s.scale.set(w * Math.max(0.01, k), s.userData.h * Math.max(0.01, k), w * Math.max(0.01, k)); } } });
}
// --- colosse / golem / titan / gardien : géant fait de blocs qui surgit, frappe et se dissout ---
function giant(f, x, z, o = {}) {
  const g = group(x, z), mt = matFor(f, true, 0.6), glow = energyMat(colOf(f), 0.9), s = (o.s || 2.4) * 0.62;
  const part = (geo, w, h, d, px, py, pz, m2) => { const ms = new THREE.Mesh(geo, m2 || mt); ms.scale.set(w, h, d); ms.position.set(px, py, pz); g.add(ms); return ms; };
  const body = new THREE.Group(); g.add(body);
  const add2 = (geo, w, h, d, px, py, pz, m2) => { const ms = new THREE.Mesh(geo, m2 || mt); ms.scale.set(w, h, d); ms.position.set(px, py, pz); body.add(ms); return ms; };
  add2(GEO.box, 0.5, 0.9, 0.5, -0.32, 0.45, 0); add2(GEO.box, 0.5, 0.9, 0.5, 0.32, 0.45, 0);
  add2(GEO.shard, 1.5, 1.4, 1.0, 0, 1.55, 0); add2(GEO.shard, 0.7, 0.7, 0.7, 0, 2.5, 0);
  add2(GEO.ball, 0.12, 0.12, 0.12, -0.13, 2.55, 0.3, glow); add2(GEO.ball, 0.12, 0.12, 0.12, 0.13, 2.55, 0.3, glow);
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-0.95, 2.0, 0); armR.position.set(0.95, 2.0, 0); body.add(armL, armR);
  for (const [a, sx] of [[armL, -1], [armR, 1]]) { const u = new THREE.Mesh(GEO.box, mt); u.scale.set(0.42, 1.1, 0.42); u.position.set(0, -0.55, 0); a.add(u); const fist = new THREE.Mesh(GEO.shard, mt); fist.scale.set(0.6, 0.6, 0.6); fist.position.set(0, -1.2, 0); a.add(fist); }
  const core = add2(GEO.ball, 0.35, 0.35, 0.35, 0, 1.6, 0.42, glow);
  body.scale.setScalar(s); g.rotation.y = -(o.a || 0) + Math.PI / 2;
  return add({ g, life: o.life || 2.6, up(t, A) {
    const rise = Math.min(1, A / 0.5); body.position.y = (rise - 1) * 3 * s; body.rotation.z = Math.sin(A * 2) * 0.03;
    const sw = t > 0.35 && t < 0.6 ? Math.sin((t - 0.35) / 0.25 * Math.PI) : 0; armR.rotation.x = -sw * 2.2; armL.rotation.x = -sw * 1.6; core.scale.setScalar(0.35 + Math.sin(A * 9) * 0.05);
    if (t > 0.8) { const k = (t - 0.8) / 0.2; body.position.y = -k * 2.5 * s; } } });
}
// --- bête de flammes (lion de feu), suit le projectile ou charge droit devant ---
function beast(f, x, z, o = {}) {
  const g = group(x, z), mt = energyMat(colOf(f), 0.7), hot = energyMat('#ffe28a', 0.85), s = o.s || 1;
  const b = new THREE.Group(); g.add(b);
  const p = (geo, m2, sx, sy, sz, px, py, pz) => { const ms = new THREE.Mesh(geo, m2); ms.scale.set(sx, sy, sz); ms.position.set(px, py, pz); b.add(ms); return ms; };
  p(GEO.ball, mt, 1.5, 0.8, 0.75, 0, 0.85, 0); const head = p(GEO.ball, hot, 0.6, 0.55, 0.55, 0.85, 1.15, 0);
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, c = new THREE.Mesh(GEO.cone, mt); c.scale.set(0.5, 0.75, 0.5); c.position.set(0.7, 1.15 + Math.sin(a) * 0.35, Math.cos(a) * 0.35); c.rotation.set(Math.cos(a) * 1.4, 0, -Math.PI / 2 - Math.sin(a) * 1.2); b.add(c); }
  const legs = []; for (const [lx, lz] of [[0.45, 0.25], [0.45, -0.25], [-0.45, 0.25], [-0.45, -0.25]]) legs.push(p(GEO.cone, mt, 0.45, 0.7, 0.45, lx, 0, lz));
  const tail = p(GEO.cone, mt, 0.4, 1.0, 0.4, -0.9, 0.9, 0); tail.rotation.z = Math.PI / 2 + 0.6;
  b.scale.setScalar(s); g.rotation.y = -(o.a || 0);
  const sp = o.speed || 7;
  return add({ g, life: o.life || 1.2, follow: o.follow, up(t, A, dt) {
    if (this.follow && G.projs.includes(this.follow)) { const X = m(this.follow.x), Z = m(this.follow.y); g.position.set(X, gy(X, Z) + 0.1, Z); g.rotation.y = -Math.atan2(this.follow.vy || 0, this.follow.vx || 1); this.age = Math.min(this.age, this.life * 0.7); }
    else { g.position.x += Math.cos(o.a || 0) * sp * dt; g.position.z += Math.sin(o.a || 0) * sp * dt; g.position.y = gy(g.position.x, g.position.z) + 0.1; }
    legs.forEach((l, i) => l.rotation.z = Math.sin(A * 18 + i * 1.6) * 0.5); head.position.y = 1.15 + Math.sin(A * 18) * 0.05; tail.rotation.y = Math.sin(A * 10) * 0.4; setOp(g, fade(t, 0.08, 0.8)); } });
}
// --- oiseau / phénix / ailes : deux ailes battantes sur un corps lumineux ---
function wings(f, x, z, o = {}) {
  const g = group(x, z), mt = energyMat(o.col || colOf(f), 0.75), s = o.s || 1.4, y0 = o.y ?? 1.4;
  const L = new THREE.Mesh(GEO.wing, mt), Rw = new THREE.Mesh(GEO.wing, mt); Rw.scale.x = -1; const piv = new THREE.Group(); piv.add(L, Rw); piv.position.y = y0; g.add(piv);
  if (o.bird) { const body = new THREE.Mesh(GEO.ball, energyMat('#ffe9a0', 0.85)); body.scale.set(0.5, 0.5, 1.4); piv.add(body); const tl = new THREE.Mesh(GEO.cone, mt); tl.scale.set(0.8, 1.6, 0.4); tl.rotation.x = Math.PI / 2; tl.position.z = -1.4; piv.add(tl); }
  piv.scale.setScalar(s); g.rotation.y = -(o.a || 0) + Math.PI / 2;
  return add({ g, life: o.life || 1.8, up(t, A, dt) { const fl = Math.sin(A * (o.bird ? 12 : 4)) * (o.bird ? 0.6 : 0.25); L.rotation.y = fl; Rw.rotation.y = -fl; L.rotation.x = Rw.rotation.x = o.bird ? -Math.PI / 2 : 0;
    if (o.bird) { g.position.x += Math.cos(o.a || 0) * 8 * dt; g.position.z += Math.sin(o.a || 0) * 8 * dt; piv.position.y = y0 + Math.sin(t * Math.PI) * 1.2; }
    setOp(g, fade(t)); } });
}
// --- météores qui tombent du ciel avec traînée, puis s'écrasent ---
function meteors(f, x, z, o = {}) {
  const g = group(x, z), n = o.n || 5, list = [], mt = matFor(f, true, 0.9), tr = energyMat(o.trail || colOf(f), 0.55);
  for (let i = 0; i < n; i++) { const r = new THREE.Group(), ms = new THREE.Mesh(GEO.shard, mt); ms.scale.setScalar((o.size || 0.9) * R(0.7, 1.3)); r.add(ms); const tail = new THREE.Mesh(GEO.cone, tr); tail.scale.set(1.4, 4, 1.4); tail.rotation.x = Math.PI; tail.position.y = 0; r.add(tail);
    const a = R(0, TAU), d = n > 1 ? R(0.3, o.r || 2.5) : 0; r.userData = { tx: Math.cos(a) * d, tz: Math.sin(a) * d, d: i * (o.gap || 0.18), ms }; r.visible = false; g.add(r); list.push(r); }
  return add({ g, life: o.life || 1.6 + n * (o.gap || 0.18), up(t, A) { for (const r of list) { const u = (A - r.userData.d) / 0.55; if (u < 0) continue; if (u > 1.4) { r.visible = false; continue; } r.visible = true; const k = Math.min(1, u);
      r.position.set(r.userData.tx + (1 - k) * 3, (1 - k) * 12, r.userData.tz - (1 - k) * 2); r.rotation.z = 0.25; r.userData.ms.rotation.x += 0.2; r.scale.setScalar(u > 1 ? Math.max(0.01, 1 - (u - 1) * 2.5) * 1.4 : 1); } } });
}
// --- pluie de lames / dagues / cristaux / gouttes ---
function rain(f, x, z, o = {}) {
  const g = group(x, z), n = MOBILE ? 18 : 34, list = [], mt = matFor(f, o.solid, 0.85);
  for (let i = 0; i < n; i++) { const ms = new THREE.Mesh(o.geo || GEO.blade, mt); const a = R(0, TAU), r = Math.sqrt(Math.random()) * (o.r || 2.6); ms.userData = { x: Math.cos(a) * r, z: Math.sin(a) * r, d: R(0, 0.9), sp: R(14, 20) }; ms.scale.setScalar(o.s || 0.9); ms.rotation.x = Math.PI; ms.visible = false; g.add(ms); list.push(ms); }
  return add({ g, life: o.life || 1.8, up(t, A) { for (const s of list) { const u = A - s.userData.d; if (u < 0) continue; const y = 9 - u * s.userData.sp; s.visible = y > -0.1 || u < 1.2; s.position.set(s.userData.x, Math.max(0.05, y), s.userData.z); if (y <= 0.05) s.rotation.z = 0.3; } setOp(g, fade(t, 0.05, 0.85)); } });
}
// --- tornade / cyclone / vortex ---
function tornado(f, x, z, o = {}) {
  const g = group(x, z), mt = energyMat(o.col || colOf(f), 0.3), mt2 = energyMat('#ffffff', 0.12);
  const a1 = new THREE.Mesh(GEO.twister, mt), a2 = new THREE.Mesh(GEO.twister, mt2); a2.scale.set(0.7, 1, 0.7); g.add(a1, a2); const h = o.h || 6;
  return add({ g, life: o.life || 2.2, up(t, A, dt) { a1.rotation.y += dt * 9; a2.rotation.y -= dt * 13; const k = Math.min(1, A / 0.3); a1.scale.set(k * (o.w || 1), h * k, k * (o.w || 1)); a2.scale.set(0.7 * k * (o.w || 1), h * 1.05 * k, 0.7 * k * (o.w || 1));
    if (o.move) { g.position.x += Math.cos(o.a) * 3 * dt; g.position.z += Math.sin(o.a) * 3 * dt; g.position.y = gy(g.position.x, g.position.z); } setOp(g, fade(t)); } });
}
// --- singularité / trou noir / puits : sphère sombre et disque d'accrétion ---
function hole(f, x, z, o = {}) {
  const g = group(x, z); const core = new THREE.Mesh(GEO.ball, new THREE.MeshBasicMaterial({ color: '#1a0830', transparent: true, opacity: 0.92 })); const disk = new THREE.Mesh(GEO.ring, energyMat(colOf(f), 0.8)); const halo = new THREE.Mesh(GEO.torus, energyMat(o.col2 || '#ffffff', 0.5));
  disk.rotation.x = -Math.PI / 2 + 0.35; halo.rotation.x = Math.PI / 2 - 0.2; const piv = new THREE.Group(); piv.position.y = o.y ?? 1.6; piv.add(core, disk, halo); g.add(piv); const s = (o.s || 1.4) * 0.6;
  return add({ g, life: o.life || 2.4, up(t, A, dt) { const k = Math.min(1, A / 0.4) * (t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1); core.scale.setScalar(Math.max(0.01, k * s * (1 + Math.sin(A * 12) * 0.04))); disk.scale.setScalar(Math.max(0.01, k * s * 1.9)); halo.scale.setScalar(Math.max(0.01, k * s * 1.3)); disk.rotation.z += dt * 4; halo.rotation.z -= dt * 2.5; setOp(disk, fade(t)); } });
}
// --- chaînes qui s'enroulent autour de la cible ---
function chains(f, x, z, o = {}) {
  const g = group(x, z), mt = (f === 'metal') ? solidMat('metal', colOf(f)) : energyMat(colOf(f), 0.85), arcs = [];
  for (let c = 0; c < (o.n || 3); c++) { const a = new THREE.Group(); const links = 16; for (let i = 0; i < links; i++) { const l = new THREE.Mesh(GEO.link, mt); const u = i / links * TAU; l.position.set(Math.cos(u) * 0.75, 0, Math.sin(u) * 0.75); l.rotation.set(Math.PI / 2, -u + (i % 2) * Math.PI / 2, 0); a.add(l); } a.position.y = 0.4 + c * 0.55; a.rotation.z = (c - 1) * 0.25; g.add(a); arcs.push(a); }
  return add({ g, life: o.life || 1.6, up(t, A, dt) { arcs.forEach((a, i) => { a.rotation.y += dt * (i % 2 ? -4 : 4); const k = Math.min(1, A / 0.25); a.scale.setScalar(Math.max(0.01, (2.2 - k * 1.2))); }); setOp(g, fade(t)); } });
}
// --- portail vertical / déchirure ---
function portal(f, x, z, o = {}) {
  const g = group(x, z), rim = new THREE.Mesh(GEO.torus, energyMat(colOf(f), 0.95)), inner = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: o.inner || '#0a0414', transparent: true, opacity: 0.85, side: THREE.DoubleSide })), sw = new THREE.Mesh(GEO.ring, energyMat('#ffffff', 0.35));
  const piv = new THREE.Group(); piv.position.y = 1.5; piv.add(inner, rim, sw); piv.rotation.y = -(o.a || 0) + Math.PI / 2; g.add(piv);
  return add({ g, life: o.life || 2, up(t, A, dt) { const k = Math.min(1, A / 0.3) * (t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1); piv.scale.set(Math.max(0.01, k * 1.1), Math.max(0.01, k * 1.5), 1); sw.rotation.z += dt * 5; setOp(rim, 1); } });
}
// --- horloge géante (temps) ---
function clock(f, x, z, o = {}) {
  const g = group(x, z), mt = energyMat(colOf(f), 1), face = new THREE.Group(); face.position.y = 2.4; g.add(face);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.55, 40), energyMat(colOf(f), 0.18)); face.add(disc);
  const thick = new THREE.TorusGeometry(1, 0.1, 6, 48), rim = new THREE.Mesh(thick, mt); rim.scale.setScalar(1.8); face.add(rim); const rim2 = new THREE.Mesh(thick, mt); rim2.scale.setScalar(1.5); face.add(rim2);
  for (let i = 0; i < 12; i++) { const tk = new THREE.Mesh(GEO.box, mt); const a = i / 12 * TAU; tk.scale.set(0.08, i % 3 ? 0.18 : 0.34, 0.04); tk.position.set(Math.sin(a) * 1.62, Math.cos(a) * 1.62, 0); tk.rotation.z = -a; face.add(tk); }
  const hH = new THREE.Mesh(GEO.box, mt), hM = new THREE.Mesh(GEO.box, mt); hH.geometry = GEO.box; hH.scale.set(0.16, 0.9, 0.06); hM.scale.set(0.1, 1.35, 0.06); const pH = new THREE.Group(), pM = new THREE.Group(); hH.position.y = 0.45; hM.position.y = 0.67; pH.add(hH); pM.add(hM); face.add(pH, pM);
  const ground = new THREE.Mesh(GEO.ring, mt); ground.rotation.x = -Math.PI / 2; ground.position.y = 0.05; ground.scale.setScalar(3); g.add(ground);
  face.rotation.y = -(o.a || 0) + Math.PI / 2;
  return add({ g, life: o.life || 2.6, up(t, A, dt) { const stop = o.stop && t > 0.3 && t < 0.75; if (!stop) { pM.rotation.z -= dt * (o.rev ? -10 : 10); pH.rotation.z -= dt * (o.rev ? -1 : 1); } face.scale.setScalar(Math.min(1, A / 0.3)); ground.rotation.z += dt * (stop ? 0 : 1); setOp(g, fade(t)); } });
}
// --- serpents / hydre / léviathan / tentacules : cous faits de sphères qui jaillissent du sol ---
function serpents(f, x, z, o = {}) {
  const g = group(x, z), n = o.n || 3, mt = matFor(f, o.solid, 0.75), eye = energyMat('#fff2a0', 1), necks = [];
  for (let i = 0; i < n; i++) { const neck = []; const a = n === 1 ? 0 : (i / n) * TAU, r = n === 1 ? 0 : 0.9; for (let j = 0; j < 10; j++) { const s = new THREE.Mesh(GEO.sphere, mt); s.scale.setScalar((o.w || 0.55) * (1 - j * 0.05)); g.add(s); neck.push(s); }
    const hd = new THREE.Mesh(o.tentacle ? GEO.cone : GEO.shard, mt); hd.scale.set(0.7, o.tentacle ? 0.8 : 0.9, 0.9); g.add(hd); if (!o.tentacle) { const e = new THREE.Mesh(GEO.ball, eye); e.scale.setScalar(0.12); hd.add(e); e.position.set(0.25, 0.2, 0.3); } necks.push({ neck, hd, a, r, ph: R(0, 6) }); }
  const H = o.h || 3.4;
  return add({ g, life: o.life || 2.4, up(t, A) { const rise = Math.min(1, A / 0.5) * (t > 0.82 ? 1 - (t - 0.82) / 0.18 : 1);
    for (const N of necks) { const bx = Math.cos(N.a) * N.r, bz = Math.sin(N.a) * N.r; N.neck.forEach((s, j) => { const u = j / 9; s.position.set(bx + Math.sin(A * 3 + N.ph + u * 3) * 0.5 * u, u * H * rise, bz + Math.cos(A * 2.5 + N.ph + u * 2) * 0.4 * u); });
      const tip = N.neck[9].position; N.hd.position.set(tip.x, tip.y + 0.35, tip.z); N.hd.rotation.set(Math.sin(A * 4 + N.ph) * 0.3, N.a, o.tentacle ? 0 : -0.6); N.hd.visible = rise > 0.2; } } });
}
// --- ondes : anneaux qui s'étendent (son, choc) ---
function waves(f, x, z, o = {}) {
  const g = group(x, z), list = [];
  for (let i = 0; i < (o.n || 4); i++) { const r = new THREE.Mesh(GEO.torus, energyMat(colOf(f), 0.8)); r.rotation.x = o.vertical ? 0 : Math.PI / 2; r.position.y = o.vertical ? 1.2 : 0.6; r.userData.d = i * 0.18; if (o.vertical) r.rotation.y = -(o.a || 0) + Math.PI / 2; g.add(r); list.push(r); }
  return add({ g, life: o.life || 1.4, up(t, A) { for (const r of list) { const u = Math.max(0, A - r.userData.d) / 0.8; r.visible = u > 0 && u < 1; r.scale.setScalar(0.3 + u * (o.r || 4)); r.material.opacity = 0.8 * (1 - u); if (o.vertical) { r.position.x = Math.cos(o.a) * u * 4; r.position.z = Math.sin(o.a) * u * 4; } } } });
}
// --- miroirs / doubles : plaques réfléchissantes qui tournent ---
function mirrors(f, x, z, o = {}) {
  const g = group(x, z), list = [], mt = new THREE.MeshStandardMaterial({ color: '#dff6ff', metalness: 1, roughness: 0.05, emissive: new THREE.Color(colOf(f)), emissiveIntensity: 0.5, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  for (let i = 0; i < (o.n || 6); i++) { const p = new THREE.Mesh(GEO.box, mt); p.scale.set(0.9, 1.6, 0.05); p.userData.a = i / (o.n || 6) * TAU; g.add(p); list.push(p); }
  return add({ g, life: o.life || 2, up(t, A) { list.forEach(p => { const a = p.userData.a + A * 1.5, r = 1.6 * Math.min(1, A / 0.3); p.position.set(Math.cos(a) * r, 1.1 + Math.sin(A * 3 + p.userData.a) * 0.15, Math.sin(a) * r); p.rotation.y = -a + Math.PI / 2; }); setOp(g, fade(t)); } });
}
// --- cercle runique : anneaux au sol et stèles lumineuses qui montent ---
function runeCircle(f, x, z, o = {}) {
  const g = group(x, z), mt = energyMat(colOf(f), 0.85), r = o.r || 2.4, rings = [];
  for (const k of [1, 0.7, 0.45]) { const ri = new THREE.Mesh(GEO.ring, mt); ri.rotation.x = -Math.PI / 2; ri.position.y = 0.05; ri.scale.setScalar(r * k); g.add(ri); rings.push(ri); }
  const st = []; for (let i = 0; i < (o.n || 8); i++) { const a = i / (o.n || 8) * TAU, p = new THREE.Mesh(GEO.box, mt); p.scale.set(0.35, 0.9, 0.08); p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); p.rotation.y = -a + Math.PI / 2; g.add(p); st.push(p); }
  return add({ g, life: o.life || 2, up(t, A, dt) { rings.forEach((ri, i) => ri.rotation.z += dt * (i % 2 ? -1.5 : 2)); st.forEach((p, i) => { p.position.y = 0.5 + Math.min(1, A / 0.5) * (1 + Math.sin(A * 3 + i) * 0.2); }); setOp(g, fade(t)); } });
}
// --- dôme protecteur autour du lanceur ---
function dome(f, x, z, o = {}) {
  const g = group(x, z), mt = energyMat(colOf(f), 0.3), sh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), mt), wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.02, 1), new THREE.MeshBasicMaterial({ color: colOf(f), wireframe: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(sh, wire);
  return add({ g, life: o.life || 1.6, target: o.target, up(t, A, dt) { if (this.target) { const X = m(this.target.x), Z = m(this.target.y); g.position.set(X, gy(X, Z), Z); } const k = Math.min(1, A / 0.25) * 1.3; sh.scale.set(k, k * 0.9, k); wire.scale.set(k, k * 0.9, k); wire.rotation.y += dt * 1.2; setOp(g, fade(t, 0.1, 0.7)); } });
}
// --- cage de barreaux autour de la cible ---
function cage(f, x, z, o = {}) {
  const g = group(x, z), mt = matFor(f, true, 0.85), bars = []; const n = 10;
  for (let i = 0; i < n; i++) { const a = i / n * TAU, b = new THREE.Mesh(o.shard ? GEO.cone : GEO.bar, mt); b.position.set(Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95); g.add(b); bars.push(b); }
  const top = new THREE.Mesh(GEO.torus, mt); top.rotation.x = Math.PI / 2; top.scale.setScalar(0.95); g.add(top);
  return add({ g, life: o.life || 2, up(t, A) { const k = Math.min(1, A / 0.2); bars.forEach(b => b.scale.set(o.shard ? 0.9 : 1.6, 2.4 * k, o.shard ? 0.9 : 1.6)); top.position.y = 2.4 * k; setOp(g, fade(t, 0.05, 0.8)); } });
}
// --- éruption : cône de matière et geyser lumineux ---
function eruption(f, x, z, o = {}) {
  const g = group(x, z), cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.2, 9, 1, true).translate(0, 0.6, 0), matFor(f, true, 0.8)), jet = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.9, 1, 12, 1, true).translate(0, 0.5, 0), energyMat(o.col || colOf(f), 0.7));
  g.add(cone, jet);
  return add({ g, life: o.life || 1.8, up(t, A) { const k = Math.min(1, A / 0.25); cone.scale.set(k, k, k); jet.scale.set(1 + Math.sin(A * 20) * 0.08, (o.h || 6) * Math.sin(Math.min(1, t * 1.5) * Math.PI) + 0.01, 1 + Math.sin(A * 20) * 0.08); setOp(jet, fade(t)); if (t > 0.8) cone.scale.setScalar(Math.max(0.01, (1 - t) * 5)); } });
}
// --- croissant de lame (griffes, lames, poings) ---
function slash(f, x, z, o = {}) {
  const g = group(x, z), list = [];
  for (let i = 0; i < (o.n || 1); i++) { const c = new THREE.Mesh(GEO.crescent, energyMat(o.col || colOf(f), 0.9)); c.rotation.set(-Math.PI / 2 + (i - (o.n || 1) / 2) * 0.25, 0, 0); c.position.y = 0.9 + i * 0.12; g.add(c); list.push(c); }
  g.rotation.y = -(o.a || 0);
  return add({ g, life: o.life || 0.45, up(t, A) { list.forEach((c, i) => { c.scale.setScalar(0.6 + t * (o.r || 1.6)); c.rotation.z = -1 + t * 2 + i * 0.3; }); setOp(g, 1 - t); } });
}
// --- soleil / orbe géant ---
function sun(f, x, z, o = {}) {
  const g = group(x, z), core = new THREE.Mesh(GEO.ball, energyMat(o.col || '#fff4c0', 0.95)), halo = new THREE.Mesh(GEO.ball, energyMat(colOf(f), 0.35)), rays = new THREE.Group();
  for (let i = 0; i < 12; i++) { const c = new THREE.Mesh(GEO.cone, energyMat(colOf(f), 0.5)); const a = i / 12 * TAU; c.scale.set(0.5, 1.6, 0.5); c.position.set(Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0); c.rotation.z = a - Math.PI / 2; rays.add(c); }
  const piv = new THREE.Group(); piv.position.y = o.y ?? 4; piv.add(core, halo, rays); g.add(piv);
  return add({ g, life: o.life || 2.4, up(t, A, dt) { const k = Math.min(1, A / 0.4); core.scale.setScalar(k * (o.s || 1.6)); halo.scale.setScalar(k * (o.s || 1.6) * (1.6 + Math.sin(A * 8) * 0.1)); rays.rotation.z += dt; rays.scale.setScalar(k); rays.lookAt(0, 0, 0); if (o.fall && t > 0.5) piv.position.y = (o.y ?? 4) * (1 - (t - 0.5) / 0.5 * 0.9); setOp(g, fade(t)); } });
}
// --- âmes / spectres : cônes fantomatiques qui tournoient et montent ---
function spirits(f, x, z, o = {}) {
  const g = group(x, z), list = [];
  for (let i = 0; i < (o.n || 8); i++) { const s = new THREE.Group(); const b = new THREE.Mesh(GEO.cone, energyMat(colOf(f), 0.55)); b.scale.set(1.1, 1.4, 1.1); b.rotation.x = Math.PI; b.position.y = 0.7; const h = new THREE.Mesh(GEO.ball, energyMat('#ffffff', 0.6)); h.scale.setScalar(0.45); h.position.y = 0.9; s.add(b, h); s.userData = { a: i / (o.n || 8) * TAU, d: R(0, 0.4) }; g.add(s); list.push(s); }
  return add({ g, life: o.life || 2.2, up(t, A) { list.forEach(s => { const a = s.userData.a + A * (o.inward ? -2 : 2), r = (o.r || 2.2) * (o.inward ? 1 - t : 0.4 + t); s.position.set(Math.cos(a) * r, 0.3 + A * 0.8, Math.sin(a) * r); s.rotation.y = -a; }); setOp(g, fade(t)); } });
}



// --- orbe : sphère lumineuse et anneaux en orbite, qui file vers la cible ---
function orb(f, x, z, o = {}) {
  const g = group(x, z), core = new THREE.Mesh(GEO.ball, energyMat('#ffffff', 0.9)), shell = new THREE.Mesh(GEO.sphere, energyMat(colOf(f), 0.45)), r1 = new THREE.Mesh(GEO.torus, energyMat(colOf(f), 0.8)), r2 = new THREE.Mesh(GEO.torus, energyMat(colOf(f), 0.8));
  const piv = new THREE.Group(); piv.add(core, shell, r1, r2); piv.position.y = 1.1; g.add(piv); r1.scale.setScalar(0.55); r2.scale.setScalar(0.5); r2.rotation.x = Math.PI / 2;
  const sx = x, sz = z, tx = o.tx ?? x, tz = o.tz ?? z;
  return add({ g, life: o.life || 1.1, up(t, A, dt) { const k = Math.min(1, t * 1.6); g.position.set(sx + (tx - sx) * k, gy(sx + (tx - sx) * k, sz + (tz - sz) * k), sz + (tz - sz) * k); core.scale.setScalar(0.35); shell.scale.setScalar(0.7 + Math.sin(A * 14) * 0.05); r1.rotation.y += dt * 6; r1.rotation.x += dt * 3; r2.rotation.z += dt * 5; if (t > 0.65) piv.scale.setScalar(1 + (t - 0.65) * 5); setOp(g, t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1); } });
}
// --- nuage / brouillard / miasme : amas de sphères douces qui gonflent et dérivent ---
function cloud(f, x, z, o = {}) {
  const g = group(x, z), list = [], mt = energyMat(o.col || colOf(f), 0.22);
  for (let i = 0; i < (MOBILE ? 7 : 12); i++) { const b = new THREE.Mesh(GEO.ball, mt); const a = R(0, TAU), r = R(0, o.r || 2); b.userData = { x: Math.cos(a) * r, z: Math.sin(a) * r, s: R(0.9, 1.8), ph: R(0, 6) }; g.add(b); list.push(b); }
  return add({ g, life: o.life || 2.6, up(t, A) { const k = Math.min(1, A / 0.6); list.forEach(b => { const u = b.userData; b.position.set(u.x + Math.sin(A + u.ph) * 0.3, 0.6 + Math.sin(A * 0.8 + u.ph) * 0.2, u.z + Math.cos(A * 0.7 + u.ph) * 0.3); b.scale.setScalar(u.s * k * (o.s || 1.4)); }); setOp(g, fade(t, 0.15, 0.7)); } });
}
// --- traînée de déplacement : silhouettes fantômes laissées derrière le lanceur ---
function trail(f, x, z, o = {}) {
  const g = group(x, z), list = [], mt = energyMat(colOf(f), 0.4), a = o.a || 0;
  for (let i = 0; i < 5; i++) { const s = new THREE.Group(); const b = new THREE.Mesh(GEO.ball, mt); b.scale.set(0.5, 1.1, 0.4); b.position.y = 0.75; const h = new THREE.Mesh(GEO.ball, mt); h.scale.setScalar(0.32); h.position.y = 1.45; s.add(b, h); s.position.set(-Math.cos(a) * i * 0.7, 0, -Math.sin(a) * i * 0.7); s.userData.i = i; g.add(s); list.push(s); }
  return add({ g, life: o.life || 0.9, target: G.player, up(t, A) { const P = this.target; if (P) { const X = m(P.x), Z = m(P.y); g.position.set(X, gy(X, Z), Z); } list.forEach(s => { s.visible = true; s.children.forEach(c => c.material.opacity = 0.4 * (1 - t) * (1 - s.userData.i / 5)); }); } });
}
// --- rayon / lance / trait : faisceau tendu du lanceur à la cible ---
function beam(f, x, z, o = {}) {
  const g = new THREE.Group(), tx = o.tx, tz = o.tz, dx = tx - x, dz = tz - z, L = Math.max(0.5, Math.hypot(dx, dz)), y = gy(x, z) + 1.0;
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1, 10, 1, true), energyMat(colOf(f), 0.55)), inner = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1, 6), energyMat('#ffffff', 0.9));
  for (const b of [outer, inner]) { b.rotation.z = Math.PI / 2; g.add(b); } g.position.set(x + dx / 2, y, z + dz / 2); g.rotation.y = -Math.atan2(dz, dx);
  const tip = new THREE.Mesh(GEO.ball, energyMat(colOf(f), 0.8)); tip.position.x = L / 2; g.add(tip);
  return add({ g, life: o.life || 0.6, up(t, A) { const w = (o.w || 1) * (1 - t * 0.6) * (1 + Math.sin(A * 40) * 0.08); outer.scale.set(w, L, w); inner.scale.set(w, L, w); tip.scale.setScalar(0.6 * w + 0.3); setOp(g, 1 - t); } });
}
// --- fleur : pétales qui s'ouvrent puis se referment ---
function flower(f, x, z, o = {}) {
  const g = group(x, z), list = [], mt = energyMat(o.col || colOf(f), 0.7), core = new THREE.Mesh(GEO.ball, energyMat('#fff2a0', 0.9)); core.position.y = 0.5; core.scale.setScalar(0.5); g.add(core);
  for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(GEO.blade, mt); p.scale.set(4, 1.6, 1); const piv = new THREE.Group(); piv.rotation.y = i / 8 * TAU; piv.position.y = 0.3; piv.add(p); g.add(piv); list.push(p); }
  return add({ g, life: o.life || 1.8, up(t, A) { const op = Math.sin(Math.min(1, t * 1.3) * Math.PI); list.forEach(p => p.rotation.x = -0.2 - op * 1.2); g.rotation.y += 0.01; setOp(g, fade(t)); } });
}
// --- fissures au sol : éclats sombres qui rayonnent, avec lueur de la famille ---
function cracks(f, x, z, o = {}) {
  const g = group(x, z), list = [], dark = new THREE.MeshBasicMaterial({ color: '#120a08', transparent: true, opacity: 0.85, depthWrite: false }), glw = energyMat(colOf(f), 0.8);
  for (let i = 0; i < (o.n || 9); i++) { const a = i / (o.n || 9) * TAU + R(-0.2, 0.2), L = R(1.4, o.r || 3); const c = new THREE.Mesh(GEO.box, Math.random() < 0.5 ? dark : glw); c.scale.set(L, 0.04, R(0.08, 0.18)); c.position.set(Math.cos(a) * L / 2, 0.06, Math.sin(a) * L / 2); c.rotation.y = -a; g.add(c); list.push(c); }
  if (o.chunks) for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(GEO.shard, matFor(f, true, 0.9)); const a = R(0, TAU), d = R(0.5, 2.5); r.position.set(Math.cos(a) * d, 0.2, Math.sin(a) * d); r.scale.setScalar(R(0.3, 0.6)); r.userData.v = R(3, 6); g.add(r); list.push(r); }
  return add({ g, life: o.life || 1.6, up(t, A) { list.forEach(c => { if (c.userData.v) c.position.y = 0.2 + Math.max(0, Math.sin(Math.min(1, A * 1.5) * Math.PI)) * c.userData.v * 0.3; else c.scale.x = Math.max(0.01, c.scale.x); }); g.scale.setScalar(Math.min(1, A / 0.15)); setOp(g, fade(t, 0.05, 0.7)); } });
}
// --- vague / coulée : mur courbe qui avance ---
function waveWall(f, x, z, o = {}) {
  const g = group(x, z), mt = matFor(f, o.solid, 0.6), w = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1, 24, 1, true, -0.7, 1.4), mt), crest = new THREE.Mesh(new THREE.TorusGeometry(3, 0.12, 6, 24, 1.4), energyMat('#ffffff', 0.7));
  w.position.set(-3, 0.5, 0); crest.rotation.set(Math.PI / 2, 0, -0.7); crest.position.set(-3, 1, 0); const piv = new THREE.Group(); piv.add(w, crest); g.add(piv); g.rotation.y = -(o.a || 0);
  return add({ g, life: o.life || 1.4, up(t, A, dt) { piv.position.x = t * 6; const h = Math.sin(Math.min(1, t * 1.2) * Math.PI) * (o.h || 1.8); w.scale.set(1, Math.max(0.01, h), 1); w.position.y = h / 2; crest.position.y = h; setOp(g, fade(t)); } });
}
// --- gerbe d'éclats projetés vers l'extérieur ---
function shardBurst(f, x, z, o = {}) {
  const g = group(x, z), list = [], mt = matFor(f, o.solid !== false, 0.85);
  for (let i = 0; i < (o.n || 10); i++) { const s = new THREE.Mesh(GEO.shard, mt); s.scale.set(0.18, 0.5, 0.18); const a = R(0, TAU), el = R(0.2, 1.1); s.userData = { vx: Math.cos(a) * Math.cos(el) * 6, vy: Math.sin(el) * 6, vz: Math.sin(a) * Math.cos(el) * 6 }; s.position.y = 1; g.add(s); list.push(s); }
  return add({ g, life: o.life || 0.9, up(t, A, dt) { list.forEach(s => { const u = s.userData; u.vy -= 14 * dt; s.position.x += u.vx * dt; s.position.y = Math.max(0.05, s.position.y + u.vy * dt); s.position.z += u.vz * dt; s.rotation.x += dt * 8; }); setOp(g, fade(t, 0.02, 0.6)); } });
}
// --- sceau flottant : anneau gravé qui tourne au-dessus de la cible ---
function sigil(f, x, z, o = {}) {
  const g = group(x, z), mt = energyMat(colOf(f), 0.9), a = new THREE.Mesh(GEO.ring, mt), b = new THREE.Mesh(GEO.torus, mt), eye = new THREE.Mesh(GEO.shard, energyMat('#ffffff', 0.8));
  const piv = new THREE.Group(); piv.position.y = 2.3; a.rotation.x = -Math.PI / 2; b.rotation.x = Math.PI / 2; b.scale.setScalar(0.7); eye.scale.set(0.3, 0.5, 0.3); piv.add(a, b, eye); g.add(piv);
  return add({ g, life: o.life || 1.6, target: o.target, up(t, A, dt) { if (this.target && !this.target.dead) { const X = m(this.target.x), Z = m(this.target.y); g.position.set(X, gy(X, Z), Z); } a.rotation.z += dt * 3; b.rotation.z -= dt * 2; eye.rotation.y += dt * 4; piv.scale.setScalar(Math.min(1, A / 0.2) * (o.s || 0.9)); setOp(g, fade(t)); } });
}

// ---------- choix de la forme : d'après le nom de la compétence, puis forme signature de l'ultime de chaque famille ----------
const RULES = [
  [/lion/i, (f, c) => beast(f, c.px, c.pz, { a: c.a, follow: c.proj, life: 1.4 })],
  [/phénix/i, (f, c) => wings(f, c.px, c.pz, { a: c.a, bird: 1, s: 1.3, life: 1.4 })],
  [/ailes/i, (f, c) => wings(f, c.px, c.pz, { a: c.a, y: 1.5, s: 1.3, life: 1.6 })],
  [/hydre/i, (f, c) => serpents(f, c.tx, c.tz, { n: 3 })],
  [/léviathan/i, (f, c) => serpents(f, c.tx, c.tz, { n: 1, w: 0.9, h: 5.5 })],
  [/tentacule|étreinte/i, (f, c) => serpents(f, c.tx, c.tz, { n: 5, w: 0.3, h: 2.2, tentacle: 1, solid: f === 'glace' })],
  [/colosse|golem|titan|gardien|seigneur|avatar|bourreau/i, (f, c) => giant(f, c.tx, c.tz, { a: c.a })],
  [/météor|rocher météorique/i, (f, c) => meteors(f, c.tx, c.tz, { n: /pluie/i.test(c.name) ? 6 : 1, size: /pluie/i.test(c.name) ? 0.8 : 1.4 })],
  [/pluie|mille plumes|arsenal/i, (f, c) => rain(f, c.tx, c.tz, { solid: ['metal', 'cristal', 'glace'].includes(f), geo: ['eau', 'sang', 'poison', 'lumiere', 'demoniaque'].includes(f) ? GEO.shard : GEO.blade, s: ['eau', 'sang', 'poison'].includes(f) ? 0.35 : 0.9 })],
  [/stalagmite|pilier|aiguilles|épine|ronces|faille|fracture hivernale|mur|rempart|racines/i, (f, c) => spikes(f, /mur|rempart|faille|fracture/i.test(c.name) ? c.px : c.tx, /mur|rempart|faille|fracture/i.test(c.name) ? c.pz : c.tz, /mur|rempart|faille|fracture/i.test(c.name) ? { line: 1, a: c.a, len: 5, n: 9, h: 1.6 } : { n: /pilier/i.test(c.name) ? 1 : 9, center: /pilier/i.test(c.name) ? 4 : 0, shard: f === 'cristal' })],
  [/tornade|cyclone|spirale|vortex|tourbillon/i, (f, c) => tornado(f, c.tx, c.tz, { move: /cyclone|chasseur/i.test(c.name), a: c.a })],
  [/singularité|puits|effondrement|annihilation|trou/i, (f, c) => hole(f, c.tx, c.tz, {})],
  [/chaîne|liens/i, (f, c) => chains(f, c.tx, c.tz, {})],
  [/portail|déchirure|invocation spatiale/i, (f, c) => portal(f, c.tx, c.tz, { a: c.a })],
  [/arrêt du temps|bulle temporelle|dilatation|rembobinage|gardien du temps/i, (f, c) => clock(f, c.px, c.pz, { a: c.a, stop: /arrêt/i.test(c.name), rev: /rembobinage/i.test(c.name) })],
  [/onde|note|cri |cri$|symphonie|résonance|silence|mélodie/i, (f, c) => waves(f, c.px, c.pz, { vertical: /note|onde de choc/i.test(c.name), a: c.a })],
  [/miroir|double|mirage|armée illusoire|réfraction/i, (f, c) => mirrors(f, c.px, c.pz, {})],
  [/rune|sceau|cercle|rituel/i, (f, c) => runeCircle(f, c.tx, c.tz, {})],
  [/bouclier|carapace|armure|manteau|croûte|forme /i, (f, c) => dome(f, c.px, c.pz, { target: G.player })],
  [/prison|cage/i, (f, c) => cage(f, c.tx, c.tz, { shard: ['glace', 'cristal'].includes(f) })],
  [/éruption|gueule|geyser|explosion de cadavre|colonne/i, (f, c) => eruption(f, c.tx, c.tz, { col: f === 'lumiere' ? '#fff8d0' : null })],
  [/soleil/i, (f, c) => sun(f, c.tx, c.tz, { fall: 1 })],
  [/âmes|esprits|légion|spectral|marionnette/i, (f, c) => spirits(f, c.tx, c.tz, { inward: /drain|jugement/i.test(c.name) })],
  [/orbe/i, (f, c) => orb(f, c.px, c.pz, { tx: c.tx, tz: c.tz })],
  [/nuage|brouillard|miasme|spores|voile|nuée|peste|zone d/i, (f, c) => cloud(f, /voile|nuée/i.test(c.name) ? c.px : c.tx, /voile|nuée/i.test(c.name) ? c.pz : c.tz, { col: f === 'poison' || f === 'necromancie' ? '#9acd32' : null })],
  [/pas |pas$|marche|téléportation|glissade|courant ascendant|accélération personnelle|projection astrale|invisibilité|possession/i, (f, c) => trail(f, c.px, c.pz, { a: c.a })],
  [/rayon|lance|flèche|éclair|trait|dard|arc rebondissant|regard/i, (f, c) => beam(f, c.px, c.pz, { tx: c.tx, tz: c.tz, w: /lance|rayon/i.test(c.name) ? 1.4 : 0.8 })],
  [/fleur|floraison/i, (f, c) => flower(f, /floraison/i.test(c.name) ? c.px : c.tx, /floraison/i.test(c.name) ? c.pz : c.tz, {})],
  [/fissure|tremblement|écrasement|fracture|explosion runique|cœur du volcan|fournaise/i, (f, c) => cracks(f, c.tx, c.tz, { chunks: /tremblement|écrasement|fournaise/i.test(c.name) })],
  [/marée|coulée|goutte/i, (f, c) => waveWall(f, c.px, c.pz, { a: c.a, solid: f === 'lave' })],
  [/fragments|éclat/i, (f, c) => shardBurst(f, c.tx, c.tz, { solid: ['glace', 'cristal', 'metal', 'terre'].includes(f) })],
  [/marque|prophétie|lien|pacte|sacrificiel|éveil|ancre|champ|constellation|labyrinthe|réalité|mutation|tempête|orage|surcharge|pression|invocation|mains|squelette|flammes|brasier|danse|fourreau/i, (f, c) => MISC(f, c)],
  [/lame|griffe|poing|fouet|dague|poignard|trait/i, (f, c) => slash(f, c.px, c.pz, { a: c.a, n: /griffe/i.test(c.name) ? 3 : 1 })],
];

// formes pour les compétences restantes (marques, pactes, invocations, flammes, orages…)
function MISC(f, c) {
  const n = c.name;
  if (/marque|prophétie|lien|pacte|ancre/i.test(n)) return sigil(f, c.tx, c.tz, { target: c.target });
  if (/sacrificiel|éveil|fourreau|danse|accélération/i.test(n)) { dome(f, c.px, c.pz, { target: G.player, life: 1.2 }); return sigil(f, c.px, c.pz, { target: G.player, s: 1.2 }); }
  if (/champ|constellation|labyrinthe|réalité|zone/i.test(n)) return runeCircle(f, c.tx, c.tz, { r: 3, n: /labyrinthe/i.test(n) ? 12 : 6 });
  if (/mutation|tempête|orage|surcharge|pression/i.test(n)) { tornado(f, c.tx, c.tz, { h: 5, w: 0.8 }); return waves(f, c.tx, c.tz, { r: 3.5 }); }
  if (/mains|squelette/i.test(n)) return serpents(f, c.tx, c.tz, { n: 4, w: 0.28, h: 1.6, tentacle: 1, solid: true });
  if (/invocation/i.test(n)) return giant(f, c.tx, c.tz, { a: c.a, s: 1.3, life: 2.2 });
  if (/flammes|brasier/i.test(n)) return eruption(f, c.tx, c.tz, { h: 3 });
  return orb(f, c.px, c.pz, { tx: c.tx, tz: c.tz });
}
// forme par défaut de chaque famille, si aucun mot du nom ne correspond
const FAM_DEFAULT = { feu: eruption, eau: waveWall, glace: shardBurst, foudre: beam, vent: tornado, terre: cracks, nature: flower, metal: shardBurst, lave: eruption, ombre: cloud, sang: orb, poison: cloud, neant: hole, ames: spirits, malediction: sigil, necromancie: spirits, chaos: orb, demoniaque: eruption, lumiere: eruption, temps: clock, gravite: hole, espace: portal, astrale: meteors, cristal: shardBurst, son: waves, illusion: mirrors, runes: runeCircle };
// formes signatures des 27 ultimes (combinaisons de formes)
const ULT = {
  feu: c => { sun('feu', c.tx, c.tz, { fall: 1, s: 2 }); wings('feu', c.px, c.pz, { a: c.a, bird: 1, s: 1.6, life: 1.6 }); },
  eau: c => { serpents('eau', c.tx, c.tz, { n: 1, w: 1, h: 6 }); waves('eau', c.tx, c.tz, { r: 6 }); },
  glace: c => { spikes('glace', c.tx, c.tz, { n: 14, r: 3, h: 2.6, center: 5 }); giant('glace', c.tx, c.tz, { a: c.a, s: 2 }); },
  foudre: c => { tornado('foudre', c.tx, c.tz, { col: '#fff8a0', h: 9, w: 0.7 }); waves('foudre', c.tx, c.tz, { r: 5 }); },
  vent: c => { tornado('vent', c.tx, c.tz, { h: 9, w: 1.6 }); tornado('vent', c.tx + 2.5, c.tz, { h: 6, w: 0.8 }); tornado('vent', c.tx - 2.5, c.tz, { h: 6, w: 0.8 }); },
  terre: c => { giant('terre', c.tx, c.tz, { a: c.a, s: 2.8 }); spikes('terre', c.tx, c.tz, { n: 12, r: 3.2, h: 2 }); },
  nature: c => { giant('nature', c.tx, c.tz, { a: c.a, s: 2.6 }); spikes('nature', c.tx, c.tz, { n: 14, r: 3, h: 2.4 }); },
  metal: c => { rain('metal', c.tx, c.tz, { solid: 1, r: 3.4, s: 1.4 }); runeCircle('metal', c.tx, c.tz, { r: 3.2 }); },
  lave: c => { giant('lave', c.tx, c.tz, { a: c.a, s: 3 }); eruption('lave', c.tx + 2, c.tz + 1, { h: 8 }); meteors('lave', c.tx, c.tz, { n: 5, r: 3.5 }); },
  ombre: c => { hole('ombre', c.tx, c.tz, { y: 5, s: 2.4, col2: '#8a4aff' }); serpents('ombre', c.tx, c.tz, { n: 6, w: 0.3, h: 2.6, tentacle: 1 }); },
  sang: c => { sun('sang', c.tx, c.tz, { col: '#ff4a5a', s: 1.4, y: 3 }); rain('sang', c.tx, c.tz, { geo: GEO.shard, s: 0.35, r: 3.4 }); },
  poison: c => { serpents('poison', c.tx, c.tz, { n: 5, w: 0.6, h: 4 }); },
  neant: c => { hole('neant', c.tx, c.tz, { y: 2.2, s: 2.6, col2: '#c8a0ff' }); },
  ames: c => { spirits('ames', c.tx, c.tz, { n: 14, r: 3.2, inward: 1 }); portal('ames', c.tx, c.tz, { a: c.a, inner: '#dff' }); },
  malediction: c => { runeCircle('malediction', c.tx, c.tz, { r: 3.4, n: 10 }); chains('malediction', c.tx, c.tz, { n: 4 }); giant('malediction', c.tx, c.tz - 0.1, { a: c.a, s: 2 }); },
  necromancie: c => { giant('necromancie', c.tx, c.tz, { a: c.a, s: 2.6 }); spirits('necromancie', c.tx, c.tz, { n: 10, r: 3 }); },
  chaos: c => { const k = [hole, tornado, meteors, spikes, eruption]; for (let i = 0; i < 3; i++) k[Math.floor(Math.random() * k.length)]('chaos', c.tx + R(-2.5, 2.5), c.tz + R(-2.5, 2.5), { n: 4 }); },
  demoniaque: c => { portal('demoniaque', c.tx, c.tz, { a: c.a, inner: '#300' }); wings('demoniaque', c.tx, c.tz, { a: c.a, y: 3, s: 2.2, col: '#ff3a2a' }); meteors('demoniaque', c.tx, c.tz, { n: 6, r: 3.5, trail: '#ff2a00' }); },
  lumiere: c => { sun('lumiere', c.tx, c.tz, { y: 7, s: 1.4 }); eruption('lumiere', c.tx, c.tz, { h: 12, col: '#fff8d0' }); wings('lumiere', c.px, c.pz, { a: c.a, y: 1.6, s: 1.5, life: 2.4 }); },
  temps: c => { clock('temps', c.tx, c.tz, { a: c.a, stop: 1, life: 3 }); },
  gravite: c => { hole('gravite', c.tx, c.tz, { y: 3, s: 2, col2: '#9ab' }); meteors('gravite', c.tx, c.tz, { n: 6, r: 3 }); },
  espace: c => { portal('espace', c.tx, c.tz, { a: c.a }); hole('espace', c.tx, c.tz, { y: 1.5, s: 1.2 }); mirrors('espace', c.tx, c.tz, { n: 8 }); },
  astrale: c => { meteors('astrale', c.tx, c.tz, { n: 8, r: 3.5, size: 0.6, trail: '#ffffff' }); runeCircle('astrale', c.tx, c.tz, { r: 3.4, n: 12 }); },
  cristal: c => { giant('cristal', c.tx, c.tz, { a: c.a, s: 2.4 }); spikes('cristal', c.tx, c.tz, { n: 12, r: 3, h: 2.2, shard: 1 }); },
  son: c => { waves('son', c.tx, c.tz, { n: 7, r: 7 }); waves('son', c.px, c.pz, { n: 4, vertical: 1, a: c.a }); },
  illusion: c => { mirrors('illusion', c.tx, c.tz, { n: 10 }); spirits('illusion', c.tx, c.tz, { n: 8 }); },
  runes: c => { runeCircle('runes', c.tx, c.tz, { r: 3.6, n: 12, life: 2.6 }); eruption('runes', c.tx, c.tz, { h: 9 }); },
};
const ALIAS = { demon: 'demoniaque', necro: 'necromancie' };

// contexte d'une incantation : position du lanceur, direction, cible
function ctx(P, name) {
  const px = m(P.x), pz = m(P.y), a = P.aim ?? 0; let best = null, bd = 1e9;
  for (const e of G.enemies) { if (e.dead) continue; const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy); if (d > 280) continue; const da = Math.abs(((Math.atan2(dy, dx) - a + Math.PI * 3) % TAU) - Math.PI); if (da > 0.9 && d > 60) continue; if (d < bd) { bd = d; best = e; } }
  const tx = best ? m(best.x) : px + Math.cos(a) * 3.2, tz = best ? m(best.y) : pz + Math.sin(a) * 3.2;
  return { px, pz, tx, tz, a, name: name || '', target: best };
}
export function formForSkill(f, name, P, big) {
  f = ALIAS[f] || f; const c = ctx(P, name);
  if (big && ULT[f]) { try { ULT[f](c); } catch (e) { } return true; }
  for (const [re, fn] of RULES) if (re.test(name)) { try { fn(f, c); } catch (e) { } return true; }
  const D = FAM_DEFAULT[f]; if (D) { try { const tgt = [beam, orb].includes(D) ? [c.px, c.pz] : [c.tx, c.tz]; D(f, tgt[0], tgt[1], { tx: c.tx, tz: c.tz, a: c.a, target: c.target, n: 4 }); } catch (e) { } return true; }
  return false;
}
// le lion de feu (sort du jeu) : la forme accompagne le projectile qui vient d'être tiré
export function formForProj(p) { const f = p.fam || 'feu'; if (p.kind === 'firelion' || p.fx === 'firelion') { const X = m(p.x), Z = m(p.y); beast(f, X, Z, { a: Math.atan2(p.vy || 0, p.vx || 1), follow: p, life: 2.5 }); return true; } return false; }

export function updateForms(dt) {
  for (let i = FORMS.length - 1; i >= 0; i--) { const o = FORMS[i]; o.age += dt; const t = o.age / o.life; if (t >= 1) { dispose(o); FORMS.splice(i, 1); continue; } try { o.up(t, o.age, dt); } catch (e) { dispose(o); FORMS.splice(i, 1); } }
}
export const FORMS3D = { orb, cloud, trail, beam, flower, cracks, waveWall, shardBurst, sigil, list: FORMS, spikes, giant, beast, wings, meteors, rain, tornado, hole, chains, portal, clock, serpents, waves, mirrors, runeCircle, dome, cage, eruption, slash, sun, spirits, ULT, RULES, formForSkill };
