const $=s=>document.querySelector(s), app=$('#app');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=()=>{let d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`};
function rankings(){try{let d=JSON.parse(localStorage.getItem('arabic-chess-ranks-8')||'{}');return d.day===day()&&Array.isArray(d.rows)?d.rows:[]}catch{return []}}
function leader(){let rows=rankings().slice(0,5);return `<div class="ranking"><h3>🏆 <span lang="ar" dir="rtl">لَوْحَةُ الأَبْطَالِ</span> · Top 5 hari ini</h3>${rows.length?rows.map((r,i)=>`<div class="rankrow"><span>${i+1}. ${esc(r.team)}</span><b>${Number(r.score)||0} mata</b></div>`).join(''):'<p class="muted">Belum ada skor. Jadilah pasukan pertama!</p>'}</div>`}
function chime(type){if(!sound)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();let seq=type==='correct'?[523,659,784]:type==='victory'?[523,659,784,1047]:type==='wrong'?[260,220]:[440];seq.forEach((f,i)=>{let o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+i*.10;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.07,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+.21)})}catch{}}

const FILES='abcdefgh';
const PIECE_NAME_MS={k:'raja',q:'menteri',r:'benteng',b:'gajah',n:'kuda',p:'bidak'};
const PIECE_VALUE={p:1,n:3,b:3,r:5,q:9,k:0};
const SESSION_SECONDS=600, QUIZ_TIME_MS=15000;

let mode='ai'; // 'ai' | 'pvp'
let phase='home',players=3,team='',teamW='',teamB='',host=false,sound=false,audioCtx,lastActivity=Date.now(),advanceTimer;
let chess=null,homePreview=null,selected=-1,legalMoves=[],pendingMove=null;
let quizQ=null,quizSelected=-1,quizRevealed=false,quizAt=0,quizAnswered=false,quizTimedOut=false;
let boardFocus=false;
let aiThinking=false;
let scoreW=0,scoreB=0,correctW=0,correctB=0,askedW=0,askedB=0,usedQ=new Set();
let remaining=SESSION_SECONDS,sessionDeadline=0,sessionSaved=false;
let result=null;

function sideName(color){if(mode==='pvp')return(color==='w'?teamW:teamB)||(color==='w'?'Putih':'Hitam');return color==='w'?(team||'Pasukan anda'):'AI'}
function addScore(color,pts){if(color==='w')scoreW+=pts;else scoreB+=pts}
function addCorrect(color){if(color==='w')correctW++;else correctB++}
function addAsked(color){if(color==='w')askedW++;else askedB++}
function materialPoints(color){return (chess?.history||[]).reduce((s,m)=>s+((m.captured&&m.piece&&m.piece.c===color)?PIECE_VALUE[m.captured.t]:0),0)}
function deadPieces(color){return (chess?.history||[]).filter(m=>m.captured&&m.captured.c===color).map(m=>m.captured).sort((a,b)=>PIECE_VALUE[b.t]-PIECE_VALUE[a.t])}

function pickQuestion(){
  let pool=QUESTIONS.filter(q=>!usedQ.has(q.id));
  if(!pool.length){usedQ.clear();pool=QUESTIONS}
  let q=pool[Math.floor(Math.random()*pool.length)];
  usedQ.add(q.id);
  return {...q};
}

function clock(){return `${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`}

function graveyard(color){
  const dead=deadPieces(color),pts=dead.reduce((s,p)=>s+PIECE_VALUE[p.t],0);
  return `<div class="graveyard" aria-label="Buah ${color==='w'?'putih':'hitam'} yang tumbang"><span class="graveyard-label">${color==='w'?'PUTIH':'HITAM'} DITAWAN</span><div class="graveyard-pieces">${dead.length?dead.map(p=>ChessPieces.svg(p.t,p.c,'dead-piece')).join(''):'<span class="graveyard-empty">Belum ada</span>'}</div><span class="graveyard-points" title="Nilai bahan catur">${pts} mata</span></div>`;
}

function playerStrip(color,name,description,active){
  return `<div class="player-strip ${active?'is-turn':''}"><div class="avatar ${color==='w'?'human':'computer'}">${ChessPieces.svg(color==='w'?'k':(mode==='ai'?'n':'k'),color)}</div><div class="player-identity"><strong>${esc(name)}</strong><small>${description}</small></div><span class="turn-dot" aria-label="${active?'Sedang bermain':'Menunggu'}"></span></div>`;
}
function renderBoard(){
  const c=chess||(homePreview=homePreview||new ChessEngine.Chess());
  const humanTurn=mode==='pvp'||c.turnColor==='w';
  const interactive=phase==='playing'&&!aiThinking&&!quizQ&&humanTurn;
  const checkColor=phase==='playing'&&c.inCheck(c.turnColor)?c.turnColor:null;
  const checkSq=checkColor?c.kingSquare(checkColor):-1;
  const legalTo=new Set(legalMoves.map(m=>m.to));
  const captureTo=new Set(legalMoves.filter(m=>m.capture).map(m=>m.to));
  const last=c.history.filter(m=>!m.passed).at(-1);
  const squares=c.board.map((p,i)=>{
    const cls=['square'];
    if((Math.floor(i/8)+i%8)%2)cls.push('dark');
    if(i===selected)cls.push('active');
    if(legalTo.has(i))cls.push('target');
    if(captureTo.has(i))cls.push('enemy');
    if(i===checkSq)cls.push('incheck');
    if(last&&(i===last.from||i===last.to))cls.push('last-move');
    if(pendingMove&&(i===pendingMove.from||i===pendingMove.to))cls.push('pending');
    const label=ChessEngine.algebraic(i)+(p?` ${p.c==='w'?'putih':'hitam'} ${PIECE_NAME_MS[p.t]}`:'')+(legalTo.has(i)?', pergerakan sah':'');
    return `<button class="${cls.join(' ')}" data-square="${i}" ${interactive?'':'disabled'} aria-label="${label}" aria-pressed="${i===selected}">${p?ChessPieces.svg(p.t,p.c):''}</button>`;
  }).join('');
  const status=phase==='home'?'SEDIA BERMAIN':phase==='result'?resultStatusLabel():aiThinking?'AI BERFIKIR':quizQ?'CABARAN BAHASA':(mode==='pvp'?`GILIRAN ${esc(sideName(c.turnColor)).toUpperCase()}`:'GILIRAN ANDA');
  const note=phase==='home'?(mode==='pvp'?'Kedua pasukan berkongsi peranti ini. Putih bermula dahulu.':'Anda main putih. Langkah pertama milik anda.'):quizQ?'Jawab cabaran bahasa untuk mengesahkan tangkapan.':aiThinking?'Lawan sedang merancang langkah seterusnya…':checkColor?`Check! ${esc(sideName(checkColor))} perlu melindungi raja.`:selected>=0?'Pilih petak bertanda untuk menggerakkan buah.':phase==='playing'?(mode==='pvp'?`Sentuh buah ${c.turnColor==='w'?'putih':'hitam'} untuk melihat langkah yang sah.`:'Pilih buah putih untuk melihat langkah yang sah.'):'Setiap permainan ialah peluang untuk belajar.';
  const bTurn=phase==='playing'&&c.turnColor==='b',wTurn=phase==='playing'&&c.turnColor==='w';
  return `<section class="board-panel"><div class="board-top"><span><span class="live-dot"></span> ARENA CATUR</span><button id="board-focus" class="board-expand" aria-pressed="${boardFocus}" aria-label="${boardFocus?'Paparan biasa':'Besarkan papan'}">${boardFocus?'↙ Paparan biasa':'⛶ Besarkan'}</button></div>${playerStrip('b',mode==='pvp'?(phase==='home'?'Pasukan Hitam':teamB):'Lawan AI',mode==='pvp'?'HITAM':'HITAM · TAHAP PEMULA',bTurn)}<div class="board-frame"><div class="board-arena"><div class="board-core"><div class="rank-coordinates" aria-hidden="true">${[8,7,6,5,4,3,2,1].map(n=>`<span>${n}</span>`).join('')}</div><div class="board" role="group" aria-label="Papan catur. Putih di bawah, hitam di atas.">${squares}</div><div class="file-coordinates" aria-hidden="true">${[...FILES].map(f=>`<span>${f}</span>`).join('')}</div></div></div></div><div class="capture-trays">${graveyard('w')}${graveyard('b')}</div>${playerStrip('w',mode==='pvp'?(phase==='home'?'Pasukan Putih':teamW):(phase==='home'?'Pasukan anda':team),mode==='pvp'?'PUTIH':'PUTIH · '+players+' PESERTA',wTurn)}<div class="board-bottom"><span class="pill">${status}</span><span>LANGKAH ${String(c.fullmove).padStart(2,'0')}</span></div><p class="board-note" role="status">${note}</p></section>`;
}
function resultStatusLabel(){
  if(mode==='ai')return result.outcome==='win'?'ANDA MENANG':result.outcome==='loss'?'AI MENANG':result.outcome==='draw'?'SERI':'SESI TAMAT';
  return result.outcome==='winW'?`${esc(teamW||'PUTIH')} MENANG`.toUpperCase():result.outcome==='winB'?`${esc(teamB||'HITAM')} MENANG`.toUpperCase():result.outcome==='draw'?'SERI':'SESI TAMAT';
}
function homeCard(){
  const modeTabs=`<div class="mode-tabs" role="group" aria-label="Jenis lawan"><button data-mode="ai" aria-pressed="${mode==='ai'}" class="${mode==='ai'?'selected':''}"><span class="mode-symbol" aria-hidden="true">${ChessPieces.svg('n','b')}</span><span>Lawan AI<small>Latih strategi anda</small></span></button><button data-mode="pvp" aria-pressed="${mode==='pvp'}" class="${mode==='pvp'?'selected':''}"><span class="mode-symbol" aria-hidden="true">${ChessPieces.svg('k','w')}</span><span>2 Pemain<small>Bersaing bersama</small></span></button></div>`;
  const fields=mode==='ai'?`<label id="players-label">Bilangan peserta <span lang="ar">عدد اللاعبين</span></label><div class="players" role="group" aria-labelledby="players-label">${[1,2,3,4,5,6].map(n=>`<button data-player="${n}" class="${n===players?'selected':''}" aria-pressed="${n===players}">${n}</button>`).join('')}</div><label for="team">Nama pasukan <span class="optional">pilihan</span></label><input id="team" maxlength="35" placeholder="Contoh: Pasukan Al-Nur" value="${esc(team)}" dir="auto">`
    :`<label for="teamW">Nama pasukan Putih <span class="optional">pilihan</span></label><input id="teamW" maxlength="35" placeholder="Contoh: Pasukan Elang" value="${esc(teamW)}" dir="auto"><label for="teamB">Nama pasukan Hitam <span class="optional">pilihan</span></label><input id="teamB" maxlength="35" placeholder="Contoh: Pasukan Singa" value="${esc(teamB)}" dir="auto">`;
  const startLabel=mode==='ai'?'Mula cabaran':'Mula perlawanan';
  const startNote=mode==='ai'?'Main putih · Lawan AI pemula · Tanpa login':'Kedua pasukan kongsi peranti · Jawapan salah gugurkan giliran';
  return `<section class="card home-card"><div class="kicker"><span class="tiny-star">✦</span> CABARAN BERMULA DI SINI</div><h2>Langkah bijak.<br><em>Bahasa hebat.</em></h2><p class="muted">Satukan strategi pasukan. Tawan buah lawan dan uji bahasa Arab anda dalam satu permainan.</p><div class="stats"><div class="stat"><strong>32<small>BUAH CATUR</small></strong></div><div class="stat"><strong>10<small>MINIT SESI</small></strong></div><div class="stat"><strong>${mode==='pvp'?'2':'1–6'}<small>${mode==='pvp'?'PASUKAN':'PESERTA'}</small></strong></div></div><div class="setup-heading"><span>SEDIAKAN PERLAWANAN</span><span>PILIH MOD</span></div>${modeTabs}${fields}<button class="primary" id="start"><span>${startLabel} <span lang="ar">ابدأ التحدي</span></span><span class="button-arrow" aria-hidden="true">↗</span></button><p class="how">${startNote}</p><div class="how-to"><span><b>01</b> Gerak buah</span><i>→</i><span><b>02</b> Tangkap lawan</span><i>→</i><span><b>03</b> Jawab & skor</span></div>${leader()}</section>`;
}
function quizCard(){
  const q=quizQ,showFeedback=quizAnswered;
  const actorColor=chess.turnColor;
  const seconds=Math.max(0,Math.ceil((QUIZ_TIME_MS-(Date.now()-quizAt))/1000));
  const category={vocab:'Kosa kata',grammar:'Tatabahasa',translation:'Terjemahan',nahw:'Tatabahasa',sarf:'Bentuk perkataan'}[q.category]||'Bahasa Arab';
  const captured=chess.board[pendingMove?.to]|| (pendingMove?.ep?{t:'p',c:actorColor==='w'?'b':'w'}:null);
  const sessionMini=mode==='pvp'?`<span>PUTIH <strong>${scoreW}</strong></span><span>HITAM <strong>${scoreB}</strong></span><span>SESI <strong id="timer">${clock()}</strong></span>`:`<span>MASA SESI <strong id="timer">${clock()}</strong></span><span><b>${scoreW}</b> mata</span>`;
  return `<section class="card quiz-card ${showFeedback?(quizSelected===q.correctAnswer&&!quizRevealed?'quiz-success':'quiz-missed'):''}" aria-labelledby="quiz-title"><div class="gamehead"><span class="kicker">✦ CABARAN${mode==='pvp'?' — '+esc(sideName(actorColor)).toUpperCase():' BAHASA'}</span><span class="question-number">SOALAN ${String(showFeedback?askedW+askedB:askedW+askedB+1).padStart(2,'0')}</span></div><div class="capture-banner"><div class="capture-icon">${ChessPieces.svg(captured?.t||'p',actorColor==='w'?'b':'w')}</div><div><strong>Satu tangkapan. Satu cabaran.</strong><small>${mode==='pvp'?'Jawapan salah gugurkan giliran anda.':'Jawab betul untuk menawan buah lawan.'}</small></div></div><div class="quiz-meta"><span class="category">${category}</span><span class="quiz-clock ${seconds<=5?'urgent':''}" id="quiz-clock">${showFeedback?'Selesai':seconds+'s'}</span></div><div class="quiz-progress" role="progressbar" aria-label="Baki masa menjawab" aria-valuemin="0" aria-valuemax="15" aria-valuenow="${seconds}"><span style="transform:scaleX(${seconds/15})"></span></div><h2 id="quiz-title" class="question" lang="ar" dir="rtl" tabindex="-1">${esc(q.question)}</h2><p class="answer-instruction">Pilih jawapan anda <span>A – ${'ABCD'[q.options.length-1]}</span></p><div class="answers">${q.options.map((o,i)=>`<button data-answer="${i}" class="answer ${showFeedback?(i===q.correctAnswer?'correct':i===quizSelected?'wrong':''):''}" style="--answer-order:${i}" ${showFeedback?'disabled':''}><span class="letter">${'ABCD'[i]}</span><span dir="auto">${esc(o)}</span><span class="answer-mark" aria-hidden="true">${showFeedback&&i===q.correctAnswer?'✓':showFeedback&&i===quizSelected?'×':'↗'}</span></button>`).join('')}</div>${showFeedback?`<div class="feedback" role="status"><b>${quizRevealed?'Jawapan ditunjukkan':quizTimedOut?'Masa menjawab tamat':quizSelected===q.correctAnswer?'Hebat! +'+(q.earned||0)+' mata':'Belum tepat!'}</b><span>${esc(q.shortExplanation)}</span><small>${quizSelected===q.correctAnswer&&!quizRevealed?'Tangkapan disahkan. Langkah yang bijak!':mode==='pvp'?`Tangkapan dibatalkan. Giliran beralih kepada ${esc(sideName(actorColor==='w'?'b':'w'))}.`:'Tangkapan dibatalkan. Pilih langkah seterusnya.'}</small></div>`:'<p class="bonus-note">✦ <b>+100</b> jawapan betul <span>·</span> <b>+50</b> bonus bawah 5s</p>'}<div class="session-mini">${sessionMini}</div></section>`;
}
function turnCard(){
  const recent=chess.history.slice(-6);
  const scoreStrip=mode==='pvp'
    ?`<div class="score-strip"><div><small>${esc(teamW||'PUTIH').toUpperCase()}</small><strong>${scoreW}<span> mata</span></strong><small class="acc">${correctW}/${askedW} tepat</small></div><div><small>${esc(teamB||'HITAM').toUpperCase()}</small><strong>${scoreB}<span> mata</span></strong><small class="acc">${correctB}/${askedB} tepat</small></div></div>`
    :`<div class="score-strip"><div><small>MATA PASUKAN</small><strong>${scoreW}<span> mata</span></strong></div><div><small>JAWAPAN TEPAT</small><strong>${correctW}<span> / ${askedW}</span></strong></div></div>`;
  const activeColor=chess.turnColor,activeName=sideName(activeColor);
  const icon=selected>=0?chess.board[selected]:{t:'k',c:activeColor};
  const heading=aiThinking?'AI sedang berfikir…':selected>=0?'Ke mana seterusnya?':(mode==='pvp'?`Giliran ${esc(activeName)}.`:'Giliran anda.');
  const kicker=mode==='pvp'?(activeColor==='w'?'GILIRAN PUTIH':'GILIRAN HITAM'):(aiThinking?'LAWAN ANDA':'PAPAN MILIK ANDA');
  const muted=aiThinking?'Sedikit strategi, sebelum langkah seterusnya.':selected>=0?'Petak bertanda menunjukkan langkah yang sah. Pilih destinasi buah anda.':(mode==='pvp'?`Sentuh buah ${activeColor==='w'?'putih':'hitam'} untuk mula bergerak. Jawapan salah menggugurkan giliran.`:'Sentuh buah putih untuk mula bergerak. Tawan buah hitam untuk membuka cabaran bahasa.');
  const tip=aiThinking?'<div class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></div>':mode==='pvp'?'<span class="turn-tip">✦ Setiap tangkapan membuka satu soalan · jawapan salah gugurkan giliran</span>':'<span class="turn-tip">✦ Setiap tangkapan membuka satu soalan</span>';
  return `<section class="card turn-card"><div class="gamehead"><span class="kicker">SESI BERLANGSUNG</span><strong class="timer ${remaining<=30?'urgent':''}" id="timer">${clock()}</strong></div>${scoreStrip}<div class="select-message"><div class="turn-piece ${aiThinking?'thinking':''}">${ChessPieces.svg(icon.t,icon.c)}</div><div class="kicker">${kicker}</div><h2>${heading}</h2><p class="muted">${muted}</p>${tip}</div><div class="move-log"><div class="setup-heading"><span>LANGKAH TERKINI</span><span>${chess.history.length} GERAKAN</span></div><div class="move-list">${recent.length?recent.map(m=>m.passed?`<span class="move-chip passed">⦸ ${esc(sideName(m.passedColor))} tersalah jawab</span>`:`<span class="move-chip">${ChessPieces.svg(m.piece.t,m.piece.c)} ${ChessEngine.algebraic(m.from)} <i>${m.captured?'×':'→'}</i> ${ChessEngine.algebraic(m.to)}${m.check?'+':''}</span>`).join(''):'<p class="muted">Kisah permainan anda bermula dengan satu langkah.</p>'}</div></div></section>`;
}

function resultCardAi(){
  const outcome=result.outcome;
  const title=outcome==='win'?'أَحْسَنْتُمْ! كِشْ مَاتْ':outcome==='loss'?'خَسِرْتُمْ':outcome==='draw'?'تَعَادُلٌ':'انْتَهَتِ الجَلْسَةُ';
  const reasonText=result.reason==='50-move'?'peraturan 50 langkah':result.reason==='material'?'buah tidak mencukupi':'stalemate';
  const sub=outcome==='win'?'Anda menewaskan AI dengan checkmate!':outcome==='loss'?'AI menewaskan anda dengan checkmate.':outcome==='draw'?`Permainan berakhir seri (${reasonText}).`:result.reason==='timeout'?'Masa 10 minit telah tamat. Terima kasih kerana bermain!':'Sesi ditamatkan.';
  const stars=outcome==='win'?3:outcome==='draw'?2:1;
  return `<section class="card result"><div class="kicker">KEPUTUSAN CATUR</div><h2 lang="ar">${title}</h2><p class="muted">${esc(sub)}</p><div class="scorebig">${scoreW}</div><p>mata terkumpul</p><div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><p>${correctW} / ${askedW} soalan tepat · ${players} peserta</p><button class="primary" id="again">العب مرة أخرى · MAIN LAGI</button><button class="secondary" id="new">فريق جديد · KUMPULAN BARU</button>${leader()}</section>`;
}
function resultCardPvp(){
  const outcome=result.outcome;
  const wMat=materialPoints('w'),bMat=materialPoints('b');
  const title=outcome==='winW'?`${teamW||'Pasukan Putih'} Menang!`:outcome==='winB'?`${teamB||'Pasukan Hitam'} Menang!`:outcome==='draw'?'Seri!':'Sesi Ditamatkan';
  const reasonText=result.reason==='timeout'?'Masa sesi tamat. Pemenang ditentukan oleh jumlah nilai buah yang ditawan.':result.reason==='checkmate'?'Checkmate!':result.reason==='50-move'?'Seri mengikut peraturan 50 langkah.':result.reason==='material'?'Seri — buah tidak mencukupi untuk mat.':result.reason==='stalemate'?'Seri — stalemate.':'Sesi ditamatkan oleh fasilitator.';
  return `<section class="card result"><div class="kicker">KEPUTUSAN PERLAWANAN</div><h2>${esc(title)}</h2><p class="muted">${esc(reasonText)}</p><div class="pvp-result-grid"><div class="pvp-side ${outcome==='winW'?'winner':''}"><b>${esc(teamW||'Pasukan Putih')}</b><small>PUTIH</small><strong>${wMat}</strong><span>mata tangkapan</span><span>${scoreW} mata bahasa · ${correctW}/${askedW} tepat</span></div><div class="pvp-side ${outcome==='winB'?'winner':''}"><b>${esc(teamB||'Pasukan Hitam')}</b><small>HITAM</small><strong>${bMat}</strong><span>mata tangkapan</span><span>${scoreB} mata bahasa · ${correctB}/${askedB} tepat</span></div></div><button class="primary" id="again">Main semula</button><button class="secondary" id="new">Tukar pasukan</button></section>`;
}
function resultCard(){return mode==='pvp'?resultCardPvp():resultCardAi()}

function render(move){
  if(phase==='home'){team=$('#team')?.value??team;teamW=$('#teamW')?.value??teamW;teamB=$('#teamB')?.value??teamB;}
  const previousCard=app.querySelector('.card');
  const previousKind=previousCard?.className;
  const previousQuestion=app.querySelector('#quiz-title')?.textContent;
  const focused=document.activeElement?.dataset.square;
  const setupFocus=document.activeElement?.dataset.mode!==undefined?`[data-mode="${document.activeElement.dataset.mode}"]`:document.activeElement?.dataset.player!==undefined?`[data-player="${document.activeElement.dataset.player}"]`:null;
  let origins=[];
  if(move){
    origins.push([move.from,move.to]);
    if(move.castle){const row=Math.floor(move.from/8)*8;origins.push([row+(move.castle==='K'?7:0),row+(move.castle==='K'?5:3)])}
    origins=origins.map(([from,to])=>({from,to,rect:app.querySelector(`[data-square="${from}"]`)?.getBoundingClientRect()}));
  }
  const panel=phase==='home'?homeCard():phase==='playing'?(quizQ?quizCard():turnCard()):resultCard();
  document.body.classList.toggle('is-playing',phase==='playing');
  document.body.classList.toggle('board-focus',boardFocus);
  app.innerHTML=`<div class="workspace">${renderBoard()}${panel}</div>`;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const card=app.querySelector('.card');
  if(!reduced&&previousKind!==card.className)card.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,easing:'cubic-bezier(.2,.8,.2,1)'});
  if(!reduced)origins.forEach(({to,rect})=>{
    const dest=app.querySelector(`[data-square="${to}"]`),piece=dest?.querySelector('.chess-piece');
    if(!rect||!piece)return;
    const end=dest.getBoundingClientRect();
    dest.classList.add('moving');
    piece.animate([{transform:`translate(${rect.left-end.left}px,${rect.top-end.top}px) scale(1.06)`},{transform:'translate(0,0) scale(1)'}],{duration:340,easing:'cubic-bezier(.22,.65,.25,1)'}).finished.finally(()=>dest.classList.remove('moving'));
  });
  if(quizQ&&!quizAnswered&&previousQuestion!==quizQ.question){
    $('#quiz-title').focus({preventScroll:true});
    if(matchMedia('(max-width: 960px)').matches)card.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
  }else if(previousQuestion&&!quizQ&&phase==='playing'&&matchMedia('(max-width: 960px)').matches){
    $('.board-panel').scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
  }else if(focused!==undefined){app.querySelector(`[data-square="${focused}"]:not(:disabled)`)?.focus({preventScroll:true})}
  if(setupFocus&&phase==='home')app.querySelector(setupFocus)?.focus({preventScroll:true});
}

function start(){
  clearTimeout(advanceTimer);
  if(mode==='ai')team=($('#team')?.value||team).trim()||'Pasukan Tetamu';
  else{teamW=($('#teamW')?.value||teamW).trim()||'Pasukan Putih';teamB=($('#teamB')?.value||teamB).trim()||'Pasukan Hitam';}
  scoreW=scoreB=correctW=correctB=askedW=askedB=0;usedQ=new Set();sessionSaved=false;
  chess=new ChessEngine.Chess();
  selected=-1;legalMoves=[];pendingMove=null;quizQ=null;quizSelected=-1;quizRevealed=false;quizAnswered=false;quizTimedOut=false;aiThinking=false;result=null;
  remaining=SESSION_SECONDS;sessionDeadline=Date.now()+SESSION_SECONDS*1000;
  phase='playing';
  render();
  $('.board-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}
function home(){clearTimeout(advanceTimer);phase='home';team='';teamW='';teamB='';app.innerHTML='';chess=null;selected=-1;legalMoves=[];pendingMove=null;quizQ=null;quizAnswered=false;aiThinking=false;lastActivity=Date.now();render()}

function prizeAccuracy(){
  if(mode==='ai')return askedW>0?correctW/askedW:0;
  if(result?.outcome==='winW')return askedW>0?correctW/askedW:0;
  if(result?.outcome==='winB')return askedB>0?correctB/askedB:0;
  const ta=askedW+askedB;return ta>0?(correctW+correctB)/ta:0;
}
function maybeShowPrize(){
  if(prizeAccuracy()>=0.9){const p=$('#prize-popup');if(p){p.hidden=false;chime('victory')}}
}
function endSession(reason){
  if(phase!=='playing')return;
  clearTimeout(advanceTimer);
  if(mode==='pvp'&&reason==='timeout'){
    const wPts=materialPoints('w'),bPts=materialPoints('b');
    result={outcome:wPts===bPts?'draw':(wPts>bPts?'winW':'winB'),reason:'timeout'};
  }else result={outcome:'ended',reason};
  phase='result';
  saveScore();
  chime(result.outcome==='winW'||result.outcome==='win'?'victory':'wrong');
  render();
  maybeShowPrize();
}
function finishGame(go){
  clearTimeout(advanceTimer);
  let outcome;
  if(mode==='ai')outcome=go.type==='checkmate'?(go.winner==='w'?'win':'loss'):'draw';
  else outcome=go.type==='checkmate'?(go.winner==='w'?'winW':'winB'):'draw';
  result={outcome,reason:go.type==='draw'?go.reason:go.type};
  if(mode==='ai')scoreW+=outcome==='win'?300:outcome==='draw'?100:0;
  else{if(outcome==='winW')scoreW+=300;else if(outcome==='winB')scoreB+=300;else if(outcome==='draw'){scoreW+=100;scoreB+=100}}
  phase='result';
  saveScore();
  chime(outcome==='win'||outcome==='winW'||outcome==='winB'?'victory':outcome==='loss'?'wrong':'correct');
  render();
  maybeShowPrize();
}
function saveScore(){
  if(sessionSaved||mode!=='ai')return;
  let rows=rankings();
  rows.push({team,score:scoreW});
  rows.sort((a,b)=>b.score-a.score);
  try{localStorage.setItem('arabic-chess-ranks-8',JSON.stringify({day:day(),rows:rows.slice(0,5)}))}catch{}
  sessionSaved=true;
}

function onSquareClick(i){
  if(phase!=='playing'||aiThinking||quizQ)return;
  const turnColor=chess.turnColor;
  if(mode==='ai'&&turnColor!=='w')return;
  if(selected<0){
    const p=chess.board[i];
    if(p&&p.c===turnColor){selected=i;legalMoves=chess.generateLegalMoves(i);render()}
    return;
  }
  if(i===selected){selected=-1;legalMoves=[];render();return}
  const p=chess.board[i];
  if(p&&p.c===turnColor){selected=i;legalMoves=chess.generateLegalMoves(i);render();return}
  const mv=legalMoves.find(m=>m.to===i);
  if(!mv)return;
  attemptMove(mv);
}

function attemptMove(mv){
  selected=-1;legalMoves=[];
  if(mv.capture){
    pendingMove=mv;
    quizQ=pickQuestion();
    quizSelected=-1;quizRevealed=false;quizAnswered=false;quizTimedOut=false;quizAt=Date.now();
    chime('capture');
    render();
    clearTimeout(advanceTimer);
    advanceTimer=setTimeout(()=>quizAnswer(-1,false,true),QUIZ_TIME_MS+50);
  }else{
    applyPlayerMove(mv);
  }
}

function applyPlayerMove(mv){
  const rec=chess.move({from:mv.from,to:mv.to,promotion:'q'});
  if(!rec)return;
  chime(rec.captured?'capture':'move');
  afterMove(rec);
}

function afterMove(rec){
  if(rec.gameOver){finishGame(rec.gameOver);return}
  if(mode==='ai'&&chess.turnColor==='b'){
    aiThinking=true;render(rec);
    clearTimeout(advanceTimer);
    advanceTimer=setTimeout(doAIMove,550+Math.random()*500);
  }else{
    render(rec);
  }
}

function doAIMove(){
  if(phase!=='playing')return;
  aiThinking=false;
  const mv=ChessAI.chooseAIMove(chess,'b');
  if(!mv){render();return}
  const rec=chess.move({from:mv.from,to:mv.to,promotion:'q'});
  chime(rec.captured?'capture':'move');
  if(rec.gameOver){finishGame(rec.gameOver);return}
  render(rec);
}

function quizAnswer(i,show,timeout){
  if(phase!=='playing'||!pendingMove||quizAnswered)return;
  if(!show&&!timeout&&(i<0||i>=quizQ.options.length))return;
  clearTimeout(advanceTimer);
  quizAnswered=true;quizTimedOut=!!timeout||(!show&&Date.now()-quizAt>=QUIZ_TIME_MS);
  quizSelected=quizTimedOut?-1:i;quizRevealed=show;
  const actorColor=chess.turnColor;
  addAsked(actorColor);
  const q=quizQ;
  const isCorrect=!show&&!quizTimedOut&&i===q.correctAnswer;
  if(isCorrect){
    const earned=100+(Date.now()-quizAt<5000?50:0);
    addScore(actorColor,earned);addCorrect(actorColor);q.earned=earned;
    chime('correct');
    render();
    advanceTimer=setTimeout(()=>{const mv=pendingMove;pendingMove=null;quizQ=null;applyPlayerMove(mv)},1400);
  }else{
    chime('wrong');
    render();
    advanceTimer=setTimeout(()=>{
      pendingMove=null;quizQ=null;
      if(mode==='pvp'){
        const rec=chess.passTurn();
        if(rec.gameOver){finishGame(rec.gameOver);return}
      }
      render();
    },2200);
  }
}

function hostAction(action){
  if(!host)return;
  if(action==='clear'){if(confirm('Padam semua skor hari ini pada peranti ini?')){try{localStorage.removeItem('arabic-chess-ranks-8')}catch{}render()}return}
  if(action==='reset'){home();return}
  if(action==='end'){endSession('manual');return}
  if(action==='skip'&&pendingMove){quizAnswer(-1,false,true);return}
  if(action==='answer'&&pendingMove){quizAnswer(-1,true,false);return}
}

document.addEventListener('click',e=>{
  if(e.target.closest('.brand')&&phase==='playing'){e.preventDefault();return}
  let b=e.target.closest('button');if(!b)return;
  if(b.dataset.mode){mode=b.dataset.mode;render();return}
  if(b.dataset.player){team=$('#team')?.value||team;players=+b.dataset.player;render();return}
  if(b.id==='start'||b.id==='again'){start();return}
  if(b.id==='new'){home();return}
  if(b.id==='board-focus'){boardFocus=!boardFocus;render();$('#board-focus').focus({preventScroll:true});return}
  if(b.dataset.square!==undefined){onSquareClick(+b.dataset.square);return}
  if(b.dataset.answer!==undefined){quizAnswer(+b.dataset.answer,false,false);return}
  if(b.id==='host'){host=!host;$('#hostbar').hidden=!host;b.textContent=host?'Tutup host':'Mod host';b.setAttribute('aria-pressed',host);return}
  if(b.dataset.host){hostAction(b.dataset.host);return}
  if(b.id==='sound'){sound=!sound;b.textContent='Bunyi: '+(sound?'ON':'OFF');b.setAttribute('aria-pressed',sound);b.setAttribute('aria-label',sound?'Matikan bunyi':'Hidupkan bunyi');if(sound)chime('capture');return}
  if(b.id==='wake'){$('#attract').hidden=true;lastActivity=Date.now()}
  if(b.id==='prize-close'){$('#prize-popup').hidden=true}
});
document.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA'].includes(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
  if(quizQ&&!quizAnswered&&['a','b','c','d'].includes(e.key.toLowerCase())&&!(host&&e.key.toLowerCase()==='a')){e.preventDefault();quizAnswer('abcd'.indexOf(e.key.toLowerCase()),false,false);return}
  let key={s:'skip',r:'reset',a:'answer'}[e.key.toLowerCase()];
  if(key&&host){e.preventDefault();hostAction(key)}
});
['pointerdown','keydown','input'].forEach(ev=>document.addEventListener(ev,()=>{lastActivity=Date.now()}));
setInterval(()=>{
  if(phase==='playing'){
    remaining=Math.max(0,Math.ceil((sessionDeadline-Date.now())/1000));
    let t=$('#timer');
    if(t){t.textContent=clock();t.classList.toggle('urgent',remaining<=30)}
    if(quizQ&&!quizAnswered){
      const left=Math.max(0,QUIZ_TIME_MS-(Date.now()-quizAt));
      const seconds=Math.ceil(left/1000),qc=$('#quiz-clock'),bar=$('.quiz-progress');
      if(qc){qc.textContent=seconds+'s';qc.classList.toggle('urgent',seconds<=5)}
      if(bar){bar.setAttribute('aria-valuenow',seconds);bar.firstElementChild.style.transform=`scaleX(${left/QUIZ_TIME_MS})`;bar.classList.toggle('urgent',seconds<=5)}
      if(!left)quizAnswer(-1,false,true);
    }
    if(!remaining)endSession('timeout');
  }else if(phase==='home'&&Date.now()-lastActivity>=90000&&!host){
    $('#attract').hidden=false;
  }
},250);
render();
