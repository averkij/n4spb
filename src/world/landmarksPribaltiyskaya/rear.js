// landmarksPribaltiyskaya/rear.js - the SEA side of the hotel (dossier 4.1, 4.5; photos 10 (the 1981 slide), 05, 07, n05, n14): the two-level RESTAURANT PAVILION that fills the rear V between the rear arms (a cream-white
// panel box 3.2 .. 7.0 m with one long glass band across its sea front) and the low golden DOME in its middle (centre (0.1, -115.8), d 33: a glazed drum 7 .. 11 m, a ribbed cap to 14.5 m).  Only the rear face of the
// pavilion is visible (the other edges touch the arms).  Frame HF (frame.js).
import { HF, Y, PAV, DOME } from './frame.js';
import { edgesOf, wallPart, ringBoxes } from './ring.js';
import { revolve } from './geo.js';

const TAU = Math.PI * 2;

export function build(K) {
  const P = K.P, M = K.M, errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksPribaltiyskaya] rear/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  P.push(HF.x, 0, HF.z, HF.rot);
  try {
    stage('pavilion', () => {
      const E = edgesOf(PAV);
      for (const e of E) {
        // the edges that touch the hull (the arms' inner faces and the central block rear) are inside the building: only the rear face (normal -z) and its two short returns show
        const mid = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2];
        if (!(mid[1] < -140.5)) continue;
        wallPart(P, M.pavilion, e, 0, e.len, Y.terr, Y.pavTop, 1 / 3, 1 / 3);
        if (e.len > 20) {                                            // the long glass band (dark glass, white mullions every 3 m) 0.9 m above the floor
          const A = e.a, B = e.b, n = e.n, off = 0.05;
          P.quad(M.pavGlass, [A[0] + n[0] * off, Y.terr + 0.9, A[1] + n[1] * off], [B[0] + n[0] * off, Y.terr + 0.9, B[1] + n[1] * off], [B[0] + n[0] * off, Y.pavTop - 0.8, B[1] + n[1] * off], [A[0] + n[0] * off, Y.pavTop - 0.8, A[1] + n[1] * off], [n[0], 0, n[1]]);
          const k = Math.floor(e.len / 3);
          for (let j = 0; j <= k; j++) { const t = (j + 0.5) * e.len / (k + 1) * 1.0, x = A[0] + e.t[0] * t, z = A[1] + e.t[1] * t; P.box(M.white, x - 0.06, x + 0.06, Y.terr + 0.9, Y.pavTop - 0.8, z + n[1] * 0.04 - 0.06, z + n[1] * 0.04 + 0.06, '', 1); }
        }
      }
      P.cap(M.pavRoof, PAV, Y.pavTop, true, 4);
    });
    stage('dome', () => {
      const { x, z, r } = DOME, y0 = Y.dome0, y1 = Y.dome1, h = Y.domeTop - y1, R = (r * r + h * h) / (2 * h), phiMax = Math.asin(r / R);
      P.cyl(M.pavilion, [x, y0 - 0.5, z], [x, y0, z], r + 0.3, r + 0.3, 36, false);
      P.cyl(M.pavGlass, [x, y0, z], [x, y1, z], r, r, 36, false);                                 // the glazed drum
      for (let i = 0; i < 36; i++) { P.push(x, 0, z, i / 36 * TAU); P.box(M.white, -0.08, 0.08, y0, y1, r - 0.02, r + 0.08, 'kbt', 1); P.pop(); }          // the drum mullions
      const prof = [[r + 0.2, y1]]; for (let j = 0; j <= 8; j++) { const phi = phiMax * (1 - j / 8); prof.push([R * Math.sin(phi), y1 + R * (Math.cos(phi) - Math.cos(phiMax))]); }
      P.push(x, 0, z, 0); revolve(P, M.dome, prof, 36, { uRep: 36, vTile: 4, crease: 60 }); P.pop();
      P.cyl(M.steel, [x, Y.domeTop, z], [x, Y.domeTop + 0.6, z], 0.5, 0.2, 8, true);
    });
  } finally { P.pop(); }
  K.ctx.physics && ringBoxes(K.ctx.physics, HF, PAV, 0, Y.pavTop + 1, 0.6, true);
  if (errs.length) throw new Error(errs.join('\n'));
}
