// landmarksLETI/busts.js - the three small monuments of the campus, all bronze figures from lib/figures.js (never boxes):
//   * the bust of A. S. POPOV (OSM n10272936450 (-1587.3, -4403.7), "Александру Степановичу Попову"): a bronze bust of the bearded professor on a 1.7 m pedestal of dark red granite with a bronze inscription plate;
//   * the bust of V. P. VOLOGDIN (n10272936442 (-1563.3, -4473.4), "Профессор Валентин Петрович Вологдин 1881-1953"), photo 62: a bronze bust on a tall slender dark-grey pedestal in front of the north face of the Corpus 5 tower,
//     looking north into the court, on a low granite base;
//   * the WAR MEMORIAL "Памятник студентам и сотрудникам ЛЭТИ, погибшим во время войны" (n6057829971 (-1463.9, -4461.9), photo B8): a bronze man in a long coat striding forward with an outstretched arm, a torn blade-like
//     bronze flame behind him, on a low square granite platform with steps and a bronze sign.
//   The plates are decals from the plaque atlas (tiles 5 / 6 / 7) reserved through the labels registry.  Faces of the real busts are not photographed [?]: age, beard and hair are from the portraits of the two professors.
import { human, bust, cached, figureMats } from '../lib/figures.js';
import { plaqueUV } from './art.js';
import { stage } from './shell.js';
import { makeLabels } from '../streets/labels.js';

export const SPOTS = {
  popov: { id: 'n10272936450', x: -1587.3, z: -4403.7, name: 'Памятник (бюст) А. С. Попову', rot: Math.atan2(0.934, -0.358) },
  vologdin: { id: 'n10272936442', x: -1563.3, z: -4473.4, name: 'Бюст В. П. Вологдина', rot: Math.atan2(-0.358, -0.934) },
  war: { id: 'n6057829971', x: -1463.9, z: -4461.9, name: 'Памятник студентам и сотрудникам ЛЭТИ, погибшим во время войны', rot: Math.atan2(0.358, 0.934) },
};

export function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, FM = figureMats(ctx), bk = FM.keys('bronze', 'bronze');
  const lab = ctx.services.labels || (ctx.services.labels = makeLabels());
  const placeFig = (fig, x, y, z, s = 1) => { for (const [key, g] of Object.entries(fig.geos)) P.geo(bk[key] || bk.main, g, x, y, z, 0, 0, 0, s, s, s); };
  const plate = (S, tile, cx, cy, cz, w, h, tilt, id) => {                                                      // a decal on the +z face of a pedestal, `tilt` = lean back (rad)
    const c = [S.x + Math.sin(S.rot) * cz, S.z + Math.cos(S.rot) * cz];
    if (!lab.reserve(id, c[0], cy, c[1], w, h, Math.sin(S.rot), Math.cos(S.rot), 'plate')) return;
    void tilt;
    P.push(S.x, 0, S.z, S.rot);
    P.quad(M.plaques, [cx - w / 2, cy - h / 2, cz], [cx + w / 2, cy - h / 2, cz], [cx + w / 2, cy + h / 2, cz], [cx - w / 2, cy + h / 2, cz], [0, 0, 1], plaqueUV(tile));
    P.pop();
  };

  // ------------------------------------------------------------------ Popov
  stage(K, 'popov', () => {
    const S = SPOTS.popov;
    P.push(S.x, 0, S.z, S.rot);
    P.box(FM.granite, -0.62, 0.62, 0, 0.14, -0.62, 0.62, 'b', 1.5);                                         // the base slab
    P.box(FM.graniteRed, -0.42, 0.42, 0.14, 1.62, -0.42, 0.42, 'b', 1.2);                                    // the shaft
    P.box(FM.granite, -0.5, 0.5, 1.62, 1.74, -0.5, 0.5, '', 1.5);                                           // the cap
    const f = cached('lmleti-popov', () => bust({ detail: 0.85, style: 'civil', turn: 0.1, pitch: 0.02, face: { age: 0.62, hair: 'short', beard: 'full', brow: 1.0, jaw: 0.95, nose: 1.0, mouth: 'stern', seed: 21 } }));
    placeFig(f, 0, 1.74, 0, 1.2);
    P.pop();
    plate(S, 5, 0, 0.82, 0.425, 0.55, 0.55, 0, 'lmleti-popov-plate');
    ctx.physics.addCylinder(S.x, S.z, 0.65, 0, 3.0);
    K.svc.monuments.push({ id: S.id, name: S.name, x: S.x, z: S.z, h: 3.0, r: 1.5 });
    K.svc.photoSpots.push({ x: S.x + Math.sin(S.rot) * 6, z: S.z + Math.cos(S.rot) * 6, yaw: Math.round(S.rot * 180 / Math.PI), name: 'ЛЭТИ: бюст А. С. Попова' });
  });

  // ------------------------------------------------------------------ Vologdin
  stage(K, 'vologdin', () => {
    const S = SPOTS.vologdin;
    P.push(S.x, 0, S.z, S.rot);
    P.box(FM.granite, -0.75, 0.75, 0, 0.16, -0.75, 0.75, 'b', 1.5);                                         // the base slab
    P.box(M.dark, -0.3, 0.3, 0.16, 1.5, -0.3, 0.3, 'b', 1.0);                                              // the slender shaft of dark polished stone
    P.box(FM.granite, -0.36, 0.36, 1.5, 1.62, -0.36, 0.36, '', 1.5);
    const f = cached('lmleti-vologdin', () => bust({ detail: 0.85, style: 'civil', turn: -0.08, pitch: 0.02, face: { age: 0.78, hair: 'short', beard: 'moustache', brow: 0.9, jaw: 1.0, nose: 1.1, mouth: 'stern', seed: 33 } }));
    placeFig(f, 0, 1.62, 0, 1.15);
    P.pop();
    plate(S, 6, 0, 0.82, 0.305, 0.5, 0.5, 0, 'lmleti-vologdin-plate');
    ctx.physics.addCylinder(S.x, S.z, 0.55, 0, 2.9);
    K.svc.monuments.push({ id: S.id, name: S.name, x: S.x, z: S.z, h: 2.9, r: 1.4 });
    K.svc.photoSpots.push({ x: S.x + Math.sin(S.rot) * 6, z: S.z + Math.cos(S.rot) * 6, yaw: Math.round(S.rot * 180 / Math.PI), name: 'ЛЭТИ: бюст В. П. Вологдина перед корпусом 5' });
  });

  // ------------------------------------------------------------------ the war memorial
  stage(K, 'war', () => {
    const S = SPOTS.war;
    P.push(S.x, 0, S.z, S.rot);
    P.box(FM.granite, -3.6, 3.6, 0, 0.3, -3.2, 3.2, 'b', 2.4);                                              // the low platform
    for (let i = 0; i < 2; i++) P.box(FM.granite, -2.2, 2.2, 0, 0.3 - i * 0.15, 3.2 + i * 0.4, 3.6 + i * 0.4, 'b', 1.5);       // two steps on the visitor side
    P.box(FM.graniteRed, -0.9, 0.9, 0.3, 0.9, -0.7, 0.9, 'b', 1.2);                                        // the rough plinth of the figure
    P.box(FM.granite, -0.95, 0.95, 0.9, 1.0, -0.75, 0.95, '', 1.5);
    const f = cached('lmleti-war', () => human({
      detail: 0.8,
      pose: { pelvis: [0, 0.95, 0], pelvisRot: [0.06, 0, 0], spine: [0.2, 0.0, 0], head: [-0.15, 0.1, 0.0],
        legs: { L: { foot: [0.12, 0, 0.32] }, R: { foot: [-0.14, 0, -0.28] } },
        arms: { L: { hand: [0.42, 1.78, 0.62], pole: [0.4, 0.2, -0.2], grip: 'open' }, R: { hand: [-0.3, 1.0, -0.12], pole: [-0.5, -0.3, -0.4], grip: 'fist' } } },
      outfit: { torso: 'coat', hem: 0.62, flare: 0.5, folds: 0.6, collar: 'fall', sleeves: 'long', trousers: 'long', boots: 0.35 },
      face: { age: 0.3, hair: 'short', mouth: 'stern', seed: 12 },
    }));
    placeFig(f, 0, 1.0, 0.1, 1.75);
    // the torn blade-like flame behind the figure: five tilted bronze slabs of different heights
    for (const [x, h, w, lean, z] of [[-0.95, 3.0, 0.5, 0.1, -0.8], [-0.35, 4.0, 0.55, 0.04, -1.0], [0.25, 3.4, 0.6, -0.04, -0.9], [0.8, 3.7, 0.5, -0.1, -0.85]]) {
      P.push(x, 0.9, z, 0);
      P.quad(bk.main, [-w / 2, 0, 0.12], [w / 2, 0, 0.12], [w * 0.28 + lean * h, h, 0.05], [-w * 0.28 + lean * h, h, 0.05], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.quad(bk.main, [w / 2, 0, -0.12], [-w / 2, 0, -0.12], [-w * 0.28 + lean * h, h, -0.05], [w * 0.28 + lean * h, h, -0.05], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.quad(bk.main, [-w * 0.28 + lean * h, h, 0.05], [w * 0.28 + lean * h, h, 0.05], [w * 0.28 + lean * h, h, -0.05], [-w * 0.28 + lean * h, h, -0.05], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.quad(bk.main, [-w / 2, 0, -0.12], [-w / 2, 0, 0.12], [-w * 0.28 + lean * h, h, 0.05], [-w * 0.28 + lean * h, h, -0.05], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.quad(bk.main, [w / 2, 0, 0.12], [w / 2, 0, -0.12], [w * 0.28 + lean * h, h, -0.05], [w * 0.28 + lean * h, h, 0.05], [1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.pop();
    }
    P.pop();
    plate(S, 7, 0, 0.62, 0.92, 0.7, 0.7, 0, 'lmleti-war-plate');
    ctx.physics.addWalkBox(S.x, S.z, 7.2, 6.4, S.rot, 0.3, 0);                                             // the platform: a 0.3 m step, walkable
    for (const [d, top] of [[3.4, 0.3], [3.8, 0.15]]) { const sw = ctx.physics.addWalkBox(S.x + Math.sin(S.rot) * d, S.z + Math.cos(S.rot) * d, 4.4, 0.44, S.rot, top, 0); sw.sticky = true; }   // the two steps on the visitor side
    ctx.physics.addCylinder(S.x, S.z, 1.2, 0, 4.4);
    K.svc.monuments.push({ id: S.id, name: S.name, x: S.x, z: S.z, h: 5.2, r: 4 });
    K.svc.photoSpots.push({ x: S.x + Math.sin(S.rot) * 11, z: S.z + Math.cos(S.rot) * 11, yaw: Math.round(S.rot * 180 / Math.PI), name: 'ЛЭТИ: памятник студентам и сотрудникам, погибшим на войне' });
  });
  if (K.errs) throw new Error(K.errs.join('\n'));
}
