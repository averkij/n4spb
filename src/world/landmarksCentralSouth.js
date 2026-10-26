// Central south: Stasov's blue-domed Trinity cathedral and the Art Nouveau Vitebsky terminal.
// Real footprints, conservative authored detail ranges; docs/research/central-south.md.
// Provenance: copied verbatim from 102_3d_piter commit 0568f7af (src/world/landmarksCentralSouth.js and landmarksCentralSouth/*); this line is the only change.
import * as THREE from 'three';
import * as L from './layout.js';
import { makeKit } from './landmarksD/common.js';
import { buildTrinity } from './landmarksCentralSouth/trinity.js';
import { buildVitebsky } from './landmarksCentralSouth/vitebsky.js';
import { buildInstitute } from './landmarksCentralSouth/institute.js';
import { buildBridgeDetails } from './landmarksCentralSouth/bridge-details.js';
export const OWNS_GROUPS = ['central-trinity','central-vitebsky','central-institute'];

export function build(ctx) {
  const K=makeKit(ctx), root=new THREE.Group(); root.name='landmarksCentralSouth';
  K.svc={houses:[],entrances:[],monuments:[],photoSpots:[]};
  buildTrinity(K,root); buildVitebsky(K,root); buildInstitute(K,root); buildBridgeDetails(K,root);
  ctx.addStatic(root);
  ctx.services.landmarksCentralSouth={...K.svc,triangles:K.tris};
  const svc=ctx.services.landmarks ||= {};
  for(const key of ['monuments','photoSpots']) (svc[key] ||= []).push(...K.svc[key]);
}
