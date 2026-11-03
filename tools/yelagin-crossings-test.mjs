// Real drawn triangles and colliders at Elagin's pond crossings and bank paths.
// node tools/area.mjs islands tools/yelagin-crossings-test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from './lib/headless-world.mjs';
import {yelaginShoreRegion} from '../src/areas/islands/shore.js';
import {PONDS,SLUICES,frameOfPond,pondApproaches} from '../src/world/bridges/yelaginPonds/specs.js';
import {deckAt} from '../src/world/streets/decks.js';
import {Player} from '../src/core/player.js';
assert.equal(process.env.AREA,'islands');
const {ctx,L,THREE,errors}=await buildWorld({modules:['environment','streets','landmarksYelaginSpits','bridges','bridgesPetro']});
assert.deepEqual(errors,[]);
ctx.staticRoot.updateMatrixWorld(true);
const v=new THREE.Vector3(),matrix=new THREE.Matrix4();
// A low stone lip is intentionally above a strip of paving at the river edge.
// Test its actual triangles before excluding hidden paving from lift checks.
const coping=new Map(),cell=4;
ctx.staticRoot.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh||!/^env-quay-coping-/.test(mesh.name))return;
  const p=mesh.geometry.attributes.position,ix=mesh.geometry.index;
  for(let i=0;i<(ix?.count||p.count);i+=3){
    const q=[0,1,2].map(j=>{v.fromBufferAttribute(p,ix?ix.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld);return[v.x,v.y,v.z];});
    if(!q.flat().every(Number.isFinite))continue;
    const[a,b,c]=q,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-9)continue;
    for(let x=Math.floor(Math.min(...q.map(p=>p[0]))/cell);x<=Math.floor(Math.max(...q.map(p=>p[0]))/cell);x++)
      for(let z=Math.floor(Math.min(...q.map(p=>p[2]))/cell);z<=Math.floor(Math.max(...q.map(p=>p[2]))/cell);z++){
        const k=x*8192+z;if(!coping.has(k))coping.set(k,[]);coping.get(k).push({a,b,c,den});
      }
  }
});
function hiddenByCoping(x,z,y){
  for(const{a,b,c,den}of coping.get(Math.floor(x/cell)*8192+Math.floor(z/cell))||[]){
    const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,w=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den,t=1-u-w;
    if(Math.min(u,w,t)>-1e-6&&u*a[1]+w*b[1]+t*c[1]>=y-.01)return true;
  }return false;
}
let plates=0,paving=0,lowered=0,maxError=0,hidden=0;const bad=[];
ctx.staticRoot.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh||!mesh.geometry?.attributes.position)return;
  const wall=/^env-quay-wall-deck-/.test(mesh.name),path=/^pt-foot-/.test(mesh.name);
  if(!wall&&!path)return;
  const p=mesh.geometry.attributes.position,ix=mesh.geometry.index,n=ix?.count||p.count;
  for(let i=0;i<n;i+=3){
    const q=[0,1,2].map(j=>{v.fromBufferAttribute(p,ix?ix.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld);return[v.x,v.y,v.z];});
    if(!q.flat().every(Number.isFinite))continue;
    const cx=q.reduce((s,a)=>s+a[0],0)/3,cz=q.reduce((s,a)=>s+a[2],0)/3;
    if(!yelaginShoreRegion(cx,cz))continue;
    if(wall){if(Math.max(...q.map(a=>a[1]))>-2.5)plates++;continue;}
    for(const [a,b] of [[1/3,1/3],[.8,.1],[.1,.8],[.1,.1],[.45,.45],[.05,.45],[.45,.05]]){
      const c=1-a-b,x=q[0][0]*a+q[1][0]*b+q[2][0]*c,z=q[0][2]*a+q[1][2]*b+q[2][2]*c,y=q[0][1]*a+q[1][1]*b+q[2][1]*c;
      if(!yelaginShoreRegion(x,z))continue;
      const ground=L.heightAt(x,z),delta=y-ground;
      paving++;if(y<-.2)lowered++;
      const occluded=hiddenByCoping(x,z,y);if(occluded)hidden++;else maxError=Math.max(maxError,Math.abs(delta-.044));
      // A stone lip may reduce the ordinary 4 cm clearance, while the paving
      // is still above that real surface. It must never hover or enter soil.
      if(!occluded&&(delta<.005||delta>.075)||deckAt(x,z,-.015))if(bad.length<8)bad.push({x,z,y,ground,delta,deck:deckAt(x,z,-.015)?.id});
    }
  }
});
assert.equal(plates,0,'no old full-height quay sheets below park bridges');
assert(paving>500&&lowered>100,'the test sees real bank paving, including lowered strips');
assert.deepEqual(bad,[],'all bank paving follows the real floor and leaves bridge decks clear: '+JSON.stringify(bad));
console.log(`PASS bank paving: ${paving} triangle probes, ${lowered} below old street height, ${hidden} hidden by stone coping, max visible lift deviation ${maxError.toFixed(5)} m; no quay sheets`);

function blocks(it,x,z,y){
  if(it.y1<=y+.12||it.y0>=y+1.7)return false;
  const dx=x-it.cx,dz=z-it.cz;
  if(it.type==='cyl')return Math.hypot(dx,dz)<it.r+.04;
  return it.type==='box'&&Math.abs(dx*it.c-dz*it.s)<it.hw+.04&&Math.abs(dx*it.s+dz*it.c)<it.hd+.04;
}
let passage=0;
for(const sp of SLUICES){
  const f=frameOfPond(sp),hl=Math.max(9,sp.len)/2;
  assert.equal(deckAt(f.cx,f.cz)?.id,sp.id,`${sp.id} paving reservation`);
  const probes=[];
  for(const u of [-.8,-.4,0,.4,.8].map(t=>t*hl))for(const v of [-.25,0,.25])probes.push([u,v]);
  for(const u of [-hl-.8,hl+.8])for(const v of [-.65,.65])probes.push([u,v]);
  for(const [u,v]of probes){const x=f.cx+u*f.c-v*f.s,z=f.cz+u*f.s+v*f.c;
    const hits=[...ctx.physics._query(x,z,2)].filter(it=>blocks(it,x,z,.32));
    assert.equal(hits.length,0,`${sp.id}: hardware or a bollard blocks the crossing at ${u},${v}`);passage++;
  }
}
console.log(`PASS ${SLUICES.length} clear sluice crossings: ${passage} physical passage probes`);

let walking=0;const routes=[];
for(const sp of [...PONDS,...SLUICES])for(const sign of [-1,1]){
  const f=frameOfPond(sp),hl=sp.wd?Math.max(9,sp.len)/2:Math.max(f.len,sp.ring?.[0]||0)/2;
  const plans=pondApproaches(sp,L.heightAt),end=side=>Math.max(hl,...plans.filter(a=>a.side===side).map(a=>a.outer))+.5;
  const a=[f.cx-sign*f.c*end(-sign),f.cz-sign*f.s*end(-sign)],b=[f.cx+sign*f.c*end(sign),f.cz+sign*f.s*end(sign)];
  routes.push({id:sp.id,sign,a,b,centre:[f.cx,f.cz]});
  const p=new Player(new THREE.PerspectiveCamera(),{addEventListener(){},requestPointerLock(){}},ctx.physics,L.WORLD.play);
  p.enabled=true;p.clampXZ=L.clampToPlay;p.solidAt=L.insideBuilding;p.smoothing=0;p.setPose(...a,0,0);p.keys.add('KeyW');
  let onDeck=false,rescues=0;p.onRescue=()=>rescues++;
  for(let i=0;i<1200;i++){
    const dx=b[0]-p.pos.x,dz=b[1]-p.pos.z;if(Math.hypot(dx,dz)<.15)break;
    p.yaw=Math.atan2(-dx,-dz);p.time+=1/60;p.update(1/60);
    if(Math.hypot(p.pos.x-f.cx,p.pos.z-f.cz)<1&&p.pos.y>(sp.wd?.25:-.1))onDeck=true;
  }
  assert(Math.hypot(p.pos.x-b[0],p.pos.z-b[1])<.2,`${sp.id}: cannot walk across approach ${sign}; at ${p.pos.x},${p.pos.y},${p.pos.z}; target ${b}; plans ${JSON.stringify(plans)}`);
  assert(onDeck,`${sp.id}: walker went underneath instead of across the deck`);assert.equal(rescues,0);walking++;
}
console.log(`PASS ${walking} real Player traversals across pond bridges, sluice decks and full approaches`);

const hedges=ctx.knock.list.filter(r=>r.parts.some(p=>p.mesh?.name.startsWith('yspit-hedges')));
assert(hedges.length>20,'wing hedges are present as real knockable foliage');
let roots=0,maxHover=-Infinity,maxBurial=0;
for(const r of hedges){
  assert.equal(r.kind,'hedge');assert(r.items.every(it=>it.source.knock===r));
  for(const part of r.parts){if(!part.mesh)continue;const mesh=part.mesh,p=mesh.geometry.attributes.position;
    mesh.getMatrixAt(part.index,matrix);matrix.premultiply(mesh.matrixWorld);
    for(let i=0;i<p.count;i++){if(Math.abs(p.getY(i))>1e-6)continue;
      v.fromBufferAttribute(p,i).applyMatrix4(matrix);const delta=v.y-L.heightAt(v.x,v.z);
      maxHover=Math.max(maxHover,delta);maxBurial=Math.max(maxBurial,-delta);roots++;
    }
  }
}
assert(maxHover<.13,`hedges float above their bank by ${maxHover} m`);
assert(maxBurial<.6,`hedges buried by ${maxBurial} m`);
const hedge=hedges[Math.floor(hedges.length/2)],items=hedge.items.slice();
ctx.knock.hit(hedge.x,hedge.z,30,1,0,'hedge');
assert.notEqual(hedge.state,'stand','a hedge can break away');
assert(items.every(it=>!ctx.physics.items.includes(it)),'a knocked hedge releases its collider');
console.log(`PASS ${hedges.length} closed breakable hedges: ${roots} root probes, hover ${maxHover.toFixed(3)} m, burial ${maxBurial.toFixed(3)} m`);
const json=process.argv.indexOf('--json');if(json>=0)fs.writeFileSync(process.argv[json+1],JSON.stringify({routes,paving,passage,walking,roots,maxHover,maxBurial},null,2));
