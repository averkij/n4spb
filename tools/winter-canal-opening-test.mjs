import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
const {ctx,THREE,errors}=await buildWorld({modules:['landmarksI']});
assert.deepEqual(errors,[]);
ctx.staticRoot.updateMatrixWorld(true);
const camera=new THREE.PerspectiveCamera(62,1280/720,.25,7000);
camera.position.set(-1893.7,3.5,-1103.4);camera.rotation.set(-18.5*Math.PI/180,38.2*Math.PI/180,0,'YXZ');camera.updateMatrixWorld();
const ray=new THREE.Raycaster();ray.layers.enableAll();
for(const y of [-.22,.21]){
  ray.setFromCamera(new THREE.Vector2(0,y),camera);
  assert(!ray.intersectObject(ctx.staticRoot,true).some(h=>h.point.y<0&&h.distance<40),'gallery opening must not have a sill/crossbar across navigable water');
}
ray.set(new THREE.Vector3(-1902,-.5,-1115),new THREE.Vector3(0,1,0));
assert(ray.intersectObject(ctx.staticRoot,true).length,'the gallery vault remains above the opening');
console.log('PASS Winter Canal: open water below the retained gallery vault');
