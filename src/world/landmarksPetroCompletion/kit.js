// Static geometry vocabulary for the three completion sites. Reuses the corrected
// 2026-10-10 Parts winding/mitred-band helper rather than an older copied collector.
import * as THREE from 'three';
import * as L from '../layout.js';
import { Parts, ringEdges, onEdge, frameOf, band, rectPath, archPath } from '../landmarksKarpovka/kit.js';
import { BUILDINGS } from '../data/city.js';
import { ringFromFlat, addPolyColliders } from '../lib/massing.js';
import { makeLabels } from '../streets/labels.js';
export { THREE, L, Parts, ringEdges, onEdge, frameOf, band, ringFromFlat, addPolyColliders };
export const building = id => BUILDINGS.find(b => b.id === id);
export const polyOf = r => ({o:r.flat(),h:[]});

export function materials(ctx) {
  const T = ctx.mat.toon;
  const brick = ctx.tex.draw(256,128,(g,w,h) => {
    g.fillStyle='#ffffff';g.fillRect(0,0,w,h);g.fillStyle='#cbb6a4';
    for(let j=0;j<8;j++){g.fillRect(0,j*16,w,1.5);for(let i=0;i<8;i++)g.fillRect(i*32+(j%2)*16,j*16,1.5,16);}
  },{key:'petro-completion-brick',repeat:[1,1]});
  return { cream:T('#e4dfcc'), pink:T('#b89789'), pinkShade:T('#977768'), trim:T('#ddd9cb'), brick:T('#a06348',{map:brick}), brickDark:T('#88513e',{map:brick}), red:T('#b7634b'), concrete:T('#b5ada0'), roof:T('#717d79'), green:T('#52766b'), iron:T('#293034'), glass:T('#607a81'), glassShade:T('#354954'), frame:T('#c2c5b7'), plinth:T('#777771') };
}
export function wall(P,mat,len,y0,y1,z=0) {P.quad(mat,[0,y0,z],[len,y0,z],[len,y1,z],[0,y1,z],[0,0,1],[[0,y0/2],[len/2,y0/2],[len/2,y1/2],[0,y1/2]]);}
export function shell(K,b,h,mat,{windows=true,bay=3.5,floors=3,painter=null}={}) {
  for(const poly of b.polys){
    const edges=ringEdges(poly);
    for(const e of edges)onEdge(K.P,e,()=>{wall(K.P,mat,e.len,0,h);if(windows&&e.len>2.5){const n=Math.max(1,Math.floor(e.len/bay));for(let i=0;i<n;i++)for(let j=0;j<floors;j++)window(K,(i+.5)*e.len/n,1.4+j*(h-2)/floors,Math.min(1.6,e.len/n*.62),Math.min(2.6,(h-2)/floors*.7));}painter?.(e);});
    K.P.cap(K.M.roof,ringFromFlat(poly.o),h,true,4,(poly.h||[]).map(ringFromFlat));
    band(K.P,edges,.1,.6,.06,{front:K.M.plinth,top:K.M.plinth});
    band(K.P,edges,h-.3,h+.12,.22,{front:K.M.trim,top:K.M.roof,under:K.M.trim});
    addPolyColliders(K.ctx,poly,0,h,.22);
  }
}
export function window(K,x,y,w,h,{gridX=2,gridY=2,frame=K.M.frame}={}) {
  const P=K.P;P.box(K.M.glass,x-w/2,x+w/2,y,y+h,.026,.05,'k');
  const f=.065;
  P.box(frame,x-w/2-f,x+w/2+f,y-f,y,.02,.105,'k');P.box(frame,x-w/2-f,x+w/2+f,y+h,y+h+f,.02,.105,'k');
  for(let i=0;i<=gridX;i++){const a=x-w/2+i*w/gridX;P.box(frame,a-f/2,a+f/2,y,y+h,.045,.11,'k');}
  for(let j=1;j<gridY;j++){const a=y+j*h/gridY;P.box(frame,x-w/2,x+w/2,a-f/2,a+f/2,.045,.11,'k');}
}
export function archWall(P,mat,len,h,cx,w,yStraight) {
  const r=w/2,shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(cx-r,0);shape.lineTo(cx-r,yStraight);shape.absarc(cx,yStraight,r,Math.PI,0,true);shape.lineTo(cx+r,0);shape.lineTo(len,0);shape.lineTo(len,h);shape.lineTo(0,h);shape.closePath();P.face(mat,shape,0,2,16);
}
export function sign(K,b,e,text,x,y,w,h,o={}) {
  const f=frameOf(e),wx=f.x+x*f.xa[0]+e.n[0]*.39,wz=f.z+x*f.xa[1]+e.n[1]*.39;
  const labels=K.ctx.services.labels ||= makeLabels();
  if(!labels.reserve(b.id,wx,y,wz,w,h,...e.n,'landmark'))return;
  const map=K.ctx.tex.draw(1024,128,(g,tw,th)=>{g.fillStyle=o.bg||'#b9b09d';g.fillRect(0,0,tw,th);g.fillStyle=o.fg||'#303c40';g.textAlign='center';g.textBaseline='middle';K.ctx.tex.fitText(g,text,tw/2,th/2,tw*.94,th*.74,o.font||K.ctx.tex.FONTS.serif,600);},{key:'petro-completion-sign-'+text});
  const mat=K.ctx.mat.toon('#ffffff',{map});K.P.box(K.M.concrete,x-w/2-.08,x+w/2+.08,y-h/2-.08,y+h/2+.08,.3,.35,'k');
  K.P.quad(mat,[x-w/2,y-h/2,.39],[x+w/2,y-h/2,.39],[x+w/2,y+h/2,.39],[x-w/2,y+h/2,.39],[0,0,1]);
}
export function addSite(K,id,name,h) {const b=building(id);K.svc.monuments.push({id,name,x:b.cx,z:b.cz,h});K.svc.houses.push({id,x:b.cx,z:b.cz,h,name});}
export function photo(K,x,z,tx,tz,name,pitch=12){
  if(L.insideBuilding(x,z,.4)||L.isOnRoad(x,z,.25)||L.inRiver(x,z))return;
  K.svc.photoSpots.push({x,z,yaw:L.yawToward(x,z,tx,tz),pitch,name});
}
