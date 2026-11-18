// ANNAIM service worker: луғатни телефонга сақлайди, интернетсиз ҳам очилади.
// Версия make_web.py томонидан ҳар йиғишда алмаштирилади.
const VERSION = '20261119-d34';
const CACHE = 'annaim-' + VERSION;
// Луғат маълумоти (23 МБ) алоҳида кэшда: фақат маълумот ўзгарганда (DATAV) қайта юкланади,
// шунда илова янгиланиши енгил ва тез бўлади.
const DATAV = '20261119f';
const DCACHE = 'annaim-data-' + DATAV;
const DATA = ['./data1.js', './data2.js', './extra.js'];
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png', './icons/logo-kanz-sm.png', './icons/kanz-cover.jpg', './icons/kanz-mark-ink.png', './icons/kanz-mark-gold.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(Promise.all([
    caches.open(CACHE).then((c) => c.addAll(CORE)),
    caches.open(DCACHE).then((c) => c.match('./data1.js').then((hit) => hit ? null : c.addAll(DATA)))
  ]).then(() => self.skipWaiting()));
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
  // Янги версия sw.js ўзгарганда ўрнатилади ва кейинги очишда кўринади.
  // Саҳифанинг ўзи (index.html): интернет бўлса аввал тармоқдан (янги версия дарров кўринади),
  // интернет бўлмаса ёки 4 сонияда жавоб келмаса кэшдан.
  if (req.mode === 'navigate') {
    const net = fetch('./index.html', { cache: 'no-store' }).then((res) => { if (!res.ok) throw new Error('bad');
      const cp = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); return res; });
    const slow = new Promise((ok) => setTimeout(ok, 4000)).then(() => caches.match('./index.html'));
    e.respondWith(Promise.race([net, slow.then((hit) => hit || net)]).catch(() => caches.match('./index.html')));
    return;
  }
  const key = req;
  // Китоб бетлари (books/): биринчи очилганда юкланади ва телефонда сақланиб қолади.
  if (url.pathname.includes('/books/')) {
    e.respondWith(caches.open('annaim-books').then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  e.respondWith(caches.match(key, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
