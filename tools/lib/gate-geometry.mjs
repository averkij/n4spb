// Gate geometry checks (docs/AREAS.md section 3.3 and 5), pure and layout-free except the arrival grid, which is handed the DESTINATION layout module.
// tools/areas-test.mjs runs them on every non-dev gate of src/areas/registry.js and, with synthetic fixtures, on itself.
//   street frame: x east, z south; a gate's `inward` points from the border into its OWN (origin) area; `zone` = walking depth of the prompt zone in metres.
import { gateCoords } from '../../src/core/gates.js';
import * as H from '../../src/core/handoff.js';

const DEG = Math.PI / 180;
export const inRect = (r, x, z, m = 0) => x >= r.x0 + m && x <= r.x1 - m && z >= r.z0 + m && z <= r.z1 - m;
/**
 * (x,z) inside the union of `rects`, at least m metres from the union's boundary (the layout's inPlay(x, z, m)): deep inside one rectangle, or inside the union with a closed disk of radius m
 * (sampled on 48 directions and 3 radii) that stays in the union.
 */
export function inUnion(rects, x, z, m = 0) {
  if (m > 0 && rects.some((r) => inRect(r, x, z, m))) return true;
  if (!rects.some((r) => inRect(r, x, z))) return false;
  if (m <= 0) return true;
  for (const f of [1, 0.5, 0.25]) for (let i = 0; i < 48; i++) { const a = i / 48 * 2 * Math.PI; if (!rects.some((r) => inRect(r, x + Math.cos(a) * m * f, z + Math.sin(a) * m * f))) return false; }
  return true;
}

/** the grid of an arrival rectangle: every `step` metres from its corner, the far edges included */
export function gridPoints(rect, step = 25) {
  const axis = (a, b) => { const v = []; for (let t = a; t < b - 1e-9; t += step) v.push(t); v.push(b); return v; };
  const pts = []; for (const x of axis(rect.x0, rect.x1)) for (const z of axis(rect.z0, rect.z1)) pts.push([x, z]); return pts;
}

/**
 * Registry-only geometry of ONE gate (no layout needed). fromRects / toRects: the play rectangles of the origin / destination area; reverse: the reverse gate row (or undefined).
 * Returns a list of problems (empty = fine).
 */
export function gateProblems(g, { fromRects, toRects, reverse }) {
  const p = [], [a, b] = g.seg, [nx, nz] = g.inward;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (!(len > 20)) p.push(`segment is ${len.toFixed(1)} m long`);
  if (Math.abs(Math.hypot(nx, nz) - 1) > 1e-9) p.push('inward is not a unit vector');
  if (Math.abs((b[0] - a[0]) * nx + (b[1] - a[1]) * nz) > 1e-6 * Math.max(1, len)) p.push('inward is not perpendicular to the segment');
  // the segment lies on the boundary of the origin play union: both sides, sampled every 5 m (1 m clear of the ends, where two rectangles meet at a corner)
  let onBorder = 0, samples = 0;
  for (let s = Math.min(1, len / 2); s <= len - Math.min(1, len / 2) + 1e-9; s += 5) {
    const x = a[0] + (b[0] - a[0]) * s / len, z = a[1] + (b[1] - a[1]) * s / len; samples++;
    const inside = inUnion(fromRects, x + nx * 0.5, z + nz * 0.5), outside = !inUnion(fromRects, x - nx * 0.5, z - nz * 0.5);
    if (inside && outside) onBorder++;
    else if (p.length < 6) p.push(`at ${s.toFixed(0)} m along the segment (${x.toFixed(1)}, ${z.toFixed(1)}): 0.5 m inward is ${inside ? 'inside' : 'OUTSIDE'} the origin area and 0.5 m outward is ${outside ? 'outside' : 'INSIDE'} it (the segment must lie on the border)`);
  }
  if (onBorder !== samples && p.length >= 6) p.push(`... ${samples - onBorder} of ${samples} samples are off the border`);
  // a point at depth `zone` is inside the origin area (middle and quarter points of the segment)
  for (const f of [0.25, 0.5, 0.75]) {
    const x = a[0] + (b[0] - a[0]) * f + nx * g.zone, z = a[1] + (b[1] - a[1]) * f + nz * g.zone;
    if (!inUnion(fromRects, x, z)) p.push(`a point at depth ${g.zone} m (${x.toFixed(1)}, ${z.toFixed(1)}) is outside the origin area`);
  }
  // the arrival rectangle lies in the destination play union: its corners keep the 25 m inset resolveArrival demands
  const r = g.arrive;
  if (!(r && r.x1 > r.x0 && r.z1 > r.z0)) p.push('arrive is not a rectangle');
  else for (const [x, z] of [[r.x0, r.z0], [r.x1, r.z0], [r.x0, r.z1], [r.x1, r.z1]]) if (!inUnion(toRects, x, z, 25)) p.push(`arrive corner (${x}, ${z}) is not 25 m inside the destination play area`);
  // the reverse gate leads back, and its prompt zone does not overlap the arrival rectangle: no grid point (25 m) is within `zone + 50 m` of the reverse border while inside its lateral range
  if (g.reverse) {
    if (!reverse) p.push(`reverse gate "${g.reverse}" does not exist`);
    else {
      if (reverse.from !== g.to || reverse.to !== g.from) p.push(`reverse gate ${reverse.id} does not lead back (${reverse.from} -> ${reverse.to}, expected ${g.to} -> ${g.from})`);
      if (reverse.reverse !== g.id) p.push(`reverse gate ${reverse.id} names ${reverse.reverse} as its reverse, not ${g.id}`);
      if (r && r.x1 > r.x0) {
        let near = 0, worst = Infinity;
        for (const [x, z] of gridPoints(r)) {
          const c = gateCoords(reverse, x, z);
          if (c.s >= 0 && c.s <= c.len && c.d < reverse.zone + 50) { near++; worst = Math.min(worst, c.d); }
        }
        if (near) p.push(`${near} arrival grid points lie within the reverse gate ${reverse.id}'s zone + 50 m (nearest depth ${worst.toFixed(1)} m < ${reverse.zone + 50}): the player would be asked to go back at once`);
      }
    }
  }
  return p;
}

/**
 * The arrival grid (25 m steps over g.arrive) x walk / fly / car x the two headings along the crossing axis, resolved by handoff.resolveArrival with the DESTINATION layout L and checked
 * with predicates written out independently of makeProbe (25 m inset, not in a building (1.5 m), a car on dry ground on a drivable lane within 30 degrees of its heading; water remains reachable).
 * Returns { total, direct, ring, hero, badCount, bad: [first 12 messages] }; a result that fell back to the destination HERO counts as bad (an arrival grid that needs the fallback is a gate in the wrong place).
 */
export function arrivalGrid(g, L, { step = 25 } = {}) {
  const probe = H.makeProbe(L), out = { total: 0, direct: 0, ring: 0, hero: 0, badCount: 0, bad: [] };
  const [nx, nz] = g.inward;
  // the crossing heading is OUT of the origin area = -inward; yaw 0 = north (-z), 90 = west (-x): forward = (-sin yaw, -cos yaw)
  const yawOf = (dx, dz) => Math.atan2(-dx, -dz) / DEG;
  for (const yaw of [yawOf(-nx, -nz), yawOf(nx, nz)]) {
    const [fx, fz] = H.forwardOf(yaw);
    for (const mode of ['walk', 'fly', 'car']) for (const [x, z] of gridPoints(g.arrive, step)) {
      out.total++;
      const r = H.resolveArrival(probe, { x, z, yaw }, mode, g.arrive);
      out[r.how === 'direct' ? 'direct' : r.how === 'ring' ? 'ring' : 'hero']++;
      const why = [];
      if (r.how === 'hero') why.push('fell back to the destination HERO');
      if (!L.inPlay(r.x, r.z, 25)) why.push('not 25 m inside the play area');
      if (L.insideBuilding(r.x, r.z, 1.5)) why.push('inside / next to a building');
      // (no river predicate: water is reachable, a pose in water is not a failure - CLAUDE.md world rules; a wall of water shows as 'not 25 m inside' or as the HERO fall-back)
      if (mode === 'car' && !L.inRiver?.(r.x, r.z)) {
        const lane = L.roadsNear(r.x, r.z, 0, { drivable: true }).find((q) => q.gap <= 0);
        if (!lane) why.push('not on a drivable lane'); else if (Math.abs(lane.tx * fx + lane.tz * fz) < Math.cos(30 * DEG)) why.push('lane is more than 30 degrees off the heading');
      }
      if (why.length) { out.badCount++; if (out.bad.length < 12) out.bad.push(`${mode} yaw ${yaw.toFixed(0)} from (${x}, ${z}) -> (${r.x.toFixed(1)}, ${r.z.toFixed(1)}) ${r.how}: ${why.join(', ')}`); }
    }
  }
  return out;
}
