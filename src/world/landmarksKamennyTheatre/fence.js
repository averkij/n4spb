// landmarksKamennyTheatre/fence.js - the black iron FENCE of the Kleinmichel plot (OSM w124708539, 207 m, photos K01 K03 K05 K09 K10 T09): spear-headed bars with balls and a ring-link lower field on a low granite
// socle, cream plaster gate piers with dark pointed caps and lanterns every ~25 m, and the main double gate opposite the tower.  The fence is solid (closed residence): its colliders are in walk.js.
// The line comes from the OSM way (local metres); the gate is placed at the point of the line nearest to the tower.
import * as THREE from 'three';
import { K as KF, KP } from './frame.js';
import { Q } from './facade.js';

export const LINE = [[-4350.5, -4961.8], [-4348.0, -4967.5], [-4336.7, -4963.0], [-4325.4, -4957.9], [-4318.5, -4951.7], [-4312.5, -4944.2], [-4295.1, -4914.3], [-4288.5, -4909.5], [-4224.0, -4888.6], [-4223.7, -4842.2]];
export const FENCE_H = 1.9, SOCLE = 0.35, GATE_W = 4.4;

/** the gate: the point on the line nearest to the tower (kept 6 m from the vertices) */
export function gateAt() {
  const t = KF.W(KP.tower.cx, KP.tower.cz);
  let best = null;
  for (let i = 0; i + 1 < LINE.length; i++) {
    const a = LINE[i], b = LINE[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 20) continue;
    let s = ((t.x - a[0]) * dx + (t.z - a[1]) * dz) / L; s = Math.max(6, Math.min(L - 6, s));
    const p = [a[0] + dx / L * s, a[1] + dz / L * s], d = Math.hypot(p[0] - t.x, p[1] - t.z);
    if (!best || d < best.d) best = { i, s, d, p, L, rot: Math.atan2(-dz, dx) };
  }
  return best;
}

export async function build(K) {
  const { M, P, N } = K;
  const gate = gateAt();
  const pier = (x, z, rot, big = false) => {
    const w = big ? 0.8 : 0.6, h = big ? 3.0 : 2.6;
    P.push(x, 0, z, rot); N.push(x, 0, z, rot);
    P.box(M.plaster, -w / 2, w / 2, 0, h, -w / 2, w / 2, 'b', 2);
    P.box(M.white, -w / 2 - 0.07, w / 2 + 0.07, 0, 0.4, -w / 2 - 0.07, w / 2 + 0.07, 'b', 2);
    P.box(M.white, -w / 2 - 0.08, w / 2 + 0.08, h - 0.15, h, -w / 2 - 0.08, w / 2 + 0.08, 'b', 2);
    // the dark pointed (ogee) cap: a four-sided pyramid on a dark slab
    P.box(M.slate, -w / 2 - 0.06, w / 2 + 0.06, h, h + 0.1, -w / 2 - 0.06, w / 2 + 0.06, 'b', 1);
    const cap = (n, sy) => { const g = new THREE.ConeGeometry(w * 0.78, 0.65, 4, 1); g.rotateY(Math.PI / 4); N.geo(M.slate, g, 0, h + 0.1 + 0.325, 0, 0, 0, 0, 1, sy, 1); g.dispose(); void n; };
    cap(0, 1);
    // the black lantern on the cap (K01 K09) and the recessed pointed-arch panel on both street faces: white stiles, a pointed head of two slanted strips
    P.box(M.iron, -0.13, 0.13, h + 0.7, h + 0.78, -0.13, 0.13, 'b', 1);
    P.box(M.iron, -0.11, 0.11, h + 0.78, h + 1.18, -0.11, 0.11, 'b', 1);
    const lg = new THREE.ConeGeometry(0.2, 0.22, 4, 1); lg.rotateY(Math.PI / 4); N.geo(M.iron, lg, 0, h + 1.29, 0, 0, 0, 0, 1, 1, 1); lg.dispose();
    N.col(M.iron, 0, 0, h + 1.38, h + 1.5, 0.02, 0.0, 4);
    for (const sz of [-1, 1]) {
      const zf = sz * (w / 2 + 0.005), hw2 = w / 2 - 0.12, y0 = 0.55, y1 = h - 0.9;
      for (const sx of [-1, 1]) N.box(M.white, sx * hw2 - 0.03, sx * hw2 + 0.03, y0, y1, Math.min(zf, zf + sz * 0.03), Math.max(zf, zf + sz * 0.03), 'b', 1);
      for (const sx of [-1, 1]) N.cyl(M.white, [sx * hw2, y1, zf + sz * 0.015], [0, y1 + 0.3, zf + sz * 0.015], 0.03, 0.03, 4, false);
      N.box(M.white, -hw2, hw2, y0 - 0.03, y0 + 0.03, Math.min(zf, zf + sz * 0.03), Math.max(zf, zf + sz * 0.03), 'b', 1);
    }
    P.pop(); N.pop();
  };
  const run = (a, b, y0 = 0) => {                                                   // a fence run from a to b (world points)
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.3) return;
    const rot = Math.atan2(-dz, dx), cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2;
    P.push(cx, y0, cz, rot); N.push(cx, y0, cz, rot);
    P.box(M.granite, -L / 2, L / 2, 0, SOCLE, -0.17, 0.17, 'b', 1.8);
    const n = Math.max(1, Math.round(L / 2.0)), k = L / n;
    for (let i = 0; i < n; i++) {
      const x0 = -L / 2 + i * k, x1 = x0 + k;
      Q(P, M.fenceK, [x0, SOCLE, 0], [x1, SOCLE, 0], [x1, SOCLE + FENCE_H, 0], [x0, SOCLE + FENCE_H, 0], [0, 0, 1]);
      N.box(M.iron, x0 - 0.04, x0 + 0.04, SOCLE, SOCLE + FENCE_H, -0.04, 0.04, '', 1);
    }
    P.box(M.iron, -L / 2, L / 2, SOCLE + FENCE_H - 0.05, SOCLE + FENCE_H, -0.025, 0.025, '', 1);
    P.pop(); N.pop();
  };
  // the line with the gate opening cut out
  const parts = [];
  for (let i = 0; i + 1 < LINE.length; i++) {
    const a = LINE[i], b = LINE[i + 1];
    if (gate && gate.i === i) {
      const dx = b[0] - a[0], dz = b[1] - a[1], L = gate.L, ux = dx / L, uz = dz / L, s0 = gate.s - GATE_W / 2, s1 = gate.s + GATE_W / 2;
      parts.push([a, [a[0] + ux * s0, a[1] + uz * s0]], [[a[0] + ux * s1, a[1] + uz * s1], b]);
    } else parts.push([a, b]);
  }
  for (const [a, b] of parts) run(a, b);
  // piers: at the corners, along the long runs every ~25 m, at the gate
  const piers = [];
  for (const p of LINE) piers.push([p[0], p[1], 0]);
  for (let i = 0; i + 1 < LINE.length; i++) {
    const a = LINE[i], b = LINE[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L / 25);
    for (let j = 1; j <= n; j++) { const t = j / (n + 1); piers.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(-(b[1] - a[1]), b[0] - a[0])]); }
  }
  for (const [x, z, r] of piers) pier(x, z, r);
  if (gate) {
    const ux = Math.cos(gate.rot), uz = -Math.sin(gate.rot);
    for (const s of [-1, 1]) pier(gate.p[0] + ux * s * (GATE_W / 2 + 0.4), gate.p[1] + uz * s * (GATE_W / 2 + 0.4), gate.rot, true);
    // two gate leaves (ironwork cut-outs 2.1 x 3.0 m) and a gilt-free scroll top rail between the piers
    P.push(gate.p[0], 0, gate.p[1], gate.rot);
    for (const s of [-1, 1]) Q(P, M.leafK, [s * 0.0 - (s < 0 ? 2.1 : 0), 0.1, 0], [s * 0.0 + (s > 0 ? 2.1 : 0), 0.1, 0], [s * 0.0 + (s > 0 ? 2.1 : 0), 3.1, 0], [s * 0.0 - (s < 0 ? 2.1 : 0), 3.1, 0], [0, 0, 1]);
    P.box(M.granite, -GATE_W / 2, GATE_W / 2, 0, 0.1, -0.15, 0.15, 'b', 1.8);
    P.pop();
  }
  K.shared.fence = { gate, parts, piers };
}
