'use strict';
// ===================== Phase E (1) — métier de récolteur =====================
// Les filons de fer des Monts de Fer, les cristaux (Forêt de Cristal, Aether, souterrain…) deviennent des ressources récoltables.
// Le métier de récolteur progresse à chaque récolte (niveaux 1 à 10) et augmente les quantités. Valeurs : PROPOSITIONS.
Object.assign(PROPS.ironore, { interact: 'gather', yields: [['fer', 1, 3]], glint: '#ffb36b', label: 'Minerai de fer', respawn: 100 });
if (REG.cristal_magique) Object.assign(PROPS.crystal, { interact: 'gather', yields: [['cristal_magique', 1, 2]], glint: '#9fdcff', label: 'Cristal chantant', respawn: 150 });
function recolteLevel(P) { const c = P.craft.recolte || (P.craft.recolte = { lvl: 1, xp: 0 }); return c.lvl; }
const _gatherE = gather;
gather = function (n) {
  const P = G.player, ready = !(n.respawnAt && n.respawnAt > G.t), before = (P.items || []).length;
  _gatherE(n);
  if (!ready || !(n.respawnAt > G.t)) return; // rien récolté (épuisé ou inventaire plein)
  const lv = recolteLevel(P), c = P.craft.recolte;
  const bonus = lv >= 8 ? 2 : lv >= 4 ? 1 : 0;
  if (bonus) { const id = n.def.yields[0][0]; giveItem(P, id, bonus, 'Récolte (métier niv. ' + lv + ')'); num(n.x, n.y - 44, '+' + bonus + ' (métier)', '#9be7a8'); }
  if (n.type === 'ironore' && REG.mithril && Math.random() < 0.25) { giveItem(P, 'mithril', 1, 'Minerai de fer'); num(n.x, n.y - 56, '+1 Mithril', '#7dd3fc'); }
  c.xp += 4; while (c.lvl < 10 && c.xp >= CRAFT_XP(c.lvl)) { c.xp -= CRAFT_XP(c.lvl); c.lvl++; toast('Récolteur : niveau ' + c.lvl + (c.lvl === 4 || c.lvl === 8 ? ' — récoltes plus abondantes' : ''), '#9be7a8'); }
  try { repGain('artisans', 4); } catch (e) {}
};
// métiers dans l'onglet Codex
const _codexHTMLE = codexHTML;
codexHTML = function (P) {
  const names = Object.assign({}, STATIONS, { recolte: 'Récolteur' });
  const rows = Object.keys(names).map(k => { const c = P.craft[k]; return `<div>${names[k]} : <b>niveau ${c ? c.lvl : 1}</b>${c && c.lvl < 10 ? ` <small>(${c.xp}/${CRAFT_XP(c.lvl)})</small>` : ''}</div>`; }).join('');
  return `<div class="sk"><div style="width:100%"><b>Métiers</b><div style="margin-top:4px;line-height:1.5">${rows}<small>Récolteur : filons, herbes, bois ancien, minerai de fer et cristaux ; quantités bonus aux niveaux 4 et 8 (proposition).</small></div></div></div>` + _codexHTMLE(P);
};
