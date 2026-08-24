// Güçlü Bijuteri - çevrimdışı önbellek (service worker)
// Önbellek adı BU YAYINA özel. Aynı origin'de (furkanonder-collab.github.io) birden çok
// repo olduğu için düz 'sok-nokta-vNN' adı ortaktı → repolar birbirinin önbelleğini siliyordu.
var SCOPE = self.location.pathname.replace(/\/[^\/]*$/, '');       // ör. /sn-guclu-r9k4m
var PREFIX = 'sok-nokta' + SCOPE.replace(/\//g, '-') + '-';
var CACHE = PREFIX + 'v39';
var ESKI_DESEN = /^sok-nokta-v\d+$/;                                // v33 ve öncesinin ortak adları
var ASSETS = ['./', './index.html'];

// TEK bir dosya inemezse kurulum KOMPLE düşmesin (yoksa yeni sürüm sessizce hiç kurulmaz)
self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE).then(function(c) {
            return Promise.all(ASSETS.map(function(a) { return c.add(a).catch(function() {}); }));
        }).then(function() { return self.skipWaiting(); }).catch(function() { return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(keys.map(function(k) {
                if (k === CACHE) return null;
                // SADECE kendi yayınımızın eski sürümlerini + eski ortak adları temizle;
                // başka repoların önbelleğine DOKUNMA
                if (k.indexOf(PREFIX) === 0 || ESKI_DESEN.test(k)) return caches.delete(k);
                return null;
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
            // SADECE başarılı yanıtı önbelleğe al — 404/500 önbelleğe girerse uygulama kalıcı bozulur
            if (resp && resp.ok) {
                var copy = resp.clone();
                caches.open(CACHE).then(function(c) { c.put(e.request, copy).catch(function() {}); }).catch(function() {});
            }
            return resp;
        }).catch(function() {
            return caches.match(e.request).then(function(r) {
                return r || caches.match('./index.html');
            });
        })
    );
});
