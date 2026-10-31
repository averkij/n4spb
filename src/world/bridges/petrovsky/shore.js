// bridges/petrovsky/shore.js - closes the shore under a HIGH bridge.  The environment opens its quay wall / natural slope / parapet / collider in a zone round every mapped bridge way (waterways.js petroZones, the
// 'bridge zone' of tools/environment-banks.mjs --strict-zones); a bridge that stands at street level closes the opening with its abutments and wing walls (closeBank), but a viaduct that crosses a shore at 10 - 18 m
// leaves the shore itself open under the deck: a walker beneath it would step into the water.  shoreClose() walks the axis, finds every land <-> water transition (the shore crossings), and for each one draws
// a granite wall with a coping and a 1 m parapet along the real bank line across the whole width of the zone (lateral range vA .. vB, 1 m samples) and adds the matching colliders.
//   hole(v, cr): true for a lateral position where the wall is omitted (a deck that meets the bank at street level, like the Bolshoy Petrovsky Bridge, has its own abutments; the wall must not cross its roadway)
//   shoreClose(env, R, { vA, vB, win, yb, mat, par, cop, skip?, hole? })  -> { draw(P), colliders(ph), crossings [{ s, dir }], count }
export function shoreClose(env, R, o) {
  const { ctx, M } = env, L = ctx.L, wet = (x, z) => !!(L.waterwayAt ? L.waterwayAt(x, z) : L.inRiver(x, z));
  const yb = o.yb ?? (env.waterY - 0.2), yTop = 0.05, th = 0.5, win = o.win || 64, step = o.step || 1;
  const mat = o.mat || M.granitePink || M.granite, par = o.par || M.parapetPink || M.parapet, cop = o.cop || M.coping;
  // the crossings of the axis: s where it passes from land to water (dir +1: the water lies toward +s) or from water to land (dir -1)
  const crossings = []; { let prev = null; for (let s = 0; s <= R.len; s += 0.5) { const p = R.pos(s, 0), w = wet(p.x, p.z); if (prev !== null && w !== prev) crossings.push({ s, dir: w ? 1 : -1 }); prev = w; } }
  const runs = [];
  for (const cr of crossings) {
    if (o.skip && o.skip(cr)) continue;
    const pts = [];
    for (let v = o.vA; v <= o.vB + 1e-6; v += step) {
      let found = null, prev = null;
      for (let s = cr.s - win; s <= cr.s + win; s += 0.5) {
        const p = R.pos(s, v), w = wet(p.x, p.z);
        if (prev !== null && w !== prev && (w ? 1 : -1) === cr.dir) { found = s - 0.25; break; }      // the shore lies between the two samples (within 0.5 m)
        prev = w;
      }
      pts.push(found === null ? null : { s: found, v });
    }
    let last = null; for (let k = 0; k < pts.length; k++) { if (pts[k]) last = pts[k]; else if (last) pts[k] = { s: last.s, v: o.vA + k * step }; }   // a gap repeats the last found bank point
    const first = pts.find((q) => q); if (!first) continue; for (let k = 0; k < pts.length && !pts[k]; k++) pts[k] = { s: first.s, v: o.vA + k * step };
    runs.push({ cr, pts });
  }
  let count = 0;
  const isHole = (cr, a, b) => !!o.hole && o.hole((a.v + b.v) / 2, cr);
  const W = (q, d = 0) => { const p = R.pos(q.s + d, q.v); return [p.x, p.z]; };
  const draw = (P) => {
    for (const { cr, pts } of runs) {
      const dir = cr.dir, f = (o.face ?? 0.12) * dir;
      for (let k = 0; k + 1 < pts.length; k++) {
        if (isHole(cr, pts[k], pts[k + 1])) continue;
        const a = pts[k], b = pts[k + 1], A = W(a, f), B = W(b, f), Ai = W(a, f - dir * th), Bi = W(b, f - dir * th), t = R.pos(a.s, a.v), nrm = [t.tx * dir, 0, t.tz * dir];
        P.quad(mat, [A[0], yb, A[1]], [B[0], yb, B[1]], [B[0], yTop, B[1]], [A[0], yTop, A[1]], nrm, [[a.v / 2.2, yb / 2.2], [b.v / 2.2, yb / 2.2], [b.v / 2.2, yTop / 2.2], [a.v / 2.2, yTop / 2.2]]);
        P.quad(cop, [A[0], yTop, A[1]], [B[0], yTop, B[1]], [Bi[0], yTop, Bi[1]], [Ai[0], yTop, Ai[1]], [0, 1, 0]);
        for (const [X, Y2, nx] of [[A, B, nrm], [Ai, Bi, [-nrm[0], 0, -nrm[2]]]]) P.quad(par, [X[0], yTop, X[1]], [Y2[0], yTop, Y2[1]], [Y2[0], yTop + 1.0, Y2[1]], [X[0], yTop + 1.0, X[1]], nx, [[0, 0], [0.2, 0], [0.2, 1], [0, 1]]);
        P.quad(cop, [A[0], yTop + 1.0, A[1]], [B[0], yTop + 1.0, B[1]], [Bi[0], yTop + 1.0, Bi[1]], [Ai[0], yTop + 1.0, Ai[1]], [0, 1, 0]);
        count++;
      }
      for (const [q, sgn] of [[pts[0], -1], [pts[pts.length - 1], 1]]) {                     // the two end faces of the wall (a closed parapet end)
        const A = W(q, f), Ai = W(q, f - dir * th), t = R.pos(q.s, q.v), r = [-t.tz * sgn, 0, t.tx * sgn];
        P.quad(par, [A[0], yTop, A[1]], [Ai[0], yTop, Ai[1]], [Ai[0], yTop + 1.0, Ai[1]], [A[0], yTop + 1.0, A[1]], r, [[0, 0], [0.2, 0], [0.2, 1], [0, 1]]);
      }
    }
  };
  const colliders = (ph) => {
    let n = 0;
    for (const { cr, pts } of runs) {
      const dir = cr.dir;
      for (let k = 0; k + 1 < pts.length; k++) {
        if (isHole(cr, pts[k], pts[k + 1])) continue;
        const A = W(pts[k], 0.12 * dir - dir * 0.15), B = W(pts[k + 1], 0.12 * dir - dir * 0.15), len = Math.hypot(B[0] - A[0], B[1] - A[1]);
        ph.addBox((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, len + 0.3, th, -Math.atan2(B[1] - A[1], B[0] - A[0]), -8, yTop + 1.25); n++;
      }
    }
    return n;
  };
  return { draw, colliders, crossings, runs, get count() { return count; } };
}
