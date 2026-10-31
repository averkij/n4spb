import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksPetrovskyStadium - the PETROVSKY STADIUM (Петровский, until 1992 "Lenin"; 1924-25 A. O. Veyvoda, rebuilt 1957-61 N. V. Baranov, O. I. Guryev, V. M. Fromzel; 20 985 seats, never roofed) on the
// east tip of Petrovsky Island with everything round it that the generic city could not draw: the colonnaded bowl (ONE storey of ~90 slender cream columns under a cream entablature and a MAROON soffit,
// the yellow gallery wall with its red-doored entrances, the two-tone blue stands, the red track with its lane lines, the striped pitch), the four TWIN-LEG lattice floodlight towers with their
// louvred lamp banks, the concrete apron to the granite bank, its lamp posts, the white-roofed annex, the turnstile canopies, the ticket office, the boiler house with the brick chimney, and the Small
// Sports Arena on its islet (covered stand, blue seat blocks, track, pitch, blue fence, three floodlight poles).  It REPLACES the old bowl of landmarksVladimir/stadium.js (that file now builds nothing,
// its claim moved to this module's groups.js).  Dossier docs/research/petrovsky-zhdanovka-2026.md (MODULE PLAN 1 + CRITIC LOG + BUILD LOG), photos refs/petrovsky-zhdanovka-2026/stadium s01 s02 s04 s09 s12 s16.
// User rules: no flags / flagpoles (the rim rods of the real stadium carry flags: not drawn; the towers are bare steel), no alarms, no logos (plain wordmarks only).
// Files (landmarksPetrovskyStadium/): frame.js (measured rings, stations, constants) parts.js (collector) mats.js (materials + textures) bowl.js (shell, stands, columns) field.js (track, pitch, apron)
// masts.js (towers, poles) apronprops.js (lamps, annex, canopies, ticket office, boiler house, chimney) arena.js (the Small Arena) groups.js (claims).
// Publishes ctx.services.landmarksPetrovskyStadium = { monuments, photoSpots, lamps, benches, entrances, triangles, buildMs } and merges monuments / photo spots into ctx.services.landmarks.
// Statics only (no frame callbacks); instancing: columns (92), lamp posts; LOD: bowl 2200 m, towers 4000 m, details 300-600 m.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { registerLOD } from '../core/spatial.js';
import { Parts } from './landmarksPetrovskyStadium/parts.js';
import { makeMats } from './landmarksPetrovskyStadium/mats.js';
import { bowl, MASTS, ARENA_MASTS, CHIMNEY, TIP } from './landmarksPetrovskyStadium/frame.js';
import { bowlShell, columnParts, columnSpots, bowlColliders } from './landmarksPetrovskyStadium/bowl.js';
import { field, apron, parking, roadClip } from './landmarksPetrovskyStadium/field.js';
import { tower, pole, towerColliders } from './landmarksPetrovskyStadium/masts.js';
import { arena } from './landmarksPetrovskyStadium/arena.js';
import { lampSpots, lampParts, canopies, dolphins, annex, ticketOffice, boilerHouse, chimney, rimStructures, prism } from './landmarksPetrovskyStadium/apronprops.js';

/** thin wall boxes round a footprint ring up to height h */
function addRingColliders(ph, ring, h) {
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.3) continue; ph.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, l + 0.1, 0.5, Math.atan2(-(b[1] - a[1]), b[0] - a[0]), 0, h); }
}

async function buildSource(ctx) {
  const t0 = performance.now();
  const B = bowl(); if (!B) { console.error('[landmarksPetrovskyStadium] stands r9073800 missing'); return; }
  const M = makeMats(ctx), root = new THREE.Group(); root.name = 'landmarksPetrovskyStadium';
  const svc = { monuments: [], photoSpots: [], lamps: [], benches: [], entrances: [], failed: [] };
  const P = new Parts(), PM = new Parts(), PD = new Parts(), extra = { holes: [] }, clip = roadClip(ctx);
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksPetrovskyStadium] ${name} failed:`, e); svc.failed.push(name + ': ' + (e && e.stack || e)); } };
  stage('shell', () => bowlShell(P, M));
  stage('field', () => field(P, M));
  stage('rim', () => rimStructures(P, M));
  stage('ticket', () => { const r = ticketOffice(P, M); if (r) { extra.holes.push(r.slice().reverse()); addRingColliders(ctx.physics, r, 4); } });
  stage('dolphins', () => dolphins(PD, M));
  stage('boiler', () => { const r = boilerHouse(P, M); if (r) { extra.holes.push(r.ring.slice().reverse()); chimney(P, M); ctx.physics.addBox(CHIMNEY[0], CHIMNEY[1], 3.4, 3.4, 0, 0, 46); addRingColliders(ctx.physics, r.ring, 7); } });
  stage('annex', () => { const a = annex(P, M, clip); ctx.physics.addBox(a.cx, a.cz, a.hu * 2, a.hv * 2, Math.atan2(-a.uz, a.ux), 0, 4); });
  stage('canopies', () => { canopies(PD, M, clip); });
  stage('arena', () => arena(P, M, ctx.physics, svc, clip));
  let apronRing = null;
  stage('parking', () => parking(P, M, clip));
  stage('apron', () => { const r = apron(P, M, extra.holes, clip); apronRing = r && r.ring; });
  stage('towers', () => {
    for (const [x, z] of MASTS) { const dx = B.c[0] - x, dz = B.c[1] - z, l = Math.hypot(dx, dz) || 1, rot = tower(PM, M, x, z, dx / l, dz / l); towerColliders(ctx.physics, x, z, rot); }
  });
  stage('colliders', () => bowlColliders(ctx.physics));
  // ---- instanced columns
  const instanced = [];
  stage('columns', () => {
    const PC = new Parts(); columnParts(PC, M);
    const geo = PC.build(new THREE.Group())[0].geometry, spots = columnSpots(), im = new THREE.InstancedMesh(geo, M.cream, spots.length), m4 = new THREE.Matrix4();
    spots.forEach(([x, y, z, r], i) => { m4.makeRotationY(r); m4.setPosition(x, y, z); im.setMatrixAt(i, m4); });
    im.computeBoundingBox(); im.computeBoundingSphere(); im.castShadow = im.receiveShadow = true; im.name = 'pstadium-columns'; root.add(im); instanced.push(im); P.tris += PC.tris * spots.length;
  });
  stage('lamps', () => {
    const PL = new Parts(); lampParts(PL, M);
    const geo = PL.build(new THREE.Group())[0].geometry, spots = apronRing ? lampSpots(ctx, apronRing) : [];
    if (!spots.length) return;
    const im = new THREE.InstancedMesh(geo, M.steelGrey, spots.length), m4 = new THREE.Matrix4();
    spots.forEach(([x, z, r], i) => { m4.makeRotationY(r); m4.setPosition(x, 0, z); im.setMatrixAt(i, m4); svc.lamps.push({ x, z, h: 6.4 }); ctx.physics.addBox(x, z, 0.4, 0.4, 0, 0, 6.4); });
    im.computeBoundingBox(); im.computeBoundingSphere(); im.castShadow = true; im.receiveShadow = true; im.name = 'pstadium-lamps'; root.add(im); instanced.push(im); instanced.lamp = im;
    P.tris += PL.tris * spots.length;
  });
  const meshes = P.build(root, { name: 'pstadium' }), meshesM = PM.build(root, { name: 'pstadium-mast' }), meshesD = PD.build(root, { name: 'pstadium-detail' });
  const ground = new Set([M.apron, M.track, M.turf, M.pitch, M.lane]);                                  // flat ground paint: receives shadows, casts none (saves shadow draws)
  for (const m of [...meshes, ...meshesM, ...meshesD]) { if (M.cutouts.has(m.material)) ctx.noOutline(m); if (ground.has(m.material)) m.castShadow = false; }
  root.updateMatrixWorld(true);
  for (const m of meshes) registerLOD(m, 2200);
  for (const m of instanced) registerLOD(m, m === instanced.lamp ? 450 : 1400);
  for (const m of meshesM) registerLOD(m, 4000);
  for (const m of meshesD) registerLOD(m, 500);
  ctx.addStatic(root);
  svc.monuments.push({ id: 'r9073800', name: 'Стадион «Петровский»', x: B.c[0], z: B.c[1], h: 60 });
  // photo spots: the three places a tourist photographs it from (the bridge at the north-east end, the Zhdanovskaya embankment opposite, the Malaya Neva end)
  const spot = (x, z, name, pitch = 4) => svc.photoSpots.push({ x, z, yaw: L.yawToward(x, z, B.c[0], B.c[1]), pitch, name });
  const sw = [(TIP[10][0] + TIP[11][0]) / 2 + 0.38 * (TIP[11][0] - TIP[10][0]), (TIP[10][1] + TIP[11][1]) / 2 + 0.38 * (TIP[11][1] - TIP[10][1])], sl = Math.hypot(TIP[11][0] - TIP[10][0], TIP[11][1] - TIP[10][1]), sn = [-(TIP[11][1] - TIP[10][1]) / sl, (TIP[11][0] - TIP[10][0]) / sl];
  const swSign = sn[0] * (B.c[0] - sw[0]) + sn[1] * (B.c[1] - sw[1]) > 0 ? 1 : -1;                         // 8 m inside the south-west bank of the apron
  spot(-3613, -2369, 'Стадион «Петровский» с Ждановского моста', 6); spot(-3464, -2201.6, 'Стадион «Петровский» с Ждановской набережной', 4); spot(sw[0] + sn[0] * swSign * 8, sw[1] + sn[1] * swSign * 8, 'Стадион «Петровский» со стороны Малой Невы', 6);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksPetrovskyStadium = { ...svc, triangles: Math.round(P.tris + PM.tris + PD.tris), buildMs: Math.round(performance.now() - t0) };
  void ARENA_MASTS; void pole; void prism;
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksPetrovskyStadium");
}
