// landmarksAndrew/precinct.js - the PRECINCT of St Andrew's Cathedral and the Three Hierarchs church: the white lace fence on pink piers with a granite plinth wall (docs/research/andrew.md 3.8; photos refs/andrew 10 30 40 41 42 43),
// the OSM fence runs w84055343 (north-west), w84055334 (south-west), w84055342 (east) closed by a south run in front of the S portal (a gate on the portal axis, open), the west gates of the Three Hierarchs
// yard and a brown stucco wall at the north end; the red-brown herringbone clinker paving of the court (clipped at the real asphalt: road integrity); four black lantern lamps at the portals.  The west court in
// front of the belfry (C a -28 .. -16.4) stays OPEN to the boulevard.  Frame C (frame.js).
import * as L from '../layout.js';
import { FC } from './frame.js';
import { fenceRuns } from './fence.js';
import { knockBays, unitBox, splitBays } from '../lib/fence-bays.js';
import { fillPolyClipped, coverFn } from './surfaces.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';
import * as O from './orders.js';

const w = (a, b) => { const p = FC.W(a, b); return [p.x, p.z]; };

/** the cathedral fence runs in frame C (a, b) */
export const RUNS_C = [
  { pts: [[-23.4, -66.0], [-23.4, -28.7], [-23.2, -21.2], [-20.1, -21.2], [-18.2, -20.7], [-17.1, -19.7], [-16.6, -18.0], [-16.5, -12.6]], gates: [[-23.4, -48.3]] },
  { pts: [[-22.8, 34.4], [-22.9, 21.7], [-17.5, 21.4], [-16.3, 20.6], [-16.0, 19.1], [-15.9, 17.4], [9.0, 17.4], [8.8, 13.4]], gates: [[-6.0, 17.4]] },
  { pts: [[20.7, -12.6], [20.1, -66.0]], gates: [[20.6, -18.6]] },
];
/** paving of the precinct (frame C ring) */
export const COURT_C = [[-23.4, -66.0], [20.1, -66.0], [20.7, -12.6], [21.6, -12.2], [21.6, 2.0], [9.0, 13.5], [9.0, 17.4], [-15.9, 17.4], [-16.0, 19.1], [-22.9, 21.7], [-28.0, 24.0], [-28.0, -21.0], [-23.2, -21.2], [-23.4, -28.7]];
export const courtWorld = () => COURT_C.map(([a, b]) => w(a, b));

function pierCath(Q, M) {                                                   // pink stucco pier 0.75 m, 2.5 m: granite foot, shaft with white bands, white cornice, zinc cap
  Q.box(M.graniteRed, -0.375, 0.375, 0, 0.65, -0.375, 0.375, 'b', 1);
  Q.box(M.pierPink, -0.345, 0.345, 0.65, 2.2, -0.345, 0.345, 'b', 1);
  for (const y of [0.92, 1.4, 1.88]) Q.box(M.white, -0.36, 0.36, y, y + 0.05, -0.36, 0.36, '', 1);
  Q.box(M.white, -0.42, 0.42, 2.2, 2.38, -0.42, 0.42, 'b', 1);
  Q.box(M.zinc, -0.46, 0.46, 2.38, 2.5, -0.46, 0.46, 'b', 1);
}

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, cover = coverFn(ctx);
  // ---- fences
  const runs = RUNS_C.map((r) => ({ pts: r.pts.map(([a, b]) => w(a, b)), gates: (r.gates || []).map(([a, b]) => { const p = w(a, b); return { x: p[0], z: p[1], half: 2.1 }; }) }));
  fenceRuns(K, runs, { name: 'cathedral', pitch: 3.4, gateHalf: 2.1, pier: pierCath, gatePier: pierCath, panelMat: M.fenceCath, plinthMat: M.graniteGrey, plinthH: 0.9, plinthT: 0.45, panelY0: 0.9, panelY1: 2.3, panelTile: 3.0, pierW: 0.8, colH: 2.3 });
  // ---- brown stucco wall at the north end (Three Hierarchs yard) between the two fences
  // n4spb (the owner's rule: every wall breaks, docs/AREAS.md 13.7; the pattern of landmarksKirova/eryard.js): the free-standing wall is a row of 4.4 m breakable bays (body + white cap as stretched parts, a thin collider,
  // one anchored knock record per bay: a car breaks a bay off at the foot, the gap is passable)
  { const a = FC.W(-23.4, -66.0), b = FC.W(20.1, -66.0);
    knockBays(ctx, { name: 'lmAnd-north-wall', bays: splitBays(a.x, a.z, b.x, b.z, 4.4, { y: 0 }), far: 300,
      parts: [{ geo: unitBox(0, 2.5, -0.2, 0.2, { uLen: 4.4, uvs: 3 }), mat: M.stuccoBrown, name: 'wall', stretch: true },
        { geo: unitBox(2.5, 2.62, -0.28, 0.28, { uLen: 4.4, uvs: 3 }), mat: M.white, name: 'cap', stretch: true, inset: -0.03 }],
      collider: { y0: 0, y1: 2.6, thick: 0.4, e0: 0, e1: 0 },
      rec: () => ({ kind: 'fence', mass: 1400, h: 2.6, anchored: 28, hitK: 0.5, metal: false, minDv: 0 }) }); }
  // ---- herringbone clinker paving of the court
  const ring = courtWorld();
  K.svc.pavingTris = fillPolyClipped(P, M.herring, ring, 0.05, (x, z) => (L.insideBuilding(x, z, 0.0) && !inCourtOpen(x, z) ? 1 : cover(x, z)), { margin: 0.25, maxEdge: 4, tile: 2 });
  // ---- lamps: four black lantern lamps at the portals
  const lampGeo = partsGeos((Q) => O.lanternLamp(Q, M, 3.3)), lm = [], lmIt = [];
  for (const [a, b] of [[-26.5, -6], [-26.5, 7], [0, 16.0], [-12, 16.0]]) {
    const p = FC.W(a, b); if (cover(p.x, p.z) > -1.0) continue;
    lm.push({ x: p.x, y: 0, z: p.z, rotY: 0 }); lmIt.push(ph.addCylinder(p.x, p.z, 0.2, 0, 3.4)); K.svc.lamps.push({ x: p.x, z: p.z, h: 3.3 });
  }
  K.extraTris += knockFurniture(ctx, 'lmAnd-lamps-cath', lampGeo, lm, lmIt, FURNITURE_REC.lamp(3.3), 300);      // knock records (docs/AREAS.md 13.7)
}
// the paving is also laid under the buildings (hidden): keep every triangle except the ones on asphalt
const inCourtOpen = () => true;
