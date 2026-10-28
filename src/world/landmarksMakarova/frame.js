// landmarksMakarova/frame.js - the model frames of the module (docs/research/makarova.md section 2) and the footprint rings that the walls close on (read from the baked OSM records, with the dossier numbers as fallbacks).
// A frame is { x, z, rot }: three.js group position = (x, 0, z), rotation.y = rot; local +X = u (world (cos rot, -sin rot)), local +Z = v (world (sin rot, cos rot)), y up.  world(u, v) = origin + u * U + v * V.
//   R   the Makarova row (OSM w107454280 no. 16/2, w107454310 no. 14, w107454297 no. 12): origin = the west corner of the no. 16/2 front on the embankment, u along the front toward the Spit (ESE), v inland (SSW);
//       the river is at -v, the front faces local -Z.
//   C   Catherine church at the Tuchkov Bridge (w74284443 + parts): origin = the centre of the dome circle, u along the long axis (WSW -> ENE), v NNW -> SSE; the tower is at u -31.7, the west front faces the Kadetskaya line.
//   P   Lions pier: origin = the middle of the stair head on the street edge line, u east, v toward the street (S); the river and the three flights are at -v; pit u -7.27..7.27, v -6.15..0.
//   E   Lutheran St Catherine (w54949806, dome part w875603833): origin = the west corner of the NW (altar) end, u along the end wall, v along the long axis toward the portico (SE); the portico front faces +v.
//   M   Lutheran St Michael (r18085303 + parts): origin = the west corner of the facade, facade at v = 0 facing NNW (Sredny pr.), nave toward SSE to v = 34.2.
//   S6  Sportivnaya-2 exit 6 (w627859233): origin = the pavilion centre, u = the long axis, the door tip at u = -7.7 (WSW).  S7 = exit 7 (w627859229) with the axes turned so that the door tip is ALSO at u = -7.7 (SSE end).
//   B   Brullov house (r1257269): origin = the SSE corner of the Kadetskaya-line front, u along the front toward NNW, v into the building; the front faces local -Z (WSW).
import * as L from '../layout.js';

export const DEG = Math.PI / 180;

/** a frame with its transforms: W(u, v) -> { x, z }, M(x, z) -> { u, v } */
export function mkFrame(x, z, rot) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return { x, z, rot, c, s, U: [c, -s], V: [s, c],
    W: (u, v) => ({ x: x + c * u + s * v, z: z - s * u + c * v }),
    M: (wx, wz) => ({ u: c * (wx - x) - s * (wz - z), v: s * (wx - x) + c * (wz - z) }) };
}
export const FR = mkFrame(-3443.3, -1540.9, -0.4011);        // R  (row)
export const FC = mkFrame(-3647.3, -1557.6, 0.5236);         // C  (Catherine church)
export const FP = mkFrame(-2851.1, -1439.3, -0.1396);        // P  (Lions pier)
export const FE = mkFrame(-3482.5, -1056.4, 0.5236);         // E  (Lutheran St Catherine)
export const FM = mkFrame(-3797.8, -1328.8, 0.5236);         // M  (St Michael)
export const F6 = mkFrame(-3752.4, -1682.4, 0.6283);         // S6 (exit 6, door tip at u = -7.7)
export const F7 = mkFrame(-3793.8, -1707.1, -1.3701 + Math.PI);   // S7 turned: door tip (SSE) at u = -7.7
export const FB = mkFrame(-3583.1, -1372.1, 2.1034);         // B  (Brullov house)

/** the ring of a baked building record in a frame: [[u, v], ...] (open); `fallback` = the dossier ring when the record is missing */
export function ringIn(f, id, fallback) {
  try {
    const b = L.buildingById(id);
    if (b && b.polys && b.polys[0] && b.polys[0].o && b.polys[0].o.length >= 6) {
      const o = b.polys[0].o, r = [];
      for (let i = 0; i < o.length; i += 2) { const q = f.M(o[i], o[i + 1]); r.push([Math.round(q.u * 100) / 100, Math.round(q.v * 100) / 100]); }
      // drop a closing duplicate
      if (r.length > 3 && Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 0.02) r.pop();
      return r;
    }
  } catch (e) { /* fall through */ }
  return fallback ? fallback.map((p) => p.slice()) : null;
}
/** the hole rings of a baked building record in a frame: [[[u, v]..], ..] */
export function holesIn(f, id) {
  try {
    const b = L.buildingById(id), hs = (b && b.polys && b.polys[0] && b.polys[0].h) || [];
    return hs.map((h) => { const r = []; for (let i = 0; i < h.length; i += 2) { const q = f.M(h[i], h[i + 1]); r.push([Math.round(q.u * 100) / 100, Math.round(q.v * 100) / 100]); } return r; });
  } catch (e) { return []; }
}
/** a local ring [[u, v]..] -> world flat ring [x, z, ...] */
export const toWorld = (f, ring) => ring.flatMap((p) => { const w = f.W(p[0], p[1]); return [w.x, w.z]; });
/** a local ring -> a baked-style poly { o: flat world ring, h: [] } (for ringEdges / addPolyColliders) */
export const polyIn = (f, ring) => ({ o: toWorld(f, ring), h: [] });

/** collider helpers in a frame (ph = ctx.physics): thin wall between two local points, box, cylinder, walk box */
export function colliders(f, ph) {
  return {
    wall(a, b, y0, y1, t = 0.4) {
      const A = f.W(a[0], a[1]), B = f.W(b[0], b[1]), len = Math.hypot(B.x - A.x, B.z - A.z);
      if (len < 0.05) return null;
      return ph.addBox((A.x + B.x) / 2, (A.z + B.z) / 2, len, t, Math.atan2(-(B.z - A.z), B.x - A.x), y0, y1);   // the collider item (flag it `fence = true` for the pedestrians' nav)
    },
    box(u, v, du, dv, y0, y1, rotAdd = 0) { const p = f.W(u, v); ph.addBox(p.x, p.z, du, dv, f.rot + rotAdd, y0, y1); },
    cyl(u, v, r, y0, y1) { const p = f.W(u, v); ph.addCylinder(p.x, p.z, r, y0, y1); },
    walk(u, v, du, dv, top, bottom, rotAdd = 0) { const p = f.W(u, v); return ph.addWalkBox(p.x, p.z, du, dv, f.rot + rotAdd, top, bottom); },
    ramp(u, v, du, dv, yA, yB, bottom = 3, rotAdd = 0) { const p = f.W(u, v); return ph.addWalkRamp(p.x, p.z, du, dv, f.rot + rotAdd, yA, yB, bottom); },
  };
}

// ------------------------------------------------------------------------------------------------ dossier rings (fallbacks) and fixed dimensions
export const FALL = {
  // R: no. 16/2, no. 14, no. 12 (section 3.2)
  r16: [[-10.14, 13.75], [0, 0], [54.31, 0], [42.84, 15.72], [33.75, 15.56], [33.78, 15.11], [6.43, 14.65], [1.41, 21.78]],
  r14: [[54.31, 0], [67.18, -0.14], [66.88, 11.72], [45.49, 11.99]],
  r12: [[67.18, -0.14], [126.24, -0.2], [129.12, 2.49], [128.98, 11.12], [121.82, 18.07], [117.78, 18.27], [116.34, 19.74], [112.31, 19.71], [111.16, 18.03], [104.81, 17.9], [103.54, 19.52], [100.09, 19.58],
    [99.03, 17.85], [82.11, 17.64], [81.35, 18.18], [77.19, 18.1], [76.55, 17.61], [65.85, 17.48], [29.4, 65.74], [27.61, 64.33], [26.38, 66.04], [23.6, 63.85], [22.63, 65.14], [19.85, 62.95], [59.31, 11.78], [66.88, 11.72]],
  // C: Catherine church cross plan (section 5.2), the chapel, the gatehouse, the bell frame
  church: [[-35.39, -5.31], [-26.61, -5.32], [-26.7, -10.56], [-12.58, -10.61], [-12.62, -15.95], [13.06, -16.02], [13.1, -10.68], [21.57, -10.76], [21.64, 9.72], [13.17, 9.8], [13.2, 15.13], [-12.38, 15.25],
    [-12.51, 9.87], [-26.54, 9.97], [-26.59, 4.86], [-36.76, 4.87], [-36.78, -5.3]],
  chapel: [[-35.23, 15.22], [-29.76, 15.15], [-29.79, 20.79], [-38.48, 20.85], [-38.54, 15.16]],
  gatehouse: [[-38.69, -15.18], [-38.73, -20.51], [-32.73, -20.51], [-32.84, -23.12], [-28.18, -23.2], [-28.13, -15.08]],
  bellframe: [[-1.43, -26.12], [9.63, -26.08], [9.73, -22.44], [-1.39, -22.39]],
  // E: Lutheran St Catherine (section 7.2)
  lutheran: [[0, 0], [22.09, -0.06], [22.38, 42.83], [23.91, 42.79], [23.9, 48.21], [16.59, 48.26], [16.65, 49.56], [6.03, 49.55], [6.06, 48.3], [-1.24, 48.36], [-1.23, 42.94], [0.29, 42.89]],
  // M: St Michael (section 8.2) and the tower stages
  michael: [[3.94, -0.03], [4.03, -0.79], [10.53, -0.85], [10.44, -0.09], [14.48, -0.07], [15.46, 0.61], [15.6, 34.18], [-0.8, 34.18], [-0.98, 0.7], [0, 0]],
  michaelT1: [[3.94, -0.03], [4.03, -0.79], [10.53, -0.85], [10.52, 4.57], [8.62, 6.48], [5.97, 6.45], [3.94, 4.58]],
  michaelT2: [[10.52, 4.57], [8.62, 6.48], [5.97, 6.45], [3.94, 4.58], [4.01, 1.85], [5.92, -0.05], [8.56, -0.02], [10.46, 1.88]],
  brullov: [[0, 0], [22.1, 0], [21.8, 63.7], [-0.4, 63.6], [-0.3, 51.6], [5.9, 51.6], [5.9, 56.2], [15.9, 56.3], [16.0, 33.5], [-0.2, 33.4]],
  brullovCourt: [[14.4, 12.6], [5.7, 12.6], [5.6, 26.5], [14.4, 26.6]],
  michaelT3: [[9.38, 4.15], [8.1, 5.37], [6.35, 5.4], [5.13, 4.12], [5.1, 2.37], [6.3, 1.09], [8.13, 1.12], [9.4, 2.31]],
};

/** the Row dimensions (section 3.3-3.5): fronts on v = 0 */
export const ROW = { w16: [0, 13.0], arc: [13.0, 54.3], e14: [54.3, 67.2], n12: [67.2, 126.2] };
