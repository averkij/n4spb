// landmarksVOStatues/openbook.js - the OPEN BOOK ("Раскрытая книга", "Послание через века"): E. Solovyova, opened 2002-10-25, grey granite, 365 x 240 x 90 cm, on the paved terrace of Universitetskaya nab.
// opposite the Twelve Collegia.  Photo w942911424/c00 (Commons / ru.wikipedia): a thick granite slab in the form of an open book: the two pages are convex blocks, the gutter between them is a narrow groove with a
// lip rising on both sides, the left page carries the 12 lines of Pushkin's "Люблю тебя, Петра творенье" cut in capitals (mats.js page texture), the right page is blank in the photo (its text [?]), the outer edge of
// the right page rolls up in an S curve (the 0.9 m of the dimensions).  It lies directly on the terrace paving (no plinth); the exedra, railing and lamp belong to the embankment generator.
// The reader's side (+z of the piece) faces AWAY from the river.  Solid collider 3.7 x 2.5 m (nobody climbs the pages).
import { heightBlock } from './solids.js';

const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const W = 1.82, D = 2.4, GAP = 0.035;

/** top height of the left page at (x, z): x from -W-GAP (outer edge) to -GAP (gutter) */
function hLeft(x, z) {
  const t = (-GAP - x) / W;                                                // 0 at the gutter, 1 at the outer edge
  const e = Math.abs(z) / (D / 2);
  return 0.43 + 0.19 * (1 - sm(0, 0.16, t)) - 0.05 * sm(0.55, 1, t) - 0.06 * sm(0.8, 1, e) + 0.03 * Math.sin(t * 3.1);
}
/** top height of the right page: x from GAP (gutter) to W + GAP (outer edge), the outer edge rolls up */
function hRight(x, z) {
  const t = (x - GAP) / W, e = Math.abs(z) / (D / 2);
  return 0.43 + 0.17 * (1 - sm(0, 0.16, t)) - 0.04 * sm(0.2, 0.5, t) * (1 - sm(0.5, 0.75, t)) + 0.4 * sm(0.62, 1, t) - 0.06 * sm(0.8, 1, e);
}

export const PIECES = [{
  id: 'w942911424', key: 'openbook', name: 'Раскрытая книга («Послание через века»)', x: -2946.9, z: -740.3, yaw: 'awayWater', h: 0.9, spot: 6,
  solid: [{ w: 3.75, d: 2.5, h: 0.95 }],
  build(P, M) {
    P.tint(M.PAL.graniteGrey);
    // left page: the Pushkin text on the top (uv: u across the page, v from the far edge down to the reader's edge)
    heightBlock(P, M.page, -W - GAP, -GAP, -D / 2, D / 2, hLeft, { nu: 18, nv: 14, skirtMat: M.vc, uv: (x, z) => [(x + W + GAP) / W, 1 - (z + D / 2) / D] });
    P.tint('#8b8d8c');
    heightBlock(P, M.vc, GAP, W + GAP, -D / 2, D / 2, hRight, { nu: 22, nv: 14 });
    // the gutter: a dark groove between the pages
    P.tint('#4a4c4e'); P.box(M.vc, -GAP, GAP, 0.0, 0.2, -D / 2 + 0.02, D / 2 - 0.02, 'b');
  },
}];
