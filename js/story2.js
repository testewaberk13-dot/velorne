'use strict';
// ===================== LA SAGA DU SEIGNEUR DÉMON =====================
const SAGA = {
  desert: { boss: 'boss_sultan', flag: 'dead_boss_sultan', region: 'Désert d\'Arkhan', where: 'à l\'est de la forêt, au palais en ruines', gold: 400, lvl: 6,
    intro: "Le <b>Sultan Zahrak</b> règne sur les dunes depuis qu'un étranger lui a offert un sceau noir. Il pille chaque caravane. Son palais est au cœur du désert, à l'est de l'oasis.",
    done: "Zahrak est tombé ! Les caravanes pourront enfin passer. Voici ta part du butin." },
  marais: { boss: 'boss_marais', flag: 'dead_boss_marais', region: 'Marais de Grisebrume', where: 'au sud de la forêt, au fond du marais', gold: 700, lvl: 10,
    intro: "<b>Mère Grisebrume</b> était guérisseuse avant que le sceau noir ne la ronge. Son marais empoisonne tout. Va au bout du chemin de pilotis, vers le sud : emporte des antidotes.",
    done: "Elle repose enfin… Merci, voyageur. Le marais pourra guérir. Prends ceci." },
  neige: { boss: 'boss_neige', flag: 'dead_boss_neige', region: 'Cimes de Givrenuit', where: 'à l\'extrémité est du désert, dans les cimes', gold: 1000, lvl: 14,
    intro: "<b>Kragh</b>, l'Alpha blanc, mène les loups des neiges depuis qu'il porte le sceau. Il se tient au nord-est des cimes. Couvre-toi : le froid ralentit.",
    done: "Le blizzard se calme déjà. Tu as brisé le sceau des cimes. Prends cette récompense." },
  volcan: { boss: 'boss_volcan', flag: 'dead_boss_volcan', region: 'Cratère de Cendrefeu', where: 'au sud du désert ou à l\'est du marais, au cœur du cratère', gold: 1400, lvl: 18,
    intro: "<b>Ignaroth</b>, gardien de braise, forge les armes de l'armée démoniaque. Il se tient au fond du cratère, au sud-est. Sa lave ne pardonne pas : reste sur les chemins !",
    done: "La forge s'éteint… Les armées de Malvorak n'auront plus d'acier. Tiens, tu l'as mérité." },
  final: { boss: 'boss_malvorak', flag: 'dead_boss_malvorak', region: 'Citadelle de Malvorak', where: 'au fond de la citadelle', gold: 0, lvl: 22 }
};
const SEAL_KEYS = ['desert', 'marais', 'neige', 'volcan'];
function sagaDone() { return !!(G.flags && G.flags.dead_boss_malvorak); }
function sagaElder(n) {
  const Q = G.quests, F = G.flags, s = sagaSeals();
  if (sagaDone()) { dialog(n.name, "Malvorak n'est plus. Brumeval, Arkhan, les cimes, les marais et le cratère te doivent la paix. Les bardes chanteront ton nom… <br><br><small>Le monde reste ouvert : continue d'explorer, de chasser et de renforcer ta magie.</small>", [['Merci', closePanel]]); return true; }
  if (!Q.saga) {
    dialog(n.name, "Grakhul n'était qu'un <b>bras</b>. Il obéissait à <b>Malvorak, le Seigneur démon</b>, enfermé dans sa citadelle au sud-est du monde. Pour le libérer, il a donné un <b>sceau noir</b> à quatre gardiens :<br><br>• le <b>Sultan Zahrak</b> — désert, à l'est (niv. 6+)<br>• <b>Mère Grisebrume</b> — marais, au sud (niv. 10+)<br>• <b>Kragh</b> — cimes enneigées, plus à l'est (niv. 14+)<br>• <b>Ignaroth</b> — cratère de feu, au sud-est (niv. 18+)<br><br>Brise les quatre sceaux : la porte de la Citadelle s'ouvrira alors… Les sorties de la forêt sont à l'est et au sud.",
      [['J\'y vais', () => { Q.saga = 1; toast('Nouvelle saga : briser les 4 sceaux du Seigneur démon', '#c4b5fd'); closePanel(); }]]);
    return true;
  }
  const names = SEAL_KEYS.map(k => (F[SAGA[k].flag] ? '✔ ' : '✘ ') + SAGA[k].region);
  dialog(n.name, `Sceaux brisés : <b>${s}/4</b><br>${names.join('<br>')}<br><br>` + (s >= 4 ? "La porte de la Citadelle est ouverte, tout au sud-est, derrière le cratère. Affronte Malvorak… et reviens !" : "Les sorties de la forêt : <b>est</b> (désert) et <b>sud</b> (marais). Prépare-toi bien avant chaque gardien."), [['Merci', closePanel]]);
  return true;
}
function sagaTalk(n) {
  const P = G.player, Q = G.quests, F = G.flags, d = SAGA[n.saga];
  Q.sagaRew = Q.sagaRew || {};
  if (n.saga === 'final') {
    if (sagaDone()) return dialog(n.name, "Tu as libéré le monde… Mon regard peut enfin se reposer. Merci.", [['…', closePanel]]);
    return dialog(n.name, "Je fus Aldaran, premier roi. Malvorak m'a pris mon royaume… Il t'attend plus loin, au cœur de la citadelle, entouré de ses chevaliers. Avance sans crainte : ta magie est plus forte que tu ne le penses.", [['J\'avance', closePanel]]);
  }
  if (F[d.flag]) {
    if (!Q.sagaRew[n.saga]) return dialog(n.name, d.done, [['Merci', () => { Q.sagaRew[n.saga] = 1; P.gold += d.gold; giveItem(P, 'potion', 3, 'Récompense de saga'); giveItem(P, 'eclat_exception', 1, 'Récompense de saga'); toast('+' + d.gold + ' or, 3 potions, 1 Éclat exceptionnel', '#ffe27a'); closePanel(); }]]);
    return dialog(n.name, "Merci encore, héros. " + (sagaSeals() >= 4 ? "Tu peux entrer dans la Citadelle, tout au sud-est." : "Il reste d'autres sceaux à briser : retourne voir l'Ancien Théobald pour faire le point."), [['À bientôt', closePanel]]);
  }
  return dialog(n.name, d.intro + `<br><br><small>Niveau conseillé : ${d.lvl}+ · ${d.region}</small>`, [[Q.saga ? 'Compris' : 'Merci', closePanel]]);
}
function sagaBossDown(kind) {
  const Q = G.quests, F = G.flags;
  if (kind === 'boss_malvorak') {
    Q.saga = 3; toast('MALVORAK EST VAINCU ! Le monde est sauvé', '#ffe27a');
    G.later = G.later || []; G.later.push({ t: 3, fn: () => dialog('Épilogue', "Le Seigneur démon s'effondre. Son sceau se brise, et la brume qui couvrait le monde se dissipe.<br><br>Brumeval, Arkhan, Vasebourg, Givrenuit, Cendrefeu : tous fêteront ton nom. Mais le monde est vaste, et ta magie peut encore grandir…<br><br><b>Fin de la saga principale.</b> Tu peux continuer à explorer librement.", [['Continuer l\'aventure', closePanel]]) });
    return;
  }
  const key = SEAL_KEYS.find(k => SAGA[k].boss === kind); if (!key) return;
  const s = sagaSeals();
  toast(`Sceau de ${SAGA[key].region} brisé ! (${s}/4)`, '#c4b5fd');
  if (s >= 4) { toast('La porte de la Citadelle s\'ouvre, au sud-est du cratère…', '#ffb3ff'); F.citadelleOpen = 1; }
}
// la porte disparaît quand les 4 sceaux sont brisés (aussi après chargement d'une sauvegarde)
setInterval(() => { try { if (WORLD && WORLD.gateProp && G && G.flags && gateOpen()) { WORLD.props = WORLD.props.filter(p => p !== WORLD.gateProp); WORLD.gateProp = null; } } catch (e) { } }, 1000);
