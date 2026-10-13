const CACHE_NAME = 'bowling-b1v31';
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/bowling.svg',
  './images/bowling-home.png',
  './sqlite-worker.js?v=b1v31'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('bowling-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Always check the network first for page navigations so the normal GitHub
  // Pages link gets the newest app. Fall back to the cached page offline.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const freshRequest = new Request(request, { cache: 'no-store' });
        const response = await fetch(freshRequest);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./index.html', response.clone());
        }
        return response;
      } catch (_) {
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }

  // Don't cache the service worker script itself; registration updates it
  // independently. Use network-first for HTML and versioned worker scripts.
  if (url.pathname.endsWith('/service-worker.js') ||
      url.pathname.endsWith('/index.html') ||
      url.pathname.endsWith('/sqlite-worker.js')) {
    event.respondWith((async () => {
      try {
        const response = await fetch(new Request(request, { cache: 'no-store' }));
        if (response && response.ok && !url.pathname.endsWith('/service-worker.js')) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (_) {
        return await caches.match(request) || await caches.match('./index.html');
      }
    })());
    return;
  }

  // Cache-first for stable static assets, with a network fallback.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
