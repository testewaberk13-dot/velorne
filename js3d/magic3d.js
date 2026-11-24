// =====================================================================
//  VÉLORNE 3D — EFFETS DE MAGIE EN VRAIE 3D (27 familles)
//  Les 270 compétences gardent leur mécanique et leurs effets dessinés par le jeu. Cette couche ajoute, par-dessus,
//  des effets 3D natifs propres à chaque famille : particules en volume (avec leur mouvement), cercles d'incantation au sol,
//  traînées des projectiles, éclats d'impact, colonnes d'ultime et éclairs de lumière.
// =====================================================================
import { THREE, scene, renderer, MOBILE } from '../assets/demo/v4/core.js';
import { groundH } from './world3d.js';

const T = 32, m = v => v / T, R = (a, b) => a + Math.random() * (b - a);
// identité de mouvement de chaque famille (couleurs du jeu : MAGIC_DATA)
//  g : gravité (négative = monte) · sw : tourbillon · inw : attiré vers le centre · sp : vitesse · sz : taille · life : durée
//  col2 : seconde teinte · ring : cercle au sol · shape : 0 rond, 1 carré (éclat), 2 étoile scintillante · flick : scintillement
const STY = {
  feu: { g: -2.6, sp: 2.2, sz: 0.16, life: 0.9, col2: '#ffd04a', flick: 1, light: 1.4 },
  eau: { g: 9, sp: 3.6, up: 3.5, sz: 0.13, life: 0.9, col2: '#bfe6ff', ring: 1 },
  glace: { g: 2.2, sp: 2.4, sz: 0.14, life: 1.2, col2: '#ffffff', shape: 1, flick: 0.6 },
  foudre: { g: 0, sp: 9, sz: 0.1, life: 0.28, col2: '#ffffff', shape: 1, bolt: 1, light: 2.4 },
  vent: { g: -0.4, sp: 2.5, sw: 5, sz: 0.1, life: 1.1, col2: '#ffffff' },
  terre: { g: 13, sp: 4, up: 5, sz: 0.2, life: 1.0, col2: '#7a5a3a', shape: 1 },
  nature: { g: 0.9, sp: 1.6, sw: 2.2, sz: 0.15, life: 1.6, col2: '#b6f27a', shape: 1 },
  metal: { g: 11, sp: 6, up: 2, sz: 0.08, life: 0.6, col2: '#ffffff', shape: 1, flick: 1 },
  lave: { g: 8, sp: 3.2, up: 4.5, sz: 0.22, life: 1.1, col2: '#ffcf4a', flick: 0.5, light: 1.6 },
  ombre: { g: -1.1, sp: 1.2, sw: 1.2, sz: 0.24, life: 1.3, col2: '#2a1050' },
  sang: { g: 10, sp: 3.4, up: 2.5, sz: 0.12, life: 0.9, col2: '#7a0010' },
  poison: { g: -1.4, sp: 1.0, sz: 0.17, life: 1.5, col2: '#c8ff7a', wob: 1 },
  neant: { g: 0, sp: 3.5, inw: 1, sz: 0.18, life: 0.8, col2: '#1a0640' },
  ames: { g: -1.8, sp: 1.2, sw: 3.5, sz: 0.15, life: 1.6, col2: '#ffffff', flick: 0.4 },
  malediction: { g: -0.3, sp: 1.6, sw: 4.5, sz: 0.14, life: 1.4, col2: '#5a0a6a', shape: 2, ring: 1 },
  necromancie: { g: -2.0, sp: 0.8, sz: 0.18, life: 1.5, col2: '#2a5a10', ground: 1 },
  chaos: { g: 0, sp: 4.5, sz: 0.15, life: 0.8, col2: '#ffb000', jit: 1, flick: 1 },
  demoniaque: { g: -2.2, sp: 2.4, sz: 0.19, life: 1.0, col2: '#2a0000', flick: 0.8, light: 1.2 },
  lumiere: { g: -3.2, sp: 0.8, sz: 0.15, life: 1.2, col2: '#ffffff', shape: 2, col: 1, light: 2 },
  temps: { g: 0, sp: 1.4, sw: 2.2, sz: 0.13, life: 1.6, col2: '#ffffff', shape: 2, ring: 1 },
  gravite: { g: 6, sp: 2.2, inw: 0.6, sz: 0.16, life: 1.0, col2: '#2a3444', shape: 1 },
  espace: { g: 0, sp: 3, inw: -0.5, sz: 0.12, life: 1.2, col2: '#ffffff', shape: 2, flick: 1 },
  astrale: { g: 4, sp: 0.6, sky: 1, sz: 0.14, life: 1.3, col2: '#ffffff', shape: 2, flick: 1, light: 1.2 },
  cristal: { g: 3, sp: 4.5, up: 2, sz: 0.15, life: 1.1, col2: '#ffffff', shape: 1, flick: 0.8 },
  son: { g: 0, sp: 3.5, sz: 0.1, life: 0.7, col2: '#ffffff', ring: 2 },
  illusion: { g: -0.6, sp: 1.4, jit: 0.5, sz: 0.17, life: 1.2, col2: '#a0f0ff', flick: 1 },
  runes: { g: -1.6, sp: 0.9, sz: 0.13, life: 1.3, col2: '#ffffff', shape: 1, ring: 1 },
};
const DEF = { g: 4, sp: 2.5, sz: 0.1, life: 0.6, col2: '#ffffff', shape: 1 };
const colOf = f => (typeof MAGIC_DATA !== 'undefined' && MAGIC_DATA[f] && MAGIC_DATA[f].col) || '#ffffff';
const styleOf = f => STY[f] || DEF;

// ---------------- particules (un seul nuage de points, couleur, taille et forme par particule) ----------------
const N = MOBILE ? 1200 : 2400;
const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), siz = new Float32Array(N), alp = new Float32Array(N), shp = new Float32Array(N);
const P = []; for (let i = 0; i < N; i++) P.push({ on: false });
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1)); geo.setAttribute('aAlpha', new THREE.BufferAttribute(alp, 1)); geo.setAttribute('aShape', new THREE.BufferAttribute(shp, 1));
const mat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uScale: { value: 600 } },
  vertexShader: `attribute float aSize; attribute float aAlpha; attribute float aShape; attribute vec3 color; varying vec3 vC; varying float vA; varying float vS;
    uniform float uScale; void main(){ vC = color; vA = aAlpha; vS = aShape; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = max(1.5, aSize * uScale / -mv.z); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `varying vec3 vC; varying float vA; varying float vS; void main(){ vec2 q = gl_PointCoord - 0.5; float a;
    if (vS < 0.5) a = 1.0 - smoothstep(0.32, 0.5, length(q));
    else if (vS < 1.5) a = step(abs(q.x) + abs(q.y), 0.5);
    else { float s = min(abs(q.x), abs(q.y)); a = (1.0 - smoothstep(0.0, 0.09, s)) * (1.0 - smoothstep(0.25, 0.5, length(q))) + (1.0 - smoothstep(0.1, 0.22, length(q))); }
    if (a * vA < 0.02) discard; gl_FragColor = vec4(vC * vA * a, 1.0); }`,
});
const cloud = new THREE.Points(geo, mat); cloud.frustumCulled = false; cloud.renderOrder = 6; scene.add(cloud);
let cursor = 0, alive = 0;
const _c = new THREE.Color(), _c2 = new THREE.Color();
function emit(f, x, y, z, o = {}) {
  const S = o.S || styleOf(f); let p = null;
  for (let k = 0; k < N; k++) { const i = (cursor + k) % N; if (!P[i].on) { p = P[i]; p.i = i; cursor = (i + 1) % N; break; } }
  if (!p) { p = P[cursor]; p.i = cursor; cursor = (cursor + 1) % N; }
  const a = R(0, Math.PI * 2), sp = (o.sp ?? S.sp) * R(0.4, 1);
  p.on = true; p.f = f; p.S = S; p.x = x; p.y = y; p.z = z; p.cx = o.cx ?? x; p.cz = o.cz ?? z;
  p.vx = Math.cos(a) * sp + (o.vx || 0); p.vz = Math.sin(a) * sp + (o.vz || 0); p.vy = (S.up || 0) * R(0.5, 1) + (o.vy || 0) + (S.g < 0 ? R(0, 0.6) : 0);
  if (S.inw) { const r = R(0.8, 2.2) * (o.r || 1); p.x = p.cx + Math.cos(a) * r; p.z = p.cz + Math.sin(a) * r; p.vx = -Math.cos(a) * sp * S.inw; p.vz = -Math.sin(a) * sp * S.inw; }
  if (S.sky) { p.y += R(3, 6); p.x += R(-1.5, 1.5); p.z += R(-1.5, 1.5); p.vx = R(-0.3, 0.3); p.vz = R(-0.3, 0.3); p.vy = -R(2, 4); }
  if (S.ground) { p.y = groundH(p.x, p.z) + 0.05; }
  p.gh = null; p.life = (o.life ?? S.life) * R(0.7, 1.2); p.age = 0; p.size = (o.sz ?? S.sz) * R(0.7, 1.3) * (o.k || 1);
  _c.set(o.col || colOf(f)); _c2.set(S.col2 || '#ffffff'); _c.lerp(_c2, Math.random() * 0.45);
  p.r = _c.r; p.g = _c.g; p.b = _c.b; p.shape = S.shape || 0; p.ph = R(0, 6.28);
  alive++; return p;
}
function burst(f, x, y, z, n, o = {}) { const k = MOBILE ? 0.6 : 1; for (let i = 0; i < Math.round(n * k); i++) emit(f, x + R(-0.2, 0.2) * (o.spread || 1), y + R(0, 0.3), z + R(-0.2, 0.2) * (o.spread || 1), o); }
let fN = 0;
function updateParticles(dt) {
  alive = 0; fN++;
  for (const p of P) {
    const i = p.i; if (!p.on) continue;
    p.age += dt; if (p.age >= p.life) { p.on = false; alp[i] = 0; siz[i] = 0; continue; }
    alive++; const S = p.S, t = p.age / p.life;
    p.vy -= S.g * dt;
    if (S.sw) { const dx = p.x - p.cx, dz = p.z - p.cz; p.vx += -dz * S.sw * dt; p.vz += dx * S.sw * dt; }
    if (S.jit) { p.vx += R(-1, 1) * 30 * S.jit * dt; p.vz += R(-1, 1) * 30 * S.jit * dt; }
    if (S.wob) p.vx += Math.sin(p.age * 9 + p.ph) * 2 * dt;
    const drag = Math.max(0, 1 - dt * 1.6); p.vx *= drag; p.vz *= drag; if (S.g < 0) p.vy *= Math.max(0, 1 - dt * 0.8);
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.gh == null || ((i + fN) & 7) === 0) p.gh = groundH(p.x, p.z); const gh = p.gh; if (p.y < gh + 0.02) { p.y = gh + 0.02; p.vy *= -0.25; p.vx *= 0.6; p.vz *= 0.6; }
    let a = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85; if (S.flick) a *= 1 - S.flick * 0.5 * (Math.sin(p.age * 40 + p.ph) * 0.5 + 0.5);
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; col[i * 3] = p.r; col[i * 3 + 1] = p.g; col[i * 3 + 2] = p.b;
    siz[i] = p.size * (S.shape === 2 ? 1.6 : 1) * (1 - t * 0.3); alp[i] = Math.max(0, a); shp[i] = p.shape;
  }
  for (const k of ['position', 'color', 'aSize', 'aAlpha', 'aShape']) geo.attributes[k].needsUpdate = true;
  mat.uniforms.uScale.value = renderer.domElement.height * 0.9;
}

// ---------------- cercles au sol, colonnes d'ultime, éclairs ----------------
const RINGS = [];
const ringTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.strokeStyle = '#fff'; x.lineWidth = 5; x.beginPath(); x.arc(64, 64, 58, 0, 7); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(64, 64, 46, 0, 7); x.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.fillStyle = '#fff'; x.fillRect(64 + Math.cos(a) * 52 - 3, 64 + Math.sin(a) * 52 - 3, 6, 6); }
  x.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; x.lineTo(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44); } x.closePath(); x.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const ringGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
function ring(f, x, z, r0, r1, life, o = {}) {
  const mt = new THREE.MeshBasicMaterial({ map: ringTex, color: o.col || colOf(f), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const ms = new THREE.Mesh(ringGeo, mt); ms.position.set(x, groundH(x, z) + 0.06, z); ms.renderOrder = 5; scene.add(ms);
  RINGS.push({ ms, mt, r0, r1, life, age: 0, spin: o.spin ?? 1.5 });
}
const colGeo = new THREE.CylinderGeometry(0.5, 0.7, 1, 16, 1, true).translate(0, 0.5, 0);
function column(f, x, z, h, life, w = 1) {
  const mt = new THREE.MeshBasicMaterial({ color: colOf(f), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
  const ms = new THREE.Mesh(colGeo, mt); ms.position.set(x, groundH(x, z), z); ms.scale.set(w, h, w); scene.add(ms); RINGS.push({ ms, mt, col: true, life, age: 0, w, h });
}
const boltMat = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
function bolt(f, x, z, h) {
  const pts = []; let px = x + R(-0.6, 0.6), pz = z + R(-0.6, 0.6); for (let i = 0; i <= 8; i++) { const y = groundH(x, z) + h * (1 - i / 8); pts.push(new THREE.Vector3(px, y, pz)); px += R(-0.35, 0.35); pz += R(-0.35, 0.35); if (i === 7) { px = x; pz = z; } }
  const mt = boltMat.clone(); mt.color.set(f === 'foudre' ? '#fff8c0' : colOf(f)); const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mt); scene.add(ln); RINGS.push({ ms: ln, mt, line: true, life: 0.18, age: 0 });
}
function updateRings(dt) {
  for (let i = RINGS.length - 1; i >= 0; i--) {
    const r = RINGS[i]; r.age += dt; const t = r.age / r.life;
    if (t >= 1) { scene.remove(r.ms); r.mt.dispose(); if (r.line) r.ms.geometry.dispose(); RINGS.splice(i, 1); continue; }
    if (r.line) { r.mt.opacity = Math.random() < 0.3 ? 0.2 : 1 - t; continue; }
    if (r.col) { r.mt.opacity = 0.55 * (1 - t) * (t < 0.1 ? t / 0.1 : 1); const k = 1 + t * 0.4; r.ms.scale.set(r.w * k, r.h * (0.6 + t * 0.5), r.w * k); continue; }
    const s = r.r0 + (r.r1 - r.r0) * (1 - (1 - t) * (1 - t)); r.ms.scale.set(s * 2, 1, s * 2); r.ms.rotation.y += dt * r.spin; r.mt.opacity = (1 - t) * Math.min(1, t * 6);
  }
}

// ---------------- éclairs de lumière (incantations, ultimes, foudre) ----------------
const FL = []; for (let i = 0; i < 3; i++) FL.push({ x: 0, y: 0, z: 0, col: '#fff', t: 9, d: 1, k: 0, int: 0 });
let flI = 0;
function flash(f, x, y, z, k = 1, d = 0.4) { const F = FL[flI++ % FL.length]; F.col = colOf(f); F.x = x; F.y = y; F.z = z; F.k = k * 7 * (styleOf(f).light || 1); F.t = 0; F.d = d; }
function updateFlashes(dt) { for (const F of FL) { F.t += dt; F.int = F.t < F.d ? F.k * (1 - F.t / F.d) : 0; } }
export function flashLights() { return FL.filter(F => F.int > 0.05).map(F => ({ x: F.x, y: F.y, z: F.z, col: F.col, int: F.int, dist: 9, decay: 1.4 })); }

// ---------------- événements du jeu ----------------
const at = o => { const X = m(o.x), Z = m(o.y); return [X, groundH(X, Z), Z]; };
function castFx(f, P, big) {
  const S = styleOf(f), [x, y, z] = at(P);
  ring(f, x, z, 0.4, big ? 3.2 : 1.6, big ? 1.2 : 0.7, { spin: S.ring === 1 ? 3 : 1.5 });
  if (S.ring === 2) { ring(f, x, z, 0.2, 2.2, 0.5); ring(f, x, z, 0.2, 3, 0.8); }
  burst(f, x, y + 0.6, z, big ? 70 : 26, { cx: x, cz: z, k: big ? 1.3 : 1, spread: big ? 3 : 1.5, r: big ? 2 : 1 });
  flash(f, x, y + 1.2, z, big ? 1.6 : 0.8, big ? 0.7 : 0.35);
  if (big) { column(f, x, z, 7, 1.1, S.col ? 1.4 : 1); if (S.bolt || f === 'foudre') for (let i = 0; i < 4; i++) bolt(f, x + R(-2, 2), z + R(-2, 2), 7); }
  else if (S.bolt) bolt(f, x + R(-1, 1), z + R(-1, 1), 4);
  if (S.col && !big) column(f, x, z, 3, 0.5, 0.6);
}
function hitFx(f, e, crit) {
  const [x, y, z] = at(e), S = styleOf(f);
  burst(f, x, y + 0.7, z, crit ? 18 : 9, { cx: x, cz: z, sp: S.sp * 1.3, k: crit ? 1.2 : 0.9 });
  if (S.bolt && Math.random() < 0.5) bolt(f, x, z, 3);
  if (crit) flash(f, x, y + 1, z, 0.6, 0.2);
}
const PSEEN = new WeakMap();
function projFx(dt) {
  let n = 0;
  for (const p of G.projs) {
    if (n > 40) break; const f = p.fam || p.el || ((p.from === 'p' && (p.magic || p.kind !== 'arrow')) ? (G.player && G.player.magic) : null);
    const fam = STY[f] ? f : null; if (!fam && !p.light) continue; n++;
    const [x, y, z] = at(p), h = y + 0.6 + (p.z ? m(p.z) : 0);
    let s = PSEEN.get(p); if (!s) { s = { acc: 0 }; PSEEN.set(p, s); }
    s.acc += dt * (MOBILE ? 22 : 40);
    const vx = -m(p.vx || 0) * 0.15, vz = -m(p.vy || 0) * 0.15;
    while (s.acc > 1) { s.acc--; emit(fam || 'lumiere', x + R(-0.1, 0.1), h + R(-0.1, 0.1), z + R(-0.1, 0.1), { sp: 0.6, vx, vz, life: 0.45, k: 0.9, col: fam ? null : 'rgb(' + p.light + ')' }); }
  }
}
// effets persistants des compétences (zones, auras) : quelques particules de la famille du lanceur
function mfxFx(dt) {
  const f = G.player && G.player.magic; if (!STY[f]) return; let n = 0;
  for (const o of G.mfx) { if (o.x == null || n > 30) continue; n++; if (Math.random() < dt * 6) { const [x, y, z] = at(o); emit(f, x + R(-0.6, 0.6), y + 0.2 + (o.z ? m(o.z) : 0), z + R(-0.6, 0.6), { cx: x, cz: z, k: 0.8 }); } }
}

// enveloppes : on observe les actions du jeu sans rien changer à leur effet
let lastCast = 0;
const wrap = (name, fn) => { const f0 = window[name]; if (typeof f0 !== 'function') return; window[name] = function (...a) { const r = f0.apply(this, a); try { fn(a, r); } catch (e) { } return r; }; };
wrap('castSkill', (a) => { const P = a[0]; if (P && P.magic && performance.now() - lastCast > 120) { lastCast = performance.now(); castFx(P.magic, P, false); } });
wrap('castUlt', (a) => { const P = a[0]; if (P && P.magic && P.state === 'cast') castFx(P.magic, P, true); });
wrap('damageEnemy', (a) => { const [e, dmg, crit, , , , , el] = a; if (!e || !dmg) return; const f = STY[el] ? el : (G.player && G.player.magic && Math.random() < 0.5 ? G.player.magic : null); if (f) hitFx(f, e, crit); else { const [x, y, z] = at(e); burst('metal', x, y + 0.7, z, crit ? 10 : 5, { S: DEF, col: '#fff2d0' }); } });

export function updateMagic3D(dt) { projFx(dt); mfxFx(dt); updateParticles(dt); updateRings(dt); updateFlashes(dt); }
export const MAGIC3D = { STY, emit, burst, ring, column, bolt, flash, castFx, hitFx, alive: () => alive, rings: () => RINGS.length };
