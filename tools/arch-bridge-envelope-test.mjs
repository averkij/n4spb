// Closed generic bridge ends, exact bank footprints and real abutment solids.
// node tools/area.mjs <area> tools/arch-bridge-envelope-test.mjs
// No GPU: builds the actual makeArch geometry, including every generic site.
import assert from 'node:assert/strict';
import {buildWorld} from './lib/headless-world.mjs';
import {SITES,WATER_Y,EXT,toUV} from '../src/world/bridges/sites.js';
import {makeArch} from '../src/world/bridges/arch.js';
import {makeMats} from '../src/world/bridges/mats.js';
import {Parts} from '../src/world/bridges/kit.js';
import {carContact} from '../src/world/drive/collision.js';
import {SPEC_BOAT} from '../src/world/drive/boat/handling.js';
const {ctx,THREE,errors}=await buildWorld({modules:[]});assert.deepEqual(errors,[]);
const M=makeMats(ctx),ray=new THREE.Raycaster();ray.layers.enableAll();
const deckMats=new Set([M.asphalt,M.pave,M.sett,M.plank,M.tramSlab,M.footAsphalt,M.graniteGrey,M.kerb].filter(Boolean));
let bridges=0,ends=0,solids=0,cornices=0,deckVertices=0,wetJunctions=0,missingCapMutant=false,rectangleMutant=false,damMutant=false;
const records=[];
for(const site of SITES.filter(s=>s.kind==='road'&&s.id!=='belinsky')){
  const P=new Parts(),root=new THREE.Group(),B=makeArch({ctx,P,M,rails:null,waterY:WATER_Y[site.ww]},site);
  B.draw();B.colliders();const meshes=P.build(root,{name:'envelope-'+site.id});root.updateMatrixWorld(true);
  const directionU=new THREE.Vector3(B.f.c,0,B.f.s),world=(u,y,v)=>{const p=B.world(u,v);return new THREE.Vector3(p.x,y,p.z);};
  const raw=[...B.vs,...site.zones.flatMap(z=>[z[0],z[1]])].sort((a,b)=>a-b),stations=raw.filter((v,i)=>i===0||v-raw[i-1]>1e-8);
  const probes=[];
  for(let i=0;i+1<stations.length;i++)for(const side of[-1,1]){
    const v=(stations[i]+stations[i+1])/2,edge=B.bank(v)[side<0?0:1]+side*EXT,back=B.world(edge+side*.08,v);
    const dry=ctx.physics.waterLevel(back.x,back.z)===null,lift={pave:.12,sett:.02,plaza:.1,walk:.12,barrier:.45}[site.zones.find(q=>v>=q[0]-1e-7&&v<=q[1]+1e-7)?.[2]]??0;
    const full=dry||v<site.v0+.120001||v>site.v1-.120001,y=full?B.waterY+.15:B.yDeck(edge)+lift-.25;
    const outside=world(edge+side*.35,y,v);ray.set(outside,directionU.clone().multiplyScalar(-side));
    const hit=ray.intersectObjects(meshes,false)[0];
    assert(hit&&Math.abs(hit.distance-.35)<.025,`${site.id}: hollow landward abutment end at u${edge},v${v},y${y}; hit${hit?.distance}`);
    probes.push({outside,direction:directionU.clone().multiplyScalar(-side)});ends++;
    const inside=world(edge-side*.12,y,v);
    assert(ctx.physics.columnBlocked(inside.x,inside.z,.035,y-.04,y+.12),`${site.id}: visible abutment has no matching solid`);solids++;
    if(!full){
      const boat={x:inside.x,z:inside.z,y:B.waterY,yaw:0,floats:true},spec={W:.15,len:.15,centerZ:0,hgt:SPEC_BOAT.hgt};
      assert(![...ctx.physics.querySolids(boat.x,boat.z,.2)].some(b=>carContact(boat,spec,b,{})),`${site.id}: a wet bridge junction end became a full-depth dam`);wetJunctions++;
      if(!damMutant){const block=ctx.physics.addBox(boat.x,boat.z,.3,.3,0,B.waterY-.6,B.yDeck(edge));damMutant=carContact(boat,spec,block,{});ctx.physics.remove(block);}
    }
  }
  for(const sg of[-1,1])for(const side of[-1,1]){
    const v=sg<0?site.v0:site.v1,edge=B.bank(v)[side<0?0:1]+side*EXT,y=B.yDeck(edge)-.10;
    ray.set(world(edge+side*.3,y,v+sg*.035),directionU.clone().multiplyScalar(-side));
    const hit=ray.intersectObjects(meshes,false)[0];assert(hit&&Math.abs(hit.distance-.3)<.025,`${site.id}: open terminal cornice cap`);cornices++;
  }
  const outsideDeck=(x,y,z)=>{const q=toUV(site,x,z),[a,b]=B.bank(q.v);return q.u<a-EXT-.025||q.u>b+EXT+.025;};
  for(const mesh of meshes){if(!deckMats.has(mesh.material))continue;const pos=mesh.geometry.attributes.position;
    for(let i=0;i<pos.count;i++){assert(!outsideDeck(pos.getX(i),pos.getY(i),pos.getZ(i)),`${site.id}: deck rectangle projects beyond its own skew bank`);deckVertices++;}
  }
  // Remove actual triangles on both landward endpoint surfaces. The same
  // ray oracle must fail: a test that merely sees the inner bank wall fails
  // this mutation even when its bounds still contain a complete bridge.
  if(!missingCapMutant){
    const changed=[];
    for(const mesh of meshes){const g=mesh.geometry,pos=g.attributes.position,idx=g.index,keep=[];
      for(let i=0;i<idx.count;i+=3){const ids=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)],qs=ids.map(j=>toUV(site,pos.getX(j),pos.getZ(j)));
        const cap=[-1,1].some(side=>qs.every(q=>Math.abs(q.u-(B.bank(q.v)[side<0?0:1]+side*EXT))<.001));
        if(!cap)keep.push(...ids);
      }
      changed.push([g,idx]);g.setIndex(keep);
    }
    missingCapMutant=probes.some(p=>{ray.set(p.outside,p.direction);const hit=ray.intersectObjects(meshes,false)[0];return!hit||Math.abs(hit.distance-.35)>.025;});
    for(const [g,idx]of changed)g.setIndex(idx);
  }
  // Reproduce the old min/max-bank rectangular deck strip in a skewed site.
  // Its actual vertices must be rejected by the same footprint oracle.
  if(!rectangleMutant)for(let i=0;i+1<B.vs.length;i++){
    const va=B.vs[i],vb=B.vs[i+1],[a0,b0]=B.bank(va),[a1,b1]=B.bank(vb);
    if(Math.max(Math.abs(a1-a0),Math.abs(b1-b0))<.1)continue;
    const rect=[[Math.min(a0,a1)-EXT,va],[Math.max(b0,b1)+EXT,va],[Math.max(b0,b1)+EXT,vb],[Math.min(a0,a1)-EXT,vb]];
    const g=new THREE.BufferGeometry().setFromPoints(rect.map(([u,v])=>world(u,B.yDeck(u),v))),p=g.attributes.position;
    rectangleMutant=Array.from({length:p.count},(_,j)=>outsideDeck(p.getX(j),p.getY(j),p.getZ(j))).some(Boolean);g.dispose();
  }
  records.push({id:site.id,endProbes:probes.length});bridges++;
  for(const m of meshes)m.geometry.dispose();
}
if(!bridges){console.log(`SKIP (${process.env.AREA||'strip'}): area contains no generic arch sites.`);process.exit(0);}
assert(missingCapMutant,'missing-endcap mutation was not detected');
if(wetJunctions)assert(damMutant,'full-depth wet-junction dam mutation was not detected');
if(records.some(r=>r.id==='teatralny'))assert(rectangleMutant,'old skew rectangle mutation was not detected');
console.log(`Arch bridge envelope PASS (${process.env.AREA||'strip'}): ${bridges} bridges,${ends} real closed end rays,${solids} matching abutment solids,${cornices} closed cornice ends,${deckVertices} exact-footprint deck vertices,${wetJunctions} open wet-junction probes; missing-cap and skew-rectangle mutations detected.`);
console.log(JSON.stringify(records));
