'use strict';
// =====================================================================
//  NOUVELLES MAGIES — familles 7 à 12 : Architecte des structures, Manipulation de l'Énergie, Art de la Découpe,
//  Sceau de Possession, Dragon divin, Léviathan. Valeurs : prototypage, configurables.
// =====================================================================

// ---------------------------------------------------------------- 7. ARCHITECTE DES STRUCTURES
(function () {
  const F = 'architecte', p = () => PALS[F];
  NM.builds = []; const MAXB = 6;
  // une construction : { kind, x0, y0, x1, y1 (segment) | x, y, r (poteau), hp, t, solid, proj (bloque les tirs), span (franchissement) }
  const build = (b) => { b.t = G.t + (b.dur || 12); b.hp = b.hp || 5; b.hp0 = b.hp; NM.builds.push(b); if (NM.builds.length > MAXB) { const o = NM.builds.shift(); o.t = 0; } if (b.span) NM.spans.push(b); sfx(F + '_c'); ring(b.x ?? (b.x0 + b.x1) / 2, b.y ?? (b.y0 + b.y1) / 2, 18, p()[3], 0.3, 2); NM.built = (NM.built || 0) + 1; return b; };
  const segD = (b, x, y) => { const L = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) || 1, u = clamp(((x - b.x0) * (b.x1 - b.x0) + (y - b.y0) * (b.y1 - b.y0)) / (L * L), 0, 1); return { d: dist(x, y, b.x0 + (b.x1 - b.x0) * u, b.y0 + (b.y1 - b.y0) * u), px: b.x0 + (b.x1 - b.x0) * u, py: b.y0 + (b.y1 - b.y0) * u }; };
  const wallAt = (x, y, a, len, o) => build(Object.assign({ kind: 'rempart', x0: x - Math.cos(a) * len / 2, y0: y - Math.sin(a) * len / 2, x1: x + Math.cos(a) * len / 2, y1: y + Math.sin(a) * len / 2, solid: 1, proj: 1, hp: 6, dur: 12 }, o));
  const spanAt = (P, len, o) => { const a = P.aim; return build(Object.assign({ kind: 'passerelle', x0: P.x + Math.cos(a) * 10, y0: P.y + Math.sin(a) * 10, x1: P.x + Math.cos(a) * (10 + len), y1: P.y + Math.sin(a) * (10 + len), span: 1, hp: 8, dur: 14 }, o)); };
  const ptAt = (P, E, max) => { const d = Math.min(max, dist(P.x, P.y, E.tx, E.ty)); return { x: P.x + Math.cos(E.a) * d, y: P.y + Math.sin(E.a) * d }; };
  NM.tickBuilds = (dt) => {
    const P = G.player;
    for (const b of NM.builds) { if (b.t <= G.t) continue;
      for (const e of G.enemies) { if (e.dead) continue; const r = (e.def.r || 8) * 0.5 + 6;
        if (b.solid) { if (b.x0 !== undefined) { const q = segD(b, e.x, e.y); if (q.d < r) { const a = Math.atan2(e.y - q.py, e.x - q.px); e.x = q.px + Math.cos(a) * r; e.y = q.py + Math.sin(a) * r; if (nmIsBig(e)) b.hp -= dt * 2.5; } } else if (dist(e.x, e.y, b.x, b.y) < b.r + r) { const a = Math.atan2(e.y - b.y, e.x - b.x); e.x = b.x + Math.cos(a) * (b.r + r); e.y = b.y + Math.sin(a) * (b.r + r); if (nmIsBig(e)) b.hp -= dt * 2.5; } }
        if (b.span && nmIsBig(e) && segD(b, e.x, e.y).d < 14) b.hp -= dt * (b.load || 2);
        if (b.kind === 'piege' && !b.used && dist(e.x, e.y, b.x, b.y) < 18) { b.used = 1; b.t = G.t + 0.4; const E = { fam: F, base: k => (14 + P.st8.mag * k) / Math.max(1, P.st8.mag) }; sfx(F + '_i'); if (nmIsBig(e)) { nmHit(P, e, E, 0.9, { kb: 0 }); num(e.x, e.y - 30, 'Déséquilibre', p()[4]); } else { nmHit(P, e, E, 0.8, { kb: 40 }); e.nmAir = G.t + 0.7; e.rootT = Math.max(e.rootT || 0, 0.7); } ring(b.x, b.y, 22, p()[3], 0.3, 3); if (b.chain) { const nx = NM.builds.find(c => c.kind === 'piege' && !c.used && c !== b && dist(c.x, c.y, b.x, b.y) < 70); if (nx) later(() => { for (const e2 of near(nx.x, nx.y, 30)) nmHit(P, e2, E, 0.6, { kb: 60 }); nx.used = 1; nx.t = G.t + 0.4; ring(nx.x, nx.y, 22, p()[3], 0.3, 3); }, 150); } }
      }
      if (b.proj) for (const q of G.projs) if (q.from === 'e' && q.life > 0) { if (b.x0 !== undefined ? segD(b, q.x, q.y).d < 8 : dist(q.x, q.y, b.x, b.y) < b.r + 4) { q.life = 0; b.hp -= 1; sparks(q.x, q.y, rnd(0, 6.28), 4, p()[3]); } }
      if (b.kind === 'tourelle' && b.shots > 0) { b.cd -= dt; if (b.cd <= 0) { let tg = G.enemies.find(e => !e.dead && nmMarked(e, F) && dist(b.x, b.y, e.x, e.y) < 220 && lineClear(b.x, b.y, e.x, e.y)); if (!tg) { let bd = 200; for (const e of G.enemies) if (!e.dead) { const d = dist(b.x, b.y, e.x, e.y); if (d < bd && lineClear(b.x, b.y, e.x, e.y)) { bd = d; tg = e; } } }
          if (tg) { b.cd = 1.2; b.shots--; const E = { fam: F, base: k => (14 + P.st8.mag * k) / Math.max(1, P.st8.mag) }; if (tg.hp > (tg.maxhp || 100) * 0.1) nmHit(P, tg, E, 0.35, { kb: 150 }); else pushE(tg, b.x, b.y, 150); const tx = tg.x, ty = tg.y; mfx({ life: 0.2, x: b.x, y: b.y, big: 1, passes: ['glow'], upd() { }, draw(m, ctx, cx, cy) { ctx.globalAlpha = 1 - m.t / 0.2; NMD.line(ctx, b.x - cx, b.y - cy - 16, tx - cx, ty - cy - 10, p(), 2); ctx.globalAlpha = 1; } }); sfx(F + '_i'); } } }
      if (b.kind === 'bascule' && P && dist(P.x, P.y, b.x, b.y) < 16 && !b.used && G.t > b.arm) { b.used = 1; b.t = G.t + 0.3; const a = b.a; let d = 130; while (d > 10 && (!lineClear(P.x, P.y, P.x + Math.cos(a) * d, P.y + Math.sin(a) * d) || dirSolid(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d))) d -= 10; P.x += Math.cos(a) * d; P.y += Math.sin(a) * d; P.iframes = Math.max(P.iframes, 0.4); sfx(F + '_i'); ring(P.x, P.y, 24, p()[3], 0.3, 2); }
      if (b.kind === 'atelier' && P && dist(P.x, P.y, b.x, b.y) < 34 && !G.enemies.some(e => !e.dead && e.aggro && dist(e.x, e.y, P.x, P.y) < 170)) { b.rep = (b.rep || 0) + dt; if (b.rep > 1) { b.rep = 0; let n = 0; for (const k in P.equip) { const i = P.equip[k] && findInst(P, P.equip[k]); const d = i && def(i); if (d && d.durability && i.dur < d.durability) { const add = Math.ceil(d.durability * 0.05); i.dur = Math.min(d.durability, i.dur + add); n++; } } if (n) num(b.x, b.y - 30, 'Réparation', p()[4]); b.done = (b.done || 0) + 1; if (b.done >= 5) b.t = G.t; } }
      if (b.hp <= 0) { b.t = 0; ring(b.x ?? (b.x0 + b.x1) / 2, b.y ?? (b.y0 + b.y1) / 2, 20, p()[2], 0.3, 2); num(b.x ?? b.x0, b.y ?? b.y0, 'Ouvrage détruit', p()[3]); }
    }
    NM.builds = NM.builds.filter(b => b.t > G.t); NM.spans = NM.spans.filter(b => b.t > G.t);
  };
  { const t0 = NM.tick; NM.tick = function (dt) { t0(dt); if (NM.builds.length) NM.tickBuilds(dt); }; }
  { const dm = drawMfx; drawMfx = function (ctx, cx, cy, pass) { dm(ctx, cx, cy, pass); if (!NM.builds.length || (pass !== 'ground' && pass !== 'glow')) return; const q = p();
      for (const b of NM.builds) { const fade = cap01((b.t - G.t) / 0.6); ctx.globalAlpha = 0.9 * fade;
        if (b.x0 !== undefined) { if (pass === 'ground' && b.span) { const a = Math.atan2(b.y1 - b.y0, b.x1 - b.x0), nx = -Math.sin(a) * 9, ny = Math.cos(a) * 9; ctx.fillStyle = q[2]; ctx.beginPath(); ctx.moveTo(b.x0 - cx + nx, b.y0 - cy + ny); ctx.lineTo(b.x1 - cx + nx, b.y1 - cy + ny); ctx.lineTo(b.x1 - cx - nx, b.y1 - cy - ny); ctx.lineTo(b.x0 - cx - nx, b.y0 - cy - ny); ctx.fill(); ctx.strokeStyle = q[1]; ctx.lineWidth = 1; for (let u = 0; u <= 1; u += 0.12) { const x = b.x0 + (b.x1 - b.x0) * u - cx, y = b.y0 + (b.y1 - b.y0) * u - cy; ctx.beginPath(); ctx.moveTo(x + nx, y + ny); ctx.lineTo(x - nx, y - ny); ctx.stroke(); } }
          else if (pass === 'glow' && b.solid) { pxLine(ctx, b.x0 - cx, b.y0 - cy - 6, b.x1 - cx, b.y1 - cy - 6, q[1], 12); pxLine(ctx, b.x0 - cx, b.y0 - cy - 12, b.x1 - cx, b.y1 - cy - 12, q[3], 3); } }
        else if (pass === 'glow') { const x = b.x - cx, y = b.y - cy; ctx.fillStyle = q[1]; if (b.kind === 'pilier') { ctx.fillRect(Math.round(x - 5), Math.round(y - 30), 10, 30); ctx.fillStyle = q[3]; ctx.fillRect(Math.round(x - 6), Math.round(y - 32), 12, 3); } else if (b.kind === 'tourelle') { ctx.fillRect(Math.round(x - 6), Math.round(y - 12), 12, 12); ctx.fillStyle = q[3]; ctx.fillRect(Math.round(x - 2), Math.round(y - 18), 4, 6); } else if (b.kind === 'atelier') { ctx.fillRect(Math.round(x - 10), Math.round(y - 10), 20, 10); ctx.fillStyle = q[4]; ctx.fillRect(Math.round(x - 2), Math.round(y - 14), 4, 4); } else { ctx.strokeStyle = q[3]; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, b.kind === 'bascule' ? 14 : 9, b.kind === 'bascule' ? 7 : 5, 0, 0, 7); ctx.stroke(); } }
        ctx.globalAlpha = 1; } }; }
  NM.plan = 0; const PLANS = ['Piège en chaîne', 'Double passerelle', 'Rempart à angle'];
  NMFAM(F, [
    { n: 'Planche de franchissement', type: 'mobilité', role: 'Passerelle courte (franchit l\'eau étroite)', ic: ['column', 'chain'], cost: 10, d: 'Déploie une courte passerelle devant le joueur ; elle permet de franchir un vide ou une eau étroite. Collision : praticable pour tous, ennemis compris.',
      cast: (P, E) => { const k = nmSpend(P, F, 10); spanAt(P, k < 1 ? 50 : 72, { dur: 14 }); } },
    { n: 'Pilier d\'appui', type: 'défensive', role: 'Couvert étroit', ic: ['column'], cost: 12, d: 'Construit un support vertical : couvert étroit qui arrête les ennemis et les tirs ; il ne soulève pas le terrain.',
      cast: (P, E) => { nmSpend(P, F, 12); const q = ptAt(P, E, 70); if (dirSolid(q.x, q.y)) return; build({ kind: 'pilier', x: q.x, y: q.y, r: 9, solid: 1, proj: 1, hp: 5, dur: 14 }); } },
    { n: 'Piège à ressort', type: 'utilitaire', role: 'Mécanisme projetant', ic: ['gear', 'meteor'], cost: 10, d: 'Mécanisme qui se déclenche au passage d\'un ennemi et le projette légèrement en l\'air ; les boss subissent une frappe et un léger déséquilibre.',
      cast: (P, E) => { nmSpend(P, F, 10); const q = ptAt(P, E, 110); if (dirSolid(q.x, q.y)) return; build({ kind: 'piege', x: q.x, y: q.y, r: 8, hp: 3, dur: 20 }); } },
    { n: 'Rempart modulaire', type: 'défensive', role: 'Couvert bas orientable', ic: ['shield', 'column'], cost: 18, d: 'Couvert bas orienté face à la visée : arrête les projectiles et les ennemis ; les attaques lourdes l\'usent.',
      cast: (P, E) => { const k = nmSpend(P, F, 18); const x = P.x + Math.cos(P.aim) * 30, y = P.y + Math.sin(P.aim) * 20; wallAt(x, y, P.aim + Math.PI / 2, 60, { hp: k < 1 ? 3 : 6 }); } },
    { n: 'Treuil de rappel', type: 'mobilité', role: 'Se hisser ou tirer un objet léger', ic: ['chain', 'gear'], mob: true, cost: 8, d: 'Installe un treuil vers un point d\'ancrage dégagé : le joueur s\'y hisse, ou tire un ennemi léger visé. Ne traverse ni mur ni zone interdite.',
      cast: (P, E) => { const t = E.t && !E.t.dead && dist(P.x, P.y, E.t.x, E.t.y) < 170 ? E.t : null; nmSpend(P, F, 8);
        if (t && !nmIsBig(t)) { const a = Math.atan2(P.y - t.y, P.x - t.x); let s = dist(P.x, P.y, t.x, t.y) - 24; while (s > 6 && !lineClear(t.x, t.y, t.x + Math.cos(a) * s, t.y + Math.sin(a) * s)) s -= 6; t.x += Math.cos(a) * s; t.y += Math.sin(a) * s; sfx(F + '_i'); return; }
        const q = ptAt(P, E, 160); if (!lineClear(P.x, P.y, q.x, q.y) || dirSolid(q.x, q.y)) { toast('Aucun ancrage valide', p()[3]); return; } const sx = P.x, sy = P.y; P.iframes = Math.max(P.iframes, 0.3);
        mfx({ life: 0.45, x: sx, y: sy, big: 1, passes: ['glow'], upd(m, dt) { if (m.t < 0.3) moveBody(P, (q.x - sx) * dt / 0.3, (q.y - sy) * dt / 0.3); }, draw(m, ctx, cx, cy) { NMD.line(ctx, P.x - cx, P.y - cy - 10, q.x - cx, q.y - cy - 4, p(), 1); } }); } },
    { n: 'Plateforme à bascule', type: 'mobilité', role: 'Lanceur pivotant', ic: ['gear', 'wings'], cost: 12, d: 'Plateforme pivotante orientée vers la visée : marcher dessus lance le joueur vers un point proche dégagé.',
      cast: (P, E) => { nmSpend(P, F, 12); const x = P.x + Math.cos(P.aim) * 26, y = P.y + Math.sin(P.aim) * 16; if (dirSolid(x, y)) return; build({ kind: 'bascule', x, y, r: 12, a: P.aim, arm: G.t + 0.2, hp: 4, dur: 15 }); } },
    { n: 'Tourelle à impulsion', type: 'offensive', role: 'Tirs cinétiques non létaux', ic: ['gear', 'bolt'], cost: 20, d: 'Tourelle qui tire des impulsions cinétiques sur la cible marquée (ou la plus proche) : tir lent, ligne de vue requise, 6 tirs. Elle repousse sans achever.',
      cast: (P, E) => { nmSpend(P, F, 20); if (E.t) nmMark(P, E.t, F, 12); const q = ptAt(P, E, 40); build({ kind: 'tourelle', x: q.x, y: q.y, r: 8, solid: 1, hp: 4, dur: 14, shots: 6, cd: 0.4 }); } },
    { n: 'Pont de liaison', type: 'mobilité', role: 'Pont long à charge limitée', ic: ['column', 'column'], cost: 22, d: 'Relie deux points plus éloignés que la passerelle ; durée et charge limitées : les ennemis lourds le font céder.',
      cast: (P, E) => { const k = nmSpend(P, F, 22); spanAt(P, k < 1 ? 90 : 150, { kind: 'pont', hp: 6, load: 3, dur: 16 }); } },
    { n: 'Atelier instantané', type: 'utilitaire', role: 'Réparation hors combat', ic: ['gear', 'heart'], cost: 25, d: 'Station temporaire qui restaure une part de la durabilité de l\'équipement porté, seulement hors d\'un échange intense. Ne soigne pas.',
      cast: (P, E) => { nmSpend(P, F, 25); build({ kind: 'atelier', x: P.x + 18, y: P.y, r: 10, hp: 3, dur: 20 }); if (!SET.durability) toast('Durabilité désactivée dans les options : rien à réparer', p()[3]); } },
    { n: 'Maître bâtisseur', type: 'utilitaire', role: 'Plan avancé (cycle)', ic: ['gear', 'star'], cost: 30, d: 'Construit le plan avancé sélectionné : piège en chaîne, double passerelle ou rempart à angle. Le plan suivant est annoncé après chaque construction (sélection par cycle).',
      cast: (P, E) => { const k = nmSpend(P, F, 30); const pl = NM.plan % 3; NM.plan++; toast(PLANS[pl] + ' — prochain plan : ' + PLANS[NM.plan % 3], p()[3]); const a = P.aim;
        if (pl === 0) for (let i = 0; i < 3; i++) { const x = P.x + Math.cos(a) * (40 + i * 30), y = P.y + Math.sin(a) * (40 + i * 30); if (!dirSolid(x, y)) build({ kind: 'piege', x, y, r: 8, hp: 3, dur: 20, chain: 1 }); }
        else if (pl === 1) { spanAt(P, 80); const o = P.aim; P.aim = o + 0.5; spanAt(P, 80); P.aim = o; }
        else { const x = P.x + Math.cos(a) * 30, y = P.y + Math.sin(a) * 20; wallAt(x + Math.cos(a + 1.2) * 16, y + Math.sin(a + 1.2) * 10, a + 0.6, 44, { hp: k < 1 ? 4 : 7 }); wallAt(x + Math.cos(a - 1.2) * 16, y + Math.sin(a - 1.2) * 10, a - 0.6, 44, { hp: k < 1 ? 4 : 7 }); } } },
  ], { n: 'Citadelle en un souffle', type: 'ultime', role: 'Deux remparts, passerelle, lanceur', ic: ['column', 'star'], boss: 'destructible, ne piège pas les boss',
    d: 'Construit en séquence une petite citadelle temporaire : deux remparts, une passerelle et un dispositif de lancement ; avantage de positionnement, destructible.',
    cast: (P, E) => { const a = P.aim, x = P.x, y = P.y; sfx(F + '_u');
      later(() => wallAt(x + Math.cos(a) * 40, y + Math.sin(a) * 24, a + Math.PI / 2, 70, { hp: 9, dur: 18 }), 0);
      later(() => wallAt(x + Math.cos(a + 1.4) * 40, y + Math.sin(a + 1.4) * 24, a + 1.4 + Math.PI / 2, 60, { hp: 9, dur: 18 }), 250);
      later(() => { const o = P.aim; P.aim = a - 1.4; spanAt(P, 90, { dur: 18 }); P.aim = o; }, 500);
      later(() => build({ kind: 'bascule', x: x - Math.cos(a) * 20, y: y - Math.sin(a) * 12, r: 12, a, arm: G.t + 0.3, hp: 6, dur: 18 }), 750);
      later(() => { nmAoe(P, x + Math.cos(a) * 60, y + Math.sin(a) * 36, 50, E, 1.4, { kb: 160 }); shake(6); }, 800); } });
})();

// ---------------------------------------------------------------- 8. MANIPULATION DE L'ÉNERGIE
(function () {
  const F = 'energie', p = () => PALS[F];
  const take = (P, n) => { const v = Math.min(nmRes(P, F), n); nmSet(P, F, nmRes(P, F) - v); return v; };
  NM.orbs = 0; NM.efield = null;
  { const dm = drawMfx; drawMfx = function (ctx, cx, cy, pass) { dm(ctx, cx, cy, pass); const P = G.player; if (pass !== 'glow' || !P || !NM.orbs) return; for (let i = 0; i < NM.orbs; i++) { const a = P.aim + Math.PI + (i - (NM.orbs - 1) / 2) * 0.9; NMD.orb(ctx, P.x - cx + Math.cos(a) * 18, P.y - cy - 16 + Math.sin(a) * 8, 3.5, p(), G.t); } }; }
  const inField = (P) => NM.efield && NM.efield.t > G.t && dist(P.x, P.y, NM.efield.x, NM.efield.y) < NM.efield.r;
  NM.emode = 0;
  NM.after[F] = (P, E, s) => { if (!inField(P) || s.id.endsWith('-09')) return; const m = NM.emode++ % 3; const E2 = { fam: F, base: E.base, a: P.aim, tx: E.tx, ty: E.ty, t: E.t };
    later(() => { if (m === 0) NK.nova({ r: 46, hitM: 0.4, kb: 110 })(P, E2); else if (m === 1) NK.zone({ r: 50, delay: 0.15, dur: 1.2, tick: 0.4, mult: 0.25 })(P, E2); else NK.beam({ len: 150, w: 6, dur: 0.35, mult: 0.25, delay: 0.05 })(P, E2); }, 200); };
  NMFAM(F, [
    { n: 'Impulsion énergétique', type: 'utilitaire', role: 'Impulsion neutre qui repousse', ic: ['wave', 'orb'], gain: 4, d: 'Impulsion neutre courte qui repousse légèrement et ouvre un espace ; sa force dépend de la réserve dépensée (jusqu\'à 15).',
      cast: (P, E) => { const v = take(P, 15); NK.nova({ r: 48 + v, hitM: 0.45 + v / 40, kb: 120 + v * 8 })(P, E); } },
    { n: 'Sphère de condensation', type: 'offensive', role: 'Sphère lente et dense', ic: ['orb'], d: 'Compresse la réserve dans une sphère lente et dense ; plus la réserve dépensée est grande (jusqu\'à 30), plus elle frappe fort. Elle n\'aspire pas les ennemis. (Maintien de la touche : à prototyper.)',
      cast: (P, E) => { const v = take(P, 30); NK.proj({ spd: 150, life: 1.6, r: 12 + v / 5, mult: 0.9 + v / 18, boom: 40 + v, boomM: 0.4 + v / 50, look: 'orb', kb: 80 })(P, E); } },
    { n: 'Rayon concentré', type: 'offensive', role: 'Faisceau : précis à l\'arrêt', ic: ['bolt', 'eye'], cost: 12, d: 'Faisceau continu de courte durée : plus précis et puissant si le joueur reste immobile ; bouger le disperse et réduit les dégâts.',
      cast: (P, E) => { nmSpend(P, F, 12); const st = { k: 1, x: P.x, y: P.y }; const E2 = Object.assign({}, E, { base: (x) => E.base(x) * st.k }); NK.beam({ len: 210, w: 8, dur: 1.2, mult: 0.4, tick: 0.12, track: 1, upd: (P2, E3, b, dt) => { const mv = dist(P2.x, P2.y, st.x, st.y) > 2; st.x = P2.x; st.y = P2.y; st.k = mv ? Math.max(0.4, st.k - dt * 3) : Math.min(1.4, st.k + dt * 0.8); } })(P, E2); } },
    { n: 'Onde de libération', type: 'offensive', role: 'Onde circulaire de toute la réserve', ic: ['ring', 'wave'], d: 'Déploie toute l\'énergie accumulée en une onde circulaire : plus la réserve est élevée, plus l\'onde est large. Ne vole aucune ressource.',
      cast: (P, E) => { const v = take(P, 100); NK.nova({ r: 40 + v * 1.2, hitM: 0.5 + v / 45, kb: 100 + v * 2, shk: 3 + v / 20, rings: 4 })(P, E); num(P.x, P.y - 44, 'Réserve ' + Math.round(v), p()[4]); } },
    { n: 'Pas énergétique', type: 'mobilité', role: 'Propulsion instantanée', ic: ['wings', 'bolt'], mob: true, cost: 10, d: 'Convertit de la réserve en propulsion dans une direction ; pas une téléportation, les obstacles arrêtent le mouvement.',
      cast: (P, E) => { const k = nmSpend(P, F, 10); NK.dash({ dist: k < 1 ? 70 : 110, dur: 0.14, mult: 0.3 })(P, E); } },
    { n: 'Renforcement du noyau', type: 'défensive', role: 'Vitesse d\'action et stabilité', ic: ['heart', 'orb'], cost: 18, d: 'Distribue l\'énergie dans les muscles et les nerfs : vitesse et stabilité accrues pendant 8 s, sans augmenter les dégâts des magies.',
      cast: (P, E) => { const k = nmSpend(P, F, 18); NK.buff({ dur: k < 1 ? 5 : 8, key: 'noyau', gb: { spd: 0.2, dr: 0.12, poise: true } })(P, E); } },
    { n: 'Orbes orbitaux', type: 'offensive', role: 'Jusqu\'à trois noyaux tirés sur commande', ic: ['orb', 'ring'], cost: 8, cd: 1.2, mp: 8, d: 'Crée un noyau en formation fixe autour du joueur (jusqu\'à 3). Avec trois noyaux, chaque lancement en tire un sur la cible. Ils ne frappent jamais seuls.',
      cast: (P, E) => { if (NM.orbs < 3) { nmSpend(P, F, 8); NM.orbs++; ring(P.x, P.y, 20, p()[3], 0.3, 2); num(P.x, P.y - 40, 'Noyaux ' + NM.orbs + '/3', p()[4]); return; } NM.orbs--; NK.proj({ spd: 420, life: 0.8, r: 8, mult: 1.1, homing: 3, look: 'orb', kb: 70 })(P, E); } },
    { n: 'Compression absolue', type: 'offensive', role: 'Impact ponctuel très dense', ic: ['spiral', 'orb'], cost: 25, d: 'Compresse un petit volume d\'énergie jusqu\'à un état très dense puis le relâche : très fort sur une cible unique, zone minime.',
      cast: (P, E) => { const k = nmSpend(P, F, 25); NK.delayed({ r: 20, delay: 0.5, mult: 3.0 * k, kb: 150, shk: 6 })(P, E); } },
    { n: 'Champ de maîtrise', type: 'utilitaire', role: 'Modulation des attaques', ic: ['ring', 'star'], cost: 25, d: 'Champ stable : dans ce champ, chaque compétence d\'énergie est prolongée par une forme modulée (impulsion, nappe ou faisceau, en cycle). Ne ralentit pas le temps, ne bloque pas les tirs.',
      cast: (P, E) => { const k = nmSpend(P, F, 25); const z = NM.efield = { x: P.x, y: P.y, r: 100, t: G.t + (k < 1 ? 6 : 10) }; NK.zone({ where: 'self', r: 100, delay: 0.1, dur: z.t - G.t, mult: 0, tick: 99, rings: 1 })(P, E); } },
    { n: 'Déferlement énergétique', type: 'offensive', role: 'Vagues sur axes alternés', ic: ['wave', 'wave'], d: 'Plusieurs vagues directionnelles sur des axes alternés (avant, gauche, avant, droite) ; chaque vague consomme de la réserve et la série s\'arrête quand la réserve est vide.',
      cast: (P, E) => { const axes = [0, -Math.PI / 2, 0, Math.PI / 2]; axes.forEach((d, i) => later(() => { if (take(P, 8) < 4) { if (i) num(P.x, P.y - 40, 'Réserve épuisée', p()[3]); return; } NK.wave({ spd: 260, len: 180, w: 40, mult: 0.75, kb: 120 })(P, Object.assign({}, E, { a: P.aim + d })); }, i * 220)); } },
  ], { n: 'Cataclysme originel', type: 'ultime', role: 'Noyau suspendu : ligne ou zone', ic: ['sun', 'orb'], boss: 'charge annoncée, interrompue si le joueur est mis à terre',
    d: 'Le joueur rassemble sa réserve en un noyau suspendu puis le libère : focalisée sur une ligne si une cible est verrouillée, radiale sinon (choix explicite : à prototyper). La charge peut être interrompue.',
    cast: (P, E) => { const v = take(P, 100), boost = 1 + v / 100, focus = !!(E.t && !E.t.dead); const hp0 = P.hp; sfx(F + '_u'); toast(focus ? 'Libération focalisée' : 'Libération radiale', p()[3]);
      mfx({ life: 1.2, x: P.x, y: P.y, big: 1, passes: ['glow'], upd(m) { if (P.state === 'dead' || P.hp < hp0 - P.st8.maxhp * 0.25) { m.dead = true; m.broken = 1; toast('Charge interrompue', p()[3]); } }, draw(m, ctx, cx, cy) { NMD.orb(ctx, P.x - cx, P.y - cy - 34, 4 + m.t * 8, p(), m.t); } });
      later(() => { if (P.state === 'dead' || P.hp < hp0 - P.st8.maxhp * 0.25) return; if (focus) NK.beam({ len: 300, w: 18, dur: 1.0, mult: 0.75 * boost, tick: 0.1, track: 0.3, delay: 0.05 })(P, Object.assign({}, E, { a: Math.atan2(E.t.y - P.y, E.t.x - P.x) })); else NK.nova({ r: 170, hitM: 2.4 * boost, kb: 220, shk: 12, rings: 5 })(P, E); flashScreen(p()[4], 0.4); }, 1200); } });
})();

// ---------------------------------------------------------------- 9. ART DE LA DÉCOUPE
(function () {
  const F = 'decoupe', p = () => PALS[F];
  // une ligne de rupture tracée sur une cible ou un point : télégraphe, puis section
  const cutLine = (P, E, x, y, a, len, mult, delay, onHit, follow) => { const q = p(); sfx(F + '_c');
    mfx({ life: delay + 0.3, x, y, big: 1, passes: ['glow'], upd(m) { if (follow && !follow.dead) { m.x = follow.x; m.y = follow.y; } if (!m.on && m.t >= delay) { m.on = 1; sfx(F + '_i'); let n = 0; const c = Math.cos(a), s = Math.sin(a); for (const e of G.enemies) if (!e.dead) { const dx = e.x - m.x, dy = e.y - m.y, u = dx * c + dy * s, v = -dx * s + dy * c; if (Math.abs(u) < len / 2 + e.def.r * 0.4 && Math.abs(v) < 10 + e.def.r * 0.4) { nmHit(P, e, E, mult, { kb: 30, st: 'bleed' }); n++; if (onHit) onHit(e); } } if (n) nmGain(P, F, 6); } },
      draw(m, ctx, cx, cy) { const c = Math.cos(a), s = Math.sin(a), x0 = m.x - cx - c * len / 2, y0 = m.y - cy - 12 - s * len / 2 * 0.6, x1 = m.x - cx + c * len / 2, y1 = m.y - cy - 12 + s * len / 2 * 0.6; if (!m.on) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(m.t * 30); pxLine(ctx, x0, y0, x1, y1, q[3], 1); ctx.globalAlpha = 1; } else { ctx.globalAlpha = 1 - (m.t - delay) / 0.3; pxLine(ctx, x0, y0, x1, y1, q[2], 4); pxLine(ctx, x0, y0, x1, y1, q[4], 1); ctx.globalAlpha = 1; } } }); };
  NM.dcut = null;
  NMFAM(F, [
    { n: 'Trait de rupture', type: 'offensive', role: 'Ligne courte différée', ic: ['blade'], d: 'Trace une ligne courte sur une cible ou une surface ; après un bref délai, la ligne se déclenche en coupure localisée.',
      cast: (P, E) => { const t = nmTarget(P, E, 200); cutLine(P, E, t ? t.x : E.tx, t ? t.y : E.ty, E.a + Math.PI / 2, 36, 1.05, 0.45, (e) => nmMark(P, e, F, 6), t); } },
    { n: 'Coupe adaptative', type: 'offensive', role: 'Ligne adaptée à l\'armure', ic: ['blade', 'eye'], cost: 10, d: 'Analyse une cible marquée et choisit une ligne de rupture adaptée à son angle d\'armure : plus efficace contre les ennemis lourds et marqués, sans traverser les invulnérabilités.',
      cast: (P, E) => { const t = nmTarget(P, E, 200); if (!t) return; const k = nmSpend(P, F, 10) * (nmMarked(t, F) ? 1.3 : 1) * (nmIsBig(t) ? 1.3 : 1); cutLine(P, E, t.x, t.y, Math.atan2(t.y - P.y, t.x - P.x) + (nmIsBig(t) ? 0.6 : 1.57), 40, 1.2 * k, 0.35, (e) => nmCtl(P, e, 'vuln', F), t); } },
    { n: 'Double incision', type: 'offensive', role: 'Deux lignes croisées', ic: ['cross', 'blade'], cost: 8, d: 'Deux lignes croisées sur une cible ; la seconde est plus efficace si la première a touché. (Ordre de déclenchement : fixe pour l\'instant.)',
      cast: (P, E) => { nmSpend(P, F, 8); const t = nmTarget(P, E, 200); if (!t) return; let first = false; cutLine(P, E, t.x, t.y, 0.78, 36, 0.8, 0.35, () => { first = true; }, t); later(() => cutLine(P, E, t.x, t.y, -0.78, 36, first ? 1.3 : 0.8, 0.05, null, t), 450); } },
    { n: 'Arc de section', type: 'offensive', role: 'Arc de rupture frontal', ic: ['blade', 'ring'], gain: 5, d: 'Arc de rupture sur une zone devant le joueur : coupure de surface sur les ennemis traversés.',
      cast: NK.cone({ r: 84, arc: 2.0, mult: 0.75, kb: 40, delay: 0.25, onHit: (P, E, n) => { if (n) nmGain(P, F, 4); } }) },
    { n: 'Quadrillage de rupture', type: 'offensive', role: 'Sections simultanées sur une zone', ic: ['cross', 'cross'], cost: 16, d: 'Quatre lignes quadrillent une petite zone ; le déclenchement sectionne simultanément les cases touchées. Les ennemis peuvent sortir avant l\'activation.',
      cast: (P, E) => { const k = nmSpend(P, F, 16); const x = E.tx, y = E.ty; for (let i = 0; i < 4; i++) cutLine(P, nmK(E, k), x + (i < 2 ? (i - 0.5) * 30 : 0), y + (i >= 2 ? (i - 2.5) * 18 : 0), i < 2 ? Math.PI / 2 : 0, 70, 0.6, 0.85, null); } },
    { n: 'Incision rapprochée', type: 'offensive', role: 'Geste rapide, interrompt', ic: ['blade', 'bolt'], mp: 6, cd: 2, gain: 4, d: 'Ligne à bout portant, très faible coût ; peut interrompre une attaque ordinaire (pas celle d\'un boss).',
      cast: NK.cone({ r: 44, arc: 0.9, mult: 0.7, kb: 30, delay: 0.03, onHit: (P, E) => { for (const e of near(P.x + Math.cos(P.aim) * 26, P.y + Math.sin(P.aim) * 16, 26)) if (!nmIsBig(e)) { e.cd = Math.max(e.cd || 0, 0.8); e.state = e.state === 'windup' ? 'idle' : e.state; } } }) },
    { n: 'Pluie de sections', type: 'offensive', role: 'Trois coupes successives', ic: ['blade', 'needles'], cost: 14, d: 'Marque jusqu\'à trois cibles ; les lignes se déclenchent successivement, de la plus proche à la plus lointaine.',
      cast: (P, E) => { const k = nmSpend(P, F, 14); const ts = G.enemies.filter(e => !e.dead && dist(P.x, P.y, e.x, e.y) < 220).sort((a, b) => dist(P.x, P.y, a.x, a.y) - dist(P.x, P.y, b.x, b.y)).slice(0, 3); ts.forEach((t, i) => cutLine(P, nmK(E, k), t.x, t.y, rnd(0, 3.14), 36, 0.9, 0.3 + i * 0.25, null, t)); } },
    { n: 'Section circulaire', type: 'offensive', role: 'Cercle qui se ferme', ic: ['ring', 'blade'], cost: 14, d: 'Cercle de rupture autour du joueur ; après un délai il se ferme : impact fort en périphérie, faible au centre.',
      cast: (P, E) => { const k = nmSpend(P, F, 14); const x = P.x, y = P.y; NK.delayed({ at: () => ({ x, y }), r: 80, delay: 0.7, mult: 0.35 * k, kb: 20, onHit: (P2, E2) => { for (const e of near(x, y, 82)) if (dist(e.x, e.y, x, y) > 44) nmHit(P2, e, E2, 0.9 * k, { kb: 60, st: 'bleed' }); } })(P, E); } },
    { n: 'Coupe différée', type: 'offensive', role: 'Marque à déclenchement', ic: ['blade', 'hourglass'], cd: 1, mp: 12, d: 'Pose une marque de rupture sur une cible ; elle se déclenche au signal du joueur (relancer la compétence) ou au bout de 6 s.',
      cast: (P, E) => { const d = NM.dcut; if (d && d.t > G.t && !d.e.dead) { NM.dcut = null; cutLine(P, E, d.e.x, d.e.y, 0.4, 46, 1.6, 0.02, null, d.e); for (const k in P.cd) if (equippedSel(P, k) === 'C9') P.cd[k] = 9; return; }
        const t = nmTarget(P, E, 220); if (!t) return; nmMark(P, t, F, 6); NM.dcut = { e: t, t: G.t + 6 }; later(() => { if (NM.dcut && NM.dcut.e === t) { NM.dcut = null; cutLine(P, E, t.x, t.y, 0.4, 46, 1.3, 0.02, null, t); } }, 6000); } },
    { n: 'Sentence de section', type: 'offensive', role: 'Toute la précision sur une ligne', ic: ['blade', 'star'], d: 'Concentre toute la précision accumulée sur une seule ligne visée ; très puissante sur une cible déjà marquée. La jauge retombe à zéro.',
      cast: (P, E) => { const v = nmRes(P, F); nmSet(P, F, 0); const a = E.a; const x = P.x + Math.cos(a) * 85, y = P.y + Math.sin(a) * 85; const mult = 0.8 + v / 35; cutLine(P, E, x, y, a, 170, mult, 0.4, (e) => { if (nmMarked(e, F)) { nmHit(P, e, E, mult * 0.5, { kb: 0 }); e.nmMark = null; } }); num(P.x, P.y - 44, 'Précision ' + Math.round(v), p()[4]); } },
  ], { n: 'Verdict des mille sections', type: 'ultime', role: 'Ruptures en cascade', ic: ['blade', 'star'], boss: 'zones annoncées esquivables, aucun découpage automatique',
    d: 'Le joueur trace de nombreuses lignes sur une grande zone puis déclenche une cascade de ruptures ; chaque ligne est annoncée et peut être évitée.',
    cast: (P, E) => { const x = E.tx, y = E.ty; sfx(F + '_u'); flashScreen(p()[2], 0.25); for (let i = 0; i < 16; i++) { const a = rnd(0, 3.14), r = Math.sqrt(Math.random()) * 110, b = rnd(0, 6.28); cutLine(P, E, x + Math.cos(b) * r, y + Math.sin(b) * r * 0.6, a, 70, 1.0, 0.8 + i * 0.09, null); }
      later(() => { NK.delayed({ at: () => ({ x, y }), r: 60, delay: 0.3, mult: 2.4, kb: 120, shk: 10, cross: 1 })(P, E); }, 2400); } });
})();

// ---------------------------------------------------------------- 10. SCEAU DE POSSESSION
(function () {
  const F = 'possession', p = () => PALS[F];
  const lvl = (P) => nmFormOn(P, 'possessionu') ? 3 : nmFormOn(P, 'possession') ? 2 : nmFormOn(P, 'possession1') ? 1 : 0;
  // possession : chaque coup d'arme reçoit une frappe ancestrale (blanc et rouge), plus forte selon le palier
  NM.onStrike.push((P, e, mult, o) => { const L = lvl(P), her = gbOn(P, 'nmheritage'); if (!L && !her && !NM.reson) return; const E = { fam: F, base: k => (14 + Math.max(P.st8.atk, P.st8.mag) * k) / Math.max(1, P.st8.mag) };
    if (L || her) { nmHit(P, e, E, 0.18 + L * 0.16 + (her ? 0.15 : 0), { kb: 30 + L * 30 }); sparks(e.x, e.y - 14, rnd(0, 6.28), 4 + L * 3, L ? '#ffffff' : p()[2]); if (L >= 2) sparks(e.x, e.y - 14, rnd(0, 6.28), 6, p()[2]); if (her) nmAoe(P, e.x, e.y, 26, E, 0.15, { kb: 20 }); }
    if (NM.reson) { NM.reson = false; later(() => { if (!e.dead) { nmHit(P, e, E, 0.7, { kb: 60 }); ring(e.x, e.y, 22, '#ffffff', 0.3, 2); } }, 420); } });
  NM.after[F] = (P, E, s) => { if (!NM.reson || s.id.endsWith('-08')) return; NM.reson = false; later(() => { try { s.raw(P, nmK(Object.assign({}, E, { a: P.aim }), 0.6)); ring(P.x, P.y, 26, '#ffffff', 0.35, 2); } catch (e) { } }, 450); };
  const sk = (P, e) => (nmMarked(e, F) ? 1.3 : 1) * (1 + lvl(P) * 0.15);
  NMFAM(F, [
    { n: 'Marque du réceptacle', type: 'utilitaire', role: 'Sceau actif, cible marquée', ic: ['rune', 'eye'], gain: 8, d: 'Active le sceau sur le corps du joueur et marque une cible : la conscience lit ses mouvements ; les attaques du Sceau la frappent plus fort.',
      cast: (P, E) => { const t = nmTarget(P, E, 230); if (t) nmMark(P, t, F, 10); NK.buff({ dur: 3, key: 'sceau', gb: {} })(P, E); } },
    { n: 'Regard de l\'Ancien', type: 'utilitaire', role: 'Perception partagée', ic: ['eye', 'star'], gain: 6, d: 'La conscience partage sa perception : points vulnérables exposés (vulnérabilité) et trajectoires dangereuses lisibles (esquive accrue). Aucun secret narratif.',
      cast: (P, E) => { for (const e of near(P.x, P.y, 200)) nmCtl(P, e, 'vuln', F); gbuff(P, 'nmregard', 5, { dodge: 0.15 }); ring(P.x, P.y, 60, p()[2], 0.5, 3); } },
    { n: 'Main du Possesseur', type: 'offensive', role: 'Frappe ancestrale à courte portée', ic: ['hand', 'fist'], gain: 6, d: 'La conscience renforce un coup de paume ou de poing : puissance élevée à courte portée, récupération marquée.',
      cast: (P, E) => { const t = nmTarget(P, E, 60); NK.cone({ r: 48, arc: 0.95, mult: 2.0 * (t ? sk(P, t) : 1), kb: 200, shk: 5 })(P, E); gbuff(P, 'nmmain', 0.6, { spd: -0.5 }); } },
    { n: 'Décharge du Sceau', type: 'offensive', role: 'Décharge frontale', ic: ['bolt', 'rune'], d: 'Décharge frontale née de la coexistence des deux consciences ; la puissance dépend de la synchronisation consommée (jusqu\'à 30).',
      cast: (P, E) => { const v = Math.min(nmRes(P, F), 30); nmSet(P, F, nmRes(P, F) - v); NK.beam({ len: 150, w: 10, dur: 0.45, mult: (0.35 + v / 60) * (1 + lvl(P) * 0.15), tick: 0.09, track: 0.5, delay: 0.08 })(P, E); } },
    { n: 'Pas du Réceptacle', type: 'mobilité', role: 'Esquive tirée, empreinte spectrale', ic: ['wings', 'skull'], mob: true, d: 'L\'être ancestral tire le corps sur une courte trajectoire, laissant une empreinte spectrale qui éclate. Pas de passage à travers les murs.',
      cast: (P, E) => { const sx = P.x, sy = P.y; NK.dash({ dist: 100, dur: 0.16, mult: 0.2 })(P, E); later(() => { nmAoe(P, sx, sy, 34, E, 0.6, { kb: 80 }); ring(sx, sy, 34, '#ffffff', 0.3, 2); }, 700); } },
    { n: 'Résistance du Réceptacle', type: 'défensive', role: 'Réflexes partagés', ic: ['shield', 'rune'], d: 'La conscience prend en charge réflexes et posture : un coup frontal ou annoncé est fortement réduit, et les dégâts baissent un court instant.',
      cast: (P, E) => { nmGuard(P, { n: 1, a: () => P.aim, arc: 1.5, red: 0.75, dur: 4, col: '#ffffff' }); gbuff(P, 'nmresist', 3, { dr: 0.2, poise: true }); NK.buff({ dur: 3, key: 'resist', gb: {} })(P, E); } },
    { n: 'Héritage de la Conscience', type: 'utilitaire', role: 'Arme imprégnée', ic: ['sword', 'rune'], cost: 15, d: 'L\'arme équipée porte la signature ancestrale pendant 10 s : chaque style garde sa gestuelle mais chaque coup reçoit un impact ancestral de zone.',
      cast: (P, E) => { const k = nmSpend(P, F, 15); gbuff(P, 'nmheritage', k < 1 ? 6 : 10, { atk: 0.15 }); NK.buff({ dur: k < 1 ? 6 : 10, key: 'heritage', gb: {} })(P, E); } },
    { n: 'Résonance des Deux Esprits', type: 'utilitaire', role: 'Seconde frappe spectrale', ic: ['spiral', 'rune'], d: 'La prochaine compétence du Sceau ou le prochain coup d\'arme déclenche une seconde frappe spectrale retardée (à 60 %). Une seule répétition.',
      cast: (P, E) => { NM.reson = true; ring(P.x, P.y, 30, '#ffffff', 0.4, 3); num(P.x, P.y - 44, 'Résonance prête', '#ffffff'); } },
    { n: 'Manifestation partielle', type: 'transformation', role: 'Cornes, marques, yeux rouges', ic: ['skull', 'eye'], cost: 30, d: 'Cornes, marques et yeux rouges apparaissent : les attaques passent au premier palier ancestral.',
      cast: (P, E) => { const k = nmSpend(P, F, 30); nmTransform(P, F, 'possession1', k < 1 ? 12 : 20); } },
    { n: 'Coexistence absolue', type: 'transformation', role: 'Possession complète', ic: ['skull', 'star'], cost: 60, cd: 45, d: 'Possession complète : peau et cheveux entièrement blancs, yeux rouges lumineux, cornes ancestrales, marques ; toutes les attaques deviennent nettement plus puissantes. Forme temporaire contrôlée.',
      cast: (P, E) => { const k = nmSpend(P, F, 60); if (k < 1) { toast('Synchronisation insuffisante (60 requis)', p()[3]); return; } nmTransform(P, F, 'possession', 18); } },
  ], { n: 'Éveil du Premier Possesseur', type: 'ultime', role: 'Fusion totale puis frappe finale', ic: ['skull', 'sun'], boss: 'dégâts majeurs, aucune neutralisation',
    d: 'Fusion totale : séquence d\'éveil, forme ancestrale complète, toutes les attaques renforcées, puis frappe finale massive.',
    cast: (P, E) => { nmTransform(P, F, 'possessionu', 10); slowmo(0.6, 0.35); flashScreen('#ffffff', 0.6);
      later(() => { NK.nova({ r: 140, hitM: 4.0, kb: 240, shk: 14, rings: 5 })(P, E); flashScreen(p()[2], 0.4); }, 1500); } });
})();

// ---------------------------------------------------------------- 11. DRAGON DIVIN (paliers Éveil / Autorité / Souveraineté)
(function () {
  const F = 'dragon', p = () => PALS[F];
  const tier = (P) => { const v = nmRes(P, F); return v >= 67 ? 3 : v >= 34 ? 2 : 1; };
  const tk = (P) => 1 + (tier(P) - 1) * 0.18;
  NM.glide = false;
  { const t0 = NM.tick; NM.tick = function (dt) { t0(dt); const P = G.player; NM.glide = !!(P && P.nmForm && /^dragon/.test(P.nmForm.kind)); }; }
  // couronne : trois têtes spectrales réagissent aux compétences draconiques activées
  NM.after[F] = (P, E, s) => { if (!gbOn(P, 'nmcouronne') || s.id.endsWith('-07')) return; for (let i = 0; i < 3; i++) later(() => NK.proj({ spd: 380, life: 0.8, r: 8, mult: 0.35 * tk(P), homing: 4, look: 'bolt', kb: 40 })(P, Object.assign({}, E, { a: P.aim + (i - 1) * 0.3 })), 120 + i * 90); };
  NM.onStrike.push((P, e) => { if (!nmFormOn(P) || !/^dragon$|^dragonu$/.test(P.nmForm.kind) || (NM.drB || 0) > G.t) return; NM.drB = G.t + 0.5; const E = { fam: F, base: k => (14 + P.st8.mag * k) / Math.max(1, P.st8.mag) }; nmHit(P, e, E, 0.5, { kb: 80 }); sparks(e.x, e.y - 14, rnd(0, 6.28), 7, p()[2]); });
  NMFAM(F, [
    { n: 'Écailles de l\'Empereur', type: 'défensive', role: 'Écailles sur un angle', ic: ['shield', 'star'], gain: 8, d: 'Des écailles couvrent un côté du corps (vers la visée) et réduisent les dégâts de cet angle ; elles se fissurent au fil des impacts.',
      cast: (P, E) => { const a = P.aim; nmGuard(P, { n: 3 + tier(P), a, arc: 1.4, red: 0.55, dur: 8, col: p()[2], onHit: () => num(P.x, P.y - 40, 'Écailles fissurées', p()[3]) }); NK.buff({ dur: 8, key: 'ecailles', gb: {} })(P, E); } },
    { n: 'Griffes du Dragon céleste', type: 'offensive', role: 'Combo de trois griffes', ic: ['thorn', 'thorn'], gain: 8, d: 'Deux entailles croisées puis une frappe descendante ; la troisième gagne en puissance si les deux premières ont touché.',
      cast: (P, E) => { let hits = 0; const k = tk(P); NK.cone({ r: 60, arc: 1.4, mult: 0.7 * k, kb: 40, onHit: (P2, E2, n) => { if (n) hits++; } })(P, Object.assign({}, E, { a: P.aim - 0.2 }));
        later(() => NK.cone({ r: 60, arc: 1.4, mult: 0.7 * k, kb: 40, onHit: (P2, E2, n) => { if (n) hits++; } })(P, Object.assign({}, E, { a: P.aim + 0.2 })), 180);
        later(() => NK.cone({ r: 66, arc: 1.0, mult: (hits >= 2 ? 1.6 : 1.0) * k, kb: 160, shk: 5 })(P, Object.assign({}, E, { a: P.aim })), 380); } },
    { n: 'Souffle du jugement céleste', type: 'offensive', role: 'Souffle canalisé en ligne', ic: ['cloud', 'sun'], cost: 20, d: 'Souffle concentré en ligne, balayable lentement sur un angle limité ; pendant la canalisation, le joueur est exposé sur les côtés.',
      cast: (P, E) => { const k = nmSpend(P, F, 20) * tk(P); gbuff(P, 'nmsouffle', 1.5, { spd: -0.7, dr: -0.2 }); NK.beam({ len: 230, w: 14, dur: 1.4, mult: 0.42 * k, tick: 0.12, track: 0.35, delay: 0.2 })(P, E); } },
    { n: 'Queue du souverain', type: 'offensive', role: 'Balayage arrière/latéral', ic: ['whip', 'star'], gain: 6, d: 'Une queue spectrale balaie l\'arrière et les flancs pour punir ceux qui contournent le joueur.',
      cast: (P, E) => { NK.cone({ r: 84, arc: 2.6, mult: 0.9 * tk(P), kb: 170 })(P, Object.assign({}, E, { a: P.aim + Math.PI })); } },
    { n: 'Descente impériale', type: 'mobilité', role: 'Bond et plongée', ic: ['meteor', 'wings'], mob: true, cost: 15, d: 'Bond aérien court puis plongée sur la zone ciblée : onde de pression à l\'impact, sans contrôle garanti sur les boss.',
      cast: (P, E) => { const k = nmSpend(P, F, 15) * tk(P); let tx = E.tx, ty = E.ty; const d = dist(P.x, P.y, tx, ty); if (d > 160) { tx = P.x + (tx - P.x) / d * 160; ty = P.y + (ty - P.y) / d * 160; } if (dirSolid(tx, ty)) { toast('Zone d\'atterrissage bloquée', p()[3]); return; } P.iframes = Math.max(P.iframes, 0.7); NK.delayed({ at: () => ({ x: tx, y: ty }), r: 62, delay: 0.5, mult: 1.4 * k, kb: 160, shk: 8, onHit: () => { P.x = tx; P.y = ty; for (const e of near(tx, ty, 110)) if (dist(e.x, e.y, tx, ty) > 60) { nmHit(P, e, E, 0.4 * k, { kb: 0 }); if (!nmIsBig(e)) pushE(e, tx, ty, 260); } ring(tx, ty, 110, p()[3], 0.45, 4); } })(P, E); } },
    { n: 'Orbe de l\'origine', type: 'offensive', role: 'Noyau de souveraineté', ic: ['orb', 'sun'], d: 'Condense de la souveraineté en un noyau lancé qui traverse les ennemis et éclate en bout de course ; plus la part condensée est grande (jusqu\'à 25), plus il est dense. (Maintien de la touche : à prototyper.)',
      cast: (P, E) => { const v = Math.min(nmRes(P, F), 25); nmSet(P, F, nmRes(P, F) - v); NK.proj({ spd: 190, life: 1.4, r: 12 + v / 4, pierce: 99, mult: (0.8 + v / 25) * tk(P), boom: 50 + v, boomM: 0.6 + v / 40, look: 'orb', kb: 100 })(P, E); } },
    { n: 'Couronne des dragons ancestraux', type: 'utilitaire', role: 'Trois têtes réactives', ic: ['star', 'fang'], cost: 25, d: 'Trois têtes spectrales apparaissent derrière le joueur pendant 15 s et répondent uniquement à ses compétences draconiques (un trait chacune). Elles ne combattent pas seules.',
      cast: (P, E) => { const k = nmSpend(P, F, 25); gbuff(P, 'nmcouronne', k < 1 ? 8 : 15, {}); NK.buff({ dur: k < 1 ? 8 : 15, key: 'couronne', gb: {}, draw(ctx, x, y, P2, q, z) { ctx.globalAlpha = 0.7 * z.k; for (let i = 0; i < 3; i++) NMD.orb(ctx, x + (i - 1) * 14, y - 36 - (i === 1 ? 6 : 0) + Math.sin(z.t * 3 + i) * 2, 4, q, z.t); ctx.globalAlpha = 1; } })(P, E); } },
    { n: 'Ascension du Dragon divin', type: 'transformation', role: 'Ailes, griffes et queue : vol plané', ic: ['wings', 'star'], cost: 35, d: 'Transformation avancée : ailes, griffes et queue. Permet de planer au-dessus de l\'eau (zones prévues), sans vol libre illimité.',
      cast: (P, E) => { const k = nmSpend(P, F, 35); nmTransform(P, F, 'dragonw', k < 1 ? 12 : 20); } },
    { n: 'Rugissement de l\'Empereur', type: 'utilitaire', role: 'Onde frontale, précision réduite', ic: ['note', 'sun'], cost: 15, d: 'Onde frontale qui perturbe les ennemis ordinaires et réduit leur précision (aveuglement bref) ; les boss ne sont pas étourdis.',
      cast: (P, E) => { nmSpend(P, F, 15); NK.cone({ r: 130, arc: 1.5, mult: 0.4 * tk(P), kb: 90, onHit: () => { for (const e of near(P.x + Math.cos(P.aim) * 70, P.y + Math.sin(P.aim) * 42, 75)) nmCtl(P, e, 'blind', F); } })(P, E); for (let i = 0; i < 3; i++) later(() => ring(P.x + Math.cos(P.aim) * 30, P.y + Math.sin(P.aim) * 18, 30 + i * 25, p()[3], 0.35, 2), i * 80); } },
    { n: 'Incarnation du Dragon divin', type: 'transformation', role: 'Forme draconique complète', ic: ['wings', 'fang'], cost: 60, cd: 50, d: 'Forme draconique complète et temporaire, dans les espaces autorisés : déplacement plané, morsure aux coups d\'arme, souffle et atterrissage dédiés.',
      cast: (P, E) => { const k = nmSpend(P, F, 60); if (k < 1) { toast('Souveraineté insuffisante (60 requis)', p()[3]); return; } if (nmTransform(P, F, 'dragon', 15)) NK.delayed({ where: 'self', at: () => ({ x: P.x, y: P.y }), r: 70, delay: 0.4, mult: 1.2, kb: 160, shk: 8 })(P, E); } },
  ], { n: 'Apocalypse draconique : Le Dieu parmi les mortels', type: 'ultime', role: 'Forme hybride, souffle sur une ligne annoncée', ic: ['sun', 'wings'], boss: 'ligne annoncée esquivable, aucune neutralisation',
    d: 'Forme hybride humanoïde-dragon (distincte de l\'incarnation) pendant 12 s ; une séquence de domination culmine en un souffle du jugement sur une ligne annoncée. Jauge entièrement consommée.',
    cast: (P, E) => { nmSet(P, F, 0); nmTransform(P, F, 'dragonu', 12); const a = E.a, x0 = P.x, y0 = P.y; slowmo(0.5, 0.4);
      mfx({ life: 1.3, x: x0, y: y0, big: 1, passes: ['ground'], upd() { }, draw(m, ctx, cx, cy) { ctx.globalAlpha = 0.35 + 0.3 * Math.sin(m.t * 20); pxLine(ctx, x0 - cx, y0 - cy, x0 + Math.cos(a) * 300 - cx, y0 + Math.sin(a) * 300 - cy, p()[3], 2); ctx.globalAlpha = 1; } });
      later(() => { NK.beam({ len: 300, w: 22, dur: 1.8, mult: 0.85, tick: 0.12, track: 0, delay: 0.05 })(P, Object.assign({}, E, { a })); shake(10); flashScreen(p()[4], 0.4); }, 1300); } });
})();

// ---------------------------------------------------------------- 12. LÉVIATHAN (paliers Surface / Profondeur / Abysses)
(function () {
  const F = 'leviathan', p = () => PALS[F];
  const tier = (P) => { const v = nmRes(P, F); return v >= 67 ? 3 : v >= 34 ? 2 : 1; };
  const tk = (P) => 1 + (tier(P) - 1) * 0.18;
  const jaw = (P, E, x, y, mult, delay, o) => NK.delayed(Object.assign({ at: () => ({ x, y }), r: 32, delay: delay || 0.5, mult, kb: 60 }, o))(P, E);
  const consume = (e) => { if (nmMarked(e, F)) { e.nmMark = null; nmGain(G.player, F, 6); return true; } return false; };
  NM.onStrike.push((P, e) => { if (!nmFormOn(P, 'leviathan') || (NM.lvA || 0) > G.t) return; NM.lvA = G.t + 0.6; const E = { fam: F, base: k => (14 + P.st8.mag * k) / Math.max(1, P.st8.mag) }; nmHit(P, e, E, 0.45, { kb: 60 }); nmGain(P, F, -1); sparks(e.x, e.y - 12, rnd(0, 6.28), 6, p()[3]); });
  NMFAM(F, [
    { n: 'Marque des profondeurs', type: 'utilitaire', role: 'Marque consommable', ic: ['eye', 'wave'], gain: 8, d: 'Marque une cible ; les techniques du Léviathan consomment la marque pour gagner en précision ou déclencher un suivi. Aucune paralysie.',
      cast: (P, E) => { const t = nmTarget(P, E, 240); if (t) { nmMark(P, t, F, 8); ring(t.x, t.y, 20, p()[3], 0.4, 2); } } },
    { n: 'Fouet des abysses', type: 'offensive', role: 'Appendice aller-retour', ic: ['whip'], gain: 5, d: 'Un appendice frappe en ligne puis revient ; toucher une cible marquée renforce le retour. (Orientation pendant la course : à prototyper.)',
      cast: (P, E) => { let marked = false; NK.proj({ spd: 360, life: 0.7, r: 9, look: 'line', mult: 0.8 * tk(P), pierce: 3, ret: 1, onHit: (P2, e) => { if (consume(e)) { marked = true; } else if (marked) nmHit(P2, e, E, 0.5, { kb: 40 }); } })(P, E); } },
    { n: 'Pression des grands fonds', type: 'offensive', role: 'Compression ciblée', ic: ['spiral', 'wave'], cost: 12, d: 'Compression ciblée dans une petite zone : les ennemis légers sont tassés au sol, les lourds subissent des dégâts sans immobilisation garantie.',
      cast: (P, E) => { const k = nmSpend(P, F, 12) * tk(P); jaw(P, E, E.tx, E.ty, 1.2 * k, 0.35, { r: 38, onHit: (P2, E2, m) => { for (const e of near(m.x, m.y, 40)) nmCtl(P2, e, 'root', F); } }); } },
    { n: 'Courant de dérive', type: 'utilitaire', role: 'Courant latéral, dévie les tirs', ic: ['wave', 'wave'], cost: 10, d: 'Courant latéral : déplace légèrement les ennemis légers et dévie les projectiles simples. Ne contrôle ni la masse ni la gravité.',
      cast: (P, E) => { nmSpend(P, F, 10); const side = P.aim + Math.PI / 2; NK.zone({ r: 74, delay: 0.15, dur: 4, mult: 0.12, tick: 0.5, fn: (P2, e, dt) => { if (!nmIsBig(e)) { e.kbx += Math.cos(side) * 220 * dt; e.kby += Math.sin(side) * 220 * dt; } }, upd: (P2, E2, z, dt) => { for (const q of G.projs) if (q.from === 'e' && dist(q.x, q.y, z.x, z.y) < z.R) { q.vx += Math.cos(side) * 260 * dt; q.vy += Math.sin(side) * 260 * dt; } } })(P, E); } },
    { n: 'Gueule du Léviathan', type: 'offensive', role: 'Morsure surgissante', ic: ['fang', 'wave'], cost: 14, d: 'Une tête abyssale émerge sous la cible et mord la zone ; si la cible est marquée, une seconde morsure suit (dégâts réduits).',
      cast: (P, E) => { const k = nmSpend(P, F, 14) * tk(P); const t = nmTarget(P, E, 220); const x = t ? t.x : E.tx, y = t ? t.y : E.ty; const m = t && consume(t); jaw(P, E, x, y, 1.5 * k, 0.5, { kb: 0 }); if (m) later(() => jaw(P, E, t.x, t.y, 0.7 * k, 0.25, { kb: 0 }), 650); } },
    { n: 'Noyade silencieuse', type: 'utilitaire', role: 'Champ de basse pression', ic: ['cloud', 'wave'], cost: 14, d: 'Champ de pression basse : les ennemis ordinaires qui restent dedans ralentissent progressivement. Aucune suffocation ni blocage complet.',
      cast: (P, E) => { nmSpend(P, F, 14); NK.zone({ r: 82, delay: 0.2, dur: 6, mult: 0.1, tick: 1, fn: (P2, e, dt) => { e.nmDrown = (e.nmDrown || 0) + dt; if (!nmIsBig(e)) e.slowT = Math.max(e.slowT || 0, Math.min(1.5, e.nmDrown * 0.4)); } })(P, E); } },
    { n: 'Mâchoires des profondeurs', type: 'offensive', role: 'Trois mâchoires successives', ic: ['fang', 'fang'], cost: 20, d: 'Jusqu\'à trois mâchoires apparaissent successivement sur des cibles marquées (sinon les plus proches) ; chacune frappe une fois. (Ordre : marquées d\'abord, puis proximité.)',
      cast: (P, E) => { const k = nmSpend(P, F, 20) * tk(P); const ens = G.enemies.filter(e => !e.dead && dist(P.x, P.y, e.x, e.y) < 230).sort((a, b) => (nmMarked(b, F) - nmMarked(a, F)) || dist(P.x, P.y, a.x, a.y) - dist(P.x, P.y, b.x, b.y)).slice(0, 3); ens.forEach((e, i) => later(() => { if (!e.dead) { consume(e); jaw(P, E, e.x, e.y, 1.1 * k, 0.35); } }, i * 260)); } },
    { n: 'Éveil de l\'hôte abyssal', type: 'transformation', role: 'Plaques, nageoires, appendices', ic: ['wave', 'star'], cost: 35, d: 'Manifestation avancée : plaques osseuses, nageoires, appendices et lueurs bioluminescentes ; les compétences gagnent en puissance pendant la forme.',
      cast: (P, E) => { const k = nmSpend(P, F, 35); nmTransform(P, F, 'leviathanh', k < 1 ? 12 : 20); } },
    { n: 'Effondrement abyssal', type: 'offensive', role: 'Zone qui attire puis s\'effondre', ic: ['vortex', 'wave'], cost: 25, d: 'Zone annoncée où la pression s\'accumule : les ennemis légers sont attirés au centre, puis tout s\'effondre ; les boss subissent dégâts et pression sans être déplacés.',
      cast: (P, E) => { const k = nmSpend(P, F, 25) * tk(P); const x = E.tx, y = E.ty; NK.zone({ at: null, r: 90, delay: 0.3, dur: 1.2, mult: 0.1, tick: 0.4, fn: (P2, e, dt) => { if (!nmIsBig(e)) pushE(e, x, y, -900 * dt); } })(P, E); later(() => jaw(P, E, x, y, 2.0 * k, 0.05, { r: 70, shk: 8 }), 1400); } },
    { n: 'Incarnation du Léviathan', type: 'transformation', role: 'Hôte complet, appendices dédiés', ic: ['fang', 'star'], cost: 60, cd: 50, d: 'Manifestation complète de l\'hôte humanoïde pendant 22 s : plusieurs appendices fonctionnels ; chaque coup d\'arme déclenche un coup d\'appendice qui consomme la jauge.',
      cast: (P, E) => { const k = nmSpend(P, F, 60); if (k < 1) { toast('Profondeur insuffisante (60 requis)', p()[3]); return; } nmTransform(P, F, 'leviathan', 22); } },
  ], { n: 'Fin des profondeurs : L\'Éveil du Dévoreur', type: 'ultime', role: 'Ombre colossale, mâchoires, explosion', ic: ['fang', 'sun'], boss: 'dégâts complets, jamais avalé ni neutralisé',
    d: 'Le champ s\'assombrit, une ombre colossale apparaît, plusieurs mâchoires frappent des zones annoncées puis convergent en une explosion de pression finale.',
    cast: (P, E) => { const x = E.tx, y = E.ty; NM.dark = G.t + 4; flashScreen('#000000', 0.5); sfx(F + '_u'); slowmo(0.4, 0.4);
      mfx({ life: 3.4, x, y, big: 1, passes: ['ground'], upd() { }, draw(m, ctx, cx, cy) { ctx.globalAlpha = 0.35 * cap01(m.t) * cap01(3.4 - m.t); ctx.fillStyle = p()[0]; ctx.beginPath(); ctx.ellipse(x - cx, y - cy, 150, 70, 0.2, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } });
      for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28 + 0.3; later(() => jaw(P, E, x + Math.cos(a) * 75, y + Math.sin(a) * 44, 1.2, 0.5, { r: 40 }), 500 + i * 260); }
      later(() => jaw(P, E, x, y, 3.6, 0.6, { r: 120, kb: 200, shk: 14 }), 2000); } });
})();
