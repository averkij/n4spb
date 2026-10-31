// landmarksAurora/hull.js - the hull form of the cruiser Aurora (docs/research/aurora.md 2.2, 10; photos 01 03 04 08 29, drawing 11).  Ship frame: x = station s (m forward of amidships,
// bow +63.4), y = height above the WATER LINE, z = +starboard.  LOA 126.8 m, beam 16.8 m.
//   half(s, y)  half-breadth: a deck-level plan form BD (y = 7) and a water-line plan form BW (y = 0) blended by height (flare at the bow, a little tumblehome amidships, a counter stern);
//   topY(s)     the upper edge of the side plating: forecastle 8.6 .. 9.2 (s >= 37), bulwark 7.0 in the waist with the gun NOTCHES cut down to the deck, quarterdeck 5.9 .. 6.2 (s < -22);
//   deckY(s)    the deck the feet stand on (forecastle / upper deck 5.9).
// buildHull() returns smooth BufferGeometries: boot-topping (green, -0.9 .. 1.5), the white line (1.5 .. 1.62) and the grey plating above, both sides, uv in metres (u = s / 6, v = y / 2.4).
import * as THREE from 'three';

function spline(tab) {                                                    // monotone cubic through [[x, y]..]; 0 outside the table
  const n = tab.length, xs = tab.map((p) => p[0]), ys = tab.map((p) => p[1]), d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], q = a * a + b * b; if (q > 9) { const t = 3 / Math.sqrt(q); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
  return (x) => {
    if (x < xs[0] || x > xs[n - 1]) return 0;
    let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
const BD = spline([[-63.4, 0.5], [-62.2, 2.6], [-59.5, 4.3], [-55, 5.5], [-47, 6.8], [-37, 7.6], [-24, 8.05], [0, 8.2], [18, 8.1], [30, 7.5], [40, 6.3], [48, 4.9], [54, 3.6], [59, 2.2], [62, 0.95], [63.3, 0.1]]);
const BW = spline([[-60.5, 0.05], [-58.5, 1.5], [-54, 3.2], [-48, 5.0], [-40, 6.6], [-30, 7.7], [-18, 8.3], [0, 8.4], [16, 8.3], [28, 7.5], [38, 6.0], [46, 4.4], [53, 2.8], [59, 1.3], [62.5, 0.42], [63.6, 0.06]]);

export const STERN = -63.4, BOW = 63.6, UD = 5.9, FC = 8.6, BULWARK = 7.0, BREAK = 37, AFT_END = -22;
export const NOTCH = [[32, 37], [23.2, 27.8], [13.2, 17.8], [-15.8, -11.2]];          // gun embrasures in the waist bulwark
export function half(s, y) {
  if (y >= 0) return Math.max(0.03, BW(s) + (BD(s) - BW(s)) * (y / 7));
  const f = y > -1.5 ? 1 - 0.03 * (-y / 1.5) : y > -3.2 ? 0.97 - 0.15 * ((-y - 1.5) / 1.7) : 0.82 - 0.47 * Math.min(1, (-y - 3.2) / 1.6);
  return Math.max(0.03, BW(s) * f);
}
export function topY(s) {
  if (s >= BREAK) return FC + 0.6 * ((s - BREAK) / 26.4) ** 2;
  if (s < AFT_END) return UD + 0.3 * ((AFT_END - s) / 41.4) ** 2;
  for (const [a, b] of NOTCH) if (s > a && s < b) return UD;
  return BULWARK;
}
export const deckY = (s) => (s >= BREAK || s < AFT_END ? topY(s) : UD);
/** point on the plating + outward unit normal (in the ship frame), side = +1 starboard / -1 port, off = metres off the plating */
export function hullPt(s, y, side, off = 0) {
  const b = half(s, y), db = (half(s + 0.4, y) - half(s - 0.4, y)) / 0.8, dy = (half(s, y + 0.3) - half(s, y - 0.3)) / 0.6;
  const l = Math.hypot(db, dy, 1), n = [-db / l, -dy / l, side / l];
  return { p: [s + n[0] * off, y + n[1] * off, side * b + n[2] * off], n, b, yaw: Math.atan2(n[0], n[2]) };
}

export function stations() {
  const out = [];
  for (let s = STERN; s < BOW - 0.5; s += 2) out.push(s);
  out.push(BOW - 0.6, BOW - 0.2, BOW);
  for (const b of [BREAK, AFT_END, ...NOTCH.flat()]) out.push(b - 0.01, b + 0.01);
  return [...new Set(out.map((v) => Math.round(v * 1000) / 1000))].sort((a, b) => a - b);
}
const ROWS = [-0.9, 0, 1.5, 1.62, 3.3, 5.0, 5.9, 7.0, 8.6, 99];      // only 0.9 m of the under-water body is drawn (the water is opaque; a deeper body shows as an outline)

function grid(cols, r0, r1, side) {
  const nc = cols.length, nr = r1 - r0 + 1, pos = new Float32Array(nc * nr * 3), uv = new Float32Array(nc * nr * 2), idx = [];
  for (let i = 0; i < nc; i++) {
    const s = cols[i], top = topY(s);
    for (let j = 0; j < nr; j++) {
      const y = Math.min(ROWS[r0 + j], top), k = i * nr + j;
      pos[k * 3] = s; pos[k * 3 + 1] = y; pos[k * 3 + 2] = side * half(s, y);
      uv[k * 2] = s / 6; uv[k * 2 + 1] = y / 2.4;
    }
  }
  const P3 = (k) => [pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]];
  const area = (a, b, c) => { const A = P3(a), B = P3(b), C = P3(c); const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2]; return Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx); };
  for (let i = 0; i + 1 < nc; i++) for (let j = 0; j + 1 < nr; j++) {
    const a = i * nr + j, b = (i + 1) * nr + j, c = (i + 1) * nr + j + 1, d = i * nr + j + 1;
    for (const [p, q, r] of [[a, b, c], [a, c, d]]) { if (area(p, q, r) < 1e-5) continue; if (side > 0) idx.push(p, q, r); else idx.push(p, r, q); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
/** { boot: [geo, geo], line: [..], plate: [..] } (starboard, port) */
export function buildHull() {
  const cols = stations(), out = { boot: [], line: [], plate: [], cols };
  for (const side of [1, -1]) { out.boot.push(grid(cols, 0, 2, side)); out.line.push(grid(cols, 2, 3, side)); out.plate.push(grid(cols, 3, ROWS.length - 1, side)); }
  return out;
}
