// landmarksTroitskaya/mats.js - materials of the module (ctx.mat.toon only).  Colours: docs/research/troitskaya.md sections 2-5 and 7.  M.cutouts = alpha cut-outs (no outline pass),
// M.decals = panes / tile sheets that lie 3-6 cm in front of a wall (polygonOffset), M.night = window sheets that glow with uNight.
import { makeArt } from './art.js';

export const C = {
  granite: '#8f9399', graniteSmooth: '#a7aaab', graniteLight: '#b6b8b7', graniteDark: '#5f636b', turq: '#3fbccb', cobalt: '#1f4a9c', gold: '#e2b23a',
  brick: '#dece9e', brickShade: '#c6b68a', granK: '#8a8d90', redGranite: '#a0655a', redGraniteDark: '#7a4a42', metal: '#70777c', roofGreen: '#6f8a7c', roofSilver: '#9ba0a3',
  brant: '#e6e2d6', link: '#d9cfae', chapel: '#6e3f38', chapelLight: '#c9b3a4', bronzeGreen: '#3f6a58', copper: '#5f9a82',
  grit: '#a8604c', lawn: '#6f9f45', hedge: '#3f6f34', bench: '#eeece4', lampBlack: '#1f2124',
  polit: '#c9cac6', politShade: '#b2b4b1', stalin: '#e0c682', stalinTrim: '#efe3bd', lidval: '#bfb193', lidvalTrim: '#d0c7ab', potStone: '#8c8a84', roofLidval: '#8f979a',
};

export function makeMats(ctx) {
  const T = ctx.mat.toon, A = makeArt(ctx), M = { A, C };
  const W = '#ffffff';
  const sheet = (name, map, o = {}) => T(W, { map, name: 'lmT-' + name, paint: 0.02, ...o });
  const night = [];
  const win = (name, map) => { const m = T(W, { map, name: 'lmT-' + name, paint: 0.02 }); night.push(m); return m; };
  Object.assign(M, {
    // ---- Mosque
    rock: sheet('rock', A.rock, { paint: 0.05 }), ashlar: sheet('ashlar', A.ashlar, { paint: 0.04 }), arcade: sheet('arcade', A.arcade), corbel: sheet('corbel', A.corbel),
    granite: T(C.granite, { name: 'lmT-granite', paint: 0.04 }), graniteSmooth: T(C.graniteSmooth, { name: 'lmT-graniteS', paint: 0.03 }), graniteLight: T(C.graniteLight, { name: 'lmT-graniteL', paint: 0.03 }),
    graniteDark: T(C.graniteDark, { name: 'lmT-graniteD', paint: 0.03 }), roofLead: T('#7f858b', { name: 'lmT-roofLead', paint: 0.04 }), dark: T('#15181d', { name: 'lmT-dark' }),
    portal: sheet('portal', A.portal), muqarnas: sheet('muqarnas', A.muqarnas, { side: 'double' }), jamb: sheet('jamb', A.jamb), iwanBack: sheet('iwanBack', A.iwanBack),
    latticeWin: sheet('latticeWin', A.latticeWin, { polygonOffset: -1 }), pointedWin: sheet('pointedWin', A.pointedWin, { polygonOffset: -1 }),
    medallion: sheet('medallion', A.medallion, { alphaTest: 0.5, polygonOffset: -2 }), northPortal: sheet('northPortal', A.northPortal),
    rib: sheet('rib', A.rib, { paint: 0.03 }), drum: sheet('drum', A.drum), shaft: sheet('shaft', A.shaft), gallery: sheet('gallery', A.gallery), turret: sheet('turret', A.turret),
    turq: T(C.turq, { name: 'lmT-turq', paint: 0.04 }), cobalt: T(C.cobalt, { name: 'lmT-cobalt', paint: 0.03 }),
    gold: T(W, { map: A.gold, emissive: '#6a4a08', emissiveIntensity: 0.4, name: 'lmT-gold' }), goldFlat: T(C.gold, { emissive: '#6a4a08', emissiveIntensity: 0.4, name: 'lmT-goldF' }),
    mosqueFence: sheet('mosqueFence', A.mosqueFence, { alphaTest: 0.5, side: 'double' }), postPanel: sheet('postPanel', A.postPanel, { polygonOffset: -1 }),
    railGreen: T('#2f6b5c', { name: 'lmT-railGreen' }), white: T('#eceae2', { name: 'lmT-white', paint: 0.03 }),
    // ---- mansion
    brick: sheet('brick', A.brick, { paint: 0.04 }), granK: sheet('granK', A.granK, { paint: 0.04 }), frieze: sheet('frieze', A.frieze),
    brickFlat: T(C.brick, { name: 'lmT-brickF', paint: 0.04 }), granKFlat: T(C.granK, { name: 'lmT-granKF', paint: 0.04 }),
    redGranite: T(C.redGranite, { map: A.granitePolished, name: 'lmT-redG', paint: 0.03 }), redGraniteDark: T(C.redGraniteDark, { name: 'lmT-redGD', paint: 0.03 }),
    metal: T(C.metal, { name: 'lmT-metal' }), roofGreen: T(C.roofGreen, { name: 'lmT-roofGreen', paint: 0.04 }), roofSilver: T(C.roofSilver, { name: 'lmT-roofSilver', paint: 0.04 }),
    kwin: win('kwin', A.kwin), kwin3: win('kwin3', A.kwin3), wwin: win('wwin', A.wwin), wgarden: sheet('wgarden', A.wgarden), kfence: sheet('kfence', A.kfence, { alphaTest: 0.5, side: 'double' }),
    brant: T(C.brant, { name: 'lmT-brant', paint: 0.03 }), link: T(C.link, { name: 'lmT-link', paint: 0.03 }), copper: T(C.copper, { name: 'lmT-copper', paint: 0.04 }),
    domeWhite: T('#eef0ee', { name: 'lmT-domeWhite', paint: 0.02 }), metalLight: T('#9aa1a5', { name: 'lmT-metalL' }), graniteDarkK: T('#3d4046', { name: 'lmT-granDK', paint: 0.02 }),
    graniteLightK: T('#b9bab6', { name: 'lmT-granLK', paint: 0.03 }), water: T('#5f8fb0', { name: 'lmT-water', transparent: true, opacity: 0.82, depthWrite: false, polygonOffset: -3 }),
    // ---- house sheets
    bayLidval: win('bayLidval', A.bayLidval), bayLidvalStone: win('bayLidvalStone', A.bayLidvalStone), bayPolit: win('bayPolit', A.bayPolit), bayPolitBalc: win('bayPolitBalc', A.bayPolitBalc),
    bayPolitGlass: win('bayPolitGlass', A.bayPolitGlass), bayStalin: win('bayStalin', A.bayStalin), bayStalinBase: win('bayStalinBase', A.bayStalinBase), bayBrant: win('bayBrant', A.bayBrant),
    bayLink: win('bayLink', A.bayLink), bayCourt: win('bayCourt', A.bayCourt), bayStone: win('bayStone', A.bayStone), bayStoneBase: win('bayStoneBase', A.bayStoneBase),
    stoneTrim: T('#ebe6d8', { name: 'lmT-stoneTrim', paint: 0.03 }),
    polit: T(C.polit, { name: 'lmT-polit', paint: 0.03 }), politShade: T(C.politShade, { name: 'lmT-politS', paint: 0.03 }), stalin: T(C.stalin, { name: 'lmT-stalin', paint: 0.03 }),
    stalinTrim: T(C.stalinTrim, { name: 'lmT-stalinT', paint: 0.03 }), lidval: T(C.lidval, { name: 'lmT-lidval', paint: 0.06 }), lidvalTrim: T(C.lidvalTrim, { name: 'lmT-lidvalT', paint: 0.03 }),
    potStone: T(C.potStone, { name: 'lmT-potStone', paint: 0.06 }), roofLidval: T(C.roofLidval, { name: 'lmT-roofLidval', paint: 0.04 }), roofRed: T('#9a4a3c', { name: 'lmT-roofRed', paint: 0.04 }),
    iron: T('#26282c', { name: 'lmT-iron' }), lfence: T('#55585e', { map: A.kfence, alphaTest: 0.5, side: 'double', name: 'lmT-lfence' }), glassDark: T('#27323f', { name: 'lmT-glassDark' }),
    // ---- square
    grit: T(C.grit, { map: A.grit, name: 'lmT-grit', paint: 0.05, polygonOffset: -2 }), lawn: T(C.lawn, { map: A.grass, name: 'lmT-lawn', paint: 0.06, polygonOffset: -3 }),
    pavers: T('#b9b6ae', { map: A.pavers, name: 'lmT-pavers', paint: 0.04, polygonOffset: -4 }), hedge: T(C.hedge, { map: A.hedge, name: 'lmT-hedge', paint: 0.1 }),
    chapel: T(C.chapel, { map: A.granitePolished, name: 'lmT-chapel', paint: 0.03 }), chapelLight: T(C.chapelLight, { map: A.granitePolished, name: 'lmT-chapelL', paint: 0.03 }),
    bronzeGreen: T(C.bronzeGreen, { name: 'lmT-bronzeG', paint: 0.03 }), bronzeDark: T('#3a332a', { name: 'lmT-bronzeD', paint: 0.02 }),
    stone: T('#9d9690', { map: A.granitePolished, name: 'lmT-stone', paint: 0.08 }), slab: T('#7c7f84', { map: A.granitePolished, name: 'lmT-slab', paint: 0.03 }),
    benchWood: T(C.bench, { name: 'lmT-benchW', paint: 0.03 }), benchIron: T('#202428', { name: 'lmT-benchI' }), lampBlack: T(C.lampBlack, { name: 'lmT-lampBlack' }),
    lampGlass: T('#f3efe2', { emissive: '#ffe9b0', emissiveIntensity: 0.3, name: 'lmT-lampGlass' }), flowers: T('#d0242e', { name: 'lmT-flowers', paint: 0.1 }),
  });
  M.cutouts = new Set([M.mosqueFence, M.kfence, M.lfence, M.medallion, M.water]);
  M.decals = new Set([M.latticeWin, M.pointedWin, M.postPanel]);
  M.night = night;
  /** a plate with real text: transparent letters (alpha) or a filled plaque */
  const textCache = new Map();
  M.text = (text, o = {}) => {
    const k = text + '|' + JSON.stringify(o); let m = textCache.get(k);
    if (!m) { m = T(W, { map: A.text(text, o), name: 'lmT-text', alphaTest: o.bg ? 0 : 0.4, polygonOffset: -2, paint: 0 }); if (!o.bg) M.cutouts.add(m); else M.decals.add(m); textCache.set(k, m); }
    return m;
  };
  // night: window sheets glow a little with uNight
  for (const m of night) { m.emissive?.set?.('#ffd9a0'); m.emissiveMap = m.map; m.emissiveIntensity = 0; }
  ctx.onUpdate(() => { const n = ctx.shared.uNight ? ctx.shared.uNight.value : 0, k = Math.min(1, Math.max(0, (n - 0.12) / 0.5)) * 0.22; for (const m of night) m.emissiveIntensity = k; });
  return M;
}
