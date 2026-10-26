// Mostotrest/photo-based embellishments for two real Fontanka crossings. Parent bridges owns
// the asphalt decks, ramps, railings and quay openings; this module owns only roadside figures/towers.
// Footprints are tested at FINAL positions against net.cover, including their corners.
import * as THREE from 'three';
import { SOUTH_SITES } from '../bridges/sites-south.js';
import { frameOf,toWorld,toUV } from '../bridges/sites.js';
import { MONUMENTS } from '../data/city.js';
import { Sculpt,cached,face } from '../lib/figures.js';
import { lathe } from '../landmarksD/parts.js';
import { submit } from './common.js';

function clear(K,x,z,w,d,rot){
  const net=K.ctx.services.streets?.net,c=Math.cos(rot),s=Math.sin(rot);
  for(const [a,b]of [[0,0],[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]]){
    const px=x+c*a+s*b,pz=z-s*a+c*b;
    if(net ? net.cover(px,pz,{})>=-.55 : K.L.isOnRoad(px,pz,.55))return false;
  }
  return true;
}
const sphinx=()=>cached('central-egyptian-female-sphinx',()=>{
  const S=new Sculpt({detail:.45,patina:false});
  S.tube('main',[[0,.38,-1.35],[0,.60,-.85],[0,.65,-.15],[0,.72,.50]],[[.40,.35],[.48,.44],[.49,.43],[.46,.47]],{seg:10,per:3});
  for(const side of [-1,1]){
    S.blob('main',[side*.35,.42,-.85],[.28,.40,.48],{w:10,h:8});
    S.tube('main',[[side*.28,.58,.45],[side*.30,.30,.78],[side*.30,.16,1.37]],[[.18,.21],[.15,.15],[.16,.12]],{seg:8,per:3});
    S.blob('main',[side*.30,.16,1.48],[.21,.14,.24],{w:9,h:7});
    for(const dx of [-.12,0,.12])S.blob('dark',[side*.30+dx,.11,1.62],[.026,.04,.045],{w:5,h:4});
  }
  S.tube('main',[[0,.72,.45],[0,1.05,.55],[0,1.50,.57]],[[.44,.43],[.34,.32],[.20,.20]],{seg:10,per:3});
  face(S,{c:[0,1.74,.64],x:[1,0,0],y:[0,1,0],z:[0,0,1]},{scale:2.8,hair:'cap',mouth:'neutral',age:.08,jaw:.68,brow:.42,seed:23,detail:.45});
  // Striped gilded nemes lappets, fan-like brow crest and soft female face (not the Academy's pharaoh crown).
  for(const side of [-1,1]){
    S.tube('accent',[[side*.24,1.92,.50],[side*.32,1.55,.54],[side*.38,1.04,.80]],[[.07,.14],[.07,.15],[.06,.14]],{seg:8,per:4,ref:[0,0,1]});
    for(let j=0;j<8;j++)S.tube('dark',[[side*.27,1.83-j*.10,.63+j*.02],[side*.43,1.83-j*.10,.63+j*.02]],[[.016,.016]],{seg:4,per:2});
  }
  for(let j=0;j<7;j++)S.tube('accent',[[0,2.03,.56],[.03+j*.025,2.20+j*.035,.49-j*.05]],[[.035,.035],[.018,.018]],{seg:5,per:3});
  S.tube('main',[[0,.55,-1.35],[-.42,.18,-1.50],[-.59,.13,-.99],[-.52,.13,-.45]],[[.065,.065]],{seg:7,per:4});
  return S.finish({});
});

function lomonosov(K,root,s){
  const P=K.P,stone=K.wall('#90877d'),shade=K.wall('#776f66'),roof=K.wall('#697673'),gold=K.wall('#b5a062'),iron=K.wall('#404b49'),f=frameOf(s);
  const sites=[];
  for(const u of [-10.2,10.2])for(const v of [-9.1,9.1]){
    const p=toWorld(s,u,v);if(!clear(K,p.x,p.z,3.7,3.7,-f.T))continue;
    sites.push({u,v,...p});
    K.begin();P.push(p.x,0,p.z,-f.T);
    // Tower projections sit on the original river piers outside the clear deck width.
    // Continue the granite below water level so a tower never floats beside the deck.
    P.box(stone,-1.85,1.85,-4.2,.0,-1.85,1.85,'b');
    P.box(stone,-1.85,1.85,.0,.55,-1.85,1.85,'b');
    // Four solid corner piers and high rectangular openings, as on the original drawbridge towers.
    for(const x of [-1.32,1.32])for(const z of [-1.32,1.32])P.box(stone,x-.43,x+.43,.55,6.7,z-.43,z+.43,'b');
    for(let side=0;side<4;side++){
      P.push(0,0,0,side*Math.PI/2);
      P.box(stone,-1.8,1.8,5.85,7.0,1.25,1.8,'b');
      for(const y of [1.0,2.1,3.2,4.3,5.4])for(const x of [-1.33,1.33])P.box(shade,x-.43,x+.43,y,y+.045,1.76,1.83,'kb');
      P.pop();
    }
    P.box(shade,-2.0,2.0,7.0,7.28,-2.0,2.0,'b');
    P.box(stone,-2.13,2.13,7.28,7.58,-2.13,2.13,'b');
    lathe(K,roof,'lomonosov-tower-cupola',[[0,0],[1,0],[.97,.15],[.87,.42],[.62,.72],[.29,.93],[0,1]],0,7.58,0,2.08,2.3,24);
    P.geo(gold,new THREE.SphereGeometry(.22,12,8),0,10.12,0);
    P.cyl(gold,[0,10.3,0],[0,10.82,0],.055,.015,8,true);
    P.pop();submit(K,root,'lomonosov-granite-tower');
    K.ctx.physics.addBox(p.x,p.z,3.7,3.7,-f.T,-4.2,7.2);
    K.svc.monuments.push({id:s.id+'-tower-'+u+'-'+v,name:'Башня моста Ломоносова',x:p.x,z:p.z,h:10.8,r:2});
  }
  K.begin();
  // Preserved lifting chains descend along the outer pavement; never across the asphalt.
  for(const t of sites){
    const a=toWorld(s,t.u,t.v),b=toWorld(s,t.u<0?-2.8:2.8,t.v);
    for(let j=0;j<12;j++){
      const q=j/12,r=(j+1)/12;
      const point=k=>[a.x+(b.x-a.x)*k,6.1+(1.2-6.1)*k-.35*Math.sin(k*Math.PI),a.z+(b.z-a.z)*k];
      P.cyl(iron,point(q),point(r),.042,.042,5,true);
    }
  }
  submit(K,root,'lomonosov-lifting-chains',700);
}
function egyptian(K,root,s){
  const f=frameOf(s),P=K.P,stone=K.wall('#a48d7d'),iron=K.wall('#42524a'),gold=K.wall('#c5a756');
  const fig=sphinx();
  for(const m of MONUMENTS.filter(m=>m.name==='Сфинкс'&&Math.hypot(m.x-s.cx,m.z-s.cz)<75)){
    const q=toUV(s,m.x,m.z),rot=Math.atan2(f.c,f.s)+(q.u>0?Math.PI:0);
    if(!clear(K,m.x,m.z,1.76,4.0,rot))continue;
    K.begin();P.push(m.x,0,m.z,rot);
    P.box(stone,-.88,.88,0,.3,-2.0,2.0,'b');P.box(stone,-.74,.74,.3,1.5,-1.83,1.83,'b');
    P.box(iron,-.70,.70,1.5,1.63,-1.8,1.8,'b');P.pop();
    fig.place(P,{main:iron,dark:K.wall('#293b35'),accent:gold},m.x,1.64,m.z,rot,1);
    submit(K,root,'egyptian-sphinx',650);
    K.ctx.physics.addBox(m.x,m.z,1.6,3.9,rot,0,3.9);
    K.svc.monuments.push({id:m.id,name:'Сфинкс Египетского моста',x:m.x,z:m.z,h:4.0,r:2});
  }
  // Real 1955 obelisk lanterns; safe candidates on the two actual 27.6 m deck pavements.
  for(const u of [-25.2,25.2])for(const v of [-12.7,12.7]){
    const p=toWorld(s,u,v);if(!clear(K,p.x,p.z,1.3,1.3,0))continue;
    K.begin();P.push(p.x,0,p.z,0);
    P.box(stone,-.62,.62,0,.7,-.62,.62,'b');
    P.box(iron,-.40,.40,.7,1.7,-.40,.40,'b');
    // Tapered four-sided iron obelisk, separate from the sculptural sphinx figures.
    P.geo(iron,new THREE.CylinderGeometry(.14,.50,4.8,4,1,false),0,4.1,0,0,Math.PI/4,0);
    P.cyl(iron,[0,6.5,0],[0,7.1,0],.11,.11,8,true);
    P.cyl(gold,[0,7.08,0],[0,7.7,0],.35,.31,6,true);
    P.cyl(iron,[0,7.7,0],[0,8.0,0],.40,.08,6,true);
    for(let side=0;side<4;side++){
      P.push(0,0,0,side*Math.PI/2);P.cyl(gold,[0,3.0,.27],[0,3.0,.33],.16,.16,12,true);P.pop();
    }
    P.pop();submit(K,root,'egyptian-obelisk-lantern',900);
    K.ctx.physics.addBox(p.x,p.z,1.2,1.2,0,0,7.9);
    K.svc.monuments.push({id:s.id+'-lamp-'+u+'-'+v,name:'Обелиск Египетского моста',x:p.x,z:p.z,h:8,r:.7});
  }
}
export function buildBridgeDetails(K,root){
  for(const s of SOUTH_SITES){
    if(/Ломоносова/i.test(s.name))lomonosov(K,root,s);
    if(s.name==='Египетский мост')egyptian(K,root,s);
  }
}
