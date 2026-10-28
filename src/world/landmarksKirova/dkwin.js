// landmarksKirova/dkwin.js - windows with REAL REVEALS for the Kirov Palace (frame FD, wall plane z0, windows facing +z): windowWall (facade.js) cuts the openings, dkFix() adds the dark timber frame with muntins at the
// back of the reveal and a pale stone sill / lintel; glass is one of the painted panes of the module (sky over a dark room / curtains).  docs/research/kirova.md 5.2 / 5.3 (frames 0.05 - 0.06 m, glass #2f3a40).
import { windowWall } from './facade.js';

/** an opening for windowWall: centre x, width w, y0..y1, nx pane columns, bars at fractions of the height (horizontal bars), glass material */
export const dkOp = (M, x, w, y0, y1, nx = 2, bars = [], glass = M.dkGlassA, o = {}) => ({ x, w, y0, y1, nx, bars, glass, kind: 'win', ...o });

export function dkFix(P, M, op, z0, depth = 0.22) {
  const xa = op.x - op.w / 2, xb = op.x + op.w / 2, y0 = op.y0, y1 = op.y1, zb = z0 - depth, fr = 0.055, mu = 0.04, zf = zb + 0.09;
  P.box(M.frame, xa, xa + fr, y0, y1, zb, zf, 'ktb', 1); P.box(M.frame, xb - fr, xb, y0, y1, zb, zf, 'ktb', 1);
  P.box(M.frame, xa + fr, xb - fr, y1 - fr, y1, zb, zf, 'kbt', 1); P.box(M.frame, xa + fr, xb - fr, y0, y0 + fr, zb, zf, 'ktb', 1);
  const h = y1 - y0 - 2 * fr, w = xb - xa - 2 * fr;
  for (let i = 1; i < (op.nx || 2); i++) { const x = xa + fr + w * i / op.nx; P.box(M.frame, x - mu / 2, x + mu / 2, y0 + fr, y1 - fr, zb + 0.02, zf - 0.02, 'k', 1); }
  for (const f of op.bars || []) { const y = y0 + fr + h * f; P.box(M.frame, xa + fr, xb - fr, y - mu / 2, y + mu / 2, zb + 0.02, zf - 0.02, 'k', 1); }
  if (op.sill !== false) P.box(M.band, xa - 0.1, xb + 0.1, y0 - 0.1, y0, z0, z0 + 0.1, 'k', 2);                 // stone sill
  if (op.lintel) P.box(M.band, xa - 0.08, xb + 0.08, y1, y1 + 0.14, z0, z0 + 0.06, 'kb', 2);                     // a pale lintel band over the podium groups
}

/** a wall field with openings and their frames; the uv origin of the wall texture is ya (the tile is laid from there); ops carry ABSOLUTE y */
export function dkWindowed(K, o) {
  const { P, M } = K, rel = o.ops.map((p) => ({ ...p, y0: p.y0 - o.ya, y1: p.y1 - o.ya })), depth = o.depth ?? 0.22;
  P.push(0, o.ya, 0, 0);
  windowWall(P, { x0: o.x0, x1: o.x1, y0: 0, y1: o.yb - o.ya, z0: o.z, tu: o.tu ?? 4, tv: o.tv ?? 4, wall: o.wall, base: o.base, baseTop: o.baseTop != null ? o.baseTop - o.ya : undefined, reveal: o.reveal || M.pale, depth, ops: rel });
  for (const p of rel) if (p.kind === 'win') dkFix(P, M, p, o.z, depth);
  P.pop();
}
