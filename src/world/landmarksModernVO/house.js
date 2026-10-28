// landmarksModernVO/house.js - the House helper shared by the house files: footprints of the claimed ids in the model frame, edge pieces of the fronts, the plain walls of everything else, the mitred ring bands
// (cornice, belts), roof decks and the thin-wall colliders.  A house file does: const h = new House(K, { F, ids, H }); h.begin(); ... h.end(); (begin / end push / pop the frame on the Parts transform).
//   h.polys     [{ id, o, h }]   the baked polygons in the frame (flat rings of (u, z));  h.edges  ringEdges() of all rings in the frame, each with .used / .ring
//   h.pieces(u0, u1, o)  edges of the front that run parallel to u (outward normal +z, within o.zTol of the plane z = 0) inside [u0, u1] -> [{ u0, u1, d, e }] and marks them used
//   h.front(spec, u0, u1, o) = pieces + winWall per piece (spec: { bands, wins, reveal, glass, depth })   h.rest(spec) = every unused edge as a plain wall with window rows
//   h.band(y0, y1, d, mats, o)  a mitred band round all rings (cornice, belt) except edges for which o.skip(e) is true;  h.roof(y, mat)  flat deck over all polygons (holes cut)
//   h.colliders(y1)  thin wall boxes round the world polygons
import * as L from '../layout.js';
import { ringEdges, onEdge, band } from './kit.js';
import { polysOf, toLocal } from './frame.js';
import { winWall } from './wallx.js';
import { addPolyColliders } from '../lib/massing.js';
import { coverFn, inRing, distToLine } from './surfaces.js';

export class House {
  constructor(K, cfg) {
    this.K = K; this.P = K.P; this.M = K.M; this.ctx = K.ctx; this.cfg = cfg; this.F = cfg.F; this.H = cfg.H; this.name = cfg.name || cfg.ids[0];
    const miss = [];
    this.world = polysOf(cfg.ids, miss);
    if (miss.length) console.warn(`[landmarksModernVO] ${this.name}: footprints missing for ${miss.join(', ')}`);
    this.polys = this.world.map((p) => toLocal(this.F, p));
    this.edges = []; this.groups = [];
    for (const p of this.polys) {
      const es = ringEdges(p, 0.05); let grp = null, prev = null;
      for (const e of es) { e.used = false; e.poly = p; if (!grp || e.hole !== prev.hole || e.i <= prev.i) { grp = []; this.groups.push(grp); } grp.push(e); prev = e; this.edges.push(e); }
    }
    this.cover = coverFn(K.ctx);
  }
  begin() { this.F.enter(this.P); return this; }
  end() { this.F.leave(this.P); return this; }

  /** edges parallel to the front (+z outward) inside [u0, u1]; o: { zTol (1.6), slope (0.35), mark (true) } */
  pieces(u0, u1, o = {}) {
    const zTol = o.zTol ?? 1.6, slope = o.slope ?? 0.35, out = [];
    for (const e of this.edges) {
      if (e.used && o.mark !== false) continue;
      if (e.hole || e.n[1] < 0.9 || Math.abs(e.n[0]) > 0.2) continue;
      if (Math.abs(e.a[1] - e.b[1]) > slope) continue;
      const d = (e.a[1] + e.b[1]) / 2; if (d < -zTol || d > zTol) continue;
      const a = Math.min(e.a[0], e.b[0]), b = Math.max(e.a[0], e.b[0]), m = (a + b) / 2;
      if (m < u0 || m > u1) continue;
      out.push({ u0: a, u1: b, d, e });
    }
    out.sort((p, q) => p.u0 - q.u0);
    if (o.mark !== false) for (const p of out) p.e.used = true;
    return out;
  }
  /** the pieces of a front drawn as windowed walls; returns the pieces. spec: { bands, wins, reveal, glass, depth, clipU0, clipU1 } */
  front(spec, u0, u1, o = {}) {
    const ps = this.pieces(u0, u1, o);
    for (const p of ps) winWall(this.P, { ...spec, x0: Math.max(p.u0, spec.clipU0 ?? -1e9), x1: Math.min(p.u1, spec.clipU1 ?? 1e9), z: p.d });
    return ps;
  }
  /** one x-span [a, b] of a front piece as a windowed wall with its own bands; only the windows wholly inside the span and the band range are used.  spec: { reveal, glass, depth } */
  span(p, a, b, bands, wins, spec = {}) {
    const x0 = Math.max(a, p.u0), x1 = Math.min(b, p.u1); if (x1 - x0 < 1e-3) return;
    const ya = bands[0].y0, yb = bands[bands.length - 1].y1;
    const ws = wins.filter((w) => w.x - w.w / 2 >= x0 - 1e-3 && w.x + w.w / 2 <= x1 + 1e-3 && w.y >= ya - 1e-3 && w.y + w.h <= yb + 1e-3);
    winWall(this.P, { reveal: spec.reveal, glass: spec.glass, depth: spec.depth, x0, x1, z: p.d, bands, wins: ws });
  }
  /** unused edges (outer rings only unless o.holes) satisfying fn(e), in ring order; marks them used unless o.mark === false */
  sel(fn, o = {}) {
    const out = [];
    for (const e of this.edges) { if (e.used || (e.hole && !o.holes)) continue; if (fn(e)) out.push(e); }
    if (o.mark !== false) for (const e of out) e.used = true;
    return out;
  }
  /** unused edges whose two end points lie within r of the main-frame point (cu, cz) */
  near(cu, cz, r, o = {}) { return this.sel((e) => Math.hypot(e.a[0] - cu, e.a[1] - cz) <= r && Math.hypot(e.b[0] - cu, e.b[1] - cz) <= r, o); }
  /** run fn in the frame F2 (leaves the main frame, enters F2, then restores the main frame) */
  inFrame(F2, fn) { this.F.leave(this.P); F2.enter(this.P); try { return fn(); } finally { F2.leave(this.P); this.F.enter(this.P); } }
  /** like pieces() but for another frame F2 (the front u axis of F2): edges are converted main -> world -> F2 */
  piecesIn(F2, u0, u1, o = {}) {
    const zTol = o.zTol ?? 1.6, slope = o.slope ?? 0.35, out = [];
    const to2 = (p) => { const w = this.F.W(p[0], p[1]); const m = F2.M(w.x, w.z); return [m.u, m.z]; };
    for (const e of this.edges) {
      if (e.used && o.mark !== false) continue;
      if (e.hole) continue;
      const wn = [this.F.C * e.n[0] + this.F.S * e.n[1], -this.F.S * e.n[0] + this.F.C * e.n[1]];
      const n2 = [F2.C * wn[0] - F2.S * wn[1], F2.S * wn[0] + F2.C * wn[1]];
      if (n2[1] < 0.9 || Math.abs(n2[0]) > 0.2) continue;
      const a = to2(e.a), b = to2(e.b);
      if (Math.abs(a[1] - b[1]) > slope) continue;
      const d = (a[1] + b[1]) / 2; if (d < -zTol || d > zTol) continue;
      const lo = Math.min(a[0], b[0]), hi = Math.max(a[0], b[0]), m = (lo + hi) / 2;
      if (m < u0 || m > u1) continue;
      out.push({ u0: lo, u1: hi, d, e });
    }
    out.sort((p, q) => p.u0 - q.u0);
    if (o.mark !== false) for (const p of out) p.e.used = true;
    return out;
  }
  /** wall plane z at front position u (from the pieces of the last front() call or 0) */
  static zAt(ps, u) { for (const p of ps) if (u >= p.u0 - 0.01 && u <= p.u1 + 0.01) return p.d; return 0; }

  /** every unused edge as a plain wall: spec { bands: [{y0, y1, mat, tu, tv}], rows: [{ y, w, h, head, glass, trim }], pitch, margin, reveal, glass, depth, minLen, hole: 'tex' }.  Marks the edges used. */
  rest(spec) {
    const P = this.P;
    for (const e of this.edges) {
      if (e.used) continue; e.used = true;
      if (e.len < (spec.minE ?? 0.12)) continue;
      const hole = e.hole;
      onEdge(P, e, (len) => {
        const bands = spec.bands, wins = [];
        if (len >= (spec.minLen ?? 2.4) && !(hole && spec.noHoleWins)) {
          const margin = spec.margin ?? 1.1, pitch = spec.pitch ?? 2.3, n = Math.max(1, Math.round((len - 2 * margin) / pitch)), step = (len - 2 * margin) / n;
          for (let i = 0; i < n; i++) for (const r of spec.rows) wins.push({ x: margin + step * (i + 0.5), y: r.y, w: r.w, h: r.h, head: r.head, glass: r.glass, trim: r.trim, depth: r.depth });
        }
        winWall(P, { x0: 0, x1: len, z: 0, bands, wins, reveal: spec.reveal, glass: spec.glass, depth: spec.depth ?? 0.18 });
      });
    }
  }
  /** groups (rings) of edges for band(); draw(e) -> false skips an edge */
  band(y0, y1, d, mats, o = {}) {
    for (const g of this.groups) {
      if (o.outerOnly && g[0].hole) continue;
      band(this.P, g, y0, y1, d, mats, { draw: o.skip ? (e) => !o.skip(e) : undefined, uvs: o.uvs ?? 2 });
    }
  }
  /** a flat roof deck at y over all polygons (courtyards cut out): the standing-seam sheet roof of the module (the `mat` argument is kept for compatibility, `mat === null` keeps it) */
  roof(y, mat, uvs = 1.2) {
    mat = this.M.roofSeam || mat;
    for (const p of this.polys) {
      const ring = (f) => { const r = []; for (let i = 0; i < f.length; i += 2) r.push([f[i], f[i + 1]]); return r; };
      try { this.P.cap(mat, ring(p.o), y, true, uvs, p.h.map(ring)); } catch (err) { console.warn('[landmarksModernVO] roof cap failed for', this.name, err && err.message); }
    }
  }
  /** brick chimneys (0.9 x 0.9 x 1.8 with a pale cap) on the deck y, on a ~12 m grid inside the outline (2.5 m clear of every wall and courtyard), at most n; deterministic */
  chimneys(y, n = 8, step = 11) {
    const P = this.P, M = this.M, out = [];
    let seed = 7 + Math.round(this.F.ox * 7 + this.F.oz * 13) % 97;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const rings = this.polys.map((p) => { const toR = (f) => { const r = []; for (let i = 0; i < f.length; i += 2) r.push([f[i], f[i + 1]]); return r; }; return { o: toR(p.o), h: p.h.map(toR) }; });
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const r of rings) for (const q of r.o) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
    const cand = [];
    for (let x = x0 + step / 2; x < x1; x += step) for (let z = z0 + step / 2; z < z1; z += step) {
      const px = x + (rnd() - 0.5) * 3, pz = z + (rnd() - 0.5) * 3;
      let ok = false;
      for (const r of rings) { if (!inRing(r.o, px, pz)) continue; if (r.h.some((hh) => inRing(hh, px, pz))) continue; ok = distToLine(r.o, px, pz, true) > 2.5 && r.h.every((hh) => distToLine(hh, px, pz, true) > 2.5); if (ok) break; }
      if (ok) cand.push([px, pz]);
    }
    for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
    for (const [px, pz] of cand.slice(0, n)) { P.box(M.chimney, px - 0.45, px + 0.45, y, y + 1.8, pz - 0.45, pz + 0.45, 'b', 1); P.box(M.chimneyCap, px - 0.55, px + 0.55, y + 1.8, y + 1.95, pz - 0.55, pz + 0.55, 'b', 1); out.push([px, pz]); }
    return out;
  }
  /** a solid cylinder collider at frame (u, z) */
  cylinder(u, z, r, y1) { const w = this.F.W(u, z); return this.ctx.physics.addCylinder(w.x, w.z, r, 0, y1); }
  /** a thin solid wall between two frame points (u0, z0) -> (u1, z1) */
  wallBetween(u0, z0, u1, z1, y1, t = 0.5) {
    const A = this.F.W(u0, z0), B = this.F.W(u1, z1), len = Math.hypot(B.x - A.x, B.z - A.z); if (len < 0.05) return null;
    return this.ctx.physics.addBox((A.x + B.x) / 2, (A.z + B.z) / 2, len, t, Math.atan2(-(B.z - A.z), B.x - A.x), 0, y1);
  }
  colliders(y1, thick = 0.9) {
    for (const p of this.world) addPolyColliders(this.ctx, p, 0, y1, thick);
  }
  /** reserve a wall rectangle (centre u, y; w x hh) of the MAIN frame front in the shared labels registry; true = draw it (also when there is no registry) */
  reserve(id, u, y, w, hh, z = 0.05, kind = 'plaque') {
    const lb = this.ctx.services && this.ctx.services.labels; if (!lb) return true;
    const p = this.F.W(u, z); return lb.reserve(id, p.x, y, p.z, w, hh, this.F.N[0], this.F.N[1], kind) !== false;
  }
  /** a photo spot at frame (u, z) looking (du, dz) in frame directions; kept only when it is clear of the asphalt and of every footprint */
  spot(svc, u, z, du, dz, pitch, name) {
    const w = this.F.W(u, z), yaw = this.F.yawOf(du, dz);
    if (this.cover(w.x, w.z) < -0.5 && !L.insideBuilding(w.x, w.z, 0.5)) svc.photoSpots.push({ x: w.x, z: w.z, yaw, pitch, name });
  }
  /** world centre of the house (mean of the first polygon) */
  centre() { const p = this.world[0], n = p.o.length / 2; let x = 0, z = 0; for (let i = 0; i < p.o.length; i += 2) { x += p.o[i]; z += p.o[i + 1]; } return { x: x / n, z: z / n }; }
}
