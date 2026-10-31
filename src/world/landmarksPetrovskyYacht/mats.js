// landmarksPetrovskyYacht/mats.js - the materials of the module (ctx.mat.toon only; every name starts with 'pyac-').  About 20 materials for the whole module, shared by all sights.
// Colours (dossier docs/research/petrovsky-zhdanovka-2026.md section 10 and the photos of its PHOTO TABLE):
//   yacht club main building: white weathered concrete #e8e8e2, blue band / posts / railing #1f4ea0, grey corrugated triangles #b0b4b4 over dark glass, rusty bars #6a4a3c, stone-veneer podium #8e908a;
//   Standart shed: dark green corrugated #17503e [y12]; black cast cannon, rusty anchor #8a5a3a, grey-brown timber; Rops site: charred timber, red brick, green wire fence #3f6a4a [y18 y19];
//   Savina Home: chrome-yellow stucco #e6b84a, white order #f2eee4, zinc roof #9aa6ad, black cast iron [v01 v03 v04].
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset, no outline).
import { makeArt, makeAtlases, RNG } from './art.js';
import { makeArt2 } from './art2.js';

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeAtlases(ctx, makeArt2(ctx, makeArt(ctx))), W = '#ffffff', M = { A, decals: new Set(), cutouts: new Set() };
  const flat = (name, col, o = {}) => T(col, { name: 'pyac-' + name, paint: 0.03, ...o });
  const sheet = (name, map, o = {}) => T(W, { map, name: 'pyac-' + name, paint: 0.03, ...o });
  // real materials: a few textured sheets, the alpha atlas of railings, the signs atlas, a handful of flat colours
  Object.assign(M, {
    conc: sheet('conc', A.conc, { paint: 0.04 }), soffit: sheet('soffit', A.soffit, { paint: 0.03 }), hallTiles: sheet('hallTiles', A.hallTiles, { paint: 0.01 }),
    rubble: sheet('rubble', A.rubble, { paint: 0.05 }), granite: sheet('granite', A.granite, { paint: 0.05 }),
    blue: flat('blue', '#1f4ea0', { paint: 0.02 }), rust: flat('rust', '#7a4a38', { paint: 0.03 }), metal: flat('metal', '#a4a9ab', { paint: 0.02 }),
    black: flat('black', '#222527', { paint: 0.01 }), white: flat('white', '#eeeee9', { paint: 0.02 }),
    rails: T(W, { map: A.rails, alphaTest: 0.5, side: 'double', name: 'pyac-rails', paint: 0 }), signs: sheet('signs', A.signs, { paint: 0, polygonOffset: -2 }),
    corrGreen: sheet('corrGreen', A.corrGreen, { paint: 0.03 }), timber: sheet('timber', A.timber, { paint: 0.05 }),
    brickSoot: sheet('brickSoot', A.brickSoot, { paint: 0.04 }), ash: sheet('ash', A.ash, { paint: 0.05, polygonOffset: -1 }), charred: sheet('charred', A.charred, { paint: 0.03 }),
    savWall: sheet('savWall', A.savWall, { paint: 0.03 }), zinc: sheet('zinc', A.zinc, { paint: 0.04 }), yellow: flat('yellow', '#e9c04c', { paint: 0.03 }),
    ashlar: sheet('ashlar', A.ashlar, { paint: 0.04 }), ochre: flat('ochre', '#dcc78c', { paint: 0.03 }),
    tin: flat('tin', '#6b6f73', { paint: 0.04 }),                       // the dark weathered sheet roofs of the kosa 3/6 office and hut (photos k3_1, y22 y23)
  });
  // virtual materials (rows of the atlases, see kit.js): the parts keep their own names
  const row = (real, name, rep) => ({ __atlas: { real, rep, ...A.uv[name] }, name: 'pyac-' + name });
  for (const n of ['wallSolid', 'glassGround', 'glassLattice', 'glassFirst', 'triBand']) M[n] = row(M.hallTiles, n, true);
  for (const n of ['railBlue', 'railWhite', 'railBal', 'wireGreen', 'railRing']) M[n] = row(M.rails, n, true);
  M.compass = row(M.rails, 'compass', false);
  for (const n of ['nameStandart', 'infoRops', 'savFrieze', 'plaque']) M[n] = row(M.signs, n, false);
  M.tar = M.metal; M.door = M.rust;
  M.decals.add(M.signs); M.cutouts.add(M.rails);
  void RNG;
  return M;
}
