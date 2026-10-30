import * as THREE from 'three';
import { roadClear } from './common.js';

// A fluted cross-section produces the shaft's own shadows. Separate dark rods
// on a cylinder caused intermittent coplanar flecks in the close-up diagnostic.
const SHAFT=(()=>{const n=100,pos=[],idx=[];for(let j=0;j<=4;j++){const t=j/4;for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,r=(1.05-.19*t)*(1-.036*(1+Math.cos(a*20)));pos.push(Math.sin(a)*r,t*14.77,Math.cos(a)*r);}}
  for(let j=0;j<4;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;idx.push(a,a+1,b,a+1,b+1,b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(pos.length/3*2),2));g.computeVertexNormals();g.computeBoundingSphere();return g;})();

// Stasov / Orlovsky: a twelve-column propylon, not a rounded triumphal arch.
export function gate(K, rec) {
  if(!rec)return;
  const {ctx,svc}=K,M={...K.mats,bronze:ctx.mat.toon('#718676',{paint:.02})},x=rec.x??rec.cx,z=rec.z??rec.cz;
  const ring=rec.polys?.[0]?.o||[],edges=[];for(let i=0;i<ring.length;i+=2){const j=(i+2)%ring.length,dx=ring[j]-ring[i],dz=ring[j+1]-ring[i+1];edges.push({dx,dz,len:Math.hypot(dx,dz)});}
  const axis=edges.sort((a,b)=>b.len-a.len)[0];let rot=axis?Math.atan2(-axis.dz,axis.dx):0;if(Math.cos(rot)<0)rot+=Math.PI;
  K.body.push(x,0,z,rot);K.detail.push(x,0,z,rot);
  const B=K.body,D=K.detail;
  for(const u of [-15,-11.1,-5.5,5.5,11.1,15])for(const v of [-2.8,2.8]){
    const wx=x+Math.cos(rot)*u+Math.sin(rot)*v,wz=z-Math.sin(rot)*u+Math.cos(rot)*v;
    if(!roadClear(ctx,wx,wz,1.84))throw new Error(`Moscow Gate column intersects carriageway at ${wx},${wz}; check island OSM surface`);
    B.box(M.granite,u-1.3,u+1.3,.04,.48,v-1.3,v+1.3);
    B.geo(M.bronze,SHAFT,u,.48,v);
    B.col(M.bronze,u,v,15.1,15.65,.93,1.27,24);
    B.box(M.bronze,u-1.36,u+1.36,15.65,16.15,v-1.36,v+1.36);
    ctx.physics.addCylinder(wx,wz,1.32,0,16.15);
  }
  B.box(M.bronze,-18.135,18.135,16.15,17.3,-4.08,4.08);
  B.box(M.bronze,-18.135,18.135,17.3,20.4,-4.05,4.05);
  B.box(M.bronze,-18.42,18.42,20.4,20.92,-4.265,4.265);
  B.box(M.bronze,-18.0,18.0,20.92,21.68,-3.88,3.88);
  for(const side of [-1,1]){
    D.push(0,0,side*4.10,side<0?Math.PI:0);
    // Thirty high relief figures in total. Shields and paired wings are separate
    // shallow solids; no banners, flags, or flag-shaped trophy geometry.
    for(let i=0;i<15;i++){
      const u=(i-7)*2.33;
      D.col(M.bronze,u,.15,17.4,19.1,.28,.36,7);
      D.geo(M.bronze,new THREE.SphereGeometry(.25,8,5),u,19.4,.25);
      D.cyl(M.bronze,[u-.26,18.85,.22],[u-.65,18.3,.42],.12,.095,6);
      D.cyl(M.bronze,[u+.26,18.85,.22],[u+.65,18.3,.42],.12,.095,6);
      D.geo(M.bronze,new THREE.SphereGeometry(.48,8,5),u,18.15,.46,0,0,0,1,1.05,.32);
      for(const s of [-1,1])for(let k=0;k<3;k++)D.cyl(M.bronze,[u+s*.18,19.08,.18],[u+s*(.72+k*.12),19.62-k*.28,.18],.14,.05,5);
    }
    D.pop();
  }
  // Low military trophies: helmet, cuirass, crossed barrels and shield clusters.
  for(const u of [-15,-10,10,15])for(const v of [-2.75,2.75]){
    B.geo(M.bronze,new THREE.SphereGeometry(.6,10,6),u,22.15,v,0,0,0,1,.7,1);
    D.col(M.bronze,u,v,21.7,22.6,.48,.34,8);
    D.cyl(M.bronze,[u-.8,21.65,v-.5],[u+.8,23.3,v+.5],.1,.07,6);
    D.cyl(M.bronze,[u+.8,21.65,v-.5],[u-.8,23.3,v+.5],.1,.07,6);
    D.geo(M.bronze,new THREE.SphereGeometry(.72,8,5),u,22.4,v+.66,0,0,0,1,.85,.25);
  }
  K.body.pop();K.detail.pop();
  K.label(rec.id,'ПОБѢДОНОСНЫМЪ РОССІЙСКИМЪ ВОЙСКАМЪ',x,21.16,z+3.94,22,.38,rot);
  svc.monuments.push({id:rec.id,name:'Московские триумфальные ворота',x,z,h:23.74});
  svc.photoSpots.push({name:'Московские триумфальные ворота',x:x+34,z:z+35,yaw:45});
}
