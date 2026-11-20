'use strict';
// ===================== état global =====================
const G = {
  t: 0, mode: 'loading', paused: false, player: null, enemies: [], projs: [], fx: [], parts: [], rings: [], nums: [], drops: [], npcs: [], lights: [], toasts: [], bolts: [], zones2: [],
  rifts: [], mfx: [], tornados: [], voids: [], pillars: [], sacred: null, reveal: 0, stash: [], timeTint: 0,
  cam: { x: 0, y: 0 }, shake: 0, hitstop: 0, slowT: 0, slowF: 1, flash: null, zone: null, zoneBanner: null, boss: null, near: null, dlg: null,
  quests: { main: 0, hunt: 0 }, flags: {},
};
const cv = $('game'); const ctx = cv.getContext('2d');
let SCALE = 2;
function resize() {
  const vw = window.innerWidth, vh = window.innerHeight; const ar = vw / vh;
  if (ar >= 1) { H = 288; W = Math.round(clamp(H * ar, 384, 680)); }
  else { W = 320; H = Math.round(clamp(W / ar, 300, 560)); }
  cv.width = W; cv.height = H; SCALE = Math.min(vw / W, vh / H);
  cv.style.width = Math.round(W * SCALE) + 'px'; cv.style.height = Math.round(H * SCALE) + 'px';
  ctx.imageSmoothingEnabled = false;
  $('rotate').classList.toggle('show', IS_TOUCH && ar < 1 && G.mode === 'play');
  const r = cv.getBoundingClientRect(); const hb = $('hudbtns');
  hb.style.left = Math.round(r.left + 4 * SCALE) + 'px'; hb.style.top = Math.round(r.top + 38 * SCALE) + 'px';
}
window.addEventListener('resize', resize);
cv.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); IN.mouse.x = (e.clientX - r.left) / r.width * W; IN.mouse.y = (e.clientY - r.top) / r.height * H; IN.mouse.active = true; IN.mouse.t = G.t; });
cv.addEventListener('mousedown', e => { if (IS_TOUCH) return; audioInit(); IN.mouse.t = G.t; if (e.button === 0) press('attack'); if (e.button === 2) press('block'); });
window.addEventListener('mouseup', e => { if (e.button === 0) release('attack'); if (e.button === 2) release('block'); });
cv.addEventListener('contextmenu', e => e.preventDefault());

// ===================== sauvegarde =====================
const SAVE_KEY = 'vel_td_save_v1';
function saveGame() {
  if (!G.player || G.mode !== 'play') return;
  const P = G.player;
  try {
    store(SAVE_KEY, { v: CONFIG.saveVersion, look: P.look, name: P.name, style: P.style, magic: P.magic, magic2: P.magic2, magicT: P.magicT, magicHist: P.magicHist || [], stylesKnown: P.stylesKnown, raceCd: 0, race: P.look.race, x: P.x, y: P.y, hp: P.hp, mp: P.mp, lvl: P.lvl, xp: P.xp, gold: P.gold, ult: P.ult, awk: P.awk, kills: P.kills,
      items: P.items, equip: P.equip, uidSeq: P.uidSeq, styleXp: P.styleXp, styleLvlSeen: P.styleLvlSeen, spin: P.spin, history: P.history, recipes: P.recipes, craft: P.craft, seen: P.seen, bags: P.bags, spells: P.spells, slot4: P.slot4, lore: P.lore || {}, spinCount: P.spinCount || 0, mastery: P.mastery || {}, eqM: P.eqM || {}, ultSel: P.ultSel || 'L',
      stash: G.stash, quests: G.quests, flags: G.flags, chests: WORLD.chests.filter(c => c.opened).map(c => c.id) });
  } catch (e) { console.warn('save', e); }
}
function loadGame() { try { return migrateSave(store(SAVE_KEY)); } catch (e) { return null; } }

// ===================== démarrage =====================
async function boot() {
  resize();
  await loadAll(k => { $('loadbar').style.width = Math.round(k * 100) + '%'; });
  genWorld(); buildMinimap();
  G.mode = 'title'; $('loading').classList.remove('show'); showTitle();
  requestAnimationFrame(frame);
}
let saveTimer = 0;
function startGame(look, sv) {
  const P = newPlayer(look, sv ? sv.style : 'epee', sv ? sv.magic : null); G.player = P; P.name = (sv && sv.name) || CR.name || 'Héros';
  G.quests = { main: 0, hunt: 0, intro: 0 }; G.flags = {}; G.stash = []; G.enemies = []; G.drops = []; G.projs = []; G.mfx = [];
  for (const c of WORLD.chests) c.opened = false;
  if (sv) {
    for (const k of ['x', 'y', 'lvl', 'xp', 'gold', 'ult', 'awk', 'kills', 'items', 'equip', 'uidSeq', 'styleXp', 'styleLvlSeen', 'spin', 'history', 'recipes', 'craft', 'seen', 'bags', 'spells', 'slot4', 'lore', 'spinCount', 'mastery', 'eqM', 'ultSel', 'magic2', 'magicT', 'magicHist', 'stylesKnown']) if (sv[k] !== undefined) P[k] = sv[k];
    P.stylesKnown = P.stylesKnown || {}; if (!P.magic2) delete P.spells.m2;
    P.items = (P.items || []).filter(i => REG[i.id]); for (const s in P.equip) if (!findInst(P, P.equip[s])) delete P.equip[s];
    G.stash = (sv.stash || []).filter(i => REG[i.id]);
    G.quests = sv.quests || G.quests; G.flags = sv.flags || {};
    for (const c of WORLD.chests) if ((sv.chests || []).includes(c.id)) c.opened = true;
    if (!P.items.length) giveStarter(P);
  } else giveStarter(P);
  rebuildPlayer(P);
  P.hp = sv && sv.hp ? Math.max(1, Math.min(sv.hp, P.st8.maxhp)) : P.st8.maxhp; P.mp = sv && sv.mp !== undefined ? Math.min(sv.mp, P.st8.maxmp) : P.st8.maxmp; P.sta = P.st8.maxsta;
  if (rectBlocked(P.x - 7, P.y - 8, 14, 8)) { P.x = 48 * TILE + 16; P.y = 66 * TILE; }
  G.npcs = WORLD.npcs.map(n => Object.assign({}, n, { spr: lookSprite(n.look), t: Math.random() * 5 }));
  G.enemies = [];
  for (const s of WORLD.spawns) { if (s.kind === 'boss_orc_chief' && G.flags.bossDead) continue; for (let i = 0; i < s.n; i++) { const a = Math.random() * 6.28, r = Math.random() * s.r; let x = s.x + Math.cos(a) * r, y = s.y + Math.sin(a) * r; if (rectBlocked(x - 8, y - 8, 16, 8)) { x = s.x; y = s.y; } spawnEnemy(s.kind, x, y, s); } }
  G.cam.x = P.x - W / 2; G.cam.y = P.y - H / 2;
  G.mode = 'play'; G.paused = false;
  $('hudbtns').classList.add('show');
  if (IS_TOUCH) { $('touch').classList.add('show'); setupTouch(); }
  resize();
  if (!sv) { setTimeout(() => toast('Bienvenue à Brumeval, ' + P.name + '. Parle à l\'Ancien Théobald, au centre du village.', '#ffe9a0'), 900); }
  else if (sv.migratedMagic && !P.magic) setTimeout(() => toast('Le Maître Mage Orvael doit encore révéler ta véritable magie innée (est du village).', '#c4b5fd'), 900);
  if (!saveTimer) saveTimer = setInterval(saveGame, 15000);
  playMusic('village'); saveGame();
}

// ===================== boucle =====================
let last = 0, acc = 0; const STEP = 1 / 60;
function frame(ts) {
  requestAnimationFrame(frame);
  pollPad(); padUI();
  const dtr = Math.min(0.1, (ts - last) / 1000 || 0); last = ts;
  if (G.mode === 'play' && !G.paused) {
    acc += dtr * (window.__speed || 1);
    let n = 0;
    while (acc >= STEP && n < 8) { tick(STEP); acc -= STEP; n++; }
  } else acc = 0;
  render();
}
function tick(dt) {
  G.t += dt;
  if (G.hitstop > 0) { G.hitstop -= dt; clearPressed(); return; }
  let k = 1; if (G.slowT > 0) { G.slowT -= dt; k = G.slowF; }
  const sdt = dt * k;
  G.lights = [];
  const P = G.player; P.px = P.x; P.py = P.y;
  updatePlayer(P, sdt);
  if (G.later && G.later.length) { for (const l of G.later) l.t -= sdt; const due = G.later.filter(l => l.t <= 0); G.later = G.later.filter(l => l.t > 0); for (const l of due) { try { l.fn(); } catch (e) { console.error(e); } } }
  updateEnemies(sdt); updateProjs(sdt); updateDrops(sdt); updateFx(sdt);
  for (const b of G.bolts) b.t += sdt; G.bolts = G.bolts.filter(b => b.t < 0.25);
  updateZones(sdt); updateMfx(sdt); updateMagic3(sdt);
  for (const n of G.npcs) updateNpc(n, sdt);
  // zone & musique
  const z = zoneAt(P.x, P.y);
  if (z !== G.zone) { G.zone = z; G.zoneBanner = { name: z.name, t: 0 }; if (!G.boss) playMusic(z.music === 'boss' && G.flags.bossDead ? 'forest' : z.music); }
  if (G.zoneBanner) G.zoneBanner.t += dt;
  const fighting = G.enemies.some(e => e.aggro && !e.dead && !e.def.boss);
  if (!G.boss && G.zone.id !== 'village') playMusic(fighting ? 'combat' : (G.zone.music === 'boss' ? (G.flags.bossDead ? 'forest' : 'boss') : 'forest'));
  ambientParticles(sdt, G.zone, G.cam.x, G.cam.y); ambientWorld(sdt);
  if (Math.random() < sdt * 6) { const tx = Math.floor((G.cam.x + Math.random() * W) / TILE), ty = Math.floor((G.cam.y + Math.random() * H) / TILE); if (WORLD.solid[ty * MW + tx]) part(tx * TILE + rnd(4, 28), ty * TILE + rnd(4, 28), { col: '#e8fbff', size: 1, life: 0.6, add: true, drag: 1 }); }
  // lumières
  addLight(P.x, P.y - 14, 90, null, 1);
  for (const p of WORLD.props) if (p.def.light && Math.abs(p.x - P.x) < W && Math.abs(p.y - P.y) < H) { const l = p.def.light; addLight(p.x + l[0], p.y + l[1], l[2] * (0.95 + Math.sin(G.t * 9 + p.x) * 0.05), l[3]); }
  // caméra
  const tx = P.x - W / 2 + Math.cos(P.aim || 0) * 0, ty = P.y - 16 - H / 2;
  G.cam.x = lerp(G.cam.x, tx, 1 - Math.pow(0.0005, dt)); G.cam.y = lerp(G.cam.y, ty, 1 - Math.pow(0.0005, dt));
  G.cam.x = clamp(G.cam.x, 0, MW * TILE - W); G.cam.y = clamp(G.cam.y, 0, MH * TILE - H);
  G.shake = Math.max(0, G.shake - dt * 18);
  clearPressed();
  updateTouchUI();
}
// ===================== rendu =====================
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  if (G.mode !== 'play') { ctx.fillStyle = '#0c0a14'; ctx.fillRect(0, 0, W, H); if (G.mode === 'title' || G.mode === 'creator') { drawTitleBg(); if (G.mode === 'creator') { ctx.fillStyle = 'rgba(6,3,14,0.55)'; ctx.fillRect(0, 0, W, H); } } return; }
  const P = G.player; const nLights = G.lights.length;
  const sx = G.shake ? rnd(-G.shake, G.shake) : 0, sy = G.shake ? rnd(-G.shake, G.shake) : 0;
  const cx = Math.round(G.cam.x + sx), cy = Math.round(G.cam.y + sy);
  drawTerrain(ctx, cx, cy);
  // décors plats
  const vis = (x, y, m) => x > cx - m && x < cx + W + m && y > cy - 30 && y < cy + H + m * 1.6;
  for (const p of WORLD.props) if (p.def.flat && vis(p.x, p.y, 40)) drawProp(ctx, p, cx, cy);
  for (const p of WORLD.props) if (p.def.arcane && vis(p.x, p.y, 140)) {
    const x = p.x - cx, y = p.y - cy; const pl = G.player; const near = dist(pl.x, pl.y, p.x, p.y) < 110;
    ctx.globalAlpha = 0.18; ctx.fillStyle = 'rgb(' + p.def.arcane + ')'; ctx.beginPath(); ctx.ellipse(x, y, 82, 40, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    drawCircle(ctx, x, y, 80, G.t * 0.6, p.def.arcane, near ? 1 : 0.7); drawCircle(ctx, x, y, 46, -G.t, pl.magic ? MAGIC_DATA[pl.magic].rgb : '255,233,160', 0.8);
    addLight(p.x, p.y - 10, 120, p.def.arcane, 0.9);
    if (Math.random() < 0.4) { const a = Math.random() * 6.28; part(p.x + Math.cos(a) * 76, p.y + Math.sin(a) * 36, { col: 'rgb(' + p.def.arcane + ')', rise: 30, life: 1, size: 1, add: true }); }
  }
  for (const p of WORLD.props) if (p.def.circle && vis(p.x, p.y, 80)) { drawCircle(ctx, p.x - cx, p.y - cy - 4, 40, G.t, p.def.circle, 0.75); addLight(p.x, p.y - 20, 70, p.def.circle, 0.8); }
  if (G.sacred) { ctx.globalAlpha = 0.25 + Math.sin(G.t * 5) * 0.08; ctx.fillStyle = '#fff3c0'; ctx.beginPath(); ctx.ellipse(G.sacred.x - cx, G.sacred.y - cy, 70, 38, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; drawCircle(ctx, G.sacred.x - cx, G.sacred.y - cy, 66, G.t, '255,233,160', 0.9); }
  for (const r of G.rifts) if (r.t >= 0) { ctx.globalAlpha = 0.35 * (1 - r.t / r.life) + 0.1; ctx.fillStyle = 'rgb(' + r.col + ')'; ctx.beginPath(); ctx.ellipse(r.x - cx, r.y - cy, r.r, r.r * 0.5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  for (const v of G.voids) { const k = v.t / v.life; ctx.fillStyle = 'rgba(20,0,40,0.75)'; ctx.beginPath(); ctx.ellipse(v.x - cx, v.y - cy, 18 + k * 30, (18 + k * 30) * 0.55, 0, 0, 7); ctx.fill(); drawCircle(ctx, v.x - cx, v.y - cy, 50, -G.t * 3, '139,92,246', 0.8); }
  // zones au sol (télégraphes)
  for (const z of G.zones2) if (!z.done) {
    const k = clamp(z.t / z.delay, 0, 1); ctx.globalAlpha = 0.25 + k * 0.35; ctx.fillStyle = `rgba(${z.col},0.35)`; ctx.strokeStyle = `rgba(${z.col},1)`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(z.x - cx, z.y - cy, z.r, z.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(z.x - cx, z.y - cy, z.r * k, z.r * 0.55 * k, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
  drawFxList(ctx, cx, cy, -1);
  drawMfx(ctx, cx, cy, 'ground');
  for (const d of G.drops) drawDrop(ctx, d, cx, cy);
  // liste triée en profondeur
  const L = [];
  for (const p of WORLD.props) if (!p.def.flat && vis(p.x, p.y, 140) && (!p.hidden || p.opened || G.reveal > 0 || dist(p.x, p.y, P.x, P.y) < 26)) L.push({ y: p.y, k: 0, o: p });
  for (const e of G.enemies) if (vis(e.x, e.y, 120)) L.push({ y: e.y, k: 1, o: e });
  for (const n of G.npcs) if (vis(n.x, n.y, 60)) L.push({ y: n.y, k: 2, o: n });
  L.push({ y: P.y, k: 3, o: P });
  for (const p of G.projs) L.push({ y: p.y + 14, k: 4, o: p });
  L.sort((a, b) => a.y - b.y);
  for (const it of L) {
    if (it.k === 0) {
      const p = it.o; let a;
      if (p.def.fade) { const r = p.def.r; if (P.y < p.y - 4 && P.x > p.x - r[2] / 2 + 6 && P.x < p.x + r[2] / 2 - 6 && P.y > p.y - r[3] + 10) a = 0.5; }
      if (p.respawnAt > G.t) a = 0.45; if (p.hidden && !p.opened) a = G.reveal > 0 ? 0.9 : 0.55;
      drawProp(ctx, p, cx, cy, a);
    } else if (it.k === 1) drawEnemy(ctx, it.o, cx, cy);
    else if (it.k === 2) { const n = it.o; drawShadow(ctx, n.x - cx, n.y - cy, 11); drawChar(ctx, n.spr, 'walk', n.dir, n.moving ? 1 + Math.floor(n.t * 8) % 8 : 0, n.x - cx, n.y - cy); if (G.quests.main === 0 && n.role === 'quest' || G.quests.main === 2 && n.role === 'quest') txt(ctx, '!', n.x - cx, n.y - cy - 54 + Math.sin(G.t * 5) * 2, '#ffe27a', 14, 'center'); }
    else if (it.k === 3) drawPlayer(ctx, P, cx, cy);
    else drawProj(ctx, it.o, cx, cy);
  }
  drawFxList(ctx, cx, cy, 0);
  drawParts(ctx, cx, cy, false);
  // ombres de nuages qui glissent sur le monde (profondeur)
  drawCloudShadows(ctx, cx, cy);
  // lumière / ambiance
  const z = G.zone || WORLD.zones[0];
  let dark = z.dark; let tint = 'rgba(8,10,30,1)';
  if (z.id === 'boss' && !G.flags.bossDead) tint = 'rgba(40,6,10,1)';
  G.darkSmooth = lerp(G.darkSmooth || 0, dark, 0.03);
  drawLighting(ctx, cx, cy, G.darkSmooth, tint); G.lights.length = nLights;
  // effets additifs
  ctx.globalCompositeOperation = 'lighter';
  drawFxList(ctx, cx, cy, 1);
  drawMfx(ctx, cx, cy, 'glow');
  drawParts(ctx, cx, cy, true);
  for (const b of G.bolts) drawBolt(ctx, b, cx, cy);
  if (G.beams) for (const b of G.beams) { const k = 1 - b.t / 0.35; ctx.save(); ctx.translate(b.x - cx, b.y - cy); ctx.rotate(b.a); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${b.col},${0.35 * k})`; ctx.fillRect(0, -10 * k, b.len, 20 * k); ctx.fillStyle = `rgba(255,255,255,${0.8 * k})`; ctx.fillRect(0, -2, b.len, 4); ctx.restore(); ctx.globalCompositeOperation = 'source-over'; addLight(b.x + Math.cos(b.a) * b.len / 2, b.y + Math.sin(b.a) * b.len / 2, 90, b.col, 0.6 * k); }
  for (const t of G.tornados) drawFx(ctx, 'tornado', 4 + Math.floor(t.t * 14) % 8, t.x - cx, t.y - cy - 40, 1, 0.9);
  for (const p of G.pillars) { const k = p.t / 0.8; ctx.globalAlpha = 1 - k; const g = ctx.createLinearGradient(0, p.y - cy - 200, 0, p.y - cy); g.addColorStop(0, 'rgba(255,250,210,0)'); g.addColorStop(1, 'rgba(255,245,190,0.95)'); ctx.fillStyle = g; ctx.fillRect(p.x - cx - 22 * (1 - k * 0.5), p.y - cy - 200, 44 * (1 - k * 0.5), 200); ctx.globalAlpha = 1; }
  ctx.globalCompositeOperation = 'source-over';
  drawMfx(ctx, cx, cy, 'top');
  drawRings(ctx, cx, cy);
  drawNums(ctx, cx, cy);
  if (G.timeTint > 0) { ctx.fillStyle = 'rgba(200,170,255,0.18)'; ctx.fillRect(0, 0, W, H); }
  if (G.reveal > 0) { ctx.strokeStyle = 'rgba(255,233,160,0.35)'; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, W - 3, H - 3); }
  if (G.flash) { ctx.globalAlpha = Math.max(0, G.flash.a); ctx.fillStyle = G.flash.col; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (P.hp < P.st8.maxhp * 0.25 && P.state !== 'dead') { const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8); g.addColorStop(0, 'rgba(120,0,0,0)'); g.addColorStop(1, `rgba(150,0,0,${0.25 + Math.sin(G.t * 6) * 0.1})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  drawVignette(ctx); drawHUD(ctx);
  if (TOUCH.edit) txt(ctx, 'Fais glisser les boutons, puis touche « Terminer »', W / 2, H / 2, '#ffe9a0', 11, 'center');
}
function updateZones(dt) {
  const P = G.player;
  G.reveal = Math.max(0, G.reveal - dt); G.timeTint = Math.max(0, G.timeTint - dt);
  if (G.sacred) { G.sacred.t -= dt; if (G.sacred.t <= 0) G.sacred = null; else if (Math.random() < 0.5) { const a = Math.random() * 6.28; part(G.sacred.x + Math.cos(a) * 66, G.sacred.y + Math.sin(a) * 36, { col: '#ffe9a0', rise: 30, life: 0.6, size: 2, add: true }); } }
  const slowZones = [];
  for (const r of G.rifts) {
    r.t += dt; if (r.t < 0) continue;
    if (r.slow) slowZones.push(r);
    r.tick = (r.tick || 0) - dt;
    if (r.mult && r.tick <= 0) { r.tick = 0.4; for (const e of G.enemies) if (!e.dead && dist(e.x, e.y, r.x, r.y) < r.r + e.def.r * 0.4) { strikeEnemy(P, e, r.mult, { el: r.el, noProc: true, noXp: true, kb: 10, magic: !!r.fam }); if (r.st && r.fam) applyStatus(P, e, r.st, r.fam); } }
    if (Math.random() < 0.5) part(r.x + rnd(-r.r, r.r) * 0.8, r.y + rnd(-r.r, r.r) * 0.4, { col: 'rgb(' + r.col + ')', rise: 25, life: 0.5, size: 2, add: r.el !== 'eau' });
    if (r.el === 'feu') addLight(r.x, r.y, 50, '255,140,60', 0.6);
  }
  G.rifts = G.rifts.filter(r => r.t < r.life);
  G.slowZone = slowZones.length ? e => slowZones.some(r => dist(e.x, e.y, r.x, r.y) < r.r) : null;
  for (const t of G.tornados) {
    t.t += dt; t.x += t.vx * dt; t.y += t.vy * dt; t.tick = (t.tick || 0) - dt;
    for (const e of G.enemies) if (!e.dead && dist(e.x, e.y, t.x, t.y) < 70) { const a = Math.atan2(t.y - e.y, t.x - e.x); e.kbx += Math.cos(a) * 260 * dt * 6; e.kby += Math.sin(a) * 260 * dt * 6; }
    if (t.tick <= 0) { t.tick = 0.3; for (const e of G.enemies) if (!e.dead && dist(e.x, e.y, t.x, t.y) < 34) strikeEnemy(P, e, 0.45, { el: 'vent', noProc: true, noXp: true, kb: 20 }); }
  }
  G.tornados = G.tornados.filter(t => t.t < t.life);
  for (const v of G.voids) {
    v.t += dt;
    const vc = v.col ? 'rgb(' + v.col + ')' : '#8b5cf6';
    for (const e of G.enemies) if (!e.dead && dist(e.x, e.y, v.x, v.y) < 110) { const a = Math.atan2(v.y - e.y, v.x - e.x); e.kbx += Math.cos(a) * 1200 * dt; e.kby += Math.sin(a) * 1200 * dt; }
    if (Math.random() < 0.9) { const a = Math.random() * 6.28; part(v.x + Math.cos(a) * 60, v.y + Math.sin(a) * 34, { vx: -Math.cos(a) * 80, vy: -Math.sin(a) * 45, col: vc, life: 0.6, size: 2, add: true }); }
    if (!v.boom && v.t > v.life - 0.2) { v.boom = true; sfx('boom'); shake(7); ring(v.x, v.y, 80, vc, 0.5, 5); fxAt('explosion', v.x, v.y - 16, { fps: 26, layer: 1, scale: 1.2 }); for (const e of G.enemies) if (!e.dead && dist(e.x, e.y, v.x, v.y) < 70) strikeEnemy(P, e, (30 + v.pw * 1.8) / Math.max(1, P.st8.mag), { magic: true, el: v.el || 'ombre', noXp: true, kb: 260 }); }
  }
  G.voids = G.voids.filter(v => v.t < v.life);
  for (const p of G.pillars) p.t += dt; G.pillars = G.pillars.filter(p => p.t < 0.8);
  if (G.beams) { for (const b of G.beams) b.t += dt; G.beams = G.beams.filter(b => b.t < 0.35); }
  for (const p of WORLD.props) {
    if (p.def.glint && !(p.respawnAt > G.t) && Math.random() < dt * 1.5 && Math.abs(p.x - P.x) < W && Math.abs(p.y - P.y) < H) part(p.x + rnd(-10, 10), p.y - rnd(4, 20), { col: p.def.glint, life: 0.6, size: 1, add: true, rise: 10 });
    if (p.hidden && !p.opened && dist(p.x, p.y, P.x, P.y) < 90 && Math.random() < dt * (G.reveal > 0 ? 6 : 0.8)) part(p.x + rnd(-8, 8), p.y - rnd(2, 14), { col: '#ffe9a0', life: 0.8, size: 1, add: true, rise: 14 });
  }
}
function updateNpc(n, dt) {
  n.t += dt; const P = G.player;
  if (!n.home) { n.home = { x: n.x, y: n.y }; n.wt = rnd(1, 4); }
  if (dist(n.x, n.y, P.x, P.y) < 50) { n.dir = dirOf(P.x - n.x, P.y - n.y); n.moving = false; return; }
  n.wt -= dt;
  const range = n.role === 'guard' ? 70 : n.role === 'mage' ? 26 : 16;
  if (n.wt <= 0) { n.wt = rnd(2, 5); if (Math.random() < 0.6) { const a = Math.random() * 6.28; n.tx = n.home.x + Math.cos(a) * range; n.ty = n.home.y + Math.sin(a) * range * 0.6; } else { n.tx = null; n.dir = rndi(0, 3); } }
  if (n.tx != null) {
    const d = dist(n.x, n.y, n.tx, n.ty);
    if (d > 2) { const a = Math.atan2(n.ty - n.y, n.tx - n.x); const ox = n.x, oy = n.y; n.bw = 12; n.bh = 6; moveBody(n, Math.cos(a) * 34 * dt, Math.sin(a) * 34 * dt); n.dir = dirOf(Math.cos(a), Math.sin(a)); n.moving = Math.hypot(n.x - ox, n.y - oy) > 0.1; if (!n.moving) n.tx = null; }
    else { n.tx = null; n.moving = false; }
  } else n.moving = false;
}
function drawBolt(ctx, b, cx, cy) {
  ctx.strokeStyle = `rgba(${b.col || '255,250,200'},${1 - b.t / 0.25})`; ctx.lineWidth = 2; ctx.beginPath();
  const n = 7; ctx.moveTo(b.x0 - cx, b.y0 - cy);
  for (let i = 1; i < n; i++) { const t = i / n; ctx.lineTo(lerp(b.x0, b.x1, t) - cx + rnd(-6, 6), lerp(b.y0, b.y1, t) - cy + rnd(-6, 6)); }
  ctx.lineTo(b.x1 - cx, b.y1 - cy); ctx.stroke();
}
function drawPlayer(ctx, P, cx, cy) {
  for (const g of P.ghosts) drawChar(ctx, P.spr, g.an, g.dir, g.fr, g.x - cx, g.y - cy, g.col || 'rgba(150,200,255,0.8)', 0.35 * (1 - g.t / 0.25));
  drawShadow(ctx, P.x - cx, P.y - cy, 11, 0.35);
  const fl = P.flashT > 0 ? 'rgba(255,255,255,0.85)' : (P.state === 'charge' && P.charge >= 1 && Math.sin(G.t * 30) > 0 ? 'rgba(255,230,120,0.45)' : null);
  const blink = P.iframes > 0 && P.state !== 'dodge' && Math.floor(G.t * 20) % 2 === 0;
  drawChar(ctx, P.spr, P.anim, P.dir, P.fr, P.x - cx, P.y - cy - (P.z || 0), fl, blink ? 0.45 : undefined);
  if (P.state === 'block') {
    ctx.strokeStyle = P.blockT < 0.22 ? 'rgba(220,245,255,0.95)' : 'rgba(150,200,255,0.65)'; ctx.lineWidth = P.blockT < 0.22 ? 3 : 2;
    ctx.beginPath(); ctx.ellipse(P.x - cx, P.y - cy - 16, 20, 16, 0, P.aim - 0.9, P.aim + 0.9); ctx.stroke();
  }
  if (P.shield > 0) { if (P.shieldCol) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + Math.sin(G.t * 6) * 0.1; ctx.drawImage(glowSprite(P.shieldCol, 32), P.x - cx - 26, P.y - cy - 46, 52, 52); ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = 'rgba(' + P.shieldCol + ',0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(P.x - cx, P.y - cy - 18, 20, 24, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; } else { ctx.globalAlpha = 0.5 + Math.sin(G.t * 6) * 0.1; drawFx(ctx, 'iceshield', 8 + Math.floor(G.t * 6) % 4, P.x - cx, P.y - cy - 22); ctx.globalAlpha = 1; } }
  if (P.state === 'charge') { const k = P.charge; ctx.fillStyle = '#120c18'; ctx.fillRect(P.x - cx - 13, P.y - cy + 4, 26, 4); ctx.fillStyle = k >= 1 ? '#ffe26b' : '#9fd8ff'; ctx.fillRect(P.x - cx - 12, P.y - cy + 5, 24 * k, 2); }
}
function drawEnemy(ctx, e, cx, cy) {
  const d = e.def; const x = e.x - cx, y = e.y - cy;
  const fadeA = e.dead ? clamp(1.6 - e.deadT, 0, 1) : undefined;
  const fl = e.flash > 0 ? 'rgba(255,255,255,0.9)' : e.freeze > 0 ? 'rgba(150,210,255,0.55)' : (e.state === 'wind' || e.state === 'cwind' || e.state === 'slamw') && Math.sin(G.t * 30) > 0 ? 'rgba(255,60,40,0.45)' : null;
  drawShadow(ctx, x, y, d.boss ? 24 : d.mon ? 8 : 11, d.fly ? 0.2 : 0.32);
  if (d.boss) { const s = glowSprite(e.phase === 3 ? '255,40,30' : '255,120,40', 32); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = e.phase >= 2 ? 0.5 : 0.22; ctx.drawImage(s, x - 60, y - 110, 120, 120); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  if (e.curse > G.t && !e.dead) { ctx.globalAlpha = 0.6; ctx.fillStyle = '#c026d3'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 66, 3, 3); ctx.globalAlpha = 1; }
  if (d.dummy) { drawDummy(ctx, e, x, y, fl, fadeA); if (!e.dead && e.hp < e.maxhp) bar(ctx, x - 10, y - 46, 20, 2, e.hp / e.maxhp, '#e8b44a'); return; }
  if (d.mon) {
    if (e.dead) { if (ENV.mon[d.mon].death) drawMonDeath(ctx, d.mon, e.dir, Math.floor(e.deadT * 10), x, y - (e.z || 0)); else drawMon(ctx, d.mon, e.dir, e.t, x, y - (e.z || 0), null, fadeA); }
    else drawMon(ctx, d.mon, e.dir, e.t, x, y - (e.z || 0), fl);
  } else {
    const sc = d.scale || 1;
    if (e.dead) drawChar(ctx, e.spr, 'hurt', 0, Math.min(5, Math.floor(e.animT * 10)), x, y, null, fadeA, sc);
    else drawChar(ctx, e.spr, e.anim, e.dir, e.fr, x, y, fl, undefined, sc);
  }
  if (e.dead) return;
  if (e.state === 'wind' || e.state === 'cwind' || e.state === 'slamw') txt(ctx, '!', x, y - (d.mon ? 30 : 58 * (d.scale || 1)), '#ff4a3a', 12, 'center');
  if (e.state === 'stun') txt(ctx, '✦', x + Math.sin(G.t * 8) * 6, y - 56, '#fff27a', 9, 'center');
  if (!d.boss && e.hp < e.maxhp) { const w = d.elite ? 28 : 20; bar(ctx, x - w / 2, y - (d.mon ? 30 + (e.z || 0) : 56), w, 2, e.hp / e.maxhp, d.elite ? '#ff9a3a' : '#e8434a'); }
  if (d.elite && !e.dead) txt(ctx, d.name, x, y - 62, '#ffb36b', 7, 'center');
}
// ---------- ambiance visuelle : nuages, reflets d'eau, fumées, vignette ----------
const CLOUD = document.createElement('canvas'); CLOUD.width = CLOUD.height = 128;
(() => { const c = CLOUD.getContext('2d'); const g = c.createRadialGradient(64, 64, 8, 64, 64, 64); g.addColorStop(0, 'rgba(10,12,30,0.16)'); g.addColorStop(1, 'rgba(10,12,30,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); })();
function drawCloudShadows(ctx, cx, cy) {
  for (let i = 0; i < 4; i++) {
    const sp = 9 + i * 3; const w = 420 + i * 90; const per = MW * TILE + w;
    const x = ((G.t * sp + i * 977) % per) - w / 2 - cx + (i % 2 ? 0 : 200), y = ((i * 613 + Math.sin(G.t * 0.03 + i) * 80) % (MH * TILE)) - cy;
    if (x > -w && x < W + w && y > -w && y < H + w) ctx.drawImage(CLOUD, x - w / 2, y - w * 0.3, w, w * 0.6);
  }
}
function ambientWorld(dt) {
  const P = G.player; const cx = G.cam.x, cy = G.cam.y;
  // reflets sur l'eau
  for (let k = 0; k < 3; k++) { const tx = Math.floor((cx + Math.random() * W) / TILE), ty = Math.floor((cy + Math.random() * H) / TILE); if (isSolidTile(tx, ty) && vget(tx, ty) === T_WATER && Math.random() < 0.5) part(tx * TILE + Math.random() * 32, ty * TILE + Math.random() * 32, { col: 'rgba(230,250,255,0.9)', life: 0.6, size: 1, add: true, drag: 1 }); }
  // fumée des cheminées
  for (const p of WORLD.props) if ((p.type === 'house_a' || p.type === 'house_b' || p.type === 'house_c') && Math.abs(p.x - P.x) < W && Math.abs(p.y - P.y) < H && Math.random() < dt * 2.2) {
    const r = p.def.r; part(p.x + r[2] * 0.22, p.y - r[3] + 8, { col: 'rgba(200,200,210,0.45)', life: 3, size: 3, vx: rnd(4, 10), vy: -rnd(10, 18), drag: 1 });
  }
  // lucioles autour des lampadaires la nuit tombante / papillons le jour
  if (G.zone && G.zone.id === 'village' && Math.random() < dt * 1.5) part(cx + Math.random() * W, cy + Math.random() * H, { col: choice(['#ffd6f0', '#fff3a0', '#bfe9ff']), life: 3, size: 1, vx: rnd(-14, 14), vy: rnd(-10, 6), drag: 1, rise: 4 });
}
function drawVignette(ctx) {
  if (!drawVignette.g || drawVignette.w !== W) { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); const g = x.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.72); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(8,4,16,0.42)'); x.fillStyle = g; x.fillRect(0, 0, W, H); drawVignette.g = c; drawVignette.w = W; }
  ctx.drawImage(drawVignette.g, 0, 0);
}
// mannequin d'entraînement (dessiné en pixel art)
function drawDummy(ctx, e, x, y, fl, a) {
  x = Math.round(x); y = Math.round(y); const wob = e.flash > 0 ? Math.sin(G.t * 60) * 2 : 0;
  if (a !== undefined) ctx.globalAlpha = a;
  ctx.fillStyle = '#5a3d22'; ctx.fillRect(x - 2, y - 30, 4, 30); ctx.fillStyle = '#3e2914'; ctx.fillRect(x - 6, y - 2, 12, 3);
  ctx.save(); ctx.translate(x, y - 22); ctx.rotate(wob * 0.05);
  ctx.fillStyle = fl ? '#fff' : '#d9b46a'; ctx.fillRect(-7, -14, 14, 18); ctx.fillStyle = '#b8914d'; ctx.fillRect(-7, -14, 14, 3); ctx.fillRect(-7, 1, 14, 3);
  ctx.fillStyle = '#c94a3a'; ctx.fillRect(-3, -8, 6, 6); ctx.fillStyle = '#fff1d0'; ctx.fillRect(-1, -6, 2, 2);
  ctx.fillStyle = fl ? '#fff' : '#e3c27a'; ctx.fillRect(-5, -24, 10, 10); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(-3, -20, 2, 2); ctx.fillRect(1, -20, 2, 2);
  ctx.fillStyle = '#7a5530'; ctx.fillRect(-14, -12, 28, 3);
  ctx.restore(); ctx.globalAlpha = 1;
}
// barre d'édition tactile
$('editDone').onclick = () => { TOUCH.edit = false; G.paused = false; $('editbar').classList.remove('show'); saveTouchLayout(); toast('Disposition enregistrée', '#9f9'); };
// boutons HUD
$('hbMenu').onclick = () => { if (G.mode === 'play' && !G.paused) openMenu(); };
$('hbBag').onclick = () => { if (G.mode === 'play' && !G.paused) openMenu('sac'); };
// raccourcis clavier de menu
setInterval(() => {}, 1000);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
window.addEventListener('pagehide', saveGame);
window.addEventListener('keydown', e => {
  if (G.mode !== 'play' || rebinding) return;
  const acts = actOf(e.code);
  if (acts.includes('menu')) { if (G.paused && !TOUCH.edit) closePanel(); else if (!G.paused) openMenu(); }
  else if (!G.paused && acts.includes('inventory')) openMenu('sac');
  else if (!G.paused && acts.includes('character')) openMenu('perso');
  else if (!G.paused && acts.includes('map')) openMenu('quetes');
});
// navigation des menus à la manette (croix ou stick gauche, A valider, B retour, LB/RB onglets)
function padOverlay() {
  if (document.querySelector('.tconfirm')) return document.querySelector('.tconfirm');
  if ($('panel').classList.contains('show')) return $('panel');
  if ($('creator').classList.contains('show')) return $('creator');
  if ($('title').classList.contains('show')) return $('title');
  return null;
}
function padFocusables(ov) { return [...ov.querySelectorAll('button:not([disabled]),[data-sel],[data-eqslot],[data-style],[data-cinfo],[data-tostash],[data-fromstash],[data-esel],select')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'); }
function padMoveFocus(list, dx, dy) {
  const cur = document.activeElement; let i = list.indexOf(cur);
  if (i < 0) { list[0].focus(); list[0].scrollIntoView({ block: 'nearest', inline: 'nearest' }); return; }
  const r0 = cur.getBoundingClientRect(); const cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
  let best = null, bd = 1e9;
  for (const el of list) {
    if (el === cur) continue; const r = el.getBoundingClientRect(); const ex = r.left + r.width / 2, ey = r.top + r.height / 2;
    const ddx = ex - cx, ddy = ey - cy; const along = ddx * dx + ddy * dy; if (along <= 4) continue;
    const across = Math.abs(ddx * dy - ddy * dx); const d = along + across * 2.2;
    if (d < bd) { bd = d; best = el; }
  }
  if (!best) best = list[(i + (dx + dy > 0 ? 1 : -1) + list.length) % list.length];
  best.focus(); best.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
function padUI() {
  const gp = PAD.gp; const ov = padOverlay(); const prev = PAD.uiPrev || {}; const cur = {};
  for (let i = 0; i < 16; i++) cur[i] = gp ? padBtn(gp, i) : false; PAD.uiPrev = cur;
  if (!gp || !ov || !PAD.active) { PAD.nav.dir = null; return; }
  const list = padFocusables(ov); if (!list.length) { clearPressed(); return; }
  let fresh = false;
  if (!ov.contains(document.activeElement)) { const first = list.find(el => el.closest('.cropts2,.pbody .on,.dopts,.tmenu,.spinbtns')) || list.find(el => !el.closest('.ptabs') && !el.closest('.steps') && !el.closest('.crstage')) || list[0]; first.focus({ preventScroll: true }); fresh = true; }
  const edge = i => cur[i] && !prev[i];
  // direction (croix + stick) avec répétition
  let dir = null; const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  if (padBtn(gp, 12) || ay < -0.55) dir = 'u'; else if (padBtn(gp, 13) || ay > 0.55) dir = 'd'; else if (padBtn(gp, 14) || ax < -0.55) dir = 'l'; else if (padBtn(gp, 15) || ax > 0.55) dir = 'r';
  const now = performance.now();
  if (fresh) { PAD.nav.dir = dir; PAD.nav.t = now + 380; dir = null; }
  if (dir && (dir !== PAD.nav.dir || now > PAD.nav.t)) { PAD.nav.t = now + (dir !== PAD.nav.dir ? 380 : 120); padMoveFocus(list, dir === 'l' ? -1 : dir === 'r' ? 1 : 0, dir === 'u' ? -1 : dir === 'd' ? 1 : 0); sfx('ui'); }
  if (!fresh) PAD.nav.dir = dir;
  if (edge(0) && !fresh) { const el = document.activeElement; if (el && ov.contains(el)) el.click(); }
  if (edge(1)) { const x = ov.querySelector('[data-close],.ptabs .x,[data-tback],[data-crnav="back"],#tcNo,#ritualskip,.skip'); if (x) x.click(); else if (G.mode === 'play') closePanel(); }
  if (edge(4) || edge(5)) { // onglets
    const tabs = [...ov.querySelectorAll('.ptabs button:not(.x):not([disabled]),.steps button')]; const on = tabs.findIndex(b => b.classList.contains('on'));
    if (tabs.length > 1 && on >= 0) { const nx = tabs[(on + (edge(5) ? 1 : -1) + tabs.length) % tabs.length]; nx.click(); sfx('ui'); }
  }
  if (G.mode !== 'play' || G.paused) clearPressed();
}
PAD.uiPrev = {};
document.addEventListener('padmenu', e => { if (G.mode !== 'play' || TOUCH.edit) return; if (G.paused) { if (!G.spinning && !$('ritualcv')) closePanel(); } else openMenu(e.detail === 'menu' ? undefined : 'sac'); });
window.__api = { G, WORLD, PROPS, REG, spawnEnemy, rebuildPlayer, openMenu, closePanel, damageEnemy, hurtPlayer, castSkill, startGame, giveItem, performSpin, computeStats, findInst, equipInst, migrateSave, countItem };
boot();
