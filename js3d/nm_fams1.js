'use strict';
// =====================================================================
//  NOUVELLES MAGIES — familles 1 à 6 : Yamata no Orochi, Phénix, Titan, Kitsune, Dix Ombres, Arsenal du Roi déchu
//  Chaque compétence suit sa fiche du dossier (25/11). Valeurs numériques : prototypage, configurables.
//  Quand le dossier dit « le joueur choisit l'ordre / la séquence », la version actuelle utilise un ordre fixe
//  ou un cycle à chaque lancement (indiqué dans la fiche) : la sélection libre reste à prototyper.
// =====================================================================

// ---------------------------------------------------------------- 1. YAMATA NO OROCHI
(function () {
  const F = 'orochi', p = () => PALS[F];
  const headLine = (P, x, y, k) => { const q = p(); return (ctx, cx, cy) => { NMD.line(ctx, P.x - cx, P.y - cy - 14, x - cx, y - cy - 8, q, 3); NMD.orb(ctx, x - cx, y - cy - 8, 5, q, k); }; };
  // une tête qui jaillit vers un point (visuel commun aux morsures)
  function bite(P, e, E, mult, o) { if (!e || e.dead) return false; const q = p(); sfx(F + '_i'); nmHit(P, e, E, mult, o); sparks(e.x, e.y - 14, Math.atan2(e.y - P.y, e.x - P.x), 7, q[3]);
    mfx({ life: 0.22, x: e.x, y: e.y, big: 1, passes: ['glow'], upd() { }, draw(m, ctx, cx, cy) { ctx.globalAlpha = 1 - m.t / 0.22; headLine(P, e.x + (o && o.ox || 0), e.y + (o && o.oy || 0), m.t)(ctx, cx, cy); ctx.globalAlpha = 1; } }); return true; }
  // la forme « Corps du serpent-roi » ajoute une morsure de cou aux coups d'arme (cadence limitée)
  NM.onStrike.push((P, e) => { if (!nmFormOn(P, 'orochi') || (NM.orBite || 0) > G.t) return; NM.orBite = G.t + 0.45; const E = { fam: F, base: k => (14 + P.st8.mag * k) / Math.max(1, P.st8.mag) }; bite(P, e, E, 0.45, { kb: 20 }); nmGain(P, F, 2); });
  NMFAM(F, [
    { n: 'Morsure du premier chef', type: 'offensive', role: 'Morsure en ligne courte', ic: ['fang'], gain: 6, d: 'Une tête jaillit et mord en ligne courte. Sur une cible marquée par une autre tête : impact de suivi.',
      cast: (P, E) => { const t = nmTarget(P, E, 90); const a = t ? Math.atan2(t.y - P.y, t.x - P.x) : E.a; let hit = false;
        for (const e of near(P.x + Math.cos(a) * 40, P.y + Math.sin(a) * 40, 34)) { hit = bite(P, e, E, 1.15, { kb: 70 }) || hit; if (nmMarked(e, F)) { later(() => bite(P, e, E, 0.6, { ox: 12 }), 160); e.nmMark = null; } else nmMark(P, e, F, 5); }
        if (!hit) mfx({ life: 0.2, x: P.x, y: P.y, big: 1, passes: ['glow'], upd() { }, draw(m, ctx, cx, cy) { headLine(P, P.x + Math.cos(a) * 60, P.y + Math.sin(a) * 60, m.t)(ctx, cx, cy); } }); } },
    { n: 'Balayage des cous sinueux', type: 'offensive', role: 'Double arc opposé', ic: ['whip', 'whip'], gain: 5, d: 'Deux cous balaient des arcs opposés : le premier déplace les ennemis légers, le second frappe ceux qui ont perdu l\'équilibre.',
      cast: (P, E) => { const off = new Set(); NK.cone({ r: 72, arc: 3.2, mult: 0.45, kb: 170, onHit: () => { for (const e of near(P.x, P.y, 80)) if (!nmIsBig(e)) off.add(e); } })(P, E);
        later(() => { NK.cone({ r: 76, arc: 3.2, mult: 0.5, kb: 40 })(P, Object.assign({}, E, { a: E.a + Math.PI })); for (const e of off) if (!e.dead) nmHit(P, e, E, 0.7, { kb: 30 }); }, 220); } },
    { n: 'Regard des huit', type: 'utilitaire', role: 'Révèle les ouvertures', ic: ['eye'], setsBonus: true, gain: 4, d: 'Les huit têtes fixent une cible : ses ouvertures sont visibles, la prochaine compétence Orochi gagne un bonus. Aucune paralysie.',
      cast: (P, E) => { const t = nmTarget(P, E, 240); if (!t) { toast('Aucune cible à fixer', p()[3]); return; } nmMark(P, t, F, 8); NM.bonus[F] = { k: 1.35, t: G.t + 8, label: 'Ouverture exposée' }; sfx(F + '_c');
        mfx({ life: 1.2, x: t.x, y: t.y, big: 1, passes: ['glow'], upd() { }, draw(m, ctx, cx, cy) { const q = p(); for (let i = 0; i < 8; i++) { if (m.t < i * 0.08) continue; const a = i / 8 * 6.28; ctx.fillStyle = i % 2 ? q[3] : q[4]; ctx.fillRect(Math.round(t.x - cx + Math.cos(a) * 18 - 2), Math.round(t.y - cy - 22 + Math.sin(a) * 9 - 1), 4, 2); } } }); } },
    { n: 'Garde des cous entrelacés', type: 'défensive', role: 'Garde frontale à charges', ic: ['shield', 'whip'], cost: 18, d: 'Les cous tressés forment une garde mobile qui absorbe 4 impacts frontaux, puis se défait en contre-coup.',
      cast: (P, E) => { const k = nmSpend(P, F, 18); nmGuard(P, { n: k < 1 ? 2 : 4, a: () => P.aim, arc: 1.25, red: 1, dur: 6, col: p()[3], onBreak: (P2) => { NK.cone({ r: 70, arc: 1.8, mult: 1.2, kb: 160 })(P2, { fam: F, base: E.base, a: P2.aim }); nmFx(P2.x, P2.y, F, 16); } });
        NK.buff({ dur: 6, key: 'garde', gb: {} })(P, E); } },
    { n: 'Morsure en relais', type: 'offensive', role: 'Trois morsures enchaînées', ic: ['fang', 'chain'], cost: 14, d: 'Trois têtes mordent successivement la même cible depuis des angles alternés ; si une morsure manque, le relais s\'interrompt.',
      cast: (P, E) => { const k = nmSpend(P, F, 14); const t = nmTarget(P, E, 110); if (!t) return; const M = [0.7, 0.85, 1.15];
        const step = (i) => { if (i > 2) return; if (t.dead || dist(P.x, P.y, t.x, t.y) > 120) { num(P.x, P.y - 40, 'Relais rompu', p()[3]); return; } bite(P, t, E, M[i] * k, { kb: i === 2 ? 110 : 20, ox: (i % 2 ? -14 : 14), oy: -6 }); later(() => step(i + 1), 230); }; step(0); } },
    { n: 'Souffle des chefs', type: 'offensive', role: 'Quatre souffles physiques', ic: ['cloud', 'wave'], cost: 24, d: 'Quatre têtes soufflent tour à tour : pression, chaleur, venin corrosif, onde de choc (ordre fixe pour l\'instant — sélection libre à prototyper).',
      cast: (P, E) => { const k = nmSpend(P, F, 24), E2 = nmK(E, k); const seq = [{ kb: 200, st: null, n: 'Pression' }, { st: 'burn', n: 'Chaleur' }, { st: 'poison', n: 'Venin' }, { kb: 120, st: 'weak', n: 'Onde' }];
        seq.forEach((s, i) => later(() => { NK.cone({ r: 95, arc: 0.9, mult: 0.55, kb: s.kb || 30, onHit: () => { for (const e of near(P.x + Math.cos(P.aim) * 50, P.y + Math.sin(P.aim) * 50, 50)) nmCtl(P, e, s.st, F); } })(P, Object.assign({}, E2, { a: P.aim + (i - 1.5) * 0.12 })); num(P.x, P.y - 40 - i * 6, s.n, p()[4]); }, i * 200)); } },
    { n: 'Anneau des huit cous', type: 'défensive', role: 'Cercle tournant', ic: ['ring'], cost: 10, d: 'Les cous forment un cercle tournant qui frappe ceux qui le traversent ; chaque seconde consomme de la coordination.',
      cast: (P, E) => { nmSpend(P, F, 10); NK.buff({ dur: 8, key: 'anneau', gb: { dr: 0.08 }, orbit: { n: 8, rad: 34, r: 12, mult: 0.35, tick: 0.45, spd: 2.6, draw(ctx, x, y, i, q) { NMD.orb(ctx, x, y, 4, q, 0); } },
        onTick: (P2, E2, m, dt) => { nmGain(P2, F, -dt * 4); if (nmRes(P2, F) <= 0 && P2.gb.b_orochi_anneau) P2.gb.b_orochi_anneau.t = G.t; } })(P, E); } },
    { n: 'Frappe convergente', type: 'offensive', role: 'Convergence sur un point', ic: ['cross', 'fang'], cost: 16, d: 'Les têtes frappent ensemble un point au sol : zone élargie par les angles, dégâts concentrés au centre.',
      cast: (P, E) => { const k = nmSpend(P, F, 16); NK.delayed({ r: 66, delay: 0.55, mult: 0.55 * k, kb: 60, cross: 1, onHit: (P2, E2, m) => { nmAoe(P2, m.x, m.y, 26, E, 1.3 * k, { kb: 90 }); shake(5); } })(P, E); } },
    { n: 'Rugissement polyphonique', type: 'utilitaire', role: 'Désorientation (sauf boss)', ic: ['note', 'wave'], cost: 28, d: 'Huit rugissements décalés : les ennemis ordinaires sont désorientés, les boss subissent seulement une pression offensive.',
      cast: (P, E) => { const k = nmSpend(P, F, 28); for (let i = 0; i < 8; i++) later(() => { ring(P.x, P.y, 40 + i * 14, i % 2 ? p()[3] : p()[4], 0.4, 2); tone(160 + i * 40, 80 + i * 20, 0.25, 'sawtooth', 0.04); if (i === 7) for (const e of near(P.x, P.y, 150)) { nmHit(P, e, E, 0.3 * k, { kb: 40 }); nmCtl(P, e, nmIsBig(e) ? 'vuln' : 'confuse', F); } }, i * 90); } },
    { n: 'Corps du serpent-roi', type: 'transformation', role: 'Transformation : huit cous', ic: ['fang', 'star'], cost: 40, d: 'Écailles sur le torse, huit cous ancestraux derrière le joueur ; les coups d\'arme déclenchent des morsures de cou. La mobilité reste celle du personnage.',
      cast: (P, E) => { const k = nmSpend(P, F, 40); nmTransform(P, F, 'orochi', k < 1 ? 12 : 20); } },
  ], { n: 'Huit Couronnes, une seule gueule', type: 'ultime', role: 'Huit frappes puis morsure colossale', ic: ['fang', 'star'], boss: 'phases annoncées esquivables ; coup final majeur si préparé',
    d: 'Les huit têtes encerclent une vaste zone et frappent en séquence (annoncées), puis convergent en une morsure colossale.',
    cast: (P, E) => { const cx0 = E.tx, cy0 = E.ty; slowmo(0.5, 0.5); flashScreen('#000000', 0.45); sfx(F + '_u'); NM.dark = G.t + 4;
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; later(() => NK.delayed({ at: () => ({ x: cx0 + Math.cos(a) * 80, y: cy0 + Math.sin(a) * 48 }), r: 34, delay: 0.45, mult: 0.9, kb: 30 })(P, E), i * 170); }
      later(() => NK.delayed({ at: () => ({ x: cx0, y: cy0 }), r: 70, delay: 0.7, mult: 4.2, kb: 220, shk: 12, cross: 1, onHit: (P2, E2, m, n) => { flashScreen(p()[3], 0.5); nmFx(m.x, m.y, F, 40, 50); } })(P, E), 8 * 170 + 100); } });
})();

// ---------------------------------------------------------------- 2. PHÉNIX
(function () {
  const F = 'phenix', p = () => PALS[F];
  NM.feathers = [];
  const dropFeather = (x, y) => { if (!dirSolid(x, y)) NM.feathers.push({ x, y, t: G.t + (nmFormOn(G.player, 'phenix') ? 12 : 8) }); };
  // plumes plantées : visibles au sol (rendu 2D, reprises en 3D)
  { const dm = drawMfx; drawMfx = function (ctx, cx, cy, pass) { dm(ctx, cx, cy, pass); if (pass !== 'glow' || !NM.feathers.length) return; const q = p(); for (const f of NM.feathers) { const x = f.x - cx, y = f.y - cy; pxLine(ctx, x, y, x + 2, y - 8, q[2], 2); ctx.fillStyle = q[4]; ctx.fillRect(Math.round(x + 1), Math.round(y - 9), 2, 2); } }; }
  NM.onStrike.push((P, e) => { if (nmFormOn(P, 'phenix')) { nmMark(P, e, F, 6); if (Math.random() < 0.5) dropFeather(e.x + rnd(-10, 10), e.y + rnd(-6, 6)); } });
  const ignite = (P, e, E) => { if (nmMarked(e, F)) { e.nmMark = null; nmHit(P, e, E, 0.6, { kb: 30, st: 'burn' }); nmFx(e.x, e.y, F, 10, 40); } };
  NMFAM(F, [
    { n: 'Plumes de braise', type: 'offensive', role: 'Éventail de plumes plantées', ic: ['wings', 'needles'], gain: 6, d: 'Éventail de plumes qui se plantent dans le sol ou la cible et restent quelques secondes ; elles peuvent être rappelées.',
      cast: NK.proj({ n: 5, spread: 0.2, spd: 330, life: 0.6, r: 7, mult: 0.45, look: 'feather', kb: 30, onHit: (P, e, E, m) => { ignite(P, e, E); dropFeather(e.x, e.y); }, onEnd: (P, E, m) => dropFeather(m.x, m.y) }) },
    { n: 'Ailes de remontée', type: 'mobilité', role: 'Bond par-dessus un obstacle bas', ic: ['wings'], mob: true, gain: 3, d: 'Un battement d\'ailes soulève le joueur au-dessus d\'un obstacle bas ou d\'une attaque au sol. Pas de vol libre.',
      cast: NK.dash({ mode: 'blink', dist: 96, fxLife: 0.5, draw(ctx, x0, y0, x1, y1, m, q, k) { ctx.globalAlpha = 1 - k; ctx.strokeStyle = q[3]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0 - 6); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 40, x1, y1 - 6); ctx.stroke(); ctx.globalAlpha = 1; } }) },
    { n: 'Cercle de cendres', type: 'utilitaire', role: 'Anneau qui marque', ic: ['ring', 'cloud'], gain: 5, d: 'Un anneau de cendres autour du joueur marque ceux qui le traversent ; la prochaine attaque Phénix sur eux déclenche une combustion secondaire.',
      cast: NK.zone({ where: 'self', r: 72, delay: 0.1, dur: 5, mult: 0, tick: 99, fn: (P, e) => nmMark(P, e, F, 6) }) },
    { n: 'Mue ardente', type: 'mobilité', role: 'Esquive en laissant une enveloppe', ic: ['wings', 'flask'], mob: true, cost: 10, d: 'Une enveloppe de cendres reste en place et le joueur esquive ; l\'enveloppe éclate seulement si un ennemi la touche (sinon elle s\'effrite), sans attirer ni contrôler les ennemis.',
      cast: (P, E) => { nmSpend(P, F, 10); const hx = P.x, hy = P.y; mfx({ life: 3, x: hx, y: hy, big: 1, passes: ['ground', 'glow'], upd(m) { if (m.boom) return; if (m.t > 2.8) { m.boom = 1; ring(hx, hy, 16, p()[1], 0.3, 2); return; } if (near(hx, hy, 22).length) { m.boom = 1; m.t = Math.max(m.t, 2.6); sfx(F + '_i'); nmAoe(P, hx, hy, 46, E, 0.9, { kb: 60, st: 'burn' }); ring(hx, hy, 48, p()[3], 0.4, 3); } },
        draw(m, ctx, cx, cy, pass) { if (pass === 'ground') return; const q = p(); ctx.globalAlpha = m.boom ? 0.3 : 0.75; ctx.fillStyle = q[1]; ctx.fillRect(Math.round(hx - cx - 4), Math.round(hy - cy - 22), 8, 22); ctx.fillStyle = q[3]; ctx.fillRect(Math.round(hx - cx - 3), Math.round(hy - cy - 26), 6, 5); ctx.globalAlpha = 1; } });
        NK.dash({ dist: 100, dur: 0.2, mult: 0 })(P, E); } },
    { n: 'Plongée du plumage', type: 'offensive', role: 'Plongée sur une cible marquée', ic: ['meteor', 'wings'], cost: 14, d: 'Saut bref puis plongée sur une cible marquée ; l\'impact disperse les marques en éclats brûlants.',
      cast: (P, E) => { const k = nmSpend(P, F, 14); let t = null, bd = 230; for (const e of G.enemies) if (!e.dead && nmMarked(e, F)) { const d = dist(P.x, P.y, e.x, e.y); if (d < bd) { bd = d; t = e; } } t = t || nmTarget(P, E, 200); if (!t) return;
        P.iframes = Math.max(P.iframes, 0.6); later(() => { if (t.dead) return; const a = Math.atan2(P.y - t.y, P.x - t.x); if (lineClear(P.x, P.y, t.x, t.y)) { P.x = t.x + Math.cos(a) * 18; P.y = t.y + Math.sin(a) * 18; } shake(6); sfx(F + '_i');
          let marks = 0; for (const e of near(t.x, t.y, 70)) { if (nmMarked(e, F)) { marks++; e.nmMark = null; } } nmAoe(P, t.x, t.y, 50, E, 1.4 * k, { kb: 120 }); for (let i = 0; i < marks * 3; i++) { const a2 = rnd(0, 6.28); later(() => nmAoe(P, t.x + Math.cos(a2) * 40, t.y + Math.sin(a2) * 24, 22, E, 0.4 * k, { st: 'burn' }), 60 + i * 30); } ring(t.x, t.y, 60, p()[3], 0.4, 4); nmFx(t.x, t.y, F, 20, 40); }, 320); } },
    { n: 'Cocon de braises', type: 'défensive', role: 'Cocon immobile', ic: ['shield', 'sun'], cost: 12, d: 'Cocon défensif immobile très court : réduit fortement les dégâts frontaux, mais plusieurs impacts le brisent.',
      cast: (P, E) => { nmSpend(P, F, 12); gbuff(P, 'nmcocon', 2, { spd: -0.85 }); nmGuard(P, { n: 3, a: () => P.aim, arc: 1.5, red: 0.75, dur: 2, col: p()[3], onBreak: () => { if (P.gb.nmcocon) P.gb.nmcocon.t = G.t; toast('Cocon brisé', p()[3]); } }); NK.buff({ dur: 2, key: 'cocon', gb: {} })(P, E); } },
    { n: 'Rappel des cendres', type: 'utilitaire', role: 'Rappel des plumes plantées', ic: ['wings', 'spiral'], d: 'Les plumes déposées reviennent vers le joueur en frappant sur leur trajet ; chaque plume récupérée restaure du Cycle de Cendres.',
      cast: (P, E) => { const fs = NM.feathers.splice(0); if (!fs.length) { toast('Aucune plume sur le terrain', p()[3]); return; } sfx(F + '_c');
        for (const f of fs) { const hit = new Set(); mfx({ life: 1.2, x: f.x, y: f.y, big: 1, passes: ['glow'], upd(m, dt) { const d = dist(m.x, m.y, P.x, P.y); if (d < 12) { m.dead = true; nmGain(P, F, 5); return; } m.x += (P.x - m.x) / d * Math.min(d, 380 * dt); m.y += (P.y - m.y) / d * Math.min(d, 380 * dt); for (const e of near(m.x, m.y, 14)) if (!hit.has(e)) { hit.add(e); nmHit(P, e, E, 0.5, { kb: 20 }); ignite(P, e, E); } },
          draw(m, ctx, cx, cy) { NMD.line(ctx, m.x - cx, m.y - cy - 8, m.x - cx + 4, m.y - cy - 12, p(), 2); } }); } } },
    { n: 'Aube incandescente', type: 'offensive', role: 'Zone à pulsations', ic: ['sun', 'ring'], cost: 18, d: 'Les cendres d\'une zone s\'embrasent en vagues successives, avec des intervalles pour esquiver ; les plumes présentes renforcent la zone.',
      cast: (P, E) => { const k = nmSpend(P, F, 18); let extra = 0; NM.feathers = NM.feathers.filter(f => { if (dist(f.x, f.y, E.tx, E.ty) < 90) { extra++; return false; } return true; });
        NK.zone({ r: 74 + extra * 6, delay: 0.45, dur: 3.2, tick: 0.8, mult: (0.8 + extra * 0.1) * k, st: null, rings: 2, onTick: (P2, E2, z) => { ring(z.x, z.y, z.R, p()[3], 0.35, 3); for (const e of near(z.x, z.y, z.R)) ignite(P2, e, E2); } })(P, E); } },
    { n: 'Mue du grand Phénix', type: 'transformation', role: 'Transformation : ailes et queue', ic: ['wings', 'star'], cost: 35, d: 'Ailes, plumage d\'épaule et queue de feu ; les esquives deviennent des bonds aériens et les coups d\'arme laissent des plumes marquantes.',
      cast: (P, E) => { const k = nmSpend(P, F, 35); nmTransform(P, F, 'phenix', k < 1 ? 11 : 18); } },
    { n: 'Renaissance conditionnelle', type: 'défensive', role: 'Reconstruction après un coup fatal', ic: ['heart', 'wings'], cd: 30, mp: 20, d: 'Prépare la reconstruction pendant 60 s : si un coup fatal arrive avec la jauge pleine, le joueur revient à 30 % de vie. Longue recharge interne (180 s), pas dans les zones interdites, ne s\'empile pas.',
      boss: 'aucune différence ; jamais en arène de duel',
      cast: (P, E) => { if (P.nmRebirthCd > G.t) { toast('Renaissance en recharge (' + Math.ceil(P.nmRebirthCd - G.t) + ' s)', p()[3]); return; } P.nmRebirth = G.t + 60; toast(nmRes(P, F) >= 100 ? 'Renaissance prête (60 s)' : 'Renaissance préparée — jauge pleine requise', p()[3]); ring(P.x, P.y, 40, p()[3], 0.5, 3); } },
  ], { n: 'Seconde Aube', type: 'ultime', role: 'Dispersion puis explosion en anneaux', ic: ['sun', 'wings'], boss: 'dégâts en vagues, aucun contrôle',
    d: 'Le joueur se consume, se disperse en une nuée de cendres sur une grande zone puis se reconstitue au centre d\'une explosion en anneaux ; jauge partiellement restaurée.',
    cast: (P, E) => { P.iframes = Math.max(P.iframes, 2.2); P.nmHidden = G.t + 1.4; flashScreen(p()[3], 0.4); sfx(F + '_u');
      NK.zone({ where: 'self', r: 150, delay: 0.1, dur: 1.4, tick: 0.35, mult: 0.25, fn: (P2, e) => nmMark(P2, e, F, 4) })(P, E);
      for (let w = 0; w < 3; w++) later(() => { const R = 60 + w * 50; shake(7); ring(P.x, P.y, R, p()[3], 0.5, 5); for (const e of near(P.x, P.y, R)) nmHit(P, e, E, nmMarked(e, F) ? 1.8 : 1.2, { kb: 140, st: 'burn' }); nmFx(P.x, P.y, F, 20, 60); }, 1500 + w * 260);
      later(() => nmGain(P, F, 50), 2300); } });
})();

// ---------------------------------------------------------------- 3. TITAN
(function () {
  const F = 'titan', p = () => PALS[F];
  const inr = (P) => nmRes(P, F);
  NM.onStrike.push((P, e, mult, o) => { if (!P.nmCompress) return; P.nmCompress = 0; const E = { fam: F, base: k => (14 + P.st8.atk * k) / Math.max(1, P.st8.mag) }; nmAoe(P, e.x, e.y, 44, E, 1.2, { kb: 160 }); ring(e.x, e.y, 46, p()[3], 0.4, 4); shake(6); P.atkCd = (P.atkCd || 0) + 0.35; });
  const fist = (r, arc, mult, o) => NK.cone(Object.assign({ r, arc, mult, kb: 170, shk: 4, draw(ctx, x, y, m, q, z) { NMD.arc(ctx, x, y, z.r, z.a, z.arc, q, z.k); ctx.globalAlpha = 1 - z.k; ctx.fillStyle = q[3]; ctx.beginPath(); ctx.arc(x + Math.cos(z.a) * z.r * 0.7, y + Math.sin(z.a) * z.r * 0.4, 9 * (1 - z.k), 0, 7); ctx.fill(); ctx.globalAlpha = 1; } }, o));
  NMFAM(F, [
    { n: 'Poing d\'inertie', type: 'offensive', role: 'Coup direct selon l\'élan', ic: ['fist'], d: 'Coup de poing direct dont la puissance croît avec l\'inertie accumulée en se déplaçant juste avant. Sans élan : frappe fiable mais modérée.',
      cast: (P, E) => { const v = inr(P), use = Math.min(v, 30); nmSet(P, F, v - use); fist(58, 0.95, 0.9 + use / 30 * 1.1, { kb: 120 + use * 4 })(P, E); if (use > 20) num(P.x, P.y - 44, 'Élan ×' + (1 + use / 30).toFixed(1), p()[4]); } },
    { n: 'Pas sismique', type: 'offensive', role: 'Onde courte autour du pied', ic: ['wave', 'fist'], gain: 6, d: 'Un pas lourd crée une onde courte autour du pied ; l\'effet vient du poids du corps, aucune fissure persistante.',
      cast: NK.nova({ r: 56, hitM: 0.85, kb: 130, shk: 5, rings: 2 }) },
    { n: 'Ancrage colossal', type: 'défensive', role: 'Inébranlable, nourrit l\'inertie', ic: ['shield', 'fist'], d: 'Pieds plantés : très difficile à déplacer, dégâts réduits ; les coups reçus alimentent l\'inertie, la mobilité baisse.',
      cast: (P, E) => { gbuff(P, 'nmancre', 3, { dr: 0.35, spd: -0.65, poise: true }); nmGuard(P, { n: 30, a: null, red: 0, dur: 3, col: p()[3], onHit: () => nmGain(P, F, 9) }); NK.buff({ dur: 3, key: 'ancre', gb: {} })(P, E); shake(3); } },
    { n: 'Charge inexorable', type: 'mobilité', role: 'Charge qui s\'alourdit', ic: ['fist', 'meteor'], d: 'Charge en ligne droite qui gagne en puissance avec l\'élan ; un obstacle arrête la charge et fait perdre l\'élan.',
      cast: (P, E) => { const v = inr(P), use = Math.min(v, 40); nmSet(P, F, v - use); const sx = P.x, sy = P.y; NK.dash({ dist: 70 + use * 2, dur: 0.38, mult: 0.8 + use / 40, r: 20, inv: 1, onEnd: (P2) => { if (dist(sx, sy, P2.x, P2.y) < (70 + use * 2) * 0.8) { nmSet(P2, F, 0); shake(4); num(P2.x, P2.y - 40, 'Élan brisé', p()[3]); } } })(P, E); } },
    { n: 'Saisie du géant', type: 'offensive', role: 'Saisir et projeter', ic: ['hand'], d: 'Saisit un ennemi de taille compatible, le soulève et le projette ; les ennemis lourds et boss encaissent un coup de paume à la place.',
      cast: (P, E) => { const t = nmTarget(P, E, 70); if (!t) { toast('Rien à saisir à portée', p()[3]); return; } sfx(F + '_c');
        if (nmIsBig(t)) { nmHit(P, t, E, 1.2, { kb: 0 }); ring(t.x, t.y, 30, p()[3], 0.3, 3); return; }
        t.rootT = Math.max(t.rootT || 0, 0.5); later(() => { if (t.dead) return; const a = P.aim; let d = 90; while (d > 10 && !lineClear(t.x, t.y, t.x + Math.cos(a) * d, t.y + Math.sin(a) * d)) d -= 10; t.x += Math.cos(a) * d; t.y += Math.sin(a) * d; shake(6); sfx(F + '_i'); nmHit(P, t, E, 1.4, { kb: 40 }); nmAoe(P, t.x, t.y, 34, E, 0.5, { kb: 90 }); ring(t.x, t.y, 36, p()[3], 0.35, 3); }, 380); } },
    { n: 'Épaules indomptables', type: 'défensive', role: 'Marche de garde', ic: ['shield', 'wave'], d: 'Avance en garde corporelle : petits projectiles frontaux déviés, ennemis légers repoussés ; une attaque lourde interrompt la marche.',
      cast: (P, E) => { NK.buff({ dur: 4, key: 'epaules', gb: { dr: 0.15 }, deflect: 34, onTick: (P2, E2, m, dt) => { for (const e of near(P2.x + Math.cos(P2.aim) * 22, P2.y + Math.sin(P2.aim) * 22, 22)) if (!nmIsBig(e)) pushE(e, P2.x, P2.y, 240 * dt * 10); } })(P, E);
        nmGuard(P, { n: 1, a: null, red: 0, dur: 4, onHit: (P2, src) => { if (src && src.def && (src.def.heavy || src.def.boss) && P2.gb.b_titan_epaules) { P2.gb.b_titan_epaules.t = G.t; num(P2.x, P2.y - 40, 'Marche interrompue', p()[3]); } } }); } },
    { n: 'Compression musculaire', type: 'utilitaire', role: 'Prochain coup d\'arme renforcé', ic: ['fist', 'spiral'], gain: 4, d: 'Concentre la masse dans un membre : le prochain coup d\'arme gagne une onde d\'impact et de la puissance, avec une récupération plus longue.',
      cast: (P, E) => { P.nmCompress = 1; ring(P.x, P.y, 26, p()[3], 0.4, 3); num(P.x, P.y - 42, 'Membre comprimé', p()[4]); } },
    { n: 'Bond des hauteurs', type: 'mobilité', role: 'Saut et atterrissage télégraphié', ic: ['meteor', 'fist'], mob: true, d: 'Saut puissant vers un point choisi avant le décollage ; l\'atterrissage, annoncé, frappe selon l\'inertie portée et la convertit en élan (+20).',
      cast: (P, E) => { let tx = E.tx, ty = E.ty; const d = dist(P.x, P.y, tx, ty); if (d > 150) { tx = P.x + (tx - P.x) / d * 150; ty = P.y + (ty - P.y) / d * 150; } if (dirSolid(tx, ty)) { toast('Point d\'atterrissage bloqué', p()[3]); return; } P.iframes = Math.max(P.iframes, 0.7);
        const v = nmRes(P, F); NK.delayed({ at: () => ({ x: tx, y: ty }), r: 56, delay: 0.55, mult: 1.1 + v / 100, kb: 150, shk: 8, onHit: () => { P.x = tx; P.y = ty; nmGain(P, F, 20); } })(P, E); } },
    { n: 'Forme du Titan', type: 'transformation', role: 'Transformation : colosse', ic: ['fist', 'star'], cd: 40, d: 'Croissance contrôlée : membres massifs, démarche lourde, portée de mêlée accrue. Impossible dans les intérieurs étroits.',
      cast: (P, E) => { nmTransform(P, F, 'titan', 20); } },
    { n: 'Rupture d\'inertie', type: 'offensive', role: 'Libère toute l\'inertie', ic: ['wave', 'meteor'], d: 'Libère d\'un coup l\'inertie accumulée en une onde au sol : plus elle est haute, plus l\'onde est large ; la jauge retombe à zéro.',
      cast: (P, E) => { const v = inr(P); nmSet(P, F, 0); const R = 40 + v * 1.1; NK.nova({ r: R, hitM: 0.7 + v / 45, kb: 100 + v * 2, shk: 3 + v / 14, rings: 4 })(P, E); num(P.x, P.y - 44, 'Inertie ' + Math.round(v), p()[4]); } },
  ], { n: 'Le Poids du Premier Géant', type: 'ultime', role: 'Trois frappes annoncées', ic: ['fist', 'star'], boss: 'dégâts complets, jamais projeté',
    d: 'Le Titan s\'ancre puis porte trois frappes annoncées — poing, coude, impact total ; la dernière libère une onde massive.',
    cast: (P, E) => { gbuff(P, 'nmult', 2.4, { dr: 0.5, poise: true, spd: -0.9 }); sfx(F + '_u'); slowmo(0.4, 0.4);
      later(() => fist(80, 1.2, 1.6, { kb: 160 })(P, Object.assign({}, E, { a: P.aim })), 500);
      later(() => fist(90, 1.6, 1.9, { kb: 180 })(P, Object.assign({}, E, { a: P.aim })), 1000);
      later(() => { NK.nova({ r: 160, hitM: 3.6, kb: 260, shk: 14, rings: 5 })(P, E); flashScreen(p()[4], 0.4); }, 1650); } });
})();

// ---------------------------------------------------------------- 4. KITSUNE (Sceaux-renards 0–9)
(function () {
  const F = 'kitsune', p = () => PALS[F];
  NM.seals = [];
  const sealDur = () => nmFormOn(G.player, 'kitsune') ? 16 : 10;
  const addSeal = (x, y, kind) => { if (dirSolid(x, y)) return null; const s = { x, y, t: G.t + sealDur(), kind: kind || 'seuil' }; NM.seals.push(s); if (NM.seals.length > 9) NM.seals.shift(); nmGain(G.player, F, 1); return s; };
  const nearSeal = (P, R) => { let b = null, bd = R; for (const s of NM.seals) { const d = dist(P.x, P.y, s.x, s.y); if (d < bd && d > 12) { bd = d; b = s; } } return b; };
  const useSeal = (s) => { NM.seals = NM.seals.filter(x => x !== s); };
  { const dm = drawMfx; drawMfx = function (ctx, cx, cy, pass) { dm(ctx, cx, cy, pass); if (pass !== 'ground' || (!NM.seals.length && !NM.wisp)) return; const q = p();
      for (const s of NM.seals) { const x = s.x - cx, y = s.y - cy; ctx.globalAlpha = 0.75; ctx.strokeStyle = s.kind === 'palais' ? q[3] : q[1]; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 10, 5.5, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 3.5); ctx.lineTo(x, y + 3.5); ctx.stroke(); ctx.globalAlpha = 1; }
      const pal = NM.seals.filter(s => s.kind === 'palais'); if (pal.length > 1) { ctx.globalAlpha = 0.5; ctx.strokeStyle = q[3]; ctx.beginPath(); pal.forEach((s, i) => i ? ctx.lineTo(s.x - cx, s.y - cy) : ctx.moveTo(s.x - cx, s.y - cy)); ctx.stroke(); ctx.globalAlpha = 1; }
      if (NM.wisp && NM.wisp.t > G.t) NMD.orb(ctx, NM.wisp.x - cx, NM.wisp.y - cy - 14 + Math.sin(G.t * 5) * 2, 4, q, G.t); }; }
  const dashTo = (P, E, x, y, mult) => { const sx = P.x, sy = P.y; if (!lineClear(P.x, P.y, x, y)) { toast('Trajectoire bloquée', p()[3]); return false; } P.x = x; P.y = y; P.iframes = Math.max(P.iframes, 0.25); const c = Math.atan2(y - sy, x - sx);
    if (mult) for (const e of G.enemies) if (!e.dead) { const dx = e.x - sx, dy = e.y - sy, L = dist(sx, sy, x, y), u = dx * Math.cos(c) + dy * Math.sin(c), v = -dx * Math.sin(c) + dy * Math.cos(c); if (u > 0 && u < L && Math.abs(v) < 18 + e.def.r * 0.5) nmHit(P, e, E, mult, { kb: 50 }); }
    mfx({ life: 0.4, x: sx, y: sy, big: 1, passes: ['glow'], upd() { }, draw(m, ctx, cx, cy) { ctx.globalAlpha = 1 - m.t / 0.4; NMD.line(ctx, sx - cx, sy - cy - 10, x - cx, y - cy - 10, p(), 2); ctx.globalAlpha = 1; } }); return true; };
  const tailHit = (P, e, E, mult, o) => { nmHit(P, e, E, mult, o); mfx({ life: 0.2, x: e.x, y: e.y, big: 1, passes: ['glow'], upd() { }, draw(m, ctx, cx, cy) { ctx.globalAlpha = 1 - m.t / 0.2; ctx.strokeStyle = p()[2]; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(P.x - cx, P.y - cy - 8); ctx.quadraticCurveTo((P.x + e.x) / 2 - cx, Math.min(P.y, e.y) - cy - 40, e.x - cx, e.y - cy - 12); ctx.stroke(); ctx.strokeStyle = p()[4]; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1; } }); };
  NM.kfan = 0;
  NMFAM(F, [
    { n: 'Queue gardienne', type: 'défensive', role: 'Une queue absorbe un impact', ic: ['shield', 'whip'], d: 'Une queue s\'interpose sur un flanc (alternativement gauche puis droit) et absorbe un impact venant de ce côté, puis se rétracte (recharge).',
      cast: (P, E) => { NM.kside = -(NM.kside || -1); const a = P.aim + NM.kside * Math.PI / 2; num(P.x, P.y - 44, NM.kside > 0 ? 'Flanc droit' : 'Flanc gauche', p()[4]); nmGuard(P, { n: 1, a, arc: 1.6, red: 1, dur: 5, col: p()[2] }); NK.buff({ dur: 5, key: 'garde', gb: {}, draw(ctx, x, y, P2, q, z) { ctx.globalAlpha = z.k; ctx.strokeStyle = q[2]; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y - 10, 18, a - 0.8, a + 0.8); ctx.stroke(); ctx.globalAlpha = 1; } })(P, E); } },
    { n: 'Griffe du renard', type: 'offensive', role: 'Pointe de queue à moyenne portée', ic: ['thorn', 'whip'], d: 'Une queue raidie frappe à moyenne portée ; si un sceau est disponible, elle revient par un angle secondaire.',
      cast: (P, E) => { const t = nmTarget(P, E, 150); if (!t) { NK.proj({ spd: 420, life: 0.35, look: 'line', mult: 1 })(P, E); return; } tailHit(P, t, E, 1.05, { kb: 60 });
        if (nmRes(P, F) >= 1 || nmFormOn(P, 'kitsune')) { if (!nmFormOn(P, 'kitsune')) nmSet(P, F, nmRes(P, F) - 1); later(() => { if (!t.dead) tailHit(P, t, E, 0.6, { kb: 30 }); }, 240); } } },
    { n: 'Sceau du seuil', type: 'mobilité', role: 'Sceau d\'élan à usage unique', ic: ['rune', 'portal'], mob: true, d: 'Pose un sceau discret ; relancer la compétence élance le joueur vers lui une fois (le sceau disparaît).',
      cast: (P, E) => { const s = NM.seals.find(s => s.kind === 'seuil' && dist(P.x, P.y, s.x, s.y) < 180 && dist(P.x, P.y, s.x, s.y) > 16); if (s) { if (dashTo(P, E, s.x, s.y, 0.3)) useSeal(s); return; }
        const d = Math.min(120, dist(P.x, P.y, E.tx, E.ty)); if (addSeal(P.x + Math.cos(E.a) * d, P.y + Math.sin(E.a) * d, 'seuil')) sfx(F + '_c'); } },
    { n: 'Pas des neuf chemins', type: 'mobilité', role: 'Pas courts en zigzag', ic: ['wings', 'chain'], mob: true, d: 'La queue désigne une direction ; succession de pas courts en zigzag. Pas une téléportation : les obstacles bloquent.',
      cast: (P, E) => { const a = E.a; P.iframes = Math.max(P.iframes, 0.5); for (let i = 0; i < 3; i++) later(() => { const aa = a + (i % 2 ? -0.55 : 0.55); moveBody(P, Math.cos(aa) * 38, Math.sin(aa) * 38); for (const e of near(P.x, P.y, 20)) nmHit(P, e, E, 0.35, { kb: 30 }); part(P.x, P.y - 6, { col: p()[2], life: 0.4, size: 3, add: true }); }, i * 90); } },
    { n: 'Queue entravante', type: 'utilitaire', role: 'Entrave courte (pas les boss)', ic: ['whip', 'web'], cost: 1, d: 'Deux queues croisent leur trajectoire autour d\'une cible et limitent ses déplacements un court instant ; les boss sont seulement ralentis.',
      cast: (P, E) => { const k = nmSpend(P, F, 1); const t = nmTarget(P, E, 160); if (!t) return; tailHit(P, t, E, 0.55 * k, { kb: 0 }); later(() => { if (!t.dead) { tailHit(P, t, E, 0.3 * k, { kb: 0 }); nmCtl(P, t, 'root', F); } }, 150); } },
    { n: 'Feu follet-guide', type: 'utilitaire', role: 'Point d\'émission déporté', ic: ['star', 'orb'], setsBonus: true, d: 'Un feu follet se pose au point visé ; la prochaine compétence Kitsune (hors déplacements) part de ce point, une seule fois.',
      cast: (P, E) => { const d = Math.min(180, dist(P.x, P.y, E.tx, E.ty)); const x = P.x + Math.cos(E.a) * d, y = P.y + Math.sin(E.a) * d; if (dirSolid(x, y)) return; NM.wisp = { x, y, t: G.t + 6 }; sfx(F + '_c'); ring(x, y, 20, p()[3], 0.3, 2); } },
    { n: 'Sceau de permutation', type: 'mobilité', role: 'Échange avec un sceau', ic: ['portal', 'rune'], mob: true, cost: 1, d: 'Échange la position du joueur avec un sceau actif ; échoue si le point est bloqué ou hors portée.',
      cast: (P, E) => { const s = nearSeal(P, 240); if (!s) { toast('Aucun sceau à portée', p()[3]); return; } if (dirSolid(s.x, s.y)) { toast('Sceau obstrué', p()[3]); return; } nmSpend(P, F, 1); const ox = P.x, oy = P.y; P.x = s.x; P.y = s.y; s.x = ox; s.y = oy; P.iframes = Math.max(P.iframes, 0.3); sfx(F + '_i'); ring(P.x, P.y, 28, p()[3], 0.35, 3); ring(ox, oy, 28, p()[3], 0.35, 3); nmAoe(P, P.x, P.y, 30, E, 0.5, { kb: 80 }); } },
    { n: 'Éventail des queues', type: 'offensive', role: 'Balayage / piqué / garde (cycle)', ic: ['whip', 'ring'], d: 'Les queues frappent selon une séquence : balayage, piqué ou garde, chacune avec son profil. Ordre actuel : cycle à chaque lancement (choix libre à prototyper).',
      cast: (P, E) => { const m = NM.kfan++ % 3; num(P.x, P.y - 44, ['Balayage', 'Piqué', 'Garde'][m], p()[4]);
        if (m === 0) NK.cone({ r: 80, arc: 2.8, mult: 0.85, kb: 120 })(P, E); else if (m === 1) NK.proj({ spd: 480, life: 0.45, r: 9, look: 'line', mult: 1.35, pierce: 2 })(P, E); else { nmGuard(P, { n: 2, a: () => P.aim, arc: 1.4, red: 1, dur: 4, col: p()[2] }); NK.cone({ r: 50, arc: 1.6, mult: 0.5, kb: 140 })(P, E); } } },
    { n: 'Masque du renard ancien', type: 'transformation', role: 'Transformation : oreilles et queues', ic: ['eye', 'star'], cd: 36, d: 'Oreilles, marques faciales, queues et posture du Kitsune ; les sceaux durent plus longtemps et la Griffe gagne toujours son suivi.',
      cast: (P, E) => { nmTransform(P, F, 'kitsune', 20); for (const s of NM.seals) s.t += 6; } },
    { n: 'Palais des sceaux', type: 'mobilité', role: 'Réseau de trois sceaux', ic: ['rune', 'chain'], cd: 2.5, mp: 12, d: 'Crée trois sceaux reliés ; chaque relance s\'élance vers le sceau suivant en frappant sur le trajet ; le réseau s\'effondre après trois utilisations.',
      cast: (P, E) => { const pal = NM.seals.filter(s => s.kind === 'palais'); if (pal.length) { const s = pal[0]; if (dashTo(P, E, s.x, s.y, 0.95)) { useSeal(s); if (pal.length === 1) { nmAoe(P, P.x, P.y, 50, E, 0.8, { kb: 100 }); ring(P.x, P.y, 52, p()[3], 0.4, 3); } } return; }
        if (P.cd) for (const k in P.cd) if (equippedSel(P, k) === 'C11') P.cd[k] = 9; nmSpend(P, F, 3);
        for (let i = 0; i < 3; i++) { const a = E.a + (i - 1) * 2.09; addSeal(E.tx + Math.cos(a) * 60, E.ty + Math.sin(a) * 36, 'palais'); } sfx(F + '_c'); } },
  ], { n: 'Les Neuf Portes du Renard', type: 'ultime', role: 'Neuf sceaux puis convergence', ic: ['rune', 'star'], boss: 'frappes et convergence, aucun contrôle',
    d: 'Neuf queues tracent neuf sceaux autour de l\'arène ; chaque porte déclenche une frappe ou une garde, la neuvième ferme le réseau par une attaque convergente. Ordre actuel : automatique (choix à prototyper).',
    cast: (P, E) => { const cx0 = P.x, cy0 = P.y, pts = []; sfx(F + '_u'); flashScreen(p()[3], 0.3);
      for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; pts.push({ x: cx0 + Math.cos(a) * 110, y: cy0 + Math.sin(a) * 64 }); }
      pts.forEach((g, i) => later(() => { ring(g.x, g.y, 20, p()[3], 0.4, 3); if (i === 8) return; if (i % 3 === 2) nmGuard(P, { n: 1, a: null, red: 1, dur: 4, col: p()[3] }); else nmAoe(P, g.x, g.y, 34, E, 0.9, { kb: 60 }); }, i * 220));
      later(() => { for (const g of pts) mfx({ life: 0.4, x: g.x, y: g.y, big: 1, passes: ['glow'], upd() { }, draw(m, ctx, cx, cy) { ctx.globalAlpha = 1 - m.t / 0.4; NMD.line(ctx, g.x - cx, g.y - cy - 8, E.tx - cx, E.ty - cy - 8, p(), 2); ctx.globalAlpha = 1; } }); nmAoe(P, E.tx, E.ty, 70, E, 3.4, { kb: 200 }); shake(10); ring(E.tx, E.ty, 72, p()[4], 0.5, 5); }, 9 * 220 + 120); } });
})();

// ---------------------------------------------------------------- 5. DIX OMBRES
(function () {
  const F = 'dixombres', p = () => PALS[F];
  const ROLES = ['Éclaireur', 'Chasseur', 'Protecteur', 'Sauteur', 'Rôdeur', 'Rapace', 'Colosse', 'Serpent', 'Essaim', 'Sentinelle'];
  NM.sh = ROLES.map(() => ({ down: 0 })); // disponibilité individuelle des familiers
  const avail = (i) => NM.sh[i].down <= G.t;
  const need = (P, i) => { if (avail(i)) return 1; toast(ROLES[i] + ' indisponible (' + Math.ceil(NM.sh[i].down - G.t) + ' s)', p()[3]); return 0; };
  const shadowDraw = (sz) => (ctx, x, y, s, q, t) => { ctx.fillStyle = q[1]; ctx.beginPath(); ctx.ellipse(x, y - 6, sz, sz * 0.75, 0, 0, 7); ctx.fill(); ctx.fillStyle = q[2]; ctx.beginPath(); ctx.ellipse(x + (s.dir || 1) * sz * 0.6, y - 8 - sz * 0.3, sz * 0.5, sz * 0.4, 0, 0, 7); ctx.fill(); ctx.fillStyle = q[4]; ctx.fillRect(Math.round(x + (s.dir || 1) * sz * 0.7), Math.round(y - 10 - sz * 0.3), 2, 1); };
  const tag = (m) => { m.nmsh = 1; return m; };
  const summon = (o) => (P, E) => { const n0 = G.mfx.length; NK.summon(Object.assign({ draw: shadowDraw(o.sz || 7) }, o))(P, E); for (let i = n0; i < G.mfx.length; i++) tag(G.mfx[i]); };
  NM.formation = null;
  NM.onStrike.push((P, e) => { const f = NM.formation; if (!f || f.t < G.t || f.e.dead) return; NM.formation = null; const E = f.E; f.pts.forEach((q, i) => later(() => { if (!f.e.dead) { nmHit(P, f.e, E, 0.9, { kb: 40 }); sparks(f.e.x, f.e.y - 12, Math.atan2(f.e.y - q.y, f.e.x - q.x), 6, p()[3]); } }, i * 110)); });
  NM.onStrike.push((P, e) => { if (!nmFormOn(P, 'dixombres') || (NM.dxF || 0) > G.t) return; NM.dxF = G.t + 1.2; const E = { fam: F, base: k => (14 + P.st8.mag * k) / Math.max(1, P.st8.mag) }; later(() => { if (!e.dead) { nmHit(P, e, E, 0.5, { kb: 30 }); sparks(e.x, e.y - 12, rnd(0, 6.28), 5, p()[3]); } }, 180); });
  NMFAM(F, [
    { n: 'Appel du premier familier', type: 'utilitaire', role: 'Éclaireur : révèle et marque', ic: ['eye', 'skull'], inv: true, gain: 5, d: 'Invoque l\'Éclaireur, qui révèle les ennemis proches et marque une cible sans dégâts importants.',
      cast: (P, E) => { if (!need(P, 0)) return; summon({ n: 1, dur: 6, mult: 0.1, every: 1.2, range: 200, sz: 5 })(P, E); const ens = G.enemies.filter(e => !e.dead && dist(P.x, P.y, e.x, e.y) < 260).sort((a, b) => dist(P.x, P.y, a.x, a.y) - dist(P.x, P.y, b.x, b.y)); for (const e of ens.slice(0, 4)) nmMark(P, e, F, 9); num(P.x, P.y - 44, ens.length + ' présence(s)', p()[4]); } },
    { n: 'Traque du second familier', type: 'offensive', role: 'Chasseur : frappe une cible marquée', ic: ['fang', 'skull'], inv: true, d: 'Le Chasseur poursuit une cible marquée, frappe une fois puis revient ; il ne traverse pas les murs.',
      cast: (P, E) => { if (!need(P, 1)) return; let t = G.enemies.find(e => !e.dead && nmMarked(e, F) && dist(P.x, P.y, e.x, e.y) < 280) || nmTarget(P, E, 240); const a = t ? Math.atan2(t.y - P.y, t.x - P.x) : E.a;
        NK.proj({ spd: 300, life: 1.4, r: 10, homing: 5, look: 'fang', mult: t && nmMarked(t, F) ? 1.5 : 1.0, kb: 60, ret: 1 })(P, Object.assign({}, E, { a })); } },
    { n: 'Garde du troisième familier', type: 'défensive', role: 'Protecteur : intercepte', ic: ['shield', 'skull'], inv: true, d: 'Le Protecteur se place entre le joueur et la direction visée ; il intercepte 3 attaques puis se dissipe.',
      cast: (P, E) => { if (!need(P, 2)) return; const a = P.aim; const g = nmGuard(P, { n: 3, a, arc: 1.1, red: 1, dur: 7, col: p()[3] }); tag(mfx({ life: 7, x: P.x, y: P.y, big: 1, passes: ['glow'], upd(m) { m.x = P.x + Math.cos(a) * 20; m.y = P.y + Math.sin(a) * 12; if (g.n <= 0) m.dead = true; }, draw(m, ctx, cx, cy) { shadowDraw(9)(ctx, m.x - cx, m.y - cy - 4, { dir: Math.cos(a) < 0 ? -1 : 1 }, p(), m.t); } })); } },
    { n: 'Bond du quatrième familier', type: 'offensive', role: 'Sauteur : bond annoncé', ic: ['meteor', 'skull'], inv: true, d: 'Le Sauteur attaque une zone au sol après un bond annoncé ; il respecte la géométrie.',
      cast: (P, E) => { if (!need(P, 3)) return; if (!lineClear(P.x, P.y, E.tx, E.ty)) { toast('Le Sauteur ne peut pas atteindre ce point', p()[3]); return; } NK.delayed({ r: 46, delay: 0.6, mult: 1.35, kb: 120, shk: 5 })(P, E); } },
    { n: 'Lien des deux ombres', type: 'utilitaire', role: 'Deux familiers liés', ic: ['chain', 'skull'], inv: true, cost: 14, d: 'Deux familiers liés : quand l\'un frappe, l\'autre se repositionne de l\'autre côté de la cible. Le lien ne double pas les dégâts.',
      cast: (P, E) => { if (!need(P, 4) || !need(P, 5)) return; nmSpend(P, F, 14); const pair = new Set();
        summon({ n: 2, dur: 9, mult: 0.6, every: 0.7, spd: 150, sz: 6, onTick: (P2, E2, s) => pair.add(s), onHit: (P2, tg, E2, s) => { for (const o of pair) if (o !== s) { const a = Math.atan2(s.y - tg.y, s.x - tg.x) + Math.PI; const nx = tg.x + Math.cos(a) * 20, ny = tg.y + Math.sin(a) * 12; if (!dirSolid(nx, ny)) { o.x = nx; o.y = ny; } } } })(P, E); } },
    { n: 'Formation de chasse', type: 'offensive', role: 'Trois angles, attaque sur ordre', ic: ['cross', 'skull'], inv: true, cost: 16, d: 'Trois familiers prennent des angles distincts autour d\'une cible ; ils attaquent au prochain coup d\'arme du joueur (l\'ordre de déclenchement).',
      cast: (P, E) => { const t = nmTarget(P, E, 220); if (!t) return; nmSpend(P, F, 16); const pts = [0, 2.09, 4.19].map(a => ({ a })); NM.formation = { e: t, t: G.t + 8, pts, E };
        tag(mfx({ life: 8, x: t.x, y: t.y, big: 1, passes: ['glow'], upd(m) { if (NM.formation === null || NM.formation.e !== t || t.dead) m.dead = true; for (const q of pts) { q.x = t.x + Math.cos(q.a) * 30; q.y = t.y + Math.sin(q.a) * 18; } }, draw(m, ctx, cx, cy) { for (const q of pts) if (q.x) shadowDraw(6)(ctx, q.x - cx, q.y - cy, { dir: q.x < t.x ? 1 : -1 }, p(), m.t); } }));
        num(P.x, P.y - 44, 'Frappez pour lancer l\'assaut', p()[4]); } },
    { n: 'Rappel au creux', type: 'utilitaire', role: 'Rappel général', ic: ['spiral', 'skull'], gain: 6, d: 'Rappelle tous les familiers actifs : leurs actions s\'interrompent et la prochaine invocation coûte moitié moins de mana.',
      cast: (P, E) => { let n = 0; for (const m of G.mfx) if (m.nmsh && !m.dead) { m.dead = true; n++; } NM.formation = null; NM.discount = true; ring(P.x, P.y, 40, p()[3], 0.4, 3); num(P.x, P.y - 44, n + ' rappel(s) — prochaine invocation −50 % mana', p()[4]); } },
    { n: 'Fusion des silhouettes', type: 'offensive', role: 'Créature composite', ic: ['skull', 'star'], inv: true, cost: 22, d: 'Deux familiers compatibles (Colosse et Serpent) fusionnent brièvement en une créature composite à l\'attaque combinée ; ils sont indisponibles séparément pendant ce temps.',
      cast: (P, E) => { if (!need(P, 6) || !need(P, 7)) return; const k = nmSpend(P, F, 22); NM.sh[6].down = NM.sh[7].down = G.t + 7.5; summon({ n: 1, dur: 7, mult: 1.6 * k, every: 1.0, kb: 160, spd: 110, hitR: 26, sz: 12 })(P, E); } },
    { n: 'Manifestation des dix', type: 'utilitaire', role: 'Dix présences, deux ordres rapides', ic: ['ring', 'skull'], cost: 20, d: 'Les dix présences apparaissent brièvement autour du joueur ; deux commandes rapides : marquage de l\'Éclaireur puis frappe du Chasseur. Les dix ne combattent pas ensemble.',
      cast: (P, E) => { nmSpend(P, F, 20); tag(mfx({ life: 1.6, x: P.x, y: P.y, big: 1, passes: ['glow'], upd() { }, draw(m, ctx, cx, cy) { for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 + m.t; ctx.globalAlpha = (1 - m.t / 1.6) * 0.8; shadowDraw(5)(ctx, P.x - cx + Math.cos(a) * 34, P.y - cy + Math.sin(a) * 20, { dir: 1 }, p(), m.t); } ctx.globalAlpha = 1; } }));
        const t = nmTarget(P, E, 260); if (t) { nmMark(P, t, F, 8); later(() => { if (!t.dead) { nmHit(P, t, E, 1.1, { kb: 50 }); sparks(t.x, t.y - 12, rnd(0, 6.28), 8, p()[3]); } }, 350); } gbuff(P, 'nmdix', 6, { mag: 0.1 }); } },
    { n: 'Maître des ombres incarnées', type: 'transformation', role: 'Transformation : manteau d\'ombre', ic: ['skull', 'star'], cost: 40, d: 'Apparence partiellement ombragée, membres et manteau d\'ombre ; les familiers gagnent des ordres de suivi : chaque coup d\'arme appelle une frappe d\'ombre.',
      cast: (P, E) => { const k = nmSpend(P, F, 40); nmTransform(P, F, 'dixombres', k < 1 ? 13 : 22); } },
  ], { n: 'Le Dixième Serment', type: 'ultime', role: 'Chorégraphie des dix puis convergence', ic: ['skull', 'star'], boss: 'dégâts successifs puis convergence ; aucun contrôle',
    d: 'Les dix créatures apparaissent tour à tour et exécutent leur rôle, puis convergent en une manifestation colossale sur la cible principale. Elles sont ensuite toutes en récupération (60 s).',
    cast: (P, E) => { const t = nmTarget(P, E, 280); const cx0 = t ? t.x : E.tx, cy0 = t ? t.y : E.ty; sfx(F + '_u'); flashScreen('#000000', 0.4);
      ROLES.forEach((r, i) => later(() => { const a = i / 10 * 6.28, x = cx0 + Math.cos(a) * 60, y = cy0 + Math.sin(a) * 36; num(x, y - 30, r, p()[4]); nmAoe(P, (x + cx0) / 2, (y + cy0) / 2, 40, E, 0.55, { kb: 30 }); tag(mfx({ life: 0.5, x, y, big: 1, passes: ['glow'], upd() { }, draw(m, ctx, cx, cy) { ctx.globalAlpha = 1 - m.t / 0.5; shadowDraw(7)(ctx, x - cx + (cx0 - x) * m.t * 1.6, y - cy + (cy0 - y) * m.t * 1.6, { dir: x < cx0 ? 1 : -1 }, p(), m.t); ctx.globalAlpha = 1; } })); }, i * 200));
      later(() => { NK.delayed({ at: () => ({ x: cx0, y: cy0 }), r: 72, delay: 0.6, mult: 4.0, kb: 200, shk: 12 })(P, E); for (const s of NM.sh) s.down = G.t + 60; }, 2100); } });
})();

// ---------------------------------------------------------------- 6. ARSENAL DU ROI DÉCHU
(function () {
  const F = 'arsenal', p = () => PALS[F];
  NM.decree = 'assaut';
  const DEC = { assaut: 'Assaut', garde: 'Garde', poursuite: 'Poursuite' };
  const dk = () => NM.decree === 'assaut' ? 1.25 : 1;
  const inZone = (z, P) => z && z.t > G.t && dist(P.x, P.y, z.x, z.y) < z.r;
  const relic = (name) => { NM.lastRelic = { name, t: G.t + 4 }; };
  const blade = (r, arc, mult) => NK.cone({ r, arc, mult, kb: 150, draw(ctx, x, y, m, q, z) { const a0 = z.a - z.arc / 2 + z.arc * cap01(z.k * 2.2), L = z.r; ctx.globalAlpha = 1 - z.k; pxLine(ctx, x, y, x + Math.cos(a0) * L, y + Math.sin(a0) * L * 0.6, q[2], 6); pxLine(ctx, x, y, x + Math.cos(a0) * L, y + Math.sin(a0) * L * 0.6, q[4], 2); NMD.arc(ctx, x, y, L, z.a, z.arc, q, z.k); ctx.globalAlpha = 1; } });
  NM.tickArsenal = (dt) => { const P = G.player; if (!P) return; if (inZone(NM.throne, P)) { for (const k of ['s1', 's2', 's3', 's5', 'm2']) if (P.cd[k] > 0 && (k === 'm2' ? P.magic2 : P.magic) === F) P.cd[k] = Math.max(0, P.cd[k] - dt); }
    if (inZone(NM.sceptre, P)) gbuff(P, 'nmsceptre', 0.4, { atk: 0.12, poise: true }); if (inZone(NM.banner, P)) gbuff(P, 'nmbanner', 0.4, { atk: 0.2, mag: 0.2 });
    const b = NM.banner; if (b && b.t > G.t) { const n = near(b.x, b.y, 26).length; b.hp -= n * dt; if (b.hp <= 0) { b.t = 0; toast('La bannière est tombée', p()[3]); ring(b.x, b.y, 30, p()[3], 0.4, 3); } } };
  { const t0 = NM.tick; NM.tick = function (dt) { t0(dt); if (nmFams(G.player || {}).includes(F)) NM.tickArsenal(dt); }; }
  const zoneVis = (key, col) => (P, E, z) => mfx({ life: z.dur, x: z.x, y: z.y, big: 1, passes: ['ground', 'glow'], upd(m) { if (!NM[key] || NM[key] !== z || z.t <= G.t) m.dead = true; }, draw(m, ctx, cx, cy, pass) { const q = p(); if (pass === 'ground') NMD.disc(ctx, z.x - cx, z.y - cy, z.r, q, 0.18); else { ctx.fillStyle = q[col]; ctx.fillRect(Math.round(z.x - cx - 1), Math.round(z.y - cy - 26), 3, 26); ctx.fillStyle = q[4]; ctx.fillRect(Math.round(z.x - cx - 3), Math.round(z.y - cy - 30), 7, 5); } } });
  const chainPull = (P, E, mult, then) => { const t = nmTarget(P, E, 200); if (!t) { toast('Aucune cible pour la chaîne', p()[3]); return null; } sfx(F + '_c');
    mfx({ life: 0.35, x: t.x, y: t.y, big: 1, passes: ['glow'], upd() { }, draw(m, ctx, cx, cy) { ctx.globalAlpha = 1 - m.t / 0.35; for (let i = 0; i <= 8; i++) { const u = i / 8; ctx.fillStyle = i % 2 ? p()[3] : p()[2]; ctx.fillRect(Math.round(P.x - cx + (t.x - P.x) * u - 1), Math.round(P.y - cy - 10 + (t.y - P.y) * u - 1), 3, 3); } ctx.globalAlpha = 1; } });
    later(() => { if (t.dead) return; nmHit(P, t, E, mult, { kb: 0 }); if (nmIsBig(t)) { nmCtl(P, t, 'weak', F); num(t.x, t.y - 30, 'Déséquilibré', p()[4]); } else { const a = Math.atan2(P.y - t.y, P.x - t.x), d = Math.max(0, dist(P.x, P.y, t.x, t.y) - 30); let s = d; while (s > 6 && !lineClear(t.x, t.y, t.x + Math.cos(a) * s, t.y + Math.sin(a) * s)) s -= 6; t.x += Math.cos(a) * s; t.y += Math.sin(a) * s; } if (then) then(t); }, 150); return t; };
  const hammer = (P, E, x, y, mult, delay) => NK.delayed({ at: () => ({ x, y }), r: 42, delay: delay || 0.8, mult, kb: 140, shk: 9, onHit: (P2, E2, m) => { for (const e of near(m.x, m.y, 42)) if (nmIsBig(e) || e.guard || e.def.shield) nmHit(P2, e, E2, mult * 0.5, { kb: 0 }); } })(P, E);
  NMFAM(F, [
    { n: 'Décret de la Lame jurée', type: 'offensive', role: 'Grande lame-relique, arc unique', ic: ['sword'], gain: 8, d: 'Une grande lame-relique apparaît pour une frappe unique en arc frontal, puis disparaît (elle n\'orbite pas).',
      cast: (P, E) => { relic('lame'); blade(80, 1.9, 1.3 * dk())(P, E); } },
    { n: 'Sceptre de commandement', type: 'utilitaire', role: 'Zone de commandement', ic: ['column', 'star'], gain: 6, d: 'Un sceptre planté crée une zone : les attaques du joueur y gagnent en stabilité et en force.',
      cast: (P, E) => { relic('sceptre'); const z = NM.sceptre = { x: P.x, y: P.y, r: 80, dur: 8, t: G.t + 8 }; zoneVis('sceptre', 3)(P, E, z); sfx(F + '_c'); } },
    { n: 'Égide du trône brisé', type: 'défensive', role: 'Panneau bloquant', ic: ['shield'], d: 'Un panneau-relique bloque une attaque frontale importante et arrête les projectiles, puis se fissure et doit récupérer (décret Garde : deux blocages).',
      cast: (P, E) => { relic('egide'); nmGuard(P, { n: NM.decree === 'garde' ? 2 : 1, a: () => P.aim, arc: 1.4, red: 1, dur: 6, col: p()[3], onBreak: (P2) => { ring(P2.x + Math.cos(P2.aim) * 18, P2.y + Math.sin(P2.aim) * 10, 16, p()[3], 0.3, 3); toast('Égide fissurée', p()[3]); } }); NK.buff({ dur: 6, key: 'egide', gb: {}, deflect: 28, draw(ctx, x, y, P2, q, z) { const a = P2.aim; ctx.globalAlpha = z.k; ctx.fillStyle = q[2]; ctx.fillRect(Math.round(x + Math.cos(a) * 16 - 5), Math.round(y + Math.sin(a) * 9 - 24), 10, 18); ctx.fillStyle = q[4]; ctx.fillRect(Math.round(x + Math.cos(a) * 16 - 1), Math.round(y + Math.sin(a) * 9 - 20), 2, 10); ctx.globalAlpha = 1; } })(P, E); } },
    { n: 'Chaînes du régent', type: 'utilitaire', role: 'Tire une cible légère', ic: ['chain'], gain: 5, d: 'Une chaîne-relique accroche une cible légère et la tire vers le joueur ; les ennemis lourds sont seulement déséquilibrés.',
      cast: (P, E) => { relic('chaines'); chainPull(P, E, NM.decree === 'poursuite' ? 0.9 : 0.6); } },
    { n: 'Bannière des légions perdues', type: 'utilitaire', role: 'Renfort de zone, destructible', ic: ['column', 'heart'], d: 'Une bannière renforce les attaques du joueur dans son rayon ; elle peut être abattue par les ennemis et ne crée aucun soldat.',
      cast: (P, E) => { relic('banniere'); const z = NM.banner = { x: P.x, y: P.y, r: 90, dur: 10, t: G.t + 10, hp: 3 }; zoneVis('banner', 2)(P, E, z); sfx(F + '_c'); } },
    { n: 'Clé des salles scellées', type: 'utilitaire', role: 'Expose une défense', ic: ['gear'], gain: 4, d: 'Une clé-relique projetée expose brièvement une défense mécanique en combat (vulnérabilité). Ouverture de verrous : aucun verrou magique dans le monde actuel, à relier.',
      cast: NK.proj({ spd: 360, life: 0.7, r: 8, look: 'bolt', mult: 0.5, onHit: (P, e, E) => { nmCtl(P, e, 'vuln', F); num(e.x, e.y - 30, 'Défense exposée', p()[4]); } }) },
    { n: 'Couronne d\'autorité', type: 'utilitaire', role: 'Décret : assaut / garde / poursuite', ic: ['star', 'sun'], d: 'Active un décret (cycle : assaut → garde → poursuite) ; les outils royaux suivants reçoivent la variante correspondante.',
      cast: (P, E) => { const order = ['assaut', 'garde', 'poursuite']; NM.decree = order[(order.indexOf(NM.decree) + 1) % 3]; const g = { assaut: { atk: 0.12 }, garde: { dr: 0.15 }, poursuite: { spd: 0.15 } }[NM.decree]; gbuff(P, 'nmdecret', 12, g); toast('Décret : ' + DEC[NM.decree], p()[3]); ring(P.x, P.y, 30, p()[3], 0.4, 3); nmGain(P, F, 6); } },
    { n: 'Marteau du jugement royal', type: 'offensive', role: 'Coup lent, brise-garde', ic: ['fist', 'star'], cost: 15, d: 'Un marteau-relique massif frappe un point : lent, annoncé, très puissant contre les gardes et les ennemis lourds.',
      cast: (P, E) => { relic('marteau'); const k = nmSpend(P, F, 15); hammer(P, E, E.tx, E.ty, 2.3 * k * dk()); } },
    { n: 'Ordre de succession', type: 'offensive', role: 'Chaîne puis marteau', ic: ['chain', 'fist'], cost: 30, d: 'Enchaîne deux reliques dans l\'ordre : la chaîne attire, puis le marteau frappe le point où la cible a été tirée.',
      cast: (P, E) => { const k = nmSpend(P, F, 30); chainPull(P, E, 0.5, (t) => hammer(P, E, t.x, t.y, 2.0 * k * dk(), 0.45)); } },
    { n: 'Salle du trône éphémère', type: 'utilitaire', role: 'Arène : rappel accéléré', ic: ['column', 'column'], cost: 35, d: 'Une architecture royale spectrale délimite une arène : à l\'intérieur, les reliques se rechargent deux fois plus vite. Aucun contrôle sur les ennemis.',
      cast: (P, E) => { const k = nmSpend(P, F, 35); const z = NM.throne = { x: P.x, y: P.y, r: 120, dur: k < 1 ? 7 : 12, t: G.t + (k < 1 ? 7 : 12) };
        mfx({ life: z.dur, x: z.x, y: z.y, big: 1, passes: ['ground', 'glow'], upd(m) { if (NM.throne !== z) m.dead = true; }, draw(m, ctx, cx, cy, pass) { const q = p(); if (pass === 'ground') { NMD.disc(ctx, z.x - cx, z.y - cy, z.r, q, 0.12); return; } for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28, x = z.x - cx + Math.cos(a) * z.r, y = z.y - cy + Math.sin(a) * z.r * 0.55; ctx.globalAlpha = 0.6; ctx.fillStyle = q[3]; ctx.fillRect(Math.round(x - 2), Math.round(y - 34), 4, 34); ctx.globalAlpha = 1; } } }); sfx(F + '_u'); } },
  ], { n: 'Testament du Roi déchu', type: 'ultime', role: 'Ouverture, condamnation, jugement', ic: ['sword', 'star'], boss: 'chaîne : déséquilibre seulement ; jugement : dégâts complets',
    d: 'Trois reliques exécutent une séquence : ouverture (chaînes), condamnation (lames), jugement (marteau). Le décret actif modifie réellement l\'ultime : Assaut = dégâts, Garde = égide pour le joueur, Poursuite = zone élargie et marques.',
    cast: (P, E) => { const d = NM.decree, cx0 = E.tx, cy0 = E.ty; sfx(F + '_u'); flashScreen(p()[3], 0.3); toast('Testament — décret ' + DEC[d], p()[3]);
      for (const e of near(P.x, P.y, 160)) { if (!nmIsBig(e)) pushE(e, cx0, cy0, -260); else nmCtl(P, e, 'weak', F); }
      for (let i = 0; i < 6; i++) later(() => { const a = rnd(0, 6.28), x = cx0 + Math.cos(a) * rnd(0, 60), y = cy0 + Math.sin(a) * rnd(0, 36); nmAoe(P, x, y, 30, E, 0.7 * (d === 'assaut' ? 1.3 : 1), { kb: 40, st: d === 'poursuite' ? 'vuln' : null }); ring(x, y, 30, p()[3], 0.25, 2); }, 300 + i * 120);
      if (d === 'garde') nmGuard(P, { n: 3, a: null, red: 1, dur: 6, col: p()[3] });
      later(() => hammer(P, E, cx0, cy0, (d === 'assaut' ? 4.4 : 3.6), 0.6), 1100); later(() => { if (d === 'poursuite') nmAoe(P, cx0, cy0, 110, E, 0.9, { kb: 80 }); }, 1800); } });
})();
