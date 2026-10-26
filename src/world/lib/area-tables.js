// lib/area-tables.js - the engine tables of the AREA MODULE (docs/AREAS.md section 3), with every table or key that an area leaves out filled by an empty / inert value.
// The area module is src/world/area.js (the strip) or src/areas/<id>/area.js (the page <id>.html remaps the URL of src/world/area.js to it with an import map, tools/lib/area-hooks.mjs does the same
// for the headless tools). The engine modules whose literals used to name places of the strip read their tables HERE, never from area.js directly: a minimal area module (no WATER, no ZONES ...)
// then still boots, and the modules do nothing for what the area does not list. A namespace import is used on purpose: a named import of a table that the area module does not export would be a link error.
// PURE DATA: no three.js, no layout.js (layout.js imports waterways.js, which imports this file).
//   WATER            environment/waterways.js     plugs, bridgeZones, bridgeShades, clipLines, farSources, farCenter, farRadius, forcedBanks, openMouths, dataWater, slopeReaches
//   ZONES            wildlife, people, trams, field, far  pigeons, crowHaunts, crowds, fountains, peopleDensity, peopleCorridor, peopleHot, tramLines, clearDiscs, farCentres
//   GARAGE           drive/cars/index.js, drive.js        poses { coupe, truck, lada, roadster }, spawn
//   PRUNE_SERVICES   environment.js                       the services whose door entrances clear the trees
//   HOOKS, HEIGHT_PATCHES  layout.js, drive/handling.js, environment/trees.js + lawns.js, props/world.js, streets.js + streets/parking.js, people/nav.js
//                                                        the hooks and the height patches of milestone M6 (docs/AREAS.md section 9; the strip's are {} and []: every call site is a no-op without its key).
//                                                        T3 (Tauride remake) added groundHoles (environment/ground.js: rings cut out of the ground mesh) and groundWayReject (environment/field.js: ways the class mask does not paint);
//                                                        T4a waterBodies (environment/field.js) (noLanding was removed: water is reachable, docs/AREAS.md 13.7); T4b duckPonds (wildlife/ducks.js: duck lanes on the ponds of a landmark module).
//                                                        T7 doorServices (people/nav.js: the services whose entrances with a facing are pedestrian doors, besides the city's).
//                                                        T8a deckUnderside (city/roofs.js addDeck: (poly) => boolean, the buildings whose flat deck also gets a down-facing underside because a viewer can stand below it).
//                                                        Only people/nav.js imports HOOKS of the people files (people.js reads the row ZONES.peopleDensity.garden, people/sim.js reads nav.inGarden / nav.gardenCfg).
//                                                        Both are VALIDATED here (checkHooks, checkPatches): a value of the wrong kind is dropped with one console.warn that names it, so that the table of a
//                                                        hand-written area cannot crash the build in an unnamed place. A well-formed table is handed out as it is (the same object / array as the area module's).
import * as A from '../area.js';

const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'an array' : typeof v === 'object' ? 'an object' : typeof v === 'number' ? `the number ${v}` : `a ${typeof v}`);

/** the HOOKS keys that must be functions (the factories of (ctx) and the plain functions); `deckServices` and `doorServices` must be arrays of strings */
const HOOK_FUNCTIONS = ['treeCleared', 'treeReject', 'tuftReject', 'propReject', 'pedestrianOnly', 'parkingReject', 'carKeepOut', 'inGarden', 'groundHoles', 'groundWayReject', 'waterBodies', 'duckPonds', 'deckUnderside'];
/** HOOKS of an area module, checked: every known key is a function (undefined / null = absent), `deckServices` an array of strings; anything else is dropped with one warning naming the key. Unknown keys pass. */
export function checkHooks(raw, warn = console.warn) {
  if (raw != null && obj(raw) !== raw) warn(`[area-tables] HOOKS is ${kind(raw)}, not an object: ignored`);
  const H = obj(raw);
  let out = H;
  const drop = (k, why) => { if (out === H) out = { ...H }; delete out[k]; warn(`[area-tables] HOOKS.${k} ${why}: ignored`); };
  for (const k of HOOK_FUNCTIONS) if (H[k] != null && typeof H[k] !== 'function') drop(k, `is ${kind(H[k])}, not a function`);        // undefined and null mean "none": every call site is null-safe
  if (H.deckServices != null && !(Array.isArray(H.deckServices) && H.deckServices.every((s) => typeof s === 'string'))) drop('deckServices', `is ${kind(H.deckServices)}, not an array of service names`);
  if (H.doorServices != null && !(Array.isArray(H.doorServices) && H.doorServices.every((s) => typeof s === 'string'))) drop('doorServices', `is ${kind(H.doorServices)}, not an array of service names`);
  return out;
}

/** why a HEIGHT_PATCHES entry is unusable, or null: { id: string, box: [x0, x1, z0, z1] (4 finite numbers), at: function } */
const patchProblem = (p) => {
  if (!p || typeof p !== 'object') return `is ${kind(p)}, not an object`;
  if (typeof p.id !== 'string' || !p.id) return 'has no string id';
  if (!Array.isArray(p.box) || p.box.length !== 4 || !p.box.every(Number.isFinite)) return 'has no box of 4 finite numbers';
  if (typeof p.at !== 'function') return 'has no at() function';
  return null;
};
/** HEIGHT_PATCHES of an area module, checked: an entry that is not { id, box[4], at } is skipped with one warning that names its id (or its index). A well-formed list is returned as it is. */
export function checkPatches(raw, warn = console.warn) {
  if (raw != null && !Array.isArray(raw)) warn(`[area-tables] HEIGHT_PATCHES is ${kind(raw)}, not an array: ignored`);
  const list = arr(raw), good = [];
  list.forEach((p, i) => { const why = patchProblem(p); if (why) warn(`[area-tables] HEIGHT_PATCHES[${i}]${p && typeof p.id === 'string' && p.id ? ` "${p.id}"` : ''} ${why}: skipped`); else good.push(p); });
  return good.length === list.length ? list : good;
}
const W = obj(A.WATER), Z = obj(A.ZONES), G = obj(A.GARAGE);

export const WATER = {
  plugs: arr(W.plugs),
  bridgeZones: arr(W.bridgeZones),
  bridgeShades: arr(W.bridgeShades),
  clipLines: arr(W.clipLines),
  farSources: arr(W.farSources),
  /** [x, z] or null: null = the centre of the EXTENT rectangles (environment/waterways.js) */
  farCenter: Array.isArray(W.farCenter) && Number.isFinite(W.farCenter[0]) && Number.isFinite(W.farCenter[1]) ? W.farCenter : null,
  farRadius: Number.isFinite(W.farRadius) ? W.farRadius : 6000,
  forcedBanks: arr(W.forcedBanks),
  openMouths: arr(W.openMouths),
  dataWater: arr(W.dataWater),
  slopeReaches: arr(W.slopeReaches),
  /** { RIVER record name: waterway key } for the RIVER records whose data `key` is null (Admiralty-Haymarket: the Kryukov, Admiralty, Novo-Admiralty and New Holland canals) */
  keyByName: obj(W.keyByName),
};

export const ZONES = {
  pigeons: arr(Z.pigeons),
  crowHaunts: arr(Z.crowHaunts),
  crowds: obj(Z.crowds),
  fountains: arr(Z.fountains),
  peopleDensity: obj(Z.peopleDensity),
  peopleCorridor: arr(Z.peopleCorridor),
  peopleHot: arr(Z.peopleHot),
  tramLines: arr(Z.tramLines),
  clearDiscs: arr(Z.clearDiscs),
  farCentres: arr(Z.farCentres),
};

export const GARAGE = {
  poses: obj(G.poses),
  /** { x, z, yaw } or null */
  spawn: G.spawn && Number.isFinite(G.spawn.x) && Number.isFinite(G.spawn.z) ? G.spawn : null,
};

/** the keys of the sub-groups of the area's GROUPS.bridges (= the ids of the bridge sites of bridges/sites.js that the area claims; the strip lists every site, a smaller area a subset, an area without a bridges module none) */
export const BRIDGE_GROUP_KEYS = new Set(arr(obj(A.GROUPS).bridges).map((g) => g && g.key));

export const PRUNE_SERVICES = arr(A.PRUNE_SERVICES);
export const HOOKS = checkHooks(A.HOOKS);
export const HEIGHT_PATCHES = checkPatches(A.HEIGHT_PATCHES);
