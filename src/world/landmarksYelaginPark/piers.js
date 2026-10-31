// landmarksYelaginPark/piers.js - the boat bases of the park ponds and the passenger dock on the Srednyaya Nevka.
//   BOAT RENTAL on the 4th Northern pond (OSM PIERS w100146184 "База проката лодок", a comb of three bars: a 33 m trunk from the south bank (-5537.5, -5383) into the pond, a 68 m T-bar across
//   its end (z -5417) and a 25 m side bar (z -5396)) and the CATAMARAN BASE on the 2nd Southern pond (w699822919, a 36 x 2.7 m pier from the east bank (-4852, -4967) westwards).
//   No photograph of either pier exists (docs/research/yelagin-park-2026.md 5.7: [E]): weathered plank pontoons 0.5 m over the pond (deck y = POND_Y + 0.5 = 0.15), dark steel floats, cleats every
//   3 m, a white pipe railing along the trunk, moored BLUE-AND-WHITE PEDAL CATAMARANS (photos park 8, 9: fibreglass catamarans with two hulls and a blue canopy-less seat deck).
//   The player can walk on them: the pond-edge collider is opened at each entrance (physgate.js) and a rail collider keeps the water side closed.
//   PASSENGER DOCK "Елагин остров" (w100868959, a 23.8 x 5 m floating pontoon beside the granite quay of the Srednyaya Nevka, the water-bus stop; photos gate 9, misc 8): a grey steel pontoon at
//   the Neva level + 0.6 m with a white tubular railing, black cast-iron bollards and a flat steel canopy on six posts; exterior only (no way down the 3.4 m quay wall here: a gangway is requested).
import * as THREE from 'three';
import { POND_Y, NEVA_Y } from './frame.js';
import { openGate } from './physgate.js';
import { hash } from './kit.js';

const TOP = POND_Y + 0.5;                                                  // 0.15
let _hull = null;
const hullGeo = () => _hull || (_hull = new THREE.CapsuleGeometry(0.18, 1.7, 1, 6).rotateZ(Math.PI / 2));

/** a bar of the pier: centre line a -> b (world x, z), width w; returns { cx, cz, len, rot, dx, dz } */
function bar(K, a, b, w, o = {}) {
  const { ctx, P, M } = K, dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, rot = Math.atan2(-dz, dx);
  const cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2, top = o.top ?? TOP;
  P.ranged(380, () => {
    P.tbox(M.deck, cx, cz, len, w, top - 0.06, top, rot, '', 1);                             // the plank deck
    P.tbox(M.steelDark, cx, cz, len - 0.1, w + 0.14, top - 0.6, top - 0.06, rot, 't');       // the steel floats / frame (a little wider than the deck)
    for (let s = 0; s <= len - 0.5; s += 3.2) for (const sg of [-1, 1]) {                    // cleats
      const px = a[0] + ux * (0.4 + s) - uz * sg * (w / 2 - 0.12), pz = a[1] + uz * (0.4 + s) + ux * sg * (w / 2 - 0.12);
      P.col(M.steelDark, px, pz, top, top + 0.26, 0.07, 0.05, 6);
    }
  });
  // edge colliders: the water side is closed (y -1 .. top + 1.0), the ends of the bars stay open for boats only visually
  for (const sg of [-1, 1]) ctx.physics.addBox(cx - uz * sg * (w / 2 + 0.06), cz + ux * sg * (w / 2 + 0.06), len + 0.1, 0.14, rot, -1, top + 1.0);
  ctx.physics.addWalkBox(cx, cz, len, w, rot, top, -1);
  return { cx, cz, len, rot, ux, uz, w, a, b };
}
/** a pipe railing on one or both long sides of a bar (white steel, 1.0 m, posts every 2 m) */
function railing(K, br, sides, top = TOP) {
  const { P, M } = K;
  P.ranged(260, () => {
    for (const sg of sides) {
      const off = br.w / 2 - 0.06, ox = -br.uz * sg * off, oz = br.ux * sg * off;
      const A = [br.a[0] + ox, top + 1.0, br.a[1] + oz], B = [br.b[0] + ox, top + 1.0, br.b[1] + oz], A2 = [A[0], top + 0.5, A[2]], B2 = [B[0], top + 0.5, B[2]];
      P.cyl(M.white, A, B, 0.025, 0.025, 6, true); P.cyl(M.white, A2, B2, 0.02, 0.02, 6, true);
      for (let s = 0; s <= br.len + 0.01; s += 2.0) { const px = br.a[0] + br.ux * Math.min(s, br.len) + ox, pz = br.a[1] + br.uz * Math.min(s, br.len) + oz; P.col(M.white, px, pz, top, top + 1.0, 0.03, 0.03, 6); }
    }
  });
}
/** a pedal catamaran moored across the bar at distance s along it, on side sg (+1 / -1): two white hulls, a blue deck with two seats and a steering handle; the bow points away from the pier */
function pedalBoat(K, br, s, sg) {
  const { P, M } = K;
  const nx = -br.uz * sg, nz = br.ux * sg;
  const px = br.a[0] + br.ux * s + nx * (br.w / 2 + 0.95), pz = br.a[1] + br.uz * s + nz * (br.w / 2 + 0.95);
  P.ranged(200, () => {
    P.push(px, POND_Y, pz, Math.atan2(-nz, nx));                               // local +x = the bow
    for (const zz of [-0.45, 0.45]) P.geo(M.white, hullGeo(), 0, 0.12, zz, 0, 0, 0, 1.0, 0.9, 0.9);
    P.box(M.blueDeck, -0.6, 0.65, 0.3, 0.38, -0.7, 0.7, '', 1);                  // the seat deck
    P.box(M.blueDeck, -0.55, -0.4, 0.38, 0.75, -0.55, -0.1); P.box(M.blueDeck, -0.55, -0.4, 0.38, 0.75, 0.1, 0.55);   // the two seat backs
    P.box(M.white, 0.3, 0.38, 0.38, 0.9, -0.05, 0.05);                            // the steering handle
    P.pop();
  });
}

export function build(K) {
  const { ctx, P, M, svc } = K;
  M.blueDeck ||= ctx.mat.toon('#2f6db0', { name: 'ypark-blueDeck', paint: 0.03 });
  // ---- boat rental, 4th Northern pond
  const rental = { trunk: bar(K, [-5537.5, -5383.5], [-5536.6, -5415.9], 2.5), tbar: bar(K, [-5514.35, -5416.4], [-5582.55, -5418.7], 2.7), side: bar(K, [-5538.45, -5395.4], [-5563, -5396.2], 2.7) };
  railing(K, rental.trunk, [-1, 1]);
  railing(K, rental.side, [1]);
  let nb = 0;
  for (let s = 5; s < rental.tbar.len - 4; s += 5.2) { if (hash(3, nb) < 0.8) { pedalBoat(K, rental.tbar, s, 1); nb++; } if (hash(5, nb) < 0.5 && Math.abs(s + 2.5 - 23) > 3.5) { pedalBoat(K, rental.tbar, s + 2.5, -1); nb++; } }
  for (let s = 5; s < rental.side.len - 3; s += 6.6) { pedalBoat(K, rental.side, s, 1); nb++; }
  const g1 = openGate(ctx, -5537.5, -5384.5, 3.2);
  // ---- catamaran base, 2nd Southern pond: from the east bank westwards
  const cat = bar(K, [-4852.5, -4967.4], [-4889.4, -4966.6], 2.6);
  railing(K, cat, [-1, 1]);
  for (let s = 6; s < cat.len - 3; s += 5.8) { pedalBoat(K, cat, s, hash(9, nb) < 0.5 ? 1 : -1); nb++; }
  const g2 = openGate(ctx, -4853.5, -4967.4, 3.2);
  svc.piers = { rental: { boats: nb, gate: g1 }, catamaran: { gate: g2 } };
  // ---- the passenger dock on the Srednyaya Nevka
  dock(K);
}

// ------------------------------------------------------------------------------------------------ the water-bus dock
function dock(K) {
  const { ctx, P, M, svc } = K;
  const o = [[-5549.5, -4971.3], [-5546.3, -4975.1], [-5527.9, -4960.0], [-5531.1, -4956.2]];         // OSM ring of w100868959 (23.8 x 5.0 m)
  const a = [(o[0][0] + o[1][0]) / 2, (o[0][1] + o[1][1]) / 2], b = [(o[2][0] + o[3][0]) / 2, (o[2][1] + o[3][1]) / 2];
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, w = Math.hypot(o[0][0] - o[1][0], o[0][1] - o[1][1]), rot = Math.atan2(-dz, dx);
  const top = NEVA_Y + 0.6, side = { x: -uz, z: ux };
  const shift = 1.0, cx = (a[0] + b[0]) / 2 + side.x * shift, cz = (a[1] + b[1]) / 2 + side.z * shift;                            // 1 m off the bank slope (the OSM polygon touches it)
  a[0] += side.x * shift; a[1] += side.z * shift; b[0] += side.x * shift; b[1] += side.z * shift;                                                                       // the unit vector across the pontoon (to its +side)
  P.ranged(520, () => {
    P.tbox(M.steelDark, cx, cz, len, w, top - 0.9, top - 0.06, rot, 't');                                // the float body
    P.tbox(M.steel, cx, cz, len - 0.1, w - 0.1, top - 0.06, top, rot, '', 1);                            // the grey steel deck plate
    for (let s = 1; s < len; s += 3.4) for (const sg of [-1, 1]) {                                       // black cast-iron bollards
      const px = a[0] + ux * s + side.x * sg * (w / 2 - 0.2), pz = a[1] + uz * s + side.z * sg * (w / 2 - 0.2);
      P.col(M.dark, px, pz, top, top + 0.3, 0.1, 0.07, 8);
    }
    // railing on the river side (the side away from the quay) and across both ends
    for (const sg of [1]) {
      const off = w / 2 - 0.08, A = [a[0] + side.x * sg * off, top + 1.0, a[1] + side.z * sg * off], B = [b[0] + side.x * sg * off, top + 1.0, b[1] + side.z * sg * off];
      P.cyl(M.white, A, B, 0.03, 0.03, 6, true); P.cyl(M.white, [A[0], top + 0.5, A[2]], [B[0], top + 0.5, B[2]], 0.022, 0.022, 6, true);
      for (let s = 0; s <= len; s += 1.9) { const px = a[0] + ux * s + side.x * sg * off, pz = a[1] + uz * s + side.z * sg * off; P.col(M.white, px, pz, top, top + 1.0, 0.035, 0.035, 6); }
    }
    // the canopy: a flat steel roof 3.4 m up over the middle 14 m, on six posts, with a slim white fascia
    const cl = 14, c0 = (len - cl) / 2;
    for (let s = c0; s <= c0 + cl + 0.01; s += cl / 2) for (const sg of [-1, 1]) {
      const px = a[0] + ux * s + side.x * sg * (w / 2 - 0.35), pz = a[1] + uz * s + side.z * sg * (w / 2 - 0.35);
      P.col(M.steel, px, pz, top, top + 3.2, 0.06, 0.06, 6);
    }
    P.tbox(M.steel, a[0] + ux * (c0 + cl / 2), a[1] + uz * (c0 + cl / 2), cl + 0.8, w - 0.3, top + 3.2, top + 3.42, rot, '', 1);
    // two benches under the canopy
    for (const s of [c0 + 3, c0 + 11]) P.tbox(M.benchWood, a[0] + ux * s - side.x * 0.8, a[1] + uz * s - side.z * 0.8, 2.0, 0.45, top + 0.38, top + 0.44, rot);
  });
  ctx.physics.addWalkBox(cx, cz, len, w, rot, top, -4);
  svc.dock = { x: cx, z: cz, len, w, top };
}
