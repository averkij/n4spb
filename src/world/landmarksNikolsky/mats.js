// landmarksNikolsky/mats.js - materials of the St Nicholas Naval Cathedral group.  Colours: docs/research/nikolsky.md section 10 (sky blue walls #79c1e0 with white order #efeee8, gold leaf domes,
// patinated copper roofs #5f9a78, black iron #26282c, oak door #b9873f, gravel #a3786b, red granite obelisk #8a4a3a).  Alpha cut-outs (railings, fence panels) are listed in M.cutouts (no outline pass).
import { makeArt } from './art.js';

export const C = {
  blue: '#7ec5e3', blueShade: '#68aacb', blueDeep: '#5a9bc0', white: '#efeee8', whiteShade: '#d6d5cd', copper: '#5f9a78', copperDark: '#4a7f62', graniteBase: '#5a5048',
  iron: '#26282c', gold: '#e8b43a', goldFlat: '#dca62c', bronze: '#4a3c2e', bell: '#3d3a2c', redGranite: '#8a4a3a', blackGranite: '#2a2c30', gravel: '#b58f7f', lawn: '#6f9f45',
  lampBlack: '#1f2124', bench: '#efece4', pipe: '#8cc6d8',
};

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const gold = (name, map) => T('#ffffff', { map, emissive: '#6a4a08', emissiveIntensity: 0.4, name: 'lmN-' + name });
  Object.assign(M, {
    blue: T(C.blue, { name: 'lmN-blue', paint: 0.04 }), blueShade: T(C.blueShade, { name: 'lmN-blueS', paint: 0.04 }), blueDeep: T(C.blueDeep, { name: 'lmN-blueD', paint: 0.04 }),
    white: T(C.white, { name: 'lmN-white', paint: 0.03 }), whiteShade: T(C.whiteShade, { name: 'lmN-whiteS', paint: 0.03 }),
    graniteBase: T(C.graniteBase, { name: 'lmN-gbase', paint: 0.03 }),
    copper: T(C.copper, { name: 'lmN-copper', paint: 0.04, side: 'double' }), copperDark: T(C.copperDark, { name: 'lmN-copperD', paint: 0.04 }),
    underside: T('#3a4048', { name: 'lmN-underside' }),
    gold: gold('gold', A.gold), goldFlat: T(C.goldFlat, { emissive: '#6a4a08', emissiveIntensity: 0.4, name: 'lmN-goldF' }),
    iron: T(C.iron, { name: 'lmN-iron' }), bronze: T(C.bronze, { name: 'lmN-bronze', paint: 0.02 }), bell: T(C.bell, { name: 'lmN-bell', paint: 0.02 }),
    win36: T('#ffffff', { map: A.win36, name: 'lmN-win36', polygonOffset: -1 }), win24: T('#ffffff', { map: A.win24, name: 'lmN-win24', polygonOffset: -1 }),
    win35: T('#ffffff', { map: A.win35, name: 'lmN-win35', polygonOffset: -1 }), win12: T('#ffffff', { map: A.win12, name: 'lmN-win12', polygonOffset: -1 }),
    winBarred: T('#ffffff', { map: A.winBarred, name: 'lmN-winBarred', polygonOffset: -1 }), dark: T('#ffffff', { map: A.dark, name: 'lmN-dark', polygonOffset: -1 }),
    door: T('#ffffff', { map: A.door, name: 'lmN-door', polygonOffset: -1 }),
    clock: T('#ffffff', { map: A.clock, name: 'lmN-clock', polygonOffset: -2 }),
    rail: T('#ffffff', { map: A.rail, alphaTest: 0.5, side: 'double', name: 'lmN-rail' }),
    bars: T('#ffffff', { map: A.bars, alphaTest: 0.5, side: 'double', name: 'lmN-bars' }),
    lattice: T('#ffffff', { map: A.lattice, alphaTest: 0.5, side: 'double', name: 'lmN-lattice' }),
    lampGlass: T('#f3efe2', { emissive: '#ffe9b0', emissiveIntensity: 0.3, name: 'lmN-lampGlass' }), lampBlack: T(C.lampBlack, { name: 'lmN-lampBlack' }),
    gravel: T(C.gravel, { map: A.gravel, name: 'lmN-gravel', paint: 0.05, polygonOffset: -2 }), asphalt: T('#6b6e72', { map: A.asphalt, name: 'lmN-asphalt', paint: 0.04, polygonOffset: -2 }),
    sett: T('#8f8b84', { map: A.sett, name: 'lmN-sett', paint: 0.04, polygonOffset: -3 }), granite: T('#a39e96', { map: A.granite, name: 'lmN-granite', paint: 0.03 }),
    lawn: T(C.lawn, { map: A.grass, name: 'lmN-lawn', paint: 0.06, polygonOffset: -1 }),
    redGranite: T(C.redGranite, { name: 'lmN-redG', paint: 0.03 }), blackGranite: T(C.blackGranite, { name: 'lmN-blackG', paint: 0.02 }), greyGranite: T('#8d8e90', { name: 'lmN-greyG', paint: 0.03 }),
    benchWood: T(C.bench, { name: 'lmN-benchW', paint: 0.03 }), benchIron: T('#202428', { name: 'lmN-benchI' }),
    pipe: T(C.pipe, { name: 'lmN-pipe' }), door2: T('#b9873f', { name: 'lmN-door2', paint: 0.03 }),
    water: T('#5f8fb0', { name: 'lmN-water', transparent: true, opacity: 0.82, depthWrite: false, polygonOffset: -3 }),
    frog: T('#6e6a44', { name: 'lmN-frog', paint: 0.02 }), hedge: T('#2c5a32', { name: 'lmN-hedge', paint: 0.1 }),
  });
  M.cutouts = new Set([M.rail, M.bars, M.lattice]);
  M.decals = new Set([M.win36, M.win24, M.win35, M.win12, M.winBarred, M.dark, M.door, M.clock]);
  M.flows = new Set([M.water]);
  return M;
}
