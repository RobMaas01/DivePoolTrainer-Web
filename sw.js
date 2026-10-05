const CACHE_NAME = 'dive-pool-v11';
const CORE = ['./', './index.html', './style.css?v=7', './i18n.js?v=6', './app.js?v=6', './icon.svg', './manifest.webmanifest?v=3', './data/pool.json'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE);
    const response = await cache.match('./data/pool.json');
    const data = await response.json();
    await cache.addAll([...new Set(data.figures.map(item => `./${item.image}`))]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      throw new Error('Pagina is niet offline beschikbaar');
    }
  })());
});
