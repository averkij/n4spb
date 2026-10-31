// EDGE gates and territories (docs/AREAS.md sections 13 and 14), pure geometry over registry rectangles { x0, x1, z0, z1 } (street frame: x east, z south). tools/areas-test.mjs runs it on the real
// registry rows and, with synthetic fixtures, on itself. (The border gates and the doors: tools/lib/gate-geometry.mjs.)
// An edge gate has no segment: the rule of src/core/gates.js edgeDir. A walker at p inside FROM triggers when p + depth * dir (8 directions) is outside FROM and inside TO by `edgeIn` (60 m); he lands at p.
import { inUnion as ruleInUnion, EDGE_DIRS } from '../../src/core/gates.js';
import { inRect } from './gate-geometry.mjs';
import * as H from '../../src/core/handoff.js';

const inAny = (rs, x, z) => rs.some((r) => inRect(r, x, z));

/** the first of the 8 directions (an index into EDGE_DIRS) in which the edge rule holds at p, or -1 (the game's own inUnion: core/gates.js) */
export function edgeDirAt(F, T, x, z, { depth = 40, edgeIn = 60 } = {}) {
  for (let k = 0; k < EDGE_DIRS.length; k++) { const qx = x + depth * EDGE_DIRS[k][0], qz = z + depth * EDGE_DIRS[k][1]; if (!ruleInUnion(F, qx, qz) && ruleInUnion(T, qx, qz, edgeIn)) return k; }
  return -1;
}

/**
 * The lens of an edge gate over two territories (arrays of rectangles): the boundary points of FROM every `step` metres (0.5 m inside), classified as
 *   works  = the edge rule holds in some direction;  world = no ground of TO outside FROM within `near` m (the world edge: nothing to hop to);  dead = the rest (a wall that does not hop).
 * Lengths in metres (points x step). `strips`: the runs of dead points per rectangle side, worst first. `points`: the working points { x, z, k }.
 * `back`: for each working point the walk-back distance (m, up to `backMax`) to the nearest point of TO where the REVERSE rule holds (the bounce-back risk after the hop; Infinity = none).
 */
export function edgeLens(F, T, { step = 20, depth = 40, edgeIn = 60, near = 200, backMax = 300 } = {}) {
  const out = { step, boundary: 0, works: 0, dead: 0, world: 0, strips: [], points: [], back: [] };
  const sides = (r) => [[r.z0, r.z1, (t) => [r.x0, t], [-1, 0], 'x0'], [r.z0, r.z1, (t) => [r.x1, t], [1, 0], 'x1'], [r.x0, r.x1, (t) => [t, r.z0], [0, -1], 'z0'], [r.x0, r.x1, (t) => [t, r.z1], [0, 1], 'z1']];
  for (const r of F) for (const [a, b, pt, o, side] of sides(r)) {
    let run = null;
    for (let t = a + step / 2; t < b; t += step) {
      const [px, pz] = pt(t);
      if (inAny(F, px + o[0] * 0.5, pz + o[1] * 0.5)) { run = null; continue; }      // an interior edge of the union
      out.boundary += step;
      const x = px - o[0] * 0.5, z = pz - o[1] * 0.5, k = edgeDirAt(F, T, x, z, { depth, edgeIn });
      if (k >= 0) {
        out.works += step; out.points.push({ x, z, k }); run = null;
        let best = Infinity;
        for (let d = 0; d <= backMax && best === Infinity; d += 5) for (let i = 0; i < 16; i++) { const an = i / 16 * 2 * Math.PI, sx = x + d * Math.cos(an), sz = z + d * Math.sin(an); if (inAny(T, sx, sz) && edgeDirAt(T, F, sx, sz, { depth, edgeIn }) >= 0) { best = d; break; } }
        out.back.push(best);
        continue;
      }
      let other = false;      // is there ground of TO outside FROM near the point?
      for (let d = 20; d <= near && !other; d += 20) for (let i = 0; i < 16 && !other; i++) { const an = i / 16 * 2 * Math.PI, sx = px + d * Math.cos(an), sz = pz + d * Math.sin(an); if (inAny(T, sx, sz) && !inAny(F, sx, sz)) other = true; }
      if (!other) { out.world += step; run = null; continue; }
      out.dead += step;
      if (run && Math.abs(run.to - t) < step + 1) { run.to = t; run.len += step; } else { run = { rect: r.name, side, from: t, to: t, len: step, at: [Math.round(px), Math.round(pz)] }; out.strips.push(run); }
    }
  }
  out.strips.sort((p, q) => q.len - p.len);
  return out;
}

/**
 * Registry-only problems of ONE edge gate (kind 'edge': from, to, zone?, reverse; no seg / inward / arrive / at / pose / prompt). `reverse`: the reverse row.
 * `deadMax`: the longest dead run (m) tolerated; `worksMin`: the least working boundary (m).
 */
export function edgeProblems(g, { fromRects, toRects, reverse }, { deadMax = 300, worksMin = 1000 } = {}) {
  const p = [];
  for (const k of ['seg', 'inward', 'arrive', 'at', 'pose', 'prompt']) if (g[k] !== undefined) p.push(`an edge gate has no ${k}`);
  if (g.zone !== undefined && !(g.zone >= 20 && g.zone <= 200)) p.push(`zone ${g.zone} (20 .. 200 m)`);
  if (!fromRects?.length || !toRects?.length) { p.push('a territory is empty'); return p; }
  if (g.reverse) {
    if (!reverse) p.push(`reverse gate "${g.reverse}" does not exist`);
    else {
      if (reverse.from !== g.to || reverse.to !== g.from) p.push(`reverse gate ${reverse.id} does not lead back (${reverse.from} -> ${reverse.to}, expected ${g.to} -> ${g.from})`);
      if (reverse.reverse !== g.id) p.push(`reverse gate ${reverse.id} names ${reverse.reverse} as its reverse, not ${g.id}`);
      if (reverse.kind !== 'edge') p.push(`reverse gate ${reverse.id} is not an edge gate`);
    }
  } else p.push('an edge gate needs its reverse (a one-way hop strands the player)');
  const overlap = fromRects.some((a) => toRects.some((b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1));
  if (!overlap) { p.push('the territories do not overlap (no hop is possible: they must overlap by about one block)'); return p; }
  const L = edgeLens(fromRects, toRects, { backMax: 0 });
  if (L.works < worksMin) p.push(`only ${L.works} m of the boundary of ${g.from} hops to ${g.to} (at least ${worksMin} m expected; dead ${L.dead} m, world edge ${L.world} m)`);
  const worst = L.strips[0];
  if (worst && worst.len > deadMax) p.push(`dead boundary strip of ${worst.len} m (${worst.rect}.${worst.side} ${worst.side[0] === 'x' ? 'z' : 'x'} ${worst.from}..${worst.to}, near ${worst.at}): a wall with ground of ${g.to} behind it that does not hop (limit ${deadMax} m)`);
  return p;
}

/**
 * Territory shape (a union of rectangles): well-formed rectangles, ONE edge-connected piece (no island joined only at a corner), no enclosed hole (an invisible wall inside the area).
 * The cells are the compressed grid of the rectangle corners. Returns a list of problems.
 */
export function territoryProblems(rects) {
  const p = [];
  rects.forEach((r) => { if (!(r.x1 > r.x0 && r.z1 > r.z0)) p.push(`rect ${r.name}: empty or inverted`); });
  if (p.length) return p;
  const xs = [...new Set(rects.flatMap((r) => [r.x0, r.x1]))].sort((a, b) => a - b), zs = [...new Set(rects.flatMap((r) => [r.z0, r.z1]))].sort((a, b) => a - b);
  const W = xs.length + 1, H = zs.length + 1;      // one padding cell around: index i + 1 is the cell [xs[i], xs[i+1]]
  const full = Array.from({ length: H }, () => new Uint8Array(W));
  for (const r of rects) for (let i = xs.indexOf(r.x0); i < xs.indexOf(r.x1); i++) for (let j = zs.indexOf(r.z0); j < zs.indexOf(r.z1); j++) full[j + 1][i + 1] = 1;
  const flood = (value, seed, mark) => { const st = [seed], cells = []; while (st.length) { const [i, j] = st.pop(); if (i < 0 || j < 0 || i >= W || j >= H || mark[j][i] || full[j][i] !== value) continue; mark[j][i] = 1; cells.push([i, j]); st.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]); } return cells; };
  const area = (cells) => cells.reduce((s, [i, j]) => s + (xs[i] - xs[i - 1]) * (zs[j] - zs[j - 1]), 0);
  const box = (cells) => { const a = cells.map(([i]) => xs[i - 1]), b = cells.map(([i]) => xs[i]), c = cells.map(([, j]) => zs[j - 1]), d = cells.map(([, j]) => zs[j]); return `x ${Math.min(...a)}..${Math.max(...b)}, z ${Math.min(...c)}..${Math.max(...d)}`; };
  const seenE = Array.from({ length: H }, () => new Uint8Array(W)); flood(0, [0, 0], seenE);      // the outside
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (!full[j][i] && !seenE[j][i]) { const c = flood(0, [i, j], seenE); p.push(`a hole in the territory (${box(c)}, ${area(c)} m2): an invisible wall`); }
  const seenF = Array.from({ length: H }, () => new Uint8Array(W)), comps = [];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (full[j][i] && !seenF[j][i]) comps.push(flood(1, [i, j], seenF));
  if (comps.length > 1) { comps.sort((a, b) => area(b) - area(a)); for (const c of comps.slice(1)) p.push(`a piece of the territory joined only at a corner or not at all (${box(c)}, ${area(c)} m2): an unwalkable island`); }
  return p;
}

/**
 * The arrival of an edge hop: the player lands at the SAME x, z, yaw (no rectangle), so the pose is resolved by handoff.resolveArrival with the DESTINATION layout L at every working point of the lens.
 * A walker / flyer heads the probe direction; a CAR exists only on a drivable lane (the roads are the same data on both sides of an overlap), so a car is tried at the working points that have one,
 * headed along the lane in both senses. Checked with predicates written out independently of makeProbe (25 m inside the play area, not in a building, a car on dry ground on a lane within 30 degrees of its heading);
 * water is NOT a failure (CLAUDE.md world rules: a pose in water is fine, a wall of water is the defect). A fall-back to the destination HERO counts as bad.
 * Returns { total, direct, ring, hero, badCount, byMode, wet: { total, bad }, bad: [first 12] }.
 */
export function edgeArrival(points, L) {
  const probe = H.makeProbe(L), out = { total: 0, direct: 0, ring: 0, hero: 0, badCount: 0, byMode: { walk: 0, fly: 0, car: 0 }, wet: { total: 0, bad: 0 }, bad: [] };
  const yawOf = (dx, dz) => Math.atan2(-dx, -dz) * 180 / Math.PI;
  for (const { x, z, k } of points) {
    const lane = L.roadsNear(x, z, 0, { drivable: true }).find((q) => q.gap <= 0), wet = !!L.inRiver(x, z);
    const tries = [['walk', yawOf(...EDGE_DIRS[k])], ['fly', yawOf(...EDGE_DIRS[k])]];
    if (lane) tries.push(['car', yawOf(lane.tx, lane.tz)], ['car', yawOf(-lane.tx, -lane.tz)]);
    for (const [mode, yaw] of tries) {
      const [fx, fz] = H.forwardOf(yaw);
      out.total++; if (wet) out.wet.total++;
      const r = H.resolveArrival(probe, { x, z, yaw }, mode, null);
      out[r.how === 'direct' ? 'direct' : r.how === 'ring' ? 'ring' : 'hero']++;
      const why = [];
      if (r.how === 'hero') why.push('fell back to the destination HERO');
      if (!L.inPlay(r.x, r.z, 25)) why.push('not 25 m inside the play area');
      if (L.insideBuilding(r.x, r.z, 1.5)) why.push('inside / next to a building');
      if (mode === 'car' && !L.inRiver?.(r.x, r.z)) { const l2 = L.roadsNear(r.x, r.z, 0, { drivable: true }).find((q) => q.gap <= 0); if (!l2) why.push('not on a drivable lane'); else if (Math.abs(l2.tx * fx + l2.tz * fz) < Math.cos(30 * Math.PI / 180)) why.push('lane is more than 30 degrees off the heading'); }
      if (why.length) { out.badCount++; out.byMode[mode]++; if (wet) out.wet.bad++; if (out.bad.length < 12) out.bad.push(`${mode}${wet ? ' (in water)' : ''} yaw ${yaw.toFixed(0)} from (${x.toFixed(1)}, ${z.toFixed(1)}) -> (${r.x.toFixed(1)}, ${r.z.toFixed(1)}) ${r.how}: ${why.join(', ')}`); }
    }
  }
  return out;
}
