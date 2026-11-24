// =====================================================================
//  VÉLORNE v4 · VILLAGE PILOTE « BRUMEVAL » : bâtiments à colombages, intérieurs en coupe, place, décor, collisions
// =====================================================================
import { THREE, rnd, lerp, clamp, sstep, vnoise, scene, patch, canvasTex, heightAt, walkH, addCircle, addSeg, COL, WALK_HOOKS, WATER_OK, POND, CAVE, inCave, BRIDGE, WATER_Y, riverX, shadowOnly } from './core.js';
import { mergeGeos, shade } from './nature.js';

// ---------------- textures ----------------
const T = {
  plaster: canvasTex(256, (x, S) => { x.fillStyle = '#e9dcc0'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 1800; i++) { const v = rnd(); x.fillStyle = v < 0.5 ? 'rgba(160,130,90,.10)' : 'rgba(255,250,235,.16)'; x.beginPath(); x.ellipse(rnd() * S, rnd() * S, 2 + rnd() * 9, 1 + rnd() * 5, rnd() * 3, 0, 6.3); x.fill(); }
    for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(120,100,70,.08)'; x.fillRect(rnd() * S, rnd() * S, 30 + rnd() * 40, 3 + rnd() * 10); } }, { repeat: 1 }),
  stone: canvasTex(256, (x, S) => { x.fillStyle = '#6e685e'; x.fillRect(0, 0, S, S); let y = 0, row = 0;
    while (y < S) { const h = 26 + rnd() * 14; let xx = (row % 2) * -20; while (xx < S) { const w = 34 + rnd() * 34, c = 128 + Math.floor(rnd() * 46); x.fillStyle = `rgb(${c},${c - 6},${c - 14})`; x.beginPath(); x.roundRect(xx + 2, y + 2, w - 4, h - 4, 6); x.fill();
        x.fillStyle = 'rgba(255,255,240,.15)'; x.fillRect(xx + 4, y + 3, w - 10, 3); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(xx + 4, y + h - 6, w - 8, 3); if (rnd() < 0.2) { x.fillStyle = 'rgba(80,120,50,.35)'; x.fillRect(xx + 3, y + h - 8, w * 0.5, 5); } xx += w; } y += h; row++; } }, { repeat: 1 }),
  planks: canvasTex(256, (x, S) => { for (let i = 0; i < 8; i++) { const c = 120 + Math.floor(rnd() * 40); x.fillStyle = `rgb(${c},${Math.floor(c * 0.72)},${Math.floor(c * 0.45)})`; x.fillRect(0, i * 32, S, 32); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, i * 32, S, 2);
      const cut = rnd() * S; x.fillRect(cut, i * 32, 2, 32); for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(60,30,10,.18)'; x.fillRect(rnd() * S, i * 32 + 6 + rnd() * 20, 20 + rnd() * 50, 1.5); } } }, { repeat: 1 }),
  cobble: canvasTex(256, (x, S) => { x.fillStyle = '#5e574c'; x.fillRect(0, 0, S, S); for (let i = 0; i < 260; i++) { const c = 120 + Math.floor(rnd() * 50); x.fillStyle = `rgb(${c},${c - 4},${c - 12})`; x.beginPath(); x.ellipse(rnd() * S, rnd() * S, 7 + rnd() * 7, 6 + rnd() * 5, rnd() * 3, 0, 6.3); x.fill(); x.fillStyle = 'rgba(255,250,230,.12)'; x.beginPath(); x.ellipse(rnd() * S, rnd() * S, 4, 2, 0, 0, 6.3); x.fill(); } }, { repeat: 1 }),
  roofSlate: shingleTex(['#4a5466', '#56607a', '#3e4658', '#606a80'], '#2a2e3a'),
  roofTile: shingleTex(['#a2523a', '#b4603e', '#8e4632', '#c06e48'], '#5a2a1e'),
  roofMoss: shingleTex(['#6a5a48', '#5a6a40', '#7a6a52', '#4e5a38'], '#2e2a20'),
  thatch: canvasTex(128, (x, S) => { x.fillStyle = '#a88a4a'; x.fillRect(0, 0, S, S); for (let i = 0; i < 1600; i++) { const c = ['#c8a85a', '#b0904c', '#8e7036', '#d8bc6c', '#9a7a3e'][i % 5]; x.strokeStyle = c; x.lineWidth = 1.2; const px = rnd() * S, py = rnd() * S; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 2, py + 6 + rnd() * 8); x.stroke(); } for (let r = 0; r < 4; r++) { x.fillStyle = 'rgba(60,40,10,.25)'; x.fillRect(0, r * 32 + 28, S, 4); } }, { repeat: 1 }),
  cloth: canvasTex(64, (x, S) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f2e6cc' : '#b8423a'; x.fillRect(i * 8, 0, 8, S); } }),
  cloth2: canvasTex(64, (x, S) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f2e6cc' : '#3a6a9a'; x.fillRect(i * 8, 0, 8, S); } })
};
function shingleTex(cols, dark) { return canvasTex(128, (x, S) => { x.fillStyle = dark; x.fillRect(0, 0, S, S); const rh = 16; for (let r = 0; r < S / rh; r++) { const off = (r % 2) * 8; for (let c = -1; c < S / 16 + 1; c++) { x.fillStyle = cols[Math.floor(rnd() * cols.length)]; x.beginPath(); x.roundRect(c * 16 + off + 1, r * rh, 14, rh + 3, [0, 0, 6, 6]); x.fill(); x.fillStyle = 'rgba(255,255,255,.10)'; x.fillRect(c * 16 + off + 2, r * rh + 1, 12, 2); } } }, { repeat: 1 }); }
for (const k in T) { T[k].wrapS = T[k].wrapT = THREE.RepeatWrapping; T[k].repeat.set(1, 1); }

// ---------------- matériaux ----------------
function chain(mat, key, fn) { const p = mat.onBeforeCompile, pk = mat.customProgramCacheKey; mat.onBeforeCompile = sh => { if (p) p(sh); fn(sh); }; mat.customProgramCacheKey = () => (pk ? pk.call(mat) : '') + key; return mat; }
function tri(mat, scale) { // texture plaquée selon la position dans le monde (aucune déformation sur les murs)
  return chain(mat, 'tri' + scale, sh => {
    sh.vertexShader = 'varying vec3 vTW; varying vec3 vTN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vTW = (modelMatrix * vec4(transformed, 1.0)).xyz; vTN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = 'varying vec3 vTW; varying vec3 vTN;\n' + sh.fragmentShader.replace('#include <map_fragment>', `{ vec3 an = abs(vTN); vec2 tuv = an.y > 0.6 ? vTW.xz : (an.x > an.z ? vTW.zy : vTW.xy); diffuseColor *= texture2D(map, tuv * ${scale.toFixed(3)}); }`);
  });
}
const cutOpts = { cut: true, near: false };
export const VM = {
  wood: patch(new THREE.MeshLambertMaterial({ vertexColors: true }), cutOpts),
  plaster: tri(patch(new THREE.MeshLambertMaterial({ vertexColors: true, map: T.plaster }), cutOpts), 0.35),
  stone: tri(patch(new THREE.MeshLambertMaterial({ vertexColors: true, map: T.stone }), cutOpts), 0.55),
  floor: tri(patch(new THREE.MeshLambertMaterial({ vertexColors: true, map: T.planks }), cutOpts), 0.45),
  cobble: patch(new THREE.MeshLambertMaterial({ map: T.cobble }), { cut: false }),
  slate: patch(new THREE.MeshLambertMaterial({ vertexColors: true, map: T.roofSlate }), cutOpts),
  tile: patch(new THREE.MeshLambertMaterial({ vertexColors: true, map: T.roofTile }), cutOpts),
  moss: patch(new THREE.MeshLambertMaterial({ vertexColors: true, map: T.roofMoss }), cutOpts),
  thatch: patch(new THREE.MeshLambertMaterial({ vertexColors: true, map: T.thatch }), cutOpts),
  cloth: new THREE.MeshLambertMaterial({ map: T.cloth, side: THREE.DoubleSide }),
  cloth2: new THREE.MeshLambertMaterial({ map: T.cloth2, side: THREE.DoubleSide }),
  glass: new THREE.MeshLambertMaterial({ color: '#33445a', emissive: '#ffb45a', emissiveIntensity: 0 }),
  stained: new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#ffffff', emissiveIntensity: 0.15 }),
  glow: new THREE.MeshBasicMaterial({ color: '#ffcf6a' }),
  fire: new THREE.MeshBasicMaterial({ color: '#ff8a2a' }),
  rune: new THREE.MeshBasicMaterial({ color: '#7fe0ff', transparent: true, opacity: 0.9 }),
  shadowOnly: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
};
VM.cobble.map.repeat.set(6, 6);

// ---------------- petites briques géométriques (couleur par sommet) ----------------
const B = (w, h, d, x, y, z, col, ry = 0, rx = 0, rz = 0, low = 0.78) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateX(rx); g.rotateZ(rz); g.rotateY(ry); g.translate(x, y, z); return shade(g, col, low); };
const C = (r0, r1, h, x, y, z, col, seg = 10, low = 0.8) => shade(new THREE.CylinderGeometry(r1, r0, h, seg).translate(x, y + h / 2, z), col, low);
const S = (r, x, y, z, col, sy = 1) => shade(new THREE.SphereGeometry(r, 8, 6).scale(1, sy, 1).translate(x, y, z), col, 0.75);
const WOOD = '#6a4428', DARKW = '#3e2716', LIGHTW = '#9a6c42';

// ---------------- état partagé ----------------
export const V = { buildings: [], interact: [], pois: {}, smoke: [], lights: [], doors: [], anim: [], festival: null, abandoned: null, cave: null, statue: null, bookcase: null };
const L2W = (b, lx, lz) => [b.x + lx * Math.cos(b.rot) + lz * Math.sin(b.rot), b.z - lx * Math.sin(b.rot) + lz * Math.cos(b.rot)];
const W2L = (b, x, z) => { const dx = x - b.x, dz = z - b.z, c = Math.cos(b.rot), s = Math.sin(b.rot); return [dx * c - dz * s, dx * s + dz * c]; };
export { L2W, W2L };
const facing = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
function poi(id, b, lx, lz, face, extra) { const [x, z] = b ? L2W(b, lx, lz) : [lx, lz]; V.pois[id] = Object.assign({ id, x, z, face: face == null ? null : (b ? face + b.rot : face), inside: b && b.enter ? b.id : null }, extra || {}); }
function interact(id, x, z, r, label, extra) { const it = Object.assign({ id, x, z, r, label }, extra || {}); V.interact.push(it); return it; }

// ---------------- toit à deux pans (faîtage selon x local) ----------------
function gable(w, d, h0, pitch, ov, roofMat, o = {}) {
  const W = w + ov * 2, s = d / 2 + ov, rise = (d / 2) * Math.tan(pitch), yr = h0 + rise, ye = h0 - ov * Math.tan(pitch), L = Math.hypot(s, yr - ye);
  const top = [], uv = [], hole = o.hole;
  for (const sg of [1, -1]) { // pan avant (+z) puis arrière
    const quad = (x0, x1, t0, t1) => { const P = (x, t) => [x, lerp(yr, ye, t), sg * lerp(0, s, t)]; const a = P(x0, t0), b = P(x1, t0), c = P(x1, t1), e = P(x0, t1);
      const tri = sg > 0 ? [a, e, c, a, c, b] : [a, b, c, a, c, e]; top.push(...tri.flat()); const U = p => [p[0] + 9, (1 - (Math.abs(p[2]) / s)) * L]; uv.push(...tri.map(U).flat()); };
    if (hole && sg === hole.side) { quad(-W / 2, hole.x0, 0, 1); quad(hole.x1, W / 2, 0, 1); quad(hole.x0, hole.x1, 0, hole.t0); quad(hole.x0, hole.x1, hole.t1, 1); }
    else quad(-W / 2, W / 2, 0, 1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(top, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  const col = new Float32Array(top.length); const tint = new THREE.Color(o.tint || '#ffffff'); for (let i = 0; i < top.length / 3; i++) { const k = 0.82 + 0.18 * ((top[i * 3 + 1] - ye) / (yr - ye)); col[i * 3] = tint.r * k; col[i * 3 + 1] = tint.g * k; col[i * 3 + 2] = tint.b * k; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const roof = new THREE.Mesh(g, roofMat);
  // dessous, rives, faîtage
  const under = g.clone(); under.translate(0, -0.1, 0); { const p = under.attributes.position.array; for (let i = 0; i < p.length; i += 9) { for (let k = 0; k < 3; k++) { const t = p[i + 3 + k]; p[i + 3 + k] = p[i + 6 + k]; p[i + 6 + k] = t; } } } under.computeVertexNormals(); under.deleteAttribute('uv');
  { const c = under.attributes.color.array; for (let i = 0; i < c.length; i += 3) { c[i] = 0.22; c[i + 1] = 0.15; c[i + 2] = 0.1; } }
  const trims = [under, B(W + 0.1, 0.16, 0.2, 0, yr + 0.02, 0, DARKW)];
  const ang = Math.atan2(yr - ye, s);
  for (const sx of [-1, 1]) for (const sg of [1, -1]) trims.push(B(0.12, 0.2, L + 0.05, sx * (W / 2 + 0.02), (yr + ye) / 2, sg * s / 2, DARKW, 0, sg * ang));
  const trimMesh = new THREE.Mesh(mergeGeos(trims), VM.wood);
  // pignons
  const gab = []; for (const sx of [-1, 1]) { const gg = new THREE.BufferGeometry(); const xx = sx * w / 2; const v = sx > 0 ? [xx, h0, d / 2, xx, h0, -d / 2, xx, yr - 0.05, 0] : [xx, h0, -d / 2, xx, h0, d / 2, xx, yr - 0.05, 0];
    gg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); gg.computeVertexNormals(); gg.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); gab.push(shade(gg, o.gableCol || '#ffffff', 0.9)); }
  const gTimber = [];
  if (o.timber !== false) for (const sx of [-1, 1]) { const xx = sx * (w / 2 + 0.06); gTimber.push(B(0.1, rise - 0.1, 0.16, xx, h0 + (rise - 0.1) / 2, 0, DARKW), B(0.1, 0.14, d * 0.62, xx, h0 + rise * 0.42, 0, DARKW));
    for (const sz of [-1, 1]) gTimber.push(B(0.1, 0.12, rise * 0.95, xx, h0 + rise * 0.45, sz * d * 0.17, DARKW, 0, sz * -0.7)); }
  return { roof, trimMesh, gables: new THREE.Mesh(mergeGeos(gab), o.gableMat || VM.plaster), gTimber: gTimber.length ? new THREE.Mesh(mergeGeos(gTimber), VM.wood) : null, yr, ye, rise, shadow: new THREE.Mesh(g, VM.shadowOnly) };
}

// ---------------- bâtiment ----------------
// b : { id, name, x, z, rot, w, d, h, style:'timber'|'stone', roof:'slate'|'tile'|'moss'|'thatch', enter, open (forge/écurie), inside:fn(parts,b), chimney }
const LOW = 1.15;
function building(b) {
  b.h = b.h || 2.7; const { w, d, h } = b; const t = 0.22, dw = 1.3, dh = 2.1;
  // plancher : au-dessus du point le plus haut de l'emprise
  let hmax = -1e9, hmin = 1e9; for (const [lx, lz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2], [0, 0], [0, d / 2 + 1]]) { const [x, z] = L2W(b, lx, lz); const hh = heightAt(x, z); hmax = Math.max(hmax, hh); hmin = Math.min(hmin, hh); }
  b.fy = hmax + 0.28; const g = new THREE.Group(); g.position.set(b.x, b.fy, b.z); g.rotation.y = b.rot; scene.add(g); b.group = g;
  const lower = { wood: [], wall: [], stone: [] }, upper = { wood: [], wall: [], stone: [], glass: [], boards: [] }, inner = { wood: [], stone: [], glow: [], floor: [] };
  b.inner = inner;
  const wallMatKey = b.style === 'stone' ? 'stone' : 'wall';
  // socle de pierre et marche
  lower.stone.push(B(w + 0.36, b.fy - hmin + 0.6, d + 0.36, 0, -(b.fy - hmin + 0.6) / 2 + 0.02, 0, '#ffffff'));
  if (!b.open) lower.stone.push(B(dw + 0.4, 0.2, 0.8, 0, -0.12, d / 2 + 0.55, '#ffffff'));
  inner.floor.push(B(w - 0.1, 0.06, d - 0.1, 0, 0.0, 0, '#ffffff'));
  // murs
  const wallSpecs = b.open ? (b.open.walls || []) : ['f', 'b', 'l', 'r'].map(side => ({ side, win: (WIN[b.id] || {})[side] }));
  for (const ws of wallSpecs) {
    const len = (ws.side === 'f' || ws.side === 'b') ? w : d; const pos = { f: [0, d / 2 - t / 2, 0], b: [0, -d / 2 + t / 2, 0], l: [-w / 2 + t / 2, 0, Math.PI / 2], r: [w / 2 - t / 2, 0, Math.PI / 2] }[ws.side];
    const along = (a0, a1, y0, y1, arr) => { if (a1 - a0 < 0.01) return; const L = a1 - a0, cx = (a0 + a1) / 2; const g2 = new THREE.BoxGeometry(L, y1 - y0, t); g2.translate(cx, (y0 + y1) / 2, 0); g2.rotateY(pos[2]); g2.translate(pos[0], 0, pos[1]); arr.push(shade(g2, '#ffffff', 0.86)); };
    const hh = ws.h || h, door = ws.side === 'f' && (b.enter || b.fakeDoor);
    const wallArrL = b.style === 'stone' ? lower.stone : lower.wall, wallArrU = b.style === 'stone' ? upper.stone : upper.wall;
    if (door) { along(-len / 2, -dw / 2, 0, LOW, wallArrL); along(dw / 2, len / 2, 0, LOW, wallArrL); along(-len / 2, -dw / 2, LOW, hh, wallArrU); along(dw / 2, len / 2, LOW, hh, wallArrU); along(-dw / 2, dw / 2, dh, hh, wallArrU); if (b.fakeDoor && !b.enter) along(-dw / 2, dw / 2, 0, LOW, wallArrL); }
    else { along(-len / 2, len / 2, 0, Math.min(LOW, hh), wallArrL); if (hh > LOW) along(-len / 2, len / 2, LOW, hh, wallArrU); }
    // collisions
    const segW = (a0, a1) => { const [ax, az] = ws.side === 'f' || ws.side === 'b' ? L2W(b, a0, pos[1]) : L2W(b, pos[0], a0), [bx, bz] = ws.side === 'f' || ws.side === 'b' ? L2W(b, a1, pos[1]) : L2W(b, pos[0], a1); addSeg(ax, az, bx, bz, 'mur', 0.14); };
    if (door && b.enter) { segW(-len / 2, -dw / 2 - 0.14); segW(dw / 2 + 0.14, len / 2); } else segW(-len / 2, len / 2);
    // colombages (bois apparent) et fenêtres, côté extérieur
    if (b.style !== 'stone') {
      const out = { f: 1, b: -1, l: -1, r: 1 }[ws.side], off = t / 2 + 0.03;
      const put = (a, y, ww, hh2, rz, arr) => { const g2 = new THREE.BoxGeometry(ww, hh2, 0.08); g2.rotateZ(rz || 0); g2.translate(a, y, 0); if (ws.side === 'l' || ws.side === 'r') { g2.rotateY(Math.PI / 2); g2.translate(pos[0] + out * off, 0, 0); } else g2.translate(0, 0, pos[1] + out * off); arr.push(shade(g2, DARKW, 0.8)); };
      const n = Math.max(2, Math.round(len / 1.5)); for (let i = 0; i <= n; i++) { const a = -len / 2 + i * len / n; if (door && Math.abs(a) < dw / 2 + 0.1) continue; put(a, LOW / 2, 0.16, LOW, 0, lower.wood); put(a, (LOW + hh) / 2, 0.16, hh - LOW, 0, upper.wood); }
      put(0, LOW, len + 0.1, 0.16, 0, upper.wood); put(0, hh - 0.05, len + 0.1, 0.18, 0, upper.wood); put(0, 0.06, len + 0.1, 0.14, 0, lower.wood);
      for (let i = 0; i < n; i++) { const a0 = -len / 2 + i * len / n, a1 = a0 + len / n, cx = (a0 + a1) / 2; if (door && Math.abs(cx) < dw) continue; if (ws.win && ws.win.includes(i)) continue; if ((i + (ws.side === 'l' ? 1 : 0)) % 2) put(cx, (LOW + hh) / 2, 0.12, Math.hypot(a1 - a0, hh - LOW) * 0.92, Math.atan2(a1 - a0, hh - LOW) * (i % 4 < 2 ? 1 : -1), upper.wood); }
      if (door) { put(-dw / 2 - 0.06, dh / 2, 0.16, dh, 0, lower.wood); put(dw / 2 + 0.06, dh / 2, 0.16, dh, 0, lower.wood); put(0, dh + 0.06, dw + 0.3, 0.18, 0, upper.wood); }
      // fenêtres
      for (const i of (ws.win || [])) { const a = -len / 2 + (i + 0.5) * len / n, wy = LOW + (hh - LOW) * 0.5, ww = Math.min(0.9, len / n - 0.35), wh = Math.min(0.85, hh - LOW - 0.35);
        put(a, wy, ww + 0.16, 0.12, 0, upper.wood); put(a, wy - wh / 2 - 0.08, ww + 0.3, 0.12, 0, upper.wood); put(a, wy + wh / 2 + 0.04, ww + 0.16, 0.1, 0, upper.wood); put(a - ww / 2 - 0.05, wy, 0.1, wh, 0, upper.wood); put(a + ww / 2 + 0.05, wy, 0.1, wh, 0, upper.wood); put(a, wy, 0.06, wh, 0, upper.wood);
        const gl = new THREE.PlaneGeometry(ww, wh); if (ws.side === 'l' || ws.side === 'r') { gl.translate(out > 0 ? a : -a, wy, 0); gl.rotateY(out > 0 ? Math.PI / 2 : -Math.PI / 2); gl.translate(pos[0] + out * (t / 2 + 0.01), 0, 0); } else { gl.translate(out < 0 ? -a : a, wy, 0); if (out < 0) gl.rotateY(Math.PI); gl.translate(0, 0, pos[1] + out * (t / 2 + 0.01)); } upper.glass.push(gl);
        if (b.boarded) for (let k = 0; k < 3; k++) put(a, wy - 0.3 + k * 0.3, ww + 0.25, 0.14, (k - 1) * 0.12, upper.boards);
        else { const sc = b.shutter || '#4a6a8a'; const sh = (sx) => { const g2 = new THREE.BoxGeometry(ww * 0.5, wh + 0.1, 0.05); g2.translate(a + sx * (ww * 0.75 + 0.08), wy, 0); if (ws.side === 'l' || ws.side === 'r') { g2.rotateY(Math.PI / 2); g2.translate(pos[0] + out * (off + 0.04), 0, 0); } else g2.translate(0, 0, pos[1] + out * (off + 0.04)); upper.wood.push(shade(g2, sc, 0.7)); }; sh(-1); sh(1);
          // jardinière fleurie
          if (ws.flowers !== false && rnd() < 0.75) { const fb = new THREE.BoxGeometry(ww + 0.2, 0.18, 0.24); fb.translate(a, wy - wh / 2 - 0.2, 0); const fl = []; for (let k = 0; k < 6; k++) fl.push(new THREE.SphereGeometry(0.07, 5, 4).translate(a - ww / 2 + 0.05 + k * (ww / 5), wy - wh / 2 - 0.06, 0));
            const fg = mergeGeos([shade(fb, '#5a3a22', 0.8), shade(mergeGeos(fl), ['#e05a7a', '#f6c84a', '#ffffff', '#b07af0'][Math.floor(rnd() * 4)], 0.9)]);
            if (ws.side === 'l' || ws.side === 'r') { fg.rotateY(Math.PI / 2); fg.translate(pos[0] + out * (off + 0.14), 0, 0); } else fg.translate(0, 0, pos[1] + out * (off + 0.14)); upper.wood.push(fg); } }
      }
    }
  }
  // poteaux d'angle
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { lower.wood.push(B(0.26, LOW, 0.26, sx * (w / 2 - 0.05), LOW / 2, sz * (d / 2 - 0.05), DARKW)); upper.wood.push(B(0.26, h - LOW, 0.26, sx * (w / 2 - 0.05), (LOW + h) / 2, sz * (d / 2 - 0.05), DARKW));
    if (b.open) addCircle(...L2W(b, sx * (w / 2 - 0.1), sz * (d / 2 - 0.1)), 0.2, 'poteau'); }
  // toit
  const rf = gable(w, d, h, b.pitch || 0.68, b.ov ?? 0.5, VM[b.roof || 'tile'], { tint: b.roofTint, hole: b.hole, timber: b.style !== 'stone', gableMat: b.style === 'stone' ? VM.stone : VM.plaster });
  const roofG = new THREE.Group(); roofG.add(rf.roof, rf.trimMesh, rf.gables); if (rf.gTimber) roofG.add(rf.gTimber); g.add(roofG); g.add(rf.shadow); shadowOnly(rf.shadow);
  rf.roof.castShadow = rf.trimMesh.castShadow = rf.gables.castShadow = false; b.roofG = roofG; b.rf = rf;
  // cheminée
  if (b.chimney) { const cx = b.chimney * w * 0.3, cz = -d * 0.15, top = h + rf.rise * 0.9 + 0.9; upper.stone.push(B(0.6, top - h + 0.4, 0.6, cx, h + (top - h + 0.4) / 2 - 0.4, cz, '#ffffff'), B(0.72, 0.14, 0.72, cx, top, cz, '#ffffff')); const [wx, wz] = L2W(b, cx, cz); V.smoke.push({ x: wx, y: b.fy + top + 0.2, z: wz, b }); }
  // porte (pivot sur la gauche)
  if (b.enter || b.fakeDoor) { const piv = new THREE.Group(); piv.position.set(-dw / 2 + 0.02, 0, d / 2 - t / 2); const planks = [];
    for (let i = 0; i < 5; i++) planks.push(B(dw / 5 - 0.015, dh - 0.04, 0.07, (i + 0.5) * (dw - 0.04) / 5, dh / 2, 0, ['#7a4e2c', '#6e4426', '#845632'][i % 3], 0, 0, 0, 0.75));
    planks.push(B(dw - 0.06, 0.1, 0.09, (dw - 0.04) / 2, 0.45, 0.02, DARKW), B(dw - 0.06, 0.1, 0.09, (dw - 0.04) / 2, dh - 0.45, 0.02, DARKW), B(0.08, 0.08, 0.12, dw - 0.25, 1.0, 0.05, '#c8a040'));
    const dm = new THREE.Mesh(mergeGeos(planks), VM.wood); dm.castShadow = true; piv.add(dm); g.add(piv); const [ox, oz] = L2W(b, 0, d / 2 + 0.9), [ix, iz] = L2W(b, 0, d / 2 - 0.9);
    V.doors.push({ b, piv, open: 0, out: { x: ox, z: oz }, in: { x: ix, z: iz }, locked: false, fake: !b.enter }); b.door = V.doors[V.doors.length - 1]; }
  // intérieur
  if (b.inside) b.inside(inner, b);
  // fusion
  const mk = (arr, mat, parent, cast = true) => { if (!arr.length) return null; const m = new THREE.Mesh(mergeGeos(arr), mat); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
  const lowG = new THREE.Group(), upG = new THREE.Group(), inG = new THREE.Group(); g.add(lowG, upG, inG);
  mk(lower.wood, VM.wood, lowG); mk(lower.wall, VM.plaster, lowG); mk(lower.stone, VM.stone, lowG);
  mk(upper.wood, VM.wood, upG); b.boardsM = mk(upper.boards, VM.wood, upG); mk(upper.wall, VM.plaster, upG); mk(upper.stone, VM.stone, upG); if (upper.glass.length) { const gm = new THREE.Mesh(mergeGeos(upper.glass), b.stainedGlass ? VM.stained : VM.glass); upG.add(gm); }
  mk(inner.floor, VM.floor, inG, false); mk(inner.wood, VM.wood, inG); mk(inner.stone, VM.stone, inG); mk(inner.glow, VM.glow, inG, false);
  // l'ombre des murs du haut reste quand ils sont masqués
  if (upper.wall.length + upper.stone.length) { const upShadow = new THREE.Mesh(mergeGeos([...upper.wall, ...upper.stone]), VM.shadowOnly); shadowOnly(upShadow); g.add(upShadow); }
  b.lowG = lowG; b.upG = upG; b.inG = inG; b.cut = 0;
  // hauteur de marche à l'intérieur et sur la marche
  if (b.enter || b.open) WALK_HOOKS.push((x, z) => { const [lx, lz] = W2L(b, x, z); if (Math.abs(lx) < w / 2 - 0.05 && Math.abs(lz) < d / 2 - 0.05) return b.fy; if (!b.open && Math.abs(lx) < dw / 2 + 0.2 && lz >= d / 2 - 0.05 && lz < d / 2 + 0.95) { const gnd = heightAt(x, z); return lerp(b.fy, Math.max(gnd, b.fy - 0.3), clamp((lz - d / 2) / 0.95, 0, 1)); } return null; });
  b.contains = (x, z, m = 0) => { const [lx, lz] = W2L(b, x, z); return Math.abs(lx) < w / 2 - m && Math.abs(lz) < d / 2 - m; };
  V.buildings.push(b); return b;
}

// ---------------- mobilier (repère local du bâtiment) ----------------
const F = {
  table: (P, x, z, ry = 0, s = 1) => { P.wood.push(B(1.4 * s, 0.08, 0.8, x, 0.74, z, LIGHTW, ry)); for (const [a, c] of [[-0.6, -0.32], [0.6, -0.32], [0.6, 0.32], [-0.6, 0.32]]) { const ca = Math.cos(ry), sa = Math.sin(ry); P.wood.push(B(0.08, 0.72, 0.08, x + a * s * ca + c * sa, 0.36, z - a * s * sa + c * ca, WOOD)); } },
  bench: (P, x, z, ry = 0, l = 1.4) => { P.wood.push(B(l, 0.07, 0.32, x, 0.44, z, LIGHTW, ry)); for (const a of [-l / 2 + 0.12, l / 2 - 0.12]) P.wood.push(B(0.08, 0.42, 0.28, x + a * Math.cos(ry), 0.21, z - a * Math.sin(ry), WOOD)); },
  chair: (P, x, z, ry = 0) => { P.wood.push(B(0.42, 0.06, 0.42, x, 0.46, z, LIGHTW, ry)); const bx = x - Math.sin(ry) * 0.19, bz = z - Math.cos(ry) * 0.19; P.wood.push(B(0.42, 0.5, 0.05, bx, 0.72, bz, WOOD, ry)); for (const [a, c] of [[-0.17, -0.17], [0.17, -0.17], [0.17, 0.17], [-0.17, 0.17]]) P.wood.push(B(0.05, 0.45, 0.05, x + a * Math.cos(ry) + c * Math.sin(ry), 0.22, z - a * Math.sin(ry) + c * Math.cos(ry), WOOD)); },
  bed: (P, x, z, ry = 0, quilt = '#8a3a3a') => { P.wood.push(B(1.0, 0.36, 2.0, x, 0.18, z, WOOD, ry), B(0.92, 0.16, 1.9, x, 0.42, z, '#efe6d2', ry), B(0.94, 0.08, 1.3, x - Math.sin(ry) * 0.3, 0.52, z - Math.cos(ry) * 0.3, quilt, ry), B(0.6, 0.12, 0.3, x + Math.sin(ry) * 0.7, 0.55, z + Math.cos(ry) * 0.7, '#ffffff', ry), B(1.0, 0.8, 0.08, x + Math.sin(ry) * 1.0, 0.4, z + Math.cos(ry) * 1.0, DARKW, ry)); },
  shelf: (P, x, z, ry = 0, w = 1.4, books = true) => { P.wood.push(B(w, 1.9, 0.36, x, 0.95, z, WOOD, ry)); for (let k = 0; k < 4; k++) { const y = 0.25 + k * 0.45; P.wood.push(B(w - 0.08, 0.04, 0.32, x + Math.sin(ry) * 0.02, y, z + Math.cos(ry) * 0.02, DARKW, ry));
      if (books) { let a = -w / 2 + 0.1; while (a < w / 2 - 0.12) { const bw = 0.05 + rnd() * 0.06, bh = 0.24 + rnd() * 0.14; const ox = a * Math.cos(ry) + 0.03 * Math.sin(ry), oz = -a * Math.sin(ry) + 0.03 * Math.cos(ry); P.wood.push(B(bw, bh, 0.24, x + ox, y + 0.02 + bh / 2, z + oz, ['#7a2a2a', '#2a4a6a', '#3a6a3a', '#8a6a2a', '#5a3a6a', '#c8b48a'][Math.floor(rnd() * 6)], ry)); a += bw + 0.01; } }
      else for (let i = 0; i < 3; i++) { const a = -w / 2 + 0.3 + i * (w - 0.6) / 2; P.wood.push(S(0.1, x + a * Math.cos(ry), y + 0.12, z - a * Math.sin(ry), ['#5a8ac0', '#c05a5a', '#8ac05a', '#d0b060'][(i + k) % 4], 1.3)); } } },
  barrel: (P, x, z, s = 1) => { P.wood.push(C(0.3 * s, 0.3 * s, 0.85 * s, x, 0, z, '#7a5030', 12), C(0.33 * s, 0.33 * s, 0.06, x, 0.18 * s, z, '#3a3a3a', 12), C(0.33 * s, 0.33 * s, 0.06, x, 0.62 * s, z, '#3a3a3a', 12)); },
  crate: (P, x, z, s = 0.6, ry = 0) => { P.wood.push(B(s, s, s, x, s / 2, z, '#9a7046', ry), B(s + 0.02, 0.06, s + 0.02, x, s * 0.8, z, '#5a3a22', ry), B(s + 0.02, 0.06, s + 0.02, x, s * 0.2, z, '#5a3a22', ry)); },
  fireplace: (P, x, z, ry = 0) => { const s = Math.sin(ry), c = Math.cos(ry); P.stone.push(B(1.6, 1.3, 0.6, x, 0.65, z, '#ffffff', ry), B(0.5, 1.4, 0.5, x, 2.0, z - c * 0.05, '#ffffff', ry), B(1.8, 0.14, 0.75, x, 1.32, z + c * 0.05, '#ffffff', ry)); P.stone.push(B(0.9, 0.7, 0.3, x + s * 0.2, 0.35, z + c * 0.2, '#2a2420', ry, 0, 0, 0.5));
    P.glow.push(new THREE.ConeGeometry(0.22, 0.45, 6).translate(x + s * 0.32, 0.3, z + c * 0.32), new THREE.ConeGeometry(0.14, 0.3, 6).translate(x + s * 0.32 + 0.15, 0.22, z + c * 0.32)); },
  counter: (P, x, z, ry = 0, l = 2.4) => { P.wood.push(B(l, 1.0, 0.6, x, 0.5, z, WOOD, ry), B(l + 0.1, 0.07, 0.7, x, 1.03, z, LIGHTW, ry)); },
  rug: (P, x, z, w, d, col, ry = 0) => { P.wood.push(B(w, 0.02, d, x, 0.04, z, col, ry, 0, 0, 1), B(w * 0.8, 0.021, d * 0.8, x, 0.045, z, '#d8c08a', ry, 0, 0, 1), B(w * 0.7, 0.022, d * 0.7, x, 0.05, z, col, ry, 0, 0, 1)); },
  candle: (P, x, y, z) => { P.wood.push(C(0.04, 0.04, 0.18, x, y, z, '#f2ead2', 6)); P.glow.push(new THREE.ConeGeometry(0.03, 0.08, 5).translate(x, y + 0.24, z)); },
  pot: (P, x, z, col = '#a86a42', plant = '#4a8a3a') => { P.wood.push(C(0.16, 0.22, 0.34, x, 0, z, col, 8), S(0.26, x, 0.5, z, plant, 0.9)); },
  sack: (P, x, z) => { P.wood.push(S(0.28, x, 0.26, z, '#c8b48a', 1.1), C(0.06, 0.1, 0.12, x, 0.52, z, '#a89470', 6)); },
  stool: (P, x, z) => { P.wood.push(C(0.18, 0.18, 0.05, x, 0.45, z, LIGHTW, 8)); for (let i = 0; i < 3; i++) P.wood.push(B(0.04, 0.45, 0.04, x + Math.cos(i * 2.1) * 0.12, 0.22, z + Math.sin(i * 2.1) * 0.12, WOOD)); },
  mug: (P, x, y, z) => P.wood.push(C(0.05, 0.05, 0.1, x, y, z, '#c8c0b0', 6)),
  plate: (P, x, y, z, food = '#c86a3a') => { P.wood.push(C(0.12, 0.12, 0.02, x, y, z, '#e8e0d0', 10), S(0.07, x, y + 0.05, z, food, 0.6)); },
  chest: (P, x, z, ry = 0, col = '#7a4a26') => { P.wood.push(B(0.8, 0.5, 0.5, x, 0.25, z, col, ry), B(0.82, 0.18, 0.52, x, 0.56, z, col, ry), B(0.84, 0.05, 0.54, x, 0.48, z, '#c8a040', ry), B(0.1, 0.12, 0.05, x + Math.sin(ry) * 0.27, 0.42, z + Math.cos(ry) * 0.27, '#c8a040', ry)); }
};
const solidBox = (b, lx, lz, r) => { const [x, z] = L2W(b, lx, lz); addCircle(x, z, r, 'meuble'); };

// ---------------- la place : pavés, fontaine, étals, bancs, lanternes ----------------
function buildSquare() {
  const g = new THREE.CircleGeometry(7.6, 48, 0, Math.PI * 2); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
  // irrégularité du bord + suivi du terrain
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); if (r > 7) { const k = 1 + (vnoise(Math.atan2(z, x) * 3, 1) - 0.5) * 0.25; p.setX(i, x * k); p.setZ(i, z * k); } p.setY(i, heightAt(p.getX(i), p.getZ(i)) + 0.04); }
  const uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 7.6 * 0.5 + 0.5, p.getZ(i) / 7.6 * 0.5 + 0.5);
  g.computeVertexNormals(); const m = new THREE.Mesh(g, VM.cobble); m.receiveShadow = true; scene.add(m);
  // fontaine
  const y0 = heightAt(0, 0) + 0.04, F2 = { wood: [], stone: [], glow: [] };
  F2.stone.push(shade(new THREE.CylinderGeometry(2.25, 2.4, 0.6, 8).translate(0, 0.3, 0), '#ffffff', 0.7), shade(new THREE.CylinderGeometry(2.35, 2.35, 0.12, 8).translate(0, 0.62, 0), '#ffffff', 0.9));
  F2.stone.push(shade(new THREE.CylinderGeometry(0.32, 0.45, 1.6, 8).translate(0, 0.8, 0), '#ffffff', 0.7), shade(new THREE.CylinderGeometry(0.95, 0.35, 0.35, 10).translate(0, 1.7, 0), '#ffffff', 0.75), shade(new THREE.CylinderGeometry(0.12, 0.2, 0.6, 8).translate(0, 2.1, 0), '#ffffff', 0.8), shade(new THREE.SphereGeometry(0.2, 8, 6).translate(0, 2.45, 0), '#ffffff', 0.8));
  const fm = new THREE.Mesh(mergeGeos(F2.stone), VM.stone); fm.position.y = y0; fm.castShadow = fm.receiveShadow = true; scene.add(fm);
  addCircle(0, 0, 2.45, 'fontaine');
  if (waterMatRef) { const wg = new THREE.CircleGeometry(2.15, 24); wg.rotateX(-Math.PI / 2); const e = []; const pp = wg.attributes.position; for (let i = 0; i < pp.count; i++) e.push(0.15 + 0.5 * (1 - Math.hypot(pp.getX(i), pp.getZ(i)) / 2.15)); wg.setAttribute('edge', new THREE.Float32BufferAttribute(e, 1)); const wm = new THREE.Mesh(wg, waterMatRef); wm.position.y = y0 + 0.5; wm.renderOrder = 2; scene.add(wm);
    const bg = new THREE.CircleGeometry(0.9, 16); bg.rotateX(-Math.PI / 2); const e2 = []; for (let i = 0; i < bg.attributes.position.count; i++) e2.push(0.3); bg.setAttribute('edge', new THREE.Float32BufferAttribute(e2, 1)); const bm = new THREE.Mesh(bg, waterMatRef); bm.position.y = y0 + 1.86; bm.renderOrder = 2; scene.add(bm); }
  V.fountain = { y: y0 };
  // bancs autour
  const P = { wood: [], stone: [], glow: [] };
  for (const a of [0.7, 2.3, 3.9, 5.5]) { const x = Math.cos(a) * 4.0, z = Math.sin(a) * 4.0; const ry = Math.atan2(-x, -z) + Math.PI; benchAt(P, x, z, ry); }
  return P;
}
function benchAt(P, x, z, ry) { const y = heightAt(x, z) + 0.04; const g = []; F.bench({ wood: g }, 0, 0, 0, 1.6); g.push(B(1.6, 0.4, 0.06, 0, 0.7, -0.16, WOOD)); const m = new THREE.Mesh(mergeGeos(g), VM.wood); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; scene.add(m); addCircle(x, z, 0.5, 'banc'); }
function propMesh(parts, x, z, ry = 0, y) { const out = []; for (const k of ['wood', 'stone', 'glow', 'floor']) if (parts[k] && parts[k].length) { const m = new THREE.Mesh(mergeGeos(parts[k]), k === 'glow' ? VM.glow : VM[k === 'floor' ? 'floor' : k]); m.position.set(x, y ?? heightAt(x, z), z); m.rotation.y = ry; m.castShadow = k !== 'glow'; m.receiveShadow = true; scene.add(m); out.push(m); } return out; }
function stall(x, z, ry, clothMat, goods) {
  const P = { wood: [], stone: [], glow: [] }; for (const [a, c] of [[-1.1, -0.6], [1.1, -0.6], [1.1, 0.6], [-1.1, 0.6]]) P.wood.push(B(0.1, 2.2 + (c < 0 ? 0.3 : 0), 0.1, a, 1.1 + (c < 0 ? 0.15 : 0), c, WOOD));
  F.counter(P, 0, 0.35, 0, 2.2); for (let i = 0; i < 5; i++) goods(P, -0.85 + i * 0.42, 0.4);
  F.crate(P, -0.8, -0.3, 0.5); F.crate(P, 0.7, -0.4, 0.45, 0.3); F.barrel(P, 1.3, -0.2, 0.8);
  propMesh(P, x, z, ry); const aw = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6, 4, 2), clothMat); const ap = aw.geometry.attributes.position; for (let i = 0; i < ap.count; i++) ap.setZ(i, Math.sin((ap.getX(i) + 1.3) * 2.4) * 0.04);
  aw.geometry.rotateX(-Math.PI / 2 + 0.28); aw.position.set(x, heightAt(x, z) + 2.35, z); aw.rotation.y = ry; aw.castShadow = true; scene.add(aw); V.anim.push({ type: 'cloth', m: aw, base: aw.rotation.x });
  const c = Math.cos(ry), s = Math.sin(ry); for (const [a, cc] of [[-1.1, -0.6], [1.1, -0.6], [1.1, 0.6], [-1.1, 0.6]]) addCircle(x + a * c + cc * s, z - a * s + cc * c, 0.15, 'étal'); addCircle(x + 0.35 * s, z + 0.35 * c, 0.5, 'étal'); addCircle(x + 0.8 * c + 0.35 * s, z - 0.8 * s + 0.35 * c, 0.4, 'étal'); addCircle(x - 0.8 * c + 0.35 * s, z + 0.8 * s + 0.35 * c, 0.4, 'étal');
}
const fruit = col => (P, x, z) => { P.wood.push(B(0.36, 0.12, 0.3, x, 1.09, z, '#8a6440')); for (let k = 0; k < 5; k++) P.wood.push(S(0.07, x + (rnd() - 0.5) * 0.24, 1.2 + rnd() * 0.05, z + (rnd() - 0.5) * 0.18, col[k % col.length])); };
export function lanternPost(x, z, light) {
  const P = { wood: [], stone: [], glow: [] }; P.wood.push(C(0.07, 0.09, 2.6, 0, 0, 0, '#2a2a30', 8), B(0.5, 0.06, 0.06, 0.22, 2.5, 0, '#2a2a30'), B(0.26, 0.04, 0.26, 0.45, 2.36, 0, '#2a2a30'), B(0.3, 0.06, 0.3, 0.45, 1.96, 0, '#2a2a30'));
  P.stone.push(B(0.34, 0.3, 0.34, 0, 0.15, 0, '#ffffff')); P.glow.push(new THREE.BoxGeometry(0.2, 0.32, 0.2).translate(0.45, 2.15, 0));
  const ms = propMesh(P, x, z, rnd() * 6.28); const glowM = ms.find(m => m.material === VM.glow); if (glowM) { glowM.material = new THREE.MeshBasicMaterial({ color: '#ffd27a' }); V.lights.push({ type: 'lantern', m: glowM }); }
  addCircle(x, z, 0.25, 'lanterne');
  if (light) { const l = new THREE.PointLight('#ffb35a', 0, 12, 1.5); l.position.set(x, heightAt(x, z) + 2.3, z); scene.add(l); V.lights.push({ type: 'plight', l, base: 16 }); }
}
function fence(points, closed, kind = 'clôture') {
  const P = { wood: [] }; const pts = closed ? [...points, points[0]] : points; let x0 = pts[0][0], z0 = pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; if (pts[i][2] === 'gap') continue; const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 1.6)), ry = Math.atan2(bx - ax, bz - az) - Math.PI / 2;
    for (let k = 0; k <= n; k++) { const t = k / n, x = lerp(ax, bx, t), z = lerp(az, bz, t); P.wood.push(B(0.1, 1.0, 0.1, x - x0, heightAt(x, z) - heightAt(x0, z0) + 0.45, z - z0, '#7a5a3a', rnd() * 0.3)); }
    for (const y of [0.45, 0.8]) { const mx = (ax + bx) / 2, mz = (az + bz) / 2; const hy = (heightAt(ax, az) + heightAt(bx, bz)) / 2 - heightAt(x0, z0); P.wood.push(B(L, 0.07, 0.05, mx - x0, hy + y, mz - z0, '#8a6a46', ry)); }
    addSeg(ax, az, bx, bz, kind, 0.08); }
  propMesh(P, x0, z0, 0);
}

// ---------------- construction du village ----------------
let waterMatRef = null;
export function buildVillage(waterMat) {
  waterMatRef = waterMat;
  const R = (x, z) => facing(x, z, 0, 0);
  // 1. Auberge « Le Chêne Tranquille »
  building({ id: 'auberge', name: 'Auberge « Le Chêne Tranquille »', x: -11, z: -7, rot: R(-11, -7), w: 8, d: 6, h: 3.0, roof: 'tile', enter: true, chimney: -1, shutter: '#2f5a3a',
    walls: null, inside: (P, b) => {
      F.counter(P, 2.2, -1.2, 0, 2.6); F.shelf(P, 2.4, -2.75, 0, 2.2, false); F.barrel(P, 3.5, -1.0, 0.9); F.barrel(P, 3.5, -0.3, 0.9); F.barrel(P, 0.6, -2.5, 0.8);
      F.fireplace(P, -2.4, -2.62, 0); F.rug(P, -2.4, -1.4, 2.0, 1.4, '#7a2a2a');
      for (const [tx, tz] of [[-2.6, 0.9], [0.3, 0.4], [2.4, 1.3]]) { F.table(P, tx, tz, 0, 0.9); F.bench(P, tx, tz - 0.62, 0, 1.2); F.bench(P, tx, tz + 0.62, 0, 1.2); F.mug(P, tx - 0.2, 0.78, tz); F.plate(P, tx + 0.25, 0.79, tz - 0.1); F.candle(P, tx, 0.78, tz + 0.15); solidBox(b, tx, tz, 0.55); solidBox(b, tx - 0.35, tz, 0.4); solidBox(b, tx + 0.35, tz, 0.4); }
      F.mug(P, 1.6, 1.07, -1.2); F.mug(P, 2.9, 1.07, -1.1); F.candle(P, 1.2, 1.07, -1.2);
      for (let i = 0; i < 5; i++) { const [x, z] = L2W(b, 1.05 + i * 0.58, -1.2); addCircle(x, z, 0.32, 'comptoir'); } { const [x, z] = L2W(b, -2.4, -2.6); addCircle(x, z, 0.75, 'cheminée'); } { const [x, z] = L2W(b, 3.5, -0.65); addCircle(x, z, 0.65, 'tonneau'); }
      poi('aub_comptoir', b, 2.2, -2.12, 0); poi('aub_t1', b, -2.6, 0.2, 0); poi('aub_t2', b, 0.3, 1.1, Math.PI); poi('aub_t3', b, 2.4, 0.6, 0); poi('aub_t4', b, -2.6, 1.6, Math.PI); poi('aub_feu', b, -2.4, -1.4, Math.PI);
      poi('aub_lit', b, -0.9, 2.2, 0);
    } });
  V.buildings.at(-1).walls = null;
  // 2. Forge de Borin (ouverte sur la place)
  building({ id: 'forge', name: 'Forge de Borin', x: 11, z: -7, rot: R(11, -7), w: 6, d: 4.6, h: 2.9, roof: 'slate', style: 'stone', chimney: 1,
    open: { walls: [{ side: 'b' }, { side: 'l', h: 1.15 }] }, inside: (P, b) => {
      P.stone.push(B(1.6, 0.9, 1.3, 1.9, 0.45, -1.4, '#ffffff'), B(0.9, 0.12, 0.8, 1.9, 0.92, -1.4, '#2a2420')); P.glow.push(B(0.7, 0.1, 0.6, 1.9, 0.96, -1.4, '#ffffff'));
      P.wood.push(B(0.25, 0.55, 0.3, -0.2, 0.28, -0.2, '#3a3a3e'), B(0.75, 0.16, 0.3, -0.2, 0.62, -0.2, '#4a4a52'), B(0.3, 0.1, 0.22, 0.25, 0.66, -0.2, '#4a4a52'));
      F.barrel(P, 0.8, 1.4, 0.8); P.wood.push(C(0.3, 0.3, 0.05, 0.8, 0.66, 1.4, '#3a5a6a'));
      for (let i = 0; i < 5; i++) P.wood.push(B(0.05, 0.8, 0.05, -2.2 + i * 0.25, 1.4, -2.05, '#5a5a62'), B(0.18, 0.12, 0.05, -2.2 + i * 0.25, 1.85, -2.05, '#4a4a52'));
      P.wood.push(B(1.6, 0.08, 0.3, -1.7, 1.0, -2.05, WOOD)); for (let i = 0; i < 8; i++) P.wood.push(C(0.12, 0.12, 0.9, -2.5 + (i % 4) * 0.26, 0.12 + Math.floor(i / 4) * 0.24, 1.6, '#8a6040', 7).rotateX(Math.PI / 2).translate(0, 0.0, 0));
      P.wood.push(B(0.8, 0.5, 0.5, 2.5, 0.6, -0.2, '#6a4a32', 0, 0, 0.3));
      { const [x, z] = L2W(b, 1.9, -1.4); addCircle(x, z, 0.95, 'âtre'); const l = new THREE.PointLight('#ff8a3a', 18, 10, 1.5); l.position.set(x, b.fy + 1.5, z); scene.add(l); V.lights.push({ type: 'fire', l, base: 18 }); V.forgeFire = { x, y: b.fy + 1.1, z }; }
      { const [x, z] = L2W(b, -0.2, -0.2); addCircle(x, z, 0.4, 'enclume'); } { const [x, z] = L2W(b, 0.8, 1.4); addCircle(x, z, 0.35, 'tonneau'); }
      poi('forge_enclume', b, -0.2, 0.55, Math.PI);
    } });
  // 3. Échoppe de Maëlle
  building({ id: 'echoppe', name: 'Échoppe de Maëlle', x: 10.5, z: 7, rot: R(10.5, 7), w: 5, d: 4.4, h: 2.6, roof: 'tile', roofTint: '#e8d0c0', enter: true, shutter: '#8a3a3a', inside: (P, b) => {
    F.counter(P, 0, -0.4, 0, 2.4); F.shelf(P, -1.4, -1.95, 0, 1.6, false); F.shelf(P, 1.0, -1.95, 0, 1.6, false); F.sack(P, -2.0, 1.4); F.sack(P, -1.6, 1.6); F.barrel(P, 1.9, 1.2, 0.8); F.crate(P, 1.9, 0.3, 0.5);
    for (let i = 0; i < 4; i++) { const [x, z] = L2W(b, -0.9 + i * 0.6, -0.4); addCircle(x, z, 0.3, 'comptoir'); } { const [x, z] = L2W(b, 1.9, 0.75); addCircle(x, z, 0.6, 'tonneau'); }
    for (let i = 0; i < 5; i++) F.plate(P, -0.9 + i * 0.45, 1.03, -0.4, ['#c84a3a', '#e8b030', '#8ab040', '#a050a0', '#e07030'][i]);
    poi('echoppe_comptoir', b, 0, -1.2, 0); poi('echoppe_lit', b, -1.6, 0.6, 0);
  }, walls: null });
  // 4. Maison d'Édran (archives + alcôve secrète derrière la bibliothèque)
  building({ id: 'edran', name: "Maison d'Édran — les archives", x: -10.5, z: 10.5, rot: R(-10.5, 10.5), w: 6.2, d: 5.2, h: 2.8, roof: 'slate', enter: true, chimney: 1, shutter: '#5a4a7a', inside: (P, b) => {
    // cloison : petite pièce secrète au fond à gauche (x < -1.2, z < -1.2)
    P.wood.push(B(1.75, 2.4, 0.16, -2.25, 1.2, -1.2, '#8a7050'), B(0.16, 2.4, 0.2, -1.2, 1.2, -2.5, '#8a7050'));
    { const [ax, az] = L2W(b, -3.1, -1.2), [bx, bz] = L2W(b, -2.1, -1.2); addSeg(ax, az, bx, bz, 'cloison', 0.1); }
    F.shelf(P, 1.2, -2.4, 0, 1.6); F.shelf(P, 2.6, -1.0, -Math.PI / 2, 1.6); F.table(P, 0.8, -0.4, 0, 1.0); F.chair(P, 0.8, -1.0, 0); F.candle(P, 0.5, 0.78, -0.4); P.wood.push(B(0.4, 0.03, 0.3, 1.0, 0.79, -0.35, '#efe2c0', 0.3));
    F.bed(P, 2.2, 1.2, Math.PI / 2, '#4a4a7a'); F.fireplace(P, -2.95, 0.6, Math.PI / 2); F.rug(P, -0.6, 0.9, 1.8, 1.3, '#3a4a6a');
    // pièce secrète
    F.chest(P, -2.4, -2.1, 0, '#5a3a20'); F.candle(P, -1.6, 0.0, -2.2); P.wood.push(B(0.9, 0.06, 0.5, -2.3, 1.2, -2.35, WOOD)); for (let i = 0; i < 4; i++) P.wood.push(B(0.18, 0.26, 0.06, -2.6 + i * 0.2, 1.36, -2.35, '#c8b48a', 0.2 * i));
    addCircle(...L2W(b, 0.5, -0.4), 0.45, 'table'); addCircle(...L2W(b, 1.1, -0.4), 0.45, 'table'); addCircle(...L2W(b, 1.7, 1.2), 0.55, 'lit'); addCircle(...L2W(b, 2.6, 1.2), 0.55, 'lit'); { const [x, z] = L2W(b, -2.95, 0.6); addCircle(x, z, 0.7, 'cheminée'); }
    { const [x, z] = L2W(b, 1.2, -2.4); addCircle(x, z, 0.5, 'étagère'); addCircle(...L2W(b, 0.6, -2.4), 0.45, 'étagère'); addCircle(...L2W(b, 1.8, -2.4), 0.45, 'étagère'); } { addCircle(...L2W(b, 2.6, -1.0), 0.5, 'étagère'); }
    poi('edran_bureau', b, 0.8, -1.2, 0); poi('edran_lit', b, 0.3, 0.8, 0); poi('edran_feu', b, -2.0, 0.6, -Math.PI / 2);
    // bibliothèque coulissante (énigme) : elle ferme l'ouverture de la cloison
    const shelfG = []; F.shelf({ wood: shelfG }, 0, 0, Math.PI / 2, 1.3); const sm = new THREE.Mesh(mergeGeos(shelfG), VM.wood); sm.castShadow = true; sm.position.set(-1.38, 0, -1.9); b.group.add(sm);
    const [ax, az] = L2W(b, -1.25, -1.25), [bx, bz] = L2W(b, -1.25, -2.6); const seg = addSeg(ax, az, bx, bz, 'bibliothèque', 0.2);
    V.bookcase = { m: sm, seg, open: 0, target: 0, b }; const [ix, iz] = L2W(b, -0.7, -1.9); interact('livres', ix, iz, 1.2, 'Examiner la bibliothèque', { inside: 'edran' });
    const [cx, cz] = L2W(b, -2.4, -1.7); interact('coffre_edran', cx, cz, 1.0, 'Ouvrir le coffre', { inside: 'edran', need: 'livres' });
    const [nx, nz] = L2W(b, 1.0, -0.2); interact('note_edran', nx, nz, 1.5, 'Lire la note', { inside: 'edran' });
  }, walls: null });
  // 5. Maison de Liora et Torven
  building({ id: 'liora', name: 'Maison de Liora et Torven', x: -21, z: -2.5, rot: facing(-21, -2.5, -14, 3), w: 5.6, d: 5, h: 2.6, roof: 'moss', enter: true, chimney: -1, shutter: '#6a8a3a', inside: (P, b) => {
    F.table(P, 1.4, -1.6, 0, 1.2); for (let i = 0; i < 5; i++) P.wood.push(C(0.07, 0.06, 0.2, 0.9 + i * 0.25, 0.78, -1.6, ['#7fd0a0', '#d07fa0', '#a0a0ff', '#f0d060', '#80c0e0'][i], 7)); P.wood.push(C(0.22, 0.3, 0.4, 2.0, 0.0, -0.3, '#2a2a2a', 10));
    for (let i = 0; i < 6; i++) P.wood.push(S(0.14, -2.2 + i * 0.6, 2.25, -1.2, ['#6a9a3a', '#8aaa4a', '#a08a3a'][i % 3], 1.5));
    P.wood.push(B(4.4, 0.05, 0.05, 0, 2.4, -1.2, WOOD)); F.bed(P, -1.8, 1.0, Math.PI / 2, '#3a6a4a'); F.bed(P, -1.8, -0.4, Math.PI / 2, '#8a6a3a'); F.pot(P, 2.2, 1.8); F.shelf(P, 2.4, 0.6, -Math.PI / 2, 1.2, false);
    addCircle(...L2W(b, 1.4, -1.6), 0.75, 'table'); addCircle(...L2W(b, 2.0, -0.3), 0.35, 'chaudron'); addCircle(...L2W(b, -1.8, 1.0), 0.6, 'lit'); addCircle(...L2W(b, -1.8, -0.4), 0.6, 'lit'); addCircle(...L2W(b, -1.0, 1.0), 0.5, 'lit'); addCircle(...L2W(b, -1.0, -0.4), 0.5, 'lit'); addCircle(...L2W(b, 2.4, 0.6), 0.5, 'étagère');
    poi('liora_table', b, 1.4, -0.9, Math.PI); poi('liora_lit', b, -0.6, 1.0, 0); poi('torven_lit', b, -0.6, -0.4, 0);
  }, walls: null });
  // 6. Maison abandonnée (histoire racontée par les objets ; réparable)
  const ab = building({ id: 'abandon', name: 'La maison abandonnée', x: 20.5, z: 16, rot: facing(20.5, 16, 14, 11.5), w: 5.2, d: 4.6, h: 2.5, roof: 'moss', roofTint: '#b8b0a0', enter: true, boarded: true, hole: { side: 1, x0: -0.6, x1: 1.4, t0: 0.25, t1: 0.75 }, inside: (P, b) => {
    F.table(P, 0.8, -1.2, 0.3, 1.0); F.chair(P, 1.5, -0.4, 2.0); P.wood.push(B(0.42, 0.06, 0.42, -0.4, 0.04, -1.0, LIGHTW, 0.9));
    P.wood.push(B(0.9, 0.5, 0.6, -1.7, 0.4, 1.3, '#8a6a46'), B(0.92, 0.06, 0.62, -1.7, 0.15, 1.3, '#6a4a2a')); for (const s of [-1, 1]) P.wood.push(C(0.3, 0.3, 0.05, -1.7 + s * 0.35, 0, 1.3, '#6a4a2a', 10).rotateZ(Math.PI / 2).translate(0, 0, 0));
    P.wood.push(B(0.6, 0.8, 0.06, 2.4, 1.5, -0.6, '#6a4a2a', Math.PI / 2), B(0.5, 0.7, 0.03, 2.36, 1.5, -0.6, '#2a2a2a', Math.PI / 2)); F.bed(P, -1.6, -1.2, Math.PI / 2, '#5a5a5a');
    for (let i = 0; i < 12; i++) P.wood.push(B(0.3 + rnd() * 0.5, 0.04, 0.12, (rnd() - 0.5) * 4, 0.05, (rnd() - 0.5) * 3.6, '#5a4632', rnd() * 3));
    P.wood.push(B(0.25, 0.02, 0.18, 0.6, 0.79, -1.1, '#e8dcc0', 0.4));
    addCircle(...L2W(b, 0.8, -1.2), 0.65, 'table'); addCircle(...L2W(b, -1.6, -1.2), 0.6, 'lit'); addCircle(...L2W(b, -0.8, -1.2), 0.5, 'lit'); addCircle(...L2W(b, -1.7, 1.3), 0.5, 'berceau');
    interact('ab_lettre', ...L2W(b, 0.6, -0.6), 0.9, 'Lire la lettre', { inside: 'abandon', story: 1 }); interact('ab_berceau', ...L2W(b, -0.8, 1.0), 0.9, 'Regarder le berceau', { inside: 'abandon', story: 1 });
    interact('ab_portrait', ...L2W(b, 1.9, -0.6), 0.9, 'Retourner le portrait', { inside: 'abandon', story: 1 }); interact('ab_journal', ...L2W(b, -0.9, -0.3), 0.9, 'Ramasser le carnet', { inside: 'abandon', story: 1 });
    interact('ab_plancher', ...L2W(b, 1.0, 1.55), 0.8, 'Latte de plancher descellée', { inside: 'abandon', story: 2 });
    poi('ab_atelier', null, ...L2W(b, -1.6, 3.6), null); poi('ab_dedans', b, 0, 0.5, 0);
  }, walls: null });
  V.abandoned = ab;
  // 7. Chapelle de l'Aube
  building({ id: 'chapelle', name: "Chapelle de l'Aube", x: 0, z: -18.5, rot: 0, w: 5.4, d: 8.2, h: 3.4, roof: 'slate', style: 'stone', enter: true, pitch: 0.9, stainedGlass: true, inside: (P, b) => {
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { F.bench(P, s * 1.2, 1.9 - i * 1.25, 0, 1.6); P.wood.push(B(1.6, 0.5, 0.06, s * 1.2, 0.7, 1.9 - i * 1.25 + 0.16, WOOD)); for (const k of [-0.55, 0, 0.55]) addCircle(...L2W(b, s * 1.2 + k, 1.9 - i * 1.25), 0.2, 'banc'); }
    P.stone.push(B(1.8, 0.9, 0.8, 0, 0.45, -3.2, '#ffffff'), B(2.0, 0.1, 0.9, 0, 0.94, -3.2, '#ffffff')); P.wood.push(B(1.9, 0.02, 0.6, 0, 1.0, -3.2, '#e8dcc0'));
    for (const x of [-0.7, -0.35, 0.35, 0.7]) F.candle(P, x, 1.0, -3.3); F.rug(P, 0, -0.2, 1.0, 5.0, '#7a2a3a');
    P.glow.push(new THREE.CircleGeometry(0.5, 16).translate(0, 2.4, -4.0)); addCircle(...L2W(b, 0, -3.2), 1.0, 'autel');
    poi('chap_autel', b, 0, -2.4, Math.PI); poi('chap_banc', b, -1.2, 0.03, Math.PI); poi('chap_banc2', b, 1.2, -1.22, Math.PI);
  }, walls: null });
  // fenêtres de la chapelle (vitraux) — ajoutées comme pièces séparées
  { const b = V.buildings.at(-1); const g = []; const cols = ['#d04a4a', '#4a7ad0', '#e0c040', '#4ab070'];
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = 2.4 - i * 2.4; for (let k = 0; k < 4; k++) { const pg = new THREE.PlaneGeometry(0.28, 0.5); pg.rotateY(s * Math.PI / 2); pg.translate(s * (b.w / 2 + 0.02), 1.6 + Math.floor(k / 2) * 0.52, z - 0.15 + (k % 2) * 0.3); g.push(shade(pg, cols[(k + i) % 4], 1)); } }
    const m = new THREE.Mesh(mergeGeos(g), VM.stained); b.upG.add(m);
    // clocher sur le pignon avant
    const tw = { stone: [B(1.3, 1.6, 1.3, 0, 3.4 + b.rf.rise + 0.4, 3.2, '#ffffff')], wood: [B(0.4, 0.4, 0.4, 0, 3.4 + b.rf.rise + 1.1, 3.2, '#c8a040')] };
    const cone = new THREE.ConeGeometry(1.05, 1.9, 4).rotateY(Math.PI / 4).translate(0, 3.4 + b.rf.rise + 2.15, 3.2); const tg = new THREE.Group(); tg.add(new THREE.Mesh(mergeGeos(tw.stone), VM.stone), new THREE.Mesh(mergeGeos(tw.wood), VM.wood), new THREE.Mesh(shade(cone, '#ffffff', 0.7), VM.slate)); tg.children.forEach(c => c.castShadow = true); b.roofG.add(tg); }
  // 8 et 9. Maisons familiales (fermées)
  building({ id: 'famA', name: 'Maison des Aubert', x: 15.5, z: -16, rot: R(15.5, -16), w: 5.2, d: 4.6, h: 2.7, roof: 'tile', fakeDoor: true, chimney: 1, shutter: '#3a5a8a' });
  building({ id: 'famB', name: 'Maison des Fenwick', x: -16.5, z: -17, rot: R(-16.5, -17) + 0.2, w: 5.4, d: 4.4, h: 2.6, roof: 'slate', fakeDoor: true, chimney: -1, shutter: '#8a5a2a' });
  // 10. Ferme : maison au toit de chaume et grange
  building({ id: 'ferme', name: 'Ferme Gaspard', x: -31.5, z: 5, rot: Math.PI / 2, w: 6, d: 5, h: 2.5, roof: 'thatch', roofTint: '#c8b088', fakeDoor: true, chimney: 1, ov: 0.7, shutter: '#6a4a2a' });
  building({ id: 'grange', name: 'Grange', x: -34, z: -4.5, rot: Math.PI / 2, w: 6.4, d: 6, h: 3.2, roof: 'thatch', roofTint: '#c8b088', ov: 0.6, open: { walls: [{ side: 'b' }, { side: 'l' }, { side: 'r' }] }, inside: (P, b) => {
    for (let i = 0; i < 6; i++) P.wood.push(B(1.2, 0.6, 0.8, -2.2 + (i % 3) * 1.3, 0.3 + Math.floor(i / 3) * 0.6, -2.2, '#d8b860', 0.05 * i)); addCircle(...L2W(b, -0.9, -2.2), 1.6, 'foin'); addCircle(...L2W(b, -2.2, -2.2), 0.8, 'foin');
    F.barrel(P, 2.5, -2.3); F.crate(P, 2.3, -1.5, 0.5); P.wood.push(B(1.4, 0.08, 0.5, 1.6, 0.9, 0.6, WOOD), C(0.35, 0.35, 0.1, 1.0, 0.0, 1.0, '#5a3a22', 10).rotateX(Math.PI / 2).translate(0, 0.35, 0)); addCircle(...L2W(b, 2.5, -2.3), 0.4, 'tonneau');
  } });
  // 11. Écurie
  building({ id: 'ecurie', name: 'Écurie', x: 23.5, z: -10, rot: -Math.PI / 2, w: 6, d: 4.2, h: 2.6, roof: 'tile', roofTint: '#c8b8a8', open: { walls: [{ side: 'b' }, { side: 'l' }, { side: 'r' }] }, inside: (P, b) => {
    P.wood.push(B(0.12, 1.2, 3.2, 0, 0.6, -0.4, WOOD)); P.wood.push(B(5.4, 0.5, 0.5, 0, 0.25, -1.75, '#6a4a2a')); for (let i = 0; i < 4; i++) P.wood.push(B(0.9, 0.5, 0.7, -2.2 + i * 1.4, 0.25, -1.4, '#d8b860'));
    P.wood.push(B(5.4, 0.08, 0.1, 0, 1.0, 1.9, WOOD)); { const [ax, az] = L2W(b, 0, 1.2), [bx, bz] = L2W(b, 0, -2.0); addSeg(ax, az, bx, bz, 'stalle', 0.1); }
    poi('ecurie_box', b, -1.5, -0.3, 0);
  } });
  // marquage des fenêtres (après coup, car le constructeur lit b.walls à la création) — voir configureWindows
  // la place
  buildSquare();
  stall(5.2, -3.8, facing(5.2, -3.8, 0, 0), VM.cloth, fruit(['#d03a2a', '#e8b030', '#8ab040']));
  stall(-5.4, -3.2, facing(-5.4, -3.2, 0, 0), VM.cloth2, fruit(['#7a3a8a', '#e07030', '#e8d880']));
  { const r1 = facing(5.2, -3.8, 0, 0), r2 = facing(-5.4, -3.2, 0, 0); poi('etal_maelle', null, 5.2 - 0.5 * Math.sin(r1), -3.8 - 0.5 * Math.cos(r1), r1); poi('etal2', null, -5.4 - 0.5 * Math.sin(r2), -3.2 - 0.5 * Math.cos(r2), r2); }
  for (let i = 0; i < 4; i++) { const a = 0.7 + i * 1.6; poi('fontaine_' + i, null, Math.cos(a) * 3.1, Math.sin(a) * 3.1, Math.atan2(-Math.cos(a), -Math.sin(a))); }
  poi('place_n', null, 0, -5.6, 0); poi('place_s', null, 0.5, 5.8, Math.PI); poi('place_e', null, 5.8, 0.6, -Math.PI / 2); poi('place_o', null, -5.8, 0.2, Math.PI / 2);
  // lanternes (4 portent une vraie lumière la nuit)
  lanternPost(6.6, 2.2, true); lanternPost(-6.4, -1.4, true); lanternPost(2.2, -7.0, false); lanternPost(-2.4, 7.0, false); lanternPost(1.8, -13.6, true); lanternPost(24.6, -0.4, false); lanternPost(1.6, 14.5, false); lanternPost(-17.5, 4.6, false); lanternPost(-7.2, -9.5, false); lanternPost(14.5, 11.5, true);
  // le vieux chêne (initiales gravées) et ses bancs
  V.oak = { x: 5.5, z: -11.8 };
  benchAt(null, 7.6, -10.2, facing(7.6, -10.2, 5.5, -11.8) + Math.PI); benchAt(null, 3.4, -10.0, facing(3.4, -10.0, 5.5, -11.8) + Math.PI);
  poi('banc_chene', null, 7.2, -10.6, facing(7.6, -10.2, 5.5, -11.8) + Math.PI); poi('banc_chene2', null, 3.8, -10.4, facing(3.4, -10.0, 5.5, -11.8) + Math.PI);
  interact('initiales', 5.5, -11.8, 2.1, "Examiner l'écorce du vieux chêne");
  // puits de pierre près de l'auberge
  { const P = { stone: [shade(new THREE.CylinderGeometry(0.75, 0.8, 0.8, 12, 1, true).translate(0, 0.4, 0), '#ffffff', 0.7), shade(new THREE.TorusGeometry(0.76, 0.1, 6, 14).rotateX(Math.PI / 2).translate(0, 0.8, 0), '#ffffff', 0.9)], wood: [B(0.1, 1.8, 0.1, -0.7, 0.9, 0, WOOD), B(0.1, 1.8, 0.1, 0.7, 0.9, 0, WOOD), B(1.7, 0.12, 0.12, 0, 1.8, 0, DARKW), C(0.08, 0.08, 1.4, 0, 1.45, 0, WOOD, 6).rotateZ(Math.PI / 2).translate(0, 0, 0), C(0.14, 0.12, 0.22, 0, 1.0, 0, '#6a4a2a', 8)], glow: [] };
    const d = shade(new THREE.CircleGeometry(0.68, 12).rotateX(-Math.PI / 2).translate(0, 0.3, 0), '#0a1418', 1); P.stone.push(d); propMesh(P, -4.2, -11.5, 0.4); addCircle(-4.2, -11.5, 0.95, 'puits'); interact('puits', -4.2, -11.5, 1.6, 'Regarder dans le puits'); }
  // panneau du village
  { const P = { wood: [B(0.12, 2.2, 0.12, 0, 1.1, 0, WOOD), B(1.5, 0.45, 0.06, 0.4, 1.8, 0, LIGHTW), B(1.2, 0.35, 0.06, -0.3, 1.25, 0.02, LIGHTW, 0, 0, -0.08)], stone: [], glow: [] }; propMesh(P, 2.6, 17.5, 0.3); addCircle(2.6, 17.5, 0.2, 'panneau'); interact('panneau', 2.6, 17.5, 1.5, 'Lire le panneau'); }
  // écurie : abreuvoir et clôture du paddock
  fence([[27, -14], [27, -6], [20.5, -6, 'gap'], [20.5, -14]], false);
  // enclos des moutons
  fence([[-31, -15], [-23, -15], [-23, -9], [-26.2, -9, 'gap'], [-27.8, -9], [-31, -9]], true);
  { const [ax, az] = [-26.2, -9], [bx, bz] = [-27.8, -9]; addSeg(ax, az, bx, bz, 'barrière', 0.08); const P = { wood: [B(1.6, 0.07, 0.05, 0.8, 0.5, 0, '#9a7a56'), B(1.6, 0.07, 0.05, 0.8, 0.85, 0, '#9a7a56'), B(0.07, 0.5, 0.05, 0.8, 0.68, 0, '#9a7a56', 0, 0, 1.0)] }; propMesh(P, -27.8, -9, 0); }
  poi('enclos', null, -27, -7.8, Math.PI); V.pen = { x0: -30.6, x1: -23.4, z0: -14.6, z1: -9.4 };
  // poulailler
  fence([[-24.6, 9], [-20.4, 9], [-20.4, 12.2], [-24.6, 12.2]], true);
  { const P = { wood: [B(1.4, 0.9, 1.0, 0, 0.75, 0, '#8a6440'), B(0.08, 0.3, 0.08, -0.6, 0.15, -0.4, WOOD), B(0.08, 0.3, 0.08, 0.6, 0.15, 0.4, WOOD), B(0.08, 0.3, 0.08, 0.6, 0.15, -0.4, WOOD), B(0.08, 0.3, 0.08, -0.6, 0.15, 0.4, WOOD), B(1.7, 0.08, 0.7, 0, 1.38, 0.25, '#7a4a2a', 0, 0.45), B(1.7, 0.08, 0.7, 0, 1.38, -0.25, '#7a4a2a', 0, -0.45), B(0.3, 0.3, 0.02, 0, 0.6, 0.51, '#1a1208')], stone: [], glow: [] }; propMesh(P, -23.6, 11.4, 0.2); addCircle(-23.6, 11.4, 0.85, 'poulailler'); }
  V.coop = { x0: -24.3, x1: -20.7, z0: 9.3, z1: 11.9 };
  // potager de Liora
  { const P = { wood: [], stone: [], glow: [] }; for (let r = 0; r < 4; r++) { P.wood.push(B(3.6, 0.12, 0.5, 0, 0.06, r * 0.8, '#4a3220', 0, 0, 0, 1)); for (let k = 0; k < 7; k++) P.wood.push(S(0.16 + rnd() * 0.06, -1.5 + k * 0.5, 0.2, r * 0.8, r % 2 ? '#5a9a3a' : '#7ab04a', 0.8)); } propMesh(P, -19.8, -10.6, 0); poi('potager', null, -19.8, -6.9, Math.PI); }
  fence([[-22.2, -11.4], [-17.4, -11.4], [-17.4, -7.6], [-19.0, -7.6, 'gap'], [-20.6, -7.6], [-22.2, -7.6]], true);
  // établi de Torven et tas de bois
  { const P = { wood: [], stone: [], glow: [] }; F.table(P, 0, 0, 0, 1.3); P.wood.push(B(0.6, 0.12, 0.2, 0.2, 0.84, 0, '#c8a070')); for (let i = 0; i < 9; i++) P.wood.push(C(0.1, 0.1, 1.2, -1.6, 0.12 + Math.floor(i / 3) * 0.2, -0.4 + (i % 3) * 0.22, '#8a6040', 7).rotateZ(Math.PI / 2).translate(-1.6 + 1.6, 0, 0)); propMesh(P, -16.8, 1.8, 0.9); addCircle(-16.8, 1.8, 0.9, 'établi'); poi('torven_etabli', null, ...[-16.8 + Math.sin(0.9) * 0.9, 1.8 + Math.cos(0.9) * 0.9], 0.9 + Math.PI); }
  // corde à linge
  { const P = { wood: [B(0.08, 2.0, 0.08, -2, 1.0, 0, WOOD), B(0.08, 2.0, 0.08, 2, 1.0, 0, WOOD), B(4, 0.02, 0.02, 0, 1.9, 0, '#d8d0c0')], stone: [], glow: [] }; const cl = ['#e8e0d0', '#7a9ac0', '#c05a5a', '#e8c070']; for (let i = 0; i < 5; i++) P.wood.push(B(0.5, 0.6 + rnd() * 0.3, 0.02, -1.5 + i * 0.75, 1.55, 0, cl[i % 4])); propMesh(P, -23.5, 3.2, 0.2); }
  // charrettes, tonneaux, caisses, foin, bûches autour du village
  const props = { wood: [], stone: [], glow: [] };
  const deco = (fn, x, z, ...a) => { const P = { wood: [], stone: [], glow: [] }; fn(P, 0, 0, ...a); propMesh(P, x, z, rnd() * 6.28); };
  deco(F.barrel, -6.2, -9.0); addCircle(-6.2, -9.0, 0.35, 'tonneau'); deco(F.barrel, -6.9, -8.6, 0.9); addCircle(-6.9, -8.6, 0.32, 'tonneau'); deco(F.crate, -6.6, -7.8, 0.6); addCircle(-6.6, -7.8, 0.4, 'caisse');
  deco(F.crate, 7.8, 4.0, 0.55); addCircle(7.8, 4.0, 0.38, 'caisse'); deco(F.barrel, 14.0, -4.6); addCircle(14.0, -4.6, 0.35, 'tonneau'); deco(F.sack, 6.6, 3.6); deco(F.pot, -7.2, 7.4); deco(F.pot, 7.4, 8.8, '#8a5a3a', '#c05a7a'); deco(F.pot, -14.4, -4.2, '#8a5a3a', '#e8c040');
  { const P = { wood: [B(1.6, 0.12, 2.6, 0, 0.75, 0, '#8a6440'), B(1.6, 0.5, 0.08, 0, 1.0, 1.28, '#7a5430'), B(1.6, 0.5, 0.08, 0, 1.0, -1.28, '#7a5430'), B(0.08, 0.5, 2.6, 0.78, 1.0, 0, '#7a5430'), B(0.08, 0.5, 2.6, -0.78, 1.0, 0, '#7a5430'), B(0.08, 0.08, 2.2, 0, 0.6, 2.2, WOOD), B(1.0, 0.6, 1.2, 0, 1.1, -0.4, '#d8b860')], stone: [], glow: [] };
    for (const s of [-1, 1]) P.wood.push(shade(new THREE.TorusGeometry(0.42, 0.06, 5, 12).rotateY(Math.PI / 2).translate(s * 0.88, 0.45, 0.2), '#5a3a22', 0.8)); propMesh(P, -26.5, 1.5, 1.2); addCircle(-26.5, 1.5, 1.3, 'charrette'); addCircle(-27.4, 1.0, 0.9, 'charrette'); }
  for (const [x, z] of [[-36.5, 2], [-37.5, 3.2], [-29, -1.5]]) { deco((P) => P.wood.push(C(0.55, 0.55, 0.9, 0, 0, 0, '#d8b860', 10)), x, z); addCircle(x, z, 0.6, 'foin'); }
  // pont de bois en arc (planches, garde-corps)
  { const P = { wood: [] }; const n = 18; for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(BRIDGE.x0 - 0.3, BRIDGE.x1 + 0.3, t), y = walkH(clamp(x, BRIDGE.x0 + 0.01, BRIDGE.x1 - 0.01), BRIDGE.z) - 0.06; P.wood.push(B(0.5, 0.1, 3.0, x, y, BRIDGE.z, ['#8a6440', '#7a5634', '#9a7048'][i % 3], 0, 0, 0, 0.8)); if (i % 3 === 0) for (const s of [-1, 1]) P.wood.push(B(0.12, 1.0, 0.12, x, y + 0.5, BRIDGE.z + s * 1.45, DARKW)); }
    for (const s of [-1, 1]) for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, x0 = lerp(BRIDGE.x0, BRIDGE.x1, t0), x1 = lerp(BRIDGE.x0, BRIDGE.x1, t1), y0 = walkH(clamp(x0, BRIDGE.x0 + 0.01, BRIDGE.x1 - 0.01), BRIDGE.z), y1 = walkH(clamp(x1, BRIDGE.x0 + 0.01, BRIDGE.x1 - 0.01), BRIDGE.z); P.wood.push(B(x1 - x0 + 0.02, 0.08, 0.08, (x0 + x1) / 2, (y0 + y1) / 2 + 0.92, BRIDGE.z + s * 1.45, LIGHTW, 0, 0, Math.atan2(y1 - y0, x1 - x0))); }
    for (const x of [BRIDGE.x0 + 1.2, BRIDGE.x1 - 1.2]) for (const s of [-1, 1]) P.wood.push(B(0.25, 3.5, 0.25, x, WATER_Y, BRIDGE.z + s * 1.2, DARKW));
    const m = new THREE.Mesh(mergeGeos(P.wood), VM.wood); m.castShadow = m.receiveShadow = true; scene.add(m);
    for (const s of [-1, 1]) addSeg(BRIDGE.x0 - 0.2, BRIDGE.z + s * 1.55, BRIDGE.x1 + 0.2, BRIDGE.z + s * 1.55, 'garde-corps', 0.08); }
  poi('pont', null, 24.4, -1.9, Math.PI / 2);
  // ---------------- la cascade : pierres du gué et crevasse secrète ----------------
  { const P = { stone: [] }; const stones = [];
    for (let i = 0; i <= 9; i++) { const a = (100 + i * 17) * Math.PI / 180; const x = POND.x + Math.cos(a) * 3.25, z = POND.z + Math.sin(a) * 3.25; stones.push([x, z]); }
    stones.forEach(([x, z], i) => { const g = new THREE.CylinderGeometry(0.52, 0.62, 0.5, 7); const p = g.attributes.position; for (let k = 0; k < p.count; k++) p.setY(k, p.getY(k) + (vnoise(p.getX(k) * 3 + i, p.getZ(k) * 3) - 0.5) * 0.12); g.computeVertexNormals(); g.rotateY(i);
      g.translate(x, WATER_Y + 0.12, z); P.stone.push(shade(g, '#9a9488', 0.6)); WATER_OK.push({ x, z, r: 0.8 }); });
    const m = new THREE.Mesh(mergeGeos(P.stone), VM.stone); m.castShadow = m.receiveShadow = true; scene.add(m);
    // bande franchissable continue le long du gué (les pierres sont assez proches pour sauter de l'une à l'autre)
    WATER_OK.length = 0; const ford = []; for (let a = 100; a <= 253; a += 4) { const r = a * Math.PI / 180; ford.push([POND.x + Math.cos(r) * 3.25, POND.z + Math.sin(r) * 3.25]); } for (let a = 80; a <= 108; a += 4) for (const rr of [3.5, 3.9]) { const r = a * Math.PI / 180; ford.push([POND.x + Math.cos(r) * rr, POND.z + Math.sin(r) * rr]); } ford.forEach(([x, z]) => WATER_OK.push({ x, z, r: 0.75 }));
    const sy = WATER_Y + 0.37; WALK_HOOKS.push((x, z) => { for (const [sx, sz] of ford) if (Math.hypot(sx - x, sz - z) < 0.75) return sy; if (inCave(x, z)) return CAVE.y; return null; });
    // la voûte de la crevasse (masquée quand on est dedans)
    const roof = []; for (let i = 0; i < 9; i++) { const g = new THREE.IcosahedronGeometry(1.6 + rnd() * 0.8, 1); const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const s = 1 + (vnoise(p.getX(k) * 2 + i, p.getY(k) * 2) - 0.5) * 0.4; p.setXYZ(k, p.getX(k) * s, p.getY(k) * s * 0.6, p.getZ(k) * s); } g.computeVertexNormals(); g.translate(lerp(CAVE.x0, CAVE.x1, (i % 3) / 2), 3.6 + rnd() * 0.6, lerp(CAVE.z0 + 1, CAVE.z1 - 0.2, Math.floor(i / 3) / 2)); roof.push(shade(g, '#7a766c', 0.55)); }
    const rm = new THREE.Mesh(mergeGeos(roof), VM.stone); rm.castShadow = true; scene.add(rm); const rs = new THREE.Mesh(rm.geometry, VM.shadowOnly); shadowOnly(rs); scene.add(rs);
    // intérieur : gravures lumineuses, cristal, coffre ancien
    const inner = { wood: [], stone: [], glow: [] }; F.chest(inner, 0, 0, 0.2, '#4a4a52'); propMesh(inner, -12.2, -39.2, 0.2, CAVE.y);
    const runes = []; for (let i = 0; i < 7; i++) { const g = new THREE.PlaneGeometry(0.22, 0.32); g.translate(-14.95, CAVE.y + 1.0 + (i % 2) * 0.5, -38.6 + i * 0.55); g.rotateY(0); runes.push(g); }
    const rg = mergeGeos(runes); rg.rotateY(0); const runeM = new THREE.Mesh(new THREE.BufferGeometry(), VM.rune); { const pts = []; for (let i = 0; i < 7; i++) { const z = -38.6 + i * 0.55, y = CAVE.y + 1.0 + (i % 2) * 0.5; const q = new THREE.PlaneGeometry(0.22, 0.32).rotateY(Math.PI / 2).translate(-14.75, y, z); pts.push(q); } runeM.geometry = mergeGeos(pts); } scene.add(runeM);
    const cry = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0).scale(0.6, 1.4, 0.6), new THREE.MeshLambertMaterial({ color: '#7fd8ff', emissive: '#2a8cc8', emissiveIntensity: 1.2 })); cry.position.set(-11.4, CAVE.y + 0.55, -37.2); scene.add(cry); addCircle(-11.4, -37.2, 0.4, 'cristal');
    const cl = new THREE.PointLight('#7fd8ff', 10, 8, 1.5); cl.position.set(-12.5, CAVE.y + 1.6, -37.5); scene.add(cl);
    V.cave = { roof: rm, light: cl, crystal: cry, runes: runeM };
    addCircle(-12.2, -39.2, 0.55, 'coffre'); interact('grotte_coffre', -12.2, -38.5, 1.1, 'Ouvrir le coffre ancien'); interact('grotte_runes', -14.2, -37.4, 1.3, 'Déchiffrer les gravures');
    // parois latérales de la crevasse
    addSeg(CAVE.x0 + 0.1, CAVE.z1, CAVE.x0 + 0.1, CAVE.z0, 'paroi', 0.15); addSeg(CAVE.x1 - 0.1, CAVE.z1, CAVE.x1 - 0.1, CAVE.z0, 'paroi', 0.15); addSeg(CAVE.x0, CAVE.z0 + 0.1, CAVE.x1, CAVE.z0 + 0.1, 'paroi', 0.15);
  }
  // statue de la grenouille (secret de l'aube)
  { const P = { stone: [] }; P.stone.push(B(0.8, 0.5, 0.8, 0, 0.25, 0, '#ffffff'), shade(new THREE.SphereGeometry(0.42, 10, 8).scale(1.1, 0.7, 1).translate(0, 0.78, 0), '#8a9a80', 0.6), shade(new THREE.SphereGeometry(0.28, 10, 8).scale(1.2, 0.8, 1).translate(0, 1.08, 0.2), '#8a9a80', 0.6));
    for (const s of [-1, 1]) P.stone.push(shade(new THREE.SphereGeometry(0.09, 6, 5).translate(s * 0.16, 1.25, 0.3), '#7a8a70', 0.7), shade(new THREE.SphereGeometry(0.12, 6, 5).scale(1, 0.6, 1.4).translate(s * 0.3, 0.55, 0.3), '#7a8a70', 0.7));
    const ms = propMesh(P, -9.6, -26.3, facing(-9.6, -26.3, -6, -20)); addCircle(-9.6, -26.3, 0.6, 'statue');
    const eyes = new THREE.Mesh(mergeGeos([new THREE.SphereGeometry(0.05, 6, 4).translate(-0.16, 1.27, 0.37), new THREE.SphereGeometry(0.05, 6, 4).translate(0.16, 1.27, 0.37)]), new THREE.MeshBasicMaterial({ color: '#3a4a38' }));
    eyes.position.copy(ms[0].position); eyes.rotation.y = ms[0].rotation.y; scene.add(eyes); V.statue = { eyes }; interact('grenouille', -9.6, -26.3, 1.6, 'Examiner la statue de grenouille'); }
  // souche creuse (cachette du renard blanc)
  { const P = { wood: [C(0.55, 0.7, 0.8, 0, 0, 0, '#5a3e26', 10), C(0.42, 0.42, 0.04, 0, 0.8, 0, '#2a1a10', 10)], stone: [], glow: [] }; propMesh(P, 41.5, 15, 0); addCircle(41.5, 15, 0.7, 'souche'); interact('souche_renard', 41.5, 15, 1.6, 'Fouiller la souche creuse', { need: 'renard' }); poi('renard_fin', null, 41.5, 13.7, 0); }
  // ---------------- évolution : décor de fête (masqué tant que la fête n'a pas lieu) ----------------
  { const fg = new THREE.Group(); const P = { wood: [], glow: [] }; const posts = [[6.6, 2.2], [2.2, -7.0], [-6.4, -1.4], [-2.4, 7.0]]; const cols = ['#d04a4a', '#e8c040', '#4a7ad0', '#4ab070', '#ffffff'];
    for (let i = 0; i < 4; i++) { const [ax, az] = posts[i], [bx, bz] = posts[(i + 1) % 4]; for (let k = 1; k < 12; k++) { const t = k / 12, x = lerp(ax, bx, t), z = lerp(az, bz, t), y = heightAt(x, z) + 2.5 - Math.sin(t * Math.PI) * 0.6; const tg = new THREE.ConeGeometry(0.14, 0.3, 3).rotateX(Math.PI).translate(x, y - 0.15, z); P.wood.push(shade(tg, cols[k % 5], 0.9)); if (k % 3 === 0) P.glow.push(new THREE.SphereGeometry(0.09, 6, 5).translate(x, y - 0.32, z)); }
      const L = []; for (let k = 0; k <= 12; k++) { const t = k / 12, x = lerp(ax, bx, t), z = lerp(az, bz, t); L.push(new THREE.Vector3(x, heightAt(x, z) + 2.5 - Math.sin(t * Math.PI) * 0.6, z)); } fg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(L), new THREE.LineBasicMaterial({ color: '#4a3a2a' }))); }
    const tbl = []; F.table({ wood: tbl }, 0, 0, 0, 1.6); F.table({ wood: tbl }, 1.6, 0, 0, 1.6); for (let i = 0; i < 6; i++) F.plate({ wood: tbl }, -0.8 + i * 0.5, 0.79, 0, ['#c86a3a', '#e8b030', '#8a4a2a'][i % 3]); const tm = new THREE.Mesh(mergeGeos(tbl), VM.wood); tm.position.set(-1.5, heightAt(-1, 4.6), 4.6); tm.rotation.y = 0.15; tm.castShadow = true; fg.add(tm);
    fg.add(new THREE.Mesh(mergeGeos(P.wood), VM.wood), new THREE.Mesh(mergeGeos(P.glow), new THREE.MeshBasicMaterial({ color: '#ffe08a' }))); fg.visible = false; scene.add(fg); V.festival = fg; }
  // ---------------- évolution : la maison abandonnée réparée (toit neuf, fenêtres ouvertes) et échafaudage ----------------
  { const b = ab; const rf = gable(b.w, b.d, b.h, b.pitch || 0.68, 0.5, VM.tile, { timber: true }); const g = new THREE.Group(); g.add(rf.roof, rf.trimMesh, rf.gables); if (rf.gTimber) g.add(rf.gTimber); g.visible = false; b.group.add(g); b.repairedRoof = g;
    const sc = []; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) sc.push(B(0.1, 3.2, 0.1, s * (b.w / 2 + 0.5), 1.6, -1.5 + i * 1.5, '#9a7a56')); for (let y = 1; y <= 2; y++) for (const s of [-1, 1]) sc.push(B(0.12, 0.08, 3.4, s * (b.w / 2 + 0.5), y * 1.1, 0, '#8a6a46'), B(0.6, 0.06, 3.2, s * (b.w / 2 + 0.3), y * 1.1 + 0.05, 0, '#b08a5a'));
    const scm = new THREE.Mesh(mergeGeos(sc), VM.wood); scm.visible = false; scm.castShadow = true; b.group.add(scm); b.scaffold = scm; }
  // ---------------- zones réservées (pour la végétation) ----------------
  const zones = [];
  for (const b of V.buildings) zones.push({ b, m: 1.6 });
  const rects = [V.pen, V.coop, { x0: -22.2, x1: -17.4, z0: -11.4, z1: -7.6 }, { x0: 20, x1: 27.5, z0: -14.5, z1: -5.5 }];
  V.reserved = (x, z, grass) => {
    if (Math.hypot(x, z) < (grass ? 7.8 : 9.5)) return true; // place
    for (const { b, m } of zones) { const [lx, lz] = W2L(b, x, z); const mm = grass ? 0.25 : m; if (Math.abs(lx) < b.w / 2 + mm && Math.abs(lz) < b.d / 2 + mm + (grass ? 0 : 1)) return true; }
    for (const r of rects) if (x > r.x0 - (grass ? -0.2 : 1) && x < r.x1 + (grass ? -0.2 : 1) && z > r.z0 - (grass ? -0.2 : 1) && z < r.z1 + (grass ? -0.2 : 1)) return !grass || (r === rects[2]);
    if (!grass && Math.hypot(x - V.oak.x, z - V.oak.z) < 5) return true;
    if (Math.hypot(x - 5.2, z + 3.8) < 2 || Math.hypot(x + 5.4, z + 3.2) < 2) return true;
    if (inCave(x, z)) return true; if (Math.hypot(x + 9.6, z + 26.3) < 1.5 || Math.hypot(x - 41.5, z - 15) < 2.6) return true;
    if (!grass && Math.hypot(x + 4.2, z + 11.5) < 2) return true; if (!grass && Math.hypot(x + 26.5, z - 1.5) < 2.5) return true;
    return false;
  };
  return V;
}

// fenêtres : un côté et une liste d'indices de travées par bâtiment
export const WIN = { auberge: { f: [0, 1, 4, 5], l: [1], r: [1, 2], b: [1, 3] }, echoppe: { f: [0, 3], l: [1], r: [1] }, edran: { f: [0, 3], l: [1], r: [1], b: [2] }, liora: { f: [0, 3], l: [1], r: [1, 2] }, abandon: { f: [0, 2], l: [1], r: [1] }, famA: { f: [0, 2], l: [1], r: [1], b: [1] }, famB: { f: [0, 2], l: [1], r: [1] }, ferme: { f: [0, 3], l: [1], r: [1] } };
