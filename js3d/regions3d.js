// =====================================================================
//  VÉLORNE 3D — ATMOSPHÈRE DES RÉGIONS
//  Chaque région du jeu a sa lumière, son brouillard, son ciel et ses particules d'ambiance en 3D, appliqués par-dessus le
//  cycle jour/nuit (transitions douces quand on passe d'une région à l'autre). Identités tirées des noms et descriptions
//  des régions du jeu ; réglages fins : PROPOSITION.
// =====================================================================
import { THREE, scene, hemi, sun, skyU, FOGU, renderer, DAY, MOBILE } from '../assets/demo/v4/core.js';
import { MAGIC3D } from './magic3d.js';
import { groundH } from './world3d.js';

const R = (a, b) => a + Math.random() * (b - a);
// particules d'ambiance (mêmes moteurs que la magie)
const A = {
  embre: { g: -1.3, sp: 0.5, sz: 0.09, life: 3.2, col2: '#ffe08a', flick: 1, shape: 0 },
  cendre: { g: 0.35, sp: 0.3, sw: 0.4, sz: 0.07, life: 5, col2: '#3a3434', shape: 1 },
  spore: { g: -0.15, sp: 0.25, sw: 0.6, sz: 0.06, life: 5, col2: '#ffffff', flick: 0.6, shape: 0 },
  luciole: { g: -0.05, sp: 0.5, jit: 0.15, sz: 0.07, life: 4, col2: '#fff9b0', flick: 1, shape: 0 },
  poussiere: { g: 0.05, sp: 1.6, sz: 0.06, life: 3, col2: '#ffe2b0', shape: 1 },
  eclat: { g: -0.2, sp: 0.15, sz: 0.08, life: 2.4, col2: '#ffffff', flick: 1, shape: 2 },
  brume: { g: -0.05, sp: 0.2, sz: 0.5, life: 6, col2: '#ffffff', shape: 0 },
  feuille: { g: 0.6, sp: 0.6, sw: 1.2, sz: 0.1, life: 5, col2: '#c8a040', shape: 1 },
  ame: { g: -0.4, sp: 0.2, sw: 1.0, sz: 0.09, life: 4, col2: '#ffffff', flick: 0.5, shape: 0 },
  embrun: { g: 1.0, sp: 0.8, sz: 0.07, life: 2, col2: '#ffffff', shape: 0 },
};
// fog : teinte du brouillard · fk : force du mélange · dens : multiplicateur de densité · hemi/ground : lumière d'ambiance
// sun : teinte du soleil · exp : exposition · sky : [haut, milieu, bas] · p : [particule, couleur, par seconde, hauteur, de nuit seulement]
const Z = {
  village: { fk: 0 },
  forest: { fog: '#9fb89a', fk: 0.25, dens: 1.1, p: [['spore', '#e8ffd0', 3, 2], ['luciole', '#d8ff7a', 6, 1.2, 1], ['feuille', '#8aa83a', 1.2, 5]] },
  boss: { fog: '#8a7a5a', fk: 0.35, dens: 1.3, hemi: '#e8d8b8', p: [['cendre', '#6a5a4a', 4, 5], ['embre', '#ff9a3a', 2, 0.3]] },
  ruins: { fog: '#7a8a9a', fk: 0.55, dens: 1.9, hemi: '#b8c4dc', exp: 0.95, p: [['brume', '#cfd8e8', 3, 0.4], ['ame', '#b8d8ff', 1.5, 1.2]] },
  camp: { fog: '#a89878', fk: 0.3, dens: 1.2, p: [['embre', '#ff9a3a', 2, 0.4], ['cendre', '#5a4a3a', 2, 4]] },
  desert: { fog: '#e8c890', fk: 0.55, dens: 0.8, hemi: '#ffe8c0', ground: '#c8984a', sun: '#ffe6b0', exp: 1.08, sky: ['#6fa6e8', '#f0d8a8', '#ffe2b0'], p: [['poussiere', '#f0c890', 10, 0.6]] },
  oasis: { fog: '#cfe0c0', fk: 0.3, dens: 0.8, hemi: '#fff0d0', sun: '#fff0c8', exp: 1.05, p: [['luciole', '#c8ffb0', 5, 1, 1], ['poussiere', '#f0d8a0', 2, 0.5]] },
  neige: { fog: '#dfe8f4', fk: 0.6, dens: 1.5, hemi: '#e8f0ff', ground: '#c8d8f0', sun: '#f0f6ff', exp: 1.05, sky: ['#8ab0e0', '#d8e6f4', '#f4f8ff'] },
  monts: { fog: '#c8d4e4', fk: 0.5, dens: 1.3, hemi: '#e0e8f8', exp: 1.03, p: [['poussiere', '#ffffff', 3, 1.5]] },
  hurlevents: { fog: '#b8c4d8', fk: 0.55, dens: 1.6, hemi: '#d0dcf0', p: [['poussiere', '#ffffff', 12, 1.2]] },
  fjord: { fog: '#a8bccc', fk: 0.5, dens: 1.5, hemi: '#c8d8e8', exp: 0.98, p: [['embrun', '#e8f4ff', 4, 0.5]] },
  marais: { fog: '#6a7a5a', fk: 0.65, dens: 2.2, hemi: '#a8b890', ground: '#3a4a2a', sun: '#d8e0b0', exp: 1.06, sky: ['#5a6a5a', '#8a9a7a', '#a8b090'], p: [['brume', '#b0c0a0', 4, 0.3], ['spore', '#c8ff7a', 4, 1.2], ['luciole', '#a8ff6a', 6, 1, 1]] },
  jungle: { fog: '#5a8a5a', fk: 0.5, dens: 1.8, hemi: '#c0e8b0', ground: '#2a4a1a', exp: 1.04, p: [['spore', '#ffe8a0', 5, 2.5], ['luciole', '#ffe86a', 8, 1.5, 1], ['feuille', '#4a8a2a', 2, 6]] },
  volcan: { fog: '#7a3a24', fk: 0.7, dens: 1.5, hemi: '#ffb890', ground: '#5a1a08', sun: '#ffb070', exp: 1.32, sky: ['#3a1a18', '#8a3a20', '#d8682a'], lava: 1, p: [['embre', '#ff7a2a', 24, 0.2], ['cendre', '#4a3a36', 10, 6]] },
  lave: { fog: '#6a2a18', fk: 0.7, dens: 1.6, hemi: '#ffa070', ground: '#4a1006', sun: '#ff9a5a', exp: 1.35, lava: 1, p: [['embre', '#ff6a1a', 26, 0.2], ['cendre', '#3a2a26', 6, 4]] },
  citadelle: { fog: '#4a3a5a', fk: 0.6, dens: 1.7, hemi: '#a890c8', sun: '#c8a8e8', exp: 1.08, sky: ['#1a1028', '#4a2a5a', '#8a4a6a'], p: [['ame', '#c8a0ff', 3, 1.5], ['cendre', '#2a2030', 4, 5]] },
  ombres: { fog: '#2a2440', fk: 0.7, dens: 2.0, hemi: '#7a70b0', exp: 1.15, p: [['ame', '#9a8aff', 4, 1], ['brume', '#4a4070', 3, 0.3]] },
  corrompues: { fog: '#5a3a4a', fk: 0.6, dens: 1.7, hemi: '#c890a8', sun: '#e8a8b8', exp: 1.06, p: [['spore', '#ff6a9a', 5, 1.5], ['cendre', '#3a2030', 4, 4]] },
  cote: { fog: '#b8d4e0', fk: 0.35, dens: 1.0, hemi: '#e0f0ff', exp: 1.03, p: [['embrun', '#ffffff', 5, 0.4]] },
  plaines: { fog: '#c8d8a8', fk: 0.25, dens: 0.8, hemi: '#f0f8d8', exp: 1.03, p: [['spore', '#ffffff', 2, 1.5], ['luciole', '#e8ff8a', 4, 1, 1]] },
  archipel: { fog: '#a8c8d8', fk: 0.35, dens: 1.0, hemi: '#d8ecff', p: [['embrun', '#ffffff', 4, 0.4]] },
  cristal: { fog: '#6a5a9a', fk: 0.55, dens: 1.4, hemi: '#c0b0ff', ground: '#3a2a6a', exp: 1.12, sky: ['#2a2058', '#6a5aa8', '#a898e0'], p: [['eclat', '#c8a8ff', 10, 1.5], ['eclat', '#8ae8ff', 6, 2]] },
  aether: { fog: '#c8d8ff', fk: 0.45, dens: 0.7, hemi: '#f0f4ff', sun: '#ffffff', exp: 1.08, sky: ['#5a7ae8', '#b8ccff', '#f0e8ff'], p: [['eclat', '#ffffff', 6, 2.5], ['ame', '#c8d8ff', 2, 2]] },
  mines: { fog: '#3a3028', fk: 0.65, dens: 1.8, hemi: '#c8a888', exp: 1.25, p: [['poussiere', '#a89070', 4, 1]] },
  temple: { fog: '#3a4a48', fk: 0.6, dens: 1.7, hemi: '#a8d8c8', exp: 1.22, p: [['ame', '#8affd8', 3, 1.2], ['brume', '#5a7a70', 2, 0.3]] },
};
const cur = { fog: new THREE.Color(), hemi: new THREE.Color(), ground: new THREE.Color(), sun: new THREE.Color(), top: new THREE.Color(), mid: new THREE.Color(), bot: new THREE.Color(), fk: 0, dens: 1, exp: 1, hk: 0, gk: 0, sk: 0, skyk: 0, lava: 0, init: false };
const tmp = new THREE.Color();
const lavaLight = new THREE.PointLight('#ff5a1a', 0, 22, 1.2); scene.add(lavaLight);
let acc = 0;
export function updateRegion(dt, zone, look, darkK) {
  const D = Z[zone && zone.id] || {}; const k = Math.min(1, dt * 0.8);
  if (!cur.init) { cur.init = true; cur.fog.copy(scene.fog.color); cur.hemi.copy(hemi.color); cur.ground.copy(hemi.groundColor); cur.sun.copy(sun.color); cur.top.copy(skyU.top.value); cur.mid.copy(skyU.mid.value); cur.bot.copy(skyU.bot.value); }
  const to = (c, hex, has) => { if (has) c.lerp(tmp.set(hex), k); };
  to(cur.fog, D.fog, !!D.fog); to(cur.hemi, D.hemi, !!D.hemi); to(cur.ground, D.ground, !!D.ground); to(cur.sun, D.sun, !!D.sun);
  if (D.sky) { to(cur.top, D.sky[0], 1); to(cur.mid, D.sky[1], 1); to(cur.bot, D.sky[2], 1); }
  cur.fk += ((D.fog ? D.fk : 0) - cur.fk) * k; cur.dens += ((D.dens || 1) - cur.dens) * k; cur.exp += ((D.exp || 1) - cur.exp) * k;
  cur.hk += ((D.hemi ? 0.6 : 0) - cur.hk) * k; cur.gk += ((D.ground ? 0.6 : 0) - cur.gk) * k; cur.sk += ((D.sun ? 0.55 : 0) - cur.sk) * k; cur.skyk += ((D.sky ? 0.7 : 0) - cur.skyk) * k; cur.lava += ((D.lava ? 1 : 0) - cur.lava) * k;
  // application par-dessus le cycle jour/nuit (la nuit reste la nuit : le mélange diminue quand il fait sombre)
  const night = DAY.cur ? DAY.cur.night : 0, nk = 1 - night * 0.55;
  scene.fog.color.lerp(cur.fog, cur.fk * nk); FOGU.c.value.copy(scene.fog.color);
  scene.fog.density *= cur.dens; FOGU.d.value = scene.fog.density;
  hemi.color.lerp(cur.hemi, cur.hk * nk); hemi.groundColor.lerp(cur.ground, cur.gk * nk); sun.color.lerp(cur.sun, cur.sk * nk);
  skyU.top.value.lerp(cur.top, cur.skyk * nk); skyU.mid.value.lerp(cur.mid, cur.skyk * nk); skyU.bot.value.lerp(cur.bot, cur.skyk * nk);
  renderer.toneMappingExposure *= cur.exp;
  // lave : lueur rouge qui monte du sol, pulsée
  lavaLight.intensity = cur.lava * (5 + Math.sin(performance.now() * 0.002) * 1.2); lavaLight.position.set(look.x + 3, look.y + 1.5, look.z - 4);
  // particules d'ambiance autour de la caméra
  if (!D.p || darkK > 0.9) return;
  acc += dt;
  for (const [type, col, rate, h, nightOnly] of D.p) {
    if (nightOnly && night < 0.45) continue;
    const n = Math.floor(rate * acc * (MOBILE ? 0.6 : 1) + Math.random());
    for (let i = 0; i < n; i++) { const x = look.x + R(-14, 14), z = look.z + R(-11, 11); MAGIC3D.emit('amb', x, groundH(x, z) + h * R(0.5, 1.5), z, { S: A[type], col, cx: x, cz: z }); }
  }
  acc = 0;
}
export { Z as REGIONS3D };
