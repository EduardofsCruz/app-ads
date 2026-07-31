/* Service Worker do ZooGuia — deixa o app instalável e funcionando offline.
 * Estratégia: app shell em cache na instalação; tiles do mapa e CDN em cache dinâmico. */

const CACHE_SHELL = "zooguia-shell-v12";
const CACHE_DINAMICO = "zooguia-dinamico-v12";

const ARQUIVOS_SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./data/animais.json",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg",
  "./img/mapa-ilustrado.png",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(CACHE_SHELL).then((c) => c.addAll(ARQUIVOS_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(
        chaves
          .filter((k) => k !== CACHE_SHELL && k !== CACHE_DINAMICO)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  if (req.method !== "GET") return;
  const mesmaOrigem = req.url.startsWith(self.location.origin);
  const pesado = req.url.includes("tile.openstreetmap.org") || req.url.includes("unpkg.com") ||
                 (mesmaOrigem && (req.url.includes("/img/") || req.url.includes("/sons/")));

  if (pesado) {
    // cache primeiro: ilustrações, vídeos, sons e tiles não mudam de conteúdo
    ev.respondWith(
      caches.match(req).then((c) => c || fetch(req).then((resp) => {
        if (resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE_DINAMICO).then((cc) => cc.put(req, copia));
        }
        return resp;
      }))
    );
    return;
  }

  // rede primeiro: o app em si — atualizações aparecem já na primeira
  // recarga; o cache só entra quando estiver sem internet
  ev.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp.ok && mesmaOrigem) {
          const copia = resp.clone();
          caches.open(CACHE_SHELL).then((c) => c.put(req, copia));
        }
        return resp;
      })
      .catch(() => caches.match(req).then((c) => {
        if (c) return c;
        if (req.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      }))
  );
});
