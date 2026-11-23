'use strict';
// ===================== Phase B — montures (catégorie de compagnon) =====================
// Montures : terrestre (vitesse), aquatique (traverse l'eau des lacs et marais), volante (Îles flottantes d'Aether : à venir).
// Prix, conditions, vitesses : PROPOSITIONS. Sprites dessinés en code (pas de monture dans les ressources LPC).
const MOUNTS = {
  cheval: { n: 'Cheval de Brumeval', kind: 'terrestre', spd: 0.75, price: 400, d: 'Monture terrestre : +75 % de vitesse sur la terre ferme.', req: P => hasStyleAny(P) ? null : 'Apprends d\'abord un style de combat.' },
  raie: { n: 'Raie des brumes', kind: 'aquatique', spd: 0.4, price: 900, d: 'Monture aquatique : glisse sur l\'eau des lacs, rivières et marais (pas sur la lave ni l\'abîme).', req: () => (typeof SAGA !== 'undefined' && G.flags[SAGA.marais.flag]) ? null : 'Brise d\'abord le sceau des marais (Mère Odile, Vasebourg).' },
  griffon: { n: 'Griffon d\'Aether', kind: 'volante', spd: 0.9, price: 2500, d: 'Monture volante : survole le vide entre les Îles flottantes d\'Aether.', req: () => null }
};
function ownsMount(P, k) { return (P.mounts || []).includes(k); }
function mountToggle() {
  const P = G.player; if (!P || P.state === 'dead') return;
  if (P.mount) { dismount(P, true); return; }
  const list = (P.mounts || []); if (!list.length) { toast('Tu n\'as pas encore de monture (écurie de Brumeval).', '#ffb36b'); return; }
  const k = P.mountSel && list.includes(P.mountSel) ? P.mountSel : list[0];
  P.mount = k; sfx('ui'); ring(P.x, P.y, 26, '#ffe9a0', 0.4, 3); for (let i = 0; i < 10; i++) part(P.x + rnd(-12, 12), P.y - rnd(0, 6), { col: '#c9b48a', life: 0.5, size: 2, rise: 10 });
  toast(MOUNTS[k].n + (k === 'raie' ? ' : tu peux traverser l\'eau' : ''), '#ffe9a0');
}
function dismount(P, manual) {
  if (!P.mount) return;
  if ((P.mount === 'raie' || P.mount === 'griffon') && rectBlockedFoot(P)) { if (manual) toast('Impossible de descendre sur l\'eau', '#ffb36b'); return false; }
  P.mount = null; if (manual) sfx('ui'); return true;
}
function rectBlockedFoot(P) { const sv = G._pmove; G._pmove = false; const b = rectBlocked(P.x - 7, P.y - 8, 14, 8); G._pmove = sv; return b; }
// eau franchissable en raie : régions forêt, désert, cimes, marais (pas lave ni abîme)
const _isSolidTileM = isSolidTile;
isSolidTile = function (tx, ty) {
  if (G._pmove && G.player && G.player.mount && tx > 0 && ty > 0 && tx < MW - 1 && ty < MH - 1 && WORLD.solid[ty * MW + tx] === 1) {
    const rg = WORLD.region[ty * MW + tx], m = G.player.mount;
    if (m === 'raie' && (rg <= 3 || rg === 6 || rg === 9 || rg === 15)) return false; // eaux douces, mers côtières, archipel
    if (m === 'griffon' && rg === 16) return false; // le griffon survole le vide entre les îles d'Aether
  }
  return _isSolidTileM(tx, ty);
};
const _updatePlayerM = updatePlayer;
updatePlayer = function (P, dt) {
  if (P.mount && (IN.pressed.attack || IN.pressed.skill1 || IN.pressed.skill2 || IN.pressed.skill3 || IN.pressed.skill4 || IN.pressed.ult || IN.pressed.tech || IN.pressed.block)) {
    if (!dismount(P, false)) { clearPressed(); }
  }
  if (IN.pressed.mount) mountToggle();
  const x0 = P.x, y0 = P.y; G._pmove = true;
  try {
    _updatePlayerM(P, dt);
    if (P.mount && P.state !== 'dead') {
      const M = MOUNTS[P.mount], dx = P.x - x0, dy = P.y - y0;
      if (Math.abs(dx) + Math.abs(dy) > 0.01 && Math.abs(dx) + Math.abs(dy) < 20) { P.bw = P.bw || 14; P.bh = P.bh || 8; moveBody(P, dx * M.spd, dy * M.spd); }
      P.mountT = (P.mountT || 0) + Math.hypot(P.x - x0, P.y - y0);
      if (P.mount === 'raie' && Math.random() < 0.4) part(P.x + rnd(-12, 12), P.y + rnd(-2, 3), { col: 'rgba(220,245,255,0.8)', life: 0.5, size: 1, add: true });
      else if (Math.hypot(P.x - x0, P.y - y0) > 1 && Math.random() < 0.25) part(P.x + rnd(-8, 8), P.y, { col: 'rgba(170,150,120,0.6)', life: 0.4, size: 2, rise: 6 });
    }
  } finally { G._pmove = false; }
};
const _hurtPlayerM = hurtPlayer;
hurtPlayer = function (P, dmg, sx, sy, src, el) { const r = _hurtPlayerM(P, dmg, sx, sy, src, el); if (r && P.mount && P.mount !== 'raie' && P.mount !== 'griffon') { P.mount = null; toast('Tu es désarçonné !', '#ffb36b'); } return r; };

// ---------- dessin des montures (pixel art en code) ----------
function drawMount(ctx, P, x, y, layer) {
  const k = P.mount, dir = P.dir, t = (P.mountT || 0) / 7, f = Math.floor(t) % 4, bob = (f % 2) ? -1 : 0;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); const sc = k === 'raie' ? 1.3 : k === 'griffon' ? 1.5 : 1.6; ctx.scale(sc, sc); x = 0; y = 0;
  try { drawMountBody(ctx, k, dir, f, bob, layer, x, y); } finally { ctx.restore(); }
}
function drawMountBody(ctx, k, dir, f, bob, layer, x, y) {
  const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b + bob, w, h); };
  if (k === 'griffon') {
    const fl = Math.sin(G.t * 10) * 6, S = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
    if (layer === 'back') {
      ctx.fillStyle = '#c8b48a'; ctx.beginPath(); ctx.moveTo(x - 4, y - 16); ctx.lineTo(x - 26, y - 22 - fl); ctx.lineTo(x - 18, y - 8); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 4, y - 16); ctx.lineTo(x + 26, y - 22 - fl); ctx.lineTo(x + 18, y - 8); ctx.closePath(); ctx.fill();
      S('#8a6a3a', -11, -18, 22, 10); S('#a07c48', -9, -18, 18, 3); S('#5a4224', -9, -9, 3, 7); S('#5a4224', 6, -9, 3, 7);
    } else if (dir !== 0) { S('#f2efe6', -4, -26, 8, 8); S('#e8b030', -1, -20, 3, 3); S('#1a1208', -3, -24, 2, 2); S('#1a1208', 2, -24, 2, 2); }
    return;
  }
  if (k === 'raie') {
    if (layer !== 'back') return;
    const w = Math.sin(G.t * 6) * 2;
    ctx.fillStyle = 'rgba(200,240,255,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 22, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a5f7a'; ctx.beginPath(); ctx.moveTo(x - 22, y - 2 + w); ctx.lineTo(x, y - 9); ctx.lineTo(x + 22, y - 2 - w); ctx.lineTo(x, y + 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6fa0bf'; ctx.beginPath(); ctx.moveTo(x - 14, y - 2 + w * 0.6); ctx.lineTo(x, y - 7); ctx.lineTo(x + 14, y - 2 - w * 0.6); ctx.lineTo(x, y + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1e3448'; ctx.fillRect(x - 1, y + 4, 2, 8);
    return;
  }
  // cheval : vue de profil (gauche/droite) ou de face/dos
  const side = dir === 1 || dir === 3, fl = dir === 1 ? -1 : 1;
  const body = '#7a4e2a', dark = '#4e3018', mane = '#2a1a10', hoof = '#1a120c';
  if (side) {
    const S = (c, a, b, w, h) => R(c, fl > 0 ? a : -a - w, b, w, h);
    if (layer === 'back') {
      const legs = [[-11, f], [-7, (f + 2) % 4], [7, (f + 1) % 4], [11, (f + 3) % 4]];
      for (const [lx, ph] of legs) { const o = [0, 2, 0, -2][ph]; S(dark, lx + o * 0.5, -6, 3, 8); S(hoof, lx + o * 0.5, 1, 3, 2); }
      S(body, -15, -16, 30, 11); S(body, 12, -24, 6, 12); S(body, 15, -28, 9, 6); S(dark, 22, -26, 3, 3); S(mane, 11, -28, 4, 14); S(mane, -18, -15, 4, 9);
    } else {
      // flanc et selle devant les jambes du cavalier
      S(body, -15, -13, 30, 8); S('#8e5e34', -13, -13, 24, 2); S('#a0263a', -7, -14, 14, 6); S('#d9b46a', -7, -14, 14, 1); S('#5a3a1c', -1, -9, 2, 4);
    }
  } else {
    const back = dir === 0; // dos
    if (layer === 'back') {
      const o = [0, 1, 0, -1][f];
      R(dark, -7, -8 + o, 3, 9); R(dark, 4, -8 - o, 3, 9); R(hoof, -7, 0 + o, 3, 2); R(hoof, 4, 0 - o, 3, 2);
      R(body, -8, -18, 16, 12); R('#a0263a', -8, -18, 16, 4); R('#d9b46a', -8, -18, 16, 1);
      if (back) { R(mane, -2, -10, 4, 8); }
    } else if (!back) { R(body, -4, -30, 8, 14); R(mane, -2, -32, 4, 12); R(dark, -3, -18, 6, 4); R('#0e0a08', -3, -25, 2, 2); R('#0e0a08', 1, -25, 2, 2); }
  }
}
const _drawPlayerM = drawPlayer;
drawPlayer = function (ctx, P, cx, cy) {
  if (!P.mount || P.state === 'dead') return _drawPlayerM(ctx, P, cx, cy);
  drawShadow(ctx, P.x - cx, P.y - cy + (P.mount === 'griffon' ? 6 : 0), 18, P.mount === 'griffon' ? 0.18 : 0.3);
  drawMount(ctx, P, P.x - cx, P.y - cy, 'back');
  _drawPlayerM(ctx, P, cx, cy + (P.mount === 'raie' ? 8 : 16));
  drawMount(ctx, P, P.x - cx, P.y - cy, 'front');
};

// ---------- écurie (Brumeval) et dresseuse (Vasebourg) ----------
function addMountNpcs() {
  if (WORLD.npcs.some(n => n.role === 'stable')) return;
  WORLD.npcs.push({ look: 'npc_guard', x: 58 * TILE + 8, y: 68 * TILE, name: 'Bran, maître d\'écurie', role: 'stable', dir: 2 });
  WORLD.npcs.push({ look: 'npc_alchemist', x: 51 * TILE, y: 91 * TILE, name: 'Lysa, dresseuse de raies', role: 'stable', dir: 2 });
}
const _genWorldM = genWorld;
genWorld = function () { _genWorldM(); addMountNpcs(); };
const _interactM = interact;
interact = function (n) {
  if (!n || n.role !== 'stable') return _interactM(n);
  const P = G.player, keys = /Lysa/.test(n.name) ? ['raie'] : /Aerith|griffon/i.test(n.name) ? ['griffon'] : ['cheval'];
  const rows = keys.map(k => { const M = MOUNTS[k], own = ownsMount(P, k), why = M.req(P); return `<p><b>${M.n}</b> — ${M.d}<br>${own ? '<i>Déjà à toi.</i>' : why ? '<i>' + why + '</i>' : 'Prix : <b>' + M.price + ' or</b>'}</p>`; }).join('');
  const k = keys[0], M = MOUNTS[k], can = !ownsMount(P, k) && !M.req(P) && P.gold >= M.price;
  const opts = []; if (can) opts.push(['Acheter (' + M.price + ' or)', () => { P.gold -= M.price; P.mounts = (P.mounts || []).concat([k]); P.mountSel = k; sfx('gold'); toast('Nouvelle monture : ' + M.n + ' — touche ' + actLabel('mount') + ' ou bouton ♞', '#ffe9a0'); saveGame(); closePanel(); }]);
  opts.push(['Au revoir', closePanel]);
  try { codexAdd('p', n.name, n.name); } catch (e) {}
  dialog(n.name, rows + '<p><small>Monture : touche <b>' + actLabel('mount') + '</b> (bouton ♞ sur mobile). Attaquer ou lancer un sort fait descendre ; un coup te désarçonne (sauf sur l\'eau).</small></p>', opts);
};
// bouton tactile visible seulement avec une monture
setInterval(() => { try { const el = $('tb_mount'); if (el && G.player) el.classList.toggle('hide', !(G.player.mounts || []).length); } catch (e) {} }, 700);
// sauvegarde
const _saveGameM = saveGame;
saveGame = function () { _saveGameM(); try { const P = G.player; if (!P || G.mode !== 'play') return; const s = store(SAVE_KEY); if (s) { s.mounts = P.mounts || []; s.mountSel = P.mountSel || null; store(SAVE_KEY, s); } } catch (e) {} };
const _startGameM = startGame;
startGame = function (look, sv) { _startGameM(look, sv); try { if (sv) { G.player.mounts = (sv.mounts || []).filter(k => MOUNTS[k]); G.player.mountSel = sv.mountSel || null; } } catch (e) {} };
