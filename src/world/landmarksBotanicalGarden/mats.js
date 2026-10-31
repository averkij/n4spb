// landmarksBotanicalGarden/mats.js - the materials of the module (ctx.mat.toon only; every name starts with 'lmbg-'; 26 materials + the bronze of the figure kit; kawaraD / zincD are the double-sided roofs of the open pavilions and the gazebo: the player looks up at their underside).  Colours: dossier
// docs/research/aptekarsky-2026.md 4.1b / 7 and the photos (Institute yellow-ochre stucco #e3b95a with white pilasters and a dark red roof, Director's House ochre clapboard #d9b255, mint clapboard #86b09c,
// zinc roofs, black-green bar fence, pink-grey granite).  M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const flat = (name, col, o = {}) => T(col, { name: 'lmbg-' + name, paint: 0.03, ...o });
  const sheet = (name, col, map, o = {}) => T(col, { map, name: 'lmbg-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    ochre: sheet('ochre', C.ochre, A.plaster, { paint: 0.05 }), grey: sheet('grey', '#b6a78c', A.plaster, { paint: 0.05 }), white: sheet('white', C.white, A.plaster, { paint: 0.02 }),
    plinth: sheet('plinth', W, A.graniteG, { paint: 0.05 }), boulder: sheet('boulder', '#8c8e8a', A.graniteG, { paint: 0.05 }), leaf: flat('leaf', '#4f8a3c', { paint: 0.05 }), terra: flat('terra', '#c4573d', { paint: 0.04 }), graniteP: sheet('graniteP', W, A.graniteP, { paint: 0.05 }), graniteD: sheet('graniteD', '#555a5a', A.graniteG, { paint: 0.04 }),
    roofRed: sheet('roofRed', C.roofRed, A.seam, { paint: 0.04 }), zinc: sheet('zinc', C.zinc, A.seam, { paint: 0.04 }), kawara: sheet('kawara', C.kawara, A.kawara, { paint: 0.04 }), kawaraD: sheet('kawaraD', C.kawara, A.kawara, { paint: 0.04, side: 'double' }), zincD: sheet('zincD', C.zinc, A.seam, { paint: 0.04, side: 'double' }),
    clapOchre: sheet('clapOchre', C.dirOchre, A.clap, { paint: 0.05 }), clapMint: sheet('clapMint', C.workers, A.clap, { paint: 0.05 }),
    winI: sheet('winI', W, A.winI, { paint: 0 }), winD: sheet('winD', W, A.winD, { paint: 0 }),
    iron: flat('iron', C.iron, { paint: 0.01 }), timber: flat('timber', '#74483a', { paint: 0.05 }),
    bars: T('#2f3a32', { map: A.bars, alphaTest: 0.5, side: 'double', name: 'lmbg-bars', paint: 0 }),
    picket: T('#9a7650', { map: A.pickets, alphaTest: 0.5, side: 'double', name: 'lmbg-picket', paint: 0.02 }),
    slat: sheet('slat', C.slat, A.slat, { paint: 0.03 }), planks: sheet('planks', C.plank, A.planks, { paint: 0.04 }), bark: sheet('bark', C.bark, A.bark, { paint: 0.05 }),
    plaques: sheet('plaques', W, A.plaques, { paint: 0, polygonOffset: -2 }),
    lampGlass: T('#f1efe2', { name: 'lmbg-lampGlass', paint: 0, emissive: '#e8e2c0', emissiveIntensity: 0.3 }),
  });
  M.cutouts = new Set([M.bars, M.picket]);
  M.decals = new Set([M.plaques]);
  M.glassy = new Set();
  return M;
}
