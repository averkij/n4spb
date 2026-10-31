// landmarksKamennyPalace/mats.js - materials of the module (ctx.mat.toon only; every name starts with 'lmkpal-').  Colours: dossier docs/research/kamenny-2026.md 5.1 and the BUILD LOG (photos P05 P08 P11 P12 P20 P22 P23):
// stucco #e9cf8c, trim white #f1eee6, window surrounds pale grey-green #bcc5c6, plinth limestone #c4c2b6, copper roof #6e9a86, iron #23272b, gilt #d9ae3e.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const flat = (name, col, o = {}) => T(col, { name: 'lmkpal-' + name, paint: 0.03, ...o });
  const sheet = (name, col, map, o = {}) => T(col, { map, name: 'lmkpal-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    wall: sheet('wall', C.wall, A.plaster, { paint: 0.04 }), white: sheet('white', C.white, A.plaster, { paint: 0.02 }), whiteFlat: flat('whiteFlat', C.white, { paint: 0.02 }),
    dentil: sheet('dentil', W, A.dentil, { paint: 0.02 }),
    pink: sheet('pink', '#e8bfac', A.plaster, { paint: 0.04 }),
    surround: sheet('surround', C.surround, A.plaster, { paint: 0.02 }),
    plinth: sheet('plinth', W, A.ashlar, { paint: 0.05 }), copper: sheet('copper', C.copper, A.copper, { paint: 0.04 }), copperFlat: flat('copperFlat', C.copperEdge, { paint: 0.03 }),
    flags: sheet('flags', W, A.flags, { paint: 0.05 }),
    win: sheet('win', W, A.win, { paint: 0 }),
    iron: flat('iron', C.iron, { paint: 0.02 }),
    cut: T('#ffffff', { map: A.cut, alphaTest: 0.5, side: 'double', name: 'lmkpal-cut', paint: 0 }),
    signs: sheet('signs', W, A.signs, { paint: 0, polygonOffset: -2 }),
    gold: flat('gold', C.gold, { paint: 0.01 }),
    lampGlass: T(C.lampGlass, { name: 'lmkpal-lampGlass', paint: 0, emissive: '#e8e2c0', emissiveIntensity: 0.3 }),
    shade: flat('shade', '#c9c3a8', { paint: 0.03 }),
  });
  // the atlas cells as { mat, uv } objects (kit Q() draws a quad into the cell; facade pane() accepts them)
  const S = (mat, key, set) => ({ mat, uv: set[key], key });
  for (const k of ['winG', 'winU', 'winB', 'winK', 'door']) M[k] = S(M.win, k, A.winUV);
  for (const k of ['fence', 'leaf', 'railX', 'roofRail', 'balust', 'crest']) M[k] = S(M.cut, k, A.cutUV);
  for (const k of ['plaque', 'gateSign']) M[k] = S(M.signs, k, A.signsUV);
  M.wood = M.whiteFlat; M.skyGlass = M.surround;
  M.cutouts = new Set([M.cut]);
  M.decals = new Set([M.signs]);
  M.glassy = new Set();
  return M;
}
