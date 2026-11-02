// Real pilotis walking/collisions and deterministic, bounded fountain buffers.
// node tools/area.mjs moskovskaya tools/basseynaya-water-test.mjs
import assert from 'node:assert/strict';
import {buildWorld} from './lib/headless-world.mjs';
import {Player} from '../src/core/player.js';
import {planParking} from '../src/world/streets/parking.js';
const {ctx,L,THREE,errors}=await buildWorld({modules:['landmarksMoskovskaya']});
assert.deepEqual(errors,[]);
// The source lot crosses the pilotis footprint. Its generated cars must not
// replace the removed wall with a row of solid vehicles across the passage.
const parking=planParking({ways:[],cover:()=>-1}); // test the mapped lot, independently of road pockets
assert(!parking.some(s=>Math.abs(s.x+1232.9)<3.3&&s.z>7664&&s.z<7688),'mapped lot blocks the photographed walking corridor');
assert(!parking.some(s=>Math.abs(s.x+1263)<3.3&&s.z>7664&&s.z<7688),'mapped lot blocks the second pilotis corridor');
const svc=ctx.services.landmarksMoskovskaya,ph=ctx.physics;
assert(svc.basseynaya.columns.length>=30);
for(const c of svc.basseynaya.columns)assert(ph.columnBlocked(c.x,c.z,.1,.1,1.8),'drawn column lacks collision');
for(const x of[-1232.9,-1263])for(const sign of[-1,1]){
 const start=sign===1?7665:7694,end=sign===1?7694:7665;
 const p=new Player(new THREE.PerspectiveCamera(),{addEventListener(){},requestPointerLock(){}},ph,L.WORLD.play);
 p.enabled=true;p.smoothing=0;p.clampXZ=L.clampToPlay;p.solidAt=L.insideBuilding;p.setPose(x,start,sign===1?180:0,0);p.keys.add('KeyW');
 let rescue=0;p.onRescue=()=>rescue++;
 for(let i=0;i<700;i++){if(Math.abs(p.pos.z-end)<.14)break;p.yaw=Math.atan2(x-p.pos.x,p.pos.z-end);p.time+=1/60;p.update(1/60);}
 assert(Math.abs(p.pos.z-end)<.2&&Math.abs(p.pos.x-x)<.2,'actual player cannot cross the open ground storey');assert.equal(rescue,0);assert(Math.abs(p.pos.y)<.03);
 assert(!L.insideBuilding(x,7678,.32),'blanket footprint blocks the pilotis');
 assert.equal(ph.groundHeight(x,7678,36.6,false),36.5,'pilotis still has a walkable roof');
}
assert(ph.columnBlocked(-1248,7677,.2,.1,1.8),'stair cores must remain physical');
const meshes=ctx.dynamicRoot.children.filter(m=>m.name.startsWith('rnb-water-'));
assert.equal(meshes.length,4);
ctx.camera.position.set(-1760,2,7456);
const tick=t=>{for(const fn of ctx._updates)fn(0,t);};
tick(3);const first=meshes.map(m=>Array.from(m.instanceMatrix.array));
tick(3.7);assert(meshes.some((m,k)=>m.instanceMatrix.array.some((v,i)=>v!==first[k][i])),'fountain remains static');
tick(3);for(let k=0;k<meshes.length;k++)assert.deepEqual(Array.from(meshes[k].instanceMatrix.array),first[k],'time must determine the same animation');
for(const m of meshes){assert.equal(m.instanceMatrix.usage,THREE.DynamicDrawUsage);assert(!m.castShadow);const mat=new THREE.Matrix4(),v=new THREE.Vector3();for(let i=0;i<m.count;i++){m.getMatrixAt(i,mat);v.setFromMatrixPosition(mat);assert(m.boundingSphere.containsPoint(v),'animation escaped conservative culling bounds');}}
ctx.shared.uNight.value=1;tick(5);assert.equal(svc.libraryFountain.animation.night,1);assert(meshes.find(m=>m.name==='rnb-water-uplights').material.opacity>.2);
ctx.shared.uNight.value=0;ctx.shared.uSunDir.value.y=.1;tick(5);assert(svc.libraryFountain.animation.night>.2,'evening must illuminate water too');
const before=meshes.map(m=>m.instanceMatrix.version);ctx.camera.position.set(500,2,150);tick(10);assert(!svc.libraryFountain.animation.active);assert(meshes.every((m,i)=>!m.visible&&m.instanceMatrix.version===before[i]),'distant fountains still upload buffers');
console.log('PASS Basseynaya: four real player crossings, columns/cores and roof; fountain motion, deterministic time, evening/night glow, bounds and distant update suppression.');
