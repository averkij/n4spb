// landmarksGavan/mats.js - materials of the module (ctx.mat.toon only; every name starts with 'lmgavan-').  Colours: docs/research/gavan.md sections 4-10.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 1-6 cm in front of a surface (polygonOffset), M.glassy = transparent sheets (no outline, no shadow).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmgavan-' + name, paint: 0.02, ...o });
  const flat = (name, col, o = {}) => T(col, { name: 'lmgavan-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    // ---- kronshpitses and moles
    peachE: sheet('peachE', A.plasterPeach, { paint: 0.04 }), peachW: sheet('peachW', A.plasterPeachW, { paint: 0.04 }), white: flat('white', C.white, { paint: 0.02 }), whiteShade: flat('whiteShade', C.whiteShade, { paint: 0.02 }),
    plinth: flat('plinth', C.plinth, { paint: 0.05 }), roofWhite: flat('roofWhite', C.roofWhite, { paint: 0.02 }), verdi: flat('verdi', C.verdi, { paint: 0.03, emissive: '#0b1c16', emissiveIntensity: 0.2 }), lantRed: flat('lantRed', C.lantRed, { paint: 0.04 }),
    glassDark: flat('glassDark', '#2d373b', { paint: 0 }), iron: flat('iron', C.iron, { paint: 0.01 }), ironRail: flat('ironRail', C.rail, { paint: 0.01 }), steel: sheet('steelGalv', A.steelGalv, { paint: 0.02 }), rust: sheet('rustGirder', A.rustGirder, { paint: 0.03 }),
    winEast: sheet('winEast', A.winEast, { paint: 0 }), winEastBlind: sheet('winEastBlind', A.winEastBlind, { paint: 0 }), winWest: sheet('winWest', A.winWest, { paint: 0 }), doorEast: sheet('doorEast', A.doorEast, { paint: 0 }),
    lantEast: sheet('lantEast', A.lantEast, { paint: 0 }), lantWest: sheet('lantWest', A.lantWest, { paint: 0 }), ovalEast: sheet('ovalEast', A.ovalEast, { paint: 0 }), ovalWest: sheet('ovalWest', A.ovalWest, { paint: 0 }),
    plaqueKron: T(W, { map: A.plaqueKron, name: 'lmgavan-plaqueKron', paint: 0, polygonOffset: -2 }),
    ashlar: sheet('ashlar', A.ashlar, { paint: 0.04 }), granite: sheet('granite', A.granite, { paint: 0.04 }), graniteFlat: flat('graniteFlat', C.graniteBase, { paint: 0.05 }), coping: flat('coping', C.coping, { paint: 0.04 }),
    // ---- canal: fence, ground
    fenceBars: T(C.iron, { map: A.fenceBars, name: 'lmgavan-fenceBars', paint: 0, alphaTest: 0.45, side: 'double' }), fenceFan: T(C.iron, { map: A.fenceFan, name: 'lmgavan-fenceFan', paint: 0, alphaTest: 0.45, side: 'double' }),
    setts: T(W, { map: A.setts, name: 'lmgavan-setts', paint: 0.03, polygonOffset: -4 }), lawn: T(W, { map: A.lawn, name: 'lmgavan-lawn', paint: 0.04, polygonOffset: -3 }), lawnDry: T(W, { map: A.lawnDry, name: 'lmgavan-lawnDry', paint: 0.04, polygonOffset: -3 }),
    gravel: T(W, { map: A.gravel, name: 'lmgavan-gravel', paint: 0.04, polygonOffset: -3 }), pavedGranite: T(W, { map: A.granite, name: 'lmgavan-pavedGranite', paint: 0.04, polygonOffset: -4 }),
    boulder: flat('boulder', '#9a8f86', { paint: 0.05 }), wallGrey: flat('wallGrey', '#c8c8c2', { paint: 0.04 }), lampWhite: flat('lampWhite', '#f4f6f2', { paint: 0.01, emissive: '#8a8f88', emissiveIntensity: 0.6 }),
    mchsWhite: flat('mchsWhite', '#e4e6e8', { paint: 0.03 }), mchsGraphite: flat('mchsGraphite', '#656b71', { paint: 0.03 }), mchsGlass: flat('mchsGlass', '#5a7480', { paint: 0.02 }), hangarWall: flat('hangarWall', '#cfd3d6', { paint: 0.04 }), hangarRoof: flat('hangarRoof', '#4d555b', { paint: 0.04 }),
    // ---- harbour: works house, crane, rotunda, guardhouse, water tower
    worksFacade: sheet('worksFacade', A.worksFacade, { paint: 0.03 }), worksEnd: sheet('worksEnd', A.worksEnd, { paint: 0.03 }), pedWindow: sheet('pedWindow', A.pedWindow, { paint: 0 }), zincGrey: flat('zincGrey', '#7d8d86', { paint: 0.04 }), zincLight: flat('zincLight', '#a7aeb3', { paint: 0.04 }),
    trimCream: flat('trimCream', '#f2eee2', { paint: 0.02 }), stoneRough: sheet('stoneRough', A.stoneRough, { paint: 0.04 }), craneWhite: flat('craneWhite', '#d9dcde', { paint: 0.03 }), craneDark: flat('craneDark', '#3b3e41', { paint: 0.02 }), gearRim: flat('gearRim', '#7b7f84', { paint: 0.02 }),
    rotStucco: flat('rotStucco', '#e9e4d4', { paint: 0.03 }), rotBrick: flat('rotBrick', '#b4654f', { paint: 0.04 }), rotDome: flat('rotDome', '#6f8f84', { paint: 0.03, emissive: '#0b1c16', emissiveIntensity: 0.2 }),
    fenceWhite: T('#dfe1e0', { map: A.fenceBars, name: 'lmgavan-fenceWhite', paint: 0, alphaTest: 0.45, side: 'double' }),
    gardArch: sheet('gardArch', A.gardArch, { paint: 0 }), gardRect: sheet('gardRect', A.gardRect, { paint: 0 }), gardDoor: sheet('gardDoor', A.gardDoor, { paint: 0 }), gardWall: sheet('gardWall', A.gardWall, { paint: 0.04 }),
    stepsStone: flat('stepsStone', '#b3b1aa', { paint: 0.04 }), gardPlinth: flat('gardPlinth', '#9a978c', { paint: 0.05 }),
    brickDark: sheet('brickDark', A.brickDark, { paint: 0.04 }), towerShaft: sheet('towerShaft', A.towerShaft, { paint: 0.03 }), towerBoards: sheet('towerBoards', A.towerBoards, { paint: 0.04 }), towerWin: sheet('towerWin', A.towerWin, { paint: 0 }),
    towerNet: T('#2f7f72', { map: A.towerNet, name: 'lmgavan-towerNet', paint: 0, alphaTest: 0.35, side: 'double' }), roofTar: flat('roofTar', '#3c3532', { paint: 0.04 }), timber: flat('timber', '#6a4a35', { paint: 0.04 }), doorRed: flat('doorRed', '#9b3a2e', { paint: 0.03 }),
    boatWhite: flat('boatWhite', '#f2f2ee', { paint: 0.02 }), boatBlue: flat('boatBlue', '#2f5fa5', { paint: 0.02 }), boatDeck: flat('boatDeck', '#b7b0a0', { paint: 0.03 }), mastWhite: flat('mastWhite', '#e6e8e8', { paint: 0.01 }),
    // ---- workers' town
    townUp: sheet('townUp', A.townUp, { paint: 0.03 }), townGF: sheet('townGF', A.townGF, { paint: 0.03 }), townBrick: sheet('townBrick', A.townBrick, { paint: 0.04 }), annexBrick: sheet('annexBrick', A.annexBrick, { paint: 0.04 }), townPlaster: sheet('townPlaster', A.townPlaster, { paint: 0.04 }),
    roofGreen: sheet('roofGreen', A.roofGreen, { paint: 0.03 }), gableBoards: sheet('gableBoards', A.gableBoards, { paint: 0.03 }), townDoor: sheet('townDoor', A.townDoor, { paint: 0 }), clubFace: sheet('clubFace', A.clubFace, { paint: 0.03 }), clubWin: sheet('clubWin', A.clubWin, { paint: 0 }),
    annexWin: sheet('annexWin', A.annexWin, { paint: 0 }), judoSign: sheet('judoSign', A.judoSign, { paint: 0, polygonOffset: -2 }), plaqueDril: T(W, { map: A.plaqueDril, name: 'lmgavan-plaqueDril', paint: 0, polygonOffset: -2 }), mural: sheet('mural', A.mural, { paint: 0.01 }),
    bracket: flat('bracket', '#6a3b2a', { paint: 0.04 }), chimneyBrick: flat('chimneyBrick', '#8a4a38', { paint: 0.04 }), balcony: flat('balcony', '#37a38f', { paint: 0.03 }), flatRoof: flat('flatRoof', '#6b5a50', { paint: 0.04 }), stoop: flat('stoop', '#9a978c', { paint: 0.05 }),
    // ---- fire reserve
    fireBay: sheet('fireBay', A.fireBay, { paint: 0.02 }), fireWall: sheet('fireWall', A.fireWall, { paint: 0.02 }), fireTowerArch: sheet('fireTowerArch', A.fireTowerArch, { paint: 0 }), fireCream: sheet('fireCream', A.fireCream, { paint: 0.03 }), fireBrick: sheet('fireBrick', A.fireBrick, { paint: 0.04 }),
    fireRose: sheet('fireRose', A.fireRose, { paint: 0 }), fireWin: sheet('fireWin', A.fireWin, { paint: 0 }), zincBlue: flat('zincBlue', '#a9b7bf', { paint: 0.03 }), zincPyr: flat('zincPyr', '#b5c0c6', { paint: 0.03 }), rearBrick: flat('rearBrick', '#a05a45', { paint: 0.04 }), rearRoof: flat('rearRoof', '#7a4a3a', { paint: 0.04 }),
    // ---- church
    churchWall17: sheet('churchWall17', A.churchWall17, { paint: 0.03 }), churchWall12: sheet('churchWall12', A.churchWall12, { paint: 0.03 }), churchWall7: sheet('churchWall7', A.churchWall7, { paint: 0.03 }), churchPlain: sheet('churchPlain', A.churchPlain, { paint: 0.03 }), churchRelief: sheet('churchRelief', A.churchRelief, { paint: 0.02 }),
    drumCentral: sheet('drumCentral', A.drumCentral, { paint: 0.02 }), drumConch: sheet('drumConch', A.drumConch, { paint: 0.02 }), belfry: sheet('belfry', A.belfry, { paint: 0.02 }), domeSilver: sheet('domeSilver', A.domeSilver, { paint: 0.01 }),
    gildBand: sheet('gildBand', A.gildBand, { paint: 0.01, emissive: '#3a2a08', emissiveIntensity: 0.25 }), gildScale: sheet('gildScale', A.gildScale, { paint: 0.01, emissive: '#3a2a08', emissiveIntensity: 0.25 }), gild: flat('gild', '#d7a93a', { paint: 0.02, emissive: '#3a2a08', emissiveIntensity: 0.25 }),
    portalChurch: sheet('portalChurch', A.portalChurch, { paint: 0.01 }), hoarding: sheet('hoarding', A.hoarding, { paint: 0.03 }), passport: sheet('passport', A.passport, { paint: 0 }), logs: sheet('logs', A.logs, { paint: 0.03 }), metalTile: sheet('metalTile', A.metalTile, { paint: 0.03 }), checker: sheet('checker', A.checker, { paint: 0.01 }),
    zincChurch: flat('zincChurch', '#aab2b9', { paint: 0.03 }),
    // ---- bridge
    pile: flat('pile', '#5e5750', { paint: 0.04 }),
    deckSteel: sheet('deckSteel', A.deckSteel, { paint: 0.03 }), plank: sheet('plank', A.plank, { paint: 0.03 }),
  });
  // look-alike materials share one object (fewer draw calls per sector: the module stays near the ~80 materials of the performance rules)
  M.trimCream = M.rotStucco = M.boatWhite = M.mastWhite = M.roofWhite = M.craneWhite = M.white;
  M.zincLight = M.zincPyr = M.zincChurch = M.zincBlue;
  M.stoop = M.gardPlinth = M.stepsStone = M.plinth = M.coping;
  M.timber = M.bracket;
  M.cutouts = new Set([M.fenceBars, M.fenceFan, M.fenceWhite, M.towerNet]);
  M.decals = new Set([M.judoSign, M.plaqueDril, M.plaqueKron, M.setts, M.lawn, M.lawnDry, M.gravel, M.pavedGranite]);
  M.glassy = new Set([]);
  return M;
}
