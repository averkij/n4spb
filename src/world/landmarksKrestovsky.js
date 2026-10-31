import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// First Krestovsky sights: stadium, park axis and Krestovsky Ostrov pavilion.
// OSM footprints + operator/contractor photos: docs/research/krestovsky-2026.md.
// Immutable statics only; generic environment retains trees, ponds and paths.
export const OWNS_GROUPS = true;
import * as THREE from 'three';
import { SightKit } from './landmarksKrestovsky/kit.js';
import { mats } from './landmarksKrestovsky/mats.js';
import { stadium } from './landmarksKrestovsky/stadium.js';
import { pavilion } from './landmarksKrestovsky/pavilion.js';
import { park } from './landmarksKrestovsky/park.js';

async function buildSource(ctx) {
  const start=performance.now(),root=new THREE.Group();root.name='landmarksKrestovsky';
  const P=new SightKit(ctx,root),M=mats(ctx),svc={monuments:[],photoSpots:[],entrances:[],benches:[],lamps:[],updates:0};
  stadium(ctx,P,M,svc);pavilion(ctx,P,M,svc);park(ctx,P,M,svc);
  const out=P.finish();
  ctx.addStatic(root);
  const landmarks=ctx.services.landmarks ||= {};
  landmarks.monuments=(landmarks.monuments||[]).concat(svc.monuments);
  landmarks.photoSpots=(landmarks.photoSpots||[]).concat(svc.photoSpots);
  ctx.services.landmarksKrestovsky={...svc,triangles:out.tris,buildMs:Math.round(performance.now()-start)};
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksKrestovsky");
}
