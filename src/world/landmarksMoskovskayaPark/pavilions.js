// Pond-side 1952 chess pavilion and the 1995 Memory portico, based on mapped
// footprints and inspected operator/National Library photos (research dossier).
import * as THREE from 'three';
import * as CITY from '../data/city.js';
import { polyBounds, addPolyColliders } from '../lib/massing.js';
import { safeSpot } from './kit.js';

function hipRoof(P, M, w, d, y, rise, far = 1100) {
  const key = `hip-${w}-${d}-${y}-${rise}`;
  const geo = P.geometry(key, () => {
    const p = [[-w/2,y,-d/2],[w/2,y,-d/2],[w/2,y,d/2],[-w/2,y,d/2],[-w/2+d/2,y+rise,0],[w/2-d/2,y+rise,0]];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p.flat(), 3));
    g.setIndex([0,4,5,0,5,1,1,5,2,2,5,4,2,4,3,3,4,0,0,1,2,0,2,3]); g.computeVertexNormals(); return g;
  });
  P.shape(key, geo, M.roof, 0,0,0,1,1,1,0,0,0,far);
}

function windowBay(P, M, x, front, h = 4.2, w = 2.8) {
  const key = `arched-pane-${w}-${h}`;
  const geo = P.geometry(key, () => {
    const s = new THREE.Shape(); s.moveTo(-w/2,0); s.lineTo(w/2,0); s.lineTo(w/2,h-w/2);
    s.absarc(0,h-w/2,w/2,0,Math.PI,false); s.closePath(); return new THREE.ShapeGeometry(s,12);
  });
  P.shape(key,geo,M.glass,x,.7,front,1,1,1,0,0,0,600);
  for (const u of [-w/2-.07,w/2+.07]) P.box(M.trim,x+u,(h-w/2)/2+.7,front+.045,.14,h-w/2,.15,550);
  const arcKey=`arch-trim-${w}`;
  P.shape(arcKey,P.geometry(arcKey,()=>new THREE.TorusGeometry(w/2+.06,.075,5,20,Math.PI)),M.trim,x,h-w/2+.7,front+.045,1,1,1,0,0,0,550);
  P.box(M.trim,x,.66,front+.1,w+.25,.16,.32,600);
  P.box(M.trim,x,2.2,front+.09,.09,3.0,.09,450);
  for (const y of [1.7,3.4]) P.box(M.trim,x,y,front+.09,w,.09,.09,450);
  for (const a of [.23*Math.PI,.5*Math.PI,.77*Math.PI]) P.beam(M.trim,[x,h-w/2+.7,front+.09],[x+Math.cos(a)*w/2,h-w/2+.7+Math.sin(a)*w/2,front+.09],.035,400);
}

function mainPavilion(ctx,P,M,svc) {
  const b=CITY.BUILDINGS.find(b=>b.id==='w30899425'); if(!b?.polys?.length)return;
  const bb=polyBounds(b.polys[0]),rot=Math.PI+.035,w=28.7,d=15.2;
  if(!safeSpot(ctx,bb.cx,bb.cz,w,d,rot))return;
  P.push(bb.cx,0,bb.cz,rot);
  P.box(M.granite,0,.12,0,w,.22,d,1200);
  P.box(M.ochre,0,3.39,-2.0,w-1,6.55,10.7,1400);
  P.box(M.trim,0,.48,-2.0,w-.8,.35,10.85,1100);
  for(const y of [6.38,6.70])P.box(M.trim,0,y,0,w+.25,.22,d+.3,1200);
  // The deep open porch looks over Fountain Pond. Its bays have no wall box.
  for(let i=0;i<8;i++) {
    const x=-13.0+i*26/7,z=6.16;
    P.box(M.trim,x,.36,z,.95,.38,.95,800);
    P.cyl(M.trim,x,3.39,z,.25,5.74,1200);
    P.cyl(M.trim,x,.65,z,.34,.20,800);
    P.box(M.trim,x,6.13,z,.82,.28,.82,850);
    ctx.physics.addCylinder(bb.cx+Math.cos(rot)*x+Math.sin(rot)*z,bb.cz-Math.sin(rot)*x+Math.cos(rot)*z,.29,0,6.4);
  }
  for(let i=0;i<7;i++)windowBay(P,M,-11.14+i*3.713,3.385,4.2,2.65);
  for(const side of [-1,1]) {
    P.push(side*(w/2-.49),0,-2.1,side*Math.PI/2);
    for(const x of [-2.8,2.8])windowBay(P,M,x,.035,3.8,2.3);
    P.pop();
  }
  hipRoof(P,M,w+1,d+1,6.88,2.0);
  P.box(M.trim,3.7,8.1,-2.7,.75,1.85,.75,850);
  P.box(M.roof,3.7,9.08,-2.7,1.1,.13,1.1,700);
  P.pop();
  // The actual main hall, inset behind its open porch, has thin perimeter walls.
  const body={o:[[-(w-1)/2,-7.35],[(w-1)/2,-7.35],[(w-1)/2,3.35],[-(w-1)/2,3.35]].map(([x,z])=>[bb.cx+Math.cos(rot)*x+Math.sin(rot)*z,bb.cz-Math.sin(rot)*x+Math.cos(rot)*z]).flat(),h:[]};
  addPolyColliders(ctx,body,0,6.6,.3);
  svc.monuments.push({id:b.id,name:'Главный павильон — бывший кинотеатр «Глобус»',x:bb.cx,z:bb.cz,h:9.2});
  svc.photoSpots.push({x:-1475,z:7267,yaw:166,pitch:3,name:'Главный павильон над Фонтанным прудом'});
}

function memory(ctx,P,M,svc) {
  const b=CITY.BUILDINGS.find(b=>b.id==='w621507834');if(!b)return;
  const x=b.cx,z=b.cz,rot=Math.PI/4;
  P.push(x,0,z,rot);
  // The name “Rotunda” refers to a square classical portico, not a domed gazebo.
  P.box(M.granite,0,.20,0,4.9,.38,4.9,1100);
  P.box(M.red,0,.45,0,4.35,.20,4.35,1000);
  for(const u of [-1.7,1.7])for(const v of [-1.7,1.7]) {
    P.box(M.granite,u,.72,v,.9,.32,.9,900);
    P.cyl(M.memory,u,3.62,v,.35,5.5,1200);
    P.box(M.memory,u,6.45,v,.92,.24,.92,1000);
    ctx.physics.addCylinder(x+Math.cos(rot)*u+Math.sin(rot)*v,z-Math.sin(rot)*u+Math.cos(rot)*v,.39,0,6.6);
  }
  for(const zz of [-1.7,1.7])P.box(M.memory,0,6.83,zz,4.9,.6,.85,1300);
  for(const xx of [-1.7,1.7])P.box(M.memory,xx,6.83,0,.85,.6,3.0,1300);
  hipRoof(P,M,5.2,5.2,7.2,.67,1300);
  for(const side of [-1,1]) {
    const key='memory-pediment',g=P.geometry(key,()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-2.6,7.13,0,2.6,7.13,0,0,8.12,0],3));g.computeVertexNormals();return g;});
    P.shape(key,g,M.memory,0,0,side*2.46,1,1,1,0,side>0?0:Math.PI,0,1300);
    P.beam(M.memory,[-2.7,7.17,side*2.51],[0,8.23,side*2.51],.12,1100);
    P.beam(M.memory,[0,8.23,side*2.51],[2.7,7.17,side*2.51],.12,1100);
  }
  P.box(M.red,0,1.02,0,1.1,1.0,1.1,950);
  P.shape('memory-urn',P.geometry('memory-urn',()=>new THREE.LatheGeometry([[.16,0],[.36,.1],[.43,.48],[.25,.7],[.24,.86],[.45,.95],[0,1.12]].map(p=>new THREE.Vector2(...p)),16)),M.porphyry,0,1.52,0,1,1,1,0,0,0,850);
  P.box(M.bronze,0,6.84,2.15,3.5,.29,.035,450);
  P.label(M.names,0,6.84,2.19,3.5,.29,b.id,0,450,28);
  P.pop();ctx.physics.addWalkBox(x,z,4.9,4.9,rot,.39,0);
  ctx.physics.addBox(x,z,1.1,1.1,0,0,2.7);
  svc.monuments.push({id:'n1520977370',name:'Павильон Памяти — Ротонда',x,z,h:8});
}

function lions(ctx,P,M,svc) {
  for(const id of ['n4484392661','n4484392662']) {
    const q=CITY.MONUMENTS.find(q=>q.id===id);if(!q)continue;
    P.push(q.x,0,q.z,id.endsWith('1')?-Math.PI/2:Math.PI/2);
    P.box(M.granite,0,.2,0,1.55,.38,2.7,850);
    P.sphere(M.memory,0,.9,-.2,.91,1.15,1.48,600);
    for(const u of [-.33,.33]){P.box(M.memory,u,.56,.62,.30,.7,.38,600);P.sphere(M.memory,u,.32,.93,.42,.29,.65,500);}
    P.sphere(M.memory,0,1.55,.61,1.06,1.08,.91,650);
    P.sphere(M.memory,0,1.6,.98,.67,.7,.50,550);
    P.sphere(M.memory,0,1.49,1.23,.22,.18,.15,400);
    for(const u of [-.40,.40])P.sphere(M.memory,u,1.91,.6,.26,.31,.2,450);
    P.torus(M.memory,.4,.63,-.67,.34,.09,0,Math.PI/2,450);
    P.pop();ctx.physics.addBox(q.x,q.z,2.7,1.55,Math.PI/2,0,2.2);
    svc.monuments.push({...q,h:2.2});
  }
}

export function pavilions(ctx,P,M,svc) { mainPavilion(ctx,P,M,svc);memory(ctx,P,M,svc);lions(ctx,P,M,svc); }
