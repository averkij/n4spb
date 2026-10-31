// landmarksKamennyChurch/mats.js - the materials of the church, the chapel and the chain fence (every name starts with 'lmKC-'; <= 20 materials).  Colours: docs/research/kamenny-2026.md 5.2, photos C03 / C05 / H01:
//   brick #B4553F (church, unplastered, stretcher bond) / #C54A2B (chapel, painted) ; plinth + buttresses pink plaster #B3605B ; mouldings white #F1EDE4 ; drum terracotta plaster #D4805A ;
//   roofs: green sheet copper (seams tile) and grey "scale" sheet (scales tile) ; windows: amber bars + iron grille (winLancet), white Y tracery (winDrum) ; gilded crosses #C9A33E ; chain black.
// Alpha cut-outs are listed in M.cutouts (no outline pass), decals / painted panes in M.decals.
import { makeArt } from './art.js';

export const C = {
  pink: '#b3605b', white: '#f1ede4', drum: '#d4805a', green: '#5e7f68', iron: '#1f2124', gold: '#c9a33e', onion: '#8d9496', bell: '#4a4433', wood: '#4b3a2a', granite: '#8e8a84', dark: '#14161a',
};

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const N = (n) => 'lmKC-' + n;
  const map = (name, tex, o = {}) => T('#ffffff', { map: tex, name: N(name), paint: 0.03, ...o });
  Object.assign(M, {
    brick: map('brick', A.brick, { paint: 0.05 }), brickPaint: map('brickPaint', A.brickPaint, { paint: 0.04 }),
    pink: map('pink', A.plaster, { paint: 0.05 }), white: T(C.white, { name: N('white'), paint: 0.03 }), drum: T(C.drum, { name: N('drum'), paint: 0.05 }),
    stone: map('stone', A.limestone, { paint: 0.05 }), pipe: T('#a45a3a', { name: N('pipe'), paint: 0.03 }),
    roofGreen: map('roofGreen', A.seams, { paint: 0.04, side: 'double' }), scales: map('scales', A.scales, { paint: 0.03, side: 'double' }),
    onion: T(C.onion, { name: N('onion'), paint: 0.03 }),
    iron: T(C.iron, { name: N('iron') }), gold: T(C.gold, { emissive: '#6a4a08', emissiveIntensity: 0.4, name: N('gold') }),
    bell: T(C.bell, { name: N('bell'), paint: 0.02 }), wood: T(C.wood, { name: N('wood'), paint: 0.05 }),
    winLancet: map('winLancet', A.winLancet, { polygonOffset: -1 }), winDrum: map('winDrum', A.winDrum, { polygonOffset: -1 }), door: map('door', A.door, { polygonOffset: -1 }),
    plaques: map('plaques', A.plaques, { polygonOffset: -2, paint: 0.01 }), mosaic: map('mosaic', A.mosaic, { polygonOffset: -1, paint: 0.01 }),
  });
  M.granite = M.stone; M.dark = M.iron; M.greenFlat = M.roofGreen;                       // aliases: no extra materials
  M.cutouts = new Set();
  M.decals = new Set([M.winLancet, M.winDrum, M.door, M.plaques, M.mosaic]);
  return M;
}
