'use strict';
// ===================== HUD (dessiné sur la toile) =====================
let MINIMAP = null;
function buildMinimap() {
  const c = document.createElement('canvas'); c.width = MW; c.height = MH; const x = c.getContext('2d');
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const v = vget(tx, ty) + vget(tx + 1, ty + 1);
    const rg = WORLD.region[ty * MW + tx], PL = [['#2c6f91', '#3f7a34', '#6f8a3f', '#9a7a4e'], ['#4a98a8', '#d8b66a', '#c89a4a', '#a8794a'], ['#8cb8d8', '#e8f0f8', '#c8d8e4', '#9aa8b4'], ['#1c4a3c', '#3a5a34', '#4a5a30', '#6a5a3a'], ['#d8481a', '#4a3c38', '#5e4a44', '#7a4a2a'], ['#3a2a68', '#3a3452', '#4a4464', '#5e4a80']][rg] || [];
    x.fillStyle = WORLD.solid[ty * MW + tx] ? PL[0] : v >= 2 ? PL[1] : v === 1 ? PL[2] : PL[3]; x.fillRect(tx, ty, 1, 1);
  }
  for (const p of WORLD.props) { if (!p.def.fade) continue; x.fillStyle = p.type.startsWith('house') ? '#b5523a' : '#244d22'; x.fillRect(Math.floor(p.x / TILE) - 1, Math.floor(p.y / TILE) - 1, p.type.startsWith('house') ? 4 : 2, 2); }
  MINIMAP = c;
}
function bar(ctx, x, y, w, h, k, col, bg) {
  ctx.fillStyle = '#120c18'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = bg || '#3a2a33'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, Math.round(w * clamp(k, 0, 1)), h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, Math.round(w * clamp(k, 0, 1)), 1);
}
function txt(ctx, s, x, y, col, size, align, bold) {
  ctx.font = `${bold === false ? '' : 'bold '}${size || 9}px 'Trebuchet MS',sans-serif`; ctx.textAlign = align || 'left';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(14,8,20,0.9)'; ctx.strokeText(s, x, y); ctx.fillStyle = col || '#fff'; ctx.fillText(s, x, y);
}
function drawHUD(ctx) {
  const P = G.player, S = P.st8;
  // portrait
  ctx.fillStyle = 'rgba(14,10,22,0.75)'; ctx.fillRect(4, 4, 30, 30); ctx.strokeStyle = '#c9a45a'; ctx.lineWidth = 1; ctx.strokeRect(4.5, 4.5, 29, 29);
  const A = P.spr && P.spr.anims.walk;
  if (A) ctx.drawImage(A.cv, 2 * A.fs + (A.fs - 64) / 2 + 17, 2 * A.fs + (A.fs - 64) / 2 + 8, 30, 30, 4, 4, 30, 30);
  txt(ctx, String(P.lvl), 31, 33, '#ffe27a', 9, 'right');
  bar(ctx, 38, 6, 96, 7, P.hp / S.maxhp, '#e8434a');
  txt(ctx, Math.ceil(P.hp) + '/' + S.maxhp, 86, 13, '#fff', 7, 'center');
  bar(ctx, 38, 16, 80, 5, P.mp / S.maxmp, '#4a8cff');
  bar(ctx, 38, 24, 64, 3, P.sta / S.maxsta, '#f5c542');
  bar(ctx, 38, 30, 64, 2, P.xp / xpNeed(P.lvl), '#b57bff', '#2a2035');
  if (transformReady(P)) { bar(ctx, 106, 30, 30, 2, P.trans ? P.trans.t / CONFIG.transformDuration : P.awk / 100, P.trans ? '#ff5d8f' : '#ffcf5a', '#2a2035'); }
  let sx2 = 140; const ico = (c, label) => { ctx.fillStyle = c; ctx.fillRect(sx2, 4, 9, 9); txt(ctx, label, sx2 + 4.5, 11.5, '#000', 7, 'center', true); sx2 += 11; };
  if (P.status.poison > 0) ico('#7ee06b', 'P'); if (P.buffs.force > G.t) ico('#ff7a6a', 'F'); if (P.buffs.garde > G.t) ico('#c0c8d0', 'G'); if (P.buffs.haste > G.t) ico('#f5d0fe', 'V'); if (P.buffs.phenix > G.t) ico('#ff9a4a', 'Φ'); if (P.trans) ico('#ff5d8f', '☀');
  // or
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(108, 23, 5, 5); txt(ctx, String(P.gold), 116, 29, '#ffe9a0', 8);
  if (P.shield > 0) txt(ctx, 'Bouclier ' + Math.ceil(P.shield) + 's', 140, 24, '#bff', 8);
  // minicarte
  if (MINIMAP) {
    const mw = 96, mh = 48, mx = W - mw - 5, my = 5;
    ctx.fillStyle = 'rgba(10,8,16,0.8)'; ctx.fillRect(mx - 2, my - 2, mw + 4, mh + 4); ctx.strokeStyle = '#c9a45a'; ctx.strokeRect(mx - 1.5, my - 1.5, mw + 3, mh + 3);
    ctx.globalAlpha = 0.9; ctx.drawImage(MINIMAP, mx, my, mw, mh); ctx.globalAlpha = 1;
    const sx = mw / (MW * TILE), sy = mh / (MH * TILE);
    for (const e of G.enemies) if (!e.dead && dist(e.x, e.y, P.x, P.y) < 500) { ctx.fillStyle = e.def.boss ? '#ff3a3a' : '#ff8a8a'; ctx.fillRect(mx + e.x * sx - (e.def.boss ? 1.5 : 0.5), my + e.y * sy - (e.def.boss ? 1.5 : 0.5), e.def.boss ? 3 : 1.5, e.def.boss ? 3 : 1.5); }
    for (const n of G.npcs) { ctx.fillStyle = '#ffe27a'; ctx.fillRect(mx + n.x * sx - 1, my + n.y * sy - 1, 2, 2); }
    for (const c of WORLD.chests) if (!c.opened) { ctx.fillStyle = '#d9a441'; ctx.fillRect(mx + c.x * sx - 1, my + c.y * sy - 1, 2, 2); }
    ctx.fillStyle = '#fff'; ctx.fillRect(mx + P.x * sx - 1.5, my + P.y * sy - 1.5, 3, 3);
    const q = questText(); if (q) { if (IS_TOUCH) txt(ctx, q, 6, 38 + 40 / SCALE + 10, '#ffe9a0', 8, 'left'); else txt(ctx, q, W - 5, my + mh + 12, '#ffe9a0', 8, 'right'); }
  }
  // boss
  if (G.boss && !G.boss.dead) {
    const b = G.boss; const bw = Math.min(200, W - 230), bx = (W - bw) / 2, by = 16;
    txt(ctx, b.def.name, W / 2, by - 3, '#ffb08a', 9, 'center');
    bar(ctx, bx, by, bw, 6, b.hp / b.maxhp, b.phase === 3 ? '#ff2a2a' : '#d8432a');
  }
  // bandeau de zone
  if (G.zoneBanner && G.zoneBanner.t < 3) {
    const t = G.zoneBanner.t; const a = t < 0.4 ? t / 0.4 : t > 2.4 ? (3 - t) / 0.6 : 1;
    ctx.globalAlpha = a; txt(ctx, G.zoneBanner.name, W / 2, 50, '#ffe9c0', 14, 'center'); ctx.fillStyle = '#c9a45a'; ctx.fillRect(W / 2 - 60, 55, 120, 1); ctx.globalAlpha = 1;
  }
  // messages
  let ty = 66;
  G.toasts.forEach(t => {
    const a = t.t > 2.6 ? (3.2 - t.t) / 0.6 : 1; ctx.font = "bold 9px 'Trebuchet MS',sans-serif";
    const maxW = Math.min(W * 0.62, 340); const words = t.msg.split(' '); const lines = []; let cur = '';
    for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (ctx.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst; } if (cur) lines.push(cur);
    const bw = Math.min(maxW, Math.max(...lines.map(l => ctx.measureText(l).width))) + 14, bh = lines.length * 11 + 5;
    ctx.globalAlpha = a * 0.78; ctx.fillStyle = 'rgba(14,9,22,1)'; ctx.fillRect(Math.round(W / 2 - bw / 2), ty - 9, Math.round(bw), bh); ctx.globalAlpha = a * 0.9; ctx.fillStyle = t.col; ctx.fillRect(Math.round(W / 2 - bw / 2), ty - 9, 2, bh);
    ctx.globalAlpha = a; lines.forEach((l, k) => txt(ctx, l, W / 2, ty + k * 11, t.col, 9, 'center')); ctx.globalAlpha = 1; ty += bh + 3;
  });
  // invite d'interaction
  if (G.near && G.mode === 'play') {
    const n = G.near; const label = n.def && n.def.interact ? ({ chest: 'Ouvrir', cache: 'Ouvrir', gather: 'Récolter', spin_weapon: 'Invoquer', spin_exc: 'Invoquer', stash: 'Ouvrir', tomb: 'Examiner' })[n.def.interact] : 'Parler';
    const x = n.x - G.cam.x, y = n.y - G.cam.y - (n.def ? Math.min(70, (n.def.r ? n.def.r[3] : 30) + 8) : 64);
    txt(ctx, (IS_TOUCH && !PAD.active ? '' : '[' + actLabel('interact') + '] ') + label + (n.name ? ' · ' + n.name : n.def && n.def.label ? ' · ' + n.def.label : ''), x, y, '#ffe9a0', 8, 'center');
  }
  if (!IS_TOUCH || PAD.active) drawSkillBar(ctx);
}
function drawSkillBar(ctx) {
  const P = G.player; const tf = transformReady(P), rl = equippedRelic(P);
  const ids = (hasStyle(P) ? ['tech'] : []).concat(['s1', 's2', 's3', 's4', 'ult', 'potion', 'racial']).concat(tf ? ['awaken'] : []).concat(rl ? ['relic'] : []);
  const sz = 22, gap = 4, total = ids.length * (sz + gap) - gap; let x = (W - total) / 2; const y = H - sz - 6;
  for (const id of ids) {
    ctx.fillStyle = 'rgba(12,8,20,0.82)'; ctx.fillRect(x - 1, y - 1, sz + 2, sz + 2); ctx.strokeStyle = id === 'ult' || id === 'awaken' ? '#ffcf5a' : id === 'tech' ? '#f0d08a' : '#8a7550'; ctx.lineWidth = 1; ctx.strokeRect(x - 0.5, y - 0.5, sz + 1, sz + 1);
    let cd = 0, act;
    if (id === 'potion') { drawIcon(ctx, 'PotionShortRed', x + 1, y + 1, 0.625); txt(ctx, String(countItem(P, 'potion')), x + sz - 1, y + sz - 1, '#fff', 7, 'right'); cd = P.cd.potion; act = 'potion'; }
    else if (id === 'tech') { drawIcon(ctx, STYLES[P.style].icon, x + 1, y + 1, 0.625); cd = P.cd.tech / TECHS[currentTech(P)].cd; act = 'tech'; }
    else if (id === 'awaken') { drawIcon(ctx, 'LightStar', x + 1, y + 1, 0.625); cd = P.trans ? 0 : 1 - P.awk / 100; act = 'awaken'; }
    else if (id === 'relic') { drawIcon(ctx, rl.icon, x + 1, y + 1, 0.625); cd = (P.relicCd[rl.id] || 0) > G.t ? (P.relicCd[rl.id] - G.t) / rl.active.cd : 0; act = 'relic'; }
    else if (id === 'racial') { const RA = RACES[P.look.race].active; ctx.fillStyle = '#2a1f38'; ctx.fillRect(x + 1, y + 1, sz - 2, sz - 2); txt(ctx, '❖', x + sz / 2, y + 15, '#e8c8ff', 10, 'center'); cd = P.raceCd > G.t ? (P.raceCd - G.t) / RA.cd : 0; act = 'racial'; }
    else if (!P.magic) { ctx.drawImage(lockIcon(), x + 1, y + 1, sz - 2, sz - 2); act = id === 'ult' ? 'ult' : 'skill' + id[1]; }
    else { const sk = id === 's4' ? skillDef(P.slot4) : skillDef(id); if (sk.canvasIcon) ctx.drawImage(sk.canvasIcon, x + 1, y + 1, sz - 2, sz - 2); else { const im = img('ui/' + sk.icon + '.png'); if (im) ctx.drawImage(im, x + 1, y + 1, sz - 2, sz - 2); } cd = id === 'ult' ? (P.ult < 100 ? 1 - P.ult / 100 : 0) : P.cd[id] / sk.cd; act = id === 'ult' ? 'ult' : 'skill' + id[1]; if (id !== 'ult' && P.mp < sk.mp) { ctx.fillStyle = 'rgba(40,60,160,0.45)'; ctx.fillRect(x, y, sz, sz); } }
    if (cd > 0) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y + sz * (1 - cd), sz, sz * cd); }
    if (P.magic && ((id === 'ult' && P.ult >= 100) || (id === 'awaken' && (P.awk >= 100 || P.trans)))) { ctx.strokeStyle = `rgba(255,220,90,${0.5 + Math.sin(G.t * 8) * 0.5})`; ctx.lineWidth = 2; ctx.strokeRect(x - 1, y - 1, sz + 2, sz + 2); }
    txt(ctx, actLabel(act), x + 2, y + 8, PAD.active ? '#9fe3ff' : '#ffe9a0', 7);
    x += sz + gap;
  }
}
// ===================== contrôles tactiles =====================
function setupTouch() {
  touchCache = { icons: touchCache.icons };
  const box = $('touch'); box.innerHTML = '';
  const pad = document.createElement('div'); pad.id = 'stickzone'; box.appendChild(pad);
  const base = document.createElement('div'); base.id = 'stickbase'; const knob = document.createElement('div'); knob.id = 'stickknob'; base.appendChild(knob); box.appendChild(base);
  const P0 = G.player; const ico = s => { const sk = P0 && skillDef(s); if (!P0 || !P0.magic) return lockIcon().url; return sk && sk.canvasIcon ? sk.canvasIcon.url : 'assets/ui/' + (sk ? sk.icon : 'spell_shield') + '.png'; };
  const icons = { skill1: ico('s1'), skill2: ico('s2'), skill3: ico('s3'), skill4: ico(P0 ? P0.slot4 : 's4'), ult: P0 && P0.magic ? 'assets/ui/spell_watertacle.png' : lockIcon().url };
  const labels = { attack: '⚔', dodge: '»', block: '🛡', potion: '', interact: '✋', ult: '', tech: '✦', awaken: '☀', relic: '◉', racial: '❖' };
  for (const b of TOUCH_BTNS) {
    const el = document.createElement('div'); el.className = 'tbtn tb-' + b.id; el.id = 'tb_' + b.id; el.dataset.act = b.act;
    const pos = (SET.touch && SET.touch[b.id]) || b; const sc = SET.btnScale || 1;
    el.style.right = pos.r + 'px'; el.style.bottom = pos.b + 'px'; el.style.width = el.style.height = Math.round(b.s * sc) + 'px';
    if (icons[b.act]) el.style.backgroundImage = `url(${icons[b.act]})`;
    if (b.act === 'potion') el.innerHTML = `<i style="${iconCSS('PotionShortRed')}"></i><b class="cnt"></b>`;
    else el.innerHTML = `<span>${labels[b.act] || ''}</span><em class="cd"></em>`;
    box.appendChild(el);
  }
  const btnFor = el => el && el.closest && el.closest('.tbtn');
  const active = new Map();
  const onStart = e => {
    if (G.mode !== 'play' && !TOUCH.edit) return;
    for (const t of e.changedTouches) {
      const el = btnFor(document.elementFromPoint(t.clientX, t.clientY));
      if (TOUCH.edit) { if (el) { active.set(t.identifier, { el, edit: true, sx: t.clientX, sy: t.clientY, r: parseFloat(el.style.right), b: parseFloat(el.style.bottom) }); } continue; }
      if (el) { active.set(t.identifier, { el }); press(el.dataset.act); el.classList.add('down'); audioInit(); }
      else if (t.clientX < window.innerWidth * 0.5 && !TOUCH.stick.on) {
        TOUCH.stick = { on: true, id: t.identifier, ox: t.clientX, oy: t.clientY, x: 0, y: 0 };
        base.style.display = 'block'; base.style.left = (t.clientX - 60) + 'px'; base.style.top = (t.clientY - 60) + 'px'; knob.style.transform = 'translate(0px,0px)'; audioInit();
      }
    }
    e.preventDefault();
  };
  const onMove = e => {
    for (const t of e.changedTouches) {
      const a = active.get(t.identifier);
      if (a && a.edit) { a.el.style.right = (a.r - (t.clientX - a.sx)) + 'px'; a.el.style.bottom = (a.b - (t.clientY - a.sy)) + 'px'; continue; }
      if (TOUCH.stick.on && t.identifier === TOUCH.stick.id) {
        let dx = t.clientX - TOUCH.stick.ox, dy = t.clientY - TOUCH.stick.oy; const m = Math.hypot(dx, dy), R = 52;
        if (m > R) { dx = dx / m * R; dy = dy / m * R; }
        TOUCH.stick.x = dx / R; TOUCH.stick.y = dy / R; if (m < 6) { TOUCH.stick.x = 0; TOUCH.stick.y = 0; }
        knob.style.transform = `translate(${dx}px,${dy}px)`;
      }
    }
    e.preventDefault();
  };
  const onEnd = e => {
    for (const t of e.changedTouches) {
      const a = active.get(t.identifier);
      if (a) { if (!a.edit) { release(a.el.dataset.act); a.el.classList.remove('down'); } active.delete(t.identifier); }
      if (TOUCH.stick.on && t.identifier === TOUCH.stick.id) { TOUCH.stick = { on: false, x: 0, y: 0 }; base.style.display = 'none'; }
    }
    e.preventDefault();
  };
  box.addEventListener('touchstart', onStart, { passive: false });
  box.addEventListener('touchmove', onMove, { passive: false });
  box.addEventListener('touchend', onEnd, { passive: false });
  box.addEventListener('touchcancel', onEnd, { passive: false });
}
let touchCache = {};
function updateTouchUI() {
  if (!IS_TOUCH || G.mode !== 'play') return;
  const P = G.player;
  const set = (id, k, v) => { const key = id + k; if (touchCache[key] === v) return; touchCache[key] = v; const el = $('tb_' + id); if (!el) return; if (k === 'cd') el.querySelector('.cd') && el.querySelector('.cd').style.setProperty('--k', v); else if (k === 'cls') el.className = 'tbtn tb-' + id + ' ' + v + (el.classList.contains('down') ? ' down' : ''); else if (k === 'cnt') { const c = el.querySelector('.cnt'); if (c) c.textContent = v; } };
  const iconKey = (P.magic || '-') + (P.slot4 || '') + JSON.stringify(P.eqM || {});
  if (touchCache.icons !== iconKey) { touchCache.icons = iconKey; setupTouch(); return; }
  for (const s of ['s1', 's2', 's3', 's4']) {
    const id = 'skill' + s[1]; const sk = skillDef(s === 's4' ? P.slot4 : s) || SKILLS[s]; set(id, 'cd', P.magic ? (P.cd[s] / sk.cd).toFixed(2) : '0'); set(id, 'cls', !P.magic ? 'locked' : P.mp < sk.mp ? 'nomana' : '');
  }
  set('attack', 'cls', hasStyle(P) ? '' : 'locked'); set('tech', 'cls', hasStyle(P) ? '' : 'hide');
  const RA = RACES[P.look.race].active; set('racial', 'cd', (P.raceCd > G.t ? (P.raceCd - G.t) / RA.cd : 0).toFixed(2));
  set('ult', 'cd', (P.ult >= 100 ? 0 : 1 - P.ult / 100).toFixed(2)); set('ult', 'cls', !P.magic ? 'locked' : P.ult >= 100 ? 'ready' : '');
  set('potion', 'cnt', String(countItem(P, 'potion')));
  set('interact', 'cls', G.near ? 'show' : 'hide');
  if (hasStyle(P)) set('tech', 'cd', (P.cd.tech / TECHS[currentTech(P)].cd).toFixed(2));
  const tf = transformReady(P); set('awaken', 'cls', !tf ? 'hide' : P.trans ? 'ready' : P.awk >= 100 ? 'ready' : ''); set('awaken', 'cd', (tf && !P.trans ? 1 - P.awk / 100 : 0).toFixed(2));
  const rl = equippedRelic(P); set('relic', 'cls', rl ? '' : 'hide'); set('relic', 'cd', (rl && (P.relicCd[rl.id] || 0) > G.t ? (P.relicCd[rl.id] - G.t) / rl.active.cd : 0).toFixed(2));
}
function saveTouchLayout() {
  SET.touch = {};
  for (const b of TOUCH_BTNS) { const el = $('tb_' + b.id); SET.touch[b.id] = { r: parseFloat(el.style.right), b: parseFloat(el.style.bottom) }; }
  saveSet();
}

// ===================== fenêtres =====================
