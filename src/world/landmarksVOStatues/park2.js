// landmarksVOStatues/park2.js - the Park of Modern Sculpture, court of the Palace of Peter II (Y1), part 2: the BUSTS on their pedestals (Bayazitov, Kantemir, Shalamov, Orbeli, Confucius, Shcherba, Hernandez,
// Gamzatov, Masaryk, Brodsky), the small animals (Hippo, Dachshund, Snail), Moore's shamrock, Gogol's armoured car (the white flag is NOT drawn: user rule), the stelae (Gumilev, Nabokov) and the four wall pieces
// mounted on the court face of the palace wall (Spiral of development, Peter II medallion, the sundial "Мы навеки" = "Атрибуты Минервы", the Fountain of Love).  Pedestal shapes, colours and poses from the dossier
// docs/research/vo-statues-2026-garden.md (4.1 bust-on-pedestal list; photos cw/*, cm/*).  The faces are generic likenesses [?] (no portrait data): hair / beard / age per person only.
import * as THREE from 'three';
import { bust, cached } from '../lib/figures.js';
import { bustOn, placeXYZ, sculpt, HF, face } from './sty.js';
import { plateOn } from './plates.js';
import { lathe, ball, loft } from './solids.js';

const B = (key, face, style = 'civil', extra = {}) => ({ key, face, style, ...extra });

// ------------------------------------------------------------------------------------------------ busts
const BUSTS = [
  { id: 'n5808194389', key: 'bayazitov', name: 'Бюст Атауллы Баязитова', x: -2911.2, z: -903.3, plate: 'bayazitov', ped: { w: 0.5, d: 0.35, h: 1.25, color: '#e8e6df', cap: '#d8d5cc' }, bust: B('bayazitov', { age: 0.5, hair: 'short', beard: 'moustache', seed: 3 }), after: (P, M) => { P.tint('#dcd9d0'); P.cyl(M.vc, [-0.2, 1.39, 0], [0.2, 1.39, 0], 0.07, 0.07, 10, true); } },
  { id: 'n5808194393', key: 'kantemir', name: 'Бюст Антиоха Кантемира', x: -2905.7, z: -894.3, plate: 'kantemir', ped: { w: 0.42, d: 0.42, h: 1.35, color: '#8e8e88' }, bust: B('kantemir', { age: 0.2, hair: 'wig', seed: 7 }, 'civil') },
  { id: 'n5808194396', key: 'shalamov', name: 'Бюст Варлама Шаламова', x: -2898.2, z: -881.7, plate: 'shalamov', ped: { w: 0.5, d: 0.28, h: 1.45, color: '#222426', cap: '#1a1b1d' }, bust: B('shalamov', { age: 0.85, hair: 'short', mouth: 'stern', seed: 12 }), after: (P, M) => { P.tint('#e8e6df'); P.box(M.vc, 0.05, 0.075, 0.5, 1.2, 0.141, 0.15, 'b'); } },
  { id: 'n5808194400', key: 'orbeli', name: 'Бюст Иосифа Орбели', x: -2891.3, z: -871.1, plate: 'orbeli', ped: { w: 0.46, d: 0.46, h: 1.3, color: '#9c4b46', cap: '#833e3a' }, bust: B('orbeli', { age: 0.75, hair: 'short', beard: 'moustache', seed: 15 }), after: (P, M) => { P.tint('#833e3a'); for (const s of [-1, 1]) P.cyl(M.vc, [s * 0.29, 1.05, 0], [s * 0.29, 1.28, 0], 0.045, 0.045, 8, true); } },
  { id: 'n5808194390', key: 'confucius', name: 'Бюст Конфуция', x: -2908.8, z: -899.1, plate: 'confucius', ped: { w: 0.7, d: 0.5, h: 0.14, color: '#2a2b2d', cap: '#2a2b2d' }, bust: B('confucius', { age: 0.9, hair: 'short', beard: 'full', mouth: 'stern', seed: 17 }, 'bare', { bz: 0 }), after: (P, M) => { P.tint('#1d1f20'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.box(M.vc, sx * 0.34 - 0.025, sx * 0.34 + 0.025, 0.2, 1.1, sz * 0.22 - 0.025, sz * 0.22 + 0.025, 'b'); P.box(M.vc, -0.37, 0.37, 1.1, 1.15, -0.25, 0.25, 'b'); } },
  { id: 'n5808194375', key: 'shcherba', name: 'Бюст Льва Щербы', x: -2962, z: -874.3, plate: 'shcherba', ped: { w: 0.44, d: 0.44, h: 1.25, color: '#d4d2cc', cap: '#c4c2bb' }, bust: B('shcherba', { age: 0.7, hair: 'short', beard: 'moustache', seed: 19 }) },
  { id: 'n5808194402', key: 'hernandez', name: 'Бюст Мигеля Эрнандеса', x: -2882.9, z: -858.3, plate: 'hernandez', ped: { w: 0.56, d: 0.56, h: 0.5, color: '#3f6d5a', cap: '#35604f' }, bust: B('hernandez', { age: 0.3, hair: 'curly', seed: 21 }, 'civil', { scale: 0.85 }), rod: 0.5 },
  { id: 'n5808194372', key: 'gamzatov', name: 'Бюст Расула Гамзатова', x: -2947.2, z: -858.8, plate: 'gamzatov', rock: true, bust: B('gamzatov', { age: 0.7, hair: 'short', beard: 'moustache', seed: 23 }) },
];
const PEDESTAL = (b) => ({
  id: b.id, key: b.key, name: b.name, x: b.x, z: b.z, yaw: 'auto', h: 2.1, spot: 3.5, reach: 40,
  solid: [{ w: Math.max(0.7, (b.ped ? b.ped.w : 1.0) + 0.2), d: Math.max(0.6, (b.ped ? b.ped.d : 0.8) + 0.2), h: 2.0 }],
  build(P, M, K) {
    if (b.rock) {                                              // Gamzatov: a rough rock plinth
      P.tint('#8a8a84'); ball(P, M.vc, [0, 0.4, 0], [0.55, 0.45, 0.4], { w: 9, h: 6 }); ball(P, M.vc, [0.2, 0.7, -0.05], [0.4, 0.4, 0.34], { w: 8, h: 6 }); P.tint('#7a7a74'); ball(P, M.vc, [-0.3, 0.3, 0.2], [0.32, 0.28, 0.3], { w: 7, h: 5 });
      cached('vos-bust-' + b.bust.key, () => bust({ detail: 0.45, style: b.bust.style, turn: 0.15, face: b.bust.face })).place(P, M.bronzeMono, 0.1, 1.0, 0, 0, 1.0);
      plateOn(P, M, K, b.plate, 0.34, 0.17, 0.0, 0.2, 0.42, 0);
      return;
    }
    const top = bustOn(P, M, { key: b.bust.key, ped: b.ped, style: b.bust.style, face: b.bust.face, scale: b.bust.scale ?? 1.0, turn: 0.15 });
    if (b.rod) { P.tint('#4a4a3c'); P.cyl(M.vc, [0, b.ped.h + 0.06, 0], [0, b.ped.h + 0.06 + b.rod, 0], 0.025, 0.025, 6, true); }
    if (b.after) b.after(P, M);
    plateOn(P, M, K, b.plate, 0.34, 0.17, 0, Math.min(0.6, b.ped.h * 0.45), b.ped.d / 2 + 0.082, 0);
    void top;
  },
});

// ------------------------------------------------------------------------------------------------ animals
// review 2026-10-14: the hippo LIES on the red-brown granite step in dark bronze (photos otz_31 otz_32 268393), the dachshund howls (front paws on one small bronze slab, hind paws on another, head up: photos 268413 268421)
const hippo = () => ({
  id: 'n5808194406', key: 'hippo', name: 'Бегемот', x: -2903.7, z: -842.6, yaw: 'auto', h: 0.7, spot: 2.5, reach: 20, solid: [{ w: 0.6, d: 0.4, h: 0.5 }],
  build(P, M, K) {
    P.tint('#7b4640'); P.box(M.vc, -0.3, 0.3, 0, 0.14, -0.2, 0.2, 'b');                                  // the red-brown granite porch step
    P.tint('#3b4340');                                                                                    // dark bronze, 35 cm, lying with its belly on the stone
    ball(P, M.vc, [0, 0.215, -0.03], [0.105, 0.075, 0.16], { w: 12, h: 8 });                                // the barrel
    ball(P, M.vc, [0, 0.2, 0.15], [0.078, 0.062, 0.088], { w: 10, h: 7 });                                  // the head
    ball(P, M.vc, [0, 0.188, 0.225], [0.08, 0.046, 0.062], { w: 10, h: 7 });                                // the broad muzzle
    for (const s of [-1, 1]) {
      ball(P, M.vc, [s * 0.03, 0.222, 0.272], [0.015, 0.012, 0.012], { w: 5, h: 4 });                       // nostrils
      ball(P, M.vc, [s * 0.045, 0.255, 0.155], [0.017, 0.014, 0.015], { w: 5, h: 4 });                      // eyes on top of the head
      ball(P, M.vc, [s * 0.04, 0.268, 0.1], [0.012, 0.02, 0.01], { w: 5, h: 4 });                           // ears
      ball(P, M.vc, [s * 0.085, 0.17, 0.07], [0.034, 0.03, 0.065], { w: 6, h: 5 });                         // the folded front legs
      ball(P, M.vc, [s * 0.09, 0.17, -0.13], [0.04, 0.03, 0.07], { w: 6, h: 5 });                           // the hind legs
    }
    P.tint('#6a7a6c'); ball(P, M.vc, [0, 0.262, -0.03], [0.07, 0.02, 0.12], { w: 8, h: 4 });                // a verdigris sheen along the back
    plateOn(P, M, K, 'hippo', 0.2, 0.1, 0, 0.07, 0.202, 0);
  },
});
const dachshund = () => ({
  id: 'n5808194325', key: 'dachshund', name: 'Такса', x: -2921.6, z: -890.8, yaw: 'auto', h: 1.4, spot: 4, reach: 40,
  solid: [{ w: 0.6, d: 1.9, h: 1.0 }],
  build(P, M, K) {
    P.tint('#2a2c2d'); for (const z of [-0.6, 0.6]) P.box(M.vc, -0.2, 0.2, 0, 0.1, z - 0.24, z + 0.24, 'b');   // two small dark bronze slabs
    plateOn(P, M, K, 'dachshund', 0.3, 0.15, 0, 0.06, 0.842, 0);
    P.tint('#3b3a34');                                                                                    // the long bronze dog, 1.4 m: howling, head thrown up
    loft(P, M.vc, [[0, 0.5, -0.72], [0, 0.54, -0.3], [0, 0.52, 0.1], [0, 0.5, 0.42]], [[0.06, 0.07], [0.1, 0.11], [0.11, 0.125], [0.105, 0.125]], { seg: 10, per: 4 });
    ball(P, M.vc, [0, 0.5, -0.6], [0.11, 0.12, 0.15], { w: 9, h: 7 }); ball(P, M.vc, [0, 0.54, 0.4], [0.12, 0.14, 0.15], { w: 9, h: 7 });   // haunches and chest
    loft(P, M.vc, [[0, 0.6, 0.42], [0, 0.82, 0.55], [0, 1.02, 0.66]], [[0.1, 0.11], [0.075, 0.08], [0.06, 0.065]], { seg: 8, per: 4 });    // the neck rises
    ball(P, M.vc, [0, 1.1, 0.7], [0.068, 0.072, 0.1], { w: 9, h: 7, dir: [0, 0.5, 0.8] });                // the head
    loft(P, M.vc, [[0, 1.13, 0.74], [0, 1.25, 0.84], [0, 1.33, 0.92]], [[0.05, 0.045], [0.04, 0.035], [0.03, 0.026]], { seg: 8, per: 3 });  // the muzzle, pointing up and forward
    loft(P, M.vc, [[0, 1.08, 0.72], [0, 1.15, 0.86], [0, 1.2, 0.93]], [[0.03, 0.012], [0.026, 0.01], [0.02, 0.008]], { seg: 6, per: 3 });   // the open lower jaw
    P.tint('#17140f'); ball(P, M.vc, [0, 1.345, 0.93], [0.03, 0.026, 0.026], { w: 6, h: 5 });
    P.tint('#3b3a34'); for (const s of [-1, 1]) {
      ball(P, M.vc, [s * 0.075, 1.04, 0.62], [0.016, 0.075, 0.045], { w: 6, h: 5, dir: [s * 0.15, -1, 0] });                            // long ears hang
      loft(P, M.vc, [[s * 0.08, 0.46, 0.4], [s * 0.08, 0.28, 0.5], [s * 0.08, 0.1, 0.56]], [[0.045, 0.05], [0.036, 0.04], [0.04, 0.05]], { seg: 6, per: 3 });   // front legs on the front slab
      loft(P, M.vc, [[s * 0.08, 0.46, -0.6], [s * 0.08, 0.28, -0.64], [s * 0.08, 0.1, -0.62]], [[0.05, 0.055], [0.036, 0.04], [0.04, 0.05]], { seg: 6, per: 3 });   // hind legs
    }
    P.tint('#6a7a6c'); loft(P, M.vc, [[0, 0.5, 0.36], [0, 0.55, 0.45]], [[0.12, 0.012], [0.118, 0.012]], { seg: 8, per: 1 });   // the collar
    P.tint('#3b3a34'); loft(P, M.vc, [[0, 0.55, -0.78], [0, 0.75, -0.95], [0, 0.98, -0.88]], [[0.03, 0.03], [0.022, 0.022], [0.01, 0.01]], { seg: 6, per: 3 });   // the tail
  },
});
const snail = () => ({
  id: 'n5808194379', key: 'snail', name: 'Улитка', x: -2954.6, z: -884.9, yaw: 'auto', h: 0.8, spot: 2.5, reach: 30, solid: [{ w: 0.3, d: 0.8, h: 0.6 }],
  build(P, M, K) {
    P.tint('#23282a'); const a = []; for (let i = 0; i <= 14; i++) { const t = i / 14 * Math.PI; a.push([0, 0.1 + Math.sin(t) * 0.38, -0.32 + (1 - Math.cos(t)) * 0.32]); }
    loft(P, M.vc, a, 0.015, { seg: 6, per: 2 });                                                          // the iron arc it sits on
    P.tint('#3e3a2a'); const sp = []; for (let i = 0; i <= 18; i++) { const t = i / 18 * 4.4, r = 0.012 + t * 0.012; sp.push([Math.cos(t) * r * 2.2, 0.5 + Math.sin(t) * r * 2.2, 0.0]); }
    loft(P, M.vc, sp, 0.012, { seg: 6, per: 2 });                                                         // the spiral shell (35 cm)
    P.tint('#5a4a30'); loft(P, M.vc, [[0, 0.46, -0.04], [0, 0.44, 0.08], [0, 0.46, 0.2], [0, 0.55, 0.26]], [[0.03, 0.035], [0.028, 0.03], [0.025, 0.025], [0.015, 0.015]], { seg: 6, per: 3 });
    for (const s of [-1, 1]) loft(P, M.vc, [[s * 0.012, 0.55, 0.26], [s * 0.025, 0.62, 0.3]], 0.005, { seg: 4, per: 2 });
    plateOn(P, M, K, 'snail', 0.2, 0.1, 0, 0.06, 0.1, 0);
  },
});

// ------------------------------------------------------------------------------------------------ Brodsky, Moore, the armoured car, the stelae
// review 2026-10-14: Brodsky is a patinated BRONZE suitcase standing on its end with a pocket and a side handle, a rough limestone slab on top and an UPRIGHT bronze head (photos 268422 otz_34)
const brodskyHead = () => sculpt('brodsky-head', (S) => {
  S.blob('main', [0, 0.04, -0.02], [0.095, 0.1, 0.1], { w: 9, h: 7 });                                   // the skull and the neck stump
  S.tube('main', [[0, -0.02, 0], [0, 0.06, 0.0]], [[0.075, 0.075], [0.07, 0.07]], { seg: 8, per: 2 });
  face(S, HF([0, 0.1, 0.0], -0.1, 0.35, 0), { hair: 'short', mouth: 'stern', age: 0.45, scale: 1.2, seed: 27 });
}, 0.55);
const brodsky = () => ({
  id: 'n5808194361', key: 'brodsky', name: 'Бродский приехал', x: -2929.7, z: -833, yaw: 'auto', h: 1.25, spot: 3.5, reach: 20,
  solid: [{ w: 0.8, d: 0.6, h: 1.1 }],
  build(P, M, K) {
    P.tint('#47604f'); P.box(M.vc, -0.28, 0.28, 0.02, 0.8, -0.13, 0.13, 'b');                                  // the suitcase on its end
    P.tint('#35483c'); P.box(M.vc, -0.2, 0.2, 0.12, 0.52, 0.13, 0.155, 'b'); P.box(M.vc, -0.285, 0.285, 0.02, 0.06, -0.135, 0.135, 'b');   // the front pocket and the foot
    P.tint('#2c3a31'); P.box(M.vc, 0.28, 0.33, 0.45, 0.6, -0.05, 0.05, 'b'); P.box(M.vc, 0.28, 0.34, 0.58, 0.62, -0.05, 0.05, 'b');            // the carrying handle on the right side
    P.tint('#d9d2bb'); P.box(M.vc, -0.33, 0.33, 0.8, 0.86, -0.17, 0.17, 'b'); P.tint('#c9c1a8'); P.box(M.vc, -0.2, 0.26, 0.86, 0.9, -0.12, 0.12, 'b');   // the rough limestone slab
    brodskyHead().place(P, M.bronzeMono, 0.04, 0.9, 0.0, 0.5, 1.0);
    P.tint('#85857f'); P.box(M.vc, -0.3, 0.3, 0, 0.1, 0.34, 0.54, 'b');
    plateOn(P, M, K, 'brodsky', 0.3, 0.15, 0, 0.05, 0.542, 0);
  },
});
const moore = () => ({
  id: 'n5808194397', key: 'moore', name: 'Томас Мур', x: -2902.3, z: -876.5, yaw: 'auto', h: 1.9, spot: 3.5, reach: 40,
  solid: [{ w: 0.9, d: 0.6, h: 1.8 }],
  build(P, M, K) {
    P.tint('#8e8e88'); P.box(M.vc, -0.42, 0.42, 0, 0.5, -0.28, 0.28, 'b'); plateOn(P, M, K, 'moore', 0.4, 0.2, 0, 0.27, 0.292, 0);
    P.tint('#7c8a80');                                                                                       // the granite shamrock: three rough heart-shaped leaves round a bronze lattice knot, on a dark slab (photos 268405 otz_48)
    P.tint('#2e3033'); P.box(M.vc, -0.5, 0.5, 0.5, 0.58, -0.3, 0.3, 'b');
    P.tint('#8f8c84');
    for (let i = 0; i < 3; i++) {
      const a = [Math.PI / 2, Math.PI / 2 + Math.PI * 2 / 3, Math.PI / 2 + Math.PI * 4 / 3][i], cx = Math.cos(a) * 0.3, cy = 1.25 + Math.sin(a) * 0.3 - 0.0;
      P.push(cx, cy, 0, 0);
      ball(P, M.vc, [-0.1, 0.06, 0], [0.19, 0.2, 0.1], { w: 12, h: 8 }); ball(P, M.vc, [0.1, 0.06, 0], [0.19, 0.2, 0.1], { w: 12, h: 8 }); ball(P, M.vc, [0, -0.12, 0], [0.16, 0.16, 0.1], { w: 10, h: 7 });
      P.pop();
    }
    P.tint('#2e3033'); ball(P, M.vc, [0, 1.17, 0.07], [0.12, 0.14, 0.05], { w: 8, h: 6 });                    // the bronze lattice knot
    P.tint('#8e8e88'); P.cyl(M.vc, [0.0, 0.58, 0], [0.02, 0.95, 0], 0.09, 0.07, 6, true);
  },
});
// Gogol's armoured car (photos 268416 268415 otz_44): a rusty steampunk buggy, not a tank: boxy hull, a pot-shaped turret with a stove pipe, a small gun, a saw-blade disc at the front, four thin white-tyred wheels.  The white flag is NOT drawn (user rule).
const gogolcar = () => ({
  id: 'n5808194315', key: 'gogolcar', name: 'Броневик Гоголя', x: -2905.3, z: -868.3, yaw: 'auto', h: 1.9, spot: 4, reach: 40,
  solid: [{ w: 1.3, d: 2.4, h: 1.5 }],
  build(P, M, K) {
    const RUST = '#8c4a30', RUST2 = '#6e3a28', STEEL = '#5d5f5e', TYRE = '#ecebe4';
    P.tint(RUST); P.box(M.vc, -0.42, 0.42, 0.42, 0.98, -0.95, 0.5, 'b');                                          // the hull
    P.tint(RUST2); P.box(M.vc, -0.44, 0.44, 0.42, 0.5, -0.97, 0.52, 'b');                                         // the skirt
    P.quad(M.vc, [-0.42, 0.42, 0.5], [0.42, 0.42, 0.5], [0.34, 0.86, 0.95], [-0.34, 0.86, 0.95], [0, 0.6, 1]);       // the sloped nose
    P.tint(RUST); P.quad(M.vc, [-0.34, 0.86, 0.95], [0.34, 0.86, 0.95], [0.42, 0.98, 0.5], [-0.42, 0.98, 0.5], [0, 1, 0.3]);
    P.tint('#a45a3a'); for (const s of [-1, 1]) { P.box(M.vc, s * 0.425 - 0.012, s * 0.425 + 0.012, 0.55, 0.9, -0.8, 0.3, 'b'); }   // riveted side plates
    P.tint(STEEL); P.col(M.vc, 0, 0.0, 0.98, 1.34, 0.3, 0.27, 14, true); P.tint(RUST2); P.col(M.vc, 0, 0.0, 1.34, 1.4, 0.32, 0.32, 14, true);   // the turret pot with a rim
    P.tint(STEEL); P.cyl(M.vc, [-0.05, 1.18, 0.25], [-0.2, 1.1, 0.95], 0.04, 0.035, 8, true); P.cyl(M.vc, [-0.2, 1.1, 0.95], [-0.2, 1.1, 1.05], 0.05, 0.05, 8, true);   // the small gun
    P.tint('#3b3a38'); P.cyl(M.vc, [0.2, 1.0, -0.55], [0.2, 1.55, -0.55], 0.05, 0.045, 8, true); P.cyl(M.vc, [0.2, 1.55, -0.55], [0.12, 1.7, -0.55], 0.045, 0.04, 8, true);   // the stove pipe (the mast stub stays bare, no flag)
    P.tint(RUST2); P.cyl(M.vc, [-0.5, 0.78, 0.55], [-0.47, 0.78, 0.55], 0.19, 0.19, 18, true); P.tint('#b86c40'); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; P.box(M.vc, -0.5, -0.46, 0.78 + Math.sin(a) * 0.2 - 0.02, 0.78 + Math.sin(a) * 0.2 + 0.02, 0.55 + Math.cos(a) * 0.2 - 0.02, 0.55 + Math.cos(a) * 0.2 + 0.02, 'b'); }   // the saw-blade disc
    for (const sx of [-1, 1]) for (const [wz, wr] of [[-0.55, 0.26], [0.32, 0.3]]) {
      const x = sx * 0.5, N = 20, ring = Array.from({ length: N + 1 }, (_, i) => { const a = i / N * Math.PI * 2; return [x, wr + Math.sin(a) * (wr - 0.02), wz + Math.cos(a) * (wr - 0.02)]; });
      P.tint(TYRE); loft(P, M.vc, ring, 0.026, { seg: 6, per: 1, closed: true });
      P.tint('#3a3a38'); P.cyl(M.vc, [x - 0.02, wr, wz], [x + 0.02, wr, wz], 0.05, 0.05, 8, true);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI; P.cyl(M.vc, [x, wr + Math.sin(a) * (wr - 0.03), wz + Math.cos(a) * (wr - 0.03)], [x, wr - Math.sin(a) * (wr - 0.03), wz - Math.cos(a) * (wr - 0.03)], 0.005, 0.005, 4, false); }
    }
    plateOn(P, M, K, 'gogolcar', 0.3, 0.15, 0, 0.3, 0.995, 0);
  },
});
const gumilev = () => ({
  id: 'n5808194378', key: 'gumilev', name: 'Л. Н. Гумилёв', x: -2956.5, z: -883.7, yaw: 'auto', h: 1.6, spot: 3, reach: 40,
  solid: [{ w: 1.5, d: 0.4, h: 1.5 }],
  build(P, M, K) {
    // photo 503644: two rough-cut dark granite stones: a small pillar with the bronze bust (left) and a big irregular slab with the engraved map of Eurasia and the text (right)
    P.tint('#1b1c1e'); P.box(M.vc, -0.62, -0.28, 0, 1.0, -0.17, 0.17, 'b'); P.tint('#151618'); P.box(M.vc, -0.66, -0.24, 1.0, 1.05, -0.2, 0.2, 'b');
    const sh = new THREE.Shape(); sh.moveTo(-0.2, 0); sh.lineTo(0.62, 0); sh.lineTo(0.66, 0.7); sh.lineTo(0.55, 1.2); sh.lineTo(0.3, 1.38); sh.lineTo(0.05, 1.3); sh.lineTo(-0.12, 1.4); sh.lineTo(-0.22, 0.9); sh.lineTo(-0.2, 0);
    P.tint('#1d1e20'); P.extrude(M.vc, sh, -0.1, 0.2);
    P.tint('#d0a640'); P.quad(M.vc, [-0.04, 0.9, 0.103], [0.5, 0.9, 0.103], [0.5, 1.28, 0.103], [-0.04, 1.28, 0.103], [0, 0, 1]);                      // the gold map of Eurasia
    plateOn(P, M, K, 'gumilev', 0.5, 0.25, 0.25, 0.5, 0.104, 0);
    cached('vos-bust-gumilev', () => bust({ detail: 0.45, style: 'civil', turn: 0.1, face: { age: 0.75, hair: 'short', mouth: 'stern', seed: 41 } })).place(P, M.bronzeMono, -0.45, 1.05, 0, 0, 0.9);
  },
});
// Nabokov (photos 268705 otz_13): a bronze rectangular panel with a relief portrait in a circle on top of nine bronze organ pipes with a stepped lower edge; ~2.2 m
const nabokov = () => ({
  id: 'n5808194394', key: 'nabokov', name: 'Набоков', x: -2909.8, z: -888.6, yaw: 'auto', h: 2.2, spot: 3, reach: 40,
  solid: [{ w: 1.0, d: 0.35, h: 2.2 }],
  build(P, M, K) {
    P.tint('#8a8a85'); P.box(M.vc, -0.4, 0.4, 0, 0.08, -0.14, 0.14, 'b');
    P.tint('#3e3d33'); const bottoms = [0.08, 0.08, 0.2, 0.34, 0.4, 0.34, 0.2, 0.08, 0.08];                                                // pipes: the lower edge of the fringe is an arch
    bottoms.forEach((b, i) => { P.col(M.vc, -0.3 + i * 0.075, 0, b, 1.25, 0.032, 0.032, 8, true); });
    P.tint('#4a4a3c'); P.box(M.vc, -0.36, 0.36, 1.25, 2.2, -0.04, 0.04, 'b');                                                             // the bronze panel 0.72 x 0.95
    P.tint('#5a5a48'); P.cyl(M.vc, [0, 1.85, 0.04], [0, 1.85, 0.06], 0.3, 0.3, 28, true);                                                 // the relief circle
    P.tint('#6a6a56'); ball(P, M.vc, [-0.02, 1.9, 0.07], [0.07, 0.12, 0.03], { w: 6, h: 5 }); ball(P, M.vc, [0.02, 1.72, 0.07], [0.1, 0.06, 0.03], { w: 6, h: 5 }); ball(P, M.vc, [-0.02, 2.04, 0.075], [0.04, 0.05, 0.03], { w: 6, h: 5 });
    plateOn(P, M, K, 'nabokov', 0.5, 0.25, 0, 1.38, 0.045, 0);
  },
});

// ------------------------------------------------------------------------------------------------ the four wall pieces on the court face of the palace wall (mounted at the nearest edge of the courtyard ring)
const WALL = 'r2870005';
const spiral = () => ({
  id: 'n6853033783', key: 'spiral', open: true, name: 'Спираль развития', x: -2895.7, z: -845.4, mount: WALL, mountOff: 0.03, h: 2.0,
  build(P, M, K) {
    P.tint('#5a4a30'); P.box(M.vc, -0.3, 0.3, 1.0, 1.02, 0, 0.03, 'b');
    const s = []; for (let i = 0; i <= 40; i++) { const t = i / 40 * Math.PI * 5, r = 0.02 + t * 0.016; s.push([Math.cos(t) * r, 1.62 + Math.sin(t) * r, 0.045]); }
    P.tint('#8a6a3a'); loft(P, M.vc, s, 0.012, { seg: 5, per: 1 });
    plateOn(P, M, K, 'spiral', 0.5, 0.25, 0, 1.2, 0.04, 0);
  },
});
const medallion = () => ({
  id: 'n6853033770', key: 'medallion', open: true, name: 'Пётр II на коне', x: -2933.6, z: -843.4, mount: WALL, mountOff: 0.03, h: 2.4,
  build(P, M, K) {
    P.tint('#4a4a3c'); P.cyl(M.vc, [0, 1.95, 0.0], [0, 1.95, 0.05], 0.275, 0.275, 24, true);                 // a bronze disc 0.55 m
    P.tint('#6a6a56'); ball(P, M.vc, [0.0, 1.9, 0.08], [0.15, 0.09, 0.03], { w: 8, h: 6 }); ball(P, M.vc, [-0.04, 2.05, 0.085], [0.04, 0.07, 0.02], { w: 6, h: 5 });     // the horse and the rider in relief
    plateOn(P, M, K, 'peter2', 0.4, 0.2, 0, 1.45, 0.04, 0);
  },
});
const sundial = () => ({
  id: 'n6853033775', key: 'sundial26', open: true, name: 'Солнечные часы «Мы навеки»', x: -2936.4, z: -898.9, mount: WALL, mountOff: 0.03, h: 2.4,
  build(P, M, K) {
    P.tint('#e8e6df'); P.cyl(M.vc, [0, 1.9, 0.0], [0, 1.9, 0.03], 0.24, 0.24, 24, true);                       // the white dial
    P.tint('#2a2a2a'); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P.box(M.vc, Math.cos(a) * 0.2 - 0.008, Math.cos(a) * 0.2 + 0.008, 1.9 + Math.sin(a) * 0.2 - 0.02, 1.9 + Math.sin(a) * 0.2 + 0.02, 0.03, 0.034, 'b'); }
    P.tint('#3a3428'); P.cyl(M.vc, [0, 1.9, 0.03], [0.08, 2.0, 0.22], 0.012, 0.008, 5, true);                  // the gnomon
    P.tint('#4a4a3c'); ball(P, M.vc, [-0.5, 1.95, 0.06], [0.1, 0.14, 0.07], { w: 8, h: 6 }); ball(P, M.vc, [-0.5, 2.1, 0.07], [0.06, 0.05, 0.05], { w: 6, h: 5 });                     // the owl
    ball(P, M.vc, [0.5, 1.92, 0.06], [0.1, 0.08, 0.07], { w: 8, h: 6 });                                       // the helmet
    plateOn(P, M, K, 'sundial26', 0.5, 0.25, 0, 1.45, 0.04, 0);
  },
});
const loveFountain = () => ({
  id: 'n5808194383', key: 'loveFountain', name: 'Фонтан любви', x: -2947.6, z: -892, mount: WALL, mountOff: 0.03, h: 2.4,
  solid: [{ w: 1.0, d: 0.8, h: 1.0, oz: 0.4 }],
  build(P, M, K) {
    P.tint('#9c5a4c'); P.box(M.vc, -0.6, 0.6, 0.0, 2.3, 0.0, 0.14, 'b');                                         // the red granite slab 2.3 m
    P.tint('#8a4c40'); P.box(M.vc, -0.66, 0.66, 0.0, 0.12, 0.0, 0.2, 'b');
    P.tint('#4a4a3c'); P.cyl(M.vc, [0, 1.65, 0.14], [0, 1.65, 0.19], 0.34, 0.34, 24, true);                    // the bronze disc
    P.tint('#6a6a56'); for (let i = 0; i < 3; i++) ball(P, M.vc, [-0.1 + i * 0.1, 1.65 + (i % 2) * 0.05, 0.2], [0.06, 0.07, 0.02], { w: 6, h: 5 });
    P.tint('#8e8e88'); lathe(P, M.vc, [[0.0, 0.5], [0.2, 0.55], [0.44, 0.8], [0.46, 0.9], [0.4, 0.9], [0.0, 0.84]], 20, { z: 0.5 });  // the granite bowl
    P.cap(M.water, Array.from({ length: 20 }, (_, i) => [Math.cos(i / 20 * Math.PI * 2) * 0.38, 0.5 + Math.sin(i / 20 * Math.PI * 2) * 0.38]), 0.84, true, 3);
    P.tint('#4a4a3c'); ball(P, M.vc, [-0.08, 0.98, 0.5], [0.04, 0.12, 0.04], { w: 6, h: 5 }); ball(P, M.vc, [0.08, 0.96, 0.5], [0.04, 0.11, 0.04], { w: 6, h: 5 });       // Romeo and Juliet
    plateOn(P, M, K, 'loveFountain', 0.5, 0.25, 0, 1.0, 0.145, 0);
  },
});

const masaryk = () => ({
  id: 'n5808194373', key: 'masaryk', name: 'Т. Г. Масарик', x: -2950.5, z: -863.8, yaw: 'auto', h: 1.9, spot: 3.5, reach: 40,
  solid: [{ w: 0.7, d: 0.4, h: 1.8 }],
  build(P, M, K) {
    // photos 268385 cm_12: a narrow dark stele with the cut text, the bronze bust ON TOP of it, a small base slab
    P.tint('#85857f'); P.box(M.vc, -0.32, 0.32, 0, 0.1, -0.2, 0.2, 'b');
    P.tint('#2f3033'); P.box(M.vc, -0.2, 0.2, 0.1, 1.28, -0.09, 0.09, 'b'); P.tint('#26272a'); P.box(M.vc, -0.23, 0.23, 1.28, 1.34, -0.11, 0.11, 'b');
    plateOn(P, M, K, 'masaryk', 0.34, 0.17, 0, 0.6, 0.092, 0);
    cached('vos-bust-masaryk', () => bust({ detail: 0.45, style: 'civil', turn: 0.0, face: { age: 0.8, hair: 'short', beard: 'goatee', mouth: 'stern', seed: 31 } })).place(P, M.bronzeMono, 0, 1.34, 0, 0, 0.95);
  },
});
void placeXYZ;
export const PIECES = [...BUSTS.map(PEDESTAL), hippo(), dachshund(), snail(), brodsky(), masaryk(), moore(), gogolcar(), gumilev(), nabokov(), spiral(), medallion(), sundial(), loveFountain()];
