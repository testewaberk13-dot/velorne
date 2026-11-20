'use strict';
// =====================================================================
//  BOÎTE À OUTILS DES MAGIES (grimoire des 27 familles)
//  Primitives de dessin pixel-art, archétypes de mécaniques (projectile, zone,
//  vague, rayon, pluie, dash, aura, invocation, chaîne, cône), états
//  supplémentaires, sons et icônes. Chaque famille (magic_fam_*.js) décrit
//  ses 10 compétences avec ces briques + ses propres dessins.
// =====================================================================
const PALS = {
  eau: ['#06264d', '#0f5fa8', '#2ba3e6', '#92e2ff', '#effcff'], glace: ['#1b3d6b', '#4e8fd0', '#9fe3ff', '#d9f6ff', '#ffffff'],
  foudre: ['#3a2a8a', '#8a5cf6', '#ffe066', '#fff7b0', '#ffffff'], vent: ['#2a5a52', '#5fb8a6', '#c8f7e8', '#e8fff8', '#ffffff'],
  terre: ['#2e2014', '#6b4a2a', '#a67c4a', '#d6b07a', '#f0dcb4'], nature: ['#0f3a1a', '#1f8a3a', '#4ade80', '#b6f5a8', '#f2ffe0'],
  metal: ['#2a2f38', '#6a7482', '#c0c8d4', '#e8edf4', '#ffffff'], lave: ['#2a0a06', '#8a2008', '#ff5a1f', '#ffb43a', '#fff3b0'],
  ombre: ['#0d0620', '#3b1a7a', '#8b5cf6', '#c4a8ff', '#f0e8ff'], sang: ['#2a0309', '#7a0f1c', '#d7263d', '#ff7a8a', '#ffe0e4'],
  poison: ['#0f2a0a', '#2f7a22', '#7ee06b', '#c8ff9a', '#f4ffe0'], neant: ['#050208', '#2a0a5a', '#6d28d9', '#a78bfa', '#ede9fe'],
  ames: ['#1a1440', '#5a4aa8', '#c4b5fd', '#e4dcff', '#ffffff'], malediction: ['#2a0a30', '#7a1a8a', '#c026d3', '#f09aff', '#fde8ff'],
  necromancie: ['#142008', '#4a6a12', '#a3e635', '#dcff8a', '#f6ffd8'], chaos: ['#2a0612', '#8a1a3a', '#f43f5e', '#ff9ab0', '#fff0f4'],
  demoniaque: ['#2a0505', '#8a0f0f', '#dc2626', '#ff7a4a', '#ffd9a0'], lumiere: ['#8a6a1a', '#e0b84a', '#fff3b0', '#fffbe0', '#ffffff'],
  temps: ['#4a2a6a', '#a76ac6', '#f5d0fe', '#fbe8ff', '#ffffff'], gravite: ['#1a1f2a', '#4a5568', '#94a3b8', '#cbd5e1', '#f1f5f9'],
  espace: ['#1a1a5a', '#4a4ac6', '#a5b4fc', '#d8deff', '#ffffff'], astrale: ['#10143a', '#3a4aa8', '#c7d2fe', '#fff3b0', '#ffffff'],
  cristal: ['#0a3a4a', '#1a8aa8', '#67e8f9', '#b8f6ff', '#ffffff'], son: ['#6a4a0a', '#c6962a', '#fde68a', '#fff4c0', '#ffffff'],
  illusion: ['#4a1a5a', '#a84ac6', '#f0abfc', '#fbd8ff', '#ffffff'], runes: ['#0a2a4a', '#2a7ac6', '#7dd3fc', '#c0ecff', '#ffffff'],
};
const lv = (p, v) => p[Math.max(0, Math.min(4, Math.floor(v * 5)))];
const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
const wrapA = (d) => ((d + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
// ---------- primitives de dessin ----------
function blobP(ctx, x, y, r, p, t, seed, heat) {
  const s = 2, n = Math.ceil(r / s) + 2; heat = heat === undefined ? 1 : heat;
  for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
    const dx = i * s, dy = j * s, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const rr = r * (0.82 + 0.18 * Math.sin(a * 3 + t * 9 + seed) + 0.1 * Math.sin(a * 5 - t * 13 + seed * 2)); if (d > rr) continue;
    ctx.fillStyle = lv(p, (0.15 + 0.85 * Math.pow(1 - d / rr, 1.1)) * heat); ctx.fillRect(Math.round(x + dx - 1), Math.round(y + dy - 1), s, s);
  }
}
function ribbon(ctx, pts, p, w) {
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; pxLine(ctx, a[0], a[1], b[0], b[1], p[1], w + 2); pxLine(ctx, a[0], a[1], b[0], b[1], p[2], w); if (w > 2) pxLine(ctx, a[0], a[1], b[0], b[1], p[3], Math.max(1, w - 2)); }
}
function shardP(ctx, x, y, L, W, ang, p) {
  const c = Math.cos(ang), s = Math.sin(ang), q = (u, v) => [x + c * u - s * v, y + s * u + c * v];
  const A = q(L, 0), B = q(0, W), C = q(-L * 0.35, 0), D = q(0, -W);
  ctx.fillStyle = p[1]; ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...B); ctx.lineTo(...C); ctx.lineTo(...D); ctx.closePath(); ctx.fill();
  ctx.fillStyle = p[2]; ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...q(0, W * 0.2)); ctx.lineTo(...q(-L * 0.3, 0)); ctx.lineTo(...q(0, -W * 0.7)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = p[4]; ctx.beginPath(); ctx.moveTo(...q(L * 0.85, 0)); ctx.lineTo(...q(L * 0.2, W * 0.15)); ctx.lineTo(...q(L * 0.1, -W * 0.05)); ctx.closePath(); ctx.fill();
}
function zigP(ctx, x0, y0, x1, y1, p, seed, w, n) {
  n = n || 7; const d = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / (d || 1), ny = (x1 - x0) / (d || 1); let px_ = x0, py_ = y0;
  for (let i = 1; i <= n; i++) { const u = i / n, o = i === n ? 0 : Math.sin(seed * 7.3 + i * 12.9) * d * 0.09, x = x0 + (x1 - x0) * u + nx * o, y = y0 + (y1 - y0) * u + ny * o; pxLine(ctx, px_, py_, x, y, p[1], (w || 3) + 2); pxLine(ctx, px_, py_, x, y, p[3], w || 3); pxLine(ctx, px_, py_, x, y, p[4], Math.max(1, (w || 3) - 2)); px_ = x; py_ = y; }
}
function ringP(ctx, x, y, rx, ry, p, t, w, dash) {
  const n = Math.max(12, Math.floor(rx / 2)); for (let i = 0; i < n; i++) { if (dash && ((i + Math.floor(t * 6)) % dash) < dash / 2) continue; const a = i / n * 6.2832 + t; ctx.fillStyle = i % 3 ? p[2] : p[3]; ctx.fillRect(Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * ry), w || 2, w || 2); }
}
function pillarP(ctx, x, y, h, w, p, t, cap) {
  for (let k = 0; k < h; k += 2) { const u = k / h, hw = w * (0.8 + 0.2 * Math.sin(t * 8 + u * 9)) * (1 - (cap ? 0 : u * 0.25)); ctx.fillStyle = lv(p, 0.25 + 0.3 * Math.sin(t * 6 + u * 14 + 1) * 0.5 + 0.3 + 0.2 * (1 - u)); ctx.fillRect(Math.round(x - hw), Math.round(y - k), Math.round(hw * 2), 2); ctx.fillStyle = p[3]; ctx.fillRect(Math.round(x - hw * 0.4 + Math.sin(t * 7 + u * 8) * hw * 0.3), Math.round(y - k), Math.max(1, Math.round(hw * 0.5)), 2); }
}
function glyphRing(ctx, x, y, r, p, t, n) {
  ringP(ctx, x, y, r, r * 0.55, p, t, 2); ringP(ctx, x, y, r * 0.7, r * 0.39, p, -t * 1.3, 2, 2);
  n = n || 6; for (let i = 0; i < n; i++) { const a = i / n * 6.2832 + t * 0.5; ctx.fillStyle = p[3]; ctx.fillRect(Math.round(x + Math.cos(a) * r * 0.85) - 1, Math.round(y + Math.sin(a) * r * 0.47) - 2, 3, 5); }
}
function spiralP(ctx, x, y, r0, r1, turns, p, t, w, flat) {
  let px_ = null, py_ = null; const n = 40; for (let i = 0; i <= n; i++) { const u = i / n, a = u * turns * 6.2832 + t, r = r0 + (r1 - r0) * u, xx = x + Math.cos(a) * r, yy = y + Math.sin(a) * r * (flat || 0.55); if (px_ !== null) { pxLine(ctx, px_, py_, xx, yy, u > 0.5 ? p[2] : p[1], w || 3); pxLine(ctx, px_, py_, xx, yy, p[3], Math.max(1, (w || 3) - 2)); } px_ = xx; py_ = yy; }
}
function eye(ctx, x, y, s, p, look) {
  ctx.fillStyle = p[0]; ctx.fillRect(x - s, y - s * 0.5, s * 2, s); ctx.fillStyle = p[4]; ctx.fillRect(x - s + 1, y - s * 0.5 + 1, s * 2 - 2, Math.max(1, s - 2)); ctx.fillStyle = p[2]; ctx.fillRect(x - s * 0.4 + (look || 0), y - s * 0.4, s * 0.8, s * 0.8); ctx.fillStyle = p[0]; ctx.fillRect(x - 1 + (look || 0), y - 1, 2, 2);
}
const cap01 = (v) => Math.max(0, Math.min(1, v));
// ---------- utilitaires mécaniques ----------
const near = (x, y, r) => G.enemies.filter(e => inCircle(e, x, y, r));
function pushE(e, x, y, f) { const a = Math.atan2(e.y - y, e.x - x), k = e.def.boss ? 0.3 : (e.def.heavy ? 0.6 : 1); e.kbx += Math.cos(a) * f * k; e.kby += Math.sin(a) * f * k; }
function hitE(P, e, m, E, st, o) {
  if (e.dead) return; innateHit(P, e, m, { st, kb: (o && o.kb !== undefined) ? o.kb : 60 }, E.fam, o); magicXp(P, E.fam, 0.5);
  if (o && o.fx) xstat(P, e, o.fx, E.fam, o.fxT);
}
function aoeE(P, x, y, r, m, E, st, o) { let n = 0; for (const e of near(x, y, r)) { hitE(P, e, m, E, st, o); n++; } return n; }
function posOf(P, E, o) { return o.where === 'self' ? { x: P.x, y: P.y } : o.where === 'fwd' ? { x: P.x + Math.cos(E.a) * (o.fwd || 70), y: P.y + Math.sin(E.a) * (o.fwd || 70) } : { x: E.tx, y: E.ty }; }
function dirSolid(x, y) { return isSolidTile(Math.floor(x / TILE), Math.floor(y / TILE)); }
// trace au sol générique (flaque, brûlure, givre, sang…)
function decal(x, y, rx, ry, life, col, a, col2) {
  const seed = rnd(0, 9); return mfx({ life, x, y, cheap: true, passes: ['ground'], upd() { }, draw(o, ctx, cx, cy) { const k = o.t / o.life, al = Math.min(1, (1 - k) * 2) * (a || 0.5); ctx.globalAlpha = al; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x - cx, y - cy, rx, ry, 0, 0, 7); ctx.fill(); if (col2) { ctx.globalAlpha = al * 0.7; ctx.fillStyle = col2; ctx.beginPath(); ctx.ellipse(x - cx + Math.sin(seed) * 2, y - cy, rx * 0.6, ry * 0.55, 0, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; } });
}
// ---------- états supplémentaires des ennemis / buffs du joueur ----------
// e.xs = { nom: { t, tk, v } } : bleed, decay (DoT), fear, blind, confuse, vuln, sleep, weak
function xstat(P, e, name, fam, dur) {
  if (!name || e.dead) return; const D = { bleed: 4, decay: 4, fear: 2.2, blind: 3, confuse: 2.5, vuln: 5, sleep: 2.2, weak: 5 }[name]; if (!D) return;
  const k = e.def.boss ? 0.5 : 1; e.xs = e.xs || {}; const cur = e.xs[name]; e.xs[name] = { t: Math.max(cur ? cur.t : 0, (dur || D) * k), tk: 0, fam: fam || 'ombre', v: 1 };
}
function xsTick(dt) {
  const P = G.player;
  for (const e of G.enemies) {
    if (e.dead || !e.xs) continue; const col = PALS[e.xs.bleed ? 'sang' : 'poison'];
    for (const k in e.xs) {
      const s = e.xs[k]; s.t -= dt; if (s.t <= 0) { delete e.xs[k]; continue; }
      if (k === 'bleed' || k === 'decay') { s.tk -= dt; if (s.tk <= 0) { s.tk = 0.5; damageEnemy(e, 3 + P.st8.mag * 0.14, false, 0, 0, 0, 0, k === 'bleed' ? 'physique' : 'poison'); part(e.x + rnd(-5, 5), e.y - rnd(6, 24), { col: k === 'bleed' ? '#d7263d' : '#a3e635', life: 0.5, size: 2, vy: 30, g: 120 }); } }
      else if (k === 'fear') { const a = Math.atan2(e.y - P.y, e.x - P.x); e.kbx += Math.cos(a) * 180 * dt * (e.def.boss ? 0.2 : 1); e.kby += Math.sin(a) * 180 * dt * (e.def.boss ? 0.2 : 1); e.cd = Math.max(e.cd, 0.3); if (Math.random() < 0.2) part(e.x, e.y - 32, { col: '#c4a8ff', life: 0.4, size: 2, rise: 20 }); }
      else if (k === 'blind' || k === 'confuse') { e.aggro = false; s.tk -= dt; if (s.tk <= 0) { s.tk = 0.35; const a = rnd(0, 6.28); e.kbx += Math.cos(a) * 90; e.kby += Math.sin(a) * 90; } if (Math.random() < 0.15) part(e.x + rnd(-6, 6), e.y - 30, { col: '#f0abfc', life: 0.4, size: 2, rise: 15 }); }
      else if (k === 'sleep') { e.rootT = Math.max(e.rootT || 0, 0.2); e.cd = Math.max(e.cd, 0.3); if (Math.random() < 0.08) part(e.x + 8, e.y - 34, { col: '#e4dcff', life: 0.8, size: 2, rise: 22 }); }
      else if (k === 'weak') { e.cd = Math.max(e.cd, 0.1); }
    }
  }
}
// buffs génériques du joueur : P.gb[nom] = { t, atk, mag, def, spd, dr, ls, reflect, absorb }
function gbuff(P, name, dur, o) { P.gb = P.gb || {}; P.gb[name] = Object.assign({ t: G.t + dur }, o || {}); if (o && o.absorb) P.gsh = (P.gsh || 0) + o.absorb; P.dirty = true; }
function gbOn(P, name) { return P.gb && P.gb[name] && P.gb[name].t > G.t; }
function gbufStats(P, S, now) {
  if (!P.gb) return; for (const k in P.gb) { const b = P.gb[k]; if (b.t <= now) continue; if (b.atk) S.atk *= 1 + b.atk; if (b.mag) S.mag *= 1 + b.mag; if (b.def) { S.defP *= 1 + b.def; S.defM *= 1 + b.def; } if (b.spd) S.spd *= 1 + b.spd; if (b.poise) S.poise = true; if (b.regen) S.regenMp *= 1 + b.regen; if (b.crit) S.crit += b.crit; }
}
function gbufHurt(P, dmg, src) {
  if (!P.gb) return dmg; for (const k in P.gb) { const b = P.gb[k]; if (b.t <= G.t) continue; if (b.dr) dmg *= 1 - b.dr; if (b.reflect && src && src.def && !src.dead) { strikeEnemy(P, src, b.reflect, { magic: true, noXp: true, kb: 60, noProc: true }); } if (b.dodge && Math.random() < b.dodge) { num(P.x, P.y - 44, 'Esquive', '#cfe', true); return 0; } }
  if (P.gsh > 0) { const a = Math.min(P.gsh, dmg); P.gsh -= a; dmg -= a; num(P.x, P.y - 50, 'Absorbé', '#bfe6ff'); } return dmg;
}
function gbufOnHit(P, e) { if (!P.gb) return; for (const k in P.gb) { const b = P.gb[k]; if (b.t <= G.t || !b.ls) continue; P.hp = Math.min(P.st8.maxhp, P.hp + Math.max(1, P.st8.atk * 0.25 * b.ls)); } }
function gbufUpdate(dt) { const P = G.player; if (!P || !P.gb) return; for (const k in P.gb) { const b = P.gb[k]; if (b.t <= G.t) { if (b.onEnd) { try { b.onEnd(P); } catch (er) { } } delete P.gb[k]; P.dirty = true; } else if (b.hot) { P.hp = Math.min(P.st8.maxhp, P.hp + b.hot * dt); } } if (P.gsh > 0 && !Object.values(P.gb).some(b => b.t > G.t && b.absorb)) P.gsh = 0; }
// ---------- sons par famille ----------
const SND = {
  eau: ['bp', 320, 560, 'sine'], glace: ['cr', 1400, 2400, 'triangle'], foudre: ['zp', 900, 200, 'sawtooth'], vent: ['ws', 400, 900, 'sine'], terre: ['rm', 120, 50, 'sawtooth'], nature: ['rs', 500, 800, 'triangle'],
  metal: ['cl', 900, 1500, 'square'], lave: ['rm', 140, 60, 'sawtooth'], ombre: ['dk', 200, 90, 'sine'], sang: ['wt', 180, 90, 'sawtooth'], poison: ['bp', 260, 420, 'triangle'], neant: ['dk', 110, 40, 'sine'],
  ames: ['gh', 700, 1100, 'sine'], malediction: ['dk', 260, 140, 'sawtooth'], necromancie: ['dk', 150, 70, 'sawtooth'], chaos: ['zp', 700, 120, 'square'], demoniaque: ['rm', 160, 70, 'sawtooth'],
  lumiere: ['ch', 900, 1800, 'sine'], temps: ['ch', 500, 250, 'sine'], gravite: ['dk', 90, 40, 'sine'], espace: ['ws', 300, 1200, 'sine'], astrale: ['ch', 1200, 2200, 'sine'], cristal: ['cr', 1800, 2800, 'triangle'],
  son: ['ch', 440, 880, 'square'], illusion: ['gh', 600, 300, 'sine'], runes: ['ch', 600, 1000, 'triangle'],
};
for (const fam in SND) {
  const [ty, f0, f1, wv] = SND[fam], air = ['ws', 'bp', 'rs', 'wt', 'dk'].includes(ty), hard = ['rm', 'cl', 'zp', 'cr'].includes(ty);
  SFX[fam + '_c'] = () => { noise(.22, air ? .3 : .18, air ? 1100 : 2600, 0, 'bandpass'); tone(f0, f1, .26, wv, .07); if (!air) tone(f1, f1 * 1.5, .14, 'sine', .035, .08); };
  SFX[fam + '_i'] = () => { noise(.32, hard ? .5 : .32, hard ? 500 : 1400); tone(f1, Math.max(30, f0 * 0.4), .3, wv, .1); if (ty === 'ch' || ty === 'gh') tone(f1 * 1.5, f1 * 2, .5, 'sine', .05, .05); };
  SFX[fam + '_u'] = () => { noise(1.2, .5, 400); tone(f0 * 0.6, f1 * 1.5, 1.1, wv, .12); tone(f1 * 0.3, 30, .9, 'sawtooth', .2, .5); noise(.9, .6, 1800, .5, 'bandpass'); };
}
const PS = (E, a) => E.solid ? [...new Set(a.map(x => x === 'glow' ? 'top' : x))] : a;
// ---------- archétypes ----------
const K = {};
// projectile(s)
K.proj = (o0) => (P, E) => {
  const o = Object.assign({ spd: 260, life: 1.1, r: 10, mult: 1, kb: 90, n: 1, spread: 0.2, z: 12, wob: 0, wf: 9, homing: 0, pierce: 0, boom: 0, boomM: 0.6, trailN: 8, light: 60, stagger: 0, bounce: 0 }, o0); const p = PALS[E.fam];
  sfx(E.fam + '_c'); const mk = (i) => {
    const aa = E.a + (o.n > 1 ? (i - (o.n - 1) / 2) * o.spread : 0) + (o.rand ? rnd(-o.rand, o.rand) : 0); const hit = new Set(); let bn = o.bounce;
    const ox = P.x + Math.cos(aa) * 16, oy = P.y - 2 + Math.sin(aa) * 10;
    const fin = (m) => { if (m.dead) return; m.dead = true; if (o.boom) { sfx(E.fam + '_i'); shake(o.shake || 3); ring(m.x, m.y, o.boom, PALS[E.fam][3], 0.3, 3); aoeE(P, m.x, m.y, o.boom, E.base(o.boomM), E, o.st, { kb: o.boomKb || 100 }); } if (o.onEnd) o.onEnd(P, E, m); };
    mfx({ life: o.life, x: ox, y: oy, ang: aa, spd: o.spd, z: o.z, seed: rnd(0, 9), hist: [], passes: PS(E, o.passes || ['glow']), tgt: E.t,
      upd(m, dt) {
        if (o.accel) m.spd = Math.min(o.maxSpd || o.spd * 2.2, m.spd + o.accel * dt);
        if (o.homing) { let tg = null, bd = 170; for (const e of G.enemies) if (!e.dead) { const d = dist(m.x, m.y, e.x, e.y); if (d < bd) { bd = d; tg = e; } } if (tg) m.ang += clamp(wrapA(Math.atan2(tg.y - 8 - m.y, tg.x - m.x) - m.ang), -o.homing * dt, o.homing * dt); }
        if (o.wob) m.ang += Math.cos(m.t * o.wf + m.seed) * o.wob * dt;
        if (o.ret && m.t > o.life * 0.5) { m.ang += clamp(wrapA(Math.atan2(P.y - m.y, P.x - m.x) - m.ang), -6 * dt, 6 * dt); m.spd = o.spd * 1.1; }
        const nx = m.x + Math.cos(m.ang) * m.spd * dt, ny = m.y + Math.sin(m.ang) * m.spd * dt;
        if (dirSolid(nx, ny)) { if (bn > 0) { bn--; m.ang += Math.PI + rnd(-0.6, 0.6); hit.clear(); return; } fin(m); return; } m.x = nx; m.y = ny;
        m.hist.push([m.x, m.y]); if (m.hist.length > o.trailN) m.hist.shift(); addLight(m.x, m.y - m.z, o.light, rgbOf(p[2]), 0.9);
        if (o.tr && Math.random() < 0.8) part(m.x, m.y - m.z, { col: choice([p[2], p[3], p[1]]), life: 0.35, size: 2, add: true, vx: rnd(-14, 14), vy: rnd(-14, 14) });
        if (o.onTick) o.onTick(P, E, m, dt);
        for (const e of G.enemies) if (!e.dead && !hit.has(e) && inCircle(e, m.x, m.y, o.r)) { hit.add(e); hitE(P, e, E.base(o.mult), E, o.st, { kb: o.kb, fx: o.fx }); sparks(e.x, e.y - 14, m.ang, 6, p[3]); if (o.pull) pushE(e, m.x, m.y, -o.pull); if (o.onHit) o.onHit(P, e, E, m); if (!o.pierce) { fin(m); return; } else if (o.pierce > 0 && hit.size > o.pierce) { fin(m); return; } }
      },
      draw(m, ctx, cx, cy) { const x = m.x - cx, y = m.y - cy - m.z; if (o.draw) o.draw(ctx, x, y, m, p, cx, cy); else { glow(ctx, x, y, o.r * 2.2, rgbOf(p[2]), 0.4); blobP(ctx, x, y, o.r * 0.8, p, m.t, m.seed); } },
      onDead: fin });
  };
  for (let i = 0; i < o.n; i++) { if (o.stagger) later(() => mk(i), i * o.stagger * 1000); else mk(i); }
};
// zone (au sol, persistante ou ponctuelle)
K.zone = (o0) => (P, E) => {
  const o = Object.assign({ where: 't', r: 50, delay: 0.35, dur: 3, tick: 0.5, mult: 0.5, hitM: 0, kb: 0, passes: ['ground', 'glow'], light: 80 }, o0); const p = PALS[E.fam]; const pos = posOf(P, E, o);
  sfx(E.fam + '_c');
  mfx({ life: o.delay + o.dur, x: pos.x, y: pos.y, big: 1, passes: PS(E, o.passes), R: o.grow ? o.r * 0.5 : o.r, tk: 0,
    upd(z, dt) {
      if (o.follow) { z.x = P.x; z.y = P.y; } z.R = o.grow ? o.r * (0.55 + 0.45 * cap01((z.t - o.delay) / o.grow)) : o.r;
      if (z.t < o.delay) { if (o.light) addLight(z.x, z.y, o.light * 0.4, rgbOf(p[2]), 0.4); return; }
      if (!z.on) { z.on = true; sfx(E.fam + '_i'); if (o.shk) shake(o.shk); if (o.hitM) for (const e of near(z.x, z.y, z.R)) { hitE(P, e, E.base(o.hitM), E, o.st, { kb: o.kb, stun: o.stun, fx: o.fx }); if (o.kb) pushE(e, z.x, z.y, o.kb * 2); } if (o.flash) flashScreen(p[3], o.flash); if (o.onStart) o.onStart(P, E, z); }
      addLight(z.x, z.y, o.light + z.R * 0.4, rgbOf(p[2]), 0.8 * (z.t > o.delay + o.dur - 0.3 ? (o.delay + o.dur - z.t) / 0.3 : 1));
      z.tk -= dt; const inn = near(z.x, z.y, z.R);
      for (const e of inn) { if (o.pull) pushE(e, z.x, z.y, -o.pull * dt); if (o.repel) pushE(e, z.x, z.y, o.repel * dt); if (o.slow) e.slowT = Math.max(e.slowT || 0, 0.3); if (o.root) e.rootT = Math.max(e.rootT || 0, 0.25); if (o.fx && o.fxC) xstat(P, e, o.fx, E.fam, 0.4); if (o.fn) o.fn(P, e, dt, z); }
      if (z.tk <= 0 && (o.mult || o.onTick)) { z.tk = o.tick; if (o.mult) for (const e of inn) hitE(P, e, E.base(o.mult), E, o.st, { kb: o.tkb || 0, fx: o.fx }); if (o.onTick) o.onTick(P, E, z); }
      if (o.upd) o.upd(P, E, z, dt);
      if (!z.end && z.t > o.delay + o.dur - 0.06) { z.end = true; if (o.onEnd) o.onEnd(P, E, z); }
    },
    draw(z, ctx, cx, cy, pass) {
      const x = z.x - cx, y = z.y - cy, k = cap01((z.t - o.delay) / o.dur), pre = cap01(z.t / Math.max(0.01, o.delay)), fade = k > 0.85 ? (1 - k) / 0.15 : 1;
      if (!z.on && pass === 'ground' && o.delay > 0.05) { ctx.globalAlpha = 0.5 + 0.3 * Math.sin(z.t * 18); ctx.strokeStyle = p[3]; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, z.R, z.R * 0.55, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, z.R * (1 - pre), z.R * 0.55 * (1 - pre), 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      if (z.on || o.preDraw) o.draw(ctx, x, y, z, pass, p, { k, fade, on: z.on, R: z.R, age: z.t - o.delay });
    } });
};
// vague frontale qui avance
K.wave = (o0) => (P, E) => {
  const o = Object.assign({ spd: 210, len: 230, w: 52, mult: 1, kb: 150, thick: 22, life: 1.4 }, o0); const p = PALS[E.fam]; sfx(E.fam + '_c'); const a = E.a, hit = new Set(); const x0 = P.x + Math.cos(a) * 14, y0 = P.y + Math.sin(a) * 8;
  mfx({ life: o.life, x: x0, y: y0, big: 1, passes: PS(E, o.passes || ['ground', 'glow']), d: 0,
    upd(m, dt) {
      m.d += o.spd * dt; m.x = x0 + Math.cos(a) * m.d; m.y = y0 + Math.sin(a) * m.d; addLight(m.x, m.y - 10, 70, rgbOf(p[2]), 0.8);
      if (m.d > o.len || dirSolid(m.x, m.y)) { m.dead = true; if (o.onEnd) o.onEnd(P, E, m); return; }
      const c = Math.cos(a), s = Math.sin(a); for (const e of G.enemies) if (!e.dead) { const dx = e.x - m.x, dy = e.y - m.y, u = dx * c + dy * s, v = -dx * s + dy * c; if (Math.abs(v) < o.w && Math.abs(u) < o.thick) { if (!hit.has(e)) { hit.add(e); hitE(P, e, E.base(o.mult), E, o.st, { kb: 0, fx: o.fx }); sfx(E.fam + '_i'); } e.kbx += c * o.kb * 0.15; e.kby += s * o.kb * 0.15; } }
      if (o.upd) o.upd(P, E, m, dt);
    },
    draw(m, ctx, cx, cy, pass) { o.draw(ctx, m.x - cx, m.y - cy, m, pass, p, { a, w: o.w, d: m.d, len: o.len }); } });
};
// rayon continu
K.beam = (o0) => (P, E) => {
  const o = Object.assign({ len: 200, w: 10, dur: 0.7, tick: 0.12, mult: 0.35, kb: 0, track: 1, delay: 0.15 }, o0); const p = PALS[E.fam]; sfx(E.fam + '_u'); let tk = 0;
  mfx({ life: o.delay + o.dur, x: P.x, y: P.y, big: 1, passes: PS(E, ['glow']), a: E.a,
    upd(b, dt) {
      if (o.track) { const t2 = nearestEnemy(P.x, P.y, 260, 1.3, b.a); if (t2) b.a += clamp(wrapA(Math.atan2(t2.y - P.y, t2.x - P.x) - b.a), -2.5 * dt, 2.5 * dt); } if (o.sweep) b.a += o.sweep * dt; b.x = P.x; b.y = P.y; b.x1 = P.x + Math.cos(b.a) * o.len; b.y1 = P.y + Math.sin(b.a) * o.len;
      let L = o.len; for (let d = 12; d <= o.len; d += 12) if (dirSolid(P.x + Math.cos(b.a) * d, P.y + Math.sin(b.a) * d)) { L = d; break; } b.L = L; b.x1 = P.x + Math.cos(b.a) * L; b.y1 = P.y + Math.sin(b.a) * L; addLight((b.x + b.x1) / 2, (b.y + b.y1) / 2, 90, rgbOf(p[2]), 0.8);
      if (b.t < o.delay) return; tk -= dt; if (tk <= 0) { tk = o.tick; for (const e of G.enemies) if (!e.dead) { const dx = e.x - P.x, dy = e.y - 8 - P.y, c = Math.cos(b.a), s = Math.sin(b.a), u = dx * c + dy * s, v = -dx * s + dy * c; if (u > 0 && u < L + 8 && Math.abs(v) < o.w + e.def.r * 0.5) { hitE(P, e, E.base(o.mult), E, o.st, { kb: o.kb, fx: o.fx, stun: o.stun }); } } }
      if (o.upd) o.upd(P, E, b, dt);
    },
    draw(b, ctx, cx, cy) { const k = b.t < o.delay ? b.t / o.delay * 0.4 : 1; o.draw(ctx, b.x - cx, b.y - 10 - cy, b.x1 - cx, b.y1 - 10 - cy, b, p, k); } });
};
// pluie d'objets
K.rain = (o0) => (P, E) => {
  const o = Object.assign({ where: 't', r: 70, n: 12, dur: 1.5, mult: 0.7, aoe: 20, fall: 0.45, h: 220, kb: 60 }, o0); const p = PALS[E.fam]; const pos = posOf(P, E, o); sfx(E.fam + '_c');
  mfx({ life: o.dur + o.fall + 0.6, x: pos.x, y: pos.y, big: 1, passes: ['ground', 'top', 'glow'], drops: [], seeded: false,
    upd(m, dt) {
      if (!m.seeded) { m.seeded = true; for (let i = 0; i < o.n; i++) { const a = rnd(0, 6.28), r = Math.sqrt(Math.random()) * o.r; m.drops.push({ x: pos.x + Math.cos(a) * r, y: pos.y + Math.sin(a) * r * 0.6, t0: (i / o.n) * o.dur + rnd(0, 0.1), done: 0, seed: rnd(0, 9) }); } }
      for (const d of m.drops) { const age = m.t - d.t0; if (age >= o.fall && !d.done) { d.done = m.t; sfx(E.fam + '_i'); aoeE(P, d.x, d.y, o.aoe, E.base(o.mult), E, o.st, { kb: o.kb, fx: o.fx }); ring(d.x, d.y, o.aoe + 8, p[3], 0.25, 2); if (o.land) o.land(P, E, d); } if (age >= 0 && age < o.fall) addLight(d.x, d.y - o.h * (1 - age / o.fall), 40, rgbOf(p[2]), 0.6); }
    },
    draw(m, ctx, cx, cy, pass) { for (const d of m.drops) { const age = m.t - d.t0; if (age < -0.3) continue; const x = d.x - cx, y = d.y - cy; if (pass === 'ground') { if (age < o.fall) { ctx.globalAlpha = 0.25 + 0.5 * cap01((age + 0.3) / (o.fall + 0.3)); ctx.strokeStyle = p[3]; ctx.beginPath(); ctx.ellipse(x, y, o.aoe, o.aoe * 0.55, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; } else if (o.landDraw) o.landDraw(ctx, x, y, d, m.t - d.done, p, 'ground'); } else if (age >= 0 && age < o.fall) { const u = age / o.fall; o.draw(ctx, x, y - o.h * (1 - u * u), d, p, u, m.t); } else if (age >= o.fall && o.landDraw) o.landDraw(ctx, x, y, d, m.t - d.done, p, pass); } } });
};
// déplacement / téléportation
K.dash = (o0) => (P, E) => {
  const o = Object.assign({ dist: 110, dur: 0.22, mult: 0.8, r: 16, inv: 1, mode: 'dash' }, o0); const p = PALS[E.fam]; sfx(E.fam + '_c'); const a = E.a, c = Math.cos(a), s = Math.sin(a), hit = new Set(), sx = P.x, sy = P.y; P.iframes = Math.max(P.iframes, o.inv ? o.dur + 0.12 : 0);
  if (o.mode === 'blink') { let d = o.dist; while (d > 8 && !lineClear(P.x, P.y, P.x + c * d, P.y + s * d)) d -= 8; P.x += c * d; P.y += s * d; if (o.pass) for (const e of G.enemies) if (!e.dead) { const dx = e.x - sx, dy = e.y - sy, u = dx * c + dy * s, v = -dx * s + dy * c; if (u > 0 && u < d && Math.abs(v) < o.r + e.def.r * 0.5) hitE(P, e, E.base(o.mult), E, o.st, { kb: 40, fx: o.fx }); } mfx({ life: o.fxLife || 0.7, x: sx, y: sy, ex: P.x, ey: P.y, big: 1, passes: PS(E, ['glow']), upd() { }, draw(m, ctx, cx, cy) { o.draw(ctx, sx - cx, sy - cy, m.ex - cx, m.ey - cy, m, p, cap01(m.t / (o.fxLife || 0.7))); } }); if (o.onEnd) o.onEnd(P, E, sx, sy); return; }
  const trail = []; mfx({ life: o.dur + (o.fxLife || 0.5), x: sx, y: sy, big: 1, passes: PS(E, ['glow']), tr: trail,
    upd(m, dt) { if (m.t < o.dur) { const st = o.dist / o.dur * dt; const x0 = P.x, y0 = P.y; moveBody(P, c * st, s * st); trail.push([P.x, P.y, m.t]); for (const e of G.enemies) if (!e.dead && !hit.has(e) && inCircle(e, P.x, P.y, o.r)) { hit.add(e); hitE(P, e, E.base(o.mult), E, o.st, { kb: 80, fx: o.fx }); sparks(e.x, e.y - 14, a, 6, p[3]); } if (o.onTick) o.onTick(P, E, m, dt); } else if (!m.end) { m.end = 1; if (o.onEnd) o.onEnd(P, E, P.x, P.y); } },
    draw(m, ctx, cx, cy) { o.draw(ctx, m, trail, cx, cy, p); } });
};
// aura / amélioration (orbites, buffs génériques)
K.buff = (o0) => (P, E) => {
  const o = Object.assign({ dur: 8, gb: {}, orbit: null }, o0); const p = PALS[E.fam]; sfx(E.fam + '_u'); const name = 'b_' + E.fam + '_' + (o.key || 'x'); const me = {}; gbuff(P, name, o.dur, Object.assign({ onEnd: o.onEnd }, o.gb));
  for (const m of G.mfx) if (m.kind === name) m.dead = true; ring(P.x, P.y, 36, p[3], 0.4, 3); const orb = o.orbit; const hitT = new Map();
  mfx({ kind: name, life: o.dur, x: P.x, y: P.y, passes: PS(E, o.passes || ['glow']),
    upd(m, dt) { m.x = P.x; m.y = P.y; if (!gbOn(P, name)) { m.dead = true; return; } addLight(P.x, P.y - 12, o.light || 70, rgbOf(p[2]), 0.8);
      if (orb) { const n = orb.n; for (let i = 0; i < n; i++) { const ang = m.t * (orb.spd || 3) + i / n * 6.2832, ox = P.x + Math.cos(ang) * orb.rad, oy = P.y + Math.sin(ang) * orb.rad * 0.6; for (const e of G.enemies) if (!e.dead && inCircle(e, ox, oy, orb.r || 12) && (hitT.get(e) || 0) < G.t) { hitT.set(e, G.t + (orb.tick || 0.5)); hitE(P, e, E.base(orb.mult || 0.5), E, orb.st, { kb: 70 }); sparks(e.x, e.y - 12, ang, 4, p[3]); } } }
      if (o.deflect) for (const q of G.projs) if (q.from === 'e' && dist(q.x, q.y, P.x, P.y) < o.deflect) { if (o.deflect2 === 'reflect') { q.from = 'p'; q.vx *= -1.2; q.vy *= -1.2; q.mult = 1; q.dmg = (q.dmg || 8) * 1; } else q.life = 0; ring(q.x, q.y, 12, p[3], 0.2, 2); }
      if (o.onTick) o.onTick(P, E, m, dt); },
    draw(m, ctx, cx, cy) { const left = P.gb && P.gb[name] ? P.gb[name].t - G.t : 0; const k = cap01(Math.min(left / 1.2, m.t / 0.4)); o.draw(ctx, P.x - cx, P.y - cy, P, p, { t: m.t, k, left }); if (orb && orb.draw) for (let i = 0; i < orb.n; i++) { const ang = m.t * (orb.spd || 3) + i / orb.n * 6.2832; orb.draw(ctx, P.x - cx + Math.cos(ang) * orb.rad, P.y - cy + Math.sin(ang) * orb.rad * 0.6 - 10, i, p, m.t, ang); } } });
};
// invocations qui combattent
K.summon = (o0) => (P, E) => {
  const o = Object.assign({ n: 2, dur: 8, spd: 120, every: 0.8, mult: 0.7, range: 150, hitR: 20, kb: 60, hover: 14 }, o0); const p = PALS[E.fam]; sfx(E.fam + '_u'); const sm = []; ring(P.x, P.y, 34, p[3], 0.4, 3);
  for (let i = 0; i < o.n; i++) { const a = i / o.n * 6.28; sm.push({ x: P.x + Math.cos(a) * 24, y: P.y + Math.sin(a) * 14, cd: i * 0.2, ang: a, seed: rnd(0, 9), st: 0 }); }
  mfx({ life: o.dur + 0.6, x: P.x, y: P.y, big: 1, passes: PS(E, ['ground', 'glow']),
    upd(m, dt) { const fade = m.t > o.dur; if (fade && !m.ended) { m.ended = 1; if (o.onEnd) for (const s of sm) o.onEnd(P, E, s); } for (const s of sm) { let tg = null, bd = o.range; for (const e of G.enemies) if (!e.dead) { const d = dist(s.x, s.y, e.x, e.y); if (d < bd) { bd = d; tg = e; } } const hx = (tg && !o.ranged) ? tg.x : P.x + Math.cos(s.ang + m.t * 0.8) * (o.orb || 28), hy = (tg && !o.ranged) ? tg.y : P.y + Math.sin(s.ang + m.t * 0.8) * (o.orb ? o.orb * 0.55 : 16); const d = dist(s.x, s.y, hx, hy); if (d > ((tg && !o.ranged) ? 12 : 3)) { s.x += (hx - s.x) / d * Math.min(d, o.spd * dt); s.y += (hy - s.y) / d * Math.min(d, o.spd * dt); } s.dir = hx < s.x ? -1 : 1; s.cd -= dt; if (tg && !fade && s.cd <= 0 && (o.ranged || d < o.hitR + tg.def.r * 0.5)) { s.cd = o.every; s.st = 0.25; hitE(P, tg, E.base(o.mult), E, o.st, { kb: o.kb }); sparks(tg.x, tg.y - 14, rnd(0, 6.28), 5, p[3]); if (o.onHit) o.onHit(P, tg, E, s); } s.st = Math.max(0, s.st - dt); addLight(s.x, s.y - 10, 40, rgbOf(p[2]), 0.6); if (o.onTick) o.onTick(P, E, s, dt); } },
    draw(m, ctx, cx, cy, pass) { const f = m.t > o.dur ? cap01(1 - (m.t - o.dur) / 0.6) : cap01(m.t / 0.3); for (const s of sm) { const x = s.x - cx, y = s.y - cy; if (pass === 'ground') { ctx.globalAlpha = 0.3 * f; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y, 7, 3, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } else { ctx.globalAlpha = f; o.draw(ctx, x, y - o.hover - Math.sin(m.t * 4 + s.seed) * 2, s, p, m.t); ctx.globalAlpha = 1; } } } });
};
// chaîne entre cibles (éclair, lien…)
K.chain = (o0) => (P, E) => {
  const o = Object.assign({ jumps: 4, range: 90, mult: 0.9, delay: 0.1, mult2: 0.85 }, o0); const p = PALS[E.fam]; sfx(E.fam + '_c'); let cur = E.t || nearestEnemy(P.x, P.y, 230, 1.3, E.a); const done = new Set(); let from = { x: P.x, y: P.y - 12 }, i = 0, m = o.mult;
  const step = () => { if (!cur || cur.dead || i >= o.jumps) return; done.add(cur); const tgt = cur, fx0 = from.x, fy0 = from.y, ix = i; sfx(E.fam + '_i'); hitE(P, tgt, E.base(m), E, o.st, { kb: 40, fx: o.fx }); mfx({ life: o.vis || 0.28, x: tgt.x, y: tgt.y, big: 1, passes: PS(E, ['glow']), seed: rnd(0, 9), upd() { addLight(tgt.x, tgt.y - 12, 60, rgbOf(p[2]), 0.8); }, draw(z, ctx, cx, cy) { const k = 1 - z.t / (o.vis || 0.28); ctx.globalAlpha = k; o.draw(ctx, fx0 - cx, fy0 - cy, tgt.x - cx, tgt.y - 12 - cy, z, p, ix); ctx.globalAlpha = 1; } }); if (o.onHit) o.onHit(P, tgt, E, ix); from = { x: tgt.x, y: tgt.y - 12 }; i++; m *= o.mult2; let nx = null, bd = o.range; for (const e of G.enemies) if (!e.dead && !done.has(e)) { const d = dist(tgt.x, tgt.y, e.x, e.y); if (d < bd) { bd = d; nx = e; } } cur = nx; if (cur) later(step, o.delay * 1000); };
  if (!cur) { mfx({ life: 0.25, x: P.x, y: P.y, big: 1, passes: PS(E, ['glow']), upd() { }, draw(z, ctx, cx, cy) { ctx.globalAlpha = 1 - z.t / 0.25; o.draw(ctx, P.x - cx, P.y - 12 - cy, P.x + Math.cos(E.a) * 90 - cx, P.y + Math.sin(E.a) * 90 - 12 - cy, z, p, 0); ctx.globalAlpha = 1; } }); return; } step();
};
// frappe en arc devant soi
K.cone = (o0) => (P, E) => {
  const o = Object.assign({ r: 70, arc: 1.7, mult: 1, kb: 130, life: 0.35 }, o0); const p = PALS[E.fam]; sfx(E.fam + '_c'); const a = E.a, x = P.x, y = P.y; let n = 0;
  mfx({ life: o.life, x, y, big: 1, passes: PS(E, o.passes || ['glow']), upd(m) { if (!m.on && m.t >= (o.delay || 0.06)) { m.on = 1; sfx(E.fam + '_i'); if (o.shk) shake(o.shk); for (const e of G.enemies) if (!e.dead) { const d = dist(P.x, P.y, e.x, e.y); if (d < o.r + e.def.r * 0.4 && Math.abs(wrapA(Math.atan2(e.y - P.y, e.x - P.x) - a)) < o.arc / 2) { hitE(P, e, E.base(o.mult), E, o.st, { kb: o.kb, fx: o.fx, stun: o.stun }); n++; } } if (o.onHit) o.onHit(P, E, n); } addLight(P.x + Math.cos(a) * 30, P.y + Math.sin(a) * 20, 70, rgbOf(p[2]), 0.7); },
    draw(m, ctx, cx, cy) { o.draw(ctx, P.x - cx, P.y - cy - 10, m, p, { a, r: o.r, arc: o.arc, k: m.t / o.life }); } });
};
// séquence de plusieurs effets
K.seq = (...fs) => (P, E) => { for (const f of fs) f(P, E); };
// blocs / feuilles / lianes réutilisables
function rockP(ctx, x, y, w, h, p, seed) {
  const j = (i) => Math.sin(seed * 12.9 + i * 78.2) * 0.18; ctx.fillStyle = p[1]; ctx.beginPath(); ctx.moveTo(x - w * (0.5 + j(1)), y); ctx.lineTo(x - w * (0.55 + j(2)), y - h * 0.7); ctx.lineTo(x - w * 0.2, y - h * (1 + j(3))); ctx.lineTo(x + w * 0.3, y - h * (0.95 + j(4))); ctx.lineTo(x + w * (0.55 + j(5)), y - h * 0.6); ctx.lineTo(x + w * (0.5 + j(6)), y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = p[2]; ctx.beginPath(); ctx.moveTo(x - w * 0.55, y - h * 0.7); ctx.lineTo(x - w * 0.2, y - h * 0.98); ctx.lineTo(x + w * 0.3, y - h * 0.93); ctx.lineTo(x + w * 0.05, y - h * 0.55); ctx.closePath(); ctx.fill(); ctx.fillStyle = p[3]; ctx.fillRect(Math.round(x - w * 0.2), Math.round(y - h * 0.9), Math.max(2, Math.round(w * 0.25)), 2); ctx.fillStyle = p[0]; ctx.fillRect(Math.round(x + w * 0.1), Math.round(y - h * 0.4), 2, Math.round(h * 0.4));
}
function leafP(ctx, x, y, ang, s, p) { const c = Math.cos(ang), q = Math.sin(ang); ctx.fillStyle = p[2]; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + c * s * 0.5 - q * s * 0.4, y + q * s * 0.5 + c * s * 0.4, x + c * s, y + q * s); ctx.quadraticCurveTo(x + c * s * 0.5 + q * s * 0.4, y + q * s * 0.5 - c * s * 0.4, x, y); ctx.fill(); ctx.strokeStyle = p[4]; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + c * s * 0.9, y + q * s * 0.9); ctx.stroke(); }
function vineP(ctx, pts, p, w, t, leaves) { ribbon(ctx, pts, p, w); if (leaves) for (let i = 1; i < pts.length; i += 2) leafP(ctx, pts[i][0], pts[i][1], (i % 4 ? -1 : 1) * 1.1 + Math.sin(t * 3 + i) * 0.3, 5, p); }
function dustPuff(x, y, n, col) { for (let i = 0; i < n; i++) part(x + rnd(-10, 10), y + rnd(-4, 4), { col: col || '#b89a70', life: rnd(0.4, 0.8), size: 2, vx: rnd(-40, 40), vy: rnd(-15, 5), rise: rnd(10, 40) }); }
// ---------- icônes à glyphes ----------
function glyphIcon(c, g) {
  const p = PALS[g.fam] || PALS.feu; const gl = (g.ic && g.ic[0]) || 'orb', gl2 = g.ic && g.ic[1];
  const lg = c.createRadialGradient(16, 17, 2, 16, 16, 20); lg.addColorStop(0, p[1]); lg.addColorStop(1, p[0]); c.fillStyle = '#0a0810'; c.fillRect(0, 0, 32, 32); c.fillStyle = lg; c.fillRect(1, 1, 30, 30); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.strokeRect(1.5, 1.5, 29, 29);
  const F = (col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); }; const P_ = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fill(); };
  const draw = (k, sx, sy, sc) => { c.save(); c.translate(sx, sy); c.scale(sc, sc); c.translate(-16, -16); const G_ = {
    orb() { glowI(c, 16, 16, 12, rgbOf(p[2]), 0.5); c.fillStyle = p[2]; c.beginPath(); c.arc(16, 16, 8, 0, 7); c.fill(); c.fillStyle = p[3]; c.beginPath(); c.arc(15, 15, 5, 0, 7); c.fill(); F(p[4], 13, 12, 3, 3); },
    drop() { P_([[16, 5], [23, 17], [21, 24], [16, 27], [11, 24], [9, 17]], p[2]); P_([[16, 8], [20, 17], [19, 22], [16, 24], [13, 20]], p[3]); F(p[4], 13, 16, 2, 4); },
    bolt() { P_([[18, 3], [8, 18], [15, 18], [12, 29], [24, 13], [17, 13], [21, 3]], p[2]); P_([[18, 6], [12, 17], [17, 17], [15, 25], [21, 14], [16, 14], [19, 6]], p[4]); },
    shard() { P_([[16, 3], [22, 12], [20, 28], [12, 28], [10, 12]], p[2]); P_([[16, 5], [20, 12], [18, 26], [16, 26]], p[3]); P_([[16, 5], [13, 12], [14, 24], [16, 26]], p[1]); F(p[4], 15, 8, 2, 6); },
    ring() { c.lineWidth = 3; c.strokeStyle = p[2]; c.beginPath(); c.arc(16, 16, 10, 0, 7); c.stroke(); c.strokeStyle = p[4]; c.lineWidth = 1; c.beginPath(); c.arc(16, 16, 7, 0, 7); c.stroke(); for (let i = 0; i < 6; i++) { const a = i * 1.047; F(p[3], 16 + Math.cos(a) * 12, 16 + Math.sin(a) * 12, 2, 2); } },
    spiral() { c.lineWidth = 3; c.strokeStyle = p[2]; c.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.32, r = 2 + i * 0.28; c.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r); } c.stroke(); c.lineWidth = 1; c.strokeStyle = p[4]; c.stroke(); },
    wave() { c.lineWidth = 3; for (let r = 0; r < 3; r++) { c.strokeStyle = [p[1], p[2], p[3]][r]; c.beginPath(); for (let x = 3; x <= 29; x++) c.lineTo(x, 10 + r * 6 + Math.sin(x * 0.45 + r) * 3); c.stroke(); } },
    whip() { c.lineWidth = 3; c.strokeStyle = p[2]; c.beginPath(); c.moveTo(5, 27); c.bezierCurveTo(6, 10, 22, 26, 26, 7); c.stroke(); c.strokeStyle = p[4]; c.lineWidth = 1; c.stroke(); F(p[3], 24, 4, 4, 4); },
    blade() { P_([[6, 24], [12, 8], [26, 6], [20, 14], [14, 22]], p[2]); P_([[10, 20], [14, 10], [23, 8], [19, 14]], p[3]); F(p[4], 14, 11, 3, 2); },
    needles() { for (let i = 0; i < 4; i++) { c.lineWidth = 2; c.strokeStyle = i % 2 ? p[3] : p[2]; c.beginPath(); c.moveTo(7 + i * 4, 26); c.lineTo(15 + i * 4, 6); c.stroke(); } },
    shield() { P_([[16, 4], [26, 8], [24, 20], [16, 28], [8, 20], [6, 8]], p[2]); P_([[16, 7], [23, 10], [21, 19], [16, 25], [11, 19], [9, 10]], p[3]); F(p[4], 15, 10, 2, 10); F(p[4], 11, 14, 10, 2); },
    wings() { P_([[16, 17], [3, 6], [5, 16], [9, 18], [8, 24], [16, 22]], p[2]); P_([[16, 17], [29, 6], [27, 16], [23, 18], [24, 24], [16, 22]], p[2]); P_([[16, 17], [7, 9], [8, 16], [12, 18]], p[3]); P_([[16, 17], [25, 9], [24, 16], [20, 18]], p[3]); },
    column() { F(p[1], 11, 7, 10, 20); F(p[2], 13, 5, 6, 22); F(p[3], 15, 5, 2, 20); P_([[8, 28], [11, 22], [21, 22], [24, 28]], p[2]); F(p[4], 12, 3, 8, 3); },
    skull() { c.fillStyle = p[3]; c.beginPath(); c.arc(16, 14, 9, 0, 7); c.fill(); F(p[3], 11, 18, 10, 8); F(p[0], 11, 12, 4, 5); F(p[0], 17, 12, 4, 5); F(p[0], 15, 19, 2, 3); F(p[1], 12, 24, 2, 3); F(p[1], 15, 24, 2, 3); F(p[1], 18, 24, 2, 3); },
    eye() { P_([[3, 16], [10, 9], [22, 9], [29, 16], [22, 23], [10, 23]], p[3]); c.fillStyle = p[2]; c.beginPath(); c.arc(16, 16, 6, 0, 7); c.fill(); F(p[0], 14, 14, 4, 4); F(p[4], 12, 12, 2, 2); },
    rune() { c.lineWidth = 2; c.strokeStyle = p[3]; c.strokeRect(6, 6, 20, 20); c.strokeStyle = p[2]; c.beginPath(); c.moveTo(16, 9); c.lineTo(16, 23); c.moveTo(10, 14); c.lineTo(22, 14); c.moveTo(10, 22); c.lineTo(16, 17); c.lineTo(22, 22); c.stroke(); },
    star() { P_([[16, 3], [19, 13], [29, 16], [19, 19], [16, 29], [13, 19], [3, 16], [13, 13]], p[2]); P_([[16, 8], [18, 14], [24, 16], [18, 18], [16, 24], [14, 18], [8, 16], [14, 14]], p[4]); },
    moon() { c.fillStyle = p[3]; c.beginPath(); c.arc(15, 16, 10, 0, 7); c.fill(); c.fillStyle = p[1]; c.beginPath(); c.arc(20, 14, 9, 0, 7); c.fill(); },
    cloud() { c.fillStyle = p[2]; c.beginPath(); c.arc(11, 17, 6, 0, 7); c.arc(17, 13, 7, 0, 7); c.arc(23, 17, 5, 0, 7); c.fill(); F(p[2], 8, 17, 18, 6); F(p[3], 12, 12, 6, 3); },
    leaf() { P_([[6, 26], [8, 12], [20, 5], [27, 6], [26, 18], [14, 26]], p[2]); P_([[10, 22], [12, 13], [21, 8], [23, 9]], p[3]); c.strokeStyle = p[4]; c.lineWidth = 1; c.beginPath(); c.moveTo(7, 26); c.lineTo(24, 8); c.stroke(); },
    thorn() { for (let i = 0; i < 3; i++) P_([[6 + i * 8, 28], [9 + i * 8, 10 + (i % 2) * 6], [12 + i * 8, 28]], i % 2 ? p[3] : p[2]); },
    fang() { P_([[8, 6], [14, 6], [11, 26]], p[3]); P_([[18, 6], [24, 6], [21, 26]], p[3]); F(p[1], 6, 4, 20, 3); },
    hand() { F(p[2], 11, 14, 10, 12); for (let i = 0; i < 4; i++) F(p[2], 11 + i * 3, 6 + (i % 2) * 2, 2, 9); F(p[3], 8, 16, 4, 3); F(p[4], 13, 17, 3, 4); },
    chain() { c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.strokeStyle = i % 2 ? p[3] : p[2]; c.strokeRect(5 + i * 6, 6 + i * 6, 9, 6); } },
    hourglass() { P_([[8, 5], [24, 5], [18, 16], [24, 27], [8, 27], [14, 16]], p[2]); P_([[11, 7], [21, 7], [16, 14]], p[4]); P_([[11, 25], [21, 25], [16, 19]], p[3]); },
    sun() { glowI(c, 16, 16, 14, rgbOf(p[3]), 0.5); c.fillStyle = p[3]; c.beginPath(); c.arc(16, 16, 6, 0, 7); c.fill(); c.fillStyle = p[4]; c.beginPath(); c.arc(16, 16, 3, 0, 7); c.fill(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; F(p[2], 16 + Math.cos(a) * 11 - 1, 16 + Math.sin(a) * 11 - 1, 3, 3); } },
    gear() { c.fillStyle = p[2]; for (let i = 0; i < 8; i++) { const a = i * 0.785; c.fillRect(16 + Math.cos(a) * 10 - 2, 16 + Math.sin(a) * 10 - 2, 4, 4); } c.beginPath(); c.arc(16, 16, 8, 0, 7); c.fill(); c.fillStyle = p[0]; c.beginPath(); c.arc(16, 16, 3, 0, 7); c.fill(); },
    note() { c.fillStyle = p[3]; c.beginPath(); c.ellipse(11, 23, 5, 4, -0.4, 0, 7); c.fill(); F(p[3], 14, 6, 3, 17); P_([[17, 6], [26, 10], [26, 15], [17, 11]], p[2]); },
    mirror() { c.strokeStyle = p[3]; c.lineWidth = 3; c.beginPath(); c.ellipse(16, 14, 8, 10, 0, 0, 7); c.stroke(); c.fillStyle = p[2]; c.globalAlpha = 0.6; c.beginPath(); c.ellipse(16, 14, 6, 8, 0, 0, 7); c.fill(); c.globalAlpha = 1; F(p[3], 14, 24, 4, 5); F(p[4], 12, 9, 2, 6); },
    portal() { for (let i = 0; i < 4; i++) { c.strokeStyle = [p[1], p[2], p[3], p[4]][i]; c.lineWidth = 2; c.beginPath(); c.ellipse(16, 16, 11 - i * 2.5, 13 - i * 3, i * 0.3, 0, 7); c.stroke(); } },
    meteor() { for (let i = 0; i < 8; i++) F(lv(p, 0.2 + i * 0.08), 3 + i * 2, 5 + i * 2, 4, 4); c.fillStyle = p[3]; c.beginPath(); c.arc(21, 21, 6, 0, 7); c.fill(); F(p[4], 19, 19, 3, 3); },
    web() { c.strokeStyle = p[3]; c.lineWidth = 1; for (let i = 0; i < 8; i++) { const a = i * 0.785; c.beginPath(); c.moveTo(16, 16); c.lineTo(16 + Math.cos(a) * 13, 16 + Math.sin(a) * 13); c.stroke(); } for (let r = 4; r <= 12; r += 4) { c.beginPath(); c.arc(16, 16, r, 0, 7); c.stroke(); } },
    cross() { F(p[2], 13, 4, 6, 24); F(p[2], 6, 11, 20, 6); F(p[4], 15, 7, 2, 18); F(p[4], 9, 13, 14, 2); },
    heart() { c.fillStyle = p[2]; c.beginPath(); c.arc(11, 12, 6, 0, 7); c.arc(21, 12, 6, 0, 7); c.fill(); P_([[5, 14], [27, 14], [16, 28]], p[2]); F(p[4], 9, 9, 3, 3); },
    flask() { F(p[3], 14, 4, 4, 8); P_([[14, 12], [18, 12], [25, 26], [7, 26]], p[2]); P_([[11, 20], [21, 20], [24, 26], [8, 26]], p[3]); F(p[4], 13, 14, 2, 4); },
    vortex() { c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.strokeStyle = [p[1], p[2], p[3]][k]; c.beginPath(); for (let i = 0; i < 30; i++) { const a = i * 0.4 + k * 2.1, r = 2 + i * 0.4; c.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r * 0.9); } c.stroke(); } },
    sword() { c.lineWidth = 3; c.strokeStyle = p[3]; c.beginPath(); c.moveTo(8, 26); c.lineTo(24, 8); c.stroke(); F(p[2], 6, 22, 8, 3); F(p[1], 5, 25, 4, 4); F(p[4], 22, 8, 3, 3); },
    fist() { F(p[2], 8, 12, 16, 12); for (let i = 0; i < 4; i++) F(p[3], 9 + i * 4, 9, 3, 5); F(p[1], 12, 24, 10, 3); F(p[4], 10, 14, 3, 3); },
  }; (G_[k] || G_.orb)(); c.restore(); };
  draw(gl, 16, 16, gl2 ? 0.8 : 1); if (gl2) draw(gl2, 24, 24, 0.5);
}
// ---------- enregistrement d'une famille ----------
function FAMILY(fam, specs, opts) {
  const MP = [14, 18, 18, 24, 30, 22, 28, 26, 34, 0], CD = [3, 6, 5, 11, 13, 9, 12, 14, 18, 0];
  GRIMOIRE[fam] = specs.map((s, i) => { s.id = 'G' + fam + (i + 1); s.fam = fam; s.ult = i === 9; if (s.mp === undefined) s.mp = MP[i]; if (s.cd === undefined) s.cd = CD[i]; s.bg = s.bg || PALS[fam][1]; if (opts && opts.solid) { const c0 = s.cast; s.cast = (P, E) => { E.solid = true; c0(P, E); }; } return s; });
}
// mise à jour par image (états, buffs)
function updateMagic3(dt) { xsTick(dt); gbufUpdate(dt); }
