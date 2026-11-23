'use strict';
// ===================== Phase G1 — visée libre (Arc + bâtons/catalyseurs magiques) =====================
// Décision de l'utilisateur : visée libre manuelle pour l'Arc et pour les sorts lancés au bâton/catalyseur.
// Détails (PROPOSITIONS) : souris sur PC, stick droit à la manette, glisser-relâcher sur les boutons tactiles,
// réticule + trajectoire, précision liée à la charge de l'arc, assistance réglable (désactivée / légère / forte).
if (!SET.aimAssist) SET.aimAssist = 'legere';
const AIM_CONE = { off: 0, legere: 0.22, forte: 0.6 };
function aimAssistLabel() { return { off: 'désactivée', legere: 'légère', forte: 'forte' }[SET.aimAssist] || 'légère'; }
function aimAssistCycle() { const o = ['legere', 'forte', 'off']; SET.aimAssist = o[(o.indexOf(SET.aimAssist) + 1) % o.length]; }
if (!TOUCH.aim) TOUCH.aim = { on: false, x: 0, y: 0, until: 0 };

// d'où vient la visée libre en ce moment ? (null = aucune : visée automatique d'origine)
function freeAimSource(P) {
  if (TOUCH.aim && (TOUCH.aim.on || G.t < TOUCH.aim.until) && Math.hypot(TOUCH.aim.x, TOUCH.aim.y) > 0.2) return { a: Math.atan2(TOUCH.aim.y, TOUCH.aim.x), src: 'touch' };
  if (Math.hypot(PAD.rx, PAD.ry) > 0.35) return { a: Math.atan2(PAD.ry, PAD.rx), src: 'pad' };
  if (!PAD.active && !IS_TOUCH && IN.mouse.active && G.t - IN.mouse.t < 3) { const wx = IN.mouse.x + G.cam.x, wy = IN.mouse.y + G.cam.y; return { a: Math.atan2(wy - (P.y - 14), wx - P.x), src: 'mouse', wx, wy }; }
  return null;
}
function assistTarget(P, a, range) {
  const cone = AIM_CONE[SET.aimAssist] || 0; if (!cone) return null;
  return nearestEnemy(P.x, P.y, range, cone, a);
}
const _computeAim0 = computeAim;
computeAim = function (P, mx, my, mv) {
  const f = freeAimSource(P);
  if (!f) return _computeAim0(P, mx, my, mv);
  const t = assistTarget(P, f.a, STYLES[P.style] && STYLES[P.style].ranged ? 240 : 120);
  return t ? Math.atan2(t.y - P.y, t.x - P.x) : f.a;
};
const _aimTarget0 = aimTarget;
aimTarget = function (P, mx, my, mv, rangeMax) {
  const f = freeAimSource(P);
  if (!f) return _aimTarget0(P, mx, my, mv, rangeMax);
  P.aim = f.a; P.dir = dirOf(Math.cos(P.aim), Math.sin(P.aim));
  const t = assistTarget(P, f.a, rangeMax); if (t) P.aim = Math.atan2(t.y - P.y, t.x - P.x);
  return t; // sans cible : le sort part dans la direction visée (comportement prévu par chaque sort)
};
// précision de l'arc : tir rapide légèrement imprécis en visée libre, tir chargé parfaitement droit
function aimSpread(P, heavy) {
  if (!freeAimSource(P)) return 0;
  const k = heavy ? Math.max(0, 1 - (P.chargeLvl || 0) * 1.25) : 1;
  return (Math.random() - 0.5) * 0.09 * k;
}

// ---------- réticule et trajectoire ----------
function drawAimReticle(ctx) {
  const P = G.player; if (!P || P.state === 'dead' || G.paused) return;
  const f = freeAimSource(P); if (!f) return;
  const bow = STYLES[P.style] && STYLES[P.style].ranged && hasStyle(P);
  const touchAim = f.src === 'touch' && TOUCH.aim.on;
  if (!bow && !touchAim && f.src !== 'pad') return; // pour les sorts : affiché pendant la visée (tactile / manette)
  const a = (P.state === 'charge' || P.state === 'attack') ? P.aim : (assistTarget(P, f.a, 240) ? Math.atan2(assistTarget(P, f.a, 240).y - P.y, assistTarget(P, f.a, 240).x - P.x) : f.a);
  const range = bow ? 220 : 200; const ox = P.x - G.cam.x, oy = P.y - 14 - G.cam.y;
  const ch = P.state === 'charge' ? (P.charge || 0) : 0;
  ctx.save();
  ctx.strokeStyle = ch >= 1 ? 'rgba(255,226,107,0.9)' : 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
  for (let d = 18; d < range; d += 9) { const x = ox + Math.cos(a) * d, y = oy + Math.sin(a) * d; ctx.globalAlpha = 0.95 * (1 - d / range * 0.8); ctx.fillStyle = ctx.strokeStyle; ctx.fillRect(Math.round(x), Math.round(y), 2, 2); }
  ctx.globalAlpha = 1;
  let rx = ox + Math.cos(a) * range * 0.62, ry = oy + Math.sin(a) * range * 0.62;
  if (f.src === 'mouse' && !assistTarget(P, f.a, 240)) { rx = IN.mouse.x; ry = IN.mouse.y; }
  const t = assistTarget(P, f.a, 240); if (t) { rx = t.x - G.cam.x; ry = t.y - 14 - G.cam.y; }
  const r = bow ? 9 - ch * 5 : 8; // le cercle se resserre avec la charge
  ctx.beginPath(); ctx.arc(Math.round(rx), Math.round(ry), r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = t ? '#ff6a5a' : '#ffffff'; ctx.fillRect(Math.round(rx) - 1, Math.round(ry) - 1, 2, 2);
  for (const q of [0, 1, 2, 3]) { const qa = q * Math.PI / 2; ctx.fillRect(Math.round(rx + Math.cos(qa) * (r + 3)) - 1, Math.round(ry + Math.sin(qa) * (r + 3)) - 1, 2, 2); }
  ctx.restore();
}
const _drawVignetteAim = drawVignette;
drawVignette = function (ctx) { _drawVignetteAim(ctx); if (G.mode === 'play') { try { drawAimReticle(ctx); } catch (e) { console.warn('aim', e); } } };
