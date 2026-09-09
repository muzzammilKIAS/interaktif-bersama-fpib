let installPrompt;
let offlineReady=false;
function updateConnectionStatus(){
 const status=document.getElementById('connection-status');
 if(status)status.textContent=navigator.onLine?(offlineReady?'Offline tersedia':'Sedia untuk offline'):'Mod offline';
}
window.addEventListener('online',updateConnectionStatus);
window.addEventListener('offline',updateConnectionStatus);
updateConnectionStatus();
const installButton=document.getElementById('install');
const installHelp=document.getElementById('install-help');
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone;
if(standalone())installButton.hidden=true;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;installButton.hidden=false;});
window.addEventListener('appinstalled',()=>{installPrompt=null;installButton.hidden=true;installHelp.hidden=true;});
installButton.addEventListener('click',async()=>{
 if(installPrompt){const prompt=installPrompt;installPrompt=null;await prompt.prompt();await prompt.userChoice;return;}
 installHelp.hidden=!installHelp.hidden;installButton.setAttribute('aria-expanded',String(!installHelp.hidden));
});
if('serviceWorker' in navigator&&location.protocol!=='file:'){
 let reloaded=false;
 const hadController=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloaded||!hadController||(typeof phase!=='undefined'&&phase==='playing'))return;reloaded=true;location.reload();});
 navigator.serviceWorker.register('./sw.js').then(reg=>{reg.update();return navigator.serviceWorker.ready}).then(()=>{
 offlineReady=true;updateConnectionStatus();
 document.getElementById('offline-status').textContent='Permainan offline sudah tersedia pada peranti ini. Skor disimpan pada peranti ini sahaja.';
 }).catch(()=>{document.getElementById('offline-status').textContent='Offline belum tersedia. Gunakan internet dan buka semula app untuk cuba lagi.';});
}
