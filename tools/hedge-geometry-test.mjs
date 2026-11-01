// Closed, outward-facing vegetation solids using actual area hedge runs.
// node tools/area.mjs moskovskaya tools/hedge-geometry-test.mjs
// node tools/area.mjs palace tools/hedge-geometry-test.mjs
// --academy builds the real Academy garden and checks its bespoke hedge bays.
// --mutant-open-ends / --mutant-reverse-cap mutate test copies and must fail.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { mainModules } from './modules-list.mjs';
import { hedgeGeometry } from '../src/world/environment/lawns.js';

const {ctx,THREE}=await buildWorld({modules:[]});
ctx.buildList=mainModules();
let meshes=0,triangles=0,rayProbes=0,runs=0;
function closedGeometry(geo,label,{coincidentRuns=false}={}){
  const p=geo.attributes.position,n=geo.attributes.normal,idx=geo.index,edges=new Map(),weld=new Map(),ids=[];
  assert(idx&&p&&n,`${label}: indexed solid geometry`);
  for(let i=0;i<p.count;i++){
    const point=[p.getX(i),p.getY(i),p.getZ(i)];assert(point.every(Number.isFinite));
    const k=point.join(',');if(!weld.has(k))weld.set(k,weld.size);ids.push(weld.get(k));
  }
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),cross=new THREE.Vector3(),normal=new THREE.Vector3();
  for(let i=0;i<idx.count;i+=3){
    const vs=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];
    a.fromBufferAttribute(p,vs[0]);b.fromBufferAttribute(p,vs[1]);c.fromBufferAttribute(p,vs[2]);
    cross.crossVectors(b.sub(a),c.sub(a));assert(cross.lengthSq()>1e-14,`${label}: no degenerate faces`);
    normal.set(0,0,0);for(const v of vs)normal.add(new THREE.Vector3().fromBufferAttribute(n,v));
    assert(cross.dot(normal)>0,`${label}: triangle winding agrees with outward shading normals`);
    for(let j=0;j<3;j++){
      const u=ids[vs[j]],v=ids[vs[(j+1)%3]],key=u<v?`${u},${v}`:`${v},${u}`;
      let e=edges.get(key);if(!e)edges.set(key,e={count:0,balance:0});e.count++;e.balance+=u<v?1:-1;
    }
    triangles++;
  }
  // The combined mesh can contain separately closed runs meeting at precisely
  // the same edge. Welding their positions merges both edge incidences. Every
  // individual run below still requires exactly two faces; only this aggregate
  // mesh accepts even multiplicity with balanced orientation.
  let coincident=0;
  for(const [key,e] of edges){
    assert(e.balance===0&&(e.count===2||(coincidentRuns&&e.count>=4&&e.count%2===0)),`${label}: closed manifold edge ${key} has ${e.count} faces / winding balance ${e.balance}`);
    if(e.count>2)coincident++;
  }
  if(coincident)console.log(`${label}: ${coincident} balanced coincident edges between independently checked runs`);
  meshes++;
}
const material=new THREE.MeshBasicMaterial({side:THREE.FrontSide}),ray=new THREE.Raycaster();
function covered(mesh,origin,direction,far,label){
  ray.set(new THREE.Vector3(...origin),new THREE.Vector3(...direction).normalize());ray.near=0;ray.far=far;
  const hits=ray.intersectObject(mesh,false);assert(hits.length,`${label}: real outward surface must cover the view`);rayProbes++;
}
function hedgeRun(run,index){
  const geo=hedgeGeometry([run]),p=geo.attributes.position,idx=geo.index;
  const dx=run.bx-run.ax,dz=run.bz-run.az,len=Math.hypot(dx,dz),tx=dx/len,tz=dz/len,nx=-tz,nz=tx;
  if(process.argv.includes('--mutant-open-ends')&&index===0){
    const kept=[];
    for(let i=0;i<idx.count;i+=3){const vertices=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];
      const u=vertices.map(j=>(p.getX(j)-run.ax)*tx+(p.getZ(j)-run.az)*tz);
      if(u.every(v=>Math.abs(v)<.002)||u.every(v=>Math.abs(v-len)<.002))continue;kept.push(...vertices);
    }geo.setIndex(kept);
  }
  if(process.argv.includes('--mutant-reverse-cap')&&index===0){
    for(let i=0;i<idx.count;i+=3){const vs=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];
      if(vs.every(j=>Math.abs((p.getX(j)-run.ax)*tx+(p.getZ(j)-run.az)*tz)<.002)){const v=idx.getX(i+1);idx.setX(i+1,idx.getX(i+2));idx.setX(i+2,v);break;}
    }
  }
  closedGeometry(geo,`run ${index}`);
  const mesh=new THREE.Mesh(geo,material);mesh.updateMatrixWorld(true);
  for(const [x,z,sign] of [[run.ax,run.az,-1],[run.bx,run.bz,1]])for(const height of [.15,.4,.6])for(const across of [-.1,0,.1])
    covered(mesh,[x+tx*sign*.7+nx*across,run.h*height,z+tz*sign*.7+nz*across],[-tx*sign,0,-tz*sign],.9,`run ${index} end ${sign}`);
  for(const side of [-1,1])covered(mesh,[(run.ax+run.bx)/2+nx*side,run.h*.25,(run.az+run.bz)/2+nz*side],[-nx*side,0,-nz*side],1.5,`run ${index} side`);
  covered(mesh,[(run.ax+run.bx)/2,run.h+1,(run.az+run.bz)/2],[0,-1,0],2+run.h,`run ${index} top`);
  covered(mesh,[(run.ax+run.bx)/2,-.5,(run.az+run.bz)/2],[0,1,0],.7,`run ${index} underside`);
  geo.dispose();runs++;
}

if(!process.argv.includes('--academy')){
  const {build}=await import('../src/world/environment.js');await build(ctx);
  const actual=ctx.services.environment.hedges;
  assert(actual.length>0,'selected area must contain generated hedge runs');
  let sourceMesh;ctx.staticRoot.traverse(o=>{if(o.name==='env-hedges')sourceMesh=o;});assert(sourceMesh);
  assert.equal(sourceMesh.material.side,THREE.FrontSide,'do not conceal missing faces by disabling culling');
  closedGeometry(sourceMesh.geometry,'actual environment hedge mesh',{coincidentRuns:true});
  actual.forEach(hedgeRun);
  if(process.env.AREA==='moskovskaya'){
    const near=actual.filter(r=>Math.min(Math.hypot(r.ax+1422.6,r.az-7289.4),Math.hypot(r.bx+1422.6,r.bz-7289.4))<40);
    assert(near.length>0,'include real hedge ends near the reported Victory Park pose');console.log('reported-pose nearby runs:',JSON.stringify(near));
  }
  // Reversed and oblique short/long profiles prevent an axis-specific cap fix.
  for(const [i,[ax,az,bx,bz]] of [[0,0,.8,.2],[17,-4,-7,11],[100,30,100,-25],[-4,12,-30,-50]].entries())hedgeRun({ax,az,bx,bz,h:1.1,tint:'#6f9a48'},actual.length+i);
}else{
  const {build}=await import('../src/world/landmarksAcademy.js');await build(ctx);
  const hedges=[];ctx.staticRoot.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.material?.name==='lmacade-hedge')hedges.push(o);});
  // The collector's material can have a factory-assigned name; select by the
  // exact dedicated material suffix rather than the whole building mesh.
  if(!hedges.length)ctx.staticRoot.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.material?.name?.includes('hedge'))hedges.push(o);});
  assert(hedges.length,'real Academy hedge geometry must be present');
  for(const mesh of hedges)closedGeometry(mesh.geometry,'actual Academy hedge mesh');
}
console.log(`hedge geometry: ${runs} actual/varied runs, ${meshes} closed meshes, ${triangles} triangles, ${rayProbes} outward ray probes OK`);
