const GAMES={
  'arabic-chess':{title:'Arabic Chess',url:'games/arabic-chess/index.html'},
  'misi-mencari-hikmah':{title:'Misi Mencari Hikmah',url:'games/misi-mencari-hikmah/index.html'},
  'sirah-journey':{title:'Sirah Journey',url:'games/sirah-journey/index.html'}
};

const copyrightYear=document.getElementById('copyright-year');
if(copyrightYear)copyrightYear.textContent=new Date().getFullYear();

const stage=document.getElementById('game-stage');
const frame=document.getElementById('game-frame');
const loading=document.getElementById('stage-loading');
const gameTitle=document.getElementById('current-game');
const installButton=document.getElementById('install');
let currentId='';
let installPrompt=null;
let idleTimer=0;

function resetIdle(){
  clearTimeout(idleTimer);
  document.getElementById('attract').hidden=true;
  if(stage.hidden)idleTimer=setTimeout(()=>document.getElementById('attract').hidden=false,75000);
}

function attachFrameShortcuts(){
  try{
    frame.contentDocument.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();closeGame();}
    });
  }catch{}
}

function openGame(id,updateHistory=true){
  const game=GAMES[id];
  if(!game)return;
  currentId=id;
  clearTimeout(idleTimer);
  document.getElementById('attract').hidden=true;
  loading.classList.remove('done');
  gameTitle.textContent=game.title;
  stage.hidden=false;
  document.body.style.overflow='hidden';
  frame.src=game.url;
  if(updateHistory&&location.hash!==`#game=${id}`)history.pushState({game:id},'',`#game=${id}`);
  document.getElementById('back-home').focus({preventScroll:true});
}

function hideStage(){
  if(stage.hidden)return;
  stage.hidden=true;
  frame.src='about:blank';
  currentId='';
  document.body.style.overflow='';
  document.querySelector(`[data-launch]`)?.focus({preventScroll:true});
  resetIdle();
}

function closeGame(){
  if(location.hash.startsWith('#game='))history.replaceState(null,'',`${location.pathname}${location.search}#pilih-game`);
  hideStage();
}

document.addEventListener('click',event=>{
  const launch=event.target.closest('[data-launch]');
  if(launch){openGame(launch.dataset.launch);return;}
  if(event.target.closest('#back-home')){closeGame();return;}
  if(event.target.closest('#reload-game')&&currentId){loading.classList.remove('done');frame.src=GAMES[currentId].url;return;}
  if(event.target.closest('#open-game')&&currentId){window.open(GAMES[currentId].url,'_blank','noopener');return;}
  if(event.target.closest('#fullscreen-game')){
    if(!document.fullscreenElement)stage.requestFullscreen?.();else document.exitFullscreen?.();
    return;
  }
  if(event.target.closest('#wake')){document.getElementById('attract').hidden=true;document.getElementById('pilih-game').scrollIntoView({behavior:'smooth'});resetIdle();}
});

frame.addEventListener('load',()=>{
  if(frame.src==='about:blank')return;
  loading.classList.add('done');
  attachFrameShortcuts();
});

window.addEventListener('popstate',()=>{
  const id=new URLSearchParams(location.hash.slice(1)).get('game');
  if(id&&GAMES[id])openGame(id,false);else hideStage();
});

document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!stage.hidden){event.preventDefault();closeGame();}
});

['pointerdown','keydown','scroll','touchstart'].forEach(type=>window.addEventListener(type,resetIdle,{passive:true}));

window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();installPrompt=event;installButton.hidden=false;
});
installButton.addEventListener('click',async()=>{
  if(!installPrompt)return;
  const prompt=installPrompt;installPrompt=null;installButton.hidden=true;
  await prompt.prompt();await prompt.userChoice;
});
window.addEventListener('appinstalled',()=>{installPrompt=null;installButton.hidden=true;});

if('serviceWorker' in navigator&&location.protocol!=='file:'){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

const initialGame=new URLSearchParams(location.hash.slice(1)).get('game');
if(initialGame&&GAMES[initialGame])openGame(initialGame,false);
resetIdle();
