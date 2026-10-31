// Округ №65: Park 300's three-century granite lighthouse and fountain, and
// Piterland's 90 m silver ribbed dome with its glazed four-storey shopping wings.
// Photographic dossier: docs/research/okrug65-landmarks.md. The current OSM rings
// determine the plan; heights follow mapped building parts and the architect.
// Static geometry uses material/range buckets. Fixtures use the shared knock
// instances, including the lighthouse. No frame callbacks, flags or logos.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksOkrug65/kit.js';
import { buildPiterland } from './landmarksOkrug65/piterland.js';
import { buildMayak } from './landmarksOkrug65/mayak.js';
import { GROUPS_LIST } from './landmarksOkrug65/groups.js';
import { drawBeach } from './landmarksOkrug65/park-context.js';

export function build(ctx) {
  const t0 = performance.now(), root = new THREE.Group(); root.name = 'landmarksOkrug65';
  const P = new Parts();
  const M = {
    granite: ctx.mat.toon('#80766e'), darkGranite: ctx.mat.toon('#514b46'),
    coping: ctx.mat.toon('#bdb8a7'), stone: ctx.mat.toon('#d1cebf'),
    wall: ctx.mat.toon('#c3c3bb'), panel: ctx.mat.toon('#b1b2a9'),
    roof: ctx.mat.toon('#8e9696'), steel: ctx.mat.toon('#738b90'),
    dark: ctx.mat.toon('#233a44'), glass: ctx.mat.toon('#3e6579'),
    glassLight: ctx.mat.toon('#6d8a99'), glassBlue: ctx.mat.toon('#537b8e'),
    silver: ctx.mat.toon('#c5c9ca'), silverShade: ctx.mat.toon('#b8bdc1'),
    silverSeam: ctx.mat.toon('#d9dcda'), timber: ctx.mat.toon('#ad8d67'),
    water: ctx.mat.toon('#4b8c9c', { transparent: true, opacity: 0.83, depthWrite: false, side: 'double' }),
    jets: ctx.mat.toon('#cfedf0', { transparent: true, opacity: 0.58, depthWrite: false }),
  };
  const service = { monuments: [], photoSpots: [], triangles: 0, parts: {}, benches: [] };
  const claimed = new Set((ctx.L?.GROUPS?.landmarksOkrug65 || GROUPS_LIST).map(g => g.key));
  if (claimed.has('okrug65-piterland')) buildPiterland({ ctx, P, M, service });
  if (claimed.has('okrug65-mayak')) buildMayak({ ctx, P, M, service });
  const beachTriangles = drawBeach(ctx);
  service.triangles += beachTriangles; service.parts.beach = { triangles: beachTriangles };
  for (const { mesh, mat } of P.build(root, { name: 'okrug65' })) {
    if (mat === M.water || mat === M.jets) { ctx.noOutline(mesh); mesh.castShadow = false; }
  }
  service.triangles += P.tris; ctx.addStatic(root);
  const all = (ctx.services.landmarks ||= {});
  all.monuments = (all.monuments || []).concat(service.monuments);
  all.photoSpots = (all.photoSpots || []).concat(service.photoSpots);
  ctx.services.landmarksOkrug65 = { ...service, buildMs: Math.round(performance.now() - t0) };
}
