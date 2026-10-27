// Network first so updates arrive when online; cached copy when offline.
// The previous working version stays cached until a new one has fully loaded, so an update can
// never leave the player without a game that opens (TECH_STACK_AND_OFFLINE.md).
const CACHE = 'syndicate-tycoon-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'logo-stacked.webp', 'icon-192.png', 'icon-512.png', 'favicon-32.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => undefined).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('syndicate-tycoon-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // The game server's answers are live state: never serve them from a cache.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit ?? (request.mode === 'navigate' ? caches.match('./') : undefined)))
      .then((r) => r ?? new Response('', { status: 504 })),
  );
});
