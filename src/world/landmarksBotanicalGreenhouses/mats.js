// landmarksBotanicalGreenhouses/mats.js - materials of the module (ctx.mat.toon only; every name starts with 'lmgh-').  Colours: dossier docs/research/aptekarsky-2026.md section 7
// (metal #d5dadb white-silver, stucco #e5d6a6, cornice #f0eadb, plinth #b6a78a, portal cream #e8dcb0, museum ochre #d6a15a..#e0b866, vestibule white, wood #5a3a26).
// The batching of the engine (core/batch2.js) bakes plain colours into vertex colours and packs the tile textures of art.js into atlas pages: the materials below are LOOKS, not draw calls.
// M.cutouts = alpha cut-outs (no outline pass), M.glassy = lattice glass (no outline: an outline round every pane would drown the mullions).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const flat = (name, col, o = {}) => T(col, { name: 'lmgh-' + name, paint: 0.03, ...o });
  const sheet = (name, col, map, o = {}) => T(col, { map, name: 'lmgh-' + name, paint: 0.02, ...o });
  Object.assign(M, {
    glassWall: sheet('glassWall', W, A.glassWall, { paint: 0 }), glassRoof: sheet('glassRoof', W, A.glassRoof, { paint: 0 }),
    win: sheet('win', C.cream, A.win, { paint: 0.03 }), brickWin: sheet('brickWin', W, A.brickWin, { paint: 0.03 }), tin: sheet('tin', C.tin, A.tin, { paint: 0.03 }),
    railing: T(C.iron, { map: A.railing, alphaTest: 0.5, side: 'double', name: 'lmgh-railing', paint: 0 }),
    railingBrown: T(C.copper, { map: A.railing, alphaTest: 0.5, side: 'double', name: 'lmgh-railingBrown', paint: 0 }),
    museum: sheet('museum', W, A.museum, { paint: 0.03 }), museumDoor: sheet('museumDoor', W, A.museumDoor, { paint: 0.03 }),
    portal: sheet('portal', W, A.portal, { paint: 0.02 }), vestWin: sheet('vestWin', W, A.vestWin, { paint: 0 }), festoon: sheet('festoon', W, A.festoon, { paint: 0.02 }), oak: sheet('oak', W, A.oak, { paint: 0.02 }),
    plateMuseum: sheet('plateMuseum', W, A.plateMuseum, { paint: 0 }), platePalm: sheet('platePalm', W, A.platePalm, { paint: 0 }), plateVest: sheet('plateVest', W, A.plateVest, { paint: 0 }),
    cream: flat('cream', C.cream, { paint: 0.05 }), white: flat('white', C.white, { paint: 0.03 }), white2: flat('white2', C.white2, { paint: 0.03 }), iron: flat('iron', C.iron, { paint: 0.02 }),
    stoneGrey: flat('stoneGrey', '#a9a9a3', { paint: 0.05 }), stone: flat('stone', C.stone, { paint: 0.06 }), stoneDark: flat('stoneDark', C.stoneDark, { paint: 0.05 }), granite: flat('granite', C.granite, { paint: 0.04 }),
    tinFlat: flat('tinFlat', C.tinDark, { paint: 0.04 }), copper: flat('copper', C.copper, { paint: 0.04 }), wood: flat('wood', C.wood, { paint: 0.04 }), brick: flat('brick', C.brick, { paint: 0.06 }),
    portalCream: flat('portalCream', C.portal, { paint: 0.05 }), ochre: flat('ochre', C.ochre, { paint: 0.05 }), dark: flat('dark', '#2d3a34', { paint: 0.02 }),
  });
  M.cutouts = new Set([M.railing, M.railingBrown]);
  M.glassy = new Set([M.glassWall, M.glassRoof]);
  M.decals = new Set();
  return M;
}
