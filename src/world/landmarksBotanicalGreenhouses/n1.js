// landmarksBotanicalGreenhouses/n1.js - the GREAT SUBTROPICAL HOUSE no. 1 (Orangerie of conifers and ferns; N. V. Smirnov + V. P. Samokhvalov 1888-89 for the Tauride Garden, moved here 1926-30):
// a cruciform iron-and-glass house: the central square block with a STEPPED, convex, truncated hip (two stages with railings and finials) and two barrel-vaulted wings (the north one ends in a
// half-round apse) whose arched ribs spring vertically from the stone socle, bend inwards and end under a clerestory band and a flat ridge walkway with a railing.
// Dossier 4.1a house table (OSM r13561146: 43.0 x 25.2 m, 20 vertices), photo 24 (the stepped hip, the vault, the chimney), photos 02 / 99 (the same house from the north).  [E] heights: wall 8.4,
// stepped hip to 16.3, vault 7.0 + clerestory to 8.2.  Flagpoles with compass letters and weather vanes of the real roof are NOT modelled (user rule); plain finials only.
import { pf, inset, loftRing, capRing, railRing, bar, tileQuad, lerp, centroid, EU, EV } from './geo.js';

const UV_UPPER = [[0, 0.5], [1, 0.5], [1, 1], [0, 1]];
const UC = 94.2;                                                    // the axis of the wings (frame u)
const BLOCK = [[81.5, -139.95], [106.7, -139.7], [106.6, -120.4], [81.4, -120.5]];
const PROF = (() => { const a = []; for (let i = 0; i <= 6; i++) { const t = i / 6 * Math.PI / 2; a.push([6.0 + 4.0 * Math.cos(t), 7.0 * Math.sin(t)]); } return a; })();     // half-width, height: quarter ellipse, vertical at the foot
const CLER = 8.2;

export function build(K) {
  const { P, D, M, svc } = K;
  const hull = BLOCK.map(([u, v]) => pf(u, v));
  const R = (d) => inset(hull, d);
  const Y = { wall: 8.4, gut: 8.72 };
  // ---- the central block: plinth, glass walls, copper gutter band, clerestory, stepped convex hip
  loftRing(P, M.stone, R(-0.12), 0, R(-0.12), 0.8, 0, 0, { vertical: true });
  loftRing(P, M.stone, R(-0.12), 0.8, R(0), 0.8, 0, 0);
  loftRing(P, M.glassWall, R(0), 0.8, R(0), Y.wall, 2.0, 4.4, { vertical: true });
  loftRing(P, M.copper, R(-0.3), Y.wall - 0.08, R(-0.3), Y.gut, 0, 0);
  loftRing(P, M.copper, R(-0.3), Y.gut, R(0.8), Y.gut, 0, 0);
  loftRing(P, M.copper, R(0), Y.wall - 0.08, R(-0.3), Y.wall - 0.08, 0, 0, { down: true });
  loftRing(P, M.glassWall, R(0.8), Y.gut, R(0.8), 9.4, 2.0, 2.2, { uv: UV_UPPER, vertical: true });
  const A = [[0.8, 9.4], [1.8, 10.8], [3.0, 11.9], [3.9, 12.4]], B = [[4.5, 14.4], [6.6, 15.9], [7.6, 16.3]];
  for (let i = 0; i + 1 < A.length; i++) loftRing(P, M.glassRoof, R(A[i][0]), A[i][1], R(A[i + 1][0]), A[i + 1][1], 2.0, 2.4);
  loftRing(P, M.iron, R(3.9), 12.4, R(4.5), 12.4, 0, 0);
  loftRing(P, M.glassWall, R(4.5), 12.4, R(4.5), 14.4, 2.0, 2.2, { uv: UV_UPPER, vertical: true });
  for (let i = 0; i + 1 < B.length; i++) loftRing(P, M.glassRoof, R(B[i][0]), B[i][1], R(B[i + 1][0]), B[i + 1][1], 2.0, 2.4);
  capRing(P, M.tinFlat, R(7.6), 16.3);
  railRing(P, M.railingBrown, R(0.25), Y.gut, 1.0);
  railRing(P, M.railingBrown, R(4.0), 12.4, 1.0);
  railRing(P, M.railingBrown, R(7.5), 16.3, 0.8);
  // detail: posts, belts, hip ribs and rafters, finials
  for (let i = 0; i < 4; i++) { const p = R(-0.05)[i]; D.cyl(M.iron, [p[0], 0.8, p[1]], [p[0], Y.wall + 0.1, p[1]], 0.13, 0.13, 4, false); }
  for (const e of [[0, 1], [1, 2], [2, 3], [3, 0]]) { const a = R(-0.05)[e[0]], b = R(-0.05)[e[1]], k = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4.2)); for (let m = 1; m < k; m++) { const p = [lerp(a[0], b[0], m / k), lerp(a[1], b[1], m / k)]; D.cyl(M.iron, [p[0], 0.8, p[1]], [p[0], Y.wall, p[1]], 0.07, 0.07, 4, false); } }
  loftRing(D, M.iron, R(-0.08), 4.6, R(-0.08), 4.74, 0, 0);
  const rings = A.map((t) => R(t[0])), ys = A.map((t) => t[1]), r2 = B.map((t) => R(t[0])), y2 = B.map((t) => t[1]);
  for (let i = 0; i < 4; i++) {
    for (let k = 0; k + 1 < rings.length; k++) bar(D, M.iron, [rings[k][i][0], ys[k] + 0.05, rings[k][i][1]], [rings[k + 1][i][0], ys[k + 1] + 0.05, rings[k + 1][i][1]], 0.08);
    for (let k = 0; k + 1 < r2.length; k++) bar(D, M.iron, [r2[k][i][0], y2[k] + 0.05, r2[k][i][1]], [r2[k + 1][i][0], y2[k + 1] + 0.05, r2[k + 1][i][1]], 0.07);
    const j = (i + 1) % 4, l = Math.hypot(rings[0][j][0] - rings[0][i][0], rings[0][j][1] - rings[0][i][1]), n = Math.max(1, Math.round(l / 1.6));
    for (let m = 1; m < n; m++) { const s = m / n; for (let k = 0; k + 1 < rings.length; k++) { const a = [lerp(rings[k][i][0], rings[k][j][0], s), lerp(rings[k][i][1], rings[k][j][1], s)], b = [lerp(rings[k + 1][i][0], rings[k + 1][j][0], s), lerp(rings[k + 1][i][1], rings[k + 1][j][1], s)]; bar(D, M.iron, [a[0], ys[k] + 0.04, a[1]], [b[0], ys[k + 1] + 0.04, b[1]], 0.04); } }
  }
  for (const e of [[0, 1], [2, 3]]) { const a = R(7.4)[e[0]], b = R(7.4)[e[1]]; for (const p of [a, b]) D.cyl(M.iron, [p[0], 16.3, p[1]], [p[0], 17.1, p[1]], 0.06, 0.025, 6, false); }

  // ---- the barrel-vaulted wings: south (v -120.5 .. -108.9) and north (v -139.9 .. -141.8, then the half-round apse)
  vaultStraight(K, -120.5, -108.9);
  vaultStraight(K, -139.9, -141.8, true);
  apse(K, -141.8);
  { const c = centroid(hull); svc.monuments.push({ id: 'r13561146', name: 'Оранжерея хвойных и папоротников (Большая субтропическая)', x: c[0], z: c[1], h: 16.3 }); }
}

const P2 = (x, v, s) => pf(UC + s * x, v);

/** a straight vault between frame v0 and v1 (v1 < v0 or > v0 allowed) */
function vaultStraight(K, v0, v1, north = false) {
  const { P, D, M } = K;
  const L = Math.abs(v1 - v0);
  for (const s of [-1, 1]) {
    for (let i = 0; i + 1 < PROF.length; i++) {
      const [x0, y0] = PROF[i], [x1, y1] = PROF[i + 1];
      const a = P2(x0, v0, s), b = P2(x0, v1, s), c = P2(x1, v1, s), d = P2(x1, v0, s);
      tileQuad(P, M.glassRoof, [a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y1, c[1]], [d[0], y1, d[1]], 2.0, 2.4, [s * EU[0] * 1, 0.5, s * EU[1] * 1]);
    }
    const a = P2(6.0, v0, s), b = P2(6.0, v1, s);                                                       // the clerestory band
    tileQuad(P, M.glassWall, [a[0], 7.0, a[1]], [b[0], 7.0, b[1]], [b[0], CLER, b[1]], [a[0], CLER, a[1]], 2.0, 1.2, [s * EU[0], 0, s * EU[1]], { uv: UV_UPPER });
    const ra = P2(6.1, v0, s), rb = P2(6.1, v1, s);                                                      // the ridge walkway railing
    tileQuad(P, M.railingBrown, [ra[0], CLER, ra[1]], [rb[0], CLER, rb[1]], [rb[0], CLER + 0.9, rb[1]], [ra[0], CLER + 0.9, ra[1]], 1.8, 0.9, [s * EU[0], 0, s * EU[1]]);
  }
  // the flat ridge walkway: tin
  const pts = [P2(6.0, v0, 1), P2(6.0, v1, 1), P2(6.0, v1, -1), P2(6.0, v0, -1)];
  P.cap(M.tinFlat, pts, CLER, true, 4);
  // ribs every 2 m along the vault
  const n = Math.max(1, Math.round(L / 2.0));
  for (let k = 0; k <= n; k++) {
    const v = lerp(v0, v1, k / n);
    for (const s of [-1, 1]) for (let i = 0; i + 1 < PROF.length; i++) { const a = P2(PROF[i][0], v, s), b = P2(PROF[i + 1][0], v, s); bar(D, M.iron, [a[0], PROF[i][1] + 0.04, a[1]], [b[0], PROF[i + 1][1] + 0.04, b[1]], 0.05); }
  }
}

/** the half-round apse of the north wing: the same profile turned through 180 degrees about (UC, vc) */
function apse(K, vc) {
  const { P, D, M } = K;
  const N = 12, pt = (r, phi) => pf(UC + r * Math.cos(phi), vc - r * Math.sin(phi));
  for (let k = 0; k < N; k++) {
    const f0 = k / N * Math.PI, f1 = (k + 1) / N * Math.PI;
    for (let i = 0; i + 1 < PROF.length; i++) {
      const [r0, y0] = PROF[i], [r1, y1] = PROF[i + 1];
      const a = pt(r0, f0), b = pt(r0, f1), c = pt(r1, f1), d = pt(r1, f0), mid = (f0 + f1) / 2;
      tileQuad(P, M.glassRoof, [a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y1, c[1]], [d[0], y1, d[1]], 2.0, 2.4, [Math.cos(mid) * EU[0] + -Math.sin(mid) * EV[0], 0.5, Math.cos(mid) * EU[1] + -Math.sin(mid) * EV[1]]);
    }
    const a = pt(6.0, f0), b = pt(6.0, f1), mid = (f0 + f1) / 2;
    tileQuad(P, M.glassWall, [a[0], 7.0, a[1]], [b[0], 7.0, b[1]], [b[0], CLER, b[1]], [a[0], CLER, a[1]], 2.0, 1.2, [Math.cos(mid) * EU[0] - Math.sin(mid) * EV[0], 0, Math.cos(mid) * EU[1] - Math.sin(mid) * EV[1]], { uv: UV_UPPER });
    { const ra = pt(6.1, f0), rb = pt(6.1, f1); tileQuad(P, M.railingBrown, [ra[0], CLER, ra[1]], [rb[0], CLER, rb[1]], [rb[0], CLER + 0.9, rb[1]], [ra[0], CLER + 0.9, ra[1]], 1.8, 0.9, [Math.cos(mid) * EU[0] - Math.sin(mid) * EV[0], 0, Math.cos(mid) * EU[1] - Math.sin(mid) * EV[1]]); }
    if (k % 2 === 0) for (let i = 0; i + 1 < PROF.length; i++) { const p = pt(PROF[i][0], f0), q = pt(PROF[i + 1][0], f0); bar(D, M.iron, [p[0], PROF[i][1] + 0.04, p[1]], [q[0], PROF[i + 1][1] + 0.04, q[1]], 0.05); }
  }
  const top = [pt(6.0, 0)]; for (let k = 1; k <= N; k++) top.push(pt(6.0, k / N * Math.PI));
  P.cap(M.tinFlat, top, CLER, true, 4);
}
