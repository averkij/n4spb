// landmarksPetrovskyStadium/apronprops.js - what stands on the paved plateau round the bowl (photos s02 s04 s16 s01): the apron lamp posts (instanced), the long low annex with the white roof at the
// south-west end, the row of nine grey pyramid turnstile canopies at the bridge (north-east) end, the ticket office "Кассы стадиона" w119931739, the yellow boiler house w44425138 with its brick chimney
// n7629436124 (~45 m), the scoreboard box (five round windows) and the covered press / VIP stand on the north-west side of the rim.  No flags, no sponsor boards.
import * as L from '../layout.js';
import { bowl, pitchFrame, TIP, MASTS, CHIMNEY, GAL, Y, ringOf, signedArea, offsetRing } from './frame.js';
import { inRing } from './field.js';

const ringArea = signedArea;
/** a framed window on a wall: white frame quad (3 cm off the wall) with the dark pane 2 cm further out; (px, pz) the centre on the wall, (ux, uz) the unit along the wall, (nx, nz) the outward normal */
export function pane(P, M, px, pz, ux, uz, nx, nz, w, y0, y1, fr = 0.1) {
  const q = (d, ww, yy0, yy1, mat) => P.quad(mat, [px - ux * ww / 2 + nx * d, yy0, pz - uz * ww / 2 + nz * d], [px + ux * ww / 2 + nx * d, yy0, pz + uz * ww / 2 + nz * d], [px + ux * ww / 2 + nx * d, yy1, pz + uz * ww / 2 + nz * d], [px - ux * ww / 2 + nx * d, yy1, pz - uz * ww / 2 + nz * d], [nx, 0, nz]);
  q(0.03, w + fr * 2, y0 - fr, y1 + fr, M.cream); q(0.05, w, y0, y1, M.dark);
  q(0.065, 0.06, y0, y1, M.cream);                                                                                      // the mullion
}
/** walls of a prism over a ring (any winding) from y0 to y1, outward normals; uv in metres / tile */
export function prism(P, mat, ring, y0, y1, tile = 4) {
  const sg = ringArea(ring) > 0 ? 1 : -1, n = ring.length; let acc = 0;
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.05) continue;
    P.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [dz / l * sg, 0, -dx / l * sg], [[acc / tile, y0 / tile], [(acc + l) / tile, y0 / tile], [(acc + l) / tile, y1 / tile], [acc / tile, y1 / tile]]);
    acc += l;
  }
}
/** the oriented bounding box of a ring: { cx, cz, ux, uz, vx, vz, hu, hv } along its longest edge */
export function obb(ring) {
  let best = 0, ux = 1, uz = 0;
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best) { best = l; ux = (b[0] - a[0]) / l; uz = (b[1] - a[1]) / l; } }
  const vx = -uz, vz = ux; let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (const p of ring) { const u = p[0] * ux + p[1] * uz, v = p[0] * vx + p[1] * vz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  return { cx: ux * cu + vx * cv, cz: uz * cu + vz * cv, ux, uz, vx, vz, hu: (u1 - u0) / 2, hv: (v1 - v0) / 2 };
}
/** the largest scaled copy of the oriented box that lies inside the ring (its four corners and the edge midpoints), s in 0.5 .. 1 */
export function fitBox(ring, B) {
  const inside = (s) => [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]].every(([a, b]) => inRing(ring, B.cx + B.ux * a * B.hu * s + B.vx * b * B.hv * s, B.cz + B.uz * a * B.hu * s + B.vz * b * B.hv * s));
  let lo = 0.4, hi = 1; if (inside(1)) return B;
  for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (inside(m)) lo = m; else hi = m; }
  return { ...B, hu: B.hu * lo, hv: B.hv * lo };
}
/** gable roof over an oriented box: ridge along u, eaves at y1, ridge at y1 + rise, overhang o */
export function gable(P, mat, mat2, B, y1, rise, o = 0.35) {
  const hu = B.hu + o, hv = B.hv + o, W = (u, v, y) => [B.cx + B.ux * u + B.vx * v, y, B.cz + B.uz * u + B.vz * v];
  const ny = hv / Math.hypot(hv, rise), nh = rise / Math.hypot(hv, rise);
  for (const s of [-1, 1]) {
    P.quad(mat, W(-hu, s * hv, y1), W(hu, s * hv, y1), W(hu, 0, y1 + rise), W(-hu, 0, y1 + rise), [B.vx * s * nh, ny, B.vz * s * nh], [[0, 0], [hu * 2 / 3, 0], [hu * 2 / 3, Math.hypot(hv, rise) / 3], [0, Math.hypot(hv, rise) / 3]]);
    // the underside of the slope (review fix: seen from the ground the near slope is behind the eaves plane, so with single-sided faces the roof vanished and showed the sky through it)
    P.quad(mat2, W(-hu, s * hv, y1), W(hu, s * hv, y1), W(hu, 0, y1 + rise), W(-hu, 0, y1 + rise), [-B.vx * s * nh, -ny, -B.vz * s * nh], [[0, 0], [hu * 2 / 3, 0], [hu * 2 / 3, Math.hypot(hv, rise) / 3], [0, Math.hypot(hv, rise) / 3]]);
    if (s === 1) for (const e of [-1, 1]) P.fan(mat2, [W(e * (hu - o), -hv + o, y1), W(e * (hu - o), hv - o, y1), W(e * (hu - o), 0, y1 + rise * 0.82)], [B.ux * e, 0, B.uz * e], (p) => [p[0] / 4, p[1] / 4]);     // the gable ends
  }
}
const roadAt = (ctx) => { const net = ctx.services && ctx.services.streets && ctx.services.streets.net; return net && net.cover ? (x, z) => net.cover(x, z, {}) > -1.2 : (x, z) => L.isOnRoad(x, z, 1.2); };

/** apron lamp posts: positions along the plateau edge, instanced geometry */
export function lampSpots(ctx, apronRing) {
  const B = bowl(), onRoad = roadAt(ctx), path = offsetRing(TIP, -1.6), spots = [];
  const clear = (x, z) => B.st.every((q) => Math.hypot(q.x - x, q.z - z) > 6.5) && MASTS.every(([mx, mz]) => Math.hypot(mx - x, mz - z) > 9) && inRing(apronRing, x, z) && !onRoad(x, z);
  let carry = 0;
  for (let i = 0; i < path.length; i++) {
    const a = path[i], b = path[(i + 1) % path.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = carry === 0 ? 0 : carry; s < l; s += 24) {
      const t = s / l, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
      if (x > -3760 && clear(x, z)) { let bd = 1e9, bq = null; for (const q of B.st) { const d = Math.hypot(q.x - x, q.z - z); if (d < bd) { bd = d; bq = q; } } spots.push([x, z, Math.atan2(bq.x - x, bq.z - z)]); }
      carry = s + 24 - l;
    }
    carry = Math.max(0, carry);
  }
  return spots;
}
export function lampParts(P, M) {
  P.cyl(M.steelGrey, [0, 0, 0], [0, 0.5, 0], 0.17, 0.17, 8, true);
  P.cyl(M.steelGrey, [0, 0.5, 0], [0, 6.0, 0], 0.085, 0.06, 8, false);
  P.cyl(M.steelGrey, [0, 6.0, 0], [0, 6.35, 0.55], 0.05, 0.05, 6, false);
  P.cyl(M.steelGrey, [0, 6.35, 0.55], [0, 6.35, 1.2], 0.05, 0.05, 6, false);
  P.box(M.white, -0.2, 0.2, 6.2, 6.38, 0.95, 1.55);
}

/** nine grey pyramid turnstile canopies in front of the entrances at the north-east end (s04) */
export function canopies(P, M, clip = null) {
  const B = bowl(), pf = pitchFrame(), N = B.N; let k0 = 0, bv = -1e9;
  for (let k = 0; k < N; k++) { const q = B.st[k], v = -q.nx * pf.ux - q.nz * pf.uz; if (v > bv) { bv = v; k0 = k; } }                    // the station whose outward normal points along +u of the pitch (the NE end)
  const out = [];
  for (let i = -4; i <= 4; i++) {
    const k = (k0 + i + N) % N, q = B.st[k], rot = Math.atan2(-q.nx, -q.nz);
    // 7 m in front of the column line; when the 4 x 4 m footprint touches asphalt (the service ring road) the canopy slides outwards in 1 m steps, else it is skipped
    let sOut = -1; for (const d of [7, 6, 8, 9, 5, 10, 11, 12]) { const x0 = q.x - q.nx * d, z0 = q.z - q.nz * d, c = Math.cos(rot), sn = Math.sin(rot); if (!clip || [[0, 0], [2.4, 2.4], [-2.4, 2.4], [2.4, -2.4], [-2.4, -2.4], [0, 2.4], [0, -2.4], [2.4, 0], [-2.4, 0]].every(([a, b]) => !clip.on(x0 + c * a + sn * b, z0 - sn * a + c * b))) { sOut = d; break; } }
    if (sOut < 0) continue;
    const x = q.x - q.nx * sOut, z = q.z - q.nz * sOut;
    P.push(x, 0, z, rot);
    const e = 2.0, ye = 2.9, ya = 4.5;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.box(M.steelGrey, sx * e * 0.92 - 0.05, sx * e * 0.92 + 0.05, 0, ye, sz * e * 0.92 - 0.05, sz * e * 0.92 + 0.05, 'b');
    const C = [[-e, ye, -e], [e, ye, -e], [e, ye, e], [-e, ye, e]], apex = [0, ya, 0];
    for (let c = 0; c < 4; c++) { const a = C[c], b = C[(c + 1) % 4], mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2; P.fan(M.sheet, [a, b, apex], [mx, 0.9, mz], (p) => [p[0], p[2]]); P.fan(M.sheet, [a, apex, b], [-mx, -0.5, -mz], (p) => [p[0], p[2]]); }
    P.pop(); out.push([x, z]);
  }
  return out;
}

/** the low annex with the white roof at the south-west end of the plateau (s02 left, s01 top right) */
export function annex(P, M, clip = null) {
  const B = bowl(), A = TIP[10], Bq = TIP[11], dx = Bq[0] - A[0], dz = Bq[1] - A[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;           // the edge from (-3757.9,-2088.3) to (-3668.5,-2027.4)
  let nx = -uz, nz = ux; if (nx * (B.c[0] - A[0]) + nz * (B.c[1] - A[1]) < 0) { nx = -nx; nz = -nz; }
  let off = 8.6; const hu = 19.5, hv = 3.9, h = 3.4;
  const free = (o) => { const cx = A[0] + dx * 0.55 + nx * o, cz = A[1] + dz * 0.55 + nz * o; for (let u = -hu - 1; u <= hu + 1; u += 4) for (const v of [-hv - 1, 0, hv + 1]) if (clip && clip.on(cx + ux * u + nx * v, cz + uz * u + nz * v)) return false; return true; };
  for (const o of [8.6, 10, 12, 7, 14, 16]) if (free(o)) { off = o; break; }
  const cx = A[0] + dx * 0.55 + nx * off, cz = A[1] + dz * 0.55 + nz * off, W = (u, v, y) => [cx + ux * u + nx * v, y, cz + uz * u + nz * v];
  const ring = [W(-hu, -hv, 0), W(hu, -hv, 0), W(hu, hv, 0), W(-hu, hv, 0)].map((p) => [p[0], p[2]]);
  prism(P, M.cream, ring, 0, h, 4);
  P.cap(M.white, ring.map((p) => [p[0], p[1]]), h + 0.02, true, 4);
  // the white roof slab overhangs the walls 0.5 m
  const o = 0.5, rr = [W(-hu - o, -hv - o, 0), W(hu + o, -hv - o, 0), W(hu + o, hv + o, 0), W(-hu - o, hv + o, 0)].map((p) => [p[0], p[2]]);
  prism(P, M.white, rr, h + 0.02, h + 0.4, 4); P.cap(M.white, rr, h + 0.4, true, 4); P.cap(M.creamShade, rr, h + 0.02, false, 4);
  // a window band toward the bowl and a door
  for (let i = 0; i < 9; i++) { const u = -hu + 3 + i * 4.2, c = W(u, hv, 0); pane(P, M, c[0], c[2], ux, uz, nx, nz, 2.2, 1.1, 2.5); }
  { const c = W(0, hv, 0); P.quad(M.dark, [c[0] - ux + nx * 0.05, 0.05, c[2] - uz + nz * 0.05], [c[0] + ux + nx * 0.05, 0.05, c[2] + uz + nz * 0.05], [c[0] + ux + nx * 0.05, 2.3, c[2] + uz + nz * 0.05], [c[0] - ux + nx * 0.05, 2.3, c[2] - uz + nz * 0.05], [nx, 0, nz]); }
  return { cx, cz, ux, uz, hu, hv };
}

/** the ticket office (kassy) w119931739: one storey, pale plaster, a flat roof with a cream cornice band, ticket hatches on the long faces toward the bowl */
export function ticketOffice(P, M) {
  const b = L.buildingById('w119931739'); if (!b) return null;
  const ring = ringOf(b.polys[0].o), B = bowl(), h = 3.8, sg = ringArea(ring) > 0 ? 1 : -1;
  prism(P, M.plaster, ring, 0, h, 4); P.cap(M.roof, ring, h, true, 4);
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], c = ring[(i + 1) % ring.length], dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz); if (l < 6) continue;
    const nx = dz / l * sg, nz = -dx / l * sg, ux = dx / l, uz = dz / l, mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2;
    if (nx * (B.c[0] - mx) + nz * (B.c[1] - mz) < 0) continue;                                                              // only the faces that look at the bowl get hatches
    const n = Math.floor((l - 1.4) / 2.7);
    for (let j = 0; j < n; j++) { const t = (j - (n - 1) / 2) * 2.7, px = mx + ux * t + nx * 0.04, pz = mz + uz * t + nz * 0.04; pane(P, M, px - nx * 0.04, pz - nz * 0.04, ux, uz, nx, nz, 1.8, 1.0, 2.5); }
  }
  prism(P, M.creamShade, offsetRing(ring, 0.18), h - 0.3, h + 0.25, 4); P.cap(M.creamShade, offsetRing(ring, 0.18), h + 0.25, true, 4);
  return ring;
}

/** the boiler house w44425138 (yellow, gable roof, round-arched windows) and the brick chimney */
export function boilerHouse(P, M) {
  const b = L.buildingById('w44425138'); if (!b) return null;
  const ring = ringOf(b.polys[0].o), h = 6.4, O = obb(ring);
  prism(P, M.plaster, ring, 0, h, 4);
  prism(P, M.creamShade, offsetRing(ring, 0.12), h - 0.55, h, 4);                                                        // the cornice band
  P.cap(M.sheet, ring, h, true, 4);
  gable(P, M.sheet, M.plaster, fitBox(ring, O), h, 2.7, 0.4);
  // window columns on the long faces: dark panes 1.0 x 1.9 m every 3.4 m, two rows on the water side
  const sg = ringArea(ring) > 0 ? 1 : -1;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], c = ring[(i + 1) % ring.length], dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz); if (l < 6) continue;
    const nx = dz / l * sg, nz = -dx / l * sg, ux = dx / l, uz = dz / l, n = Math.floor((l - 1.5) / 3.4);
    for (let j = 0; j < n; j++) { const t = 0.75 + (l - 1.5) / n * (j + 0.5) - 0.0, px = a[0] + ux * t + nx * 0.04, pz = a[1] + uz * t + nz * 0.04; pane(P, M, px - nx * 0.04, pz - nz * 0.04, ux, uz, nx, nz, 1.0, 1.8, 3.7); if (j % 2 === 0) pane(P, M, px - nx * 0.04, pz - nz * 0.04, ux, uz, nx, nz, 1.0, 0.7, 1.5); }
  }
  return { ring, obb: O };
}
export function chimney(P, M) {
  const [x, z] = CHIMNEY, H = 45, r0 = 1.55, r1 = 0.88, seg = 8;
  const pt = (i, y, r) => { const t = i / seg * Math.PI * 2 + Math.PI / 8; return [x + Math.cos(t) * r, y, z + Math.sin(t) * r]; };
  const rAt = (y) => r0 + (r1 - r0) * y / H;
  for (let i = 0; i < seg; i++) {
    const a = pt(i, 0, r0), b = pt(i + 1, 0, r0), c = pt(i + 1, H, r1), d = pt(i, H, r1), w = Math.hypot(b[0] - a[0], b[2] - a[2]), mid = (i + 0.5) / seg * Math.PI * 2 + Math.PI / 8;
    P.quad(M.brick, a, b, c, d, [Math.cos(mid), 0, Math.sin(mid)], [[0, 0], [w, 0], [w * r1 / r0, H], [0, H]]);
  }
  const ring = (y0, y1, dr) => { for (let i = 0; i < seg; i++) { const a = pt(i, y0, rAt(y0) + dr), b = pt(i + 1, y0, rAt(y0) + dr), c = pt(i + 1, y1, rAt(y1) + dr), d = pt(i, y1, rAt(y1) + dr), mid = (i + 0.5) / seg * Math.PI * 2 + Math.PI / 8; P.quad(M.dark, a, b, c, d, [Math.cos(mid), 0, Math.sin(mid)]); } };
  ring(14, 14.35, 0.08); ring(27, 27.35, 0.08); ring(40, 40.35, 0.08);                                                    // iron bands
  P.col(M.creamShade, x, z, H - 1.6, H, r1 + 0.22, r1 + 0.22, 8, true);                                                    // the cap
  P.col(M.steelGrey, x, z, H, H + 3.5, 0.03, 0.02, 4, false);                                                              // lightning rod
  return [x, z];
}

/** scoreboard on the rim at the north-east end and the covered press / VIP stand on the north-west side */
export function rimStructures(P, M) {
  const B = bowl(), pf = pitchFrame(), N = B.N; let kNE = 0, kNW = 0, bne = -1e9, bnw = -1e9;
  for (let k = 0; k < N; k++) { const q = B.st[k], u = -q.nx * pf.ux - q.nz * pf.uz, v = -q.nx * pf.vx - q.nz * pf.vz; if (u > bne) { bne = u; kNE = k; } if (-v > bnw && Math.abs(u) < 0.3) { bnw = -v; kNW = k; } }
  const frame = (k, s, fn) => { const q = B.st[k]; P.push(q.x + q.nx * s, 0, q.z + q.nz * s, Math.atan2(-q.nx, -q.nz)); try { fn(q); } finally { P.pop(); } };      // local +z = outward, +x = along the ring
  // scoreboard (pale concrete box with five round windows on its back: s04)
  frame(kNE, GAL + 0.7, () => {
    P.box(M.roof, -6, 6, Y.rim, Y.rim + 7.2, -1.1, 1.1, 'fk');
    P.quad(M.roof, [-6, Y.rim, 1.1], [6, Y.rim, 1.1], [6, Y.rim + 7.2, 1.1], [-6, Y.rim + 7.2, 1.1], [0, 0, 1]);
    P.quad(M.dark, [-5, Y.rim + 1.4, -1.12], [5, Y.rim + 1.4, -1.12], [5, Y.rim + 5.9, -1.12], [-5, Y.rim + 5.9, -1.12], [0, 0, -1]);               // the screen faces the pitch
    P.quad(M.roof, [6, Y.rim, -1.1], [-6, Y.rim, -1.1], [-6, Y.rim + 7.2, -1.1], [6, Y.rim + 7.2, -1.1], [0, 0, -1]);
    for (const x of [-4, -2, 0, 2, 4]) { const c = [x, Y.rim + 5.9, 1.14], pts = []; for (let i = 0; i < 12; i++) { const t = i / 12 * Math.PI * 2; pts.push([c[0] + Math.cos(t) * 0.45, c[1] + Math.sin(t) * 0.45, c[2]]); } P.fan(M.dark, pts, [0, 0, 1], (p) => [p[0], p[1]]); }
    P.box(M.steelGrey, -5, 5, Y.rim - 0.1, Y.rim + 0.2, -1.3, 1.3, '');
  });
  // covered press / VIP stand on the north-west side: two grey roofs on posts and a white glazed booth between them
  frame(kNW, GAL + 0.6, () => {
    for (const [x0, x1] of [[-35, -12], [12, 35]]) {
      P.box(M.sheet, x0, x1, 12.6, 12.95, -9.6, -0.6, '');
      for (let x = x0 + 1; x <= x1 - 0.5; x += 5.7) { P.box(M.steelGrey, x - 0.1, x + 0.1, Y.seatTop, 12.6, -9.5, -9.3, 'b'); P.box(M.steelGrey, x - 0.1, x + 0.1, Y.seatTop + 0.3, 12.6, -1.2, -1.0, 'b'); }
    }
    P.box(M.white, -11.5, 11.5, 9.0, 13.2, -7.2, -1.0, '');
    P.quad(M.dark, [-10.5, 10.4, -7.22], [10.5, 10.4, -7.22], [10.5, 12.3, -7.22], [-10.5, 12.3, -7.22], [0, 0, -1]);
    P.box(M.steelGrey, -11.9, 11.9, 13.2, 13.45, -7.6, -0.6, '');
  });
  return { kNE, kNW };
}


/** two rusty round steel mooring dolphins in the middle of the Zhdanovka north-west of the Zhdanovsky bridge (photo p13; positions [E]: the photo gives no coordinates) */
export const DOLPHINS = [[-3664, -2386], [-3684, -2400]];
export function dolphins(P, M) {
  for (const [x, z] of DOLPHINS) {
    P.col(M.rust, x, z, -3.9, -0.6, 0.45, 0.4, 10, true);
    P.col(M.rust, x, z, -1.9, -1.72, 0.58, 0.58, 10, true);
    P.col(M.rust, x, z, -1.0, -0.82, 0.56, 0.56, 10, true);
    P.col(M.steelGrey, x, z, -0.62, -0.5, 0.36, 0.3, 10, true);
  }
}
