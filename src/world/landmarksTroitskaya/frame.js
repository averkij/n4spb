// landmarksTroitskaya/frame.js - the model frames of the module (docs/research/troitskaya.md, measured on the baked OSM footprints).
//   MQ  the Mosque: origin = the dome centre (part w200396163), long axis bearing 342.2 deg.  Local +x = south (the qibla end), local +z = west (Kronverksky pr.), so the pishtaq facade looks
//       along +z.  world = origin + Ry(rot) * (x, z)  (three's rotation.y: local +x -> world (cos, -sin), local +z -> world (sin, cos)).
//   KS  the Kshesinskaya mansion: origin = vertex 18 of w43679385 (north end of the Kronverksky face); local +x = s along Kronverksky to the SSE (bearing 152.7), local +z = OUT of the Kronverksky
//       face (to the WSW), so the depth t is -z.  (The dossier's first axis estimate (0.604, 0.797) was the chord v18-v10; the faces themselves run 10 deg off it.)
const mk = (x, z, rot) => {
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const W = (mx, mz) => ({ x: x + mx * cs + mz * sn, z: z - mx * sn + mz * cs });
  const M = (wx, wz) => { const dx = wx - x, dz = wz - z; return { mx: dx * cs - dz * sn, mz: dx * sn + dz * cs }; };
  return {
    x, z, rot, W, M,
    box: (ph, mx, mz, w, d, y0, y1, r = 0) => { const p = W(mx, mz); return ph.addBox(p.x, p.z, w, d, r + rot, y0, y1); },
    cyl: (ph, mx, mz, rad, y0, y1) => { const p = W(mx, mz); return ph.addCylinder(p.x, p.z, rad, y0, y1); },
    faceRot: (dx, dz) => Math.atan2(dx, dz) + rot,
  };
};
export const MQ = mk(-1527.5, -2530.7, -1.26005);
// mansion: s unit (0.458, 0.889) (the direction of the faces v18-v17, v11-v10 and of the Kronverksky fence) = local +x -> world (cos, -sin)  =>  rot = atan2(-0.889, 0.458)
export const KS = mk(-1502.8, -2450.2, Math.atan2(-0.889, 0.458));
export const frameAt = mk;

/** two-centre pointed arch: half width r, rise h (apex above the springing), n segments per side: points [x, y] from (r, 0) over the apex (0, h) to (-r, 0) */
export function pointedArch(r, h, n = 8) {
  const c = (h * h - r * r) / (2 * r), R = r + c, a1 = Math.acos(c / R), pts = [];
  for (let i = 0; i <= n; i++) { const a = a1 * i / n; pts.push([-c + R * Math.cos(a), R * Math.sin(a)]); }
  for (let i = n - 1; i >= 0; i--) { const a = a1 * i / n; pts.push([c - R * Math.cos(a), R * Math.sin(a)]); }
  return pts;
}
export const pairs = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };

// ------------------------------------------------------------------------------------------------ fence runs (arc-length walk along a polyline, openings at gates)
function lineInfo(pts) { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; }
function at(info, s) {
  const { pts, cum } = info; s = Math.max(0, Math.min(info.len, s)); let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
  const a = pts[i - 1], b = pts[i], l = cum[i] - cum[i - 1] || 1, t = (s - cum[i - 1]) / l;
  return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l };
}
/**
 * Plan a fence along pts ([[x,z]..]): posts at the corners, every ~pitch between them and at both sides of every opening; `opens` = [{ x, z, half }] (points near the line: gates, crossing paths).
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
/** an alpha panel (both sides) between two points */
export function panelQuad(P, mat, a, b, y0, y1, tile) {
  const l = Math.hypot(b.x - a.x, b.z - a.z);
  P.quad(mat, [a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z], null, [[0, 0], [l / tile, 0], [l / tile, 1], [0, 1]]);
}
