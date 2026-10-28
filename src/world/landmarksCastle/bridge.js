// landmarksCastle/bridge.js - the THREE-PART BRIDGE (Трёхчастный мост) in front of the castle portal: three short humped stone bridges (OSM decks w568786528 south, w568786525 south-west, w568786527 east-south-east,
// 4 m wide) fan out from the paved terrace in front of the gate across the restored Voskresensky canal (the moat water, OSM r15750440, belongs to environment).  Pale pink-grey granite fascias with a shallow arch,
// sett carriageways, granite posts + black iron railings (photos refs/summer-garden 111, 176) and the same railing along the two banks and the two small islands (OSM fences w459074433 / 34 / 35 / 37 / 568786516).
// The decks and the terrace are walk boxes; the railings are colliders.  The pedestrian approach footways of the group are replaced by this paving.
import { ROADS, BARRIERS } from '../data/city.js';
import * as L from '../layout.js';
import { pointIn } from './geo.js';
import * as THREE from 'three';
import { Parts } from './kit.js';
import { knockBays } from '../lib/fence-bays.js';

const DECKS = ['w568786528', 'w568786525', 'w568786527'];
const FENCES = ['w459074435', 'w459074437', 'w459074433', 'w459074434', 'w568786516'];
export const TERRACE = [[-743.7, -832.3], [-746.9, -826.2], [-741.1, -824.3], [-731.2, -827.5], [-728.5, -833.6], [-733.6, -835.8]];

/** WATER IS REACHABLE (docs/AREAS.md 13.7): a railing (granite posts + two iron tubes + pickets) along a -> b is a row of BREAKABLE BAYS (one per post-to-post span, lib/fence-bays.js), pushed to `out`; build() makes them at the end.
 *  o: { h, gap, y0 | yb(t) (the foot along the way: the humped decks), cy1, cth (the collider: top, thickness) } */
export function railBays(out, a, b, o = {}) {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.3) return;
  const h = o.h ?? 1.05, gap = o.gap ?? 2.8, y0 = o.y0 ?? 0, yb = o.yb, n = Math.max(1, Math.round(len / gap));
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n, l = len / n, pk = Math.max(2, Math.round(l / 0.22));
    out.push({ x0: a[0] + dx * t0, z0: a[1] + dz * t0, x1: a[0] + dx * t1, z1: a[1] + dz * t1, y: yb ? yb(t0) : y0, ye: yb ? yb(t1) : y0, h, first: k === 0, cy1: o.cy1 ?? 1.3, cth: o.cth ?? 0.3, pickets: Array.from({ length: pk - 1 }, (_, i) => (i + 1) / pk) });
  }
}
function railParts(M, bays) {
  const out = [], templ = (P) => { const g = new THREE.Group(); P.build(g, { name: 'lmCastle-rail' }); return g.children.map((m) => ({ geo: m.geometry, mat: m.material })); };
  for (const h of [...new Set(bays.map((q) => q.h))]) {
    const post = new Parts(); post.box(M.graniteWarm, -0.17, 0.17, 0, h, -0.17, 0.17, 'b'); post.box(M.granite, -0.21, 0.21, h, h + 0.1, -0.21, 0.21, 'b');
    templ(post).forEach((t, i) => out.push({ geo: t.geo, mat: t.mat, name: 'post' + h + '-' + i, far: 320, ats: (q) => (q.first ? ['start', 'end'] : ['end']), when: (q) => q.h === h }));
    const tube = new Parts(); tube.cyl(M.iron, [0, h - 0.12, 0], [1, h - 0.12, 0], 0.028, 0.028, 5, false); tube.cyl(M.iron, [0, 0.3, 0], [1, 0.3, 0], 0.025, 0.025, 5, false);
    templ(tube).forEach((t, i) => out.push({ geo: t.geo, mat: t.mat, name: 'tube' + h + '-' + i, far: 320, stretch: true, when: (q) => q.h === h }));
    const pick = new Parts(); pick.box(M.iron, -0.012, 0.012, 0.3, h - 0.12, -0.012, 0.012, 'tb');
    templ(pick).forEach((t, i) => out.push({ geo: t.geo, mat: t.mat, name: 'pick' + h + '-' + i, far: 240, ats: (q) => q.pickets, when: (q) => q.h === h }));
  }
  return out;
}

export function build(K, M, D, svc) {
  const P = K.P, ph = K.ctx.physics, rbays = [];
  const hump = (t) => 0.14 + 0.22 * (1 - (2 * t - 1) ** 2);
  for (const id of DECKS) {
    const r = ROADS.find((q) => q.id === id); if (!r) continue;
    const a = [r.pts[0], r.pts[1]], b = [r.pts[r.pts.length - 2], r.pts[r.pts.length - 1]];
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), rot = Math.atan2(dx, dz), hw = 2.2, N = 8;
    P.push(a[0], 0, a[1], rot);
    try {
      for (let k = 0; k < N; k++) {
        const t0 = k / N, t1 = (k + 1) / N, z0 = len * t0, z1 = len * t1, y0 = hump(t0), y1 = hump(t1);
        P.quad(M.sett, [-hw, y0, z0], [hw, y0, z0], [hw, y1, z1], [-hw, y1, z1], [0, 1, 0], [[0, z0 / 2], [2, z0 / 2], [2, z1 / 2], [0, z1 / 2]]);
        for (const s of [-1, 1]) P.quad(M.marblePink, [s * hw, -1.3, z0], [s * hw, -1.3, z1], [s * hw, y1, z1], [s * hw, y0, z0], [s, 0, 0]);
        P.quad(M.graniteDark, [-hw, -1.2, z0], [hw, -1.2, z0], [hw, -1.2, z1], [-hw, -1.2, z1], [0, -1, 0]);
        const c = [a[0] + dx * (t0 + t1) / 2, a[1] + dz * (t0 + t1) / 2];
        ph.addWalkBox(c[0], c[1], hw * 2, len / N + 0.05, rot, Math.max(y0, y1), -1.3);
      }
    } finally { P.pop(); }
    for (const s of [-1, 1]) {
      const ox = Math.cos(rot) * s * (hw - 0.05) * -1, oz = Math.sin(rot) * s * (hw - 0.05);
      // lateral offset vector of the local +x axis: (cos rot, -sin rot)
      const lx = Math.cos(rot) * s * (hw - 0.17), lz = -Math.sin(rot) * s * (hw - 0.17);
      railBays(rbays, [a[0] + lx, a[1] + lz], [b[0] + lx, b[1] + lz], { h: 1.05, gap: 2.6, yb: (t) => hump(t), cy1: 1.3, cth: 0.35 });
      void ox; void oz;
    }
  }
  // the terrace in front of the portal (pink-grey setts), railings on both banks and the islands
  // paving of the terrace: 1.2 m cells that are inside the polygon and clear of every carriageway (the service strips to the bridges stay asphalt: road integrity rules)
  { const cover = K.ctx.services.streets && K.ctx.services.streets.net && K.ctx.services.streets.net.cover;
    const onRoad = (x, z) => (cover ? cover(x, z, {}) >= -0.5 : L.isOnRoad(x, z, 0.1));
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of TERRACE) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
    const c = 1.2; let cells = 0;
    for (let x = x0; x < x1; x += c) for (let z = z0; z < z1; z += c) {
      const cx = x + c / 2, cz = z + c / 2; if (!pointIn(TERRACE, cx, cz) || onRoad(cx, cz) || [[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]].some(([a, b]) => onRoad(cx + a * c, cz + b * c))) continue;
      P.quad(M.settPink, [x, 0.07, z], [x + c, 0.07, z], [x + c, 0.07, z + c], [x, 0.07, z + c], [0, 1, 0], [[x / 2, z / 2], [(x + c) / 2, z / 2], [(x + c) / 2, (z + c) / 2], [x / 2, (z + c) / 2]]); cells++;
    }
    svc.terraceCells = cells; }
  const tc = TERRACE.reduce((s, p) => [s[0] + p[0] / TERRACE.length, s[1] + p[1] / TERRACE.length], [0, 0]);
  let n = 0;
  for (const id of FENCES) {
    const f = BARRIERS.find((q) => q.id === id); if (!f) continue;
    for (let i = 0; i + 3 < f.pts.length; i += 2) {
      const a = [f.pts[i], f.pts[i + 1]], b = [f.pts[i + 2], f.pts[i + 3]], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.5) continue;
      railBays(rbays, a, b, { h: 1.0, gap: 2.7, y0: 0.1, cy1: 1.2, cth: 0.3 }); n++;
    }
  }
  if (rbays.length) {
    const r = knockBays(K.ctx, { name: 'lmCastle-rail', bays: rbays, parts: railParts(M, rbays), far: 320,
      collider: (q) => ({ y0: 0, y1: q.cy1, thick: q.cth, e0: 0.05, e1: 0.05 }),
      rec: (q) => ({ kind: 'fence', mass: 160, h: q.h, r: 0.08, anchored: 14, hitK: 0.3, metal: true, minDv: 0 }) });
    void r;
  }
  void ph;
  svc.bridge = { terrace: tc, decks: DECKS, fenceSegments: n, railBays: rbays.length };
}
