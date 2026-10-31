// Erich Mendelsohn's 1926–28 power station, restored 2019. Commons 2020
// photographs establish the cream tank head / brick base; old chimney removed.
import { building, ringFromFlat, polyOf, ringEdges, onEdge, band, wall, window, addPolyColliders, addSite, photo } from './kit.js';
const ux=.78286,uz=.6222,ox=-3920,oz=-3232;
const local=p=>[(p[0]-ox)*ux+(p[1]-oz)*uz,-(p[0]-ox)*uz+(p[1]-oz)*ux];
const world=p=>[ox+p[0]*ux-p[1]*uz,oz+p[0]*uz+p[1]*ux];
function clip(r,x,less){const out=[];for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length],ina=less?a[0]<=x:a[0]>=x,inb=less?b[0]<=x:b[0]>=x;if(ina)out.push(a);if(ina!==inb){const t=(x-a[0])/(b[0]-a[0]);out.push([x,a[1]+t*(b[1]-a[1])]);}}return out;}
function mass(K,r,h,mat,y0=0,neighbours={}){const poly=polyOf(r);for(const e of ringEdges(poly)){let low=y0;for(const [x,top] of Object.entries(neighbours))if(Math.abs(e.a[0]-Number(x))<.01&&Math.abs(e.b[0]-Number(x))<.01)low=Math.max(low,top);if(low<h)onEdge(K.P,e,()=>wall(K.P,mat,e.len,low,h));}K.P.cap(K.M.roof,r,h);return poly;}
export function build(K){
  const b=building('w128678093'),P=K.P,M=K.M,r=ringFromFlat(b.polys[0].o).map(local);
  // All segments are clipped from the surveyed OSM outline, so the stepped
  // masses meet exactly; the upper water-tank head follows the rounded nose.
  const head=clip(r,21,true),hall=clip(clip(r,21,false),64,true),tail=clip(r,64,false);
  P.push(ox,0,oz,Math.atan2(-uz,ux));
  const hp=mass(K,head,8.9,M.brick,0,{21:18.1}),bp=mass(K,hall,18.1,M.cream,0,{21:27.6,64:9.5}),tp=mass(K,tail,9.5,M.brick,0,{64:18.1});
  mass(K,head,27.6,M.cream,8.9,{21:18.1});
  for(const e of ringEdges(hp)){
    const cut=Math.abs(e.a[0]-21)<.01&&Math.abs(e.b[0]-21)<.01;if(cut)continue;
    onEdge(P,e,()=>{if(e.len>3.5){const n=Math.max(1,Math.floor(e.len/4.2));for(let i=0;i<n;i++){window(K,(i+.5)*e.len/n,1.2,Math.min(3.1,e.len/n-.35),1.2,{gridX:3,gridY:1});window(K,(i+.5)*e.len/n,6.1,Math.min(3.3,e.len/n-.35),1.45,{gridX:3,gridY:2});}}
      if(e.len>12){for(let j=0;j<4;j++)window(K,e.len*.68,13.5+j*3.05,3.6,1.03,{gridX:3,gridY:1});}
    });
  }
  for(const y of [12.2,15.3,18.4,21.5,24.6,27.5])band(P,ringEdges(hp),y-.09,y+.05,.20,{front:M.trim,top:M.trim});
  band(P,ringEdges(hp),8.75,9.05,.38,{front:M.trim,top:M.roof});
  for(const e of ringEdges(bp))if(e.len>30)onEdge(P,e,()=>{
    const n=Math.floor(e.len/6.4);for(let i=0;i<=n;i++){const x=i*e.len/n;P.box(M.trim,x-.18,x+.18,9.6,18.75,-.05,.33,'k');}
    for(let i=0;i<n;i++)window(K,(i+.5)*e.len/n,10.4,e.len/n-1.2,6.7,{gridX:2,gridY:6,frame:M.iron});
    P.box(M.brickDark,0,e.len,0,9.5,-.03,.045,'k');for(let i=0;i<n;i++)window(K,(i+.5)*e.len/n,1.35,3.2,1.4,{gridX:3,gridY:1});
  });
  for(const e of ringEdges(tp))if(e.len>9)onEdge(P,e,()=>{const n=Math.floor(e.len/4.7);for(let i=0;i<n;i++){window(K,(i+.5)*e.len/n,1.25,3.5,1.4,{gridX:3,gridY:1});window(K,(i+.5)*e.len/n,6.2,3.5,1.5,{gridX:3,gridY:2});}});
  // Roof railings are short static bars; no city-wide update or instance bucket.
  for(const poly of [hp,bp])for(const e of ringEdges(poly))onEdge(P,e,()=>{const y=poly===hp?27.8:18.3;P.box(M.iron,0,e.len,y+.7,y+.75,-.1,-.055);for(let x=.4;x<e.len;x+=2.6)P.box(M.iron,x-.025,x+.025,y,y+.7,-.1,-.05);});
  P.pop();addPolyColliders(K.ctx,b.polys[0],0,27.6,.2);
  addSite(K,b.id,'Силовая станция фабрики «Красное знамя»',27.6);
  const nose=world([-13,0]);photo(K,-3946,-3269,nose[0],nose[1],'Силовая станция Мендельсона',18);
  K.svc.parts.power={id:b.id,height:27.6,chimney:'removed before 2020 reference'};
}
