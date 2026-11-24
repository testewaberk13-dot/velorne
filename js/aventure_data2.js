'use strict';
// =====================================================================
//  AVENTURE — CONTENU, SUITE : lieux nommés, missions restantes des arcs, donjons, liens des boss
//  Statut : PROPOSITION (noms des lieux et des personnages : CANON, cahier 2).
//  Les 13 lieux nommés du canon sont placés comme SOUS-RÉGIONS nommées dans les régions existantes (défaut retenu :
//  la carte reste compatible avec les sauvegardes ; ils pourront devenir des régions complètes plus tard).
// =====================================================================

// ---------- 1. Les 13 lieux nommés (sous-régions) ----------
// named : on y entre (rayon r, en cases) → titre à l'écran, entrée de journal, révélation de la carte.
PLACES.push(
  { id: 'n_glacame', named: true, r: 9, n: 'Glaçâme', z: 'neige', tx: 212, ty: 50, prop: 'lore_crystal',
    txt: 'Un lac gelé si clair qu\'on voit le fond. Sous la glace, des silhouettes immobiles : des cerfs, des loups, un traîneau. Tout ce qui est tombé dans Glaçâme y est resté, intact, comme une mémoire.' },
  { id: 'n_terres_brulees', named: true, r: 9, n: 'Terres Brûlées', z: 'volcan', tx: 112, ty: 134, prop: 'lore_obsidian',
    txt: 'Un plateau de cendre où rien ne repousse. Des souches noires, des armures fondues. C\'est ici qu\'Ignaroth a appris à aimer le feu.' },
  { id: 'n_sable_rouge', named: true, r: 9, n: 'Sable Rouge', z: 'desert', tx: 150, ty: 62, prop: 'lore_bones',
    txt: 'Des dunes couleur de rouille. Les caravaniers disent que le sable a bu le sang d\'une armée entière, pendant l\'Éclipse, et qu\'il ne l\'a jamais rendu.' },
  { id: 'n_mer_interieure', named: true, r: 9, n: 'La Mer Intérieure', z: 'fjord', tx: 230, ty: 330, prop: 'lore_rock',
    txt: 'Au bout du fjord, l\'eau s\'élargit en une mer calme, entourée de falaises. Les baleines viennent y mettre bas, loin des tempêtes.' },
  { id: 'n_corailnoir', named: true, r: 8, n: 'Les récifs Corailnoir', z: 'archipel', tx: 30, ty: 424, prop: 'lore_rock',
    txt: 'Des coraux noirs aux reflets violets, coupants comme du verre. Les sirènes y cachaient leurs trésors ; les pêcheurs de perles y laissent leurs mains.' },
  { id: 'n_ruines_aether', named: true, r: 9, n: 'Les Ruines d\'Aether', z: 'aether', tx: 118, ty: 372, prop: 'lore_pillar',
    txt: 'Des colonnes blanches qui flottent à quelques pouces du sol. Une cité d\'Aether, figée au moment de sa chute, et qui n\'a jamais fini de tomber.' },
  { id: 'n_ile_neant', named: true, r: 7, n: 'L\'Île du Néant', z: 'aether', tx: 182, ty: 424, prop: 'lore_obsidian',
    txt: 'Un îlot noir qui ne reflète aucune lumière. Le son s\'y éteint. Seul un griffon ose s\'y poser.' },
  { id: 'n_marais_ames', named: true, r: 9, n: 'Le Marais des Âmes', z: 'marais', tx: 12, ty: 134, prop: 'lore_dead',
    txt: 'Des feux pâles dansent au-dessus de l\'eau noire. Mère Odile dit que ce sont les âmes de ceux que Grisebrume n\'a pas pu sauver.' },
  { id: 'n_volcan_endormi', named: true, r: 9, n: 'Le Volcan Endormi', z: 'monts', tx: 274, ty: 222, prop: 'lore_obsidian',
    txt: 'Un cratère éteint, tapissé de mousse rouge. La terre est tiède sous les pieds. Les forgerons de Haldor viennent y chercher un fer qui ne rouille jamais.' },
  { id: 'n_foret_astrale', named: true, r: 9, n: 'La Forêt Astrale', z: 'cristal', tx: 278, ty: 152, prop: 'lore_crystal',
    txt: 'Ici, les cristaux reflètent un ciel qui n\'est pas celui de Vélorne : des étoiles inconnues, des constellations qui bougent.' },
  { id: 'n_dragons', named: true, r: 7, n: 'Le seuil du Monde des Dragons', z: 'hurlevents', tx: 12, ty: 294, prop: 'lore_pillar',
    txt: 'Une arche de pierre ouverte sur le vide, au sommet des Hurlevents. Le vent qui en sort est chaud et sent le soufre. Une inscription : « Seuls ceux qui ont surmonté les cinq épreuves peuvent passer. »' },
  { id: 'n_fosse', named: true, r: 7, n: 'La Fosse Abyssale', z: 'cote', tx: 6, ty: 208, prop: 'lore_rock',
    txt: 'Au bord de la falaise, la mer plonge d\'un coup dans un bleu presque noir. Les marins disent que la Fosse n\'a pas de fond, et qu\'au fond, quelque chose écoute.' },
  { id: 'n_abysses', named: true, r: 7, n: 'Les Abysses du Silence', z: 'temple', tx: 268, ty: 498, prop: 'lore_pillar',
    txt: 'Un escalier qui descend sous le Temple Enfoui. Chaque marche étouffe un peu plus les bruits. Au bout, le silence est total.' }
);

// ---------- 2. Donjons narratifs : salles (lieux), énigmes, gardiens ----------
const DUNGEON_ROOMS = [
  // Abysses du Silence (sous le Temple Enfoui)
  ['d1_r1', 'Abysses — la salle des échos muets', 'temple', 262, 490, 'lore_pillar', 'Des bouches de pierre ouvertes sur les murs, toutes muettes. Au sol : « Ici, on ne parle pas. On écoute. »'],
  ['d1_r2', 'Abysses — la galerie des noms', 'temple', 256, 482, 'lore_grave', 'Des centaines de noms gravés, tous effacés au couteau sauf un : celui d\'un prêtre d\'Aether, Orvann l\'Ancien.'],
  ['d1_r3', 'Abysses — la porte des trois voix', 'temple', 250, 474, 'lore_pillar', 'Une porte sans poignée. Trois cavités dans la pierre : un soleil, un croissant de lune, un cercle brisé.'],
  ['d1_r4', 'Abysses — le sanctuaire du silence', 'temple', 244, 466, 'lore_crystal', 'Une salle ronde où même ton souffle ne fait plus de bruit. Au centre, une silhouette de pierre se tourne vers toi.'],
  // Ruines d'Aether (îles flottantes)
  ['d2_r1', 'Ruines — le parvis suspendu', 'aether', 124, 378, 'lore_pillar', 'Un parvis de marbre qui tangue doucement. Des statues brisées montrent toutes la même direction : le cœur des ruines.'],
  ['d2_r2', 'Ruines — la bibliothèque renversée', 'aether', 130, 384, 'lore_bones', 'Des étagères au plafond, des livres qui flottent. Un seul est ouvert : « La Couronne d\'Aube ne fut pas brisée. Elle fut partagée. »'],
  ['d2_r3', 'Ruines — l\'horloge d\'Aether', 'aether', 136, 390, 'lore_pillar', 'Une horloge à quatre aiguilles, arrêtée. Sous le cadran : « Remets le temps dans l\'ordre de la Création. »'],
  ['d2_r4', 'Ruines — la salle du trône vide', 'aether', 142, 396, 'lore_crystal', 'Un trône de lumière, vide. Une couronne fendue est posée dessus, translucide. Un gardien d\'Aether s\'éveille à ton approche.']
];
for (const [id, n, z, tx, ty, prop, txt] of DUNGEON_ROOMS) PLACES.push({ id, n, z, tx, ty, prop, txt, dungeon: true, req: () => true });

// ---------- 3. Missions restantes ----------
Object.assign(MISSIONS, {
  // ===== Arc 5 : Créatures et liens (Q037–Q040) =====
  q037: { arc: 'a5', num: 37, type: 'Mystère', n: 'Les baleines égarées', giver: 'Olyss la baleinière', lvl: 50,
    req: () => sideDoneId('q019'),
    ctx: 'Des baleines s\'échouent sur la grève du fjord. Olyss, qui les chasse depuis l\'enfance, refuse de croire au hasard.',
    trig: 'Olyss contemple une baleine échouée, sans son harpon.',
    intro: 'Je chasse les baleines, oui. Mais je ne les laisse pas mourir sur le sable. Elles fuient quelque chose. Va voir le <b>squelette de baleine</b> sur la grève, puis la <b>Mer Intérieure</b>, au bout du fjord : c\'est là qu\'elles devraient être.',
    goal: 'Comprendre pourquoi les baleines fuient la Mer Intérieure.',
    steps: [
      { t: 'read', place: 'p_squelette', hint: 'Examiner le squelette de baleine sur la grève', found: 'Des noms d\'enfants gravés, et un plus récent, d\'une main tremblante : « Elles ne chantent plus. »' },
      { t: 'visit', place: 'n_mer_interieure', vague: true, hint: 'Atteindre la Mer Intérieure, au bout du fjord', found: 'L\'eau est calme, trop calme. Pas un chant. Au loin, sur une falaise, une conque de pierre résonne d\'un chant étranger, grinçant.', clue: ['baleines', 'Un chant étranger a chassé les baleines de la Mer Intérieure.'] },
      { t: 'talk', who: 'Olyss la baleinière', hint: 'Revenir voir Olyss', say: () => narrDone('q024') ? 'Le chant de l\'archipel… tu l\'as déjà fait taire ? Alors c\'en était l\'écho. Les baleines reviendront. Je les vois déjà, au large.' : 'Un chant… comme celui des Sirènes. Si quelqu\'un fait taire ce qui chante dans l\'archipel, les baleines reviendront. Je l\'espère.' }
    ],
    disc: 'Les baleines fuient le même chant que celui de la conque de Nérissa.', events: 'Exploration du fjord.', outro: 'Olyss range son harpon pour la saison.',
    cons: 'Les baleines reviennent si la conque est apaisée (Q024).', link: 'Relie les créatures à l\'arc des Peuples de la mer.',
    reward: { gold: 3200, xp: 8000, items: [['potion', 4]], rel: ['Olyss la baleinière', 60], rep: ['vivant', 120] } },
  q038: { arc: 'a5', num: 38, type: 'Choix', n: 'Le col des loups', giver: 'Eirik le colporteur', lvl: 44,
    req: () => sideDoneId('q009'),
    ctx: 'Une meute de loups des Hurlevents s\'est installée dans le refuge abandonné. Eirik ne peut plus passer avec ses marchandises.', trig: 'Eirik a dû rebrousser chemin trois fois.',
    intro: 'Les loups ont pris le <b>refuge abandonné</b>. Je ne leur veux pas de mal, mais je dois passer. Va voir, écoute la <b>harpe du vent</b> en chemin — Ysold dit qu\'elle parle aux bêtes — et décide.',
    goal: 'Régler le problème des loups du refuge.',
    steps: [
      { t: 'visit', place: 'p_harpe', hint: 'Passer par la harpe du vent', found: 'Le vent joue une note grave, longue. Au loin, une meute répond.' },
      { t: 'read', place: 'p_refuge_vide', vague: true, hint: 'Trouver le refuge abandonné, au sud-est des Hurlevents', found: 'Une louve et ses petits, blottis près du bol plein de neige. La louve te fixe sans grogner.' },
      { t: 'choice', key: 'loups', who: 'Eirik le colporteur', hint: 'Revenir voir Eirik',
        q: 'Eirik attend ta réponse. « Alors ? Je passe ou pas ? »',
        opts: [
          ['Laisser le refuge aux loups et tracer un détour pour Eirik', 'detour', 'Eirik soupire, puis sourit. « Un détour d\'une heure contre une louve et ses petits… D\'accord. » Les loups ne l\'attaqueront jamais : ils le connaissent maintenant.'],
          ['Conduire la meute plus haut, vers les cols sauvages', 'deplacer', 'Il te faut deux jours et beaucoup de viande, mais la meute te suit jusqu\'aux cols. Le refuge est libre, et la meute aussi.'],
          ['Dire à Eirik de passer de force, avec une escorte', 'force', 'Eirik engage deux gardes. La meute recule devant les torches. Le passage est rouvert, mais plus personne n\'entendra la louve hurler la nuit.']
        ] }
    ],
    disc: 'Les loups des Hurlevents n\'attaquent que pour protéger leurs petits.', events: 'Rencontre pacifique avec une louve.', outro: 'Le col est réglé, d\'une façon ou d\'une autre.',
    cons: 'Selon ton choix : Gardiens du Vivant ou Garde des Routes.', link: 'Le lien entre les gens et les bêtes, encore.',
    reward: { gold: 2600, xp: 7000, rel: ['Eirik le colporteur', 50],
      choice: { detour: { rep: ['vivant', 180] }, deplacer: { rep: ['vivant', 120], gold: 400 }, force: { rep: ['garde', 180], gold: 600 } } } },
  q039: { arc: 'a5', num: 39, type: 'Personnage', n: 'Le griffon blessé', giver: 'Luthen, dresseur de griffons', lvl: 58,
    req: () => sideDoneId('q043'),
    ctx: 'Un jeune griffon est rentré blessé de l\'Île du Néant. Luthen veut savoir ce qui l\'a frappé, et le soigner.', trig: 'Luthen veille un griffon couché dans la paille.',
    intro: 'Regarde ses ailes : elles sont grises, comme vidées. Il revient de l\'<b>Île du Néant</b>. Rapporte-moi <b>5 herbes médicinales</b> pour l\'onguent, puis va voir ce qu\'il y a là-bas — mais seulement à dos de griffon.',
    goal: 'Soigner le griffon et découvrir ce qui l\'a blessé.',
    steps: [
      { t: 'item', id: 'herbe', c: 5, take: true, hint: 'Réunir 5 herbes médicinales pour l\'onguent' },
      { t: 'visit', place: 'n_ile_neant', vague: true, hint: 'Atteindre l\'Île du Néant (au sud-est des îles d\'Aether, à dos de griffon)', found: 'Sur l\'île, un nid de plumes grises, et une enclume minuscule couverte de cire noire. Quelqu\'un forge des sceaux ici.', clue: ['forge_sceaux', 'Quelqu\'un forge des sceaux noirs sur l\'Île du Néant.'] },
      { t: 'talk', who: 'Luthen, dresseur de griffons', hint: 'Revenir voir Luthen', say: 'Une forge à sceaux ? Mon griffon a dû déranger le forgeron. L\'onguent agit : ses plumes reprennent leur couleur. Il volera de nouveau. Et il se souviendra de toi.' }
    ],
    disc: 'Une forge de sceaux noirs se cache sur l\'Île du Néant.', events: 'Voyage à dos de griffon.', outro: 'Le griffon guérit.',
    cons: 'Indice pour l\'arc « Ombres et corruption ».', link: 'Les créatures témoignent du fil rouge.',
    reward: { gold: 3600, xp: 9000, items: [['potion', 4]], rel: ['Luthen, dresseur de griffons', 80], rep: ['vivant', 150] } },
  q040: { arc: 'a5', num: 40, type: 'Principale de l\'arc', n: 'Le lien', giver: 'Vaëlys, éclaireuse de Sangvert', lvl: 58,
    req: () => narrDone('q036') && narrDone('q037') && narrDone('q038') && narrDone('q039'),
    ctx: 'Panthères, baleines, loups, griffon : partout, le héros a choisi de comprendre les bêtes plutôt que de les combattre.', trig: 'Vaëlys a entendu parler de tes voyages.',
    intro: 'Les Gardiens du Vivant ont un rite, très ancien. On le propose à ceux que les bêtes ont choisis. Va au <b>nid des panthères</b>. Si l\'une d\'elles te suit quand tu repars, alors le lien est fait.',
    goal: 'Accomplir le rite du lien au nid des panthères.',
    steps: [
      { t: 'visit', place: 'p_nid', hint: 'Se rendre au nid des panthères', found: 'Les panthères se lèvent l\'une après l\'autre. La plus jeune, celle que Rhogar avait soignée, vient se placer à ton côté et ne te quitte plus.' },
      { t: 'talk', who: 'Vaëlys, éclaireuse de Sangvert', hint: 'Revenir voir Vaëlys', say: 'Elle t\'a choisi. Désormais, elle combattra à tes côtés quand tu le voudras : tu peux l\'appeler depuis ton camp. Prends soin d\'elle. Elle prendra soin de toi.' }
    ],
    disc: 'Le rite des Gardiens du Vivant.', events: 'Une panthère d\'ombre te choisit.', outro: 'La panthère devient ta compagne.',
    cons: 'Compagne disponible au camp : la panthère d\'ombre. Fin de l\'arc « Créatures et liens ».', link: 'Conclusion de l\'arc 5.',
    reward: { gold: 4000, xp: 10000, rel: ['Vaëlys, éclaireuse de Sangvert', 80], rep: ['vivant', 250], ws: 'compagnon_panthere' } },

  // ===== Arc 7 : Ombres et corruption, suite (Q055–Q056) =====
  q055: { arc: 'a7', num: 55, type: 'Mystère', n: 'Les noms grattés', giver: 'Morwen, veilleuse du Voile', lvl: 62,
    req: () => narrDone('q054'),
    ctx: 'Partout où le Sans-Nom passe, un nom est gratté au couteau. Morwen pense que c\'est toujours le même.', trig: 'Morwen a appris ce qui s\'est passé dans la crypte.',
    intro: 'Le Sans-Nom efface un nom. Toujours le même, j\'en suis sûre. Compare les traces : la <b>borne de la route de l\'est</b>, près de Brumeval, la <b>borne du Voile</b>, la <b>crypte du bastion</b>. Puis va voir l\'archiviste de Brumeval, <b>Édran</b>.',
    goal: 'Comparer les noms grattés et interroger Édran.',
    steps: [
      { t: 'read', place: 'p_borne', hint: 'Examiner la borne de la route de l\'est, près de Brumeval', found: 'Sous le mot « Arkhan » gratté, un autre nom avait été gravé, plus ancien. Effacé lui aussi, de la même main.' },
      { t: 'read', place: 'p_voile', hint: 'Examiner la borne du Voile', found: 'La même longueur de nom, la même entaille en biais au début.' },
      { t: 'read', place: 'p_crypte', hint: 'Examiner les tombes de la crypte du bastion', found: 'Sept tombes, sept fois la même entaille. Le Sans-Nom efface son propre nom, partout où il l\'a laissé.', clue: ['propre_nom', 'Le Sans-Nom efface son propre nom partout où il l\'a autrefois écrit.'] },
      { t: 'talk', who: 'edran', hint: 'Interroger Édran, à Brumeval', say: 'Son propre nom ? Alors il a vécu ici, un jour. J\'ai cherché dans tous les registres : chaque page où ce nom aurait dû figurer a été découpée. Proprement. De l\'intérieur de ma maison. Je n\'ai jamais rien vu.' }
    ],
    disc: 'Le Sans-Nom a vécu à Brumeval et efface toute trace de lui.', events: 'Enquête entre trois régions.', outro: 'Le Sans-Nom n\'est plus un étranger : c\'est quelqu\'un qui est revenu.',
    cons: 'Ouvre « Le dernier sceau ».', link: 'Le fil rouge revient à Brumeval.',
    reward: { gold: 5000, xp: 12000, items: [['chronique', 1]], rel: ['edran', 40], rep: ['archives', 200] } },
  q056: { arc: 'a7', num: 56, type: 'Principale de l\'arc', n: 'Le dernier sceau', giver: 'Drazek, chef du dernier bastion', lvl: 66,
    req: () => narrDone('q055') && narrClue('forge_sceaux'),
    ctx: 'Les sceaux noirs sont forgés sur l\'Île du Néant. Le forgeron y travaille encore.', trig: 'Drazek a recoupé tes indices.',
    intro: 'Une forge à sceaux sur l\'<b>Île du Néant</b>… Si tu détruis la forge, le Sans-Nom ne pourra plus réveiller d\'échos. Va. Et méfie-toi de ce qui la garde.',
    goal: 'Détruire la forge des sceaux sur l\'Île du Néant.',
    steps: [
      { t: 'read', place: 'n_ile_neant', hint: 'Retourner sur l\'Île du Néant, à dos de griffon', found: 'Une silhouette d\'obsidienne martèle un sceau sur l\'enclume. Elle se redresse : « Le maître a dit que tu viendrais. »' },
      { t: 'kill', kinds: ['forgeron_sceaux'], c: 1, spawn: { place: 'n_ile_neant', kind: 'forgeron_sceaux', n: 1 }, hint: 'Vaincre le Forgeron des sceaux' },
      { t: 'talk', who: 'Drazek, chef du dernier bastion', hint: 'Revenir voir Drazek', say: 'La forge est brisée. Mais tu dis qu\'un moule était vide ? Un dernier sceau… plus grand que les autres. Il l\'a déjà emporté. Où qu\'il soit, il prépare quelque chose que les quatre sceaux de Malvorak n\'étaient qu\'à essayer.' }
    ],
    disc: 'Le Sans-Nom a emporté un « dernier sceau », plus grand que tous les autres.', events: 'Combat contre le Forgeron des sceaux.', outro: 'La forge des sceaux est détruite.',
    cons: 'Plus aucun nouvel écho ne sera réveillé. Le dernier sceau reste introuvable (suite à écrire).', link: 'Conclusion de l\'arc 7.',
    reward: { gold: 8000, xp: 18000, items: [['eclat_exception', 2], ['larme_dragon', 1]], rel: ['Drazek, chef du dernier bastion', 80], rep: ['voile', 300], ws: 'forge_detruite' } },

  // ===== Arc 8 : Destinées personnelles (Q059–Q064) =====
  q059: { arc: 'a8', num: 59, type: 'Secret', n: 'La carte d\'Orlan', giver: 'orlan', lvl: 12,
    req: () => narrDone('q007'),
    ctx: 'Orlan a fini la carte de la forêt. Il rêve maintenant d\'une carte de tout Vélorne, mais ses yeux ne le portent plus.', trig: 'Orlan déroule un parchemin presque vide.',
    intro: 'Une carte de tout Vélorne. Le rêve de tous les Cartographes de l\'Aube. Moi, je ne peux plus voyager. Toi, si. Découvre <b>30 lieux</b> à travers le monde et reviens me les raconter. Je les dessinerai.',
    goal: 'Découvrir 30 lieux de Vélorne.',
    steps: [
      { t: 'wait', when: () => Object.keys(NS().disc).length >= 30, hint: 'Découvrir 30 lieux à travers Vélorne' },
      { t: 'talk', who: 'orlan', hint: 'Raconter tes voyages à Orlan', say: 'Trente lieux ! Attends, attends, laisse-moi tout noter… Voilà. La première carte de Vélorne depuis l\'Éclipse. Elle porte deux noms : le mien, et le tien.' }
    ],
    disc: 'La grande carte de Vélorne.', events: 'Exploration libre du monde.', outro: 'Orlan dessine la carte de Vélorne.',
    cons: 'Toute la carte des lieux découverts est révélée ; titre « le Cartographe ».', link: 'Destinée personnelle d\'Orlan (arc 1).',
    reward: { gold: 2000, xp: 6000, items: [['eclat_exception', 1]], rel: ['orlan', 80], rep: ['cartographes', 300], ws: 'grande_carte' } },
  q060: { arc: 'a8', num: 60, type: 'Personnage', n: 'Les voix de Vélorne', giver: 'edran', lvl: 22,
    req: () => narrDone('q001') && G.flags.dead_boss_sultan && G.flags.dead_boss_marais && G.flags.dead_boss_neige && G.flags.dead_boss_volcan,
    ctx: 'Édran veut écrire la chronique de la chute des quatre gardiens, avec les mots de ceux qui les ont vus tomber.', trig: 'Édran a rempli son encrier.',
    intro: 'Une chronique n\'a de valeur que si les témoins parlent. Va recueillir les paroles de <b>Nadir</b> (désert), <b>Mère Odile</b> (marais), <b>Orélia</b> (cimes) et <b>Kaïra</b> (cratère). Je mettrai tout dans le registre.',
    goal: 'Recueillir quatre témoignages pour la chronique d\'Édran.',
    steps: [
      { t: 'talk', who: 'Nadir, chef caravanier', hint: 'Recueillir le témoignage de Nadir (camp d\'Arkhan)', say: 'Écris ceci : « Zahrak n\'était pas cruel. Il avait peur. Et quelqu\'un lui a vendu un remède contre la peur. »' },
      { t: 'talk', who: 'Mère Odile, guérisseuse', hint: 'Recueillir le témoignage de Mère Odile (Vasebourg)', say: '« Grisebrume a soigné tout le marais pendant cinquante ans. Le jour où elle a accepté le sceau, elle voulait seulement soigner plus vite. »' },
      { t: 'talk', who: 'Orélia, veilleuse des cimes', hint: 'Recueillir le témoignage d\'Orélia (village des cimes)', say: '« Kragh protégeait sa meute. On lui a promis qu\'avec le sceau, plus aucun louveteau ne mourrait de froid. »' },
      { t: 'talk', who: 'Kaïra, gardienne de la forge', hint: 'Recueillir le témoignage de Kaïra (forge de Cendrefeu)', say: '« Ignaroth voulait un feu qui ne s\'éteigne jamais. Le sceau le lui a donné. Il a tout brûlé avec. »' },
      { t: 'talk', who: 'edran', hint: 'Rapporter les témoignages à Édran', say: 'Quatre gardiens, quatre peurs, quatre promesses. Et chaque fois, quelqu\'un pour leur offrir un sceau. Le Sans-Nom, déjà. Cette chronique s\'appellera « Ceux qui ont dit oui ».' }
    ],
    disc: 'Chaque gardien a accepté un sceau par peur ou par amour, sur la promesse d\'un inconnu.', events: 'Voyage entre quatre régions.', outro: 'Édran écrit « Ceux qui ont dit oui ».',
    cons: 'La trame principale prend un sens nouveau ; les quatre gardiens sont reliés au Sans-Nom.', link: 'Relie la trame principale au fil rouge.',
    reward: { gold: 1500, xp: 4500, items: [['chronique', 1]], rel: ['edran', 60], rep: ['archives', 200] } },
  q061: { arc: 'a8', num: 61, type: 'Personnage', n: 'La dernière garde du fossoyeur', giver: 'neria', lvl: 10,
    req: () => narrDone('q058'),
    ctx: 'Le père de Néria est mort en gardant le cimetière. Depuis que la brume est partie, Néria rêve de lui chaque nuit, debout près du cercle de pierres.', trig: 'Néria a les yeux cernés.',
    intro: 'Chaque nuit, je le vois près du <b>cercle de la brume</b>. Il me fait signe. Je n\'ose pas y aller seule. Viens avec moi… enfin, vas-y d\'abord. Lis la <b>stèle de l\'Éclipse</b> en passant : c\'est là qu\'il priait.',
    goal: 'Retrouver la trace du père de Néria au cimetière.',
    steps: [
      { t: 'read', place: 'p_stele', hint: 'Lire la stèle de l\'Éclipse', found: 'Au pied de la stèle, une pelle de fossoyeur, posée bien droite, comme une sentinelle.' },
      { t: 'visit', place: 'p_cercle', hint: 'Aller au cercle de la brume', found: 'Une silhouette pâle, une pelle à la main, se tourne vers toi. « Dis à ma fille que la garde est finie. Qu\'elle vive. » Puis il s\'efface dans le matin.' },
      { t: 'talk', who: 'neria', hint: 'Revenir voir Néria', say: '« La garde est finie »… Il a dit ça ? Alors je peux partir. Voir le monde. Mon père n\'est jamais sorti de ce cimetière. Moi, je verrai la mer.' }
    ],
    disc: 'Le fossoyeur gardait le cimetière jusqu\'à ce que la brume soit apaisée.', events: 'Apparition au cercle de la brume.', outro: 'Néria décide de voyager.',
    cons: 'Néria part pour Port-Épave (elle y apparaît désormais).', link: 'Destinée personnelle de Néria (arc 1).',
    reward: { gold: 600, xp: 1600, items: [['potion', 3]], rel: ['neria', 80], ws: 'neria_voyage' } },
  q062: { arc: 'a8', num: 62, type: 'Exploration', n: 'Les trois lumières de Selyne', giver: 'selyne', lvl: 30,
    req: () => narrDone('q016'),
    ctx: 'Selyne a eu une vision : trois lumières, dans trois lieux lointains, qu\'il faut aller voir avant qu\'elles ne s\'éteignent.', trig: 'Selyne te retient par la manche.',
    intro: 'J\'ai vu trois lumières. Une sous la glace, à <b>Glaçâme</b>. Une dans le sang du sable, au <b>Sable Rouge</b>. Une parmi des étoiles qui ne sont pas les nôtres, dans la <b>Forêt Astrale</b>. Va les voir. Ne me demande pas pourquoi : je ne sais pas encore.',
    goal: 'Voir les trois lumières de la vision de Selyne.',
    steps: [
      { t: 'visit', place: 'n_glacame', vague: true, hint: 'Glaçâme, le lac gelé des Pics de Givrenuit', found: 'Sous la glace, une lueur dorée pulse lentement, comme un cœur endormi.' },
      { t: 'visit', place: 'n_sable_rouge', vague: true, hint: 'Le Sable Rouge, au sud du désert d\'Arkhan', found: 'Une lueur rouge sort du sable à chaque coucher de soleil, toujours au même endroit.' },
      { t: 'visit', place: 'n_foret_astrale', vague: true, hint: 'La Forêt Astrale, au nord-est de la Forêt de Cristal', found: 'Une étoile du ciel étranger brille plus fort que les autres, et clignote quand tu la regardes.' },
      { t: 'talk', who: 'selyne', hint: 'Revenir voir Selyne', say: 'Trois lumières… et deux autres que je n\'avais pas vues : les âmes du marais et le volcan qui dort. Cinq. Ce sont les cinq épreuves du seuil des dragons. Quand le Sans-Nom sera vaincu… ou avant, si tu es pressé… un vieux maître viendra te chercher. Il s\'appelle Odran.' }
    ],
    disc: 'Cinq lumières marquent les cinq épreuves du seuil du Monde des Dragons.', events: 'Voyage à travers trois régions lointaines.', outro: 'Selyne annonce Maître Odran.',
    cons: 'Prépare les Épreuves légendaires (après la victoire sur Malvorak).', link: 'Destinée personnelle de Selyne ; ouvre l\'arc 9.',
    reward: { gold: 3000, xp: 8000, items: [['eclat_exception', 1]], rel: ['selyne', 80], rep: ['voile', 150] } },
  q063: { arc: 'a8', num: 63, type: 'Choix', n: 'Les dettes de Bérick', giver: 'berick2', lvl: 12,
    req: () => narrDone('q058'),
    ctx: 'Bérick doit de l\'argent à une bande de pillards du désert depuis sa faillite. Ils sont venus le menacer au camp d\'Arkhan.', trig: 'Bérick a un œil au beurre noir.',
    intro: 'Les pillards de la dune sont revenus. Je leur dois 500 pièces depuis que les gobelins m\'ont ruiné. Ils attendent leur argent à l\'<b>ouest du camp</b>. Je ne te demande pas de payer… je te demande juste de venir avec moi.',
    goal: 'Régler la dette de Bérick envers les pillards.',
    steps: [
      { t: 'kill', kinds: ['pillard'], c: 3, spawn: { place: 'p_caravane', kind: 'pillard', n: 3 }, hint: 'Affronter les pillards près de la caravane ensablée' },
      { t: 'choice', key: 'dette', who: 'berick2', hint: 'Revenir voir Bérick',
        q: 'Les pillards sont partis, mais leur chef reviendra. Bérick se gratte la tête. « Il reste la dette… Qu\'est-ce qu\'on fait ? »',
        opts: [
          ['Payer la dette à sa place (500 or)', 'payer', 'Tu déposes 500 pièces au relais des caravanes, au nom des pillards. Bérick ne dit rien pendant un long moment. Puis : « Je te rembourserai. Un jour. Peut-être. »'],
          ['Lui conseiller de vendre le médaillon', 'vendre', 'Bérick secoue la tête. « Jamais. » Il préfère travailler deux saisons pour Nadir. Il s\'en sortira, à sa façon.'],
          ['Laisser les pillards en paix : ils ont eu leur leçon', 'lecon', 'Bérick rit nerveusement. « Leur leçon, oui… Espérons qu\'ils l\'aient comprise. » Les pillards ne reviennent plus. Pour l\'instant.']
        ] }
    ],
    disc: 'Bérick a reconstruit sa vie au désert.', events: 'Combat contre des pillards.', outro: 'La dette de Bérick est réglée, d\'une façon ou d\'une autre.',
    cons: 'Bérick se souviendra de ta décision.', link: 'Destinée personnelle de Bérick.',
    reward: { gold: 400, xp: 1400, rel: ['berick2', 40],
      choice: { payer: { gold: -500, rel: ['berick2', 120], rep: ['pacte', 120] }, vendre: { rel: ['berick2', 20] }, lecon: { rep: ['garde', 80] } } } },
  q064: { arc: 'a8', num: 64, type: 'Personnage', n: 'Kaël le chasseur', giver: 'kael', lvl: 9,
    req: () => narrDone('q008'),
    ctx: 'Kaël, un chasseur de la forêt, cherche quelqu\'un avec qui chasser depuis que la brume a emporté son compagnon de route.', trig: 'Kaël est arrivé à Brumeval après la fin de la brume.',
    intro: 'On raconte que c\'est toi qui as chassé la brume. Moi, je chasse les loups-garous qui rôdent encore à l\'ouest de la forêt. Abats-en <b>trois</b> avec moi, et on verra si on chasse bien ensemble.',
    goal: 'Chasser trois loups-garous avec Kaël.',
    steps: [
      { t: 'kill', kinds: ['werewolf', 'loup_garou', 'wolf_brute'], c: 3, hint: 'Abattre 3 loups-garous dans la forêt de Sylvemousse' },
      { t: 'talk', who: 'kael', hint: 'Revenir voir Kaël', say: 'Pas mal du tout. Écoute : je n\'ai plus de compagnon de route. Si tu veux de moi, appelle-moi depuis ton camp. Mon arc est à toi.' }
    ],
    disc: 'Un compagnon de chasse.', events: 'Chasse dans la forêt.', outro: 'Kaël rejoint le héros.',
    cons: 'Compagnon disponible au camp : Kaël, archer.', link: 'Destinée personnelle ; premier compagnon.',
    reward: { gold: 300, xp: 900, rel: ['kael', 80], rep: ['garde', 60], ws: 'compagnon_kael' } },

  // ===== Arc 9 : Épreuves légendaires (Q067–Q072) — après la victoire sur Malvorak =====
  q067: { arc: 'a9', num: 67, type: 'Épreuve', n: 'L\'épreuve du givre', giver: 'odran', lvl: 80, req: () => typeof sagaDone === 'function' && sagaDone() && narrDone('q062'),
    ctx: 'Maître Odran garde les cinq épreuves qui ouvrent le seuil du Monde des Dragons.', trig: 'Maître Odran est arrivé à Brumeval.',
    intro: 'Selyne t\'a parlé de moi. Bien. Cinq épreuves, cinq gardiens légendaires. Le premier dort sous la glace de <b>Glaçâme</b>. Réveille-le, et survis.',
    goal: 'Vaincre le gardien de Glaçâme.',
    steps: [{ t: 'kill', kinds: ['gardien_givre'], c: 1, spawn: { place: 'n_glacame', kind: 'gardien_givre', n: 1 }, hint: 'Vaincre le Gardien de Glaçâme' }, { t: 'talk', who: 'odran', hint: 'Revenir voir Maître Odran', say: 'Un sur cinq. Le plus facile. Ne te réjouis pas trop vite.' }],
    disc: 'Le premier gardien légendaire.', events: 'Combat légendaire.', outro: 'La lumière de Glaçâme s\'éteint doucement.', cons: 'Épreuve suivante.', link: 'Arc 9, épreuve 1/5.',
    reward: { gold: 10000, xp: 30000, items: [['larme_dragon', 1]], rep: ['voile', 150] } },
  q068: { arc: 'a9', num: 68, type: 'Épreuve', n: 'L\'épreuve des sables', giver: 'odran', lvl: 82, req: () => narrDone('q067'),
    ctx: 'La deuxième épreuve se trouve au Sable Rouge.', trig: 'Odran désigne le sud du désert.',
    intro: 'Le sable rouge a bu une armée. Son gardien en est fait. Va au <b>Sable Rouge</b>.', goal: 'Vaincre le gardien du Sable Rouge.',
    steps: [{ t: 'kill', kinds: ['gardien_sable'], c: 1, spawn: { place: 'n_sable_rouge', kind: 'gardien_sable', n: 1 }, hint: 'Vaincre le Gardien du Sable Rouge' }, { t: 'talk', who: 'odran', hint: 'Revenir voir Maître Odran', say: 'Deux. Tu sens le sable dans tes dents ? Il y restera.' }],
    disc: 'Le deuxième gardien.', events: 'Combat légendaire.', outro: 'Le sable redevient doré par endroits.', cons: 'Épreuve suivante.', link: 'Arc 9, épreuve 2/5.',
    reward: { gold: 11000, xp: 33000, items: [['larme_dragon', 1]], rep: ['pacte', 150] } },
  q069: { arc: 'a9', num: 69, type: 'Épreuve', n: 'L\'épreuve des âmes', giver: 'odran', lvl: 84, req: () => narrDone('q068'),
    ctx: 'La troisième épreuve se trouve au Marais des Âmes.', trig: 'Odran baisse la voix.',
    intro: 'Les âmes du marais ont un gardien. Il les retient. Libère-les : va au <b>Marais des Âmes</b>.', goal: 'Vaincre le gardien du Marais des Âmes.',
    steps: [{ t: 'kill', kinds: ['gardien_ames'], c: 1, spawn: { place: 'n_marais_ames', kind: 'gardien_ames', n: 1 }, hint: 'Vaincre le Gardien des Âmes' }, { t: 'talk', who: 'odran', hint: 'Revenir voir Maître Odran', say: 'Les feux du marais se sont envolés. Mère Odile pleure, paraît-il. De joie.' }],
    disc: 'Le troisième gardien.', events: 'Combat légendaire.', outro: 'Les âmes du marais sont libres.', cons: 'Épreuve suivante.', link: 'Arc 9, épreuve 3/5.',
    reward: { gold: 12000, xp: 36000, items: [['larme_dragon', 1]], rep: ['vivant', 150], ws: 'ames_liberees' } },
  q070: { arc: 'a9', num: 70, type: 'Épreuve', n: 'L\'épreuve du volcan', giver: 'odran', lvl: 86, req: () => narrDone('q069'),
    ctx: 'La quatrième épreuve se trouve au Volcan Endormi.', trig: 'Odran regarde vers les Monts de Fer.',
    intro: 'Le volcan dort parce que son gardien le retient. Réveille le gardien sans réveiller le volcan. Va au <b>Volcan Endormi</b>.', goal: 'Vaincre le gardien du Volcan Endormi.',
    steps: [{ t: 'kill', kinds: ['gardien_volcan'], c: 1, spawn: { place: 'n_volcan_endormi', kind: 'gardien_volcan', n: 1 }, hint: 'Vaincre le Gardien du Volcan' }, { t: 'talk', who: 'odran', hint: 'Revenir voir Maître Odran', say: 'Le volcan dort toujours. Bien joué. Haldor t\'enverra une caisse de fer, j\'imagine.' }],
    disc: 'Le quatrième gardien.', events: 'Combat légendaire.', outro: 'Le volcan reste endormi.', cons: 'Épreuve suivante.', link: 'Arc 9, épreuve 4/5.',
    reward: { gold: 13000, xp: 39000, items: [['larme_dragon', 1]], rep: ['artisans', 150] } },
  q071: { arc: 'a9', num: 71, type: 'Épreuve', n: 'L\'épreuve des astres', giver: 'odran', lvl: 88, req: () => narrDone('q070'),
    ctx: 'La cinquième épreuve se trouve dans la Forêt Astrale.', trig: 'Odran lève les yeux vers le ciel.',
    intro: 'Le dernier gardien vient d\'un autre ciel. Il ne connaît pas nos règles. Va dans la <b>Forêt Astrale</b>.', goal: 'Vaincre le gardien de la Forêt Astrale.',
    steps: [{ t: 'kill', kinds: ['gardien_astral'], c: 1, spawn: { place: 'n_foret_astrale', kind: 'gardien_astral', n: 1 }, hint: 'Vaincre le Gardien des Astres' }, { t: 'talk', who: 'odran', hint: 'Revenir voir Maître Odran', say: 'Cinq. Tu as fait ce que personne n\'a fait depuis l\'Éclipse. Le seuil t\'attend, au sommet des Hurlevents.' }],
    disc: 'Le cinquième gardien.', events: 'Combat légendaire.', outro: 'Les étoiles étrangères pâlissent.', cons: 'Le seuil du Monde des Dragons s\'ouvre.', link: 'Arc 9, épreuve 5/5.',
    reward: { gold: 14000, xp: 42000, items: [['larme_dragon', 1]], rep: ['cartographes', 150] } },
  q072: { arc: 'a9', num: 72, type: 'Principale de l\'arc', n: 'Le seuil des dragons', giver: 'odran', lvl: 90, req: () => narrDone('q071'),
    ctx: 'Les cinq épreuves sont surmontées. Le seuil du Monde des Dragons attend son gardien ultime.', trig: 'Odran t\'accompagne jusqu\'au pied des Hurlevents.',
    intro: 'Monte au <b>seuil du Monde des Dragons</b>. Ce qui garde l\'arche est plus vieux que l\'Éclipse, plus vieux que la Couronne. Si tu gagnes, le monde des dragons s\'ouvrira à toi. Si tu perds… eh bien, tu ne perdras pas.',
    goal: 'Vaincre le gardien du seuil du Monde des Dragons.',
    steps: [
      { t: 'read', place: 'n_dragons', hint: 'Monter au seuil, au sommet des Hurlevents', found: 'L\'arche s\'embrase. Une silhouette immense déploie ses ailes dans le vent brûlant.' },
      { t: 'kill', kinds: ['dragon_seuil'], c: 1, spawn: { place: 'n_dragons', kind: 'dragon_seuil', n: 1 }, hint: 'Vaincre le Dragon du seuil' },
      { t: 'talk', who: 'odran', hint: 'Revenir voir Maître Odran', say: 'Le seuil est ouvert. Ce qu\'il y a de l\'autre côté, personne ne le sait encore. Pas même moi. Mais le jour où tu voudras le savoir, l\'arche t\'attendra.' }
    ],
    disc: 'Le Monde des Dragons existe, au-delà de l\'arche.', events: 'Combat contre le Dragon du seuil.', outro: 'L\'arche reste ouverte.',
    cons: 'Titre « le Légendaire ». Le Monde des Dragons reste à explorer (suite).', link: 'Conclusion de l\'arc 9 et de l\'après-jeu actuel.',
    reward: { gold: 30000, xp: 80000, items: [['larme_dragon', 3], ['coeur_eveil', 1]], rep: ['voile', 400], ws: 'seuil_ouvert' } },

  // ===== Donjons narratifs (hors numérotation Q, rattachés aux arcs 6 et 9) =====
  d01: { arc: 'a6', num: 101, type: 'Donjon', n: 'Les Abysses du Silence', giver: 'Orvann, archéologue du temple', lvl: 76,
    req: () => sideDoneId('q048'),
    ctx: 'Sous le Temple Enfoui, un escalier descend vers les Abysses du Silence, où les prêtres d\'Aether enfermaient ce qui ne devait jamais être dit.',
    trig: 'Orvann a trouvé l\'escalier derrière l\'autel de l\'Oracle.',
    intro: 'Derrière l\'autel de l\'Oracle, un escalier. Les textes l\'appellent les <b>Abysses du Silence</b>. Quatre salles, une porte qui demande la bonne réponse, et un gardien. Mon ancêtre, Orvann l\'Ancien, y est descendu. Il n\'est pas remonté.',
    goal: 'Traverser les Abysses du Silence.',
    steps: [
      { t: 'visit', place: 'n_abysses', hint: 'Descendre l\'escalier des Abysses du Silence (au fond du Temple Enfoui)', found: 'Le silence se referme derrière toi.' },
      { t: 'read', place: 'd1_r1', hint: 'Salle 1 : la salle des échos muets', found: 'Une bouche de pierre murmure, sans son, trois mots : « Avant l\'ordre, l\'ombre. »', clue: ['abysses1', 'Abysses : « Avant l\'ordre, l\'ombre. »'] },
      { t: 'read', place: 'd1_r2', hint: 'Salle 2 : la galerie des noms', found: 'Le nom d\'Orvann l\'Ancien, seul intact. À côté : « J\'ai répondu par la lumière. J\'avais tort. »' },
      { t: 'riddle', place: 'd1_r3', hint: 'Salle 3 : ouvrir la porte des trois voix',
        q: 'La porte attend. Trois cavités : un soleil, un croissant de lune, un cercle brisé. Laquelle presser ?',
        opts: [['Le soleil (Aether, la lumière)', false, 'La porte gronde. Des gardiens de pierre se détachent des murs !'], ['Le croissant de lune', false, 'Rien ne se passe… puis des gardiens de pierre s\'éveillent !'], ['Le cercle brisé (Nyx, « avant l\'ordre, l\'ombre »)', true, 'La porte glisse sans un bruit. Orvann l\'Ancien avait choisi la lumière ; toi, tu as écouté les murs.']],
        fail: { kind: 'gardien_temple', n: 2 } },
      { t: 'read', place: 'd1_r4', hint: 'Salle 4 : le sanctuaire du silence', found: 'La silhouette de pierre lève une lame. Le Gardien du Silence s\'éveille.' },
      { t: 'kill', kinds: ['gardien_silence'], c: 1, spawn: { place: 'd1_r4', kind: 'gardien_silence', n: 1 }, hint: 'Vaincre le Gardien du Silence' },
      { t: 'talk', who: 'Orvann, archéologue du temple', hint: 'Remonter voir Orvann', say: 'Tu as trouvé son nom… et sa dernière phrase. « J\'ai répondu par la lumière. J\'avais tort. » Les prêtres d\'Aether le savaient donc : Nyx était là avant l\'ordre. Aether et Nyx ne sont pas ennemis. Ils sont le début et la suite.' }
    ],
    disc: 'Les prêtres d\'Aether savaient que Nyx précédait l\'ordre (fresque des deux puissances).', events: 'Donjon : salles, énigme, gardiens, boss.', outro: 'Orvann connaît enfin le sort de son ancêtre.',
    cons: 'Les Abysses sont apaisés.', link: 'Donjon de l\'arc 6, mythologie Aether–Nyx (canon : pas d\'opposition morale simpliste).',
    reward: { gold: 14000, xp: 40000, items: [['coeur_eveil', 1], ['eclat_exception', 2]], rel: ['Orvann, archéologue du temple', 80], rep: ['archives', 300] } },
  d02: { arc: 'a6', num: 102, type: 'Donjon', n: 'Les Ruines d\'Aether', giver: 'Eshara, archéologue d\'Aether', lvl: 60,
    req: () => sideDoneId('q044'),
    ctx: 'Au cœur des îles flottantes, une cité d\'Aether n\'a jamais fini de tomber. Eshara veut atteindre sa salle du trône.',
    trig: 'Le dernier gardien des îles est tombé : le chemin des ruines est libre.',
    intro: 'Les <b>Ruines d\'Aether</b> ! Parvis, bibliothèque, horloge, salle du trône. Les textes parlent d\'une énigme du temps à l\'horloge. Ne te trompe pas : l\'horloge a des gardiens.',
    goal: 'Atteindre la salle du trône des Ruines d\'Aether.',
    steps: [
      { t: 'read', place: 'd2_r1', hint: 'Le parvis suspendu', found: 'Les statues montrent toutes le cœur des ruines.' },
      { t: 'read', place: 'd2_r2', hint: 'La bibliothèque renversée', found: '« La Couronne d\'Aube ne fut pas brisée. Elle fut partagée. » La suite parle de quatre aiguilles : l\'Aube, l\'Ordre, la Rupture, le Renouveau.', clue: ['couronne_partagee', 'Selon les Ruines d\'Aether, la Couronne d\'Aube fut partagée, pas brisée.'] },
      { t: 'riddle', place: 'd2_r3', hint: 'L\'horloge d\'Aether : remettre le temps dans l\'ordre de la Création',
        q: 'Quatre aiguilles portent quatre mots. Dans quel ordre les placer ?',
        opts: [['Ordre → Aube → Rupture → Renouveau', false, 'L\'horloge grince. Des gardiens d\'Aether surgissent !'], ['Aube → Ordre → Rupture → Renouveau', true, 'Les aiguilles s\'alignent. Le Premier Souffle, puis l\'ordre d\'Aether, la rupture de Nyx, et ce qui renaît. L\'horloge se remet à battre.'], ['Rupture → Renouveau → Aube → Ordre', false, 'Le cadran se fend. Des gardiens d\'Aether surgissent !']],
        fail: { kind: 'gardien_aether', n: 2 } },
      { t: 'read', place: 'd2_r4', hint: 'La salle du trône vide', found: 'La couronne fendue posée sur le trône est un reflet : l\'une des parts de la Couronne d\'Aube. Son gardien s\'éveille.' },
      { t: 'kill', kinds: ['gardien_trone'], c: 1, spawn: { place: 'd2_r4', kind: 'gardien_trone', n: 1 }, hint: 'Vaincre le Gardien du trône' },
      { t: 'talk', who: 'Eshara, archéologue d\'Aether', hint: 'Revenir voir Eshara', say: 'Une part de la Couronne… partagée, pas brisée. Le médaillon de Bérick, la tombe sans nom, la couronne fendue des échos : ce sont peut-être toutes des parts. Et le Sans-Nom les cherche.' }
    ],
    disc: 'La Couronne d\'Aube a été partagée en plusieurs parts.', events: 'Donjon : salles, énigme, gardiens, boss.', outro: 'Eshara étudie la part de couronne.',
    cons: 'Le fil rouge s\'élargit : la Couronne partagée.', link: 'Donjon de l\'arc 6, relié au fil rouge et au canon de la Couronne d\'Aube.',
    reward: { gold: 9000, xp: 24000, items: [['coeur_eveil', 1], ['eclat_exception', 1]], rel: ['Eshara, archéologue d\'Aether', 80], rep: ['archives', 250] } }
});

// ---------- personnages ajoutés : Kaël (cahier 2, groupe Forêt) et Maître Odran (cahier 2, groupe Fin de jeu) ----------
NARR_NPCS.push(
  { key: 'kael', name: 'Kaël, chasseur', look: 'npc_m_arc', tx: 58, ty: 66, when: () => narrDone('q008'),
    bio: 'Chasseur de la forêt de Sylvemousse. Il a perdu son compagnon de route dans la brume et chasse seul depuis.',
    idle: ['Une flèche, une proie. Jamais deux.', 'Les loups-garous de l\'ouest deviennent plus malins chaque saison.'] },
  { key: 'odran', name: 'Maître Odran', look: 'npc_archmage', tx: 44, ty: 61, when: () => typeof sagaDone === 'function' && sagaDone(),
    bio: 'Un vieux maître itinérant que personne n\'a vu arriver. Il garde les cinq épreuves du seuil du Monde des Dragons.',
    idle: ['Patience. Les dragons ne sont pas pressés : ils ont des millénaires.', 'Selyne voit l\'avenir. Moi, je le prépare.'] },
  { key: 'neria2', name: 'Néria, voyageuse', look: 'npc_relic', tx: 40, ty: 175, when: () => narrWs('neria_voyage'),
    bio: 'Néria a quitté le cimetière de Brumeval pour voir la mer, comme son père l\'aurait voulu.',
    idle: ['La mer ! Elle est encore plus grande que dans les livres d\'Édran.', 'J\'ai écrit à Édran. Il m\'a répondu par trois pages de corrections.'] }
);
// Néria quitte Brumeval quand elle part en voyage
{ const nd = NARR_NPCS.find(d => d.key === 'neria'); if (nd) nd.when = () => !narrWs('neria_voyage'); }

// ---------- répliques ----------
CTX_LINES.push(
  { id: 'olyss_baleines', who: 'Olyss la baleinière', when: () => narrDone('q037') && narrDone('q024'), txt: 'Elles sont revenues. Toutes. La Mer Intérieure chante de nouveau. Je n\'ai jamais été aussi heureuse de ne rien chasser.' },
  { id: 'luthen_griffon', who: 'Luthen, dresseur de griffons', when: () => narrDone('q039'), txt: 'Mon griffon refuse de voler sans toi en vue. Je crois qu\'il t\'a adopté.' },
  { id: 'nymea_neria', who: 'Nyméa, capitaine du port', when: () => narrWs('neria_voyage'), txt: 'Une jeune femme de Brumeval est arrivée au port. Elle regarde la mer depuis trois jours sans bouger. Elle dit que c\'est toi qui l\'as envoyée.' },
  { id: 'odile_ames', who: 'Mère Odile, guérisseuse', when: () => narrWs('ames_liberees'), txt: 'Les feux du marais sont partis. J\'en ai reconnu un, le dernier soir : il m\'a saluée. Merci.' },
  { id: 'theobald_odran', who: 'Ancien Théobald', when: () => typeof sagaDone === 'function' && sagaDone() && !narrDone('q067'), txt: 'Un vieil homme est arrivé au village et dit t\'attendre. Maître Odran, qu\'il s\'appelle. Personne ne l\'a vu entrer.' },
  { id: 'aldric_legende', who: 'Garde Aldric', when: () => narrWs('seuil_ouvert'), txt: 'On dit que tu as ouvert la porte du Monde des Dragons. Moi, je garde toujours la porte de Brumeval. Chacun sa porte.' },
  { id: 'eshara_couronne', who: 'Eshara, archéologue d\'Aether', when: () => narrDone('d02'), txt: 'La part de couronne pulse quand on l\'approche du nord. Il y en a d\'autres, j\'en suis sûre.' }
);

// ---------- liens des boss avec la trame (indices à la chute de chaque boss) ----------
const BOSS_LINKS = {
  boss_orc_chief: 'Sur le bouclier de Grakhul, un cercle brisé gravé, et une fiole vide : quelqu\'un lui avait donné du courage en bouteille.',
  boss_sultan: 'Dans le turban de Zahrak, un sceau noir fendu. Une phrase brodée à l\'intérieur : « Contre la peur. »',
  boss_marais: 'Grisebrume serrait dans sa main un sceau noir et un remède inachevé.',
  boss_neige: 'Au cou de Kragh, un collier de cuir portant un sceau noir, comme une médaille offerte.',
  boss_volcan: 'Le cœur d\'Ignaroth s\'éteint autour d\'un sceau noir fondu dans la lave.',
  boss_malvorak: 'Malvorak, en tombant, murmure : « Je n\'étais… que le premier… à dire oui… »',
  boss_cote: 'Dans la cabine de Morne, une caisse vide marquée d\'un cercle brisé.',
  boss_plaines: 'La couronne de paille de Bralok cache une couronne de métal fendue, minuscule.',
  boss_cristal: 'Lumenor gardait un éclat de cristal en forme de couronne fendue.',
  boss_jungle: 'Ssyrath portait une clochette bouchée à la cire noire, comme celle de l\'idole.',
  boss_oasis: 'La lampe d\'Azhar était scellée de cire noire, frappée d\'un cercle brisé.',
  boss_monts: 'Dans le cœur de fer de Gorvak, un sceau noir sert de rivet.',
  boss_hurlevents: 'Le géant des vents portait un sceau noir cousu dans sa ceinture.',
  boss_ombres: 'Vaelor le Déchu, en mourant : « Il m\'a promis de me rendre mon nom… »',
  boss_fjord: 'Le roi des pillards gardait un coffret vide frappé d\'un cercle brisé.',
  boss_archipel: 'Nérissa chantait dans une conque scellée de cire noire.',
  boss_aether: 'Le dernier gardien d\'Aether désigne, avant de s\'éteindre, l\'île noire au sud-est.',
  boss_corrompues: 'Le rejeton de Nyx naît d\'un sceau noir planté dans la terre comme une graine.',
  boss_mines: 'Le roi sous la montagne tenait un sceau noir dans son poing de pierre.',
  boss_lave: 'Pyrrhos portait un sceau noir incrusté dans son cœur de magma.',
  boss_temple: 'L\'Oracle enfoui murmure : « Le Sans-Nom m\'a demandé l\'avenir. Je le lui ai donné. »'
};
