// landmarksYelaginKitchen/mats.js - materials of the module (ctx.mat.toon only; every name starts with 'lmyek-').  Colours: dossier 6.1 (walls white #eeeeea, cornice / columns #f6f6f2, plinth #d3c9b0,
// door #b88a52, statues #d3c8b2) and the photos kit_02 / kit_13 (column bases and the capital plinth blocks are painted GREY, the zinc roof is light grey with a dark drip edge).
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const flat = (name, col, o = {}) => T(col, { name: 'lmyek-' + name, paint: 0.03, ...o });
  const sheet = (name, col, map, o = {}) => T(col, { map, name: 'lmyek-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    wall: sheet('wall', C.wall, A.plaster, { paint: 0.04 }), white: sheet('white', C.white, A.plaster, { paint: 0.02 }), whiteFlat: flat('whiteFlat', C.white, { paint: 0.02 }),
    plinth: sheet('plinth', W, A.plinth, { paint: 0.05 }), bands: sheet('bands', W, A.bands, { paint: 0.02 }),
    zinc: sheet('zinc', C.zinc, A.zinc, { paint: 0.04 }),
    grey: flat('grey', C.stoneGrey, { paint: 0.04 }), shade: flat('shade', '#c9c9c4', { paint: 0.03 }),
    door: sheet('door', W, A.door, { paint: 0.02 }), fan: sheet('fan', W, A.fan, { paint: 0.01 }), festoon: sheet('festoon', W, A.festoon, { paint: 0.02 }),
    spears: T(C.iron, { map: A.spears, alphaTest: 0.5, side: 'double', name: 'lmyek-spears', paint: 0 }),
    plaques: sheet('plaques', W, A.plaques, { paint: 0, polygonOffset: -2 }),
    lantern: flat('lantern', C.lantern, { paint: 0.01 }), lampGlass: T('#e9ece3', { name: 'lmyek-lampGlass', paint: 0, emissive: '#e8e2c0', emissiveIntensity: 0.3 }),
  });
  M.cutouts = new Set([M.spears]);
  M.decals = new Set([M.plaques]);
  M.glassy = new Set();
  return M;
}
