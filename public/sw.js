/*
 * Service worker de Névé : "réseau d'abord, cache en secours".
 * En ligne, tout vient du réseau (données toujours fraîches) ; hors ligne,
 * l'app et les dernières données consultées restent disponibles.
 */
const CACHE = 'neve-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const CACHEABLE_HOSTS = [self.location.host, 'api.open-meteo.com'];

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!CACHEABLE_HOSTS.includes(url.host)) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(req, { ignoreSearch: url.host === self.location.host });
        if (cached) return cached;
        // Navigation hors ligne vers une autre page : renvoyer l'app
        if (req.mode === 'navigate') {
          const shell = await caches.match('/WinterArc/');
          if (shell) return shell;
        }
        return Response.error();
      }),
  );
});
