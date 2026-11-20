'use strict';
// ===================== COMBOS : finales d'arme, résonances de magie, réactions élémentaires =====================
// ---------- 1) finale de combo propre à chaque arme (dernier coup de la chaîne) ----------
const FINISHERS = {
  epee: { n: 'Estocade tournoyante', col: '#ffd9a0', run(P, hit) { aoe(P, 66, 0.9, { kb: 210 }); ring(P.x, P.y, 66, '#ffd9a0', 0.35, 4); } },
  katana: { n: 'Triple entaille', col: '#e8f0ff', run(P, hit) { for (const e of hit) { later(() => !e.dead && strikeEnemy(P, e, 0.5, { noProc: true }), 110); later(() => !e.dead && strikeEnemy(P, e, 0.5, { noProc: true }), 220); } } },
  faux: { n: 'Onde de fauchage', col: '#c9b7ff', run(P, hit) { aoe(P, 92, 0.8, { kb: 280 }, e => { e.slowT = Math.max(e.slowT || 0, 1.5); }); ring(P.x, P.y, 92, '#c9b7ff', 0.4, 4); } },
  bouclier: { n: 'Fracas du bouclier', col: '#cfe6ff', run(P, hit) { for (const e of hit) { strikeEnemy(P, e, 0.6, { kb: 320, stun: 0.5 }); if (!e.def.boss) e.stun = Math.max(e.stun || 0, 1.0); } ring(P.x + Math.cos(P.aim) * 22, P.y + Math.sin(P.aim) * 14, 40, '#cfe6ff', 0.3, 4); } },
  dagues: { n: 'Fente éclair', col: '#ffb3b3', run(P, hit) { for (const e of hit) for (let i = 1; i <= 3; i++) later(() => !e.dead && strikeEnemy(P, e, 0.32, { noProc: true, critBonus: 0.5 }), i * 70); } },
  lance: { n: 'Estoc perçant', col: '#bfeaff', run(P, hit) { const ca = Math.cos(P.aim), sa = Math.sin(P.aim); for (const e of G.enemies) { if (e.dead) continue; const dx = e.x - P.x, dy = (e.y - 12) - (P.y - 14), along = dx * ca + dy * sa, perp = Math.abs(-dx * sa + dy * ca); if (along > 0 && along < 150 && perp < 22) strikeEnemy(P, e, 1.0, { kb: 180 }); } ring(P.x + ca * 60, P.y + sa * 40, 30, '#bfeaff', 0.3, 3); } },
  arc: { n: 'Salve triple', col: '#ffe26b' }
};
function aoe(P, r, mult, o, fx) { for (const e of G.enemies) { if (e.dead) continue; if (dist(P.x, P.y, e.x, e.y - 10) > r + (e.def.r || 12) * 0.6) continue; strikeEnemy(P, e, mult, Object.assign({}, o)); fx && fx(e); } }
const _doAttackHit0 = doAttackHit;
doAttackHit = function (P, heavy) {
  _doAttackHit0(P, heavy);
  try {
    const st = STYLES[P.style], len = (P.combos || []).length;
    const hit = G.enemies.filter(e => !e.dead && G.t - (e.lastHit || -9) < 0.12);
    if (!heavy && len && P.comboStep === len - 1) {
      const F = FINISHERS[P.style];
      if (st.ranged) { // arc : une salve de trois flèches tous les 3 tirs
        const a = P.aim; for (const da of [-0.2, 0.2]) { P.aim = a + da; _doAttackHit0(P, false); } P.aim = a;
        num(P.x, P.y - 58, 'Salve triple', '#ffe26b'); if (typeof queueTip === 'function') queueTip('combo');
      } else if (F && F.run && (hit.length || P.style === 'epee' || P.style === 'faux')) {
        F.run(P, hit); num(P.x, P.y - 58, F.n, F.col); shake(3); if (typeof queueTip === 'function') queueTip('combo');
      }
    }
    resonanceHit(P, hit.length ? hit : G.enemies.filter(e => !e.dead && G.t - (e.lastHit || -9) < 0.12));
  } catch (e) { console.error('combo', e.message); }
};

// ---------- 2) résonance : un sort lancé « charge » les prochains coups d'arme ----------
function famCat(f) {
  f = String(f || '');
  if (/^(feu|lave|demon)/.test(f)) return 'fire'; if (/^(glace|cristal)/.test(f)) return 'ice'; if (/^(foudre|son|vent)$/.test(f)) return 'storm';
  if (/^(poison|nature|malediction)/.test(f)) return 'toxic'; if (/^sang/.test(f)) return 'blood'; if (/^(ombre|neant|necro|ames|illusion)/.test(f)) return 'dark';
  if (/^(lumiere|rune|astrale)/.test(f)) return 'holy'; return 'control';
}
const RESO = { fire: ['Brûlure', '#ff8a3a'], ice: ['Givre', '#9fe3ff'], storm: ['Chaîne d\'éclairs', '#ffe066'], toxic: ['Poison', '#7ee06b'], blood: ['Vampirisme', '#ff5a6a'], dark: ['Malédiction', '#a78bfa'], holy: ['Éclat sacré', '#fff3b0'], control: ['Entrave', '#c8d4e8'] };
function setReso(P, fam) { const cat = famCat(fam); P.reso = { cat, hits: 3, until: G.t + 6 }; num(P.x, P.y - 62, 'Résonance : ' + RESO[cat][0], RESO[cat][1]); ring(P.x, P.y, 26, RESO[cat][1], 0.35, 3); if (typeof queueTip === 'function') queueTip('reso'); }
const _castSkill0 = castSkill;
castSkill = function (P, id, mx, my, mv, slot) {
  const mp0 = P.mp, r = _castSkill0(P, id, mx, my, mv, slot);
  try { if (P.mp < mp0 - 0.5) { const fam = id === 'm2' ? P.magic2 : P.magic; if (fam) setReso(P, fam); } } catch (e) { }
  return r;
};
function resonanceHit(P, hit) {
  const R = P.reso; if (!R) return; if (G.t > R.until || R.hits <= 0) { P.reso = null; return; }
  if (!hit.length) return; R.hits--; const col = RESO[R.cat][1], S = P.st8;
  for (const e of hit) {
    ring(e.x, e.y - 14, 18, col, 0.25, 2);
    switch (R.cat) {
      case 'fire': e.burn = Math.max(e.burn || 0, 3); break;
      case 'ice': e.slowT = Math.max(e.slowT || 0, 2.5); break;
      case 'storm': { let k = 0; for (const n of G.enemies) { if (n === e || n.dead || k >= 2 || dist(n.x, n.y, e.x, e.y) > 120) continue; k++; G.bolts.push({ x0: e.x, y0: e.y - 20, x1: n.x, y1: n.y - 20, t: 0, col: '255,240,150' }); strikeEnemy(P, n, 0.5, { magic: true, el: 'foudre', noProc: true }); } break; }
      case 'toxic': e.poison = Math.max(e.poison || 0, 1); e.poisonT = Math.max(e.poisonT || 0, 3); break;
      case 'blood': P.hp = Math.min(S.maxhp, P.hp + S.maxhp * 0.02); break;
      case 'dark': e.curse = G.t + 4; break;
      case 'holy': strikeEnemy(P, e, 0.5, { magic: true, el: 'lumiere', noProc: true }); P.hp = Math.min(S.maxhp, P.hp + S.maxhp * 0.015); break;
      default: if (!e.def.boss) e.rootT = Math.max(e.rootT || 0, 0.8); break;
    }
  }
  if (R.hits <= 0) P.reso = null;
}

// ---------- 3) réactions élémentaires (arme ou sort, peu importe) ----------
const _damageEnemy0 = damageEnemy;
damageEnemy = function (e, dmg, crit, kx, ky, kb, stun, el) {
  try {
    if (e && !e.dead && (e.reactT || 0) < G.t) {
      let r = null;
      if (el === 'glace' && e.burn > 0) { dmg *= 1.6; e.burn = 0; r = ['Choc thermique', '#9fe3ff']; }
      else if (el === 'feu' && e.poison > 0) { dmg *= 1.5; e.poison = 0; r = ['Explosion toxique', '#9bff6b']; }
      else if (el === 'foudre' && e.slowT > 0) { dmg *= 1.4; r = ['Conduction', '#ffe066']; }
      else if (el === 'feu' && e.slowT > 0) { dmg *= 1.3; e.slowT = 0; r = ['Fonte', '#ff9a5a']; }
      else if (el === 'lumiere' && e.curse > G.t) { dmg *= 1.5; e.curse = 0; r = ['Purification', '#fff3b0']; }
      if (r) { e.reactT = G.t + 1.5; num(e.x + 10, e.y - 72, r[0], r[1]); ring(e.x, e.y - 14, 26, r[1], 0.3, 3); }
    }
  } catch (x) { }
  return _damageEnemy0(e, dmg, crit, kx, ky, kb, stun, el);
};
const _drawHUD2 = drawHUD;
drawHUD = function (ctx) { _drawHUD2(ctx); try { const R = G.player && G.player.reso; if (R && G.t < R.until && R.hits > 0) txt(ctx, 'Résonance ' + RESO[R.cat][0] + ' x' + R.hits, 6, 84, RESO[R.cat][1], 8); } catch (e) { } };
