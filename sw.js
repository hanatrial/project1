// Service worker: kerangka aplikasi tersimpan agar cepat dibuka dan tetap terbuka saat offline.
// Halaman: jaringan dulu (selalu versi terbaru), cadangan dari cache. Data Firestore disimpan oleh halaman sendiri.
const V = "so-doi-v7";
const SHELL = ["./", "./index.html", "./import.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;               // Firestore dan CDN diurus browser
  const html = req.mode === "navigate" || url.pathname.endsWith(".html");
  if (html) {
    e.respondWith(fetch(req).then(r => {
      const copy = r.clone(); caches.open(V).then(c => c.put(req, copy)).catch(() => {}); return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(m => m || caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => {
    const copy = r.clone(); caches.open(V).then(c => c.put(req, copy)).catch(() => {}); return r;
  })));
});
