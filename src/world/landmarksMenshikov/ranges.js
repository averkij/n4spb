// landmarksMenshikov/ranges.js - the First Cadet Corps ring (OSM w28691170, 56 vertices) cut into RANGES (axis-parallel rectangles of frame KF, a along the Kadetskaya line, b depth from it, the facade at b 0).
// The ring is the outline of five ranges and two galleries and every edge of it is parallel to a KF axis within 1-2 degrees, so a rectangle decomposition is exact enough for ROOFS (walls follow the real edges).
//   HAND ranges (dossier 3.2 / 3.3): R1 (the 340 m Kadetskaya range, eave 10.4), PORT (the 1938 portico block at its south end, 11.0), R2S / R2E (the south block R2, 11.2).
//   AUTO ranges: the rest of the ring (spine, R4, the galleries, the arm) is cut on a grid of the clustered vertex coordinates; cells inside the ring and outside the hand ranges are merged greedily into
//   rectangles; each gets the plain courtyard eave (9.2) or, inside the two gallery boxes (frame PF), the gallery eave (8.8).
import { KF, PF, HC, HP } from './frame.js';

export const HAND = [
  { id: 'R1', kind: 'r1', a0: -340.6, a1: -7.4, b0: -17.5, b1: 0.15, eave: HC.eave, rise: 2.0, hips: [true, false] },
  { id: 'PORT', kind: 'port', a0: -7.4, a1: 9.5, b0: -23.6, b1: 0.15, eave: 11.0, rise: 2.4, hips: [false, true] },
  { id: 'R2S', kind: 'r2', a0: 9.5, a1: 60.9, b0: -13.0, b1: 0.15, eave: HC.r2, rise: 2.4, hips: [false, false] },
  { id: 'R2E', kind: 'r2', a0: 60.9, a1: 86.4, b0: -27.5, b1: 0.15, eave: HC.r2, rise: 2.6, hips: [false, true] },
];
/** the two galleries west / east of the palace in frame PF: [a0, a1, b0, b1] (the OSM ring edges: W V0..V1 / V52..V55, E V41..V44) */
export const GALLERIES = { W: [-68.5, -32.2, -27.0, -13.8], E: [32.2, 71.5, -28.8, -11.8] };
const inBox = (b, x, z) => { const p = PF.M(x, z); return p.a >= b[0] && p.a <= b[1] && p.b >= b[2] && p.b <= b[3]; };
export const inGallery = (x, z) => inBox(GALLERIES.W, x, z) || inBox(GALLERIES.E, x, z);

function cluster(vals, tol) {
  const s = [...vals].sort((x, y) => x - y), out = []; let cur = [s[0]];
  for (let i = 1; i < s.length; i++) { if (s[i] - cur[cur.length - 1] <= tol) cur.push(s[i]); else { out.push(cur.reduce((p, q) => p + q, 0) / cur.length); cur = [s[i]]; } }
  out.push(cur.reduce((p, q) => p + q, 0) / cur.length); return out;
}
const pinRing = (ring, a, b) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) if ((ring[i][1] > b) !== (ring[j][1] > b) && a < (ring[j][0] - ring[i][0]) * (b - ring[i][1]) / (ring[j][1] - ring[i][1]) + ring[i][0]) c = !c; return c; };
const inHand = (a, b) => HAND.find((r) => a >= r.a0 && a <= r.a1 && b >= r.b0 && b <= r.b1) || null;

/** ring in frame KF -> [[a, b]] */
export function ringK(flat) { const r = []; for (let i = 0; i < flat.length; i += 2) { const k = KF.M(flat[i], flat[i + 1]); r.push([k.a, k.b]); } return r; }

/** all ranges: the hand ranges (clipped to nothing) + the auto rectangles of the rest.  Each: { id, kind, a0, a1, b0, b1, eave, rise, hips: [at the low-a end, at the high-a end] or for a z-long range [low-b, high-b] } */
export function makeRanges(flat) {
  const ring = ringK(flat);
  const A = cluster(ring.map((p) => p[0]).concat([-7.4, 9.5, 60.9, 86.4, -340.6]), 1.6), B = cluster(ring.map((p) => p[1]).concat([-17.5, -13.0, -23.6, -27.5, 0.15]), 1.6);
  const cells = []; for (let j = 0; j + 1 < B.length; j++) { cells.push([]); for (let i = 0; i + 1 < A.length; i++) { const ca = (A[i] + A[i + 1]) / 2, cb = (B[j] + B[j + 1]) / 2; cells[j].push(pinRing(ring, ca, cb) && !inHand(ca, cb)); } }
  const used = cells.map((r) => r.map(() => false)), auto = [];
  for (let j = 0; j < cells.length; j++) for (let i = 0; i < cells[j].length; i++) {
    if (!cells[j][i] || used[j][i]) continue;
    let i1 = i; while (i1 + 1 < cells[j].length && cells[j][i1 + 1] && !used[j][i1 + 1]) i1++;
    let j1 = j; outer: while (j1 + 1 < cells.length) { for (let k = i; k <= i1; k++) if (!cells[j1 + 1][k] || used[j1 + 1][k]) break outer; j1++; }
    for (let y = j; y <= j1; y++) for (let x = i; x <= i1; x++) used[y][x] = true;
    auto.push({ a0: A[i], a1: A[i1 + 1], b0: B[j], b1: B[j1 + 1] });
  }
  const out = HAND.map((r) => ({ ...r }));
  auto.forEach((r, i) => {
    if (r.a1 - r.a0 < 1.5 || r.b1 - r.b0 < 1.5) return;
    const c = KF.W((r.a0 + r.a1) / 2, (r.b0 + r.b1) / 2), gal = inGallery(c.x, c.z);
    out.push({ id: 'A' + i, kind: gal ? 'gallery' : 'rest', ...r, eave: gal ? HP.gallery : 9.2, rise: gal ? 1.4 : 1.6, hips: [true, true] });
  });
  return out;
}
/** the range containing a K point (hand ranges first), or null */
export function rangeAt(ranges, a, b) { return ranges.find((r) => a >= r.a0 - 0.01 && a <= r.a1 + 0.01 && b >= r.b0 - 0.01 && b <= r.b1 + 0.01) || null; }
