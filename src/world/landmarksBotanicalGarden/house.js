// landmarksBotanicalGarden/house.js - a house drawn from its baked footprint ring (world metres): the generic vocabulary of the smaller buildings of the garden (Director's House, staff house lit B, the green
// house, lit V / K / L / M / N / I): a stone base (mitred band), plaster or clapboard walls with window openings on every edge (holed panels without end faces), a cornice band, a hip roof over the
// OFFSET footprint (eaves overhang), chimneys, dormers, solid wall colliders along the ring.
//   ringHouse(K, ring, spec) spec = { baseH, baseMat, wallMat, wallUvs, y1 (cornice), floors: [{ y0, h, w, mat, kind: 'rect' | 'arch' }], pitch, margin, trim, cornice: { h, d },
//                                    roofMat, roofSlope, roofR, over, roofRing (the ring the roof covers, default = ring), edgeFilter(e), extraHoles(e, L) -> holes, bandMats, name }  -> { edges, roofH, offset }
import { ringEdges, polyOf, onEdge, band as kitBand } from './kit.js';
import { hipRoof, hipRect } from './roof.js';
import { Frame } from './frame.js';
import { arch, rect, bayCentres, wallRun } from './shell.js';
import { addPolyColliders } from '../lib/massing.js';

/** offset a ring outward by d (negative = inwards): miter joins */
export function offsetRing(ring, d) {
  const n = ring.length; let a2 = 0; for (let i = 0; i < n; i++) { const p = ring[i], q = ring[(i + 1) % n]; a2 += p[0] * q[1] - q[0] * p[1]; }
  const sg = a2 > 0 ? 1 : -1;                                       // outward normal = (dz, -dx) * sg for CCW (area > 0 in x-z with z "down" is CW seen from above: the sign is checked by the sign of the area)
  const nrm = (p, q) => { const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return [dz / l * sg, -dx / l * sg]; };
  return ring.map((p, i) => {
    const a = ring[(i + n - 1) % n], b = ring[(i + 1) % n], n1 = nrm(a, p), n2 = nrm(p, b), k = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    const sx = (n1[0] + n2[0]) / Math.max(0.35, k), sz = (n1[1] + n2[1]) / Math.max(0.35, k);
    return [p[0] + sx * d, p[1] + sz * d];
  });
}

/** drop the vertices of a ring where it turns by less than `deg` degrees (collinear splits of the OSM ways) */
export function simplifyRing(ring, deg = 4) {
  const n = ring.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = ring[(i + n - 1) % n], p = ring[i], b = ring[(i + 1) % n];
    const ax = p[0] - a[0], az = p[1] - a[1], bx = b[0] - p[0], bz = b[1] - p[1], la = Math.hypot(ax, az), lb = Math.hypot(bx, bz);
    if (la < 0.05 || lb < 0.05) continue;
    const c = (ax * bx + az * bz) / (la * lb);
    if (c < Math.cos(deg * Math.PI / 180)) out.push(p);
  }
  return out.length >= 3 ? out : ring;
}

/** a rectangle (4 corners within 6 degrees of square)? -> { fr: Frame (local x along the long side), x0, x1, z0, z1 } else null */
export function rectOf(ring) {
  const r = simplifyRing(ring, 4);
  if (r.length !== 4) return null;
  const e = r.map((p, i) => { const q = r[(i + 1) % 4]; return [q[0] - p[0], q[1] - p[1]]; });
  for (let i = 0; i < 4; i++) { const a = e[i], b = e[(i + 1) % 4]; if (Math.abs(a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b)) > 0.1) return null; }
  const long = Math.hypot(...e[0]) >= Math.hypot(...e[1]) ? e[0] : e[1], l = Math.hypot(...long), ux = long[0] / l, uz = long[1] / l;
  const cx = (r[0][0] + r[1][0] + r[2][0] + r[3][0]) / 4, cz = (r[0][1] + r[1][1] + r[2][1] + r[3][1]) / 4;
  const fr = new Frame(cx, cz, Math.atan2(-uz, ux));
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const p of r) { const q = fr.l(p[0], p[1]); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
  return { fr, x0, x1, z0, z1 };
}

/** holes of one wall edge of length L from the spec */
export function edgeHoles(L, spec, e) {
  const pitch = spec.pitch ?? 3.2, margin = spec.margin ?? 1.6, h = [];
  const n = L - 2 * margin >= 0.6 * pitch ? Math.max(1, Math.round((L - 2 * margin) / pitch)) : 0;
  if (n > 0) for (const cx of bayCentres(margin, L - margin, n)) for (const f of spec.floors) h.push(f.kind === 'arch' ? arch(cx, f.y0, f.w, f.h, f.mat || 'winI') : rect(cx, f.y0, f.w, f.h, f.mat || 'winI'));
  if (spec.extraHoles) h.push(...spec.extraHoles(e, L));
  return h;
}

/** small semi-basement windows on the stone base, on the same bays as the upper windows (spec.baseWin = { y0, h, w }; facade frame, the base band front is 0.06 proud): a white frame slab and a dark pane in front of it */
function baseWindows(P, M, L, spec) {
  const pitch = spec.pitch ?? 3.2, margin = spec.margin ?? 1.6, bw = spec.baseWin;
  const n = L - 2 * margin >= 0.6 * pitch ? Math.max(1, Math.round((L - 2 * margin) / pitch)) : 0;
  if (n < 1) return;
  for (const cx of bayCentres(margin, L - margin, n)) {
    P.box(M.white, cx - bw.w / 2 - 0.08, cx + bw.w / 2 + 0.08, bw.y0 - 0.08, bw.y0 + bw.h + 0.08, 0.04, 0.10, 'kb', 1);
    P.quad(M.winI, [cx - bw.w / 2, bw.y0, 0.115], [cx + bw.w / 2, bw.y0, 0.115], [cx + bw.w / 2, bw.y0 + bw.h, 0.115], [cx - bw.w / 2, bw.y0 + bw.h, 0.115], [0, 0, 1], [[0, 0.3], [1, 0.3], [1, 1], [0, 1]]);
  }
}

export function ringHouse(K, ring0, spec) {
  let ring = ring0;
  const P = K.P, M = K.M, ctx = K.ctx;
  const full = ring; ring = simplifyRing(ring, 4);
  const edges = ringEdges(polyOf(ring)), baseH = spec.baseH ?? 0.8, y1 = spec.y1, wallMat = spec.wallMat;
  const filt = spec.edgeFilter || (() => true);
  for (const e of edges) {
    if (e.len < 0.9 || !filt(e)) continue;
    onEdge(P, e, (L) => {
      const holes = edgeHoles(L, spec, e);
      wallRun(K, wallMat, 0, L, spec.y0 ?? baseH - 0.1, y1, holes, { depth: spec.depth ?? 0.3, uvs: spec.wallUvs ?? 3, surround: spec.surround ?? 'light' });
      if (spec.baseWin) baseWindows(P, M, L, spec);
    });
  }
  const bm = spec.bandMats || {};
  if (baseH > 0.05 && spec.y0 == null) kitBand(P, edges, 0, baseH, spec.baseD ?? 0.06, { front: spec.baseMat || M.plinth, top: spec.baseMat || M.plinth }, { uvs: 3, draw: filt });
  if (spec.cornice !== false) {
    const c = spec.cornice || {};
    kitBand(P, edges, y1, y1 + (c.h ?? 0.3), c.d ?? 0.35, { front: bm.front || M.white, top: bm.top || M.white, under: M.plinth }, { uvs: 3, draw: filt });
  }
  let roofH = null;
  const roofRing = simplifyRing(spec.roofRing || ring, 4), off = offsetRing(roofRing, spec.over ?? 0.45), yE = y1 + (spec.cornice === false ? 0 : (spec.cornice || {}).h ?? 0.3) - 0.12, rc = rectOf(roofRing);
  if (spec.roofMat && rc) {
    const hd = (rc.z1 - rc.z0) / 2, rise = (spec.roofSlope ?? 0.5) * hd;
    P.push(rc.fr.cx, 0, rc.fr.cz, rc.fr.rot);
    const hl = hipRect(P, spec.roofMat, rc.x0, rc.x1, rc.z0, rc.z1, yE, rise, { over: spec.over ?? 0.45, tile: spec.roofUvs ?? 1.2, hip0: spec.hip0, hip1: spec.hip1, gable: spec.gable });
    P.pop();
    roofH = (x, z) => { const q = rc.fr.l(x, z); return hl(q[0], q[1]); };
  } else if (spec.roofMat) roofH = hipRoof(P, spec.roofMat, off, [], yE, { slope: spec.roofSlope ?? 0.5, R: spec.roofR ?? 99, cell: spec.roofCell ?? 1.5, uvs: spec.roofUvs ?? 1.2 });
  if (spec.collide !== false) addPolyColliders(ctx, { o: full.flat(), h: [] }, 0, y1 + 6);
  return { edges, roofH, offset: off };
}

/** a brick chimney stack with a cap on a roof at (x, z) (needs the roof height function) */
export function chimneyAt(P, M, h, x, z, up = 1.9, mat = M.roofRed) {
  const y = h(x, z) - 0.3;
  P.box(mat, x - 0.4, x + 0.4, y, y + up, z - 0.4, z + 0.4, 'b', 1.2);
  P.box(M.plinth, x - 0.52, x + 0.52, y + up, y + up + 0.16, z - 0.52, z + 0.52, '', 1.2);
}

/** a small roof dormer on a roof plane: front window face toward (dx, dz) (unit, world), centre (x, z) on the roof, gable roof, local width w */
export function dormerAt(K, h, x, z, dx, dz, o = {}) {
  const P = K.P, M = K.M, w = o.w ?? 1.2, hgt = o.h ?? 1.25, y = h(x, z) - 0.15, rot = Math.atan2(dx, dz);
  P.push(x, y, z, rot);
  P.box(o.wallMat || M.white, -w / 2, w / 2, 0, hgt, -0.8, 0.0, 'b', 3);                       // the front cheek (frame)
  P.quad(M[o.win || 'winI'], [-w / 2 + 0.12, 0.15, 0.02], [w / 2 - 0.12, 0.15, 0.02], [w / 2 - 0.12, hgt - 0.12, 0.02], [-w / 2 + 0.12, hgt - 0.12, 0.02], [0, 0, 1], [[0, 0.3], [1, 0.3], [1, 1], [0, 1]]);
  const rm = o.roofMat || M.zinc, ov = 0.18, rise = 0.55;
  for (const s of [-1, 1]) P.quad(rm, [s * (w / 2 + ov), hgt - 0.05, 0.15], [s * (w / 2 + ov), hgt - 0.05, -0.9], [0, hgt + rise, -0.9], [0, hgt + rise, 0.15], [s * rise, w / 2 + ov, 0], [[0, 0], [1, 0], [1, 0.6], [0, 0.6]]);
  P.fan(o.wallMat || M.white, [[-w / 2 - 0.0, hgt - 0.02, 0.0], [w / 2, hgt - 0.02, 0.0], [0, hgt + rise - 0.02, 0.0]], [0, 0, 1], (p) => [p[0], p[1]]);
  P.pop();
}
