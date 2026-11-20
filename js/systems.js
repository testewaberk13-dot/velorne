'use strict';
// =====================================================================
//  VÉLORNE — SYSTÈMES (Partie 5)
//  InventorySystem, CharacterStatsSystem (unique point de calcul),
//  WeaponMastery, Upgrade, Evolution, Awakening, Enchantment, Durability,
//  Crafting, WeaponSpin / ExceptionalSpin, Loot, Save (versionnée).
// =====================================================================

// ---------------- InventorySystem ----------------
function newUid(P) { P.uidSeq = (P.uidSeq || 0) + 1; return 'u' + P.uidSeq.toString(36); }
function def(idOrInst) { return REG[typeof idOrInst === 'string' ? idOrInst : idOrInst.id]; }
function mkInst(P, id, origin) {
  const d = REG[id];
  return { uid: newUid(P), id, n: 1, lvl: 0, mxp: 0, ench: [], awakened: false, dur: d.durability || 0, locked: false, origin: origin || '', t: Date.now() };
}
function isEquipped(P, uid) { for (const k in P.equip) if (P.equip[k] === uid) return k; return null; }
function invList(P) { return P.items.filter(i => !isEquipped(P, i.uid)); }
function invUsed(P) { return invList(P).length; }
function invCap(P) { return CONFIG.inventoryBase + (P.bags || 0) * CONFIG.inventoryBagBonus; }
function countItem(P, id) { let n = 0; for (const i of P.items) if (i.id === id && !isEquipped(P, i.uid)) n += i.n; return n; }
function findInst(P, uid) { return P.items.find(i => i.uid === uid); }
// nombre de nouveaux emplacements nécessaires pour recevoir des objets
function slotsNeeded(P, list) {
  const sim = {}; let need = 0;
  for (const [id, n] of list) {
    const d = REG[id]; if (!d || n <= 0) continue;
    if (d.stack > 1) {
      let free = sim[id] !== undefined ? sim[id] : P.items.filter(i => i.id === id).reduce((a, i) => a + Math.max(0, d.stack - i.n), 0);
      if (n <= free) free -= n;
      else { const rest = n - free; const k = Math.ceil(rest / d.stack); need += k; free = k * d.stack - rest; }
      sim[id] = free;
    } else need += n;
  }
  return need;
}
function canReceive(P, list) { return invUsed(P) + slotsNeeded(P, list) <= invCap(P); }
// donne un objet ; s'il n'y a pas de place, il part dans la Réserve (jamais supprimé en silence)
function giveItem(P, id, n, origin, quiet) {
  const d = REG[id]; if (!d) return { ok: false };
  n = n || 1; P.seen[id] = 1; let toStash = 0; const made = [];
  if (d.stack > 1) {
    for (const i of P.items) { if (n <= 0) break; if (i.id === id && i.n < d.stack) { const k = Math.min(n, d.stack - i.n); i.n += k; n -= k; } }
    while (n > 0) {
      const k = Math.min(n, d.stack); n -= k;
      if (invUsed(P) < invCap(P)) { const it = mkInst(P, id, origin); it.n = k; P.items.push(it); made.push(it); }
      else { stashAdd(id, k, origin); toStash += k; }
    }
  } else {
    for (let j = 0; j < n; j++) {
      const it = mkInst(P, id, origin);
      if (invUsed(P) < invCap(P)) { P.items.push(it); made.push(it); } else { G.stash.push(it); toStash++; }
    }
  }
  if (toStash && !quiet) toast('Inventaire plein : ' + d.name + ' envoyé(e) à la Réserve du village', '#ffb36b');
  else if (!quiet && made.length && invCap(P) - invUsed(P) <= 5 && (!P.capWarnT || Date.now() - P.capWarnT > 20000)) { P.capWarnT = Date.now(); toast('Inventaire presque plein : ' + invUsed(P) + '/' + invCap(P), '#ffd27a'); }
  return { ok: true, toStash, made };
}
function stashAdd(id, n, origin) {
  const d = REG[id];
  if (d.stack > 1) { const s = G.stash.find(i => i.id === id && i.n < d.stack); if (s) { s.n += n; return; } }
  const it = mkInst(G.player, id, origin); it.n = n; G.stash.push(it);
}
function takeItem(P, id, n) {
  if (countItem(P, id) < n) return false;
  for (const i of P.items) { if (n <= 0) break; if (i.id === id && !isEquipped(P, i.uid)) { const k = Math.min(n, i.n); i.n -= k; n -= k; } }
  P.items = P.items.filter(i => i.n > 0);
  return true;
}
function removeUid(P, uid) { P.items = P.items.filter(i => i.uid !== uid); }
function hasMats(P, mats) { for (const k in mats || {}) if (countItem(P, k) < mats[k]) return false; return true; }
function payMats(P, mats) { for (const k in mats || {}) takeItem(P, k, mats[k]); }
function matsText(P, mats) { return Object.entries(mats || {}).map(([k, n]) => `<span class="${countItem(P, k) >= n ? 'okc' : 'koc'}">${REG[k].name} ${countItem(P, k)}/${n}</span>`).join(', '); }
function sortItems(list, mode) {
  const r = i => (def(i).rarity || 0) * 10 + (def(i).rank ? 5 : 0);
  if (mode === 'rar') return list.sort((a, b) => r(b) - r(a) || def(a).name.localeCompare(def(b).name));
  if (mode === 'nom') return list.sort((a, b) => def(a).name.localeCompare(def(b).name));
  if (mode === 'type') return list.sort((a, b) => invCatOf(def(a)).localeCompare(invCatOf(def(b))) || r(b) - r(a));
  return list.sort((a, b) => b.t - a.t);
}

// ---------------- maîtrise ----------------
function masteryLevel(inst) { let l = 0; for (let i = 1; i < CONFIG.masteryXp.length; i++) if (inst.mxp >= CONFIG.masteryXp[i]) l = i; return l; }
const MASTERY_UNLOCKS = { 1: '+5 % de dégâts avec cette arme', 2: '+5 % de chance critique', 3: 'Compétence propre de l\'arme (si elle en a une), sinon +5 % de dégâts', 4: '+10 % de dégâts ; éveil et transformation possibles', 5: 'Traînée lumineuse et titre de Maître de l\'arme' };
function masteryBonus(inst) { const l = masteryLevel(inst); const d = def(inst); return { dmg: (l >= 1 ? 0.05 : 0) + (l >= 3 && !(d.activeSkills || []).length ? 0.05 : 0) + (l >= 4 ? 0.1 : 0), crit: l >= 2 ? 0.05 : 0, skill: l >= 3, trail: l >= 5 }; }
function addWeaponXp(P, inst, n) {
  if (!inst) return; if (P.st8 && P.st8.flags.masteryMul) n *= P.st8.flags.masteryMul; const before = masteryLevel(inst); inst.mxp += n; const after = masteryLevel(inst);
  if (after > before) { toast('Maîtrise de ' + def(inst).name + ' : niveau ' + after + ' — ' + MASTERY_UNLOCKS[after], '#ffe27a'); sfx('level'); P.dirty = true; }
  const st = P.style; P.styleXp[st] = (P.styleXp[st] || 0) + n * 0.6;
  const sl = styleLevel(P, st); if (sl > (P.styleLvlSeen[st] || 1)) { P.styleLvlSeen[st] = sl; toast('Maîtrise du style ' + STYLES[st].n + ' : niveau ' + sl, '#ffe27a'); P.dirty = true; }
}
function styleLevel(P, st) { let l = 1; while (l < 10 && (P.styleXp[st] || 0) >= CONFIG.styleXp(l)) l++; return l; }

// ---------------- CharacterStatsSystem : SEUL endroit qui calcule les stats finales ----------------
function computeStats(P) {
  const race = RACES[(P.look && P.look.race) || 'humain'] || RACES.humain; const g = race.growth;
  const S = { maxhp: 90 + P.lvl * g.hp, maxmp: 50 + P.lvl * g.mp, maxsta: 100, atk: 6 + P.lvl * g.atk, mag: 8 + P.lvl * g.mag, defP: 0, defM: 0, spd: 92, acc: 1, crit: 0.05, critDmg: 1.6,
    statusRes: 0, regenHp: 0, regenMp: 2.5, res: {}, atkSpeed: 1, range: 26, block: 0.6, dodgeMul: 1, poise: false, flags: {}, procs: [], passives: [], sets: [], el: 'physique', race: race.n };
  RES_KEYS.forEach(k => S.res[k] = 0);
  // race : bonus fixes, résistances / faiblesses, particularités
  for (const k in race.mods) { if (k === 'spd') S.spd += race.mods.spd; else S[k] += race.mods[k]; }
  for (const k in race.res) S.res[k] += race.res[k];
  Object.assign(S.flags, race.flags);
  if (race.flags.regenPerLvl) S.regenHp += race.flags.regenPerLvl * P.lvl;
  if (race.flags.poiseHeavy) S.flags.poiseHeavy = 1;
  const raceCrit = race.mods.crit || 0;
  const add = (o, mul) => { mul = mul || 1;
    ['atk', 'mag', 'defP', 'defM'].forEach(k => { if (o[k]) S[k] += o[k] * mul; });
    if (o.def) S.defP += o.def * mul; if (o.mdef) S.defM += o.mdef * mul; if (o.hp) S.maxhp += o.hp; if (o.mp) S.maxmp += o.mp; if (o.sta) S.maxsta += o.sta;
    if (o.crit) S.crit += o.crit; if (o.critDmg) S.critDmg += o.critDmg; if (o.regenHp) S.regenHp += o.regenHp; if (o.regenMp) S.regenMp += o.regenMp;
    if (o.statusRes) S.statusRes += o.statusRes; if (o.spd) S.spd *= 1 + o.spd; for (const k in o.res || {}) S.res[k] = (S.res[k] || 0) + o.res[k]; };
  const broken = inst => SET.durability && def(inst).durability && inst.dur <= 0;
  // arme principale
  const wi = P.equip.weapon && findInst(P, P.equip.weapon);
  if (wi) {
    const w = def(wi); const mb = masteryBonus(wi); const tr = P.trans && TRANSFORMS[P.trans.form];
    let dmg = w.baseDamage * (1 + 0.08 * wi.lvl) * (1 + mb.dmg) * (tr && tr.atkMul || 1) * (broken(wi) ? 0.5 : 1);
    S.atk += dmg; S.crit = 0.05 + raceCrit + w.criticalChance + mb.crit + Math.floor(wi.lvl / 3) * 0.02; S.critDmg = w.criticalDamage;
    S.atkSpeed = w.attackSpeed * (tr && tr.spdMul || 1); S.range = w.range * (tr && tr.rangeMul || 1); if (w.block) S.block = w.block;
    S.passives.push(...w.passiveEffects); if (tr && tr.el) S.el = tr.el;
    for (const e of wi.ench) S.procs.push(e);
  }
  // main secondaire (bouclier pour le style Épée)
  const oi = P.equip.offhand && findInst(P, P.equip.offhand);
  if (oi) { const o = def(oi); S.defP += (o.baseDamage || 0) * 0.35 * (1 + 0.08 * oi.lvl); S.block = Math.max(S.block, (o.block || 0.7) - 0.05); S.passives.push(...o.passiveEffects.filter(p => p === 'bulwark' || p === 'ancientAegis')); }
  // armures
  let heavy = 0, dodge = [];
  for (const sl of ['head', 'torso', 'legs', 'feet', 'hands']) {
    const ai = P.equip[sl] && findInst(P, P.equip[sl]); if (!ai) continue; const a = def(ai);
    const m = (1 + 0.08 * ai.lvl) * (broken(ai) ? 0.5 : 1);
    add(Object.assign({}, a, { def: (a.def || 0) * m, mdef: (a.mdef || 0) * m }));
    if (a.cat === 'heavy') heavy++; dodge.push(ARMOR_CATS[a.cat].dodge);
    for (const e of ai.ench) { if (e === 'anti_poison') S.res.poison += 0.25; if (e === 'rune_res') RES_KEYS.forEach(k => S.res[k] += 0.08); if (e === 'recuperation') S.regenHp += 0.5; }
  }
  if (heavy) { S.spd *= 1 - 0.03 * heavy; if (heavy >= 2) S.poise = true; }
  if (dodge.length) S.dodgeMul = dodge.reduce((a, b) => a + b, 0) / dodge.length;
  // accessoires et reliques
  for (const sl of ['acc1', 'acc2', 'acc3']) { const xi = P.equip[sl] && findInst(P, P.equip[sl]); if (xi) add(def(xi)); }
  // ensembles
  for (const sid in SETS) {
    const st = SETS[sid]; const n = st.pieces.filter(id => ['head', 'torso', 'legs', 'feet', 'hands'].some(sl => P.equip[sl] && findInst(P, P.equip[sl]) && findInst(P, P.equip[sl]).id === id)).length;
    if (n >= 2) S.sets.push({ id: sid, n });
    for (const k in st.bonus) if (n >= +k) { const b = st.bonus[k]; if (b.res) for (const r in b.res) S.res[r] += b.res[r]; if (b.crit) S.crit += b.crit; if (b.flag) S.flags[b.flag] = 1; if (b.magMul) S.mag *= 1 + b.magMul; }
  }
  // passifs d'arme influençant les stats
  if (S.passives.includes('keenEdge')) S.crit += 0.1;
  if (S.passives.includes('twilight')) S.crit += 0.2;
  if (S.passives.includes('bulwark')) S.block = Math.min(0.97, S.block + 0.15);
  if (S.passives.includes('parryCounter')) S.block = Math.min(0.97, S.block + 0.1);
  if (S.passives.includes('heavyGuard')) { S.defP *= 1.2; S.spd *= 0.92; }
  if (S.passives.includes('swiftStep')) S.dodgeMul *= 0.6;
  if (P.style && STYLES[P.style].guard) S.block = Math.min(0.97, S.block + STYLES[P.style].guard);
  if (P.style === 'dagues') S.dodgeMul *= 0.8;
  if (S.flags.manaFlow) S.regenMp *= 1.5;
  // maîtrise du style
  const sl = styleLevel(P, P.style); S.atk *= 1 + 0.02 * (sl - 1); S.mastery = sl;
  // effets temporaires
  const B = P.buffs || {}; const now = G.t;
  if (B.force > now) S.atk *= 1.25; if (B.garde > now) { S.defP *= 1.3; S.defM *= 1.3; }
  if (B.haste > now) S.spd *= 1.1;
  if (B.determination > now) { S.atk *= 1.2; S.mag *= 1.2; S.flags.infSta = 1; }
  if (B.rage > now) { S.atk *= 1.3; S.poise = true; S.flags.noStun = 1; }
  if (B.pacte > now) { S.mag *= 1.35; S.atk *= 1.15; }
  gbufStats(P, S, now);
  if (B.volcan > now) { S.atk *= 1.25; S.mag *= 1.2; S.poise = true; }
  if (B.sylvestre > now) { S.spd *= 1.35; S.flags.dodgeFree = 1; }
  if (B.innate > now && P.innateBuff) { const ib = P.innateBuff; if (ib.atk) S.atk *= 1 + ib.atk; if (ib.mag) S.mag *= 1 + ib.mag; if (ib.def) { S.defP *= 1 + ib.def; S.defM *= 1 + ib.def; } if (ib.spd) S.spd *= 1 + ib.spd; if (ib.regen) S.regenHp += ib.regen; }
  if (P.trans && TRANSFORMS[P.trans.form].defMul) { S.defP *= TRANSFORMS[P.trans.form].defMul; S.defM *= TRANSFORMS[P.trans.form].defMul; S.poise = true; }
  RES_KEYS.forEach(k => S.res[k] = Math.min(0.6, S.res[k]));
  S.atk = Math.round(S.atk); S.mag = Math.round(S.mag); S.defP = Math.round(S.defP); S.defM = Math.round(S.defM);
  S.crit = Math.min(0.85, S.crit); S.maxhp = Math.round(S.maxhp);
  return S;
}

// ---------------- amélioration / évolution / éveil / enchantement / durabilité ----------------
function maxUp(inst) { const d = def(inst); return d.rank === 'S' ? 10 : RARITY[d.rarity].maxUp; }
function upgradeCost(inst) {
  const L = inst.lvl, d = def(inst); const rm = [0, 1, 1.4, 2, 3, 4.5, 6][d.rarity];
  const mats = {};
  if (L < 3) mats.fer = L + 1; else if (L < 6) mats.acier = L - 1; else { mats.mithril = L - 5; mats.cristal_magique = 1; }
  if (d.rank === 'S' && L >= 5) mats.fragment_arme = (L - 4) * 4;
  return { gold: Math.round(40 * (L + 1) * rm), mats };
}
function canUpgrade(P, inst) { const c = upgradeCost(inst); if (inst.lvl >= maxUp(inst)) return 'Niveau maximal atteint'; if (P.gold < c.gold) return 'Pas assez d\'or'; if (!hasMats(P, c.mats)) return 'Matériaux manquants'; return null; }
function doUpgrade(P, inst) { const why = canUpgrade(P, inst); if (why) return why; const c = upgradeCost(inst); P.gold -= c.gold; payMats(P, c.mats); inst.lvl++; P.dirty = true; return null; }
function evoInfo(inst) { const d = def(inst); const u = d.upgradePaths; if (!u || u.type !== 'evolve') return null; return { next: REG[u.next], req: u.req }; }
function canEvolve(P, inst) {
  const e = evoInfo(inst); if (!e) return 'Cette arme n\'évolue pas';
  if (inst.lvl < e.req.up) return 'Niveau d\'amélioration +' + e.req.up + ' requis'; if (masteryLevel(inst) < e.req.mastery) return 'Maîtrise ' + e.req.mastery + ' requise';
  if (P.gold < e.req.gold) return 'Pas assez d\'or'; if (!hasMats(P, e.req.mats)) return 'Matériaux manquants'; return null;
}
function doEvolve(P, inst) {
  const why = canEvolve(P, inst); if (why) return why; const e = evoInfo(inst);
  P.gold -= e.req.gold; payMats(P, e.req.mats); inst.id = e.next.id; inst.lvl = Math.min(inst.lvl, maxUp(inst)); inst.ench = inst.ench.slice(0, enchSlots(inst));
  P.seen[inst.id] = 1; P.dirty = true; return null;
}
function awakenInfo(inst) { const d = def(inst); return d.awakening ? Object.assign({ form: d.awakening.form }, d.awakening.req) : null; }
function canAwaken(P, inst) {
  const a = awakenInfo(inst); if (!a) return 'Cette arme ne peut pas être éveillée';
  if (def(inst).upgradePaths.type === 'transform') return 'Transformable sans éveil (maîtrise ' + a.mastery + ')';
  if (inst.awakened) return 'Déjà éveillée'; if (masteryLevel(inst) < a.mastery) return 'Maîtrise ' + a.mastery + ' requise';
  if (!hasMats(P, a.mats)) return 'Il faut : ' + Object.entries(a.mats).map(([k, n]) => REG[k].name + ' ×' + n).join(', ');
  return null;
}
function doAwaken(P, inst) { const why = canAwaken(P, inst); if (why) return why; payMats(P, awakenInfo(inst).mats); inst.awakened = true; P.dirty = true; return null; }
function transformReady(P) {
  const wi = P.equip.weapon && findInst(P, P.equip.weapon); if (!wi) return null; const d = def(wi); if (!d.awakening) return null;
  if (d.upgradePaths.type === 'transform') return masteryLevel(wi) >= d.awakening.req.mastery ? d.awakening.form : null;
  return wi.awakened ? d.awakening.form : null;
}
function enchSlots(inst) { const d = def(inst); return d.rank === 'S' ? 3 : RARITY[d.rarity || 1].ench; }
function canEnchant(P, inst, key) {
  const E = ENCHANTS[key]; const d = def(inst);
  if ((E.for === 'weapon') !== (d.kind === 'weapon')) return 'Incompatible avec ce type d\'objet';
  if (inst.ench.includes(key)) return 'Déjà présent (non cumulable)';
  if (inst.ench.length >= enchSlots(inst)) return 'Plus d\'emplacement libre (' + enchSlots(inst) + ')';
  if (P.gold < E.cost.gold) return 'Pas assez d\'or'; if (!hasMats(P, E.cost.mats)) return 'Matériaux manquants'; return null;
}
function doEnchant(P, inst, key) { const why = canEnchant(P, inst, key); if (why) return why; const E = ENCHANTS[key]; P.gold -= E.cost.gold; payMats(P, E.cost.mats); inst.ench.push(key); P.dirty = true; return null; }
function wear(P, slot, amount) {
  if (!SET.durability) return; const inst = P.equip[slot] && findInst(P, P.equip[slot]); if (!inst || !def(inst).durability) return;
  const before = inst.dur; inst.dur = Math.max(0, inst.dur - amount);
  const max = def(inst).durability;
  if (before > max * 0.2 && inst.dur <= max * 0.2) toast(def(inst).name + ' est très usé(e) : fais-le réparer', '#ffb36b');
  if (before > 0 && inst.dur <= 0) { toast(def(inst).name + ' est brisé(e) : efficacité réduite de moitié', '#ff6b6b'); P.dirty = true; }
}
function repairCost(P) { let g = 0; for (const k in P.equip) { const i = P.equip[k] && findInst(P, P.equip[k]); if (i && def(i).durability) g += Math.ceil((def(i).durability - i.dur) * 0.3 * (def(i).rarity || 1)); } return g; }
function doRepair(P) { const c = repairCost(P); if (P.gold < c) return 'Pas assez d\'or'; P.gold -= c; for (const k in P.equip) { const i = P.equip[k] && findInst(P, P.equip[k]); if (i && def(i).durability) i.dur = def(i).durability; } P.dirty = true; return null; }
function dismantleYield(inst) { const d = def(inst); const r = d.rarity || 1; const out = { fragment_arme: [1, 2, 4, 8, 15, 30][r - 1] * (d.kind === 'weapon' ? 1 : 0.5) | 0 || 1 }; if (inst.lvl >= 3) out.acier = Math.floor(inst.lvl / 3); return out; }
function canDismantle(P, inst) { const d = def(inst); if (inst.locked) return 'Objet verrouillé'; if (isEquipped(P, inst.uid)) return 'Objet équipé'; if (d.unique || d.rank) return 'Les objets uniques ne peuvent pas être détruits'; if (d.kind !== 'weapon' && d.kind !== 'armor' && d.kind !== 'accessory') return 'Non démontable'; return null; }

// ---------------- fabrication ----------------
function recipeKnown(P, r) { return r.known || P.recipes[r.id]; }
function craftLevel(P, st) { const c = P.craft[st] || (P.craft[st] = { lvl: 1, xp: 0 }); return c.lvl; }
function canCraft(P, r) {
  if (!recipeKnown(P, r)) return 'Recette inconnue (' + r.discover + ')'; if (craftLevel(P, r.station) < r.lvl) return 'Niveau de ' + STATIONS[r.station].toLowerCase() + ' ' + r.lvl + ' requis';
  if (P.gold < r.gold) return 'Pas assez d\'or'; if (!hasMats(P, r.mats)) return 'Matériaux manquants'; if (!canReceive(P, [r.result])) return 'Inventaire plein';
  return null;
}
function doCraft(P, r) {
  const why = canCraft(P, r); if (why) return why;
  P.gold -= r.gold; payMats(P, r.mats); giveItem(P, r.result[0], r.result[1], 'Fabrication : ' + STATIONS[r.station]);
  craftLevel(P, r.station); const c = P.craft[r.station]; c.xp += 3 + r.lvl * 2; let up = false; while (c.lvl < 10 && c.xp >= CRAFT_XP(c.lvl)) { c.xp -= CRAFT_XP(c.lvl); c.lvl++; up = true; }
  if (up) toast(STATIONS[r.station] + ' : niveau d\'artisanat ' + c.lvl, '#ffe27a');
  return null;
}
function learnRecipe(P, rid) { const r = RECIPES.find(x => x.id === rid); if (!r || recipeKnown(P, r)) return false; P.recipes[rid] = 1; toast('Recette apprise : ' + r.name, '#9fe3ff'); sfx('open'); return true; }

// ---------------- WeaponSpinSystem & ExceptionalSpinSystem ----------------
function spinState(P, type) { return P.spin[type] || (P.spin[type] = { total: 0, since: {}, hist: [] }); }
function spinRates(type) {
  const S = SPINS[type];
  if (type === 'weapon') {
    const pool = S.pool(); const tot = Object.values(S.rates).reduce((a, b) => a + b, 0);
    return Object.keys(S.rates).map(r => { const items = pool.filter(w => w.rarity === +r); return { key: +r, n: RARITY[r].n, c: RARITY[r].c, pct: S.rates[r] / tot * 100, items: items.map(w => ({ id: w.id, pct: S.rates[r] / tot * 100 / items.length })) }; });
  }
  const tot = S.cats.reduce((a, c) => a + c.rate, 0);
  return S.cats.map(c => ({ key: c.id, n: c.n, pct: c.rate / tot * 100, items: c.items.map(id => ({ id, pct: c.rate / tot * 100 / c.items.length })) }));
}
function spinCostOk(P, type, ci, count) {
  const c = SPINS[type].cost[ci]; for (const k in c) { const have = k === 'gold' ? P.gold : countItem(P, k); if (have < c[k] * count) return false; } return true;
}
function rollWeaponSpin(P, st) {
  const S = SPINS.weapon; let forced = 0, pityHit = null;
  for (const p of S.pity) if ((st.since[p.rar] || 0) + 1 >= p.at && p.rar > forced) { forced = p.rar; pityHit = p; }
  const entries = Object.entries(S.rates).filter(([r]) => +r >= forced);
  const tot = entries.reduce((a, [, w]) => a + w, 0); let x = Math.random() * tot, rar = +entries[0][0];
  for (const [r, w] of entries) { if ((x -= w) <= 0) { rar = +r; break; } }
  const pool = S.pool().filter(w => w.rarity === rar);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  for (const p of S.pity) { if (rar >= p.rar) st.since[p.rar] = 0; else st.since[p.rar] = (st.since[p.rar] || 0) + 1; }
  return { id: pick.id, n: 1, rar, pity: pityHit && rar >= pityHit.rar ? pityHit.n : null };
}
function rollExceptionalSpin(P, st) {
  const S = SPINS.exceptional; let cat = null, pityHit = null;
  for (const p of S.pity) if ((st.since[p.cat] || 0) + 1 >= p.at) { cat = S.cats.find(c => c.id === p.cat); pityHit = p; }
  if (!cat) { const tot = S.cats.reduce((a, c) => a + c.rate, 0); let x = Math.random() * tot; for (const c of S.cats) { if ((x -= c.rate) <= 0) { cat = c; break; } } cat = cat || S.cats[0]; }
  const id = cat.items[Math.floor(Math.random() * cat.items.length)];
  for (const p of S.pity) { if (cat.id === p.cat) st.since[p.cat] = 0; else st.since[p.cat] = (st.since[p.cat] || 0) + 1; }
  return { id, n: S.qty[id] || 1, rar: REG[id].rarity, cat: cat.n, pity: pityHit ? pityHit.n : null };
}
function ownsUnique(P, id) { return P.items.some(i => i.id === id) || G.stash.some(i => i.id === id); }
// transaction : on vérifie tout, on calcule, puis on applique ; en cas d'erreur, rien n'est consommé
function performSpin(P, type, ci, count) {
  if (!spinCostOk(P, type, ci, count)) return { err: 'Ressources insuffisantes' };
  if (invUsed(P) + count > invCap(P)) return { err: 'Inventaire trop plein : libère ' + (invUsed(P) + count - invCap(P)) + ' emplacement(s) avant de lancer.' };
  const snap = JSON.stringify({ items: P.items, gold: P.gold, spin: P.spin, seen: P.seen, uid: P.uidSeq, stash: G.stash });
  try {
    const st = spinState(P, type); const res = [];
    for (let i = 0; i < count; i++) {
      const r = type === 'weapon' ? rollWeaponSpin(P, st) : rollExceptionalSpin(P, st);
      const d = REG[r.id]; st.total++;
      if (d.unique && ownsUnique(P, r.id) || (res.some(x => x.id === r.id && d.unique))) {
        const fr = SPINS[type].dupFragments[d.rarity] || 10; r.dup = { fragment_arme: fr }; r.note = 'Doublon d\'objet unique converti en ' + fr + ' Fragments d\'arme';
      }
      res.push(r);
    }
    // paiement
    const c = SPINS[type].cost[ci]; for (const k in c) { if (k === 'gold') P.gold -= c[k] * count; else if (!takeItem(P, k, c[k] * count)) throw new Error('paiement'); }
    for (const r of res) {
      if (r.dup) giveItem(P, 'fragment_arme', r.dup.fragment_arme, SPINS[type].n, true);
      else giveItem(P, r.id, r.n, SPINS[type].n, true);
      st.hist.unshift({ id: r.id, n: r.n, t: Date.now(), dup: !!r.dup, pity: r.pity }); if (st.hist.length > 100) st.hist.pop();
      P.history.unshift({ src: SPINS[type].n, id: r.id, n: r.n, t: Date.now() }); if (P.history.length > 150) P.history.pop();
    }
    P.dirty = true; saveGame();
    return { res };
  } catch (e) {
    const s = JSON.parse(snap); P.items = s.items; P.gold = s.gold; P.spin = s.spin; P.seen = s.seen; P.uidSeq = s.uid; G.stash = s.stash;
    return { err: 'Erreur de traitement : le Spin a été annulé, rien n\'a été consommé.' };
  }
}

// ---------------- LootSystem ----------------
function rollWeaponByTier(tier) {
  const t = LOOT_RARITY[tier] || LOOT_RARITY[1]; const tot = Object.values(t).reduce((a, b) => a + b, 0); let x = Math.random() * tot, rar = 1;
  for (const r in t) { if ((x -= t[r]) <= 0) { rar = +r; break; } }
  const pool = WEAPON_LIST.filter(w => w.rarity === rar && !w.unique && !w.rank && !w.id.startsWith('ep_voyageur_') && w.id !== 'la_grakhul');
  return pool[Math.floor(Math.random() * pool.length)].id;
}
function rollLoot(kind) {
  const L = LOOT[kind]; if (!L) return []; const out = [];
  for (const [id, ch, a, b] of L.mats || []) if (Math.random() < ch) out.push([id, rndi(a, b)]);
  if (L.weapon && Math.random() < L.weapon) out.push([rollWeaponByTier(L.tier), 1]);
  if (L.seal && Math.random() < L.seal) out.push(['sceau_lame', 1]);
  if (L.relic && Math.random() < L.relic) out.push(['relique_inconnue', 1]);
  if (L.quest && G.quests.roi === 1 && Math.random() < L.quest[1]) out.push([L.quest[0], 1]);
  if (L.fixed) L.fixed.forEach(id => out.push([id, 1]));
  if (Math.random() < 0.05 * (L.tier || 1)) out.push(['chronique', 1]);
  return out;
}

// ---------------- SaveSystem (versionnée, avec migration) ----------------
function migrateSave(sv) {
  if (!sv) return sv;
  if (!sv.v || sv.v < 2) {
    // v1 -> v2 : objets texte -> instances avec identifiant stable ; équipement -> uid
    const map = { w_longsword: 'ep_voyageur', w_katana: 'ka_entrainement', w_dagger: 'da_voyageur', w_rapier: 'ep_cendres', w_waraxe: 'ep_batarde', w_mace: 'bo_bois', w_spear: 'la_soldat', w_halberd: 'la_grakhul', w_bow: 'arc_chasse', w_staff: 'ka_entrainement', w_crystal: 'ka_oriental',
      shirt: 'ar_tunique', leather: 'ar_cuir', plate: 'ar_plaques', pants: 'ar_pantalon', legs_plate: 'ar_jambieres', boots: 'ar_bottes', feet_plate: 'ar_solerets', gloves: 'ar_gants', arms_plate: 'ar_brassards', helm_barbuta: 'ar_barbute', helm_horned: 'ar_dragon_casque', hood: 'ar_capuche', wizard_hat: 'ar_chapeau',
      cape_red: 'ac_cape_ecarlate', cape_blue: 'ac_cape_azur', shield_round: 'bo_bois', shield_crusader: 'bo_bastion', ring_gold: 'ac_anneau_or', ring_ruby: 'ac_anneau_rubis', amulet_sea: 'ac_amulette_marees', potion: 'potion', ether: 'ether' };
    const P = { uidSeq: 0, items: [] }; const items = [];
    const push = (id, n) => { const nid = map[id] || id; if (!REG[nid]) return null; const it = { uid: 'u' + (++P.uidSeq).toString(36), id: nid, n: n || 1, lvl: 0, mxp: 0, ench: [], awakened: false, dur: REG[nid].durability || 0, locked: false, origin: 'Ancienne sauvegarde', t: Date.now() }; items.push(it); return it; };
    (sv.inv || []).forEach(s => push(s.id, s.n));
    const eq = {}; const old = sv.equip || {}; const used = new Set();
    const pick = id => { if (!id) return null; const nid = map[id] || id; const ex = items.find(i => i.id === nid && !used.has(i.uid)); const it = ex || push(id); if (it) used.add(it.uid); return it; };
    const w = pick(old.weapon); if (w) { eq.weapon = w.uid; if (sv.wlvl && sv.wlvl[old.weapon]) w.lvl = sv.wlvl[old.weapon]; }
    const slotMap = { torso: 'torso', legs: 'legs', feet: 'feet', hands: 'hands', head: 'head' };
    for (const k in slotMap) { const it = pick(old[k]); if (it) eq[slotMap[k]] = it.uid; }
    const extra = [old.cape, old.ring, old.amulet].filter(Boolean); extra.forEach((id, i) => { const it = pick(id); if (it) eq['acc' + (i + 1)] = it.uid; });
    if (old.shield) { const sh = pick(old.shield); if (sh && w && REG[w.id].style === 'epee') eq.offhand = sh.uid; }
    const style = w ? REG[w.id].style : 'epee';
    Object.assign(sv, { v: 2, items, equip: eq, uidSeq: P.uidSeq, style, styleXp: {}, spin: {}, history: [], recipes: {}, craft: {}, seen: {}, bags: 0, stash: [], magic: 'feu' });
    delete sv.inv; delete sv.wlvl;
  }
  if (sv.v < 3) {
    // v2 -> v3 : races et apparence complète ; la magie choisie dans l'ancien écran de création est
    // annulée (elle doit être révélée par le rituel du Maître Mage) ; le style déjà pratiqué est conservé
    sv.look = normalizeLook(sv.look);
    sv.stylesKnown = sv.style ? { [sv.style]: 1 } : {};
    sv.magic = null; sv.magic2 = null; sv.migratedMagic = true;
    sv.quests = sv.quests || {}; sv.quests.intro = Math.max(sv.quests.intro || 0, 1);
    if (sv.slot4 === 'm2') sv.slot4 = 's4';
    sv.v = 3;
  }
  return sv;
}
