// landmarksYelaginKitchen/statues.js - the FOURTEEN niche statues of S. S. Pimenov (1822, Pudozh limestone, cream #d9ceb7), each a modelled figure of the shared kit (lib/figures.js human()), on a 0.28 m base in its
// niche, with the stainless plate under it (atlas texture, reserved through the labels registry).  Latona is a niche statue, NOT a fountain (dossier KNOWN ERRORS 1).
// POSES: all 14 read from the Commons photos "5929.N. <name> statue of the Kitchen Corps" (opened 2026-10-13, SP/refs/yk/s01..s14, contact sheets sheet1..3): the arm positions, the dress (peplos / short chiton / bare
// torso with a cloak), the head covering and the supports (trunks, a sheaf) come from the photos; EXACT hand attributes that are broken off today (sceptre, spear, caduceus, bow) are not drawn;
// ESTIMATES: the faces (generic classical heads), the exact fold pattern, the tilt of the heads (photos show them from below).  Facing: radially out of the drum; the four portico statues face south.
// Figure frame: +z front, +x the figure's LEFT; the viewer in the photo sees the figure's right on the left.
import { human, extend, cached, V, figureMats } from '../lib/figures.js';
import { C, TH, D, PS, STATUES, W } from './frame.js';
import { geosOf, put } from './objs.js';

let DETAIL = 0.45;                          // sculpt detail of the figure kit (1 = a near figure ~12 k triangles); the statues stand in niches and are judged at 2-6 m
export const setStatueDetail = (d) => { DETAIL = d; };
const MEL = (extra) => ({ detail: DETAIL, ...extra });
const ROBE = { torso: 'dress', hem: 0.95, flare: 0.12, folds: 0.17, sleeves: 'none', collar: 'none' };
const MAN = { body: { sex: 'm', muscle: 0.55 } };
const FEM = { body: { sex: 'f', muscle: 0.25 } };
const stand = (L = [0.11, 0, 0.04], Rr = [-0.11, 0, -0.03]) => ({ L: { foot: L }, R: { foot: Rr } });

/** a vertical support (tree trunk / pillar) beside the leg */
const trunk = (S, x, z, h = 0.9, r = 0.11) => S.tube('main', [[x, 0.0, z], [x + 0.01, h * 0.5, z], [x, h, z]], [[r * 1.15, r * 1.15], [r, r], [r * 0.9, r * 0.9]], { seg: 8, per: 3 });

/** a himation: a thick cloth roll from one shoulder diagonally across the chest to the opposite hip, a looped fold over the forearm of the side arm (classical statue drapery) */
const himation = (S, info, side = 'L') => {
  const j = info.j, sh = side === 'L' ? j.shoulderL : j.shoulderR, opp = side === 'L' ? -1 : 1;
  S.tube('main', [V.add(sh, [0, 0.02, -0.005]), V.add(j.chest, [-opp * 0.0, 0.0, 0.135]), V.add(j.waist, [opp * 0.09, -0.02, 0.15]), V.add(j.pelvis, [opp * 0.17, -0.2, 0.15])], [[0.036, 0.026], [0.04, 0.028], [0.045, 0.03], [0.04, 0.028]], { seg: 8, per: 4 });
};

const SPEC = {
  // 1 Vestal: veiled, a long robe, both hands together at the chest holding a small vessel
  vestal: () => extend(human(MEL({ ...FEM, pose: { head: [0.14, 0, 0], spine: [0.03, 0, 0], legs: stand([0.1, 0, 0.02], [-0.1, 0, 0]), arms: { R: { hand: [-0.09, 1.08, 0.25], pole: [-0.3, -0.6, -0.5], grip: 'hold' }, L: { hand: [0.1, 1.1, 0.25], pole: [0.3, -0.6, -0.5], grip: 'hold' } } },
    outfit: { ...ROBE, cape: 'none', sleeves: 'long' }, face: { age: 0.3, hair: 'cap', seed: 21 } })), (S, info) => {
    himation(S, info, 'L');
    const H = info.j.head; if (!H) return;
    S.blob('main', V.add(V.add(H.c, V.mul(H.y, 0.03)), V.mul(H.z, -0.03)), [0.112, 0.125, 0.12], { dir: H.z, ref: H.x, w: 10, h: 8 });                         // the veil over the head
    S.tube('main', [V.add(H.c, V.mul(H.y, -0.02)), V.add(info.j.chest, [0, 0.0, -0.1]), V.add(info.j.pelvis, [0, -0.2, -0.12])], [[0.13, 0.1], [0.19, 0.12], [0.24, 0.14]], { seg: 10, per: 3 });
  }),
  // 2 Juno: weight on the right leg, the right arm hanging a little away, the left forearm raised, the palm open (the sceptre is lost), himation over the left shoulder
  juno: () => extend(human(MEL({ ...FEM, pose: { head: [0.0, -0.2, 0.04], spine: [0.0, 0.0, 0.03], legs: stand([0.12, 0, 0.07], [-0.1, 0, -0.04]), arms: { R: { hand: [-0.3, 0.84, 0.08], pole: [-0.5, -0.4, -0.6], grip: 'relaxed' }, L: { hand: [0.32, 1.2, 0.34], pole: [0.5, -0.4, -0.6], grip: 'open', palm: [0, 1, 0.3] } } },
    outfit: { ...ROBE, cape: 'none', flare: 0.4 }, face: { age: 0.4, hair: 'long', seed: 22 } })), (S, info) => himation(S, info, 'L')),
  // 3 Bacchus: a vine wreath, a cup with grapes in the right hand at the chest, the left arm down, a fawn skin over the shoulder, a trunk at his left leg
  bacchus: () => extend(human(MEL({ ...MAN, body: { sex: 'm', muscle: 0.3, bulk: 0.95 }, pose: { head: [0.05, -0.25, 0.0], spine: [0.0, 0.0, 0.0], legs: stand([0.1, 0, 0.0], [-0.12, 0, 0.1]), arms: { R: { hand: [-0.2, 1.14, 0.3], pole: [-0.6, -0.4, -0.5], grip: 'hold', palm: [0, 1, 0] }, L: { hand: [0.28, 0.82, 0.08], pole: [0.5, -0.2, -0.8], grip: 'relaxed' } } },
    outfit: { torso: 'tunic', hem: 0.22, flare: 0.3, folds: 0.12, cape: 'back', capeLen: 0.55, hat: 'laurel' }, face: { age: 0.15, hair: 'curly', seed: 23 } })), (S, info) => {
    trunk(S, 0.36, -0.1, 0.95, 0.12);
    const h = info.j.wristR; if (!h) return;
    S.blob('main', V.add(h, [0, 0.04, 0.04]), [0.07, 0.06, 0.07], { w: 8, h: 6 });                                                                              // the cup
    for (let i = 0; i < 6; i++) S.blob('main', V.add(h, [-0.03 + (i % 3) * 0.03, 0.1 + (i >> 1) * 0.03 * -1 + 0.03, 0.03]), [0.022, 0.022, 0.022], { w: 5, h: 4 });    // grapes
  }),
  // 4 Flora: a wreath of flowers, a high-belted dress, the right hand raised to the shoulder with a flower, the left hand at the hip holding the cloak; a cornucopia at her feet (viewer's left)
  flora: () => extend(human(MEL({ ...FEM, pose: { head: [0.02, -0.15, 0.05], spine: [0, 0.0, -0.03], legs: stand([0.12, 0, 0.06], [-0.1, 0, -0.04]), arms: { R: { hand: [-0.2, 1.4, 0.27], pole: [-0.6, 0.3, -0.5], grip: 'hold' }, L: { hand: [0.25, 0.86, 0.1], pole: [0.5, -0.2, -0.8], grip: 'relaxed' } } },
    outfit: { ...ROBE, cape: 'none', hat: 'laurel', belt: true }, face: { age: 0.2, hair: 'long', seed: 24 } })), (S) => {
    S.tube('main', [[-0.34, 0.06, 0.12], [-0.3, 0.22, 0.14], [-0.2, 0.4, 0.12]], [[0.07, 0.07], [0.115, 0.115], [0.16, 0.15]], { seg: 9, per: 3 });                // the horn
    for (let i = 0; i < 5; i++) S.blob('main', [-0.2 + (i - 2) * 0.03, 0.43 + (i % 2) * 0.03, 0.12 + (i % 3) * 0.02], [0.04, 0.04, 0.04], { w: 6, h: 5 });
  }),
  // 5 Meleager: youthful, the torso bare, a chlamys over the left shoulder and hip, the right fist at the chest, the left hand at the hip; a trunk at the right leg
  meleager: () => extend(human(MEL({ ...MAN, body: { sex: 'm', muscle: 0.6 }, pose: { head: [0.04, 0.2, 0.0], spine: [0, 0.05, 0.02], legs: stand([0.09, 0, 0.0], [-0.12, 0, 0.08]), arms: { R: { hand: [-0.12, 1.14, 0.25], pole: [-0.6, -0.3, -0.5], grip: 'fist' }, L: { hand: [0.28, 0.94, 0.03], pole: [0.8, 0.0, -0.5], grip: 'relaxed' } } },
    outfit: { torso: 'tunic', hem: 0.3, flare: 0.3, folds: 0.13, cape: 'back', capeLen: 0.55 }, face: { age: 0.12, hair: 'curly', seed: 25 } })), (S, info) => { trunk(S, -0.34, -0.12, 0.8, 0.1); himation(S, info, 'L'); }),
  // 6 Athena: veiled, a peplos with a himation, the right hand low holding a scroll, the left arm raised high (the spear is lost)
  athena: () => extend(human(MEL({ ...FEM, pose: { head: [0.0, 0.2, 0.0], spine: [0, 0.0, 0.0], legs: stand([0.1, 0, 0.04], [-0.1, 0, -0.02]), arms: { R: { hand: [-0.13, 0.98, 0.3], pole: [-0.4, -0.5, -0.6], grip: 'hold' }, L: { hand: [0.3, 1.84, 0.1], pole: [0.8, 0.1, -0.6], grip: 'hold' } } },
    outfit: { ...ROBE, cape: 'none', flare: 0.35 }, face: { age: 0.35, hair: 'cap', seed: 26 } })), (S, info) => {
    himation(S, info, 'R');
    const H = info.j.head; if (H) S.blob('main', V.add(V.add(H.c, V.mul(H.y, 0.03)), V.mul(H.z, -0.03)), [0.11, 0.12, 0.12], { dir: H.z, ref: H.x, w: 10, h: 8 });
    const h = info.j.wristR; if (h) S.tube('main', [V.add(h, [-0.07, 0.0, 0.0]), V.add(h, [0.07, 0.04, 0.0])], [[0.028, 0.028], [0.028, 0.028]], { seg: 6, per: 2 });          // the scroll
  }),
  // 7 Psyche: a light chiton, the right arm raised bent (the butterfly is lost), the left arm down, a wreath
  psyche: () => human(MEL({ ...FEM, pose: { head: [0.0, -0.2, 0.04], spine: [0, -0.04, 0], legs: stand([0.1, 0, 0.03], [-0.11, 0, -0.02]), arms: { R: { hand: [-0.42, 1.64, 0.14], pole: [-0.2, 0.5, -0.5], grip: 'open', palm: [0, 0, 1] }, L: { hand: [0.24, 0.8, 0.05], pole: [0.5, -0.2, -0.8], grip: 'relaxed' } } },
    outfit: { ...ROBE, cape: 'none', hat: 'laurel', belt: true, flare: 0.4 }, face: { age: 0.15, hair: 'long', seed: 27 } })),
  // 8 Ceres: a wreath of ears, a belted chiton with a cloak over the left shoulder, the left hand to the head, the right arm down
  ceres: () => human(MEL({ ...FEM, body: { sex: 'f', muscle: 0.3 }, pose: { head: [0.0, 0.1, 0.0], spine: [0, 0.0, 0.0], legs: stand([0.1, 0, 0.0], [-0.11, 0, 0.05]), arms: { R: { hand: [-0.27, 0.86, 0.08], pole: [-0.5, -0.3, -0.7], grip: 'relaxed' }, L: { hand: [0.17, 1.76, 0.05], pole: [0.9, 0.3, -0.2], grip: 'relaxed' } } },
    outfit: { ...ROBE, cape: 'none', hat: 'laurel', belt: true }, face: { age: 0.3, hair: 'long', seed: 28 } })),
  // 9 Priestess: a wreath over the veil, a long robe and mantle, the left arm cradling a tall vessel (a rhyton), the right hand lowered, a pillar behind the right leg
  priestess: () => extend(human(MEL({ ...FEM, pose: { head: [0.03, -0.15, 0.0], spine: [0, 0.0, 0], legs: stand([0.1, 0, 0.03], [-0.1, 0, -0.02]), arms: { R: { hand: [-0.24, 0.9, 0.1], pole: [-0.5, -0.3, -0.7], grip: 'relaxed' }, L: { hand: [0.2, 1.0, 0.27], pole: [0.5, -0.5, -0.5], grip: 'hold' } } },
    outfit: { ...ROBE, cape: 'none', hat: 'laurel', flare: 0.35 }, face: { age: 0.45, hair: 'cap', seed: 29 } })), (S, info) => {
    himation(S, info, 'R');
    trunk(S, -0.34, -0.1, 1.0, 0.12);
    const h = info.j.wristL; if (h) S.tube('main', [V.add(h, [0.03, -0.14, 0.0]), V.add(h, [0.0, 0.1, 0.0]), V.add(h, [-0.02, 0.36, -0.02])], [[0.03, 0.03], [0.06, 0.06], [0.1, 0.1]], { seg: 9, per: 3 });
  }),
  // 10 Adonis: a youth in a short tunic with a cloak over the left shoulder, a wreath, arms down, the right hand holds a small object; a sheaf behind the left leg
  adonis: () => extend(human(MEL({ ...MAN, body: { sex: 'm', muscle: 0.4, bulk: 0.95 }, pose: { head: [0.06, -0.1, 0.0], spine: [0, 0.0, 0.02], legs: stand([0.09, 0, 0.0], [-0.1, 0, 0.1]), arms: { R: { hand: [-0.24, 0.92, 0.1], pole: [-0.5, -0.3, -0.7], grip: 'fist' }, L: { hand: [0.27, 0.9, 0.08], pole: [0.6, -0.2, -0.7], grip: 'relaxed' } } },
    outfit: { torso: 'tunic', hem: 0.3, flare: 0.4, folds: 0.06, cape: 'back', capeLen: 0.5, hat: 'laurel' }, face: { age: 0.1, hair: 'curly', seed: 30 } })), (S) => {
    for (let i = 0; i < 5; i++) trunk(S, 0.34 + (i - 2) * 0.035, -0.12 + (i % 2) * 0.03, 0.85 + (i % 3) * 0.06, 0.04);
  }),
  // 11 Latona: [photo misc_01, kit_13] a high-belted chiton, a himation over the hip, the right arm stretched out and up, palm up, the left arm down, the head turned up and to the viewer's left
  latona: () => extend(human(MEL({ ...FEM, pose: { head: [-0.25, -0.38, 0.05], spine: [-0.03, -0.1, 0.0], legs: stand([0.11, 0, 0.02], [-0.1, 0, 0.02]), arms: { R: { hand: [-0.62, 1.46, 0.3], pole: [-0.2, -0.8, -0.3], grip: 'open', palm: [0, 1, 0] }, L: { hand: [0.28, 0.82, 0.05], pole: [0.5, -0.2, -0.8], grip: 'relaxed' } } },
    outfit: { ...ROBE, cape: 'none', flare: 0.5, belt: true }, face: { age: 0.35, hair: 'long', seed: 31 } })), (S, info) => himation(S, info, 'R')),
  // 12 Mercury: the winged hat (petasos), the torso bare, a cloak over the hips, the right hand low with a purse, the left hand raised at the shoulder (the caduceus is lost), a trunk at his left
  mercury: () => extend(human(MEL({ ...MAN, body: { sex: 'm', muscle: 0.55 }, pose: { head: [0.0, 0.18, 0.0], spine: [0, 0.05, -0.02], legs: stand([0.08, 0, 0.0], [-0.13, 0, 0.1]), arms: { R: { hand: [-0.27, 0.8, 0.1], pole: [-0.5, -0.2, -0.8], grip: 'relaxed' }, L: { hand: [0.24, 1.3, 0.22], pole: [0.8, 0.0, -0.4], grip: 'fist' } } },
    outfit: { torso: 'tunic', hem: 0.3, flare: 0.3, folds: 0.13, cape: 'none' }, face: { age: 0.12, hair: 'short', seed: 32 } })), (S, info) => {
    trunk(S, 0.36, -0.12, 0.85, 0.1);
    const H = info.j.head;
    if (H) {
      S.blob('main', V.add(H.c, V.mul(H.y, 0.075)), [0.115, 0.025, 0.115], { dir: H.y, ref: H.x, w: 10, h: 5 });                                                       // the brim
      S.blob('main', V.add(H.c, V.mul(H.y, 0.115)), [0.075, 0.05, 0.075], { dir: H.y, ref: H.x, w: 9, h: 6 });
      for (const s of [-1, 1]) S.blob('main', V.add(V.add(H.c, V.mul(H.x, s * 0.1)), V.add(V.mul(H.y, 0.11), V.mul(H.z, -0.01))), [0.005, 0.04, 0.025], { dir: V.add(H.y, V.mul(H.x, s * 0.5)), ref: H.z, w: 4, h: 4 });   // the wings
    }
    const h = info.j.wristR; if (h) S.blob('main', V.add(h, [0.0, -0.06, 0.02]), [0.05, 0.06, 0.04], { w: 7, h: 6 });                                                  // the purse
  }),
  // 13 Artemis: a short belted chiton, bare legs, the right hand raised to the brow (looking out), the left fist at the hip, the hair in a knot, a trunk behind the right leg
  artemis: () => extend(human(MEL({ ...FEM, body: { sex: 'f', muscle: 0.4 }, pose: { head: [0.0, -0.3, 0.0], spine: [0.0, -0.08, 0.0], legs: stand([0.09, 0, 0.08], [-0.11, 0, -0.06]), arms: { R: { hand: [-0.1, 1.6, 0.26], pole: [-0.9, 0.3, -0.2], grip: 'flat', palm: [0, -1, 0.3] }, L: { hand: [0.3, 0.86, 0.1], pole: [0.6, -0.2, -0.6], grip: 'fist' } } },
    outfit: { ...ROBE, hem: 0.5, flare: 0.5, belt: true, cape: 'none' }, face: { age: 0.2, hair: 'long', seed: 33 } })), (S, info) => {
    trunk(S, -0.36, -0.14, 0.9, 0.1);
    const H = info.j.head; if (H) S.blob('main', V.add(V.add(H.c, V.mul(H.y, 0.09)), V.mul(H.z, -0.08)), [0.05, 0.05, 0.05], { w: 7, h: 6 });                           // the knot of hair
  }),
  // 14 Apollo: the torso bare, a cloak over the hips, a strap across the chest, a wreath, the right arm raised high with a fist (the lyre / branch is lost), the left arm down
  apollo: () => extend(human(MEL({ ...MAN, body: { sex: 'm', muscle: 0.6 }, pose: { head: [0.0, -0.15, 0.0], spine: [0, -0.04, 0.03], legs: stand([0.1, 0, 0.0], [-0.11, 0, 0.1]), arms: { R: { hand: [-0.3, 1.96, 0.1], pole: [-0.8, 0.1, -0.5], grip: 'fist' }, L: { hand: [0.28, 0.9, 0.08], pole: [0.6, -0.2, -0.8], grip: 'relaxed' } } },
    outfit: { torso: 'tunic', hem: 0.3, flare: 0.3, folds: 0.13, cape: 'none', hat: 'laurel', sash: true }, face: { age: 0.1, hair: 'curly', seed: 34 } })), (S, info) => { trunk(S, 0.35, -0.13, 0.95, 0.1); }),
};
export const STATUE_KEYS = Object.keys(SPEC);

const SCALE = 1.12;                         // figure 1.75 m -> about 1.96 m (+ the base 0.28 = 2.25 m, dossier 2.2)
export function statueFigure(key) { return cached('yek-statue-' + key + '-' + DETAIL, () => SPEC[key]()); }

export function build(K) {
  const { M, P, root, ctx } = K;
  // review fix: the shared 'plaster' (#d9ceb0) read as dark ochre in the niche shade (the photos show pale cream limestone #d9d0bc against a white wall): own near-white tint over the same weathering texture + a lift of the shadow side
  const fm = figureMats(ctx), stone = ctx.mat.toon('#f1e9d5', { map: fm.marble.map || fm.plaster.map, name: 'lmyek-statue', paint: 0.04, emissive: '#4a4536', emissiveIntensity: 0.4 });
  const mats = { main: stone, dark: fm.dark, accent: stone }, baseMat = stone;
  const labels = ctx.services.labels;
  let tris = 0;
  const cell = (i) => ({ u0: (i % 4) / 4, u1: (i % 4 + 1) / 4, v1: 1 - Math.floor(i / 4) / 4, v0: 1 - (Math.floor(i / 4) + 1) / 4 });
  P.push(C.x, 0, C.z, TH);
  STATUES.forEach((st, i) => {
    // niche frame: the position of the base centre (u, w), the outward direction (local rotation about y), the sill height
    let pu, pw, rot, y0, wallR;
    if (st.place === 'arc') {
      const phi = st.phi * Math.PI / 180, r = D.R - D.nicheD * 0.62;
      pu = r * Math.sin(phi); pw = r * Math.cos(phi); rot = phi; y0 = D.plinth;
    } else { pu = st.u; pw = PS.back - 0.27; rot = 0; y0 = PS.floor + 0.9; }
    // base (0.28 m): drawn into the module's own Parts at this frame
    P.push(pu, y0, pw, rot);
    P.box(baseMat, -0.31, 0.31, 0, 0.28, -0.3, 0.3, 'b', 1);
    P.pop();
    // the figure as its own small mesh (batched by the engine, hidden with distance)
    const fig = statueFigure(st.key);
    const set = geosOf((Q) => fig.place(Q, mats, 0, 0, 0, 0, SCALE));
    const wp = W(pu, pw);
    tris += put(root, set, wp.x, y0 + 0.28, wp.z, TH + rot, 1, 'yek-statue-' + st.key);
    K.svc.monuments.push({ id: st.id, name: st.name, x: wp.x, z: wp.z, h: 2.25 });
    // the plate under the niche
    const c = cell(i), pw0 = 0.44, ph0 = 0.25;
    let ux, uz, nu, nw, py;
    if (st.place === 'arc') {
      const phi = st.phi * Math.PI / 180, r = D.R + 0.07; ux = r * Math.sin(phi); uz = r * Math.cos(phi); nu = Math.sin(phi); nw = Math.cos(phi); py = 0.82;
    } else { ux = st.u; uz = PS.back + 0.04; nu = 0; nw = 1; py = PS.floor + 0.72; }
    const w2 = W(ux, uz), nx = nu * Math.cos(TH) + nw * Math.sin(TH), nz = -nu * Math.sin(TH) + nw * Math.cos(TH);
    if (labels && !labels.reserve('r1444351', w2.x, py, w2.z, pw0, ph0, nx, nz, 'plate')) return;
    const rt = st.place === 'arc' ? st.phi * Math.PI / 180 : 0;
    P.push(ux, py, uz, rt);
    P.quad(M.plaques, [-pw0 / 2, -ph0 / 2, 0], [pw0 / 2, -ph0 / 2, 0], [pw0 / 2, ph0 / 2, 0], [-pw0 / 2, ph0 / 2, 0], [0, 0, 1], [[c.u0, c.v0], [c.u1, c.v0], [c.u1, c.v1], [c.u0, c.v1]]);
    P.pop();
  });
  K.extraTris += tris;
}
