// landmarksBotanicalGreenhouses/walk.js - the colliders of the module: every house, block, pavilion, shed, the museum, the vestibule and the Palm House is a SOLID (thin wall boxes on the real
// OSM footprint edges, the interior is closed: the glass is a visual wall, the doors are shut); the five columns of the vestibule bow are cylinders; the entrance steps (Palm House portal, museum
// door, vestibule bow) are walk boxes so that a visitor can stand at the doors.  Roofs are not colliders (core/roofmap.js captures what is drawn).  The north court is NOT opened.
import * as L from '../layout.js';
import { addPolyColliders } from '../lib/massing.js';
import { pf, EU, EV } from './geo.js';

const SOLIDS = [
  ['r13561149', 23.5], ['r13561147', 7.0], ['r13561150', 11.0], ['r20398541', 3.9], ['r13561136', 8.4], ['r13561146', 16.3], ['r11491713', 15.0], ['r19579807', 7.8],
  ['r13561145', 6.8], ['r13561144', 6.8], ['r13561143', 6.8], ['r13561142', 6.8], ['r13561141', 6.8], ['r13561140', 6.8], ['r13561133', 6.8], ['r13561134', 6.8], ['r13561135', 6.8], ['r13561138', 6.8], ['r13561137', 6.8],
  ['r13561148', 6.8], ['r13561124', 6.0], ['r13561125', 6.0], ['r13561129', 6.4], ['r13561130', 8.4], ['r13561132', 5.4], ['w28692711', 5.4], ['r13561131', 5.4], ['r13561128', 5.6], ['r20398367', 3.8],
  ['r13572223', 12.6], ['r13572224', 17.6], ['r13572222', 6.9], ['r13561122', 6.9], ['r13561123', 2.5], ['r13561126', 9.2], ['r13561127', 9.2], ['r13561493', 6.9], ['r13561494', 6.9],
  ['w141816501', 4.3], ['w881416378', 2.7], ['w881416379', 2.9], ['w413439428', 3.7],
];

export function build(K) {
  const ph = K.ctx.physics;
  if (!ph) return;
  let n = 0;
  for (const [id, h] of SOLIDS) {
    const b = L.buildingById(id);
    if (!b || !b.polys) { console.warn('[landmarksBotanicalGreenhouses] no footprint for the collider of', id); continue; }
    for (const p of b.polys) n += addPolyColliders(K.ctx, p, 0, h, 0.5);
  }
  // the vestibule bow: columns and the porch floor
  const BOW = pf(104.4, -95.3);
  for (let k = 0; k < 5; k++) { const phi = (-72 + 36 * k) * Math.PI / 180, r = 2.95; ph.addCylinder(BOW[0] + r * (Math.cos(phi) * EU[0] + Math.sin(phi) * EV[0]), BOW[1] + r * (Math.cos(phi) * EU[1] + Math.sin(phi) * EV[1]), 0.36, 0, 5.2); }
  for (let k = 0; k < 8; k++) {
    const mid = (-90 + 11.25 + 22.5 * k) * Math.PI / 180, dx = Math.cos(mid) * EU[0] + Math.sin(mid) * EV[0], dz = Math.cos(mid) * EU[1] + Math.sin(mid) * EV[1], rot = Math.atan2(dx, dz);
    for (const [r0, r1, top] of [[3.25, 3.85, 0.28], [3.85, 4.55, 0.14]]) {
      const r = (r0 + r1) / 2, it = ph.addWalkBox(BOW[0] + dx * r, BOW[1] + dz * r, 1.35 * (r / 3.2), r1 - r0 + 0.06, rot, top); if (it) it.sticky = true;
    }
  }
  K.svc.colliders = n;
}
