// landmarksZhdanovka/house3.js - ZHDANOVSKAYA EMBANKMENT No. 3 (1911-13, technician I. I. Demikelli; corner with Bolshoy pr. P.S. beside the Tuchkov bridge; OSM w55413101 + 6 parts, 6 levels, wikidata Q124639909; A. N. Tolstoy lived
// here 1923-28).  Photo m03 (refs/.../misc, seen from the Tuchkov bridge side): a six-storey block of grey-olive plaster (#a9a58a) with cream window surrounds and little garland rosettes, a shop ground floor, three
// oriels on the long front over floors 2-6, a ZINC MANSARD (#838e99) with dormers over the whole front, and at the north-west end a corner turret with a pointed zinc roof over the chamfered corner (e43-e47).
// The OSM outline is a U of wings round a courtyard (61 vertices): the street fronts are the stepped chain e34-e42 (SW, to the river), the east front e33 (to Bolshoy pr. P.S.) and the corner chamfer; all other
// walls are courtyard walls.  Cornice 21.0-21.8 m, mansard rise 3.2 m.  REAL windows (holes, reveals, recessed glass) on every front and in the oriels; shop brand signs of the photo are NOT drawn.
import { edgeFrame } from './frame.js';
import { envelope } from './envelope.js';
import { front } from './facade.js';
import { reserver, SIGNS, stepper } from './labels.js';
import { ledge, wallHoles, windowOpen, surround, downpipe } from './geom.js';

const HG = 4.0, HF = 3.4, HW = HG + 5 * HF, HC = HW + 0.8, MR = 3.2, MRUN = 1.5, DECK = 3.5;
const FRONT = [34, 36, 38, 40, 42], JOG = [35, 37, 39, 41, 43, 44, 45, 46, 47], EAST = [33], NW = [48, 52, 56];

/** a three-sided oriel level in the edge frame: plaster flanks, a front with two real windows at depth `proj` */
function oriel(P, M, cx, w, proj, run, y0, y1, o) {
  const hw = w / 2, fw = hw - run, hl = Math.hypot(proj, run), mat = M.o3f, hM = mat.__atlas.hM;
  const ww = 0.82, wy0 = y0 + 0.62, wy1 = y0 + 2.62;
  P.push(cx - fw, 0, proj, 0);
  const holes = [0.5, 1.5].map((q) => ({ x0: q * fw - ww / 2, x1: q * fw + ww / 2, y0: wy0, y1: wy1 }));
  wallHoles(P, mat, 0, 2 * fw, y0, y1, holes, (x, y) => [x / 2.94, Math.min(1, (y - y0) / hM)]);
  holes.forEach((h, i) => windowOpen(P, M.cream, [M.g3a, M.g3b][(i + o.k) % 2], h.x0, h.x1, h.y0, h.y1, 0.2));
  P.ranged(260, () => holes.forEach((h) => { surround(P, M.cream, h.x0, h.x1, h.y0, h.y1, 0.07, 0.04, 1); P.box(M.cream, h.x0 - 0.08, h.x1 + 0.08, h.y0 - 0.09, h.y0 + 0.02, 0, 0.13, 'k', 1); }));
  P.pop();
  P.quad(mat, [cx + fw, y0, proj], [cx + hw, y0, 0], [cx + hw, y1, 0], [cx + fw, y1, proj], [proj / hl, 0, run / hl], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.quad(mat, [cx - hw, y0, 0], [cx - fw, y0, proj], [cx - fw, y1, proj], [cx - hw, y1, 0], [-proj / hl, 0, run / hl], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  if (o.top) P.fan(M.zinc, [[cx - hw, y1, 0], [cx - fw, y1, proj], [cx + fw, y1, proj], [cx + hw, y1, 0]], [0, 1, 0], (p) => [p[0], p[2]]);
  if (o.bottom) P.fan(M.olive0 || M.cream, [[cx - hw, y0, 0], [cx + hw, y0, 0], [cx + fw, y0, proj], [cx - fw, y0, proj]], [0, -1, 0], (p) => [p[0], p[2]]);
}

/** the zinc mansard over one front in the edge frame (a sloped skirt, a flat deck, the back, the end caps) with a glazed dormer per ~5.2 m (zinc cheeks, a flat zinc cap) */
function mansard(P, M, len) {
  const yT = HC + MR, zb = -MRUN, zd = -(MRUN + DECK);
  P.quad(M.zinc, [0, HC, 0], [len, HC, 0], [len, yT, zb], [0, yT, zb], [0, MRUN / Math.hypot(MR, MRUN), MR / Math.hypot(MR, MRUN)], [[0, 0], [len / 1.4, 0], [len / 1.4, 2], [0, 2]]);
  P.quad(M.zinc, [0, yT, zb], [len, yT, zb], [len, yT, zd], [0, yT, zd], [0, 1, 0]);
  P.quad(M.zinc, [0, yT, zd], [len, yT, zd], [len, HC, zd], [0, HC, zd], [0, 0, -1]);
  for (const [x, s] of [[0, -1], [len, 1]]) P.fan(M.zinc, [[x, HC, 0], [x, yT, zb], [x, yT, zd], [x, HC, zd]], [s, 0, 0]);
  P.ranged(420, () => {
    const nd = Math.floor(len / 5.2);
    for (let k = 0; k < nd; k++) {
      const cx = (k + 0.5) * len / nd, w = 1.5, y0 = HC + 0.65, y1 = y0 + 1.55, zf = -0.1;
      P.quad(M.dormer, [cx - w / 2, y0, zf], [cx + w / 2, y0, zf], [cx + w / 2, y1, zf], [cx - w / 2, y1, zf], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      for (const sx of [-1, 1]) P.quad(M.zinc, [cx + sx * w / 2, y0, zf], [cx + sx * w / 2, y0, zf - 1.1], [cx + sx * w / 2, y1, zf - 1.1], [cx + sx * w / 2, y1, zf], [sx, 0, 0]);
      P.quad(M.zinc, [cx - w / 2 - 0.12, y1, zf + 0.12], [cx + w / 2 + 0.12, y1, zf + 0.12], [cx + w / 2 + 0.12, y1 + 0.1, zf - 1.1], [cx - w / 2 - 0.12, y1 + 0.1, zf - 1.1], [0, 1, 0]);
      P.box(M.cream, cx - w / 2 - 0.08, cx + w / 2 + 0.08, y1 - 0.08, y1 + 0.06, zf, zf + 0.12, 'k', 1);
    }
  });
}

export function build(K, fp) {
  const { P, M, svc } = K, E = fp.edges;
  const street = new Set([...FRONT, ...EAST]), jog = new Set(JOG);
  K.shared.h3 = { front: FRONT };
  envelope(K, fp, { Hw: HW, Hc: HC, skip: new Set([...street, ...jog]), roofMat: M.iron });
  const win = { w: 1.1, y0: 0.8, y1: 2.7, types: [M.g3a, M.g3b, M.g3c], rev: M.cream, d: 0.26, sill: M.cream, sillExt: 0.1, surround: M.cream, sw: 0.1, spr: 0.04 };
  const DOORS = { 42: [3], 33: [3], 34: [2] };                                                 // entrance axes [E]
  const rowsW = (i) => [{ mat: M.o3g, h: HG, win: { w: 1.5, y0: 0.9, y1: 3.2, types: [M.g3s], rev: M.stone, d: 0.3, sill: M.stone, sillExt: 0.12, surround: M.stone, sw: 0.12, spr: 0.05,
      over: Object.fromEntries((DOORS[i] || []).map((k) => [k, { w: 1.4, y0: 0, y1: 2.55, types: [[M.gd1, M.gd3][k % 2]], door: true }])), fascia: { mat: M.slate, trim: M.cream, y0: 3.4, h: 0.5, signs: SIGNS(M) } } },
    ...Array.from({ length: 5 }, () => ({ mat: M.o3f, h: HF, win }))];
  const rowsP = [{ mat: M.o3g, h: HG }, ...Array.from({ length: 5 }, () => ({ mat: M.o3f, h: HF }))];
  // ---- the jogs between the stepped fronts: plain olive floors (no windows)
  for (const i of JOG) {
    const e = E[i]; if (!e || e.len < 0.25) continue;
    const f = edgeFrame(e);
    P.push(f.S.x, 0, f.S.z, f.rot); P.far = Infinity;
    front(P, M, { len: f.len, pitch: Math.max(2.94, f.len), seed: 3 }, rowsP);
    ledge(P, M.cream, f.len, HW, HC, 0.55, 0, 'k');
    P.pop();
  }
  P.far = Infinity;
  for (const i of [...FRONT, ...EAST]) {
    const e = E[i]; if (!e || e.len < 0.25) continue;
    const f = edgeFrame(e), len = f.len;
    P.push(f.S.x, 0, f.S.z, f.rot);
    P.far = Infinity;
    front(P, M, { len, seed: 30 + i, reserve: reserver(K.ctx, 'w55413101', f), stepMat: M.stone, canopyMat: M.cream, walk: stepper(K.ctx, f) }, len < 2.2 ? rowsP : rowsW(i));
    ledge(P, M.cream, len, HW, HC, 0.55, 0, 'k');
    P.ranged(300, () => {
      for (let k = 1; k < 6; k++) ledge(P, M.cream, len, HG + (k - 1) * HF - 0.08, HG + (k - 1) * HF + 0.05, 0.07, 0, 'k');
      if (len > 8) { downpipe(P, M.zinc, 0.2, 0.1, HW); downpipe(P, M.zinc, len - 0.2, 0.1, HW); }
    });
    mansard(P, M, len);                                                                         // the zinc mansard along the street fronts, with dormers; the east front too
    // oriels on the long fronts: floors 2..6, three-sided, front windows, zinc caps
    P.ranged(700, () => {
      const bays = len > 20 ? [len * 0.27, len * 0.73] : len > 12 ? [len * 0.5] : [];
      for (const cx of bays) for (let fl = 0; fl < 5; fl++) {
        const y0 = HG + fl * HF, y1 = y0 + HF;
        oriel(P, M, cx, 3.0, 0.9, 0.42, y0, y1, { top: fl === 4, bottom: fl === 0, k: fl });
      }
    });
    P.pop();
  }
  // ---- the NW side (e48 / e52 / e56, facing the side street): the plain court tile of the envelope stays, but it gets the same cream cornice and zinc mansard as the fronts (reviewer addition)
  for (const i of NW) {
    const e = E[i]; if (!e || e.len < 8) continue;
    const f = edgeFrame(e);
    P.push(f.S.x, 0, f.S.z, f.rot); P.far = Infinity;
    ledge(P, M.cream, f.len, HW, HC, 0.55, 0, 'k');
    mansard(P, M, f.len);
    P.pop();
  }
  // ---- the corner turret over the chamfered NW corner (e43-e47): a six-sided oriel from floor 4 to the roof with a pointed zinc roof
  {
    const c = { x: (E[44].a[0] + E[46].b[0]) / 2 - 0.55, z: (E[44].a[1] + E[46].b[1]) / 2 + 0.25 }, R = 1.75, y0 = HG + 2.5 * HF, y1 = HC + MR + 0.6;
    P.push(c.x, 0, c.z, 0);
    P.ranged(900, () => {
      const ring = Array.from({ length: 6 }, (_, k) => { const a = k / 6 * Math.PI * 2 + 0.3; return [Math.sin(a) * R, Math.cos(a) * R]; });
      for (let k = 0; k < 6; k++) {
        const a = ring[k], b = ring[(k + 1) % 6], nrm = [(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2], nl = Math.hypot(nrm[0], nrm[2]), nn = [nrm[0] / nl, 0, nrm[2] / nl];
        for (let fl = 0; fl < 4; fl++) { const ya = y0 + fl * HF, yb = Math.min(ya + HF, y1 - 0.3); if (yb <= ya) break;
          P.quad(M.o3f, [a[0], ya, a[1]], [b[0], ya, b[1]], [b[0], yb, b[1]], [a[0], yb, a[1]], nn, [[0.2, 0], [0.8, 0], [0.8, (yb - ya) / HF], [0.2, (yb - ya) / HF]]);
          if (yb - ya > 2.4) {                                                                       // a painted window on the face (cream frame stands out 3 cm)
            const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, tx = (b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]), tz = (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1]), hw2 = 0.42, e = 0.03;
            P.quad(M.cream, [mx - tx * (hw2 + 0.08) + nn[0] * e, ya + 0.72, mz - tz * (hw2 + 0.08) + nn[2] * e], [mx + tx * (hw2 + 0.08) + nn[0] * e, ya + 0.72, mz + tz * (hw2 + 0.08) + nn[2] * e], [mx + tx * (hw2 + 0.08) + nn[0] * e, ya + 2.7, mz + tz * (hw2 + 0.08) + nn[2] * e], [mx - tx * (hw2 + 0.08) + nn[0] * e, ya + 2.7, mz - tz * (hw2 + 0.08) + nn[2] * e], nn);
            P.quad(M.g3a, [mx - tx * hw2 + nn[0] * e * 2, ya + 0.8, mz - tz * hw2 + nn[2] * e * 2], [mx + tx * hw2 + nn[0] * e * 2, ya + 0.8, mz + tz * hw2 + nn[2] * e * 2], [mx + tx * hw2 + nn[0] * e * 2, ya + 2.62, mz + tz * hw2 + nn[2] * e * 2], [mx - tx * hw2 + nn[0] * e * 2, ya + 2.62, mz - tz * hw2 + nn[2] * e * 2], nn, [[0, 0], [1, 0], [1, 1], [0, 1]]);
          } }
      }
      // the corbelled foot (a downward cone), the cornice ring and the pointed zinc roof
      P.fan(M.cream, ring.map((p) => [p[0] * 1.08, y1 - 0.3, p[1] * 1.08]), [0, -1, 0]);
      for (let k = 0; k < 6; k++) { const a = ring[k], b = ring[(k + 1) % 6]; P.quad(M.cream, [a[0] * 1.08, y1 - 0.3, a[1] * 1.08], [b[0] * 1.08, y1 - 0.3, b[1] * 1.08], [b[0] * 1.08, y1 - 0.1, b[1] * 1.08], [a[0] * 1.08, y1 - 0.1, a[1] * 1.08], [(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2]);
        P.fan(M.zinc, [[a[0] * 1.12, y1 - 0.1, a[1] * 1.12], [b[0] * 1.12, y1 - 0.1, b[1] * 1.12], [0, y1 + 3.1, 0]], [(a[0] + b[0]) / 2, 1.2, (a[1] + b[1]) / 2]);
        const aa = ring[k], bb = ring[(k + 1) % 6]; P.quad(M.cream, [aa[0], y0 - 0.9, aa[1]], [bb[0], y0 - 0.9, bb[1]], [bb[0], y0, bb[1]], [aa[0], y0, aa[1]], [(aa[0] + bb[0]) / 2, 0, (aa[1] + bb[1]) / 2]); }
      P.fan(M.cream, ring.map((p) => [p[0] * 0.6, y0 - 0.9, p[1] * 0.6]), [0, -1, 0]);
      P.col(M.black, 0, 0, y1 + 3.1, y1 + 4.4, 0.05, 0.02, 5, true);
    });
    P.pop();
  }
  const f0 = edgeFrame(E[42]);
  svc.monuments.push({ id: 'w55413101', name: 'Ждановская набережная, 3 (дом А. Н. Толстого)', x: f0.S.x + f0.t[0] * f0.len / 2, z: f0.S.z + f0.t[1] * f0.len / 2, h: 25 });
}
