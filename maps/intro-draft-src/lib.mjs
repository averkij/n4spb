// Geometry helpers shared by build.mjs. Coordinates are [lon, lat].
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const here = path.dirname(fileURLToPath(import.meta.url));
export const raw = (name) => JSON.parse(fs.readFileSync(path.join(here, 'raw', name + '.json'), 'utf8'));

export const LAT0 = 59.95;
const KX = 111320 * Math.cos((LAT0 * Math.PI) / 180);
const KY = 110950;
export const toM = (p) => [p[0] * KX, p[1] * KY];
export const dist = (a, b) => Math.hypot((a[0] - b[0]) * KX, (a[1] - b[1]) * KY);

export const r5 = (v) => Math.round(v * 1e5) / 1e5;
export const rpt = (p) => [r5(p[0]), r5(p[1])];

export const geomOf = (g) => g.map((n) => [n.lon, n.lat]);

// ---------- Douglas-Peucker (metres) ----------
export function dp(pts, tol) {
  const n = pts.length;
  if (n <= 2) return pts.slice();
  const m = pts.map(toM);
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  const t2 = tol * tol;
  while (stack.length) {
    const [a, b] = stack.pop();
    if (b - a < 2) continue;
    const [ax, ay] = m[a];
    const dx = m[b][0] - ax, dy = m[b][1] - ay;
    const L2 = dx * dx + dy * dy;
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) {
      let d2;
      if (L2 === 0) {
        d2 = (m[i][0] - ax) ** 2 + (m[i][1] - ay) ** 2;
      } else {
        let t = ((m[i][0] - ax) * dx + (m[i][1] - ay) * dy) / L2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const px = ax + t * dx, py = ay + t * dy;
        d2 = (m[i][0] - px) ** 2 + (m[i][1] - py) ** 2;
      }
      if (d2 > best) { best = d2; bi = i; }
    }
    if (best > t2) {
      keep[bi] = 1;
      stack.push([a, bi], [bi, b]);
    }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(pts[i]);
  return out;
}

// closed ring (first == last allowed); returns closed ring with first==last
export function dpRing(ring, tol) {
  let r = ring.slice();
  if (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) r.pop();
  if (r.length < 4) return null;
  // split at the vertex farthest from vertex 0 so the start is not special
  let fi = 0, fd = -1;
  for (let i = 1; i < r.length; i++) {
    const d = dist(r[0], r[i]);
    if (d > fd) { fd = d; fi = i; }
  }
  const a = dp(r.slice(0, fi + 1), tol);
  const b = dp(r.slice(fi).concat([r[0]]), tol);
  const out = a.concat(b.slice(1));
  // out ends with r[0]; closed
  if (out.length < 4) return null;
  return out;
}

// ---------- area / extents ----------
export function ringAreaM2(ring) {
  let s = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const a = toM(ring[i]), b = toM(ring[(i + 1) % n]);
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2; // signed, CCW positive (lon east, lat north)
}
export function bboxOf(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) {
    if (p[0] < x0) x0 = p[0];
    if (p[0] > x1) x1 = p[0];
    if (p[1] < y0) y0 = p[1];
    if (p[1] > y1) y1 = p[1];
  }
  return [x0, y0, x1, y1];
}
export function extentM(pts) {
  const b = bboxOf(pts);
  return Math.hypot((b[2] - b[0]) * KX, (b[3] - b[1]) * KY);
}
export function lengthM(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
  return s;
}

// ---------- chain assembly ----------
// segs: [{ids:[nodeIds], pts:[[lon,lat]...]}]. Joins by shared end node ids.
// directed=true: only tail(A)==head(B). directed=false: any end to any end (reverses as needed).
export function chainWays(segs, directed) {
  const used = new Array(segs.length).fill(false);
  const byHead = new Map();
  const byAny = new Map();
  segs.forEach((s, i) => {
    const h = s.ids[0], t = s.ids[s.ids.length - 1];
    if (!byHead.has(h)) byHead.set(h, []);
    byHead.get(h).push(i);
    for (const k of [h, t]) {
      if (!byAny.has(k)) byAny.set(k, []);
      byAny.get(k).push(i);
    }
  });
  const chains = [];
  const take = (list) => {
    if (!list) return -1;
    for (const j of list) if (!used[j]) return j;
    return -1;
  };
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    let ids = segs[i].ids.slice();
    let pts = segs[i].pts.slice();
    const nSeg = [segs[i]];
    // grow forward
    for (;;) {
      const tail = ids[ids.length - 1];
      let j = -1, rev = false;
      if (directed) {
        j = take(byHead.get(tail));
      } else {
        j = take(byAny.get(tail));
        if (j >= 0) rev = segs[j].ids[0] !== tail;
      }
      if (j < 0) break;
      used[j] = true;
      const s = segs[j];
      const sids = rev ? s.ids.slice().reverse() : s.ids;
      const spts = rev ? s.pts.slice().reverse() : s.pts;
      ids = ids.concat(sids.slice(1));
      pts = pts.concat(spts.slice(1));
      nSeg.push(s);
      if (ids[0] === ids[ids.length - 1]) break;
    }
    // grow backward
    if (ids[0] !== ids[ids.length - 1]) {
      for (;;) {
        const head = ids[0];
        let j = -1, rev = false;
        if (directed) {
          // want seg whose tail == head
          for (let k = 0; k < segs.length; k++) {
            if (!used[k] && segs[k].ids[segs[k].ids.length - 1] === head) { j = k; break; }
          }
        } else {
          j = take(byAny.get(head));
          if (j >= 0) rev = segs[j].ids[segs[j].ids.length - 1] !== head;
        }
        if (j < 0) break;
        used[j] = true;
        const s = segs[j];
        // prepend s so that its tail meets head
        const sids = rev ? s.ids.slice().reverse() : s.ids;
        const spts = rev ? s.pts.slice().reverse() : s.pts;
        ids = sids.slice(0, -1).concat(ids);
        pts = spts.slice(0, -1).concat(pts);
        nSeg.unshift(s);
        if (ids[0] === ids[ids.length - 1]) break;
      }
    }
    chains.push({ ids, pts, segs: nSeg, closed: ids[0] === ids[ids.length - 1] });
  }
  return chains;
}

// Proper ring assembly keeping all points.
export function ringsFromWays(wayPtsList) {
  const key = (p) => p[0].toFixed(7) + ',' + p[1].toFixed(7);
  const segs = wayPtsList
    .filter((p) => p.length >= 2)
    .map((pts) => {
      const ids = new Array(pts.length);
      ids[0] = key(pts[0]);
      ids[pts.length - 1] = key(pts[pts.length - 1]);
      for (let i = 1; i < pts.length - 1; i++) ids[i] = 'i' + Math.random();
      return { pts, ids };
    });
  const chains = chainWays(segs, false);
  const rings = [], open = [];
  for (const c of chains) {
    if (c.closed && c.pts.length >= 4) rings.push(c.pts);
    else open.push(c.pts);
  }
  return { rings, open };
}

// ---------- point in polygon (evenodd over several rings) ----------
export function inRings(p, rings) {
  let inside = false;
  const x = p[0], y = p[1];
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}
export function distToRingsM(p, rings) {
  let best = Infinity;
  const pm = toM(p);
  for (const ring of rings) {
    for (let i = 0, n = ring.length; i < n; i++) {
      const a = toM(ring[i]), b = toM(ring[(i + 1) % n]);
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const L2 = dx * dx + dy * dy;
      let t = L2 ? ((pm[0] - a[0]) * dx + (pm[1] - a[1]) * dy) / L2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const d = Math.hypot(pm[0] - (a[0] + t * dx), pm[1] - (a[1] + t * dy));
      if (d < best) best = d;
    }
  }
  return best;
}

// Pole of inaccessibility over evenodd rings (grid refinement search).
export function polylabel(rings, precisionM = 60, mask = null, edgeRings = null) {
  const outer = rings.reduce((a, b) => (Math.abs(ringAreaM2(a)) > Math.abs(ringAreaM2(b)) ? a : b));
  const [x0, y0, x1, y1] = bboxOf(outer);
  const inside = (p) => inRings(p, rings) && (!mask || mask(p));
  let best = null;
  const evalPt = (p) => {
    let d = distToRingsM(p, rings);
    if (edgeRings) d = Math.min(d, distToRingsM(p, edgeRings));
    return inside(p) ? d : -d;
  };
  const w = (x1 - x0) / 16, h = (y1 - y0) / 16;
  let cells = [];
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
    const cx = x0 + (i + 0.5) * w, cy = y0 + (j + 0.5) * h;
    cells.push({ cx, cy, hw: w / 2, hh: h / 2 });
  }
  const dM = (c) => {
    const d = evalPt([c.cx, c.cy]);
    c.d = d;
    c.max = d + Math.hypot(c.hw * KX, c.hh * KY);
    return c;
  };
  cells = cells.map(dM);
  best = cells.reduce((a, b) => (b.d > a.d ? b : a));
  while (cells.length) {
    cells.sort((a, b) => b.max - a.max);
    const c = cells.shift();
    if (c.max - best.d <= precisionM) break;
    const hw = c.hw / 2, hh = c.hh / 2;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const n = dM({ cx: c.cx + sx * hw, cy: c.cy + sy * hh, hw, hh });
      if (n.d > best.d) best = n;
      if (n.max - best.d > precisionM) cells.push(n);
    }
  }
  return [best.cx, best.cy];
}

// ---------- polyline helpers ----------
// Remove near-duplicate parallel chains (dual carriageways): longest first, drop chains whose
// samples mostly lie within `near` metres of an already kept one.
export function dedupParallel(chains, near = 70, frac = 0.6) {
  const sorted = chains.slice().sort((a, b) => lengthM(b) - lengthM(a));
  const cell = near;
  const grid = new Map();
  const gk = (p) => {
    const m = toM(p);
    return Math.floor(m[0] / cell) + ':' + Math.floor(m[1] / cell);
  };
  const addPt = (p) => {
    const k = gk(p);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(p);
  };
  const isNear = (p) => {
    const m = toM(p);
    const cx = Math.floor(m[0] / cell), cy = Math.floor(m[1] / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const l = grid.get(cx + dx + ':' + (cy + dy));
      if (l) for (const q of l) if (dist(p, q) <= near) return true;
    }
    return false;
  };
  const sample = (pts, step) => {
    const out = [pts[0]];
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = dist(pts[i - 1], pts[i]);
      const n = Math.max(1, Math.round(d / step));
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]);
      }
      acc += d;
    }
    return out;
  };
  const kept = [];
  for (const c of sorted) {
    const s = sample(c, 40);
    let hit = 0;
    for (const p of s) if (isNear(p)) hit++;
    if (hit / s.length >= frac) continue;
    kept.push(c);
    for (const p of sample(c, 25)) addPt(p);
  }
  return kept;
}

// Clip a polyline to a bbox, returning sub-polylines inside (Liang-Barsky per segment).
export function clipPolyline(pts, bb) {
  const [x0, y0, x1, y1] = bb;
  const out = [];
  let cur = null;
  for (let i = 0; i + 1 < pts.length; i++) {
    const p = pts[i], q = pts[i + 1];
    const dx = q[0] - p[0], dy = q[1] - p[1];
    let t0 = 0, t1 = 1;
    const tests = [[-dx, p[0] - x0], [dx, x1 - p[0]], [-dy, p[1] - y0], [dy, y1 - p[1]]];
    let ok = true;
    for (const [pp, qq] of tests) {
      if (pp === 0) { if (qq < 0) { ok = false; break; } continue; }
      const r = qq / pp;
      if (pp < 0) { if (r > t1) { ok = false; break; } if (r > t0) t0 = r; }
      else { if (r < t0) { ok = false; break; } if (r < t1) t1 = r; }
    }
    if (!ok) { if (cur) { out.push(cur); cur = null; } continue; }
    const a = [p[0] + t0 * dx, p[1] + t0 * dy];
    const b = [p[0] + t1 * dx, p[1] + t1 * dy];
    if (!cur || t0 > 0) { if (cur) out.push(cur); cur = [a]; }
    cur.push(b);
    if (t1 < 1) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out.filter((c) => c.length >= 2);
}

// ---------- polygon helper in Python + shapely (carve.py): JSON in, JSON out, full double precision. It fails LOUDLY (throws) when python or shapely is missing: a silent skip would build a wrong map.
import { spawnSync } from 'node:child_process';
export function pyCarve(req) {
  const cands = process.env.N4_PYTHON ? [[process.env.N4_PYTHON, []]] : [['python', []], ['python3', []], ['py', ['-3']]];
  let last = null;
  for (const [exe, pre] of cands) {
    const r = spawnSync(exe, [...pre, path.join(here, 'carve.py')], { input: JSON.stringify(req), encoding: 'utf8', maxBuffer: 1 << 29 });
    if (r.error) { last = exe + ': ' + r.error.message; continue; }
    if (r.status !== 0) throw new Error('carve.py failed (' + exe + ', exit ' + r.status + '): ' + (r.stderr || '').trim() + ' (needs Python 3 with shapely: pip install shapely)');
    return JSON.parse(r.stdout);
  }
  throw new Error('no python found to run carve.py (' + last + '); install Python 3 + shapely (pip install shapely) or set N4_PYTHON');
}

export const sizeKB =(o) => Buffer.byteLength(JSON.stringify(o)) / 1024;

// Sutherland-Hodgman clip of a closed ring to a bbox [minLon,minLat,maxLon,maxLat]. Returns closed ring or null.
export function clipRing(ring, bb) {
  let pts = ring.slice();
  if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
  const edges = [
    [(p) => p[0] >= bb[0], (a, b) => { const t = (bb[0] - a[0]) / (b[0] - a[0]); return [bb[0], a[1] + t * (b[1] - a[1])]; }],
    [(p) => p[0] <= bb[2], (a, b) => { const t = (bb[2] - a[0]) / (b[0] - a[0]); return [bb[2], a[1] + t * (b[1] - a[1])]; }],
    [(p) => p[1] >= bb[1], (a, b) => { const t = (bb[1] - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), bb[1]]; }],
    [(p) => p[1] <= bb[3], (a, b) => { const t = (bb[3] - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), bb[3]]; }],
  ];
  for (const [inside, isect] of edges) {
    if (!pts.length) return null;
    const res = [];
    for (let i = 0; i < pts.length; i++) {
      const cur = pts[i], prev = pts[(i + pts.length - 1) % pts.length];
      const ci = inside(cur), pi = inside(prev);
      if (ci) { if (!pi) res.push(isect(prev, cur)); res.push(cur); }
      else if (pi) res.push(isect(prev, cur));
    }
    pts = res;
  }
  if (pts.length < 3) return null;
  pts.push(pts[0]);
  return pts;
}
