// landmarksSeaTerminal/mats.js - materials of the module (ctx.mat.toon / glass only; every name starts with 'lmseate-').  Colours: docs/research/seaterminal.md sections 4.4, 6.2, 7, 8.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset), M.glassy = transparent sheets (no outline, no shadow).
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmseate-' + name, paint: 0.02, ...o });
  const flat = (name, col, o = {}) => T(col, { name: 'lmseate-' + name, paint: 0.03, ...o });
  Object.assign(M, {
    // ---- terminal skin
    alu: sheet('alu', A.alu, { paint: 0.02 }), aluSail: sheet('aluSail', A.alu, { paint: 0.02, side: 'double' }), aluLight: T('#eef0ee', { map: A.alu, name: 'lmseate-aluLight', paint: 0.02 }),
    aluUnder: flat('aluUnder', '#6a6e72', { paint: 0.02 }),
    bayWall: sheet('bayWall', A.bayWall, { paint: 0.01 }), hall: sheet('hall', A.hall, { paint: 0 }),
    podium: sheet('podium', A.podium, { paint: 0.04 }), concrete: sheet('concrete', A.concrete, { paint: 0.03 }), concreteLight: T('#d8d6cf', { map: A.concrete, name: 'lmseate-concreteLight', paint: 0.03 }),
    fascia: sheet('fascia', A.fascia, { paint: 0.02 }), soffit: T('#b4babf', { map: A.concrete, name: 'lmseate-soffit', paint: 0.03, emissive: '#80868c', emissiveIntensity: 0.4 }), roofMem: sheet('roofMem', A.roof, { paint: 0.04 }),
    asphalt: sheet('asphalt', A.asphalt, { paint: 0.05, polygonOffset: -3 }), quayDeck: sheet('quayDeck', A.quayDeck, { paint: 0.04 }),
    glassDark: flat('glassDark', '#27323a', { paint: 0 }), frame: flat('frame', C.frame, { paint: 0.01 }), black: flat('black', '#1d2220', { paint: 0.01 }), steel: flat('steel', '#7c8084', { paint: 0.02 }),
    cup: flat('cup', '#a5a8a8', { paint: 0.02, side: 'double' }), roofGrey: flat('roofGrey', '#9a9d9c', { paint: 0.03 }), stairWhite: flat('stairWhite', '#d8d6cf', { paint: 0.04 }),
    tube: flat('tube', '#e8eaea', { paint: 0.02 }), tubeRed: flat('tubeRed', '#c84a3c', { paint: 0.02 }),
    // ---- terminal top
    letters: T(W, { map: A.letters, name: 'lmseate-letters', paint: 0, alphaTest: 0.5 }),
    restoran: T(W, { map: A.restoran, name: 'lmseate-restoran', paint: 0, alphaTest: 0.5, polygonOffset: -2 }),
    dial: sheet('dial', A.dial, { paint: 0 }), iron: flat('iron', '#1e1f21', { paint: 0.01 }), gold: flat('gold', C.gold, { paint: 0.02, emissive: '#7a5a14', emissiveIntensity: 0.35 }),
    goldSide: flat('goldSide', '#c19a36', { paint: 0.02, side: 'double', emissive: '#6a4a10', emissiveIntensity: 0.3 }),
    needleLit: flat('needleLit', '#d8c88a', { paint: 0.02, emissive: '#5a4a20', emissiveIntensity: 0.25 }), needleShade: flat('needleShade', '#8f8466', { paint: 0.02 }),
    lantern: ctx.mat.glass({ tint: '#bcd2da', opacity: 0.45, streaks: false }), lanternFrame: flat('lanternFrame', '#f2f2f0', { paint: 0.01 }),
    // ---- D-2
    hullUp: T(C.hullUp, { map: A.plates, name: 'lmseate-hullUp', paint: 0.03 }), hullLow: T(C.hullLow, { map: A.plates, name: 'lmseate-hullLow', paint: 0.03 }),
    boot: flat('boot', C.boot, { paint: 0.02 }), deck: flat('deck', C.deck, { paint: 0.03 }), pole: flat('pole', '#3a4044', { paint: 0.02 }), peri: flat('peri', '#22282c', { paint: 0.01 }),
    gunGrey: flat('gunGrey', '#8a8f92', { paint: 0.03 }), slot: flat('slot', '#1c2224', { paint: 0 }), prop: flat('prop', '#25303a', { paint: 0.01, side: 'double' }), rudder: flat('rudder', '#4f6f58', { paint: 0.02, side: 'double' }),
    d2Letters: T(W, { map: A.d2, name: 'lmseate-d2', paint: 0, alphaTest: 0.5, polygonOffset: -2 }), star: T(W, { map: A.star, name: 'lmseate-star', paint: 0, alphaTest: 0.5, polygonOffset: -2 }),
    ashlar: sheet('ashlar', A.ashlar, { paint: 0.03 }), pavRoof: flat('pavRoof', C.roof, { paint: 0.04 }), pavFoot: flat('pavFoot', '#8a4a38', { paint: 0.03 }), cradle: flat('cradle', '#d8c3a8', { paint: 0.04 }), cradleOchre: flat('cradleOchre', C.cradle, { paint: 0.04 }),
    stern: flat('stern', '#2f4a3a', { paint: 0.03 }), vehicle: flat('vehicle', '#6f7a6e', { paint: 0.03 }), vehicleGrey: flat('vehicleGrey', '#7b8087', { paint: 0.03 }),
    boulder: flat('boulder', '#a29a8c', { paint: 0.05 }), polished: flat('polished', '#6d7276', { paint: 0.02, polygonOffset: -2 }), graniteDark: flat('graniteDark', '#8e8e8a', { paint: 0.05 }), gravel: sheet('gravel', A.gravel, { paint: 0.04 }),
    stonePlate: sheet('stonePlate', A.stonePlate, { paint: 0, polygonOffset: -2 }), museum: sheet('museum', A.museum, { paint: 0 }), yardFence: flat('yardFence', '#26292b', { paint: 0.02 }), hedge: flat('hedge', '#2f5a3a', { paint: 0.05 }),
    lampPole: flat('lampPole', '#8a8f92', { paint: 0.02 }), lampGlobe: flat('lampGlobe', '#f4f2e6', { paint: 0, emissive: '#e8e6d6', emissiveIntensity: 0.25 }), lawn: flat('lawn', '#6a9a46', { paint: 0.08, polygonOffset: -4 }),
    // ---- torpedo boat
    boat: T(C.boat, { map: A.boat, name: 'lmseate-boat', paint: 0.03 }), boatDeck: flat('boatDeck', C.boatDeck, { paint: 0.03 }), tubeGrey: flat('tubeGrey', '#b9bcc0', { paint: 0.02 }), boatDark: flat('boatDark', '#3a3f46', { paint: 0.02 }),
    radome: flat('radome', '#9ea3a8', { paint: 0.02 }), aaGrey: flat('aaGrey', '#5f6368', { paint: 0.02 }), strake: flat('strake', '#2e3238', { paint: 0.02 }),
    plinth: sheet('plinth', A.plinth, { paint: 0.03 }), plinthTop: flat('plinthTop', '#9a9da2', { paint: 0.04 }), plinthText: T(W, { map: A.plinthText, name: 'lmseate-plinthText', paint: 0, alphaTest: 0.5, polygonOffset: -2 }),
    plaque: sheet('plaque', A.plaque, { paint: 0, polygonOffset: -2 }), plaqueBack: flat('plaqueBack', '#26282a', { paint: 0.01 }),
    brick: sheet('brick', A.brick, { paint: 0.04, polygonOffset: -4 }), kerb: flat('kerb', '#8c8f94', { paint: 0.05 }), bollard: flat('bollard', '#26282a', { paint: 0.01 }), chain: flat('chain', '#2a2c2e', { paint: 0.01 }),
    wire: flat('wire', '#2a2f33', { paint: 0, side: 'double' }),                                  // thin rigging wires / rails: no outline pass (M.cutouts), so they do not break into dashes
    // ---- the blue-roofed port shed NW of the terminal (OSM w128448740, Esri tile): pale grey walls, a bright blue steel roof, grey roller doors
    shedWall: flat('shedWall', '#b3b9be', { paint: 0.03 }), shedRoof: flat('shedRoof', '#2d56b8', { paint: 0.03, side: 'double' }), shedDoor: flat('shedDoor', '#6f7c8a', { paint: 0.02 }),
    // ---- site / fences / quay furniture
    hoard: sheet('hoard', A.hoard, { paint: 0.03 }), hoardPost: flat('hoardPost', C.hoardPost, { paint: 0.03 }), stripes: sheet('stripes', A.stripes, { paint: 0.02 }),
    meshPanel: T(W, { map: A.mesh, name: 'lmseate-mesh', paint: 0, alphaTest: 0.5, side: 'double' }), meshPost: flat('meshPost', '#2f7a4a', { paint: 0.02 }), footBlock: flat('footBlock', '#d6d4cc', { paint: 0.04 }),
    jersey: flat('jersey', '#e4e2da', { paint: 0.05 }), booth: flat('booth', '#e6e6e0', { paint: 0.03 }), boothRoof: flat('boothRoof', '#6a6e72', { paint: 0.03 }), arm: flat('arm', '#d8d8d4', { paint: 0.02 }), armRed: flat('armRed', '#c0382e', { paint: 0.02 }),
    bollardQuay: flat('bollardQuay', '#1f2225', { paint: 0.02 }), stripeW: flat('stripeW', '#f0f0ec', { paint: 0, polygonOffset: -6 }), stripeB: flat('stripeB', '#1f2022', { paint: 0, polygonOffset: -6 }),
  });
  // ---- material consolidation (the scene is CPU-bound by draw calls: every material in view costs a call per batch cell): near-identical flat colours share ONE material (the differences were a few levels of grey).
  // Never aliased: materials with their own polygonOffset / alpha / outline rules (decals, cut-outs, wire, lantern glass, textured sheets).
  const same = (canon, ...names) => { for (const n of names) M[n] = M[canon]; };
  same('black', 'iron', 'yardFence', 'bollard', 'chain', 'bollardQuay', 'peri', 'slot', 'plaqueBack', 'strake');
  same('alu', 'aluLight');                                                    // textured sheets that differ only by a tint
  same('concrete', 'concreteLight');
  same('pole', 'boatDark');
  same('steel', 'roofGrey', 'lampPole', 'gunGrey', 'vehicleGrey', 'kerb', 'plinthTop');
  same('boothRoof', 'aluUnder', 'deck', 'aaGrey', 'hoardPost');
  same('cup', 'radome', 'tubeGrey');
  same('stairWhite', 'jersey', 'booth', 'tube', 'arm', 'footBlock', 'boot', 'frame', 'lanternFrame');
  M.cutouts = new Set([M.letters, M.restoran, M.d2Letters, M.star, M.plinthText, M.meshPanel, M.wire]);
  M.decals = new Set([M.restoran, M.d2Letters, M.star, M.plinthText, M.stonePlate, M.plaque, M.asphalt, M.brick, M.lawn, M.stripeW, M.stripeB]);
  M.glassy = new Set([M.lantern]);
  return M;
}
