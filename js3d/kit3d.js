// =====================================================================
//  VÉLORNE 3D — KIT DE DÉCORS 3D
//  Un modèle 3D pour chaque type de décor du jeu (arbres, rochers, plantes, bâtiments, objets).
//  Tout type sans modèle garde son image du jeu (panneau ou décalque au sol) : rien ne disparaît.
// =====================================================================
import { THREE, patch, canvasTex } from '../assets/demo/v4/core.js';
import { mergeGeos, shade, NATURE_MAT, cardCanopy, trunk, blobsOak, NATURE_TEX, SHADOW_ONLY, shadowBlobs, leafMat, leafClump } from '../assets/demo/v4/nature.js';

let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const B = (w, h, d, x, y, z, col, ry = 0, rx = 0, rz = 0, low = 0.75) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateX(rx); g.rotateZ(rz); g.rotateY(ry); g.translate(x, y, z); return shade(g, col, low); };
const C = (r0, r1, h, x, y, z, col, seg = 10, low = 0.75) => shade(new THREE.CylinderGeometry(r1, r0, h, seg).translate(x, y + h / 2, z), col, low);
const Sph = (r, x, y, z, col, sy = 1, low = 0.75) => shade(new THREE.SphereGeometry(r, 9, 7).scale(1, sy, 1).translate(x, y, z), col, low);
function noisy(g, amt, sy = 1, sd = 1) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + (Math.sin(x * 4.1 + sd) * Math.sin(y * 3.3 + sd * 2) * Math.sin(z * 3.7 + sd * 3)) * amt; p.setXYZ(i, x * k, y * k * sy, z * k); } g.computeVertexNormals(); return g; }

// ---------------- matériaux ----------------
const cut = { cut: true, near: false };
const MAT = {
  wood: patch(new THREE.MeshLambertMaterial({ vertexColors: true }), cut),
  solid: new THREE.MeshLambertMaterial({ vertexColors: true }),
  bark: NATURE_MAT.bark, core: NATURE_MAT.core, pine: NATURE_MAT.pine, rock: NATURE_MAT.rock,
  oak: NATURE_MAT.oak, birch: NATURE_MAT.birch, autumn: NATURE_MAT.autumn, bush: NATURE_MAT.bush, bloom: NATURE_MAT.bloom,
  glow: new THREE.MeshBasicMaterial({ color: '#ffb84a' }),
  ice: new THREE.MeshLambertMaterial({ color: '#bfe8ff', emissive: '#3a7aa8', emissiveIntensity: 0.35, transparent: true, opacity: 0.85 }),
  crystal: new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#7a4ae0', emissiveIntensity: 0.55 }),
  crystalLeaf: new THREE.MeshLambertMaterial({ color: '#c8a8ff', emissive: '#6a3ad0', emissiveIntensity: 0.6, transparent: true, opacity: 0.9 }),
  obsidian: new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#ff5a1a', emissiveIntensity: 0.0 }),
  canvas: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  portal: new THREE.MeshBasicMaterial({ color: '#9a5aff', transparent: true, opacity: 0.75, side: THREE.DoubleSide })
};
// feuillages sombres et palmes peintes
const darkTex = canvasTex(256, (x, S) => leafClump(x, S, ['#0c1a12', '#122618', '#1a3420', '#24452a', '#30582f', '#3e6a36', '#527a3e']));
MAT.dark = leafMat(darkTex);
const mangroveTex = canvasTex(256, (x, S) => leafClump(x, S, ['#10200e', '#1a3014', '#26421a', '#345a22', '#46702a', '#5e8a34']));
MAT.mangrove = leafMat(mangroveTex);
const frondTex = canvasTex(128, (x, S) => { x.strokeStyle = '#3a5a1a'; x.lineWidth = 3; x.beginPath(); x.moveTo(4, S / 2); x.quadraticCurveTo(S / 2, S / 2 - 14, S - 4, S / 2 + 6); x.stroke();
  for (let i = 0; i < 26; i++) { const t = i / 26, px = 6 + t * (S - 14), py = S / 2 - 12 * Math.sin(t * 3) * (1 - t * 0.3); for (const s of [-1, 1]) { x.strokeStyle = ['#2e5a1c', '#4a7a26', '#6a9a34', '#8ab848'][(i + (s > 0 ? 1 : 0)) % 4]; x.lineWidth = 2.6; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 6, py + s * (26 - t * 16)); x.stroke(); } } });
MAT.frond = patch(new THREE.MeshLambertMaterial({ map: frondTex, alphaTest: 0.4, side: THREE.DoubleSide }), { cut: true, near: false, wind: 0.05, windBase: 3, soft: true });
const grassCardTex = NATURE_TEX.grass, fernTex = NATURE_TEX.fern, flowerTex = NATURE_TEX.flowers, wheatTex = NATURE_TEX.wheat;
MAT.grass = patch(new THREE.MeshLambertMaterial({ map: grassCardTex, alphaTest: 0.5, side: THREE.DoubleSide }), { soft: true, wind: 0.2, windBase: 0 });
MAT.fern = patch(new THREE.MeshLambertMaterial({ map: fernTex, alphaTest: 0.5, side: THREE.DoubleSide }), { soft: true, wind: 0.12, windBase: 0 });
MAT.flower = patch(new THREE.MeshLambertMaterial({ map: flowerTex, alphaTest: 0.5, side: THREE.DoubleSide }), { soft: true, wind: 0.18, windBase: 0 });
MAT.wheat = patch(new THREE.MeshLambertMaterial({ map: wheatTex, alphaTest: 0.5, side: THREE.DoubleSide }), { soft: true, wind: 0.18, windBase: 0 });
const reedTex = canvasTex(64, (x, S) => { for (let i = 0; i < 12; i++) { const bx = 4 + i * 5, h = 34 + (i * 7) % 24; x.strokeStyle = i % 2 ? '#5a7a34' : '#7a9a44'; x.lineWidth = 2; x.beginPath(); x.moveTo(bx, S); x.lineTo(bx + (i % 3 - 1) * 3, S - h); x.stroke(); if (i % 3 === 0) { x.fillStyle = '#6a4a2a'; x.fillRect(bx - 2 + (i % 3 - 1) * 3, S - h - 6, 4, 9); } } });
MAT.reed = patch(new THREE.MeshLambertMaterial({ map: reedTex, alphaTest: 0.5, side: THREE.DoubleSide }), { soft: true, wind: 0.15, windBase: 0 });
const cross = (w, h, n = 3) => { const parts = []; for (let i = 0; i < n; i++) parts.push(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0).rotateY(i * Math.PI / n)); const g = mergeGeos(parts); const nr = g.attributes.normal; for (let i = 0; i < nr.count; i++) nr.setXYZ(i, 0, 1, 0); return g; };
const depth = (tex) => new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.45 });

// ---------------- générateurs (repère : base au sol, hauteur en mètres) ----------------
const GEN = {
  oak: (v) => { const Bl = blobsOak(1); return [{ geo: shade(trunk(4.2, 0.55, 0.3, 4, v), '#ffffff', 0.5), mat: MAT.bark }, { geo: shade(mergeGeos(Bl.map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r * 0.66, 1).translate(x, y, z))), '#1d3a20', 0.45), mat: MAT.core, cast: false },
    { geo: cardCanopy(Bl, 30, 1.9, '#486a3c', '#ffffff'), mat: v % 3 === 2 ? MAT.birch : MAT.oak, cast: false }, { geo: shadowBlobs(Bl), mat: SHADOW_ONLY, shadowOnly: true }]; },
  dark: (v) => { const Bl = blobsOak(1.05); return [{ geo: shade(trunk(4.4, 0.6, 0.32, 4, v + 1), '#9a8a7a', 0.45), mat: MAT.bark }, { geo: shade(mergeGeos(Bl.map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r * 0.66, 1).translate(x, y, z))), '#0e1c12', 0.45), mat: MAT.core, cast: false },
    { geo: cardCanopy(Bl, 30, 1.9, '#3a4a3a', '#ffffff'), mat: MAT.dark, cast: false }, { geo: shadowBlobs(Bl), mat: SHADOW_ONLY, shadowOnly: true }]; },
  pine: (v, snow) => { const parts = []; for (let i = 0; i < 6; i++) { const g = new THREE.ConeGeometry(2.1 - i * 0.32, 1.7, 12, 2, true); const p = g.attributes.position; for (let j = 0; j < p.count; j++) if (p.getY(j) < 0) { const a = Math.atan2(p.getZ(j), p.getX(j)); const k = 1 + Math.sin(a * 6 + i + v) * 0.1; p.setX(j, p.getX(j) * k); p.setZ(j, p.getZ(j) * k); p.setY(j, p.getY(j) - 0.25 - Math.abs(Math.sin(a * 6 + i)) * 0.25); } g.computeVertexNormals(); g.translate(0, 2.0 + i * 0.95, 0); parts.push(g); }
    let pg = shade(mergeGeos(parts), '#ffffff', 0.45); if (snow) { const c = pg.attributes.color, n = pg.attributes.normal; for (let i = 0; i < c.count; i++) { const k = Math.max(0, n.getY(i)) * 0.85; c.setXYZ(i, c.getX(i) + (1 - c.getX(i)) * k, c.getY(i) + (1 - c.getY(i)) * k, c.getZ(i) + (1.05 - c.getZ(i)) * k); } }
    return [{ geo: shade(trunk(2.6, 0.34, 0.18, 0, 0), '#ffffff', 0.5), mat: MAT.bark }, { geo: pg, mat: MAT.pine }]; },
  dead: (v) => { const parts = [trunk(3.6, 0.42, 0.14, 5, v)]; for (let i = 0; i < 4; i++) { const a = i * 1.7 + v, L = 1.2 + (i % 2) * 0.6; parts.push(new THREE.CylinderGeometry(0.04, 0.1, L, 5).translate(0, L / 2, 0).rotateZ(0.9).rotateY(a).translate(0, 2.4 + i * 0.3, 0)); } return [{ geo: shade(mergeGeos(parts), '#7a7068', 0.5), mat: MAT.bark }]; },
  stump: () => [{ geo: shade(mergeGeos([new THREE.CylinderGeometry(0.42, 0.55, 0.6, 9).translate(0, 0.3, 0), new THREE.CylinderGeometry(0.4, 0.4, 0.02, 9).translate(0, 0.61, 0)]), '#ffffff', 0.55), mat: MAT.bark }],
  palm: (v) => { const parts = []; let x = 0, y = 0; for (let i = 0; i < 9; i++) { const g = new THREE.CylinderGeometry(0.17 - i * 0.008, 0.2 - i * 0.008, 0.62, 7).translate(x, y + 0.31, 0); parts.push(g); x += 0.08 + i * 0.012; y += 0.6; } const top = [x, y];
    const fr = []; for (let i = 0; i < 9; i++) { const g = new THREE.PlaneGeometry(2.6, 1.0).translate(1.3, 0, 0); g.rotateX(-Math.PI / 2 + 0.35); g.rotateZ(-0.35); g.rotateY(i / 9 * Math.PI * 2 + v); g.translate(top[0], top[1], 0); fr.push(g); }
    return [{ geo: shade(mergeGeos(parts), '#9a7448', 0.6), mat: MAT.wood }, { geo: mergeGeos(fr), mat: MAT.frond, cast: false }, { geo: shade(new THREE.SphereGeometry(1.2, 6, 4).scale(1, 0.35, 1).translate(top[0], top[1], 0), '#ffffff'), mat: SHADOW_ONLY, shadowOnly: true }]; },
  mangrove: (v) => { const Bl = [[0, 3.8, 0, 1.9], [1.3, 3.4, 0.4, 1.3], [-1.2, 3.5, -0.3, 1.3], [0.2, 4.6, -0.2, 1.3]]; const roots = []; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + v; const g = new THREE.TorusGeometry(0.7, 0.07, 5, 8, Math.PI); g.rotateY(a); g.translate(Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35); roots.push(g); }
    return [{ geo: shade(mergeGeos([trunk(2.8, 0.32, 0.22, 3, v).translate(0, 0.5, 0), ...roots]), '#6a5a48', 0.5), mat: MAT.bark }, { geo: cardCanopy(Bl, 26, 1.7, '#3a5a34', '#ffffff'), mat: MAT.mangrove, cast: false }, { geo: shadowBlobs(Bl), mat: SHADOW_ONLY, shadowOnly: true }]; },
  crystaltree: (v) => { const pr = []; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 + v, r = 0.5 + (i % 3) * 0.45; const g = new THREE.OctahedronGeometry(0.28 + (i % 2) * 0.12, 0).scale(0.6, 1.7, 0.6); g.rotateZ((i % 3 - 1) * 0.3); g.translate(Math.cos(a) * r, 3.6 + (i % 4) * 0.45, Math.sin(a) * r); pr.push(g); }
    return [{ geo: shade(trunk(3.2, 0.32, 0.16, 3, v), '#cfc8e0', 0.5), mat: MAT.bark }, { geo: mergeGeos(pr), mat: MAT.crystalLeaf }]; },
  rock: (v, tall) => { const g = noisy(new THREE.IcosahedronGeometry(1, 2), 0.35, tall ? 1.6 : 0.62, v * 3 + 1); const P = g.attributes.position, nn = g.attributes.normal, col = []; for (let i = 0; i < P.count; i++) { const moss = Math.max(0, nn.getY(i) - 0.55) * 1.6 * (P.getY(i) > 0 ? 1 : 0); const b = 0.42 + ((i * 7) % 11) / 60; col.push(b * (1 - moss) + 0.27 * moss, b * 0.98 * (1 - moss) + 0.42 * moss, b * 0.93 * (1 - moss) + 0.18 * moss); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.translate(0, tall ? 0.7 : 0.2, 0); return [{ geo: g, mat: MAT.rock }]; },
  obsidian: (v) => { const parts = []; for (let i = 0; i < 5; i++) { const a = i * 1.3 + v, r = i ? 0.45 : 0; const h = 1.6 - i * 0.18 + (i === 0 ? 0.5 : 0); parts.push(new THREE.ConeGeometry(0.22 + (i ? 0 : 0.12), h, 5).translate(Math.cos(a) * r, h / 2, Math.sin(a) * r).rotateZ((i % 2 ? 1 : -1) * 0.12 * (i ? 1 : 0))); }
    const g = mergeGeos(parts); const P = g.attributes.position, col = []; for (let i = 0; i < P.count; i++) { const ember = P.getY(i) < 0.25 ? 1 : 0; col.push(0.09 + ember * 0.9, 0.06 + ember * 0.3, 0.12); } g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return [{ geo: g, mat: MAT.solid }]; },
  ice: (v) => { const parts = []; for (let i = 0; i < 4; i++) { const a = i * 1.6 + v, r = i ? 0.38 : 0, h = 1.8 - i * 0.3; parts.push(new THREE.ConeGeometry(0.28, h, 5).translate(Math.cos(a) * r, h / 2, Math.sin(a) * r)); } return [{ geo: mergeGeos(parts), mat: MAT.ice }]; },
  crystals: (v) => { const parts = []; for (let i = 0; i < 5; i++) { const a = i * 1.25 + v, r = i ? 0.32 : 0, h = 1.3 - i * 0.15; const g = new THREE.CylinderGeometry(0.0, 0.16, 0.3, 6).translate(0, h + 0.15, 0); const b = new THREE.CylinderGeometry(0.16, 0.16, h, 6).translate(0, h / 2, 0); const m = mergeGeos([g, b]); m.rotateZ((i ? 1 : 0) * (0.25 + i * 0.05)); m.rotateY(a); m.translate(Math.cos(a) * r, 0, Math.sin(a) * r); parts.push(shade(m, ['#b08af0', '#9a6ae0', '#d0b0ff'][i % 3], 0.6)); }
    return [{ geo: mergeGeos(parts), mat: MAT.crystal }]; },
  pillar: (v) => { const h = 2.2 + (v % 3) * 0.3; const col = new THREE.CylinderGeometry(0.32, 0.36, h, 12).translate(0, h / 2 + 0.25, 0); const p = col.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 - Math.abs(Math.sin(a * 6)) * 0.06; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); if (p.getY(i) > h * 0.95) p.setY(i, p.getY(i) - (Math.sin(a * 3 + v) * 0.25 + 0.1)); } col.computeVertexNormals();
    return [{ geo: mergeGeos([shade(col, '#9a96a6', 0.6), B(0.9, 0.25, 0.9, 0, 0.125, 0, '#7a7686'), B(0.6, 0.18, 0.5, 0.7, 0.09, 0.3, '#8a8696', 0.4)]), mat: MAT.rock }]; },
  ore: (v, kind) => { const r = GEN.rock(v)[0].geo; const cr = []; for (let i = 0; i < 5; i++) { const a = i * 1.3 + v; cr.push(new THREE.OctahedronGeometry(0.16, 0).scale(0.7, 1.5, 0.7).translate(Math.cos(a) * 0.6, 0.45 + (i % 2) * 0.25, Math.sin(a) * 0.6)); }
    return [{ geo: r, mat: MAT.rock }, { geo: shade(mergeGeos(cr), kind === 'mithril' ? '#bfe0ff' : '#d0783a', 0.7), mat: MAT.crystal }]; },
  bush: (v, bloom) => { const bushB = [[0, 0.6, 0, 0.75], [0.6, 0.5, 0.2, 0.6], [-0.55, 0.5, -0.1, 0.6], [0.1, 0.9, -0.35, 0.55], [-0.2, 0.55, 0.55, 0.5]];
    return [{ geo: shade(mergeGeos(bushB.map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r * 0.65, 1).translate(x, y, z))), '#1a361e', 0.5), mat: MAT.core, cast: false }, { geo: cardCanopy(bushB, 22, 0.85, '#5a7a4a', '#ffffff'), mat: bloom ? MAT.bloom : MAT.bush, cast: false }, { geo: shadowBlobs(bushB, 0.8), mat: SHADOW_ONLY, shadowOnly: true }]; },
  fern: () => { const parts = []; for (let i = 0; i < 6; i++) { const g = new THREE.PlaneGeometry(1.1, 1.0).translate(0, 0.5, 0); g.rotateX(-0.55); g.rotateY(i / 6 * 6.28); parts.push(g); } const fg = mergeGeos(parts); const n = fg.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0); return [{ geo: fg, mat: MAT.fern, cast: false }]; },
  tallgrass: () => [{ geo: cross(0.9, 0.85), mat: MAT.grass, cast: false }],
  grasstuft: () => [{ geo: cross(0.6, 0.45), mat: MAT.grass, cast: false }],
  flowers: () => [{ geo: cross(0.7, 0.55), mat: MAT.flower, cast: false }],
  wheat: () => { const parts = []; for (let i = 0; i < 6; i++) parts.push(cross(0.6, 1.2).translate(Math.cos(i) * 0.35, 0, Math.sin(i * 1.7) * 0.35)); return [{ geo: mergeGeos(parts), mat: MAT.wheat, cast: false }]; },
  reed: () => [{ geo: cross(0.9, 1.1), mat: MAT.reed, cast: false }],
  lily: () => [{ geo: shade(new THREE.CircleGeometry(0.32, 9, 0.3, 5.9).rotateX(-Math.PI / 2).translate(0, 0.02, 0), '#4a8a3a', 1), mat: MAT.solid, cast: false }],
  mushroom: () => { const parts = []; for (let i = 0; i < 4; i++) { const a = i * 1.7, r = i ? 0.22 : 0; parts.push(shade(new THREE.SphereGeometry(0.12 + (i ? 0 : 0.05), 8, 5, 0, 6.3, 0, 1.6).translate(Math.cos(a) * r, 0.2, Math.sin(a) * r), '#c8382c', 0.7), shade(new THREE.CylinderGeometry(0.035, 0.045, 0.2, 6).translate(Math.cos(a) * r, 0.1, Math.sin(a) * r), '#efe6d0', 0.8)); } return [{ geo: mergeGeos(parts), mat: MAT.solid, cast: false }]; },
  pebble: (v) => { const parts = []; for (let i = 0; i < 4; i++) { const a = i * 1.9 + v; parts.push(noisy(new THREE.IcosahedronGeometry(0.1 + (i % 2) * 0.06, 0), 0.25, 0.6, i + v).translate(Math.cos(a) * 0.25, 0.04, Math.sin(a) * 0.25)); } return [{ geo: shade(mergeGeos(parts), '#8a8680', 0.7), mat: MAT.rock, cast: false }]; },
  cactus: (v) => { const body = new THREE.CylinderGeometry(0.22, 0.26, 2.0, 10).translate(0, 1.0, 0); const top = new THREE.SphereGeometry(0.22, 10, 6, 0, 6.3, 0, 1.6).translate(0, 2.0, 0); const arms = []; for (const s of [-1, 1]) { arms.push(new THREE.CylinderGeometry(0.14, 0.14, 0.45, 8).rotateZ(Math.PI / 2).translate(s * 0.4, 0.9 + (s > 0 ? 0.3 : 0), 0), new THREE.CylinderGeometry(0.14, 0.14, 0.7, 8).translate(s * 0.6, 1.25 + (s > 0 ? 0.3 : 0), 0), new THREE.SphereGeometry(0.14, 8, 5, 0, 6.3, 0, 1.6).translate(s * 0.6, 1.6 + (s > 0 ? 0.3 : 0), 0)); }
    const g = mergeGeos([body, top, ...arms]); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 - Math.abs(Math.sin(a * 5)) * 0.1; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.computeVertexNormals(); g.rotateY(v); return [{ geo: shade(g, '#4a8a3a', 0.6), mat: MAT.solid }]; },
  hay: () => [{ geo: shade(new THREE.CylinderGeometry(0.6, 0.62, 0.9, 12).translate(0, 0.45, 0), '#d8b860', 0.7), mat: MAT.solid }],
  barrel: () => [{ geo: mergeGeos([C(0.3, 0.3, 0.85, 0, 0, 0, '#7a5030', 12), C(0.33, 0.33, 0.06, 0, 0.18, 0, '#3a3a3a', 12), C(0.33, 0.33, 0.06, 0, 0.62, 0, '#3a3a3a', 12)]), mat: MAT.solid }],
  crate: (v, many) => { const one = (x, z, s, r) => [B(s, s, s, x, s / 2, z, '#9a7046', r), B(s + 0.02, 0.06, s + 0.02, x, s * 0.8, z, '#5a3a22', r), B(s + 0.02, 0.06, s + 0.02, x, s * 0.2, z, '#5a3a22', r)];
    return [{ geo: mergeGeos(many ? [...one(-0.35, 0, 0.6, 0.2), ...one(0.4, 0.1, 0.55, -0.3), ...one(0, 0, 0.5, 0.5).map(g => g.translate(0, 0.6, 0))] : one(0, 0, 0.6, 0)), mat: MAT.solid }]; },
  chestBase: () => [{ geo: mergeGeos([B(0.8, 0.45, 0.5, 0, 0.225, 0, '#7a4a26'), B(0.84, 0.05, 0.54, 0, 0.44, 0, '#c8a040'), B(0.1, 0.12, 0.05, 0, 0.36, 0.26, '#c8a040')]), mat: MAT.solid }],
  chestLid: () => [{ geo: mergeGeos([B(0.82, 0.18, 0.52, 0, 0.09, -0.26, '#7a4a26'), B(0.84, 0.04, 0.54, 0, 0.02, -0.26, '#c8a040')]), mat: MAT.solid }],
  campfire: () => { const parts = []; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; parts.push(noisy(new THREE.IcosahedronGeometry(0.14, 0), 0.2, 0.7, i).translate(Math.cos(a) * 0.45, 0.07, Math.sin(a) * 0.45)); } const logs = []; for (let i = 0; i < 3; i++) logs.push(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 6).rotateZ(Math.PI / 2 - 0.3).rotateY(i * 2.1).translate(0, 0.12, 0));
    return [{ geo: shade(mergeGeos(parts), '#7a7670', 0.7), mat: MAT.rock }, { geo: shade(mergeGeos(logs), '#5a3a22', 0.6), mat: MAT.solid }]; },
  flame: () => [{ geo: mergeGeos([new THREE.ConeGeometry(0.2, 0.55, 6).translate(0, 0.3, 0), new THREE.ConeGeometry(0.12, 0.35, 6).translate(0.12, 0.22, 0.05), new THREE.ConeGeometry(0.1, 0.3, 6).translate(-0.1, 0.2, -0.05)]), mat: MAT.glow, cast: false }],
  brazier: () => [{ geo: mergeGeos([C(0.06, 0.08, 0.9, 0, 0, 0, '#2a2630', 6), C(0.28, 0.18, 0.22, 0, 0.9, 0, '#3e3a48', 10), B(0.5, 0.04, 0.04, 0, 0.3, 0, '#2a2630', 0.8), B(0.5, 0.04, 0.04, 0, 0.3, 0, '#2a2630', -0.8)]), mat: MAT.solid }],
  lamp: () => [{ geo: mergeGeos([C(0.07, 0.09, 2.6, 0, 0, 0, '#2a2a30', 8), B(0.5, 0.06, 0.06, 0.22, 2.5, 0, '#2a2a30'), B(0.26, 0.04, 0.26, 0.45, 2.36, 0, '#2a2a30'), B(0.3, 0.06, 0.3, 0.45, 1.96, 0, '#2a2a30'), B(0.34, 0.3, 0.34, 0, 0.15, 0, '#7a7680')]), mat: MAT.solid }, { geo: new THREE.BoxGeometry(0.2, 0.32, 0.2).translate(0.45, 2.15, 0), mat: MAT.glow, cast: false }],
  tent: () => { const g = new THREE.BufferGeometry(); const v = [-1.3, 0, 1.2, 0, 1.8, 1.2, 1.3, 0, 1.2, -1.3, 0, -1.2, 0, 1.8, -1.2, 1.3, 0, -1.2]; const idx = [0, 1, 4, 0, 4, 3, 1, 2, 5, 1, 5, 4, 0, 2, 1, 3, 4, 5]; g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx); g.computeVertexNormals();
    return [{ geo: shade(g.toNonIndexed(), '#c8b48a', 0.7), mat: MAT.canvas }, { geo: mergeGeos([C(0.04, 0.04, 2.0, 0, 0, 1.25, '#5a3a22', 5), C(0.04, 0.04, 2.0, 0, 0, -1.25, '#5a3a22', 5)]), mat: MAT.solid }]; },
  wreck: (v) => { const parts = []; for (let i = 0; i < 9; i++) { const t = i / 8, a = (t - 0.5) * Math.PI * 0.85; parts.push(new THREE.BoxGeometry(4.2 - Math.abs(t - 0.5) * 2.4, 0.12, 0.3).translate(0, -Math.cos(a) * 1.1 + 1.1, Math.sin(a) * 1.3).rotateX(a)); } parts.push(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 6).translate(0.6, 1.8, 0).rotateZ(0.5));
    const g = mergeGeos(parts); g.rotateZ(0.25); g.rotateY(v); return [{ geo: shade(g, '#6a5038', 0.55), mat: MAT.wood }]; },
  fountain: () => [{ geo: mergeGeos([shade(new THREE.CylinderGeometry(1.4, 1.5, 0.55, 8).translate(0, 0.27, 0), '#a8a49a', 0.7), shade(new THREE.CylinderGeometry(0.25, 0.35, 1.3, 8).translate(0, 0.65, 0), '#a8a49a', 0.7), shade(new THREE.CylinderGeometry(0.7, 0.3, 0.3, 10).translate(0, 1.4, 0), '#b0aca2', 0.75)]), mat: MAT.rock },
    { geo: shade(new THREE.CircleGeometry(1.3, 16).rotateX(-Math.PI / 2).translate(0, 0.5, 0), '#3a7a9a', 1), mat: MAT.solid, cast: false }],
  anvil: () => [{ geo: mergeGeos([B(0.3, 0.45, 0.35, 0, 0.22, 0, '#3a3a3e'), B(0.75, 0.16, 0.3, 0, 0.53, 0, '#4a4a52'), B(0.3, 0.1, 0.22, 0.45, 0.56, 0, '#4a4a52'), C(0.35, 0.35, 0.3, 0, -0.1, 0, '#5a3a22', 10)]), mat: MAT.solid }],
  grave: (v) => [{ geo: mergeGeos([shade(new THREE.BoxGeometry(0.6, 0.9, 0.16).translate(0, 0.45, 0).rotateZ((v % 3 - 1) * 0.08), '#8a8a90', 0.6), shade(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 12, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2).translate(0, 0.9, 0), '#8a8a90', 0.6), B(0.7, 0.06, 1.2, 0, 0.03, 0.5, '#5a5048')]), mat: MAT.rock }],
  tomb: () => [{ geo: mergeGeos([B(1.4, 0.7, 2.4, 0, 0.35, 0, '#8a8690'), B(1.5, 0.12, 2.5, 0, 0.75, 0, '#9a96a0'), B(0.5, 0.06, 0.8, 0, 0.84, 0, '#c8a040')]), mat: MAT.rock }],
  altar: () => [{ geo: mergeGeos([B(1.6, 0.8, 0.9, 0, 0.4, 0, '#8a8690'), B(1.8, 0.12, 1.0, 0, 0.86, 0, '#a09ca8'), B(2.2, 0.15, 1.6, 0, 0.07, 0, '#6a6670')]), mat: MAT.rock }],
  sanctuary: () => { const parts = []; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; parts.push(noisy(new THREE.BoxGeometry(0.4, 1.4 + (i % 2) * 0.4, 0.3), 0.08, 1, i).translate(Math.cos(a) * 2.2, 0.7, Math.sin(a) * 2.2).rotateY(0)); } return [{ geo: shade(mergeGeos(parts), '#8a8a90', 0.6), mat: MAT.rock }]; },
  darkgate: () => [{ geo: mergeGeos([B(0.5, 3.4, 0.5, -1.1, 1.7, 0, '#2a2236'), B(0.5, 3.4, 0.5, 1.1, 1.7, 0, '#2a2236'), B(2.8, 0.5, 0.6, 0, 3.5, 0, '#2a2236')]), mat: MAT.rock }, { geo: new THREE.PlaneGeometry(1.7, 3.0).translate(0, 1.6, 0), mat: MAT.portal, cast: false }],
  house: (v) => houseGen(v)
};
function houseGen(v) {
  const w = 4.4 + (v % 3) * 0.6, d = 3.6 + (v % 2) * 0.5, h = 2.5, t = 0.2; const plaster = [], wood = [], roof = [];
  for (const [sx, sz, L, ry] of [[0, d / 2, w, 0], [0, -d / 2, w, 0], [w / 2, 0, d, Math.PI / 2], [-w / 2, 0, d, Math.PI / 2]]) { plaster.push(B(L, h, t, sx, h / 2, sz, '#e9dcc0', ry, 0, 0, 0.85)); const n = Math.round(L / 1.3); for (let i = 0; i <= n; i++) { const a = -L / 2 + i * L / n; const g = new THREE.BoxGeometry(0.14, h, 0.06).translate(a, h / 2, t / 2 + 0.02); if (ry) g.rotateY(ry); g.translate(sx + (ry ? (sx > 0 ? 0.01 : -0.01) : 0), 0, sz + (ry ? 0 : Math.sign(sz) * 0.0)); wood.push(shade(g, '#3e2716', 0.8)); } }
  wood.push(B(w + 0.1, 0.16, d + 0.1, 0, 1.15, 0, '#3e2716'), B(w + 0.1, 0.16, d + 0.1, 0, h, 0, '#3e2716'), B(1.0, 1.9, 0.08, 0, 0.95, d / 2 + 0.12, '#6e4426'));
  for (const s of [-1, 1]) { wood.push(B(0.8, 0.7, 0.06, s * w * 0.28, 1.6, d / 2 + 0.11, '#33445a')); }
  const rise = d / 2 * 0.9, ov = 0.45, L = Math.hypot(d / 2 + ov, rise + ov * 0.9), ang = Math.atan2(rise, d / 2);
  for (const s of [-1, 1]) roof.push(B(w + ov * 2, 0.14, L, 0, h + rise / 2 - 0.05, s * (d / 4 + ov / 2 - 0.1), ['#a2523a', '#4a5466', '#7a6a52'][v % 3], 0, s * ang, 0, 0.8));
  const gab = new THREE.BufferGeometry(); const gv = []; for (const sx of [-w / 2, w / 2]) gv.push(sx, h, d / 2, sx, h, -d / 2, sx, h + rise, 0); gab.setAttribute('position', new THREE.Float32BufferAttribute(gv, 3)); gab.computeVertexNormals(); plaster.push(shade(gab, '#e0d2b6', 0.9));
  const chim = B(0.5, 1.4, 0.5, w * 0.28, h + rise * 0.7, -d * 0.15, '#7a7468');
  return [{ geo: mergeGeos(plaster), mat: MAT.wood }, { geo: mergeGeos(wood), mat: MAT.wood }, { geo: mergeGeos([...roof, chim]), mat: MAT.wood }];
}
GEN.house = houseGen;

// ---------------- correspondance types du jeu → modèles ----------------
// h : hauteur cible en mètres (proportionnelle à l'image du jeu) ; dyn : décor qui change d'état (coffre, feu, ressource)
export const MAP = {
  oak1: ['oak', 4.6], oak2: ['oak', 4.9], oak3: ['oak', 5.6], oak6: ['oak', 5.6], oak8: ['oak', 4.6], oak9: ['oak', 4.9], oldwood: ['oak', 5.2],
  dark13: ['dark', 4.8], dark14: ['dark', 5.1], dark15: ['dark', 5.8],
  pine17: ['pine', 6.0], pine18: ['pine', 5.0], pine19: ['pine', 5.3], conifer: ['pine', 2.4], snowpine: ['snowpine', 4.6],
  wall4: ['grove', 5.2], wall10: ['grove', 5.2], wall16: ['grove', 5.2], wall20: ['grove', 5.2],
  deadtree: ['dead', 3.6], witheredtree: ['dead', 4.2], lore_dead: ['dead', 4.2], stump: ['stump', 0.6], lore_stump: ['stump', 0.7],
  palm: ['palm', 5.4], mangrove: ['mangrove', 5.0], crystaltree: ['crystaltree', 5.0],
  rockgreybig: ['rock', 1.5], rockgrey: ['rock', 1.0], rockmed: ['rock', 0.8], rocksm: ['rock', 0.5], rocktall: ['rocktall', 2.0], rockflat: ['rock', 0.4], lore_rock: ['rock', 1.0],
  obsidian: ['obsidian', 1.8], lore_obsidian: ['obsidian', 1.8], icespike: ['ice', 1.8], crystal: ['crystals', 1.4], lore_crystal: ['crystals', 1.4],
  pillar: ['pillar', 2.6], lore_pillar: ['pillar', 2.6], ironore: ['ore', 1.0, 1], ore_iron: ['ore', 1.0, 1], ore_mithril: ['oreM', 1.0, 1],
  bush0: ['bush', 1.3], bush1: ['bush', 1.2], bush2: ['bloom', 1.3], bush3: ['bush', 1.0], bush4: ['bloom', 1.2], bush5: ['bush', 1.4],
  fern: ['fern', 0.9], bigfern: ['fern', 1.3], tallgrass1: ['tallgrass', 0.9], tallgrass2: ['tallgrass', 1.0], grass3: ['grasstuft', 0.5], grass1: ['grasstuft', 0.45], grass2: ['grasstuft', 0.4],
  flower0: ['flowers', 0.55], flower1: ['flowers', 0.55], flower2: ['flowers', 0.55], flower3: ['flowers', 0.55], flower4: ['flowers', 0.55], flower5: ['flowers', 0.55],
  herb: ['bush', 0.6, 1], wheat: ['wheat', 1.2], reed1: ['reed', 1.1], lily1: ['lily', 0.05], lily2: ['lily', 0.05], lily3: ['lily', 0.05], mushroom: ['mushroom', 0.3], pebble: ['pebble', 0.15],
  cactus: ['cactus', 2.0], haystack: ['hay', 0.9], barrel: ['barrel', 0.85], barrel2: ['barrel', 0.85], crate: ['crate', 0.6], crates: ['crates', 1.1],
  chest: ['chest', 0.6, 1], cache: ['chest', 0.6, 1], stash: ['chest', 0.6, 1], campfire: ['campfire', 0.5, 1], lore_fire: ['campfire', 0.5, 1], brazier: ['brazier', 1.1, 1],
  lamp: ['lamp', 2.6, 1], lore_lamp: ['lamp', 2.6, 1], tent: ['tent', 1.8], wreck: ['wreck', 2.2], fountain: ['fountain', 1.6], anvil: ['anvil', 0.6],
  grave1: ['grave', 1.0], grave2: ['grave', 1.0], grave3: ['grave', 1.0], lore_grave: ['grave', 1.0], tomb: ['tomb', 0.9], altar: ['altar', 1.0], sanctuary: ['sanctuary', 1.6], darkgate: ['darkgate', 3.7],
  house_a: ['house', 0], house_b: ['house', 0], house_c: ['house', 0]
};
const BASE_H = { oak: 7.4, dark: 7.8, pine: 7.6, snowpine: 7.6, dead: 4.6, stump: 0.62, palm: 5.6, mangrove: 6.0, crystaltree: 5.0, rock: 0.85, rocktall: 2.2, obsidian: 2.1, ice: 1.8, crystals: 1.5, pillar: 2.8, ore: 0.85, oreM: 0.85, bush: 1.2, bloom: 1.2, fern: 0.9, tallgrass: 0.85, grasstuft: 0.45, flowers: 0.55, wheat: 1.2, reed: 1.1, lily: 0.05, mushroom: 0.3, pebble: 0.15, cactus: 2.2, hay: 0.9, barrel: 0.85, crate: 0.6, crates: 1.1, chest: 0.6, campfire: 0.5, brazier: 1.1, lamp: 2.6, tent: 1.8, wreck: 2.2, fountain: 1.6, anvil: 0.6, grave: 1.0, tomb: 0.9, altar: 1.0, sanctuary: 1.6, darkgate: 3.7, house: 1, grove: 7.4 };
const CACHE = new Map();
export function kitParts(kit, variant = 0) {
  const k = kit + ':' + variant; if (CACHE.has(k)) return CACHE.get(k); seed = 7 + variant * 131;
  let parts;
  switch (kit) {
    case 'snowpine': parts = GEN.pine(variant, true); break;
    case 'rocktall': parts = GEN.rock(variant, true); break;
    case 'oreM': parts = GEN.ore(variant, 'mithril'); break;
    case 'bloom': parts = GEN.bush(variant, true); break;
    case 'crates': parts = GEN.crate(variant, true); break;
    case 'grove': { const a = GEN.oak(variant), b = GEN.dark(variant + 1); const off = (g, x, z, s) => g.clone().scale(s, s, s).translate(x, 0, z); parts = a.map((p, i) => ({ ...p, geo: mergeGeos([off(p.geo, -1.4, 0.3, 0.9), off(b[i].geo, 1.3, -0.4, 1.0), off(p.geo, 0.1, 1.1, 0.75)]) })); break; }
    default: parts = (GEN[kit] || GEN.rock)(variant);
  }
  CACHE.set(k, parts); return parts;
}
export function kitScale(type) { const m = MAP[type]; if (!m) return 1; const base = BASE_H[m[0]] || 1; return m[0] === 'house' ? 1 : m[1] / base; }
export { MAT as KIT_MAT };
export const VARIANTS = 4;
