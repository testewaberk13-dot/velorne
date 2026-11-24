'use strict';
// =====================================================================
//  VÉLORNE 3D — PASSERELLE AVEC LA LOGIQUE DU JEU
//  Toute la logique (combat, 270 compétences, Magic Spin, quêtes, PNJ, inventaire, progression, sauvegarde, menus)
//  reste celle du jeu : ce fichier ne fait que donner au moteur 3D les moyens de la dessiner.
//  Repère : 1 tuile (32 px) = 1 mètre. Position 3D = (x / 32, hauteur, y / 32).
// =====================================================================
const B2D = {
  on: false,          // vrai quand le moteur 3D a pris le relais du dessin
  frame3d: null,      // fonction fournie par le moteur 3D, appelée à chaque image
  project: null,      // (x, y, h) monde → {x, y} en pixels de la toile d'interface, ou null
};
// accès aux dimensions de vue (variables du jeu)
B2D.view = () => [W, H];
B2D.withView = (w, h, fn) => { const ow = W, oh = H; W = w; H = h; try { return fn(); } finally { W = ow; H = oh; } };
const B2D_NOOP = () => {};

// ---------- sol : tuiles + décors plats d'un bloc de carte, dessinés dans une toile ----------
B2D.bakeGround = function (c, tx0, ty0, n, scale) {
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.setTransform(scale, 0, 0, scale, 0, 0);
  const cx = tx0 * TILE, cy = ty0 * TILE;
  B2D.withView(n * TILE, n * TILE, () => {
    try { drawTerrain(x, cx, cy); } catch (e) { console.warn('sol', e); }
    for (const p of WORLD.props) if (p.def.flat && p.x > cx - 64 && p.x < cx + n * TILE + 64 && p.y > cy - 64 && p.y < cy + n * TILE + 96) { try { drawProp(x, p, cx, cy); } catch (e) { } }
  });
  x.setTransform(1, 0, 0, 1, 0, 0);
};

// ---------- décor debout : une image par apparence (mise en cache côté 3D) ----------
B2D.propKey = p => { const r = propSprite(p); return p.def.im + ':' + r.join(','); };
B2D.drawPropSprite = function (c, p) {
  const r = propSprite(p); c.width = r[2]; c.height = r[3]; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.drawImage(img(p.def.im), r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return r;
};

// ---------- personnages, ennemis, PNJ : dessinés par les fonctions du jeu dans une petite toile ----------
B2D.drawActor = function (c, kind, o) {
  const S = c.width, foot = Math.round(S * 0.8); const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, S, S); x.imageSmoothingEnabled = false;
  const cx = o.x - S / 2, cy = o.y - foot; const sh = drawShadow; drawShadow = B2D_NOOP;
  if (kind === 'player' || kind === 'enemy' || kind === 'npc') { const a = B2D.facing(o); B2D.dir8 = B2D.sector(a); B2D.dir4 = B2D.sector4(a); }
  try {
    if (kind === 'player') drawPlayer(x, o, cx, cy);
    else if (kind === 'enemy') drawEnemy(x, o, cx, cy);
    else if (kind === 'npc') drawChar(x, o.spr, 'walk', o.dir, o.moving ? 1 + Math.floor(o.t * 8) % 8 : 0, o.x - cx, o.y - cy);
    else if (kind === 'drop') drawDrop(x, o, cx, cy);
    else if (kind === 'proj') drawProj(x, o, cx, cy);
  } catch (e) { } finally { drawShadow = sh; B2D.dir8 = null; B2D.dir4 = null; }
  return foot;
};

// ---------- effets (compétences, impacts, particules, télégraphes) : dessinés au sol, vus d'en haut ----------
B2D.drawEffects = function (c, cx, cy, wpx, hpx, scale, layer, rot) {
  const ctx2 = c.getContext('2d'); ctx2.setTransform(1, 0, 0, 1, 0, 0); ctx2.clearRect(0, 0, c.width, c.height); ctx2.setTransform(scale, 0, 0, scale, 0, 0); ctx2.imageSmoothingEnabled = false;
  const L = layer || 'all', GND = L !== 'air', AIR = L !== 'ground';
  if (rot) { const P = G.player, ox = P.x - cx, oy = P.y - cy; ctx2.translate(ox, oy); ctx2.rotate(rot); ctx2.translate(-ox, -oy); } // couche en volume : positions tournées comme la caméra
  const nL = G.lights.length;
  B2D.withView(wpx, hpx, () => {
    const safe = f => { try { f(); } catch (e) { } };
    if (GND) for (const z of G.zones2) if (!z.done) safe(() => { const k = clamp(z.t / z.delay, 0, 1); ctx2.globalAlpha = 0.25 + k * 0.35; ctx2.fillStyle = `rgba(${z.col},0.35)`; ctx2.strokeStyle = `rgba(${z.col},1)`; ctx2.lineWidth = 1.5;
      ctx2.beginPath(); ctx2.ellipse(z.x - cx, z.y - cy, z.r, z.r * 0.55, 0, 0, 7); ctx2.stroke(); ctx2.beginPath(); ctx2.ellipse(z.x - cx, z.y - cy, z.r * k, z.r * 0.55 * k, 0, 0, 7); ctx2.fill(); ctx2.globalAlpha = 1; });
    if (GND) for (const r of G.rifts || []) if (r.t >= 0) safe(() => { ctx2.globalAlpha = 0.35 * (1 - r.t / r.life) + 0.1; ctx2.fillStyle = 'rgb(' + r.col + ')'; ctx2.beginPath(); ctx2.ellipse(r.x - cx, r.y - cy, r.r, r.r * 0.5, 0, 0, 7); ctx2.fill(); ctx2.globalAlpha = 1; });
    if (GND) for (const v of G.voids || []) safe(() => { const k = v.t / v.life; ctx2.fillStyle = 'rgba(20,0,40,0.75)'; ctx2.beginPath(); ctx2.ellipse(v.x - cx, v.y - cy, 18 + k * 30, (18 + k * 30) * 0.55, 0, 0, 7); ctx2.fill(); drawCircle(ctx2, v.x - cx, v.y - cy, 50, -G.t * 3, '139,92,246', 0.8); });
    if (GND && G.sacred) safe(() => { ctx2.globalAlpha = 0.25 + Math.sin(G.t * 5) * 0.08; ctx2.fillStyle = '#fff3c0'; ctx2.beginPath(); ctx2.ellipse(G.sacred.x - cx, G.sacred.y - cy, 70, 38, 0, 0, 7); ctx2.fill(); ctx2.globalAlpha = 1; drawCircle(ctx2, G.sacred.x - cx, G.sacred.y - cy, 66, G.t, '255,233,160', 0.9); });
    if (GND) for (const p of WORLD.props) if ((p.def.arcane || p.def.circle) && Math.abs(p.x - cx - wpx / 2) < wpx / 2 + 100 && Math.abs(p.y - cy - hpx / 2) < hpx / 2 + 100) safe(() => {
      if (p.def.circle) drawCircle(ctx2, p.x - cx, p.y - cy - 4, 40, G.t, p.def.circle, 0.75);
      else { ctx2.globalAlpha = 0.18; ctx2.fillStyle = 'rgb(' + p.def.arcane + ')'; ctx2.beginPath(); ctx2.ellipse(p.x - cx, p.y - cy, 82, 40, 0, 0, 7); ctx2.fill(); ctx2.globalAlpha = 1; drawCircle(ctx2, p.x - cx, p.y - cy, 80, G.t * 0.6, p.def.arcane, 0.8); }
    });
    if (GND) { safe(() => drawFxList(ctx2, cx, cy, -1)); safe(() => drawMfx(ctx2, cx, cy, 'ground')); }
    if (AIR) { safe(() => drawFxList(ctx2, cx, cy, 0)); safe(() => drawParts(ctx2, cx, cy, false)); }
    ctx2.globalCompositeOperation = 'lighter';
    if (AIR) { safe(() => drawFxList(ctx2, cx, cy, 1)); safe(() => drawMfx(ctx2, cx, cy, 'glow')); safe(() => drawParts(ctx2, cx, cy, true)); }
    if (AIR) for (const b of G.bolts) safe(() => drawBolt(ctx2, b, cx, cy));
    if (AIR && G.beams) for (const b of G.beams) safe(() => { const k = 1 - b.t / 0.35; ctx2.save(); ctx2.translate(b.x - cx, b.y - cy); ctx2.rotate(b.a); ctx2.fillStyle = `rgba(${b.col},${0.35 * k})`; ctx2.fillRect(0, -10 * k, b.len, 20 * k); ctx2.fillStyle = `rgba(255,255,255,${0.8 * k})`; ctx2.fillRect(0, -2, b.len, 4); ctx2.restore(); });
    if (AIR) for (const t of G.tornados || []) safe(() => drawFx(ctx2, 'tornado', 4 + Math.floor(t.t * 14) % 8, t.x - cx, t.y - cy - 40, 1, 0.9));
    if (AIR) for (const p of G.pillars || []) safe(() => { const k = p.t / 0.8; ctx2.globalAlpha = 1 - k; ctx2.fillStyle = 'rgba(255,245,190,0.9)'; ctx2.beginPath(); ctx2.ellipse(p.x - cx, p.y - cy, 24 * (1 - k * 0.5), 14 * (1 - k * 0.5), 0, 0, 7); ctx2.fill(); ctx2.globalAlpha = 1; });
    ctx2.globalCompositeOperation = 'source-over';
    if (AIR) safe(() => drawMfx(ctx2, cx, cy, 'top')); if (GND) safe(() => drawRings(ctx2, cx, cy));
  });
  G.lights.length = nL; ctx2.setTransform(1, 0, 0, 1, 0, 0); ctx2.globalAlpha = 1; ctx2.globalCompositeOperation = 'source-over';
};

// ---------- interface au-dessus de la 3D : chiffres, signes de quête, voiles d'écran, HUD du jeu ----------
B2D.overlay = function () {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
  const P = G.player, pr = B2D.project;
  if (pr) {
    for (const n of G.nums) { const s = pr(n.x, n.y, 0.3); if (!s) continue; const a = n.t < 0.6 ? 1 : 1 - (n.t - 0.6) / 0.3, k = n.big ? 1 + Math.max(0, 0.3 - n.t) * 2 : 1;
      ctx.globalAlpha = Math.max(0, a); ctx.font = `bold ${Math.round((n.big ? 13 : 10) * k)}px 'Trebuchet MS',sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#120a1a'; ctx.strokeText(n.v, s.x, s.y); ctx.fillStyle = n.col; ctx.fillText(n.v, s.x, s.y); }
    ctx.globalAlpha = 1;
    for (const n of G.npcs) if ((G.quests.main === 0 || G.quests.main === 2) && n.role === 'quest') { const s = pr(n.x, n.y, 2.3); if (s) txt(ctx, '!', s.x, s.y + Math.sin(G.t * 5) * 2, '#ffe27a', 14, 'center'); }
    if (typeof narrMarkers === 'function') { try { narrMarkers(pr); } catch (e) { } }
  }
  try { B2D.drawAim3D(ctx); } catch (e) { }
  try { if (B2D.extraOverlay) B2D.extraOverlay(ctx); } catch (e) { }
  if (G.timeTint > 0) { ctx.fillStyle = 'rgba(200,170,255,0.18)'; ctx.fillRect(0, 0, W, H); }
  if (G.reveal > 0) { ctx.strokeStyle = 'rgba(255,233,160,0.35)'; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, W - 3, H - 3); }
  if (G.flash) { ctx.globalAlpha = Math.max(0, G.flash.a); ctx.fillStyle = G.flash.col; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (P.hp < P.st8.maxhp * 0.25 && P.state !== 'dead') { const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8); g.addColorStop(0, 'rgba(120,0,0,0)'); g.addColorStop(1, `rgba(150,0,0,${0.25 + Math.sin(G.t * 6) * 0.1})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  try { drawHUD(ctx); } catch (e) { console.warn('hud', e); }
  // mini-carte : en 3D, carte locale ronde qui tourne avec la caméra (le haut = la direction regardée) ; option « nord fixe »
  try { if (MINIMAP) { const mh = Math.min(72, Math.round(96 * MH / MW)), mw = Math.round(mh * MW / MH), mx = W - mw - 5, my = 5, rot = !(SET.c3d && SET.c3d.mapRot === false);
    if (!rot) { const sx = mw / (MW * TILE), sy = mh / (MH * TILE), px = mx + P.x * sx, py = my + P.y * sy, fa = Math.atan2(-Math.cos(B2D.yaw), -Math.sin(B2D.yaw));
      ctx.save(); ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip(); ctx.fillStyle = 'rgba(255,240,190,0.28)'; ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, 9, fa - 0.55, fa + 0.55); ctx.closePath(); ctx.fill(); ctx.restore(); }
    else { const R = mh / 2, cx = W - 5 - R, cy = my + R, k = R / (B2D.mapRange || 46 * TILE);
      // recouvre la carte fixe dessinée par le jeu
      ctx.fillStyle = 'rgba(10,8,16,0.92)'; ctx.fillRect(mx - 3, my - 3, mw + 6, mh + 6); ctx.fillRect(cx - R - 3, cy - R - 3, 2 * R + 6, 2 * R + 6);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = '#100c18'; ctx.fill();
      ctx.translate(cx, cy); ctx.rotate(B2D.yaw); ctx.translate(-P.x * k, -P.y * k);
      const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 0.92; ctx.drawImage(MINIMAP, 0, 0, MW * TILE * k, MH * TILE * k); ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = sm;
      if (typeof drawFog === 'function') drawFog(ctx, 0, 0, MW * TILE * k, MH * TILE * k);
      const dot = (x, y, c, s) => { ctx.fillStyle = c; ctx.fillRect(x * k - s / 2, y * k - s / 2, s, s); }, rr = (B2D.mapRange || 46 * TILE) * 1.5;
      for (const e of G.enemies) if (!e.dead && Math.abs(e.x - P.x) < rr && Math.abs(e.y - P.y) < rr) dot(e.x, e.y, e.def.boss ? '#ff3a3a' : '#ff8a8a', e.def.boss ? 4 : 2);
      for (const n of G.npcs) { if (Math.abs(n.x - P.x) > rr || Math.abs(n.y - P.y) > rr || (typeof fogSeen === 'function' && !fogSeen(n.x, n.y))) continue; dot(n.x, n.y, '#ffe27a', 3); }
      for (const c of WORLD.chests) if (!c.opened && Math.abs(c.x - P.x) < rr && Math.abs(c.y - P.y) < rr && (typeof fogSeen !== 'function' || fogSeen(c.x, c.y))) dot(c.x, c.y, '#d9a441', 3);
      ctx.restore();
      // bord, flèche du héros (toujours vers le haut) et nord qui tourne
      ctx.strokeStyle = '#c9a45a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R + 0.5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx, cy - 4.5); ctx.lineTo(cx + 3.2, cy + 3); ctx.lineTo(cx, cy + 1.5); ctx.lineTo(cx - 3.2, cy + 3); ctx.closePath(); ctx.fill();
      const na = -Math.PI / 2 + B2D.yaw, nx = cx + Math.cos(na) * (R - 1), ny = cy + Math.sin(na) * (R - 1);
      ctx.fillStyle = 'rgba(10,8,16,0.9)'; ctx.beginPath(); ctx.arc(nx, ny, 5, 0, Math.PI * 2); ctx.fill(); txt(ctx, 'N', nx, ny + 3, '#ff8a6a', 7, 'center');
    } } } catch (e) { }
  if (TOUCH.edit) txt(ctx, 'Fais glisser les boutons, puis touche « Terminer »', W / 2, H / 2, '#ffe9a0', 11, 'center');
};

// ---------- prise de relais du dessin : en partie, la 3D dessine le monde ; titre et création restent ceux du jeu ----------
const B2D_render0 = render;
render = function () {
  const live = B2D.on && G.mode === 'play' && B2D.frame3d;
  // écran titre : le monde 3D filmé en travelling derrière le menu (au lieu de l'ancien fond 2D)
  const tl = B2D.on && (G.mode === 'title' || G.mode === 'creator') && B2D.title3d && !(SET.c3d && SET.c3d.title3d === false);
  document.body.classList.toggle('v3d', !!live || !!tl); document.body.classList.toggle('t3d', !!tl);
  if (tl) { try { B2D.title3d(); } catch (e) { console.error('3D titre', e); } const cv = document.getElementById('game'), x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); return; }
  if (!live) return B2D_render0();
  try { B2D.frame3d(); } catch (e) { console.error('3D', e); }
  B2D.overlay();
};
// souris : la visée du jeu attend une position écran relative à G.cam → on la recalcule depuis le sol 3D
B2D.setMouseWorld = (wx, wy, moved) => { IN.mouse.x = wx - G.cam.x; IN.mouse.y = wy - G.cam.y; if (moved !== false) { IN.mouse.active = true; IN.mouse.t = G.t; } };
document.getElementById('game').addEventListener('mousemove', () => { IN.mouse.active = true; IN.mouse.t = G.t; });

// =====================================================================
//  8 DIRECTIONS : les planches du jeu ont 4 directions ; les diagonales sont composées comme dans le village pilote
//  (jambes de la vue de profil, haut du corps de la vue de face ou de dos, resserré à 86 %). Le sens est calculé
//  par rapport à la caméra, qui peut tourner.
// =====================================================================
B2D.yaw = 0; B2D.dir8 = null; B2D.dir4 = null;
const B2D_FACE = new WeakMap();
const B2D_AIMST = { attack: 1, charge: 1, cast: 1, block: 1, tech: 1 }, B2D_EATK = { wind: 1, atk: 1, cwind: 1, charging: 1, slamw: 1, roar: 1 };
const B2D_DIRA = [-Math.PI / 2, Math.PI, Math.PI / 2, 0];
// angle de regard dans le monde : déplacement réel ou visée, s'il reste cohérent avec la direction choisie par le jeu
B2D.facing = function (o) {
  let s = B2D_FACE.get(o); if (!s) { s = { x: o.x, y: o.y, a: null }; B2D_FACE.set(o, s); }
  const dx = o.x - s.x, dy = o.y - s.y; s.x = o.x; s.y = o.y;
  let a = null; const P = G.player;
  if (o === P && B2D_AIMST[o.state] && o.aim != null) a = o.aim;
  else if (o !== P && B2D_EATK[o.state] && P) a = Math.atan2(P.y - o.y, P.x - o.x);
  else if (dx * dx + dy * dy > 0.05) a = Math.atan2(dy, dx);
  else a = s.a;
  const d = o.dir == null ? 2 : o.dir;
  if (a == null) a = B2D_DIRA[d]; else { let df = Math.abs(((a - B2D_DIRA[d]) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI); if (df > Math.PI / 4 + 0.06) a = B2D_DIRA[d]; } // tolérance : égalité exacte en diagonale
  s.a = a; return a;
};
// secteur à l'écran : 0 E, 1 SE, 2 S, 3 SO, 4 O, 5 NO, 6 N, 7 NE
B2D.sector = a => ((Math.round((a + B2D.yaw) / (Math.PI / 4)) % 8) + 8) % 8;
B2D.sector4 = a => [3, 2, 1, 0][((Math.round((a + B2D.yaw) / (Math.PI / 2)) % 4) + 4) % 4];
B2D.sectorOf = o => B2D.sector(B2D.facing(o));
const B2D_SEC = [[3, 3, 0], [3, 2, 1], [2, 2, 0], [1, 2, -1], [1, 1, 0], [1, 0, -1], [0, 0, 0], [3, 0, 1]]; // [jambes, haut du corps, décalage]
const B2D_TC = document.createElement('canvas'); B2D_TC.width = B2D_TC.height = 512; const B2D_TX = B2D_TC.getContext('2d'); B2D_TX.imageSmoothingEnabled = false;
const B2D_drawChar0 = drawChar;
function B2D_oneRow(spr, an) { if (spr.kind === 'grid') { const A = spr.anims[an] || spr.anims.walk; return !A || A.rows === 1; } const A = spr.a[an] || spr.a.walk; return !A || A.f.length === 1; }
drawChar = function (ctx, spr, an, dir, fr, x, y, flash, alpha, sc) {
  const D = B2D.dir8; if (D == null || !spr) return B2D_drawChar0(ctx, spr, an, dir, fr, x, y, flash, alpha, sc);
  const S = B2D_SEC[D];
  if (B2D_oneRow(spr, an)) return B2D_drawChar0(ctx, spr, an, dir, fr, x, y, flash, alpha, sc);
  if (!S[2]) return B2D_drawChar0(ctx, spr, an, S[0], fr, x, y, flash, alpha, sc);
  sc = sc || 1; const X = 256, Y = 352, K = 0.86, t = B2D_TX;
  const yLeg = Math.round(Y - 26 * sc), ySpl = Math.round(Y - 20 * sc);
  const bx = Math.max(0, Math.floor(X - 104 * sc)), by = Math.max(0, Math.floor(Y - 136 * sc)), bw = Math.min(512 - bx, Math.ceil(208 * sc)), bh = Math.min(512 - by, Math.ceil(216 * sc));
  t.clearRect(bx, by, bw, bh); B2D_drawChar0(t, spr, an, S[0], fr, X, Y, flash, undefined, sc);
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  const lh = by + bh - yLeg; if (lh > 0) ctx.drawImage(B2D_TC, bx, yLeg, bw, lh, Math.round(x - X + bx), Math.round(y - Y + yLeg), bw, lh);
  t.clearRect(bx, by, bw, bh); B2D_drawChar0(t, spr, an, S[1], fr, X, Y, flash, undefined, sc);
  const th = ySpl - by; if (th > 0) ctx.drawImage(B2D_TC, bx, by, bw, th, Math.round(x + (bx - X) * K + S[2] * 2 * sc), Math.round(y - Y + by), Math.round(bw * K), th);
  if (alpha !== undefined) ctx.globalAlpha = 1;
};
// petits monstres (planches à 4 directions) : sens choisi par rapport à la caméra
const B2D_drawMon0 = drawMon;
// petits monstres : leurs planches ont 4 directions (lignes 0 dos, 1 ouest, 2 face, 3 est). Les 4 diagonales sont composées
// comme pour le héros : bas du corps tiré de la vue de profil, haut du corps tiré de la vue de face ou de dos, resserré et
// décalé vers le côté regardé. Le monstre a ainsi 8 directions à l'écran, calculées par rapport à la caméra.
const B2D_MSEC = [[3, 3, 0], [3, 2, 1], [2, 2, 0], [1, 2, -1], [1, 1, 0], [1, 0, -1], [0, 0, 0], [3, 0, 1]];
const B2D_MC = document.createElement('canvas'); B2D_MC.width = B2D_MC.height = 384; const B2D_MX = B2D_MC.getContext('2d'); B2D_MX.imageSmoothingEnabled = false;
drawMon = function (ctx, key, dir, t, x, y, flash, alpha) {
  const D = B2D.dir8, M = ENV.mon && ENV.mon[key];
  if (D == null || !M || !(D & 1) || M.fw > 192 || M.fh > 192) return B2D_drawMon0(ctx, key, B2D.dir4 != null ? B2D.dir4 : dir, t, x, y, flash, alpha);
  const S = B2D_MSEC[D], X = 192, Y = 300, K = 0.86, c = B2D_MX, fw = M.fw, fh = M.fh;
  const top = Y - fh + 4, split = Math.round(top + fh * 0.6), bx = X - fw, bw = fw * 2;
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  c.clearRect(bx, top - 2, bw, fh + 4); B2D_drawMon0(c, key, S[0], t, X, Y, flash);
  const lh = top + fh - split; if (lh > 0) ctx.drawImage(B2D_MC, bx, split, bw, lh, Math.round(x - X + bx), Math.round(y - Y + split), bw, lh);
  c.clearRect(bx, top - 2, bw, fh + 4); B2D_drawMon0(c, key, S[1], t, X, Y, flash);
  const th = split - top + 2; if (th > 0) ctx.drawImage(B2D_MC, bx, top, bw, th, Math.round(x + (bx - X) * K + S[2] * Math.max(1, fw * 0.04)), Math.round(y - Y + top), Math.round(bw * K), th);
  ctx.globalAlpha = 1;
};
if (typeof drawMonDeath === 'function') { const B2D_dmd0 = drawMonDeath; drawMonDeath = function (ctx, key, dir, f, x, y) { return B2D_dmd0(ctx, key, B2D.dir4 != null ? B2D.dir4 : dir, f, x, y); }; }

// =====================================================================
//  COMMANDES TOURNÉES AVEC LA CAMÉRA : « haut » s'éloigne toujours de la caméra (clavier, stick, tactile) ; la visée au
//  stick et au doigt suit aussi la rotation. La souris vise directement un point du sol.
// =====================================================================
const B2D_moveAxis0 = moveAxis;
moveAxis = function () { const r = B2D_moveAxis0(); const yw = B2D.on && G.mode === 'play' ? B2D.yaw : 0; if (!yw) return r; const c = Math.cos(yw), s = Math.sin(yw); return [r[0] * c + r[1] * s, -r[0] * s + r[1] * c, r[2]]; };
const B2D_fas0 = freeAimSource;
freeAimSource = function (P) { const f = B2D_fas0(P); if (f && B2D.on && B2D.yaw && f.src !== 'mouse') return Object.assign({}, f, { a: f.a - B2D.yaw }); return f; };

// touches de caméra (modifiables dans Paramètres > Touches du clavier)
Object.assign(DEFAULT_KEYS, { camL: ['KeyN', 'Comma'], camR: ['KeyY', 'Period'], camU: ['PageUp', 'KeyT'], camD: ['PageDown', 'KeyZ'] });
Object.assign(ACTION_LABEL, { camL: 'Caméra : tourner à gauche', camR: 'Caméra : tourner à droite', camU: 'Caméra : vue plus plongeante', camD: 'Caméra : vue plus rasante' });
for (const k of ['camL', 'camR', 'camU', 'camD']) if (!SET.keys[k]) SET.keys[k] = DEFAULT_KEYS[k].slice();

// réglages de la caméra 3D dans le menu Paramètres (en partie)
const B2D_opts0 = optsHTML;
optsHTML = function () {
  const h = B2D_opts0(); if (!B2D.cam3d) return h; const c = SET.c3d || {};
  const cam = `<h4>Caméra 3D</h4><div class="row"><button data-opt="c3d_rl">Tourner ⟲</button><button data-opt="c3d_rr">Tourner ⟳</button><button data-opt="c3d_up">Vue plus plongeante</button><button data-opt="c3d_dn">Vue plus rasante</button><span class="hint">Angle : ${B2D.cam3d.angleDeg()}° (de 18° à 69°). Molette : distance ; bouton du milieu : tourner.</span><button data-opt="c3d_reset">Caméra par défaut</button><button data-opt="c3d_btns">Boutons de caméra à l'écran : ${c.btns !== false ? 'oui' : 'non'}</button><button data-opt="c3d_follow">Caméra derrière le héros quand il avance : ${c.follow !== false ? 'oui' : 'non'}</button><button data-opt="c3d_trail">Traînée de lumière vers l'objectif : ${c.trail !== false ? 'oui' : 'non'}</button><button data-opt="c3d_stick">Joystick de caméra (moitié droite de l'écran, 2 doigts : zoom) : ${c.stick !== false ? 'oui' : 'non'}</button><button data-opt="c3d_padcam">Manette : stick droit = caméra : ${c.padCam ? 'oui' : 'non (visée)'}</button><button data-opt="c3d_dof">Flou de l'arrière-plan : ${c.dof !== false ? 'oui' : 'non'}</button><button data-opt="c3d_map">Mini-carte : ${c.mapRot !== false ? 'tourne avec la caméra' : 'nord fixe'}</button><button data-opt="c3d_slow">Ralenti pendant la visée : ${c.slow !== false ? 'oui' : 'non'}</button><button data-opt="c3d_day">Cycle jour/nuit : ${c.day !== false ? 'actif' : 'figé'}</button><button data-opt="c3d_wx">Météo (pluie, neige) : ${c.wx !== false ? 'active' : 'désactivée'}</button></div>`;
  return h.replace('<h4>Manette</h4>', cam + '<h4>Manette</h4>');
};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-opt^="c3d_"]'); if (!b || !B2D.cam3d) return; e.stopImmediatePropagation(); e.preventDefault();
  const o = b.dataset.opt, c = SET.c3d || (SET.c3d = {}), C = B2D.cam3d;
  if (o === 'c3d_rl') C.rot(-Math.PI / 4); if (o === 'c3d_rr') C.rot(Math.PI / 4); if (o === 'c3d_up') C.tilt(0.1); if (o === 'c3d_dn') C.tilt(-0.1); if (o === 'c3d_reset') C.reset();
  if (o === 'c3d_btns') c.btns = c.btns === false; if (o === 'c3d_slow') c.slow = c.slow === false; if (o === 'c3d_day') c.day = c.day === false; if (o === 'c3d_wx') c.wx = c.wx === false; if (o === 'c3d_map') c.mapRot = c.mapRot === false; if (o === 'c3d_follow') c.follow = c.follow === false; if (o === 'c3d_trail') c.trail = c.trail === false; if (o === 'c3d_dof') c.dof = c.dof === false; if (o === 'c3d_stick') c.stick = c.stick === false; if (o === 'c3d_padcam') c.padCam = !c.padCam;
  saveSet(); if (G.mode === 'play') openMenu('opt');
}, true);
// qualité graphique : appliquée au moteur 3D
const B2D_gfxLabel0 = gfxLabel;
gfxLabel = function () { return B2D.on && B2D.qualLabel ? B2D.qualLabel() : B2D_gfxLabel0(); };

// =====================================================================
//  VISÉE EN 3D : trajectoire posée dans le monde et réticule (mêmes règles d'affichage que le jeu)
// =====================================================================
B2D.aimInfo = function () {
  const P = G.player; if (!P || P.state === 'dead' || G.paused || G.mode !== 'play') return null;
  const f = freeAimSource(P); if (!f) return null;
  const bow = !!(STYLES[P.style] && STYLES[P.style].ranged && hasStyle(P)); const touchAim = f.src === 'touch' && TOUCH.aim.on;
  if (!bow && !touchAim && f.src !== 'pad') return null;
  const t = assistTarget(P, f.a, 240);
  const a = (P.state === 'charge' || P.state === 'attack') ? P.aim : (t ? Math.atan2(t.y - P.y, t.x - P.x) : f.a);
  return { a, bow, t, f, ch: P.state === 'charge' ? (P.charge || 0) : 0, range: bow ? 220 : 200, held: P.state === 'charge' || touchAim };
};
B2D.drawAim3D = function (c) {
  const A = B2D.aimInfo(); if (!A || !B2D.project) return; const P = G.player, pr = B2D.project;
  c.save(); const col = A.ch >= 1 ? 'rgba(255,226,107,0.95)' : 'rgba(255,255,255,0.6)'; c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 1;
  for (let d = 18; d < A.range; d += 9) { const s = pr(P.x + Math.cos(A.a) * d, P.y + Math.sin(A.a) * d, 0.45); if (!s) continue; c.globalAlpha = 0.95 * (1 - d / A.range * 0.8); c.fillRect(Math.round(s.x), Math.round(s.y), 2, 2); }
  c.globalAlpha = 1;
  let wx = P.x + Math.cos(A.a) * A.range * 0.62, wy = P.y + Math.sin(A.a) * A.range * 0.62, h = 0.45;
  if (A.f.src === 'mouse' && !A.t) { wx = IN.mouse.x + G.cam.x; wy = IN.mouse.y + G.cam.y; }
  if (A.t) { wx = A.t.x; wy = A.t.y; h = 0.8; }
  const s = pr(wx, wy, h); if (s) {
    const r = A.bow ? 9 - A.ch * 5 : 8; c.beginPath(); c.arc(Math.round(s.x), Math.round(s.y), r, 0, Math.PI * 2); c.stroke();
    c.fillStyle = A.t ? '#ff6a5a' : '#ffffff'; c.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 2, 2);
    for (let q = 0; q < 4; q++) { const qa = q * Math.PI / 2; c.fillRect(Math.round(s.x + Math.cos(qa) * (r + 3)) - 1, Math.round(s.y + Math.sin(qa) * (r + 3)) - 1, 2, 2); }
  }
  c.restore();
};
