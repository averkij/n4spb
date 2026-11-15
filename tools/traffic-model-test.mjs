import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createTrafficCarModel,trafficDefinition} from '../src/world/drive/traffic-model.js';
import {makeModel} from '../src/world/traffic/models.js';
import {CAR_KINDS} from '../src/world/traffic/fleetdata.js';
import {createVehicleCabin} from '../src/world/drive/vehicle-cabin.js';

const ctx={rng:()=>()=>.4,tex:{draw:()=>new THREE.Texture()},shared:{uNight:{value:.6}},noOutline(){},mat:{
  toon(color,o={}){return new THREE.MeshToonMaterial({color,vertexColors:!!o.vertexColors,map:o.map||null,name:o.name,side:o.side==='double'?THREE.DoubleSide:THREE.FrontSide});},
  glass(){return new THREE.MeshBasicMaterial({transparent:true,opacity:.72});},
}};
const masses=new Set();
for(const [i,kind] of CAR_KINDS.entries()){
  const source=makeModel(kind,0),before=source.paint.attributes.color.array.slice();
  const d={id:`fixture-${kind}`,kind,x:11,z:22,rotY:.7,color:new THREE.Color('#275c8a'),plate:i,livery:i%8};
  const def=trafficDefinition(d),model=def.makeModel(ctx);
  assert.equal(def.kind,'traffic');assert.equal(def.traffic.model,kind);assert.equal(def.traffic.color,'#275c8a');assert.equal(def.traffic.plate,i);assert.equal(def.traffic.livery,i%8);
  assert.deepEqual(source.paint.attributes.color.array,before,'Promotion must not tint shared traffic buffers');
  assert.equal(model.wheels.length,4,`${kind} has four separated wheels`);
  assert.equal(model.wheels.filter(w=>w.front).length,2);
  assert(model.body.geometry.attributes.position.count>0&&model.glass.geometry.attributes.position.count>0);
  for(const a of [...model.cabin.seat,...model.cabin.wheel,model.cabin.doorFront,model.cabin.doorRear])assert(Number.isFinite(a),`${kind} has finite cabin anchors`);
  model.root.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes))assert(a.array.every(Number.isFinite),`${kind}: ${o.name} has finite geometry`);});
  model.set({x:3,y:.04,z:5,yaw:.4,steerAngle:.2,spin:.7,steer:.3,lights:true,brake:.4});
  assert.deepEqual(model.root.position.toArray(),[3,.04,5]);
  for(const w of model.wheels){assert.equal(w.mesh.rotation.x,.7);assert.equal(w.pivot.rotation.y,w.front?.2:0);}
  model.setView(true);assert.equal(model.driver.visible,false);model.setView(false);assert.equal(model.driver.visible,true);
  const carry=trafficDefinition({traffic:def.traffic,x:3,z:5,yaw:.4});
  assert.deepEqual(carry.traffic,def.traffic);assert.equal(carry.parked.yaw,.4);assert.equal(carry.spec.mass,def.spec.mass);
  const original=[model.body,model.glass,...model.liveryMeshes].map(m=>m.geometry),disposed=new Set();
  for(const g of original)g.addEventListener('dispose',()=>disposed.add(g));
  createVehicleCabin(ctx,{id:def.id,kind:'traffic',def,model,spec:def.spec});
  assert.equal(disposed.size,original.length,`${kind}: private replaced shell buffers are disposed`);
  model.root.traverse(o=>{if(o.geometry)assert(!disposed.has(o.geometry),`${kind}: live cabin retains its own buffers`);});
  masses.add(def.spec.mass);
}
assert(masses.size>=10,'Archetypes retain distinct physical masses');
assert.equal(trafficDefinition({kind:'bus'}),null);
assert.throws(()=>createTrafficCarModel(ctx,{kind:'tram'}),/Unsupported/);
console.log(`PASS: ${CAR_KINDS.length} promoted models, wheel extraction/steering/spin, finite cabin anchors, exact appearance handoff, source immutability and physical profiles`);
