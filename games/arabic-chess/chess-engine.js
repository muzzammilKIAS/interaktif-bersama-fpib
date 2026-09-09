// Minimal but complete chess rules engine: legal moves, check, checkmate,
// stalemate, castling, en passant, promotion, 50-move & insufficient-material draws.
// Board: 64-length array, index = row*8+col, row 0 = rank 8 (top) .. row 7 = rank 1 (bottom), col 0 = file a .. col 7 = file h.
(function(root){
'use strict';

const FILES='abcdefgh';
const sq=(row,col)=>row*8+col;
const rowOf=i=>Math.floor(i/8);
const colOf=i=>i%8;
const inB=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const algebraic=i=>FILES[colOf(i)]+(8-rowOf(i));

const KNIGHT_OFF=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
const KING_OFF=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const BISHOP_DIR=[[-1,-1],[-1,1],[1,-1],[1,1]];
const ROOK_DIR=[[-1,0],[1,0],[0,-1],[0,1]];

function initialBoard(){
  const b=new Array(64).fill(null);
  const back=['r','n','b','q','k','b','n','r'];
  for(let c=0;c<8;c++){
    b[sq(0,c)]={t:back[c],c:'b'};
    b[sq(1,c)]={t:'p',c:'b'};
    b[sq(6,c)]={t:'p',c:'w'};
    b[sq(7,c)]={t:back[c],c:'w'};
  }
  return b;
}

class Chess{
  constructor(){this.reset();}
  reset(){
    this.board=initialBoard();
    this.turnColor='w';
    this.castling={wK:true,wQ:true,bK:true,bQ:true};
    this.epTarget=null;
    this.halfmove=0;
    this.fullmove=1;
    this.history=[];
    this.lastGameOver=null;
  }
  clone(){
    const c=Object.create(Chess.prototype);
    c.board=this.board.map(p=>p?{t:p.t,c:p.c}:null);
    c.turnColor=this.turnColor;
    c.castling={...this.castling};
    c.epTarget=this.epTarget;
    c.halfmove=this.halfmove;
    c.fullmove=this.fullmove;
    c.history=[];
    c.lastGameOver=this.lastGameOver;
    return c;
  }
  kingSquare(color,board=this.board){
    for(let i=0;i<64;i++){const p=board[i];if(p&&p.t==='k'&&p.c===color)return i;}
    return -1;
  }
  isSquareAttacked(square,byColor,board=this.board){
    const r=rowOf(square),c=colOf(square);
    // pawns
    if(byColor==='w'){
      if(inB(r+1,c-1)){const p=board[sq(r+1,c-1)];if(p&&p.c==='w'&&p.t==='p')return true;}
      if(inB(r+1,c+1)){const p=board[sq(r+1,c+1)];if(p&&p.c==='w'&&p.t==='p')return true;}
    }else{
      if(inB(r-1,c-1)){const p=board[sq(r-1,c-1)];if(p&&p.c==='b'&&p.t==='p')return true;}
      if(inB(r-1,c+1)){const p=board[sq(r-1,c+1)];if(p&&p.c==='b'&&p.t==='p')return true;}
    }
    // knights
    for(const[dr,dc]of KNIGHT_OFF){const nr=r+dr,nc=c+dc;if(inB(nr,nc)){const p=board[sq(nr,nc)];if(p&&p.c===byColor&&p.t==='n')return true;}}
    // king
    for(const[dr,dc]of KING_OFF){const nr=r+dr,nc=c+dc;if(inB(nr,nc)){const p=board[sq(nr,nc)];if(p&&p.c===byColor&&p.t==='k')return true;}}
    // sliding: bishop/queen diagonals
    for(const[dr,dc]of BISHOP_DIR){
      let nr=r+dr,nc=c+dc;
      while(inB(nr,nc)){
        const p=board[sq(nr,nc)];
        if(p){if(p.c===byColor&&(p.t==='b'||p.t==='q'))return true;break;}
        nr+=dr;nc+=dc;
      }
    }
    // sliding: rook/queen orthogonals
    for(const[dr,dc]of ROOK_DIR){
      let nr=r+dr,nc=c+dc;
      while(inB(nr,nc)){
        const p=board[sq(nr,nc)];
        if(p){if(p.c===byColor&&(p.t==='r'||p.t==='q'))return true;break;}
        nr+=dr;nc+=dc;
      }
    }
    return false;
  }
  inCheck(color=this.turnColor,board=this.board){
    const k=this.kingSquare(color,board);
    if(k<0)return false;
    return this.isSquareAttacked(k,color==='w'?'b':'w',board);
  }
  generatePseudoMoves(from,board=this.board){
    const piece=board[from];
    if(!piece)return [];
    const r=rowOf(from),c=colOf(from);
    const moves=[];
    const push=(to,extra)=>moves.push(Object.assign({from,to,capture:!!board[to]},extra));
    if(piece.t==='p'){
      const dir=piece.c==='w'?-1:1;
      const startRow=piece.c==='w'?6:1;
      const promoRow=piece.c==='w'?0:7;
      const oneR=r+dir;
      if(inB(oneR,c)&&!board[sq(oneR,c)]){
        push(sq(oneR,c),{promotion:oneR===promoRow});
        const twoR=r+dir*2;
        if(r===startRow&&!board[sq(twoR,c)])push(sq(twoR,c),{double:true});
      }
      for(const dc of[-1,1]){
        const nr=r+dir,nc=c+dc;
        if(!inB(nr,nc))continue;
        const target=sq(nr,nc);
        const tp=board[target];
        if(tp&&tp.c!==piece.c)push(target,{capture:true,promotion:nr===promoRow});
        else if(!tp&&this.epTarget===target)push(target,{capture:true,ep:true});
      }
    }else if(piece.t==='n'){
      for(const[dr,dc]of KNIGHT_OFF){
        const nr=r+dr,nc=c+dc;
        if(!inB(nr,nc))continue;
        const target=sq(nr,nc),tp=board[target];
        if(!tp||tp.c!==piece.c)push(target,{});
      }
    }else if(piece.t==='k'){
      for(const[dr,dc]of KING_OFF){
        const nr=r+dr,nc=c+dc;
        if(!inB(nr,nc))continue;
        const target=sq(nr,nc),tp=board[target];
        if(!tp||tp.c!==piece.c)push(target,{});
      }
      moves.push(...this.castlingMoves(from,board));
    }else{
      const dirs=piece.t==='b'?BISHOP_DIR:piece.t==='r'?ROOK_DIR:BISHOP_DIR.concat(ROOK_DIR);
      for(const[dr,dc]of dirs){
        let nr=r+dr,nc=c+dc;
        while(inB(nr,nc)){
          const target=sq(nr,nc),tp=board[target];
          if(!tp){push(target,{});}
          else{if(tp.c!==piece.c)push(target,{capture:true});break;}
          nr+=dr;nc+=dc;
        }
      }
    }
    return moves;
  }
  castlingMoves(kingSq,board){
    const piece=board[kingSq];
    if(!piece||piece.t!=='k')return [];
    const color=piece.c;
    const row=color==='w'?7:0;
    if(kingSq!==sq(row,4))return [];
    const opp=color==='w'?'b':'w';
    const out=[];
    const rightK=color==='w'?'wK':'bK', rightQ=color==='w'?'wQ':'bQ';
    if(this.castling[rightK]&&!board[sq(row,5)]&&!board[sq(row,6)]&&board[sq(row,7)]&&board[sq(row,7)].t==='r'&&board[sq(row,7)].c===color){
      if(!this.isSquareAttacked(sq(row,4),opp,board)&&!this.isSquareAttacked(sq(row,5),opp,board)&&!this.isSquareAttacked(sq(row,6),opp,board)){
        out.push({from:kingSq,to:sq(row,6),capture:false,castle:'K'});
      }
    }
    if(this.castling[rightQ]&&!board[sq(row,1)]&&!board[sq(row,2)]&&!board[sq(row,3)]&&board[sq(row,0)]&&board[sq(row,0)].t==='r'&&board[sq(row,0)].c===color){
      if(!this.isSquareAttacked(sq(row,4),opp,board)&&!this.isSquareAttacked(sq(row,3),opp,board)&&!this.isSquareAttacked(sq(row,2),opp,board)){
        out.push({from:kingSq,to:sq(row,2),capture:false,castle:'Q'});
      }
    }
    return out;
  }
  simulateBoard(move,board=this.board){
    const b=board.map(p=>p?{t:p.t,c:p.c}:null);
    const piece=b[move.from];
    if(move.ep){
      const capRow=rowOf(move.from), capCol=colOf(move.to);
      b[sq(capRow,capCol)]=null;
    }
    b[move.to]=piece;
    b[move.from]=null;
    if(move.castle){
      const row=rowOf(move.from);
      if(move.castle==='K'){b[sq(row,5)]=b[sq(row,7)];b[sq(row,7)]=null;}
      else{b[sq(row,3)]=b[sq(row,0)];b[sq(row,0)]=null;}
    }
    return b;
  }
  generateLegalMoves(from,board=this.board){
    const piece=board[from];
    if(!piece)return [];
    const pseudo=this.generatePseudoMoves(from,board);
    const legal=[];
    for(const m of pseudo){
      if(m.castle){legal.push(m);continue;} // castling already fully validated
      const b=this.simulateBoard(m,board);
      if(!this.inCheck(piece.c,b))legal.push(m);
    }
    return legal;
  }
  allLegalMoves(color=this.turnColor,board=this.board){
    const out=[];
    for(let i=0;i<64;i++){
      const p=board[i];
      if(p&&p.c===color)out.push(...this.generateLegalMoves(i,board));
    }
    return out;
  }
  hasInsufficientMaterial(){
    const minor=[];
    let heavyOrPawn=false;
    for(const p of this.board){
      if(!p||p.t==='k')continue;
      if(p.t==='p'||p.t==='r'||p.t==='q'){heavyOrPawn=true;break;}
      minor.push(p);
    }
    if(heavyOrPawn)return false;
    return minor.length<=1;
  }
  move({from,to,promotion}){
    const legal=this.generateLegalMoves(from);
    const found=legal.find(m=>m.to===to);
    if(!found)return null;
    const piece=this.board[from];
    const captured=found.ep?this.board[sq(rowOf(from),colOf(to))]:this.board[to];
    if(found.ep){
      this.board[sq(rowOf(from),colOf(to))]=null;
    }
    this.board[to]=piece;
    this.board[from]=null;
    if(found.castle){
      const row=rowOf(from);
      if(found.castle==='K'){this.board[sq(row,5)]=this.board[sq(row,7)];this.board[sq(row,7)]=null;}
      else{this.board[sq(row,3)]=this.board[sq(row,0)];this.board[sq(row,0)]=null;}
    }
    let promoted=null;
    if(found.promotion){
      promoted=(promotion&&['q','r','b','n'].includes(promotion))?promotion:'q';
      this.board[to]={t:promoted,c:piece.c};
    }
    // castling rights updates
    if(piece.t==='k'){
      if(piece.c==='w'){this.castling.wK=false;this.castling.wQ=false;}
      else{this.castling.bK=false;this.castling.bQ=false;}
    }
    if(piece.t==='r'){
      if(from===sq(7,7))this.castling.wK=false;
      if(from===sq(7,0))this.castling.wQ=false;
      if(from===sq(0,7))this.castling.bK=false;
      if(from===sq(0,0))this.castling.bQ=false;
    }
    if(captured&&captured.t==='r'){
      if(to===sq(7,7))this.castling.wK=false;
      if(to===sq(7,0))this.castling.wQ=false;
      if(to===sq(0,7))this.castling.bK=false;
      if(to===sq(0,0))this.castling.bQ=false;
    }
    // en passant target
    this.epTarget=found.double?sq((rowOf(from)+rowOf(to))/2,colOf(from)):null;
    // halfmove clock
    if(piece.t==='p'||captured)this.halfmove=0;else this.halfmove++;
    const movedColor=this.turnColor;
    if(movedColor==='b')this.fullmove++;
    this.turnColor=movedColor==='w'?'b':'w';
    const check=this.inCheck(this.turnColor);
    const noMoves=this.allLegalMoves(this.turnColor).length===0;
    let gameOver=null;
    if(noMoves)gameOver=check?{type:'checkmate',winner:movedColor}:{type:'stalemate',winner:null};
    else if(this.halfmove>=100)gameOver={type:'draw',reason:'50-move',winner:null};
    else if(this.hasInsufficientMaterial())gameOver={type:'draw',reason:'material',winner:null};
    this.lastGameOver=gameOver;
    const record={from,to,piece,captured,promotion:promoted,castle:found.castle||null,ep:!!found.ep,check,gameOver};
    this.history.push(record);
    return record;
  }
  // House rule for quiz-gated variants: forfeits the current side's turn without moving
  // a piece (e.g. a failed capture-quiz in 2-player mode). Not a standard chess action.
  passTurn(){
    const movedColor=this.turnColor;
    this.epTarget=null;
    this.halfmove++;
    if(movedColor==='b')this.fullmove++;
    this.turnColor=movedColor==='w'?'b':'w';
    const check=this.inCheck(this.turnColor);
    const noMoves=this.allLegalMoves(this.turnColor).length===0;
    let gameOver=null;
    if(noMoves)gameOver=check?{type:'checkmate',winner:movedColor}:{type:'stalemate',winner:null};
    else if(this.halfmove>=100)gameOver={type:'draw',reason:'50-move',winner:null};
    else if(this.hasInsufficientMaterial())gameOver={type:'draw',reason:'material',winner:null};
    this.lastGameOver=gameOver;
    const record={from:-1,to:-1,piece:null,captured:null,promotion:null,castle:null,ep:false,check,gameOver,passed:true,passedColor:movedColor};
    this.history.push(record);
    return record;
  }
}

const api={Chess,algebraic,sq,rowOf,colOf};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.ChessEngine=api;
})(typeof window!=='undefined'?window:globalThis);
