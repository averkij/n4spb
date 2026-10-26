// Vitebsky terminal: 1904 Brzhozovsky/Minash, r13933407. KGIOP protected north front,
// nine upper window axes, asymmetric great vestibule arch, ribbed dome, east clock tower.
// Front frame follows the real diagonal Zagorodny facade; see central-south.md/photo references.
import * as THREE from 'three';
import { buildHouse } from '../landmarksD/house.js';
import { lathe } from '../landmarksD/parts.js';
import { submit,sign } from './common.js';
const X=-1239.7,Z=1355.9,ROT=-2.476;
function world(u,z){return [X+Math.cos(ROT)*u+Math.sin(ROT)*z,Z-Math.sin(ROT)*u+Math.cos(ROT)*z];}
function arch(P,mat,x,y,r,w,z=.2){
  const s=new THREE.Shape();s.moveTo(x-r-w,y);s.absarc(x,y,r+w,Math.PI,0,true);s.lineTo(x+r,y);s.absarc(x,y,r,0,Math.PI,false);s.closePath();P.extrude(mat,s,z,.25,1,24);
}
export function buildVitebsky(K,root){
  const rec=K.L.groupMembers('central-vitebsky').find(b=>b.id==='r13933407'); if(!rec)return;
  const P=K.P,stone=K.wall('#e1dccb'),shade=K.wall('#b9b8aa'),roof=K.wall('#7a9496'),iron=K.wall('#40565e');
  K.begin();
  buildHouse(K,{name:'vitebsky-terminal',recs:[rec],hc:16.6,wall:'#e1dccb',court:'#d9d5c6',roofMat:roof,railing:false,plinth:.8,
    // Every footprint edge gets an opaque wall; no disappearing party-wall shortcuts.
    party:()=>false,
    // The vestibule fanlight crosses the low wing's cornice height. Its tall front
    // gets the authored high entablature, not a generic horizontal band through the glass.
    noBand:e=>{
      const dx=(e.a[0]+e.b[0])/2-X,dz=(e.a[1]+e.b[1])/2-Z;
      const u=dx*Math.cos(ROT)-dz*Math.sin(ROT),v=dx*Math.sin(ROT)+dz*Math.cos(ROT);
      return u>36&&u<60&&v>5&&e.n[0]*Math.sin(ROT)+e.n[1]*Math.cos(ROT)>.75;
    },
    front:(e,{len})=>{
      K.wallQuad(stone,0,len,0,16.6,4);
      // The authored main facade below replaces generic detail on the northwest front.
      const facing=e.n[0]*Math.sin(ROT)+e.n[1]*Math.cos(ROT);
      if(facing>.75)return true;
      for(const u of K.bays(.6,len-.6,4.1)){
        K.window({x:u,y:2.0,w:1.5,h:3.5,head:'arch',sw:.14,surMat:stone,frame:'brown'});
        K.window({x:u,y:8,w:1.55,h:5.9,head:'flat',sw:.17,surMat:stone,frame:'white'});
      }
      P.box(shade,0,len,6.7,7.0,0,.18,'kb');return true;
    }});
  P.push(X,0,Z,ROT);
  // Northeast clock pavilion, detached from the larger vestibule to the southwest.
  P.box(stone,-8.6,3.0,16.7,33,-3.0,8.6,'b');
  P.box(shade,-8.95,3.35,32.8,33.5,-3.4,9.0,'b');
  const domeProfile=[[0,0],[1,0],[1,.1],[.96,.3],[.8,.7],[.44,.98],[.15,1.05],[0,1.05]];
  lathe(K,roof,'vitebsky-clock-roof',domeProfile,-2.8,33.5,2.8,6.0,6.6,24);
  P.cyl(iron,[-2.8,40.4,2.8],[-2.8,44.2,2.8],.16,.055,8,true);
  // Tall vestibule mass with the large semicircular glass arch and a squat metal dome.
  P.box(stone,37.4,58.1,16.7,24.5,-11.8,9.1,'b');
  P.box(shade,37.0,58.5,23.9,24.65,-12.1,9.45,'b');
  lathe(K,roof,'vitebsky-main-roof',domeProfile,47.75,24.65,-1.35,12,7.6,32);
  // Original station's metal roof ribs, modelled as broad capped strips rather than micro tiles.
  for(let j=0;j<12;j++){
    const a=j*Math.PI/6;
    let prev=[47.75+Math.sin(a)*11.9,24.8,-1.35+Math.cos(a)*11.9];
    for(let k=1;k<=7;k++){
      const th=k/7*Math.PI/2,n=[47.75+Math.sin(a)*11.9*Math.cos(th),24.8+7.8*Math.sin(th),-1.35+Math.cos(a)*11.9*Math.cos(th)];
      P.cyl(shade,prev,n,.1,.1,5,true);prev=n;
    }
  }
  // Parapet hides the junction between the pavilion and the roof; no flagpole.
  // Stop before the eave moulding at23.9m: their front planes must not overlap.
  P.box(stone,36.9,58.6,22.5,23.85,8.8,9.45,'b');
  for(const u of [37.2,40.7,44.2,47.75,51.3,54.8,58.3])P.box(shade,u-.25,u+.25,23.8,26,8.8,9.7,'b');
  P.cyl(iron,[47.75,32.6,-1.35],[47.75,34.2,-1.35],.12,.04,8,true);
  P.pop();
  submit(K,root,'vitebsky-silhouette');
  K.begin();P.push(X,0,Z,ROT);
  // Nine axes in the protected low middle wing. Front is staggered to follow the OSM plan.
  P.push(0,0,1.54);
  for(let j=0;j<9;j++){
    const u=7.3+j*3.3;
    K.window({x:u,y:6.9,w:2.0,h:6.45,head:'arch',sw:.16,surMat:stone,frame:'white',sill:true});
    K.window({x:u,y:.85,w:1.85,h:4.15,head:'arch',sw:.18,surMat:stone,frame:'brown'});
    K.pilaster(shade,u+1.75,.30,6.5,15.5,.13,.25);
    // Stucco tendrils terminate in small round discs instead of repeated large ornaments.
    P.cyl(shade,[u,14.5,.08],[u,14.5,.20],.23,.23,10,true);
  }
  P.box(stone,4.0,36.8,5.75,6.2,.03,.25,'kb');
  P.box(shade,4.0,36.8,14.4,14.7,.06,.26,'kb');
  P.box(stone,4.0,36.8,15.25,15.7,.04,.36,'kb');
  const [sx,sz]=world(21.8,1.66);
  P.push(21.8,0,0);sign(K,rec.id,sx,17.9,sz,28,1.2,Math.sin(ROT),Math.cos(ROT),'ВИТЕБСКИЙ ВОКЗАЛ',{bg:'#dad4bf',fg:'#a18142',size:.68});P.pop();
  P.pop();
  // East clock: four cream circular dial plates on the actual square tower, static hands.
  const clock=K.ctx.tex.draw(256,256,(g,w,h)=>{
    g.fillStyle='#e1dccb';g.fillRect(0,0,w,h);
    g.fillStyle='#d1ded4';g.beginPath();g.arc(128,128,124,0,Math.PI*2);g.fill();
    g.strokeStyle='#4f665e';g.lineWidth=8;g.stroke();g.lineWidth=4;
    for(let i=0;i<12;i++){const a=i*Math.PI/6;g.beginPath();g.moveTo(128+Math.sin(a)*94,128-Math.cos(a)*94);g.lineTo(128+Math.sin(a)*111,128-Math.cos(a)*111);g.stroke();}
    g.lineWidth=7;g.beginPath();g.moveTo(128,128);g.lineTo(156,78);g.moveTo(128,128);g.lineTo(76,128);g.stroke();
  },{key:'central-vitebsky-clock'});
  const dial=K.ctx.mat.toon('#ffffff',{map:clock,paint:0});
  for(let face=0;face<4;face++){
    P.push(-2.8,0,2.8,face*Math.PI/2);P.push(0,0,5.87);
    const [wx,wz]=world(-2.8+Math.sin(face*Math.PI/2)*6.23,2.8+Math.cos(face*Math.PI/2)*6.23);
    const a=ROT+face*Math.PI/2;
    if((K.ctx.services.labels).reserve(rec.id,wx,28.2,wz,3.4,3.4,Math.sin(a),Math.cos(a),'clock')){
      P.cyl(stone,[0,28.2,.05],[0,28.2,.3],1.9,1.9,32,true);
      K.plane(dial,-1.67,1.67,26.53,29.87,.36);
    }
    for(const u of [-4.4,4.4])K.pilaster(stone,u,.5,18.2,32,.22,.6);
    P.box(shade,-4.9,4.9,31.2,31.55,.02,.23,'kb');P.pop();P.pop();
  }
  // Main vestibule: three entrance arches, giant fanlight, stone voussoirs and iron mullions.
  P.push(47.75,0,9.24);
  const fanlight=new THREE.Shape();fanlight.moveTo(-7,6.1);fanlight.lineTo(7,6.1);fanlight.lineTo(7,13.6);fanlight.absarc(0,13.6,7,0,Math.PI,false);fanlight.closePath();
  P.face(K.wall('#476775'),fanlight,.11,1,24);
  arch(P,stone,0,13.6,7,.65,.22);
  for(const u of [-7.55,7.55])P.box(stone,u-.4,u+.4,5.7,13.6,.02,.62,'kb');
  for(let j=0;j<=12;j++){
    const a=j*Math.PI/12,x=Math.cos(a)*7.7,y=13.6+Math.sin(a)*7.7;
    P.geo(stone,new THREE.BoxGeometry(.5,.8,.42),x,y,.58,0,0,a-Math.PI/2);
  }
  for(const u of [-4.5,0,4.5]){
    K.gate(u,.5,3.65,5.25,{sw:.14,ringMat:iron,doorMat:iron});
    // Cast metal canopy is curved over the three doors, pitched sufficiently clear of wall.
    P.box(iron,u-2.1,u+2.1,5.3,5.43,0,1.6,'b');
    arch(P,iron,u,3.2,2.1,.11,1.65);
  }
  for(const u of [-5.4,-3.6,-1.8,0,1.8,3.6,5.4]){
    const ymax=13.6+Math.sqrt(Math.max(0,49-u*u));P.box(iron,u-.035,u+.035,6.2,ymax-.08,.2,.29,'kb');
  }
  for(const y of [10,13.6,16.4])P.box(iron,-6.4,6.4,y-.035,y+.035,.21,.3,'kb');
  // Flanking monumental pilasters and flowing shield reliefs distinguish northern Art Nouveau.
  for(const u of [-9,9]){
    K.pilaster(stone,u,1.0,6.1,22.1,.35,.8);
    P.geo(shade,new THREE.SphereGeometry(.6,10,8),u,19.8,.48,0,0,0,1,.9,.22);
    P.box(shade,u-.32,u+.32,17.6,19.3,.2,.40,'kb');
  }
  P.pop();P.pop();submit(K,root,'vitebsky-facade-detail',800);
  K.svc.houses.push({id:rec.id,name:'Витебский вокзал',x:-1240,z:1420});
  const [ex,ez]=world(47.75,12.2);K.svc.entrances.push({x:ex,z:ez,rotY:ROT,bldg:rec.id});
  const [px,pz]=world(32,65);K.svc.photoSpots.push({x:px,z:pz,yaw:K.L.yawToward(px,pz,...world(32,0)),pitch:13,name:'Витебский вокзал — модерн'});
}
