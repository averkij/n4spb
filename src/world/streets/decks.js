// streets/decks.js - where the bridges module draws its decks (PURE DATA + geometry, no three.js, runs in node).
// The bridges module (src/world/bridges/) draws the deck of every road bridge of the west bank to bank (asphalt, pavements, kerbs, lane markings, railings: bridges/arch.js) and publishes the
// footprint in bridges/sites.js (frame = the middle of the deck above the canal centre line, +u along the road, +v across, v0 / v1 = the two fascia faces).  The deck spans the water
// interval of the canal polygon at every v, plus EXT (0.8 m) over the land beyond the banks.  Streets must draw NOTHING there (asphalt, kerbs, pavements, zebras, markings, poles): two
// asphalts at 3 cm distance flicker and the second set of lane lines shows through.  deckAt(x, z, margin) is the one test every streets builder uses;
// a deck is entered 0.4 m inside its edge (SH) so the street asphalt overlaps the deck edge by 0.4 m and no seam opens between them (the deck lies above the street: 0.05 m and up).
import { SITES, EXT, frameOf } from '../bridges/sites.js';
import { WATER } from '../data/city.js';

const SH = 0.4;
let DECKS = null, ENABLED = true;
/** the decks are only reserved when the bridges module is really built (?only=streets keeps the roads across the canals) */
export function setDecksEnabled(on) { ENABLED = !!on; }

function build() {
  DECKS = [];
  for (const s of SITES) {
    if (s.kind !== 'road') continue;
    const f = frameOf(s), toUV = (x, z) => { const dx = x - f.cx, dz = z - f.cz; return [dx * f.c + dz * f.s, -dx * f.s + dz * f.c]; };
    const polys = [], w = WATER.find((q) => q.id === s.water);      // one edge list per water polygon (the pieces of one waterway are united below: bridges/arch.js localSegs)
    if (w) for (const p of w.polys) {
      const segs = [];
      for (const ring of [p.o, ...(p.h || [])]) {
        const n = ring.length / 2;
        for (let i = 0; i < n; i++) { const j = (i + 1) % n, a = toUV(ring[2 * i], ring[2 * i + 1]), b = toUV(ring[2 * j], ring[2 * j + 1]); segs.push([a[0], a[1], b[0], b[1]]); }
      }
      polys.push(segs);
    }
    const waterAt = (v) => {                                              // [uL, uR] of the water interval around u = 0 at cross coordinate v (the same rule as bridges/arch.js waterAt)
      const iv = [];
      for (const segs of polys) {
        const us = [];
        for (const [u0, v0, u1, v1] of segs) if ((v0 - v) * (v1 - v) <= 0 && v0 !== v1) us.push(u0 + (u1 - u0) * (v - v0) / (v1 - v0));
        us.sort((a, b) => a - b);
        for (let i = 0; i + 1 < us.length; i += 2) if (us[i + 1] - us[i] >= 0.5) iv.push([us[i], us[i + 1]]);
      }
      iv.sort((a, b) => a[0] - b[0]);
      const un = [];
      for (const q of iv) { const l = un[un.length - 1]; if (l && q[0] <= l[1] + 0.5) l[1] = Math.max(l[1], q[1]); else un.push([q[0], q[1]]); }
      let best = null, bs = 1e9;
      for (const [a, b] of un) { const m = (a + b) / 2, sc = a <= 0 && b >= 0 ? 0 : Math.abs(m); if (sc < bs) { bs = sc; best = [a, b]; } }
      return best && bs < 14 && best[1] - best[0] < 70 ? best : null;
    };
    const n = Math.max(1, Math.ceil((s.v1 - s.v0) / 1.0)), iv = [];
    let last = null, uMin = 1e9, uMax = -1e9;
    for (let k = 0; k <= n; k++) { const v = s.v0 + (s.v1 - s.v0) * k / n, q = s.bank || waterAt(v) || last || [-8.5, 8.5]; iv.push(q); last = q; uMin = Math.min(uMin, q[0]); uMax = Math.max(uMax, q[1]); }
    // world bounding circle for the quick reject
    const R = Math.hypot((uMax - uMin) / 2 + EXT + 4, Math.max(Math.abs(s.v0), Math.abs(s.v1)) + 4), uc = (uMin + uMax) / 2;
    const cw = { x: f.cx + uc * f.c, z: f.cz + uc * f.s };
    DECKS.push({ s, f, iv, n, v0: s.v0, v1: s.v1, R, cw, toUV });
  }
  // the decks by 64 m cell of their quick-reject square (in DECKS order: the first deck under a point wins as before); deckAt is asked for every kerb sample, lamp, pocket and pole
  GRID = new Map();
  for (const d of DECKS) for (let cx = Math.floor((d.cw.x - d.R) / DG); cx <= Math.floor((d.cw.x + d.R) / DG); cx++) for (let cz = Math.floor((d.cw.z - d.R) / DG); cz <= Math.floor((d.cw.z + d.R) / DG); cz++) { const k = cx * 4096 + cz; let l = GRID.get(k); if (!l) GRID.set(k, (l = [])); l.push(d); }
}
let GRID = null; const DG = 64, NONE = [];

/** the site whose deck lies under (x, z), or null; margin > 0 grows the deck (furniture keeps off it), < 0 shrinks it */
export function deckAt(x, z, margin = 0) {
  if (!ENABLED) return null;
  if (!DECKS) build();
  const list = GRID.get(Math.floor(x / DG) * 4096 + Math.floor(z / DG)) || NONE;
  for (const d of list) {
    if (Math.abs(x - d.cw.x) > d.R || Math.abs(z - d.cw.z) > d.R) continue;
    const [u, v] = d.toUV(x, z), m = margin - SH;
    if (v < d.v0 - margin || v > d.v1 + margin) continue;
    const t = Math.min(d.n, Math.max(0, (v - d.v0) / (d.v1 - d.v0 || 1) * d.n)), i = Math.min(d.n - 1, Math.floor(t)), a = t - i;
    const uL = d.iv[i][0] + ((d.iv[Math.min(d.n, i + 1)][0]) - d.iv[i][0]) * a, uR = d.iv[i][1] + ((d.iv[Math.min(d.n, i + 1)][1]) - d.iv[i][1]) * a;
    if (u >= uL - EXT - m && u <= uR + EXT + m) return d.s;
  }
  return null;
}

/** the decks as { id, ring: [x, z, ...] } rectangles (bank to bank) for debug drawings */
export function deckRings() {
  if (!DECKS) build();
  return DECKS.map((d) => {
    const pts = [], f = d.f;
    const at = (u, v) => [f.cx + u * f.c - v * f.s, f.cz + u * f.s + v * f.c];
    for (let k = 0; k <= d.n; k++) pts.push(at(d.iv[k][0] - EXT, d.v0 + (d.v1 - d.v0) * k / d.n));
    for (let k = d.n; k >= 0; k--) pts.push(at(d.iv[k][1] + EXT, d.v0 + (d.v1 - d.v0) * k / d.n));
    return { id: d.s.id, ring: pts.flat() };
  });
}
