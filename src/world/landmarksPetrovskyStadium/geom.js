// landmarksPetrovskyStadium/geom.js - pure data and ring helpers shared by frame.js and groups.js (no imports: environment/owners.js reads groups.js before the world is built).
// the stadium plateau: vertices 300..343 of the island relation r1576109 (the cut 343 -> 300 across the neck is ours: the paved apron ends there)
export const TIP = [[-3733.2, -2324.6], [-3707, -2306.5], [-3667.9, -2279.4], [-3773.7, -2139.2], [-3777.1, -2131.6], [-3777.3, -2125.8], [-3776.7, -2119.2], [-3775.4, -2112], [-3771, -2103.3], [-3765.8, -2096.3], [-3757.9, -2088.3], [-3668.5, -2027.4], [-3660.1, -2025.1], [-3652.2, -2024.8], [-3645, -2025.8], [-3638.6, -2028.2], [-3633.2, -2031.3], [-3627.8, -2036], [-3605.2, -2069.6], [-3601.9, -2067.3], [-3597, -2074.2], [-3600.6, -2076.8], [-3540.9, -2163], [-3533.7, -2176.1], [-3530.4, -2183.6], [-3527.1, -2182.9], [-3524.2, -2195.9], [-3526.6, -2196.4], [-3525.2, -2206.7], [-3525.1, -2215.7], [-3528.2, -2233.2], [-3533.6, -2247], [-3541.6, -2259.3], [-3552.5, -2272.3], [-3596.7, -2305.1], [-3606.3, -2312.3], [-3616.8, -2320.4], [-3618.5, -2324.2], [-3618.4, -2328.3], [-3616.9, -2331.8], [-3647.4, -2354.4], [-3649.7, -2353.3], [-3651.8, -2353.2], [-3653.7, -2353.5]];
export const signedArea = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
/** closed ring offset by d metres along its normals (d > 0 = outwards), mitred; for rings with a curvature radius above |d| */
export function offsetRing(ring, d) {
  const n = ring.length, sg = signedArea(ring) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i + n - 1) % n], p1 = ring[i], p2 = ring[(i + 1) % n];
    const nr = (p, q) => { const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return [dz / l * sg, -dx / l * sg]; };
    const n1 = nr(p0, p1), n2 = nr(p1, p2);
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = Math.min(2.5, 1 / Math.max(0.4, mx * n1[0] + mz * n1[1]));
    out.push([p1[0] + mx * d * k, p1[1] + mz * d * k]);
  }
  return out;
}
