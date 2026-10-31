// Park 300's designed lawns, granite promenade and three hydraulic islands.
// Bounded immutable geometry only; the shared knock helper owns access rails.
import * as THREE from 'three';
import { Parts } from './kit.js';
import { ISLANDS, PROMENADES } from './waterfront-data.js';
import { PARK } from './park-data.js';
import { SITES } from './sites.js';
import { ISLAND_RINGS, PROMENADE_WIDTH, PROMENADE_RINGS, MAINLAND_PAVING_RING, SEA_BANK_APRON_RING, ringPairs } from './waterfront-plan.js';
import { WATERFRONT_MAINLAND_BANK, WATERFRONT_OWNER_WATER_RINGS } from './waterfront-channels.js';
import { registerLOD } from '../../core/spatial.js';
import { knockBays, splitBays, unitBox } from '../lib/fence-bays.js';
import { BEACH_SLOPES } from './beach-plan.js';
import { subtractConvex, ccw, boxOfPoly } from '../environment/clip.js';
import { addFloatBlock } from '../lib/craft-solids.js';

/** Tessellated flat surface with a mild colour variation. The exact mapped
 * boundary is retained, with no yard-asphalt / setts noise on lawn or sand. */
export function flatSurface(ctx, polys, { name, color, y = 0.012, maxEdge = 12, roadMargin = -0.3, cuts = [] }) {
  const pos = [], col = [], uv = [], ix = [], nrm = [];
  const cover = (x, z) => (ctx._roadPlan?.cover(x, z, {}) ?? -Infinity) >= roadMargin;
  const vert = p => { const n = pos.length / 3, shade = 0.97 + Math.sin(p.x * 0.021) * Math.sin(p.y * 0.019) * 0.025;
    pos.push(p.x, y, p.y); col.push(shade, shade, shade); uv.push(p.x / 16, p.y / 16); nrm.push(0, 1, 0); return n; };
  const emit = (a, b, c, depth = 0) => {
    const lengths = [a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)], max = Math.max(...lengths);
    const split = () => {
      const edge = lengths.indexOf(max);
      if (!edge) { const m = a.clone().add(b).multiplyScalar(0.5); emit(a, m, c, depth + 1); emit(m, b, c, depth + 1); }
      else if (edge === 1) { const m = b.clone().add(c).multiplyScalar(0.5); emit(a, b, m, depth + 1); emit(a, m, c, depth + 1); }
      else { const m = c.clone().add(a).multiplyScalar(0.5); emit(a, b, m, depth + 1); emit(m, b, c, depth + 1); }
    };
    if (max > maxEdge && depth < 18) { split(); return; }
    // Curved service-road footprints can enter the middle of a triangle edge
    // while its vertices and centroid stay clear. Refine those boundary cells
    // to one metre before dropping the actual asphalt overlap.
    const corners = [cover(a.x, a.y), cover(b.x, b.y), cover(c.x, c.y)];
    if (corners.every(Boolean)) return;
    let road = corners.some(Boolean) || cover((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3);
    for (const [p, q] of [[a, b], [b, c], [c, a]]) {
      const steps = Math.max(1, Math.ceil(p.distanceTo(q) / 2));
      for (let i = 0; i < steps && !road; i++) road = cover(p.x + (q.x - p.x) * i / steps, p.y + (q.y - p.y) * i / steps);
    }
    if (road) { if (max > 1 && depth < 18) split(); return; }
    const A = vert(a), B = vert(b), C = vert(c), area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (area < 0) ix.push(A, B, C); else ix.push(A, C, B);
  };
  for (const p of polys) {
    const outer = ringPairs(p.o).map(a => new THREE.Vector2(...a)), holes = (p.h || []).map(h => ringPairs(h).map(a => new THREE.Vector2(...a)));
    const all = outer.concat(...holes);
    for (const t of THREE.ShapeUtils.triangulateShape(outer, holes)) {
      const tri = t.map(i => [all[i].x, all[i].y]), box = boxOfPoly(tri);
      let pieces = [tri];
      for (const cut of cuts) {
        const cb = boxOfPoly(cut);
        if (cb[0] > box[1] || cb[1] < box[0] || cb[2] > box[3] || cb[3] < box[2]) continue;
        pieces = subtractConvex(pieces, ccw(cut));
      }
      for (const piece of pieces) for (let i = 1; i + 1 < piece.length; i++) emit(...[piece[0], piece[i], piece[i + 1]].map(p => new THREE.Vector2(...p)));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(ix);
  geo.computeBoundingBox(); geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, ctx.mat.toon(color, { vertexColors: true, paint: 0.02, polygonOffset: -0.5 }));
  mesh.name = name; mesh.receiveShadow = true; mesh.castShadow = false;
  ctx.noOutline(mesh); registerLOD(mesh, 3000); ctx.addStatic(mesh);
  return ix.length / 3;
}

// Convex OSM hydraulic-island rings: narrow horizontal strips stay strictly
// inside their rendered boundary. At most 0.22 m edge inset, no circular AABB
// sticking out into the sea, and only about 110 floor records per island.
function walkRing(physics, ring, top) {
  const zs = ring.map(p => p[1]), lo = Math.min(...zs), hi = Math.max(...zs), step = 0.45;
  const span = z => {
    const hits = [];
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j]; if ((a[1] > z) !== (b[1] > z)) hits.push(a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]));
    }
    return hits.length >= 2 ? [Math.min(...hits), Math.max(...hits)] : null;
  };
  for (let z = lo + 0.005; z < hi - 0.005; z += step) {
    const z1 = Math.min(hi - 0.005, z + step), a = span(z), b = span(z1); if (!a || !b) continue;
    const x0 = Math.max(a[0], b[0]) + 0.002, x1 = Math.min(a[1], b[1]) - 0.002;
    if (x1 > x0) physics.addWalkBox((x0 + x1) / 2, (z + z1) / 2, x1 - x0, z1 - z, 0, top, -3.6);
  }
}
function spanLength(a) { let d = 0; for (let i = 2; i < a.length; i += 2) d += Math.hypot(a[i] - a[i - 2], a[i + 1] - a[i - 1]); return d; }
function accessPoints(ctx, pts, width = 3) {
  const out = pts.slice(), dx = pts[2] - pts[0], dz = pts[3] - pts[1], len = Math.hypot(dx, dz), nx = -dz / len, nz = dx / len;
  if (!ctx._roadPlan) return out;
  // OSM footways meet the service-road centreline. Start the paving / raised
  // deck beyond the complete asphalt width, leaving the roadway clear.
  const offsets = Array.from({ length: Math.ceil(width) + 1 }, (_, i) => -width / 2 + width * i / Math.ceil(width));
  for (let d = 0; d < Math.min(12, len - 1); d += 0.2) {
    const x = pts[0] + dx / len * d, z = pts[1] + dz / len * d;
    if (offsets.every(v => ctx._roadPlan.cover(x + nx * v, z + nz * v, {}) < -0.4)) { out[0] = x; out[1] = z; break; }
  }
  return out;
}
function pathFrames(pts, width) {
  const p = ringPairs(pts), out = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1;
    out.push({ x: p[i][0], z: p[i][1], nx: -dz / len, nz: dx / len, half: width / 2 });
  }
  return out;
}
function drawRibbon(P, mat, frames, height) {
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1], b = frames[i], ya = height(i - 1), yb = height(i);
    P.quad(mat, [a.x - a.nx * a.half, ya, a.z - a.nz * a.half], [a.x + a.nx * a.half, ya, a.z + a.nz * a.half],
      [b.x + b.nx * b.half, yb, b.z + b.nz * b.half], [b.x - b.nx * b.half, yb, b.z - b.nz * b.half], [0, 1, 0]);
  }
}

function deckService(triangles) {
  const grid = new Map(), cell = 32;
  for (const pts of triangles) {
    const [a, b, c] = pts, den = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
    if (Math.abs(den) < 1e-8) continue;
    const xs = pts.map(p => p[0]), zs = pts.map(p => p[2]), box = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)], tri = { pts, den, box };
    for (let x = Math.floor(box[0] / cell); x <= Math.floor(box[1] / cell); x++) for (let z = Math.floor(box[2] / cell); z <= Math.floor(box[3] / cell); z++) {
      const key = x + ',' + z, bucket = grid.get(key); if (bucket) bucket.push(tri); else grid.set(key, [tri]);
    }
  }
  return (x, z, ref = Infinity) => {
    let top = null;
    for (const t of grid.get(Math.floor(x / cell) + ',' + Math.floor(z / cell)) || []) {
      const q = t.box; if (x < q[0] - 1e-6 || x > q[1] + 1e-6 || z < q[2] - 1e-6 || z > q[3] + 1e-6) continue;
      const [a, b, c] = t.pts, u = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / t.den;
      const v = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / t.den, w = 1 - u - v;
      if (Math.min(u, v, w) < -1e-6) continue;
      const y = u * a[1] + v * b[1] + w * c[1];
      if (y <= ref + 1.2) top = top == null ? y : Math.max(top, y);
    }
    return top;
  };
}

export function buildWaterfront(ctx) {
  const P = new Parts(), root = new THREE.Group(); root.name = 'okrug65-waterfront';
  const M = { paving: ctx.mat.toon('#aaa89d', { paint: 0.025 }), edge: ctx.mat.toon('#c7c6bb'),
    stone: ctx.mat.toon('#85847b'), dark: ctx.mat.toon('#404d50'), glass: ctx.mat.toon('#4e7685'),
    frame: ctx.mat.toon('#9dadaf'), roof: ctx.mat.toon('#a5b5b7') };
  // The whole mapped park is a maintained lawn, interrupted by its already
  // mapped paths and raised play/sports surfaces. The old yard mask remains
  // outside this ring. Fountain water and its dry island are owned by Mayak.
  const basin = SITES.find(s => s.id === 'r5255799').polys;
  let triangles = flatSurface(ctx, PARK.polys.map(p => ({ o: p.o, h: [...p.h, ...basin.map(b => b.o)] })),
    { name: 'okrug65-park300-maintained-lawns', color: '#6e944a' });
  triangles += flatSurface(ctx, [{ o: MAINLAND_PAVING_RING.flat(), h: [] }], {
    name: 'okrug65-western-mainland-promenade', color: '#aaa89d', y: 0.075,
    cuts: [...PROMENADE_RINGS, ...WATERFRONT_OWNER_WATER_RINGS.map(w => w.ring)],
  });
  triangles += flatSurface(ctx, [{ o: SEA_BANK_APRON_RING.flat(), h: [] }], {
    name: 'okrug65-curved-sea-bank-apron', color: '#aaa89d', y: 0.075,
    cuts: WATERFRONT_OWNER_WATER_RINGS.map(w => w.ring),
  });
  const rails = [], paths = [], islands = [], deckTriangles = [];
  const sand = ctx.mat.toon('#c4b38f', { paint: 0.02 });
  // The old unfinished apron had a city-centre pink granite quay. The new
  // local harbour shore has a low neutral stone face and an open edge, with
  // no barrier collider. Exact adjacent sand ramps provide walking access.
  P.ranged(2200, () => {
    for (let i = 1; i < WATERFRONT_MAINLAND_BANK.length; i++) {
      const a = WATERFRONT_MAINLAND_BANK[i - 1], b = WATERFRONT_MAINLAND_BANK[i], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
      P.quad(M.stone, [a[0], -3.6, a[1]], [b[0], -3.6, b[1]], [b[0], 0.075, b[1]], [a[0], 0.075, a[1]], [-dz / len, 0, dx / len]);
      // The visible bank toe is solid to a floating hull, like the shared
      // quay's float blocks. Its top stays below walkers on the promenade;
      // there is no fence / parapet and no wall across open water.
      addFloatBlock(ctx.physics, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, len + 0.05, 0.3, Math.atan2(-dz, dx), -3.4);
    }
  });
  P.ranged(3000, () => {
    for (const s of BEACH_SLOPES) for (const ids of [[0, 1, 2], [0, 2, 3]]) {
      const pts = ids.map(i => s.pts[i]), [a, b, c] = pts;
      const n = new THREE.Vector3().subVectors(new THREE.Vector3(...b), new THREE.Vector3(...a)).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...c), new THREE.Vector3(...a))).normalize();
      if (n.y < 0) n.negate();
      P.fan(sand, pts, n.toArray());
      // Boat collision uses solids, while pedestrians / cars also read the
      // terrain patch. Register the exact drawn triangle, never its broad OBB,
      // so a hull cannot sail through exposed sand beside an opened channel.
      ctx.physics.addWalkTriangle(pts, 1);
    }
  });
  for (const r of PROMENADES) {
    const frames = pathFrames(accessPoints(ctx, r.pts, PROMENADE_WIDTH), PROMENADE_WIDTH);
    P.ranged(2800, () => drawRibbon(P, M.paving, frames, () => 0.075));
    // Readable pale granite edge bands, flush enough to step across. No solid
    // kerb or rail is invented along the beach.
    for (const side of [-1, 1]) {
      const band = frames.map(f => ({ ...f, x: f.x + f.nx * (PROMENADE_WIDTH / 2 - 0.14) * side, z: f.z + f.nz * (PROMENADE_WIDTH / 2 - 0.14) * side, half: 0.14 }));
      P.ranged(850, () => drawRibbon(P, M.edge, band, () => 0.099));
    }
  }
  for (let si = 0; si < ISLANDS.length; si++) {
    const s = ISLANDS[si], ring = ISLAND_RINGS[si], top = s.y, hall = ringPairs(s.building.polys[0].o), hallTop = top + 6.5;
    P.ranged(2800, () => { P.cap(M.stone, ring, top); P.cap(M.roof, hall, hallTop); });
    for (let i = 0; i < ring.length; i++) deckTriangles.push([[s.x, top, s.z], [ring[i][0], top, ring[i][1]], [ring[(i + 1) % ring.length][0], top, ring[(i + 1) % ring.length][1]]]);
    walkRing(ctx.physics, ring, top);
    // Vertical hydraulic face follows the surveyed 50 m ring. It is terrain,
    // not a fence or an invisible wall across a channel; the only blockers are
    // the matching, visible island perimeter floors and the pavilion walls.
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx);
      P.ranged(2800, () => P.quad(M.stone, [a[0], -3.6, a[1]], [b[0], -3.6, b[1]], [b[0], top, b[1]], [a[0], top, a[1]], [-dz / len, 0, dx / len]));
      P.ranged(1000, () => P.tbox(M.edge, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, len + 0.03, 0.34, top, top + 0.14, rot, 'b'));
    }
    const entrance = [s.bridge.pts[s.bridge.pts.length - 2], s.bridge.pts[s.bridge.pts.length - 1]], dir = Math.atan2(entrance[1] - s.z, entrance[0] - s.x);
    for (let i = 0; i < hall.length; i++) {
      const a = hall[i], b = hall[(i + 1) % hall.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      const rot = Math.atan2(-dz, dx), angle = Math.atan2(mz - s.z, mx - s.x), door = Math.abs(Math.atan2(Math.sin(angle - dir), Math.cos(angle - dir))) < 0.16;
      P.ranged(1600, () => {
        if (!door) P.tbox(M.glass, mx, mz, len, 0.12, top + 0.22, hallTop - 0.22, rot, 'tb');
        if (!door) P.tbox(M.frame, mx, mz, len + 0.025, 0.24, top, top + 0.22, rot, 'b');
        P.tbox(M.frame, mx, mz, len + 0.025, 0.24, hallTop - 0.22, hallTop, rot, 'b');
      });
      P.ranged(700, () => { P.col(M.frame, a[0], a[1], top, hallTop, 0.07, 0.07, 6); if (!door) P.col(M.frame, mx, mz, top + 0.2, hallTop - 0.2, 0.035, 0.035, 6); });
      if (!door) ctx.physics.addBox(mx, mz, len, 0.18, rot, top, hallTop);
    }
    // Access bridge deck starts flush with the mainland and rises gradually
    // onto the +1.1 m island. Remaining spans retain 3.5 m clear water below
    // their 1 m beams (engineer's documented 2.9–3.5 m clearance).
    const actualPts = accessPoints(ctx, s.bridge.pts), frames = pathFrames(actualPts, 3), distances = [0];
    for (let i = 1; i < frames.length; i++) distances.push(distances[i - 1] + Math.hypot(frames[i].x - frames[i - 1].x, frames[i].z - frames[i - 1].z));
    // Densify the first span so the access slope ends after 14 m rather than
    // climbing throughout a 47 m single-segment OSM way.
    const all = [frames[0]], ys = [0.075];
    for (let i = 1; i < frames.length; i++) {
      const a = frames[i - 1], b = frames[i], len = distances[i] - distances[i - 1], n = Math.max(1, Math.ceil(len / 4));
      const ts = Array.from({ length: n }, (_, k) => (k + 1) / n);
      if (distances[i - 1] < 14 && distances[i] > 14) ts.push((14 - distances[i - 1]) / len);
      ts.sort((a, b) => a - b);
      for (const t of ts) { const d = distances[i - 1] + len * t;
        all.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, nx: a.nx + (b.nx - a.nx) * t, nz: a.nz + (b.nz - a.nz) * t, half: 1.5 });
        ys.push(0.075 + (top - 0.075) * Math.min(1, d / 14)); }
    }
    P.ranged(1800, () => drawRibbon(P, M.paving, all, i => ys[i]));
    for (let i = 1; i < all.length; i++) {
      const a = all[i - 1], b = all[i], dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz), rot = Math.atan2(dx, dz), ya = ys[i - 1], yb = ys[i];
      const quad = [[a.x - a.nx * 1.5, ya, a.z - a.nz * 1.5], [a.x + a.nx * 1.5, ya, a.z + a.nz * 1.5],
        [b.x + b.nx * 1.5, yb, b.z + b.nz * 1.5], [b.x - b.nx * 1.5, yb, b.z - b.nz * 1.5]];
      deckTriangles.push([quad[0], quad[1], quad[2]], [quad[0], quad[2], quad[3]]);
      ctx.physics.addWalkRamp((a.x + b.x) / 2, (a.z + b.z) / 2, 3, len + 0.04, rot, ya, yb, 1);
      P.ranged(1800, () => P.quad(M.dark,
        [a.x - a.nx * 1.5, ya - 1, a.z - a.nz * 1.5], [a.x + a.nx * 1.5, ya - 1, a.z + a.nz * 1.5],
        [b.x + b.nx * 1.5, yb - 1, b.z + b.nz * 1.5], [b.x - b.nx * 1.5, yb - 1, b.z - b.nz * 1.5], [0, -1, 0]));
      for (const side of [-1, 1]) {
        const aa = [a.x + a.nx * 1.38 * side, a.z + a.nz * 1.38 * side], bb = [b.x + b.nx * 1.38 * side, b.z + b.nz * 1.38 * side];
        P.ranged(1800, () => P.quad(M.dark, [aa[0], ya - 1, aa[1]], [bb[0], yb - 1, bb[1]], [bb[0], yb, bb[1]], [aa[0], ya, aa[1]], [a.nx * side, 0, a.nz * side]));
        rails.push(...splitBays(...aa, ...bb, 2.5, { y: ya, ye: yb }));
      }
    }
    paths.push({ id: s.bridge.id, pts: actualPts, sourcePts: s.bridge.pts, w: 3, length: spanLength(actualPts), maxGrade: (top - 0.075) / 14, y: top });
    islands.push({ id: s.building.id, x: s.x, z: s.z, y: top, ring, hallTop, diameter: 50 });
  }
  knockBays(ctx, { name: 'park300-access-rail', bays: rails,
    parts: [{ geo: unitBox(0, 1.1, -0.035, 0.035), mat: M.frame, at: 'start', sx: 0.065 },
      { geo: unitBox(1.05, 1.1, -0.035, 0.035), mat: M.frame, stretch: true },
      { geo: unitBox(0.48, 0.51, -0.025, 0.025), mat: M.frame, stretch: true }],
    collider: (b) => ({ y0: Math.min(b.y, b.ye) - 0.05, y1: Math.max(b.y, b.ye) + 1.1, thick: 0.08 }),
    rec: { kind: 'railing', mass: 58, h: 1.1, anchored: 17, hitK: 1, metal: true }, far: 650 });
  for (const { mesh } of P.build(root, { name: 'park300-waterfront' })) { mesh.receiveShadow = true; }
  triangles += P.tris; ctx.addStatic(root);
  ctx.services.waterfrontOkrug65 = { islands, paths, railingBays: rails.length, triangles, deckY: deckService(deckTriangles) };
  return triangles;
}
