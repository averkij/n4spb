// landmarksSmolensky/mats.js - materials of the module (ctx.mat.toon / glass only; every name starts with 'lmsmol-').  Colours: docs/research/smolensky.md sections 4-8 (art.js COL).
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset: windows, plaques), M.glassy = transparent sheets.
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmsmol-' + name, paint: 0.02, ...o });
  const flat = (name, col, o = {}) => T(col, { name: 'lmsmol-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    // ---- Smolensk church
    blue: flat('blue', C.blue, { paint: 0.05 }), white: flat('white', C.white, { paint: 0.03 }), whiteS: flat('whiteS', C.whiteShade, { paint: 0.03 }), plinth: flat('plinth', C.plinth, { paint: 0.05 }),
    zinc: sheet('zincM', A.zinc, { paint: 0.03 }), zincDark: sheet('zincDarkM', A.zincDark, { paint: 0.03 }), roofDark: sheet('roofDarkM', A.roofDark, { paint: 0.03 }),
    sheet: sheet('sheetM', A.sheet, { paint: 0.02 }), sheetPlain: sheet('sheetPlainM', A.sheetPlain, { paint: 0.02 }), spire: flat('spire', C.spire, { paint: 0.02 }),
    gold: sheet('goldM', A.goldSheet, { paint: 0.01, emissive: '#6a4a0a', emissiveIntensity: 0.25 }), goldFlat: flat('goldFlat', C.gold, { paint: 0.01, emissive: '#6a4a0a', emissiveIntensity: 0.25 }),
    chestnut: flat('chestnut', C.chestnut, { paint: 0.03 }), canopy: flat('canopy', C.canopy, { paint: 0.03 }), iron: flat('iron', C.iron, { paint: 0.01 }), stepGranite: flat('stepGranite', C.stepGranite, { paint: 0.05 }),
    pipe: flat('pipe', C.pipe, { paint: 0.02 }), woodLine: flat('woodLine', '#8a6a46', { paint: 0.03 }), blueDark: flat('blueDark', '#435363', { paint: 0.03 }),
    latt: sheet('lattM', A.latt, { paint: 0, polygonOffset: -2 }), lattGate: sheet('lattGateM', A.lattGate, { paint: 0, polygonOffset: -2 }), lattRe: sheet('lattReM', A.lattRe, { paint: 0, polygonOffset: -2 }),
    paneDrum: sheet('paneDrumM', A.paneDrum, { paint: 0, polygonOffset: -2 }), paneLantern: sheet('paneLanternM', A.paneLantern, { paint: 0, polygonOffset: -2 }),
    winGate: sheet('winGateM', A.winGate, { paint: 0, polygonOffset: -2 }), bell: sheet('bellM', A.bell, { paint: 0, polygonOffset: -2 }), door: sheet('doorM', A.door, { paint: 0.01, polygonOffset: -2 }),
    doorRe: sheet('doorReM', A.doorRe, { paint: 0.01, polygonOffset: -2 }), doorWest: sheet('doorWestM', A.doorWest, { paint: 0.01, polygonOffset: -2 }),
    dark: flat('dark', '#14171c', { paint: 0 }), glory: sheet('gloryM', A.glory, { paint: 0.01, polygonOffset: -2 }), rosette: sheet('rosetteM', A.rosette, { paint: 0.01, polygonOffset: -2 }),
    churchHours: sheet('churchHoursM', A.churchHours, { paint: 0, polygonOffset: -3 }), churchPlate: sheet('churchPlateM', A.churchPlate, { paint: 0, polygonOffset: -3 }),
    // ---- Xenia chapel
    xGreen: sheet('xGreenM', A.pebble, { paint: 0.04 }), xGreenDark: sheet('xGreenDarkM', A.pebbleDark, { paint: 0.04 }), xWhite: flat('xWhite', C.xWhite, { paint: 0.03 }), xBrown: flat('xBrown', C.xBrown, { paint: 0.03 }),
    xTent: sheet('xTentM', A.scales, { paint: 0.03 }), xDrum: flat('xDrum', C.xDrum, { paint: 0.02 }), xGold: flat('xGold', C.xGold, { paint: 0.01, emissive: '#6a4a0a', emissiveIntensity: 0.3 }), xPlinth: flat('xPlinth', C.xPlinth, { paint: 0.05 }),
    amber: sheet('amberM', A.amber, { paint: 0, polygonOffset: -2, emissive: '#c98820', emissiveIntensity: 0.35 }), xHours: sheet('xHoursM', A.xHours, { paint: 0, polygonOffset: -3 }), xBurial: sheet('xBurialM', A.xBurial, { paint: 0, polygonOffset: -3 }),
    medallion: sheet('medallionM', A.medallion, { paint: 0.01, polygonOffset: -2 }), kokoshnik: sheet('kokoshnikM', A.kokoshnikIcon, { paint: 0.01, polygonOffset: -2, emissive: '#6a4a0a', emissiveIntensity: 0.25 }),
    xDoor: flat('xDoor', '#5a3a28', { paint: 0.03 }), xPanel: flat('xPanel', '#6d7a8a', { paint: 0.02 }),
    // ---- Trinity chapel
    tWhite: flat('tWhite', C.tWhite, { paint: 0.03 }), tLead: flat('tLead', C.tLead, { paint: 0.03 }), tRoof: sheet('tRoofM', A.roofDark, { paint: 0.03 }), tGranite: flat('tGranite', C.tGranite, { paint: 0.05 }), tCollar: flat('tCollar', '#4a3a32', { paint: 0.02 }),
    trPlaque: sheet('trPlaqueM', A.trPlaque, { paint: 0, polygonOffset: -3 }), trMosaic: sheet('trMosaicM', A.trMosaic, { paint: 0.01, polygonOffset: -2 }), grille: sheet('grilleM', A.grille, { paint: 0, side: 'double', alphaTest: 0.4 }),
    // ---- Holy Gates
    yellow: flat('yellow', C.yellow, { paint: 0.05 }), yTrim: flat('yTrim', C.yTrim, { paint: 0.03 }), yRoof: sheet('yRoofM', A.zincDark, { paint: 0.03 }), yPlinth: flat('yPlinth', C.yPlinth, { paint: 0.05 }),
    arina: sheet('arinaM', A.arina, { paint: 0, polygonOffset: -3 }), hours: sheet('hoursM', A.hours, { paint: 0, polygonOffset: -3 }), monGate: sheet('monGateM', A.monGate, { paint: 0, polygonOffset: -3 }),
    leaf: sheet('leafM', A.leaf, { paint: 0, side: 'double', alphaTest: 0.4 }), booth: flat('booth', '#ece9e2', { paint: 0.03 }), boothRoof: flat('boothRoof', '#6d4a3a', { paint: 0.03 }), orange: flat('orange', '#d9602a', { paint: 0.02 }),
    // ---- Resurrection church
    brick: sheet('brickM', A.brick, { paint: 0.04 }), brickSparse: sheet('brickSparseM', A.brickSparse, { paint: 0.04 }), brickPlain: sheet('brickPlainM', A.brickPlain, { paint: 0.04 }), rWhite: flat('rWhite', C.rWhite, { paint: 0.03 }), rGold: sheet('rGoldM', A.goldSheet, { paint: 0.01, emissive: '#6a4a0a', emissiveIntensity: 0.3 }),
    rGoldFlat: flat('rGoldFlat', C.rGold, { paint: 0.01, emissive: '#6a4a0a', emissiveIntensity: 0.3 }), rPlinth: flat('rPlinth', C.rPlinth, { paint: 0.05 }), rBlue: T(C.rBlue, { map: A.sheetPlain, name: 'lmsmol-rBlueM', paint: 0.02 }), rBlueFlat: flat('rBlueFlat', C.rBlue, { paint: 0.02 }),
    rBrickDark: flat('rBrickDark', '#8c4a38', { paint: 0.04 }), louvre: flat('louvre', '#5a4a44', { paint: 0.03 }), rShade: flat('rShade', '#d8d4cc', { paint: 0.03 }),
    // ---- fences, ground, furniture
    bars: sheet('barsM', A.bars, { paint: 0, side: 'double', alphaTest: 0.4 }), barsK: sheet('barsKM', A.barsK, { paint: 0, side: 'double', alphaTest: 0.4 }), barIron: flat('barIron', C.bars, { paint: 0.01 }), barBlack: flat('barBlack', '#16181b', { paint: 0.01 }),
    socle: flat('socle', C.socle, { paint: 0.05 }), wallPlaster: flat('wallPlaster', '#d9c9a0', { paint: 0.05 }), plotFence: sheet('plotFenceM', A.plotFence, { paint: 0, side: 'double', alphaTest: 0.4 }), concrete: sheet('concreteM', A.concrete, { paint: 0.03 }), granite: sheet('graniteM', A.granite, { paint: 0.04 }),
    pavers: T(W, { map: A.pavers, name: 'lmsmol-paversM', paint: 0.04, polygonOffset: -4 }), asphalt: T(W, { map: A.asphalt, name: 'lmsmol-asphaltM', paint: 0.04, polygonOffset: -4 }), gravel: T(W, { map: A.gravel, name: 'lmsmol-gravelM', paint: 0.04, polygonOffset: -4 }),
    floor: T(W, { map: A.floor, name: 'lmsmol-floorM', paint: 0.03 }),
    lamp: flat('lamp', '#1a1c1f', { paint: 0.01 }), lampGlass: T('#f0ecd0', { name: 'lmsmol-lampGlass', paint: 0, emissive: '#e8e2b8', emissiveIntensity: 0.3 }), poleGrey: flat('poleGrey', '#8d9092', { paint: 0.03 }),
    benchSlat: flat('benchSlat', '#8a6a46', { paint: 0.04 }), benchIron: flat('benchIron', '#1d1f22', { paint: 0.01 }), bin: flat('bin', '#25282b', { paint: 0.02 }), plate: flat('plate', '#eeeeea', { paint: 0.02 }),
    flower: flat('flower', '#d9a040', { paint: 0.02 }), flowerRed: flat('flowerRed', '#c0453a', { paint: 0.02 }), flowerWhite: flat('flowerWhite', '#f1efe9', { paint: 0.02 }), flowerPink: flat('flowerPink', '#d56a9a', { paint: 0.02 }),
    urn: flat('urn', '#e9e6dc', { paint: 0.03 }), boulder: flat('boulder', '#8f6f5a', { paint: 0.05 }), leafGreen: flat('leafGreen', '#4f8a3c', { paint: 0.03 }),
    // ---- graves
    stoneBlack: flat('stoneBlack', '#26292b', { paint: 0.03 }), stoneGrey: flat('stoneGrey', '#6c6f72', { paint: 0.04 }), stoneRed: flat('stoneRed', '#7a4a45', { paint: 0.04 }), stonePale: flat('stonePale', '#b4b1a8', { paint: 0.04 }), kerb: flat('kerb', '#9a978f', { paint: 0.05 }),
    soil: flat('soil', '#55452f', { paint: 0.04 }), ironRust: flat('ironRust', '#4a2f26', { paint: 0.03 }), crossIron: flat('crossIron', '#2a2a2c', { paint: 0.01 }), woodCross: flat('woodCross', '#6b5b4a', { paint: 0.04 }), tombRed: flat('tombRed', '#8a5a58', { paint: 0.04 }), tombGrey: flat('tombGrey', '#9a9a96', { paint: 0.04 }), tombLime: flat('tombLime', '#c9c3b2', { paint: 0.04 }),
    capGrey: flat('capGrey', '#5c5f63', { paint: 0.03 }), bronze: flat('bronze', '#5a4a38', { paint: 0.03 }), bronzeShawl: flat('bronzeShawl', '#56553c', { paint: 0.03 }), bronzeFace: flat('bronzeFace', '#9a8a62', { paint: 0.03 }),
  });
  M.cutouts = new Set([M.bars, M.barsK, M.leaf, M.grille, M.plotFence]);
  M.decals = new Set([M.latt, M.lattGate, M.lattRe, M.paneDrum, M.paneLantern, M.winGate, M.bell, M.door, M.doorRe, M.doorWest, M.glory, M.rosette, M.churchHours, M.churchPlate, M.amber, M.xHours, M.xBurial, M.medallion, M.kokoshnik, M.trPlaque, M.trMosaic, M.arina, M.hours, M.monGate, M.pavers, M.asphalt, M.gravel]);
  M.glassy = new Set([]);
  return M;
}
