// Provenance: copied from the source project 102_3d_piter, commit 0568f7af (src/world/bridges/petrovsky/deck.js), for the Betancourt Bridge and the WHSD fairway bridge of Dekabristov Island (docs/gdm-B.md); the lines marked 'n4spb'
// are the world-rule adaptations (docs/AREAS.md 13.7): the median barrier and the two outer barriers are breakable bays (bridges/rails.js parapet bays: the drawn concrete section + a thin collider + a knock record per 8 m chunk, instead of
// the quads of the deck and the solid boxes of the source), the tube railing already is a row of knock bays (rails.add: the extra railing boxes of the source are gone, the gaps of the stairs stay open), the cobra lamps are knock posts
// (bridges/knock-posts.js, B.KP). Solid on purpose: the walk ramps (the floor of the deck), the girder.
// bridges/petrovsky/deck.js - the carriageway deck of the two curved road bridges of Petrovsky Island (Betancourt, Bolshoy Petrovsky): one generic ribbon builder over a route (route.js).
//   Cross-section (v from the axis, +v = right of travel): two one-way carriageways [med, med + road] of asphalt with lane marks, a concrete median barrier (|v| <= med), a concrete barrier
//   (bar wide, barH high) on the outer edge of each carriageway, a pavement / cycle zone out to the railing axis (hwR on the right, hwL on the left, functions of s: the observation platforms
//   of the Betancourt pylon widen it), a tube railing, then the girder: a vertical fascia lip, a sloped web and a flat soffit; where the deck is lower than `low` m it stands on a granite skirt
//   (embankment retaining wall) instead.  Lamp standards (cobra heads) stand behind the outer barriers.  Colliders: walk ramps over the whole width, barrier boxes, railing boxes.
// o: { y(s), hwR(s), hwL(s), med, road, lanes, bar, barH, mats { conc, fas, soff, pave, skirt }, girder { depth, flat, lip }, low, rail { kind, hex }, lamps { every, h, v, from, to, phase } }
// Returns { Y, deckAt(x, z), bounds, hwMax, colliders(ph, info), lampPts, nearIdx }.  NO flags / flagpoles (user rules).
import { lampCobra } from '../sculpt4.js';
import { clamp } from './route.js';
import { postBatch } from '../knock-posts.js';      // n4spb: the cobra lamps are knock posts

export function buildDeck(env, R, o, B) {
  const { ctx, P, M, rails } = env, { pts, S, tan, N, at } = R, PAVE = 0.15;
  const Y = S.map((s) => o.y(s)), hR = S.map((s) => o.hwR(s)), hL = S.map((s) => o.hwL(s));
  const { med, road, bar, barH } = o, mt = o.mats, gd = o.girder, edgeV = med + road, outV = edgeV + bar;
  const q3 = (i, v, dy) => { const p = at(i, v); return [p[0], Y[i] + dy, p[1]]; };
  const strip = (mat, i, va, vb, dy, n = [0, 1, 0], uvk = 4) => P.quad(mat, q3(i, va, dy), q3(i + 1, va, dy), q3(i + 1, vb, dy), q3(i, vb, dy), n, [[S[i] / uvk, va / uvk], [S[i + 1] / uvk, va / uvk], [S[i + 1] / uvk, vb / uvk], [S[i] / uvk, vb / uvk]]);
  const wall = (mat, i, v, dy0, dy1, n, uvk = 2.4) => P.quad(mat, q3(i, v, dy0), q3(i + 1, v, dy0), q3(i + 1, v, dy1), q3(i, v, dy1), n, [[S[i] / uvk, dy0 / uvk], [S[i + 1] / uvk, dy0 / uvk], [S[i + 1] / uvk, dy1 / uvk], [S[i] / uvk, dy1 / uvk]]);
  const lowAt = (i) => Math.min(Y[i], Y[i + 1]) < o.low;
  const laneW = road / o.lanes;
  // o.gaps [{ sg, sa, sb }]: arc-length ranges of the railing line of side sg that stay open (the foot of a stair that lands on the deck: stair.js); keep(sg, s0, s1) = the sub-intervals of [s0, s1] outside the gaps, as fractions
  const gaps = o.gaps || [];
  const keep = (sg, s0, s1) => {
    let segs = [[s0, s1]];
    for (const g of gaps) { if (g.sg !== sg) continue; const nx = []; for (const [a, b] of segs) { if (g.sb <= a || g.sa >= b) { nx.push([a, b]); continue; } if (g.sa > a) nx.push([a, g.sa]); if (g.sb < b) nx.push([g.sb, b]); } segs = nx; }
    return segs.filter(([a, b]) => b - a > 0.12).map(([a, b]) => [(a - s0) / (s1 - s0), (b - s0) / (s1 - s0)]);
  };
  for (let i = 0; i + 1 < N; i++) {
    const t = tan[i], low = lowAt(i), nR = [-t[1], 0, t[0]];                                  // nR: the unit vector to the right of travel (world, y = 0)
    strip(M.asphalt, i, med, edgeV, 0); strip(M.asphalt, i, -edgeV, -med, 0);
    // median barrier: top + both faces (n4spb: a breakable bay, see the chunks below)
    void nR;
    for (const sg of [-1, 1]) {
      const n = sg > 0 ? nR : [-nR[0], 0, -nR[2]], hw = sg > 0 ? hR[i] : hL[i], hw1 = sg > 0 ? hR[i + 1] : hL[i + 1];
      // outer barrier: inner face, top, outer face (from the pavement) (n4spb: a breakable bay, see the chunks below)
      // pavement to the railing axis (+ the cornice lip beyond it)
      P.quad(mt.pave, q3(i, sg * outV, PAVE), q3(i + 1, sg * outV, PAVE), [at(i + 1, sg * hw1)[0], Y[i + 1] + PAVE, at(i + 1, sg * hw1)[1]], [at(i, sg * hw)[0], Y[i] + PAVE, at(i, sg * hw)[1]], [0, 1, 0], [[S[i] / 3, outV / 3], [S[i + 1] / 3, outV / 3], [S[i + 1] / 3, hw1 / 3], [S[i] / 3, hw / 3]]);
      const A0 = at(i, sg * (hw + 0.12)), A1 = at(i + 1, sg * (hw1 + 0.12)), B0 = at(i, sg * hw), B1 = at(i + 1, sg * hw1);
      P.quad(mt.fas, [B0[0], Y[i] + PAVE, B0[1]], [B1[0], Y[i + 1] + PAVE, B1[1]], [A1[0], Y[i + 1] + PAVE, A1[1]], [A0[0], Y[i] + PAVE, A0[1]], [0, 1, 0]);
      if (low) {                                                                               // an embankment / retaining wall: a granite skirt down to the ground
        P.quad(mt.skirt, [A0[0], Y[i] + PAVE, A0[1]], [A1[0], Y[i + 1] + PAVE, A1[1]], [A1[0], -0.2, A1[1]], [A0[0], -0.2, A0[1]], n, [[S[i] / 2.4, 0], [S[i + 1] / 2.4, 0], [S[i + 1] / 2.4, -(Y[i + 1] + PAVE) / 2.4], [S[i] / 2.4, -(Y[i] + PAVE) / 2.4]]);
      } else {
        const lipY = gd.lip, F0 = [A0[0], Y[i] + PAVE - lipY, A0[1]], F1 = [A1[0], Y[i + 1] + PAVE - lipY, A1[1]];
        P.quad(mt.fas, F0, F1, [A1[0], Y[i + 1] + PAVE, A1[1]], [A0[0], Y[i] + PAVE, A0[1]], n);
        const W0 = at(i, sg * gd.flat), W1 = at(i + 1, sg * gd.flat);
        P.quad(mt.fas, [W0[0], Y[i] - gd.depth, W0[1]], [W1[0], Y[i + 1] - gd.depth, W1[1]], F1, F0, [n[0], -0.55, n[2]]);   // the sloped web, facing outward / down
      }
    }
    if (!low) P.quad(mt.soff, q3(i, -gd.flat, -gd.depth), q3(i, gd.flat, -gd.depth), q3(i + 1, gd.flat, -gd.depth), q3(i + 1, -gd.flat, -gd.depth), [0, -1, 0]);
    // lane marks: solid edge lines, dashed lane lines (decals)
    if (S[i] > 5 && S[i] < R.len - 5) {
      for (const sg of [-1, 1]) { strip(M.mark, i, sg * (med + 0.12), sg * (med + 0.24), 0.03); strip(M.mark, i, sg * (edgeV - 0.24), sg * (edgeV - 0.12), 0.03); }
      if (i % 3 !== 2) for (const sg of [-1, 1]) for (let k = 1; k < o.lanes; k++) strip(M.mark, i, sg * (med + laneW * k) - 0.06, sg * (med + laneW * k) + 0.06, 0.03);
    }
    // the tube railing along both outer edges (instanced panels, rails.js)
    for (const sg of [-1, 1]) {
      const hw = sg > 0 ? hR[i] : hL[i], r0 = at(i, sg * (hw - 0.1)), r1 = at(i + 1, sg * ((sg > 0 ? hR[i + 1] : hL[i + 1]) - 0.1)), rl = Math.hypot(r1[0] - r0[0], r1[1] - r0[1]);
      for (const [ta, tb] of keep(sg, S[i], S[i + 1])) {                                    // (the whole bay unless a stair opens the railing here)
        rails.add({ kind: o.rail.kind, hex: o.rail.hex, x: r0[0] + (r1[0] - r0[0]) * ta, y: Y[i] + PAVE + (Y[i + 1] - Y[i]) * ta, z: r0[1] + (r1[1] - r0[1]) * ta, rotY: Math.atan2(-(r1[1] - r0[1]), r1[0] - r0[0]), roll: Math.atan((Y[i + 1] - Y[i]) / rl), len: rl * (tb - ta) }); B.info.rails++;
      }
    }
  }
  // the end faces of the girder (a deck that ends high in the air closes: the WHSD fairway bridge uses this)
  if (o.endCaps) for (const [i, sg] of [[0, -1], [N - 1, 1]]) { const a = at(i, -hL[i] - 0.12), b = at(i, hR[i] + 0.12), n = [tan[i][0] * sg, 0, tan[i][1] * sg]; if (Y[i] > o.low) P.quad(mt.fas, [a[0], Y[i] - gd.depth, a[1]], [b[0], Y[i] - gd.depth, b[1]], [b[0], Y[i] + PAVE, b[1]], [a[0], Y[i] + PAVE, a[1]], n); }
  // lamp standards behind the outer barriers (alternating sides), staggered with the stays by the caller's skip()
  const lampPts = [], lp = o.lamps;
  if (lp) for (let s = lp.from, k = 0; s < lp.to; s += lp.every, k++) {
    const sg = (k + (lp.phase || 0)) % 2 ? 1 : -1, q = R.pos(s, 0), i = clamp(Math.round(s / (R.len / (N - 1))), 0, N - 1), y = o.y(s) + PAVE;
    if (lp.skip && lp.skip(s, sg)) continue;
    const hw = sg > 0 ? o.hwR(s) : o.hwL(s), v = sg * Math.min(outV + 0.75, hw - 0.9), p = R.pos(s, v);
    (B.KP ||= postBatch('brg-' + B.id)).add('cobra' + lp.h, (Q) => lampCobra(Q, M, 0, 0, 0, 0, { h: lp.h, mat: M.steel }), { x: p.x, y, z: p.z, rotY: Math.atan2(sg * q.tz, -sg * q.tx) }, { x: p.x, z: p.z, r: 0.26, y0: y - 1, y1: y + lp.h }, lp.h);      // n4spb: a knock post (collider + record in colliders())
    B.masts.push({ x: p.x, z: p.z, y, h: lp.h, kind: 'cobra' }); lampPts.push({ x: p.x, z: p.z, y, h: lp.h }); void i;
  }
  // ---- deckAt: a coarse grid of segments (cells of 32 m) so that the ~10^6 start-up queries of nav / lamps / props stay cheap
  const CELL = 32, grid = new Map(), reach = Math.max(...hR) + Math.max(...hL) + 4;
  let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
  for (let i = 0; i + 1 < N; i++) {
    const x0 = Math.min(pts[i][0], pts[i + 1][0]) - reach / 2 - 3, x1 = Math.max(pts[i][0], pts[i + 1][0]) + reach / 2 + 3, z0 = Math.min(pts[i][1], pts[i + 1][1]) - reach / 2 - 3, z1 = Math.max(pts[i][1], pts[i + 1][1]) + reach / 2 + 3;
    bx0 = Math.min(bx0, x0); bx1 = Math.max(bx1, x1); bz0 = Math.min(bz0, z0); bz1 = Math.max(bz1, z1);
    for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) for (let cz = Math.floor(z0 / CELL); cz <= Math.floor(z1 / CELL); cz++) { const k = cx * 100003 + cz; let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i); }
  }
  const deckAt = (x, z) => {
    if (x < bx0 || x > bx1 || z < bz0 || z > bz1) return null;
    const a = grid.get(Math.floor(x / CELL) * 100003 + Math.floor(z / CELL)); if (!a) return null;
    for (let k = 0; k < a.length; k++) {
      const i = a[k], dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], l2 = dx * dx + dz * dz, t = ((x - pts[i][0]) * dx + (z - pts[i][1]) * dz) / l2;
      if (t < (i ? -0.2 : -0.25) || t > (i + 2 === N ? 1.25 : 1.2)) continue;      // 0.2 overlap: on the outside of a bend the projections of two stations leave a wedge
      const l = Math.sqrt(l2), lat = (-(x - pts[i][0]) * dz + (z - pts[i][1]) * dx) / l, tt = clamp(t, 0, 1);
      if (lat <= hR[i] + 0.25 && lat >= -hL[i] - 0.25) return Y[i] + (Y[i + 1] - Y[i]) * tt;
    }
    return null;
  };
  const colliders = (ph) => {
    // Every piece is a rectangle along a chord: on the OUTSIDE of a bend two neighbours leave a wedge (lateral reach * the heading change wide) in which a walker lost its footing (feet dropped to the ground, stuck under the
    // railing at the outer pavement of the Betancourt south bend, review 2026-10-14) and a car could slip through the barrier line.  Every piece is therefore lengthened by 1.5 * its lateral reach * the larger heading change to its neighbours.
    const ramps = [], rots = [], dAng = (a, b) => { const d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
    for (let i = 0; i + 1 < N; i += 2) { const j = Math.min(N - 1, i + 2); rots.push(Math.atan2(pts[j][1] - pts[i][1], pts[j][0] - pts[i][0])); }
    for (let i = 0; i + 1 < N; i += 2) {
      const pk = i / 2, dm = Math.max(pk ? dAng(rots[pk], rots[pk - 1]) : 0, pk + 1 < rots.length ? dAng(rots[pk], rots[pk + 1]) : 0);
      const j = Math.min(N - 1, i + 2), dx = pts[j][0] - pts[i][0], dz = pts[j][1] - pts[i][1], l = Math.hypot(dx, dz), rot = -Math.atan2(dz, dx), yLo = Math.min(Y[i], Y[j]), yHi = Math.max(Y[i], Y[j]);
      const wR = Math.max(hR[i], hR[j]), wL = Math.max(hL[i], hL[j]), mx = (pts[i][0] + pts[j][0]) / 2, mz = (pts[i][1] + pts[j][1]) / 2, mid = (tan[i][0] + tan[j][0]) / 2, mid2 = (tan[i][1] + tan[j][1]) / 2, ml = Math.hypot(mid, mid2) || 1;
      const rx = -mid2 / ml, rz = mid / ml, cv = (wR - wL) / 2;                                // the centre of the full width (right = +v)
      const dW = Math.max(Math.max(hR[i], hR[i + 1], hR[j]) - Math.min(hR[i], hR[i + 1], hR[j]), Math.max(hL[i], hL[i + 1], hL[j]) - Math.min(hL[i], hL[i + 1], hL[j]));
      if (dW <= 0.5) ramps.push({ cx: mx + rx * cv, cz: mz + rz * cv, w: wR + wL + 0.2, d: l + 0.5, rot: Math.atan2(dx, dz), yA: Y[i], yB: Y[j], W: Math.max(wR, wL) });
      else for (let q = i; q < j; q++) {                                                     // where the width changes quickly (the pylon platforms) a walk ramp is a wall for anyone below the deck (a stair beside it): fit the ramp edge to the drawn deck edge in 0.4 m steps
        const nq = Math.max(1, Math.ceil(Math.max(Math.abs(hR[q + 1] - hR[q]), Math.abs(hL[q + 1] - hL[q])) / 0.4));
        for (let k = 0; k < nq; k++) {
          const f0 = k / nq, f1 = (k + 1) / nq, ax = pts[q][0] + (pts[q + 1][0] - pts[q][0]) * f0, az = pts[q][1] + (pts[q + 1][1] - pts[q][1]) * f0, bx = pts[q][0] + (pts[q + 1][0] - pts[q][0]) * f1, bz = pts[q][1] + (pts[q + 1][1] - pts[q][1]) * f1;
          const wr = Math.max(hR[q] + (hR[q + 1] - hR[q]) * f0, hR[q] + (hR[q + 1] - hR[q]) * f1), wl = Math.max(hL[q] + (hL[q + 1] - hL[q]) * f0, hL[q] + (hL[q + 1] - hL[q]) * f1);
          const tq0 = tan[q][0], tq1 = tan[q][1], tl = Math.hypot(tq0 + tan[q + 1][0], tq1 + tan[q + 1][1]) || 1, ux = (tq0 + tan[q + 1][0]) / tl, uz = (tq1 + tan[q + 1][1]) / tl, sx = -uz, sz = ux, c2 = (wr - wl) / 2, ddx = bx - ax, ddz = bz - az;
          ramps.push({ cx: (ax + bx) / 2 + sx * c2, cz: (az + bz) / 2 + sz * c2, w: wr + wl + 0.2, d: Math.hypot(ddx, ddz) + 0.3, rot: Math.atan2(ddx, ddz), yA: Y[q] + (Y[q + 1] - Y[q]) * f0, yB: Y[q] + (Y[q + 1] - Y[q]) * f1, W: Math.max(wr, wl) });
        }
      }
      // n4spb: the median barrier and the two outer barriers of the chunk are breakable bays (rails.parapet: the drawn concrete section, a thin collider, a knock record); the bay runs along the chord of the chunk at its own lateral offset
      for (const [v, th] of [[-(edgeV + bar / 2), bar], [0, 2 * med], [edgeV + bar / 2, bar]]) {
        const a = at(i, v), b = at(j, v); rails.parapet({ x0: a[0], z0: a[1], x1: b[0], z1: b[1], y: Y[i], ye: Y[j], h: barH, th, center: true, box: true, mat: mt.conc }); B.info.colliders++;
      }
      void yLo; void yHi; void rot; void dm; void l; void mx; void mz; void rx; void rz;
    }
    for (let k = 0; k < ramps.length && !o.noWalk; k++) {      // n4spb: o.noWalk = skyline scenery (the WHSD fairway bridge): no walk floor, only the breakable barriers / posts are registered
      const r = ramps[k], dm = Math.max(k ? dAng(r.rot, ramps[k - 1].rot) : 0, k + 1 < ramps.length ? dAng(r.rot, ramps[k + 1].rot) : 0), ext = 1.5 * r.W * dm, sl = (r.yB - r.yA) / r.d;
      ph.addWalkRamp(r.cx, r.cz, r.w, r.d + ext, r.rot, r.yA - sl * ext / 2, r.yB + sl * ext / 2, 2.5); B.info.colliders++;
    }
    // n4spb: the railing boxes of the source are gone: the tube railing is a row of knock bays already (rails.add above: every panel owns a thin collider and a record, and the gaps where a stair opens the railing (keep) are open
    // for the walker and for the colliders alike). The lamps are knock posts: their colliders and records come with the flush of the batch.
    if (B.KP) { const k = B.KP.flush(ctx); B.info.colliders += k.colliders; B.extraTris = (B.extraTris || 0) + k.tris; }
  };
  return { Y, hR, hL, deckAt, bounds: [bx0, bz0, bx1, bz1], colliders, lampPts };
}
