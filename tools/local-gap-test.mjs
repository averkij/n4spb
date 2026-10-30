// Integrated CPU regression: node tools/area.mjs semyonovsky tools/local-gap-test.mjs
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { greenOverlapsBox, localGapSections } from '../src/world/streets/local-gaps.js';
import { AREAS, GREEN, TRAMWAYS } from '../src/world/data/city.js';

const { ctx, THREE, L, errors, built } = await buildWorld();
assert.deepEqual(errors, []);
assert.equal(built.filter(n => n === 'streetsLocalRepairs').length, 1, 'repair must be included exactly once in the actual area');
const net = ctx.services.streets.net;
const marataBox = [-650,-640,1401,1411], zagorodnyBox = [-1361,-1352,1373,1383], boxes = [marataBox,zagorodnyBox];
for(const box of boxes) assert.equal(greenOverlapsBox(GREEN, box), false, 'mapped green bbox enters a reviewed repair site');
const fakeGrass = [{kind:'grass',polys:[{o:[-645,1402,-643,1402,-643,1404,-645,1404]}]}];
assert.equal(greenOverlapsBox(fakeGrass, marataBox), true, 'future grass bbox must disable the site');
assert.equal(greenOverlapsBox([{kind:'grass',polys:[{o:[-700,1402,-699,1402,-699,1404,-700,1404]}]}], marataBox), false);
assert.equal(greenOverlapsBox([{kind:'grass',polys:[{...fakeGrass[0].polys[0],h:[[-646,1401,-642,1401,-642,1405,-646,1405]]}]}], marataBox), true, 'the guard is deliberately conservative around holes');
const rows = localGapSections(net), valid = rows.filter(Boolean);
assert(valid.length >= 4, 'Marata taper has no repair sections');
assert(valid.every(r => r.gap > 0 && r.gap < 7.5));
const inBox=([x,z],box)=>x>=box[0]&&x<=box[1]&&z>=box[2]&&z<=box[3];
for (const [ids,box] of [[['w511116164','w142647140'],marataBox],[['w459816017','w308301794'],zagorodnyBox]]) for (const id of ids) {
  assert(net.ways.some(w => w.id === id), `missing required way ${id}`);
  const without=localGapSections({ ...net, ways: net.ways.filter(w => w.id !== id) }).filter(Boolean);
  assert(!without.some(r=>inBox(r.a,box)), `repair did not require ${id}`);
  assert(without.length>0, `removing ${id} must preserve the other repair`);
}
for (const row of valid) for (const [x,z] of [row.a,row.b]) {
  assert(boxes.some(box=>inBox([x,z],box)), `unexpected repair outside reviewed sites: ${x}, ${z}`);
}
for(const box of boxes) assert(valid.filter(r=>inBox(r.a,box)&&inBox(r.b,box)).length>=4,'reviewed site lacks sections');
const pairs = rows.slice(1).filter((r, i) => r && rows[i]).length;
assert(pairs > 0, 'no contiguous repair sections');

ctx.scene.updateMatrixWorld(true);
const candidates = [];
ctx.scene.traverse(m => {
  if (!m.isMesh || m.name !== 'pt-asphalt' || !m.geometry.index || m.geometry.index.count !== pairs * 6 || m.geometry.attributes.position.count !== pairs * 4) return;
  m.geometry.computeBoundingBox();
  const b = m.geometry.boundingBox;
  if (b.min.x >= -1361.1 && b.min.x < -1352 && b.max.x > -650 && b.max.x <= -639.9 && b.min.z >= 1372.9 && b.max.z <= 1411.1) candidates.push(m);
});
assert.equal(candidates.length, 1, 'actual integrated repair mesh is missing or duplicated');
const mesh = candidates[0], ray = new THREE.Raycaster();
ray.layers.enableAll(); // pt-paint uses the no-outline layer rather than default layer 0.
const covered = (x,z) => { ray.set(new THREE.Vector3(x, 10, z), new THREE.Vector3(0,-1,0)); return ray.intersectObject(mesh,false).length > 0; };
// The ten formerly bare-ground samples on Marata from the independent road-surface audit.
const reviewed = [[-642.6,1403.08],[-642.52,1403.22],[-642.45,1403.33],[-642.39,1403.44],[-642.3,1403.59],[-646.34,1403.48],[-645.77,1404.44],[-645.34,1405.17],[-644.91,1405.89],[-644.34,1406.86],[-1358.52,1378.98],[-1358.25,1379.45],[-1358.04,1379.8],[-1357.84,1380.16],[-1357.57,1380.63]];
for (const [x,z] of reviewed) {
  assert(covered(x,z), `repair mesh does not cover reviewed gap ${x},${z}`);
  const p = {x,z}; ctx.physics.resolve(p,.35,L.heightAt(x,z),1.7);
  assert(Math.hypot(p.x-x,p.z-z)<.05, `collider in repaired road ${x},${z}`);
}
for (const [x,z] of [[-526.97,3147.23],[-525.87,3147.8],[-524.76,3148.37],[-1821.03,3369.66],[-1820.03,3369.54],[-1819.03,3369.43]]) {
  assert(!covered(x,z), `removed Ligovsky/Moskovsky repair reappeared at ${x},${z}`);
}
// Tram grooves are painted above the patch. Test their actual integrated
// geometry and its height, not just the continued presence of OSM track data.
for(const id of ['w141926229','w141926228']) assert(TRAMWAYS.some(t=>t.id===id),`missing nearby tramway ${id}`);
const groove = new THREE.Color('#2a2c2f'); let railTriangles=0, railOverPatch=0;
ctx.scene.traverse(m=>{
  if(!m.isMesh||m.name!=='pt-paint'||!m.geometry.index||!m.geometry.attributes.color)return;
  const pos=m.geometry.attributes.position,col=m.geometry.attributes.color,ix=m.geometry.index;
  for(let i=0;i<ix.count;i+=3){
    const ids=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)];
    if(!ids.every(k=>Math.abs(col.getX(k)-groove.r)<1e-4&&Math.abs(col.getY(k)-groove.g)<1e-4&&Math.abs(col.getZ(k)-groove.b)<1e-4))continue;
    const points=ids.map(k=>new THREE.Vector3(pos.getX(k),pos.getY(k),pos.getZ(k)).applyMatrix4(m.matrixWorld));
    const x=points.reduce((a,p)=>a+p.x,0)/3,z=points.reduce((a,p)=>a+p.z,0)/3;
    if(!inBox([x,z],zagorodnyBox))continue;
    assert(points.every(p=>Math.abs(p.y-.051)<.001),'tram rail height changed');
    railTriangles++;
    if(covered(x,z)){
      ray.set(new THREE.Vector3(x,10,z),new THREE.Vector3(0,-1,0));
      const hit=ray.intersectObject(m,false);
      assert(hit.length&&hit[0].point.y>.04,`tram rail triangle is hidden or back-facing at ${x},${z}`);railOverPatch++;
    }
  }
});
assert(railTriangles>0,'no tram rail geometry at Zagorodny');
assert(railOverPatch>0,'no preserved tram rail over the Zagorodny repair');

// Triangulate OSM polygons with holes, then intersect every triangle of the
// actual rendered patch. This catches overlaps that point samples can miss.
const area = p => Math.abs(p.reduce((s,q,i)=>{const n=p[(i+1)%p.length];return s+q[0]*n[1]-n[0]*q[1]},0))/2;
const cross = (a,b,p) => (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
function triangleOverlap(a,b) {
  let p=a.slice(); const orientation=Math.sign(cross(b[0],b[1],b[2]));
  for(let i=0;i<3 && p.length;i++) {
    const c=b[i],d=b[(i+1)%3], next=[];
    for(let k=0;k<p.length;k++) {
      const q=p[k],r=p[(k+1)%p.length],x=orientation*cross(c,d,q),y=orientation*cross(c,d,r);
      if(x>=0)next.push(q);
      if((x<0&&y>0)||(x>0&&y<0)) {const t=x/(x-y);next.push([q[0]+t*(r[0]-q[0]),q[1]+t*(r[1]-q[1])]);}
    }
    p=next;
  }
  return p.length>=3 ? area(p) : 0;
}
function polyTriangles(poly) {
  const points = r => { const a=[]; for(let i=0;i<r.length;i+=2)a.push(new THREE.Vector2(r[i],r[i+1])); return a; };
  const outer=points(poly.o),holes=(poly.h||[]).map(points);
  const faces=THREE.ShapeUtils.triangulateShape(outer,holes), vertices=[...outer,...holes.flat()];
  return faces.map(f=>f.map(i=>[vertices[i].x,vertices[i].y]));
}
const synthetic = {o:[0,0,10,0,10,10,0,10],h:[[3,3,7,3,7,7,3,7]]};
const squareTriangles=polyTriangles(synthetic);
assert(squareTriangles.some(t=>triangleOverlap([[1,1],[2,1],[1,2]],t)>.01), 'grass overlap detector missed a contained patch');
assert(squareTriangles.every(t=>triangleOverlap([[4,4],[5,4],[4,5]],t)<1e-8), 'polygon hole should remain unfilled');
const pos=mesh.geometry.attributes.position,ix=mesh.geometry.index,patch=[];
for(let i=0;i<ix.count;i+=3) {
  const tri=[];for(let j=0;j<3;j++){const k=ix.getX(i+j),v=new THREE.Vector3(pos.getX(k),pos.getY(k),pos.getZ(k)).applyMatrix4(mesh.matrixWorld);tri.push([v.x,v.z]);}
  assert(boxes.some(box=>tri.every(point=>inBox(point,box))), 'a patch triangle bridges separate repair sites');patch.push(tri);
}
let compared=0;
for(const group of [GREEN,AREAS.filter(a=>a.hw==='traffic_island')]) for(const g of group) for(const p of g.polys||[]) {
  const xs=p.o.filter((_,i)=>i%2===0), zs=p.o.filter((_,i)=>i%2===1);
  if(!boxes.some(box=>Math.max(...xs)>=box[0]&&Math.min(...xs)<=box[1]&&Math.max(...zs)>=box[2]&&Math.min(...zs)<=box[3]))continue;
  for(const t of polyTriangles(p)) for(const r of patch) {
    compared++; const overlap=triangleOverlap(r,t);
    assert(overlap < 1e-5, `repair overlaps mapped ${g.kind||g.hw||'green'} ${g.id} by ${overlap.toFixed(6)} m²`);
  }
}
const ringContains=(a,x,z)=>{let hit=false;for(let i=0,j=a.length-2;i<a.length;j=i,i+=2)if((a[i+1]>z)!==(a[j+1]>z)&&x<(a[j]-a[i])*(z-a[i+1])/(a[j+1]-a[i+1])+a[i])hit=!hit;return hit;};
const greenNear=GREEN.flatMap(g=>(g.polys||[]).map(p=>({g,p}))).filter(({p})=>{const xs=p.o.filter((_,i)=>i%2===0),zs=p.o.filter((_,i)=>i%2===1);return boxes.some(box=>Math.max(...xs)>=box[0]&&Math.min(...xs)<=box[1]&&Math.max(...zs)>=box[2]&&Math.min(...zs)<=box[3]);});
let sampled=0;
for(let i=1;i<rows.length;i++) if(rows[i-1]&&rows[i]) for(let u=0;u<=1;u+=.05) for(let v=0;v<=1;v+=.05) {
  const a=rows[i-1],b=rows[i],x=(1-u)*((1-v)*a.a[0]+v*a.b[0])+u*((1-v)*b.a[0]+v*b.b[0]),z=(1-u)*((1-v)*a.a[1]+v*a.b[1])+u*((1-v)*b.a[1]+v*b.b[1]);
  assert(!L.inRiver(x,z)&&!L.insideBuilding(x,z,.05),`repair over water or building at ${x},${z}`);
  assert(!greenNear.some(({p})=>ringContains(p.o,x,z)&&!(p.h||[]).some(h=>ringContains(h,x,z))),`repair overlaps mapped green at ${x},${z}`);sampled++;
}
console.log(`PASS integrated Marata and Zagorodny repairs: ${reviewed.length} audited samples, ${patch.length} triangles, ${sampled} water/building/green samples, ${compared} green/island triangle comparisons; removed sites absent; ${railTriangles} tram triangles (${railOverPatch} over the repair)`);
