// landmarksKamennyTheatre/util.js - helpers shared by the theatre parts: facade frames of the four walls, window openings (holes in the extruded wall + glazing decal in the shell + surrounds in the near detail),
// atlas polygons.  Heights [E from the frontal photos T06 / T11 / T12, 43 px per metre]: tall casement 1.45 x 3.0 m from y 4.4, a lunette over a hood, small top windows 1.0 x 1.3 m from y 9.9.
import * as THREE from 'three';
import { TP } from './frame.js';
import { Q, surround, archSurround } from './facade.js';

export const TAU = Math.PI * 2;
export const DEPTH = 0.22;                                             // the wall is 0.22 m thick in the reveals

/** run fn in the facade frame of one wall of the body (pushes every collector of `Ps`): side '+x' / '-x' (long walls), 'rear' (ESE gable wall), 'front' (the wall behind the portico).  fn(L): L = length of the wall.
 *  u runs along the wall to the RIGHT seen from outside; '+x': u from the portico end (u = ZF - mz); '-x': u from the ESE end (u = mz - ZE); 'rear': u = HW - mx; 'front': u = mx + HW. */
export function onWall(Ps, side, fn) {
  const { HW, ZE, ZF } = TP;
  const f = { '+x': [HW, ZF, Math.PI / 2, ZF - ZE], '-x': [-HW, ZE, -Math.PI / 2, ZF - ZE], rear: [HW, ZE, Math.PI, 2 * HW], front: [-HW, ZF, 0, 2 * HW] }[side];
  for (const P of Ps) P.push(f[0], 0, f[1], f[2]);
  try { return fn(f[3]); } finally { for (const P of Ps) P.pop(); }
}
/** the world-frame (T) position of facade coordinate u on a wall (for colliders / labels) */
export function wallPoint(side, u, depth = 0) {
  const { HW, ZE, ZF } = TP;
  return { '+x': { mx: HW + depth, mz: ZF - u }, '-x': { mx: -HW - depth, mz: ZE + u }, rear: { mx: HW - u, mz: ZE - depth }, front: { mx: -HW + u, mz: ZF + depth } }[side];
}

// ---- opening sets ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const O = {
  tall: (cx) => ({ x0: cx - 0.725, x1: cx + 0.725, y0: TP.sill2, y1: TP.sill2 + TP.win2H, kind: 'tall' }),
  fan: (cx) => ({ cx, y0: TP.fanY, w: 1.45, h: 0.725, arch: true, kind: 'fan' }),
  small: (cx) => ({ x0: cx - 0.5, x1: cx + 0.5, y0: TP.sill3, y1: TP.sill3 + TP.win3H, kind: 'small' }),
  ground: (cx) => ({ x0: cx - 0.55, x1: cx + 0.55, y0: TP.sill1, y1: TP.sill1 + TP.win1H, kind: 'ground' }),
  door: (cx, w = 1.65, y0 = 1.1, h = 2.3) => ({ x0: cx - w / 2, x1: cx + w / 2, y0, y1: y0 + h, kind: 'door' }),
};

/** the glazing decal of an opening, at the back of its reveal (shell) */
export function pane(P, M, h, depth = DEPTH) {
  const z = -depth + 0.04;
  if (h.arch) {
    const S = M.winFan, r = h.w / 2, pts = [];
    for (let i = 0; i <= 14; i++) { const a = Math.PI * i / 14; pts.push([h.cx + Math.cos(a) * r, h.y0 + Math.sin(a) * r, z]); }
    const u = S.uv;
    P.fan(S.mat, pts, [0, 0, 1], (p) => [u[0] + (u[2] - u[0]) * (p[0] - (h.cx - r)) / (2 * r), u[1] + (u[3] - u[1]) * (p[1] - h.y0) / r]);
    return;
  }
  const S = { tall: M.winTall, small: M.winSmall, ground: M.winGround, door: M.doorW, annex: M.winAnnex, doorTall: M.doorTall }[h.kind] || M.winTall;
  Q(P, S, [h.x0, h.y0, z], [h.x1, h.y0, z], [h.x1, h.y1, z], [h.x0, h.y1, z], [0, 0, 1]);
}

/** the white surround of an opening (near detail) */
export function surroundOf(N, M, h) {
  if (h.kind === 'tall') {
    surround(N, M.white, h, { sw: 0.2, proud: 0.09, sill: 0.16 });
    N.box(M.white, h.x0 - 0.34, h.x1 + 0.34, h.y1 + 0.2, h.y1 + 0.36, 0, 0.3, 'k');                                       // the hood slab over the lintel
    for (const s of [-1, 1]) N.box(M.white, (s < 0 ? h.x0 - 0.24 : h.x1 + 0.12), (s < 0 ? h.x0 - 0.12 : h.x1 + 0.24), h.y1 - 0.2, h.y1 + 0.2, 0, 0.2, 'k');   // the brackets
  } else if (h.kind === 'fan') {
    archSurround(N, M.white, h, { sw: 0.2, proud: 0.09, impost: false });
  } else if (h.kind === 'small') {
    surround(N, M.white, h, { sw: 0.13, proud: 0.07, sill: 0.1 });
  } else if (h.kind === 'ground') {
    surround(N, M.white, h, { sw: 0.14, proud: 0.07, sill: 0.14 });
  } else if (h.kind === 'door' || h.kind === 'doorTall') {
    surround(N, M.white, h, { sw: 0.16, proud: 0.07, sill: 0 });
  }
}

/** a flat decal polygon in an atlas cell: pts [[x, y]..] (convex), uv by the bounding box of the polygon mapped over the whole cell */
export function atlasPoly(P, S, pts, z, n = [0, 0, 1]) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const u = S.uv;
  P.fan(S.mat, pts.map((p) => [p[0], p[1], z]), n, (p) => [u[0] + (u[2] - u[0]) * (p[0] - x0) / (x1 - x0), u[1] + (u[3] - u[1]) * (p[1] - y0) / (y1 - y0)]);
}

export { THREE };
