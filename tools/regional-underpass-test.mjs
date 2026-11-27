// Run with tools/area.mjs; include each cut that contains a public stair mouth.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { Player } from '../src/core/player.js';
import { LOD } from '../src/core/lod.js';
import { areaUnderpassLifts, areaUnderpasses, localToWorld, regionalUnderpassSites } from '../src/world/metro/regional-underpass-sites.js';

const {ctx,L,THREE,errors,marks}=await buildWorld({skip:['traffic','people','wildlife','drive'],season:process.argv[2]||'summer'});
assert.deepEqual(errors,[]);
assert.equal(regionalUnderpassSites.size,31);
assert(areaUnderpasses.length || areaUnderpassLifts.length,'no underpass or lift in this cut');
assert.equal(ctx.services.regionalUnderpasses?.length,areaUnderpasses.length);
assert.equal(ctx.services.regionalMetroLifts?.length,areaUnderpassLifts.length);
ctx.staticRoot.updateMatrixWorld(true);
const meshes=[];
const loose=new Set([...LOD.sectors.values()].flatMap(s=>s.loose));
ctx.staticRoot.traverse(o=>{
  if(!o.isMesh || o.isInstancedMesh)return;
  if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
  meshes.push([o,o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)]);
  if(/^metro-(?:underpass-|lift-)/.test(o.name)){
    const registered=LOD.of(o), world=o.geometry.boundingSphere.center.clone().applyMatrix4(o.matrixWorld);
    assert(registered && loose.has(registered),o.name+' absent from streaming sector');
    assert(Math.hypot(registered.cx-world.x,registered.cz-world.z)<.02,o.name+' LOD sector uses a local coordinate');
  }
});
const ray=new THREE.Raycaster();ray.layers.enableAll();
const vertical=new THREE.Vector3(0,-1,0),results=[];
const failed=[];
for(const s of areaUnderpassLifts) {
  try {
    assert(ctx.staticRoot.getObjectByName('metro-lift-'+s.id),'missing lift enclosure');
    const player=new Player(new THREE.PerspectiveCamera(),{addEventListener(){}},ctx.physics,L.WORLD.play);
    player.enabled=true;player.clampXZ=L.clampToPlay;player.solidAt=L.insideBuilding;
    const start=localToWorld(s,0,-4.85), turn=localToWorld(s,0,.25);
    player.setPose(start.x,start.z);player.keys.add('KeyW');
    for(const pt of [turn,start]) {
      let ticks=0;
      while(++ticks<400 && Math.hypot(player.pos.x-pt.x,player.pos.z-pt.z)>.13) {
        player.yaw=Math.atan2(player.pos.x-pt.x,player.pos.z-pt.z);
        player.update(1/60);
      }
      assert(ticks<400,'lift approach blocked at '+player.pos.toArray().map(n=>n.toFixed(2)));
      assert(Math.abs(player.pos.y)<.18,'lift approach has a false step or missing floor');
    }
    results.push(s.id+' lift');
  } catch(e) {failed.push(s.id+' '+e.message);}
}
for(const s of areaUnderpasses) {
  try {
    const at=(u,v)=>localToWorld(s,u,v),ph=ctx.physics;
    assert(L.GROUND_HOLES.some(h=>h.id===s.hole.id),'missing terrain cut');
    assert(ctx.staticRoot.getObjectByName('metro-underpass-'+s.id));
    if(s.canopy)assert(ctx.staticRoot.getObjectByName('metro-underpass-shelter-'+s.canopy),'missing canopy');
    const near=meshes.filter(([,b])=>b.distanceToPoint(new THREE.Vector3(s.x,0,s.z))<s.end+5);
    for(const f of s.flights) {
      const dt=(f.end-f.start)/f.steps;
      for(let i=0;i<f.steps;i++) {
        const v=f.start+(i+.5)*dt, pt=at(0,v),y=f.top+(f.bottom-f.top)*(i+1)/f.steps;
        assert(Math.abs(ph.groundHeight(pt.x,pt.z,y)-y)<.025,'riser has no matching physical top at '+v);
        if(v<s.opening-.2) {
          ray.set(new THREE.Vector3(pt.x,.25,pt.z),vertical);ray.near=0;ray.far=.3-y;
          const hit=ray.intersectObjects(near.map(([o])=>o),false)[0];
          assert(hit && Math.abs(hit.point.y-y)<.055,'opaque surface over tread '+i+' at '+v.toFixed(2)+' ('+hit?.object.name+' y='+hit?.point.y+')');
        }
      }
    }
    const origin=at(0,-.9),dest=at(0,s.end+Math.min(1.38,s.landing-.27));
    const player=new Player(new THREE.PerspectiveCamera(),{addEventListener(){}},ph,L.WORLD.play);
    let rescues=0;player.enabled=true;player.onRescue=()=>rescues++;player.clampXZ=L.clampToPlay;
    player.solidAt=L.insideBuilding;player.setPose(origin.x,origin.z);player.keys.add('KeyW');
    // An extent-only mouth is still rendered and checked above. Walking it is the
    // responsibility of its district if/when the playable boundary reaches it.
    if(L.inPlay && (!L.inPlay(origin.x,origin.z)||!L.inPlay(dest.x,dest.z))) {
      results.push(s.id+' extent');continue;
    }
    for(const target of [dest,origin]) {
      let f=0;
      while(Math.hypot(target.x-player.pos.x,target.z-player.pos.z)>.12 && ++f<600) {
        player.yaw=Math.atan2(player.pos.x-target.x,player.pos.z-target.z);player.update(1/60);
      }
      if(f>=600) {
        const p=player.pos;
        const block=ph.querySolids(p.x,p.z,1).filter(it=>it.type==='box'||it.type==='cyl')
          .filter(it=>it.y1>p.y+.33&&it.y0<p.y+1.7)
          .map(it=>{const i=ph.items.indexOf(it);return [Object.keys(marks).find(k=>marks[k][0]<=i && marks[k][1]>i),it.type,
            it.cx?.toFixed(1),it.cz?.toFixed(1),it.hw?.toFixed(2),it.hd?.toFixed(2),it.y0?.toFixed(1),it.y1?.toFixed(1)];});
        throw Error('walk stalled '+p.toArray().map(n=>n.toFixed(2))+' -> '+[target.x,target.z].map(n=>n.toFixed(1))+' '+JSON.stringify(block.slice(0,12)));
      }
      const expected=target===dest?-s.depth:0;
      assert(Math.abs(player.pos.y-expected)<.26,'walk ended at '+player.pos.y+', expected '+expected);
    }
    assert.equal(rescues,0);results.push(s.id+' walked');
  } catch(e) { failed.push(s.id+' '+e.message); }
}
const paired=areaUnderpasses.filter(s=>s.shared);
if(paired.length===2) {
  const [a,b]=paired, pa=localToWorld(a,0,-.9), pb=localToWorld(b,0,-.9);
  if(L.inPlay(pa.x,pa.z) && L.inPlay(pb.x,pb.z)) {
    const player=new Player(new THREE.PerspectiveCamera(),{addEventListener(){}},ctx.physics,L.WORLD.play);
    player.enabled=true;player.clampXZ=L.clampToPlay;player.solidAt=L.insideBuilding;
    player.setPose(pa.x,pa.z);player.keys.add('KeyW');
    let deepest=0;
    const platform=localToWorld(a,0,a.end+.9);
    for(const pt of [platform,pb,platform,pa]) {
      let ticks=0;
      while(++ticks<480 && Math.hypot(player.pos.x-pt.x,player.pos.z-pt.z)>.12) {
        player.yaw=Math.atan2(player.pos.x-pt.x,player.pos.z-pt.z);
        player.update(1/60);deepest=Math.min(deepest,player.pos.y);
      }
      assert(ticks<480,'paired public steps do not meet at their shared lower landing');
    }
    assert(deepest< -3 && Math.abs(player.pos.y)<.2);
    results.push('shared landing crossed both ways');
  }
}
console.log(process.env.AREA,ctx.season,results.join(', '));
if(failed.length)console.error(failed.join('\n'));
assert.equal(failed.length,0);
