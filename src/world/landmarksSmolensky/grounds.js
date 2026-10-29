// landmarksSmolensky/grounds.js - the GROUNDS of the cemetery (claim of the GREEN polygon r2736670 = the generic modules plant nothing here): the dark forest floor, the OLD FOREST (~7 000 instanced trees with four
// crown levels, forest.js), the shrubs along the alleys and the GRAVES (gravefield.js: the detailed field of the 2026-10-09 detail pass; plan place2.js), planned by place.js from the baked alleys and buildings.  The asphalt apron in front of the Smolensk church (the OSM data has
// no way there) is laid here.  Publishes svc.paths (the alleys: id, name, pts, width, surface: for the people nav), svc.trees (count, species) and svc.graves (count).
import * as THREE from 'three';
import * as L from '../layout.js';
import { CH } from './frame.js';
import { plan } from './place.js';
import { plantForest, LEAF } from './forest.js';
import { makeAtlas } from './atlas.js';
import { planPlots } from './place2.js';
import { plantGraveField } from './gravefield.js';
import { SPECIES } from './treegeo.js';
import { fillPolyFine, ribbon } from './surfaces.js';
import { inRing } from './place.js';
import { makeFloorTextures, makeMask, makeFloorMaterial } from './floor.js';

export async function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M;
  const pl = await plan(ctx);
  if (!pl) { console.warn('[landmarksSmolensky] grounds: the cemetery polygon r2736670 is missing'); return; }
  // ---- the asphalt apron in front of the Smolensk church (CH X -1 .. 47, Z -26 .. -1.0; the portico podium and the steps stand on it)
  // review 2026-10-09: the south edge reaches 1.5 m into the Petrogradskaya alley ribbon (v -27.5, same asphalt): at v -26 a 0.3 m wedge of the lawn floor showed between the ribbon and the apron (a green stripe on the asphalt)
  const apron = [[-1, -27.5], [47, -27.5], [47, -1.0], [-1, -1.0]].map(([u, v]) => { const q = CH.W(u, v); return [q.x, q.z]; });
  fillPolyFine(P, M.asphalt, apron, 0.05, { maxEdge: 6, tile: 3 });
  // ---- the forest floor: a dark leaf-litter decal over the whole polygon, pulled back 7 m from the river edges (the water owner's natural slope runs there, the ground is not flat)
  const rx = pl.ring.map((q) => q[0]), rz = pl.ring.map((q) => q[1]);
  const mask = makeMask(pl, [Math.floor(Math.min(...rx) / 3) * 3 - 6, Math.floor(Math.min(...rz) / 3) * 3 - 6, Math.ceil(Math.max(...rx) / 3) * 3 + 6, Math.ceil(Math.max(...rz) / 3) * 3 + 6]);
  M.floorSplat = makeFloorMaterial(ctx, mask, makeFloorTextures(ctx));
  P.push(0, 0, 0, 0);
  fillPolyFine(P, M.floorSplat, insetRiver(pl.ring, 7), 0.022, { maxEdge: 22, tile: 6 });
  P.pop();
  // ---- the ALLEYS: streets draws no way that groups.js claims (smolensky-grounds osm: the 66 alley ids of place.js; 2026-10-29: before the claim streets laid a second ribbon of its own at y 0.042 over these at 0.025 .. 0.033, two systems on one alley = z-fighting and a ground that changed with the distance), the module lays its own ribbons: asphalt 3.2 m (tagged asphalt), brick pavers 2.4 m, untagged footways
  // asphalt 2.4 m (photos 72 / 139: the alleys of the cemetery are asphalt, the older ones herringbone pavers), gravel paths 1.6 m, unpaved paths 1.0 m; one height per class (no coplanar overlap between classes)
  const CLS = { asphalt: [M.asphalt, 3.2, 0.033, 3], narrow: [M.asphalt, 2.4, 0.031, 3], paving: [M.pavers, 2.4, 0.029, 2], gravel: [M.gravel, 1.6, 0.027, 3], earth: [M.gravel, 1.0, 0.025, 3] };
  const classOf = (p) => (p.surface === 'asphalt' ? 'asphalt' : /paving|sett|plates|concrete/.test(p.surface) ? 'paving' : /gravel|compacted|ground/.test(p.surface) ? 'gravel' : p.surface === 'unpaved' ? 'earth' : p.hwClass === 'path' ? 'gravel' : 'narrow');
  const keepIn = (x, z) => inRing(pl.ring, x, z);
  let ribbons = 0;
  for (const p of pl.paths) { const c = CLS[classOf(p)]; ribbons += ribbon(P, c[0], p.pts, p.surface === 'asphalt' && p.w > 3.2 ? p.w : c[1], c[2], { tile: c[3], seg: 2.5, keep: keepIn }); }
  // ---- the forest + shrubs
  const col = new THREE.Color(), list = [];
  const all = pl.trees.concat(pl.shrubs);
  all.forEach((t, i) => {
    const F = SPECIES[t.fam]; if (!F) return;
    col.set((LEAF[t.fam] || LEAF.limeA)[i % 3]).multiplyScalar(t.br);
    t.rgb = [col.r, col.g, col.b]; t.tr = Math.max(0.22, F.trunk * t.s * 0.7); list.push(t);
  });
  const forest = plantForest(K, list);
  // ---- the graves
  const atlas = makeAtlas(ctx), pp = planPlots(ctx, pl), graves = plantGraveField(K, pp.plots, atlas);
  K.svc.plotStats = pp.stats; K.svc.plots = pp.plots; K.svc.graveField = graves.stats; K.svc.atlas = { cells: Object.keys(atlas.cells).length, size: atlas.size };
  // ---- services
  K.svc.paths.push(...pl.paths.map((p) => ({ id: p.id, name: p.name, pts: p.pts, w: p.w, surface: p.surface })));
  K.svc.trees.push(...pl.trees.map((t) => { const F = SPECIES[t.fam]; return { x: t.x, z: t.z, r: F.R * t.s, h: F.H * t.sy, tr: t.tr }; }));          // the trunks (same record shape as environment.trees)
  K.svc.treeStats ={ trees: pl.trees.length, shrubs: pl.shrubs.length, colliders: forest.colliders, graves: pp.plots.length, graveColliders: graves.colliders };
  void L;
}

/** the polygon with the river-side vertices (13 .. 28) moved d metres inwards */
function insetRiver(ring, d) {
  const n = ring.length, inside = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
  return ring.map((p, i) => {
    if (i < 13 || i > 28) return p;
    const a = ring[(i + n - 1) % n], b = ring[(i + 1) % n];
    const t1 = [p[0] - a[0], p[1] - a[1]], t2 = [b[0] - p[0], b[1] - p[1]], l1 = Math.hypot(...t1) || 1, l2 = Math.hypot(...t2) || 1;
    let nx = -(t1[1] / l1 + t2[1] / l2), nz = t1[0] / l1 + t2[0] / l2; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    if (!inside(ring, p[0] + nx * 1.0, p[1] + nz * 1.0)) { nx = -nx; nz = -nz; }
    return [p[0] + nx * d, p[1] + nz * d];
  });
}
