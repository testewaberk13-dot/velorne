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

// ===================== le grand monde : explications, objectif guidé =====================
Object.assign(TIPS, {
  combo: ['Finale de combo', () => `Le <b>dernier coup</b> de ta chaîne d'attaques déclenche une <b>finale</b> propre à ton arme :<br>• Épée : estocade tournoyante · Katana : triple entaille · Faux : onde de fauchage<br>• Bouclier : fracas qui étourdit · Dagues : fente éclair · Lance : estoc perçant · Arc : salve triple<br><br>Enchaîne les coups sans pause pour la déclencher.`],
  reso: ['Résonance', () => `Quand tu lances un <b>sort</b>, tes <b>3 prochains coups d'arme</b> (6 s) sont chargés selon l'élément de ta magie : brûlure, givre, éclairs en chaîne, poison, vampirisme, malédiction, éclat sacré ou entrave.<br><br>Alterne sort et coups d'arme pour en profiter. Il existe aussi des <b>réactions</b> : glace sur brûlure (Choc thermique), feu sur poison (Explosion), foudre sur ralenti (Conduction), feu sur ralenti (Fonte), lumière sur maudit (Purification).`],
  reg_desert: ['Désert d\'Arkhan (niv. 6+)', () => `Tu entres dans le <b>désert</b>. Ici vivent chacals, serpents et pillards.<br><br>• Le <b>camp d'Arkhan</b> (oasis, à l'ouest) a un marchand, un forgeron et <b>Nadir</b>, qui t'explique la mission.<br>• Le boss <b>Sultan Zahrak</b> t'attend dans son palais, au centre-est.<br>• Si les monstres sont trop forts, retourne t'entraîner dans la forêt : tu es libre d'aller où tu veux.<br>• Plus loin à l'est : les cimes. Au sud : le cratère.`],
  reg_neige: ['Pics de Givrenuit (niv. 14+)', () => `Région <b>enneigée</b>, très dangereuse : loups, ogres des glaces, mages du givre.<br><br>• Le village d'<b>Orélia</b> (ouest) est ton point de repos : marchand et soigneuse.<br>• Le boss <b>Kragh</b> est au nord-est.<br>• Les monstres résistent à la glace : utilise le feu ou la lumière !`],
  reg_marais: ['Marais de Grisebrume (niv. 10+)', () => `Un <b>marais</b> sombre et empoisonné.<br><br>• Les pilotis de <b>Vasebourg</b> (nord) abritent une guérisseuse, un alchimiste et un marchand.<br>• Le boss <b>Mère Grisebrume</b> est au fond, au sud.<br>• Les monstres sont souvent <b>poison</b> : emporte des potions. La magie de feu leur fait plus mal.`],
  reg_volcan: ['Cratère de Cendrefeu (niv. 18+)', () => `Un <b>volcan</b> : la lave est infranchissable, reste sur les chemins sombres.<br><br>• La <b>forge de Cendrefeu</b> (ouest) a un maître de forge, un maître runique et un marchand.<br>• Le boss <b>Ignaroth</b> est au sud-est.<br>• À l'est, la <b>porte de la Citadelle</b> reste scellée tant que les 4 sceaux ne sont pas brisés.`],
  reg_citadelle: ['Citadelle de Malvorak (niv. 22+)', () => `Tu es dans le <b>dernier lieu</b> du jeu. Chevaliers démons, cultistes et gardes d'ossements défendent le Seigneur démon.<br><br>• L'esprit du roi <b>Aldaran</b> te guide à l'entrée.<br>• <b>Malvorak</b> est au centre de la grande salle. Prépare potions et ultime !<br>• Si tu tombes, tu te réveilles au village : rien n'est perdu.`]
});
function objectiveTarget() {
  const Q = G.quests, P = G.player; if (!P || !Q || (typeof introText === 'function' && introText())) return null;
  const spawn = k => WORLD.spawns.find(s => s.kind === k), npc = r => WORLD.npcs.find(n => n.role === r);
  let t = null;
  if (Q.main === 1 && !G.flags.bossDead) { const s = spawn('boss_orc_chief'); if (s) t = { x: s.x, y: s.y, l: 'Grakhul' }; }
  else if (Q.main === 2) { const n = npc('quest'); if (n) t = { x: n.x, y: n.y, l: 'Théobald' }; }
  else if (Q.main >= 3 && !Q.saga) { const n = npc('quest'); if (n) t = { x: n.x, y: n.y, l: 'Théobald' }; }
  else if (Q.main >= 3 && !sagaDone()) {
    if (sagaSeals() >= 4) { const s = spawn('boss_malvorak'); if (s) t = { x: s.x, y: s.y, l: 'Malvorak' }; }
    else { let best = null; for (const k of SEAL_KEYS) { if (G.flags[SAGA[k].flag]) continue; const s = spawn(SAGA[k].boss); if (!s) continue; const d = dist(P.x, P.y, s.x, s.y); if (!best || d < best.d) best = { d, x: s.x, y: s.y, l: SAGA[k].region }; } t = best; }
  }
  return t;
}
const _drawHUD0 = drawHUD;
drawHUD = function (ctx) {
  _drawHUD0(ctx);
  try {
    const t = objectiveTarget(); if (!t || G.mode !== 'play') return; const P = G.player;
    const pulse = 0.6 + 0.4 * Math.sin(G.t * 5);
    // minicarte
    const mw = 96, mh = Math.round(96 * MH / MW), mx = W - mw - 5, my = 5, sx = mw / (MW * TILE), sy = mh / (MH * TILE);
    ctx.strokeStyle = `rgba(255,226,122,${pulse})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(mx + t.x * sx, my + t.y * sy, 2.5 + pulse * 1.5, 0, 7); ctx.stroke();
    // flèche à l'écran si l'objectif est hors champ
    const ox = t.x - G.cam.x, oy = t.y - G.cam.y; const dtl = Math.round(dist(P.x, P.y, t.x, t.y) / TILE);
    if (SET.guide !== 'leger' && (ox < 10 || ox > W - 10 || oy < 10 || oy > H - 10)) {
      const cx = W / 2, cy = H / 2, a = Math.atan2(t.y - P.y, t.x - P.x), r = Math.min(W, H) / 2 - 26;
      const ax = clamp(cx + Math.cos(a) * 1000, 24, W - 24), ay = clamp(cy + Math.sin(a) * 1000, 40, H - 40);
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.globalAlpha = 0.55 + 0.35 * pulse; ctx.fillStyle = '#ffe27a'; ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -7); ctx.lineTo(-3, 0); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      txt(ctx, t.l + ' · ' + dtl + ' cases', clamp(ax, 70, W - 70), clamp(ay + (ay < H / 2 ? 16 : -10), 30, H - 6), '#ffe9a0', 7, 'center');
    }
  } catch (e) { }
};
// conseils de région + porte scellée
setInterval(() => {
  try {
    if (!G || !G.player || G.mode !== 'play') return;
    const z = G.zone; if (z && TIPS['reg_' + z.id]) queueTip('reg_' + z.id);
    const P = G.player; if (!gateOpen() && P.x > 183 * TILE && P.x < 192 * TILE && P.y > 98 * TILE && P.y < 114 * TILE && (!G.gateMsg || G.t - G.gateMsg > 8)) { G.gateMsg = G.t; toast(`La porte de la Citadelle est scellée : brise les 4 sceaux (${sagaSeals()}/4)`, '#ffb3ff'); }
  } catch (e) { }
}, 700);
const _guideHTML0 = guideHTML;
guideHTML = function () {
  let h = _guideHTML0(); const S = (t, b) => `<div class="sk"><div><b>${t}</b><div style="margin-top:4px;line-height:1.45">${b}</div></div></div>`;
  const extra = S('Le grand monde', `Le monde est <b>ouvert</b> : tu peux aller partout, mais les régions éloignées sont plus dangereuses (niveau conseillé affiché à l'arrivée).<br>• Sorties de la forêt : <b>est</b> → Désert (niv. 6+) → Cimes (14+) ; <b>sud</b> → Marais (10+) → Cratère (18+) → Citadelle (22+).<br>• La <b>minicarte</b> (en haut à droite) montre la carte entière ; un <b>cercle jaune</b> et une <b>flèche à l'écran</b> indiquent ton objectif.`) +
    S('La saga du Seigneur démon', `Après Grakhul, parle à l'<b>Ancien Théobald</b> : 4 gardiens portent des sceaux noirs (désert, marais, cimes, cratère). Brise-les (dans l'ordre que tu veux), puis la porte de la <b>Citadelle</b> s'ouvre : Malvorak t'y attend.<br>Chaque région a un village avec un PNJ qui te donne une récompense après le boss. Le journal de quêtes (Menu → Quêtes) suit tes sceaux.`) +
    S('Combos et résonances', `• <b>Finale d'arme</b> : le dernier coup de ta chaîne déclenche un effet propre à chaque arme.<br>• <b>Résonance</b> : après un sort, tes 3 coups suivants (6 s) sont chargés selon ta magie.<br>• <b>Réactions</b> : glace sur brûlure, feu sur poison, foudre sur ralenti, feu sur ralenti, lumière sur maudit = gros bonus de dégâts.<br>• <b>Enchaînement</b> : tuer à la suite donne jusqu'à +50 % d'XP.`) +
    S('Conseils de survie', `• Si tu meurs, tu te réveilles au village et tu perds 10 % d'or : rien d'autre.<br>• Les marchands et forgerons des villages éloignés te permettent de te soigner et d'améliorer ton équipement sans revenir à Brumeval.<br>• Les monstres sont <b>résistants ou faibles</b> selon l'élément : essaie une autre magie si tes sorts font peu de dégâts.`);
  return h.replace(/<\/div>\s*$/, extra + '</div>');
};
