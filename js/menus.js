'use strict';
// =====================================================================
//  INTERFACES (Partie 5) : personnage, inventaire + comparaison, fiche
//  d'arme, maîtrise, forge (amélioration / évolution / fabrication /
//  réparation / démantèlement), artisan, alchimiste, enchantements,
//  reliques, marchande, réserve, Spins, collection, historique.
// =====================================================================
function openPanel(html, cls) { const m = $('panel'); m.className = 'panel show ' + (cls || ''); m.innerHTML = html; G.paused = true; for (const a in IN.held) release(a); }
function closePanel() { cancelAnimationFrame(previewRAF); cancelAnimationFrame(spinRAF); $('panel').className = 'panel'; G.paused = false; G.dlg = null; G.ui = null; if (G.player && G.player.dirty) rebuildPlayer(G.player); saveGame(); }
const esc = s => String(s).replace(/</g, '&lt;');
function rc(d) { return RARITY[d.rarity || 1].c; }
function badge(d) { return `<span class="rb" style="color:${rc(d)}">${RARITY[d.rarity || 1].n}</span>${d.rank ? `<span class="rk">${RANKS[d.rank].n}</span>` : ''}`; }
function itemIcon(d, big) { return `<i class="ic${big ? ' icb' : ''}" style="${iconCSS(d.icon)}"></i>`; }
function cellHTML(P, inst, attrs) {
  const d = def(inst); const eq = isEquipped(P, inst.uid);
  return `<div class="cell r${d.rarity || 1}${d.rank ? ' rS' : ''}" ${attrs} style="border-color:${rc(d)}">${itemIcon(d)}${inst.n > 1 ? `<b>${inst.n}</b>` : ''}${inst.lvl ? `<u>+${inst.lvl}</u>` : ''}${eq ? '<em>É</em>' : ''}${inst.locked ? '<s>🔒</s>' : ''}${d.rank ? '<q>S</q>' : ''}</div>`;
}
// ---------- statistiques d'un objet (pour fiches et comparaison) ----------
function weaponDamage(inst) { const d = def(inst); const mb = masteryBonus(inst); return Math.round(d.baseDamage * (1 + 0.08 * inst.lvl) * (1 + mb.dmg)); }
function itemRows(inst) {
  const d = def(inst); const r = [];
  if (d.kind === 'weapon') {
    r.push(['Dégâts', weaponDamage(inst)], ['Vitesse d\'attaque', d.attackSpeed], ['Portée', d.range], ['Chance critique', Math.round((d.criticalChance + masteryBonus(inst).crit + Math.floor(inst.lvl / 3) * 0.02) * 100), '%'], ['Dégâts critiques', d.criticalDamage, '×'], ['Poids', d.weight, '', true]);
    if (d.block) r.push(['Blocage', Math.round(d.block * 100), '%']);
  } else {
    const m = d.kind === 'armor' ? 1 + 0.08 * inst.lvl : 1;
    if (d.def) r.push(['Défense physique', Math.round(d.def * m)]); if (d.mdef) r.push(['Défense magique', Math.round(d.mdef * m)]);
    if (d.atk) r.push(['Attaque', d.atk]); if (d.mag) r.push(['Puissance magique', d.mag]); if (d.hp) r.push(['PV', d.hp]); if (d.mp) r.push(['Mana', d.mp]); if (d.sta) r.push(['Endurance', d.sta]);
    if (d.crit) r.push(['Chance critique', Math.round(d.crit * 100), '%']); if (d.critDmg) r.push(['Dégâts critiques', '+' + Math.round(d.critDmg * 100), '%']);
    if (d.spd) r.push(['Vitesse', Math.round(d.spd * 100), '%']); if (d.regenHp) r.push(['Récupération PV', d.regenHp, '/s']); if (d.regenMp) r.push(['Récupération mana', d.regenMp, '/s']);
    if (d.statusRes) r.push(['Résistance aux altérations', Math.round(d.statusRes * 100), '%']);
    for (const k in d.res || {}) r.push(['Résistance ' + ELEMENTS[k].toLowerCase(), Math.round(d.res[k] * 100), '%']);
  }
  return r;
}
function effectLines(inst) {
  const d = def(inst); const out = [];
  (d.passiveEffects || []).forEach(p => out.push('◆ ' + PASSIVES[p]));
  (d.activeSkills || []).forEach(s => out.push('✦ Compétence : <b>' + TECHS[s].n + '</b> — ' + TECHS[s].desc + ' <small>(maîtrise 3)</small>'));
  (d.magicSynergies || []).forEach(m => out.push('✧ Synergie renforcée avec la magie : ' + MAGIC_FAMILIES[m].n));
  if (d.awakening) out.push('☀ ' + (d.upgradePaths.type === 'transform' ? 'Transformation' : 'Éveil') + ' : <b>' + TRANSFORMS[d.awakening.form].n + '</b> — ' + TRANSFORMS[d.awakening.form].desc);
  if (d.set) { const S = SETS[d.set]; out.push('▣ Ensemble <b>' + S.n + '</b> : ' + Object.entries(S.bonus).map(([k, b]) => k + ' pièces — ' + b.desc).join(' ; ')); }
  if (d.cat) out.push('Armure ' + ARMOR_CATS[d.cat].n.toLowerCase() + ' : ' + ARMOR_CATS[d.cat].desc);
  if (d.active) out.push('✦ Activation (touche Relique) : <b>' + d.active.n + '</b> — ' + d.active.desc + ' <small>(recharge ' + d.active.cd + ' s)</small>');
  if (d.passiveText) out.push('◆ ' + d.passiveText);
  (inst.ench || []).forEach(e => out.push('✶ ' + ENCHANTS[e].n + ' : ' + ENCHANTS[e].desc));
  if (d.desc) out.push(d.desc);
  return out;
}
function slotForItem(P, d) { if (d.kind === 'weapon') return d.style === 'bouclier' && P.style === 'epee' ? 'offhand' : 'weapon'; if (d.kind === 'armor') return d.slot; if (d.kind === 'accessory' || d.kind === 'relic') { for (const s of ['acc1', 'acc2', 'acc3']) if (!P.equip[s]) return s; return 'acc1'; } return null; }
function compareHTML(P, inst) {
  const d = def(inst); const slot = slotForItem(P, d); if (!slot) return '';
  const cur = P.equip[slot] && P.equip[slot] !== inst.uid ? findInst(P, P.equip[slot]) : null;
  if (!cur) return `<div class="cmp"><small>Aucun objet équipé en ${EQUIP_SLOT_NAME[slot].toLowerCase()} : comparaison impossible.</small></div>`;
  const A = Object.fromEntries(itemRows(cur).map(r => [r[0], r])), B = Object.fromEntries(itemRows(inst).map(r => [r[0], r]));
  const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])];
  let h = `<div class="cmp"><div class="cmph"><span>Équipé : <b style="color:${rc(def(cur))}">${def(cur).name}${cur.lvl ? ' +' + cur.lvl : ''}</b></span></div><table><tr><th></th><th>Actuel</th><th>Sélection</th><th>Écart</th></tr>`;
  for (const k of keys) {
    const a = A[k] ? parseFloat(A[k][1]) || 0 : 0, b = B[k] ? parseFloat(B[k][1]) || 0 : 0; const inv = (A[k] || B[k])[3];
    const df = Math.round((b - a) * 100) / 100; const good = inv ? df < 0 : df > 0; const u = (A[k] || B[k])[2] || '';
    h += `<tr><td>${k}</td><td>${A[k] ? A[k][1] + u : '—'}</td><td>${B[k] ? B[k][1] + u : '—'}</td><td class="${df === 0 ? '' : good ? 'up' : 'down'}">${df === 0 ? '=' : (df > 0 ? '+' : '') + df + u}</td></tr>`;
  }
  const ea = effectLines(cur), eb = effectLines(inst);
  h += `</table>${ea.length || eb.length ? `<div class="cmpe"><div><small>Effets actuels</small>${ea.map(x => '<p>' + x + '</p>').join('') || '<p>—</p>'}</div><div><small>Effets de la sélection</small>${eb.map(x => '<p>' + x + '</p>').join('') || '<p>—</p>'}</div></div>` : ''}</div>`;
  return h;
}
// ---------- équipement ----------
function equipInst(P, inst) {
  const d = def(inst); let slot;
  if (d.kind === 'weapon') {
    if (!P.stylesKnown[d.style] && !(d.style === 'bouclier' && P.style === 'epee' && hasStyle(P))) return 'Tu ne maîtrises pas le style ' + STYLES[d.style].n + '. ' + MASTERS[d.style].name + ' l\'enseigne ' + MASTERS[d.style].place + '.';
    if (d.style === P.style) slot = 'weapon';
    else if (d.style === 'bouclier' && P.style === 'epee') slot = 'offhand';
    else return 'Incompatible avec ton style actuel (' + STYLES[P.style].n + '). Cette arme demande le style ' + STYLES[d.style].n + ' (Personnage → Changer de style).';
  } else slot = slotForItem(P, d);
  if (!slot) return 'Cet objet ne s\'équipe pas';
  if (P.trans && slot === 'weapon') endTransform(P);
  P.equip[slot] = inst.uid; rebuildPlayer(P); sfx('pick'); burst(P.x, P.y - 20, 12, ['#ffe9a0', '#fff']);
  return null;
}
function unequipSlot(P, slot) {
  if (!P.equip[slot]) return;
  if (slot === 'weapon' && P.trans) endTransform(P);
  if (invUsed(P) >= invCap(P)) { toast('Inventaire plein : impossible de retirer cet objet', '#ffb36b'); return; }
  delete P.equip[slot]; rebuildPlayer(P); sfx('ui');
}
function changeStyle(P, st) {
  if (!STYLES[st] || st === P.style) return;
  if (!P.stylesKnown[st]) { toast('Style non appris : ' + MASTERS[st].name + ' l\'enseigne ' + MASTERS[st].place + '.', '#ffb36b'); return; }
  P.style = st;
  const w = eqDef(P, 'weapon'); if (w && w.style !== st) delete P.equip.weapon;
  if (st !== 'epee') delete P.equip.offhand;
  if (!P.equip.weapon) { const c = P.items.find(i => def(i).kind === 'weapon' && def(i).style === st && !isEquipped(P, i.uid)); if (c) P.equip.weapon = c.uid; }
  rebuildPlayer(P); toast('Style de combat : ' + STYLES[st].n, '#ffe9a0');
}

// ===================== MENU PRINCIPAL =====================
let menuTab = 'perso';
const MENU_TABS = [['perso', 'Personnage'], ['sac', 'Inventaire'], ['comp', 'Compétences'], ['collec', 'Collection'], ['hist', 'Historique'], ['quetes', 'Quêtes'], ['opt', 'Paramètres'], ['credits', 'Crédits']];
function tabsHTML(tabs, cur, attr, extra) { return `<div class="ptabs">${tabs.map(([k, n]) => `<button class="${k === cur ? 'on' : ''}" data-${attr}="${k}">${n}</button>`).join('')}${extra || ''}<button class="x" data-close>✕</button></div>`; }
function openMenu(tab) {
  if (tab) menuTab = tab; sfx('ui'); const P = G.player; G.ui = { kind: 'menu' };
  let h = tabsHTML(MENU_TABS.map(t => t[0] === 'comp' && G.flags.newSkill ? [t[0], t[1] + ' 🔴'] : t), menuTab, 'tab', `<span class="gold">${P.gold} or</span>`) + '<div class="pbody">';
  if (menuTab === 'perso') h += persoHTML(P);
  else if (menuTab === 'sac') h += invHTML(P);
  else if (menuTab === 'comp') { h += skillsHTML(P); if (G.flags.newSkill) { G.flags.newSkill = 0; if (typeof updateMenuBadge === 'function') updateMenuBadge(); } }
  else if (menuTab === 'aide') h += guideHTML();
  else if (menuTab === 'voyage') h += travelHTML();
  else if (menuTab === 'codex') h += codexHTML(P);
  else if (menuTab === 'collec') h += collectionHTML(P);
  else if (menuTab === 'hist') h += historyHTML(P);
  else if (menuTab === 'quetes') h += `<div class="quests">${questList()}</div>`;
  else if (menuTab === 'opt') h += optsHTML();
  else if (menuTab === 'credits') h += creditsHTML();
  h += '</div>'; openPanel(h, 'menu');
  if (menuTab === 'perso') startPreview();
}
function persoHTML(P) {
  const S = P.st8; const sl = styleLevel(P, P.style); const syn = synergy(P); const R = RACES[P.look.race];
  const MF2 = P.magic && MAGIC_DATA[P.magic];
  const slots = EQUIP_SLOTS.filter(s => s !== 'offhand' || P.style === 'epee').map(s => { const i = eqInst(P, s); const d = i && def(i); return `<div class="slot ${d ? '' : 'empty'}" data-eqslot="${s}">${d ? itemIcon(d) : '<i class="ic"></i>'}<div><small>${EQUIP_SLOT_NAME[s]}</small><b style="color:${d ? rc(d) : '#776'}">${d ? d.name + (i.lvl ? ' +' + i.lvl : '') : '—'}</b>${d && d.rank ? '<span class="rk">S</span>' : ''}${d && SET.durability && d.durability ? `<span class="dur">${Math.ceil(i.dur / d.durability * 100)} %</span>` : ''}</div></div>`; }).join('');
  const resRow = RES_KEYS.map(k => `<span>${ELEMENTS[k]} <b>${Math.round(S.res[k] * 100)} %</b></span>`).join('');
  return `<div class="perso"><div class="pv"><canvas id="pview" width="96" height="96"></canvas><div class="pname">${esc(P.name || 'Héros')} · Niv. ${P.lvl}</div>
    <div class="stylebox">Race : <b>${R.n}</b><br>Style : ${hasStyle(P) ? `<b>${STYLES[P.style].n}</b> (maîtrise ${sl}/10)` : '<i>aucun style appris</i>'}<br>Magie innée : ${MF2 ? `<b style="color:${MF2.col}">${MF2.n}</b> <small style="color:${MAGIC_TIERS[MF2.tier].c}">${MAGIC_TIERS[MF2.tier].n}</small>${P.magic2 ? ` + <b style="color:${MAGIC_DATA[P.magic2].col}">${MAGIC_DATA[P.magic2].n}</b>` : ''}` : '<i>non révélée</i>'}<br>${syn ? `Synergie : <b>${syn.n}</b>${syn.via ? ' <small>(affinité)</small>' : ''}` : '<small>' + (MF2 && hasStyle(P) ? 'Pas de synergie entre ce style et ta magie' : 'Synergie : —') + '</small>'}<br><button data-act="style">Styles de combat</button> <button data-act="race">Race</button></div></div>
    <div class="pcol"><div class="slots">${slots}</div>
    <div class="stats2"><div>PV <b>${Math.round(S.maxhp)}</b></div><div>Mana <b>${S.maxmp}</b></div><div>Endurance <b>${S.maxsta}</b></div><div>Attaque physique <b>${S.atk}</b></div><div>Puissance magique <b>${S.mag}</b></div><div>Défense physique <b>${S.defP}</b></div><div>Défense magique <b>${S.defM}</b></div><div>Vitesse <b>${Math.round(S.spd)}</b></div><div>Précision <b>${Math.round(S.acc * 100)} %</b></div><div>Chance critique <b>${Math.round(S.crit * 100)} %</b></div><div>Dégâts critiques <b>×${S.critDmg.toFixed(2)}</b></div><div>Résistance <b>${Math.round(S.statusRes * 100)} %</b></div><div>Récupération <b>${S.regenHp.toFixed(1)} PV/s · ${S.regenMp.toFixed(1)} mana/s</b></div><div>Blocage <b>${Math.round(S.block * 100)} %</b></div><div>Monstres vaincus <b>${P.kills}</b></div><div>Inventaire <b>${invUsed(P)}/${invCap(P)}</b></div></div>
    <div class="resrow">${resRow}</div>
    ${S.sets.length ? `<div class="sets">${S.sets.map(s => `<p><b>${SETS[s.id].n}</b> (${s.n} pièces) : ${Object.entries(SETS[s.id].bonus).map(([k, b]) => `<span class="${s.n >= +k ? 'okc' : 'dim'}">${k} — ${b.desc}</span>`).join(' · ')}</p>`).join('')}</div>` : ''}
    </div></div><p class="hint">Touche un emplacement pour voir l'objet ou le retirer. Ton apparence change aussitôt.</p>`;
}
function styleChooser(P) {
  openPanel(`<div class="ptabs"><button class="on">Styles de combat</button><button class="x" data-tab="perso">✕</button></div><div class="pbody"><div class="styles">${Object.entries(STYLES).map(([k, s]) => { const known = P.stylesKnown[k]; const M = MASTERS[k]; return `<div class="stl ${k === P.style && known ? 'on' : ''} ${known ? '' : 'unk'}" ${known ? `data-style="${k}"` : ''}>${itemIcon({ icon: s.icon })}<div><b>${s.n}</b> ${known ? `<small>maîtrise ${styleLevel(P, k)}/10</small>` : '<small class="koc">non appris</small>'}<p>${s.desc}</p><small>Technique : ${TECHS[s.tech].n}${P.magic && SYNERGIES[k + ':' + P.magic] ? ' · Synergie avec ta magie : ' + SYNERGIES[k + ':' + P.magic].n : ''}</small>${known ? '' : `<br><small>Maître : <b>${M.name}</b>, ${M.place} (niveau ${M.lvl} requis).</small>`}</div></div>`; }).join('')}</div><p class="hint">Chaque style s'apprend auprès de son maître, au terme d'une initiation. Changer de style retire l'arme incompatible.</p></div>`, 'menu');
}
function raceSheet(P) {
  const R = RACES[P.look.race]; const A = R.active;
  openPanel(`<div class="ptabs"><button class="on">Race : ${R.n}</button><button class="x" data-tab="perso">✕</button></div><div class="pbody racesheet"><p class="lore">${R.short}</p><p>${R.origin}</p><p><b>Physique :</b> ${R.physique}</p><h4>Capacités raciales</h4>${R.traits.map(t => '<p>◆ ' + t + '</p>').join('')}<h4>Résistances et faiblesses</h4><p>${Object.entries(R.res).map(([k, v]) => `<span class="${v > 0 ? 'okc' : 'down'}">${ELEMENTS[k]} ${v > 0 ? '+' : ''}${Math.round(v * 100)} %</span>`).join(' · ') || 'Aucune'}</p><p>${R.weak}</p><h4>Aptitude active : ${A.n}</h4><p>${A.desc} <small>(recharge ${A.cd} s, touche ${actLabel('racial')} / bouton ❖)</small></p><h4>Évolution</h4><p>${R.growthText}</p></div>`, 'menu');
}
// ---------- inventaire ----------
const INVUI = { cat: 'all', sort: 'rar', sel: null };
function invHTML(P) {
  let list = invList(P); if (INVUI.cat !== 'all') list = list.filter(i => invCatOf(def(i)) === INVUI.cat);
  const eqList = INVUI.cat === 'all' || INVUI.cat === 'weapon' || INVUI.cat === 'armor' || INVUI.cat === 'accessory' || INVUI.cat === 'relic' ? EQUIP_SLOTS.map(s => eqInst(P, s)).filter(Boolean).filter(i => INVUI.cat === 'all' || invCatOf(def(i)) === INVUI.cat) : [];
  sortItems(list, INVUI.sort);
  const sel = INVUI.sel && findInst(P, INVUI.sel);
  return `<div class="invbar"><div class="cats">${INV_CATS.map(([k, n]) => `<button class="${INVUI.cat === k ? 'on' : ''}" data-icat="${k}">${n}</button>`).join('')}</div>
    <select id="isort"><option value="rar" ${INVUI.sort === 'rar' ? 'selected' : ''}>Trier : rareté</option><option value="nom" ${INVUI.sort === 'nom' ? 'selected' : ''}>Trier : nom</option><option value="type" ${INVUI.sort === 'type' ? 'selected' : ''}>Trier : type</option><option value="new" ${INVUI.sort === 'new' ? 'selected' : ''}>Trier : récent</option></select><span class="cap">${invUsed(P)}/${invCap(P)}</span></div>
    <div class="invwrap"><div class="inv">${eqList.map(i => cellHTML(P, i, `data-sel="${i.uid}"`)).join('')}${list.map(i => cellHTML(P, i, `data-sel="${i.uid}"`)).join('') || (eqList.length ? '' : '<p class="dim">Aucun objet dans cette catégorie.</p>')}</div>
    <div class="detail">${sel ? detailHTML(P, sel) : '<p class="dim">Touche un objet pour voir son nom, sa rareté, ses effets et la comparaison avec ton équipement.</p>'}</div></div>`;
}
function detailHTML(P, inst) {
  const d = def(inst); const eq = isEquipped(P, inst.uid);
  const canEq = (d.kind === 'weapon' || d.kind === 'armor' || d.kind === 'accessory' || d.kind === 'relic');
  const usable = d.kind === 'consumable' || d.kind === 'grimoire' || d.kind === 'lore' || d.kind === 'upgrade';
  return `<div class="dh">${itemIcon(d, true)}<div><b style="color:${rc(d)}">${d.name}${inst.lvl ? ' +' + inst.lvl : ''}</b><br>${badge(d)} <small>${d.category || (d.cat ? 'Armure ' + ARMOR_CATS[d.cat].n.toLowerCase() : d.type || ({ material: 'Matériau', consumable: 'Consommable', grimoire: 'Grimoire', quest: 'Objet de quête', lore: 'Chronique', upgrade: 'Amélioration', relicraw: 'Relique' })[d.kind] || '')}${d.style ? ' · ' + STYLES[d.style].n : ''}${eq ? ' · <b>Équipé</b>' : ''}</small></div></div>
    ${itemRows(inst).length ? `<div class="rows">${itemRows(inst).map(r => `<span>${r[0]} <b>${r[1]}${r[2] || ''}</b></span>`).join('')}</div>` : ''}
    <div class="eff">${effectLines(inst).map(x => '<p>' + x + '</p>').join('')}${d.origin ? `<p><small>Provenance : ${d.origin}</small></p>` : ''}${inst.origin ? `<p><small>Obtenu : ${esc(inst.origin)}</small></p>` : ''}${d.kind === 'weapon' ? `<p><small>Maîtrise : niveau ${masteryLevel(inst)}/5</small></p>` : ''}</div>
    ${canEq && !eq ? compareHTML(P, inst) : ''}
    <div class="acts">${canEq ? (eq ? `<button data-uneq="${eq}">Retirer</button>` : `<button data-equip="${inst.uid}">Équiper</button>`) : ''}${usable ? `<button data-use="${inst.uid}">Utiliser</button>` : ''}
    <button data-lock="${inst.uid}">${inst.locked ? 'Déverrouiller' : 'Verrouiller'}</button>${d.kind === 'weapon' || d.kind === 'armor' || d.kind === 'accessory' || d.kind === 'relic' ? `<button data-fiche="${inst.uid}">Fiche complète</button>` : ''}</div>`;
}
function ficheHTML(P, inst) {
  const d = def(inst); const ml = masteryLevel(inst); const nx = CONFIG.masteryXp[ml + 1];
  const ev = evoInfo(inst); const aw = awakenInfo(inst); const up = upgradeCost(inst);
  const syn = synergy(P);
  let h = `<div class="fiche"><div class="dh">${itemIcon(d, true)}<div><h3 style="color:${rc(d)}">${d.name}${inst.lvl ? ' +' + inst.lvl : ''}</h3>${badge(d)} <small>${d.category || d.type || ''}${d.style ? ' · style ' + STYLES[d.style].n : ''}</small></div></div>
    <p class="lore">« ${esc(d.lore || '')} »</p><p>${esc(d.description || d.desc || '')}</p>
    <div class="rows">${itemRows(inst).map(r => `<span>${r[0]} <b>${r[1]}${r[2] || ''}</b></span>`).join('')}${SET.durability && d.durability ? `<span>Durabilité <b>${Math.ceil(inst.dur)}/${d.durability}</b></span>` : ''}${d.kind === 'weapon' ? `<span>Dégâts de base <b>${d.baseDamage}</b></span>` : ''}</div>
    <h4>Effets</h4>${effectLines(inst).map(x => '<p>' + x + '</p>').join('') || '<p class="dim">Aucun effet particulier.</p>'}`;
  if (d.kind === 'weapon') {
    h += `<h4>Synergies magiques</h4><p>${!P.magic ? 'Ta magie innée n\'est pas encore révélée.' : syn ? `Ton style et ta magie (${MAGIC_FAMILIES[P.magic].n}) : <b>${syn.n}</b> — ${syn.desc} <small>(coût ${syn.cost} mana, recharge ${syn.icd} s)</small>${(d.magicSynergies || []).includes(P.magic) ? ' <b class="okc">Renforcée par cette arme : coût ÷2, effet +30 %.</b>' : ''}` : 'Aucune synergie entre le style ' + STYLES[P.style].n + ' et la magie ' + MAGIC_FAMILIES[P.magic].n + '.'}</p>
    <h4>Maîtrise de l'arme : niveau ${ml}/5</h4><div class="mbar"><i style="width:${nx ? Math.min(100, (inst.mxp - CONFIG.masteryXp[ml]) / (nx - CONFIG.masteryXp[ml]) * 100) : 100}%"></i></div><small>${nx ? Math.floor(inst.mxp) + ' / ' + nx + ' points (chaque coup porté avec cette arme compte)' : 'Maîtrise complète'}</small>
    <ul class="unl">${Object.entries(MASTERY_UNLOCKS).map(([k, t]) => `<li class="${ml >= +k ? 'okc' : 'dim'}">${ml >= +k ? '✓' : '○'} Niveau ${k} : ${t}</li>`).join('')}</ul>`;
  }
  if (d.kind === 'weapon' || d.kind === 'armor') {
    h += `<h4>Amélioration</h4><p>Niveau +${inst.lvl} / +${maxUp(inst)} (chaque niveau : +8 % ; tous les 3 niveaux : +2 % de critique pour les armes). ${inst.lvl < maxUp(inst) ? 'Prochain niveau : ' + up.gold + ' or, ' + matsText(P, up.mats) : 'Maximum atteint.'}</p>`;
    h += `<h4>Évolution</h4><p>${ev ? `Évolue en <b style="color:${rc(ev.next)}">${ev.next.name}</b> (${RARITY[ev.next.rarity].n}) : amélioration +${ev.req.up}, maîtrise ${ev.req.mastery}, ${ev.req.gold} or, ${matsText(P, ev.req.mats)}. Chez le forgeron.` : { none: 'Non évolutive.', upgrade: 'Améliorable uniquement.', transform: 'Transformable (voir ci-dessous).', awaken: 'Éveillable (voir ci-dessous).' }[d.upgradePaths.type] || 'Améliorable uniquement.'}</p>`;
  }
  if (aw) h += `<h4>${d.upgradePaths.type === 'transform' ? 'Transformation' : 'Éveil'}</h4><p><b>${TRANSFORMS[aw.form].n}</b> : ${TRANSFORMS[aw.form].desc}<br>${d.upgradePaths.type === 'transform' ? 'Disponible dès la maîtrise ' + aw.mastery + '.' : (inst.awakened ? '<b class="okc">Arme éveillée.</b>' : 'Conditions : maîtrise ' + aw.mastery + ', ' + matsText(P, aw.mats) + '. Chez Séraphine.')} Activation : jauge d'éveil pleine (coups, éliminations, parades), touche Éveil, durée ${CONFIG.transformDuration} s, retour automatique à la forme normale.</p>`;
  if (d.kind === 'weapon' || d.kind === 'armor') h += `<h4>Enchantements (${inst.ench.length}/${enchSlots(inst)})</h4><p>${inst.ench.map(e => ENCHANTS[e].n).join(', ') || 'Aucun.'} Chez Thalor, le maître runique.</p>`;
  h += `<h4>Obtention et échanges</h4><p>${esc(d.acquisition || d.origin || '—')}<br>${{ tradable: 'Échangeable et vendable.', bound: 'Lié au personnage : ne peut être ni vendu ni échangé.', quest: 'Objet de quête : ne peut pas être vendu.' }[d.tradeRules || 'tradable']}${d.unique ? ' Objet unique : un seul exemplaire possible.' : ''}</p></div>`;
  return h;
}
// ---------- compétences ----------
function skillsHTML(P) {
  const syn = synergy(P);
  const icoHTML = sk => sk && sk.canvasIcon ? `<img src="${sk.canvasIcon.url}">` : `<img src="assets/ui/${sk ? sk.icon : 'spell_shield'}.png">`;
  const row = (icon, name, sub, desc, img) => `<div class="sk">${img ? `<img src="${img === 2 ? icon : 'assets/ui/' + icon + '.png'}">` : itemIcon({ icon })}<div><b>${name}</b> <small>${sub}</small><p>${desc}</p></div></div>`;
  let h = '<div class="skills">';
  const R = RACES[P.look.race];
  if (hasStyle(P)) { const tech = currentTech(P); const T = TECHS[tech]; h += row(STYLES[P.style].icon, 'Technique d\'arme : ' + T.n, `${T.sta} endurance · ${T.cd} s · touche ${actLabel('tech')}`, T.desc + (tech !== STYLES[P.style].tech ? ' <b>(compétence propre de l\'arme)</b>' : '')); }
  else h += `<div class="sk"><img src="${lockIcon().url}"><div><b>Technique d'arme</b><p>Aucun style de combat appris. Kaelen, la maîtresse d'armes, enseigne le premier style au terrain d'entraînement.</p></div></div>`;
  if (!P.magic) {
    h += `<div class="sk"><img src="${lockIcon().url}"><div><b>Sorts 1 à 4 et ultime</b><p>Ta magie innée n'est pas encore révélée. Le Maître Mage Orvael l'éveillera lors du rituel du Magic Spin, au Cercle des Arcanes (est du village).</p></div></div>`;
  } else {
    const F = MAGIC_DATA[P.magic];
    ['s1', 's2', 's3', 's5'].forEach((id, i) => { const k = skillDef(id); h += `<div class="sk">${icoHTML(k)}<div><b>${k.name}</b> <small style="color:${F.col}">${F.n}</small> <small>${k.mp ? k.mp + ' mana · ' : ''}${k.cd} s · touche ${actLabel('skill' + (i + 1))}</small><p>${k.desc}</p></div></div>`; });
    h += grimHTML(P);
    const s4 = skillDef(P.slot4) || SKILLS.s4; const opts = ['s4', ...Object.keys(P.spells)];
    h += `<div class="sk">${icoHTML(s4)}<div><b>Emplacement 4 : ${s4.name}</b> <small>${s4.mp} mana · ${s4.cd} s · touche ${actLabel('skill4')}</small><p>${s4.desc}</p><div class="row">${opts.map(k => `<button class="${P.slot4 === k ? 'on' : ''}" data-slot4="${k}">${(skillDef(k) || {}).name}</button>`).join('')}</div>${Object.keys(P.spells).length ? '' : '<small>Les grimoires interdits apprennent des sorts secrets à placer ici.</small>'}</div></div>`;
    h += row(SKILLS.ult.icon, 'Ultime : ' + F.ult, 'touche ' + actLabel('ult'), SKILLS.ult.desc, true);
  }
  h += `<div class="sk"><div><b>Aptitude raciale : ${R.active.n}</b> <small>${R.n} · recharge ${R.active.cd} s · touche ${actLabel('racial')}</small><p>${R.active.desc}</p></div></div>`;
  if (P.magic && hasStyle(P)) { const aff = MAGIC_DATA[P.magic].aff; h += `<div class="sk"><div><b>Synergie arme × magie</b><p>${syn ? `<b>${syn.n}</b> (${STYLES[P.style].n} + ${MAGIC_DATA[P.magic].n}${syn.via ? ', par affinité' : ''}) : ${syn.desc} Coût ${syn.cost} mana, recharge ${syn.icd} s.` : 'Ton style actuel n\'a pas de synergie avec ta magie innée. Synergies possibles : ' + (Object.keys(SYNERGIES).filter(k => k.endsWith(':' + P.magic) || (aff && k.endsWith(':' + aff))).map(k => STYLES[k.split(':')[0]].n + ' (' + SYNERGIES[k].n + ')').join(', ') || 'aucune') + '.'}</p></div></div>`; }
  h += `<div class="sk"><div><b>Combat</b><p>Appuie pour enchaîner les coups du style, maintiens pour une attaque chargée. Esquive : invulnérable 0,3 s. Parade : bloque juste avant l'impact pour une parade parfaite. Éveil (${actLabel('awaken')}) : transforme une arme éveillée quand la jauge est pleine. Relique (${actLabel('relic')}) : active la relique équipée.</p></div></div></div>`;
  return h;
}
// ---------- collection & historique ----------
let collecCat = 'weapon';
function collectionHTML(P) {
  const cats = [['weapon', 'Armes'], ['armor', 'Armures'], ['accessory', 'Accessoires et reliques'], ['lore', 'Chroniques']];
  let h = `<div class="cats">${cats.map(([k, n]) => `<button class="${collecCat === k ? 'on' : ''}" data-collec="${k}">${n}</button>`).join('')}</div>`;
  if (collecCat === 'lore') return h + `<div class="lorelist">${LORE.map((l, i) => `<p class="${P.lore && P.lore[i] ? '' : 'dim'}">${P.lore && P.lore[i] ? l : '??? — Fragment de chronique à découvrir.'}</p>`).join('')}</div>`;
  const list = collecCat === 'weapon' ? WEAPON_LIST : collecCat === 'armor' ? ARMOR_LIST : ACCESSORY_LIST;
  const seen = list.filter(o => P.seen[o.id]).length;
  h += `<p class="hint">Découverts : ${seen}/${list.length}</p>`;
  const groups = collecCat === 'weapon' ? Object.keys(STYLES).map(s => [STYLES[s].n, list.filter(w => w.style === s)]) : [['', list]];
  for (const [gn, items] of groups) {
    h += gn ? `<h4>${gn}</h4>` : ''; h += '<div class="collec">';
    for (const o of items) { const ok = P.seen[o.id]; h += `<div class="cc ${ok ? '' : 'unk'}" style="border-color:${ok ? rc(o) : '#333'}" ${ok ? `data-cinfo="${o.id}"` : ''}>${ok ? itemIcon(o) : '<i class="ic q">?</i>'}<span>${ok ? o.name : '???'}</span>${ok && o.rank ? '<q>S</q>' : ''}</div>`; }
    h += '</div>';
  }
  return h + '<div id="cinfo" class="info"></div>';
}
function historyHTML(P) {
  const rows = P.history.slice(0, 80).map(hh => { const d = REG[hh.id]; return `<div class="hrow">${itemIcon(d)}<b style="color:${rc(d)}">${d.name}${hh.n > 1 ? ' ×' + hh.n : ''}</b><small>${hh.src} · ${new Date(hh.t).toLocaleString('fr-FR')}</small></div>`; }).join('');
  return `<p class="hint">Historique des récompenses de Spin (les 80 dernières).</p><div class="hist">${rows || '<p class="dim">Aucune récompense pour l\'instant.</p>'}</div>`;
}
function optsHTML() {
  return `<div class="opts"><div class="row"><button data-opt="sound">Effets sonores : ${SET.sound ? 'oui' : 'non'}</button><button data-opt="music">Musique : ${SET.music ? 'oui' : 'non'}</button><button data-opt="shake">Tremblements : ${SET.shake ? 'oui' : 'non'}</button><button data-opt="fs">Plein écran</button><button data-opt="fastspin">Animations de Spin : ${SET.fastSpin ? 'rapides' : 'complètes'}</button><button data-opt="gfx">Qualité graphique : ${gfxLabel()}</button><button data-opt="aim">Assistance de visée : ${aimAssistLabel()}</button><button data-opt="guide">Guidage : ${guideLabel()}</button><button data-opt="durability">Durabilité des équipements : ${SET.durability ? 'activée' : 'désactivée'}</button><button data-opt="transfer">Transférer ma sauvegarde</button></div>
    <h4>Manette</h4><div class="row"><button data-opt="rumble">Vibrations : ${SET.rumble ? 'oui' : 'non'}</button><button data-opt="dead">Zone morte du stick : ${Math.round((SET.padDead || 0.2) * 100)} %</button><span class="hint">${PAD.connected ? 'Manette détectée : ' + esc((PAD.id || '').split('(')[0]) : 'Aucune manette détectée : branche-la ou appuie sur un bouton.'}</span></div>
    ${IS_TOUCH ? `<h4>Commandes tactiles</h4><div class="row"><button data-opt="edit">Déplacer les boutons</button><button data-opt="bigger">Boutons plus grands</button><button data-opt="smaller">Boutons plus petits</button><button data-opt="resettouch">Disposition par défaut</button></div>` : ''}
    <h4>Touches du clavier</h4><div class="keys">${Object.keys(ACTION_LABEL).map(a => `<div><span>${ACTION_LABEL[a]}</span><button data-bind="${a}">${SET.keys[a].map(keyName).join(' / ')}</button></div>`).join('')}</div>
    <div class="row"><button data-opt="resetkeys">Touches par défaut</button><button data-opt="title">Retour au titre</button></div></div>`;
}
function creditsHTML() {
  return `<div class="credits"><p><b>Graphismes</b> : projet Liberated Pixel Cup (LPC) et contributeurs, sous licences libres CC-BY-SA 3.0, GPL 3.0, CC-BY 3.0 et OGA-BY 3.0. Personnages : générateur universel LPC (github.com/LiberatedPixelCup). Décors : LPC Revised d'Eliza Wyatt et contributeurs (github.com/ElizaWy/LPC). Monstres, effets magiques, icônes et tuiles supplémentaires : jeu libre Source of Tales (github.com/tales/sourceoftales).</p>
    ${CREDITS.map(c => `<div class="cr"><b>${c.what}</b>${c.authors ? ' — ' + c.authors : ''}<br><small>${c.license || ''}${c.urls ? ' · ' + c.urls.join(' · ') : ''}</small>${c.text ? `<pre>${c.text.replace(/</g, '&lt;')}</pre>` : ''}</div>`).join('')}</div>`;
}
let previewRAF = 0;
function startPreview() {
  cancelAnimationFrame(previewRAF);
  const cv = $('pview'); if (!cv) return; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; let t = 0;
  const loop = () => { if (!$('pview')) return; t += 1 / 60; const dir = [2, 3, 0, 1][Math.floor(t / 2.5) % 4]; c.clearRect(0, 0, 96, 96); drawShadow(c, 48, 82, 14, 0.3); drawChar(c, G.player.spr, 'walk', dir, 1 + Math.floor(t * 9) % 8, 48, 84); previewRAF = requestAnimationFrame(loop); };
  loop();
}

// ===================== DIALOGUES & PNJ =====================
function dialog(name, text, opts) {
  G.dlg = opts; openPanel(`<div class="dlg"><div class="dname">${name}</div><div class="dtext">${text}</div><div class="dopts">${opts.map((o, i) => `<button data-dlg="${i}">${o[0]}</button>`).join('')}</div></div>`, 'dialog');
}
function interact(n) {
  const P = G.player; sfx('ui');
  if (n.def && n.def.interact) {
    const t = n.def.interact;
    if (t === 'chest' || t === 'cache') return openChest(n);
    if (t === 'spin_weapon') return openSpin('weapon');
    if (t === 'spin_exc') return openSpin('exceptional');
    if (t === 'stash') return openStash();
    if (t === 'gather') return gather(n);
    if (t === 'tomb') return tombInteract(n);
  }
  P.dir = dirOf(n.x - P.x, n.y - P.y); n.dir = dirOf(P.x - n.x, P.y - n.y);
  const Q = G.quests;
  if (n.role === 'archmage') return talkArchmage(n);
  if (n.role === 'master') return talkMaster(n);
  if (n.role === 'quest' && talkElder(n)) return;
  if (n.role === 'saga') return sagaTalk(n);
  if (n.role === 'guard' && !hasStyle(P)) return dialog(n.name, 'Halte ! Personne ne quitte Brumeval sans formation : la forêt grouille de monstres. ' + (P.magic ? 'Va voir <b>Kaelen</b> au terrain d\'entraînement, à l\'ouest.' : 'Commence par rencontrer le <b>Maître Mage Orvael</b>, à l\'est.'), [['Compris', closePanel]]);
  if (n.role === 'quest') {
    if (Q.main === 0) dialog(n.name, "Voyageur ! Le chef de guerre orc <b>Grakhul</b> s'est installé dans la clairière au nord de la forêt. Ses gobelins pillent nos réserves. Peux-tu nous débarrasser de lui ?<br><br><small>Au village : la forge de Borin, l'atelier de Maëlys, l'alchimiste Eldrin, Thalor le maître runique et Séraphine pour les reliques. Le <b>Sanctuaire des lames</b> et l'<b>Autel de l'Exception</b> sont au nord de la place.</small>", [['J\'accepte', () => { Q.main = 1; Q.hunt = Q.hunt || 0; toast('Nouvelle quête : Le chef de guerre', '#ffe27a'); sfx('open'); closePanel(); }], ['Plus tard', closePanel]]);
    else if (Q.main === 1) dialog(n.name, `Grakhul se terre au bout du chemin du nord. Améliore tes armes chez Borin avant de l'affronter, et utilise la <b>parade parfaite</b> contre ses coups lourds !<br><br>Chasse : ${Math.min(Q.hunt, 15)}/15 monstres.`, [['Compris', closePanel]]);
    else if (Q.main === 2) dialog(n.name, "Tu l'as fait ! Le village te doit tout. Prends cette récompense, héros. Et garde l'Éclat qu'il portait : on dit que ces fragments viennent de la Couronne d'Aube.", [['Merci', () => { Q.main = 3; P.gold += 300; gainXp(250); giveItem(P, 'ac_cape_azur', 1, 'Récompense de quête'); giveItem(P, 'eclat_exception', 1, 'Récompense de quête'); toast('+300 or · Cape d\'azur · Éclat d\'Exception', '#ffe27a'); sfx('open'); closePanel(); }]]);
    else if (sagaElder(n)) { } else dialog(n.name, 'Brumeval dort enfin en paix. Mais on parle de ruines plus anciennes, au-delà des montagnes… et de la Couronne d\'Aube.', [['À bientôt', closePanel]]);
    if (Q.hunt >= 15 && !Q.huntDone && Q.main >= 1) { Q.huntDone = true; P.gold += 120; giveItem(P, 'potion', 2, 'Récompense de quête'); giveItem(P, 'sceau_lame', 1, 'Récompense de quête'); toast('Chasse terminée : +120 or, 2 potions, 1 Sceau de lame', '#ffe27a'); }
  } else if (n.role === 'shop') openShop(n);
  else if (n.role === 'smith') openCraftNpc('forge', n);
  else if (n.role === 'artisan') openCraftNpc('artisan', n);
  else if (n.role === 'alchimie') openCraftNpc('alchimie', n);
  else if (n.role === 'runique') openEnchant(n);
  else if (n.role === 'reliques') relicNpc(n);
  else if (n.role === 'mage') dialog(n.name, P.magic ? "La magie coule en toi : ta magie innée est <b>" + MAGIC_FAMILIES[P.magic].n + "</b>. Associée au bon style d'arme, elle crée une synergie. Veux-tu que je restaure tes forces ?" : "Je sens une magie endormie en toi… Seul le Maître Mage Orvael peut l'éveiller, au Cercle des Arcanes à l'est. Veux-tu que je restaure tes forces ?", [['Oui, restaure-moi', () => { P.hp = P.st8.maxhp; P.mp = P.st8.maxmp; sfx('level'); ring(P.x, P.y, 40, '#9fd8ff', 0.5); closePanel(); }], ['Non merci', closePanel]]);
  else dialog(n.name, "Halte ! Au nord, la forêt est infestée. Les gobelins campent à l'est, et le vieux cimetière à l'ouest grouille de squelettes. On dit qu'un roi y est enterré…", [['Merci', closePanel]]);
}
function relicNpc(n) {
  const P = G.player, Q = G.quests;
  const opts = [['Services de reliques', () => openRelics(n)]];
  if (!Q.roi) opts.unshift(['« Un roi est enterré ici ? »', () => dialog(n.name, "Aldaran, le dernier roi. Son tombeau est au cœur du cimetière, à l'ouest. Les squelettes et les chauves-souris qui le hantent portent ses <b>sceaux funéraires</b>. Rapporte-m'en 3 et je t'apprendrai à les poser sur sa tombe. Sa faux est une arme de <b>rang S</b>… si tu survis à son spectre.", [['J\'accepte', () => { Q.roi = 1; toast('Nouvelle quête : Le dernier roi', '#c4b5fd'); sfx('open'); closePanel(); }], ['Plus tard', closePanel]])]);
  else if (Q.roi === 1) opts.unshift([`Sceaux funéraires (${countItem(P, 'sceau_funeraire')}/3)`, () => { if (countItem(P, 'sceau_funeraire') >= 3) { Q.roi = 2; dialog(n.name, "Les trois sceaux… Va au tombeau royal et pose-les. Le roi se lèvera. Bats-le, et sa faux t'appartiendra.", [['J\'y vais', closePanel]]); } else dialog(n.name, 'Il m\'en faut trois. Les gardiens du cimetière les portent.', [['D\'accord', closePanel]]); }]);
  else if (Q.roi === 2 || Q.roi === 3) opts.unshift(['« Le tombeau ? »', () => dialog(n.name, 'Au centre du cimetière, la grande stèle. Pose les sceaux et prépare-toi.', [['Compris', closePanel]])]);
  else if (Q.roi === 4) opts.unshift(['« Le roi est apaisé. »', () => { Q.roi = 5; P.gold += 200; gainXp(200); giveItem(P, 'chronique', 1, 'Récompense de quête'); dialog(n.name, "Tu portes sa faux… Aldaran repose enfin. Garde-la bien : pour l'éveiller, il te faudra un Cœur d'éveil et la maîtriser. Reviens me voir alors.", [['Merci', closePanel]]); }]);
  opts.push(['Au revoir', closePanel]);
  dialog(n.name, 'Les reliques parlent à qui sait écouter. Que puis-je pour toi ?', opts);
}
function tombInteract(n) {
  const P = G.player, Q = G.quests;
  if (Q.roi === 2) {
    if (!G.flags.roiSeals) { if (countItem(P, 'sceau_funeraire') < 3) { toast('Il te faut 3 sceaux funéraires', '#c4b5fd'); return; } takeItem(P, 'sceau_funeraire', 3); G.flags.roiSeals = 1; }
    Q.roi = 3; closePanel(); sfx('roar'); flashScreen('#8b5cf6', 0.5); shake(8);
    const k = spawnEnemy('king_specter', n.x, n.y + 40, { once: true, kind: 'king_specter', x: n.x, y: n.y, n: 0, r: 0 }); k.aggro = true;
    fxAt('quake', n.x, n.y + 30, { fps: 20, scale: 1.4, layer: -1 }); toast('Le Spectre du dernier roi se lève !', '#c4b5fd');
  } else dialog('Tombeau royal', Q.roi >= 4 ? 'Ci-gît Aldaran, dernier roi de Vélorne. Il repose en paix.' : 'Une stèle couverte de mousse : « Ci-gît Aldaran, dernier roi de Vélorne. Que nul ne trouble son sommeil sans ses sceaux. »', [['Partir', closePanel]]);
}
function gather(n) {
  const P = G.player;
  if (n.respawnAt && n.respawnAt > G.t) { toast('Ressource épuisée : revient dans ' + Math.ceil(n.respawnAt - G.t) + ' s', '#aaa'); return; }
  const list = n.def.yields.map(([id, a, b]) => [id, rndi(a, b)]);
  if (!canReceive(P, list)) { toast('Inventaire plein', '#ffb36b'); return; }
  for (const [id, k] of list) { giveItem(P, id, k, n.def.label); num(n.x, n.y - 30, '+' + k + ' ' + REG[id].name, RARITY[REG[id].rarity].c); }
  n.respawnAt = G.t + n.def.respawn; sfx('pick'); burst(n.x, n.y - 10, 10, [n.def.glint, '#fff']);
  P.state = 'cast'; P.animT = 0.2; P.castDone = true; P.castFn = null;
}
function openChest(c) {
  const P = G.player; c.opened = true; sfx('open'); G.flags['chest_' + c.id] = 1;
  burst(c.x, c.y - 10, 16, ['#ffe27a', '#fff', '#d9a441']); ring(c.x, c.y, 26, '#ffe27a', 0.4);
  if (c.hidden) { toast('Cache secrète découverte !', '#ffe27a'); questEvent('secret'); }
  for (const l of c.loot) {
    if (l.startsWith('gold:')) { const n = +l.split(':')[1]; for (let i = 0; i < 6; i++) G.drops.push({ kind: 'gold', n: Math.ceil(n / 6), x: c.x, y: c.y + 6, vx: rnd(-50, 50), vy: rnd(10, 50), vz: rnd(80, 140), z: 6, t: 0 }); }
    else if (l.startsWith('recipe:')) G.drops.push({ kind: 'recipe', rid: l.split(':')[1], x: c.x, y: c.y + 6, vx: rnd(-40, 40), vy: rnd(20, 50), vz: 120, z: 6, t: 0 });
    else G.drops.push({ kind: 'item', id: l, n: 1, x: c.x, y: c.y + 6, vx: rnd(-40, 40), vy: rnd(20, 50), vz: 120, z: 6, t: 0 });
  }
}

// ===================== MARCHANDE =====================
const SHOP = { conso: ['potion', 'ether', 'tonique', 'antidote', 'elixir_force'], mats: ['fer', 'bois_ancien', 'herbe', 'cuir'], equip: ['ka_oriental', 'la_trident', 'da_courbes', 'ar_cuir', 'ar_capuche', 'ar_barbute', 'ac_anneau_or', 'ac_bracelet'], special: ['sac_agrandi'] };
const SHOP_RECIPES = { r_elixir_garde: 150 };
function sellPrice(d) { return Math.floor(basePrice(d) / 2); }
function openShop(n, tab) {
  const P = G.player; tab = tab || 'buy'; G.shopNpc = n;
  let h = tabsHTML([['buy', 'Acheter'], ['sell', 'Vendre']], tab, 'shop', `<span class="gold">${P.gold} or</span>`) + '<div class="pbody"><div class="shop">';
  if (tab === 'buy') {
    const sec = (t, ids) => `<h4>${t}</h4>` + ids.map(id => { const d = REG[id]; const pr = typeof buyPrice === 'function' ? buyPrice(d) : basePrice(d); const lim = id === 'sac_agrandi' && (P.bags || 0) >= CONFIG.inventoryBagMax; return `<div class="srow">${itemIcon(d)}<div><b style="color:${rc(d)}">${d.name}</b><small>${d.desc || d.lore || ''} ${itemRows({ ...mkInst(P, id), lvl: 0, mxp: 0, ench: [] }).map(r => r[0] + ' ' + r[1] + (r[2] || '')).join(' · ')}</small></div><button data-buy="${id}" ${P.gold < pr || lim ? 'disabled' : ''}>${lim ? 'Max' : pr + ' or'}</button></div>`; }).join('');
    h += sec('Consommables', SHOP.conso) + sec('Matériaux', SHOP.mats) + sec('Équipements de la région', SHOP.equip) + sec('Spécial', SHOP.special);
    h += '<h4>Recettes</h4>' + Object.entries(SHOP_RECIPES).map(([rid, pr]) => { const r = RECIPES.find(x => x.id === rid); const k = recipeKnown(P, r); return `<div class="srow">${itemIcon({ icon: 'Scroll0001' })}<div><b>Recette : ${r.name}</b><small>${STATIONS[r.station]} · ${Object.entries(r.mats).map(([m, q]) => REG[m].name + ' ×' + q).join(', ')}</small></div><button data-buyrec="${rid}" ${k || P.gold < pr ? 'disabled' : ''}>${k ? 'Connue' : pr + ' or'}</button></div>`; }).join('');
  } else {
    const list = sortItems(invList(P), 'type');
    h += list.map(i => { const d = def(i); const why = i.locked ? 'Verrouillé' : d.tradeRules === 'bound' ? 'Lié' : d.tradeRules === 'quest' ? 'Quête' : null; return `<div class="srow">${itemIcon(d)}<div><b style="color:${rc(d)}">${d.name}${i.lvl ? ' +' + i.lvl : ''}${i.n > 1 ? ' ×' + i.n : ''}</b><small>${badge(d)}</small></div>${why ? `<button disabled>${why}</button>` : `<button data-sell="${i.uid}">${sellPrice(d)} or${i.n > 1 ? ' /u' : ''}</button>`}</div>`; }).join('') || '<p class="dim">Rien à vendre.</p>';
    h += '<p class="hint">Les objets liés, de quête ou verrouillés ne peuvent pas être vendus.</p>';
  }
  openPanel(h + '</div></div>', 'menu');
}

// ===================== RÉSERVE =====================
function openStash() {
  const P = G.player; G.ui = { kind: 'stash' };
  const inv = sortItems(invList(P), 'type'), st = sortItems(G.stash.slice(), 'type');
  openPanel(`<div class="ptabs"><button class="on">Réserve du village</button><button class="x" data-close>✕</button></div><div class="pbody"><div class="stashw"><div><h4>Inventaire ${invUsed(P)}/${invCap(P)}</h4><div class="inv">${inv.map(i => cellHTML(P, i, `data-tostash="${i.uid}"`)).join('') || '<p class="dim">Vide</p>'}</div></div><div><h4>Réserve ${G.stash.length}/${CONFIG.stashCapacity}</h4><div class="inv">${st.map(i => cellHTML(P, i, `data-fromstash="${i.uid}"`)).join('') || '<p class="dim">Vide</p>'}</div></div></div><p class="hint">Touche un objet pour le déplacer. Les récompenses reçues avec un inventaire plein arrivent ici.</p></div>`, 'menu');
}

// ===================== FABRICATION / FORGE =====================
let craftTab = {};
function openCraftNpc(station, n) {
  const P = G.player; G.ui = { kind: 'craft', station, n };
  const tabs = station === 'forge' ? [['up', 'Améliorer'], ['evo', 'Évoluer'], ['craft', 'Fabriquer'], ['rep', 'Réparer'], ['dis', 'Démanteler']] : [['craft', 'Fabriquer']];
  const tab = craftTab[station] && tabs.some(t => t[0] === craftTab[station]) ? craftTab[station] : tabs[0][0];
  const cl = craftLevel(P, station);
  let h = tabsHTML(tabs, tab, 'ctab', `<span class="gold">${P.gold} or</span><span class="cap">${STATIONS[station]} niv. ${cl}</span>`) + '<div class="pbody">';
  const gear = P.items.filter(i => { const d = def(i); return d.kind === 'weapon' || d.kind === 'armor'; });
  if (tab === 'up') h += gear.map(i => { const d = def(i); const c = upgradeCost(i); const why = canUpgrade(P, i); return `<div class="srow">${itemIcon(d)}<div><b style="color:${rc(d)}">${d.name} +${i.lvl}</b>${isEquipped(P, i.uid) ? ' <small>(équipé)</small>' : ''}<small>${i.lvl >= maxUp(i) ? 'Niveau maximal' : '→ +' + (i.lvl + 1) + ' : ' + c.gold + ' or, ' + matsText(P, c.mats)}</small></div><button data-upg="${i.uid}" ${why ? 'disabled title="' + why + '"' : ''}>${why ? esc(why) : 'Améliorer'}</button></div>`; }).join('') + '<p class="hint">Aucun échec possible : une amélioration payée réussit toujours.</p>';
  else if (tab === 'evo') { const ev = gear.filter(i => evoInfo(i)); h += ev.map(i => { const d = def(i), e = evoInfo(i); const why = canEvolve(P, i); return `<div class="srow">${itemIcon(d)}<div><b style="color:${rc(d)}">${d.name} +${i.lvl}</b> → <b style="color:${rc(e.next)}">${e.next.name}</b><small>Conditions : amélioration +${e.req.up} (${i.lvl}), maîtrise ${e.req.mastery} (${masteryLevel(i)}), ${e.req.gold} or, ${matsText(P, e.req.mats)}</small></div><button data-evo="${i.uid}" ${why ? 'disabled' : ''}>${why ? esc(why) : 'Faire évoluer'}</button></div>`; }).join('') || '<p class="dim">Aucune de tes armes ne peut évoluer. Lignées évolutives : armes communes de départ de chaque style.</p>'; h += '<p class="hint">L\'arme garde sa maîtrise et ses enchantements en évoluant.</p>'; }
  else if (tab === 'craft') h += RECIPES.filter(r => r.station === station).map(r => { const d = REG[r.result[0]]; const why = canCraft(P, r); const known = recipeKnown(P, r); return `<div class="srow ${known ? '' : 'unk'}">${itemIcon(d)}<div><b style="color:${rc(d)}">${known ? r.name : '??? (' + r.name + ')'}</b>${r.result[1] > 1 ? ' ×' + r.result[1] : ''}<small>${known ? matsText(P, r.mats) + ' · ' + r.gold + ' or · niveau ' + r.lvl : 'Découverte : ' + r.discover}</small></div><button data-craft="${r.id}" ${why ? 'disabled' : ''}>${why ? esc(why) : 'Fabriquer'}</button></div>`; }).join('');
  else if (tab === 'rep') h += SET.durability ? `<p>Coût de réparation de tout l'équipement porté : <b>${repairCost(P)} or</b>.</p><button class="big" data-repair="1" ${repairCost(P) === 0 ? 'disabled' : ''}>Tout réparer</button>` : '<p>La durabilité est désactivée (Paramètres). Tes équipements ne s\'usent pas.</p>';
  else if (tab === 'dis') h += invList(P).filter(i => ['weapon', 'armor', 'accessory'].includes(def(i).kind)).map(i => { const d = def(i); const why = canDismantle(P, i); const y = dismantleYield(i); return `<div class="srow">${itemIcon(d)}<div><b style="color:${rc(d)}">${d.name}${i.lvl ? ' +' + i.lvl : ''}</b><small>${why || 'Donne : ' + Object.entries(y).map(([k, q]) => REG[k].name + ' ×' + q).join(', ')}</small></div><button data-dis="${i.uid}" ${why ? 'disabled' : ''}>${why ? esc(why) : 'Démanteler'}</button></div>`; }).join('') + '<p class="hint">Les objets uniques, équipés ou verrouillés sont protégés.</p>';
  openPanel(h + '</div>', 'menu');
}
// ===================== ENCHANTEMENTS =====================
function openEnchant(n, uid) {
  const P = G.player; G.ui = { kind: 'ench', n };
  const gear = P.items.filter(i => ['weapon', 'armor'].includes(def(i).kind));
  const sel = uid && findInst(P, uid);
  let h = `<div class="ptabs"><button class="on">Enchantements</button><span class="gold">${P.gold} or</span><button class="x" data-close>✕</button></div><div class="pbody"><div class="invwrap"><div class="inv">${gear.map(i => cellHTML(P, i, `data-esel="${i.uid}"`)).join('')}</div><div class="detail">`;
  if (sel) {
    const d = def(sel);
    h += `<b style="color:${rc(d)}">${d.name}</b><p>Emplacements : ${sel.ench.length}/${enchSlots(sel)} · ${sel.ench.map(e => ENCHANTS[e].n).join(', ') || 'aucun'}</p>`;
    h += Object.entries(ENCHANTS).filter(([, E]) => (E.for === 'weapon') === (d.kind === 'weapon')).map(([k, E]) => { const why = canEnchant(P, sel, k); return `<div class="srow"><div><b>${E.n}</b><small>${E.desc} · ${E.cost.gold} or, ${matsText(P, E.cost.mats)}</small></div><button data-ench="${k}" data-uid="${sel.uid}" ${why ? 'disabled' : ''}>${why ? esc(why) : 'Enchanter'}</button></div>`; }).join('');
    if (sel.ench.length) h += `<button data-unench="${sel.uid}">Effacer les enchantements (gratuit)</button>`;
    h += '<p class="hint">Enchantements permanents, non cumulables, limités par la rareté (1 à 3 emplacements).</p>';
  } else h += '<p class="dim">Choisis une arme ou une armure.</p>';
  openPanel(h + '</div></div></div>', 'menu');
}
// ===================== RELIQUES =====================
function openRelics(n) {
  const P = G.player; G.ui = { kind: 'relic', n };
  const raw = countItem(P, 'relique_inconnue');
  const aw = P.items.filter(i => def(i).awakening && def(i).upgradePaths.type === 'awaken');
  let h = `<div class="ptabs"><button class="on">Reliques</button><span class="gold">${P.gold} or</span><button class="x" data-close>✕</button></div><div class="pbody">`;
  h += `<h4>Identification</h4><div class="srow">${itemIcon(REG.relique_inconnue)}<div><b>Relique non identifiée ×${raw}</b><small>60 or : révèle une relique ou un accessoire ancien (Œil du veilleur 40 %, Talisman de garde 30 %, Pierre de protection 18 %, Sceau du phénix 12 %).</small></div><button data-identify="1" ${raw && P.gold >= 60 ? '' : 'disabled'}>Identifier</button></div>`;
  h += `<h4>Éveil des armes</h4>` + (aw.map(i => { const d = def(i); const why = canAwaken(P, i); const a = awakenInfo(i); return `<div class="srow">${itemIcon(d)}<div><b style="color:${rc(d)}">${d.name}</b> → <b>${TRANSFORMS[a.form].n}</b><small>${i.awakened ? 'Éveillée' : 'Maîtrise ' + a.mastery + ' (' + masteryLevel(i) + '), ' + matsText(P, a.mats)}</small></div><button data-awaken="${i.uid}" ${why ? 'disabled' : ''}>${why ? esc(why) : 'Éveiller'}</button></div>`; }).join('') || '<p class="dim">Tu ne possèdes aucune arme éveillable (armes de rang S).</p>');
  h += `<h4>Restauration</h4><p class="dim">Les reliques anciennes trouvées en morceaux pourront être restaurées ici lors des prochaines régions.</p>`;
  openPanel(h + '</div>', 'menu');
}
function identifyRelic(P) {
  if (countItem(P, 'relique_inconnue') < 1 || P.gold < 60) return;
  const table = [['rel_oeil', 40], ['ac_talisman', 30], ['ac_pierre', 18], ['rel_phenix', 12]];
  let x = Math.random() * 100, id = table[0][0]; for (const [k, w] of table) { if ((x -= w) <= 0) { id = k; break; } }
  if (!canReceive(P, [[id, 1]])) { toast('Inventaire plein', '#ffb36b'); return; }
  P.gold -= 60; takeItem(P, 'relique_inconnue', 1); giveItem(P, id, 1, 'Identification (Séraphine)');
  sfx('open'); toast('Relique identifiée : ' + REG[id].name, rc(REG[id])); P.history.unshift({ src: 'Identification', id, n: 1, t: Date.now() });
}

// ===================== SPINS =====================
let spinTab = 'spin', spinRAF = 0;
function openSpin(type, tab) {
  const P = G.player; const S = SPINS[type]; spinTab = tab || spinTab; G.ui = { kind: 'spin', type };
  const st = spinState(P, type);
  let h = tabsHTML([['spin', S.n], ['rates', 'Probabilités'], ['hist', 'Historique']], spinTab, 'stab', `<span class="gold">${P.gold} or · ${type === 'weapon' ? 'Sceaux ' + countItem(P, 'sceau_lame') : 'Éclats ' + countItem(P, 'eclat_exception')}</span>`) + '<div class="pbody">';
  if (spinTab === 'spin') {
    const costs = S.cost.map((c, i) => Object.entries(c).map(([k, v]) => v + ' ' + (k === 'gold' ? 'or' : REG[k].name)).join(' + '));
    h += `<div class="spinhead ${type}"><canvas id="spincv" width="320" height="150"></canvas><div><h3>${S.n}</h3><p>${type === 'weapon' ? 'Invoque une arme aléatoire parmi ' + S.pool().length + ' armes (hors armes uniques et de rang S).' : 'Le système de récompenses le plus prestigieux : armes de rang S, reliques, grimoires interdits, objets d\'éveil…'} Les armes restent aussi disponibles en exploration, chez les marchands, en fabrication et en récompense.</p>
      <p><b>Garanties :</b> ${S.pity.map(p => `${p.n} — ${type === 'weapon' ? 'compteur ' + (st.since[p.rar] || 0) + '/' + p.at : 'compteur ' + (st.since[p.cat] || 0) + '/' + p.at}`).join('<br>')}</p>
      <p><small>Spins effectués : ${st.total}. Doublon d'objet unique : converti en Fragments d'arme.</small></p></div></div>`;
    h += `<div class="spinbtns">${S.cost.map((c, i) => `<button class="big" data-spin="${type}" data-ci="${i}" data-n="1" ${spinCostOk(P, type, i, 1) ? '' : 'disabled'}>×1 · ${costs[i]}</button>${type === 'weapon' ? `<button class="big" data-spin="${type}" data-ci="${i}" data-n="10" ${spinCostOk(P, type, i, 10) ? '' : 'disabled'}>×10 · ${costs[i].replace(/\d+/, m => m * 10)}</button>` : ''}`).join('')}</div>`;
  } else if (spinTab === 'rates') {
    h += `<p class="hint">Probabilités exactes appliquées à chaque Spin (avant garanties).</p>` + spinRates(type).map(g => `<div class="rateg"><b style="color:${g.c || '#ffe9a0'}">${g.n} — ${g.pct.toFixed(2)} %</b><div>${g.items.map(it => `<span>${itemIcon(REG[it.id])}${REG[it.id].name} <small>${it.pct.toFixed(2)} %</small></span>`).join('')}</div></div>`).join('');
  } else {
    h += `<div class="hist">${st.hist.map(hh => { const d = REG[hh.id]; return `<div class="hrow">${itemIcon(d)}<b style="color:${rc(d)}">${d.name}${hh.n > 1 ? ' ×' + hh.n : ''}</b><small>${hh.dup ? 'Doublon converti · ' : ''}${hh.pity ? 'Garantie · ' : ''}${new Date(hh.t).toLocaleString('fr-FR')}</small></div>`; }).join('') || '<p class="dim">Aucun Spin pour l\'instant.</p>'}</div>`;
  }
  openPanel(h + '</div>', 'menu spinpanel');
  if (spinTab === 'spin') idleCircle(type);
}
function idleCircle(type) {
  const cv = $('spincv'); if (!cv) return; const c = cv.getContext('2d'); let t = 0; const col = type === 'weapon' ? '255,214,120' : '255,93,143';
  cancelAnimationFrame(spinRAF);
  const loop = () => { if (!$('spincv') || G.spinning) return; t += 1 / 60; c.clearRect(0, 0, 320, 150); drawCircle(c, 160, 80, 52, t, col, 0.7); spinRAF = requestAnimationFrame(loop); };
  loop();
}
function drawCircle(c, x, y, r, t, col, a) {
  c.save(); c.translate(x, y); c.scale(1, 0.5); c.globalAlpha = a;
  c.strokeStyle = `rgba(${col},0.9)`; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.72, 0, 7); c.stroke();
  for (let i = 0; i < 12; i++) { const ang = t * 0.8 + i / 12 * 6.283; c.fillStyle = `rgba(${col},1)`; c.fillRect(Math.cos(ang) * r * 0.86 - 2, Math.sin(ang) * r * 0.86 - 2, 4, 4); }
  for (let i = 0; i < 6; i++) { const ang = -t * 1.3 + i / 6 * 6.283; c.beginPath(); c.moveTo(Math.cos(ang) * r * 0.72, Math.sin(ang) * r * 0.72); c.lineTo(Math.cos(ang + 2.1) * r * 0.72, Math.sin(ang + 2.1) * r * 0.72); c.stroke(); }
  c.restore(); c.globalAlpha = 1;
}
function confirmSpin(type, ci, n) {
  const P = G.player; const S = SPINS[type]; const cost = Object.entries(S.cost[ci]).map(([k, v]) => v * n + ' ' + (k === 'gold' ? 'or' : REG[k].name)).join(' + ');
  dialog(S.n, `Lancer <b>${n} Spin${n > 1 ? 's' : ''}</b> pour <b>${cost}</b> ?<br><small>Les probabilités affichées s'appliquent. Il faut ${n} emplacement(s) libre(s) dans l'inventaire.</small>`, [['Confirmer', () => runSpin(type, ci, n)], ['Annuler', () => openSpin(type, 'spin')]]);
}
function runSpin(type, ci, n) {
  const P = G.player; const r = performSpin(P, type, ci, n);
  if (r.err) { dialog(SPINS[type].n, r.err, [['Retour', () => openSpin(type, 'spin')]]); return; }
  P.spinCount = (P.spinCount || 0) + 1;
  G.spinRes = { type, res: r.res }; spinAnimation(type, r.res);
}
function spinAnimation(type, res) {
  const best = res.reduce((a, b) => (REG[b.id].rarity + (REG[b.id].rank ? 2 : 0)) > (REG[a.id].rarity + (REG[a.id].rank ? 2 : 0)) ? b : a, res[0]);
  const bd = REG[best.id]; const col = hexToRgbStr(rc(bd)); const isS = !!bd.rank;
  const total = SET.fastSpin ? 0.8 : (type === 'exceptional' ? 4.2 : 2.6) + (isS ? 1 : 0);
  openPanel(`<div class="spinanim ${type}"><canvas id="spinA" width="480" height="270"></canvas><button class="skip" data-skipspin="1">Passer ›</button></div>`, 'menu spinpanel');
  const cv = $('spinA'), c = cv.getContext('2d'); c.imageSmoothingEnabled = false; let t = 0; G.spinning = true;
  type === 'exceptional' ? (sfx('roar'), sfx('shield')) : sfx('charge');
  let revealed = false;
  const icon = img('ui/icons.png'), ip = ENV.icons[bd.icon];
  const loop = () => {
    if (!$('spinA')) { G.spinning = false; return; }
    t += 1 / 60; const k = t / total;
    c.fillStyle = type === 'exceptional' ? '#0b0614' : '#100c08'; c.fillRect(0, 0, 480, 270);
    const ccol = type === 'exceptional' ? '255,93,143' : '255,214,120';
    // 1. activation  2. cercle  3. énergie (couleur de rareté)
    const ph = SET.fastSpin ? 1 : Math.min(1, k * 2.2);
    drawCircle(c, 240, 200, 40 + 90 * ph, t * (1 + k * 4), k > 0.35 ? col : ccol, Math.min(1, k * 3));
    if (k > 0.25) { for (let i = 0; i < (type === 'exceptional' ? 6 : 3); i++) { const a = t * 3 + i * 2.1; c.fillStyle = `rgba(${col},${0.25 + 0.2 * Math.sin(t * 9 + i)})`; c.beginPath(); c.ellipse(240 + Math.cos(a) * 30 * (1 - k), 150 - k * 30, 8 + k * 50, 70 + k * 40, a * 0.3, 0, 7); c.fill(); } }
    if (type === 'exceptional' && k > 0.15) { c.save(); c.translate(240, 120); c.rotate(t * 0.6); for (let i = 0; i < 16; i++) { c.rotate(Math.PI / 8); c.fillStyle = `rgba(${col},${0.12 * k})`; c.fillRect(0, -2, 300, 4); } c.restore(); }
    // 4. silhouette  5. révélation
    if (k > 0.55 && ip) {
      const s = 3 + Math.min(1, (k - 0.55) * 4); const x = 240 - 16 * s, y = 110 - 16 * s;
      const g = glowSprite(col, 48); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, (k - 0.55) * 3); c.drawImage(g, 240 - 90, 110 - 90, 180, 180); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      if (k < 0.8) { c.filter = 'brightness(0)'; c.drawImage(icon, ip[0], ip[1], 32, 32, x, y, 32 * s, 32 * s); c.filter = 'none'; }
      else { c.drawImage(icon, ip[0], ip[1], 32, 32, x, y, 32 * s, 32 * s); if (!revealed) { revealed = true; isS ? (sfx('roar'), sfx('level'), shake(8)) : bd.rarity >= 4 ? sfx('level') : sfx('open'); } }
    }
    if (k > 0.8) {
      c.textAlign = 'center'; c.font = "bold 20px Georgia,serif"; c.fillStyle = rc(bd); c.fillText(bd.name, 240, 228);
      c.font = "bold 12px 'Trebuchet MS'"; c.fillStyle = '#fff'; c.fillText(RARITY[bd.rarity].n + (isS ? ' · RANG S' : '') + (best.note ? ' · ' + best.note : ''), 240, 248);
      if (isS) { c.font = "bold 36px Georgia"; c.fillStyle = `rgba(255,56,96,${0.6 + 0.4 * Math.sin(t * 8)})`; c.fillText('S', 240 + 80, 80); }
    }
    for (let i = 0; i < 4; i++) { const a = Math.random() * 6.28; c.fillStyle = `rgba(${col},0.9)`; c.fillRect(240 + Math.cos(a) * rnd(20, 150), 140 + Math.sin(a) * rnd(10, 90), 2, 2); }
    if (t >= total + 0.6) { G.spinning = false; spinResults(type, res); return; }
    spinRAF = requestAnimationFrame(loop);
  };
  loop();
}
function spinResults(type, res) {
  const P = G.player; G.spinning = false;
  openPanel(`<div class="ptabs"><button class="on">Résultats — ${SPINS[type].n}</button><button class="x" data-close>✕</button></div><div class="pbody"><div class="results">${res.map(r => { const d = REG[r.id]; return `<div class="resc r${d.rarity}" style="border-color:${rc(d)}">${itemIcon(d, true)}<b style="color:${rc(d)}">${d.name}${r.n > 1 ? ' ×' + r.n : ''}</b><small>${badge(d)}</small>${r.cat ? `<small>${r.cat}</small>` : ''}${r.note ? `<small class="koc">${r.note}</small>` : ''}${r.pity ? '<small class="okc">Garantie déclenchée</small>' : ''}</div>`; }).join('')}</div>
    <div class="row"><button class="big" data-spinagain="${type}">Retour au ${SPINS[type].n}</button><button class="big" data-tab="sac">Voir dans l'inventaire</button></div></div>`, 'menu');
}

// ===================== QUÊTES =====================
function questEvent(type, arg) {
  const Q = G.quests; const P = G.player;
  if (type === 'dummy' && P.trial) { P.trial.left = Math.max(0, P.trial.left - 1); if (P.trial.left === 0) { toast('Initiation réussie ! Retourne voir ' + MASTERS[P.trial.style].name.split(',')[0], '#ffe27a'); sfx('level'); } else toast('Mannequin détruit (' + (3 - P.trial.left) + '/3)', '#ffe9a0'); return; }
  if (type === 'kill' && Q.main >= 1) { Q.hunt = (Q.hunt || 0) + 1; if (Q.hunt === 15) toast('Chasse : 15/15 ! Retourne voir l\'Ancien', '#ffe27a'); }
  if (type === 'kill' && arg === 'king_specter') { Q.roi = 4; toast('Le dernier roi est apaisé. Retourne voir Séraphine', '#c4b5fd'); }
  if (type === 'boss' && arg && arg !== 'boss_orc_chief') { G.flags['dead_' + arg] = 1; if (typeof sagaBossDown === 'function') sagaBossDown(arg); return; }
  if (type === 'boss') { G.flags.bossDead = 1; if (Q.main === 1 || Q.main === 0) { Q.main = 2; toast('Grakhul est vaincu ! Retourne au village', '#ffe27a'); } }
  if (type === 'item' && arg === 'sceau_funeraire' && Q.roi === 1 && countItem(G.player, 'sceau_funeraire') >= 3) toast('3 sceaux funéraires : retourne voir Séraphine', '#c4b5fd');
}
function questText() {
  const Q = G.quests; const it = introText(); if (it) return it;
  if (Q.main === 0) return '→ Parle à l\'Ancien du village';
  if (Q.main === 1) return '→ Vaincs Grakhul (nord) · Chasse ' + Math.min(Q.hunt || 0, 15) + '/15';
  if (Q.main === 2) return '→ Retourne voir l\'Ancien';
  if (Q.main >= 3 && sagaSeals() < 4 && !sagaDone()) return Q.saga ? '→ Brise les 4 sceaux : ' + sagaSeals() + '/4 (sorties de la forêt : est / sud)' : '→ Parle à l\'Ancien Théobald (saga)';
  if (Q.main >= 3 && sagaSeals() >= 4 && !sagaDone()) return '→ Affronte Malvorak (Citadelle, sud-est)';
  if (Q.roi === 1) return '→ Sceaux funéraires ' + countItem(G.player, 'sceau_funeraire') + '/3 (cimetière)';
  if (Q.roi === 2 || Q.roi === 3) return '→ Pose les sceaux au tombeau royal';
  if (Q.roi === 4) return '→ Retourne voir Séraphine';
  return '';
}
function questList() {
  const Q = G.quests; const r = []; const P = G.player;
  r.push(`<div class="q ${P.magic ? 'done' : ''}"><b>L'éveil</b><p>${P.magic ? 'Terminée : ta magie innée est ' + MAGIC_DATA[P.magic].n + ' (' + MAGIC_TIERS[MAGIC_DATA[P.magic].tier].n + ').' : 'Rencontre le Maître Mage Orvael au Cercle des Arcanes (est du village) pour le rituel du Magic Spin.'}</p></div>`);
  if (P.magic) r.push(`<div class="q ${hasStyleAny(P) ? 'done' : ''}"><b>Première lame</b><p>${hasStyleAny(P) ? 'Terminée : tu as appris ton premier style de combat.' : 'Suis l\'initiation de Kaelen, la maîtresse d\'armes, au terrain d\'entraînement (ouest du village).'}</p></div>`);
  if (hasStyleAny(P)) r.push(`<div class="q"><b>Les sept maîtres</b><p>Styles appris : ${Object.keys(P.stylesKnown).map(k => STYLES[k].n).join(', ')} (${Object.keys(P.stylesKnown).length}/7). ${Object.keys(MASTERS).filter(k => !P.stylesKnown[k]).map(k => MASTERS[k].name + ' (' + STYLES[k].n + ', niv. ' + MASTERS[k].lvl + ')').join(' · ')}</p></div>`);
  if (!hasStyleAny(P)) return r.join('');
  r.push(`<div class="q ${Q.main >= 3 ? 'done' : ''}"><b>Le chef de guerre</b><p>${Q.main === 0 ? 'Parle à l\'Ancien Théobald, au centre du village.' : Q.main === 1 ? 'Vaincs Grakhul dans la clairière au nord de la forêt.' : Q.main === 2 ? 'Retourne voir l\'Ancien pour ta récompense.' : 'Terminée. Récompense : 300 or, Cape d\'azur, Éclat d\'Exception.'}</p></div>`);
  if (Q.main >= 1) r.push(`<div class="q ${Q.huntDone ? 'done' : ''}"><b>Nettoyer la forêt</b><p>Vaincs 15 monstres (${Math.min(Q.hunt || 0, 15)}/15). Récompense : 120 or, 2 potions, 1 Sceau de lame.</p></div>`);
  if (Q.roi) r.push(`<div class="q ${Q.roi >= 5 ? 'done' : ''}"><b>Le dernier roi</b><p>${['', 'Rapporte 3 sceaux funéraires à Séraphine (' + countItem(G.player, 'sceau_funeraire') + '/3). Squelettes et chauves-souris du cimetière.', 'Pose les sceaux sur le tombeau royal, au cœur du cimetière.', 'Vaincs le Spectre du dernier roi.', 'Retourne voir Séraphine.', 'Terminée. Tu portes la Faux du dernier roi.'][Q.roi]}</p></div>`);
  if (Q.main >= 3) { const F = G.flags, sl = sagaSeals(); r.push(`<div class="q ${sagaDone() ? 'done' : ''}"><b>Le Seigneur démon</b><p>${!Q.saga ? 'Parle à l\'Ancien Théobald.' : sagaDone() ? 'Terminée : Malvorak est vaincu.' : 'Sceaux brisés : ' + sl + '/4. ' + SEAL_KEYS.map(k => (F[SAGA[k].flag] ? '✔ ' : '✘ ') + SAGA[k].region + ' (niv. ' + SAGA[k].lvl + '+)').join(' · ') + (sl >= 4 ? ' — La Citadelle est ouverte !' : '')}</p></div>`); }
  r.push(typeof sideQuestList === 'function' ? sideQuestList() : '');
  r.push(`<div class="q"><b>Chasseur de trésors</b><p>Coffres ouverts : ${WORLD.chests.filter(c => c.opened && !c.hidden).length}/${WORLD.chests.filter(c => !c.hidden).length}. Caches secrètes : ${WORLD.chests.filter(c => c.opened && c.hidden).length}/${WORLD.chests.filter(c => c.hidden).length} (l'Œil du veilleur les révèle).</p></div>`);
  return r.join('');
}
// ===================== MORT =====================
function showDeath() { const P = G.player; const lost = Math.floor(P.gold * 0.1); openPanel(`<div class="center"><h2>Tu es tombé…</h2><p>Tu te réveilles au village. Tu perds ${lost} or.</p><button data-revive="${lost}">Se relever</button></div>`, 'dead'); }
function revive(lost) {
  const P = G.player; P.gold -= lost; refreshStats(P); P.hp = P.st8.maxhp; P.mp = P.st8.maxmp; P.sta = P.st8.maxsta; P.state = 'idle'; P.x = 48 * TILE + 16; P.y = 66 * TILE; P.iframes = 2; P.status = {};
  G.boss = null; for (const e of G.enemies) { e.aggro = false; if (e.def.boss) { e.hp = e.maxhp; e.phase = 1; e.x = e.home.x; e.y = e.home.y; } }
  G.enemies = G.enemies.filter(e => (e.sp && !e.sp.once) || e.dead); if (G.quests.roi === 3) G.quests.roi = 2;
  closePanel(); playMusic('village');
}
function goFullscreen() {
  const el = document.documentElement;
  try { const r = (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el); if (r && r.catch) r.catch(() => {}); } catch (e) {}
  try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
}

// ===================== CLICS =====================
document.addEventListener('change', e => { if (e.target.id === 'isort') { INVUI.sort = e.target.value; openMenu('sac'); } });
document.addEventListener('click', e => {
  const t = e.target.closest('button,[data-sel],[data-eqslot],[data-tostash],[data-fromstash],[data-esel],[data-style],[data-cinfo]'); if (!t) return;
  const d = t.dataset; const P = G.player;
  if (d.close !== undefined) { closePanel(); sfx('ui'); return; }
  if (d.travel !== undefined) { fastTravel(+d.travel); return; }
  if (d.tab) { openMenu(d.tab); return; }
  if (d.dlg !== undefined && G.dlg) { const f = G.dlg[+d.dlg][1]; f && f(); return; }
  if (d.icat) { INVUI.cat = d.icat; INVUI.sel = null; openMenu('sac'); return; }
  if (d.sel) { INVUI.sel = d.sel; sfx('ui'); openMenu('sac'); return; }
  if (d.eqslot) { if (P.equip[d.eqslot]) { INVUI.sel = P.equip[d.eqslot]; INVUI.cat = 'all'; openMenu('sac'); } else { INVUI.cat = d.eqslot.startsWith('acc') ? 'accessory' : d.eqslot === 'weapon' || d.eqslot === 'offhand' ? 'weapon' : 'armor'; openMenu('sac'); } return; }
  if (d.equip) { const inst = findInst(P, d.equip); const why = inst && equipInst(P, inst); if (why) toast(why, '#ffb36b'); openMenu('sac'); return; }
  if (d.uneq) { unequipSlot(P, d.uneq); openMenu('sac'); return; }
  if (d.use) { const inst = findInst(P, d.use); if (inst) { const r = useConsumable(P, inst); if (r === 'dialog') return; } INVUI.sel = findInst(P, d.use) ? d.use : null; openMenu('sac'); return; }
  if (d.lock) { const inst = findInst(P, d.lock); if (inst) inst.locked = !inst.locked; openMenu('sac'); return; }
  if (d.fiche) { const inst = findInst(P, d.fiche); openPanel(`<div class="ptabs"><button class="on">Fiche détaillée</button><button data-tab="sac">‹ Retour</button><button class="x" data-close>✕</button></div><div class="pbody">${ficheHTML(P, inst)}</div>`, 'menu'); return; }
  if (d.act === 'style') { styleChooser(P); return; }
  if (d.act === 'race') { raceSheet(P); return; }
  if (d.style) { changeStyle(P, d.style); openMenu('perso'); return; }
  if (d.eqm) { const [slot, sel] = d.eqm.split(':'); if (equipM(P, slot, sel)) { sfx('ui'); if (IS_TOUCH) setupTouch(); } else toast('Compétence pas encore débloquée', '#ffb36b'); openMenu('comp'); return; }
  if (d.ultsel) { if (d.ultsel === 'C10' && !skillOpen(P, P.magic, 10)) toast('Il faut la maîtrise niveau 10', '#ffb36b'); else { P.ultSel = d.ultsel; sfx('ui'); } openMenu('comp'); return; }
  if (d.slot4) { P.slot4 = d.slot4; P.cd.s4 = 0; if (IS_TOUCH) setupTouch(); openMenu('comp'); return; }
  if (d.collec) { collecCat = d.collec; openMenu('collec'); return; }
  if (d.cinfo) { const o = REG[d.cinfo]; const box = $('cinfo'); if (box) box.innerHTML = `<b style="color:${rc(o)}">${o.name}</b> ${badge(o)}<p class="lore">« ${esc(o.lore || '')} »</p><p>${esc(o.description || o.acquisition || '')}</p>`; return; }
  if (d.buy) { const it = REG[d.buy]; const pr = typeof buyPrice === 'function' ? buyPrice(it) : basePrice(it); if (P.gold >= pr) { if (!canReceive(P, [[d.buy, 1]])) toast('Inventaire plein', '#ffb36b'); else { P.gold -= pr; giveItem(P, d.buy, 1, 'Achat : Maëlle'); sfx('gold'); toast('Acheté : ' + it.name); } } openShop(G.shopNpc, 'buy'); return; }
  if (d.buyrec) { const pr = SHOP_RECIPES[d.buyrec]; if (P.gold >= pr) { P.gold -= pr; learnRecipe(P, d.buyrec); } openShop(G.shopNpc, 'buy'); return; }
  if (d.sell) { const inst = findInst(P, d.sell); if (inst && !inst.locked && def(inst).tradeRules === 'tradable' && !isEquipped(P, inst.uid)) { P.gold += sellPrice(def(inst)); if (inst.n > 1) inst.n--; else removeUid(P, inst.uid); sfx('gold'); } openShop(G.shopNpc, 'sell'); return; }
  if (d.shop) { openShop(G.shopNpc, d.shop); return; }
  if (d.tostash) { const inst = findInst(P, d.tostash); if (inst && G.stash.length < CONFIG.stashCapacity) { removeUid(P, inst.uid); G.stash.push(inst); sfx('ui'); } openStash(); return; }
  if (d.fromstash) { const i = G.stash.findIndex(x => x.uid === d.fromstash); if (i >= 0) { const inst = G.stash[i]; if (canReceive(P, [[inst.id, inst.n]])) { G.stash.splice(i, 1); if (def(inst).stack > 1) giveItem(P, inst.id, inst.n, inst.origin, true); else P.items.push(inst); sfx('ui'); } else toast('Inventaire plein', '#ffb36b'); } openStash(); return; }
  if (d.ctab) { craftTab[G.ui.station] = d.ctab; openCraftNpc(G.ui.station, G.ui.n); return; }
  const craftMsg = (why, ok) => { if (why) toast(why, '#ffb36b'); else { sfx('heavy'); sfx('level'); toast(ok, '#ffe27a'); } openCraftNpc(G.ui.station, G.ui.n); };
  if (d.upg) { const inst = findInst(P, d.upg); const why = doUpgrade(P, inst); if (!why) { for (let i = 0; i < 12; i++) sparks(P.x, P.y - 20, -Math.PI / 2 + rnd(-1, 1), 1, '#ffd23f'); } craftMsg(why, def(inst).name + ' +' + inst.lvl + ' !'); return; }
  if (d.evo) { const inst = findInst(P, d.evo); const old = def(inst).name; const why = doEvolve(P, inst); if (!why) { flashScreen(rc(def(inst)), 0.4); rebuildPlayer(P); } craftMsg(why, old + ' a évolué en ' + def(inst).name + ' !'); return; }
  if (d.craft) { const r = RECIPES.find(x => x.id === d.craft); craftMsg(doCraft(P, r), 'Fabriqué : ' + REG[r.result[0]].name); return; }
  if (d.repair) { craftMsg(doRepair(P), 'Équipement réparé'); return; }
  if (d.dis) { const inst = findInst(P, d.dis); const why = canDismantle(P, inst); if (!why) { const y = dismantleYield(inst); removeUid(P, inst.uid); for (const k in y) giveItem(P, k, y[k], 'Démantèlement', true); } craftMsg(why, 'Démantelé'); return; }
  if (d.esel) { openEnchant(G.ui.n, d.esel); return; }
  if (d.ench) { const inst = findInst(P, d.uid); const why = doEnchant(P, inst, d.ench); if (why) toast(why, '#ffb36b'); else { sfx('shield'); toast(ENCHANTS[d.ench].n + ' appliqué', '#9fe3ff'); } openEnchant(G.ui.n, d.uid); return; }
  if (d.unench) { const inst = findInst(P, d.unench); inst.ench = []; P.dirty = true; openEnchant(G.ui.n, d.unench); return; }
  if (d.identify) { identifyRelic(P); openRelics(G.ui.n); return; }
  if (d.awaken) { const inst = findInst(P, d.awaken); const why = doAwaken(P, inst); if (why) toast(why, '#ffb36b'); else { sfx('roar'); flashScreen(rc(def(inst)), 0.5); toast(def(inst).name + ' est éveillée ! Touche Éveil quand la jauge est pleine.', '#ff5d8f'); } openRelics(G.ui.n); return; }
  if (d.stab) { openSpin(G.ui.type, d.stab); return; }
  if (d.spin) { confirmSpin(d.spin, +d.ci, +d.n); return; }
  if (d.spinagain) { openSpin(d.spinagain, 'spin'); return; }
  if (d.skipspin) { cancelAnimationFrame(spinRAF); G.spinning = false; if (G.spinRes) spinResults(G.spinRes.type, G.spinRes.res); return; }
  if (d.revive !== undefined) { revive(+d.revive); return; }
  if (d.bind) {
    t.textContent = 'Appuie sur une touche…'; const act = d.bind;
    rebinding = code => { rebinding = null; if (code !== 'Escape') { for (const a in SET.keys) SET.keys[a] = SET.keys[a].filter(c => c !== code); SET.keys[act] = [code]; saveSet(); } if (G.mode !== 'play') openTitlePanel('opt'); else openMenu('opt'); };
    return;
  }
  if (d.opt) {
    const o = d.opt;
    if (o === 'sound') { SET.sound = !SET.sound; applyVolumes(); }
    if (o === 'music') { SET.music = !SET.music; applyVolumes(); }
    if (o === 'shake') SET.shake = !SET.shake;
    if (o === 'fastspin') SET.fastSpin = !SET.fastSpin;
    if (o === 'gfx') gfxCycle();
    if (o === 'aim') aimAssistCycle();
    if (o === 'guide') SET.guide = SET.guide === 'leger' ? 'actif' : 'leger';
    if (o === 'rumble') { SET.rumble = !SET.rumble; if (SET.rumble) padRumble(0.6, 0.6, 200); }
    if (o === 'dead') { const v = [0.12, 0.16, 0.2, 0.25, 0.3]; SET.padDead = v[(v.indexOf(SET.padDead || 0.2) + 1) % v.length]; }
    if (o === 'durability') { SET.durability = !SET.durability; if (P) P.dirty = true; }
    if (o === 'fs') goFullscreen();
    if (o === 'transfer') { openSaveTransfer(); return; }
    if (o === 'resetkeys') SET.keys = JSON.parse(JSON.stringify(DEFAULT_KEYS));
    if (o === 'bigger') { SET.btnScale = Math.min(1.4, (SET.btnScale || 1) + 0.1); if (G.player) setupTouch(); }
    if (o === 'smaller') { SET.btnScale = Math.max(0.7, (SET.btnScale || 1) - 0.1); if (G.player) setupTouch(); }
    if (o === 'resettouch') { SET.touch = null; SET.btnScale = 1; if (G.player) setupTouch(); }
    if (o === 'edit') { closePanel(); TOUCH.edit = true; G.paused = true; $('editbar').classList.add('show'); return; }
    if (o === 'title') { closePanel(); saveGame(); location.reload(); return; }
    saveSet(); if (G.mode !== 'play') openTitlePanel('opt'); else openMenu('opt'); return;
  }
});

// ---------- grimoire des magies : maîtrise, compétences, emplacements ----------
function grimHTML(P) {
  const fam = P.magic, GR = GRIMOIRE[fam]; if (!GR) return '';
  const F = MAGIC_DATA[fam], info = magXpInfo(P, fam); const pct = info.next ? Math.round((info.x - info.base) / (info.next - info.base) * 100) : 100;
  let h = `<div class="sk"><div><b style="color:${F.col}">Maîtrise du ${F.n} : niveau ${info.l}/10</b> <small>${info.next ? info.x + ' / ' + info.next + ' XP' : 'maîtrise complète'}</small><div style="height:6px;background:#2a1f33;border-radius:3px;margin:4px 0"><i style="display:block;height:6px;width:${pct}%;background:${F.col};border-radius:3px"></i></div><p>Chaque sort lancé fait progresser la maîtrise. Chaque niveau débloque une compétence du grimoire. Tes trois sorts de base restent toujours disponibles.</p></div></div>`;
  const slots = [['s1', 1], ['s2', 2], ['s3', 3], ['s5', 5]];
  for (const [sl, n] of slots) {
    const cur = equippedSel(P, sl); const opts = [];
    MAGIC_DATA[fam].spells.forEach((sp, i) => opts.push(['L' + i, sp.n + ' (base)']));
    GR.forEach((g, i) => { if (i < 9 && skillOpen(P, fam, i + 1)) opts.push(['C' + (i + 1), g.n]); });
    h += `<div class="sk"><div><b>Emplacement ${n} : choisir le sort</b><div class="row">${opts.map(([k, nm]) => `<button class="${cur === k ? 'on' : ''}" data-eqm="${sl}:${k}">${esc(nm)}</button>`).join('')}</div></div></div>`;
  }
  const ult = GR[9]; if (ult) { const ok = info.l >= 10; h += `<div class="sk"><div><b>Ultime</b><div class="row"><button class="${P.ultSel !== 'C10' ? 'on' : ''}" data-ultsel="L">${esc(F.ult)} (base)</button><button class="${P.ultSel === 'C10' ? 'on' : ''}" data-ultsel="C10" ${ok ? '' : 'disabled'}>${esc(ult.n)}${ok ? '' : ' (niveau 10)'}</button></div></div></div>`; }
  h += `<h4>Grimoire du ${F.n}</h4>`;
  GR.forEach((g, i) => { const n = i + 1, ok = skillOpen(P, fam, n); h += `<div class="sk">${ok ? `<img src="${grimIcon(fam, g).url}">` : `<img src="${lockIcon().url}">`}<div><b ${ok ? '' : 'style="opacity:.6"'}>${n}. ${esc(g.n)}</b> <small>${esc(g.role)}${g.mp ? ' · ' + g.mp + ' mana · ' + g.cd + ' s' : ''}${ok ? '' : ' · maîtrise niveau ' + SKILL_LVL[n] + ' requise'}</small><p>${ok ? esc(g.d) : 'Compétence verrouillée.'}</p></div></div>`; });
  return h;
}
