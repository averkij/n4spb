// All Saints memorial chapel, surveyed OSM r11008642 and the inspected Saint
// Petersburg diocese photograph (2012). Exterior only; estimated roof heights.
import * as THREE from 'three';
import * as CITY from '../data/city.js';
import { addPolyColliders } from '../lib/massing.js';

export function chapel(ctx,P,M,svc) {
  const b=CITY.BUILDINGS.find(b=>b.id==='r11008642');if(!b?.polys?.length)return;
  const x=b.cx,z=b.cz,poly=b.polys[0];
  const geo=P.geometry('all-saints-walls',()=>{
    const s=new THREE.Shape();for(let i=0;i<poly.o.length;i+=2){const a=poly.o[i]-x,c=-(poly.o[i+1]-z);if(i===0)s.moveTo(a,c);else s.lineTo(a,c);}s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:6.6,bevelEnabled:false});g.rotateX(-Math.PI/2);return g;
  });
  P.shape('all-saints-walls',geo,M.ivory,x,0,z,1,1,1,0,0,0,1500);
  P.push(x,0,z);
  P.box(M.red,0,.45,0,14.5,.90,14.5,1300);
  P.box(M.ivory,0,6.55,0,15.5,.3,14.4,1400);
  P.box(M.ivory,0,6.82,0,15.9,.18,14.8,1400);
  const roof=P.geometry('all-saints-roof',()=>new THREE.LatheGeometry([[10.45,6.9],[9.4,7.35],[7.7,9.15],[5.35,10.4],[0,10.4]].map(v=>new THREE.Vector2(...v)),4).rotateY(Math.PI/4));
  P.shape('all-saints-roof',roof,M.roofDark,0,0,0,1,1,1,0,0,0,1700);
  // Shallow gables and tall arched windows on each of four short chapel arms.
  for(let face=0;face<4;face++) {
    const rot=face*Math.PI/2;P.push(0,0,0,rot);
    const c=Math.cos(rot),s=Math.sin(rot),ring=Array.from({length:poly.o.length/2},(_,i)=>{
      const dx=poly.o[i*2]-x,dz=poly.o[i*2+1]-z;return [dx*c-dz*s,dx*s+dz*c];
    });
    const frontAt=u=>{let v=-Infinity;for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];if(Math.abs(b[0]-a[0])<.001)continue;const t=(u-a[0])/(b[0]-a[0]);if(t>=0&&t<=1)v=Math.max(v,a[1]+t*(b[1]-a[1]));}return Number.isFinite(v)?v:7.4;};
    const key='all-saints-pediment',ped=P.geometry(key,()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-3.25,6.65,0,3.25,6.65,0,0,8.50,0],3));g.computeVertexNormals();return g;});
    P.shape(key,ped,M.ivory,0,0,7.47,1,1,1,0,0,0,1250);
    for(const side of [-1,1])P.beam(M.ivory,[side*3.45,6.64,7.56],[0,8.63,7.56],.13,1100);
    for(const u of [-5.4,-3.4,3.4,5.4]) {
      const v=frontAt(u)+.10;
      P.box(M.ivory,u,3.65,v,.42,5.7,.30,1000);
      P.box(M.ivory,u,6.25,v,.66,.32,.53,950);
    }
    P.shape('chapel-dormer',P.geometry('chapel-dormer',()=>new THREE.CylinderGeometry(.91,.91,.65,20).rotateX(Math.PI/2)),M.roofDark,0,9.0,5.54,1,1,1,0,0,0,950);
    P.torus(M.memory,0,9.0,5.90,.74,.13,0,0,900);
    P.shape('chapel-oculus',P.geometry('chapel-oculus',()=>new THREE.CircleGeometry(.63,20)),M.glass,0,9.0,5.92,1,1,1,0,0,0,850);
    P.box(M.ivory,0,9.0,5.97,.055,1.22,.05,650);P.box(M.ivory,0,9.0,5.97,1.22,.055,.05,650);
    for(const u of face===2?[0]:[-4.25,0,4.25]) {
      const front=frontAt(u),door=face===2&&u===0;
      const pane=P.geometry('chapel-arched-pane',()=>{const s=new THREE.Shape();s.moveTo(-.65,0);s.lineTo(.65,0);s.lineTo(.65,2.5);s.absarc(0,2.5,.65,0,Math.PI,false);s.closePath();return new THREE.ShapeGeometry(s,12);});
      P.shape('chapel-arched-pane',pane,door?M.wood:M.glass,u,1.4,front+.04,1,1,1,0,0,0,800);
      P.shape('chapel-arch-trim',P.geometry('chapel-arch-trim',()=>new THREE.TorusGeometry(.72,.09,5,16,Math.PI)),M.memory,u,3.9,front+.08,1,1,1,0,0,0,750);
      for(const a of [-.72,.72])P.box(M.memory,u+a,2.65,front+.08,.13,2.5,.13,750);
      P.box(M.ivory,u,2.7,front+.1,.06,2.6,.06,650);
      for(const yy of [2.1,2.9,3.7])P.box(M.ivory,u,yy,front+.1,1.3,.06,.06,650);
    }
    P.pop();
  }
  P.cyl(M.ivory,0,10.75,0,1.2,1.0,1300);
  const dome=P.geometry('all-saints-cupola',()=>new THREE.LatheGeometry([[.75,11.1],[1.15,11.45],[1.42,12.15],[1.22,12.75],[.55,13.5],[.12,13.85],[0,13.9]].map(v=>new THREE.Vector2(...v)),16));
  P.shape('all-saints-cupola',dome,M.roofDark,0,0,0,1,1,1,0,0,0,1800);
  P.beam(M.gold,[0,13.8,0],[0,15.9,0],.055,1500);
  P.beam(M.gold,[-.52,15.24,0],[.52,15.24,0],.052,1500);
  P.beam(M.gold,[-.24,15.68,0],[.24,15.68,0],.045,1200);
  P.beam(M.gold,[-.27,14.55,0],[.27,14.38,0],.045,1200);
  // Western main entrance stair; no barriers around the adjoining pond.
  P.pop();addPolyColliders(ctx,poly,0,6.6,.35);
  svc.monuments.push({id:b.id,name:'Храм Всех Святых в земле Российской просиявших',x,z,h:15.9});
  svc.photoSpots.push({x:x-24,z:z+20,yaw:-50,pitch:12,name:'Всесвятская церковь в мемориальной зоне'});
}
