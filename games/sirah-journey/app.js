'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'sirah-journey-v1';
  const LIMIT = 240000, FAST = 10000;
  const categories = ['Peristiwa','Tokoh','Tempat','Susun Peristiwa','Nilai & Ibrah'];
  // Setiap kategori ada ikon dan nama pendek sendiri supaya checkpoint pada peta
  // perjalanan kelihatan sebagai lencana bergambar, bukan sekadar nombor.
  const icons = {'Peristiwa':'📜','Tokoh':'👤','Tempat':'🕌','Susun Peristiwa':'🧭','Nilai & Ibrah':'💡','Mystery':'❓'};
  const names = {'Peristiwa':'Peristiwa','Tokoh':'Tokoh','Tempat':'Tempat','Susun Peristiwa':'Susun','Nilai & Ibrah':'Ibrah','Mystery':'Misteri'};
  const eras = {'Makkah':'ERA MAKKAH','Hijrah':'TAHUN HIJRAH','Madinah':'ERA MADINAH'};
  const PER_LEVEL = 5;
  let memory = {}, storageOK = true;
  function read(key, fallback) { if(Object.prototype.hasOwnProperty.call(memory,key))return memory[key]; try { const raw=localStorage.getItem(KEY+key); return raw ? JSON.parse(raw) : fallback; } catch { storageOK=false; return memory[key] ?? fallback; } }
  function save(key,value) { memory[key]=value; try { localStorage.setItem(KEY+key,JSON.stringify(value)); } catch { storageOK=false; $('offline-status').textContent='Simpanan peranti tidak tersedia; rekod sesi ini sahaja.'; } }
  let settings=read(':settings',{players:1,sound:false})||{};
  let players=Number.isInteger(settings.players)&&settings.players>=1&&settings.players<=6?settings.players:1;
  let sound=!!settings.sound, host=false, view='start', session=null, order=[], locked=false, questionTime=0;
  let clock=null, finalDelay=null, idle=Date.now(), audioContext=null, installEvent=null;
  const shuffle = arr => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  function selectQuestions() {
    const cats=[...categories,...categories];
    // Two laps through the five checkpoints make up the 10 questions; each lap
    // has about a one-in-three chance of swapping one factual checkpoint for Mystery.
    for(const offset of [0,categories.length]) if(Math.random()<.34) cats[offset+Math.floor(Math.random()*3)]='Mystery';
    const used=new Set();
    const picked=cats.map(category=>{
      const pool=window.SIRAH_QUESTIONS.filter(q=>q.category===category&&!used.has(q.topic));
      const q=shuffle(pool)[0]; used.add(q.topic);
      return {...q, options:shuffle(q.options)};
    });
    // Susun mengikut tahun peristiwa: satu sesi mengikut aliran sirah yang sebenar
    // (Makkah → Hijrah → Madinah), bukan lompat ke sana ke mari. Isih JavaScript
    // bersifat stable, jadi soalan tahun sama kekal berselang-seli antara kategori.
    return picked.sort((a,b)=>a.year-b.year);
  }
  function levelOf(index){return Math.floor(index/PER_LEVEL)+1;}
  function levelCount(){return Math.ceil(session.questions.length/PER_LEVEL);}
  function levelEra(level){
    const part=session.questions.slice((level-1)*PER_LEVEL,level*PER_LEVEL);
    if(!part.length)return '';
    const first=part[0].era,last=part[part.length-1].era;
    return first===last?eras[first]:`${first.toUpperCase()} → ${last.toUpperCase()}`;
  }
  function dayKey(date=new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
  function leaders() {
    const board=read(':leaders',{});
    return board&&board.day===dayKey()&&Array.isArray(board.entries)?board.entries.filter(e=>e&&typeof e.team==='string'&&Number.isFinite(e.score)&&Number.isFinite(e.time)):[];
  }
  function renderLeaders() {
    const rows=leaders().slice(0,5);
    for(const id of ['leaders-start','leaders-result']) {
      const list=$(id); list.replaceChildren();
      if(!rows.length){const li=document.createElement('li');li.className='empty';li.textContent='Belum ada rekod. Jadilah kumpulan pertama!';list.append(li);}
      rows.forEach((e,i)=>{const li=document.createElement('li');const rank=document.createElement('span');rank.className='rank';rank.textContent=String(i+1).padStart(2,'0');const team=document.createElement('span');team.textContent=e.team;const score=document.createElement('b');score.textContent=e.score;li.append(rank,team,score);list.append(li);});
    }
  }
  function persistSettings(){save(':settings',{players,sound});}
  function setPlayers(n){players=n;document.querySelectorAll('[data-players]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.players)===n)));persistSettings();}
  function setView(v){view=v;['start','game','result'].forEach(id=>$(id).hidden=id!==v);idle=Date.now();window.scrollTo({top:0,behavior:'instant'});}
  function stopTimers(){clearInterval(clock);clearTimeout(finalDelay);clock=null;finalDelay=null;}
  function start(){
    stopTimers();
    const team=$('team-name').value.trim().slice(0,32)||'Kumpulan Tetamu';
    const questions=selectQuestions();
    session={team,players,questions,index:0,score:0,correct:0,answered:0,started:Date.now(),ended:false,records:[],maxScore:questions.reduce((s,q)=>s+q.points+25,0)};
    setView('game');$('playing-team').textContent=`${team} · ${players} peserta`;
    showQuestion();tick();clock=setInterval(tick,200);save(':score',{team,score:0,complete:false});
  }
  function formatTime(ms){const s=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
  function tick(){if(!session||session.ended)return;const left=LIMIT-(Date.now()-session.started);$('timer').textContent=formatTime(left);$('timer-box').classList.toggle('amber',left<=60000&&left>20000);$('timer-box').classList.toggle('red',left<=20000);if(left<=0)finish('timeout');}
  function renderJourney(){
    const nav=$('journey');nav.replaceChildren();
    for(let level=1;level<=levelCount();level++){
      const part=session.questions.slice((level-1)*PER_LEVEL,level*PER_LEVEL);
      const group=document.createElement('div');
      group.className='journey-level'+(levelOf(session.index)===level?' active':'')+(levelOf(session.index)>level?' cleared':'');
      const tag=document.createElement('p');tag.className='level-tag';
      const badge=document.createElement('b');badge.textContent=`LEVEL ${level}`;
      const era=document.createElement('span');era.textContent=levelEra(level);
      const count=document.createElement('i');count.textContent=`${part.length} soalan`;
      tag.append(badge,era,count);
      const row=document.createElement('div');row.className='journey-row';
      part.forEach((q,n)=>{
        const i=(level-1)*PER_LEVEL+n;
        const d=document.createElement('div');
        d.className='checkpoint'+(i<session.index||(i===session.index&&locked)?' done':'')+(i===session.index?' current':'');
        d.setAttribute('aria-label',`Checkpoint ${i+1}: ${q.category}, tahun ${q.year} Masihi${i===session.index?', semasa':''}`);
        if(i===session.index)d.setAttribute('aria-current','step');
        const icon=document.createElement('i');icon.textContent=i<session.index?'✓':icons[q.category]||'✦';
        const text=document.createElement('span');text.textContent=names[q.category]||q.category;
        const year=document.createElement('small');year.textContent=`${q.year}M`;
        d.append(icon,text,year);row.append(d);
      });
      group.append(tag,row);nav.append(group);
    }
  }
  function showLevelToast(){
    const toast=$('level-toast');
    toast.textContent=`LEVEL ${levelOf(session.index)} · ${levelEra(levelOf(session.index))}`;
    toast.hidden=false;toast.classList.remove('show');void toast.offsetWidth;toast.classList.add('show');
    clearTimeout(showLevelToast.timer);
    showLevelToast.timer=setTimeout(()=>{toast.classList.remove('show');toast.hidden=true;},2400);
  }
  function showQuestion(){
    locked=false;order=[];questionTime=Date.now();const q=session.questions[session.index];
    $('score').textContent=session.score;
    $('category').textContent=`${icons[q.category]||'✦'} ${q.category.toUpperCase()}`;
    $('era-badge').textContent=`${q.year}M · ${eras[q.era]||q.era.toUpperCase()}`;
    $('era-badge').className='era-badge era-'+q.era.toLowerCase();
    $('progress-label').textContent=`LEVEL ${levelOf(session.index)}/${levelCount()} · CHECKPOINT ${String(session.index+1).padStart(2,'0')}/${String(session.questions.length).padStart(2,'0')}`;
    $('question-icon').textContent=icons[q.category]||'✦';
    $('point-label').textContent=`${q.points} mata · bonus pantas +25`;
    $('question').textContent=q.question;$('feedback').hidden=true;$('feedback').replaceChildren();$('next').hidden=true;
    $('timeline-hint').hidden=q.type!=='timeline';$('timeline-actions').hidden=q.type!=='timeline';$('submit-order').disabled=true;$('undo-order').disabled=false;
    $('answers').className='answers'+(q.type==='timeline'?' timeline':'');$('answers').replaceChildren();
    q.options.forEach((option,i)=>{const b=document.createElement('button');b.className='answer';b.dataset.value=option;const label=document.createElement('span');label.className='letter';label.textContent=q.type==='timeline'?'–':String.fromCharCode(65+i);const text=document.createElement('span');text.textContent=option;b.append(label,text);b.addEventListener('click',()=>{if(!active())return;if(q.type==='timeline')chooseOrder(option);else answer(option);});$('answers').append(b);});
    renderJourney();$('question').focus({preventScroll:true});
    if(session.index%PER_LEVEL===0)showLevelToast();
  }
  function active(){if(view!=='game'||!session||session.ended||locked)return false;if(Date.now()-session.started>=LIMIT){finish('timeout');return false;}return true;}
  function chooseOrder(value){
    if(order.includes(value))order=order.filter(v=>v!==value);else order.push(value);
    [...$('answers').children].forEach(b=>{const n=order.indexOf(b.dataset.value);b.classList.toggle('selected',n>=0);b.setAttribute('aria-pressed',String(n>=0));b.firstElementChild.textContent=n>=0?n+1:'–';});$('submit-order').disabled=order.length!==3;
  }
  function beep(correct){if(!sound)return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=correct?660:250;g.gain.setValueAtTime(.05,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.18);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+.2);}catch{/* Sound is optional. */}}
  function answer(value,reason='answer'){
    if(!active())return;locked=true;
    const q=session.questions[session.index];
    const correct=reason==='answer'&&(q.type==='timeline'?JSON.stringify(value)===JSON.stringify(q.correctAnswer):value===q.correctAnswer);
    const fast=correct&&Date.now()-questionTime<=FAST;const points=correct?q.points+(fast?25:0):0;
    session.score+=points;session.correct+=correct?1:0;session.answered+=reason==='answer'?1:0;
    session.records.push({id:q.id,correct,points,reason});
    [...$('answers').children].forEach(b=>{b.disabled=true;const v=b.dataset.value;if(q.type==='mcq'){b.classList.toggle('correct',v===q.correctAnswer);b.classList.toggle('wrong',v===value&&!correct);}else{b.firstElementChild.textContent=q.correctAnswer.indexOf(v)+1;b.classList.toggle('correct',correct);}});
    $('submit-order').disabled=true;$('undo-order').disabled=true;
    const f=$('feedback');f.hidden=false;f.className='feedback'+(correct?'':' bad');
    if(correct){const ar=document.createElement('span');ar.className='arabic';ar.lang='ar';ar.dir='rtl';ar.textContent='أَحْسَنْتُمْ!';f.append(ar);}
    const title=document.createElement('strong');title.textContent=correct?`BETUL! +${points}${fast?' · Bonus pantas +25':''}`:reason==='answer'?'BELUM TEPAT':reason==='skip'?'DILANGKAU · 0 MATA':'JAWAPAN DIBUKA · 0 MATA';f.append(title);
    if(!correct){const a=document.createElement('p');a.textContent='Jawapan: '+(Array.isArray(q.correctAnswer)?q.correctAnswer.join(' → '):q.correctAnswer);f.append(a);}
    const ex=document.createElement('p');ex.textContent=q.shortExplanation;f.append(ex);
    const last=session.index===session.questions.length-1;
    const opensLevel=!last&&(session.index+1)%PER_LEVEL===0;
    $('score').textContent=session.score;$('next').textContent=last?'LIHAT KEPUTUSAN →':opensLevel?`MULA LEVEL ${levelOf(session.index+1)} →`:'CHECKPOINT SETERUSNYA →';$('next').hidden=false;
    renderJourney();save(':score',{team:session.team,score:session.score,complete:false});beep(correct);
    if(last)finalDelay=setTimeout(()=>finish('complete'),2600);
  }
  function next(){if(view!=='game'||!session||session.ended||!locked)return;if(Date.now()-session.started>=LIMIT)return finish('timeout');clearTimeout(finalDelay);if(session.index===session.questions.length-1)return finish('complete');session.index++;$('undo-order').disabled=false;showQuestion();}
  function finish(reason){
    if(!session||session.ended)return;session.ended=true;stopTimers();
    const elapsed=Math.min(LIMIT,Date.now()-session.started),correct=session.correct,total=session.questions.length;
    const levels=correct===total?['بَطَلُ السِّيرَة','SIRAH CHAMPION','🏆']:correct>=Math.ceil(total*.8)?['مُمْتَازٌ','Excellent','🌟']:correct>=Math.ceil(total*.4)?['جَيِّدٌ','Good','🌿']:['مُحَاوَلَةٌ جَيِّدَةٌ','Good Try','🌱'];
    $('result-icon').textContent=levels[2];
    $('result-heading').textContent=reason==='timeout'?'MASA TAMAT!':'TAHNIAH!';$('result-team').textContent=session.team;$('performance-ar').textContent=levels[0];$('performance').textContent=levels[1];$('result-score').textContent=session.score;$('result-max').textContent=`daripada ${session.maxScore} mata untuk set ini`;
    $('result-correct').textContent=`${correct} / ${total}`;$('result-accuracy').textContent=`${Math.round(correct*100/total)}%`;$('result-time').textContent=formatTime(elapsed);$('result-detail').textContent=`${session.players} peserta · ${levelCount()} level × ${PER_LEVEL} soalan · ${session.answered} soalan dijawab`;
    const entries=leaders();entries.push({team:session.team,score:session.score,time:elapsed});entries.sort((a,b)=>b.score-a.score||a.time-b.time);save(':leaders',{day:dayKey(),entries:entries.slice(0,5)});save(':score',{team:session.team,score:session.score,correct,elapsed,complete:true});
    setView('result');renderLeaders();$('new-team').focus({preventScroll:true});
    if(total>0&&Math.round(correct*100/total)>=90){$('prize-popup').hidden=false;beep(true)}
  }
  function reset(clearTeam=true){stopTimers();session=null;locked=false;order=[];if(clearTeam){$('team-name').value='';setPlayers(1);}save(':score',null);$('undo-order').disabled=false;setView('start');renderLeaders();}
  function hostAction(action){if(!host)return;if(action==='reset'){reset();return;}if(view!=='game')return;if(action==='next')next();if(action==='skip'&&!locked){answer(null,'skip');}if(action==='answer'&&!locked)answer(null,'reveal');}
  function attract(show){$('attract').hidden=!show;for(const el of [$('main'),document.querySelector('.topbar'),$('host'),document.querySelector('footer')])el.inert=show;if(show)$('attract-start').focus();else{reset();$('team-name').focus({preventScroll:true});}}
  $('start-form').addEventListener('submit',e=>{e.preventDefault();start();});
  $('players').addEventListener('click',e=>{const b=e.target.closest('[data-players]');if(b)setPlayers(Number(b.dataset.players));});
  $('sound').addEventListener('click',()=>{sound=!sound;persistSettings();$('sound').textContent=`Bunyi: ${sound?'Buka':'Tutup'}`;$('sound').setAttribute('aria-pressed',String(sound));if(sound)beep(true);});
  $('host-toggle').addEventListener('click',()=>{host=!host;$('host').hidden=!host;$('host-toggle').setAttribute('aria-expanded',String(host));});
  document.querySelectorAll('[data-host]').forEach(b=>b.addEventListener('click',()=>hostAction(b.dataset.host)));
  $('clear-leaders').addEventListener('click',()=>{if(confirm('Padam semua rekod leaderboard pada peranti ini?')){save(':leaders',{day:dayKey(),entries:[]});renderLeaders();}});
  $('next').addEventListener('click',next);$('new-team').addEventListener('click',()=>reset());$('replay').addEventListener('click',start);
  $('undo-order').addEventListener('click',()=>{if(!active())return;order=[];[...$('answers').children].forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');b.firstElementChild.textContent='–';});$('submit-order').disabled=true;});
  $('submit-order').addEventListener('click',()=>{if(order.length===3)answer([...order]);});
  ['pointerdown','keydown','input'].forEach(event=>document.addEventListener(event,()=>{idle=Date.now();},{passive:true}));
  document.addEventListener('keydown',e=>{if(!$('attract').hidden){if(e.key==='Escape'||e.key==='Enter'||e.key===' '){e.preventDefault();attract(false);}return;}if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,[contenteditable="true"]')||$('install-info').open)return;const map={n:'next',s:'skip',a:'answer',r:'reset'};if(host&&map[e.key.toLowerCase()]){e.preventDefault();hostAction(map[e.key.toLowerCase()]);}});
  $('attract').addEventListener('pointerdown',e=>{e.preventDefault();attract(false);});$('attract-start').addEventListener('click',()=>{if(!$('attract').hidden)attract(false);});
  setInterval(()=>{if(view!=='game'&&$('attract').hidden&&!$('install-info').open&&Date.now()-idle>=30000)attract(true);},1000);
  document.addEventListener('visibilitychange',()=>{if(view==='game')tick();else renderLeaders();});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;});
  window.addEventListener('appinstalled',()=>{installEvent=null;$('install').textContent='App dipasang';});
  $('install').addEventListener('click',async()=>{if(installEvent){await installEvent.prompt();await installEvent.userChoice;installEvent=null;return;}$('install-message').textContent=location.protocol==='file:'?'Gunakan start-local.bat atau start-local.command dahulu; PWA memerlukan localhost atau HTTPS.':'Chrome / Edge: buka menu pelayar dan pilih Install app / Pasang app jika tersedia. iPhone / iPad: buka dengan Safari, tekan Share, kemudian Add to Home Screen. Tunggu status “Sedia offline” sebelum memutuskan internet.';$('install-info').showModal();});
  $('close-install').addEventListener('click',()=>{$('install-info').close();idle=Date.now();});
  $('prize-close').addEventListener('click',()=>{$('prize-popup').hidden=true;});
  async function registerOffline(){
    if(location.protocol==='file:'){$('offline-status').textContent='Buka melalui localhost menggunakan fail start-local.';return;}
    if(!('serviceWorker' in navigator)){$('offline-status').textContent='Pelayar ini tidak menyokong mod offline.';return;}
    try{
      const reg=await navigator.serviceWorker.register('./sw.js');
      reg.update();
      // Chrome only re-checks sw.js for a newer version automatically every ~24h;
      // reg.update() forces that check on every load so a deploy is picked up the
      // very next time the game is opened, not a day later. Combined with
      // skipWaiting()+clients.claim() in sw.js, a new version activates and takes
      // over immediately once found — this reloads once to bring it on screen,
      // but never mid-checkpoint, so it can't cut off a team's active answer.
      navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!session||session.ended)location.reload();});
      await navigator.serviceWorker.ready;
      // ready resolves only after the full atomic precache has installed and activated.
      if(storageOK)$('offline-status').textContent='Sedia offline · Boleh dimainkan tanpa internet';
    }catch{$('offline-status').textContent='Cache belum siap. Muat semula semasa server berjalan.';}
  }
  setPlayers(players);$('sound').textContent=`Bunyi: ${sound?'Buka':'Tutup'}`;$('sound').setAttribute('aria-pressed',String(sound));renderLeaders();registerOffline();
})();
