// ANNAIM service worker: луғатни телефонга сақлайди, интернетсиз ҳам очилади.
// Версия make_web.py томонидан ҳар йиғишда алмаштирилади.
const VERSION = '20261125-d67';
const CACHE = 'annaim-' + VERSION;
// Луғат маълумоти (23 МБ) алоҳида кэшда: фақат маълумот ўзгарганда (DATAV) қайта юкланади,
// шунда илова янгиланиши енгил ва тез бўлади.
const DATAV = 'd97dda2d701bc';
const DCACHE = 'annaim-data-' + DATAV;
const DATA = ['./data1.js', './data2.js', './extra.js'];
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png', './icons/logo-kanz-sm.png', './icons/kanz-cover.jpg', './icons/kanz-mark-ink.png', './icons/kanz-mark-gold.png'];

// Серверда янгиланган-янгиланмаганини текшириб олади (браузернинг 10 дақиқалик кэшидаги эски файл янги версия кэшига тушмасин).
const fresh = (u) => new Request(u, { cache: 'no-cache' });

// skipWaiting ЙЎҚ: янги версия орқада ўрнатилиб кутади, ҳамма очиқ саҳифа ёпилгач, кейинги очишда ишга тушади.
// Шунинг учун очиқ саҳифа иш ўртасида алмашмайди, эски кэш ҳам саҳифа очиқ турганда ўчмайди.
self.addEventListener('install', (e) => {
  e.waitUntil(Promise.all([
    caches.open(CACHE).then((c) => c.addAll(CORE.map(fresh))),
    caches.open(DCACHE).then((c) => c.match('./data1.js').then((hit) => hit ? null : c.addAll(DATA.map(fresh))))
  ]));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('annaim-') && k !== CACHE && k !== DCACHE && k !== 'annaim-books').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
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
  // Саҳифа ҳам, луғат ҳам фақат ШУ версиянинг кэшидан: янги index.html эски маълумот билан аралашмайди.
  // Китоб бетлари (books/): биринчи очилганда юкланади ва телефонда сақланиб қолади.
  if (url.pathname.includes('/books/')) {
    e.respondWith(caches.open('annaim-books').then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  const scope = new URL(self.registration.scope).pathname;
  const home = req.mode === 'navigate' && (url.pathname === scope || url.pathname === scope + 'index.html');
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = home ? await c.match('./index.html') : (await c.match(req, { ignoreSearch: true })) || (await caches.open(DCACHE).then((d) => d.match(req, { ignoreSearch: true })));
    return hit || fetch(req);
  })());
});
