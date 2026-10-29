// landmarksSredny/geolPortico.js - the central block of the Geological Committee (frame G: X along the prospect to the ENE, Z toward the SSE into the block, front toward -Z; dossier sections 4.3 / 4.4):
//   portico   the six giant unfluted columns d 1.25 m (shaft 8.4 m, base 0.2, capital 1.1 m, top +15.0) at X = 60.75 +- 2 / 7 / 11.5 on pedestals (a grey granite lower block 1.9 m, a limestone block above, top +5.3 m) on the
//             stylobate / platform (+1.9 m), the entablature (frieze 0.9 m + modillioned cornice, top +16.2 m), the loggia back wall at Z = 4.5 with the three arched oak doors 1.9 x 4.7 m (pitch 4.0 m), two flank
//             windows over stone balustrades and five arched floor-2 windows, two dark plaques on the pedestals between the doors;
//   stair     9 risers (0.21 x 0.30 m, pale granite) X 54.25 .. 67.25 (13.0 m), Z -4.0 .. -1.3, granite cheek walls 3.0 m wide and 1.9 m high with a lamp standard on each (pale blue-grey, four globes);
//   upper     two pylons (X 48.8 .. 54.85 / 66.65 .. 72.7) with one window each, the recessed terrace at +16.2 with the white balustrade and three windows, the attic block with the lettering
//             «ГЕОЛОГИЧЕСКИЙ КОМИТЕТЪ 1882 г.» (cap heights 0.8 / 0.75 / 0.4 m), top +24.9;  the dome: a low elliptical vault of grey-green sheet 24 x 20 m (+2.5), a glazed hip (+1.45) and a black lantern box 6 x 6 m with a railing, top about +29.5 m.
// The central block rises above the wings (20.3 m): its side walls from 20.3 to 24.9 are drawn here as well.
import { wallFace, rectC, archC, rectOutline, cornice, band, bandPoly, roofFrustum } from './wall.js';
import { revolve, tbox, shapeOf } from './geo.js';
import { wallRows, GH } from './geolWall.js';
import { FR } from './frame.js';
import * as THREE from 'three';

export const XC = 60.75, X0 = 48.8, X1 = 72.7, PLAT = 1.9;
export const COLX = [-11.5, -7, -2, 2, 7, 11.5].map((d) => XC + d), DOORX = [-4, 0, 4].map((d) => XC + d);
export const ST = { x0: 54.25, x1: 67.25, z0: -3.2, z1: -1.0, n: 9, rise: 0.21, cheek: 3.0 };     // the bottom step 1.2 m from the asphalt edge (Z -4.4): a lane stays open for the pavement
export const LAMPS = [[52.75, -2.2], [68.75, -2.2]];

/** run fn in the wall frame of a wall that faces -Z, whose right end seen from outside is at X = xlo and whose left end is at X = xhi, at depth Z (local x = xhi - X) */
export const onFront = (P, xhi, z, fn) => { P.push(xhi, 0, z, Math.PI); try { return fn(); } finally { P.pop(); } };
/** wall frame of a wall that faces +X (east flank): the left end seen from outside is at Z = zl (the larger Z), local x runs toward -Z */
export const onEast = (P, x, zl, fn) => { P.push(x, 0, zl, Math.PI / 2); try { return fn(); } finally { P.pop(); } };
/** wall frame facing -X (west flank): the left end is at Z = zl (the smaller Z), local x runs toward +Z */
export const onWest = (P, x, zl, fn) => { P.push(x, 0, zl, -Math.PI / 2); try { return fn(); } finally { P.pop(); } };

/** the column: base moulding, a shaft with slight entasis and diminution, an echinus + abacus capital (profile [r, y] from y = 0) */
export function columnProfile(shaft = 8.4) {
  const r0 = 0.64, y0 = 0.2, cap = 1.1;
  return [[0, 0], [0.74, 0], [0.74, 0.08], [0.68, 0.14], [r0, y0], [r0 + 0.01, y0 + shaft * 0.3], [r0 + 0.012, y0 + shaft * 0.55], [0.6, y0 + shaft * 0.85], [0.55, y0 + shaft],
    [0.56, y0 + shaft + 0.06], [0.7, y0 + shaft + 0.38], [0.8, y0 + shaft + 0.62], [0.86, y0 + shaft + 0.74], [0.9, y0 + shaft + 0.76], [0.9, y0 + shaft + cap], [0, y0 + shaft + cap]];
}
export function column(P, M, x, z, y) {
  P.push(0, y, 0, 0);
  try { revolve(P, M.doloFlat, columnProfile(), 20, { cx: x, cz: z, uRep: 4, vTile: 4, crease: 50 }); } finally { P.pop(); }
}
/** the cast-iron lamp standard of the stair (pale blue-grey, a fluted shaft, a ring of four clear globes on curved arms), base at (x, y, z) */
export function lampStandard(P, M, x, y, z) {
  P.cyl(M.lamp, [x, y, z], [x, y + 0.5, z], 0.2, 0.15, 12, true);
  P.cyl(M.lamp, [x, y + 0.5, z], [x, y + 3.5, z], 0.1, 0.06, 10, false);
  P.cyl(M.lamp, [x, y + 3.5, z], [x, y + 3.62, z], 0.16, 0.16, 12, true);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4, dx = Math.cos(a), dz = Math.sin(a);
    P.cyl(M.lamp, [x, y + 3.5, z], [x + dx * 0.36, y + 3.74, z + dz * 0.36], 0.025, 0.025, 5, false);
    const g = new THREE.SphereGeometry(0.17, 10, 7); P.geo(M.globe, g, x + dx * 0.4, y + 3.78, z + dz * 0.4); g.dispose();
    P.cyl(M.lamp, [x + dx * 0.4, y + 3.95, z + dz * 0.4], [x + dx * 0.4, y + 4.02, z + dz * 0.4], 0.1, 0.03, 8, true);
  }
}

export function portico(K) {
  const { P, M, ctx } = K, ph = ctx.physics, G = FR.G, labels = ctx.services.labels, W = X1 - X0;
  const gt = (m, x0, x1, y0, y1, z0, z1, skip) => tbox(P, m, x0, x1, y0, y1, z0, z1, 3.6, 1.8, skip);
  // ---- stylobate + platform (+1.9), the stair, the cheek walls
  gt(M.granRust, X0, X1, 0, PLAT, 0, 4.5, 'tb');
  P.quad(M.granLight, [X0, PLAT, 0], [X1, PLAT, 0], [X1, PLAT, 4.5], [X0, PLAT, 4.5], [0, 1, 0], [[X0 / 2.4, 0], [X1 / 2.4, 0], [X1 / 2.4, 4.5 / 2.4], [X0 / 2.4, 4.5 / 2.4]]);
  const run = (ST.z1 - ST.z0) / ST.n;
  for (let k = 0; k < ST.n; k++) {
    const za = ST.z0 + k * run, zb = za + run, ya = (k + 1) * ST.rise;
    tbox(P, M.granLight, ST.x0, ST.x1, 0, ya, za, zb, 2.4, 2.4, k === ST.n - 1 ? 'b' : 'bk');
  }
  tbox(P, M.granLight, ST.x0, ST.x1, 0, PLAT, ST.z1, 0, 2.4, 2.4, 'bk');                                           // the landing between the top step and the stylobate
  for (const [xa, xb] of [[ST.x0 - ST.cheek, ST.x0], [ST.x1, ST.x1 + ST.cheek]]) {
    tbox(P, M.granLight, xa, xb, 0, PLAT, ST.z0, 0, 2.4, 2.4, 'b');
    P.box(M.granGrey, xa - 0.08, xb + 0.08, PLAT, PLAT + 0.1, ST.z0 - 0.08, 0.0, 'b', 2);                          // the cap slab
  }
  for (const [lx, lz] of LAMPS) lampStandard(P, M, lx, PLAT + 0.1, lz);
  // ---- pedestals (granite lower block 1.9 m, limestone block above, top +5.3) and the six columns
  for (const x of COLX) {
    const z = 0.85;
    tbox(P, M.granLight, x - 0.825, x + 0.825, PLAT, PLAT + 1.9, z - 0.825, z + 0.825, 2.4, 2.4, 'b');
    P.box(M.doloFlat, x - 0.78, x + 0.78, PLAT + 1.9, 5.3, z - 0.78, z + 0.78, 'b', 2);
    P.box(M.doloShade, x - 0.9, x + 0.9, 5.3, 5.38, z - 0.9, z + 0.9, 'b', 2);                                  // plinth of the column
    column(P, M, x, z, 5.38);
  }
  // plaques on the pedestals between the doors (X offsets -2 and +2), on the front faces
  for (const dx of [-2, 2]) {
    const x = XC + dx, wx = G.W(x, -0.0), nz = G.dirB;
    if (labels && labels.reserve('w45965990', wx.x, PLAT + 2.3, wx.z, 0.5, 0.6, -nz[0], -nz[1], 'plaque') === false) continue;
    P.quad(M.plaque, [x + 0.25, PLAT + 2.0, 0.85 - 0.83], [x - 0.25, PLAT + 2.0, 0.85 - 0.83], [x - 0.25, PLAT + 2.6, 0.85 - 0.83], [x + 0.25, PLAT + 2.6, 0.85 - 0.83], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  // ---- entablature: frieze 0.9 m (top of the capitals +15.0), cornice 0.3 + modillions, the underside of the loggia ceiling
  P.box(M.doloFlat, X0 - 0.15, X1 + 0.15, 15.0, 15.9, -0.1, 4.5, 'b', 2);
  P.box(M.doloFlat, X0 - 0.45, X1 + 0.45, 15.9, 16.2, -0.5, 4.5, 'b', 2);
  P.quad(M.soffit, [X0 - 0.15, 15.0, 4.5], [X1 + 0.15, 15.0, 4.5], [X1 + 0.15, 15.0, -0.1], [X0 - 0.15, 15.0, -0.1], [0, -1, 0]);
  for (let x = X0 + 0.2; x < X1; x += 0.7) P.box(M.doloShade, x - 0.11, x + 0.11, 15.6, 15.92, -0.35, -0.1, 'b', 1);
  // ---- loggia back wall (Z = 4.5, faces -Z): dolomite F1 with the three arched oak doors from the platform, two flank windows, then F2 with five arched windows
  onFront(P, X1, 4.5, () => {
    const lx = (X) => X1 - X, cx = (d) => lx(XC + d);
    const ops1 = [];
    for (const d of [-4, 0, 4]) ops1.push({ c: archC(cx(d), PLAT, 1.9, 4.7, 10), glass: M.doorOak, reveal: M.granGrey, depth: 0.3 });
    for (const d of [-9.25, 9.25]) ops1.push({ c: rectC(cx(d), 4.9, 2.0, 2.3), glass: M.glassRect, reveal: M.doloShade, depth: 0.28, withSill: true, sillMat: M.doloFlat });
    wallFace(P, M.dolo1, rectOutline(0, W, PLAT - 0.3, GH.f1), ops1, { tu: 4.4, tv: 4.4 });
    const ops2 = [];
    for (const d of [-9.25, -4, 0, 4, 9.25]) ops2.push({ c: archC(cx(d), 9.2, 1.65, 3.4, 8), glass: M.glassArch, reveal: M.doloShade, depth: 0.28 });
    wallFace(P, M.dolo, rectOutline(0, W, GH.f1, 16.2), ops2, { tu: 4.4, tv: 4.4 });
    band(P, M.doloFlat, 0, W, GH.f1 - 0.15, GH.f1 + 0.15, 0, 0.3);
    for (const d of [-9.25, 9.25]) P.quad(M.balus, [cx(d) - 1.2, 4.05, 0.05], [cx(d) + 1.2, 4.05, 0.05], [cx(d) + 1.2, 4.87, 0.05], [cx(d) - 1.2, 4.87, 0.05], [0, 0, 1], [[0, 0], [1.5, 0], [1.5, 1], [0, 1]]);
    // door surrounds (photo 45): a dark granite archivolt 0.4 m wide round each arched door, a trapezoid keystone above it (review fix: the first version had only a small block over each door)
    for (const d of [-4, 0, 4]) {
      const ai = archC(cx(d), PLAT, 1.9, 4.7, 12), ao = archC(cx(d), PLAT, 2.7, 5.1, 12);
      P.extrude(M.granGrey, shapeOf(bandPoly(ao, ai)), 0, 0.14, 1.5, 4);
      const kx = cx(d), ky = PLAT + 5.0;
      P.extrude(M.granGrey, shapeOf([[kx - 0.22, ky - 0.1], [kx + 0.22, ky - 0.1], [kx + 0.32, ky + 0.46], [kx - 0.32, ky + 0.46]]), 0, 0.2, 1.5, 4);
      P.box(M.granGrey, kx - 0.4, kx + 0.4, ky + 0.46, ky + 0.56, 0, 0.26, 'bk', 1);
    }
    // pilasters between the arched windows
    for (const d of [-11.4, -6.65, -2, 2, 6.65, 11.4]) P.box(M.doloFlat, cx(d) - 0.45, cx(d) + 0.45, GH.f1 + 0.15, 16.0, 0, 0.15, 'bk', 2);
  });
  // ---- the terrace at +16.2 (the roof of the portico) between the pylons, the white balustrade along its front, the recessed wall with three windows
  const PY = 5.9;                                                                                                  // the pylon width 6.0, the recess 11.8 m
  P.quad(M.doloFlat, [X0, 16.2, 0], [X1, 16.2, 0], [X1, 16.2, 4.5], [X0, 16.2, 4.5], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  // balustrade: a pale wall 0.25 deep with the baluster texture on both faces and a top rail
  const bx0 = X0 + 6.0, bx1 = X1 - 6.0, bz = 0.9;
  for (const [zz, nz] of [[bz - 0.12, -1], [bz + 0.12, 1]]) P.quad(M.balus, nz < 0 ? [bx1, 16.2, zz] : [bx0, 16.2, zz], nz < 0 ? [bx0, 16.2, zz] : [bx1, 16.2, zz], nz < 0 ? [bx0, 17.1, zz] : [bx1, 17.1, zz], nz < 0 ? [bx1, 17.1, zz] : [bx0, 17.1, zz], [0, 0, nz], [[0, 0], [(bx1 - bx0) / 1.6, 0], [(bx1 - bx0) / 1.6, 1.125], [0, 1.125]]);
  P.box(M.doloFlat, bx0 - 0.1, bx1 + 0.1, 17.05, 17.2, bz - 0.2, bz + 0.2, 'b', 1);
  P.box(M.doloFlat, bx0 - 0.2, bx0 + 0.15, 16.2, 17.2, bz - 0.2, bz + 0.2, 'b', 1); P.box(M.doloFlat, bx1 - 0.15, bx1 + 0.2, 16.2, 17.2, bz - 0.2, bz + 0.2, 'b', 1);
  onFront(P, X1, 4.5, () => {
    const lx = (X) => X1 - X, cx = (d) => lx(XC + d);
    const ops = [{ c: rectC(cx(-4), 17.1, 1.3, 2.4), glass: M.glassRect, reveal: M.doloShade, depth: 0.25, withSill: true, sillMat: M.doloFlat },
      { c: rectC(cx(0), 16.2, 1.3, 3.3), glass: M.glassRect, reveal: M.doloShade, depth: 0.25 },
      { c: rectC(cx(4), 17.1, 1.3, 2.4), glass: M.glassRect, reveal: M.doloShade, depth: 0.25, withSill: true, sillMat: M.doloFlat }];
    wallFace(P, M.dolo, rectOutline(lx(XC + PY), lx(XC - PY), 15.9, 20.4), ops, { tu: 4.4, tv: 4.4 });
  });
  // ---- the pylons (X 48.8 .. 54.85 and 66.65 .. 72.7): front faces at Z = 0 up to 24.9 with one window each; the inner sides; cornices
  for (const [xa, xb] of [[X0, XC - PY], [XC + PY, X1]]) {
    onFront(P, xb, 0, () => {
      const wc = (xb - xa) / 2;
      wallFace(P, M.dolo, rectOutline(0, xb - xa, 16.2, 23.7), [{ c: rectC(wc, 17.6, 1.5, 2.5), glass: M.glassRect, reveal: M.doloShade, depth: 0.28, withSill: true, sillMat: M.doloFlat }], { tu: 4.4, tv: 4.4 });
      cornice(P, M.doloFlat, M.doloShade, 0, xb - xa, 0, 23.7, 0.2, 0.2, 1);
      band(P, M.doloFlat, 0, xb - xa, 16.2, 16.55, 0, 0.18);
    });
    // inner side faces (toward the recess) and the outer side (above the wings: drawn below with the block side walls)
    const xi = xa === X0 ? xb : xa, nx = xa === X0 ? 1 : -1;
    P.quad(M.dolo, [xi, 16.2, 0], [xi, 16.2, 4.5], [xi, 24.9, 4.5], [xi, 24.9, 0], [nx, 0, 0], [[0, 16.2 / 4.4], [4.5 / 4.4, 16.2 / 4.4], [4.5 / 4.4, 24.9 / 4.4], [0, 24.9 / 4.4]]);
    const xo = xa === X0 ? X0 : X1;                                                                                  // the outer side (above the portico, before the block side wall starts at Z 4.5)
    P.quad(M.dolo, [xo, 16.2, 0], [xo, 16.2, 4.5], [xo, 24.9, 4.5], [xo, 24.9, 0], [-nx, 0, 0], [[0, 16.2 / 4.4], [4.5 / 4.4, 16.2 / 4.4], [4.5 / 4.4, 24.9 / 4.4], [0, 24.9 / 4.4]]);
    P.quad(M.roofGrey, [xa, 24.9, 0], [xb, 24.9, 0], [xb, 24.9, 4.5], [xa, 24.9, 4.5], [0, 1, 0]);
  }
  P.quad(M.roofGrey, [XC - PY, 24.9, 2.0], [XC + PY, 24.9, 2.0], [XC + PY, 24.9, 4.5], [XC - PY, 24.9, 4.5], [0, 1, 0]);
  // ---- attic panel with the lettering (front face at Z = 2.0, y 20.4 .. 24.9) over the recess, soffit, cornice
  onFront(P, XC + PY, 2.0, () => {
    const w = 2 * PY;
    wallFace(P, M.dolo, rectOutline(0, w, 20.4, 23.7), [], { tu: 4.4, tv: 4.4 });
    cornice(P, M.doloFlat, M.doloShade, 0, w, 0, 23.7, 0.2, 0.2, 1);
    const wc = G.W(XC, 2.0), nz = G.dirB;
    if (!labels || labels.reserve('w45965990', wc.x, 22.3, wc.z, 6.8, 3.0, -nz[0], -nz[1], 'lettering') !== false) P.quad(M.lettering, [w / 2 - 3.4, 20.8, 0.03], [w / 2 + 3.4, 20.8, 0.03], [w / 2 + 3.4, 23.8, 0.03], [w / 2 - 3.4, 23.8, 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  });
  P.quad(M.soffit, [XC - PY, 20.4, 4.5], [XC + PY, 20.4, 4.5], [XC + PY, 20.4, 2.0], [XC - PY, 20.4, 2.0], [0, -1, 0]);
  P.quad(M.dolo, [XC - PY, 20.4, 2.0], [XC - PY, 20.4, 4.5], [XC - PY, 23.7, 4.5], [XC - PY, 23.7, 2.0], [-1, 0, 0]);
  // ---- the block above the wings: side walls X = 48.8 / 72.7 and the rear wall at Z = 24 from 20.3 to 24.9 with a row of windows
  for (const [x, nx] of [[X0, -1], [X1, 1]]) {
    const ops = [];
    for (let i = 0; i < 5; i++) ops.push({ c: rectC((i + 0.5) * 3.9, 21.4, 1.4, 2.2), glass: M.glassRect, reveal: M.doloShade, depth: 0.25 });
    (nx > 0 ? onEast : onWest)(P, x, nx > 0 ? 24.0 : 4.5, () => {
      wallFace(P, M.dolo, rectOutline(0, 19.5, 20.3, 24.9 - 1.2), ops, { tu: 4.4, tv: 4.4 });
      cornice(P, M.doloFlat, M.doloShade, 0, 19.5, 0, 23.7, 0.2, 0.2, 1);
    });
  }
  P.quad(M.dolo, [X1, 20.3, 24], [X0, 20.3, 24], [X0, 24.9, 24], [X1, 24.9, 24], [0, 0, 1], [[0, 20.3 / 4.4], [W / 4.4, 20.3 / 4.4], [W / 4.4, 24.9 / 4.4], [0, 24.9 / 4.4]]);
  // ---- the dome: top of the block at 24.9; a truncated elliptical vault 21.6 x 17 m (+2.4) of grey-green sheet with rust streaks, a glazed hip over its opening (+1.7), a black lantern box 6 x 6 m (+1.0) with a thin railing; top about 30.4 m
  P.quad(M.roofGrey, [X0, 24.9, 4.5], [X1, 24.9, 4.5], [X1, 24.9, 24.0], [X0, 24.9, 24.0], [0, 1, 0]);
  {
    const DZ = 13.0, ry = 2.8, th0 = 0.55, yRing = 24.9 + Math.cos(th0) * ry;
    const g = new THREE.SphereGeometry(1, 40, 8, 0, Math.PI * 2, th0, Math.PI / 2 - th0);
    P.geo(M.domeMetal, g, XC, 24.9, DZ, 0, 0, 0, 10.8, ry, 8.5); g.dispose();
    roofFrustum(P, M.skylight, XC - 6.4, XC + 6.4, DZ - 5.0, DZ + 5.0, yRing - 0.05, XC - 4.4, XC + 4.4, DZ - 3.0, DZ + 3.0, yRing + 1.7, 2.4);
    const yb = yRing + 1.65;
    P.box(M.darkSteel, XC - 3, XC + 3, yb, yb + 1.0, DZ - 3, DZ + 3, 'b', 2);
    P.box(M.steel, XC - 3.1, XC + 3.1, yb + 1.0, yb + 1.1, DZ - 3.1, DZ + 3.1, 'b', 2);
    for (const [xa, za, xb, zb] of [[-3.1, -3.1, 3.1, -3.1], [-3.1, 3.1, 3.1, 3.1], [-3.1, -3.1, -3.1, 3.1], [3.1, -3.1, 3.1, 3.1]]) {
      const n = 6; for (let i = 0; i <= n; i++) { const x = XC + xa + (xb - xa) * i / n, z = DZ + za + (zb - za) * i / n; P.box(M.steel, x - 0.015, x + 0.015, yb + 1.1, yb + 1.5, z - 0.015, z + 0.015, 'b', 1); }
      P.box(M.steel, XC + Math.min(xa, xb) - 0.02, XC + Math.max(xa, xb) + 0.02, yb + 1.48, yb + 1.52, DZ + Math.min(za, zb) - 0.02, DZ + Math.max(za, zb) + 0.02, 'b', 1);
    }
  }
  // ---- colliders: the columns, the pedestals, the stair, the cheek walls, the platform
  const colSolid = (x, z, r, y0, y1) => { const p = G.W(x, z); ph.addCylinder(p.x, p.z, r, y0, y1); };
  for (const x of COLX) colSolid(x, 0.85, 0.95, PLAT, 16);
  for (const [xa, xb] of [[ST.x0 - ST.cheek, ST.x0], [ST.x1, ST.x1 + ST.cheek]]) G.box(ph, (xa + xb) / 2, (ST.z0 + 0) / 2, xb - xa, -ST.z0, 0, PLAT + 1.0);
  G.stairs(ph, (ST.x0 + ST.x1) / 2, (ST.z0 + ST.z1) / 2, ST.x1 - ST.x0, ST.z1 - ST.z0, 0, ST.n * ST.rise, ST.n);
  G.walk(ph, (ST.x0 + ST.x1) / 2, (ST.z1 - 0.05 + 0.6) / 2, ST.x1 - ST.x0, 0.6 - (ST.z1 - 0.05), PLAT);                           // the landing
  G.walk(ph, XC, 2.35, W, 4.05, PLAT);                                                                              // the loggia floor (X 48.8 .. 72.7, Z 0.3 .. 4.4)
  G.wall(ph, [X0 + 0.0, 0.0], [ST.x0 - ST.cheek, 0.0], 0, PLAT + 0.5, 0.3);                                         // the stylobate front beside the cheek walls
  G.wall(ph, [ST.x1 + ST.cheek, 0.0], [X1, 0.0], 0, PLAT + 0.5, 0.3);
  G.wall(ph, [X0, 0.0], [X0, 4.5], 0, PLAT + 0.5, 0.3); G.wall(ph, [X1, 0.0], [X1, 4.5], 0, PLAT + 0.5, 0.3);
  K.svc.geolPortico = { doors: DOORX.map((x) => { const p = G.W(x, 4.5); return [p.x, p.z]; }), platform: PLAT };
}
