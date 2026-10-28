// landmarksAndrew/mats.js - materials of the module (ctx.mat.toon / glass only; every name starts with 'lmAnd-').  Colours: docs/research/andrew.md sections 3.6, 4.4, 8.4 (cathedral rose / peach / white / silver,
// market butter yellow + red roof, Annunciation yellow + green domes, Pel brick + green copper).  Part 2 (market / pavilion / Pel / konka materials) is made by makeMats2 in mats2.js and merged here.
// M.cutouts = alpha cut-outs (fence panels: no outline pass), M.decals = sheets that lie a few cm in front of a surface (polygonOffset), M.glassy = transparent sheets (no outline, no shadow).
import { makeArt, COL } from './art.js';
import { makeMats2 } from './mats2.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const flat = (name, col, o = {}) => T(col, { name: 'lmAnd-' + name, paint: 0.03, ...o });
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmAnd-' + name, paint: 0.02, ...o });
  const decal = (name, map, o = {}) => T(W, { map, name: 'lmAnd-' + name, paint: 0, polygonOffset: -1, ...o });
  const cut = (name, map, o = {}) => T(W, { map, alphaTest: 0.5, side: 'double', name: 'lmAnd-' + name, paint: 0, ...o });
  Object.assign(M, {
    // ---- walls and orders
    rose: flat('rose', C.rose, { paint: 0.04 }), roseShade: flat('roseShade', C.roseShade, { paint: 0.04 }), peach: flat('peach', C.peach, { paint: 0.04 }),
    white: flat('white', C.white, { paint: 0.03 }), whiteShade: flat('whiteShade', C.whiteShade, { paint: 0.03 }), underside: flat('underside', C.underside, { paint: 0 }),
    plinth: T(C.plinth, { map: A.graniteGrain, name: 'lmAnd-plinth', paint: 0.04 }), rustic: T('#d9d2cc', { map: A.rustic, name: 'lmAnd-rustic', paint: 0.04 }),
    graniteDark: flat('graniteDark', '#6f5f5c', { paint: 0.04 }),
    // ---- roofs and domes
    sheet: T('#9ea3a6', { map: A.seams, name: 'lmAnd-sheet', paint: 0.04, side: 'double' }), silver: T('#b9bfc2', { map: A.sheetGlow, name: 'lmAnd-silver', paint: 0.03, side: 'double' }),
    silverDark: flat('silverDark', C.silverDark, { paint: 0.03 }), spire: T('#c2c7ca', { map: A.seams, name: 'lmAnd-spire', paint: 0.03, side: 'double' }),
    gold: T('#dcb14a', { map: A.sheetGlow, name: 'lmAnd-gold', paint: 0, emissive: '#5a3f08', emissiveIntensity: 0.35 }), goldFlat: flat('goldFlat', '#dcb14a', { paint: 0, emissive: '#5a3f08', emissiveIntensity: 0.35 }),
    iron: flat('iron', C.iron, { paint: 0.01 }), ironGrey: flat('ironGrey', '#4b4f52', { paint: 0.02 }),
    // ---- windows, doors, niches (decals)
    win36: decal('win36', A.win36), win24: decal('win24', A.win24), win12: decal('win12', A.win12), win23: decal('win23', A.win23), winGrille: decal('winGrille', A.winGrille), dark: decal('dark', A.dark), niche: decal('niche', A.niche, { transparent: true, depthWrite: false }),
    doorBrown: decal('doorBrown', A.doorBrown), doorVarnish: decal('doorVarnish', A.doorVarnish), doorGlassAl: decal('doorGlassAl', A.doorGlassAl),
    // ---- fences and rails (alpha cut-outs)
    fenceCath: cut('fenceCath', A.fenceCath), fenceAnn: cut('fenceAnn', A.fenceAnn), railBlv: cut('railBlv', A.railBlv), railX: cut('railX', A.railX), railKonka: cut('railKonka', A.railKonka), railScroll: cut('railScroll', A.railScroll),
    // ---- ground
    slabGrey: T('#b8b4ae', { map: A.slabGrey, name: 'lmAnd-slabGrey', paint: 0.03, polygonOffset: -2 }), herring: T('#e0d0ca', { map: A.herring, name: 'lmAnd-herring', paint: 0.04, polygonOffset: -3 }),
    alley: T('#d8c8c0', { map: A.alley, name: 'lmAnd-alley', paint: 0.04, polygonOffset: -4 }), sett: T('#bdbab4', { map: A.sett, name: 'lmAnd-sett', paint: 0.04, polygonOffset: -3 }),
    gravel: T('#b8947f', { map: A.gravel, name: 'lmAnd-gravel', paint: 0.05, polygonOffset: -2 }), gravelRed: T('#a3705e', { map: A.gravel, name: 'lmAnd-gravelRed', paint: 0.05, polygonOffset: -2 }),
    lawn: T('#6f9f45', { map: A.grass, name: 'lmAnd-lawn', paint: 0.06, polygonOffset: -1 }), kerb: flat('kerb', '#8d8a85', { paint: 0.05 }), kerbLight: flat('kerbLight', '#a8a5a0', { paint: 0.05 }),
    playground: T('#c8b290', { map: A.gravel, name: 'lmAnd-playground', paint: 0.05, polygonOffset: -2 }),
    water: T('#7fb0c8', { map: A.water, name: 'lmAnd-water', transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: -3, paint: 0.01 }),
    graniteBasin: T('#b6a39c', { map: A.graniteGrain, name: 'lmAnd-basin', paint: 0.04 }), bollardGranite: T('#8d8a85', { map: A.graniteGrain, name: 'lmAnd-bollard', paint: 0.04 }),
    // ---- furniture
    lampGreen: flat('lampGreen', C.lampGreen, { paint: 0.01 }), lampBlack: flat('lampBlack', '#1f2124', { paint: 0.01 }), globe: T('#f3efe2', { name: 'lmAnd-globe', paint: 0, emissive: '#ffe9b0', emissiveIntensity: 0.3 }),
    benchWood: flat('benchWood', '#b08a58', { paint: 0.03 }), benchIron: flat('benchIron', '#2f4a3f', { paint: 0.02 }), bin: flat('bin', '#25282b', { paint: 0.02 }),
    drain: T(W, { map: A.drain, name: 'lmAnd-drain', paint: 0.02, polygonOffset: -4 }), hedge: flat('hedge', '#2f5f36', { paint: 0.1 }), soil: flat('soil', '#5a4636', { paint: 0.05 }),
  });
  Object.assign(M, makeMats2(ctx, M, { flat, sheet, decal, cut }));
  M.cutouts = new Set([M.fenceCath, M.fenceAnn, M.railBlv, M.railX, M.railKonka, M.railScroll, ...(M.cutouts2 || [])]);
  M.decals = new Set([M.drain, M.win36, M.win24, M.win12, M.win23, M.winGrille, M.dark, M.niche, M.doorBrown, M.doorVarnish, M.doorGlassAl, M.slabGrey, M.herring, M.alley, M.sett, M.gravel, M.gravelRed, M.lawn, M.playground, ...(M.decals2 || [])]);
  M.glassy = new Set([M.water, ...(M.glassy2 || [])]);
  return M;
}
