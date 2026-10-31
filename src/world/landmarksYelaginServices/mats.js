// landmarksYelaginServices/mats.js - materials of the module (ctx.mat.toon only; every name starts with 'lmyesv-').  Colours: dossier docs/research/yelagin-palace-2026.md 6.3 - 6.8 and 9
// (white #f1f0ea, Stable rustication #c9cbcf, zinc #aab2b7, storeroom ochre #d9ab72 + green roof #6f8a62, clapboard grey-white #d9dde0 / cream #ebe5cf, window wood #b07a3a, door wood #b88a52, Orangery glass #6f8c90).
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface, M.glassy = the glass wall (no outline).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const flat = (name, col, o = {}) => T(col, { name: 'lmyesv-' + name, paint: 0.03, ...o });
  const sheet = (name, col, map, o = {}) => T(col, { map, name: 'lmyesv-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    white: sheet('white', C.white, A.plaster, { paint: 0.02 }), rust: sheet('rust', C.rust, A.rust, { paint: 0.03 }), ashlar: sheet('ashlar', W, A.ashlar, { paint: 0.05 }),
    zinc: sheet('zinc', C.zinc, A.zinc, { paint: 0.04 }), zincG: sheet('zincG', C.zincG, A.zinc, { paint: 0.04 }), setts: sheet('setts', W, A.setts, { paint: 0.05 }),
    ochre: sheet('ochre', C.ochre, A.plaster, { paint: 0.05 }), clapGrey: sheet('clapGrey', C.clapGrey, A.clap, { paint: 0.03 }), clapCream: sheet('clapCream', C.clapCream, A.clap, { paint: 0.03 }),
    winWhite: sheet('winWhite', W, A.winWhite, { paint: 0 }), winBrown: sheet('winBrown', W, A.winBrown, { paint: 0 }),
    fan: sheet('fan', W, A.fan, { paint: 0 }), key: sheet('key', W, A.key, { paint: 0.01 }), glassBay: sheet('glassBay', W, A.glassBay, { paint: 0, side: 'double' }),   // double sided: seen from the side the pavilion is not an open box (the glass wall of the other face shows its back, not the sky)
    door: sheet('door', W, A.door, { paint: 0.02 }),
    iron: T(C.iron, { map: A.iron, alphaTest: 0.5, side: 'double', name: 'lmyesv-iron', paint: 0 }),
    dark: flat('dark', C.dark, { paint: 0.02 }), shade: flat('shade', C.shade, { paint: 0.03 }), pink: flat('pink', C.plinthPink, { paint: 0.04 }),
    lampGlass: T('#e9ece3', { name: 'lmyesv-lampGlass', paint: 0, emissive: '#e8e2c0', emissiveIntensity: 0.3 }),
  });
  // aliases: the same material under the names the parts use (one material per look)
  Object.assign(M, { whiteFlat: M.white, wall: M.white, limestone: M.ashlar, granite: M.ashlar, soffit: M.shade, lantern: M.dark, roofEdge: M.dark, marble: M.white, sphere: M.shade, pierGlass: M.glassBay });
  M.cutouts = new Set([M.iron]);
  M.decals = new Set();
  M.glassy = new Set();                                   // the glass bays are OPAQUE textured quads: they take part in the outline pre-pass, otherwise the interior walls and roof edges behind them leak through as thin lines
  return M;
}
