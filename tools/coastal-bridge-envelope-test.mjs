// Actual inland bridge meshes and every rail instance must remain within
// independently surveyed road corridors. CPU only; builds this module alone.
// node tools/area.mjs moskovskaya tools/coastal-bridge-envelope-test.mjs
// node tools/area.mjs narvsky tools/coastal-bridge-envelope-test.mjs
// --mutant-off-road injects a freestanding building away from all bridge roads
// and must fail through the same geometry scan.
import assert from 'node:assert/strict';
import {buildWorld} from './lib/headless-world.mjs';
import {ROADS,PLAY_RECTS} from '../src/world/data/city.js';

assert(['moskovskaya','narvsky'].includes(process.env.AREA),'this bounded inland oracle is for Moskovskaya and Narvsky');
const started=performance.now(),{ctx,THREE,errors}=await buildWorld({modules:['coastalBridges']});
assert.deepEqual(errors,[],'standalone bridge builder must succeed');
const svc=ctx.services.coastalBridges;assert(svc?.list.length,'exercise real mapped bridges');
assert(svc.list.every(b=>!b.marine&&!b.seaCanal&&!b.yacht),'harbour pylons/stays require a separate envelope oracle');
const CELL=64,grid=new Map(),nodes=new Map();let sourceSegments=0;
const insert=(record,x0,x1,z0,z1)=>{
  for(let x=Math.floor(x0/CELL);x<=Math.floor(x1/CELL);x++)for(let z=Math.floor(z0/CELL);z<=Math.floor(z1/CELL);z++){
    const key=x+','+z;let bucket=grid.get(key);if(!bucket)grid.set(key,bucket=[]);bucket.push(record);
  }
};
// Raw OSM points/widths are independent of the deck planner and rendered
// buffers. Only the owner's elevation limit is read from its published list.
// Slabs, webs, markings and rails fit within half-width +20cm; supports are
// centred on their road. The shared planner permits mitres of at most three
// half-widths at actual mapped joins, so only those nodes get wider discs.
for(const b of svc.list){
  const candidates=ROADS.filter(r=>r.id===b.road.id&&r.bridge&&!r.tunnel);
  const road=candidates.find(r=>r.pts===b.road.pts)||candidates.find(r=>JSON.stringify(r.pts)===JSON.stringify(b.road.pts));
  assert(road,'bridge must originate from a real mapped bridge way: '+b.id);
  const foot=/^(footway|path|cycleway|pedestrian|steps)$/.test(road.hw),half=Math.max(foot?1.8:3,road.w||6)/2;
  const top=Math.max(...b.heights)+1.35;
  assert(Number.isFinite(top),'bridge has a finite vertical envelope');
  for(let i=0;i<road.pts.length;i+=2){
    const x=road.pts[i],z=road.pts[i+1],key=x.toFixed(1)+','+z.toFixed(1);
    let node=nodes.get(key);if(!node)nodes.set(key,node={x,z,degree:0,half:0,top:-Infinity});
    node.degree+=(i?1:0)+(i+2<road.pts.length?1:0);node.half=Math.max(node.half,half);node.top=Math.max(node.top,top);
    if(!i)continue;
    const ax=road.pts[i-2],az=road.pts[i-1],dx=x-ax,dz=z-az,length2=dx*dx+dz*dz;
    if(length2<1e-8)continue;
    const radius=half+.2;
    insert({kind:'segment',id:road.id,ax,az,dx,dz,length2,radius,top},Math.min(ax,x)-radius,Math.max(ax,x)+radius,Math.min(az,z)-radius,Math.max(az,z)+radius);sourceSegments++;
  }
}
let joins=0;
for(const node of nodes.values())if(node.degree>1){
  const radius=node.half*3+.2;
  insert({kind:'join',id:'mapped join',ax:node.x,az:node.z,radius,top:node.top},node.x-radius,node.x+radius,node.z-radius,node.z+radius);joins++;
}
function inEnvelope(x,y,z){
  if(!Number.isFinite(x+y+z)||y< -5.05)return false;
  for(const r of grid.get(Math.floor(x/CELL)+','+Math.floor(z/CELL))||[]){
    if(y>r.top)continue;
    const t=r.kind==='segment'?Math.max(0,Math.min(1,((x-r.ax)*r.dx+(z-r.az)*r.dz)/r.length2)):0;
    const dx=x-r.ax-(r.dx||0)*t,dz=z-r.az-(r.dz||0)*t;
    if(dx*dx+dz*dz<=r.radius*r.radius)return true;
  }
  return false;
}
if(process.argv.includes('--mutant-off-road')){
  let spot;
  outer:for(const r of PLAY_RECTS)for(let x=r.x0+16;x<r.x1;x+=32)for(let z=r.z0+16;z<r.z1;z+=32){
    if([[-8,-8],[-8,8],[8,-8],[8,8],[0,0]].every(([dx,dz])=>!inEnvelope(x+dx,4,z+dz))){spot=[x,z];break outer;}
  }
  assert(spot,'mutation needs a real inland position away from bridge corridors');
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(6,8,6),ctx.mat.toon('#a2a5a0'));
  mesh.name='mutant-off-road-building';mesh.position.set(spot[0],4,spot[1]);ctx.addStatic(mesh);
}
ctx.scene.updateMatrixWorld(true);
const instance=new THREE.Matrix4(),world=new THREE.Matrix4(),point=new THREE.Vector3();
let meshes=0,instances=0,vertices=0,triangleProbes=0;const failures=[];
const probe=(x,y,z,mesh,index,kind)=>{
  if(!inEnvelope(x,y,z)&&failures.length<8)failures.push({mesh:mesh.name,instance:mesh.isInstancedMesh?index:null,kind,point:[x,y,z]});
};
ctx.scene.traverse(mesh=>{
  if(!mesh.isMesh)return;
  meshes++;const positions=mesh.geometry.attributes.position,count=mesh.isInstancedMesh?mesh.count:1,indices=mesh.geometry.index,transformed=new Float64Array(positions.count*3);
  if(mesh.isInstancedMesh)instances+=count;
  for(let index=0;index<count;index++){
    if(mesh.isInstancedMesh){mesh.getMatrixAt(index,instance);world.multiplyMatrices(mesh.matrixWorld,instance);}else world.copy(mesh.matrixWorld);
    for(let v=0;v<positions.count;v++){
      point.fromBufferAttribute(positions,v).applyMatrix4(world);vertices++;
      transformed[v*3]=point.x;transformed[v*3+1]=point.y;transformed[v*3+2]=point.z;
      probe(point.x,point.y,point.z,mesh,index,'vertex');
    }
    // Interior probes also reject a broad wall/floor whose corner vertices
    // happen to land on separate nearby roads while its middle spans dry land.
    for(let t=0;t<(indices?.count||positions.count);t+=3){
      const a=(indices?indices.getX(t):t)*3,b=(indices?indices.getX(t+1):t+1)*3,c=(indices?indices.getX(t+2):t+2)*3;
      probe((transformed[a]+transformed[b]+transformed[c])/3,(transformed[a+1]+transformed[b+1]+transformed[c+1])/3,(transformed[a+2]+transformed[b+2]+transformed[c+2])/3,mesh,index,'triangle interior');triangleProbes++;
    }
  }
});
assert(meshes>0&&instances>100&&vertices>10000,'audit actual static meshes and bounded knockable rail instances');
assert.deepEqual(failures,[],'off-road geometry escapes the surveyed bridge/rail/support envelope');
console.log(JSON.stringify({area:process.env.AREA,bridges:svc.list.length,sourceSegments,joins,meshes,instances,vertices,triangleProbes,elapsedMs:Math.round(performance.now()-started)}));
console.log('PASS actual inland bridge geometry remains in surveyed deck, rail and support corridors.');
