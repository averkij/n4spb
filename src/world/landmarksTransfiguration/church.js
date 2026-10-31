// landmarksTransfiguration/church.js - the CHURCH of the Transfiguration (Храм Преображения Господня, K. Thon 1840-45, OSM w28370423) as it stands today: a rectangular ochre-stuccoed hall (24.6 x 13.9 m)
// WITHOUT its five gilded domes (demolished 15 Apr 1930; the third floor was added after that): a rusticated ground floor on a pale granite plinth, TRIPLE Corinthian column groups at the four corners and
// column PAIRS on every face under projecting entablature blocks, the white panelled attic, a low hip roof behind it, and ONE low octagonal drum with a plain cross where the central dome was.  The SE / NW long
// faces carry the 5-arch arcade window between the pairs with the shaped baroque parapet above it (photos 65 14 12), the SW face the portal (3 granite steps, the name board «ХРАМ ПРЕОБРАЖЕНИЯ ГОСПОДНЯ», the double
// arched window, the aedicule window), the NE face the same upper storey with two barred windows below instead of the door.  The doors are shut: exterior only, a working church.
// Frame CH (frame.js): +z = the SW entrance end, +x = SE.  Everything is built with local y = 0 at the terrace top (the whole church is pushed up by PL.TY).
// Heights [E from photos 65 / 14 / 12, OSM 9.9 m for the walls]: plinth 0.625, rusticated floor to 3.125, string course 3.375, columns 3.5-7.65, entablature 7.65-8.55, attic to 10.0, ridge 10.9, drum wall 13.0, cap 14.3, cross 16.4.
// Collectors: K.P = the shell (seen from far, LOD 1100 m), K.N = the near detail (window frames, decals, capitals' leaves, panels, sill slabs, boards: LOD 350 m).
import { CH, PL } from './frame.js';
import { band, ringEdges, frameOf } from './kit.js';
import { frustum, cross, archPts, shapeOf, frameRing } from './geo.js';
import { ATLAS } from './art.js';
import { addPolyColliders } from '../lib/massing.js';
import * as THREE from 'three';

const TAU = Math.PI * 2;
const { HW, HL, plinth, rusticTop, stringTop, capBase, capTop, entTop, corn, atticTop } = PL;

const onAll = (Ps, x, y, z, rot, fn) => { for (const P of Ps) P.push(x, y, z, rot); try { return fn(); } finally { for (const P of Ps) P.pop(); } };
const ss = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

/** a decal quad in the current facade frame (x along, y up, z out) mapped to an atlas rectangle */
function decal(N, M, x0, x1, y0, y1, z, rect) {
  const [u0, v0, u1, v1] = rect;
  N.quad(M.win, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
}
/** a round-headed decal: the outline `pts` (facade plane) filled with the atlas rectangle mapped over its bounding box */
function archDecal(N, M, pts, z, rect) {
  const g = new THREE.ShapeGeometry(shapeOf(pts), 6);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const pa = g.attributes.position, ua = g.attributes.uv, [u0, v0, u1, v1] = rect;
  for (let i = 0; i < pa.count; i++) ua.setXY(i, u0 + (pa.getX(i) - x0) / (x1 - x0) * (u1 - u0), v0 + (pa.getY(i) - y0) / (y1 - y0) * (v1 - v0));
  N.geo(M.win, g, 0, 0, z); g.dispose();
}
const rectPts = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** a barred rectangular window with its white surround and sill: centre u, bottom y0, size w x h */
function rectWindow(N, M, u, y0, w, h, o = {}) {
  const fw = o.fw ?? 0.16, rect = o.rect || ATLAS.rect;
  decal(N, M, u - w / 2, u + w / 2, y0, y0 + h, 0.02, rect);
  frameRing(N, M.white, rectPts(u - w / 2 - fw, y0 - fw, u + w / 2 + fw, y0 + h + fw), rectPts(u - w / 2, y0, u + w / 2, y0 + h), 0, 0.07);
  if (o.sill !== false) N.box(M.white, u - w / 2 - fw - 0.08, u + w / 2 + fw + 0.08, y0 - fw - 0.1, y0 - fw, 0, 0.17);
  if (o.lintel) N.box(M.white, u - w / 2 - fw - 0.1, u + w / 2 + fw + 0.1, y0 + h + fw, y0 + h + fw + 0.13, 0, 0.2);
}
/** a round-headed window (bottom y0, total height h incl. the arch) with a white archivolt and a keystone */
function archWindow(N, M, u, y0, w, h, o = {}) {
  const fw = o.fw ?? 0.17;
  archDecal(N, M, archPts(u, y0, w, h, 8), 0.02, ATLAS.arch);
  frameRing(N, M.white, archPts(u, y0 - fw * 0.5, w + 2 * fw, h + fw * 1.5, 8), archPts(u, y0, w, h, 8), 0, 0.07);
  N.box(M.white, u - 0.1, u + 0.1, y0 + h + fw * 0.5 - 0.02, y0 + h + fw * 1.5 + 0.12, 0, 0.14);                  // keystone
  if (o.sill !== false) N.box(M.white, u - w / 2 - fw - 0.08, u + w / 2 + fw + 0.08, y0 - fw * 0.5 - 0.1, y0 - fw * 0.5, 0, 0.17);
}

/** a Corinthian column in the CURRENT frame: base y yb, shaft up to the capital at capBase, abacus up to capTop */
function column(Ps, M, x, z, yb, r = 0.31) {
  const [P, N] = Ps;
  P.box(M.white, x - 0.43, x + 0.43, yb, yb + 0.12, z - 0.43, z + 0.43, 'b');
  P.cyl(M.white, [x, yb + 0.12, z], [x, yb + 0.32, z], r + 0.1, r + 0.06, 12, true);
  P.cyl(M.white, [x, yb + 0.32, z], [x, capBase, z], r, r * 0.88, 12, false);                                        // the tapering shaft
  P.cyl(M.white, [x, capBase, z], [x, capBase + 0.5, z], r * 0.88, r * 1.45, 12, true);                              // the bell
  P.box(M.white, x - 0.5, x + 0.5, capBase + 0.5, capTop, z - 0.5, z + 0.5);                                         // the abacus
  for (let k = 0; k < 8; k++) {                                                                                     // acanthus leaves (tilted wedges)
    const a = k * TAU / 8;
    N.cyl(M.white, [x + Math.sin(a) * r * 0.9, capBase + 0.05, z + Math.cos(a) * r * 0.9], [x + Math.sin(a) * r * 1.5, capBase + 0.5, z + Math.cos(a) * r * 1.5], 0.09, 0.03, 4, false);
  }
}

/** the shaped baroque parapet over the bay B of a long face: top profile y(u) from u0 to u1, high end at u0 (flip: at u1) */
function gableProfile(u0, u1, flip) {
  const pts = [], n = Math.ceil((u1 - u0) / 0.3), hi = 10.45, mid = 9.85, lo = 9.3;
  for (let i = 0; i <= n; i++) {
    const u = u0 + (u1 - u0) * i / n, t = flip ? (u1 - u) / (u1 - u0) : (u - u0) / (u1 - u0);
    pts.push([u, hi - (hi - mid) * ss((t - 0.2) / 0.18) - (mid - lo) * ss((t - 0.62) / 0.2)]);
  }
  return pts;
}

export function build(K) {
  const { ctx, M, P, N, svc } = K, Ps = [P, N], ph = ctx.physics;
  const ring = [[-HW, -HL], [HW, -HL], [HW, HL], [-HW, HL]];
  const edges = ringEdges({ o: ring.flat(), h: [] });
  const labels = ctx.services.labels;
  for (const C of Ps) C.push(CH.ox, PL.TY, CH.oz, CH.rot);

  // ---------------------------------------------------------------- bands round the plan: plinth, rusticated floor, string course, plaster wall
  band(P, edges, 0, plinth, 0.1, { front: M.granite, top: M.granite }, { uvs: 2.5 });
  band(P, edges, plinth, rusticTop, 0, { front: M.rustic }, { uvs: 2.5 });
  band(P, edges, rusticTop, stringTop, 0.14, { front: M.white, top: M.white, under: M.white });
  band(P, edges, stringTop, corn, 0, { front: M.plaster }, { uvs: 3 });

  // ---------------------------------------------------------------- the four corners: triple column groups under a corner block, the raised attic pedestal
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = sx * HW, cz = sz * HL;
    column(Ps, M, cx, cz, stringTop, 0.36);
    column(Ps, M, sx * (HW - PL.flank), sz * (HL + 0.26), stringTop);                       // flank on the short face
    column(Ps, M, sx * (HW + 0.26), sz * (HL - PL.flank), stringTop);                       // flank on the long face
    // entablature block over the group (plan: 0.85 beyond the corner, 1.9 along both faces) and its cornice slab
    const bx0 = sx > 0 ? cx - 1.9 : cx - 0.85, bx1 = sx > 0 ? cx + 0.85 : cx + 1.9, bz0 = sz > 0 ? cz - 1.9 : cz - 0.85, bz1 = sz > 0 ? cz + 0.85 : cz + 1.9;
    P.box(M.white, bx0, bx1, 7.65, corn, bz0, bz1, 'b');
    P.box(M.white, bx0 - 0.12 * (sx > 0 ? 0 : 1), bx1 + 0.12 * (sx > 0 ? 1 : 0), corn, entTop, bz0 - 0.12 * (sz > 0 ? 0 : 1), bz1 + 0.12 * (sz > 0 ? 1 : 0), 'b');
    // the raised pedestal of the attic over the corner (white, 2.4 m square, +0.55 m) with a coping
    const px0 = sx > 0 ? cx - 2.4 : cx - 0.05, px1 = sx > 0 ? cx + 0.05 : cx + 2.4, pz0 = sz > 0 ? cz - 2.4 : cz - 0.05, pz1 = sz > 0 ? cz + 0.05 : cz + 2.4;
    P.box(M.white, px0, px1, entTop, atticTop + 0.55, pz0, pz1, 'b');
    P.box(M.white, px0 - 0.1, px1 + 0.1, atticTop + 0.55, atticTop + 0.7, pz0 - 0.1, pz1 + 0.1, 'b');
  }

  // ---------------------------------------------------------------- the faces
  for (const e of edges) {
    const f = frameOf(e), Lf = f.len, long = Lf > 20, nx = e.n[0], nz = e.n[1];
    const kind = nz > 0.5 ? 'sw' : nz < -0.5 ? 'ne' : nx > 0.5 ? 'se' : 'nw';
    const c = Lf / 2;
    onAll(Ps, f.x, 0, f.z, f.rot, () => {
      // -------- the column pairs and their entablature blocks (the corner groups are drawn above)
      const pairs = long ? [PL.pairAt, Lf - PL.pairAt] : [PL.pairShort, Lf - PL.pairShort];
      for (const pu of pairs) {
        column(Ps, M, pu - PL.pairGap / 2, 0.3, stringTop); column(Ps, M, pu + PL.pairGap / 2, 0.3, stringTop);
        P.box(M.white, pu - 0.95, pu + 0.95, 7.65, corn, 0, 0.86, 'bk');
        P.box(M.white, pu - 1.07, pu + 1.07, corn, entTop, 0, 0.98, 'bk');
      }
      // -------- architrave band and cornice between the blocks (end bays; the whole short face)
      const spans = long ? [[1.9, pairs[0] - 1.07], [pairs[1] + 1.07, Lf - 1.9]] : [[1.9, pairs[0] - 1.07], [pairs[0] + 1.07, pairs[1] - 1.07], [pairs[1] + 1.07, Lf - 1.9]];
      for (const [a, b] of spans) {
        P.box(M.white, a, b, 7.65, corn, 0, 0.08, 'bkl' + 'r');
        P.box(M.white, a, b, corn, entTop, 0, 0.42, 'bklr');
      }
      const attic = long ? [[2.4, pairs[0] + 1.07], [pairs[1] - 1.07, Lf - 2.4]] : [[2.4, Lf - 2.4]];
      for (const [a, b] of attic) {
        P.box(M.white, a, b, entTop, atticTop, -0.28, -0.02, 'bkl' + 'r');                                // the attic wall (thick: the inner face is seen from the roof)
        P.box(M.white, a - 0.06, b + 0.06, atticTop, atticTop + 0.15, -0.34, 0.04, 'b');                // coping
        for (let u = a + 0.45; u + 1.5 < b; u += 2.3) N.box(M.white, u, u + 1.5, entTop + 0.3, atticTop - 0.3, -0.02, 0.03, 'bklrk');   // raised panels
      }
      if (long) {
        // -------- the shaped baroque parapet over the bay B: plaster polygon from the cornice line up to the profile, a white moulding along its top, the pier block
        const g0 = pairs[0] + 1.07 - 0.1, g1 = pairs[1] - 1.07 + 0.1, flip = kind === 'nw', prof = gableProfile(g0, g1, flip);
        const poly = [[g0, corn], [g1, corn], ...prof.slice().reverse()];
        P.extrude(M.plaster, shapeOf(poly), -0.3, 0.3, 3, 4);
        const strip = [...prof, ...prof.slice().reverse().map(([u, y]) => [u, y - 0.2])];
        P.extrude(M.white, shapeOf(strip), 0, 0.09, 1, 4);
        const pu = flip ? g1 - (g1 - g0) * 0.46 : g0 + (g1 - g0) * 0.46, py = prof.reduce((m, p) => (Math.abs(p[0] - pu) < Math.abs(m[0] - pu) ? p : m), prof[0])[1];
        P.box(M.white, pu - 0.7, pu + 0.7, py - 0.1, py + 0.6, -0.3, 0.45, 'b');
        P.box(M.white, pu - 0.82, pu + 0.82, py + 0.6, py + 0.76, -0.4, 0.55, 'b');
        // -------- the grey-blue downpipes of the end bays (photos 65 / 12), running from the plinth ledge to the cornice
        for (const u of [2.3, Lf - 2.3]) N.cyl(M.zinc, [u, 0.62, 0.1], [u, 8.15, 0.1], 0.06, 0.06, 6, false);
        // -------- windows of the long faces
        const lw = [3.65, c - 3.6, c, c + 3.6, Lf - 3.65];
        for (const u of lw) rectWindow(N, M, u, 1.0, 1.0, 1.5, { lintel: true });
        for (const u of [3.65, Lf - 3.65]) archWindow(N, M, u, 4.15, 0.95, 1.95);
        for (let k = -2; k <= 2; k++) archWindow(N, M, c + k * 1.6, 4.15, 0.95, 1.85, { sill: false });
        N.box(M.white, c - 3.3 - 0.9, c + 3.3 + 0.9, 3.95, 4.05, 0, 0.2);                                  // the continuous sill of the arcade
        for (const k of [-1.5, -0.5, 0.5, 1.5]) N.cyl(M.white, [c + k * 1.6, 4.15, 0.1], [c + k * 1.6, 5.75, 0.1], 0.07, 0.07, 6, false);            // colonettes between the arches
        rectWindow(N, M, c, 6.95, 0.9, 1.2, { rect: ATLAS.small, fw: 0.14 });
        for (const s of [-1, 1]) rectWindow(N, M, c + s * 3.3, 7.0, 0.8, 1.0, { rect: ATLAS.small, fw: 0.12 });
      } else {
        // -------- short faces: the upper storey between the pairs
        const inner = [pairs[0] + 1.07, pairs[1] - 1.07];
        for (const s of [-1, 1]) archWindow(N, M, c + s * 0.64, 4.45, 1.0, 2.15, { sill: false });
        N.box(M.white, c - 1.75, c + 1.75, 4.2, 4.3, 0, 0.22);                                                // the sill slab
        N.cyl(M.white, [c, 4.45, 0.1], [c, 6.3, 0.1], 0.1, 0.1, 6, false);                                   // the central colonette
        rectWindow(N, M, c, 6.9, 0.95, 1.1, { rect: ATLAS.small, fw: 0.15 });
        for (const s of [-1, 1]) rectWindow(N, M, c + s * 2.2, 7.0, 0.7, 0.9, { rect: ATLAS.small, fw: 0.11 });
        void inner;
        if (kind === 'sw') {
          // -------- the portal: door, pilasters, lintel, the name board, three granite steps
          decal(N, M, c - 0.75, c + 0.75, 0.45, 3.05, 0.03, ATLAS.door);
          for (const s of [-1, 1]) P.box(M.white, c + s * 1.05 - 0.14, c + s * 1.05 + 0.14, 0.45, 3.35, 0, 0.17, 'b');
          P.box(M.white, c - 1.3, c + 1.3, 3.05, 3.35, 0, 0.3, 'b');
          const wp = CH.W(0, HL), nxw = Math.sin(CH.rot), nzw = Math.cos(CH.rot);
          if (!labels || labels.reserve('w28370423', wp.x, PL.TY + 3.7, wp.z, 3.6, 0.39, nxw, nzw, 'plate')) {
            decal(N, M, c - 1.8, c + 1.8, 3.5, 3.89, 0.05, ATLAS.name);
            N.box(M.white, c - 1.84, c + 1.84, 3.46, 3.5, 0, 0.07);
          }
          for (let k = 0; k < 3; k++) P.box(M.granite, c - 1.9, c + 1.9, 0, 0.45 - 0.15 * k, 0.43 * k, 0.43 * (k + 1), 'k', 2.5);
        } else {
          for (const s of [-1, 1]) rectWindow(N, M, c + s * 1.9, 1.0, 1.0, 1.5, { lintel: true });
        }
      }
    });
  }

  // ---------------------------------------------------------------- the roof: a low zinc hip behind the attic, and the drum with the cross
  const ex = HW - 0.3, ez = HL - 0.3, rg = ez - ex, ry0 = 9.8, ry1 = 10.9;
  P.fan(M.zinc, [[-ex, ry0, ez], [ex, ry0, ez], [0, ry1, rg]], [0, 0.55, 0.83]);
  P.fan(M.zinc, [[ex, ry0, -ez], [-ex, ry0, -ez], [0, ry1, -rg]], [0, 0.55, -0.83]);
  P.quad(M.zinc, [ex, ry0, ez], [ex, ry0, -ez], [0, ry1, -rg], [0, ry1, rg], [0.5, 0.86, 0]);
  P.quad(M.zinc, [-ex, ry0, -ez], [-ex, ry0, ez], [0, ry1, rg], [0, ry1, -rg], [-0.5, 0.86, 0]);
  const R = PL.drumR, a0 = -Math.PI / 8, ap = R * Math.cos(Math.PI / 8);
  frustum(P, M.plaster, 0, 0, PL.drumY0, PL.drumY1, 8, R, R, a0, 4, 1);
  frustum(P, M.white, 0, 0, PL.drumY1, PL.drumCornY, 8, R + 0.22, R + 0.22, a0, 4, 0.1, { capTop: M.white });
  frustum(P, M.cap, 0, 0, PL.drumCornY, PL.drumCapY, 8, R + 0.1, 0.55, a0, 2, 1, { capTop: M.cap });
  frustum(P, M.white, 0, 0, PL.drumY0 + 0.4, PL.drumY0 + 0.7, 8, R + 0.12, R + 0.12, a0, 4, 0.1);
  for (let k = 0; k < 8; k++) {                                                                               // a small window on every face of the drum, white surround
    const a = k * Math.PI / 4;
    onAll(Ps, Math.sin(a) * (ap + 0.01), 0, Math.cos(a) * (ap + 0.01), a, () => {
      rectWindow(N, M, 0, 11.0, 0.8, 1.15, { rect: ATLAS.small, fw: 0.13, sill: false });
      N.box(M.white, -0.62, 0.62, 10.8, 10.9, 0, 0.18);
    });
  }
  cross(P, M.cross, 0, PL.drumCapY + 0.05, 0, PL.crossH, 0);
  P.cyl(M.cap, [0, PL.drumCapY, 0], [0, PL.drumCapY + 0.18, 0], 0.4, 0.3, 8, true);

  for (const C of Ps) C.pop();

  // ---------------------------------------------------------------- colliders: the ring 0.35 m out (the columns stand 0.6 m in front of the wall), the portal steps as stairs
  const wring = ring.map(([x, z]) => { const q = CH.W(x + Math.sign(x) * 0.4, z + Math.sign(z) * 0.4); return [q.x, q.z]; });
  addPolyColliders(ctx, { o: wring.flat(), h: [] }, PL.TY, PL.TY + 16, 0.7);
  CH.stairs(ph, 0, HL + 0.645, 3.8, 1.29, Math.PI, PL.TY, PL.TY + 0.45, 3);
  svc.church = { x: CH.ox, z: CH.oz, h: PL.TY + PL.drumCapY + PL.crossH };
}
