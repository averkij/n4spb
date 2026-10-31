// landmarksYelaginServices/fence.js - the white spear-topped iron fences and gates of the Rossi service yard (OSM barriers w736544133 / w736544146 / w738578586 / w738578604 and the gate nodes n6916123786 / n6896052611 /
// n1145292923; photos stb_06 stb_10 stb_15 ora_14 misc_18): iron panels (alpha texture, 2.0 m high, spear heads), square posts with a ball finial every panel, a stone-white pier pair with the two open leaves at every gate.
// fenceRun() writes into the world-frame Parts collector K.P and records the collision segments / piers in K.shared.fenceSegs / K.shared.piers for walk.js.
import * as THREE from 'three';

/** a fence along the world polyline pts [[x, z]..] (OSM order); gates = [{ x, z, w }]: openings of width w around the nearest point of the line (the piers + open leaves are drawn by gateAt) */
export function fenceRun(K, pts, o = {}) {
  const P = K.P, M = K.M, h = o.h ?? 2.0, step = o.step ?? 2.0, gates = o.gates || [], segs = (K.shared.fenceSegs ||= []);
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    if (len < 0.3) continue;
    const tx = dx / len, tz = dz / len;
    // the gate gaps on this segment (distance along the segment)
    const gaps = [];
    for (const g of gates) { const t = (g.x - a[0]) * tx + (g.z - a[1]) * tz, d = Math.abs((g.x - a[0]) * tz - (g.z - a[1]) * tx); if (d < 2.5 && t > -g.w && t < len + g.w) gaps.push([t - g.w / 2, t + g.w / 2]); }
    gaps.sort((p, q) => p[0] - q[0]);
    const runs = []; let s = 0;
    for (const [g0, g1] of gaps) { if (g0 > s + 0.2) runs.push([s, Math.min(g0, len)]); s = Math.max(s, g1); }
    if (s < len - 0.2) runs.push([s, len]);
    for (const [r0, r1] of runs) {
      const L = r1 - r0, n = Math.max(1, Math.round(L / step)), w = L / n;
      for (let k = 0; k < n; k++) {
        const u0 = r0 + w * k, u1 = u0 + w;
        const p0 = [a[0] + tx * u0, a[1] + tz * u0], p1 = [a[0] + tx * u1, a[1] + tz * u1];
        P.quad(M.iron, [p0[0], 0.1, p0[1]], [p1[0], 0.1, p1[1]], [p1[0], h, p1[1]], [p0[0], h, p0[1]], [tz, 0, -tx], [[0, 0], [w / 2, 0], [w / 2, 1], [0, 1]]);
      }
      for (let k = 0; k <= n; k++) {
        const u = r0 + (r1 - r0) * k / n, x = a[0] + tx * u, z = a[1] + tz * u;
        P.box(M.white, x - 0.07, x + 0.07, 0, h + 0.1, z - 0.07, z + 0.07, 'b', 1);
        const g = new THREE.SphereGeometry(0.1, 6, 4); P.geo(M.white, g, x, h + 0.2, z); g.dispose();
      }
      segs.push({ x: a[0] + tx * (r0 + r1) / 2, z: a[1] + tz * (r0 + r1) / 2, len: r1 - r0, rot: Math.atan2(-tz, tx) });
    }
  }
}

/** a gate at (x, z) in a fence running along (tx, tz): two white piers with ball caps 1.5 m either side of the centre and the two iron leaves swung open along the path (normal to the fence) */
export function gateAt(K, x, z, tx, tz) {
  const P = K.P, M = K.M, nx = -tz, nz = tx, half = 1.55, piers = (K.shared.piers ||= []);
  for (const s of [-1, 1]) {
    const px = x + tx * s * half, pz = z + tz * s * half;
    P.box(M.white, px - 0.36, px + 0.36, 0, 2.2, pz - 0.36, pz + 0.36, 'b', 1.5);
    P.box(M.ashlar, px - 0.44, px + 0.44, 2.2, 2.34, pz - 0.44, pz + 0.44, 'b', 1.8);
    const g = new THREE.SphereGeometry(0.28, 10, 7); P.geo(M.white, g, px, 2.62, pz); g.dispose();
    piers.push([px, pz]);
    // the leaf: hinged at the pier, opened 90 deg along (n) toward -n (into the yard), 1.2 m long
    const hx = px - tx * s * 0.4, hz = pz - tz * s * 0.4, lx = hx - nx * 1.2, lz = hz - nz * 1.2;
    P.quad(M.iron, [hx, 0.1, hz], [lx, 0.1, lz], [lx, 2.05, lz], [hx, 2.05, hz], [tx, 0, tz], [[0, 0], [0.6, 0], [0.6, 1], [0, 1]]);
  }
}
