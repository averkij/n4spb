// landmarksKirova/mats.js - materials of the module (every name starts with 'lmKir-').  Colours: docs/research/kirova.md sections 7, 10, 11, art.js COL.
// MATERIAL BUDGET (2026-10-10): the module has a handful of REAL materials and many HANDLES (kit.js / tiles.js): a handle is a colour (or a tile) of a base material that Parts writes into the vertex
// colours, exactly what core/batch2.js did with every plain material anyway.  Bases: flat (opaque toon, vertex colours), decal (the same with polygonOffset -4), lit (MeshBasic, vertex colours),
// tiles / tilesCut (tiles.js: every repeating painting), the atlas cut-outs (texts, door ornament, plaques), the door glass shader, a few textured specials.  M.col(hex) / M.decal(hex) / M.litCol(hex)
// make a handle of any new colour (no new material, no new kind).
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset), M.glassy = transparent sheets (no outline, no shadow), M.lit = lit pieces (no outline,
// no shadow).  These sets hold REAL materials (the bases): Parts.build() looks the merged mesh up in them.
import * as THREE from 'three';
import { makeArt, COL } from './art.js';
import { makeErArt } from './erart.js';
import { makeTiles } from './tiles.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), E = makeErArt(ctx), M = { A, C };
  const W = '#ffffff';
  // ---- bases and handles
  const flatB = T(W, { vertexColors: true, vpaint: true, paint: 0.04, name: 'lmKir-flat' }), decB = T(W, { vertexColors: true, vpaint: true, paint: 0.04, polygonOffset: -4, name: 'lmKir-decal' });
  const flatD = T(W, { vertexColors: true, vpaint: true, paint: 0.04, side: 'double', name: 'lmKir-flatD' });
  const litB = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, toneMapped: false, name: 'lmKir-lit' });
  const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
  const H = (base, name, hex, k = 1) => ({ isHandle: true, name: 'lmKir-' + name, transparent: false, tileBase: base, tileCol: lin(hex, k), hex });
  const flat = (name, col) => H(flatB, name, col), dec = (name, col) => H(decB, name, col), lit = (col, k = 1) => H(litB, 'lit' + col + k, col, k);
  const memo = new Map(), once = (key, fn) => { if (!memo.has(key)) memo.set(key, fn()); return memo.get(key); };
  M.col = (hex) => once('c' + hex, () => H(flatB, 'c' + hex, hex));
  M.colD = (hex) => once('x' + hex, () => H(flatD, 'x' + hex, hex));
  M.decal = (hex) => once('d' + hex, () => H(decB, 'd' + hex, hex));
  M.litCol = (hex, k = 1) => once('l' + hex + k, () => lit(hex, k));
  M.bases = { flat: flatB, decal: decB, lit: litB, flatD };
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmKir-' + name, paint: 0.02, ...o });

  // ---- ONE material kind for every repeating painting (tiles.js): the Palace walls, the Erarta tiles, the window glass paintings and the alpha-cut iron fence / gate leaf
  const Tl = makeTiles(ctx, {
    wall: A.wall, wallShade: A.wallShade, rough: A.rough, podiumRough: A.podiumRough, pavSide: A.pavSide, rear: A.rear, rearTall: A.rearTall, ribbon: A.ribbon, arm: A.arm, cinema: A.cinema, strip: A.strip,
    drum: A.drum, portalWin: A.portalWin, portalStone: A.portalStone, door: A.door, roof: A.roof,
    eRust: E.eRust, eAshlar: E.eAshlar, eGranite: E.eGranite, ePanel: E.ePanel, eGlA: E.eGlA, eGlB: { tex: E.eGlB, emis: 0.45 }, eGlC: E.eGlC, eGlD: E.eGlD,
  }, { fence: A.fence, gate: A.gate }, {}, { dkPave: A.dkSlab, ePave: E.ePave });
  Object.assign(M, Tl.h, { tiles: Tl });

  Object.assign(M, {
    // ---- DK flats
    doorRed: flat('doorRed', '#6b2f26'), pilaster: flat('pilaster', C.pilaster), band: flat('band', C.band), nicheBack: flat('nicheBack', C.nicheBack), cornice: flat('cornice', '#cfae9b'),
    coping: flat('coping', C.coping), flash: flat('flash', C.flash), concrete: flat('concrete', C.concrete), concreteDark: flat('concreteDark', '#a49c92'),
    pale: flat('pale', C.pier), white: flat('white', C.white), whiteCanopy: flat('whiteCanopy', C.whiteCanopy), whiteDoor: flat('whiteDoor', '#8a5a32'),
    frame: flat('frame', C.frame), glassDark: flat('glassDark', '#27323a'), doorWin: flat('doorWin', C.doorWin), chimney: flat('chimney', '#c9a98a'),
    clockFace: flat('clockFace', '#f4f1ea'), clockCase: flat('clockCase', '#2a2623'), pipe: flat('pipe', '#a9a49b'), iron: flat('iron', C.iron),
    rearWall: flat('rearWall', C.rear), armWall: flat('armWall', C.rear), glassBlock: flat('glassBlock', '#b4cdca'), balcony: flat('balcony', '#a49c92'),
    // ---- Erarta (docs/research/kirova.md 11, docs/research/erarta-detail.md)
    eWhite: flat('eWhite', '#f1efe9'), eFrieze: flat('eFrieze', '#e8d3a0'), eYellow: flat('eYellow', '#e6d09e'), eReveal: flat('eReveal', '#efe6d0'),
    eFrame: flat('eFrame', '#3a3028'), eGraniteDark: flat('eGraniteDark', '#7e4c48'), eTerrace: flat('eTerrace', '#bdb5a8'),
    eStair: flat('eStair', '#c19488'), eNosing: flat('eNosing', '#d6b5aa'), eLampBlack: flat('eLampBlack', '#1b1d1f'),
    eDoorFrame: flat('eDoorFrame', '#16181a'), eSteelDoor: flat('eSteelDoor', '#9aa0a2'), eDoorGlass: ctx.mat.glass({ tint: '#7f9a98', opacity: 0.22, streaks: false }),
    eDoorOrn: T(W, { map: E.eDoorOrn, name: 'lmKir-eDoorOrn', paint: 0, alphaTest: 0.5, polygonOffset: -2 }), eDoorOrnC: T(W, { map: E.eDoorOrnC, name: 'lmKir-eDoorOrnC', paint: 0, alphaTest: 0.5, polygonOffset: -2 }),
    eSign: T(W, { map: E.eSignTex, name: 'lmKir-eSign', paint: 0, alphaTest: 0.5, polygonOffset: -2 }), eFriezeText: T(W, { map: E.eFriezeTex, name: 'lmKir-eFriezeText', paint: 0, alphaTest: 0.5, polygonOffset: -2 }),
    eLetterFrame: flat('eLetterFrame', '#6a6d70'),
    bowl: flat('bowl', '#eae7de'), thuja: flat('thuja', '#2f5a35'), shrubGreen: flat('shrubGreen', '#4d7f3a'), eCap: flat('eCap', '#f0e9d8'),
    eKerb: flat('eKerb', '#bdbab2'), eBollard: flat('eBollard', '#b0aca4'),
    eRoofTrim: flat('eRoofTrim', '#b9b2a6'), eBrick: flat('eBrick', '#a8573e'), eDrain: flat('eDrain', '#e8dfc4'),
    eRoofSheet: flat('eRoofSheet', '#b6453d'), eSteel: flat('eSteel', '#3a2e28'), eSteelHi: flat('eSteelHi', '#5a4636'), eSteelD: H(flatD, 'eSteelD', '#3a2e28'),
    // ---- garden
    cream: flat('cream', C.cream), gateRoof: flat('gateRoof', C.gateRoof), toilet: flat('toilet', '#e0c070'), toiletRoof: flat('toiletRoof', '#7d8186'),
    benchWood: flat('benchWood', '#7a5a3c'), benchStone: flat('benchStone', '#8d8d8a'), lampBlack: flat('lampBlack', '#1a1c1e'),
    swing: flat('swing', '#3b6ea5'), slide: flat('slide', '#c8503c'), fenceLow: flat('fenceLow', '#2a3a2a'), stump: flat('stump', '#9c9488'), shrubTwig: flat('shrubTwig', '#5a4a3a'),
    hedge: flat('hedge', C.hedge), sobGranite: flat('sobGranite', C.sobGranite), roeGranite: flat('roeGranite', C.roeGranite), roeFig: flat('roeFig', C.roeFig), platform: flat('platform', C.roePlat),
    // ---- monuments
    sobFront: T(W, { map: A.sobFront, name: 'lmKir-sobFront', paint: 0, alphaTest: 0.5, polygonOffset: -2 }), sobUpper: T(W, { map: A.sobUpper, name: 'lmKir-sobUpper', paint: 0, alphaTest: 0.5, polygonOffset: -2 }),
    sobPlate: flat('sobPlate', '#2a2220'), sobBronze: flat('sobBronze', '#2d2f2b'), roeDark: flat('roeDark', C.roeDark), roePeak: flat('roePeak', '#5a3a34'),
    roeSign: T(W, { map: A.roeSign, name: 'lmKir-roeSign', paint: 0, alphaTest: 0.5, polygonOffset: -2 }), roePlaque: sheet('roePlaque', A.roePlaque, { paint: 0, polygonOffset: -2, alphaTest: 0.5 }),
    // ---- decals (polygonOffset): one kind
    plaza: dec('plaza', C.plaza), gateAsphalt: dec('gateAsphalt', C.gateAsphalt), dirt: dec('dirt', '#8a5a48'), rubble: dec('rubble', '#cfc6b8'),
    rubber: dec('rubber', C.rubberCol || '#9a5a4a'), court: dec('court', '#8f9a8c'), lawnTop: dec('lawnTop', C.lawn), flower: dec('flower', '#c9455f'), flowerGreen: dec('flowerGreen', '#3f6b3a'), sobPaver: dec('paverRed', C.sobPaver),
    sobStripe: dec('sobStripe', C.sobStripe), courtLine: dec('courtLine', '#f2f0ea'), gateNiche: dec('gateNiche', '#968a78'),
    // ---- lit pieces (MeshBasic): lamps, light bars, the roof letters, the foyer
    eLampWhite: lit('#f2f0e6', 1.0), eLightBar: lit('#fffbe8', 1.0), eSoffit: lit('#dfe6ea', 0.95), eLetters: lit('#d83c3a', 0.95), lampOpal: lit('#f0efe6', 0.95),
    eLobbyWall: lit('#efd8a8', 0.92), eLobbyFloor: lit('#564e48', 0.9), eLobbyGlow: lit('#fff4dc', 1.0), eLobbyCeil: lit('#fff0d0', 0.95), eLobbyDesk: lit('#f7f1e6', 0.95), eLobbyRed: lit('#d03038', 0.9),
  });
  // near-identical flats share one handle
  Object.assign(M, {
    eFrame: M.frame, eLampBlack: M.lampBlack, eDoorFrame: M.lampBlack, fenceLow: M.lampBlack, whiteCanopy: M.lampBlack, clockCase: M.lampBlack, glassDark: M.lampBlack,
    eKerb: M.eRoofTrim, eBollard: M.eRoofTrim, concrete: M.eRoofTrim, concreteDark: M.eRoofTrim, balcony: M.eRoofTrim, pipe: M.eRoofTrim, stump: M.eRoofTrim, eTerrace: M.eRoofTrim, eSteelDoor: M.eRoofTrim,
    white: M.eWhite, eNosing: M.eStair, eYellow: M.eFrieze, eCap: M.cream, toiletRoof: M.gateRoof, roePeak: M.roeDark,
  });
  M.dkGlassA = M.eGlA; M.dkGlassC = M.eGlC; M.wallEnd = M.wall;
  const cut = [Tl.cut, M.sobFront, M.sobUpper, M.roeSign, M.roePlaque, M.eFriezeText, M.eSign, M.eDoorOrn, M.eDoorOrnC];
  M.cutouts = new Set(cut);
  M.decals = new Set([decB, Tl.dec, ...cut]);
  M.glassy = new Set([M.eDoorGlass]);
  M.lit = new Set([litB]);                              // every lit (MeshBasic) piece is one kind: no outline, no shadow
  // no outline pass for flat things that lie ON an opaque surface (decals, cut-outs, the transparent door glass, the thin light bars): the outline pass would otherwise see THROUGH an opaque glass pane / the foyer
  // to the far houses and draw their edges into the window (seen in the first try); no shadow caster for those, the soffits, the foyer: each was a mesh in three passes
  M.noOutline = new Set([...M.cutouts, ...M.decals, ...M.glassy, ...M.lit]);
  M.noCast = new Set([...M.noOutline]);

  return M;
}
