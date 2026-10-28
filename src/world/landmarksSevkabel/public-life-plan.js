// Shared public-life placement plan for wall openings, café interiors/terraces,
// cable anchors and spool towers. Dossier: docs/SEVKABEL-CULTURE.md follow-up.
// Façade frames derive from OSM edges; no rectangular approximation may support
// a cable endpoint. The building and detail generators consume the same plan.
import { polysOf } from './common.js';
import { ringEdges, frameOf } from './kit.js';
import { H } from './frame.js';

export const SPOOL_TOWERS = [[-60, -30.5], [-35, -40.5], [-10, -30.5], [15, -31], [40, -31], [-95, -10], [-100, 8]];
export const DINING = [
  { id: 'sevkabel-restaurant-sea', bld: 'r8702906', edge: 2, u: 19.7, w: 12.4, depth: 5.8, h: 3.7, title: 'РЕСТОРАН', color: 'cultureTeal' },
  { id: 'sevkabel-bistro', bld: 'r8702906', edge: 2, u: 44.4, w: 12.4, depth: 5.8, h: 3.7, title: 'БИСТРО', color: 'cultureRose' },
  { id: 'sevkabel-coffee-yard', bld: 'r8702907', edge: 7, u: 4.4, w: 6.5, depth: 4.1, h: 3.25, title: 'КОФЕ', color: 'cultureTeal' },
  { id: 'sevkabel-bakery-yard', bld: 'r8702907', edge: 7, u: 13.0, w: 6.5, depth: 4.1, h: 3.25, title: 'ПЕКАРНЯ', color: 'cultureRose' },
];

export function diningEdge(def) { return ringEdges(polysOf(def.bld)[0])[def.edge]; }

/** The boiler management block is authored from H-frame rounded vertices.
 * Match that sub-outline's real wall to the canonical edge within 25 cm. */
export function diningOnEdge(bld, edge) {
  return DINING.filter(d => {
    if (d.bld !== bld) return false;
    const e = diningEdge(d), dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    return Math.min(dist(e.a, edge.a) + dist(e.b, edge.b), dist(e.a, edge.b) + dist(e.b, edge.a)) < .5;
  });
}

export function diningOpenings(bld, edge, M) {
  return diningOnEdge(bld, edge).map(d => ({ x: d.u, w: d.w, y0: .12, y1: d.h, glass: M.cafeGlass, depth: .25 }));
}

export function diningSkips(ops, len, pitch, margin, width) {
  const count = Math.max(1, Math.round((len - 2 * margin) / pitch)), step = (len - 2 * margin) / count;
  return i => { const x = margin + (i + .5) * step; return ops.some(p => Math.abs(x - p.x) < (p.w + width) / 2 + .05); };
}

/** A wall-to-wall span selected by closest point on an actual yard-facing edge.
 * Insets from corners prevent an eyelet from hanging past a building end. */
export function wallFestoonPlan(requestedX) {
  const wanted = H.W(requestedX, -49.2); let best = null, score = Infinity;
  for (const id of ['r8702907', 'r8702909']) for (const edge of ringEdges(polysOf(id)[0])) {
    if (edge.len < 4 || edge.n[0] * H.V[0] + edge.n[1] * H.V[1] < .5) continue;
    const f = frameOf(edge), u = Math.max(1.4, Math.min(edge.len - 1.4, (wanted.x - f.x) * f.xa[0] + (wanted.z - f.z) * f.xa[1]));
    const x = f.x + f.xa[0] * u, z = f.z + f.xa[1] * u, q = H.M(x, z);
    if (q.v > -30 || q.v < -70 || Math.abs(q.u) > 76.6) continue;
    const distance = Math.hypot(x - wanted.x, z - wanted.z);
    if (distance < score) { score = distance; best = { bld: id, x, z, u: q.u, v: q.v, nx: edge.n[0], nz: edge.n[1] }; }
  }
  if (!best || score > 6) return null;
  return { hall: { bld: 'r8702908', ...H.W(best.u, -25), nx: -H.V[0], nz: -H.V[1] }, yard: best, y: 6.3 };
}
