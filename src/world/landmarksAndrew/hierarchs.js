// landmarksAndrew/hierarchs.js - the CHURCH OF THE THREE HIERARCHS (Церковь Трёх Святителей, 6-я линия 11б, w84046107; D. Trezzini's design, 1740-60): a brick-red Elizabethan baroque church with white pilasters in
// pairs, window surrounds, a big white pediment on the south face, a hipped dark-grey roof with TWO cupolas (an octagonal drum with niches and a flattened dark onion, cross tip ~23 m, plus a small onion over the
// west entrance gable, ~17.5 m), the entrance under an arched wrought-iron canopy with three steps.  Dossier docs/research/andrew.md 3.9 (critic-corrected: wall #c04a30, roof #676f70), photos refs/andrew 47 c15.
// Frame T (frame.js).  The footprint is the baked w84046107 (8 vertices: 26.4 x 16.6 m body with a polygonal apse at the east end).
import * as L from '../layout.js';
import { ringFromFlat, addPolyColliders } from '../lib/massing.js';
import { ringEdges, band, onEdge, polyOf } from './kit.js';
import * as G from './geo.js';
import * as D from './domes.js';
import * as LO from './loft.js';
import * as O from './orders.js';
import { FT } from './frame.js';

const FALL = [[-14.6, -7.9], [11.8, -8.5], [12.0, -5.0], [16.8, -2.2], [16.8, 2.2], [12.1, 5.4], [12.0, 8.1], [-14.3, 8.3]];
const H = { plinth: 1.0, cornice: 10.5, apse: 8.8, ridge: 15.5 };

function outlineT() {
  try {
    const rec = L.buildingById('w84046107');
    if (rec && rec.polys && rec.polys[0]) { const r = ringFromFlat(rec.polys[0].o).map((p) => { const m = FT.M(p[0], p[1]); return [Math.round(m.a * 100) / 100, Math.round(m.b * 100) / 100]; }); if (r.length >= 6) return r; }
  } catch (e) { /* fall back */ }
  return FALL;
}

export function build(K) {
  const { ctx, P, M } = K;
  const ring = outlineT(), edges = ringEdges(polyOf(ring));
  P.push(FT.ox, 0, FT.oz, FT.rot);
  try {
    const topOf = (e) => ((e.a[0] + e.b[0]) / 2 > 12.05 ? H.apse : H.cornice);
    for (const e of edges) {
      const top = topOf(e);
      onEdge(P, e, (len, f) => {
        P.quad(M.red, [0, H.plinth, 0], [len, H.plinth, 0], [len, top - 1.0, 0], [0, top - 1.0, 0], [0, 0, 1]);
        if (len < 3.5) return;
        const apse = top === H.apse, n = Math.max(1, Math.round(len / 3.4)), pitch = len / n;
        for (let i = 0; i <= n; i++) {                                                     // pilasters in pairs every 3.4 m (a coupled pair of 0.45 m shafts)
          const u = i * pitch, a = Math.min(len - 0.27, Math.max(0.27, u));
          if (i === 0 || i === n) O.pilaster(P, M, a, H.plinth, top - 1.0, 0.5, 0.12);
          else { O.pilaster(P, M, a - 0.3, H.plinth, top - 1.0, 0.4, 0.12); O.pilaster(P, M, a + 0.3, H.plinth, top - 1.0, 0.4, 0.12); }
        }
        const west = Math.abs(f.xa[1]) > 0.7 && (e.a[0] + e.b[0]) / 2 < -12;                // the west face has the entrance
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) * pitch;
          if (west && Math.abs(u - len / 2) < 2.2) continue;
          if (apse) { O.rectWin(P, M, u, 3.0, 0.9, 3.2, { mat: M.winGrille, b: 0.12, lintel: 'flat' }); continue; }
          O.rectWin(P, M, u, 2.5, 0.9, 1.3, { mat: M.winGrille, b: 0.12, lintel: 'pedi' });                 // lower: small pediment
          O.rectWin(P, M, u, 6.3, 1.1, 1.8, { mat: M.win23, b: 0.15, lintel: 'flat' });                      // upper: ornamented head
        }
      });
    }
    band(P, edges, 0, H.plinth, 0.14, { front: M.graniteRed, top: M.graniteRed }, { uvs: 2 });
    band(P, edges, (e) => topOf(e) - 1.0, (e) => topOf(e) - 0.45, 0.14, { front: M.white, top: M.white }, { uvs: 4 });
    band(P, edges, (e) => topOf(e) - 0.45, topOf, 0.55, { front: M.white, top: M.white, under: M.underside }, { uvs: 4 });
    // ---- roof: a hip (ridge 15.5), the apse hip, two chimneys
    const y0 = H.cornice + 0.02;
    LO.hipRoof(P, M.roofDark, -15.2, 12.6, -9.0, 8.8, y0, H.ridge, { hipE: true });
    P.cap(M.underside, [[-15.2, -9.0], [12.6, -9.0], [12.6, 8.8], [-15.2, 8.8]], y0 - 0.01, false, 4);
    const apex = [14.5, H.apse + 3.2, 0], apseRing = ring.filter((p) => p[0] > 11.9 && Math.abs(p[1]) < 8.2).sort((p, q) => Math.atan2(p[1], p[0] - 12) - Math.atan2(q[1], q[0] - 12));
    for (let i = 0; i + 1 < apseRing.length; i++) { const a = apseRing[i], b = apseRing[i + 1]; P.fan(M.roofDark, [[a[0], H.apse + 0.02, a[1]], [b[0], H.apse + 0.02, b[1]], apex], [(a[0] + b[0]) / 2 - 14.5, 0.6, (a[1] + b[1]) / 2], (q) => [q[0] / 2, q[2] / 2]); }
    for (const [a, b] of [[-3.2, -1.4], [2.4, 1.6]]) P.box(M.pierPink, a - 0.5, a + 0.5, 14.8, 17.2, b - 0.5, b + 0.5, 'b', 1);
    // ---- cupola 1: octagonal drum with niches, a flattened dark onion, ball and cross (tip ~23.3)
    const dT = D.octStage(P, M, 3.0, 0, 14.7, 18.6, 3.6, { mat: M.red, winW: 0.9, winH: 2.0, winY: 0.12, face: () => 'niche', cornice: 0.45, proj: 1.14 });
    const oT = D.onion(P, M.cupola, 3.0, dT, 0, 1.45, 0.62);
    D.crown(P, M, 3.0, oT - 0.1, 0, 0.3, 23.3 - (oT - 0.1) - 0.6, 0);
    // ---- cupola 2: the small onion over the west gable (tip ~17.5)
    P.col(M.red, -11.4, 0, 12.4, 14.1, 0.85, 0.85, 8, true);
    const o2 = D.onion(P, M.cupola, -11.4, 14.1, 0, 0.85, 0.7);
    D.crown(P, M, -11.4, o2 - 0.08, 0, 0.22, 17.5 - (o2 - 0.08) - 0.44, 0);
    // ---- the south pediment (the attic of the nave) and the west entrance: pediment with a red tympanum, an arched wrought-iron canopy, three steps
    const south = edges.find((e) => Math.abs(e.n[1] - 1) < 0.15 && e.len > 20);
    if (south) onEdge(P, south, (len) => { P.push(len * 0.5, 0, 0, 0); LO.gable(P, M, 3.9, H.cornice, 1.5, { depth: 0.45, tympMat: M.red }); P.pop(); });
    const west = edges.find((e) => e.n[0] < -0.9 && e.len > 14);
    if (west) onEdge(P, west, (len) => {
      P.push(len / 2, 0, 0, 0);
      O.doorArch(P, M, 0, H.plinth + 0.05, 2.0, 2.6, { wall: M.red, mat: M.doorBrown });
      LO.gable(P, M, 3.6, H.cornice, 1.3, { depth: 0.4, tympMat: M.red });
      P.quad(M.iron, [-1.7, 4.1, 0.04], [1.7, 4.1, 0.04], [1.7, 3.3, 1.2], [-1.7, 3.3, 1.2], [0, 1, 0.6]);
      for (const s of [-1, 1]) P.box(M.iron, s * 1.65 - 0.03, s * 1.65 + 0.03, 3.2, 4.1, 0.04, 1.15, '', 1);
      for (let i = 0; i < 4; i++) P.box(M.plinth, -2.6 - (3 - i) * 0.05, 2.6 + (3 - i) * 0.05, 0, 0.15 * (4 - i), 0, 0.15 + 0.3 * (4 - i), 'b', 1);
      P.pop();
    });
  } finally { P.pop(); }
  try { const rec = L.buildingById('w84046107'); if (rec) for (const pl of rec.polys) addPolyColliders(ctx, pl, 0, 14, 1.0); } catch (e) { console.warn('[landmarksAndrew] hierarchs colliders:', e && e.message); }
  const c = FT.W(3, 0);
  K.svc.monuments.push({ id: 'w84046107', name: 'Церковь Трёх Святителей', x: c.x, z: c.z, h: 23.3 });
  void G;
}
