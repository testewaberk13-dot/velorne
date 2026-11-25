'use strict';
// =====================================================================
//  ÉCRAN DES SORTS (25/11) — onglet « Compétences » du menu
//  Demande de l'utilisateur : une interface claire et jolie pour composer ses sorts, avec « sorts équipés » et
//  « sorts disponibles », et changer vite. Fonctionnement : on touche un emplacement (en haut), puis le sort à y mettre
//  (en bas) ; s'il était déjà sur un autre emplacement, les deux s'échangent. La fiche du sort choisi reste visible.
//  Valable pour les 27 familles et les 12 nouvelles. Les règles d'équipement du jeu sont réutilisées telles quelles
//  (equipM, emplacement 4, ultime) : rien n'est modifié dans la logique, seul l'écran change.
//  Sans magie révélée, l'onglet d'origine reste affiché.
// =====================================================================
const SUI = { slot: 's1', fam: 0 };
(function () {
  const css = `
.sui{display:flex;flex-direction:column;gap:10px;color:#e8dcc0}
.sui-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.sui-fam{display:flex;align-items:center;gap:10px;flex:1;min-width:220px;padding:8px 12px;border-radius:9px;background:linear-gradient(90deg,var(--fc2),transparent 85%);border:1px solid #4a3a28}
.sui-fam .dot{width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff8,var(--fc) 45%,#0008);box-shadow:0 0 12px var(--fc)}
.sui-fam b{font-size:16px;color:#ffe9c0}.sui-fam small{display:block;color:#bfae8a;font-size:11px}
.sui-bar{height:6px;background:#2a1f33;border-radius:3px;margin-top:4px;overflow:hidden}.sui-bar i{display:block;height:6px;background:var(--fc);border-radius:3px}
.sui-tabs{display:flex;gap:6px}.sui-tabs button{padding:6px 12px;border-radius:20px;border:1px solid #5a4a30;background:#221a2b;color:#d9c9a0;font-size:13px}
.sui-tabs button.on{background:#4a3a20;color:#ffe9c0;border-color:#c9a45a}
.sui-h{display:flex;align-items:baseline;gap:8px;margin:2px 0 0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#c9a45a}
.sui-h small{text-transform:none;letter-spacing:0;color:#9d8e72;font-size:12px}
.sui-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,300px);gap:10px;align-items:start}
@media (max-width:640px){.sui-top{grid-template-columns:1fr}}
.sui-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}
.sui-slot{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 6px 7px;border-radius:10px;border:1px solid #4a3a28;background:linear-gradient(#251c2e,#1a1322);color:#e8dcc0;min-height:104px;cursor:pointer;transition:transform .12s,border-color .12s,box-shadow .12s}
.sui-slot:hover{transform:translateY(-1px);border-color:#8a7040}
.sui-slot.on{border:2px solid #ffd27a;box-shadow:0 0 0 3px #ffd27a33,0 0 14px #ffd27a55;background:linear-gradient(#3a2c1c,#1f1622)}
.sui-slot .key{position:absolute;top:4px;left:5px;font-size:10px;color:#c9a45a;background:#0006;border-radius:4px;padding:0 4px}
.sui-slot .lab{font-size:10px;color:#9d8e72;text-transform:uppercase;letter-spacing:.05em}
.sui-slot img,.sui-sp img,.sui-info img{image-rendering:pixelated;border-radius:7px;border:1px solid #0008}
.sui-slot img{width:44px;height:44px}.sui-slot .nm{font-size:11.5px;line-height:1.15;text-align:center;max-height:2.4em;overflow:hidden}
.sui-slot.ult{border-color:#7a4a20;background:linear-gradient(#2e1c18,#1a1218)}.sui-slot.ult.on{border-color:#ffb36b;box-shadow:0 0 0 3px #ffb36b33,0 0 14px #ffb36b55}
.sui-slot.lock{opacity:.55}
.sui-info{padding:10px;border-radius:10px;border:1px solid #5a4a30;background:linear-gradient(#211a2a,#16101c);display:flex;flex-direction:column;gap:6px}
.sui-info .t{display:flex;gap:10px;align-items:center}.sui-info img{width:52px;height:52px}
.sui-info b{color:#ffe9c0;font-size:15px}.sui-info .role{color:#c9a45a;font-size:12px}
.sui-info p{margin:0;font-size:12.5px;line-height:1.4;color:#d8ccb0}
.sui-chips{display:flex;gap:5px;flex-wrap:wrap}.sui-chips span{font-size:11px;padding:2px 7px;border-radius:10px;background:#2c2236;border:1px solid #44365a;color:#d8ccb0}
.sui-chips .mp{border-color:#2a4a8a;color:#9cc4ff}.sui-chips .cd{border-color:#5a4a30;color:#ffd99a}.sui-chips .rs{border-color:var(--fc);color:#fff}
.sui-hint{font-size:12px;color:#9d8e72;background:#1a1420;border:1px dashed #3a2e46;border-radius:8px;padding:6px 10px}
.sui-hint b{color:#ffd27a}
.sui-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:7px}
.sui-sp{position:relative;display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:9px;border:1px solid #3a2e46;background:#1d1625;color:#e8dcc0;text-align:left;cursor:pointer;transition:background .12s,border-color .12s}
.sui-sp:hover{background:#271e31;border-color:#6a5a80}
.sui-sp img{width:36px;height:36px;flex:none}.sui-sp .nm{font-size:12.5px;line-height:1.2}.sui-sp small{display:block;font-size:10.5px;color:#9d8e72;margin-top:1px}
.sui-sp.cur{border-color:#ffd27a;background:#2e2418}.sui-sp.lock{opacity:.45;cursor:not-allowed}
.sui-sp .tag{position:absolute;top:3px;right:4px;font-size:9.5px;padding:0 5px;border-radius:6px;background:#c9a45a;color:#1a1208;font-weight:bold}
.sui-sp .tag.lk{background:#3a2e46;color:#bfae8a}
.sui-sec{font-size:11px;color:#9d8e72;margin:4px 0 0;text-transform:uppercase;letter-spacing:.05em}
.sui-more{border:1px solid #3a2e46;border-radius:9px;background:#18121e}.sui-more summary{cursor:pointer;padding:8px 10px;color:#c9a45a;font-size:13px}
.sui-more .sk{border-bottom:1px solid #2e2438}
@media (max-height:520px){.sui-fam{padding:5px 10px}.sui-fam .dot{width:22px;height:22px}.sui-fam b{font-size:14px}.sui-slot{min-height:92px;padding:6px 4px}.sui-slot img{width:36px;height:36px}.sui-grid{grid-template-columns:repeat(auto-fill,minmax(136px,1fr))}.sui-info img{width:42px;height:42px}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

// ---------------- données : emplacements et sorts ----------------
function suiIcon(o) { try { return o && o.canvasIcon ? o.canvasIcon.url : (o && o.icon ? 'assets/ui/' + o.icon + '.png' : lockIcon().url); } catch (e) { return ''; } }
// un sort repéré par son code d'équipement : L0..L2 (sorts de base), C1..C11 (grimoire), clé de sort secret, ou ultime
function suiSpell(fam, sel) {
  const F = MAGIC_DATA[fam];
  if (sel[0] === 'L') { const sp = F.spells[+sel.slice(1)]; if (!sp) return null; return { n: sp.n, d: sp.d || '', mp: sp.mp, cd: sp.cd, role: 'Sort de base', url: spellIcon(fam, sp.k).url, base: 1 }; }
  if (sel[0] === 'C') { const n = +sel.slice(1), g = grimSpell(fam, n); if (!g) return null; return { n: g.n, d: g.d || '', mp: g.mp, cd: g.cd, role: g.role || '', url: grimIcon(fam, g).url, cost: g.cost, ult: g.ult, n0: n, id: g.id }; }
  return null;
}
function suiSlots(P) {
  const L = [];
  const lab = { s1: 'skill1', s2: 'skill2', s3: 'skill3', s5: 'skill5' };
  for (const [sl, n] of [['s1', 1], ['s2', 2], ['s3', 3]]) L.push({ id: sl, lab: 'Sort ' + n, key: actLabel(lab[sl]), fam: P.magic });
  L.push({ id: 's4', lab: 'Sort 4', key: actLabel('skill4'), fam: null, secret: 1 });
  L.push({ id: 's5', lab: 'Sort 5', key: actLabel('skill5'), fam: P.magic });
  if (P.magic2) L.push({ id: 'm2', lab: '2e magie', key: '', fam: P.magic2 });
  L.push({ id: 'ult', lab: 'Ultime', key: actLabel('ult'), fam: P.magic, ult: 1 });
  return L;
}
// sort actuellement placé sur un emplacement
function suiCurrent(P, s) {
  if (s.secret) { const d = skillDef(P.slot4) || SKILLS.s4; return { sel: P.slot4, n: d.name, d: d.desc || '', mp: d.mp, cd: d.cd, role: 'Sort secret', url: suiIcon(d) }; }
  if (s.ult) { if (P.ultSel === 'C10' && grimSpell(P.magic, 10)) return Object.assign({ sel: 'C10' }, suiSpell(P.magic, 'C10'), { role: 'Ultime du grimoire' }); return { sel: 'L', n: MAGIC_DATA[P.magic].ult || 'Ultime commun', d: (SKILLS.ult && SKILLS.ult.desc) || '', role: 'Ultime de base', url: suiIcon(SKILLS.ult) }; }
  const sel = equippedSel(P, s.id); const sp = suiSpell(s.fam, sel);
  if (!sp || (sel[0] === 'C' && !skillOpen(P, s.fam, +sel.slice(1)))) return { sel, n: 'Verrouillé', d: s.id === 's5' ? 'L\'emplacement 5 s\'ouvre avec la 4e compétence du grimoire (maîtrise ' + (SKILL_LVL[4] || 2) + ').' : '', role: '', url: lockIcon().url, lock: 1 };
  return Object.assign({ sel }, sp);
}
// sorts proposés pour un emplacement
function suiOptions(P, s) {
  const out = [];
  if (s.secret) { for (const k of ['s4', ...Object.keys(P.spells || {})]) { const d = skillDef(k); if (d) out.push({ sel: k, n: d.name, mp: d.mp, cd: d.cd, url: suiIcon(d), group: k === 's4' ? 'Sort de départ' : 'Sorts secrets' }); } return out; }
  const fam = s.fam, GR = GRIMOIRE[fam] || [], nm = typeof NM !== 'undefined' && NM.META && NM.META[fam];
  if (s.ult) { out.push({ sel: 'L', n: MAGIC_DATA[fam].ult || 'Ultime commun', url: suiIcon(SKILLS.ult), group: 'Ultimes' }); const g = grimSpell(fam, 10); if (g) out.push(Object.assign({ sel: 'C10', group: 'Ultimes', lock: !skillOpen(P, fam, 10), lvl: SKILL_LVL[10] || 10 }, suiSpell(fam, 'C10'))); return out; }
  if (!nm) MAGIC_DATA[fam].spells.forEach((sp, i) => out.push(Object.assign({ sel: 'L' + i, group: 'Sorts de base' }, suiSpell(fam, 'L' + i))));
  const order = nm ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 11] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (const n of order) { if (!GR[n - 1]) continue; out.push(Object.assign({ sel: 'C' + n, group: 'Grimoire', lock: !skillOpen(P, fam, n), lvl: SKILL_LVL[n] || n }, suiSpell(fam, 'C' + n))); }
  return out;
}
// équiper : mêmes règles que l'écran d'origine
function suiEquip(P, s, sel) {
  if (s.secret) { P.slot4 = sel; P.cd.s4 = 0; return true; }
  if (s.ult) { if (sel === 'C10' && !skillOpen(P, P.magic, 10)) { toast('L\'ultime du grimoire demande la maîtrise niveau 10', '#ffb36b'); return false; } P.ultSel = sel; return true; }
  return equipM(P, s.id, sel);
}

// ---------------- écran ----------------
function suiHTML(P) {
  const slots = suiSlots(P); if (!slots.find(s => s.id === SUI.slot)) SUI.slot = 's1';
  const S = slots.find(s => s.id === SUI.slot), famShown = S.fam || P.magic, F = MAGIC_DATA[famShown], info = magXpInfo(P, famShown);
  const pct = info.next ? Math.round((info.x - info.base) / (info.next - info.base) * 100) : 100;
  const nm = typeof NM !== 'undefined' && NM.META && NM.META[famShown]; const cat = nm ? ({ transfo: 'transformation', maitrise: '', legende: '' })[nm.cat] : (MAGIC_CATS[F.cat] || '');
  const tier = MAGIC_TIERS[F.tier] ? (MAGIC_TIERS[F.tier].n || MAGIC_TIERS[F.tier].name || '') : '';
  const col = F.col || '#c9a45a';
  let h = `<div class="sui" style="--fc:${col};--fc2:${col}33">`;
  // en-tête : la magie, sa maîtrise, et sa jauge propre pour les nouvelles magies
  h += `<div class="sui-head"><div class="sui-fam"><div class="dot"></div><div style="flex:1"><b>${esc(F.n)}</b><small>${esc([tier, cat].filter(Boolean).join(' · '))}${S.id === 'm2' ? ' · seconde magie' : ' · magie innée'}</small>
    <small>Maîtrise ${info.l}/10 — ${info.next ? info.x + ' / ' + info.next + ' XP' : 'complète'}${nm ? ' · ' + esc(nm.res) + ' ' + Math.round(nmRes(P, famShown)) + '/' + nm.max : ''}</small><div class="sui-bar"><i style="width:${pct}%"></i></div></div></div></div>`;
  // emplacements équipés + fiche du sort sélectionné
  const cur = suiCurrent(P, S);
  h += `<div class="sui-h">Sorts équipés <small>touche un emplacement pour le changer</small></div><div class="sui-top"><div class="sui-slots">`;
  for (const s of slots) { const c = suiCurrent(P, s); h += `<button class="sui-slot${s.id === SUI.slot ? ' on' : ''}${s.ult ? ' ult' : ''}${c.lock ? ' lock' : ''}" data-sui="slot:${s.id}">${s.key ? `<span class="key">${esc(s.key)}</span>` : ''}<span class="lab">${s.lab}</span><img src="${c.url}" alt=""><span class="nm">${esc(c.n)}</span></button>`; }
  h += `</div><div class="sui-info"><div class="t"><img src="${cur.url}" alt=""><div><div class="role">${esc(S.lab)}${cur.role ? ' · ' + esc(cur.role) : ''}</div><b>${esc(cur.n)}</b></div></div>
    <div class="sui-chips">${cur.mp ? `<span class="mp">${cur.mp} mana</span>` : ''}${cur.cd ? `<span class="cd">${cur.cd} s de recharge</span>` : ''}${cur.cost && nm ? `<span class="rs">${esc(nm.res)} −${cur.cost}</span>` : ''}${S.key ? `<span>touche ${esc(S.key)}</span>` : ''}</div>
    ${cur.d ? `<p>${esc(cur.d)}</p>` : ''}</div></div>`;
  // sorts disponibles pour l'emplacement sélectionné
  const opts = suiOptions(P, S);
  const where = {}; for (const s of slots) if (!s.secret && !s.ult && s.fam === S.fam) { const k = equippedSel(P, s.id); (where[k] = where[k] || []).push(s.id === 'm2' ? '2e' : s.lab.replace('Sort ', '')); }
  h += `<div class="sui-h">Sorts disponibles <small>pour « ${esc(S.lab)} »</small></div>`;
  h += `<div class="sui-hint">Touche un sort pour le placer dans <b>${esc(S.lab)}</b>. S'il est déjà équipé ailleurs, les deux emplacements s'échangent.</div>`;
  let grp = null;
  for (const o of opts) {
    if (o.group !== grp) { if (grp !== null) h += `</div>`; grp = o.group; h += `<div class="sui-sec">${esc(grp)}</div><div class="sui-grid">`; }
    const isCur = o.sel === cur.sel, tag = o.lock ? `<span class="tag lk">Niv. ${o.lvl}</span>` : (where[o.sel] ? `<span class="tag">${where[o.sel].join(' · ')}</span>` : (isCur ? '<span class="tag">✓</span>' : ''));
    h += `<button class="sui-sp${isCur ? ' cur' : ''}${o.lock ? ' lock' : ''}" data-sui="eq:${S.id}:${o.sel}" title="${esc(o.d || '')}"><img src="${o.lock ? lockIcon().url : o.url}" alt=""><span><span class="nm">${esc(o.n)}</span><small>${o.lock ? 'maîtrise niveau ' + o.lvl : [o.mp ? o.mp + ' mana' : '', o.cd ? o.cd + ' s' : '', o.role || ''].filter(Boolean).join(' · ')}</small></span>${tag}</button>`;
  }
  if (grp !== null) h += `</div>`;
  if (!opts.length) h += `<div class="sui-hint">Aucun sort disponible pour cet emplacement.</div>`;
  h += `</div>`;
  return h;
}
// l'onglet garde ses autres informations (technique d'arme, aptitude raciale, synergie, combat), repliées sous la grille
{ const sk0 = skillsHTML; skillsHTML = function (P) {
    if (!P || !P.magic) return sk0(P);
    let rest = ''; try { const full = sk0(P); const i = full.indexOf('<div class="sk"><div><b>Aptitude raciale'); const t = full.indexOf('Technique d\'arme'); const tStart = full.lastIndexOf('<div class="sk">', t);
      rest = (t >= 0 ? full.slice(tStart, full.indexOf('</div></div>', t) + 12) : '') + (i >= 0 ? full.slice(i).replace(/<\/div>\s*$/, '') : ''); } catch (e) { }
    return `<div class="skills">${suiHTML(P)}${rest ? `<details class="sui-more"><summary>Technique d'arme, aptitude raciale, synergie et combat</summary>${rest}</details>` : ''}</div>`;
  }; }
// clics : sélection d'emplacement, équipement ; la position de défilement est conservée
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-sui]'); if (!b) return; e.stopPropagation(); e.preventDefault();
  const P = G.player; if (!P) return; const [k, a, c] = b.dataset.sui.split(':');
  const body = document.querySelector('.panel .pbody'), sc = body ? body.scrollTop : 0;
  if (k === 'slot') { SUI.slot = a; sfx('ui'); }
  else if (k === 'eq') { const s = suiSlots(P).find(x => x.id === a); if (!s) return; const o = suiOptions(P, s).find(x => x.sel === c);
    if (o && o.lock) { toast('Se débloque à la maîtrise niveau ' + o.lvl, '#ffb36b'); return; }
    if (suiEquip(P, s, c)) { sfx('ui'); if (IS_TOUCH) try { setupTouch(); } catch (er) { } } else toast('Compétence pas encore débloquée', '#ffb36b'); }
  openMenu('comp'); const nb = document.querySelector('.panel .pbody'); if (nb) nb.scrollTop = sc;
}, true);
