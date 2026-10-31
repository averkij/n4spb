// Pechatny Dvor: Benois' brick factory/courts, 1908–10, and later Chkalovsky
// front. The 2025 Commons close-up gives salmon piers and giant 3x4 windows.
import { building, shell, onEdge, ringEdges, band, window, sign, addSite, photo } from './kit.js';
import { clearForecourtLamp } from './forecourt.js';
export function build(K){
  const {P,M}=K,b=building('r409303');
  shell(K,b,14.8,M.brick,{windows:false,painter:e=>{
    if(e.len<3.4)return;const n=Math.max(1,Math.floor(e.len/4.3));
    for(let i=0;i<n;i++){const x=(i+.5)*e.len/n;for(let j=0;j<3;j++){const y=1.25+j*4.2;window(K,x,y,Math.min(2.4,e.len/n*.69),3.1,{gridX:2,gridY:3,frame:M.concrete});P.box(M.brickDark,x-1.4,x+1.4,y+3.15,y+3.43,-.01,.17,'k');}P.box(M.brickDark,x-.18,x+.18,14.2,15.3,-.08,.22,'k');}
  }});
  for(const poly of b.polys)for(const y of [4.75,8.95,13.15])band(P,ringEdges(poly),y,y+.18,.1,{front:M.brickDark,top:M.brick});
  const front=building('w50340682');
  const movedLamps=clearForecourtLamp(K.ctx,front);
  shell(K,front,21.6,M.concrete,{windows:false,painter:e=>{
    if(e.len<3.5)return;const n=Math.max(1,Math.floor(e.len/6.1)),step=e.len/n;
    for(let i=0;i<n;i++){const x=(i+.5)*step;for(let j=0;j<5;j++)window(K,x,1.05+j*4.08,Math.min(4.0,step-1.4),3.05,{gridX:3,gridY:4});}
    for(let i=0;i<=n;i++){const x=i*step;P.box(M.red,x-.52,x+.52,.7,21.35,-.035,.055,'k');}
    if(e.len>50&&e.n[1]>.4)sign(K,front,e,'ПЕЧАТНЫЙ ДВОР',e.len*.5,8.68,19.4,.9,{font:K.ctx.tex.FONTS.sans,bg:'#b5b6af',fg:'#354754'});
  }});
  for(const poly of front.polys)for(const y of [4.44,8.52,12.6,16.68,20.76])band(P,ringEdges(poly),y,y+.14,.12,{front:M.trim,top:M.trim});
  addSite(K,b.id,'Печатный двор: историческая типография',14.8);addSite(K,front.id,'Печатный двор: Чкаловский фасад',21.6);
  photo(K,-3193,-3291,front.cx,front.cz,'Печатный двор с Чкаловского проспекта',16);
  K.svc.parts.printworks={ids:[b.id,front.id],courts:b.polys[0].h.length,movedLamps};
}
