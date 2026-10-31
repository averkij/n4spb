// landmarksZhdanovka/house7.js - ZHDANOVSKAYA EMBANKMENT No. 7 (1833, A. M. Bolotov for the merchant Sidorov, third storey added later; OSM w55440261, 4 levels, 41.1 m front).  Photo m05 (refs/.../misc):
// salmon plaster (#d9a58a) with cream trim, a rusticated ground floor with shop windows and oval medallions (the shop signs / brand logos of the photo are NOT drawn), three floors above it with fourteen window axes
// (REAL windows: holes, reveals, recessed glass; floor 2 under ornamented hoods on consoles, floor 3 and 4 under flat lintels, sills everywhere), three stacks of black cast-iron balconies (floors 2-4, over axes 4, 9 and 13,
// the windows there are balcony doors), the carriage passage over axis 9 (flat-topped, 3 m wide) with a curved gable crowned by a round window above it, a cornice at 15.0-15.9 m, a thin roof rail, chimneys on the flat roof,
// four zinc drain pipes.  Back and side walls: the courtyard tile.
import { edgeFrame } from './frame.js';
import { ledge, balcony, downpipe } from './geom.js';
import { envelope } from './envelope.js';
import { front } from './facade.js';
import { reserver, SIGNS, stepper } from './labels.js';

const HG = 4.2, HW = 15.0, HC = 15.9, N = 14, PASS = 8, DOOR = 10, STACKS = [3, 8, 12], PH = 3.5, PD = 4.2;

export function build(K, fp, edgeIdx) {
  const { P, M, svc } = K, e = fp.edges[edgeIdx], f = edgeFrame(e), len = f.len, tile = len / N;
  K.shared.h7 = { f, len, tile, pass: PASS };
  envelope(K, fp, { Hw: HW, Hc: HC, skip: new Set([edgeIdx]), roofMat: M.iron, ledgeMat: M.cream, proj: 0.62 });
  P.push(f.S.x, 0, f.S.z, f.rot);
  P.far = Infinity;
  const consoleHood = (P2, cx, y, w) => { P2.box(M.cream, cx - w / 2, cx + w / 2, y + 0.04, y + 0.22, 0, 0.22, 'k', 1); for (const s of [-1, 1]) P2.box(M.cream, cx + s * (w / 2 - 0.2) - 0.07, cx + s * (w / 2 - 0.2) + 0.07, y - 0.22, y + 0.04, 0, 0.14, 'k', 1); P2.box(M.stone, cx - w / 2 + 0.1, cx + w / 2 - 0.1, y + 0.1, y + 0.18, 0.22, 0.24, 'kb', 1); };
  const stack = (types) => Object.fromEntries(STACKS.map((k) => [k, { w: 0.98, y0: 0.2, y1: 2.9, types }]));
  const ws = (o) => ({ w: 1.14, rev: M.cream, d: 0.26, sill: M.cream, ...o });
  const rows = [
    { mat: M.o7g, h: HG, holes: [{ x0: PASS * tile, x1: (PASS + 1) * tile, y0: 0, y1: PH }],
      win: { w: 1.5, y0: 0.9, y1: 3.2, types: [M.g7s], rev: M.cream, d: 0.3, sill: M.stone, sillExt: 0.12, surround: M.cream, sw: 0.1, skip: new Set([PASS]), over: { [DOOR]: { w: 1.3, y0: 0, y1: 2.5, types: [M.gd1], door: true } },
        fascia: { mat: M.slate, trim: M.cream, y0: 3.4, h: 0.5, signs: SIGNS(M) } } },
    { mat: M.o7f2, h: 3.7, win: ws({ y0: 0.78, y1: 2.78, types: [M.g7a, M.g7b, M.g7c], surround: M.cream, sw: 0.1, hood: consoleHood, over: stack([M.g7a, M.g7c]) }) },
    { mat: M.o7f3, h: 3.6, win: ws({ y0: 0.76, y1: 2.74, types: [M.g7a, M.g7b, M.g7c], surround: M.cream, sw: 0.07, lintel: M.cream, lh: 0.14, over: stack([M.g7b, M.g7a]) }) },
    { mat: M.o7f4, h: 3.5, win: ws({ y0: 0.76, y1: 2.72, types: [M.g7a, M.g7b, M.g7c], surround: M.cream, sw: 0.07, lintel: M.cream, lh: 0.14, over: stack([M.g7c, M.g7b]) }) },
  ];
  front(P, M, { len, pitch: len / N, seed: 77, reserve: reserver(K.ctx, 'w55440261', f), stepMat: M.stone, canopyMat: M.cream, walk: stepper(K.ctx, f) }, rows);
  // ---- the carriage passage with its dark back
  const px0 = PASS * tile, px1 = (PASS + 1) * tile;
  P.quad(M.stone, [px0, 0.02, 0], [px1, 0.02, 0], [px1, 0.02, -PD], [px0, 0.02, -PD], [0, 1, 0]);                                // floor, jambs, ceiling, the dark back
  P.quad(M.iron, [px0, 0, 0], [px0, 0, -PD], [px0, PH, -PD], [px0, PH, 0], [1, 0, 0]);                // the passage is in deep shade: dull brown jambs, dark ceiling (photo m05)
  P.quad(M.iron, [px1, 0, -PD], [px1, 0, 0], [px1, PH, 0], [px1, PH, -PD], [-1, 0, 0]);
  P.quad(M.slate, [px0, PH, 0], [px1, PH, 0], [px1, PH, -PD], [px0, PH, -PD], [0, -1, 0]);
  P.quad(M.slate, [px0, 0, -PD], [px1, 0, -PD], [px1, PH, -PD], [px0, PH, -PD], [0, 0, 1]);
  P.box(M.cream, px0 - 0.1, px1 + 0.1, PH - 0.22, PH, 0, 0.12, 'k', 1);
  // ---- the cornice (the envelope draws the others) and the string course over the shops
  ledge(P, M.cream, len, HW, HC, 0.62, 0, 'k');
  P.ranged(300, () => {
    ledge(P, M.cream, len, HG - 0.12, HG + 0.06, 0.16, 0, 'k');
    ledge(P, M.cream, len, HW - 0.4, HW, 0.2, 0, 'k');
    ledge(P, M.cream, len, HG + 3.7 - 0.12, HG + 3.7 + 0.06, 0.1, 0, 'k');
    ledge(P, M.cream, len, HG + 7.3 - 0.1, HG + 7.3 + 0.05, 0.08, 0, 'k');
    for (const x of [5.87, 14.68, 29.36, 40.6]) downpipe(P, M.zinc, x, 0.1, HW - 0.4);
  });
  // ---- balcony stacks (floor 2, 3, 4): slab + brackets + cast-iron railing
  P.ranged(380, () => { for (const k of STACKS) { const cx = (k + 0.5) * tile; for (const yF of [HG + 0.2, HG + 3.7 + 0.2, HG + 7.3 + 0.2]) balcony(P, M, cx, 2.3, 0.85, yF); } });
  // ---- the curved gable with its round window over the passage axis, chimneys, the thin roof rail
  P.ranged(600, () => {
    const cx = (PASS + 0.5) * tile, hw = 2.5, y0 = HC, pts = [];
    for (let i = 0; i <= 14; i++) { const dx = -hw + 2 * hw * i / 14; pts.push([cx + dx, y0 + 0.55 + 2.0 * (1 - (dx / hw) ** 2)]); }
    const outline = [[cx - hw, y0], ...pts, [cx + hw, y0]];
    const grow = (p, d) => [cx + (p[0] - cx) * (1 + d / hw), p[1] > y0 ? p[1] + d : p[1]];
    P.fan(M.cream, outline.map((p) => { const q = grow(p, 0.2); return [q[0], q[1], 0.02]; }), [0, 0, 1]);
    P.fan(M.apron, outline.map((p) => [p[0], p[1], 0.07]), [0, 0, 1], (p) => [p[0] / 3, 0.5]);
    P.fan(M.apron, outline.map((p) => [p[0], p[1], -0.5]), [0, 0, -1], (p) => [p[0] / 3, 0.5]);
    for (let i = 0; i + 1 < outline.length; i++) { const a = outline[i], b = outline[i + 1]; P.quad(M.apron, [a[0], a[1], 0.07], [b[0], b[1], 0.07], [b[0], b[1], -0.5], [a[0], a[1], -0.5], [-(b[1] - a[1]), (b[0] - a[0]), 0], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
    const wy = y0 + 1.75, ring = (r, z) => Array.from({ length: 20 }, (_, k) => { const a = k / 20 * Math.PI * 2; return [cx + Math.cos(a) * r, wy + Math.sin(a) * r, z]; });
    P.fan(M.cream, ring(0.66, 0.1), [0, 0, 1]); P.fan(M.slate, ring(0.46, 0.13), [0, 0, 1]);
    // chimneys of the flat roof (yellow plaster, cream caps)
    for (const x of [0.2 * len, 0.38 * len, 0.62 * len, 0.8 * len, 0.93 * len]) { P.box(M.stone, x - 0.4, x + 0.4, HC, HC + 1.5, -3.2, -2.4, 'b', 1); P.box(M.cream, x - 0.5, x + 0.5, HC + 1.5, HC + 1.65, -3.3, -2.3, 'b', 1); }
    P.quad(M.rails, [0.3, HC, -0.3], [cx - hw - 0.4, HC, -0.3], [cx - hw - 0.4, HC + 0.8, -0.3], [0.3, HC + 0.8, -0.3], [0, 0, 1], [[0, 0], [(cx - hw - 0.7) / 1.9, 0], [(cx - hw - 0.7) / 1.9, 1], [0, 1]]);
    P.quad(M.rails, [cx + hw + 0.4, HC, -0.3], [len - 0.3, HC, -0.3], [len - 0.3, HC + 0.8, -0.3], [cx + hw + 0.4, HC + 0.8, -0.3], [0, 0, 1], [[0, 0], [(len - cx - hw - 0.7) / 1.9, 0], [(len - cx - hw - 0.7) / 1.9, 1], [0, 1]]);
  });
  P.pop();
  const mid = { x: f.S.x + f.t[0] * len / 2, z: f.S.z + f.t[1] * len / 2 };
  K.shared.h7.mid = mid;
  svc.monuments.push({ id: 'w55440261', name: 'Ждановская набережная, 7', x: mid.x, z: mid.z, h: 16 });
}
