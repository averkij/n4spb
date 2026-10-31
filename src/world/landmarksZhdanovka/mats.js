// landmarksZhdanovka/mats.js - the materials of the module (ctx.mat.toon only; every name starts with 'zhd-').  About 19 real materials for the whole module.
// Colours from the photos of the dossier (docs/research/petrovsky-zhdanovka-2026.md, photos m01 m02 m03 m05): copper-brown cornice #6a4a3a, oxidised copper dormer roofs #5a6b5a, iron roofs #7a5a52, zinc mansard #7f8a96,
// brick chimneys #8f4a3a, black cast iron #1d1b1c, cream trim #ece0cc, polished rose granite #a58682.
// Real materials: pebble / rock / frieze (repeating pictures), tiles / det / win (atlases: the virtual materials M.<row> are rows of them, kit.js ATLAS ROWS), rails (alpha cut-out), and the flat colours.
import { makeArt } from './art.js';

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), W = '#ffffff', M = { A, cutouts: new Set() };
  const flat = (name, col, o = {}) => T(col, { name: 'zhd-' + name, paint: 0.03, ...o });
  const sheet = (name, map, o = {}) => T(W, { map, name: 'zhd-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    pebble: sheet('pebble', A.pebble, { paint: 0.02 }), rock: sheet('rock', A.rock, { paint: 0.03 }), frieze: sheet('frieze', A.frieze, { paint: 0.02 }), plinth: sheet('plinth', A.plinth, { paint: 0.02 }),
    tiles: sheet('tiles', A.tiles, { paint: 0.025 }), det: sheet('det', A.det, { paint: 0.03 }), win: sheet('win', A.win, { paint: 0.01 }), signs: sheet('signs', A.signs, { paint: 0.01 }),
    rails: T(W, { map: A.rails, alphaTest: 0.5, side: 'double', name: 'zhd-rails', paint: 0 }),
    copper: flat('copper', '#6a4a3a', { paint: 0.04 }), verd: flat('verd', '#5d7566', { paint: 0.05 }), iron: flat('iron', '#7a5a52', { paint: 0.05 }), zinc: flat('zinc', '#838e99', { paint: 0.04 }),
    brick: flat('brick', '#8f4a3a', { paint: 0.05 }), black: flat('black', '#1d1b1c', { paint: 0.01 }), cream: flat('cream', '#e8dcc6', { paint: 0.03 }), stone: flat('stone', '#a9a090', { paint: 0.04 }),
    granite: flat('granite', '#a58682', { paint: 0.05 }), slate: flat('slate', '#2d3a42', { paint: 0.02 }), shrub: flat('shrub', '#4f7f43', { paint: 0.06 }),
  });
  const rowOf = (real, name, rep) => ({ __atlas: { real, rep, u0: 0.004, u1: 0.996, ...A.uv[name] }, name: 'zhd-' + name });
  for (const n of Object.keys(A.TILES)) M[n] = rowOf(M.tiles, n, true);
  for (const n of ['cobble', 'apron', 'bed']) M[n] = rowOf(M.det, n, true);
  for (const n of ['bayFront', 'bayFlank', 'door', 'dormer']) M[n] = rowOf(M.det, n, false);
  for (const n of Object.keys(A.WIN)) M[n] = rowOf(M.win, n, false);                 // the window pictures keep their own u0 / u1 (A.uv holds them)
  for (const n of Object.keys(A.SIGN)) M[n] = rowOf(M.signs, n, false);
  M.cutouts.add(M.rails);
  return M;
}
