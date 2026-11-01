// Player-visible architectural openings must match their real geometry and
// colliders. Run: node tools/area.mjs moskovskaya tools/moskovskaya-landmarks-test.mjs
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
const {ctx,L,errors}=await buildWorld({modules:['landmarksMoskovsky','landmarksMoskovskaya']});
assert.deepEqual(errors,[]);
const svc=ctx.services.landmarksMoskovskaya;
for(const id of ['w870663628','w32272976','r1806688','r3466512','r3483966','r3483967'])
  assert([...svc.houses,...svc.monuments].some(r=>r.id===id),`missing landmark ${id}`);
assert.equal(L.insideBuilding(-1815,7460.4,.5),false,'the open library portico is not a ground footprint');
assert.equal(ctx.physics.columnBlocked(-1815,7460.4,.4,0,1.7),false,'a visible library bay stays open at walking height');
assert.equal(ctx.physics.columnBlocked(-1812.1,7459.8,.4,17,19),true,'the overhead drum stays solid');
assert(ctx.physics.columnBlocked(-1812.5,7456.3,.4,0,1.7),'the actual central library column stays solid');
let tip=-Infinity,vertices=0;
ctx.staticRoot.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh)return;
  if(!o.name.startsWith('moskovsky-'))return;
  const p=o.geometry.attributes.position;o.updateMatrixWorld(true);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    assert([x,y,z].every(Number.isFinite),'finite authored geometry');
    assert(x < -900 && x > -3300 && z > 4450 && z < 8500,`misplaced facade geometry at ${x},${y},${z}`);
    if(Math.abs(x+1672)<15&&Math.abs(z-7554)<15)tip=Math.max(tip,y);
    vertices++;
  }
});
assert(vertices>10000,'audit inspected the real rendered landmark buffers');
assert(tip>75.5&&tip<77,'the surveyed 76 m tower silhouette is preserved');
console.log(`Moskovskaya landmarks: ${vertices} finite placed vertices; recognizable buildings, open library portico, solid supports/drum and surveyed spire OK`);
