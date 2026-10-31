// landmarksLETI/shell.js - helpers shared by the buildings of the module: colliders in a local frame, wall panels with their window sets, a stage() guard.
//   Frame helpers (frame.js Frame): boxL / cylL / walkL put solids in world space from local coordinates (physics rotY == the Parts.push rotation).
//   wallRun()  one flat wall in the CURRENT facade frame (x 0..len to the right, z out): a holed panel without end faces (base collector K.P), the panes (K.P), the surrounds (detail collector K.D).
import { holedWall, pane, archSurround, surround } from './facade.js';

export const stage = (K, name, fn) => { try { return fn(); } catch (e) { console.error(`[landmarksLETI] ${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };

/** solid box in frame fr: centre (x, z) local, size w (local x) x d (local z), y0..y1 */
export const boxL = (ctx, fr, x, z, w, d, y0, y1) => { const p = fr.w(x, z); return ctx.physics.addBox(p[0], p[1], w, d, fr.rot, y0, y1); };
export const rectL = (ctx, fr, x0, x1, z0, z1, y0, y1) => boxL(ctx, fr, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y0, y1);
export const cylL = (ctx, fr, x, z, r, y0, y1) => { const p = fr.w(x, z); return ctx.physics.addCylinder(p[0], p[1], r, y0, y1); };
/** walkable top at height y */
export const walkL = (ctx, fr, x, z, w, d, y, bottom) => { const p = fr.w(x, z); return ctx.physics.addWalkBox(p[0], p[1], w, d, fr.rot, y, bottom); };
/** n steps rising along the local direction (dx, dz) (unit) from yLow (outside) to yHigh, width w, depth d, starting at local (x, z) = the OUTER foot; every box overlaps its neighbour by 2 cm */
export function stepsL(ctx, fr, x, z, dx, dz, w, d, yLow, yHigh, n) {
  const out = [], rot = Math.atan2(dx, dz);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n * d, lx = x + dx * t, lz = z + dz * t;
    const p = fr.w(lx, lz);
    const it = ctx.physics.addWalkBox(p[0], p[1], w, d / n + 0.04, fr.rot + rot, yLow + (yHigh - yLow) * (i + 1) / n);
    it.sticky = true; out.push(it);
  }
  return out;
}

/** window openings of a wall in the facade frame: arch(cx, y0, w, hTotal), rect(cx, y0, w, h) */
export const arch = (cx, y0, w, h, mat = 'winA') => ({ cx, y0, w, h, arch: true, mat });
export const rect = (cx, y0, w, h, mat = 'winR', sill) => ({ x0: cx - w / 2, x1: cx + w / 2, y0, y1: y0 + h, mat, sill });
/** n bay centres across x0..x1 */
export const bayCentres = (x0, x1, n) => Array.from({ length: n }, (_, i) => x0 + (i + 0.5) * (x1 - x0) / n);

/** the panel of one wall: holes = list of arch / rect; o: { depth, uvs, sMat (surround material), surround: 'none' | 'light' | 'full' } */
export function wallRun(K, mat, x0, x1, y0, y1, holes, o = {}) {
  const P = K.P, D = K.D || K.P, M = K.M, depth = o.depth ?? 0.5, sMat = o.sMat || M.stucco;
  holedWall(P, mat, x0, x1, y0, y1, holes, { depth, uvs: o.uvs ?? 2.4, noEnds: o.noEnds !== false });
  for (const h of holes) {
    pane(P, M[h.mat || 'winA'], h, depth);
    const sk = h.surround || o.surround || 'full';
    if (sk === 'none') continue;
    if (h.arch) archSurround(D, sMat, h, { sw: sk === 'full' ? 0.26 : 0.16, proud: 0.09, sill: h.sill !== false });
    else if (sk === 'full') surround(D, sMat, h, { sw: 0.2, proud: 0.09, sill: h.sill ?? 0.16 });
    else {
      D.box(sMat, h.x0 - 0.1, h.x1 + 0.1, h.y0 - 0.12, h.y0 - 0.02, 0, 0.14, 'kb');
      D.box(sMat, h.x0 - 0.1, h.x1 + 0.1, h.y1 + 0.02, h.y1 + 0.2, 0, 0.1, 'kb');
    }
  }
}
