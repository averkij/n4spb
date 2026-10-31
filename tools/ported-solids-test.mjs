// Regression for the source-port adapter: real knock registration, real source
// instancing, no duplicate fixtures, a removed fence and open under-bridge water.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { adaptPortedSolids } from '../src/world/lib/adapt-ported-solids.js';
const {ctx,THREE}=await buildWorld({modules:[]});
const root=new THREE.Group(),mat=ctx.mat.toon('#43504b',{name:'test-iron'});
const lamps=new THREE.InstancedMesh(new THREE.BoxGeometry(.2,4,.2).translate(0,2,0),mat,2);
const items=[];
for(let i=0;i<2;i++){lamps.setMatrixAt(i,new THREE.Matrix4().makeTranslation(-20000+i*5,0,0));items.push(ctx.physics.addBox(-20000+i*5,0,.4,.4,0,0,4));}
lamps.name='ported-lamps';root.add(lamps);ctx.addStatic(root);
adaptPortedSolids(ctx,[root],items,'fixture-test');
assert.equal(lamps.count,0,'the immutable source instances must be retired');
const records=ctx.knock.list.filter(r=>r.kind==='lamp');assert.equal(records.length,2);
assert(records.every(r=>r.parts.length&&r.item.source.knock===r&&ctx.physics.items.includes(r.item)));
assert(records.flatMap(r=>r.parts).every(p=>p.mesh.instanceMatrix.usage===THREE.DynamicDrawUsage));
ctx.knock.snap(records[0],1,0,40);assert.notEqual(records[0].state,'stand');assert(!ctx.physics.items.includes(records[0].item));
const fenceRoot=new THREE.Group(),fence=new THREE.Mesh(new THREE.BoxGeometry(18,1.2,.2),mat);fence.position.set(-19000,.6,0);fenceRoot.add(fence);ctx.addStatic(fenceRoot);
const guard=ctx.physics.addBox(-19000,0,18,.3,0,-8,1.2);
adaptPortedSolids(ctx,[fenceRoot],[guard],'fence-test');
assert(!ctx.physics.items.includes(guard),'the deep source guard must go');
const bays=ctx.knock.list.filter(r=>r.kind==='fence');assert(bays.length>=5&&bays.every(r=>r.item.source.knock===r));
assert(!ctx.physics.columnBlocked(-19000,0,.3,-3.4,-1.4),'boats must pass beneath the deck rails');
assert(fence.geometry.index.count<36,'the old merged upper rail must be removed');
const waterway=ctx.physics.waterway;ctx.physics.waterway=()=>-3.4;
const shore=ctx.physics.addWalkRamp(-18000,0,10,20,0,0,-4.2,1.6);shore.boatPass=true;ctx.physics.waterShores.push(shore);
assert.equal(ctx.physics.waterLevel(-18000,-8),null,'sand above the shoreline must not be navigable water');
assert.equal(ctx.physics.waterLevel(-18000,9),-3.4,'the submerged toe remains water');
ctx.physics.waterway=waterway;
console.log('ported-solids: source lamps, dynamic cell meshes, shared collider ownership, physical knock, segmented rails and boat clearance OK');
