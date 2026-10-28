// landmarksVOStatues/zmei.js - ZMEI GORYNYCH, the playground dragon of a yard on Vasilievsky Island (V. Trubakov, a joiner of the housing office, about 1980; repainted 2015 and 2023-25).  Photo n935201442/c00 (opened,
// 21.06.2015): a green plaster-cement dragon lying on pink pavers: a high arched back with a big RED dorsal sail, a main head in front with the jaws open (a white tooth row, a dark cavity the children crawl into, red
// eyes and nostrils), a second thin head on a long neck arching over the back, a wing on the ground at the left (an arm arching up to a clawed hand, the membrane trailing to the ground), stubby legs, a tail trailing
// to the left.  About 8 m long.  No animation.  Colours: plaster green #3f9a63 with lighter scuffs, sail and eyes #d9605a, teeth #eee8d8.  Solid: capsules along the body (nobody walks through the dragon).
// Piece frame: the head looks toward +z.
import * as THREE from 'three';
import { loft, ball } from './solids.js';

const GREEN = '#3f9a63', SCUFF = '#6fb98a', DARKG = '#2f7c4d', RED = '#d9605a', TOOTH = '#eee8d8';

export const PIECES = [{
  id: 'n935201442', key: 'zmei', name: 'Змей Горыныч', x: -3947.4, z: -785.2, yaw: 'auto', h: 3.0, spot: 9, reach: 30,
  solid: [{ r: 0.85, h: 2.0, oz: -0.5 }, { r: 0.8, h: 1.7, oz: 0.7 }, { r: 0.75, h: 1.5, oz: -2.0 }, { r: 0.7, h: 1.0, oz: 3.1 }, { r: 0.55, h: 1.0, oz: -3.5 }],
  build(P, M) {
    const V = M.vc, V2 = M.vc2;
    P.tint(GREEN);
    // the body: an arched back
    loft(P, V, [[0, 0.55, -3.5], [0, 1.1, -2.1], [0, 1.6, -0.5], [0, 1.55, 0.9], [0, 1.05, 1.9]], [[0.28, 0.24], [0.62, 0.52], [0.74, 0.66], [0.7, 0.6], [0.56, 0.5]], { seg: 14, per: 4 });
    // the tail: trailing to the left
    loft(P, V, [[0, 0.55, -3.5], [-0.5, 0.36, -4.6], [-1.5, 0.22, -5.5], [-2.7, 0.12, -5.9], [-3.6, 0.1, -5.5]], [[0.3, 0.26], [0.22, 0.2], [0.15, 0.13], [0.09, 0.08], [0.03, 0.03]], { seg: 9, per: 4 });
    // the main head: a neck down to the ground, the upper jaw, the lower jaw lying on the pavers, the dark mouth
    loft(P, V, [[0, 1.05, 1.9], [0, 0.7, 2.5], [0, 0.5, 3.0]], [[0.52, 0.48], [0.46, 0.4], [0.44, 0.36]], { seg: 12, per: 3 });
    ball(P, V, [0, 0.62, 3.55], [0.52, 0.34, 0.78], { w: 14, h: 9, dir: [0, 0.12, 1] });
    ball(P, V, [0, 0.36, 3.6], [0.43, 0.17, 0.78], { w: 12, h: 7, dir: [0, 0.0, 1] });
    P.tint('#17261d'); ball(P, V, [0, 0.42, 3.52], [0.34, 0.15, 0.58], { w: 10, h: 6 });
    P.tint(TOOTH);
    for (let i = 0; i < 9; i++) { const z = 3.2 + i * 0.12, s = i % 2 ? 1 : -1; for (const sx of [-1, 1]) { P.cyl(V, [sx * 0.31 * (1 - i * 0.03), 0.52, z], [sx * 0.31 * (1 - i * 0.03), 0.4, z], 0.03, 0.006, 5, false); P.cyl(V, [sx * 0.3 * (1 - i * 0.03), 0.34, z + 0.04], [sx * 0.3 * (1 - i * 0.03), 0.43, z + 0.04], 0.026, 0.006, 5, false); } void s; }
    P.tint(RED);
    for (const s of [-1, 1]) { ball(P, V, [s * 0.38, 0.82, 3.25], [0.1, 0.1, 0.07], { w: 8, h: 6, dir: [s * 0.5, 0.2, 1] }); ball(P, V, [s * 0.2, 0.72, 4.28], [0.06, 0.05, 0.05], { w: 6, h: 5 }); }
    P.tint(GREEN); for (const s of [-1, 1]) ball(P, V, [s * 0.3, 0.98, 3.0], [0.1, 0.16, 0.08], { w: 7, h: 5, dir: [s * 0.4, 1, 0] });          // brow ridges / horns
    // the second head on a long neck arching over the back (to the right)
    loft(P, V, [[0.35, 1.55, 0.6], [0.8, 2.3, 0.3], [1.3, 2.55, 0.8], [1.55, 2.0, 1.45], [1.5, 1.5, 1.7]], [[0.2, 0.18], [0.16, 0.15], [0.13, 0.12], [0.12, 0.11], [0.11, 0.1]], { seg: 9, per: 4 });
    ball(P, V, [1.48, 1.35, 1.9], [0.14, 0.12, 0.26], { w: 10, h: 7, dir: [0, -0.3, 1] });
    P.tint(RED); ball(P, V, [1.58, 1.42, 1.98], [0.035, 0.035, 0.03], { w: 5, h: 4 }); ball(P, V, [1.38, 1.42, 1.98], [0.035, 0.035, 0.03], { w: 5, h: 4 });
    // the red dorsal sail: a jagged fan standing on the arch (x = 0 plane)
    P.tint(RED); P.push(0, 0, 0, Math.PI / 2);
    const sh = new THREE.Shape();                                                  // local x = -z world, y up
    sh.moveTo(1.9, 2.05); sh.lineTo(1.75, 2.85); sh.lineTo(1.35, 2.55); sh.lineTo(1.2, 3.30); sh.lineTo(0.7, 2.85); sh.lineTo(0.45, 3.50); sh.lineTo(0.05, 2.95); sh.lineTo(-0.15, 3.25); sh.lineTo(-0.5, 2.30); sh.lineTo(-0.3, 2.05); sh.lineTo(1.9, 2.05);
    P.face(V2, sh, 0.0, 1); P.pop();
    // the wing on the ground at the left: an arm arching over to a clawed hand, the membrane trailing to the pavers
    P.tint(DARKG);
    loft(P, V, [[-0.5, 1.55, 0.5], [-1.2, 2.25, 0.3], [-2.0, 1.75, 0.15], [-2.5, 0.9, 0.1], [-2.6, 0.2, 0.2]], [[0.2, 0.17], [0.17, 0.15], [0.15, 0.13], [0.12, 0.11], [0.1, 0.09]], { seg: 8, per: 4 });
    P.tint(GREEN); ball(P, V, [-2.62, 0.22, 0.3], [0.15, 0.12, 0.2], { w: 8, h: 6 });
    P.tint('#4c8a62');
    P.fan(V2, [[-0.55, 1.5, -1.0], [-1.2, 2.25, 0.3], [-2.0, 1.75, 0.15], [-2.5, 0.9, 0.1], [-3.9, 0.05, -1.0], [-3.1, 0.05, -2.4], [-1.4, 0.2, -2.0]], [0, 1, 0.3]);
    // the stubby legs and claws
    P.tint(GREEN);
    for (const [x, z0, z1] of [[-0.7, 0.9, 1.35], [0.7, 0.9, 1.35], [-0.78, -1.9, -2.15], [0.78, -1.9, -2.15]]) {
      loft(P, V, [[x * 0.8, 1.2, z0], [x, 0.6, (z0 + z1) / 2], [x * 1.05, 0.12, z1]], [[0.28, 0.24], [0.2, 0.18], [0.17, 0.15]], { seg: 8, per: 3 });
      P.tint(TOOTH); for (let k = -1; k <= 1; k++) ball(P, V, [x * 1.05 + k * 0.08, 0.05, z1 + 0.16], [0.03, 0.03, 0.1], { w: 5, h: 4 }); P.tint(GREEN);
    }
    // scuffs
    P.tint(SCUFF); for (let i = 0; i < 9; i++) ball(P, V, [(i % 3 - 1) * 0.5, 1.3 + (i % 2) * 0.25, -2.4 + i * 0.4], [0.16, 0.05, 0.2], { w: 6, h: 4, dir: [0.3, 1, 0] });
  },
}];
