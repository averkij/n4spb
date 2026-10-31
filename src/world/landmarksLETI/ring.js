// landmarksLETI/ring.js - ring helpers (COPY of landmarksBotanicalGarden/house.js offsetRing / simplifyRing; modules never import each other).
/** offset a ring outward by d (negative = inwards): miter joins (the outward side is decided by the sign of the area) */
export function offsetRing(ring, d) {
  const n = ring.length; let a2 = 0; for (let i = 0; i < n; i++) { const p = ring[i], q = ring[(i + 1) % n]; a2 += p[0] * q[1] - q[0] * p[1]; }
  const sg = a2 > 0 ? 1 : -1;
  const nrm = (p, q) => { const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return [dz / l * sg, -dx / l * sg]; };
  return ring.map((p, i) => {
    const a = ring[(i + n - 1) % n], b = ring[(i + 1) % n], n1 = nrm(a, p), n2 = nrm(p, b), k = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    const sx = (n1[0] + n2[0]) / Math.max(0.35, k), sz = (n1[1] + n2[1]) / Math.max(0.35, k);
    return [p[0] + sx * d, p[1] + sz * d];
  });
}
/** signed-area helper: > 0 when the ring runs counter-clockwise in the (x, z) plane as drawn by the formulas above */
export function areaOf(ring) { let a = 0; for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; }
/** inward unit bisector at vertex i (pointing into the building for an outer ring) from the outward normals of the two edges */
export function inwardAt(ring, i) {
  const n = ring.length, a = ring[(i + n - 1) % n], p = ring[i], b = ring[(i + 1) % n], A = areaOf(ring), sg = A > 0 ? 1 : -1;
  const nrm = (u, v) => { const dx = v[0] - u[0], dz = v[1] - u[1], l = Math.hypot(dx, dz) || 1; return [dz / l * sg, -dx / l * sg]; };
  const n1 = nrm(a, p), n2 = nrm(p, b), sx = n1[0] + n2[0], sz = n1[1] + n2[1], l = Math.hypot(sx, sz) || 1;
  return [-sx / l, -sz / l];
}
