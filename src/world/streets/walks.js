// streets/walks.js - pavements, dropped kerbs, the corner patches and the kerb barriers (chain bollards, guard rails), generated beside the carriageways (visual only:
// +0.12 m, the player's feet stay at y = 0). Per road side the strip follows the kerb and runs to the facade (the street wall of Petersburg is continuous) or ends at its
// nominal width (style.js): Nevsky = grey granite slabs 1.0 x 0.7 m with a darker granite band along the kerb, side streets = small granite pavers 10 x 20 cm.
// The strip is clipped by the facades (ray clearance), the Fontanka quay edge, other roads' asphalt, thick lawn verges (GREEN) and is replaced by a tactile ramp where a
// zebra crossing meets the kerb. Corners get a fan from the fillet arc to the mitre point. Chain bollards (Nevsky) and rail runs (Ligovsky, the square) are collected here.
// The skirts (vertical faces under the pavement edges) are written LAST and cut: no wall on a carriageway (net.cover > -0.1) and none inside paving (a seam between two pavements of
// the same height: the corner patch edges lie inside the strips of their two ways), see skirtKeep. tools/streets-ribbon-audit.mjs counts both (W1 / W2 / W3).
import { UP, hash2, rgb, dpKeep } from './util.js';
import { wayAt, nearCrossing, coverLocal } from './net.js';
import { clearance } from './bld.js';
import { ROAD_Y, WALK_Y, KERB_W, prepWay } from './surface.js';
import { SLAB_TILE, PAVER_TILE, STRIP_TILE } from './tex.js';
import { walkStyle, profMax, barrierAt } from './style.js';
import { deckAt } from './decks.js';
import * as L from '../layout.js';
import { AREAS, GREEN } from '../data/city.js';
import { PavingCoverage } from './paving.js';

const RAMP = 1.1;
const SKIRT = rgb('#8d8884'), CAP = rgb('#9a9591');
const CHAIN_STEP = 2.6;

/** layers outward from the kerb at a sample of way w: { w, tex } (tex: 'strip' | 'slab' | 'paver') */
export function profileAt(w) {
  const st = walkStyle(w);
  return st.strip ? [{ w: 0.5, tex: 'strip' }, { w: st.W - 0.5, tex: st.walk }] : [{ w: st.W, tex: st.walk }];
}
export { profMax };

const ringHas = (o, x, z) => { let ins = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) { const xi = o[i], zi = o[i + 1], xj = o[j], zj = o[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } return ins; };
const polyArea = (o) => { let a = 0; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) a += o[j] * o[i + 1] - o[i] * o[j + 1]; return Math.abs(a) / 2; };

/** point tests used to skip pavement: inside a pedestrian AREAS polygon (the squares' paving), inside a thick lawn polygon */
function makeTests(isOwned) {
  const owned = isOwned ? AREAS.filter((a) => (a.hw === 'square' || a.hw === 'pedestrian' || a.hw === 'footway') && isOwned(a.id)).flatMap((a) => a.polys.map((p) => p.o)) : [];
  const ownedWalk = isOwned ? AREAS.filter((a) => (a.hw === 'pedestrian' || a.hw === 'footway') && isOwned(a.id)).flatMap((a) => a.polys.map((p) => p.o)) : [];     // promenades a landmark module paves up to the kerb (Gostiny Dvor r16467256): our kerb band goes too
  const areas = AREAS.filter((a) => a.hw === 'square' || a.hw === 'pedestrian' || a.hw === 'footway').flatMap((a) => a.polys.map((p) => p.o));
  const lawns = GREEN.filter((g) => g.kind === 'grass' || g.kind === 'garden' || g.kind === 'park').flatMap((g) => g.polys.filter((p) => polyArea(p.o) > 120).map((p) => p.o));
  const box = (o) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < o.length; i += 2) { x0 = Math.min(x0, o[i]); x1 = Math.max(x1, o[i]); z0 = Math.min(z0, o[i + 1]); z1 = Math.max(z1, o[i + 1]); } return [x0, x1, z0, z1]; };
  const A = areas.map((o) => ({ o, b: box(o) })), G = lawns.map((o) => ({ o, b: box(o) })), O = owned.map((o) => ({ o, b: box(o) })), OW = ownedWalk.map((o) => ({ o, b: box(o) }));
  const hit = (list, x, z) => list.some((p) => x >= p.b[0] && x <= p.b[1] && z >= p.b[2] && z <= p.b[3] && ringHas(p.o, x, z));
  // raised paving polygons that streets/paths.js buildAreas draws itself (mapped footway / pedestrian areas that no landmark owns, 0.10 m): a pavement wall that borders one of them is a seam
  const RP = isOwned ? AREAS.filter((a) => (a.hw === 'pedestrian' || a.hw === 'footway') && !isOwned(a.id)).flatMap((a) => a.polys.map((p) => ({ o: p.o, h: p.h || [], b: box(p.o) }))) : [];
  const inRaised = (x, z) => RP.length > 0 && RP.some((p) => x >= p.b[0] && x <= p.b[1] && z >= p.b[2] && z <= p.b[3] && ringHas(p.o, x, z) && !p.h.some((h) => ringHas(h, x, z)));
  return { inRaised, inArea: (x, z) => hit(A, x, z), inLawn: (x, z) => hit(G, x, z), inOwned: (x, z) => O.length > 0 && hit(O, x, z), inOwnedWalk: (x, z) => OW.length > 0 && hit(OW, x, z) };
}

// ------------------------------------------------------------------ the plan: where is there a pavement
// The samples of every pavement strip (side of a way) and the corner patches are planned once per network (cached on net / on the fillet) and used by buildWalks AND by the kerb
// builder (surface.js buildKerbs): a kerb stone that has no pavement behind it because the next carriageway is there (the free-standing kerb of an island between two roadways, the
// kerb arc of a corner whose patch would lie on asphalt) is not drawn.
const STEP = 2.0;
const planT = (net) => net._walkT || (net._walkT = makeTests(null));            // (lawns / squares only: the landmark-owned areas decide later, in buildWalks)
const crossByWay = (net) => {
  if (!net._crossBy) { const m = new Map(); for (const c of net.crossings) { let l = m.get(c.road); if (!l) m.set(c.road, (l = [])); l.push(c); } net._crossBy = m; }
  return net._crossBy;
};

/** samples of the pavement strip along one side of a way: [{ s, x, z, nx, nz, tx, tz, vis, reach, why }] (x, z = the asphalt edge; why = the reason of vis = false: 'cut' (dropped kerb / deck),
 *  'road' (another carriageway lies in the strip), 'facade' (a wall too close), 'lawn') + the zebra zones of the way */
function planSide(net, w, side) {
  const key = w.i * 2 + (side === 'R' ? 1 : 0), cache = net._walkPlan || (net._walkPlan = new Map());
  let plan = cache.get(key); if (plan) return plan;
  prepWay(w);
  const T = planT(net), Wmax = profMax(w), sg = side === 'R' ? 1 : -1, cuts = w.cuts[side];
  const zones = (crossByWay(net).get(w) || []).map((c) => [c.s - c.w / 2 - 0.25, c.s + c.w / 2 + 0.25, c]);
  const S = [];
  const nStep = Math.max(1, Math.ceil(w.L / STEP));
  for (let k = 0; k <= nStep; k++) S.push(w.L * k / nStep);
  for (const z of zones) S.push(z[0], z[1]);
  S.sort((a, b) => a - b);
  const smp = [];
  for (const s of S) {
    if (smp.length && s - smp[smp.length - 1].s < 0.05) continue;
    const q = wayAt(w, s), nx = -q.tz * sg, nz = q.tx * sg;
    const h = (side === 'R' ? q.hR : q.hL) * (w.mit[q.k] + (w.mit[q.k + 1] - w.mit[q.k]) * q.f);          // (the asphalt ribbon is mitred in the bends: the strip starts at its real edge)
    const ex = q.x + nx * h, ez = q.z + nz * h;
    let vis = !cuts.some((c) => s > c[0] + 0.12 && s < c[1] - 0.12) && !deckAt(ex, ez, 1.0), why = vis ? null : 'cut';          // (the bridges module draws the deck with its own pavements)
    let reach = 0;
    const own = { w, s, d: 40 };                                               // the other passes of a looping way (Poltavsky proezd) are foreign asphalt too
    if (vis) {
      const px = ex + nx * (KERB_W + 0.3), pz = ez + nz * (KERB_W + 0.3), fx = ex + nx * (KERB_W + 0.6 * Math.min(Wmax, 3)), fz = ez + nz * (KERB_W + 0.6 * Math.min(Wmax, 3));
      const cover = coverLocal(net, ex, ez, KERB_W + Wmax + 0.7, { own });          // (every probe below lies on the normal within KERB_W + Wmax + 0.5 of the edge point)
      if (cover(px, pz) > -0.3 || cover(fx, fz) > -0.3) { vis = false; why = 'road'; }
      else {
        reach = clearance(ex + nx * KERB_W, ez + nz * KERB_W, nx, nz, Wmax + 0.5);
        let clipped = false;
        const onRoad = (d) => cover(ex + nx * (KERB_W + d), ez + nz * (KERB_W + d)) > -0.1;
        for (let d = 1.2; ; d += 1.2) {                                         // the strip ends where the next carriageway begins (a wide gap between paired one-way roads, a service road beside an avenue)
          const dd = Math.min(d, reach);                                         // (the last probe is the outer edge of the strip itself: a service road that starts 5.6 m from the kerb)
          if (onRoad(dd)) {
            let lo = d - 1.2, hi = dd;
            for (let it = 0; it < 4; it++) { const m = (lo + hi) / 2; if (onRoad(m)) hi = m; else lo = m; }
            reach = Math.max(0, lo - 0.2); clipped = true; break;                // (0.2 m of margin: the edge of an oblique road moves between two stations)
          }
          if (dd >= reach) break;
        }
        if (reach < 0.9) { vis = false; why = clipped ? 'road' : 'facade'; }
        else if (T.inLawn(ex + nx * (KERB_W + 1.0), ez + nz * (KERB_W + 1.0)) && T.inLawn(ex + nx * (KERB_W + Math.max(Math.min(Wmax, 4) - 0.6, 1.2)), ez + nz * (KERB_W + Math.max(Math.min(Wmax, 4) - 0.6, 1.2)))) { vis = false; why = 'lawn'; }
      }
    }
    smp.push({ s, x: ex, z: ez, nx, nz, tx: q.tx, tz: q.tz, vis, reach: Math.min(reach, Wmax + 0.5), why });
  }
  plan = { smp, zones, Wmax }; cache.set(key, plan);
  return plan;
}

/** the corner patch of a fillet: { ok: true, Wc, Q, seq, slab } or { ok: false, why } ('road': it would lie on a carriageway, 'other': a facade / a square / a degenerate corner) */
function cornerPlan(net, f) {
  if (f._cp) return f._cp;
  const T = planT(net), X = f.arms[0], Y = f.arms[1];
  const none = (why) => (f._cp = { ok: false, why });
  if ((X.w.rank < 1 && Y.w.rank < 1) || X.w.skipDraw || Y.w.skipDraw) return none('other');
  const Wn = Math.min(Math.max(profMax(X.w), profMax(Y.w)), 7);
  const nX = f.nA, nY = [-f.nB[0], -f.nB[1]];
  const clrX = clearance(f.TX[0] + nX[0] * KERB_W, f.TX[1] + nX[1] * KERB_W, nX[0], nX[1], Wn + 0.5), clrY = clearance(f.TY[0] + nY[0] * KERB_W, f.TY[1] + nY[1] * KERB_W, nY[0], nY[1], Wn + 0.5);
  let Wc = Math.min(Wn, clrX, clrY);
  const c = nX[0] * nY[0] + nX[1] * nY[1];
  const mitre = (W) => { const k = (KERB_W + W) / (1 + c); return [f.P[0] + (nX[0] + nY[0]) * k, f.P[1] + (nX[1] + nY[1]) * k]; };
  const mid = (W) => [f.P[0] + (nX[0] + nY[0]) * (KERB_W + W) * 0.5, f.P[1] + (nX[1] + nY[1]) * (KERB_W + W) * 0.5];
  const outline = (W) => {                                                       // the corner outline: the first kerb tangent, the arc along the kerb, the second tangent
    const o = [[f.TX[0] + nX[0] * (KERB_W + W), f.TX[1] + nX[1] * (KERB_W + W)]];
    for (const [ax, az] of f.arc) { const ox = f.C[0] - ax, oz = f.C[1] - az, ol = Math.hypot(ox, oz) || 1; o.push([ax + ox / ol * KERB_W, az + oz / ol * KERB_W]); }
    o.push([f.TY[0] + nY[0] * (KERB_W + W), f.TY[1] + nY[1] * (KERB_W + W)]);
    return o;
  };
  const qm0 = mid(Wc);
  if (Wc < 1.0 || L.insideBuilding(qm0[0], qm0[1], 0) || T.inArea(qm0[0], qm0[1]) || 1 + c < 0.25) return none('other');
  // a patch must not lie on a carriageway (the four-node Nevsky / Sadovaya cluster, the Moika / Lebyazhya Kanavka junction, twin carriageways, a bend of its own street): narrow it until
  // its middle, the mitre point and the stretches from the mitre point to the outline are clear of asphalt, the outline itself of the foreign one; drop it when nothing of 1 m is left
  const asphalt = (p) => net.cover(p[0], p[1], { noFillets: true }) > 0.15, foreign = (p) => net.cover(p[0], p[1], { skip: X.w, skip2: Y.w, noFillets: true }) > 0.3;
  let Q, seq;
  for (; Wc >= 1.0; Wc -= 0.75) {
    Q = mitre(Wc); seq = outline(Wc);
    if (!asphalt(mid(Wc)) && !asphalt(Q) && !seq.some((p) => asphalt([(p[0] + Q[0]) / 2, (p[1] + Q[1]) / 2]) || asphalt([p[0] + (Q[0] - p[0]) * 0.25, p[1] + (Q[1] - p[1]) * 0.25]) || asphalt([p[0] + (Q[0] - p[0]) * 0.75, p[1] + (Q[1] - p[1]) * 0.75]) || foreign(p))) break;
  }
  if (Wc < 1.0) return none('road');
  return (f._cp = { ok: true, Wc, Q, seq, slab: walkStyle(X.w).walk === 'slab' || walkStyle(Y.w).walk === 'slab' });
}

/** kerb stones that have nothing behind them: a function (run) -> boolean[] per point of a kerb run, true = do not draw. An edge kerb whose pavement strip is missing because another
 *  carriageway lies behind it (the free-standing kerb of an island between two roadways, a service road beside the avenue) and a corner kerb arc whose patch would lie on asphalt. */
export function kerbBacking(net) {
  return (run) => {
    const drop = new Array(run.pts.length).fill(false);
    if (run.kind === 'arc') {
      const cp = run.fillet && cornerPlan(net, run.fillet);
      if (cp && !cp.ok && cp.why === 'road') drop.fill(true);
      return drop;
    }
    if (run.w.rank < 1 || (run.side !== 'L' && run.side !== 'R')) return drop;
    const smp = planSide(net, run.w, run.side).smp;
    if (smp.length < 2) return drop;
    let j = 0;
    for (let i = 0; i < run.pts.length; i++) {
      const s = run.pts[i].s;
      while (j + 2 < smp.length && smp[j + 1].s < s) j++;
      const a = smp[j], b = smp[j + 1];
      drop[i] = (!a.vis && a.why === 'road') || (!b.vis && b.why === 'road');
    }
    return drop;
  };
}

export function buildWalks(net, MBs, opts = {}) {
  const { slab, paver, strip, ramp, skirt } = MBs;
  const T = makeTests(opts.isOwned);
  const out = { chainPosts: [], chains: [], walkLines: [], rails: [], railList: [] };
  const uvk = (B) => (B === slab ? 1 / SLAB_TILE : B === paver ? 1 / PAVER_TILE : 1 / STRIP_TILE);
  const vQuad = (B, ax, az, bx, bz, y0, y1, nx, nz, col) => {              // vertical quad between two ground points
    const a = B.vert(ax, y0, az, 0, 0, [nx, 0, nz], col), b = B.vert(bx, y0, bz, 1, 0, [nx, 0, nz], col), c = B.vert(bx, y1, bz, 1, 0.1, [nx, 0, nz], col), d = B.vert(ax, y1, az, 0, 0.1, [nx, 0, nz], col);
    B.quad(a, b, c, d, [nx, 0, nz]);
  };
  const flat = (B, x, y, z, col) => B.vert(x, y, z, x * uvk(B), z * uvk(B), UP, col);
  const coverage = new PavingCoverage();
  // The skirts (vertical faces under the pavement edges) are collected and written last, when every pavement of the network exists: the corner patches overlap the strips of their two ways, and
  // the wall of a patch edge that lies inside a neighbouring pavement is a seam, hidden by the paving but drawn by the outline pass as a thin dark line across the pavement (or, where the
  // neighbour is another slab, as a pale ribbon). A wall is also cut wherever it would stand on a carriageway (net.cover > -0.1): it crossed the kerb as a pale ribbon (Vosstaniya Square, 2026-10-07).
  const skReq = [];
  const skirtQuad = (ax, az, bx, bz, y0, y1, nx, nz, col) => { skReq.push([ax, az, bx, bz, y0, y1, nx, nz, col]); };
  const skirtKeep = (x, z, nx, nz) => {
    const nl = Math.hypot(nx, nz) || 1, ox = nx / nl * 0.12, oz = nz / nl * 0.12;
    const paved = (px, pz) => coverage.covers(px, pz) || T.inRaised(px, pz);
    if (paved(x + ox, z + oz) && paved(x - ox, z - oz)) return false;                                // a seam inside the paving
    return net.cover(x, z, {}) <= -0.1;                                                              // (never on asphalt)
  };
  const skirtRuns = (ax, az, bx, bz, nx, nz) => {
    const l = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(l / 1.5));
    const keep = (t) => skirtKeep(ax + (bx - ax) * t, az + (bz - az) * t, nx, nz);
    const cut = (ta, tb, fa) => { let lo = ta, hi = tb; for (let it = 0; it < 9; it++) { const mid = (lo + hi) / 2; if (keep(mid) === fa) lo = mid; else hi = mid; } return (lo + hi) / 2; };
    const runs = []; let prev = keep(0), start = prev ? 0 : -1;
    for (let k = 1; k <= m; k++) {
      const t = k / m, f = keep(t);
      if (f !== prev) { const e = cut((k - 1) / m, t, prev); if (f) start = e; else { runs.push([start, e]); start = -1; } prev = f; }
    }
    if (prev && start >= 0) runs.push([start, 1]);
    return runs.filter(([a, b]) => (b - a) * l >= 0.12);
  };
  const pave = (B, points, col) => {
    for (const poly of coverage.take(points)) {
      // A thinned pavement run may span up to 16 m. Its endpoints can both
      // clear a crossing road while a triangle between them crosses asphalt.
      // Split only triangles that actually meet asphalt, preserving the clear
      // portion instead of dropping a whole stretch of pavement.
      const ids = new Map();
      const vertex = (p) => { let i=ids.get(p); if (i === undefined) { i=flat(B,p[0],WALK_Y,p[1],col); ids.set(p,i); } return i; };
      const emit = (a, b, c) => B.tri(vertex(a),vertex(b),vertex(c),UP);
      const mid = (a,b) => [(a[0]+b[0])/2,(a[1]+b[1])/2];
      const carve = (a,b,c,depth) => {
        const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a),center=[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3];
        const inside = [a,b,c,ab,bc,ca,center].map(p=>net.cover(p[0],p[1]) > .1);
        if (!inside.some(Boolean)) { emit(a,b,c); return; }
        if (inside.every(Boolean)) return;
        const edges=[[a,b,c],[b,c,a],[c,a,b]];
        edges.sort((p,q)=>Math.hypot(q[0][0]-q[1][0],q[0][1]-q[1][1])-Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]));
        const [p,q,r]=edges[0];
        if (depth >= 12 || Math.hypot(p[0]-q[0],p[1]-q[1]) <= 1) return;
        const m=mid(p,q); carve(p,m,r,depth+1); carve(m,q,r,depth+1);
      };
      for(let i=1;i+1<poly.length;i++) carve(poly[0],poly[i],poly[i+1],0);
    }
  };
  const nearStop = opts.nearStop || (() => false);
  // a guard rail keeps >= 0.3 m outside every asphalt (corner fillets, pockets and the next carriageway included): the run is cut where its line comes closer (the rail of Vosstaniya Square)
  const railClear = (a, b) => { const o = KERB_W + 0.22; return [a, b, { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, nx: (a.nx + b.nx) / 2, nz: (a.nz + b.nz) / 2 }].every((p) => net.cover(p.x + p.nx * o, p.z + p.nz * o) < -0.3); };

  for (const w of net.ways) {
    if (w.rank < 1 || w.skipDraw) continue;
    prepWay(w);
    const Wmax = profMax(w);
    for (const side of ['L', 'R']) {
      if (opts.trace) opts.trace(w, side);                                                // (tools/streets-fillet-probe.mjs: which way / side draws the following triangles)
      const plan = planSide(net, w, side), zones = plan.zones, smp = plan.smp.slice();         // (a copy: the thinning below removes samples)
      // thin the samples: on a straight block with a constant facade clearance two samples 16 m apart are enough (was one per 2 m: 200 k triangles of paving)
      if (smp.length > 3) {
        const near = smp.map((p) => nearStop(p.x, p.z)), bar = smp.map((p) => barrierAt(w, p.x, p.z));
        const edge = smp.map((p) => [p.x, p.z]), far = smp.map((p) => [p.x + p.nx * 8, p.z + p.nz * 8]), rch = smp.map((p) => [p.s, p.reach * 0.4]);
        const zEdge = (s) => zones.some((z) => Math.abs(s - z[0]) < 0.06 || Math.abs(s - z[1]) < 0.06);
        const must = (i) => i > 0 && i < smp.length - 1 && (!smp[i].vis || !smp[i - 1].vis || !smp[i + 1].vis || near[i] || near[i - 1] || near[i + 1] || bar[i] !== bar[i - 1] || bar[i] !== bar[i + 1] || zEdge(smp[i].s));
        const keep = dpKeep([edge, far, rch], 0.05, must, 16);
        for (let i = smp.length - 1; i >= 0; i--) if (!keep[i]) smp.splice(i, 1);
      }
      const zoneOf = (s0, s1) => { const m = (s0 + s1) / 2; for (const z of zones) if (m > z[0] && m < z[1]) return z[2]; return null; };
      let runPts = null, railRun = null, post = null;
      const flush = () => {
        if (runPts && runPts.length >= 2) out.walkLines.push({ pts: runPts, w: 2.4 });
        runPts = null;
        if (railRun && railRun.length >= 2) out.rails.push({ pts: railRun, w, side });
        railRun = null; post = null;
      };
      let bolAcc = 0.6 + hash2(w.i, side === 'R' ? 3 : 4) * CHAIN_STEP;
      for (let i = 0; i + 1 < smp.length; i++) {
        const a = smp[i], b = smp[i + 1];
        if (!a.vis || !b.vis) { flush(); continue; }
        const zone = zoneOf(a.s, b.s);
        const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
        const prof = profileAt(w);
        let dA = KERB_W, dB = KERB_W;                                        // how far out the pavement of this segment is really drawn at a / b (a layer a landmark square owns is not): the end cap stands there
        if (zone) {                                                          // dropped kerb: tactile ramp from the road level up to the pavement
          const rx = (p, d, y) => ramp.vert(p.x + p.nx * d, y, p.z + p.nz * d, (p.x + p.nx * d) * 2, (p.z + p.nz * d) * 2, UP);
          const r0 = rx(a, 0.02, ROAD_Y + 0.006), r1 = rx(b, 0.02, ROAD_Y + 0.006), r2 = rx(b, KERB_W + RAMP, WALK_Y), r3 = rx(a, KERB_W + RAMP, WALK_Y);
          ramp.quad(r0, r1, r2, r3);
        }
        // layered strips: offsets measured from the road edge; inside a zebra zone the layers start behind the ramp
        let cur = KERB_W;
        for (const layer of prof) {
          const naturalIn = cur, outerNom = cur + layer.w;
          cur = outerNom;
          const inner = zone ? Math.max(naturalIn, KERB_W + RAMP) : naturalIn;
          const maxA = KERB_W + a.reach, maxB = KERB_W + b.reach;
          if (inner >= outerNom - 0.05 || inner >= maxA - 0.15 || inner >= maxB - 0.15) continue;
          const oa = Math.min(outerNom, maxA), ob = Math.min(outerNom, maxB);
          if (layer.tex === 'strip' && T.inOwnedWalk(a.x + a.nx * (inner + oa) / 2, a.z + a.nz * (inner + oa) / 2) && T.inOwnedWalk(b.x + b.nx * (inner + ob) / 2, b.z + b.nz * (inner + ob) / 2)) continue;   // the landmark promenade paves right up to the kerb
          if (layer.tex !== 'strip' && T.inOwned(a.x + a.nx * (inner + oa) / 2, a.z + a.nz * (inner + oa) / 2) && T.inOwned(b.x + b.nx * (inner + ob) / 2, b.z + b.nz * (inner + ob) / 2)) {     // a landmark module paves this square (Kazan, Palace Square): no pavement of ours on top
            if (layer === prof[prof.length - 1]) { if (!runPts) runPts = []; const c0 = inner + (oa - inner) / 2, c1 = inner + (ob - inner) / 2; if (!runPts.length) runPts.push([a.x + a.nx * c0, a.z + a.nz * c0]); runPts.push([b.x + b.nx * c1, b.z + b.nz * c1]); }
            continue;
          }
          const B = layer.tex === 'strip' ? strip : layer.tex === 'paver' ? paver : slab;
          const tint = 0.97 + 0.06 * hash2(Math.floor(a.x), Math.floor(a.z));
          const warm = layer.tex === 'slab' && w.name === 'Невский проспект' && a.x < -880;                // west Nevsky: grey-pink granite slabs (docs/research/west-nevsky-1.md: #9a6258 .. #b08a7a with grey banding)
          const col = warm ? [tint, tint * 0.94, tint * 0.915] : [tint, tint, tint];
          // Paved squares own their surface. Opposing sidewalk ribbons can
          // overlap there at exactly WALK_Y (Nevsky monument was one example).
          // Preserve the navigation lines below, but omit the duplicate faces.
          const paved = T.inArea((a.x+b.x+a.nx*(inner+oa)/2+b.nx*(inner+ob)/2)/2,
            (a.z+b.z+a.nz*(inner+oa)/2+b.nz*(inner+ob)/2)/2);
          if (!paved) pave(B, [[a.x+a.nx*inner,a.z+a.nz*inner],[b.x+b.nx*inner,b.z+b.nz*inner],
            [b.x+b.nx*ob,b.z+b.nz*ob],[a.x+a.nx*oa,a.z+a.nz*oa]], col);
          if (!paved) { dA = Math.max(dA, oa); dB = Math.max(dB, ob); }
          if (!paved && layer === prof[prof.length - 1] && (outerNom <= maxA - 0.05 || outerNom <= maxB - 0.05)) {   // outer skirt (vertical edge down to the ground) only where the strip ends in the open, not at a facade
            skirtQuad(a.x + a.nx * oa, a.z + a.nz * oa, b.x + b.nx * ob, b.z + b.nz * ob, 0, WALK_Y, a.nx, a.nz, SKIRT);
          }
          if (layer === prof[prof.length - 1]) {
            if (!runPts) runPts = [];
            const c0 = inner + (oa - inner) / 2, c1 = inner + (ob - inner) / 2;
            if (!runPts.length) runPts.push([a.x + a.nx * c0, a.z + a.nz * c0]);
            runPts.push([b.x + b.nx * c1, b.z + b.nz * c1]);
          }
        }
        // end caps where the run starts / stops
        const prevVis = i > 0 && smp[i - 1].vis, nextVis = i + 2 < smp.length && smp[i + 2].vis;
        if (!prevVis || !nextVis) {
          const p = !prevVis ? a : b, dir = !prevVis ? -1 : 1;
          const oEnd = Math.min(cur, KERB_W + p.reach, p === a ? dA : dB);        // (never longer than the pavement that is drawn: inside a square a landmark owns the slab layer is not, a wall there stood alone, 8 m of it at Vosstaniya Square)
          if (oEnd > KERB_W + 0.05) skirtQuad(p.x + p.nx * KERB_W, p.z + p.nz * KERB_W, p.x + p.nx * oEnd, p.z + p.nz * oEnd, 0, WALK_Y, p.tx * dir, p.tz * dir, CAP);
        }
        // kerb barrier: chain bollards every 2.6 m (Nevsky) or a guard-rail run (Ligovsky, the square); none at crossings and bus stops
        const bar = zone || nearStop(mx, mz) ? null : barrierAt(w, mx, mz);
        const len = b.s - a.s;
        if (bar === 'chain' && a.reach > KERB_W + 1.2) {
          for (bolAcc += len; bolAcc >= CHAIN_STEP; bolAcc -= CHAIN_STEP) {
            const t = Math.min(1, Math.max(0, 1 - bolAcc / len)), px = a.x + (b.x - a.x) * t, pz = a.z + (b.z - a.z) * t, nx = a.nx + (b.nx - a.nx) * t, nz = a.nz + (b.nz - a.nz) * t, nl = Math.hypot(nx, nz) || 1;
            const bx = px + nx / nl * (KERB_W + 0.3), bz = pz + nz / nl * (KERB_W + 0.3);
            if (nearStop(bx, bz)) { post = null; continue; }
            const P = { x: bx, z: bz, rotY: Math.atan2(nx / nl, nz / nl) };
            out.chainPosts.push(P);
            if (post && Math.hypot(P.x - post.x, P.z - post.z) < CHAIN_STEP + 0.6) out.chains.push([post.x, post.z, P.x, P.z]);
            post = P;
          }
        } else if (bar === 'rail' && a.reach > KERB_W + 1.2 && railClear(a, b)) {
          const o = KERB_W + 0.22;
          if (!railRun) railRun = [[a.x + a.nx * o, a.z + a.nz * o]];
          railRun.push([b.x + b.nx * o, b.z + b.nz * o]);
          post = null;
        } else { if (railRun && railRun.length >= 2) out.rails.push({ pts: railRun, w, side }); railRun = null; post = null; }
        if (zone && railRun) { out.rails.push({ pts: railRun, w, side }); railRun = null; }
      }
      flush();
    }
  }

  // ---- corner patches (planned in cornerPlan: narrowed until clear of asphalt, dropped when nothing of 1 m is left)
  for (const f of net.fillets) {
    const cp = cornerPlan(net, f); if (!cp.ok) continue;
    if (opts.trace) opts.trace(f);
    const { Q, seq } = cp;
    const B = cp.slab ? slab : paver;
    for (let i = 1; i < seq.length; i++) pave(B,[Q,seq[i-1],seq[i]],[1,1,1]);
    const e1 = seq[0], e2 = seq[seq.length - 1];
    const sk = (p0, p1) => { const dx = p1[0] - p0[0], dz = p1[1] - p0[1], l = Math.hypot(dx, dz) || 1; let nx = dz / l, nz = -dx / l; const mx = (p0[0] + p1[0]) / 2 - f.C[0], mz = (p0[1] + p1[1]) / 2 - f.C[1]; if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; } skirtQuad(p0[0], p0[1], p1[0], p1[1], 0, WALK_Y, nx, nz, SKIRT); };
    sk(e1, Q); sk(Q, e2);
  }
  // ---- the skirts, now that every pavement exists (see skirtKeep)
  for (const [ax, az, bx, bz, y0, y1, nx, nz, col] of skReq) {
    for (const [t0, t1] of skirtRuns(ax, az, bx, bz, nx, nz)) vQuad(skirt, ax + (bx - ax) * t0, az + (bz - az) * t0, ax + (bx - ax) * t1, az + (bz - az) * t1, y0, y1, nx, nz, col);
  }
  return out;
}
export { nearCrossing };
