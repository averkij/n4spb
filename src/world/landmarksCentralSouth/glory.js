// Column of Glory beside Trinity, at OSM n808014174. Five rings of captured cannon barrels,
// granite pedestal, winged bronze figure. Immutable instances with explicit aggregate bounds.
import * as THREE from 'three';
import { registerLOD } from '../../core/spatial.js';
import { submit } from './common.js';
const X=-2470.7444,Z=1777.2192;
export function buildGlory(K,root){
  const ctx=K.ctx,net=ctx.services.streets?.net;
  // The 7.6 m square base has a 5.4 m circumradius; include a half-metre asphalt clearance.
  if(net ? net.cover(X,Z,{})>=-5.9 : K.L.isOnRoad(X,Z,5.9))return;
  const P=K.P,stone=K.wall('#8d7972'),bronze=K.wall('#536052'),gold=K.wall('#b4a779');
  K.begin();
  P.box(stone,X-3.8,X+3.8,0,.34,Z-3.8,Z+3.8,'b');
  P.box(stone,X-3.4,X+3.4,.34,.72,Z-3.4,Z+3.4,'b');
  P.box(stone,X-2.7,X+2.7,.72,3.5,Z-2.7,Z+2.7,'b');
  P.box(stone,X-3.0,X+3.0,3.5,4.0,Z-3.0,Z+3.0,'b');
  P.cyl(bronze,[X,4,Z],[X,23.5,Z],1.82,1.07,24,true);
  for(let i=0;i<=5;i++)P.cyl(bronze,[X,4.05+i*3.9,Z],[X,4.45+i*3.9,Z],2.03-i*.145,2.03-i*.145,28,true);
  P.cyl(bronze,[X,23.9,Z],[X,24.5,Z],1.3,1.5,24,true);
  // Readable winged Victory: draped lower body, head, bent arm and wreath, two feathered wings.
  P.geo(gold,new THREE.SphereGeometry(1,12,10),X,25.3,Z,0,0,0,.45,1.05,.33);
  P.cyl(gold,[X,24.45,Z],[X,25.5,Z],.65,.4,14,true);
  P.geo(gold,new THREE.SphereGeometry(.25,12,8),X,26.55,Z,0,0,0,1,1.18,1);
  P.cyl(gold,[X+.30,25.8,Z],[X+1.0,26.7,Z],.12,.09,8,true);
  P.geo(gold,new THREE.TorusGeometry(.36,.065,6,18),X+1.17,27.0,Z,0,0,0);
  P.cyl(gold,[X-.32,25.7,Z],[X-.8,24.9,Z],.12,.08,8,true);
  for(const side of [-1,1])for(let i=0;i<7;i++)P.cyl(gold,[X+side*.26,25.7,Z-.18],[X+side*(.8+i*.13),26.6+i*.11,Z-.42-i*.05],.12,.018,6,true);
  submit(K,root,'trinity-column-glory');
  const counts=[32,28,26,24,18],geo=new THREE.CylinderGeometry(.21,.28,3.55,8,1,false);
  const barrels=new THREE.InstancedMesh(geo,bronze,128);barrels.name='trinity-column-cannon-barrels';
  const transform=new THREE.Object3D();let n=0;
  for(let row=0;row<counts.length;row++)for(let i=0;i<counts[row];i++){
    const a=i/counts[row]*Math.PI*2,R=1.90-row*.14;
    transform.position.set(X+Math.sin(a)*R,6.2+row*3.9,Z+Math.cos(a)*R);transform.rotation.set(0,a,0);transform.updateMatrix();barrels.setMatrixAt(n++,transform.matrix);
  }
  barrels.instanceMatrix.needsUpdate=true;barrels.computeBoundingBox();barrels.computeBoundingSphere();barrels.castShadow=true;barrels.receiveShadow=true;
  root.add(barrels);root.updateMatrixWorld(true);registerLOD(barrels,900);K.tris+=geo.index.count/3*128;
  ctx.physics.addBox(X,Z,5.5,5.5,0,0,4);
  K.svc.monuments.push({id:'n808014174',name:'Колонна Славы',x:X,z:Z,h:27.5,r:4});
}
