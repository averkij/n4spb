// Run through tools/area.mjs with one of the districts containing these pavilions.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { LOD } from '../src/core/lod.js';
import { Player } from '../src/core/player.js';
import { addPolyColliders } from '../src/world/lib/massing.js';
import { DOORWAYS } from '../src/world/data/metro.js';
import { entrancePoint } from '../src/world/lib/metro-pavilion-entrance.js';

const wall = { o:[-8,0,8,0,8,-7,-8,-7], h:[] };
function sections(poly, doors) {
  const boxes = [];
  addPolyColliders({physics:{addBox:(...a)=>boxes.push(a)}},poly,0,4,.5,doors);
  return boxes;
}
function covers(boxes,x,z) {
  return boxes.some(([cx,cz,w,d,r])=>Math.abs((x-cx)*Math.cos(r)-(z-cz)*Math.sin(r))<w/2 &&
    Math.abs((x-cx)*Math.sin(r)+(z-cz)*Math.cos(r))<d/2);
}
const original=DOORWAYS[0], around={o:wall.o.map((v,i)=>v+(i%2?original.z:original.x)),h:[]};
assert(!covers(sections(around),original.x,original.z),'existing central passage was closed');
assert(covers(sections(wall),0,0),'unmarked facade should remain solid');
assert(!covers(sections(wall,[{x:0,z:0,w:3.8}]),0,0),'specialised passage was closed');
assert(covers(sections(wall,[{x:0,z:0,w:3.8}]),3,0),'adjacent facade should remain solid');

const families={
  avtovo:['avtovo-1','avtovo-2','avtovo-3','kirovsky-zavod-1','kirovsky-zavod-2'],
  prim:['n3870045073','n3870045075','n3870045077'],baltic:['n3090777561','n1735167424'],
  cherny:['n348148610','n697434055'],lenina:['n1735235519','n5385960939'],
  gork:['gorkovskaya-entrance','gorkovskaya-exit'],petr:['n268479754','n5599406490'],
  rest:['n4486084294','n4486084318'],vo:['n2045866983','n2045866996','sportivnaya2-6','sportivnaya2-7'],
  gorny:['gorny-in','gorny-out','gorny-lift-east','gorny-lift-west'],
};
const pages={avtovo:['avtovo'],dekabristov:['prim'],morskoy:['prim'],vasilyevsky:['prim','gorny','vo'],
  gavan:['prim','gorny'],kolomna:['baltic'],semyonovsky:['baltic'],narvsky:['baltic'],north:['cherny'],
  smolny:['cherny'],palace:['cherny'],aptekarsky:['gork','petr'],kronverk:['gork','petr'],finlyandsky:['lenina'],islands:['rest']};
const area=process.env.AREA, expected=new Set((pages[area]||[]).flatMap(k=>families[k]));
assert(expected.size,'district without specialist entrances: '+area);
const {ctx,L,THREE,errors,marks}=await buildWorld({skip:['traffic','people','wildlife','drive'],season:process.argv.includes('--winter')?'winter':'summer'});
assert.deepEqual(errors,[]);
const allDoors=ctx.services.metroPavilionDoors||[];
assert(!allDoors.some(d=>d.id==='n1720800877' && d.y>=0),'subway-access node duplicated on the street facade');
const doors=allDoors.filter(d=>expected.has(d.id));
assert.deepEqual(new Set(doors.map(d=>d.id)),expected,'missing mapped door');
assert(doors.length>0,'no pavilion door groups on this page');
const seen=new Set(), failures=[];
// The live camera updates the sector lists. City resets the legacy
// no-camera compatibility array when it builds after a specialist.
const spatialEntries=new Map();
for(const sector of LOD.sectors.values())for(const entry of sector.loose)spatialEntries.set(entry.obj,entry);
const ray=new THREE.Raycaster(); ray.layers.enableAll();
ctx.staticRoot.updateMatrixWorld(true);
const bounds=[], box=new THREE.Box3();
ctx.staticRoot.traverse(o=>{
  if(!o.isMesh || o.isInstancedMesh) return;
  if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
  bounds.push([o,o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)]);
});
for(const d of doors) {
  try {
    assert(!seen.has(d.id),'duplicate door '+d.id);seen.add(d.id);
    // The east side of this shared intersection falls beyond Gavan's actual handoff.
    // The VO run independently follows both full routes on the playable side.
    if(area==='gavan' && ['gorny-out','gorny-lift-east'].includes(d.id)) {
      assert(!L.inPlay(d.x,d.z),'edge changed: exercise this passage on Gavan too');
      console.log('BOUNDARY',d.id,'tested on vasilyevsky');continue;
    }
    const detail=ctx.staticRoot.getObjectByName('metro-door-'+d.id);
    assert(detail?.geometry?.attributes.color && detail.material.vertexColors,'missing coloured Blender joinery');
    assert(detail.geometry.index.count>1800,'missing door fittings');
    const glazing=detail.getObjectByName(detail.name+'-glass');
    for(const o of [detail,glazing]){const entry=spatialEntries.get(o);assert(entry && Math.hypot(entry.cx-d.x,entry.cz-d.z)<5,'LOD '+o?.name+' at '+JSON.stringify(entry && [entry.cx,entry.cz])+' expected near '+[d.x,d.z]);}
    assert(glazing?.material.transparent && !glazing.material.depthWrite && glazing.material.opacity<.65,'opaque glass obscures the lobby');
    if(d.lobby)assert(detail.getObjectByName(detail.name+'-light')?.material.emissiveIntensity>.6,'missing lobby light');
    const player=new Player(new THREE.PerspectiveCamera(),{addEventListener(){}},ctx.physics,L.WORLD.play);
    player.enabled=true;player.clampXZ=L.clampToPlay;player.solidAt=L.insideBuilding;
    const at=(u,v)=>entrancePoint(d,u,v), side=d.approachOffset||0;
    const route=[at(side,d.approach),at(side,1.65),at(0,.32),at(0,-1.45)];
    player.setPose(route[0].x,route[0].z);player.keys.add('KeyW');
    let rescues=0;player.onRescue=()=>rescues++;
    for(const target of [...route.slice(1),...route.slice(0,-1).reverse()]) {
      let ticks=0;
      while(Math.hypot(player.pos.x-target.x,player.pos.z-target.z)>.14 && ticks++<600) {
        player.yaw=Math.atan2(player.pos.x-target.x,player.pos.z-target.z);player.update(1/60);
      }
      if(ticks>=600){
        for(const it of ctx.physics.querySolids(player.pos.x,player.pos.z,1)) {
          const dx=player.pos.x-it.cx,dz=player.pos.z-it.cz;
          const near=it.type==='cyl' ? Math.hypot(dx,dz)-it.r : Math.hypot(Math.max(0,Math.abs(dx*it.c-dz*it.s)-it.hw),Math.max(0,Math.abs(dx*it.s+dz*it.c)-it.hd));
          if(near<.45 && (it.y1 ?? it.top)>.33 && it.y0<1.82) {const i=ctx.physics.items.indexOf(it);console.log('OBSTRUCTION',d.id,Object.entries(marks).find(([,m])=>m[0]<=i&&i<m[1])?.[0],JSON.stringify(it,['type','cx','cz','r','hw','hd','rotY','y0','y1','top']));}
        }
      }
      assert(ticks<600,'blocked walking to '+[target.x,target.z].map(n=>n.toFixed(1))+' at '+player.pos.toArray().map(n=>n.toFixed(2)));
      if(target===route[3])assert(Math.abs(player.pos.y-d.y)<.30,'unsupported inside threshold: feet '+player.pos.y+' floor '+d.y);
    }
    assert.equal(rescues,0);
    const start=at(0,.85), end=at(0,-1.65), y=d.y+1.25;
    box.makeEmpty().expandByPoint(new THREE.Vector3(start.x,y,start.z)).expandByPoint(new THREE.Vector3(end.x,y,end.z)).expandByScalar(.02);
    ray.set(new THREE.Vector3(start.x,y,start.z),new THREE.Vector3(-Math.sin(d.rotY),0,-Math.cos(d.rotY)));
    ray.near=0;ray.far=2.5;
    const nearby=bounds.filter(([,b])=>b.intersectsBox(box)).map(([o])=>o);
    for(const reverse of [false,true]){
      if(reverse)ray.set(new THREE.Vector3(end.x,y,end.z),new THREE.Vector3(Math.sin(d.rotY),0,Math.cos(d.rotY)));
      const obstacle=ray.intersectObjects(nearby,false)[0];
      assert(!obstacle,'wall across the visible opening: '+obstacle?.object.name+' at '+obstacle?.distance.toFixed(2));
    }
    console.log('PASS',d.id,'outside → lobby → outside',d.x.toFixed(2),d.z.toFixed(2));
  } catch(e) { failures.push(d.id+' '+e.message);console.error('FAIL',failures.at(-1));}
}
assert.deepEqual(failures,[]);
