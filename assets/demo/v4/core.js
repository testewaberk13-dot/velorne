// =====================================================================
//  VÉLORNE — prototype 3D v4 · CŒUR : moteur, terrain sculpté, ciel, eau, lumière, post-traitement
//  Prototype indépendant : n'utilise ni les données, ni les sauvegardes du jeu.
// =====================================================================
import * as THREE from '../three.module.js';
export { THREE };

// ---------------- outils ----------------
let seed = 20261124; export const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
export const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const sstep = (a, b, x) => smooth((x - a) / (b - a));
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
export function vnoise(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash2(ix, iy), hash2(ix + 1, iy), u), lerp(hash2(ix, iy + 1), hash2(ix + 1, iy + 1), u), v); }
export function fbm(x, y, o = 4) { let a = 0, s = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { a += vnoise(x * f, y * f) * s; n += s; s *= 0.5; f *= 2.03; } return a / n; }
export const angLerp = (a, b, t) => { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * t; };

// ---------------- géographie (en mètres ; y vers le haut) ----------------
// village au centre (0,0) ; route du sud ; rivière à l'est (pont) ; falaise et cascade au nord ; ferme à l'ouest ; forêt autour.
export const ROADS = [
  [[0, 78], [1, 50], [-1, 30], [0, 14], [0, 5]],                 // route du sud
  [[5, -1], [16, -2], [28, -3], [34, -3], [52, -6], [78, -10]],  // route de l'est (pont)
  [[0, -5], [0, -11], [0, -15]],                                 // montée à la chapelle
  [[-5, 2], [-14, 3], [-22, 5], [-27, 8]],                       // chemin de la ferme
  [[-3, -8], [-7, -16], [-11, -23], [-12.6, -25.7]],                 // sentier de la cascade
  [[3, 6], [10, 11], [17, 13]]                                   // ruelle de la maison abandonnée
];
function segDist(x, z, ax, az, bx, bz) { const vx = bx - ax, vz = bz - az; const t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1); return Math.hypot(x - ax - vx * t, z - az - vz * t); }
export function roadDist(x, z) { let d = 1e9; for (const R of ROADS) for (let i = 0; i < R.length - 1; i++) d = Math.min(d, segDist(x, z, R[i][0], R[i][1], R[i + 1][0], R[i + 1][1])); return d; }
export const riverX = z => 31 + Math.sin(z * 0.055) * 5 + Math.sin(z * 0.13) * 1.2;
export function riverD(x, z) { return Math.abs(x - riverX(z)); }
export const BRIDGE = { z: -3, x0: 25.8, x1: 34.4, w: 1.5 };
export const onBridge = (x, z) => Math.abs(z - BRIDGE.z) < BRIDGE.w && x > BRIDGE.x0 && x < BRIDGE.x1;
export const POND = { x: -13, z: -30.5, r: 4.2 };
export const FIELDS = { x0: -40, x1: -24, z0: 12, z1: 30 };
export const inFields = (x, z) => x > FIELDS.x0 && x < FIELDS.x1 && z > FIELDS.z0 && z < FIELDS.z1;
export const VILLAGE_R = 27;
// crevasse cachée derrière la cascade (sol plat au niveau des pierres du gué)
export const CAVE = { x0: -15.2, x1: -10.8, z0: -40.5, z1: -33.4, y: -0.3 };
export const inCave = (x, z) => x > CAVE.x0 && x < CAVE.x1 && z > CAVE.z0 && z < CAVE.z1;
// crochets : hauteurs de marche (planchers, pierres) et zones d'eau franchissables
export const WALK_HOOKS = [], WATER_OK = [];

function rawHeight(x, z) {
  let h = (fbm(x * 0.025 + 7, z * 0.025 - 3, 4) - 0.5) * 5.5;                  // collines
  const r = Math.hypot(x, z * 0.9);
  h = lerp(h, 0.2 + (fbm(x * 0.05, z * 0.05, 2) - 0.5) * 0.6, sstep(VILLAGE_R + 10, VILLAGE_R - 6, r)); // le village est bâti sur un replat
  h += Math.exp(-((x) ** 2 + (z + 16) ** 2) / 30) * 1.4;                         // butte de la chapelle
  if (inFields(x, z) || (x > FIELDS.x0 - 4 && x < FIELDS.x1 + 4 && z > FIELDS.z0 - 4 && z < FIELDS.z1 + 4)) h = lerp(h, 0.25, 0.8);
  // falaise du nord, entaillée par la cascade
  const ridge = sstep(-27, -33, z + Math.sin(x * 0.12) * 1.5) * (7.5 + fbm(x * 0.08, 3) * 3);
  h += ridge * (1 - Math.exp(-((x + 13) ** 2) / 6) * 0.15);
  // bassin de la cascade
  const dp = Math.hypot(x - POND.x, z - POND.z); if (dp < POND.r + 2) h = lerp(h, -1.3, sstep(POND.r + 2, POND.r - 1, dp));
  // crevasse derrière la cascade
  { const kx = sstep(CAVE.x0 - 1.2, CAVE.x0 + 0.3, x) * sstep(CAVE.x1 + 1.2, CAVE.x1 - 0.3, x), kz = sstep(CAVE.z0 - 1, CAVE.z0 + 0.6, z) * sstep(CAVE.z1 + 1.2, CAVE.z1 - 0.2, z); const k = kx * kz; if (k > 0) h = lerp(h, CAVE.y - 0.05, k); }
  // rivière
  const dr = riverD(x, z); if (dr < 5) h = lerp(h, -1.6, sstep(5, 2.2, dr));
  // montagnes au loin
  const R = Math.hypot(x, z); if (R > 62) h += (R - 62) * 0.35 + fbm(x * 0.04, z * 0.04, 3) * (R - 62) * 0.5;
  return h;
}
const roadFlat = (x, z, h) => { const d = roadDist(x, z); return d < 3 ? lerp(h, h * 0.6, sstep(3, 1, d)) : h; };
export function heightAt(x, z) { return roadFlat(x, z, rawHeight(x, z)); }
// hauteur où l'on marche (pont en arc)
export function walkH(x, z) {
  for (const f of WALK_HOOKS) { const v = f(x, z); if (v != null) return v; }
  const h = heightAt(x, z); if (!onBridge(x, z)) return h;
  const t = (x - BRIDGE.x0) / (BRIDGE.x1 - BRIDGE.x0), a = heightAt(BRIDGE.x0, BRIDGE.z), b = heightAt(BRIDGE.x1, BRIDGE.z);
  return Math.max(h, lerp(a, b, t) + Math.sin(t * Math.PI) * 1.1);
}
export const WATER_Y = -0.75;
export const FOGU = { c: { value: new THREE.Color() }, d: { value: 0.01 } };

// ---------------- moteur ----------------
export const view = document.getElementById('view');
export const renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(36, 1, 0.4, 320);
export const MOBILE = matchMedia('(pointer: coarse)').matches;
export const STATE = { pix: true, qual: MOBILE ? 1 : 2, auto: true };
export const time = { value: 0 };
export const U = { // uniforms partagés
  uTime: time, uWind: { value: new THREE.Vector2(1, 0.4) },
  uPS: { value: new THREE.Vector2(0.5, 0.5) }, uPD: { value: 1 }, uRes: { value: new THREE.Vector2(1, 1) }, uOR: { value: 0.1 },
  uSunDir: { value: new THREE.Vector3(0.5, 0.8, 0.3) }, uCloud: { value: 1 }
};

// ---------------- ciel : dégradé, soleil, nuages qui défilent, étoiles ----------------
export const skyU = { top: { value: new THREE.Color('#5d9fe0') }, mid: { value: new THREE.Color('#a9d3f0') }, bot: { value: new THREE.Color('#f3e2c0') }, sunC: { value: new THREE.Color('#fff2cc') }, sunDir: U.uSunDir, uTime: time, night: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(280, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform vec3 top, mid, bot, sunC, sunDir; uniform float uTime, night; varying vec3 vD;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
    float fb(vec2 p){ float a=0.0, s=0.5; for(int i=0;i<4;i++){ a+=n(p)*s; p*=2.1; s*=0.5; } return a; }
    void main(){ float y = vD.y; vec3 c = mix(bot, mid, smoothstep(-0.02, 0.18, y)); c = mix(c, top, smoothstep(0.18, 0.75, y));
      float sd = max(dot(vD, normalize(sunDir)), 0.0); c += sunC * (pow(sd, 400.0) * 3.0 + pow(sd, 12.0) * 0.35) * (1.0 - night);
      vec2 cp = vD.xz / max(y, 0.08) * 1.6 + vec2(uTime * 0.012, uTime * 0.004); float cl = smoothstep(0.48, 0.78, fb(cp)) * smoothstep(0.0, 0.25, y);
      c = mix(c, mix(vec3(1.0, 0.98, 0.95), vec3(0.25, 0.28, 0.38), night) * (0.85 + sd * 0.3), cl * 0.75);
      float st = step(0.9975, h(floor(vD.xz / max(y,0.05) * 90.0))) * night * smoothstep(0.05, 0.4, y); c += vec3(st);
      gl_FragColor = vec4(c, 1.0); }` }));
scene.add(sky);
scene.fog = new THREE.FogExp2('#c8d8d0', 0.0105);
export const hemi = new THREE.HemisphereLight('#dfefff', '#5a6a38', 0.75); scene.add(hemi);
export const sun = new THREE.DirectionalLight('#fff0d4', 2.6); sun.castShadow = true;
sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048); { const c = sun.shadow.camera; c.left = -24; c.right = 24; c.top = 24; c.bottom = -24; c.near = 1; c.far = 140; } sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.06;
scene.add(sun, sun.target); sun.shadow.camera.layers.enable(1);
// objet qui ne sert qu'à projeter une ombre (invisible pour la caméra)
export function shadowOnly(m) { m.layers.set(1); m.castShadow = true; return m; }
export const ambientFill = new THREE.DirectionalLight('#9ec2ff', 0.35); ambientFill.position.set(-30, 20, -10); scene.add(ambientFill); // contre-jour bleuté

// ---------------- heure du jour (cycle continu) ----------------
const KEYS = [ // h : heure ; couleurs et intensités clés
  { h: 0, sun: '#8fa8ff', si: 0.5, hemi: ['#4a5c9a', '#141826', 0.5], fog: '#1c2438', top: '#060a1c', mid: '#18234a', bot: '#2a3658', exp: 1.35, night: 1, d: 0.016 },
  { h: 5.5, sun: '#ff9a6a', si: 0.6, hemi: ['#a090c0', '#2a2430', 0.5], fog: '#9a8aa0', top: '#3a4a88', mid: '#c08aa0', bot: '#ffb08a', exp: 1.15, night: 0.4, d: 0.016 },
  { h: 8, sun: '#ffe2b4', si: 2.3, hemi: ['#d8e8ff', '#5a6038', 0.7], fog: '#d4ddd4', top: '#5a9ae0', mid: '#a8d0f0', bot: '#f6e0bc', exp: 1.0, night: 0, d: 0.011 },
  { h: 13, sun: '#fff4dc', si: 2.7, hemi: ['#e2f0ff', '#5a6a38', 0.8], fog: '#c8d8d0', top: '#4f95e2', mid: '#a9d3f0', bot: '#efe6cc', exp: 1.0, night: 0, d: 0.0095 },
  { h: 18, sun: '#ffb070', si: 2.0, hemi: ['#ffd0a8', '#4a3a30', 0.6], fog: '#e8c0a0', top: '#4a5ca8', mid: '#e0a890', bot: '#ffc080', exp: 1.0, night: 0.05, d: 0.012 },
  { h: 20, sun: '#c070a0', si: 0.5, hemi: ['#7060a8', '#201c2c', 0.5], fog: '#3a3458', top: '#141a40', mid: '#40386a', bot: '#a06878', exp: 1.25, night: 0.7, d: 0.015 },
  { h: 24, sun: '#8fa8ff', si: 0.5, hemi: ['#4a5c9a', '#141826', 0.5], fog: '#1c2438', top: '#060a1c', mid: '#18234a', bot: '#2a3658', exp: 1.35, night: 1, d: 0.016 }
];
export const DAY = { h: 9.5, speed: 24 / 480, auto: true, cur: null }; // un jour complet en 8 minutes
const _ca = new THREE.Color(), _cb = new THREE.Color();
const LC = (a, b, f) => _ca.set(a).lerp(_cb.set(b), f).clone();
export function dayState() {
  const h = DAY.h; let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1].h <= h) i++;
  const A = KEYS[i], B = KEYS[i + 1], f = smooth((h - A.h) / (B.h - A.h));
  return { sun: LC(A.sun, B.sun, f), si: lerp(A.si, B.si, f), hemiS: LC(A.hemi[0], B.hemi[0], f), hemiG: LC(A.hemi[1], B.hemi[1], f), hemiI: lerp(A.hemi[2], B.hemi[2], f), fog: LC(A.fog, B.fog, f),
    top: LC(A.top, B.top, f), mid: LC(A.mid, B.mid, f), bot: LC(A.bot, B.bot, f), exp: lerp(A.exp, B.exp, f), night: lerp(A.night, B.night, f), dens: lerp(A.d, B.d, f) };
}
export function applyDay(px, py, pz) {
  const S = dayState(); DAY.cur = S;
  const a = (DAY.h - 6) / 12 * Math.PI; // le soleil se lève à l'est (6 h) et se couche à l'ouest (18 h)
  const el = Math.max(0.12, Math.sin(a)) * 1.0, az = Math.cos(a);
  const dir = new THREE.Vector3(az * 0.8 + 0.2, el * 1.2 + 0.15, 0.45).normalize();
  if (S.night > 0.6) dir.set(-0.4, 0.9, 0.3).normalize(); // lune
  U.uSunDir.value.copy(dir);
  sun.position.set(px + dir.x * 60, py + dir.y * 60, pz + dir.z * 60); sun.target.position.set(px, py, pz);
  sun.color.copy(S.sun); sun.intensity = S.si; hemi.color.copy(S.hemiS); hemi.groundColor.copy(S.hemiG); hemi.intensity = S.hemiI;
  scene.fog.color.copy(S.fog); scene.fog.density = S.dens; FOGU.c.value.copy(S.fog); FOGU.d.value = S.dens; skyU.top.value.copy(S.top); skyU.mid.value.copy(S.mid); skyU.bot.value.copy(S.bot); skyU.night.value = S.night;
  renderer.toneMappingExposure = S.exp; ambientFill.intensity = 0.35 * (1 - S.night * 0.5);
  sky.position.copy(camera.position);
  return S;
}

// ---------------- collisions ----------------
export const COL = { circles: [], segs: [] };
export function addCircle(x, z, r, kind, ref) { const c = { x, z, r, kind, ref }; COL.circles.push(c); return c; }
export function addSeg(ax, az, bx, bz, kind, th) { const s = { ax, az, bx, bz, kind, th: th || 0.18 }; COL.segs.push(s); return s; }
export function addBox(cx, cz, w, d, rot, kind) { // boîte tournée → 4 segments
  const c = Math.cos(rot), s = Math.sin(rot), P = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, z]) => [cx + x * c + z * s, cz - x * s + z * c]);
  for (let i = 0; i < 4; i++) addSeg(P[i][0], P[i][1], P[(i + 1) % 4][0], P[(i + 1) % 4][1], kind, 0.05);
}
export const SLOPE_MAX = 1.05;
export function blocked(x, z, r, ign) {
  if (Math.hypot(x, z) > 70) return 'bord';
  const wok = WATER_OK.some(w => Math.hypot(w.x - x, w.z - z) < w.r);
  if (!wok && !onBridge(x, z) && riverD(x, z) < 3.1) return 'eau';
  if (!wok && Math.hypot(x - POND.x, z - POND.z) < POND.r - 0.4) return 'eau';
  for (const c of COL.circles) if (c !== ign && !c.off && Math.abs(c.x - x) < c.r + r + 0.1 && Math.hypot(c.x - x, c.z - z) < c.r + r) return c.kind;
  for (const s of COL.segs) if (!s.off && segDist(x, z, s.ax, s.az, s.bx, s.bz) < r + s.th) return s.kind;
  return null;
}
export function slopeOk(x0, z0, x1, z1) { const d = Math.hypot(x1 - x0, z1 - z0) || 0.01, dh = Math.abs(walkH(x1, z1) - walkH(x0, z0)); if (dh < 0.6 && WATER_OK.some(w => Math.hypot(w.x - x1, w.z - z1) < w.r || Math.hypot(w.x - x0, w.z - z0) < w.r)) return true; return dh < 0.3 || dh / d <= SLOPE_MAX; }

// ---------------- matériaux : patch commun (vent, normales douces, découpe devant le héros, fondu proche caméra) ----------------
export function patch(mat, o = {}) {
  mat.customProgramCacheKey = () => 'p' + JSON.stringify(o);
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    if (o.wind) sh.vertexShader = 'uniform float uTime; uniform vec2 uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      {
#ifdef USE_INSTANCING
 vec4 wp0 = instanceMatrix * vec4(0.0,0.0,0.0,1.0);
#else
 vec4 wp0 = modelMatrix * vec4(0.0,0.0,0.0,1.0);
#endif
 float hk = max(position.y - ${(o.windBase ?? 1.5).toFixed(2)}, 0.0) * ${o.wind.toFixed(3)};
        float g = sin(uTime * 1.1 + wp0.x * 0.21 + wp0.z * 0.17) * 0.6 + sin(uTime * 2.7 + wp0.x * 0.9 + position.y * 1.3) * 0.25;
        transformed.x += g * hk * uWind.x; transformed.z += g * hk * uWind.y + cos(uTime * 1.7 + position.x * 2.0) * hk * 0.15; }`);
    if (o.soft) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = 1.0; vec3 normal = normalize(vNormal); vec3 nonPerturbedNormal = normal;');
    if (o.trans) sh.fragmentShader = 'uniform vec3 uSunDir;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      { vec3 vdir = normalize(vViewPosition); vec3 sdv = normalize((viewMatrix * vec4(uSunDir, 0.0)).xyz); float bl = pow(max(dot(vdir, sdv), 0.0), 3.0); gl_FragColor.rgb += diffuseColor.rgb * bl * ${o.trans.toFixed(2)}; }`);
    if (o.cut) sh.fragmentShader = 'uniform vec2 uPS; uniform float uPD; uniform vec2 uRes; uniform float uOR;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      { vec2 q = gl_FragCoord.xy / uRes; vec2 d = (q - uPS) * vec2(uRes.x / uRes.y, 1.0); d.y *= 0.8; float r = length(d);
        float dither = mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0);
        if (gl_FragCoord.z < uPD - 0.0004 && r < uOR) { if (r < uOR * 0.6 || dither < 0.5) discard; }
        ${o.near === false ? '' : 'float cd = length(vViewPosition); if (cd < 2.2) discard;'} }`);
  };
  return mat;
}
export function canvasTex(size, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); draw(x, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat, o.repeat); }
  t.magFilter = o.nearest ? THREE.NearestFilter : THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 2; return t;
}

// ---------------- terrain : couleurs peintes (CPU) + détail, ombres de nuages, herbe et pentes (GPU) ----------------
export function buildTerrain() {
  const SIZE = 150, N = MOBILE ? 180 : 230;
  const g = new THREE.PlaneGeometry(SIZE, SIZE, N, N); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), wet = new Float32Array(p.count);
  const C = h => new THREE.Color(h);
  const G1 = C('#5b8d35'), G2 = C('#7fae46'), G3 = C('#4a7a2c'), G4 = C('#a8c25e'), MOSS = C('#3e6a2c'), DIRT = C('#9a7448'), DIRT2 = C('#b58e5c'), ROCK = C('#8c877c'), ROCK2 = C('#6e6a64'), SAND = C('#cdb98a'), SOIL = C('#6a4a2c'), WHEAT = C('#d4b45a');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), h = heightAt(x, z); p.setY(i, h);
    const n1 = fbm(x * 0.09, z * 0.09, 3), n2 = vnoise(x * 0.5, z * 0.5), n3 = fbm(x * 0.02 + 40, z * 0.02, 2);
    const c = G1.clone().lerp(G2, sstep(0.35, 0.7, n1)).lerp(G3, sstep(0.55, 0.85, n2) * 0.6).lerp(G4, sstep(0.6, 0.8, n3) * 0.7);
    const forest = sstep(VILLAGE_R + 4, VILLAGE_R + 14, Math.hypot(x, z)) * (inFields(x, z) ? 0 : 1); c.lerp(MOSS, forest * 0.55);
    const rd = roadDist(x, z); if (rd < 2.6) { const k = sstep(2.6, 0.9 + n2 * 0.7, rd); c.lerp(n1 > 0.5 ? DIRT2 : DIRT, k); }
    if (inFields(x, z)) { const row = Math.sin(x * 2.2) * 0.5 + 0.5; c.lerp(z > 21 ? WHEAT : SOIL, 0.75).lerp(z > 21 ? C('#c0a040') : C('#4c7a2c'), row * 0.35); }
    const dr = riverD(x, z), dp = Math.hypot(x - POND.x, z - POND.z); if (dr < 4.8 || dp < POND.r + 1.6) { const k = Math.max(sstep(4.8, 3.2, dr), sstep(POND.r + 1.6, POND.r, dp)); c.lerp(SAND, k * 0.85); wet[i] = k; }
    if (inCave(x, z)) c.lerp(ROCK2, 0.85);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('wet', new THREE.BufferAttribute(wet, 1)); g.computeVertexNormals();
  { const nr = g.attributes.normal; for (let i = 0; i < p.count; i++) { const k = sstep(0.18, 0.42, 1 - nr.getY(i)); if (k > 0) { const n = vnoise(p.getX(i) * 0.6, p.getY(i) * 0.9); const R = ROCK.clone().lerp(ROCK2, n); col[i * 3] = lerp(col[i * 3], R.r, k); col[i * 3 + 1] = lerp(col[i * 3 + 1], R.g, k); col[i * 3 + 2] = lerp(col[i * 3 + 2], R.b, k); } } }
  // texture de touche peinte (répétée) : brins, cailloux, taches de lumière
  const detail = canvasTex(256, (x, S) => { x.fillStyle = '#d0d0d0'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 2600; i++) { const v = 150 + Math.floor(rnd() * 105); x.strokeStyle = `rgb(${v},${v},${v})`; x.lineWidth = 1 + rnd(); const px = rnd() * S, py = rnd() * S; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 3, py - 2 - rnd() * 5); x.stroke(); }
    for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${90 + rnd() * 40},${90 + rnd() * 40},${90 + rnd() * 40},.5)`; x.beginPath(); x.ellipse(rnd() * S, rnd() * S, 1 + rnd() * 2.5, 1 + rnd() * 1.6, rnd() * 3, 0, 6.3); x.fill(); } }, { repeat: 48 });
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, map: detail });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute float wet; varying float vWet; varying vec3 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWet = wet; vWP = (modelMatrix * vec4(position,1.0)).xyz;');
    sh.fragmentShader = 'uniform float uTime; uniform float uCloud; varying float vWet; varying vec3 vWP;\n float th(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }\n float tn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(th(i),th(i+vec2(1,0)),f.x), mix(th(i+vec2(0,1)),th(i+vec2(1,1)),f.x), f.y); }\n' +
      sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        { float big = tn(vWP.xz * 0.11) * 0.6 + tn(vWP.xz * 0.37) * 0.4; diffuseColor.rgb *= 0.86 + big * 0.28;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.78, 0.82, 0.86), vWet * 0.35); }`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        { float cl = smoothstep(0.35, 0.75, tn(vWP.xz * 0.025 + vec2(uTime * 0.018, uTime * 0.007)) * 0.7 + tn(vWP.xz * 0.06 - uTime * 0.01) * 0.3); reflectedLight.directDiffuse *= 1.0 - cl * 0.45 * uCloud; }`);
  };
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m); return m;
}

// ---------------- eau : rivière, bassin et cascade (dégradé de profondeur, écume, reflets du ciel) ----------------
export function buildWater() {
  const mat = new THREE.ShaderMaterial({ transparent: true, fog: false, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uSky: { value: new THREE.Color('#a9d3f0') }, uSunDir: { value: new THREE.Vector3() }, uNight: { value: 0 }, uFogC: FOGU.c, uFogD: FOGU.d },
    vertexShader: `attribute float edge; varying float vE; varying vec3 vWP;
      void main(){ vE = edge; vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform float uTime, uNight, uFogD; uniform vec3 uSky, uSunDir, uFogC; varying float vE; varying vec3 vWP;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){
        vec2 p = vWP.xz; float t = uTime;
        float w1 = n(p * 1.3 + vec2(t * 0.35, t * 0.9)), w2 = n(p * 2.7 - vec2(t * 0.5, t * 0.3)), w = w1 * 0.6 + w2 * 0.4;
        vec3 deep = vec3(0.004, 0.018, 0.03), shallow = vec3(0.012, 0.06, 0.065);
        vec3 c = mix(shallow, deep, smoothstep(0.0, 0.8, vE));
        vec3 V = normalize(cameraPosition - vWP); float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0);
        c = mix(c, uSky * 0.5, 0.08 + fres * 0.3);
        vec3 nrm = normalize(vec3((w1 - 0.5) * 0.22, 1.0, (w2 - 0.5) * 0.22)); vec3 R = reflect(-V, nrm);
        float sp = pow(max(dot(R, normalize(uSunDir)), 0.0), 220.0) * (1.0 - uNight * 0.8); c += vec3(1.0, 0.92, 0.8) * sp * 1.4;
        float foam = smoothstep(0.16, 0.0, vE) * (0.35 + 0.65 * smoothstep(0.5, 0.85, w)); c = mix(c, vec3(0.45, 0.55, 0.55), foam * 0.6);
        float streak = smoothstep(0.78, 0.92, n(vec2(p.x * 0.6, p.y * 3.0 + t * 2.0))) * 0.035 * smoothstep(0.2, 0.6, vE); c += streak;
        c *= mix(1.0, 0.35, uNight);
        float fd = length(cameraPosition - vWP); c = mix(c, uFogC, 1.0 - exp(-uFogD * uFogD * fd * fd));
        gl_FragColor = vec4(c, mix(0.78, 0.95, smoothstep(0.0, 0.5, vE)));
      }` });
  // ruban de rivière, attribut « edge » : 0 sur la berge, 1 au centre
  const pos = [], edg = [], idx = []; const N = 160;
  for (let i = 0; i <= N; i++) { const z = -75 + i * 150 / N, cx = riverX(z); for (let j = 0; j <= 10; j++) { const u = j / 10 * 2 - 1; pos.push(cx + u * 3.6, WATER_Y, z); edg.push(Math.min(1, (1 - Math.abs(u)) * 1.6)); } if (i < N) for (let j = 0; j < 10; j++) { const a = i * 11 + j, b = a + 11; idx.push(a, b, a + 1, a + 1, b, b + 1); } }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('edge', new THREE.Float32BufferAttribute(edg, 1)); rg.setIndex(idx);
  const river = new THREE.Mesh(rg, mat); river.renderOrder = 2; scene.add(river);
  // bassin
  const pg = new THREE.CircleGeometry(POND.r + 0.6, 40); pg.rotateX(-Math.PI / 2); const pe = []; const pp = pg.attributes.position; for (let i = 0; i < pp.count; i++) pe.push(1 - Math.hypot(pp.getX(i), pp.getZ(i)) / (POND.r + 0.6));
  pg.setAttribute('edge', new THREE.Float32BufferAttribute(pe, 1)); const pond = new THREE.Mesh(pg, mat); pond.position.set(POND.x, WATER_Y + 0.15, POND.z); pond.renderOrder = 2; scene.add(pond);
  // cascade : rideau d'eau animé + brume au pied
  const fallMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, uniforms: { uTime: { value: 0 }, uFade: { value: 1 }, uFogC: FOGU.c, uFogD: FOGU.d },
    vertexShader: 'varying vec2 vUv; varying vec3 vWP; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: `uniform float uTime, uFade, uFogD; uniform vec3 uFogC; varying vec2 vUv; varying vec3 vWP;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){ float s = n(vec2(vUv.x * 14.0, vUv.y * 3.0 + uTime * 3.2)) * 0.6 + n(vec2(vUv.x * 30.0, vUv.y * 6.0 + uTime * 5.0)) * 0.4;
        vec3 c = mix(vec3(0.07, 0.22, 0.3), vec3(0.75, 0.85, 0.9), smoothstep(0.4, 0.85, s));
        float a = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x) * (0.3 + smoothstep(0.3, 0.9, s) * 0.6) * smoothstep(0.0, 0.08, vUv.y);
        float fd = length(cameraPosition - vWP); c = mix(c, uFogC, 1.0 - exp(-uFogD * uFogD * fd * fd));
        gl_FragColor = vec4(c, a * uFade);
      }` });
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 9, 1, 8), fallMat); fall.position.set(POND.x, 3.7, POND.z - 3.75); fall.rotation.x = -0.18; scene.add(fall);
  return { mat, fallMat, river, pond, fall };
}

// ---------------- post-traitement : contours pixel, halo lumineux, étalonnage, vignette, palette ----------------
export const POST = {};
export function buildPost() {
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(4, 4) });
  rt.texture.minFilter = rt.texture.magFilter = THREE.LinearFilter; rt.depthTexture.type = THREE.UnsignedIntType;
  const mat = new THREE.ShaderMaterial({ toneMapped: true, depthTest: false, depthWrite: false,
    uniforms: { tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, uRes: { value: new THREE.Vector2(4, 4) }, uNear: { value: camera.near }, uFar: { value: camera.far }, uPix: { value: 1 }, uLevels: { value: 30 }, uNight: { value: 0 }, uWarm: { value: 1 }, uDof: { value: 0 }, uFocus: { value: 10 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 uRes; uniform float uNear, uFar, uPix, uLevels, uNight, uWarm, uDof, uFocus; varying vec2 vUv;
      float lin(float d) { float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
      vec3 bright(vec2 uv){ vec3 c = texture2D(tColor, uv).rgb; float l = dot(c, vec3(0.299,0.587,0.114)); return c * smoothstep(0.85, 1.6, l); }
      void main() {
        vec2 px = 1.0 / uRes; vec3 c = texture2D(tColor, vUv).rgb; float d = lin(texture2D(tDepth, vUv).r);
        // profondeur de champ légère (caméra oblique du jeu) : l'arrière-plan lointain se fond, le premier plan reste net
        if (uDof > 0.01) { float bk = smoothstep(uFocus + 6.0, uFocus + 36.0, d) * uDof; if (bk > 0.02) { vec3 s = c; float r = 1.6 * bk;
          s += texture2D(tColor, vUv + vec2(px.x, 0.0) * r).rgb + texture2D(tColor, vUv - vec2(px.x, 0.0) * r).rgb + texture2D(tColor, vUv + vec2(0.0, px.y) * r).rgb + texture2D(tColor, vUv - vec2(0.0, px.y) * r).rgb;
          s += texture2D(tColor, vUv + px * r).rgb + texture2D(tColor, vUv - px * r).rgb + texture2D(tColor, vUv + vec2(px.x, -px.y) * r).rgb + texture2D(tColor, vUv + vec2(-px.x, px.y) * r).rgb;
          c = mix(c, s / 9.0, min(1.0, bk * 1.2)); } }
        // contour d'une couleur (silhouettes), seulement en mode Pixel 3D et pas au loin
        if (uPix > 0.5) {
          float dn = lin(texture2D(tDepth, vUv + vec2(0.0, px.y)).r), ds = lin(texture2D(tDepth, vUv - vec2(0.0, px.y)).r), de = lin(texture2D(tDepth, vUv + vec2(px.x, 0.0)).r), dw = lin(texture2D(tDepth, vUv - vec2(px.x, 0.0)).r);
          float edge = step(0.05 * d + 0.2, max(max(dn, ds), max(de, dw)) - d) * (1.0 - smoothstep(28.0, 60.0, d));
          c = mix(c, c * vec3(0.30, 0.28, 0.34), edge * 0.85);
        }
        // halo des lumières vives (lanternes, soleil sur l'eau, feu)
        vec3 b = vec3(0.0); float k = 0.0;
        for (int i = -3; i <= 3; i++) for (int j = -3; j <= 3; j++) { if (abs(float(i)) + abs(float(j)) > 4.0) continue; vec2 o = vec2(float(i), float(j)) * px * 2.0; float w = 1.0 / (1.0 + float(i*i + j*j)); b += bright(vUv + o) * w; k += w; }
        c += b / k * (0.55 + uNight * 0.6);
        // étalonnage : ombres légèrement bleutées, lumières chaudes, saturation
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(l), c, 1.12 + uWarm * 0.06);
        c *= mix(vec3(0.94, 0.97, 1.06), vec3(1.05, 1.0, 0.92), smoothstep(0.05, 0.9, l));
        // brume de profondeur un peu plus colorée au loin
        float v = length((vUv - 0.5) * vec2(1.1, 1.0)); c *= 1.0 - smoothstep(0.45, 0.95, v) * 0.32;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        if (uPix > 0.5) gl_FragColor.rgb = floor(gl_FragColor.rgb * uLevels + 0.5) / uLevels;
      }` });
  const sc = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  Object.assign(POST, { rt, mat, sc, cam });
}
export function resize() {
  const w = innerWidth, h = innerHeight, asp = h / w; let ih = STATE.pix ? [216, 252, 300][STATE.qual] : Math.min(h * devicePixelRatio, [540, 720, 1000][STATE.qual]); if (STATE.pix && asp > 1) ih = Math.round(ih * Math.min(2, asp * 0.8));
  const iw = Math.round(ih * w / h); renderer.setPixelRatio(1); renderer.setSize(iw, ih, false); view.style.width = w + 'px'; view.style.height = h + 'px';
  camera.aspect = w / h; camera.updateProjectionMatrix(); view.style.imageRendering = STATE.pix ? 'pixelated' : 'auto';
  if (POST.rt) { POST.rt.setSize(iw, ih); POST.mat.uniforms.uRes.value.set(iw, ih); POST.rt.texture.magFilter = POST.rt.texture.minFilter = STATE.pix ? THREE.NearestFilter : THREE.LinearFilter; }
  U.uRes.value.set(iw, ih);
  const sm = [1024, 1536, 2048][STATE.qual]; if (sun.shadow.mapSize.x !== sm) { sun.shadow.mapSize.set(sm, sm); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
}
let frameN = 0;
export function render() {
  frameN++; renderer.shadowMap.autoUpdate = STATE.qual > 0; if (STATE.qual === 0) renderer.shadowMap.needsUpdate = frameN % 2 === 0;
  POST.mat.uniforms.uPix.value = STATE.pix ? 1 : 0; POST.mat.uniforms.uNight.value = DAY.cur ? DAY.cur.night : 0;
  renderer.setRenderTarget(POST.rt); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(POST.sc, POST.cam);
}
