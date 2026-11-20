'use strict';
// =====================================================================
//  CRÉATION DU PERSONNAGE (identité et apparence uniquement)
//  Étapes : Race → Corps → Visage → Cheveux → Tenue → Identité.
//  La magie innée et le style de combat se découvrent en jeu.
// =====================================================================
const CR = { step: 0, look: defaultLook('humain', 'm'), name: '', dir: 2, anim: 'idle', spr: null, raf: 0, portraits: {} };
const CR_STEPS = ['Race', 'Corps', 'Visage', 'Cheveux', 'Tenue', 'Identité'];
function crSprite() { CR.spr = composeCharacter(playerLayers({ look: CR.look }, { torso: 'ar_tunique', legs: 'ar_pantalon', feet: 'ar_bottes' })); }
function crPortrait(race) {
  if (CR.portraits[race]) return CR.portraits[race];
  const L = defaultLook(race, 'm'); const spr = composeCharacter(playerLayers({ look: L }, { torso: 'ar_tunique', legs: 'ar_pantalon', feet: 'ar_bottes' }));
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
  drawChar(c, spr, spr.anims.idle ? 'idle' : 'walk', 2, 0, 32, 60);
  CR.portraits[race] = cv.toDataURL(); return CR.portraits[race];
}
const sw = (v, cur, attr, label, bg, extra) => `<button class="sw ${cur === v ? 'on' : ''}" ${attr}="${v}" ${bg ? `style="background:${bg}"` : ''} ${extra || ''}>${label || ''}</button>`;
function crOptionsHTML() {
  const L = CR.look, R = RACES[L.race], O = L.outfit;
  const grp = (t, html) => `<div class="crg"><label>${t}</label><div class="row">${html}</div></div>`;
  if (CR.step === 0) {
    return `<div class="racecards">${RACE_ORDER.map(k => `<button class="racecard ${L.race === k ? 'on' : ''}" data-race="${k}"><img src="${crPortrait(k)}"><b>${RACES[k].n}</b><small>${RACES[k].short}</small></button>`).join('')}</div>
    <div class="racedesc"><h3>${R.n}</h3><p class="lore">${R.origin}</p><p><b>Physique :</b> ${R.physique}</p>
    <div class="rcols"><div><h4>Capacités raciales</h4>${R.traits.map(t => '<p>◆ ' + t + '</p>').join('')}</div>
    <div><h4>Résistances et faiblesses</h4><p>${Object.entries(R.res).map(([k, v]) => `<span class="${v > 0 ? 'okc' : 'down'}">${ELEMENTS[k]} ${v > 0 ? '+' : ''}${Math.round(v * 100)} %</span>`).join(' · ') || 'Aucune'}</p><p><small>${R.weak}</small></p>
    <h4>Aptitude active : ${R.active.n}</h4><p>${R.active.desc} <small>(recharge ${R.active.cd} s)</small></p><h4>Évolution</h4><p>${R.growthText}</p></div></div></div>`;
  }
  if (CR.step === 1) {
    return grp('Sexe', sw('m', L.sex, 'data-sex', 'Homme') + sw('f', L.sex, 'data-sex', 'Femme'))
      + grp('Morphologie', sw('m', L.body, 'data-body', 'Carrure large') + sw('f', L.body, 'data-body', 'Silhouette fine'))
      + grp('Couleur de peau', R.skins.map(s => sw(s, L.skin, 'data-skin', '', paletteHex('body', s), `title="${SKIN_NAMES[s] || s}"`)).join(''))
      + `<p class="hint">Peau : ${SKIN_NAMES[L.skin] || L.skin}. La morphologie change la silhouette de toutes les tenues et armures.</p>`;
  }
  if (CR.step === 2) {
    const faces = R.faces.m.concat(R.faces.f);
    let h = grp('Visage', faces.map(f => sw(f, L.face, 'data-face', FACES[f])).join(''))
      + grp('Yeux', EYE_LIST.map(e => sw(e, L.eyes, 'data-eyes', '', paletteHex('eye', e), `title="${EYE_LABEL[e]}"`)).join(''));
    if (R.nose) h += grp('Nez', [['none', 'Naturel'], ['nose_button', 'Retroussé'], ['nose_straight', 'Droit'], ['nose_big', 'Fort']].map(([v, n]) => sw(v, L.nose || 'none', 'data-nose', n)).join(''));
    if (L.race !== 'lezard') h += grp('Sourcils', [['none', 'Naturels'], ['brows_thin', 'Fins'], ['brows_thick', 'Épais']].map(([v, n]) => sw(v, L.brows || 'none', 'data-brows', n)).join(''));
    if (R.ears) h += grp('Oreilles elfiques', R.ears.map(e => sw(e, L.ears, 'data-ears', R.earNames[e])).join(''));
    if (R.horns) h += grp('Cornes', R.horns.map(e => sw(e, L.horns, 'data-horns', R.hornNames[e])).join('')) + grp('Couleur des cornes', Object.keys(HORN_COLORS).map(v => sw(v, L.hornColor || 'demon_obsidian', 'data-hornc', '', paletteHex('body', v), `title="${HORN_COLORS[v]}"`)).join(''));
    if (L.race === 'demi_demon') h += grp('Queue démoniaque', sw('1', L.tail ? '1' : '0', 'data-tail', 'Oui') + sw('0', L.tail ? '1' : '0', 'data-tail', 'Non')) + grp('Ailes vestigiales', sw('1', L.wings ? '1' : '0', 'data-wings', 'Oui') + sw('0', L.wings ? '1' : '0', 'data-wings', 'Non'));
    if (L.race === 'lezard') h += `<p class="hint">Les hommes-lézards ont une queue et des écailles ; leur couleur suit celle de la peau.</p>`;
    return h;
  }
  if (CR.step === 3) {
    let h = grp('Coiffure', HAIR_LIST.map(v => sw(v, L.hair, 'data-hair', HAIR_LABEL[v])).join(''))
      + grp('Couleur des cheveux', HAIR_COLOR_LIST.map(v => sw(v, L.hairColor, 'data-hc', '', paletteHex('hair', v))).join(''));
    if (R.beard) h += grp('Barbe', BEARD_LIST.map(v => sw(v, L.beard, 'data-beard', BEARD_LABEL[v])).join(''));
    return h;
  }
  if (CR.step === 4) {
    const cols = (cur, attr, none) => (none ? sw('none', cur || 'none', attr, 'Aucun') : '') + CLOTH_LIST.map(v => sw(v, cur, attr, '', paletteHex('cloth', v), `title="${v}"`)).join('');
    return grp('Haut', Object.entries(TORSO_LIST).map(([k, n]) => sw(k, O.torso, 'data-torso', n)).join('')) + (O.torso !== 'robe' ? grp('Couleur du haut', cols(O.torsoC, 'data-torsoc')) : '')
      + grp('Bas', Object.entries(LEGS_LIST).map(([k, n]) => sw(k, O.legs, 'data-legs', n)).join('')) + grp('Couleur du bas', cols(O.legsC, 'data-legsc'))
      + grp('Chaussures', Object.entries(FEET_LIST).map(([k, n]) => sw(k, O.feet, 'data-feet', n)).join('')) + grp('Couleur des chaussures', cols(O.feetC, 'data-feetc'))
      + grp('Cape', cols(O.cape, 'data-cape', true)) + grp('Écharpe', cols(O.scarf, 'data-scarf', true)) + grp('Bandeau', cols(O.bandana, 'data-bandana', true))
      + grp('Accessoires', sw('1', O.belt ? '1' : '0', 'data-belt', O.belt ? 'Ceinture ✓' : 'Ceinture') + sw('1', O.necklace ? '1' : '0', 'data-neck', O.necklace ? 'Pendentif ✓' : 'Pendentif'));
  }
  return `<div class="crid"><label>Nom du héros</label><input id="crname" maxlength="16" placeholder="Nom du héros" value="${esc(CR.name)}">
    <div class="crsum"><p><b>Race :</b> ${R.n} — ${R.short}</p><p><b>Aptitude raciale :</b> ${R.active.n}</p><p><b>Magie innée :</b> <i>inconnue</i>. Elle te sera révélée par le Maître Mage de Brumeval.</p><p><b>Style de combat :</b> <i>aucun</i>. Les maîtres d'armes t'enseigneront leurs techniques.</p></div>
    <p class="hint">Ton aventure commence au village de Brumeval, sans pouvoir ni formation : tout reste à découvrir.</p></div>`;
}
function openCreator(keep) {
  if (!keep) { CR.step = 0; CR.look = defaultLook('humain', 'm'); CR.name = ''; CR.dir = 2; CR.anim = 'idle'; }
  G.mode = 'creator';
  $('creator').innerHTML = `<div class="crbox2"><div class="crhead"><h2>Création du personnage</h2><div class="steps">${CR_STEPS.map((s, i) => `<button class="${i === CR.step ? 'on' : i < CR.step ? 'done' : ''}" data-step="${i}"><i>${i + 1}</i>${s}</button>`).join('')}</div></div>
    <div class="crmain"><div class="crstage"><canvas id="crview" width="160" height="160"></canvas><div class="crrot"><button data-rot="-1">⟲</button><button data-rot="1">⟳</button></div>
      <div class="crani">${[['idle', 'Repos'], ['walk', 'Marche'], ['slash', 'Attaque'], ['spellcast', 'Sort']].map(([a, n]) => `<button class="${CR.anim === a ? 'on' : ''}" data-ani="${a}">${n}</button>`).join('')}</div><div class="crrace">${RACES[CR.look.race].n}</div></div>
    <div class="cropts2">${crOptionsHTML()}</div></div>
    <div class="crfoot"><button class="big ghost" data-crnav="back">${CR.step === 0 ? '‹ Menu principal' : '‹ Précédent'}</button>${CR.step < CR_STEPS.length - 1 ? '<button class="big" data-crnav="next">Suivant ›</button>' : '<button class="big gold" id="crgo">Commencer l\'aventure</button>'}</div></div>`;
  $('creator').classList.add('show');
  const nm = $('crname'); if (nm) { nm.oninput = e => CR.name = e.target.value; setTimeout(() => !IS_TOUCH && nm.focus(), 50); }
  const go = $('crgo'); if (go) go.onclick = () => { if (!CR.name.trim()) { CR.name = { humain: 'Aldren', elfe: 'Sylvaën', orc: 'Grosh', lezard: 'Ssira', demi_demon: 'Malzir' }[CR.look.race]; } $('creator').classList.remove('show'); cancelAnimationFrame(CR.raf); store(SAVE_KEY, null); fadeTo(() => startGame(CR.look, null)); };
  crSprite(); crLoop();
}
function crLoop() {
  cancelAnimationFrame(CR.raf); const cv = $('crview'); if (!cv) return; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; let t = 0;
  const loop = () => {
    if (!$('crview')) return; t += 1 / 60;
    c.clearRect(0, 0, 160, 160);
    const g = c.createRadialGradient(80, 120, 4, 80, 120, 80); g.addColorStop(0, 'rgba(255,220,150,0.35)'); g.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = g; c.fillRect(0, 0, 160, 160);
    c.fillStyle = 'rgba(40,28,20,0.9)'; c.beginPath(); c.ellipse(80, 140, 46, 12, 0, 0, 7); c.fill(); c.strokeStyle = '#c9a45a'; c.lineWidth = 1; c.beginPath(); c.ellipse(80, 140, 46, 12, 0, 0, 7); c.stroke();
    drawShadow(c, 80, 139, 18, 0.4);
    const A = CR.spr.anims[CR.anim] || CR.spr.anims.walk; const n = A.cols;
    const fr = CR.anim === 'idle' ? Math.floor(t * 1.6) % 2 : CR.anim === 'walk' ? 1 + Math.floor(t * 9) % 8 : Math.floor(t * 10) % n;
    c.save(); c.translate(80, 140); c.scale(2, 2); drawChar(c, CR.spr, CR.anim, CR.dir, fr, 0, 0); c.restore();
    if (Math.random() < 0.15) { /* poussière dorée */ c.fillStyle = 'rgba(255,230,160,0.7)'; c.fillRect(30 + Math.random() * 100, 30 + Math.random() * 100, 1, 1); }
    CR.raf = requestAnimationFrame(loop);
  };
  loop();
}
$('creator').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset; const L = CR.look, O = L.outfit; sfx('ui');
  if (d.step !== undefined) { CR.step = +d.step; return openCreator(true); }
  if (d.crnav === 'next') { CR.step = Math.min(CR_STEPS.length - 1, CR.step + 1); return openCreator(true); }
  if (d.crnav === 'back') { if (CR.step === 0) { $('creator').classList.remove('show'); cancelAnimationFrame(CR.raf); return showTitle(); } CR.step--; return openCreator(true); }
  if (d.rot) { CR.dir = (CR.dir + (+d.rot === 1 ? 1 : 3)) % 4; return; }
  if (d.ani) { CR.anim = d.ani; document.querySelectorAll('[data-ani]').forEach(x => x.classList.toggle('on', x.dataset.ani === d.ani)); return; }
  let changed = true;
  if (d.race) { const sex = L.sex; const nl = defaultLook(d.race, sex); nl.outfit = O; CR.look = nl; }
  else if (d.sex) { L.sex = d.sex; L.body = d.sex; const R = RACES[L.race]; L.face = R.faces[d.sex][0]; if (L.race !== 'lezard' && (L.hair === 'hair_messy' || L.hair === 'hair_long')) L.hair = d.sex === 'f' ? 'hair_long' : 'hair_messy'; if (d.sex === 'f') L.beard = 'none'; }
  else if (d.body) L.body = d.body;
  else if (d.skin) L.skin = d.skin;
  else if (d.face) L.face = d.face;
  else if (d.eyes) L.eyes = d.eyes;
  else if (d.nose) L.nose = d.nose;
  else if (d.brows) L.brows = d.brows;
  else if (d.ears) L.ears = d.ears;
  else if (d.horns) L.horns = d.horns;
  else if (d.hornc) L.hornColor = d.hornc;
  else if (d.tail) L.tail = d.tail === '1';
  else if (d.wings) L.wings = d.wings === '1';
  else if (d.hair) L.hair = d.hair;
  else if (d.hc) L.hairColor = d.hc;
  else if (d.beard) L.beard = d.beard;
  else if (d.torso) O.torso = d.torso; else if (d.torsoc) O.torsoC = d.torsoc;
  else if (d.legs) O.legs = d.legs; else if (d.legsc) O.legsC = d.legsc;
  else if (d.feet) O.feet = d.feet; else if (d.feetc) O.feetC = d.feetc;
  else if (d.cape) O.cape = d.cape === 'none' ? null : d.cape;
  else if (d.scarf) O.scarf = d.scarf === 'none' ? null : d.scarf;
  else if (d.bandana) O.bandana = d.bandana === 'none' ? null : d.bandana;
  else if (d.belt) O.belt = !O.belt;
  else if (d.neck) O.necklace = !O.necklace;
  else changed = false;
  if (changed) { const sc = document.querySelector('.cropts2'); const st = sc ? sc.scrollTop : 0; openCreator(true); const sc2 = document.querySelector('.cropts2'); if (sc2) sc2.scrollTop = st; }
});
