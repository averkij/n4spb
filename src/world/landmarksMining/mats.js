// landmarksMining/mats.js - materials of the module (ctx.mat.toon / emissive only; every name starts with 'lmMin-').  Colours: docs/research/mining.md section 10.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset, no outline), M.glassy = lit glass sheets.
import { makeArt, C } from './art.js';
import { figureMats } from '../lib/figures.js';

export { C };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmMin-' + name, paint: 0.02, ...o });
  const flat = (name, col, o = {}) => T(col, { name: 'lmMin-' + name, paint: 0.03, ...o });
  const FM = figureMats(ctx);
  Object.assign(M, {
    // ---- walls (bay textures carry colour)
    wing: sheet('wing', A.wing), link: sheet('link', A.link), east: sheet('east', A.east), west: sheet('west', A.west), yard: sheet('yard', A.yard), rear: sheet('rear', A.rear),
    galleryWin: sheet('galleryWin', A.galleryWin, { paint: 0.015 }), galleryDoor: sheet('galleryDoor', A.galleryDoor, { paint: 0.015 }), galleryEnd: sheet('galleryEnd', A.galleryEnd, { paint: 0.015 }),
    door: sheet('door', A.door, { paint: 0.01 }), friezeW: sheet('friezeW', A.friezeW, { paint: 0.02, polygonOffset: -2 }), friezeE: sheet('friezeE', A.friezeE, { paint: 0.02, polygonOffset: -2 }),
    plaster: flat('plaster', C.wall, { paint: 0.04 }), plasterEast: flat('plasterEast', C.wallEast, { paint: 0.04 }), plasterWest: flat('plasterWest', C.wallWest, { paint: 0.04 }), plasterRear: flat('plasterRear', C.wallRear, { paint: 0.04 }),
    backWall: flat('backWall', C.back, { paint: 0.03 }), ceil: flat('ceil', C.ceil, { paint: 0.02 }), plasterShade: flat('plasterShade', C.wallShade, { paint: 0.04 }),
    white: flat('white', C.white, { paint: 0.04 }), whiteShade: flat('whiteShade', C.whiteShade, { paint: 0.04 }), plinth: flat('plinth', C.plinth, { paint: 0.04 }), flutes: sheet('flutes', A.flutes, { paint: 0.03 }), flute1: T('#efece2', { map: A.flute1, name: 'lmMin-flute1', paint: 0.03 }),
    frame: flat('frame', C.frame, { paint: 0.01 }), iron: flat('iron', C.iron, { paint: 0.01 }), bronze: flat('bronze', C.bronze, { paint: 0.02 }), eagle: flat('eagle', C.eagle, { paint: 0.02 }), gold: flat('gold', C.gold, { paint: 0.02, emissive: '#5a3f08', emissiveIntensity: 0.35 }),
    chimney: flat('chimney', C.chimney, { paint: 0.04 }), chimneyCap: flat('chimneyCap', '#7b7a76', { paint: 0.04 }),
    // ---- roofs
    roof: T('#6a9a7a', { map: A.roof, name: 'lmMin-roof', paint: 0.04 }), roofRidge: flat('roofRidge', C.roofRidge, { paint: 0.03 }), rearRoof: T('#8a8884', { map: A.rearRoof, name: 'lmMin-rearRoof', paint: 0.04 }),
    // ---- stone of the stair, cheeks, descents, forecourt
    tread: T('#b4ad9f', { map: A.stairGrey, name: 'lmMin-tread', paint: 0.05 }), riser: T('#8a8478', { map: A.stairGrey, name: 'lmMin-riser', paint: 0.05 }),
    cheek: T('#b4b8ab', { map: A.ashlar, name: 'lmMin-cheek', paint: 0.05 }), coping: flat('coping', C.coping, { paint: 0.05 }),
    granite: T('#b08e82', { map: A.granite, name: 'lmMin-granite', paint: 0.05 }), graniteStep: T('#a08074', { map: A.granite, name: 'lmMin-graniteStep', paint: 0.05 }), graniteShade: flat('graniteShade', C.pinkShade, { paint: 0.05 }), graniteWet: flat('graniteWet', C.pinkWet, { paint: 0.05 }),
    slabs: T('#b8aba2', { map: A.slabs, name: 'lmMin-slabs', paint: 0.04 }), stylobate: T('#b8aba2', { map: A.slabs, name: 'lmMin-stylobate', paint: 0.04 }),
    paver: T('#b88a78', { map: A.paver, name: 'lmMin-paver', paint: 0.04, polygonOffset: -4 }), kerb: flat('kerb', C.kerb, { paint: 0.05 }),
    lawn: T('#79b052', { map: A.lawn, name: 'lmMin-lawn', paint: 0.03 }),
    // ---- furniture
    lampPost: flat('lampPost', C.teal, { paint: 0.02 }), lampShade: flat('lampShade', C.tealShade, { paint: 0.02 }), lampCap: flat('lampCap', C.tealCap, { paint: 0.02 }),
    lampGlass: T('#f3e7b8', { name: 'lmMin-lampGlass', paint: 0, emissive: '#e8d9a0', emissiveIntensity: 0.3 }), lanternGlass: T(C.lantern, { name: 'lmMin-lanternGlass', paint: 0, emissive: '#e6d9a8', emissiveIntensity: 0.35 }),
    bollard: flat('bollard', C.iron, { paint: 0.01 }), chain: flat('chain', '#2a2b2e', { paint: 0.01 }),
    wood: flat('wood', '#8a6a44', { paint: 0.03 }), benchIron: flat('benchIron', '#1d1f20', { paint: 0.01 }),
    // ---- sculpture and bronze (the figure kit's keys: main / dark / accent)
    trav: T('#d9cbb0', { map: FM.marble.map, name: 'lmMin-trav', paint: 0.04 }), travPlinth: T('#d6cbb4', { map: A.ashlar, name: 'lmMin-travPlinth', paint: 0.05 }),
    granitePed: flat('granitePed', '#6c6d6c', { paint: 0.05 }),
    // ---- the ship
    hull: T('#454a56', { map: A.hull, name: 'lmMin-hull', paint: 0.04 }), boot: flat('boot', C.boot, { paint: 0.05 }), waterline: flat('waterline', C.waterline, { paint: 0.02 }),
    cream: T('#e0d4b0', { map: A.cream, name: 'lmMin-cream', paint: 0.03 }), creamPlain: flat('creamPlain', C.cream, { paint: 0.03 }), funnel: T('#e6dcc0', { map: A.cream, name: 'lmMin-funnel', paint: 0.03 }),
    band: flat('band', C.band, { paint: 0.03 }), cap: flat('cap', C.cap, { paint: 0.03 }), boat: flat('boat', C.boat, { paint: 0.04 }), cover: flat('cover', C.cover, { paint: 0.03 }),
    deckMat: T('#9a7c5c', { map: A.deck, name: 'lmMin-deck', paint: 0.04 }), deckFore: T('#8a7460', { map: A.deck, name: 'lmMin-deckFore', paint: 0.04 }), windlass: flat('windlass', C.windlass, { paint: 0.02 }),
    rope: flat('rope', C.rope, { paint: 0.03 }), rail: flat('rail', C.rail, { paint: 0.02 }), teal2: flat('teal2', C.teal2, { paint: 0.03 }), glassDark: flat('glassDark', C.glassDark, { paint: 0 }),
    bhWin: T('#e0d4b0', { map: A.bhWin, name: 'lmMin-bhWin', paint: 0.02 }), bhPort: T('#e0d4b0', { map: A.bhPort, name: 'lmMin-bhPort', paint: 0.02 }),
    anchor: flat('anchor', '#1c1d20', { paint: 0.02 }), rust: flat('rust', '#8a4a2a', { paint: 0.03 }), fender: flat('fender', '#3a3c40', { paint: 0.02 }), steel: flat('steel', '#7c8084', { paint: 0.02 }), searchlight: flat('searchlight', '#9a9a96', { paint: 0.03 }),
    lettersWhite: T(W, { map: A.letters('lettersHull', 'КРАСИН', '#f2f2ee'), name: 'lmMin-lettersHull', paint: 0, alphaTest: 0.5, polygonOffset: -2 }),
    lettersGang: T(W, { map: A.letters('lettersGang', 'ЛЕДОКОЛ «КРАСИН»', '#1b1b1b', { w: 1024, h: 80 }), name: 'lmMin-lettersGang', paint: 0, alphaTest: 0.5, polygonOffset: -2 }),
    gangway: flat('gangway', '#d8d8d4', { paint: 0.03 }),
  });
  M.cutouts = new Set([M.lettersWhite, M.lettersGang]);
  M.decals = new Set([M.paver, M.friezeW, M.friezeE, M.lettersWhite, M.lettersGang]);
  M.glassy = new Set();
  M.FM = FM;
  return M;
}
