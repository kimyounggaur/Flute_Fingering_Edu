"use strict";

const CACHE_VERSION = "flute-edu-v2.1.0";
const THREE_DIR = "/vendor/three-0.170.0";
const APP_SHELL = [
  "/",
  "/index.html",
  "/3d.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  `${THREE_DIR}/three.module.min.js`,
  `${THREE_DIR}/addons/OrbitControls.js`,
  `${THREE_DIR}/addons/RoomEnvironment.js`,
  `${THREE_DIR}/addons/RoundedBoxGeometry.js`
];
/* 페이지마다 자기 캐시 키에 저장한다. (모든 내비게이션을 /index.html 하나에 덮어쓰면
   3D 화면을 연 뒤 오프라인에서 2D 앱 대신 3D 화면이 뜨는 문제가 생긴다) */
const PAGE_KEYS = { "/": "/index.html", "/index.html": "/index.html", "/3d.html": "/3d.html" };

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
    const pageKey = PAGE_KEYS[url.pathname];
    event.respondWith(
      fetch(request)
        .then(async response => {
          if (response.ok && pageKey){
            const cache = await caches.open(CACHE_VERSION);
            await cache.put(pageKey, response.clone());
          }
          return response;
        })
        .catch(async () => (pageKey && await caches.match(pageKey)) || caches.match("/index.html"))
    );
    return;
  }

  /* 아이콘·매니페스트·라이브러리(폴더 이름에 버전 포함)는 캐시 우선 */
  if (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/vendor/") || url.pathname.endsWith(".webmanifest")){
    event.respondWith(caches.match(request, {ignoreSearch:true}).then(cached => cached || fetch(request)));
  }
});
