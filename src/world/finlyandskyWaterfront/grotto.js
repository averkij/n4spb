import * as THREE from 'three';
import { GROTTO, SPHINXES, VASES, point } from './sites.js';
import { makeKit, UPPER_Y, LOWER_Y } from './kit.js';
import { registerLOD } from '../../core/spatial.js';
import { archPath, rectPath } from '../landmarksD/kit.js';
import { knockBays } from '../lib/fence-bays.js';
import { sphinx, lionMask } from './sphinx.js';

function local(x,z){const dx=x-GROTTO.x,dz=z-GROTTO.z,c=Math.cos(GROTTO.rot),s=Math.sin(GROTTO.rot);return[dx*c-dz*s,dx*s+dz*c];}
export function buildGrotto(ctx,root,M,svc){
  const K=makeKit(ctx,root,GROTTO,M),{P,D}=K;
  // Four sphinx positions, six vases and both side flights are survey points.
  // The centre is the face of the mapped 70m2 underground grotto, not the
  // estate building opposite the embankment road.
  K.slab(-16.5,16.5,-12,-10.9,UPPER_Y,-.25);
  K.polygon([[-16.5,-10.9],[-8.2,-10.9],[-7.84,2.9],[-16.5,2.9]],UPPER_Y,LOWER_Y-.3);
  K.polygon([[9.2,-10.9],[16.5,-10.9],[16.5,2.9],[8.7,2.9]],UPPER_Y,LOWER_Y-.3);
  K.slab(-4.9,5.8,-10.9,-8.1,UPPER_Y,LOWER_Y-.3);
  // A continuous low foundation closes every strip beside the old flight
  // cheeks, while the arch remains hollow above its chamber floor.
  K.slab(-16.5,16.5,-12,15,LOWER_Y,LOWER_Y-.36);
  // Measured side flights (OSM w174641823 / w174641825), broad and symmetric
  // in their architectural role but retain their slightly different bearings.
  K.stairs(local(2710,-2896.4),local(2705.1,-2883.6),3.2);
  K.stairs(local(2723,-2890.9),local(2717.4,-2878.6),3.2);
  // A walkable roof over a hollow vaulted chamber. The visible arch is an
  // actual hole, with granite voussoirs and depth behind the barred entrance.
  K.slab(-4.60,4.60,-8.1,0,UPPER_Y,-.20);
  const shape=new THREE.Shape();rectPath(shape,-4.60,LOWER_Y,4.60,-.20);
  const opening=new THREE.Path();archPath(opening,0,LOWER_Y-.02,3.20,.16,true);shape.holes.push(opening);
  P.extrude(M.wall,shape,-.60,.60,2.2,14);
  D.cyl(M.coping,[-4.8,-.07,.06],[4.8,-.07,.06],.16,.16,12);
  lionMask().place(D,{main:M.figure,dark:M.figureDark},0,-.29,.19,0,1);
  // Massive end piers remain part of the fixed monument. Above their foot
  // level the separate railing panels can topple to open a route to the river.
  K.physical(-3.10,-.30,3.0,.60,LOWER_Y,-.20);K.physical(3.10,-.30,3.0,.60,LOWER_Y,-.20);
  K.wall(-4.6,-8.1,-4.6,0,-.20,LOWER_Y-.2,.48);K.wall(4.6,0,4.6,-8.1,-.20,LOWER_Y-.2,.48);K.wall(-4.6,-8.1,4.6,-8.1,-.20,LOWER_Y-.2,.40);
  // Inward-facing barrel vault closes the chamber above the gate. An upward
  // roof plane alone would disappear from below and expose sky in the arch.
  for(let i=0;i<14;i++){
    const a=i*Math.PI/14,b=(i+1)*Math.PI/14,r=1.60,y=LOWER_Y+.14;
    const p=[Math.cos(a)*r,y+Math.sin(a)*r],q=[Math.cos(b)*r,y+Math.sin(b)*r];
    P.quad(M.dark,[...p,-.60],[...q,-.60],[...q,-8.05],[...p,-8.05],[-Math.cos((a+b)/2),-Math.sin((a+b)/2),0],[[a,0],[b,0],[b,7.45],[a,7.45]]);
  }
  for(let i=0;i<11;i++){
    const a=i*Math.PI/11,b=(i+1)*Math.PI/11,ri=1.60,ro=1.78,y=LOWER_Y+.14;
    D.fan(i%2?M.stepA:M.coping,[[Math.cos(a)*ri,y+Math.sin(a)*ri,.025],[Math.cos(a)*ro,y+Math.sin(a)*ro,.025],[Math.cos(b)*ro,y+Math.sin(b)*ro,.025],[Math.cos(b)*ri,y+Math.sin(b)*ri,.025]],[0,0,1]);
  }
  // The arched iron gate uses one knockable panel; it never leaves an
  // unbreakable invisible wall across the hollow opening.
  const geo=new THREE.BufferGeometry(),positions=[],indices=[];
  const bar=(x0,x1,y0,y1)=>{const n=positions.length/3;positions.push(x0,y0,0,x1,y0,0,x1,y1,0,x0,y1,0);indices.push(n,n+1,n+2,n,n+2,n+3);};
  for(let i=-7;i<=7;i++){const x=i*.205,h=.14+Math.sqrt(Math.max(0,1.60**2-x*x));bar(x-.012,x+.012,0,h-.03);}
  for(const y of[.18,.70,1.13])bar(-1.50,1.50,y,y+.035);
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
  const iron=ctx.mat.toon('#272e2a',{name:'finlyandsky-grotto-gate',side:'double',paint:.015});
  const ga=point(GROTTO,-1.60,.10),gb=point(GROTTO,1.60,.10);
  // Geometry x is already full-size, place at the bay middle, not stretched.
  knockBays(ctx,{name:'bezborodko-grotto-gate',bays:[{x0:ga[0],z0:ga[1],x1:gb[0],z1:gb[1],y:LOWER_Y}],parts:[{geo,mat:iron,at:'mid'}],collider:{y0:LOWER_Y,y1:LOWER_Y+1.74,thick:.10},rec:{kind:'fence',mass:36,h:1.74,anchored:8,hitK:.65,metal:true,minDv:0},far:260});
  // Root's continuous lower promenade joins at-2.0m. The surveyed two side
  // flights are retained; no invented staircase is put on the Neva frontage.
  for(const span of[[-16.5,-3.2],[3.2,16.5]]){K.wall(span[0],15,span[1],15,LOWER_Y);K.parapet([span[0],14.8],[span[1],14.8],LOWER_Y,.68);}
  K.rail([-16.3,2.75],[-7.85,2.75]);K.rail([8.72,2.75],[16.3,2.75]);
  for(const side of[-1,1]){
    K.wall(side*16.5,2.9,side*16.5,15,LOWER_Y);K.wall(side*16.5,-12,side*16.5,2.9,UPPER_Y-.03);
    K.rail([side*16.35,-11.8],[side*16.35,2.7]);
    K.rail([side*4.5,-7.9],[side*4.5,-.10]);
  }
  K.rail([-4.45,-.10],[4.45,-.10]);
  // Monumental sculpture and urns are fixed architecture, not loose props.
  const figure=sphinx(),matrices=[];
  for(const s of SPHINXES){
    const[u,v]=local(s.x,s.z),y=s.low?LOWER_Y:UPPER_Y;
    P.box(M.coping,u-1.12,u+1.12,y,y+.17,v-.72,v+.72,'b');P.box(M.wall,u-.97,u+.97,y+.17,y+.94,v-.58,v+.58,'b',2.2);P.box(M.coping,u-1.10,u+1.10,y+.94,y+1.10,v-.70,v+.70,'b');
    K.physical(u,v,2.24,1.44,y,y+1.10);
    // The actual paired sculptures look inward along the quay, toward one
    // another, rather than all looking out over the Neva.
    const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),GROTTO.rot+(u<0?Math.PI/2:-Math.PI/2));
    matrices.push(new THREE.Matrix4().compose(new THREE.Vector3(s.x,y+1.10,s.z),q,new THREE.Vector3(1,1,1)));
  }
  for(const[key,g]of Object.entries(figure.geos)){
    const mesh=new THREE.InstancedMesh(g,key==='dark'?M.figureDark:M.figure,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.name='bezborodko-four-sphinxes';mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.computeBoundingBox();root.add(mesh);registerLOD(mesh,360);
  }
  const urn=new THREE.LatheGeometry([[.0,0],[.20,0],[.24,.06],[.21,.12],[.12,.17],[.11,.28],[.22,.37],[.31,.55],[.34,.69],[.36,.72],[.36,.79],[.28,.80],[.24,.72],[.0,.64]].map(p=>new THREE.Vector2(...p)),16),um=[];
  for(const v of VASES){const[u,w]=local(v.x,v.z);P.box(M.coping,u-.36,u+.36,UPPER_Y,UPPER_Y+.14,w-.36,w+.36,'b');P.box(M.wall,u-.28,u+.28,UPPER_Y+.14,UPPER_Y+.68,w-.28,w+.28,'b',2.2);um.push(new THREE.Matrix4().makeTranslation(v.x,UPPER_Y+.68,v.z));K.physical(u,w,.72,.72,UPPER_Y,UPPER_Y+.68);}
  const urnMesh=new THREE.InstancedMesh(urn,M.figure,um.length);um.forEach((m,i)=>urnMesh.setMatrixAt(i,m));urnMesh.name='bezborodko-six-granite-vases';urnMesh.castShadow=urnMesh.receiveShadow=true;urnMesh.computeBoundingSphere();urnMesh.computeBoundingBox();root.add(urnMesh);registerLOD(urnMesh,320);
  svc.sites.push({id:GROTTO.id,x:GROTTO.x,z:GROTTO.z,lowerY:LOWER_Y,sphinxes:4,vases:6,flights:2});
  svc.monuments.push({id:'r7357196',name:'Пристань с гротом и сфинксами',x:GROTTO.x,z:GROTTO.z,h:2.4});
  svc.photoSpots.push({name:'Грот дачи Безбородко',x:2698,z:-2822,yaw:-12.7,pitch:7});
  svc.triangles+=K.finish()+figure.tris*4+urn.index.count/3*6;
}
