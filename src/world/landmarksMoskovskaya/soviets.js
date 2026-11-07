// Measured footprint family, authored from the frontal/aerial references in
// docs/research/moskovskaya-soviets.md. No plaza rectangle covers live asphalt.
import * as THREE from 'three';
import { band, frameOf } from '../landmarksD/kit.js';
import { roadClear } from './common.js';

const HEIGHTS = { r1145686: 20.5, r5933731: 33.8, r5933729: 34.1, r5933730: 34.1 };
const sphere = new THREE.SphereGeometry(1, 8, 6);

function plinthClear(ctx,e){
  // A service lane can meet a court facade. The decorative low band's bottom
  // is a horizontal surface too: require its entire run and mitre envelope to
  // clear real asphalt, rather than testing the edge midpoint alone.
  const count=Math.max(1,Math.ceil(e.len/.75));
  for(let i=0;i<=count;i++){
    const t=i/count,x=e.a[0]+(e.b[0]-e.a[0])*t,z=e.a[1]+(e.b[1]-e.a[1])*t;
    if(!roadClear(ctx,x,z,.38))return false;
  }
  return true;
}

function figure(P, M, x, y, z, i) {
  // Shallow stone workers, families and engineers: alternating arms, strides,
  // head positions and tools avoid an identical row of abstract fence posts.
  const s = i % 2 ? -1 : 1;
  P.cyl(M.stone, [x-.16,y,z], [x-.12,y+.88,z+.02], .12, .17, 6);
  P.cyl(M.stone, [x+.24,y,z+.015], [x+.12,y+.88,z+.02], .12, .17, 6);
  P.cyl(M.trim, [x,y+.74,z], [x,y+1.72,z+.035], .34, .25, 7);
  P.geo(M.trim, sphere, x, y+2.08, z+.04, 0, 0, 0, .23, .29, .15);
  P.cyl(M.trim, [x-.23,y+1.55,z+.05], [x-.56,y+1.1+s*.32,z+.07], .12, .09, 6);
  P.cyl(M.trim, [x+.23,y+1.55,z+.05], [x+.55,y+1.4-s*.45,z+.06], .12, .09, 6);
  if (i%5===0) P.box(M.shade,x+.36,x+.79,y+.85,y+1.4,z-.03,z+.15);
  if (i%7===0) P.cyl(M.trim,[x-.5,y+.7,z+.04],[x-.6,y+2.35,z+.04],.045,.045,5);
}

function crown(P, D, M, x, z, rot, y) {
  P.push(x,0,z,rot); D.push(x,0,z,rot);
  P.box(M.stone,-5.1,5.1,y,y+.55,-.5,.65);
  // RSFSR coat-of-arms silhouette: a round shield between paired wheat ears,
  // radiating stems and a five-pointed star. The prohibited roof pole is omitted.
  P.geo(M.stone,new THREE.TorusGeometry(2.65,.38,6,28),0,y+3.7,.2);
  P.geo(M.shade,new THREE.CircleGeometry(2.25,28),0,y+3.7,.18);
  for(const side of [-1,1]) for(let i=0;i<8;i++) {
    const yy=y+.9+i*.65,xx=side*(2.1+Math.sin(i/8*Math.PI)*1.8);
    P.cyl(M.stone,[side*1.7,y+.4,.25],[xx,yy+.35,.25],.10,.07,6);
    for(const s of [-1,1]) D.cyl(M.trim,[xx,yy,.3],[xx+side*.55,yy+s*.3,.34],.16,.035,5);
  }
  // A real curved sickle and diagonal hammer are relief rather than a logo
  // texture; at distance the enclosing stone wreath carries the roof profile.
  D.geo(M.trim,new THREE.TorusGeometry(1.05,.16,5,16,Math.PI*1.48),.05,y+3.85,.55,0,0,-.7);
  D.cyl(M.trim,[-.7,y+2.6,.6],[.85,y+4.7,.6],.13,.13,6);
  D.cyl(M.trim,[.25,y+4.65,.61],[1.23,y+4.03,.61],.24,.24,6);
  const star=new THREE.Shape();
  for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.42:1;const u=Math.cos(a)*r,v=y+7.2+Math.sin(a)*r;if(i)star.lineTo(u,v);else star.moveTo(u,v);}star.closePath();
  P.extrude(M.stone,star,-.04,.42,1,1);
  P.pop();D.pop();
}

function portico(K, edge, h) {
  const {body:P,detail:D,mats:M,ctx,svc}=K,f=frameOf(edge),len=edge.len;
  const columnTop=29.45, columns=[];
  // Seven columns either side of the broad rusticated central entrance bay.
  for(const side of [-1,1])for(let i=0;i<7;i++){
    const u=len/2+side*(17+i*4.9),v=2.0,r=.94;
    const x=f.x+f.xa[0]*u+edge.n[0]*v,z=f.z+f.xa[1]*u+edge.n[1]*v;
    if(!roadClear(ctx,x,z,r+ .22))continue;
    P.push(f.x,0,f.z,f.rot);
    P.col(M.granite,u,v,.17,3.1,1.15,1.12,12);
    P.col(M.stone,u,v,3.1,columnTop,r,r*.87,16);
    P.box(M.trim,u-1.17,u+1.17,columnTop,columnTop+.48,.8,3.22);
    P.box(M.stone,u-1.31,u+1.31,columnTop+.48,columnTop+.73,.65,3.4);P.pop();
    ctx.physics.addCylinder(x,z,r,3.1,columnTop);
    ctx.physics.addCylinder(x,z,1.15,.17,3.1);
    columns.push({x,z,r,y:3.1,top:columnTop});
  }
  P.push(f.x,0,f.z,f.rot);D.push(f.x,0,f.z,f.rot);
  P.box(M.shade,-.6,len+.6,30.18,30.45,.05,3.5);
  P.box(M.trim,-.75,len+.75,30.45,30.84,.05,3.65);
  P.box(M.stone,-.55,len+.55,30.84,33.53,.05,2.9);
  P.box(M.trim,-.85,len+.85,33.53,h+.36,-.1,3.7);
  for(let i=0;i<48;i++)figure(D,M,(i+.5)*len/48,30.93,2.96,i);
  // Central rustication surrounds three narrow window axes; it remains on the
  // footprint wall, behind the freestanding shafts and their open gaps.
  for(const side of [-1,1])for(let y=4.1;y<29.1;y+=.85){
    const u=len/2+side*10.8;
    D.box(M.trim,u-1.13,u+1.13,y,y+.43,.12,.64);
    D.box(M.stone,u-.87,u+.87,y+.43,y+.81,.12,.39);
  }
  for(const u of [len/2-4.2,len/2,len/2+4.2]){
    D.box(M.granite,u-1.6,u+1.6,.15,4.25,.12,1.22);
    D.box(M.dark,u-1.0,u+1.0,.2,3.5,1.23,1.26);
    D.box(M.trim,u-1.66,u+1.66,4.25,4.61,.1,1.5);
  }
  for(const side of [-1,1]){
    const u=len/2+side*8.1;
    D.geo(M.trim,new THREE.TorusGeometry(.86,.16,5,20),u,7.8,.61);
    D.box(M.trim,u-.7,u+.7,6.4,6.75,.2,.73);
  }
  P.pop();D.pop();
  const cx=f.x+f.xa[0]*len/2,cz=f.z+f.xa[1]*len/2;
  crown(P,D,M,cx+edge.n[0]*1.1,cz+edge.n[1]*1.1,f.rot,h+.36);
  svc.soviets={front:{x:f.x,z:f.z,ux:f.xa[0],uz:f.xa[1],nx:edge.n[0],nz:edge.n[1],length:len},columns,courts:3,reliefFigures:48};
}

export function soviets(K,recs){
  if(!recs.length)return;
  const {ctx,mats:M,svc}=K,outline=recs.find(b=>!b.part)||recs[0];
  const parts=recs.filter(b=>b.part&&!b.dupOf&&!b.underground),draw=parts.length?parts:[outline];
  let centralFront;
  for(const rec of draw){
    const h=HEIGHTS[rec.id]??rec.h??20.5,edges=K.shell(rec,h,M.stone);
    band(K.body,edges,.18,.63,.11,{front:M.granite,top:M.granite,under:M.shade},{draw:e=>plinthClear(ctx,e)});
    K.cornice(edges,h);
    band(K.body,edges,3.1,3.4,.13,{front:M.trim,top:M.trim,under:M.shade});
    if(rec.id==='r5933731')centralFront=edges.filter(e=>!e.hole&&e.n[0]<-.9).sort((a,b)=>b.len-a.len)[0];
    if(rec.id==='r1145686')for(const e of edges.filter(e=>!e.hole&&e.n[0]<-.95&&e.len>18&&e.len<23&&Math.abs((e.a[1]+e.b[1])/2-outline.cz)>70)){
      const f=frameOf(e);K.body.push(f.x,0,f.z,f.rot);
      for(let i=0;i<4;i++){
        const u=(i+.5)*e.len/4,v=1.35,x=f.x+f.xa[0]*u+e.n[0]*v,z=f.z+f.xa[1]*u+e.n[1]*v;
        if(!roadClear(ctx,x,z,.9))continue;
        K.body.col(M.stone,u,v,.15,18.95,.66,.56,12);
        K.body.box(M.trim,u-.86,u+.86,18.95,19.45,.45,2.22);
        ctx.physics.addCylinder(x,z,.66,.15,18.95);
      }
      K.body.box(M.trim,-.25,e.len+.25,19.45,20.3,.05,2.5);K.body.pop();
    }
    K.use(true);
    for(const e of edges)K.frame(e,len=>{
      if(len<2.5)return;
      const n=Math.max(1,Math.floor(len/4.2));
      for(let i=0;i<n;i++)for(let y=1.15;y+2.05<h-1.1;y+=3.62)K.window((i+.5)*len/n,y,1.4,2.12);
      if(rec.id==='r1145686'&&!e.hole&&e.n[0]<-.95&&len>20){
        // Closely spaced shallow wing pilasters and continuous waist course.
        for(let i=0;i<=n;i++){
          const u=(i+.02)*len/n;
          K.P.box(M.trim,u-.28,u+.28,3.45,h-.8,.06,.48);
          K.P.box(M.trim,u-.47,u+.47,h-.8,h-.46,.04,.61);
        }
        K.P.box(M.trim,-.13,len+.13,h-.45,h-.15,.05,.65);
      }
    });
    svc.houses.push({id:rec.id,name:'Дом Советов',x:rec.cx,z:rec.cz,h});
  }
  if(centralFront)portico(K,centralFront,33.8);
  svc.photoSpots.push({name:'Дом Советов и Московская площадь',x:-1660,z:8940,yaw:-89});
}

export function lenin(K,rec){
  if(!rec||!roadClear(K.ctx,rec.x,rec.z,4.5))return;
  const {x,z}=rec,{body:P,detail:D,mats:M,ctx,svc}=K,rot=-Math.PI/2;
  P.push(x,0,z,rot);D.push(x,0,z,rot);
  // The photographed narrow pink-granite monolith has a low stepped square
  // base; it is not replaced with a bulky classical pedestal.
  P.box(M.granite,-4.1,4.1,.05,.23,-4.1,4.1);
  P.box(M.granite,-2.5,2.5,.23,.5,-2.3,2.3);
  P.box(M.granite,-1.12,1.12,.5,7.5,-1.0,1.0);
  P.cyl(M.bronze,[-.65,7.5,.65],[-.42,10.75,0],.35,.48,10);
  P.cyl(M.bronze,[.72,7.5,-.5],[.4,10.75,.05],.35,.48,10);
  P.box(M.bronze,-1.05,-.24,7.5,7.8,.1,1.5);P.box(M.bronze,.3,1.11,7.5,7.8,-1,.1);
  // Windblown coat hem extends behind the forward stride.
  P.fan(M.bronze,[[-1.25,10.1,-.2],[-1.5,10.0,-1.25],[-.85,12.6,-.6],[.6,12.9,-.6],[1.5,10.15,-1.3],[1.05,10.2,.15]],[0,0,-1]);
  P.cyl(M.bronze,[0,10,0],[0,14,.38],1.3,.98,12);
  P.col(M.bronze,0,.38,14,14.7,.33,.32,8);
  P.geo(M.bronze,sphere,0,15.3,.46,0,0,0,.59,.72,.63);
  P.geo(M.bronze,sphere,0,15.23,1.1,0,0,0,.13,.15,.22);
  D.cyl(M.bronze,[0,14.83,1.0],[0,14.54,.94],.23,.045,7);
  P.cyl(M.bronze,[-.9,13.6,.38],[-1.35,11.45,.75],.32,.23,8);
  P.cyl(M.bronze,[.9,13.6,.38],[2.55,14.13,.6],.32,.25,8);
  P.cyl(M.bronze,[2.55,14.13,.6],[3.85,14.4,.7],.25,.18,8);
  P.geo(M.bronze,sphere,3.95,14.4,.7,0,0,-.1,.39,.18,.26);
  for(const u of[-.25,.25])D.cyl(M.dark,[u,12.4,1.17],[u*2,13.8,1.15],.06,.035,5);
  for(const y of[11.5,12.2,12.9])D.geo(M.dark,sphere,.08,y,1.2,0,0,0,.07,.07,.025);
  P.pop();D.pop();
  ctx.physics.addBox(x,z,2,2.24,0,.23,7.5);
  svc.monuments.push({id:rec.id,name:'Памятник В. И. Ленину на Московской площади',x,z,h:16.02});
  svc.photoSpots.push({name:'Ленин и четырнадцать колонн Дома Советов',x:x-28,z:z+16,yaw:-66});
}
