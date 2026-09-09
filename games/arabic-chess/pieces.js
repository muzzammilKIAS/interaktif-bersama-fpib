// Original vector pieces: consistent silhouettes, sculpted shading, no font dependency.
const ChessPieces=(()=>{
  const shapes={
    p:'<circle cx="50" cy="27" r="11"/><path d="M41 40h18l-3 7c-2 8 0 15 8 23H36c8-8 10-15 8-23z"/><path d="M39 39h22v5H39z"/>',
    r:'<path d="M30 17h10v10h7V17h7v10h7V17h10v23l-9 7 2 22H36l2-22-8-7z"/><path d="M35 40h30v7H35z"/><path d="M38 54h24" fill="none"/>',
    n:'<path d="M31 70c1-15 9-23 23-31l-12 2-9 9-12-8 7-14 13-10 1-10 9 9c21 1 28 25 21 53z"/><path d="M49 24c13 9 13 21 8 32" fill="none"/><path d="m27 37 8 3M43 20l-4 8" fill="none"/><circle cx="42" cy="30" r="2.3" fill="var(--piece-ink)" stroke="none"/>',
    b:'<path d="M50 12C41 21 32 28 35 38c2 6 8 10 15 10s13-4 15-10c3-10-6-17-15-26z"/><path d="m54 24-9 13" fill="none" stroke-width="3.5"/><path d="M43 48h14c-3 9-1 15 8 22H35c9-7 11-13 8-22z"/><path d="M39 46h22v5H39z"/><circle cx="50" cy="11" r="4"/>',
    q:'<path d="m29 29 8 26h26l8-26-14 12-7-17-7 17z"/><path d="M39 53h22v6H39zM41 59h18c0 4 3 8 7 11H34c4-3 7-7 7-11z"/><circle cx="28" cy="26" r="5"/><circle cx="50" cy="21" r="5"/><circle cx="72" cy="26" r="5"/>',
    k:'<path class="crescent-crown" d="M57 7C40 3 34 23 47 30c4 2 8 1 11-1C45 29 43 12 57 7Z"/><path d="M47 30h6v5h-6z"/><path d="M50 35c-17-14-29 0-18 15l8 9h20l8-9c11-15-1-29-18-15z"/><path d="M40 56h20v6H40zM41 62h18l7 9H34z"/>'
  };
  let count=0;
  return {svg(type,color,extra=''){
    const id='pc'+(++count), white=color==='w';
    return `<svg class="chess-piece ${white?'ivory':'onyx'} ${extra}" viewBox="0 0 100 100" aria-hidden="true" focusable="false" style="--piece-ink:${white?'#79634a':'#d2c5a5'}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2=".2"><stop stop-color="${white?'#a18a66':'#080e10'}"/><stop offset=".28" stop-color="${white?'#fff9e6':'#59636a'}"/><stop offset=".48" stop-color="${white?'#eee0bf':'#2b353a'}"/><stop offset=".78" stop-color="${white?'#dbc499':'#11191e'}"/><stop offset="1" stop-color="${white?'#9b8059':'#060b0d'}"/></linearGradient></defs><ellipse cx="51" cy="87" rx="31" ry="6" fill="#04130e" opacity=".24"/><g fill="url(#${id})" stroke="${white?'#796446':'#060d0f'}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">${shapes[type]||shapes.p}<path d="M34 69h32l3 6H31z"/><path d="M30 75h40l5 8c1 3-49 3-50 0z"/><path d="M32 77h36" stroke="${white?'#fff7e2':'#8c9696'}" opacity=".7"/><path d="M29 84h42" stroke-width="2.5"/></g></svg>`;
  }};
})();
