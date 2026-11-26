// Toon (三渲二) material library. All modules should get materials from here so the
// look stays consistent and identical materials are shared (=> static batching works).
import * as THREE from 'three';
import { createFacadeFactory } from './facade.js';

export const LAYER_NO_OUTLINE = 1;

// Named palette (sRGB hex). Use these first; add local accents sparingly. Saint Petersburg, July (docs/LOOK.md lists every key, its value and where it is used).
// Every key of the Yakutsk / Moscow palette is kept (the code copied from the siblings reads them) but re-pointed at Petersburg values; the legacy tree keys
// (birch, lindenGold, mapleOrange, mapleRed) hold July greens (birch / lime / Norway maple / poplar): never autumn colours. The Petersburg keys are in the groups marked "pb".
export const PALETTE = {
  // sky (clear July afternoon; the live values come from core/timeofday.js)
  skyTop: '#2c6cc4', skyMid: '#5a92d4', skyHorizon: '#b0cae6',
  // facade pastels (legacy keys, Petersburg-tuned) / stone / paving / asphalt
  cream: '#e8dcc4', offWhite: '#ece7dc', beige: '#d6c29a', plaster: '#e3d6bc', paleBlue: '#9fb4c2', paleGreen: '#b8d4bc', paleYellow: '#e6d28f',
  lightGrayTile: '#bdb8b2', concrete: '#aeaaa3', concreteDark: '#8d8a85', platform: '#b7b2aa', granite: '#8b8783', graniteLight: '#a99b95', graniteDark: '#5b5a58', pink_granite: '#b0897e',
  asphalt: '#5a5e61', asphaltDark: '#3f4448', asphaltLight: '#7a7f7f',
  lineWhite: '#f0efe9', lineOrange: '#e9a23b', lineYellow: '#e8c32a',
  woodDark: '#5a4032', wood: '#8a6446', woodLight: '#b48a62',
  roofDark: '#3c3a3b', roofBlue: '#56677a', roofGreen: '#5a7a63', roofBrown: '#8b4a3d', metalRoof: '#9ba0a3',
  frameDark: '#3f4247', frameBrown: '#5e4636', steel: '#9aa1a8', steelDark: '#6d747c', rust: '#8a5a44',
  ballast: '#6c6c6e', ballastDark: '#555558', ballastWarm: '#7b7570', sleeper: '#b9b7b0', railSide: '#6b5648', railTop: '#b8bcc0',
  // vegetation (July: lime, maple, poplar, birch, lawn; lit / mid / shade from docs/research/streets.md section 6)
  grass: '#6f9a36', grassDark: '#3f6a22', grassLight: '#86ac45', leafYoung: '#8dbf55', shrub: '#4f7a2e', moss: '#6f8f4a', soil: '#7a6a52',
  birch: '#5f8a3a', lindenGold: '#6a9a3e', mapleOrange: '#5e9a35', mapleRed: '#3f6b2a', spruce: '#3f6b66',
  // glass families (the glass-and-steel infill buildings, office blocks, the station light hall)
  glassTeal: '#3f6c86', glassBlue: '#3a6aa6', glassBronze: '#7a5a48', glassGreen: '#3f7a6c', glassSilver: '#8ea3b3',
  signBlue: '#2f64b5', signRed: '#d9463b', signYellow: '#f2c230', signGreen: '#3f8f5b',
  trainWhite: '#eef0f2', trainGray: '#8e959d', trainRed: '#b3162a', trainDark: '#3b3f47', mccGreen: '#4c7a46',
  lampWarm: '#ffd9a0', lampCool: '#e8f4ff',
  ink: '#33384a', // outline / darkest line colour: never use pure black

  // ---- legacy additions (Yakutsk keys, kept; Petersburg values) ---------------------------------------------------------------------
  // panel facades (the Soviet blocks of Ligovsky / Vosstaniya st.) and masonry
  panelCream: '#e8dcc0', panelYellow: '#e3d29a', panelSalmon: '#e8c3bb', panelBlue: '#a9c2d9', panelMint: '#b7d1b0', panelWhite: '#ebebeb', panelPink: '#d9a8a0', panelGrey: '#b9b6b0',
  tanBrick: '#c9a97f', brickRed: '#a0503f', brickDark: '#7a3a30', plinth: '#3a3433',
  // wood, trim, roofs
  logOrange: '#b5683a', logDark: '#8f3b2d', logGrey: '#7a6a58', trimWhite: '#f1ece0',
  roofBitumen: '#3b3d42', roofMaroon: '#8e2f3a', roofGreenMetal: '#5a7a63', roofGrey: '#7b8691',
  // ground
  sand: '#b9a98a', sandLight: '#c0bab6', dust: '#c8c3b8', pavementPink: '#a99b95', pavingGrey: '#9b9a95', pavingAnthracite: '#5d5f62', pavingCream: '#b5ada2', pavingPink: '#a88f88',
  bedSoil: '#3a2f28', kerbWhite: '#f0ede6', bollard: '#9c9a96',
  // lawns (July green; the Yakutsk "straw" keys now hold lawn greens)
  lawnStraw: '#6f9a36', lawnStrawLit: '#86ac45', lawnStrawDark: '#4a7226', lawnPatch: '#7a9a3a', wildGrass: '#5a7c36', wildGrassLit: '#7e9d52',
  lawnShow: '#5f8f2a', lawnShowLit: '#7eae3a', lawnShowDark: '#3a6a1e',
  // trees: lit / mid / shade
  birchLit: '#8fae5c', birchMid: '#5f8a3a', birchShade: '#3f5a28', birchBark: '#d9d4c7', birchMark: '#2a2a2a',
  spruceLit: '#4d7d76', spruceMid: '#3f6b66', spruceShade: '#1e3b32', spruceTip: '#6f9a8d', spruceTrunk: '#4a3a2e',
  willowLit: '#aac582', willowMid: '#7f9a5e', willowShade: '#55703d', willowTwig: '#8a7a4a',
  poplarLit: '#7fae4b', poplarMid: '#3f6b2a', poplarShade: '#2a4a1e', poplarBark: '#8c8a7c',
  pineLit: '#8fae62', pineMid: '#6f8f4a', pineShade: '#465636', pineBark: '#b5683a',
  larchLit: '#86ac55', larchMid: '#6f9a45', larchShade: '#4a7033', larchBark: '#7a6a58',
  shrubLit: '#7da85a', shrubMid: '#5f8a3f', shrubShade: '#3f6a30',
  // flowers
  marigoldOrange: '#f08a1c', marigoldYellow: '#f2c21a', petuniaViolet: '#7c4fa0', petuniaWhite: '#f5f1f0', petuniaMagenta: '#c63d8e', salviaRed: '#d0242e', roseWild: '#d8679f', dandelion: '#e8c21a',
  // legacy Sakha keys (unused in Petersburg, kept so copied code keeps working); streetPlate is the Petersburg navy plate
  sakhaBlue: '#2a7fc4', sakhaWhite: '#f4f4f0', sakhaRed: '#d2312f', sakhaGreen: '#2a9a4a', streetPlate: '#1c2a5a',
  tvTowerRed: '#c8392f', tvTowerWhite: '#f1efe9', craneYellow: '#e8a73a',
  // far field (hazed values: the fog does the rest): the roofline of the rest of the city, suburban green, the Neva
  taiga: '#4f6a45', taigaHaze: '#7a8a9a', ridge: '#7b8798', lenaWater: '#4e6f94', lenaBank: '#5c5b57', farHaze: '#a9bfd8',
  // snow (kept for a later winter variant)
  snow: '#f0f4f8', snowShade: '#9fa4ad', snowDirty: '#a2a4aa',

  // ================= Saint Petersburg (pb) =====================================================================================================
  // pb stucco field colours (docs/research/architecture.md section D, nevsky.md facade tables): sunlit ~ x1.05, shade is blue-grey. Trim is trimCream / trimWhite.
  stuccoOchre: '#dbb060', stuccoPaleYellow: '#e6d28f', stuccoTerracotta: '#c56e4c', stuccoSalmon: '#dca08f', stuccoDustyRose: '#d9a99a', stuccoRose: '#d98a82',
  stuccoMint: '#b8d4bc', stuccoGreyGreen: '#a9b8a1', stuccoPeach: '#e9b896', stuccoSand: '#d6c29a', stuccoOrange: '#dea060', stuccoOrangeBrown: '#c98b5f',
  stuccoGreyOlive: '#c9c7a8', stuccoOliveYellow: '#c7bf7a', stuccoPaleBlue: '#9fb4c2', stuccoGreyBlue: '#aab2c0', stuccoGreyLilac: '#b7ada8', stuccoCoral: '#d98671',
  stuccoWhite: '#e3e0d6', stuccoSoot: '#6e6760', stuccoBrick: '#a8573f',
  trimCream: '#e8dcc4', trimWarmWhite: '#f1ece0', corniceShade: '#bda98a', rusticShade: '#b09c80', stainBrown: '#a8957a',
  // pb windows, doors, shopfronts
  windowFrameBrown: '#6a4a35', windowFrameWhite: '#f0efe9', windowFrameGreen: '#4d5a52', windowGlass: '#2e3c46', windowSkyGlass: '#6fa3d4', windowDark: '#2a3140',
  doorBrown: '#4a2f26', doorStation: '#7a4f2b', doorMetro: '#8c5a32', gateDark: '#2a2622',
  awningRed: '#8c1d2e', awningRedValance: '#6d1523', awningGreen: '#2f5d3a', awningCream: '#e8dcc4', shutterBrown: '#5a3b2c',
  signBandDark: '#2c2622', signBandCream: '#ece3cc', signRedFascia: '#c8202a', signOrangeFascia: '#f28c00', signGreenFascia: '#1d8f4c', signBlueFascia: '#1b4fa8',
  pharmacyGreen: '#2fb35a', trafficBlue: '#1a58a8', signFluor: '#c4dc1c', signRedDisc: '#d3232a', priorityYellow: '#f2c230',
  // pb granite (quay, plinths, kerbs, pavements, bridge, obelisk)
  graniteQuay: '#8b8783', graniteQuayPink: '#9a8077', graniteQuayDark: '#5b5a58', graniteCoping: '#a49a95', graniteWaterline: '#4c4f4d',
  granitePavement: '#9b9a95', granitePavementPink: '#a99b95', graniteKerb: '#8c8f92', graniteStrip: '#5d5f62', graniteRedStrip: '#8c6b66',
  graniteRed: '#b98c7e', graniteRedLit: '#cf9d8c', graniteRedDark: '#8e5b43', graniteRedPolished: '#b3685c', granitePylon: '#a89a96', graniteStation: '#8a8b88',
  graniteObelisk: '#7f6e66', graniteObeliskPlinth: '#6a5648', graniteSquare: '#858177', graniteInlay: '#4a3f3a', graniteGuardStone: '#9a8b86', graniteShopPlinth: '#6a3a38',
  // pb asphalt, setts, block paving, manholes, kerb line
  asphaltFresh: '#34383b', asphaltWorn: '#6a6e6f', asphaltPatch: '#2e3b43', asphaltBleach: '#969e9a', asphaltBridge: '#5a5d60',
  sett: '#8a8d8f', settDark: '#6f7377', settBrown: '#7d7a76', pavingBrick: '#8a4f46', courtyardBrick: '#8a5a4a', crushedBrick: '#99765f', stationForecourt: '#b6a89e',
  manhole: '#6b5546', kerbYellow: '#e8c32a', zebraWhite: '#f2f2f0', zebraBrick: '#a14a3a',
  // pb roofs (sheet iron), chimneys, gutters
  roofSheetSilver: '#9ba0a3', roofSheetGreen: '#5a7a63', roofSheetRed: '#8b4a3d', roofSheetGreenBright: '#4d8a5e', roofSlate: '#4a4a52', roofDarkMetal: '#3c3a3b', roofLibrary: '#4a7a4d',
  chimneyBrick: '#b4523c', zinc: '#9a9ea0', downpipeYellow: '#f0a800', downpipeGreen: '#4d8a5e',
  // pb black cast iron, bronze, patina, gilding
  ironBlack: '#1b1f20', ironFontanka: '#202428', ironTealGreen: '#243d38', ironFenceGreen: '#2e5a3d', ironFountainFence: '#25382d', lampGlobe: '#f2efe4', lampLed: '#ffb875', facadeUplight: '#ffc880', shopWindowWarm: '#ffdcb8',
  bronze: '#5a4a36', bronzeDark: '#2f332f', bronzeKlodt: '#33372f', patina: '#56695c', patinaLight: '#6f9079', bridgeGreen: '#4d7b66', bridgeGreenDark: '#3f5a50', gold: '#c9a24b', goldBright: '#e3b53c', goldFinial: '#d4aa3c',
  // pb Moscow Station (Thon, 1851) and the square
  stationSand: '#e3c288', stationSandShade: '#cfa865', stationWhite: '#f3efe4', stationRoof: '#3c3a3b', stationTowerRoof: '#4a4a52', stationLightHallRoof: '#5d6b4c', stationLetters: '#e6e9ed',
  stationWing: '#e0bc7f', stationPlatform: '#55555a', stationPlatformStrip: '#6f6f73', stationMaroon: '#6f1d2b', stationYellowLine: '#f2c500', stationSignGreen: '#4c5a44', stationSignRed: '#c8252c', stationRed: '#c8252c',
  stationHallFloor: '#77746f', stationHallWall: '#b7a98c', stationHallCeiling: '#b8b5ae', stationHallFarWall: '#b8786a',
  metroRotunda: '#e6d49a', metroRotundaShade: '#d9c28a', hotelOktyabrskaya: '#d9bda3', hotelLigovsky: '#b9bec2', obeliskHedge: '#4e7a3a',
  // pb rail (the 11 tracks): ballast / sleepers / rails above; rolling stock
  sapsanWhite: '#f2f4f6', sapsanRed: '#d9452f', sapsanBlue: '#2e5a9e', redArrow: '#b3162a', redArrowSilver: '#b9bec2', rzdRed: '#d2232a', rzdGrey: '#8c8f94', rzdWhite: '#e3e4e6', locoRed: '#d71920', locoStripe: '#d9c530',
  elektrichkaGreen: '#4c7a46', elektrichkaOrange: '#e38b2d',
  // pb road transport
  trolleyBlue: '#1f7fd6', trolleyBlueOld: '#2a74c8', trolleyNavy: '#12304f', trolleyWhite: '#f2f2f2', busTurquoise: '#5fc4b8', busWindow: '#17181a', busWhite: '#f2f2f2',
  taxiWhite: '#f2f1ec', taxiYellow: '#f6c200', cityTourRed: '#d8352a', cityTourPurple: '#3b2f7a', policeBlue: '#1d4fa0', ambulanceRed: '#d8262e', tramRed: '#b52a2a', scooterYellow: '#f6c200',
  carWhite: '#eceae4', carSilver: '#b9bcbf', carGrey: '#5a5e63', carBlack: '#1d1f23', carRed: '#a52a2b', carBlue: '#2c4a86', carBrown: '#6b5a4a', carGreen: '#2c4a3a', carOrange: '#c9622a',
  // pb metro (docs/research/metro.md): line colours, station marbles and fittings, car liveries
  metroRed: '#d6083b', metroBlue: '#0078c9', metroGreen: '#009a49', metroOrange: '#ea7125', metroViolet: '#702785', metroBrown: '#9c5b2a',
  metroM: '#1795d4', metroMDark: '#1f4e9e', metroMGlow: '#36b6ee', metroSignBlue: '#1d4e9b', metroExitGreen: '#0a8f4d', metroTactile: '#f2c500',
  metroMarbleRed: '#8e3a2f', metroPlaster: '#eee7d4', metroCeiling: '#e9e1c9', metroFloorRed: '#9b4f3f', metroGold: '#c9a24b', metroBronze: '#5a4630', metroSkirt: '#181820', metroGrilleNavy: '#1e2a55',
  metroMarbleWhite: '#efeae0', metroMarbleCream: '#d9cdb0', metroSmaltRed: '#b22a1e', metroSmaltOrange: '#d4452a', metroGraniteFloor: '#8a8a86', metroFloorDark: '#5a5a5e', metroFloorPink: '#a9604f',
  metroColumnPink: '#6e5f58', metroLimestone: '#a9a08a', metroLantern: '#1a1a1a', metroSteel: '#b8bcc0', metroEscalatorLight: '#fff2c8',
  metroCarGrey: '#c9cdd0', metroCarRed: '#e4232b', metroCarBlue: '#1e58c8', metroCarTeal: '#3d7ba0', metroCarCream: '#e6d6a8', metroSeatBlue: '#233680', metroSeatBrown: '#5b4a3e', metroSeatPink: '#b3615c',
  // pb street furniture and plates
  streetPlateRim: '#2d4a32', streetPlateText: '#f2f2ee', kioskGreen: '#2f4f43', adPillar: '#2e3236', benchSlat: '#b8793a', binGreen: '#2f5d3a', binGrey: '#6f7377',
  // pb water: the Fontanka / the Neva
  fontankaWater: '#27507f', fontankaWaterShade: '#4a4a37', fontankaWaterRipple: '#7fa8e0', fontankaWaterCloudy: '#4d5f6a', waterFoam: '#e8eef0', nevaWater: '#4e6f94',
  // pb vegetation (July): small-leaved lime, Norway maple (ball crowns on Vosstaniya Sq), oak, balsam poplar, chestnut, clipped hedges
  limeLit: '#86b04a', limeMid: '#4f7a2e', limeShade: '#2d4a22', limeHighlight: '#b5c860', limeBark: '#3d3328',
  mapleLit: '#8fbf55', mapleMid: '#5e9a35', mapleShade: '#3a6a26', mapleBall: '#5fae3a',
  oakLit: '#7a9a42', oakMid: '#4a6e2c', oakShade: '#2c4720', oakBark: '#3d3328',
  poplarUnder: '#8aa68a', chestnutMid: '#3f6a3f', hedgeBox: '#4e7a3a', hedgePrivet: '#3f6a30', creeperRed: '#a8322a', ivyGreen: '#3a6a30',
  lawn: '#5f8f2a', lawnLit: '#7aa83a', lawnDark: '#3f6a22', lawnDry: '#7a9a3a',
  petuniaPink: '#e0457b', petuniaLightPink: '#f08cb4', geraniumRed: '#d0242e', lobeliaBlue: '#5a6fd0',
  // pb scaffolding / works
  scaffoldNet: '#2f6b3d', worksOrange: '#e8692a', galleryGreen: '#3f7a52',
};

function makeGradientMap() {
  // 16 texels over dotNL in [-1,1]. Back-facing -> 0 (shadow, ambient only),
  // grazing band -> soft mid tone, lit -> full. Gives crisp anime light/shadow split.
  const n = 16, data = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const dotNL = (i + 0.5) / n * 2 - 1;
    let v;
    if (dotNL < 0.0) v = 0.0;
    else if (dotNL < 0.12) v = 0.42;
    else if (dotNL < 0.42) v = 0.8;
    else v = 1.0;
    data[i] = Math.round(v * 255);
  }
  const tex = new THREE.DataTexture(data, n, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter; tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}

const NOISE_GLSL = /* glsl */`
float pn_hash(vec3 p){ p = fract(p*0.3183099+vec3(0.1,0.2,0.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float pn_noise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(pn_hash(i+vec3(0,0,0)),pn_hash(i+vec3(1,0,0)),f.x),mix(pn_hash(i+vec3(0,1,0)),pn_hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(pn_hash(i+vec3(0,0,1)),pn_hash(i+vec3(1,0,1)),f.x),mix(pn_hash(i+vec3(0,1,1)),pn_hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float paintNoise(vec3 p){ return (pn_noise(p*0.45)*0.6 + pn_noise(p*1.9+11.0)*0.4) * 2.0 - 1.0; }
`;

/** Adds world-space hand-painted colour variation (+ optional ground grime) to a built-in material. vpaint: the amount comes from the vertex attribute aPaint (normalized
 *  Uint8, amount = aPaint * VPAINT_SCALE) instead of the uniform, so merged meshes of many paint amounts share ONE material (core/batch2.js: 343 materials in view became far fewer). */
export const VPAINT_SCALE = 0.25;
function patchPaint(material, amount, grime, vpaint = false) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPaint = { value: amount };
    shader.uniforms.uGrime = { value: grime };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPWorld;' + (vpaint ? '\nattribute float aPaint; varying float vPaint;' : ''))
      .replace('#include <fog_vertex>', `#include <fog_vertex>
        { vec4 pw = vec4(transformed, 1.0);
          #ifdef USE_BATCHING
            pw = batchingMatrix * pw;
          #endif
          #ifdef USE_INSTANCING
            pw = instanceMatrix * pw;
          #endif
          vPWorld = (modelMatrix * pw).xyz; ${vpaint ? `vPaint = aPaint * ${VPAINT_SCALE.toFixed(3)};` : ''} }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPWorld;\nuniform float uPaint;\nuniform float uGrime;\n' + (vpaint ? 'varying float vPaint;\n' : '') + NOISE_GLSL)
      .replace('#include <map_fragment>', `#include <map_fragment>
        { float pn = paintNoise(vPWorld); float pa = ${vpaint ? 'vPaint' : 'uPaint'};
          diffuseColor.rgb *= 1.0 + pa * pn;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(0.93,0.93,0.97), pa*2.0*clamp(pn*1.5,0.0,1.0)); }`);
  };
  material.customProgramCacheKey = () => (vpaint ? 'paintv' : 'paint');
}

/** Stable cache key for material options. Never JSON.stringify a Texture (its toJSON would serialise the whole canvas to a data URL). */
function optsKey(opts) {
  let out = '';
  for (const k of Object.keys(opts || {}).sort()) {
    const v = opts[k];
    out += k + ':' + (v && v.isTexture ? v.uuid : v && v.isColor ? v.getHexString() : JSON.stringify(v)) + ';';
  }
  return out;
}

export function createMaterials(shared) {
  const gradientMap = makeGradientMap();
  const cache = new Map();
  const color = (c) => (c instanceof THREE.Color ? c : new THREE.Color(c));

  /** Main cel-shaded material. color: hex/Color. opts:
   *  map, alphaMap, alphaTest, transparent, opacity, side ('front'|'back'|'double'), vertexColors,
   *  emissive, emissiveIntensity, paint (0..0.15 hand-painted variation, default 0.05),
   *  polygonOffset (number: factor, negative pulls toward camera), depthWrite, name, flatShading */
  function toon(c = '#ffffff', opts = {}) {
    const key = 'toon|' + color(c).getHexString() + '|' + optsKey(opts);
    if (cache.has(key)) return cache.get(key);
    const m = new THREE.MeshToonMaterial({
      color: color(c),
      gradientMap,
      map: opts.map || null,
      alphaMap: opts.alphaMap || null,
      alphaTest: opts.alphaTest || 0,
      transparent: !!opts.transparent,
      opacity: opts.opacity ?? 1,
      vertexColors: !!opts.vertexColors,
      emissive: opts.emissive ? color(opts.emissive) : new THREE.Color(0),
      emissiveIntensity: opts.emissiveIntensity ?? 1,
      side: opts.side === 'double' ? THREE.DoubleSide : opts.side === 'back' ? THREE.BackSide : THREE.FrontSide,
      depthWrite: opts.depthWrite ?? true,
      name: opts.name || '',
    });
    if (opts.polygonOffset) { m.polygonOffset = true; m.polygonOffsetFactor = opts.polygonOffset; m.polygonOffsetUnits = opts.polygonOffset * 2; }
    patchPaint(m, opts.paint ?? 0.05, opts.grime ?? 0, !!opts.vpaint);
    m.userData.toon = { paint: opts.paint ?? 0.05, grime: opts.grime ?? 0, polygonOffset: opts.polygonOffset || 0, vpaint: !!opts.vpaint };
    Object.defineProperty(m.userData.toon, 'obc', { value: m.onBeforeCompile, enumerable: false });
    if (shared.season === 'winter' && /^(pt-(slab|paver|strip|kerb|area|foot)|sq-paving|lmG-pave)|[-_]roof$/i.test(m.name)) {
      const paint = m.onBeforeCompile;
      m.onBeforeCompile = (shader, renderer) => {
        paint.call(m, shader, renderer);
        shader.fragmentShader = shader.fragmentShader.replace('#include <alphamap_fragment>', `
          #include <alphamap_fragment>
          float drift = pn_noise(vPWorld * 0.24) * 0.68 + pn_noise(vPWorld * 1.5) * 0.32;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.72,0.79,0.84), smoothstep(0.27,0.62,drift) * 0.88);
        `);
      };
      m.customProgramCacheKey = () => 'snow-covered-paint';
    }
    cache.set(key, m);
    return m;
  }

  /** Decal on top of a surface (road markings, posters, stains). Pulls toward the camera
   *  with polygonOffset; still place it 3–10 mm off the surface. */
  function decal(c = '#ffffff', opts = {}) {
    return toon(c, { transparent: opts.map || opts.alphaMap ? true : !!opts.transparent, depthWrite: false, polygonOffset: -2, paint: 0.02, ...opts });
  }

  /** Unlit / self-lit material (screens, lamps, lit signs, interior glow). intensity > 1 blooms. */
  function emissive(c = '#ffffff', intensity = 1.6, opts = {}) {
    const key = 'emi|' + color(c).getHexString() + '|' + intensity + '|' + optsKey(opts);
    if (cache.has(key)) return cache.get(key);
    const m = new THREE.MeshBasicMaterial({
      color: color(c).multiplyScalar(intensity), map: opts.map || null, transparent: !!opts.transparent,
      opacity: opts.opacity ?? 1, alphaTest: opts.alphaTest || 0, side: opts.side === 'double' ? THREE.DoubleSide : THREE.FrontSide,
      depthWrite: opts.depthWrite ?? true, toneMapped: false, fog: opts.fog ?? true,
    });
    cache.set(key, m);
    return m;
  }

  /** Anime-style glass: blue-grey sky reflection, fresnel, two diagonal highlight streaks,
   *  lets a dim interior show through. opts: tint, opacity (0.15..0.7), streaks (bool), frost (bool: 磨砂) */
  function glass(opts = {}) {
    const key = 'glass|' + JSON.stringify(opts);
    if (cache.has(key)) return cache.get(key);
    const m = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        uTint: { value: color(opts.tint || '#9fb6c8') },
        uSkyTop: { value: color(PALETTE.skyMid) },
        uSkyLow: { value: color('#e9eef2') },
        uOpacity: { value: opts.opacity ?? 0.42 },
        uStreaks: { value: opts.streaks === false ? 0 : 1 },
        uFrost: { value: opts.frost ? 1 : 0 },
      }]),
      vertexShader: /* glsl */`
        #include <common>
        #include <fog_pars_vertex>
        varying vec3 vW; varying vec3 vN;
        void main(){
          vec3 transformed = position;
          vec4 wp = vec4(transformed,1.0);
          #ifdef USE_INSTANCING
            wp = instanceMatrix * wp;
          #endif
          wp = modelMatrix * wp; vW = wp.xyz;
          vec3 n = normal;
          #ifdef USE_INSTANCING
            n = mat3(instanceMatrix) * n;
          #endif
          vN = normalize(mat3(modelMatrix) * n);
          vec4 mvPosition = viewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        #include <common>
        #include <fog_pars_fragment>
        uniform vec3 uTint; uniform vec3 uSkyTop; uniform vec3 uSkyLow; uniform float uOpacity; uniform float uStreaks; uniform float uFrost;
        varying vec3 vW; varying vec3 vN;
        void main(){
          vec3 V = normalize(cameraPosition - vW);
          vec3 N = normalize(vN); if (dot(N,V) < 0.0) N = -N;
          float fres = pow(1.0 - clamp(dot(N,V),0.0,1.0), 3.0);
          vec3 R = reflect(-V, N);
          vec3 sky = mix(uSkyLow, uSkyTop, smoothstep(-0.1, 0.6, R.y));
          vec3 col = mix(uTint * 0.55, sky, 0.35 + 0.45 * fres);
          // diagonal highlight streaks, world-anchored on the pane
          float s = dot(vW, normalize(vec3(0.62, 0.78, 0.62))) * 0.9;
          float band = abs(fract(s * 0.5) - 0.5);
          float streak = (smoothstep(0.035, 0.0, abs(band - 0.18)) * 0.9 + smoothstep(0.012, 0.0, abs(band - 0.25)) * 0.6) * uStreaks;
          col += vec3(1.0) * streak * 0.55;
          float a = uOpacity + fres * 0.35 + streak * 0.35;
          col = mix(col, vec3(0.86,0.9,0.92), uFrost * 0.7); a = mix(a, 0.88, uFrost);
          gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
          #include <fog_fragment>
        }`,
      transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
    });
    if (shared.uSkyMid) { m.uniforms.uSkyTop = shared.uSkyMid; m.uniforms.uSkyLow = shared.uSkyLow; }   // follow the time of day
    cache.set(key, m);
    return m;
  }

  /** Material for vegetation cards / cut-outs (alpha tested, double sided). Put these meshes on
   *  LAYER_NO_OUTLINE (ctx.noOutline(mesh)) — the outline pass cannot see alpha cut-outs. */
  function foliage(c = '#ffffff', map, opts = {}) {
    return toon(c, { map, alphaTest: 0.5, side: 'double', paint: 0.04, ...opts });
  }

  const facade = createFacadeFactory(shared, PALETTE);

  return { toon, decal, emissive, glass, foliage, facade, gradientMap, palette: PALETTE, color, cache, shared };
}
