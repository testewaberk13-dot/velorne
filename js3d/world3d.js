// =====================================================================
//  VÉLORNE 3D — MONDE : sol sculpté et peint par biome, eau, herbe, décors 3D (par blocs de 32 × 32 m)
//  Source : la carte du jeu (WORLD.V, WORLD.solid, WORLD.props, WORLD.zones). Rien n'est retiré :
//  chaque décor a un modèle 3D, ou à défaut son image du jeu (panneau debout ou décalque au sol).
// =====================================================================
import { THREE, scene, patch, canvasTex, MOBILE, U, STATE } from '../assets/demo/v4/core.js';
import { kitParts, kitScale, MAP, VARIANTS, KIT_MAT, setKitLod } from './kit3d.js';
import { mergeGeos } from '../assets/demo/v4/nature.js';

const T = 32, CH = 32, B = B2D;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function h2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vn(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (h2(ix, iy) * (1 - u) + h2(ix + 1, iy) * u) * (1 - v) + (h2(ix, iy + 1) * (1 - u) + h2(ix + 1, iy + 1) * u) * v; }
const fbm = (x, y) => vn(x, y) * 0.55 + vn(x * 2.1, y * 2.1) * 0.3 + vn(x * 4.3, y * 4.3) * 0.15;

// ---------------- palettes de biomes (une par zone du jeu) ----------------
const P = (grass, grass2, dirt, sand, rock, gAmt, tint) => ({ grass, grass2, dirt, sand, rock, gAmt, tint });
const BIOME = {
  village: P('#6ea444', '#8cbc52', '#a8845a', '#d0be90', '#8c877c', 1, '#ffffff'),
  forest: P('#3f7a30', '#5a9238', '#7a5c3a', '#bca878', '#6e6a64', 1.2, '#d8f0c8'),
  boss: P('#4e7a32', '#6a8a3a', '#8a6a44', '#c0aa80', '#76706a', 0.8, '#e8e8c8'),
  ruins: P('#56704a', '#6a7a56', '#6a6050', '#a8a08a', '#7a7880', 0.7, '#c8d0c0'),
  camp: P('#6a7a3a', '#7a8a44', '#9a7448', '#c8b088', '#8a7a6a', 0.6, '#e8e0b0'),
  desert: P('#d8b878', '#e4c88a', '#c89a5a', '#ecd8a8', '#b08a5a', 0.05, '#f0d890'),
  neige: P('#e8eef4', '#d8e4ee', '#9aa4ae', '#f4f8fc', '#9aa8b4', 0.0, '#ffffff'),
  marais: P('#4a5a32', '#5a6a3a', '#4a3e2a', '#7a7258', '#5a5a52', 0.9, '#a8b890'),
  volcan: P('#6e4a3a', '#7e5440', '#4a3028', '#9a5a34', '#4e3a34', 0.0, '#ffffff'),
  citadelle: P('#3a3046', '#4a3a52', '#2a2232', '#5a5064', '#3a3444', 0.15, '#b8a8d0'),
  cote: P('#7aa84a', '#8cb456', '#b8a070', '#e8d8a8', '#8a8678', 0.8, '#f0f0c8'),
  plaines: P('#a8b450', '#c4c060', '#a8885a', '#d8c890', '#8a8270', 1.1, '#fff0a0'),
  cristal: P('#5a8a8a', '#7aa0a8', '#6a6a8a', '#b0b0d0', '#8a88b0', 0.7, '#d0e8ff'),
  jungle: P('#2e6a2a', '#3e7a30', '#5a4a2a', '#a89a6a', '#5a6a54', 1.3, '#c8f0a8'),
  oasis: P('#d0b070', '#e0c080', '#b89058', '#ecd8a8', '#b08a5a', 0.15, '#f0e0a0'),
  monts: P('#6a6a5a', '#7a7a66', '#6a5a4a', '#a8a090', '#7a7470', 0.35, '#e0e0d0'),
  hurlevents: P('#7a8a6a', '#8a9a76', '#7a6e5a', '#b8b098', '#848480', 0.6, '#e8f0e0'),
  ombres: P('#3a3a4a', '#4a4656', '#34303a', '#5a5666', '#44404e', 0.4, '#a8a0c0'),
  fjord: P('#5a7a5a', '#6a8a66', '#5a5a52', '#9aa8a4', '#7a8488', 0.6, '#d8e8e0'),
  archipel: P('#7ab05a', '#8cc068', '#c8b080', '#f0e0b0', '#9a9488', 0.7, '#f0ffd8'),
  aether: P('#8ac87a', '#a8d88a', '#c8c0a0', '#f0ecd8', '#b8b8c8', 0.9, '#ffffff'),
  corrompues: P('#3a2a3e', '#4a3248', '#2a1e2e', '#5a4a5a', '#3a3040', 0.2, '#b090c0'),
  mines: P('#4a4640', '#56504a', '#3a3430', '#6a625a', '#5a5450', 0.0, '#ffffff'),
  lave: P('#5e3e34', '#6e4636', '#3e2a24', '#8e4a2c', '#4a3630', 0.0, '#ffffff'),
  temple: P('#6a6a50', '#7a7a5a', '#6a5e48', '#b0a888', '#86826e', 0.3, '#e0e0c0')
};
const _ca = new THREE.Color(), _cb = new THREE.Color();
const COLC = new Map(); const col = h => { let c = COLC.get(h); if (!c) { c = new THREE.Color(h); COLC.set(h, c); } return c; };
function zoneId(tx, ty) { for (const z of WORLD.zones) if (z.id !== 'forest' && tx >= z.x0 && tx < z.x1 && ty >= z.y0 && ty < z.y1) return z.id; return 'forest'; }
// biome d'un point avec bords mêlés (on décale la recherche avec un peu de bruit)
const biomeAt = (x, z) => BIOME[zoneId(Math.floor(x + (vn(x * 0.2, z * 0.2) - 0.5) * 5), Math.floor(z + (vn(z * 0.2 + 9, x * 0.2) - 0.5) * 5))] || BIOME.forest;
// masques continus depuis la grille de sommets du jeu (0 terre, 1 herbe, 2 eau)
function masks(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz; let g = 0, w = 0;
  for (const [dx, dz, k] of [[0, 0, (1 - fx) * (1 - fz)], [1, 0, fx * (1 - fz)], [0, 1, (1 - fx) * fz], [1, 1, fx * fz]]) { const v = vget(ix + dx, iz + dz); if (v >= T_GRASS) g += k; if (v === T_WATER) w += k; }
  return [g, w];
}
// zones remplacées par un décor 3D complet (Brumeval) : hauteur fournie par ce décor ; sol, herbe et décors 2D masqués
export const HOOK = { height: null, mask: null, keep: null, decor: null };
export function groundH(x, z) { if (HOOK.height) { const h = HOOK.height(x, z); if (h != null) return h; } const [, w] = masks(x, z); return -0.95 * sstep(0.25, 0.85, w) + (fbm(x * 0.15, z * 0.15) - 0.5) * 0.18 * (1 - w); }

// ---------------- matériaux du sol et de l'eau ----------------
const detail = canvasTex(256, (x, S) => { x.fillStyle = '#d0d0d0'; x.fillRect(0, 0, S, S); for (let i = 0; i < 2600; i++) { const v = 150 + Math.floor(Math.random() * 105); x.strokeStyle = `rgb(${v},${v},${v})`; x.lineWidth = 1 + Math.random(); const px = Math.random() * S, py = Math.random() * S; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 3, py - 2 - Math.random() * 5); x.stroke(); }
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${90 + Math.random() * 40},${90 + Math.random() * 40},${90 + Math.random() * 40},.5)`; x.beginPath(); x.ellipse(Math.random() * S, Math.random() * S, 1 + Math.random() * 2.5, 1 + Math.random() * 1.6, Math.random() * 3, 0, 6.3); x.fill(); } }, { repeat: 1 });
detail.wrapS = detail.wrapT = THREE.RepeatWrapping;
const groundMat = new THREE.MeshLambertMaterial({ vertexColors: true, map: detail });
groundMat.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, U);
  sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWP = (modelMatrix * vec4(position,1.0)).xyz;').replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = (modelMatrix * vec4(position,1.0)).xz / 3.0;\n#endif');
  sh.fragmentShader = 'uniform float uTime; varying vec3 vWP;\n float th(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }\n float tn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(th(i),th(i+vec2(1,0)),f.x), mix(th(i+vec2(0,1)),th(i+vec2(1,1)),f.x), f.y); }\n' +
    sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n { float big = tn(vWP.xz * 0.11) * 0.6 + tn(vWP.xz * 0.37) * 0.4; diffuseColor.rgb *= 0.86 + big * 0.28; }')
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n { float cl = smoothstep(0.35, 0.75, tn(vWP.xz * 0.025 + vec2(uTime * 0.018, uTime * 0.007)) * 0.7 + tn(vWP.xz * 0.06 - uTime * 0.01) * 0.3); reflectedLight.directDiffuse *= 1.0 - cl * 0.4; }');
};
const mkWater = (deep, shallow, lava) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uTime: U.uTime, uSunDir: U.uSunDir, uDeep: { value: new THREE.Color(deep) }, uShallow: { value: new THREE.Color(shallow) }, uLava: { value: lava ? 1 : 0 } },
  vertexShader: 'varying vec3 vWP; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
  fragmentShader: `uniform float uTime, uLava; uniform vec3 uSunDir, uDeep, uShallow; varying vec3 vWP;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
    void main(){ vec2 p = vWP.xz; float w1 = n(p * 1.3 + vec2(uTime * 0.3, uTime * 0.5)), w2 = n(p * 2.6 - vec2(uTime * 0.4, uTime * 0.2));
      vec3 c = mix(uShallow, uDeep, 0.55 + (w1 - 0.5) * 0.3) * 0.6;
      if (uLava > 0.5) { float cr = smoothstep(0.35, 0.75, n(p * 0.8 + vec2(uTime * 0.05, -uTime * 0.03)) * 0.6 + w2 * 0.4); gl_FragColor = vec4(mix(vec3(0.5, 0.08, 0.02), vec3(2.2, 0.9, 0.2), cr), 1.0); return; }
      vec3 V = normalize(cameraPosition - vWP); vec3 nr = normalize(vec3((w1 - 0.5) * 0.25, 1.0, (w2 - 0.5) * 0.25)); vec3 R = reflect(-V, nr);
      c += vec3(1.0, 0.95, 0.85) * pow(max(dot(R, normalize(uSunDir)), 0.0), 200.0) * 1.2;
      c += smoothstep(0.82, 0.95, n(p * 0.9 + uTime * 0.15)) * 0.04;
      gl_FragColor = vec4(c, 0.82); }` });
const WATER = { def: mkWater('#0a3a4a', '#2a7a80'), lava: mkWater('#000', '#000', true), murky: mkWater('#1a2a14', '#3a4a22'), dark: mkWater('#140a20', '#3a2048'), ice: mkWater('#2a4a5a', '#7aa8c0') };
const WATER_OF = { volcan: 'lava', lave: 'lava', marais: 'murky', jungle: 'murky', corrompues: 'dark', citadelle: 'dark', ombres: 'dark', neige: 'ice', fjord: 'ice' };

// ---------------- un bloc ----------------
const CHUNKS = new Map(), DYN = new Set(), BOARDS = new Map();
const dummy = new THREE.Object3D(), tint = new THREE.Color();
function propsByChunk() { if (WORLD._pc) return WORLD._pc; const m = new Map(); for (const p of WORLD.props) { const k = Math.floor(p.x / T / CH) + ',' + Math.floor(p.y / T / CH); if (!m.has(k)) m.set(k, []); m.get(k).push(p); } WORLD._pc = m; return m; }
const SUB = 16; // quart de bloc : unité de tri hors champ
function buildChunk(i, j) {
  setKitLod(STATE.qual);
  const key = i + ',' + j; if (CHUNKS.has(key)) return; const x0 = i * CH, z0 = j * CH, group = new THREE.Group(); scene.add(group); const ch = { i, j, group, dyn: [], q: STATE.qual };
  // sol : 64 × 64 segments, couleurs par sommet (biome, terre, herbe, rives), relief doux, eau creusée
  const N = MOBILE ? 48 : 64, g = new THREE.PlaneGeometry(CH, CH, N, N); g.rotateX(-Math.PI / 2); g.translate(x0 + CH / 2, 0, z0 + CH / 2);
  const p = g.attributes.position, cols = new Float32Array(p.count * 3); let hasWater = false;
  for (let k = 0; k < p.count; k++) {
    const x = p.getX(k), z = p.getZ(k), [gm, wm] = masks(x, z), bi = biomeAt(x, z), hid = HOOK.mask && HOOK.mask(x, z); p.setY(k, hid ? -4 : groundH(x, z)); if (wm > 0.3 && !hid) hasWater = true;
    const n1 = fbm(x * 0.09, z * 0.09), n2 = vn(x * 0.6, z * 0.6);
    _ca.copy(col(bi.grass)).lerp(col(bi.grass2), sstep(0.35, 0.7, n1)); _ca.multiplyScalar(0.9 + n2 * 0.2);
    _cb.copy(col(bi.dirt)).multiplyScalar(0.92 + n2 * 0.16); _ca.lerp(_cb, 1 - sstep(0.25, 0.75, gm + (n2 - 0.5) * 0.3));
    if (wm > 0.05) _ca.lerp(col(bi.sand), sstep(0.05, 0.4, wm) * 0.85);
    cols[k * 3] = _ca.r; cols[k * 3 + 1] = _ca.g; cols[k * 3 + 2] = _ca.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals(); g.userData.own = true;
  const mesh = new THREE.Mesh(g, groundMat); mesh.receiveShadow = true; group.add(mesh);
  if (hasWater) { const wg = new THREE.PlaneGeometry(CH, CH); wg.rotateX(-Math.PI / 2); const zid = zoneId(x0 + 16, z0 + 16); const wmsh = new THREE.Mesh(wg, WATER[WATER_OF[zid] || 'def']); wmsh.position.set(x0 + CH / 2, -0.32, z0 + CH / 2); wmsh.renderOrder = 2; group.add(wmsh); }
  // herbe : touffes sur les cases d'herbe, densité et teinte du biome
  const grass = [];
  const tries = MOBILE ? 1400 : 2600; for (let k = 0; k < tries; k++) { const x = x0 + h2(k, i * 13 + j) * CH, z = z0 + h2(k + 0.5, j * 17 + i) * CH; const bi = biomeAt(x, z); if (h2(x, z) > bi.gAmt * 0.9) continue; const [gm, wm] = masks(x, z); if (gm < 0.75 || wm > 0.02) continue; if (HOOK.mask && HOOK.mask(x, z)) continue; grass.push([x, z, bi]); }
  const gq = [0.45, 0.75, 1][STATE.qual] || 1; const gsub = new Map(); for (const g of grass) { if (h2(g[0] * 7, g[1]) > gq) continue; const q = Math.floor((g[0] - x0) / SUB) + ',' + Math.floor((g[1] - z0) / SUB); if (!gsub.has(q)) gsub.set(q, []); gsub.get(q).push(g); }
  for (const grass of gsub.values()) if (grass.length) { const parts = kitParts('grasstuft', 0); const im = new THREE.InstancedMesh(parts[0].geo, KIT_MAT.grass, grass.length); grass.forEach(([x, z, bi], k) => { const s = 0.7 + h2(x, z * 3) * 0.8; dummy.position.set(x, groundH(x, z) - 0.02, z); dummy.rotation.set(0, h2(z, x) * 6.28, 0); dummy.scale.set(s, s, s); dummy.updateMatrix(); im.setMatrixAt(k, dummy.matrix); tint.set(bi.tint).multiplyScalar(0.85 + h2(x * 2, z) * 0.3); im.setColorAt(k, tint); }); im.computeBoundingSphere(); group.add(im); }
  // décors : instanciés par modèle et variante ; les décors qui changent d'état sont suivis à part
  const groups = new Map(), list = propsByChunk().get(key) || [];
  for (const pr of list) {
    if (HOOK.mask && HOOK.mask(pr.x / T, pr.y / T) && !(HOOK.keep && HOOK.keep(pr))) continue;
    const m = MAP[pr.type];
    if (!m) { fallback(pr, ch); continue; }
    if (m[2] || pr.hidden || pr.type === 'house_a' || pr.type === 'house_b' || pr.type === 'house_c') { dynamic(pr, m, ch); continue; }
    const v = Math.floor(h2(pr.x, pr.y) * VARIANTS), gk = m[0] + ':' + v + ':' + Math.floor((pr.x / T - x0) / SUB) + ',' + Math.floor((pr.y / T - z0) / SUB); if (!groups.has(gk)) groups.set(gk, []); groups.get(gk).push(pr);
  }
  for (const [gk, L] of groups) { const [kit, v] = gk.split(':'); const parts = kitParts(kit, +v);
    for (const part of parts) { const im = new THREE.InstancedMesh(part.geo, part.mat, L.length); im.castShadow = part.cast !== false; im.receiveShadow = !part.shadowOnly; if (part.shadowOnly) { im.layers.set(1); im.castShadow = true; }
      L.forEach((pr, k) => { const s = kitScale(pr.type) * (0.88 + h2(pr.y, pr.x) * 0.24), x = pr.x / T, z = pr.y / T; dummy.position.set(x, groundH(x, z) - 0.05, z); dummy.rotation.set(0, h2(pr.x * 3, pr.y) * 6.28, 0); dummy.scale.set(s, s, s); dummy.updateMatrix(); im.setMatrixAt(k, dummy.matrix); });
      im.computeBoundingSphere(); group.add(im); } }
  if (HOOK.decor) try { HOOK.decor(ch, x0, z0, CH, (x, z) => zoneId(Math.floor(x), Math.floor(z))); } catch (e) { console.warn('décor', e); }
  CHUNKS.set(key, ch);
}
// décor sans modèle 3D : image du jeu, debout (ou au sol si le décor est plat)
const FB_MAT = new Map();
function fbMat(pr) { const key = B.propKey(pr); let m = FB_MAT.get(key); if (m) return m; const c = document.createElement('canvas'); const r = B.drawPropSprite(c, pr); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  m = patch(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }), { cut: true, near: false }); m.userData = { w: r[2], h: r[3], depth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 }) }; FB_MAT.set(key, m); return m; }
function fallback(pr, ch) {
  const mat = fbMat(pr), w = mat.userData.w / T, h = mat.userData.h / T, x = pr.x / T, z = pr.y / T; const g = new THREE.PlaneGeometry(w, h);
  if (pr.def.flat) { g.rotateX(-Math.PI / 2); g.translate(0, 0, -h / 2 + 0.1); } else g.translate(0, h / 2, 0);
  const mesh = new THREE.Mesh(g, mat); mesh.position.set(x, groundH(x, z) + (pr.def.flat ? 0.03 : 0), z); mesh.castShadow = !pr.def.flat; mesh.customDepthMaterial = mat.userData.depth; mesh.userData.board = !pr.def.flat; ch.group.add(mesh); ch.dyn.push({ pr, mesh, kind: 'fb' });
}
// décor qui change d'état : coffre ouvert, feu animé, ressource épuisée, cachette secrète, maisons (fondu devant le héros)
function dynamic(pr, m, ch) {
  const kit = m[0], v = Math.floor(h2(pr.x, pr.y) * VARIANTS), s = kit === 'house' ? (pr.def.r ? pr.def.r[2] / T / 5.2 : 1) : kitScale(pr.type), x = pr.x / T, z = pr.y / T, root = new THREE.Group(); root.position.set(x, groundH(x, z) - 0.03, z); root.rotation.y = kit === 'house' ? 0 : h2(pr.x * 3, pr.y) * 6.28; root.scale.setScalar(s); ch.group.add(root);
  const add = (parts, parent) => { for (const part of parts) { const mesh = new THREE.Mesh(part.geo, part.mat); mesh.castShadow = part.cast !== false; mesh.receiveShadow = !part.shadowOnly; if (part.shadowOnly) mesh.layers.set(1); parent.add(mesh); } };
  const d = { pr, root, kind: kit };
  if (kit === 'chest') { add(kitParts('chestBase'), root); const lid = new THREE.Group(); lid.position.set(0, 0.45, 0.26); add(kitParts('chestLid'), lid); root.add(lid); d.lid = lid; }
  else if (kit === 'campfire' || kit === 'brazier') { add(kitParts(kit), root); const f = new THREE.Group(); f.position.y = kit === 'brazier' ? 1.0 : 0.08; add(kitParts('flame'), f); root.add(f); d.flame = f; }
  else add(kitParts(kit, v), root);
  ch.dyn.push(d);
}
function refreshDyn(d, t, P) {
  const pr = d.pr;
  if (pr.hidden) { const show = pr.opened || G.reveal > 0 || Math.hypot(pr.x - P.x, pr.y - P.y) < 26; (d.root || d.mesh).visible = show; }
  if (d.lid) d.lid.rotation.x = -(pr.opened ? 1.9 : 0);
  if (d.flame) { const k = 0.85 + Math.sin(t * 13 + pr.x) * 0.1 + Math.sin(t * 7.3) * 0.08; d.flame.scale.set(1, k, 1); }
  if (pr.respawnAt != null && d.root) { const gone = pr.respawnAt > G.t; d.root.visible = !gone || !!pr.hidden; d.root.scale.setScalar(kitScale(pr.type) * (gone ? 0.5 : 1)); }
  if (d.kind === 'fb' && d.mesh.userData.board) d.mesh.rotation.y = 0;
}
export function updateWorld(px, pz, t) {
  const ci = Math.floor(px / CH), cj = Math.floor(pz / CH), R = 1;
  let built = 0; for (let j = cj - R; j <= cj + R; j++) for (let i = ci - R; i <= ci + R; i++) if (i >= 0 && j >= 0 && i * CH < MW && j * CH < MH && !CHUNKS.has(i + ',' + j) && built < 1) { buildChunk(i, j); built++; }
  const free = (k, ch) => { scene.remove(ch.group); ch.group.traverse(o => { if (o.isInstancedMesh) o.dispose(); if (o.geometry && o.isMesh && !o.isInstancedMesh && o.geometry.userData.own) o.geometry.dispose(); }); CHUNKS.delete(k); };
  for (const [k, ch] of CHUNKS) if (Math.abs(ch.i - ci) > R + 1 || Math.abs(ch.j - cj) > R + 1) free(k, ch);
  // qualité graphique changée : les blocs sont reconstruits un par un avec la nouvelle finesse
  if (!built) for (const [k, ch] of CHUNKS) if (ch.q !== STATE.qual) { free(k, ch); buildChunk(ch.i, ch.j); break; }
  const P = G.player; for (const ch of CHUNKS.values()) if (Math.abs(ch.i - ci) <= 1 && Math.abs(ch.j - cj) <= 1) for (const d of ch.dyn) refreshDyn(d, t, P);
}
export function forceBuildAround(px, pz) { const ci = Math.floor(px / CH), cj = Math.floor(pz / CH); for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) if (i >= 0 && j >= 0 && i * CH < MW && j * CH < MH) buildChunk(i, j); }
export { CHUNKS, BIOME };
