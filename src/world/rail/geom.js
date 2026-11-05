// rail/geom.js - the track and platform geometry of the Moscow Railway Station field, derived from the OSM data
// (data/city.js RAILS / RAIL_NODES / PLATFORMS), made consistent and smooth.
//
// * Every OSM rail way becomes a smooth `Path` (centripetal-free uniform Catmull-Rom through the OSM nodes, 2 m samples).
// * The ELEVEN platform tracks (T1..T11, numbered from the west) are chains of ways (HEAD_CHAINS); track 1 is not mapped in OSM
//   (it lies between platform 1 and track 2) and is synthesised 1.97 m east of the platform-1 edge.
// * The six platform polygons are re-cut into rows (z, west edge, east edge): the OSM edges are smoothed, then pulled back so that
//   every track keeps the loading-gauge clearance (1.92 m axis -> edge); a platform ends where it would be cut by a track.
// Coordinates: world metres, +X east, +Z south; tracks run from the buffer stops in the north (z ~ 420-490) to the SSE.
import { RAILS, RAIL_NODES, PLATFORMS } from '../data/city.js';
import { railLift } from './obvodny.js';

export const RAIL_TOP = 0.28;                 // top of the rail head above the street (y = 0 is the ballast / ground level)
export const PLAT_H = 1.1;                    // platform surface above the rail head (docs/research/station.md)
export const DECK_TOP = RAIL_TOP + PLAT_H;    // 1.38
export const EDGE_CLEAR = 1.92;               // track axis -> platform edge (high platform)
export const HG = 0.76;                       // half gauge (1520 mm)

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** A smooth polyline with arc length. at(s) extrapolates straight beyond both ends (trains arrive from outside the data). */
export class Path {
  constructor(id, pts, o = {}) {
    this.id = id; this.kind = o.kind || 'main'; this.electrified = !!o.electrified; this.name = o.name || id;
    const P = pts.slice();
    const xs = [], zs = [];
    if (P.length < 3 || o.linear) { for (const p of P) { xs.push(p[0]); zs.push(p[1]); } }
    else {
      for (let i = 0; i < P.length - 1; i++) {
        const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
        const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(1, Math.ceil(len / 2));
        // tangents scaled by the segment length (chord-length Hermite)
        const t1 = [(p2[0] - p0[0]), (p2[1] - p0[1])], t2 = [(p3[0] - p1[0]), (p3[1] - p1[1])];
        const l1 = Math.hypot(...t1) || 1, l2 = Math.hypot(...t2) || 1;
        const m1 = [t1[0] / l1 * len, t1[1] / l1 * len], m2 = [t2[0] / l2 * len, t2[1] / l2 * len];
        for (let k = 0; k < n; k++) {
          const u = k / n, u2 = u * u, u3 = u2 * u;
          const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
          xs.push(h00 * p1[0] + h10 * m1[0] + h01 * p2[0] + h11 * m2[0]);
          zs.push(h00 * p1[1] + h10 * m1[1] + h01 * p2[1] + h11 * m2[1]);
        }
      }
      const e = P[P.length - 1]; xs.push(e[0]); zs.push(e[1]);
    }
    this.xs = xs; this.zs = zs;
    this.ss = [0];
    for (let i = 1; i < xs.length; i++) this.ss.push(this.ss[i - 1] + Math.hypot(xs[i] - xs[i - 1], zs[i] - zs[i - 1]));
    this.len = this.ss[this.ss.length - 1];
  }
  /** {x, z, tx, tz, s} at arc length s (unit tangent points to increasing s). */
  at(s, out = {}) {
    const n = this.xs.length, ss = this.ss;
    let i;
    if (s <= 0) i = 0; else if (s >= this.len) i = n - 2;
    else { let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ss[m] <= s) lo = m; else hi = m; } i = lo; }
    const dx = this.xs[i + 1] - this.xs[i], dz = this.zs[i + 1] - this.zs[i], l = Math.hypot(dx, dz) || 1;
    const u = (s - ss[i]);                                  // may be < 0 or > segment length: straight extrapolation
    out.x = this.xs[i] + dx / l * u; out.z = this.zs[i] + dz / l * u; out.tx = dx / l; out.tz = dz / l; out.s = s;
    out.dy = railLift(out.x,out.z);
    return out;
  }
  /** Arc length of the point of the path closest to (x,z) (clamped to the path). */
  project(x, z) {
    let best = 1e18, bs = 0;
    for (let i = 0; i + 1 < this.xs.length; i++) {
      const ax = this.xs[i], az = this.zs[i], dx = this.xs[i + 1] - ax, dz = this.zs[i + 1] - az, l2 = dx * dx + dz * dz || 1;
      const t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1), d = (x - ax - dx * t) ** 2 + (z - az - dz * t) ** 2;
      if (d < best) { best = d; bs = this.ss[i] + t * Math.sqrt(l2); }
    }
    return bs;
  }
  /** Lateral distance (m) from the path and the arc length of the closest point. */
  nearest(x, z) { const s = this.project(x, z), p = this.at(clamp(s, 0, this.len)); return { s, d: Math.hypot(x - p.x, z - p.z), side: (x - p.x) * p.tz - (z - p.z) * p.tx }; }
  /** x of the path at depth z (the paths are monotonic in z), or null outside its z range. */
  xAtZ(z) {
    const zs = this.zs;
    if (z < Math.min(zs[0], zs[zs.length - 1]) || z > Math.max(zs[0], zs[zs.length - 1])) return null;
    let lo = 0, hi = zs.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (zs[m] <= z) lo = m; else hi = m; }
    const dz = zs[hi] - zs[lo];
    return dz ? this.xs[lo] + (this.xs[hi] - this.xs[lo]) * (z - zs[lo]) / dz : this.xs[lo];
  }
  get head() { return { x: this.xs[0], z: this.zs[0] }; }
}

// ------------------------------------------------------------------------------------------------ the OSM ways
const wayById = new Map(RAILS.map((w) => [w.id, w]));
const pairs = (flat) => { const a = []; for (let i = 0; i < flat.length; i += 2) a.push([flat[i], flat[i + 1]]); return a; };
const southward = (pts) => (pts[0][1] <= pts[pts.length - 1][1] ? pts : pts.slice().reverse());

/** Heads of the platform tracks: chain of OSM ways (north buffer stop -> yard throat). Track 1 is synthesised below. */
export const HEAD_CHAINS = {
  2: ['w1089945523', 'w32748907', 'w639456602'],
  3: ['w32748909', 'w639456601'],
  4: ['w1076914001', 'w405701444', 'w639456600'],
  5: ['w1076914000', 'w232634252', 'w639456599'],
  6: ['w595587538'],
  7: ['w32748908', 'w639456597'],
  8: ['w405701440'],
  9: ['w595531469'],
  10: ['w32748912'],
  11: ['w32748913'],
};
/** Platform polygon ids -> the platform tracks that serve it (west to east). */
export const PLATFORM_DEF = [
  { id: 'w93473640', ref: '1', tracks: [1] },
  { id: 'w595741912', ref: '2;3', tracks: [2, 3] },
  { id: 'w93473641', ref: '4;5', tracks: [4, 5] },
  { id: 'w93473638', ref: '6;7', tracks: [6, 7] },
  { id: 'w93473650', ref: '8;9', tracks: [8, 9] },
  { id: 'w93473646', ref: '10;11', tracks: [10, 11] },
];

function chain(ids) {
  let out = [];
  for (const id of ids) {
    const w = wayById.get(id); if (!w) continue;
    const p = southward(pairs(w.pts));
    if (out.length && Math.hypot(out[out.length - 1][0] - p[0][0], out[out.length - 1][1] - p[0][1]) < 3) out.pop();
    out = out.concat(p);
  }
  return out;
}

const ringXs = (o, z) => {
  const xs = [];
  for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) {
    const z0 = o[j + 1], z1 = o[i + 1];
    if ((z0 - z) * (z1 - z) < 0) xs.push(o[j] + (o[i] - o[j]) * (z - z0) / (z1 - z0));
  }
  return xs.sort((a, b) => a - b);
};

/** Smooth a series with a centred moving average of half-window `h` samples (ends keep their value). */
function smooth(a, h) {
  const out = a.slice();
  for (let i = 0; i < a.length; i++) { let s = 0, n = 0; for (let k = -h; k <= h; k++) { const j = i + k; if (j >= 0 && j < a.length) { s += a[j]; n++; } } out[i] = s / n; }
  return out;
}

/** Continue a southbound polyline along the connecting OSM ways (the straightest continuation at every junction) until z >= zMax. */
function extendSouth(pts, zMax = 1120) {
  let cur = pts.slice(); const used = new Set();
  for (let it = 0; it < 16; it++) {
    const end = cur[cur.length - 1]; if (end[1] >= zMax) break;
    const p1 = cur[cur.length - 2], tx = end[0] - p1[0], tz = end[1] - p1[1], l = Math.hypot(tx, tz) || 1;
    let best = null, bestC = 0.55;
    for (const w of RAILS) {
      if (used.has(w.id)) continue;
      const q = southward(pairs(w.pts)), a = q[0];
      if (Math.hypot(a[0] - end[0], a[1] - end[1]) > 3.5) continue;
      const dx = q[1][0] - a[0], dz = q[1][1] - a[1], dl = Math.hypot(dx, dz) || 1, c = (tx * dx + tz * dz) / (l * dl);
      if (c > bestC) { bestC = c; best = { id: w.id, q }; }
    }
    if (!best) break;
    used.add(best.id); cur = cur.slice(0, -1).concat(best.q);
  }
  return cur;
}

export function buildGeometry() {
  const paths = [];            // every way: Path
  const tracks = {};           // 1..11 -> Path (the platform part, drawn)
  const routes = {};           // 1..11 -> Path continued along the throat to the far end of the data (trains run on these)
  const used = new Set();
  for (const [n, ids] of Object.entries(HEAD_CHAINS)) {
    const pts = chain(ids); ids.forEach((id) => used.add(id));
    const way = wayById.get(ids[0]);
    const p = new Path('T' + n, pts, { kind: 'platform', electrified: !!way.electrified, name: 'Путь ' + n });
    p.no = +n; tracks[n] = p; paths.push(p);
    routes[n] = new Path('R' + n, extendSouth(pts), { kind: 'route', electrified: true });
  }
  // platform polygons
  const raw = PLATFORM_DEF.map((d) => {
    const rec = PLATFORMS.find((p) => p.id === d.id);
    return { ...d, o: rec.polys[0].o };
  });
  // ---- track 1 (not in OSM): 1.97 m east of the east edge of platform 1, merging into track 2 at its throat switch
  {
    const P1 = raw[0].o; let z0 = 1e9, z1 = -1e9; for (let i = 1; i < P1.length; i += 2) { z0 = Math.min(z0, P1[i]); z1 = Math.max(z1, P1[i]); }
    const t2 = tracks[2], zEnd = t2.zs[t2.zs.length - 1];
    const pts = [];
    for (let z = z0 + 3; z < zEnd - 70; z += 25) { const xs = ringXs(P1, z); if (xs.length >= 2) pts.push([xs[xs.length - 1] + 1.97, z]); }
    pts.push([t2.xs[t2.xs.length - 1] - 1.2, zEnd - 18], [t2.xs[t2.xs.length - 1], zEnd]);
    const p = new Path('T1', pts, { kind: 'platform', electrified: true, name: 'Путь 1' }); p.no = 1; tracks[1] = p; paths.push(p);
    routes[1] = new Path('R1', extendSouth(pts), { kind: 'route', electrified: true });
  }
  // the other ways: crossovers, throat, yard, sidings
  for (const w of RAILS) {
    if (used.has(w.id)) continue;
    const kind = w.service === 'yard' ? 'yard' : w.service === 'siding' ? 'siding' : 'throat';
    paths.push(new Path(w.id, southward(pairs(w.pts)), { kind, electrified: !!w.electrified && w.electrified !== 'no' }));
  }
  const all = paths;
  // routes that end where they merge into another track (T3 into T2): continue along that one
  for (const [n, r] of Object.entries(routes)) {
    const ex = r.xs[r.xs.length - 1], ez = r.zs[r.zs.length - 1]; if (ez > 1000) continue;
    for (const [m, o] of Object.entries(routes)) {
      if (m === n) continue; const q = o.nearest(ex, ez);
      if (q.d < 2.5 && q.s < o.len - 30) {
        const pts = r.xs.map((x, i) => [x, r.zs[i]]);
        for (let i = 0; i < o.xs.length; i++) if (o.ss[i] > q.s + 1) pts.push([o.xs[i], o.zs[i]]);
        routes[n] = new Path('R' + n, pts, { kind: 'route', electrified: true, linear: true }); break;
      }
    }
  }
  // ---- buffer stops (nodes of kind buffer_stop) -> which track
  const buffers = RAIL_NODES.filter((n) => n.kind === 'buffer_stop').map((n) => ({ x: n.x, z: n.z, id: n.id }));
  for (const b of buffers) {
    let best = 1e9, tr = null;
    for (const p of all) { const d = p.nearest(b.x, b.z).d; if (d < best) { best = d; tr = p; } }
    b.track = best < 2.5 ? tr.id : null;
  }
  // track 1: its own buffer stop at the head
  { const h = tracks[1].head; buffers.push({ x: h.x, z: h.z - 1.0, id: 'synthT1', track: 'T1' }); }
  const nodes = {
    switches: RAIL_NODES.filter((n) => n.kind === 'switch'),
    signals: RAIL_NODES.filter((n) => n.kind === 'signal'),
    crossings: RAIL_NODES.filter((n) => n.kind === 'railway_crossing'),
  };

  // ---- platforms: rows with clearance
  const platforms = raw.map((d) => {
    let z0 = 1e9, z1 = -1e9; for (let i = 1; i < d.o.length; i += 2) { z0 = Math.min(z0, d.o[i]); z1 = Math.max(z1, d.o[i]); }
    const zs = []; for (let z = z0 + 0.4; z < z1 - 0.4; z += 4) zs.push(z); zs.push(z1 - 0.4);
    let xl = [], xr = [], okz = [];
    for (const z of zs) { const xs = ringXs(d.o, z); if (xs.length >= 2) { xl.push(xs[0]); xr.push(xs[xs.length - 1]); okz.push(z); } }
    xl = smooth(xl, 6); xr = smooth(xr, 6);
    const own = new Set(d.tracks.map((n) => 'T' + n));
    const rows = [];
    for (let i = 0; i < okz.length; i++) {
      const z = okz[i]; let L = xl[i], R = xr[i]; const c = (L + R) / 2;
      let cut = false;
      for (const p of all) {
        const x = p.xAtZ(z); if (x == null) continue;
        const EC = EDGE_CLEAR * 1.025;
        if (x > L + 0.6 && x < R - 0.6) { cut = true; break; }       // a track runs through the platform
        if (x <= c) { if (L - x < EC) L = Math.max(L, x + EC); } else if (x - R < EC) R = Math.min(R, x - EC);
      }
      if (cut || R - L < 2.5) { if (rows.length > 6) break; else continue; }
      rows.push({ z, xl: L, xr: R });
    }
    return { ...d, rows, zHead: rows[0].z, zTail: rows[rows.length - 1].z };
  });
  // ---- which side of each track has a platform (west = -1, east = +1)
  const sides = {};
  for (const t of Object.values(tracks)) {
    sides[t.no] = [];
    for (const pl of platforms) {
      if (!pl.tracks.includes(t.no)) continue;
      // the platform is on the west side of the track when the platform's mean x is lower
      const z = (pl.zHead + pl.zTail) / 2, x = t.xAtZ(z) ?? t.xs[0], r = pl.rows.reduce((b, q) => (Math.abs(q.z - z) < Math.abs(b.z - z) ? q : b), pl.rows[0]);
      sides[t.no].push((r.xl + r.xr) / 2 < x ? -1 : 1);
    }
  }
  return { paths, tracks, routes, platforms, buffers, nodes, sides };
}

/** Row interpolation helper: { xl, xr } of a platform at depth z (clamped). */
export function platformAt(pl, z) {
  const R = pl.rows; if (z <= R[0].z) return R[0]; if (z >= R[R.length - 1].z) return R[R.length - 1];
  let lo = 0, hi = R.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (R[m].z <= z) lo = m; else hi = m; }
  const u = (z - R[lo].z) / (R[hi].z - R[lo].z);
  return { z, xl: R[lo].xl + (R[hi].xl - R[lo].xl) * u, xr: R[lo].xr + (R[hi].xr - R[lo].xr) * u };
}
