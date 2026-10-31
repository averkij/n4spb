// landmarksYelaginPark/bear.js - the CARVED WOODEN FIGURE inside the round bed of the Maslyany Meadow loop (OSM n1269595927 "Старик", material=wood, (-4615.1, -5129.9)).
// Photo (docs/research/yelagin-park-2026.md CRITIC LOG 19, SP/refs/yelagin-critic/oldman1.jpg, Commons "5454. St. Petersburg. Elagin Island"): a chainsaw-carved dark-brown BEAR playing an
// ACCORDION, sitting upright (about 1.3 m with the block) on a two-tier block (a chamfered octagonal foot and a square cap block), in the middle of a round bed (soil ring with a border of
// flowers, a bare earth path inside).  The OSM name "Старик" does not describe it.  In summer the spring tulips are replaced by a ring of low pink annuals [E].  Only boxes: the faceted
// chainsaw look is the point.  ~450 triangles + the ring (~1.2 k).
import * as THREE from 'three';
import { BEAR } from './frame.js';
import { hash } from './kit.js';

let _unit = null, _dome = null, _bloom = null;
const unit = () => _unit || (_unit = new THREE.BoxGeometry(1, 1, 1));
const dome = () => _dome || (_dome = new THREE.SphereGeometry(1, 5, 2, 0, Math.PI * 2, 0, Math.PI / 2));
const bloom = () => _bloom || (_bloom = new THREE.OctahedronGeometry(1, 0));

export function build(K) {
  const { ctx, P, M, svc } = K, { x, z } = BEAR;
  const rot = -0.5;                                                          // the bear looks south-south-west, towards the meadow path
  const B = (mat, cx, cy, cz, sx, sy, sz, rx = 0, ry = 0, rz = 0) => P.geo(mat, unit(), cx, cy, cz, rx, ry, rz, sx, sy, sz);
  P.far = 260;
  P.push(x, 0, z, rot);
  // block: chamfered octagonal foot (two stacked octagon prisms) and the cap block
  P.prism(M.bearWood, 0, 0, 0.36, 8, 0, 0.1, Math.PI / 8, { sides: true });
  P.prism(M.bearWood, 0, 0, 0.3, 8, 0.1, 0.2, Math.PI / 8, { sides: true });
  B(M.bearWood, 0, 0.34, 0, 0.5, 0.28, 0.5, 0, 0.05, 0);                    // the square block of the pedestal
  // the bear: legs forward, body leaning slightly back, arms to the accordion, the head with ears and a snout
  B(M.bearWood, 0, 0.74, -0.02, 0.5, 0.62, 0.42, -0.08, 0.04, 0);               // body
  B(M.bearWood, -0.15, 0.51, 0.27, 0.18, 0.17, 0.4, 0.1, 0.1, 0); B(M.bearWood, 0.15, 0.51, 0.27, 0.18, 0.17, 0.4, 0.1, -0.1, 0);   // the legs
  B(M.bearWood, 0, 1.19, 0.05, 0.34, 0.3, 0.33, 0.1, 0, 0.04);                  // head
  B(M.bearWood, 0, 1.12, 0.26, 0.19, 0.14, 0.2, 0.18, 0, 0);                     // snout
  B(M.dark, 0, 1.16, 0.37, 0.07, 0.05, 0.05);                                      // nose
  B(M.bearWood, -0.15, 1.38, 0.0, 0.1, 0.1, 0.07, 0, 0, 0.3); B(M.bearWood, 0.15, 1.38, 0.0, 0.1, 0.1, 0.07, 0, 0, -0.3);       // ears
  B(M.dark, -0.08, 1.26, 0.215, 0.04, 0.03, 0.03); B(M.dark, 0.08, 1.26, 0.215, 0.04, 0.03, 0.03);                                  // eyes
  // arms from the shoulders to the instrument
  B(M.bearWood, -0.3, 0.88, 0.14, 0.14, 0.12, 0.42, 0.4, 0.45, 0); B(M.bearWood, 0.3, 0.88, 0.14, 0.14, 0.12, 0.42, 0.4, -0.45, 0);
  // the accordion: two end boxes and a zig-zag of bellows between them (nine folds, dark joints), held at the chest, 0.66 m wide
  B(M.bearWood, -0.36, 0.8, 0.36, 0.1, 0.34, 0.26, 0, 0, 0); B(M.bearWood, 0.36, 0.8, 0.36, 0.1, 0.34, 0.26, 0, 0, 0);
  for (let i = 0; i < 9; i++) {
    const px = -0.3 + i * 0.075, big = i % 2 === 1;
    B(M.bearWood, px + 0.035, 0.8, 0.36 + (big ? 0.03 : 0.0), 0.062, 0.31 + (big ? 0.03 : 0), 0.24 + (big ? 0.05 : 0));
    if (i < 8) B(M.dark, px + 0.075, 0.8, 0.36, 0.012, 0.3, 0.2);
  }
  P.pop();
  // the bed: a soil ring (inner radius 1.6, outer 2.55, 4 cm over the ground) of 40 sectors with low annuals (green leaf cushions + red-pink blooms); the sectors on a footway are left out (the path
  // leads into the bed, as in the photo); the earth floor inside is the generic ground
  P.far = 160;
  const nS = 40, ri = 1.6, ro = 2.55;
  for (let i = 0; i < nS; i++) {
    const a0 = i / nS * Math.PI * 2, a1 = (i + 1) / nS * Math.PI * 2, am = (a0 + a1) / 2;
    const mx = x + Math.cos(am) * (ri + ro) / 2, mz = z + Math.sin(am) * (ri + ro) / 2;
    if (ctx.L.roadsNear(mx, mz, 0.45).length) continue;
    const q = (r, a) => [x + Math.cos(a) * r, 0.04, z + Math.sin(a) * r];
    P.quad(M.soil, q(ri, a0), q(ro, a0), q(ro, a1), q(ri, a1), [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (let j = 0; j < 2; j++) {
      const r = ri + 0.25 + (ro - ri - 0.5) * (0.2 + 0.5 * j) + (hash(7, i, j) - 0.5) * 0.12, aa = a0 + (a1 - a0) * (0.25 + 0.25 * j), px = x + Math.cos(aa) * r, pz = z + Math.sin(aa) * r;
      const k = 0.17 + hash(7, i, 10 + j) * 0.08;
      P.geo(M.hostaA, dome(), px, 0.03, pz, 0, 0, 0, k, k * 0.7, k);
      for (let f = 0; f < 3; f++) P.geo(M.bloomPink, bloom(), px + (hash(7, i, 20 + j * 3 + f) - 0.5) * k * 1.2, 0.03 + k * 0.5, pz + (hash(7, i, 40 + j * 3 + f) - 0.5) * k * 1.2, 0, 0, 0, 0.07, 0.055, 0.07);
    }
  }
  ctx.physics.addCylinder(x, z, 0.5, 0, 1.45);
  svc.monuments.push({ id: BEAR.id, name: 'Резной медведь с гармонью', nameEn: 'Carved wooden bear with an accordion', x, z, h: 1.45, r: 2.5 });
  svc.bear = { x, z, sectors: nS };
}
