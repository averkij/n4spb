// landmarksAndrew/ringkit.js - small helpers for the ring-shaped buildings of the module (market, Pel house): footprints read from the baked data into a model frame, per-edge offset rings (ridge lines
// of hipped roofs with different wing depths), window-bay layouts and collider boxes with gaps.  All rings are [[x, z]..] in the frame they were converted to; nothing here touches the scene.
import * as L from '../layout.js';
import { ringFromFlat, signedArea } from '../lib/massing.js';

const r2 = (v) => Math.round(v * 100) / 100;

/** footprint of baked building `id` converted into the model frame fr: { outer: ring, holes: [ring..] } or the fallback rings when the record is missing */
export function footprintIn(id, fr, fallback) {
  try {
    const rec = L.buildingById(id);
    if (rec && rec.polys && rec.polys[0]) {
      const cv = (flat) => ringFromFlat(flat).map((p) => { const m = fr.M(p[0], p[1]); return [r2(m.a), r2(m.b)]; });
      const p = rec.polys[0], outer = cv(p.o);
      if (outer.length >= 3) return { outer, holes: (p.h || []).map(cv), baked: true };
    }
  } catch (e) { /* fall back */ }
  return { outer: fallback.outer, holes: fallback.holes || [], baked: false };
}

/** the ring offset INWARD by d[i] for edge i (edge i = ring[i] -> ring[i + 1]); a negative d moves the edge outward.  Vertex i = the intersection of the offset lines of edges i - 1 and i. */
export function offsetRing(ring, d) {
  const n = ring.length, sgn = signedArea(ring) > 0 ? 1 : -1, dd = typeof d === 'number' ? ring.map(() => d) : d;
  const lines = ring.map((p, i) => {
    const q = ring[(i + 1) % n], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * sgn, nz = dx / l * sgn;
    return { x: p[0] + nx * dd[i], z: p[1] + nz * dd[i], dx: dx / l, dz: dz / l, nx, nz };
  });
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = lines[(i + n - 1) % n], b = lines[i], det = a.dx * b.dz - a.dz * b.dx;
    if (Math.abs(det) < 1e-6) { out.push([b.x, b.z]); continue; }
    const t = ((b.x - a.x) * b.dz - (b.z - a.z) * b.dx) / det;
    out.push([a.x + a.dx * t, a.z + a.dz * t]);
  }
  return out;
}
/** outward unit normal of edge i of a ring */
export function edgeNormal(ring, i) {
  const n = ring.length, sgn = signedArea(ring) > 0 ? 1 : -1, p = ring[i], q = ring[(i + 1) % n], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1;
  return [dz / l * sgn, -dx / l * sgn];
}
/** the vertex of `ring` whose coordinates are nearest to (a, b) */
export const nearestVertex = (ring, a, b) => ring.reduce((best, p) => (Math.hypot(p[0] - a, p[1] - b) < Math.hypot(best[0] - a, best[1] - b) ? p : best), ring[0]);

/** world collider boxes along a ring edge a -> b (world [x, z]) with gaps [[t0, t1]..] in metres from a: ph.addBox pieces of thickness `thick`; returns the number of boxes */
export function wallBoxes(ph, a, b, y0, y1, thick, gaps = []) {
  const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.2) return 0;
  const ux = dx / l, uz = dz / l, rot = Math.atan2(-dz, dx), pieces = []; let s0 = 0;
  for (const g of [...gaps].sort((m, n) => m[0] - n[0])) { if (g[0] > s0 + 0.05) pieces.push([s0, g[0]]); s0 = Math.max(s0, g[1]); }
  if (s0 < l - 0.05) pieces.push([s0, l]);
  let c = 0;
  for (const [t0, t1] of pieces) { const len = t1 - t0; if (len < 0.2) continue; ph.addBox(a[0] + ux * (t0 + t1) / 2, a[1] + uz * (t0 + t1) / 2, len + (gaps.length ? 0 : thick * 0.5), thick, rot, y0, y1); c++; }
  return c;
}
/** world point of the model-frame point (a, b) as [x, z] */
export const wp = (fr, a, b) => { const p = fr.W(a, b); return [p.x, p.z]; };
