// =====================================================================
//  VÉLORNE v4 · NATURE : arbres à couronnes peintes, sous-bois, fougères, fleurs, herbes, rochers moussus, bois mort
// =====================================================================
import { THREE, rnd, lerp, clamp, sstep, vnoise, fbm, scene, patch, canvasTex, heightAt, roadDist, riverD, POND, inFields, VILLAGE_R, addCircle, MOBILE, shadowOnly } from './core.js';

// ---------------- textures peintes ----------------
function leafClump(x, S, pal, o = {}) {
  const rr = o.r || 0.44;
  for (let pass = 0; pass < 4; pass++) {
    const n = [90, 80, 60, 30][pass];
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.283, r = Math.sqrt(rnd()) * S * rr; const px = S / 2 + Math.cos(a) * r, py = S / 2 + Math.sin(a) * r * 0.92;
      const shade = clamp(0.15 + (S - py) / S * 0.75 + (pass - 1.5) * 0.14 + (rnd() - 0.5) * 0.22 - (r / (S * rr)) * 0.08, 0, 0.999);
      const col = pal[Math.floor(shade * pal.length)];
      const len = S * (o.len || 0.075) * (0.7 + rnd() * 0.6), wid = len * (o.wid || 0.5), rot = a + (rnd() - 0.5) * 1.8;
      x.save(); x.translate(px, py); x.rotate(rot);
      x.fillStyle = pal[0]; x.beginPath(); x.ellipse(0, 1.2, len * 0.56, wid * 0.66, 0, 0, 6.283); x.fill();
      x.fillStyle = col; x.beginPath(); x.moveTo(-len / 2, 0); x.quadraticCurveTo(0, -wid, len / 2, 0); x.quadraticCurveTo(0, wid, -len / 2, 0); x.fill();
      if (pass >= 2 && rnd() < 0.55) { x.strokeStyle = pal[pal.length - 1]; x.globalAlpha = 0.7; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-len * 0.32, -wid * 0.18); x.lineTo(len * 0.25, -wid * 0.3); x.stroke(); x.globalAlpha = 1; }
      x.restore();
    }
  }
  if (o.extra) o.extra(x, S);
}
const PAL_OAK = ['#1a3220', '#24452a', '#2f5a30', '#3e7034', '#52873c', '#6c9e46', '#8fb856', '#b8d374'];
const PAL_LIGHT = ['#22401f', '#30562a', '#3f6e33', '#55883d', '#71a248', '#93bb58', '#bcd674', '#dceb98'];
const PAL_BUSH = ['#18321e', '#22462a', '#2e5c34', '#3d743c', '#539048', '#73aa58', '#9cc66c'];
const PAL_AUTUMN = ['#3a2a14', '#5a3a18', '#7a4c1c', '#a0621e', '#c47e26', '#dca23a', '#f0c45a'];
const TEX = {
  oak: canvasTex(256, (x, S) => leafClump(x, S, PAL_OAK)),
  birch: canvasTex(256, (x, S) => leafClump(x, S, PAL_LIGHT, { len: 0.06 })),
  autumn: canvasTex(256, (x, S) => leafClump(x, S, PAL_AUTUMN)),
  bush: canvasTex(256, (x, S) => leafClump(x, S, PAL_BUSH, { extra: (x, S) => { for (let i = 0; i < 28; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * S * 0.36, px = S / 2 + Math.cos(a) * r, py = S / 2 + Math.sin(a) * r; x.fillStyle = '#4a0c16'; x.beginPath(); x.arc(px, py + 1, 4, 0, 6.3); x.fill(); x.fillStyle = i % 3 ? '#cc3042' : '#ef6070'; x.beginPath(); x.arc(px, py, 3.2, 0, 6.3); x.fill(); x.fillStyle = '#ffd0d4'; x.fillRect(px - 1.5, py - 1.5, 1.5, 1.5); } } })),
  bloom: canvasTex(256, (x, S) => leafClump(x, S, PAL_BUSH, { extra: (x, S) => { for (let i = 0; i < 40; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * S * 0.38, px = S / 2 + Math.cos(a) * r, py = S / 2 + Math.sin(a) * r; const c = ['#f4b8d8', '#ffffff', '#e898c0'][i % 3]; for (let k = 0; k < 5; k++) { x.fillStyle = c; x.beginPath(); x.ellipse(px + Math.cos(k * 1.256) * 3, py + Math.sin(k * 1.256) * 3, 2.6, 1.8, k * 1.256, 0, 6.3); x.fill(); } x.fillStyle = '#f8d040'; x.beginPath(); x.arc(px, py, 1.8, 0, 6.3); x.fill(); } } })),
  pine: canvasTex(128, (x, S) => { x.fillStyle = '#1d3a24'; x.fillRect(0, 0, S, S); const p = ['#14301c', '#1f4226', '#2c5632', '#3a6c3c', '#4f8448', '#6a9c58'];
    for (let i = 0; i < 1400; i++) { const px = rnd() * S, py = rnd() * S; x.strokeStyle = p[Math.floor(clamp(1 - py / S + (rnd() - 0.5) * 0.7, 0, 0.999) * p.length)]; x.lineWidth = 1.3; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 6, py + 4 + rnd() * 6); x.stroke(); } }),
  bark: canvasTex(128, (x, S) => { x.fillStyle = '#5a3e26'; x.fillRect(0, 0, S, S); for (let i = 0; i < 300; i++) { x.fillStyle = ['#3a2616', '#6e5034', '#4a3220', '#80624a', '#2e1e12'][i % 5]; const w = 1 + rnd() * 3; x.fillRect(rnd() * S, rnd() * S, w, 6 + rnd() * 20); } for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(80,120,50,.45)'; x.fillRect(rnd() * S, S * 0.7 + rnd() * S * 0.3, 3, 3); } }),
  birchBark: canvasTex(64, (x, S) => { x.fillStyle = '#e8e2d4'; x.fillRect(0, 0, S, S); for (let i = 0; i < 50; i++) { x.fillStyle = rnd() < 0.7 ? '#2a2620' : '#9a948a'; x.fillRect(rnd() * S, rnd() * S, 3 + rnd() * 8, 1 + rnd() * 2); } }),
  fern: canvasTex(128, (x, S) => { for (let f = 0; f < 3; f++) { const bx = S / 2 + (f - 1) * 18, col = ['#2e5a2c', '#3e7234', '#4f8a3e'][f]; x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.moveTo(bx, S); x.quadraticCurveTo(bx + (f - 1) * 10, S * 0.5, bx + (f - 1) * 22, 6); x.stroke();
      for (let i = 0; i < 22; i++) { const t = i / 22, cx = bx + (f - 1) * 22 * t * t, cy = S - t * (S - 6), l = (1 - t) * 16 + 3; x.fillStyle = i % 2 ? col : '#6aa04c'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * l * 0.5, cy, l * 0.55, 2.2, s * 0.5, 0, 6.3); x.fill(); } } } }),
  grass: canvasTex(64, (x, S) => { for (let i = 0; i < 22; i++) { const bx = 3 + rnd() * 58, hgt = 24 + rnd() * 40; const g = x.createLinearGradient(0, S, 0, S - hgt); g.addColorStop(0, '#2c5220'); g.addColorStop(0.5, '#5e9038'); g.addColorStop(1, ['#a8cc66', '#c2dc78', '#8ebc52', '#d8e890'][i % 4]); x.strokeStyle = g; x.lineWidth = 2.4; x.beginPath(); x.moveTo(bx, S); x.quadraticCurveTo(bx + (rnd() - 0.5) * 10, S - hgt / 2, bx + (rnd() - 0.5) * 18, S - hgt); x.stroke(); } }),
  flowers: canvasTex(64, (x, S) => { for (let i = 0; i < 9; i++) { const bx = 6 + rnd() * 52, hgt = 22 + rnd() * 30; x.strokeStyle = '#3e6a2c'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(bx, S); x.lineTo(bx + (rnd() - 0.5) * 6, S - hgt); x.stroke(); const c = ['#f6c84a', '#ffffff', '#e05a7a', '#9a7af0', '#f08a40'][i % 5]; for (let k = 0; k < 5; k++) { x.fillStyle = c; x.beginPath(); x.arc(bx + Math.cos(k * 1.26) * 3, S - hgt + Math.sin(k * 1.26) * 3, 2.4, 0, 6.3); x.fill(); } x.fillStyle = '#5a3a10'; x.beginPath(); x.arc(bx, S - hgt, 1.6, 0, 6.3); x.fill(); } }),
  wheat: canvasTex(64, (x, S) => { for (let i = 0; i < 16; i++) { const bx = 3 + rnd() * 58, hgt = 40 + rnd() * 22; x.strokeStyle = '#a88a30'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(bx, S); x.lineTo(bx + (rnd() - 0.5) * 4, S - hgt); x.stroke(); x.fillStyle = ['#e8c45a', '#d4a840', '#f2d470'][i % 3]; x.beginPath(); x.ellipse(bx, S - hgt - 4, 2.4, 6, 0, 0, 6.3); x.fill(); } })
};
TEX.grass.magFilter = THREE.NearestFilter;

// ---------------- géométries ----------------
// couronne de cartes de feuilles : normales « sphériques » (ombrage doux comme une peinture), occlusion vers l'intérieur et le bas
function cardCanopy(blobs, cardsPer, size, tintLow, tintHigh) {
  const pos = [], nor = [], uv = [], col = [], idx = []; let v = 0; const cA = new THREE.Color(tintLow), cB = new THREE.Color(tintHigh);
  let cy = 0; blobs.forEach(b => cy += b[1]); cy /= blobs.length; const center = new THREE.Vector3(0, cy, 0);
  let ymin = 1e9, ymax = -1e9; blobs.forEach(b => { ymin = Math.min(ymin, b[1] - b[3]); ymax = Math.max(ymax, b[1] + b[3]); });
  const q = new THREE.Quaternion(), e = new THREE.Euler(), corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
  for (const [bx, by, bz, br] of blobs) for (let i = 0; i < cardsPer; i++) {
    const u = rnd() * 2 - 1, th = rnd() * 6.283, s = Math.sqrt(1 - u * u); const dir = new THREE.Vector3(s * Math.cos(th), u * 0.8 + 0.15, s * Math.sin(th)).normalize();
    const depth = 0.4 + rnd() * 0.55; const p = new THREE.Vector3(bx, by, bz).addScaledVector(dir, br * depth);
    e.set((rnd() - 0.5) * 2.6, rnd() * 6.28, (rnd() - 0.5) * 2.6); q.setFromEuler(e); const sz = size * (0.75 + rnd() * 0.55);
    const n = p.clone().sub(center).normalize().lerp(new THREE.Vector3(0, 1, 0), 0.3).normalize();
    const k = clamp((p.y - ymin) / (ymax - ymin), 0, 1) * 0.75 + depth * 0.25; const c = cA.clone().lerp(cB, k * 0.85 + rnd() * 0.15);
    for (const [cx, cz] of corners) { const w = new THREE.Vector3(cx * sz, cz * sz, 0).applyQuaternion(q).add(p); pos.push(w.x, w.y, w.z); nor.push(n.x, n.y, n.z); col.push(c.r, c.g, c.b); }
    uv.push(0, 0, 1, 0, 1, 1, 0, 1); idx.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g;
}
function mergeGeos(geos) { // fusion (position, normale, uv, couleur optionnelle)
  const pos = [], nor = [], uv = [], col = []; let hasC = geos.some(g => g.attributes.color);
  for (let g of geos) { g = g.index ? g.toNonIndexed() : g; pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); uv.push(...(g.attributes.uv ? g.attributes.uv.array : new Float32Array(g.attributes.position.count * 2)));
    if (hasC) { if (g.attributes.color) col.push(...g.attributes.color.array); else for (let i = 0; i < g.attributes.position.count; i++) col.push(1, 1, 1); } }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (hasC) m.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return m;
}
export { mergeGeos };
function shade(g, hex, lowK = 0.55) { // couleur par sommet avec occlusion vers le bas
  g = g.index ? g.toNonIndexed() : g; g.computeBoundingBox(); const bb = g.boundingBox, c = new THREE.Color(hex), p = g.attributes.position, a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const k = lerp(lowK, 1, clamp((p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y + 1e-6), 0, 1)); a[i * 3] = c.r * k; a[i * 3 + 1] = c.g * k; a[i * 3 + 2] = c.b * k; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
export { shade };
function trunk(h, r0, r1, branches, bend) {
  const parts = []; const segs = 5; let x = 0, z = 0, y = 0;
  const g = new THREE.CylinderGeometry(r1, r0, h, 9, segs, false); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + h / 2) / h; const off = Math.sin(t * 3 + bend) * 0.18 * t; p.setX(i, p.getX(i) * (1 + (vnoise(p.getY(i) * 2, i) - 0.5) * 0.15) + off); p.setZ(i, p.getZ(i) + Math.cos(t * 2 + bend) * 0.12 * t); }
  g.translate(0, h / 2, 0); g.computeVertexNormals(); parts.push(g);
  for (let i = 0; i < branches; i++) { const a = i / branches * 6.28 + rnd() * 0.8, L = 1.3 + rnd() * 0.9; const b = new THREE.CylinderGeometry(r1 * 0.32, r1 * 0.62, L, 6).translate(0, L / 2, 0); b.rotateZ(0.75 + rnd() * 0.35); b.rotateY(a); b.translate(0, h * (0.6 + rnd() * 0.3), 0); parts.push(b); }
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28 + 0.3; const rt = new THREE.CylinderGeometry(0.05, r0 * 0.55, 1.1, 5).translate(0, 0.55, 0); rt.rotateZ(1.2 + rnd() * 0.2); rt.rotateY(a); rt.translate(0, 0.18, 0); parts.push(rt); }
  return mergeGeos(parts);
}
function blobsOak(sc = 1) { const b = [[0, 5.1, 0, 2.2]]; const n = 7; for (let i = 0; i < n; i++) { const a = i / n * 6.28 + rnd() * 0.5; b.push([Math.cos(a) * 1.9, 4.3 + rnd() * 1.6, Math.sin(a) * 1.9, 1.35 + rnd() * 0.45]); } b.push([0.3, 6.6, -0.2, 1.5]); b.push([-0.6, 6.1, 0.7, 1.2]); return b.map(([x, y, z, r]) => [x * sc, y * sc, z * sc, r * sc]); }

// ---------------- matériaux ----------------
const M = {};
const SHADOW_ONLY = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
const shadowBlobs = (B, k = 0.86) => mergeGeos(B.map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r * k, 0).translate(x, y, z)));
function leafMat(tex) { return patch(new THREE.MeshLambertMaterial({ map: tex, vertexColors: true, alphaTest: 0.42, side: THREE.DoubleSide }), { soft: true, wind: 0.045, windBase: 2.6, cut: true, trans: 0.55 }); }
M.oak = leafMat(TEX.oak); M.birch = leafMat(TEX.birch); M.autumn = leafMat(TEX.autumn);
M.bush = patch(new THREE.MeshLambertMaterial({ map: TEX.bush, vertexColors: true, alphaTest: 0.42, side: THREE.DoubleSide }), { soft: true, wind: 0.04, windBase: 0.2, cut: true, trans: 0.35 });
M.bloom = patch(new THREE.MeshLambertMaterial({ map: TEX.bloom, vertexColors: true, alphaTest: 0.42, side: THREE.DoubleSide }), { soft: true, wind: 0.04, windBase: 0.2, cut: true, trans: 0.35 });
M.core = patch(new THREE.MeshLambertMaterial({ vertexColors: true }), { cut: true, wind: 0.045, windBase: 2.6 });
M.bark = patch(new THREE.MeshLambertMaterial({ map: TEX.bark, vertexColors: true }), { cut: true });
M.birchBark = patch(new THREE.MeshLambertMaterial({ map: TEX.birchBark, vertexColors: true }), { cut: true });
M.pine = patch(new THREE.MeshLambertMaterial({ map: TEX.pine, vertexColors: true }), { cut: true, wind: 0.02, windBase: 2 });
M.rock = patch(new THREE.MeshLambertMaterial({ vertexColors: true }), { cut: true });
M.ground = (tex, wind) => patch(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, vertexColors: false }), { soft: true, wind, windBase: 0 });
function depthOf(tex, wind, base) { const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.42 }); if (wind) patch(m, { wind, windBase: base }); return m; }
export { M as NATURE_MAT };

// ---------------- instanciation ----------------
const dummy = new THREE.Object3D();
function place(parts, list, opts = {}) {
  // instanciation par blocs de terrain : chaque bloc a sa propre sphère englobante, donc la caméra et l'ombre ne dessinent que ce qui est visible
  const CH = opts.chunk || 28, groups = new Map(), meshes = [];
  for (const it of list) { const k = Math.floor(it.x / CH) + ',' + Math.floor(it.z / CH); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); }
  const tint = new THREE.Color();
  for (const [k, L] of groups) for (const p of parts) {
    const m = new THREE.InstancedMesh(p.geo, p.mat, L.length); m.castShadow = p.cast !== false; m.receiveShadow = true; if (p.depth) m.customDepthMaterial = p.depth; if (p.mat === SHADOW_ONLY) shadowOnly(m);
    L.forEach((it, i) => { if (it.rot == null) it.rot = rnd() * 6.28; dummy.position.set(it.x, heightAt(it.x, it.z) - (it.sink ?? 0.1), it.z); dummy.rotation.set(it.tx || 0, it.rot, it.tz || 0); dummy.scale.set(it.s, it.s * (it.sy || 1), it.s); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
      if (opts.tint) { if (it.tc == null) it.tc = [(rnd() - 0.5) * opts.tint, (rnd() - 0.5) * 0.1, (rnd() - 0.5) * 0.08]; tint.setHSL(0, 0, 1); tint.offsetHSL(...it.tc); m.setColorAt(i, tint); } });
    m.computeBoundingSphere(); m.userData.cx = (Number(k.split(',')[0]) + 0.5) * CH; m.userData.cz = (Number(k.split(',')[1]) + 0.5) * CH; if (opts.far) m.userData.far = opts.far;
    scene.add(m); meshes.push(m); if (opts.far) NATURE.lod.push(m);
  }
  return meshes;
}
// les petits éléments (herbes, fleurs, fougères) ne sont dessinés que près de la caméra
export function updateLod(cx, cz) { for (const m of NATURE.lod) m.visible = Math.hypot(m.userData.cx - cx, m.userData.cz - cz) < m.userData.far; }

// ---------------- génération ----------------
export const NATURE = { trees: [], grassMeshes: [], lod: [] };
export function singleTree(x, z, s, rot) { const parts = NATURE.oakParts(); place(parts, [{ x, z, s, rot }]); addCircle(x, z, 0.6 * s, 'arbre'); }
export function buildNature(reserved) {
  // reserved(x, z) → true si la case est réservée (bâtiments, cours, places, enclos)
  const free = (x, z, clear) => roadDist(x, z) > clear && riverD(x, z) > 4.6 && Math.hypot(x - POND.x, z - POND.z) > POND.r + 2.5 && !inFields(x, z) && !reserved(x, z) && Math.hypot(x, z) < 74;
  const near = [], oaks = [], birches = [], autumns = [], pines = [], bushes = [], blooms = [], ferns = [], rocks = [], stumps = [], logs = [], shrooms = [];
  const ok = (x, z, d) => !near.some(t => Math.abs(t.x - x) < d && Math.hypot(t.x - x, t.z - z) < d);
  // arbres : densité selon le bruit, clairières, lisière du village
  for (let i = 0; i < 9000 && near.length < (MOBILE ? 230 : 300); i++) {
    const x = (rnd() - 0.5) * 148, z = (rnd() - 0.5) * 148; if (!free(x, z, 4.2)) continue;
    const r = Math.hypot(x, z); let dens = sstep(VILLAGE_R - 2, VILLAGE_R + 10, r) * (0.45 + fbm(x * 0.04, z * 0.04, 2) * 0.9);
    if (r < VILLAGE_R - 2) dens = 0.035; // quelques arbres isolés dans le village (vergers, place)
    if (rnd() > dens) continue; const s = 0.8 + rnd() * 0.55; if (!ok(x, z, 3.4 * s)) continue;
    const t = { x, z, s }; near.push(t);
    const k = rnd(); if (z < -28 || (r > 50 && k < 0.45)) pines.push(t); else if (k < 0.12 && r > 30) autumns.push(t); else if (k < 0.3) birches.push(t); else oaks.push(t);
    addCircle(x, z, 0.45 * s, 'arbre');
  }
  // sous-bois : buissons, fougères, rochers, souches, troncs, champignons
  for (let i = 0; i < 6000 && bushes.length + blooms.length < (MOBILE ? 170 : 240); i++) { const x = (rnd() - 0.5) * 140, z = (rnd() - 0.5) * 140; if (!free(x, z, 2.2)) continue; const r = Math.hypot(x, z); if (r < VILLAGE_R - 6 && rnd() < 0.85) continue; (rnd() < 0.25 ? blooms : bushes).push({ x, z, s: 0.7 + rnd() * 0.75 }); }
  for (let i = 0; i < 7000 && ferns.length < (MOBILE ? 260 : 420); i++) { const x = (rnd() - 0.5) * 140, z = (rnd() - 0.5) * 140; if (!free(x, z, 1.6) || Math.hypot(x, z) < VILLAGE_R + 2) continue; if (fbm(x * 0.08, z * 0.08, 2) < 0.45) continue; ferns.push({ x, z, s: 0.7 + rnd() * 0.7 }); }
  for (let i = 0; i < 3000 && rocks.length < 70; i++) { const x = (rnd() - 0.5) * 140, z = (rnd() - 0.5) * 140; if (!free(x, z, 2.5)) continue; if (Math.hypot(x, z) < VILLAGE_R - 4 && rnd() < 0.9) continue; const s = 0.35 + rnd() * rnd() * 1.6; if (!ok(x, z, 1.6 + s)) continue; rocks.push({ x, z, s, sink: 0.25 * s }); if (s > 0.6) addCircle(x, z, 0.8 * s, 'rocher'); }
  for (let i = 0; i < 2000 && stumps.length < 24; i++) { const x = (rnd() - 0.5) * 130, z = (rnd() - 0.5) * 130; if (!free(x, z, 2.5) || Math.hypot(x, z) < VILLAGE_R) continue; stumps.push({ x, z, s: 0.8 + rnd() * 0.5 }); addCircle(x, z, 0.4, 'souche'); }
  for (let i = 0; i < 2000 && logs.length < 14; i++) { const x = (rnd() - 0.5) * 130, z = (rnd() - 0.5) * 130; if (!free(x, z, 3.5) || Math.hypot(x, z) < VILLAGE_R + 3) continue; const rot = rnd() * 6.28; logs.push({ x, z, s: 1, rot, sink: 0.1 }); for (let k = -1; k <= 1; k++) addCircle(x + Math.cos(rot) * k * 1.3, z - Math.sin(rot) * k * 1.3, 0.38, 'tronc'); }
  for (let i = 0; i < 3000 && shrooms.length < 120; i++) { const x = (rnd() - 0.5) * 130, z = (rnd() - 0.5) * 130; if (!free(x, z, 1.5) || Math.hypot(x, z) < VILLAGE_R + 2) continue; shrooms.push({ x, z, s: 0.6 + rnd() * 0.8 }); }
  // chêne
  { const B = blobsOak(); NATURE.oakParts = () => [
      { geo: shade(trunk(4.6, 0.7, 0.36, 5, 0.9), '#ffffff', 0.5), mat: M.bark },
      { geo: shade(mergeGeos(blobsOak(1.25).map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r * 0.66, 1).translate(x, y, z))), '#1d3a20', 0.45), mat: M.core, cast: false },
      { geo: cardCanopy(blobsOak(1.25), 44, 2.1, '#486a3c', '#ffffff'), mat: M.oak, cast: false }, { geo: shadowBlobs(blobsOak(1.25)), mat: SHADOW_ONLY }];
    place([
      { geo: shade(trunk(4.2, 0.55, 0.3, 4, 0.5), '#ffffff', 0.5), mat: M.bark },
      { geo: shade(mergeGeos(B.map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r * 0.66, 1).translate(x, y, z))), '#1d3a20', 0.45), mat: M.core, cast: false },
      { geo: cardCanopy(B, 32, 1.9, '#486a3c', '#ffffff'), mat: M.oak, cast: false }, { geo: shadowBlobs(B), mat: SHADOW_ONLY }], oaks, { tint: 0.04 }); }
  { const B = blobsOak(0.9); place([
      { geo: shade(trunk(3.8, 0.5, 0.28, 3, 1.4), '#ffffff', 0.5), mat: M.bark },
      { geo: shade(mergeGeos(B.map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r * 0.66, 1).translate(x, y, z))), '#4a2e14', 0.45), mat: M.core, cast: false },
      { geo: cardCanopy(B, 30, 1.8, '#7a5a3a', '#ffffff'), mat: M.autumn, cast: false }, { geo: shadowBlobs(B), mat: SHADOW_ONLY }], autumns, { tint: 0.03 }); }
  // bouleau
  { const B = [[0, 4.6, 0, 1.5], [0.7, 5.7, 0.2, 1.15], [-0.6, 4.0, -0.4, 1.05], [0.2, 6.6, -0.2, 0.9], [-0.7, 5.3, 0.6, 1.0], [0.6, 4.2, -0.7, 0.9]]; place([
      { geo: shade(trunk(5, 0.26, 0.13, 3, 2.1), '#ffffff', 0.6), mat: M.birchBark },
      { geo: shade(mergeGeos(B.map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r * 0.6, 1).translate(x, y, z))), '#2a4a26', 0.5), mat: M.core, cast: false },
      { geo: cardCanopy(B, 26, 1.45, '#5a7a48', '#ffffff'), mat: M.birch, cast: false }, { geo: shadowBlobs(B), mat: SHADOW_ONLY }], birches, { tint: 0.05 }); }
  // conifère : étages dentelés
  { const parts = []; for (let i = 0; i < 6; i++) { const g = new THREE.ConeGeometry(2.1 - i * 0.32, 1.7, 12, 2, true); const p = g.attributes.position;
      for (let j = 0; j < p.count; j++) if (p.getY(j) < 0) { const a = Math.atan2(p.getZ(j), p.getX(j)); const k = 1 + Math.sin(a * 6 + i) * 0.1 + (vnoise(a * 3, i) - 0.5) * 0.15; p.setX(j, p.getX(j) * k); p.setZ(j, p.getZ(j) * k); p.setY(j, p.getY(j) - 0.25 - Math.abs(Math.sin(a * 6 + i)) * 0.25); }
      g.computeVertexNormals(); g.translate(0, 2.0 + i * 0.95, 0); parts.push(g); }
    const pg = shade(mergeGeos(parts), '#ffffff', 0.45);
    place([{ geo: shade(trunk(2.6, 0.34, 0.18, 0, 0), '#ffffff', 0.5), mat: M.bark }, { geo: pg, mat: M.pine }], pines, { tint: 0.03 }); }
  // buissons
  const bushB = [[0, 0.6, 0, 0.75], [0.6, 0.5, 0.2, 0.6], [-0.55, 0.5, -0.1, 0.6], [0.1, 0.9, -0.35, 0.55], [-0.2, 0.55, 0.55, 0.5]];
  place([{ geo: shade(mergeGeos(bushB.map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r * 0.65, 1).translate(x, y, z))), '#1a361e', 0.5), mat: M.core, cast: false },
    { geo: cardCanopy(bushB, 22, 0.85, '#5a7a4a', '#ffffff'), mat: M.bush, cast: false }, { geo: shadowBlobs(bushB, 0.8), mat: SHADOW_ONLY }], bushes, { tint: 0.05 });
  place([{ geo: shade(mergeGeos(bushB.map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r * 0.65, 1).translate(x, y, z))), '#1a361e', 0.5), mat: M.core, cast: false },
    { geo: cardCanopy(bushB, 22, 0.85, '#5a7a4a', '#ffffff'), mat: M.bloom, cast: false }, { geo: shadowBlobs(bushB, 0.8), mat: SHADOW_ONLY }], blooms, { tint: 0.03 });
  // fougères : éventail de cartes
  { const parts = []; for (let i = 0; i < 6; i++) { const g = new THREE.PlaneGeometry(1.1, 1.0).translate(0, 0.5, 0); g.rotateX(-0.55); g.rotateY(i / 6 * 6.28); parts.push(g); }
    const fg = mergeGeos(parts); const n = fg.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
    place([{ geo: fg, mat: M.ground(TEX.fern, 0.12), cast: false }], ferns, { chunk: 16, far: 46 }); }
  // rochers organiques : bruit, mousse sur le dessus, arêtes adoucies
  { const variants = [0, 1, 2].map(v => { let g = new THREE.IcosahedronGeometry(1, 3); const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + (fbm(x * 1.4 + v * 7, z * 1.4 + y, 3) - 0.5) * 0.7 + (vnoise(x * 4 + v, y * 4) - 0.5) * 0.12; p.setXYZ(i, x * k * (1 + v * 0.15), y * k * 0.62, z * k); }
      g.computeVertexNormals(); if (g.index) g = g.toNonIndexed(); g.computeVertexNormals(); const nn = g.attributes.normal, P = g.attributes.position, col = [];
      for (let i = 0; i < P.count; i++) { const moss = sstep(0.45, 0.85, nn.getY(i)) * sstep(-0.1, 0.4, P.getY(i)); const b = 0.42 + vnoise(P.getX(i) * 3, P.getZ(i) * 3 + P.getY(i)) * 0.18 + P.getY(i) * 0.05;
        const c = new THREE.Color().setRGB(b * 0.96, b * 0.94, b * 0.9, THREE.SRGBColorSpace).lerp(new THREE.Color('#4f7a30'), moss * 0.9); col.push(c.r, c.g, c.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g; });
    const groups = [[], [], []]; rocks.forEach((r, i) => groups[i % 3].push(r)); groups.forEach((L, i) => L.length && place([{ geo: variants[i], mat: M.rock }], L)); }
  // souches et troncs couchés
  place([{ geo: shade(mergeGeos([new THREE.CylinderGeometry(0.42, 0.55, 0.6, 9).translate(0, 0.3, 0), new THREE.CylinderGeometry(0.4, 0.4, 0.02, 9).translate(0, 0.61, 0)]), '#ffffff', 0.55), mat: M.bark }], stumps);
  { const lg = shade(new THREE.CylinderGeometry(0.34, 0.4, 4.2, 9, 3).rotateZ(Math.PI / 2).translate(0, 0.35, 0), '#ffffff', 0.6); place([{ geo: lg, mat: M.bark }], logs); }
  // champignons (chapeaux rouges à pois et bruns)
  { const cap = new THREE.SphereGeometry(0.14, 8, 5, 0, 6.3, 0, 1.6).translate(0, 0.22, 0), stem = new THREE.CylinderGeometry(0.04, 0.05, 0.22, 6).translate(0, 0.11, 0);
    const g = mergeGeos([shade(cap, '#c8382c', 0.7), shade(stem, '#efe6d0', 0.8)]); place([{ geo: g, mat: new THREE.MeshLambertMaterial({ vertexColors: true }), cast: false }], shrooms); }
  // herbes et fleurs (cartes croisées), teintées selon le terrain, denses près du joueur
  { const cross = (w, h) => { const a = new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0), b = a.clone().rotateY(Math.PI / 2), c = a.clone().rotateY(Math.PI / 4); const m = mergeGeos([a, b, c]); const n = m.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0); return m; };
    const grassList = [], flowerList = [], wheatList = [];
    for (let i = 0; i < 60000 && grassList.length < (MOBILE ? 12000 : 22000); i++) { const x = (rnd() - 0.5) * 120, z = (rnd() - 0.5) * 120; if (roadDist(x, z) < 1.6 + vnoise(x, z) * 0.8 || riverD(x, z) < 3.4 || Math.hypot(x - POND.x, z - POND.z) < POND.r + 0.5 || inFields(x, z) || reserved(x, z, true)) continue;
      if (Math.abs(heightAt(x, z) - heightAt(x + 0.6, z)) > 0.45) continue; const cl = fbm(x * 0.07, z * 0.07, 2); if (cl < 0.33 && rnd() < 0.7) continue; grassList.push({ x, z, s: 0.55 + rnd() * 0.8 * (0.6 + cl), sink: 0.02 }); }
    for (let i = 0; i < 20000 && flowerList.length < (MOBILE ? 1200 : 2200); i++) { const x = (rnd() - 0.5) * 110, z = (rnd() - 0.5) * 110; if (roadDist(x, z) < 1.8 || riverD(x, z) < 3.6 || inFields(x, z) || reserved(x, z, true)) continue; if (vnoise(x * 0.25, z * 0.25) < 0.55) continue; flowerList.push({ x, z, s: 0.6 + rnd() * 0.5, sink: 0.02 }); }
    for (let x = -39.5; x < -24.5; x += 0.55) for (let z = 21.5; z < 29.5; z += 0.55) wheatList.push({ x: x + (rnd() - 0.5) * 0.3, z: z + (rnd() - 0.5) * 0.3, s: 0.9 + rnd() * 0.3, sink: 0.02 });
    const gm = place([{ geo: cross(0.62, 0.52), mat: M.ground(TEX.grass, 0.2), cast: false }], grassList, { tint: 0.06, chunk: 12, far: 40 });
    place([{ geo: cross(0.5, 0.45), mat: M.ground(TEX.flowers, 0.18), cast: false }], flowerList, { chunk: 12, far: 40 });
    place([{ geo: cross(0.6, 1.2), mat: M.ground(TEX.wheat, 0.18), cast: false }], wheatList, { chunk: 12, far: 45 });
    NATURE.grassMeshes.push(...gm); NATURE.grassList = grassList; }
  NATURE.trees = near; NATURE.counts = { oaks: oaks.length, birches: birches.length, autumns: autumns.length, pines: pines.length, bushes: bushes.length + blooms.length, ferns: ferns.length, rocks: rocks.length };
  return NATURE;
}

// ---------------- outils partagés avec le jeu 3D (js3d/kit3d.js) ----------------
export { cardCanopy, trunk, blobsOak, TEX as NATURE_TEX, SHADOW_ONLY, shadowBlobs, leafMat, PAL_OAK, PAL_LIGHT, PAL_BUSH, PAL_AUTUMN, leafClump };
