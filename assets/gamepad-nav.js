// Shared PS4 / standard-gamepad support for every page in this booth (hub + all 3 games).
// Drop-in: <script src="assets/gamepad-nav.js"></script> (adjust relative path per depth).
//
// Approach: rather than teach every game's bespoke input system about gamepads, this
// walks the same real <button> elements the game already renders (D-pad/stick moves
// focus between them, Cross clicks the focused one) — so it works on any page built
// from ordinary buttons without per-game wiring. The one thing it CANNOT reach is a
// native confirm()/alert() dialog (outside page JS entirely); those still need a
// keyboard or mouse. Continuous character movement (the village game) is handled
// separately inline in that game, since it isn't button-based.
(function(){
  'use strict';
  if(window.__gamepadNavInstalled)return;
  window.__gamepadNavInstalled=true;

  const DEADZONE=0.5;
  const REPEAT_DELAY=420, REPEAT_RATE=150;
  const dirState={up:0,down:0,left:0,right:0}; // 0=up, else timestamp of next allowed repeat
  let crossWasDown=false, circleWasDown=false;
  let toastEl=null, toastTimer=null;

  function isVisible(el){
    if(!el||!(el instanceof HTMLElement))return false;
    if(el.disabled)return false;
    if(el.offsetParent===null && getComputedStyle(el).position!=='fixed')return false;
    const cs=getComputedStyle(el);
    if(cs.visibility==='hidden'||cs.display==='none')return false;
    const r=el.getBoundingClientRect();
    return r.width>0&&r.height>0;
  }

  function focusables(){
    return [...document.querySelectorAll('button,[role="button"],a[href]')].filter(isVisible);
  }

  function center(el){
    const r=el.getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top+r.height/2};
  }

  function moveFocus(dir){
    const items=focusables();
    if(!items.length)return;
    const current=document.activeElement;
    if(!items.includes(current)){
      items[0].focus();
      return;
    }
    const from=center(current);
    let best=null,bestScore=Infinity;
    for(const el of items){
      if(el===current)continue;
      const to=center(el);
      const dx=to.x-from.x, dy=to.y-from.y;
      let primary,cross;
      if(dir==='up'){ if(dy>=-4)continue; primary=-dy; cross=Math.abs(dx); }
      else if(dir==='down'){ if(dy<=4)continue; primary=dy; cross=Math.abs(dx); }
      else if(dir==='left'){ if(dx>=-4)continue; primary=-dx; cross=Math.abs(dy); }
      else{ if(dx<=4)continue; primary=dx; cross=Math.abs(dy); }
      const score=primary+cross*2.2;
      if(score<bestScore){bestScore=score;best=el;}
    }
    if(best){
      best.focus();
      if(best.scrollIntoView)best.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
    }
  }

  function activateFocused(){
    // Only acts when a real button already holds focus (i.e. the player
    // D-pad-navigated to it). Deliberately no fallback-to-first-button here:
    // pages with their own continuous input (e.g. canvas movement) treat an
    // unfocused Cross-press as their own action, and grabbing focus here
    // would silently steal that press instead.
    const el=document.activeElement;
    if(el&&el!==document.body&&isVisible(el)&&typeof el.click==='function')el.click();
  }

  function showToast(msg){
    if(!toastEl){
      toastEl=document.createElement('div');
      toastEl.setAttribute('role','status');
      Object.assign(toastEl.style,{
        position:'fixed',left:'50%',bottom:'22px',transform:'translateX(-50%) translateY(20px)',
        background:'rgba(10,20,15,0.92)',color:'#f3e9c9',padding:'10px 18px',borderRadius:'999px',
        font:'600 13px system-ui,sans-serif',letterSpacing:'.3px',zIndex:'999999',
        boxShadow:'0 10px 30px rgba(0,0,0,0.4)',border:'1px solid rgba(229,173,34,0.5)',
        opacity:'0',transition:'opacity .25s ease, transform .25s ease',pointerEvents:'none'
      });
      document.body.appendChild(toastEl);
    }
    toastEl.textContent=msg;
    requestAnimationFrame(()=>{toastEl.style.opacity='1';toastEl.style.transform='translateX(-50%) translateY(0)';});
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{toastEl.style.opacity='0';toastEl.style.transform='translateX(-50%) translateY(20px)';},2200);
  }

  window.addEventListener('gamepadconnected',e=>{
    showToast('🎮 Kawalan PS4 disambungkan — guna D-Pad + ✕');
  });

  function pressed(dir,isDown,now){
    if(!isDown){dirState[dir]=0;return false;}
    if(dirState[dir]===0){dirState[dir]=now+REPEAT_DELAY;return true;}
    if(now>=dirState[dir]){dirState[dir]=now+REPEAT_RATE;return true;}
    return false;
  }

  // On the hub page itself, a game loaded into #game-stage's iframe runs its
  // own copy of this same script inside that iframe's document. Both would
  // otherwise read the same physical controller at once and fight over
  // focus in two different documents — so the hub instance stands down
  // whenever the game stage is the thing actually on screen.
  function hubGameActive(){
    const stage=document.getElementById('game-stage');
    return !!(stage&&!stage.hidden);
  }

  function poll(){
    if(hubGameActive()){requestAnimationFrame(poll);return;}
    const now=performance.now();
    const pads=navigator.getGamepads?navigator.getGamepads():[];
    for(const gp of pads){
      if(!gp)continue;
      const b=gp.buttons;
      const dpadUp=!!(b[12]&&b[12].pressed), dpadDown=!!(b[13]&&b[13].pressed);
      const dpadLeft=!!(b[14]&&b[14].pressed), dpadRight=!!(b[15]&&b[15].pressed);
      const stickX=gp.axes[0]||0, stickY=gp.axes[1]||0;
      const up=dpadUp||stickY<-DEADZONE, down=dpadDown||stickY>DEADZONE;
      const left=dpadLeft||stickX<-DEADZONE, right=dpadRight||stickX>DEADZONE;

      if(pressed('up',up,now))moveFocus('up');
      else if(pressed('down',down,now))moveFocus('down');
      else if(pressed('left',left,now))moveFocus('left');
      else if(pressed('right',right,now))moveFocus('right');

      const crossDown=!!(b[0]&&b[0].pressed);
      if(crossDown&&!crossWasDown)activateFocused();
      crossWasDown=crossDown;

      const circleDown=!!(b[1]&&b[1].pressed);
      if(circleDown&&!circleWasDown){
        const back=[...document.querySelectorAll('button')].find(el=>isVisible(el)&&/tutup|kembali|keluar|back|close|batal/i.test((el.id||'')+' '+(el.className||'')+' '+(el.textContent||'')));
        if(back)back.click();
      }
      circleWasDown=circleDown;

      break; // only the first connected controller drives navigation
    }
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);

  // Expose raw per-frame gamepad direction state for games with continuous
  // (non-button) movement, e.g. the village-exploration game's WASD-style walk.
  window.gamepadDirections=function(){
    const pads=navigator.getGamepads?navigator.getGamepads():[];
    for(const gp of pads){
      if(!gp)continue;
      const b=gp.buttons;
      const stickX=gp.axes[0]||0, stickY=gp.axes[1]||0;
      return{
        up:!!(b[12]&&b[12].pressed)||stickY<-DEADZONE,
        down:!!(b[13]&&b[13].pressed)||stickY>DEADZONE,
        left:!!(b[14]&&b[14].pressed)||stickX<-DEADZONE,
        right:!!(b[15]&&b[15].pressed)||stickX>DEADZONE,
        action:!!(b[0]&&b[0].pressed)
      };
    }
    return{up:false,down:false,left:false,right:false,action:false};
  };
})();
