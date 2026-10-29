// landmarksPribaltiyskaya/mats.js - materials of the module (ctx.mat.toon / glass only; every name starts with 'lmprib-').  Colours: docs/research/pribaltiyskaya.md sections 4.2 [C7], 4.4, 5, 6, 8, 9.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset), M.glassy = transparent sheets (no outline, no shadow).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmprib-' + name, paint: 0.02, ...o });
  const flat = (name, col, o = {}) => T(col, { name: 'lmprib-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    // ---- the hotel
    bay: sheet('bay', A.bay, { paint: 0.015 }), blind: sheet('blind', A.blind, { paint: 0.015 }), base: sheet('base', A.base, { paint: 0.01 }), crownPanel: sheet('crownPanel', A.crownPanel, { paint: 0.02 }),
    finsWall: sheet('finsWall', A.finsWall, { paint: 0 }), plinth: sheet('plinth', A.plinth, { paint: 0.03 }), terrace: sheet('terrace', A.terrace, { paint: 0.03 }), plaza: sheet('plaza', A.plaza, { paint: 0.04, polygonOffset: -3 }),
    letters: T(W, { map: A.letters, name: 'lmprib-letters', paint: 0, alphaTest: 0.5 }), plate: sheet('plate', A.plate, { paint: 0, polygonOffset: -2 }),
    dome: sheet('dome', A.dome, { paint: 0.02, side: 'double', emissive: '#5a4210', emissiveIntensity: 0.25 }),
    champagne: flat('champagne', '#c2baab', { paint: 0.02 }), attic: flat('attic', C.attic, { paint: 0.02 }), beam: flat('beam', C.beam, { paint: 0.02 }), roofMem: flat('roofMem', C.roof, { paint: 0.04 }),
    crownRoof: flat('crownRoof', '#4a4644', { paint: 0.04 }), concrete: flat('concrete', '#c4bfb5', { paint: 0.04 }), concreteDark: flat('concreteDark', '#8a8780', { paint: 0.04 }),
    glassDark: flat('glassDark', '#27323a', { paint: 0 }), glassBronze: flat('glassBronze', '#4a5560', { paint: 0 }), frame: flat('frame', '#2f3438', { paint: 0.01 }), steel: flat('steel', '#8a8f94', { paint: 0.02 }),
    white: flat('white', '#e8e8e4', { paint: 0.03 }), ball: flat('ball', '#f0efe6', { paint: 0, emissive: '#e8e6d6', emissiveIntensity: 0.25 }), asphalt: flat('asphalt', '#5b5d60', { paint: 0.05, polygonOffset: -3 }),
    graniteRed: flat('graniteRed', C.granite, { paint: 0.04 }), graniteCap: flat('graniteCap', '#9a7468', { paint: 0.04 }), graniteDark: flat('graniteDark', '#7a3f38', { paint: 0.03 }), graniteTop: flat('graniteTop', '#3f2a26', { paint: 0.03 }),
    graniteBase: flat('graniteBase', '#7c3f37', { paint: 0.05 }), kerb: flat('kerb', '#8a8a86', { paint: 0.05 }), turf: flat('turf', '#6f8f4a', { paint: 0.08, polygonOffset: -2 }), benchRed: flat('benchRed', '#8a3f2a', { paint: 0.03 }),
    slats: flat('slats', '#8a8178', { paint: 0.04 }), mastGrey: flat('mastGrey', '#aeb2b5', { paint: 0.02 }), dish: flat('dish', '#e6e8e8', { paint: 0.02, side: 'double' }), bronzeMask: flat('bronzeMask', '#3a3430', { paint: 0.03 }),
    patina: flat('patina', '#4d6a58', { paint: 0.04 }), maskField: flat('maskField', '#54483a', { paint: 0.04 }), maskFace: flat('maskFace', '#8b8461', { paint: 0.04 }), chain: flat('chain', '#25282a', { paint: 0.01 }), pavilion: flat('pavilion', '#d8d2c0', { paint: 0.03 }), pavGlass: flat('pavGlass', '#394a54', { paint: 0 }),
    // ---- Waterville
    wvGlass: sheet('wvGlass', A.wvGlass, { paint: 0.01 }), wvPink: sheet('wvPink', A.wvPink, { paint: 0.02 }), wvRoof: flat('wvRoof', '#6a6c6e', { paint: 0.04 }),
    // ---- the Kirov memorial
    kpave: sheet('kpave', A.kpave, { paint: 0.05 }), kwall: sheet('kwall', A.kwall, { paint: 0.03 }), kcap: flat('kcap', '#b9b4b0', { paint: 0.04 }), turret: flat('turret', '#848681', { paint: 0.03 }), turretDark: flat('turretDark', '#5e605d', { paint: 0.03 }),
    turretLit: flat('turretLit', '#969791', { paint: 0.03 }), ring: flat('ring', '#8a8c88', { paint: 0.05 }), disc: flat('disc', '#a89a86', { paint: 0.05 }), bronzeDark: flat('bronzeDark', '#3a2f2a', { paint: 0.03 }), bronzeLeaf: flat('bronzeLeaf', '#4a5a4c', { paint: 0.03 }),
    propBronze: flat('propBronze', '#5f5638', { paint: 0.03, side: 'double' }), propPlinth: flat('propPlinth', '#9b9a98', { paint: 0.05 }), anchor: flat('anchor', '#3b3f43', { paint: 0.02 }), shell: flat('shell', '#8f949a', { paint: 0.03 }),
    shellBand: flat('shellBand', '#4a4e52', { paint: 0.03 }), niche: flat('niche', '#b3aca9', { paint: 0.05 }), plaque: sheet('plaque', A.plaque, { paint: 0, polygonOffset: -2 }), plaqueFrame: flat('plaqueFrame', '#6b5a3a', { paint: 0.02 }),
    college: sheet('college', A.college, { paint: 0.015 }), collegeSide: sheet('collegeSide', A.collegeSide, { paint: 0.015 }), collegeRoof: flat('collegeRoof', '#5c5a58', { paint: 0.04 }), frieze: T(W, { map: A.frieze, name: 'lmprib-frieze', paint: 0, alphaTest: 0.5, polygonOffset: -2 }),
    // ---- Peter I, Nakhimov
    scroll: sheet('scroll', A.scroll, { paint: 0.02 }), nakh: T(W, { map: A.nakh, name: 'lmprib-nakh', paint: 0, alphaTest: 0.5, polygonOffset: -2 }), pad: flat('pad', '#a8584d', { paint: 0.05 }),
    cylGlass: sheet('cylGlass', A.cylGlass, { paint: 0.01 }), cylRoof: flat('cylRoof', '#9a9ea0', { paint: 0.04 }), fenceBlack: flat('fenceBlack', '#1f2124', { paint: 0.01 }),
    wave: flat('wave', '#34382f', { paint: 0.03 }), bronzeFig: flat('bronzeFig', '#574d42', { paint: 0.04 }), pavRoof: flat('pavRoof', '#8c8984', { paint: 0.04 }),
  });
  // ---- material consolidation (the scene is CPU-bound by draw calls: every material in view costs a call per batch cell): near-identical flat colours share ONE material.
  // Never aliased: textured sheets, decals, cut-outs, materials with their own polygonOffset / side / emissive rules.
  const same = (canon, ...names) => { for (const n of names) M[n] = M[canon]; };
  same('roofMem', 'crownRoof'); same('graniteDark', 'graniteBase', 'benchRed'); same('graniteRed', 'graniteCap'); same('concreteDark', 'kerb', 'slats', 'ring');
  same('steel', 'mastGrey'); same('kcap', 'niche'); same('turret', 'turretLit', 'shell'); same('turretDark', 'shellBand'); same('glassDark', 'pavGlass', 'glassBronze');
  same('frame', 'chain', 'fenceBlack'); same('bronzeMask', 'patina', 'bronzeDark');
  M.cutouts = new Set([M.letters, M.frieze, M.nakh]);
  M.decals = new Set([M.plate, M.plaza, M.asphalt, M.turf, M.plaque, M.frieze, M.nakh]);
  M.glassy = new Set();
  return M;
}
