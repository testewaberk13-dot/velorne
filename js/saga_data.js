'use strict';
// ===================== LA SAGA DU SEIGNEUR DÉMON : monstres, boss, butin =====================
// Les monstres réutilisent les silhouettes existantes (même apparence que ceux de la forêt) mais avec leurs propres noms et statistiques.
const E2 = (base, o) => Object.assign({}, ENEMIES[base], o);
Object.assign(ENEMIES, {
  // Désert d'Arkhan (niveau conseillé 6)
  chacal: E2('wolf_brute', { name: 'Chacal des dunes', hp: 150, dmg: 19, xp: 34, gold: [8, 16] }),
  serpent_sable: E2('snake', { name: 'Serpent des sables', hp: 90, dmg: 16, xp: 26, gold: [6, 12], res: { poison: 0.7 } }),
  pillard: E2('goblin_rogue', { name: 'Pillard du désert', hp: 130, dmg: 17, xp: 32, gold: [10, 18] }),
  guerrier_sable: E2('lizard_spearman', { name: 'Guerrier des sables', hp: 190, dmg: 22, xp: 42, gold: [12, 22], res: { feu: 0.5, glace: -0.4 } }),
  momie_archere: E2('skeleton_archer', { name: 'Momie archère', hp: 120, dmg: 18, xp: 36, gold: [10, 18] }),
  // Marais de Grisebrume (niveau 10)
  gelee_toxique: E2('slime', { name: 'Gelée toxique', hp: 160, dmg: 22, xp: 44, gold: [12, 22], el: 'poison', res: { poison: 0.9, feu: -0.3 } }),
  moustique: E2('bee', { name: 'Moustique géant', hp: 110, dmg: 20, xp: 40, gold: [10, 18] }),
  ombre_marais: E2('dark_mage', { name: 'Ombre du marais', hp: 210, dmg: 26, xp: 58, gold: [16, 28] }),
  lezard_marais: E2('lizard_spearman', { name: 'Chasseur des marais', hp: 300, dmg: 28, xp: 66, gold: [18, 30], el: 'poison', res: { poison: 0.6 } }),
  revenant: E2('skeleton_archer', { name: 'Revenant noyé', hp: 180, dmg: 24, xp: 54, gold: [14, 24] }),
  // Cimes de Givrenuit (niveau 14)
  loup_neiges: E2('wolf_brute', { name: 'Loup des neiges', hp: 340, dmg: 34, xp: 84, gold: [22, 36], res: { glace: 0.8, feu: -0.4 } }),
  squelette_gele: E2('skeleton_archer', { name: 'Archer gelé', hp: 250, dmg: 30, xp: 78, gold: [20, 34], res: { glace: 0.9, feu: -0.4, ombre: 0.5 } }),
  ogre_glace: E2('orc_warrior', { name: 'Ogre des glaces', hp: 520, dmg: 42, xp: 110, gold: [30, 50], res: { glace: 0.8, feu: -0.4 } }),
  mage_givre: E2('dark_mage', { name: 'Mage du givre', hp: 300, dmg: 36, xp: 96, gold: [28, 46], res: { glace: 0.9, feu: -0.4 } }),
  // Cratère de Cendrefeu (niveau 18)
  chauve_ardente: E2('bat', { name: 'Chauve-souris ardente', hp: 200, dmg: 32, xp: 80, gold: [20, 34], el: 'feu', res: { feu: 0.9, glace: -0.4 } }),
  salamandre: E2('lizard_spearman', { name: 'Salamandre', hp: 520, dmg: 46, xp: 124, gold: [34, 54], el: 'feu', res: { feu: 0.9, glace: -0.5 } }),
  orc_forge: E2('orc_warrior', { name: 'Orc de la forge', hp: 640, dmg: 54, xp: 140, gold: [38, 60], res: { feu: 0.5 } }),
  elementaire: E2('demon_brute', { name: 'Élémentaire de braise', hp: 760, dmg: 58, xp: 190, gold: [50, 80], el: 'feu', res: { feu: 0.9, glace: -0.5 } }),
  mage_cendre: E2('dark_mage', { name: 'Mage de cendre', hp: 400, dmg: 46, xp: 120, gold: [36, 56], res: { feu: 0.7 } }),
  // Citadelle de Malvorak (niveau 22)
  chevalier_demon: E2('demon_brute', { name: 'Chevalier démon', hp: 1000, dmg: 66, xp: 260, gold: [70, 110] }),
  cultiste: E2('dark_mage', { name: 'Cultiste de Malvorak', hp: 520, dmg: 54, xp: 170, gold: [50, 80] }),
  garde_ossements: E2('skeleton_archer', { name: 'Garde d\'ossements', hp: 460, dmg: 50, xp: 150, gold: [44, 70] }),
  // Boss (même mécanique que Grakhul : charge, onde de choc, renforts)
  boss_sultan: { name: 'Sultan Zahrak, roi des sables', short: 'Zahrak', look: 'lizard_spearman', el: 'feu', res: { feu: 0.6, glace: -0.4 }, hp: 3200, dmg: 40, spd: 66, xp: 1200, ai: 'boss', atk: 'thrust', range: 70, cd: 1.1, wind: 0.5, gold: [250, 320], r: 30, boss: 1, scale: 2, bw: 28, bh: 12, minion: ['pillard', 'guerrier_sable'], seal: 'desert' },
  boss_marais: { name: 'Mère Grisebrume, reine du marais', short: 'Grisebrume', look: 'dark_mage', undead: 1, el: 'poison', res: { poison: 0.9, feu: -0.3, lumiere: -0.4 }, hp: 5200, dmg: 52, spd: 58, xp: 2200, ai: 'boss', atk: 'slash', range: 66, cd: 1.1, wind: 0.5, gold: [350, 450], r: 30, boss: 1, scale: 2, bw: 28, bh: 12, minion: ['gelee_toxique', 'ombre_marais'], seal: 'marais' },
  boss_neige: { name: 'Kragh l\'Alpha blanc', short: 'Kragh', look: 'wolf_brute', res: { glace: 0.9, feu: -0.5 }, el: 'glace', hp: 7600, dmg: 66, spd: 82, xp: 3400, ai: 'boss', atk: 'slash', range: 70, cd: 1.0, wind: 0.45, gold: [450, 600], r: 30, boss: 1, scale: 2.2, bw: 28, bh: 12, minion: ['loup_neiges', 'ogre_glace'], seal: 'neige' },
  boss_volcan: { name: 'Ignaroth, gardien de braise', short: 'Ignaroth', look: 'demon_brute', demon: 1, el: 'feu', res: { feu: 0.95, glace: -0.5 }, hp: 10500, dmg: 82, spd: 64, xp: 5200, ai: 'boss', atk: 'slash', range: 74, cd: 1.1, wind: 0.5, gold: [600, 800], r: 32, boss: 1, scale: 2.3, bw: 30, bh: 12, minion: ['salamandre', 'elementaire'], seal: 'volcan' },
  boss_malvorak: { name: 'Malvorak, Seigneur démon', short: 'Malvorak', look: 'king_specter', demon: 1, el: 'ombre', res: { ombre: 0.7, lumiere: -0.4 }, hp: 16000, dmg: 100, spd: 70, xp: 9000, ai: 'boss', atk: 'slash', range: 80, cd: 1.0, wind: 0.45, gold: [1200, 1600], r: 34, boss: 1, scale: 2.6, bw: 32, bh: 14, minion: ['chevalier_demon', 'cultiste'], seal: 'final' },
});
const SAGA_LOOT = {
  chacal: [['croc', 0.5, 1, 2]], serpent_sable: [['ecaille_drake', 0.3, 1, 1]], pillard: [['fer', 0.5, 1, 3], ['cuir', 0.4, 1, 2]], guerrier_sable: [['ecaille_drake', 0.5, 1, 2]], momie_archere: [['essence_spectrale', 0.5, 1, 2]],
  gelee_toxique: [['fragment_runique', 0.3, 1, 1]], moustique: [['cuir', 0.3, 1, 1]], ombre_marais: [['cristal_magique', 0.5, 1, 2], ['fragment_runique', 0.4, 1, 1]], lezard_marais: [['ecaille_drake', 0.6, 1, 3]], revenant: [['essence_spectrale', 0.6, 1, 3]],
  loup_neiges: [['croc', 0.6, 1, 3], ['cuir', 0.5, 1, 2]], squelette_gele: [['essence_spectrale', 0.6, 1, 3]], ogre_glace: [['acier', 0.5, 1, 3]], mage_givre: [['cristal_magique', 0.6, 1, 3]],
  chauve_ardente: [['cendres', 0.5, 1, 2]], salamandre: [['ecaille_drake', 0.6, 2, 3], ['cendres', 0.5, 1, 2]], orc_forge: [['acier', 0.6, 2, 3]], elementaire: [['cendres', 0.9, 2, 4], ['mithril', 0.3, 1, 1]], mage_cendre: [['cristal_magique', 0.6, 1, 3]],
  chevalier_demon: [['cendres', 0.9, 2, 4], ['mithril', 0.4, 1, 2]], cultiste: [['cristal_magique', 0.7, 2, 3], ['fragment_runique', 0.6, 1, 2]], garde_ossements: [['essence_spectrale', 0.7, 2, 3]]
};
const SAGA_TIER = { chacal: 2, serpent_sable: 2, pillard: 2, guerrier_sable: 2, momie_archere: 2, gelee_toxique: 2, moustique: 2, ombre_marais: 3, lezard_marais: 3, revenant: 3, loup_neiges: 3, squelette_gele: 3, ogre_glace: 3, mage_givre: 3, chauve_ardente: 3, salamandre: 4, orc_forge: 4, elementaire: 4, mage_cendre: 4, chevalier_demon: 4, cultiste: 4, garde_ossements: 4 };
for (const k in SAGA_LOOT) LOOT[k] = { mats: SAGA_LOOT[k], weapon: 0.05 + (SAGA_TIER[k] - 1) * 0.02, tier: SAGA_TIER[k], seal: 0.03, relic: 0.04 };
for (const b of ['boss_sultan', 'boss_marais', 'boss_neige', 'boss_volcan', 'boss_malvorak']) LOOT[b] = { mats: [['acier', 1, 4, 6], ['mithril', 1, 2, 4], ['cendres', 1, 3, 5]], tier: 4, weapon: 1, fixed: ['eclat_exception', 'eclat_exception', 'sceau_lame', 'chronique'] };
