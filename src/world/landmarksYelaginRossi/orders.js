// landmarksYelaginRossi/orders.js - architecture helpers of the Rossi pavilions as Parts geometry (kit.js):
//   revolve()      a smooth lathe with per-segment normals (hard edges where the profile bends > 35 deg) and metre uvs: columns, bases, capitals, vases, ball finials
//   sweep()        a profile (offset d, height y) swept along a plan polyline (straight run, arc, closed ring) with mitred corners: architraves, friezes, cornices, plinth steps, kerbs
//   tuscan()       the Music Pavilion column: square plinth, torus base, smooth shaft with entasis, astragal, echinus capital with a square abacus (photos rossi 02, 04)
//   doric()        the Greek Doric column of the East pavilion: no base, 20 flutes on the upper part of the shaft only, annulets, echinus, abacus (photos rossi 09, 10, 11)
//   dentils() / triglyphs()  the small repeated parts of a cornice / frieze along a path (near range only)
// All of it is built at the origin or along plan paths in the CURRENT frame of the collector (P.push).
import * as THREE from 'three';

export const TAU = Math.PI * 2;
const _cache = new Map();

/** profile [[r, y]..] bottom to top (outward normal on the right of the walking direction), seg sides, uvs = metres per uv unit; returns a BufferGeometry (not cached) */
export function revolve(profile, seg = 16, uvs = 1, o = {}) {
  const pos = [], nrm = [], uv = [], idx = [];
  const n = profile.length;
  const segN = [];
  for (let s = 0; s + 1 < n; s++) { const dr = profile[s + 1][0] - profile[s][0], dy = profile[s + 1][1] - profile[s][1], l = Math.hypot(dr, dy) || 1e-9; segN.push([dy / l, -dr / l, l]); }
  const rmax = Math.max(...profile.map((p) => p[0]));
  let acc = 0;
  for (let s = 0; s + 1 < n; s++) {
    const a = profile[s], b = profile[s + 1], ns = segN[s];
    const blend = (other) => { if (!other) return [ns[0], ns[1]]; const d = ns[0] * other[0] + ns[1] * other[1]; if (d < 0.82) return [ns[0], ns[1]]; const x = ns[0] + other[0], y = ns[1] + other[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    const n0 = blend(segN[s - 1]), n1 = blend(segN[s + 1]);
    const base = pos.length / 3;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg * TAU, c = Math.cos(t), sn = Math.sin(t), u = i / seg * TAU * (o.uR ?? rmax) / uvs;
      pos.push(a[0] * c, a[1], a[0] * sn); nrm.push(n0[0] * c, n0[1], n0[0] * sn); uv.push(u, o.vY ? a[1] / uvs : acc / uvs);
      pos.push(b[0] * c, b[1], b[0] * sn); nrm.push(n1[0] * c, n1[1], n1[0] * sn); uv.push(u, o.vY ? b[1] / uvs : (acc + ns[2]) / uvs);
    }
    for (let i = 0; i < seg; i++) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    acc += ns[2];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
/** cached revolve */
export function revolved(key, profile, seg, uvs, o) { const k = key + '|' + seg; let g = _cache.get(k); if (!g) { g = revolve(profile, seg, uvs, o); _cache.set(k, g); } return g; }

/** outward (right hand) mitred normals of a plan polyline [[x, z]..]; closed = ring.  Returns [[nx, nz, miter]..] */
export function normalsOf(pts, side = 1, closed = false) {
  const n = pts.length, out = [];
  const segn = (i, j) => { const dx = pts[j][0] - pts[i][0], dz = pts[j][1] - pts[i][1], l = Math.hypot(dx, dz) || 1e-9; return [-dz / l * side, dx / l * side]; };
  for (let i = 0; i < n; i++) {
    const p = closed ? (i + n - 1) % n : i - 1, q = closed ? (i + 1) % n : i + 1;
    const a = p >= 0 ? segn(p, i) : null, b = q < n ? segn(i, q) : null;
    if (a && b) { let x = a[0] + b[0], z = a[1] + b[1]; const l = Math.hypot(x, z) || 1e-9; x /= l; z /= l; const cos = Math.max(0.35, x * a[0] + z * a[1]); out.push([x, z, 1 / cos]); } else { const s = a || b; out.push([s[0], s[1], 1]); }
  }
  return out;
}

/**
 * sweep a profile [[d, y]..] along the plan polyline pts (offset d measured along the outward normal, y = height).  The profile runs from the bottom-inner point up the outer face and back in at the top
 * (the solid lies on its left); every profile segment becomes one quad strip with the matching normal.  Used for architraves, cornices, plinths, kerbs, steps.  uvs = metres per uv unit (u = path length).
 */
export function sweep(P, mat, pts, profile, o = {}) {
  const side = o.side ?? 1, closed = !!o.closed, uvs = o.uvs ?? 1, N = normalsOf(pts, side, closed), n = pts.length;
  const L = [0]; for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  if (closed) L.push(L[n - 1] + Math.hypot(pts[0][0] - pts[n - 1][0], pts[0][1] - pts[n - 1][1]));
  const m = closed ? n : n - 1;
  for (let k = 0; k + 1 < profile.length; k++) {
    const [d0, y0] = profile[k], [d1, y1] = profile[k + 1], dd = d1 - d0, dy = y1 - y0, pl = Math.hypot(dd, dy) || 1e-9, pn = [dy / pl, -dd / pl];
    if (pl < 1e-6) continue;
    for (let i = 0; i < m; i++) {
      const j = (i + 1) % n, a = pts[i], b = pts[j], na = N[i], nb = N[j];
      const A0 = [a[0] + na[0] * d0 * na[2], y0, a[1] + na[1] * d0 * na[2]], A1 = [a[0] + na[0] * d1 * na[2], y1, a[1] + na[1] * d1 * na[2]];
      const B0 = [b[0] + nb[0] * d0 * nb[2], y0, b[1] + nb[1] * d0 * nb[2]], B1 = [b[0] + nb[0] * d1 * nb[2], y1, b[1] + nb[1] * d1 * nb[2]];
      const sx = (na[0] + nb[0]) / 2, sz = (na[1] + nb[1]) / 2, sl = Math.hypot(sx, sz) || 1;
      P.quad(mat, A0, B0, B1, A1, [sx / sl * pn[0], pn[1], sz / sl * pn[0]], [[L[i] / uvs, y0 / uvs], [L[i + 1] / uvs, y0 / uvs], [L[i + 1] / uvs, y1 / uvs], [L[i] / uvs, y1 / uvs]]);
    }
  }
}

/** points of a circular / elliptic arc: centre (cx, cz), radii (rx, rz), angle a0 -> a1 (rad; angle 0 = +x, PI/2 = +z), n segments */
export function arcPts(cx, cz, rx, rz, a0, a1, n) {
  const r = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; r.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]); } return r;
}

// ------------------------------------------------------------------------------------------------------------------------------ Tuscan column (Music Pavilion)
/** total height H (plinth + base + shaft + capital), shaft radius R at the foot.  Built with its axis at (x, z), foot on y0.  uses mat for the shaft and capital, matBase for the plinth + base */
export function tuscan(P, mat, x, z, y0, H = 3.45, R = 0.27, matBase = mat) {
  const k = R / 0.27, hb = 0.27 * k, hc = 0.40 * k, hs = H - hb - hc;
  const prof = [[0.40 * k, 0.07 * k], [0.40 * k, 0.10 * k], [0.37 * k, 0.12 * k], [0.372 * k, 0.16 * k], [0.34 * k, 0.19 * k], [0.30 * k, 0.215 * k], [0.285 * k, 0.225 * k], [0.285 * k, hb]];
  P.box(matBase, x - 0.41 * k, x + 0.41 * k, y0, y0 + 0.07 * k, z - 0.41 * k, z + 0.41 * k, 'b', 1);
  P.geo(matBase, revolved('tbase|' + k, prof, 16, 1), x, y0, z);
  const sh = [[0.285 * k, 0], [0.288 * k, hs * 0.2], [0.282 * k, hs * 0.5], [0.268 * k, hs * 0.8], [0.248 * k, hs]];
  P.geo(mat, revolved('tshaft|' + k + '|' + hs.toFixed(2), sh, 16, 1, { vY: true }), x, y0 + hb, z);
  const cap = [[0.248 * k, 0], [0.262 * k, 0.012 * k], [0.262 * k, 0.045 * k], [0.245 * k, 0.06 * k], [0.245 * k, 0.095 * k], [0.262 * k, 0.12 * k], [0.30 * k, 0.17 * k], [0.335 * k, 0.225 * k], [0.345 * k, 0.26 * k], [0.345 * k, 0.285 * k], [0.0, 0.285 * k]];
  P.geo(matBase, revolved('tcap|' + k, cap, 16, 1), x, y0 + hb + hs, z);
  P.box(matBase, x - 0.40 * k, x + 0.40 * k, y0 + H - 0.115 * k, y0 + H, z - 0.40 * k, z + 0.40 * k, 'b', 1);
}

// ------------------------------------------------------------------------------------------------------------------------------ Greek Doric column (East pavilion)
const doricShaftCache = new Map();
const flAt = (h, r0, r1, y) => { const t = y / h; return r0 + (r1 - r0) * (t * (1.15 - 0.15 * t)); };         // slight entasis (bulge below the middle)
/** the FLUTED upper part of a Doric shaft from y = yf * h to h (the lower part is a smooth 40-gon cone): n flutes as a V-groove sawtooth (flat shaded), radius r0 at the foot and r1 at the top of the whole shaft,
 *  depth = flute depth; uv: u = flute number (the flute texture repeats once per flute), v = y.  Returns a BufferGeometry with y measured from the foot of the shaft */
export function flutedShaft(h, r0, r1, n = 20, yf = 0.45, depth = 0.05) {
  const key = [h, r0, r1, n, yf, depth].join('|'); if (doricShaftCache.has(key)) return doricShaftCache.get(key);
  const pos = [], nrm = [], uv = [], idx = [];
  const y0 = yf * h, ys = [y0, y0 + 0.2, h * 0.86, h];
  const dAt = (y) => (y <= y0 ? 0 : depth * Math.min(1, (y - y0) / 0.2) * (y > h - 0.1 ? Math.max(0.0, (h - y) / 0.1) * 0.6 + 0.4 : 1));
  const m = n * 2;
  const ring = (y) => { const r = flAt(h, r0, r1, y), d = dAt(y), out = []; for (let i = 0; i < m; i++) { const a = i / m * TAU, rr = i % 2 === 0 ? r : r - d; out.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return out; };
  const R = ys.map(ring);
  for (let j = 0; j + 1 < ys.length; j++) {
    const A = R[j], B = R[j + 1];
    for (let i = 0; i < m; i++) {
      const i2 = (i + 1) % m, p0 = A[i], p1 = A[i2], p2 = B[i2], p3 = B[i];
      const ex = p1[0] - p0[0], ez = p1[1] - p0[1], l = Math.hypot(ex, ez) || 1e-9; const nx = ez / l, nz = -ex / l;
      const base = pos.length / 3, u0 = i / 2, u1 = (i + 1) / 2;
      pos.push(p0[0], ys[j], p0[1], p1[0], ys[j], p1[1], p2[0], ys[j + 1], p2[1], p3[0], ys[j + 1], p3[1]);
      for (let q = 0; q < 4; q++) nrm.push(nx, 0.02, nz);
      uv.push(u0, ys[j], u1, ys[j], u1, ys[j + 1], u0, ys[j + 1]);
      idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  doricShaftCache.set(key, g); return g;
}
/** Greek Doric column at (x, z) from y0, total height H (shaft + capital), radius R at the foot.  fluted = true: 20 flutes on the upper 55 % (near), false: a smooth cone (far) */
export function doric(P, mat, x, z, y0, H = 4.5, R = 0.375, fluted = true, matFlute = mat) {
  const k = R / 0.375, hc = 0.44 * k, hs = H - hc;
  if (fluted) {
    P.geo(mat, revolved('dlow|' + hs.toFixed(2) + '|' + R, [[flAt(hs, R, R * 0.8, 0), 0], [flAt(hs, R, R * 0.8, 0.45 * hs), 0.45 * hs]], 40, 1, { vY: true }), x, y0, z);
    P.geo(matFlute, flutedShaft(hs, R, R * 0.8, 20, 0.45, 0.095 * k), x, y0, z);
  }
  else P.geo(mat, revolved('dshaft|' + hs.toFixed(2) + '|' + R, [[R, 0], [R * 0.995, hs * 0.3], [R * 0.9, hs * 0.7], [R * 0.8, hs]], 12, 1, { vY: true }), x, y0, z);
  const r1 = R * 0.8;
  const cap = [[r1, 0], [r1 * 1.03, 0.012 * k], [r1 * 1.03, 0.03 * k], [r1, 0.045 * k], [r1, 0.06 * k], [r1 * 1.03, 0.072 * k], [r1 * 1.03, 0.09 * k], [r1, 0.105 * k], [r1, 0.14 * k],
    [r1 * 1.12, 0.17 * k], [r1 * 1.3, 0.21 * k], [r1 * 1.5, 0.255 * k], [r1 * 1.6, 0.285 * k], [r1 * 1.63, 0.30 * k], [0, 0.30 * k]];
  P.geo(mat, revolved('dcap|' + R, cap, fluted ? 14 : 8, 1), x, y0 + hs, z);
  const ab = r1 * 1.72;
  P.box(mat, x - ab, x + ab, y0 + hs + 0.30 * k, y0 + H, z - ab, z + ab, 'b', 1);
}

// ------------------------------------------------------------------------------------------------------------------------------ small repeated parts
/** boxes (w x h x d) placed along the path pts every `step` m starting at s0, on the outward side at offset d0 (box front at d0 + depth, back at d0), at height y; returns the count */
export function alongPath(P, mat, pts, side, step, o) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1], n = Math.max(1, Math.round((total - (o.s0 ?? 0) * 2) / step));
  let cnt = 0;
  for (let k = 0; k < n; k++) {
    const s = (o.s0 ?? 0) + (k + 0.5) * (total - (o.s0 ?? 0) * 2) / n;
    let i = 1; while (i < L.length - 1 && L[i] < s) i++;
    const t = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1), a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1e-9;
    const x = a[0] + dx * t, z = a[1] + dz * t, nx = -dz / l * side, nz = dx / l * side;
    const rot = Math.atan2(nx, nz);                       // local +z -> the outward normal
    P.push(x + nx * (o.d0 ?? 0), 0, z + nz * (o.d0 ?? 0), rot);
    o.fn(P, k, s);
    P.pop(); cnt++;
  }
  return cnt;
}
