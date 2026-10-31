// landmarksAurora/quay.js - the monuments of the two embankments around the Aurora (docs/research/aurora.md sections 3, 6; photos 41 42):
//  * «Морякам и создателям флота России» (1996, OSM n1830948973) on the corner lawn: a round pink granite base with a flower bed, a dark column and a bronze winged figure holding a
//    small ship and a wreath;
//  * the bronze bust of Admiral P. S. Nakhimov on a grey granite pedestal before the east front of the school (OSM n1829824637);
//  * «Юный нахимовец» (OSM n6548233166): a bronze cadet on a low pedestal in the garden square south of the school.
// All statues come from the shared figure kit (lib/figures.js).
import * as THREE from 'three';
import { human, bust, addWing, extend, cached, figureMats } from '../lib/figures.js';
import { FLEET, NAKHIMOV_BUST, CADET, SHIP } from './frame.js';

export function build(K) {
  const { ctx, M, P, svc } = K, ph = ctx.physics;
  const mk = figureMats(ctx).keys('bronze', 'bronze');
  const depth = P.stack.length, unwind = () => { while (P.stack.length > depth) P.pop(); };

  // ================================================================== the fleet monument
  try {
    const rot = Math.atan2(-0.3, 0.95);                                             // toward the Neva
    P.push(FLEET.x, 0, FLEET.z, rot);
    P.col(M.pinkSlab, 0, 0, 0, 0.3, 3.4, 3.4, 24, true); P.col(M.pinkSlab, 0, 0, 0.3, 0.55, 1.5, 1.5, 16, true);
    { const g = new THREE.RingGeometry(1.7, 3.0, 24); g.rotateX(-Math.PI / 2); P.geo(M.red, g, 0, 0.36, 0); g.dispose(); const g2 = new THREE.TorusGeometry(2.35, 0.3, 5, 24); g2.rotateX(Math.PI / 2); P.geo(M.redDeep, g2, 0, 0.34, 0, 0, 0, 0, 1, 0.5, 1); g2.dispose(); }
    P.col(M.darkStone, 0, 0, 0.55, 1.0, 0.85, 0.72, 16, false); P.col(M.darkStone, 0, 0, 1.0, 6.6, 0.62, 0.56, 16, false); P.col(M.darkStone, 0, 0, 6.6, 6.9, 0.56, 0.78, 16, true);
    { const g = new THREE.TorusGeometry(0.66, 0.07, 6, 18); g.rotateX(Math.PI / 2); P.geo(mk.main, g, 0, 4.2, 0); g.dispose(); const c = new THREE.CircleGeometry(0.3, 12); P.geo(mk.main, c, 0, 4.2, 0.63); c.dispose(); }
    const fig = cached('lmAu-fleetNike', () => extend(human({
      pose: { pelvis: [0, 0.98, 0], pelvisRot: [0.22, 0, 0], spine: [-0.1, 0.1, 0], head: [-0.2, 0.1, 0],
        legs: { L: { foot: [0.1, 0, 0.12] }, R: { foot: [-0.12, 0, -0.42], lift: 0.1, toeUp: -0.5 } },
        arms: { L: { hand: [0.42, 2.05, 0.3], grip: 'hold' }, R: { hand: [-0.55, 1.75, 0.5], grip: 'hold' } } },
      body: { sex: 'f', muscle: 0.3 }, outfit: { torso: 'dress', hem: 0.9, flare: 1.4, folds: 1, sleeves: 'none' }, face: { hair: 'long', age: 0.2 }, detail: 0.8,
    }), (S, info) => {
      for (const sd of [1, -1]) addWing(S, { root: [sd * 0.1, 1.45, -0.12], side: sd, pose: 'spread', span: 1.25, key: 'main', boneKey: 'main', tilt: [0.25, 0.75, sd * 0.05] });
      const wl = info.j.wristL, wr = info.j.wristR;
      S.tube('main', [[wl[0] - 0.16, wl[1] + 0.2, wl[2]], [wl[0], wl[1] + 0.36, wl[2]], [wl[0] + 0.16, wl[1] + 0.2, wl[2]], [wl[0], wl[1] + 0.04, wl[2]]], 0.035, { closed: true, seg: 6, per: 4 });   // the wreath
      S.blob('main', [wr[0], wr[1] + 0.1, wr[2]], [0.07, 0.06, 0.24], { w: 8, h: 6 });                                                                                                           // the little ship
      S.sheet('main', [[wr[0], wr[1] + 0.16, wr[2] - 0.1], [wr[0], wr[1] + 0.16, wr[2] + 0.16], [wr[0], wr[1] + 0.56, wr[2] + 0.02]], 0.006);
      S.tube('main', [[wr[0], wr[1] + 0.12, wr[2] + 0.02], [wr[0], wr[1] + 0.6, wr[2] + 0.02]], 0.01, { seg: 4, per: 1 });
    }));
    fig.place(P, mk, 0, 6.9, 0, 0, 1.85);
    P.pop();
    ph.addCylinder(FLEET.x, FLEET.z, 1.6, 0, 9);
    svc.monuments.push({ id: 'n1830948973', name: 'Памятник морякам и создателям флота России', x: FLEET.x, z: FLEET.z, h: 10.3 });
  } catch (e) { console.error('[landmarksAurora] fleet monument:', e); unwind(); }

  // ================================================================== the bust of Admiral Nakhimov before the school
  try {
    const rot = Math.atan2(-SHIP.zx[0], -SHIP.zx[1]);                                  // facing the river (local +z = east)
    P.push(NAKHIMOV_BUST.x, 0, NAKHIMOV_BUST.z, rot);
    P.box(M.greyGranite, -1.0, 1.0, 0, 0.25, -1.0, 1.0, 'b', 1.5); P.box(M.greyGranite, -0.62, 0.62, 0.25, 0.55, -0.62, 0.62, 'b', 1.5);
    P.box(M.greyGranite, -0.5, 0.5, 0.55, 2.35, -0.5, 0.5, 'b', 1.5); P.box(M.greyGranite, -0.58, 0.58, 2.35, 2.5, -0.58, 0.58, '', 1.5);
    const tx = ctx.tex.draw(256, 128, (g, w, h) => { g.fillStyle = '#8f8b86'; g.fillRect(0, 0, w, h); g.fillStyle = '#e6dfc8'; g.textAlign = 'center'; g.textBaseline = 'middle'; const F = (ctx.tex.FONTS && ctx.tex.FONTS.serif) || 'serif'; g.font = `bold 30px ${F}`; g.fillText('АДМИРАЛ', w / 2, 42); g.fillText('П. С. НАХИМОВ', w / 2, 86); }, { key: 'lmAu-nakhimov' });
    P.quad(ctx.mat.toon('#ffffff', { map: tx, name: 'lmAu-nakhimovText' }), [-0.42, 1.25, 0.505], [0.42, 1.25, 0.505], [0.42, 1.67, 0.505], [-0.42, 1.67, 0.505], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    cached('lmAu-nakhimovBust', () => bust({ style: 'uniform', detail: 0.9, turn: 0.1, face: { hair: 'cap', beard: 'none', age: 0.6 } })).place(P, mk, 0, 2.5, 0, 0, 1.75);
    P.pop();
    ph.addBox(NAKHIMOV_BUST.x, NAKHIMOV_BUST.z, 1.4, 1.4, rot, 0, 3.6);
    svc.monuments.push({ id: 'n1829824637', name: 'Бюст адмирала П. С. Нахимова', x: NAKHIMOV_BUST.x, z: NAKHIMOV_BUST.z, h: 3.6 });
  } catch (e) { console.error('[landmarksAurora] Nakhimov bust:', e); unwind(); }

  // ================================================================== «Юный нахимовец»
  try {
    const rot = Math.atan2(0.41, 0.91);
    P.push(CADET.x, 0, CADET.z, rot);
    P.box(M.greyGranite, -0.7, 0.7, 0, 0.2, -0.7, 0.7, 'b', 1.5); P.box(M.greyGranite, -0.45, 0.45, 0.2, 0.75, -0.45, 0.45, 'b', 1.5);
    cached('lmAu-cadet', () => human({
      pose: { arms: { L: { hand: [0.26, 0.86, 0.02], grip: 'relaxed' }, R: { hand: [-0.2, 1.3, 0.2], grip: 'hold' } }, head: [-0.05, 0.15, 0] },
      body: { muscle: 0.2, bulk: 0.9 }, outfit: { torso: 'coat', hem: 0.05, collar: 'stand', sleeves: 'long', trousers: 'long', boots: true, buttons: 6, belt: true }, face: { hair: 'cap', age: 0.05 }, detail: 0.8,
    })).place(P, mk, 0, 0.75, 0, 0, 0.9);
    P.pop();
    ph.addBox(CADET.x, CADET.z, 1.0, 1.0, rot, 0, 2.5);
    svc.monuments.push({ id: 'n6548233166', name: '«Юный нахимовец»', x: CADET.x, z: CADET.z, h: 2.4 });
  } catch (e) { console.error('[landmarksAurora] cadet:', e); unwind(); }
}
