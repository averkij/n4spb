// landmarksBotanicalGarden/shell.js - helpers shared by the buildings of the module: colliders in a local frame, wall panels with their window sets, a stage() guard.
//   Frame helpers (frame.js Frame): boxL / cylL / walkL put solids in world space from local coordinates (physics rotY == the Parts.push rotation).
//   wallRun()  one flat wall in the CURRENT facade frame (x 0..len to the right, z out): a holed plaster panel without end faces, panes, light surrounds; the caller adds bands / pilasters.
import { holedWall, pane, surround, archSurround } from './facade.js';

export const stage = (K, name, fn) => { try { return fn(); } catch (e) { console.error(`[landmarksBotanicalGarden] ${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };

/** solid box in frame fr: centre (x, z) local, size w (local x) x d (local z), y0..y1 */
export const boxL = (ctx, fr, x, z, w, d, y0, y1) => { const p = fr.w(x, z); return ctx.physics.addBox(p[0], p[1], w, d, fr.rot, y0, y1); };
/** solid box between local x0..x1, z0..z1 */
export const rectL = (ctx, fr, x0, x1, z0, z1, y0, y1) => boxL(ctx, fr, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y0, y1);
export const cylL = (ctx, fr, x, z, r, y0, y1) => { const p = fr.w(x, z); return ctx.physics.addCylinder(p[0], p[1], r, y0, y1); };
/** walkable top at height y */
export const walkL = (ctx, fr, x, z, w, d, y, bottom) => { const p = fr.w(x, z); const it = ctx.physics.addWalkBox(p[0], p[1], w, d, fr.rot, y, bottom); return it; };
/** n steps rising along the local direction (dx, dz) (unit) from yLow (outside) to yHigh, width w, depth d, starting at local (x, z) = the OUTER foot; every box overlaps its neighbour by 2 cm */
export function stepsL(ctx, fr, x, z, dx, dz, w, d, yLow, yHigh, n) {
  const out = [], rot = Math.atan2(dx, dz), sx = (dx), sz = (dz);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n * d, lx = x + sx * t, lz = z + sz * t;       // along the climb direction
    const p = fr.w(lx, lz);
    // the box is w wide across the climb, d / n deep along it: physics rotY of a frame whose +z is the climb direction
    const yaw = fr.rot + rot;
    const it = ctx.physics.addWalkBox(p[0], p[1], w, d / n + 0.04, yaw, yLow + (yHigh - yLow) * (i + 1) / n);
    it.sticky = true; out.push(it);
  }
  return out;
}

/** window openings of a wall in the facade frame: arch(cx, y0, w, hTotal), rect(cx, y0, w, h) */
export const arch = (cx, y0, w, h, mat = 'winI') => ({ cx, y0, w, h, arch: true, mat });
export const rect = (cx, y0, w, h, mat = 'winI', sill) => ({ x0: cx - w / 2, x1: cx + w / 2, y0, y1: y0 + h, mat, sill });
export const oval = (cx, cy, rx, ry, mat = 'winI') => ({ ell: true, cx, cy, rx, ry, mat });

/** n bay centres across x0..x1 */
export const bayCentres = (x0, x1, n) => Array.from({ length: n }, (_, i) => x0 + (i + 0.5) * (x1 - x0) / n);

/** the panel of one wall: holes = list of arch / rect / oval; surround = 'none' | 'light' | 'full'; M = materials; wall material mat.  Returns nothing. */
export function wallRun(K, mat, x0, x1, y0, y1, holes, o = {}) {
  const P = K.P, M = K.M, depth = o.depth ?? 0.35;
  holedWall(P, mat, x0, x1, y0, y1, holes.map((h) => (h.ell ? { cx: h.cx, cy: h.cy, ell: h } : h)), { depth, uvs: o.uvs ?? 3, noEnds: o.noEnds !== false });
  for (const h of holes) {
    const wm = M[h.mat || 'winI'];
    if (h.ell) { ovalPane(P, wm, h, depth); continue; }
    pane(P, wm, h, depth);
    const sk = h.surround || o.surround || 'light';
    if (sk === 'none') continue;
    if (h.arch) archSurround(P, M.white, h, { sw: sk === 'full' ? 0.26 : 0.16, proud: 0.07 });
    else if (sk === 'full') surround(P, M.white, h, { sw: 0.18, proud: 0.07, sill: h.sill ?? 0.14 });
    else {                                                                    // light: a projecting sill and a flat lintel slab
      const sw = 0.1;
      P.box(M.white, h.x0 - 0.1, h.x1 + 0.1, h.y0 - 0.12, h.y0 - 0.02, 0, 0.14, 'kb');
      P.box(M.white, h.x0 - sw, h.x1 + sw, h.y1 + 0.02, h.y1 + 0.2, 0, 0.1, 'kb');
    }
  }
}
function ovalPane(P, mat, h, depth) {
  const n = 18, z = -depth + 0.04, pts = [];
  for (let i = 0; i < n; i++) pts.push([h.cx + Math.cos(i * Math.PI * 2 / n) * h.rx, h.cy + Math.sin(i * Math.PI * 2 / n) * h.ry, z]);
  P.fan(mat, pts, [0, 0, 1], (p) => [(p[0] - h.cx) / h.rx * 0.5 + 0.5, (p[1] - h.cy) / h.ry * 0.5 + 0.5]);
}
