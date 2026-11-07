// node tools/area.mjs kolomna tools/narvsky-constructivism-test.mjs
// The same test runs against Narvsky once its mapped data is integrated.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as L from '../src/world/layout.js';
import { BUILDINGS } from '../src/world/data/city.js';
import { Physics } from '../src/core/physics.js';
import { LOD } from '../src/core/lod.js';
import { buildConstructivism, gorkyPoint, GORKY_ID, GORKY_FRAME } from '../src/world/landmarksNarvsky/constructivism.js';
import { GROUPS_LIST } from '../src/world/landmarksNarvsky/constructivism-groups.js';

const rec=BUILDINGS.find(b=>b.id===GORKY_ID);
assert.ok(rec,'Gorky Palace OSM footprint missing from this area');
assert.deepEqual(GROUPS_LIST.flatMap(g=>g.ids),[GORKY_ID],'only the authored palace may be claimed');
const physics=new Physics(()=>0),scene=new THREE.Group(),svc={},materials=new Map();
const material=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshBasicMaterial({color}));return materials.get(color);};
const ctx={L,physics,services:{},mat:{toon:material,decal:(color,{map})=>new THREE.MeshBasicMaterial({color,map})},
  tex:{sign:()=>new THREE.Texture()},addStatic:root=>scene.add(root),noOutline:mesh=>mesh.layers.set(1),
  onUpdate:()=>assert.fail('static palace must not register a global update'),add:()=>assert.fail('static palace must not add dynamic roots')};
const before=LOD.items.length;
const result=buildConstructivism(ctx,svc,rec);
assert.ok(result && result.triangles>3000&&result.triangles<30000,`unexpected triangle count ${result?.triangles}`);
assert.equal(scene.children.length,1,'one static root');
assert.equal(result.entrances.length,3,'three genuinely open foyer entrances');
assert.equal(ctx.services.labels.count(),2,'event panels use the shared label registry');
const blocked=(u,v,r=.28)=>{const p=gorkyPoint(u,v);return physics.columnBlocked(p.x,p.z,r,0,2);};
for(const e of result.entrances){
  const c=Math.cos(GORKY_FRAME.rot),s=Math.sin(GORKY_FRAME.rot),dx=e.x-GORKY_FRAME.x,dz=e.z-GORKY_FRAME.z;
  const u=c*dx-s*dz,v=s*dx+c*dz;
  for(let depth=-3.5;depth<=3;depth+=.25)assert.equal(blocked(u,v+depth),false,`entrance approach blocked at ${u},${depth}`);
}
assert.equal(blocked(0,-5),false,'foyer is hollow');
assert.equal(blocked(0,-9.15),true,'foyer rear wall is physical');
// The first edge belongs to the glass front: the lower wall alongside the
// opening must still stop a walker. The doorway itself was checked above.
assert.equal(blocked(5,0),true,'unopened facade bay is physical');
const roadHits=[];
for(const i of physics.items.filter(i=>i.y0<2))for(const a of[-.9,0,.9])for(const b of[-.9,0,.9]){
  const u=a*i.hw,v=b*i.hd,x=i.cx+i.c*u+i.s*v,z=i.cz-i.s*u+i.c*v;
  if(L.isOnRoad(x,z,0))roadHits.push([x,z]);
}
assert.equal(roadHits.length,0,`building walls intersect mapped carriageway: ${JSON.stringify(roadHits)}`);
const bounds=new THREE.Box3().setFromObject(result.root),mats=new Set();let meshCount=0;
result.root.traverse(o=>{if(!o.isMesh)return;meshCount++;mats.add(o.material);
  assert.ok(Number.isFinite(o.userData.lodFar),'every static mesh needs a finite range');
  assert.ok(!o.userData.noBatch && o.frustumCulled,'ordinary static batching and culling retained');
  for(const a of Object.values(o.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v),'finite vertex attribute');
});
assert.ok(bounds.max.y>=27&&bounds.max.y<29,'paired stair towers retain their silhouette');
assert.ok(bounds.min.x<-4250&&bounds.max.x>-4190,'surveyed palace remains at Stachek Square');
assert.ok(mats.size<=12&&meshCount<=30,`material/mesh budget exceeded: ${mats.size}/${meshCount}`);
assert.equal(LOD.items.length-before,meshCount,'one LOD registration per mesh');
console.log(`PASS Gorky Palace: ${result.triangles} triangles, ${meshCount} meshes / ${mats.size} materials; 3 walkable entrances, hollow foyer, mapped road clearance, bounded static LOD`);
