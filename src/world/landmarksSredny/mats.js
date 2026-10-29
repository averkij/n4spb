// landmarksSredny/mats.js - the materials of the module (ctx.mat.toon / glass only; every name starts with 'lmsredn-').  Colours: docs/research/sredny.md (sections 3.2 - 3.4, 4.3, 6.3, 7.3, 8.3).
// M.cutouts = alpha cut-outs (fences, lettering, plates: no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset, no outline), M.glassy = transparent sheets.
import { makeArtA } from './artA.js';
import { makeArtB } from './artB.js';
import * as THREE from 'three';
import { makeArtC } from './artC.js';
import { makeTiles } from './tiles.js';

export function makeMats(ctx) {
  const T = ctx.mat.toon, W = '#ffffff';
  const A = { ...makeArtA(ctx), ...makeArtB(ctx), ...makeArtC(ctx) };
  const M = { A };
  // ---- handles (draw-call trim 2026-10-10): a handle is a colour (or a tile) of a base material that Parts (parts.js) writes into the vertex colours, exactly what core/batch2.js did with every plain
  // material anyway.  Flat colours: a flat base per paint amount (batch2 shares ONE kind between all of them); tiled paintings: tile sets (tiles.js: ONE kind per set); decals, cut-outs with an
  // offset and emissive pieces stay real materials.
  const LEVELS = [0, 0.01, 0.02, 0.03, 0.045], flatBases = new Map();
  const flatBase = (paint) => {
    const p = LEVELS.reduce((b, v) => (Math.abs(v - paint) < Math.abs(b - paint) ? v : b), LEVELS[0]);
    let b = flatBases.get(p); if (!b) { b = T(W, { vertexColors: true, vpaint: true, paint: p, name: 'lmsredn-flat' + Math.round(p * 1000) }); flatBases.set(p, b); }
    return b;
  };
  const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
  const flat = (name, col, o = {}) => (o.emissive ? T(col, { name: 'lmsredn-' + name, paint: 0.03, ...o })
    : { isHandle: true, name: 'lmsredn-' + name, transparent: false, tileBase: flatBase(o.paint ?? 0.03), tileCol: lin(col), hex: col });
  const pend = { tiles: {}, decLawn: {}, decPave: {} }, handles = [];
  const tileH = (set, name, map, paint) => { const h = { isTileHandle: true, name: 'lmsredn-tile-' + name, transparent: false, tileBase: null, tileCol: null, set, key: name }; pend[set][name] = { tex: map, paint }; handles.push(h); return h; };
  const sheet = (name, map, o = {}) => (o.polygonOffset || o.emissive ? T(W, { map, name: 'lmsredn-' + name, paint: 0.02, ...o }) : tileH('tiles', name, map, o.paint ?? 0.02));
    const dec = (name, map, po, paint) => tileH(po === -3 ? 'decLawn' : 'decPave', name, map, paint);
  Object.assign(M, {
    // ---- depot
    brick: sheet('brick', A.brick, { paint: 0.03 }), brickDark: flat('brickDark', '#7a4338', { paint: 0.04 }), brickHead: flat('brickHead', '#9c4a3c', { paint: 0.03 }),
    gate: sheet('gate', A.gate, { paint: 0.02 }), plates: sheet('plates', A.plates, { paint: 0, polygonOffset: -2 }), winBig: sheet('winBig', A.winBig, { paint: 0 }), sideWin: sheet('sideWin', A.sideWin, { paint: 0 }),
    roofMetal: flat('roofMetal', '#5f5b58', { paint: 0.05 }), roofGrey: flat('roofGrey', '#8c9296', { paint: 0.05 }),
    blackGranite: flat('blackGranite', '#2b2b30', { paint: 0.04 }), stone: flat('stone', '#d8cfae', { paint: 0.03 }), panel: flat('panel', '#e0c895', { paint: 0.03 }), surround: flat('surround', '#e2c98c', { paint: 0.03 }),
    clerestory: flat('clerestory', '#6f8c9a', { paint: 0.01 }), steel: flat('steel', '#2c3338', { paint: 0.02 }), iron: flat('iron', '#1b1d20', { paint: 0.01 }), ironLight: flat('ironLight', '#6b7176', { paint: 0.02 }),
    bench: flat('bench', '#8a4a30', { paint: 0.03 }), cap: flat('cap', '#8a8478', { paint: 0.03 }), tin: flat('tin', '#7d8184', { paint: 0.02 }),
    // ---- admin blocks
    ochre: sheet('ochre', A.ochre, { paint: 0.04 }), ochreRust: sheet('ochreRust', A.ochreRust, { paint: 0.04 }), win3: sheet('win3', A.win3, { paint: 0 }), cornice: flat('cornice', '#e0c79b', { paint: 0.03 }),
    num1031: T(W, { map: A.num1031, name: 'lmsredn-num1031', paint: 0, alphaTest: 0.5, polygonOffset: -2 }), leonovPlate: sheet('leonovPlate', A.leonovPlate, { paint: 0, polygonOffset: -2 }), brushBoard: sheet('brushBoard', A.brushBoard, { paint: 0 }), plaqueA: sheet('plaqueA', A.plaqueA, { paint: 0, polygonOffset: -2 }), plaqueB: sheet('plaqueB', A.plaqueB, { paint: 0, polygonOffset: -2 }), soffit: flat('soffit', '#d6dadb', { paint: 0.03 }), lepnina: flat('lepnina', '#b98b58', { paint: 0.03 }), plinthDark: flat('plinthDark', '#373836', { paint: 0.04 }), plasterPink: flat('plasterPink', '#d9a58f', { paint: 0.04 }),
    marble: flat('marble', '#ecebe6', { paint: 0.01 }), heritage: flat('heritage', '#585d62', { paint: 0.01 }), ventBox: flat('ventBox', '#e8e8e4', { paint: 0.02 }), greenBox: flat('greenBox', '#6e8b78', { paint: 0.02 }),
    // ---- Geological Committee
    dolo: sheet('dolo', A.dolo, { paint: 0.03 }), dolo1: sheet('dolo1', A.dolo1, { paint: 0.03 }), doloFlat: flat('doloFlat', '#e6dcc0', { paint: 0.03 }), doloShade: flat('doloShade', '#c9bfa4', { paint: 0.03 }),
    granRust: sheet('granRust', A.granRust, { paint: 0.04 }), granLight: sheet('granLight', A.granLight, { paint: 0.04 }), granString: flat('granString', '#6b6e6e', { paint: 0.04 }), granGrey: flat('granGrey', '#8a8c8a', { paint: 0.04 }),
    glassArch: sheet('glassArch', A.glassArch, { paint: 0 }), glassRect: sheet('glassRect', A.glassRect, { paint: 0 }), balus: sheet('balus', A.balus, { paint: 0.01 }),
    lettering: T(W, { map: A.lettering, name: 'lmsredn-lettering', paint: 0, alphaTest: 0.5, polygonOffset: -2 }), doorOak: sheet('doorOak', A.doorOak, { paint: 0.01 }),
    greenRoof: flat('greenRoof', '#4f8a72', { paint: 0.05 }), domeMetal: flat('domeMetal', '#9aa8a2', { paint: 0.05 }), skylight: flat('skylight', '#93aebd', { paint: 0.01 }), darkSteel: flat('darkSteel', '#3a4248', { paint: 0.02 }),
    plaque: sheet('plaque', A.plaque, { paint: 0, polygonOffset: -2 }), lamp: flat('lamp', '#a9bcc7', { paint: 0.02 }), globe: T('#f0efe6', { name: 'lmsredn-globe', paint: 0, emissive: '#e8e6d6', emissiveIntensity: 0.25 }),
    lawn: dec('lawn', A.lawn, -3, 0.05),
    // ---- fences (alpha cut-outs, double sided)
    fenceBlack: T(W, { map: A.fenceBlack, name: 'lmsredn-fenceBlack', paint: 0, alphaTest: 0.5, side: 'double' }),
    fenceSlate: T(W, { map: A.fenceSlate, name: 'lmsredn-fenceSlate', paint: 0, alphaTest: 0.5, side: 'double' }),
    fenceLattice: T(W, { map: A.fenceLattice, name: 'lmsredn-fenceLattice', paint: 0, alphaTest: 0.5, side: 'double' }),
    slate: flat('slate', '#444b4f', { paint: 0.02 }),
    // ---- Frank mansion
    cream: sheet('cream', A.creamPlaster, { paint: 0.03 }), salmonBrick: flat('salmonBrick', '#c8683f', { paint: 0.04 }), boards: flat('boards', '#e8e2d2', { paint: 0.03 }), fretwork: sheet('fretwork', A.fretwork, { paint: 0.01 }),
    winFrank: sheet('winFrank', A.winFrank, { paint: 0 }), roofMaroon: flat('roofMaroon', '#7a3d38', { paint: 0.05 }), rose: flat('rose', '#92514e', { paint: 0.03 }), maroon: flat('maroon', '#7b3a34', { paint: 0.03 }),
    corniceCream: flat('corniceCream', '#d8d0c0', { paint: 0.03 }), chimney: flat('chimney', '#9a5a45', { paint: 0.03 }), doorMaroon: flat('doorMaroon', '#7f2f28', { paint: 0.02 }), doorFrank: sheet('doorFrank', A.doorFrank, { paint: 0.01 }), glassDark: flat('glassDark', '#2b3338', { paint: 0 }),
    // ---- Dom Evangelia
    stucco: sheet('stucco', A.stucco, { paint: 0.05 }), winEv: sheet('winEv', A.winEv, { paint: 0 }), roofRust: flat('roofRust', '#7a5040', { paint: 0.05 }), stuccoFlat: flat('stuccoFlat', '#c8a66b', { paint: 0.05 }), flatRoof: flat('flatRoof', '#6b5a52', { paint: 0.04 }),
    brickBare: flat('brickBare', '#8e5a45', { paint: 0.04 }), capEv: flat('capEv', '#a07a60', { paint: 0.04 }), fireEscape: flat('fireEscape', '#6a4a3a', { paint: 0.03 }),
    // ---- tower and rope shop
    towerPlaster: sheet('towerPlaster', A.towerPlaster, { paint: 0.03 }), slit: sheet('slit', A.slit, { paint: 0 }), ribbon: sheet('ribbon', A.ribbon, { paint: 0 }), hallWin: sheet('hallWin', A.hallWin, { paint: 0 }),
    graphite: flat('graphite', '#32373b', { paint: 0.02 }), railing: flat('railing', '#7b8084', { paint: 0.02 }), plinthGrey: flat('plinthGrey', '#4a4a4a', { paint: 0.04 }), roofLight: flat('roofLight', '#b5b8ba', { paint: 0.03 }), roofDark: flat('roofDark', '#4a4d50', { paint: 0.03 }),
    lantern: flat('lantern', '#6f8c9a', { paint: 0.01 }), concrete: flat('concrete', '#b6b0a0', { paint: 0.04 }),
    // ---- Gorny pavilions
    louvre: sheet('louvre', A.louvre, { paint: 0.02 }), granBand: sheet('granBand', A.granBand, { paint: 0.03 }), mirror: sheet('mirror', A.mirror, { paint: 0.01 }), nameBand: sheet('nameBand', A.nameBand, { paint: 0 }),
    blueM: T(W, { map: A.blueM, name: 'lmsredn-blueM', paint: 0, alphaTest: 0.5, polygonOffset: -2 }), signPlate: sheet('signPlate', A.signPlate, { paint: 0, polygonOffset: -2 }),
    liftPlate: T(W, { map: A.liftPlate, name: 'lmsredn-liftPlate', paint: 0, alphaTest: 0.5, polygonOffset: -2 }), glassPav: sheet('glassPav', A.glassPav, { paint: 0 }),
    louvreBlack: sheet('louvreBlack', A.louvreBlack, { paint: 0.01 }), graniteLift: sheet('graniteLift', A.graniteLift, { paint: 0.03 }), plaza: dec('plaza', A.plaza, -4, 0.04),
    copper: flat('copper', '#b4552f', { paint: 0.02 }), copperShade: flat('copperShade', '#8a3f26', { paint: 0.02 }), copperTop: flat('copperTop', '#c8643c', { paint: 0.02 }), skyGlass: flat('skyGlass', '#6f8fb5', { paint: 0.01 }),
    stainless: flat('stainless', '#b9bcbe', { paint: 0.01 }), orange: flat('orange', '#d9622a', { paint: 0.02 }), yellow: flat('yellow', '#f0d020', { paint: 0.01 }), dark: flat('dark', '#2b2e30', { paint: 0.01 }),
    doorGlass: ctx.mat.glass({ tint: '#26333d', opacity: 0.72, streaks: false }),
    // ---- the Brush monument and the yard
    pavers: dec('pavers', A.pavers, -4, 0.04), plinthGranite: flat('plinthGranite', '#9a9a96', { paint: 0.04 }),
    burgundy: flat('burgundy', '#7a1e22', { paint: 0.03 }), tramCream: flat('tramCream', '#eee6d0', { paint: 0.03 }), tramBlack: flat('tramBlack', '#272422', { paint: 0.02 }), wood: flat('wood', '#a8743f', { paint: 0.03 }), gold: flat('gold', '#c9a24a', { paint: 0.02 }),
    tramRed: flat('tramRed', '#c0282a', { paint: 0.03 }), tramRed2: flat('tramRed2', '#b62a2a', { paint: 0.03 }), tramGrey: flat('tramGrey', '#cfd2d6', { paint: 0.03 }), tramYellow: flat('tramYellow', '#e8b300', { paint: 0.03 }),
    tramGlass: flat('tramGlass', '#3d4c58', { paint: 0 }), tramGlassLight: flat('tramGlassLight', '#6f8794', { paint: 0 }), blueLamp: T('#4a78d0', { name: 'lmsredn-blueLamp', paint: 0, emissive: '#2d58a8', emissiveIntensity: 0.4 }),
    white: flat('white', '#f2efe6', { paint: 0.01 }), bronze: flat('bronze', '#5a5348', { paint: 0.03 }), pedWhite: flat('pedWhite', '#ece8de', { paint: 0.03 }), steelMast: flat('steelMast', '#8a9298', { paint: 0.03 }),
    boardWhite: flat('boardWhite', '#f2f1ec', { paint: 0.01 }), urn: flat('urn', '#1b1d20', { paint: 0.02 }),
    // the park lamps are InstancedMeshes (yard.js, partsGeos with the plain kit): real materials, not handles
    urnLamp: T('#1b1d20', { name: 'lmsredn-urnLamp', paint: 0.02 }), whiteLamp: T('#f2efe6', { name: 'lmsredn-whiteLamp', paint: 0.01 }),
  });
  // the tile sets (tiles.js) are made now that every handle has registered its painting; handles get their base and tile colour
  const Tl = makeTiles(ctx, [
    { name: 'tiles', defs: pend.tiles },
    { name: 'decLawn', po: -3, defs: pend.decLawn }, { name: 'decPave', po: -4, defs: pend.decPave },
  ].filter((x) => Object.keys(x.defs).length), { paint: 0.03, prefix: 'lmsredn-' });
  for (const h of handles) { const t = Tl.h[h.key]; h.tileBase = t.tileBase; h.tileCol = t.tileCol; h.tileId = t.tileId; }
  M.tiles = Tl;
  M.cutouts = new Set([M.num1031, M.fenceBlack, M.fenceSlate, M.fenceLattice, M.lettering, M.blueM, M.liftPlate]);
  M.decals = new Set([M.leonovPlate, M.plates, M.plaqueA, M.plaqueB, M.plaque, M.signPlate, Tl.bases.decLawn, Tl.bases.decPave]);
  M.glassy = new Set([M.doorGlass]);
  M.noCast = new Set([...M.decals, ...M.glassy]);
  return M;
}
