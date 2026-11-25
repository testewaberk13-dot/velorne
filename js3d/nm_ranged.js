'use strict';
// =====================================================================
//  REFONTE DES NOUVELLES MAGIES (25/11, soir) — demande de l'utilisateur :
//  « trop de renforcements, de passifs, de pas et d'esquives pour des légendaires ; je veux des attaques destructrices,
//  avec de la portée : des épées lancées, des faisceaux d'énergie… »
//  Les compétences de soutien, de déplacement et de renforcement sont remplacées par des attaques à distance qui gardent
//  l'identité de chaque famille. Les transformations, les ultimes et les mécaniques signatures restent.
//  Les anciennes versions restent écrites dans nm_fams1.js / nm_fams2.js (historique) ; ce fichier les remplace au
//  chargement (même identifiant, même emplacement de grimoire). Valeurs : prototypage.
// =====================================================================
(function () {
  // ---------------- outils ----------------
  // cible à portée (verrouillée, visée ou la plus proche devant), sinon un point loin devant
  const far = (P, E, R) => { const t = E.t && !E.t.dead && dist(P.x, P.y, E.t.x, E.t.y) < R ? E.t : nearestEnemy(P.x, P.y, R, 0.8, E.a); return t ? { x: t.x, y: t.y, t } : { x: P.x + Math.cos(E.a) * R * 0.65, y: P.y + Math.sin(E.a) * R * 0.65 }; };
  const aimAt = (P, E, R) => { const q = far(P, E, R); return Object.assign({}, E, { tx: q.x, ty: q.y, t: q.t || null, a: Math.atan2(q.y - P.y, q.x - P.x) }); };
  // apparence des projectiles (lames, lances, croissants, poings, oiseaux, loups, écailles, blocs, gueules, orbes)
  function look(ctx, x, y, a, kind, p, t, s) {
    s = s || 1; const c = Math.cos(a), si = Math.sin(a); const P2 = (u, v) => [x + c * u - si * v, y + si * u * 0.6 + c * v * 0.6 - 10];
    ctx.save();
    if (kind === 'sword' || kind === 'spear') { const L = (kind === 'spear' ? 22 : 18) * s, [ax, ay] = P2(-L * 0.6, 0), [bx, by] = P2(L * 0.6, 0); pxLine(ctx, ax, ay, bx, by, p[1], 5 * s); pxLine(ctx, ax, ay, bx, by, p[4], 2 * s); const [hx, hy] = P2(-L * 0.3, 0), [h1x, h1y] = P2(-L * 0.3, -4 * s), [h2x, h2y] = P2(-L * 0.3, 4 * s); pxLine(ctx, h1x, h1y, h2x, h2y, p[3], 3); void hx; void hy; if (kind === 'spear') { const [tx2, ty2] = P2(L * 0.75, 0); ctx.fillStyle = p[4]; ctx.fillRect(Math.round(tx2) - 2, Math.round(ty2) - 2, 4, 4); } }
    else if (kind === 'crescent') { ctx.strokeStyle = p[3]; ctx.lineWidth = 4 * s; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.ellipse(x, y - 10, 12 * s, 7 * s, a, -1.3, 1.3); ctx.stroke(); ctx.strokeStyle = p[4]; ctx.lineWidth = 1.5; ctx.stroke(); }
    else if (kind === 'fist') { glow(ctx, x, y - 10, 22 * s, rgbOf(p[2]), 0.5); ctx.fillStyle = p[3]; ctx.beginPath(); ctx.ellipse(x, y - 10, 10 * s, 8 * s, 0, 0, 7); ctx.fill(); ctx.fillStyle = p[4]; for (let k = 0; k < 4; k++) { const [fx, fy] = P2(6 * s, (k - 1.5) * 3.5 * s); ctx.fillRect(Math.round(fx) - 1, Math.round(fy) - 1, 3, 3); } }
    else if (kind === 'bird' || kind === 'wolf' || kind === 'fang') { glow(ctx, x, y - 10, 18 * s, rgbOf(p[2]), 0.45); ctx.fillStyle = p[1]; ctx.beginPath(); ctx.ellipse(x, y - 10, 10 * s, 6 * s, a, 0, 7); ctx.fill(); const [hx, hy] = P2(9 * s, 0); ctx.fillStyle = p[2]; ctx.beginPath(); ctx.arc(hx, hy, 4.5 * s, 0, 7); ctx.fill(); ctx.fillStyle = p[4]; ctx.fillRect(Math.round(hx), Math.round(hy) - 2, 2, 2);
      if (kind === 'bird') { const f = Math.sin(t * 22) * 5 * s; const [w1x, w1y] = P2(-2, -12 * s), [w2x, w2y] = P2(-2, 12 * s); pxLine(ctx, x, y - 10, w1x, w1y - f, p[3], 3); pxLine(ctx, x, y - 10, w2x, w2y - f, p[3], 3); } }
    else if (kind === 'scale' || kind === 'block' || kind === 'seal') { ctx.translate(x, y - 10); ctx.rotate(t * (kind === 'block' ? 3 : 9)); ctx.fillStyle = p[2]; const z = (kind === 'block' ? 9 : 6) * s; ctx.fillRect(-z, -z * 0.7, z * 2, z * 1.4); ctx.strokeStyle = p[4]; ctx.lineWidth = 1; ctx.strokeRect(-z, -z * 0.7, z * 2, z * 1.4); }
    else { NMD.orb(ctx, x, y - 6, 7 * s, p, t); }
    ctx.restore();
  }
  const PJ = (o) => NK.proj(Object.assign({ draw(ctx, x, y, m, p) { look(ctx, x, y, m.ang, o.look, p, m.t, o.s); } }, o));
  // salve dirigée vers la cible
  const volley = (o) => (P, E) => PJ(Object.assign({ spd: 420, life: 0.85, r: 9, mult: 0.55, kb: 50 }, o))(P, aimAt(P, E, o.range || 380));
  // lance perforante longue portée
  const lance = (o) => (P, E) => PJ(Object.assign({ spd: 560, life: 0.75, r: 13, mult: 1.6, pierce: 99, kb: 140, shake: 3 }, o))(P, aimAt(P, E, o.range || 420));
  // barrage : n projectiles successifs, chacun re-visé
  const barrage = (o) => (P, E) => { for (let i = 0; i < o.n; i++) later(() => { if (P.state === 'dead') return; PJ(Object.assign({ spd: 460, life: 0.9, r: 8, mult: 0.45, homing: o.homing ?? 4, kb: 30 }, o, { n: 1, rand: o.rand ?? 0.25 }))(P, aimAt(P, E, o.range || 380)); }, i * (o.gap || 70)); };
  // faisceau long
  const beam = (o) => (P, E) => NK.beam(Object.assign({ len: 320, w: 10, dur: 0.7, tick: 0.1, track: 0.4, delay: 0.12, mult: 0.32 }, o))(P, aimAt(P, E, o.len || 320));
  // pluie sur la cible (projectiles tombant du ciel)
  const rain = (o) => (P, E) => NK.rain(Object.assign({ r: 70, n: 12, dur: 1.2, mult: 0.6, aoe: 22, kb: 50, draw(ctx, x, y, d, p, u, t) { look(ctx, x, y + 10, Math.PI / 2, o.look, p, t, o.s); } }, o))(P, aimAt(P, E, o.range || 360));
  // frappe annoncée sur la cible lointaine
  const strike = (o) => (P, E) => { const q = far(P, E, o.range || 360); NK.delayed(Object.assign({ at: () => ({ x: q.t ? q.t.x : q.x, y: q.t ? q.t.y : q.y }) }, o))(P, E); };
  // onde qui parcourt le sol vers l'avant
  const wave = (o) => (P, E) => { const E2 = aimAt(P, E, o.len || 320), seen = new Set(), oh = o.onHit;
    NK.wave(Object.assign({ spd: 300, len: 320, w: 36, mult: 0.9, kb: 120, thick: 22 }, o, oh ? { upd: (P2, E3, m) => { const c = Math.cos(E2.a), si = Math.sin(E2.a); for (const e of G.enemies) if (!e.dead && !seen.has(e)) { const dx = e.x - m.x, dy = e.y - m.y, u = dx * c + dy * si, v = -dx * si + dy * c; if (Math.abs(v) < (o.w || 36) && Math.abs(u) < 22) { seen.add(e); oh(P2, e); } } } } : {}))(P, E2); };
  const R = nmReplace;

  // ================= 1. YAMATA NO OROCHI =================
  const F1 = 'orochi';
  R(F1, 2, { n: 'Crachat des huit gueules', type: 'offensive', role: 'Éventail de huit jets à longue portée', ic: ['fang', 'needles'], gain: 5, d: 'Les huit têtes crachent ensemble un éventail de jets corrosifs qui portent loin ; chaque jet empoisonne.',
    cast: volley({ n: 8, spread: 0.13, spd: 400, life: 0.95, r: 8, mult: 0.42, look: 'fang', st: 'poison' }) });
  R(F1, 3, { n: 'Têtes lancées', type: 'offensive', role: 'Trois têtes à tête chercheuse', ic: ['fang', 'eye'], gain: 5, d: 'Trois têtes s\'allongent à toute vitesse vers les ennemis, traversent la première cible et la marquent pour la Morsure.',
    cast: barrage({ n: 3, gap: 110, spd: 520, life: 0.8, r: 11, mult: 0.85, pierce: 2, look: 'fang', s: 1.4, homing: 6, onHit: (P, e) => nmMark(P, e, F1, 6) }) });
  R(F1, 5, { n: 'Morsure en relais', type: 'offensive', role: 'Trois morsures à distance', ic: ['fang', 'chain'], cost: 14, d: 'Trois cous se tendent jusqu\'à une cible éloignée (jusqu\'à 300) et mordent tour à tour depuis des angles alternés ; si la cible sort de portée, le relais s\'interrompt.',
    cast: (P, E) => { const k = nmSpend(P, F1, 14); const q = far(P, E, 300); const t = q.t; if (!t) return; const M = [0.8, 0.95, 1.3];
      const step = (i) => { if (i > 2 || t.dead) return; if (dist(P.x, P.y, t.x, t.y) > 320) { num(P.x, P.y - 40, 'Relais rompu', PALS[F1][3]); return; } nmHit(P, t, E, M[i] * k, { kb: i === 2 ? 120 : 20 }); sparks(t.x, t.y - 14, rnd(0, 6.28), 8, PALS[F1][3]);
        mfx({ life: 0.25, x: t.x, y: t.y, big: 1, passes: ['glow'], upd() { }, draw(m, ctx, cx, cy) { ctx.globalAlpha = 1 - m.t / 0.25; NMD.line(ctx, P.x - cx, P.y - cy - 14, t.x - cx + (i % 2 ? -10 : 10), t.y - cy - 10, PALS[F1], 4); NMD.orb(ctx, t.x - cx, t.y - cy - 12, 7, PALS[F1], m.t); ctx.globalAlpha = 1; } }); sfx(F1 + '_i'); later(() => step(i + 1), 220); }; step(0); } });
  R(F1, 6, { n: 'Souffle des chefs', type: 'offensive', role: 'Quatre souffles en faisceaux', ic: ['cloud', 'wave'], cost: 22, d: 'Quatre têtes soufflent tour à tour un long faisceau : pression (recul), chaleur (brûlure), venin (poison), onde (affaiblissement).',
    cast: (P, E) => { const k = nmSpend(P, F1, 22); const S = [['Pression', null, 200], ['Chaleur', 'burn', 40], ['Venin', 'poison', 30], ['Onde', 'weak', 120]];
      S.forEach(([nmx, st, kb], i) => later(() => { beam({ len: 300, w: 12, dur: 0.35, tick: 0.09, mult: 0.3 * k, st, kb, delay: 0.05 })(P, Object.assign({}, E, { a: P.aim + (i - 1.5) * 0.06 })); num(P.x, P.y - 40 - i * 6, nmx, PALS[F1][4]); }, i * 260)); } });
  R(F1, 7, { n: 'Déluge de crocs', type: 'offensive', role: 'Pluie de crocs sur une zone lointaine', ic: ['fang', 'meteor'], cost: 16, d: 'Les têtes s\'élèvent et abattent une pluie de crocs sur la zone visée, loin devant.',
    cast: rain({ n: 16, r: 80, dur: 1.1, mult: 0.55, look: 'fang', range: 380 }) });
  R(F1, 9, { n: 'Rugissement-canon', type: 'offensive', role: 'Onde destructrice vers l\'avant', ic: ['note', 'wave'], cost: 24, d: 'Les huit gueules rugissent dans la même direction : une onde dévastatrice parcourt le sol, désoriente les ennemis ordinaires et frappe fort les boss.',
    cast: (P, E) => { const k = nmSpend(P, F1, 24); wave({ spd: 340, len: 360, w: 46, mult: 1.3 * k, kb: 180, onHit: (P2, e) => nmCtl(P2, e, nmIsBig(e) ? 'vuln' : 'confuse', F1) })(P, E); shake(5); } });

  // ================= 2. PHÉNIX =================
  const F2 = 'phenix';
  R(F2, 2, { n: 'Javelot solaire', type: 'offensive', role: 'Lance de feu perforante', ic: ['spear', 'sun'], gain: 6, d: 'Une lance de flammes traverse tout sur sa trajectoire et explose en bout de course en laissant des plumes de braise.',
    cast: lance({ look: 'spear', s: 1.3, mult: 1.5, st: 'burn', boom: 54, boomM: 0.8, onEnd: (P, E, m) => { for (let i = 0; i < 3; i++) NM.feathers.push({ x: m.x + rnd(-20, 20), y: m.y + rnd(-12, 12), t: G.t + 8 }); } }) });
  R(F2, 3, { n: 'Tempête de plumes', type: 'offensive', role: 'Barrage de plumes chercheuses', ic: ['wings', 'needles'], gain: 6, d: 'Douze plumes incandescentes jaillissent l\'une après l\'autre et filent vers les ennemis ; chacune marque sa cible pour la combustion.',
    cast: barrage({ n: 12, gap: 55, spd: 480, life: 0.9, r: 7, mult: 0.32, look: 'spear', s: 0.7, homing: 5, onHit: (P, e) => nmMark(P, e, F2, 6) }) });
  R(F2, 4, { n: 'Oiseau de feu', type: 'offensive', role: 'Grand oiseau de flammes', ic: ['wings', 'meteor'], cost: 12, d: 'Un grand oiseau de flammes s\'envole droit devant, traverse les ennemis en les brûlant et explose au bout de sa course.',
    cast: (P, E) => { const k = nmSpend(P, F2, 12); PJ({ look: 'bird', s: 2.2, spd: 300, life: 1.3, r: 18, pierce: 99, mult: 1.1 * k, st: 'burn', boom: 70, boomM: 1.0 * k, kb: 100 })(P, aimAt(P, E, 400)); } });
  R(F2, 6, { n: 'Pluie de braises', type: 'offensive', role: 'Pluie de feu sur la zone', ic: ['meteor', 'sun'], cost: 14, d: 'Une pluie de braises s\'abat sur la zone visée ; les cibles marquées s\'embrasent.',
    cast: rain({ n: 18, r: 85, dur: 1.4, mult: 0.5, look: 'orb', st: 'burn', range: 380 }) });

  // ================= 3. TITAN =================
  const F3 = 'titan';
  R(F3, 2, { n: 'Onde de choc frontale', type: 'offensive', role: 'Onde au sol vers l\'avant', ic: ['wave', 'fist'], gain: 6, d: 'Le Titan frappe le sol : une onde de pression file droit devant sur une longue distance et renverse les ennemis légers.',
    cast: (P, E) => { const v = Math.min(nmRes(P, F3), 20); nmSet(P, F3, nmRes(P, F3) - v); wave({ spd: 320, len: 340, w: 40, mult: 1.0 + v / 25, kb: 200 })(P, E); shake(5); } });
  R(F3, 3, { n: 'Poing projeté', type: 'offensive', role: 'Poing de pression à distance', ic: ['fist', 'wave'], gain: 5, d: 'Un coup de poing si violent que l\'air comprimé part en un poing de pression qui frappe loin et repousse fort.',
    cast: (P, E) => { const v = Math.min(nmRes(P, F3), 25); nmSet(P, F3, nmRes(P, F3) - v); PJ({ look: 'fist', s: 1.5 + v / 30, spd: 480, life: 0.75, r: 16, pierce: 3, mult: 1.3 + v / 20, kb: 260, shake: 4 })(P, aimAt(P, E, 380)); } });
  R(F3, 6, { n: 'Salve de pression', type: 'offensive', role: 'Trois poings de pression', ic: ['fist', 'fist'], cost: 12, d: 'Trois coups de poing successifs projettent trois poings de pression vers les ennemis.',
    cast: (P, E) => { nmSpend(P, F3, 12); barrage({ n: 3, gap: 160, look: 'fist', s: 1.2, spd: 470, life: 0.75, r: 14, mult: 0.85, pierce: 2, homing: 2, kb: 180, rand: 0.1 })(P, E); } });
  R(F3, 7, { n: 'Frappe sonique', type: 'offensive', role: 'Rayon de choc instantané', ic: ['bolt', 'fist'], cost: 16, d: 'Un coup porté à vitesse colossale crée une ligne de choc instantanée qui traverse tout sur une grande distance.',
    cast: (P, E) => { const k = nmSpend(P, F3, 16); beam({ len: 340, w: 16, dur: 0.25, tick: 0.08, mult: 0.75 * k, kb: 160, delay: 0.05 })(P, E); shake(6); } });

  // ================= 4. KITSUNE =================
  const F4 = 'kitsune';
  R(F4, 1, { n: 'Feux follets', type: 'offensive', role: 'Cinq feux-renards chercheurs', ic: ['star', 'orb'], gain: 1, d: 'Cinq feux follets jaillissent des queues et poursuivent les ennemis à distance.',
    cast: barrage({ n: 5, gap: 70, spd: 360, life: 1.3, r: 8, mult: 0.5, look: 'orb', homing: 6 }) });
  R(F4, 3, { n: 'Sceau explosif', type: 'offensive', role: 'Sceau lancé qui explose', ic: ['rune', 'meteor'], gain: 1, d: 'Lance un sceau sur la cible lointaine : il explose après un instant puis reste au sol, utilisable pour la permutation.',
    cast: (P, E) => { const q = far(P, E, 360); const x = q.t ? q.t.x : q.x, y = q.t ? q.t.y : q.y; NK.delayed({ at: () => ({ x, y }), r: 52, delay: 0.7, mult: 1.6, kb: 120, cross: 1, onHit: () => { if (!dirSolid(x, y)) { NM.seals.push({ x, y, t: G.t + 10, kind: 'seuil' }); if (NM.seals.length > 9) NM.seals.shift(); } } })(P, E); } });
  R(F4, 4, { n: 'Neuf flammes-renards', type: 'offensive', role: 'Éventail de neuf flammes', ic: ['star', 'needles'], cost: 2, d: 'Neuf flammes en forme de renard partent en éventail et portent loin.',
    cast: (P, E) => { const k = nmSpend(P, F4, 2); volley({ n: 9, spread: 0.11, spd: 420, life: 0.9, r: 9, mult: 0.45 * k, look: 'orb' })(P, E); } });
  R(F4, 6, { n: 'Rayon du renard céleste', type: 'offensive', role: 'Long faisceau doré', ic: ['bolt', 'star'], cost: 2, d: 'Les queues se rejoignent et projettent un long rayon doré qui traverse tout.',
    cast: (P, E) => { const k = nmSpend(P, F4, 2); beam({ len: 340, w: 12, dur: 0.8, mult: 0.36 * k })(P, E); } });
  R(F4, 7, { n: 'Sceau de permutation', type: 'mobilité', role: 'Échange explosif avec un sceau', ic: ['portal', 'rune'], mob: true, cost: 1, d: 'Échange la position du joueur avec un sceau actif ; les deux points explosent.',
    cast: (P, E) => { let s = null, bd = 380; for (const q of NM.seals) { const d = dist(P.x, P.y, q.x, q.y); if (d < bd && d > 12) { bd = d; s = q; } } if (!s) { toast('Aucun sceau à portée', PALS[F4][3]); return; } if (dirSolid(s.x, s.y)) { toast('Sceau obstrué', PALS[F4][3]); return; } nmSpend(P, F4, 1);
      const ox = P.x, oy = P.y; P.x = s.x; P.y = s.y; s.x = ox; s.y = oy; P.iframes = Math.max(P.iframes, 0.3); sfx(F4 + '_i'); for (const [x, y] of [[P.x, P.y], [ox, oy]]) { nmAoe(P, x, y, 48, E, 1.0, { kb: 120 }); ring(x, y, 50, PALS[F4][3], 0.4, 3); } } });

  // ================= 5. DIX OMBRES =================
  const F5 = 'dixombres';
  R(F5, 1, { n: 'Meute lancée', type: 'offensive', role: 'Quatre loups d\'ombre chercheurs', ic: ['fang', 'skull'], inv: true, gain: 5, d: 'Quatre loups d\'ombre bondissent vers les ennemis, chacun sur une cible différente si possible, et les marquent.',
    cast: (P, E) => { const ens = G.enemies.filter(e => !e.dead && dist(P.x, P.y, e.x, e.y) < 380).sort((a, b) => dist(P.x, P.y, a.x, a.y) - dist(P.x, P.y, b.x, b.y)); for (let i = 0; i < 4; i++) later(() => { const t = ens.length ? ens[i % ens.length] : null; const E2 = t ? Object.assign({}, E, { t, tx: t.x, ty: t.y, a: Math.atan2(t.y - P.y, t.x - P.x) }) : E; PJ({ look: 'wolf', s: 1.3, spd: 420, life: 1.0, r: 11, mult: 0.75, homing: 6, kb: 70, onHit: (P2, e) => nmMark(P2, e, F5, 8) })(P, E2); }, i * 90); } });
  R(F5, 3, { n: 'Rapace d\'ombre', type: 'offensive', role: 'Plongée perforante', ic: ['wings', 'skull'], inv: true, d: 'Le Rapace plonge en ligne droite sur une longue distance et transperce tout sur son passage.',
    cast: lance({ look: 'bird', s: 1.6, spd: 520, life: 0.8, r: 14, mult: 1.4, kb: 90 }) });
  R(F5, 7, { n: 'Serpent d\'ombre', type: 'offensive', role: 'Serpent qui file au sol', ic: ['whip', 'skull'], inv: true, gain: 6, d: 'Le Serpent glisse au ras du sol sur une longue distance, mord et ralentit tout ce qu\'il traverse.',
    cast: wave({ spd: 260, len: 360, w: 30, mult: 0.95, kb: 40, onHit: (P, e) => nmCtl(P, e, 'slow', F5) }) });
  R(F5, 9, { n: 'Essaim des ombres', type: 'offensive', role: 'Nuée qui s\'abat sur une zone', ic: ['ring', 'skull'], inv: true, cost: 18, d: 'L\'Essaim s\'abat en nuée sur la zone visée, loin devant, et frappe tout ce qui s\'y trouve.',
    cast: (P, E) => { nmSpend(P, F5, 18); NM.dxShow = performance.now() + 1200; rain({ n: 22, r: 85, dur: 1.4, mult: 0.42, look: 'bird', s: 0.6, range: 380 })(P, E); } });

  // ================= 6. ARSENAL DU ROI DÉCHU =================
  const F6 = 'arsenal';
  const dk = () => NM.decree === 'assaut' ? 1.25 : 1;
  R(F6, 1, { n: 'Lame jurée projetée', type: 'offensive', role: 'Grande lame lancée en tournoyant', ic: ['sword'], gain: 8, d: 'Une grande lame-relique est lancée en tournoyant : elle traverse les ennemis puis revient vers le joueur.',
    cast: (P, E) => PJ({ look: 'sword', s: 2.0, spd: 440, life: 0.8, r: 16, pierce: 99, ret: 1, mult: 1.2 * dk(), kb: 110 })(P, aimAt(P, E, 380)) });
  R(F6, 2, { n: 'Pluie d\'épées royales', type: 'offensive', role: 'Épées qui tombent du ciel', ic: ['sword', 'meteor'], gain: 6, d: 'Des dizaines d\'épées-reliques tombent du ciel sur la zone visée.',
    cast: (P, E) => rain({ n: 20, r: 80, dur: 1.2, mult: 0.5 * dk(), look: 'sword', s: 1.2, aoe: 20, range: 400 })(P, E) });
  R(F6, 5, { n: 'Salve de lances', type: 'offensive', role: 'Cinq lances perforantes', ic: ['spear', 'spear'], cost: 10, d: 'Cinq lances royales partent en salve et traversent les rangs ennemis.',
    cast: (P, E) => { const k = nmSpend(P, F6, 10); volley({ n: 5, spread: 0.09, spd: 560, life: 0.75, r: 10, pierce: 99, mult: 0.8 * k * dk(), look: 'spear', s: 1.2, kb: 90 })(P, E); } });
  R(F6, 7, { n: 'Couronne d\'autorité', type: 'offensive', role: 'Couronne de lames + décret', ic: ['star', 'sword'], gain: 6, d: 'Huit lames forment une couronne puis partent une à une vers les ennemis ; le décret change (assaut → garde → poursuite) et modifie les reliques suivantes.',
    cast: (P, E) => { const order = ['assaut', 'garde', 'poursuite']; NM.decree = order[(order.indexOf(NM.decree) + 1) % 3]; toast('Décret : ' + { assaut: 'Assaut', garde: 'Garde', poursuite: 'Poursuite' }[NM.decree], PALS[F6][3]);
      barrage({ n: 8, gap: 75, spd: 520, life: 0.85, r: 9, mult: 0.45 * dk(), look: 'sword', homing: 5, st: NM.decree === 'poursuite' ? 'vuln' : null })(P, E); } });
  R(F6, 10, { n: 'Exécution royale', type: 'offensive', role: 'Épée colossale tombée du ciel', ic: ['sword', 'star'], cost: 30, d: 'Une épée colossale tombe du ciel sur la cible lointaine : impact annoncé, onde de choc tout autour.',
    cast: (P, E) => { const k = nmSpend(P, F6, 30); strike({ range: 420, r: 70, delay: 0.85, mult: 3.0 * k * dk(), kb: 200, shk: 12, cross: 1 })(P, E); } });

  // ================= 7. ARCHITECTE DES STRUCTURES =================
  const F7 = 'architecte';
  R(F7, 2, { n: 'Pieu projeté', type: 'offensive', role: 'Poutre lancée perforante', ic: ['column', 'spear'], gain: 5, d: 'Assemble une poutre de charpente et la projette comme un pieu : elle traverse les ennemis sur une longue distance.',
    cast: lance({ look: 'spear', s: 1.7, spd: 520, life: 0.8, r: 14, mult: 1.5, kb: 160 }) });
  R(F7, 5, { n: 'Baliste instantanée', type: 'offensive', role: 'Trois carreaux lourds', ic: ['gear', 'spear'], cost: 12, d: 'Une baliste s\'assemble en un instant et tire trois carreaux lourds vers la cible.',
    cast: (P, E) => { nmSpend(P, F7, 12); barrage({ n: 3, gap: 200, spd: 600, life: 0.75, r: 11, mult: 1.0, pierce: 3, look: 'spear', s: 1.4, homing: 2, kb: 160, rand: 0.05 })(P, E); } });
  R(F7, 6, { n: 'Catapulte', type: 'offensive', role: 'Bloc lancé en cloche', ic: ['gear', 'meteor'], cost: 14, d: 'Une catapulte expédie un bloc massif en cloche sur la cible lointaine : impact annoncé, gros dégâts de zone.',
    cast: (P, E) => { nmSpend(P, F7, 14); strike({ range: 420, r: 58, delay: 0.9, mult: 2.2, kb: 170, shk: 9 })(P, E); } });
  R(F7, 8, { n: 'Rail de poutres', type: 'offensive', role: 'Poutres qui surgissent en ligne', ic: ['column', 'wave'], cost: 16, d: 'Une ligne de poutres jaillit du sol, l\'une après l\'autre, vers l\'avant et projette les ennemis.',
    cast: (P, E) => { nmSpend(P, F7, 16); wave({ spd: 300, len: 340, w: 34, mult: 1.1, kb: 160 })(P, E); } });
  R(F7, 9, { n: 'Effondrement de charpente', type: 'offensive', role: 'Poutres qui s\'abattent', ic: ['column', 'meteor'], cost: 20, d: 'Une charpente entière s\'assemble au-dessus de la zone visée puis s\'effondre poutre par poutre.',
    cast: (P, E) => { nmSpend(P, F7, 20); rain({ n: 14, r: 80, dur: 1.2, mult: 0.75, look: 'block', s: 1.3, aoe: 26, range: 400 })(P, E); } });
  R(F7, 10, { n: 'Batterie de tourelles', type: 'offensive', role: 'Trois tourelles', ic: ['gear', 'star'], cost: 30, d: 'Construit trois tourelles autour du joueur ; elles tirent sur les ennemis visibles jusqu\'à épuisement.',
    cast: (P, E) => { nmSpend(P, F7, 30); for (let i = 0; i < 3; i++) { const a = P.aim + (i - 1) * 1.2, x = P.x + Math.cos(a) * 34, y = P.y + Math.sin(a) * 22; if (dirSolid(x, y)) continue; const b = { kind: 'tourelle', x, y, r: 8, solid: 1, hp: 4, dur: 14, shots: 7, cd: 0.3 + i * 0.2, t: G.t + 14, hp0: 4 }; NM.builds.push(b); } sfx(F7 + '_c'); } });

  // ================= 8. MANIPULATION DE L'ÉNERGIE =================
  const F8 = 'energie';
  const take = (P, n) => { const v = Math.min(nmRes(P, F8), n); nmSet(P, F8, nmRes(P, F8) - v); return v; };
  R(F8, 1, { n: 'Trait d\'énergie', type: 'offensive', role: 'Trois traits rapides', ic: ['bolt', 'orb'], gain: 4, d: 'Trois traits d\'énergie pure partent coup sur coup, très vite et très loin.',
    cast: barrage({ n: 3, gap: 90, spd: 640, life: 0.65, r: 7, mult: 0.6, look: 'orb', s: 0.8, homing: 2, rand: 0.04 }) });
  R(F8, 5, { n: 'Lance d\'énergie', type: 'offensive', role: 'Lance perforante géante', ic: ['spear', 'bolt'], d: 'Condense la réserve en une lance géante qui traverse tout ; plus la réserve dépensée est haute (jusqu\'à 30), plus elle frappe fort.',
    cast: (P, E) => { const v = take(P, 30); lance({ look: 'spear', s: 1.4 + v / 30, mult: 1.3 + v / 20, boom: 40 + v, boomM: 0.5 + v / 50 })(P, E); } });
  R(F8, 6, { n: 'Pluie d\'énergie', type: 'offensive', role: 'Barrage tombant du ciel', ic: ['meteor', 'orb'], cost: 16, d: 'Des dizaines de projectiles d\'énergie tombent sur la zone visée.',
    cast: (P, E) => { nmSpend(P, F8, 16); rain({ n: 20, r: 80, dur: 1.2, mult: 0.48, look: 'orb', range: 400 })(P, E); } });
  R(F8, 9, { n: 'Faisceau prismatique', type: 'offensive', role: 'Trois faisceaux en éventail', ic: ['bolt', 'star'], cost: 24, d: 'Un faisceau d\'énergie se divise en trois longs rayons en éventail.',
    cast: (P, E) => { const k = nmSpend(P, F8, 24); for (const d of [-0.22, 0, 0.22]) beam({ len: 330, w: 9, dur: 0.75, mult: 0.17 * k, track: 0 })(P, Object.assign({}, E, { a: aimAt(P, E, 330).a + d })); } });

  // ================= 9. ART DE LA DÉCOUPE =================
  const F9 = 'decoupe';
  R(F9, 4, { n: 'Croissants de rupture', type: 'offensive', role: 'Trois lames-croissants', ic: ['blade', 'ring'], gain: 5, d: 'Trois croissants de rupture partent en éventail et tranchent tout sur leur passage.',
    cast: volley({ n: 3, spread: 0.2, spd: 460, life: 0.8, r: 12, pierce: 99, mult: 0.85, look: 'crescent', s: 1.4, st: 'bleed' }) });
  R(F9, 6, { n: 'Lame volante', type: 'offensive', role: 'Croissant géant perforant', ic: ['blade', 'bolt'], mp: 10, cd: 3, gain: 4, d: 'Un grand croissant de coupe file très loin et traverse les ennemis.',
    cast: lance({ look: 'crescent', s: 2.2, spd: 520, life: 0.8, r: 16, mult: 1.3, st: 'bleed', kb: 60 }) });
  R(F9, 8, { n: 'Tranchant à distance', type: 'offensive', role: 'Ligne de coupe instantanée', ic: ['blade', 'cross'], cost: 14, d: 'Une ligne de rupture instantanée se trace sur une grande longueur et sectionne tout ce qu\'elle traverse.',
    cast: (P, E) => { const k = nmSpend(P, F9, 14); beam({ len: 360, w: 6, dur: 0.22, tick: 0.07, mult: 0.8 * k, st: 'bleed', delay: 0.15, track: 0 })(P, E); } });

  // ================= 10. SCEAU DE POSSESSION =================
  const F10 = 'possession';
  const lv = (P) => nmFormOn(P, 'possessionu') ? 3 : nmFormOn(P, 'possession') ? 2 : nmFormOn(P, 'possession1') ? 1 : 0;
  R(F10, 1, { n: 'Poing spectral projeté', type: 'offensive', role: 'Poing ancestral à distance', ic: ['fist', 'rune'], gain: 8, d: 'La conscience ancestrale projette un poing spectral blanc et rouge qui frappe loin et marque la cible.',
    cast: (P, E) => PJ({ look: 'fist', s: 1.6 + lv(P) * 0.3, spd: 500, life: 0.75, r: 15, pierce: 2, mult: 1.2 * (1 + lv(P) * 0.2), kb: 200, onHit: (P2, e) => nmMark(P2, e, F10, 10) })(P, aimAt(P, E, 380)) });
  R(F10, 2, { n: 'Regard foudroyant', type: 'offensive', role: 'Éclair du regard sur la cible', ic: ['eye', 'bolt'], gain: 6, d: 'Les yeux rouges s\'allument : un éclair blanc et rouge frappe instantanément la cible lointaine et l\'expose.',
    cast: (P, E) => { const q = far(P, E, 360); if (!q.t) { beam({ len: 300, w: 6, dur: 0.2, mult: 0.6 })(P, E); return; } const t = q.t; nmHit(P, t, E, 1.3 * (1 + lv(P) * 0.2), { kb: 60 }); nmCtl(P, t, 'vuln', F10); sfx(F10 + '_i');
      mfx({ life: 0.3, x: t.x, y: t.y, big: 1, passes: ['glow'], upd() { }, draw(m, ctx, cx, cy) { ctx.globalAlpha = 1 - m.t / 0.3; let x0 = P.x - cx, y0 = P.y - cy - 24; const x1 = t.x - cx, y1 = t.y - cy - 12; for (let i = 1; i <= 6; i++) { const u = i / 6, x = x0 + (x1 - x0) / (7 - i) + rnd(-6, 6) * (i < 6), y = y0 + (y1 - y0) / (7 - i) + rnd(-6, 6) * (i < 6); pxLine(ctx, x0, y0, x, y, '#ff2a3a', 4); pxLine(ctx, x0, y0, x, y, '#ffffff', 2); x0 = x; y0 = y; void u; } ctx.globalAlpha = 1; } }); } });
  R(F10, 5, { n: 'Salve ancestrale', type: 'offensive', role: 'Six lames spectrales', ic: ['sword', 'skull'], gain: 6, d: 'Six lames spectrales apparaissent autour du joueur et filent vers les ennemis.',
    cast: (P, E) => barrage({ n: 6, gap: 70, spd: 500, life: 0.9, r: 9, mult: 0.5 * (1 + lv(P) * 0.2), look: 'sword', homing: 5 })(P, E) });
  R(F10, 6, { n: 'Piliers ancestraux', type: 'offensive', role: 'Piliers de lumière en ligne', ic: ['column', 'rune'], cost: 15, d: 'Des piliers de lumière rouge et blanche jaillissent du sol l\'un après l\'autre, droit vers la cible.',
    cast: (P, E) => { const k = nmSpend(P, F10, 15); const a = aimAt(P, E, 320).a; for (let i = 1; i <= 6; i++) later(() => { const x = P.x + Math.cos(a) * i * 50, y = P.y + Math.sin(a) * i * 50; if (dirSolid(x, y)) return; nmAoe(P, x, y, 30, E, 0.75 * k * (1 + lv(P) * 0.15), { kb: 90 }); ring(x, y, 30, i % 2 ? '#ff2a3a' : '#ffffff', 0.35, 3); nmFx(x, y, F10, 8, 70); }, i * 80); } });
  R(F10, 7, { n: 'Griffes spectrales', type: 'offensive', role: 'Trois griffes projetées', ic: ['thorn', 'skull'], cost: 10, d: 'Trois griffes spectrales en croissant sont projetées en éventail et lacèrent à distance.',
    cast: (P, E) => { const k = nmSpend(P, F10, 10); volley({ n: 3, spread: 0.16, spd: 470, life: 0.8, r: 12, pierce: 99, mult: 0.8 * k * (1 + lv(P) * 0.2), look: 'crescent', s: 1.3, st: 'bleed' })(P, E); } });
  R(F10, 8, { n: 'Déchaînement', type: 'offensive', role: 'Dix frappes spectrales sur la zone', ic: ['spiral', 'rune'], cost: 18, d: 'La conscience se déchaîne : dix frappes spectrales s\'abattent sur la zone visée.',
    cast: (P, E) => { const k = nmSpend(P, F10, 18); rain({ n: 10, r: 70, dur: 1.0, mult: 0.85 * k * (1 + lv(P) * 0.2), look: 'fist', s: 1.1, aoe: 26, range: 380 })(P, E); } });
  R(F10, 4, { n: 'Décharge du Sceau', type: 'offensive', role: 'Long faisceau du sceau', ic: ['bolt', 'rune'], d: 'Décharge en un long faisceau ; la puissance dépend de la synchronisation consommée (jusqu\'à 30).',
    cast: (P, E) => { const v = Math.min(nmRes(P, F10), 30); nmSet(P, F10, nmRes(P, F10) - v); beam({ len: 320, w: 12, dur: 0.6, mult: (0.35 + v / 60) * (1 + lv(P) * 0.2) })(P, E); } });

  // ================= 11. DRAGON DIVIN =================
  const F11 = 'dragon';
  const tk = (P) => { const v = nmRes(P, F11); return 1 + ((v >= 67 ? 3 : v >= 34 ? 2 : 1) - 1) * 0.18; };
  R(F11, 1, { n: 'Écailles-lames', type: 'offensive', role: 'Six écailles chercheuses', ic: ['shield', 'needles'], gain: 8, d: 'Six écailles dorées se détachent et filent comme des lames vers les ennemis.',
    cast: (P, E) => barrage({ n: 6, gap: 60, spd: 520, life: 0.9, r: 8, mult: 0.5 * tk(P), look: 'scale', homing: 5 })(P, E) });
  R(F11, 3, { n: 'Souffle du jugement céleste', type: 'offensive', role: 'Souffle canalisé très long', ic: ['cloud', 'sun'], cost: 20, d: 'Souffle concentré sur une très grande distance, balayable lentement ; pendant la canalisation, le joueur est exposé sur les côtés.',
    cast: (P, E) => { const k = nmSpend(P, F11, 20) * tk(P); gbuff(P, 'nmsouffle', 1.5, { spd: -0.7, dr: -0.2 }); beam({ len: 380, w: 16, dur: 1.4, mult: 0.3 * k, tick: 0.12, track: 0.35, delay: 0.2 })(P, E); NM.breath3d = performance.now() + 1600; } });
  R(F11, 4, { n: 'Comète draconique', type: 'offensive', role: 'Comète de souveraineté', ic: ['meteor', 'sun'], gain: 6, d: 'Un projectile de souveraineté en forme de comète traverse les ennemis et explose en bout de course.',
    cast: (P, E) => lance({ look: 'orb', s: 2.0, spd: 460, life: 0.9, r: 16, mult: 1.4 * tk(P), boom: 70, boomM: 1.0 * tk(P), kb: 150 })(P, E) });
  R(F11, 7, { n: 'Trois têtes ancestrales', type: 'offensive', role: 'Trois souffles simultanés', ic: ['star', 'fang'], cost: 25, d: 'Trois têtes de dragons ancestraux apparaissent derrière le joueur et soufflent ensemble trois longs faisceaux.',
    cast: (P, E) => { const k = nmSpend(P, F11, 25) * tk(P); const a = aimAt(P, E, 340).a; for (const d of [-0.25, 0, 0.25]) beam({ len: 340, w: 11, dur: 0.9, mult: 0.17 * k, track: 0 })(P, Object.assign({}, E, { a: a + d })); NM.breath3d = performance.now() + 1100; } });
  R(F11, 9, { n: 'Rugissement de l\'Empereur', type: 'offensive', role: 'Onde de rugissement à longue portée', ic: ['note', 'sun'], cost: 15, d: 'Le rugissement part en une onde destructrice sur une longue distance ; les ennemis touchés voient leur précision réduite. Aucun étourdissement des boss.',
    cast: (P, E) => { const k = nmSpend(P, F11, 15) * tk(P); wave({ spd: 360, len: 380, w: 50, mult: 1.1 * k, kb: 160, onHit: (P2, e) => nmCtl(P2, e, 'blind', F11) })(P, E); } });

  // ================= 12. LÉVIATHAN =================
  const F12 = 'leviathan';
  const tl = (P) => { const v = nmRes(P, F12); return 1 + ((v >= 67 ? 3 : v >= 34 ? 2 : 1) - 1) * 0.18; };
  R(F12, 1, { n: 'Lance des abysses', type: 'offensive', role: 'Lance perforante qui marque', ic: ['spear', 'wave'], gain: 8, d: 'Une lance d\'os et d\'eau noire traverse les ennemis sur une longue distance et marque chacun d\'eux.',
    cast: (P, E) => lance({ look: 'spear', s: 1.5, mult: 1.2 * tl(P), onHit: (P2, e) => nmMark(P2, e, F12, 8) })(P, E) });
  R(F12, 4, { n: 'Torrent abyssal', type: 'offensive', role: 'Jet d\'eau sous pression', ic: ['wave', 'bolt'], cost: 12, d: 'Un jet d\'eau abyssale sous une pression écrasante part en long faisceau et repousse les ennemis légers.',
    cast: (P, E) => { const k = nmSpend(P, F12, 12) * tl(P); beam({ len: 340, w: 14, dur: 0.9, mult: 0.26 * k, kb: 90 })(P, E); } });
  R(F12, 6, { n: 'Geysers des profondeurs', type: 'offensive', role: 'Geysers en ligne', ic: ['wave', 'column'], cost: 14, d: 'Cinq geysers abyssaux jaillissent l\'un après l\'autre en ligne vers la cible.',
    cast: (P, E) => { const k = nmSpend(P, F12, 14) * tl(P); const a = aimAt(P, E, 320).a; for (let i = 1; i <= 5; i++) later(() => { const x = P.x + Math.cos(a) * i * 60, y = P.y + Math.sin(a) * i * 60; if (dirSolid(x, y)) return; NK.delayed({ at: () => ({ x, y }), r: 34, delay: 0.25, mult: 0.9 * k, kb: 120 })(P, E); }, i * 110); } });
})();
