// landmarksMarineFacade/mats.js - materials of the module (ctx.mat.toon / glass / facade only; every name starts with 'lmmarin-').  Colours: docs/research/marinefacade.md section 8 + the CRITIC corrections 12b / 17.
// DRAW CALLS: the ~45 plain colours of the module are COLOUR HANDLES of ONE vertex-colour toon material (M.flat): kit.js Parts puts the handle's colour into the vertices, so the whole module needs ~25 materials
// instead of ~70 (docs/PERFORMANCE.md: the draw-call delta of a module at its postcard pose must stay <= ~60).  Textured sheets, decals, cut-outs, glass and the facade shaders keep their own materials.
// M.cutouts = alpha cut-outs (no outline pass), M.decals = sheets that lie 2-6 cm in front of a surface (polygonOffset), M.glassy = transparent sheets (no outline, no shadow).
import * as THREE from 'three';
import { makeArt, COL } from './art.js';

export const C = { ...COL };

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmmarin-' + name, paint: 0.02, ...o });
  const flat = (name, col, o = {}) => T(col, { name: 'lmmarin-' + name, paint: 0.03, ...o });
  M.flat = T(W, { vertexColors: true, name: 'lmmarin-flat', paint: 0.03 });
  /** a colour handle of the shared vertex-colour material */
  const H = (col) => ({ isHandle: true, base: M.flat, rgb: new THREE.Color(col).toArray(), hex: col });
  Object.assign(M, {
    // ---- terminals (textured sheets)
    panel: sheet('panel', A.panel, { paint: 0.02 }), soffit: sheet('soffit', A.soffit, { paint: 0.01 }), screen: sheet('screen', A.screen, { paint: 0.01 }), roofTop: sheet('roofTop', A.roofTop, { paint: 0.03 }),
    glassWall: ctx.mat.facade({ glass: '#4c6a80', glassLit: '#9fbbcf', frame: '#8d979f', spandrel: '#7d8b97', bay: 1.6, floor: 1.4, mullion: 0.08, transom: 0.1, spandrelH: 0, reflect: 0.36, lit: 0.0, blinds: 0.0, streak: 0.4, sparkle: 0.4, side: 'double', name: 'lmmarin-glassWall' }),
    doorGlass: ctx.mat.glass({ tint: '#2c3b4a', opacity: 0.85, streaks: false }),
    plates: sheet('plates', A.plates, { paint: 0, polygonOffset: -2 }),
    // ---- terminals (plain colours)
    cap: H(C.cap), band: H(C.band), pier: H(C.pier), strut: H(C.strut), rod: H(C.rod), canopy: H(C.canopy), doorFrame: H(C.doorFrame), mull: H(C.mullion),
    white: H('#e6e7e6'), grey: H('#9a9e9b'), dark: H('#3a3d42'), graphite: H('#5b6066'), salmon: H('#c9a58e'), cupGlass: H('#4a5a6a'), booth: H('#b3b7bb'),
    // ---- galleries / canopies
    galleryRoof: sheet('galleryRoof', A.galleryRoof, { paint: 0.02, side: 'double' }), galleryPost: H('#8d9297'),
    pane: sheet('pane', A.paneGlass, { paint: 0, transparent: true, opacity: 0.55, depthWrite: false, side: 'double' }),
    girder: H('#5d6d80'), tubeRoof: H('#aeb2b4'), tubeGlass: flat('tubeGlass', '#6f8da3', { paint: 0.0, side: 'double' }),
    rib: sheet('rib', A.rib, { paint: 0.02 }),
    // ---- quay
    fender: H(C.fender), hazard: sheet('hazard', A.hazard, { paint: 0, polygonOffset: -3 }), yellow: H(C.yellow), black: H(C.black), kiosk: H('#e3e6e8'), kioskRoof: H('#3a6aa8'),
    // ---- masts, fences, gates
    mast: H(C.mast), mastHead: H(C.mastHead), lamp: H('#d8dee1'), cobra: H('#b9bdc2'),
    meshPanel: sheet('meshPanel', A.mesh, { paint: 0, alphaTest: 0.5, side: 'double' }), guardPanel: sheet('guardPanel', A.guard, { paint: 0, alphaTest: 0.5, side: 'double' }),
    post: H('#aeb3b6'), wall: H('#b8b9b5'), footBlock: H('#9a9d9a'), boomRed: H('#c43a2b'), barrierYellow: H('#e0b61c'),
    // ---- ground
    apron: flat('apron', C.apron, { paint: 0.04, polygonOffset: -3 }), hard: sheet('hard', A.slabs, { paint: 0.03, polygonOffset: -3 }), berth: sheet('berth', A.slabs, { paint: 0.03, polygonOffset: -4 }),
    pavers: sheet('pavers', A.pavers, { paint: 0.04, polygonOffset: -3 }), helipad: sheet('helipad', A.helipad, { paint: 0.02, polygonOffset: -4 }), lawn: flat('lawn', C.lawn, { paint: 0.05, polygonOffset: -2 }),
    stone: sheet('stone', A.stone, { paint: 0.05 }), concrete: H('#c9cbc8'),
    // ---- ships
    hull: sheet('hull', A.hull, { paint: 0.02 }), hullPlain: H(C.hull), boot: H(C.boot), balcony: sheet('balcony', A.balcony, { paint: 0.02 }), balconyDark: sheet('balconyDark', A.balconyDark, { paint: 0.02 }),
    boat: H(C.boat), shipGlass: H('#86a8bc'), shipDark: H('#3a4046'), rope: H(C.rope), deckGrey: H('#9a9d9a'),
    // ---- Golden City
    gcFacade: ctx.mat.facade({ glass: C.gcGlass, glassLit: '#7e92ac', frame: C.gcWall, spandrel: C.gcPilaster, bay: 1.74, floor: 3.0, mullion: 0.5, transom: 0.35, spandrelH: 0.55, reflect: 0.12, lit: 0.04, blinds: 0.12, streak: 0.2, sparkle: 0.3, metal: 0, grad: { bottom: 0.9, top: 1.04, height: 80 }, seed: 11, name: 'lmmarin-gcFacade' }),
    gcStone: H(C.gcWall), gcRoof: H('#6f8f4a'), gold: H(C.gold), goldLit: H(C.goldLit), gcDark: H('#2e3a4a'),
    // ---- Mayak placeholder
    mayak: sheet('mayak', A.mayak, { paint: 0.02 }),
    // ---- small buildings and the tip hangar
    shedWall: H('#dcdcda'), shedRoof: H('#8a8e92'), hallWall: H('#b9c0c4'), darkWall: H('#5a5e62'), hangarRoofLit: H('#f4f6f8'), hangarRoofShade: H('#9fb0c0'),
    timber: H('#c6a98a'),
  });
  // aliases: tones that differ by a few percent share one colour
  Object.assign(M, { tentWall: M.shedWall, hangarWall: M.hallWall, hallRoof: M.rib, boomWhite: M.white, funnel: M.hullPlain, radome: M.hullPlain, gcPlant: M.grey, gcTar: M.shedRoof, kerb: M.footBlock, plinth: M.concrete, lantern: M.shipGlass, mayakRoof: M.dark, yachtWhite: M.white, galleryDark: M.galleryRoof });
  M.cutouts = new Set([M.meshPanel, M.guardPanel]);
  M.decals = new Set([M.plates, M.hazard, M.apron, M.hard, M.berth, M.pavers, M.helipad, M.lawn]);
  M.glassy = new Set([M.pane, M.doorGlass]);
  M.unlined = new Set();                                                       // (thin gold lattices are registered with the LOD and made noOutline by goldencity.js)
  return M;
}
