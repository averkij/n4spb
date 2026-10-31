import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// Completes three missing authored Petrogradsky industrial/market sights.
// OSM footprints and photo observations: docs/research/petro-completion-2026.md.
// Static material batches only; no animation, city-wide updates, props or paving.
import { THREE,Parts,materials } from './landmarksPetroCompletion/kit.js';
import { build as power } from './landmarksPetroCompletion/power.js';
import { build as market } from './landmarksPetroCompletion/market.js';
import { build as printworks } from './landmarksPetroCompletion/printworks.js';
import { registerLOD } from '../core/spatial.js';
export const OWNS_GROUPS = ['petro-red-banner','petro-sytny','petro-printworks'];
async function buildSource(ctx){
  const start=performance.now(),root=new THREE.Group();root.name='landmarksPetroCompletion';
  const M=materials(ctx),svc={monuments:[],photoSpots:[],entrances:[],houses:[],parts:{},triangles:0};
  for(const [name,fn] of [['power',power],['market',market],['printworks',printworks]]){
    const P=new Parts(),t=performance.now();fn({ctx,P,M,svc,root});const meshes=P.build(root,{name:'petro-completion-'+name});
    root.updateMatrixWorld(true);for(const mesh of meshes)registerLOD(mesh,900);
    svc.triangles+=P.tris;svc.parts[name]={...svc.parts[name],triangles:P.tris,meshes:meshes.length,ms:Math.round(performance.now()-t)};
  }
  ctx.addStatic(root);ctx.services.landmarksPetroCompletion={...svc,buildMs:Math.round(performance.now()-start)};
  const shared=ctx.services.landmarks ||= {};for(const key of ['monuments','photoSpots'])(shared[key] ||= []).push(...svc[key]);
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksPetroCompletion");
}
