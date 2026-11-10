/* Service worker mínimo: guarda los archivos de la app para abrirla rápido (red primero, caché como respaldo). */
const CACHE = 'pyl-v1';
const FILES = ['./', 'index.html', 'manifest.json', 'icons/icon.svg',
  'css/base.css', 'css/themes.css', 'css/components.css', 'css/nav.css',
  'js/config.js', 'js/utils.js', 'js/defaults.js', 'js/db.js', 'js/photos.js', 'js/data.js', 'js/ui.js', 'js/auth.js',
  'js/views/gastos.js', 'js/views/comida.js', 'js/views/planes.js', 'js/views/inicio.js', 'js/views/ajustes.js', 'js/app.js'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
