// landmarksYelaginRossi/guard.js - the GUARDHOUSE SITE (Павильон «Гауптвахта», K. I. Rossi 1822; OSM w100822197 building=ruins).  The pavilion burnt in 1828 (rebuilt by L. Charlemagne) and again in 1996 and
// is NOT standing: the plot is a cleared patch of bare earth beside the park alley, closed to the alley by a printed HOARDING of a low gable shape that shows the lost pavilion and its history (photo rossi 16,
// text read from the photo; the painting rossi 17 shows the original: white square pavilion with an arcade).  Nothing is drawn standing on the plot.
// The hoarding stands along the long EAST edge of the plot (18 m, toward the alley w222212068), on two posts and a middle post, a dark frame along the slanted top edges.
import { GUARD } from './frame.js';

export function guard(ctx, P, M, svc) {
  P.far = 700;
  const ring = GUARD.ring;
  P.cap(M.earth, ring, 0.035, true, 3);
  // the east edge: from the south-east corner (-4562.6,-5005.1) to the north-east corner (-4559.6,-5022.9)
  const a = ring[2], b = ring[1];
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, nx = -uz, nz = ux;          // (nx, nz): to the east (toward the alley)
  const off = 0.6, y0 = 0.3, hPeak = 3.0, tPeak = 0.58;
  const A = [a[0] + nx * off, a[1] + nz * off], B = [b[0] + nx * off, b[1] + nz * off], Cx = A[0] + ux * len * tPeak, Cz = A[1] + uz * len * tPeak;
  // the banner (single-sided face toward the alley, a grey back)
  P.fan(M.hoarding, [[A[0], y0, A[1]], [B[0], y0, B[1]], [Cx, y0 + hPeak, Cz]], [nx, 0, nz], (p) => { const t = ((p[0] - A[0]) * ux + (p[2] - A[1]) * uz) / len; return [t, (p[1] - y0) / hPeak]; });
  P.fan(M.stuccoGrey, [[A[0] - nx * 0.04, y0, A[1] - nz * 0.04], [B[0] - nx * 0.04, y0, B[1] - nz * 0.04], [Cx - nx * 0.04, y0 + hPeak, Cz - nz * 0.04]], [-nx, 0, -nz]);
  // the frame: a dark beam along the three edges, posts under the banner
  P.beam(M.dark, [[A[0], y0, A[1]], [Cx, y0 + hPeak, Cz], [B[0], y0, B[1]], [A[0], y0, A[1]]], 0.1, 0.08, null, 1);
  const hAt = (t) => (t <= tPeak ? hPeak * t / tPeak : hPeak * (1 - t) / (1 - tPeak));
  for (const t of [0.02, 0.3, tPeak, 0.9]) { const x = A[0] + ux * len * t, z = A[1] + uz * len * t; P.box(M.dark, x - 0.07 - nx * 0.1, x + 0.07 - nx * 0.1, 0, y0 + Math.max(0.1, hAt(t)) - 0.02, z - 0.07 - nz * 0.1, z + 0.07 - nz * 0.1, 'b', 1); }
  const ph = ctx.physics;
  if (ph) ph.addBox((A[0] + B[0]) / 2 - nx * 0.05, (A[1] + B[1]) / 2 - nz * 0.05, 0.3, len, Math.atan2(ux, uz), 0, 3.2);
  svc.monuments.push({ id: GUARD.id, name: 'Место Гауптвахты (К. И. Росси, 1822; сгорела в 1996 г.)', x: (ring[0][0] + ring[2][0]) / 2, z: (ring[0][1] + ring[2][1]) / 2, h: 3.0 });
}
