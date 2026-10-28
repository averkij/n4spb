// landmarksMenshikov/mats.js - materials of the module (ctx.mat.toon / glass only; every name starts with 'lmmensh-').  Colours: docs/research/menshikov.md sections 2.3, 3.3, 4.3-4.8, 5.2.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset), M.glassy = transparent sheets (no outline, no shadow).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const flat = (name, col, o = {}) => T(col, { name: 'lmmensh-' + name, paint: 0.03, ...o });
  const sheet = (name, col, map, o = {}) => T(col, { map, name: 'lmmensh-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    // ---- palace: walls and trim
    wallY: sheet('wallY', C.wallY, A.plaster, { paint: 0.05 }), cream: sheet('cream', C.cream, A.plaster, { paint: 0.03 }), creamFlat: flat('creamFlat', C.cream, { paint: 0.02 }),
    plinth: sheet('plinth', '#a09c94', A.gran, { paint: 0.05 }), column: flat('column', C.column, { paint: 0.03 }), door: flat('door', C.door, { paint: 0.02 }), rustic: sheet('rustic', '#b3ab98', A.gran, { paint: 0.04 }),
    iron: flat('iron', C.iron, { paint: 0.01 }), vase: flat('vase', C.vase, { paint: 0.02 }), gold: T(C.gold, { name: 'lmmensh-gold', paint: 0.01, emissive: '#6a4c08', emissiveIntensity: 0.35 }),
    crown: flat('crown', C.crown, { paint: 0.02 }), crownBand: flat('crownBand', C.crownBand, { paint: 0.02 }), canopy: flat('canopy', C.canopy, { paint: 0.03 }),
    // ---- palace: roofs
    roofLow: sheet('roofLow', C.roofLow, A.diamond, { paint: 0.04 }), roofTop: flat('roofTop', C.roofTop, { paint: 0.04 }), roofWing: sheet('roofWing', C.roofWing, A.diamond, { paint: 0.04 }),
    roofWingTop: flat('roofWingTop', '#6a766c', { paint: 0.04 }), roofEdge: flat('roofEdge', '#2f3331', { paint: 0.02 }), dormerWood: flat('dormerWood', '#3b3128', { paint: 0.02 }),
    // ---- windows (panes sit recessed in the wall; sash texture over dark glass)
    winTall: sheet('winTall', W, A.winTall, { paint: 0 }), winLow: sheet('winLow', W, A.winLow, { paint: 0 }), winBrown: sheet('winBrown', W, A.winBrown, { paint: 0 }),
    winCorps: sheet('winCorps', W, A.winCorps, { paint: 0 }), winArch: sheet('winArch', W, A.winArch, { paint: 0 }), winDormer: sheet('winDormer', W, A.winDormer, { paint: 0 }),
    winOval: sheet('winOval', W, A.winOval, { paint: 0 }), winOculus: sheet('winOculus', W, A.winOculus, { paint: 0 }), cellar: sheet('cellar', W, A.cellar, { paint: 0 }),
    sashWhite: flat('sashWhite', '#f1eee4', { paint: 0.01 }),
    // ---- forecourt, fences, hedge
    brick: sheet('brick', W, A.brick, { paint: 0.04, polygonOffset: -3 }), lime: sheet('lime', W, A.lime, { paint: 0.04 }), limeTop: flat('limeTop', '#5c5e60', { paint: 0.03 }),
    hedge: sheet('hedge', W, A.hedge, { paint: 0.05 }), lawn: sheet('lawn', W, A.lawn, { paint: 0.06, polygonOffset: -1 }), paving: sheet('paving', W, A.paving, { paint: 0.04, polygonOffset: -3 }),
    fenceIron: flat('fenceIron', '#24282a', { paint: 0.01 }),
    fencePalace: T('#25292b', { map: A.fencePalace, name: 'lmmensh-fencePalace', alphaTest: 0.5, side: 'double', paint: 0.01 }),
    fenceGarden: T('#2c3a36', { map: A.fenceGarden, name: 'lmmensh-fenceGarden', alphaTest: 0.5, side: 'double', paint: 0.01 }),
    gateLeaf: T('#25292b', { map: A.gateLeaf, name: 'lmmensh-gateLeaf', alphaTest: 0.5, side: 'double', paint: 0.01 }),
    // ---- Corps
    salmon: sheet('salmon', C.salmon, A.plasterOld, { paint: 0.05 }), salmonBase: sheet('salmonBase', C.salmonBase, A.plasterOld, { paint: 0.05 }), peach: sheet('peach', C.peach, A.plasterOld, { paint: 0.05 }),
    cream2: sheet('cream2', '#eadba8', A.plasterOld, { paint: 0.05 }), ochre: sheet('ochre', '#dba365', A.plasterOld, { paint: 0.05 }), courtRed: sheet('courtRed', '#cf7a56', A.plasterOld, { paint: 0.05 }),
    rustSalmon: sheet('rustSalmon', C.salmonBase, A.rust, { paint: 0.05 }), rustCream: sheet('rustCream', '#d9c9a0', A.rust, { paint: 0.05 }), rustOchre: sheet('rustOchre', '#c8935a', A.rust, { paint: 0.05 }),
    rustPeach: sheet('rustPeach', '#c9a67c', A.rust, { paint: 0.05 }), rustRed: sheet('rustRed', '#b86a4c', A.rust, { paint: 0.05 }),
    galleryY: sheet('galleryY', '#e6bb62', A.plaster, { paint: 0.05 }),
    whiteP: sheet('whiteP', C.whiteP, A.plaster, { paint: 0.03 }), whiteFlat: flat('whiteFlat', '#ece8dc', { paint: 0.03 }),
    roofRust: sheet('roofRust', C.corpsRoof, A.seam, { paint: 0.05 }), roofZinc: sheet('roofZinc', C.corpsZinc, A.seam, { paint: 0.05 }), roofGreyFlat: flat('roofGreyFlat', '#8e969a', { paint: 0.05 }),
    chimney: flat('chimney', C.chimney, { paint: 0.05 }), chimneyCap: flat('chimneyCap', '#e8e0d0', { paint: 0.03 }), darkDoor: flat('darkDoor', '#3a2c22', { paint: 0.02 }), canopyIron: flat('canopyIron', '#1f2124', { paint: 0.01 }),
    canopyGlass: flat('canopyGlass', '#3c4650', { paint: 0.02 }), canopyUnder: flat('canopyUnder', '#6a7882', { paint: 0.02 }), netGreen: flat('netGreen', '#4f8f7a', { paint: 0.03 }),
    // ---- garden
    gravel: sheet('gravel', '#ffe6d4', A.gravel, { paint: 0.05, polygonOffset: -2, emissive: '#5a3c2c', emissiveIntensity: 0.4 }),
    lawnG: sheet('lawnG', W, A.lawn, { paint: 0.06, polygonOffset: -1, emissive: '#2c4a1e', emissiveIntensity: 0.4 }), granite: sheet('granite', '#b8a29a', A.gran, { paint: 0.04 }), graniteDark: sheet('graniteDark', '#6a6d74', A.gran, { paint: 0.05 }),
    graniteLight: sheet('graniteLight', '#cbc7c0', A.gran, { paint: 0.04 }),
    bed: sheet('bed', W, A.bed, { paint: 0.03, polygonOffset: -4 }), bedEdge: sheet('bedEdge', W, A.bedEdge, { paint: 0.03, polygonOffset: -4 }),
    benchWood: flat('benchWood', '#ece9e0', { paint: 0.03 }), benchEnd: sheet('benchEnd', '#9a9a98', A.gran, { paint: 0.04 }), lampPole: flat('lampPole', '#1d2622', { paint: 0.01 }),
    globe: T('#eef0e8', { name: 'lmmensh-globe', paint: 0, emissive: '#e6e6d4', emissiveIntensity: 0.25 }),
    castIron: flat('castIron', '#2a2d32', { paint: 0.01 }), castIronLit: flat('castIronLit', '#454b52', { paint: 0.01 }), guard: flat('guard', '#26282a', { paint: 0.01 }),
    water: T('#3e6e74', { name: 'lmmensh-water', paint: 0.02, emissive: '#10303a', emissiveIntensity: 0.3, polygonOffset: -3 }),
    // obelisk and busts
    shaft: flat('shaft', C.obeliskShaft, { paint: 0.03 }), die: sheet('die', C.marblePink, A.gran, { paint: 0.03 }), ruskeala: sheet('ruskeala', '#aab0b0', A.gran, { paint: 0.03 }),
    plaqueObelisk: T(W, { map: A.plaqueObelisk, name: 'lmmensh-plaqueObelisk', paint: 0.01 }), trophy: T(W, { map: A.trophy, name: 'lmmensh-trophy', paint: 0.02, polygonOffset: -2 }),
    laurel: T('#2b2f2a', { map: A.laurel, name: 'lmmensh-laurel', alphaTest: 0.5, side: 'double', paint: 0.01 }), garland: T('#2a2d2a', { map: A.festoon, name: 'lmmensh-garland', alphaTest: 0.5, side: 'double', paint: 0.01 }),
    trophyBand: T(W, { map: A.trophyBand, name: 'lmmensh-trophyBand', paint: 0.02, polygonOffset: -2 }),
    bronzeBlue: flat('bronzeBlue', C.bronzeBlue, { paint: 0.03 }), bronzeDark: flat('bronzeDark', '#3a3f3e', { paint: 0.03 }),
    // pavilion
    pavWall: flat('pavWall', '#9fb0b8', { paint: 0.04 }), pavSoffit: flat('pavSoffit', '#aeb8bf', { paint: 0.03 }), pavFascia: flat('pavFascia', '#2a2b2e', { paint: 0.02 }), pavRoof: flat('pavRoof', '#6b7479', { paint: 0.04 }),
    // ---- descent
    wallPaint: sheet('wallPaint', '#98a4aa', A.gran, { paint: 0.04 }),
    setts: sheet('setts', W, A.setts, { paint: 0.04, polygonOffset: -2 }), wallPink: sheet('wallPink', '#d9b9a4', A.gran, { paint: 0.05 }), wallPinkTop: sheet('wallPinkTop', '#cfae9a', A.gran, { paint: 0.05 }),
    pylon: sheet('pylon', '#d2a58f', A.gran, { paint: 0.05 }), rings: T('#26292c', { map: A.rings, name: 'lmmensh-rings', alphaTest: 0.5, side: 'double', paint: 0.01 }),
    pontoon: flat('pontoon', '#e8eae6', { paint: 0.03 }), pontoonRoof: flat('pontoonRoof', '#3f7a52', { paint: 0.03 }), pile: flat('pile', '#6a5a46', { paint: 0.04 }), pileBand: flat('pileBand', '#e6e2d6', { paint: 0.03 }),
    deck: flat('deck', '#8a7358', { paint: 0.05 }), steelRail: flat('steelRail', '#7c8084', { paint: 0.02 }),
  });
  M.cutouts = new Set([M.fencePalace, M.fenceGarden, M.gateLeaf, M.laurel, M.garland, M.rings]);
  M.decals = new Set([M.brick, M.lawn, M.lawnG, M.paving, M.gravel, M.bed, M.bedEdge, M.setts, M.trophy, M.trophyBand]);
  M.glassy = new Set([]);
  return M;
}
