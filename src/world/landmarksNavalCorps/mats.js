// landmarksNavalCorps/mats.js - materials of the module (ctx.mat.toon / glass only; every name starts with 'lmnaval-').  Colours: docs/research/navalcorps.md sections 4.9, 5.4, 6.3, 7.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 1-6 cm in front of a surface (polygonOffset), M.glassy = transparent sheets (no outline, no shadow).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmnaval-' + name, paint: 0.02, ...o });
  const flat = (name, col, o = {}) => T(col, { name: 'lmnaval-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    // ---- Corps
    stucco: sheet('stucco', A.stucco, { paint: 0.04 }), rust: sheet('rust', A.rust, { paint: 0.03 }), plaster: flat('plaster', C.plaster, { paint: 0.04 }), plasterShade: flat('plasterShade', C.plasterShade, { paint: 0.03 }),
    trim: flat('trim', C.trim, { paint: 0.02 }), trimShade: flat('trimShade', '#d8d2bf', { paint: 0.02 }), column: flat('column', C.column, { paint: 0.02 }), plinth: flat('plinth', C.plinth, { paint: 0.05 }),
    tile: sheet('tile', A.tile, { paint: 0.04 }), terrace: T(W, { map: A.terrace, name: 'lmnaval-terrace', paint: 0.04, polygonOffset: -4 }),
    grille: T(W, { map: A.grille, name: 'lmnaval-grille', paint: 0, alphaTest: 0.4, side: 'double' }),
    winGF: sheet('winGF', A.winGF, { paint: 0.0 }), winF1: sheet('winF1', A.winF1, { paint: 0.0 }), winTF: sheet('winTF', A.winTF, { paint: 0.0 }), winChurch: sheet('winChurch', A.winChurch, { paint: 0 }),
    doorW: sheet('doorW', A.doorW, { paint: 0.01 }), doorE: sheet('doorE', A.doorE, { paint: 0.01 }), lunette: sheet('lunette', A.lunette, { paint: 0 }), roundel: sheet('roundel', A.roundel, { paint: 0.02 }),
    zinc: sheet('zinc', A.zinc, { paint: 0.03 }), zincRust: sheet('zincRust', A.zincRust, { paint: 0.03 }), roofCream: flat('roofCream', C.roofCream, { paint: 0.03 }), dome: sheet('dome', A.dome, { paint: 0.02 }),
    gild: flat('gild', C.gild, { paint: 0.02, emissive: '#3a2a08', emissiveIntensity: 0.25 }), iron: flat('iron', C.iron, { paint: 0.01 }), pipe: flat('pipe', C.pipe, { paint: 0.02 }),
    turret: flat('turret', C.turret, { paint: 0.04 }), brickRed: flat('brickRed', C.brickRed, { paint: 0.05 }), chimney: flat('chimney', C.chimney, { paint: 0.03 }), chimneyCream: flat('chimneyCream', C.chimneyCream, { paint: 0.03 }),
    plaqueBlank: sheet('plaqueBlank', A.plaqueBlank, { paint: 0, polygonOffset: -2 }), glassDark: flat('glassDark', '#2d373b', { paint: 0 }),
    // ---- monument and stair
    graniteRed: sheet('graniteRed', A.graniteRed, { paint: 0.03 }), graniteRedFlat: flat('graniteRedFlat', C.granite, { paint: 0.04 }), stairGranite: sheet('stairGranite', A.stairGranite, { paint: 0.04 }), stairRiser: flat('stairRiser', C.stairRiser, { paint: 0.04 }),
    ashlar: sheet('ashlar', A.ashlar, { paint: 0.04 }), blockTop: flat('blockTop', C.parapet, { paint: 0.04 }), blockShade: flat('blockShade', C.blockShade, { paint: 0.04 }),
    plate: T(W, { map: A.plate, name: 'lmnaval-plate', paint: 0, alphaTest: 0.4, polygonOffset: -2 }), arms: T(W, { map: A.arms, name: 'lmnaval-arms', paint: 0, alphaTest: 0.4, polygonOffset: -2 }),
    wheelPanel: T(W, { map: A.wheelPanel, name: 'lmnaval-wheelPanel', paint: 0, alphaTest: 0.4, side: 'double' }), lattice: T(W, { map: A.lattice, name: 'lmnaval-lattice', paint: 0, alphaTest: 0.4, side: 'double' }),
    verdi: T(W, { map: A.verdi, name: 'lmnaval-verdi', paint: 0.03, emissive: '#0b1c16', emissiveIntensity: 0.3 }), verdiDark: T('#a6bdb4', { map: A.verdi, name: 'lmnaval-verdiDark', paint: 0.03, emissive: '#06120d', emissiveIntensity: 0.2 }),
    ironRail: flat('ironRail', C.ironRail, { paint: 0.01 }), bronzeBack: flat('bronzeBack', '#3a352f', { paint: 0.02 }),
    // ---- church
    brick: sheet('brick', A.brick, { paint: 0.04 }), brickPlain: sheet('brickPlain', A.brickPlain, { paint: 0.04 }), arcature: sheet('arcature', A.arcature, { paint: 0.03 }), brickFlat: flat('brickFlat', C.brick, { paint: 0.04 }),
    belt: flat('belt', C.belt, { paint: 0.03 }), plinthCh: flat('plinthCh', C.plinthCh, { paint: 0.06 }), plinthChLit: flat('plinthChLit', '#8f8a82', { paint: 0.05 }), vault: flat('vault', C.vault, { paint: 0.04 }), greyRoof: flat('greyRoof', C.grey, { paint: 0.03 }), stalk: flat('stalk', C.stalk, { paint: 0.03 }),
    mosaic: sheet('mosaic', A.mosaic, { paint: 0.01, polygonOffset: -2 }), knot: sheet('knot', A.knot, { paint: 0.01, emissive: '#3a2a08', emissiveIntensity: 0.25 }), silver: sheet('silver', A.silver, { paint: 0.01 }), domeAl: sheet('domeAl', A.domeAl, { paint: 0.02 }),
    gildDiamond: sheet('gildDiamond', A.gildDiamond, { paint: 0.01, emissive: '#3a2a08', emissiveIntensity: 0.25 }), portalDoor: sheet('portalDoor', A.portalDoor, { paint: 0.02 }),
    facadeHouse: sheet('facadeHouse', A.facadeHouse, { paint: 0.04 }), houseWin: sheet('houseWin', A.houseWin, { paint: 0 }), ochreWall: sheet('ochreWall', A.ochreWall, { paint: 0.04 }), houseCream: flat('houseCream', C.houseCream, { paint: 0.02 }), houseTerra: flat('houseTerra', C.houseTerra, { paint: 0.03 }),
    // ---- S-189
    hull: sheet('hull', A.hullGrey, { paint: 0.02 }), green: flat('green', C.green, { paint: 0.03 }), boot: flat('boot', C.boot, { paint: 0.01 }), deck: flat('deck', C.deck, { paint: 0.03 }), slots: sheet('slots', A.slots, { paint: 0 }),
    sail: T(W, { map: A.sail, name: 'lmnaval-sail', paint: 0, alphaTest: 0.4, polygonOffset: -2, emissive: '#7a7a7a', emissiveIntensity: 1 }),   // the numerals stay near white on the shaded (quay) side too
    sailPlate: sheet('sailPlate', A.sailGrey, { paint: 0.02 }), banner: sheet('banner', A.banner, { paint: 0 }), fender: sheet('fender', A.fender, { paint: 0.03 }), concrete: sheet('concrete', A.concrete, { paint: 0.04 }),
    mast: flat('mast', C.mast, { paint: 0.01 }), tent: flat('tent', C.tent, { paint: 0.03 }), umbrella: flat('umbrella', C.umbrella, { paint: 0.02 }), blueTent: flat('blueTent', '#2f6fb0', { paint: 0.02 }), buoy: flat('buoy', '#e8602c', { paint: 0.02 }), pole: flat('pole', '#2a2d30', { paint: 0.01 }),
    meshFence: flat('meshFence', '#3a5a3c', { paint: 0.02 }), lifebuoy: flat('lifebuoy', '#e8602c', { paint: 0.02 }),
  });
  M.cutouts = new Set([M.grille, M.plate, M.arms, M.wheelPanel, M.lattice, M.sail]);
  M.decals = new Set([M.terrace, M.mosaic, M.plaqueBlank, M.plate, M.arms, M.sail]);
  M.glassy = new Set([]);
  return M;
}
