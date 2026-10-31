// landmarksPetrovskyWest/shapes.js - small builders shared by the sights: walls extruded along a footprint ring (one tiled quad per edge) and a hip roof in an edge frame.
import { ringEdges, edgeFrame } from './frame.js';

/**
 * Walls of a ring from y0 to y1: one quad per edge in its edge frame (local +x along the edge, +z outward).  Edges at least `minBay` long use the bay material (n = round(len / pitch) tiles, v = y / th),
 * shorter ones the plain material.  o.skip = Set of edge indices to leave out; o.each(f, e, i) is called inside the pushed edge frame (decorations).  Returns the edge frames.
 */
export function wallsOfRing(P, ring, y0, y1, bayMat, plainMat, o = {}) {
  const pitch = o.pitch || 3.4, th = o.th || 3.2, minBay = o.minBay || pitch * 0.8, out = [];
  for (const e of ringEdges(ring)) {
    const f = edgeFrame(e), len = e.len;
    if (len < 0.15) continue;
    out.push(f);
    if (o.skip && o.skip.has(e.i)) continue;
    P.push(f.S.x, 0, f.S.z, f.rot);
    const n = Math.max(1, Math.round(len / pitch)), mat = len >= minBay ? bayMat : plainMat;
    P.quad(mat, [0, y0, 0], [len, y0, 0], [len, y1, 0], [0, y1, 0], [0, 0, 1], [[0, y0 / th], [n, y0 / th], [n, y1 / th], [0, y1 / th]]);
    if (o.each) o.each(f, e, e.i);
    P.pop();
  }
  return out;
}

/** a hip roof over the rectangle x 0..w, z -d..0 (the current frame) with eaves at height y, pitch p (tan), overhang ov; ridge along x; the uv = metres / 1.2 */
export function hipRoof(P, mat, w, d, y, p, ov = 0.4, o = {}) {
  const x0 = -ov, x1 = w + ov, z0 = -d - ov, z1 = ov, zm = -d / 2, h = (d / 2 + ov) * p, r0 = x0 + (d / 2 + ov), r1 = x1 - (d / 2 + ov), k = o.uvs || 1.2;
  const rr0 = Math.min(r0, w / 2), rr1 = Math.max(r1, w / 2);
  const sl = Math.hypot(1, p);
  P.quad(mat, [x0, y, z1], [x1, y, z1], [rr1, y + h, zm], [rr0, y + h, zm], [0, 1 / sl, p / sl], [[0, 0], [(x1 - x0) / k, 0], [(rr1 - x0) / k, h * sl / k], [(rr0 - x0) / k, h * sl / k]]);                    // front slope (+z side)
  P.quad(mat, [x1, y, z0], [x0, y, z0], [rr0, y + h, zm], [rr1, y + h, zm], [0, 1 / sl, -p / sl], [[0, 0], [(x1 - x0) / k, 0], [(rr1 - x0) / k, h * sl / k], [(rr0 - x0) / k, h * sl / k]]);
  P.quad(mat, [x0, y, z0], [x0, y, z1], [rr0, y + h, zm], [rr0, y + h, zm], [-p / sl, 1 / sl, 0]);                                                                                                          // west hip
  P.quad(mat, [x1, y, z1], [x1, y, z0], [rr1, y + h, zm], [rr1, y + h, zm], [p / sl, 1 / sl, 0]);                                                                                                           // east hip
  if (o.underside !== false) P.quad(o.under || mat, [x0, y - 0.02, z0], [x1, y - 0.02, z0], [x1, y - 0.02, z1], [x0, y - 0.02, z1], [0, -1, 0]);
  return y + h;
}
