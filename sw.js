const CACHE='fpib-interaktif-v16';
const ASSETS=[
  './','index.html','style.css','app.js','manifest.webmanifest',
  'assets/logo-kias.png','assets/logo-fpib.png','assets/icon-192.png','assets/icon-512.png','assets/Baloo2-Variable.woff2','assets/lotus-linotype-light.ttf','assets/gamepad-nav.js',
  'games/arabic-chess/index.html','games/arabic-chess/style.css','games/arabic-chess/app.js','games/arabic-chess/pieces.js','games/arabic-chess/chess-engine.js','games/arabic-chess/chess-ai.js','games/arabic-chess/questions.js','games/arabic-chess/install.js','games/arabic-chess/favicon.svg','games/arabic-chess/icon-192.png','games/arabic-chess/icon-512.png','games/arabic-chess/manifest.webmanifest','games/arabic-chess/arabic.ttf','games/arabic-chess/lotus-linotype-light.ttf',
  'games/misi-mencari-hikmah/index.html',
  'games/sirah-journey/index.html','games/sirah-journey/styles.css','games/sirah-journey/app.js','games/sirah-journey/questions.js','games/sirah-journey/manifest.webmanifest','games/sirah-journey/fonts/Baloo2-Variable.woff2','games/sirah-journey/fonts/NotoNaskhArabic-Variable.woff2','games/sirah-journey/icons/icon-192.png','games/sirah-journey/icons/icon-512.png','games/sirah-journey/icons/icon-maskable-512.png'
];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('fpib-interaktif-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
  event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||fetch(event.request).then(response=>{
    const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;
  }).catch(()=>event.request.mode==='navigate'?caches.match('index.html'):Response.error())));
});
