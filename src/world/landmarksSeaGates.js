// Surveyed Kanonersky floating docks, the harbour crane skyline, and loose
// container stacks. Water, coastline, roads, bridges and generic buildings stay
// with their existing owners. There are no per-frame callbacks in this module.
export const OWNS_GROUPS = true;
import { GROUPS_LIST } from './landmarksSeaGates/groups.js';
import { buildDocks } from './landmarksSeaGates/docks.js';
import { buildCranes } from './landmarksSeaGates/cranes.js';
import { buildYard } from './landmarksSeaGates/yard.js';

export function build(ctx) {
  const start = performance.now();
  const selected = new Set((ctx.L.GROUPS?.landmarksSeaGates || GROUPS_LIST).map(g => g.key));
  const mat = ctx.mat.toon('#ffffff', { vertexColors: true, paint: .035 });
  const svc = { docks: [], cranes: 0, containerStacks: 0, containers: 0, knockRecords: 0, triangles: 0, photoSpots: [] };
  if (selected.has('sea-gates-docks')) buildDocks(ctx, mat, svc);
  if (selected.has('sea-gates-cranes')) buildCranes(ctx, mat, svc);
  if (selected.has('sea-gates-cargo')) buildYard(ctx, mat, svc);
  const landmarks = (ctx.services.landmarks ||= {});
  (landmarks.photoSpots ||= []).push(...svc.photoSpots);
  svc.buildMs = Math.round(performance.now() - start);
  ctx.services.landmarksSeaGates = svc;
}
