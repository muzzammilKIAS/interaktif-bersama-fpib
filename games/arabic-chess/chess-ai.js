// Beginner-strength opponent: mostly random legal moves with a loose bias
// toward captures. Deliberately weak (no real search) so newcomers can win.
(function(root){
'use strict';
const VALUE={p:1,n:3,b:3,r:5,q:9,k:0};

function chooseAIMove(chess,color){
  const moves=chess.allLegalMoves(color);
  if(!moves.length)return null;
  const captures=moves.filter(m=>m.capture);
  if(captures.length&&Math.random()<0.55){
    let best=captures[0],bestVal=-1;
    for(const m of captures){
      const capturedPiece=m.ep?{t:'p'}:chess.board[m.to];
      const v=capturedPiece?VALUE[capturedPiece.t]:0;
      if(v>bestVal||(v===bestVal&&Math.random()<0.5)){bestVal=v;best=m;}
    }
    return best;
  }
  return moves[Math.floor(Math.random()*moves.length)];
}

const api={chooseAIMove};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.ChessAI=api;
})(typeof window!=='undefined'?window:globalThis);
