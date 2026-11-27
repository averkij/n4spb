// node tools/area.mjs islands tools/yelagin-second-bridge-test.mjs [--winter]
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { Player } from '../src/core/player.js';
import { YEL, PIERS, deckProfile } from '../src/world/bridges/yelagin.js';
import { toWorld, toUV } from '../src/world/bridges/sites.js';
import { loadBoats } from '../src/world/drive/boat/index.js';
import { createBoatHandling } from '../src/world/drive/boat/handling.js';
import { carContact } from '../src/world/drive/collision.js';
import { SPEC_LADA } from '../src/world/drive/cars/lada2106.js';
import { NAVIGABLE_WATER_Y } from '../src/world/environment/water-level.js';

assert.equal(process.env.AREA,'islands');
const season=process.argv.includes('--winter')?'winter':'summer';
const {ctx,L,THREE,errors}=await buildWorld({season});
assert.deepEqual(errors,[]);
const h=YEL.len/2;
const point=(u,v)=>toWorld(YEL,u,v);
const failures=[];
function check(label,fn){
  try{fn();console.log('PASS',label);}
  catch(e){failures.push(label+': '+e.message);console.error('FAIL',failures.at(-1));}
}

// Start each journey on dry park land. setPose is never called on the gap or deck.
function walk(start,waypoints){
  const player=new Player(new THREE.PerspectiveCamera(),{addEventListener(){}},ctx.physics,L.WORLD.play);
  player.enabled=true;player.clampXZ=L.clampToPlay;player.solidAt=L.insideBuilding;
  player.setPose(start.x,start.z);player.keys.add('KeyW');
  let rescues=0,steps=0,crown=false;
  player.onRescue=()=>rescues++;
  for(const target of waypoints){
    while(Math.hypot(target.x-player.pos.x,target.z-player.pos.z)>.14&&steps++<3600){
      player.yaw=Math.atan2(player.pos.x-target.x,player.pos.z-target.z);
      player.update(1/60);
      const {x,y,z}=player.pos;
      assert(y>-.24,`walker fell to ${y.toFixed(2)} m at ${x.toFixed(2)}, ${z.toFixed(2)}`);
      const uv=toUV(YEL,x,z);
      if(Math.abs(uv.u)<1&&Math.abs(y-deckProfile(uv.u))<.12)crown=true;
    }
    assert(Math.hypot(target.x-player.pos.x,target.z-player.pos.z)<.16,
      'blocked at '+[player.pos.x,player.pos.y,player.pos.z].map(n=>n.toFixed(2)).join(', '));
  }
  assert(crown,'the walker must use the raised centre of the bridge');
  assert.equal(rescues,0);
}
// Side-by-side tracks use the clear gaps between the historic 1.5 m bollards.
for(const v of [-5.25,.75,5.25])for(const dir of [-1,1]){
  // The Krestovsky park gates funnel all three lanes through the central wicket.
  const route=[point(-h-14,v),point(0,v),point(12,.75),point(h+14,.75)];
  if(dir<0)route.reverse();
  check('walk v='+v+' direction='+dir,()=>walk(route[0],route.slice(1)));
}
check('walk from the reported camera towards Krestovsky',()=>walk({x:-5226.3,z:-4885.7},
  [point(-h+.6,2.25),point(0,2.25),point(12,.75),point(h+14,.75)]));

// The north mouth used to have a visible 9 m gap above a downward bank. Compare
// the drawn bridge and the supporting floor in this former void and on the deck.
ctx.staticRoot.updateMatrixWorld(true);
check('timber deck remains part of the fixed bridge when street furniture moves',()=>{
  const decks=ctx.staticRoot.getObjectByName('fixed-bridge-decks');
  assert(decks?.children.some(mesh=>mesh.material?.name==='brg-yel-deck'));
});
const meshes=[];
ctx.staticRoot.traverse(o=>{
  if(o.isMesh&&(o.name.startsWith('brg-yelagin2') || o.material?.name==='yelagin-bridgehead-pavers'))meshes.push(o);
});
const ray=new THREE.Raycaster();ray.layers.enableAll();
const down=new THREE.Vector3(0,-1,0);
check('drawn surface supports feet across the north seam and main spans',()=>{
  assert(meshes.length);
  for(const v of [-6.75,-3.75,.75,3.75,6.75]){
    for(const u of [-h-7,-h-5,-h-3,-h-1,-h-.05,-h+.05,-h+2,0,h-2]){
      const {x,z}=point(u,v),floor=ctx.physics.groundHeight(x,z,2.1,false);
      assert(floor>-.18,`u=${u}, v=${v}: floor ${floor}`);
      ray.set(new THREE.Vector3(x,floor+.16,z),down);ray.far=.30;
      const surface=ray.intersectObjects(meshes,false)[0];
      assert(surface&&Math.abs(surface.point.y-floor)<.075,
        `u=${u.toFixed(2)}, v=${v}: no visible deck at foot level ${floor.toFixed(3)}`);
    }
  }
});

// This is a pedestrian bridge. Motor traffic must still meet the entrance
// bollards, while the two documented navigation spans keep real hull clearance.
check('original pedestrian bollards',()=>{
  for(const dir of [-1,1]){
    const u=dir*(h-1.1),axis=point(u,.75),next=point(u-dir,.75);
    const car={...axis,y:deckProfile(u),yaw:Math.atan2(next.x-axis.x,next.z-axis.z)};
    assert([...ctx.physics.querySolids(car.x,car.z,3)].some(solid=>
      solid.type==='cyl'&&solid.r<.14&&carContact(car,SPEC_LADA,solid)),
      'the actual Lada body must meet a bollard in a pedestrian opening');
  }
});
const craft=loadBoats(ctx)[0];
assert.equal(craft.nameEn,season==='winter'?'Snowmobile':'Motor boat');
for(const span of YEL.nav)for(const dir of [-1,1]){
  check('navigate span '+(span+1)+' direction='+dir,()=>{
    const u=(PIERS[span]+PIERS[span+1])/2;
    const start=point(u,-dir*21),end=point(u,dir*21);
    const boat=createBoatHandling(ctx,craft.tuning);
    boat.reset(start.x,start.z,Math.atan2(end.x-start.x,end.z-start.z));
    let crossed=false;
    for(let i=0;i<720;i++){
      boat.step(1/60,{thr:.75,brk:0,steer:0,hand:false});
      assert.equal(ctx.physics.waterLevel(boat.x,boat.z),NAVIGABLE_WATER_Y);
      assert(!boat.events.some(e=>e.type==='hit'||e.type==='scrape'),'hull contacted a bridge solid');
      if(toUV(YEL,boat.x,boat.z).v*dir>20){crossed=true;break;}
    }
    assert(crossed,'boat stopped below the deck at '+JSON.stringify(toUV(YEL,boat.x,boat.z)));
  });
}
assert.deepEqual(failures,[]);
console.log('PASS',season,'2nd Yelagin Bridge');
