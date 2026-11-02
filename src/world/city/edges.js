// edges.js - the street wall as a graph: every ring edge of every drawn building, which parts of it are hidden by a neighbour (party walls: the continuous street wall
// must never draw two coincident faces), which parts are blank firewalls (a neighbour is lower), whether it faces a street or a courtyard, and the adjacency of the houses
// (used by archetypes.assignColours so that neighbours differ).
//
//   const net = analyse(list)            list = [{ b, st }]   (b = building / part record, st = describe(b); st.H is the cornice height)
//   net.rec.get(id) = { b, st, rings: [{ hole, pts: [[x,z]..], edges: [edge] }] }
//   edge = { i, a:[x,z], b:[x,z], len, dx, dz (unit), nx, nz (outward unit normal), pieces: [{ t0, t1, yLow }], street: { road, gap, sc, name } | null, hole }
//     pieces = the visible intervals along the edge (metres from a): yLow = 0 a full facade piece, yLow > 0 a blank firewall piece that starts at the neighbour's cornice
//   net.adj = Map(id -> [ids that share a wall])
//   net.coverAt(x, z, selfIdx) -> { h, bi } the tallest other building that contains the point (or null)
//   edge.liners = [{ t0, t1, h }]  CRACK LINERS: the hidden part (height h) of a wall whose neighbour comes within 12 cm but does not touch it (OSM nodes of a shared wall are rounded to ~0.1 m): walls.js draws a
//     plain blank quad there, otherwise the slit between the two hidden walls shows the sky through the hollow bodies (docs/rules/FACADE-INTEGRITY.md)
// EXACT intervals: the probe lines 12 cm in front of the wall (cover), 25 cm behind it (embedded ghost wall) and 1.2 cm in front of it (touching?) cross the neighbours' footprint boundaries at known parameters;
// between two crossings nothing changes, so every elementary interval is classified once at its middle (the old 0.9 m sampling lost every sliver < 0.9 m at the ends of party walls). Inside another footprint =
// hidden up to that building's height. Same-facing duplicates (a part inside its outline, overlapping neighbours) are resolved by height, then by index, so exactly one of them draws the wall.
import { ringFromFlat, signedArea } from '../lib/massing.js';
import * as L from '../layout.js';
import { AREAS } from '../data/city.js';
import { regionOf, isVoFresh } from './district.js';

const CELL = 32;
const ringHas = (r, x, z) => { let ins = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins; } return ins; };

const inPr = (pr, x, z) => {
  const b = pr.box; if (x < b[0] || x > b[1] || z < b[2] || z > b[3]) return false;
  if (!ringHas(pr.outer, x, z)) return false;
  for (const h of pr.holes) if (ringHas(h, x, z)) return false;
  return true;
};

// OPEN PUBLIC GROUND: pedestrian streets / squares (OSM place=square, highway=pedestrian areas) are not drivable roads, but a wall that faces one is a street facade, not a courtyard wall
// (Konyushennaya Square: the stables block rendered in the courtyard colour). Parking lots / service areas are NOT included (courtyard yards).
let _pub = null;
function publicGround() {
  if (_pub) return _pub;
  const g = new Map(), PC = 64;
  for (const a of AREAS) {
    if (a.hw !== 'square' && a.hw !== 'pedestrian') continue;
    if (a.tunnel || a.bridge || (a.layer != null && a.layer !== 0)) continue;
    for (const p of a.polys) {
      const outer = ringFromFlat(p.o); if (outer.length < 3) continue;
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of outer) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
      const rec = { outer, holes: p.h.map(ringFromFlat).filter((h) => h.length >= 3), box: [x0, x1, z0, z1], name: a.name || '' };
      for (let cx = Math.floor(x0 / PC); cx <= Math.floor(x1 / PC); cx++) for (let cz = Math.floor(z0 / PC); cz <= Math.floor(z1 / PC); cz++) { const k = cx + ',' + cz; let l = g.get(k); if (!l) g.set(k, (l = [])); l.push(rec); }
    }
  }
  _pub = { at(x, z) { const l = g.get(Math.floor(x / PC) + ',' + Math.floor(z / PC)); if (!l) return null; for (const r of l) { const b = r.box; if (x < b[0] || x > b[1] || z < b[2] || z > b[3] || !ringHas(r.outer, x, z)) continue; if (r.holes.some((h) => ringHas(h, x, z))) continue; return r; } return null; } };
  return _pub;
}

export function analyse(list, occluders = []) {
  const rec = new Map(), polys = [], grid = new Map();
  list.forEach(({ b, st }, bi) => {
    const rings = [];
    for (const poly of b.polys) {
      const outer = ringFromFlat(poly.o); if (outer.length < 3) continue;
      const holes = poly.h.map(ringFromFlat).filter((h) => h.length >= 3);
      let o = outer.slice(); if (signedArea(o) < 0) o.reverse();
      const hs = holes.map((h) => { const r = h.slice(); if (signedArea(r) > 0) r.reverse(); return r; });
      rings.push({ hole: false, pts: o }); for (const h of hs) rings.push({ hole: true, pts: h });
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of o) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      const pr = { bi, id: b.id, H: st.H, y0: Math.max(0, b.minH || 0), outer: o, holes: hs, box: [x0, x1, z0, z1] };
      polys.push(pr);
      for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) for (let cz = Math.floor(z0 / CELL); cz <= Math.floor(z1 / CELL); cz++) { const k = cx + ',' + cz; let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(pr); }
    }
    rec.set(b.id, { b, st, bi, rings });
  });

  /** tallest other building that contains (x, z): { h, bi, pr } or null. y = the height of the wall point is ignored (full-height cover). */
  function coverAt(x, z, selfBi, selfY0 = 0, maxY0 = 3) {
    const cell = grid.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL)); if (!cell) return null;
    let best = null;
    const raised = selfY0 > maxY0;   // a raised part (attic, tower) is only hidden by what reaches into its height range; heights are returned relative to its base
                                     // (maxY0 = 3 m in the older regions; 0.5 m in the new ones: a part that starts at 3.0 m was compared like a ground wall and hidden by a 3 m neighbour)
    for (const pr of cell) {
      if (pr.bi === selfBi) continue;
      if (!raised) { if (pr.y0 > maxY0) continue; } else if (pr.y0 > selfY0 + 0.5 || pr.y0 + pr.H <= selfY0 + 0.3) continue;
      const hh = raised ? pr.y0 + pr.H - selfY0 : pr.H;
      const b = pr.box; if (x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue;
      if (!ringHas(pr.outer, x, z)) continue;
      let inHole = false; for (const h of pr.holes) if (ringHas(h, x, z)) { inHole = true; break; }
      if (inHole) continue;
      if (!best || hh > best.h) best = { h: hh, bi: pr.bi, pr };
    }
    return best;
  }
  /** parameters t (m from e.a) where the probe lines a + n * off (off in offs) cross the footprint boundaries of the other buildings: pushed into out */
  function crossings(e, a, ux, uz, nx, nz, len, offs, out) {
    const bx0 = Math.min(e.a[0], e.b[0]) - 0.5, bx1 = Math.max(e.a[0], e.b[0]) + 0.5, bz0 = Math.min(e.a[1], e.b[1]) - 0.5, bz1 = Math.max(e.a[1], e.b[1]) + 0.5;
    const seen = new Set();
    for (let cx = Math.floor(bx0 / CELL); cx <= Math.floor(bx1 / CELL); cx++) for (let cz = Math.floor(bz0 / CELL); cz <= Math.floor(bz1 / CELL); cz++) {
      const cell = grid.get(cx + ',' + cz); if (!cell) continue;
      for (const pr of cell) {
        if (seen.has(pr)) continue; seen.add(pr);
        const b = pr.box; if (b[1] < bx0 || b[0] > bx1 || b[3] < bz0 || b[2] > bz1) continue;
        for (const ring of [pr.outer, ...pr.holes]) {
          const m = ring.length;
          for (let i = 0; i < m; i++) {
            const p = ring[i], q = ring[(i + 1) % m], ex = q[0] - p[0], ez = q[1] - p[1];
            const den = ux * ez - uz * ex; if (Math.abs(den) < 1e-12) continue;
            for (const off of offs) {
              const wx = p[0] - (a[0] + nx * off), wz = p[1] - (a[1] + nz * off);
              const t = (wx * ez - wz * ex) / den, s = (wx * uz - wz * ux) / den;
              if (s >= -1e-9 && s <= 1 + 1e-9 && t > 0.004 && t < len - 0.004) out.push(t);
            }
          }
        }
      }
    }
  }
  /** unit normal of the edge of pr's outer ring nearest to (x, z) */
  function nearestNormal(pr, x, z) {
    let best = 1e9, nx = 0, nz = 0;
    for (const r of [pr.outer, ...pr.holes]) for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)), d = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
      if (d < best) { best = d; const l = Math.sqrt(l2); nx = dz / l; nz = -dx / l; }
    }
    return [nx, nz];
  }

  // buildings drawn by other modules (landmark owners) still hide the walls of their neighbours
  occluders.forEach((o, k) => {
    const H = o.H;
    for (const poly of o.b.polys) {
      const outer = ringFromFlat(poly.o); if (outer.length < 3) continue;
      const hs = poly.h.map(ringFromFlat).filter((h) => h.length >= 3);
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of outer) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      const pr = { bi: -1 - k, id: o.b.id, H, y0: Math.max(0, o.b.minH || 0), outer, holes: hs, box: [x0, x1, z0, z1] };
      for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) for (let cz = Math.floor(z0 / CELL); cz <= Math.floor(z1 / CELL); cz++) { const kk = cx + ',' + cz; let a = grid.get(kk); if (!a) grid.set(kk, (a = [])); a.push(pr); }
    }
  });
  const adj = new Map();
  const addAdj = (a, b) => { let s = adj.get(a); if (!s) adj.set(a, (s = new Set())); s.add(b); };
  for (const [id, r] of rec) {
    const He = r.st.H, Y0 = Math.max(0, r.b.minH || 0);
    // A cover that starts above the pavement hides a ground wall only from its own bottom up, but a piece is all-or-nothing below `yLow`: a part on a podium (min_height 2.5 m:
    // the columns of Shamsheva ul. 6, 2 m2 each) hid the wall behind it from the ground and left a hole 2.5 m high at eye level (4 runs of the wall audit). In the regions of the
    // Petrograd-side bake a cover must stand on the ground (<= 0.5 m) to hide a ground wall; the older regions keep the 3 m rule (their geometry is frozen: city-signature.mjs).
    const NEWREG = !!regionOf(r.b), CUT = NEWREG ? 0.5 : 3;
    for (const ring of r.rings) {
      const pts = ring.pts, n = pts.length; ring.edges = [];
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
        if (len < 0.12) continue;
        const ux = dx / len, uz = dz / len, nx = uz, nz = -ux;
        const e = { i, a, b, len, dx: ux, dz: uz, nx, nz, hole: ring.hole, pieces: [], street: null, ring };
        // exact elementary intervals: the probe lines (12 cm in front of the wall, 25 cm behind it, 1.2 cm in front of it) cross the footprint boundaries of the neighbours at known
        // parameters; between two crossings nothing changes, so every interval is classified once (at its middle). (The old 0.9 m sampling lost slivers < 0.9 m at the ends of party walls:
        // sky / the hollow body showed through them.)
        const cuts = [0, len];
        crossings(e, a, ux, uz, nx, nz, len, [0.12, -0.25, 0.012], cuts);
        cuts.sort((p, q) => p - q);
        const ts = [cuts[0]]; for (let k = 1; k < cuts.length; k++) if (cuts[k] - ts[ts.length - 1] > 0.004) ts.push(cuts[k]);
        if (ts[ts.length - 1] < len - 0.004) ts.push(len); else ts[ts.length - 1] = len;
        const runs = [], liners = [];
        const pushRun = (arr, q, t0, t1, extra) => { const last = arr[arr.length - 1]; if (last && last.q === q && Math.abs(last.t1 - t0) < 1e-6) last.t1 = t1; else arr.push({ q, t0, t1, ...extra }); };
        for (let k = 0; k + 1 < ts.length; k++) {
          const t0 = ts[k], t1 = ts[k + 1], t = (t0 + t1) / 2;
          const wx = a[0] + ux * t, wz = a[1] + uz * t, px = wx + nx * 0.12, pz = wz + nz * 0.12;
          const c = coverAt(px, pz, r.bi, Y0, CUT);
          let yLow = 0, hidden = false, linerH = 0;
          // overlapping footprints: a wall whose INNER side lies inside another building's mass is embedded in it (a ghost wall seen from behind): hide it
          const ci = coverAt(wx - nx * 0.25, wz - nz * 0.25, r.bi, Y0, CUT);
          // QA fix: two overlapping footprints of equal height that share a boundary each saw the other's mass behind the wall and BOTH hid it (a hole in the street wall): a taller cover hides, an equal one only for the lower index
          if (ci && (ci.h > He + 0.3 || (ci.h >= He - 0.3 && ci.bi < r.bi)) && !(c && c.bi === ci.bi)) { pushRun(runs, -1, t0, t1, { yLow: 0 }); continue; }
          if (c) {
            const [fx, fz] = nearestNormal(c.pr, px, pz);
            const same = fx * nx + fz * nz > 0.5;
            if (same) { hidden = c.h > He + 0.3 || (Math.abs(c.h - He) <= 0.3 && c.bi < r.bi); }
            else {
              if (c.h >= He - 0.3) hidden = true; else yLow = c.h;
              if (c.bi >= 0) addAdj(id, list[c.bi].b.id);
              // CRACK: the neighbour only comes within 12 cm (OSM nodes of a shared wall are rounded to ~0.1 m): both walls hid themselves and the slit between them showed the sky through the
              // hollow bodies. The part that would be hidden is closed by a plain blank liner instead (blank firewall quad: no details, no collider, never seen except through the slit)
              if (!inPr(c.pr, wx + nx * 0.012, wz + nz * 0.012)) linerH = hidden ? He : yLow;
            }
          }
          const q = hidden ? -1 : Math.round(yLow * 2) / 2;
          pushRun(runs, q, t0, t1, { yLow });
          if (linerH > 0.3) pushRun(liners, Math.round(linerH * 2) / 2, t0, t1, { h: linerH });
        }
        // an interval narrower than 5 cm was dropped (no piece, no liner): the neighbour's footprint corner that lies within 12 cm of the wall cuts the probe lines (12 cm in front, 25 cm behind) at
        // parameters a few cm apart, and the slit between them showed the hollow body (w539286853 at (-6896, -972.9): the one unexplained gap of the wall audit). The new regions keep every interval
        // down to 5 mm (walls.js draws a piece narrower than a bay as a plain blank quad); the older regions keep the 5 cm rule (frozen).
        const MINRUN = isVoFresh(r.b) ? 0.005 : 0.05;                                      // (the island rectangles V3..V12 only: the reviewed V1 / V2 / Petrograd regions keep the 5 cm rule, tools/city-signature.mjs)
        for (const ru of runs) {
          if (ru.q < 0) continue;
          if (ru.t1 - ru.t0 < MINRUN) continue;
          e.pieces.push({ t0: ru.t0, t1: ru.t1, yLow: ru.yLow });
        }
        e.liners = liners.filter((ru) => ru.t1 - ru.t0 >= MINRUN).map((ru) => ({ t0: ru.t0, t1: ru.t1, h: ru.h }));
        // street facing: a drivable road within 14 m of the wall (the pavement of Nevsky is ~6 m)
        if (!ring.hole && e.pieces.length) {
          const mx = a[0] + ux * len / 2 + nx * 3, mz = a[1] + uz * len / 2 + nz * 3;
          const rd = L.roadsNear(mx, mz, 11, { drivable: true });
          if (rd.length) { const named = rd.find((q) => q.road.name) || rd[0]; e.street = { road: named.road, gap: named.gap, name: named.road.name || '' }; }
          else {
            const pg = publicGround(), sx = a[0] + ux * len / 2, sz = a[1] + uz * len / 2;
            const hit = pg.at(sx + nx * 2.5, sz + nz * 2.5) || pg.at(sx + nx * 5, sz + nz * 5);
            if (hit) e.street = { road: null, gap: 3, name: hit.name, square: true };
          }
          // The opposite-bank visual strip deliberately imports no roads or
          // navigation. Its exposed outer elevations still need the normal
          // Petersburg facade grammar, rather than brown courtyard walls.
          if (!e.street && r.b.waterfront) e.street = { road: null, gap: 3, name: r.b.addr?.street || '', waterfront: true };
        }
        ring.edges.push(e);
      }
    }
  }
  const adjOut = new Map(); for (const [k, s] of adj) adjOut.set(k, [...s]);
  return { rec, adj: adjOut, coverAt };
}

/** Intersect the segment p->q (a passage polyline piece) with the visible edges: returns [{ edge, t (m from edge.a), point }] sorted along the path. */
export function crossEdges(net, p, q, tol = 1.6) {
  const out = [];
  for (const [, r] of net.rec) for (const ring of r.rings) for (const e of ring.edges) {
    if (!e.pieces.length) continue;
    // distance of p / q to the edge line, and the along-edge parameter
    for (const pt of [p, q]) {
      const t = (pt[0] - e.a[0]) * e.dx + (pt[1] - e.a[1]) * e.dz, off = (pt[0] - e.a[0]) * e.nx + (pt[1] - e.a[1]) * e.nz;
      if (t > 0.6 && t < e.len - 0.6 && Math.abs(off) < tol) out.push({ edge: e, t, rec: r, end: pt === p ? 0 : 1, off });
    }
  }
  return out;
}
