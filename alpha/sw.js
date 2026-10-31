// Offline play and fast repeat visits.
// - The page itself (navigation, index.html, manifest) is network first, so updates arrive when online,
//   with the cached copy as the offline fallback.
// - Build files under assets/ have a content hash in their name and never change: cache first.
// - Art is served from its own cache at once and refreshed in the background (stale while revalidate).
// - version.json is never cached: the game reads it to spot a newer build (src/update.ts).
// - Page and shell requests skip the browser's HTTP cache (GitHub Pages lets it keep files for 10 minutes),
//   so a fresh publish is seen at once instead of the copy from the last visit.
// update.ts registers sw.js?v=<build id>, so every build installs afresh, precaches its chunks and prunes
// the previous build's. The previous working version stays cached until a new one has fully loaded, so an
// update can never leave the player without a game that opens (TECH_STACK_AND_OFFLINE.md).
const CACHE = 'syndicate-tycoon-v5';
const ART = 'syndicate-tycoon-art';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'logo-stacked.webp', 'icon-192.png', 'icon-512.png', 'favicon-32.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const manifest = await fetch('./offline-assets.json', { cache: 'no-store' });
    if (!manifest.ok) throw new Error('Offline asset manifest unavailable.');
    const assets = await manifest.json();
    const cache = await caches.open(CACHE);
    // Includes every lazily loaded section and the simulation worker, even before they are first opened.
    await cache.addAll([...SHELL, ...assets].map((u) => new Request(u, { cache: 'reload' })));
    await cache.put('./offline-assets.json', new Response(JSON.stringify(assets)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('syndicate-tycoon-') && k !== CACHE && k !== ART).map((k) => caches.delete(k)));
    // Drop hashed build files that the current build no longer references.
    const cache = await caches.open(CACHE);
    const listed = await cache.match('./offline-assets.json');
    if (listed) {
      const keep = new Set((await listed.json()).map((name) => new URL(name, self.registration.scope).href));
      for (const req of await cache.keys()) if (req.url.includes('/assets/') && !keep.has(req.url)) await cache.delete(req);
    }
    await self.clients.claim();
  })());
});

// Art is re-checked at most once per worker lifetime, not on every view.
const refreshed = new Set();
const put = (name, request, response) => { if (response.ok) { const copy = response.clone(); caches.open(name).then((c) => c.put(request, copy)); } return response; };

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // The game server's answers are live state: never serve them from a cache.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/') || url.pathname.endsWith('/version.json')) return;
  if (url.pathname.includes('/assets/')) {
    event.respondWith(caches.match(request, { ignoreVary: true }).then((hit) => hit ?? fetch(request).then((r) => put(CACHE, request, r))));
    return;
  }
  if (url.pathname.includes('/art/')) {
    event.respondWith(caches.open(ART).then(async (cache) => {
      const hit = await cache.match(request, { ignoreVary: true });
      if (hit && refreshed.has(request.url)) return hit;
      refreshed.add(request.url);
      const fresh = fetch(request).then((r) => put(ART, request, r));
      if (hit) { event.waitUntil(fresh.catch(() => undefined)); return hit; }
      return fresh.catch(() => new Response('', { status: 504 }));
    }));
    return;
  }
  event.respondWith(
    fetch(request, { cache: 'no-cache' })
      .then((response) => put(CACHE, request, response))
      .catch(() => caches.match(request, { ignoreVary: true }).then((hit) => hit ?? (request.mode === 'navigate' ? caches.match('./') : undefined)))
      .then((r) => r ?? new Response('', { status: 504 })),
  );
});
