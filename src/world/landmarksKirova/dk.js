// landmarksKirova/dk.js - the KIROV PALACE OF CULTURE: the volumes of the plan, the generic walls / roofs / parapets of every exposed side, the colliders and the orchestration of the detail files
// (dkfront.js: podium, upper blocks with pilasters, pavilions with the niches, west end block, gallery, white pavilion; dkparts.js: portal, tower, small roof details; dkrear.js: west arm, cinema, annex).
// Dossier docs/research/kirova.md sections 4-8 (heights, plan, front elevation), photos refs/kirova dk01 dk03 dk14 dk15 dk17 dk27 dk28 dk37.  Plan frame FD (frame.js): r ENE along the front, q NNW into the
// building, local x = r, local z = -q (the front faces local +z).
// VOLUMES is the partition of the baked ring (w45966107) into boxes (authored in plan coordinates r, q): every box is drawn once (vol.js); the faces that touch a neighbour of the same or greater height are not
// drawn, so the walls of the whole outline are closed without double faces (docs/rules/FACADE-INTEGRITY.md).  The audit tools/landmarksKirova-plan.mjs compares the union of VOLUMES with the baked ring.
// Side keys of a volume: f = front (q0, facing -q = local +z), k = rear (q1), l = west (r0), r = east (r1).  A skin { mat, tu, tv, v0 } textures a side; null = drawn by a detail file or hidden.
import * as L from '../layout.js';
import { FD, FRONT as F, DKH as H, ringOf } from './frame.js';
import { addPolyColliders } from '../lib/massing.js';
import { drawVolume } from './vol.js';

const WALL = { mat: 'wall', tu: 4, tv: 4 }, REAR = { mat: 'rear', tu: 2.9, tv: 3.7 }, RIB = { mat: 'ribbon', tu: 6, tv: 3.6 }, STRIP = { mat: 'strip', tu: 5, tv: 8, v0: -9.5 / 8 };
const PALE = { mat: 'pale', tu: 4, tv: 4 }, WHITE = { mat: 'white', tu: 4, tv: 4 }, ARM = { mat: 'arm', tu: 6, tv: 10 }, PORT = { mat: 'portalStone', tu: 3, tv: 3 }, CONC = { mat: 'concrete', tu: 4, tv: 4 };

/** the partition of the footprint (frame FD): r [r0, r1], q [q0, q1], h = top, y0 = base (stacked volumes), sk = skins */
export const VOLUMES = [
  { id: 'v1', r: [-71.2, -52.65], q: [-32.4, -8.0], h: H.v1, sk: { f: null, k: REAR, l: RIB, r: WALL } },
  { id: 'w1p', r: [-52.65, -25.7], q: [-32.4, -29.9], h: H.podium, sk: { f: null, k: null, l: WALL, r: WALL } },
  { id: 'w1b', r: [-52.65, -25.7], q: [-29.9, -8.0], h: H.wing, sk: { f: null, k: REAR, l: WALL, r: WALL } },
  { id: 'pl', r: [-25.7, -10.2], q: [-32.4, -8.0], h: H.pavilion, sk: { f: null, k: REAR, l: WALL, r: WALL } },
  { id: 'cbp', r: [-10.2, 13.2], q: [-32.2, -29.7], h: H.podium, sk: { f: null, k: null, l: WALL, r: WALL } },
  { id: 'cbb', r: [-10.2, 13.2], q: [-29.7, -8.0], h: H.wing, sk: { f: null, k: REAR, l: WALL, r: WALL } },
  { id: 'portal', r: [F.portal[0], F.portal[1]], q: [F.portalQ, -32.2], h: H.portal, sk: { f: null, k: null, l: PORT, r: PORT } },
  { id: 'pr', r: [13.2, 30.2], q: [-32.1, -8.0], h: H.pavilion, sk: { f: null, k: REAR, l: WALL, r: WALL } },
  { id: 'wep', r: [30.2, 56.4], q: [-32.1, -29.6], h: H.podium, sk: { f: null, k: null, l: WALL, r: WALL } },
  { id: 'web', r: [30.2, 56.4], q: [-29.6, -8.0], h: H.wing, sk: { f: null, k: REAR, l: WALL, r: WALL } },
  { id: 'gal', r: [56.4, 103.5], q: [F.galleryQ, -29.5], h: H.gallery, sk: { f: null, k: null, l: PALE, r: PALE } },
  { id: 'strip', r: [56.4, 99.7], q: [-29.5, -8.0], h: H.strip, sk: { f: null, k: null, l: STRIP, r: null } },
  { id: 'strip2', r: [99.7, 103.5], q: [-29.5, -8.7], h: H.strip, sk: { f: null, k: REAR, l: null, r: null } },
  { id: 'white', r: [F.white[0], F.white[1]], q: [F.whiteQ, F.galleryQ], h: H.white, sk: { f: null, k: null, l: WHITE, r: WHITE } },
  { id: 'end', r: [103.5, 129.0], q: [F.endQ, -8.7], h: H.strip, sk: { f: null, k: REAR, l: STRIP, r: STRIP } },
  { id: 'ew1', r: [59.7, 99.6], q: [-8.0, 13.1], h: H.eastWing, sk: { f: null, k: REAR, l: REAR, r: REAR } },
  { id: 'ew2', r: [59.7, 105.0], q: [13.1, 40.4], h: H.eastWing, sk: { f: REAR, k: REAR, l: REAR, r: REAR } },
  { id: 'ww1', r: [-71.2, -52.65], q: [-8.0, 52.8], h: H.wing, sk: { f: null, k: null, l: RIB, r: REAR } },
  { id: 'ww2a', r: [-77.8, -62.05], q: [52.8, 89.0], h: 21.0, sk: { f: WALL, k: REAR, l: RIB, r: REAR } },
  { id: 'ww2b', r: [-62.05, -52.65], q: [52.8, 92.0], h: 21.0, sk: { f: null, k: REAR, l: null, r: REAR } },
  { id: 'arma', r: [-140.5, -124.7], q: [14.3, 36.3], h: H.arm, sk: { f: ARM, k: ARM, l: ARM, r: ARM } },
  { id: 'armb', r: [-124.7, -100.8], q: [19.7, 36.3], h: H.arm, sk: { f: ARM, k: ARM, l: ARM, r: ARM } },
  { id: 'armc', r: [-100.8, -71.2], q: [19.7, 30.0], h: H.arm, sk: { f: ARM, k: ARM, l: ARM, r: ARM } },
  // stacked: the tower on the strip and the pale concrete box beside it (dkparts.js draws the window columns and the drum)
  // noRoof: the stepped cornice box of dkparts.js tower() already closes the top at y 36.0 (its top face and a volume cap there were coplanar: z-fighting at 120 m, zfight run of the review)
  { id: 'tower', r: [62.0, 73.0], q: [-22.0, -8.0], h: H.tower, y0: H.strip, noRoof: true, sk: { f: null, k: null, l: WALL, r: null } },
  { id: 'box', r: [56.4, 62.0], q: [-20.0, -10.0], h: H.box, y0: H.strip, sk: { f: CONC, k: CONC, l: CONC, r: CONC } },
];
/** the same volumes in the local frame of the pushed FD group (x = r, z = -q) for vol.js */
export const VOL = VOLUMES.map((v) => ({ ...v, x: v.r, z: [-v.q[1], -v.q[0]] }));

export async function build(K) {
  const { ctx } = K, { P } = K;
  const errs = [];
  const stage = (name, fn) => { try { return fn(); } catch (e) { console.error(`[landmarksKirova] dk/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const fr = await import('./dkfront.js'), pt = await import('./dkparts.js'), rr = await import('./dkrear.js'), pv = await import('./dkpave.js'), yd = await import('./dkyard.js');
  FD.push(P);
  stage('volumes', () => { for (const v of VOL) drawVolume(K, VOL, v, { parapet: true }); });
  stage('fronts', () => fr.build(K));
  stage('parts', () => pt.build(K));
  P.pop();
  stage('pave', () => pv.build(K));                                   // the slab pavement of the front (world coordinates: outside the pushed frame)
  stage('yard', () => yd.build(K));                                   // the courtyard ground: asphalt, worn paths, grass patches, young trees
  stage('rear', () => rr.build(K));                                   // the cinema / annex use the world frame, the tower and the balconies push FD themselves
  stage('colliders', () => {
    const o = ringOf('w45966107');
    if (o) addPolyColliders(ctx, { o: Array.from(o), h: [] }, -0.3, 40, 0.9);
    rr.colliders && rr.colliders(K);
  });
  stage('services', () => {
    const sv = K.svc;
    const PC = (F.portal[0] + F.portal[1]) / 2;
    // entrances: the portal doors (world positions of the door centres), the white pavilion doors (exterior only: closed)
    for (const r of [PC - 5.25, PC, PC + 5.25]) { const p = FD.W(r, F.portalQ); sv.entrances.push({ id: 'dk-portal', x: p.x, z: p.z, rotY: FD.rot, closed: true, name: 'Дворец культуры им. С. М. Кирова' }); }
    for (const r of [111.2, 114.2]) { const p = FD.W(r, F.whiteQ); sv.entrances.push({ id: 'dk-white', x: p.x, z: p.z, rotY: FD.rot, closed: true, name: 'столовая' }); }
    const c1 = FD.W(PC, -42), c2 = FD.W(PC - 1, -78), c3 = FD.W(-60, -75);
    sv.crowd.push({ id: 'dk-portal-apron', kind: 'photo', x: c1.x, z: c1.z, r: 9, n: 6 });
    const yawTo = (a, b) => L.yawToward(a.x, a.z, b.x, b.z);
    const t0 = FD.W(PC, -35.5);
    sv.photoSpots.push({ x: c2.x, z: c2.z, yaw: yawTo(c2, t0), pitch: 8, name: 'Дворец культуры им. Кирова: фасад на оси 26-27 линии' });
    sv.photoSpots.push({ x: c3.x, z: c3.z, yaw: yawTo(c3, FD.W(-20, -32)), pitch: 8, name: 'Дворец культуры им. Кирова: с юго-запада' });
    const mc = FD.W(0, -20);
    sv.monuments.push({ id: 'w45966107', name: 'Дворец культуры им. С. М. Кирова', x: mc.x, z: mc.z, h: H.pavilion });
  });
  if (errs.length) throw new Error(errs.join('\n'));
}
