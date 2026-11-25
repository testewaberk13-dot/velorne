'use strict';
// =====================================================================
//  NOUVELLES MAGIES (25/11) — SOCLE
//  12 familles ajoutées aux 27 historiques (qui ne sont pas modifiées) : 5 épiques à transformation,
//  5 épiques non transformationnelles, 2 légendaires. Chaque famille : 10 compétences + 1 ultime.
//  Source : dossier « Vélorne — 12 nouvelles magies, 132 compétences » (25/11).
//  Les coûts, recharges, durées et puissances sont des valeurs de prototypage (« à prototyper »),
//  regroupées ici pour pouvoir être équilibrées sans toucher aux mécaniques.
// =====================================================================
const NM = {
  // clé interne, nom validé, rareté (4 épique, 5 légendaire), catégorie, ressource, palette (5 tons), élément de dégâts
  META: {
    orochi: { n: 'Yamata no Orochi', tier: 4, cat: 'transfo', res: 'Coordination', max: 100, el: 'physique', pal: ['#07090a', '#26331d', '#5f7438', '#c9b46a', '#f3e7b3'], desc: 'Un seul organisme ancestral à huit têtes coordonnées : morsures, souffles et gardes des cous.' },
    phenix: { n: 'Phénix', tier: 4, cat: 'transfo', res: 'Cycle de Cendres', max: 100, el: 'feu', pal: ['#240603', '#8e1c08', '#ff6a1a', '#ffc04a', '#fff4d0'], desc: 'Combustion, dispersion en cendres et reconstruction ; mobilité aérienne.' },
    titan: { n: 'Titan', tier: 4, cat: 'transfo', res: 'Inertie', max: 100, el: 'physique', pal: ['#18141c', '#43384c', '#8a7898', '#d6c6e0', '#fff1e2'], desc: 'Masse, inertie, ancrage et force physique : le corps devient un colosse vivant.' },
    kitsune: { n: 'Kitsune', tier: 4, cat: 'transfo', res: 'Sceaux-renards', max: 9, el: 'arcane', pal: ['#38080e', '#c42a2a', '#f2ead8', '#ffd36a', '#ffffff'], desc: 'Queues ancestrales et sceaux tactiques : gardes, frappes, permutations.' },
    dixombres: { n: 'Dix Ombres', tier: 4, cat: 'transfo', res: 'Commandement', max: 100, el: 'ombre', pal: ['#020104', '#130b1e', '#3d2c56', '#8d7cab', '#dcd4f2'], desc: 'Dix créatures d\'ombre tangibles, chacune avec son rôle, liées à une réserve commune.' },
    arsenal: { n: 'Arsenal du Roi déchu', tier: 4, cat: 'maitrise', res: 'Autorité royale', max: 100, el: 'physique', pal: ['#14110c', '#4a4030', '#8a7a4a', '#d4b45a', '#f6e8b8'], desc: 'Reliques royales à décrets : lames, sceptre, égide, chaînes, marteau, combinaisons de succession.' },
    architecte: { n: 'Architecte des structures', tier: 4, cat: 'maitrise', res: 'Plans et matériaux', max: 100, el: 'physique', pal: ['#1a140e', '#5a4430', '#9a7a52', '#c8b08a', '#eef0f4'], desc: 'Ouvrages temporaires assemblés : passerelles, piliers, pièges, remparts, tourelles.' },
    energie: { n: 'Manipulation de l\'Énergie', tier: 4, cat: 'maitrise', res: 'Réserve énergétique', max: 100, el: 'arcane', pal: ['#0c0c1e', '#3a3a8a', '#9aa8ff', '#dce4ff', '#ffffff'], desc: 'Créer, condenser, moduler et libérer sa propre énergie neutre.' },
    decoupe: { n: 'Art de la Découpe', tier: 4, cat: 'maitrise', res: 'Précision de coupe', max: 100, el: 'physique', pal: ['#0a0204', '#3a0610', '#9a1428', '#e05060', '#fff0f2'], desc: 'Marquer, tracer des lignes de rupture et déclencher une section précise.' },
    possession: { n: 'Sceau de Possession', tier: 4, cat: 'maitrise', res: 'Synchronisation', max: 100, el: 'arcane', pal: ['#120206', '#6a0a14', '#d01e2e', '#f2e8e8', '#ffffff'], desc: 'Réceptacle d\'une conscience ancestrale : marques, frappes ancestrales, possession absolue.' },
    dragon: { n: 'Dragon divin', tier: 5, cat: 'legende', res: 'Souveraineté draconique', max: 100, el: 'arcane', pal: ['#14100a', '#6a5a2a', '#e8cf7a', '#f6f0e0', '#ffffff'], desc: 'Souveraineté d\'un dragon primordial : présence, souffle originel, incarnation.' },
    leviathan: { n: 'Léviathan', tier: 5, cat: 'legende', res: 'Profondeur abyssale', max: 100, el: 'eau', pal: ['#01050a', '#06223a', '#0e5a7a', '#3fe0d0', '#c8fff6'], desc: 'Pression abyssale, courants de dérive, mâchoires et manifestation de l\'hôte.' },
  },
  KEYS: [], DATA: {}, // DATA[id] : fiche de données de chaque compétence (voir nmSkill)
};
NM.KEYS = Object.keys(NM.META);
const NM_CATS = { transfo: 'Magie épique — transformation', maitrise: 'Magie épique', legende: 'Magie légendaire' };
// ---------------- enregistrement dans le système de magie existant ----------------
(function () {
  for (const k of NM.KEYS) {
    const M = NM.META[k];
    PALS[k] = M.pal;
    MAGIC_CATS[M.cat] = NM_CATS[M.cat];
    // les 3 « sorts de base » ne sont jamais proposés pour ces familles (le grimoire les remplace d'emblée) ;
    // ils ne servent qu'aux icônes génériques des écrans existants (type de sort)
    MAGIC_DATA[k] = MF(M.n, M.pal[2], M.el, M.tier, M.cat, null, M.desc, '', [
      { n: '—', k: 'proj', p: 1, mp: 14, cd: 3 }, { n: '—', k: 'burst', p: 1, mp: 18, cd: 6, r: 44 }, { n: '—', k: 'nova', p: 1, mp: 22, cd: 9, r: 70 }]);
    MAGIC_DATA[k].nm = true; MAGIC_KEYS.push(k);
    if (typeof MAGIC_FAMILIES !== 'undefined') MAGIC_FAMILIES[k] = MAGIC_DATA[k];
    // grimoire de famille (même règle que les 27 : épiques et légendaires liés au personnage, sur les boss et dans les coffres)
    if (typeof REG !== 'undefined' && typeof C === 'function' && !REG['gf_' + k]) REG['gf_' + k] = C({ id: 'gf_' + k, name: 'Grimoire de ' + M.n, kind: 'grimoire', stack: 1, rarity: Math.min(5, M.tier + 1), icon: 'Scroll0003', price: 0, tradeRules: 'bound', learnFam: k, desc: 'Apprend la famille ' + M.n + ' (' + MAGIC_TIERS[M.tier].n + '). Elle devient ta seconde magie et se maîtrise comme les autres.' });
    // sons de famille (même générateur que les 27 familles)
    const SNDN = { orochi: ['rm', 180, 70, 'sawtooth'], phenix: ['ch', 700, 1500, 'triangle'], titan: ['rm', 90, 40, 'sawtooth'], kitsune: ['ch', 900, 1600, 'sine'], dixombres: ['dk', 160, 60, 'sine'], arsenal: ['cl', 700, 1200, 'square'], architecte: ['cl', 500, 900, 'square'], energie: ['ch', 600, 1400, 'sine'], decoupe: ['cr', 2200, 3200, 'triangle'], possession: ['gh', 300, 160, 'sawtooth'], dragon: ['rm', 220, 90, 'sawtooth'], leviathan: ['dk', 120, 45, 'sine'] }[k];
    const [ty, f0, f1, wv] = SNDN, air = ['ws', 'bp', 'rs', 'wt', 'dk'].includes(ty), hard = ['rm', 'cl', 'zp', 'cr'].includes(ty);
    SFX[k + '_c'] = () => { noise(.22, air ? .3 : .18, air ? 1100 : 2600, 0, 'bandpass'); tone(f0, f1, .26, wv, .07); if (!air) tone(f1, f1 * 1.5, .14, 'sine', .035, .08); };
    SFX[k + '_i'] = () => { noise(.32, hard ? .5 : .32, hard ? 500 : 1400); tone(f1, Math.max(30, f0 * 0.4), .3, wv, .1); if (ty === 'ch' || ty === 'gh') tone(f1 * 1.5, f1 * 2, .5, 'sine', .05, .05); };
    SFX[k + '_u'] = () => { noise(1.2, .5, 400); tone(f0 * 0.6, f1 * 1.5, 1.1, wv, .12); tone(f1 * 0.3, 30, .9, 'sawtooth', .2, .5); noise(.9, .6, 1800, .5, 'bandpass'); };
  }
})();
// ---------------- grimoire à 11 compétences ----------------
// Rangement : C1…C9 = compétences 1 à 9, C10 = ULTIME (même convention que les 27 familles, donc l'ultime
// fonctionne avec le système existant), C11 = compétence 10. Identifiants stables : NM-<famille>-01…10 et NM-<famille>-U.
const NM_MP = [14, 18, 18, 22, 26, 22, 26, 26, 30, 0, 34], NM_CD = [3, 6, 5, 9, 11, 9, 12, 13, 16, 0, 20];
function NMFAM(fam, list, ult) {
  if (list.length !== 10) console.error('NMFAM ' + fam + ' : 10 compétences attendues, ' + list.length);
  const arr = [...list.slice(0, 9), ult, list[9]];
  GRIMOIRE[fam] = arr.map((s, i) => {
    const no = i === 9 ? 'U' : String(i < 9 ? i + 1 : 10).padStart(2, '0');
    s.id = 'NM-' + fam + '-' + no; s.fam = fam; s.ult = i === 9; s.no = i === 9 ? 11 : (i < 9 ? i + 1 : 10);
    if (s.mp === undefined) s.mp = NM_MP[i]; if (s.cd === undefined) s.cd = NM_CD[i]; s.bg = s.bg || PALS[fam][1];
    const c0 = s.cast; s.raw = c0; s.cast = (P, E) => { NM.last = s.id; NM.casts[s.id] = (NM.casts[s.id] || 0) + 1;
      let k = 1; const b = NM.bonus[fam]; if (b && b.t > G.t && !s.setsBonus && !s.mob) { k *= b.k; delete NM.bonus[fam]; num(P.x, P.y - 46, b.label || 'Ouverture', PALS[fam][4], true); }
      if (s.inv && NM.discount) { P.mp = Math.min(P.st8.maxmp, P.mp + s.mp * 0.5); NM.discount = false; }
      let PP = P; const w = NM.wisp; if (fam === 'kitsune' && w && w.t > G.t && !s.mob && !s.setsBonus) { PP = Object.create(P); PP.x = w.x; PP.y = w.y; NM.wisp = null; E = Object.assign({}, E, { a: E.t ? Math.atan2(E.t.y - w.y, E.t.x - w.x) : E.a }); ring(w.x, w.y, 30, PALS.kitsune[3], 0.4, 3); }
      try { c0(PP, nmK(E, k)); } catch (er) { console.error('NM cast ' + s.id, er); }
      if (s.gain) nmGain(P, fam, s.gain); if (NM.after[fam]) try { NM.after[fam](P, E, s); } catch (er) { console.error(er); } };
    NM.DATA[s.id] = { id: s.id, famille: NM.META[fam].n, rarete: NM.META[fam].tier === 5 ? 'Légendaire' : 'Épique', no: s.no, n: s.n, type: s.type || '—', role: s.role, d: s.d, mana: s.mp, recharge: s.cd, ressource: s.cost ? '−' + s.cost : (s.gain ? '+' + s.gain : '—'), boss: s.boss || 'dégâts normaux, aucun contrôle garanti', valeurs: 'à prototyper' };
    return s;
  });
}
NM.casts = {}; NM.bonus = {}; NM.after = {};
// niveau de maîtrise requis : compétences 1–3 d'emblée, puis 4…10, ultime au niveau 10
SKILL_LVL[11] = 9;
{ const so = skillOpen; skillOpen = function (P, fam, n) { if (NM.META[fam] && n === 11) return magLevel(P, fam) >= 9; return so(P, fam, n); }; }
{ const eq = equipM; equipM = function (P, slot, sel) {
    const fam = slot === 'm2' ? P.magic2 : P.magic;
    if (fam && NM.META[fam] && sel === 'C11') {
      if (!grimSpell(fam, 11) || !skillOpen(P, fam, 11)) return false; P.eqM = P.eqM || {};
      for (const k of ['s1', 's2', 's3', 's5', 'm2']) if (k !== slot && (P.eqM[k] || defSel(P, k)) === sel && (k === 'm2' ? P.magic2 : P.magic) === fam) P.eqM[k] = equippedSel(P, slot);
      P.eqM[slot] = sel; P.cd[slot] = 0; return true;
    }
    return eq(P, slot, sel);
  }; }
// écran du grimoire pour ces familles : 10 compétences + ultime, sans « sorts de base »
{ const gh = grimHTML; grimHTML = function (P) {
    const fam = P.magic; if (!fam || !NM.META[fam]) return gh(P);
    const GR = GRIMOIRE[fam], F = MAGIC_DATA[fam], M = NM.META[fam], info = magXpInfo(P, fam); const pct = info.next ? Math.round((info.x - info.base) / (info.next - info.base) * 100) : 100;
    const order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10];
    let h = `<div class="sk"><div><b style="color:${F.col}">${esc(M.n)} — maîtrise ${info.l}/10</b> <small>${info.next ? info.x + ' / ' + info.next + ' XP' : 'maîtrise complète'} · ${esc(NM_CATS[M.cat])} · ressource : ${esc(M.res)} ${Math.round(nmRes(P, fam))}/${M.max}</small><div style="height:6px;background:#2a1f33;border-radius:3px;margin:4px 0"><i style="display:block;height:6px;width:${pct}%;background:${F.col};border-radius:3px"></i></div></div></div>`;
    for (const [sl, n] of [['s1', 1], ['s2', 2], ['s3', 3], ['s5', 5]]) {
      const cur = equippedSel(P, sl); const opts = [];
      for (const i of order) if (skillOpen(P, fam, i + 1)) opts.push(['C' + (i + 1), GR[i].n]);
      h += `<div class="sk"><div><b>Emplacement ${n}</b><div class="row">${opts.map(([k, nm]) => `<button class="${cur === k ? 'on' : ''}" data-eqm="${sl}:${k}">${esc(nm)}</button>`).join('')}</div></div></div>`;
    }
    const ult = GR[9], ok = info.l >= 10;
    h += `<div class="sk"><div><b>Ultime</b><div class="row"><button class="${P.ultSel !== 'C10' ? 'on' : ''}" data-ultsel="L">Ultime commun (base)</button><button class="${P.ultSel === 'C10' ? 'on' : ''}" data-ultsel="C10" ${ok ? '' : 'disabled'}>${esc(ult.n)}${ok ? '' : ' (maîtrise 10)'}</button></div></div></div>`;
    h += `<h4>Grimoire — ${esc(M.n)}</h4>`;
    for (const i of [...order, 9]) { const g = GR[i], n = i + 1, op = skillOpen(P, fam, n); h += `<div class="sk">${op ? `<img src="${grimIcon(fam, g).url}">` : `<img src="${lockIcon().url}">`}<div><b ${op ? '' : 'style="opacity:.6"'}>${i === 9 ? 'Ultime' : g.no + '.'} ${esc(g.n)}</b> <small>${esc(g.role)}${g.mp ? ' · ' + g.mp + ' mana · ' + g.cd + ' s' : ''}${g.cost ? ' · ' + esc(M.res) + ' −' + g.cost : ''}</small><br><small>${esc(g.d)}</small></div></div>`; }
    return h;
  }; }
// ---------------- ressources propres à chaque famille ----------------
// sauvegardées dans G.flags.nmr (la sauvegarde existante enregistre déjà G.flags)
function nmRes(P, fam) { const r = G.flags && G.flags.nmr; return r && r[fam] || 0; }
function nmSet(P, fam, v) { G.flags.nmr = G.flags.nmr || {}; G.flags.nmr[fam] = Math.max(0, Math.min(NM.META[fam].max, v)); }
function nmGain(P, fam, n) { if (!NM.META[fam]) return; nmSet(P, fam, nmRes(P, fam) + n); }
// dépense : renvoie le facteur de puissance (1 si la jauge suffit, 0,55 sinon — la compétence part affaiblie, rien n'est perdu)
function nmSpend(P, fam, n) { if (!n) return 1; const v = nmRes(P, fam); if (v >= n) { nmSet(P, fam, v - n); return 1; } toast(NM.META[fam].res + ' : jauge insuffisante, effet affaibli', PALS[fam][3]); return 0.55; }
function nmFams(P) { return [P.magic, P.magic2].filter(f => f && NM.META[f]); }
// les attaques d'arme et les impacts réussis alimentent les jauges (sauf l'Inertie du Titan, nourrie par le mouvement)
// NM.onStrike : réactions aux coups d'arme du joueur (formes, compression, formation…) — sans récursion
NM.onStrike = [];
{ const se = strikeEnemy; strikeEnemy = function (P, e, mult, o) { const r = se.apply(this, arguments);
    try { if (P && P === G.player && e && !e.def.dummy) { for (const f of nmFams(P)) { if (f === 'titan') continue; nmGain(P, f, o && o.magic ? 1.2 : (f === 'kitsune' ? 0.25 : 4)); }
      if (!NM.inHook && !(o && (o.magic || o.noProc))) { NM.inHook = true; try { for (const h of NM.onStrike) h(P, e, mult, o || {}); } finally { NM.inHook = false; } } } } catch (er) { NM.inHook = false; }
    return r; }; }
// ---------------- transformations et états propres (mis à jour à chaque image) ----------------
// P.nmForm = { fam, kind, t, dur } : forme active (le rendu 3D des modèles est fait par js3d/nm3d.js)
NM.FORM_STATS = { // bonus de prototypage pendant chaque forme
  orochi: { atk: 0.15, dr: 0.10 }, phenix: { spd: 0.18, mag: 0.15 }, titan: { atk: 0.45, dr: 0.25, spd: -0.18, reach: 1.7 }, kitsune: { spd: 0.15, mag: 0.18 },
  dixombres: { mag: 0.15, dr: 0.08 }, possession: { atk: 0.6, mag: 0.6, spd: 0.12 }, possession1: { atk: 0.2, mag: 0.2 }, dragonw: { mag: 0.2, spd: 0.15 }, dragon: { atk: 0.5, mag: 0.5, dr: 0.3 }, dragonu: { atk: 0.7, mag: 0.7, dr: 0.35 },
  leviathanh: { mag: 0.2, dr: 0.12 }, leviathan: { mag: 0.45, dr: 0.25 }, possessionu: { atk: 0.9, mag: 0.9, spd: 0.15, dr: 0.2 },
};
function nmTransform(P, fam, kind, dur) {
  if (typeof BRU3D !== 'undefined' && BRU3D.inside && BRU3D.inside() && (kind === 'titan' || kind === 'dragon' || kind === 'dragonu' || kind === 'leviathan')) { toast('Trop étroit ici pour cette forme', PALS[fam][3]); return false; }
  const S = NM.FORM_STATS[kind] || {}; gbuff(P, 'nmform', dur, { atk: S.atk, mag: S.mag, dr: S.dr, spd: S.spd, poise: kind === 'titan' || kind === 'dragon' || kind === 'dragonu', onEnd: () => nmEndForm(P) });
  P.nmForm = { fam, kind, t: 0, dur }; shake(5); flashScreen(PALS[fam][3], 0.35); ring(P.x, P.y, 70, PALS[fam][3], 0.6, 5); sfx(fam + '_u');
  for (let i = 0; i < 26; i++) part(P.x + rnd(-20, 20), P.y - rnd(0, 30), { col: choice(PALS[fam].slice(2)), life: 0.9, size: 2, add: true, rise: rnd(30, 80) });
  return true;
}
// eau franchissable : passerelles/ponts de l'Architecte et vol plané draconique (uniquement les cases d'eau, jamais les murs)
NM.spans = [];
function nmWaterTile(tx, ty) { if (!WORLD.V) return false; const W = MW + 1; let n = 0; for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (WORLD.V[(ty + dy) * W + tx + dx] === T_WATER) n++; return n >= 3; }
{ const st0 = isSolidTile; isSolidTile = function (tx, ty) { const s = st0(tx, ty); if (!s || (!NM.spans.length && !NM.glide)) return s; if (!nmWaterTile(tx, ty)) return s;
    const P = G.player; if (NM.glide && P && P.nmForm && (P.nmForm.kind === 'dragonw' || P.nmForm.kind === 'dragon' || P.nmForm.kind === 'dragonu')) return false;
    const x = (tx + 0.5) * TILE, y = (ty + 0.5) * TILE; for (const b of NM.spans) { if (b.t <= G.t) continue; const dx = x - b.x0, dy = y - b.y0, L = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) || 1, u = (dx * (b.x1 - b.x0) + dy * (b.y1 - b.y0)) / L, v = Math.abs(-dx * (b.y1 - b.y0) + dy * (b.x1 - b.x0)) / L; if (u > -TILE * 0.5 && u < L + TILE * 0.5 && v < TILE * 0.75) return false; }
    return s; }; }
function nmEndForm(P) { if (!P.nmForm) return; const f = P.nmForm.fam; P.nmForm = null; ring(P.x, P.y, 50, PALS[f][3], 0.5, 3); for (let i = 0; i < 14; i++) part(P.x + rnd(-14, 14), P.y - rnd(0, 26), { col: PALS[f][2], life: 0.6, size: 2, add: true }); }
function nmFormOn(P, kind) { return P.nmForm && (!kind || P.nmForm.kind === kind); }
NM.tick = function (dt) {
  const P = G.player; if (!P || G.mode !== 'play') return;
  if (P.nmForm) { P.nmForm.t += dt; if (!gbOn(P, 'nmform')) nmEndForm(P); }
  // Titan : l'inertie se construit en se déplaçant, se dissipe aux virages brusques et à l'arrêt (mesure sur 0,2 s, stable à toute cadence)
  if (nmFams(P).includes('titan')) {
    NM.iT = (NM.iT || 0) + dt; if (NM.ix === undefined) { NM.ix = P.x; NM.iy = P.y; }
    if (NM.iT >= 0.2) { const vx = P.x - NM.ix, vy = P.y - NM.iy, sp = Math.hypot(vx, vy) / NM.iT;
      if (sp > 30 && sp < 600) { const a = Math.atan2(vy, vx); const turn = NM.pa === undefined ? 0 : Math.abs(wrapA(a - NM.pa)); nmGain(P, 'titan', NM.iT * (turn > 1.6 ? -150 : 9)); NM.pa = a; } else { nmGain(P, 'titan', -NM.iT * 3); if (sp <= 30) NM.pa = undefined; }
      NM.iT = 0; NM.ix = P.x; NM.iy = P.y; }
  }
  NM.px = P.x; NM.py = P.y;
  // régénération lente de la Synchronisation, du Commandement et de la Profondeur (prototypage)
  for (const f of nmFams(P)) if (f === 'dixombres' || f === 'leviathan' || f === 'possession' || f === 'energie') nmGain(P, f, dt * 1.5);
  // marques et sceaux expirés
  if (NM.seals) NM.seals = NM.seals.filter(s => s.t > G.t);
  if (NM.feathers) NM.feathers = NM.feathers.filter(f => f.t > G.t);
};
// renaissance conditionnelle du Phénix : un coup fatal, jauge pleine, compétence prête, hors zones interdites
{ const kp = killPlayer; killPlayer = function (P) {
    try { if (P.nmRebirth && P.nmRebirth > G.t && nmRes(P, 'phenix') >= 100 && !(P.nmRebirthCd > G.t) && !(G.zone && G.zone.noRebirth) && !G.arena) {
      P.hp = Math.round(P.st8.maxhp * 0.3); nmSet(P, 'phenix', 0); P.nmRebirthCd = G.t + 180; P.nmRebirth = 0; P.iframes = 1.4; NM.reborn = (NM.reborn || 0) + 1;
      flashScreen('#ffc04a', 0.6); ring(P.x, P.y, 90, '#ffc04a', 0.8, 6); nmFx(P.x, P.y, 'phenix', 30, 60); toast('Renaissance conditionnelle : reconstruit à 30 %', '#ffc04a'); sfx('phenix_u'); return;
    } } catch (e) { }
    return kp.apply(this, arguments);
  }; }
// gardes à charges (cous entrelacés, égide, queue gardienne, familier gardien, cocon…) : absorbent N impacts venant d'un angle
// P.nmGuards = [{ n, a (angle, ou null = tout autour), arc, red (part retirée), t (fin), onHit(P, src), onBreak(P) }]
{ const gh0 = gbufHurt; gbufHurt = function (P, dmg, src) {
    try { if (P.nmGuards && P.nmGuards.length) { const sa = src && src.x !== undefined ? Math.atan2(src.y - P.y, src.x - P.x) : null;
      for (const g of P.nmGuards) { if (g.t <= G.t || g.n <= 0) continue; if (g.a !== null && g.a !== undefined && sa !== null && Math.abs(wrapA(sa - (typeof g.a === 'function' ? g.a() : g.a))) > (g.arc || 1.3)) continue;
        dmg *= 1 - (g.red ?? 1); g.n--; ring(P.x, P.y, 26, g.col || '#ffffff', 0.25, 3); if (g.onHit) g.onHit(P, src); if (g.n <= 0 && g.onBreak) g.onBreak(P); NM.guarded = (NM.guarded || 0) + 1; break; }
      P.nmGuards = P.nmGuards.filter(g => g.t > G.t && g.n > 0); } } catch (e) { }
    return dmg > 0 ? gh0.call(this, P, dmg, src) : 0;
  }; }
function nmGuard(P, o) { P.nmGuards = P.nmGuards || []; o.t = G.t + (o.dur || 4); P.nmGuards.push(o); return o; }
// ---------------- Sceau de Possession : apparence du personnage ----------------
// manifestation partielle : yeux rouges ; possession complète / éveil : peau entièrement blanche, cheveux blancs, yeux rouges.
// Le personnage est recomposé avec ces couleurs (même méthode que l'éditeur de personnage) ; cornes, marques et aura sont en 3D.
{ const dp = drawPlayer; drawPlayer = function (ctx, P, cx, cy) {
    const f = P && P.nmForm && /^possession/.test(P.nmForm.kind) ? P.nmForm.kind : null; if (!f || typeof composeCharacter !== 'function') return dp.apply(this, arguments);
    const lvl = f === 'possession1' ? 1 : 2; if (!NM.alt || NM.alt.src !== P.spr || NM.alt.lvl !== lvl) { try { const L = Object.assign({}, P.look, { eyes: 'red' }); if (lvl >= 2) { L.skin = 'fur_white'; L.hairColor = 'white'; L.beardColor = 'white'; } const Q = Object.create(P); Q.look = L; NM.alt = { src: P.spr, lvl, spr: composeCharacter(playerLayers(Q)) }; } catch (e) { NM.alt = { src: P.spr, lvl, spr: P.spr }; } }
    const s0 = P.spr; P.spr = NM.alt.spr; try { return dp.apply(this, arguments); } finally { P.spr = s0; } }; }
// ---------------- jauge à l'écran (HUD) ----------------
{ const dh = drawHUD; drawHUD = function (ctx) {
    dh(ctx);
    try { const P = G.player; if (!P || G.mode !== 'play') return; const fs = nmFams(P); if (!fs.length) return;
      let y = IS_TOUCH ? 38 + 40 / SCALE + 34 : 96;
      for (const f of fs) { const M = NM.META[f], v = nmRes(P, f), w = 70; ctx.fillStyle = 'rgba(10,6,16,.75)'; ctx.fillRect(6, y, w + 2, 6); ctx.fillStyle = M.pal[2]; ctx.fillRect(7, y + 1, Math.round(w * v / M.max), 4); ctx.fillStyle = M.pal[4]; ctx.fillRect(7, y + 1, Math.round(w * v / M.max), 1);
        txt(ctx, M.res + ' ' + Math.round(v) + (P.nmForm && P.nmForm.fam === f ? ' · forme ' + Math.ceil(P.nmForm.dur - P.nmForm.t) + ' s' : ''), 80, y + 6, M.pal[3], 7, 'left'); y += 11; }
    } catch (e) { }
  }; }
// ---------------- outils de dessin partagés (rendu 2D des effets, repris en volume par la 3D) ----------------
const NMD = {
  ring(ctx, x, y, R, p, k, n) { for (let i = 0; i < (n || 3); i++) { const kk = cap01(k - i * 0.12); ctx.globalAlpha = (1 - kk) * 0.9; ctx.strokeStyle = i % 2 ? p[3] : p[2]; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, R * kk, R * 0.55 * kk, 0, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1; },
  disc(ctx, x, y, R, p, a) { ctx.globalAlpha = a; ctx.fillStyle = p[1]; ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.55, 0, 0, 7); ctx.fill(); ctx.strokeStyle = p[3]; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1; },
  orb(ctx, x, y, r, p, t) { glow(ctx, x, y, r * 2.4, rgbOf(p[2]), 0.45); ctx.fillStyle = p[2]; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.fillStyle = p[4]; ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.45, 0, 7); ctx.fill(); },
  line(ctx, x0, y0, x1, y1, p, w) { pxLine(ctx, x0, y0, x1, y1, p[2], (w || 2) + 2); pxLine(ctx, x0, y0, x1, y1, p[4], w || 2); },
  arc(ctx, x, y, r, a, arc, p, k) { ctx.globalAlpha = 1 - k; ctx.strokeStyle = p[3]; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y, r * (0.6 + 0.4 * k), r * 0.55 * (0.6 + 0.4 * k), 0, a - arc / 2, a + arc / 2); ctx.stroke(); ctx.strokeStyle = p[4]; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1; },
  aura(ctx, x, y, p, t, k) { ctx.globalAlpha = 0.45 * k; ctx.strokeStyle = p[3]; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 2, 18 + Math.sin(t * 6) * 2, 8, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; },
  mark(ctx, x, y, p, t) { ctx.strokeStyle = p[3]; ctx.lineWidth = 1; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(x, y, 7 + Math.sin(t * 8) * 1.5, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 9); ctx.stroke(); ctx.globalAlpha = 1; },
  trail(ctx, m, tr, cx, cy, p) { ctx.globalAlpha = 0.7; for (let i = 1; i < tr.length; i++) pxLine(ctx, tr[i - 1][0] - cx, tr[i - 1][1] - cy - 10, tr[i][0] - cx, tr[i][1] - cy - 10, i % 2 ? p[2] : p[3], 3); ctx.globalAlpha = 1; },
  beam(ctx, x0, y0, x1, y1, b, p, k) { ctx.globalAlpha = k; pxLine(ctx, x0, y0, x1, y1, p[1], 9); pxLine(ctx, x0, y0, x1, y1, p[2], 6); pxLine(ctx, x0, y0, x1, y1, p[4], 2); ctx.globalAlpha = 1; },
};
// ---------------- archétypes « nouvelles magies » (sur les archétypes existants K.*) ----------------
const NK = {
  // projectile ; o.look : 'orb' | 'bolt' | 'fang' | 'feather' | 'line'
  proj: (o) => K.proj(Object.assign({ draw(ctx, x, y, m, p) { const c = Math.cos(m.ang), s = Math.sin(m.ang); if (o.look === 'line' || o.look === 'feather' || o.look === 'bolt') { NMD.line(ctx, x - c * 12, y - s * 12, x + c * 10, y + s * 10, p, o.look === 'feather' ? 2 : 3); if (o.look === 'feather') { ctx.fillStyle = p[3]; ctx.fillRect(Math.round(x - c * 10 - 2), Math.round(y - s * 10 - 2), 4, 4); } } else if (o.look === 'fang') { NMD.orb(ctx, x, y, o.r * 0.6 || 6, p, m.t); ctx.fillStyle = p[4]; ctx.fillRect(Math.round(x + c * 5 - 1), Math.round(y + s * 5 - 3), 2, 6); } else NMD.orb(ctx, x, y, (o.r || 10) * 0.7, p, m.t); } }, o)),
  zone: (o) => K.zone(Object.assign({ draw(ctx, x, y, z, pass, p, q) { if (pass === 'ground') NMD.disc(ctx, x, y, q.R, p, 0.35 * q.fade); else NMD.ring(ctx, x, y - 4, q.R, p, (q.age * 1.4) % 1, o.rings || 3); } }, o)),
  nova: (o) => NK.zone(Object.assign({ where: 'self', delay: 0.12, dur: 0.6, tick: 99, mult: 0 }, o)),
  cone: (o) => K.cone(Object.assign({ draw(ctx, x, y, m, p, q) { NMD.arc(ctx, x, y, q.r, q.a, q.arc, p, q.k); } }, o)),
  beam: (o) => K.beam(Object.assign({ draw: NMD.beam }, o)),
  wave: (o) => K.wave(Object.assign({ draw(ctx, x, y, m, pass, p, q) { if (pass === 'ground') return; const c = Math.cos(q.a), s = Math.sin(q.a); ctx.globalAlpha = 0.85; pxLine(ctx, x - s * q.w, y + c * q.w * 0.55 - 6, x + s * q.w, y - c * q.w * 0.55 - 6, p[2], 6); pxLine(ctx, x - s * q.w, y + c * q.w * 0.55 - 6, x + s * q.w, y - c * q.w * 0.55 - 6, p[4], 2); ctx.globalAlpha = 1; } }, o)),
  dash: (o) => K.dash(Object.assign({ draw: NMD.trail }, o)),
  buff: (o) => K.buff(Object.assign({ draw(ctx, x, y, P, p, q) { NMD.aura(ctx, x, y, p, q.t, q.k); } }, o)),
  summon: (o) => K.summon(Object.assign({ draw(ctx, x, y, s, p, t) { ctx.fillStyle = p[1]; ctx.beginPath(); ctx.ellipse(x, y - 6, o.sz || 7, (o.sz || 7) * 0.8, 0, 0, 7); ctx.fill(); ctx.fillStyle = p[3]; ctx.fillRect(Math.round(x - 3), Math.round(y - 9), 2, 2); ctx.fillRect(Math.round(x + 1), Math.round(y - 9), 2, 2); } }, o)),
  rain: (o) => K.rain(Object.assign({ draw(ctx, x, y, d, p, u, t) { NMD.orb(ctx, x, y, 4, p, t); } }, o)),
  // frappe différée sur un point : télégraphe lisible, puis impact (les ennemis peuvent sortir de la zone)
  delayed: (o) => (P, E) => { const p = PALS[E.fam], pos = o.at ? o.at(P, E) : posOf(P, E, o); sfx(E.fam + '_c');
    mfx({ life: (o.delay || 0.6) + 0.35, x: pos.x, y: pos.y, big: 1, passes: ['ground', 'glow'], upd(m) { if (!m.on && m.t >= (o.delay || 0.6)) { m.on = 1; sfx(E.fam + '_i'); if (o.shk) shake(o.shk); const n = aoeE(P, m.x, m.y, o.r || 40, E.base(o.mult || 1), E, o.st, { kb: o.kb || 80, fx: o.fx, stun: o.stun }); if (o.onHit) o.onHit(P, E, m, n); ring(m.x, m.y, (o.r || 40) + 8, p[3], 0.35, 3); } },
      draw(m, ctx, cx, cy, pass) { const x = m.x - cx, y = m.y - cy, R = o.r || 40; if (pass === 'ground' && !m.on) { ctx.globalAlpha = 0.4 + 0.4 * Math.sin(m.t * 20); ctx.strokeStyle = p[3]; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.55, 0, 0, 7); ctx.stroke(); if (o.cross) { ctx.beginPath(); ctx.moveTo(x - R, y); ctx.lineTo(x + R, y); ctx.moveTo(x, y - R * 0.55); ctx.lineTo(x, y + R * 0.55); ctx.stroke(); } ctx.globalAlpha = 1; } else if (m.on) NMD.ring(ctx, x, y - 4, R, p, (m.t - (o.delay || 0.6)) / 0.35, 2); } }); },
};
// puissance modulée (jauge insuffisante, palier, bonus) : copie du contexte de lancement
function nmK(E, k) { if (k === 1) return E; return Object.assign({}, E, { base: (x) => E.base(x) * k, k }); }
// contrôle : jamais d'immobilisation garantie d'un boss ou d'un ennemi lourd (règle transversale du dossier)
function nmCtl(P, e, st, fam) { if (!e || e.dead || !st) return; if (nmIsBig(e)) { if (st === 'root' || st === 'stun' || st === 'sleep' || st === 'fear' || st === 'freeze' || st === 'confuse') { e.slowT = Math.max(e.slowT || 0, 0.6); return; } } if (['bleed', 'decay', 'fear', 'blind', 'confuse', 'vuln', 'sleep', 'weak'].includes(st)) xstat(P, e, st, fam, nmIsBig(e) ? 1.5 : undefined); else applyStatus(P, e, st, fam); }
function nmHit(P, e, E, mult, o) { if (!e || e.dead) return; hitE(P, e, E.base(mult), E, null, Object.assign({ kb: nmIsBig(e) ? 0 : ((o && o.kb) || 60) }, o)); if (o && o.st) nmCtl(P, e, o.st, E.fam); }
function nmAoe(P, x, y, r, E, mult, o) { let n = 0; for (const e of near(x, y, r)) { nmHit(P, e, E, mult, o); n++; } return n; }
function nmFx(x, y, fam, n, rise) { const p = PALS[fam]; for (let i = 0; i < (n || 10); i++) part(x + rnd(-10, 10), y - rnd(0, 20), { col: choice([p[2], p[3], p[4]]), life: rnd(0.3, 0.7), size: 2, add: true, vx: rnd(-40, 40), vy: rnd(-40, 20), rise: rise || 0 }); }
// ciblage commun
function nmTarget(P, E, r) { return E.t && !E.t.dead ? E.t : nearestEnemy(P.x, P.y, r || 230, 1.3, E.a); }
function nmMark(P, e, fam, dur) { if (!e || e.dead) return; e.nmMark = { fam, t: G.t + (dur || 6) }; }
function nmMarked(e, fam) { return e && e.nmMark && e.nmMark.fam === fam && e.nmMark.t > G.t; }
function nmIsBig(e) { return e.def.boss || e.def.heavy; }
// marques visibles au-dessus des ennemis marqués (dessinées avec les effets)
mfx.nmMarks = true;
NM.drawMarks = function (ctx, cx, cy) { for (const e of G.enemies) if (!e.dead && e.nmMark && e.nmMark.t > G.t) NMD.mark(ctx, e.x - cx, e.y - cy - 34, PALS[e.nmMark.fam], G.t); };
{ const dm = drawMfx; drawMfx = function (ctx, cx, cy, pass) { dm(ctx, cx, cy, pass); if (pass === 'glow') try { NM.drawMarks(ctx, cx, cy); } catch (e) { } }; }
{ const um = updateMagic3; updateMagic3 = function (dt) { um(dt); try { NM.tick(dt); } catch (e) { console.error('NM', e); } }; }
