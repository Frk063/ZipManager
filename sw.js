const CACHE_NAME = 'zipmanager-v2.0.23';
const ASSETS = [
'./',
'./index.html',
'./manifest.json',
'./icon.svg'
];

// Installation : Mise en cache initiale
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// Interception (Air-Gap) : Servir depuis le cache en priorité
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});

// Mise à jour : Nettoyage des anciens caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
});