// landmarksNewHolland/arch.js - THE ARCH OF NEW HOLLAND (Арка Новой Голландии, J.-B. Vallin de la Mothe 1779-87) over the South canal, in the arch frame of frame.js (x right, y up from the street, z out toward the Moika).
// Dossier docs/research/new-holland.md section 4 (photos 08 07 13 05 01 02 03 09 11 12): two brick pylons 11.8 m wide each carrying TWO grey granite 3/4 columns (shaft 2.4 m, 15.5 m, banded drums, Tuscan
// capitals), a heavy projecting entablature (grey architrave, brick frieze with three / five fluted tablets, cornice on modillions, brick attic), the semicircular opening 8.2 m wide (spring 10.65 m,
// crown 14.75 m) with a pale limestone archivolt, keystone and two swag horns, a slender jamb column under each impost, roundels and blind niches on the pylon fronts; the north (Kovsh) face is plainer:
// tall blind niches, the same opening, jamb columns.  Height 22.9 m.  The pylons are the abutting ends of the warehouses N (west) and O (east).
import { ARCH, archW } from './frame.js';
import * as G from './geo.js';

export function build(K) {
  const { ctx, M, P, svc } = K, ph = ctx.physics;
  const HP = 0.9, SPRING = 10.65, RS = 4.1, XJ = RS, XO = RS + ARCH.pylon, D = ARCH.depth;   // base top, spring line, half span, jamb x, outer x, depth
  const Y = { shaft1: 16.4, cap: 17.1, arch: 18.0, frieze: 19.8, corn: 21.1, attic: 22.6, top: 22.9 };
  const place = (fn) => { P.push(ARCH.x, 0, ARCH.z, ARCH.rot); try { fn(); } finally { P.pop(); } };
  const wq = (mat, x0, x1, y0, y1, z, t = 2) => P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], [[x0 / t, y0 / t], [x1 / t, y0 / t], [x1 / t, y1 / t], [x0 / t, y1 / t]]);
  const wqb = (mat, x0, x1, y0, y1, z, t = 2) => P.quad(mat, [x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], [0, 0, -1], [[x1 / t, y0 / t], [x0 / t, y0 / t], [x0 / t, y1 / t], [x1 / t, y1 / t]]);
  const B = (mat, x0, x1, y0, y1, z0, z1, skip = '', t = 2) => G.tbox(P, mat, x0, x1, y0, y1, z0, z1, t, t, skip);

  place(() => {
    for (const s of [-1, 1]) {
      const xi = s * XJ, xo = s * XO, xa = Math.min(xi, xo), xb = Math.max(xi, xo), xm = s * (XJ + XO) / 2;
      // ---------------- base: rock-faced granite course under the pylon, stepped out in front (top 0.9 m, front face z = +1.9)
      B(M.quay, xa, xb, -0.3, HP, -D, 1.9, 'bk', 2.5);
      P.box(M.quayCoping, xa - 0.05, xb + 0.05, HP - 0.01, HP + 0.12, -D + 0.05, 1.95, 'b', 1);
      // ---------------- pylon wall (brick), front plane z = 0, back plane z = -D, outer side
      wq(M.brick, xa, xb, HP, Y.attic, 0, 2);
      wqb(M.brick, xa, xb, HP, Y.attic, -D, 2);
      P.quad(M.brick, [xo, HP, 0], [xo, HP, -D], [xo, Y.attic, -D], [xo, Y.attic, 0], [s, 0, 0], [[0, 0], [D / 2, 0], [D / 2, 10], [0, 10]]);
      P.quad(M.brick, [xi, HP, -D], [xi, HP, 0], [xi, Y.attic, 0], [xi, Y.attic, -D], [-s, 0, 0], [[0, 0], [D / 2, 0], [D / 2, 10], [0, 10]]);   // passage jamb (brick)
      P.quad(M.quay, [xi, -3.4, -D], [xi, -3.4, 0], [xi, HP, 0], [xi, HP, -D], [-s, 0, 0], [[0, 0], [D / 2.5, 0], [D / 2.5, 1.7], [0, 1.7]]);        // passage jamb (granite, to the water)
      // ---------------- two big columns, banded granite, Tuscan capitals
      for (const cu of [3.2, 8.4]) {
        const cx = s * (XO - cu), cz = 0.55;
        G.tube(P, M.column, cx, cz, HP, 8.2, 1.2, 1.2, 24, 3, 7.3);
        G.tube(P, M.column, cx, cz, 8.2, Y.shaft1, 1.2, 1.08, 24, 3, 8.2);
        G.tube(P, M.graniteStone, cx, cz, Y.shaft1, Y.shaft1 + 0.3, 1.08, 1.4, 24, 3, 1, { capTop: M.graniteStone });
        B(M.graniteStone, cx - 1.55, cx + 1.55, Y.shaft1 + 0.3, Y.cap, cz - 1.55, cz + 1.55, 'b', 2);
        P.box(M.graniteStone, cx - 1.45, cx + 1.45, HP, HP + 0.35, cz - 1.45, cz + 1.45, 'b', 1);                  // the foot of the column
        ph.addCylinder(archW(cx, cz).x, archW(cx, cz).z, 1.25, 0, 18);
      }
      // ---------------- entablature: architrave block over the columns, brick frieze with fluted tablets, cornice on modillions, brick attic with a coping
      B(M.graniteStone, xa - 0.15, xb + 0.15, Y.cap, Y.arch, -0.3, 2.3, 'b', 2);
      wq(M.brick, xa, xb, Y.arch, Y.frieze, 0.02, 2);
      for (let k = 0; k < 3; k++) {
        const tx = s > 0 ? xb - 1.9 - k * 3.3 : xa + 1.9 + k * 3.3;
        B(M.graniteStone, tx - 0.6, tx + 0.6, 18.15, 19.65, 0.0, 0.14, 'bk', 1);
        for (const f of [-0.28, 0, 0.28]) P.box(M.iron, tx + f - 0.04, tx + f + 0.04, 18.3, 19.5, 0.14, 0.16, 'bk', 1);
      }
      B(M.graniteStone, xa - 0.9, xb + 0.9, Y.frieze, Y.corn, -0.6, 3.4, 'b', 2);                                // heavy cornice, wraps the outer end
      for (let x = xa - 0.4; x <= xb + 0.4; x += 1.25) P.box(M.graniteStone, x - 0.25, x + 0.25, Y.frieze - 0.4, Y.frieze, 2.7, 3.2, 'b', 1);   // modillion row (front)
      B(M.brick, xa - 0.2, xb + 0.2, Y.corn, Y.attic, -D, 0.6, 'b', 2);
      B(M.graniteStone, xa - 0.45, xb + 0.45, Y.attic, Y.top, -D - 0.25, 0.85, 'b', 2);
      // ---------------- roundel between the columns and a blind niche below it, string course
      const rx = s * (XO - 5.8);
      P.cyl(M.ringShade, [rx, 12.9, 0], [rx, 12.9, 0.12], 1.3, 1.3, 20, true);
      P.cyl(M.graniteStone, [rx, 12.9, 0.12], [rx, 12.9, 0.2], 0.95, 0.95, 20, true);
      G.planeShape(P, M.brickDark, G.archPts(rx, 2.7, 1.8, 3.7, 10), 0.03);
      G.frameRing(P, M.limestone, G.archPts(rx, 2.6, 2.1, 3.9, 10), G.archPts(rx, 2.7, 1.8, 3.7, 10), 0.0, 0.1, 1);
      B(M.graniteStone, xa, xb, 7.4, 7.8, 0, 0.3, 'bk', 2);
      // ---------------- the north (Kovsh) face: tall blind niche, jamb column, simple cornice
      P.push(xm, 0, -D, Math.PI); G.planeShape(P, M.brickDark, G.archPts(0, 2.4, 2.6, 8.6, 10), 0.03); G.frameRing(P, M.limestone, G.archPts(0, 2.3, 3.0, 8.9, 10), G.archPts(0, 2.4, 2.6, 8.6, 10), 0.0, 0.12, 1); P.pop();
      B(M.graniteStone, xa - 0.1, xb + 0.1, 20.4, Y.corn, -D - 0.55, -D + 0.2, 'b', 2);
      // ---------------- jamb column under the impost (south face and north face)
      G.tube(P, M.column, s * (XJ + 0.55), 0.35, HP, SPRING - 0.55, 0.62, 0.55, 16, 2, 9.2);
      G.tube(P, M.column, s * (XJ + 0.55), -D - 0.35, HP, SPRING - 0.55, 0.62, 0.55, 16, 2, 9.2);
      B(M.graniteStone, s > 0 ? XJ - 0.1 : -XJ - 1.45, s > 0 ? XJ + 1.45 : -XJ + 0.1, SPRING - 0.55, SPRING + 0.1, -0.2, 1.1, 'b', 1);
      B(M.graniteStone, s > 0 ? XJ - 0.1 : -XJ - 1.45, s > 0 ? XJ + 1.45 : -XJ + 0.1, SPRING - 0.55, SPRING + 0.1, -D - 1.1, -D + 0.2, 'b', 1);
      // pylon collider (the warehouses N / O carry their own walls)
      const c = archW(xm, -D / 2);
      ph.addBox(c.x, c.z, ARCH.pylon, D, ARCH.rot, 0, 23);
      const cb = archW(xm, 0.95); ph.addBox(cb.x, cb.z, ARCH.pylon + 0.3, 1.9, ARCH.rot, 0, HP);
    }
    // ---------------- the central block over the span: front shape (the semicircle cut out), soffit barrel, back shape, entablature
    const shp = (zf) => {
      const s = new K.THREE.Shape();
      s.moveTo(-RS, SPRING); s.lineTo(-RS, Y.corn); s.lineTo(RS, Y.corn); s.lineTo(RS, SPRING); s.absarc(0, SPRING, RS, 0, Math.PI, false); return s;
    };
    P.face(M.brick, shp(), 0, 2, 20);
    P.push(0, 0, -D, Math.PI); P.face(M.brick, shp(), 0, 2, 20); P.pop();
    P.quad(M.brick, [-RS, Y.corn, 0], [RS, Y.corn, 0], [RS, Y.corn, -D], [-RS, Y.corn, -D], [0, 1, 0], [[0, 0], [4, 0], [4, 3], [0, 3]]);
    const ns = 20;
    for (let k = 0; k < ns; k++) {                                                                          // the barrel of the passage (brick)
      const a0 = Math.PI - k * Math.PI / ns, a1 = Math.PI - (k + 1) * Math.PI / ns, am = (a0 + a1) / 2;
      const q = (a, z) => [Math.cos(a) * RS, SPRING + Math.sin(a) * RS, z];
      P.quad(M.brick, q(a0, 0), q(a1, 0), q(a1, -D), q(a0, -D), [-Math.cos(am), -Math.sin(am), 0], [[0, 0], [0.5, 0], [0.5, D / 2], [0, D / 2]]);
    }
    // central entablature: stone band at the architrave line, brick frieze with FIVE tablets, cornice
    B(M.graniteStone, -RS, RS, Y.cap, Y.arch, -0.3, 0.45, 'b', 2);
    wq(M.brick, -RS, RS, Y.arch, Y.frieze, 0.02, 2);
    for (let k = 0; k < 5; k++) {
      const tx = -3.2 + k * 1.6;
      B(M.graniteStone, tx - 0.5, tx + 0.5, 18.15, 19.65, 0, 0.14, 'bk', 1);
      for (const f of [-0.24, 0, 0.24]) P.box(M.iron, tx + f - 0.035, tx + f + 0.035, 18.3, 19.5, 0.14, 0.16, 'bk', 1);
    }
    B(M.graniteStone, -RS - 0.1, RS + 0.1, Y.frieze, Y.corn, -0.6, 1.6, 'b', 2);
    for (let x = -RS + 0.3; x <= RS - 0.2; x += 1.25) P.box(M.graniteStone, x - 0.25, x + 0.25, Y.frieze - 0.35, Y.frieze, 1.0, 1.5, 'b', 1);
    B(M.graniteStone, -RS - 0.1, RS + 0.1, Y.corn, 21.45, -D - 0.2, 1.7, 'b', 2);
    // ---------------- archivolt: limestone voussoir ring, keystone, swag horns (front); a plain flush ring on the north face
    const nv = 22, ri = RS, ro = RS + 1.15;
    for (let k = 0; k < nv; k++) {
      const a0 = Math.PI - k * Math.PI / nv, a1 = Math.PI - (k + 1) * Math.PI / nv, m = k % 2 ? M.ring : M.ringShade;
      const q = (a, rr, z) => [Math.cos(a) * rr, SPRING + Math.sin(a) * rr, z];
      P.quad(m, q(a0, ri, 0.14), q(a1, ri, 0.14), q(a1, ro, 0.14), q(a0, ro, 0.14), [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.quad(m, q(a0, ro, 0.14), q(a1, ro, 0.14), q(a1, ro, 0), q(a0, ro, 0), [Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2), 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.quad(m, q(a1, ri, -D), q(a0, ri, -D), q(a0, ro, -D), q(a1, ro, -D), [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
    B(M.ring, -0.55, 0.55, SPRING + RS - 0.15, SPRING + RS + 1.75, 0, 0.35, 'bk', 1);
    for (const s of [-1, 1]) {                                                                              // swag horns: crescents hugging the extrados, tapering to a point
      const pts = [];
      for (let i = 0; i <= 8; i++) { const t = i / 8, a = (Math.PI / 2 + s * 0.12 + s * t * 0.95), rr = ro + 0.25 + 1.5 * (1 - t) * (0.7 + 0.3 * Math.sin(t * 3)); pts.push([Math.cos(a) * rr, SPRING + Math.sin(a) * rr, 0.16]); }
      for (let i = 8; i >= 0; i--) { const t = i / 8, a = (Math.PI / 2 + s * 0.12 + s * t * 0.95), rr = ro + 0.25; pts.push([Math.cos(a) * rr, SPRING + Math.sin(a) * rr, 0.16]); }
      P.fan(M.ring, pts, [0, 0, 1]);
    }
    // water-level tide mark and the canal walls inside the passage are drawn by water.js (quay walls along the South canal)
    svc.arch = { x: ARCH.x, z: ARCH.z, rot: ARCH.rot, d: ARCH.d, n: ARCH.n, h: Y.top };
    svc.monuments.push({ id: 'w128981839', name: 'Арка Новой Голландии', x: ARCH.x, z: ARCH.z, h: Y.top });
    const ph0 = archW(0, 16);
    svc.photoSpots.push({ x: ph0.x, z: ph0.z, yaw: Math.round(Math.atan2(ARCH.n[0], ARCH.n[1]) * 180 / Math.PI), pitch: 8, name: 'Арка Новой Голландии' });
  });
}
