/* =========================
   SERVICE WORKER
   Suivi Production ARC+
========================= */

const CACHE_NAME = "suivi-production-arc-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./admin.html",
  "./agent.html",

  "./css/style.css",
  "./css/admin.css",
  "./css/agent.css",

  "./js/app.js",
  "./js/api.js",
  "./js/admin.js",
  "./js/agent.js",
  "./js/excel-import.js",

  "./data/agents.json",
  "./data/production.json",
  "./data/programmes.json",
   "./data/categories.json",
"./js/production-entry.js",
"./js/charts.js",
"./css/additions.css"

  "./manifest.json",

  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

/**
 * Installation du service worker.
 */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

/**
 * Activation du service worker.
 * Supprime les anciens caches.
 */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }

          return null;
        })
      );
    })
  );

  self.clients.claim();
});

/**
 * Interception des requêtes.
 * Stratégie simple :
 * 1. Cherche dans le cache
 * 2. Sinon va sur le réseau
 */
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
