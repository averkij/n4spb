// landmarksAndrew/mats2.js - materials, part 2: balustrades, the Three Hierarchs church, copper domes, fence piers, chapel, obelisk; the market / pavilion / Pel / konka materials are appended here as the parts
// are written (merged by mats.js).  Colours: docs/research/andrew.md 3.7, 3.8, 3.9, 8.4.
import { makeArt2 } from './art2.js';

export function makeMats2(ctx, M, mk) {
  const A = M.A; makeArt2(ctx, A);
  const { flat, sheet, decal, cut } = mk;
  const T = ctx.mat.toon, W = '#ffffff';
  const out = {
    balus: cut('balus', A.balus, { alphaTest: 0.4 }),
    // ---- Three Hierarchs church: brick-red stucco, cool dark-grey roof (photo c15 / 47)
    red: flat('red', '#c04a30', { paint: 0.04 }), redShade: flat('redShade', '#93402d', { paint: 0.04 }),
    roofDark: T('#676f70', { map: A.seams, name: 'lmAnd-roofDark', paint: 0.04, side: 'double' }), cupola: flat('cupola', '#6e6b69', { paint: 0.03 }),
    // ---- order of St Andrew: blue field of the medallion; green copper of the Annunciation domes and the Pel turret
    blueField: flat('blueField', '#2a4a8c', { paint: 0.02 }),
    copper: T('#5a9a82', { map: A.sheetGlow, name: 'lmAnd-copper', paint: 0.04, side: 'double' }), copperDark: flat('copperDark', '#3e6e5d', { paint: 0.04 }),
    chapelDome: T('#6a8176', { map: A.sheetGlow, name: 'lmAnd-chapelDome', paint: 0.04, side: 'double' }),
    // ---- fence piers and walls
    pierPink: flat('pierPink', '#e6bfb2', { paint: 0.04 }), pierSalmon: flat('pierSalmon', '#d6b59f', { paint: 0.04 }), zinc: flat('zinc', '#8f9498', { paint: 0.03 }),
    graniteRed: T('#8a6058', { map: A.graniteGrain, name: 'lmAnd-graniteRed', paint: 0.04 }), graniteGrey: T('#a09d98', { map: A.graniteGrain, name: 'lmAnd-graniteGrey', paint: 0.04 }),
    stuccoBrown: flat('stuccoBrown', '#b99468', { paint: 0.05 }),
    // ---- obelisk shaft (rhombus relief), plaques, bronze
    obeliskShaft: T('#d8cdc8', { map: A.rhomb, name: 'lmAnd-obelisk', paint: 0.03 }), bronze: flat('bronze', '#4a3c2e', { paint: 0.02 }), bronzePlate: flat('bronzePlate', '#3a352f', { paint: 0.02 }),
    chapelRose: flat('chapelRose', '#eec4b4', { paint: 0.04 }),
    golovinPlate: decal('golovinPlate', A.golovin, { polygonOffset: -2 }),
  };
  out.cutouts2 = [out.balus]; out.decals2 = [out.golovinPlate]; out.glassy2 = [];
  void sheet; void decal;
  return out;
}
