'use strict';
// ===================== GUIDE EN JEU : onglet d'aide + conseils aux bons moments =====================
MENU_TABS.splice(2, 0, ['aide', 'Guide']);
const TIPS = {
  magie: ['Ta magie innée', () => { const F = MAGIC_DATA[G.player.magic]; return `Ta magie est <b style="color:${F.col}">${F.n}</b>.<br><br>• Tes sorts sont sur les touches <b>1, 2, 3</b> (ou les boutons de compétence à l'écran). Chaque sort coûte du mana.<br>• Plus tu lances tes sorts, plus ta <b>maîtrise</b> monte. Elle <b>débloque de nouveaux sorts</b> (sorts 4 à 9), puis l'<b>ultime</b> au niveau 10.<br>• Pour changer les sorts équipés : <b>Menu (☰) → Compétences</b>.<br><br>Tu trouveras toutes ces explications dans <b>Menu → Guide</b>.`; }],
  style: ['Ton style de combat', () => `Tu as appris un style de combat : il détermine tes armes et ta <b>technique d'arme</b> (touche <b>Q</b>).<br><br>• Attaque : <b>J</b> · Esquive : <b>Espace</b> · Parade : <b>L</b> · Potion : <b>F</b>.<br>• Plus tu utilises une arme, plus elle monte en maîtrise et devient puissante.<br>• Il existe 7 styles : cherche leurs maîtres dans le monde.`],
  niveau: ['Niveau du personnage', () => `Tu viens de monter de niveau : tes PV, ton mana et ta puissance augmentent, et tu es soigné.<br><br>Le niveau du personnage ne débloque pas de sort. Les <b>sorts</b> se débloquent avec la <b>maîtrise de ta magie</b>, que tu fais monter en lançant tes sorts et en touchant les ennemis.`],
  maitrise: ['Nouveau sort débloqué !', () => `Ta maîtrise a augmenté : tu as débloqué un <b>nouveau sort</b>.<br><br>Pour l'utiliser :<br>1. Ouvre le <b>Menu (☰)</b>, onglet <b>Compétences</b>.<br>2. Choisis un emplacement (1, 2 ou 3).<br>3. Sélectionne le nouveau sort dans la liste.<br><br>Les sorts verrouillés (cadenas) indiquent le niveau de maîtrise requis.`],
  ultime: ['Ultime chargé', () => `Ta jauge d'ultime est pleine : appuie sur <b>R</b> (ou le bouton Ultime) pour le lancer.<br><br>La jauge se remplit en combattant et en parant. À la <b>maîtrise 10</b> de ta magie, tu débloques un ultime unique, à sélectionner dans <b>Menu → Compétences</b>.`]
};
function queueTip(id) { if (G.flags['tip_' + id]) return; G.tipQ = G.tipQ || []; if (!G.tipQ.includes(id)) G.tipQ.push(id); }
function showNextTip() {
  if (!G.tipQ || !G.tipQ.length || G.mode !== 'play' || G.paused || G.ui || G.dlg || !G.player) return;
  const id = G.tipQ.shift(); if (G.flags['tip_' + id]) return; G.flags['tip_' + id] = 1;
  const t = TIPS[id]; dialog(t[0], t[1](), [['Compris', () => closePanel()]]);
}
function updateMenuBadge() { const b = $('hbMenu'); if (b) b.textContent = G.flags && G.flags.newSkill ? '☰🔴' : '☰'; }
setInterval(() => {
  try {
    const P = G.player; if (!P || G.mode !== 'play' || !G.flags) return;
    if (P.magic) queueTip('magie');
    if (typeof hasStyleAny === 'function' && hasStyleAny(P)) queueTip('style');
    if (P.lvl >= 2) queueTip('niveau');
    if (P.ult >= 100) queueTip('ultime');
    if (G.flags.newSkill) queueTip('maitrise');
    updateMenuBadge(); showNextTip();
  } catch (e) { }
}, 700);
// alerte « nouvelle compétence » : explique où la trouver
(function () {
  const orig = magicXp;
  magicXp = function (P, fam, n) {
    const before = (GRIMOIRE[fam] && P.mastery) ? magLevel(P, fam) : 0;
    orig(P, fam, n);
    if (!GRIMOIRE[fam] || fam !== P.magic && fam !== P.magic2) return;
    const after = magLevel(P, fam);
    if (after > before) {
      let got = 0, ult = 0; for (let n = 4; n <= 10; n++) if (SKILL_LVL[n] > before && SKILL_LVL[n] <= after) { got++; if (n === 10) ult = 1; }
      if (got) { G.flags.newSkill = 1; later(() => toast(ult ? 'ULTIME débloqué ! Menu → Compétences → Ultime' : 'Nouveau sort ! Menu → Compétences pour l\'équiper', '#ffe27a'), 2200); }
      else later(() => toast('Maîtrise niveau ' + after + ' : prochain sort au niveau ' + [2, 3, 5, 6, 8, 9, 10].find(l => l > after), '#ffe27a'), 2200);
    }
  };
})();
function guideHTML() {
  const P = G.player, F = P.magic && MAGIC_DATA[P.magic];
  const info = F ? magXpInfo(P, P.magic) : null;
  const next = info && info.l < 10 ? `${(() => { const nx = [4, 5, 6, 7, 8, 9, 10].find(n => SKILL_LVL[n] > info.l); return nx ? `Prochain déblocage : ${nx === 10 ? 'l\'ultime' : 'sort n°' + nx} au niveau de maîtrise ${SKILL_LVL[nx]} (XP de maîtrise : ${info.x}${SKILL_LVL[nx] === info.l + 1 ? ' / ' + info.next : ''}).` : 'Tous les sorts et l\'ultime sont débloqués.'; })()}` : (info ? 'Maîtrise complète.' : '');
  const S = (t, b) => `<div class="sk"><div><b>${t}</b><div style="margin-top:4px;line-height:1.45">${b}</div></div></div>`;
  return `<div class="guide">
  ${F ? S('Où j\'en suis', `Magie : <b style="color:${F.col}">${F.n}</b> · Maîtrise niveau <b>${info.l}/10</b>.<br>${next}`) : S('Où j\'en suis', 'Tu n\'as pas encore de magie : va voir le Maître Mage Orvael au Cercle des Arcanes (est du village).')}
  ${S('Les sorts de ta magie', 'Tes sorts sont sur les touches <b>1, 2, 3</b> (boutons de compétence sur mobile). Les 3 premiers sorts de ta magie sont disponibles dès le départ. Chacun coûte du mana et a un temps de recharge.')}
  ${S('La maîtrise : comment débloquer de nouveaux sorts', 'Chaque sort lancé et chaque coup magique porté fait progresser la <b>maîtrise</b> de ta magie. Les sorts 4 à 9 se débloquent aux niveaux de maîtrise 2, 3, 5, 6, 8 et 9. L\'ultime se débloque au niveau 10. Tu es prévenu par un message et un point rouge 🔴 sur le bouton Menu.')}
  ${S('Équiper un nouveau sort', '<b>Menu (☰) → Compétences</b> : choisis l\'emplacement (1, 2 ou 3), puis le sort dans la liste. Les sorts verrouillés sont marqués d\'un cadenas.')}
  ${S('L\'ultime', 'La jauge d\'ultime se remplit en combattant et en parant. Touche <b>R</b> (ou bouton Ultime). Au <b>niveau de maîtrise 10</b>, tu débloques l\'ultime de ta magie : active-le dans <b>Menu → Compétences → Ultime</b>. Avant, tu utilises l\'ultime de base.')}
  ${S('Niveau du personnage et maîtrise : la différence', 'Le <b>niveau du personnage</b> (XP des combats) augmente PV, mana et puissance. La <b>maîtrise de la magie</b> débloque les sorts. La <b>maîtrise d\'arme</b> et de <b>style</b> améliorent tes armes.')}
  ${S('Styles de combat', 'Il y a 7 styles, chacun avec un maître à trouver dans le monde. Le style définit tes armes et ta <b>technique d\'arme</b> (touche <b>Q</b>).')}
  ${S('Commandes', 'Attaque <b>J</b> · Esquive <b>Espace</b> · Parade <b>L</b> · Potion <b>F</b> · Interagir <b>E</b> · Menu <b>Échap</b> · Éveil <b>G</b> · Aptitude raciale <b>X</b>. Sur mobile, les boutons sont à l\'écran (réglables dans Paramètres).')}
  </div>`;
}
