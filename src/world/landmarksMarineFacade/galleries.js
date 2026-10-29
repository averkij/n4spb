// landmarksMarineFacade/galleries.js - the covered quay galleries and the elevated ferry gallery (dossier 4.4, 4.3 + CRITIC alen_08).
//   * SEVEN standard galleries (OSM `building=roof`, 8.5-10.6 m wide, 100-190 m long, standing 13-30 m behind the berth edge): a curved (half-barrel) dark-grey metal roof, crown 5.4 m, quay-side eave 3.6 m,
//     land-side eave 3.2 m; the quay side glazed with clear panes from 0.9 to 3.4 m, the land side open; slender posts d 0.18 m every 6 m on both long sides (instanced).  Seen from far they read as ONE long very low
//     dark line under the mast row (photos V 11 14 16).  Closed territory: one thin solid wall along the glazed side.
//   * the ELEVATED FERRY GALLERY w1278049984 (an L along the east wall north of Terminal 3 and the north wall): a rectangular glass tube 4.4 m wide on a steel box girder (deck 5.5 m above the apron), two glass
//     bands with solid sill bands, a flat pale roof, round columns every 12 m; two lift towers at its end.
import * as THREE from 'three';
import * as L from '../layout.js';
import { FW, FM, U_DIR, V_DIR, F } from './frame.js';
import { ringOf, obb, rotYOf } from './geo.js';
import { addInstanced, partsGeos, kBays } from './inst.js';
import { unitPanel } from '../lib/fence-bays.js';

export const GALLERIES = ['w704139101', 'w704139100', 'w704139096', 'w704139097', 'w704139098', 'w704139085', 'w1278049992'];

export function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics;
  const posts = [], glazed = [];
  const profile = (t) => (t < 0.45 ? 5.4 - 10.86 * (0.45 - t) * (0.45 - t) : 5.4 - 5.95 * (t - 0.45) * (t - 0.45));          // roof height from the land side (t 0) to the quay side (t 1)
  for (const id of GALLERIES) {
    try {
      const ring = ringOf(id); if (!ring) { console.warn('[landmarksMarineFacade/galleries] no ring', id); continue; }
      const B = obb(ring), hl = B.hl, hw = Math.max(4.1, B.hw);
      // which side is the quay: the normal toward water
      let sg = 0; for (const s of [1, -1]) for (const d of [8, 16, 26, 40]) { if (!sg && L.inRiver(B.cx + s * B.vx * (hw + d), B.cz + s * B.vz * (hw + d))) sg = s; }
      if (!sg) sg = 1;
      const rot = rotYOf(B.ux, B.uz), zd = [-B.uz, B.ux], sz = (B.vx * zd[0] + B.vz * zd[1]) * sg > 0 ? 1 : -1;   // quay side = sz * local z
      P.push(B.cx, 0, B.cz, rot);
      try {
        const N = 10, zOf = (t) => sz * (-hw + 2 * hw * t);
        for (let i = 0; i < N; i++) {
          const t0 = i / N, t1 = (i + 1) / N, y0 = profile(t0), y1 = profile(t1);
          P.quad(M.galleryRoof, [-hl, y0, zOf(t0)], [hl, y0, zOf(t0)], [hl, y1, zOf(t1)], [-hl, y1, zOf(t1)], [0, 1, 0], [[0, t0 * 3], [hl / 1.5, t0 * 3], [hl / 1.5, t1 * 3], [0, t1 * 3]]);
        }
        // end caps: a plain arch frame ring (thin beam) at both ends
        for (const x of [-hl, hl]) for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N; P.quad(M.galleryDark, [x - 0.1, profile(t0) - 0.4, zOf(t0)], [x + 0.1, profile(t0) - 0.4, zOf(t0)], [x + 0.1, profile(t1) - 0.4, zOf(t1)], [x - 0.1, profile(t1) - 0.4, zOf(t1)], [0, 1, 0]); }
        // the glazed quay side (clear panes 0.9 .. 3.4 m)
        const zq = zOf(1) - sz * 0.15;      // (n4spb: the glazed wall is a row of breakable bays below, one per post spacing; the source drew one 2 hl m quad and one solid box)
        // posts every 6 m on both long sides (instanced)
        const nP = Math.max(2, Math.round(2 * hl / 6)), st = 2 * hl / nP;
        for (let k = 0; k <= nP; k++) for (const side of [-1, 1]) {
          const lx = -hl + k * st, lz = zOf(side > 0 ? 0.96 : 0.04), w = { x: B.cx + B.ux * lx + zd[0] * lz, z: B.cz + B.uz * lx + zd[1] * lz };
          posts.push({ x: w.x, z: w.z, h: side > 0 ? 3.45 : 3.1 });
        }
        // the glazed wall: bays of one post spacing along the long axis (local x -hl .. hl at the lateral offset zq), collider 0.3 x 3.4 m each, panes 0.9 .. 3.4 m
        for (let k = 0; k < nP; k++) {
          const l0 = -hl + k * st, l1 = -hl + (k + 1) * st;
          glazed.push({ x0: B.cx + B.ux * l0 + zd[0] * zq, z0: B.cz + B.uz * l0 + zd[1] * zq, x1: B.cx + B.ux * l1 + zd[0] * zq, z1: B.cz + B.uz * l1 + zd[1] * zq, y: 0, u1: st / 3 });
        }
        svc.counts.galleries = (svc.counts.galleries || 0) + 1;
      } finally { P.pop(); }
    } catch (e) { console.error('[landmarksMarineFacade/galleries] gallery', id, e); }
  }
  // posts: ONE instanced list of a unit-height post scaled in y (quay side 3.45, land side 3.1)
  { const geo = partsGeos((Q) => { Q.col(M.galleryPost, 0, 0, 0, 1, 0.09, 0.09, 6, false); });
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), list = posts.map((p) => new THREE.Matrix4().compose(new THREE.Vector3(p.x, 0, p.z), q.setFromAxisAngle(up, 0), new THREE.Vector3(1, p.h, 1)));
    K.extraTris += addInstanced(ctx, K.root, 'lmmarin-gpost', geo, list).tris; }
  // n4spb: the glazed quay-side walls (0.3 x 3.4 m, 100 .. 190 m long beside the open water): breakable bays (collider flagged `fence`, panes, ONE knock record each, the gap is passable)
  if (glazed.length) {
    kBays(K, { name: 'lmmarin-gallery-glass', bays: glazed, far: 520, parts: [{ geo: unitPanel(0.9, 3.4, { u1: 2 }), mat: M.pane, name: 'pane', stretch: true, shadow: false, receive: false, noOutline: true }],
      collider: { y0: 0, y1: 3.4, thick: 0.3, e0: 0, e1: 0 }, rec: () => ({ kind: 'fence', mass: 380, h: 3.4, anchored: 14, hitK: 0.4, metal: true, minDv: 0 }) });
    svc.counts.galleryGlassBays = glazed.length;
  }
  elevated(K);
}

/** the elevated ferry gallery as a polyline tube in the port frame: (u, v) pairs */
function elevated(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics;
  const path = [[-19.5, 640], [-19.5, 856.5], [148, 856.5]];
  const DECK = 5.5, W = 4.4, GLASS0 = 6.0, GLASS1 = 8.6, ROOF = 9.0;
  const cols = [];
  for (let s = 0; s + 1 < path.length; s++) {
    const a = path[s], b = path[s + 1], du = b[0] - a[0], dv = b[1] - a[1], len = Math.hypot(du, dv), eu = du / len, ev = dv / len;
    const mid = FW((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), dir = [eu * U_DIR[0] + ev * V_DIR[0], eu * U_DIR[1] + ev * V_DIR[1]];
    const rot = rotYOf(dir[0], dir[1]), ext = s === 0 ? 0 : 0, hl = len / 2 + (s === 0 ? 0 : 0);
    P.push(mid.x, 0, mid.z, rot);
    try {
      const hw = W / 2, e0 = s === 1 ? -hw : 0, e1 = 0;                                            // the second leg starts at the corner of the first (overlap by the half width)
      P.box(M.girder, -hl + e0, hl, DECK - 0.8, DECK, -hw, hw, '', 2);                               // box girder under the deck
      P.box(M.girder, -hl + e0, hl, DECK, GLASS0, -hw, hw, 'b', 2);                                  // solid sill band
      P.box(M.tubeRoof, -hl + e0, hl, GLASS1, ROOF + 0.4, -hw - 0.15, hw + 0.15, '', 2);              // roof slab with a 0.15 m eave
      P.quad(M.tubeGlass, [-hl + e0, GLASS0, hw + 0.01], [hl, GLASS0, hw + 0.01], [hl, GLASS1, hw + 0.01], [-hl + e0, GLASS1, hw + 0.01], [0, 0, 1]);
      P.quad(M.tubeGlass, [hl, GLASS0, -hw - 0.01], [-hl + e0, GLASS0, -hw - 0.01], [-hl + e0, GLASS1, -hw - 0.01], [hl, GLASS1, -hw - 0.01], [0, 0, -1]);
      for (let x = -hl + e0 + 2; x < hl; x += 3) { P.box(M.girder, x - 0.04, x + 0.04, GLASS0, GLASS1, hw, hw + 0.05, 'k', 1); P.box(M.girder, x - 0.04, x + 0.04, GLASS0, GLASS1, -hw - 0.05, -hw, 'f', 1); }   // mullions every 3 m
      // columns every ~12 m
      const n = Math.max(1, Math.round(len / 12)), st = len / n;
      for (let k = (s === 0 ? 0 : 1); k <= n; k++) { const x = -hl + k * st; cols.push({ x: mid.x + dir[0] * x, z: mid.z + dir[1] * x }); }
    } finally { P.pop(); }
  }
  for (const c of cols) P.col(M.pier, c.x, c.z, 0, DECK - 0.8, 0.3, 0.3, 8, false);
  // end caps of the tube and two lift towers (blue-grey steel boxes 3 x 3 x 8.5 m) at the far end
  const end = FW(148, 856.5), endDir = [U_DIR[0], U_DIR[1]];
  P.push(end.x, 0, end.z, rotYOf(endDir[0], endDir[1]));
  try {
    P.box(M.girder, 0, 0.3, DECK - 0.8, ROOF + 0.4, -W / 2, W / 2, '', 2);
    for (const z of [-5.5, 5.5]) { P.box(M.girder, 1.5, 4.5, 0, 8.5, z - 1.5, z + 1.5, 'b', 2); P.box(M.tubeGlass, 1.6, 4.4, 5.0, 7.8, z - 1.55, z + 1.55, '', 1); }
  } finally { P.pop(); }
  ph.addBox(end.x + endDir[0] * 3, end.z + endDir[1] * 3, 3, 14, rotYOf(endDir[0], endDir[1]), 0, 9);
  svc.counts.elevatedColumns = cols.length;
}
