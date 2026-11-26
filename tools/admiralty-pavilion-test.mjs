// Run via area.mjs for palace (panorama) and admiralty (physical landmark).
import assert from 'node:assert/strict';
import {W, CR, SR} from '../src/world/landmarksH/frame.js';
import {buildWorld} from './lib/headless-world.mjs';
const panorama = process.env.AREA === 'palace';
const {ctx,THREE,errors}=await buildWorld({modules:[panorama?'landmarksRiverfront':'landmarksH']});
assert.deepEqual(errors,[]);
ctx.scene.updateMatrixWorld(true);
const meshes=[];
ctx.staticRoot.traverse(o=>{if(o.isMesh && (!panorama || o.name.startsWith('riverfront-admiralty'))) meshes.push(o);});
assert(meshes.length);
const front=new THREE.Vector3(SR,0,CR), down=new THREE.Vector3(0,-1,0);
const probe=(a,b,y,dir,max)=>{
 const [x,z]=W(a,b); const r=new THREE.Raycaster(new THREE.Vector3(x,y,z),dir,0,max);
 return r.intersectObjects(meshes,false)[0];
};
let cols=0;
for(const centre of [-176,176])for(const side of [-1,1])for(let i=0;i<5;i++){
 // Five shafts per loggia share a podium, tested below its belt course.
 const a=centre+side*(13.2+i*(27.2-13.2)/4);
 for(const y of [.4,2.4,4.9]){
  const hit=probe(a,162,y,front,3.1);
  assert.ok(hit,'visible stone support at '+[a,y]);
 }
 const surface=probe(a,159.30,5.45,down,1);
 assert.ok(surface,'stone top directly under shaft');
 if(!panorama){
  const [x,z]=W(a,158.4);
  assert(ctx.physics.groundHeight(x,z,5.21,false)>=5.19,'solid support at the column');
 }
 cols++;
}
const sideHit=new THREE.Vector3(-CR,0,SR);
for(const y of [1,3,8,15])for(const b of [152.9,153.7,154.7]){
 const hit=probe(211,b,y,sideHit,7.0); assert.ok(hit,'east side return visible at '+[b,y]);
}
console.log('PASS',process.env.AREA,cols,'supported columns and all east pavilion side rays');
