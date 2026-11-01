import * as THREE from 'three';
import { band, frameOf } from '../landmarksD/kit.js';
import { dome, cross } from '../landmarksD/parts.js';
import { roadClear } from './common.js';

export function church(K,recs){
  if(!recs.length)return;
  const rec=recs.find(b=>!b.part)||recs[0],{mats:M,ctx,svc}=K,cx=rec.cx,cz=rec.cz;
  const edges=K.shell(rec,11.2,M.pink);
  for(const [y,d] of [[.65,.13],[1.1,.14],[10.5,.16],[11.2,.24]])band(K.body,edges,y,y+.19,d,{front:M.trim,top:M.trim,under:M.shade});
  K.use(true);
  const front=edges.filter(e=>e.n[0]<-.65).sort((a,b)=>b.len-a.len)[0];
  for(const e of edges)K.frame(e,len=>{
    const P=K.P,n=Math.max(1,Math.round(len/.7));
    for(let i=0;i<n;i++){
      const u=(i+.5)*len/n;
      P.box(M.trim,u-.07,u+.07,1.24,10.4,.05,.16);
      // The repeated pointed white frieze is the recognizable lacework crown.
      P.cyl(M.trim,[u-.27,10.52,.2],[u,11.12,.2],.065,.065,5);
      P.cyl(M.trim,[u,11.12,.2],[u+.27,10.52,.2],.065,.065,5);
      if(i%2===0)P.col(M.trim,u,.2,11.15,11.58,.045,.015,5);
    }
    if((Math.abs(e.n[0])>.97||Math.abs(e.n[1])>.97)&&!(e.n[0]<-.9&&e.a[0]<cx-10)&&len>1.85){
      const count=Math.max(1,Math.floor(len/4.3));for(let i=0;i<count;i++)K.window((i+.5)*len/count,1.45,1.45,6.8,{pointed:true});
    }
  });
  const west=Math.min(...rec.polys.flatMap(p=>p.o.filter((_,i)=>i%2===0)));
  K.detail.push(west,0,cz,-Math.PI/2);
  K.window(0,1,2.1,4.1,{pointed:true});K.detail.box(M.dark,-.8,.8,1.1,3.1,.20,.23);
  K.window(0,7.0,2.15,2.15,{round:true});
  const ped=new THREE.Shape();ped.moveTo(-1.9,4.7);ped.lineTo(1.9,4.7);ped.lineTo(0,6);ped.closePath();K.detail.extrude(M.trim,ped,.14,.18,1,2);
  K.detail.pop();
  // Five silver lantern domes: four around the central bell lantern. Their
  // narrow crown pinnacles are kept with the body silhouette at distance.
  const towers=[[0,0,15.2,2.0],[4.6,4.6,11.2,1.18],[-4.6,4.6,11.2,1.18],[4.6,-4.6,11.2,1.18],[-4.6,-4.6,11.2,1.18]];
  for(const [dx,dz,y,r] of towers){
    K.body.push(cx+dx,0,cz+dz);K.detail.push(cx+dx,0,cz+dz);
    if(dx===0&&dz===0)K.body.col(M.pink,0,0,11.2,y,2.7,2.0,12);
    K.body.col(M.pink,0,0,y,y+3.0,r,r,8);K.body.col(M.trim,0,0,y+2.95,y+3.2,r*1.1,r*1.1,8);
    K.use(true);
    for(let s=0;s<4;s++){
      K.P.push(0,0,0,s*Math.PI/2);K.P.push(0,0,r*.94);K.window(0,y+.5,r*.85,1.9,{pointed:true});K.P.pop();K.P.pop();
    }
    K.use(false);dome(K,M.roof,0,y+3.2,0,r*1.13,1.0);
    const peak=y+3.2+1.18*r*1.13;
    K.body.col(M.roof,0,0,peak-.1,peak+2.0,.19,.035,8);cross(K,M.trim,0,peak+2,0,1.15);
    for(let i=0;i<8;i++){const a=i*Math.PI/4,u=Math.sin(a)*r*1.12,v=Math.cos(a)*r*1.12;K.body.col(M.roof,u,v,y+3.15,y+5.0,.13,.018,6);}
    K.body.pop();K.detail.pop();
  }
  svc.monuments.push({id:rec.id,name:'Чесменская церковь',x:cx,z:cz,h:25.7});
  const f=front&&frameOf(front);if(f)svc.photoSpots.push({name:'Чесменская церковь',x:cx-24,z:cz+8,yaw:-70});
}

export function palace(K,recs){
  if(!recs.length)return;
  const {mats:M,svc,ctx}=K;
  for(const rec of recs.filter(b=>!b.dupOf&&!b.underground)){
    const tower=['w231099702','w231099703','w231099704'].includes(rec.id),hall=rec.id==='w231099729',main=rec.id==='r3100474';
    const h=tower?12.4:hall?10.5:main?8.8:rec.h||13.2;
    const min=tower||hall?8.8:rec.minH||0;
    const edges=K.shell({...rec,minH:min},h,M.palace);K.cornice(edges,h);
    K.use(true);
    for(const e of edges)K.frame(e,len=>{
      const n=Math.floor(len/3.45);for(let i=0;i<n;i++)for(const y of [1.3,5.0,9.1])if(y>=min&&y+2.0<h)K.window((i+.5)*len/n,y,1.25,2.35,{pointed:y===5.0});
      if(main)for(let y=.9;y<3.6;y+=.42)K.P.box(M.shade,0,len,y,y+.018,.025,.034);
      if(!tower)for(let i=0;i<Math.floor(len/1.65);i++){const u=(i+.5)*1.65;K.P.box(M.trim,u-.23,u+.23,h+.3,h+.62,-.05,.18);}
    });
    if(tower){
      const radius=2.68;
      K.detail.push(rec.cx,0,rec.cz);
      for(let i=0;i<6;i++){K.detail.push(0,0,0,i*Math.PI/3);K.detail.push(0,0,radius*.96);K.window(0,9.35,1.15,2.45,{pointed:true});K.detail.pop();K.detail.pop();}K.detail.pop();
      K.use(false);dome(K,M.roof,rec.cx,h+.32,rec.cz,radius*1.03,.58);
    }
    svc.houses.push({id:rec.id,name:'Чесменский дворец',x:rec.cx,z:rec.cz,h});
  }
  const r=recs.find(b=>!b.part)||recs[0];
  svc.photoSpots.push({name:'Чесменский дворец',x:r.cx-48,z:r.cz+15,yaw:-70});
}
