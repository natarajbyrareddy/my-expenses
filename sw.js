/* My Expenses service worker: network-first for app code, cache fallback offline. */
const CACHE = 'my-expenses-v29';
const SHELL = ['./', './index.html', './manifest.json', './icon.png', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(SHELL); } catch (error) { /* Keep installation possible if an optional icon is absent. */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('my-expenses-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  const isAppCode = ['script', 'style', 'document'].includes(request.destination) || request.mode === 'navigate';
  if (isAppCode) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        // Bypass the browser HTTP cache so a deployed JS update is fetched promptly.
        const response = await fetch(new Request(request, { cache: 'no-store' }));
        if (response && response.ok) {
          const key = request.mode === 'navigate' ? './index.html' : request;
          await cache.put(key, response.clone());
        }
        return response;
      } catch (error) {
        return (await caches.match(request)) || (request.mode === 'navigate' ? await caches.match('./index.html') : null) || Response.error();
      }
    })());
    return;
  }

  // Images and other static assets remain cache-first for quick offline loading.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok) (await caches.open(CACHE)).put(request, response.clone());
      return response;
    } catch (error) {
      return Response.error();
    }
  })());
});
