// Wall-mounted quay details require a real vertical backing over their entire
// rectangle. Natural banks, bridge openings, corners and shallow walls are not
// a support merely because a bridge zone ends nearby. Pure CPU placement rule.
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function backedByFinalFace(face, point, direction) {
  const end = (p, o, y) => [p.x + p.mx * o, y, p.z + p.mz * o];
  const a = end(face.a, -face.batter, face.bottom), b = end(face.b, -face.batter, face.bottom);
  const c = end(face.b, 0, face.top), d = end(face.a, 0, face.top);
  // The mitre scale is capped at sharp corners. The resulting quad can be
  // warped, so its nominal batter plane alone is not the drawn backing.
  return [[a, b, c], [a, c, d]].some(([a, b, c]) => {
    const e1 = sub(b, a), e2 = sub(c, a), n = cross(e1, e2), nl = Math.hypot(...n);
    if (!nl || Math.abs(n[1]) / nl > .15 || Math.abs(dot(n, direction)) / nl < .985) return false;
    const p = cross(direction, e2), det = dot(e1, p);
    if (Math.abs(det) < 1e-10) return false;
    const t = sub(point, a), u = dot(t, p) / det, q = cross(t, e1), v = dot(direction, q) / det;
    const distance = dot(e2, q) / det;
    return u >= 0 && v >= 0 && u + v <= 1 && distance >= .002 && distance <= .07;
  });
}
export function wallFixture({ s, y, width, height, faceAt, clearAt = () => true }) {
  const centre = faceAt(s);
  if (!centre?.solid) return null;
  const wallOffset = (face, atY) => -face.batter * (face.top - atY) / (face.top - face.bottom);
  // A vertical plate over a battered wall must clear the face at its lower
  // edge too, while the upper edge must stay close enough to remain mounted.
  const clearance = Math.max(.025, Math.abs(centre.batter) * height / 2 / (centre.top - centre.bottom) + .012);
  const offset = wallOffset(centre, y) - clearance;
  const x = centre.x + centre.nx * offset, z = centre.z + centre.nz * offset;
  for (const u of [-width / 2, 0, width / 2]) {
    const face = faceAt(s + u);
    if (!face?.solid || face.nx * centre.nx + face.nz * centre.nz < .995) return null;
    const px = x + centre.tx * u, pz = z + centre.tz * u;
    for (const v of [-height / 2, 0, height / 2]) {
      const py = y + v;
      if (py < face.bottom + .015 || py > face.top - .015) return null;
      const backingOffset = wallOffset(face, py);
      const distance = (px - face.x) * face.nx + (pz - face.z) * face.nz - backingOffset;
      // Facing the water, a decal is just in front of the actual battered face.
      if (distance > -.002 || distance < -.07 || !clearAt(px, pz)) return null;
      // Mitred bank corners shift the ends of a battered wall at each height.
      // Being within the centreline's arclength range alone is insufficient.
      if (face.a && face.b) {
        const ax = face.a.x + face.a.mx * backingOffset, az = face.a.z + face.a.mz * backingOffset;
        const bx = face.b.x + face.b.mx * backingOffset, bz = face.b.z + face.b.mz * backingOffset;
        const dx = bx - ax, dz = bz - az, t = ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1);
        if (t < .00001 || t > .99999) return null;
        if (!backedByFinalFace(face, [px, py, pz], [centre.nx, 0, centre.nz])) return null;
      }
    }
  }
  return { x, z, y, nx: -centre.nx, nz: -centre.nz };
}
