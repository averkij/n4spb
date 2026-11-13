// The surveyed Aurora visible from the Finlyandsky/Sampson overlap. Reuse the
// maintained ship builder, not its unrelated school/cabin/garden builders.
import * as THREE from 'three';
import { LOD } from '../core/lod.js';
import { SHIP } from './landmarksAurora/frame.js';
import { Parts } from './landmarksAurora/kit.js';
import { makeMats } from './landmarksAurora/mats.js';
import { build as buildShip } from './landmarksAurora/ship.js';
import { buildFarShip } from './landmarksAurora/far.js';
import { adaptPortedSolids } from './lib/adapt-ported-solids.js';

export const OWNS_GROUPS=true;
export async function build(ctx){
  const first=ctx.physics.items.length,roots=new Set(ctx.staticRoot.children),t=performance.now();
  const root=new THREE.Group();root.name='finlyandskyAurora';
  const svc={monuments:[],photoSpots:[],entrances:[],crowd:[],fences:[],benches:[],triangles:0,parts:{}};
  const M=makeMats(ctx),K={ctx,M,THREE,P:new Parts(),svc,root,extraTris:0};
  await buildShip(K);
  for(const mesh of K.P.build(root,{name:'finlyandsky-aurora-ship'})){
    if(M.cutouts.has(mesh.material)||M.decals.has(mesh.material))ctx.noOutline(mesh);
    LOD.add(mesh,SHIP.x,SHIP.z,90,180);
  }
  // Source-built porthole instances are outside Parts; give them the same
  // bounded local detail range instead of letting them draw area-wide.
  root.traverse(mesh=>{if(mesh.isMesh&&!LOD.of(mesh))LOD.add(mesh,SHIP.x,SHIP.z,90,180);});
  svc.triangles=K.P.tris+K.extraTris;
  svc.parts.ship={tris:Math.round(svc.triangles),ms:Math.round(performance.now()-t)};
  // This overlap adds architecture and usable decks, without another scripted
  // tour group or a distant crowd update in the independent area.
  svc.crowd.length=0;
  ctx.addStatic(root);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.slice(first),'landmarksAurora');
  buildFarShip(ctx);
  // Keep authored deck heights available to cars as well as walkers: exact
  // ship triangles are Physics ramps, not the generic low walk-box shortcut.
  const floors=new Set(ctx.physics.items.slice(first).filter(it=>it.type==='walk'||it.type==='ramp'));
  const hit={y:-Infinity,kind:null,item:null};
  svc.deckY=(x,z,ref=Infinity)=>{
    if(Math.abs(x-SHIP.x)>110||Math.abs(z-SHIP.z)>110)return null;
    const q=ctx.physics.surfaceAt(x,z,ref,false,hit);return floors.has(q.item)?q.y:null;
  };
  svc.deckLift=()=>0;svc.buildMs=Math.round(performance.now()-t);
  ctx.services.finlyandskyAurora=svc;ctx.services.landmarksAurora=svc;
  const common=ctx.services.landmarks||={};
  common.monuments=(common.monuments||[]).concat(svc.monuments);
  common.photoSpots=(common.photoSpots||[]).concat(svc.photoSpots);
}
