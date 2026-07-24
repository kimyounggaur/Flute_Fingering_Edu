"use strict";

const CACHE_VERSION = "flute-edu-v2.0.1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("flute-edu-") && key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || request.method !== "GET") return;

  if (request.mode === "navigate"){
    event.respondWith(
      fetch(request)
        .then(async response => {
          if (response.ok){
            const cache = await caches.open(CACHE_VERSION);
            await cache.put("/index.html", response.clone());
          }
          return response;
        })
        .catch(() => caches.match(request).then(response => response || caches.match("/index.html")))
    );
    return;
  }

  if (url.pathname.includes("/icons/") || url.pathname.endsWith(".webmanifest")){
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
