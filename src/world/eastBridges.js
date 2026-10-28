// eastBridges - the Alexander Nevsky Bridge and the Lavra canal crossings: copied from 102_3d_piter commit 0568f7af (src/world/eastBridges.js); the n4spb edits are marked 'n4spb:'.
// Alexander Nevsky Bridge: 35m wide, 907m with approaches, seven spans.
// Geometry/dimensions: Mostotrest and Transmost, URLs in docs/EAST.md.
// The other eastern crossings follow OSM segments at street datum.
export const OWNS_GROUPS = true;
import * as THREE from 'three';
import { EAST_BRIDGE_ROADS } from './eastBridges/groups.js';
import { Parts } from './landmarksD/kit.js';
import * as L from './layout.js';
import { knockBays } from './lib/fence-bays.js';
import { solidPiers } from './bridges/piers.js';      // the drawn piers in the water are solid for a floating hull      // n4spb: inExtent (the clip of the 907 m main span to the data of the area, below)

export function build(ctx) {
  const root = new THREE.Group(); root.name = 'east-bridges';
  const P = new Parts(), surf = [], rbays = [];      // rbays: the breakable railing bays (docs/AREAS.md 13.7)
  const concrete = ctx.mat.toon('#9a9e98', { paint: 0.04 }), asphalt = ctx.mat.toon('#535a63', { paint: 0.025 });
  const paving = ctx.mat.toon('#afa99f'), iron = ctx.mat.toon('#4e625e'), line = ctx.mat.toon('#d4d1bb');
  const ax = 2193, az = 864, dx = 840, dz = -341, length = Math.hypot(dx, dz), tx = dx / length, tz = dz / length, rot = Math.atan2(tx, tz);
  // n4spb: the main span is one fixed 907 m axis, but an area holds only part of it (Smolninskoye: the data ends 875 m along the axis, the play territory at 745 m): what lies beyond the data extent would hang in
  // the void (no ground, no water, a deck that rises to 10.8 m and ends in the air). Every part of the axis geometry (slabs, rails, wires, piers, lamps) is therefore built only where its position is inside the extent.
  const onMap = d => L.inExtent(ax + tx * d, az + tz * d);
  const height = d => Math.max(0.03, Math.min(1, d / 138, (length - d) / 138) * 10.8);
  function slab(x, z, rotY, len, width, ya, yb, rails = true, markings = false) {
    const half = len / 2, w = width / 2;
    P.push(x, 0, z, rotY);
    P.quad(asphalt, [-w, ya, -half], [w, ya, -half], [w, yb, half], [-w, yb, half], [0, 1, 0]);
    P.quad(concrete, [-w, ya - 1.0, -half], [-w, ya, -half], [-w, yb, half], [-w, yb - 1.0, half], [-1, 0, 0]);
    P.quad(concrete, [w, ya - 1.0, -half], [w, ya, -half], [w, yb, half], [w, yb - 1.0, half], [1, 0, 0]);
    P.quad(concrete, [-w, ya - 1.0, -half], [w, ya - 1.0, -half], [w, yb - 1.0, half], [-w, yb - 1.0, half], [0, -1, 0]);
    for (const side of [-1, 1]) {
      const outer = side * w, inner = side * (w - Math.min(2.3, width * 0.18));
      P.quad(paving, [inner, ya + 0.12, -half], [outer, ya + 0.12, -half], [outer, yb + 0.12, half], [inner, yb + 0.12, half], [0, 1, 0]);
      if (rails) {                                                                   // the railing: a BAY per post (two tubes, a post, a thin collider: lib/fence-bays.js, docs/AREAS.md 13.7)
        const n = Math.ceil(len / 2.3), c = Math.cos(rotY), s = Math.sin(rotY);
        for (let i = 0; i < n; i++) {
          const z0 = -half + len * i / n, z1 = -half + len * (i + 1) / n;
          rbays.push({ x0: x + outer * c + z0 * s, z0: z + -outer * s + z0 * c, x1: x + outer * c + z1 * s, z1: z + -outer * s + z1 * c, y: ya + (yb - ya) * i / n, ye: ya + (yb - ya) * (i + 1) / n });
        }
      }
    }
    if (markings) for (const u of [-10.5, -7, -3.5, 3.5, 7, 10.5]) P.quad(line, [u - 0.07, ya + 0.025, -half + 2], [u + 0.07, ya + 0.025, -half + 2], [u + 0.07, yb + 0.025, half - 2], [u - 0.07, yb + 0.025, half - 2], [0, 1, 0]);
    P.pop();
    ctx.physics.addWalkRamp(x, z, width, len + 0.03, rotY, ya, yb, 1.0);
    surf.push({ x, z, c: Math.cos(rotY), s: Math.sin(rotY), len, width, ya, yb });
  }
  const n = Math.ceil(length / 8);
  for (let i = 0; i < n; i++) {
    const d0 = length * i / n, d1 = length * (i + 1) / n, mid = (d0 + d1) / 2;
    if (!onMap(d0) || !onMap(d1)) continue;      // n4spb: clipped to the extent
    slab(ax + tx * mid, az + tz * mid, rot, d1 - d0, 35, height(d0), height(d1), true, true);
  }
  // Paired three-span concrete sections and a 52m central bascule span.
  for (const d of [138, 188, 298, 421.5, 473.5, 597, 707, 757]) {
    if (!onMap(d)) continue;      // n4spb
    P.push(ax + tx * d, 0, az + tz * d, rot);
    P.box(concrete, -16.5, 16.5, -3.7, height(d) - 1.1, -2.6, 2.6, 'b');
    P.pop();
  }
  // Tram rails and contact wires continue on the real longitudinal bridge axis.
  P.push(ax, 0, az, rot);
  for (const u of [-2.3, -0.8, 0.8, 2.3]) for (let i = 0; i < n; i++) {
    const a = length * i / n, b = length * (i + 1) / n;
    if (!onMap(a) || !onMap(b)) continue;      // n4spb
    P.cyl(iron, [u, height(a) + 0.035, a], [u, height(b) + 0.035, b], 0.04, 0.04, 4, false);
  }
  P.pop();
  for (const u of [-8, -7.4, -2, 2, 7.4, 8]) {
    const points = [];
    for (let d = 0; d <= length; d += length / n) if (onMap(d)) points.push([ax + tx * d + tz * u, height(d) + 5.8, az + tz * d - tx * u]);
    ctx.wires.add(points, { width: 0.012, color: '#48524c' });
  }
  for (let d = 26; d < length; d += 38) {
    if (!onMap(d)) continue;      // n4spb
    P.push(ax + tx * d, 0, az + tz * d, rot);
    for (const side of [-1, 1]) {
      const x = side * 16.9, y = height(d);
      P.cyl(iron, [x, y, 0], [x, y + 9, 0], 0.12, 0.08, 8);
      P.cyl(iron, [x, y + 9, 0], [x - side * 3.5, y + 9.5, 0], 0.075, 0.05, 6);
      P.box(paving, x - side * 3.5 - 0.6, x - side * 3.5 + 0.6, y + 9.3, y + 9.5, -0.22, 0.22);
    }
    P.pop();
  }
  // All minor bridge paths have an actual solid walking deck above the water.
  for (const r of EAST_BRIDGE_ROADS) {
    if (r.name === 'мост Александра Невского' || r.id === 'w1424478415' || r.id === 'w1424478419') continue;
    for (let i = 0; i + 3 < r.pts.length; i += 2) {
      const [x0, z0, x1, z1] = r.pts.slice(i, i + 4), len = Math.hypot(x1 - x0, z1 - z0);
      if (len < 0.05) continue;
      // Adjacent carriageways keep open sides; mapped foot bridges have rails.
      const foot = ['footway', 'path', 'pedestrian'].includes(r.hw), width = (r.w || 4) + (foot ? 0.4 : 0);
      slab((x0 + x1) / 2, (z0 + z1) / 2, Math.atan2(x1 - x0, z1 - z0), len, width, 0.035, 0.035, foot);
    }
  }
  if (rbays.length) {
    const tube = new THREE.CylinderGeometry(0.055, 0.055, 1, 4, 1).rotateZ(Math.PI / 2).translate(0.5, 0, 0), post = new THREE.BoxGeometry(0.08, 0.99, 0.08).translate(0, 0.495, 0);
    knockBays(ctx, { name: 'east-bridges-rail', bays: rbays, far: 420,
      parts: [{ geo: tube, mat: iron, name: 'tube-lo', far: 420, stretch: true, y: 0.38 }, { geo: tube, mat: iron, name: 'tube-hi', far: 420, stretch: true, y: 1.15 }, { geo: post, mat: iron, name: 'post', far: 420, at: 'mid', y: 0.16 }],
      collider: (q) => ({ y0: Math.min(q.y, q.ye), y1: Math.max(q.y, q.ye) + 1.2, thick: 0.18, e0: 0.02, e1: 0.02 }),
      rec: () => ({ kind: 'fence', mass: 100, h: 1.15, r: 0.06, anchored: 12, hitK: 0.25, metal: true, minDv: 0 }) });
  }
  solidPiers(ctx, P.build(root, { name: 'east-bridges' })); ctx.addStatic(root);
  const deckY = (x, z) => {
    for (const r of surf) {
      const dx = x - r.x, dz = z - r.z, u = dx * r.c - dz * r.s, v = dx * r.s + dz * r.c;
      if (Math.abs(u) <= r.width / 2 && Math.abs(v) <= r.len / 2 + 0.02) return r.ya + (r.yb - r.ya) * (v / r.len + 0.5);
    }
    return null;
  };
  ctx.services.eastBridges = { deckY, segments: surf.length };
}
