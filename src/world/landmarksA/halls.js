// landmarksA/halls.js - everything of the station building BEHIND the street front (docs/research/station.md sections 5-6, OSM parts r16492034..37, annexes
// r2404500 / r2404501, ticket halls w662697920 / w433164092 / w595741909, canopy w662697923): the stem (two 2-storey strips + the big hall with its green hipped roof),
// the platform-side screen and the 1976 aluminium canopy over the track heads, the west annexes (metro vestibule 2), the ticket halls, the west courtyard.
// Station frame (common.js): hall u -17..13, strips u -28..-17 / 13..22.4, d 19.4 (rear of the front block) .. 143.2 (rear wall = platform side).
// The interior is built by interior.js (walls 0.5 m inside the shell lines).  Colliders: strips are solid, annexes are wall boxes (addPolyColliders), the hall
// walls leave the metro lobby door on the west side.
import * as THREE from 'three';
import { Parts, TH, W, wbox, C, O, UV } from './common.js';
import { hipRoof, ringOf } from './geom.js';
import { styledWalls } from './walls.js';
import { windowTex } from './tex.js';
import { makeTall } from './hotel.js';
import { addPolyColliders } from '../lib/massing.js';
import * as L from '../layout.js';
import { centralExtraDoors } from '../metro/central-locations.js';

export const HALL = { u0: -17, u1: 13, d0: 19.4, d1: 143.2, h: 12.5 };       // outer shell lines of the big hall (inner faces are 0.5 m inside)
export const STRIP_H = 9.5;
export const CANOPY = { u0: -33.9, u1: 10.5, d0: 143.3, d1: 168.5, y: 7.4 };

const toUV = (rec) => { const p = rec.polys[0].o, r = []; for (let i = 0; i < p.length; i += 2) r.push(UV(p[i], p[i + 1])); return r; };

export function buildHalls(Cc) {
  const { ctx, M, T } = Cc;
  const P = new Parts();
  const winMat = T('#ffffff', { map: windowTex(ctx), paint: 0 });
  const alu = T('#e4e7ea', { paint: 0.02 });
  const aluDark = T('#9aa0a6', { paint: 0.02 });
  const glass = T('#5d7a93', { paint: 0, emissive: '#223244', emissiveIntensity: 0.4 });

  // ---------------------------------------------------------------- west strip / east strip
  const WS = [[-28, 19.4], [-17, 19.4], [-17, 143.2], [-33.9, 143.2], [-33.9, 128.4], [-28, 128.4]];
  const ES = [[13, 20.1], [22.1, 20.1], [22.7, 143.2], [13, 143.2]];
  styledWalls(P, M, WS, STRIP_H, winMat, { winLit: Cc.winLit, wall: M.wing, skip: (a, b) => (a[1] === 19.4 && b[1] === 19.4) || (a[0] === -17 && b[0] === -17), pitch: 3.8 });
  styledWalls(P, M, ES, STRIP_H, winMat, { winLit: Cc.winLit, wall: M.wing, skip: (a, b) => (a[1] === 20.1 && b[1] === 20.1) || (a[0] === 13 && b[0] === 13), pitch: 3.8 });
  hipRoof(P, M.roof, WS, STRIP_H + 0.45, 1.9, 4.5); hipRoof(P, M.roof, ES, STRIP_H + 0.45, 1.8, 3.8);

  // rear walls of the front block that face the courtyards (u -34.9..-28 and 22.1..34.9 at d = 19.4)
  styledWalls(P, M, [[-34.9, 19.4], [-28, 19.4]], 14.4, winMat, { core: false, closed: false, inside: (x, z) => z < 19.4, wall: M.wing });
  styledWalls(P, M, [[22.1, 20.1], [34.9, 20.1]], 14.4, winMat, { core: false, closed: false, inside: (x, z) => z < 20.1, wall: M.wing });

  // ---------------------------------------------------------------- the big hall: outer upper walls (above the strips), clerestory glass, green hip roof
  const H = HALL;
  const hallRing = [[H.u0, H.d0], [H.u1, H.d0], [H.u1, H.d1], [H.u0, H.d1]];
  P.box(M.wing, H.u0, H.u0 + 0.4, 0.1, H.h, H.d0, 92, 'rb'); P.box(M.wing, H.u0, H.u0 + 0.4, 0.1, H.h, 100, H.d1, 'rb'); P.box(M.wing, H.u0, H.u0 + 0.4, 4.4, H.h, 92, 100, 'rb');
  P.box(M.wing, H.u1 - 0.4, H.u1, 0.1, H.h, H.d0, H.d1, 'lb');       // long walls (the rear stays open: the screen below)
  // clerestory windows on both long walls (dark glass strips between pilasters)
  for (const [u, nx] of [[H.u0, -1], [H.u1, 1]]) {
    for (let d = H.d0 + 6; d < H.d1 - 4; d += 6.2) {
      P.push(u, 0, d, 0);
      P.box(M.trim, nx * 0.05 + (nx < 0 ? -0.15 : 0.0), nx * 0.05 + (nx < 0 ? 0 : 0.15), 9.9, 12.15, -2.0, 2.0, '');
      P.box(M.pane, nx < 0 ? -0.2 : 0.0, nx < 0 ? 0 : 0.2, 10.2, 11.9, -1.7, 1.7, '');
      P.pop();
    }
  }
  // cornice around the hall top
  P.box(M.trim, H.u0 - 0.35, H.u1 + 0.35, H.h - 0.4, H.h + 0.3, H.d0, H.d1 + 0.35, 'b');
  // green roof: long hip with a glazed ridge lantern over the concourse
  const rr = hipRoof(P, M.hallRoof, hallRing.map((p, i) => [p[0] + (i === 0 || i === 3 ? -0.35 : 0.35), p[1] + (i < 2 ? 0 : 0.35)]), H.h + 0.3, 5.2, 14.6);
  const lan = T('#8fb0c8', { paint: 0, emissive: '#3b5568', emissiveIntensity: 0.4 });
  P.box(M.trim, -4.4, 0.4, H.h + 5.4, H.h + 5.7, 56, 128); P.box(lan, -4.2, 0.2, H.h + 5.5, H.h + 6.9, 57, 127, 'b'); P.box(M.trim, -4.4, 0.4, H.h + 6.9, H.h + 7.15, 56, 128);
  for (let d = 56; d <= 128; d += 6) P.box(M.trim, -4.4, 0.4, H.h + 5.5, H.h + 7.0, d - 0.08, d + 0.08);

  // ---------------------------------------------------------------- platform side: the rear screen of the hall (glass-and-aluminium light hall, 1970s)
  const d1 = H.d1;
  P.box(alu, H.u0, H.u1, 8.2, H.h, d1 - 0.3, d1 + 0.5);                       // lintel band
  P.box(aluDark, H.u0 + 0.3, H.u1 - 0.3, 8.0, 8.2, d1 - 0.35, d1 + 0.55);
  P.box(M.wing, H.u0, -15, 0, 8.2, d1 - 0.3, d1 + 0.5); P.box(M.wing, 11, H.u1, 0, 8.2, d1 - 0.3, d1 + 0.5);           // end piers
  // glazed transom above the openings with aluminium mullions
  for (let u = -15; u <= 11.01; u += 2.6) P.box(alu, u - 0.06, u + 0.06, 8.2, H.h, d1 - 0.38, d1 - 0.3);
  P.box(glass, -15, 11, 8.3, H.h - 0.1, d1 + 0.45, d1 + 0.5, 'bt');
  P.quad(M.pane, [-15, 8.3, d1 + 0.46], [11, 8.3, d1 + 0.46], [11, H.h - 0.1, d1 + 0.46], [-15, H.h - 0.1, d1 + 0.46], [0, 0, 1]);
  // strips' rear ends are walled by styledWalls; the strips' rear stays closed

  // ---------------------------------------------------------------- aluminium canopy over the track heads (OSM w662697923)
  const K = CANOPY;
  P.box(alu, K.u0, K.u1, K.y, K.y + 0.55, K.d0, K.d1);
  P.box(aluDark, K.u0, K.u1, K.y - 0.25, K.y, K.d0 + 0.2, K.d1 - 0.2, 'b');
  const fas = T('#f2f4f6', { paint: 0 });
  P.box(fas, K.u0 - 0.1, K.u1 + 0.1, K.y + 0.1, K.y + 1.0, K.d1, K.d1 + 0.15); P.box(fas, K.u0 - 0.1, K.u1 + 0.1, K.y + 0.1, K.y + 1.0, K.d0 + 0.0, K.d0 + 0.2, 'n');
  for (const d of [148, 164]) for (let u = K.u0 + 3; u < K.u1; u += 8.4) { P.box(fas, u - 0.28, u + 0.28, 0, K.y, d - 0.28, d + 0.28, 'b'); P.box(M.plinthDark, u - 0.32, u + 0.32, 0, 0.5, d - 0.32, d + 0.32, 'b'); }
  // ---------------------------------------------------------------- Kassovy zal No 1 (east of the canopy)
  const KZ = toUV(L.buildingById('w662697920'));
  const doorBay = (e, j, pitch) => { const s = (j + 0.5) * pitch / e.len, d = e.a[1] + (e.b[1] - e.a[1]) * s; return !(Math.abs(e.a[0] - 10.5) < 0.6 && Math.abs(e.b[0] - 10.5) < 0.6 && d > 146.2 && d < 150.4); };
  styledWalls(P, M, KZ, 9.0, winMat, { winLit: Cc.winLit, wall: M.wing, pitch: 3.52, core: false, bayFilter: doorBay }); hipRoof(P, M.roof, KZ, 9.45, 1.5, 3.0);

  // ---------------------------------------------------------------- west annexes (metro vestibule 2): r2404501 (5 levels), r2404500 (3 levels)
  const streetDoors = id => centralExtraDoors.filter(d => d.bldg === id);
  const frameDoors = id => streetDoors(id).map(d => {
    const [x,z] = UV(d.x,d.z);
    return {x,z,w:d.w};
  });
  const A1 = toUV(L.buildingById('r2404501')), A2 = toUV(L.buildingById('r2404500'));
  const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.8;
  const wingEnd = [[-64.8, 22.3], [-50.3, 30.5]];
  const tall = makeTall(Cc, P);
  const skipShared = (a, b) => a[1] > 91 && b[1] > 91 && a[1] < 92 && b[1] < 92;
  const annexStyle = (floors, groundH) => ({ wall: M.wing, rust: M.stuccoShade, groundH, floors, shops: false, ground: true, pitch: 4.0 });
  // r2404501: 5 levels (16.5 m), r2404500: 3 levels (11.4 m): real storeys with the Thon window surrounds
  tall.building(null, 16.5, (e) => ((near(e.a, wingEnd[0]) && near(e.b, wingEnd[1])) || (near(e.b, wingEnd[0]) && near(e.a, wingEnd[1])) || skipShared(e.a, e.b)) ? null : annexStyle([[5.6, 7.7, 'noble'], [8.7, 10.8], [11.8, 13.9], [14.6, 15.8]], 4.6), { outer: A1, roof: false, colliders: false, portals: frameDoors('r2404501') });
  hipRoof(P, M.roof, A1, 17.3, 2.8, 5.5);
  tall.building(null, 11.4, (e) => skipShared(e.a, e.b) ? null : annexStyle([[5.6, 7.6, 'noble'], [8.4, 10.0]], 4.6), { outer: A2, roof: false, colliders: false, portals: frameDoors('r2404500') });
  hipRoof(P, M.roof, A2, 12.2, 2.0, 4.5);

  // ---------------------------------------------------------------- suburban ticket office w433164092 (one storey) and ticket office No 13
  const SU = toUV(L.buildingById('w433164092')), T13 = toUV(L.buildingById('w595741909'));
  styledWalls(P, M, SU, 4.6, winMat, { wall: M.wing, pitch: 3.2 }); hipRoof(P, M.roof, SU, 5.05, 1.0, 2.0);
  styledWalls(P, M, T13, 4.2, winMat, { wall: M.wing, pitch: 3.0 }); hipRoof(P, M.roof, T13, 4.65, 0.8, 1.8);

  const g = new THREE.Group(); g.name = 'station-halls'; g.position.set(O.x, 0, O.z); g.rotation.y = TH;
  P.build(g, {});
  ctx.addStatic(g);
  Cc.parts.hallsTris = P.tris;

  // ---------------------------------------------------------------- colliders
  // strips: solid masses, except the metro lobby behind the west door of the concourse (u -28..-17, d 89..103)
  wbox(ctx, -28, -17, 19.4, 89.4); wbox(ctx, -28, -27.4, 89.4, 102.6); wbox(ctx, -28, -17, 102.6, 128.4); wbox(ctx, -33.9, -17, 128.4, 143.2);
  wbox(ctx, -28, -17, 89, 89.8); wbox(ctx, -28, -17, 102.2, 103);                          // lobby walls (north / south)
  wbox(ctx, 13, 22.7, 19.4, 143.3);
  // hall walls (inner faces): west wall with the lobby door gap d 92..100, east wall closed, front wall pieces beside the vestibule opening
  wbox(ctx, -17.6, -16.9, 19.4, 92); wbox(ctx, -17.6, -16.9, 100, 143.3);
  wbox(ctx, 12.9, 13.6, 19.4, 143.3);
  wbox(ctx, -17.6, -9, 19.2, 19.9); wbox(ctx, 7, 13.6, 19.2, 19.9);
  // rear screen: piers only, the 26 m opening stays free
  wbox(ctx, -17.6, -14.6, 142.4, 143.8); wbox(ctx, 10.6, 13.6, 142.4, 143.8);
  // canopy columns
  for (const d of [148, 164]) for (let u = CANOPY.u0 + 3; u < CANOPY.u1; u += 8.4) wbox(ctx, u - 0.3, u + 0.3, d - 0.3, d + 0.3, 0, CANOPY.y);
  // annex / ticket-hall wall boxes (hollow inside, cut by data/metro.js DOORWAYS)
  for (const id of ['r2404501', 'r2404500', 'w433164092', 'w595741909']) { const b = L.buildingById(id); for (const p of b.polys) addPolyColliders(ctx, p, 0, 20, 0.9, [...L.DOORWAYS, ...streetDoors(id)]); }
  return g;
}
