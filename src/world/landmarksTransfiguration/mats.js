// landmarksTransfiguration/mats.js - the materials of the church, the terrace and the bunker (every name starts with 'lmTF-'; <= 16 materials).  Colours from photo 65 / 14 / 12 (docs/research/aptekarsky-2026.md 4.4):
//   ochre stucco #d6a255 (plaster texture) and the rusticated ground floor (rustic); white trim and columns #e6e3d8; grey granite plinth / steps / coping; grey zinc roof #7b8186; ochre drum cap #b98c4a;
//   rubble wall (rubble), lawn, hedge; the bunker: dark armour plates, red riveted plates, green steel posts #4d5a45, grey steel door, soil.  The atlas `win` carries every decal (windows, door, boards).
import { makeArt } from './art.js';

export const C = { white: '#e6e3d8', zinc: '#7b8186', cap: '#b98c4a', iron: '#202327', post: '#4d5a45', door: '#8d9094', cross: '#4a3f33' };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const N = (n) => 'lmTF-' + n;
  const map = (name, tex, o = {}) => T('#ffffff', { map: tex, name: N(name), paint: 0.03, ...o });
  Object.assign(M, {
    plaster: map('plaster', A.plaster, { paint: 0.05 }), rustic: map('rustic', A.rustic, { paint: 0.05 }), granite: map('granite', A.granite, { paint: 0.04 }),
    rubble: map('rubble', A.rubble, { paint: 0.05 }), lawn: map('lawn', A.lawn, { paint: 0.04 }), hedge: map('hedge', A.hedge, { paint: 0.05 }), soil: map('soil', A.soil, { paint: 0.05 }),
    armour: map('armour', A.armour, { paint: 0.04, side: 'double' }), armourRed: map('armourRed', A.armourRed, { paint: 0.03 }),
    white: T(C.white, { name: N('white'), paint: 0.03 }), zinc: T(C.zinc, { name: N('zinc'), paint: 0.03, side: 'double' }),
    iron: T(C.iron, { name: N('iron'), side: 'double' }), post: T(C.post, { name: N('post') }),
    win: map('win', A.win, { polygonOffset: -1, paint: 0.01 }),
  });
  M.cap = M.plaster; M.door = M.zinc; M.cross = M.iron;                 // aliases: the drum cap is painted like the walls, the steel door and the cross share the grey / dark materials (fewer draw calls)
  M.decals = new Set([M.win]);
  return M;
}
