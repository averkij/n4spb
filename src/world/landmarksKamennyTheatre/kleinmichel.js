// landmarksKamennyTheatre/kleinmichel.js - the KLEINMICHEL DACHA (Дом приёмов, OSM w60703051, 51 m W + 39 m S of the theatre; photos K01 K02 K05 K07 T09 T10), exterior only: the timber TOWER with its half-timbered lower
// stage, the fretwork gallery on brackets, the upper stage with a window band, the dark slate pyramid with four dormers and a spike; the glazed HALL with the pointed-arch lattice gable and the white bargeboards; the cream
// plaster houses with steep dark slate hip roofs (the east house with its crest railing, dormer and corner turret); the low street gallery.  The plot is a closed residence: the fence is in fence.js.
// Frame K: origin = the OSM centroid, +z = NNE (toward the theatre square, the street front), local +x to the right seen from the street.  Heights are [E] from the photos (the tower about 21 m to the tip of the spike).
import { K as KF, KP } from './frame.js';
import { Q } from './facade.js';
import { atlasPoly } from './util.js';
import { frustum } from './geo.js';

/** a roof face (planar polygon facing up / out) with a metre-scaled uv: the normal comes from the winding, flipped to point up */
function face(P, mat, pts, tile = 1) {
  const a = pts[0], b = pts[1], c = pts[pts.length - 1];
  let nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
  let ux = nz, uz = -nx; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;                // u: horizontal in the plane
  const vX = -nx * ny, vY = nx * nx + nz * nz, vZ = -nz * ny, vl = Math.hypot(vX, vY, vZ) || 1;  // v: up the slope
  P.fan(mat, pts, [nx, ny, nz], (p) => [((p[0] - a[0]) * ux + (p[2] - a[2]) * uz) / tile, ((p[0] - a[0]) * vX + (p[1] - a[1]) * vY + (p[2] - a[2]) * vZ) / vl / tile]);
}
/** a hip roof over the rectangle x0..x1 z0..z1 (eave level yE), ridge at yR along the longer side (a pyramid when square), overhang ov */
function hip(P, mat, x0, x1, z0, z1, yE, yR, ov = 0.5, tile = 1) {
  const ex0 = x0 - ov, ex1 = x1 + ov, ez0 = z0 - ov, ez1 = z1 + ov, cx = (ex0 + ex1) / 2, cz = (ez0 + ez1) / 2, w = ex1 - ex0, d = ez1 - ez0;
  if (w >= d) {
    const h = d / 2, r0 = [ex0 + h, yR, cz], r1 = [ex1 - h, yR, cz];
    face(P, mat, [[ex0, yE, ez1], [ex1, yE, ez1], r1, r0], tile); face(P, mat, [[ex1, yE, ez0], [ex0, yE, ez0], r0, r1], tile);
    face(P, mat, [[ex0, yE, ez0], [ex0, yE, ez1], r0], tile); face(P, mat, [[ex1, yE, ez1], [ex1, yE, ez0], r1], tile);
  } else {
    const h = w / 2, r0 = [cx, yR, ez0 + h], r1 = [cx, yR, ez1 - h];
    face(P, mat, [[ex1, yE, ez0], [ex1, yE, ez1], r1, r0], tile); face(P, mat, [[ex0, yE, ez1], [ex0, yE, ez0], r0, r1], tile);
    face(P, mat, [[ex0, yE, ez0], [ex1, yE, ez0], r0], tile); face(P, mat, [[ex1, yE, ez1], [ex0, yE, ez1], r1], tile);
  }
}

export async function build(K) {
  const { M, P, N } = K;
  P.push(KF.ox, 0, KF.oz, KF.rot); N.push(KF.ox, 0, KF.oz, KF.rot);
  const PL = M.plaster, TIM = M.timber, SL = M.slate, WH = M.white;
  const walls = (x0, x1, z0, z1, h, mat, tile = 3) => P.box(mat, x0, x1, 0, h, z0, z1, 'b', tile);
  /** a casement decal on a +z wall with white jambs and lintel (near detail) */
  const win = (cx, y0, h, z) => {
    Q(P, M.winTallD, [cx - 0.7, y0, z + 0.03], [cx + 0.7, y0, z + 0.03], [cx + 0.7, y0 + h, z + 0.03], [cx - 0.7, y0 + h, z + 0.03], [0, 0, 1]);
    N.box(WH, cx - 0.88, cx - 0.7, y0 - 0.1, y0 + h + 0.2, z, z + 0.1, '', 1); N.box(WH, cx + 0.7, cx + 0.88, y0 - 0.1, y0 + h + 0.2, z, z + 0.1, '', 1);
    N.box(WH, cx - 0.88, cx + 0.88, y0 + h, y0 + h + 0.2, z, z + 0.12, '', 1); N.box(WH, cx - 0.95, cx + 0.95, y0 - 0.2, y0 - 0.08, z, z + 0.16, '', 1);
  };

  /** a row of windows on an arbitrary wall: the wall point (x, z), outward normal (nx, nz); centres c[] along the wall (local +x), rows [y0, h] */
  const winRow = (x, z, nx, nz, cs, rows) => { P.push(x, 0, z, Math.atan2(nx, nz)); N.push(x, 0, z, Math.atan2(nx, nz)); for (const c of cs) for (const [y0, h] of rows) win(c, y0, h, 0); P.pop(); N.pop(); };

  // ------------------------------------------------------------------ the main house A (behind the tower), the low west wing, the street gallery
  walls(-6.5, 11.9, -15.4, 12.66, 6.8, PL);
  hip(P, SL, -6.5, 11.9, -15.4, 12.66, 6.8, 11.6, 0.6, 1.0);
  walls(11.9, 17.3, -15.4, 2.4, 6.0, PL);
  P.box(M.grey, 11.9, 17.3, 6.0, 6.15, -15.4, 2.4, 'b', 3);
  walls(-21.2, -17.0, -12.0, 12.8, 4.2, PL);
  hip(P, SL, -21.2, -17.0, -12.0, 12.8, 4.2, 6.6, 0.5, 1.0);
  walls(2.7, 11.9, 12.66, 15.67, 4.3, PL);
  hip(P, SL, 2.7, 11.9, 12.66, 15.67, 4.3, 5.9, 0.5, 1.0);
  P.box(M.granite, -6.5, 11.9, 0, 0.5, -15.45, 12.7, 'b', 1.8);
  for (let i = 0; i < 4; i++) win(4.2 + i * 2.2, 0.9, 2.6, 15.67);                      // the four casements of the street gallery
  P.box(WH, 2.6, 12.0, 4.0, 4.3, 12.66, 15.8, 'b', 2);                                     // the white cornice band of the gallery
  // windows of the visible walls: the west wing (x -21.2, normal -x: local x runs +mz), the south face of the main house (normal -z), the south / east faces of the east house, the east face of the gallery
  winRow(-21.2, -12.0, -1, 0, [2.5, 6.5, 10.5, 14.5, 18.5, 22.5], [[0.9, 2.5]]);
  winRow(11.9, -15.4, 0, -1, [2.6, 6.2, 9.8, 13.4, 17.0], [[0.9, 2.5], [3.9, 2.4]]);
  winRow(26.9, 11.4, 1, 0, [2.8, 6.4], [[0.9, 2.5], [4.2, 2.5]]);
  winRow(26.9, 2.3, 0, -1, [3.0, 6.8, 10.6, 14.4], [[0.9, 2.5], [4.2, 2.5]]);

  // ------------------------------------------------------------------ the east house C: cream plaster, a steep pyramid roof with a crest railing, a dormer, a corner turret
  walls(11.9, 26.9, 2.3, 11.4, 7.6, PL);
  P.box(WH, 11.8, 27.0, 7.4, 7.9, 2.2, 11.5, 'b', 2);
  hip(P, SL, 11.9, 26.9, 2.3, 11.4, 7.9, 16.2, 0.7, 1.0);
  P.box(M.iron, 18.0, 21.0, 16.1, 16.25, 6.5, 7.2, 'b', 1);
  for (let i = 0; i < 8; i++) { P.box(M.iron, 18.0 + i * 0.4, 18.06 + i * 0.4, 16.2, 17.0, 6.5, 6.56, '', 1); P.box(M.iron, 18.0 + i * 0.4, 18.06 + i * 0.4, 16.2, 17.0, 7.14, 7.2, '', 1); }
  for (let j = 0; j < 3; j++) for (const y0 of [0.9, 4.2]) win(15.6 + j * 4.5, y0, 2.5, 11.4);
  // the dormer on the street slope
  P.box(PL, 18.9, 20.6, 8.4, 10.6, 9.0, 10.3, 'b', 2);
  Q(P, M.winSmallD, [19.2, 8.9, 10.33], [20.3, 8.9, 10.33], [20.3, 10.2, 10.33], [19.2, 10.2, 10.33], [0, 0, 1]);
  face(P, SL, [[18.8, 10.6, 10.5], [20.7, 10.6, 10.5], [20.7, 10.6, 8.9], [18.8, 10.6, 8.9]], 1);
  face(P, SL, [[18.8, 10.6, 10.5], [20.7, 10.6, 10.5], [19.75, 11.8, 9.7]], 1);
  face(P, SL, [[18.8, 10.6, 8.9], [18.8, 10.6, 10.5], [19.75, 11.8, 9.7]], 1); face(P, SL, [[20.7, 10.6, 10.5], [20.7, 10.6, 8.9], [19.75, 11.8, 9.7]], 1);
  // the corner turret with a dark cone
  frustum(P, PL, 26.0, 10.6, 2.8, 9.2, 10, 1.4, 1.4, 0, 6, 3);
  frustum(P, SL, 26.0, 10.6, 9.2, 13.2, 10, 1.7, 0.0, 0, 5, 3);
  P.col(M.iron, 26.0, 10.6, 13.2, 14.6, 0.04, 0.0, 5);
  for (const [x, z] of [[14.0, 5.5], [-1.0, -6.0], [8.0, -10.0]]) { P.box(PL, x - 0.45, x + 0.45, 9.0, 12.4, z - 0.45, z + 0.45, 'b', 2); P.box(WH, x - 0.6, x + 0.6, 12.4, 12.7, z - 0.6, z + 0.6, 'b', 2); }   // white chimneys

  // ------------------------------------------------------------------ the glazed hall (street gable at z 13.3): timber walls, a slate roof, the pointed-arch lattice gable, white bargeboards
  {
    const x0 = -17.0, x1 = -7.0, z0 = -11.0, z1 = 13.3, yE = 6.0, yR = 11.0, cx = (x0 + x1) / 2, hw = 5.0;
    P.box(TIM, x0, x1, 0, yE, z0, z1, 'bf', 2.5);
    atlasPoly(P, M.gableHall, [[x0, 0.3], [x1, 0.3], [x1, yE], [cx, yR], [x0, yE]], z1 + 0.01);   // the gable face: pentagon with the glazed pointed arch (cell mapped over the bounding box)
    for (const s of [-1, 1]) {
      face(P, SL, [[cx + s * (hw + 0.6), yE - 0.35, z0 - 0.6], [cx + s * (hw + 0.6), yE - 0.35, z1 + 0.7], [cx, yR + 0.1, z1 + 0.7], [cx, yR + 0.1, z0 - 0.6]], 1.0);
      // the bargeboard on the street rake: a white strip
      P.quad(WH, [cx + s * (hw + 0.6), yE - 0.55, z1 + 0.72], [cx, yR - 0.15, z1 + 0.72], [cx, yR + 0.25, z1 + 0.72], [cx + s * (hw + 0.6), yE - 0.1, z1 + 0.72], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
    for (let i = 0; i < 6; i++) { const x = cx + (i - 2.5) * 1.5; N.box(WH, x - 0.07, x + 0.07, yE + 0.6, yE + 4.2 - Math.abs(i - 2.5) * 1.2, z1 + 0.2, z1 + 0.4, '', 1); }   // lattice struts under the gable
    P.box(WH, cx - 0.15, cx + 0.15, yR - 0.1, yR + 0.12, z0 - 0.6, z1 + 0.7, 'b', 1);
    P.col(M.iron, cx, z1 + 0.5, yR + 0.1, yR + 2.4, 0.04, 0.0, 5);
  }

  // ------------------------------------------------------------------ the TOWER (5 m square at mx 0.2, mz 13.2): half-timbered lower stage, gallery on brackets, window band, slate pyramid with dormers, spike
  {
    const { cx, cz, hw } = KP.tower, x0 = cx - hw, x1 = cx + hw, z0 = cz - hw, z1 = cz + hw, y1 = 6.4, y2 = 6.75, y3 = 10.9;
    P.box(TIM, x0, x1, 0, y1, z0, z1, 'b', 2.5);
    P.box(WH, x0 - 0.05, x1 + 0.05, 0, 0.4, z0 - 0.05, z1 + 0.05, 'b', 2);
    const g = hw + 0.95;                                                                  // gallery deck on brackets
    P.box(WH, cx - g, cx + g, y1, y2, cz - g, cz + g, '', 2);
    for (let i = 0; i < 6; i++) {
      const o = -g + 0.5 + i * (2 * g - 1.0) / 5;
      for (const [bx, bz, nx, nz] of [[cx + o, cz + hw, 0, 1], [cx + o, cz - hw, 0, -1], [cx + hw, cz + o, 1, 0], [cx - hw, cz + o, -1, 0]]) N.cyl(WH, [bx, y1 - 0.9, bz], [bx + nx * 0.9, y1, bz + nz * 0.9], 0.07, 0.07, 4, false);
    }
    for (const [ax, az, dx, dz, nx, nz] of [[cx - g, cz + g, 1, 0, 0, 1], [cx + g, cz + g, 0, -1, 1, 0], [cx + g, cz - g, -1, 0, 0, -1], [cx - g, cz - g, 0, 1, -1, 0]]) {   // the fretwork balustrade, four sides, 2 m cells
      const L = 2 * g, n = Math.round(L / 2.0), k = L / n;
      for (let i = 0; i < n; i++) {
        const a = [ax + dx * k * i, y2, az + dz * k * i], b = [ax + dx * k * (i + 1), y2, az + dz * k * (i + 1)];
        Q(N, M.fretBal, a, b, [b[0], y2 + 1.0, b[2]], [a[0], y2 + 1.0, a[2]], [nx, 0, nz]);
      }
      N.box(WH, Math.min(ax, ax + dx * L) - 0.07, Math.max(ax, ax + dx * L) + 0.07, y2 + 1.0, y2 + 1.1, Math.min(az, az + dz * L) - 0.07, Math.max(az, az + dz * L) + 0.07, '', 1);
    }
    const h2 = hw - 0.35;                                                                 // the upper stage
    P.box(TIM, cx - h2, cx + h2, y2, y3, cz - h2, cz + h2, 'b', 2.5);
    for (const [px, pz, nx, nz] of [[0, h2 + 0.03, 0, 1], [0, -h2 - 0.03, 0, -1], [h2 + 0.03, 0, 1, 0], [-h2 - 0.03, 0, -1, 0]]) {
      for (const o of [-1.1, 0, 1.1]) {
        const a = nx ? [cx + px, y2 + 1.4, cz + o - 0.4] : [cx + o - 0.4, y2 + 1.4, cz + pz], b = nx ? [cx + px, y2 + 1.4, cz + o + 0.4] : [cx + o + 0.4, y2 + 1.4, cz + pz];
        Q(N, M.winSmallD, a, b, [b[0], y2 + 3.0, b[2]], [a[0], y2 + 3.0, a[2]], [nx, 0, nz]);
      }
    }
    P.box(WH, cx - hw - 0.4, cx + hw + 0.4, y3, y3 + 0.22, cz - hw - 0.4, cz + hw + 0.4, '', 2);
    frustum(P, SL, cx, cz, y3 + 0.22, y3 + 6.2, 4, (hw + 0.4) * Math.SQRT2, 0.1, Math.PI / 4, 5, 6);   // the dark slate pyramid
    for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {                          // dormers on the four slopes
      const yb = y3 + 1.5, d = (hw + 0.4) * (1 - (yb - (y3 + 0.22)) / 6.0) + 0.05;
      N.push(cx + nx * d, yb, cz + nz * d, Math.atan2(nx, nz));
      N.box(WH, -0.5, 0.5, 0, 1.0, -0.4, 0.3, 'b', 1);
      Q(N, M.winSmallD, [-0.4, 0.15, 0.31], [0.4, 0.15, 0.31], [0.4, 0.9, 0.31], [-0.4, 0.9, 0.31], [0, 0, 1]);
      for (const s of [-1, 1]) face(N, SL, [[s * 0.6, 1.0, 0.35], [s * 0.6, 1.0, -0.5], [0, 1.65, -0.5], [0, 1.65, 0.35]], 1);
      N.pop();
    }
    P.col(M.iron, cx, cz, y3 + 6.1, y3 + 10.4, 0.05, 0.0, 5);
  }
  P.pop(); N.pop();
}
