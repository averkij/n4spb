// landmarksMakarova/mats.js - materials of the module (ctx.mat.toon / glass only; every name starts with 'lmMak-').  Colours: docs/research/makarova.md section 10.
// MATERIAL BUDGET (draw-call trim 2026-10-10): the module has a handful of REAL materials and many HANDLES (parts.js / tiles.js): a handle is a colour (or a tile) of a base material that Parts writes into the
// vertex colours, exactly what core/batch2.js did with every plain material anyway.  Bases: the flat bases (opaque toon with vertex colours, one per paint amount: batch2 merges them into one kind), the tile
// sets (tiles.js: every repeating painting of the walls, friezes, roofs; the alpha-cut iron stays real), the three decal boards, the glass shaders and the few emissive pieces (gold, soffit, rose window, pill, M box).
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset), M.glassy = transparent sheets (no outline, no shadow).  These sets hold REAL materials
// (the bases): Parts.build() looks the merged mesh up in them.
import * as THREE from 'three';
import { makeArt, COL } from './art.js';
import { makeTiles } from './tiles.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmMak-' + name, paint: 0.02, ...o });
  // ---- flat colours: handles of a flat base per paint amount (the amounts of the old per-colour materials, rounded to five steps; batch2 shares one kind between all of them)
  const LEVELS = [0, 0.01, 0.02, 0.03, 0.045], flatBases = new Map();
  const flatBase = (paint) => {
    const p = LEVELS.reduce((b, v) => (Math.abs(v - paint) < Math.abs(b - paint) ? v : b), LEVELS[0]);
    let b = flatBases.get(p); if (!b) { b = T(W, { vertexColors: true, vpaint: true, paint: p, name: 'lmMak-flat' + Math.round(p * 1000) }); flatBases.set(p, b); }
    return b;
  };
  const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
  const flat = (name, col, o = {}) => (o.emissive ? T(col, { name: 'lmMak-' + name, paint: 0.03, ...o })
    : { isHandle: true, name: 'lmMak-' + name, transparent: false, tileBase: flatBase(o.paint ?? 0.03), tileCol: lin(col), hex: col });
  // ---- ONE material kind per tile set for every repeating painting (tiles.js)
  const Tl = makeTiles(ctx, [
    { name: 'tiles', defs: {
      gP: { tex: A.graniteP, paint: 0.04 }, parapet: { tex: A.parapet, paint: 0.04 }, sportG: { tex: A.sportGranite, paint: 0.02 }, slab: { tex: A.slab, paint: 0.03 },
      stuccoG: { tex: A.stuccoG, paint: 0.04 }, whiteS: { tex: A.whiteS, paint: 0.03 }, towerWall: { tex: A.towerWall, paint: 0.03 }, towerOrder: { tex: A.towerOrder, paint: 0.03 },
      stuccoY: { tex: A.stuccoY, paint: 0.04 }, lutOrder: { tex: A.lutOrder, paint: 0.03 }, stuccoC: { tex: A.stuccoC, paint: 0.04 }, michaelWhite: { tex: A.michaelWhite, paint: 0.03 },
      stuccoO: { tex: A.stuccoO, paint: 0.05 }, stuccoR: { tex: A.stuccoR, paint: 0.05 }, creamS: { tex: A.creamS, paint: 0.03 }, plinthRed: { tex: A.plinthRed, paint: 0.03 },
      roofG: { tex: A.roofSheet, paint: 0.03 }, domeRib: { tex: A.domeRib, paint: 0.02 }, drumWall: { tex: A.drumWall, paint: 0.03 }, rustB: { tex: A.rustB, paint: 0.04 },
      stuccoB: { tex: A.stuccoB, paint: 0.04 }, rustO: { tex: A.rustO, paint: 0.04 }, rustR: { tex: A.rustR, paint: 0.04 }, dentil: { tex: A.dentil, paint: 0.02 },
      palmette: { tex: A.palmette, paint: 0.02 }, garland: { tex: A.garland, paint: 0.02 }, domeDiamond: { tex: A.domeDiamond, paint: 0.02 }, meander: { tex: A.meander, paint: 0.02 },
      lutRib: { tex: A.lutRib, paint: 0.02 }, lutDrum: { tex: A.lutDrum, paint: 0.03 }, nave: { tex: A.nave, paint: 0.03 } } },
  ], { paint: 0.03, prefix: 'lmMak-' });          // (per tile: the paint amount of the old per-painting material)
  Object.assign(M, Tl.h, { tiles: Tl });
  Object.assign(M, {
    // ---- iron cut-outs: REAL materials (alpha-tested double-sided sheets): the sun shadow pass of three.js reads their map alpha, a tile shader would cast a solid shadow
    balust: T(W, { map: A.balust, name: 'lmMak-balust', paint: 0, alphaTest: 0.5, side: 'double' }),
    bars: T(W, { map: A.bars, name: 'lmMak-bars', paint: 0, alphaTest: 0.5, side: 'double' }), balcony: T(W, { map: A.balcony, name: 'lmMak-balcony', paint: 0, alphaTest: 0.5, side: 'double' }),
    // ---- Sportivnaya pavilion: canopy bands, steel, glass, signs
    canopyTop: flat('canopyTop', C.canopy, { paint: 0.015 }), canopyMid: flat('canopyMid', C.canopyMid, { paint: 0.015 }), canopyLow: flat('canopyLow', C.canopyLow, { paint: 0.015 }), soffit: flat('soffit', C.soffit, { paint: 0.01, emissive: '#c8cbcd', emissiveIntensity: 0.25 }),
    steel: flat('steel', C.steel, { paint: 0.01 }), steelDark: flat('steelDark', '#6e7378', { paint: 0.01 }), yellow: flat('yellow', C.yellowStrip, { paint: 0.02 }), bin: flat('bin', '#e3e1da', { paint: 0.04 }), mWhite: flat('mWhite', '#f1f3f4', { paint: 0.01 }), iron: flat('iron', C.iron, { paint: 0.01 }),
    membrane: sheet('membrane', A.membrane, { paint: 0.02 }), skylight: sheet('skylight', A.skylight, { paint: 0.01 }),
    pill: sheet('pill', A.pill, { paint: 0, polygonOffset: -2, emissive: '#d8d6cc', emissiveIntensity: 0.1 }), mBox: sheet('mBox', A.mBox, { paint: 0, emissive: '#e8ecee', emissiveIntensity: 0.12 }),   // low emissive: a strong one washed the blue M out to lavender (review 2026-10-09)
    glass: ctx.mat.glass({ tint: C.glass, opacity: 0.42, streaks: false }), doorGlass: ctx.mat.glass({ tint: '#a9bcc7', opacity: 0.4, streaks: false }),
    // ---- Lions pier
    lionBoard: sheet('lionBoard', A.lionBoard, { paint: 0, polygonOffset: -2 }), gShade: flat('gShade', '#5b4a42', { paint: 0.03 }),
    // ---- plain colours of the churches and the row
    gold: flat('gold', C.gold, { paint: 0.01, emissive: '#5a3c06', emissiveIntensity: 0.55 }), glassDark: flat('glassDark', '#2b3640', { paint: 0 }), wood: flat('wood', '#5a3b26', { paint: 0.02 }), visor: flat('visor', '#8a6a3a', { paint: 0.02 }),
    pierW: flat('pierW', '#e0dcd0', { paint: 0.03 }), stone: flat('stone', '#8a7f73', { paint: 0.04 }), roofGrey: flat('roofGrey', '#8c9094', { paint: 0.03 }),
    trim: flat('trim', C.white, { paint: 0.03 }), creamTrim: flat('creamTrim', C.cream, { paint: 0.03 }), awning: flat('awning', '#31493a', { paint: 0.03 }),
    doorRed: flat('doorRed', '#7a2a22', { paint: 0.02 }), chimney: flat('chimney', C.chimney, { paint: 0.04 }), pipe: flat('pipe', '#e8dcc0', { paint: 0.02 }),
    lutSign: sheet('lutSign', A.lutSign, { paint: 0, polygonOffset: -2 }), michaelBoard: sheet('michaelBoard', A.michaelBoard, { paint: 0, polygonOffset: -2 }),
    michaelTrim: flat('michaelTrim', C.michaelTrim, { paint: 0.03 }), spire: flat('spire', C.spire, { paint: 0.02 }), navRoof: flat('navRoof', C.navRoof, { paint: 0.03 }), aisleRoof: flat('aisleRoof', C.aisleRoof, { paint: 0.03 }), oakDoor: flat('oakDoor', '#4a2a20', { paint: 0.02 }), roseGlass: flat('roseGlass', '#5a2840', { paint: 0, emissive: '#2a1020', emissiveIntensity: 0.3 }),
  });
  // the near-black openings (gate niches, bell openings, louvres, the dome oculi, the frieze recesses) share ONE handle (review 2026-10-09)
  M.gateDark = M.louver = M.belfryDark = M.oculus = M.glassDark;
  M.cutouts = new Set([M.bars, M.balcony, M.balust]);
  M.decals = new Set([M.pill, M.lionBoard, M.lutSign, M.michaelBoard]);
  M.glassy = new Set([M.glass, M.doorGlass]);
  M.noCast = new Set([...M.decals, ...M.glassy]);
  return M;
}
