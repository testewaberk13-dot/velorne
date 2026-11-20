'use strict';
// =====================================================================
//  RACES DE VÉLORNE : apparence, statistiques, résistances, aptitude
//  active et évolution par niveau. Utilisé par la création du
//  personnage, le calcul des statistiques et la fiche du personnage.
// =====================================================================
const FACES = {
  hd_hm1: 'Masculin franc', hd_hm2: 'Masculin émacié', hd_hm3: 'Masculin rond', hd_hm4: 'Masculin mûr',
  hd_hf1: 'Féminin', hd_hf2: 'Féminin délicat', hd_hf3: 'Féminin mûr',
  hd_orc_m: 'Orc (mâchoire massive)', hd_orc_f: 'Orc (traits fins)', hd_liz_m: 'Lézard (crête large)', hd_liz_f: 'Lézard (museau fin)',
};
const HUMAN_SKINS = ['light', 'amber', 'olive', 'taupe', 'bronze', 'brown', 'black'];
const RACES = {
  humain: {
    n: 'Humain', short: 'Polyvalents et ambitieux',
    origin: 'Descendants des royaumes de la plaine de Brumeval, les humains ont bâti les villages, les routes et les premières académies de magie. Leur force tient à leur capacité d\'adaptation.',
    physique: 'Silhouettes variées, aucun trait particulier. Peau claire à très foncée.',
    skins: HUMAN_SKINS, faces: { m: ['hd_hm1', 'hd_hm2', 'hd_hm3', 'hd_hm4'], f: ['hd_hf1', 'hd_hf2', 'hd_hf3'] }, nose: true, beard: true,
    mods: { maxhp: 6, maxmp: 6, atk: 1, mag: 1 }, res: {},
    traits: ['Expérience gagnée +10 %', 'Maîtrise des armes et des styles +15 % plus rapide', 'Récupération d\'endurance +10 %'],
    weak: 'Aucune faiblesse élémentaire, aucune résistance non plus.',
    active: { id: 'determination', n: 'Détermination', cd: 60, desc: 'Pendant 8 s : dégâts +20 %, endurance illimitée.' },
    growth: { hp: 12, mp: 6, atk: 2, mag: 2 }, growthText: 'Progression équilibrée : chaque niveau apporte autant de force que de magie.',
    flags: { xpMul: 1.1, masteryMul: 1.15, staRegen: 1.1 },
  },
  elfe: {
    n: 'Elfe', short: 'Gardiens des forêts anciennes',
    origin: 'Les elfes de Sylvemousse vivent depuis des siècles à l\'ombre des grands chênes. Liés aux courants de mana qui parcourent la forêt, ils sont de redoutables archers et mages.',
    physique: 'Oreilles longues et pointues, silhouette élancée, traits fins.',
    skins: ['light', 'amber', 'olive', 'taupe', 'bronze', 'brown'], faces: { m: ['hd_hm1', 'hd_hm2'], f: ['hd_hf1', 'hd_hf2'] }, nose: true, beard: false,
    ears: ['ears_elven', 'ears_long', 'ears_medium'], earNames: { ears_elven: 'Pointues', ears_long: 'Très longues', ears_medium: 'Discrètes' },
    mods: { maxhp: -8, maxmp: 20, mag: 3, crit: 0.04, spd: 6, acc: 0.05 }, res: { arcane: 0.15, vent: 0.1, poison: -0.1 },
    traits: ['Mana +20, puissance magique +3', 'Chance critique +4 %, précision +5 %', 'Vitesse de déplacement +6'],
    weak: 'Faiblesse au poison (−10 %). PV −8.',
    active: { id: 'pas_sylvestre', n: 'Pas sylvestre', cd: 45, desc: 'Pendant 6 s : vitesse +35 %, les esquives ne coûtent plus d\'endurance.' },
    growth: { hp: 10, mp: 9, atk: 1.5, mag: 2.6 }, growthText: 'Évolue vers la magie : +9 mana et +2,6 puissance magique par niveau, mais moins de PV.',
    flags: { dodgeFree: 0 },
  },
  orc: {
    n: 'Orc', short: 'Guerriers des steppes rouges',
    origin: 'Venus des steppes au-delà des montagnes, les clans orcs vénèrent la force et l\'honneur au combat. Tous ne suivent pas Grakhul : certains ont rejoint Brumeval pour le combattre.',
    physique: 'Peau verte, mâchoire puissante et défenses, carrure massive.',
    skins: ['green', 'pale_green', 'dark_green', 'bright_green', 'zombie_green', 'olive'], faces: { m: ['hd_orc_m'], f: ['hd_orc_f'] }, nose: false, beard: true,
    mods: { maxhp: 24, maxmp: -12, atk: 4, defP: 2 }, res: { poison: 0.15, terre: 0.1, arcane: -0.1 },
    traits: ['PV +24, attaque physique +4, défense physique +2', 'Insensible aux reculs lors des attaques lourdes', 'Les coups critiques soignent 2 % des PV'],
    weak: 'Faiblesse à l\'arcane (−10 %). Mana −12.',
    active: { id: 'rage', n: 'Rage sanguinaire', cd: 60, desc: 'Pendant 8 s : attaque +30 %, insensible aux reculs et aux étourdissements.' },
    growth: { hp: 15, mp: 4, atk: 2.6, mag: 1.4 }, growthText: 'Évolue vers la force : +15 PV et +2,6 attaque par niveau, peu de mana.',
    flags: { critHeal: 0.02, poiseHeavy: 1 },
  },
  lezard: {
    n: 'Homme-lézard', short: 'Peuple des marais de Vasebrume',
    origin: 'Les hommes-lézards habitent les marais du sud. Leur sang froid et leurs écailles les rendent endurants ; leur régénération est légendaire. Certains clans servent de mercenaires.',
    physique: 'Tête reptilienne, écailles, queue, yeux jaunes.',
    skins: ['green', 'dark_green', 'bright_green', 'pale_green', 'blue', 'bronze', 'taupe'], faces: { m: ['hd_liz_m'], f: ['hd_liz_f'] }, nose: false, beard: false, tail: 'tail_lizard',
    mods: { maxhp: 12, regenHp: 0.6, defP: 3, statusRes: 0.1 }, res: { poison: 0.25, eau: 0.15, glace: -0.2 },
    traits: ['Régénération +0,6 PV/s', 'Écailles : défense physique +3', 'Résistance aux altérations +10 %'],
    weak: 'Faiblesse au froid : glace −20 %.',
    active: { id: 'mue', n: 'Mue régénératrice', cd: 70, desc: 'Soigne 30 % des PV en 5 s et purge le poison.' },
    growth: { hp: 13, mp: 5, atk: 2.1, mag: 1.8 }, growthText: 'Évolue vers l\'endurance : régénération +0,05 PV/s par niveau.',
    flags: { regenPerLvl: 0.05 },
  },
  demi_demon: {
    n: 'Demi-démon', short: 'Héritiers d\'un pacte ancien',
    origin: 'Nés d\'une lignée humaine marquée par un pacte infernal, les demi-démons sont craints et rejetés. Leur sang brûle d\'une magie sombre qu\'ils doivent apprendre à dompter.',
    physique: 'Cornes, queue, peau aux teintes infernales (pourpre, cendre, braise).',
    skins: ['demon_crimson', 'demon_ember', 'demon_violet', 'demon_ash', 'demon_obsidian', 'lavender'], faces: { m: ['hd_hm1', 'hd_hm2'], f: ['hd_hf1', 'hd_hf2'] }, nose: true, beard: true,
    horns: ['horns_curled', 'horns_back'], hornNames: { horns_curled: 'Cornes enroulées', horns_back: 'Cornes en arrière' }, tail: 'tail_lizard', wings: true,
    mods: { mag: 5, maxmp: 10, crit: 0.02 }, res: { feu: 0.2, ombre: 0.2, lumiere: -0.25 },
    traits: ['Puissance magique +5, mana +10', 'Les dégâts de feu et d\'ombre infligés +10 %', 'Vaincre un ennemi rend 2 de mana'],
    weak: 'Grande faiblesse à la lumière : −25 %.',
    active: { id: 'pacte', n: 'Pacte infernal', cd: 60, desc: 'Sacrifie 15 % des PV : puissance magique +35 % et dégâts +15 % pendant 10 s.' },
    growth: { hp: 11, mp: 7, atk: 2, mag: 2.6 }, growthText: 'Évolue vers la magie sombre : +2,6 puissance magique par niveau.',
    flags: { darkBonus: 0.1, killMana: 2 },
  },
};
const HORN_COLORS = { demon_obsidian: 'Obsidienne', demon_ash: 'Cendre', bronze: 'Bronze', light: 'Os', demon_crimson: 'Sang' };
const RACE_ORDER = ['humain', 'elfe', 'orc', 'lezard', 'demi_demon'];
const SKIN_NAMES = { light: 'Claire', amber: 'Ambrée', olive: 'Olive', taupe: 'Taupe', bronze: 'Bronze', brown: 'Brune', black: 'Ébène', green: 'Verte', pale_green: 'Vert pâle', dark_green: 'Vert sombre', bright_green: 'Vert vif', zombie_green: 'Vert cendré', blue: 'Bleue', lavender: 'Lavande', demon_crimson: 'Pourpre', demon_ember: 'Braise', demon_violet: 'Violette', demon_ash: 'Cendre', demon_obsidian: 'Obsidienne' };
// couleur d'aperçu = teinte moyenne de la palette
function paletteHex(mat, name) { const p = findPalette(mat, name); return p ? p[Math.floor(p.length / 2)] : '#888'; }
const HAIR_LIST = ['hair_plain', 'hair_messy', 'hair_spiked', 'hair_buzzcut', 'hair_curtains', 'hair_pixie', 'hair_bob', 'hair_bangs', 'hair_long', 'hair_loose', 'hair_wavy', 'hair_ponytail', 'hair_braid', 'hair_bunches', 'hair_curly_long', 'hair_afro', 'hair_princess', 'none'];
const HAIR_LABEL = { hair_plain: 'Court', hair_messy: 'Ébouriffé', hair_spiked: 'Hérissé', hair_buzzcut: 'Rasé', hair_curtains: 'Mi-long', hair_pixie: 'Pixie', hair_bob: 'Carré', hair_bangs: 'Frange', hair_long: 'Long', hair_loose: 'Libre', hair_wavy: 'Ondulé', hair_ponytail: 'Queue', hair_braid: 'Tresse', hair_bunches: 'Couettes', hair_curly_long: 'Bouclé', hair_afro: 'Afro', hair_princess: 'Très long', none: 'Aucun' };
const HAIR_COLOR_LIST = ['black', 'raven', 'dark_brown', 'chestnut', 'light_brown', 'ginger', 'redhead', 'strawberry', 'blonde', 'gold', 'platinum', 'white', 'gray', 'red', 'rose', 'purple', 'blue', 'navy', 'green'];
const BEARD_LIST = ['none', 'beard_stubble', 'beard_trim', 'beard', 'beard_winter', 'mustache'];
const BEARD_LABEL = { none: 'Aucune', beard_stubble: 'Ombre', beard_trim: 'Taillée', beard: 'Fournie', beard_winter: 'Longue', mustache: 'Moustache' };
const EYE_LIST = ['brown', 'blue', 'green', 'gray', 'purple', 'red', 'orange', 'yellow'];
const EYE_LABEL = { brown: 'Bruns', blue: 'Bleus', green: 'Verts', gray: 'Gris', purple: 'Violets', red: 'Rouges', orange: 'Ambre', yellow: 'Or' };
const CLOTH_LIST = ['white', 'tan', 'brown', 'walnut', 'leather', 'maroon', 'red', 'orange', 'yellow', 'forest', 'green', 'teal', 'sky', 'blue', 'navy', 'purple', 'lavender', 'rose', 'gray', 'charcoal', 'black'];
const TORSO_LIST = { shirt: 'Tunique à manches longues', shortsleeve: 'Chemise à manches courtes', robe: 'Manteau long' };
const LEGS_LIST = { pants: 'Pantalon', shorts: 'Short', skirt: 'Jupe' };
const FEET_LIST = { boots: 'Bottes', shoes: 'Chaussures' };
function defaultLook(race, sex) {
  const R = RACES[race]; sex = sex || 'm';
  return {
    race, sex, body: sex, skin: R.skins[race === 'humain' ? 1 : 0], face: R.faces[sex][0], nose: R.nose ? 'none' : 'none', brows: 'none', eyes: race === 'lezard' ? 'yellow' : race === 'demi_demon' ? 'red' : 'brown',
    hair: race === 'lezard' ? 'none' : sex === 'f' ? 'hair_long' : 'hair_messy', hairColor: race === 'elfe' ? 'platinum' : race === 'demi_demon' ? 'black' : 'dark_brown', beard: 'none',
    ears: R.ears ? R.ears[0] : null, horns: R.horns ? R.horns[0] : null, hornColor: 'demon_obsidian', tail: !!R.tail, wings: false,
    outfit: { torso: 'shirt', torsoC: 'white', legs: 'pants', legsC: 'brown', feet: 'boots', feetC: 'brown', cape: null, scarf: null, bandana: null, belt: true, necklace: false },
  };
}
// conversion des anciennes apparences (avant la refonte)
function normalizeLook(L) {
  if (!L) return defaultLook('humain', 'm');
  if (L.race && L.outfit) return L;
  const N = defaultLook(L.race || 'humain', 'm');
  if (L.skin) N.skin = L.skin; if (L.hair) N.hair = L.hair; if (L.hairColor) N.hairColor = L.hairColor; if (L.eyes) N.eyes = L.eyes;
  N.beard = L.beard === true ? 'beard' : (typeof L.beard === 'string' ? L.beard : 'none');
  return N;
}
// identifiant de couche selon la silhouette (version féminine si elle existe)
function bodyItem(id, body) { return body === 'f' && CHARS.items[id + '@f'] ? id + '@f' : id; }
// couches d'apparence du personnage (sans l'équipement)
function lookLayers(L) {
  L = normalizeLook(L); const R = RACES[L.race] || RACES.humain; const b = L.body; const out = [];
  const skin = { color_1: L.skin };
  out.push({ id: bodyItem('body', b), c: skin });
  if (R.tail && L.tail) out.push({ id: bodyItem(R.tail, b), c: skin });
  if (R.wings && L.wings) out.push({ id: bodyItem('wings_bat', b) });
  const face = (R.faces.m.concat(R.faces.f)).includes(L.face) ? L.face : R.faces[L.sex][0];
  out.push({ id: bodyItem(face, b), c: { color_1: L.skin, color_2: L.eyes } });
  if (R.nose && L.nose && L.nose !== 'none') out.push({ id: bodyItem(L.nose, b), c: skin });
  if (L.brows && L.brows !== 'none') out.push({ id: bodyItem(L.brows, b), c: { color_1: L.hairColor } });
  if (R.ears && L.ears) out.push({ id: bodyItem(L.ears, b), c: skin });
  return out;
}
function lookHair(L) {
  L = normalizeLook(L); const out = []; const b = L.body; const R = RACES[L.race] || RACES.humain;
  if (L.hair && L.hair !== 'none') out.push({ id: bodyItem(L.hair, b), c: { color_1: L.hairColor } });
  if (R.beard && L.beard && L.beard !== 'none') out.push({ id: bodyItem(L.beard, b), c: { color_1: L.hairColor } });
  if (R.horns && L.horns) out.push({ id: bodyItem(L.horns, b), c: { color_1: L.hornColor || 'demon_obsidian' } });
  return out;
}
// tenue de départ (utilisée tant que les pièces de départ sont portées)
function outfitLayer(L, slot) {
  const O = normalizeLook(L).outfit; const b = L.body;
  if (slot === 'torso') return O.torso === 'robe' ? { id: bodyItem('robe', b) } : { id: bodyItem(O.torso, b), c: { color_1: O.torsoC } };
  if (slot === 'legs') return { id: bodyItem(O.legs, b), c: { color_1: O.legsC } };
  if (slot === 'feet') return { id: bodyItem(O.feet, b), c: { color_1: O.feetC } };
  return null;
}
function outfitExtras(L, eq) {
  const O = normalizeLook(L).outfit; const b = L.body; const out = [];
  if (O.belt) out.push({ id: bodyItem('belt', b) });
  if (O.scarf && !eq.neck) out.push({ id: bodyItem('scarf', b), c: { color_1: O.scarf } });
  if (O.necklace && !eq.neck) out.push({ id: bodyItem('necklace', b) });
  if (O.cape && !eq.cape) out.push({ id: bodyItem('cape', b), c: { color_1: O.cape } });
  return out;
}
// ---------------- aptitudes raciales actives ----------------
function useRacial(P) {
  const R = RACES[P.look.race] || RACES.humain; const A = R.active; P.raceCd = P.raceCd || 0;
  if (P.state === 'dead') return;
  if (P.raceCd > G.t) { toast(A.n + ' : ' + Math.ceil(P.raceCd - G.t) + ' s', '#aaa'); return; }
  P.raceCd = G.t + A.cd; const S = P.st8; sfx('level');
  const col = { humain: '#ffe27a', elfe: '#9effb0', orc: '#ff5a3a', lezard: '#7ee0a0', demi_demon: '#d0408f' }[P.look.race] || '#fff';
  ring(P.x, P.y, 50, col, 0.5, 4); for (let i = 0; i < 24; i++) part(P.x + rnd(-14, 14), P.y - rnd(0, 30), { rise: rnd(30, 70), col, life: 0.8, size: 2, add: true });
  if (A.id === 'determination') { P.buffs.determination = G.t + 8; }
  else if (A.id === 'pas_sylvestre') { P.buffs.sylvestre = G.t + 6; P.buffs.haste = G.t + 6; }
  else if (A.id === 'rage') { P.buffs.rage = G.t + 8; flashScreen('#ff3a1a', 0.2); }
  else if (A.id === 'mue') { P.status.poison = 0; P.regenBurst = { t: 5, per: S.maxhp * 0.3 / 5 }; }
  else if (A.id === 'pacte') { P.hp = Math.max(1, P.hp - S.maxhp * 0.15); P.buffs.pacte = G.t + 10; flashScreen('#8b1a4a', 0.3); }
  toast(A.n + ' !', col); refreshStats(P);
}
