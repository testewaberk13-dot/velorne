'use strict';
// ===================== Statistiques attribuables (décision de l'utilisateur du 23/11) =====================
// Force, Agilité, Vitalité, Intelligence, Volonté. La croissance par race reste la base (aucune perte pour les
// sauvegardes) ; chaque niveau donne 3 points à répartir. Valeurs par point, seuil de rendement décroissant (40 points)
// et points par niveau : PROPOSITIONS à équilibrer.
const STAT_KEYS = ['for', 'agi', 'vit', 'int', 'vol'];
const STAT_INFO = {
  for: { n: 'Force', d: 'Dégâts physiques (+0,3 attaque par point). À 20 points : résistance aux interruptions avec les attaques lourdes.' },
  agi: { n: 'Agilité', d: 'Vitesse d\'attaque (+0,5 %), critique (+0,2 %) et endurance max (+1) par point : plus d\'esquives, arc plus précis.' },
  vit: { n: 'Vitalité', d: 'PV max (+2), défense physique (+0,3), régénération des PV et résistance aux altérations (+0,3 %) par point.' },
  int: { n: 'Intelligence', d: 'Puissance magique (+0,3) et mana max (+2,5) par point.' },
  vol: { n: 'Volonté', d: 'Défense magique (+0,35), régénération du mana (+0,05/s), endurance max (+0,5) et remplissage de l\'ultime (+1 %) par point.' }
};
const STAT_PER_LVL = 3, STAT_SOFT = 40;
const RACE_STAT_PROFILE = { humain: { for: 1, agi: 1, vit: 1, int: 1, vol: 1 }, elfe: { agi: 2, int: 2, vol: 1 }, orc: { for: 2, vit: 2, agi: 1 }, lezard: { vit: 2, for: 2, vol: 1 }, demi_demon: { int: 2, vol: 2, for: 1 } };
function statEff(p) { return p <= STAT_SOFT ? p : STAT_SOFT + (p - STAT_SOFT) * 0.5; }
function statTotalPts(P) { return STAT_PER_LVL * Math.max(0, (P.lvl || 1) - 1); }
function statSpent(P) { return STAT_KEYS.reduce((a, k) => a + ((P.stats && P.stats[k]) || 0), 0); }
function statFree(P) { return Math.max(0, statTotalPts(P) - statSpent(P)); }
function statAutoAllocate(P) { // répartition d'office selon le profil de la race (anciennes sauvegardes)
  P.stats = { for: 0, agi: 0, vit: 0, int: 0, vol: 0 };
  const prof = RACE_STAT_PROFILE[(P.look && P.look.race) || 'humain'] || RACE_STAT_PROFILE.humain;
  const seq = []; for (const k in prof) for (let i = 0; i < prof[k]; i++) seq.push(k);
  let left = statTotalPts(P), i = 0; while (left > 0) { P.stats[seq[i % seq.length]]++; left--; i++; }
}
const _computeStatsST = computeStats;
computeStats = function (P) {
  const S = _computeStatsST(P);
  if (!P.stats) return S;
  const e = k => statEff(P.stats[k] || 0);
  S.atk += e('for') * 0.3; if ((P.stats.for || 0) >= 20) S.flags.poiseHeavy = 1;
  S.atkSpeed *= 1 + e('agi') * 0.005; S.crit += e('agi') * 0.002; S.maxsta += e('agi') * 1;
  S.maxhp += Math.round(e('vit') * 2); S.defP += e('vit') * 0.3; S.regenHp += e('vit') * 0.02; S.statusRes += e('vit') * 0.003;
  S.mag += e('int') * 0.3; S.maxmp += Math.round(e('int') * 2.5);
  S.defM += e('vol') * 0.35; S.regenMp += e('vol') * 0.05; S.maxsta += Math.round(e('vol') * 0.5); S.ultGain = 1 + e('vol') * 0.01;
  // affinité principale = magie innée (décision du 23/11) : +10 % de puissance magique (PROPOSITION de valeur)
  if (P.magic) S.mag *= 1.10;
  return S;
};
// Volonté : remplissage de l'ultime sur les éliminations
const _killEnemyST = killEnemy;
killEnemy = function (e) { const P = G.player, u0 = P ? P.ult : 0; const r = _killEnemyST(e); try { if (P && P.st8 && P.st8.ultGain > 1 && P.ult > u0) P.ult = Math.min(100, u0 + (P.ult - u0) * P.st8.ultGain); } catch (er) {} return r; };
// affinité : +25 % de gain de maîtrise pour la magie innée (affinité principale) et les affinités du rituel
const _magicXpST = magicXp;
magicXp = function (P, fam, n) { const aff = fam && (fam === P.magic || (P.affin || []).includes(fam)); return _magicXpST(P, fam, aff ? n * 1.25 : n); };
// points au passage de niveau
const _gainXpST = gainXp;
gainXp = function (n) { const P = G.player, l0 = P ? P.lvl : 0; _gainXpST(n); try { if (P && P.lvl > l0) toast('+' + (STAT_PER_LVL * (P.lvl - l0)) + ' points de statistiques à répartir (Menu → Personnage)', '#ffe27a'); } catch (e) {} };
// fiche de personnage : répartition
const _persoHTMLST = persoHTML;
persoHTML = function (P) {
  if (!P.stats) statAutoAllocate(P);
  const free = statFree(P);
  const rows = STAT_KEYS.map(k => `<div style="display:flex;align-items:center;gap:6px;justify-content:space-between"><span><b>${STAT_INFO[k].n}</b> ${P.stats[k]}<br><small style="opacity:.75">${STAT_INFO[k].d}</small></span>${free > 0 ? `<button data-stat="${k}">+1</button>` : ''}</div>`).join('');
  const box = `<div class="sk"><div style="width:100%"><b>Statistiques</b> — points à répartir : <b style="color:#ffe27a">${free}</b><div style="margin-top:4px;line-height:1.45">${rows}</div><div class="row" style="margin-top:4px"><button data-statreset="1">${P.statResetFree !== false ? 'Réinitialiser (gratuit une fois)' : 'Réinitialiser (' + statResetCost(P) + ' or)'}</button></div><small style="opacity:.7">Au-delà de ${STAT_SOFT} points dans une statistique, chaque point compte pour moitié. Valeurs : propositions.</small></div></div>`;
  return box + _persoHTMLST(P);
};
function statResetCost(P) { return 50 * (P.lvl || 1); }
document.addEventListener('click', ev => {
  const P = G.player; if (!P) return;
  const b = ev.target.closest && ev.target.closest('[data-stat]');
  if (b) { if (statFree(P) > 0) { P.stats[b.dataset.stat]++; refreshStats(P); sfx('ui'); } openMenu('perso'); return; }
  const r = ev.target.closest && ev.target.closest('[data-statreset]');
  if (r) {
    if (P.statResetFree === false) { const c = statResetCost(P); if (P.gold < c) { toast('Il faut ' + c + ' or', '#ffb36b'); return; } P.gold -= c; }
    P.stats = { for: 0, agi: 0, vit: 0, int: 0, vol: 0 }; P.statResetFree = false; refreshStats(P); sfx('ui'); toast('Points de statistiques rendus : répartis-les à nouveau', '#ffe27a'); openMenu('perso');
  }
});
// sauvegarde et chargement (anciennes sauvegardes : répartition d'office + réinitialisation gratuite)
const _saveGameST = saveGame;
saveGame = function () { _saveGameST(); try { const P = G.player; if (!P || G.mode !== 'play') return; const s = store(SAVE_KEY); if (s) { s.stats = P.stats; s.statResetFree = P.statResetFree; store(SAVE_KEY, s); } } catch (e) {} };
const _startGameST = startGame;
startGame = function (look, sv) {
  _startGameST(look, sv);
  try { const P = G.player; const fresh = !sv || !sv.stats || (sv.statResetFree === undefined && STAT_KEYS.every(k => !sv.stats[k]));
    if (sv && !fresh) { P.stats = sv.stats; P.statResetFree = sv.statResetFree; } else { statAutoAllocate(P); P.statResetFree = true; } refreshStats(P); P.hp = Math.min(P.st8.maxhp, Math.max(P.hp, 1)); } catch (e) { console.warn('stats', e); }
};
