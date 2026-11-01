// Keep both Kolomna routes that exposed overlapping banks and a corner fold.
// node tools/area.mjs kolomna tools/natural-bank-overlap-test.mjs
// --mutant-unfitted restores old widths before building; it must fail.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { fitNaturalBankWidths, naturalBankSurfaces, bankHeightQuery } from '../src/world/environment/shore-profile.js';
import { slopeRuns, slopeHeightAt } from '../src/world/environment/waterways.js';
import { Player } from '../src/core/player.js';

assert.equal(process.env.AREA,'kolomna','this regression retains actual Kolomna coordinates');
const fakeRun=(x,mx,key,run)=>({bank:{id:key},reach:{id:key,key,run,kerb:.1,lip:.1},closed:false,
  fr:[{x,z:-5,mx,mz:0,k:1},{x,z:5,mx,mz:0,k:1}]});
const synthetic=[fakeRun(0,1,'pond',6),fakeRun(4,-1,'canal',9)];
fitNaturalBankWidths(synthetic,(x)=>x<0||x>4);
const isolated=[fakeRun(100,1,'isolated',6)];
fitNaturalBankWidths(isolated,x=>x<100);
assert(isolated[0].fr.every(q=>q.landScale===1),'an unconstrained shore keeps its full designed width');
for(const r of synthetic)for(const q of r.fr){
  const width=(r.reach.run+.3)*q.landScale;
  assert(width>1.95&&width<1.97,'each bank reserves less than half the four-metre dry strip');
}
const syntheticSurfaces=naturalBankSurfaces(synthetic,{pond:{water:-.8,bed:-1.2},canal:{water:-3.4,bed:-4.6}});
const syntheticHeight=bankHeightQuery(syntheticSurfaces);
assert.equal(syntheticHeight(2,0),null,'a dry ridge remains ordinary ground between different bank levels');
let last=null,syntheticSamples=0;
for(let x=.01;x<4;x+=.01){const y=syntheticHeight(x,0)??0;
  if(last!==null)assert(Math.abs(y-last)<.26,'unequal-level synthetic banks have no ledge beyond a normal coping step');
  last=y;syntheticSamples++;
}

// Restore the pre-fix widths in memory before any drawn/terrain cache is built.
// This changes no file, and makes the real retained route catch the old ledge.
const runs=slopeRuns();
if(process.argv.includes('--mutant-unfitted'))for(const r of runs)for(const q of r.fr)q.landScale=1;
const {ctx,L,THREE,errors}=await buildWorld({});assert.deepEqual(errors,[]);
ctx.staticRoot.updateMatrixWorld(true);
const ph=ctx.physics,bankMeshes=[];
ctx.staticRoot.traverse(o=>{if(o.isMesh&&/^env-quay-(grass|coping-|submerged-bank)/.test(o.name))bankMeshes.push(o);});
assert(bankMeshes.length,'real bank mesh required');
const routes=[
  {name:'pond-canal overlap',land:[-5245.678309454046,3105.931857654299],wet:[-5246.09192789714,3116.159477344769]},
  {name:'canal-mouth corner',land:[-5267.3761701,3071.4999291],wet:[-5280.0114025,3082.4196773]},
];
const ray=new THREE.Raycaster();ray.layers.enableAll();
let samples=0,drawProbes=0,maxStep=0,maxRenderError=0;
// Five parallel lanes per route cover each ledge and its neighbourhood.
for(const {name,land,wet} of routes){
 assert.equal(ph.waterLevel(...land),null,`${name}: dry endpoint`);
 assert.notEqual(ph.waterLevel(...wet),null,`${name}: wet endpoint`);
 for(const shift of [-.5,-.25,0,.25,.5]){
  let previous=null;
  for(let i=0;i<=400;i++){
    const t=i/400,x=land[0]+(wet[0]-land[0])*t+shift,z=land[1]+(wet[1]-land[1])*t,y=L.heightAt(x,z);
    assert(Number.isFinite(y));const ground=ph.surfaceAt(x,z,10,false,{});
    assert.equal(ground.kind,'terrain','retained route must exercise actual terrain');
    assert.equal(ground.y,y,'physics matches visible bank terrain');
    if(previous!==null){const delta=Math.abs(y-previous);maxStep=Math.max(maxStep,delta);
      assert(delta<.26,`bank cliff in ${name} lane ${shift}: ${x},${z}, height jump ${delta}`);
    }
    previous=y;samples++;
    if(i%8||slopeHeightAt(x,z)===null)continue;
    ray.set(new THREE.Vector3(x,5,z),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObjects(bankMeshes,false)[0];assert(hit,'actual front-facing bank mesh covers its physical ground');
    const error=Math.abs(hit.point.y-y);maxRenderError=Math.max(maxRenderError,error);
    assert(error<.025,`rendered bank disagrees with terrain at ${x},${z}: ${error}`);drawProbes++;
  }
 }
}
let walkingSteps=0;
function walk(start,end){
  const p=new Player(new THREE.PerspectiveCamera(),{addEventListener(){},requestPointerLock(){}},ph,L.WORLD.play);
  p.enabled=true;p.clampXZ=L.clampToPlay;p.solidAt=L.insideBuilding;p.smoothing=0;p.setPose(start[0],start[1],0,0);
  p.keys.add('KeyW');let rescues=0;p.onRescue=()=>rescues++;
  for(let f=0;f<1200;f++){
    const dx=end[0]-p.pos.x,dz=end[1]-p.pos.z;if(Math.hypot(dx,dz)<.14)break;
    p.yaw=Math.atan2(-dx,-dz);p.time+=1/60;p.update(1/60);walkingSteps++;
  }
  p.keys.clear();p.vel.set(0,0,0);
  for(let f=0;f<60;f++){p.time+=1/60;p.update(1/60);}
  assert.equal(rescues,0,'retained route must not rescue walker');
  assert(Math.hypot(end[0]-p.pos.x,end[1]-p.pos.z)<.2,`retained route blocked; reached ${p.pos.x},${p.pos.y},${p.pos.z}`);
  assert(Math.abs(p.pos.y-L.heightAt(p.pos.x,p.pos.z))<.09,'walker rests on drawn terrain');
}
for(const {land,wet} of routes){walk(land,wet);walk(wet,land);}
console.log(JSON.stringify({area:'kolomna',runs:runs.length,syntheticSamples,samples,drawProbes,maxStep,maxRenderError,walkingRoutes:routes.length*2,walkingSteps,routes}));
console.log('PASS natural-bank overlap geometry and both retained two-way player routes');
