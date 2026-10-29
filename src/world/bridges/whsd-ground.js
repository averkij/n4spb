// Provenance: copied from the source project 102_3d_piter, commit 0568f7af (src/world/bridges/whsd-ground.js), for the Morskoy / Gavan / Dekabristov areas (docs/gdm-B.md); the lines marked 'n4spb' are the world-rule
// adaptations (docs/AREAS.md 13.7): the median barrier is a row of knock bays (bridges/rails.js parapet bays: thin collider + knock record per bay), the 9 m cobra lamps are knock posts (bridges/knock-posts.js), and only the
// stations that lie in the data extent of the area are built (env.keep, set by bridges/whsd.js: the areas that hold the corridor build their own part from the SAME stations of the whole line, so the seams are continuous).
// bridges/whsd-ground.js - the AT-GRADE stretch of the Western High-Speed Diameter on Vasilievsky Island (second-pass review, docs/research/vo-bridges-wave2.md section 3.3): the two 14.6 m carriageways (4 lanes each, OSM ways
// chained in sites-vo2.js WHSD.ground) from the tunnel portals of the Smolenka mouth (-8158, -1981) / (-8136, -1973) over 1.77 km SSE to the first station of the viaduct at z -300, laid flush on the street level:
// asphalt with GOST lane paint (edge lines + dashes), a concrete median barrier (0.95 m, solid) on the inner side of each carriageway, a kerb strip + a steel W-beam guard rail (visual) on the outer side, 9 m cobra lamps on
// the median barriers every 40 m.  The motorway runs UNDER three crossings of the real cutting (the Mikhmanskaya street overpass and the two park footbridges): our street level is flat, so the crossings are at ground level and
// nothing of the carriageway is drawn inside their footprint (WHSD.ground.gap = z range of the street deck, WHSD.ground.decks = the oriented rectangles of the two OSM footbridge decks, +1 m): the cut ends get a
// concrete cap across the median barrier.  The carriageways are NOT in streets (highway=motorway is no drivable class there): no lanes, no traffic; the red car drives on them like on any ground (groundAt 0.03; asphalt top
// 0.025) and onto the viaduct decks.
// Evidence: OSM ways (baked ROADS), roster 2.4 ("open-air motorway, noise screens"), photos refs/bridges2 z01 .. z07 for the viaduct; there is NO photo of the at-grade stretch in the references (2012 photos pre-date it): the barrier /
// rail / lamp vocabulary is the viaduct's [E].  NO flags / beacons / aviation lights (user rules).
import { WHSD } from './sites-vo2.js';
import { lampCobra } from './sculpt4.js';
import { stations, fade, CUT } from './cutting.js';       // (third pass) the stations of the carriageways and the grass embankments of the open cutting live in cutting.js (pure data for groups.js PAVED_RINGS)

/** true when (x, z) lies under one of the crossings of the corridor (street deck z range, footbridge deck rectangles grown by `m`) */
export function underCrossing(x, z, m = 1.0) {
  const G = WHSD.ground; if (!G) return false;
  if (z > G.gap[0] - m && z < G.gap[1] + m) return true;
  for (const r of G.decks || []) {
    const dx = x - r.c[0], dz = z - r.c[1], t = dx * r.dir[0] + dz * r.dir[1], w = -dx * r.dir[1] + dz * r.dir[0];
    if (t > r.t[0] - m && t < r.t[1] + m && w > r.w[0] - m && w < r.w[1] + m) return true;
  }
  return false;
}

export function buildGround(env, B) {
  const { ctx, P, M } = env, G = WHSD.ground, hw = WHSD.hw, y0 = G.y;
  const barr = M.whsdBarrier, conc = M.whsdConcrete;
  const keep = env.keep || (() => true);                                                                      // n4spb: only the stations inside the data extent of the area are built
  const decks = [];
  for (const k of ['W', 'E']) decks.push(stations(k));
  const at = (d, i, q, y) => [d.st[i].x + d.st[i].nx * d.so * q, y, d.st[i].z + d.st[i].nz * d.so * q];     // + q = the OUTER side (as whsd.js)
  const lerp3 = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  /** the sub-intervals [t0, t1] of the segment station i -> i + 1 (centre line of the carriageway) that are NOT under a crossing */
  const goodRuns = (d, i) => {
    const A = at(d, i, 0, 0), Bq = at(d, i + 1, 0, 0);
    if (!underCrossing((A[0] + Bq[0]) / 2, (A[2] + Bq[2]) / 2, 12) && !underCrossing(A[0], A[2], 12) && !underCrossing(Bq[0], Bq[2], 12)) return [[0, 1]];
    const n = 24, runs = []; let s0 = null;
    for (let k = 0; k <= n; k++) {
      const t = k / n, bad = underCrossing(A[0] + (Bq[0] - A[0]) * t, A[2] + (Bq[2] - A[2]) * t);
      if (!bad && s0 === null) s0 = t;
      if ((bad || k === n) && s0 !== null) { const t1 = bad ? (k - 1) / n : t; if (t1 > s0 + 1e-6) runs.push([s0, t1]); s0 = null; }
    }
    return runs;
  };
  const up = [0, 1, 0], pieces = [];                                                                          // pieces: [ax, az, bx, bz] of the inner barrier chunks for the colliders
  let tris0 = P.tris;
  for (const d of decks) {
    const N = d.st.length;
    for (let i = 0; i + 1 < N; i++) {
      const a = d.st[i], b = d.st[i + 1];
      if (!keep(a.x, a.z) && !keep(b.x, b.z)) continue;                                                       // n4spb: outside the data extent of the area
      const runs = goodRuns(d, i); if (!runs.length) continue;
      const Q = (mat, q0, h0, q1, h1, nrm, t0, t1) => {
        const a0 = at(d, i, q0, y0 + h0), b0 = at(d, i + 1, q0, y0 + h0), a1 = at(d, i, q1, y0 + h1), b1 = at(d, i + 1, q1, y0 + h1);
        P.quad(mat, lerp3(a0, b0, t0), lerp3(a0, b0, t1), lerp3(a1, b1, t1), lerp3(a1, b1, t0), nrm);
      };
      const nIn = [-d.so * a.nx, 0, -d.so * a.nz], nOut = [-nIn[0], 0, -nIn[2]];
      for (const [t0, t1] of runs) {
        Q(M.asphalt, -hw + 0.45, 0, hw - 0.45, 0, up, t0, t1);                                                 // the carriageway between the barriers
        // inner (median) barrier: concrete, 0.95 m high, 0.45 m thick (n4spb: a knock bay, drawn and registered in `pieces` below, not the three quads of the source)
        void nIn;
        // outer side: a kerb strip (0.35 m wide, 0.18 m) and the W-beam guard rail (0.45 m .. 0.80 m over the ground, 0.12 m thick)
        Q(conc, hw - 0.6, 0.18, hw - 0.25, 0.18, up, t0, t1); Q(conc, hw - 0.25, 0, hw - 0.25, 0.18, nOut, t0, t1);
        Q(M.poleGalv, hw - 0.12, 0.45, hw - 0.12, 0.8, nIn, t0, t1); Q(M.poleGalv, hw - 0.12, 0.8, hw - 0.02, 0.8, up, t0, t1); Q(M.poleGalv, hw - 0.02, 0.45, hw - 0.02, 0.8, nOut, t0, t1);
        const A = at(d, i, -hw + 0.22, 0), Bq = at(d, i + 1, -hw + 0.22, 0), p0 = lerp3(A, Bq, t0), p1 = lerp3(A, Bq, t1);
        if (Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) > 0.5) pieces.push({ x0: p0[0], z0: p0[2], x1: p1[0], z1: p1[2], y: y0, ye: y0, h: 0.95, th: 0.45, center: true, box: true, mat: barr });      // n4spb: one breakable bay per run piece (bridges/rails.js parapet: a 0.45 x 0.95 m concrete section)
        // a concrete cap across the median barrier where the run is cut by a crossing (the barrier does not simply stop)
        for (const [t, dir] of [[t0, -1], [t1, 1]]) {
          if ((dir < 0 && t < 1e-6) || (dir > 0 && t > 1 - 1e-6)) continue;
          const c0 = lerp3(at(d, i, -hw, y0), at(d, i + 1, -hw, y0), t), c1 = lerp3(at(d, i, -hw + 0.45, y0), at(d, i + 1, -hw + 0.45, y0), t);
          P.quad(barr, c0, c1, [c1[0], c1[1] + 0.95, c1[2]], [c0[0], c0[1] + 0.95, c0[2]], [a.tx * dir, 0, a.tz * dir]);
        }
      }
      if (i % 2 === 0) {
        for (const [t0, t1] of runs) {
          for (const q of [-hw + 0.95, hw - 1.15]) Q(M.mark, q - 0.08, 0.005, q + 0.08, 0.005, up, t0, t1);       // edge lines
          for (const q of [-3.4, 0, 3.4]) Q(M.mark, q - 0.07, 0.005, q + 0.07, 0.005, up, t0, t1);                // dashes
        }
      }
      if (i % 7 === 0) { const p = at(d, i, hw - 0.18, y0); if (!underCrossing(p[0], p[2])) P.box(M.poleGalv, p[0] - 0.05, p[0] + 0.05, y0, y0 + 0.62, p[2] - 0.05, p[2] + 0.05, 'b', 1); }   // guard-rail posts (axis aligned boxes: 10 cm square, unnoticeable)
    }
    // lamps on the median barrier every 40 m (the viaduct has them on the inner barrier too)
    let nextS = 20;
    for (let i = 0; i < N; i++) {
      const a = d.st[i]; if (a.s < nextS) continue; nextS += 40;
      const p = at(d, i, -hw + 0.25, y0 + 0.95);
      if (a.z < -1950 || underCrossing(p[0], p[2], 2.5) || !keep(p[0], p[2])) continue;
      const rot = Math.atan2(d.so * a.nx, d.so * a.nz);
      // n4spb: a knock post (bridges/knock-posts.js; the pole stands on the median barrier, its collider reaches down to the road)
      B.KP.add('whsd-cobra', (Q) => lampCobra(Q, M, 0, 0, 0, 0, { h: 9, mat: M.poleGalv, arm: 1.6 }), { x: p[0], y: p[1], z: p[2], rotY: rot }, { x: p[0], z: p[2], r: 0.2, y0: y0, y1: p[1] + 9 }, 9);
      B.masts.push({ x: p[0], z: p[2], y: p[1], h: 9, kind: 'cobra' });
    }
  }
  // ---- the open cutting (third pass, cutting.js): grass embankments on both OUTER sides of the pair of carriageways (the inner slope the driver sees, a crest, a steeper outer slope), their height scaled by
  // fade() to zero toward the portals, the viaduct and the three crossings; solid where higher than 0.6 m (nobody walks over the cutting onto the motorway)
  const bankBoxes = [];
  const trisBank = P.tris;
  for (const d of decks) {
    const st = d.st, f = st.map((_, i) => fade(d, i));
    for (let i = 0; i + 1 < st.length; i++) {
      if (f[i] < 0.02 && f[i + 1] < 0.02) continue;
      if (!keep(st[i].x, st[i].z) && !keep(st[i + 1].x, st[i + 1].z)) continue;                              // n4spb: outside the data extent of the area
      const a = st[i], lat = [d.so * a.nx, d.so * a.nz], hAvg = CUT.H * (f[i] + f[i + 1]) / 2;
      const prof = (k) => { const h = CUT.H * f[k]; return [[CUT.q0, 0], [CUT.q1, h], [CUT.q2, h], [CUT.q3, 0]]; };
      const pa = prof(i), pb = prof(i + 1);
      const nz = [[-lat[0] * hAvg, CUT.runIn, -lat[1] * hAvg], [0, 1, 0], [lat[0] * hAvg, CUT.runOut, lat[1] * hAvg]];
      for (let j = 0; j < 3; j++) {
        const A0 = at(d, i, pa[j][0], y0 + pa[j][1]), A1 = at(d, i, pa[j + 1][0], y0 + pa[j + 1][1]), B0 = at(d, i + 1, pb[j][0], y0 + pb[j][1]), B1 = at(d, i + 1, pb[j + 1][0], y0 + pb[j + 1][1]);
        if (Math.abs(A0[1] - A1[1]) + Math.abs(B0[1] - B1[1]) < 0.002 && j !== 1) continue;
        const sa = a.s / 5, sb = st[i + 1].s / 5, qa = pa[j][0] / 5, qb = pa[j + 1][0] / 5;
        P.quad(M.whsdBank, A0, B0, B1, A1, nz[j], [[sa, qa], [sb, qa], [sb, qb], [sa, qb]]);
      }
      if (i % 2 === 0 && i + 2 < st.length) {                                                                  // a solid box per 12 m chunk where the embankment is higher than 0.6 m
        const hm = CUT.H * Math.min(f[i], f[i + 1], f[i + 2]);
        if (hm > 0.75) {
          const qa = CUT.q0 + CUT.runIn * CUT.solidH / hm, qb = CUT.q3 - CUT.runOut * CUT.solidH / hm, qc = (qa + qb) / 2;
          const p0 = at(d, i, qc, 0), p1 = at(d, i + 2, qc, 0), l = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]);
          bankBoxes.push({ x: (p0[0] + p1[0]) / 2, z: (p0[2] + p1[2]) / 2, len: l + 0.4, wid: qb - qa, rot: Math.atan2(-(p1[2] - p0[2]), p1[0] - p0[0]), top: y0 + hm });
        }
      }
    }
  }
  B.info.bankTris = P.tris - trisBank; B.info.bankBoxes = bankBoxes.length;
  B.info.groundTris = P.tris - tris0;
  B.groundPoints = decks.map((d) => ({ k: d.k, n: d.st.length, len: Math.round(d.st[d.st.length - 1].s) }));
  B.groundColliders = () => {
    const ph = ctx.physics;
    for (const q of bankBoxes) { ph.addBox(q.x, q.z, q.len, q.wid, q.rot, -1, q.top); B.info.colliders++; }
    // n4spb: the median barrier pieces are breakable bays (rails.parapet: collider + knock record + the drawn concrete section); registered here, built by rails.flush at the end of bridges.js
    for (const q of pieces) { env.rails.parapet(q); B.info.colliders++; }
  };
  return decks;
}
