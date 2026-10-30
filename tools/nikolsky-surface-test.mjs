// Real Nikolsky sett apron must not overdraw the mapped asphalt access road.
// node tools/area.mjs kolomna tools/nikolsky-surface-test.mjs
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
const { ctx, THREE, errors } = await buildWorld({ modules: ['environment','streets','landmarksNikolsky'], log: null });
assert.equal(errors.length, 0, errors.join('\n'));
ctx.scene.updateMatrixWorld(true);
const meshes=[];ctx.scene.traverse(o=>{if(o.isMesh && (Array.isArray(o.material)?o.material:[o.material]).some(m=>m?.name==='lmN-sett'))meshes.push(o)});
assert(meshes.length,'cathedral sett ring exists');
const ray = new THREE.Raycaster(), hits=(x,z)=>{ray.set(new THREE.Vector3(x,10,z),new THREE.Vector3(0,-1,0));return ray.intersectObjects(meshes,false).length>0};
for(const [x,z] of [[-2833.4,1089.18],[-2830.94,1095.28],[-2830.21,1098.55]]) assert(!hits(x,z),`sett covers access road at ${x},${z}`);
let found=false;for(let k=0;k<360;k++){const a=k*Math.PI/180,x=-2861.6+Math.cos(a)*31.5,z=1104.6+Math.sin(a)*31.5;if(hits(x,z)){found=true;break}}
assert(found,'sett ring remains visible outside the road');
console.log('PASS mapped access road free of sett and cathedral sett ring remains');
