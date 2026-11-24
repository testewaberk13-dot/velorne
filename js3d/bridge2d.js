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
  try {
    if (kind === 'player') drawPlayer(x, o, cx, cy);
    else if (kind === 'enemy') drawEnemy(x, o, cx, cy);
    else if (kind === 'npc') drawChar(x, o.spr, 'walk', o.dir, o.moving ? 1 + Math.floor(o.t * 8) % 8 : 0, o.x - cx, o.y - cy);
    else if (kind === 'drop') drawDrop(x, o, cx, cy);
    else if (kind === 'proj') drawProj(x, o, cx, cy);
  } catch (e) { } finally { drawShadow = sh; }
  return foot;
};

// ---------- effets (compétences, impacts, particules, télégraphes) : dessinés au sol, vus d'en haut ----------
B2D.drawEffects = function (c, cx, cy, wpx, hpx, scale) {
  const ctx2 = c.getContext('2d'); ctx2.setTransform(1, 0, 0, 1, 0, 0); ctx2.clearRect(0, 0, c.width, c.height); ctx2.setTransform(scale, 0, 0, scale, 0, 0); ctx2.imageSmoothingEnabled = false;
  const nL = G.lights.length;
  B2D.withView(wpx, hpx, () => {
    const safe = f => { try { f(); } catch (e) { } };
    for (const z of G.zones2) if (!z.done) safe(() => { const k = clamp(z.t / z.delay, 0, 1); ctx2.globalAlpha = 0.25 + k * 0.35; ctx2.fillStyle = `rgba(${z.col},0.35)`; ctx2.strokeStyle = `rgba(${z.col},1)`; ctx2.lineWidth = 1.5;
      ctx2.beginPath(); ctx2.ellipse(z.x - cx, z.y - cy, z.r, z.r * 0.55, 0, 0, 7); ctx2.stroke(); ctx2.beginPath(); ctx2.ellipse(z.x - cx, z.y - cy, z.r * k, z.r * 0.55 * k, 0, 0, 7); ctx2.fill(); ctx2.globalAlpha = 1; });
    for (const r of G.rifts || []) if (r.t >= 0) safe(() => { ctx2.globalAlpha = 0.35 * (1 - r.t / r.life) + 0.1; ctx2.fillStyle = 'rgb(' + r.col + ')'; ctx2.beginPath(); ctx2.ellipse(r.x - cx, r.y - cy, r.r, r.r * 0.5, 0, 0, 7); ctx2.fill(); ctx2.globalAlpha = 1; });
    for (const v of G.voids || []) safe(() => { const k = v.t / v.life; ctx2.fillStyle = 'rgba(20,0,40,0.75)'; ctx2.beginPath(); ctx2.ellipse(v.x - cx, v.y - cy, 18 + k * 30, (18 + k * 30) * 0.55, 0, 0, 7); ctx2.fill(); drawCircle(ctx2, v.x - cx, v.y - cy, 50, -G.t * 3, '139,92,246', 0.8); });
    if (G.sacred) safe(() => { ctx2.globalAlpha = 0.25 + Math.sin(G.t * 5) * 0.08; ctx2.fillStyle = '#fff3c0'; ctx2.beginPath(); ctx2.ellipse(G.sacred.x - cx, G.sacred.y - cy, 70, 38, 0, 0, 7); ctx2.fill(); ctx2.globalAlpha = 1; drawCircle(ctx2, G.sacred.x - cx, G.sacred.y - cy, 66, G.t, '255,233,160', 0.9); });
    for (const p of WORLD.props) if ((p.def.arcane || p.def.circle) && Math.abs(p.x - cx - wpx / 2) < wpx / 2 + 100 && Math.abs(p.y - cy - hpx / 2) < hpx / 2 + 100) safe(() => {
      if (p.def.circle) drawCircle(ctx2, p.x - cx, p.y - cy - 4, 40, G.t, p.def.circle, 0.75);
      else { ctx2.globalAlpha = 0.18; ctx2.fillStyle = 'rgb(' + p.def.arcane + ')'; ctx2.beginPath(); ctx2.ellipse(p.x - cx, p.y - cy, 82, 40, 0, 0, 7); ctx2.fill(); ctx2.globalAlpha = 1; drawCircle(ctx2, p.x - cx, p.y - cy, 80, G.t * 0.6, p.def.arcane, 0.8); }
    });
    safe(() => drawFxList(ctx2, cx, cy, -1)); safe(() => drawMfx(ctx2, cx, cy, 'ground'));
    safe(() => drawFxList(ctx2, cx, cy, 0)); safe(() => drawParts(ctx2, cx, cy, false));
    ctx2.globalCompositeOperation = 'lighter';
    safe(() => drawFxList(ctx2, cx, cy, 1)); safe(() => drawMfx(ctx2, cx, cy, 'glow')); safe(() => drawParts(ctx2, cx, cy, true));
    for (const b of G.bolts) safe(() => drawBolt(ctx2, b, cx, cy));
    if (G.beams) for (const b of G.beams) safe(() => { const k = 1 - b.t / 0.35; ctx2.save(); ctx2.translate(b.x - cx, b.y - cy); ctx2.rotate(b.a); ctx2.fillStyle = `rgba(${b.col},${0.35 * k})`; ctx2.fillRect(0, -10 * k, b.len, 20 * k); ctx2.fillStyle = `rgba(255,255,255,${0.8 * k})`; ctx2.fillRect(0, -2, b.len, 4); ctx2.restore(); });
    for (const t of G.tornados || []) safe(() => drawFx(ctx2, 'tornado', 4 + Math.floor(t.t * 14) % 8, t.x - cx, t.y - cy - 40, 1, 0.9));
    for (const p of G.pillars || []) safe(() => { const k = p.t / 0.8; ctx2.globalAlpha = 1 - k; ctx2.fillStyle = 'rgba(255,245,190,0.9)'; ctx2.beginPath(); ctx2.ellipse(p.x - cx, p.y - cy, 24 * (1 - k * 0.5), 14 * (1 - k * 0.5), 0, 0, 7); ctx2.fill(); ctx2.globalAlpha = 1; });
    ctx2.globalCompositeOperation = 'source-over';
    safe(() => drawMfx(ctx2, cx, cy, 'top')); safe(() => drawRings(ctx2, cx, cy));
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
  if (G.timeTint > 0) { ctx.fillStyle = 'rgba(200,170,255,0.18)'; ctx.fillRect(0, 0, W, H); }
  if (G.reveal > 0) { ctx.strokeStyle = 'rgba(255,233,160,0.35)'; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, W - 3, H - 3); }
  if (G.flash) { ctx.globalAlpha = Math.max(0, G.flash.a); ctx.fillStyle = G.flash.col; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (P.hp < P.st8.maxhp * 0.25 && P.state !== 'dead') { const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8); g.addColorStop(0, 'rgba(120,0,0,0)'); g.addColorStop(1, `rgba(150,0,0,${0.25 + Math.sin(G.t * 6) * 0.1})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  try { drawHUD(ctx); } catch (e) { console.warn('hud', e); }
  if (TOUCH.edit) txt(ctx, 'Fais glisser les boutons, puis touche « Terminer »', W / 2, H / 2, '#ffe9a0', 11, 'center');
};

// ---------- prise de relais du dessin : en partie, la 3D dessine le monde ; titre et création restent ceux du jeu ----------
const B2D_render0 = render;
render = function () {
  const live = B2D.on && G.mode === 'play' && B2D.frame3d;
  document.body.classList.toggle('v3d', !!live);
  if (!live) return B2D_render0();
  try { B2D.frame3d(); } catch (e) { console.error('3D', e); }
  B2D.overlay();
};
// souris : la visée du jeu attend une position écran relative à G.cam → on la recalcule depuis le sol 3D
B2D.setMouseWorld = (wx, wy) => { IN.mouse.x = wx - G.cam.x; IN.mouse.y = wy - G.cam.y; IN.mouse.active = true; IN.mouse.t = G.t; };
