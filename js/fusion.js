'use strict';
// ===================== Phase A2 — fusions magiques (cahier de conception général §7) =====================
// Combinaisons du cahier (10 à deux éléments, 3 à trois éléments). Conditions, coûts et effets chiffrés : PROPOSITIONS.
// Affinités secondaires : obtenues par un « Rituel d'affinité » auprès du Maître Mage Orvael, tiré avec les MÊMES
// probabilités que le Magic Spin (rollMagicTier / rollMagicFamily : taux 5/25/35/25/10 % inchangés).
// Une affinité secondaire ne donne pas les sorts de la famille : elle permet les fusions qui l'utilisent (PROPOSITION).
const FUSIONS = [
  { id: 'fu_plasma', n: 'Plasma', f: ['feu', 'foudre'], k: 'storm', el: 'foudre', st: 'burn', col: '255,170,255', hits: 6, m: 1.4, mp: 38, cd: 14, d: 'Des arcs de plasma frappent jusqu\'à 6 ennemis et les embrasent.' },
  { id: 'fu_givre', n: 'Givre absolu', f: ['eau', 'glace'], k: 'nova', el: 'glace', st: 'freeze', col: '190,240,255', r: 110, m: 1.6, mp: 36, cd: 14, d: 'Une onde de froid absolu gèle tout autour de toi.' },
  { id: 'fu_tempete', n: 'Tempête ardente', f: ['feu', 'vent'], k: 'tornado', el: 'feu', st: 'burn', col: '255,140,60', m: 0.6, mp: 34, cd: 13, d: 'Une tornade de flammes avance vers la visée en aspirant et brûlant.' },
  { id: 'fu_orage', n: 'Orage gravitationnel', f: ['foudre', 'gravite'], k: 'vortexstorm', el: 'foudre', st: 'shock', col: '200,190,255', m: 1.3, mp: 40, cd: 15, d: 'Un puits de gravité rassemble les ennemis, puis la foudre s\'abat.' },
  { id: 'fu_crepuscule', n: 'Crépuscule', f: ['ombre', 'lumiere'], k: 'nova', el: 'lumiere', st: 'blind', col: '255,214,160', r: 95, m: 1.5, heal: 0.15, mp: 36, cd: 14, d: 'Ombre et lumière s\'annulent : dégâts en zone, aveuglement et soin de 15 %.' },
  { id: 'fu_sanguine', n: 'Flamme sanguine', f: ['sang', 'feu'], k: 'proj', el: 'feu', st: 'drain', col: '220,40,60', m: 1.8, mp: 32, cd: 11, d: 'Un projectile de sang ardent perce les ennemis et te rend de la vie.' },
  { id: 'fu_eclair_t', n: 'Éclair temporel', f: ['temps', 'foudre'], k: 'storm', el: 'foudre', st: 'freeze', col: '245,208,254', hits: 5, m: 1.3, timeStop: 1.5, mp: 40, cd: 16, d: 'La foudre fige le temps : 5 frappes et les ennemis touchés sont figés.' },
  { id: 'fu_trou_noir', n: 'Trou noir', f: ['neant', 'gravite'], k: 'void', el: 'ombre', col: '60,20,110', m: 2.2, mp: 46, cd: 18, d: 'Un trou noir aspire tout ce qui l\'entoure puis implose.' },
  { id: 'fu_flore', n: 'Flore toxique', f: ['nature', 'poison'], k: 'zone', el: 'poison', st: 'poison', col: '120,220,90', r: 70, m: 0.45, life: 6, mp: 30, cd: 13, d: 'Des plantes vénéneuses couvrent le sol 6 s et empoisonnent.' },
  { id: 'fu_onde', n: 'Onde de destruction', f: ['son', 'vent'], k: 'line', el: 'vent', st: 'slow', col: '220,230,255', m: 1.7, len: 200, mp: 34, cd: 12, d: 'Une onde sonore balaie une ligne devant toi et repousse violemment.' },
  { id: 'fu_cataclysme', n: 'Cataclysme électrique', f: ['feu', 'foudre', 'vent'], k: 'storm', el: 'foudre', st: 'burn', col: '255,230,120', hits: 10, m: 1.6, nova: 90, mp: 60, cd: 22, tri: 1, d: 'Trois éléments : 10 éclairs embrasés et une onde de choc.' },
  { id: 'fu_prison', n: 'Prison polaire', f: ['glace', 'eau', 'gravite'], k: 'vortexstorm', el: 'glace', st: 'freeze', col: '170,220,255', m: 1.5, mp: 58, cd: 22, tri: 1, d: 'Trois éléments : la gravité rassemble, l\'eau et la glace emprisonnent.' },
  { id: 'fu_devoreur', n: 'Dévoreur d\'âmes', f: ['ombre', 'sang', 'neant'], k: 'void', el: 'ombre', st: 'drain', col: '120,0,60', m: 2.6, mp: 62, cd: 24, tri: 1, d: 'Trois éléments : un gouffre dévore les âmes et te rend leur vie.' }
];
const AFFINITY_COST = 600, FUSION_MASTERY = 3, FUSION_MASTERY_TRI = 6;
for (const F of FUSIONS) SECRET_SPELLS[F.id] = { name: F.n + ' (fusion)', icon: 'spell_firelion', mp: F.mp, cd: F.cd, desc: F.d + ' Fusion : ' + F.f.map(k => MAGIC_DATA[k].n).join(' + ') + '.', fusion: 1 };
function knownFamilies(P) { const s = new Set(); if (P.magic) s.add(P.magic); if (P.magic2) s.add(P.magic2); for (const k of (P.affin || [])) s.add(k); return s; }
function innateMastery(P) { return P.magic ? ((P.mastery || {})[P.magic] || 0) : 0; }
function fusionState(P, F) {
  const K = knownFamilies(P), has = F.f.filter(k => K.has(k)).length, need = F.tri ? FUSION_MASTERY_TRI : FUSION_MASTERY;
  if (has === F.f.length && innateMastery(P) >= need) return 'ok';
  if (has === F.f.length) return 'maitrise';
  return has > 0 ? 'indice' : 'inconnu';
}
function updateFusions(P) {
  if (!P || !P.spells) return;
  for (const F of FUSIONS) if (fusionState(P, F) === 'ok' && !P.spells[F.id]) { P.spells[F.id] = 1; toast('Fusion découverte : ' + F.n + ' — place-la dans l\'emplacement 4 (Compétences)', '#f0abfc'); sfx('level'); }
}
function affinitySpin(P) {
  if (!P.magic) return 'Ta magie innée doit d\'abord être révélée.';
  if (innateMastery(P) < FUSION_MASTERY) return 'Maîtrise ' + FUSION_MASTERY + ' de ta magie innée requise.';
  if (P.gold < AFFINITY_COST) return 'Il faut ' + AFFINITY_COST + ' or.';
  const K = knownFamilies(P); if (K.size >= MAGIC_KEYS.length) return 'Tu connais déjà toutes les familles.';
  let fam = null, tier = 0;
  for (let i = 0; i < 50 && !fam; i++) { tier = rollMagicTier(); const pool = MAGIC_KEYS.filter(k => MAGIC_DATA[k].tier === tier && !K.has(k)); if (pool.length) fam = choice(pool); }
  if (!fam) return 'Le rituel n\'a rien révélé : réessaie.';
  P.gold -= AFFINITY_COST; P.affin = (P.affin || []).concat([fam]);
  (P.magicHist = P.magicHist || []).unshift({ m: fam, t: Date.now(), affin: 1 });
  updateFusions(P); saveGame();
  return { fam, tier };
}
// ---------- lancement ----------
const _castSkillF = castSkill;
castSkill = function (P, id, mx, my, mv, slot) {
  const F = FUSIONS.find(x => x.id === id); if (!F) return _castSkillF(P, id, mx, my, mv, slot);
  const cdKey = slot || id; if (P.cd[cdKey] > 0) return;
  if (P.mp < F.mp) { toast('Pas assez de mana', '#7aa8ff'); sfx('ui'); return; }
  P.mp -= F.mp; P.cd[cdKey] = F.cd; P.state = 'cast'; P.animT = 0; P.castDone = false; P.st = 0;
  const t = aimTarget(P, mx, my, mv, 240); const a = P.aim;
  const tx = t ? t.x : P.x + Math.cos(a) * 110, ty = t ? t.y : P.y + Math.sin(a) * 110;
  const pw = (30 + P.st8.mag * 1.6) / Math.max(1, P.st8.mag); // multiplicateur relatif à la puissance magique
  const hit = (e, mul) => { strikeEnemy(P, e, mul * pw * 0.6, { magic: true, el: F.el, noXp: true, kb: 60 }); if (F.st) applyStatus(P, e, F.st, F.f[0]); };
  const col = 'rgb(' + F.col + ')'; sfx('cast'); sfx('boom'); shake(5); if (typeof flashScreen === 'function') flashScreen(col, 0.25);
  ring(P.x, P.y, 34, col, 0.5, 4); for (let i = 0; i < 18; i++) { const q = i / 18 * 6.28; part(P.x + Math.cos(q) * 20, P.y + Math.sin(q) * 10, { rise: 50, col, life: 0.7, size: 2, add: true }); }
  const near = (x, y, r) => G.enemies.filter(e => !e.dead && !e.def.dummy && dist(e.x, e.y, x, y) < r);
  if (F.k === 'storm') {
    const list = near(tx, ty, 170).sort((p, q) => dist(p.x, p.y, tx, ty) - dist(q.x, q.y, tx, ty)).slice(0, F.hits);
    list.forEach((e, i) => setTimeout(() => { if (e.dead) return; G.bolts.push({ x0: e.x + rnd(-20, 20), y0: e.y - 160, x1: e.x, y1: e.y - 10, t: 0, col: F.col }); ring(e.x, e.y, 26, col, 0.3, 3); hit(e, F.m); if (F.timeStop) e.freeze = Math.max(e.freeze || 0, F.timeStop); }, i * 90));
    if (F.timeStop) G.timeTint = 1.2;
    if (F.nova) { ring(P.x, P.y, F.nova, col, 0.6, 6); near(P.x, P.y, F.nova).forEach(e => hit(e, F.m * 0.7)); }
  } else if (F.k === 'nova') {
    ring(P.x, P.y, F.r, col, 0.6, 6); ring(P.x, P.y, F.r * 0.6, '#ffffff', 0.4, 3); addLight(P.x, P.y, F.r + 40, F.col);
    near(P.x, P.y, F.r).forEach(e => hit(e, F.m)); if (F.heal) P.hp = Math.min(P.st8.maxhp, P.hp + P.st8.maxhp * F.heal);
  } else if (F.k === 'tornado') {
    G.tornados.push({ x: P.x + Math.cos(a) * 20, y: P.y + Math.sin(a) * 20, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, t: 0, life: 4 });
    G.rifts.push({ x: tx, y: ty, r: 48, t: 0, life: 4, mult: F.m * pw * 0.3, el: F.el, col: F.col, st: F.st, fam: F.f[0], tick: 0 });
  } else if (F.k === 'vortexstorm') {
    G.voids.push({ x: tx, y: ty, t: 0, life: 1.6, pw: P.st8.mag * 1.2, col: F.col, el: F.el });
    setTimeout(() => near(tx, ty, 90).forEach((e, i) => { G.bolts.push({ x0: e.x, y0: e.y - 150, x1: e.x, y1: e.y - 10, t: 0, col: F.col }); hit(e, F.m); }), 1300);
  } else if (F.k === 'void') {
    G.voids.push({ x: tx, y: ty, t: 0, life: 2.2, pw: P.st8.mag * (F.m * 1.2), col: F.col, el: F.el });
    if (F.st === 'drain') setTimeout(() => near(tx, ty, 80).forEach(e => applyStatus(P, e, 'drain', F.f[0])), 2000);
  } else if (F.k === 'zone') {
    G.rifts.push({ x: tx, y: ty, r: F.r, t: 0, life: F.life, mult: F.m * pw, el: F.el, col: F.col, st: F.st, fam: F.f[0], tick: 0 });
  } else if (F.k === 'line') {
    hitLine(P, P.x, P.y - 14, a, F.len, 26, F.m * pw * 0.6, { el: F.el, kb: 320, noProc: true });
    if (!G.beams) G.beams = []; G.beams.push({ x: P.x, y: P.y - 14, a, len: F.len, t: 0, col: F.col });
    near(P.x + Math.cos(a) * F.len / 2, P.y + Math.sin(a) * F.len / 2, F.len / 2).forEach(e => applyStatus(P, e, F.st, F.f[0]));
  } else if (F.k === 'proj') {
    spawnProj({ kind: 'firelion', fxKey: 'firelion_' + ['up', 'left', 'down', 'right'][dirOf(Math.cos(a), Math.sin(a))], x: P.x + Math.cos(a) * 20, y: P.y - 10 + Math.sin(a) * 16, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, mult: F.m * pw * 0.6, magic: true, el: F.el, from: 'p', life: 1.2, r: 20, pierce: true, burn: 3, light: F.col });
    P.hp = Math.min(P.st8.maxhp, P.hp + P.st8.maxhp * 0.06);
  }
};
setInterval(() => { try { if (G.player && G.mode === 'play') updateFusions(G.player); } catch (e) {} }, 2000);

// ---------- section « Fusions » (onglet Codex) ----------
function fusionHTML(P) {
  const K = knownFamilies(P), near = G.npcs.some(n => /Orvael/.test(n.name) && dist(n.x, n.y, P.x, P.y) < 70);
  const fam = [...K].map(k => `<b style="color:${MAGIC_DATA[k].col}">${MAGIC_DATA[k].n}</b>`).join(', ') || '—';
  let h = `<div class="sk"><div style="width:100%"><b>Fusions magiques</b><div style="margin-top:4px;line-height:1.5">Familles connues : ${fam}. Maîtrise de ta magie innée : ${innateMastery(P)}.<br>`;
  h += FUSIONS.map(F => { const s = fusionState(P, F); const names = F.f.map(k => K.has(k) ? MAGIC_DATA[k].n : '?').join(' + ');
    if (s === 'ok') return `<div>✦ <b style="color:rgb(${F.col})">${F.n}</b> — ${names} <small>(${F.mp} mana · ${F.cd} s) ${F.d}</small></div>`;
    if (s === 'maitrise') return `<div>◇ <b>${F.n}</b> — ${names} <small>maîtrise ${F.tri ? FUSION_MASTERY_TRI : FUSION_MASTERY} requise</small></div>`;
    if (s === 'indice') return `<div style="opacity:.7">◇ ??? — ${names}${F.tri ? ' (trois éléments)' : ''}</div>`;
    return `<div style="opacity:.4">◇ ??? — fusion inconnue</div>`; }).join('');
  h += `<br><b>Rituel d'affinité</b> (auprès du Maître Mage Orvael, ${AFFINITY_COST} or, maîtrise ${FUSION_MASTERY}) : révèle une famille secondaire avec les probabilités du Magic Spin. ${near ? `<button data-affin="1" ${P.gold < AFFINITY_COST || innateMastery(P) < FUSION_MASTERY || !P.magic ? 'disabled' : ''}>Accomplir le rituel</button>` : '<i>Rends-toi au Cercle des Arcanes.</i>'}`;
  return h + '<br><small style="opacity:.7">Conditions et effets des fusions : propositions à valider.</small></div></div>';
}
const _codexHTMLF = codexHTML;
codexHTML = function (P) { return fusionHTML(P) + _codexHTMLF(P); };
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-affin]'); if (!b) return;
  const r = affinitySpin(G.player);
  if (typeof r === 'string') toast(r, '#ffb36b');
  else { const D = MAGIC_DATA[r.fam]; toast('Affinité révélée : ' + D.n + ' (' + MAGIC_TIERS[r.tier].n + ')', D.col); ring(G.player.x, G.player.y, 80, D.col, 0.8, 6); sfx('level'); }
  openMenu('codex');
});
// sauvegarde : les affinités secondaires
const _saveGameF = saveGame;
saveGame = function () { _saveGameF(); try { const P = G.player; if (!P || G.mode !== 'play') return; const s = store(SAVE_KEY); if (s) { s.affin = P.affin || []; store(SAVE_KEY, s); } } catch (e) {} };
const _startGameF = startGame;
startGame = function (look, sv) { _startGameF(look, sv); try { if (sv && sv.affin) G.player.affin = sv.affin.filter(k => MAGIC_DATA[k]); } catch (e) {} };
