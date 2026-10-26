// landmarksAcademy/court.js - the ROUND COURT of the Academy (closed to the public; seen from the roofs and from the air): docs/research/academy.md 3.6.
//   floor: a 20-gon of circumradius 27.43 m (inner diameter 54.9) of diagonal diamond lattice of light slab bands on granite, a central circle of dark setts (r 13 m), the bronze disc of the
//   Shuvalov monument (diameter 12 m, 0.6 m high) with the seated figure (sculpt.js), ten black post lamps with white globes round the arcade, a low clipped bed at the foot of the wall.
//   The court wall itself (a 3-tier curved wall of 20 flat bays) is drawn by academy.js with the bay tile `court`.
import { ACAD, HOLES } from './frame.js';
import { ring } from './court-ring.js';

export async function build(K) {
  const { P, M } = K;
  const hole = HOLES.find((h) => h.kind === 'round');
  const pts = hole ? hole.ring : ring(20, 27.43);
  P.push(ACAD.x, 0, ACAD.z, ACAD.rot);
  try {
    P.cap(M.diamond, pts, 0.06, true, 3.2);
    const c13 = Array.from({ length: 48 }, (_, i) => [Math.cos(i / 48 * Math.PI * 2) * 13, Math.sin(i / 48 * Math.PI * 2) * 13]);
    P.cap(M.cobble, c13, 0.075, true, 4);
    P.cyl(M.bronzeDisc, [0, 0.075, 0], [0, 0.62, 0], 6.0, 6.0, 40, true);
    for (let i = 0; i < 10; i++) {                                           // post lamps
      const a = (i + 0.5) / 10 * Math.PI * 2, x = Math.cos(a) * 24.6, z = Math.sin(a) * 24.6;
      P.cyl(M.lamp, [x, 0.06, z], [x, 3.0, z], 0.07, 0.05, 8, false); P.cyl(M.lamp, [x, 0.06, z], [x, 0.4, z], 0.16, 0.1, 8, true); P.cyl(M.globe, [x, 3.0, z], [x, 3.4, z], 0.22, 0.22, 8, true);
    }
    for (let i = 0; i < 20; i++) {                                           // the low bed along the wall
      const a0 = i / 20 * Math.PI * 2, a1 = (i + 1) / 20 * Math.PI * 2, r0 = 26.0, r1 = 27.0;
      P.quad(M.lawn, [Math.cos(a0) * r0, 0.5, Math.sin(a0) * r0], [Math.cos(a1) * r0, 0.5, Math.sin(a1) * r0], [Math.cos(a1) * r1, 0.5, Math.sin(a1) * r1], [Math.cos(a0) * r1, 0.5, Math.sin(a0) * r1], [0, 1, 0]);
      P.quad(M.lawn, [Math.cos(a0) * r0, 0.06, Math.sin(a0) * r0], [Math.cos(a1) * r0, 0.06, Math.sin(a1) * r0], [Math.cos(a1) * r0, 0.5, Math.sin(a1) * r0], [Math.cos(a0) * r0, 0.5, Math.sin(a0) * r0], [-Math.cos((a0 + a1) / 2), 0, -Math.sin((a0 + a1) / 2)]);
    }
    try { const s = await import('./sculpt.js'); if (s.shuvalov) s.shuvalov(K, -2.0, 1.4); } catch (err) { console.warn('[landmarksAcademy] shuvalov', err.message); }
  } finally { P.pop(); }
}
