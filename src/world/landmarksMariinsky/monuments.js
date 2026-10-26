// landmarksMariinsky/monuments.js - the two bronze monuments of Teatralnaya Square built with the shared figure kit (lib/figures.js, docs/FIGURES.md); dossier docs/research/mariinsky.md 5.2, 5.3, photos 27 28 30 29 31 52.
//   GLINKA (R. R. Bach, A. R. Bach, 1906; OSM n1244913802 (-2970.4, 786.4)): standing in a frock coat, the left hand on the hip, the right in a pocket, bearded, long hair; on a dark red-brown granite
//   pedestal (3 steps, base, dado «1804—1857», a tapering shaft with the gilded Old-Russian lettering «МИХАИЛЪ ИВАНОВИЧЪ ГЛИНКА» and a bronze laurel branch, cornice, bronze plate; «ЖИЗНЬ ЗА ЦАРЯ» on the east
//   face), inside a low red-granite hemicycle (1.1 m, pierced slots in groups of four) behind it.  Faces the north-west (the Conservatory).  Total about 7.7 m (figure 3.3 + plinth 4.4).
//   RIMSKY-KORSAKOV (V. Ya. Bogolyubov, V. I. Ingal, M. A. Shepilevsky, 1952; OSM n1244913803 (-3025.9, 661.5)): seated, immersed in the score, the right hand raised to conduct; figure 3.3 m on a pink-red
//   granite pedestal 3.5 m (base slab, lower tier, die with the gilded three-line inscription, cornice).  Faces the north-north-west (Dekabristov street).
import * as THREE from 'three';
import { human, extend, cached, figureMats, V } from '../lib/figures.js';
import { MONUMENTS, SN } from './frame.js';

const GL_FACE = [-0.707, -0.707];                  // Glinka faces the north-west
export const glinkaFig = () => cached('lmM-glinka', () => extend(human({
  detail: 0.85, body: { muscle: 0.3, bulk: 1.0, shoulders: 1.0 },
  pose: {
    pelvisRot: [0, 0.06, 0.04], spine: [-0.02, -0.04, -0.03], head: [0.04, 0.12, 0],
    legs: { L: { foot: [0.11, 0, 0.02], yaw: 0.15 }, R: { foot: [-0.11, 0, -0.06], yaw: -0.2 } },
    arms: { L: { hand: [0.27, 0.99, -0.02], pole: [1, 0, -0.55], grip: 'fist', palm: [0.3, 0, 1] }, R: { hand: [-0.2, 0.82, 0.1], pole: [-0.7, -0.4, -0.6], grip: 'fist', palm: [0.5, 0.2, 0.6] } },
  },
  outfit: { torso: 'coat', hem: 0.5, flare: 0.28, folds: 0.05, open: 0.3, sleeves: 'long', trousers: 'long', boots: 0.12, collar: 'fall', buttons: true, trimKey: 'main' },
  face: { age: 0.72, hair: 'curly', beard: 'full', mouth: 'closed', brow: 0.6, jaw: 0.8, seed: 21 },
}), () => {}));
export const rkFig = () => cached('lmM-rk', () => extend(human({
  detail: 0.85, body: { muscle: 0.25, bulk: 1.05 },
  pose: {
    pelvis: [0, 0.5, -0.06], pelvisRot: [0.07, 0, 0], spine: [0.22, 0.05, 0], head: [0.5, 0.0, 0],
    legs: { L: { foot: [0.13, 0, 0.36], yaw: 0.1, pole: [0, 0.2, 1] }, R: { foot: [-0.14, 0, 0.34], yaw: -0.18, pole: [0, 0.2, 1] } },
    arms: { R: { hand: [-0.2, 0.72, 0.33], pole: [-0.7, -0.2, -0.3], grip: 'hold', palm: [0, 1, 0] }, L: { hand: [0.2, 0.62, 0.35], pole: [0.7, -0.3, -0.3], grip: 'flat', palm: [0, 1, 0] } },
  },
  outfit: { torso: 'coat', hem: 0.36, flare: 0.3, sleeves: 'long', trousers: 'long', boots: 0.1, collar: 'fall', buttons: true, trimKey: 'main' },
  face: { age: 0.82, hair: 'short', beard: 'full', mouth: 'stern', brow: 0.7, jaw: 0.8, seed: 8 },
}), (S, info) => {
  // the open score across the knees (a big sheet) + a plaid thrown over the chair back + the chair block
  const wl = info.j.hands.L.hold, wr = info.j.hands.R.hold;
  S.sheet('main', [[0.27, 0.66, 0.1], [0.27, 0.6, 0.55], [-0.27, 0.6, 0.55], [-0.27, 0.66, 0.1]], 0.02);
  S.sheet('dark', [[0.2, 0.676, 0.2], [0.2, 0.64, 0.46], [-0.2, 0.64, 0.46], [-0.2, 0.676, 0.2]], 0.004);
  S.blob('main', [0, 0.5, -0.3], [0.34, 0.55, 0.14], { w: 8, h: 6 });                       // the high chair back
  S.blob('main', [0, 0.18, -0.12], [0.32, 0.2, 0.3], { w: 8, h: 6 });                        // the seat
  S.blob('main', [0.2, 0.18, -0.26], [0.1, 0.22, 0.12], { w: 6, h: 5 });
}));

export function build(K, M, D, svc) {
  const P = K.P, ctx = K.ctx, ph = ctx.physics, T = ctx.mat.toon, tex = ctx.tex;
  const mk = figureMats(ctx).keys('bronze', 'bronze');
  // ---------------------------------------------------------------------------------------------- Glinka
  {
    const { x, z } = MONUMENTS.glinka, [fx, fz] = GL_FACE, rot = Math.atan2(fx, fz);
    P.push(x, 0, z, rot);
    const box = (mat, hw, hd, y0, y1, skip = '', uvs = 1) => P.box(mat, -hw, hw, y0, y1, -hd, hd, skip, uvs);
    // podium of granite slabs and three low steps in front (+z)
    box(M.glinkaGraniteLight, 5.2, 4.6, 0, 0.08, 'b');
    for (let i = 0; i < 3; i++) { P.box(M.glinkaGranite, -4.4 + i * 0.3, 4.4 - i * 0.3, 0.08 + i * 0.12, 0.2 + i * 0.12, 4.4 - i * 0.55 - 0.55, 4.4 - i * 0.55, 'b'); }
    box(M.glinkaGranite, 1.9, 1.6, 0.4, 0.7);                                                  // plinth step
    box(M.glinkaGraniteLight, 1.6, 1.3, 0.7, 1.5);                                             // base block
    box(M.glinkaGranite, 1.28, 1.02, 1.5, 2.1);                                                // dado («1804—1857»)
    box(M.glinkaGraniteLight, 1.06, 0.84, 2.1, 4.15);                                          // the shaft (a slight taper is not modelled)
    box(M.glinkaGranite, 1.2, 0.97, 4.15, 4.4); box(M.graniteDark, 1.0, 0.8, 4.4, 4.5);       // cornice and the bronze plate under the figure
    // gilt lettering (front = +z) and the side inscription (east face = +x of the monument frame turned: the face towards the east)
    P.quad(M.lettersGlinka, [-0.85, 2.85, 0.855], [0.85, 2.85, 0.855], [0.85, 3.9, 0.855], [-0.85, 3.9, 0.855], [0, 0, 1]);
    P.quad(M.lettersGlinkaYears, [-0.9, 1.65, 1.035], [0.9, 1.65, 1.035], [0.9, 1.92, 1.035], [-0.9, 1.92, 1.035], [0, 0, 1]);
    P.quad(M.lettersGlinkaSide, [-1.075, 2.5, -0.62], [-1.075, 2.5, 0.62], [-1.075, 3.5, 0.62], [-1.075, 3.5, -0.62], [-1, 0, 0]);
    // the bronze laurel branch across the lower front of the shaft
    for (let i = 0; i < 16; i++) { const t = i / 15, a = 0.9 + t * 0.4, px = -0.85 + t * 1.6, py = 2.14 + 0.5 * t + 0.07 * Math.sin(t * 3.1); for (const s of [-1, 1]) P.geo(M.bronze, new THREE.SphereGeometry(1, 6, 5), px + s * 0.02, py + s * 0.05, 0.9 + 0.04, 0, 0, a * s * 0.8 + 0.3, 0.15, 0.05, 0.03); }
    P.cyl(M.bronze, [-0.9, 2.14, 0.88], [0.8, 2.7, 0.88], 0.022, 0.018, 5, false);
    glinkaFig().place(P, mk, 0, 4.5, 0, 0, 2.0);
    // the hemicycle behind (-z): a red-granite parapet with pierced slots, 1.1 m, in an arc of radius 4.4
    const slot = T('#ffffff', { map: tex.draw(256, 256, (g, w, h) => {
      g.fillStyle = '#8a5750'; g.fillRect(0, 0, w, h); g.fillStyle = '#6c403b'; g.fillRect(0, 0, w, 12); g.fillRect(0, h - 22, w, 22);
      g.fillStyle = '#1e1412'; for (let i = 0; i < 4; i++) { const cx = 40 + i * 58; g.beginPath(); g.roundRect ? g.roundRect(cx - 12, 60, 24, 130, 12) : g.rect(cx - 12, 60, 24, 130); g.fill(); }
    }, { key: 'lmM-slots', repeat: [1, 1] }), name: 'lmM-slots', paint: 0.02 });
    const R = 4.4, N = 16;
    for (let i = 0; i < N; i++) {
      const a0 = Math.PI * (0.5 + i / N) + 0, a1 = Math.PI * (0.5 + (i + 1) / N);
      const am = (a0 + a1) / 2, cx = Math.sin(am) * R, cz = Math.cos(am) * R, len = 2 * R * Math.sin((a1 - a0) / 2);
      P.push(cx, 0, cz, am + Math.PI / 2);
      P.box(M.glinkaGranite, -len / 2 - 0.02, len / 2 + 0.02, 0, 0.3, -0.3, 0.3, 'b');
      P.box(slot, -len / 2, len / 2, 0.3, 1.1, -0.22, 0.22, 'b', 1.2);
      P.box(M.glinkaGraniteLight, -len / 2 - 0.02, len / 2 + 0.02, 1.1, 1.22, -0.27, 0.27, 'b');
      P.pop();
    }
    P.pop();
    ph.addBox(x, z, 3.3, 2.6, rot, 0, 6.5);
    for (let i = 0; i < 3; i++) ph.addWalkBox(x + fx * (4.4 - i * 0.55 - 0.275), z + fz * (4.4 - i * 0.55 - 0.275), 8.8 - i * 0.6, 0.55, rot, 0.2 + i * 0.12, 0);
    for (let i = 0; i < N; i++) { const am = Math.PI * (0.5 + (i + 0.5) / N), lx = Math.sin(am) * R, lz = Math.cos(am) * R; const wx = x + lx * Math.cos(rot) + lz * Math.sin(rot), wz = z - lx * Math.sin(rot) + lz * Math.cos(rot); ph.addBox(wx, wz, 2 * R * Math.sin(Math.PI / 2 / N) + 0.1, 0.5, rot + am + Math.PI / 2, 0, 1.2); }
    svc.monuments.push({ id: 'glinka', name: 'Памятник М. И. Глинке', x, z, h: 7.9 });
    svc.photoSpots.push({ x: x + fx * 11, z: z + fz * 11, yaw: Math.round(-Math.atan2(-fx, fz) * 180 / Math.PI), name: 'Памятник Глинке' });
  }
  // ---------------------------------------------------------------------------------------------- Rimsky-Korsakov
  {
    const { x, z } = MONUMENTS.rk, rot = Math.atan2(SN[0], SN[1]);
    P.push(x, 0, z, rot);
    const box = (mat, hw, hd, y0, y1, skip = '') => P.box(mat, -hw, hw, y0, y1, -hd, hd, skip);
    box(M.rkGraniteLight, 2.4, 1.6, 0, 0.6);                                                    // base slab (two courses)
    P.box(M.rkGranite, -2.3, 2.3, 0.28, 0.32, -1.55, 1.55, 'b');
    box(M.rkGranite, 1.72, 1.2, 0.6, 1.47);                                                      // lower tier
    P.box(M.rkGraniteLight, -1.8, 1.8, 1.4, 1.5, -1.28, 1.28, 'b');
    box(M.rkGraniteLight, 1.2, 0.9, 1.47, 3.27);                                                 // the die with the inscription
    box(M.rkGranite, 1.4, 1.08, 3.27, 3.52); P.box(M.bronze, -1.15, 1.15, 3.52, 3.62, -0.88, 0.88, 'b');   // cornice, bronze plate
    P.quad(M.lettersRK, [-1.05, 2.05, 0.915], [1.05, 2.05, 0.915], [1.05, 2.95, 0.915], [-1.05, 2.95, 0.915], [0, 0, 1]);
    rkFig().place(P, mk, 0, 3.62, -0.1, 0, 2.8);
    P.pop();
    ph.addBox(x, z, 4.8, 3.2, rot, 0, 7);
    svc.monuments.push({ id: 'rimsky-korsakov', name: 'Памятник Н. А. Римскому-Корсакову', x, z, h: 7.0 });
    svc.photoSpots.push({ x: x + SN[0] * 10, z: z + SN[1] * 10, yaw: Math.round(-Math.atan2(-SN[0], SN[1]) * 180 / Math.PI), name: 'Памятник Римскому-Корсакову' });
  }
  void M;
}
