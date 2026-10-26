// landmarksMariinsky/geo.js - small 2D helpers: mitred offsets of convex rings, point-in-ring tests, chains of footprint edges with evenly spaced bays.
import { frameOf } from './kit.js';

export const ringFlat = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); if (r.length > 1 && Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 0.05) r.pop(); return r; };
export const pointIn = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
export const dSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
export const polyDist = (r, x, z) => { let d = 1e9; for (let i = 0; i < r.length; i++) d = Math.min(d, dSeg(x, z, r[i], r[(i + 1) % r.length])); return d; };
export const signedArea = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };

/** offset every vertex of a convex ring OUTWARD by d (negative = inward) with mitre joins (the ring may have either winding) */
export function offsetConvex(ring, d) {
  const n = ring.length, s = signedArea(ring) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++) {
    const p = ring[(i + n - 1) % n], q = ring[i], r = ring[(i + 1) % n];
    const e1 = [q[0] - p[0], q[1] - p[1]], e2 = [r[0] - q[0], r[1] - q[1]], l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    const n1 = [e1[1] / l1 * s, -e1[0] / l1 * s], n2 = [e2[1] / l2 * s, -e2[0] / l2 * s];
    const dot = n1[0] * n2[0] + n1[1] * n2[1], k = d / Math.max(0.25, 1 + dot);
    out.push([q[0] + (n1[0] + n2[0]) * k, q[1] + (n1[1] + n2[1]) * k]);
  }
  return out;
}

/** consecutive edges (array of edge objects from kit.ringEdges, all in vertex order) -> evenly spaced bay positions { x, z, rot, edge, s }.  margin = distance of the first / last bay from the chain ends */
export function chainBays(edges, pitch, margin = 0.9, minLen = 1.0, margin1 = margin) {
  const cum = [0]; for (const e of edges) cum.push(cum[cum.length - 1] + e.len);
  const L = cum[cum.length - 1], inner = L - margin - margin1; if (inner < minLen) return [];
  const n = Math.max(1, Math.round(inner / pitch)), out = [];
  for (let i = 0; i < n; i++) {
    const s = margin + (i + 0.5) * inner / n;
    let k = 0; while (k + 1 < edges.length && cum[k + 1] < s) k++;
    const e = edges[k], u = (s - cum[k]) / e.len, f = frameOf(e);
    out.push({ x: e.a[0] + (e.b[0] - e.a[0]) * u, z: e.a[1] + (e.b[1] - e.a[1]) * u, rot: f.rot, edge: e, s, L, i, n });
  }
  return out;
}
/** split a list of edges (one ring, in order) into chains of consecutive edges that satisfy `ok`, breaking also where the direction turns by more than maxTurn radians */
export function chainsOf(edges, ok, maxTurn = 0.7) {
  const chains = []; let cur = [];
  const flush = () => { if (cur.length) chains.push(cur); cur = []; };
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    if (!ok(e)) { flush(); continue; }
    if (cur.length) {
      const p = cur[cur.length - 1], d1 = Math.atan2(p.b[1] - p.a[1], p.b[0] - p.a[0]), d2 = Math.atan2(e.b[1] - e.a[1], e.b[0] - e.a[0]);
      let t = Math.abs(d2 - d1); if (t > Math.PI) t = 2 * Math.PI - t;
      if (t > maxTurn || Math.hypot(p.b[0] - e.a[0], p.b[1] - e.a[1]) > 0.1) flush();
    }
    cur.push(e);
  }
  flush();
  // the ring is closed: join the last chain with the first when they touch
  if (chains.length > 1) { const f = chains[0], l = chains[chains.length - 1], pe = l[l.length - 1], fe = f[0]; if (Math.hypot(pe.b[0] - fe.a[0], pe.b[1] - fe.a[1]) < 0.1) { const d1 = Math.atan2(pe.b[1] - pe.a[1], pe.b[0] - pe.a[0]), d2 = Math.atan2(fe.b[1] - fe.a[1], fe.b[0] - fe.a[0]); let t = Math.abs(d2 - d1); if (t > Math.PI) t = 2 * Math.PI - t; if (t <= maxTurn) { chains[0] = l.concat(f); chains.pop(); } } }
  return chains;
}
