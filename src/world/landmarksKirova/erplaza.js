// landmarksKirova/erplaza.js - the PLAZA and the furniture of the Erarta forecourt (frame FE: q' along the front, r' outward), docs/research/erarta-detail.md 2.5, photos c01 (the pale concrete apron), a03 / kv374
// (benches), a16 / a19.
//   paving   the stair apron and the gap between the first and the second lawn strip (q' -6.3 .. 6.6, r' 6.6 .. 24.3): smooth pale grey-beige concrete slabs 1 x 1 m `#bdb6aa` (the 2016 state: the 2009 plaza was
//            dark asphalt), a decal of the decal-tile kind laid 5 cm above the ground and clipped at the real asphalt (net.cover); PAVED_RINGS of groups.js keeps tufts and trunks off it
//   benches  the six OSM benches n12003282936 .. 41 at q' 23.1 / 28.1, r' 14 .. 21 beside the cross path: pink-red slat seats on curved grey steel frames, turned to the path (kv374), published as svc.benches
//            (props then does not draw the OSM bench a second time)
import { FE } from './frame.js';
import { FURNITURE } from '../data/city.js';
import { fillPolyClipped, coverFn } from './surfaces.js';
import * as L from '../layout.js';
import { partsGeos } from './inst.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';      // n4spb (docs/AREAS.md 13, 15.v): benches, the payment terminal and the bike rack are knock records

/** ring of the plaza in plan coordinates of FE: [q', r'] (also PAVED_RINGS of groups.js, world metres) */
export const PLAZA_FE = [[-9.6, 6.6], [9.6, 6.6], [9.6, 11.8], [6.6, 11.8], [6.6, 24.3], [-6.3, 24.3], [-6.3, 11.8], [-9.6, 11.8]];
const BENCH_IDS = ['n12003282936', 'n12003282937', 'n12003282938', 'n12003282939', 'n12003282940', 'n12003282941'];

function bench(P, M, x, z, rot) {
  const seat = M.col('#a0565c'), steel = M.col('#6a6d70');
  P.push(x, 0, z, rot);
  for (const sx of [-0.78, 0.78]) {                                                      // two curved steel frames: foot, leg, a curve up to the seat, the back post
    P.box(steel, sx - 0.025, sx + 0.025, 0, 0.04, -0.26, 0.26, 'b', 1);
    P.box(steel, sx - 0.025, sx + 0.025, 0.04, 0.4, 0.16, 0.2, '', 1);
    P.box(steel, sx - 0.025, sx + 0.025, 0.36, 0.42, -0.24, 0.2, '', 1);
    P.box(steel, sx - 0.025, sx + 0.025, 0.04, 0.9, -0.26, -0.22, '', 1);
    P.box(steel, sx - 0.025, sx + 0.025, 0.7, 0.8, -0.3, -0.22, '', 1);
  }
  for (let i = 0; i < 4; i++) P.box(seat, -0.9, 0.9, 0.42, 0.46, -0.22 + i * 0.11, -0.22 + i * 0.11 + 0.09, 'b', 0.5);           // seat slats
  for (let i = 0; i < 3; i++) P.box(seat, -0.9, 0.9, 0.62 + i * 0.11, 0.62 + i * 0.11 + 0.08, -0.3, -0.27, 'b', 0.5);             // back slats
  P.pop();
}

/** Attributed fixtures: terminal from mapped n12026211016; entrance rack
 * confirmed by erarta.com/en/t-visit/ (2026-10-12). Exact rack shape/offset
 * is an estimate: plain grey steel hoops, safely beside the approach. */
function visitorFixtures(K, cover) {
  const { P, M, ctx } = K;
  const clear = (q, r, w, d) => [[0, 0], [-1, -1], [1, -1], [1, 1], [-1, 1]].every(([a, b]) => {
    const p = FE.W(q + a * w / 2, r + b * d / 2);
    return cover(p.x, p.z) < -0.5 && !L.insideBuilding(p.x, p.z, 0.1);
  });
  let terminalCount = 0, rackCount = 0;
  const terminal = FURNITURE.find((f) => f.id === 'n12026211016');
  if (terminal) {
    const { a: q, b: r } = FE.M(terminal.x, terminal.z);
    if (clear(q, r, 0.58, 0.5)) {
      const geo = partsGeos((Q) => {      // (the payment terminal at the origin; knockable since the areas round: lib/knock-furniture.js)
        const casing = M.col('#657480'), dark = M.col('#303a42'), steel = M.col('#acafb0');
        Q.box(dark, -0.24, 0.24, 0, 0.12, -0.19, 0.19, 'b', 1);
        Q.box(casing, -0.25, 0.25, 0.12, 1.5, -0.2, 0.2, 'b', 1);
        Q.box(steel, -0.27, 0.27, 1.5, 1.54, -0.22, 0.22, 'b', 1);
        Q.box(dark, -0.18, 0.18, 0.85, 1.32, 0.2, 0.235, 'k', 1);
        Q.box(M.col('#839fa9'), -0.125, 0.125, 1.06, 1.24, 0.235, 0.26, 'k', 1);
        for (const x of [-0.1, 0, 0.1]) Q.box(steel, x - 0.025, x + 0.025, 0.93, 0.98, 0.235, 0.26, 'k', 1);
        Q.box(dark, -0.15, 0.15, 0.65, 0.71, 0.2, 0.235, 'k', 1);
        Q.box(steel, -0.15, 0.15, 0.63, 0.65, 0.2, 0.28, 'k', 1);
      });
      K.extraTris += knockFurniture(ctx, 'lmKir-terminal', geo, [{ x: terminal.x, y: 0, z: terminal.z, rotY: FE.rot }], [ctx.physics.addBox(terminal.x, terminal.z, 0.54, 0.44, FE.rot, 0, 1.54)], { kind: 'cabinet', mass: 120, h: 1.54, w: 0.54, d: 0.44, anchored: 20, hitK: 0.35, metal: true, minDv: 0 }, 170);
      K.svc.terminals ||= []; K.svc.terminals.push({ id: terminal.id, x: terminal.x, z: terminal.z, kind: 'parking-payment' });
      terminalCount++;
    }
  }
  const q = 11, r = 6.8, w = 2.4, d = 0.6;
  if (clear(q, r, w, d)) {
    const p = FE.W(q, r), steel = M.col('#858b8e');
    const rackGeo = partsGeos((Q) => {      // the three hoops at the origin of frame FE (x along the front); ONE knock record for the rack (its three colliders are the items)
      for (const x of [-0.9, 0, 0.9]) {
        Q.cyl(steel, [x - 0.3, 0, 0], [x - 0.3, 0.65, 0], 0.027, 0.027, 6);
        Q.cyl(steel, [x + 0.3, 0, 0], [x + 0.3, 0.65, 0], 0.027, 0.027, 6);
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * Math.PI, b = (i + 1) / 6 * Math.PI;
          Q.cyl(steel, [x + 0.3 * Math.cos(a), 0.65 + 0.3 * Math.sin(a), 0], [x + 0.3 * Math.cos(b), 0.65 + 0.3 * Math.sin(b), 0], 0.027, 0.027, 6, false);
        }
      }
    });
    const rackItems = [-0.9, 0, 0.9].map((x) => { const wp = FE.W(q + x, r); return ctx.physics.addBox(wp.x, wp.z, 0.64, 0.1, FE.rot, 0, 0.95); });
    K.extraTris += knockFurniture(ctx, 'lmKir-rack', rackGeo, [{ x: p.x, y: 0, z: p.z, rotY: FE.rot }], [rackItems], { kind: 'rack', mass: 75, h: 0.95, w: 2.7, d: 0.4, anchored: 8, hitK: 0.1, metal: true, minDv: 0 }, 170);
    K.svc.bikeRacks ||= []; K.svc.bikeRacks.push({ id: 'erarta-entrance-rack', x: p.x, z: p.z, rotY: FE.rot, spaces: 6 });
    rackCount++;
  }
  return { erartaParkingTerminals: terminalCount, erartaBikeRacks: rackCount };
}

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, cover = coverFn(ctx);
  // the paving: a decal of the slab tile (2 m tile, world uv like the pavement of streets), clipped at the asphalt
  const ring = PLAZA_FE.map(([q, r]) => { const p = FE.W(q, r); return [p.x, p.z]; });
  fillPolyClipped(P, M.ePave, ring, 0.05, cover, { margin: 0.3, maxEdge: 4, tile: 2.0, uvf: (x, z) => { const m = FE.M(x, z); return [m.a / 2, m.b / 2]; } });      // the joints run along the facade
  // the six benches beside the cross path (q' 25.5)
  let nb = 0;
  const benchSpots = [], benchItems = [];
  for (const id of BENCH_IDS) {
    const f = FURNITURE.find((q) => q.id === id); if (!f) continue;
    const m = FE.M(f.x, f.z), rot = FE.rotToward(m.a < 25.5 ? 1 : -1, 0);
    if (cover(f.x, f.z) > -0.5) continue;
    benchSpots.push({ x: f.x, y: 0, z: f.z, rotY: rot }); benchItems.push(ph.addBox(f.x, f.z, 1.9, 0.6, rot, 0, 0.9));
    K.svc.benches.push({ x: f.x, z: f.z, rotY: rot }); nb++;
  }
  K.extraTris += knockFurniture(ctx, 'lmKir-er-benches', partsGeos((Q) => bench(Q, M, 0, 0, 0)), benchSpots, benchItems, { ...FURNITURE_REC.bench, w: 1.9 }, 200);
  const S = (ctx.services.landmarks ||= {}); S.benches = (S.benches || []).concat((nb ? K.svc.benches.slice(-nb) : []));
  K.svc.stats = { ...(K.svc.stats || {}), erartaBenches: nb, ...visitorFixtures(K, cover) };
}
