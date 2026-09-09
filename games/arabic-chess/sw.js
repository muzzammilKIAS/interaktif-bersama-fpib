const CACHE='arabic-chess-v10';
const ASSETS=['./','./index.html','./style.css','./app.js','./pieces.js','./chess-engine.js','./chess-ai.js','./install.js','./questions.js','./arabic.ttf','./lotus-linotype-light.ttf','./manifest.webmanifest','./icon-192.png','./icon-512.png','./favicon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('arabic-chess-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);
 if(e.request.method!=='GET'||url.origin!==self.location.origin)return;
 e.respondWith(caches.open(CACHE).then(async c=>{
  const cached=await c.match(e.request,{ignoreSearch:true});
  if(cached)return cached;
  try{return await fetch(e.request)}catch(error){
   if(e.request.mode==='navigate')return await c.match('./index.html');
   throw error;
  }
 }));
});
