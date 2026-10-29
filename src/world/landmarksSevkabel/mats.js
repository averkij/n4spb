// landmarksSevkabel/mats.js - materials of the module (ctx.mat.toon / glass only; every name starts with 'lmsevka-').  Colours: docs/research/sevkabel.md sections 4-8.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset), M.glassy = transparent sheets (no outline, no shadow).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmsevka-' + name, paint: 0.02, ...o });
  const flat = (name, col, o = {}) => T(col, { name: 'lmsevka-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    // ---- CHP-7: chimneys and block
    chimRed: flat('chimRed', C.chimRed, { paint: 0.03 }), chimRedDark: flat('chimRedDark', C.chimRedDark, { paint: 0.03 }), chimWhite: flat('chimWhite', C.chimWhite, { paint: 0.02 }),
    steel: flat('steel', C.steel, { paint: 0.02 }), ladder: flat('ladder', C.ladder, { paint: 0.02 }), black: flat('black', '#26282b', { paint: 0.01 }),
    chp: sheet('chp', A.chp, { paint: 0.03 }), chpRoof: flat('chpRoof', '#6b6e70', { paint: 0.04 }), chpPlant: flat('chpPlant', '#8d9396', { paint: 0.04 }),
    // ---- hall: concrete, steel windows, murals
    conc: sheet('conc', A.conc, { paint: 0.03 }), concDark: T('#a7a9ac', { map: A.conc, name: 'lmsevka-concDark', paint: 0.03 }), concPaint: sheet('concPaint', A.concPaint, { paint: 0.03 }),
    concSoffit: T('#8d8f90', { map: A.conc, name: 'lmsevka-concSoffit', paint: 0.02 }),
    rustWin: sheet('rustWin', A.rustWin, { paint: 0 }), milkyWin: sheet('milkyWin', A.milkyWin, { paint: 0 }), darkWin: sheet('darkWin', A.darkWin, { paint: 0 }),
    ribbon: sheet('ribbon', A.ribbon, { paint: 0.02 }), brick: sheet('brick', A.brick, { paint: 0.04 }),
    brickPlinth: T('#a79a8e', { map: A.brick, name: 'lmsevka-brickPlinth', paint: 0.04 }),
    muralTeal: sheet('muralTeal', A.muralTeal, { paint: 0.01 }), muralPeach: sheet('muralPeach', A.muralPeach, { paint: 0.01 }), muralPink: sheet('muralPink', A.muralPink, { paint: 0.01 }), muralYellow: sheet('muralYellow', A.muralYellow, { paint: 0.01 }),
    roofMem: flat('roofMem', '#4a4a4c', { paint: 0.04 }), rustBrown: flat('rustBrown', '#6b3a2a', { paint: 0.02 }), woodCabin: flat('woodCabin', '#6a4a38', { paint: 0.04 }), corrugated: flat('corrugated', '#8a9aa4', { paint: 0.03 }),
    yellowSteel: flat('yellowSteel', '#d6a82a', { paint: 0.02 }), steelGrey: flat('steelGrey', '#6e7377', { paint: 0.02 }), bollardY: flat('bollardY', '#e0b020', { paint: 0.02 }), portHole: flat('portHole', '#2a3236', { paint: 0 }),
    signRound: sheet('signRound', A.signRound, { paint: 0 }), container: sheet('container', A.container, { paint: 0.02 }),
    // ---- the yard: brick blocks, sashes, Corten, Tesla generator, spool towers
    brickRed: T('#b9532f', { map: A.brick, name: 'lmsevka-brickRed', paint: 0.05 }), brickDark: T('#8e3f2a', { map: A.brick, name: 'lmsevka-brickDark', paint: 0.05 }), brickChim: T('#a8482c', { map: A.brick, name: 'lmsevka-brickChim', paint: 0.05 }),
    plinthGrey: flat('plinthGrey', '#8d8c88', { paint: 0.05 }), limestone: flat('limestone', '#d8cfb5', { paint: 0.04 }), plaster: flat('plaster', '#e6e3d8', { paint: 0.03 }), prismPanel: T('#d9d6c8', { map: A.concPaint, name: 'lmsevka-prismPanel', paint: 0.03 }),
    zinc: flat('zinc', '#5a5e63', { paint: 0.04 }), zincLight: flat('zincLight', '#b8bbbd', { paint: 0.03 }), hoop: flat('hoop', '#2e2a26', { paint: 0.01 }), brickCap: flat('brickCap', '#7d3a28', { paint: 0.03 }),
    sashBrick: sheet('sashBrick', A.sashBrick, { paint: 0 }), sashTallGreen: sheet('sashTallGreen', A.sashTallGreen, { paint: 0 }), sashWhitePrism: sheet('sashWhitePrism', A.sashWhitePrism, { paint: 0 }),
    sashAlms: sheet('sashAlms', A.sashAlms, { paint: 0 }), doorWood: flat('doorWood', '#c79a4a', { paint: 0.03 }), sashFactory: sheet('sashFactory', A.sashFactory, { paint: 0 }), plasterMint: sheet('plasterMint', A.plasterMint, { paint: 0.03 }), zincBlue: flat('zincBlue', '#8e9aa6', { paint: 0.03 }), sashWhite: sheet('sashWhite', A.sashWhite, { paint: 0 }), sashPink: sheet('sashPink', A.sashPink, { paint: 0 }),
    dates: sheet('dates', A.dates, { paint: 0 }), corten: sheet('corten', A.corten, { paint: 0.03 }), cortenBlue: flat('cortenBlue', '#5d6b80', { paint: 0.03 }), cortenEdge: flat('cortenEdge', '#5e2d1a', { paint: 0.02 }),
    copper: flat('copper', '#b8662c', { paint: 0.02 }), toroid: flat('toroid', '#9aa9a4', { paint: 0.02 }), insulator: flat('insulator', '#2d2f33', { paint: 0.01 }), teslaCap: flat('teslaCap', '#a9b8b2', { paint: 0.02 }),
    larch: flat('larch', '#c9a46a', { paint: 0.04 }), larchDark: flat('larchDark', '#a98350', { paint: 0.04 }), lampWarm: flat('lampWarm', '#fff0c8', { paint: 0, emissive: '#ffe2a0', emissiveIntensity: 0.5 }),
    pyramidGlass: ctx.mat.glass({ tint: '#7aa0b8', opacity: 0.55, streaks: false }), steelFrame: flat('steelFrame', '#8a9096', { paint: 0.02 }),
    portalDark: flat('portalDark', '#1d1f21', { paint: 0 }), lampDisc: flat('lampDisc', '#f6eed6', { paint: 0, emissive: '#fff0c0', emissiveIntensity: 0.4 }),
    silicate: flat('silicate', '#cfc7b0', { paint: 0.04 }),
    blueBox: flat('blueBox', '#2c63c7', { paint: 0.03 }), timberBooth: flat('timberBooth', '#b9703c', { paint: 0.04 }), whiteBox: flat('whiteBox', '#e8e6df', { paint: 0.03 }),
    // ---- promenade
    deck: sheet('deck', A.deck, { paint: 0.03 }), slats: sheet('slats', A.slats, { paint: 0.03 }), lawn: T(W, { map: A.lawn, name: 'lmsevka-lawn', paint: 0.04, polygonOffset: -3 }),
    slabPath: T(W, { map: A.slabPath, name: 'lmsevka-slabPath', paint: 0.03, polygonOffset: -4 }), gravel: T(W, { map: A.gravel, name: 'lmsevka-gravel', paint: 0.04, polygonOffset: -3 }),
    pavers: T(W, { map: A.pavers, name: 'lmsevka-pavers', paint: 0.04, polygonOffset: -4 }), curb: flat('curb', '#3f4144', { paint: 0.03 }), railTop: flat('railTop', '#c9a77a', { paint: 0.03 }),
    leaner: flat('leaner', '#a5532a', { paint: 0.03 }), bolt: flat('bolt', '#2a2a2c', { paint: 0.01 }), edging: flat('edging', '#a9a198', { paint: 0.05 }),
    // ---- the quarter: mansion, pink house, factory, skyway, Skobsky, almshouse
    plasterOld: sheet('plasterOld', A.plasterOld, { paint: 0.03 }), plasterPink: sheet('plasterPink', A.plasterPink, { paint: 0.03 }), plasterRose: sheet('plasterRose', A.plasterRose, { paint: 0.03 }), plasterSand: sheet('plasterSand', A.plasterSand, { paint: 0.03 }),
    ochre: sheet('ochre', A.ochre, { paint: 0.03 }), wallYellow: sheet('wallYellow', A.wallYellow, { paint: 0.03 }), rock: sheet('rock', A.rock, { paint: 0.04 }),
    barred: sheet('barred', A.barred, { paint: 0 }), curtain: sheet('curtain', A.curtain, { paint: 0 }), garland: sheet('garland', A.garland, { paint: 0.02 }), skobBase: sheet('skobBase', A.skobBase, { paint: 0.03 }), boards: sheet('boards', A.boards, { paint: 0.03 }),
    fence: T(W, { map: A.fence, alphaTest: 0.5, side: 'double', name: 'lmsevka-fence', paint: 0 }),
    whiteStone: flat('whiteStone', '#efe8dc', { paint: 0.03 }), trimCream: flat('trimCream', '#ece3cc', { paint: 0.03 }), rustRoof: flat('rustRoof', '#8a4a35', { paint: 0.04 }), copperDome: flat('copperDome', '#6e7a5a', { paint: 0.03 }),
    copperRoof: flat('copperRoof', '#7a4a3a', { paint: 0.03 }), zincGrey: flat('zincGrey', '#b1afb7', { paint: 0.03 }), darkRoof: flat('darkRoof', '#4a4d52', { paint: 0.04 }), glassHouse: flat('glassHouse', '#6d7f80', { paint: 0.01 }),
    column: flat('column', '#e8c97e', { paint: 0.04 }), pipeBlue: flat('pipeBlue', '#8da4bc', { paint: 0.02 }), granite: flat('granite', '#8c8c8a', { paint: 0.05 }), globe: flat('globe', '#f0efe6', { paint: 0, emissive: '#e8e6d6', emissiveIntensity: 0.25 }),
    ironBlack: flat('ironBlack', '#1d1f21', { paint: 0.01 }), laurel: flat('laurel', '#b8a878', { paint: 0.03 }), stone: flat('stone', '#a49c8a', { paint: 0.05 }), brickChimney: flat('brickChimney', '#8a4535', { paint: 0.04 }),
    // ---- vertex-coloured material for instanced cranes
    vcol: T(W, { vertexColors: true, name: 'lmsevka-vcol', paint: 0.03 }),
  });
  // near-identical flats share ONE material (draw calls / material budget of docs/PERFORMANCE.md: a module stays under ~80 materials): the aliases keep every call site readable
  const alias = (a, b) => { M[a] = M[b]; };
  alias('roofMem', 'darkRoof'); alias('zinc', 'darkRoof'); alias('steel', 'steelGrey'); alias('steelFrame', 'steelGrey'); alias('bolt', 'black'); alias('insulator', 'black'); alias('ironBlack', 'black'); alias('portHole', 'black');
  alias('brickCap', 'brickDark'); alias('brickChimney', 'brickDark'); alias('trimCream', 'whiteStone'); alias('whiteBox', 'plaster'); alias('copperRoof', 'rustRoof'); alias('lampDisc', 'lampWarm'); alias('zincGrey', 'zincLight'); alias('granite', 'plinthGrey');
  M.cutouts = new Set([M.fence]);
  M.decals = new Set([M.lawn, M.slabPath, M.gravel, M.pavers]);
  M.glassy = new Set([M.pyramidGlass]);
  return M;
}
