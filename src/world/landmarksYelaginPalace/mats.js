// landmarksYelaginPalace/mats.js - materials of the module (ctx.mat.toon only; every name starts with 'lmyepal-').  Colours: dossier docs/research/yelagin-palace-2026.md 5.4 and 9
// (walls very pale blue-grey #d9dfe8, columns / cornice / pediments white #f1f0ea, podium limestone #a9a597, granite #9c9a92, zinc #aab2b7, window wood #b07a3a, door wood #b88a52).
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const flat = (name, col, o = {}) => T(col, { name: 'lmyepal-' + name, paint: 0.03, ...o });
  const sheet = (name, col, map, o = {}) => T(col, { map, name: 'lmyepal-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    wall: sheet('wall', C.wall, A.plaster, { paint: 0.04 }), white: sheet('white', C.white, A.plaster, { paint: 0.02 }), whiteFlat: flat('whiteFlat', C.white, { paint: 0.02 }),
    limestone: sheet('limestone', W, A.ashlar, { paint: 0.05 }), flags: sheet('flags', W, A.flags, { paint: 0.05 }), setts: sheet('setts', W, A.setts, { paint: 0.05 }),
    zinc: sheet('zinc', C.zinc, A.zinc, { paint: 0.04 }), dome: sheet('dome', C.dome, A.dome, { paint: 0.04 }),
    winSq: sheet('winSq', W, A.winSq, { paint: 0 }), winArch: sheet('winArch', W, A.winArch, { paint: 0 }), winDoor: sheet('winDoor', W, A.winDoor, { paint: 0 }),
    shade: flat('shade', '#cbcbc6', { paint: 0.03 }), dark: flat('dark', '#8d949e', { paint: 0.02 }),
    lattice: T(C.iron, { map: A.lattice, alphaTest: 0.5, side: 'double', name: 'lmyepal-lattice', paint: 0 }),
    lunette: sheet('lunette', W, A.lunette, { paint: 0, alphaTest: 0.5, polygonOffset: -2 }), festoon: sheet('festoon', W, A.festoon, { paint: 0.02 }),
    plinthText: sheet('plinthText', W, A.plinthText, { paint: 0, alphaTest: 0.5, polygonOffset: -2 }),
    lantern: flat('lantern', C.lantern, { paint: 0.01 }), lampGlass: T('#e9ece3', { name: 'lmyepal-lampGlass', paint: 0, emissive: '#e8e2c0', emissiveIntensity: 0.3 }),
    flower: flat('flower', C.flower, { paint: 0.06 }),
  });
  // aliases: the same material under the names the parts use (one material per look)
  Object.assign(M, { steps: M.flags, trellis: M.lattice, winAttic: M.winSq, soffit: M.shade, roofEdge: M.dark, iron: M.dark, sphere: M.shade, lion: M.whiteFlat, marble: M.whiteFlat, soil: M.dark, wood: M.dark });
  M.cutouts = new Set([M.lattice, M.lunette, M.plinthText]);
  M.decals = new Set([M.lunette, M.plinthText]);
  M.glassy = new Set();
  return M;
}
