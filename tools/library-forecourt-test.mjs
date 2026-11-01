// Real shallow-water walking and knock fixtures; no GPU or bake.
// node tools/area.mjs moskovskaya tools/library-forecourt-test.mjs
import assert from 'node:assert/strict';
import {buildWorld} from './lib/headless-world.mjs';
import {makeKit,roadClear} from '../src/world/landmarksMoskovskaya/common.js';
import {libraryForecourt,FORECOURT_POOL,forecourtContains,FORECOURT_SOURCE_FOUNTAINS,FORECOURT_MONUMENT_IDS} from '../src/world/landmarksMoskovskaya/library-forecourt.js';
import {Player} from '../src/core/player.js';
const integrated=process.argv.includes('--integrated');
const {ctx,L,THREE,errors}=await buildWorld({modules:integrated?['environment','streets','city','landmarksMoskovskaya']:['environment','streets']});assert.deepEqual(errors,[]);
let svc=ctx.services.landmarksMoskovskaya;
if(!integrated){const root=new THREE.Group();svc={monuments:[],photoSpots:[],parts:{},triangles:0};const K=makeKit(ctx,root,svc);K.begin();libraryForecourt(K);K.flush('library-forecourt-test');ctx.addStatic(root);}
const ph=ctx.physics;
assert.equal(svc.libraryFountain.bowls.length,6);assert(svc.monuments.some(m=>m.id==='n14090538301'));assert(svc.monuments.some(m=>m.id==='n14090538201'));
assert.equal(ph.waterLevel(-1777,7458.2),.24,'main basin must have native shallow water');
assert(Math.abs(ph.groundHeight(-1777,7458.2,.3,false)-.16)<.001,'basin has its drawn shallow floor');
for(const b of svc.libraryFountain.bowls){assert.equal(ph.waterLevel(b.x,b.z),b.h-.14,'upper bowls must register before underlying main pool');assert(Math.abs(ph.groundHeight(b.x,b.z,3,false)-(b.h-.24))<.001,'upper bowl has a shallow floor');}
assert.equal(ph.waterLevel(-1784,7458.2),null,'forecourt is dry outside the mapped pool');
if(integrated)for(const id of [...FORECOURT_SOURCE_FOUNTAINS,...FORECOURT_MONUMENT_IDS])assert(L.isClaimed(id),'mapped predecessor/monument record has landmark ownership '+id);
ctx.staticRoot.updateMatrixWorld(true);const owned=[];ctx.staticRoot.traverse(m=>{if(m.isMesh&&m.name.startsWith('moskovsky-library-forecourt'))owned.push(m);});
const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
let pedestalRays=0;
for(const b of svc.libraryFountain.bowls){
 assert(ph.columnBlocked(b.x,b.z,.02,.30,.40),'actual tapered masonry blocks a low body inside its support');
 assert(!ph.columnBlocked(b.x+b.r*.30+.12,b.z,.02,.30,.40),'the low body remains free outside the drawn pedestal');
 const body={x:b.x,z:b.z};ph.resolve(body,.05,.18,.30);assert(Math.hypot(body.x-b.x,body.z-b.z)>.1,'a body is pushed out of the physical stem at basin level');
 for(const rr of[.20,.255,.29])for(let j=0;j<8;j++){
  const a=j*Math.PI/4+.071,x=b.x+b.r*rr*Math.cos(a),z=b.z+b.r*rr*Math.sin(a),y=ph.groundHeight(x,z,.24,false);
  ray.set(new THREE.Vector3(x,.71,z),down);const hits=ray.intersectObjects(owned,false);
  assert(hits.some(h=>Math.abs(h.point.y-y)<.001),'tapered physical support matches an independently ray-tested drawn face');pedestalRays++;
 }
}
let dryFloorProbes=0;for(let x=-1811.8;x< -1734;x+=1.7)for(let z=7400.3;z<7507;z+=1.7)if(forecourtContains(x,z)){assert(ph.groundHeight(x,z,10,false)>=.14,'owned plaza/grass has a physical floor after generic ground removal: '+x+','+z);ray.set(new THREE.Vector3(x,.23,z),down);assert(ray.intersectObjects(owned,false).some(h=>h.point.y>=.14),'exact authored paving/grass/basin floor has no unpainted gap: '+x+','+z);dryFloorProbes++;}
function walk(start,end){const p=new Player(new THREE.PerspectiveCamera(),{addEventListener(){},requestPointerLock(){}},ph,L.WORLD.play);p.enabled=true;p.smoothing=0;p.clampXZ=L.clampToPlay;p.solidAt=L.insideBuilding;p.setPose(...start,0,0);p.keys.add('KeyW');let rescues=0;p.onRescue=()=>rescues++;
 for(let f=0;f<600;f++){const dx=end[0]-p.pos.x,dz=end[1]-p.pos.z;if(Math.hypot(dx,dz)<.13)break;p.yaw=Math.atan2(-dx,-dz);p.time+=1/60;p.update(1/60);}
 assert.equal(rescues,0);assert(Math.hypot(p.pos.x-end[0],p.pos.z-end[1])<.2,'actual player must cross the coping in both directions');return p;
}
walk([-1784,7458.2],[-1777,7458.2]);walk([-1777,7458.2],[-1784,7458.2]);
for(const[b,start]of[[svc.libraryFountain.bowls[0],-1780],[svc.libraryFountain.bowls[1],-1749.3]]){
 const p=walk([start,b.z],[b.x,b.z]);assert(Math.abs(p.pos.y-(b.h-.24))<.1,'actual player climbs the drum treads into its upper shallow water');
 walk([b.x,b.z],[start,b.z]);
}
for(const kind of['benches','lamps','bins','urns']){
 for(const rec of svc.libraryFixtures[kind])for(const item of rec?.items||[]){const c=Math.cos(item.rotY||0),s=Math.sin(item.rotY||0),hw=item.hw||item.r,hd=item.hd||item.r;for(const dx of[-hw,0,hw])for(const dz of[-hd,0,hd])assert(roadClear(ctx,item.cx+c*dx+s*dz,item.cz-s*dx+c*dz),kind+' footprint overlaps a real carriageway');}
 const rec=svc.libraryFixtures[kind].find(Boolean);assert(rec,kind+' registered through shared knock');assert(rec.items.length);ctx.knock.snap(rec);assert(rec.items.every(i=>i.dead),'impact removes upright '+kind+' colliders');
}
console.log(JSON.stringify({integrated,triangles:svc.parts['library-forecourt']?.triangles||svc.triangles,dryFloorProbes,pedestalRays,basinVertices:FORECOURT_POOL.length/2,bowls:6,statues:svc.monuments.filter(m=>FORECOURT_MONUMENT_IDS.includes(m.id)).length,fixtures:Object.fromEntries(Object.entries(svc.libraryFixtures).map(([k,v])=>[k,v.length]))}));
console.log('PASS native shallow basin/upper bowls, real player enters/exits, shared furniture impacts.');

