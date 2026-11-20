'use strict';
// =====================================================================
//  VÉLORNE — REGISTRE DE DONNÉES (Partie 5)
//  Toutes les valeurs d'objets, de Spins, de recettes et d'enchantements
//  sont ici, séparées des scripts de combat. Ajouter une arme = ajouter
//  une fiche, sans toucher au moteur.
// =====================================================================

// ---------- raretés et rangs (deux classifications distinctes) ----------
const RARITY = [null,
  { id: 1, n: 'Commune', c: '#cbd5e1', maxUp: 5, ench: 1, price: 1 },
  { id: 2, n: 'Peu commune', c: '#4ade80', maxUp: 6, ench: 1, price: 2.2 },
  { id: 3, n: 'Rare', c: '#60a5fa', maxUp: 8, ench: 2, price: 4.5 },
  { id: 4, n: 'Épique', c: '#c084fc', maxUp: 9, ench: 2, price: 9 },
  { id: 5, n: 'Légendaire', c: '#fbbf24', maxUp: 10, ench: 3, price: 18 },
  { id: 6, n: 'Exceptionnelle', c: '#ff5d8f', maxUp: 10, ench: 3, price: 40 },
];
const RANKS = { S: { n: 'Rang S', c: '#ff3860', desc: 'Arme exceptionnelle à l\'identité unique, avec éveil et forme propre.' } };

// ---------- configuration globale ----------
const CONFIG = {
  inventoryBase: 60, inventoryBagBonus: 20, inventoryBagMax: 2, stashCapacity: 200,
  durabilityDefault: false,           // la durabilité peut être activée dans les Paramètres
  masteryXp: [0, 30, 90, 200, 400, 750], // seuils de maîtrise d'arme (niv. 0 à 5)
  styleXp: l => 40 * l * l,          // maîtrise de style : xp pour passer au niveau l+1
  awakenGaugeMax: 100, transformDuration: 14,
  saveVersion: 3,
};

// ---------- les sept styles de combat ----------
const STYLES = {
  epee: { n: 'Épée', icon: 'SabreSteel', combos: ['slash', 'backslash', 'halfslash'], heavy: 'slash', arc: 1.15, offhand: 'shield', tech: 'taille_tournoyante', desc: 'Polyvalente : combos en trois coups, peut porter un bouclier en main secondaire.' },
  katana: { n: 'Sabre / Katana', icon: 'Saber', combos: ['slash', 'slash', 'slash'], heavy: 'slash', arc: 1.0, tech: 'iai', desc: 'Rapide et précis, techniques de dégainé et déplacements fulgurants.' },
  arc: { n: 'Arc', icon: 'Bow', combos: ['shoot'], heavy: 'shoot', ranged: true, tech: 'pluie_fleches', desc: 'Combat à distance, tir chargé perforant.' },
  faux: { n: 'Faux', icon: 'Pike', combos: ['slash', 'slash'], heavy: 'slash', arc: 1.75, tech: 'moisson', desc: 'Larges balayages qui touchent tout autour, contrôle de foule.' },
  bouclier: { n: 'Bouclier', icon: 'ShieldColored1', combos: ['thrust', 'slash'], heavy: 'thrust', arc: 1.1, guard: 0.15, tech: 'charge_rempart', desc: 'Coups de bouclier, parades renforcées et étourdissements.' },
  dagues: { n: 'Dagues', icon: 'Dagger', combos: ['slash', 'thrust', 'slash', 'thrust'], heavy: 'thrust', arc: 1.05, tech: 'danse_lames', desc: 'Frappes très rapides, critiques fréquents, esquives économes.' },
  lance: { n: 'Lance', icon: 'Pike', combos: ['thrust', 'thrust', 'thrust'], heavy: 'thrust', arc: 0.55, tech: 'percee', desc: 'Grande allonge, estocs perforants en ligne.' },
};

// ---------- familles magiques (magie innée) utilisées par les synergies ----------
const MAGIC_FAMILIES = {
  feu: { n: 'Feu', col: '#ff7a2a' }, foudre: { n: 'Foudre', col: '#ffe066' }, glace: { n: 'Glace', col: '#9fe3ff' },
  ombre: { n: 'Ombre', col: '#8b5cf6' }, lumiere: { n: 'Lumière', col: '#fff3b0' }, poison: { n: 'Poison', col: '#7ee06b' },
  vent: { n: 'Vent', col: '#c8f7e8' }, runes: { n: 'Runes', col: '#7dd3fc' }, temps: { n: 'Temps', col: '#f5d0fe' },
  nature: { n: 'Nature', col: '#4ade80' }, ames: { n: 'Âmes', col: '#c4b5fd' }, terre: { n: 'Terre', col: '#c8a26b' },
  espace: { n: 'Espace', col: '#a5b4fc' }, gravite: { n: 'Gravité', col: '#94a3b8' },
};
// éléments de dégâts et résistances (cohérents avec les dégâts réellement utilisés)
const ELEMENTS = { physique: 'Physique', feu: 'Feu', glace: 'Glace', foudre: 'Foudre', vent: 'Vent', terre: 'Terre', poison: 'Poison', ombre: 'Ombre', lumiere: 'Lumière', eau: 'Eau', arcane: 'Arcane' };
const RES_KEYS = ['feu', 'glace', 'foudre', 'vent', 'terre', 'poison', 'ombre', 'lumiere', 'eau', 'arcane'];

// ---------- synergies arme × magie (modifient réellement le combat) ----------
// proc : appliqué sur un coup ; cost : mana ; icd : délai interne (s) ; on : déclencheur
const SYNERGIES = {
  'epee:feu': { n: 'Lame ardente', on: 'heavy', cost: 3, icd: 1, desc: 'Les attaques lourdes enflamment la cible (brûlure 3 s).' },
  'katana:foudre': { n: 'Coupe électrique', on: 'charged', cost: 5, icd: 1.5, desc: 'Les coupes chargées libèrent des arcs électriques sur 3 ennemis proches.' },
  'arc:glace': { n: 'Flèches de givre', on: 'hit', cost: 1, icd: 0.6, desc: 'Les flèches ralentissent fortement la cible ; 3 touches la cristallisent (gel 1,2 s).' },
  'faux:ombre': { n: 'Projection obscure', on: 'hit', cost: 2, icd: 1.2, desc: 'Certaines frappes projettent une onde d\'ombre derrière la cible.' },
  'bouclier:lumiere': { n: 'Impulsion sacrée', on: 'parry', cost: 4, icd: 2, desc: 'Les parades réussies libèrent une impulsion qui soigne et repousse.' },
  'dagues:poison': { n: 'Charges toxiques', on: 'hit', cost: 1, icd: 0.3, desc: 'Chaque frappe ajoute une charge de poison (max 5), qui inflige des dégâts continus.' },
  'lance:vent': { n: 'Propulsion du vent', on: 'charged', cost: 4, icd: 1.5, desc: 'Les estocs chargés propulsent le porteur et repoussent les ennemis.' },
  'epee:runes': { n: 'Inscriptions runiques', on: 'heavy', cost: 4, icd: 2, desc: 'Les attaques lourdes activent une rune qui explose après 0,6 s.' },
  'katana:temps': { n: 'Instant suspendu', on: 'combo3', cost: 5, icd: 4, desc: 'Le 3e coup du combo accélère le temps du porteur pendant 2 s.' },
  'arc:nature': { n: 'Flèches-racines', on: 'hit', cost: 2, icd: 2.5, desc: 'Les flèches font jaillir des racines qui immobilisent 1,5 s.' },
  'faux:ames': { n: 'Moisson d\'âmes', on: 'kill', cost: 0, icd: 0.5, desc: 'Vaincre un ennemi rend 3 % des PV et 4 de mana.' },
  'bouclier:terre': { n: 'Rempart minéral', on: 'block', cost: 3, icd: 6, desc: 'Bloquer un coup crée une protection de pierre (absorbe 30 dégâts).' },
  'dagues:espace': { n: 'Pas de faille', on: 'dodge', cost: 3, icd: 1, desc: 'L\'esquive devient un micro-déplacement par faille, plus long et sans endurance.' },
  'lance:gravite': { n: 'Compression', on: 'charged', cost: 4, icd: 2, desc: 'Les estocs chargés attirent les ennemis proches vers la pointe.' },
};

// ---------- effets passifs (chaque texte correspond à un effet codé) ----------
const PASSIVES = {
  burnHeavy: 'Les attaques lourdes brûlent la cible (3 s).',
  parryCounter: 'Une parade parfaite double les dégâts de l\'attaque suivante (2 s). Blocage +10 %.',
  runeHeavy: 'Les attaques lourdes déclenchent une explosion runique.',
  lightBlade: 'Dégâts de lumière +40 % contre les morts-vivants et les démons.',
  swiftStep: 'Esquive : coût d\'endurance −40 %. Vitesse +10 % pendant 2 s après une élimination.',
  thunderCharge: 'Les attaques chargées libèrent une chaîne d\'éclairs.',
  keenEdge: 'Chance critique +10 %.',
  abyssRift: 'Forme éveillée : chaque coup ouvre une petite faille d\'ombre.',
  farShot: 'Précision : +15 % de critique contre les cibles éloignées (plus de 4 cases).',
  galeArrow: 'Les flèches volent 30 % plus vite et repoussent davantage.',
  astralSplit: 'Les flèches chargées se divisent en 3 étoiles.',
  mistReap: 'Zone des attaques +20 % ; les attaques lourdes laissent une brume qui ralentit.',
  funeralMark: 'Chaque coup pose une marque ; à 3 marques, la cible subit une explosion d\'âmes.',
  bulwark: 'Blocage +15 % et coût d\'endurance du blocage −30 %.',
  heavyGuard: 'Défense +20 %, vitesse −8 %.',
  ancientAegis: 'Les parades parfaites créent une barrière de 3 s.',
  venomFang: 'Les coups ont 25 % de chances d\'empoisonner.',
  twilight: 'Alterne dégâts de lumière et d\'ombre ; critiques +20 %.',
  pierce: 'Les estocs traversent tous les ennemis alignés.',
  stormLance: 'Les estocs chargés déclenchent une rafale de vent et une étincelle.',
  dragonBlood: 'Les attaques lourdes laissent une traînée de feu.',
  multiProng: 'Chaque estoc frappe deux fois (60 % du second coup).',
  cleave: 'Les coups lourds frappent à 360°.',
  dawnFire: 'Les critiques enflamment la cible.',
};

// ---------- compétences actives (techniques) ----------
const TECHS = {
  taille_tournoyante: { n: 'Taille tournoyante', cd: 7, sta: 25, desc: 'Tournoie sur toi-même et frappe tout autour (160 % de l\'attaque).' },
  iai: { n: 'Iaï éclair', cd: 6, sta: 25, desc: 'Dégainé fulgurant : traverse la ligne d\'ennemis (200 %), invulnérable pendant la ruée.' },
  pluie_fleches: { n: 'Pluie de flèches', cd: 9, sta: 30, desc: 'Huit flèches s\'abattent sur la zone visée (70 % chacune).' },
  moisson: { n: 'Moisson', cd: 7, sta: 25, desc: 'Grand balayage qui attire les ennemis vers toi (150 %).' },
  charge_rempart: { n: 'Charge du rempart', cd: 7, sta: 25, desc: 'Charge bouclier en avant, garde levée : étourdit 1,2 s et repousse.' },
  danse_lames: { n: 'Danse des lames', cd: 8, sta: 28, desc: 'Bondit sur 4 ennemis proches (100 %, critique +30 %).' },
  percee: { n: 'Percée', cd: 7, sta: 25, desc: 'Estoc en ligne de 3,5 cases qui perce tout (200 %).' },
  jugement_celeste: { n: 'Jugement céleste', cd: 12, sta: 30, desc: 'Un pilier de lumière frappe la zone (300 %, lumière) et te soigne de 5 %.' },
  faille_abyssale: { n: 'Faille abyssale', cd: 10, sta: 30, desc: 'Ouvre une faille d\'ombre devant toi qui ronge les ennemis pendant 2 s.' },
  pluie_astrale: { n: 'Pluie astrale', cd: 12, sta: 30, desc: 'Douze étoiles tombent autour de la cible (90 % chacune, arcane).' },
  marque_funeraire: { n: 'Marque funéraire', cd: 11, sta: 30, desc: 'Balayage spectral qui pose 3 marques d\'un coup sur chaque ennemi touché.' },
  barriere_sacree: { n: 'Barrière sacrée', cd: 16, sta: 35, desc: 'Zone sacrée de 6 s : dégâts subis −50 %, projectiles ennemis détruits.' },
  pas_crepuscule: { n: 'Pas du crépuscule', cd: 10, sta: 30, desc: 'Cinq bonds alternant lumière et ombre sur les ennemis proches.' },
  charge_draconique: { n: 'Charge draconique', cd: 11, sta: 30, desc: 'Ruée de 5 cases qui laisse une traînée de feu et projette les ennemis.' },
  eclair_tranchant: { n: 'Éclair tranchant', cd: 8, sta: 28, desc: 'Iaï électrique : la ruée libère une chaîne d\'éclairs.' },
  fleche_cyclone: { n: 'Flèche-cyclone', cd: 10, sta: 30, desc: 'Tire une tornade qui avance, aspire et blesse les ennemis.' },
  lance_tempete: { n: 'Lance-tempête', cd: 9, sta: 28, desc: 'Estoc qui libère une rafale de vent en cône et repousse fortement.' },
  voile_brume: { n: 'Voile de brume', cd: 10, sta: 25, desc: 'Balayage qui laisse une brume : ennemis ralentis de 60 % pendant 4 s.' },
  morsure_venimeuse: { n: 'Morsure venimeuse', cd: 9, sta: 25, desc: 'Explosion de venin : 5 charges de poison sur les ennemis proches.' },
  vague_ecarlate: { n: 'Vague écarlate', cd: 10, sta: 30, desc: 'Une vague de feu en éventail (220 %, feu).' },
  fauche_du_chef: { n: 'Fauche du chef', cd: 9, sta: 30, desc: 'Fauche à 360° qui renverse (220 %).' },
};

// ---------- transformations (éveil d'arme) ----------
const TRANSFORMS = {
  celeste: { n: 'Forme céleste', vis: 'w_glow_blue', aura: '160,210,255', desc: 'Lame de lumière : dégâts de lumière, portée +25 %, attaques lourdes libèrent un faisceau.', atkMul: 1.3, rangeMul: 1.25, el: 'lumiere' },
  abyssale: { n: 'Forme abyssale', vis: 'w_glow_red', aura: '150,40,200', desc: 'Lame abyssale : chaque coup ouvre une faille, dégâts d\'ombre, vitesse +15 %.', atkMul: 1.3, spdMul: 1.15, el: 'ombre' },
  spectrale: { n: 'Lame spectrale', aura: '190,150,255', desc: 'La faux s\'allonge : portée +40 %, chaque coup pose 2 marques.', atkMul: 1.2, rangeMul: 1.4, el: 'ames' },
  forteresse: { n: 'Forteresse', aura: '255,230,140', desc: 'Dégâts subis −60 %, insensible aux reculs, renvoie 30 % des dégâts de mêlée.', defMul: 2.5, el: 'lumiere' },
  draconique: { n: 'Forme draconique', aura: '255,110,40', desc: 'Estocs enflammés, portée +20 %, attaque +35 %.', atkMul: 1.35, rangeMul: 1.2, el: 'feu' },
  astrale: { n: 'Forme astrale', aura: '200,190,255', desc: 'Chaque flèche se divise en 3 étoiles, dégâts arcanes.', atkMul: 1.2, el: 'arcane' },
  crepuscule: { n: 'Forme du crépuscule', aura: '255,190,240', desc: 'Vitesse +25 %, chaque critique déclenche un bond.', atkMul: 1.2, spdMul: 1.25, el: 'ombre' },
  grande_lame: { n: 'Grande lame runique', aura: '125,211,252', desc: 'La lame grandit : portée +30 %, attaque +25 %, explosions runiques.', atkMul: 1.25, rangeMul: 1.3, el: 'arcane' },
};

// ---------- fabrique de fiches d'armes (champs obligatoires de la partie 5) ----------
function mkWeapon(o) {
  return Object.assign({
    kind: 'weapon', slot: 'weapon', rank: null, criticalChance: 0.05, criticalDamage: 1.6, weight: 3, durability: 200,
    passiveEffects: [], activeSkills: [], magicSynergies: [], upgradePaths: { type: 'upgrade' }, awakening: null,
    audioAssets: { swing: 'swing', hit: 'hit' }, tradeRules: 'tradable', unique: false, stack: 1,
  }, o, { weaponId: o.id, combatStyle: o.style });
}
const WEAPON_LIST = [
  // ----- Épées -----
  mkWeapon({ id: 'ep_voyageur', name: 'Épée du voyageur', style: 'epee', category: 'Épée courte', rarity: 1, icon: 'Sword01', vis: 'w_arming', baseDamage: 12, attackSpeed: 1.0, range: 36,
    lore: 'Forgée par milliers dans les ateliers de Brumeval pour ceux qui prennent la route.', description: 'Arme polyvalente aux attaques équilibrées.',
    upgradePaths: { type: 'evolve', next: 'ep_voyageur_aguerri', req: { up: 5, mastery: 2, gold: 150, mats: { acier: 3 } } }, acquisition: 'Équipement de départ, marchands, Spin des Lames.' }),
  mkWeapon({ id: 'ep_voyageur_aguerri', name: 'Épée du voyageur aguerrie', style: 'epee', category: 'Épée longue', rarity: 2, icon: 'Sword02', vis: 'w_longsword_alt', baseDamage: 17, attackSpeed: 1.0, range: 38,
    lore: 'Une épée de voyageur qui a connu assez de combats pour être reforgée plus longue.', description: 'Évolution de l\'Épée du voyageur. Plus longue et plus solide.', passiveEffects: ['keenEdge'],
    upgradePaths: { type: 'evolve', next: 'ep_voyageur_heros', req: { up: 6, mastery: 3, gold: 400, mats: { mithril: 2, cristal_magique: 2 } } }, acquisition: 'Évolution chez le forgeron.' }),
  mkWeapon({ id: 'ep_voyageur_heros', name: 'Lame du héros voyageur', style: 'epee', category: 'Épée bâtarde', rarity: 3, icon: 'Sword05', vis: 'w_longsword', baseDamage: 24, attackSpeed: 1.0, range: 40,
    lore: 'On dit que l\'épée choisit son porteur une seconde fois, quand il a prouvé sa valeur.', description: 'Forme finale de la lignée du voyageur.', passiveEffects: ['keenEdge', 'parryCounter'], acquisition: 'Évolution chez le forgeron.' }),
  mkWeapon({ id: 'ep_batarde', name: 'Épée bâtarde', style: 'epee', category: 'Épée bâtarde', rarity: 1, icon: 'Sword03', vis: 'w_longsword_alt', baseDamage: 15, attackSpeed: 0.85, range: 40, weight: 5,
    lore: 'Assez longue pour deux mains, assez légère pour une seule.', description: 'Plus lourde : dégâts supérieurs, cadence plus lente.', acquisition: 'Fabrication (forgeron), Spin des Lames.' }),
  mkWeapon({ id: 'ep_cendres', name: 'Lame des cendres', style: 'epee', category: 'Épée longue', rarity: 2, icon: 'Sword04', vis: 'w_arming_copper', baseDamage: 14, attackSpeed: 1.0, range: 36,
    lore: 'Trempée dans les braises d\'un feu de forge qui ne s\'est jamais éteint.', description: 'Design sombre aux traces de chaleur.', passiveEffects: ['burnHeavy'], magicSynergies: ['feu'], acquisition: 'Spin des Lames, butin des démons.' }),
  mkWeapon({ id: 'ep_gardien', name: 'Épée du gardien', style: 'epee', category: 'Épée longue', rarity: 3, icon: 'Sword06', vis: 'w_longsword', baseDamage: 18, attackSpeed: 1.0, range: 38,
    lore: 'L\'arme des gardes de l\'ancienne citadelle de Vélorne, qui ne frappaient qu\'après avoir paré.', description: 'Favorise les parades et les contre-attaques.', passiveEffects: ['parryCounter'], acquisition: 'Spin des Lames, coffres.' }),
  mkWeapon({ id: 'ep_runique', name: 'Lame runique', style: 'epee', category: 'Grande épée', rarity: 4, icon: 'SabreSteel', vis: 'w_arming', baseDamage: 22, attackSpeed: 0.95, range: 40, weight: 5,
    lore: 'Chaque rune gravée sur sa lame est un mot d\'une langue que plus personne ne parle.', description: 'Ses inscriptions s\'activent lors des attaques lourdes. Transformable.', passiveEffects: ['runeHeavy'], magicSynergies: ['runes'],
    upgradePaths: { type: 'transform' }, awakening: { form: 'grande_lame', req: { mastery: 4 } }, acquisition: 'Spin des Lames (épique), fabrication rare.' }),
  mkWeapon({ id: 'ep_aube', name: 'Aube écarlate', style: 'epee', category: 'Épée longue', rarity: 5, icon: 'BrokenSword', vis: 'w_glow_red', baseDamage: 28, attackSpeed: 1.05, range: 40,
    lore: 'Forgée au lever d\'un soleil rouge, le jour où la première guerre de Vélorne prit fin.', description: 'Lame incandescente. Les critiques enflamment.', passiveEffects: ['dawnFire'], activeSkills: ['vague_ecarlate'], magicSynergies: ['feu'], acquisition: 'Spin des Lames (légendaire).' }),
  mkWeapon({ id: 'excalibur', name: 'Excalibur céleste', style: 'epee', category: 'Épée longue', rarity: 6, rank: 'S', icon: 'LightStar', vis: 'w_arming_gold', baseDamage: 32, attackSpeed: 1.05, range: 40, criticalChance: 0.1, criticalDamage: 1.8, unique: true, tradeRules: 'bound',
    lore: 'Tombée du ciel lors de l\'Éclipse des Cent Nuits, elle n\'accepte qu\'un porteur au cœur droit. Son éveil libère la lumière des anciens astres.', description: 'Arme lumineuse. Compétence de lumière, éveil en Forme céleste.',
    passiveEffects: ['lightBlade'], activeSkills: ['jugement_celeste'], magicSynergies: ['lumiere'], upgradePaths: { type: 'awaken' }, awakening: { form: 'celeste', req: { mastery: 3, mats: { coeur_eveil: 1 } } }, acquisition: 'Spin d\'Exception.' }),
  // ----- Sabres / Katanas -----
  mkWeapon({ id: 'ka_entrainement', name: 'Katana d\'entraînement', style: 'katana', category: 'Katana', rarity: 1, icon: 'Saber', vis: 'w_katana', baseDamage: 11, attackSpeed: 1.2, range: 38,
    lore: 'Lame émoussée des dojos de l\'Est, pour apprendre la discipline avant la puissance.', description: 'Arme équilibrée pour apprendre la discipline.',
    upgradePaths: { type: 'evolve', next: 'ka_crepuscule', req: { up: 5, mastery: 2, gold: 220, mats: { cristal_magique: 2, essence_spectrale: 2 } } }, acquisition: 'Équipement de départ, Spin des Lames.' }),
  mkWeapon({ id: 'ka_oriental', name: 'Sabre oriental', style: 'katana', category: 'Sabre oriental', rarity: 2, icon: 'Saber', vis: 'w_scimitar', baseDamage: 13, attackSpeed: 1.2, range: 36, criticalChance: 0.15,
    lore: 'Courbé comme le croissant de lune des caravanes du désert.', description: 'Lame courbe aux critiques fréquents.', passiveEffects: ['keenEdge'], acquisition: 'Marchands, Spin des Lames.' }),
  mkWeapon({ id: 'ka_crepuscule', name: 'Sabre du crépuscule', style: 'katana', category: 'Sabre', rarity: 3, icon: 'Saber', vis: 'w_saber', baseDamage: 16, attackSpeed: 1.35, range: 38,
    lore: 'Les duellistes du crépuscule frappaient entre le jour et la nuit, quand l\'ennemi ne voit plus rien.', description: 'Favorise les attaques rapides et les déplacements.', passiveEffects: ['swiftStep'], acquisition: 'Évolution du Katana d\'entraînement, Spin des Lames.' }),
  mkWeapon({ id: 'ka_nodachi', name: 'Nodachi', style: 'katana', category: 'Nodachi', rarity: 3, icon: 'SabreSteel', vis: 'w_longsword_alt', baseDamage: 20, attackSpeed: 0.95, range: 46, weight: 5,
    lore: 'Un sabre si long qu\'on le porte dans le dos.', description: 'Très grande allonge, cadence plus lente.', acquisition: 'Fabrication (forgeron), Spin des Lames.' }),
  mkWeapon({ id: 'ka_tonnerre', name: 'Katana du tonnerre', style: 'katana', category: 'Katana', rarity: 4, icon: 'Saber', vis: 'w_katana_thunder', baseDamage: 21, attackSpeed: 1.2, range: 38,
    lore: 'Il aurait été trempé dans l\'eau d\'un orage, la nuit où la foudre frappa sept fois la même forge.', description: 'Interactions avec la foudre : décharges sur les techniques et coups chargés.', passiveEffects: ['thunderCharge'], activeSkills: ['eclair_tranchant'], magicSynergies: ['foudre'], acquisition: 'Spin des Lames (épique).' }),
  mkWeapon({ id: 'ka_abyssal', name: 'Katana abyssal', style: 'katana', category: 'Katana', rarity: 6, rank: 'S', icon: 'Saber', vis: 'w_katana_abyss', baseDamage: 30, attackSpeed: 1.25, range: 40, criticalChance: 0.12, criticalDamage: 1.9, unique: true, tradeRules: 'bound',
    lore: 'Forgé au fond du Gouffre sans Fond, il garde en lui un fragment de l\'abîme qui ne demande qu\'à s\'ouvrir.', description: 'Failles d\'ombre, animations et éveil uniques.',
    passiveEffects: ['abyssRift'], activeSkills: ['faille_abyssale'], magicSynergies: ['ombre'], upgradePaths: { type: 'awaken' }, awakening: { form: 'abyssale', req: { mastery: 3, mats: { coeur_eveil: 1 } } }, acquisition: 'Spin d\'Exception.' }),
  // ----- Arcs -----
  mkWeapon({ id: 'arc_chasse', name: 'Arc de chasse', style: 'arc', category: 'Arc court', rarity: 1, icon: 'Bow', vis: 'w_bow', baseDamage: 11, attackSpeed: 1.0, range: 220,
    lore: 'Le compagnon des chasseurs de Sylvemousse.', description: 'Tir équilibré.',
    upgradePaths: { type: 'evolve', next: 'arc_veilleur', req: { up: 5, mastery: 2, gold: 180, mats: { bois_ancien: 3, croc: 2 } } }, acquisition: 'Équipement de départ, marchands.' }),
  mkWeapon({ id: 'arc_long', name: 'Arc long', style: 'arc', category: 'Arc long', rarity: 2, icon: 'BowLong', vis: 'w_bow_great', baseDamage: 15, attackSpeed: 0.8, range: 260,
    lore: 'Taillé dans un if centenaire.', description: 'Portée et dégâts accrus, tir plus lent.', acquisition: 'Fabrication, Spin des Lames.' }),
  mkWeapon({ id: 'arc_veilleur', name: 'Arc du veilleur', style: 'arc', category: 'Arc composite', rarity: 2, icon: 'Bow02', vis: 'w_bow_recurve', baseDamage: 14, attackSpeed: 1.0, range: 240,
    lore: 'Les veilleurs des remparts ne manquaient jamais une cible au loin.', description: 'Bonus de précision contre les cibles éloignées.', passiveEffects: ['farShot'], acquisition: 'Évolution de l\'Arc de chasse, Spin des Lames.' }),
  mkWeapon({ id: 'arc_tempetes', name: 'Arc des tempêtes', style: 'arc', category: 'Arc composite', rarity: 4, icon: 'Bow05', vis: 'w_bow_recurve_bronze', baseDamage: 19, attackSpeed: 1.05, range: 250,
    lore: 'Sa corde est tressée avec les cheveux d\'une sylphide des vents.', description: 'Interaction avec le vent et projectiles rapides.', passiveEffects: ['galeArrow'], activeSkills: ['fleche_cyclone'], magicSynergies: ['vent'], acquisition: 'Spin des Lames (épique).' }),
  mkWeapon({ id: 'arc_firmament', name: 'Arc du firmament', style: 'arc', category: 'Arc ancien', rarity: 6, rank: 'S', icon: 'Bow09', vis: 'w_bow_great', baseDamage: 27, attackSpeed: 1.05, range: 270, criticalChance: 0.12, unique: true, tradeRules: 'bound',
    lore: 'Une constellation entière dort dans le bois de cet arc. Chaque flèche emporte une étoile.', description: 'Projectiles astraux et compétences uniques.',
    passiveEffects: ['astralSplit'], activeSkills: ['pluie_astrale'], magicSynergies: ['espace'], upgradePaths: { type: 'awaken' }, awakening: { form: 'astrale', req: { mastery: 3, mats: { coeur_eveil: 1 } } }, acquisition: 'Spin d\'Exception.' }),
  // ----- Faux -----
  mkWeapon({ id: 'faux_paysanne', name: 'Faux paysanne', style: 'faux', category: 'Faux de guerre', rarity: 1, icon: 'Pike', vis: 'w_scythe', baseDamage: 13, attackSpeed: 0.9, range: 44,
    lore: 'Quand les orcs vinrent, les paysans de Brumeval prirent ce qu\'ils avaient sous la main.', description: 'Arme de base aux attaques de balayage.',
    upgradePaths: { type: 'evolve', next: 'faux_brumes', req: { up: 5, mastery: 2, gold: 240, mats: { essence_spectrale: 4 } } }, acquisition: 'Équipement de départ, marchands.' }),
  mkWeapon({ id: 'faux_brumes', name: 'Faux des brumes', style: 'faux', category: 'Grande faux', rarity: 3, icon: 'Pike', vis: 'w_scythe_mist', baseDamage: 19, attackSpeed: 0.9, range: 48,
    lore: 'Elle fauchait les marais de l\'ouest, où la brume ne se lève jamais.', description: 'Effets de brume et attaques de zone améliorées.', passiveEffects: ['mistReap'], activeSkills: ['voile_brume'], acquisition: 'Évolution de la Faux paysanne, Spin des Lames.' }),
  mkWeapon({ id: 'faux_dernier_roi', name: 'Faux du dernier roi', style: 'faux', category: 'Faux cérémonielle', rarity: 6, rank: 'S', icon: 'Pike', vis: 'w_scythe_king', baseDamage: 29, attackSpeed: 0.95, range: 50, criticalChance: 0.1, unique: true, tradeRules: 'bound',
    lore: 'Le dernier roi de Vélorne refusa de mourir tant que son royaume n\'était pas vengé. Sa faux garde les âmes de tous ceux qu\'il a jugés.', description: 'Liée aux âmes et aux marques funéraires. Obtenue par une quête.',
    passiveEffects: ['funeralMark'], activeSkills: ['marque_funeraire'], magicSynergies: ['ames'], upgradePaths: { type: 'awaken' }, awakening: { form: 'spectrale', req: { mastery: 3, mats: { coeur_eveil: 1 } } }, acquisition: 'Quête « Le dernier roi » (Spécialiste des reliques).' }),
  // ----- Boucliers -----
  mkWeapon({ id: 'bo_bois', name: 'Bouclier de bois renforcé', style: 'bouclier', category: 'Rondache', rarity: 1, icon: 'ShieldColored1', vis: 'shield_round', baseDamage: 9, attackSpeed: 1.0, range: 30, block: 0.8,
    lore: 'Du chêne cerclé de fer. Simple, mais il a sauvé bien des vies.', description: 'Défense standard.',
    upgradePaths: { type: 'evolve', next: 'bo_rondache', req: { up: 5, mastery: 2, gold: 160, mats: { acier: 3 } } }, acquisition: 'Équipement de départ, marchands.' }),
  mkWeapon({ id: 'bo_rondache', name: 'Rondache d\'acier', style: 'bouclier', category: 'Rondache', rarity: 2, icon: 'ShieldCrestedGolden', vis: 'shield_round_silver', baseDamage: 12, attackSpeed: 1.0, range: 30, block: 0.85,
    lore: 'Le bouclier des miliciens de la côte.', description: 'Bouclier d\'acier poli.', acquisition: 'Évolution, fabrication.' }),
  mkWeapon({ id: 'bo_pavois', name: 'Pavois', style: 'bouclier', category: 'Pavois', rarity: 2, icon: 'ShieldCrestedCrown', vis: 'shield_scutum', baseDamage: 11, attackSpeed: 0.85, range: 30, block: 0.92, weight: 7,
    lore: 'Un mur qu\'on porte avec soi.', description: 'Très grand bouclier : blocage maximal, plus lent.', passiveEffects: ['heavyGuard'], acquisition: 'Fabrication, Spin des Lames.' }),
  mkWeapon({ id: 'bo_bastion', name: 'Bouclier du bastion', style: 'bouclier', category: 'Bouclier moyen', rarity: 3, icon: 'ShieldCrestedLion', vis: 'shield_spartan', baseDamage: 14, attackSpeed: 1.0, range: 30, block: 0.88,
    lore: 'Porté par les défenseurs du Bastion d\'Orvain, qui tint trois ans de siège.', description: 'Favorise les blocages.', passiveEffects: ['bulwark'], acquisition: 'Spin des Lames, coffres.' }),
  mkWeapon({ id: 'egide', name: 'Égide des anciens', style: 'bouclier', category: 'Bouclier relique', rarity: 6, rank: 'S', icon: 'ShieldCrestedGolden', vis: 'shield_crusader', baseDamage: 22, attackSpeed: 1.0, range: 32, block: 0.95, unique: true, tradeRules: 'bound',
    lore: 'Les premiers rois de Vélorne y ont gravé leurs serments. Tant qu\'un serment tient, l\'Égide ne cède pas.', description: 'Barrières avancées et protection de zone.',
    passiveEffects: ['ancientAegis', 'bulwark'], activeSkills: ['barriere_sacree'], magicSynergies: ['lumiere', 'terre'], upgradePaths: { type: 'awaken' }, awakening: { form: 'forteresse', req: { mastery: 3, mats: { coeur_eveil: 1 } } }, acquisition: 'Spin d\'Exception.' }),
  // ----- Dagues -----
  mkWeapon({ id: 'da_voyageur', name: 'Dagues du voyageur', style: 'dagues', category: 'Doubles dagues', rarity: 1, icon: 'Dagger', vis: 'w_dagger', baseDamage: 7, attackSpeed: 1.6, range: 26, criticalChance: 0.15,
    lore: 'Une paire de lames légères, faciles à cacher.', description: 'Attaques rapides.',
    upgradePaths: { type: 'evolve', next: 'da_serpent', req: { up: 5, mastery: 2, gold: 200, mats: { gelee: 4, ecaille_drake: 2 } } }, acquisition: 'Équipement de départ, marchands.' }),
  mkWeapon({ id: 'da_courbes', name: 'Lames courbes', style: 'dagues', category: 'Lames courbes', rarity: 2, icon: 'Dagger03', vis: 'w_dagger', baseDamage: 9, attackSpeed: 1.6, range: 26, criticalChance: 0.18, criticalDamage: 1.9,
    lore: 'Les assassins du désert les préfèrent pour trancher plutôt que percer.', description: 'Dégâts critiques augmentés.', acquisition: 'Spin des Lames, marchands.' }),
  mkWeapon({ id: 'da_serpent', name: 'Doubles lames du serpent', style: 'dagues', category: 'Doubles dagues', rarity: 3, icon: 'Dagger05', vis: 'w_dagger_serpent', baseDamage: 11, attackSpeed: 1.65, range: 26, criticalChance: 0.15,
    lore: 'Leur acier a été trempé dans le venin d\'une vipère des marais.', description: 'Synergies avec le poison.', passiveEffects: ['venomFang'], activeSkills: ['morsure_venimeuse'], magicSynergies: ['poison'], acquisition: 'Évolution des Dagues du voyageur, Spin des Lames.' }),
  mkWeapon({ id: 'da_crepuscule', name: 'Dagues du crépuscule', style: 'dagues', category: 'Doubles dagues', rarity: 6, rank: 'S', icon: 'Dagger08', vis: 'w_dagger_twilight', baseDamage: 18, attackSpeed: 1.75, range: 28, criticalChance: 0.22, criticalDamage: 2.0, unique: true, tradeRules: 'bound',
    lore: 'L\'une fut forgée à midi, l\'autre à minuit. Ensemble, elles tranchent ce qui est entre les deux.', description: 'Combinaison de lumière et d\'ombre, déplacements et attaques exclusifs.',
    passiveEffects: ['twilight'], activeSkills: ['pas_crepuscule'], magicSynergies: ['lumiere', 'ombre'], upgradePaths: { type: 'awaken' }, awakening: { form: 'crepuscule', req: { mastery: 3, mats: { coeur_eveil: 1 } } }, acquisition: 'Spin d\'Exception.' }),
  // ----- Lances -----
  mkWeapon({ id: 'la_soldat', name: 'Lance du soldat', style: 'lance', category: 'Lance courte', rarity: 1, icon: 'Pike', vis: 'w_spear', baseDamage: 12, attackSpeed: 0.95, range: 52,
    lore: 'L\'arme de la milice de Brumeval.', description: 'Estocs simples.',
    upgradePaths: { type: 'evolve', next: 'la_chasseur', req: { up: 5, mastery: 2, gold: 200, mats: { acier: 3, bois_ancien: 2 } } }, acquisition: 'Équipement de départ, marchands.' }),
  mkWeapon({ id: 'la_trident', name: 'Trident', style: 'lance', category: 'Arme d\'hast', rarity: 2, icon: 'Pike', vis: 'w_trident', baseDamage: 12, attackSpeed: 0.95, range: 50,
    lore: 'Les pêcheurs de l\'étang de Sylvemousse s\'en servaient contre les créatures des eaux.', description: 'Chaque estoc frappe deux fois.', passiveEffects: ['multiProng'], acquisition: 'Marchands, Spin des Lames.' }),
  mkWeapon({ id: 'la_chasseur', name: 'Lance du chasseur', style: 'lance', category: 'Lance longue', rarity: 3, icon: 'Lance', vis: 'w_longspear', baseDamage: 17, attackSpeed: 0.95, range: 60,
    lore: 'Assez longue pour tenir un loup-garou à distance.', description: 'Favorise la portée et les attaques pénétrantes.', passiveEffects: ['pierce'], acquisition: 'Évolution de la Lance du soldat, Spin des Lames.' }),
  mkWeapon({ id: 'la_tempetes', name: 'Lance des tempêtes', style: 'lance', category: 'Lance mystique', rarity: 4, icon: 'Lance', vis: 'w_spear_storm', baseDamage: 21, attackSpeed: 1.0, range: 56,
    lore: 'Sa pointe attire la foudre comme un paratonnerre.', description: 'Synergie avec le vent et la foudre.', passiveEffects: ['stormLance'], activeSkills: ['lance_tempete'], magicSynergies: ['vent', 'foudre'], acquisition: 'Spin des Lames (épique).' }),
  mkWeapon({ id: 'la_grakhul', name: 'Hallebarde de Grakhul', style: 'lance', category: 'Arme d\'hast', rarity: 5, icon: 'AxeHalberd', vis: 'w_halberd', baseDamage: 27, attackSpeed: 0.78, range: 58, weight: 8,
    lore: 'Le chef de guerre orc l\'arracha à un chevalier de Vélorne. Elle a goûté le sang de deux peuples.', description: 'Arme du chef de guerre. Coups lourds à 360°.', passiveEffects: ['cleave'], activeSkills: ['fauche_du_chef'], acquisition: 'Butin de Grakhul.' }),
  mkWeapon({ id: 'la_dragon', name: 'Lance du dragon primordial', style: 'lance', category: 'Lance mystique', rarity: 6, rank: 'S', icon: 'Lance', vis: 'w_dragonspear', baseDamage: 31, attackSpeed: 1.0, range: 60, criticalChance: 0.1, unique: true, tradeRules: 'bound',
    lore: 'Taillée dans le croc du premier dragon. Elle se souvient de son vol et brûle de le reprendre.', description: 'Charge draconique et compétences uniques.',
    passiveEffects: ['dragonBlood', 'pierce'], activeSkills: ['charge_draconique'], magicSynergies: ['feu'], upgradePaths: { type: 'awaken' }, awakening: { form: 'draconique', req: { mastery: 3, mats: { coeur_eveil: 1 } } }, acquisition: 'Spin d\'Exception.' }),
];

// ---------- armures (casque, torse, jambes, bottes, gants) ----------
function A(o) { return Object.assign({ kind: 'armor', def: 0, mdef: 0, res: {}, durability: 250, tradeRules: 'tradable', stack: 1, weight: 2 }, o); }
const ARMOR_LIST = [
  A({ id: 'ar_tunique', name: 'Tunique de voyage', slot: 'torso', cat: 'light', rarity: 1, icon: 'RobeBlue', def: 2, mdef: 2, lpc: 'shirt', c: { color_1: 'teal' }, lore: 'Un vêtement de route confortable.' }),
  A({ id: 'ar_pantalon', name: 'Pantalon de voyage', slot: 'legs', cat: 'light', rarity: 1, icon: 'RobePurple', def: 1, mdef: 1, lpc: 'pants', c: { color_1: 'navy' }, lore: 'Solide et pratique.' }),
  A({ id: 'ar_bottes', name: 'Bottes de cuir', slot: 'feet', cat: 'light', rarity: 1, icon: 'BootsLeatherSoft', def: 1, spd: 0.04, lpc: 'boots', c: { color_1: 'leather' }, lore: 'Elles ont parcouru des lieues.' }),
  A({ id: 'ar_cuir', name: 'Armure de cuir', slot: 'torso', cat: 'medium', rarity: 1, icon: 'ArmorLeatherSoft', def: 6, mdef: 2, lpc: 'leather', c: { color_1: 'brown', color_2: 'brass' }, lore: 'Cuir bouilli et rivets de laiton.' }),
  A({ id: 'ar_gants', name: 'Gants de cuir', slot: 'hands', cat: 'light', rarity: 1, icon: 'GlovesLeatherSoft', def: 1, atk: 1, lpc: 'gloves', c: { color_1: 'brass' }, lore: 'Pour une meilleure prise.' }),
  A({ id: 'ar_capuche', name: 'Capuche de rôdeur', slot: 'head', cat: 'light', rarity: 1, icon: 'CapLeather', def: 1, spd: 0.03, lpc: 'hood', c: { color_1: 'forest' }, lore: 'Discrète dans les sous-bois.' }),
  A({ id: 'ar_barbute', name: 'Barbute', slot: 'head', cat: 'heavy', rarity: 2, icon: 'CapSteel', def: 5, lpc: 'helm_barbuta', c: { color_1: 'steel' }, lore: 'Un casque fermé à l\'italienne.' }),
  A({ id: 'ar_cotte', name: 'Cotte de mailles', slot: 'torso', cat: 'medium', rarity: 2, icon: 'ArmorChainMail', def: 9, mdef: 3, lpc: 'chainmail', lore: 'Des milliers d\'anneaux d\'acier.' }),
  A({ id: 'ar_plaques', name: 'Armure de plaques', slot: 'torso', cat: 'heavy', rarity: 2, icon: 'ArmorPlatemailFull', def: 14, mdef: 3, lpc: 'plate', c: { color_1: 'steel' }, lore: 'La protection d\'un chevalier.' }),
  A({ id: 'ar_jambieres', name: 'Jambières de plaques', slot: 'legs', cat: 'heavy', rarity: 2, icon: 'ArmorPlatemailPartial', def: 6, lpc: 'legs_plate', c: { color_1: 'steel' }, lore: 'Lourdes mais rassurantes.' }),
  A({ id: 'ar_solerets', name: 'Solerets de plaques', slot: 'feet', cat: 'heavy', rarity: 2, icon: 'BootsMetal', def: 4, lpc: 'feet_plate', c: { color_1: 'steel' }, lore: 'Chaque pas résonne.' }),
  A({ id: 'ar_brassards', name: 'Brassards de plaques', slot: 'hands', cat: 'heavy', rarity: 2, icon: 'GlovesSteel', def: 4, lpc: 'arms_plate', c: { color_1: 'steel' }, lore: 'Protègent mains et avant-bras.' }),
  A({ id: 'ar_legion', name: 'Cuirasse de légion', slot: 'torso', cat: 'medium', rarity: 3, icon: 'ArmorMetalLamellar', def: 11, mdef: 5, lpc: 'legion', c: { color_1: 'bronze' }, lore: 'Héritage des légions de l\'ancien empire.', res: { terre: 0.1 } }),
  A({ id: 'ar_robe', name: 'Robe d\'arcaniste', slot: 'torso', cat: 'magic', rarity: 2, icon: 'RobePurple', def: 3, mdef: 10, mag: 6, mp: 20, lpc: 'robe', c: { color_1: 'purple' }, set: 'arcaniste', lore: 'Brodée de fils d\'argent qui guident le mana.', res: { arcane: 0.15, ombre: 0.1 } }),
  A({ id: 'ar_chapeau', name: 'Chapeau d\'arcaniste', slot: 'head', cat: 'magic', rarity: 2, icon: 'HatGreen', def: 1, mdef: 6, mag: 5, lpc: 'wizard_hat', set: 'arcaniste', lore: 'Pointu, comme il se doit.', res: { arcane: 0.1 } }),
  A({ id: 'ar_gants_arc', name: 'Mitaines d\'arcaniste', slot: 'hands', cat: 'magic', rarity: 2, icon: 'GlovesGreen', def: 1, mdef: 4, mag: 4, lpc: 'gloves', c: { color_1: 'purple' }, set: 'arcaniste', lore: 'Pour sentir le mana au bout des doigts.' }),
  // ensemble de l'ombre (léger)
  A({ id: 'ar_ombre_capuche', name: 'Capuche de l\'ombre', slot: 'head', cat: 'special', rarity: 3, icon: 'CapLeather', def: 2, mdef: 3, crit: 0.03, lpc: 'hood', c: { color_1: 'black' }, set: 'ombre', lore: 'Les rôdeurs de la nuit ne montrent jamais leur visage.', res: { ombre: 0.1 } }),
  A({ id: 'ar_ombre_cuir', name: 'Cuir de l\'ombre', slot: 'torso', cat: 'special', rarity: 3, icon: 'ArmorLeatherHardStudded', def: 7, mdef: 4, crit: 0.03, lpc: 'leather', c: { color_1: 'black', color_2: 'iron' }, set: 'ombre', lore: 'Teint d\'une encre qui boit la lumière.', res: { ombre: 0.1 } }),
  A({ id: 'ar_ombre_bottes', name: 'Bottes de l\'ombre', slot: 'feet', cat: 'special', rarity: 3, icon: 'BootsLeatherHard', def: 2, spd: 0.06, lpc: 'boots', c: { color_1: 'black' }, set: 'ombre', lore: 'Silencieuses sur la pierre comme sur les feuilles.' }),
  A({ id: 'ar_ombre_gants', name: 'Gants de l\'ombre', slot: 'hands', cat: 'special', rarity: 3, icon: 'GlovesLeatherHard', def: 2, atk: 2, lpc: 'gloves', c: { color_1: 'black' }, set: 'ombre', lore: 'Doublés de soie pour ne laisser aucune trace.' }),
  // ensemble du dragon ancien (lourd)
  A({ id: 'ar_dragon_casque', name: 'Heaume du dragon ancien', slot: 'head', cat: 'heavy', rarity: 4, icon: 'HelmHorned', def: 7, mdef: 4, lpc: 'helm_horned', c: { color_1: 'copper' }, set: 'dragon', lore: 'Ses cornes ont été prises sur le crâne d\'un vieux drake.', res: { feu: 0.08 } }),
  A({ id: 'ar_dragon_torse', name: 'Cuirasse du dragon ancien', slot: 'torso', cat: 'heavy', rarity: 4, icon: 'ArmorScalemailDragonRed', def: 18, mdef: 6, lpc: 'plate', c: { color_1: 'copper' }, set: 'dragon', lore: 'Des écailles de drake rivetées sur l\'acier.', res: { feu: 0.12 } }),
  A({ id: 'ar_dragon_jambes', name: 'Jambières du dragon ancien', slot: 'legs', cat: 'heavy', rarity: 4, icon: 'ArmorScalemailDragonBronze', def: 8, mdef: 3, lpc: 'legs_plate', c: { color_1: 'copper' }, set: 'dragon', lore: 'Lourdes comme une queue de dragon.', res: { feu: 0.08 } }),
  A({ id: 'ar_dragon_bottes', name: 'Solerets du dragon ancien', slot: 'feet', cat: 'heavy', rarity: 4, icon: 'BootsGolden', def: 5, mdef: 2, lpc: 'feet_plate', c: { color_1: 'copper' }, set: 'dragon', lore: 'Griffus à la pointe.', res: { feu: 0.06 } }),
];
const ARMOR_CATS = {
  light: { n: 'Légère', desc: 'Mobilité, esquive moins coûteuse (−15 %).', dodge: 0.85 },
  medium: { n: 'Intermédiaire', desc: 'Équilibre défense et mobilité.', dodge: 1 },
  heavy: { n: 'Lourde', desc: 'Défense élevée, résiste aux interruptions ; esquive +20 % d\'endurance, vitesse −3 % par pièce.', dodge: 1.2, spd: -0.03 },
  magic: { n: 'Magique', desc: 'Résistances, mana et puissance magique.', dodge: 1 },
  special: { n: 'Spécialisée', desc: 'Bonus conditionnels et synergies.', dodge: 0.9 },
};
const SETS = {
  dragon: { n: 'Armure du dragon ancien', pieces: ['ar_dragon_casque', 'ar_dragon_torse', 'ar_dragon_jambes', 'ar_dragon_bottes'],
    bonus: { 2: { desc: 'Résistance élémentaire +10 % (feu, glace, foudre).', res: { feu: 0.1, glace: 0.1, foudre: 0.1 } }, 3: { desc: 'Écailles : les coups reçus en mêlée brûlent l\'attaquant.', flag: 'dragonScales' }, 4: { desc: 'Souffle du dragon : les attaques lourdes projettent un lion de feu.', flag: 'dragonBreath' } } },
  ombre: { n: 'Tenue de l\'ombre', pieces: ['ar_ombre_capuche', 'ar_ombre_cuir', 'ar_ombre_bottes', 'ar_ombre_gants'],
    bonus: { 2: { desc: 'Critique +5 %.', crit: 0.05 }, 3: { desc: 'Après une esquive, le prochain coup est un critique garanti.', flag: 'shadowStrike' }, 4: { desc: 'Esquive sans coût d\'endurance une fois toutes les 4 s.', flag: 'shadowStep' } } },
  arcaniste: { n: 'Atours de l\'arcaniste', pieces: ['ar_robe', 'ar_chapeau', 'ar_gants_arc'],
    bonus: { 2: { desc: 'Coût en mana des sorts −15 %.', flag: 'manaThrift' }, 3: { desc: 'Puissance magique +15 % et régénération de mana +50 %.', magMul: 0.15, flag: 'manaFlow' } } },
};

// ---------- accessoires et reliques (3 emplacements) ----------
function X(o) { return Object.assign({ kind: 'accessory', slot: 'acc', tradeRules: 'tradable', stack: 1 }, o); }
const ACCESSORY_LIST = [
  X({ id: 'ac_anneau_or', name: 'Anneau d\'or', type: 'Anneau', rarity: 1, icon: 'RingGold', atk: 3, lore: 'Un simple anneau, mais bien fait.' }),
  X({ id: 'ac_anneau_rubis', name: 'Anneau de rubis', type: 'Anneau', rarity: 3, icon: 'RingSilverJeweledRedMagic', atk: 4, crit: 0.05, critDmg: 0.15, lore: 'Le rubis pulse au rythme du cœur de son porteur.' }),
  X({ id: 'ac_anneau_saphir', name: 'Anneau de saphir', type: 'Anneau', rarity: 2, icon: 'RingJewelBlue', mp: 15, regenMp: 0.5, lore: 'Frais comme l\'eau d\'une source.' }),
  X({ id: 'ac_amulette_marees', name: 'Amulette des marées', type: 'Collier', rarity: 3, icon: 'NecklaceGoldJewelBlue', mp: 25, mag: 4, res: { eau: 0.15 }, lpc: 'necklace', lore: 'Elle se mouille quand la mer est agitée, même à cent lieues.' }),
  X({ id: 'ac_collier_vie', name: 'Collier de vitalité', type: 'Collier', rarity: 2, icon: 'NecklaceJewelRed', hp: 30, regenHp: 0.6, lpc: 'necklace', lore: 'Une goutte de sève d\'arbre-cœur dans un pendentif.' }),
  X({ id: 'ac_bracelet', name: 'Bracelet d\'endurance', type: 'Bracelet', rarity: 2, icon: 'Belt2', sta: 30, lore: 'Tressé de crin de cheval de guerre.' }),
  X({ id: 'ac_talisman', name: 'Talisman de garde', type: 'Talisman', rarity: 2, icon: 'GlyphGreen', res: { poison: 0.25, ombre: 0.1 }, statusRes: 0.2, lore: 'Gravé d\'un symbole qui éloigne les maléfices.' }),
  X({ id: 'ac_pierre', name: 'Pierre de protection', type: 'Pierre', rarity: 3, icon: 'CrystalsBlue', def: 4, mdef: 6, res: { arcane: 0.1, foudre: 0.1 }, lore: 'Une pierre de rune qui détourne les coups.' }),
  X({ id: 'ac_cape_ecarlate', name: 'Cape écarlate', type: 'Cape (visible)', rarity: 2, icon: 'CloakRed', def: 1, atk: 2, lpc: 'cape', c: { color_1: 'red' }, lore: 'Elle claque au vent pendant les charges.' }),
  X({ id: 'ac_cape_azur', name: 'Cape d\'azur', type: 'Cape (visible)', rarity: 3, icon: 'CloakBlue', def: 1, mag: 5, mp: 10, lpc: 'cape', c: { color_1: 'blue' }, lore: 'Offerte par Brumeval à son héros.' }),
  X({ id: 'ac_cape_roi', name: 'Linceul royal', type: 'Cape (visible)', rarity: 5, icon: 'CloakPurple', def: 3, mdef: 6, res: { ombre: 0.2 }, lpc: 'cape_tattered', c: { color_1: 'purple' }, lore: 'Le manteau en lambeaux du dernier roi.' }),
  // reliques (effets singuliers, activables avec la touche Relique)
  X({ id: 'rel_oeil', name: 'Œil du veilleur', type: 'Relique ancienne', kind: 'relic', rarity: 4, icon: 'LightOrb', active: { n: 'Regard du veilleur', cd: 40, dur: 20, desc: 'Révèle pendant 20 s les caches secrètes, les ennemis proches et les traces cachées.' }, lore: 'L\'œil d\'un veilleur de pierre qui gardait autrefois les frontières.' }),
  X({ id: 'rel_phenix', name: 'Sceau du phénix', type: 'Relique ancienne', kind: 'relic', rarity: 5, icon: 'GlyphRed', res: { feu: 0.2 }, passiveText: 'Lion de feu +40 % de dégâts.', active: { n: 'Embrasement', cd: 60, dur: 8, desc: 'Pendant 8 s, tes sorts de feu ne coûtent pas de mana et chaque coup brûle.' }, lore: 'Une plume de phénix scellée dans de l\'ambre rouge.' }),
  X({ id: 'rel_sablier', name: 'Sablier des anciens', type: 'Artefact divin', kind: 'relic', rarity: 6, icon: 'GlyphYellow', active: { n: 'Arrêt du temps', cd: 90, dur: 3, desc: 'Fige les ennemis pendant 3 s.' }, lore: 'Le sable qui s\'y écoule vient d\'une plage qui n\'existe plus.', unique: true }),
  X({ id: 'rel_larme', name: 'Larme de lune', type: 'Artefact divin', kind: 'relic', rarity: 6, icon: 'CrystalsPurple', mp: 20, active: { n: 'Grâce lunaire', cd: 120, dur: 0, desc: 'Soigne tous les PV et le mana et retire les altérations.' }, lore: 'Recueillie la nuit où la lune pleura sur Vélorne.', unique: true }),
];

// ---------- matériaux (provenance cohérente) ----------
function M(o) { return Object.assign({ kind: 'material', stack: 99, tradeRules: 'tradable' }, o); }
const MATERIAL_LIST = [
  M({ id: 'fer', name: 'Minerai de fer', rarity: 1, icon: 'Pebbles', price: 6, origin: 'Filons de fer dans la forêt, gobelins.' }),
  M({ id: 'acier', name: 'Lingot d\'acier', rarity: 2, icon: 'CoinsSilver', price: 25, origin: 'Fondu par le forgeron à partir de minerai de fer, orcs.' }),
  M({ id: 'mithril', name: 'Minerai de mithril', rarity: 3, icon: 'CrystalsBlue', price: 70, origin: 'Filons bleutés près des ruines et de la clairière du chef.' }),
  M({ id: 'cristal_magique', name: 'Cristal magique', rarity: 3, icon: 'CrystalsPurple', price: 55, origin: 'Nécromanciens, yeux errants, coffres.' }),
  M({ id: 'ecaille_drake', name: 'Écaille de drake', rarity: 3, icon: 'JewelsRed', price: 45, origin: 'Hommes-lézards, créatures draconiques.' }),
  M({ id: 'cendres', name: 'Cendres de créature', rarity: 2, icon: 'DiscoloredSpot', price: 18, origin: 'Démons des ronces, feux de camp gobelins.' }),
  M({ id: 'noyau_arcane', name: 'Noyau élémentaire', rarity: 3, icon: 'LightOrb', price: 60, origin: 'Yeux errants (créatures chargées d\'arcane).' }),
  M({ id: 'essence_spectrale', name: 'Essence spectrale', rarity: 2, icon: 'GlyphGreen', price: 30, origin: 'Squelettes et chauves-souris du cimetière.' }),
  M({ id: 'fragment_runique', name: 'Fragment runique', rarity: 3, icon: 'GlyphYellow', price: 50, origin: 'Nécromanciens.' }),
  M({ id: 'bois_ancien', name: 'Bois ancien', rarity: 1, icon: 'Club01', price: 8, origin: 'Souches et arbres morts de la forêt.' }),
  M({ id: 'herbe', name: 'Herbe médicinale', rarity: 1, icon: 'FoodMushroomGreen', price: 5, origin: 'Touffes lumineuses de la forêt.' }),
  M({ id: 'gelee', name: 'Gelée verte', rarity: 1, icon: 'PotionTallGreen', price: 6, origin: 'Gelées vertes.' }),
  M({ id: 'croc', name: 'Croc de bête', rarity: 2, icon: 'KeyBone', price: 15, origin: 'Loups-garous, vipères.' }),
  M({ id: 'cuir', name: 'Cuir épais', rarity: 1, icon: 'Belt1', price: 10, origin: 'Loups-garous, gobelins.' }),
  M({ id: 'fragment_arme', name: 'Fragment d\'arme', rarity: 2, icon: 'BrokenSword', price: 20, origin: 'Démantèlement d\'armes, doublons de Spin.' }),
  M({ id: 'coeur_eveil', name: 'Cœur d\'éveil', rarity: 5, icon: 'KeySun', price: 0, tradeRules: 'bound', origin: 'Boss majeurs, Spin d\'Exception. Nécessaire à l\'éveil des armes de rang S.' }),
  M({ id: 'larme_dragon', name: 'Larme de dragon', rarity: 6, icon: 'PotionTallRuby', price: 400, origin: 'Spin d\'Exception uniquement.' }),
  M({ id: 'eclat_exception', name: 'Éclat d\'Exception', rarity: 5, icon: 'LightStar', price: 0, tradeRules: 'bound', origin: 'Boss, caches secrètes, exploits, quêtes exceptionnelles. Monnaie du Spin d\'Exception.' }),
  M({ id: 'sceau_lame', name: 'Sceau de lame', rarity: 3, icon: 'KeyDagger', price: 0, tradeRules: 'bound', origin: 'Élites, coffres, caches. Remplace l\'or au Spin des Lames.' }),
];
// ---------- consommables, grimoires, reliques à identifier, objets de quête ----------
function C(o) { return Object.assign({ kind: 'consumable', stack: 20, tradeRules: 'tradable' }, o); }
const MISC_LIST = [
  C({ id: 'potion', name: 'Potion de soin', rarity: 1, icon: 'PotionShortRed', price: 30, desc: 'Rend 45 % des PV.' }),
  C({ id: 'ether', name: 'Éther', rarity: 1, icon: 'PotionShortBlue', price: 40, desc: 'Rend 60 % du mana.' }),
  C({ id: 'tonique', name: 'Tonique d\'endurance', rarity: 1, icon: 'PotionShortYellow', price: 25, desc: 'Endurance infinie pendant 10 s.' }),
  C({ id: 'antidote', name: 'Antidote', rarity: 1, icon: 'PotionShortGreen', price: 20, desc: 'Guérit le poison et protège 30 s.' }),
  C({ id: 'elixir_force', name: 'Élixir de force', rarity: 2, icon: 'PotionTallRed', price: 80, desc: 'Attaque physique +25 % pendant 60 s.' }),
  C({ id: 'elixir_garde', name: 'Élixir de garde', rarity: 2, icon: 'PotionTallSilver', price: 80, desc: 'Défenses +30 % pendant 60 s.' }),
  C({ id: 'grim_meteore', name: 'Grimoire interdit : Météore', kind: 'grimoire', stack: 1, rarity: 5, icon: 'Scroll0003', price: 0, tradeRules: 'bound', spell: 'meteore', desc: 'Apprend le sort secret Météore (à placer dans un emplacement de sort).' }),
  C({ id: 'grim_neant', name: 'Grimoire interdit : Faille du néant', kind: 'grimoire', stack: 1, rarity: 5, icon: 'Scroll0007', price: 0, tradeRules: 'bound', spell: 'neant', desc: 'Apprend le sort secret Faille du néant.' }),
  C({ id: 'relique_inconnue', name: 'Relique non identifiée', kind: 'relicraw', stack: 10, rarity: 3, icon: 'GeneralItems', price: 40, desc: 'À faire identifier par la Spécialiste des reliques.' }),
  C({ id: 'sceau_funeraire', name: 'Sceau funéraire', kind: 'quest', stack: 10, rarity: 3, icon: 'KeySkull', price: 0, tradeRules: 'quest', desc: 'Sceau royal arraché aux gardiens du cimetière. Objet de quête.' }),
  C({ id: 'chronique', name: 'Fragment de chronique', kind: 'lore', stack: 99, rarity: 4, icon: 'Scroll0001', price: 0, tradeRules: 'bound', desc: 'Une page de l\'histoire de Vélorne. Utilise-le pour la lire et l\'ajouter à ta collection.' }),
  C({ id: 'sac_agrandi', name: 'Sacoche agrandie', kind: 'upgrade', stack: 1, rarity: 2, icon: 'Belt3', price: 450, desc: 'Utiliser : +20 emplacements d\'inventaire (2 fois maximum).' }),
];
// sorts secrets appris par grimoire
const SECRET_SPELLS = {
  meteore: { name: 'Météore', icon: 'spell_firelion', mp: 40, cd: 14, desc: 'Un météore s\'écrase sur la zone visée (feu, énorme zone).' },
  neant: { name: 'Faille du néant', icon: 'spell_snakebite', mp: 34, cd: 12, desc: 'Une faille aspire les ennemis puis implose (ombre).' },
};
const LORE = [
  'Chronique I — Il y a mille ans, Vélorne n\'était qu\'un seul royaume, uni sous la Couronne d\'Aube.',
  'Chronique II — L\'Éclipse des Cent Nuits brisa la couronne. Ses éclats tombèrent sur les terres et devinrent les premières armes de rang S.',
  'Chronique III — Le dernier roi, Aldaran, mourut en défendant Brumeval. On raconte que son âme garde encore le vieux cimetière.',
  'Chronique IV — Les orcs du nord ne sont pas venus par hasard : quelque chose, au-delà des montagnes, les chasse vers le sud.',
  'Chronique V — Les sanctuaires des lames furent bâtis par les forgerons-prêtres pour rappeler les armes perdues. Ils répondent encore à l\'or.',
  'Chronique VI — Les Éclats d\'Exception sont des fragments de la Couronne d\'Aube. Les réunir, c\'est appeler ce qui fut perdu.',
];

// ---------- registre unique ----------
const REG = {};
[...WEAPON_LIST, ...ARMOR_LIST, ...ACCESSORY_LIST, ...MATERIAL_LIST, ...MISC_LIST].forEach(o => { REG[o.id] = o; });
function basePrice(o) { if (o.price !== undefined) return o.price; const r = RARITY[o.rarity || 1]; return Math.round((o.kind === 'weapon' ? 60 : o.kind === 'armor' ? 50 : 70) * r.price); }

// ---------- catégories d'inventaire ----------
const INV_CATS = [
  ['all', 'Tout'], ['weapon', 'Armes'], ['armor', 'Armures'], ['accessory', 'Accessoires'], ['relic', 'Reliques'],
  ['consumable', 'Consommables'], ['material', 'Matériaux'], ['grimoire', 'Grimoires'], ['quest', 'Quête'], ['special', 'Spéciaux'],
];
function invCatOf(o) { if (o.kind === 'relic') return 'relic'; if (o.kind === 'grimoire') return 'grimoire'; if (o.kind === 'quest') return 'quest'; if (o.kind === 'lore' || o.kind === 'upgrade' || o.kind === 'relicraw') return 'special'; return o.kind; }

// ---------- enchantements ----------
const ENCHANTS = {
  feu: { n: 'Enchantement de feu', for: 'weapon', cost: { gold: 120, mats: { cristal_magique: 1, cendres: 2 } }, desc: '20 % de chances de brûler (3 s).' },
  glace: { n: 'Enchantement de glace', for: 'weapon', cost: { gold: 120, mats: { cristal_magique: 1, essence_spectrale: 1 } }, desc: '25 % de chances de ralentir fortement (2 s).' },
  foudre: { n: 'Enchantement de foudre', for: 'weapon', cost: { gold: 140, mats: { cristal_magique: 1, noyau_arcane: 1 } }, desc: '15 % de chances de lancer une étincelle sur un ennemi proche.' },
  vol_vie: { n: 'Vol de vie conditionnel', for: 'weapon', cost: { gold: 200, mats: { fragment_runique: 2 } }, desc: 'Les coups critiques rendent 4 % des dégâts infligés en PV.' },
  anti_poison: { n: 'Protection contre le poison', for: 'armor', cost: { gold: 90, mats: { herbe: 4 } }, desc: 'Résistance au poison +25 %.' },
  rune_res: { n: 'Rune de résistance', for: 'armor', cost: { gold: 150, mats: { fragment_runique: 1 } }, desc: 'Résistance aux éléments +8 %.' },
  recuperation: { n: 'Amélioration de récupération', for: 'armor', cost: { gold: 140, mats: { gelee: 3, herbe: 3 } }, desc: 'Régénération des PV +0,5/s.' },
};

// ---------- recettes (fabrication) ----------
// station : forge, artisan, alchimie
const RECIPES = [
  { id: 'r_acier', name: 'Lingot d\'acier', station: 'forge', result: ['acier', 1], mats: { fer: 3 }, gold: 10, lvl: 1, known: true },
  { id: 'r_batarde', name: 'Épée bâtarde', station: 'forge', result: ['ep_batarde', 1], mats: { fer: 4, bois_ancien: 1 }, gold: 60, lvl: 1, known: true },
  { id: 'r_nodachi', name: 'Nodachi', station: 'forge', result: ['ka_nodachi', 1], mats: { acier: 4, cuir: 2 }, gold: 220, lvl: 3, known: false, discover: 'Coffre du camp gobelin.' },
  { id: 'r_arc_long', name: 'Arc long', station: 'forge', result: ['arc_long', 1], mats: { bois_ancien: 5, cuir: 2 }, gold: 90, lvl: 1, known: true },
  { id: 'r_pavois', name: 'Pavois', station: 'forge', result: ['bo_pavois', 1], mats: { acier: 3, bois_ancien: 3 }, gold: 120, lvl: 2, known: true },
  { id: 'r_rondache', name: 'Rondache d\'acier', station: 'forge', result: ['bo_rondache', 1], mats: { acier: 3 }, gold: 90, lvl: 1, known: true },
  { id: 'r_trident', name: 'Trident', station: 'forge', result: ['la_trident', 1], mats: { acier: 2, bois_ancien: 2 }, gold: 90, lvl: 2, known: true },
  { id: 'r_runique', name: 'Lame runique', station: 'forge', result: ['ep_runique', 1], mats: { mithril: 3, fragment_runique: 3, acier: 2 }, gold: 600, lvl: 4, known: false, discover: 'Butin du Nécromancien.' },
  { id: 'r_cotte', name: 'Cotte de mailles', station: 'forge', result: ['ar_cotte', 1], mats: { acier: 4 }, gold: 140, lvl: 2, known: true },
  { id: 'r_plaques', name: 'Armure de plaques', station: 'forge', result: ['ar_plaques', 1], mats: { acier: 6 }, gold: 260, lvl: 3, known: true },
  { id: 'r_dragon_casque', name: 'Heaume du dragon ancien', station: 'forge', result: ['ar_dragon_casque', 1], mats: { ecaille_drake: 4, acier: 2 }, gold: 300, lvl: 4, known: false, discover: 'Vaincre Grakhul.' },
  { id: 'r_dragon_torse', name: 'Cuirasse du dragon ancien', station: 'forge', result: ['ar_dragon_torse', 1], mats: { ecaille_drake: 6, acier: 4, mithril: 1 }, gold: 500, lvl: 4, known: false, discover: 'Vaincre Grakhul.' },
  { id: 'r_dragon_jambes', name: 'Jambières du dragon ancien', station: 'forge', result: ['ar_dragon_jambes', 1], mats: { ecaille_drake: 4, acier: 3 }, gold: 350, lvl: 4, known: false, discover: 'Vaincre Grakhul.' },
  { id: 'r_dragon_bottes', name: 'Solerets du dragon ancien', station: 'forge', result: ['ar_dragon_bottes', 1], mats: { ecaille_drake: 3, acier: 2 }, gold: 260, lvl: 4, known: false, discover: 'Vaincre Grakhul.' },
  { id: 'r_ombre_cuir', name: 'Cuir de l\'ombre', station: 'artisan', result: ['ar_ombre_cuir', 1], mats: { cuir: 5, essence_spectrale: 2 }, gold: 200, lvl: 2, known: true },
  { id: 'r_ombre_capuche', name: 'Capuche de l\'ombre', station: 'artisan', result: ['ar_ombre_capuche', 1], mats: { cuir: 2, essence_spectrale: 1 }, gold: 120, lvl: 2, known: true },
  { id: 'r_ombre_bottes', name: 'Bottes de l\'ombre', station: 'artisan', result: ['ar_ombre_bottes', 1], mats: { cuir: 3 }, gold: 110, lvl: 2, known: true },
  { id: 'r_ombre_gants', name: 'Gants de l\'ombre', station: 'artisan', result: ['ar_ombre_gants', 1], mats: { cuir: 2, croc: 1 }, gold: 110, lvl: 2, known: true },
  { id: 'r_anneau_saphir', name: 'Anneau de saphir', station: 'artisan', result: ['ac_anneau_saphir', 1], mats: { cristal_magique: 1, fer: 2 }, gold: 120, lvl: 1, known: true },
  { id: 'r_collier_vie', name: 'Collier de vitalité', station: 'artisan', result: ['ac_collier_vie', 1], mats: { herbe: 4, gelee: 2 }, gold: 100, lvl: 1, known: true },
  { id: 'r_bracelet', name: 'Bracelet d\'endurance', station: 'artisan', result: ['ac_bracelet', 1], mats: { cuir: 3, croc: 1 }, gold: 90, lvl: 1, known: true },
  { id: 'r_talisman', name: 'Talisman de garde', station: 'artisan', result: ['ac_talisman', 1], mats: { essence_spectrale: 2, herbe: 2 }, gold: 130, lvl: 2, known: true },
  { id: 'r_pierre', name: 'Pierre de protection', station: 'artisan', result: ['ac_pierre', 1], mats: { fragment_runique: 1, mithril: 1 }, gold: 260, lvl: 3, known: false, discover: 'Livre du cimetière (coffre).' },
  { id: 'r_robe', name: 'Robe d\'arcaniste', station: 'artisan', result: ['ar_robe', 1], mats: { cristal_magique: 2, cuir: 1 }, gold: 180, lvl: 2, known: true },
  { id: 'r_potion', name: 'Potion de soin', station: 'alchimie', result: ['potion', 1], mats: { herbe: 2, gelee: 1 }, gold: 5, lvl: 1, known: true },
  { id: 'r_ether', name: 'Éther', station: 'alchimie', result: ['ether', 1], mats: { herbe: 2, cristal_magique: 1 }, gold: 10, lvl: 1, known: true },
  { id: 'r_antidote', name: 'Antidote', station: 'alchimie', result: ['antidote', 1], mats: { herbe: 1, croc: 1 }, gold: 5, lvl: 1, known: true },
  { id: 'r_tonique', name: 'Tonique d\'endurance', station: 'alchimie', result: ['tonique', 1], mats: { herbe: 2, gelee: 2 }, gold: 8, lvl: 1, known: true },
  { id: 'r_elixir_force', name: 'Élixir de force', station: 'alchimie', result: ['elixir_force', 1], mats: { croc: 2, cendres: 1, herbe: 2 }, gold: 30, lvl: 2, known: true },
  { id: 'r_elixir_garde', name: 'Élixir de garde', station: 'alchimie', result: ['elixir_garde', 1], mats: { ecaille_drake: 1, herbe: 2 }, gold: 30, lvl: 2, known: false, discover: 'Vendue par la marchande.' },
];
const STATIONS = { forge: 'Forgeron', artisan: 'Artisan', alchimie: 'Alchimiste' };
const CRAFT_XP = l => 6 * l * l; // xp de métier pour passer au niveau l+1

// ---------- Spins ----------
const SPINS = {
  weapon: {
    n: 'Spin des Lames', where: 'Sanctuaire des lames', cost: [{ gold: 120 }, { sceau_lame: 1 }],
    rates: { 1: 50, 2: 29, 3: 14, 4: 6, 5: 1 },
    pool: () => WEAPON_LIST.filter(w => !w.rank && !w.unique && w.rarity <= 5 && !w.id.startsWith('ep_voyageur_') && w.id !== 'la_grakhul'),
    pity: [{ rar: 3, at: 10, n: 'Rare ou mieux garanti tous les 10 Spins' }, { rar: 4, at: 30, n: 'Épique ou mieux garanti tous les 30 Spins' }, { rar: 5, at: 70, n: 'Légendaire garanti au 70e Spin sans légendaire' }],
    dupFragments: { 1: 2, 2: 4, 3: 8, 4: 15, 5: 30 },
  },
  exceptional: {
    n: 'Spin d\'Exception', where: 'Autel de l\'Exception', cost: [{ eclat_exception: 1 }],
    cats: [
      { id: 's', n: 'Armes de rang S', rate: 6, items: ['excalibur', 'ka_abyssal', 'arc_firmament', 'egide', 'da_crepuscule', 'la_dragon'] },
      { id: 'relic', n: 'Reliques anciennes et artefacts divins', rate: 12, items: ['rel_oeil', 'rel_phenix', 'rel_sablier', 'rel_larme'] },
      { id: 'grim', n: 'Grimoires interdits', rate: 8, items: ['grim_meteore', 'grim_neant'] },
      { id: 'awaken', n: 'Objets d\'éveil', rate: 12, items: ['coeur_eveil'] },
      { id: 'mats', n: 'Matériaux extrêmement rares', rate: 22, items: ['larme_dragon', 'mithril', 'fragment_runique'] },
      { id: 'acc', n: 'Accessoires uniques', rate: 18, items: ['ac_anneau_rubis', 'ac_pierre', 'ac_cape_roi'] },
      { id: 'lore', n: 'Chroniques de Vélorne', rate: 22, items: ['chronique'] },
    ],
    qty: { mithril: 3, fragment_runique: 3, chronique: 1 },
    pity: [{ cat: 's', at: 40, n: 'Arme de rang S garantie au 40e Spin sans rang S' }],
    dupFragments: { 6: 60, 5: 30, 4: 15, 3: 8 },
  },
};

// ---------- butin par ennemi (provenance) ----------
const LOOT = {
  slime: { mats: [['gelee', 0.6, 1, 2]], weapon: 0.02, tier: 1 },
  bat: { mats: [['essence_spectrale', 0.25, 1, 1]], weapon: 0.02, tier: 1, quest: ['sceau_funeraire', 0.25, 'roi'] },
  bee: { mats: [['herbe', 0.3, 1, 1]], weapon: 0.02, tier: 1 },
  snake: { mats: [['croc', 0.35, 1, 1]], weapon: 0.02, tier: 1 },
  eyeball: { mats: [['noyau_arcane', 0.3, 1, 1], ['cristal_magique', 0.2, 1, 1]], weapon: 0.03, tier: 1 },
  goblin_rogue: { mats: [['fer', 0.4, 1, 2], ['cuir', 0.3, 1, 1]], weapon: 0.05, tier: 1 },
  orc_warrior: { mats: [['acier', 0.35, 1, 1], ['fer', 0.5, 1, 3]], weapon: 0.07, tier: 2, seal: 0.06 },
  wolf_brute: { mats: [['croc', 0.6, 1, 2], ['cuir', 0.5, 1, 2]], weapon: 0.06, tier: 2 },
  lizard_spearman: { mats: [['ecaille_drake', 0.45, 1, 2]], weapon: 0.06, tier: 2 },
  skeleton_archer: { mats: [['essence_spectrale', 0.5, 1, 2]], weapon: 0.05, tier: 2, relic: 0.06, quest: ['sceau_funeraire', 0.35, 'roi'] },
  dark_mage: { mats: [['fragment_runique', 0.5, 1, 1], ['cristal_magique', 0.4, 1, 2]], weapon: 0.08, tier: 2, recipe: 'r_runique', relic: 0.1 },
  demon_brute: { mats: [['cendres', 0.9, 2, 3], ['acier', 0.5, 1, 2]], weapon: 0.6, tier: 3, seal: 0.5 },
  king_specter: { mats: [['essence_spectrale', 1, 4, 6]], tier: 4, fixed: ['faux_dernier_roi', 'ac_cape_roi', 'eclat_exception', 'chronique'] },
  boss_orc_chief: { mats: [['acier', 1, 4, 6], ['mithril', 1, 2, 3]], tier: 4, fixed: ['la_grakhul', 'coeur_eveil', 'eclat_exception', 'eclat_exception', 'sceau_lame', 'chronique'], recipes: ['r_dragon_casque', 'r_dragon_torse', 'r_dragon_jambes', 'r_dragon_bottes'] },
};
// rareté des armes trouvées selon le palier de l'ennemi
const LOOT_RARITY = { 1: { 1: 80, 2: 18, 3: 2 }, 2: { 1: 55, 2: 30, 3: 13, 4: 2 }, 3: { 2: 40, 3: 40, 4: 17, 5: 3 }, 4: { 3: 40, 4: 45, 5: 15 } };

// ---------- équipement de départ par style ----------
const START_WEAPON = { epee: 'ep_voyageur', katana: 'ka_entrainement', arc: 'arc_chasse', faux: 'faux_paysanne', bouclier: 'bo_bois', dagues: 'da_voyageur', lance: 'la_soldat' };
