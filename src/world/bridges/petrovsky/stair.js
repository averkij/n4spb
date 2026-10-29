// Provenance: copied from the source project 102_3d_piter, commit 0568f7af (src/world/bridges/petrovsky/stair.js), for the Betancourt Bridge (docs/gdm-B.md); the lines marked 'n4spb' are the world-rule adaptations (docs/AREAS.md 13.7):
// the thin boxes along the two sides of every flight and round the landing (the old solid handrail boxes, 0.16 m) are GHOST bays (bridges/rails.js wall: breakable, nothing drawn: the drawn tube handrails are decor); the slim
// columns under the stair, the walk ramps (the treads) stay solid / floors.
// bridges/petrovsky/stair.js - the two long diagonal stairs of the Betancourt pylon platforms (OSM w641971739 on the right / west side and w641971740 on the left / east side: highway=steps, 121 steps, handrail,
//   fixme=geometry; photo bt08 shows the diagonal stair under the deck, [W] "observation platforms 9.2 x 3.25 m, a helical stair at the pylon foot").
//   The stair follows the mapped polyline from its bottom node (ground) to the point where it meets the deck footprint (the platform edge): there it lands on the platform at deck level, through a gap in the deck
//   railing that is exactly as wide as the stair (deck.js `gaps`).  121 steps of 0.33 m tread, rise = deck height / steps, 2.2 m wide, a thin concrete band under the treads, tube handrails, four slim columns.
//   planStairs(R, hwR, hwL, yOf)  -> plans (pure data + maths: used before the deck is built, to open the railing)
//   drawStairs(env, plans, o, B)  -> { colliders(ph), count }       o: { mats { tread, band, rail, col }, wet(x, z) }
//   NO flags / flagpoles (user rules).
import { makeRoute } from './route.js';

/** bottom node first (the OSM way runs uphill) */
export const STAIRS = [
  { id: 'w641971739', pts: [[-4793.6, -2804.9], [-4799.1, -2804.9], [-4803.7, -2803.5], [-4807.3, -2801.1], [-4810, -2799], [-4812.5, -2796.4], [-4815, -2792.2], [-4816.4, -2788.5], [-4817, -2783.9], [-4816.7, -2778.8], [-4815.8, -2774], [-4815.9, -2769.6]] },
  { id: 'w641971740', pts: [[-4779.2, -2798.3], [-4775.7, -2794.6], [-4773.7, -2790.4], [-4772.8, -2785.5], [-4773, -2780.2], [-4774.1, -2775.5], [-4776, -2770.6], [-4779.9, -2766.1], [-4785, -2762.6], [-4788.9, -2759]] },
];
export const STAIR_W = 2.2, RISE = 0.165, BAND = 0.42;                 // (121 steps of the real stair: 20 m / 121 = 0.165 m each)

export function planStairs(R, hwR, hwL, yOf) {
  const plans = [];
  for (const def of STAIRS) {
    const Rs = makeRoute(def.pts, 0.5);
    let LE = null, sg = 0, sE = 0, lastOut = null;
    const inside = (u) => { const p = Rs.pos(u, 0), q = R.sOf(p.x, p.z), hw = q.lat >= 0 ? hwR(q.s) : hwL(q.s); return { ok: Math.abs(q.lat) <= hw + 0.25 && q.s > 5 && q.s < R.len - 5, q }; };
    for (let u = 0; u <= Rs.len; u += 0.1) if (!inside(u).ok) lastOut = u;                 // the bottom of the mapped stair lies under the deck: the stair lands where the path last enters the deck footprint (the platform edge)
    if (lastOut !== null && lastOut + 0.1 <= Rs.len) { LE = lastOut + 0.1; const q = inside(LE).q; sg = q.lat >= 0 ? 1 : -1; sE = q.s; }
    if (LE === null) continue;
    const yTop = yOf(sE);
    // the opening of the deck railing: the part of the railing line (lateral hw - 0.1) that lies inside the stair ribbon
    let sa = null, sb = null;
    for (let s = sE - 7; s <= sE + 7; s += 0.04) {
      const hw = sg > 0 ? hwR(s) : hwL(s), w = R.pos(s, sg * (hw - 0.1)), q = Rs.sOf(w.x, w.z);
      if (q.s >= LE - 5 && q.s <= LE + 1.3 && Math.abs(q.lat) <= STAIR_W / 2 - 0.03) { if (sa === null) sa = s; sb = s; }
    }
    plans.push({ def, Rs, R, LE, sg, sE, yTop, gap: sa === null ? null : [sa, sb] });
  }
  return plans;
}

export function drawStairs(env, plans, o, B) {
  const { P, rails } = env, { tread, band, rail, col } = o.mats, hw = STAIR_W / 2, items = [];
  void rails;
  for (const pl of plans) {
    const { Rs, LE, yTop } = pl, N = Math.max(8, Math.round(yTop / RISE)), rise = yTop / N, yAt = (u) => yTop * u / LE;
    const at = (u, v) => Rs.pos(Math.max(0, Math.min(Rs.len, u)), v), q3 = (u, v, y) => { const p = at(u, v); return [p.x, y, p.z]; };
    // ---- the steps: a tread and a riser per step
    for (let i = 0; i < N; i++) {
      const u0 = LE * i / N, u1 = LE * (i + 1) / N, yA = rise * i, yB = rise * (i + 1), t = at(u0, 0);
      P.quad(tread, q3(u0, -hw, yB), q3(u0, hw, yB), q3(u1, hw, yB), q3(u1, -hw, yB), [0, 1, 0], [[0, 0], [STAIR_W / 2, 0], [STAIR_W / 2, 0.8], [0, 0.8]]);
      P.quad(tread, q3(u0, -hw, yA), q3(u0, hw, yA), q3(u0, hw, yB), q3(u0, -hw, yB), [-t.tx, 0, -t.tz], [[0, 0], [STAIR_W / 2, 0], [STAIR_W / 2, 0.3], [0, 0.3]]);
    }
    // the landing: a short flat plate on the platform edge (the deck pavement continues under it)
    P.quad(tread, q3(LE, -hw, yTop), q3(LE, hw, yTop), q3(LE + 1.2, hw, yTop), q3(LE + 1.2, -hw, yTop), [0, 1, 0]);
    // ---- the band under the treads (sloped soffit + two fascias), every 2 m
    const M = Math.max(2, Math.ceil(LE / 2));
    for (let m = 0; m < M; m++) {
      const u0 = LE * m / M, u1 = LE * (m + 1) / M, t0 = at(u0, 0), yb0 = yAt(u0) - BAND, yb1 = yAt(u1) - BAND, yt0 = yAt(u0) + rise * 0.4, yt1 = yAt(u1) + rise * 0.4;
      P.quad(band, q3(u0, -hw - 0.05, yb0), q3(u0, hw + 0.05, yb0), q3(u1, hw + 0.05, yb1), q3(u1, -hw - 0.05, yb1), [0, -1, 0]);
      for (const sg of [-1, 1]) { const n = [-t0.tz * sg, 0, t0.tx * sg]; P.quad(band, q3(u0, sg * (hw + 0.05), yb0), q3(u1, sg * (hw + 0.05), yb1), q3(u1, sg * (hw + 0.05), yt1), q3(u0, sg * (hw + 0.05), yt0), n); }
    }
    // the foot: the first step stands on a small plinth block
    // ---- tube handrails: posts every ~2 m, a top and a middle tube (cylinders, no caps)
    for (const sg of [-1, 1]) {
      const v = sg * (hw - 0.05);
      for (let m = 0; m <= M; m++) {
        const u = LE * m / M, p = at(u, v), y = yAt(u);
        if (m > 0) { const p0 = at(LE * (m - 1) / M, v), y0 = yAt(LE * (m - 1) / M); for (const h of [1.0, 0.5]) P.cyl(rail, [p0.x, y0 + h, p0.z], [p.x, y + h, p.z], 0.035, 0.035, 5, false); }
        P.cyl(rail, [p.x, y - 0.1, p.z], [p.x, y + 1.0, p.z], 0.03, 0.03, 5, false);
      }
    }
    // ---- the landing is enclosed except toward the deck (the opening of the deck railing): a tube rail on its outer side and across its far end, so that nobody walks off the plate into the air.
    // inner = the side of the ribbon that lies nearer to the deck axis
    const R = pl.R, lq = (u, v) => { const p = at(u, v); return R.sOf(p.x, p.z); }, inner = Math.abs(lq(LE + 0.6, hw).lat) < Math.abs(lq(LE + 0.6, -hw).lat) ? 1 : -1, outer = -inner;
    const land = { inner, outer, u0: LE - 0.3, u1: LE + 1.3 };
    for (const [u0, v0, u1, v1] of [[land.u0, outer * (hw - 0.05), land.u1, outer * (hw - 0.05)], [land.u1, outer * (hw - 0.05), land.u1, 0]]) {
      const a = at(u0, v0), b = at(u1, v1);
      for (const h of [1.0, 0.5]) P.cyl(rail, [a.x, yTop + h, a.z], [b.x, yTop + h, b.z], 0.035, 0.035, 5, false);
      for (const q of [a, b]) P.cyl(rail, [q.x, yTop - 0.1, q.z], [q.x, yTop + 1.0, q.z], 0.03, 0.03, 5, false);
    }
    // ---- four slim columns under the stair (on the ground, or on the bed when they stand in the water)
    const cols = [];
    for (const f of [0.22, 0.42, 0.62, 0.8]) {
      const u = LE * f, p = at(u, 0), wet = o.wet(p.x, p.z), yb = wet ? -4.7 : 0, yt = yAt(u) - BAND + 0.05;
      if (yt - yb < 1.0) continue;
      P.cyl(col, [p.x, yb, p.z], [p.x, yt, p.z], 0.26, 0.3, 8, true); cols.push({ x: p.x, z: p.z, yt });
    }
    items.push({ pl, N, rise, M, cols, at, yAt, land });
  }
  const colliders = (ph, rails) => {
    let n = 0;
    const ghost = (ax, az, bx, bz, y0, y1) => { rails.wall({ x0: ax, z0: az, x1: bx, z1: bz, th: 0.16, y0, y1, y: y0 }); n++; };      // n4spb: a ghost bay instead of the solid 0.16 m box
    for (const it of items) {
      const { pl, M, cols, at, yAt } = it, { LE, yTop } = pl;
      for (let m = 0; m < M; m++) {                                                // walk ramps along the polyline
        const u0 = LE * m / M, u1 = LE * (m + 1) / M, a = at(u0, 0), b = at(u1, 0), dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz);
        ph.addWalkRamp((a.x + b.x) / 2, (a.z + b.z) / 2, STAIR_W - 0.1, l + 0.5, Math.atan2(dx, dz), yAt(u0), yAt(u1), 0.8); n++;
        for (const sg of [-1, 1]) { const pa = at(u0, sg * (hw - 0.02)), pb = at(u1, sg * (hw - 0.02)); ghost(pa.x, pa.z, pb.x, pb.z, Math.min(yAt(u0), yAt(u1)) - 2, Math.max(yAt(u0), yAt(u1)) + 1.2); }
      }
      const e = at(LE, 0), e2 = at(LE + 1.2, 0);                                    // the landing
      ph.addWalkRamp((e.x + e2.x) / 2, (e.z + e2.z) / 2, STAIR_W - 0.1, 1.7, Math.atan2(e2.x - e.x, e2.z - e.z), yTop, yTop, 0.8); n++;
      for (const c of cols) { ph.addCylinder(c.x, c.z, 0.32, -6, c.yt); n++; }
      const { land } = it;                                                          // the outer side and the far end of the landing plate
      for (const [u0, v0, u1, v1] of [[land.u0, land.outer * (hw - 0.02), land.u1 + 0.1, land.outer * (hw - 0.02)], [land.u1, land.outer * (hw + 0.05), land.u1, 0]]) {
        const a = at(u0, v0), b = at(u1, v1);
        ghost(a.x, a.z, b.x, b.z, yTop - 2, yTop + 1.2);
      }
    }
    B.info.colliders += n; return n;
  };
  B.info.stairs = items.length; B.info.stairSteps = items.reduce((a, it) => a + it.N, 0);
  return { colliders, count: items.length, items };
}
