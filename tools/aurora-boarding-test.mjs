// CPU-only real Player boarding test. node tools/area.mjs aptekarsky tools/aurora-boarding-test.mjs
import assert from 'node:assert/strict';
import {buildWorld} from './lib/headless-world.mjs';
import {Player} from '../src/core/player.js';
import {SHIP} from '../src/world/landmarksAurora/frame.js';
import {LOD} from '../src/core/lod.js';
const {ctx,L,THREE,errors}=await buildWorld({modules:process.argv.includes('--integrated')?['environment','streets','landmarksAurora']:['landmarksAurora']});
assert.deepEqual(errors,[]);
const svc=ctx.services.landmarksAurora,ph=ctx.physics;
assert(svc.gangway.open);assert.equal(svc.ship.waterY,-3.4);
assert(svc.parts.ship.tris<38000,'ship detail remains bounded');
if(!process.argv.includes('--integrated'))assert.equal(ctx._updates.length,1,'only the existing shared knock scheduler updates');
ctx.staticRoot.updateMatrixWorld(true);
const meshes=[];ctx.staticRoot.traverse(o=>{if(o.isMesh&&o.name==='ship')meshes.push(o);});
assert(meshes.length>5,'actual collected ship mesh is present');
for(const m of meshes){assert(Number.isFinite(LOD.of(m)?.far),'ship has finite authored LOD');for(const v of m.geometry.attributes.position.array)assert(Number.isFinite(v));}
const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);ray.layers.enableAll();let rays=0,maxRenderError=0;
const guns=ph.items.filter(it=>it.type==='box'&&Math.abs(it.hw*2-1.95)<1e-8&&Math.abs(it.hd*2-2.3)<1e-8&&Math.abs(it.y1-it.y0-2.05)<1e-8);
assert.equal(guns.length,14,'all fourteen historical guns retain their local shield collision');
for(const gun of guns){ray.set(new THREE.Vector3(gun.cx,gun.y1+.08,gun.cz),down);const h=ray.intersectObjects(meshes,false)[0];assert(h&&Math.abs(h.point.y-gun.y1)<.02,'each physical gun shield has its drawn steel roof');}
const player=new Player(new THREE.PerspectiveCamera(),document.createElement('canvas'),ph,L.WORLD.play);
player.enabled=true;player.clampXZ=L.clampToPlay;player.solidAt=L.insideBuilding;player.smoothing=0;let rescues=0;player.onRescue=()=>rescues++;
if(process.argv.includes('--mutant-closed')){const c=SHIP.w(-32.5,22);ph.addBox(c.x,c.z,2,2,SHIP.rot,0,8);}
function walk(points,label){
  const start=SHIP.w(...points[0]);player.setPose(start.x,start.z,0,0);player.keys.add('KeyW');
  let steps=0,minY=Infinity,maxY=-Infinity;
  for(const [s,t] of points.slice(1)){
    const p=SHIP.w(s,t);let n=0;
    for(;n<2400;n++){
      const dx=p.x-player.pos.x,dz=p.z-player.pos.z;if(Math.hypot(dx,dz)<.10)break;
      player.yaw=Math.atan2(-dx,-dz);player.time+=1/60;player.update(1/60);minY=Math.min(minY,player.pos.y);maxY=Math.max(maxY,player.pos.y);steps++;
      if(steps%23===0&&player.pos.y>.1&&player.onGround){
        ray.set(new THREE.Vector3(player.pos.x,player.pos.y+.08,player.pos.z),down);const hit=ray.intersectObjects(meshes,false)[0];
        assert(hit,'walker has no drawn deck/tread below the feet');const err=Math.abs(hit.point.y-player.pos.y);maxRenderError=Math.max(maxRenderError,err);assert(err<.09,`feet/deck mismatch ${err} at ${JSON.stringify(SHIP.loc(player.pos.x,player.pos.z))}`);rays++;
      }
    }
    assert(n<2400,`${label} stuck toward ${s},${t} at ${JSON.stringify(SHIP.loc(player.pos.x,player.pos.z))} y=${player.pos.y}`);
  }
  player.keys.clear();assert.equal(rescues,0,'walking must not trigger rescue');assert(!player.fly);console.log(label,{steps,minY,maxY});
}
walk([[-32.5,30],[-32.5,26],[-32.5,22],[-32.5,12],[-32.5,6],[-34,4.5],[-43,3.8],[-49,3.1],[-55,2.5],[-59,2],[-59,-2],[-49,-3.1],[-43,-4.4],[-33,-4.6],[-22,-4.6],[-10,-4.6],[10,-4.6],[24,-4.6],[33.4,-4.6],[36.9,-4.6],[39,-4.5],[47,-3],[49,-2.2],[54,-2.2],[58,-1.4],[58,1.4],[54,2.2],[49,2.2],[47,3],[39,4.6],[36.9,4.6],[33.4,4.6],[24,4.6],[10,4.6],[-10,4.6],[-22,4.6],[-33,4.6],[-32.5,6],[-32.5,22],[-32.5,30]],'boarding, stern/bow gun inspection and both companionways, return to quay');
assert(rays>100);
for(const t of [11,14,17])for(const s of [-34,-32.5,-31]){const p=SHIP.w(s,t);assert.equal(ph.waterLevel(p.x,p.z),-3.4);assert(!ph.columnBlocked(p.x,p.z,.45,-3.45,-1.5),'gangway must not wall off the boat channel below it');}
{const p=SHIP.w(0,0);assert(ph.columnBlocked(p.x,p.z,.2,-3.4,-2.4),'immersed hull remains physically solid');}
assert(svc.boardingRails.length>=40&&svc.boardingRails.length<=60,'bounded breakable rail bays');
const railMeshes=new Set(svc.boardingRails.flatMap(r=>r.parts.map(p=>p.mesh).filter(Boolean)));
assert(railMeshes.size<=6,'shared rail family stays within three parts per nearby spatial cell');
for(const r of svc.boardingRails){assert.equal(r.state,'stand');assert(r.item?.source?.knock===r);assert(r.parts.length>0);for(const p of r.parts)if(p.mesh)assert(Number.isFinite(LOD.of(p.mesh)?.far));}
const r=svc.boardingRails.find(r=>SHIP.loc(r.x,r.z).v>10&&SHIP.loc(r.x,r.z).v<18);assert(r);
assert(ph.items.includes(r.item));ctx.knock.snap(r,1,0,12);assert(!ph.items.includes(r.item),'broken gangway rail relinquishes its collider');
console.log(JSON.stringify({area:process.env.AREA,shipTriangles:svc.parts.ship.tris,guns:guns.length,rays,maxRenderError,railBays:svc.boardingRails.length,railMeshes:railMeshes.size,rescues,waterY:svc.ship.waterY}));
console.log('PASS actual Player two-way Aurora boarding, deck inspection, visible floors, boat clearance and breakable rails.');
