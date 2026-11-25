'use strict';
// =====================================================================
//  COMMANDES « CONSOLE » (25/11) — demande de l'utilisateur : jouer comme sur PlayStation (façon Fortnite)
//   - L2 maintenu : viser. La caméra se rapproche par-dessus l'épaule, un réticule apparaît au centre, les sorts et les
//     tirs partent vers le réticule (léger aimant sur la cible la plus proche du centre).
//   - R3 : verrouiller l'ennemi visé (la caméra le garde en face) ; R3 à nouveau : déverrouiller ;
//     stick droit poussé d'un coup à gauche ou à droite pendant le verrouillage : cible suivante de ce côté.
//   - Course : L3 (s'arrête quand on lâche le stick), Maj au clavier, stick tactile poussé à fond.
//   - Le stick droit sert uniquement à la caméra (caméra « épaule »).
//  Les commandes déplacées par L2 / R3 / L3 sont réparties ainsi (manette PS5) :
//   R2 sort 1 · R1 sort 2 · ↑ sort 3 · → sort 4 · ← sort 5 · ↓ potion · L1 + ← aptitude raciale · L1 + → relique ·
//   L3 + R3 ensemble : éveil. ✕ ○ □ △ L1 inchangés (attaque, esquive, technique, ultime, parade).
//  Ancienne vue haute (Paramètres > Caméra 3D) : l'ancienne disposition revient automatiquement.
// =====================================================================
const CT = window.CT = { aim: false, lock: null, sprint: false, runT: 0 };
(function () {
  const TPSon = () => !(SET.c3d && SET.c3d.cam === 'haut');
  // ---------- disposition des touches ----------
  const OLD = Object.assign({}, PAD_MAP), OLDL = Object.assign({}, PAD_LABEL);
  const NEW = { 5: 'skill2', 6: 'aim', 7: 'skill1', 10: 'sprint', 11: 'lock', 12: 'skill3', 13: 'potion', 14: 'skill5', 15: 'skill4' };
  const NEWL = { skill1: 'RT', skill2: 'RB', skill3: '↑', skill4: '→', skill5: '←', potion: '↓', racial: 'LB+←', relic: 'LB+→', awaken: 'L3+R3', aim: 'LT', lock: 'R3', sprint: 'L3' };
  Object.assign(PS_LABEL, { 'LB+←': 'L1+←', 'LB+→': 'L1+→' });
  function layout() { const on = TPSon(); Object.assign(PAD_MAP, on ? NEW : OLD); Object.assign(PAD_LABEL, on ? Object.assign({}, OLDL, NEWL) : OLDL); }
  layout();
  // clavier : Maj = courir, T = verrouiller
  if (!DEFAULT_KEYS.sprint) { DEFAULT_KEYS.sprint = ['ShiftLeft', 'ShiftRight']; DEFAULT_KEYS.lock = ['KeyT']; }
  if (SET.keys && !SET.keys.sprint) { SET.keys.sprint = ['ShiftLeft', 'ShiftRight']; SET.keys.lock = ['KeyT']; }
  ACTION_LABEL.sprint = 'Courir'; ACTION_LABEL.lock = 'Verrouiller une cible';
  // ---------- lecture de la manette : combinaisons L1 + croix et L3 + R3 ----------
  { const pp = pollPad; pollPad = function () {
      layout();
      const gp = PAD.gp || (window.__pickPad && window.__pickPad()); const L1 = !!(gp && gp.buttons[4] && gp.buttons[4].pressed);
      if (TPSon()) { PAD_MAP[14] = L1 ? 'racial' : 'skill5'; PAD_MAP[15] = L1 ? 'relic' : 'skill4'; }
      pp.apply(this, arguments);
      if (TPSon() && gp) { const b10 = gp.buttons[10] && gp.buttons[10].pressed, b11 = gp.buttons[11] && gp.buttons[11].pressed; if (b10 && b11 && !CT.both) { CT.both = true; press('awaken'); setTimeout(() => release('awaken'), 60); if (CT.lock) CT.lock = null; } if (!b10 && !b11) CT.both = false; }
    }; }
  // ---------- direction de la caméra (angle au sol, repère du jeu) ----------
  const camAngle = () => { const yw = (typeof B2D !== 'undefined' && B2D.yaw) || 0; return Math.atan2(-Math.cos(yw), -Math.sin(yw)); };
  CT.camAngle = camAngle;
  function aimAngle(P) { const a = camAngle(); const t = nearestEnemy(P.x, P.y, 320, 0.2, a); CT.aimT = t; return t ? Math.atan2(t.y - P.y, t.x - P.x) : a; }
  // ---------- verrouillage ----------
  function pickLock(P, side) {
    const a0 = camAngle(); let best = null, bs = 1e9;
    for (const e of G.enemies) { if (e.dead || e.def.npc) continue; const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy); if (d > 340) continue; let da = Math.atan2(dy, dx) - a0; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (side) { if (e === CT.lock) continue; const rel = da - (CT.lock ? Math.atan2(Math.sin(Math.atan2(CT.lock.y - P.y, CT.lock.x - P.x) - a0), Math.cos(Math.atan2(CT.lock.y - P.y, CT.lock.x - P.x) - a0)) : 0); if (Math.sign(rel) !== side) continue; const sc = Math.abs(rel) * 200 + d * 0.3; if (sc < bs) { bs = sc; best = e; } continue; }
      const sc = Math.abs(da) * 160 + d * 0.5 - (e.def.boss ? 40 : 0) + (Math.abs(da) < 1.6 || d < 90 ? 0 : 5000); if (sc < bs) { bs = sc; best = e; } }
    return best;
  }
  function toggleLock(P) { if (CT.lock) { CT.lock = null; return; } const t = pickLock(P); if (t) { CT.lock = t; sfx('ui'); } else toast('Aucun ennemi à verrouiller', '#ffd27a'); }
  // ---------- visée : angle utilisé par les attaques et les sorts ----------
  { const ca = computeAim; computeAim = function (P, mx, my, mv) {
      if (!TPSon() || P !== G.player) return ca.apply(this, arguments);
      if (CT.lock && !CT.lock.dead) return Math.atan2(CT.lock.y - P.y, CT.lock.x - P.x);
      if (CT.aim) return aimAngle(P);
      if (PAD.active) { const rx = PAD.rx, ry = PAD.ry; PAD.rx = PAD.ry = 0; try { return ca.apply(this, arguments); } finally { PAD.rx = rx; PAD.ry = ry; } } // le stick droit ne vise plus : il tourne la caméra
      return ca.apply(this, arguments);
    }; }
  { const fa = freeAimSource; freeAimSource = function (P) {
      if (!TPSon()) return fa.apply(this, arguments);
      if (CT.aim) return { a: aimAngle(P), src: 'l2' };
      if (PAD.active) { const rx = PAD.rx, ry = PAD.ry; PAD.rx = PAD.ry = 0; try { return fa.apply(this, arguments); } finally { PAD.rx = rx; PAD.ry = ry; } }
      return fa.apply(this, arguments);
    }; }
  // réticule et zoom de visée en 3D (B2D.aimInfo est lu par la caméra et par le dessin du réticule)
  if (typeof B2D !== 'undefined') { const ai = B2D.aimInfo; B2D.aimInfo = function () {
      const P = G.player; if (TPSon() && CT.aim && P && !G.paused && G.mode === 'play' && P.state !== 'dead') { const a = aimAngle(P); return { a, bow: !!(STYLES[P.style] && STYLES[P.style].ranged), t: CT.aimT || null, f: { src: 'l2', a }, ch: P.state === 'charge' ? (P.charge || 0) : 0, range: 300, held: true }; }
      return ai.apply(this, arguments);
    }; }
  // ---------- course ----------
  { const up = updatePlayer; updatePlayer = function (P, dt) {
      if (P !== G.player || G.mode !== 'play') return up.apply(this, arguments);
      // états lus à chaque image
      CT.aim = TPSon() && !!IN.held.aim && !G.paused;
      if (IN.pressed.lock) toggleLock(P);
      if (CT.lock && (CT.lock.dead || Math.hypot(CT.lock.x - P.x, CT.lock.y - P.y) > 420)) { const was = CT.lock; CT.lock = null; if (was.dead) { const n = pickLock(P); if (n) CT.lock = n; } }
      if (CT.lock && PAD.active) { const fl = PAD.rx; if (Math.abs(fl) > 0.75 && !CT.flick) { CT.flick = true; const n = pickLock(P, Math.sign(fl)); if (n) { CT.lock = n; sfx('ui'); } } if (Math.abs(fl) < 0.3) CT.flick = false; }
      const [mx, my, mv] = moveAxis(); const full = TOUCH.stick.on && Math.hypot(TOUCH.stick.x, TOUCH.stick.y) > 0.93;
      if (IN.pressed.sprint) CT.sprint = !CT.sprint || mv > 0.2;
      if (IN.held.sprint && !PAD.active) CT.sprint = true; else if (!PAD.active && !full && !IN.held.sprint && !TOUCH.stick.on) CT.sprint = false;
      if (full) { CT.runT += dt; if (CT.runT > 0.35) CT.sprint = true; } else if (TOUCH.stick.on) { CT.runT = 0; CT.sprint = false; }
      if (mv < 0.2) { CT.idle = (CT.idle || 0) + dt; if (CT.idle > 0.3) CT.sprint = false; } else CT.idle = 0;
      const run = CT.sprint && !CT.aim && (P.state === 'move' || P.state === 'idle') && !P.mounted;
      CT.running = run;
      if (!run) return up.apply(this, arguments);
      const s0 = P.st8.spd; P.st8.spd = s0 * 1.6;
      try { return up.apply(this, arguments); } finally { P.st8.spd = s0; if (P.state === 'move' && Math.random() < 0.25) part(P.x + rnd(-5, 5), P.y, { col: 'rgba(170,140,100,0.55)', size: 2, life: 0.35, vy: -10 }); }
    }; }
  // ---------- repère de la cible verrouillée (dessiné avec les effets, repris en 3D) ----------
  { const dm = drawMfx; drawMfx = function (ctx, cx, cy, pass) { dm(ctx, cx, cy, pass); if (pass !== 'glow') return; const L = CT.lock; if (!L || L.dead) return; const x = L.x - cx, y = L.y - cy - (L.def.r || 14) * 1.6 - 18, t = G.t * 4;
      ctx.save(); ctx.strokeStyle = '#ff5a4a'; ctx.fillStyle = '#ff5a4a'; ctx.lineWidth = 2; ctx.globalAlpha = 0.95; const s = 7 + Math.sin(t) * 1.2; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.stroke(); ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); ctx.restore(); }; }
  // ---------- réticule fixe au centre pendant la visée L2 ----------
  const ret = document.createElement('div'); ret.id = 'ctReticle'; ret.innerHTML = '<i></i>'; document.body.appendChild(ret);
  const st = document.createElement('style'); st.textContent = `#ctReticle{position:fixed;left:50%;top:46%;width:30px;height:30px;margin:-15px 0 0 -15px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px #000a;pointer-events:none;z-index:15;display:none;opacity:.9}#ctReticle i{position:absolute;left:50%;top:50%;width:4px;height:4px;margin:-2px;background:#fff;border-radius:50%}#ctReticle.t{border-color:#ff6a5a}#ctReticle.t i{background:#ff6a5a}`;
  document.head.appendChild(st);
  setInterval(() => { const on = CT.aim && typeof G !== 'undefined' && G.mode === 'play' && !G.paused; ret.style.display = on ? 'block' : 'none'; ret.classList.toggle('t', !!CT.aimT); }, 50);
  // ---------- Paramètres > Caméra 3D : choix du mode ----------
  if (typeof optsHTML === 'function') { const sh = optsHTML; optsHTML = function () { const h = sh.apply(this, arguments); const on = TPSon();
      return h.replace('<h4>Caméra 3D</h4><div class="row">', `<h4>Caméra 3D</h4><div class="row"><button data-ctcam="1">Type de caméra : ${on ? 'épaule (comme Fortnite)' : 'vue haute'}</button><span class="hint">${on ? 'Manette : L2 viser · R3 verrouiller · L3 courir · R2/R1 sorts 1-2 · croix : sorts 3-5 et potion · L1 + ←/→ : aptitude raciale / relique · L3 + R3 : éveil.' : 'Vue haute : ancienne disposition de la manette (L2/R2/R1 sorts, R3 sort 5, stick droit pour viser).'}</span>`); }; }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-ctcam]'); if (!b) return; e.stopImmediatePropagation(); e.preventDefault();
    const nw = TPSon() ? 'haut' : 'tps'; if (typeof B2D !== 'undefined' && B2D.cam3d && B2D.cam3d.setMode) B2D.cam3d.setMode(nw); else { SET.c3d = SET.c3d || {}; SET.c3d.cam = nw; } CT.lock = null; layout(); saveSet(); if (G.mode === 'play') openMenu('opt'); }, true);
})();

// =====================================================================
//  DIAGNOSTIC MANETTE (25/11) — « la manette ne se détecte pas ».
//  Un bandeau sur l'écran titre dit en clair où ça bloque : navigateur sans manette (ex. navigateur intégré d'une appli),
//  manette pas encore réveillée (il faut appuyer sur ✕ une fois la page ouverte), ou manette détectée.
//  Toucher le bandeau affiche le détail technique (à m'envoyer en capture si besoin).
// =====================================================================
(function () {
  const D = window.PADDIAG = { ev: 0, last: '', seen: false };
  addEventListener('gamepadconnected', e => { D.ev++; D.seen = true; D.last = e.gamepad.id || '?'; });
  let box = null, detail = false;
  function state() {
    if (!window.isSecureContext) return ['err', '🎮 Manette impossible : la page n\'est pas en https.'];
    if (!navigator.getGamepads) return ['err', '🎮 Ce navigateur ne gère pas les manettes. Ouvre le lien directement dans Safari (pas depuis l\'aperçu d\'une appli).'];
    let n = 0, id = '';
    try { const g = navigator.getGamepads(); for (let i = 0; i < g.length; i++) if (g[i]) { n++; id = id || g[i].id; } } catch (e) { }
    if (n || PAD.gp) { D.seen = true; return ['ok', '🎮 Manette détectée : ' + ((id || PAD.id || 'manette').split('(')[0].trim() || 'manette') + ' ✓']; }
    if (D.seen) return ['wait', '🎮 Manette vue puis perdue : appuie sur ✕ pour la réveiller.'];
    return ['wait', '🎮 Manette non détectée : connecte-la en Bluetooth, puis appuie sur ✕ (le bouton PS seul ne suffit pas).'];
  }
  function info() {
    let n = 0, ids = [];
    try { const g = navigator.getGamepads ? navigator.getGamepads() : []; for (let i = 0; i < g.length; i++) if (g[i]) { n++; ids.push(g[i].id + ' [' + g[i].mapping + ']'); } } catch (e) { ids.push('erreur ' + e.message); }
    return '\nAPI : ' + (navigator.getGamepads ? 'oui' : 'non') + ' · https : ' + (window.isSecureContext ? 'oui' : 'non') + ' · événements : ' + D.ev + ' · manettes : ' + n + (ids.length ? '\n' + ids.join('\n') : '') + '\n' + navigator.userAgent;
  }
  function upd() {
    const onTitle = typeof G !== 'undefined' && G.mode === 'title';
    if (!onTitle) { if (box) box.style.display = 'none'; return; }
    if (!box) {
      box = document.createElement('div'); box.id = 'padstat';
      box.style.cssText = 'position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:9998;max-width:92vw;background:rgba(20,14,30,.9);border:1px solid #c9a45a;color:#f3e3bf;font:12px/1.35 Georgia,serif;padding:6px 12px;border-radius:6px;white-space:pre-wrap;text-align:center;cursor:pointer';
      box.onclick = () => { detail = !detail; upd(); };
      document.body.appendChild(box);
    }
    const [k, t] = state();
    box.style.display = 'block';
    box.style.borderColor = k === 'ok' ? '#7fd88a' : k === 'err' ? '#ff7a7a' : '#c9a45a';
    box.textContent = t + (detail ? info() : '');
  }
  setInterval(upd, 500);
})();
