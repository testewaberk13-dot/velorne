'use strict';
// =====================================================================
//  INTRODUCTION ET PROGRESSION NARRATIVE
//  Ancien Théobald → Maître Mage Orvael (rituel du Magic Spin)
//  → Kaelen, maîtresse d'armes (premier style) → quête principale.
//  Les six autres styles s'apprennent auprès de leurs maîtres.
// =====================================================================
const MASTERS = {
  epee: { name: 'Kaelen, maîtresse d\'armes', look: 'npc_m_epee', tx: 33, ty: 54, lvl: 1, place: 'au terrain d\'entraînement, à l\'ouest du village',
    hello: 'L\'épée est le premier langage du combattant : garde, frappe, déplacement. Tout le reste en découle.' },
  katana: { name: 'Maître Ren', look: 'npc_m_katana', tx: 63, ty: 39, lvl: 3, place: 'à l\'orée du camp gobelin, à l\'est de la forêt',
    hello: 'Le sabre ne pardonne aucune hésitation. Un seul geste, parfait, vaut mieux que dix coups maladroits.' },
  arc: { name: 'Sylwen la chasseuse', look: 'npc_m_arc', tx: 29, ty: 40, lvl: 2, place: 'près de l\'étang, à l\'ouest de la forêt',
    hello: 'Respire, vise, relâche. La flèche part avant que l\'ennemi ne sache qu\'il est vu.' },
  faux: { name: 'Morvane le faucheur', look: 'npc_m_faux', tx: 29, ty: 24, lvl: 4, place: 'à l\'entrée du cimetière oublié, au nord-ouest',
    hello: 'La faux moissonne large. Celui qui la maîtrise ne se bat jamais contre un seul ennemi.' },
  bouclier: { name: 'Gardien Bram', look: 'npc_m_bouclier', tx: 51, ty: 47, lvl: 2, place: 'à la porte nord du village',
    hello: 'Un bouclier n\'est pas une protection : c\'est une arme qui refuse de céder.' },
  dagues: { name: 'Vesh l\'Ombre', look: 'npc_m_dagues', tx: 68, ty: 53, lvl: 3, place: 'dans les ruelles à l\'est du village',
    hello: 'Vite, bas, invisible. Les dagues frappent là où l\'ennemi ne regarde pas.' },
  lance: { name: 'Tarik des marais', look: 'npc_m_lance', tx: 57, ty: 69, lvl: 3, place: 'au sud-est du village',
    hello: 'La lance garde la distance. Celui qui l\'approche s\'empale sur sa propre impatience.' },
};
const ARCHMAGE = { name: 'Orvael, Maître Mage', look: 'npc_archmage', tx: 66, ty: 58 };
const RITUAL_SITE = { tx: 66, ty: 61 };
const VILLAGE_BOUNDS = { x0: 27, y0: 46.5, x1: 71, y1: 72 };

function storyPlaceWorld(add, reserve) {
  // Cercle des Arcanes (lieu du rituel) : cercle runique + pierres dressées
  add('arcane_circle', RITUAL_SITE.tx * TILE + 16, RITUAL_SITE.ty * TILE + 16);
  [[-3, -1], [3, -1], [-3, 2], [3, 2]].forEach(([dx, dy]) => add('rockgrey', (RITUAL_SITE.tx + dx) * TILE + 16, (RITUAL_SITE.ty + dy) * TILE + 24));
  // terrain d'entraînement de Kaelen
  [[30, 52], [36, 52]].forEach(([x, y]) => add('lamp', x * TILE + 16, y * TILE + 20));
  add('crate', 29 * TILE + 8, 55 * TILE + 26); add('barrel', 37 * TILE, 55 * TILE + 20);
  WORLD.npcs.push({ look: ARCHMAGE.look, x: ARCHMAGE.tx * TILE + 16, y: ARCHMAGE.ty * TILE + 16, name: ARCHMAGE.name, role: 'archmage', dir: 2 });
  for (const st in MASTERS) { const M = MASTERS[st]; WORLD.npcs.push({ look: M.look, x: M.tx * TILE + 16, y: M.ty * TILE + 16, name: M.name, role: 'master', style: st, dir: 2 }); }
}
function inVillage(x, y) { const tx = x / TILE, ty = y / TILE; return tx > VILLAGE_BOUNDS.x0 && tx < VILLAGE_BOUNDS.x1 && ty > VILLAGE_BOUNDS.y0 && ty < VILLAGE_BOUNDS.y1; }
// empêche de quitter le village sans formation (garde + dialogue)
function storyGate(P, px, py) {
  if (hasStyle(P) || G.flags.introSkip) return;
  if (!inVillage(P.x, P.y) && inVillage(px, py)) {
    P.x = px; P.y = py;
    if (!G.gateWarnT || G.t - G.gateWarnT > 3) { G.gateWarnT = G.t; toast('Garde Aldric : « Sans formation au combat, la forêt te dévorerait. ' + (P.magic ? 'Va voir Kaelen au terrain d\'entraînement.' : 'Va d\'abord voir le Maître Mage Orvael.') + ' »', '#ffd27a'); }
  }
}
function introStage() { return G.quests.intro || 0; }
function introText() {
  const P = G.player, Q = G.quests, s = introStage();
  if (!P.magic) return s === 0 ? '→ Parle à l\'Ancien Théobald (centre du village)' : '→ Rejoins le Maître Mage Orvael au Cercle des Arcanes (est)';
  if (!hasStyle(P)) { if (P.trial) return P.trial.left > 0 ? '→ Initiation : détruis les mannequins (' + (3 - P.trial.left) + '/3)' : '→ Retourne voir ' + MASTERS[P.trial.style].name.split(',')[0]; return '→ Rejoins Kaelen au terrain d\'entraînement (ouest)'; }
  if (P.trial) return P.trial.left > 0 ? '→ Initiation : détruis les mannequins (' + (3 - P.trial.left) + '/3)' : '→ Retourne voir ' + MASTERS[P.trial.style].name.split(',')[0];
  if (Q.main === 0) return '→ Retourne voir l\'Ancien Théobald';
  return null;
}
// ---------------- dialogues ----------------
function talkElder(n) {
  const P = G.player, Q = G.quests;
  if (!P.magic) {
    dialog(n.name, `Bienvenue à Brumeval, ${esc(P.name)}. Tu arrives en des temps troublés : les orcs de Grakhul rôdent dans la forêt.<br><br>Mais avant de te battre, il faut savoir qui tu es. Chaque âme porte une <b>magie innée</b> endormie. Seul le <b>Maître Mage Orvael</b> peut la révéler. Son <b>Cercle des Arcanes</b> se trouve à l'est du village.`,
      [['J\'y vais', () => { Q.intro = Math.max(1, Q.intro || 0); toast('Nouvel objectif : rencontrer le Maître Mage Orvael', '#c4b5fd'); closePanel(); }]]);
    return true;
  }
  if (!hasStyle(P)) { dialog(n.name, `Ta magie s'est éveillée : <b style="color:${MAGIC_DATA[P.magic].col}">${MAGIC_DATA[P.magic].n}</b>. Les anciens en parleront longtemps.<br><br>Mais la magie seule ne suffit pas. <b>Kaelen</b>, notre maîtresse d'armes, t'attend au terrain d'entraînement à l'ouest.`, [['Compris', closePanel]]); return true; }
  return false;
}
function talkArchmage(n) {
  const P = G.player, Q = G.quests;
  if (P.magic) {
    const F = MAGIC_DATA[P.magic], T = MAGIC_TIERS[F.tier];
    dialog(n.name, `Ta magie innée : <b style="color:${F.col}">${F.n}</b> (<span style="color:${T.c}">${T.n}</span>).${P.magic2 ? ` Et, fait rarissime, une seconde affinité : <b style="color:${MAGIC_DATA[P.magic2].col}">${MAGIC_DATA[P.magic2].n}</b>.` : ''}<br><br>${F.desc} Ta magie grandira avec toi ; un jour, d'autres affinités pourront s'y ajouter, mais celle-ci restera ton essence.`,
      [['Restaure mes forces', () => { P.hp = P.st8.maxhp; P.mp = P.st8.maxmp; sfx('level'); ring(P.x, P.y, 40, F.col, 0.5); closePanel(); }], ['Au revoir', closePanel]]);
    return;
  }
  const pages = [
    `Approche, ${esc(P.name)}. Je suis <b>Orvael</b>, Maître Mage de Brumeval.<br><br>Chaque être naît avec une affinité magique. Elle dort au fond de l'âme tant qu'aucun rituel ne l'éveille. Beaucoup vivent toute leur vie sans jamais la connaître.`,
    `Le rituel s'appelle le <b>Magic Spin</b>. Je trace le cercle des sceaux, j'appelle les courants du monde… et ton âme répond. <b>Personne ne choisit</b> : ni toi, ni moi. Certaines affinités sont répandues, d'autres n'apparaissent qu'une fois par génération.`,
    `Sache une chose : la magie qui s'éveillera sera ta <b>magie innée</b>. Elle ne pourra jamais être remplacée. Tu pourras en apprendre d'autres plus tard, mais elle restera ton essence.<br><br>Es-tu prêt à découvrir ce que tu es ?`,
  ];
  const show = i => dialog(n.name, pages[i], i < pages.length - 1 ? [['Continuer', () => show(i + 1)], ['Plus tard', closePanel]] : [['Commencer le rituel', () => startRitual(n)], ['Pas encore', closePanel]]);
  show(0);
}
function talkMaster(n) {
  const P = G.player, st = n.style, M = MASTERS[st], S = STYLES[st];
  P.dir = dirOf(n.x - P.x, n.y - P.y); n.dir = dirOf(P.x - n.x, P.y - n.y);
  if (P.stylesKnown[st]) {
    dialog(M.name, `${M.hello}<br><br>Tu maîtrises le style <b>${S.n}</b> (maîtrise ${styleLevel(P, st)}/10). Continue de t'entraîner : chaque coup porté avec ce style le renforce.${P.style !== st ? '' : ' C\'est ton style actuel.'}`,
      [P.style !== st ? ['Adopter ce style', () => { changeStyle(P, st); closePanel(); }] : null, ['Au revoir', closePanel]].filter(Boolean));
    return;
  }
  if (P.trial && P.trial.style === st) {
    if (P.trial.left > 0) dialog(M.name, `Les mannequins t'attendent : encore <b>${P.trial.left}</b> à détruire avec le style ${S.n}.${st === 'epee' ? '<br><br><small>Attaque : appuie pour enchaîner les coups, maintiens pour une attaque chargée. Esquive pour te repositionner.</small>' : ''}`, [['J\'y retourne', closePanel], ['Abandonner l\'initiation', () => { endTrial(P, false); closePanel(); }]]);
    else finishTrial(P, n);
    return;
  }
  if (!P.magic && st === 'epee') { dialog(M.name, 'Tu n\'as pas encore traversé le rituel du Maître Mage. Reviens quand ton affinité sera éveillée : je t\'entraînerai en conséquence.', [['D\'accord', closePanel]]); return; }
  if (!hasStyle(P) && st !== 'epee') { dialog(M.name, `${M.hello}<br><br>Mais tu n'as encore reçu aucune formation. Commence par <b>Kaelen</b>, au terrain d'entraînement de Brumeval. Reviens ensuite.`, [['Compris', closePanel]]); return; }
  if (P.lvl < M.lvl) { dialog(M.name, `${M.hello}<br><br>Tu n'es pas encore prêt. Reviens quand tu auras atteint le <b>niveau ${M.lvl}</b> (tu es niveau ${P.lvl}).`, [['Je reviendrai', closePanel]]); return; }
  if (P.trial) { dialog(M.name, 'Tu suis déjà une autre initiation. Termine-la d\'abord.', [['D\'accord', closePanel]]); return; }
  const syn = P.magic && SYNERGIES[st + ':' + P.magic];
  dialog(M.name, `${M.hello}<br><br>Je peux t'enseigner le style <b>${S.n}</b> : ${S.desc}<br>Technique : <b>${TECHS[S.tech].n}</b>.${syn ? `<br>Avec ta magie, ce style crée la synergie <b>${syn.n}</b>.` : ''}<br><br>Pour l'initiation, je te prête une arme d'entraînement : détruis trois mannequins avec ce style.`,
    [['Commencer l\'initiation', () => { startTrial(P, st, n); closePanel(); }], ['Plus tard', closePanel]]);
}
// ---------------- initiations (mannequins) ----------------
function startTrial(P, st, n) {
  const w = START_WEAPON[st];
  let inst = P.items.find(i => i.id === w);
  if (!inst) { giveItem(P, w, 1, 'Prêt de ' + MASTERS[st].name, true); inst = P.items.filter(i => i.id === w).pop(); }
  P.trial = { style: st, left: 3, prevStyle: P.style, prevWeapon: P.equip.weapon || null, prevOff: P.equip.offhand || null, weapon: inst.uid, dummies: [] };
  P.style = st; if (st !== 'epee') delete P.equip.offhand; P.equip.weapon = inst.uid; rebuildPlayer(P);
  const M = MASTERS[st]; const cx = M.tx * TILE + 16, cy = M.ty * TILE + 16 - 56;
  [[-46, 0], [0, -22], [46, 0]].forEach(([dx, dy]) => { let x = cx + dx, y = cy + dy; if (rectBlocked(x - 7, y - 8, 14, 8)) { x = cx; y = cy + 40; } const e = spawnEnemy('dummy', x, y, null); e.trial = true; P.trial.dummies.push(e); fxAt('flash', x, y - 20, { fps: 30, add: true, layer: 1 }); });
  sfx('open'); toast('Initiation : détruis les 3 mannequins avec le style ' + STYLES[st].n, '#ffe27a');
  if (st === 'epee') { later(() => toast('Attaque : J / clic gauche / bouton ⚔ — maintiens pour une attaque chargée', '#ffe9a0'), 1800); later(() => toast('Esquive : Espace / bouton » — Parade : L / clic droit / bouton bouclier', '#ffe9a0'), 5200); }
}
function endTrial(P, success) {
  const T = P.trial; if (!T) return;
  for (const e of T.dummies) e.dead = true, e.deadT = 2;
  G.enemies = G.enemies.filter(e => !e.trial);
  if (!success) {
    P.style = T.prevStyle; if (T.prevWeapon && findInst(P, T.prevWeapon)) P.equip.weapon = T.prevWeapon; else delete P.equip.weapon; if (T.prevOff && findInst(P, T.prevOff)) P.equip.offhand = T.prevOff;
    if (!hasStyle(P)) delete P.equip.weapon;
  }
  P.trial = null; rebuildPlayer(P);
}
function finishTrial(P, n) {
  const st = P.trial.style, M = MASTERS[st], S = STYLES[st]; const first = !hasStyleAny(P);
  P.stylesKnown[st] = 1; P.trial.dummies = []; P.trial = null; P.style = st; rebuildPlayer(P);
  sfx('level'); flashScreen('#fff2b0', 0.4); ring(P.x, P.y, 60, '#ffe27a', 0.6, 4);
  for (let i = 0; i < 30; i++) part(P.x + rnd(-14, 14), P.y - rnd(0, 10), { rise: rnd(40, 90), col: choice(['#ffe27a', '#fff']), life: 1, size: 2, add: true });
  if (first) G.quests.intro = Math.max(G.quests.intro || 0, 5);
  saveGame();
  dialog(M.name, `Bien. Tu as compris l'essentiel.<br><br>Tu as appris le style <b>${S.n}</b>. L'arme d'entraînement est à toi. Ta technique d'arme <b>${TECHS[S.tech].n}</b> s'utilise avec la touche ${actLabel('tech')} (bouton ✦).${first ? '<br><br>Tu peux désormais quitter le village. Retourne voir <b>l\'Ancien Théobald</b> : il a besoin de toi. D\'autres maîtres enseignent leurs styles à travers Vélorne.' : ''}`,
    [['Merci, maître', () => { closePanel(); toast('Style appris : ' + S.n, '#ffe27a'); }]]);
}
function hasStyleAny(P) { return Object.keys(P.stylesKnown || {}).length > 0; }
// ---------------- rituel du Magic Spin ----------------
let ritualRAF = 0;
function startRitual(n) {
  const P = G.player;
  // déplacement au centre du cercle
  P.x = RITUAL_SITE.tx * TILE + 16; P.y = RITUAL_SITE.ty * TILE + 24; P.dir = 0;
  const r = performMagicSpin(P);
  if (r.err) { dialog(n.name, r.err, [['D\'accord', closePanel]]); return; }
  G.quests.intro = Math.max(G.quests.intro || 0, 2);
  ritualScene(r);
}
function ritualScene(res) {
  const P = G.player; const F1 = MAGIC_DATA[res.m1], T1 = MAGIC_TIERS[F1.tier]; const F2 = res.m2 && MAGIC_DATA[res.m2];
  openPanel(`<div class="ritual"><canvas id="ritualcv" width="640" height="360"></canvas><button class="skip" id="ritualskip" style="display:none">Passer ›</button></div>`, 'ritualpanel');
  const cv = $('ritualcv'), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
  const total = F2 ? 15 : 11; let t = 0; let done = false;
  const wisps = MAGIC_KEYS.map((k, i) => ({ col: MAGIC_DATA[k].rgb, a: i / MAGIC_KEYS.length * 6.283, r: 120 + Math.random() * 40, h: Math.random() * 40 }));
  const sparks2 = [];
  playMusic && playMusic('village'); sfx('charge');
  const said = {};
  const once = (k, f) => { if (!said[k]) { said[k] = 1; f(); } };
  const glyph = (x, y, F, k, s) => { const ic = spellIcon(Object.keys(MAGIC_DATA).find(q => MAGIC_DATA[q] === F), F.spells[2].k); c.globalAlpha = k; c.drawImage(ic, x - 16 * s, y - 16 * s, 32 * s, 32 * s); c.globalAlpha = 1; };
  const reveal = (F, T, t0, cx, cy) => {
    const k = t - t0; if (k < 0) return;
    // sphère couleur de rareté, puis couleur de la famille
    const kc = clamp((k - 1.6) / 1.2, 0, 1); const rgbA = T.rgb.split(',').map(Number), rgbB = F.rgb.split(',').map(Number);
    const col = rgbA.map((v, i) => Math.round(v + (rgbB[i] - v) * kc)).join(',');
    const R = 26 + Math.min(1, k * 2) * 18 + Math.sin(t * 6) * 2;
    c.globalCompositeOperation = 'lighter'; c.drawImage(glowSprite(col, 48), cx - R * 3, cy - R * 3, R * 6, R * 6); c.globalCompositeOperation = 'source-over';
    c.fillStyle = `rgba(${col},0.95)`; c.beginPath(); c.arc(cx, cy, R * 0.55, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(cx - R * 0.15, cy - R * 0.18, R * 0.16, 0, 7); c.fill();
    for (let i = 0; i < 3; i++) if (Math.random() < 0.8) sparks2.push({ x: cx, y: cy, vx: rnd(-140, 140), vy: rnd(-160, 60), t: 0, col });
    c.textAlign = 'center';
    if (k > 0.4) { c.font = 'bold 16px Georgia,serif'; c.fillStyle = T.c; c.globalAlpha = clamp((k - 0.4) * 2, 0, 1); c.fillText('Affinité ' + T.n.toLowerCase(), cx, cy - 62); c.globalAlpha = 1; once('tier' + t0, () => { sfx(F.tier >= 4 ? 'roar' : 'open'); if (F.tier >= 4) shake(6); }); }
    if (k > 2.8) {
      glyph(cx, cy, F, clamp(k - 2.8, 0, 1), 1.1);
      const nm = F.n.toUpperCase(); const nShow = Math.min(nm.length, Math.floor((k - 2.8) * 9));
      const band = c.createLinearGradient(0, cy + 52, 0, cy + 128); band.addColorStop(0, 'rgba(7,4,13,0)'); band.addColorStop(0.3, 'rgba(7,4,13,0.82)'); band.addColorStop(0.8, 'rgba(7,4,13,0.82)'); band.addColorStop(1, 'rgba(7,4,13,0)'); c.fillStyle = band; c.fillRect(0, cy + 52, 640, 76);
      c.font = 'bold 34px Georgia,serif'; c.fillStyle = F.col; c.shadowColor = F.col; c.shadowBlur = 18; c.fillText(nm.slice(0, nShow), cx, cy + 88); c.shadowBlur = 0;
      once('name' + t0, () => { sfx('level'); flashScreen(F.col, 0.35); });
    }
    if (k > 3.8) { c.font = 'italic 13px Georgia,serif'; c.fillStyle = '#e8dcc0'; c.globalAlpha = clamp(k - 3.8, 0, 1); c.fillText(MAGIC_CATS[F.cat] + ' — ' + F.desc, cx, cy + 112); c.globalAlpha = 1; }
  };
  const loop = () => {
    if (!$('ritualcv')) return;
    t += 1 / 60; if (t > 2.5) $('ritualskip').style.display = '';
    c.fillStyle = '#07040d'; c.fillRect(0, 0, 640, 360);
    const g = c.createRadialGradient(320, 230, 10, 320, 230, 330); g.addColorStop(0, 'rgba(60,40,110,' + Math.min(0.6, t * 0.2) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 640, 360);
    // cercle runique au sol
    const draw = clamp(t / 1.6, 0, 1);
    c.save(); c.translate(320, 285); c.scale(1, 0.38);
    c.strokeStyle = `rgba(196,181,253,${0.4 + 0.5 * draw})`; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 190, -Math.PI / 2, -Math.PI / 2 + draw * 6.283); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 150, Math.PI / 2, Math.PI / 2 + draw * 6.283); c.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + t * 0.2; const lit = t > 1.6 + i * 0.12; c.fillStyle = lit ? `rgba(230,220,255,${0.6 + 0.4 * Math.sin(t * 5 + i)})` : 'rgba(120,100,170,0.4)'; c.fillRect(Math.cos(a) * 170 - 4, Math.sin(a) * 170 - 4, 8, 8); }
    for (let i = 0; i < 6; i++) { const a = -t * 0.4 + i / 6 * 6.283; c.beginPath(); c.moveTo(Math.cos(a) * 150, Math.sin(a) * 150); c.lineTo(Math.cos(a + 2.094) * 150, Math.sin(a + 2.094) * 150); c.stroke(); }
    c.restore();
    // le héros au centre
    drawShadow(c, 320, 287, 16, 0.4);
    const an = t > 1.2 && t < 6 ? 'spellcast' : 'walk'; const fr = an === 'spellcast' ? Math.min(6, Math.floor((t - 1.2) * 4)) : 0;
    c.save(); c.globalAlpha = t > 5.6 ? Math.max(0.25, 1 - (t - 5.6) * 0.8) : 1; c.translate(320, 296); c.scale(2, 2); drawChar(c, P.spr, an, 0, fr, 0, 0); c.restore(); c.globalAlpha = 1;
    // courants magiques (toutes les couleurs, sans nom)
    const conv = clamp((t - 4.2) / 1.2, 0, 1);
    if (t > 1.5 && t < 5.6) for (const w of wisps) {
      w.a += (0.8 + conv * 4) / 60; const r = w.r * (1 - conv); const x = 320 + Math.cos(w.a) * r * 1.4, y = 170 + Math.sin(w.a) * r * 0.45 - w.h * (1 - conv);
      c.globalCompositeOperation = 'lighter'; c.drawImage(glowSprite(w.col, 16), x - 9, y - 9, 18, 18); c.globalCompositeOperation = 'source-over';
      if (Math.random() < 0.3) sparks2.push({ x, y, vx: rnd(-20, 20), vy: rnd(-30, 0), t: 0, col: w.col });
    }
    if (t > 5.5 && t < 5.9) { c.fillStyle = `rgba(255,255,255,${1 - (t - 5.5) / 0.4})`; c.fillRect(0, 0, 640, 360); once('flash', () => { sfx('boom'); shake(8); }); }
    // révélation progressive
    reveal(F1, T1, 5.6, 320, 118);
    if (F2) {
      if (t > 10.2) { c.font = 'bold 16px Georgia,serif'; c.textAlign = 'center'; c.fillStyle = '#ffe27a'; c.fillText('Une seconde affinité s\'éveille !', 320, 30); once('dbl', () => { sfx('roar'); shake(10); }); }
      if (t > 10.8) { c.globalAlpha = 0.55; c.fillStyle = '#07040d'; c.fillRect(0, 0, 640, 360); c.globalAlpha = 1; reveal(F2, MAGIC_TIERS[F2.tier], 10.8, 320, 118); }
    }
    // étincelles
    for (const s of sparks2) { s.t += 1 / 60; s.x += s.vx / 60; s.y += s.vy / 60; s.vy += 60 / 60; c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${s.col},${1 - s.t})`; c.fillRect(s.x, s.y, 2, 2); c.globalCompositeOperation = 'source-over'; }
    for (let i = sparks2.length - 1; i >= 0; i--) if (sparks2[i].t > 1) sparks2.splice(i, 1);
    if (t >= total && !done) { done = true; ritualResult(res); return; }
    ritualRAF = requestAnimationFrame(loop);
  };
  loop();
  $('ritualskip').onclick = () => { cancelAnimationFrame(ritualRAF); if (!done) { done = true; ritualResult(res); } };
}
function ritualResult(res) {
  const P = G.player; cancelAnimationFrame(ritualRAF);
  const block = k => { const F = MAGIC_DATA[k], T = MAGIC_TIERS[F.tier]; return `<div class="magres" style="border-color:${F.col}"><div class="mh"><canvas class="mglyph" data-fam="${k}" width="32" height="32"></canvas><div><h3 style="color:${F.col}">${F.n}</h3><span style="color:${T.c}">${T.n}</span> · <small>${MAGIC_CATS[F.cat]}</small></div></div><p>${F.desc}</p>
    ${F.spells.map((s, i) => `<div class="sk2"><canvas class="sicon" data-fam="${k}" data-kind="${s.k}" width="32" height="32"></canvas><div><b>${['Sort 1', 'Sort 2', 'Sort 3'][i]} : ${s.n}</b> <small>${s.mp ? s.mp + ' mana · ' : ''}${s.cd} s</small><p>${s.d}</p></div></div>`).join('')}
    <p class="hint">Ultime : <b>${F.ult}</b> (se charge en combattant).</p></div>`; };
  openPanel(`<div class="ptabs"><button class="on">Ta magie innée est révélée</button><button class="x" data-close>✕</button></div><div class="pbody"><div class="magresw">${res.pity ? '<p class="hint okc">Protection contre la malchance : une magie épique ou mieux était garantie à ce tirage.</p>' : ''}${block(res.m1)}${res.m2 ? block(res.m2) + '<p class="hint">Seconde affinité : son premier sort peut être placé dans l\'emplacement 4 (Compétences).</p>' : ''}</div><div class="row"><button class="big" data-close>Continuer l'aventure</button></div></div>`, 'menu');
  document.querySelectorAll('canvas.sicon,canvas.mglyph').forEach(cv => { const F = MAGIC_DATA[cv.dataset.fam]; cv.getContext('2d').drawImage(spellIcon(cv.dataset.fam, cv.dataset.kind || F.spells[2].k), 0, 0); });
  // manifestation dans le monde
  const F = MAGIC_DATA[res.m1];
  later(() => { ring(P.x, P.y, 90, F.col, 0.8, 6); flashScreen(F.col, 0.3); for (let i = 0; i < 50; i++) part(P.x + rnd(-30, 30), P.y - rnd(0, 20), { rise: rnd(40, 120), col: F.col, life: 1.2, size: 2, add: true }); }, 50);
  if (IS_TOUCH) setupTouch();
}
