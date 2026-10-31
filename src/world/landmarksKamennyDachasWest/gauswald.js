// landmarksKamennyDachasWest/gauswald.js - the GAUSWALD DACHA (Дача Гаусвальд, 1898, Chagin / Schoene; OSM w108029314, restored 2019: pale olive-green clapboard with dark-green members, red clay tiles, buff brick, a round tower
// with a dark scale-slate cone).  The OSM outline is a 25.8 x 21.8 m rectangle: frame FG, local x 0 .. 25.8, z 0 .. 21.8; the wall z = 0 is the STREET front (ENE, to Bolshaya alleya), z = 21.8 the COURT front (WSW, the
// elevation of G01 G03 G08): from the court, left to right: the two-storey side block with the small balcony, the steep cross gable over the half-round lattice bay, the buff-brick wing with the round-arched porch and
// the fretwork roof balustrade, the round brick tower in the corner (it bulges 2 m out of the OSM rectangle, as in the photos).  Photos G01 G03 G05 G08 G12.  Heights [E]: plinth 0.8, eaves 6.0, cross-gable ridge 11.4, tower roof apex 11.9.
import { FG } from './frame.js';
import { onFace } from './geo.js';
import { Q } from './facade.js';
import { tube } from './geo.js';
import { rq, hip, gable, spin, chimney, win, archWin, spread, ball } from './util.js';

const EAVE = 6.0, PL = 0.8, XL = 25.8, ZD = 21.8;
export const TOWER = { x: 24.0, z: 20.5, r: 2.8 };

export async function build(K) {
  const { M, P, N } = K;
  P.push(FG.ox, 0, FG.oz, FG.rot); N.push(FG.ox, 0, FG.oz, FG.rot);
  const both = (fn) => fn(P, N);
  const clapWall = (len, h = EAVE, y0 = 0) => P.quad(M.clap, [0, y0, 0], [len, y0, 0], [len, h, 0], [0, h, 0], [0, 0, 1], [[0, y0 / 1.6], [len / 1.6, y0 / 1.6], [len / 1.6, h / 1.6], [0, h / 1.6]]);
  const members = (len, us, belt = 3.3) => {                                        // the dark-green frame: corner posts, mid posts, the floor belt, the plinth top rail
    for (const u of us) N.box(M.greenD, u - 0.09, u + 0.09, PL, EAVE, 0, 0.06, 'k', 1);
    N.box(M.greenD, 0, len, belt - 0.1, belt + 0.1, 0, 0.07, 'k', 1); N.box(M.greenD, 0, len, EAVE - 0.18, EAVE, 0, 0.09, 'k', 1);
    P.box(M.limestone, 0, len, 0, PL, 0, 0.08, 'k', 1.8);
  };
  const face = (x, z, nx, nz, fn) => onFace(P, x, z, nx, nz, () => onFace(N, x, z, nx, nz, fn));
  const w1 = (cx, y0, w = 1.1, h = 1.6) => win(P, N, M.winG1D, M.clap, { cx, y0, w, h }, { sw: 0.13, proud: 0.07, sill: 0.1 });

  // ------------------------------------------------------------------------------------ the COURT front (z = 21.8, u = x): the elevation of G03 / G08
  face(0, ZD, 0, 1, () => {
    clapWall(XL); members(XL, [0.1, 4.6, 14.4, 20.3, XL - 0.1]);
    // side block (u 0 .. 4.6): a window below, a door-window and a small balcony above
    w1(2.4, 1.1, 1.1, 1.6);
    Q(P, M.winG1D, [1.8, 3.5, 0.015], [3.0, 3.5, 0.015], [3.0, 5.6, 0.015], [1.8, 5.6, 0.015], [0, 0, 1]); N.box(M.clap, 1.6, 3.2, 3.4, 5.8, 0, 0.07, 'k');
    P.box(M.clap, 1.0, 3.8, 3.3, 3.45, 0, 1.0, 'b', 1.6);
    for (let i = 0; i < 3; i++) Q(N, M.fret, [1.0 + i * 0.93, 3.45, 1.0], [1.0 + (i + 1) * 0.93, 3.45, 1.0], [1.0 + (i + 1) * 0.93, 4.4, 1.0], [1.0 + i * 0.93, 4.4, 1.0], [0, 0, 1], [0, 0, 1, 1]);
    for (const x of [1.15, 3.65]) N.box(M.greenD, x - 0.06, x + 0.06, 3.3, 4.4, 0.9, 1.0, '', 1);
    // the lattice bay (u 4.6 .. 11.4, 2.2 m deep, to y 3.45): lattice walls, the half-round window, a side window and the lean-to roof
    {
      const x0 = 4.6, x1 = 11.4, d = 2.2, y1 = 3.45;
      P.quad(M.lattice, [x0, PL, d], [x1, PL, d], [x1, y1, d], [x0, y1, d], [0, 0, 1], [[0, 0], [(x1 - x0) / 1.0, 0], [(x1 - x0) / 1.0, (y1 - PL) / 1.0], [0, (y1 - PL) / 1.0]]);
      P.quad(M.lattice, [x0, PL, 0], [x0, PL, d], [x0, y1, d], [x0, y1, 0], [-1, 0, 0], [[0, 0], [d, 0], [d, 2.65], [0, 2.65]]);
      P.box(M.limestone, x0 - 0.05, x1, 0, PL, 0, d + 0.05, 'b', 1.8);
      // the half-round window: a half-ellipse 3.4 x 1.7 m (decal), a dark-green rounded frame
      const hx = 8.0, hw = 1.75, hy = 1.35, hh = 1.7, pts = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * i / 14; pts.push([hx - hw * Math.cos(a), hy + hh * Math.sin(a)]); }
      const S = M.winHalfD, u = S.uv;
      P.fan(S.mat, pts.map((p) => [p[0], p[1], d + 0.02]), [0, 0, 1], (p) => [u[0] + (u[2] - u[0]) * (p[0] - (hx - hw)) / (2 * hw), u[1] + (u[3] - u[1]) * (p[1] - hy) / hh]);
      N.box(M.greenD, hx - hw - 0.14, hx + hw + 0.14, hy - 0.2, hy, d, d + 0.08, 'k', 1);
      for (let i = 0; i <= 14; i++) { const a = Math.PI * i / 14, a1 = Math.PI * (i + 1) / 14; if (i < 14) { const p0 = pts[i], p1 = pts[i + 1], o0 = [hx - (hw + 0.13) * Math.cos(a), hy + (hh + 0.13) * Math.sin(a)], o1 = [hx - (hw + 0.13) * Math.cos(a1), hy + (hh + 0.13) * Math.sin(a1)]; N.quad(M.greenD, [p0[0], p0[1], d + 0.03], [o0[0], o0[1], d + 0.05], [o1[0], o1[1], d + 0.05], [p1[0], p1[1], d + 0.03], [0, 0, 1]); } }
      w1(10.0, PL + 0.7, 1.3, 1.9);
      // the lean-to roof of the bay: dark metal, a thin edge
      rq(P, M.iron, [x0 - 0.2, 3.5, 0], [x1, 3.5, 0], [x1, 3.5, d + 0.35], [x0 - 0.2, 3.5, d + 0.35], 2, [0, 1, 0]);
      rq(P, M.iron, [x0 - 0.2, 3.5, 0], [x1, 3.5, 0], [x1, 3.5, d + 0.35], [x0 - 0.2, 3.5, d + 0.35], 2, [0, -1, 0]);
      rq(P, M.iron, [x0 - 0.2, 3.5, d + 0.35], [x1, 3.5, d + 0.35], [x1, 3.2, d + 0.35], [x0 - 0.2, 3.2, d + 0.35], 2, [0, 0, 1]);
      for (let i = 0; i < 5; i++) N.box(M.greenD, x0 + 0.4 + i * 1.5, x0 + 0.5 + i * 1.5, 3.0, 3.5, d - 0.1, d + 0.3, '', 1);
    }
    // the big window group (u 11.6 .. 14.3) and the low fretwork terrace railing in front of it
    win(P, N, M.winG2D, M.clap, { cx: 12.95, y0: 1.0, w: 2.0, h: 2.3 }, { sw: 0.14, proud: 0.07, sill: 0.12 });
    for (let i = 0; i < 3; i++) Q(N, M.fret, [11.4 + i * 1.0, PL, 0.9], [11.4 + (i + 1) * 1.0, PL, 0.9], [11.4 + (i + 1) * 1.0, PL + 0.95, 0.9], [11.4 + i * 1.0, PL + 0.95, 0.9], [0, 0, 1], [0, 0, 1, 1]);
    for (const x of [11.4, 14.4]) N.box(M.greenD, x - 0.07, x + 0.07, PL, PL + 1.05, 0.83, 0.97, '', 1);
    // the gable (u 5 .. 14): two lancet lights and the dark-green rake boards
    archWin(P, N, M.winArchD, M.greenD, { cx: 8.6, y0: 7.3, w: 0.9, h: 1.8 }, { z: 0.02, sw: 0.1 });
    archWin(P, N, M.winArchD, M.greenD, { cx: 10.4, y0: 7.3, w: 0.9, h: 1.8 }, { z: 0.02, sw: 0.1 });
    for (const [a, b, s] of [[[5, EAVE], [9.5, 11.4], 1], [[14, EAVE], [9.5, 11.4], -1]]) rq(N, M.greenD, [a[0], a[1], 0.12], [a[0] + s * 0.5, a[1], 0.12], [b[0], b[1] - 0.75, 0.12], [b[0], b[1], 0.12], 2, [0, 0, 1]);
    // the buff-brick wing with the porch (u 14.6 .. 20.0, 2.4 m deep, to y 5.5)
    {
      const x0 = 14.6, x1 = 20.0, d = 2.4, y1 = 5.5, cx = 17.3;
      P.quad(M.brickBuff, [x0, 0, d], [x1, 0, d], [x1, y1, d], [x0, y1, d], [0, 0, 1], [[x0 / 1.5, 0], [x1 / 1.5, 0], [x1 / 1.5, y1 / 1.5], [x0 / 1.5, y1 / 1.5]]);
      P.quad(M.brickBuff, [x0, 0, 0], [x0, 0, d], [x0, y1, d], [x0, y1, 0], [-1, 0, 0], [[0, 0], [d / 1.5, 0], [d / 1.5, y1 / 1.5], [0, y1 / 1.5]]);
      P.quad(M.brickBuff, [x1, 0, d], [x1, 0, 0], [x1, y1, 0], [x1, y1, d], [1, 0, 0], [[0, 0], [d / 1.5, 0], [d / 1.5, y1 / 1.5], [0, y1 / 1.5]]);
      P.box(M.limestone, x0 - 0.05, x1 + 0.05, 0, 0.5, 0, d + 0.05, 'b', 1.8);
      P.box(M.iron, x0 - 0.1, x1 + 0.1, y1, y1 + 0.14, 0, d + 0.1, 'b', 1);                                // the flat roof edge
      N.box(M.pierBrick, x0, x1, 4.55, 4.85, d, d + 0.05, 'k', 0.6);                                       // the red-and-buff ribbon
      // the round arch of the entrance: a green archivolt ring, the arched door as a decal, granite steps with cheeks
      archWin(P, N, M.doorGD, M.clap, { cx, y0: 0.9, w: 2.1, h: 3.1 }, { z: d + 0.02, sw: 0.4, proud: 0.12 });
      for (let k = 0; k < 4; k++) P.box(M.limestone, cx - 1.5 - 0.1 * k, cx + 1.5 + 0.1 * k, 0, 0.9 - k * 0.22, d, d + 0.3 + (k + 1) * 0.3, 'b', 1.8);
      for (const s of [-1, 1]) P.box(M.limestone, cx + s * 1.8 - 0.25, cx + s * 1.8 + 0.25, 0, 1.05, d, d + 1.7, 'b', 1.8);
      N.box(M.iron, cx - 0.5, cx + 0.5, 4.0, 4.2, d - 0.1, d + 0.15, '', 1);
      // the fretwork balustrade on the roof of the wing (front and sides)
      for (let i = 0; i < 3; i++) Q(N, M.fret, [x0 + i * 1.8, y1 + 0.14, d], [x0 + (i + 1) * 1.8, y1 + 0.14, d], [x0 + (i + 1) * 1.8, y1 + 1.04, d], [x0 + i * 1.8, y1 + 1.04, d], [0, 0, 1], [0, 0, 1, 1]);
      for (const x of [x0, x0 + 1.8, x0 + 3.6, x1]) N.box(M.greenD, x - 0.06, x + 0.06, y1 + 0.14, y1 + 1.1, d - 0.06, d + 0.06, '', 1);
      // the second-floor windows behind the balustrade
      w1(16.2, 3.4 + 0.2, 1.1, 1.6); w1(18.5, 3.4 + 0.2, 1.1, 1.6);
    }
  });

  // ------------------------------------------------------------------------------------ the STREET front (z = 0, u = XL - x): the elevation of G05
  face(XL, 0, 0, -1, () => {
    clapWall(XL); members(XL, [0.1, 5.8, 11.8, 20.8, XL - 0.1], 3.3);
    for (const u of [13.4, 16.3, 19.2]) { win(P, N, M.winG2D, M.clap, { cx: u, y0: 1.0, w: 1.3, h: 1.9 }, { sw: 0.13, proud: 0.07, sill: 0.1 }); w1(u, 3.9, 1.1, 1.6); }
    for (const u of [3.2, 7.4]) { w1(u, 1.2, 1.1, 1.6); w1(u, 3.9, 1.1, 1.6); }
    // the lean-to awning (dark metal) over the ground floor of the gable part
    rq(P, M.iron, [12.2, 3.5, 0], [20.4, 3.5, 0], [20.4, 3.2, -1.4], [12.2, 3.2, -1.4], 2, [0, 1, 0]);
    rq(P, M.iron, [12.2, 3.5, 0], [20.4, 3.5, 0], [20.4, 3.2, -1.4], [12.2, 3.2, -1.4], 2, [0, -1, 0]);
    for (const u of [12.5, 15.0, 17.5, 20.1]) N.box(M.greenD, u - 0.05, u + 0.05, 3.0, 3.3, -1.3, 0, '', 1);
    // the gable: three pointed lights under the apex
    for (const u of [14.9, 16.3, 17.7]) archWin(P, N, M.winArchD, M.greenD, { cx: u, y0: 6.6, w: 0.7, h: 1.5 }, { z: 0.02, sw: 0.09 });
    for (const [a, b, sg] of [[[11.8, EAVE], [16.3, 11.4], 1], [[20.8, EAVE], [16.3, 11.4], -1]]) rq(N, M.greenD, [a[0], a[1], 0.12], [a[0] + sg * 0.5, a[1], 0.12], [b[0], b[1] - 0.75, 0.12], [b[0], b[1], 0.12], 2, [0, 0, 1]);
    // the side block of G05 (right of the gable, low x): a door-window and the balcony
    Q(P, M.winG1D, [22.3, 3.5, 0.015], [23.5, 3.5, 0.015], [23.5, 5.6, 0.015], [22.3, 5.6, 0.015], [0, 0, 1]);
    P.box(M.clap, 21.5, 24.3, 3.3, 3.45, 0, -1.0, 'b', 1.6);
    for (let i = 0; i < 3; i++) Q(N, M.fret, [21.5 + i * 0.93, 3.45, -1.0], [21.5 + (i + 1) * 0.93, 3.45, -1.0], [21.5 + (i + 1) * 0.93, 4.4, -1.0], [21.5 + i * 0.93, 4.4, -1.0], [0, 0, -1], [0, 0, 1, 1]);
    for (const x of [21.6, 24.2]) N.box(M.greenD, x - 0.06, x + 0.06, 3.3, 4.4, -1.0, -0.9, '', 1);
  });
  // ---- the two side walls
  face(0, 0, -1, 0, () => { clapWall(ZD); members(ZD, [0.1, ZD - 0.1]); for (const u of spread(ZD, 4.0, 2.2)) { w1(u, 1.2, 1.1, 1.6); w1(u, 3.9, 1.1, 1.6); } });
  face(XL, ZD, 1, 0, () => { clapWall(ZD); members(ZD, [0.1, ZD - 0.1]); for (const u of [2.5, 8, 12.5]) { w1(u, 1.2, 1.1, 1.6); w1(u, 3.9, 1.1, 1.6); } });

  // ------------------------------------------------------------------------------------ the TOWER (buff brick, arched lights, a flared dark slate cone with a mast)
  {
    const { x, z, r } = TOWER;
    tube(P, M.brickBuff, x, z, 0, 7.0, r, r, 22, 11.7, 4.7);
    tube(P, M.limestone, x, z, 0, 0.6, r + 0.08, r + 0.08, 22, 11.7, 0.4);
    tube(N, M.greenD, x, z, 6.75, 7.05, r + 0.14, r + 0.14, 22, 20, 0.3);
    for (const [ang, y0, h] of [[10, 0.9, 1.9], [10, 4.0, 1.7], [95, 1.3, 1.7], [95, 4.2, 1.5], [165, 4.2, 1.5], [-70, 1.5, 1.7]]) {
      const a = ang * Math.PI / 180, c = [x + Math.sin(a) * (r + 0.015), z + Math.cos(a) * (r + 0.015)];
      P.push(c[0], 0, c[1], a); N.push(c[0], 0, c[1], a);
      archWin(P, N, M.winArchD, M.clap, { cx: 0, y0, w: 0.85, h }, { z: 0.0, sw: 0.22, proud: 0.07 });
      P.pop(); N.pop();
    }
    spin(P, M.slateD, x, z, [[r + 1.15, 6.95], [r + 0.55, 7.35], [r - 0.3, 8.2], [0.12, 11.9]], 22, 1.0);
    P.cyl(M.iron, [x, 11.8, z], [x, 13.2, z], 0.05, 0.03, 5, false);
  }

  // ------------------------------------------------------------------------------------ roofs and chimneys
  const tile = M.tileG;
  hip(P, tile, { x0: 0, x1: XL, z0: 0, z1: ZD, y: EAVE, rise: 3.3, ov: 0.75, tu: 1.5 });
  gable(P, tile, M.halfG, { x0: 5, x1: 14, z0: 0, z1: ZD, y: EAVE, rise: 5.4, ov: 0.7, ovG: 0.9, axis: 'z', tu: 1.5, gtu: 2.7 });
  // two gabled dormers on the street slope of the main roof (G05)
  for (const x of [2.8, 21.6]) {
    const z0 = 0.5, z1 = 4.0, y0 = 6.25, y1 = 8.1;
    P.box(M.clap, x - 0.95, x + 0.95, y0, y1, z0, z1, 'bf', 1.6);
    Q(P, M.winG1D, [x + 0.5, y0 + 0.35, z0 - 0.015], [x - 0.5, y0 + 0.35, z0 - 0.015], [x - 0.5, y0 + 1.5, z0 - 0.015], [x + 0.5, y0 + 1.5, z0 - 0.015], [0, 0, -1]);
    N.box(M.greenD, x - 0.62, x + 0.62, y0 + 1.5, y0 + 1.66, z0 - 0.07, z0, '', 1);
    gable(P, tile, M.halfG, { x0: x - 0.95, x1: x + 0.95, z0, z1, y: y1, rise: 1.05, ov: 0.25, ovG: 0.35, axis: 'z', tu: 1.5, gtu: 2.7 });
  }
  for (const [x, z, y0] of [[2.6, 8.0, 7.2], [15.7, 9.6, 8.2], [19.4, 9.6, 8.2]]) chimney(P, M, x, z, y0, y0 + 3.4, 1.0, 1.0, M.brickRed);
  // the little corner turret between the bay and the wing (G03): a round green oriel with a dark cap
  P.cyl(M.clap, [14.2, 3.7, ZD + 0.6], [14.2, 6.3, ZD + 0.6], 0.55, 0.55, 12, false);
  spin(P, M.slateD, 14.2, ZD + 0.6, [[0.75, 6.25], [0.5, 6.55], [0, 7.5]], 12, 1.0);

  { const c = FG.W(TOWER.x, TOWER.z); (K.shared.cols ||= []).push({ cyl: [c.x, c.z, TOWER.r + 0.2, 12] }); }
  // colliders: the house is one solid block (the closed plot)
  (K.shared.cols ||= []).push({ box: [FG.W(XL / 2, ZD / 2).x, FG.W(XL / 2, ZD / 2).z, XL + 0.2, ZD + 0.2, FG.rot, 11] });
  { const c = FG.W(14.2 + 0, ZD + 1.2); (K.shared.cols ||= []).push({ box: [c.x, c.z, 6.5, 3.0, FG.rot, 6] }); }
  P.pop(); N.pop();
  void both; void ball;
}
