// landmarksGavan/townAnnex.js - the low service buildings of the workers' town (docs/research/gavan.md 8.2, 8.3; photos refs/gavan 68-71 74 80 82 86 90): the unplastered yellow-grey brick ANNEXES (w201779451, the
// 4.6 x 4.2 box w201779469, the two half-round bay blocks w201779474 / 75 with their arched windows), the CLUB WING w201779472 (3 levels, eaves ~11 m, apex ~13.5 m [E +-2], plaster with red-brick bands, steep pointed
// boarded gable with fretwork, the entrance under a black iron canopy with the ДЗЮДО sign), the marble plaque of D. A. Dril' on the south-west corner of block G (reserved through ctx.services.labels), and the black
// iron fence across the passage between G and A on Maly pr. (a 2.6 m gate stays open).  Frame W.
import * as L from '../layout.js';
import { FW } from './frame.js';
import { ringEdges, onEdge, localOnEdge, frameOf } from './kit.js';
import { gableRoof, bar } from './prims.js';
import { fenceRun, postInstances, fenceBays } from './fence.js';
import { addPolyColliders } from '../lib/massing.js';

const ANNEX = ['w201779451', 'w201779469', 'w201779474', 'w201779475'];

export function buildAnnex(Q) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksGavan] town/annex/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  for (const id of ANNEX) stage(id, () => annex(Q, id));
  stage('club', () => club(Q));
  stage('plaque', () => plaque(Q));
  stage('fence', () => fence(Q));
  if (errs.length) throw new Error(errs.join('\n'));
}

const win = (P, mat, x, y0, y1, hw, z = 0.04) => P.quad(mat, [x - hw, y0, z], [x + hw, y0, z], [x + hw, y1, z], [x - hw, y1, z], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);

function annex(Q, id) {
  const P = Q.P, M = Q.M, b = L.buildingById(id);
  if (!b || !b.polys || !b.polys[0]) return;
  const poly = b.polys[0], edges = ringEdges(poly), H = 9.0;
  for (const e of edges) {
    if (e.len < 0.5) continue;
    onEdge(P, e, (len) => {
      P.quad(M.annexBrick, [0, 0, 0], [len, 0, 0], [len, H, 0], [0, H, 0], [0, 0, 1], [[0, 0], [len / 2.4, 0], [len / 2.4, H / 2.4], [0, H / 2.4]]);
      P.box(M.coping, -0.05, len + 0.05, H - 0.1, H + 0.12, 0, 0.18, 'b', 2);                          // the parapet cap
      if (len > 1.3) for (const y0 of [0.8, 5.0]) win(P, M.annexWin, len / 2, y0, y0 + 2.4, 0.65);
    });
  }
  const ring = []; for (let i = 0; i < poly.o.length; i += 2) ring.push([poly.o[i], poly.o[i + 1]]);
  P.cap(M.flatRoof, ring, H + 0.01, true, 3);
  addPolyColliders(Q.ctx, poly, -0.3, 9.5, 0.9);
}

function club(Q) {
  const P = Q.P, M = Q.M, b = L.buildingById('w201779472');
  if (!b || !b.polys || !b.polys[0]) return;
  const poly = b.polys[0], edges = ringEdges(poly), E = 11.0, GFH = 3.6;
  for (const e of edges) {
    if (e.len < 0.5) continue;
    const nu = e.n[0] * FW.U[0] + e.n[1] * FW.U[1];
    onEdge(P, e, (len) => {
      const n = Math.max(1, Math.round(len / 3.1));
      P.quad(M.townGF, [0, 0, 0], [len, 0, 0], [len, GFH, 0], [0, GFH, 0], [0, 0, 1], [[0, 0], [n, 0], [n, 0.8], [0, 0.8]]);
      P.quad(M.clubFace, [0, GFH, 0], [len, GFH, 0], [len, E, 0], [0, E, 0], [0, 0, 1], [[0, 0], [len / 4, 0], [len / 4, (E - GFH) / 4], [0, (E - GFH) / 4]]);
      P.box(M.coping, 0, len, E - 0.15, E + 0.1, 0, 0.5, 'b', 2);
      if (len > 3.5) for (let i = 0; i < n; i++) { const x = (i + 0.5) * len / n; win(P, M.clubWin, x, 5.0, 8.0, 0.75, 0.05); }
      if (nu < -0.9 && len > 4 && len < 6.5) {                                                         // the west front (closes the vista of the passage): the door under the iron canopy with the ДЗЮДО sign
        const x = len / 2;
        win(P, M.townDoor, x, 0.5, 3.4, 0.65, 0.06);
        P.box(M.iron, x - 1.2, x + 1.2, 3.7, 3.78, 0.0, 1.1, 'b', 1);
        for (const sx of [-1, 1]) bar(P, M.iron, [x + sx * 1.15, 3.7, 1.05], [x + sx * 1.15, 3.1, 1.05], 0.02, 4);
        P.quad(M.judoSign, [x - 0.8, 3.15, 1.06], [x + 0.8, 3.15, 1.06], [x + 0.8, 3.6, 1.06], [x - 0.8, 3.6, 1.06], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        // the steep pointed boarded gable with fretwork over the front
        const yr = E + 2.6, hw = Math.min(len / 2 + 0.3, 3.4);
        P.fan(M.gableBoards, [[x - hw, E, 0.3], [x + hw, E, 0.3], [x, yr, 0.3]], [0, 0, 1], (p) => [p[0] / 2.5, p[1] / 2.5]);
        bar(P, M.bracket, [x - hw - 0.05, E - 0.05, 0.35], [x, yr + 0.05, 0.35], 0.07, 4); bar(P, M.bracket, [x + hw + 0.05, E - 0.05, 0.35], [x, yr + 0.05, 0.35], 0.07, 4);
        P.cyl(M.bracket, [x, yr, 0.35], [x, yr + 0.8, 0.35], 0.06, 0.03, 4, true);
        win(P, M.clubWin, x, 8.0, 10.6, 0.7, 0.35);
      }
    });
  }
  // the roof: a gable roof along u over the bounding rectangle, eaves 11, ridge 13.5; the east end a brick triangle, the west end the front gable above
  FW.on(Q.P, () => {
    const u0 = 30.2, u1 = 49.4, v0 = -87.5, v1 = -80.3;
    gableRoof(Q.P, M.roofGreen, u0, u1, v0, v1, E, 2.3, true, { oe: 0.5, og: 0.12, under: M.townPlaster, gable: null, uvs: 2.4 });
    Q.P.fan(M.townBrick, [[u1, E, v0], [u1, E, v1], [u1, E + 2.3, (v0 + v1) / 2]], [1, 0, 0], (p) => [p[2] / 3, p[1] / 3]);
  });
  addPolyColliders(Q.ctx, poly, -0.3, 14, 0.9);
}

function plaque(Q) {
  const P = Q.P, M = Q.M, labels = Q.ctx.services && Q.ctx.services.labels;
  const b = L.buildingById('w17564584'); if (!b || !b.polys || !b.polys[0]) return;
  const w = FW.W(5.9, 5.6);
  for (const e of ringEdges(b.polys[0])) {
    const q = localOnEdge(e, w.x, w.z);
    if (Math.abs(q.d) > 0.3 || q.u < 0.3 || q.u > e.len - 0.3) continue;
    const nv = e.n[0] * FW.V[0] + e.n[1] * FW.V[1]; if (nv < 0.9) continue;                              // the south face toward the Gavanskaya x Maly pr. crossing
    const nb = Math.max(1, Math.round(e.len / 3.1)), pitch = e.len / nb, xs = Math.min(e.len - 0.8, Math.max(0.8, Math.round(q.u / pitch) * pitch));      // on the wall between two windows (a bay boundary)
    const fo = frameOf(e), cx = fo.x + fo.xa[0] * xs + e.n[0] * 0.04, cz = fo.z + fo.xa[1] * xs + e.n[1] * 0.04;
    if (labels && !labels.reserve('w17564584', cx, 2.35, cz, 0.55, 0.7, e.n[0], e.n[1], 'plate')) return;
    onEdge(P, e, () => { P.quad(M.plaqueDril, [xs - 0.275, 2.0, 0.045], [xs + 0.275, 2.0, 0.045], [xs + 0.275, 2.7, 0.045], [xs - 0.275, 2.7, 0.045], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]); });
    return;
  }
}

function fence(Q) {
  const a = FW.W(20.5, 5.55), c = FW.W(29.5, 5.55), mid = FW.W(25.0, 5.55);
  const fr = fenceRun(Q, [[a.x, a.z], [c.x, c.z]], { h: 1.6, y0: 0.06, bars: Q.M.fenceBars, panel: 2.5, gates: [[mid.x, mid.z, 1.3]], margin: 0.3 });
  postInstances(Q, 'lmgavan-townfence', fr.posts, { h: 1.7, spear: false });
  fenceBays(Q, 'lmgavan-townfence', fr.bays, { h: 1.6, y0: 0.06, bars: Q.M.fenceBars, solidH: 1.8 });      // n4spb: the panels are breakable bays (the source: solid boxes)
  Q.svc.fences.push({ id: 'town-G-A', pts: [[a.x, a.z], [c.x, c.z]], gates: [{ id: 'passage', x: mid.x, z: mid.z, w: 2.6 }], spans: fr.spans });
}
