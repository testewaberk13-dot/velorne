'use strict';
// =====================================================================
//  JOUEUR : équipement réel, styles de combat, techniques, éveil,
//  synergies arme × magie, reliques, dégâts élémentaires
// =====================================================================
const ANIM_T = { slash: { hit: 3, dur: 0.34 }, backslash: { hit: 7, dur: 0.46 }, halfslash: { hit: 3, dur: 0.3 }, thrust: { hit: 5, dur: 0.4 }, shoot: { hit: 9, dur: 0.62 }, spellcast: { hit: 5, dur: 0.46 } };
const EQUIP_SLOTS = ['weapon', 'offhand', 'head', 'torso', 'legs', 'feet', 'hands', 'acc1', 'acc2', 'acc3'];
const EQUIP_SLOT_NAME = { weapon: 'Arme principale', offhand: 'Main secondaire', head: 'Tête', torso: 'Torse', legs: 'Jambes', feet: 'Bottes', hands: 'Gants', acc1: 'Accessoire 1', acc2: 'Accessoire 2', acc3: 'Accessoire 3' };

function newPlayer(look, style, magic) {
  look = normalizeLook(look);
  const P = {
    x: 48 * TILE + 16, y: 66 * TILE, bw: 14, bh: 8, dir: 0, look, style: style || 'epee', magic: magic || null, magic2: null, race: look.race, stylesKnown: {}, raceCd: 0,
    hp: 100, mp: 60, sta: 100, lvl: 1, xp: 0, gold: 60, ult: 0, awk: 0,
    state: 'idle', st: 0, anim: 'walk', fr: 0, animT: 0, combo: 0, comboT: 0, charge: 0, holdT: 0,
    iframes: 0, flashT: 0, blockT: 0, staT: 0, cd: { s1: 0, s2: 0, s3: 0, s4: 0, ult: 0, potion: 0, dodge: 0, tech: 0 },
    aim: Math.PI / 2, ghosts: [], shield: 0, kills: 0, stepT: 0,
    items: [], equip: {}, uidSeq: 0, styleXp: {}, styleLvlSeen: {}, spin: {}, history: [], recipes: {}, craft: {}, seen: {}, bags: 0,
    buffs: {}, synCd: {}, relicCd: {}, status: {}, spells: {}, slot4: 's4', trans: null, statT: 0,
  };
  return P;
}
function hasStyle(P) { return !!(P.stylesKnown && P.stylesKnown[P.style]); }
function giveStarter(P) {
  const eq = (id, slot) => { const r = giveItem(P, id, 1, 'Équipement de départ', true); P.equip[slot] = r.made[0].uid; };
  if (hasStyle(P)) eq(START_WEAPON[P.style], 'weapon');
  eq('ar_tunique', 'torso'); eq('ar_pantalon', 'legs'); eq('ar_bottes', 'feet');
  giveItem(P, 'potion', 3, 'Équipement de départ', true);
}
function eqDef(P, slot) { const i = P.equip[slot] && findInst(P, P.equip[slot]); return i ? def(i) : null; }
function eqInst(P, slot) { return P.equip[slot] ? findInst(P, P.equip[slot]) : null; }
const STARTER_GEAR = { ar_tunique: 'torso', ar_pantalon: 'legs', ar_bottes: 'feet' };
function playerLayers(P, override) {
  const L = normalizeLook(P.look); const b = L.body; const list = lookLayers(L);
  const get = s => override ? (override[s] ? REG[override[s]] : null) : eqDef(P, s);
  const B = id => bodyItem(id, b); const eqFlags = {};
  for (const s of ['legs', 'feet', 'torso', 'hands']) { const d = get(s); if (!d) continue; if (STARTER_GEAR[d.id]) { const o = outfitLayer(L, s); if (o) list.push(o); } else if (d.lpc) list.push({ id: B(d.lpc), c: d.c }); }
  for (const s of ['acc1', 'acc2', 'acc3']) { const d = get(s); if (d && d.lpc) { list.push({ id: B(d.lpc), c: d.c }); if (d.lpc === 'cape' || d.lpc === 'cape_tattered') eqFlags.cape = 1; if (d.lpc === 'necklace') eqFlags.neck = 1; } }
  list.push(...outfitExtras(L, eqFlags));
  const helm = get('head');
  const hair = lookHair(L);
  if (!helm || helm.lpc === 'wizard_hat') list.push(...hair); else list.push(...hair.filter(h => !h.id.startsWith('hair_')));
  if (L.outfit.bandana && !helm) list.push({ id: B('bandana'), c: { color_1: L.outfit.bandana } });
  if (helm) list.push({ id: B(helm.lpc), c: helm.c });
  const off = get('offhand'); if (off && off.vis) list.push({ id: B(off.vis) });
  const w = get('weapon');
  if (w) { const tr = !override && P.trans && TRANSFORMS[P.trans.form]; list.push({ id: B(tr && tr.vis ? tr.vis : w.vis) }); if (w.style === 'arc') list.push({ id: 'w_arrow' }); }
  return list;
}
function weaponAnims(vis) { const s = new Set(); if (!vis || !CHARS.items[vis]) return s; for (const L of CHARS.items[vis].layers) for (const a in L.a) s.add(a); return s; }
function rebuildPlayer(P) {
  P.st8 = computeStats(P); P.dirty = false;
  P.spr = composeCharacter(playerLayers(P));
  const w = eqDef(P, 'weapon'); const st = STYLES[P.style];
  const av = weaponAnims(w && (P.trans && TRANSFORMS[P.trans.form].vis || w.vis));
  P.combos = !w ? ['slash', 'halfslash', 'backslash'] : st.combos.map(a => av.has(a) || a === 'shoot' ? a : (av.has('slash') ? 'slash' : a));
  P.heavyAnim = w ? (av.has(st.heavy) ? st.heavy : P.combos[0]) : 'slash';
  P.dodgeAnim = 'walk';
}
function refreshStats(P) { const hpk = P.hp / (P.st8 ? P.st8.maxhp : 1); P.st8 = computeStats(P); P.hp = Math.min(P.hp, P.st8.maxhp); }
function weaponOf(P) { const i = eqInst(P, 'weapon'); return i ? { d: def(i), i } : { d: { style: P.style, baseDamage: 0, attackSpeed: 1.2, range: 26, passiveEffects: [], activeSkills: [], magicSynergies: [] }, i: null }; }
function setAnim(e, an) { e.anim = an; e.animT = 0; e.fr = 0; }
function has(P, passive) { return P.st8.passives.includes(passive); }
function synergy(P) {
  if (!P.magic || !hasStyle(P)) return null;
  let k = P.style + ':' + P.magic; let via = null;
  if (!SYNERGIES[k] && MAGIC_FAMILIES[P.magic] && MAGIC_FAMILIES[P.magic].aff) { const k2 = P.style + ':' + MAGIC_FAMILIES[P.magic].aff; if (SYNERGIES[k2]) { k = k2; via = MAGIC_FAMILIES[P.magic].n; } }
  return SYNERGIES[k] ? Object.assign({ key: k, via }, SYNERGIES[k]) : null;
}
function trySynergy(P, on) {
  const s = synergy(P); if (!s || s.on !== on) return null;
  const w = weaponOf(P).d; const boosted = (w.magicSynergies || []).includes(P.magic);
  const cost = boosted ? Math.ceil(s.cost / 2) : s.cost;
  if ((P.synCd[s.key] || 0) > G.t || P.mp < cost) return null;
  P.mp -= cost; P.synCd[s.key] = G.t + s.icd; return { s, mul: boosted ? 1.3 : 1 };
}

function nearestEnemy(x, y, maxd, cone, dirAng) {
  let best = null, bd = maxd;
  for (const e of G.enemies) {
    if (e.dead) continue; const d = dist(x, y, e.x, e.y);
    if (d > bd) continue;
    if (cone) { const a = Math.atan2(e.y - y, e.x - x); const da = Math.abs(((a - dirAng + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (da > cone) continue; }
    best = e; bd = d;
  }
  return best;
}
function computeAim(P, mx, my, mv) {
  if (Math.hypot(PAD.rx, PAD.ry) > 0.35) { const a = Math.atan2(PAD.ry, PAD.rx); const t = nearestEnemy(P.x, P.y, STYLES[P.style].ranged ? 220 : 120, 0.6, a); return t ? Math.atan2(t.y - P.y, t.x - P.x) : a; }
  if (!PAD.active && !IS_TOUCH && IN.mouse.active && G.t - IN.mouse.t < 3) { const wx = IN.mouse.x + G.cam.x, wy = IN.mouse.y + G.cam.y; return Math.atan2(wy - (P.y - 14), wx - P.x); }
  const face = Math.atan2(DIRV[P.dir][1], DIRV[P.dir][0]);
  const base = mv > 0.2 ? Math.atan2(my, mx) : face;
  let t = nearestEnemy(P.x, P.y, STYLES[P.style].ranged ? 200 : 110, 1.2, base);
  if (!t && (PAD.active || IS_TOUCH) && mv <= 0.2) t = nearestEnemy(P.x, P.y, STYLES[P.style].ranged ? 180 : 70);
  return t ? Math.atan2(t.y - P.y, t.x - P.x) : base;
}

// ===================== frappe du joueur (pipeline unique) =====================
function strikeEnemy(P, e, mult, o) {
  o = o || {}; const S = P.st8; if (e.dead) return 0;
  const w = weaponOf(P);
  let el = o.el || S.el || 'physique';
  if (has(P, 'twilight')) el = (P.twi = !P.twi) ? 'lumiere' : 'ombre';
  let dmg = (o.magic ? S.mag : S.atk) * mult * rnd(0.9, 1.1);
  let crit = Math.random() < S.crit + (o.critBonus || 0) + (has(P, 'farShot') && dist(P.x, P.y, e.x, e.y) > 128 ? 0.15 : 0);
  if (P.buffs.shadowStrike) { crit = true; delete P.buffs.shadowStrike; }
  if (P.buffs.counter > G.t) { dmg *= 2; P.buffs.counter = 0; num(P.x, P.y - 56, 'Riposte !', '#bfe6ff'); }
  if (crit) { dmg *= S.critDmg; if (S.flags.critHeal) P.hp = Math.min(S.maxhp, P.hp + S.maxhp * S.flags.critHeal); }
  if (S.flags.darkBonus && (el === 'feu' || el === 'ombre')) dmg *= 1 + S.flags.darkBonus;
  if (el === 'lumiere' && has(P, 'lightBlade') && (e.def.undead || e.def.demon)) dmg *= 1.4;
  const ang = Math.atan2(e.y - P.y, e.x - P.x);
  damageEnemy(e, dmg, crit, Math.cos(ang), Math.sin(ang), o.kb !== undefined ? o.kb : 120, o.stun || 0, el);
  // effets annexes
  if (!o.noProc) {
    gbufOnHit(P, e);
    if (!o.magic && (P.buffs.fourreau > G.t || P.buffs.volcan > G.t)) fireOnHit(P, e, o);
    if (o.heavy && has(P, 'burnHeavy')) e.burn = 3;
    if (o.heavy && has(P, 'runeHeavy')) runeBlast(P, e.x, e.y);
    if (crit && has(P, 'dawnFire')) e.burn = 3;
    if (has(P, 'venomFang') && Math.random() < 0.25) addPoison(e, 2);
    if (has(P, 'funeralMark')) addMark(P, e, P.trans && P.trans.form === 'spectrale' ? 2 : 1);
    if (P.buffs.phenix > G.t) e.burn = 3;
    if (P.trans) transformOnHit(P, e, o);
    for (const en of S.procs) {
      if (en === 'feu' && Math.random() < 0.2) e.burn = 3;
      if (en === 'glace' && Math.random() < 0.25) e.slowT = 2;
      if (en === 'foudre' && Math.random() < 0.15) chainSpark(P, e, 1, 0.5);
      if (en === 'vol_vie' && crit) { const h = dmg * 0.04; P.hp = Math.min(S.maxhp, P.hp + h); num(P.x, P.y - 48, '+' + Math.ceil(h), '#7dff9a'); }
    }
    // synergies déclenchées au coup
    let sy = trySynergy(P, 'hit');
    if (sy) synergyHit(P, sy, e);
    if (o.heavy) { sy = trySynergy(P, 'heavy'); if (sy) { if (sy.s.key === 'epee:feu') { e.burn = 3 * sy.mul; fxAt('explosion', e.x, e.y - 16, { fps: 30, scale: 0.5, layer: 1 }); } else runeBlast(P, e.x, e.y, sy.mul); } }
    if (o.charged) { sy = trySynergy(P, 'charged'); if (sy) synergyCharged(P, sy, e); }
  }
  // maîtrise (utilisation réelle), jauges
  if (w.i && !o.noXp) addWeaponXp(P, w.i, 1);
  P.awk = Math.min(100, P.awk + (P.trans ? 0 : 3)); P.ult = Math.min(100, P.ult + 1.5);
  wear(P, 'weapon', 0.25);
  return dmg;
}
function synergyHit(P, sy, e) {
  const k = sy.s.key;
  if (k === 'arc:glace') { e.slowT = 2; e.frost = (e.frost || 0) + 1; part(e.x, e.y - 14, { col: '#9fe3ff', size: 3, life: 0.4, add: true }); if (e.frost >= 3) { e.frost = 0; e.freeze = 1.2 * sy.mul; ring(e.x, e.y, 22, '#bfe9ff', 0.3); sfx('ice'); } }
  if (k === 'faux:ombre') { const a = Math.atan2(e.y - P.y, e.x - P.x); const x = e.x + Math.cos(a) * 30, y = e.y + Math.sin(a) * 20; ring(x, y, 26, '#8b5cf6', 0.35); for (const o of G.enemies) if (!o.dead && o !== e && dist(o.x, o.y, x, y) < 30) strikeEnemy(P, o, 0.5 * sy.mul, { el: 'ombre', noProc: true, noXp: true }); }
  if (k === 'dagues:poison') addPoison(e, 1);
  if (k === 'arc:nature') { e.rootT = 1.5 * sy.mul; for (let i = 0; i < 8; i++) part(e.x + rnd(-8, 8), e.y, { col: '#4ade80', rise: 20, life: 0.6, size: 2 }); toastOnce('Racines !'); }
}
function synergyCharged(P, sy, e) {
  const k = sy.s.key;
  if (k === 'katana:foudre') chainSpark(P, e, 3, 0.6 * sy.mul);
  if (k === 'lance:vent') { P.lunge = 260; for (const o of G.enemies) if (!o.dead && dist(o.x, o.y, P.x, P.y) < 80) { const a = Math.atan2(o.y - P.y, o.x - P.x); o.kbx += Math.cos(a) * 320; o.kby += Math.sin(a) * 320; } sfx('wind'); ring(P.x, P.y, 60, '#c8f7e8', 0.4); }
  if (k === 'lance:gravite') { for (const o of G.enemies) if (!o.dead && dist(o.x, o.y, e.x, e.y) < 110 && o !== e) { const a = Math.atan2(e.y - o.y, e.x - o.x); o.kbx += Math.cos(a) * 280; o.kby += Math.sin(a) * 280; } ring(e.x, e.y, 70, '#94a3b8', 0.45); }
}
function toastOnce(m) { if (G.lastToast === m && G.t - G.lastToastT < 3) return; G.lastToast = m; G.lastToastT = G.t; num(G.player.x, G.player.y - 60, m, '#bfe'); }
function addPoison(e, n) { e.poison = Math.min(5, (e.poison || 0) + n); e.poisonT = 4; }
function addMark(P, e, n) {
  e.marks = (e.marks || 0) + n;
  if (e.marks >= 3) { e.marks = 0; fxAt('snakebite', e.x, e.y - 30, { fps: 30, scale: 0.6, layer: 1 }); ring(e.x, e.y, 30, '#c4b5fd', 0.4); later(() => { if (!e.dead) strikeEnemy(P, e, 1.2, { el: 'ames', noProc: true, noXp: true }); }, 150); }
}
function runeBlast(P, x, y, mul) {
  ring(x, y, 20, '#7dd3fc', 0.6, 2);
  later(() => { fxAt('flash', x, y - 14, { fps: 30, add: true, layer: 1, scale: 2 }); ring(x, y, 40, '#7dd3fc', 0.35, 4); sfx('zap'); for (const o of G.enemies) if (!o.dead && dist(o.x, o.y, x, y) < 42) strikeEnemy(P, o, 0.8 * (mul || 1), { el: 'arcane', noProc: true, noXp: true }); }, 600);
}
function chainSpark(P, e, n, mult) {
  let cur = e; const hit = [e];
  for (let i = 0; i < n; i++) {
    let nx = null, bd = 110; for (const o of G.enemies) { if (o.dead || hit.includes(o)) continue; const d = dist(cur.x, cur.y, o.x, o.y); if (d < bd) { bd = d; nx = o; } }
    if (!nx) break; G.bolts.push({ x0: cur.x, y0: cur.y - 16, x1: nx.x, y1: nx.y - 16, t: 0 }); strikeEnemy(P, nx, mult, { el: 'foudre', noProc: true, noXp: true }); nx.shock = 0.5; hit.push(nx); cur = nx;
  }
  sfx('zap');
}
function hitArea(P, x, y, r, mult, o) { let n = 0; for (const e of G.enemies) if (!e.dead && dist(x, y, e.x, e.y - 8) < r + e.def.r * 0.5) { strikeEnemy(P, e, mult, o); n++; } return n; }
function hitLine(P, x0, y0, ang, len, wid, mult, o) {
  let n = 0; const cx = Math.cos(ang), cy = Math.sin(ang);
  for (const e of G.enemies) { if (e.dead) continue; const dx = e.x - x0, dy = e.y - 10 - y0; const t = dx * cx + dy * cy; if (t < -6 || t > len) continue; const pd = Math.abs(dx * cy - dy * cx); if (pd < wid + e.def.r * 0.5) { strikeEnemy(P, e, mult, o); n++; } }
  return n;
}
function transformOnHit(P, e, o) {
  const f = P.trans.form;
  if (f === 'abyssale') G.rifts.push({ x: e.x, y: e.y, t: 0, life: 1.2, r: 22, el: 'ombre', mult: 0.25, col: '150,40,200' });
  if (f === 'grande_lame' && o.heavy) runeBlast(P, e.x, e.y);
  if (f === 'draconique' && o.heavy) G.rifts.push({ x: e.x, y: e.y, t: 0, life: 2, r: 26, el: 'feu', mult: 0.3, col: '255,110,40' });
}

// ===================== mise à jour =====================
function updatePlayer(P, dt) {
  const [mx, my, mv] = moveAxis(); const px0 = P.x, py0 = P.y;
  if (P.dirty) refreshStats(P);
  P.statT -= dt; if (P.statT <= 0) { P.statT = 0.5; refreshStats(P); }
  const S = P.st8;
  for (const k in P.cd) P.cd[k] = Math.max(0, P.cd[k] - dt);
  P.iframes = Math.max(0, P.iframes - dt); P.flashT = Math.max(0, P.flashT - dt); P.shield = Math.max(0, P.shield - dt); if (P.shield <= 0) P.shieldCol = null;
  P.mp = Math.min(S.maxmp, P.mp + dt * (S.regenMp + S.mag * 0.04)); P.hp = Math.min(S.maxhp, P.hp + dt * S.regenHp);
  P.staT -= dt; if (P.staT <= 0 && P.state !== 'block') P.sta = Math.min(S.maxsta, P.sta + dt * 38);
  if (P.buffs.tonique > G.t || S.flags.infSta) P.sta = S.maxsta;
  else if (S.flags.staRegen && P.staT <= 0) P.sta = Math.min(S.maxsta, P.sta + dt * 3.8);
  for (const b of ['force', 'garde', 'haste', 'determination', 'rage', 'pacte', 'sylvestre', 'innate', 'cdr', 'volcan', 'fourreau']) if (P.buffs[b] && P.buffs[b] < G.t) { delete P.buffs[b]; P.dirty = true; if (b === 'innate') P.innateBuff = null; }
  if (P.regenBurst) { const h = Math.min(P.regenBurst.t, dt); P.hp = Math.min(S.maxhp, P.hp + P.regenBurst.per * h); P.regenBurst.t -= dt; if (Math.random() < 0.5) part(P.x + rnd(-8, 8), P.y - rnd(0, 30), { col: '#7ee0a0', life: 0.7, size: 2, rise: 30, add: true }); if (P.regenBurst.t <= 0) P.regenBurst = null; }
  P.comboT = Math.max(0, P.comboT - dt); P.st += dt;
  if (P.healT > 0) { const h = Math.min(P.healT, dt); P.hp = Math.min(S.maxhp, P.hp + P.healRate * h); P.healT -= dt; if (Math.random() < 0.5) part(P.x + rnd(-8, 8), P.y - rnd(0, 30), { col: '#7dff9a', life: 0.7, size: 2, rise: 30, add: true }); }
  // poison
  if (P.status.poison > 0) { P.status.poison -= dt; P.poisonTick = (P.poisonTick || 0) - dt; if (P.poisonTick <= 0) { P.poisonTick = 1; P.hp -= Math.max(1, S.maxhp * 0.015); num(P.x, P.y - 40, 'Poison', '#7ee06b'); if (P.hp <= 0) killPlayer(P); } if (Math.random() < 0.2) part(P.x + rnd(-6, 6), P.y - rnd(4, 30), { col: '#7ee06b', rise: 20, life: 0.5, size: 2 }); }
  // transformation
  if (P.trans) { P.trans.t -= dt; if (Math.random() < 0.7) part(P.x + rnd(-10, 10), P.y - rnd(0, 40), { col: 'rgb(' + TRANSFORMS[P.trans.form].aura + ')', rise: 40, life: 0.5, size: 2, add: true }); addLight(P.x, P.y - 14, 70, TRANSFORMS[P.trans.form].aura, 0.8); if (P.trans.t <= 0) endTransform(P); }
  const wi = eqInst(P, 'weapon'); if (wi && masteryLevel(wi) >= 5 && P.state === 'attack' && Math.random() < 0.6) part(P.x + Math.cos(P.aim) * 18, P.y - 16 + Math.sin(P.aim) * 12, { col: '#fff3b0', life: 0.3, size: 2, add: true });
  if (wi && (def(wi).rarity >= 4) && Math.random() < 0.08) part(P.x + rnd(-12, 12), P.y - rnd(10, 36), { col: RARITY[def(wi).rarity].c, rise: 12, life: 0.6, size: 1, add: true });
  if (P.state === 'dead') { P.animT += dt; P.fr = Math.min(5, Math.floor(P.animT * 10)); return; }
  const w = weaponOf(P);
  // ----- actions -----
  if (IN.pressed.attack && G.dlg == null) { if (hasStyle(P)) P.atkBuffer = 0.25; else if (!P.noStyleWarnT || G.t - P.noStyleWarnT > 3) { P.noStyleWarnT = G.t; toast(P.magic ? 'Tu n\'as appris aucun style de combat : Kaelen, la maîtresse d\'armes, t\'attend au terrain d\'entraînement (ouest du village).' : 'Tu ne sais pas encore te battre. Rencontre d\'abord le Maître Mage Orvael au Cercle des Arcanes (est du village).', '#ffd27a'); } }
  if (IN.pressed.racial) useRacial(P);
  P.atkBuffer = Math.max(0, (P.atkBuffer || 0) - dt);
  if (IN.held.attack) P.holdT += dt; else P.holdT = 0;
  const canAct = P.state === 'idle' || P.state === 'move' || (P.state === 'attack' && P.atkDone);
  if (IN.pressed.dodge && P.state !== 'dodge' && P.state !== 'hurt' && P.cd.dodge <= 0 && (canAct || P.state === 'attack' || P.state === 'block' || P.state === 'charge')) startDodge(P, mx, my, mv);
  else if (IN.held.block && (canAct || P.state === 'charge') && P.state !== 'block' && P.sta > 5) { P.state = 'block'; P.blockT = 0; P.st = 0; }
  else if (P.atkBuffer > 0 && canAct) { P.atkBuffer = 0; startAttack(P, mx, my, mv, false); }
  for (const s of ['s1', 's2', 's3', 's4', 'ult', 'tech']) if (IN.pressed[s === 'ult' ? 'ult' : s === 'tech' ? 'tech' : 'skill' + s[1]]) {
    if (s === 'tech' && !hasStyle(P)) { toast('Aucun style de combat appris : pas encore de technique d\'arme.', '#ffd27a'); continue; }
    if (s !== 'tech' && !P.magic) { toast('Ta magie innée n\'est pas encore révélée : va voir le Maître Mage Orvael (Cercle des Arcanes, est du village).', '#c4b5fd'); continue; }
    P.skBuf = { s, t: 0.35 };
  }
  if (P.skBuf) { P.skBuf.t -= dt; if (P.skBuf.t <= 0) P.skBuf = null; else if (canAct) { const s = P.skBuf.s; P.skBuf = null; if (s === 'ult') castUlt(P, mx, my, mv); else if (s === 'tech') castTech(P, mx, my, mv); else castSkill(P, s === 's4' ? P.slot4 : s, mx, my, mv, s); } }
  if (IN.pressed.potion) usePotion(P);
  if (IN.pressed.awaken) startTransform(P);
  if (IN.pressed.relic) useRelic(P);
  // ----- états -----
  const spd = S.spd * (P.buffs.haste > G.t ? 1.15 : 1);
  const aspd = S.atkSpeed * (P.buffs.haste > G.t ? 1.3 : 1);
  switch (P.state) {
    case 'idle': case 'move': {
      if (mv > 0.15) {
        P.state = 'move'; P.dir = dirOf(mx, my);
        const sp = spd * (0.45 + 0.55 * mv); moveBody(P, mx * sp * dt, my * sp * dt);
        P.animT += dt * (6 + 8 * mv); P.anim = 'walk'; P.fr = 1 + Math.floor(P.animT) % 8;
        P.stepT -= dt; if (P.stepT <= 0) { P.stepT = 0.32; sfx('step'); if (Math.random() < 0.5) part(P.x + rnd(-4, 4), P.y, { col: 'rgba(160,130,90,0.6)', size: 2, life: 0.4, vy: -8 }); }
      } else { P.state = 'idle'; if (P.spr && P.spr.anims && P.spr.anims.idle) { P.anim = 'idle'; P.fr = Math.floor(G.t * 1.6) % 2; } else { P.anim = 'walk'; P.fr = 0; } }
      if (P.holdT > 0.32 && IN.held.attack && w.i && hasStyle(P)) { P.state = 'charge'; P.charge = 0; sfx('charge'); }
      break;
    }
    case 'attack': {
      const at = ANIM_T[P.anim]; const dur = at.dur / aspd;
      P.animT += dt; const n = CHARS.anims[P.anim][0];
      P.fr = Math.min(n - 1, Math.floor(P.animT / dur * n));
      if (!P.hitDone && P.fr >= at.hit) { P.hitDone = true; doAttackHit(P, P.heavy); }
      if (P.animT > dur * 0.72) P.atkDone = true;
      if (mv > 0.15) moveBody(P, mx * spd * 0.18 * dt, my * spd * 0.18 * dt);
      if (P.lunge > 0) { moveBody(P, Math.cos(P.aim) * P.lunge * dt, Math.sin(P.aim) * P.lunge * dt); P.lunge *= Math.pow(0.0005, dt); }
      if (P.animT >= dur) {
        if (IN.held.attack && P.holdT > 0.32 && !P.heavy && w.i) { P.state = 'charge'; P.charge = 0; sfx('charge'); }
        else { P.state = 'idle'; P.comboT = 0.38; }
        P.heavy = false;
      }
      break;
    }
    case 'charge': {
      P.charge = Math.min(1, P.charge + dt * 1.25);
      P.aim = computeAim(P, mx, my, mv); P.dir = dirOf(Math.cos(P.aim), Math.sin(P.aim));
      if (mv > 0.15) { moveBody(P, mx * spd * 0.35 * dt, my * spd * 0.35 * dt); P.animT += dt * 5; P.fr = 1 + Math.floor(P.animT) % 8; } else P.fr = 0;
      P.anim = 'walk';
      if (Math.random() < 0.6) { const a = Math.random() * 6.28; part(P.x + Math.cos(a) * 18, P.y - 16 + Math.sin(a) * 12, { vx: -Math.cos(a) * 40, vy: -Math.sin(a) * 30, col: P.charge >= 1 ? '#ffe26b' : '#9fd8ff', life: 0.35, size: 2, add: true }); }
      if (P.charge >= 1 && !P.chargeFull) { P.chargeFull = true; ring(P.x, P.y, 26, '#ffe26b', 0.35); sfx('ui'); }
      if (!IN.held.attack) { P.chargeFull = false; if (P.charge >= 0.35) startAttack(P, mx, my, mv, true); else P.state = 'idle'; }
      break;
    }
    case 'dodge': {
      const k = P.dodgeT / P.dodgeDur; const sp = P.dodgeSpd * (1 - k * 0.7);
      moveBody(P, P.dvx * sp * dt, P.dvy * sp * dt);
      P.dodgeT += dt; P.z = P.rift ? 0 : Math.sin(Math.min(1, k) * Math.PI) * 6; P.anim = 'walk'; P.fr = 3;
      P.ghostT = (P.ghostT || 0) - dt; if (P.ghostT <= 0) { P.ghostT = 0.035; P.ghosts.push({ x: P.x, y: P.y, an: P.anim, fr: P.fr, dir: P.dir, t: 0, col: P.rift ? 'rgba(165,180,252,0.9)' : null }); }
      if (P.dodgeT >= P.dodgeDur) { P.state = 'idle'; P.z = 0; if (P.rift) { ring(P.x, P.y, 20, '#a5b4fc', 0.3); P.rift = false; } }
      break;
    }
    case 'block': {
      P.blockT += dt; P.anim = 'walk'; P.fr = 0;
      const t = nearestEnemy(P.x, P.y, 140);
      if (t) { P.aim = Math.atan2(t.y - P.y, t.x - P.x); P.dir = dirOf(Math.cos(P.aim), Math.sin(P.aim)); }
      else if (mv > 0.15) { P.dir = dirOf(mx, my); P.aim = Math.atan2(my, mx); }
      if (mv > 0.15) moveBody(P, mx * spd * 0.35 * dt, my * spd * 0.35 * dt);
      if (!IN.held.block || P.sta <= 0) P.state = 'idle';
      break;
    }
    case 'cast': {
      P.animT += dt; const dur = 0.46; P.anim = 'spellcast'; P.fr = Math.min(6, Math.floor(P.animT / dur * 7));
      if (!P.castDone && P.fr >= 4) { P.castDone = true; P.castFn && P.castFn(); }
      if (P.animT >= dur) P.state = 'idle';
      break;
    }
    case 'tech': {
      P.animT += dt; P.techUpd && P.techUpd(dt);
      if (P.animT >= P.techDur) { P.state = 'idle'; P.iframes = Math.max(P.iframes, 0.05); }
      break;
    }
    case 'hurt': {
      P.hurtT -= dt; moveBody(P, P.kbx * dt, P.kby * dt); P.kbx *= Math.pow(0.002, dt); P.kby *= Math.pow(0.002, dt);
      P.anim = 'walk'; P.fr = 0; if (P.hurtT <= 0) P.state = 'idle';
      break;
    }
  }
  for (const g of P.ghosts) g.t += dt; P.ghosts = P.ghosts.filter(g => g.t < 0.25);
  if (P.state !== 'dodge') P.z = 0;
  // interaction
  G.near = null;
  for (const n of G.npcs) if (dist(P.x, P.y, n.x, n.y) < 42) G.near = n;
  for (const c of WORLD.props) if (c.def.interact && !c.opened && !c.hidden && dist(P.x, P.y, c.x, c.y) < 34 && (!c.respawnAt || c.respawnAt < G.t)) G.near = c;
  for (const c of WORLD.props) if (c.hidden && !c.opened && (G.reveal > 0 || dist(P.x, P.y, c.x, c.y) < 26) && dist(P.x, P.y, c.x, c.y) < 34) G.near = c;
  if (IN.pressed.interact && G.near) interact(G.near);
  storyGate(P, px0, py0);
}
function startAttack(P, mx, my, mv, heavy) {
  const st = STYLES[P.style];
  P.aim = computeAim(P, mx, my, mv); P.dir = dirOf(Math.cos(P.aim), Math.sin(P.aim));
  if (P.comboT <= 0 || heavy) P.combo = 0;
  const an = heavy ? P.heavyAnim : P.combos[P.combo % P.combos.length];
  P.comboStep = P.combo;
  P.state = 'attack'; setAnim(P, an); P.hitDone = false; P.atkDone = false; P.heavy = heavy; P.st = 0;
  P.lunge = heavy ? 160 : (st.ranged ? 0 : P.style === 'dagues' ? 90 : 70);
  P.combo = (P.combo + 1) % Math.max(1, P.combos.length);
  if (heavy) { P.chargeLvl = P.charge; sfx('heavy'); } else if (!st.ranged) sfx('swing');
}
function doAttackHit(P, heavy) {
  const S = P.st8, st = STYLES[P.style], w = weaponOf(P);
  const cx = P.x, cy = P.y - 14;
  if (st.ranged) {
    const pierce = heavy; const sp = (heavy ? 420 : 330) * (has(P, 'galeArrow') ? 1.3 : 1);
    const split = (heavy && has(P, 'astralSplit')) || (P.trans && P.trans.form === 'astrale');
    const angs = split ? [-0.18, 0, 0.18] : [0];
    const spr = typeof aimSpread === 'function' ? aimSpread(P, heavy) : 0;
    for (const da of angs) spawnProj({ kind: split ? 'star' : 'arrow', x: cx + Math.cos(P.aim) * 12, y: cy + Math.sin(P.aim) * 12, vx: Math.cos(P.aim + da + spr) * sp, vy: Math.sin(P.aim + da + spr) * sp, mult: heavy ? 1.6 + P.chargeLvl * 1.2 : 1, heavy, charged: heavy, from: 'p', life: 0.9, r: 6, pierce, kb: has(P, 'galeArrow') ? 160 : 90, col: '200,190,255' });
    sfx('arrow'); if (heavy) ring(cx, P.y, 30, '#ffe26b', 0.3);
    wear(P, 'weapon', 0.3);
    return;
  }
  const range = (S.range || 30) * (heavy ? 1.4 : 1) * (has(P, 'mistReap') ? 1.2 : 1) + 8;
  let arc = heavy ? (P.style === 'lance' ? 0.6 : Math.PI) : st.arc;
  if (heavy && has(P, 'cleave')) arc = Math.PI;
  let hits = 0;
  for (const e of G.enemies) {
    if (e.dead) continue; const ex = e.x, ey = e.y - (e.def.fly ? 18 : 12 * (e.def.scale || 1));
    const d = dist(cx, cy, ex, ey); if (d > range + e.def.r * 0.6) continue;
    const a = Math.atan2(ey - cy, ex - cx); const da = Math.abs(((a - P.aim + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if (da > arc && d > 14) continue;
    const kb = heavy ? 260 : (P.style === 'bouclier' ? 220 : P.style === 'faux' ? 150 : 110);
    strikeEnemy(P, e, heavy ? 1.6 + P.chargeLvl * 1.4 : 1, { heavy, charged: heavy, kb, stun: P.style === 'bouclier' || heavy ? 0.35 : 0 });
    if (has(P, 'multiProng')) later(() => { if (!e.dead) strikeEnemy(P, e, 0.6, { noProc: true }); }, 120);
    hits++;
  }
  if (P.comboStep === 2) { const sy = trySynergy(P, 'combo3'); if (sy) { P.buffs.haste = G.t + 2 * sy.mul; ring(P.x, P.y, 30, '#f5d0fe', 0.4); num(P.x, P.y - 56, 'Temps accéléré', '#f5d0fe'); } }
  if (heavy) {
    shake(5); ring(P.x + Math.cos(P.aim) * 18, P.y + Math.sin(P.aim) * 10, 60, '#ffe7a0', 0.35, 4);
    fxAt('explosion', P.x + Math.cos(P.aim) * 26, P.y - 10 + Math.sin(P.aim) * 18, { fps: 30, scale: 0.6, layer: 1 });
    burst(P.x + Math.cos(P.aim) * 20, P.y + Math.sin(P.aim) * 12, 14, ['#ffe7a0', '#fff', '#c9b07a']);
    if (has(P, 'dragonBlood')) G.rifts.push({ x: P.x + Math.cos(P.aim) * 30, y: P.y + Math.sin(P.aim) * 20, t: 0, life: 2, r: 24, el: 'feu', mult: 0.25, col: '255,110,40' });
    if (has(P, 'mistReap')) G.rifts.push({ x: P.x + Math.cos(P.aim) * 26, y: P.y + Math.sin(P.aim) * 18, t: 0, life: 3, r: 40, el: 'eau', mult: 0, slow: 1, col: '180,210,240' });
    if (P.st8.flags.dragonBreath) spawnProj({ kind: 'firelion', fxKey: 'firelion_' + ['up', 'left', 'down', 'right'][P.dir], x: P.x + Math.cos(P.aim) * 20, y: P.y - 10 + Math.sin(P.aim) * 16, vx: Math.cos(P.aim) * 175, vy: Math.sin(P.aim) * 175, mult: 0.8, magic: true, el: 'feu', from: 'p', life: 0.9, r: 22, pierce: true, burn: 3, light: '255,140,50' });
    if (P.trans && P.trans.form === 'celeste') { G.bolts.push({ x0: P.x, y0: P.y - 20, x1: P.x + Math.cos(P.aim) * 120, y1: P.y - 20 + Math.sin(P.aim) * 80, t: 0, col: '200,230,255' }); hitLine(P, P.x, P.y - 14, P.aim, 120, 14, 0.9, { el: 'lumiere', noProc: true }); }
  }
  if (hits) { hitstop(heavy ? 0.09 : 0.045); }
  wear(P, 'weapon', 0.2);
}
function startDodge(P, mx, my, mv) {
  const S = P.st8; let cost = 18 * S.dodgeMul;
  let rift = false; const sy = trySynergy(P, 'dodge'); if (sy) { rift = true; cost = 0; }
  if (S.flags.shadowStep && (P.shadowStepT || 0) < G.t) { cost = 0; P.shadowStepT = G.t + 4; }
  if (S.flags.dodgeFree) cost = 0;
  if (P.sta < cost) return;
  let dx = mx, dy = my; if (mv < 0.15) { dx = DIRV[P.dir][0]; dy = DIRV[P.dir][1]; }
  const m = Math.hypot(dx, dy) || 1; P.dvx = dx / m; P.dvy = dy / m;
  if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) P.dir = dirOf(dx, dy);
  P.state = 'dodge'; P.dodgeT = 0; P.dodgeDur = rift ? 0.2 : 0.26; P.dodgeSpd = rift ? 460 : 300; P.rift = rift;
  P.iframes = Math.max(P.iframes, 0.3); P.sta -= cost; P.staT = 0.5; P.cd.dodge = 0.12; P.st = 0;
  if (S.flags.shadowStrike) P.buffs.shadowStrike = 1;
  if (P.buffs.volcan > G.t) volcanDodge(P);
  sfx('dodge'); for (let i = 0; i < 6; i++) part(P.x + rnd(-6, 6), P.y, { col: rift ? 'rgba(165,180,252,0.8)' : 'rgba(200,190,170,0.7)', size: 2, life: 0.4, vx: -P.dvx * 40 + rnd(-10, 10), vy: -P.dvy * 30 + rnd(-10, 10) });
}
function usePotion(P) {
  if (P.cd.potion > 0) return;
  if (countItem(P, 'potion') <= 0) { toast('Plus de potions !', '#ff8a8a'); return; }
  if (P.hp >= P.st8.maxhp) { toast('PV déjà au maximum', '#aaa'); return; }
  takeItem(P, 'potion', 1); P.healT = 0.6; P.healRate = P.st8.maxhp * 0.45 / 0.6; P.cd.potion = 1; sfx('pick'); ring(P.x, P.y, 22, '#7dff9a', 0.4);
  num(P.x, P.y - 40, '+' + Math.round(P.st8.maxhp * 0.45), '#7dff9a');
}
function useConsumable(P, inst) {
  const d = def(inst); const S = P.st8;
  if (d.id === 'potion') { usePotion(P); return true; }
  if (d.kind === 'grimoire') { if (P.spells[d.spell]) { toast('Sort déjà connu', '#aaa'); return false; } P.spells[d.spell] = 1; removeUid(P, inst.uid); toast('Sort secret appris : ' + SECRET_SPELLS[d.spell].name + ' (à placer dans Compétences)', '#c084fc'); sfx('level'); return true; }
  if (d.id === 'chronique') { const known = Object.keys(P.lore || {}).length; if (known >= LORE.length) { toast('Toutes les chroniques sont déjà connues', '#aaa'); return false; } P.lore = P.lore || {}; P.lore[known] = 1; takeItem(P, 'chronique', 1); dialog('Fragment de chronique', LORE[known], [['Fermer', closePanel]]); return 'dialog'; }
  if (d.id === 'sac_agrandi') { if ((P.bags || 0) >= CONFIG.inventoryBagMax) { toast('Sacoche déjà agrandie au maximum', '#aaa'); return false; } P.bags = (P.bags || 0) + 1; removeUid(P, inst.uid); toast('Inventaire : ' + invCap(P) + ' emplacements', '#9f9'); return true; }
  if (d.kind === 'quest' || d.kind === 'relicraw') { toast(d.desc, '#ccc'); return false; }
  takeItem(P, d.id, 1); sfx('pick');
  if (d.id === 'ether') P.mp = Math.min(S.maxmp, P.mp + S.maxmp * 0.6);
  if (d.id === 'tonique') P.buffs.tonique = G.t + 10;
  if (d.id === 'antidote') { P.status.poison = 0; P.buffs.antidote = G.t + 30; }
  if (d.id === 'elixir_force') P.buffs.force = G.t + 60;
  if (d.id === 'elixir_garde') P.buffs.garde = G.t + 60;
  P.dirty = true; toast(d.name + ' utilisé(e)', '#9f9'); return true;
}
function hurtPlayer(P, dmg, sx, sy, src, el) {
  if (P.state !== 'dead' && P.iframes <= 0) padRumble(Math.min(1, 0.35 + dmg / Math.max(1, P.st8.maxhp) * 2), 0.4, 140);
  if (P.state === 'dead' || P.iframes > 0 || G.mode !== 'play') return false;
  el = el || 'physique'; const S = P.st8;
  dmg = gbufHurt(P, dmg, src); if (dmg <= 0) return false;
  const ang = Math.atan2(sy - P.y, sx - P.x);
  if (G.sacred && G.sacred.t > 0 && dist(P.x, P.y, G.sacred.x, G.sacred.y) < 70) dmg *= 0.5;
  if (P.state === 'block') {
    const da = Math.abs(((ang - P.aim + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if (da < 1.3) {
      if (P.blockT < 0.22) { // parade parfaite
        sfx('parry'); slowmo(0.35, 0.3); hitstop(0.08); flashScreen('#cfe8ff', 0.35);
        sparks((P.x + sx) / 2, (P.y + sy) / 2 - 16, ang + Math.PI, 18, '#dff4ff'); ring(P.x, P.y, 36, '#bfe6ff', 0.35, 4);
        num(P.x, P.y - 44, 'PARADE !', '#bfe6ff', true); P.ult = Math.min(100, P.ult + 15); P.awk = Math.min(100, P.awk + 15); P.iframes = 0.25;
        if (has(P, 'parryCounter')) P.buffs.counter = G.t + 2;
        if (has(P, 'ancientAegis')) { P.shield = 3; P.shieldHp = 40; ring(P.x, P.y, 30, '#ffe9a0', 0.4); }
        const sy2 = trySynergy(P, 'parry'); if (sy2) { const h = S.maxhp * 0.05 * sy2.mul; P.hp = Math.min(S.maxhp, P.hp + h); ring(P.x, P.y, 70, '#fff3b0', 0.5, 4); for (const e of G.enemies) if (!e.dead && dist(e.x, e.y, P.x, P.y) < 70) { const a = Math.atan2(e.y - P.y, e.x - P.x); e.kbx += Math.cos(a) * 300; e.kby += Math.sin(a) * 300; } }
        if (src && src.def) { src.stun = Math.max(src.stun || 0, src.def.boss ? 0.8 : 1.6); src.state = 'stun'; strikeEnemy(P, src, 1.2, { kb: 140 }); }
        return false;
      }
      const red = S.block; const taken = Math.max(1, Math.round(dmg * (1 - red)));
      P.sta -= dmg * 1.3 * (has(P, 'bulwark') ? 0.7 : 1); P.staT = 0.8; sfx('block'); sparks((P.x + sx) / 2, (P.y + sy) / 2 - 14, ang + Math.PI, 8);
      P.hp -= taken; num(P.x, P.y - 40, taken, '#bcd'); moveBody(P, -Math.cos(ang) * 6, -Math.sin(ang) * 6);
      const sy3 = trySynergy(P, 'block'); if (sy3) { P.shield = 5; P.shieldHp = 30 * sy3.mul; ring(P.x, P.y, 26, '#c8a26b', 0.4); num(P.x, P.y - 56, 'Rempart minéral', '#c8a26b'); }
      wear(P, 'offhand', 0.5); wear(P, 'weapon', 0.3);
      if (P.sta <= 0) { P.state = 'hurt'; P.hurtT = 0.5; P.kbx = -Math.cos(ang) * 120; P.kby = -Math.sin(ang) * 120; toast('Garde brisée !', '#ffb36b'); }
      if (P.hp <= 0) killPlayer(P);
      return true;
    }
  }
  if (P.shield > 0) {
    sfx('ice'); sparks(P.x, P.y - 16, ang + Math.PI, 6, '#bff'); P.shieldHp -= dmg; num(P.x, P.y - 40, 'Absorbé', '#9ff');
    if (P.shieldHp <= 0) { P.shield = 0; burst(P.x, P.y - 14, 20, ['#dff', '#9cf', '#fff']); }
    return true;
  }
  let taken;
  if (el === 'physique') taken = dmg * 100 / (100 + S.defP * 5);
  else taken = dmg * 100 / (100 + S.defM * 5) * (1 - (S.res[el] || 0));
  taken = Math.max(1, Math.round(taken));
  P.hp -= taken; P.iframes = 0.55; P.flashT = 0.15; sfx('hurt'); shake(4); hitstop(0.05);
  num(P.x, P.y - 40, taken, el === 'physique' ? '#ff6b6b' : (MAGIC_FAMILIES[el] ? MAGIC_FAMILIES[el].col : '#d08bff'));
  burst(P.x, P.y - 14, 6, ['#ff9a9a', '#fff']);
  for (const sl of ['head', 'torso', 'legs', 'feet', 'hands']) wear(P, sl, 0.4);
  if (src && src.def && el === 'physique') {
    if (P.trans && P.trans.form === 'forteresse') strikeEnemy(P, src, 0.3, { noProc: true, noXp: true, kb: 160 });
    if (S.flags.dragonScales) src.burn = 3;
  }
  if (el === 'poison' && !(P.buffs.antidote > G.t) && Math.random() < 0.45 * (1 - S.statusRes - (S.res.poison || 0))) { P.status.poison = 4; toast('Empoisonné !', '#7ee06b'); }
  if (!S.poise && (P.state !== 'attack' || !P.heavy) && P.state !== 'tech' && !(S.flags.poiseHeavy && (P.state === 'charge' || P.state === 'attack'))) { P.state = 'hurt'; P.hurtT = 0.16; P.kbx = -Math.cos(ang) * 150; P.kby = -Math.sin(ang) * 150; }
  else moveBody(P, -Math.cos(ang) * 4, -Math.sin(ang) * 4);
  if (P.hp <= 0) killPlayer(P);
  return true;
}
function killPlayer(P) {
  P.hp = 0; P.state = 'dead'; P.anim = 'hurt'; P.animT = 0; P.fr = 0; sfx('roar'); slowmo(0.8, 0.3); if (P.trans) endTransform(P);
  setTimeout(() => showDeath(), 1400);
}

// ===================== éveil / transformation =====================
function startTransform(P) {
  if (P.trans) return;
  const form = transformReady(P);
  if (!form) { const w = weaponOf(P).d; toast(w.awakening ? (w.upgradePaths.type === 'transform' ? 'Maîtrise ' + w.awakening.req.mastery + ' requise pour la transformation' : 'Arme pas encore éveillée (Spécialiste des reliques)') : 'Cette arme n\'a pas de forme éveillée', '#ffb36b'); return; }
  if (P.awk < 100) { toast('Jauge d\'éveil : ' + Math.floor(P.awk) + ' %', '#ffb36b'); return; }
  P.trans = { form, t: CONFIG.transformDuration }; P.awk = 0;
  const T = TRANSFORMS[form]; sfx('roar'); sfx('shield'); flashScreen('rgb(' + T.aura + ')', 0.45); shake(6); slowmo(0.4, 0.3);
  ring(P.x, P.y, 70, 'rgb(' + T.aura + ')', 0.6, 5); for (let i = 0; i < 40; i++) part(P.x + rnd(-16, 16), P.y - rnd(0, 20), { col: 'rgb(' + T.aura + ')', rise: rnd(40, 100), life: 1, size: 2, add: true });
  toast(T.n + ' ! ' + T.desc, 'rgb(' + T.aura + ')'); rebuildPlayer(P);
}
function endTransform(P) { const T = TRANSFORMS[P.trans.form]; P.trans = null; ring(P.x, P.y, 30, 'rgb(' + T.aura + ')', 0.4); toast('Retour à la forme normale', '#ccc'); rebuildPlayer(P); }

// ===================== reliques =====================
function equippedRelic(P) { for (const s of ['acc1', 'acc2', 'acc3']) { const d = eqDef(P, s); if (d && d.active) return d; } return null; }
function useRelic(P) {
  const r = equippedRelic(P); if (!r) { toast('Aucune relique activable équipée', '#aaa'); return; }
  if ((P.relicCd[r.id] || 0) > G.t) { toast(r.active.n + ' : encore ' + Math.ceil(P.relicCd[r.id] - G.t) + ' s', '#aaa'); return; }
  P.relicCd[r.id] = G.t + r.active.cd; sfx('open'); ring(P.x, P.y, 50, '#ffe9a0', 0.5, 4); flashScreen('#fff6d0', 0.25);
  if (r.id === 'rel_oeil') { G.reveal = r.active.dur; toast('Regard du veilleur : les secrets se révèlent', '#ffe9a0'); }
  if (r.id === 'rel_phenix') { P.buffs.phenix = G.t + r.active.dur; fxAt('firelion_down', P.x, P.y - 40, { fps: 20, layer: 1 }); toast('Embrasement !', '#ff9a4a'); }
  if (r.id === 'rel_sablier') { for (const e of G.enemies) if (!e.dead && dist(e.x, e.y, P.x, P.y) < 300) e.freeze = Math.max(e.freeze || 0, r.active.dur); G.timeTint = r.active.dur; toast('Le temps s\'arrête', '#f5d0fe'); }
  if (r.id === 'rel_larme') { P.hp = P.st8.maxhp; P.mp = P.st8.maxmp; P.status = {}; ring(P.x, P.y, 60, '#d8c8ff', 0.6); toast('Grâce lunaire', '#d8c8ff'); }
}

// ===================== sorts =====================
function aimTarget(P, mx, my, mv, rangeMax) {
  P.aim = computeAim(P, mx, my, mv); P.dir = dirOf(Math.cos(P.aim), Math.sin(P.aim));
  return nearestEnemy(P.x, P.y, rangeMax, 1.3, P.aim) || nearestEnemy(P.x, P.y, rangeMax * 0.6);
}
function skillDef(id) {
  const P = G.player;
  if (P && (id === 's1' || id === 's2' || id === 's3' || id === 'm2') && P.magic) return innateSpell(P, id) || SKILLS[id];
  return SKILLS[id] || SECRET_SPELLS[id];
}
function castSkill(P, id, mx, my, mv, slot) {
  if (id === 's1' || id === 's2' || id === 's3' || id === 'm2') return castInnate(P, id, mx, my, mv, slot);
  if (!P.magic) { toast('Ta magie innée n\'est pas encore révélée.', '#c4b5fd'); return; }
  const sk = skillDef(id); const S = P.st8; const cdKey = slot || id;
  if (P.cd[cdKey] > 0) return;
  let cost = Math.round(sk.mp * (S.flags.manaThrift ? 0.85 : 1));
  if (P.buffs.phenix > G.t && (id === 's1' || id === 'meteore')) cost = 0;
  if (P.mp < cost) { toast('Pas assez de mana', '#7aa8ff'); sfx('ui'); return; }
  P.mp -= cost; P.cd[cdKey] = sk.cd; P.state = 'cast'; P.animT = 0; P.castDone = false; P.st = 0;
  const pw = S.mag * (id === 's1' && equippedRelic(P) && equippedRelic(P).id === 'rel_phenix' ? 1.4 : 1);
  sfx('cast'); ring(P.x, P.y, 22, '#b9a3ff', 0.35);
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; part(P.x + Math.cos(a) * 16, P.y + Math.sin(a) * 8, { rise: 40, col: '#c8b6ff', life: 0.5, size: 2, add: true }); }
  const mag = (e, m, el, o) => strikeEnemy(P, e, m, Object.assign({ magic: true, el, noXp: true }, o || {}));
  if (id === 's1') {
    const t = aimTarget(P, mx, my, mv, 220); if (t) P.aim = Math.atan2(t.y - P.y, t.x - P.x);
    const dirn = ['up', 'left', 'down', 'right'][dirOf(Math.cos(P.aim), Math.sin(P.aim))]; P.dir = dirOf(Math.cos(P.aim), Math.sin(P.aim));
    P.castFn = () => { sfx('fire'); const a = P.aim; spawnProj({ kind: 'firelion', fxKey: 'firelion_' + dirn, x: P.x + Math.cos(a) * 20, y: P.y - 10 + Math.sin(a) * 16, vx: Math.cos(a) * 175, vy: Math.sin(a) * 175, mult: (18 + pw * 1.1) / Math.max(1, S.mag), magic: true, el: 'feu', from: 'p', life: 1.25, r: 22, pierce: true, burn: 3, light: '255,140,50' }); };
  } else if (id === 's2') {
    const t = aimTarget(P, mx, my, mv, 200); const tx = t ? t.x : P.x + Math.cos(P.aim) * 70, ty = t ? t.y : P.y + Math.sin(P.aim) * 70;
    P.castFn = () => { sfx('ice'); fxAt('icetacle', tx, ty - 30, { fps: 22, layer: 0 }); later(() => { shake(3); burst(tx, ty, 14, ['#dff6ff', '#9fd8ff', '#fff']); ring(tx, ty, 40, '#bfe9ff', 0.4); for (const e of G.enemies) if (!e.dead && dist(tx, ty, e.x, e.y) < 44) { mag(e, (22 + pw * 1.3) / S.mag, 'glace'); e.freeze = Math.max(e.freeze || 0, 2.2); } }, 200); };
  } else if (id === 's3') {
    const t = aimTarget(P, mx, my, mv, 240);
    P.castFn = () => {
      sfx('zap'); flashScreen('#fff8c0', 0.25);
      const hitList = []; let cur = t || { x: P.x + Math.cos(P.aim) * 80, y: P.y + Math.sin(P.aim) * 80 };
      for (let i = 0; i < 4 && cur; i++) { hitList.push(cur); let nx = null, bd = 120; for (const e of G.enemies) { if (e.dead || hitList.includes(e)) continue; const d = dist(cur.x, cur.y, e.x, e.y); if (d < bd) { bd = d; nx = e; } } cur = nx; }
      hitList.forEach((h, i) => later(() => {
        fxAt('lightning', h.x, h.y - 100, { fps: 18, loop: 0.25, add: true, layer: 1 }); fxAt('lightningclaw', h.x, h.y - 36, { fps: 26, add: true, layer: 1 });
        G.bolts.push({ x0: i ? hitList[i - 1].x : P.x, y0: i ? hitList[i - 1].y - 16 : P.y - 30, x1: h.x, y1: h.y - 14, t: 0 }); addLight(h.x, h.y, 90, '255,240,150'); shake(3);
        if (h.def) { mag(h, (26 + pw * 1.4) * (i ? 0.75 : 1) / S.mag, 'foudre', { stun: 0.7, kb: 60 }); h.shock = 1.2; }
        sparks(h.x, h.y - 14, -Math.PI / 2, 10, '#fff6a0');
      }, i * 110));
    };
  } else if (id === 's4') {
    P.castFn = () => {
      sfx('shield'); P.shield = 6; P.shieldHp = 40 + pw * 2.2; fxAt('iceshield', P.x, P.y - 22, { fps: 24, follow: P, oy: -22, layer: 1, add: true }); ring(P.x, P.y, 70, '#bfe9ff', 0.45, 4);
      for (const e of G.enemies) if (!e.dead && dist(P.x, P.y, e.x, e.y) < 70) { mag(e, (8 + pw * 0.4) / S.mag, 'glace', { kb: 300 }); e.freeze = Math.max(e.freeze || 0, 0.8); }
    };
  } else if (id === 'meteore') {
    const t = aimTarget(P, mx, my, mv, 220); const tx = t ? t.x : P.x + Math.cos(P.aim) * 90, ty = t ? t.y : P.y + Math.sin(P.aim) * 90;
    P.castFn = () => {
      G.zones2.push({ x: tx, y: ty, r: 64, t: 0, delay: 0.8, dmg: 0, col: '255,120,40' }); sfx('fire');
      later(() => { sfx('boom'); shake(9); flashScreen('#ffb070', 0.4); fxAt('quake', tx, ty - 6, { fps: 22, scale: 1.4, layer: -1 }); for (let i = 0; i < 6; i++) fxAt('explosion', tx + rnd(-30, 30), ty + rnd(-20, 20) - 16, { fps: 26, layer: 1 }); for (const e of G.enemies) if (!e.dead && dist(tx, ty, e.x, e.y) < 70) { mag(e, (40 + pw * 2.2) / S.mag, 'feu'); e.burn = 4; } }, 800);
    };
  } else if (id === 'neant') {
    const t = aimTarget(P, mx, my, mv, 200); const tx = t ? t.x : P.x + Math.cos(P.aim) * 80, ty = t ? t.y : P.y + Math.sin(P.aim) * 80;
    P.castFn = () => { G.voids.push({ x: tx, y: ty, t: 0, life: 1.6, pw }); sfx('wind'); };
  }
}
function castUlt(P, mx, my, mv) {
  if (!P.magic) { toast('Ta magie innée n\'est pas encore révélée.', '#c4b5fd'); return; }
  if (grimUltReady(P)) return castGrimUlt(P, mx, my, mv);
  if (P.ult < 100) { toast('Ultime pas encore chargé (' + Math.floor(P.ult) + ' %)', '#ffd36b'); return; }
  P.ult = 0; P.state = 'cast'; P.animT = 0; P.castDone = false; const S = P.st8;
  sfx('roar'); slowmo(0.6, 0.25); flashScreen('#ffd27a', 0.5); shake(8); P.iframes = 1.4;
  P.castFn = () => {
    fxAt('quake', P.x, P.y - 8, { fps: 20, scale: 2.2, layer: -1 });
    for (let w = 0; w < 3; w++) later(() => {
      sfx('boom'); shake(7); const R = 50 + w * 45;
      for (let i = 0; i < 10 + w * 4; i++) { const a = i / (10 + w * 4) * Math.PI * 2 + w; const x = P.x + Math.cos(a) * R, y = P.y + Math.sin(a) * R * 0.7; fxAt('rockspikes', x, y - 20, { fps: 24, k0: 10 * (i % 2), layer: 0 }); if (i % 4 === 0) fxAt('explosion', x, y - 16, { fps: 26, layer: 1, scale: 0.8 }); addLight(x, y, 60, '255,160,80'); }
      ring(P.x, P.y, R + 30, '#ffb35a', 0.5, 5);
      for (const e of G.enemies) if (!e.dead && dist(P.x, P.y, e.x, e.y) < R + 36) strikeEnemy(P, e, 1 + S.mag / Math.max(1, S.atk), { el: 'terre', kb: 220, stun: 0.6, noXp: true });
    }, w * 260);
  };
}

// ===================== techniques d'arme =====================
function currentTech(P) {
  const w = weaponOf(P); const own = w.d.activeSkills && w.d.activeSkills[0];
  if (own && w.i && masteryBonus(w.i).skill) return own;
  return STYLES[P.style].tech;
}
function castTech(P, mx, my, mv) {
  const id = currentTech(P); const T = TECHS[id]; const S = P.st8;
  if (P.cd.tech > 0) { toast(T.n + ' : ' + Math.ceil(P.cd.tech) + ' s', '#aaa'); return; }
  if (P.sta < T.sta && !(P.buffs.tonique > G.t)) { toast('Pas assez d\'endurance', '#f5c542'); return; }
  P.sta -= T.sta; P.staT = 0.6; P.cd.tech = T.cd;
  const t = aimTarget(P, mx, my, mv, 200); if (t) P.aim = Math.atan2(t.y - P.y, t.x - P.x);
  const a = P.aim; P.dir = dirOf(Math.cos(a), Math.sin(a));
  P.state = 'tech'; P.animT = 0; P.techUpd = null; P.techDur = 0.4; P.st = 0;
  const anim = (an, dur) => { P.anim = an; P.techUpd2 = dt => { P.fr = Math.min(CHARS.anims[an][0] - 1, Math.floor(P.animT / dur * CHARS.anims[an][0])); }; };
  num(P.x, P.y - 58, T.n, '#ffe9a0'); sfx('heavy');
  const tag = { noXp: false };
  const dash = (len, dur, onEnd, el, mult) => {
    const x0 = P.x, y0 = P.y - 14; P.iframes = dur + 0.1; let d = 0; P.techDur = dur; anim(P.style === 'lance' || P.style === 'bouclier' ? 'thrust' : 'slash', dur);
    P.techUpd = dt => { P.techUpd2(dt); const sp = len / dur; moveBody(P, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt); d += sp * dt; P.ghosts.push({ x: P.x, y: P.y, an: P.anim, fr: P.fr, dir: P.dir, t: 0 }); if (P.animT + dt >= dur && !P.dashDone) { P.dashDone = true; hitLine(P, x0, y0, a, dist(x0, y0, P.x, P.y - 14) + 20, 18, mult, { el, kb: 160 }); onEnd && onEnd(); } };
    P.dashDone = false;
  };
  switch (id) {
    case 'taille_tournoyante': { P.techDur = 0.45; let k = 0; P.anim = P.combos[0]; P.techUpd = dt => { P.dir = [2, 3, 0, 1][Math.floor(P.animT / 0.06) % 4]; P.fr = 3; if (P.animT > k * 0.15 && k < 3) { k++; hitArea(P, P.x, P.y - 10, 50, 0.6, { kb: 150 }); ring(P.x, P.y, 46, '#ffe7a0', 0.25, 3); sfx('swing'); } }; break; }
    case 'iai': dash(100, 0.16, () => { ring(P.x, P.y, 30, '#fff', 0.3); }, null, 2); break;
    case 'eclair_tranchant': dash(110, 0.16, () => { const e = nearestEnemy(P.x, P.y, 120); if (e) chainSpark(P, { x: P.x, y: P.y }, 4, 0.8); flashScreen('#fff6b0', 0.2); }, 'foudre', 2.1); break;
    case 'charge_rempart': dash(85, 0.25, () => { shake(4); hitArea(P, P.x + Math.cos(a) * 16, P.y - 8 + Math.sin(a) * 10, 34, 0.6, { stun: 1.2, kb: 300 }); }, null, 1); P.shield = Math.max(P.shield, 0.4); P.shieldHp = 999; break;
    case 'charge_draconique': dash(170, 0.3, () => { shake(6); hitArea(P, P.x, P.y - 8, 50, 1.2, { el: 'feu', kb: 320, stun: 0.5 }); }, 'feu', 1.8);
      for (let i = 1; i <= 6; i++) G.rifts.push({ x: P.x + Math.cos(a) * i * 28, y: P.y + Math.sin(a) * i * 20, t: -i * 0.04, life: 2.2, r: 22, el: 'feu', mult: 0.25, col: '255,110,40' }); sfx('fire'); break;
    case 'pluie_fleches': case 'pluie_astrale': {
      const n = id === 'pluie_astrale' ? 12 : 8; const tx = t ? t.x : P.x + Math.cos(a) * 110, ty = t ? t.y : P.y + Math.sin(a) * 110;
      anim('shoot', 0.5); P.techDur = 0.5; P.techUpd = P.techUpd2;
      G.zones2.push({ x: tx, y: ty, r: 40, t: 0, delay: 0.5, dmg: 0, col: id === 'pluie_astrale' ? '200,190,255' : '255,230,150' });
      for (let i = 0; i < n; i++) later(() => { const x = tx + rnd(-36, 36), y = ty + rnd(-24, 24); spawnProj({ kind: id === 'pluie_astrale' ? 'star' : 'arrow', x, y: y - 140, vx: 0, vy: 420, mult: id === 'pluie_astrale' ? 0.9 : 0.7, el: id === 'pluie_astrale' ? 'arcane' : null, from: 'p', life: 0.33, r: 14, pierce: true, col: '200,190,255', fall: y }); }, 300 + i * 50);
      break;
    }
    case 'fleche_cyclone': anim('shoot', 0.5); P.techDur = 0.5; P.techUpd = P.techUpd2; later(() => G.tornados.push({ x: P.x + Math.cos(a) * 20, y: P.y + Math.sin(a) * 14, vx: Math.cos(a) * 70, vy: Math.sin(a) * 50, t: 0, life: 2.6 }), 250); sfx('wind'); break;
    case 'moisson': case 'voile_brume': case 'marque_funeraire': case 'fauche_du_chef': {
      anim('slash', 0.36); P.techDur = 0.36; P.techUpd = dt => { P.techUpd2(dt); if (!P.tdone && P.animT > 0.16) { P.tdone = true;
        const r = id === 'fauche_du_chef' ? 70 : 62;
        for (const e of G.enemies) if (!e.dead && dist(e.x, e.y, P.x, P.y) < r) { const aa = Math.atan2(P.y - e.y, P.x - e.x); if (id === 'moisson') { e.kbx += Math.cos(aa) * 220; e.kby += Math.sin(aa) * 220; } strikeEnemy(P, e, id === 'fauche_du_chef' ? 2.2 : 1.5, { kb: id === 'fauche_du_chef' ? 300 : 40, stun: id === 'fauche_du_chef' ? 0.6 : 0 }); if (id === 'marque_funeraire') addMark(P, e, 3); }
        ring(P.x, P.y, r, id === 'marque_funeraire' ? '#c4b5fd' : id === 'voile_brume' ? '#b4d2f0' : '#ffe7a0', 0.4, 4); shake(4);
        if (id === 'voile_brume') G.rifts.push({ x: P.x, y: P.y, t: 0, life: 4, r: 70, el: 'eau', mult: 0, slow: 1, col: '180,210,240' });
      } }; P.tdone = false; break;
    }
    case 'danse_lames': case 'pas_crepuscule': {
      const n = id === 'pas_crepuscule' ? 5 : 4; const targets = G.enemies.filter(e => !e.dead && dist(e.x, e.y, P.x, P.y) < 150).sort((p, q) => dist(p.x, p.y, P.x, P.y) - dist(q.x, q.y, P.x, P.y)).slice(0, n);
      P.techDur = 0.12 + targets.length * 0.12; P.iframes = P.techDur + 0.1; let k = 0; P.anim = 'slash';
      P.techUpd = dt => { if (k < targets.length && P.animT > k * 0.12) { const e = targets[k]; P.ghosts.push({ x: P.x, y: P.y, an: 'slash', fr: 3, dir: P.dir, t: 0 }); if (!e.dead) { P.x = e.x - Math.cos(a) * 14; P.y = e.y + 2; P.dir = dirOf(e.x - P.x, e.y - P.y); strikeEnemy(P, e, 1, { critBonus: 0.3, el: id === 'pas_crepuscule' ? (k % 2 ? 'ombre' : 'lumiere') : null }); sparks(e.x, e.y - 14, 0, 6, k % 2 ? '#c4b5fd' : '#fff3b0'); } k++; P.fr = 3; } };
      break;
    }
    case 'morsure_venimeuse': anim('thrust', 0.35); P.techDur = 0.35; P.techUpd = P.techUpd2; fxAt('snakebite', P.x, P.y - 30, { fps: 26, layer: 1 }); for (const e of G.enemies) if (!e.dead && dist(e.x, e.y, P.x, P.y) < 64) { addPoison(e, 5); strikeEnemy(P, e, 0.8, { el: 'poison' }); } ring(P.x, P.y, 64, '#7ee06b', 0.4, 4); break;
    case 'percee': case 'lance_tempete': {
      anim('thrust', 0.4); P.techDur = 0.4; P.techUpd = dt => { P.techUpd2(dt); if (!P.tdone && P.animT > 0.2) { P.tdone = true; hitLine(P, P.x, P.y - 14, a, 115, 16, 2, { kb: id === 'lance_tempete' ? 380 : 180 }); G.bolts.push({ x0: P.x, y0: P.y - 14, x1: P.x + Math.cos(a) * 115, y1: P.y - 14 + Math.sin(a) * 115, t: 0, col: '255,250,220' }); if (id === 'lance_tempete') { sfx('wind'); ring(P.x + Math.cos(a) * 60, P.y + Math.sin(a) * 40, 50, '#c8f7e8', 0.4); chainSpark(P, { x: P.x + Math.cos(a) * 100, y: P.y + Math.sin(a) * 70 }, 2, 0.5); } } }; P.tdone = false; break;
    }
    case 'jugement_celeste': { const tx = t ? t.x : P.x + Math.cos(a) * 80, ty = t ? t.y : P.y + Math.sin(a) * 80; anim('slash', 0.4); P.techDur = 0.4; P.techUpd = P.techUpd2;
      G.zones2.push({ x: tx, y: ty, r: 42, t: 0, delay: 0.45, dmg: 0, col: '255,240,170' });
      later(() => { flashScreen('#fff8d0', 0.35); shake(6); G.pillars.push({ x: tx, y: ty, t: 0 }); hitArea(P, tx, ty, 44, 3, { el: 'lumiere', kb: 200 }); P.hp = Math.min(S.maxhp, P.hp + S.maxhp * 0.05); sfx('shield'); }, 450); break; }
    case 'faille_abyssale': anim('slash', 0.35); P.techDur = 0.35; P.techUpd = P.techUpd2; for (let i = 1; i <= 5; i++) G.rifts.push({ x: P.x + Math.cos(a) * i * 24, y: P.y + Math.sin(a) * i * 16, t: -i * 0.05, life: 2, r: 22, el: 'ombre', mult: 0.35, col: '150,40,200' }); sfx('wind'); break;
    case 'barriere_sacree': P.techDur = 0.3; P.anim = 'walk'; P.fr = 0; G.sacred = { x: P.x, y: P.y, t: 6 }; ring(P.x, P.y, 70, '#ffe9a0', 0.6, 5); sfx('shield'); break;
    case 'vague_ecarlate': anim('slash', 0.36); P.techDur = 0.36; P.techUpd = P.techUpd2; for (const da of [-0.35, 0, 0.35]) spawnProj({ kind: 'firelion', fxKey: 'firelion_' + ['up', 'left', 'down', 'right'][P.dir], x: P.x + Math.cos(a + da) * 20, y: P.y - 10 + Math.sin(a + da) * 16, vx: Math.cos(a + da) * 180, vy: Math.sin(a + da) * 180, mult: 2.2 / 3 * 1.5, el: 'feu', from: 'p', life: 0.8, r: 18, pierce: true, burn: 3, light: '255,120,50' }); sfx('fire'); break;
  }
}
