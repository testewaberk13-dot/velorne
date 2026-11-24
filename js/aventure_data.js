'use strict';
// =====================================================================
//  AVENTURE — CONTENU NARRATIF (données)
//  Moteur : js/aventure.js. Ce fichier ne contient que des données : on ajoute
//  un lieu, un personnage, une mission ou un arc ici, sans toucher au moteur.
//
//  Statuts (voir claude/velorne-systeme-narratif.md dans le projet) :
//  - les noms des 9 arcs, des quêtes Q001–Q072, des 60 PNJ, des régions et des factions sont CANON (cahier 2) ;
//  - les biographies, dialogues, lieux, indices et l'enchaînement des missions de ce fichier sont des PROPOSITIONS,
//    écrites pour rester compatibles avec le canon (Aether et Nyx, Couronne d'Aube, Aldaran, sceaux noirs, Malvorak).
// =====================================================================

// ---------- cycles, arcs (regroupement de la progression) ----------
// existing : arc déjà présent dans le jeu, lu depuis ses propres données (rien n'est dupliqué ni remplacé).
// range : numéros Qxxx du canon couverts par l'arc (les quêtes déjà présentes dans SIDEQ y sont rattachées automatiquement).
const CYCLES = [
  { id: 'c1', n: 'Cycle I — La Brume et le Sceau noir', d: 'De l\'éveil du héros à Brumeval jusqu\'à la chute de Malvorak.', arcs: ['main', 'a1'] },
  { id: 'c2', n: 'Cycle II — Les peuples de Vélorne', d: 'Les routes, les mers et les bêtes : ceux qui vivent au-delà de la forêt.', arcs: ['a2', 'a3', 'a4', 'a5'] },
  { id: 'c3', n: 'Cycle III — L\'héritage d\'Aether', d: 'Ce qui reste de l\'ordre d\'Aether, et ce que Nyx en a fait.', arcs: ['a6', 'a7', 'a8', 'a9'] }
];
const ARCS = {
  main: { n: 'Le Sceau noir', existing: true, d: 'La trame principale : l\'éveil, Grakhul, les quatre gardiens et la Citadelle de Malvorak.' },
  a1: { n: 'Débuts à Brumeval', range: [1, 8], d: 'Depuis l\'arrivée de Grakhul, une brume grise monte du vieux cimetière. Personne au village ne veut en parler.' },
  a2: { n: 'Les Quatre Veilleurs', range: [9, 16], d: 'Quatre gardiens veillent sur les marches du monde. Le premier se trouve aux Hurlevents.' },
  a3: { n: 'Peuples de la mer', range: [17, 24], d: 'Port-Épave, le fjord et l\'archipel : ceux qui vivent de la mer et des épaves.' },
  a4: { n: 'Routes commerciales et peuples', range: [25, 32], d: 'Les caravanes relient les Plaines d\'Or, l\'oasis et les Monts de Fer.' },
  a5: { n: 'Créatures et liens', range: [33, 40], d: 'Les bêtes de Vélorne perdent la raison. Les Gardiens du Vivant cherchent pourquoi.' },
  a6: { n: 'Archéologues d\'Aether', range: [41, 48], d: 'Les ruines d\'Aether gardent la mémoire de la Couronne d\'Aube.' },
  a7: { n: 'Ombres et corruption', range: [49, 56], d: 'Là où Nyx a laissé sa marque, la terre elle-même se corrompt.' },
  a8: { n: 'Destinées personnelles', range: [57, 64], d: 'Les histoires de ceux que le héros a croisés en chemin.' },
  a9: { n: 'Épreuves légendaires', range: [65, 72], d: 'Des épreuves réservées à ceux qui ont tout vu.' }
};

// ---------- personnages ajoutés (noms : cahier 2, groupe Brumeval ; rôles et biographies : PROPOSITION) ----------
// when : condition de présence (le personnage peut apparaître, partir ou réapparaître ailleurs).
const NARR_NPCS = [
  { key: 'edran', name: 'Édran, archiviste', look: 'npc_runemaster', tx: 38, ty: 58,
    bio: 'Archiviste de Brumeval. Il tient le registre du village depuis quarante ans et se souvient de tout ce que les autres préfèrent oublier.',
    idle: ['Un village sans mémoire répète ses erreurs. C\'est pour ça que j\'écris.', 'Le registre a deux cents ans. Chaque page a coûté une vie, ou une naissance.'] },
  { key: 'torven', name: 'Torven, bûcheron', look: 'npc_smith', tx: 31, ty: 64,
    bio: 'Bûcheron. Il coupait le bois du nord-ouest jusqu\'au jour où il a vu quelque chose près de la souche noire. Depuis, il ne quitte plus le village.',
    idle: ['Je ne retournerai pas là-bas. Pas tant que la brume monte.', 'Le bois du nord-ouest était le meilleur de la forêt…'] },
  { key: 'liora', name: 'Liora, herboriste', look: 'npc_alchemist', tx: 62, ty: 67,
    bio: 'Herboriste. Elle soigne le village avec ce que la forêt veut bien lui donner, et sent la forêt changer avant tout le monde.',
    idle: ['La forêt parle par ses plantes. En ce moment, elle tousse.', 'Les herbes de l\'étang ont un goût de cendre. Ce n\'est pas normal.'] },
  { key: 'berick', name: 'Bérick, marchand ambulant', look: 'npc_merchant', tx: 50, ty: 69, when: () => !narrDone('q005'),
    bio: 'Marchand ambulant ruiné par les gobelins du camp de l\'est. Il n\'a plus que sa langue et ses dettes.',
    idle: ['Tout ce que je possédais est dans ce camp maudit.', 'Un marchand sans marchandise, c\'est un conteur qui a faim.'] },
  { key: 'berick2', name: 'Bérick, marchand ambulant', look: 'npc_merchant', tx: 117, ty: 39, when: () => narrDone('q005'),
    bio: 'Bérick a repris la route après que tu lui as rendu son coffre. On le retrouve désormais au camp d\'Arkhan.',
    idle: ['Les caravanes d\'Arkhan paient bien, quand elles arrivent.', 'Je raconte ton histoire à chaque client. Je l\'embellis un peu.'] },
  { key: 'neria', name: 'Néria, fille du fossoyeur', look: 'npc_relic', tx: 36, ty: 67,
    bio: 'Son père entretenait le cimetière oublié avant l\'arrivée des squelettes. Elle connaît chaque tombe par son nom.',
    idle: ['Mon père disait que les morts du cimetière ne dorment pas : ils attendent.', 'Il y a une tombe sans nom au fond du cimetière. Mon père n\'a jamais voulu dire à qui elle était.'] },
  { key: 'orlan', name: 'Orlan, cartographe', look: 'npc_m_arc', tx: 60, ty: 52,
    bio: 'Ancien membre des Cartographes de l\'Aube. Il a dressé la carte de la forêt avant que ses yeux ne faiblissent. Une page manque à sa carte.',
    idle: ['Une carte n\'est jamais finie. Il reste toujours un endroit que personne n\'a osé noter.', 'Les Cartographes de l\'Aube notaient ce qu\'ils voyaient, pas ce qu\'on leur racontait.'] },
  { key: 'selyne', name: 'Selyne, la vieille voyante', look: 'npc_mage', tx: 64, ty: 63,
    bio: 'Voyante, plus âgée que le village lui-même selon les enfants. Elle parle peu, et toujours trop tard.',
    idle: ['Je vois des choses, petit. Je ne choisis pas lesquelles.', 'La brume n\'est pas un temps. C\'est un souffle.'] }
];

// ---------- lieux (points d'intérêt) ----------
// tx/ty : position souhaitée (cases) ; le moteur cherche la case libre et atteignable la plus proche.
// prop : objet visible à examiner (sinon lieu découvert en passant) ; hidden : lieu secret (n'apparaît nulle part avant découverte).
// txt : ce que raconte l'environnement (narration environnementale) ; after : texte une fois une condition remplie (conséquence visible).
const PLACES = [
  // --- Forêt de Sylvemousse (arc « Débuts à Brumeval ») ---
  { id: 'p_etang', n: 'L\'étang de Sylwen', z: 'forest', tx: 26, ty: 37, prop: 'lore_rock',
    txt: 'Une pierre plate au bord de l\'eau. On y a gravé des encoches : une par saison de pêche. Les dernières sont récentes, puis plus rien depuis l\'automne.' },
  { id: 'p_chene', n: 'Le Chêne des serments', z: 'forest', tx: 42, ty: 30, prop: 'lore_stump',
    txt: 'Au pied d\'un chêne immense, des dizaines de rubans délavés sont noués aux racines. Les gens de Brumeval venaient s\'y promettre des choses. Plus personne ne vient.' },
  { id: 'p_borne', n: 'La borne de la route de l\'est', z: 'forest', tx: 60, ty: 35, prop: 'lore_pillar',
    txt: 'Une borne de pierre, couverte de mousse : « BRUMEVAL — 2 lieues · ARKHAN — 9 lieues ». Quelqu\'un a gratté le mot « Arkhan » avec un couteau.' },
  { id: 'p_souche', n: 'La souche noire', z: 'forest', tx: 22, ty: 29, prop: 'lore_dead',
    txt: 'Un arbre mort, noirci comme par un feu qui n\'aurait pas brûlé. Sur l\'écorce, un symbole tracé à la cendre : un cercle brisé en son milieu.',
    after: { when: () => narrDone('q003'), txt: 'Le symbole a été effacé. Une trace de pas mène encore vers le cimetière, puis disparaît dans les herbes.' } },
  { id: 'p_source', n: 'La source de la forêt', z: 'forest', tx: 23, ty: 44, prop: 'lore_rock',
    txt: 'L\'eau sort d\'entre deux pierres. Elle a un reflet gris, et les herbes autour sont jaunies sur un pas de large.',
    after: { when: () => narrDone('q004'), txt: 'L\'eau est redevenue claire. Les herbes repoussent déjà autour des pierres.' } },
  { id: 'p_tombe', n: 'La tombe sans nom', z: 'ruins', tx: 12, ty: 9, prop: 'lore_grave',
    txt: 'Une tombe plus ancienne que les autres. Aucun nom : seulement une couronne gravée, fendue en deux, et une date effacée par le temps.' },
  { id: 'p_stele', n: 'La stèle de l\'Éclipse', z: 'ruins', tx: 21, ty: 15, prop: 'lore_grave',
    txt: '« Ici reposent ceux qui ont tenu pendant les Cent Nuits. Le soleil n\'est pas revenu pour eux ; il est revenu grâce à eux. »' },
  { id: 'p_ossuaire', n: 'L\'ossuaire', z: 'ruins', tx: 9, ty: 19, prop: 'lore_bones',
    txt: 'Des ossements rangés avec soin, comme si quelqu\'un continuait de les entretenir. Sur le mur, une phrase : « Le roi est tombé ici. Le souffle est resté. »' },
  { id: 'p_cercle', n: 'Le cercle de la brume', z: 'ruins', tx: 17, ty: 12, prop: 'lore_pillar', req: () => narrStep('q008') >= 0 || narrDone('q008'),
    txt: 'Des pierres disposées en cercle, à l\'endroit où la brume est la plus épaisse. L\'air y est froid, même en plein jour.',
    after: { when: () => narrDone('q008'), txt: 'Le cercle est silencieux. Plus aucune brume ne monte d\'entre les pierres.' } },
  { id: 'p_coffre', n: 'Le butin du camp gobelin', z: 'camp', tx: 80, ty: 33, prop: 'lore_fire', req: () => narrStep('q005') >= 0 && !narrDone('q005'),
    txt: 'Près du feu des gobelins, un coffre de marchand frappé des initiales « B. » : le coffre de Bérick, encore fermé.' },
  { id: 'p_lant_n', n: 'La lanterne de la porte nord', z: 'village', tx: 49, ty: 48, prop: 'lore_lamp', req: () => narrStep('q002') >= 0,
    txt: 'La lanterne est éteinte. Au fond du verre, une fine poussière grise, froide au toucher, qui ne ressemble à aucune cendre.' ,
    after: { when: () => narrWs('lanternes'), txt: 'La lanterne brûle d\'une flamme vive. Sur le verre, de fines runes gravées par Maëlys luisent doucement.' } },
  { id: 'p_lant_o', n: 'La lanterne de la porte ouest', z: 'village', tx: 28, ty: 59, prop: 'lore_lamp', req: () => narrStep('q002') >= 0,
    txt: 'Éteinte, elle aussi. La même poussière grise. Quelqu\'un — ou quelque chose — a soufflé dessus.' ,
    after: { when: () => narrWs('lanternes'), txt: 'La lanterne brûle d\'une flamme vive. Sur le verre, de fines runes gravées par Maëlys luisent doucement.' } },
  { id: 'p_lant_e', n: 'La lanterne du chemin de l\'est', z: 'village', tx: 70, ty: 57, prop: 'lore_lamp', req: () => narrStep('q002') >= 0,
    txt: 'Éteinte. La poussière forme une traînée qui mène hors du village, vers le nord-ouest.' ,
    after: { when: () => narrWs('lanternes'), txt: 'La lanterne brûle d\'une flamme vive. Sur le verre, de fines runes gravées par Maëlys luisent doucement.' } },
  { id: 'p_puits', n: 'Le Puits d\'Aube', z: 'forest', tx: 86, ty: 9, prop: 'lore_pillar', hidden: true,
    txt: 'Un puits de pierre blanche, intact au milieu des ronces. Sur la margelle, le soleil levant des Cartographes de l\'Aube, et ces mots : « Ce que l\'on cherche vraiment se trouve toujours un peu plus loin. »',
    reward: { gold: 150, item: ['eclat_exception', 1], rep: ['cartographes', 80] } },
  { id: 'p_clairiere', n: 'Les restes du camp de Grakhul', z: 'boss', tx: 49, ty: 9, req: () => !!G.flags.bossDead,
    txt: 'Les tentes de Grakhul ont brûlé. Parmi les cendres, un morceau de cire noire fondue, frappée d\'un cercle brisé.' },
  // --- Désert d'Arkhan ---
  { id: 'p_caravane', n: 'La caravane ensablée', z: 'desert', tx: 132, ty: 30, prop: 'lore_bones',
    txt: 'Des jarres brisées, des ossements de chameaux, un drapeau aux couleurs d\'Arkhan à moitié enterré. Les pillards ne laissent jamais rien de valeur.' },
  { id: 'p_mirage', n: 'La stèle du mirage', z: 'desert', tx: 165, ty: 18, prop: 'lore_pillar', hidden: true,
    txt: 'Une stèle qui semble reculer quand on avance. Gravé dessus : « Zahrak n\'a pas pris le sceau. On le lui a offert. »', reward: { gold: 200, item: ['potion', 2] } },
  // --- Pics de Givrenuit ---
  { id: 'p_cairn', n: 'Le cairn des éclaireurs', z: 'neige', tx: 228, ty: 30, prop: 'lore_rock',
    txt: 'Un tas de pierres coiffé d\'un casque gelé. Chaque éclaireur d\'Orélia y ajoute une pierre avant de monter. Beaucoup ne sont pas redescendus.' },
  { id: 'p_glace', n: 'La sentinelle prise dans la glace', z: 'neige', tx: 258, ty: 12, prop: 'lore_crystal', hidden: true,
    txt: 'Un soldat figé dans un bloc de glace bleue, la main tendue vers le sud. Son armure porte un soleil levant : l\'emblème de la Couronne d\'Aube.', reward: { gold: 260, item: ['chronique', 1] } },
  // --- Marais de Grisebrume ---
  { id: 'p_cabane', n: 'La cabane de la guérisseuse', z: 'marais', tx: 30, ty: 110, prop: 'lore_fire',
    txt: 'Une cabane sur pilotis, abandonnée. Des pots de remèdes alignés, tous étiquetés de la même écriture soignée. Le dernier pot est vide, son étiquette griffonnée : « pour moi ».' },
  { id: 'p_noyes', n: 'Le bosquet des noyés', z: 'marais', tx: 70, ty: 128, prop: 'lore_dead', hidden: true,
    txt: 'Des arbres aux racines plongées dans une eau noire. Accrochés aux branches, des dizaines de petits sacs de toile : des offrandes à Mère Grisebrume, du temps où elle soignait encore.', reward: { gold: 300, item: ['potion', 3] } },
  // --- Cratère de Cendrefeu ---
  { id: 'p_enclume', n: 'L\'enclume brisée', z: 'volcan', tx: 150, ty: 95, prop: 'lore_obsidian',
    txt: 'Une enclume gigantesque, fendue en deux. Les forgerons de Cendrefeu disent qu\'Ignaroth l\'a brisée le jour où il a accepté le sceau.' },
  { id: 'p_coulee', n: 'La coulée pétrifiée', z: 'volcan', tx: 176, ty: 130, prop: 'lore_obsidian', hidden: true,
    txt: 'Une vague de lave figée en plein élan. Dans l\'obsidienne, on distingue des silhouettes de soldats qui fuyaient.', reward: { gold: 340, item: ['mithril', 1] } },
  // --- Citadelle de Malvorak ---
  { id: 'p_banniere', n: 'La bannière déchirée', z: 'citadelle', tx: 215, ty: 100, prop: 'lore_pillar',
    txt: 'Une bannière en lambeaux, aux couleurs effacées. On devine encore un soleil levant : la Citadelle fut une forteresse de la Couronne d\'Aube avant d\'être celle de Malvorak.' },
  // --- Côte des Épaves ---
  { id: 'p_phare', n: 'Le phare éteint', z: 'cote', tx: 22, ty: 158, prop: 'lore_pillar',
    txt: 'Un phare sans feu. À l\'intérieur, un registre de veille : « Troisième nuit sans lumière. Les noyés montent quand le phare dort. »' },
  { id: 'p_epave', n: 'L\'épave de la Fortune grise', z: 'cote', tx: 70, ty: 200, prop: 'lore_bones', hidden: true,
    txt: 'Une coque retournée, à moitié enfouie dans le sable. Sur la proue, un nom : « La Fortune grise ». C\'était le navire du Capitaine Morne, avant qu\'il ne refuse de mourir.', reward: { gold: 380, item: ['potion', 3] } },
  // --- Plaines d'Or ---
  { id: 'p_moulin', n: 'Le moulin brûlé', z: 'plaines', tx: 120, ty: 160, prop: 'lore_fire',
    txt: 'Il ne reste du moulin que sa meule et des poutres noircies. Sur la meule, quelqu\'un a peint une couronne de paille : le signe de Bralok.' },
  { id: 'p_menhir', n: 'Le menhir des moissons', z: 'plaines', tx: 172, ty: 205, prop: 'lore_pillar', hidden: true,
    txt: 'Un menhir au milieu des blés, entouré de gerbes séchées. Le Hameau des Blés y dépose la première gerbe de chaque été, « pour qu\'Aether se souvienne de nous ».', reward: { gold: 420, item: ['eclat_exception', 1] } },
  // --- Forêt de Cristal ---
  { id: 'p_couronne', n: 'L\'éclat de la Couronne', z: 'cristal', tx: 240, ty: 165, prop: 'lore_crystal',
    txt: 'Un cristal plus grand que les autres, en forme de pointe brisée. Aelion pense que c\'est ici que l\'onde de la Couronne d\'Aube a frappé, la nuit où la forêt s\'est cristallisée.' },
  { id: 'p_sylphes', n: 'Le cercle des sylphes', z: 'cristal', tx: 270, ty: 205, prop: 'lore_crystal', hidden: true,
    txt: 'Des cristaux disposés en spirale. Quand le vent passe, ils jouent une mélodie de quatre notes, toujours la même.', reward: { gold: 460, item: ['potion', 4] } },
  // --- Jungle Sangvert ---
  { id: 'p_idole', n: 'L\'idole aux yeux de jade', z: 'jungle', tx: 22, ty: 232, prop: 'lore_pillar',
    txt: 'Une idole envahie par les lianes. Ses yeux de jade ont été arrachés ; à leur place, quelqu\'un a glissé deux écailles de serpent.' },
  { id: 'p_nid', n: 'Le nid des panthères', z: 'jungle', tx: 76, ty: 272, prop: 'lore_bones', hidden: true,
    txt: 'Un nid abandonné, entouré d\'os rongés. Au centre, un collier de cuir avec une clochette : les panthères d\'ombre ont été apprivoisées, un jour.', reward: { gold: 500, item: ['potion', 4] } },
  // --- Oasis des Mirages ---
  { id: 'p_puitssel', n: 'Le puits de sel', z: 'oasis', tx: 120, ty: 232, prop: 'lore_rock',
    txt: 'Un ancien puits comblé de sel. Les caravaniers y versent une poignée en passant, « pour que le djinn ait de quoi boire autre chose que nos rêves ».' },
  { id: 'p_lampe', n: 'La lampe oubliée', z: 'oasis', tx: 176, ty: 275, prop: 'lore_obsidian', hidden: true,
    txt: 'Une lampe de cuivre à demi enterrée. Elle est vide. Sur son flanc : « Azhar — prisonnier d\'Aether, libéré par Nyx ».', reward: { gold: 540, item: ['eclat_exception', 1] } },
  // --- Monts de Fer ---
  { id: 'p_forge_anc', n: 'La forge des anciens', z: 'monts', tx: 255, ty: 232, prop: 'lore_obsidian',
    txt: 'Une forge creusée dans la montagne, froide depuis des siècles. Des moules en forme de cœur sont alignés sur l\'établi : des cœurs pour des golems.' },
  { id: 'p_tombe_nain', n: 'Le tombeau du premier forgeron', z: 'monts', tx: 210, ty: 278, prop: 'lore_grave', hidden: true,
    txt: 'Une tombe taillée dans le fer. L\'épitaphe : « Il a donné un cœur au métal. Le métal ne le lui a jamais pardonné. »', reward: { gold: 580, item: ['mithril', 2] } },
  // --- Hurlevents ---
  { id: 'p_harpe', n: 'La harpe du vent', z: 'hurlevents', tx: 20, ty: 300, prop: 'lore_pillar',
    txt: 'Deux piliers reliés par des cordes tendues. Le vent y joue sans cesse. Ysold dit que c\'est la voix du premier des Quatre Veilleurs.' },
  { id: 'p_refuge_vide', n: 'Le refuge abandonné', z: 'hurlevents', tx: 80, ty: 345, prop: 'lore_fire', hidden: true,
    txt: 'Un abri de pierre, porte arrachée par le vent. Sur la table, quatre bols, trois retournés. Le quatrième est encore plein de neige.', reward: { gold: 620, item: ['potion', 4] } },
  // --- Vallée des Ombres ---
  { id: 'p_voile', n: 'La borne du Voile', z: 'ombres', tx: 120, ty: 300, prop: 'lore_pillar',
    txt: 'Une borne noire marque la limite que les Veilleurs du Voile ne franchissent jamais seuls. Des noms y sont gravés : ceux qui l\'ont franchie quand même.' },
  { id: 'p_autel_nyx', n: 'L\'autel renversé', z: 'ombres', tx: 175, ty: 348, prop: 'lore_obsidian', hidden: true,
    txt: 'Un autel couché sur le flanc. Son socle porte un cercle brisé, le même symbole que sur la souche noire de Sylvemousse.', reward: { gold: 660, item: ['eclat_exception', 1] } },
  // --- Fjord des Baleines ---
  { id: 'p_squelette', n: 'Le squelette de baleine', z: 'fjord', tx: 260, ty: 300, prop: 'lore_bones',
    txt: 'Les côtes d\'une baleine géante forment une arche sur la grève. Les enfants de Maelor y gravent leur nom le jour de leur premier voyage en mer.' },
  // --- Archipel des Sirènes ---
  { id: 'p_conque', n: 'La conque de Nérissa', z: 'archipel', tx: 50, ty: 400, prop: 'lore_rock',
    txt: 'Une conque énorme posée sur un rocher. En y collant l\'oreille, on entend un chant lointain, triste, qui ne finit jamais.' },
  // --- Îles flottantes d'Aether ---
  { id: 'p_cadran', n: 'Le cadran d\'Aether', z: 'aether', tx: 148, ty: 396, prop: 'lore_pillar',
    txt: 'Un cadran de pierre blanche dont l\'aiguille tourne à l\'envers. Eshara pense qu\'il mesure le temps qui reste avant que les îles ne retombent.' },
  // --- Terres Corrompues ---
  { id: 'p_arbre_nyx', n: 'L\'arbre qui saigne', z: 'corrompues', tx: 246, ty: 400, prop: 'lore_dead',
    txt: 'Un arbre dont l\'écorce suinte une sève noire. Rien ne pousse à trois pas de lui. Nyra vient chaque semaine mesurer le cercle : il s\'agrandit.' },
  // --- Mines de Mithral ---
  { id: 'p_wagonnet', n: 'Le dernier wagonnet', z: 'mines', tx: 50, ty: 470, prop: 'lore_rock',
    txt: 'Un wagonnet renversé, rempli de mithral brut. Les mineurs l\'ont abandonné en fuyant. Personne n\'est revenu le chercher.' },
  // --- Cavernes de Lave ---
  { id: 'p_coeur', n: 'Le cœur battant', z: 'lave', tx: 150, ty: 470, prop: 'lore_obsidian',
    txt: 'Une roche rouge qui pulse lentement, comme un cœur. Iska dit que la montagne est vivante, et que ceci est la preuve.' },
  // --- Temple Enfoui ---
  { id: 'p_fresque', n: 'La fresque des deux puissances', z: 'temple', tx: 246, ty: 472, prop: 'lore_pillar',
    txt: 'Une fresque presque intacte : une figure de lumière et une figure d\'ombre se tendent la main au-dessus d\'un monde en formation. Ni l\'une ni l\'autre n\'a l\'air menaçante.' }
];

// ---------- missions ----------
// Structure narrative en 10 parties (demande de l'utilisateur) : ctx, trig, intro, goal, steps (déroulement), disc (découvertes),
// events, outro (conclusion), cons (conséquences), link (lien avec l'arc). Les étapes sont exécutées par le moteur.
// Types d'étapes : talk {who} · read {place} · visit {place} · kill {kinds, c, spawn} · item {id, c, take} · choice {q, opts} · wait {when}
const MISSIONS = {
  q001: { arc: 'a1', num: 1, type: 'Personnage', n: 'Le registre d\'Édran', giver: 'edran', lvl: 2,
    req: () => hasStyleAny(G.player) && G.quests.main >= 1,
    ctx: 'Les gobelins du camp de l\'est ont pillé la maison d\'Édran, l\'archiviste. Les pages du registre de Brumeval ont été dispersées dans la forêt.',
    trig: 'Édran t\'interpelle à ton retour au village, une page déchirée à la main.',
    intro: 'Voyageur ! Pardonne-moi. Les gobelins ont saccagé ma maison. Le <b>registre de Brumeval</b> — deux siècles d\'histoire — a été arraché page par page. J\'en ai retrouvé une près de la porte. Les autres doivent être dans la forêt : près de l\'<b>étang</b>, peut-être au <b>Chêne des serments</b>, ou le long de la <b>route de l\'est</b>.',
    goal: 'Retrouver trois pages du registre dans la forêt.',
    steps: [
      { t: 'read', place: 'p_etang', hint: 'Une page près de l\'étang, à l\'ouest de la forêt', found: 'Coincée sous la pierre gravée, une page du registre : « An 187 — Naissance de Néria, fille du fossoyeur. La brume est montée du cimetière cette nuit-là. »', clue: ['brume_187', 'Le registre note une brume montée du cimetière à la naissance de Néria (an 187).'] },
      { t: 'read', place: 'p_chene', hint: 'Une page au Chêne des serments, au cœur de la forêt', found: 'Prise dans les rubans, une page : « An 201 — Torven et Liora se promettent l\'un à l\'autre. Mariage reporté : la brume. »', clue: ['brume_201', 'La brume revient régulièrement dans le registre (an 201).'] },
      { t: 'read', place: 'p_borne', hint: 'Une page près de la borne de la route de l\'est', found: 'Au pied de la borne, une page piétinée : « An 214 — L\'étranger au sceau noir a demandé la route du désert. Nous la lui avons indiquée. Que l\'Aube nous pardonne. »', clue: ['etranger', 'Un « étranger au sceau noir » est passé par Brumeval en l\'an 214, vers le désert.'] },
      { t: 'talk', who: 'edran', hint: 'Rapporter les pages à Édran', say: 'Trois pages… Et celle-ci — l\'étranger au sceau noir. Je l\'avais oubliée. Ou j\'ai voulu l\'oublier. Merci, voyageur. Si tu veux comprendre ce qui arrive à Brumeval, parle à ceux dont les noms sont sur ces pages : <b>Néria</b>, <b>Torven</b>, <b>Liora</b>. Et va voir <b>Maëlys</b> : elle se plaint de ses lanternes.' }
    ],
    disc: 'La brume du cimetière revient depuis des décennies. Un étranger porteur d\'un sceau noir est passé par le village en route vers le désert.',
    events: 'Aucun combat obligatoire ; la forêt reste dangereuse autour des pages.',
    outro: 'Édran recopie les pages retrouvées dans un nouveau registre.',
    cons: 'Édran devient une source d\'informations sur l\'histoire de Brumeval. Les missions de Maëlys, Torven, Liora et Néria deviennent disponibles.',
    link: 'Pose le mystère de l\'arc : la brume, et l\'étranger au sceau noir (lien avec la trame de Malvorak).',
    reward: { gold: 80, xp: 120, items: [['potion', 2]], rel: ['edran', 40], rep: ['archives', 50] } },

  q002: { arc: 'a1', num: 2, type: 'Événement', n: 'Les lanternes éteintes', giver: 'Maëlys l\'artisane', lvl: 3,
    req: () => narrDone('q001'),
    ctx: 'Chaque nuit, les lanternes des portes de Brumeval s\'éteignent toutes seules. Maëlys, qui les fabrique, est persuadée qu\'il ne s\'agit pas du vent.',
    trig: 'Édran t\'a conseillé d\'aller voir Maëlys.',
    intro: 'Mes lanternes sont les meilleures de la région, et pourtant elles s\'éteignent. Toutes. Chaque nuit. Va regarder celles des <b>portes du village</b> — nord, ouest et le chemin de l\'est. Dis-moi ce que tu vois.',
    goal: 'Examiner les trois lanternes des portes de Brumeval.',
    steps: [
      { t: 'read', place: 'p_lant_n', hint: 'Examiner la lanterne de la porte nord', found: 'De la poussière grise, froide, au fond du verre.', clue: ['poussiere', 'Une poussière grise et froide éteint les lanternes du village.'] },
      { t: 'read', place: 'p_lant_o', hint: 'Examiner la lanterne de la porte ouest', found: 'La même poussière. Elle glisse entre tes doigts comme de la brume.' },
      { t: 'read', place: 'p_lant_e', hint: 'Examiner la lanterne du chemin de l\'est', found: 'Une traînée de poussière part vers le nord-ouest. Soudain, une lueur pâle s\'élève au-dessus du chemin…' },
      { t: 'kill', kinds: ['feu_brume'], c: 3, spawn: { place: 'p_lant_e', kind: 'feu_brume', n: 3 }, hint: 'Dissiper les feux follets de brume près du chemin de l\'est' },
      { t: 'talk', who: 'Maëlys l\'artisane', hint: 'Prévenir Maëlys', say: 'Des feux follets… faits de brume ? Alors ce n\'est pas le vent. Ce qui monte du cimetière vient jusqu\'ici. Je vais graver des runes sur le verre : Thalor m\'a appris. Tiens, prends ceci pour ta peine.' }
    ],
    disc: 'La brume du cimetière est assez forte pour éteindre le feu et prendre forme.',
    events: 'Trois feux follets de brume apparaissent sur le chemin de l\'est.',
    outro: 'Maëlys grave des runes protectrices sur ses lanternes.',
    cons: 'Les lanternes de Brumeval restent allumées (les habitants le remarquent). La brume est désormais une menace reconnue.',
    link: 'La brume n\'est plus une rumeur : elle agit et se rapproche du village.',
    reward: { gold: 100, xp: 160, items: [['potion', 2]], rel: ['Maëlys l\'artisane', 40], rep: ['artisans', 50], ws: 'lanternes' } },

  q003: { arc: 'a1', num: 3, type: 'Mystère', n: 'Ce que Torven a vu', giver: 'torven', lvl: 4,
    req: () => narrDone('q001'),
    ctx: 'Torven, le bûcheron, a cessé de travailler du jour au lendemain. Il refuse d\'expliquer pourquoi.',
    trig: 'Son nom figure sur une page du registre. Il accepte de parler à quelqu\'un qui n\'est pas du village.',
    intro: 'Tu veux savoir ? Bien. Il y a un mois, je coupais près de la <b>souche noire</b>, entre l\'étang et le vieux cimetière. Un homme est sorti de la brume. Il n\'avait pas de visage. Il a tracé quelque chose sur l\'arbre, puis il m\'a regardé — sans yeux, tu comprends ? Je ne retournerai pas là-bas. Toi, peut-être.',
    goal: 'Trouver la souche noire et découvrir qui est « l\'homme sans visage ».',
    steps: [
      { t: 'read', place: 'p_souche', vague: true, hint: 'Trouver la souche noire, quelque part entre l\'étang et le vieux cimetière (au nord-ouest)', found: 'Un cercle brisé, tracé à la cendre. Derrière toi, la brume s\'épaissit…', clue: ['cercle', 'Le symbole du cercle brisé a été tracé sur la souche noire.'] },
      { t: 'kill', kinds: ['sans_visage'], c: 1, spawn: { place: 'p_souche', kind: 'sans_visage', n: 1 }, hint: 'Affronter l\'homme sans visage' },
      { t: 'talk', who: 'torven', hint: 'Raconter à Torven ce que tu as trouvé', say: 'Il s\'est dissous en brume quand tu l\'as frappé ? Et il a laissé ça — un éclat de cire noire. Ce cercle brisé… Grakhul portait le même sur son bouclier. Peut-être que je retournerai couper du bois, finalement. Liora va être contente.' }
    ],
    disc: 'L\'homme sans visage est une forme de brume qui porte le symbole du cercle brisé, comme Grakhul.',
    events: 'L\'homme sans visage apparaît quand on examine la souche.',
    outro: 'Torven reprend courage.',
    cons: 'La souche noire change d\'aspect (le symbole est effacé). Torven pourra retourner travailler.',
    link: 'Relie la brume au cercle brisé, et donc aux porteurs du sceau noir.',
    reward: { gold: 120, xp: 220, items: [['sceau_lame', 1]], rel: ['torven', 50], rep: ['garde', 40] } },

  q004: { arc: 'a1', num: 4, type: 'Région', n: 'La source amère', giver: 'liora', lvl: 4,
    req: () => narrDone('q001'),
    ctx: 'Les remèdes de Liora perdent leur effet : l\'eau de la source de la forêt a pris un goût de cendre.',
    trig: 'Liora te reconnaît : « C\'est toi qui as retrouvé les pages d\'Édran ? »',
    intro: 'L\'eau de la <b>source de la forêt</b>, près de l\'étang, s\'est gâtée. Mes remèdes ne valent plus rien. Va voir ce qui se passe là-bas, et rapporte-moi <b>3 herbes médicinales</b> saines : j\'en ferai un remède pour l\'eau.',
    goal: 'Examiner la source et rapporter trois herbes médicinales.',
    steps: [
      { t: 'read', place: 'p_source', hint: 'Examiner la source, au sud-ouest de l\'étang', found: 'L\'eau a un reflet gris. Des gelées s\'agitent dans les flaques autour.', clue: ['source', 'La brume a gâté la source de la forêt.'] },
      { t: 'kill', kinds: ['gelee_brume'], c: 4, spawn: { place: 'p_source', kind: 'gelee_brume', n: 4 }, hint: 'Éliminer les gelées corrompues autour de la source' },
      { t: 'item', id: 'herbe', c: 3, take: true, hint: 'Réunir 3 herbes médicinales (touffes brillantes de la forêt)' },
      { t: 'talk', who: 'liora', hint: 'Apporter les herbes à Liora', say: 'Elles sont parfaites. Je vais préparer le remède et le verser moi-même dans la source. Torven m\'accompagnera… s\'il ose. Prends ces potions : elles sont faites avec l\'eau d\'avant.' }
    ],
    disc: 'La brume gâte l\'eau et corrompt les créatures.',
    events: 'Des gelées corrompues sortent des flaques grises.',
    outro: 'Liora purifie la source.',
    cons: 'La source redevient claire (texte du lieu modifié). Les remèdes de Liora retrouvent leur efficacité.',
    link: 'Montre que la brume abîme la forêt elle-même, pas seulement le village.',
    reward: { gold: 120, xp: 220, items: [['potion', 4]], rel: ['liora', 50], rep: ['vivant', 60], ws: 'source' } },

  q005: { arc: 'a1', num: 5, type: 'Choix', n: 'Le coffre de Bérick', giver: 'berick', lvl: 5,
    req: () => narrDone('q001'),
    ctx: 'Bérick, un marchand ambulant, a été dépouillé par les gobelins du camp de l\'est. Il a tout perdu, sauf un secret : son coffre contient plus que des marchandises.',
    trig: 'Bérick fait les cent pas à la sortie sud du village.',
    intro: 'Les gobelins du <b>camp de l\'est</b> ont pris mon coffre. Tout ce que j\'ai. Rapporte-le-moi et je te donnerai une part. Il est frappé d\'un « B. », tu ne peux pas le manquer.',
    goal: 'Récupérer le coffre de Bérick au camp gobelin.',
    steps: [
      { t: 'read', place: 'p_coffre', hint: 'Trouver le coffre de Bérick au camp gobelin, à l\'est de la forêt', found: 'Le coffre est intact. Il est lourd : de l\'or, des étoffes… et, dans un double fond, un médaillon d\'argent gravé d\'une couronne fendue.', clue: ['medaillon', 'Bérick possède un médaillon gravé de la même couronne fendue que la tombe sans nom.'] },
      { t: 'choice', key: 'berick', hint: 'Rapporter le coffre à Bérick', who: 'berick',
        q: 'Tu tends le coffre à Bérick. Ses yeux tombent tout de suite sur le double fond. « Tu… tu as vu le médaillon ? »',
        opts: [
          ['Tout lui rendre, médaillon compris', 'rendu', 'Bérick serre le médaillon contre lui. « Il était à ma mère. Elle disait que notre famille gardait quelque chose, autrefois. Je n\'ai jamais su quoi. » Il insiste pour te donner ta part, et un peu plus.'],
          ['Garder une part de l\'or, comme convenu', 'part', 'Bérick compte ta part sans un mot, puis glisse le médaillon dans sa chemise. « Nous sommes quittes. » Il ne te regarde plus tout à fait de la même façon.'],
          ['Lui demander d\'où vient le médaillon', 'question', 'Bérick hésite, puis soupire. « De ma mère. Elle venait d\'une famille de gardiens, à Brumeval. Gardiens de quoi ? Elle parlait d\'une tombe. » Il te laisse le choix de ta récompense, et te remercie de ta franchise.']
        ] }
    ],
    disc: 'La famille de Bérick gardait autrefois une tombe à Brumeval — sans doute la tombe sans nom.',
    events: 'Le camp gobelin reste peuplé : il faut s\'y frayer un chemin.',
    outro: 'Bérick reprend la route vers le désert.',
    cons: 'Bérick quitte Brumeval et réapparaît au camp d\'Arkhan. Sa relation avec toi dépend de ton choix.',
    link: 'Le médaillon relie la tombe sans nom à une famille de gardiens.',
    reward: { gold: 150, xp: 240, items: [['potion', 2]], rep: ['garde', 40],
      choice: { rendu: { gold: 120, rel: ['berick', 80], items: [['eclat_exception', 1]] }, part: { gold: 260, rel: ['berick', 10] }, question: { gold: 180, rel: ['berick', 60], items: [['chronique', 1]] } } } },

  q006: { arc: 'a1', num: 6, type: 'Lieu', n: 'Les noms du cimetière', giver: 'neria', lvl: 6,
    req: () => narrDone('q003'),
    ctx: 'Néria est la fille du fossoyeur qui entretenait le cimetière oublié. Depuis que les squelettes l\'occupent, elle ne peut plus y aller.',
    trig: 'Néria a entendu parler du cercle brisé. Elle pense savoir où chercher.',
    intro: 'Le cercle brisé… mon père en parlait, à la fin. Il disait que le cimetière <b>garde la mémoire</b> de ce qui s\'est passé. Va lire la <b>tombe sans nom</b>, la <b>stèle de l\'Éclipse</b> et l\'<b>ossuaire</b>. Puis reviens me dire ce qu\'ils racontent.',
    goal: 'Lire trois lieux du cimetière oublié.',
    steps: [
      { t: 'read', place: 'p_tombe', hint: 'Lire la tombe sans nom, au fond du cimetière (nord-ouest)', found: 'La couronne fendue, la même que sur le médaillon de Bérick.', clue: ['tombe', 'La tombe sans nom porte une couronne fendue.'] },
      { t: 'read', place: 'p_stele', hint: 'Lire la stèle de l\'Éclipse', found: 'La stèle parle des Cent Nuits — l\'Éclipse, quand le soleil a disparu.' },
      { t: 'read', place: 'p_ossuaire', hint: 'Lire l\'inscription de l\'ossuaire', found: '« Le roi est tombé ici. Le souffle est resté. »', clue: ['souffle', 'Aldaran est tombé au cimetière, et « le souffle est resté ».'] },
      { t: 'talk', who: 'neria', hint: 'Revenir voir Néria', say: '« Le souffle est resté »… Le roi Aldaran est mort ici, à Brumeval. Et ce qui l\'a tué n\'est jamais vraiment parti. La brume, c\'est ça : un reste de Nyx, accroché à l\'endroit où le roi est tombé. Il faut en parler à <b>Selyne</b>. Elle seule sait comment on apaise un souffle.' }
    ],
    disc: 'La brume serait un souffle de Nyx resté là où Aldaran est tombé.',
    events: 'Le cimetière est infesté de squelettes.',
    outro: 'Néria comprend enfin les dernières paroles de son père.',
    cons: 'Néria t\'oriente vers Selyne. Séraphine réagit si tu as déjà apaisé le Spectre du dernier roi.',
    link: 'Révélation centrale de l\'arc : l\'origine de la brume.',
    reward: { gold: 160, xp: 300, items: [['chronique', 1]], rel: ['neria', 60], rep: ['archives', 60] } },

  q007: { arc: 'a1', num: 7, type: 'Secret', n: 'La page manquante d\'Orlan', giver: 'orlan', lvl: 5,
    req: () => narrDone('q001'),
    ctx: 'Orlan, ancien cartographe, n\'a jamais terminé sa carte de la forêt : un lieu dont il a entendu parler n\'y figure pas.',
    trig: 'Orlan remarque que tu explores beaucoup.',
    intro: 'Les Cartographes de l\'Aube notaient tout. Sauf un endroit : le <b>Puits d\'Aube</b>. Je n\'ai jamais su où il était. Je sais seulement ce que disait mon maître : « Au bout du monde connu de la forêt, là où le soleil se lève le premier. » Trouve-le. Je ne peux pas te dire mieux.',
    goal: 'Trouver le Puits d\'Aube, sans autre indication que l\'énigme d\'Orlan.',
    steps: [
      { t: 'visit', place: 'p_puits', vague: true, hint: '« Là où le soleil se lève le premier », au bout du monde connu de la forêt', found: 'Le Puits d\'Aube existe vraiment.' },
      { t: 'talk', who: 'orlan', hint: 'Raconter ta découverte à Orlan', say: 'Au nord-est, tout au bout… Bien sûr. Le soleil se lève à l\'est, et le nord-est est le premier coin de forêt qu\'il touche. Je vais enfin pouvoir finir ma carte. Les Cartographes de l\'Aube sauront ton nom.' }
    ],
    disc: 'Les Cartographes de l\'Aube avaient un lieu secret dans la forêt.',
    events: 'Aucun marqueur : seule l\'énigme guide le joueur.',
    outro: 'Orlan complète sa carte.',
    cons: 'Les Cartographes de l\'Aube te remarquent (réputation).',
    link: 'Mission secrète : récompense la curiosité et l\'exploration libre.',
    reward: { gold: 140, xp: 260, items: [['potion', 2]], rel: ['orlan', 60], rep: ['cartographes', 80] } },

  q008: { arc: 'a1', num: 8, type: 'Principale de l\'arc', n: 'Le souffle du roi', giver: 'selyne', lvl: 7,
    req: () => narrDone('q006') && narrDone('q002') && narrDone('q004'),
    ctx: 'La brume est un souffle de Nyx resté là où Aldaran est tombé. Les sceaux noirs l\'ont réveillé.',
    trig: 'Néria t\'envoie voir Selyne, la vieille voyante.',
    intro: 'Je t\'attendais. Ne fais pas cette tête : je vois des choses. Le souffle qui monte du cimetière s\'est réveillé le jour où le premier sceau noir a traversé la forêt. Va au <b>cercle de la brume</b>, au cœur du cimetière. Ce qui s\'y cache prendra forme. Bats-le, et le souffle s\'apaisera — pour un temps.',
    goal: 'Affronter ce qui se cache dans le cercle de la brume.',
    steps: [
      { t: 'read', place: 'p_cercle', hint: 'Entrer dans le cercle de la brume, au cœur du cimetière', found: 'Les pierres se mettent à vibrer. La brume se rassemble, prend la forme d\'un chevalier sans visage, une couronne brisée sur la tête…' },
      { t: 'kill', kinds: ['echo_brume'], c: 1, spawn: { place: 'p_cercle', kind: 'echo_brume', n: 1 }, hint: 'Vaincre l\'Écho de la Brume' },
      { t: 'talk', who: 'selyne', hint: 'Revenir voir Selyne', say: 'C\'est fini. Pour Brumeval, du moins. Ce que tu as vaincu n\'était qu\'un écho : la peur qu\'a laissée la mort d\'Aldaran, nourrie par Nyx. Tant que les sceaux noirs existeront, d\'autres échos s\'éveilleront ailleurs. Aux Hurlevents, une femme nommée <b>Ysold</b> veille sur ce genre de choses. Le jour où tu iras là-bas, dis-lui que Selyne t\'envoie.' }
    ],
    disc: 'Les sceaux noirs réveillent les souffles de Nyx laissés dans le monde.',
    events: 'Combat scénarisé contre l\'Écho de la Brume.',
    outro: 'La brume quitte Brumeval. Le village change.',
    cons: 'Plus de brume au cimetière ; les habitants réagissent ; titre « le Veilleur de Brumeval » ; l\'arc des Quatre Veilleurs est annoncé (Ysold).',
    link: 'Conclusion de l\'arc 1 et ouverture vers l\'arc 2 (Les Quatre Veilleurs).',
    reward: { gold: 300, xp: 600, items: [['eclat_exception', 1], ['potion', 3]], rel: ['selyne', 80], rep: ['voile', 100], ws: 'brume_apaisee' } }
};

// ---------- dialogues contextuels (mémoire du monde) ----------
// who : nom exact du PNJ ou clé d'un personnage ajouté ; when : condition ; once : n'est dit qu'une fois.
// Affiché avant le dialogue habituel, sans le remplacer (bouton « Continuer »).
const CTX_LINES = [
  { id: 'aldric_grakhul', who: 'Garde Aldric', when: () => G.flags.bossDead && !narrDone('q008'), txt: 'Depuis que Grakhul est tombé, je dors mieux. Mais regarde vers le nord-ouest, la nuit : la brume du cimetière, elle, ne dort pas.' },
  { id: 'aldric_brume', who: 'Garde Aldric', when: () => narrDone('q008'), txt: 'Pour la première fois depuis mon enfance, je vois le cimetière depuis la porte. Plus de brume. C\'est toi qu\'on doit remercier, paraît-il.' },
  { id: 'theobald_brume', who: 'Ancien Théobald', when: () => narrDone('q008'), txt: 'Selyne m\'a tout raconté. Un souffle de Nyx, ici, sous nos pieds, depuis la mort d\'Aldaran… Et nous appelions ça « le temps ». Brumeval te doit plus qu\'il ne saura jamais.' },
  { id: 'theobald_malvorak', who: 'Ancien Théobald', when: () => typeof sagaDone === 'function' && sagaDone(), txt: 'Les enfants jouent aux héros dans la rue. Devine qui ils imitent.' },
  { id: 'maelle_lant', who: 'Maëlle la marchande', when: () => narrWs('lanternes'), txt: 'Les lanternes ont tenu toute la nuit ! Les clients reviennent après le coucher du soleil. Maëlys ne parle que de toi.' },
  { id: 'maelys_lant', who: 'Maëlys l\'artisane', when: () => narrWs('lanternes'), txt: 'Les runes tiennent. Aucune lanterne ne s\'est éteinte depuis. Thalor dit que c\'est du beau travail. Je dis que c\'est grâce à toi.' },
  { id: 'eldrin_source', who: 'Eldrin l\'alchimiste', when: () => narrWs('source'), txt: 'L\'eau de la source est redevenue pure. Liora et moi n\'étions pas d\'accord sur grand-chose, mais là-dessus, si.' },
  { id: 'seraphine_roi', who: 'Séraphine, spécialiste des reliques', when: () => narrDone('q006') && G.quests.roi >= 5, txt: '« Le souffle est resté »… J\'ai apaisé le corps du roi avec toi, sans comprendre que son dernier souffle hantait encore le cimetière. Les reliques ne disent pas tout.' },
  { id: 'borin_malvorak', who: 'Borin le forgeron', when: () => typeof sagaDone === 'function' && sagaDone(), txt: 'Malvorak, vaincu ! Je vais forger une statue. Bon, une petite statue. Une figurine, disons.' },
  { id: 'nadir_sultan', who: 'Nadir, chef caravanier', when: () => G.flags.dead_boss_sultan, txt: 'Les caravanes repartent. La première a ramené des dattes, des épices… et des nouvelles : on chante déjà ton nom à l\'oasis.' },
  { id: 'nadir_berick', who: 'Nadir, chef caravanier', when: () => narrDone('q005'), txt: 'Un marchand nommé Bérick est arrivé de Brumeval. Il raconte à qui veut l\'entendre que tu lui as sauvé la vie. Il exagère, j\'espère ?' },
  { id: 'odile_marais', who: 'Mère Odile, guérisseuse', when: () => G.flags.dead_boss_marais, txt: 'Grisebrume était mon amie, autrefois. Merci de l\'avoir libérée. Le marais respire déjà mieux : les grenouilles chantent de nouveau.' },
  { id: 'orelia_neige', who: 'Orélia, veilleuse des cimes', when: () => G.flags.dead_boss_neige, txt: 'Les loups ne descendent plus jusqu\'au village. Nos éclaireurs peuvent enfin redescendre du cairn.' },
  { id: 'kaira_volcan', who: 'Kaïra, gardienne de la forge', when: () => G.flags.dead_boss_volcan, txt: 'La grande forge s\'est rallumée — pour nous, cette fois. Dorn a juré de te forger quelque chose de digne.' },
  { id: 'nymea_morne', who: 'Nyméa, capitaine du port', when: () => sideDoneId('q018'), txt: 'Le phare brûle de nouveau. Les noyés ne remontent plus. Les marins t\'ont surnommé « celui qui a coulé la Fortune grise ».' },
  { id: 'samir_bralok', who: 'Samir, intendant des Blés', when: () => sideDoneId('q026'), txt: 'Les convois passent sans escorte depuis la chute de Bralok. On reconstruira le moulin avant l\'été.' },
  { id: 'aelion_lumenor', who: 'Aelion, archéologue', when: () => sideDoneId('q042'), txt: 'Lumenor protégeait un éclat de la Couronne d\'Aube. Je l\'étudie jour et nuit. Il chante, parfois.' },
  { id: 'ysold_selyne', who: 'Ysold, gardienne du refuge', when: () => narrDone('q008'), txt: 'Selyne t\'envoie ? Alors la brume de Brumeval s\'est réveillée, et tu l\'as apaisée. Les souffles de Nyx s\'éveillent partout. Les Quatre Veilleurs ne sont plus que trois… mais c\'est une autre histoire, pour quand tu seras prêt.' },
  { id: 'morwen_cercle', who: 'Morwen, veilleuse du Voile', when: () => narrClue('cercle'), txt: 'Ce cercle brisé, je le connais. C\'est la marque de ceux qui servent Nyx sans le savoir. Si tu l\'as vu dans ta forêt, alors la Vallée des Ombres n\'est pas la seule à saigner.' },
  { id: 'berick2_hello', who: 'berick2', when: () => narrDone('q005'), txt: 'Te revoilà ! Le désert me réussit. Les caravaniers paient en sel, en épices et en histoires. Je leur raconte la tienne.' }
];

// ---------- événements dynamiques (générés selon la région) ----------
// Les rumeurs des voyageurs désignent un lieu non découvert de la région par sa direction seulement (pas de marqueur).
const TRAVELER_NAMES = ['Une colporteuse', 'Un pèlerin', 'Une éclaireuse', 'Un vieux berger', 'Un messager', 'Une chasseuse', 'Un ménestrel', 'Une marchande de sel'];
const TRAVELER_LOOKS = ['npc_merchant', 'npc_guard', 'npc_alchemist', 'npc_m_arc', 'npc_artisan', 'npc_mage'];
const TRAVELER_LINES = [
  'J\'ai vu quelque chose d\'étrange en passant, vers le {dir}. Je ne me suis pas arrêté : ce genre d\'endroit, on le laisse aux héros.',
  'Si tu cherches des histoires, va vers le {dir}. Les anciens de la région en parlent à voix basse.',
  'On raconte qu\'il y a un lieu oublié vers le {dir}. Moi, je n\'y suis jamais allé. Personne n\'y va.',
  'Vers le {dir}, j\'ai senti un drôle de froid, comme si l\'endroit se souvenait de quelque chose.'
];
