// landmarksLETI/mats.js - the materials of the module (ctx.mat.toon only; every name starts with 'lmleti-').  Colours: dossier docs/research/aptekarsky-2026.md 4.3 and the photos 63 / leti 01 02 (pistachio-green
// and pale pink striped facade, maroon copper domes, grey zinc roofs, brown timber gablets, orange-brown window frames) and 60 62 64 (Corpus 5 orange-red brick, grey concrete bands, pale cladding box),
// 61 / leti 04 (Corpus 7 archive: dark red brick).  M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const flat = (name, col, o = {}) => T(col, { name: 'lmleti-' + name, paint: 0.03, ...o });
  const sheet = (name, col, map, o = {}) => T(col, { map, name: 'lmleti-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    stripe: sheet('stripe', W, A.stripe, { paint: 0.04 }), stucco: sheet('stucco', C.trim, A.stucco, { paint: 0.04 }), stuccoD: sheet('stuccoD', C.trimDark, A.stucco, { paint: 0.04 }), frieze: sheet('frieze', C.trim, A.frieze, { paint: 0.04 }),
    pier: sheet('pier', '#d9d3b9', A.stucco, { paint: 0.03 }), rust: sheet('rust', W, A.rust, { paint: 0.05 }),
    zinc: sheet('zinc', C.zinc, A.seam, { paint: 0.04 }), zincD: sheet('zincD', C.zinc, A.seam, { paint: 0.04, side: 'double' }), dome: sheet('dome', C.dome, A.dome, { paint: 0.04 }), timber: sheet('timber', C.timber, A.timber, { paint: 0.05 }),
    winA: sheet('winA', W, A.winA, { paint: 0 }), winB: sheet('winB', W, A.winB, { paint: 0 }), winC: sheet('winC', W, A.winC, { paint: 0 }), winS: sheet('winS', W, A.winS, { paint: 0 }),
    winR: sheet('winR', W, A.winR, { paint: 0 }), door: sheet('door', W, A.door, { paint: 0 }), winW: sheet('winW', W, A.winW, { paint: 0 }),
    clock: sheet('clock', W, A.clock, { paint: 0.01 }),
    bal: T(C.trim, { map: A.bal, alphaTest: 0.5, side: 'double', name: 'lmleti-bal', paint: 0.03 }),
    grille: T(C.iron, { map: A.grille, alphaTest: 0.5, side: 'double', name: 'lmleti-grille', paint: 0 }),
    brick5: sheet('brick5', W, A.brick5, { paint: 0.04 }), brick7: sheet('brick7', W, A.brick7, { paint: 0.04 }),
    conc: sheet('conc', '#8f8c85', A.conc, { paint: 0.04 }), clad: sheet('clad', W, A.clad, { paint: 0.03 }), ribbon: sheet('ribbon', W, A.ribbon, { paint: 0.01 }),
    word: sheet('word', W, A.word, { paint: 0, polygonOffset: -2, alphaTest: 0.4 }), plaques: sheet('plaques', W, A.plaques, { paint: 0, polygonOffset: -2 }),

    c5A: sheet('c5A', W, A.c5A, { paint: 0.04 }), c5B: sheet('c5B', W, A.c5B, { paint: 0.04 }), c5S: sheet('c5S', W, A.c5S, { paint: 0.04 }), c5T: sheet('c5T', W, A.c5T, { paint: 0.04 }), c5door: sheet('c5door', W, A.c5glassDoor, { paint: 0 }),
    c7: sheet('c7', W, A.c7, { paint: 0.04 }), c7base: sheet('c7base', W, A.c7base, { paint: 0.04 }), dwall: sheet('dwall', W, A.dwall, { paint: 0.04 }), drust: sheet('drust', W, A.drust, { paint: 0.04 }),
    roof7: sheet('roof7', '#93493a', A.seam, { paint: 0.04 }), dtrim: sheet('dtrim', '#f4ecd2', A.stucco, { paint: 0.04 }), bloom: flat('bloom', '#d56aa0', { paint: 0.06 }), roofc: flat('roofc', '#6d7073', { paint: 0.05 }), steel: flat('steel', '#b4b9bb', { paint: 0.02 }),
    iron: flat('iron', C.iron, { paint: 0.01 }), dark: flat('dark', '#3a3633', { paint: 0.02 }), ink: flat('ink', '#26292b', { paint: 0.01 }), gold: flat('gold', '#b79a58', { paint: 0.02 }),
    bed: flat('bed', '#55603f', { paint: 0.05 }),
  });
  M.cutouts = new Set([M.bal, M.grille, M.word]);
  M.decals = new Set([M.word, M.plaques]);
  M.glassy = new Set();
  return M;
}
