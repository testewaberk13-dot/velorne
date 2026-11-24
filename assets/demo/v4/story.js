// =====================================================================
//  VÉLORNE v4 · TEXTES DU VILLAGE PILOTE (prototype : rien ici n'est canon tant que ce n'est pas validé)
// =====================================================================
export const VILLAGE_NAME = 'Brumeval';

// secrets : 5 niveaux (1 facile à manquer · 2 exploration · 3 complexe · 4 rare · 5 narratif)
export const SECRETS = {
  initiales: { lvl: 1, name: 'Les initiales du vieux chêne', hint: "Édran dit que le vieux chêne « en a vu, des amoureux »." },
  chat: { lvl: 1, name: 'Mousse, le chat de l’auberge', hint: "Gwenna, l'aubergiste, parle d'un chat qui dort au soleil près de l'auberge." },
  grotte: { lvl: 2, name: 'La crevasse derrière la cascade', hint: "Liora dit qu'on peut passer derrière la cascade « de pierre en pierre »." },
  bibliotheque: { lvl: 3, name: "L'alcôve d'Édran", hint: "Gwenna : Édran parle toujours du soleil quand il range ses livres." },
  grenouille: { lvl: 4, name: "La grenouille de l'aube", hint: "Frère Anselme : la statue de la cascade « ne s'éveille qu'à l'aube »." },
  renard: { lvl: 4, name: 'Le renard blanc', hint: "Hugues : la nuit, de l'autre côté du pont, un renard blanc guide ceux qui le suivent." },
  maison: { lvl: 5, name: 'La famille Vey', hint: "La maison abandonnée, au bout de la ruelle, raconte une histoire à qui sait regarder." }
};
export const LEVELS = ['', 'Facile à manquer', 'Exploration', 'Complexe', 'Rare', 'Narratif'];

export const TEXT = {
  initiales: ["Dans l'écorce, à hauteur d'épaule, deux initiales entourées d'un cœur maladroit : « A + H ». Juste en dessous, plus récent, quelqu'un a gravé « I ».", "A comme Aldric ? Le cœur est vieux d'au moins vingt hivers."],
  initiales_re: ["« A + H », et ce petit « I » gravé plus tard."],
  puits: ["L'eau est très bas. Une odeur de pierre mouillée. Tout au fond, on croit voir briller une pièce… trop loin pour l'atteindre."],
  panneau: ["« BRUMEVAL » — en dessous, une flèche vers l'est : « Pont de la Vire, route de Vélmaré ». Une autre, griffonnée : « Auberge : soupe chaude ! »"],
  note_edran: ["Une note de la main d'Édran, pliée sous la bougie :", "« Pour retrouver ce que j'ai caché, suis le soleil : il naît, il règne, il s'endort. »"],
  livres_intro: ["Une haute bibliothèque. Cinq gros volumes ont le dos plus usé que les autres. Ils semblent pouvoir s'enfoncer."],
  livres_ok: ["Un déclic sourd. La bibliothèque glisse lentement sur le côté… une petite pièce apparaît derrière."],
  livres_ko: ["Les livres reviennent d'eux-mêmes à leur place. Rien ne s'est passé."],
  coffre_edran: ["Dans le coffre : un épais registre relié de cuir. « Registre de Brumeval — naissances et départs ».", "Une page est marquée d'un ruban : « Famille Vey : Aldric, Héloïse et la petite Ilya. Partis vers Vélmaré l'hiver de la Grande Brume. Jamais arrivés. »", "En marge, d'une écriture tremblée : « J'ai promis de garder la maison. Je n'ai pas su. — É. »"],
  grotte_runes: ["Des signes anciens, gravés profondément, luisent d'un bleu froid. Vous en reconnaissez un : le symbole des Veilleurs, qui « retenaient la brume ».", "Ce lieu est bien plus ancien que le village."],
  grotte_coffre: ["Un coffre de pierre, couvert de mousse. À l'intérieur, enveloppé de cuir huilé : un fragment de carte.", "On y voit Brumeval, la cascade… et, au nord de la falaise, un cercle tracé à l'encre rouge que personne au village n'a jamais mentionné."],
  grotte_vide: ["Le coffre est vide maintenant."],
  grenouille_jour: ["Une vieille statue de grenouille, couverte de mousse. Ses yeux de pierre regardent vers l'est, là où le soleil se lève.", "Elle semble attendre quelque chose."],
  grenouille_aube: ["Le premier rayon du soleil touche la statue : ses yeux s'illuminent d'un vert doux.", "Un grincement de pierre — la gueule s'entrouvre. À l'intérieur, une petite clé de bronze, encore tiède : la Clé de l'aube."],
  grenouille_vu: ["La grenouille garde la bouche close à présent. Mission accomplie, semble-t-elle dire."],
  souche_jour: ["Une souche creuse, pleine de feuilles mortes. Rien d'intéressant… pour l'instant."],
  souche_renard: ["Le renard blanc a disparu. Au fond de la souche, sous les feuilles, quelque chose brille : un pendentif d'argent en forme de lune.", "Au dos, gravé finement : « Pour Ilya ». "],
  souche_vide: ["Il n'y a plus que des feuilles mortes."],
  ab_lettre: ["Une lettre jaunie, posée sur la table :", "« Mon aimée, la brume monte chaque nuit un peu plus près des maisons. Nous partirons pour Vélmaré avant l'hiver. Prends seulement l'essentiel. — Aldric »"],
  ab_berceau: ["Un berceau vide. Une petite couverture brodée de lunes, et un prénom : « Ilya »."],
  ab_portrait: ["Vous retournez le portrait : un homme, une femme, un nourrisson. Au dos : « Famille Vey ».", "Le visage de l'homme ressemble étrangement à quelqu'un du village… en plus jeune."],
  ab_journal: ["Un carnet tombé sous la table. La dernière page :", "« Édran gardera le registre. Torven ne me pardonnera pas de partir. Si nous ne revenons pas, que quelqu'un répare la maison pour Ilya. »"],
  ab_plancher_tot: ["Une latte du plancher bouge un peu… mais rien ne permet encore de comprendre pourquoi elle vous intrigue."],
  ab_plancher_ferme: ["Sous la latte, une petite boîte de fer. Sa serrure est ornée d'un soleil levant. Elle ne s'ouvre pas sans la bonne clé."],
  ab_plancher_ok: ["La Clé de l'aube tourne dans la serrure. Dans la boîte : une lettre scellée, adressée « À mon frère Torven ».", "Vous comprenez soudain le portrait : Aldric était le frère de Torven."],
  ab_plancher_vide: ["La cachette est vide."],
  ab_trace_toutes: ["Vous avez rassemblé l'histoire de cette maison. En repassant près de l'entrée, une latte du plancher sonne creux sous vos pas."],
  porte_fermee: ["La porte est fermée à clé."],
  porte_nuit: ["La porte est verrouillée : on dort, à l'intérieur."],
  maison_reparee: ["La maison des Vey a retrouvé un toit, et ses fenêtres ne sont plus clouées. Une couverture brodée de lunes est pliée sur le berceau."]
};

// bulles échangées entre habitants (conversations entre eux)
export const CHAT = {
  any: ["Tu as vu la brume ce matin ?", "Le pain de Gwenna est meilleur que jamais.", "Borin a encore tapé jusqu'à la nuit.", "Il paraît qu'une caravane passera bientôt.", "Les moutons de Gaspard se sont encore échappés.", "Belle soirée, pour une fois.", "Tu crois que l'hiver sera rude ?", "Les cloches de la chapelle ont sonné tôt.", "Il fait doux, ce soir."],
  edran: ["J'ai retrouvé une vieille carte dans les archives.", "Les registres ne mentent jamais, eux."],
  maelys: ["J'ai reçu des épices du Sud !", "Les prix du sel montent encore."],
  hugues: ["Rien à signaler au pont.", "J'ai vu des traces de loup près de la rivière."],
  liora: ["La sauge pousse bien cette année.", "Il me faudrait de la mousse de cascade."],
  torven: ["Depuis la souche noire, je ne coupe plus au nord-ouest. Alors je travaille le bois ici.", "Ce bois-là, il chante quand on le travaille."],
  anselme: ["Que l'aube vous garde.", "Il faudrait réparer le vitrail bleu."],
  borin: ["Ma forge a faim de charbon.", "Une bonne lame, ça se mérite."],
  gwenna: ["Ce soir, ragoût de lapin !", "Encore un voyageur qui n'a pas payé…"],
  fete: ["Quelle belle fête !", "On n'avait pas dansé depuis des années.", "Les guirlandes, c'est Torven qui les a faites !"]
};

// dialogues avec le joueur : fonction (pnj, contexte) → liste de répliques
export function talk(n, c) {
  const h = c.h, late = h >= 20 || h < 6, morning = h < 11;
  const L = [];
  const greet = late ? 'Bonsoir.' : morning ? 'Bonjour !' : 'Bonne journée.';
  switch (n.id) {
    case 'edran':
      if (c.items.registre && !c.flags.edran_registre) { c.flags.edran_registre = 1; return ["Tu as trouvé le registre… Alors tu sais.", "Aldric m'avait confié la maison. J'ai laissé la brume et le temps la ronger. J'avais honte d'y retourner.", "Si quelqu'un doit la relever, c'est Torven. Parle-lui."]; }
      if (n.act === 'work') L.push(greet + " Je classe les archives. Chaque famille de Brumeval a sa page, ici.");
      else if (n.act === 'sit' && n.entry[1].startsWith('banc_chene')) L.push("Ce vieux chêne en a vu, des amoureux. Regarde bien son écorce, un jour.");
      else L.push(greet + " Les jours se ressemblent à Brumeval, et c'est très bien ainsi.");
      if (!c.found.bibliotheque) L.push("Mes livres ? Je les range selon le soleil. Une vieille manie.");
      return L;
    case 'maelys':
      if (c.fete) return ["La fête ! Tout le monde est sur la place. Prends une pomme, c'est offert."];
      if (n.act === 'work') return [greet + " Pommes, épices, fil de laine — tout ce qu'il faut à Brumeval.", "Si tu passes par la ferme, dis à Gaspard que j'attends ses œufs."];
      return [greet + " Je ferme bientôt. Reviens demain matin."];
    case 'borin':
      if (n.act === 'work') return ["*CLANG* — Hm ? Ah, un visiteur.", "Je forge des fers pour l'écurie et des clous pour Torven. Les épées, c'est pour les gens pressés."];
      return ["Laisse-moi manger en paix, j'ai tapé le fer toute la journée."];
    case 'hugues':
      if (late) return ["Halte… ah, ce n'est que toi. Je surveille le pont.", c.found.renard ? "Le renard blanc ? Tu l'as suivi ? Alors il t'a choisi." : "La nuit, de l'autre côté du pont, on voit parfois un renard blanc. On dit qu'il guide ceux qui le suivent."];
      if (n.act === 'work') return ["Un, deux ! Un, deux ! — Pardon, l'entraînement du matin."];
      return [greet + " Je fais ma ronde. Brumeval est calme, et je compte bien que ça dure."];
    case 'liora':
      if (n.act === 'gather') return ["Chut, ne marche pas sur la sauge !", c.found.grotte ? "Tu es passé derrière la cascade ? Alors tu as vu les signes des Veilleurs…" : "Derrière la cascade, l'eau chante différemment. Mon père disait qu'on pouvait y passer à pied sec, de pierre en pierre."];
      if (n.act === 'work') return [greet + " Infusion de menthe des brumes : contre la toux et les mauvais rêves.", "Torven passe ses journées à l'établi devant chez moi. Il dit que c'est pour la lumière… "];
      return [greet + " Belle journée pour cueillir."];
    case 'torven':
      if (c.items.lettre_torven && !c.flags.torven_lettre) { c.flags.torven_lettre = 1; return ["… C'est l'écriture d'Aldric.", "« Si nous ne revenons pas, répare la maison pour Ilya. » Il m'a demandé ça, et moi je lui en voulais d'être parti…", "Demain, je commence. Cette maison aura un toit avant l'hiver. Merci."]; }
      if (c.repair === 1) return ["Je refais la charpente de la maison d'Aldric. Encore un peu de patience."];
      if (c.repair === 2) return ["La maison des Vey est debout. Peut-être qu'un jour, quelqu'un y vivra de nouveau."];
      if (n.act === 'work') return [greet + " Une charrette pour Gaspard. Le chêne, c'est dur, mais ça dure.", "La maison abandonnée ? … Je n'aime pas en parler."];
      return [greet + " Une chope au coin du feu, voilà ce qu'il me faut."];
    case 'gwenna':
      return [greet + " Bienvenue au Chêne Tranquille ! Soupe, pain, et un lit si tu en as besoin.", !c.found.chat ? "Tu as vu Mousse ? Mon chat. Il dort au soleil près de la porte, ce paresseux." : "Mousse t'a adopté, on dirait !", !c.found.bibliotheque ? "Édran ? Il parle toujours du soleil quand il range ses livres. Drôle d'homme." : "Édran a l'air plus léger, ces temps-ci."];
    case 'anselme':
      if (n.act === 'pray') return ["… que l'aube garde Brumeval. — Ah, bienvenue dans la chapelle, voyageur."];
      return [greet + " La chapelle est ouverte à tous.", !c.found.grenouille ? "La statue de grenouille, près de la cascade ? Les anciens disaient qu'elle ne s'éveille qu'à l'aube." : "Tu as vu la grenouille s'éveiller ? Peu de gens peuvent en dire autant."];
  }
  return [greet];
}
