// landmarksKirova/ermir.js - «МИР В КРЕСТЕ» (Mondo in croce), Gianmaria Potenza, bronze (lost wax), 2013, the symbol of the Erarta museum in front of the main entrance
// (docs/research/erarta-detail.md 2.3; photo refs/erarta-detail/c01_potenza_mondo_in_croce.jpg, 1440 px, full frontal with the stair behind).
// A disc of 2.0 m diameter and 0.45 m thickness standing on edge on a square block of copper-brown bronze with a green-patinated top (1.8 x 0.55 x 1.8 m), turned ~28 degrees from the facade so that its
// decorated face looks to the left (south) seen from the street.  LEFT half: dark bronze with 11 registers: thin gold bars between rows of small polished-gold inserts (squares, rods, discs, triangles);
// RIGHT half: a second, thicker slab behind with FINE VERTICAL RIBS (vertex-colour stripes), a polished gold band 0.12 m wide along the cut and one gold hexagon stud.
// Everything is flat-colour geometry of the flat base (no new kind): ~90 chips as little boxes.  Position (q', r') of the module frame FE; the OSM node lies 6-9 m further out (the mapper's guess).
import * as THREE from 'three';
import { FE } from './frame.js';

const BRONZE = '#2f2a25', BRONZE2 = '#3a322a', GOLD = '#d6a63a', GOLD_HI = '#f0c850', BLOCK = '#7a5c3e', BLOCK_TOP = '#6a7a5a', RIB_A = '#211c19', RIB_B = '#4a4036';
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** the disc in its own frame: axis z (the decorated face toward +z), centre at the origin, radius 1.0 */
function disc(P, M) {
  const R = 1.0, T = 0.45, seg = 40, zf = T / 2;
  const bronze = M.col(BRONZE), bronze2 = M.col(BRONZE2), gold = M.col(GOLD), goldHi = M.col(GOLD_HI), ribA = M.col(RIB_A), ribB = M.col(RIB_B);
  // Rim and rear only. A full front cap would cover the recessed ribs and stud:
  // the former cylinder cap hid the entire right-hand relief at close range.
  P.cyl(bronze, [0, 0, -zf], [0, 0, zf], R, R, seg, false);
  const rear = Array.from({ length: seg }, (_, i) => { const a = i / seg * Math.PI * 2; return [R * Math.cos(a), R * Math.sin(a), -zf]; });
  P.fan(bronze, rear, [0, 0, -1]);
  // the left face is slightly proud: a second disc plate 0.04 in front of the right half's slab (the right half is recessed behind the cut)
  const cut = 0.12;                                                                         // x of the cut
  const ac = Math.acos(cut / R), left = [];
  for (let i = 0; i <= seg; i++) { const a = ac + (Math.PI * 2 - 2 * ac) * i / seg; left.push([R * Math.cos(a), R * Math.sin(a), zf]); }
  P.fan(bronze, left, [0, 0, 1]);
  // right half: recessed slab with fine vertical ribs, drawn as 36 vertical stripes of two bronzes on a plane 0.05 behind the face of the left half
  const zr = zf - 0.07, n = 64, xr0 = cut, xr1 = R;
  for (let i = 0; i < n; i++) {
    const x0 = xr0 + (xr1 - xr0) * i / n, x1 = xr0 + (xr1 - xr0) * (i + 1) / n, h0 = Math.sqrt(Math.max(0, R * R - x0 * x0)), h1 = Math.sqrt(Math.max(0, R * R - x1 * x1));
    const m = i % 2 ? ribB : ribA;
    P.quad(m, [x0, -h0, zr], [x1, -h1, zr], [x1, h1, zr], [x0, h0, zr], [0, 0, 1]);
    // Close the exposed ledge from the recessed face to the outer cylinder rim.
    for (const sign of [-1, 1]) P.quad(bronze2, [x0, sign * h0, zr], [x1, sign * h1, zr], [x1, sign * h1, zf], [x0, sign * h0, zf], [x0 + x1, sign * (h0 + h1), 0]);
  }
  // the cut: the step between the left face and the recessed right half, as a dark wall with the gold band on top of it
  const steps = 18;
  for (let i = 0; i < steps; i++) {
    const y0 = -R + 2 * R * i / steps, y1 = -R + 2 * R * (i + 1) / steps, hx0 = cut + 0.10 * (1 - Math.sqrt(Math.max(0, 1 - y0 * y0))), hx1 = cut + 0.10 * (1 - Math.sqrt(Math.max(0, 1 - y1 * y1)));
    if (Math.abs(y0) < 0.995) P.quad(goldHi, [hx0, y0, zf + 0.012], [hx0 + 0.12, y0, zf + 0.012], [hx1 + 0.12, y1, zf + 0.012], [hx1, y1, zf + 0.012], [0, 0, 1]);     // the polished gold band, 0.12 m wide, on the left plate's edge
    P.quad(bronze2, [hx0, y0, zr], [hx0, y0, zf], [hx1, y1, zf], [hx1, y1, zr], [-1, 0, 0]);
  }
  // left face: the registers
  const rows = 13, y0 = -0.88, dy = 1.76 / (rows - 1);
  for (let r = 0; r < rows; r++) {
    const y = y0 + dy * r, half = Math.sqrt(Math.max(0, R * R - y * y)) - 0.08, xa = -half, xb = Math.min(cut - 0.03, half);
    if (r % 2 === 1 || r % 4 === 0) P.box(gold, xa, xb, y + dy * 0.5 - 0.008, y + dy * 0.5 + 0.008, zf, zf + 0.02, 'kb', 1);      // a thin gold bar between two registers
    const kind = r % 4, n = Math.floor((xb - xa) / 0.085);
    for (let i = 0; i < n; i++) {
      const x = xa + 0.05 + (xb - xa - 0.1) * (i + 0.5) / n, h = hash(r * 17 + i * 3.1), s = 0.02 + 0.016 * (kind === 1 ? 0.5 : h);
      if (h < 0.12) continue;                                                              // a gap now and then
      const m = h > 0.6 ? goldHi : gold;
      if (kind === 2) P.cyl(m, [x, y, zf], [x, y, zf + 0.025], s * 0.8, s * 0.8, 8, true);                                       // a polished disc
      else if (kind === 3) P.box(m, x - s * 0.45, x + s * 0.45, y - s * 1.7, y + s * 1.7, zf, zf + 0.025, 'kb', 1);                 // a short rod
      else P.box(m, x - s, x + s, y - s, y + s, zf, zf + 0.025, 'kb', 1);                                                         // a square
    }
  }
  // one gold hexagon stud on the right half
  P.cyl(goldHi, [0.74, -0.12, zr], [0.74, -0.12, zr + 0.03], 0.075, 0.075, 6, true);
}

export function build(K, q = -0.5, r = 11.0) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const y0 = 0.1;                                                                           // the block stands on the paving (its foot 10 cm into it)
  FE.push(P);
  P.push(q, 0, r, -0.49);                                                                   // turned about 28 degrees: the decorated face looks to the left (south)
  P.box(M.col(BLOCK), -0.9, 0.9, 0, 0.55, -0.9, 0.9, 'b', 1);
  P.box(M.col(BLOCK_TOP), -0.88, 0.88, 0.55, 0.57, -0.88, 0.88, 'b', 1);
  P.push(0, 0.57 + 1.0, 0, 0); disc(P, M); P.pop();
  P.pop(); P.pop();
  void y0;
  const p = FE.W(q, r);
  ph.addCylinder(p.x, p.z, 1.15, 0, 3.0);
  K.svc.monuments.push({ id: 'n6285032864', name: 'Мир в кресте', x: p.x, z: p.z, h: 2.7 });
  K.svc.crowd.push({ id: 'erarta-mir', kind: 'photo', x: FE.W(q, r + 4).x, z: FE.W(q, r + 4).z, r: 4, n: 3 });
}
