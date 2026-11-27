// Use node tools/area.mjs <district> tools/regional-metro-entrances-test.mjs [--winter].
import assert from 'node:assert/strict';
import {buildWorld} from './lib/headless-world.mjs';
import {Player} from '../src/core/player.js';
import {LOD} from '../src/core/lod.js';
import {entrancePoint} from '../src/world/lib/metro-pavilion-entrance.js';
import {regionalMetroSites} from '../src/world/metro/regional-sites.js';

const season=process.argv.includes('--winter')?'winter':'summer';
const {ctx,L,THREE,errors}=await buildWorld({season,skip:['drive','traffic','people','wildlife']});
assert.deepEqual(errors,[]);
const failures=[];
ctx.staticRoot.updateMatrixWorld(true);
const meshes=[];
ctx.staticRoot.traverse(o=>{
  if(!o.isMesh || o.isInstancedMesh)return;
  if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
  meshes.push({o,box:o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)});
});
const ray=new THREE.Raycaster();ray.layers.enableAll();
const known=ctx.services.metroPavilionDoors||[];
const spatial=new Map();
for(const sector of LOD.sectors.values())for(const item of sector.loose)spatial.set(item.obj,item);
function visibleNear(name,d){
  const mesh=ctx.staticRoot.getObjectByName(name),item=spatial.get(mesh);
  assert(item && Math.hypot(item.cx-d.x,item.cz-d.z)<65,'distance culling hides '+name);
}
for(const d of regionalMetroSites.filter(s=>L.inPlay(s.x,s.z))){
  try{
    if(d.profile.kind==='closed'){
      assert(!known.some(k=>k.id===d.id),'reconstruction site opened to passengers');
      visibleNear('metro-reconstruction-'+d.bldg,d);
      console.log('PASS',d.name,'closed worksite');continue;
    }
    assert(known.some(k=>k.id===d.id),'door group missing from props');
    visibleNear('metro-street-approach-'+d.id,d);
    visibleNear('metro-plate-'+d.id,d);
    if(d.profile.shell)visibleNear('metro-pavilion-'+d.bldg,d);
    const at=v=>entrancePoint(d,0,v);
    const depth=d.id==='n1646568762'?4.5:1.48;
    let before=at(Math.max(d.approach,d.steps?depth+d.steps*.35+1:0));
    const lobby=at(-1.59),t=d.terrace;
    if(t){
      const len=Math.hypot(t.lower.x-t.upper.x,t.lower.z-t.upper.z);
      before={x:t.lower.x+(t.lower.x-t.upper.x)/len,z:t.lower.z+(t.lower.z-t.upper.z)/len};
    }
    const player=new Player(new THREE.PerspectiveCamera(),{addEventListener(){}},ctx.physics,L.WORLD.play);
    player.enabled=true;player.clampXZ=L.clampToPlay;player.solidAt=L.insideBuilding;
    player.setPose(before.x,before.z);player.keys.add('KeyW');
    let rescues=0;player.onRescue=()=>rescues++;
    function walk(p){
      const distance=Math.hypot(p.x-player.pos.x,p.z-player.pos.z);
      const limit=Math.ceil((distance/player.walk+3)*60);
      for(let i=0;i<limit;i++){
        if(Math.hypot(player.pos.x-p.x,player.pos.z-p.z)<.11)return;
        player.yaw=Math.atan2(player.pos.x-p.x,player.pos.z-p.z);player.update(1/60);
      }
      assert.fail('blocked at '+player.pos.toArray().map(n=>n.toFixed(2))+' target '+[p.x,p.z].map(n=>n.toFixed(2)));
    }
    const route=[];
    for(let i=d.steps-1;i>=0;i--){
      const f=(i+.5)/d.steps;
      const p=t?{x:t.upper.x+f*(t.lower.x-t.upper.x),z:t.upper.z+f*(t.lower.z-t.upper.z)}:at(i===0?.80:depth+(i-.5)*.35);
      route.push(p);
      walk(p);
      assert(Math.abs(player.pos.y-(d.y-i*.15))<.10,'tread '+i+' feet '+player.pos.y+' design '+(d.y-i*.15));
    }
    if(t)for(const pt of [t.upper,...t.via.toReversed(),at(.3)]){walk(pt);route.push(pt);}
    walk(lobby);assert(Math.abs(player.pos.y-d.y)<.10,'lobby feet '+player.pos.y+' threshold '+d.y);
    for(const pt of route.toReversed())walk(pt);
    walk(before);assert.equal(rescues,0);
    for(const u of [-.30,0,.30]){
      const outer=entrancePoint(d,u,.82),inner=entrancePoint(d,u,-1.6),y=d.y+1.35;
      const start=new THREE.Vector3(outer.x,y,outer.z),end=new THREE.Vector3(inner.x,y,inner.z);
      const box=new THREE.Box3().setFromPoints([start,end]).expandByScalar(.015);
      ray.set(start,end.sub(start).normalize());ray.near=0;ray.far=2.42;
      const hit=ray.intersectObjects(meshes.filter(m=>m.box.intersectsBox(box)).map(m=>m.o),false)[0];
      assert(!hit,'opaque surface across open leaves '+(hit?.object.name||hit?.object.material?.name)+' at '+hit?.distance.toFixed(2));
    }
    console.log('PASS',d.name,d.id,'risers',d.steps,'threshold',d.y.toFixed(2));
  }catch(e){failures.push(d.name+' '+d.id+' '+e.message);console.error('FAIL',failures.at(-1));}
}
console.log('AREA',process.env.AREA,'doors',regionalMetroSites.filter(d=>L.inPlay(d.x,d.z)).length);
assert.deepEqual(failures,[]);
