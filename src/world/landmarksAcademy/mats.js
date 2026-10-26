// landmarksAcademy/mats.js - materials of the module (ctx.mat.toon / glass only; every name starts with 'lmacade-').  Colours: docs/research/academy.md sections 3.7, 4.4, 5, 6 (art.js COL).
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset), M.glassy = transparent sheets (no outline, no shadow).
import { makeArt, COL } from './art.js';
import { makeArt2 } from './art2.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  makeArt2(ctx, A);
  const W = '#ffffff';
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmacade-' + name, paint: 0.02, ...o });
  const flat = (name, col, o = {}) => T(col, { name: 'lmacade-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    // ---- academy: bays and plain walls
    bFront: sheet('bFront', A.front), bFrontCorner: sheet('bFrontCorner', A.frontCorner), bRear: sheet('bRear', A.rear), bRearCorner: sheet('bRearCorner', A.rearCorner),
    bFrontBlank: sheet('bFrontBlank', A.frontBlank), bRearBlank: sheet('bRearBlank', A.rearBlank), bRearCornerBlank: sheet('bRearCornerBlank', A.rearCornerBlank), bFlankBlank: sheet('bFlankBlank', A.flankBlank), bFlankEndBlank: sheet('bFlankEndBlank', A.flankEndBlank),
    bFlank: sheet('bFlank', A.flank), bFlankEnd: sheet('bFlankEnd', A.flankEnd), bCourt: sheet('bCourt', A.court), bInner: sheet('bInner', A.inner), cpFront: sheet('cpFront', A.cpFront), rearBase: sheet('rearBase', A.rearBase), rearUpper: sheet('rearUpper', A.rearUpper),
    field: flat('field', C.field, { paint: 0.04 }), rearField: flat('rearField', C.rearField, { paint: 0.04 }), flankField: flat('flankField', C.flankField, { paint: 0.04 }),
    order: flat('order', C.order, { paint: 0.03 }), orderShade: flat('orderShade', C.orderShade, { paint: 0.03 }), soffit: flat('soffit', '#cfc6b4', { paint: 0.02 }),
    ground: flat('ground', C.ground, { paint: 0.04 }), granitePlinth: T(C.plinth, { map: A.greyGrain, name: 'lmacade-granitePlinth', paint: 0.04 }),
    rust: T(C.ground, { map: A.rust, name: 'lmacade-rust', paint: 0.04 }), rustRear: T(C.rearGround, { map: A.rust, name: 'lmacade-rustRear', paint: 0.04 }), rustFlank: T(C.flankGround, { map: A.rust, name: 'lmacade-rustFlank', paint: 0.04 }),
    frieze: sheet('frieze', A.frieze, { paint: 0.02 }), modil: sheet('modil', A.modil, { paint: 0.02 }), balus: T(C.order, { map: A.balus, alphaTest: 0.5, side: 'double', name: 'lmacade-balus', paint: 0.02 }),
    door: sheet('door', A.door, { paint: 0.01 }), tablet: sheet('tablet', A.tablet, { paint: 0.0 }), plaqueDark: sheet('plaqueDark', A.plaqueDark, { paint: 0.0 }),
    roof: T(C.roof, { map: A.roof, name: 'lmacade-roof', paint: 0.04 }), roofLight: T(C.roofLight, { map: A.roof, name: 'lmacade-roofLight', paint: 0.04 }), ribs: T(C.roofLight, { map: A.ribs, name: 'lmacade-ribs', paint: 0.03 }),
    glassRoof: sheet('glassRoof', A.glassRoof, { paint: 0.01 }), steel: flat('steel', '#2f3a40', { paint: 0.01 }),
    chimney: flat('chimney', C.chimney, { paint: 0.04 }), chimneyCap: flat('chimneyCap', C.chimneyCap, { paint: 0.02 }),
    drum: flat('drum', C.drumRing, { paint: 0.03 }), rearDome: flat('rearDome', '#8b9aa0', { paint: 0.04 }),
    bronze: flat('bronze', C.bronze, { paint: 0.05, emissive: '#3a2406', emissiveIntensity: 0.25 }), gold: flat('gold', C.bronzeHi, { paint: 0.03, emissive: '#6a4a08', emissiveIntensity: 0.35 }),
    marble: flat('marble', C.stone, { paint: 0.04 }), iron: flat('iron', C.iron, { paint: 0.01 }), glass: flat('glass', '#35424f', { paint: 0.02 }),
    // ---- court floor
    cobble: T(W, { map: A.cobble, name: 'lmacade-cobble', paint: 0.04, polygonOffset: -4 }), diamond: T(W, { map: A.diamond, name: 'lmacade-diamond', paint: 0.04, polygonOffset: -3 }), bronzeDisc: flat('bronzeDisc', '#33332f', { paint: 0.03 }),
    // ---- pier
    pink: T(C.pink, { map: A.pinkGrain, name: 'lmacade-pink', paint: 0.05 }), pinkShade: T(C.pinkShade, { map: A.pinkGrain, name: 'lmacade-pinkShade', paint: 0.05 }), pinkTop: T(C.pinkTop, { map: A.pinkGrain, name: 'lmacade-pinkTop', paint: 0.05 }),
    slabs: T(C.step, { map: A.slabs, name: 'lmacade-slabs', paint: 0.05 }), steps: T(C.step, { map: A.steps, name: 'lmacade-steps', paint: 0.05 }), stepRiser: T(C.stepShade, { map: A.pinkGrain, name: 'lmacade-stepRiser', paint: 0.05 }),
    hiero: T(C.sphinxPlinth, { map: A.hiero, name: 'lmacade-hiero', paint: 0.04, polygonOffset: -2 }), inscrPed: T(W, { map: A.inscrPed, name: 'lmacade-inscrPed', paint: 0, alphaTest: 0.5, polygonOffset: -2 }),
    sphinx: flat('sphinx', C.sphinx, { paint: 0.07 }), sphinxDark: flat('sphinxDark', '#8f8176', { paint: 0.06 }), crown: flat('crown', C.crown, { paint: 0.06 }), sphinxPlinth: T(C.sphinxPlinth, { map: A.greyGrain, name: 'lmacade-sphinxPlinth', paint: 0.05 }),
    lampGreen: flat('lampGreen', C.lampGreen, { paint: 0.06 }), griffin: flat('griffin', C.griffin, { paint: 0.05 }), griffinHi: flat('griffinHi', C.griffinHi, { paint: 0.04 }), griffinBody: flat('griffinBody', C.griffinBody, { paint: 0.05 }),
    railing: T(C.iron, { map: A.railing, alphaTest: 0.5, side: 'double', name: 'lmacade-railing', paint: 0.0 }), fence: T(C.iron, { map: A.fence, alphaTest: 0.5, side: 'double', name: 'lmacade-fence', paint: 0.0 }),
    water: flat('water', '#2c4a5c', { paint: 0.0 }),
    // ---- garden, square
    lawn: T(C.lawn, { map: A.lawn, name: 'lmacade-lawn', paint: 0.06, polygonOffset: -1 }), gravel: T(C.gravel, { map: A.gravel, name: 'lmacade-gravel', paint: 0.05, polygonOffset: -3 }),
    bark: T(W, { map: A.bark, name: 'lmacade-bark', paint: 0.05 }),
    graniteColumn: T('#c49680', { map: A.pinkGrain, name: 'lmacade-graniteColumn', paint: 0.05 }), verdi: flat('verdi', '#4a8a6a', { paint: 0.05, emissive: '#0b1c16', emissiveIntensity: 0.25 }),
    graniteGrey: T('#8f8176', { map: A.greyGrain, name: 'lmacade-graniteGrey', paint: 0.05 }), graniteRed: T('#9c6a58', { map: A.pinkGrain, name: 'lmacade-graniteRed', paint: 0.05 }), graniteDark: flat('graniteDark', '#2f3034', { paint: 0.03 }),
    bronzeDark: flat('bronzeDark', '#4e4a40', { paint: 0.05 }), bronzeMon: flat('bronzeMon', '#4d4338', { paint: 0.05 }), pedBronze: flat('pedBronze', '#3b3a36', { paint: 0.04 }),
    bollard: flat('bollard', '#8a8a86', { paint: 0.05 }), post: flat('post', '#a09a8c', { paint: 0.05 }),
    lamp: flat('lamp', '#1d2220', { paint: 0.01 }), globe: T('#f1f0e6', { name: 'lmacade-globe', paint: 0, emissive: '#e8e6d6', emissiveIntensity: 0.25 }),
    bench: flat('bench', '#6a5846', { paint: 0.04 }), oak: flat('oak', '#9a6a3a', { paint: 0.05 }),
    // ---- square: the Trezzini house, the Cherkassky banner, the monument
    hotelW: sheet('hotelW', A.hotelW), hotelC: sheet('hotelC', A.hotelC), hotelE: sheet('hotelE', A.hotelE), hotelSide: sheet('hotelSide', A.hotelSide), hotelWall: flat('hotelWall', C.hotel, { paint: 0.04 }), hotelTrim: flat('hotelTrim', C.hotelTrim, { paint: 0.03 }),
    hotelRoof: T(C.hotelRoof, { map: A.roof, name: 'lmacade-hotelRoof', paint: 0.04 }), hotelLetL: T('#ffffff', { map: A.hotelLetL, name: 'lmacade-hotelLetL', paint: 0, alphaTest: 0.5, polygonOffset: -2 }), hotelLetR: T('#ffffff', { map: A.hotelLetR, name: 'lmacade-hotelLetR', paint: 0, alphaTest: 0.5, polygonOffset: -2 }),
    banner: sheet('banner', A.banner, { paint: 0.01 }), cherkSide: sheet('cherkSide', A.cherkSide), cherkDark: flat('cherkDark', '#5f5a55', { paint: 0.04 }), cherkRoof: T('#a7adb0', { map: A.roof, name: 'lmacade-cherkRoof', paint: 0.04 }), brick: flat('brick', '#b0645a', { paint: 0.05 }),
    treziniPed: T('#ffffff', { map: A.treziniPed, name: 'lmacade-treziniPed', paint: 0, alphaTest: 0.5, polygonOffset: -2 }), klodtPed: T('#ffffff', { map: A.klodtPed, name: 'lmacade-klodtPed', paint: 0, alphaTest: 0.5, polygonOffset: -2 }), khetPed: T('#ffffff', { map: A.khetPed, name: 'lmacade-khetPed', paint: 0, alphaTest: 0.5, polygonOffset: -2 }),
    thuja: flat('thuja', '#2f5a30', { paint: 0.06 }), planter: flat('planter', '#25282b', { paint: 0.02 }), apron: T('#2f3034', { name: 'lmacade-apron', paint: 0.03, polygonOffset: -4 }), chain: flat('chain', '#1c1f21', { paint: 0.01 }),
    // ---- garden buildings, the column, the House of Academicians
    pavWing: sheet('pavWing', A.pavWing), pavRange: sheet('pavRange', A.pavRange), pavFront: sheet('pavFront', A.pavFront), pavWall: flat('pavWall', C.pavilion, { paint: 0.04 }), mosaic: sheet('mosaic', A.mosaic), mosaicWall: flat('mosaicWall', C.mosaic, { paint: 0.04 }),
    mosaicRoof: flat('mosaicRoof', '#9b4a34', { paint: 0.05 }), workshop: sheet('workshop', A.workshop), workshopWall: flat('workshopWall', C.workshop, { paint: 0.04 }), flatRoof: flat('flatRoof', '#7d868b', { paint: 0.04 }),
    domWall: sheet('domWall', A.domWall), domPlain: flat('domPlain', C.domA, { paint: 0.04 }), domRoof: T(C.hotelRoof, { map: A.roof, name: 'lmacade-domRoof', paint: 0.04 }), domStone: flat('domStone', '#bfb4a0', { paint: 0.05 }), domDark: flat('domDark', '#6b625a', { paint: 0.05 }),
    colPlateA: sheet('colPlateA', A.colPlateA, { paint: 0 }), colPlateB: sheet('colPlateB', A.colPlateB, { paint: 0 }), colPlateC: sheet('colPlateC', A.colPlateC, { paint: 0 }), floodPlate: sheet('floodPlate', A.floodPlate, { paint: 0 }),
    hedge: flat('hedge', '#3f7a34', { paint: 0.06 }), doricFrieze: sheet('doricFrieze', A.doricFrieze, { paint: 0.02 }),

  });
  M.cutouts = new Set([M.balus, M.railing, M.fence, M.inscrPed, M.hotelLetL, M.hotelLetR, M.treziniPed, M.klodtPed, M.khetPed]);
  M.decals = new Set([M.hiero, M.inscrPed, M.lawn, M.gravel, M.hotelLetL, M.hotelLetR, M.treziniPed, M.klodtPed, M.khetPed, M.apron, M.cobble, M.diamond]);
  M.glassy = new Set();
  return M;
}
