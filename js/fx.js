'use strict';
// ===================== particules, effets, lumières =====================
function part(x, y, o) {
  G.parts.push(Object.assign({ x, y, z: 0, vx: 0, vy: 0, vz: 0, g: 0, life: 0.6, t: 0, size: 2, col: '#fff', add: false, drag: 0.92, fade: 1 }, o));
}
function burst(x, y, n, col, o) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = rnd(30, 120) * ((o && o.spd) || 1);
    part(x, y, Object.assign({ vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, vz: rnd(20, 90), g: 260, life: rnd(0.3, 0.7), size: rndi(1, 3), col: Array.isArray(col) ? choice(col) : col }, o || {}));
  }
}
function sparks(x, y, ang, n, col) {
  for (let i = 0; i < n; i++) {
    const a = ang + rnd(-0.8, 0.8), s = rnd(90, 220);
    part(x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.12, 0.3), size: 1, col: col || choice(['#fff', '#ffe08a', '#ffb347']), add: true, drag: 0.85, streak: 1 });
  }
}
function ring(x, y, r, col, life, w) { G.rings.push({ x, y, r0: 4, r, col, life: life || 0.4, t: 0, w: w || 3 }); }
function fxAt(key, x, y, o) { G.fx.push(Object.assign({ key, x, y, t: 0, fps: 20, scale: 1, add: false, loop: 0 }, o || {})); }
function num(x, y, v, col, big) { G.nums.push({ x: x + rnd(-6, 6), y, v: String(v), col: col || '#fff', t: 0, big: !!big, vy: big ? -46 : -36 }); }
function shake(a) { if (SET.shake) G.shake = Math.max(G.shake, a); }
function hitstop(t) { G.hitstop = Math.max(G.hitstop, t); }
function slowmo(t, f) { G.slowT = Math.max(G.slowT, t); G.slowF = f || 0.35; }
function flashScreen(col, a) { G.flash = { col, a: a || 0.5 }; }
function toast(msg, col) { if (G.toasts.some(t => t.msg === msg && t.t < 1)) return; const extra = Math.min(3, Math.max(0, (msg.length - 50) / 30)); G.toasts.push({ msg, col: col || '#fff', t: -extra }); if (G.toasts.length > 3) G.toasts.shift(); }

function updateFx(dt) {
  for (const p of G.parts) {
    p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(p.drag, dt * 60);
    if (p.g) { p.vz -= p.g * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.35; p.vx *= 0.6; p.vy *= 0.6; } }
    if (p.rise) p.z += p.rise * dt;
  }
  G.parts = G.parts.filter(p => p.t < p.life);
  if (G.parts.length > 900) G.parts.splice(0, G.parts.length - 900);
  for (const f of G.fx) { f.t += dt; if (f.follow) { f.x = f.follow.x + (f.ox || 0); f.y = f.follow.y + (f.oy || 0); } }
  G.fx = G.fx.filter(f => f.loop ? f.t < f.loop : f.t * f.fps < fxFrames(f.key));
  for (const r of G.rings) r.t += dt; G.rings = G.rings.filter(r => r.t < r.life);
  for (const n of G.nums) { n.t += dt; n.y += n.vy * dt; n.vy += 60 * dt; } G.nums = G.nums.filter(n => n.t < 0.9);
  for (const t of G.toasts) t.t += dt; G.toasts = G.toasts.filter(t => t.t < 3.2);
  if (G.flash) { G.flash.a -= dt * 2.5; if (G.flash.a <= 0) G.flash = null; }
}
function drawParts(ctx, cx, cy, additive) {
  for (const p of G.parts) {
    if (!!p.add !== additive) continue;
    const a = p.fade ? Math.max(0, 1 - p.t / p.life) : 1;
    ctx.globalAlpha = a; ctx.fillStyle = p.col;
    const x = Math.round(p.x - cx), y = Math.round(p.y - p.z - cy);
    if (p.streak) { ctx.fillRect(x, y, Math.max(1, Math.abs(p.vx) * 0.02), Math.max(1, Math.abs(p.vy) * 0.02)); }
    else ctx.fillRect(x - (p.size >> 1), y - (p.size >> 1), p.size, p.size);
  }
  ctx.globalAlpha = 1;
}
function drawFxList(ctx, cx, cy, layer) {
  for (const f of G.fx) {
    if ((f.layer || 0) !== layer) continue;
    let k = f.t * f.fps; if (f.loop) { const n = fxFrames(f.key); const a = f.loopA || 0, b = f.loopB || n; k = k < a ? k : a + ((k - a) % (b - a)); }
    drawFx(ctx, f.key, f.k0 !== undefined ? f.k0 + k : k, f.x - cx, f.y - cy, f.scale, f.alpha, f.add ? 'lighter' : undefined);
  }
}
function drawRings(ctx, cx, cy) {
  for (const r of G.rings) {
    const k = r.t / r.life; const rad = lerp(r.r0, r.r, 1 - Math.pow(1 - k, 3));
    ctx.globalAlpha = 1 - k; ctx.strokeStyle = r.col; ctx.lineWidth = r.w * (1 - k) + 1;
    ctx.beginPath(); ctx.ellipse(Math.round(r.x - cx), Math.round(r.y - cy), rad, rad * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function drawNums(ctx, cx, cy) {
  for (const n of G.nums) {
    const a = n.t < 0.6 ? 1 : 1 - (n.t - 0.6) / 0.3; const s = n.big ? 1 + Math.max(0, 0.3 - n.t) * 2 : 1;
    ctx.globalAlpha = a; ctx.font = `bold ${Math.round((n.big ? 13 : 10) * s)}px 'Trebuchet MS',sans-serif`; ctx.textAlign = 'center';
    const x = Math.round(n.x - cx), y = Math.round(n.y - cy);
    ctx.lineWidth = 3; ctx.strokeStyle = '#120a1a'; ctx.strokeText(n.v, x, y); ctx.fillStyle = n.col; ctx.fillText(n.v, x, y);
  }
  ctx.globalAlpha = 1;
}
// ---------------- lumière ----------------
const LIGHT = document.createElement('canvas'); const LC = LIGHT.getContext('2d');
const GLOW = {};
function glowSprite(col, r) {
  const k = col + r; if (GLOW[k]) return GLOW[k];
  const c = document.createElement('canvas'); c.width = c.height = r * 2; const x = c.getContext('2d');
  const g = x.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, 'rgba(' + col + ',0.9)'); g.addColorStop(0.4, 'rgba(' + col + ',0.35)'); g.addColorStop(1, 'rgba(' + col + ',0)');
  x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); GLOW[k] = c; return c;
}
function addLight(x, y, r, col, a) { G.lights.push({ x, y, r, col: col || '255,220,170', a: a === undefined ? 1 : a }); }
function drawLighting(ctx, cx, cy, dark, tint) {
  if (LIGHT.width !== W || LIGHT.height !== H) { LIGHT.width = W; LIGHT.height = H; }
  if (dark > 0.01) {
    LC.globalCompositeOperation = 'source-over'; LC.clearRect(0, 0, W, H);
    LC.fillStyle = tint || 'rgba(8,10,30,1)'; LC.globalAlpha = dark; LC.fillRect(0, 0, W, H); LC.globalAlpha = 1;
    LC.globalCompositeOperation = 'destination-out';
    for (const l of G.lights) { const s = glowSprite('255,255,255', 64); const r = l.r; LC.globalAlpha = l.a; LC.drawImage(s, l.x - cx - r, l.y - cy - r, r * 2, r * 2); }
    LC.globalAlpha = 1; LC.globalCompositeOperation = 'source-over';
    ctx.drawImage(LIGHT, 0, 0);
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const l of G.lights) { if (!l.col) continue; const s = glowSprite(l.col, 48); const r = l.r * 0.7; ctx.globalAlpha = 0.28 * l.a; ctx.drawImage(s, l.x - cx - r, l.y - cy - r, r * 2, r * 2); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
// ---------------- ambiance ----------------
function ambientParticles(dt, zone, cx, cy) {
  if (zone.id === 'village') {
    if (Math.random() < dt * 3) part(cx + Math.random() * W, cy + Math.random() * H, { life: 4, vx: rnd(-6, 6), vy: rnd(-4, 2), size: 1, col: 'rgba(255,250,220,0.8)', drag: 1, rise: 3 });
  } else {
    if (Math.random() < dt * 4) part(cx + Math.random() * W, cy - 10, { life: 6, vx: rnd(8, 22), vy: rnd(14, 26), size: 2, col: choice(['#7fb24a', '#a3c45a', '#d9a441', '#5d8f3a']), drag: 1, leaf: 1 });
    if (zone.dark > 0.2 && Math.random() < dt * 5) part(cx + Math.random() * W, cy + Math.random() * H, { life: 3, vx: rnd(-8, 8), vy: rnd(-8, 8), size: 1, col: zone.id === 'boss' ? '#ff9b5a' : '#d4ff8a', add: true, drag: 0.99 });
  }
}
