'use strict';
// =====================================================================
//  GRIMOIRE DES MAGIES — compétences de maîtrise (catalogue des 270).
//  Chaque famille possède 10 compétences : 9 sorts + 1 ultime. Elles se
//  débloquent avec la maîtrise de la famille (niveau 1 → 10) et se placent
//  dans les emplacements de sorts. Les 3 sorts de base d'origine sont conservés
//  (disponibles d'emblée) : rien n'est supprimé.
//  Famille déjà refondue : FEU. Les autres familles gardent leurs sorts de base
//  en attendant leur refonte.
// =====================================================================
// xp minimum pour atteindre le niveau n (index = niveau)
const MASTERY_XP = [0, 0, 60, 180, 380, 650, 1000, 1500, 2200, 3200, 4600];
function magLevel(P, fam) { const x = (P.mastery && P.mastery[fam]) || 0; let l = 1; for (let i = 2; i <= 10; i++) if (x >= MASTERY_XP[i]) l = i; return l; }
function magXpInfo(P, fam) { const x = Math.floor((P.mastery && P.mastery[fam]) || 0), l = magLevel(P, fam); return { x, l, next: l >= 10 ? null : MASTERY_XP[l + 1], base: MASTERY_XP[l] }; }
function skillOpen(P, fam, n) { return n <= 3 || magLevel(P, fam) >= n; }
function grimSpell(fam, n) { const g = GRIMOIRE[fam]; return g ? g[n - 1] : null; }
function magicXp(P, fam, n) {
  if (!fam || !GRIMOIRE[fam]) return;
  P.mastery = P.mastery || {}; const before = magLevel(P, fam); P.mastery[fam] = (P.mastery[fam] || 0) + n;
  const after = magLevel(P, fam);
  if (after > before) {
    const g = grimSpell(fam, after); const F = MAGIC_DATA[fam];
    later(() => { toast('Maîtrise ' + F.n + ' niveau ' + after + (g ? ' — nouvelle compétence : ' + g.n + (after === 10 ? ' (ultime)' : '') : ''), F.col); sfx('level'); }, 250);
  }
}
function defSel(P, id) { const fam = id === 'm2' ? P.magic2 : P.magic, i = id === 'm2' ? 0 : { s1: 0, s2: 1, s3: 2 }[id]; return fam && GRIMOIRE[fam] ? 'C' + (i + 1) : 'L' + i; }
function equippedSel(P, id) { const v = P.eqM && P.eqM[id]; if (v) return v; return defSel(P, id); }
function equipM(P, slot, sel) {
  const fam = slot === 'm2' ? P.magic2 : P.magic; if (!fam) return false;
  if (sel[0] === 'C') { const n = +sel.slice(1); if (n < 1 || n > 9 || !grimSpell(fam, n) || !skillOpen(P, fam, n)) return false; }
  P.eqM = P.eqM || {};
  // un même sort n'occupe qu'un emplacement : échange si besoin
  for (const k of ['s1', 's2', 's3', 'm2']) if (k !== slot && (P.eqM[k] || defSel(P, k)) === sel && (k === 'm2' ? P.magic2 : P.magic) === fam) P.eqM[k] = equippedSel(P, slot);
  P.eqM[slot] = sel; P.cd[slot] = 0; return true;
}
function grimUltReady(P) { return !!(P.magic && P.ultSel === 'C10' && grimSpell(P.magic, 10) && magLevel(P, P.magic) >= 10); }

// ---------------- moteur d'effets personnalisés ----------------
// o : { life, passes:['ground'|'glow'|'top'], upd(o,dt), draw(o,ctx,cx,cy,pass) }
function mfx(o) { o.t = 0; if (G.mfx.length > 650 && o.cheap) return o; G.mfx.push(o); return o; }
function updateMfx(dt) {
  for (const o of G.mfx) { o.t += dt; try { o.upd && o.upd(o, dt); } catch (e) { o.dead = true; console.error(e); } }
  for (const o of G.mfx) if (o.t >= o.life && !o.dead && o.onDead) { try { o.onDead(o); } catch (e) { console.error(e); } }
  G.mfx = G.mfx.filter(o => !o.dead && o.t < o.life);
}
function drawMfx(ctx, cx, cy, pass) {
  for (const o of G.mfx) {
    if (o.passes.indexOf(pass) < 0) continue;
    if (o.x !== undefined && (o.x - cx < -260 || o.x - cx > W + 260 || o.y - cy < -260 || o.y - cy > H + 260) && !o.big) continue;
    ctx.save(); try { o.draw(o, ctx, cx, cy, pass); } catch (e) { o.dead = true; console.error(e); } ctx.restore();
  }
}
// ---------------- primitives pixel-art ----------------
const FIRE_PAL = ['#4a0e06', '#a8240a', '#ff5a1a', '#ff9a2a', '#ffd24a', '#fff3b0', '#ffffff'];
function fcell(ctx, x, y, s, v) { ctx.fillStyle = FIRE_PAL[Math.max(0, Math.min(6, Math.floor(v * 7)))]; ctx.fillRect(Math.round(x), Math.round(y), s, s); }
// boule de feu irrégulière : cœur blanc-jaune, enveloppe orange-rouge ondoyante
function fireBall(ctx, x, y, r, t, seed, heat) {
  const s = 2, n = Math.ceil(r / s) + 2; heat = heat === undefined ? 1 : heat;
  for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
    const dx = i * s, dy = j * s, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const rr = r * (0.8 + 0.2 * Math.sin(a * 3 + t * 11 + seed) + 0.12 * Math.sin(a * 5 - t * 17 + seed * 2));
    if (d > rr) continue; const v = (0.18 + 0.82 * Math.pow(1 - d / rr, 1.15)) * heat;
    fcell(ctx, x + dx - 1, y + dy - 1, s, v);
  }
}
// langue de flamme verticale (base en x,y)
function flameTongue(ctx, x, y, h, w, t, seed, heat) {
  heat = heat === undefined ? 1 : heat;
  for (let k = 0; k < h; k += 2) {
    const u = k / h, hw = Math.max(1, w * Math.pow(1 - u, 0.8) * (0.72 + 0.28 * Math.sin(t * 14 + seed + u * 6)));
    const sx = Math.sin(t * 9 + seed + u * 5) * 3 * u, yy = y - k;
    ctx.fillStyle = FIRE_PAL[Math.floor((0.2 + 0.2 * u) * heat * 7)]; ctx.fillRect(Math.round(x + sx - hw), Math.round(yy), Math.round(hw * 2), 2);
    if (u < 0.78) { ctx.fillStyle = FIRE_PAL[Math.floor((0.5 + 0.2 * (1 - u)) * heat * 7)]; ctx.fillRect(Math.round(x + sx - hw * 0.62), Math.round(yy), Math.max(1, Math.round(hw * 1.24)), 2); }
    if (u < 0.5) { ctx.fillStyle = FIRE_PAL[Math.min(6, Math.floor((0.82 + 0.15 * (1 - u)) * heat * 7))]; ctx.fillRect(Math.round(x + sx - hw * 0.3), Math.round(yy), Math.max(1, Math.round(hw * 0.6)), 2); }
  }
}
function pxLine(ctx, x0, y0, x1, y1, col, w) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2)); ctx.fillStyle = col; w = w || 2;
  for (let i = 0; i <= n; i++) { const u = i / n; ctx.fillRect(Math.round(x0 + (x1 - x0) * u - w / 2), Math.round(y0 + (y1 - y0) * u - w / 2), w, w); }
}
function glow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// braise rebondissante
function ember(x, y, vx, vy, vz, life, z0) {
  return mfx({ life, x, y, z: z0 || 0, vx, vy, vz, cheap: true, passes: ['glow'],
    upd(o, dt) { o.vz -= 430 * dt; o.z += o.vz * dt; if (o.z < 0) { o.z = 0; o.vz = Math.abs(o.vz) * 0.5; o.vx *= 0.7; o.vy *= 0.7; } o.x += o.vx * dt; o.y += o.vy * dt; },
    draw(o, ctx, cx, cy) { const k = 1 - o.t / o.life; ctx.globalAlpha = Math.min(1, k * 2.2); ctx.fillStyle = k > 0.55 ? '#ffe08a' : k > 0.25 ? '#ff8a2a' : '#c23a12'; ctx.fillRect(Math.round(o.x - cx), Math.round(o.y - cy - o.z), 2, 2); } });
}
// trace brûlée au sol
function scorch(x, y, rx, ry, life, glowK) {
  const seed = rnd(0, 99);
  return mfx({ life, x, y, cheap: true, passes: ['ground'], upd() { },
    draw(o, ctx, cx, cy) {
      const k = o.t / o.life, a = Math.min(1, (1 - k) * 2.2) * 0.55;
      ctx.globalAlpha = a; ctx.fillStyle = '#140a07'; ctx.beginPath(); ctx.ellipse(x - cx, y - cy, rx, ry, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = a * 0.6; ctx.fillStyle = '#2a1510'; ctx.beginPath(); ctx.ellipse(x - cx, y - cy, rx * 0.7, ry * 0.7, 0, 0, 7); ctx.fill();
      if (glowK) { ctx.globalAlpha = Math.max(0, (1 - k * 1.6)) * glowK * 0.6; ctx.fillStyle = '#ff6a1a'; for (let i = 0; i < 8; i++) { const aa = i * 0.79 + seed, rr = (0.3 + 0.55 * ((i * 37 + seed * 9) % 10) / 10); ctx.fillRect(Math.round(x - cx + Math.cos(aa) * rx * rr), Math.round(y - cy + Math.sin(aa) * ry * rr), 2, 1); } }
      ctx.globalAlpha = 1;
    } });
}
const inCircle = (e, x, y, r) => !e.dead && dist(x, y, e.x, e.y - 8) < r + e.def.r * 0.5;
// frappe de feu (applique brûlure, gère la maîtrise)
function fireHit(P, e, mult, o, noBurn) {
  innateHit(P, e, mult, { st: noBurn ? null : 'burn', kb: (o && o.kb !== undefined) ? o.kb : 70 }, 'feu', o); magicXp(P, 'feu', 0.5);
}
function fireArea(P, x, y, r, mult, o) { let n = 0; for (const e of G.enemies) if (inCircle(e, x, y, r)) { fireHit(P, e, mult, o); n++; } return n; }
function boomRays(x, y, r, life) {
  return mfx({ life, x, y, passes: ['glow'], cheap: true, upd() { }, draw(o, ctx, cx, cy) {
    const k = o.t / o.life; ctx.globalAlpha = 1 - k * k;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.2, r0 = r * 0.2 * k, r1 = r * (0.5 + 0.9 * Math.min(1, k * 1.6)); pxLine(ctx, x - cx + Math.cos(a) * r0, y - cy - 10 + Math.sin(a) * r0 * 0.6, x - cx + Math.cos(a) * r1, y - cy - 10 + Math.sin(a) * r1 * 0.6, i % 2 ? '#ffd24a' : '#ff8a2a', 3); }
    fireBall(ctx, x - cx, y - cy - 10, r * 0.55 * (1 - k * 0.6), o.t * 3, 1, 1 - k * 0.5);
  } });
}
function embers(x, y, n, spd, up) { for (let i = 0; i < n; i++) { const a = rnd(0, 6.28), s = rnd(25, spd || 90); ember(x, y, Math.cos(a) * s, Math.sin(a) * s * 0.6, rnd(up ? up * 0.6 : 70, up || 170), rnd(1, 1.6)); } }
function fcol() { return choice(['#ff8a2a', '#ffcf4a', '#ff4a1a', '#ffe9a0']); }

// ---------------- sons dédiés ----------------
Object.assign(SFX, {
  fb_charge() { noise(.22, .25, 1400, 0, 'bandpass'); tone(140, 420, .2, 'sawtooth', .05); },
  fb_fly() { noise(.4, .3, 2600, 0, 'bandpass'); tone(420, 700, .35, 'triangle', .04); },
  fb_boom() { noise(.35, .7, 700); tone(130, 40, .3, 'sawtooth', .16); noise(.5, .25, 3200, .04, 'highpass'); },
  fb_swirl() { noise(1.1, .35, 700, 0, 'bandpass'); tone(90, 150, 1, 'sawtooth', .07); noise(.9, .2, 3000, .1, 'highpass'); },
  fb_lance() { tone(900, 320, .12, 'sawtooth', .1); noise(.25, .45, 3600, .02, 'highpass'); tone(200, 90, .25, 'sawtooth', .06, .05); },
  fb_rumble() { noise(.9, .5, 220); tone(60, 38, .9, 'sawtooth', .14); noise(.6, .2, 1800, .2, 'bandpass'); },
  fb_fall() { tone(900, 90, .8, 'sawtooth', .09); noise(.8, .35, 1800, 0, 'bandpass'); },
  fb_impact() { noise(.9, .95, 320); tone(70, 24, .8, 'sawtooth', .24); noise(.7, .4, 2000, .1, 'bandpass'); },
  fb_chain() { for (let i = 0; i < 5; i++) { tone(1400 - i * 90, 700, .07, 'square', .04, i * .05); } noise(.35, .3, 2400, 0, 'highpass'); },
  fb_snap() { tone(260, 60, .18, 'sawtooth', .14); noise(.2, .6, 1500); },
  fb_phenix() { tone(1100, 1700, .5, 'triangle', .1); tone(1700, 900, .45, 'sine', .07, .2); noise(.6, .3, 2400, 0, 'bandpass'); },
  fb_wing() { noise(.18, .35, 1100, 0, 'bandpass'); },
  fb_sheath() { noise(.5, .35, 1600, 0, 'bandpass'); tone(300, 600, .35, 'sawtooth', .05); },
  fb_volcan() { tone(70, 28, 1.2, 'sawtooth', .22); noise(1.1, .5, 260); noise(.8, .25, 2600, .3, 'highpass'); },
  fb_sun() { tone(110, 900, 1.6, 'sawtooth', .1); noise(1.6, .4, 600, 0, 'bandpass'); },
  fb_sunboom() { noise(1.4, 1, 260); tone(60, 18, 1.2, 'sawtooth', .3); noise(1.0, .5, 2400, .05, 'bandpass'); },
});

// ---------------- icônes pixel-art des compétences ----------------
const GRIM_ICONS = {};
function grimIcon(fam, g) {
  const key = fam + ':' + g.id; if (GRIM_ICONS[key]) return GRIM_ICONS[key];
  const F = MAGIC_DATA[fam]; const cv = document.createElement('canvas'); cv.width = cv.height = 32; const c = cv.getContext('2d');
  const gr = c.createRadialGradient(16, 18, 2, 16, 16, 20); gr.addColorStop(0, g.bg || '#7a2a10'); gr.addColorStop(1, '#120a08');
  c.fillStyle = '#120a08'; c.fillRect(0, 0, 32, 32); c.fillStyle = gr; c.fillRect(1, 1, 30, 30);
  c.strokeStyle = 'rgba(255,228,170,0.6)'; c.strokeRect(1.5, 1.5, 29, 29);
  if (g.icon) g.icon(c); else glyphIcon(c, g); GRIM_ICONS[key] = cv; cv.url = cv.toDataURL(); return cv;
}
const R_ = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

// ===================================================================
//  FEU — 10 compétences
// ===================================================================
const GRIMOIRE = {};
GRIMOIRE.feu = [
  // 1 ------------------------------------------------------------------
  { id: 'F1', n: 'Brasier initial', role: 'Projectile', mp: 14, cd: 3, bg: '#8a2e0e',
    d: 'Boule de feu concentrée qui accélère en vol, dévie légèrement, explose en étoile et projette des braises qui rebondissent. Brûlure légère.',
    icon(c) { for (let i = 0; i < 6; i++) R_(c, ['#c23a12', '#ff6a1a', '#ff9a2a'][i % 3], 5 + i * 2, 24 - i * 2, 3, 3); R_(c, '#ff5a1a', 17, 7, 9, 9); R_(c, '#ffb43a', 18, 8, 7, 7); R_(c, '#ffe9a0', 20, 10, 3, 3); R_(c, '#ffd24a', 9, 25, 2, 2); R_(c, '#ff8a2a', 25, 22, 2, 2); },
    cast(P, E) {
      sfx('fb_fly'); const a = E.a;
      mfx({ life: 1.5, x: P.x + Math.cos(a) * 18, y: P.y - 2 + Math.sin(a) * 12, ang: a, spd: 120, z: 12, seed: rnd(0, 9), tgt: E.t, passes: ['glow'],
        upd(o, dt) {
          o.spd = Math.min(340, o.spd + 330 * dt);
          let want = o.ang; if (o.tgt && !o.tgt.dead) want = Math.atan2(o.tgt.y - 10 - o.y, o.tgt.x - o.x);
          const d = ((want - o.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI; o.ang += clamp(d, -1.5 * dt, 1.5 * dt) + Math.sin(o.t * 9 + o.seed) * 0.8 * dt;
          o.x += Math.cos(o.ang) * o.spd * dt; o.y += Math.sin(o.ang) * o.spd * dt;
          part(o.x, o.y - o.z, { col: fcol(), life: 0.35, size: 2, add: true, vx: rnd(-14, 14), vy: rnd(-14, 14), rise: 18 }); addLight(o.x, o.y - o.z, 64, '255,150,60', 0.9);
          let hit = null; for (const e of G.enemies) if (inCircle(e, o.x, o.y, 9)) { hit = e; break; }
          if (hit || isSolidTile(Math.floor(o.x / TILE), Math.floor(o.y / TILE)) || o.t > 1.4) {
            o.dead = true; const x = o.x, y = o.y; sfx('fb_boom'); shake(3); boomRays(x, y, 40, 0.3); ring(x, y, 36, '#ffb35a', 0.3, 3); addLight(x, y, 110, '255,160,70', 1);
            fireArea(P, x, y, 34, E.base(1.2), { kb: 100 }); embers(x, y, 7, 100, 190); scorch(x, y, 22, 11, 1.5, 1);
          }
        },
        draw(o, ctx, cx, cy) {
          const x = o.x - cx, y = o.y - cy - o.z; glow(ctx, x, y, 26, '255,120,40', 0.5);
          ctx.globalAlpha = 0.25; for (let i = 1; i < 5; i++) fireBall(ctx, x - Math.cos(o.ang) * i * 5, y - Math.sin(o.ang) * i * 5, Math.max(2, 8 - i * 1.4), o.t, o.seed + i, 0.8); ctx.globalAlpha = 1;
          fireBall(ctx, x, y, 8 + Math.sin(o.t * 16) * 1.2, o.t, o.seed);
        } });
    } },
  // 2 ------------------------------------------------------------------
  { id: 'F2', n: 'Danse des flammes', role: 'Zone autour de soi', mp: 22, cd: 8, bg: '#8a2e0e',
    d: 'Des rubans de feu vivants tournent de façon irrégulière autour de toi et frappent 4 fois en 1,8 s en attirant légèrement les ennemis. Brûlure.',
    icon(c) { c.lineWidth = 3; for (let r = 0; r < 2; r++) { c.strokeStyle = r ? '#ffd24a' : '#ff6a1a'; c.beginPath(); for (let i = 0; i < 26; i++) { const a = i * 0.34 + r * 3, rad = 4 + i * 0.5 + r; c.lineTo(16 + Math.cos(a) * rad, 16 + Math.sin(a) * rad * 0.9); } c.stroke(); } R_(c, '#fff3b0', 14, 14, 4, 4); },
    cast(P, E) {
      sfx('fb_swirl'); flashScreen('#ff7a2a', 0.12); const hitsAt = [0.35, 0.75, 1.15, 1.55]; let hi = 0;
      mfx({ life: 1.8, x: P.x, y: P.y, passes: ['glow'], seed: rnd(0, 9),
        upd(o, dt) {
          o.x = P.x; o.y = P.y; addLight(o.x, o.y - 10, 100, '255,140,60', 0.9);
          if (hi < hitsAt.length && o.t >= hitsAt[hi]) { hi++; shake(2); ring(o.x, o.y, 58, '#ffb35a', 0.25, 2); for (const e of G.enemies) if (inCircle(e, o.x, o.y, 58)) { fireHit(P, e, E.base(0.8), { kb: 20 }); const a = Math.atan2(o.y - e.y, o.x - e.x); e.kbx += Math.cos(a) * 110; e.kby += Math.sin(a) * 110; } }
          if (Math.random() < 0.7) part(o.x + rnd(-40, 40), o.y + rnd(-16, 16), { col: choice(['#555', '#777', '#ffb347']), life: 0.8, size: 1, rise: 30, vx: rnd(-20, 20) });
          if (!o.end && o.t > 1.7) { o.end = true; embers(o.x, o.y, 22, 70, 130); scorch(o.x, o.y, 54, 28, 3.5, 1); }
        },
        draw(o, ctx, cx, cy) {
          const gro = Math.min(1, o.t / 0.3), dis = o.t > 1.5 ? Math.max(0, 1 - (o.t - 1.5) / 0.3) : 1; const x0 = o.x - cx, y0 = o.y - cy;
          glow(ctx, x0, y0 - 10, 70, '255,110,30', 0.25 * gro * dis);
          const W_ = [3.1, -2.4, 4.0, -1.7, 2.6], B = [34, 46, 26, 54, 40];
          for (let r = 0; r < 5; r++) {
            const n = Math.floor(18 * gro * dis); let px_ = null, py_ = null;
            for (let j = 0; j < n; j++) {
              const ang = W_[r] * o.t + j * 0.24 * Math.sign(W_[r]) + o.seed + r, rad = B[r] * (0.65 + 0.35 * Math.sin(o.t * 3 + r * 1.7 + j * 0.3)) * (0.55 + 0.45 * j / 18);
              const x = x0 + Math.cos(ang) * rad, y = y0 - 8 + Math.sin(ang) * rad * 0.55 - j * 0.9 - Math.sin(o.t * 5 + r + j * 0.4) * 3;
              if (px_ !== null) { pxLine(ctx, px_, py_, x, y, j > 11 ? '#ffd24a' : '#ff6a1a', 4 - Math.floor(j / 7)); pxLine(ctx, px_, py_, x, y, j > 9 ? '#fff3b0' : '#ffb43a', 2); }
              px_ = x; py_ = y;
            }
          }
        } });
    } },
  // 3 ------------------------------------------------------------------
  { id: 'F3', n: 'Lance ardente', role: 'Perforation en ligne', mp: 18, cd: 5, bg: '#8a2e0e',
    d: 'Les flammes se compriment en une lance fine qui traverse tous les ennemis alignés. Chaque passage brûle. Laisse une ligne calcinée.',
    icon(c) { for (let i = 0; i < 18; i++) { R_(c, i > 13 ? '#ffffff' : i > 8 ? '#ffd24a' : '#ff6a1a', 4 + i, 26 - i, 3, 3 - (i > 13 ? 1 : 0)); } R_(c, '#c23a12', 4, 26, 4, 2); R_(c, '#ff8a2a', 8, 27, 4, 1); R_(c, '#ff8a2a', 3, 24, 3, 1); },
    cast(P, E) {
      sfx('fb_charge'); const a = E.a; const hit = new Set();
      mfx({ life: 1.2, x: P.x, y: P.y - 12, ang: a, d: 0, passes: ['glow'], seed: rnd(0, 9), trail: [], fired: false,
        upd(o, dt) {
          if (o.t < 0.22) { o.px = P.x + Math.cos(a) * 14; o.py = P.y - 12 + Math.sin(a) * 9; addLight(o.px, o.py, 50, '255,160,70', 0.8); return; }
          if (!o.fired) { o.fired = true; sfx('fb_lance'); o.x = o.px; o.y = o.py; }
          const v = 560 * dt; o.x += Math.cos(a) * v; o.y += Math.sin(a) * v; o.d += v; o.trail.push([o.x, o.y]); if (o.trail.length > 12) o.trail.shift();
          addLight(o.x, o.y, 70, '255,170,80', 0.95);
          if (Math.random() < 0.8) part(o.x, o.y, { col: fcol(), life: 0.3, size: 1, add: true, vx: rnd(-30, 30), vy: rnd(-30, 30) });
          for (const e of G.enemies) if (!hit.has(e) && inCircle(e, o.x, o.y + 12, 12)) { hit.add(e); fireHit(P, e, E.base(1.15), { kb: 140 }); sparks(e.x, e.y - 14, a, 10, '#ffd24a'); shake(2); }
          if (Math.floor(o.d / 26) > (o.lastScorch || 0)) { o.lastScorch = Math.floor(o.d / 26); scorch(o.x, o.y + 12, 13, 6, 2.5, 1); }
          if (o.d > 290 || isSolidTile(Math.floor(o.x / TILE), Math.floor((o.y + 12) / TILE))) { o.dead = true; sparks(o.x, o.y, a + Math.PI, 14, '#ffd24a'); embers(o.x, o.y + 12, 5, 60, 110); boomRays(o.x, o.y + 12, 16, 0.2); }
        },
        draw(o, ctx, cx, cy) {
          if (o.t < 0.22) { const k = o.t / 0.22; const x = o.px - cx, y = o.py - cy; for (let i = 0; i < 12; i++) { const aa = i / 12 * 6.28 + o.t * 6, r = 20 * (1 - k); ctx.fillStyle = fcol(); ctx.fillRect(Math.round(x + Math.cos(aa) * r), Math.round(y + Math.sin(aa) * r * 0.8), 2, 2); } fireBall(ctx, x, y, 3 + k * 4, o.t, o.seed); return; }
          const x = o.x - cx, y = o.y - cy, L = 34;
          for (let w = -1; w <= 1; w++) { ctx.globalAlpha = w ? 0.45 : 0.8; for (let i = 1; i < o.trail.length; i += 2) { const p = o.trail[i]; const off = w * (3 + i * 0.5) * Math.sin(o.t * 18 + i); ctx.fillStyle = w ? '#ff6a1a' : '#ffa42a'; ctx.fillRect(Math.round(p[0] - cx - Math.sin(a) * off), Math.round(p[1] - cy + Math.cos(a) * off), 2, 2); } } ctx.globalAlpha = 1;
          for (let i = 0; i < L; i += 2) { const u = i / L, wd = 1 + 3 * Math.sin(u * 3.1), px_ = x - Math.cos(a) * (L - i), py_ = y - Math.sin(a) * (L - i); ctx.fillStyle = u > 0.85 ? '#ffffff' : u > 0.55 ? '#ffe08a' : u > 0.25 ? '#ff9a2a' : '#c23a12'; ctx.fillRect(Math.round(px_ - wd / 2), Math.round(py_ - wd / 2), Math.ceil(wd), Math.ceil(wd)); }
          glow(ctx, x, y, 22, '255,200,100', 0.5);
        } });
    } },
  // 4 ------------------------------------------------------------------
  { id: 'F4', n: 'Fournaise terrestre', role: 'Zone persistante (5,5 s)', mp: 28, cd: 12, bg: '#6a1a0a',
    d: 'Le sol se fissure et devient une plaie de magma bouillonnante qui s\'étend lentement. Brûle et ralentit fortement ceux qui s\'y trouvent.',
    icon(c) { R_(c, '#2a100a', 4, 18, 24, 9); const L = [[6, 20, 12, 24], [12, 24, 18, 20], [18, 20, 26, 25], [16, 21, 15, 15], [15, 15, 20, 10], [10, 22, 6, 17]]; c.lineWidth = 2; for (const [a, b, d, e] of L) { c.strokeStyle = '#ff6a1a'; c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); } c.strokeStyle = '#ffd24a'; c.lineWidth = 1; c.beginPath(); c.moveTo(12, 24); c.lineTo(18, 20); c.stroke(); R_(c, '#ffb43a', 19, 7, 3, 3); R_(c, '#ff8a2a', 9, 11, 2, 2); },
    cast(P, E) {
      sfx('fb_rumble'); shake(4); const tx = E.tx, ty = E.ty; const cracks = [];
      for (let i = 0; i < 9; i++) { const pts = [[0, 0]]; let a = i / 9 * 6.28 + rnd(-0.3, 0.3), x = 0, y = 0; for (let k = 0; k < 5; k++) { a += rnd(-0.5, 0.5); const l = rnd(9, 17); x += Math.cos(a) * l; y += Math.sin(a) * l * 0.55; pts.push([x, y]); } cracks.push(pts); }
      let tick = 0; const bubbles = [];
      mfx({ life: 5.8, x: tx, y: ty, big: true, passes: ['ground', 'glow'], R: 44,
        upd(o, dt) {
          const k = o.t / o.life; o.R = 44 + 16 * Math.min(1, o.t / 3); addLight(o.x, o.y, o.R + 30, '255,90,30', (o.t < 0.5 ? o.t * 2 : 1) * (k > 0.85 ? (1 - k) / 0.15 : 1) * 0.9);
          if (o.t < 0.15) return; tick -= dt;
          if (tick <= 0 && k < 0.97) { tick = 0.5; for (const e of G.enemies) if (inCircle(e, o.x, o.y, o.R)) { fireHit(P, e, E.base(0.4), { kb: 0 }); e.slowT = Math.max(e.slowT || 0, 1.2); } }
          if (Math.random() < 0.5 && k < 0.9) { part(o.x + rnd(-o.R, o.R) * 0.8, o.y + rnd(-o.R, o.R) * 0.4, { col: fcol(), rise: rnd(30, 70), life: 0.7, size: 2, add: true, vx: rnd(-8, 8) }); }
          if (Math.random() < 0.08 && k < 0.85) bubbles.push({ x: rnd(-o.R, o.R) * 0.7, y: rnd(-o.R, o.R) * 0.35, t: 0 });
          for (const b of bubbles) { b.t += dt; if (!b.pop && b.t > 0.5) { b.pop = true; for (let i = 0; i < 4; i++) part(o.x + b.x, o.y + b.y, { col: '#ffcf4a', vz: rnd(30, 80), vx: rnd(-30, 30), vy: rnd(-20, 20), g: 260, life: 0.5, size: 2, add: true }); } }
          while (bubbles.length && bubbles[0].t > 0.6) bubbles.shift();
          if (!o.imp) { o.imp = true; ring(o.x, o.y, 60, '#ff8a2a', 0.5, 4); burst(o.x, o.y, 22, ['#ff8a2a', '#ffcf4a', '#3a1a10'], { add: false }); }
        },
        draw(o, ctx, cx, cy, pass) {
          const k = o.t / o.life, fade = k > 0.85 ? Math.max(0, (1 - k) / 0.15) : 1, spread = Math.min(1, o.t / 0.5), R = o.R, x = o.x - cx, y = o.y - cy; const ash = k > 0.85 ? (k - 0.85) / 0.15 : 0;
          if (pass === 'ground') {
            ctx.globalAlpha = 0.7 * Math.min(1, o.t * 4) * (ash ? 1 - ash * 0.6 : 1); ctx.fillStyle = ash ? '#3a3633' : '#1a0c08'; ctx.beginPath(); ctx.ellipse(x, y, R * spread, R * 0.55 * spread, 0, 0, 7); ctx.fill();
            ctx.globalAlpha = 0.5 * Math.min(1, o.t * 4) * (1 - ash); ctx.fillStyle = '#3a160c'; ctx.beginPath(); ctx.ellipse(x, y, R * 0.82 * spread, R * 0.45 * spread, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
          } else {
            const pul = 0.75 + 0.25 * Math.sin(o.t * 6); ctx.globalAlpha = fade;
            for (const cr of cracks) { const n = Math.min(cr.length - 1, Math.floor(spread * (cr.length - 1) + 0.999)); for (let i = 0; i < n; i++) { const s = R / 44, a0 = cr[i], b0 = cr[i + 1]; const f = (i === n - 1) ? (spread * (cr.length - 1) - i) : 1; const bx = a0[0] + (b0[0] - a0[0]) * Math.min(1, f), by = a0[1] + (b0[1] - a0[1]) * Math.min(1, f); pxLine(ctx, x + a0[0] * s, y + a0[1] * s, x + bx * s, y + by * s, '#d6481a', 4); pxLine(ctx, x + a0[0] * s, y + a0[1] * s, x + bx * s, y + by * s, pul > 0.85 ? '#fff3b0' : '#ffb43a', 2); } }
            glow(ctx, x, y, R, '255,90,30', 0.28 * fade * pul);
            for (const b of bubbles) { const kk = b.t / 0.5; if (kk < 1) { const rr = 1 + kk * 3; ctx.fillStyle = '#ff9a2a'; ctx.fillRect(Math.round(x + b.x - rr), Math.round(y + b.y - rr * 0.6), Math.round(rr * 2), Math.round(rr * 1.2)); ctx.fillStyle = '#ffe08a'; ctx.fillRect(Math.round(x + b.x - rr / 2), Math.round(y + b.y - rr * 0.3), Math.max(1, Math.round(rr)), 1); } }
            ctx.globalAlpha = 1;
          }
        } });
    } },
  // 5 ------------------------------------------------------------------
  { id: 'F5', n: 'Météore incandescent', role: 'Zone ciblée — impact massif', mp: 34, cd: 14, bg: '#6a1a0a',
    d: 'Le ciel s\'assombrit : un rocher enflammé s\'écrase sur la zone visée avec une onde de choc, projette des débris brûlants et laisse un cratère.',
    icon(c) { for (let i = 0; i < 8; i++) { R_(c, ['#7a1a0a', '#c23a12', '#ff6a1a', '#ffb43a'][Math.min(3, i >> 1)], 3 + i * 2, 5 + i * 2, 4, 4); } R_(c, '#3a2418', 18, 17, 9, 8); R_(c, '#5a3a24', 20, 18, 5, 4); R_(c, '#ff8a2a', 26, 21, 2, 2); R_(c, '#ffd24a', 14, 22, 2, 2); R_(c, '#1a0c08', 6, 27, 20, 2); },
    cast(P, E) {
      sfx('fb_fall'); const tx = E.tx, ty = E.ty, FALL = 0.95; const hist = []; let impacted = false; const sx = tx + 80, sy = ty - 330;
      mfx({ life: FALL + 0.9, x: tx, y: ty, big: true, passes: ['ground', 'top', 'glow'], seed: rnd(0, 9),
        upd(o, dt) {
          if (o.t < FALL) { const u = o.t / FALL, e = u * u; o.mx = sx + (tx - sx) * e; o.my = sy + (ty - sy) * e; hist.push([o.mx, o.my]); if (hist.length > 16) hist.shift(); addLight(o.mx, o.my, 100, '255,140,50', 0.9); if (Math.random() < 0.9) part(o.mx, o.my, { col: fcol(), life: 0.5, size: 2, add: true, vx: rnd(-20, 20), vy: rnd(-20, 20) }); }
          else if (!impacted) {
            impacted = true; sfx('fb_impact'); shake(11); flashScreen('#ffcf80', 0.38); slowmo(0.18, 0.3);
            ring(tx, ty, 72, '#ffcf80', 0.45, 6); ring(tx, ty, 46, '#ff6a1a', 0.35, 4); ring(tx, ty, 100, '#a8501a', 0.6, 3); boomRays(tx, ty, 70, 0.45); addLight(tx, ty, 160, '255,160,70', 1);
            fireArea(P, tx, ty, 64, E.base(2.4), { kb: 250, stun: 0.35 });
            scorch(tx, ty, 50, 26, 7, 1);
            for (let i = 0; i < 9; i++) {
              const a = i / 9 * 6.28 + rnd(-0.3, 0.3), s = rnd(60, 130); let landed = false;
              mfx({ life: 2.2, x: tx, y: ty, z: 6, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: rnd(150, 260), cheap: true, passes: ['top', 'glow'],
                upd(d, dt) { d.vz -= 520 * dt; d.z += d.vz * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.z <= 0) { d.z = 0; if (!landed) { landed = true; d.vx = d.vy = d.vz = 0; fireArea(P, d.x, d.y, 15, E.base(0.45), { kb: 40 }); burst(d.x, d.y, 4, ['#ffcf4a', '#ff8a2a'], { add: true }); } } if (landed) { addLight(d.x, d.y, 24, '255,120,40', 0.5); if (Math.random() < 0.3) part(d.x, d.y - 3, { col: fcol(), rise: 30, life: 0.4, size: 1, add: true }); } },
                draw(d, ctx, cx, cy, pass) { const x = Math.round(d.x - cx), y = Math.round(d.y - cy - d.z); if (pass === 'top') { ctx.fillStyle = '#2a170f'; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillStyle = landed ? '#c23a12' : '#5a3a24'; ctx.fillRect(x - 1, y - 1, 2, 2); } else if (!landed) { ctx.fillStyle = '#ff8a2a'; ctx.fillRect(x - 3, y - 3, 3, 3); } else { ctx.globalAlpha = Math.max(0, 1 - d.t / 2.2); ctx.fillStyle = '#ff6a1a'; ctx.fillRect(x - 1, y - 1, 3, 2); } } });
            }
            embers(tx, ty, 10, 120, 200);
          }
        },
        draw(o, ctx, cx, cy, pass) {
          const x = o.x - cx, y = o.y - cy;
          if (pass === 'ground') {
            if (o.t < FALL) { const k = o.t / FALL; ctx.globalAlpha = 0.35 + 0.35 * Math.sin(o.t * 22) * 0.5; ctx.strokeStyle = '#ff4a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 64, 35, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, 64 * (1 - k), 35 * (1 - k), 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
            else { const k = (o.t - FALL) / 0.9; ctx.globalAlpha = Math.max(0, 1 - k) * 0.6; ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.ellipse(x, y, 30, 15, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
          } else if (pass === 'top') {
            const dk = o.t < FALL ? Math.min(1, o.t / 0.4) : Math.max(0, 1 - (o.t - FALL) / 0.8); // assombrissement local du ciel
            if (dk > 0) { const g = ctx.createRadialGradient(x, y - 30, 20, x, y - 30, 190); g.addColorStop(0, 'rgba(14,4,6,' + 0.5 * dk + ')'); g.addColorStop(1, 'rgba(14,4,6,0)'); ctx.fillStyle = g; ctx.fillRect(x - 200, y - 230, 400, 400); }
            if (o.t < FALL) { const mx = o.mx - cx, my = o.my - cy; const rot = o.t * 6; ctx.fillStyle = '#241410'; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 + rot * 0.2, r = 11 + Math.sin(i * 2.3 + o.seed) * 3; ctx.fillRect(Math.round(mx + Math.cos(a) * r * 0.55 - 3), Math.round(my + Math.sin(a) * r * 0.55 - 3), 6, 6); } ctx.fillStyle = '#4a2c1c'; ctx.fillRect(Math.round(mx - 7), Math.round(my - 6), 12, 11); ctx.fillStyle = '#6a4228'; ctx.fillRect(Math.round(mx - 4), Math.round(my - 5), 5, 4); ctx.fillStyle = '#ff6a1a'; ctx.fillRect(Math.round(mx - 5 + Math.sin(rot) * 2), Math.round(my + 1), 4, 2); }
          } else if (o.t < FALL) {
            const mx = o.mx - cx, my = o.my - cy; for (let i = 0; i < hist.length; i++) { const p = hist[i], u = i / hist.length; ctx.globalAlpha = u * 0.8; fireBall(ctx, p[0] - cx, p[1] - cy, 3 + u * 11, o.t + i * 0.1, o.seed + i, 0.6 + u * 0.4); } ctx.globalAlpha = 1; fireBall(ctx, mx, my, 17, o.t, o.seed); glow(ctx, mx, my, 50, '255,130,40', 0.5);
          }
        } });
    } },
  // 6 ------------------------------------------------------------------
  { id: 'F6', n: 'Chaînes pyriques', role: 'Contrôle de zone (2,8 s)', mp: 24, cd: 11, bg: '#7a2a10',
    d: 'Des serpents de flammes jaillissent du sol, s\'enroulent autour de jusqu\'à 4 ennemis et les immobilisent en les brûlant avant de rompre dans une explosion.',
    icon(c) { for (let i = 0; i < 3; i++) { c.strokeStyle = '#ff9a2a'; c.lineWidth = 3; c.strokeRect(6 + i * 7, 12 + (i % 2) * 5, 8, 6); c.strokeStyle = '#ffe08a'; c.lineWidth = 1; c.strokeRect(7.5 + i * 7, 13.5 + (i % 2) * 5, 5, 3); } R_(c, '#ff6a1a', 4, 22, 5, 7); R_(c, '#ffb43a', 5, 20, 3, 5); R_(c, '#ff6a1a', 22, 5, 5, 7); R_(c, '#ffb43a', 23, 4, 3, 5); },
    cast(P, E) {
      sfx('fb_chain'); let targets = G.enemies.filter(e => !e.dead && dist(E.tx, E.ty, e.x, e.y) < 100).sort((a, b) => dist(E.tx, E.ty, a.x, a.y) - dist(E.tx, E.ty, b.x, b.y)).slice(0, 4);
      const deco = targets.length === 0; if (deco) targets = [{ x: E.tx - 14, y: E.ty, dead: false, def: { r: 8 }, fake: true }, { x: E.tx + 14, y: E.ty + 4, dead: false, def: { r: 8 }, fake: true }];
      const LIFE = 2.9; let tick = 0, burst_ = false; const seed = rnd(0, 9);
      mfx({ life: LIFE, x: E.tx, y: E.ty, big: true, passes: ['ground', 'glow'],
        upd(o, dt) {
          tick -= dt; const alive = targets.filter(e => !e.dead);
          if (o.t > 0.3) for (const e of alive) if (!e.fake) { if (e.def.boss && o.t > 1.5) continue; e.rootT = Math.max(e.rootT || 0, 0.15); }
          if (o.t > 0.5 && tick <= 0) { tick = 0.5; for (const e of alive) if (!e.fake) fireHit(P, e, E.base(0.22), { kb: 0 }, false); }
          for (const e of alive) if (o.t > 0.3 && Math.random() < 0.3) part(e.x + rnd(-8, 8), e.y - rnd(0, 30), { col: fcol(), rise: 30, life: 0.45, size: 2, add: true });
          if (o.t > 0.3 && o.t < 0.36) sfx('fb_chain');
          if (!burst_ && o.t >= LIFE - 0.12) { burst_ = true; sfx('fb_snap'); shake(5); for (const e of alive) { ring(e.x, e.y, 30, '#ffb35a', 0.3, 3); boomRays(e.x, e.y, 28, 0.28); if (!e.fake) fireArea(P, e.x, e.y, 26, E.base(0.8), { kb: 120 }); embers(e.x, e.y, 5, 90, 150); scorch(e.x, e.y, 16, 8, 2.5, 1); } }
        },
        draw(o, ctx, cx, cy, pass) {
          const alive = targets.filter(e => !e.dead); const grow = clamp((o.t - 0.3) / 0.4, 0, 1), pre = clamp(o.t / 0.3, 0, 1), endK = o.t > LIFE - 0.2 ? Math.max(0, (LIFE - o.t) / 0.2) : 1;
          for (const e of alive) {
            const x = e.x - cx, y = e.y - cy;
            if (pass === 'ground') { ctx.globalAlpha = 0.5 * pre * endK; ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.ellipse(x, y, 16 + grow * 4, 8, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#1a0c08'; ctx.beginPath(); ctx.ellipse(x, y, 10, 5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; continue; }
            if (grow <= 0) continue;
            for (let s = 0; s < 2; s++) { // deux serpents entrelacés
              const n = Math.floor(22 * grow * endK); let px_ = null, py_ = null;
              for (let j = 0; j < n; j++) {
                const u = j / 22, ang = o.t * (3.4 + s * 0.6) + u * 10 + s * Math.PI + seed, rad = 13 * (1 - 0.25 * u), z = 2 + u * 34;
                const xx = x + Math.cos(ang) * rad, yy = y + Math.sin(ang) * rad * 0.55 - z;
                if (px_ !== null) { pxLine(ctx, px_, py_, xx, yy, '#c23a12', 4); pxLine(ctx, px_, py_, xx, yy, '#ff9a2a', 2); }
                if (j % 4 === 2) { ctx.fillStyle = '#ffd24a'; ctx.fillRect(Math.round(xx - 2), Math.round(yy - 2), 4, 4); ctx.fillStyle = '#5a1608'; ctx.fillRect(Math.round(xx - 1), Math.round(yy - 1), 2, 2); }
                px_ = xx; py_ = yy;
              }
              if (n > 4) flameTongue(ctx, px_, py_ + 1, 9, 3, o.t, seed + s);
            }
            glow(ctx, x, y - 16, 28, '255,110,30', 0.3 * endK);
          }
          if (pass === 'glow') for (let i = 0; i + 1 < alive.length; i++) { // maillons entre les cibles
            const a = alive[i], b = alive[i + 1]; const n = Math.floor(8 * grow * endK);
            for (let j = 1; j < n; j++) { const u = j / 8, xx = lerp(a.x, b.x, u) - cx, yy = lerp(a.y, b.y, u) - cy - 14 + Math.sin(u * 3.14) * 8 + Math.sin(o.t * 8 + j) * 1.5; ctx.fillStyle = j % 2 ? '#ffb43a' : '#ff6a1a'; ctx.fillRect(Math.round(xx - 2), Math.round(yy - 1), 4, 3); }
          }
        } });
    } },
  // 7 ------------------------------------------------------------------
  { id: 'F7', n: 'Phénix incandescent', role: 'Invocation offensive en ligne', mp: 36, cd: 15, bg: '#7a2a10',
    d: 'Un phénix de pure flamme jaillit d\'un cercle de feu, traverse le terrain en brûlant tout sur son passage et explose en deux ailes de feu à l\'arrivée.',
    icon(c) { R_(c, '#ff6a1a', 13, 13, 6, 8); R_(c, '#ffd24a', 14, 14, 4, 5); R_(c, '#ffffff', 15, 15, 2, 2); R_(c, '#ffb43a', 14, 10, 4, 4); R_(c, '#ffe9a0', 19, 11, 3, 1); for (let i = 0; i < 5; i++) { R_(c, i % 2 ? '#ffb43a' : '#ff6a1a', 11 - i * 2, 12 + i, 3, 2); R_(c, i % 2 ? '#ffb43a' : '#ff6a1a', 19 + i * 2, 12 + i, 3, 2); } for (let i = 0; i < 3; i++) R_(c, '#c23a12', 14 + i * 2, 22 + i * 2, 2, 4); },
    cast(P, E) {
      sfx('fb_phenix'); let a = E.a; let D = 230; while (D > 40 && !lineClear(P.x, P.y, P.x + Math.cos(a) * D, P.y + Math.sin(a) * D)) D -= 20;
      const x0 = P.x, y0 = P.y, hit = new Set(); const FLY = 0.95, BEFORE = 0.45; let boomed = false; const ex = x0 + Math.cos(a) * D, ey = y0 + Math.sin(a) * D; const seed = rnd(0, 9);
      mfx({ life: BEFORE + FLY + 0.8, x: x0, y: y0, big: true, passes: ['ground', 'glow'],
        upd(o, dt) {
          const u = clamp((o.t - BEFORE) / FLY, 0, 1), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; o.bx = lerp(x0, ex, o.t < BEFORE ? 0 : e); o.by = lerp(y0, ey, o.t < BEFORE ? 0 : e); o.bz = 14 + 12 * Math.min(1, o.t / BEFORE) + Math.sin(o.t * 5) * 3;
          if (o.t > BEFORE * 0.7 && o.t < BEFORE + FLY) { addLight(o.bx, o.by - o.bz, 120, '255,150,60', 1); if (Math.random() < 0.9) part(o.bx + rnd(-10, 10), o.by - o.bz + rnd(-4, 4), { col: fcol(), life: 0.7, size: 2, add: true, vy: 20, vx: rnd(-15, 15), rise: -10 }); if (Math.random() < 0.3) ember(o.bx + rnd(-8, 8), o.by + rnd(-4, 4), rnd(-20, 20), rnd(-10, 10), rnd(20, 50), 1, o.bz); }
          if (o.t >= BEFORE && o.t < BEFORE + FLY) { for (const en of G.enemies) if (!hit.has(en) && inCircle(en, o.bx, o.by, 20)) { hit.add(en); fireHit(P, en, E.base(1.25), { kb: 150 }); sparks(en.x, en.y - 14, a, 8, '#ffd24a'); } if (Math.floor((o.t - BEFORE) / 0.12) > (o.ls || 0)) { o.ls = Math.floor((o.t - BEFORE) / 0.12); scorch(o.bx, o.by, 12, 6, 3, 1); } }
          if (!boomed && o.t >= BEFORE + FLY) { boomed = true; sfx('fb_boom'); sfx('fb_phenix'); shake(8); flashScreen('#ffb060', 0.25); ring(ex, ey, 64, '#ffb35a', 0.4, 5); fireArea(P, ex, ey, 60, E.base(1.9), { kb: 230 }); o.wx = ex; o.wy = ey; for (let i = 0; i < 22; i++) ember(ex + rnd(-40, 40), ey + rnd(-20, 20), rnd(-20, 20), rnd(-10, 10), rnd(-30, 20), rnd(1, 1.7), rnd(40, 90)); }
        },
        draw(o, ctx, cx, cy, pass) {
          if (pass === 'ground') { if (o.t < BEFORE + 0.2) { const k = Math.min(1, o.t / 0.2) * (o.t > BEFORE ? Math.max(0, 1 - (o.t - BEFORE) / 0.2) : 1); drawCircle(ctx, x0 - cx, y0 - cy, 36, o.t * 3, '255,130,40', k); drawCircle(ctx, x0 - cx, y0 - cy, 22, -o.t * 4, '255,220,120', k * 0.8); } if (o.bx !== undefined && o.t < BEFORE + FLY) { ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(o.bx - cx, o.by - cy, 13 - o.bz * 0.1, 5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } return; }
          if (o.bx !== undefined && o.t < BEFORE + FLY) {
            const x = o.bx - cx, y = o.by - cy - o.bz, rise = Math.min(1, o.t / BEFORE), flap = Math.sin(o.t * 15), ft = (a > -1.57 && a < 1.57) ? 1 : -1;
            glow(ctx, x, y, 44, '255,120,40', 0.4 * rise);
            for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 6; i++) { const ang = -Math.PI / 2 + s * (0.5 + i * 0.2 + flap * 0.35 * (1 - i * 0.1)) , L = (10 + i * 4) * rise; pxLine(ctx, x + s * 4, y - 2, x + s * 4 + Math.cos(ang) * L * 1.4, y - 2 + Math.sin(ang) * L * 0.9 + 4, i % 2 ? '#ffb43a' : '#ff6a1a', 4 - (i > 3 ? 1 : 0)); pxLine(ctx, x + s * 4, y - 2, x + s * 4 + Math.cos(ang) * L * 1.25, y - 2 + Math.sin(ang) * L * 0.8 + 4, '#ffe08a', 2); }
            for (let i = -1; i <= 1; i++) for (let k = 0; k < 4; k++) { const tx_ = x - Math.cos(a) * (8 + k * 8) + Math.sin(o.t * 9 + i + k) * 3, ty_ = y - Math.sin(a) * (4 + k * 5) + i * 4 + 6 + k * 2; ctx.fillStyle = k < 2 ? '#ffb43a' : '#c23a12'; ctx.fillRect(Math.round(tx_), Math.round(ty_), 3, 3); }
            fireBall(ctx, x, y, 8, o.t, seed, 1); fireBall(ctx, x + Math.cos(a) * 8, y - 4 + Math.sin(a) * 3, 5, o.t, seed + 3, 1); ctx.fillStyle = '#ffe9a0'; ctx.fillRect(Math.round(x + Math.cos(a) * 12), Math.round(y - 3 + Math.sin(a) * 4), 4, 2);
          }
          if (o.wx !== undefined) { const k = clamp((o.t - BEFORE - FLY) / 0.55, 0, 1); ctx.globalAlpha = 1 - k * k; const px_ = -Math.sin(a), py_ = Math.cos(a); for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 9; i++) { const sp = 0.25 + i * 0.12, L = (20 + i * 5) * Math.min(1, k * 2.2 + 0.2); const dx = Math.cos(a) * (1 - sp) * 0.6 + px_ * s * sp * 1.6, dy = (Math.sin(a) * (1 - sp) * 0.6 + py_ * s * sp * 1.6) * 0.6; pxLine(ctx, o.wx - cx, o.wy - cy - 8, o.wx - cx + dx * L, o.wy - cy - 8 + dy * L, i % 3 ? '#ff9a2a' : '#ffd24a', 4 - Math.floor(i / 4)); } fireBall(ctx, o.wx - cx, o.wy - cy - 8, 14 * (1 - k * 0.5), o.t * 2, seed, 1 - k * 0.4); ctx.globalAlpha = 1; }
        } });
    } },
  // 8 ------------------------------------------------------------------
  { id: 'F8', n: 'Fourreau solaire', role: 'Renforcement d\'arme (9 s)', mp: 20, cd: 18, bg: '#8a3a10',
    d: 'Des flammes épousent ton arme : chaque coup ajoute des dégâts de feu, enflamme l\'ennemi et laisse une traînée de braises. S\'éteint progressivement.',
    icon(c) { c.lineWidth = 3; c.strokeStyle = '#d6dbe4'; c.beginPath(); c.moveTo(8, 26); c.lineTo(23, 9); c.stroke(); R_(c, '#8a6a3a', 5, 24, 5, 4); R_(c, '#ff6a1a', 15, 5, 5, 9); R_(c, '#ffb43a', 16, 7, 3, 6); R_(c, '#ffffff', 17, 9, 1, 3); R_(c, '#ffd24a', 22, 14, 3, 3); R_(c, '#ff8a2a', 11, 12, 2, 2); R_(c, '#ffd24a', 24, 6, 2, 2); },
    cast(P, E) {
      sfx('fb_sheath'); P.buffs.fourreau = G.t + 9; P.dirty = true; ring(P.x, P.y, 34, '#ffb35a', 0.4, 3); const seed = rnd(0, 9);
      for (const o of G.mfx) if (o.kind === 'fourreau') o.dead = true;
      mfx({ kind: 'fourreau', life: 9, x: P.x, y: P.y, passes: ['glow'],
        upd(o, dt) { o.x = P.x; o.y = P.y; if (!(P.buffs.fourreau > G.t)) { o.dead = true; return; } const f = Math.min(1, (P.buffs.fourreau - G.t) / 1.5); const d = DIRV[P.dir]; const tx = P.x + d[0] * 22, ty = P.y - 16 + d[1] * 8; addLight(tx, ty, 54 * f, '255,150,60', 0.8 * f); if (Math.random() < (P.state === 'attack' ? 0.95 : 0.25) * f) part(tx + rnd(-4, 4), ty + rnd(-4, 4), { col: fcol(), life: 0.45, size: 2, add: true, rise: 25, vx: rnd(-20, 20) }); if (P.state === 'attack' && Math.random() < 0.6) { ember(tx, P.y, rnd(-30, 30), rnd(-20, 20), rnd(20, 60), 0.9, 14); } },
        draw(o, ctx, cx, cy) {
          const f = Math.min(1, (P.buffs.fourreau - G.t) / 1.5), sw = P.state === 'attack' ? 1.4 : 1, d = DIRV[P.dir]; const hx = P.x - cx + d[0] * 8, hy = P.y - cy - 13 + d[1] * 4;
          for (let k = 0; k < 5; k++) { const u = k / 4, x = hx + d[0] * (8 + u * 16), y = hy + d[1] * (4 + u * 8); flameTongue(ctx, x, y + 2, (9 + 7 * (1 - u)) * f * sw, 3 + 2 * (1 - u), G.t, seed + k * 1.7, 0.95); }
          glow(ctx, hx + d[0] * 16, hy + d[1] * 8, 24 * f, '255,140,50', 0.35 * f);
        } });
    } },
  // 9 ------------------------------------------------------------------
  { id: 'F9', n: 'Cœur du volcan', role: 'Transformation (7 s)', mp: 30, cd: 22, bg: '#8a2e0e',
    d: 'Tu deviens un volcan vivant : dégâts accrus, tes coups déclenchent de petites explosions et chaque esquive laisse des flammes derrière toi. Finit en cendres.',
    icon(c) { c.fillStyle = '#3a1c12'; c.beginPath(); c.moveTo(3, 28); c.lineTo(12, 13); c.lineTo(20, 13); c.lineTo(29, 28); c.fill(); R_(c, '#ff6a1a', 12, 10, 8, 4); R_(c, '#ffd24a', 14, 8, 4, 4); R_(c, '#ff8a2a', 9, 4, 2, 3); R_(c, '#ffb43a', 21, 5, 2, 3); c.strokeStyle = '#ff8a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(14, 16); c.lineTo(12, 22); c.lineTo(15, 27); c.moveTo(19, 16); c.lineTo(21, 23); c.stroke(); },
    cast(P, E) {
      sfx('fb_volcan'); shake(6); flashScreen('#ff7a2a', 0.22); P.buffs.volcan = G.t + 7; P.dirty = true; slowmo(0.2, 0.4);
      const cr = []; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 + rnd(-0.2, 0.2); const pts = [[0, 0]]; let x = 0, y = 0, aa = a; for (let k = 0; k < 4; k++) { aa += rnd(-0.4, 0.4); x += Math.cos(aa) * rnd(10, 16); y += Math.sin(aa) * rnd(10, 16) * 0.55; pts.push([x, y]); } cr.push(pts); }
      mfx({ life: 1.3, x: P.x, y: P.y, passes: ['ground'], upd(o) { addLight(o.x, o.y, 90, '255,100,40', 1 - o.t / 1.3); }, draw(o, ctx, cx, cy) { const k = o.t / 1.3; ctx.globalAlpha = (1 - k); for (const pts of cr) { const n = Math.min(pts.length - 1, Math.ceil(Math.min(1, o.t / 0.35) * (pts.length - 1))); for (let i = 0; i < n; i++) { pxLine(ctx, o.x - cx + pts[i][0], o.y - cy + pts[i][1], o.x - cx + pts[i + 1][0], o.y - cy + pts[i + 1][1], '#ff6a1a', 3); pxLine(ctx, o.x - cx + pts[i][0], o.y - cy + pts[i][1], o.x - cx + pts[i + 1][0], o.y - cy + pts[i + 1][1], '#ffe08a', 1); } } } });
      embers(P.x, P.y, 16, 100, 190); ring(P.x, P.y, 60, '#ff8a2a', 0.5, 5);
      for (const o of G.mfx) if (o.kind === 'volcan') o.dead = true;
      mfx({ kind: 'volcan', life: 7, x: P.x, y: P.y, passes: ['glow'], seed: rnd(0, 9),
        upd(o, dt) { o.x = P.x; o.y = P.y; const left = P.buffs.volcan - G.t; if (left <= 0 || P.state === 'dead') { o.dead = true; for (let i = 0; i < 26; i++) part(P.x + rnd(-8, 8), P.y - rnd(0, 34), { col: choice(['#555', '#777', '#999', '#ffb347']), life: rnd(0.6, 1.3), size: 2, vx: rnd(-25, 25), vy: rnd(-8, 8), rise: rnd(10, 40), g: 0 }); toast('Le volcan s\'éteint…', '#ffb35a'); return; } addLight(P.x, P.y - 14, 90, '255,110,40', 0.9); if (Math.random() < 0.35) part(P.x + rnd(-8, 8), P.y - rnd(20, 36), { col: choice(['#9a9a9a', '#cfcfcf']), life: 0.8, size: 2, rise: 28, vx: rnd(-10, 10) }); if (Math.random() < 0.5) part(P.x + rnd(-10, 10), P.y - rnd(0, 30), { col: fcol(), life: 0.5, size: 2, add: true, rise: 30 }); },
        draw(o, ctx, cx, cy) {
          const left = P.buffs.volcan - G.t, f = Math.min(1, left / 1.2) * Math.min(1, o.t / 0.5), x = P.x - cx, y = P.y - cy, pul = 0.6 + 0.4 * Math.sin(o.t * 7);
          glow(ctx, x, y - 16, 34, '255,100,30', 0.4 * f * pul); glow(ctx, x, y - 16, 18, '255,200,100', 0.22 * f);
          ctx.globalAlpha = f; const C = [[-5, -30, -3, -22, -6, -14], [4, -31, 6, -22, 3, -12], [-2, -20, 1, -13, -1, -5], [6, -18, 4, -12, 7, -6], [-7, -24, -8, -16, -5, -9]];
          for (const [a, b, c, d, e, g] of C) { pxLine(ctx, x + a, y + b, x + c, y + d, '#ff6a1a', 2); pxLine(ctx, x + c, y + d, x + e, y + g, '#ffb43a', 2); pxLine(ctx, x + a, y + b, x + c, y + d, pul > 0.8 ? '#ffffff' : '#ffd24a', 1); }
          if (P.dir !== 0) { ctx.fillStyle = '#fff3b0'; const ex = P.dir === 2 ? 3 : 2; const sx = P.dir === 1 ? -2 : P.dir === 3 ? 2 : 0; ctx.fillRect(Math.round(x - ex + sx - 1), Math.round(y - 29), 2, 2); ctx.fillRect(Math.round(x + ex + sx - 1), Math.round(y - 29), 2, 2); }
          ctx.globalAlpha = 1;
        } });
    } },
  // 10 (ultime) --------------------------------------------------------
  { id: 'F10', n: 'Soleil dévorant', role: 'Ultime', mp: 0, cd: 0, bg: '#a8501a', ult: true,
    d: 'Une sphère solaire se forme au-dessus de la cible, attire tout ce qui l\'entoure puis explose dans un flash aveuglant, calcinant le terrain.',
    icon(c) { glowI(c, 16, 16, 12, '255,210,120', 0.55); R_(c, '#ffd24a', 10, 10, 12, 12); R_(c, '#fff3b0', 12, 12, 8, 8); R_(c, '#ffffff', 14, 14, 4, 4); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; R_(c, i % 2 ? '#ffb43a' : '#ff6a1a', Math.round(16 + Math.cos(a) * 12) - 1, Math.round(16 + Math.sin(a) * 12) - 1, 3, 3); } },
    cast(P, E) {
      sfx('fb_sun'); const tx = E.tx, ty = E.ty; let boom_ = false; const seed = rnd(0, 9); const CHARGE = 0.7, PULL = 1.75;
      mfx({ life: CHARGE + PULL + 1.2, x: tx, y: ty, big: true, passes: ['ground', 'top', 'glow'],
        upd(o, dt) {
          const sz = o.t < CHARGE ? 1 : 1; o.sy = ty - 75; addLight(tx, o.sy, 170, '255,200,120', Math.min(1, o.t / 0.5) * 1.1);
          if (o.t > CHARGE && o.t < CHARGE + PULL) {
            for (const e of G.enemies) if (!e.dead && dist(tx, ty, e.x, e.y) < 170) { const a = Math.atan2(ty - e.y, tx - e.x); e.kbx += Math.cos(a) * 1500 * dt; e.kby += Math.sin(a) * 1500 * dt; }
            o.tk = (o.tk || 0) - dt; if (o.tk <= 0) { o.tk = 0.45; for (const e of G.enemies) if (inCircle(e, tx, ty, 120)) fireHit(P, e, E.base(0.3), { kb: 0 }); }
            for (let i = 0; i < 3; i++) { const a = rnd(0, 6.28), r = rnd(110, 170), x = tx + Math.cos(a) * r, y = ty + Math.sin(a) * r * 0.6, T = 0.55; part(x, y, { vx: (tx - x) / T, vy: (o.sy + 55 - y) / T, col: fcol(), life: T, size: 2, add: true, drag: 1 }); }
          }
          if (!boom_ && o.t >= CHARGE + PULL) {
            boom_ = true; sfx('fb_sunboom'); shake(14); flashScreen('#ffffff', 0.95); slowmo(0.5, 0.25); ring(tx, ty, 170, '#fff3b0', 0.6, 8); ring(tx, ty, 120, '#ffb35a', 0.5, 6); ring(tx, ty, 60, '#ff6a1a', 0.4, 4); boomRays(tx, ty, 130, 0.6);
            fireArea(P, tx, ty, 150, E.base(5.2), { kb: 340, stun: 0.9 }); scorch(tx, ty, 130, 68, 6.5, 1);
            for (let i = 0; i < 40; i++) { const a = rnd(0, 6.28), r = rnd(0, 140); later(() => ember(tx + Math.cos(a) * r, ty + Math.sin(a) * r * 0.6, rnd(-15, 15), rnd(-10, 10), rnd(-20, 10), rnd(1.2, 2), rnd(50, 130)), i * 60); }
            for (let i = 0; i < 20; i++) later(() => part(tx + rnd(-150, 150), ty + rnd(-80, 80), { col: choice(['#ffd24a', '#ff8a2a', '#fff3b0']), vz: rnd(20, 90), g: 120, life: 1, size: 2, add: true }), i * 120);
          }
        },
        draw(o, ctx, cx, cy, pass) {
          const x = o.x - cx, y = o.y - cy, preBoom = o.t < CHARGE + PULL;
          if (pass === 'ground') { const k = clamp(o.t / CHARGE, 0, 1); ctx.globalAlpha = 0.5 * k * (preBoom ? 1 : Math.max(0, 1 - (o.t - CHARGE - PULL) / 0.3)); ctx.strokeStyle = '#ffcf7a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 160, 88, 0, 0, 7); ctx.stroke(); drawCircle(ctx, x, y, 100, o.t * 2, '255,190,90', 0.6 * k * (preBoom ? 1 : 0.3)); ctx.globalAlpha = 1; return; }
          if (pass === 'top') { const dk = preBoom ? Math.min(1, o.t / 0.6) * 0.55 : Math.max(0, 0.55 - (o.t - CHARGE - PULL) * 1.2); if (dk > 0) { ctx.fillStyle = 'rgba(16,6,4,' + dk * 0.55 + ')'; ctx.fillRect(0, 0, W, H); } return; }
          if (preBoom) { const grow = Math.min(1, o.t / CHARGE), pulse = o.t > CHARGE ? 1 + 0.08 * Math.sin(o.t * 25) : 1, R = (8 + 20 * grow) * pulse, sy = o.sy - cy;
            glow(ctx, x, sy, R * 3.4, '255,200,110', 0.55);
            for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28 + o.t * 1.2, L = R * (0.7 + 0.5 * Math.sin(o.t * 8 + i * 2.1)), r0 = R * 0.9; pxLine(ctx, x + Math.cos(a) * r0, sy + Math.sin(a) * r0, x + Math.cos(a) * (r0 + L), sy + Math.sin(a) * (r0 + L), i % 2 ? '#ffb43a' : '#ff6a1a', 4); pxLine(ctx, x + Math.cos(a) * r0, sy + Math.sin(a) * r0, x + Math.cos(a) * (r0 + L * 0.6), sy + Math.sin(a) * (r0 + L * 0.6), '#ffe08a', 2); }
            ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(x, sy, R, 0, 7); ctx.fill(); ctx.fillStyle = '#fff8d0'; ctx.beginPath(); ctx.arc(x, sy, R * 0.75, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, sy, R * 0.45, 0, 7); ctx.fill(); }
        } });
    } },
];
function glowI(c, x, y, r, rgb, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }

// ---------------- effets liés aux états de maîtrise du Feu ----------------
// appelé par strikeEnemy pour les coups d'arme (non magiques) pendant Fourreau solaire / Cœur du volcan
function fireOnHit(P, e, o) {
  if (e.dead) return; const S = P.st8, ft = P.buffs.fourreau > G.t, vc = P.buffs.volcan > G.t; if (!ft && !vc) return;
  if (ft) { innateHit(P, e, 0.3, { st: 'burn', kb: 0 }, 'feu', { noProc: true, crit: false }); for (let i = 0; i < 5; i++) part(e.x + rnd(-6, 6), e.y - rnd(6, 26), { col: fcol(), life: 0.45, size: 2, add: true, vx: rnd(-50, 50), vy: rnd(-50, 50), rise: 20 }); if (Math.random() < 0.5) ember(e.x, e.y, rnd(-40, 40), rnd(-20, 20), rnd(60, 120), 1.2, 14); magicXp(P, 'feu', 0.4); }
  if (vc && (P.volcanT || 0) < G.t && Math.random() < 0.4) { P.volcanT = G.t + 0.15; shake(2); sfx('fb_boom'); boomRays(e.x, e.y, 30, 0.25); ring(e.x, e.y, 30, '#ffb35a', 0.25, 3); fireArea(P, e.x, e.y, 30, 0.5, { kb: 110, noProc: true }); embers(e.x, e.y, 3, 80, 140); magicXp(P, 'feu', 0.4); }
}
// esquive pendant Cœur du volcan : flammes laissées derrière
function volcanDodge(P) {
  const dx = P.dvx, dy = P.dvy;
  for (let i = 0; i < 4; i++) later(() => {
    const x = P.x - dx * 4, y = P.y - dy * 4; let tick = 0;
    mfx({ life: 2.2, x, y, passes: ['ground', 'glow'], seed: rnd(0, 9),
      upd(o, dt) { tick -= dt; addLight(o.x, o.y - 6, 40, '255,120,40', 0.6 * (1 - o.t / 2.2)); if (tick <= 0) { tick = 0.4; fireArea(P, o.x, o.y, 18, 0.3, { kb: 0 }); } },
      draw(o, ctx, cx, cy, pass) { const k = 1 - o.t / 2.2; if (pass === 'ground') { ctx.globalAlpha = 0.5 * k; ctx.fillStyle = '#1a0c08'; ctx.beginPath(); ctx.ellipse(o.x - cx, o.y - cy, 13, 6, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } else { ctx.globalAlpha = Math.min(1, k * 1.5); flameTongue(ctx, o.x - cx, o.y - cy + 2, 14 * (0.5 + 0.5 * k), 5, o.t, o.seed); flameTongue(ctx, o.x - cx - 5, o.y - cy + 3, 9 * k, 3, o.t, o.seed + 2); ctx.globalAlpha = 1; } } });
  }, i * 55);
  P.cd.volcanDodge = 0;
}
// lancement de l'ultime du grimoire (remplace l'ultime de base si choisi)
function castGrimUlt(P, mx, my, mv) {
  const g = grimSpell(P.magic, 10), S = P.st8; if (P.ult < 100) { toast('Ultime pas encore chargé (' + Math.floor(P.ult) + ' %)', '#ffd36b'); return; }
  P.ult = 0; P.state = 'cast'; P.animT = 0; P.castDone = false; P.st = 0; P.iframes = Math.max(P.iframes, 1.2);
  const F = MAGIC_DATA[P.magic]; const t = aimTarget(P, mx, my, mv, 260); if (t) P.aim = Math.atan2(t.y - P.y, t.x - P.x);
  const tx = t ? t.x : P.x + Math.cos(P.aim) * 100, ty = t ? t.y : P.y + Math.sin(P.aim) * 100; const pw = S.mag; const base = k => (14 + pw * k) / Math.max(1, S.mag);
  magicXp(P, P.magic, 6);
  P.castFn = () => g.cast(P, { fam: P.magic, F, col: F.col, rgb: F.rgb, S, pw, base, t, tx, ty, a: P.aim });
}
