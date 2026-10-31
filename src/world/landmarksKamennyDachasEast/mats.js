// landmarksKamennyDachasEast/mats.js - materials of the module (ctx.mat.toon only; every name starts with 'lmkde-'; <= 20 materials).  Colours: dossier docs/research/kamenny-2026.md 5.4 (photos O01 O07 O09 O10 O11 S03 S04):
// the dacha's clapboard pale lemon #e1d08a, trim white #f1eee6, dome grey-green copper #66756b, the wing's stucco ochre #e4ba6c, the green plank fence #5aa88a, granite #a7a79d, the sphinxes bronze green #2f6a5a with a bronze plume.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const flat = (name, col, o = {}) => T(col, { name: 'lmkde-' + name, paint: 0.03, ...o });
  const sheet = (name, col, map, o = {}) => T(col, { map, name: 'lmkde-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    boards: sheet('boards', W, A.boards, { paint: 0.04 }),
    stucco: sheet('stucco', C.stucco, A.stucco, { paint: 0.05 }), chimney: sheet('chimney', C.chimney, A.stucco, { paint: 0.04 }),
    white: flat('white', C.white, { paint: 0.02 }), shade: flat('shade', C.shade, { paint: 0.03 }), dark: flat('dark', '#5b564c', { paint: 0.02 }),
    granite: sheet('granite', W, A.granite, { paint: 0.05 }), plinth: sheet('plinth', C.plinth, A.granite, { paint: 0.05 }),
    roof: sheet('roof', W, A.roof, { paint: 0.04, side: 'double' }), dome: sheet('dome', W, A.dome, { paint: 0.03, side: 'double' }),
    dentil: sheet('dentil', W, A.dentil, { paint: 0.02 }),
    iron: flat('iron', C.iron, { paint: 0.02 }), plank: sheet('plank', W, A.plank, { paint: 0.05 }),
    gold: flat('gold', C.gold, { paint: 0.01 }),
    win: sheet('win', W, A.win, { paint: 0 }), winD: sheet('winD', W, A.win, { paint: 0, polygonOffset: -1 }),
    cut: T(W, { map: A.cut, alphaTest: 0.5, side: 'double', name: 'lmkde-cut', paint: 0 }),
    sphinx: flat('sphinx', C.sphinx, { paint: 0.05 }), sphinxDark: flat('sphinxDark', C.sphinxDark, { paint: 0.05 }), crown: flat('crown', C.crown, { paint: 0.04 }),
  });
  const S = (mat, key, set) => ({ mat, uv: set[key], key });
  // panes at the back of a reveal are ordinary opaque geometry (the outline pre-pass must see them); surface-mounted sheets (suffix D) are decals
  for (const k of ['winG', 'winU', 'fan', 'doorG', 'winDr', 'winW', 'doorW']) { M[k] = S(M.win, k, A.winUV); M[k + 'D'] = S(M.winD, k, A.winUV); }
  for (const k of ['grille', 'garland']) M[k] = S(M.winD, k, A.winUV);
  for (const k of ['fenceO', 'rail']) M[k] = S(M.cut, k, A.cutUV);
  M.cutouts = new Set([M.cut]);
  M.decals = new Set([M.winD]);
  return M;
}
