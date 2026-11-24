// =====================================================================
//  VÉLORNE 3D — DÉCORS PROPRES À CHAQUE RÉGION
//  En plus des décors du jeu (un modèle 3D par type), chaque région reçoit des éléments 3D qui portent son identité.
//  Ils sont posés de façon déterministe, seulement sur les cases libres, hors chemins et hors eau.
//  Ils ne gênent pas le passage : les éléments hauts se trouvent seulement sur les cases déjà bloquées par le jeu.
//  Cratère de Cendrefeu et cavernes de lave (en premier) : coulées refroidies aux fissures rougeoyantes, cheminées
//  fumantes, orgues de basalte, pics d'obsidienne, arbres calcinés, fumerolles.
//  Puis : désert (dunes, ossements, colonnes ensablées), marais (pilotis, souches, racines, roseaux), cimes (congères,
//  pics de glace), jungle (fougères géantes, lianes), cristal (amas lumineux), citadelle et terres corrompues (épines
//  noires, ronces), ruines et temple (colonnes brisées), côte et archipel (rochers à algues), aether (îlots flottants).
// =====================================================================
import { THREE, scene, MOBILE, time } from '../assets/demo/v4/core.js';
import { mergeGeos, shade, NATURE_MAT } from '../assets/demo/v4/nature.js';
import { HOOK, groundH } from './world3d.js';
import { MAGIC3D } from './magic3d.js';

const B = (w, h, d, x, y, z, col, ry = 0, rx = 0, rz = 0, low = 0.8) => shade(new THREE.BoxGeometry(w, h, d).rotateX(rx).rotateZ(rz).rotateY(ry).translate(x, y, z), col, low);
const Cy = (rt, rb, h, seg, x, y, z, col, low = 0.8) => shade(new THREE.CylinderGeometry(rt, rb, h, seg).translate(x, y, z), col, low);
const Co = (r, h, seg, x, y, z, col, rx = 0, rz = 0, low = 0.7) => shade(new THREE.ConeGeometry(r, h, seg).rotateX(rx).rotateZ(rz).translate(x, y, z), col, low);
const Ic = (r, x, y, z, col, sx = 1, sy = 1, sz = 1, det = 0) => shade(new THREE.IcosahedronGeometry(r, det).scale(sx, sy, sz).translate(x, y, z), col, 0.75);
let seed = 1; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const RR = (a, b) => a + R() * (b - a);

// matériaux propres aux régions
const M = {
  solid: NATURE_MAT && NATURE_MAT.rock ? NATURE_MAT.rock : new THREE.MeshLambertMaterial({ vertexColors: true }),
  lavaGlow: new THREE.MeshBasicMaterial({ color: '#ff5a10', toneMapped: false }),
  obsidian: new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#ff3a00', emissiveIntensity: 0.08 }),
  crystal: new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#7a5aff', emissiveIntensity: 0.6, transparent: true, opacity: 0.92 }),
  ice: new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#6ab0ff', emissiveIntensity: 0.12, transparent: true, opacity: 0.9 }),
  plant: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  float: new THREE.MeshLambertMaterial({ vertexColors: true }),
};
// --- générateurs : chacun renvoie { solid: [], glow: [], obs: [], cry: [], ice: [], plant: [] } en coordonnées locales ---
const G = {
  // Cendrefeu
  coulee(o) { // coulée refroidie : dalles de basalte bombées, fissures de lave
    const r = RR(1.6, 3); for (let i = 0; i < 6; i++) { const a = R() * 6.28, d = R() * r; o.solid.push(Ic(RR(0.5, 1.1), Math.cos(a) * d, 0.02, Math.sin(a) * d, '#2a1e1a', 1.4, 0.18, 1.2)); }
    for (let i = 0; i < 5; i++) { const a = R() * 6.28, d = R() * r * 0.8; o.glow.push(new THREE.BoxGeometry(RR(0.6, 1.6), 0.03, 0.07).rotateY(R() * 3).translate(Math.cos(a) * d, 0.1, Math.sin(a) * d)); }
    o.fx.push(['embre', 0, 0.2, 0, 1.2]);
  },
  cheminee(o) { // cheminée volcanique : cône de basalte creux, bouche rougeoyante, fumée et braises
    const h = RR(1.6, 3); o.solid.push(Co(RR(0.9, 1.3), h, 7, 0, h / 2, 0, '#3a2a24'), Cy(0.38, 0.5, 0.2, 7, 0, h - 0.05, 0, '#1a1210'));
    o.glow.push(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 7).translate(0, h - 0.02, 0)); o.fx.push(['fumee', 0, h, 0, 3], ['embre', 0, h, 0, 3]); o.tall = true;
  },
  basalte(o) { // orgues de basalte : colonnes hexagonales serrées
    const n = 5 + Math.floor(R() * 6); for (let i = 0; i < n; i++) { const a = R() * 6.28, d = R() * 0.9, h = RR(0.8, 2.8); o.solid.push(Cy(0.28, 0.3, h, 6, Math.cos(a) * d, h / 2, Math.sin(a) * d, '#3a3434')); } o.tall = true;
  },
  obsidienne(o) { const n = 3 + Math.floor(R() * 4); for (let i = 0; i < n; i++) { const a = R() * 6.28, d = R() * 0.6, h = RR(0.8, 2.2); o.obs.push(Co(RR(0.15, 0.3), h, 4, Math.cos(a) * d, h / 2, Math.sin(a) * d, '#1a1424', RR(-0.25, 0.25), RR(-0.25, 0.25))); } o.tall = true; },
  calcine(o) { const h = RR(1.8, 3); o.solid.push(Cy(0.06, 0.16, h, 5, 0, h / 2, 0, '#1e1614')); for (let i = 0; i < 4; i++) { const y = h * RR(0.45, 0.9), a = R() * 6.28; o.solid.push(Cy(0.02, 0.05, RR(0.6, 1.1), 4, 0, 0, 0, '#1e1614').rotateZ(RR(0.6, 1.1)).rotateY(a).translate(0, y, 0)); } o.tall = true; },
  fumerolle(o) { o.solid.push(Ic(0.35, 0, 0.05, 0, '#5a4a30', 1.6, 0.25, 1.2)); o.glow.push(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 6).translate(0, 0.12, 0)); o.fx.push(['vapeur', 0, 0.2, 0, 2.5]); },
  // désert
  dune(o) { o.solid.push(Ic(RR(1.5, 3), 0, -0.2, 0, '#d8b070', 1.6, RR(0.25, 0.45), 1)); },
  ossements(o) { o.solid.push(Cy(0.04, 0.06, 1.6, 5, 0, 0.06, 0, '#e8dcc0').rotateZ(1.57)); for (let i = 0; i < 6; i++) o.solid.push(Cy(0.03, 0.03, 0.9, 4, -0.6 + i * 0.24, 0.35, 0, '#e8dcc0').rotateX(0.5)); o.solid.push(Ic(0.22, 0.95, 0.18, 0, '#e8dcc0', 1.2, 0.9, 1)); },
  colonne_sable(o) { const h = RR(1.2, 2.6); o.solid.push(Cy(0.3, 0.34, h, 8, 0, h / 2 - 0.3, 0, '#c8a878'), B(0.8, 0.2, 0.8, 0, h - 0.2, 0, '#b89868')); o.tall = true; },
  // marais
  pilotis(o) { for (let i = 0; i < 6; i++) { const x = (i % 3) * 0.9 - 0.9, z = Math.floor(i / 3) * 1.1 - 0.5, h = RR(0.8, 1.4); o.solid.push(Cy(0.07, 0.09, h, 5, x, h / 2 - 0.2, z, '#4a3a24')); } o.solid.push(B(2.4, 0.08, 1.6, 0, 1.0, 0, '#5a4a30', R() * 0.2)); o.tall = true; },
  souche_marais(o) { o.solid.push(Cy(0.3, 0.5, 0.7, 7, 0, 0.3, 0, '#3a3020')); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; o.solid.push(Cy(0.04, 0.08, 0.9, 4, 0, 0, 0, '#3a3020').rotateZ(1.1).rotateY(a).translate(Math.cos(a) * 0.35, 0.15, Math.sin(a) * 0.35)); } o.plant.push(B(0.5, 0.6, 0.02, 0.2, 0.6, 0.2, '#5a6a3a', R() * 3)); },
  roseaux(o) { for (let i = 0; i < 14; i++) { const a = R() * 6.28, d = R() * 0.7, h = RR(0.7, 1.4); o.plant.push(B(0.03, h, 0.03, Math.cos(a) * d, h / 2, Math.sin(a) * d, '#6a7a3a', 0, RR(-0.15, 0.15), RR(-0.15, 0.15))); } },
  // cimes
  congere(o) { o.solid.push(Ic(RR(0.8, 1.6), 0, -0.1, 0, '#f0f4fa', 1.5, RR(0.3, 0.5), 1, 1)); },
  pic_glace(o) { const n = 3 + Math.floor(R() * 3); for (let i = 0; i < n; i++) { const a = R() * 6.28, d = R() * 0.5, h = RR(0.8, 2); o.ice.push(Co(RR(0.12, 0.25), h, 5, Math.cos(a) * d, h / 2, Math.sin(a) * d, '#cfe8ff', RR(-0.2, 0.2), RR(-0.2, 0.2))); } o.tall = true; },
  // jungle
  fougere_geante(o) { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; o.plant.push(B(0.35, 0.02, 1.5, 0, 0, 0.75, '#3a7a2a').rotateX(-0.5).rotateY(a).translate(0, 0.25, 0)); } },
  lianes(o) { const h = RR(2, 3); for (let i = 0; i < 4; i++) o.plant.push(B(0.03, h, 0.03, RR(-0.5, 0.5), h / 2, RR(-0.5, 0.5), '#3a6a24')); o.solid.push(Cy(0.18, 0.24, h + 0.4, 6, 0, (h + 0.4) / 2, 0, '#4a3a24')); o.tall = true; },
  // cristal
  amas_cristal(o) { const n = 4 + Math.floor(R() * 5); for (let i = 0; i < n; i++) { const a = R() * 6.28, d = R() * 0.5, h = RR(0.4, 1.4); o.cry.push(Co(RR(0.1, 0.22), h, 5, Math.cos(a) * d, h / 2, Math.sin(a) * d, ['#c8a8ff', '#8ae8ff', '#e8a8ff'][i % 3], RR(-0.4, 0.4), RR(-0.4, 0.4))); } o.fx.push(['eclat', 0, 0.8, 0, 0.6]); },
  // citadelle, terres corrompues, ombres
  epines(o) { const n = 4 + Math.floor(R() * 4); for (let i = 0; i < n; i++) { const a = R() * 6.28, d = R() * 0.7, h = RR(0.6, 1.8); o.obs.push(Co(RR(0.06, 0.14), h, 4, Math.cos(a) * d, h / 2, Math.sin(a) * d, '#2a1a2a', RR(-0.5, 0.5), RR(-0.5, 0.5))); } },
  ronces(o) { for (let i = 0; i < 6; i++) { const a = R() * 6.28; o.solid.push(Cy(0.03, 0.05, 1.2, 4, 0, 0, 0, '#3a1a2a').rotateZ(RR(0.9, 1.3)).rotateY(a).translate(0, 0.3, 0)); } o.solid.push(Ic(0.35, 0, 0.2, 0, '#4a2a3a', 1.4, 0.6, 1.4)); },
  // ruines, temple, mines
  colonne_brisee(o) { const h = RR(0.6, 2.2); o.solid.push(Cy(0.3, 0.32, h, 8, 0, h / 2, 0, '#9a948a'), B(0.9, 0.25, 0.9, 0, 0.12, 0, '#8a847a')); if (R() < 0.6) o.solid.push(Cy(0.3, 0.3, 1.2, 8, 0, 0, 0, '#9a948a').rotateZ(1.57).translate(0.9, 0.3, 0.4)); o.tall = h > 1.2; },
  // côte, archipel, fjord
  rocher_algues(o) { o.solid.push(Ic(RR(0.5, 1), 0, 0.2, 0, '#6a6a64', 1.2, 0.7, 1, 1)); o.plant.push(B(0.6, 0.03, 0.4, 0.3, 0.35, 0.2, '#3a6a3a', R() * 3)); },
  // aether
  ilot(o) { const y = RR(3, 6); o.float.push(Co(RR(0.8, 1.4), RR(1.2, 2), 6, 0, y - 0.7, 0, '#8a7a6a', Math.PI), Cy(1.1, 1.1, 0.25, 7, 0, y, 0, '#6a9a5a')); o.fx.push(['eclat', 0, y, 0, 0.5]); o.anim = y; },
};
// répartition par région : [générateur, densité pour 100 cases libres]
const MIX = {
  volcan: [['coulee', 1.6], ['cheminee', 0.5], ['basalte', 0.6], ['obsidienne', 0.6], ['calcine', 0.5], ['fumerolle', 0.7]],
  lave: [['coulee', 2.0], ['cheminee', 0.4], ['basalte', 0.8], ['obsidienne', 0.8], ['fumerolle', 0.6]],
  desert: [['dune', 1.2], ['ossements', 0.25], ['colonne_sable', 0.2]],
  oasis: [['dune', 0.5], ['roseaux', 0.6]],
  marais: [['pilotis', 0.2], ['souche_marais', 0.8], ['roseaux', 1.6]],
  jungle: [['fougere_geante', 1.6], ['lianes', 0.5]],
  neige: [['congere', 1.3], ['pic_glace', 0.4]], monts: [['congere', 0.6], ['pic_glace', 0.3]], hurlevents: [['congere', 1.0], ['pic_glace', 0.5]], fjord: [['congere', 0.6], ['rocher_algues', 0.5]],
  cristal: [['amas_cristal', 1.6]],
  citadelle: [['epines', 0.7], ['colonne_brisee', 0.3]], corrompues: [['ronces', 1.0], ['epines', 0.5]], ombres: [['epines', 0.6], ['ronces', 0.4]],
  ruins: [['colonne_brisee', 0.6]], temple: [['colonne_brisee', 0.8]], mines: [['basalte', 0.3]],
  cote: [['rocher_algues', 0.8]], archipel: [['rocher_algues', 0.7]],
  aether: [['ilot', 0.25]],
};
const FX = []; // émetteurs d'ambiance posés (fumée, braises, vapeur, éclats)
const FXS = {
  fumee: { g: -0.9, sp: 0.25, sw: 0.3, sz: 0.5, life: 4, col2: '#2a2422', shape: 0 },
  embre: { g: -1.4, sp: 0.6, sz: 0.08, life: 2.2, col2: '#ffe08a', flick: 1, shape: 0 },
  vapeur: { g: -0.8, sp: 0.2, sz: 0.35, life: 2.5, col2: '#ffffff', shape: 0 },
  eclat: { g: -0.2, sp: 0.15, sz: 0.08, life: 2, col2: '#ffffff', flick: 1, shape: 2 },
};
const FXC = { fumee: '#5a524c', embre: '#ff7a2a', vapeur: '#d8d4cc', eclat: '#c8a8ff' };

HOOK.decor = function (ch, x0, z0, CH, zoneOf) {
  const zid = zoneOf(x0 + CH / 2, z0 + CH / 2); const mix = MIX[zid]; if (!mix) return;
  for (let q = FX.length - 1; q >= 0; q--) if (FX[q].ch === ch.i + ',' + ch.j) FX.splice(q, 1);
  const k = MOBILE ? 0.7 : 1; seed = (ch.i * 7919 + ch.j * 104729) % 2147483646 + 1;
  const acc = { solid: [], glow: [], obs: [], cry: [], ice: [], plant: [], float: [] }; let n = 0;
  for (let tz = z0; tz < z0 + CH; tz++) for (let tx = x0; tx < x0 + CH; tx++) {
    if (zoneOf(tx, tz) !== zid || (HOOK.mask && HOOK.mask(tx, tz))) continue;
    for (const [gen, dens] of mix) {
      if (R() * 100 > dens * k) continue;
      const solidTile = isSolidTile(tx, tz), t = vget(tx, tz);
      if (t === T_WATER || (typeof T_PATH !== 'undefined' && t === T_PATH)) continue;
      const o = { solid: [], glow: [], obs: [], cry: [], ice: [], plant: [], float: [], fx: [], tall: false };
      G[gen](o);
      if (o.tall && !solidTile && gen !== 'ilot') continue; // les éléments hauts ne se posent que sur des cases déjà bloquées
      if (!o.tall && solidTile) continue; // les éléments bas, sur des cases praticables (ils ne bloquent rien)
      const x = tx + 0.5 + RR(-0.3, 0.3), z = tz + 0.5 + RR(-0.3, 0.3), y = groundH(x, z), ry = R() * 6.28, s = RR(0.8, 1.2);
      const mtx = new THREE.Matrix4().makeRotationY(ry).premultiply(new THREE.Matrix4().makeScale(s, s, s)).setPosition(x, y, z);
      for (const key of Object.keys(acc)) for (const gg of o[key]) { gg.applyMatrix4(mtx); acc[key].push(gg); }
      for (const f of o.fx) FX.push({ type: f[0], x: x + f[1], y: y + f[2] * s, z: z + f[3], rate: f[4], ch: ch.i + ',' + ch.j, acc: R() });
      n++; break;
    }
  }
  const mats = { solid: M.solid, glow: M.lavaGlow, obs: M.obsidian, cry: M.crystal, ice: M.ice, plant: M.plant, float: M.float };
  for (const key of Object.keys(acc)) {
    if (!acc[key].length) continue;
    const list = key === 'glow' ? acc[key].map(g => { g.deleteAttribute && g.deleteAttribute('color'); return g; }) : acc[key];
    let geo; try { geo = mergeGeos(list); } catch (e) { continue; } geo.userData.own = true;
    const mesh = new THREE.Mesh(geo, mats[key]); mesh.castShadow = key !== 'glow' && key !== 'plant'; mesh.receiveShadow = key !== 'glow'; ch.group.add(mesh);
  }
  ch.decorN = n;
};
// émetteurs d'ambiance des décors proches (fumée des cheminées, braises, vapeur des fumerolles, éclats des cristaux)
export function updateRegionDecor(dt, look) {
  for (let i = FX.length - 1; i >= 0; i--) {
    const f = FX[i]; const dx = f.x - look.x, dz = f.z - look.z; if (dx * dx + dz * dz > 30 * 30) { if (dx * dx + dz * dz > 120 * 120) FX.splice(i, 1); continue; }
    f.acc += dt * f.rate * (MOBILE ? 0.6 : 1);
    while (f.acc > 1) { f.acc--; MAGIC3D.emit('amb', f.x + (Math.random() - 0.5) * 0.3, f.y, f.z + (Math.random() - 0.5) * 0.3, { S: FXS[f.type], col: FXC[f.type], cx: f.x, cz: f.z }); }
  }
}
