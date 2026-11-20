'use strict';
// ===================== apparence =====================
const SKINS = ['light', 'amber', 'olive', 'taupe', 'bronze', 'brown', 'black'];
const SKIN_HEX = { light: '#E4A47C', amber: '#EA9F54', olive: '#c48a5a', taupe: '#a9765a', bronze: '#9b6a45', brown: '#6e4a34', black: '#4a3328' };
const HAIRS = ['hair_plain', 'hair_messy', 'hair_long', 'hair_spiked', 'hair_ponytail', 'hair_bangs'];
const HAIR_NAMES = { hair_plain: 'Court', hair_messy: 'Ébouriffé', hair_long: 'Long', hair_spiked: 'Hérissé', hair_ponytail: 'Queue', hair_bangs: 'Frange' };
const HAIR_COLORS = ['black', 'dark_brown', 'chestnut', 'ginger', 'blonde', 'platinum', 'white', 'red', 'blue', 'purple', 'green'];
const HAIR_HEX = { black: '#2b2b33', dark_brown: '#4a2f22', chestnut: '#7a3f20', ginger: '#c1561b', blonde: '#e5c65a', platinum: '#e8e2cf', white: '#f2f2f2', red: '#b21e1e', blue: '#2f5fd0', purple: '#7b3fc6', green: '#2f9e44' };
const EYES = ['blue', 'brown', 'green', 'gray', 'purple', 'red'];

// ===================== compétences =====================
const SKILLS = {
  s1: { name: 'Lion de feu', icon: 'spell_firelion', mp: 16, cd: 3.5, desc: 'Un lion de flammes charge droit devant, traverse les ennemis et les enflamme.' },
  s2: { name: 'Étreinte de glace', icon: 'spell_icetacle', mp: 20, cd: 6, desc: 'Des tentacules de glace jaillissent sous la cible et la gèlent.' },
  s3: { name: 'Griffe de foudre', icon: 'spell_lightning', mp: 24, cd: 7, desc: 'La foudre frappe la cible puis rebondit sur 3 ennemis proches et les paralyse.' },
  s4: { name: 'Égide de givre', icon: 'spell_shield', mp: 22, cd: 12, desc: 'Un dôme de givre absorbe les dégâts pendant 6 s et repousse les ennemis.' },
  ult: { name: 'Cataclysme', icon: 'spell_watertacle', mp: 0, cd: 2, desc: 'Ultime : la terre se fend, des pics de roche et des explosions ravagent tout autour de toi. Se charge en combattant.' },
};

// ===================== ennemis =====================
const ENEMIES = {
  slime: { name: 'Gelée verte', res: { poison: 0.5, feu: -0.3 }, mon: 'slime', hp: 26, dmg: 7, spd: 40, xp: 8, ai: 'hopper', bw: 16, bh: 8, gold: [1, 4], r: 12 },
  bat: { name: 'Chauve-souris', undead: 1, res: { ombre: 0.3, lumiere: -0.3 }, mon: 'bat', hp: 16, dmg: 6, spd: 78, xp: 7, ai: 'flyer', bw: 14, bh: 8, gold: [1, 3], fly: 1, r: 10 },
  bee: { name: 'Frelon géant', el: 'poison', mon: 'bee', hp: 18, dmg: 6, spd: 92, xp: 8, ai: 'swooper', bw: 14, bh: 8, gold: [1, 3], fly: 1, r: 10 },
  snake: { name: 'Vipère', el: 'poison', res: { poison: 0.6 }, mon: 'snake', hp: 22, dmg: 8, spd: 46, xp: 8, ai: 'lunger', bw: 16, bh: 8, gold: [1, 4], r: 11 },
  eyeball: { name: 'Œil errant', res: { arcane: 0.4 }, mon: 'eyeball', hp: 28, dmg: 8, spd: 34, xp: 11, ai: 'eye', bw: 14, bh: 8, gold: [2, 5], fly: 1, r: 11 },
  goblin_rogue: { name: 'Gobelin', look: 'goblin_rogue', hp: 42, dmg: 9, spd: 74, xp: 14, ai: 'melee', atk: 'slash', range: 30, cd: 0.9, wind: 0.22, gold: [3, 8], r: 14, dodgy: 1 },
  orc_warrior: { name: 'Guerrier orc', look: 'orc_warrior', hp: 80, dmg: 15, spd: 54, xp: 24, ai: 'melee', atk: 'slash', range: 38, cd: 1.5, wind: 0.42, gold: [6, 14], r: 16, heavy: 1 },
  wolf_brute: { name: 'Loup-garou', look: 'wolf_brute', hp: 66, dmg: 12, spd: 70, xp: 20, ai: 'charger', atk: 'slash', range: 32, cd: 1.3, wind: 0.3, gold: [4, 10], r: 15 },
  lizard_spearman: { name: 'Homme-lézard', res: { feu: 0.3, glace: -0.3 }, look: 'lizard_spearman', hp: 54, dmg: 12, spd: 58, xp: 18, ai: 'melee', atk: 'thrust', range: 48, cd: 1.25, wind: 0.32, gold: [4, 9], r: 15 },
  skeleton_archer: { name: 'Squelette archer', undead: 1, res: { ombre: 0.5, poison: 0.8, lumiere: -0.5 }, look: 'skeleton_archer', hp: 36, dmg: 10, spd: 48, xp: 16, ai: 'archer', atk: 'shoot', range: 180, cd: 2.0, wind: 0.5, gold: [3, 8], r: 14 },
  dark_mage: { name: 'Nécromancien', undead: 1, res: { ombre: 0.4, lumiere: -0.4 }, look: 'dark_mage', hp: 48, dmg: 13, spd: 44, xp: 22, ai: 'caster', atk: 'spellcast', range: 160, cd: 2.6, wind: 0.6, gold: [6, 12], r: 14 },
  demon_brute: { name: 'Démon des ronces', demon: 1, res: { feu: 0.5, glace: -0.3, lumiere: -0.3 }, look: 'demon_brute', hp: 170, dmg: 20, spd: 52, xp: 60, ai: 'melee', atk: 'slash', range: 40, cd: 1.6, wind: 0.5, gold: [20, 40], r: 17, elite: 1, heavy: 1 },
  king_specter: { name: 'Spectre du dernier roi', look: 'king_specter', undead: 1, res: { ombre: 0.6, poison: 0.9, lumiere: -0.5 }, el: 'ombre', hp: 760, dmg: 19, spd: 58, xp: 260, ai: 'melee', atk: 'slash', range: 46, cd: 1.2, wind: 0.42, gold: [90, 140], r: 17, elite: 1, heavy: 1 },
  dummy: { name: 'Mannequin d\'entraînement', dummy: 1, hp: 45, dmg: 0, spd: 0, xp: 0, ai: 'static', bw: 14, bh: 8, gold: [0, 0], r: 13 },
  boss_orc_chief: { name: 'Grakhul, Chef de guerre orc', look: 'orc_chief', hp: 1100, dmg: 22, spd: 60, xp: 400, ai: 'boss', atk: 'slash', range: 64, cd: 1.1, wind: 0.5, gold: [150, 200], r: 30, boss: 1, scale: 2, bw: 28, bh: 12 },
};
