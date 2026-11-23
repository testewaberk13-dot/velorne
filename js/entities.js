// ===================== ennemis =====================
function bossGone(kind) { return kind === 'boss_orc_chief' ? !!G.flags.bossDead : (kind.startsWith('boss_') && !!G.flags['dead_' + kind]); }
function spawnEnemy(kind, x, y, sp) {
  const d = ENEMIES[kind];
  const lvlMul = 1;
  const e = { kind, def: d, x, y, bw: d.bw || 16, bh: d.bh || 8, hp: d.hp * lvlMul, maxhp: d.hp * lvlMul, dir: 2, state: 'idle', st: rnd(0, 2), cd: rnd(0.5, 1.5), anim: 'walk', fr: 0, animT: 0, flash: 0, kbx: 0, kby: 0, home: { x, y }, sp, z: 0, t: rnd(0, 10), wanderT: 0, tx: x, ty: y };
  if (d.look) e.spr = lookSprite(d.look);
  if (d.boss) { e.phase = 1; e.summonT = 6; e.slamT = 8; e.chargeT = 5; }
  G.enemies.push(e);
  return e;
}
function damageEnemy(e, dmg, crit, kx, ky, kb, stun, el) {
  if (e.dead) return;
  el = el || 'physique'; const rs = (e.def.res && e.def.res[el]) || 0;
  dmg *= 1 - rs; if (e.curse > G.t) dmg *= 1.25; if (e.xs && e.xs.vuln) dmg *= 1.25; dmg = Math.max(1, Math.round(dmg));
  if (rs >= 0.3 && Math.random() < 0.3) num(e.x + 10, e.y - 60, 'Résiste', '#aab'); if (rs <= -0.3 && Math.random() < 0.4) num(e.x + 10, e.y - 60, 'Faiblesse !', '#ffd23f');
  e.hp -= dmg; e.flash = 0.12; e.aggro = true; e.lastHit = G.t;
  if (!e.def.boss || e.state !== 'atk') { e.kbx += kx * kb * (e.def.boss ? 0.25 : e.def.heavy ? 0.55 : 1); e.kby += ky * kb * (e.def.boss ? 0.25 : e.def.heavy ? 0.55 : 1); }
  if (stun && !e.def.boss) { e.stun = Math.max(e.stun || 0, stun); if (e.state === 'wind') e.state = 'stun'; }
  num(e.x, e.y - (e.def.fly ? 44 : 50 * (e.def.scale || 1)), crit ? dmg + '!' : dmg, crit ? '#ffd23f' : (el !== 'physique' && MAGIC_FAMILIES[el] ? MAGIC_FAMILIES[el].col : '#fff'), crit);
  sfx(crit ? 'crit' : 'hit');
  sparks(e.x, e.y - 16, Math.atan2(ky, kx), crit ? 12 : 6);
  burst(e.x, e.y - 14, 4, e.def.look ? ['#b33', '#e55', '#fff'] : ['#8f8', '#cfc', '#fff'], { spd: 0.6 });
  if (crit) { shake(2); padRumble(0.15, 0.45, 60); }
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  e.dead = true; e.state = 'dead'; e.deadT = 0; e.animT = 0;
  const P = G.player; const d = e.def;
  if (d.dummy) { sfx('kill'); burst(e.x, e.y - 16, 18, ['#d9b46a', '#8a6a3a', '#fff']); questEvent('dummy', e); return; }
  sfx('kill'); P.kills++;
  gainXp(Math.round(d.xp * (P.st8.flags.xpMul || 1))); if (P.st8.flags.killMana) P.mp = Math.min(P.st8.maxmp, P.mp + P.st8.flags.killMana); P.ult = Math.min(100, P.ult + (d.boss ? 50 : 6)); P.awk = Math.min(100, P.awk + (P.trans ? 0 : 8));
  const wi = eqInst(P, 'weapon'); if (wi) addWeaponXp(P, wi, 3);
  if (has(P, 'swiftStep')) P.buffs.haste = G.t + 2;
  const sy = trySynergy(P, 'kill'); if (sy) { const h = P.st8.maxhp * 0.03 * sy.mul; P.hp = Math.min(P.st8.maxhp, P.hp + h); P.mp = Math.min(P.st8.maxmp, P.mp + 4); for (let i = 0; i < 6; i++) part(e.x, e.y - 14, { vx: (P.x - e.x) * 1.5, vy: (P.y - e.y) * 1.5, col: '#c4b5fd', life: 0.6, size: 2, add: true }); }
  const g = rndi(d.gold[0], d.gold[1]); const ng = Math.min(8, Math.ceil(g / 4));
  for (let i = 0; i < ng; i++) G.drops.push({ kind: 'gold', n: Math.ceil(g / ng), x: e.x, y: e.y, vx: rnd(-60, 60), vy: rnd(-40, 40), vz: rnd(60, 120), z: 4, t: 0 });
  if (Math.random() < (d.elite ? 0.6 : 0.08)) G.drops.push({ kind: 'item', id: 'potion', n: 1, x: e.x, y: e.y, vx: rnd(-40, 40), vy: rnd(-30, 30), vz: 90, z: 4, t: 0 });
  for (const [id, n] of rollLoot(e.kind)) G.drops.push({ kind: 'item', id, n, x: e.x, y: e.y, vx: rnd(-60, 60), vy: rnd(-40, 40), vz: rnd(90, 130), z: 4, t: 0 });
  const L = LOOT[e.kind];
  if (L && L.recipe && Math.random() < 0.35 && !P.recipes[L.recipe]) G.drops.push({ kind: 'recipe', rid: L.recipe, x: e.x, y: e.y, vx: rnd(-30, 30), vy: rnd(-30, 30), vz: 100, z: 4, t: 0 });
  if (L && L.recipes) L.recipes.forEach(r => learnRecipe(P, r));
  if (d.boss) {
    slowmo(1.6, 0.25); flashScreen('#fff', 0.7); shake(10); sfx('boom'); padRumble(1, 1, 700);
    for (let i = 0; i < 6; i++) later(() => { fxAt('explosion', e.x + rnd(-30, 30), e.y - rnd(0, 60), { fps: 24, layer: 1, scale: 1 }); sfx('boom'); }, i * 160);
    G.boss = null; questEvent('boss', e.kind); playMusic('forest');
  }
  questEvent('kill', e.kind);
  if (e.sp) e.sp.deadAt = G.t;
}
function gainXp(n) {
  const P = G.player; P.xp += n;
  num(P.x, P.y - 52, '+' + n + ' XP', '#c9a2ff');
  while (P.xp >= xpNeed(P.lvl)) {
    P.xp -= xpNeed(P.lvl); P.lvl++; refreshStats(P); P.hp = P.st8.maxhp; P.mp = P.st8.maxmp;
    sfx('level'); flashScreen('#fff2b0', 0.4); ring(P.x, P.y, 60, '#ffe27a', 0.6, 4);
    for (let i = 0; i < 30; i++) part(P.x + rnd(-14, 14), P.y - rnd(0, 10), { rise: rnd(40, 90), col: choice(['#ffe27a', '#fff', '#ffd040']), life: 1, size: 2, add: true });
    toast('Niveau ' + P.lvl + ' ! PV, mana et puissance augmentés', '#ffe27a');
  }
}
const xpNeed = l => Math.round(40 * Math.pow(l, 1.45));

function enemyMove(e, ang, spd, dt) {
  spd *= e.spdMul === undefined ? 1 : e.spdMul;
  const dx = Math.cos(ang) * spd * dt, dy = Math.sin(ang) * spd * dt;
  if (e.def.fly) { e.x = clamp(e.x + dx, TILE * 1.5, (MW - 1.5) * TILE); e.y = clamp(e.y + dy, TILE * 2, (MH - 1.5) * TILE); return false; }
  const hit = moveBody(e, dx, dy);
  if (hit) { // contournement
    const s = e.side || (e.side = Math.random() < 0.5 ? 1 : -1);
    const a2 = ang + s * 1.3; moveBody(e, Math.cos(a2) * spd * dt, Math.sin(a2) * spd * dt);
    e.stuckT = (e.stuckT || 0) + dt; if (e.stuckT > 1.2) { e.side = -s; e.stuckT = 0; }
  }
  return hit;
}
function updateEnemies(dt) {
  const P = G.player;
  for (const e of G.enemies) {
    const d = e.def; e.t += dt; e.flash = Math.max(0, e.flash - dt);
    if (e.dead) {
      e.deadT += dt; e.animT += dt; continue;
    }
    if (!d.boss && !e.aggro && (Math.abs(e.x - P.x) > 800 || Math.abs(e.y - P.y) > 560)) continue; // trop loin : endormi (fluidité)
    // statuts
    if (e.burn > 0) { e.burn -= dt; e.burnTick = (e.burnTick || 0) - dt; if (e.burnTick <= 0) { e.burnTick = 0.5; damageEnemy(e, 3 + G.player.st8.mag * 0.12, false, 0, 0, 0, 0); } if (Math.random() < 0.4) part(e.x + rnd(-6, 6), e.y - rnd(4, 28), { col: choice(['#ff8a2a', '#ffcf4a']), rise: 30, life: 0.4, size: 2, add: true }); if (e.dead) continue; }
    if (e.shock > 0) { e.shock -= dt; if (Math.random() < 0.3) sparks(e.x, e.y - 18, rnd(0, 6.28), 1, '#fff6a0'); }
    if (e.poison > 0) { e.poisonT -= dt; e.poisonTick = (e.poisonTick || 0) - dt; if (e.poisonTick <= 0) { e.poisonTick = 0.6; damageEnemy(e, (2 + P.st8.atk * 0.06) * e.poison, false, 0, 0, 0, 0, 'poison'); } if (Math.random() < 0.3) part(e.x + rnd(-6, 6), e.y - rnd(4, 26), { col: '#7ee06b', rise: 18, life: 0.5, size: 2 }); if (e.poisonT <= 0) e.poison = 0; if (e.dead) continue; }
    e.spdMul = 1; if (e.slowT > 0) { e.slowT -= dt; e.spdMul = 0.4; if (Math.random() < 0.2) part(e.x + rnd(-6, 6), e.y - rnd(4, 24), { col: '#bfe9ff', size: 1, life: 0.4 }); }
    if (e.rootT > 0) { e.rootT -= dt; e.spdMul = 0; }
    if (G.slowZone && G.slowZone(e)) e.spdMul = Math.min(e.spdMul, 0.4);
    let slow = 1;
    if (e.freeze > 0) { e.freeze -= dt; slow = 0; }
    if (e.shock > 0) slow = 0;
    // recul
    if (Math.abs(e.kbx) + Math.abs(e.kby) > 1) {
      if (e.def.fly) { e.x += e.kbx * dt; e.y += e.kby * dt; } else moveBody(e, e.kbx * dt, e.kby * dt);
      e.kbx *= Math.pow(0.0008, dt); e.kby *= Math.pow(0.0008, dt);
    }
    const dP = dist(e.x, e.y, P.x, P.y), aP = Math.atan2(P.y - e.y, P.x - e.x);
    if (P.state === 'dead') e.aggro = false;
    else if (!d.boss && typeof playerSafe === 'function' && playerSafe()) e.aggro = false; // zone sûre : poursuite coupée
    else if (dP < (d.boss ? 230 : 150) && (e.aggro || lineClear(e.x, e.y - 8, P.x, P.y - 8))) e.aggro = true;
    if (e.aggro && dP > 360 && !d.boss) e.aggro = false;
    if (d.boss && e.aggro && !G.boss) { G.boss = e; playMusic('boss'); sfx('roar'); toast(d.name, '#ff9b6b'); shake(6); }
    if (e.stun > 0) { e.stun -= dt; e.state = 'stun'; if (Math.random() < 0.2) part(e.x + rnd(-8, 8), e.y - 46, { col: '#fff27a', life: 0.4, size: 2, add: true }); if (e.stun <= 0) e.state = 'chase'; continue; }
    if (slow === 0) continue;
    e.cd -= dt;
    if (d.dummy) { e.aggro = false; e.kbx *= 0.5; e.kby *= 0.5; continue; }
    if (d.mon) updateMonster(e, dt, dP, aP);
    else if (d.boss) updateBoss(e, dt, dP, aP);
    else updateHumanoid(e, dt, dP, aP);
  }
  // nettoyage + réapparition
  G.enemies = G.enemies.filter(e => !(e.dead && e.deadT > 1.6));
  for (const s of WORLD.spawns) {
    if (bossGone(s.kind)) continue;
    if (s.once) continue;
    const alive = G.enemies.filter(e => e.sp === s).length;
    if (alive < s.n && G.t - (s.deadAt || -999) > (s.kind.startsWith('boss') ? 9e9 : 50) && dist(P.x, P.y, s.x, s.y) > 360) {
      for (let i = alive; i < s.n; i++) { const a = Math.random() * 6.28, r = Math.random() * s.r; const x = s.x + Math.cos(a) * r, y = s.y + Math.sin(a) * r; if (!rectBlocked(x - 8, y - 8, 16, 8)) spawnEnemy(s.kind, x, y, s); }
    }
  }
}
function wander(e, dt, spd) {
  e.wanderT -= dt;
  if (e.wanderT <= 0) { e.wanderT = rnd(1.5, 3.5); const a = Math.random() * 6.28, r = rnd(0, 50); e.tx = e.home.x + Math.cos(a) * r; e.ty = e.home.y + Math.sin(a) * r; }
  const dd = dist(e.x, e.y, e.tx, e.ty);
  if (dd > 4) { const a = Math.atan2(e.ty - e.y, e.tx - e.x); enemyMove(e, a, spd * 0.4, dt); e.dir = dirOf(Math.cos(a), Math.sin(a)); return true; }
  return false;
}
function contactDamage(e, dP, mul) {
  const P = G.player;
  if (dP < e.def.r + 8 && e.cd <= 0) { if (hurtPlayer(P, e.def.dmg * (mul || 1), e.x, e.y, e, e.def.el)) e.cd = 0.9; }
}
function updateMonster(e, dt, dP, aP) {
  const d = e.def, P = G.player;
  if (d.fly) e.z = 14 + Math.sin(e.t * 6) * 3;
  if (!e.aggro) { wander(e, dt, d.spd); return; }
  e.dir = dirOf(Math.cos(aP), Math.sin(aP));
  switch (d.ai) {
    case 'hopper': {
      e.hopT = (e.hopT || 0) - dt;
      if (e.hopT <= 0 && !e.hop) { e.hop = { t: 0, a: aP + rnd(-0.3, 0.3) }; e.hopT = rnd(0.6, 1.0); }
      if (e.hop) { e.hop.t += dt; const k = e.hop.t / 0.42; e.z = Math.sin(Math.min(1, k) * Math.PI) * 12; enemyMove(e, e.hop.a, d.spd * 2.2, dt); if (k >= 1) { e.hop = null; e.z = 0; part(e.x, e.y, { col: 'rgba(120,220,120,0.6)', size: 3, life: 0.3 }); } }
      contactDamage(e, dP); break;
    }
    case 'flyer': {
      const a = aP + Math.sin(e.t * 3) * 1.1; enemyMove(e, e.retreat > 0 ? a + Math.PI : a, d.spd, dt);
      e.retreat = Math.max(0, (e.retreat || 0) - dt);
      if (dP < d.r + 10 && e.cd <= 0) { if (hurtPlayer(P, d.dmg, e.x, e.y, e, d.el)) { e.cd = 1.2; e.retreat = 0.6; } }
      break;
    }
    case 'swooper': {
      if (e.swoop) { e.swoop.t += dt; enemyMove(e, e.swoop.a, d.spd * 3, dt); if (e.swoop.t > 0.35) { e.swoop = null; e.cd = 1.6; } contactDamage(e, dP); }
      else if (dP < 90 && e.cd <= 0) { e.swoop = { t: 0, a: aP }; sfx('dodge'); }
      else enemyMove(e, aP + (dP < 70 ? Math.PI / 2 : 0), d.spd * 0.8, dt);
      break;
    }
    case 'lunger': {
      if (e.lunge) { e.lunge.t += dt; enemyMove(e, e.lunge.a, d.spd * 4, dt); if (e.lunge.t > 0.25) { e.lunge = null; e.cd = 1.4; } contactDamage(e, dP); }
      else if (dP < 56 && e.cd <= 0) { e.lunge = { t: 0, a: aP }; e.flash = 0.05; }
      else enemyMove(e, aP, d.spd, dt);
      break;
    }
    case 'eye': {
      if (dP > 110) enemyMove(e, aP, d.spd, dt); else if (dP < 70) enemyMove(e, aP + Math.PI, d.spd, dt); else enemyMove(e, aP + Math.PI / 2, d.spd * 0.6, dt);
      if (e.cd <= 0 && dP < 170) { e.cd = 2.4; spawnProj({ kind: 'orb', x: e.x, y: e.y - e.z - 10, vx: Math.cos(aP) * 120, vy: Math.sin(aP) * 120, dmg: d.dmg, from: 'e', life: 2, r: 5, col: '255,90,200', src: e, el: 'arcane' }); sfx('cast'); }
      contactDamage(e, dP); break;
    }
  }
}
function updateHumanoid(e, dt, dP, aP) {
  const d = e.def, P = G.player;
  const animate = (an, rate) => { if (e.anim !== an) { e.anim = an; e.animT = 0; } e.animT += dt * rate; };
  if (e.state === 'stun') e.state = 'chase';
  if (!e.aggro && e.state !== 'atk' && e.state !== 'wind') {
    if (wander(e, dt, d.spd)) { animate('walk', 7); e.fr = 1 + Math.floor(e.animT) % 8; } else { e.anim = 'walk'; e.fr = 0; }
    return;
  }
  switch (e.state) {
    case 'idle': case 'chase': {
      e.state = 'chase';
      let want = d.range - 6, ang = aP, spd = d.spd;
      if (d.ai === 'archer' || d.ai === 'caster') {
        if (dP < 90) { ang = aP + Math.PI; } else if (dP > d.range * 0.85) { ang = aP; } else { ang = aP + Math.PI / 2 * (e.side || 1); spd *= 0.5; }
        if (e.cd <= 0 && dP < d.range && lineClear(e.x, e.y - 10, P.x, P.y - 10)) { e.state = 'wind'; e.st = 0; e.dir = dirOf(Math.cos(aP), Math.sin(aP)); e.atkA = aP; e.anim = d.atk; e.animT = 0; break; }
      } else {
        if (d.ai === 'charger' && e.cd <= 0 && dP > 70 && dP < 150 && lineClear(e.x, e.y - 8, P.x, P.y - 8)) { e.state = 'cwind'; e.st = 0; e.atkA = aP; e.dir = dirOf(Math.cos(aP), Math.sin(aP)); break; }
        if (dP < want + 10 && e.cd <= 0) { e.state = 'wind'; e.st = 0; e.dir = dirOf(Math.cos(aP), Math.sin(aP)); e.atkA = aP; break; }
        if (dP < want) { spd = 0; }
        // les gobelins esquivent les attaques
        if (d.dodgy && P.state === 'attack' && dP < 50 && !e.hopped && Math.random() < 0.04) { e.hopped = 0.5; e.kbx -= Math.cos(aP) * 220; e.kby -= Math.sin(aP) * 220; }
      }
      if (e.hopped) { e.hopped -= dt; if (e.hopped <= 0) e.hopped = 0; }
      if (spd > 0) { enemyMove(e, ang, spd, dt); animate('walk', 8 * spd / d.spd + 2); e.fr = 1 + Math.floor(e.animT) % 8; }
      else { e.anim = 'walk'; e.fr = 0; }
      e.dir = dirOf(Math.cos(aP), Math.sin(aP));
      break;
    }
    case 'cwind': { // préparation de charge
      e.st += dt; e.anim = 'walk'; e.fr = 0; e.flash = Math.sin(e.st * 40) > 0 ? 0.03 : 0;
      if (e.st > 0.45) { e.state = 'charging'; e.st = 0; sfx('dodge'); }
      break;
    }
    case 'charging': {
      e.st += dt; enemyMove(e, e.atkA, 250, dt); animate('walk', 18); e.fr = 1 + Math.floor(e.animT) % 8;
      if (Math.random() < 0.6) part(e.x, e.y, { col: 'rgba(170,150,120,0.6)', size: 3, life: 0.4 });
      if (dP < 22 && !e.chHit) { e.chHit = true; hurtPlayer(P, d.dmg * 1.3, e.x, e.y, e); }
      if (e.st > 0.42) { e.state = 'recover'; e.st = 0; e.chHit = false; e.cd = d.cd * 1.6; }
      break;
    }
    case 'wind': {
      e.st += dt; const at = ANIM_T[d.atk];
      if (d.atk === 'shoot') { e.anim = 'shoot'; e.fr = Math.min(8, Math.floor(e.st / d.wind * 8)); e.atkA = Math.atan2(P.y - e.y, P.x - e.x); e.dir = dirOf(Math.cos(e.atkA), Math.sin(e.atkA)); }
      else if (d.atk === 'spellcast') { e.anim = 'spellcast'; e.fr = Math.min(3, Math.floor(e.st / d.wind * 3)); if (Math.random() < 0.5) part(e.x + rnd(-10, 10), e.y - rnd(10, 40), { col: '#c86bff', rise: 30, life: 0.4, size: 2, add: true }); }
      else { e.anim = d.atk; e.fr = 0; }
      if (e.st >= d.wind) { e.state = 'atk'; e.st = 0; e.hitDone = false; e.anim = d.atk; e.animT = 0; if (d.atk !== 'shoot' && d.atk !== 'spellcast') sfx(d.heavy ? 'heavy' : 'swing'); }
      break;
    }
    case 'atk': {
      const at = ANIM_T[d.atk]; const dur = at.dur * (d.heavy ? 1.2 : 1); e.st += dt;
      const n = CHARS.anims[d.atk][0];
      if (d.atk === 'shoot') e.fr = Math.min(12, 8 + Math.floor(e.st / (dur * 0.4) * 5));
      else if (d.atk === 'spellcast') e.fr = Math.min(6, 3 + Math.floor(e.st / dur * 4));
      else e.fr = Math.min(n - 1, Math.floor(e.st / dur * n));
      if (!e.hitDone && (d.atk === 'shoot' ? e.fr >= 9 : d.atk === 'spellcast' ? e.fr >= 5 : e.fr >= at.hit)) {
        e.hitDone = true;
        if (d.atk === 'shoot') {
          const lead = 0.25; const tx = P.x + (P.x - (P.px || P.x)) * lead * 60, ty = P.y + (P.y - (P.py || P.y)) * lead * 60;
          const a = Math.atan2(ty - 14 - (e.y - 18), tx - e.x);
          spawnProj({ kind: 'arrow', x: e.x, y: e.y - 18, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, dmg: d.dmg, from: 'e', life: 1.4, r: 5, src: e }); sfx('arrow');
        } else if (d.atk === 'spellcast') {
          if (Math.random() < 0.5) {
            const a = Math.atan2(P.y - e.y, P.x - e.x);
            for (let k = -1; k <= 1; k++) spawnProj({ kind: 'orb', x: e.x, y: e.y - 24, vx: Math.cos(a + k * 0.25) * 130, vy: Math.sin(a + k * 0.25) * 130, dmg: d.dmg * 0.8, from: 'e', life: 2, r: 6, col: '170,90,255', src: e, el: 'ombre' });
            sfx('cast');
          } else { G.zones2.push({ x: P.x, y: P.y, r: 30, t: 0, delay: 0.85, dmg: d.dmg * 1.4, fx: 'snakebite', col: '170,90,255', src: e, el: 'ombre' }); sfx('cast'); }
        } else {
          const reach = d.range + 10;
          const ex = e.x + Math.cos(e.atkA) * 8, ey = e.y - 12 + Math.sin(e.atkA) * 8;
          const dd = dist(ex, ey, P.x, P.y - 12); const a = Math.atan2(P.y - 12 - ey, P.x - ex);
          const da = Math.abs(((a - e.atkA + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (dd < reach && (da < 1.1 || dd < 16)) hurtPlayer(P, d.dmg, e.x, e.y, e, d.el);
          if (d.heavy) { shake(2); burst(e.x + Math.cos(e.atkA) * 24, e.y + Math.sin(e.atkA) * 14, 6, ['#bba', '#887']); }
        }
      }
      if (e.st >= dur) { e.state = 'recover'; e.st = 0; e.cd = d.cd * rnd(0.85, 1.2); }
      break;
    }
    case 'recover': {
      e.st += dt; e.anim = 'walk'; e.fr = 0;
      if (e.st > (d.heavy ? 0.45 : 0.25)) e.state = 'chase';
      break;
    }
  }
}
// ----------------- boss -----------------
function updateBoss(e, dt, dP, aP) {
  const d = e.def, P = G.player;
  if (e.aggro && dist(e.x, e.y, e.home.x, e.home.y) > 420) { // laisse : le boss retourne dans sa clairière
    e.aggro = false; e.hp = e.maxhp; e.phase = 1; e.state = 'idle'; e.x = e.home.x; e.y = e.home.y; G.boss = null; toast((d.short || 'Grakhul') + ' retourne dans son repaire', '#ffb36b'); return;
  }
  if (!e.aggro) { e.anim = 'walk'; e.fr = 0; return; }
  const hpk = e.hp / e.maxhp;
  if (e.phase === 1 && hpk < 0.6) { e.phase = 2; e.state = 'roar'; e.st = 0; sfx('roar'); shake(8); flashScreen('#ff5a3a', 0.35); toast((d.short || 'Grakhul') + ' entre en rage !', '#ff8a5a'); }
  if (e.phase === 2 && hpk < 0.28) { e.phase = 3; e.state = 'roar'; e.st = 0; sfx('roar'); shake(10); flashScreen('#ff2a1a', 0.45); toast((d.short || 'Grakhul') + ' est furieux !', '#ff5a3a'); }
  const rage = e.phase === 3 ? 1.3 : e.phase === 2 ? 1.12 : 1;
  if (e.phase >= 2 && Math.random() < 0.5) part(e.x + rnd(-12, 12), e.y - rnd(0, 40), { col: e.phase === 3 ? '#ff3a2a' : '#ff8a3a', rise: 40, life: 0.5, size: 2, add: true });
  e.summonT -= dt; e.slamT -= dt; e.chargeT -= dt;
  const animate = (an, rate) => { if (e.anim !== an) { e.anim = an; e.animT = 0; } e.animT += dt * rate; };
  switch (e.state) {
    case 'roar': {
      e.st += dt; e.anim = 'walk'; e.fr = 0; e.flash = Math.sin(e.st * 30) > 0 ? 0.03 : 0;
      if (e.st > 1.0) {
        e.state = 'chase';
        const n = e.phase === 3 ? 1 : 2;
        for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; const mn = d.minion; const k = mn ? mn[e.phase === 3 ? 1 : 0] : (e.phase === 3 ? 'orc_warrior' : 'goblin_rogue'); const m = spawnEnemy(k, e.x + Math.cos(a) * 50, e.y + Math.sin(a) * 40, null); m.aggro = true; fxAt('explosion', m.x, m.y - 16, { fps: 24, layer: 1, scale: 0.8 }); }
      }
      break;
    }
    case 'idle': case 'chase': {
      e.state = 'chase';
      if (e.phase >= 2 && e.slamT <= 0 && dP < 180) { e.state = 'slamw'; e.st = 0; e.slamT = e.phase === 3 ? 5 : 7.5; e.slamX = P.x; e.slamY = P.y; G.zones2.push({ x: e.x, y: e.y, r: 100, t: 0, delay: 0.9, dmg: 0, telegraph: 1, col: '255,80,40' }); sfx('roar'); break; }
      if (e.chargeT <= 0 && dP > 80 && dP < 220) { e.state = 'cwind'; e.st = 0; e.atkA = aP; e.chargeT = 6 / rage; break; }
      if (dP < d.range + 10 && e.cd <= 0) { e.state = 'wind'; e.st = 0; e.atkA = aP; e.dir = dirOf(Math.cos(aP), Math.sin(aP)); e.atk = Math.random() < 0.5 ? 'slash' : 'thrust'; break; }
      if (dP > d.range - 8) { enemyMove(e, aP, d.spd * rage, dt); animate('walk', 9); e.fr = 1 + Math.floor(e.animT) % 8; } else { e.anim = 'walk'; e.fr = 0; }
      e.dir = dirOf(Math.cos(aP), Math.sin(aP));
      break;
    }
    case 'wind': {
      e.st += dt; e.anim = e.atk; e.fr = 0; e.atkA = aP; e.dir = dirOf(Math.cos(aP), Math.sin(aP));
      if (e.st > 0.45 / rage) { e.state = 'atk'; e.st = 0; e.hitDone = false; sfx('heavy'); }
      break;
    }
    case 'atk': {
      const at = ANIM_T[e.atk]; const dur = at.dur * 1.25 / rage; e.st += dt; const n = CHARS.anims[e.atk][0];
      e.fr = Math.min(n - 1, Math.floor(e.st / dur * n));
      if (!e.hitDone && e.fr >= at.hit) {
        e.hitDone = true; shake(3);
        const reach = e.atk === 'thrust' ? 96 : 82;
        const dd = dist(e.x, e.y - 20, P.x, P.y - 12); const a = Math.atan2(P.y - e.y, P.x - e.x);
        const da = Math.abs(((a - e.atkA + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (dd < reach && (da < (e.atk === 'thrust' ? 0.6 : 1.4) || dd < 18)) hurtPlayer(P, d.dmg * rage, e.x, e.y, e);
        burst(e.x + Math.cos(e.atkA) * 56, e.y + Math.sin(e.atkA) * 32, 12, ['#cba', '#998']); ring(e.x + Math.cos(e.atkA) * 50, e.y + Math.sin(e.atkA) * 30, 30, '#ffcf9a', 0.3);
      }
      if (e.st >= dur) { e.state = 'recover'; e.st = 0; e.cd = d.cd / rage; e.combo = (e.combo || 0) + 1; if (e.combo % 2 === 1 && e.phase >= 2) { e.state = 'wind'; e.st = 0.2; e.atk = e.atk === 'slash' ? 'thrust' : 'slash'; } }
      break;
    }
    case 'recover': { e.st += dt; e.anim = 'walk'; e.fr = 0; if (e.st > 0.35 / rage) e.state = 'chase'; break; }
    case 'cwind': { e.st += dt; e.anim = 'walk'; e.fr = 0; e.flash = Math.sin(e.st * 40) > 0 ? 0.03 : 0; e.atkA = aP; e.dir = dirOf(Math.cos(aP), Math.sin(aP)); if (e.st > 0.55) { e.state = 'charging'; e.st = 0; sfx('roar'); } break; }
    case 'charging': {
      e.st += dt; enemyMove(e, e.atkA, 300 * rage, dt); animate('walk', 20); e.fr = 1 + Math.floor(e.animT) % 8;
      if (Math.random() < 0.8) part(e.x, e.y, { col: 'rgba(170,150,120,0.6)', size: 3, life: 0.4 });
      if (dP < 40 && !e.chHit) { e.chHit = true; hurtPlayer(P, d.dmg * 1.4, e.x, e.y, e); }
      if (e.st > 0.5) { e.state = 'recover'; e.st = 0; e.chHit = false; shake(4); }
      break;
    }
    case 'slamw': {
      e.st += dt; e.anim = 'slash'; e.fr = Math.min(2, Math.floor(e.st * 4));
      if (e.st > 0.9) {
        e.state = 'recover'; e.st = -0.4; sfx('boom'); shake(9); flashScreen('#ffb07a', 0.3);
        fxAt('quake', e.x, e.y - 6, { fps: 22, scale: 1.8, layer: -1 });
        if (dist(e.x, e.y, P.x, P.y) < 104) hurtPlayer(P, d.dmg * 1.3 * rage, e.x, e.y, null, 'terre');
        const a0 = Math.atan2(P.y - e.y, P.x - e.x);
        for (let l = -1; l <= 1; l++) for (let i = 1; i <= 6; i++) {
          const a = a0 + l * 0.5, x = e.x + Math.cos(a) * i * 34, y = e.y + Math.sin(a) * i * 26;
          later(() => {
            fxAt('rockspikes', x, y - 20, { fps: 26, k0: 0, layer: 0 }); sfx('step');
            if (dist(x, y, G.player.x, G.player.y) < 22) hurtPlayer(G.player, d.dmg * rage, x, y, null, 'terre');
          }, i * 70);
        }
      }
      break;
    }
  }
}

// ===================== projectiles & zones =====================
function spawnProj(p) { p.t = 0; p.hit = new Set(); G.projs.push(p); return p; }
function updateProjs(dt) {
  const P = G.player;
  for (const p of G.projs) {
    if (p.homing && !p.homing.dead) { const a = Math.atan2(p.homing.y - 12 - p.y, p.homing.x - p.x), sp = Math.hypot(p.vx, p.vy); const ca = Math.atan2(p.vy, p.vx); let da = ((a - ca + Math.PI * 3) % (Math.PI * 2)) - Math.PI; const na = ca + clamp(da, -4 * dt, 4 * dt); p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp; }
    p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.light) addLight(p.x, p.y, 70, p.light, 0.9);
    if (p.kind === 'orb' || p.kind === 'bolt' || p.kind === 'star') { if (Math.random() < 0.7) part(p.x, p.y, { col: 'rgb(' + p.col + ')', life: 0.3, size: 2, add: true }); addLight(p.x, p.y + 10, 40, p.col, 0.7); }
    if (p.kind === 'firelion' && Math.random() < 0.8) part(p.x + rnd(-14, 14), p.y + rnd(-6, 16), { col: choice(['#ff7a1a', '#ffce4a', '#ff3a1a']), rise: 30, life: 0.5, size: 2, add: true });
    if (p.kind !== 'firelion' && isSolidTile(Math.floor(p.x / TILE), Math.floor((p.y + 14) / TILE)) && p.kind !== 'orb') { }
    if (p.kind === 'arrow' || p.kind === 'bolt' || p.kind === 'orb') {
      for (const b of boxesNear(p.x - 2, p.y + 10, 4, 4)) if (b.h > 14 && p.x > b.x && p.x < b.x + b.w && p.y + 12 > b.y && p.y + 12 < b.y + b.h) { p.t = 99; burst(p.x, p.y, 3, '#cba'); }
    }
    if (p.from === 'p') {
      if (p.fall && p.y < p.fall - 12) continue;
      for (const e of G.enemies) {
        if (e.dead || p.hit.has(e)) continue;
        if (dist(p.x, p.y, e.x, e.y - (e.def.fly ? e.z + 8 : 12 * (e.def.scale || 1))) < p.r + e.def.r * 0.7) {
          p.hit.add(e);
          strikeEnemy(P, e, p.mult || 1, { el: p.el, magic: p.magic, kb: p.kb || (p.kind === 'firelion' ? 160 : 90), heavy: p.heavy, charged: p.charged, noXp: !!p.magic });
          if (p.burn) e.burn = p.burn;
          if (p.onHit) p.onHit(e);
          if (!p.pierce) { p.t = 99; break; }
        }
      }
      if (p.fall && p.y >= p.fall) { p.t = 99; burst(p.x, p.y, 3, p.kind === 'star' ? '#c8bfff' : '#cba'); }
    } else if (P.state !== 'dead' && dist(p.x, p.y, P.x, P.y - 14) < p.r + 8) {
      if (G.sacred && G.sacred.t > 0 && dist(p.x, p.y, G.sacred.x, G.sacred.y) < 70) { p.t = 99; sparks(p.x, p.y, 0, 4, '#ffe9a0'); } else { hurtPlayer(P, p.dmg, p.x - p.vx * 0.1, p.y - p.vy * 0.1, p.src, p.el); p.t = 99; }
    }
  }
  G.projs = G.projs.filter(p => p.t < p.life);
  // zones différées (sorts au sol)
  for (const z of G.zones2) {
    z.t += dt;
    if (!z.done && z.t >= z.delay) {
      z.done = true;
      if (z.fx) { fxAt(z.fx, z.x, z.y - 30, { fps: 26, layer: 0 }); }
      if (z.dmg && dist(z.x, z.y, P.x, P.y) < z.r + 6) hurtPlayer(P, z.dmg, z.x, z.y, null, z.el);
    }
  }
  G.zones2 = G.zones2.filter(z => z.t < z.delay + 0.3);
}
function drawProj(ctx, p, cx, cy) {
  const x = Math.round(p.x - cx), y = Math.round(p.y - cy);
  if (p.kind === 'arrow') {
    const a = Math.atan2(p.vy, p.vx); ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-9, -1, 14, 2); ctx.fillStyle = '#d8d8e0'; ctx.fillRect(5, -2, 4, 4); ctx.fillStyle = '#e8e2d0'; ctx.fillRect(-11, -2, 3, 1); ctx.fillRect(-11, 1, 3, 1);
    ctx.restore();
  } else if (p.kind === 'firelion') {
    const k = 4 + (Math.floor(p.t * 18) % 8);
    drawFx(ctx, p.fxKey, k, x, y - 10, 1, 1);
  } else {
    const R = p.big ? 18 : 12; const s = glowSprite(p.col, 16); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(s, x - R, y - R, R * 2, R * 2);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 1, 3, 3);
  }
}

// ===================== butin =====================
function updateDrops(dt) {
  const P = G.player;
  for (const d of G.drops) {
    d.t += dt;
    if (d.z > 0 || d.vz > 0) { d.vz -= 300 * dt; d.z += d.vz * dt; if (d.z <= 0) { d.z = 0; d.vz = d.vz < -40 ? -d.vz * 0.4 : 0; } d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= 0.96; d.vy *= 0.96; }
    const dd = dist(d.x, d.y, P.x, P.y);
    if (d.t > 0.4 && P.state !== 'dead') {
      if (dd < (d.kind === 'gold' ? 70 : 36)) { const a = Math.atan2(P.y - d.y, P.x - d.x); const sp = 140 + (70 - dd) * 4; d.x += Math.cos(a) * sp * dt; d.y += Math.sin(a) * sp * dt; }
      if (dd < 12) { if (collect(d)) d.got = true; else { d.t = -1.5; d.vx = rnd(-40, 40); d.vy = rnd(-40, 40); d.vz = 60; } }
    }
  }
  G.drops = G.drops.filter(d => !d.got);
}
function collect(d) {
  const P = G.player;
  if (d.kind === 'gold') { P.gold += d.n; sfx('gold'); num(P.x, P.y - 46, '+' + d.n + ' or', '#ffd23f'); return true; }
  if (d.kind === 'recipe') { learnRecipe(P, d.rid); return true; }
  if (!canReceive(P, [[d.id, d.n || 1]])) { if (!d.warnT || G.t - d.warnT > 2.5) { d.warnT = G.t; toast('Inventaire plein : ' + REG[d.id].name + ' reste au sol', '#ffb36b'); } return false; }
  giveItem(P, d.id, d.n || 1, 'Butin'); sfx('pick'); const it = REG[d.id];
  toast('Obtenu : ' + it.name + ((d.n || 1) > 1 ? ' ×' + d.n : ''), RARITY[it.rarity || 1].c);
  if (it.rarity >= 4) { flashScreen(RARITY[it.rarity].c, 0.2); sfx('open'); }
  questEvent('item', d.id); return true;
}
function drawDrop(ctx, d, cx, cy) {
  const x = Math.round(d.x - cx), y = Math.round(d.y - cy - d.z - Math.sin(d.t * 5) * 1.5);
  drawShadow(ctx, d.x - cx, d.y - cy, 5, 0.25);
  if (d.kind === 'gold') { ctx.fillStyle = '#7a5410'; ctx.fillRect(x - 3, y - 6, 6, 6); ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 2, y - 6, 4, 5); ctx.fillStyle = '#fff6b0'; ctx.fillRect(x - 1, y - 5, 1, 2); return; }
  const it = d.kind === 'recipe' ? { icon: 'Scroll0001', rarity: 3 } : REG[d.id];
  if (it.rarity >= 2) { const c = RARITY[it.rarity].c; const s = glowSprite(hexToRgbStr(c), 16); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = it.rarity >= 4 ? 0.9 : 0.5; ctx.drawImage(s, x - 14, y - 22, 28, 28); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  if (it.rarity >= 5 && Math.random() < 0.3) part(d.x + rnd(-6, 6), d.y - 10, { col: RARITY[it.rarity].c, rise: 30, life: 0.6, size: 1, add: true });
  drawIcon(ctx, it.icon, x - 8, y - 17, 0.5);
}
function hexToRgbStr(h) { const v = hexRGB(h); return v.join(','); }
