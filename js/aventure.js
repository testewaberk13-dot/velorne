'use strict';
// =====================================================================
//  AVENTURE — MOTEUR NARRATIF
//  Gestionnaires : missions (étapes, déclencheurs, choix), arcs et cycles, lieux et découvertes,
//  indices, mémoire des personnages, états du monde, dialogues contextuels, événements scriptés
//  et dynamiques, journal d'aventure. Données : js/aventure_data.js.
//
//  Intégration (aucun système existant n'est remplacé) :
//  - sauvegarde : tout l'état narratif vit dans G.flags.narr (G.flags est déjà sauvegardé) ;
//  - interact / questEvent / questText / openMenu / genWorld sont enveloppés (motif des autres modules) ;
//  - les quêtes existantes (trame, Dernier roi, SIDEQ) sont lues et affichées dans le journal, jamais dupliquées.
// =====================================================================

// ---------------- état sauvegardé ----------------
function NS() {
  const F = G.flags || (G.flags = {});
  if (!F.narr) F.narr = { v: 1, m: {}, disc: {}, read: {}, clue: {}, npc: {}, ws: {}, ev: {}, ctx: {}, log: [], seq: 0, regions: {}, track: null };
  const N = F.narr; for (const k of ['m', 'disc', 'read', 'clue', 'npc', 'ws', 'ev', 'ctx', 'regions']) N[k] = N[k] || {}; N.log = N.log || [];
  return N;
}
const narrM = id => NS().m[id];
function narrDone(id) { const m = G.flags && G.flags.narr && G.flags.narr.m[id]; return !!(m && m.st === 2); }
function narrStep(id) { const m = G.flags && G.flags.narr && G.flags.narr.m[id]; return m && m.st === 1 ? m.step : -1; }
function narrWs(k) { return !!(G.flags && G.flags.narr && G.flags.narr.ws[k]); }
function narrClue(k) { return !!(G.flags && G.flags.narr && G.flags.narr.clue[k]); }
function sideDoneId(id) { const s = G.quests && G.quests.side && G.quests.side[id]; return !!(s && s.st === 2); }
const NNPC = {}; for (const d of NARR_NPCS) NNPC[d.key] = d;
const npcName = k => (NNPC[k] ? NNPC[k].name : k);
const shortName = n => String(n).split(',')[0];

// ---------------- journal (récit) ----------------
const LOG_ICON = { mission: '✒', lieu: '⌂', rencontre: '☺', indice: '✧', evenement: '✦', arc: '❖', region: '⛰', souvenir: '☙', rumeur: '?', boss: '⚔' };
function nLog(k, txt) {
  const N = NS(); N.seq++;
  let r = ''; try { r = zoneAt(G.player.x, G.player.y).name; } catch (e) { }
  N.log.push({ k, txt, r, s: N.seq, lv: G.player ? G.player.lvl : 1 });
  if (N.log.length > 400) N.log.splice(0, N.log.length - 400);
}
function addClue(id, txt) { const N = NS(); if (N.clue[id]) return; N.clue[id] = txt; nLog('indice', txt); toast('Indice noté dans le journal', '#e9d5ff'); }

// ---------------- outils de position ----------------
const T_ = () => TILE;
function freeAt(tx, ty) { const x = tx * TILE + 16, y = ty * TILE + 16; return !isSolidTile(tx, ty) && !rectBlocked(x - 10, y - 8, 20, 10); }
// case libre la plus proche (spirale), en restant dans la même zone si demandé
function nearFree(tx, ty, zoneId, maxR) {
  maxR = maxR || 24;
  for (let r = 0; r <= maxR; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = Math.round(tx + dx), y = Math.round(ty + dy);
    if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) continue;
    if (!freeAt(x, y)) continue;
    if (zoneId) { const z = zoneAt(x * TILE + 16, y * TILE + 16); if (z.id !== zoneId && !(zoneId === 'forest' && ['forest'].includes(z.id))) continue; }
    return [x, y];
  }
  return null;
}
// accessibilité : parcours en largeur depuis un point de voyage, sur les cases libres (une fois au chargement)
let REACH = null;
function buildReach() {
  REACH = new Uint8Array(MW * MH); const q = new Int32Array(MW * MH); let h = 0, t = 0;
  const push = (x, y) => { const i = y * MW + x; if (x < 1 || y < 1 || x >= MW - 1 || y >= MH - 1 || REACH[i] || isSolidTile(x, y)) return; REACH[i] = 1; q[t++] = i; };
  for (const tr of (typeof TRAVEL !== 'undefined' ? TRAVEL : [])) push(Math.round(tr.x), Math.round(tr.y));
  while (h < t) { const i = q[h++], x = i % MW, y = (i / MW) | 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
}
function reachable(tx, ty) { return !REACH || !!REACH[ty * MW + tx]; }
function nearFreeReach(tx, ty, zoneId) {
  for (let r = 0; r <= 30; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = Math.round(tx + dx), y = Math.round(ty + dy);
    if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2 || !reachable(x, y) || !freeAt(x, y)) continue;
    if (zoneId) { const z = zoneAt(x * TILE + 16, y * TILE + 16); if (z.id !== zoneId) continue; }
    return [x, y];
  }
  return nearFree(tx, ty, zoneId, 30);
}
function pDistT(px, py) { const P = G.player; return Math.hypot(P.x - px, P.y - py) / TILE; }
function dirWord(dx, dy) { const a = Math.atan2(dy, dx) * 180 / Math.PI; const W = ['est', 'sud-est', 'sud', 'sud-ouest', 'ouest', 'nord-ouest', 'nord', 'nord-est']; return W[((Math.round(a / 45) % 8) + 8) % 8]; }

// ---------------- objets de décor examinables (copies non bloquantes d'objets existants) ----------------
const LORE_BASE = { lore_rock: 'rockflat', lore_stump: 'stump', lore_pillar: 'pillar', lore_dead: 'witheredtree', lore_grave: 'grave1', lore_bones: 'bones', lore_fire: 'campfire', lore_lamp: 'lamp', lore_crystal: 'crystal', lore_obsidian: 'obsidian' };
for (const k in LORE_BASE) { const b = PROPS[LORE_BASE[k]] || PROPS.rockflat; const d = Object.assign({}, b, { interact: 'lore', label: 'Examiner' }); delete d.col; PROPS[k] = d; }

// ---------------- placement dans le monde (après tous les autres modules) ----------------
const PLACE = {}; // id → lieu résolu
const _genWorldN = genWorld;
genWorld = function () {
  _genWorldN();
  try {
    buildReach();
    for (const p of PLACES) {
      const pos = nearFreeReach(p.tx, p.ty, p.z === 'forest' ? null : p.z) || [p.tx, p.ty];
      const P2 = Object.assign({}, p, { x: pos[0] * TILE + 16, y: pos[1] * TILE + 20 }); PLACE[p.id] = P2;
      if (p.prop && PROPS[p.prop]) WORLD.props.push({ type: p.prop, x: P2.x, y: P2.y, def: PROPS[p.prop], narr: 1, place: p.id });
    }
    for (const d of NARR_NPCS) {
      let pos = nearFree(d.tx, d.ty, null, 10) || [d.tx, d.ty];
      for (let i = 0; i < 6 && WORLD.npcs.some(n => Math.hypot(n.x - (pos[0] * TILE + 16), n.y - (pos[1] * TILE + 16)) < 40); i++) pos = nearFree(pos[0] + 2, pos[1], null, 6) || pos;
      WORLD.npcs.push({ look: d.look, x: pos[0] * TILE + 16, y: pos[1] * TILE + 16, name: d.name, role: 'narr', narr: d.key, dir: 2 });
    }
  } catch (e) { console.warn('aventure: placement', e); }
};
// présence conditionnelle des personnages (départs, réapparitions)
function npcPresent(n) { const d = n.narr && NNPC[n.narr]; return !d || !d.when || d.when(); }
function syncNpcs() {
  if (!G.npcs || !G.player) return;
  for (const w of WORLD.npcs) {
    if (!w.narr) continue;
    const inG = G.npcs.find(n => n.narr === w.narr && !n.temp);
    const want = npcPresent(w);
    if (want && !inG) G.npcs.push(Object.assign({}, w, { spr: lookSprite(w.look), t: Math.random() * 5 }));
    else if (!want && inG) G.npcs.splice(G.npcs.indexOf(inG), 1);
  }
  for (let i = G.npcs.length - 1; i >= 0; i--) { const n = G.npcs[i]; if (n.temp && n.until < G.t) G.npcs.splice(i, 1); }
  // objets de lieux réservés à une mission : examinables seulement quand ils comptent
  for (const p of WORLD.props) if (p.narr && PLACE[p.place]) p.opened = !placeVisible(PLACE[p.place]);
}

// ---------------- lieux : découverte et lecture ----------------
function placeVisible(p) { return !p.req || p.req(); }
function placeText(p) { return p.after && p.after.when() ? p.after.txt : p.txt; }
function discover(p) {
  const N = NS(); if (N.disc[p.id]) return; N.disc[p.id] = N.seq + 1;
  nLog('lieu', (p.hidden ? 'Lieu secret découvert : ' : 'Découverte : ') + '<b>' + p.n + '</b>.');
  toast((p.hidden ? '✧ Lieu secret : ' : 'Lieu découvert : ') + p.n, p.hidden ? '#ffd27a' : '#e9d5ff');
  if (typeof fogReveal === 'function') fogReveal(p.x, p.y, 6);
  if (typeof repGain === 'function') repGain('cartographes', p.hidden ? 30 : 10);
  if (p.hidden) sfx && sfx('level');
}
function readPlace(p) {
  const N = NS(), P = G.player; discover(p);
  let extra = '';
  // étape de mission liée à ce lieu
  const hit = stepHit('read', p.id) || stepHit('visit', p.id);
  if (hit) extra = '<br><br><i>' + (hit.step.found || '') + '</i>';
  if (!N.read[p.id]) { N.read[p.id] = 1; if (p.reward) { const R = p.reward; if (R.gold) P.gold += R.gold; if (R.item) giveItem(P, R.item[0], R.item[1], 'Découverte : ' + p.n); if (R.rep && typeof repGain === 'function') repGain(R.rep[0], R.rep[1]); extra += `<br><br><small>Trouvé : ${R.gold ? R.gold + ' or' : ''}${R.item && REG[R.item[0]] ? ', ' + R.item[1] + ' × ' + REG[R.item[0]].name : ''}</small>`; } }
  dialog(p.n, placeText(p) + extra, [['Fermer', () => { closePanel(); if (hit) advance(hit.id); }]]);
}
function checkPlaces() {
  for (const id in PLACE) {
    const p = PLACE[id]; if (!placeVisible(p)) continue;
    const d = pDistT(p.x, p.y);
    if (d < (p.prop ? 2.6 : 3.5)) { discover(p); if (!p.prop) { const hit = stepHit('visit', p.id) || stepHit('read', p.id); if (hit) { const s = hit.step; dialog(p.n, placeText(p) + (s.found ? '<br><br><i>' + s.found + '</i>' : ''), [['Continuer', () => { closePanel(); advance(hit.id); }]]); return; } } }
    else if (!p.prop && d < 5) { const hit = stepHit('visit', p.id); if (hit && hit.step.t === 'visit') { } }
  }
  // un lieu à visiter avec un objet : la simple proximité suffit pour « visit »
  for (const id in MISSIONS) { const m = narrM(id); if (!m || m.st !== 1) continue; const s = MISSIONS[id].steps[m.step]; if (s && s.t === 'visit' && PLACE[s.place] && pDistT(PLACE[s.place].x, PLACE[s.place].y) < 3) { const p = PLACE[s.place]; discover(p); if (!G.paused) { dialog(p.n, placeText(p) + (s.found ? '<br><br><i>' + s.found + '</i>' : ''), [['Continuer', () => { closePanel(); advance(id); }]]); } return; } }
}

// ---------------- missions ----------------
function missionAvail(id) { const M = MISSIONS[id], m = narrM(id); return !m && (!M.req || M.req()); }
function giverMatch(n, giver) { return n.narr === giver || n.name === giver; }
function startMission(id, silent) {
  const M = MISSIONS[id], N = NS(); if (N.m[id]) return;
  N.m[id] = { st: 1, step: 0, n: 0, s0: N.seq };
  if (!N.track) N.track = id;
  nLog('mission', `Nouvelle mission — <b>${M.n}</b>. ${M.ctx}`);
  if (!silent) toast('Mission : ' + M.n, '#c4b5fd');
  stepStart(id);
}
function stepStart(id) {
  const M = MISSIONS[id], m = narrM(id), s = M.steps[m.step]; if (!s) return;
  m.n = 0; m.spawned = 0;
}
function stepHit(type, arg) {
  for (const id in MISSIONS) {
    const m = narrM(id); if (!m || m.st !== 1) continue; const s = MISSIONS[id].steps[m.step]; if (!s || s.t !== type) continue;
    if ((type === 'read' || type === 'visit') && s.place === arg) return { id, step: s };
    if ((type === 'talk' || type === 'choice') && arg && giverMatch(arg, s.who)) return { id, step: s };
  }
  return null;
}
function advance(id) {
  const M = MISSIONS[id], m = narrM(id); if (!m || m.st !== 1) return;
  const s = M.steps[m.step];
  if (s && s.clue) addClue(s.clue[0], s.clue[1]);
  if (s && s.found && (s.t === 'read' || s.t === 'visit')) nLog('mission', `${M.n} — ${s.found}`);
  m.step++;
  if (m.step >= M.steps.length) return finishMission(id);
  toast(M.n + ' : ' + M.steps[m.step].hint, '#e9d5ff');
  stepStart(id);
}
function grant(R, srcName) {
  const P = G.player; if (!R) return [];
  const out = [];
  if (R.gold) { P.gold += R.gold; out.push(R.gold + ' or'); }
  if (R.xp) { gainXp(R.xp); out.push(R.xp + ' XP'); }
  for (const [it, q] of (R.items || [])) if (REG[it]) { giveItem(P, it, q, srcName); out.push(q + ' × ' + REG[it].name); }
  if (R.rel && typeof relGain === 'function') relGain(npcName(R.rel[0]), R.rel[1]);
  if (R.rep && typeof repGain === 'function' && FACTIONS[R.rep[0]]) repGain(R.rep[0], R.rep[1]);
  if (R.ws) NS().ws[R.ws] = 1;
  return out;
}
function finishMission(id, choiceKey) {
  const M = MISSIONS[id], m = narrM(id), N = NS();
  m.st = 2; m.s1 = N.seq;
  const got = grant(M.reward, 'Mission : ' + M.n);
  if (choiceKey && M.reward.choice && M.reward.choice[choiceKey]) got.push(...grant(M.reward.choice[choiceKey], 'Mission : ' + M.n));
  nLog('mission', `Mission accomplie — <b>${M.n}</b>. ${M.outro}`);
  toast(`Mission accomplie : ${M.n}${got.length ? ' (' + got.join(', ') + ')' : ''}`, '#ffe27a'); sfx('level');
  if (N.track === id) N.track = nextTrack();
  arcCheck(M.arc);
}
function nextTrack() { for (const id in MISSIONS) { const m = narrM(id); if (m && m.st === 1) return id; } return null; }
function missionOfferDialog(n, id) {
  const M = MISSIONS[id];
  dialog(n.name, M.intro + `<br><br><small>${ARCS[M.arc].n} · ${M.type}${M.lvl ? ' · niveau conseillé ' + M.lvl : ''}</small>`,
    [['Accepter', () => { startMission(id); closePanel(); }], ['Plus tard', closePanel]]);
}
function choiceDialog(n, id, s) {
  dialog(n.name, s.q, s.opts.map(([label, key, after]) => [label, () => {
    const m = narrM(id); m.ch = m.ch || {}; m.ch[s.key] = key; NS().ws['choix_' + s.key] = key;
    nLog('mission', `${MISSIONS[id].n} — choix : « ${label} ».`);
    dialog(n.name, after, [['Terminer', () => { closePanel(); const M = MISSIONS[id]; m.step = M.steps.length; finishMission(id, key); }]]);
  }]));
}
// combats de mission : les ennemis apparaissent quand le joueur approche du lieu (y compris après un rechargement)
function missionSpawns() {
  for (const id in MISSIONS) {
    const m = narrM(id); if (!m || m.st !== 1) continue; const s = MISSIONS[id].steps[m.step]; if (!s || s.t !== 'kill' || !s.spawn) continue;
    const p = PLACE[s.spawn.place]; if (!p) continue;
    const alive = G.enemies.filter(e => !e.dead && e.narrM === id).length;
    const need = s.c - (m.n || 0);
    if (alive >= need || pDistT(p.x, p.y) > 14) continue;
    for (let i = alive; i < need; i++) {
      const a = i / Math.max(1, need) * 6.28 + Math.random(); let x = p.x + Math.cos(a) * 60, y = p.y + Math.sin(a) * 50;
      if (rectBlocked(x - 8, y - 8, 16, 8)) { x = p.x; y = p.y + 30; }
      const e = spawnEnemy(s.spawn.kind, x, y, { once: true, kind: s.spawn.kind, x, y, n: 0, r: 0 }); e.narrM = id; e.aggro = true;
      if (typeof fxAt === 'function') fxAt('flash', x, y - 20, { fps: 24, scale: 0.8 });
    }
    if (!m.spawned) { m.spawned = 1; toast(s.hint, '#ffb3c8'); }
  }
}
function missionKill(kind) {
  for (const id in MISSIONS) {
    const m = narrM(id); if (!m || m.st !== 1) continue; const s = MISSIONS[id].steps[m.step]; if (!s || s.t !== 'kill' || !s.kinds.includes(kind)) continue;
    m.n = (m.n || 0) + 1;
    if (m.n >= s.c) advance(id); else toast(`${MISSIONS[id].n} : ${m.n}/${s.c}`, '#c4b5fd');
  }
}
function missionItems() {
  for (const id in MISSIONS) {
    const m = narrM(id); if (!m || m.st !== 1) continue; const s = MISSIONS[id].steps[m.step];
    if (s && s.t === 'item' && countItem(G.player, s.id) >= s.c && !m.itemOk) { m.itemOk = 1; advance(id); }
    if (s && s.t === 'wait' && s.when()) advance(id);
  }
}
function stepHint(id) { const M = MISSIONS[id], m = narrM(id); if (!m || m.st !== 1) return ''; const s = M.steps[m.step]; if (!s) return ''; let h = s.hint; if (s.t === 'kill') h += ` (${m.n || 0}/${s.c})`; if (s.t === 'item') h += ` (${Math.min(s.c, countItem(G.player, s.id))}/${s.c})`; return h; }

// ---------------- arcs et cycles ----------------
function arcMissions(arcId) {
  const A = ARCS[arcId], out = [];
  for (const id in MISSIONS) if (MISSIONS[id].arc === arcId) out.push({ id, num: MISSIONS[id].num, n: MISSIONS[id].n, own: true, st: narrM(id) ? narrM(id).st : 0 });
  if (A.range && typeof SIDEQ !== 'undefined') for (const q of SIDEQ) { const mm = /^q(\d{3})$/.exec(q.id); if (!mm) continue; const k = +mm[1]; if (k < A.range[0] || k > A.range[1]) continue; const s = G.quests.side && G.quests.side[q.id]; out.push({ id: q.id, num: k, n: q.n.replace(/^Q\d+ — /, ''), own: false, st: s ? s.st : 0 }); }
  return out.sort((a, b) => a.num - b.num);
}
function arcState(arcId) {
  if (arcId === 'main') { const Q = G.quests; const done = typeof sagaDone === 'function' && sagaDone(); return { known: true, done, prog: done ? 1 : Q.main >= 3 ? 0.4 + 0.12 * sagaSeals() : Q.main >= 1 ? 0.2 : 0.05 }; }
  const L = arcMissions(arcId), A = ARCS[arcId]; const tot = A.range ? A.range[1] - A.range[0] + 1 : L.length;
  const done = L.filter(x => x.st === 2).length, known = L.some(x => x.st > 0) || (arcId === 'a1' && hasStyleAny(G.player));
  return { known, done: NS().ev['arc_' + arcId] === 1, prog: done / tot, nDone: done, nTot: tot, nAvail: L.length };
}
function arcCheck(arcId) {
  if (!arcId || NS().ev['arc_' + arcId]) return;
  const own = Object.keys(MISSIONS).filter(id => MISSIONS[id].arc === arcId);
  if (!own.length || !own.every(narrDone)) return;
  NS().ev['arc_' + arcId] = 1;
  nLog('arc', `Fin de l'arc <b>${ARCS[arcId].n}</b>.`);
  later(() => { flashScreen('#e9d5ff', 0.6); sfx('level'); dialog('— ' + ARCS[arcId].n + ' —', arcOutro(arcId), [['Continuer', closePanel]]); }, 900);
}
function arcOutro(arcId) {
  if (arcId === 'a1') return 'La brume s\'est retirée du cimetière oublié. À Brumeval, les lanternes brûlent toute la nuit, la source coule claire, et l\'on ose de nouveau parler de ce qui s\'est passé ici, il y a longtemps.<br><br>Mais l\'Écho n\'était qu\'un reste. Partout où les sceaux noirs passent, d\'autres souffles de Nyx s\'éveillent.<br><br><b>Arc terminé : Débuts à Brumeval.</b><br><small>À suivre : <b>Les Quatre Veilleurs</b> — Ysold, aux Hurlevents.</small>';
  return '<b>Arc terminé.</b>';
}
if (typeof TITLES !== 'undefined') TITLES.push({ id: 'veilleur_brume', n: 'le Veilleur de Brumeval', r: 2, d: 'Apaiser la brume de Brumeval (arc « Débuts à Brumeval »).', ok: () => narrDone('q008') });

// ---------------- personnages : rencontres et mémoire ----------------
function metNpc(n) {
  const N = NS(), k = n.name; if (!k) return;
  const r = N.npc[k] || (N.npc[k] = { met: 0, talks: 0 });
  r.talks++;
  if (!r.met) { r.met = N.seq + 1; let where = ''; try { where = zoneAt(n.x, n.y).name; } catch (e) { } r.where = where; if (!n.temp) nLog('rencontre', `Rencontre : <b>${shortName(k)}</b>${where ? ' (' + where + ')' : ''}.`); }
}
function ctxLine(n) {
  const N = NS();
  for (const L of CTX_LINES) {
    if (N.ctx[L.id]) continue;
    if (L.who !== n.name && L.who !== n.narr) continue;
    try { if (!L.when()) continue; } catch (e) { continue; }
    return L;
  }
  return null;
}
function narrNpcTalk(n) {
  const d = NNPC[n.narr] || {}; metNpc(n);
  // 1. étape « parler » ou « choix » d'une mission
  const hit = stepHit('talk', n) || stepHit('choice', n);
  if (hit) { if (hit.step.t === 'choice') return choiceDialog(n, hit.id, hit.step); return dialog(n.name, hit.step.say, [['Continuer', () => { closePanel(); advance(hit.id); }]]); }
  // 2. mission à proposer
  for (const id in MISSIONS) if (giverMatch(n, MISSIONS[id].giver) && missionAvail(id)) return missionOfferDialog(n, id);
  // 3. phrase contextuelle
  const L = ctxLine(n); if (L) { NS().ctx[L.id] = 1; return dialog(n.name, L.txt, [['Au revoir', closePanel]]); }
  // 4. mission en cours avec ce donneur
  for (const id in MISSIONS) { const m = narrM(id); if (m && m.st === 1 && giverMatch(n, MISSIONS[id].giver)) return dialog(n.name, `<b>${MISSIONS[id].n}</b><br><br>${MISSIONS[id].goal}<br><br><small>Étape : ${stepHint(id)}</small>`, [['Compris', closePanel]]); }
  // 5. présentation, puis répliques du personnage
  const idle = d.idle || ['…'];
  const first = (NS().npc[n.name] || {}).talks <= 1;
  dialog(n.name, (first && d.bio ? `<i>${d.bio}</i><br><br>` : '') + idle[Math.floor(Math.random() * idle.length)], [['Au revoir', closePanel]]);
}

// ---------------- interaction (enveloppe) ----------------
const _interactN = interact;
interact = function (n) {
  if (!n) return _interactN(n);
  if (n.def && n.def.interact === 'lore') { const p = PLACE[n.place]; if (p) { sfx('ui'); return readPlace(p); } }
  if (n.def) return _interactN(n);
  if (n.temp) return tempNpcTalk(n);
  if (n.role === 'narr') { sfx('ui'); const P = G.player; P.dir = dirOf(n.x - P.x, n.y - P.y); n.dir = dirOf(P.x - n.x, P.y - n.y); return narrNpcTalk(n); }
  metNpc(n);
  // PNJ existant : étape de mission, mission à proposer, puis phrase contextuelle — le dialogue habituel suit toujours
  const hit = stepHit('talk', n) || stepHit('choice', n);
  if (hit) { if (hit.step.t === 'choice') return choiceDialog(n, hit.id, hit.step); return dialog(n.name, hit.step.say, [['Continuer', () => { closePanel(); advance(hit.id); }], ['Autre chose', () => { advance(hit.id); _interactN(n); }]]); }
  for (const id in MISSIONS) if (giverMatch(n, MISSIONS[id].giver) && missionAvail(id)) {
    const M = MISSIONS[id];
    return dialog(n.name, M.intro + `<br><br><small>${ARCS[M.arc].n} · ${M.type}</small>`, [['Accepter', () => { startMission(id); closePanel(); }], ['Plus tard', () => _interactN(n)]]);
  }
  const L = ctxLine(n);
  if (L) { NS().ctx[L.id] = 1; return dialog(n.name, L.txt, [['Continuer', () => _interactN(n)], ['Au revoir', closePanel]]); }
  return _interactN(n);
};

// ---------------- événements scriptés ----------------
function calm() { const P = G.player; return G.mode === 'play' && !G.paused && !G.ui && !G.boss && !G.enemies.some(e => !e.dead && e.aggro && Math.hypot(e.x - P.x, e.y - P.y) < 420); }
const SCRIPTED = [
  { id: 'edran_appel', when: () => missionAvail('q001') && inVillage(G.player.x, G.player.y) && calm(),
    run: () => { const n = G.npcs.find(x => x.narr === 'edran'); if (!n) return false; dialog(n.name, MISSIONS.q001.trig + '<br><br>' + MISSIONS.q001.intro, [['Accepter', () => { startMission('q001'); closePanel(); }], ['Plus tard', closePanel]]); metNpc(n); return true; } },
  { id: 'selyne_appel', when: () => missionAvail('q008') && inVillage(G.player.x, G.player.y) && calm(),
    run: () => { toast('Selyne, la vieille voyante, te fait signe depuis l\'est du village.', '#e9d5ff'); nLog('evenement', 'Selyne, la vieille voyante, t\'a fait signe. Elle semble t\'attendre.'); return true; } },
  { id: 'brume_cimetiere', when: () => G.flags.bossDead && !narrDone('q008') && zoneAt(G.player.x, G.player.y).id === 'ruins' && calm(),
    run: () => { nLog('evenement', 'Au cimetière oublié, la brume grise s\'enroule autour des tombes. Elle semble se retirer à ton passage.'); toast('Une brume grise s\'enroule autour des tombes…', '#cbd5e1'); return true; } },
  { id: 'ysold_annonce', when: () => narrDone('q008') && zoneAt(G.player.x, G.player.y).id === 'hurlevents' && calm(),
    run: () => { nLog('evenement', 'Aux Hurlevents, le vent apporte une voix : quelqu\'un, au refuge, attend un messager de Selyne.'); toast('Le vent porte une voix venue du refuge…', '#e9d5ff'); return true; } }
];
function runScripted() {
  const N = NS();
  for (const E of SCRIPTED) { if (N.ev[E.id]) continue; let ok = false; try { ok = E.when(); } catch (e) { } if (ok && E.run() !== false) { N.ev[E.id] = 1; return; } }
}

// ---------------- régions : première arrivée et souvenirs ----------------
let lastZone = null;
function zoneCheck() {
  const z = zoneAt(G.player.x, G.player.y); if (!z || z.id === lastZone) return; lastZone = z.id;
  const N = NS(); if (N.regions[z.id]) return; N.regions[z.id] = N.seq + 1;
  if (z.id !== 'village') nLog('region', `Première arrivée : <b>${z.name}</b>.`);
}
function seedMemories() {
  const N = NS(); if (N.seeded) return; N.seeded = 1;
  const Q = G.quests, F = G.flags, P = G.player, mem = [];
  if (P.magic && typeof MAGIC_DATA !== 'undefined') mem.push(`Le rituel d'Orvael a révélé ta magie innée : <b>${MAGIC_DATA[P.magic].n}</b>.`);
  if (hasStyleAny(P)) mem.push(`Tu as appris ${Object.keys(P.stylesKnown).length > 1 ? 'plusieurs styles de combat' : 'ton premier style de combat'}.`);
  if (F.bossDead) mem.push('Grakhul, le chef de guerre orc, est tombé dans la clairière du nord.');
  if (Q.roi >= 5) mem.push('Le Spectre du dernier roi repose enfin.');
  if (typeof SEAL_KEYS !== 'undefined') for (const k of SEAL_KEYS) if (F[SAGA[k].flag]) mem.push(`Le sceau de ${SAGA[k].region} est brisé.`);
  if (typeof sagaDone === 'function' && sagaDone()) mem.push('Malvorak, le Seigneur démon, est vaincu.');
  if (F.codex && F.codex.r) for (const r in F.codex.r) N.regions[r] = N.regions[r] || 1;
  for (const t of mem) nLog('souvenir', t);
}
// combats majeurs consignés dans le récit
const _questEventN = questEvent;
questEvent = function (t, a) {
  _questEventN(t, a);
  try {
    if (t === 'kill') missionKill(a);
    if (t === 'boss' && a && ENEMIES[a]) nLog('boss', `Victoire : <b>${ENEMIES[a].name}</b> est tombé.`);
  } catch (e) { }
};

// ---------------- événements dynamiques ----------------
const DYN = { next: 120 };
function regionKinds() {
  const z = zoneAt(G.player.x, G.player.y); const out = [];
  for (const s of WORLD.spawns) { if (!s.kind || s.kind.startsWith('boss_') || !ENEMIES[s.kind] || ENEMIES[s.kind].boss) continue; const sz = zoneAt(s.x, s.y); if (sz.id === z.id || (z.id === 'forest' && ['ruins', 'camp'].includes(sz.id))) out.push(s.kind); }
  return [...new Set(out)];
}
function spawnTemp(look, name, tx, ty, life, data) {
  const n = Object.assign({ look, x: tx * TILE + 16, y: ty * TILE + 16, name, role: 'narr', temp: true, until: G.t + life, dir: 2, spr: lookSprite(look), t: 0 }, data || {});
  G.npcs.push(n); return n;
}
function dynamicEvent() {
  const P = G.player, z = zoneAt(P.x, P.y);
  if (z.id === 'village' || (typeof playerSafe === 'function' && playerSafe())) return false;
  const ptx = Math.floor(P.x / TILE), pty = Math.floor(P.y / TILE);
  const a = Math.random() * 6.28, pos = nearFree(ptx + Math.round(Math.cos(a) * 7), pty + Math.round(Math.sin(a) * 5), null, 6); if (!pos) return false;
  const kinds = regionKinds();
  const roll = Math.random();
  if (roll < 0.55 || !kinds.length) {
    // voyageur : rumeur sur un lieu non découvert de la région (direction seulement)
    const N = NS(); const cand = Object.values(PLACE).filter(p => !N.disc[p.id] && placeVisible(p) && zoneAt(p.x, p.y).id === z.id);
    const target = cand.length ? cand[Math.floor(Math.random() * cand.length)] : null;
    const name = TRAVELER_NAMES[Math.floor(Math.random() * TRAVELER_NAMES.length)], look = TRAVELER_LOOKS[Math.floor(Math.random() * TRAVELER_LOOKS.length)];
    spawnTemp(look, name, pos[0], pos[1], 110, { tk: 'voyageur', target: target ? target.id : null });
    toast(name + ' passe sur le chemin.', '#d6e4ff');
    return true;
  }
  // embuscade d'une caravane : défendre le voyageur
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const n = spawnTemp('npc_merchant', 'Un caravanier attaqué', pos[0], pos[1], 75, { tk: 'caravane', wave: [] });
  for (let i = 0; i < 3; i++) { const e = spawnEnemy(kind, n.x + (i - 1) * 50, n.y - 60 - Math.random() * 30, { once: true, kind, x: n.x, y: n.y, n: 0, r: 0 }); e.aggro = true; e.dynEv = n; n.wave.push(e); }
  toast('Des cris ! Un caravanier est attaqué tout près.', '#ffb3c8');
  return true;
}
function dynCheck() {
  for (const n of G.npcs) {
    if (n.tk !== 'caravane' || n.saved) continue;
    if (n.wave.every(e => e.dead)) { n.saved = 1; n.until = G.t + 25; const g = 20 + G.player.lvl * 6; G.player.gold += g; if (typeof repGain === 'function') repGain('garde', 25); nLog('evenement', `Tu as défendu un caravanier attaqué par des ${ENEMIES[n.wave[0].kind].name.toLowerCase()}s.`); toast(`Caravanier sauvé : +${g} or (Garde des Routes)`, '#ffe27a'); }
  }
}
function tempNpcTalk(n) {
  sfx('ui');
  if (n.tk === 'voyageur') {
    const p = n.target && PLACE[n.target];
    let txt;
    if (p && !NS().disc[p.id]) { const dir = dirWord(p.x - n.x, p.y - n.y); txt = TRAVELER_LINES[Math.floor(Math.random() * TRAVELER_LINES.length)].replace('{dir}', dir); if (!n.told) { n.told = 1; nLog('rumeur', `${n.name} a parlé d'un lieu étrange vers le ${dir} (${zoneAt(n.x, n.y).name}).`); } }
    else txt = 'Belle journée pour voyager, non ? Les routes sont plus sûres qu\'avant… un peu.';
    return dialog(n.name, txt, [['Merci', closePanel]]);
  }
  if (n.tk === 'caravane') return dialog(n.name, n.saved ? 'Tu m\'as sauvé la vie ! Je raconterai partout ce que tu as fait.' : 'À l\'aide ! Ils vont tout prendre !', [['…', closePanel]]);
  dialog(n.name, '…', [['Au revoir', closePanel]]);
}

// ---------------- boucle (légère : 2 fois par seconde) ----------------
let narrT = 0;
setInterval(() => {
  try {
    if (!G || G.mode !== 'play' || !G.player || !G.flags) return;
    NS(); seedMemories(); syncNpcs();
    if (G.paused) return;
    zoneCheck(); checkPlaces(); missionSpawns(); missionItems(); dynCheck();
    narrT++;
    if (narrT % 4 === 0) runScripted();
    if (G.t > DYN.next && calm()) { DYN.next = G.t + 150 + Math.random() * 120; if (Math.random() < 0.7) dynamicEvent(); }
  } catch (e) { console.warn('aventure', e); }
}, 500);

// ---------------- objectif affiché (HUD) ----------------
const _questTextN = questText;
questText = function () {
  const base = _questTextN();
  const N = G.flags && G.flags.narr; if (!N) return base;
  const tr = N.track && narrM(N.track) && narrM(N.track).st === 1 ? N.track : null;
  if (tr && !base) return '✒ ' + MISSIONS[tr].n + ' : ' + stepHint(tr);
  return base;
};
// seconde ligne : la mission suivie, quand la trame principale occupe déjà la première
function narrHud() {
  const N = G.flags && G.flags.narr; if (!N || N.hideTrack) return '';
  const tr = N.track && narrM(N.track) && narrM(N.track).st === 1 ? N.track : null; if (!tr) return '';
  return _questTextN() ? '✒ ' + MISSIONS[tr].n + ' : ' + stepHint(tr) : '';
}

// ---------------- journal d'aventure ----------------
if (typeof MENU_TABS !== 'undefined' && !MENU_TABS.some(t => t[0] === 'journal')) MENU_TABS.splice(MENU_TABS.findIndex(t => t[0] === 'quetes'), 0, ['journal', 'Journal']);
let jTab = 'recit';
const _openMenuN = openMenu;
openMenu = function (tab) {
  if (tab) menuTab = tab;
  if (menuTab !== 'journal') return _openMenuN(tab);
  sfx('ui'); const P = G.player; G.ui = { kind: 'menu' };
  const h = tabsHTML(MENU_TABS, 'journal', 'tab', `<span class="gold">${P.gold} or</span>`) + '<div class="pbody">' + journalHTML() + '</div>';
  openPanel(h, 'menu');
};
const J_TABS = [['recit', 'Récit'], ['missions', 'Missions'], ['arcs', 'Arcs'], ['gens', 'Personnages'], ['lieux', 'Lieux'], ['indices', 'Indices']];
function jbox(title, body) { return `<div class="q"><b>${title}</b><p>${body}</p></div>`; }
function journalHTML() {
  const N = NS();
  let h = `<div class="jtabs" style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">${J_TABS.map(([k, n]) => `<button data-jtab="${k}" class="${k === jTab ? 'on' : ''}" style="padding:4px 10px;border-radius:6px;${k === jTab ? 'background:#c9a45a;color:#1a120a' : ''}">${n}</button>`).join('')}</div><div class="quests jour">`;
  if (jTab === 'recit') {
    const L = N.log.slice().reverse();
    h += L.length ? L.slice(0, 120).map(e => `<div class="q" style="padding:4px 8px"><p style="margin:0">${LOG_ICON[e.k] || '•'} ${e.txt}<br><small style="opacity:.6">${e.r || ''}${e.lv ? ' · niveau ' + e.lv : ''}</small></p></div>`).join('') : '<p class="dim">Ton voyage commence à peine. Ce que tu vivras s\'écrira ici.</p>';
  } else if (jTab === 'missions') {
    const act = [], done = [];
    for (const id in MISSIONS) { const m = narrM(id); if (!m) continue; (m.st === 2 ? done : act).push(id); }
    h += act.length ? act.map(id => { const M = MISSIONS[id]; const tracked = N.track === id; return `<div class="q"><b>${M.n}</b> <small>· ${ARCS[M.arc].n} · ${M.type}</small><p>${M.ctx}<br><br><b>Objectif :</b> ${M.goal}<br><b>Étape :</b> ${stepHint(id)}</p><button data-jtrack="${id}">${tracked ? (N.hideTrack ? 'Afficher à l\'écran' : 'Suivie à l\'écran ✔ (masquer)') : 'Suivre à l\'écran'}</button></div>`; }).join('') : '<p class="dim">Aucune mission en cours. Parle aux habitants : certains ont des histoires à raconter.</p>';
    if (done.length) h += '<h4>Missions accomplies</h4>' + done.map(id => { const M = MISSIONS[id]; const m = narrM(id); const ch = m.ch ? Object.values(m.ch).join(', ') : ''; return jbox('✔ ' + M.n, `${M.outro}<br><small>Conséquences : ${M.cons}${ch ? ' · ton choix : ' + ch : ''}</small>`); }).join('');
    h += '<p class="hint">Les quêtes de la trame principale et les contrats des villages restent dans l\'onglet « Quêtes ».</p>';
  } else if (jTab === 'arcs') {
    for (const C of CYCLES) {
      h += `<h4>${C.n}</h4><p class="dim" style="margin:0 0 6px">${C.d}</p>`;
      for (const aid of C.arcs) {
        const A = ARCS[aid], S = arcState(aid);
        if (!S.known && !(S.nAvail > 0 && S.nDone > 0)) { h += jbox('??? <small>(arc non découvert)</small>', '<small>Continue d\'explorer Vélorne.</small>'); continue; }
        let body = A.d;
        if (aid !== 'main') { const L = arcMissions(aid); body += `<br><small>Progression : ${S.nDone}/${S.nTot}${A.range ? ' (Q' + String(A.range[0]).padStart(3, '0') + '–Q' + String(A.range[1]).padStart(3, '0') + ')' : ''}</small><br>` + L.map(x => `${x.st === 2 ? '✔' : x.st === 1 ? '•' : '◦'} ${x.st ? x.n : '???'}`).join('<br>'); if (!A.existing && L.length < S.nTot) body += `<br><small class="dim">${S.nTot - L.length} quête(s) de cet arc ne sont pas encore écrites dans le jeu.</small>`; }
        else body += `<br><small>${S.done ? 'Terminé' : 'En cours'}</small>`;
        h += jbox((S.done ? '✔ ' : '') + A.n, body);
      }
    }
    h += '<p class="hint">Les noms des arcs et des quêtes Q001–Q072 viennent du cahier des charges ; les histoires de l\'arc « Débuts à Brumeval » sont des propositions.</p>';
  } else if (jTab === 'gens') {
    const ks = Object.keys(N.npc).filter(k => N.npc[k].met).sort((a, b) => N.npc[a].met - N.npc[b].met);
    h += ks.length ? ks.map(k => { const d = NARR_NPCS.find(x => x.name === k); const lv = typeof relLevel === 'function' && typeof REL_LV !== 'undefined' ? REL_LV[relLevel(k)] : ''; return jbox(esc(shortName(k)), `${d ? d.bio : esc(k)}<br><small>${N.npc[k].where || ''}${lv ? ' · relation : ' + lv : ''} · ${N.npc[k].talks} conversation(s)</small>`); }).join('') : '<p class="dim">Tu n\'as encore parlé à personne.</p>';
  } else if (jTab === 'lieux') {
    const ids = Object.keys(N.disc).sort((a, b) => N.disc[a] - N.disc[b]);
    const secrets = PLACES.filter(p => p.hidden), sFound = secrets.filter(p => N.disc[p.id]).length;
    h += `<p class="dim">Lieux découverts : ${ids.length}/${PLACES.length} · lieux secrets : ${sFound}/${secrets.length}</p>`;
    h += ids.map(id => { const p = PLACE[id] || PLACES.find(x => x.id === id); if (!p) return ''; return jbox((p.hidden ? '✧ ' : '') + p.n, `${placeText(p)}<br><small>${zoneAt(p.x || 0, p.y || 0).name}</small>`); }).join('');
    const rum = N.log.filter(e => e.k === 'rumeur').slice(-6).reverse();
    if (rum.length) h += '<h4>Rumeurs entendues</h4>' + rum.map(e => `<p>? ${e.txt}</p>`).join('');
  } else if (jTab === 'indices') {
    const ks = Object.keys(N.clue);
    h += ks.length ? ks.map(k => `<div class="q"><p>✧ ${N.clue[k]}</p></div>`).join('') : '<p class="dim">Aucun indice pour l\'instant. Observe, lis, écoute.</p>';
  }
  return h + '</div>';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-jtab],[data-jtrack]'); if (!b) return;
  e.stopPropagation();
  if (b.dataset.jtab) { jTab = b.dataset.jtab; openMenu('journal'); return; }
  if (b.dataset.jtrack) { const N = NS(); if (N.track === b.dataset.jtrack) N.hideTrack = !N.hideTrack; else { N.track = b.dataset.jtrack; N.hideTrack = false; } openMenu('journal'); }
}, true);

// ---------------- ennemis de mission (silhouettes existantes, noms et statistiques propres) ----------------
if (typeof E2 === 'function') Object.assign(ENEMIES, {
  feu_brume: E2('eyeball', { name: 'Feu follet de brume', hp: 70, dmg: 9, xp: 30, gold: [3, 8], res: { ombre: 0.5, lumiere: -0.5 } }),
  sans_visage: E2('dark_mage', { name: 'L\'homme sans visage', hp: 320, dmg: 16, xp: 140, gold: [20, 35], elite: true, res: { ombre: 0.6, lumiere: -0.5 } }),
  gelee_brume: E2('slime', { name: 'Gelée corrompue', hp: 90, dmg: 11, xp: 32, gold: [4, 9], res: { poison: 0.5, feu: -0.3 } }),
  echo_brume: E2('king_specter', { name: 'Écho de la Brume', hp: 1400, dmg: 24, xp: 520, gold: [80, 120], elite: true, res: { ombre: 0.6, lumiere: -0.5 } })
});

// ---------------- repère discret : une lueur violette tant qu'un lieu n'a pas été examiné ----------------
setInterval(() => {
  try {
    if (!G || G.mode !== 'play' || G.paused || !G.player || typeof part !== 'function') return;
    const P = G.player, N = G.flags.narr; if (!N) return;
    for (const p of WORLD.props) {
      if (!p.narr || N.read[p.place] || Math.abs(p.x - P.x) > W || Math.abs(p.y - P.y) > H) continue;
      const pl = PLACE[p.place]; if (pl && !placeVisible(pl)) continue;
      if (Math.random() < 0.6) part(p.x + rnd(-12, 12), p.y - rnd(6, 26), { col: '#d8b4fe', life: 0.9, size: 1, add: true, rise: 12 });
    }
  } catch (e) { }
}, 220);
