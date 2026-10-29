// landmarksDekabristov/mats.js - materials of the module (ctx.mat.toon only; every name starts with 'lmdek-').  The stone / iron / flower colours are those of landmarksSmolensky/mats.js (the same family of cemeteries), the
// water film is the one of the Andrew boulevard fountains, the lamp glass of the Light-and-Music fountain is emissive.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset: paving, plates), M.glassy = transparent sheets.
import { makeArt } from './art.js';

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A };
  const W = '#ffffff';
  const flat = (name, col, o = {}) => T(col, { name: 'lmdek-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    // ---- fences, walls, paving
    bars: T(W, { map: A.bars, name: 'lmdek-barsM', paint: 0, side: 'double', alphaTest: 0.4 }),
    rail: T(W, { map: A.rail, name: 'lmdek-railM', paint: 0, side: 'double', alphaTest: 0.4 }),
    barIron: flat('barIron', '#2c333a', { paint: 0.01 }), barGreen: flat('barGreen', '#3d4a44', { paint: 0.01 }),
    concrete: T(W, { map: A.concrete, name: 'lmdek-concreteM', paint: 0.03 }), wallPlaster: flat('wallPlaster', '#d9c9a0', { paint: 0.05 }), brickWall: flat('brickWall', '#9a5a46', { paint: 0.05 }),
    granite: T(W, { map: A.granite, name: 'lmdek-graniteM', paint: 0.04 }),
    pavers: T(W, { map: A.pavers, name: 'lmdek-paversM', paint: 0.04, polygonOffset: -4 }), asphalt: T(W, { map: A.asphalt, name: 'lmdek-asphaltM', paint: 0.04, polygonOffset: -4 }), gravel: T(W, { map: A.gravel, name: 'lmdek-gravelM', paint: 0.04, polygonOffset: -4 }),
    lawn: flat('lawn', '#5f8f3b', { paint: 0.05, polygonOffset: -3 }), lawnDark: flat('lawnDark', '#4f7e33', { paint: 0.05, polygonOffset: -3 }), soil: flat('soil', '#55452f', { paint: 0.04, polygonOffset: -3 }),
    // ---- stone and metal of monuments and graves
    stoneBlack: flat('stoneBlack', '#26292b', { paint: 0.03 }), stoneGrey: flat('stoneGrey', '#6c6f72', { paint: 0.04 }), stoneRed: flat('stoneRed', '#7a4a45', { paint: 0.04 }), stonePale: flat('stonePale', '#b4b1a8', { paint: 0.04 }),
    graniteGrey: flat('graniteGrey', '#8e8f90', { paint: 0.04 }), graniteDark: flat('graniteDark', '#4d5054', { paint: 0.04 }), graniteRose: flat('graniteRose', '#9a766d', { paint: 0.04 }), marble: flat('marble', '#e4e2da', { paint: 0.03 }),
    kerb: flat('kerb', '#9a978f', { paint: 0.05 }), crossIron: flat('crossIron', '#2a2a2c', { paint: 0.01 }), ironRust: flat('ironRust', '#4a2f26', { paint: 0.03 }),
    bronze: flat('bronze', '#5a4a38', { paint: 0.03 }), bronzeGreen: flat('bronzeGreen', '#4b5a48', { paint: 0.03 }), roofGrey: flat('roofGrey', '#5b5e66', { paint: 0.03 }), roofCopper: flat('roofCopper', '#5e7f6e', { paint: 0.03 }), plaster: flat('plaster', '#e0d6bd', { paint: 0.04 }),
    // ---- furniture
    lamp: flat('lamp', '#1a1c1f', { paint: 0.01 }), lampGlass: T('#f0ecd0', { name: 'lmdek-lampGlass', paint: 0, emissive: '#e8e2b8', emissiveIntensity: 0.3 }), poleGrey: flat('poleGrey', '#8d9092', { paint: 0.03 }),
    benchSlat: flat('benchSlat', '#8a6a46', { paint: 0.04 }), benchIron: flat('benchIron', '#1d1f22', { paint: 0.01 }), bin: flat('bin', '#25282b', { paint: 0.02 }),
    flower: flat('flower', '#d9a040', { paint: 0.02 }), flowerRed: flat('flowerRed', '#c0453a', { paint: 0.02 }), flowerWhite: flat('flowerWhite', '#f1efe9', { paint: 0.02 }), flowerPink: flat('flowerPink', '#d56a9a', { paint: 0.02 }), leafGreen: flat('leafGreen', '#4f8a3c', { paint: 0.03 }),
    // ---- the fountain
    water: T('#7fb0c8', { map: A.water, name: 'lmdek-water', transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: -3, paint: 0.01 }),
    foam: flat('foam', '#e8f1f4', { paint: 0.01 }),
    lightRed: T('#e4524a', { name: 'lmdek-lightRed', paint: 0, emissive: '#e4524a', emissiveIntensity: 0.55 }), lightBlue: T('#4a8de4', { name: 'lmdek-lightBlue', paint: 0, emissive: '#4a8de4', emissiveIntensity: 0.55 }),
    lightGreen: T('#58c46a', { name: 'lmdek-lightGreen', paint: 0, emissive: '#58c46a', emissiveIntensity: 0.55 }), lightWhite: T('#f2f0e6', { name: 'lmdek-lightWhite', paint: 0, emissive: '#f2f0e6', emissiveIntensity: 0.55 }),
  });
  M.cutouts = new Set([M.bars, M.rail]);
  M.decals = new Set([M.pavers, M.asphalt, M.gravel, M.lawn, M.lawnDark, M.soil]);
  M.glassy = new Set([M.water]);
  M.plates = new Set();          // plateMat() results are added by the parts (decals)
  return M;
}
