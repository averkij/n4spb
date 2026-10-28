// landmarksVOStatues/park3.js - the Park of Modern Sculpture, the cobbled yard north of the garden (Y2: Labyrinth, Alexander II, Babylon Tower, Unicorn, Nose, Kizhe, Reflection), the Gethsemane garden (GS: the
// Chalice of Atonement and five bronze compositions) and the court of the Main Building (MB: the experimental cat, the war memorial, the monument to Osip and Nadezhda Mandelstam).  Photos cw/269763 (cat), 269762
// (Mandelstam), 268358 (the tower), 268341 (the labyrinth) opened; the rest from the dossier docs/research/vo-statues-2026-garden.md.  The LABYRINTH is ~300 granite blocks on a lawn disc with a kerb (merged into one
// mesh; blocks of three tones, small yaw jitter, an open aisle); the white-flag mast of the Gogol car is in park2.js.
import * as THREE from 'three';
import { addWing } from '../lib/figures.js';
import { sculpt, limb, hooded, HF, face, V } from './sty.js';
import { plateOn } from './plates.js';
import { lathe, ball, loft, disc, frustumBox, ngon, prism } from './solids.js';

const hashf = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ------------------------------------------------------------------------------------------------ Y2
const labyrinth = () => ({
  id: 'w216655331', key: 'labyrinth', name: 'Лабиринт', x: -2942.3, z: -927.2, yaw: 0, h: 0.8, spot: 13,
  solid: [{ r: 9.2, h: 0.6 }],
  build(P, M, K) {
    P.tint('#5b8a3c'); disc(P, M.vc, 9.0, 0.05, 40, 3);
    P.tint('#8e8e88'); lathe(P, M.vc, [[9.35, 0], [9.35, 0.25], [8.95, 0.25], [8.95, 0]], 40, { caps: false });
    const tones = ['#8f8f8a', '#8f8f8a', '#8c8c87', '#9a6c63', '#74554a', '#8f8f8a'], rows = 13; let n = 0, ids = 0;
    for (let k = 0; k < rows; k++) {
      const r = 1.0 + k * 0.66, cnt = Math.round(r * 4.4 + 1);
      for (let i = 0; i < cnt; i++) {
        const a = (i + 0.5 * (k % 2)) / cnt * Math.PI * 2;
        const gapA = Math.abs(((a - Math.PI / 2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI);                 // an aisle toward +z (the entrance)
        if (k % 3 === 1 && gapA > Math.PI - 0.22) continue;
        const h1 = hashf(++ids), h2 = hashf(ids + 500), h3 = hashf(ids + 900);
        const w = 0.24 + h1 * 0.18, d = 0.2 + h2 * 0.1, h = 0.26 + h3 * 0.3;
        P.push(Math.sin(a) * r, 0.05, Math.cos(a) * r, a + (h2 - 0.5) * 0.4);
        P.tint(tones[ids % 6]); P.box(M.vc, -w / 2, w / 2, 0, h, -d / 2, d / 2, 'b');
        P.pop(); n++;
      }
    }
    void n;
    plateOn(P, M, K, 'labyrinth', 0.34, 0.17, 0, 0.18, 9.37, 0);
  },
});
// Alexander II (photos 268343 / 268367): a tall ragged bronze "tree" of beams, scrolls and tools, two folded wings and the emperor's face in the clearing of the chest; about 2.2 m on a black slab
const alexFig = () => sculpt('alexander2', (S) => {
  limb(S, [[0, 0.0, 0], [0.02, 0.6, 0.0], [-0.02, 1.2, 0.0], [0.0, 2.05, 0.0]], [[0.2, 0.17], [0.17, 0.13], [0.14, 0.11], [0.09, 0.05]], { seg: 9, per: 5 });                  // the spine of the figure
  for (let i = 0; i < 14; i++) {                                                                                                                                              // beams and scraps: long vertical splinters round the column
    const a = i / 14 * Math.PI * 2, r = 0.17 + 0.05 * Math.sin(i * 2.1), y0 = 0.1 + (i % 4) * 0.12, y1 = 0.9 + (i * 37 % 10) * 0.11;
    limb(S, [[Math.cos(a) * r, y0, Math.sin(a) * r * 0.7], [Math.cos(a) * r * 1.15, (y0 + y1) / 2, Math.sin(a) * r * 0.8], [Math.cos(a) * r * 0.9, y1, Math.sin(a) * r * 0.7]], [[0.045, 0.04], [0.05, 0.04], [0.02, 0.01]], { seg: 5, per: 3 });
  }
  for (const s of [-1, 1]) {                                                                                                                                                 // the folded wings: tall ragged blades behind the shoulders
    limb(S, [[s * 0.14, 1.15, -0.08], [s * 0.3, 1.5, -0.1], [s * 0.36, 1.95, -0.08], [s * 0.3, 2.2, -0.04]], [[0.07, 0.03], [0.085, 0.03], [0.07, 0.025], [0.02, 0.01]], { seg: 6, per: 4 });
    S.sheet('main', [[s * 0.14, 1.1, -0.1], [s * 0.34, 1.4, -0.12], [s * 0.4, 1.95, -0.1], [s * 0.3, 2.2, -0.06], [s * 0.2, 1.8, -0.08]], 0.02);
    limb(S, [[s * 0.12, 0.7, 0.1], [s * 0.2, 0.95, 0.14], [s * 0.1, 1.3, 0.16]], [[0.05, 0.05], [0.045, 0.04], [0.03, 0.03]], { seg: 5, per: 3 });                                   // the arm folded to the chest
  }
  S.blob('main', [0, 1.32, 0.04], [0.19, 0.2, 0.1], { w: 8, h: 6 });                                                                                                          // chest
  face(S, HF([0, 1.58, 0.1], 0.05, 0, 0), { hair: 'short', beard: 'moustache', mouth: 'stern', age: 0.75, scale: 1.55, seed: 31 });                                           // the face in the clearing
  limb(S, [[0, 1.38, 0.1], [0, 1.46, 0.12]], 0.05, { seg: 6, per: 2 });
}, 0.55);
const alexander2 = () => ({
  id: 'n6853033739', key: 'alexander2', name: 'Императору Александру II', x: -2956.5, z: -904.4, yaw: 'auto', h: 2.2, spot: 4, reach: 40,
  solid: [{ w: 1.0, d: 0.7, h: 2.2 }],
  build(P, M, K) {
    P.tint('#1c1d1f'); P.box(M.vc, -0.55, 0.55, 0, 0.14, -0.36, 0.36, 'b');                                                                                                   // the black granite slab (the real inscription lies on it)
    plateOn(P, M, K, 'alexander2', 0.4, 0.2, 0, 0.07, 0.362, 0);
    alexFig().place(P, M.bronzeMono, 0, 0.14, 0, 0, 1.0);
  },
});
const babel = () => ({
  id: 'n6853033741', key: 'babel', name: 'Вавилонская башня техногенной эпохи', x: -2928.1, z: -933.8, yaw: 'auto', h: 4.5, spot: 6, reach: 40,
  solid: [{ w: 2.8, d: 2.4, h: 4.4 }],
  build(P, M, K) {
    P.tint('#9a9a96'); P.box(M.vc, -1.5, 1.5, 0, 0.08, -1.3, 1.3, 'b');
    const T = [[1.25, 1.05, 0.08, 0.95], [1.0, 0.85, 0.95, 1.85], [0.78, 0.66, 1.85, 2.65], [0.58, 0.5, 2.65, 3.35], [0.4, 0.36, 3.35, 3.95]], reds = ['#b8442f', '#a63b29', '#c24e37', '#9e3726', '#b94430'];
    T.forEach(([hw, hd, y0, y1], i) => {
      P.tint(reds[i]); P.box(M.vc, -hw, hw, y0, y1, -hd, hd, 'b');
      let id = i * 40;
      for (const face of [0, 1, 2, 3]) {                                                                 // gears, pipes and plates of scrap on every face
        const rot = face * Math.PI / 2, hw2 = face % 2 ? hd : hw, wide = face % 2 ? hw : hd;
        P.push(0, 0, 0, rot);
        for (let g = 0; g < 3 + (i < 3 ? 1 : 0); g++) {
          const gx = (-0.6 + g * 0.55 + hashf(++id) * 0.2) * Math.min(1, hw2 / 1.1), gy = y0 + 0.2 + hashf(id + 9) * (y1 - y0 - 0.4), gr = 0.12 + hashf(id + 3) * 0.14;
          P.tint(reds[(i + g + face) % 5]); P.cyl(M.vc, [gx, gy, wide + 0.01], [gx, gy, wide + 0.09], gr, gr, 9 + (g % 2) * 3, true);
          P.tint('#7a2c1f'); P.cyl(M.vc, [gx, gy, wide + 0.09], [gx, gy, wide + 0.12], gr * 0.35, gr * 0.35, 6, true);
        }
        P.tint(reds[(i + 2) % 5]); P.cyl(M.vc, [hw2 - 0.1, y0 + 0.1, wide + 0.05], [hw2 - 0.1, y1 - 0.1, wide + 0.05], 0.05, 0.05, 6, true);
        P.pop();
      }
    });
    P.tint('#b8442f'); P.col(M.vc, 0, 0, 3.95, 4.7, 0.18, 0.02, 8, true);
    plateOn(P, M, K, 'babel', 0.4, 0.2, 0, 0.6, 1.07, 0);
  },
});
const unicorn = () => ({
  id: 'n6853033743', key: 'unicorn', name: 'Единорог', x: -2957, z: -935.5, yaw: 'auto', h: 2.6, spot: 5, reach: 40,
  solid: [{ w: 0.7, d: 2.2, h: 2.6 }],
  build(P, M, K) {
    P.tint('#8a8e92');                                                                                      // a horse in iron lattice: two side outlines 0.24 m apart with hoops and diagonals
    const side = (z) => [[-0.75, 1.0], [-0.72, 1.35], [-0.2, 1.46], [0.4, 1.42], [0.78, 1.28], [0.8, 0.95], [0.4, 0.86], [-0.3, 0.9], [-0.75, 1.0]].map(([a, y]) => [z, y, a]);
    for (const x of [-0.12, 0.12]) {
      loft(P, M.vc, side(x), 0.016, { seg: 5, per: 3, closed: true });
      loft(P, M.vc, [[x, 1.3, 0.75], [x, 1.7, 0.95], [x, 1.98, 1.2], [x, 2.05, 1.5], [x, 1.85, 1.75]], 0.016, { seg: 5, per: 3 });                       // neck and head
      loft(P, M.vc, [[x, 1.85, 1.75], [x, 1.7, 1.78], [x, 1.7, 1.45], [x, 1.5, 1.0]], 0.016, { seg: 5, per: 3 });
      for (const [lz, lx] of [[0.6, 0], [0.35, 0.0], [-0.5, 0], [-0.7, 0.0]]) loft(P, M.vc, [[x, 0.95, lz], [x, 0.5, lz + 0.04], [x, 0.0, lz + 0.02]], 0.016, { seg: 5, per: 2 });
      loft(P, M.vc, [[x, 1.3, -0.72], [x, 1.1, -1.0], [x, 0.7, -1.1]], 0.016, { seg: 5, per: 3 });                                                         // tail
    }
    for (let i = 0; i < 6; i++) { const z = -0.65 + i * 0.28; loft(P, M.vc, [[0, 1.46, z], [0.14, 1.2, z], [0, 0.88, z], [-0.14, 1.2, z], [0, 1.46, z]], 0.012, { seg: 4, per: 3 }); }   // hoops
    for (let i = 0; i < 5; i++) { const z = -0.55 + i * 0.3; loft(P, M.vc, [[-0.12, 1.4, z], [0.12, 0.95, z + 0.28]], 0.01, { seg: 4, per: 1 }); loft(P, M.vc, [[0.12, 1.4, z], [-0.12, 0.95, z + 0.28]], 0.01, { seg: 4, per: 1 }); }
    P.tint('#d4a82a'); P.cyl(M.vc, [0, 2.05, 1.5], [0, 2.55, 1.75], 0.03, 0.004, 6, true);                                                                    // the horn
    plateOn(P, M, K, 'unicorn', 0.3, 0.15, 0, 0.06, 0.6, 0);
  },
});
// "Нос к носу" (photos 268346 / 268347): a tall truncated rusty steel cone with a long torn slit down the front (dark inside), a rusty disc at the foot and a dark bronze grotesque head on top
const nose = () => ({
  id: 'n6853033745', key: 'nose', name: 'Нос к носу', x: -2954.2, z: -924.3, yaw: 'auto', h: 2.2, spot: 4, reach: 40,
  solid: [{ r: 0.6, h: 1.4 }],
  build(P, M, K) {
    P.tint('#6b3d28'); lathe(P, M.vc, [[0.98, 0.0], [0.98, 0.04], [0.9, 0.05]], 20, { bottom: true });                                              // the rusty foot plate (a disc)
    // the shell: a cone open on the +z side (phi 0 = +z in the lathe: the slit is centred on +z), dark inside, rusty skin outside
    P.tint('#1b1816'); lathe(P, M.vc2, [[0.47, 0.04], [0.4, 1.0], [0.35, 1.35]], 16, { caps: false, phi0: 0.6, phi: 5.08 });
    P.tint('#8a4a2f'); lathe(P, M.vc2, [[0.5, 0.04], [0.43, 1.0], [0.38, 1.35]], 16, { caps: false, phi0: 0.6, phi: 5.08 });
    P.tint('#2d2b28'); ball(P, M.vc, [0, 1.62, 0.0], [0.32, 0.3, 0.3], { w: 9, h: 7 });                                                            // the head: a bronze mass
    ball(P, M.vc, [0, 1.58, 0.28], [0.1, 0.1, 0.16], { w: 8, h: 6 }); ball(P, M.vc, [0.12, 1.78, 0.02], [0.14, 0.12, 0.18], { w: 7, h: 5 }); ball(P, M.vc, [-0.14, 1.74, -0.04], [0.12, 0.1, 0.14], { w: 7, h: 5 });
    P.tint('#16120f'); for (const sx of [-1, 1]) ball(P, M.vc, [sx * 0.11, 1.66, 0.22], [0.04, 0.03, 0.03], { w: 5, h: 4 });
    plateOn(P, M, K, 'nose', 0.3, 0.15, 0, 0.1, 0.99, 0);
  },
});
const kizhe = () => ({
  id: 'n6853033740', key: 'kizhe', name: 'Подпоручик Киже', x: -2926.9, z: -924.6, yaw: -149 * Math.PI / 180,   /* the wall is behind the platform (photos 268362 otz_16) */ h: 2.0, spot: 4, reach: 40,
  solid: [{ w: 1.2, d: 0.9, h: 1.9 }],
  build(P, M, K) {
    P.tint('#2f5fd0');                                                                                     // the lieutenant as a blue wire outline (two silhouettes 0.16 m apart) behind a desk
    const pts = [[-0.17, 0], [-0.15, 0.85], [-0.28, 0.92], [-0.3, 1.45], [-0.15, 1.55], [-0.08, 1.6], [-0.13, 1.7], [-0.1, 1.82], [0, 1.86], [0.1, 1.82], [0.13, 1.7], [0.08, 1.6], [0.15, 1.55], [0.3, 1.45], [0.28, 0.92], [0.15, 0.85], [0.17, 0], [0.05, 0], [0, 0.8], [-0.05, 0], [-0.17, 0]];
    for (const z of [-0.08, 0.08]) loft(P, M.vc, pts.map(([x, y]) => [x, y, z]), 0.012, { seg: 4, per: 1 });
    for (let i = 0; i < 8; i++) { const p = pts[2 + i * 2]; if (p) loft(P, M.vc, [[p[0], p[1], -0.08], [p[0], p[1], 0.08]], 0.008, { seg: 4, per: 1 }); }
    for (const s of [-1, 1]) loft(P, M.vc, [[s * 0.3, 1.45, 0], [s * 0.36, 1.2, 0.1], [s * 0.2, 1.05, 0.2]], 0.012, { seg: 4, per: 2 });
    P.tint('#3a3a3c'); P.box(M.vc, -0.5, 0.5, 0.74, 0.8, 0.28, 0.78, 'b'); for (const sx of [-1, 1]) for (const sz of [0.34, 0.72]) P.box(M.vc, sx * 0.46 - 0.025, sx * 0.46 + 0.025, 0, 0.74, sz - 0.025, sz + 0.025, 'b');
    P.tint('#e8e6df'); P.box(M.vc, -0.2, 0.15, 0.8, 0.805, 0.4, 0.7, 'b');
    plateOn(P, M, K, 'kizhe', 0.3, 0.15, 0.3, 0.55, 0.782, 0);
  },
});
// "Размышление" (photos 268353 / 268354): a tall rough dark stone slab (lava of Vesuvius) with a round hole through it, on a low grey plinth
const reflection = () => ({
  id: 'n6853033742', key: 'reflection', name: 'Размышление: прошлое, настоящее, будущее', x: -2949.8, z: -937.8, yaw: 'auto', h: 1.6, spot: 4, reach: 40,
  solid: [{ r: 0.7, h: 1.6 }],
  build(P, M, K) {
    P.tint('#7b7d80'); P.box(M.vc, -0.75, 0.75, 0, 0.1, -0.5, 0.5, 'b');
    // the slab: a rough leaning monolith 1.0 m wide, 1.55 m tall, 0.42 m thick, with a round hole 0.32 m across at 1.05 m
    const sh = new THREE.Shape(); sh.moveTo(-0.46, 0.1); sh.lineTo(0.46, 0.1); sh.lineTo(0.5, 0.7); sh.lineTo(0.38, 1.2); sh.lineTo(0.14, 1.58); sh.lineTo(-0.12, 1.5); sh.lineTo(-0.34, 1.0); sh.lineTo(-0.5, 0.5); sh.lineTo(-0.46, 0.1);
    const hole = new THREE.Path(); hole.absarc(0.0, 1.05, 0.16, 0, Math.PI * 2, true); sh.holes.push(hole);
    P.tint('#4a4540'); { const g = new THREE.ExtrudeGeometry(sh, { depth: 0.42, bevelEnabled: false, curveSegments: 12 }); P.geo(M.vc, g, 0, 0, -0.21); g.dispose(); }
    plateOn(P, M, K, 'reflection', 0.5, 0.25, 0.0, 0.05, 0.502, 0);
  },
});

// ------------------------------------------------------------------------------------------------ GS: the Gethsemane garden
const BLOCK = (P, M, w = 0.5) => { P.tint('#2b2c2e'); P.box(M.vc, -w, w, 0, 0.28, -w, w, 'b'); };
const GS = (id, key, name, x, z, plate, scene) => ({
  id, key, name, x, z, yaw: 'auto', h: 1.6, spot: 3.5, reach: 40,
  solid: [{ w: 1.1, d: 1.1, h: 1.4 }],
  build(P, M, K) {
    P.tint('#8a8a84'); disc(P, M.cobble, 1.25, 0.04, 24, 2);
    BLOCK(P, M, 0.55);
    plateOn(P, M, K, plate, 0.34, 0.17, 0, 0.14, 0.562, 0);
    P.push(0, 0.28, 0, 0); scene(P, M); P.pop();
  },
});
const gsFig = (key, fn) => sculpt(key, fn, 0.55);
const arrest = gsFig('gs-arrest', (S) => { hooded(S, 0, 0, 0, 0.95, 0.2, 0.12, [[0.2, 0.7, 0.2]]); hooded(S, -0.34, 0.1, 0.5, 0.9, 0.19, 0.2, [[0.2, 0.75, 0.3]]); hooded(S, 0.34, 0.1, -0.5, 0.9, 0.19, 0.2, [[-0.2, 0.75, 0.3]]); });
const pilate = gsFig('gs-pilate', (S) => { hooded(S, -0.3, -0.1, 0.4, 0.72, 0.2, 0.05, [[0.2, 0.55, 0.3]]); hooded(S, 0.32, 0.12, -0.5, 0.95, 0.19, 0.18, null); S.tube('main', [[-0.5, 0.0, -0.1], [-0.5, 0.2, -0.1]], [[0.2, 0.2], [0.2, 0.2]], { seg: 6, per: 1 }); });
const washing = gsFig('gs-washing', (S) => { hooded(S, -0.3, -0.1, 0.4, 0.75, 0.2, 0.04, [[0.18, 0.4, 0.3]]); hooded(S, 0.28, 0.15, -0.6, 0.5, 0.22, 0.4, [[-0.15, 0.2, -0.2]]); S.blob('dark', [0, 0.06, 0.12], [0.16, 0.06, 0.16], { w: 8, h: 5 }); });
const rest = gsFig('gs-rest', (S) => { hooded(S, -0.35, 0, 0.3, 0.95, 0.2, 0.05, null); hooded(S, 0.18, 0.05, -0.2, 0.62, 0.24, 0.1, [[0.1, 0.38, 0.3]]); S.blob('main', [0.1, 0.42, 0.22], [0.07, 0.07, 0.06], { w: 7, h: 5 });
  S.blob('main', [0.62, 0.3, -0.3], [0.2, 0.2, 0.36], { w: 8, h: 6, dir: [0.3, 0, 1] }); S.blob('main', [0.55, 0.5, -0.02], [0.1, 0.12, 0.14], { w: 7, h: 5 }); });
const kiss = gsFig('gs-kiss', (S) => { hooded(S, -0.22, 0, 0.3, 0.98, 0.2, 0.1, [[0.1, 0.8, 0.28]]); hooded(S, 0.22, 0.04, -0.4, 0.94, 0.2, 0.18, [[-0.14, 0.6, 0.26]]); });
const GS_PIECES = [
  GS('n6853033701', 'gsArrest', 'Взятие под стражу', -2893.4, -923.3, 'arrest', (P, M) => arrest.place(P, M.bronzeMono, 0, 0, 0, 0, 1)),
  GS('n6853033700', 'gsPilate', 'Иисус перед Пилатом', -2891, -926, 'pilate', (P, M) => pilate.place(P, M.bronzeMono, 0, 0, 0, 0, 1)),
  GS('n6853033703', 'gsWashing', 'Омовение ног', -2887.2, -920, 'washing', (P, M) => washing.place(P, M.bronzeMono, 0, 0, 0, 0, 1)),
  GS('n6853033698', 'gsRest', 'Отдых на пути в Египет', -2898, -935.7, 'rest', (P, M) => rest.place(P, M.bronzeMono, 0, 0, 0, 0, 1)),
  GS('n6853033702', 'gsKiss', 'Целование Иуды', -2890.5, -919.3, 'kiss', (P, M) => kiss.place(P, M.bronzeMono, 0, 0, 0, 0, 1)),
  {
    id: 'n6853033699', key: 'chalice', name: 'Чаша искупления', x: -2890.4, z: -922.2, yaw: 'auto', h: 3.4, spot: 5, reach: 40,
    solid: [{ w: 0.7, d: 0.7, h: 3.2 }],
    build(P, M, K) {
      P.tint('#8a8a84'); disc(P, M.cobble, 2.0, 0.04, 28, 2);
      P.tint('#85857f'); P.box(M.vc, -0.35, 0.35, 0, 0.14, -0.35, 0.35, 'b'); P.tint('#8e8e88'); P.box(M.vc, -0.22, 0.22, 0.14, 2.9, -0.22, 0.22, 'b');
      P.tint(M.PAL.bronzeNew); lathe(P, M.vc, [[0.02, 2.9], [0.2, 2.95], [0.26, 3.1], [0.3, 3.3], [0.24, 3.3], [0.16, 3.1], [0.04, 3.05], [0.02, 3.0]], 18);
      plateOn(P, M, K, 'chalice', 0.34, 0.17, 0, 0.7, 0.232, 0);
    },
  },
];

// ------------------------------------------------------------------------------------------------ MB: the court of the Main Building
const cat = sculpt('cat', (S) => {
  S.blob('main', [0, 0.42, -0.05], [0.2, 0.42, 0.26], { w: 10, h: 8 });
  S.blob('main', [0, 0.8, 0.06], [0.12, 0.13, 0.12], { w: 8, h: 6 });
  S.blob('main', [0, 0.16, -0.12], [0.24, 0.16, 0.3], { w: 9, h: 6 });
  limb(S, [[-0.09, 0.62, 0.12], [-0.1, 0.3, 0.2], [-0.1, 0.02, 0.22]], [[0.06, 0.06], [0.05, 0.05], [0.055, 0.07]], { seg: 6, per: 3 });
  limb(S, [[0.09, 0.62, 0.12], [0.1, 0.3, 0.2], [0.1, 0.02, 0.22]], [[0.06, 0.06], [0.05, 0.05], [0.055, 0.07]], { seg: 6, per: 3 });
  S.blob('main', [0, 0.95, 0.09], [0.15, 0.14, 0.14], { w: 10, h: 8 });
  for (const s of [-1, 1]) { S.blob('main', [s * 0.09, 1.08, 0.07], [0.04, 0.07, 0.02], { w: 5, h: 4, dir: [s * 0.2, 1, 0] }); S.blob('dark', [s * 0.055, 0.97, 0.22], [0.02, 0.025, 0.01], { w: 5, h: 4 }); }
  S.blob('dark', [0, 0.92, 0.235], [0.02, 0.015, 0.01], { w: 5, h: 4 });
  limb(S, [[0.0, 0.1, -0.35], [0.26, 0.06, -0.4], [0.34, 0.12, -0.22]], [[0.04, 0.04], [0.035, 0.035], [0.02, 0.02]], { seg: 6, per: 3 });
}, 0.55);
const catPiece = () => ({
  id: 'n1584460030', key: 'cat', name: 'Памятник подопытной кошке', x: -2987.9, z: -987.6, clear: { r: 3.0, drivable: true }, yaw: 'auto', h: 3.5, spot: 6, reach: 40,
  solid: [{ r: 1.3, h: 1.0 }, { w: 0.7, d: 0.7, h: 3.4 }],
  build(P, M, K) {
    const oct = ngon(2.6, 8, Math.PI / 8), oct2 = ngon(2.4, 8, Math.PI / 8);
    P.tint('#9a9a94'); prism(P, M.vc, oct, 0, 0.2, { top: false }); for (let i = 0; i < 8; i++) { const a = oct[i], b = oct[(i + 1) % 8], c = oct2[(i + 1) % 8], d = oct2[i]; P.quad(M.vc, [a[0], 0.2, a[1]], [b[0], 0.2, b[1]], [c[0], 0.2, c[1]], [d[0], 0.2, d[1]], [0, 1, 0]); }
    P.tint('#6a9a46'); P.cap(M.vc, oct2, 0.1, true, 3);
    P.tint('#8e8e88'); P.col(M.vc, 0, 0, 0, 0.22, 1.35, 1.3, 20, true);
    P.tint('#23282a'); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, b = (i + 1) / 8 * Math.PI * 2; P.cyl(M.vc, [Math.sin(a) * 1.2, 0.22, Math.cos(a) * 1.2], [Math.sin(a) * 1.2, 1.0, Math.cos(a) * 1.2], 0.02, 0.02, 5, true); P.cyl(M.vc, [Math.sin(a) * 1.2, 1.0, Math.cos(a) * 1.2], [Math.sin(b) * 1.2, 1.0, Math.cos(b) * 1.2], 0.02, 0.02, 5, true); P.cyl(M.vc, [Math.sin(a) * 1.2, 0.3, Math.cos(a) * 1.2], [Math.sin(b) * 1.2, 0.95, Math.cos(b) * 1.2], 0.012, 0.012, 4, false); P.cyl(M.vc, [Math.sin(a) * 1.2, 0.95, Math.cos(a) * 1.2], [Math.sin(b) * 1.2, 0.3, Math.cos(b) * 1.2], 0.012, 0.012, 4, false); }
    P.tint('#8e8e88'); P.col(M.vc, 0, 0, 0.22, 0.95, 0.27, 0.27, 16, true);
    P.tint('#9a9a94'); P.box(M.vc, -0.26, 0.26, 0.95, 1.9, -0.26, 0.26, 'b'); P.tint('#84847e'); P.box(M.vc, -0.31, 0.31, 1.9, 2.0, -0.31, 0.31, 'b');
    P.tint('#8e8e88'); P.col(M.vc, 0, 0, 2.0, 2.3, 0.22, 0.22, 16, true);
    P.tint('#1d1f20'); P.col(M.vc, 0, 0, 2.3, 2.6, 0.27, 0.27, 16, true);
    plateOn(P, M, K, 'cat', 0.48, 0.24, 0, 1.4, 0.272, 0);
    cat.place(P, M.bronzeMono, 0, 2.6, 0, 0, 1.0);
  },
});
// "В бессмертие ушедшим" (photo 269758): a broad grey granite stele (2.4 m wide, 3.2 m tall, a trapezoid foot on a low step), the bronze round relief of marching soldiers (1.7 m) high on it
const warMemorial = () => ({
  id: 'n6853033724', key: 'warMemorial', name: 'В бессмертие ушедшим', x: -2904.4, z: -948.7, yaw: 118 * Math.PI / 180,   /* the brick wall of the Main Building is behind the relief (photos 269758 268274) */ h: 3.4, spot: 6, reach: 40,
  solid: [{ w: 2.5, d: 0.9, h: 3.3 }],
  build(P, M, K) {
    P.tint('#8a8a84'); P.box(M.vc, -1.5, 1.5, 0, 0.12, -0.5, 0.5, 'b');
    P.tint('#8d8d87'); frustumBox(P, M.vc, 0.95, 0.4, 0.82, 0.3, 0.12, 1.6);                                            // the trapezoid foot
    P.tint('#7b7b76'); P.box(M.vc, -1.2, 1.2, 1.6, 3.2, -0.3, 0.3, 'b');                                                // the upper slab with the round relief
    P.tint('#3c3d36'); P.cyl(M.vc, [0, 2.35, 0.3], [0, 2.35, 0.38], 0.85, 0.85, 30, true);                               // the bronze disc 1.7 m
    P.tint('#555649'); P.cyl(M.vc, [0, 2.35, 0.38], [0, 2.35, 0.42], 0.78, 0.78, 30, true);
    P.tint('#6e6f5e'); for (let i = 0; i < 9; i++) { const x = -0.6 + i * 0.15, h = 0.42 + 0.06 * Math.sin(i * 1.7); P.box(M.vc, x - 0.045, x + 0.045, 2.0, 2.0 + h, 0.42, 0.455, 'b'); ball(P, M.vc, [x, 2.0 + h + 0.05, 0.45], [0.05, 0.055, 0.03], { w: 6, h: 5 }); }   // the marching figures
    plateOn(P, M, K, 'warmemorial', 0.62, 0.31, 0, 1.0, 0.402, 0);
  },
});
const mandelstam = () => ({
  id: 'n6853033730', key: 'mandelstam', name: 'Памятник Осипу и Надежде Мандельштам', x: -2918.3, z: -964.6, yaw: 170 * Math.PI / 180,   /* the yellow wall is behind (photo 269762) */ h: 3.4, spot: 6, reach: 40,
  solid: [{ w: 1.3, d: 1.3, h: 1.3 }, { r: 0.3, h: 3.0 }],
  build(P, M, K) {
    P.tint('#8a8a84'); disc(P, M.cobble, 2.4, 0.04, 28, 2);
    P.tint('#2e3a3c'); frustumBox(P, M.vc, 0.62, 0.62, 0.46, 0.46, 0, 1.15);                                    // a tapering cast pedestal
    P.tint('#38474a'); P.box(M.vc, -0.5, 0.5, 1.15, 1.2, -0.5, 0.5, 'b');
    plateOn(P, M, K, 'mandelstam', 0.6, 0.3, 0, 0.6, 0.62, 0);
    P.tint('#2e3a3c'); lathe(P, M.vc, [[0.09, 1.2], [0.1, 1.5], [0.38, 1.62], [0.4, 1.68], [0.3, 1.68], [0.1, 1.6], [0.07, 1.75], [0.07, 2.4]], 16);       // stem and bowl
    const pair = sculpt('mandelstam-pair', (S) => {                                                                // two flying figures in rough bronze, one carrying the other
      limb(S, [[0.0, 0.0, 0.0], [-0.1, 0.25, 0.0], [-0.34, 0.5, 0.04], [-0.6, 0.62, 0.05]], [[0.09, 0.1], [0.12, 0.12], [0.1, 0.1], [0.05, 0.05]], { seg: 8, per: 4 });
      S.blob('main', [-0.72, 0.64, 0.05], [0.09, 0.1, 0.1], { w: 8, h: 6 });
      limb(S, [[0.04, 0.12, 0.0], [0.2, 0.42, 0.02], [0.06, 0.74, 0.0], [-0.16, 0.8, 0.0]], [[0.08, 0.08], [0.1, 0.1], [0.08, 0.08], [0.04, 0.04]], { seg: 8, per: 4 });
      S.blob('main', [-0.26, 0.83, 0.0], [0.08, 0.09, 0.09], { w: 8, h: 6 });
      addWing(S, { root: [-0.15, 0.55, 0.05], side: -1, pose: 'spread', span: 0.75, key: 'accent' }); addWing(S, { root: [0.0, 0.55, 0.05], side: 1, pose: 'half', span: 0.7, key: 'accent' });
    }, 0.5);
    pair.place(P, M.bronzeMono, 0.1, 2.4, 0, 0, 1.0);
  },
});

void V;
export const PIECES = [labyrinth(), alexander2(), babel(), unicorn(), nose(), kizhe(), reflection(), ...GS_PIECES, catPiece(), warMemorial(), mandelstam()];
