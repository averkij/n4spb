// landmarksKamennyPalace/gates.js - the FENCE LINE of the closed garden and its gates (dossier docs/research/kamenny-2026.md 5.1 "Fence line", "Gate group"; photos P19 P20 P22 P23 P09 P18 P02):
//   the fence: a grey limestone footing, a low yellow wall with a green copper coping and, every ~4 m, a yellow pier 0.6 m square with a white cornice, a green pyramid cap and a white oval cartouche on the
//   outer face; between the piers 1.75 m of black iron: 28 bars with spear tips, three rails, a lozenge chain (alpha sheet M.fence).  It runs along the OSM chains of frame.js (garden boundary on the avenue
//   side and the Bolshaya Nevka shore, the checkpoint line, the service-yard walls).
//   the parade gate (main gate on Kamennoostrovsky prospect, [E] +-15 m from the west end of the kitchen block): two yellow piers 3.2 m wide with two free Tuscan columns and an oval medallion in front of each,
//   an entablature with triglyph blocks and a dentil cornice, a yellow attic with a green hipped cap; between them the iron leaves (ring chain) under an iron arch with the GILDED CIPHER in a laurel wreath
//   and a gilded crown (no flag, no pole); a lower wicket pier group on both sides; a black plaque «Каменноостровский дворец / Академия талантов» (0.5 x 0.35 m, label reserved).
//   the church gate (same design, one opening), the two checkpoint gates with the yellow gate house and the sign «АКАДЕМИЯ ТАЛАНТОВ», the service-yard gate.
import * as THREE from 'three';
import { Q } from './facade.js';
import { geosOf, put } from './objs.js';
import { tuscan, latheRaw, hip, TAU } from './orders.js';
import { CHAIN_A, CHAIN_C, CHAIN_W, CHAIN_Y, CHAIN_S1, CHAIN_S2, CHAIN_Z } from './frame.js';

const stage = (K, name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksKamennyPalace] gates/${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };

// the straight run of the checkpoint chain C (collinear within 0.3 m) and of the yard wall W
// the checkpoint line is moved 1.5 m into the garden (roads rule: the road end w722921712 reaches the OSM wall at (-2660.6,-5233): a pier on its asphalt is forbidden); the last 1.5 m close the gap to the block corner
const C2 = [[-2633.3, -5213.2], [-2673.8, -5245.4], [-2674.7, -5244.2]], W2 = [CHAIN_W[0], CHAIN_W[CHAIN_W.length - 1]];
/** chains: pts, inside = a reference point of the garden / yard side (the cartouches look away from it), gates = [{ kind, s | seg+s, ... }] */
const CHAINS = [
  { id: 'A', pts: CHAIN_A, inside: [-2700, -5340], gates: [{ kind: 'parade', seg: 1, s: 10, cw: 4.4, wickets: true }, { kind: 'parade', seg: 4, s: 5.4, cw: 3.2, wickets: false, church: true }] },
  { id: 'C', pts: C2, inside: [-2630, -5270], gates: [{ kind: 'check', s: 34.0, cw: 4.0, sign: true, road: true }, { kind: 'check', s: 18.3, cw: 2.6 }, { kind: 'house', s: 25.8, len: 10.5 }] },
  { id: 'W', pts: W2, inside: [-2720, -5250], gates: [{ kind: 'check', s: 25.3, cw: 4.0, service: true }] },
  { id: 'Y', pts: CHAIN_Y, inside: [-2800, -5300], gates: [] },
  { id: 'S1', pts: CHAIN_S1, inside: [-2700, -5340], gates: [] },
  { id: 'S2', pts: CHAIN_S2, inside: [-2700, -5340], gates: [] },
  { id: 'Z', pts: CHAIN_Z, inside: [-2700, -5240], gates: [] },
];
const EXT = { parade: (g) => g.cw / 2 + 3.2 + 0.2 + (g.wickets ? 4.4 : 0), check: (g) => g.cw / 2 + 0.95, house: (g) => g.len / 2 };

/** place a world frame: origin (x, z), outward normal (nx, nz); local +x = (nz, -nx), local +z = n */
const frame = (x, z, nx, nz) => ({ x, z, rot: Math.atan2(nx, nz), c: nz, s: nx });
const toWorld = (f, lx, lz) => ({ x: f.x + lx * Math.cos(f.rot) + lz * Math.sin(f.rot), z: f.z - lx * Math.sin(f.rot) + lz * Math.cos(f.rot) });

/** the fence piece in its frame: x 0 .. L along the chain, +z outward */
function piece(K, L, seen, wx, wz, rot) {
  const P = K.P, M = K.M;
  P.box(M.plinth, 0, L, 0, 0.45, -0.27, 0.27, '', 1.8);
  P.box(M.wall, 0, L, 0.45, 1.15, -0.2, 0.2, '', 3);
  P.box(M.copperFlat, 0, L, 1.15, 1.25, -0.29, 0.29, 'b', 3);
  const n = Math.max(1, Math.round(L / 4.1)), k = L / n;
  for (let i = 0; i < n; i++) Q(P, M.fence, [i * k + 0.3, 1.25, 0], [(i + 1) * k - 0.3, 1.25, 0], [(i + 1) * k - 0.3, 3.0, 0], [i * k + 0.3, 3.0, 0], [0, 0, 1]);
  for (let i = 0; i <= n; i++) {
    const x = i * k, px = wx + x * Math.cos(rot), pz = wz - x * Math.sin(rot), key = Math.round(px * 2) + ',' + Math.round(pz * 2);
    if (seen.has(key)) continue; seen.add(key);
    pier(P, M, x, 0, 1, i < n || true);
  }
}
/** one fence pier at (x, z), yellow shaft 0.6 m, white cornice, green pyramid cap, a white oval cartouche on the +z face */
function pier(P, M, x, z, s) {
  P.box(M.plinth, x - 0.36, x + 0.36, 0, 0.5, z - 0.36, z + 0.36, 'b', 1.8);
  P.box(M.wall, x - 0.3, x + 0.3, 0.5, 2.9, z - 0.3, z + 0.3, 'b', 3);
  P.box(M.white, x - 0.4, x + 0.4, 2.9, 3.08, z - 0.4, z + 0.4, 'b', 3);
  const y0 = 3.08, y1 = 3.5, a = 0.42, t = [[x - a, z - a], [x + a, z - a], [x + a, z + a], [x - a, z + a]];
  for (let i = 0; i < 4; i++) { const p = t[i], q = t[(i + 1) % 4], mx = (p[0] + q[0]) / 2 - x, mz = (p[1] + q[1]) / 2 - z, l = Math.hypot(mx, mz); P.fan(M.copperFlat, [[p[0], y0, p[1]], [q[0], y0, q[1]], [x, y1, z]], [mx / l * 0.8, 0.6, mz / l * 0.8]); }
  const pts = []; for (let i = 0; i < 10; i++) { const a2 = i * TAU / 10; pts.push([x + Math.cos(a2) * 0.17, 2.0 + Math.sin(a2) * 0.3, z + 0.31]); }
  P.fan(M.white, pts, [0, 0, 1]); void s;
}

/** the gilded imperial crown: a jewelled band, a dome with eight pearl arches meeting at an orb, a cross; centred at (x, z), y = the rim, scale s (1 = 0.7 m wide) */
function crown(P, M, x, y, z, s = 1) {
  latheRaw(P, M.gold, 'crown', [[0.30, 0], [0.34, 0.02], [0.34, 0.14], [0.31, 0.17], [0.27, 0.2], [0.2, 0.34], [0.1, 0.44], [0.0, 0.46]], x, y, z, s, s, 16);
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8, c = Math.cos(a), sn = Math.sin(a); P.cyl(M.gold, [x + c * 0.33 * s, y + 0.2 * s, z + sn * 0.33 * s], [x + c * 0.24 * s, y + 0.46 * s, z + sn * 0.24 * s], 0.022 * s, 0.022 * s, 4, false); P.cyl(M.gold, [x + c * 0.24 * s, y + 0.46 * s, z + sn * 0.24 * s], [x, y + 0.64 * s, z], 0.02 * s, 0.02 * s, 4, false); }
  const og = new THREE.SphereGeometry(0.075 * s, 8, 6); P.geo(M.gold, og, x, y + 0.7 * s, z); og.dispose();
  P.box(M.gold, x - 0.012 * s, x + 0.012 * s, y + 0.76 * s, y + 0.98 * s, z - 0.012 * s, z + 0.012 * s, 'b'); P.box(M.gold, x - 0.07 * s, x + 0.07 * s, y + 0.88 * s, y + 0.91 * s, z - 0.012 * s, z + 0.012 * s, 'b');
}

/** the parade gate group in a gate frame (origin = the middle of the opening on the chain line, +x along the chain, +z outward); world frame f for the column meshes */
function parade(K, f, g) {
  const P = K.P, M = K.M, half = g.cw / 2, col = (K.shared.gateCol ||= geosOf((Q) => tuscan(Q, M.whiteFlat, 4.0, { s: 0.85, capMat: M.whiteFlat })));
  let tris = 0;
  for (const sg of [-1, 1]) {
    const b = (mat, xa, xb, y0, y1, z0, z1, skip = '', uvs = 3) => P.box(mat, Math.min(sg * xa, sg * xb), Math.max(sg * xa, sg * xb), y0, y1, z0, z1, skip, uvs);
    const x0 = half, x1 = half + 3.2;
    b(M.plinth, x0 - 0.05, x1 + 0.3, 0, 0.3, -1.25, 2.0, 'b', 1.8);                                  // the granite footing
    b(M.wall, x0, x1 + 0.2, 0.3, 0.95, -1.15, 1.95, 'b');                                             // the yellow pedestal block that carries the columns
    b(M.white, x0 - 0.05, x1 + 0.25, 0.95, 1.05, -1.2, 2.0, 'b');
    b(M.wall, x0, x1, 1.05, 4.9, -1.1, 1.1, 'b');                                                      // the pier body
    for (const cx of [x0 + 0.85, x0 + 2.45]) { const w = toWorld(f, sg * cx, 1.55); tris += put(K.root, col, w.x, 1.05, w.z, f.rot, 1, 'kpal-gcol'); }
    { const pts = [], cx = sg * (x0 + 1.65); for (let i = 0; i < 14; i++) { const a2 = i * TAU / 14; pts.push([cx + Math.cos(a2) * 0.5, 3.1 + Math.sin(a2) * 0.72, 1.12]); } P.fan(M.white, pts, [0, 0, 1]); P.fan(M.shade, pts.map((q) => [cx + (q[0] - cx) * 0.78, 3.1 + (q[1] - 3.1) * 0.78, 1.125]), [0, 0, 1]); }   // the oval medallion
    // entablature: architrave, frieze with three triglyph blocks, dentils, corona, cymatium
    b(M.white, x0 - 0.15, x1 + 0.35, 4.9, 5.2, -1.2, 1.9, 'b');
    b(M.wall, x0 - 0.05, x1 + 0.25, 5.2, 5.7, -1.1, 1.8, 'b');
    for (const dx of [0.5, 1.7, 2.9]) b(M.white, x0 + dx - 0.2, x0 + dx + 0.2, 5.2, 5.7, 1.8, 1.92, 'kb');
    b(M.white, x0 - 0.2, x1 + 0.4, 5.7, 5.9, -1.25, 2.05, 'bf', 3); P.quad(M.dentil, [Math.min(sg * (x0 - 0.2), sg * (x1 + 0.4)), 5.7, 2.05], [Math.max(sg * (x0 - 0.2), sg * (x1 + 0.4)), 5.7, 2.05], [Math.max(sg * (x0 - 0.2), sg * (x1 + 0.4)), 5.9, 2.05], [Math.min(sg * (x0 - 0.2), sg * (x1 + 0.4)), 5.9, 2.05], [0, 0, 1], [[0, 0], [(x1 - x0 + 0.6) / 1.02, 0], [(x1 - x0 + 0.6) / 1.02, 0.25], [0, 0.25]]);
    b(M.white, x0 - 0.3, x1 + 0.5, 5.9, 6.2, -1.4, 2.35, 'b');
    b(M.white, x0 - 0.2, x1 + 0.4, 6.2, 6.32, -1.3, 2.25, 'b');
    b(M.wall, x0 + 0.25, x1 - 0.25, 6.32, 7.2, -0.85, 1.15, 'b');                                      // the attic
    const lo = Math.min(sg * (x0 + 0.1), sg * (x1 - 0.1)), hi = Math.max(sg * (x0 + 0.1), sg * (x1 - 0.1));
    hip(P, M.copper, lo, hi, -1.05, 1.35, 7.15, 7.85);
    if (g.wickets) {                                                                                    // the wicket opening and its lower pier
      const w0 = x1 + 0.4, w1 = w0 + 1.4, p0 = w1, p1 = p0 + 2.8;
      b(M.plinth, w0 - 0.2, p1 + 0.2, 0, 0.3, -1.1, 1.5, 'b', 1.8);
      b(M.wall, p0, p1, 0.3, 4.3, -0.9, 0.95, 'b');
      for (const dx of [0.1, 2.45]) b(M.white, p0 + dx, p0 + dx + 0.38, 0.3, 4.3, 0.95, 1.08, 'kb');
      { const pts = []; for (let i = 0; i < 12; i++) { const a2 = i * TAU / 12; pts.push([sg * (p0 + 1.4 + Math.cos(a2) * 0.4), 2.7 + Math.sin(a2) * 0.55, 0.97]); } P.fan(M.white, pts, [0, 0, 1]); }
      b(M.white, p0 - 0.15, p1 + 0.15, 4.3, 4.65, -1.0, 1.3, 'b'); b(M.white, p0 - 0.25, p1 + 0.25, 4.65, 4.95, -1.1, 1.45, 'b');
      b(M.wall, p0 + 0.2, p1 - 0.2, 4.95, 5.5, -0.7, 0.8, 'b'); b(M.copperFlat, p0 + 0.1, p1 - 0.1, 5.5, 5.62, -0.8, 0.9, 'b');
      Q(P, M.leaf, [sg > 0 ? w0 : -w0, 0.25, 0], [sg > 0 ? w1 : -w1, 0.25, 0], [sg > 0 ? w1 : -w1, 2.95, 0], [sg > 0 ? w0 : -w0, 2.95, 0], [0, 0, 1], [0, 0.06, 1, 0.72]);
      b(M.iron, w0 - 0.05, w0 + 0.05, 0.25, 3.1, -0.05, 0.05, '');
    }
  }
  // the carriage gate: two leaves between the piers (as tall as the columns' capitals: P20, 4.8 m), a top rail, the arch with the cipher and the crown above the rail (arch crest at cornice level, crown above)
  const LT = 4.8;
  for (const sg of [-1, 1]) Q(P, M.leaf, [sg > 0 ? 0 : -half, 0.25, 0.02], [sg > 0 ? half : 0, 0.25, 0.02], [sg > 0 ? half : 0, LT, 0.02], [sg > 0 ? 0 : -half, LT, 0.02], [0, 0, 1]);
  P.box(M.iron, -half, half, LT, LT + 0.1, -0.05, 0.05, '', 1);
  for (const sg of [-1, 1]) P.box(M.iron, sg * half - 0.06, sg * half + 0.06, 0.2, LT + 0.2, -0.06, 0.06, '', 1);
  const arc = []; for (let i = 0; i <= 14; i++) { const t = i / 14, x = -half + t * g.cw; arc.push([x, LT + 0.1 + 1.45 * Math.pow(Math.sin(Math.PI * t), 0.75)]); }
  for (let i = 0; i < 14; i++) P.cyl(M.iron, [arc[i][0], arc[i][1], 0], [arc[i + 1][0], arc[i + 1][1], 0], 0.045, 0.045, 5, false);
  for (const sg of [-1, 1]) { P.cyl(M.iron, [sg * half * 0.82, LT + 0.12, 0], [sg * half * 0.5, LT + 0.55, 0], 0.03, 0.03, 4, false); }       // scroll stays
  const cw = Math.min(2.8, g.cw * 0.7);
  Q(P, M.crest, [-cw / 2, LT + 0.05, 0.03], [cw / 2, LT + 0.05, 0.03], [cw / 2, LT + 0.05 + cw * 0.68, 0.03], [-cw / 2, LT + 0.05 + cw * 0.68, 0.03], [0, 0, 1]);
  crown(P, M, 0, LT + 1.55, 0.0, 1.25);
  // the plaque on the left pier (main gate only): reserved on the facade registry
  if (!g.church) {
    const lx = -(half + 1.65), ly = 1.55, lz = 1.12 + 0.03, w = 0.5, h = 0.35;
    const wp = toWorld(f, lx, lz), nx = Math.sin(f.rot), nz = Math.cos(f.rot), labels = K.ctx.services.labels;
    if (!labels || labels.reserve('kpal-gate', wp.x, ly, wp.z, w, h, nx, nz, 'plate')) Q(P, M.plaque, [lx - w / 2, ly - h / 2, lz], [lx + w / 2, ly - h / 2, lz], [lx + w / 2, ly + h / 2, lz], [lx - w / 2, ly + h / 2, lz], [0, 0, 1]);
  }
  K.extraTris += tris;
}

/** a plain gate: two yellow piers (0.8 m) with green caps, iron leaves, optional sign board above */
function plainGate(K, g) {
  const P = K.P, M = K.M, half = g.cw / 2, h = g.service ? 2.8 : 3.0;
  for (const sg of [-1, 1]) {
    const x = sg * (half + 0.45);
    P.box(M.plinth, x - 0.5, x + 0.5, 0, 0.5, -0.5, 0.5, 'b', 1.8); P.box(M.wall, x - 0.4, x + 0.4, 0.5, 3.6, -0.4, 0.4, 'b', 3); P.box(M.white, x - 0.5, x + 0.5, 3.6, 3.78, -0.5, 0.5, 'b', 3);
    const a = 0.52; for (let i = 0; i < 4; i++) { const t = [[-a, -a], [a, -a], [a, a], [-a, a]], p = t[i], q = t[(i + 1) % 4], mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2, l = Math.hypot(mx, mz); P.fan(M.copperFlat, [[x + p[0], 3.78, p[1]], [x + q[0], 3.78, q[1]], [x, 4.3, 0]], [mx / l * 0.8, 0.6, mz / l * 0.8]); }
    Q(P, M.leaf, [sg > 0 ? 0 : -half, 0.2, 0], [sg > 0 ? half : 0, 0.2, 0], [sg > 0 ? half : 0, 0.2 + h, 0], [sg > 0 ? 0 : -half, 0.2 + h, 0], [0, 0, 1], [0, 0.05, 1, 0.05 + h / 3.9 * 0.95]);
  }
  P.box(M.iron, -half, half, 0.2 + h, 0.3 + h, -0.05, 0.05, '', 1);
  if (g.sign) Q(P, M.gateSign, [-1.7, 3.15, 0.07], [1.7, 3.15, 0.07], [1.7, 3.57, 0.07], [-1.7, 3.57, 0.07], [0, 0, 1]);
}

/** the checkpoint gate house: a one-storey yellow box on the chain line (depth 4.4 m) with a green hipped roof, a white cornice, two windows and a door on the outer face */
function gateHouse(K, g) {
  const P = K.P, M = K.M, hl = g.len / 2, hd = 2.2, hh = 3.4;
  P.box(M.plinth, -hl, hl, 0, 0.5, -hd, hd, 'b', 1.8);
  P.box(M.wall, -hl, hl, 0.5, hh, -hd + 0.05, hd - 0.05, 'b', 3);
  P.box(M.white, -hl - 0.12, hl + 0.12, hh, hh + 0.3, -hd - 0.12, hd + 0.12, 'b', 3);
  hip(P, M.copper, -hl - 0.1, hl + 0.1, -hd - 0.1, hd + 0.1, hh + 0.3, hh + 1.7);
  P.box(M.white, hl - 1.2, hl - 0.5, hh + 1.2, hh + 2.6, 0.2, 0.9, 'b', 3); P.box(M.copperFlat, hl - 1.3, hl - 0.4, hh + 2.6, hh + 2.75, 0.1, 1.0, 'b', 3);
  for (const sg of [-1, 1]) {                                                                           // windows and the door on both long faces (the +z face looks to the road)
    for (const z of [hd - 0.05 + 0.0, -(hd - 0.05)]) {
      const nz = z > 0 ? 1 : -1, zz = z + nz * 0.01;
      const xs = sg > 0 ? [hl * 0.55] : [-hl * 0.55];
      for (const cx of xs) { Q(P, M.winK, [cx - 0.55, 1.1, zz], [cx + 0.55, 1.1, zz], [cx + 0.55, 2.9, zz], [cx - 0.55, 2.9, zz], [0, 0, nz]); P.box(M.surround, cx - 0.72, cx + 0.72, 0.95, 1.1, Math.min(z, z + nz * 0.1), Math.max(z, z + nz * 0.1), '', 3); }
    }
  }
  Q(P, M.door, [-0.6, 0.5, hd - 0.04], [0.6, 0.5, hd - 0.04], [0.6, 2.7, hd - 0.04], [-0.6, 2.7, hd - 0.04], [0, 0, 1]);
}

export function build(K) {
  const P = K.P, M = K.M, seen = new Set(), walkRuns = [], walkGates = [];
  let fenceLen = 0;
  for (const ch of CHAINS) {
    stage(K, 'chain ' + ch.id, () => {
      const segs = [];
      for (let i = 0; i + 1 < ch.pts.length; i++) {
        const a = ch.pts[i], b = ch.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
        let nx = -uz, nz = ux; const mx = (a[0] + b[0]) / 2 - ch.inside[0], mz = (a[1] + b[1]) / 2 - ch.inside[1];
        if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; }
        // local +x of a frame with outward normal n is (nz, -nx): it equals +u or -u
        const dirSign = (nz * ux + -nx * uz) > 0 ? 1 : -1;
        segs.push({ a, b, L, ux, uz, nx, nz, dirSign, cut: [] });
      }
      // gates: a flat list over the chain: each has seg (index) and s (m from the segment start); gates given only by s on a one-segment chain
      for (const g of ch.gates) {
        const si = g.seg ?? 0, sg = segs[si], ext = EXT[g.kind](g);
        sg.cut.push({ s0: g.s - ext, s1: g.s + ext, g });
      }
      for (const sg of segs) {
        sg.cut.sort((p, q) => p.s0 - q.s0);
        let s = 0; const pieces = [];
        for (const c of sg.cut) { if (c.s0 - s > 0.8) pieces.push([s, c.s0]); s = Math.max(s, c.s1); }
        if (sg.L - s > 0.8) pieces.push([s, sg.L]);
        for (const [s0, s1] of pieces) {
          // the piece runs from point at s0 to s1 along u; the frame's +x is dirSign * u: for dirSign < 0 the origin is at s1
          const so = sg.dirSign > 0 ? s0 : s1, ox = sg.a[0] + sg.ux * so, oz = sg.a[1] + sg.uz * so;
          const rot = Math.atan2(sg.nx, sg.nz);
          P.push(ox, 0, oz, rot);
          try { piece(K, s1 - s0, seen, ox, oz, rot); } finally { P.pop(); }
          fenceLen += s1 - s0;
          walkRuns.push({ x0: sg.a[0] + sg.ux * s0, z0: sg.a[1] + sg.uz * s0, x1: sg.a[0] + sg.ux * s1, z1: sg.a[1] + sg.uz * s1 });
        }
        for (const c of sg.cut) {
          const g = c.g, sm = (c.s0 + c.s1) / 2, gx = sg.a[0] + sg.ux * g.s, gz = sg.a[1] + sg.uz * g.s;
          const f = frame(gx, gz, sg.nx, sg.nz); f.rot = Math.atan2(sg.nx, sg.nz);
          P.push(gx, 0, gz, f.rot);
          try {
            if (g.kind === 'parade') parade(K, f, g);
            else if (g.kind === 'check') plainGate(K, g);
            else if (g.kind === 'house') gateHouse(K, g);
          } finally { P.pop(); }
          // collider: the whole extent as one closed wall (the garden is closed)
          walkGates.push({ x0: sg.a[0] + sg.ux * c.s0, z0: sg.a[1] + sg.uz * c.s0, x1: sg.a[0] + sg.ux * c.s1, z1: sg.a[1] + sg.uz * c.s1, house: g.kind === 'house' });
          void sm;
        }
      }
    });
  }
  K.svc.fenceLength = Math.round(fenceLen);
  (K.shared.walkFns ||= []).push((ctx) => {
    const ph = ctx.physics;
    for (const r of walkRuns) { const dx = r.x1 - r.x0, dz = r.z1 - r.z0, l = Math.hypot(dx, dz); ph.addBox((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, l + 0.3, 0.8, Math.atan2(-dz, dx), 0, 3.2); }
    for (const r of walkGates) { const dx = r.x1 - r.x0, dz = r.z1 - r.z0, l = Math.hypot(dx, dz); ph.addBox((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, l + 0.2, r.house ? 4.0 : 1.5, Math.atan2(-dz, dx), 0, r.house ? 5.5 : 4.5); }
  });
  if (K.errs) throw new Error(K.errs.join('\n'));
  void THREE; void M; void P;
}
