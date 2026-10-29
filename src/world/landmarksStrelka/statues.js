// landmarksStrelka/statues.js - the figures of the Spit ensemble, built with the shared figure kit (lib/figures.js; figures face +z, stand on y = 0, are 1.75 m tall standing: the caller scales them).
//   riverGod(k)   the four seated colossi at the feet of the Rostral columns (Pudost limestone, ~4.3 m seated; J. Camberlin / J. Thibault, 1810; photos refs/strelka fig_01 fig_02 rc_02 rc_09):
//                 0 Dnieper (north column, outer side): bearded, wreath, bare torso, the right hand on a green rudder, the left arm on an urn;
//                 1 Volga (north column, garden side): a woman in a long dress with a diadem, a staff in the right hand, a cornucopia in the left arm;
//                 2 Volkhov (south column, garden side): bearded, bare torso, a tall green oar held upright in the right hand;
//                 3 Neva (south column, outer side): a woman in a long dress, a rudder at her side, the left hand in her lap.
//   exchangeGroup(k)  the two attic groups of the Exchange (ex_01 ex_08): 0 east = Neptune standing with the trident between two reclining rivers; 1 west = Navigation (a woman) with Mercury and two rivers.
//   customsStatue(k)  the three copper statues of the Customs house pediment (cu_04 cu_11): 0 Mercury (winged cap, caduceus raised, a foot on a ball), 1 Neptune (trident), 2 Ceres (a sheaf / sickle).
// Material keys: main (stone / copper), dark (eyes, mouth), accent (the green metal attributes of the river gods).
import { human, extend, cached, V } from '../lib/figures.js';

const SIT = (extra = {}) => ({ pelvis: [0, 0.52, -0.05], pelvisRot: [0.04, 0, 0], legs: { L: { foot: [0.17, 0, 0.42], yaw: 0.25, pole: [0.1, 0.2, 1] }, R: { foot: [-0.15, 0, 0.3], yaw: -0.3, pole: [-0.1, 0.2, 1] } }, ...extra });
const D = 0.5;
const folds = (n, amp) => (t, th) => 1 + amp * Math.sin(th * n + t * 5);

/** a long staff / oar through the grip of a hand: up = direction, lenUp / lenDown from the hand; blade: 'oar' (a broad pointed blade at the lower end), 'rudder', 'trident', 'caduceus', null */
function staff(S, key, hold, up, lenUp, lenDown, r, tip) {
  const u = V.unit(up), top = V.add(hold, V.mul(u, lenUp)), bot = V.add(hold, V.mul(u, -lenDown));
  S.tube(key, [bot, hold, top], [[r, r], [r, r], [r * 0.9, r * 0.9]], { seg: 7, per: 4 });
  if (tip === 'oar' || tip === 'rudder') {                                   // a spade-shaped blade at the lower end
    const w = tip === 'oar' ? 0.11 : 0.15, len = tip === 'oar' ? 0.42 : 0.5, side = V.unit(V.cross(u, [0, 0, 1]));
    const a = V.add(bot, V.mul(u, len)), tipP = V.add(bot, V.mul(u, -0.1));
    S.sheet(key, [V.add(a, V.mul(side, w * 0.6)), V.add(V.add(bot, V.mul(u, 0.1)), V.mul(side, w)), tipP, V.add(V.add(bot, V.mul(u, 0.1)), V.mul(side, -w)), V.add(a, V.mul(side, -w * 0.6))], 0.012);
  }
  if (tip === 'trident') {
    const side = V.unit(V.cross(u, [0, 0, 1]));
    S.tube(key, [V.add(top, V.mul(side, -0.09)), top, V.add(top, V.mul(side, 0.09))], [[r, r], [r, r], [r, r]], { seg: 6, per: 3 });
    for (const s of [-0.09, 0, 0.09]) S.tube(key, [V.add(top, V.mul(side, s)), V.add(V.add(top, V.mul(side, s)), V.mul(u, 0.2))], [[r, r], [r * 0.3, r * 0.3]], { seg: 6, per: 3 });
  }
  if (tip === 'caduceus') {
    const side = V.unit(V.cross(u, [0, 0, 1]));
    for (const s of [1, -1]) S.tube(key, [V.add(top, V.mul(u, -0.22)), V.add(V.add(top, V.mul(u, -0.16)), V.mul(side, s * 0.05)), V.add(V.add(top, V.mul(u, -0.09)), V.mul(side, -s * 0.05)), V.add(V.add(top, V.mul(u, -0.02)), V.mul(side, s * 0.04))], 0.008, { seg: 5, per: 4 });
    for (const s of [1, -1]) S.sheet(key, [top, V.add(V.add(top, V.mul(side, s * 0.11)), V.mul(u, 0.04)), V.add(V.add(top, V.mul(side, s * 0.09)), V.mul(u, -0.03))], 0.004);
    S.blob(key, V.add(top, V.mul(u, 0.02)), [0.018, 0.018, 0.018], { w: 6, h: 4 });
  }
}
/** a drapery over the lap of a seated nude figure and hanging between the legs to the ground */
function lapCloth(S, j) {
  const p = j.pelvis, kl = j.kneeL || V.add(p, [0.17, 0, 0.4]), kr = j.kneeR || V.add(p, [-0.15, 0, 0.36]);
  S.tube('main', [V.add(p, [-0.24, -0.02, -0.02]), V.add(p, [-0.16, 0.08, 0.2]), V.add(p, [0.0, 0.1, 0.24]), V.add(p, [0.17, 0.08, 0.2]), V.add(p, [0.25, -0.02, -0.02])], [[0.05, 0.12], [0.06, 0.13], [0.06, 0.14], [0.06, 0.13], [0.05, 0.12]], { seg: 9, per: 3, bump: folds(5, 0.08) });
  S.tube('main', [V.add(kl, [-0.02, 0.06, -0.05]), V.add(V.mul(V.add(kl, kr), 0.5), [0, 0.02, 0.02]), V.add(kr, [0.02, 0.06, -0.05])], [[0.05, 0.1], [0.05, 0.12], [0.05, 0.1]], { seg: 8, per: 3 });
  const m = V.mul(V.add(kl, kr), 0.5);
  S.tube('main', [V.add(m, [0.0, 0.03, -0.02]), V.add(m, [0.01, -0.22, 0.03]), V.add(m, [-0.01, -0.42, 0.0]), [m[0], 0.02, m[2] - 0.04]], [[0.13, 0.05], [0.12, 0.045], [0.13, 0.05], [0.15, 0.06]], { seg: 9, per: 4, bump: folds(6, 0.10) });
}

export function riverGod(k) {
  return cached('lmSt-river' + k, () => {
    const male = k === 0 || k === 2;
    if (male) {
      const arms = k === 0
        ? { R: { hand: [-0.5, 0.7, 0.14], pole: [-0.7, 0.1, -0.5], grip: 'hold', palm: [0, -0.8, 0.4] }, L: { hand: [0.36, 0.84, 0.02], pole: [0.6, 0.2, -0.5], grip: 'relaxed', palm: [0, -1, 0] } }
        : { R: { hand: [-0.36, 1.42, 0.16], pole: [-0.7, -0.4, -0.2], grip: 'hold', palm: [0.6, 0, 0.6] }, L: { hand: [0.22, 0.72, 0.26], pole: [0.6, -0.2, -0.4], grip: 'relaxed', palm: [0, -1, 0] } };
      const base = human({
        detail: D, body: { sex: 'm', muscle: 0.95, bulk: 1.12, shoulders: 1.08 },
        pose: SIT({ spine: [-0.12, k === 0 ? 0.12 : -0.1, 0], head: [0.02, k === 0 ? -0.1 : 0.2, 0], arms, legs: { L: { foot: [0.2, 0, 0.5], yaw: 0.3, pole: [0.15, 0.2, 1] }, R: { foot: [-0.16, 0, 0.26], yaw: -0.3, pole: [-0.1, 0.2, 1] } } }),
        outfit: { torso: 'nude', sleeves: 'none', trousers: 'none', hat: k === 0 ? 'laurel' : 'none' },
        face: { age: 0.8, hair: 'curly', beard: 'full', brow: 0.9, nose: 1.05, mouth: 'stern', seed: 31 + k },
      });
      return extend(base, (S, info) => {
        const j = info.j, hr = j.hands.R;
        lapCloth(S, j);
        // the long beard falling on the chest
        S.tube('main', [V.add(j.headC, [0, -0.1, 0.07]), V.add(j.headC, [0.0, -0.2, 0.08]), V.add(j.headC, [0.01, -0.3, 0.07])], [[0.07, 0.045], [0.06, 0.04], [0.03, 0.02]], { seg: 8, per: 4, bump: folds(5, 0.07) });
        // a cloak falling from the left shoulder down the back to the seat
        S.tube('main', [V.add(j.shoulderL, [0.02, 0.04, -0.03]), V.add(j.chest, [0.08, -0.05, -0.17]), V.add(j.pelvis, [0.1, 0.0, -0.2]), V.add(j.pelvis, [0.28, -0.4, -0.12])], [[0.09, 0.03], [0.2, 0.035], [0.26, 0.04], [0.2, 0.05]], { seg: 9, per: 4, bump: folds(6, 0.08) });
        if (k === 0) {                                                       // Dnieper: rudder under the right hand, urn under the left arm
          staff(S, 'accent', hr.hold, [0.04, 1, -0.06], 0.05, 0.72, 0.022, 'rudder');
          const u = V.add(j.pelvis, [0.42, 0.12, -0.02]);
          S.tube('main', [V.add(u, [0, -0.2, 0]), V.add(u, [0, -0.05, 0.02]), V.add(u, [0.02, 0.12, 0.1]), V.add(u, [0.04, 0.2, 0.2])], [[0.1, 0.1], [0.15, 0.15], [0.12, 0.12], [0.07, 0.07]], { seg: 10, per: 4 });
        } else staff(S, 'accent', hr.hold, [0.02, 1, 0.02], 0.32, 1.38, 0.022, 'oar');   // Volkhov: the tall oar, blade down
      });
    }
    const base = human({
      detail: D, body: { sex: 'f', bulk: 1.08 },
      pose: SIT({ spine: [-0.06, k === 1 ? -0.08 : 0.1, 0], head: [0.0, k === 1 ? 0.12 : -0.15, 0],
        arms: k === 1 ? { R: { hand: [-0.38, 1.12, 0.2], pole: [-0.6, -0.5, -0.3], grip: 'hold', palm: [0.6, 0, 0.6] }, L: { hand: [0.26, 0.86, 0.24], pole: [0.6, -0.4, -0.3], grip: 'cup', palm: [-0.3, 0.9, 0.2] } }
          : { R: { hand: [-0.4, 0.86, 0.14], pole: [-0.6, -0.3, -0.4], grip: 'hold', palm: [0, -0.5, 0.7] }, L: { hand: [0.14, 0.74, 0.3], pole: [0.6, -0.3, -0.3], grip: 'relaxed', palm: [0, -1, 0] } } }),
      outfit: { torso: 'dress', hem: 0.72, flare: 0.55, folds: 0.07, sleeves: 'short', collar: 'none', cape: 'back', capeLen: 0.7, hat: k === 1 ? 'crown' : 'laurel', belt: true },
      face: { age: 0.35, hair: 'long', mouth: 'closed', seed: 41 + k },
    });
    return extend(base, (S, info) => {
      const j = info.j, hr = j.hands.R, hl = j.hands.L;
      if (k === 1) {                                                         // Volga: staff + cornucopia
        staff(S, 'main', hr.hold, [0.03, 1, 0.0], 0.34, 1.06, 0.02, null);
        const c = hl.hold;
        S.tube('main', [V.add(c, [0.0, -0.22, 0.0]), V.add(c, [0.03, -0.05, 0.02]), V.add(c, [0.1, 0.14, 0.03]), V.add(c, [0.2, 0.3, 0.02])], [[0.02, 0.02], [0.05, 0.05], [0.09, 0.09], [0.12, 0.12]], { seg: 9, per: 4 });
        for (const [dx, dy, dz, r] of [[0.2, 0.36, 0.02, 0.07], [0.27, 0.33, 0.05, 0.05], [0.16, 0.4, -0.03, 0.05], [0.24, 0.4, -0.02, 0.045]]) S.blob('main', V.add(c, [dx, dy, dz]), [r, r, r], { w: 7, h: 5 });
      } else staff(S, 'main', hr.hold, [0.06, 1, -0.08], 0.08, 0.86, 0.022, 'rudder');   // Neva: rudder
    });
  });
}

/** the attic groups of the Exchange: three figures on one base, built in ONE frame (the group faces +z, origin = the middle of the base front, y = 0 on the base) at monument scale (metres) */
export function exchangeGroup(k) {
  return cached('lmSt-exGroup' + k, () => {
    const centre = k === 0
      ? human({ detail: 0.4, body: { sex: 'm', muscle: 0.9, bulk: 1.1 }, pose: { head: [0, 0.1, 0], spine: [-0.05, 0.1, 0], legs: { L: { foot: [0.12, 0, 0.08] }, R: { foot: [-0.14, 0, -0.04] } }, arms: { R: { hand: [-0.36, 1.5, 0.12], pole: [-0.7, -0.3, -0.3], grip: 'hold', palm: [0.6, 0, 0.6] }, L: { hand: [0.32, 0.98, 0.2], pole: [0.6, -0.3, -0.3], grip: 'open', palm: [0, -0.4, 0.8] } } }, outfit: { torso: 'nude', cape: 'back', capeLen: 0.8, hat: 'crown' }, face: { age: 0.7, hair: 'curly', beard: 'full', seed: 51 } })
      : human({ detail: 0.4, body: { sex: 'f' }, pose: { head: [0, -0.1, 0], legs: { L: { foot: [0.1, 0, 0.04] }, R: { foot: [-0.12, 0, 0.0] } }, arms: { R: { hand: [-0.34, 1.34, 0.14], pole: [-0.7, -0.4, -0.3], grip: 'hold', palm: [0.6, 0, 0.6] }, L: { hand: [0.3, 0.92, 0.18], pole: [0.6, -0.3, -0.3], grip: 'open', palm: [0, -0.4, 0.8] } } }, outfit: { torso: 'dress', hem: 0.94, flare: 0.6, folds: 0.06, sleeves: 'short', cape: 'back', capeLen: 0.9, hat: 'crown' }, face: { age: 0.35, hair: 'long', seed: 52 } });
    // a reclining river god: seated low, leaning on an elbow, the legs stretched to the side
    const recl = (side) => human({ detail: 0.32, body: { sex: side > 0 ? 'm' : 'f', muscle: 0.8, bulk: 1.05 }, pose: { pelvis: [0, 0.3, 0], pelvisRot: [-0.35, side * 0.5, side * 0.25], spine: [0.25, -side * 0.3, -side * 0.2], head: [-0.1, -side * 0.5, 0], legs: { L: { foot: [0.3 + (side > 0 ? 0.35 : 0), 0, 0.5], yaw: 0.4, pole: [0.2, 0.6, 1] }, R: { foot: [-0.3 - (side < 0 ? 0.35 : 0), 0, 0.5], yaw: -0.4, pole: [-0.2, 0.6, 1] } }, arms: { L: { hand: [0.34, 0.42, side > 0 ? -0.1 : 0.3], pole: [0.6, 0.2, -0.5], grip: 'relaxed', palm: [0, -1, 0] }, R: { hand: [-0.34, 0.42, side < 0 ? -0.1 : 0.3], pole: [-0.6, 0.2, -0.5], grip: 'relaxed', palm: [0, -1, 0] } } }, outfit: side > 0 ? { torso: 'nude' } : { torso: 'dress', hem: 0.7, flare: 0.5, sleeves: 'none' }, face: { age: side > 0 ? 0.8 : 0.35, hair: side > 0 ? 'curly' : 'long', beard: side > 0 ? 'full' : 'none', seed: 53 + side } });
    return extend(centre, (S, info) => {
      const j = info.j;
      staff(S, 'main', j.hands.R.hold, [0.02, 1, 0.0], 0.42, 1.36, 0.02, k === 0 ? 'trident' : null);
      // the two rivers at the feet, scaled 0.86, turned outwards
      for (const side of [1, -1]) { const f = recl(side); S.push(side * 0.78, 0, 0.02, 0, side * 0.45, 0); for (const [key, g] of Object.entries(f.geos)) { const gg = g.clone(); gg.scale(0.86, 0.86, 0.86); S.add(key, gg); gg.dispose(); } S.pop(); }
      // sea horses / urns behind them: lumps that give the group its long silhouette
      for (const side of [1, -1]) {
        S.tube('main', [[side * 1.25, 0.05, -0.1], [side * 1.4, 0.45, 0.0], [side * 1.36, 0.8, 0.12], [side * 1.22, 0.95, 0.3]], [[0.16, 0.14], [0.14, 0.12], [0.09, 0.08], [0.06, 0.07]], { seg: 8, per: 4 });
        S.blob('main', [side * 1.18, 0.93, 0.4], [0.06, 0.07, 0.13], { dir: [side * -0.2, -0.3, 1], w: 7, h: 5 });
        S.tube('main', [[side * 1.25, 0.1, -0.1], [side * 1.75, 0.16, -0.05], [side * 2.05, 0.3, 0.0]], [[0.15, 0.13], [0.1, 0.09], [0.03, 0.05]], { seg: 7, per: 3 });
      }
      if (k === 1) {                                                         // Mercury beside Navigation: a caduceus rising at her left
        staff(S, 'main', V.add(j.hands.L.hold, [0.1, 0, 0]), [0.1, 1, 0], 0.5, 0.2, 0.014, 'caduceus');
      }
    });
  });
}

/** copper statues of the Customs house pediment */
export function customsStatue(k) {
  return cached('lmSt-customs' + k, () => {
    if (k === 0) {
      const base = human({ detail: 0.45, body: { sex: 'm', muscle: 0.85 }, pose: { head: [0, 0.1, 0], spine: [-0.04, 0.05, 0], legs: { L: { foot: [0.1, 0, 0.16], lift: 0.16, pole: [0.1, 0.2, 1] }, R: { foot: [-0.1, 0, -0.02] } }, arms: { R: { hand: [-0.34, 1.62, 0.1], pole: [-0.7, -0.3, -0.2], grip: 'hold', palm: [0.6, 0, 0.6] }, L: { hand: [0.26, 0.86, 0.06], pole: [0.6, -0.2, -0.4], grip: 'relaxed' } } }, outfit: { torso: 'nude', cape: 'back', capeLen: 0.55 }, face: { age: 0.25, hair: 'curly', seed: 61 } });
      return extend(base, (S, info) => {
        const j = info.j; staff(S, 'main', j.hands.R.hold, [0, 1, 0], 0.3, 0.14, 0.012, 'caduceus');
        S.blob('main', [0.1, 0.09, 0.16], [0.1, 0.1, 0.1], { w: 9, h: 6 });                                    // the ball under the left foot
        S.blob('main', V.add(j.headC, [0, 0.1, 0]), [0.1, 0.045, 0.11], { w: 8, h: 5 });                      // the winged cap (petasos)
        for (const s of [1, -1]) S.sheet('main', [V.add(j.headC, [s * 0.08, 0.1, 0]), V.add(j.headC, [s * 0.2, 0.2, -0.04]), V.add(j.headC, [s * 0.16, 0.08, -0.05])], 0.004);
        S.sheet('main', [V.add(j.shoulderL, [0, 0, -0.08]), V.add(j.pelvis, [0.3, -0.1, -0.16]), V.add(j.pelvis, [0.02, -0.5, -0.14]), V.add(j.shoulderR, [0.0, -0.1, -0.1])], 0.01);
      });
    }
    if (k === 1) {
      const base = human({ detail: 0.45, body: { sex: 'm', muscle: 0.9, bulk: 1.08 }, pose: { head: [0, -0.15, 0], legs: { L: { foot: [0.12, 0, 0.06] }, R: { foot: [-0.12, 0, -0.02] } }, arms: { R: { hand: [-0.34, 1.02, 0.14], pole: [-0.6, -0.3, -0.3], grip: 'hold', palm: [0.6, 0, 0.6] }, L: { hand: [0.24, 0.9, 0.1], pole: [0.6, -0.3, -0.4], grip: 'relaxed' } } }, outfit: { torso: 'nude', cape: 'back', capeLen: 0.7 }, face: { age: 0.75, hair: 'curly', beard: 'full', seed: 62 } });
      return extend(base, (S, info) => { staff(S, 'main', info.j.hands.R.hold, [0.04, 1, 0], 0.72, 0.98, 0.014, 'trident'); lapCloth(S, { pelvis: V.add(info.j.pelvis, [0, 0.02, -0.02]), kneeL: V.add(info.j.pelvis, [0.12, -0.3, 0.1]), kneeR: V.add(info.j.pelvis, [-0.12, -0.3, 0.1]) }); });
    }
    const base = human({ detail: 0.45, body: { sex: 'f' }, pose: { head: [0, 0.15, 0], legs: { L: { foot: [0.1, 0, 0.02] }, R: { foot: [-0.1, 0, 0.0] } }, arms: { R: { hand: [-0.3, 0.92, 0.16], pole: [-0.6, -0.3, -0.3], grip: 'hold', palm: [0.3, 0.6, 0.6] }, L: { hand: [0.22, 1.16, 0.2], pole: [0.6, -0.4, -0.3], grip: 'cup', palm: [-0.3, 0.9, 0.2] } } }, outfit: { torso: 'dress', hem: 0.94, flare: 0.5, folds: 0.06, sleeves: 'short', cape: 'back', capeLen: 0.8, hat: 'laurel' }, face: { age: 0.3, hair: 'long', seed: 63 } });
    return extend(base, (S, info) => {
      const c = info.j.hands.L.hold;                                         // Ceres: a sheaf in the left arm, a sickle in the right hand
      S.tube('main', [V.add(c, [0, -0.3, 0]), V.add(c, [0.02, 0.0, 0.02]), V.add(c, [0.05, 0.3, 0.02])], [[0.05, 0.05], [0.04, 0.04], [0.1, 0.1]], { seg: 8, per: 4 });
      const h = info.j.hands.R.hold; S.tube('main', [V.add(h, [0, -0.05, 0]), V.add(h, [0.0, 0.1, 0.02]), V.add(h, [-0.08, 0.22, 0.03]), V.add(h, [-0.2, 0.2, 0.03])], [[0.012, 0.012], [0.01, 0.014], [0.006, 0.02], [0.003, 0.012]], { seg: 6, per: 4 });
    });
  });
}
