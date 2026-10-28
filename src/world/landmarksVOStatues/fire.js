// landmarksVOStatues/fire.js - Bolshoy pr. 73-77: the MONUMENT TO THE FIREFIGHTERS OF LENINGRAD (L. K. Lazarev, arch. V. D. Popov, 1981, moved to the forecourt of the fire station No 9 on 2010-04-14) and the
// monument to V. D. SPASOVICH (2024-11-22, beside the Law faculty of SPbU).  Fire memorial, photos n3714795725/c00 c01 (opened): two bronze firemen in steel helmets and coats, entangled - the rear one with a fire axe
// raised in the right hand, the front one reeling backwards with the arms spread - a hose looped round them, a ladder behind, a pile of rubble blocks at their feet, on a polished grey granite block (1.0 x 1.0 x 0.8 m, the
// text «Подвигу пожарных Ленинграда 1941—1945»), on a cobbled square apron with a granite kerb and four small granite pyramids at the corners.  The group is ~2.8 m (the photos; Wikipedia says 5 m with the base).
// Spasovich: no photograph of the object exists: a bronze standing figure in a frock coat, 1.75 m on a low pale pedestal [W-web: 2.25 m with the pedestal], a plate; the face and the pose are generic [?].
import { human, extend, cached, V } from '../lib/figures.js';
import { plateOn } from './plates.js';
import { disc, placeTinted, loft, ball } from './solids.js';

const HELMET = (S, info) => {
  const H = info.j.head; if (!H) return;
  S.blob('main', V.add(V.add(H.c, V.mul(H.y, 0.045)), V.mul(H.z, -0.01)), [0.128, 0.105, 0.14], { dir: H.z, ref: H.x, w: 12, h: 8 });                          // the dome of the steel helmet
  S.blob('main', V.add(H.c, V.mul(H.y, 0.075)), [0.158, 0.012, 0.165], { dir: H.y, ref: H.x, w: 12, h: 5 });                                                     // the brim
};
const coat = { torso: 'coat', hem: 0.5, flare: 0.5, folds: 0.25, sleeves: 'long', collar: 'fall', trousers: 'long', boots: 0.3 };

const front = () => cached('vos-fireman-front', () => extend(human({
  detail: 0.42, body: { sex: 'm', muscle: 0.8, bulk: 1.3, shoulders: 1.2 },
  pose: { pelvis: [0, 0.88, -0.05], pelvisRot: [-0.36, 0.25, 0.1], spine: [-0.25, 0.1, 0.05], head: [-0.15, -0.3, 0.1],
    legs: { L: { foot: [0.2, 0.0, 0.28], yaw: 0.3 }, R: { foot: [-0.22, 0.0, -0.18], yaw: -0.3 } },
    arms: { R: { hand: [-0.78, 1.5, 0.12], pole: [-0.5, 0.6, -0.4], grip: 'open', palm: [0.3, -0.5, 0.8] }, L: { hand: [0.58, 1.22, 0.42], pole: [0.8, 0.1, -0.2], grip: 'open', palm: [0, 0.3, 1] } } },
  outfit: coat, face: { age: 0.35, hair: 'short', mouth: 'stern', seed: 51 },
}), HELMET));
const back = () => cached('vos-fireman-back', () => extend(human({
  detail: 0.42, body: { sex: 'm', muscle: 0.85, bulk: 1.3, shoulders: 1.2 },
  pose: { pelvis: [0, 0.9, 0], pelvisRot: [-0.1, -0.3, -0.12], spine: [-0.12, -0.15, -0.1], head: [-0.1, 0.1, -0.08],
    legs: { L: { foot: [0.15, 0.0, 0.1], yaw: 0.2 }, R: { foot: [-0.2, 0.0, -0.14], yaw: -0.2 } },
    arms: { R: { hand: [-0.12, 2.1, 0.0], pole: [-0.5, 0.2, -0.8], grip: 'fist' }, L: { hand: [0.34, 1.32, 0.34], pole: [0.8, 0.1, -0.2], grip: 'open', palm: [0, 0, 1] } } },
  outfit: coat, face: { age: 0.4, hair: 'short', mouth: 'stern', seed: 52 },
}), (S, info) => {
  HELMET(S, info);
  const w = info.j.wristR; if (w) {
    S.tube('main', [V.add(w, [0.05, -0.28, 0]), V.add(w, [0.02, 0.4, 0])], [[0.017, 0.017], [0.017, 0.017]], { seg: 6, per: 2 });                                // the axe handle
    S.blob('main', V.add(w, [-0.03, 0.4, 0]), [0.02, 0.07, 0.1], { w: 6, h: 5, ref: [0, 1, 0] });                                                                  // the axe head
    S.blob('main', V.add(w, [0.06, 0.4, 0]), [0.016, 0.03, 0.03], { w: 6, h: 5 });
  }
}));

export const PIECES = [
  {
    id: 'n3714795725', key: 'fire', name: 'Подвигу пожарных Ленинграда', x: -4882.2, z: -164.7, yaw: 30 * Math.PI / 180,   /* faces the yard, the fire station is BEHIND the group (photos c00-c02) */ h: 3.7, spot: 7, reach: 30,
    solid: [{ w: 1.6, d: 1.3, h: 3.6 }],
    build(P, M, K) {
      // cobbled apron 3.5 x 3.5 m with a granite kerb and four small pyramids
      P.tint('#8a8a84'); P.box(M.vc, -1.85, 1.85, 0.0, 0.1, -1.85, 1.85, 'b');
      const ap = M.cobble; P.quad(ap, [-1.7, 0.101, 1.7], [1.7, 0.101, 1.7], [1.7, 0.101, -1.7], [-1.7, 0.101, -1.7], [0, 1, 0], [[-0.85, -0.85], [0.85, -0.85], [0.85, 0.85], [-0.85, 0.85]]);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { P.tint('#93918c'); P.box(M.vc, sx * 1.95 - 0.16, sx * 1.95 + 0.16, 0, 0.12, sz * 1.95 - 0.16, sz * 1.95 + 0.16, 'b'); P.fan(M.vc, [[sx * 1.95 - 0.16, 0.12, sz * 1.95 - 0.16], [sx * 1.95 + 0.16, 0.12, sz * 1.95 - 0.16], [sx * 1.95, 0.32, sz * 1.95]], [0, 0.4, -1]); }
      // the polished grey block
      P.tint('#6f7274'); P.box(M.vc, -0.72, 0.72, 0.1, 0.9, -0.52, 0.52, 'b');
      plateOn(P, M, K, 'fire', 0.62, 0.31, 0, 0.48, 0.532);
      // rubble blocks, the two firemen, the ladder and the hose (one dark bronze, tinted)
      const T = { main: '#3b3e3d', dark: '#101214', accent: '#3b3e3d' };
      P.tint(T.main);
      P.box(M.vc, -0.32, 0.12, 0.9, 1.28, -0.3, 0.2, 'b'); P.box(M.vc, 0.04, 0.4, 0.9, 1.1, -0.1, 0.34, 'b'); P.box(M.vc, -0.18, 0.18, 1.28, 1.5, -0.2, 0.08, 'b');
      placeTinted(P, back(), M.vc, T, 0.2, 1.1, -0.34, -0.45, 1.0);
      placeTinted(P, front(), M.vc, T, -0.04, 1.0, 0.12, 0.2, 1.0);
      for (const s of [-1, 1]) loft(P, M.vc, [[0.45 + s * 0.18, 0.9, -0.3], [0.1 + s * 0.18, 2.05, -0.62], [-0.3 + s * 0.18, 3.0, -0.95]], 0.022, { seg: 6, per: 3 });   // ladder rails
      for (let i = 0; i < 7; i++) { const t = (i + 0.7) / 7.6; loft(P, M.vc, [[0.45 - 0.18 + (-0.75) * t, 0.9 + 2.1 * t, -0.3 - 0.65 * t], [0.45 + 0.18 + (-0.75) * t, 0.9 + 2.1 * t, -0.3 - 0.65 * t]], 0.016, { seg: 5, per: 1 }); }
      loft(P, M.vc, [[-0.5, 1.95, 0.3], [-0.85, 2.0, 0.45], [-1.05, 1.6, 0.4], [-0.9, 1.25, 0.32], [-0.55, 1.3, 0.38], [-0.6, 1.6, 0.46], [-0.95, 1.1, 0.55], [-0.85, 0.95, 0.7]], 0.032, { seg: 6, per: 5 });   // the hose loops (to the left, as in the photo)
      loft(P, M.vc, [[-0.85, 0.95, 0.7], [-0.7, 0.92, 0.9], [-0.45, 0.9, 0.85]], 0.036, { seg: 6, per: 3 });
      void ball; void disc;
    },
  },
  {
    id: 'n13175156970', key: 'spasovich', name: 'Памятник В. Д. Спасовичу', x: -4940.9, z: -129.6, clear: { r: 1.2 }, yaw: 'auto', h: 2.3, spot: 5,
    solid: [{ w: 1.0, d: 1.0, h: 2.3 }],
    build(P, M, K) {
      P.tint('#9b9a95'); P.box(M.vc, -0.55, 0.55, 0, 0.12, -0.55, 0.55, 'b');
      P.tint('#e0ddd4'); P.box(M.vc, -0.42, 0.42, 0.12, 0.5, -0.42, 0.42, 'b'); P.tint('#c9c6bc'); P.box(M.vc, -0.46, 0.46, 0.5, 0.56, -0.46, 0.46, 'b');
      plateOn(P, M, K, 'spasovich', 0.4, 0.2, 0, 0.3, 0.422);
      cached('vos-spasovich', () => extend(human({
        detail: 0.45, body: { sex: 'm', muscle: 0.3, bulk: 1.02 },
        pose: { head: [0.03, 0.15, 0], spine: [0.02, 0.05, 0], legs: { L: { foot: [0.1, 0, 0.03], yaw: 0.2 }, R: { foot: [-0.1, 0, -0.02], yaw: -0.2 } },
          arms: { R: { hand: [-0.2, 1.1, 0.22], pole: [-0.4, -0.5, -0.7], grip: 'hold' }, L: { hand: [0.26, 0.82, 0.06], pole: [0.4, -0.3, -0.8], grip: 'relaxed' } } },
        outfit: { torso: 'coat', hem: 0.62, flare: 0.1, folds: 0.05, sleeves: 'long', collar: 'fall', trousers: 'long', boots: 0.2, buttons: true },
        face: { age: 0.65, hair: 'short', beard: 'full', mouth: 'stern', seed: 61 },
      }), (S, info) => { const w = info.j.wristR; if (w) S.tube('main', [V.add(w, [-0.06, 0, 0.0]), V.add(w, [0.08, 0.02, 0.0])], [[0.022, 0.022], [0.022, 0.022]], { seg: 6, per: 2 }); }))
        .place(P, M.bronzeMono, 0, 0.56, 0, 0, 1.0);
    },
  },
];
