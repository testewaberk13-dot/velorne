'use strict';
// =====================================================================
//  ÉCRAN D'ACCUEIL : scène vivante (survol du monde au crépuscule,
//  lumières, lucioles, brume, rayons), logo, menu principal.
// =====================================================================
const TITLE_SHOTS = [
  { x: 48, y: 59, z: 0 }, { x: 66, y: 60, z: 0 }, { x: 47, y: 40, z: 0 }, { x: 18, y: 40, z: 0 }, { x: 18, y: 14, z: 0 }, { x: 48, y: 12, z: 0 }, { x: 78, y: 34, z: 0 },
];
const TITLE = { t: 0, walkers: null, parts: [], last: 0 };
function titleCam(t) {
  const seg = 14; const i = Math.floor(t / seg) % TITLE_SHOTS.length; const k = (t % seg) / seg;
  const A = TITLE_SHOTS[i], B = TITLE_SHOTS[(i + 1) % TITLE_SHOTS.length];
  const e = k < 0.7 ? 0 : (k - 0.7) / 0.3; const ee = e * e * (3 - 2 * e);
  const drift = Math.sin(t * 0.15) * 30;
  return { x: clamp(lerp(A.x, B.x, ee) * TILE - W / 2 + drift + k * 40, 0, MW * TILE - W), y: clamp(lerp(A.y, B.y, ee) * TILE - H / 2 + Math.cos(t * 0.11) * 18, 0, MH * TILE - H), fade: e > 0 && e < 1 ? Math.sin(e * Math.PI) : 0 };
}
function titleWalkers() {
  if (TITLE.walkers) return TITLE.walkers;
  TITLE.walkers = WORLD.npcs.map(n => ({ x: n.x, y: n.y, hx: n.x, hy: n.y, spr: lookSprite(n.look), dir: 2, t: Math.random() * 10, tx: n.x, ty: n.y, look: n.look }));
  return TITLE.walkers;
}
function drawTitleBg() {
  const now = performance.now() / 1000; const dt = Math.min(0.05, TITLE.last ? now - TITLE.last : 0.016); TITLE.last = now; TITLE.t += dt; G.t = TITLE.t;
  const cam = titleCam(TITLE.t); const cx = Math.round(cam.x), cy = Math.round(cam.y);
  drawTerrain(ctx, cx, cy);
  G.lights = [];
  const vis = p => p.x > cx - 140 && p.x < cx + W + 140 && p.y > cy - 30 && p.y < cy + H + 220;
  for (const p of WORLD.props) if (p.def.flat && vis(p)) drawProp(ctx, p, cx, cy);
  for (const p of WORLD.props) if (p.def.arcane && vis(p)) { drawCircle(ctx, p.x - cx, p.y - cy, 80, TITLE.t * 0.6, p.def.arcane, 0.8); addLight(p.x, p.y - 10, 120, p.def.arcane, 0.9); }
  for (const p of WORLD.props) if (p.def.circle && vis(p)) { drawCircle(ctx, p.x - cx, p.y - cy - 4, 40, TITLE.t, p.def.circle, 0.75); addLight(p.x, p.y - 20, 70, p.def.circle, 0.8); }
  // décors + habitants triés en profondeur
  const L = [];
  for (const p of WORLD.props) if (!p.def.flat && vis(p)) { L.push({ y: p.y, p }); if (p.def.light) addLight(p.x + p.def.light[0], p.y + p.def.light[1], p.def.light[2], p.def.light[3]); }
  for (const w of titleWalkers()) {
    w.t += dt; const d = dist(w.x, w.y, w.tx, w.ty);
    if (d < 3) { if (Math.random() < dt * 0.4) { w.tx = w.hx + rnd(-50, 50); w.ty = w.hy + rnd(-30, 30); } }
    else { const a = Math.atan2(w.ty - w.y, w.tx - w.x); w.x += Math.cos(a) * 22 * dt; w.y += Math.sin(a) * 22 * dt; w.dir = dirOf(Math.cos(a), Math.sin(a)); }
    if (w.x > cx - 60 && w.x < cx + W + 60 && w.y > cy - 20 && w.y < cy + H + 80) L.push({ y: w.y, w, moving: d >= 3 });
  }
  L.sort((a, b) => a.y - b.y);
  for (const o of L) {
    if (o.p) drawProp(ctx, o.p, cx, cy);
    else { drawShadow(ctx, o.w.x - cx, o.w.y - cy, 10, 0.3); drawChar(ctx, o.w.spr, 'walk', o.w.dir, o.moving ? 1 + Math.floor(o.w.t * 8) % 8 : 0, o.w.x - cx, o.w.y - cy); }
  }
  // particules : lucioles, feuilles, poussière dorée
  if (Math.random() < 0.5) TITLE.parts.push({ x: cx + Math.random() * W, y: cy + Math.random() * H, vx: rnd(-6, 6), vy: rnd(-6, 4), t: 0, life: rnd(3, 6), k: 'fly' });
  if (Math.random() < 0.15) TITLE.parts.push({ x: cx + Math.random() * W, y: cy - 8, vx: rnd(10, 24), vy: rnd(12, 22), t: 0, life: 8, k: 'leaf', c: choice(['#7fb24a', '#d9a441', '#b8642a', '#a3c45a']) });
  for (const p of TITLE.parts) { p.t += dt; p.x += (p.vx + (p.k === 'leaf' ? Math.sin(p.t * 3) * 12 : Math.sin(p.t * 2) * 5)) * dt; p.y += p.vy * dt; }
  TITLE.parts = TITLE.parts.filter(p => p.t < p.life);
  // éclairage de crépuscule
  drawLighting(ctx, cx, cy, 0.42, 'rgba(30,14,48,1)');
  ctx.globalCompositeOperation = 'lighter';
  for (const p of TITLE.parts) {
    const a = Math.sin(p.t / p.life * Math.PI);
    if (p.k === 'fly') { const g = glowSprite('220,255,140', 8); ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(p.t * 6)); ctx.drawImage(g, p.x - cx - 5, p.y - cy - 5, 10, 10); ctx.fillStyle = '#f4ffc0'; ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), 1, 1); }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  for (const p of TITLE.parts) if (p.k === 'leaf') { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), 2, 1); ctx.fillRect(Math.round(p.x - cx) + 1, Math.round(p.y - cy) + 1, 1, 1); }
  // rayons de lumière obliques
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const x0 = (i * 160 + TITLE.t * 6) % (W + 200) - 100; const a = 0.05 + 0.03 * Math.sin(TITLE.t * 0.5 + i);
    const g = ctx.createLinearGradient(x0, 0, x0 + 120, H); g.addColorStop(0, `rgba(255,210,150,${a})`); g.addColorStop(1, 'rgba(255,210,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + 40, 0); ctx.lineTo(x0 + 160, H); ctx.lineTo(x0 + 80, H); ctx.closePath(); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  // brume basse + vignette + fondu de transition entre les plans
  const fog = ctx.createLinearGradient(0, H * 0.55, 0, H); fog.addColorStop(0, 'rgba(180,170,210,0)'); fog.addColorStop(1, 'rgba(180,170,210,0.22)');
  ctx.fillStyle = fog; ctx.fillRect(0, H * 0.55, W, H * 0.45);
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(6,3,14,0.75)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(6,3,14,0.35)'; ctx.fillRect(0, 0, W * 0.42, H);
  if (cam.fade > 0) { ctx.fillStyle = `rgba(6,3,14,${cam.fade * 0.85})`; ctx.fillRect(0, 0, W, H); }
}
// ---------------- menu principal ----------------
function showTitle() {
  const sv = loadGame();
  G.mode = 'title'; G.paused = false;
  $('title').classList.add('show');
  const c = $('btnContinue');
  if (sv) { c.disabled = false; c.querySelector('small').textContent = esc(sv.name || 'Héros') + ' · ' + (RACES[(sv.look && sv.look.race) || 'humain'] || RACES.humain).n + ' · niveau ' + (sv.lvl || 1); }
  else { c.disabled = true; c.querySelector('small').textContent = 'Aucune sauvegarde'; }
}
function titleCommandsHTML() {
  const k = a => SET.keys[a].map(keyName).join(' / ');
  return `<div class="cmds"><div><h4>Clavier et souris</h4>
    <p>Déplacement : <b>${k('up')}, ${k('left')}, ${k('down')}, ${k('right')}</b></p><p>Attaque : <b>${k('attack')}</b> ou clic gauche (maintenir = attaque chargée)</p><p>Esquive : <b>${k('dodge')}</b> · Parade : <b>${k('block')}</b> ou clic droit</p>
    <p>Technique d'arme : <b>${k('tech')}</b> · Sorts : <b>${k('skill1')}, ${k('skill2')}, ${k('skill3')}, ${k('skill4')}</b> · Ultime : <b>${k('ult')}</b></p><p>Aptitude raciale : <b>${k('racial')}</b> · Éveil : <b>${k('awaken')}</b> · Relique : <b>${k('relic')}</b> · Potion : <b>${k('potion')}</b></p>
    <p>Interagir : <b>${k('interact')}</b> · Menu : <b>${k('menu')}</b> · Inventaire : <b>${k('inventory')}</b> · Personnage : <b>${k('character')}</b> · Quêtes : <b>${k('map')}</b></p><small>Toutes les touches se modifient dans Paramètres.</small></div>
    <div><h4>Écran tactile (paysage)</h4><p>Moitié gauche : joystick qui apparaît sous le doigt.</p><p>Moitié droite : ⚔ attaque (maintenir = chargée), » esquive, bouclier parade, sorts 1 à 4, ultime, ✦ technique, ❖ aptitude raciale, potion, ✋ interagir.</p><p>☰ menu et sac en haut à gauche. Les boutons se déplacent et se redimensionnent dans Paramètres.</p></div>
    <div><h4>Manette (Xbox · PlayStation)</h4><p>Stick gauche : déplacement · stick droit : viser</p><p><b>A / ✕</b> attaque (près d'un personnage ou d'un objet : interagir) · <b>B / ○</b> esquive · <b>X / □</b> technique d'arme · <b>Y / △</b> ultime</p><p><b>LB / L1</b> parade (maintenir) · <b>LT / L2</b> sort 1 · <b>RT / R2</b> sort 2 · <b>RB / R1</b> sort 3</p><p>Croix : <b>↑</b> sort 4 · <b>↓</b> potion · <b>←</b> aptitude raciale · <b>→</b> relique</p><p><b>L3</b> éveil · <b>R3</b> interagir · <b>Start</b> menu · <b>Select</b> inventaire</p><p>Dans les menus : croix ou stick pour naviguer, <b>A</b> valider, <b>B</b> retour, <b>LB / RB</b> changer d'onglet.</p><p>Vibrations et zone morte du stick : Paramètres.</p></div></div>`;
}
function titleSettingsHTML() {
  return `<div class="opts"><div class="row"><button data-opt="sound">Effets sonores : ${SET.sound ? 'oui' : 'non'}</button><button data-opt="music">Musique : ${SET.music ? 'oui' : 'non'}</button><button data-opt="shake">Tremblements : ${SET.shake ? 'oui' : 'non'}</button><button data-opt="fs">Plein écran</button><button data-opt="fastspin">Animations de Spin : ${SET.fastSpin ? 'rapides' : 'complètes'}</button><button data-opt="durability">Durabilité des équipements : ${SET.durability ? 'activée' : 'désactivée'}</button><button data-opt="transfer">Transférer ma sauvegarde</button></div>
    <h4>Manette</h4><div class="row"><button data-opt="rumble">Vibrations : ${SET.rumble ? 'oui' : 'non'}</button><button data-opt="dead">Zone morte du stick : ${Math.round((SET.padDead || 0.2) * 100)} %</button><span class="hint">${PAD.connected ? 'Manette détectée : ' + esc((PAD.id || '').split('(')[0]) : 'Aucune manette détectée : branche-la ou appuie sur un bouton.'}</span></div>
    ${IS_TOUCH ? `<h4>Commandes tactiles</h4><div class="row"><button data-opt="bigger">Boutons plus grands</button><button data-opt="smaller">Boutons plus petits</button><button data-opt="resettouch">Disposition par défaut</button></div><small>Le déplacement des boutons se fait en jeu (Menu → Paramètres).</small>` : ''}
    <h4>Touches du clavier</h4><div class="keys">${Object.keys(ACTION_LABEL).map(a => `<div><span>${ACTION_LABEL[a]}</span><button data-bind="${a}">${SET.keys[a].map(keyName).join(' / ')}</button></div>`).join('')}</div>
    <div class="row"><button data-opt="resetkeys">Touches par défaut</button></div></div>`;
}
function openTitlePanel(kind) {
  $('title').classList.remove('show');
  const tabs = [['opt', 'Paramètres'], ['cmd', 'Commandes'], ['credits', 'Crédits']];
  const body = kind === 'opt' ? titleSettingsHTML() : kind === 'cmd' ? titleCommandsHTML() : creditsHTML();
  openPanel(`<div class="ptabs">${tabs.map(([k, n]) => `<button class="${k === kind ? 'on' : ''}" data-ttab="${k}">${n}</button>`).join('')}<button class="x" data-tback="1">‹ Retour</button></div><div class="pbody">${body}</div>`, 'menu titlepanel');
  G.paused = false;
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-ttab],[data-tback]'); if (!t) return;
  sfx('ui');
  if (t.dataset.ttab) openTitlePanel(t.dataset.ttab); else { $('panel').className = 'panel'; showTitle(); }
});
function titleStart() { audioInit(); playMusic('title'); }
$('btnNew').onclick = () => {
  titleStart(); sfx('ui');
  const go = () => { $('title').classList.remove('show'); openCreator(); };
  if (loadGame()) dialogTitle('Commencer une nouvelle partie ? La sauvegarde existante sera remplacée lorsque tu valideras ton nouveau personnage.', go); else go();
};
$('btnContinue').onclick = () => { if ($('btnContinue').disabled) return; titleStart(); sfx('ui'); const sv = loadGame(); if (!sv) return showTitle(); fadeTo(() => { $('title').classList.remove('show'); startGame(sv.look, sv); }); };
$('btnOpts').onclick = () => { titleStart(); sfx('ui'); openTitlePanel('opt'); };
$('btnCmds').onclick = () => { titleStart(); sfx('ui'); openTitlePanel('cmd'); };
$('btnCredits').onclick = () => { titleStart(); sfx('ui'); openTitlePanel('credits'); };
$('btnFs').onclick = () => { titleStart(); goFullscreen(); };
function dialogTitle(msg, ok) {
  const box = document.createElement('div'); box.className = 'tconfirm'; box.innerHTML = `<div><p>${msg}</p><div class="row"><button class="big" id="tcOk">Continuer</button><button class="big" id="tcNo">Annuler</button></div></div>`;
  document.body.appendChild(box); $('tcOk').onclick = () => { box.remove(); ok(); }; $('tcNo').onclick = () => box.remove();
}
function fadeTo(fn) { const f = $('fader'); f.classList.add('on'); setTimeout(() => { fn(); setTimeout(() => f.classList.remove('on'), 60); }, 380); }

// ---------------- transfert de sauvegarde entre appareils ----------------
function saveCode() { if (G.mode === 'play') saveGame(); const sv = store(SAVE_KEY); if (!sv) return null; return 'VELORNE1:' + btoa(unescape(encodeURIComponent(JSON.stringify(sv)))); }
function openSaveTransfer() {
  const code = saveCode();
  const box = document.createElement('div'); box.className = 'tconfirm';
  box.innerHTML = `<div style="max-width:620px;text-align:left"><h3 style="font-family:Georgia,serif;color:#ffe9c0">Transférer ma sauvegarde</h3>
    <p style="font-size:13px;color:#d9c9a0">Pour continuer ta partie sur un autre appareil (PC ↔ iPhone) : <b>exporte</b> ici, puis <b>importe</b> sur l'autre appareil. Tu peux copier le code (et te l'envoyer par message ou dans tes notes) ou télécharger le fichier.</p>
    <textarea id="svcode" style="width:100%;height:90px;background:#120c18;color:#ffe9c0;border:1px solid #c9a45a;border-radius:5px;font-size:11px;padding:6px" placeholder="Colle ici un code de sauvegarde pour l'importer">${code || ''}</textarea>
    <div class="row" style="margin-top:8px"><button class="big" id="svCopy" ${code ? '' : 'disabled'}>Copier le code</button><button class="big" id="svFile" ${code ? '' : 'disabled'}>Télécharger le fichier</button></div>
    <div class="row" style="margin-top:6px"><button class="big" id="svImport">Importer le code collé</button><label class="big" style="text-align:center;cursor:pointer">Importer un fichier<input type="file" id="svIn" accept=".json,.txt,application/json,text/plain" style="display:none"></label><button class="big" id="svClose">Fermer</button></div>
    <p id="svMsg" class="hint"></p></div>`;
  document.body.appendChild(box);
  const msg = t => { box.querySelector('#svMsg').textContent = t; };
  box.querySelector('#svCopy').onclick = () => { const ta = box.querySelector('#svcode'); ta.value = code; ta.select(); try { navigator.clipboard ? navigator.clipboard.writeText(code).then(() => msg('Code copié.'), () => { document.execCommand('copy'); msg('Code copié.'); }) : (document.execCommand('copy'), msg('Code copié.')); } catch (e) { msg('Sélectionne le texte et copie-le manuellement.'); } };
  box.querySelector('#svFile').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' })); a.download = 'velorne-sauvegarde.txt'; document.body.appendChild(a); a.click(); a.remove(); msg('Fichier téléchargé.'); };
  const doImport = txt => {
    try {
      txt = (txt || '').trim(); if (!txt.startsWith('VELORNE1:')) throw 0;
      const sv = JSON.parse(decodeURIComponent(escape(atob(txt.slice(9))))); if (!sv || !sv.look) throw 0;
      store(SAVE_KEY, sv); msg('Sauvegarde importée ! Le jeu redémarre…'); setTimeout(() => location.reload(), 900);
    } catch (e) { msg('Code invalide : vérifie que tout le texte a bien été copié.'); }
  };
  box.querySelector('#svImport').onclick = () => { const t = box.querySelector('#svcode').value; if (t === code) return msg('Colle d\'abord le code venant de l\'autre appareil.'); if (code && !confirm('Remplacer la sauvegarde actuelle de cet appareil ?')) return; doImport(t); };
  box.querySelector('#svIn').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => doImport(r.result); r.readAsText(f); };
  box.querySelector('#svClose').onclick = () => box.remove();
}
