// landmarksPetrovskyWest/mats.js - the materials of the module (ctx.mat.toon only; every name starts with 'pwest-').  About 20 materials for the whole module, shared by all sights.
// Colours (dossier docs/research/petrovsky-zhdanovka-2026.md section 10 + the photos refs/petrovsky-west g01..g11 t21..t24 and misc/m09):
//   malthouse: red brick #9e4a34 with white lime streaks, dark brick coping #5c2b22, empty dark windows, grey corrugated hoarding, blue and grey site cabins, birch saplings on the roof;
//   Gote works: brick #a64630, limestone plinth #d0c6b0, light-grey zinc roofs #b6bcc0; the mansion: tan-pink boards #b8977e, black window frames, grey zinc;  the water tower: cream plaster #d6c47e;
//   Almaz office: yellow piers #e4d9a0 + white panels, grey stone relief.
// M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset, no outline); M.cutouts = alpha cut-outs (no outline pass).
import { makeArt } from './art.js';

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), W = '#ffffff', M = { A, decals: new Set(), cutouts: new Set() };
  const flat = (name, col, o = {}) => T(col, { name: 'pwest-' + name, paint: 0.03, ...o });
  const sheet = (name, map, o = {}) => T(W, { map, name: 'pwest-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    ruinBay: sheet('ruinBay', A.ruinBay, { paint: 0.05 }), ruinPlain: sheet('ruinPlain', A.ruinPlain, { paint: 0.05 }),
    hallBay: sheet('hallBay', A.hallBay, { paint: 0.04 }),
    board: sheet('board', A.board, { paint: 0.04 }), basement: sheet('basement', A.basement, { paint: 0.05 }), mansionWin: sheet('mansionWin', A.mansionWin, { paint: 0.02, polygonOffset: -1 }),
    tower: sheet('tower', A.tower, { paint: 0.04 }),
    almazBay: sheet('almazBay', A.almazBay, { paint: 0.03 }), almazBay0: sheet('almazBay0', A.almazBay0, { paint: 0.03 }), relief: sheet('relief', A.relief, { paint: 0.05 }),
    signs: T(W, { map: A.signs, transparent: true, depthWrite: false, name: 'pwest-signs', paint: 0, polygonOffset: -2 }),
    fence: T(W, { map: A.fence, alphaTest: 0.5, side: 'double', name: 'pwest-fence', paint: 0 }),
    corr: sheet('corr', A.corr, { paint: 0.03 }), zincRoof: sheet('zincRoof', A.zincRoof, { paint: 0.04 }),
    dark: flat('dark', '#432a25', { paint: 0.03 }),                 // dark brick / black iron: copings, ruin interiors, window frames, pipes
    conc: flat('conc', '#8d8f8b', { paint: 0.05 }),                 // roof deck / slabs / plinths of the ruins
    stone: flat('stone', '#cfc6b2', { paint: 0.04 }),               // limestone dressings, sills, cornices, mansion trim
    trim: flat('trim', '#c4a58c', { paint: 0.03 }),                 // the lighter tan of the mansion mouldings and pilasters
    cabinBlue: flat('cabinBlue', '#3c5f94', { paint: 0.03 }),       // blue site cabins
    leaf: flat('leaf', '#5f9446', { paint: 0.06 }),                 // birch crowns (the trunks use `stone`)
  });
  M.decals.add(M.signs); M.cutouts.add(M.fence);
  return M;
}
