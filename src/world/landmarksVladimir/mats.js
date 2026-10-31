// landmarksVladimir/mats.js - materials of the west Petrograd side sights.  Colours: docs/research/vladimir.md (cathedral: pale yellow #f0d490 + white order + SILVER-GREY domes #b2bcc7 and
// gilded crosses; judicial quarter: cream stone #e6dcc6, blue site fence #2a4fa6; Tuchkov Buyan: flaking ochre #d9b25e; Yubileyny: white fins + dark glazing; Petrovsky: yellow #e6c27a, blue seats).
// Alpha cut-outs are listed in M.cutouts (no outline pass), painted panes in M.decals.
import { makeArt } from './art.js';

export const C = {
  yellow: '#f0d490', yellowShade: '#dfbf78', white: '#f4f1e8', whiteShade: '#dad7cc', dome: '#b2bcc7', roof: '#b9c0c6', plinth: '#9a968e', gold: '#e0ac36', iron: '#23262a',
  stone: '#e6dcc6', stoneShade: '#cfc4ab', glassDark: '#2b3138', bronze: '#5a4a36', steel: '#7a858c', insulation: '#b9a37c', fenceBlue: '#2a4fa6',
  ochre: '#d9b25e', ochreTrim: '#e9e3d2', buyanRoof: '#8f979c', fin: '#e9e8e3', yubRoof: '#b3b6b8', stad: '#e6c27a', stadPillar: '#efe6cf', mast: '#dfe3e6',
};

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const N = (n) => 'lmV-' + n;
  const map = (name, tex, o = {}) => T('#ffffff', { map: tex, name: N(name), paint: 0.03, ...o });
  Object.assign(M, {
    // ---- cathedral
    yellow: T(C.yellow, { name: N('yellow'), paint: 0.04 }), yellowShade: T(C.yellowShade, { name: N('yellowS'), paint: 0.04 }),
    white: T(C.white, { name: N('white'), paint: 0.03 }), whiteShade: T(C.whiteShade, { name: N('whiteS'), paint: 0.03 }),
    plinth: T(C.plinth, { name: N('plinth'), paint: 0.04 }), underside: T('#59606a', { name: N('underside') }),
    dome: T(C.dome, { name: N('dome'), paint: 0.03 }), roof: T(C.roof, { map: A.seams, name: N('roof'), paint: 0.03, side: 'double' }),
    gold: T(C.gold, { emissive: '#6a4a08', emissiveIntensity: 0.4, name: N('gold') }), iron: T(C.iron, { name: N('iron') }), bell: T('#4a4433', { name: N('bell'), paint: 0.02 }),
    winTall: map('winTall', A.winTall, { polygonOffset: -1 }), winSq: map('winSq', A.winSq, { polygonOffset: -1 }), winArch: map('winArch', A.winArch, { polygonOffset: -1 }),
    winOval: map('winOval', A.winOval, { polygonOffset: -1 }), dark: map('dark', A.dark, { polygonOffset: -1 }), door: map('door', A.door, { polygonOffset: -1 }),
    doorSide: map('doorSide', A.doorSide, { polygonOffset: -1 }), clock: map('clock', A.clock, { polygonOffset: -2, alphaTest: 0.5 }),
    angels: map('angels', A.angels, { polygonOffset: -2, alphaTest: 0.5, emissive: '#5a3c06', emissiveIntensity: 0.35 }),
    balus: map('balus', A.balus, { alphaTest: 0.5, side: 'double' }), fence: map('fence', A.fence, { alphaTest: 0.5, side: 'double' }),
    granite: T('#a39e96', { name: N('granite'), paint: 0.04 }), paving: T('#a9a6a0', { name: N('paving'), paint: 0.05, polygonOffset: -2 }),
    // ---- Tuchkov Buyan
    buyanBay: map('buyanBay', A.buyanBay), buyanPlain: map('buyanPlain', A.buyanPlain), ochreTrim: T(C.ochreTrim, { name: N('ochreTrim'), paint: 0.05 }),
    ochre: T(C.ochre, { name: N('ochre'), paint: 0.06 }), buyanRoof: T(C.buyanRoof, { map: A.seams, name: N('buyanRoof'), paint: 0.04, side: 'double' }), archDark: T('#2a2d33', { name: N('archDark') }),
    // ---- judicial quarter
    jqStone: map('jqStone', A.jqStone), jqRust: map('jqRust', A.jqRust), jqStrip: map('jqStrip', A.jqStrip), jqIns: map('jqIns', A.jqIns),
    stone: T(C.stone, { name: N('stone'), paint: 0.03 }), stoneShade: T(C.stoneShade, { name: N('stoneS'), paint: 0.03 }), glassDark: T(C.glassDark, { name: N('glassDark'), paint: 0.01 }),
    jqRoof: T('#8e949a', { name: N('jqRoof'), paint: 0.04 }), jqDome: T('#9fb2c0', { name: N('jqDome'), paint: 0.02 }), slab: T('#a9a8a2', { name: N('slab'), paint: 0.04 }),
    scaffold: map('scaffold', A.scaffold, { alphaTest: 0.5, side: 'double' }), net: map('net', A.net, { alphaTest: 0.5, side: 'double' }),
    fenceBlue: map('fenceBlue', A.fenceBlue, { side: 'double' }), fenceGrey: map('fenceGrey', A.fenceGrey, { side: 'double' }), timber: T('#b08d57', { name: N('timber'), paint: 0.05 }),
    cabin: map('cabin', A.cabin), cabinBlue: map('cabinBlue', A.cabinBlue), cabinRoof: T('#9aa0a4', { name: N('cabinRoof') }),
    lattice: map('lattice', A.lattice, { alphaTest: 0.5, side: 'double' }), latticeRed: map('latticeRed', A.latticeRed, { alphaTest: 0.5, side: 'double' }),
    craneWhite: T('#e9ebe8', { name: N('craneW') }), craneGrey: T('#6f767c', { name: N('craneG') }), craneRed: T('#c8402e', { name: N('craneR') }),
    gravel: map('gravel', A.gravel, { polygonOffset: -2, paint: 0.05 }), pallets: map('pallets', A.pallets), silo: T('#d9dbd8', { name: N('silo'), paint: 0.04 }),
    steel: T(C.steel, { name: N('steel') }), rust: T('#8a5a3c', { name: N('rust'), paint: 0.06 }), duct: T('#b9c0c4', { name: N('duct'), paint: 0.03 }), craneGreen: T('#5fae4a', { name: N('craneGr') }),
    // ---- Yubileyny
    fin: T(C.fin, { name: N('fin'), paint: 0.03 }), yubGlass: map('yubGlass', A.yubGlass), yubDoors: map('yubDoors', A.yubDoors), yubRoof: T(C.yubRoof, { name: N('yubRoof'), paint: 0.04 }),
    annex: map('annex', A.annex), yubName: map('yubName', A.yubName, { alphaTest: 0.5, polygonOffset: -2 }), concrete: map('concrete', A.concrete, { paint: 0.04 }),
    // ---- Petrovsky stadium
    stadWall: map('stadWall', A.stadWall), stad: T(C.stad, { name: N('stad'), paint: 0.04 }), stadPillar: T(C.stadPillar, { name: N('stadPillar'), paint: 0.03 }),
    seats: map('seats', A.seats), pitch: map('pitch', A.pitch, { polygonOffset: -2 }), track: map('track', A.track, { polygonOffset: -2 }),
    mast: map('mast', A.lattice, { alphaTest: 0.5, side: 'double' }), mastSolid: T(C.mast, { name: N('mastS') }), lamps: map('lamps', A.lamps, { side: 'double' }),
    screen: T('#1a1d22', { name: N('screen') }),
  });
  M.cutouts = new Set([M.balus, M.fence, M.scaffold, M.net, M.lattice, M.latticeRed, M.mast, M.clock, M.angels, M.yubName]);
  M.decals = new Set([M.winTall, M.winSq, M.winArch, M.winOval, M.dark, M.door, M.doorSide]);
  M.flows = new Set();
  return M;
}
