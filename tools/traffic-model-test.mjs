import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createTrafficCarModel,trafficDefinition} from '../src/world/drive/traffic-model.js';
import {trafficSource} from '../src/world/drive/traffic-source.js';
import {DRIVABLE_KINDS} from '../src/world/traffic/fleetdata.js';
import {createVehicleCabin} from '../src/world/drive/vehicle-cabin.js';

const ctx={rng:()=>()=>.4,tex:{draw:()=>new THREE.Texture()},shared:{uNight:{value:.6}},noOutline(){},mat:{
  toon(color,o={}){return new THREE.MeshToonMaterial({color,vertexColors:!!o.vertexColors,map:o.map||null,name:o.name,side:o.side==='double'?THREE.DoubleSide:THREE.FrontSide});},
  glass(){return new THREE.MeshBasicMaterial({transparent:true,opacity:.72});},
}};
const masses=new Set();
for(const [i,kind] of DRIVABLE_KINDS.entries()){
  const source=trafficSource(kind),before=source.paint.attributes.color.array.slice();
  const d={id:`fixture-${kind}`,kind,x:11,z:22,rotY:.7,color:new THREE.Color('#275c8a'),plate:i,livery:i%8,route:12};
  const def=trafficDefinition(d),model=def.makeModel(ctx);
  assert.equal(def.kind,'traffic');assert.equal(def.traffic.model,kind);assert.equal(def.traffic.color,'#275c8a');assert.equal(def.traffic.plate,i);assert.equal(def.traffic.livery,i%8);
  assert.deepEqual(source.paint.attributes.color.array,before,'Promotion must not tint shared traffic buffers');
  assert.equal(model.wheels.length,kind==='artic'?6:4,`${kind} has all axle wheels`);
  assert.equal(model.wheels.filter(w=>w.front).length,2);
  assert(model.body.geometry.attributes.position.count>0&&model.glass.geometry.attributes.position.count>0);
  for(const a of [...model.cabin.seat,...model.cabin.wheel,model.cabin.doorFront,model.cabin.doorRear])assert(Number.isFinite(a),`${kind} has finite cabin anchors`);
  model.root.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes))assert(a.array.every(Number.isFinite),`${kind}: ${o.name} has finite geometry`);});
  model.set({x:3,y:.04,z:5,yaw:.4,steerAngle:.2,spin:.7,steer:.3,lights:true,brake:.4});
  assert.deepEqual(model.root.position.toArray(),[3,.04,5]);
  for(const w of model.wheels){assert.equal(w.mesh.rotation.x,.7);assert.equal(w.pivot.rotation.y,w.front?.2:0);}
  model.setView(true);assert.equal(model.driver.visible,false);assert(!model.glass.visible);model.setView(false);assert.equal(model.driver.visible,true);assert(model.glass.visible);
  const carry=trafficDefinition({traffic:def.traffic,x:3,z:5,yaw:.4});
  assert.deepEqual(carry.traffic,def.traffic);assert.equal(carry.parked.yaw,.4);assert.equal(carry.spec.mass,def.spec.mass);
  assert.equal(carry.traffic.route,12);
  if(def.spec.bus){assert.equal(model.cabin.entrySide,1);assert(model.cabin.seat[0]>0&&model.cabin.wheel[0]>0,'native-frame driver remains on left despite right-door entry');assert(def.spec.eye.y>1.9);assert(def.spec.mass>=8200);}
  if(source.board)assert(model.root.getObjectByName('traffic-route'),'route board survives promotion');
  if(source.pole)assert.equal(model.root.children.filter(o=>o.name==='traffic-trolley-pole').length,2);
  if(kind==='artic'){model.body.geometry.computeBoundingBox();assert(model.body.geometry.boundingBox.min.z<-12,'full rear section retained');assert.equal(def.tuning.steerWheelbase,9.325);}
  const original=[model.body,model.glass,...model.liveryMeshes].map(m=>m.geometry),disposed=new Set();
  for(const g of original)g.addEventListener('dispose',()=>disposed.add(g));
  createVehicleCabin(ctx,{id:def.id,kind:'traffic',def,model,spec:def.spec});
  assert.equal(disposed.size,original.length,`${kind}: private replaced shell buffers are disposed`);
  model.root.traverse(o=>{if(o.geometry)assert(!disposed.has(o.geometry),`${kind}: live cabin retains its own buffers`);});
  masses.add(def.spec.mass);
}
assert(masses.size>=10,'Archetypes retain distinct physical masses');
assert.equal(trafficDefinition({kind:'tram'}),null);
assert.throws(()=>createTrafficCarModel(ctx,{kind:'tram'}),/Unsupported/);
console.log(`PASS: ${DRIVABLE_KINDS.length} promoted models, complete axles/sections, right bus doors, route boards/poles, handoff, source immutability and physical profiles`);
