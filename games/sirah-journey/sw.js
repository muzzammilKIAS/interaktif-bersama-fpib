'use strict';
// Bump VERSION after changing any file below, then reload with the server running.
const VERSION='1.6.1';
const PREFIX='sirah-journey-';
const CACHE=PREFIX+VERSION;
const ASSETS=['./','./index.html','./styles.css','./app.js','./questions.js','./manifest.webmanifest','./fonts/Baloo2-Variable.woff2','./fonts/NotoNaskhArabic-Variable.woff2','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];
// skipWaiting: a new version activates as soon as it finishes precaching, instead of
// waiting for every open tab/window of the old version to close first. That old
// wait-for-close behaviour proved unreliable during development (Chrome session
// restore, multiple windows, an installed PWA icon left running, etc. can all keep
// an "old" client alive without it looking open) — one plain reload after a deploy
// is now enough. Avoid deploying mid-game at an actual live booth session, since a
// reload the instant a new version activates would interrupt anyone mid-checkpoint.
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(event.request,{ignoreSearch:true});if(cached)return cached;
    try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate')return await cache.match('./index.html');throw error;}
  }));
});
