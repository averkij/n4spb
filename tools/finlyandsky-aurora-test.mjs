// Actual ship geometry/physics plus the Sampson stacked-part regression.
// node tools/area.mjs finlyandsky tools/finlyandsky-aurora-test.mjs
// node tools/area.mjs sampson tools/finlyandsky-aurora-test.mjs
import assert from 'node:assert/strict';
import {buildWorld} from './lib/headless-world.mjs';
import {build} from '../src/world/finlyandskyAurora.js';
import {SHIP,shipWaterY} from '../src/world/landmarksAurora/frame.js';
import {deckY} from '../src/world/landmarksAurora/hull.js';
import {NAVIGABLE_WATER_Y} from '../src/world/environment/water-level.js';
import {LOD} from '../src/core/lod.js';
const {ctx,L,THREE}=await buildWorld({modules:[]});ctx.buildList=['finlyandskyAurora'];await build(ctx);
const {BUILDINGS}=await import('../src/world/data/city.js');
const {prepare,view}=await import('../src/world/city/prep.js');
let passed=0;
const check=(name,fn)=>{fn();passed++;console.log('PASS',name);};
check('ship has the common waterline, detailed hull and a bounded closed far mass',()=>{
  const svc=ctx.services.finlyandskyAurora;assert(svc&&svc.ship.afloat);assert.equal(svc.ship.waterY,NAVIGABLE_WATER_Y);assert.equal(shipWaterY(),NAVIGABLE_WATER_Y);
  assert(svc.triangles>20000&&svc.triangles<150000);assert.equal(svc.crowd.length,0);
  const roots=ctx.staticRoot.children.filter(o=>o.name==='finlyandskyAurora'||o.name==='aurora-far-mass');assert.equal(roots.length,2);
  let meshes=0;for(const root of roots)root.traverse(o=>{if(o.isMesh){assert(Number.isFinite(LOD.of(o)?.far),o.name+' lacks a finite authored range');meshes++;}});assert(meshes>15);
});
check('drawn weather decks and exact Physics triangles agree at bow, waist and stern',()=>{
  ctx.scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(),root=ctx.staticRoot.children.find(o=>o.name==='finlyandskyAurora');
  for(const s of[-52,-12,10,48]){
    const p=SHIP.w(s,2),y=NAVIGABLE_WATER_Y+deckY(s);ray.ray.origin.set(p.x,y+.25,p.z);ray.ray.direction.set(0,-1,0);
    const hits=ray.intersectObject(root,true).filter(h=>h.face&&h.point.y<=y+.03&&h.point.y>=y-.1);assert(hits.length,'missing deck at station '+s);
    assert(Math.abs(ctx.physics.groundHeight(p.x,p.z,y+.05,false)-y)<.03,'physical deck station '+s);
    assert(Math.abs(ctx.services.finlyandskyAurora.deckY(p.x,p.z,y+.05)-y)<.03,'car deck station '+s);
  }
});
check('ship rails use knock records; surrounding water remains navigable beside the hull',()=>{
  const records=ctx.knock.list.filter(r=>r.kind==='fence');assert(records.length>20);for(const r of records)assert(r.items.length&&r.items.every(it=>ctx.physics.items.includes(it)));
  for(const s of[-45,0,45]){const p=SHIP.w(s,-22);assert.equal(L.waterLevelAt(p.x,p.z),NAVIGABLE_WATER_Y);assert(!ctx.physics.columnBlocked(p.x,p.z,.6,NAVIGABLE_WATER_Y-.4,NAVIGABLE_WATER_Y+1.4),'hull blocks port-side boat corridor');}
});
if(process.env.AREA==='sampson'){
  check('all mapped Aurora parts are owned by the ship and cannot become generic houses',()=>{
    const family=BUILDINGS.filter(b=>b.id==='r3272566'||b.parent==='r3272566');assert(family.length>40);
    for(const b of family)assert.equal(L.claimedBy(b.id),'finlyandskyAurora',b.id+' still unclaimed');
    const generic=prepare(family,b=>L.claimedBy(b.id)==='finlyandskyAurora');assert.equal(generic.list.length,0,'generic ship geometry survives its real owner');
  });
  check('Orenburgskaya2 has its continuous body and intermediate mapped storeys',()=>{
    const family=BUILDINGS.filter(b=>b.id==='r2972320'||b.parent==='r2972320'),prepared=prepare(family,()=>false).list,ids=new Set(prepared.map(b=>b.id));
    const stages=['r20187384','r3287703','r2972323','r2972322','r2972321','r2972325'];let top=0;
    for(const id of stages){const src=family.find(b=>b.id===id);assert(src&&!src.dupOf,id+' suppressed as a duplicate');assert(ids.has(id),id+' absent from generic geometry');const b=view(src);assert(b.minH<=top+.02,`${id} floats above ${top} at${b.minH}`);top=b.minH+L.heightOf(b);}
    assert(top>60);console.log('  supported tier stack reaches',top.toFixed(1),'m; footprints/heights retained');
  });
}
console.log(`Aurora/${process.env.AREA}: ${passed} checks passed`);
