// Actual National Library meshes, physical openings and two-way stair walks.
// node tools/area.mjs moskovskaya tools/library-architecture-test.mjs
// --mutant-portico restores the former continuous front wall and must fail.
import assert from 'node:assert/strict';
import {buildWorld} from './lib/headless-world.mjs';
import {makeKit} from '../src/world/landmarksMoskovskaya/common.js';
import {library} from '../src/world/landmarksMoskovskaya/library.js';
import {LIBRARY_PLAN as A,LIBRARY_PIERS,LIBRARY_STEPS,libraryPoint} from '../src/world/landmarksMoskovskaya/library-plan.js';
import {Player} from '../src/core/player.js';
const {ctx,L,THREE,errors}=await buildWorld({modules:[]});assert.deepEqual(errors,[]);
const root=new THREE.Group(),svc={houses:[],monuments:[],photoSpots:[],entrances:[],parts:{},triangles:0};
const K=makeKit(ctx,root,svc),updates=ctx._updates.length;
K.begin();library(K,L.groupMembers('mz-library'));K.flush('library');ctx.addStatic(root);
assert.equal(ctx._updates.length,updates,'the building adds no frame callbacks');
assert(svc.parts.library.triangles<45000,'authored library geometry stays bounded');
ctx.staticRoot.updateMatrixWorld(true);
const meshes=[];ctx.staticRoot.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.name.startsWith('moskovsky-library'))meshes.push(o);});
const ray=new THREE.Raycaster();ray.layers.enableAll();
const hitAt=(x,z,y=40)=>{ray.set(new THREE.Vector3(x,y,z),new THREE.Vector3(0,-1,0));return ray.intersectObjects(meshes,false)[0];};
const ph=ctx.physics;
// Independent front-sided probes of the two photographed recessed portal
// windows: a narrow placeholder frame must not stand in for their glazing.
let portalWindows=0;
for(const [x,zs]of[[-1831,[7418.69,7421.55,7424.41]],[-1829.1,[7487.02,7489.75,7492.48]]])for(const z of zs)for(const y of[4.05,8.87,13.69]){
  ray.set(new THREE.Vector3(x+6,y,z),new THREE.Vector3(-1,0,0));
  const hit=ray.intersectObjects(meshes,false)[0];
  assert(hit&&Math.abs(hit.point.x-(x+.025))<.01,'portal must show its real recessed front-sided window');
  assert.equal(hit.object.material.color.getHexString(),'42606b','portal pane must show glazing rather than an unbroken dark frame');
  assert(ph.columnBlocked(x-.05,z,.04,y,y+.05),'recessed glass has its matching physical backing');portalWindows++;
}
if(process.argv.includes('--mutant-portico'))ph.addBox(-1812.5,A.z,1,36,0,A.floor,A.columnTop);
let bays=0,piers=0,drawProbes=0;
for(const c of LIBRARY_PIERS){
  assert(ph.columnBlocked(c.x,c.z,.2,A.floor,A.floor+1.7),'actual rectangular pier must stay solid');
  // A pier has a rectangular radial footprint: its two tangential corners
  // are present, rather than the old narrow four-sided cylindrical prop.
  for(const s of[-1,1]){
    const x=c.x+Math.cos(c.angle)*.5-Math.sin(c.angle)*s*.44,z=c.z+Math.sin(c.angle)*.5+Math.cos(c.angle)*s*.44;
    assert(ph.columnBlocked(x,z,.03,A.floor+.1,A.floor+1.1),'mapped pier corner lacks collision');piers++;
  }
}
for(let i=0;i+1<LIBRARY_PIERS.length;i++){
  const angle=(LIBRARY_PIERS[i].angle+LIBRARY_PIERS[i+1].angle)/2;
  for(const radius of[29.6,27,23]){
    const [x,,z]=libraryPoint(radius,angle,A.floor);
    assert(!ph.columnBlocked(x,z,.32,A.floor+.02,A.floor+1.72),`visible bay blocked at ${x},${z}`);
    assert(!L.insideBuilding(x,z,.32),'library datum blanket blocks an open bay');
    const hit=hitAt(x,z,A.floor+2);assert(hit&&Math.abs(hit.point.y-A.floor)<.025,'raised porch has no visible front-facing floor');
    assert(Math.abs(ph.groundHeight(x,z,A.floor+.1,false)-hit.point.y)<.025,'porch mesh and physical floor differ');
    drawProbes++;
  }
  const start=libraryPoint(32,angle,A.floor+1.2);
  ray.set(new THREE.Vector3(...start),new THREE.Vector3(-Math.cos(angle),0,-Math.sin(angle)));
  const obstruct=ray.intersectObjects(meshes,false)[0];
  assert(!obstruct||obstruct.distance>9,'visible front bay is filled by a wall/glazing mesh');
  bays++;
}
for(const s of LIBRARY_STEPS){
  const x=(s.x0+s.x1)/2;
  for(const dz of[-15,0,15]){
    const hit=hitAt(x,A.z+dz,4);assert(hit&&Math.abs(hit.point.y-s.y)<.025,'granite tread is missing or incorrectly wound');
    assert(Math.abs(ph.groundHeight(x,A.z+dz,4,false)-s.y)<.025,'stair collision does not match its tread');drawProbes++;
  }
}
for(const sign of[-1,1]){
  ray.set(new THREE.Vector3(-1810,.7,A.z+sign*17.6),new THREE.Vector3(0,0,-sign));
  const cap=ray.intersectObjects(meshes,false)[0];assert(cap&&Math.abs(cap.distance-.6)<.025,'raised apron has an invisible/open lateral retaining wall');
}
// Every authoritative courtyard hole remains open to the sky. Probe its
// interior grid independently rather than trusting the builder's metadata.
let holes=0,holeProbes=0;
const inside=(x,z,ring)=>{let yes=false;for(let i=0,j=ring.length-2;i<ring.length;j=i,i+=2){const ax=ring[i],az=ring[i+1],bx=ring[j],bz=ring[j+1];if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)yes=!yes;}return yes;};
const edgeDistance=(x,z,h)=>{let d=Infinity;for(let i=0;i<h.length;i+=2){const ax=h[i],az=h[i+1],dx=h[(i+2)%h.length]-ax,dz=h[(i+3)%h.length]-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));d=Math.min(d,Math.hypot(x-ax-t*dx,z-az-t*dz));}return d;};
for(const r of L.groupMembers('mz-library'))for(const p of r.polys)for(const h of p.h){
  holes++;const xs=h.filter((_,i)=>i%2===0),zs=h.filter((_,i)=>i%2);
  for(let x=Math.min(...xs)+.6;x<Math.max(...xs)-.6;x+=1.8)for(let z=Math.min(...zs)+.6;z<Math.max(...zs)-.6;z+=1.8){
    if(!inside(x,z,h)||edgeDistance(x,z,h)<.6)continue; // facade frames may project into the court
    const hit=hitAt(x,z);assert(!hit||hit.point.y<2.1,`mapped courtyard roof hole filled at ${x},${z}: ${hit?.point.y}`);holeProbes++;
  }
}
assert.equal(holes,10,'all source courtyard holes enter the audit');assert(holeProbes>300);
assert(svc.library.titleSegments>30,'continuous title follows the curved mapped frontage');
const titleMeshes=meshes.filter(m=>m.material.name==='mz-library-curved-title');assert.equal(titleMeshes.length,1,'the continuous title uses one material/atlas');
let mountedLetters=0;
for(const m of titleMeshes){const pos=m.geometry.attributes.position,norm=m.geometry.attributes.normal,idx=m.geometry.index;
  for(let i=0;i<(idx?.count||pos.count);i+=3){
    const ids=[0,1,2].map(j=>idx?idx.getX(i+j):i+j),point=new THREE.Vector3(),normal=new THREE.Vector3();
    for(const j of ids){point.add(new THREE.Vector3().fromBufferAttribute(pos,j));normal.add(new THREE.Vector3().fromBufferAttribute(norm,j));}
    point.multiplyScalar(1/3).applyMatrix4(m.matrixWorld);normal.normalize().transformDirection(m.matrixWorld);
    ray.set(point,normal.negate());const backing=ray.intersectObjects(meshes.filter(o=>!titleMeshes.includes(o)),false)[0];
    assert(backing&&backing.distance>.01&&backing.distance<.065,'curved lettering floats away from its actual mapped stone wall');mountedLetters++;
  }
}
// Ray through the actual vestibule must remain open below its transom.
assert(!ph.columnBlocked(-1862.8,A.z,.3,A.floor,A.floor+1.7),'recessed main entrance has a phantom door wall');
ray.set(new THREE.Vector3(-1859.5,A.floor+1.2,A.z),new THREE.Vector3(-1,0,0));
assert(ray.intersectObjects(meshes,false)[0]?.distance>8,'recessed entry opening has a phantom glazing mesh');
assert(ph.columnBlocked(-1870.15,A.z,.3,A.floor,A.floor+1.7),'the vestibule back wall is physically present');
let walkingSteps=0;
function walk(points){
  const p=new Player(new THREE.PerspectiveCamera(),{addEventListener(){},requestPointerLock(){}},ph,L.WORLD.play);
  p.enabled=true;p.clampXZ=L.clampToPlay;p.solidAt=L.insideBuilding;p.smoothing=0;p.setPose(points[0][0],points[0][1],0,0,points[0][0]<A.stairBack?A.floor:0,{stand:true});
  let rescues=0;p.onRescue=()=>rescues++;p.keys.add('KeyW');
  for(const goal of points.slice(1)){
    for(let f=0;f<1600;f++){
      const dx=goal[0]-p.pos.x,dz=goal[1]-p.pos.z;if(Math.hypot(dx,dz)<.13)break;
      p.yaw=Math.atan2(-dx,-dz);p.time+=1/60;p.update(1/60);walkingSteps++;
    }
    assert(Math.hypot(goal[0]-p.pos.x,goal[1]-p.pos.z)<.2,`library route blocked toward ${goal}; reached ${p.pos.x},${p.pos.y},${p.pos.z}`);
  }
  p.keys.clear();p.vel.set(0,0,0);for(let f=0;f<60;f++){p.time+=1/60;p.update(1/60);}
  assert.equal(rescues,0,'library climb requires rescue');return p;
}
const path=[[-1795,A.z+4.3],[-1809,A.z+4.3],[-1817,A.z+4.3],[-1845,A.z+4.3],[-1858,A.z],[-1867,A.z]];
const up=walk(path);assert(Math.abs(up.pos.y-A.floor)<.05,'entrance floor must support the walker');
const down=walk(path.slice().reverse());assert(Math.abs(down.pos.y)<.05,'the broad descent must return to street level');
console.log(`Library architecture PASS: ${svc.parts.library.triangles} triangles,${meshes.length} material/range meshes,${bays} open bays,${piers} rectangular corner probes,${drawProbes} floor/tread rays,${holes} open source courts/${holeProbes} independent sky probes,${mountedLetters} attached title triangles,${portalWindows} recessed portal panes,${walkingSteps} real player steps; zero frame callbacks.`);
