// landmarksBotanicalGreenhouses/museum.js - the BOTANICAL MUSEUM (Ботанический музей им. В. Л. Комарова, OSM r11491713, on the site of lost house no. 5; 3 storeys, hipped roof, 37.5 x 25.9 m): a
// modernist-neoclassical ochre-orange stucco block, white pilaster strips between the bays, three tall windows per bay and a white relief panel with botanical motifs under the lowest window, a
// dark granite plinth, a flat cornice and a low tin hip.  The entrance front is the LONG south-east face towards the north court (the door node n6069024742 sits at its middle: the 5th of 9 bays),
// the other faces repeat the bay.  Dossier 4.1b (CRITIC log row 18), photos 35 (the front), 36 (from the court), 37-40.  Door closed (a plate); the stair is two granite steps.
import * as L from '../layout.js';
import { hangPlate, ringOfPoly, outNormals, len2, wallTiles, wallFlat, rectOf, rectRing, inset, loftRing, capRing, tileQuad, EU, EV, lerp, centroid } from './geo.js';
import { ringEdges, band } from './kit.js';

const PLINTH = 1.1, H = 13.1, BAY = 4.15;

export function build(K) {
  const { P, D, M, svc } = K;
  const b = L.buildingById('r11491713'), ring = ringOfPoly(b);
  if (!ring) { console.warn('[landmarksBotanicalGreenhouses] museum footprint missing'); return; }
  const N = outNormals(ring), n = ring.length;
  // the entrance edge = the longest edge facing the north court (SE, towards (-1576, -4283))
  let door = 0, best = 0;
  for (let i = 0; i < n; i++) { const A = ring[i], B = ring[(i + 1) % n], l = len2(A, B), mx = (A[0] + B[0]) / 2, mz = (A[1] + B[1]) / 2, toward = (-1576 - mx) * N[i][0] + (-4283 - mz) * N[i][1]; if (toward > 0 && l > best) { best = l; door = i; } }
  let doorPos = null;
  for (let i = 0; i < n; i++) {
    const A = ring[i], B = ring[(i + 1) % n], l = len2(A, B);
    wallFlat(P, M.granite, A, B, 0, PLINTH, PLINTH, N[i]);
    if (l < 2.5) { wallFlat(P, M.ochre, A, B, PLINTH, H, H, N[i]); continue; }
    const k = Math.max(1, Math.round(l / BAY));
    for (let j = 0; j < k; j++) {
      const s0 = j / k, s1 = (j + 1) / k, a = [lerp(A[0], B[0], s0), lerp(A[1], B[1], s0)], c = [lerp(A[0], B[0], s1), lerp(A[1], B[1], s1)];
      const isDoor = i === door && j === Math.floor(k / 2);
      wallTiles(P, isDoor ? M.museumDoor : M.museum, a, c, PLINTH, H, H, 100, 12.0, N[i]);
      if (isDoor) doorPos = { x: (a[0] + c[0]) / 2, z: (a[1] + c[1]) / 2, n: N[i] };
    }
  }
  const edges = ringEdges({ o: ring.flat(), h: [] });
  band(P, edges, PLINTH - 0.02, PLINTH + 0.12, 0.07, { front: M.stoneDark, top: M.stoneDark });
  band(P, edges, H - 0.2, H + 0.5, 0.45, { front: M.white2, top: M.white2, under: M.white2 });
  // the low tin hip over the oriented rectangle
  const rr = rectRing(rectOf(ring)), R = (d) => inset(rr, d);
  loftRing(P, M.tin, R(-0.5), H + 0.45, R(11.8), H + 1.9, 2.4, 2.4);
  capRing(P, M.tinFlat, R(11.8), H + 1.9);
  // the door: a granite surround, two steps
  if (doorPos) {
    const d = doorPos, rot = Math.atan2(d.n[0], d.n[1]);
    P.push(d.x, 0, d.z, rot);
    for (const sx of [-1, 1]) P.box(M.granite, sx > 0 ? 0.95 : -1.2, sx > 0 ? 1.2 : -0.95, PLINTH, 3.9, 0, 0.16);                // granite jambs of the door surround (the door is in the bay picture)
    for (let i = 0; i < 2; i++) P.box(M.stoneGrey, -1.7 + 0.15 * i, 1.7 - 0.15 * i, 0, 0.14 * (2 - i), 0.12 + 0.5 * i, 0.12 + 0.5 * (i + 1));
    P.pop();
    { const ex = d.n[1], ez = -d.n[0]; hangPlate(K, 'r11491713', M.plateMuseum, d.x - ex * 3.3 + d.n[0] * 0.04, 0.58, d.z - ez * 3.3 + d.n[1] * 0.04, 0.96, 0.48, d.n[0], d.n[1], 'plate'); }
    const ph = K.ctx.physics;
    if (ph) for (let i = 0; i < 2; i++) { const z = 0.12 + 0.5 * (i + 0.5); const it = ph.addWalkBox(d.x + d.n[0] * z, d.z + d.n[1] * z, 3.4 - 0.3 * i, 0.52, rot, 0.14 * (2 - i)); if (it) it.sticky = true; }
    svc.entrances.push({ x: d.x + d.n[0] * 1.6, z: d.z + d.n[1] * 1.6, rotY: rot + Math.PI, bldg: 'r11491713' });
    (svc.crowd ||= []).push({ id: 'gh-museum-door', kind: 'photo', x: d.x + d.n[0] * 5, z: d.z + d.n[1] * 5, r: 4, n: 4 });
    svc.museumDoor = { x: d.x, z: d.z, nx: d.n[0], nz: d.n[1] };
    { const sx = d.x + d.n[0] * 14, sz = d.z + d.n[1] * 14; svc.photoSpots.push({ x: sx, z: sz, yaw: Math.round(L.yawToward(sx, sz, d.x, d.z)), name: 'Ботанический музей имени В. Л. Комарова' }); }
  }
  const c = centroid(ring);
  svc.monuments.push({ id: 'r11491713', name: 'Ботанический музей имени В. Л. Комарова', x: c[0], z: c[1], h: H + 1.9 });
}
