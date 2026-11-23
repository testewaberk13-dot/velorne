'use strict';
// =====================================================================
//  MAGIES DE VÉLORNE : 27 familles, 5 raretés, sorts innés propres à
//  chaque famille, Magic Spin (rituel de révélation du Maître Mage).
// =====================================================================
const MAGIC_TIERS = {
  1: { n: 'Commune', c: '#d7dce4', rgb: '215,220,228', rate: 5 },
  2: { n: 'Inhabituelle', c: '#5fd068', rgb: '95,208,104', rate: 25 },
  3: { n: 'Rare', c: '#4aa3ff', rgb: '74,163,255', rate: 35 },
  4: { n: 'Épique', c: '#b06cff', rgb: '176,108,255', rate: 25 },
  5: { n: 'Légendaire', c: '#ffb43a', rgb: '255,180,58', rate: 10 },
};
// protection contre la malchance : au 5e tirage sans magie épique ou légendaire, une magie épique (ou mieux) est obligatoire.
// Le compteur est conservé au niveau du compte (il survit aux nouveaux personnages).
const MAGIC_PITY_AT = 5, MAGIC_PITY_MIN_TIER = 4, MAGIC_PITY_KEY = 'vel_magic_pity_v1';
// probabilité extrêmement rare d'obtenir deux magies au premier tirage
const DOUBLE_MAGIC_RATE = 0.005;
const MAGIC_CATS = { elem: 'Magie élémentaire', obscure: 'Magie obscure', celeste: 'Magie céleste et mystique' };
// k = type de sort : proj (projectile), burst (zone à la cible), chain (rebonds), nova (autour de soi),
// zone (zone persistante), vortex (attire puis implose), tornado, beam (rayon), buff, dash (déplacement offensif)
// p = puissance, st = altération (burn, freeze, slow, root, poison, shock, stun, mark, drain, curse, mana, rand)
const MF = (n, col, el, tier, cat, aff, desc, ult, spells) => ({ n, col, rgb: hexToRgbStr(col), el, tier, cat, aff, desc, ult, spells });
const MAGIC_DATA = {
  // ----- élémentaires -----
  feu: MF('Feu', '#ff7a2a', 'feu', 1, 'elem', null, 'La flamme pure : dégâts élevés et brûlures persistantes.', 'Cataclysme ardent', [
    { n: 'Lion de feu', k: 'proj', fx: 'firelion', p: 1.1, mp: 16, cd: 3.5, st: 'burn', pierce: 1, d: 'Un lion de flammes charge droit devant, traverse les ennemis et les enflamme.' },
    { n: 'Colonne de flammes', k: 'burst', fx: 'explosion', p: 1.3, mp: 20, cd: 6, r: 46, st: 'burn', d: 'Une colonne de feu jaillit sous la cible et l\'enflamme.' },
    { n: 'Brasier', k: 'zone', p: 0.35, mp: 24, cd: 9, r: 52, life: 4, st: 'burn', d: 'Embrase le sol pendant 4 s : brûle tout ce qui s\'y trouve.' }]),
  eau: MF('Eau', '#4fa3ff', 'eau', 1, 'elem', 'glace', 'Les flots qui repoussent, ralentissent et emportent.', 'Déluge', [
    { n: 'Javelot d\'eau', k: 'proj', p: 1.0, mp: 14, cd: 3, st: 'slow', kb: 160, d: 'Un trait d\'eau sous pression qui repousse et ralentit.' },
    { n: 'Geyser', k: 'burst', fx: 'torrentacle', p: 1.25, mp: 20, cd: 6, r: 44, st: 'stun', d: 'Un geyser projette les ennemis en l\'air et les étourdit.' },
    { n: 'Marée', k: 'nova', p: 0.9, mp: 24, cd: 9, r: 80, st: 'slow', kb: 320, d: 'Une vague déferle autour de toi et repousse tout.' }]),
  glace: MF('Glace', '#9fe3ff', 'glace', 2, 'elem', 'glace', 'Le froid qui fige : contrôle et protection.', 'Hiver éternel', [
    { n: 'Éclat de givre', k: 'proj', p: 1.0, mp: 14, cd: 3, st: 'slow', d: 'Un éclat de glace qui ralentit fortement la cible.' },
    { n: 'Étreinte de glace', k: 'burst', fx: 'icetacle', p: 1.3, mp: 20, cd: 6, r: 44, st: 'freeze', d: 'Des tentacules de glace jaillissent sous la cible et la gèlent.' },
    { n: 'Blizzard', k: 'zone', p: 0.3, mp: 24, cd: 10, r: 60, life: 4, st: 'slow', d: 'Une tempête de neige ralentit et blesse pendant 4 s.' }]),
  foudre: MF('Foudre', '#ffe066', 'foudre', 2, 'elem', 'foudre', 'L\'éclair : vitesse, rebonds et paralysie.', 'Jugement de l\'orage', [
    { n: 'Trait électrique', k: 'proj', p: 0.9, mp: 12, cd: 2.5, st: 'shock', speed: 300, d: 'Un trait foudroyant très rapide qui paralyse brièvement.' },
    { n: 'Griffe de foudre', k: 'chain', fx: 'lightning', p: 1.4, mp: 24, cd: 7, n2: 4, st: 'stun', d: 'La foudre frappe la cible puis rebondit sur 3 ennemis proches et les paralyse.' },
    { n: 'Tempête statique', k: 'nova', p: 1.0, mp: 26, cd: 10, r: 70, st: 'shock', d: 'Une décharge autour de toi paralyse les ennemis proches.' }]),
  vent: MF('Vent', '#c8f7e8', 'vent', 1, 'elem', 'vent', 'Les courants d\'air : mobilité, reculs et tornades.', 'Ouragan', [
    { n: 'Lame de vent', k: 'proj', p: 0.9, mp: 12, cd: 2.5, pierce: 1, speed: 280, d: 'Une lame d\'air tranchante qui traverse les ennemis.' },
    { n: 'Tornade', k: 'tornado', p: 0.45, mp: 22, cd: 8, d: 'Une tornade avance, aspire et blesse les ennemis.' },
    { n: 'Bourrasque', k: 'nova', p: 0.7, mp: 18, cd: 7, r: 90, kb: 420, d: 'Une rafale violente repousse tout autour de toi.' }]),
  terre: MF('Terre', '#c8a26b', 'terre', 1, 'elem', 'terre', 'La roche : impacts lourds, étourdissements et défense.', 'Fureur tellurique', [
    { n: 'Roc', k: 'proj', p: 1.2, mp: 15, cd: 3.5, kb: 200, st: 'stun', d: 'Projette un bloc de roche qui assomme.' },
    { n: 'Pics de roche', k: 'burst', fx: 'rockspikes', p: 1.35, mp: 20, cd: 6, r: 46, st: 'stun', d: 'Des pics de pierre jaillissent sous la cible.' },
    { n: 'Peau de pierre', k: 'buff', buff: { def: 0.4 }, shield: 0.8, mp: 22, cd: 14, dur: 8, d: 'Défense +40 % pendant 8 s et bouclier de pierre.' }]),
  nature: MF('Nature', '#4ade80', 'terre', 1, 'elem', 'nature', 'La vie sauvage : racines, épines et soins.', 'Colère de la forêt', [
    { n: 'Épines', k: 'proj', p: 0.9, mp: 12, cd: 2.5, st: 'poison', d: 'Une volée d\'épines empoisonnées.' },
    { n: 'Racines', k: 'burst', p: 1.0, mp: 18, cd: 6, r: 50, st: 'root', d: 'Des racines immobilisent les ennemis 1,6 s.' },
    { n: 'Floraison', k: 'buff', heal: 0.28, buff: { regen: 2 }, mp: 24, cd: 15, dur: 8, d: 'Soigne 28 % des PV puis régénère pendant 8 s.' }]),
  metal: MF('Métal', '#c0c8d4', 'terre', 2, 'elem', 'terre', 'L\'acier vivant : lames multiples et armure.', 'Tempête d\'acier', [
    { n: 'Lames d\'acier', k: 'proj', p: 0.7, mp: 14, cd: 3, multi: 3, d: 'Trois lames d\'acier en éventail.' },
    { n: 'Pluie de lames', k: 'burst', p: 1.35, mp: 22, cd: 7, r: 50, fx: 'flash', d: 'Des épées tombent du ciel sur la cible.' },
    { n: 'Armure de fer', k: 'buff', buff: { def: 0.5 }, shield: 1, mp: 22, cd: 15, dur: 8, d: 'Défense +50 % et bouclier d\'acier pendant 8 s.' }]),
  lave: MF('Lave', '#ff5a1f', 'feu', 3, 'elem', 'feu', 'Le magma : explosions et sols brûlants.', 'Cœur du volcan', [
    { n: 'Bombe de magma', k: 'proj', p: 1.0, mp: 16, cd: 3.5, st: 'burn', explode: 40, d: 'Une boule de magma qui explose à l\'impact.' },
    { n: 'Éruption', k: 'burst', fx: 'quake', p: 1.5, mp: 24, cd: 7, r: 56, st: 'burn', d: 'Le sol entre en éruption sous la cible.' },
    { n: 'Coulée de lave', k: 'zone', p: 0.45, mp: 26, cd: 10, r: 54, life: 4.5, st: 'burn', d: 'Une mare de lave brûle tout pendant 4,5 s.' }]),
  // ----- obscures -----
  ombre: MF('Ombre', '#8b5cf6', 'ombre', 3, 'obscure', 'ombre', 'Les ténèbres : déplacements furtifs et voiles.', 'Nuit absolue', [
    { n: 'Trait d\'ombre', k: 'proj', p: 1.0, mp: 13, cd: 2.8, pierce: 1, d: 'Un trait de ténèbres qui traverse les ennemis.' },
    { n: 'Pas de l\'ombre', k: 'dash', p: 1.3, mp: 18, cd: 6, d: 'Tu traverses l\'ombre jusqu\'à la cible et frappes tout sur ton passage.' },
    { n: 'Voile obscur', k: 'zone', p: 0.3, mp: 22, cd: 10, r: 60, life: 4, st: 'slow', d: 'Un voile d\'ombre ralentit et ronge les ennemis.' }]),
  sang: MF('Sang', '#d7263d', 'ombre', 3, 'obscure', 'ames', 'Le sang : vol de vie et puissance au prix de soi.', 'Marée écarlate', [
    { n: 'Lance de sang', k: 'proj', p: 1.0, mp: 12, cd: 3, st: 'drain', d: 'Une lance de sang qui te rend une partie des dégâts.' },
    { n: 'Saignée', k: 'burst', p: 1.2, mp: 20, cd: 6, r: 50, st: 'drain', d: 'Draine la vie de tous les ennemis de la zone.' },
    { n: 'Frénésie sanguine', k: 'buff', buff: { atk: 0.3, mag: 0.3 }, cost: 0.1, mp: 0, cd: 14, dur: 8, d: 'Sacrifie 10 % des PV : attaque et magie +30 % pendant 8 s.' }]),
  poison: MF('Poison', '#7ee06b', 'poison', 2, 'obscure', 'poison', 'Les toxines : dégâts continus qui s\'accumulent.', 'Pestilence', [
    { n: 'Crachat toxique', k: 'proj', p: 0.8, mp: 11, cd: 2.5, st: 'poison', d: 'Empoisonne la cible (cumulable).' },
    { n: 'Nuage toxique', k: 'zone', p: 0.25, mp: 20, cd: 8, r: 58, life: 5, st: 'poison', d: 'Un nuage empoisonne tous les ennemis qui le traversent.' },
    { n: 'Fléau', k: 'chain', p: 0.9, mp: 22, cd: 8, n2: 5, st: 'poison', d: 'Le poison se propage d\'ennemi en ennemi.' }]),
  neant: MF('Vide', '#6d28d9', 'ombre', 5, 'obscure', 'espace', 'Le vide originel : il efface tout ce qu\'il touche.', 'Effacement', [
    { n: 'Sphère du néant', k: 'proj', p: 1.5, mp: 18, cd: 4, pierce: 1, speed: 120, d: 'Une sphère lente qui désintègre tout sur son passage.' },
    { n: 'Faille du néant', k: 'vortex', p: 2.0, mp: 26, cd: 9, d: 'Une faille aspire les ennemis puis implose.' },
    { n: 'Annihilation', k: 'nova', p: 1.9, mp: 34, cd: 12, r: 90, st: 'curse', d: 'Le néant s\'ouvre autour de toi et maudit les survivants.' }]),
  ames: MF('Âmes', '#c4b5fd', 'ombre', 4, 'obscure', 'ames', 'Les esprits : marques, moisson et liens.', 'Cortège des âmes', [
    { n: 'Esprit vengeur', k: 'proj', p: 1.0, mp: 13, cd: 3, st: 'mark', homing: 1, d: 'Un esprit traque la cible et la marque (3 marques : explosion d\'âme).' },
    { n: 'Moisson', k: 'nova', p: 1.1, mp: 22, cd: 8, r: 70, st: 'drain', d: 'Arrache un fragment d\'âme à chaque ennemi proche et te soigne.' },
    { n: 'Lien d\'âme', k: 'chain', p: 1.0, mp: 20, cd: 7, n2: 4, st: 'mark', d: 'Relie les âmes de plusieurs ennemis et les marque.' }]),
  malediction: MF('Malédiction', '#c026d3', 'ombre', 4, 'obscure', 'ombre', 'Les maléfices : les ennemis maudits subissent plus de dégâts.', 'Anathème', [
    { n: 'Maléfice', k: 'proj', p: 0.9, mp: 12, cd: 3, st: 'curse', d: 'Maudit la cible : elle subit +25 % de dégâts pendant 6 s.' },
    { n: 'Sceau maudit', k: 'burst', p: 1.1, mp: 20, cd: 7, r: 52, st: 'curse', fx: 'snakebite', d: 'Un sceau maudit et ralentit tous les ennemis de la zone.' },
    { n: 'Fléau des âmes', k: 'chain', p: 1.1, mp: 22, cd: 8, n2: 4, st: 'curse', d: 'La malédiction passe d\'ennemi en ennemi.' }]),
  necromancie: MF('Nécromancie', '#a3e635', 'ombre', 4, 'obscure', 'ames', 'La mort apprivoisée : mains d\'outre-tombe et rites funèbres.', 'Armée des morts', [
    { n: 'Crâne hurlant', k: 'proj', p: 1.1, mp: 14, cd: 3, st: 'slow', d: 'Un crâne spectral qui glace d\'effroi la cible.' },
    { n: 'Mains d\'outre-tombe', k: 'burst', p: 1.1, mp: 20, cd: 7, r: 50, st: 'root', fx: 'snakebite', d: 'Des mains surgissent du sol et retiennent les ennemis.' },
    { n: 'Rite funèbre', k: 'nova', p: 0.9, mp: 24, cd: 10, r: 80, st: 'drain', d: 'Draine la vie autour de toi.' }]),
  chaos: MF('Chaos', '#f43f5e', 'arcane', 5, 'obscure', 'feu', 'Le désordre pur : puissance immense et effets imprévisibles.', 'Fin du monde', [
    { n: 'Orbe chaotique', k: 'proj', p: 1.3, mp: 15, cd: 3, st: 'rand', d: 'Un orbe instable à l\'effet aléatoire (brûlure, gel, poison, paralysie…).' },
    { n: 'Explosion du chaos', k: 'burst', fx: 'explosion', p: 1.8, mp: 24, cd: 7, r: 58, st: 'rand', d: 'Une explosion d\'énergie brute à l\'effet aléatoire.' },
    { n: 'Déchirure', k: 'zone', p: 0.6, mp: 28, cd: 10, r: 60, life: 4, st: 'rand', d: 'Une déchirure de la réalité ravage la zone.' }]),
  demoniaque: MF('Démoniaque', '#dc2626', 'feu', 4, 'obscure', 'feu', 'Le feu des abysses : brûlures et frénésie.', 'Avènement infernal', [
    { n: 'Feu infernal', k: 'proj', p: 1.2, mp: 15, cd: 3, st: 'burn', explode: 34, d: 'Une boule de feu noir qui explose.' },
    { n: 'Griffes du démon', k: 'nova', p: 1.4, mp: 20, cd: 6, r: 60, st: 'burn', kb: 200, d: 'Des griffes infernales lacèrent tout autour de toi.' },
    { n: 'Rage démoniaque', k: 'buff', buff: { atk: 0.35, spd: 0.15 }, mp: 22, cd: 15, dur: 8, d: 'Attaque +35 % et vitesse +15 % pendant 8 s.' }]),
  // ----- célestes et mystiques -----
  lumiere: MF('Lumière', '#fff3b0', 'lumiere', 3, 'celeste', 'lumiere', 'La lumière sacrée : rayons, jugement et soins.', 'Aube divine', [
    { n: 'Rayon sacré', k: 'beam', p: 1.2, mp: 16, cd: 4, d: 'Un rayon de lumière traverse tout en ligne droite.' },
    { n: 'Jugement', k: 'burst', fx: 'flash', p: 1.5, mp: 22, cd: 7, r: 46, st: 'stun', pillar: 1, d: 'Une colonne de lumière s\'abat sur la cible.' },
    { n: 'Bénédiction', k: 'buff', heal: 0.25, shield: 0.8, mp: 26, cd: 16, dur: 6, d: 'Soigne 25 % des PV et accorde un bouclier sacré.' }]),
  temps: MF('Temps', '#f5d0fe', 'arcane', 5, 'celeste', 'temps', 'Le cours du temps : ralentir le monde, s\'accélérer soi-même.', 'Arrêt du temps', [
    { n: 'Aiguille temporelle', k: 'proj', p: 1.1, mp: 13, cd: 2.8, st: 'slow', speed: 260, d: 'Une aiguille qui ralentit la cible.' },
    { n: 'Distorsion', k: 'zone', p: 0.2, mp: 22, cd: 9, r: 70, life: 5, st: 'freeze', d: 'Le temps se fige presque dans la zone.' },
    { n: 'Accélération', k: 'buff', buff: { spd: 0.3 }, haste: 1, cdr: 1, mp: 24, cd: 18, dur: 6, d: 'Vitesse +30 %, cadence accrue et recharges réduites de moitié.' }]),
  gravite: MF('Gravité', '#94a3b8', 'arcane', 4, 'celeste', 'gravite', 'La pesanteur : attirer, écraser, immobiliser.', 'Singularité', [
    { n: 'Masse', k: 'proj', p: 1.2, mp: 15, cd: 3.5, kb: 260, st: 'slow', d: 'Une sphère pesante qui écrase et ralentit.' },
    { n: 'Puits gravitationnel', k: 'vortex', p: 1.5, mp: 24, cd: 9, d: 'Attire violemment les ennemis puis les écrase.' },
    { n: 'Écrasement', k: 'burst', fx: 'quake', p: 1.5, mp: 22, cd: 7, r: 52, st: 'stun', d: 'La gravité centuple sur la cible et l\'assomme.' }]),
  espace: MF('Espace', '#a5b4fc', 'arcane', 5, 'celeste', 'espace', 'Les dimensions : téléportation et effondrements.', 'Effondrement stellaire', [
    { n: 'Fragment d\'étoile', k: 'proj', p: 1.2, mp: 14, cd: 3, pierce: 1, d: 'Un éclat d\'espace qui traverse les ennemis.' },
    { n: 'Pas spatial', k: 'dash', p: 1.5, mp: 18, cd: 6, d: 'Tu te téléportes près de la cible et déchires l\'espace.' },
    { n: 'Effondrement', k: 'vortex', p: 2.1, mp: 30, cd: 10, d: 'L\'espace s\'effondre sur lui-même et broie tout.' }]),
  astrale: MF('Astrale', '#c7d2fe', 'arcane', 4, 'celeste', 'lumiere', 'Les astres : étoiles filantes et constellations.', 'Nuit étoilée', [
    { n: 'Étoile filante', k: 'proj', p: 1.0, mp: 13, cd: 2.8, pierce: 1, speed: 260, d: 'Une étoile traverse les ennemis.' },
    { n: 'Pluie d\'étoiles', k: 'rain', p: 0.8, mp: 24, cd: 8, r: 50, d: 'Des étoiles s\'abattent sur la zone ciblée.' },
    { n: 'Constellation', k: 'nova', p: 1.3, mp: 24, cd: 9, r: 80, st: 'stun', d: 'Une constellation s\'illumine et frappe tout autour de toi.' }]),
  cristal: MF('Cristal', '#67e8f9', 'arcane', 3, 'celeste', 'glace', 'Les cristaux : éclats tranchants et prisons.', 'Cathédrale de cristal', [
    { n: 'Éclats de cristal', k: 'proj', p: 0.7, mp: 13, cd: 3, multi: 3, d: 'Trois éclats tranchants en éventail.' },
    { n: 'Prison de cristal', k: 'burst', fx: 'icetacle', p: 1.1, mp: 20, cd: 7, r: 44, st: 'freeze', d: 'Enferme les ennemis dans le cristal.' },
    { n: 'Égide cristalline', k: 'buff', shield: 1.3, buff: { def: 0.2 }, mp: 22, cd: 14, dur: 7, d: 'Un bouclier de cristal absorbe les dégâts.' }]),
  son: MF('Son', '#fde68a', 'vent', 2, 'celeste', 'vent', 'Les vibrations : ondes, cris et résonances.', 'Symphonie dévastatrice', [
    { n: 'Onde sonore', k: 'beam', p: 0.9, mp: 13, cd: 3, kb: 220, d: 'Une onde traverse et repousse en ligne droite.' },
    { n: 'Cri strident', k: 'nova', p: 0.8, mp: 18, cd: 7, r: 75, st: 'stun', d: 'Un cri assourdissant étourdit les ennemis proches.' },
    { n: 'Résonance', k: 'chain', p: 1.1, mp: 20, cd: 7, n2: 5, st: 'shock', d: 'Une vibration rebondit d\'ennemi en ennemi.' }]),
  illusion: MF('Illusion', '#f0abfc', 'arcane', 3, 'celeste', 'temps', 'Les mirages : tromper, désorienter, disparaître.', 'Mille reflets', [
    { n: 'Mirage', k: 'proj', p: 0.9, mp: 12, cd: 2.8, st: 'slow', d: 'Un projectile trompeur qui désoriente la cible.' },
    { n: 'Double illusoire', k: 'buff', iframes: 1.5, buff: { spd: 0.25 }, mp: 18, cd: 12, dur: 5, d: 'Tu deviens intouchable 1,5 s et plus rapide pendant 5 s.' },
    { n: 'Kaléidoscope', k: 'nova', p: 1.0, mp: 22, cd: 8, r: 75, st: 'stun', d: 'Une explosion de reflets aveugle et étourdit.' }]),
  runes: MF('Runique', '#7dd3fc', 'arcane', 3, 'celeste', 'runes', 'Les runes : pièges, explosions différées et protections.', 'Grand sceau', [
    { n: 'Trait runique', k: 'proj', p: 1.0, mp: 13, cd: 2.8, d: 'Un trait gravé de runes.' },
    { n: 'Rune explosive', k: 'burst', p: 1.6, mp: 20, cd: 7, r: 48, delay: 0.7, d: 'Grave une rune qui explose après 0,7 s.' },
    { n: 'Cercle de protection', k: 'buff', shield: 1, buff: { def: 0.25 }, mp: 22, cd: 14, dur: 7, d: 'Un cercle runique protège et renforce la défense.' }]),
};
// remplace le catalogue réduit par les 27 familles (les clés existantes sont conservées)
for (const k in MAGIC_DATA) MAGIC_FAMILIES[k] = MAGIC_DATA[k];
const MAGIC_KEYS = Object.keys(MAGIC_DATA);
function magicTier(k) { return MAGIC_TIERS[MAGIC_DATA[k].tier]; }

// ---------------- icônes de sorts générées (pixel art) ----------------
const SPELL_ICONS = {};
function spellIcon(fam, kind) {
  const key = fam + ':' + kind; if (SPELL_ICONS[key]) return SPELL_ICONS[key];
  const F = MAGIC_DATA[fam]; const cv = document.createElement('canvas'); cv.width = cv.height = 32; const c = cv.getContext('2d');
  const g = c.createRadialGradient(16, 16, 2, 16, 16, 18); g.addColorStop(0, F.col); g.addColorStop(0.55, 'rgba(' + F.rgb + ',0.35)'); g.addColorStop(1, '#120c1a');
  c.fillStyle = '#120c1a'; c.fillRect(0, 0, 32, 32); c.fillStyle = g; c.fillRect(1, 1, 30, 30);
  c.strokeStyle = 'rgba(255,240,200,0.55)'; c.strokeRect(1.5, 1.5, 29, 29);
  c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = 2;
  const P = (x, y, w, h) => c.fillRect(x, y, w, h);
  if (kind === 'proj') { c.beginPath(); c.moveTo(7, 25); c.lineTo(22, 10); c.stroke(); P(20, 7, 5, 5); P(6, 22, 3, 3); }
  else if (kind === 'burst' || kind === 'rain') { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; c.beginPath(); c.moveTo(16 + Math.cos(a) * 4, 16 + Math.sin(a) * 4); c.lineTo(16 + Math.cos(a) * 11, 16 + Math.sin(a) * 11); c.stroke(); } P(14, 14, 4, 4); }
  else if (kind === 'chain') { c.beginPath(); c.moveTo(6, 8); c.lineTo(14, 14); c.lineTo(10, 18); c.lineTo(20, 26); c.lineTo(26, 20); c.stroke(); }
  else if (kind === 'nova') { c.beginPath(); c.arc(16, 16, 10, 0, 7); c.stroke(); c.beginPath(); c.arc(16, 16, 4, 0, 7); c.fill(); }
  else if (kind === 'zone') { c.beginPath(); c.ellipse(16, 21, 11, 5, 0, 0, 7); c.stroke(); P(10, 9, 2, 6); P(15, 7, 2, 8); P(20, 10, 2, 6); }
  else if (kind === 'vortex') { c.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.45, r = i * 0.3; c.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r); } c.stroke(); }
  else if (kind === 'tornado') { for (let i = 0; i < 4; i++) P(8 + i * 2, 8 + i * 5, 16 - i * 4, 2); }
  else if (kind === 'beam') { P(4, 14, 24, 4); c.fillStyle = 'rgba(255,255,255,0.4)'; P(4, 11, 24, 10); }
  else if (kind === 'buff') { c.beginPath(); c.moveTo(16, 5); c.lineTo(26, 10); c.lineTo(24, 22); c.lineTo(16, 27); c.lineTo(8, 22); c.lineTo(6, 10); c.closePath(); c.stroke(); }
  else if (kind === 'dash') { P(6, 15, 14, 3); c.beginPath(); c.moveTo(18, 9); c.lineTo(27, 16); c.lineTo(18, 23); c.fill(); }
  else if (kind === 'lock') { c.fillStyle = '#120c1a'; c.fillRect(1, 1, 30, 30); c.strokeStyle = '#776a55'; c.strokeRect(9.5, 8.5, 13, 10); c.fillStyle = '#776a55'; c.fillRect(8, 15, 16, 11); }
  SPELL_ICONS[key] = cv; cv.url = cv.toDataURL(); return cv;
}
function lockIcon() { return spellIcon('feu', 'lock'); }
// définition affichable d'un sort inné : slot s1..s3 (famille principale) ou m2 (seconde magie)
function innateSpell(P, id) {
  const fam = id === 'm2' ? P.magic2 : P.magic; if (!fam) return null;
  const sel = typeof equippedSel === 'function' ? equippedSel(P, id) : null;
  if (sel && sel[0] === 'C') { const n = +sel.slice(1), g = grimSpell(fam, n); if (g && skillOpen(P, fam, n)) return { name: g.n, desc: g.d, fam, canvasIcon: grimIcon(fam, g), custom: g, mp: g.mp, cd: g.cd, k: 'custom' }; }
  const idx = sel && sel[0] === 'L' ? +sel.slice(1) : (id === 'm2' ? 0 : { s1: 0, s2: 1, s3: 2 }[id]); const sp = MAGIC_DATA[fam].spells[idx];
  if (!sp) return null; // emplacement 5 : pas encore de compétence débloquée
  return Object.assign({ name: sp.n, desc: sp.d, fam, canvasIcon: spellIcon(fam, sp.k) }, sp, { mp: sp.mp, cd: sp.cd });
}
// ---------------- moteur des sorts innés ----------------
function applyStatus(P, e, st, fam) {
  if (!st || e.dead) return;
  if (st === 'rand') st = choice(['burn', 'freeze', 'poison', 'shock', 'slow', 'curse', 'root']);
  const R = 1 - Math.min(0.6, (e.def.boss ? 0.5 : 0));
  if (st === 'burn') e.burn = 3;
  else if (st === 'freeze') e.freeze = Math.max(e.freeze || 0, 1.8 * R);
  else if (st === 'slow') e.slowT = Math.max(e.slowT || 0, 3);
  else if (st === 'root') e.rootT = Math.max(e.rootT || 0, 1.6 * R);
  else if (st === 'poison') addPoison(e, 2);
  else if (st === 'shock') e.shock = Math.max(e.shock || 0, 0.9 * R);
  else if (st === 'mark') addMark(P, e, 1);
  else if (st === 'curse') { e.curse = G.t + 6; }
  else if (st === 'bleed' || st === 'decay' || st === 'fear' || st === 'blind' || st === 'confuse' || st === 'vuln' || st === 'sleep' || st === 'weak') xstat(P, e, st, fam);
  else if (st === 'drain') { const h = Math.max(2, P.st8.maxhp * 0.025); P.hp = Math.min(P.st8.maxhp, P.hp + h); for (let i = 0; i < 4; i++) part(e.x, e.y - 14, { vx: (P.x - e.x) * 1.6, vy: (P.y - e.y) * 1.6, col: MAGIC_DATA[fam].col, life: 0.6, size: 2, add: true }); }
}
function innateHit(P, e, mult, sp, fam, extra) {
  const F = MAGIC_DATA[fam]; const tierMul = 1 + 0.07 * (F.tier - 1);
  const o = Object.assign({ magic: true, el: F.el, noXp: true, kb: sp.kb || 80, stun: sp.st === 'stun' ? 0.8 : 0 }, extra || {});
  strikeEnemy(P, e, mult * tierMul, o); applyStatus(P, e, sp.st, fam);
}
function castInnate(P, id, mx, my, mv, slot) {
  const sp = innateSpell(P, id); if (!sp) { toast('Ta magie innée n\'est pas encore révélée. Le Maître Mage Orvael t\'attend au Cercle des Arcanes.', '#c4b5fd'); return; }
  const S = P.st8; const cdKey = slot || id;
  if (P.cd[cdKey] > 0) return;
  const cost = Math.round(sp.mp * (S.flags.manaThrift ? 0.85 : 1));
  if (P.mp < cost) { toast('Pas assez de mana', '#7aa8ff'); sfx('ui'); return; }
  P.mp -= cost; P.cd[cdKey] = sp.cd * (P.buffs.cdr > G.t ? 0.5 : 1); P.state = 'cast'; P.animT = 0; P.castDone = false; P.st = 0;
  const fam = sp.fam, F = MAGIC_DATA[fam], col = F.col, rgb = F.rgb; const pw = S.mag; const base = (k) => (14 + pw * k) / Math.max(1, S.mag);
  sfx('cast'); ring(P.x, P.y, 22, col, 0.35);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; part(P.x + Math.cos(a) * 16, P.y + Math.sin(a) * 8, { rise: 40, col, life: 0.5, size: 2, add: true }); }
  const t = aimTarget(P, mx, my, mv, 230); if (t) P.aim = Math.atan2(t.y - P.y, t.x - P.x);
  const tx = t ? t.x : P.x + Math.cos(P.aim) * 80, ty = t ? t.y : P.y + Math.sin(P.aim) * 80;
  const snd = { feu: 'fire', lave: 'fire', demoniaque: 'fire', glace: 'ice', eau: 'ice', cristal: 'ice', foudre: 'zap', son: 'zap', vent: 'wind', temps: 'shield', lumiere: 'shield' }[fam] || 'cast';
  magicXp(P, fam, 3);
  if (sp.custom) { P.castFn = () => { sp.custom.cast(P, { fam, F, col, rgb, S, pw, base, t, tx, ty, a: P.aim, sp }); }; return; }
  P.castFn = () => {
    sfx(snd); const a = P.aim;
    if (sp.k === 'proj') {
      const n = sp.multi || 1;
      for (let i = 0; i < n; i++) {
        const aa = a + (i - (n - 1) / 2) * 0.22; const spd = sp.speed || 190;
        const pr = { kind: sp.fx === 'firelion' ? 'firelion' : 'orb', col: rgb, x: P.x + Math.cos(aa) * 18, y: P.y - 12 + Math.sin(aa) * 14, vx: Math.cos(aa) * spd, vy: Math.sin(aa) * spd, mult: base(1.1) * sp.p, magic: true, el: F.el, from: 'p', life: 1.3, r: sp.fx === 'firelion' ? 22 : 12, pierce: !!sp.pierce, kb: sp.kb, big: F.tier >= 4 };
        if (sp.fx === 'firelion') { pr.fxKey = 'firelion_' + ['up', 'left', 'down', 'right'][dirOf(Math.cos(aa), Math.sin(aa))]; pr.light = '255,140,50'; }
        if (sp.homing && t) pr.homing = t;
        pr.onHit = e => { applyStatus(P, e, sp.st, fam); if (sp.explode) { fxAt('explosion', e.x, e.y - 16, { fps: 26, layer: 1, scale: 0.7 }); hitArea(P, e.x, e.y, sp.explode, base(0.6) * sp.p, { magic: true, el: F.el, noXp: true }); } };
        spawnProj(pr);
      }
    } else if (sp.k === 'burst' || sp.k === 'rain') {
      const delay = sp.delay || (sp.fx === 'icetacle' || sp.fx === 'torrentacle' ? 0.2 : 0.35);
      G.zones2.push({ x: tx, y: ty, r: sp.r, t: 0, delay, dmg: 0, col: rgb });
      if (sp.fx) fxAt(sp.fx === 'flash' ? 'flash' : sp.fx, tx, ty - (sp.fx === 'quake' || sp.fx === 'rockspikes' ? 10 : 30), { fps: 22, layer: 0, add: sp.fx === 'flash', scale: sp.fx === 'quake' ? 1.2 : 1 });
      later(() => {
        shake(3); burst(tx, ty, 16, [col, '#fff']); ring(tx, ty, sp.r, col, 0.45, 4); addLight(tx, ty, 90, rgb);
        if (sp.pillar) G.pillars.push({ x: tx, y: ty, t: 0 });
        if (sp.k === 'rain') { for (let i = 0; i < 8; i++) later(() => { const x = tx + rnd(-sp.r, sp.r) * 0.8, y = ty + rnd(-sp.r, sp.r) * 0.5; spawnProj({ kind: 'star', col: rgb, x, y: y - 140, vx: 0, vy: 420, mult: base(0.7) * sp.p, el: F.el, magic: true, from: 'p', life: 0.33, r: 14, pierce: true, fall: y }); }, i * 70); }
        else for (const e of G.enemies) if (!e.dead && dist(tx, ty, e.x, e.y) < sp.r + e.def.r * 0.4) innateHit(P, e, base(1.3) * sp.p, sp, fam);
      }, delay * 1000);
    } else if (sp.k === 'chain') {
      const hit = []; let cur = t || { x: tx, y: ty };
      for (let i = 0; i < (sp.n2 || 4) && cur; i++) { hit.push(cur); let nx = null, bd = 120; for (const e of G.enemies) { if (e.dead || hit.includes(e)) continue; const d = dist(cur.x, cur.y, e.x, e.y); if (d < bd) { bd = d; nx = e; } } cur = nx; }
      if (fam === 'foudre') flashScreen('#fff8c0', 0.2);
      hit.forEach((h, i) => later(() => {
        if (fam === 'foudre') { fxAt('lightning', h.x, h.y - 100, { fps: 18, loop: 0.25, add: true, layer: 1 }); fxAt('lightningclaw', h.x, h.y - 36, { fps: 26, add: true, layer: 1 }); }
        G.bolts.push({ x0: i ? hit[i - 1].x : P.x, y0: i ? hit[i - 1].y - 16 : P.y - 30, x1: h.x, y1: h.y - 14, t: 0, col: rgb }); addLight(h.x, h.y, 70, rgb);
        if (h.def) innateHit(P, h, base(1.3) * sp.p * (i ? 0.75 : 1), sp, fam);
        sparks(h.x, h.y - 14, -Math.PI / 2, 8, col);
      }, i * 110));
    } else if (sp.k === 'nova') {
      ring(P.x, P.y, sp.r, col, 0.5, 5); ring(P.x, P.y, sp.r * 0.6, '#fff', 0.35, 3); shake(4); addLight(P.x, P.y, sp.r + 40, rgb);
      for (let i = 0; i < 30; i++) { const aa = i / 30 * 6.28; part(P.x, P.y - 8, { vx: Math.cos(aa) * sp.r * 2.4, vy: Math.sin(aa) * sp.r * 1.3, col, life: 0.45, size: 2, add: true }); }
      for (const e of G.enemies) if (!e.dead && dist(P.x, P.y, e.x, e.y) < sp.r + e.def.r * 0.4) innateHit(P, e, base(1.2) * sp.p, sp, fam, { kb: sp.kb || 160 });
    } else if (sp.k === 'zone') {
      G.rifts.push({ x: tx, y: ty, r: sp.r, t: -0.25, life: sp.life || 4, mult: base(1) * sp.p, el: F.el, col: rgb, slow: sp.st === 'slow' || sp.st === 'freeze', st: sp.st, fam, tick: 0 });
      ring(tx, ty, sp.r, col, 0.5, 3);
    } else if (sp.k === 'vortex') {
      G.voids.push({ x: tx, y: ty, t: 0, life: 1.6, pw: pw * sp.p * 0.55, col: rgb, el: F.el });
    } else if (sp.k === 'tornado') {
      G.tornados.push({ x: P.x + Math.cos(a) * 20, y: P.y + Math.sin(a) * 14, vx: Math.cos(a) * 70, vy: Math.sin(a) * 50, t: 0, life: 2.6 });
    } else if (sp.k === 'beam') {
      const len = 230; G.beams = G.beams || []; G.beams.push({ x: P.x, y: P.y - 14, a, len, t: 0, col: rgb });
      hitLine(P, P.x, P.y - 12, a, len, 14, base(1.2) * sp.p, { magic: true, el: F.el, noXp: true, kb: sp.kb || 120 }); shake(3);
    } else if (sp.k === 'dash') {
      const d = Math.min(150, t ? dist(P.x, P.y, t.x, t.y) - 18 : 110); const x0 = P.x, y0 = P.y;
      for (let i = 0; i < 6; i++) P.ghosts.push({ x: lerp(x0, x0 + Math.cos(a) * d, i / 6), y: lerp(y0, y0 + Math.sin(a) * d, i / 6), an: P.anim, dir: P.dir, fr: P.fr, t: 0, col: 'rgba(' + rgb + ',0.8)' });
      moveBody(P, Math.cos(a) * d, Math.sin(a) * d); P.iframes = Math.max(P.iframes, 0.35);
      hitLine(P, x0, y0 - 12, a, d + 20, 18, base(1.3) * sp.p, { magic: true, el: F.el, noXp: true, kb: 120 }); ring(P.x, P.y, 40, col, 0.4, 3);
    } else if (sp.k === 'buff') {
      if (sp.cost) P.hp = Math.max(1, P.hp - S.maxhp * sp.cost);
      if (sp.heal) { P.hp = Math.min(S.maxhp, P.hp + S.maxhp * sp.heal); num(P.x, P.y - 50, '+' + Math.round(S.maxhp * sp.heal), '#7ee06b'); }
      if (sp.shield) { P.shield = sp.dur || 6; P.shieldHp = (30 + pw * 1.6) * sp.shield; P.shieldCol = rgb; }
      if (sp.iframes) P.iframes = Math.max(P.iframes, sp.iframes);
      if (sp.haste) P.buffs.haste = G.t + (sp.dur || 6);
      if (sp.cdr) { P.buffs.cdr = G.t + (sp.dur || 6); for (const k in P.cd) P.cd[k] *= 0.5; }
      if (sp.buff) { P.innateBuff = sp.buff; P.buffs.innate = G.t + (sp.dur || 8); }
      ring(P.x, P.y, 46, col, 0.5, 4); for (let i = 0; i < 26; i++) part(P.x + rnd(-14, 14), P.y - rnd(0, 34), { rise: rnd(30, 70), col, life: 0.8, size: 2, add: true });
      refreshStats(P);
    }
  };
}
// ---------------- Magic Spin : tirage de la magie innée ----------------
function rollMagicTier(min) { const tiers = [1, 2, 3, 4, 5].filter(k => k >= (min || 1)); const tot = tiers.reduce((a, k) => a + MAGIC_TIERS[k].rate, 0); let x = Math.random() * tot; for (const k of tiers) { if ((x -= MAGIC_TIERS[k].rate) < 0) return k; } return tiers[tiers.length - 1]; }
function magicPity() { const v = store(MAGIC_PITY_KEY); return { since: v && v.since > 0 ? Math.floor(v.since) : 0 }; }
function rollMagicFamily(tier, exclude) { const pool = MAGIC_KEYS.filter(k => MAGIC_DATA[k].tier === tier && k !== exclude); return choice(pool); }
function performMagicSpin(P) {
  if (P.magic) return { err: 'Ta magie innée est déjà révélée.' };
  const snap = { magic: P.magic, magic2: P.magic2 };
  try {
    // compteur de garantie : nombre de tirages consécutifs sans magie épique ou légendaire
    const pity = magicPity(); let t1 = rollMagicTier(); let forced = false;
    if (t1 < MAGIC_PITY_MIN_TIER && pity.since + 1 >= MAGIC_PITY_AT) { t1 = rollMagicTier(MAGIC_PITY_MIN_TIER); forced = true; }
    let m1 = rollMagicFamily(t1);
    // choix de départ demandé par le joueur via l'adresse (?magie=demoniaque) : valable pour le premier tirage seulement
    let m2 = null; if (Math.random() < DOUBLE_MAGIC_RATE) { const t2 = rollMagicTier(); m2 = rollMagicFamily(t2, m1) || rollMagicFamily(t2 === 1 ? 2 : 1, m1); }
    P.magic = m1; P.magic2 = m2; P.magicT = Date.now();
    const good = MAGIC_DATA[m1].tier >= MAGIC_PITY_MIN_TIER || (m2 && MAGIC_DATA[m2].tier >= MAGIC_PITY_MIN_TIER);
    const draw = pity.since + 1;
    P.magicHist = (P.magicHist || []); P.magicHist.unshift({ m: m1, m2, t: P.magicT, pity: forced });
    if (m2) P.spells.m2 = 1;
    rebuildPlayer(P); saveGame();
    store(MAGIC_PITY_KEY, { since: good ? 0 : draw }); // le compteur n'avance qu'une fois le tirage réellement validé
    return { m1, m2, pity: forced, draw };
  } catch (e) { P.magic = snap.magic; P.magic2 = snap.magic2; console.error(e); return { err: 'Le rituel a été interrompu : rien n\'a changé, tu peux recommencer.' }; }
}
