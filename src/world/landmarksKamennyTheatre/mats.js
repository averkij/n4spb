// landmarksKamennyTheatre/mats.js - materials of the module (ctx.mat.toon only; every name starts with 'lmkth-'; 17 materials).  Colours: dossier docs/research/kamenny-2026.md 5.3 + BUILD LOG (photos T01 T06 T11 T12 K05 K09):
// pink-beige boards #d9bda8 with white joints (baked into the textures), trim and columns white #f2efe8, roof grey #7e8488, plinth grey limestone, iron #1f2327, Kleinmichel cream #eadba2, slate #4d535c.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const flat = (name, col, o = {}) => T(col, { name: 'lmkth-' + name, paint: 0.03, ...o });
  const sheet = (name, col, map, o = {}) => T(col, { map, name: 'lmkth-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    ashlar: sheet('ashlar', W, A.ashlar, { paint: 0.04 }), boards: sheet('boards', W, A.boards, { paint: 0.04 }),
    white: flat('white', C.white, { paint: 0.02 }), shade: flat('shade', C.shade, { paint: 0.03 }), dark: flat('dark', '#5b564c', { paint: 0.02 }), soffit: flat('soffit', '#f3ebe5', { paint: 0.01, emissive: '#847a74', emissiveIntensity: 1 }),
    granite: sheet('granite', W, A.granite, { paint: 0.05 }),
    roof: sheet('roof', W, A.roof, { paint: 0.04, side: 'double' }),
    iron: flat('iron', C.iron, { paint: 0.02 }), grey: flat('grey', C.grey, { paint: 0.03 }),
    annex: sheet('annex', '#e6c9b4', A.plaster, { paint: 0.04 }),
    plaster: sheet('plaster', '#f0e4b4', A.plaster, { paint: 0.04 }), slate: sheet('slate', W, A.slate, { paint: 0.03, side: 'double' }), timber: sheet('timber', W, A.timber, { paint: 0.03 }),
    dentil: sheet('dentil', W, A.dentil, { paint: 0.02 }), pipe: flat('pipe', '#d4b9a5', { paint: 0.03 }),
    gold: flat('gold', C.gold, { paint: 0.01 }),
    win: sheet('win', W, A.win, { paint: 0 }), winD: sheet('winD', W, A.win, { paint: 0, polygonOffset: -1 }),
    cut: T(W, { map: A.cut, alphaTest: 0.5, side: 'double', name: 'lmkth-cut', paint: 0 }),
    signs: sheet('signs', W, A.signs, { paint: 0, polygonOffset: -2 }),
  });
  const S = (mat, key, set) => ({ mat, uv: set[key], key });
  // panes at the back of a reveal are ordinary opaque geometry (the outline pre-pass must see them, else the edges of the far walls show through); surface-mounted sheets (suffix D) are decals
  for (const k of ['winTall', 'winFan', 'winSmall', 'winGround', 'doorW', 'winAnnex']) { M[k] = S(M.win, k, A.winUV); M[k + 'D'] = S(M.winD, k, A.winUV); }
  for (const k of ['louvre', 'grille', 'ventPink', 'gableHall']) M[k] = S(M.winD, k, A.winUV);
  for (const k of ['fenceK', 'leafK', 'roofRail', 'balust', 'fretBal']) M[k] = S(M.cut, k, A.cutUV);
  for (const k of ['plaqueA', 'plaqueB', 'poster1', 'poster2', 'poster3']) M[k] = S(M.signs, k, A.signsUV);
  M.cutouts = new Set([M.cut]);
  M.decals = new Set([M.winD, M.signs]);
  return M;
}
