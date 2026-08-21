// Service worker mínimo: cachea la app para que funcione offline y arranque rápido.
// Sube este número cuando cambie esta lógica, para forzar la limpieza de cachés
// antiguas que puedan tener imágenes ya renombradas/borradas en el repo.
const CACHE = "futabita-v2";

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
  // El HTML y el bundle de JS/CSS (con hash distinto en cada deploy) van SIEMPRE
  // directos a red, sin pasar por el service worker: si un fallback a caché devuelve
  // undefined para un archivo con hash nuevo que aún no se había cacheado, el
  // <script type="module"> rompe la carga entera y deja la pantalla en blanco.
  // Mejor que ese fallo se vea como el error de red normal del navegador.
  const url = new URL(request.url);
  if (request.mode === "navigate" || url.pathname.startsWith("/assets/")) return;
  // Estrategia (solo para imágenes/audio/manifest): red primero, cae a caché si no hay conexión
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
