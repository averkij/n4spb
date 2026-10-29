// landmarksSredny/geolWall.js - the three-storey wall of the Geological Committee (Sredny 74; dossier docs/research/sredny.md 4.3, photos 36 32 33 46 48 n09 n10 n11), drawn in the current wall frame
// (local +x along the wall to the right as seen from outside, y up, +z out of the wall):
//   plinth 0 .. 3.5 m   rusticated dark granite (blocks 0.9 x 0.45 m), barred basement windows 1.6 x 1.0 m every second bay
//   floor 1 3.5 .. 8.7  dolomite with horizontal rustication, rectangular windows 2.0 x 2.3 m (sill 4.9) each over a stone balustrade panel 0.8 m high
//   floor 2 8.7 .. 16.0 arched windows 1.65 x 3.4 m (sill 9.2, crown 12.6) between flat pilasters 0.9 m wide (0.15 m proud)
//   floor 3 16.0 .. 19.1 rectangular windows 1.7 x 2.6 m (sill 16.3); string courses at 3.5 / 8.7 / 16.0; the three-step cornice from 19.1 (crown 20.3, 0.9 m proud)
//   bay pitch 3.45 - 3.6 m (9 bays per 32 m wing).  `plain` walls (rear, courtyards) have rectangular windows only and no pilasters.
import { wallFace, rectC, archC, rectOutline, cornice, band } from './wall.js';

export const GH = { plinth: 3.5, f1: 8.7, f2: 16.0, corn: 19.1 };

/**
 * o: { centres: [x..] window axes (default: bays of len / round(len / 3.58)), pil: [x..] pilaster axes (default: the bay boundaries), plain: bool, y0: lowest y of the wall (default 0),
 *      top: base of the cornice (default 19.1), noCornice: bool, noF3: bool, noPlinthWin: bool, noBalus: bool, ox: [x0, x1] the wall piece (default 0..len) }
 */
export function wallRows(P, M, len, o = {}) {
  const bays = o.centres ? o.centres.length : Math.max(1, Math.round(len / 3.58)), pitch = len / bays;
  const centres = o.centres || Array.from({ length: bays }, (_, i) => (i + 0.5) * pitch);
  const pil = o.plain ? [] : (o.pil || Array.from({ length: bays + 1 }, (_, i) => i * pitch));
  const y0 = o.y0 ?? 0, top = o.top ?? GH.corn, x0 = o.ox ? o.ox[0] : 0, x1 = o.ox ? o.ox[1] : len, t0 = P.tris;
  const inside = (x, w) => x - w / 2 > x0 + 0.05 && x + w / 2 < x1 - 0.05;
  // ---- plinth
  if (y0 < GH.plinth - 0.01) {
    const ops = [];
    if (!o.noPlinthWin) centres.forEach((x, i) => { if (i % 2 === 0 && inside(x, 1.6) && y0 < 1.3) ops.push({ c: rectC(x, 1.4, 1.6, 1.0), glass: M.glassDark, reveal: M.granRust, depth: 0.2 }); });
    wallFace(P, M.granRust, rectOutline(x0, x1, y0, GH.plinth), ops, { tu: 3.6, tv: 1.8 });
  }
  // ---- floor 1
  if (top > GH.plinth + 0.5) {
    const ops = [], ys = Math.max(y0, GH.plinth);
    for (const x of centres) if (inside(x, 2.0)) ops.push({ c: rectC(x, 4.9, 2.0, 2.3), glass: M.glassRect, reveal: M.doloShade, depth: 0.28, withSill: true, sillMat: M.doloFlat });
    wallFace(P, M.dolo1, rectOutline(x0, x1, ys, Math.min(GH.f1, top)), ops, { tu: 4.4, tv: 4.4 });
    if (!o.plain && !o.noBalus) for (const x of centres) if (inside(x, 2.4)) P.quad(M.balus, [x - 1.2, 4.05, 0.05], [x + 1.2, 4.05, 0.05], [x + 1.2, 4.87, 0.05], [x - 1.2, 4.87, 0.05], [0, 0, 1], [[0, 0], [1.5, 0], [1.5, 1], [0, 1]]);
  }
  // ---- floors 2 and 3
  if (top > GH.f1 + 0.5) {
    const ops = [];
    for (const x of centres) {
      if (inside(x, 1.65)) ops.push({ c: o.plain ? rectC(x, 9.2, 1.65, 3.4) : archC(x, 9.2, 1.65, 3.4, 8), glass: M.glassArch, reveal: M.doloShade, depth: 0.28 });
      if (!o.noF3 && top > GH.f2 + 0.5 && inside(x, 1.7)) ops.push({ c: rectC(x, 16.3, 1.7, 2.6), glass: M.glassRect, reveal: M.doloShade, depth: 0.25, withSill: true, sillMat: M.doloFlat });
    }
    wallFace(P, M.dolo, rectOutline(x0, x1, GH.f1, top), ops, { tu: 4.4, tv: 4.4 });
  }
  // ---- strings and pilasters
  if (y0 < GH.plinth - 0.01) band(P, M.granString, x0, x1, GH.plinth - 0.12, GH.plinth + 0.13, 0, 0.2);
  if (top > GH.f1 + 0.5) {
    band(P, M.doloFlat, x0, x1, GH.f1 - 0.15, GH.f1 + 0.15, 0, 0.3);
    if (top > GH.f2 + 0.3) band(P, M.doloFlat, x0, x1, GH.f2 - 0.1, GH.f2 + 0.1, 0, 0.2);
    for (const x of pil) {
      const w = 0.95, xa = Math.max(x0, x - w / 2), xb = Math.min(x1, x + w / 2);
      if (xb - xa > 0.2) { P.box(M.doloFlat, xa, xb, GH.f1 + 0.15, top, 0, 0.15, 'bk', 2); P.box(M.doloFlat, xa - 0.06, xb + 0.06, GH.f2 - 0.3, GH.f2 + 0.1, 0, 0.22, 'bk', 2); }
    }
  }
  if (!o.noCornice && top > GH.f1 + 0.5) cornice(P, M.doloFlat, M.doloShade, x0, x1, 0, top, 0.25, 0.25);
  return P.tris - t0;
}
