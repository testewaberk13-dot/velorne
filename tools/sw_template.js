// Service worker de Vélorne : le jeu fonctionne hors ligne et se met à jour seul quand il y a du réseau.
const VERSION = 'velorne-__VERSION__';
const FILES = __FILES__;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('velorne-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const code = req.mode === 'navigate' || /\.(html|js|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (code) {
    // réseau d'abord (dernière version), cache si hors ligne
    e.respondWith(Promise.race([fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; }), new Promise((_, rej) => setTimeout(rej, 3500))])
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match(new URL(req.url).pathname.endsWith('jeu-2d.html') ? 'jeu-2d.html' : 'index.html'))));
  } else {
    // images : cache d'abord
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req).then(res => { if (res.ok) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return res; })));
  }
});
