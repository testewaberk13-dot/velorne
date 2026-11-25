'use strict';
// =====================================================================
//  MODE ESSAI DES MAGIES (25/11) — demande de l'utilisateur : un lien pour tester toutes les magies.
//  Actif seulement avec « ?essai-magies » dans l'adresse. Sinon ce fichier ne fait rien.
//  En mode essai :
//   - la sauvegarde est désactivée : ta vraie partie n'est jamais modifiée ;
//   - un bouton « 🧪 Magies » ouvre un panneau : choisir n'importe laquelle des 39 familles (maîtrise 10, tout débloqué),
//     seconde magie, mana illimité, ultime et jauge rechargés, cibles d'entraînement (dont une cible « boss »),
//     fin de la forme en cours.
// =====================================================================
const ESSAI = /essai-magies/.test(location.search + location.hash);
if (ESSAI) (function () {
  const T = { inf: true };
  // sauvegarde coupée
  { const sg = saveGame; saveGame = function () { if (!T.warned) { T.warned = 1; try { toast('Mode essai : la sauvegarde est désactivée, ta vraie partie reste intacte', '#9cf'); } catch (e) { } } }; void sg; }
  const css = `#essaiBtn{position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:24;padding:6px 14px;border-radius:20px;border:2px solid #c9a45a;background:linear-gradient(#3a2c1c,#1f1622);color:#ffe9c0;font:bold 13px sans-serif;box-shadow:0 2px 10px #0008;display:none}
.essai .fams{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
.essai .fam{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:9px;border:1px solid #3a2e46;background:#1d1625;color:#e8dcc0;text-align:left;font-size:13px}
.essai .fam i{width:14px;height:14px;border-radius:50%;flex:none;box-shadow:0 0 8px currentColor}
.essai .fam.on{border:2px solid #ffd27a;background:#2e2418}.essai .fam.on2{border:2px solid #9cc4ff}
.essai h4{margin:10px 0 5px;color:#c9a45a;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
.essai .acts{display:flex;flex-wrap:wrap;gap:6px}.essai .acts button{padding:7px 11px;border-radius:8px;border:1px solid #5a4a30;background:#251c2e;color:#ffe9c0;font-size:13px}
.essai .acts button.on{background:#4a3a20;border-color:#c9a45a}
.essai p.h{font-size:12px;color:#9d8e72;margin:4px 0}.essai .mode{display:flex;gap:6px;margin:4px 0}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const btn = document.createElement('button'); btn.id = 'essaiBtn'; btn.textContent = '🧪 Magies'; document.body.appendChild(btn);
  btn.addEventListener('click', e => { e.stopPropagation(); open(); });
  setInterval(() => { btn.style.display = (typeof G !== 'undefined' && G.mode === 'play' && !G.paused) ? 'block' : 'none'; }, 300);
  // mana illimité (si activé)
  setInterval(() => { try { const P = G.player; if (T.inf && P && G.mode === 'play') P.mp = P.st8.maxmp; } catch (e) { } }, 100);
  T.target = 'm1';
  const TIERN = { 1: 'Communes', 2: 'Inhabituelles', 3: 'Rares', 4: 'Épiques', 5: 'Légendaires' };
  function ready(P) {
    // un style de combat, pour tester les effets liés aux coups d'arme (Possession, formes, compression…)
    if (!P.stylesKnown || !Object.keys(P.stylesKnown).length) { P.stylesKnown = { epee: 1 }; P.style = 'epee'; try { if (!P.equip.weapon) { const r = giveItem(P, START_WEAPON.epee, 1, 'Essai', true); P.equip.weapon = r.made[0].uid; } } catch (e) { } }
  }
  function setFam(P, f, second) {
    ready(P); P.mastery = P.mastery || {}; P.mastery[f] = 999999; P.magicT = MAGIC_DATA[f].tier;
    if (second) { if (f === P.magic) return toast('Choisis une autre famille que la magie innée', '#ffb36b'); P.magic2 = f; P.spells.m2 = 1; P.learnedFams = P.learnedFams || []; if (!P.learnedFams.includes(f)) P.learnedFams.push(f); delete (P.eqM || {}).m2; }
    else { if (P.nmForm) { P.nmForm = null; if (P.gb) delete P.gb.nmform; } P.magic = f; P.eqM = {}; P.ultSel = 'C10'; if (P.magic2 === f) P.magic2 = null; }
    if (typeof NM !== 'undefined' && NM.META && NM.META[f]) nmSet(P, f, NM.META[f].max);
    P.cd = {}; P.ult = 100; try { rebuildPlayer(P); } catch (e) { } P.mp = P.st8.maxmp; P.hp = P.st8.maxhp;
    toast((second ? 'Seconde magie : ' : 'Magie : ') + MAGIC_DATA[f].n + ' — maîtrise 10', MAGIC_DATA[f].col);
  }
  function dummies(P, boss) {
    const offs = boss ? [[90, 0]] : [[70, -30], [80, 20], [110, -5], [60, 45]];
    for (const [dx, dy] of offs) { const a = (P.aim || 0); const x = P.x + Math.cos(a) * dx - Math.sin(a) * dy, y = P.y + Math.sin(a) * dx + Math.cos(a) * dy; if (dirSolid(x, y)) continue;
      const e = spawnEnemy('slime', x, y); e.def = Object.assign({}, e.def, { spd: 0, dmg: 0, boss: !!boss, heavy: !!boss, name: boss ? 'Cible d\'entraînement (boss)' : 'Cible d\'entraînement' }); e.hp = e.maxhp = boss ? 60000 : 20000; e.aggro = false; e.essai = 1; }
    toast(boss ? 'Cible « boss » : aucune immobilisation ne doit la retenir' : '4 cibles d\'entraînement', '#ffd27a');
  }
  function html(P) {
    const keys = MAGIC_KEYS.slice(), nm = keys.filter(k => MAGIC_DATA[k].nm), old = keys.filter(k => !MAGIC_DATA[k].nm);
    const fam = k => `<button class="fam${P.magic === k ? ' on' : ''}${P.magic2 === k ? ' on2' : ''}" data-essai="f:${k}"><i style="color:${MAGIC_DATA[k].col};background:${MAGIC_DATA[k].col}"></i>${esc(MAGIC_DATA[k].n)}</button>`;
    let h = `<div class="ptabs"><button class="on">🧪 Essai des magies</button><button class="x" data-essai="close">✕</button></div><div class="pbody essai">`;
    h += `<p class="h">Choisis une famille : elle est donnée maîtrise 10, toutes ses compétences débloquées, jauge pleine, ultime chargé. Place ensuite tes sorts dans <b>Menu › Compétences</b>. Sauvegarde désactivée.</p>`;
    h += `<div class="mode"><span class="h" style="align-self:center">Remplacer :</span><div class="acts"><button class="${T.target === 'm1' ? 'on' : ''}" data-essai="t:m1">Magie innée</button><button class="${T.target === 'm2' ? 'on' : ''}" data-essai="t:m2">Seconde magie</button></div></div>`;
    h += `<div class="acts"><button data-essai="dum">🎯 4 cibles</button><button data-essai="boss">👑 Cible « boss »</button><button data-essai="clear">Retirer les cibles</button><button data-essai="ult">Ultime chargé</button><button data-essai="gauge">Jauge pleine</button><button data-essai="endform">Fin de la forme</button><button class="${T.inf ? 'on' : ''}" data-essai="inf">Mana illimité : ${T.inf ? 'oui' : 'non'}</button><button data-essai="comp">Ouvrir mes sorts ›</button></div>`;
    h += `<h4>Nouvelles magies (12)</h4><div class="fams">${nm.map(fam).join('')}</div>`;
    for (const t of [5, 4, 3, 2, 1]) { const L = old.filter(k => MAGIC_DATA[k].tier === t); if (L.length) h += `<h4>${TIERN[t]} (${L.length})</h4><div class="fams">${L.map(fam).join('')}</div>`; }
    return h + '</div>';
  }
  function open() { const P = G.player; if (!P) return; const sc = document.querySelector('.panel .pbody'); const y = sc ? sc.scrollTop : 0; openPanel(html(P), 'menu'); const nb = document.querySelector('.panel .pbody'); if (nb) nb.scrollTop = y; }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-essai]'); if (!b) return; e.stopPropagation(); e.preventDefault();
    const P = G.player; if (!P) return; const [k, a] = b.dataset.essai.split(':');
    if (k === 'close') { closePanel(); return; }
    if (k === 'f') { setFam(P, a, T.target === 'm2'); }
    else if (k === 't') T.target = a;
    else if (k === 'dum' || k === 'boss') { closePanel(); dummies(P, k === 'boss'); return; }
    else if (k === 'clear') { for (const e2 of G.enemies) if (e2.essai) e2.dead = true; G.enemies = G.enemies.filter(x => !x.essai); }
    else if (k === 'ult') { P.ult = 100; toast('Ultime chargé', '#ffd27a'); }
    else if (k === 'gauge') { for (const f of [P.magic, P.magic2]) if (f && NM.META[f]) nmSet(P, f, NM.META[f].max); toast('Jauges pleines', '#ffd27a'); }
    else if (k === 'endform') { if (P.gb) delete P.gb.nmform; P.nmForm = null; }
    else if (k === 'inf') T.inf = !T.inf;
    else if (k === 'comp') { openMenu('comp'); return; }
    sfx('ui'); open();
  }, true);
})();
