// Trinity-Izmailovsky Cathedral, V. Stasov 1828-1835; restored white Greek cross, blue star domes.
// OSM r16834195 fixes plan; four six-column Corinthian porticoes confirmed by KGIOP 2016.
// Main silhouette 80 m. Gold stars are a shared texture, never hundreds of little meshes.
import * as THREE from 'three';
import { addPolyColliders } from '../lib/massing.js';
import { ringEdges, onEdge, band } from '../landmarksD/kit.js';
import { lathe, cross, roundCornice, ringWindows } from '../landmarksD/parts.js';
import { submit } from './common.js';
import { buildGlory } from './glory.js';

const CX=-2540.08,CZ=1777.22,ROT=.026;
const PLAN=[[-15,-31],[15,-31],[15,-15],[31,-15],[31,15],[15,15],[15,31],[-15,31],[-15,15],[-31,15],[-31,-15],[-15,-15]];
// Stasov's unusual scheme: the four small domes stand over the CROSS ARMS, not its corners.
const SIDE_DOMES=[[0,-24],[24,0],[0,24],[-24,0]];
const PORCH_DOORS=[[-6,2.3],[0,3],[6,2.3]];
const DOOR_SURROUND=.24;
// The city's Trinity gallery shows a glazed, white lantern under each gilt cup.
// https://visit-petersburg.ru/leisure/places/tp-195647-svyato-troitskiy-izmaylovskiy-sobor/
const LANTERN_CUP = [[0,0],[.94,0],[1,.12],[.95,.34],[.75,.59],[.43,.79],[.17,.95],[.12,1],[0,1]];
function world(x,z){return [CX+Math.cos(ROT)*x+Math.sin(ROT)*z,CZ-Math.sin(ROT)*x+Math.cos(ROT)*z];}
const poly={o:PLAN.flatMap(p=>world(...p)),h:[]};

export function buildTrinity(K,root) {
  if(!K.L.groupMembers('central-trinity').length)return;
  const P=K.P,stone=K.wall('#e4e1d8'),shade=K.wall('#cbc9c0'),roof=K.wall('#687e78'),gold=K.wall('#caa549');
  const starMap=K.ctx.tex.draw(512,512,(g,w,h)=>{
    g.fillStyle='#528db5';g.fillRect(0,0,w,h);
    g.fillStyle='#376d96';for(let c=0;c<16;c++)g.fillRect(c*w/16,0,2,h);
    g.fillStyle='#d7b157';
    for(let row=0;row<8;row++){
      // Narrow toward the crown so the upper stars keep their proportions.
      const count=8+row*4;
      const y=(row+.5)*h/10;
      for(let c=0;c<count;c++){
        const x=(c+(row%2 ? .72 : .28))*w/count;
        g.beginPath();
        for(let point=0;point<12;point++){
          const a=point*Math.PI/6-Math.PI/2, radius=point%2 ? .46 : 1;
          const px=x+Math.cos(a)*radius*w/count*.20, py=y+Math.sin(a)*radius*6;
          if(point)g.lineTo(px,py);else g.moveTo(px,py);
        }
        g.closePath();g.fill();
      }
    }
  },{key:'central-trinity-blue-stars',repeat:[1,1]});
  const blue=K.ctx.mat.toon('#ffffff',{map:starMap,paint:.025});
  K.begin();
  const edges=ringEdges(poly,.05);
  for(const e of edges)onEdge(P,e,len=>{
    K.wallQuad(stone,0,len,0,29,4);
    // Side walls of the Greek-cross arms; opaque pale wall behind every window.
    for(const x of K.bays(1,len-1,5.6))K.window({x,y:8,w:2.1,h:9.0,head:'arch',sw:.24,surMat:shade,frame:'white',sill:false});
    let start=0;
    // Every third edge is the end of a cross arm. Stop this course at
    // each portal surround so it never shares the door leaf's depth.
    if(e.i%3===0)for(const [x,w] of PORCH_DOORS){
      const center=len/2+x,half=w/2+DOOR_SURROUND;
      P.box(shade,start,center-half,4.25,4.5,0,.12,start===0?'kbr':'kblr');
      start=center+half;
    }
    P.box(shade,start,len,4.25,4.5,0,.12,e.i%3===0?'kbl':'kb');
  });
  for(const [y0,y1,d] of [[0,.85,.13],[27.3,27.7,.28],[28.45,29.05,.6]])band(P,edges,y0,y1,d,{front:stone,top:stone,under:shade},{draw:()=>true});
  P.cap(roof,PLAN.map(p=>world(...p)),29.11,true,5);
  // Four columned porches fit INSIDE the original 75 m OSM cross footprint.
  P.push(CX,0,CZ,ROT);
  for(let side=0;side<4;side++){
    P.push(0,0,0,side*Math.PI/2); P.push(0,0,31);
    for(const x of [-11.8,-7.1,-2.4,2.4,7.1,11.8]){
      K.column(stone,x,4.45,1.1,22,.68,{capH:2.0,seg:14});
      const [wx,wz]=world(Math.cos(side*Math.PI/2)*x+Math.sin(side*Math.PI/2)*35.45,-Math.sin(side*Math.PI/2)*x+Math.cos(side*Math.PI/2)*35.45);
      K.ctx.physics.addCylinder(wx,wz,.83,1,23);
    }
    // Three shallow steps are within the garden, not broad decorative paving across a street.
    for(let i=0;i<3;i++){
      const depth=6.7-i*.55;P.box(shade,-15.1,15.1,i*.28,(i+1)*.28,0,depth,'b');
      const a=side*Math.PI/2,[wx,wz]=world(Math.sin(a)*(31+depth/2),Math.cos(a)*(31+depth/2));
      K.ctx.physics.addWalkBox(wx,wz,30.2,depth,ROT+a,(i+1)*.28,0);
    }
    P.box(shade,-15.1,15.1,.84,1.1,0,5.3,'b');
    {const a=side*Math.PI/2,[wx,wz]=world(Math.sin(a)*33.65,Math.cos(a)*33.65);K.ctx.physics.addWalkBox(wx,wz,30.2,5.3,ROT+a,1.1,0);}
    P.box(stone,-15.6,15.6,22,24.4,-.2,6.25,'b');
    P.box(shade,-15.9,15.9,24.4,24.85,-.3,6.5,'b');
    P.fan(stone,[[-15.8,24.9,6.5],[15.8,24.9,6.5],[0,29.1,6.5]],[0,0,1]);
    P.fan(shade,[[-15.8,24.9,-.3],[0,29.1,-.3],[15.8,24.9,-.3]],[0,0,-1]);
    P.quad(roof,[-15.8,24.9,-.3],[-15.8,24.9,6.5],[0,29.1,6.5],[0,29.1,-.3],[-1,1,0]);
    P.quad(roof,[0,29.1,-.3],[0,29.1,6.5],[15.8,24.9,6.5],[15.8,24.9,-.3],[1,1,0]);
    for(const [x,w] of PORCH_DOORS)K.gate(x,1.0,w,5.4,{sw:DOOR_SURROUND,doorMat:K.mats.doorWood});
    P.pop();P.pop();
  }
  P.pop();
  // Main cylinder and high ring of Corinthian pilasters preserve the skyline at distance.
  P.cyl(stone,[CX,29.1,CZ],[CX,50.8,CZ],15.2,15.2,40,true);
  roundCornice(K,stone,shade,CX,CZ,49.5,15.2,1.65);
  lathe(K,blue,'central-trinity-dome',[[0,0],[1,0],[.998,.08],[.96,.33],[.83,.60],[.58,.84],[.24,.98],[0,1]],CX,51.2,CZ,15.7,19.4,40);
  // Lantern is a closed pale core and eight small pilasters, topped by a gilded cup.
  P.cyl(stone,[CX,70.6,CZ],[CX,75.7,CZ],2.1,2.1,16,true);
  lathe(K,gold,'central-trinity-gilt-cup',LANTERN_CUP,CX,75.7,CZ,2.45,1.4,24);
  cross(K,gold,CX,77.1,CZ,2.9);
  for(const [x,z] of SIDE_DOMES){
    const [wx,wz]=world(x,z);
    P.cyl(stone,[wx,29.15,wz],[wx,39.0,wz],6.85,6.85,24,true);
    roundCornice(K,stone,shade,wx,wz,38.3,6.85,.8);
    lathe(K,blue,'central-trinity-small-dome',[[0,0],[1,0],[1,.1],[.93,.4],[.72,.7],[.35,.94],[0,1]],wx,39.1,wz,7.5,8.5,24);
    P.cyl(stone,[wx,47.6,wz],[wx,49.5,wz],.8,.8,12,true);
    lathe(K,gold,'central-trinity-gilt-cup',LANTERN_CUP,wx,49.5,wz,1.05,.65,16);
    cross(K,gold,wx,50.2,wz,2.2);
  }
  submit(K,root,'central-trinity-silhouette');
  // Far detail range: no continuous city-wide animation or uncullable global instances.
  K.begin();
  ringWindows(K,CX,CZ,15.24,16,{x:0,y:33,w:2.0,h:11,head:'arch',sw:.25,surMat:shade,frame:'white',sill:false},ROT,40);
  for(let i=0;i<16;i++){
    const a=ROT+(i+.5)*Math.PI/8,x=CX+Math.sin(a)*15.65,z=CZ+Math.cos(a)*15.65;
    K.column(stone,x,z,30.3,48.6,.65,{seg:10,capH:1.2,volutes:false});
  }
  for(const [x,z] of SIDE_DOMES){const [wx,wz]=world(x,z);ringWindows(K,wx,wz,6.89,10,{x:0,y:31.4,w:1.25,h:5.3,head:'arch',sw:.16,surMat:shade,frame:'white',sill:false});}
  submit(K,root,'central-trinity-drum-detail',750);
  K.begin();
  const lanterns=[[CX,CZ,70.6,2.1,5.1],...SIDE_DOMES.map(([u,v])=>[...world(u,v),47.6,.8,1.9])];
  const glazing=K.wall('#435967');
  const light=new THREE.Shape();
  light.moveTo(-.28,.12);light.lineTo(.28,.12);light.lineTo(.28,.64);
  light.absellipse(0,.64,.28,.17,0,Math.PI,false,0);light.closePath();
  const archPane=new THREE.ShapeGeometry(light,6);
  for (const [x,z,y,r,h] of lanterns) {
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      P.push(x+Math.sin(a)*r,y,z+Math.cos(a)*r,a);
      P.geo(glazing,archPane,0,0,.02,0,0,0,r,h,1);
      P.box(stone,-r*.019,r*.019,h*.12,h*.81,.023,.055,'kb');
      P.box(stone,-r*.28,r*.28,h*.48,h*.50,.024,.053,'kb');
      P.pop();
    }
    roundCornice(K,stone,shade,x,z,y+h*.91,r,h*.09);
  }
  archPane.dispose();
  submit(K,root,'central-trinity-lantern-glazing',350);
  addPolyColliders(K.ctx,poly,0,29,.7);
  K.svc.houses.push({id:'r16834195',name:'Троице-Измайловский собор',x:CX,z:CZ});
  K.svc.monuments.push({id:'r16834195',name:'Троице-Измайловский собор',x:CX,z:CZ,h:80});
  K.svc.photoSpots.push({x:CX+78,z:CZ+75,yaw:K.L.yawToward(CX+78,CZ+75,CX,CZ),pitch:20,name:'Синие купола Троицкого собора'});
  buildGlory(K,root);
}
