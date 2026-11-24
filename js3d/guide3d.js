// =====================================================================
//  VÉLORNE 3D — TRAÎNÉE DE LUMIÈRE VERS L'OBJECTIF
//  Pour chaque objectif en cours, une traînée lumineuse part du héros et suit le terrain praticable jusqu'au but :
//  trame principale (or), mission suivie du journal (violet), quête secondaire (turquoise). À l'arrivée, une colonne
//  de lumière marque le PNJ ou le lieu. Les étapes volontairement vagues (« là où le soleil se lève… ») ne sont pas
//  dévoilées : la traînée mène seulement jusqu'à la région concernée. Réglage : Paramètres > Caméra 3D.
// =====================================================================
import { THREE, scene, MOBILE } from '../assets/demo/v4/core.js';
import { groundH } from './world3d.js';

const T = 32, m = v => v / T;
const COL = { main: '#ffd75a', narr: '#c49bff', side: '#5fe8d8' };

// ---------- cibles ----------
const npcBy = f => G.npcs.find(f) || WORLD.npcs.find(f);
function zoneCenter(zid) { const z = WORLD.zones.find(z => z.id === zid); return z ? { x: (z.x0 + z.x1) / 2 * T, y: (z.y0 + z.y1) / 2 * T, zone: z } : null; }
function inZone(P, z) { const tx = P.x / T, ty = P.y / T; return z && tx >= z.x0 && tx < z.x1 && ty >= z.y0 && ty < z.y1; }
function nearestEnemy(P, kinds, maxT = 70) { let b = null, bd = 1e9; for (const e of G.enemies) { if (e.dead || !kinds.includes(e.kind || e.type || (e.def && e.def.id))) continue; const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < bd && d < maxT * T) { bd = d; b = e; } } return b; }
// objectifs du début de partie (Théobald, Orvael, Kaelen, mannequins, maîtres de style) : le guide du jeu 2D ne les connaît pas
function introTarget(P) {
  const Q = G.quests, tile = (o, l) => o ? { x: (o.tx + 0.5) * T, y: (o.ty + 0.5) * T, l } : null, elder = () => { const n = WORLD.npcs.find(n => n.role === 'quest'); return n ? { x: n.x, y: n.y, l: 'Théobald' } : null; };
  const master = st => { const M = typeof MASTERS !== 'undefined' && MASTERS[st]; return M ? tile(M, M.name.split(',')[0]) : null; };
  const dummy = () => { let b = null, bd = 1e9; for (const e of G.enemies) { if (e.dead || !e.def || !e.def.dummy) continue; const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < bd) { bd = d; b = { x: e.x, y: e.y, l: 'Mannequin' }; } } return b; };
  if (!P.magic) return (Q.intro || 0) === 0 ? elder() : tile(typeof ARCHMAGE !== 'undefined' && ARCHMAGE, 'Orvael');
  if (P.trial) return P.trial.left > 0 ? dummy() : master(P.trial.style);
  if (!hasStyle(P)) return master('epee');
  if (Q.main === 0) return elder();
  return null;
}
function mainTarget(P) {
  try {
    let t = typeof objectiveTarget === 'function' ? objectiveTarget() : null;
    if (!t && G.quests && typeof introText === 'function' && introText()) t = introTarget(P);
    return t ? { x: t.x, y: t.y, l: t.l, k: 'main' } : null;
  } catch (e) { return null; }
}
function narrTarget(P) {
  try {
    const N = G.flags && G.flags.narr; if (!N || !N.track || typeof MISSIONS === 'undefined') return null; const m0 = narrM(N.track); if (!m0 || m0.st !== 1) return null;
    const s = MISSIONS[N.track].steps[m0.step]; if (!s) return null; const lab = MISSIONS[N.track].n;
    if (s.t === 'talk' || s.t === 'choice') { const n = npcBy(n => giverMatch(n, s.who)); return n ? { x: n.x, y: n.y, l: lab, k: 'narr', npc: n } : null; }
    if (s.t === 'read' || s.t === 'visit' || s.t === 'riddle') { const p = PLACE[s.place]; if (!p) return null;
      if (s.vague) { const zc = zoneCenter(p.z); if (!zc || inZone(P, zc.zone)) return null; return { x: zc.x, y: zc.y, l: lab + ' (région)', k: 'narr', vague: 1 }; }
      return { x: p.x, y: p.y, l: lab, k: 'narr' }; }
    if (s.t === 'kill') { const e = nearestEnemy(P, s.kinds || []); if (e) return { x: e.x, y: e.y, l: lab, k: 'narr' }; const p = s.spawn && PLACE[s.spawn.place]; return p ? { x: p.x, y: p.y, l: lab, k: 'narr' } : null; }
  } catch (e) { }
  return null;
}
function sideTarget(P) {
  try {
    if (typeof SIDEQ === 'undefined' || !G.quests || !G.quests.side) return null; let best = null, bd = 1e9;
    for (const q of SIDEQ) { const s = G.quests.side[q.id]; if (!s || s.st !== 1) continue; let t = null;
      if (q.t === 'kill' && (s.n || 0) < q.c) { const e = nearestEnemy(P, q.k || []); if (e) t = { x: e.x, y: e.y }; }
      if (!t) { const n = npcBy(n => n.saga === q.npc); if (n) t = { x: n.x, y: n.y, npc: n }; }
      if (t) { const d = Math.hypot(t.x - P.x, t.y - P.y); if (d < bd) { bd = d; best = Object.assign(t, { l: q.n, k: 'side' }); } } }
    return best;
  } catch (e) { return null; }
}

// ---------- chemin praticable (recherche en largeur sur la grille du jeu, rayon limité) ----------
const RAD = 44;
function blockedT(tx, ty) { if (isSolidTile(tx, ty)) return true; try { return vget(tx, ty) === T_WATER && vget(tx + 1, ty) === T_WATER && vget(tx, ty + 1) === T_WATER; } catch (e) { return false; } }
function findPath(P, t) {
  const sx = Math.floor(P.x / T), sy = Math.floor(P.y / T), gx = Math.floor(t.x / T), gy = Math.floor(t.y / T), S = RAD * 2 + 1;
  const prev = new Int32Array(S * S).fill(-2), q = new Int32Array(S * S); let h = 0, tl = 0;
  const id = (x, y) => (y - sy + RAD) * S + (x - sx + RAD); prev[id(sx, sy)] = -1; q[tl++] = id(sx, sy);
  let best = id(sx, sy), bestD = Math.hypot(gx - sx, gy - sy);
  while (h < tl) { const c = q[h++], cx = c % S - RAD + sx, cy = Math.floor(c / S) - RAD + sy; const d = Math.hypot(gx - cx, gy - cy); if (d < bestD) { bestD = d; best = c; } if (d < 1.5) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (Math.abs(nx - sx) > RAD || Math.abs(ny - sy) > RAD) continue; const k = id(nx, ny); if (prev[k] !== -2) continue; if (blockedT(nx, ny) && !(nx === gx && ny === gy)) continue; prev[k] = c; q[tl++] = k; } }
  const pts = []; for (let c = best; c >= 0; c = prev[c]) pts.push([c % S - RAD + sx + 0.5, Math.floor(c / S) - RAD + sy + 0.5]); pts.reverse();
  // lissage : on garde un point sur deux puis on adoucit
  const out = []; for (let i = 0; i < pts.length; i += 2) out.push(pts[i]); if (pts.length) out.push(pts[pts.length - 1]);
  for (let k = 0; k < 2; k++) for (let i = 1; i < out.length - 1; i++) out[i] = [(out[i - 1][0] + out[i][0] * 2 + out[i + 1][0]) / 4, (out[i - 1][1] + out[i][1] * 2 + out[i + 1][1]) / 4];
  return { pts: out, reached: bestD < 2 };
}

// ---------- rendu : nuage de points lumineux qui s'écoulent le long du chemin, colonne à l'arrivée ----------
const NP = MOBILE ? 140 : 260;
function makeTrail(col) {
  const pos = new Float32Array(NP * 3), al = new Float32Array(NP), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aA', new THREE.BufferAttribute(al, 1));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uC: { value: new THREE.Color(col) }, uS: { value: 300 } },
    vertexShader: 'attribute float aA; varying float vA; uniform float uS; void main(){ vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(0.15 * uS / -mv.z, 2.0, 22.0); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uC; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = (1.0 - smoothstep(0.1, 0.5, d)) * vA; if (a < 0.02) discard; gl_FragColor = vec4(uC * a * 1.6 + vec3(a * 0.25), 1.0); }' });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 7; scene.add(pts);
  const colm = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 1, 14, 1, true).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
  colm.scale.set(1, 9, 1); colm.visible = false; scene.add(colm);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.85, 32).rotateX(-Math.PI / 2), colm.material.clone()); ring.visible = false; scene.add(ring);
  return { pos, al, g, mat, pts, colm, ring, path: null, len: 0, cum: [], tgt: null, recalc: 0, flow: 0 };
}
const TR = { main: makeTrail(COL.main), narr: makeTrail(COL.narr), side: makeTrail(COL.side) };
function setPath(tr, p) {
  tr.path = p.pts.map(([x, z]) => [x, z]); tr.cum = [0]; let L = 0; for (let i = 1; i < tr.path.length; i++) { L += Math.hypot(tr.path[i][0] - tr.path[i - 1][0], tr.path[i][1] - tr.path[i - 1][1]); tr.cum.push(L); } tr.len = L;
}
function at(tr, d) { const P = tr.path, C = tr.cum; if (!P || P.length < 2) return null; let i = 1; while (i < C.length - 1 && C[i] < d) i++; const k = Math.max(0, Math.min(1, (d - C[i - 1]) / Math.max(1e-4, C[i] - C[i - 1]))); return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * k, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * k]; }
function hide(tr) { tr.pts.visible = false; tr.colm.visible = false; tr.ring.visible = false; tr.path = null; }

export function updateGuide3D(dt, P, px, pz) {
  const on = !(SET.c3d && SET.c3d.trail === false) && G.mode === 'play' && P && P.state !== 'dead';
  const T3 = on ? { main: mainTarget(P), narr: narrTarget(P), side: null } : {};
  if (on && !T3.narr) T3.side = sideTarget(P);
  if (on && T3.main && T3.narr && Math.hypot(T3.main.x - T3.narr.x, T3.main.y - T3.narr.y) < 64) T3.narr = null;
  const now = performance.now();
  for (const k of ['main', 'narr', 'side']) {
    const tr = TR[k], t = T3[k];
    if (!t) { hide(tr); continue; }
    const dT = Math.hypot(t.x - P.x, t.y - P.y) / T;
    if (dT < 2.2) { hide(tr); continue; } // arrivé : le PNJ ou le lieu est à portée
    if (!tr.path || now - tr.recalc > 900 || !tr.tgt || Math.hypot(tr.tgt.x - t.x, tr.tgt.y - t.y) > 48) { tr.recalc = now; tr.tgt = { x: t.x, y: t.y }; setPath(tr, findPath(P, t)); }
    if (!tr.path || tr.path.length < 2) { hide(tr); continue; }
    // chemin recollé à la position actuelle du héros
    tr.path[0] = [px, pz]; tr.flow = (tr.flow + dt * 5.5) % 1.2;
    const show = Math.min(tr.len, 30), step = show / NP;
    for (let i = 0; i < NP; i++) { const d = (i + tr.flow / 1.2) * step, q = at(tr, d); const j = i * 3; if (!q) { tr.al[i] = 0; continue; }
      const wob = Math.sin(i * 1.7 + now * 0.004) * 0.08; tr.pos[j] = q[0] + wob; tr.pos[j + 2] = q[1] - wob; tr.pos[j + 1] = groundH(q[0], q[1]) + 0.18 + Math.sin(i * 0.9 - now * 0.006) * 0.06;
      const u = d / show; tr.al[i] = 0.7 * (u < 0.06 ? u / 0.06 : 1) * (1 - Math.max(0, u - 0.7) / 0.3) * (0.55 + 0.45 * Math.sin(i * 0.55 - now * 0.012)); }
    tr.g.attributes.position.needsUpdate = true; tr.g.attributes.aA.needsUpdate = true; tr.pts.visible = true; tr.mat.uniforms.uS.value = innerHeight;
    // colonne de lumière sur la cible quand elle est assez proche pour être vue
    const tx = m(t.x), tz = m(t.y), vis = dT < 40 && !t.vague;
    tr.colm.visible = tr.ring.visible = vis; if (vis) { const gy = groundH(tx, tz); tr.colm.position.set(tx, gy, tz); tr.colm.material.opacity = 0.22 + 0.12 * Math.sin(now * 0.005); tr.ring.position.set(tx, gy + 0.05, tz); const rs = 1 + (now * 0.0012 % 1) * 1.6; tr.ring.scale.setScalar(rs); tr.ring.material.opacity = 0.6 * (1 - (rs - 1) / 1.6); }
  }
}
export const GUIDE3D = { TR, mainTarget, narrTarget, sideTarget, findPath };
