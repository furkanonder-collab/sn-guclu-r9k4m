// Şok Nokta - çevrimdışı önbellek (service worker)
var CACHE = 'sok-nokta-v33';
var ASSETS = ['./', './index.html'];

self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); })
            .then(function() { return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(keys.map(function(k) {
                if (k !== CACHE) return caches.delete(k);
            }));
        }).then(function() { return self.clients.claim(); })
    );
});

// Önce internet dene, güncel sürümü önbelleğe al; internet yoksa önbellekten ver
self.addEventListener('fetch', function(e) {
    if (e.request.method !== 'GET') return;
    // Sadece kendi origin'imizdeki dosyaları yönet; Firebase / gstatic / googleapis gibi
    // DIŞ isteklere DOKUNMA (yoksa canlı bulut senkron bağlantısı bozulur).
    var _u = new URL(e.request.url);
    if (_u.origin !== self.location.origin) return;
    e.respondWith(
        fetch(e.request).then(function(resp) {
            var copy = resp.clone();
            caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
            return resp;
        }).catch(function() {
            return caches.match(e.request).then(function(r) {
                return r || caches.match('./index.html');
            });
        })
    );
});
