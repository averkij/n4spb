// landmarksFill/roads.js - the planned streets of the fill as HAUL-ROAD ROADBEDS: a strip of rolled hardcore with two lighter shoulders, drawn as a decal (the road material, vertex colours) 3.5 cm over the ground.
// The pieces come from plan.js (they are cut where a real road, a building, a green / parking polygon or the water is: a roadbed never lies on a road and never reaches a shore). Triangles: 6 per 30 m.
// Nothing is a collider (flat ground), nothing blocks the water.
const SEG = 30, Y = 0.035;

export function roadsGeometry(K, roads) {
  const P = K.P, M = K.M, rng = K.ctx.rng('fill-roads');
  const quad = (a, b, w0, w1, y, col) => {
    // a strip from a to b between the lateral offsets w0 .. w1 (metres to the left of travel)
    const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    P.tint(col).quad(M.road, [a[0] + nx * w0, y, a[1] + nz * w0], [b[0] + nx * w0, y, b[1] + nz * w0], [b[0] + nx * w1, y, b[1] + nz * w1], [a[0] + nx * w1, y, a[1] + nz * w1], [0, 1, 0]);
  };
  for (const r of roads) {
    const hw = r.w / 2, base = r.kind === 'avenue' && r.ref === 120 ? '#85827a' : '#8f8b80';
    {
      const a = [r.pts[0], r.pts[1]], b = [r.pts[r.pts.length - 2], r.pts[r.pts.length - 1]],      // a piece is a straight line sampled every 6 m: its end points are enough
      l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(l / SEG));
      for (let k = 0; k < n; k++) {
        const p0 = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n], p1 = [a[0] + (b[0] - a[0]) * (k + 1) / n, a[1] + (b[1] - a[1]) * (k + 1) / n], v = 0.94 + rng() * 0.12;
        const c = (hex) => { const n3 = parseInt(hex.slice(1), 16), f = (s) => Math.max(0, Math.min(255, Math.round(((n3 >> s) & 255) * v))); return '#' + [16, 8, 0].map((s) => f(s).toString(16).padStart(2, '0')).join(''); };
        quad(p0, p1, -hw, hw, Y, c(base));
        quad(p0, p1, -hw, -hw + 0.7, Y + 0.004, c('#a3a094')); quad(p0, p1, hw - 0.7, hw, Y + 0.004, c('#a3a094'));
      }
    }
  }
}
