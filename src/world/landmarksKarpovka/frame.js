// landmarksKarpovka/frame.js - the model frames of the module (docs/research/karpovka.md section 6, measured on the baked OSM footprints).
//   CV  the Ioannovsky convent: origin = the SW corner of the church (vertex 20 of r3274778), local +x = east along the south facade (31.64 m to the apse), local +z = OUT of that facade
//       (toward the river, bearing 164.6 deg), so the depth of the block is -z.  world = origin + Ry(rot) * (x, z)  (three's rotation.y: local +x -> world (cos, -sin), local +z -> world (sin, cos)).
//   LS  the First Lensovet House: the river face of the slab is an arc (centre C on the river side, radius R, from the west prow at angle A0 to the east prow at A1, angles = atan2(dz, dx));
//       the slab is the annular sector R .. R + DEPTH cut at both ends by a line parallel to its wing.  `arc(a, r)` = world point, `nrm(a)` = outward (river side) normal.
const mk = (x, z, rot) => {
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const W = (mx, mz) => ({ x: x + mx * cs + mz * sn, z: z - mx * sn + mz * cs });
  const M = (wx, wz) => { const dx = wx - x, dz = wz - z; return { mx: dx * cs - dz * sn, mz: dx * sn + dz * cs }; };
  return {
    x, z, rot, W, M,
    box: (ph, mx, mz, w, d, y0, y1, r = 0) => { const p = W(mx, mz); return ph.addBox(p.x, p.z, w, d, r + rot, y0, y1); },
    cyl: (ph, mx, mz, rad, y0, y1) => { const p = W(mx, mz); return ph.addCylinder(p.x, p.z, rad, y0, y1); },
    walk: (ph, mx, mz, w, d, top, bottom) => { const p = W(mx, mz); return ph.addWalkBox(p.x, p.z, w, d, rot, top, bottom); },
  };
};
export const CV = mk(-2865.6, -4231.6, Math.atan2(8.4, 30.5));
export const frameAt = mk;

const DEG = Math.PI / 180;
export const LS = (() => {
  const C = [-2191.87, -3942.4], R = 89.6, DEPTH = 14.5;
  const A0 = Math.atan2(-4029.8 - C[1], -2211.6 - C[0]), A1 = Math.atan2(-4007.3 - C[1], -2130.1 - C[0]);     // west prow (v21), east prow (v13)
  const N = 32, DA = (A1 - A0) / N;
  const arc = (a, r = R) => [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r];
  const nrm = (a) => [-Math.cos(a), -Math.sin(a)];
  return {
    C, R, DEPTH, A0, A1, N, DA, arc, nrm,
    bayW: 2 * R * Math.sin(DA / 2),
    /** angle of the left edge of bay i (0 = the west prow) */
    ang: (i) => A0 + i * DA,
    /** end lines: tip, unit direction into the block (parallel to the wing), length to the back arc, length of the exposed part (to the wing's end wall) */
    westEnd: { tip: [-2211.6, -4029.8], dir: [0.388, -0.9217], len: 17.24, open: 5.5, back: -97.2 * DEG },
    eastEnd: { tip: [-2130.1, -4007.3], dir: [0.279, -0.9603], len: 16.04, open: 6.46, back: -50.48 * DEG },
    /** footprint vertices used by the wings (OSM w50053711) */
    V: { 0: [-2201.1, -4079.4], 1: [-2190.0, -4075.0], 2: [-2201.8, -4046.9], 8: [-2126.7, -4023.4], 9: [-2114.3, -4068.1], 10: [-2100.9, -4064.9], 11: [-2116.3, -4010.1], 12: [-2128.3, -4013.5], 13: [-2130.1, -4007.3],
      21: [-2211.6, -4029.8], 22: [-2209.6, -4034.9], 23: [-2218.3, -4038.6] },
    /** the terrace front line (lawn polygons w187371636 / w187371633), west to east; W0 = the extension in front of the west wing's end wall */
    TF: [[-2220.0, -4028.3], [-2212.9, -4026.2], [-2176.9, -4015.9], [-2164.0, -4011.8], [-2148.6, -4007.1], [-2133.4, -4002.6], [-2119.3, -3998.9]],
  };
})();

export const pairs = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
/** rotation.y of a box whose local +x runs from a to b ([x, z]) */
export const rotOf = (a, b) => Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
/** thin wall collider along a - b */
export function wallBox(ph, a, b, y0, y1, t = 0.5) { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len > 0.05) ph.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, len, t, rotOf(a, b), y0, y1); }

// ------------------------------------------------------------------------------------------------ fence runs (arc-length walk along a polyline, openings at gates)
function lineInfo(pts) { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; }
function at(info, s) {
  const { pts, cum } = info; s = Math.max(0, Math.min(info.len, s)); let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
  const a = pts[i - 1], b = pts[i], l = cum[i] - cum[i - 1] || 1, t = (s - cum[i - 1]) / l;
  return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l };
}
/**
 * Plan a wall / fence along pts ([[x,z]..]): posts at the corners, every ~pitch between them and at both sides of every opening; `opens` = [{ x, z, half }] (points near the line: gates).
 * Returns { posts: [{ x, z, rot, gate }], panels: [{ a: {x,z}, b: {x,z}, len, rot }], opens: [{ x, z, rot, half }] }.
 */
export function planFence(pts, pitch, opens = [], inset = 0.2) {
  const info = lineInfo(pts), op = [];
  for (const g of opens) {
    let best = null;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((g.x - a[0]) * dx + (g.z - a[1]) * dz) / l2));
      const d = Math.hypot(g.x - a[0] - dx * t, g.z - a[1] - dz * t);
      if (d < (g.tol ?? 1.8) && (!best || d < best.d)) best = { d, s: info.cum[i] + t * (info.cum[i + 1] - info.cum[i]) };
    }
    if (best) op.push({ s: best.s, half: g.half ?? 1.8 });
  }
  const inOpen = (s, m = 0.05) => op.some((o) => s > o.s - o.half + m && s < o.s + o.half - m);
  let nodes = [];
  for (let i = 0; i < pts.length; i++) nodes.push({ s: info.cum[i], gate: false });
  for (let i = 0; i + 1 < pts.length; i++) { const l = info.cum[i + 1] - info.cum[i], n = Math.max(1, Math.round(l / pitch)); for (let k = 1; k < n; k++) nodes.push({ s: info.cum[i] + l * k / n, gate: false }); }
  for (const o of op) nodes.push({ s: Math.max(0, o.s - o.half), gate: true }, { s: Math.min(info.len, o.s + o.half), gate: true });
  nodes.sort((a, b) => a.s - b.s);
  nodes = nodes.filter((n) => n.gate || !inOpen(n.s)).filter((n, i, arr) => i === 0 || n.s - arr[i - 1].s > 0.3 || n.gate);
  const posts = [], panels = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i], p = at(info, Math.min(info.len - 1e-3, Math.max(1e-3, n.s)));
    posts.push({ x: p.x, z: p.z, rot: Math.atan2(-p.dz, p.dx), gate: n.gate });
    if (i + 1 < nodes.length) {
      const m = nodes[i + 1]; if (inOpen((n.s + m.s) / 2) || m.s - n.s < 2 * inset + 0.2) continue;
      const a = at(info, n.s + inset), b = at(info, m.s - inset), len = Math.hypot(b.x - a.x, b.z - a.z);
      panels.push({ a, b, len, rot: Math.atan2(-(b.z - a.z), b.x - a.x) });
    }
  }
  return { posts, panels, opens: op.map((o) => { const p = at(info, o.s); return { x: p.x, z: p.z, rot: Math.atan2(-p.dz, p.dx), half: o.half }; }) };
}
