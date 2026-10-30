// Moscow Triumphal Gate, adapted from 102_3d_piter's landmarksMoskovsky.
// Other source landmarks lie outside the current southern areas.
import * as THREE from 'three';
import * as L from './layout.js';
import { makeKit } from './landmarksMoskovsky/common.js';
import { gate } from './landmarksMoskovsky/gate.js';

export const OWNS_GROUPS = ['moskovsky-gate'];

export function build(ctx) {
  const rec = L.groupMembers('moskovsky-gate').find((b) => b.id === 'w50224296');
  if (!rec) return;
  const root = new THREE.Group();
  root.name = 'landmarksMoskovsky';
  const svc = { monuments: [], photoSpots: [], triangles: 0 };
  const K = makeKit(ctx, root, svc);
  gate(K, rec);
  K.flush();
  ctx.addStatic(root);
  const landmarks = ctx.services.landmarks ||= {};
  for (const key of ['monuments', 'photoSpots']) (landmarks[key] ||= []).push(...svc[key]);
  ctx.services.landmarksMoskovsky = svc;
}
