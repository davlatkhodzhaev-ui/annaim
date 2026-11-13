// ANNAIM service worker: луғатни телефонга сақлайди, интернетсиз ҳам очилади.
// Версия make_web.py томонидан ҳар йиғишда алмаштирилади.
const VERSION = '20261113-wr';
const CACHE = 'annaim-' + VERSION;
const CORE = ['./', './index.html', './data1.js', './data2.js', './extra.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png', './icons/logo-kanz-sm.png', './icons/kanz-cover.jpg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('annaim-') && k !== CACHE && k !== 'annaim-books').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Шрифтлар (Google Fonts): бир марта юкланади, кейин кэшдан.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // test/ папкаси: тест нусхаси, кэшланмайди
  if (url.pathname.includes('/test/')) return;
  // видеолар кэшланмайди (катта, Range сўровлари)
  if (url.pathname.includes('/videos/')) return;
  // Саҳифа ва файллар: аввал кэшдан (тез, интернетсиз), кэшда бўлмаса тармоқдан.
  // Янги версия sw.js ўзгарганда ўрнатилади ва кейинги очишда кўринади.
  const key = req.mode === 'navigate' ? './index.html' : req;
  // Китоб бетлари (books/): биринчи очилганда юкланади ва телефонда сақланиб қолади.
  if (url.pathname.includes('/books/')) {
    e.respondWith(caches.open('annaim-books').then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  e.respondWith(caches.match(key, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
