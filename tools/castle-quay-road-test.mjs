// Run through area.mjs palace. The former moat mouth is filled beneath the quay road.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

const {ctx,L,THREE,errors} = await buildWorld({modules:['environment','streets','bridges']});
assert.deepEqual(errors, []);
ctx.scene.updateMatrixWorld(true);
const meshes=[];
ctx.staticRoot.traverse(o=>{if(o.isMesh)meshes.push(o);});
const ray=new THREE.Raycaster();
function hit(x,y,z,dx,dy,dz){
  ray.set(new THREE.Vector3(x,y,z),new THREE.Vector3(dx,dy,dz).normalize());
  return ray.intersectObjects(meshes,false)[0];
}
for(const yaw of [95,101.6,110]){
  const a=yaw*Math.PI/180;
  for(const y of [-2.4,-1,.05]){
    const h=hit(-619.2,y,-863.2,-Math.sin(a),0,-Math.cos(a));
    assert(h && h.distance<14 && /quay/.test(h.object.name), 'continuous river face at '+[y,yaw]+' got '+[h?.distance,h?.object.name]);
  }
}
for(const t of [.05,.25,.5,.75,.95]){
  const x=-631.9-9.9*t,z=-856.4-15*t;
  const h=hit(x,1,z,0,-1,0);
  assert.equal(L.waterLevelAt(x,z),null, 'dry road at '+[x,z]);
  assert(h && h.point.y>=-.005 && /asphalt|street/i.test(h.object.name+' '+h.object.material?.name), 'visible road at '+[x,z]+' got '+[h?.point.y,h?.object.name,h?.object.material?.name]);
  assert(ctx.physics.groundHeight(x,z,.4,false)>=-.005,'road supports traffic');
}
assert.equal(L.waterwayAt(-619.2,-863.2),'fontanka');
assert.equal(L.waterwayAt(-710,-837),'moat');
console.log('PASS opaque Fontanka quay, continuous asphalt and solid road over the filled moat mouth');
