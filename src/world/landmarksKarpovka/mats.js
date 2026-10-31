// landmarksKarpovka/mats.js - materials of the module (ctx.mat.toon only; every name starts with 'lmKarp-').  Colours: docs/research/karpovka.md sections 2-3.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 3-6 cm in front of a wall (polygonOffset).
import { makeArt, COL } from './art.js';

export const C = { ...COL, roofRed: '#b23a34', pinkWall: '#e9b9a9', pinkWallD: '#d9a595', lawn: '#6f9f45', iron: '#26282c', terrace: '#8f8f8c', terraceL: '#a3a3a0', dark: '#4a4a4c', chimney: '#e2d6c2' };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmKarp-' + name, paint: 0.02, ...o });
  const cut = (name, map, o = {}) => T(W, { map, name: 'lmKarp-' + name, paint: 0, alphaTest: 0.5, polygonOffset: -2, ...o });
  Object.assign(M, {
    // ---- convent
    stripe: sheet('stripe', A.stripe, { paint: 0.03 }), socle: sheet('socle', A.socle, { paint: 0.04 }), arcature: sheet('arcature', A.arcature), crossFrieze: sheet('crossFrieze', A.crossFrieze),
    panelFrieze: sheet('panelFrieze', A.panelFrieze), scallop: sheet('scallop', A.scallop), drumBay: sheet('drumBay', A.drumBay), belfryBay: sheet('belfryBay', A.belfryBay), gable: sheet('gable', A.gable),
    pink: T(C.pink, { name: 'lmKarp-pink', paint: 0.03 }), pinkD: T(C.pinkD, { name: 'lmKarp-pinkD', paint: 0.03 }), cream: T(C.cream, { name: 'lmKarp-cream', paint: 0.03 }),
    granite: T(C.granite, { name: 'lmKarp-granite', paint: 0.05 }),
    roof: T(C.dome, { map: A.seam, name: 'lmKarp-roof', paint: 0.04 }), roofRed: T(C.roofRed, { map: A.seam, name: 'lmKarp-roofRed', paint: 0.04 }), dome: T(C.dome, { map: A.rib, name: 'lmKarp-dome', paint: 0.03 }),
    domeFlat: T(C.dome, { name: 'lmKarp-domeFlat', paint: 0.03 }),
    hood: T('#5c3f34', { name: 'lmKarp-hood', paint: 0.03 }), pipe: T('#5a4c48', { name: 'lmKarp-pipe' }),
    gold: T(C.gold, { emissive: '#6a4a08', emissiveIntensity: 0.4, name: 'lmKarp-gold' }), dark: T('#22242a', { name: 'lmKarp-darkHole' }), chimney: T(C.chimney, { name: 'lmKarp-chimney', paint: 0.04 }),
    winArch: cut('winArch', A.winArch), winSmall: cut('winSmall', A.winSmall), winPair: cut('winPair', A.winPair), biforium: cut('biforium', A.biforium), tall3: cut('tall3', A.tall3),
    portal: cut('portal', A.portal), roundel: cut('roundel', A.roundel), icons: cut('icons', A.icons), gateLeaf: cut('gateLeaf', A.gateLeaf, { side: 'double' }),
    socleWin: sheet('socleWin', A.socleWin, { polygonOffset: -2 }), mosaic: sheet('mosaic', A.mosaic, { polygonOffset: -2, paint: 0 }),
    pinkWall: T(C.pinkWall, { name: 'lmKarp-pinkWall', paint: 0.04 }), pinkWallD: T(C.pinkWallD, { name: 'lmKarp-pinkWallD', paint: 0.03 }),
    // ---- Lensovet
    slab: sheet('slab', A.slab, { paint: 0.03 }), bayWin: sheet('bayWin', A.bayWin), baySocle: sheet('baySocle', A.baySocle), bayTop: sheet('bayTop', A.bayTop), bayLadder: sheet('bayLadder', A.bayLadder),
    porthole: sheet('porthole', A.porthole), glaze: sheet('glaze', A.glaze), logBack: sheet('logBack', A.logBack), logDecal: sheet('logDecal', A.logBack, { polygonOffset: -2 }), ribbed: sheet('ribbed', A.ribbed), entrance: sheet('entrance', A.entrance),
    slabFlat: T(C.slab, { name: 'lmKarp-slabFlat', paint: 0.03 }), slabD: T(C.slabD, { name: 'lmKarp-slabD', paint: 0.03 }), concrete: T('#a9a59c', { name: 'lmKarp-concrete', paint: 0.05 }),
    column: T('#c9c5bc', { name: 'lmKarp-column', paint: 0.03 }), roofL: T('#7f8286', { name: 'lmKarp-roofL', paint: 0.04 }), darkStone: T(C.dark, { name: 'lmKarp-darkStone', paint: 0.03 }),
    terrace: T(C.terrace, { map: A.granite, name: 'lmKarp-terrace', paint: 0.04 }), terraceL: T(C.terraceL, { map: A.granite, name: 'lmKarp-terraceL', paint: 0.04 }),
    reliefRye: sheet('reliefRye', A.reliefRye, { polygonOffset: -2 }), reliefTank: sheet('reliefTank', A.reliefTank, { polygonOffset: -2 }), reliefFoot: sheet('reliefFoot', A.reliefFoot, { polygonOffset: -2 }),
    yardWall: sheet('yardWall', A.yardWall), iron: T(C.iron, { name: 'lmKarp-iron' }), rail: T('#5a5d62', { name: 'lmKarp-rail' }),
    lawn: T(C.lawn, { map: A.grass, name: 'lmKarp-lawn', paint: 0.06, polygonOffset: -3 }), pavers: T('#b9b6ae', { map: A.pavers, name: 'lmKarp-pavers', paint: 0.04, polygonOffset: -4 }), paversTop: T('#b9b6ae', { map: A.pavers, name: 'lmKarp-paversTop', paint: 0.04 }),
    water: T('#5f8fb0', { name: 'lmKarp-water', paint: 0.02 }), pavilion: T('#e3b7a6', { name: 'lmKarp-pavilion', paint: 0.04 }), glassDark: T('#27323f', { name: 'lmKarp-glassDark' }),
  });
  M.cutouts = new Set([M.winArch, M.winSmall, M.winPair, M.biforium, M.tall3, M.portal, M.roundel, M.icons, M.gateLeaf]);
  M.decals = new Set([M.socleWin, M.mosaic, M.reliefRye, M.reliefTank, M.reliefFoot, M.logDecal]);
  /** a plate with real text: transparent letters (alpha) or a filled plaque */
  const textCache = new Map();
  M.text = (text, o = {}) => {
    const k = text + '|' + JSON.stringify(o); let m = textCache.get(k);
    if (!m) { m = T(W, { map: A.text(text, o), name: 'lmKarp-text', alphaTest: o.bg ? 0 : 0.4, polygonOffset: -2, paint: 0 }); if (!o.bg) M.cutouts.add(m); else M.decals.add(m); textCache.set(k, m); }
    return m;
  };
  return M;
}
