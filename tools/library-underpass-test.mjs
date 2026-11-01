// Real six-mouth crossing: stairs, finite slabs, road above and knock rails.
// node tools/area.mjs moskovskaya tools/library-underpass-test.mjs [--integrated]
// --mutant-solid-deck fills the space below the road and must fail.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { makeKit } from '../src/world/landmarksMoskovskaya/common.js';
import { libraryUnderpass } from '../src/world/landmarksMoskovskaya/library-underpass.js';
import { UNDERPASS_STAIRS as STAIRS, UNDERPASS_GROUND_HOLES as HOLES, UNDERPASS_FLOOR as FY,
  UNDERPASS_PAVILIONS, UNDERPASS_BUILDING_IDS, UNDERPASS_TUNNEL as T } from '../src/world/landmarksMoskovskaya/library-underpass-plan.js';
import { Player } from '../src/core/player.js';
import { createHandling } from '../src/world/drive/handling.js';
import { createZones } from '../src/core/zones.js';
import { mainModules } from './modules-list.mjs';
const integrated=process.argv.includes('--integrated');
const {ctx,L,THREE,errors}=await buildWorld({modules:[]});
assert.deepEqual(errors,[]);
ctx.sky.mesh=new THREE.Group();
const zones=createZones({scene:ctx.scene,camera:ctx.camera,sky:ctx.sky,pipeline:{},shared:ctx.shared,staticRoot:ctx.staticRoot,dynamicRoot:ctx.dynamicRoot,indoor:ctx.indoor,heightAt:L.heightAt});
ctx.zones=process.argv.includes('--mutant-no-reveal')?{...zones,reveal:()=>({remove(){}})}:zones;
if(integrated){
  ctx.buildList=mainModules().filter(n=>['environment','streets','city','landmarksMoskovskaya'].includes(n));
  for(const name of ctx.buildList)await(await import('../src/world/'+name+'.js')).build(ctx);
}
if(!integrated){
  const root=new THREE.Group(),svc={houses:[],monuments:[],photoSpots:[],entrances:[],parts:{},triangles:0};
  const K=makeKit(ctx,root,svc);K.begin();libraryUnderpass(K);K.flush('underpass');ctx.addStatic(root);ctx.services.landmarksMoskovskaya=svc;
}
const svc=ctx.services.landmarksMoskovskaya?.libraryUnderpass,ph=ctx.physics;
assert(svc,'real underpass builder must be integrated');
assert.equal(svc.stairs.length,6);assert.equal(svc.pavilions.length,2);
const under=ctx.staticRoot.getObjectByName('library-underpass-below');assert(under);
const unrelated=new THREE.Group();unrelated.userData.undergroundOnly=true;unrelated.userData.zone='unrelated-tunnel-test';ctx.addStatic(unrelated);
zones.refresh();
ctx.camera.position.set(-1735.5,1.5,7398.9);zones.update(0);
assert(under.visible,'reported west street camera must see stairs through the ground cut');
assert(!unrelated.visible,'entrance reveal must not enable unrelated underground groups');
for(const s of STAIRS)for(const distance of [1,4]){
  ctx.camera.position.set(s.high[0]-s.tx*distance,1.5,s.high[1]-s.tz*distance);zones.update(0);
  assert(under.visible,`${s.id} approach must reveal its actual staircase`);
}
ctx.camera.position.set(-1850,1.5,7500);zones.update(0);assert(!under.visible,'crossing is hidden outside its local approaches');
if(process.argv.includes('--mutant-solid-deck'))svc.deck.y0=-300;
const meshes=[];ctx.staticRoot.updateMatrixWorld(true);ctx.staticRoot.traverse(o=>{
  // Lamp-pool/sign/glass decals do not form a physical floor. Their transparent
  // triangles can span the ray despite having no opaque surface or collider.
  const mats=Array.isArray(o.material)?o.material:[o.material];
  if(o.isMesh&&mats.every(m=>m&&!m.transparent&&m.depthWrite!==false))meshes.push(o);
});
const ray=new THREE.Raycaster();ray.layers.enableAll();let mouthRays=0,stepRays=0,walkingFrames=0,walkingRoutes=0;
for(const s of STAIRS){
  assert(ph.inHole(s.x,s.z),'physics stair mouth is genuinely open');
  if(integrated)assert(L.GROUND_HOLES.some(h=>h.id==='library-underpass-'+s.id),'same hole clips ground and surface paving');
  ray.set(new THREE.Vector3(s.x,.3,s.z),new THREE.Vector3(0,-1,0));
  const hit=ray.intersectObjects(meshes,false)[0];assert(hit&&hit.point.y<-.5,`surface ground or paving covers ${s.id}`);mouthRays++;
  if(integrated)for(const t of [.10,.25,.40,.50,.60,.75,.90])for(const side of [-.4,0,.4]){
    const x=s.high[0]+(s.low[0]-s.high[0])*t+s.sx*side*s.width,z=s.high[1]+(s.low[1]-s.high[1])*t+s.sz*side*s.width;
    ray.set(new THREE.Vector3(x,.3,z),new THREE.Vector3(0,-1,0));
    const opening=ray.intersectObjects(meshes,false)[0];
    if(!opening||opening.point.y>=-.05)console.log('covered-pit',JSON.stringify({id:s.id,t,side,x,z,y:opening?.point.y,name:opening?.object.name,material:opening?.object.material?.name,data:opening?.object.userData,parent:opening?.object.parent?.name,road:L.nearestRoad(x,z,{drivable:true})?.road?.id}));
    assert(opening&&opening.point.y<-.05,`${s.id} paving/asphalt spans stair pit at t=${t}, across=${side}: ${opening?.object.name},y=${opening?.point.y}`);mouthRays++;
  }
  const built=svc.stairs.find(q=>q.id===s.id);
  for(let i=0;i<s.steps;i++){
    const t=(i+.5)/s.steps,x=s.high[0]+(s.low[0]-s.high[0])*t,z=s.high[1]+(s.low[1]-s.high[1])*t,top=FY*(i+1)/s.steps;
    assert(Math.abs(built.items[i].y0-(top-.3))<1e-9,'treads have finite thickness');
    ray.set(new THREE.Vector3(x,top+.04,z),new THREE.Vector3(0,-1,0));
    const drawn=ray.intersectObjects(meshes,false)[0];assert(drawn&&Math.abs(drawn.point.y-top)<.02,`${s.id} tread ${i} drawing matches floor`);stepRays++;
  }
  // At both feet and head height, the centre has no retaining wall or shop.
  assert(!ph.columnBlocked(s.x,s.z,.30,FY/2+.45,FY/2+1.7),`${s.id} walking centre clear above normal step height`);
}
const middle=[(T.a[0]+T.b[0])/2,(T.a[1]+T.b[1])/2];
assert(!ph.columnBlocked(...middle,.30,FY,FY+1.7),'finite road slab permits a person below it');
assert(ph.columnBlocked(...middle,.30,-.3,.3),'overhead road is a real solid slab');
assert.equal(ph.surfaceAt(...middle,FY,true,{}).y,FY,'underground floor selected below road');
assert.equal(ph.surfaceAt(...middle,0,true,{}).y,0,'road remains driveable above passage');

function walk(points){
  const p=new Player(new THREE.PerspectiveCamera(),{addEventListener(){},requestPointerLock(){}},ph,L.WORLD.play);
  p.enabled=true;p.clampXZ=L.clampToPlay;p.solidAt=L.insideBuilding;p.smoothing=0;p.setPose(...points[0],0,0);
  let rescues=0;p.onRescue=()=>rescues++;p.keys.add('KeyW');
  for(const end of points.slice(1)){
    for(let f=0;f<1500;f++){
      const dx=end[0]-p.pos.x,dz=end[1]-p.pos.z;if(Math.hypot(dx,dz)<.10)break;
      p.yaw=Math.atan2(-dx,-dz);p.time+=1/60;p.update(1/60);walkingFrames++;
    }
    assert(Math.hypot(end[0]-p.pos.x,end[1]-p.pos.z)<.17,`walk blocked at ${p.pos.x},${p.pos.y},${p.pos.z} heading to ${end}`);
  }
  p.keys.clear();assert.equal(rescues,0,'no falling rescue');walkingRoutes++;return p;
}
for(const s of STAIRS){
  const approach=[s.high[0]-s.tx*.7,s.high[1]-s.tz*.7];
  const p=walk([approach,s.junction]);assert(Math.abs(p.pos.y-FY)<.03,`${s.id} reaches underground floor`);
  // Same actual player walks back to the street, rather than spawning onto a roof.
  p.keys.add('KeyW');
  for(let f=0;f<1500;f++){const dx=approach[0]-p.pos.x,dz=approach[1]-p.pos.z;if(Math.hypot(dx,dz)<.10)break;p.yaw=Math.atan2(-dx,-dz);p.time+=1/60;p.update(1/60);walkingFrames++;}
  p.keys.clear();assert(Math.hypot(approach[0]-p.pos.x,approach[1]-p.pos.z)<.17,`${s.id} return to street`);assert(Math.abs(p.pos.y)<.04);walkingRoutes++;
}
for(const [west,east] of [[STAIRS[0],STAIRS[2]],[STAIRS[1],STAIRS[3]]]){
  const a=[west.high[0]-west.tx*.7,west.high[1]-west.tz*.7],b=[east.high[0]-east.tx*.7,east.high[1]-east.tz*.7];
  walk([a,west.junction,east.junction,b]);walk([b,east.junction,west.junction,a]);
}
// All above-ground rail posts/retaining cheeks fit the dry median. The east
// mouth's documented 0.9m shift is retained to clear the inferred road width.
assert.equal(STAIRS[5].high[0],-1710.3);
for(const s of STAIRS.filter(s=>!s.pavilion))for(const t of [0,.25,.5,.75,1])for(const side of [-1,1]){
  const x=s.high[0]+(s.low[0]-s.high[0])*t+s.sx*side*(s.width/2+.12),z=s.high[1]+(s.low[1]-s.high[1])*t+s.sz*side*(s.width/2+.12);
  assert(!L.isOnRoad(x,z,.015),`${s.id} railing/base stays off asphalt`);
}
if(integrated){
  for(const id of UNDERPASS_BUILDING_IDS){const p=UNDERPASS_PAVILIONS.find(p=>p.building===id);assert(!L.insideBuilding(p.south[0],p.south[1]),'low shelter is not a false solid building footprint');}
}
let cars=0;
for(const x of [-1728.0,-1702.3])for(const direction of [-1,1]){
  const car=createHandling(ctx),startZ=7382-direction*24;car.reset(x,startZ,direction>0?0:Math.PI);let crossed=false;
  for(let f=0;f<300;f++){car.step(1/60,{thr:1,brk:0,steer:0,hand:false,nitro:false});if((car.z-7382)*direction>24){crossed=true;break;}}
  assert(crossed,'actual red car crosses the live road above underpass');cars++;
}
const record=svc.rails.find(Boolean);assert(record&&record.items.length,'visible rails register real knock colliders');
ctx.knock.snap(record,1,0,8);assert.notEqual(record.state,'stand','handrail breaks on impact');assert(record.items.every(i=>!ph.items.includes(i)),'broken rail removes original obstruction');
console.log(JSON.stringify({integrated,mouths:HOLES.length,mouthRays,stepRays,walkingRoutes,walkingFrames,carCrossings:cars,railRecords:svc.rails.length,knockVerified:true}));
console.log('PASS library underpass: real stairs, open ground, finite deck, road and knock rails');
