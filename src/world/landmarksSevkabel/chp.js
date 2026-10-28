// landmarksSevkabel/chp.js - CHP-7 (Vasilievsky power plant, Kozhevennaya line 33; closed site, exterior only; docs/research/sevkabel.md section 7, photos 104 105 133 063).
//   * THE THREE CHIMNEYS (OSM w815734026 / 27 / 28 at (-5773,730), (-5815.5,775), (-5846.5,805.4)): 120 m [W ru.wikipedia, satellite shadow 129 +-10 m], round, slight taper 8.0 m at the base -> 6.5 m at the rim,
//     SEVEN equal bands from the top: RED (cap) WHITE RED WHITE RED WHITE RED (base), a dark red rim, four steel ring galleries at 0.286 / 0.571 / 0.857 / 0.93 H, a cage ladder on the SSW side (towards the river / the Bay),
//     a bare lightning rod.  No beacon, no smoke, no flag.  They are the tallest objects of the south-west shore: they must read from 1-3 km.
//   * THE PLANT BLOCK (OSM w136790127, 15 755 m2, one sheet-clad block, parapet 28 m [E]): pale panels with three ribbon bands, flat roof; solid (thin wall colliders on the outline).
import * as L from '../layout.js';
import { CHIMNEYS } from './frame.js';
import { polysOf, polyWalls, roofCap, coping, solidPoly } from './common.js';

const H = 120, R0 = 4.0, R1 = 3.25, BANDS = 7, SEG = 16;
const rAt = (y) => R0 + (R1 - R0) * y / H;

/** a red-and-white chimney at (x, z): banded frusta, ring galleries, cage ladder (towards bearing `ladderDir`), rod */
export function chimney(P, M, x, z, o = {}) {
  const h = o.h ?? H, bh = h / BANDS, ld = o.ladder ?? [-0.574, 0.819];
  const ra = (y) => R0 + (R1 - R0) * y / H;
  for (let i = 0; i < BANDS; i++) {
    const y0 = i * bh, y1 = (i + 1) * bh, mat = i % 2 === 0 ? M.chimRed : M.chimWhite;
    P.cyl(mat, [x, y0, z], [x, y1, z], ra(y0), ra(y1), SEG, false);
  }
  P.cyl(M.chimRedDark, [x, h - 1.2, z], [x, h, z], ra(h - 1.2) + 0.12, ra(h) + 0.12, SEG, false);                 // the rim band
  P.cyl(M.chimRedDark, [x, h, z], [x, h + 0.01, z], ra(h) + 0.12, ra(h) + 0.12, SEG, true);                          // dark mouth
  // ring galleries: a floor disc 0.9 m wider than the shaft with a thin handrail band
  for (const f of [0.286, 0.571, 0.857, 0.93]) {
    const y = h * f, r = ra(y) + 0.9;
    P.cyl(M.steel, [x, y, z], [x, y + 0.14, z], r, r, SEG, true);
    P.cyl(M.steel, [x, y + 1.0, z], [x, y + 1.07, z], r, r, SEG, false);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; P.cyl(M.steel, [x + Math.cos(a) * r, y, z + Math.sin(a) * r], [x + Math.cos(a) * r, y + 1.05, z + Math.sin(a) * r], 0.04, 0.04, 4, false); }
  }
  // the cage ladder (0.8 m wide, from 5 m to 5 m below the rim) tilted with the taper
  const ya = 5, yb = h - 5, la = ra(ya) + 0.25, lb = ra(yb) + 0.25;
  P.cyl(M.ladder, [x + ld[0] * la, ya, z + ld[1] * la], [x + ld[0] * lb, yb, z + ld[1] * lb], 0.3, 0.3, 4, false);
  // lightning rod
  P.cyl(M.black, [x, h, z], [x, h + 3.2, z], 0.06, 0.03, 5, false);
}

export function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSevkabel] chp/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('chimneys', () => {
    for (const c of CHIMNEYS) { chimney(P, M, c.x, c.z); ph.addCylinder(c.x, c.z, R0 + 0.6, 0, H); }
    svc.monuments.push({ id: 'chp7-chimneys', name: 'Трубы Василеостровской ТЭЦ-7', x: CHIMNEYS[1].x, z: CHIMNEYS[1].z, h: H });
  });
  stage('block', () => {
    const polys = polysOf('w136790127');
    for (const poly of polys) {
      const Hb = 28;
      polyWalls(P, poly, M.chp, 0, Hb, 8, 28);
      roofCap(P, M.chpRoof, poly, Hb, 6);
      coping(P, poly, Hb, Hb + 0.25, 0.1, { front: M.chpPlant, top: M.chpPlant, under: M.chpPlant });
      solidPoly(ctx, poly, Hb + 1, 0, 0.9);
    }
  });
  void L;
  if (errs.length) throw new Error(errs.join('\n'));
}
