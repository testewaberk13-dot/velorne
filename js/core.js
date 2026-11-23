'use strict';
// ===================== utilitaires =====================
const TILE = 32;
let W = 512, H = 288;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const choice = a => a[Math.floor(Math.random() * a.length)];
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const $ = id => document.getElementById(id);
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function store(k, v) { try { if (v === undefined) { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
// direction LPC : 0 haut, 1 gauche, 2 bas, 3 droite
function dirOf(dx, dy) { return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 3) : (dy < 0 ? 0 : 2); }
const DIRV = [[0, -1], [-1, 0], [0, 1], [1, 0]];

// ===================== paramètres =====================
const DEFAULT_KEYS = {
  up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  attack: ['KeyJ'], dodge: ['Space'], block: ['KeyL'], skill1: ['Digit1', 'KeyU'], skill2: ['Digit2', 'KeyI'],
  skill3: ['Digit3', 'KeyO'], skill4: ['Digit4', 'KeyP'], ult: ['KeyR'], potion: ['KeyF'], interact: ['KeyE'],
  menu: ['Escape'], inventory: ['KeyB', 'Tab'], character: ['KeyC'], map: ['KeyM'], tech: ['KeyQ'], awaken: ['KeyG'], relic: ['KeyV'], racial: ['KeyX'], mount: ['KeyH']
};
const ACTION_LABEL = {
  up: 'Haut', down: 'Bas', left: 'Gauche', right: 'Droite', attack: 'Attaque', dodge: 'Esquive', block: 'Parade',
  skill1: 'Compétence 1', skill2: 'Compétence 2', skill3: 'Compétence 3', skill4: 'Compétence 4', ult: 'Ultime',
  potion: 'Potion', interact: 'Interagir', menu: 'Menu', inventory: 'Inventaire', character: 'Personnage', map: 'Quêtes', tech: 'Technique d\'arme', awaken: 'Éveil / transformation', relic: 'Relique', racial: 'Aptitude raciale', mount: 'Monture'
};
const SET = Object.assign({ sound: true, music: true, shake: true, keys: null, touch: null, btnScale: 1, durability: false, fastSpin: false, rumble: true, padDead: 0.2 }, store('vel_set') || {});
if (!SET.keys) SET.keys = JSON.parse(JSON.stringify(DEFAULT_KEYS));
for (const k in DEFAULT_KEYS) if (!SET.keys[k]) SET.keys[k] = DEFAULT_KEYS[k].slice();
function saveSet() { store('vel_set', SET); }
function keyName(code) {
  if (!code) return '—';
  return code.replace('Key', '').replace('Digit', '').replace('Arrow', '↑').replace('↑Up', '↑').replace('↑Down', '↓').replace('↑Left', '←').replace('↑Right', '→').replace('Space', 'Espace').replace('Escape', 'Échap');
}

// ===================== entrées =====================
const IN = { held: {}, pressed: {}, released: {}, ax: 0, ay: 0, mouse: { x: 0, y: 0, active: false, t: 0 } };
let rebinding = null;
function actOf(code) { const r = []; for (const a in SET.keys) if (SET.keys[a].includes(code)) r.push(a); return r; }
function press(a) { if (!IN.held[a]) IN.pressed[a] = true; IN.held[a] = true; }
function release(a) { if (IN.held[a]) IN.released[a] = true; IN.held[a] = false; }
function clearPressed() { IN.pressed = {}; IN.released = {}; }
window.addEventListener('keydown', e => {
  if (rebinding) { e.preventDefault(); rebinding(e.code); return; }
  const acts = actOf(e.code);
  if (acts.length) { e.preventDefault(); if (!e.repeat) acts.forEach(press); }
  audioInit();
});
window.addEventListener('keyup', e => { actOf(e.code).forEach(release); });
window.addEventListener('blur', () => { for (const a in IN.held) release(a); });
function moveAxis() {
  let x = (IN.held.right ? 1 : 0) - (IN.held.left ? 1 : 0), y = (IN.held.down ? 1 : 0) - (IN.held.up ? 1 : 0);
  if (TOUCH.stick.on) { x = TOUCH.stick.x; y = TOUCH.stick.y; }
  if (Math.hypot(PAD.ax, PAD.ay) > 0.05) { x = PAD.ax; y = PAD.ay; }
  const m = Math.hypot(x, y);
  if (m > 1) { x /= m; y /= m; }
  return [x, y, Math.min(1, m)];
}

// ===================== manette (API Gamepad) =====================
// Disposition (Xbox ; PlayStation : A=✕, B=○, X=□, Y=△) :
// A attaque (interagir près d'un PNJ ou d'un objet) · B esquive · X technique d'arme · Y ultime
// LB parade · RB sort 3 · LT sort 1 · RT sort 2 · croix : ↑ sort 4, ↓ potion, ← aptitude raciale, → relique
// L3 éveil · R3 interagir · stick droit : viser · Select inventaire · Start menu
const PAD_MAP = { 0: 'attack', 1: 'dodge', 2: 'tech', 3: 'ult', 4: 'block', 5: 'skill3', 6: 'skill1', 7: 'skill2', 8: 'inventory', 9: 'menu', 10: 'awaken', 11: 'interact', 12: 'skill4', 13: 'potion', 14: 'racial', 15: 'relic' };
const PAD_LABEL = { attack: 'A', dodge: 'B', tech: 'X', ult: 'Y', block: 'LB', skill3: 'RB', skill1: 'LT', skill2: 'RT', inventory: 'Sel', menu: 'Start', awaken: 'L3', interact: 'A', skill4: '↑', potion: '↓', racial: '←', relic: '→', map: 'Sel', character: 'Start' };
const PAD = { active: false, connected: false, ax: 0, ay: 0, rx: 0, ry: 0, prev: {}, held: {}, id: null, nav: { t: 0, dir: null }, gp: null };
function padDead(v) { const d = SET.padDead || 0.2; return Math.abs(v) < d ? 0 : Math.sign(v) * (Math.abs(v) - d) / (1 - d); }
function setPadMode(on) { if (PAD.active === on) return; PAD.active = on; document.body.classList.toggle('padmode', on); }
window.addEventListener('gamepadconnected', e => { PAD.id = e.gamepad.id; PAD.connected = true; setPadMode(true); if (typeof toast === 'function' && typeof G !== 'undefined' && G.mode === 'play') toast('Manette connectée : ' + (e.gamepad.id || '').split('(')[0].trim(), '#9fe3ff'); });
window.addEventListener('gamepaddisconnected', () => { PAD.connected = false; for (const a in PAD.held) if (PAD.held[a]) release(a); PAD.held = {}; PAD.ax = PAD.ay = 0; setPadMode(false); if (typeof toast === 'function' && typeof G !== 'undefined' && G.mode === 'play') toast('Manette déconnectée', '#ffb36b'); });
window.addEventListener('touchstart', () => setPadMode(false), { passive: true });
window.addEventListener('mousemove', e => { if (PAD.active && (Math.abs(e.movementX) + Math.abs(e.movementY) > 6)) setPadMode(false); });
window.addEventListener('keydown', () => { if (PAD.active) setPadMode(false); });
function padBtn(gp, i) { const b = gp.buttons[i]; if (!b) return false; return i === 6 || i === 7 ? b.value > 0.35 || b.pressed : b.pressed || b.value > 0.5; }
function pollPad() {
  let gp = null;
  try { const pads = navigator.getGamepads ? navigator.getGamepads() : []; for (const p of pads) if (p && p.connected) { gp = p; break; } } catch (e) { gp = null; }
  PAD.gp = gp; if (!gp) { PAD.ax = PAD.ay = PAD.rx = PAD.ry = 0; return; }
  if (!PAD.connected || PAD.id !== gp.id) { PAD.connected = true; PAD.id = gp.id; }
  PAD.ax = padDead(gp.axes[0] || 0); PAD.ay = padDead(gp.axes[1] || 0); PAD.rx = padDead(gp.axes[2] || 0); PAD.ry = padDead(gp.axes[3] || 0);
  let any = Math.abs(PAD.ax) + Math.abs(PAD.ay) + Math.abs(PAD.rx) + Math.abs(PAD.ry) > 0.3;
  const inPlay = typeof G !== 'undefined' && G.mode === 'play' && !G.paused;
  for (const k in PAD_MAP) {
    const i = +k; const on = padBtn(gp, i); const was = !!PAD.prev[i];
    if (on && !was) {
      any = true;
      let a = PAD_MAP[i];
      if (i === 0 && inPlay && G.near) a = 'interact';
      PAD.held[i] = a; press(a);
      if (a === 'menu' || a === 'inventory') document.dispatchEvent(new CustomEvent('padmenu', { detail: a }));
    } else if (!on && was) { if (PAD.held[i]) release(PAD.held[i]); PAD.held[i] = null; }
    PAD.prev[i] = on;
  }
  if (any) setPadMode(true);
}
function padRumble(strong, weak, ms) {
  if (!SET.rumble || !PAD.gp) return;
  try { const v = PAD.gp.vibrationActuator; if (v && v.playEffect) v.playEffect('dual-rumble', { duration: ms || 120, strongMagnitude: strong, weakMagnitude: weak }); } catch (e) {}
}
// libellé d'une action selon le périphérique utilisé (clavier ou manette)
const PS_LABEL = { A: '✕', B: '○', X: '□', Y: '△', LB: 'L1', RB: 'R1', LT: 'L2', RT: 'R2', Start: 'Opt', Sel: 'Créer', L3: 'L3' };
function padIsPS() { return /054c|dualsense|dualshock|playstation|ps5|ps4/i.test(PAD.id || ''); }
function actLabel(a) { if (!PAD.active) return keyName(SET.keys[a] && SET.keys[a][0]); const l = PAD_LABEL[a] || '—'; return padIsPS() ? (PS_LABEL[l] || l) : l; }

// ===================== tactile =====================
const TOUCH = { stick: { on: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }, edit: false };
const TOUCH_BTNS = [
  // id, action, décalages droite/bas (px), taille — disposition en arc autour de l'attaque
  { id: 'attack', act: 'attack', r: 28, b: 28, s: 92 },
  { id: 'dodge', act: 'dodge', r: 168, b: 42, s: 64 },
  { id: 'skill1', act: 'skill1', r: 154, b: 108, s: 58 },
  { id: 'skill2', act: 'skill2', r: 108, b: 154, s: 58 },
  { id: 'block', act: 'block', r: 42, b: 168, s: 64 },
  { id: 'skill3', act: 'skill3', r: 228, b: 94, s: 58 },
  { id: 'skill4', act: 'skill4', r: 179, b: 179, s: 58 },
  { id: 'ult', act: 'ult', r: 92, b: 226, s: 62 },
  { id: 'potion', act: 'potion', r: 300, b: 18, s: 50 },
  { id: 'interact', act: 'interact', r: 330, b: 150, s: 58 },
  { id: 'tech', act: 'tech', r: 238, b: 160, s: 58 },
  { id: 'awaken', act: 'awaken', r: 30, b: 240, s: 52 },
  { id: 'relic', act: 'relic', r: 360, b: 18, s: 50 },
  { id: 'racial', act: 'racial', r: 420, b: 18, s: 50 },
  { id: 'mount', act: 'mount', r: 480, b: 18, s: 50 },
];

// ===================== son =====================
let AC = null, MASTER = null, SFXG = null, MUSG = null, NOISE = null;
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume().catch(() => {}); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    MASTER = AC.createGain(); MASTER.gain.value = 0.36; MASTER.connect(AC.destination);
    SFXG = AC.createGain(); SFXG.gain.value = SET.sound ? 1 : 0; SFXG.connect(MASTER);
    MUSG = AC.createGain(); MUSG.gain.value = SET.music ? 0.55 : 0; MUSG.connect(MASTER);
    NOISE = AC.createBuffer(1, AC.sampleRate * 1.5, AC.sampleRate);
    const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { AC = null; }
}
function applyVolumes() { if (SFXG) SFXG.gain.value = SET.sound ? 1 : 0; if (MUSG) MUSG.gain.value = SET.music ? 0.55 : 0; }
function tone(f0, f1, dur, type, vol, delay, dest) {
  if (!AC) return; const t = AC.currentTime + (delay || 0);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.01, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(dest || SFXG); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, fc, delay, type, dest) {
  if (!AC) return; const t = AC.currentTime + (delay || 0);
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = NOISE; f.type = type || 'lowpass'; f.frequency.value = fc || 1500;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f); f.connect(g); g.connect(dest || SFXG); s.start(t, Math.random()); s.stop(t + dur + 0.02);
}
const SFX = {
  swing() { noise(.09, .18, 3500, 0, 'highpass'); tone(500, 260, .06, 'triangle', .03); },
  heavy() { noise(.16, .3, 2200, 0, 'bandpass'); tone(180, 60, .18, 'sawtooth', .07); },
  hit() { noise(.07, .45, 2200); tone(240, 90, .07, 'square', .07); },
  crit() { noise(.1, .6, 3200); tone(620, 140, .12, 'square', .1); },
  hurt() { tone(320, 90, .18, 'sawtooth', .12); noise(.1, .25, 900); },
  dodge() { noise(.14, .18, 5200, 0, 'highpass'); },
  block() { tone(1100, 800, .07, 'square', .07); noise(.05, .2, 4000, 0, 'highpass'); },
  parry() { tone(1600, 1300, .2, 'triangle', .12); tone(2400, 2000, .25, 'sine', .08, .03); noise(.06, .3, 6000, 0, 'highpass'); },
  kill() { tone(200, 60, .2, 'triangle', .12); noise(.18, .22, 1200); },
  pick() { tone(660, 990, .08, 'square', .06); },
  gold() { tone(1250, 1560, .05, 'square', .035); tone(1560, 1900, .06, 'square', .03, .05); },
  fire() { noise(.5, .45, 900); tone(160, 70, .4, 'sawtooth', .07); },
  ice() { tone(2200, 900, .25, 'sine', .08); noise(.3, .25, 6000, 0, 'highpass'); },
  zap() { noise(.15, .45, 6500, 0, 'highpass'); tone(1600, 180, .12, 'square', .07); tone(900, 120, .1, 'sawtooth', .05, .06); },
  wind() { noise(.9, .3, 1200, 0, 'bandpass'); },
  boom() { noise(.6, .85, 420); tone(90, 28, .5, 'sawtooth', .18); },
  shield() { tone(520, 1040, .3, 'sine', .1); tone(780, 1560, .3, 'sine', .06, .05); },
  arrow() { noise(.08, .2, 3000, 0, 'highpass'); tone(900, 500, .05, 'triangle', .03); },
  cast() { tone(400, 900, .25, 'triangle', .07); },
  level() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .22, 'triangle', .1, i * .09)); },
  ui() { tone(700, 900, .045, 'square', .04); },
  open() { [392, 523, 659, 784].forEach((f, i) => tone(f, f, .25, 'triangle', .08, i * .07)); },
  roar() { tone(110, 45, 1, 'sawtooth', .2); noise(1, .32, 380); },
  step() { noise(.03, .05, 700); },
  charge() { tone(200, 600, .35, 'sawtooth', .04); },
};
function sfx(n) { if (!AC || !SET.sound) return; try { SFX[n] && SFX[n](); } catch (e) {} }

// ===================== musique générative =====================
const MUSIC = { track: null, next: 0, step: 0, timer: null };
const TRACKS = {
  village: { bpm: 84, chords: [[220, 277, 330], [196, 247, 294], [175, 220, 262], [196, 247, 294]], mel: [659, 587, 523, 587, 659, 784, 659, 587], lead: 'triangle', drums: false },
  forest: { bpm: 76, chords: [[147, 175, 220], [131, 165, 196], [117, 147, 175], [131, 165, 196]], mel: [440, 0, 392, 349, 0, 330, 349, 0], lead: 'sine', drums: false },
  combat: { bpm: 132, chords: [[147, 175, 220], [117, 147, 175], [131, 165, 196], [110, 139, 165]], mel: [587, 523, 466, 523, 587, 698, 659, 587], lead: 'square', drums: true },
  title: { bpm: 64, chords: [[147, 220, 294], [117, 175, 233], [175, 220, 262], [131, 196, 262]], mel: [587, 0, 659, 698, 0, 659, 587, 523], lead: 'sine', drums: false },
  boss: { bpm: 150, chords: [[110, 131, 165], [104, 123, 156], [98, 117, 147], [104, 123, 156]], mel: [440, 415, 440, 523, 494, 440, 392, 415], lead: 'sawtooth', drums: true },
};
function playMusic(name) {
  if (MUSIC.track === name) return;
  MUSIC.track = name; MUSIC.step = 0;
  if (!MUSIC.timer) MUSIC.timer = setInterval(musicTick, 50);
}
function musicTick() {
  if (!AC || !MUSIC.track || !SET.music) return;
  const tr = TRACKS[MUSIC.track]; const spb = 60 / tr.bpm / 2; // croches
  if (MUSIC.next < AC.currentTime) MUSIC.next = AC.currentTime + 0.05;
  while (MUSIC.next < AC.currentTime + 0.25) {
    const s = MUSIC.step, t = MUSIC.next - AC.currentTime;
    const ch = tr.chords[Math.floor(s / 16) % tr.chords.length];
    if (s % 16 === 0) ch.forEach(f => tone(f, f, spb * 15, 'sine', .035, t, MUSG));
    if (s % 2 === 0) tone(ch[(s / 2) % 3] * 2, ch[(s / 2) % 3] * 2, spb * 1.6, 'triangle', .02, t, MUSG);
    const m = tr.mel[s % tr.mel.length];
    if (m && s % 2 === 0 && (s % 32) > 15) tone(m, m, spb * 1.8, tr.lead, tr.lead === 'sawtooth' || tr.lead === 'square' ? .012 : .03, t, MUSG);
    if (tr.drums) { if (s % 4 === 0) { noise(.12, .18, 160, t, 'lowpass', MUSG); } if (s % 4 === 2) noise(.06, .07, 5000, t, 'highpass', MUSG); }
    MUSIC.step++; MUSIC.next += spb;
  }
}

// minuterie en temps de jeu (suspendue en pause, ralentie avec le ralenti)
function later(fn, ms) { (G.later || (G.later = [])).push({ t: (ms || 0) / 1000, fn }); }

function hexToRgbStr(h) { h = h.replace('#', ''); return parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16); }
