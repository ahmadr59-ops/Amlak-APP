// «املاک» service worker — bump CACHE with every release (matches APP_VERSION).
const CACHE = 'amlak-v1-1';
const FILES = ['./','./index.html','./manifest.json','./icon-32.png','./icon-152.png','./icon-167.png','./icon-180.png',
  './icon-192.png','./icon-512.png','./icon-192-maskable.png','./icon-512-maskable.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(FILES.map(f => fetch(f, {cache:'reload'}).then(r => c.put(f, r)).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    // network-first, bypassing the HTTP cache, so updates arrive without a manual cache clear
    e.respondWith(fetch(req, {cache:'no-store'})
      .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req).then(c => c || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(c => c || fetch(req).then(r => {
    if (r.ok && new URL(req.url).origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  }).catch(() => caches.match('./'))));
});
