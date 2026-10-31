// landmarksKamennyDachasWest/mats.js - materials of the module (ctx.mat.toon only; every name starts with 'lmkdw-').  Colours: dossier docs/research/kamenny-2026.md 5.4 + BUILD LOG (photos V02..V08 G01..G12 F01..F12):
// Polovtsov: white stucco, copper-green roofs, rose-grey granite socle of the fence; Gauswald: pale olive-green clapboard with dark-green members, red tiles, buff brick, dark scale-slate tower roof, pale-green fence;
// Follenweider: white roughcast, orange-red tiles, dark rough granite, black ironwork.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const flat = (name, col, o = {}) => T(col, { name: 'lmkdw-' + name, paint: 0.03, ...o });
  const sheet = (name, col, map, o = {}) => T(col, { map, name: 'lmkdw-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    stucco: sheet('stucco', C.stucco, A.stucco, { paint: 0.03 }), white: flat('white', C.white, { paint: 0.02 }),
    dentil: sheet('dentil', W, A.dentil, { paint: 0.02 }),
    copper: sheet('copper', C.copper, A.copper, { paint: 0.04, side: 'double' }),
    granP: sheet('granP', C.roseGranite, A.stone, { paint: 0.05 }),
    iron: flat('iron', C.iron, { paint: 0.02 }),
    clap: sheet('clap', C.clap, A.clap, { paint: 0.04 }), halfG: sheet('halfG', W, A.halfG, { paint: 0.03 }), lattice: sheet('lattice', W, A.lattice, { paint: 0.03 }),
    greenD: flat('greenD', C.greenD, { paint: 0.03 }),
    tileG: sheet('tileG', C.tileG, A.tile, { paint: 0.05, side: 'double' }),
    brickBuff: sheet('brickBuff', W, A.brickBuff, { paint: 0.04 }), pierBrick: sheet('pierBrick', W, A.pierBrick, { paint: 0.04 }),
    slateD: sheet('slateD', C.slateD, A.slate, { paint: 0.03, side: 'double' }),
    brickRed: sheet('brickRed', '#cc7352', A.brickBuff, { paint: 0.04 }),
    limestone: sheet('limestone', C.limestone, A.stone, { paint: 0.05 }),
    tileF: sheet('tileF', C.tileF, A.tile, { paint: 0.05, side: 'double' }),
    graniteF: sheet('graniteF', '#8c8e92', A.rock, { paint: 0.05 }),
    win: sheet('win', W, A.win, { paint: 0 }), winD: sheet('winD', W, A.win, { paint: 0, polygonOffset: -1 }),
    cut: T(W, { map: A.cut, alphaTest: 0.5, side: 'double', name: 'lmkdw-cut', paint: 0 }),
  });
  const S = (mat, key, set) => ({ mat, uv: set[key], key });
  for (const k of ['winP', 'winBay', 'doorP', 'winG1', 'winG2', 'winHalf', 'winArch', 'doorG', 'winF1', 'winSlit', 'winRow']) { M[k] = S(M.win, k, A.winUV); M[k + 'D'] = S(M.winD, k, A.winUV); }
  for (const k of ['fenceP', 'leafP', 'fenceG', 'leafG', 'fenceF', 'leafF', 'fret', 'balF']) M[k] = S(M.cut, k, A.cutUV);
  M.cutouts = new Set([M.cut]);
  M.decals = new Set([M.winD]);
  return M;
}
