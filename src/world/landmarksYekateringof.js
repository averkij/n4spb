// Yekateringof Park: the open rotunda by the pond and the Molvinskaya column.
// Positions and the pavilion footprint are from OSM; proportions and colours
// follow photographs linked in docs/research/yekateringof-park.md. No water,
// park green, path, furniture or railing is claimed or replaced here.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksD/kit.js';
import { GROUPS_LIST } from './landmarksYekateringof/groups.js';

export function build(ctx) {
  const start = performance.now();
  const selected = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksYekateringof) || GROUPS_LIST).map((g) => g.key));
  const root = new THREE.Group(); root.name = 'landmarksYekateringof';
  const P = new Parts();
  const plaster = ctx.mat.toon('#e5c997', { name: 'yekateringof-plaster', paint: 0.04 });
  const trim = ctx.mat.toon('#e9e2d0', { name: 'yekateringof-trim', paint: 0.04 });
  const base = ctx.mat.toon('#98958b', { name: 'yekateringof-base', paint: 0.03 });
  const roof = ctx.mat.toon('#777e83', { name: 'yekateringof-roof', paint: 0.03 });
  const granite = ctx.mat.toon('#84544e', { name: 'yekateringof-granite', paint: 0.04 });
  const svc = { monuments: [], photoSpots: [], drawn: [], posts: [], triangles: 0, colliders: 0 };
  if (selected.has('yekateringof-rotunda')) {
    const x = -4834.6, z = 3203.9;
    P.push(x, 0, z);
    // Low open platform; the circumferential gaps are traversable on foot.
    P.col(base, 0, 0, 0.01, 0.16, 5.45, 5.45, 32);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, px = Math.cos(a) * 4.45, pz = Math.sin(a) * 4.45;
      P.push(px, 0, pz, -a);
      P.box(plaster, -0.43, 0.43, 0.16, 7.25, -0.43, 0.43);
      P.box(trim, -0.51, 0.51, 7.13, 7.30, -0.51, 0.51);
      P.pop();
      ctx.physics.addBox(x + px, z + pz, 0.86, 0.86, -a, 0, 7.3);
      svc.posts.push({ x: x + px, z: z + pz }); svc.colliders++;
    }
    P.col(plaster, 0, 0, 7.30, 8.08, 5.24, 5.24, 32);
    P.col(trim, 0, 0, 7.25, 7.32, 5.36, 5.36, 32);
    P.col(trim, 0, 0, 8.08, 8.22, 5.55, 5.55, 32);
    // A shallow metal dome (not a complete sphere hidden inside the pavilion).
    const dome = new THREE.SphereGeometry(5.5, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    P.geo(roof, dome, 0, 8.22, 0, 0, 0, 0, 1, 0.28, 1); dome.dispose();
    P.pop();
    svc.drawn.push('w96846565');
    svc.photoSpots.push({ x: -4834.6, z: 3255, name: 'Yekateringof rotunda across the pond' });
  }
  if (selected.has('yekateringof-molvinsky-column')) {
    const x = -5215.8, z = 3531.9;
    P.push(x, 0, z);
    P.box(base, -2.2, 2.2, 0.01, 0.14, -2.2, 2.2);
    P.box(granite, -1.26, 1.26, 0.14, 0.45, -1.26, 1.26);
    P.box(granite, -0.93, 0.93, 0.45, 1.35, -0.93, 0.93);
    P.col(granite, 0, 0, 1.35, 1.58, 0.91, 0.91, 24);
    P.col(granite, 0, 0, 1.58, 5.70, 0.64, 0.56, 24);
    P.col(granite, 0, 0, 5.70, 5.95, 0.64, 0.64, 24);
    P.pop();
    ctx.physics.addBox(x, z, 1.86, 1.86, 0, 0, 5.95); svc.colliders++;
    svc.drawn.push('n1347500198');
    svc.monuments.push({ x, z, name: 'Молвинская колонна', nameEn: 'Molvinskaya Column' });
    svc.photoSpots.push({ x: x + 10, z: z + 12, name: 'Molvinskaya Column' });
  }
  P.build(root, { name: 'yekateringof-architecture' });
  ctx.addStatic(root);
  const landmarkService = (ctx.services.landmarks ||= {});
  (landmarkService.monuments ||= []).push(...svc.monuments);
  (landmarkService.photoSpots ||= []).push(...svc.photoSpots);
  svc.triangles = P.tris;
  svc.buildMs = Math.round(performance.now() - start);
  ctx.services.landmarksYekateringof = svc;
}
