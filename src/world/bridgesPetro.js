import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// Northern bridge extension using the current n4spb decks, knockable rails,
// submerged pier collision and bounded services. Only claimed crossings build.
import * as THREE from 'three';
import { Parts } from './bridges/kit.js';
import { makeMats } from './bridges/mats-petro.js';
import { addVoMats } from './bridges/mats-vo.js';
import { makeRailBatch } from './bridges/rails.js';
import { buildYelagin } from './bridges/yelagin.js';
import { SPECS, buildYelaginMain } from './bridges/yelaginMain.js';
import { buildYelaginPonds } from './bridges/yelaginPonds.js';
import { KA_BRIDGES } from './bridges/krestAptek.js';
import { KA2_BRIDGES } from './bridges/krestAptek2.js';
import { buildKamenny } from './bridges/kamenny.js';
import { buildBolshoy } from './bridges/petrovsky/bolshoy.js';
import { buildMappedPark } from './bridges/petro-mapped.js';
import { buildWhsdApproaches } from './bridges/petro-whsd-approach.js';
import { bridgeZones } from './environment/river.js';
import { solidPiers } from './bridges/piers.js';
import { BRIDGE_GROUP_KEYS } from './lib/area-tables.js';
async function buildSource(ctx) {
  const M=makeMats(ctx);addVoMats(ctx,M);
  const root=new THREE.Group();root.name='bridgesPetro';
  const rails=makeRailBatch(ctx),list=[],stats={tris:0,colliders:0},zones=bridgeZones();
  const waterY=()=>-3.4;
  const flush=(P,id)=>{stats.tris+=P.tris;const meshes=P.build(root,{name:'brg-'+id,waterY:-3.4,sub:m=>ctx.noOutline(m)});P.b.clear();solidPiers(ctx,meshes);return meshes;};
  const env=()=>({ctx,M,rails,Parts,flush,zones,waterY:-3.4});
  const add=(id,name,fn)=>{
    if(!BRIDGE_GROUP_KEYS.has(id))return;
    const P=new Parts(),B=fn({...env(),P});B.colliders();flush(P,id);
    stats.colliders+=B.info?.colliders||0;
    list.push({id,name,nameEn:name,x:B.x,z:B.z,at:B.at,B});
  };
  add('bolshoy-petrovsky','Большой Петровский мост',buildBolshoy);
  add('yelagin2','2-й Елагин мост',buildYelagin);
  for(const sp of SPECS)add(sp.id,sp.name,e=>buildYelaginMain(e,sp));
  for(const sp of [...KA_BRIDGES,...KA2_BRIDGES])add(sp.id,sp.name,sp.build);
  if(BRIDGE_GROUP_KEYS.has('yelagin-ponds')) {
    const out=buildYelaginPonds({ctx,M,flush});list.push(...out.list);stats.colliders+=out.colliders;
  }
  if(BRIDGE_GROUP_KEYS.has('kamennoostrovsky')||BRIDGE_GROUP_KEYS.has('ushakovsky')) {
    for(const it of buildKamenny({...env(),waterY})) {
      it.B.colliders();flush(it.P,it.id);list.push({...it,x:it.B.x,z:it.B.z});
    }
  }
  const parkP=new Parts(),park=buildMappedPark({ctx,P:parkP,M});if(park){flush(parkP,'parkovy2');list.push(park);}
  if(BRIDGE_GROUP_KEYS.has('ushakovsky')){
    // The small outer nose is a separate stone face, below the deck. Its
    // two triangles are too sparse for the generic pier cluster fitter.
    const nose=ctx.physics.addCylinder(-2856.8,-5481.8,.55,-3.8,-1.8);nose.pier=true;
  }
  if(BRIDGE_GROUP_KEYS.has('whsd-petrovsky'))list.push(...buildWhsdApproaches(env()));
  rails.flush(root);ctx.addStatic(root);
  const old=ctx.services.bridges,decks=list.filter(it=>it.B.deckAt);
  const deckY=(x,z)=>{for(const {B} of decks){const b=B.bounds;if(b&&(x<b[0]||z<b[1]||x>b[2]||z>b[3]))continue;const y=B.deckAt(x,z);if(y!=null)return y;}return old?.deckY(x,z)??null;};
  const pub=list.flatMap(it=>[{id:it.id,name:it.name,x:it.x,z:it.z,crossing:it.B.crossing},...(it.B.anchors||[]).map(a=>({id:it.id,name:it.name,x:a.x,z:a.z,part:true}))]);
  ctx.services.bridges={...old,deckY,list:[...(old?.list||[]),...pub],masts:[...(old?.masts||[]),...list.flatMap(it=>it.B.masts||[])],spans:[...(old?.spans||[]),...list.flatMap(it=>it.B.span?[it.B.span]:[])]};
  ctx.services.bridgesPetro={list,stats};
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"bridgesPetro");
}
