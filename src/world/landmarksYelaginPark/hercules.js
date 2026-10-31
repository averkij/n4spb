// landmarksYelaginPark/hercules.js - the FARNESE HERCULES of the Yelagin park (OSM n1157615795, (-5544.9, -5113.7)): the white marble copy (workshop of Paolo Triscorni, first third of the 19th
// century, from the Stroganov dacha, put here in 1936; federal heritage 7810363014) on the grassy cape of the 4th Southern pond.
// Photos (docs/research/yelagin-park-2026.md PHOTO TABLE hercules 1-15): the nude bearded hero rests, weight on the right leg, head bowed and turned over the right shoulder, the RIGHT arm behind the
// back holding the golden apples, the LEFT forearm on the club that is wrapped in the lion skin and stands on a rock; the marble stands on a square white slab, on a block of pink-red speckled granite
// (hercules 1, 2, 14: the block is about 1.45 m square and 1.4 m high, the white slab 0.22 m, the statue 3.0 m since the review of 2026-10-13: the photos hercules 3 / 6 give statue : granite block = 2.2 : 1; the plinth is 1.76 m wide so that the rock under the club stands on the slab; chamfered base and cap courses).
// The statue looks along the cape to its tip over the water (the back is seen from the land with the pond behind: hercules 9 / 10 / 11).
// The FIGURE is hand sculpted from the primitives of the figure kit (lib/figures.js: blobs = muscles, tubes = limbs / club / skin, face / hand / foot of the kit): the generic kit human of the first
// pass (smooth, no anatomy) did not read as a Hercules at 2-3 m.  About 9 k triangles (figure 8 k + plinth); solid box collider, walkable all round.
import * as THREE from 'three';
import { Sculpt, V, cached, figureMats, face, hand, foot } from '../lib/figures.js';
import { HERC } from './frame.js';

/**
 * the figure, 1.72 m high in the figure frame (+z front, +x the figure's LEFT).  Pose of the Farnese type: the weight on the RIGHT leg (x < 0), the left leg bent and set forward and out, the
 * pelvis dropped on the left, the head bowed and turned over the right shoulder, the right arm behind the back with the three apples in the palm, the left elbow on the club that stands on a rock
 * under the lion skin.
 */
export function herculesFigure() {
  return cached('ypark-hercules-v2', () => {
    const S = new Sculpt({ detail: 0.72 }), w = (n) => S.seg(n);
    const B = (c, r, o = {}) => S.blob('main', c, r, { w: w(10), h: w(7), ...o });
    const BB = (p, q, ra, rb, o = {}) => S.blobBetween('main', p, q, ra, rb, { w: w(10), h: w(7), ...o });
    // ---- legs: right = weight bearing (straight), left = relaxed (bent, forward and out)
    const hipR = [-0.105, 0.915, 0.0], kneeR = [-0.118, 0.50, 0.03], ankR = [-0.128, 0.085, -0.012];
    const hipL = [0.105, 0.885, 0.0], kneeL = [0.205, 0.475, 0.15], ankL = [0.275, 0.085, 0.115];
    for (const [hip, knee, ank, sg, nm] of [[hipR, kneeR, ankR, -1, 'R'], [hipL, kneeL, ankL, 1, 'L']]) {
      const tm = V.mix(hip, knee, 0.5, [sg * 0.012, 0, 0.012]);
      S.tube('main', [V.add(hip, [0, 0.02, 0]), tm, knee], [[0.13, 0.14], [0.118, 0.13], [0.085, 0.092]], { seg: w(14), per: 4, ref: [1, 0, 0] });                   // the thigh
      BB(V.mix(hip, knee, 0.2, [sg * 0.012, 0, 0.05]), V.mix(hip, knee, 0.78, [sg * 0.008, 0, 0.052]), 0.068, 0.078);                                      // the quadriceps front
      BB(V.mix(hip, knee, 0.25, [sg * 0.082, 0, 0.01]), V.mix(hip, knee, 0.85, [sg * 0.062, 0, 0.012]), 0.046, 0.06);                                     // the vastus lateralis (outer)
      BB(V.mix(hip, knee, 0.25, [-sg * 0.07, 0, 0.0]), V.mix(hip, knee, 0.92, [-sg * 0.045, 0, 0.012]), 0.036, 0.046);                                    // the adductors (inner)
      B(V.add(knee, [0, 0.005, 0.06]), [0.058, 0.055, 0.036]);                                                                                             // the knee cap
      const sm = V.mix(knee, ank, 0.3, [sg * 0.004, 0, -0.012]);
      S.tube('main', [knee, sm, V.mix(knee, ank, 0.62), ank], [[0.082, 0.088], [0.09, 0.1], [0.06, 0.066], [0.04, 0.045]], { seg: w(12), per: 4, ref: [1, 0, 0] });   // the leg with the calf
      BB(V.mix(knee, ank, 0.16, [sg * 0.012, 0, -0.05]), V.mix(knee, ank, 0.6, [sg * 0.01, 0, -0.055]), 0.06, 0.074);                                       // the gastrocnemius
      const dt = S.detail; S.detail = 0.4; foot(S, ank, nm === 'R' ? [-0.18, 0, 1] : [0.5, 0, 1], sg, { key: 'main', scale: 1.12 }); S.detail = dt;      // (low detail: no separate toes)
    }
    // ---- trunk
    B([0.0, 0.915, -0.005], [0.205, 0.11, 0.125]);                                                                        // the pelvis
    S.tube('main', [[0, 0.93, 0.0], [0, 1.08, 0.012], [0, 1.27, -0.004], [0, 1.43, 0.0]], [[0.198, 0.122], [0.168, 0.112], [0.238, 0.148], [0.19, 0.12]], { seg: w(18), per: 4, ref: [1, 0, 0] });   // the trunk: a V taper from the waist to the shoulders
    for (const s of [1, -1]) {
      B([s * 0.108, 1.295, 0.092], [0.128, 0.088, 0.066], { dir: [s * 0.25, -0.25, 1] });                                 // the pectoral
      B([s * 0.276, 1.385, 0.0], [0.088, 0.1, 0.088]);                                                                  // the deltoid
      B([s * 0.265, 1.40, -0.02], [0.06, 0.05, 0.07], { dir: [s * 0.4, 0, -1] });                                         // the rear deltoid
      BB([s * 0.03, 1.47, -0.03], [s * 0.225, 1.405, -0.015], 0.062, 0.052);                                              // the trapezius
      B([s * 0.155, 1.215, -0.095], [0.088, 0.165, 0.062]);                                                               // the latissimus
      B([s * 0.048, 1.06, -0.1], [0.046, 0.14, 0.05]);                                                                    // the erector of the spine
      B([s * 0.1, 0.865, -0.09], [0.12, 0.115, 0.1]);                                                                // the gluteus
      B([s * 0.155, 1.035, 0.035], [0.05, 0.125, 0.082]);                                                                 // the oblique
      for (let i = 0; i < 3; i++) B([s * 0.044, 1.14 - i * 0.088, 0.1 - i * 0.004], [0.048, 0.044, 0.036], { w: w(8), h: w(6) });   // the rectus abdominis: three pairs of blocks
    }
    // ---- neck and head
    S.tube('main', [[0, 1.455, 0.0], [0, 1.5, 0.02], [0, 1.54, 0.04]], [[0.1, 0.092], [0.09, 0.084], [0.08, 0.075]], { seg: w(14), per: 3 });
    const R = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.42, -0.42, 0.04, 'YXZ')), vv = new THREE.Vector3();
    const ax = (x, y, z) => { vv.set(x, y, z).applyMatrix4(R); return [vv.x, vv.y, vv.z]; };
    const HF = { c: V.add([0, 1.575, 0.052], ax(0, 0.085, 0.02)), x: ax(1, 0, 0), y: ax(0, 1, 0), z: ax(0, 0, 1) };
    face(S, HF, { hair: 'curly', beard: 'full', age: 0.55, brow: 1.0, jaw: 1.25, nose: 1.1, seed: 61, scale: 1.04, mouth: 'stern' });
    // ---- the right arm, behind the back: the hand holds the three apples
    const shR = [-0.282, 1.385, 0.0], elR = [-0.352, 1.14, -0.112], wrR = [-0.172, 0.99, -0.186];
    S.tube('main', [shR, V.mix(shR, elR, 0.45, [-0.01, 0, 0.0]), elR], [[0.092, 0.092], [0.082, 0.088], [0.062, 0.066]], { seg: w(12), per: 4, ref: [1, 0, 0] });      // the upper arm
    BB(V.mix(shR, elR, 0.15, [-0.01, 0, 0.04]), V.mix(shR, elR, 0.7, [-0.02, 0, 0.045]), 0.044, 0.05);                                                              // the biceps
    S.tube('main', [elR, V.mix(elR, wrR, 0.4, [-0.012, 0, 0.0]), wrR], [[0.066, 0.062], [0.064, 0.06], [0.04, 0.036]], { seg: w(10), per: 4, ref: [1, 0, 0] });             // the forearm
    const hR = hand(S, -1, wrR, V.sub(wrR, elR), [0.0, 1.0, 0.0], 'cup', { scale: 1.08 });
    for (const [dx, dy, dz] of [[-0.012, 0.05, -0.03], [0.022, 0.05, -0.01], [0.0, 0.052, 0.025]]) B(V.add(hR.hold, [dx, dy, dz]), [0.027, 0.027, 0.027], { w: 6, h: 5 });
    // ---- the left arm: the elbow on the club, the forearm hanging forward, the hand relaxed
    const shL = [0.282, 1.385, 0.0], elL = [0.385, 1.115, 0.025], wrL = [0.40, 0.935, 0.215];
    S.tube('main', [shL, V.mix(shL, elL, 0.45, [0.01, 0, 0.0]), elL], [[0.092, 0.092], [0.082, 0.088], [0.062, 0.066]], { seg: w(12), per: 4, ref: [1, 0, 0] });
    BB(V.mix(shL, elL, 0.15, [0.01, 0, 0.04]), V.mix(shL, elL, 0.7, [0.02, 0, 0.045]), 0.044, 0.05);
    S.tube('main', [elL, V.mix(elL, wrL, 0.4, [0.012, 0, 0.0]), wrL], [[0.068, 0.064], [0.066, 0.062], [0.042, 0.038]], { seg: w(10), per: 4, ref: [1, 0, 0] });
    hand(S, 1, wrL, V.sub(wrL, elL), [-0.6, 0.0, 0.8], 'relaxed', { scale: 1.08 });
    // ---- the rock, the club and the lion skin
    B([0.42, 0.095, 0.0], [0.22, 0.095, 0.2], { w: 6, h: 4, dir: [0.2, 0, 1] });
    B([0.45, 0.235, -0.03], [0.19, 0.13, 0.15], { w: 6, h: 4, dir: [0.4, 0.3, 1] });
    B([0.5, 0.07, 0.17], [0.1, 0.07, 0.1], { w: 5, h: 4, dir: [1, 0, 0.5] });
    B([0.30, 0.06, 0.1], [0.1, 0.06, 0.1], { w: 5, h: 4 });
    S.tube('main', [[0.43, 0.26, 0.0], [0.43, 0.7, 0.0], [0.43, 1.105, 0.0]], [[0.078, 0.078], [0.086, 0.086], [0.098, 0.098]], { seg: w(10), per: 4 });
    const fold = (t, th) => 1 + 0.3 * Math.sin(th * 3 + t * 4) + 0.12 * Math.sin(th * 8 - t * 10);
    S.tube('main', [[0.435, 1.13, 0.06], [0.46, 0.88, 0.1], [0.47, 0.6, 0.115], [0.455, 0.36, 0.105]], [[0.125, 0.04], [0.14, 0.046], [0.145, 0.05], [0.115, 0.044]], { seg: w(16), per: 6, ref: [1, 0, 0], bump: fold });    // the skin, front drape
    S.tube('main', [[0.43, 1.12, -0.07], [0.45, 0.85, -0.085], [0.46, 0.55, -0.075], [0.44, 0.34, -0.065]], [[0.11, 0.038], [0.12, 0.042], [0.125, 0.044], [0.1, 0.04]], { seg: w(14), per: 5, ref: [1, 0, 0], bump: fold });   // the back drape
    B([0.43, 1.11, 0.0], [0.115, 0.05, 0.115], { w: w(10), h: w(6) });                                                                   // the skin over the club top (under the elbow)
    B([0.505, 0.33, 0.16], [0.075, 0.07, 0.075], { w: w(8), h: w(6) });                                                                  // the head of the lion at the foot of the drape
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; B([0.505 + Math.cos(a) * 0.085, 0.33 + Math.sin(a) * 0.075, 0.15], [0.032, 0.032, 0.03], { w: 5, h: 4 }); }   // the mane
    for (const dx of [-0.12, 0.1]) B([0.46 + dx, 0.31, 0.15], [0.03, 0.024, 0.055], { dir: [0, -0.3, 1], w: 6, h: 4 });                    // the paws
    return S.finish({ name: 'Farnese Hercules' });
  });
}

/** place the monument: K = { ctx, P, M, svc } of landmarksYelaginPark.js */
export function build(K) {
  const { ctx, P, M, svc } = K, { x, z, tip } = HERC;
  const FM = figureMats(ctx), MK = { main: M.marble, dark: FM.dark, accent: M.marble }, rot = Math.atan2(tip[0] - x, tip[1] - z);      // the front looks at the tip of the cape
  P.far = 520;
  P.push(x, 0, z, rot);
  // the plinth (frame of the statue, +z = the front): a base course, the block, the chamfered cap course, then the white slab
  P.box(M.granitePink, -0.88, 0.88, 0, 0.16, -0.88, 0.88, 'b', 1);
  P.box(M.granitePink, -0.82, 0.82, 0.16, 1.24, -0.82, 0.82, '', 1);
  P.box(M.granitePink, -0.88, 0.88, 1.24, 1.38, -0.88, 0.88, '', 1);
  P.box(M.granitePink, -0.84, 0.84, 1.38, 1.45, -0.84, 0.84, '', 1);              // the chamfer of the cap
  P.box(M.marble, -0.84, 0.84, 1.45, 1.67, -0.84, 0.84, '', 1);                  // the white marble slab 1.68 x 1.68 x 0.22
  const k = 1.745, fig = herculesFigure();                                        // kit height 1.72 -> 3.0 m (the dossier: about 3.0 m; photos hercules 3 / 6: the statue is 2.2 x the granite block)
  for (const [key, g] of Object.entries(fig.geos)) P.geo(MK[key] || MK.main, g, -0.205 * k, 1.67, 0, 0, 0, 0, k, k, k);       // (figure + rock are centred on the slab: the rock is on +x, the feet between -0.23 and 0.64)
  P.pop();
  const top = 1.67 + 1.72 * k;
  ctx.physics.addBox(x, z, 1.76, 1.76, rot, 0, top);
  svc.monuments.push({ id: HERC.id, name: 'Геракл Фарнезский', nameEn: 'Farnese Hercules (marble copy)', x, z, h: top, r: 1.2 });
  const sx = x + Math.sin(rot) * 9, sz = z + Math.cos(rot) * 9;                   // a photo spot 9 m in front of the statue, looking at it
  svc.photoSpots.push({ x: sx, z: sz, yaw: ctx.L.yawToward(sx, sz, x, z), name: 'Геракл на мысу 4-го Южного пруда' });
  svc.hercules = { x, z, rotY: rot, top };
}
