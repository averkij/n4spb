// landmarksGarden/ground.js - the ground of the Summer Garden: the lawn over the whole garden relation (r2653740), the shaded floor of the bosquet woods, the terracotta gravel alleys (OSM footways: the Main
// alley is 6.2 m between the statue rows, the cross alleys 3.6 m, side paths 3 m), the gravel squares round the fountains, the Carp pond and the Menagerie pond (tea-brown water, a low green lattice rail,
// colliders) and the marble-rimmed fountain basins with their jets (Tsaritsyn, Coat of arms, Octagonal, Pyramid + the two small ones).  All of it comes from the baked OSM data inside the ring: GREEN, ROADS,
// AREAS, WATER, BARRIERS.  Dossier docs/research/summer-garden.md 2.3, 5.1, 6.5; photos refs/summer-garden 184 206 085 216.
import * as THREE from 'three';
import { GREEN, ROADS, AREAS, WATER, BARRIERS, FOUNTAINS } from '../data/city.js';
import { liveFountain } from '../lib/live-fountain.js';
import { RING, inRing, rotOf } from './frame.js';
import { GROUPS_LIST } from './groups.js';
import { ribbon, fillPoly, fillPolyFine, inflate, pairs, coverFn, wall3D } from './surfaces.js';
import { knockBays, unitBox, faceLeft } from '../lib/fence-bays.js';

const OSM = new Set(GROUPS_LIST.find((g) => g.key === 'summer-garden').osm);
export const MAIN_ALLEY = new Set(['w159079282', 'w197658096', 'w197658097', 'w159079329', 'w311015871', 'w311015894']);
const WIDE = new Set(['w197658098', 'w159079296', 'w591647539', 'w159079316', 'w159079288', 'w159079285', 'w159079284', 'w311015873', 'w159079295', 'w159079332', 'w159079343', 'w197658123']);
const POND_RAIL = new Set(['w311015862', 'w589930444']);

/** the footways of the garden as [{ id, pts, w }] (shared with the hedge / tree / statue placement) */
export function gardenPaths() {
  const out = [];
  for (const r of ROADS) {
    if (!OSM.has(r.id) || !r.pts || r.pts.length < 4) continue;
    if (r.hw !== 'footway' && r.hw !== 'steps' && r.hw !== 'path') continue;
    out.push({ id: r.id, pts: pairs(r.pts), w: MAIN_ALLEY.has(r.id) ? 6.2 : WIDE.has(r.id) ? 3.8 : 3.0, steps: r.hw === 'steps' });
  }
  return out;
}

export function build(K) {
  const { ctx, M, P, svc } = K, ph = ctx.physics, cover = coverFn(ctx);
  const clip = (x, z) => cover(x, z) > -0.3;
  // ---- the lawn over the garden relation, the shaded floor of the wood polygons
  fillPolyFine(P, M.lawn, RING, 0.02, { maxEdge: 30, tile: 6 });
  let woodN = 0;
  for (const g of GREEN) {
    if (g.kind !== 'wood' || !OSM.has(g.id)) continue;
    for (const p of g.polys) { const r = pairs(p.o); if (r.length >= 3 && inRing(r[0][0], r[0][1]) !== undefined) { try { P.cap(M.woodFloor, r, 0.026, true, 5, p.h.map(pairs)); woodN++; } catch (e) { /* degenerate polygon */ } } }
  }
  // ---- gravel alleys (ribbons at y 0.035, world-space uv: overlapping strips look the same)
  const paths = gardenPaths();
  for (const pa of paths) ribbon(P, M.gravel, pa.pts, pa.w, 0.035, { tile: 3, seg: 4, clip: (x, z) => clip(x, z) });
  // gravel squares round the fountains, the Coat-of-arms plaza and the small plazas (OSM AREAS, not the parterre / poultry-yard lawns)
  for (const a of AREAS) {
    if (!OSM.has(a.id) || a.id === 'r5282736' || a.hw === 'steps') continue;
    for (const p of a.polys) { const r = pairs(p.o); if (r.length >= 3) { try { P.cap(M.gravel, r, 0.034, true, 3, p.h.map(pairs)); } catch (e) { /* degenerate */ } } }
  }
  // ---- water: the two ponds and the fountain basins
  const basins = [], ponds = [];
  for (const w of WATER) {
    if (!OSM.has(w.id)) continue;
    for (const p of w.polys) {
      const r = pairs(p.o); if (r.length < 3) continue;
      if (w.kind === 'pond') ponds.push({ id: w.id, ring: r, holes: p.h.map(pairs), name: w.name }); else basins.push({ id: w.id, ring: r, name: w.name });
    }
  }
  for (const pd of ponds) {
    const menagerie = pd.id === 'r4162603' || pd.id === 'r4162600' || /Менажер/.test(pd.name || '');
    P.cap(menagerie ? M.pond : M.water, pd.ring, 0.05, true, 4, pd.holes);
    const bank = inflate(pd.ring, 1.2); P.cap(M.lawn, bank, 0.024, true, 6, [pd.ring]);
    ph.addWater({ ring: pd.ring.flat(), holes: pd.holes.map((h) => h.flat()), level: 0.05 });      // (water is reachable, docs/AREAS.md 13.7: a pond is a place to wade in: 5 cm of film over the lawn level, no bowl)
    svc.ponds = (svc.ponds || []).concat([{ id: pd.id, name: pd.name, x: pd.ring.reduce((s, p) => s + p[0], 0) / pd.ring.length, z: pd.ring.reduce((s, p) => s + p[1], 0) / pd.ring.length }]);
  }
  // the two fountains that OSM maps as nodes only (the Crown fountain in the parterre, the Nereid): round basins
  for (const f of FOUNTAINS) {
    if (f.polys.length || !inRing(f.x, f.z) || !OSM.has(f.id) && !['n3165417100', 'n4255789212'].includes(f.id)) continue;
    const r = f.id === 'n3165417100' ? 3.6 : 2.4, ring = Array.from({ length: 20 }, (_, i) => [f.x + Math.cos(i / 20 * Math.PI * 2) * r, f.z + Math.sin(i / 20 * Math.PI * 2) * r]);
    basins.push({ id: f.id, ring, name: f.name });
  }
  const rimBays = [], railBays = [];
  for (const b of basins) {
    const n = b.ring.length;
    let cx = 0, cz = 0; for (const p of b.ring) { cx += p[0]; cz += p[1]; } cx /= n; cz /= n;
    P.cap(M.water, b.ring, 0.42, true, 3);
    ph.addWater({ ring: b.ring.flat(), level: 0.42 });                                                                  // (water is reachable: a basin is shallow water to wade in; the rim is a breakable wall)
    for (let i = 0; i < n; i++) {                                                                                       // the marble rim: one breakable bay per ring segment (0.45 m wide, 0.55 m high, outward of the water edge)
      const a = b.ring[i], c = b.ring[(i + 1) % n], dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
      let nx = dz / l, nz = -dx / l; if ((cx - a[0]) * nx + (cz - a[1]) * nz > 0) { nx = -nx; nz = -nz; }                // outward
      rimBays.push(faceLeft(a[0], a[1], c[0], c[1], nx, nz, { y: 0 }));
    }
    let rad = 0; for (const p of b.ring) rad += Math.hypot(p[0] - cx, p[1] - cz); rad /= n;
    const big = rad > 4;
    const hJet = big ? 5.5 : 3.5;
    const nozzles = [{ height: hJet, width: 0.07, target: [0.45, 0, 0] }];
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2, x = Math.cos(a) * rad * 0.45, z = Math.sin(a) * rad * 0.45;
      nozzles.push({ x, z, height: hJet * 0.45, width: 0.035, target: [x * 1.15, 0, z * 1.15] });
    }
    liveFountain(ctx, { id: b.id, x: cx, z: cz, y: 0.42, r: rad, nozzles, far: 320 });
    P.cyl(M.marbleCoping, [cx, 0.42, cz], [cx, 0.62, cz], 0.35, 0.28, 10, true);
    (svc.fountains ||= []).push({ id: b.id, name: b.name, x: cx, z: cz, r: rad });
    svc.crowd.push({ x: cx, z: cz, r: rad + 4, n: 5, kind: 'fountain' });
  }
  // ---- the rail round the two ponds: a green lattice, 1 m high (OSM w311015862 Carp pond, w589930444 Menagerie pond): breakable bays, one per segment (lattice panel, top rail, a post at its end)
  for (const bar of BARRIERS) {
    if (!POND_RAIL.has(bar.id)) continue;
    const pts = pairs(bar.pts), n = pts.length, m = bar.closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const a = pts[i], c = pts[(i + 1) % n], l = Math.hypot(c[0] - a[0], c[1] - a[1]); if (l < 0.2) continue;
      railBays.push({ x0: a[0], z0: a[1], x1: c[0], z1: c[1], y: 0, first: !bar.closed && i === 0 });
    }
  }
  // the marble rims and the lattice rails: lib/fence-bays.js (the rim: 400 kg a bay, breaks at 10 km/h; the rail: a light lattice, 8 km/h)
  if (rimBays.length) knockBays(ctx, { name: 'lmGd-rim', bays: rimBays, far: 260,
    parts: [{ geo: unitBox(0, 0.55, 0, 0.45, { uLen: 2, uvs: 2 }), mat: M.marbleCoping, name: 'rim', far: 260, stretch: true }],
    collider: () => ({ y0: 0, y1: 0.6, thick: 0.45, off: 0.225, e0: 0.1, e1: 0.1 }),
    rec: () => ({ kind: 'fence', mass: 400, h: 0.55, r: 0.2, anchored: 10, hitK: 0.3, metal: false, minDv: 0 }) });
  if (railBays.length) {
    const lat = new THREE.PlaneGeometry(1, 0.9).translate(0.5, 0.55, 0), uv = lat.attributes.uv; for (let i = 0; i < uv.count; i++) { uv.setXY(i, uv.getX(i) * 3.3, uv.getY(i) * 1.1); }
    knockBays(ctx, { name: 'lmGd-pondrail', bays: railBays, far: 240,
      parts: [{ geo: lat, mat: M.lattice, name: 'lattice', far: 240, stretch: true, noOutline: true },
        { geo: new THREE.CylinderGeometry(0.035, 0.035, 1, 4, 1).rotateZ(Math.PI / 2).translate(0.5, 1.0, 0), mat: M.green, name: 'top', far: 240, stretch: true },
        { geo: new THREE.BoxGeometry(0.12, 1.1, 0.12).translate(0, 0.55, 0), mat: M.green, name: 'post', far: 240, ats: (bb) => (bb.first ? ['start', 'end'] : ['end']) }],
      collider: () => ({ y0: 0, y1: 1.2, thick: 0.3, e0: 0.05, e1: 0.05 }),
      rec: () => ({ kind: 'fence', mass: 50, h: 1.0, r: 0.05, anchored: 8, hitK: 0.12, metal: true, minDv: 0 }) });
  }
  svc.groundStats = { paths: paths.length, woods: woodN, basins: basins.length, ponds: ponds.length };
  void fillPoly; void THREE;
}
