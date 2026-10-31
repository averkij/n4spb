// Exact narrow phases for the optional convex footprint of a walk ramp.
// Ordinary OBB ramps keep their existing paths; all numbers are world metres.
export function convexContains(poly, x, z, pad = 1e-7) {
  let sign = 0;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const dx = poly[i] - poly[j], dz = poly[i + 1] - poly[j + 1];
    const cross = dx * (z - poly[j + 1]) - dz * (x - poly[j]);
    if (Math.abs(cross) <= pad * Math.sqrt(dx * dx + dz * dz)) continue;
    const s = Math.sign(cross); if (sign && s !== sign) return false; sign = s;
  }
  return true;
}

/** Circle versus a convex polygon. Writes the outward normal/penetration to
 * out. The closest segment test keeps empty OBB corners completely empty. */
export function convexCircleContact(poly, x, z, radius, out) {
  const inside = convexContains(poly, x, z);
  let distance2 = Infinity, qx = 0, qz = 0, ex = 0, ez = 0;
  let area = 0;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const ax = poly[j], az = poly[j + 1], bx = poly[i], bz = poly[i + 1], dx = bx - ax, dz = bz - az;
    area += ax * bz - bx * az;
    const len2 = dx * dx + dz * dz, t = len2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2)) : 0;
    const px = ax + dx * t, pz = az + dz * t, d2 = (x - px) ** 2 + (z - pz) ** 2;
    if (d2 < distance2) { distance2 = d2; qx = px; qz = pz; ex = dx; ez = dz; }
  }
  const d = Math.sqrt(distance2);
  if (!inside && d >= radius) return false;
  if (d > 1e-9) { out.nx = (inside ? qx - x : x - qx) / d; out.nz = (inside ? qz - z : z - qz) / d; }
  else { const len = Math.sqrt(ex * ex + ez * ez) || 1, s = area >= 0 ? 1 : -1; out.nx = s * ez / len; out.nz = -s * ex / len; }
  out.depth = inside ? radius + d : radius - d; out.x = qx; out.z = qz;
  return true;
}
