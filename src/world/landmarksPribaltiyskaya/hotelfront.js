// landmarksPribaltiyskaya/hotelfront.js - the FORECOURT of the hotel (dossier 4.3, 4.4, 4.5, [C8] [C9]): the red granite PLATFORM at +3.2 m (the whole base outline w17559880 minus the hull ring: terrace paving with dark
// diagonal bands), the 3.2 m plinth / retaining walls (dark red granite) with the two bronze masks "Нептун" and "Наяда", the 32.3 m STAIR (20 risers of 0.16 m, cheek walls), the entrance canopy over the drive, the U-shaped
// drive with its white hemispherical bollards, the ball-lamp posts along the stair top, the perforated column lamps, the box benches and the three kerbed lawn beds of the plaza, the plaza slab field, the two groves of young spruces.
// The vehicle ramps of the OSM service ways (w156992580, w284127645) are NOT drawn: the solid platform stands where they run (request in docs/research/vo-requests-landmarksPribaltiyskaya.md).
// Frame HF (frame.js): +z = out of the main facade (ENE), the stair axis is x = 0 (centre x 2.25), the plaza lies at z > 12.  Colliders: walk boxes (top 3.2, solid column from the ground) over the platform, stair steps, kerb boxes.
import * as THREE from 'three';
import { HF, Y, RING, OUTER, STAIR, WALL_N, WALL_S, CANOPY, coverFn } from './frame.js';
import { edgesOf, wallPart, boxF, walkF, walkStrip } from './ring.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';      // n4spb (docs/AREAS.md 13, 15.v): benches, planters and lamps are knock records
import { plantTrees } from './trees.js';
import { ribbon } from './surfaces.js';

const TERR = Y.terr;
const DRIVE = [[26.0, -19.3], [23.8, -29.3], [20.6, -37.5], [13.1, -40.8], [1.3, -42.8], [-8.8, -42.5], [-18.1, -37.6], [-21.8, -19.3]];
const PLANTERS = [[-24, 16.5], [27.5, 16.5]], TERRACE_BENCHES = [[-9, -24], [9, -24], [-9, -34], [9, -34]], COLUMN_LAMPS = [[-18.5, 13.5], [-24.5, 13.2], [24.5, 13.5], [30.5, 13.2]], TERRACE_LAMPS = [[-11.5, -27], [11.5, -27], [-11.5, -37], [11.5, -37]];
const BED_Z = [26.6, 46.7, 66.2];
/** z of a retaining-wall polyline at x */
const wallZ = (pl, x) => { for (let i = 0; i + 1 < pl.length; i++) { const a = pl[i], b = pl[i + 1]; if (x >= Math.min(a[0], b[0]) && x <= Math.max(a[0], b[0])) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return pl[pl.length - 1][1]; };
/** unit normal of the wall segment a -> b that points to +z (toward the plaza) */
const wallNormal = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); return dx > 0 ? [-dz / l, dx / l] : [dz / l, -dx / l]; };

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksPribaltiyskaya] front/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = K.P, M = K.M;
  P.push(HF.x, 0, HF.z, HF.rot);
  try {
    stage('platform', () => platform(P, M));
    stage('stair', () => stair(P, M));
    stage('masks', () => masks(P, M));
    stage('canopy', () => canopy(P, M));
    stage('plaza', () => plaza(P, M));
    stage('furniture', () => furniture(K));
  } finally { P.pop(); }
  stage('colliders', () => colliders(K));
  stage('trees', () => trees(K));
  stage('services', () => services(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the platform top (3.2 m) and the plinth walls
function platform(P, M) {
  P.cap(M.terrace, OUTER, TERR, true, 6, [RING]);
  // the plinth / retaining walls on every edge of the outer ring except the open stair-top edge (the first one): polished dark red granite blocks 1.2 x 0.8 m
  for (const e of edgesOf(OUTER)) {
    if (e.i === 0) continue;
    wallPart(P, M.plinth, e, 0, e.len, 0, TERR, 1 / 2.4, 1 / 1.6);
  }
}

// ------------------------------------------------------------------------------------------------ the stair: 20 risers of 0.16 m, treads 0.55 m, dark red granite; cheek walls rising 0.9 m over the treads
function stair(P, M) {
  const { x0, x1, zBot, n } = STAIR, tread = 0.55, rise = 0.16;
  for (let k = 0; k < n; k++) {
    const zf = zBot - k * tread, zb = zf - tread, y1 = rise * (k + 1);
    P.quad(M.graniteRed, [x0, y1, zf], [x1, y1, zf], [x1, y1, zb], [x0, y1, zb], [0, 1, 0], [[x0 / 3, zf / 3], [x1 / 3, zf / 3], [x1 / 3, zb / 3], [x0 / 3, zb / 3]]);        // tread
    P.quad(M.graniteDark, [x0, y1 - rise, zf], [x1, y1 - rise, zf], [x1, y1, zf], [x0, y1, zf], [0, 0, 1], [[x0 / 3, 0], [x1 / 3, 0], [x1 / 3, 0.1], [x0 / 3, 0.1]]);                  // riser
    if (zf > 7.4 + 0.05) for (const [xa, xb, skip] of [[x1, x1 + 0.6, 'kl'], [x0 - 0.6, x0, 'kr']]) P.box(M.graniteCap, xa, xb, 0, y1 + 0.9, Math.max(zb, 7.4), zf, skip, 2);        // cheek blocks (the platform wall covers z < 7.4)
  }
}

// ------------------------------------------------------------------------------------------------ the two bronze masks (relief heads d 2.0 m) on the retaining walls, y 1.3 .. 3.3 (Нептун north, Наяда south)
function masks(P, M) {
  const ball = (m, c, r, sx, sy, sz) => { const g = new THREE.SphereGeometry(r, 10, 7); P.geo(m, g, c[0], c[1], c[2], 0, 0, 0, sx, sy, sz); g.dispose(); };
  for (const [x, neptune] of [[21, true], [-17, false]]) {       // review 2026-10-09: photos 08 / 01 put each mask 2-5 m outside the stair edge (x +21 / -17), not at +-32 as the dossier's first estimate
    const pl = x > 0 ? WALL_N : WALL_S, seg = x > 0 ? 0 : 0, a = pl[seg], b = pl[seg + 1], nrm = wallNormal(a, b), zw = wallZ(pl, x);
    P.push(x, 2.3, zw + 0.03, Math.atan2(nrm[0], nrm[1]));
    P.cyl(M.graniteCap, [0, 0, -0.02], [0, 0, 0.05], 1.14, 1.14, 24, true);                       // the rim ring
    P.cyl(M.maskField, [0, 0, 0], [0, 0, 0.16], 1.0, 1.0, 24, true);                               // the field (an axis along the local z)
    ball(M.maskFace, [0, 0.05, 0.2], 0.62, 1, 1.12, 0.5);                                           // the face
    ball(M.maskFace, [0, -0.02, 0.42], 0.1, 0.9, 1.6, 1.1);                                         // nose
    for (const s of [-1, 1]) { ball(M.bronzeMask, [s * 0.24, 0.2, 0.37], 0.09, 1.4, 0.6, 0.6); ball(M.maskFace, [s * 0.25, 0.28, 0.4], 0.08, 1.9, 0.4, 0.6); }      // eye sockets, brow ridges
    ball(M.maskFace, [0, -0.28, 0.4], 0.12, 1.7, 0.5, 0.6);                                         // lips
    if (neptune) {                                                                                 // a wavy beard and wild hair
      ball(M.maskFace, [0, -0.5, 0.33], 0.3, 1.15, 0.9, 0.55); ball(M.maskFace, [0, -0.78, 0.28], 0.2, 0.9, 1.0, 0.5);        // review: a short two-lobed beard (the long single blob read as a foot)
      for (let i = 0; i < 11; i++) { const t = (i / 10 - 0.5) * 4.0; ball(M.maskFace, [Math.sin(t) * 0.8, 0.05 + Math.cos(t) * 0.74, 0.2], 0.15, 1, 1, 0.8); }          // a mane of locks round the head
    } else {                                                                                       // flowing locks
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) ball(M.maskFace, [s * (0.62 + 0.05 * i), 0.3 - i * 0.2, 0.18], 0.16, 0.9, 1.3, 0.8);
      ball(M.maskFace, [0, 0.62, 0.22], 0.2, 2.2, 0.8, 0.8);
    }
    P.pop();
  }
}

// ------------------------------------------------------------------------------------------------ the entrance canopy: a dark brown flat box ~24 m wide over the drive, on four rectangular piers, a navy fascia plate
function canopy(P, M) {
  const c = CANOPY, W = c.x1 - c.x0;
  P.box(M.attic, c.x0, c.x1, c.y0, c.y1, c.z0, c.z1, '', 2);
  P.quad(M.plate, [c.x0 + 6, c.y0 + 0.2, c.z1 + 0.04], [c.x1 - 6, c.y0 + 0.2, c.z1 + 0.04], [c.x1 - 6, c.y0 + 0.75, c.z1 + 0.04], [c.x0 + 6, c.y0 + 0.75, c.z1 + 0.04], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  for (const x of [c.x0 + 0.5, c.x0 + W / 3, c.x1 - W / 3, c.x1 - 0.5]) P.box(M.graniteTop, x - 0.3, x + 0.3, TERR, c.y0, c.z1 - 1.2, c.z1 - 0.6, '', 2);
  // the asphalt drive: a U loop from the north ramp end to the south one, 6.5 m wide, 3 cm over the platform
  ribbon(P, M.asphalt, DRIVE, 6.5, TERR + 0.03, { tile: 4, seg: 2 });
}

// ------------------------------------------------------------------------------------------------ the plaza in front: slab field pieces (the grove squares stay clear), turf under the groves, three kerbed lawn beds
function plaza(P, M) {
  const y = 0.06, r = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const wl = (x) => wallZ(WALL_S, x) + 0.4, wr = (x) => wallZ(WALL_N, x) + 0.4;
  const pieces = [
    [[-31, wl(-31)], [-14.9, wl(-14.9)], [-14.9, 14.5], [-31, 14.5]], [[19.5, wr(19.5)], [31, wr(31)], [31, 14.5], [19.5, 14.5]], r(-14.9, 19.5, 12.0, 14.5),
    r(-20.5, 17.9, 14.5, 88), r(-31, -20.5, 43, 88), r(17.9, 31, 43, 88),                    // the south grove moved outward to x -38 .. -20.5 (review: photos 08 / 01 show the stair side clear of trees); slab and turf stop at x -31 (a 4 m service way crosses x -38 .. -31, z 31 .. 40)
  ];
  for (const ring of pieces) P.cap(M.plaza, ring, y, true, 8);
  for (const g of [[17.9, 37], [-31, -20.5]]) P.cap(M.turf, r(g[0], g[1], 14.5, 43), 0.05, true, 8);
  // three lawn beds 8.7 x 8.7 m: granite kerb 0.45 m high x 0.3 m, turf 0.08 m below the kerb top
  for (const zc of BED_Z) {
    const h = 4.35, t = 0.3, k = 0.45;
    P.box(M.kerb, -h, h, 0, k, zc - h, zc - h + t, '', 2); P.box(M.kerb, -h, h, 0, k, zc + h - t, zc + h, '', 2);
    P.box(M.kerb, -h, -h + t, 0, k, zc - h + t, zc + h - t, '', 2); P.box(M.kerb, h - t, h, 0, k, zc - h + t, zc + h - t, '', 2);
    P.cap(M.turf, r(-h + t, h - t, zc - h + t, zc + h - t), k - 0.08, true, 4);
  }
}

// ------------------------------------------------------------------------------------------------ furniture: box benches, planters, lamps, bollards (instanced where repeated)
function furniture(K) {
  const P = K.P, M = K.M, ctx = K.ctx, S = K.svc, rot = HF.rot, ph = ctx.physics;
  // n4spb (docs/AREAS.md 13, 15.v, docs/gdm-P.md): the benches, the planters and every lamp of the forecourt are KNOCK RECORDS (knockFurniture): each is drawn as its own geometry at the origin of a placement
  // (spot = the frame HF turned by HF.rot, y = the foot level), its collider is the source's, the handle goes to the record.
  const spot = (x, z, y = 0) => { const p = HF.W(x, z); return { x: p.x, y, z: p.z, rotY: rot }; };
  // box benches: granite box 5.5 x 1.8 x 0.5 m with a red-brown steel slat frame on top; rows of three at z = 34, 54, 74
  { const spots = [], items = [];
    for (const z of [34, 54, 74]) for (const x of [-10, 0, 10]) {
      spots.push(spot(x, z)); items.push(boxF(ph, HF, x, z, 5.5, 1.8, 0, 0.9));
      const p = HF.W(x, z); S.benches.push({ x: p.x, z: p.z, rotY: rot, len: 5.5 });
    }
    const geo = partsGeos((Q) => {
      Q.box(M.kerb, -2.75, 2.75, 0, 0.5, -0.9, 0.9, '', 2);
      for (const dz of [-0.85, -0.45, 0, 0.45, 0.85]) Q.box(M.benchRed, -2.7, 2.7, 0.5, 0.58, dz - 0.07, dz + 0.07, '', 1);
      for (const sx of [-1, 1]) Q.box(M.benchRed, sx * 2.7 - 0.05, sx * 2.7 + 0.05, 0.5, 0.9, -0.9, 0.9, '', 1);
    });
    K.extraTris += knockFurniture(ctx, 'lmprib-benches', geo, spots, items, { ...FURNITURE_REC.bench, mass: 700, h: 0.9, w: 5.5, d: 1.8, hitK: 0.3 }, 220);        // a granite block: heavy, it shoves a car
  }
  // round granite planters d 3.2 m at the stair foot corners
  { const spots = [], items = [];
    for (const [x, z] of PLANTERS) { spots.push(spot(x, z)); const p = HF.W(x, z); items.push(ph.addCylinder(p.x, p.z, 1.6, 0, 0.7)); }
    const geo = partsGeos((Q) => {
      Q.cyl(M.kerb, [0, 0, 0], [0, 0.6, 0], 1.6, 1.6, 20, true);
      Q.cap(M.turf, Array.from({ length: 14 }, (_, i) => [Math.cos(i / 14 * Math.PI * 2) * 1.35, Math.sin(i / 14 * Math.PI * 2) * 1.35]), 0.62, true, 3);
    });
    K.extraTris += knockFurniture(ctx, 'lmprib-planters', geo, spots, items, { kind: 'planter', mass: 1800, h: 0.7, r: 1.6, anchored: 28, hitK: 0.35 }, 220);
  }
  // terrace park benches (white concrete end frames, grey-brown slats), foot level TERR
  { const spots = [], items = [];
    for (const [x, z] of TERRACE_BENCHES) {
      spots.push(spot(x, z, TERR)); items.push(boxF(ph, HF, x, z, 1.8, 0.5, TERR, TERR + 0.5));
      const p = HF.W(x, z); S.benches.push({ x: p.x, z: p.z, rotY: rot, len: 1.8 });
    }
    const geo = partsGeos((Q) => {
      Q.box(M.white, -0.85, -0.7, 0, 0.45, -0.25, 0.25, '', 1); Q.box(M.white, 0.7, 0.85, 0, 0.45, -0.25, 0.25, '', 1);
      Q.box(M.slats, -0.9, 0.9, 0.45, 0.52, -0.25, 0.25, '', 1); Q.box(M.slats, -0.9, 0.9, 0.52, 0.95, 0.2, 0.25, '', 1);
    });
    K.extraTris += knockFurniture(ctx, 'lmprib-terrace-benches', geo, spots, items, { ...FURNITURE_REC.bench, w: 1.8, d: 0.5 }, 200);
  }
  // perforated steel column lamps d 0.38, 4.2 m, opal ball d 0.55: two each side of the stair foot (foot on the plaza) and four beside the park benches of the terrace (photo 24, foot level TERR)
  { const spots = [], items = [];
    for (const [x, z] of COLUMN_LAMPS) { spots.push(spot(x, z)); const p = HF.W(x, z); items.push(ph.addCylinder(p.x, p.z, 0.2, 0, 4.6)); S.lamps.push({ x: p.x, z: p.z, h: 4.7 }); }
    for (const [x, z] of TERRACE_LAMPS) { spots.push(spot(x, z, TERR)); const p = HF.W(x, z); items.push(ph.addCylinder(p.x, p.z, 0.2, TERR, TERR + 4.6)); S.lamps.push({ x: p.x, z: p.z, h: 4.7 }); }
    const geo = partsGeos((Q) => {
      Q.cyl(M.steel, [0, 0, 0], [0, 4.2, 0], 0.19, 0.16, 10, true); Q.cyl(M.steel, [0, 1.5, 0], [0, 1.62, 0], 0.27, 0.27, 10, true);
      const g = new THREE.SphereGeometry(0.28, 16, 12); Q.geo(M.ball, g, 0, 4.45, 0); g.dispose();
    });
    K.extraTris += knockFurniture(ctx, 'lmprib-column-lamps', geo, spots, items, FURNITURE_REC.lamp(4.7), 300);
  }
  // ball-lamp posts along the stair top (22, pitch 1.5 m, on the top tread: knock records) and white hemispherical bollards along both edges of the drive (instanced, no collider in the source)
  const lampG = partsGeos((Q) => { Q.cyl(M.steel, [0, 0, 0], [0, 3.0, 0], 0.06, 0.05, 6, false); const g = new THREE.SphereGeometry(0.19, 12, 9); Q.geo(M.ball, g, 0, 3.15, 0); g.dispose(); });
  const bolG = partsGeos((Q) => { Q.cyl(M.white, [0, 0, 0], [0, 0.22, 0], 0.34, 0.32, 10, false); const g = new THREE.SphereGeometry(0.33, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2); Q.geo(M.white, g, 0, 0.22, 0); g.dispose(); });
  const lmSpots = [], lmItems = [], bm = [];
  for (let i = 0; i < 11; i++) for (const x of [-12.9 + i * 1.5, 17.9 - i * 1.5]) { const p = HF.W(x, 1.3); lmSpots.push({ x: p.x, y: TERR, z: p.z, rotY: rot }); S.lamps.push({ x: p.x, z: p.z, h: 3.4 }); lmItems.push(ph.addCylinder(p.x, p.z, 0.1, TERR, TERR + 3.4)); }
  K.extraTris += knockFurniture(ctx, 'lmprib-lamps', lampG, lmSpots, lmItems, { ...FURNITURE_REC.lamp(3.4), r: 0.12, mass: 80 }, 240);
  for (let i = 0; i + 1 < DRIVE.length; i++) {
    const a = DRIVE[i], b = DRIVE[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / len, nz = (b[0] - a[0]) / len, k = Math.max(1, Math.round(len / 3.6));
    for (let j = 0; j < k; j++) { const t = j / k, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; for (const s of [-1, 1]) { const p = HF.W(x + nx * 3.55 * s, z + nz * 3.55 * s); bm.push(mat4(p.x, TERR, p.z, rot, 1)); } }
  }
  K.extraTris += addInstanced(ctx, K.root, 'lmprib-bollards', bolG, bm).tris;
}

// ------------------------------------------------------------------------------------------------ colliders
function colliders(K) {
  const ph = K.ctx.physics, top = TERR, bot = 0;
  // the platform: walk boxes with a solid column from the ground (the 3.2 m walls: nobody walks in from the side), flush with the terrace top
  walkF(ph, HF, -29.5, 29.5, -54.0, 1.0, top, bot);                                    // the V between the arms in front of the lobby
  walkF(ph, HF, -70, -14.2, -16.0, 7.2, top, bot); walkF(ph, HF, 19.0, 76, -16.0, 7.2, top, bot);
  walkF(ph, HF, 29.4, 60.0, -23.0, -16.0, top, bot); walkF(ph, HF, -60.0, -29.4, -23.0, -16.0, top, bot);
  for (const pl of [WALL_N, WALL_S]) for (let i = 0; i + 1 < pl.length; i++) walkStrip(ph, HF, pl[i], pl[i + 1], wallNormal(pl[i], pl[i + 1]), 3.6, top, bot);
  // the stair: 20 steps rising toward the hotel (the frame's -z): the helper rises along its local +z, so it is turned by PI
  { const c = HF.W((STAIR.x0 + STAIR.x1) / 2, (STAIR.zTop + STAIR.zBot) / 2); ph.addStairs(c.x, c.z, STAIR.x1 - STAIR.x0, STAIR.zBot - STAIR.zTop, HF.rot + Math.PI, 0, TERR, STAIR.n); }
  boxF(ph, HF, STAIR.x1 + 0.3, 9.7, 0.6, 4.6, 0, 2.2); boxF(ph, HF, STAIR.x0 - 0.3, 9.7, 0.6, 4.6, 0, 2.2);        // the cheek walls
  for (const zc of BED_Z) boxF(ph, HF, 0, zc, 8.7, 8.7, 0, 0.45);                       // the lawn beds (kerb 0.45 m: a step the player can take; terrain-like, solid on purpose)
  // (the plaza benches, the planters, the terrace benches and all the lamps are knock records: furniture() above)
  const c = CANOPY, W = c.x1 - c.x0;
  for (const x of [c.x0 + 0.5, c.x0 + W / 3, c.x1 - W / 3, c.x1 - 0.5]) boxF(ph, HF, x, c.z1 - 0.9, 0.6, 0.6, TERR, c.y0);       // the canopy piers: structure
}

// ------------------------------------------------------------------------------------------------ the two groves of young spruces (x 18 .. 36 and -26 .. -6.5, z 15 .. 42, jittered grid ~3.4 m)
function trees(K) {
  const ctx = K.ctx, rng = ctx.rng(5517), list = [], cover = coverFn(ctx);
  for (const [x0, x1] of [[18.5, 36], [-38, -20.5]]) for (let x = x0; x <= x1; x += 3.4) for (let z = 15.5; z <= 42; z += 3.4) {
    const p = HF.W(x + (rng() - 0.5) * 1.6, z + (rng() - 0.5) * 1.6), sc = 0.85 + rng() * 0.45, yw = rng() * 6.28;
    if (cover(p.x, p.z) > -3.0) continue;                                     // road integrity (review): the moved south grove crosses a 4 m service way at its far corner (x -38 .. -31, z 31 .. 40)
    list.push({ x: p.x, z: p.z, y: 0.05, fam: 'spruceB', s: sc, yaw: yw });
  }
  if (list.length) plantTrees(K, list, 'lmprib-trees');
  K.svc.trees = list.map((t) => ({ x: t.x, z: t.z, r: 1.6, h: 8 }));
}

// ------------------------------------------------------------------------------------------------ services
function services(K) {
  const S = K.svc, a = HF.W(0, 4.5), b = HF.W(0, 40);
  S.crowd.push({ id: 'hotel-stair-top', kind: 'photo', x: a.x, z: a.z, r: 5, n: 6 }, { id: 'hotel-plaza', kind: 'stroll', x: b.x, z: b.z, r: 14, n: 8 });
}
