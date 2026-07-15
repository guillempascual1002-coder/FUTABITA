// Service worker mínimo: cachea la app para que funcione offline y arranque rápido
const CACHE = "futabita-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  // No cachear llamadas a la API de estimación
  if (request.url.includes("/api/")) return;
  // Estrategia: red primero, cae a caché si no hay conexión
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (request.method === "GET" && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
