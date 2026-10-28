// landmarksSredny/frank.js - the FRANK MANSION (особняк А. Л. Франка, 21st line 8A, V. Schaub 1898-1900, federal heritage, now the SPbU medical faculty): one of the first Art Nouveau houses of the city; OSM w100720370 (baked as
// an office of 6.6 m: the real eaves are 10.2 m, the gables 13.8 / 14.4 m).  Dossier docs/research/sredny.md section 6 (critic C9), photos refs/sredny 94-108, frame F (origin (-4774.6, -18.0), rot 29.6 deg, X ENE 0 .. 48.3,
// Z SSE 0 .. 25.3): the main front faces +X (ENE) onto the 20-21 line street and is 25.3 m wide in three parts (seen from the street, left to right = south to north):
//   left risalit (south, Z 17 .. 25.3, front X = 48.3, 0.9 m forward): a low polygonal bay with two round-headed windows, a balcony of fretwork panels over it, three windows, a timber-clad gable (top 13.8 m);
//   the centre (Z 8.6 .. 17, X = 47.4): three tall windows under arched ornamental pediments (old-rose frames with a semicircular tympanum), three first-floor windows, a dormer of three windows in the roof;
//   right risalit (north, Z 0 .. 8.6): the arched portal 3.0 m wide with maroon double doors and an old-rose archivolt under a grotesque mask, a tall round-headed window, a three-sided oriel on a corbel, a timber-clad
//   gable (top 14.4 m).  Salmon brick plinth 0.95 m, cream plaster `#ece6d6`, ornament old-rose `#92514e`, frames and doors dark red-brown, maroon standing-seam roof `#7a3d38`, three brick chimneys on the north slope.
// The side and rear walls are plain plaster with window rows.  Closed building: thin-wall colliders; three granite steps lead up to the (closed) portal.
import * as L from '../layout.js';
import { FR } from './frame.js';
import { ringEdges, onEdge, polyOf } from './kit.js';
import { wallFace, rectC, archC, rectOutline, band, bandPoly, roofHip, roofGable, onEast } from './wall.js';
import { tbox, shapeOf } from './geo.js';
import { coverFn } from './surfaces.js';

const F = FR.F;
export const RING_F = [[24, 16.6], [27.8, 16.6], [27.8, 13.9], [20.2, 14], [20.4, 16.6], [0, 16.8], [0, 0.4], [47.4, 0], [47.4, 16.8], [48.3, 16.7], [48.3, 25.1], [24.1, 25.3]];
const EAVES = 10.2;

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSredny] frank/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = K.P;
  F.enter(P);
  try {
    stage('front', () => front(K));
    stage('sides', () => sides(K));
    stage('roof', () => roof(K));
  } finally { F.leave(P); }
  stage('colliders', () => colliders(K));
  stage('services', () => services(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

/** a timber-clad gable triangle (boards) over a part of the front: base x0..x1 at y0, apex height h, maroon half-timber beams, a small window and two medallions; wall frame, plane z */
function timberGable(K, x0, x1, y0, h, z) {
  const { P, M } = K, xm = (x0 + x1) / 2, w = x1 - x0;
  wallFace(P, M.boards, [[x0 - 0.3, y0], [x1 + 0.3, y0], [xm, y0 + h]], [{ c: rectC(xm, y0 + 1.0, 0.8, 1.3), glass: M.winFrank, reveal: M.maroon, depth: 0.2 }], { z, tu: 2.16, tv: 2.16 });
  // maroon bargeboards along the two slopes, a tie beam, a vertical beam and two oval medallions
  for (const s of [-1, 1]) {
    const ax = xm + s * (w / 2 + 0.3), ay = y0, bx = xm, by = y0 + h, len = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax);
    P.push(ax, ay, z, 0); P.cyl(M.maroon, [0, 0, 0.05], [bx - ax, by - ay, 0.05], 0.07, 0.07, 4, false); P.pop();
    void len; void ang;
  }
  P.box(M.maroon, x0 - 0.1, x1 + 0.1, y0 + 0.35, y0 + 0.55, z, z + 0.1, 'bk', 1);
  P.box(M.maroon, xm - 0.07, xm + 0.07, y0 + 0.55, y0 + h * 0.85, z, z + 0.1, 'bk', 1);
  for (const dx of [-w * 0.22, w * 0.22]) P.fan(M.rose, Array.from({ length: 10 }, (_, i) => { const a = Math.PI * 2 * i / 10; return [xm + dx + Math.cos(a) * 0.32, y0 + 1.2 + Math.sin(a) * 0.45, z + 0.04]; }), [0, 0, 1]);
  P.box(M.maroon, x0 - 0.2, x1 + 0.2, y0 - 0.12, y0 + 0.1, z, z + 0.45, 'bk', 1);
}
/** an ornamental window pediment (a pointed gable in an old-rose frame with a semicircular tympanum) over a window of width w centred at cx, head at yh */
function pediment(P, M, cx, yh, w) {
  P.fan(M.rose, [[cx - w / 2 - 0.2, yh + 0.2, 0.05], [cx + w / 2 + 0.2, yh + 0.2, 0.05], [cx, yh + 1.1, 0.05]], [0, 0, 1]);
  P.fan(M.cream, [[cx - w / 2 - 0.05, yh + 0.2, 0.08], [cx + w / 2 + 0.05, yh + 0.2, 0.08], [cx, yh + 0.95, 0.08]], [0, 0, 1], (p) => [p[0], p[1]]);
  P.fan(M.rose, Array.from({ length: 9 }, (_, i) => { const a = Math.PI * i / 8; return [cx + Math.cos(a) * (w / 2 - 0.05), yh + 0.2 + Math.sin(a) * (w / 2 - 0.05), 0.11]; }), [0, 0, 1]);
}

function front(K) {
  const { P, M } = K;
  const O = { tu: 4, tv: 4 };
  // ---- the centre (Z 8.6 .. 17, x = 17 - Z): three tall windows under pediments, three first-floor windows, the cornice
  onEast(P, 47.4, 17.0, () => {
    const len = 8.4, xs = [2.1, 4.9, 7.7], ops = [];
    for (const x of xs) ops.push({ c: rectC(x, 1.8, 1.15, 2.9), glass: M.winFrank, reveal: M.maroon, depth: 0.22 }, { c: rectC(x, 7.2, 1.2, 2.4), glass: M.winFrank, reveal: M.maroon, depth: 0.2 });
    wallFace(P, M.cream, rectOutline(0, len, 0.95, EAVES), ops, O);
    for (const x of xs) { pediment(P, M, x, 4.7, 1.15); P.box(M.cream, x - 0.75, x + 0.75, 1.65, 1.8, 0, 0.12, 'bk', 1); }
    band(P, M.rose, 0, len, 6.85, 7.05, 0, 0.12, 1);
    band(P, M.corniceCream, -0.05, len + 0.05, EAVES - 0.45, EAVES, 0, 0.5, 1);
    tbox(P, M.salmonBrick, 0, len, 0, 0.95, 0, 0.06, 1, 1, 'bk');
  });
  // ---- the left risalit (south, Z 17 .. 25.3, front plane X = 48.3, x = 25.3 - Z): bay window, balcony, three windows, timber gable
  onEast(P, 48.3, 25.3, () => {
    const len = 8.3, ops = [];
    for (const x of [1.9, 4.15, 6.4]) ops.push({ c: rectC(x, 6.0, 1.2, 2.0), glass: M.winFrank, reveal: M.maroon, depth: 0.2 });
    wallFace(P, M.cream, rectOutline(0, len, 0.95, EAVES), ops, O);
    tbox(P, M.salmonBrick, 0, len, 0, 0.95, 0, 0.06, 1, 1, 'bk');
    // the low polygonal bay (z 0 .. 0.7) with two round-headed windows 0.9 x 2.4 at x = 2.3 / 5.8, its roof = the balcony floor at 4.6
    const bx0 = 0.8, bx1 = 7.4, pr = 0.7, ang = 0.5;
    P.box(M.cream, bx0 + ang, bx1 - ang, 0.95, 4.6, 0, pr, 'b', 2);
    for (const [ax, az, bx, bz] of [[bx0, 0, bx0 + ang, pr], [bx1 - ang, pr, bx1, 0]]) { const n3 = [-(bz - az), 0, bx - ax]; P.quad(M.cream, [ax, 0.95, az], [bx, 0.95, bz], [bx, 4.6, bz], [ax, 4.6, az], n3); }
    for (const x of [2.3, 5.8]) { const c = archC(x, 1.9, 0.9, 2.4, 8); P.fan(M.winFrank, c.map((p) => [p[0], p[1], pr + 0.02]), [0, 0, 1], (p) => [(p[0] - (x - 0.45)) / 0.9, (p[1] - 1.9) / 2.4]); }
    // the balcony over the bay: fretwork balustrade (5 panels) on the three sides, a slab
    P.box(M.cream, bx0 - 0.1, bx1 + 0.1, 4.6, 4.8, -0.1, pr + 0.55, 'b', 2);
    P.quad(M.fretwork, [bx1 + 0.1, 4.8, pr + 0.5], [bx0 - 0.1, 4.8, pr + 0.5], [bx0 - 0.1, 5.7, pr + 0.5], [bx1 + 0.1, 5.7, pr + 0.5], [0, 0, 1], [[0, 0], [4, 0], [4, 1], [0, 1]]);
    for (const [x, s] of [[bx0 - 0.1, -1], [bx1 + 0.1, 1]]) P.quad(M.fretwork, s > 0 ? [x, 4.8, pr + 0.5] : [x, 4.8, -0.1], s > 0 ? [x, 4.8, -0.1] : [x, 4.8, pr + 0.5], s > 0 ? [x, 5.7, -0.1] : [x, 5.7, pr + 0.5], s > 0 ? [x, 5.7, pr + 0.5] : [x, 5.7, -0.1], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    band(P, M.corniceCream, -0.05, len + 0.05, EAVES - 0.45, EAVES, 0, 0.5, 1);
    timberGable(K, 0.0, len, EAVES, 3.6, 0.0);
  });
  // ---- the right risalit (north, Z 0 .. 8.6, x = 8.6 - Z): the portal, a tall round-headed window, the oriel on a corbel, timber gable
  onEast(P, 47.4, 8.6, () => {
    const len = 8.6, ops = [];
    ops.push({ c: archC(2.3, 1.8, 1.0, 2.9, 8), glass: M.winFrank, reveal: M.maroon, depth: 0.22 });
    // the portal opening: sill on the top step (0.45), 3.0 m wide, crown 3.65.  REVIEW FIX: the first version cut the hole from y 0.15 although the wall outline starts at 0.95 (a hole crossing the outline breaks the
    // triangulation: the wall face covered the door and the arch showed plain cream).  Now the opening is a NOTCH of the outline (arch jambs from the plinth top) and the door + reveals are drawn by hand.
    const door = archC(6.2, 0.45, 3.0, 3.2, 12), zb = -0.3, dn = door.length;
    const notch = [[0, 0.95], [4.7, 0.95], door[dn - 1], ...door.slice(3, dn - 1).reverse(), door[2], [7.7, 0.95], [len, 0.95], [len, EAVES], [0, EAVES]];
    wallFace(P, M.cream, notch, ops, O);
    tbox(P, M.salmonBrick, 0, 4.7, 0, 0.95, 0, 0.06, 1, 1, 'bk'); tbox(P, M.salmonBrick, 7.7, len, 0, 0.95, 0, 0.06, 1, 1, 'bk');
    { // reveals (jambs and arch soffit), the door leaf set back by 0.3 m, the floor of the doorway
      let cx = 0, cy = 0; for (const p of door) { cx += p[0]; cy += p[1]; } cx /= dn; cy /= dn;
      for (let i = 1; i < dn; i++) {
        const a = door[i], b = door[(i + 1) % dn], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        let nx = -(b[1] - a[1]), ny = b[0] - a[0]; if (nx * (cx - mx) + ny * (cy - my) < 0) { nx = -nx; ny = -ny; }
        const l = Math.hypot(nx, ny) || 1;
        P.quad(M.maroon, [a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], zb], [a[0], a[1], zb], [nx / l, ny / l, 0]);
      }
      P.fan(M.doorFrank, door.map((p) => [p[0], p[1], zb]), [0, 0, 1], (p) => [(p[0] - 4.7) / 3.0, (p[1] - 0.45) / 3.2]);
      P.quad(M.granLight, [4.7, 0.45, 0], [7.7, 0.45, 0], [7.7, 0.45, zb], [4.7, 0.45, zb], [0, 1, 0], [[0, 0], [1.25, 0], [1.25, 0.125], [0, 0.125]]);
    }
    // portal: an archivolt band in old-rose round the opening, the grotesque mask above, 3 granite steps, two pairs of small columns
    const ar = door, arO = archC(6.2, 0.45, 3.5, 3.45, 12);
    P.extrude(M.rose, shapeOf(bandPoly(arO, ar)), 0, 0.12, 1, 4);
    P.fan(M.rose, Array.from({ length: 10 }, (_, i) => { const a = Math.PI * 2 * i / 10; return [6.2 + Math.cos(a) * 0.3, 4.4 + Math.sin(a) * 0.35, 0.18]; }), [0, 0, 1]);
    for (let k = 0; k < 3; k++) tbox(P, M.granLight, 6.2 - 1.8 - k * 0.0, 6.2 + 1.8, 0, 0.15 * (3 - k), 0.0 + k * 0.35, 0.35 * (k + 1) + 0.0 + 0.0, 2, 2, 'b');
    for (const s of [-1.9, 1.9]) for (const dx of [0, 0.22]) P.col(M.cream, 6.2 + s + (s > 0 ? dx : -dx), 0.25, 0.15, 1.35, 0.06, 0.06, 8, true);
    // the tall window's old-rose surround (a crest on top)
    P.fan(M.rose, [[2.3 - 0.75, 4.75, 0.05], [2.3 + 0.75, 4.75, 0.05], [2.3 + 0.3, 5.45, 0.05], [2.3 - 0.3, 5.45, 0.05]], [0, 0, 1]);
    // the oriel: a three-sided bay on a corbel, first floor (y 6.6 .. 9.9), 3.7 m wide, 1.2 m proud, hipped cap, fretwork panels under the sill, three windows
    const ox0 = 3.9, ox1 = 7.6, pr = 1.2, ang = 0.7, y0 = 6.7, y1 = 9.9;
    P.box(M.rose, ox0 + 0.4, ox1 - 0.4, y0 - 0.6, y0, 0.0, pr - 0.2, 'b', 1);
    for (const [ax, az, bx, bz] of [[ox0, 0, ox0 + ang, pr], [ox0 + ang, pr, ox1 - ang, pr], [ox1 - ang, pr, ox1, 0]]) {
      const s = Math.hypot(bx - ax, bz - az), n3 = [-(bz - az) / s, 0, (bx - ax) / s], ux = (bx - ax) / s, uz = (bz - az) / s, mx = (ax + bx) / 2, mz = (az + bz) / 2, hw = Math.min(0.5, s / 2 - 0.12);
      P.quad(M.cream, [ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], n3, [[0, 0], [s / 4, 0], [s / 4, 0.8], [0, 0.8]]);
      P.quad(M.winFrank, [mx - ux * hw + n3[0] * 0.02, y0 + 0.9, mz - uz * hw + n3[2] * 0.02], [mx + ux * hw + n3[0] * 0.02, y0 + 0.9, mz + uz * hw + n3[2] * 0.02], [mx + ux * hw + n3[0] * 0.02, y1 - 0.4, mz + uz * hw + n3[2] * 0.02], [mx - ux * hw + n3[0] * 0.02, y1 - 0.4, mz - uz * hw + n3[2] * 0.02], n3);
      const fo = 0.025;                                                  // (the fretwork lay ON the wall plane: z-fight 0.06 % at 17 m; 2.5 cm in front of it, like the window panes)
      P.quad(M.fretwork, [ax + n3[0] * fo, y0 + 0.05, az + n3[2] * fo], [bx + n3[0] * fo, y0 + 0.05, bz + n3[2] * fo], [bx + n3[0] * fo, y0 + 0.75, bz + n3[2] * fo], [ax + n3[0] * fo, y0 + 0.75, az + n3[2] * fo], n3, [[0, 0], [s / 0.5, 0], [s / 0.5, 1], [0, 1]]);
    }
    roofHip(P, M.roofMaroon, ox0 - 0.15, ox1 + 0.15, -0.05, pr + 0.2, y1, 1.2, 2);
    P.fan(M.rose, Array.from({ length: 10 }, (_, i) => { const a = Math.PI * 2 * i / 10; return [(ox0 + ox1) / 2 + Math.cos(a) * 0.25, y0 - 0.3 + Math.sin(a) * 0.3, pr - 0.05]; }), [0, 0, 1]);
    band(P, M.corniceCream, -0.05, len + 0.05, EAVES - 0.45, EAVES, 0, 0.5, 1);
    timberGable(K, 0.0, len, EAVES, 4.2, 0.0);
  });
}

/** the plain side and rear walls: every ring edge except the three front pieces gets a wall with window rows */
function sides(K) {
  const { P, M } = K;
  for (const e of ringEdges(polyOf(RING_F))) {
    const [nx] = e.n;
    if (nx > 0.9 && (Math.abs(e.a[0] - 47.4) < 0.2 || Math.abs(e.a[0] - 48.3) < 0.2) && e.len > 6) continue;          // the front pieces
    if (e.len < 1.0) continue;
    onEdge(P, e, (len) => {
      const bays = Math.max(1, Math.round(len / 3.2)), pitch = len / bays, ops = [];
      if (len > 3) for (let i = 0; i < bays; i++) { const cx = (i + 0.5) * pitch; ops.push({ c: rectC(cx, 1.9, 1.2, 2.3), glass: M.winFrank, reveal: M.maroon, depth: 0.2 }, { c: rectC(cx, 6.6, 1.2, 2.2), glass: M.winFrank, reveal: M.maroon, depth: 0.2 }); }
      wallFace(P, M.cream, rectOutline(0, len, 0.95, EAVES), ops, { tu: 4, tv: 4 });
      tbox(P, M.salmonBrick, 0, len, 0, 0.95, 0, 0.06, 1, 1, 'bk');
      band(P, M.corniceCream, -0.05, len + 0.05, EAVES - 0.45, EAVES, 0, 0.5, 1);
    });
  }
}

/** the maroon roofs: the main hipped roof (ridge 12.7), the two gable prisms of the risalits (14.4 / 13.8), the dormer and the three chimneys */
function roof(K) {
  const { P, M } = K;
  roofHip(P, M.roofMaroon, -0.4, 47.4 + 0.5, -0.4, 16.8 + 0.4, EAVES, 2.5, 2);
  roofGable(P, M.roofMaroon, null, 36, 47.9, -0.4, 8.9, EAVES, 4.2, true, 2);
  P.fan(M.roofMaroon, [[36, EAVES, -0.4], [36, EAVES, 8.9], [36, EAVES + 4.2, 4.25]], [-1, 0, 0]);
  roofGable(P, M.roofMaroon, null, 24.0, 48.8, 16.7, 25.7, EAVES, 3.6, true, 2);
  P.fan(M.cream, [[24.0, EAVES, 25.7], [24.0, EAVES, 16.7], [24.0, EAVES + 3.6, 21.2]], [-1, 0, 0], (p) => [p[2] / 4, p[1] / 4]);
  // the dormer of three windows (2.2 m wide) on the front slope of the centre
  P.push(0, 0, 0, 0);
  P.box(M.cream, 45.4, 46.9, 10.3, 12.35, 11.7, 13.9, 'b', 2);
  P.quad(M.winFrank, [46.92, 11.1, 13.5], [46.92, 11.1, 12.1], [46.92, 12.25, 12.1], [46.92, 12.25, 13.5], [1, 0, 0], [[0, 0], [1, 0], [1, 0.5], [0, 0.5]]);
  roofGable(P, M.roofMaroon, M.cream, 45.3, 47.1, 11.55, 14.05, 12.35, 0.7, true, 2);
  P.pop();
  for (const x of [37.0, 32.5, 28.0]) P.box(M.chimney, x - 0.45, x + 0.45, 11.1, 13.6, 2.6 - 0.45, 2.6 + 0.45, 'b', 1.5);
}

function colliders(K) {
  const ph = K.ctx.physics;
  for (const e of ringEdges(polyOf(RING_F))) F.wall(ph, e.a, e.b, 0, 14, 0.4);
  // the three granite steps to the (closed) portal: centre F (47.4 + 0.525, 2.4), 3.6 m wide, rising toward -X
  const c = F.W(47.4 + 0.525, 2.4); ph.addStairs(c.x, c.z, 3.6, 1.05, F.rot + Math.PI, 0, 0.45, 3);
  void L;
}
function services(K) {
  const svc = K.svc, c = F.W(24, 12), cover = coverFn(K.ctx);
  svc.monuments.push({ id: 'w100720370', name: 'Особняк А. Л. Франка (21-я линия В.О., 8А)', x: c.x, z: c.z, h: 14.4 });
  const spot = (x, z, yaw, pitch, name) => { if (cover(x, z) < -0.5 && !L.insideBuilding(x, z, 0.5)) svc.photoSpots.push({ x, z, yaw, pitch, name }); };
  spot(-4709, -41.6, 120, 8, 'Особняк Франка: фасад с порталом');
}
