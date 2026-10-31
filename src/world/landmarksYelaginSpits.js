import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksYelaginSpits - the WEST SPIT of Yelagin Island, "the pier with the lions" (Пристань со львами на Западной стрелке Елагина острова; L. A. Ilyin, 1920s; federal heritage), the most loved sunset place
// of the city: a 30.4 m arc of pink granite wall (five courses, belt, 1 m parapet, two returns with granite S-leg benches), the two Pudost limestone lions (paw on a ball) on granite plinth cubes at the corners,
// two steep granite flights to the water beside the returns, a raised sand-gravel terrace plaza with broad low steps from the park lawn.  NOTHING stands west of the wall: the sunset vista (azimuth 255-315 deg)
// is open.  Dossier docs/research/yelagin-park-2026.md 5.1 + 13 (+ BUILD LOG), photos refs/yelagin-park-2026/spit 01-28.  User rules: no flags, no alarms; statues are modelled figures (lib/figures.js lion).
// Files (landmarksYelaginSpits/): frame.js (the local frame: wall arc, corners, constants, flights) parts.js (geometry collector) mats.js (7 materials, 3 textures) wall.js (wall, returns, plinths, slabs)
// lions.js (the two lions, two detail levels) benches.js stairs.js (flights + terrace steps) terrace.js (plaza, curb, gravel ring) groups.js (claims + water hand-over data).
// Publishes ctx.services.landmarksYelaginSpits = { monuments, photoSpots, benches, lamps, entrances, flights, terrace, steps, triangles, buildMs } and merges monuments / photo spots into ctx.services.landmarks.
// Statics only (no frame callbacks); LOD: the stone parts 800 m, lions near <= 110 m (5 k triangles each) / far 110-480 m (2.9 k).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { registerLOD } from '../core/spatial.js';
import * as CITY from './data/city.js';
import { sightBanks } from './environment/owners.js';
import { Parts } from './landmarksYelaginSpits/parts.js';
import { makeMats } from './landmarksYelaginSpits/mats.js';
import { O, ROT, world, faceB, HL, FOOT, TERRACE, PARAPET_T, PLINTH, PLINTH_CZ, CORNERS } from './landmarksYelaginSpits/frame.js';
import { wall, RET_LEN } from './landmarksYelaginSpits/wall.js';
import { placeLions } from './landmarksYelaginSpits/lions.js';
import { benches } from './landmarksYelaginSpits/benches.js';
import { flights, terraceSteps } from './landmarksYelaginSpits/stairs.js';
import { terrace, gravelRing } from './landmarksYelaginSpits/terrace.js';
import { hedges } from './landmarksYelaginSpits/hedges.js';

/** solid parts of the wall: the arc (14 boxes), the two returns, the two plinths */
function colliders(ctx, T) {
  const ph = ctx.physics, top = TERRACE + 1.4;
  const pts = []; for (let i = 0; i <= 14; i++) { const a = -HL + 2 * HL * i / 14; pts.push([a, faceB(a)]); }
  for (let i = 0; i < 14; i++) {
    const [a0, b0] = pts[i], [a1, b1] = pts[i + 1], l = Math.hypot(a1 - a0, b1 - b0), nx = -(b1 - b0) / l, nz = (a1 - a0) / l, d = T + 0.25;
    const [x, z] = world((a0 + a1) / 2 - nx * (d / 2 - 0.1), (b0 + b1) / 2 - nz * (d / 2 - 0.1));
    ph.addBox(x, z, l + 0.06, d, ROT - Math.atan2(b1 - b0, a1 - a0), FOOT, top);
  }
  for (const c of CORNERS) {
    const ca = Math.cos(c.psi), sa = Math.sin(c.psi), at = (xp, zp) => world(c.a + xp * ca + zp * sa, c.b - xp * sa + zp * ca);
    const px = c.sx * PLINTH.w / 2, [x, z] = at(px, PLINTH_CZ);
    ph.addBox(x, z, PLINTH.w, PLINTH.w, ROT + c.psi, FOOT, TERRACE + PLINTH.h + PLINTH.slabH + 0.5);
    const rx = c.sx * PARAPET_T / 2, [rx0, rz0] = at(rx, -(PLINTH.w + RET_LEN) / 2 + 0.0);
    ph.addBox(rx0, rz0, PARAPET_T + 0.1, RET_LEN - PLINTH.w + 0.1, ROT + c.psi, FOOT, top);
  }
}

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx), root = new THREE.Group(); root.name = 'landmarksYelaginSpits';
  root.position.set(O.x, 0, O.z); root.rotation.y = ROT;
  const svc = { monuments: [], photoSpots: [], benches: [], lamps: [], entrances: [], flights: [] };
  const P = new Parts(), PH = new Parts(), PL = new Parts();
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksYelaginSpits] ${name} failed:`, e); (svc.failed ||= []).push(name + ': ' + (e && e.stack || e)); } };
  // while environment still draws its own quay wall + 0.88 m parapet roll along this coast (the hand-over BANK_RINGS of groups.js is not registered in environment/owners.js) the arc parapet is made 0.95 m thick
  // so that it swallows the roll (two parapets side by side look broken); with the hand-over it is the real 0.55 m
  const handedOver = sightBanks().some((b) => b.owner === 'landmarksYelaginSpits');          // environment/owners.js knows this module: its quay wall is gone from the ring
  const quay = ctx.services.environment && ctx.services.environment.quay, generic = !handedOver && !!(quay && quay.segments && quay.segments.some((q) => Math.hypot((q.ax + q.bx) / 2 - O.x, (q.az + q.bz) / 2 - O.z) < 25));
  const T = generic ? 0.95 : PARAPET_T; svc.genericQuay = generic; svc.handedOver = handedOver;
  stage('wall', () => wall(P, M, T));
  stage('terrace', () => terrace(ctx, P, M, svc));
  stage('gravel', () => gravelRing(ctx, P, M, CITY.AREAS));
  stage('steps', () => terraceSteps(ctx, P, M, svc));
  // the flights are cut into the ground by WATER_RINGS (hand-over): without the registration the treads would lie 3 m under the lawn and the walk boxes would sink the player into the ground, so nothing is drawn then
  if (handedOver) stage('flights', () => flights(ctx, P, M, svc));
  stage('benches', () => benches(ctx, P, M, svc));
  stage('hedges', () => hedges(ctx, P, M, svc, CITY.EMBANKMENTS));
  stage('colliders', () => colliders(ctx, T));
  stage('lions', () => { placeLions(PH, M, 0.7); placeLions(PL, M, 0.3); });
  const meshes = P.build(root, { name: 'yspit' });
  for (const m of PH.build(root, { name: 'yspit-lion-near' })) m.userData.lion = 'near';
  for (const m of PL.build(root, { name: 'yspit-lion-far' })) m.userData.lion = 'far';
  root.updateMatrixWorld(true);
  root.traverse((m) => {
    if (!m.isMesh) return;
    if (m.userData.lion === 'near') registerLOD(m, 110);
    else if (m.userData.lion === 'far') registerLOD(m, 480, { near: 110 });
    else registerLOD(m, 800);
  });
  ctx.addStatic(root);
  // ---- services: the two lions are monuments, the sunset terrace is a photo spot
  for (const c of CORNERS) {
    const ca = Math.cos(c.psi), sa = Math.sin(c.psi), xp = c.sx * PLINTH.w / 2, zp = PLINTH_CZ, [x, z] = world(c.a + xp * ca + zp * sa, c.b - xp * sa + zp * ca);
    svc.monuments.push({ id: c.key === 'n' ? 'n1269584661' : 'n1269584659', name: 'Лев (Западная стрелка Елагина острова)', x, z, h: 3.5 });
  }
  { const [x, z] = world(0, -6), [tx, tz] = world(0, 40); svc.photoSpots.push({ x, z, yaw: L.yawToward(x, z, tx, tz), name: 'Закат с террасы Западной стрелки' }); }
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksYelaginSpits = { ...svc, triangles: Math.round(P.tris + PH.tris + PL.tris), nearTriangles: Math.round(P.tris + PH.tris), meshes: meshes.length, buildMs: Math.round(performance.now() - t0) };
  void L;
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksYelaginSpits");
}
