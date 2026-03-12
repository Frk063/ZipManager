// =========================================================
// SERVICE WORKER - ZIPMANAGER V2.1.0 (AIR-GAP)
// =========================================================

const CACHE_NAME = 'zipmanager-v2.1.0';

// Liste stricte des fichiers requis pour le mode hors-ligne
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon.svg'
];

// Phase 1 : Installation et Mise en cache initiale
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Mise en cache des ressources V2.1.0');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting()) // Force l'activation immédiate
    );
});

// Phase 2 : Activation et Nettoyage des anciens caches (Garbage Collection)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log(`[Service Worker] Suppression de l'ancien cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Prend le contrôle des pages ouvertes
    );
});

// Phase 3 : Interception des requêtes (Stratégie "Cache First, fallback to Network")
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Si le fichier est dans le cache, on le sert immédiatement (Air-Gap)
            // Sinon, on va le chercher sur le réseau (GitHub)
            return cachedResponse || fetch(event.request);
        })
    );
});
