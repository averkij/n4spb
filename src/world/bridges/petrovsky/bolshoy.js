// bridges/petrovsky/bolshoy.js - the Bolshoy Petrovsky Bridge (Большой Петровский мост, opened 18 Sep 2010) over the Malaya Nevka between Petrovsky Island (south) and Krestovsky Island (north), across the islet w22870264.
//   Facts [W ru.wikipedia]: 307 m, seven spans 44.22 + 41.95 + 44.92 + 44.94 + 41.94 + 42.19 + 33.46 m, 21.5 - 39.66 m wide, four traffic lanes + a cycle track + footways, continuous steel box girders with an
//   orthotropic deck on paired concrete pillars, granite-faced abutments, clearance 25 x 5.5 m (Petrovsky side) / 20 x 5.0 m; here the axis is 298 m (OSM carriageways w403623938 / w403623940 are 7.3 m apart, the
//   cycle track w368896056 on the west, the footway w368896055 on the east).  [V photos bp01 bp02 bp03 bp06 bp08, refs/petrovsky-bridges]: pale grey-green girder fascia under a light green cornice lip, a bright
//   green tube railing (top tube, three bars, rings between the posts), pairs / triples of pale concrete pillars on granite plinths joined by flat green steel arch struts and green ties, a thin pale median barrier,
//   grey cobra lamp standards on both sides, a mild hump.  (bp09, the 2007 photo, shows the OLD timber bridge: not used.)
//   Frame: the axis = way A (w403623938) shifted 3.65 m to its left; s = 0 at the Petrovsky bank, +v right of travel (east).  Deck y: street level at both banks, hump of 4.5 m [E].
//   Own file: bridges/petrovsky/bolshoy.js.  NO flags / flagpoles (user rules).
import { profile, closeBank } from '../long.js';
import { makeRoute, leftOffset } from './route.js';
import { buildDeck } from './deck.js';
import { shoreClose } from './shore.js';

export const A_NODES = [[-5428.2, -3483.2], [-5356.3, -3729.5], [-5353.5, -3738.9], [-5351.5, -3746.5], [-5350.2, -3753.9], [-5349.1, -3762.8]];
export const BOLSH = {
  id: 'bolshoy-petrovsky', name: 'Большой Петровский мост', nameEn: 'Bolshoy Petrovsky Bridge', ww: 'neva', off: 3.65, med: 0.35, road: 7.0, lanes: 2, bar: 0.45, barH: 0.6, hwR: 10.4, hwL: 11.9, depth: 1.7, flat: 6.0, lip: 0.7,
  spans: [44.22, 41.95, 44.92, 44.94, 41.94, 42.19, 33.46], endMargin: 7.0,
  prof: [[0, 0.05], [39, 2.5], [87, 4.1], [149, 4.6], [216, 4.1], [263, 2.5], [298.14, 0.05]],
  osm: ['w403623938', 'w403623940', 'w368896055', 'w368896056'],
};
// the axis runs 4 m beyond both bank lines (the quay opening of the environment is 2 - 3 m wider than the OSM way): the deck and the abutments cover it
const EXT = 4, extend = (A) => { const n = A.length, a = A[0], b = A[1], c = A[n - 2], d = A[n - 1], l0 = Math.hypot(b[0] - a[0], b[1] - a[1]), l1 = Math.hypot(d[0] - c[0], d[1] - c[1]); return [[a[0] - (b[0] - a[0]) / l0 * EXT, a[1] - (b[1] - a[1]) / l0 * EXT], ...A, [d[0] + (d[0] - c[0]) / l1 * EXT, d[1] + (d[1] - c[1]) / l1 * EXT]]; };
export const bolshRoute = () => makeRoute(leftOffset(extend(A_NODES), BOLSH.off), 4, 24);

export function buildBolshoy(env) {
  const { ctx, P, M } = env, L = ctx.L, sp = BOLSH, TM = ctx.mat.toon, waterY = env.waterY;
  const R = bolshRoute(), yOf = profile(sp.prof);
  const fas = TM('#aab9a6', { paint: 0.05, name: 'brg-bolsh-fascia' }), soff = TM('#5f6b63', { paint: 0.05, name: 'brg-bolsh-soffit' });
  const conc = TM('#c9c7bf', { paint: 0.06, name: 'brg-bolsh-concrete' }), green = TM('#5aa05f', { paint: 0.03, name: 'brg-bolsh-green' });
  const mats = { conc, fas, soff, pave: M.footAsphalt, skirt: M.graniteGrey };
  const B = { id: sp.id, info: { rails: 0, colliders: 0 }, masts: [], anchors: [] };
  const D = buildDeck(env, R, {
    y: yOf, hwR: () => sp.hwR, hwL: () => sp.hwL, med: sp.med, road: sp.road, lanes: sp.lanes, bar: sp.bar, barH: sp.barH, mats, girder: { depth: sp.depth, flat: sp.flat, lip: sp.lip },
    low: -1, rail: { kind: 'hpipes', hex: '#4f9a58' }, lamps: { every: 28, h: 10, from: 14, to: R.len - 8 },
  }, B);
  const wet = (x, z) => !!(L.waterwayAt ? L.waterwayAt(x, z) : L.inRiver(x, z));
  // ---- piers: plinth (granite, from the bed to 0.6 m over the water) + three pale pillars + flat green arch struts and ties
  const k = (R.len - 2 * sp.endMargin) / sp.spans.reduce((a, b) => a + b, 0), piers = []; let acc = 0;
  for (let i = 0; i < sp.spans.length - 1; i++) { acc += sp.spans[i]; piers.push(sp.endMargin + acc * k); }
  const cols = [], oriented = (mat, c, hs, hv, y0, y1, skipBottom = true) => {                 // an oriented box at the axis point c = R.pos(...)
    const pr = (a, b, y) => [c.x + c.tx * a - c.tz * b, y, c.z + c.tz * a + c.tx * b];
    const c4 = [[-hs, -hv], [hs, -hv], [hs, hv], [-hs, hv]];
    for (let e = 0; e < 4; e++) { const [a0, b0] = c4[e], [a1, b1] = c4[(e + 1) % 4], mx = (a0 + a1) / 2, mz = (b0 + b1) / 2; P.quad(mat, pr(a0, b0, y0), pr(a1, b1, y0), pr(a1, b1, y1), pr(a0, b0, y1), [c.tx * mx - c.tz * mz, 0, c.tz * mx + c.tx * mz], [[0, y0 / 2.2], [1, y0 / 2.2], [1, y1 / 2.2], [0, y1 / 2.2]]); }
    P.quad(mat, pr(-hs, -hv, y1), pr(hs, -hv, y1), pr(hs, hv, y1), pr(-hs, hv, y1), [0, 1, 0]);
    void skipBottom;
  };
  for (const s of piers) {
    const c = R.pos(s, 0), y = yOf(s), top = y - sp.depth, anyWet = wet(c.x, c.z), yb = anyWet ? -4.7 : 0, plinthTop = anyWet ? waterY + 0.6 : 0.4;
    if (anyWet) oriented(M.graniteGrey, c, 2.0, 9.6, yb, plinthTop);
    const yc0 = anyWet ? plinthTop : 0;
    for (const v of [-7.4, 0, 7.4]) { const q = R.pos(s, v); oriented(conc, q, 0.85, 0.95, yc0, top + 0.05); cols.push({ x: q.x, z: q.z, y1: top }); }
    for (const [va, vb] of [[-7.4, 0], [0, 7.4]]) {                                         // the flat arch strut between neighbouring pillars (8 tube segments) and two ties
      const n = 8, rise = 1.2, yA = yc0 + 0.6;
      for (let j = 0; j < n; j++) { const t0 = j / n, t1 = (j + 1) / n, f = (t) => [R.pos(s, va + 0.95 + (vb - va - 1.9) * t), yA + rise * (1 - Math.pow(2 * t - 1, 2))]; const a = f(t0), b = f(t1); P.cyl(green, [a[0].x, a[1], a[0].z], [b[0].x, b[1], b[0].z], 0.17, 0.17, 5, false); }
      for (const yT of [top - 0.7, top - 1.6]) { const a = R.pos(s, va + 0.95), b = R.pos(s, vb - 0.95); if (yT > yA + 1.3) P.cyl(green, [a.x, yT, a.z], [b.x, yT, b.z], 0.1, 0.1, 5, false); }
    }
  }
  // ---- abutments + the granite wings that close the quay openings at both banks
  const ends = [[0, 1], [R.len, -1]], wings = [];
  const yb = waterY - 0.2;
  for (const [s, dir] of ends) {
    const c = R.pos(s, 0), T = Math.atan2(c.tz, c.tx), site = { cx: c.x, cz: c.z, b: T * 180 / Math.PI + 90 };
    const a = dir > 0 ? 0 : -4, b = dir > 0 ? 4 : 0;
    P.push(c.x, 0, c.z, -T);
    P.box(M.graniteGrey, a, b, yb - 0.1, yOf(s) - sp.depth + 0.02, -sp.hwL + 0.1, sp.hwR - 0.1, 'b', 2.2);
    for (const sg of [-1, 1]) { const hv = sg > 0 ? sp.hwR : sp.hwL; wings.push({ site, u: 0, dir, sg, v0: hv + 0.05 }); closeBank({ site, P, M, L, u: 0, dir, sg, v0: hv + 0.05, len: 6.0, yTop: 0.05, yb, mat: M.granitePink || M.granite, parapet: M.parapetPink || M.parapet, collide: false }); }
    P.pop();
  }
  const shore = shoreClose(env, R, { vA: -17, vB: 24, hole: (v, cr) => yOf(cr.s) < 3.0 && v > -sp.hwL - 5.9 && v < sp.hwR + 5.9 }); shore.draw(P); B.info.shoreCrossings = shore.crossings.map((c) => Math.round(c.s));
  const mid = R.pos(R.len * 0.3, sp.hwR - 3.0);
  B.x = mid.x; B.z = mid.z; B.at = [mid.x, mid.z]; B.yDeck = yOf; B.bounds = D.bounds; B.deckAt = D.deckAt; B.route = R;
  for (const q of [0.25, 0.75]) { const p = R.pos(R.len * q, 0); B.anchors.push({ x: p.x, z: p.z }); }
  B.info.buckets = P.b.size; B.info.tris = P.tris; B.info.piers = piers.length; B.info.lamps = D.lampPts.length; B.info.len = +R.len.toFixed(1);
  if (ctx.services) ctx.services.bolshoyPetrovsky = { info: B.info, spec: sp, route: R };
  B.colliders = () => {
    const ph = ctx.physics; D.colliders(ph); B.info.colliders += shore.colliders(ph);
    for (const c of cols) { ph.addBox(c.x, c.z, 1.8, 2.0, 0, -6, c.y1); B.info.colliders++; }
    for (const w of wings) B.info.colliders += closeBank({ site: w.site, L, ph, u: w.u, dir: w.dir, sg: w.sg, v0: w.v0 - 0.35, len: 6.0, yTop: 0.05, draw: false });
  };
  return B;
}
