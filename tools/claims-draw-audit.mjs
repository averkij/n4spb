// CPU draw audit of the landmark claims of an area (docs/AREAS.md section 5; closes the gap of 8.7 "the completeness of the claims is proven by id, not by geometry").
//   node tools/claims-draw-audit.mjs [--mutant unclaim:<id>[,<id>] | undraw:<id> | citydraw:<id>] [--loose-rule1] [--modules a,b] [--inset 1] [--deep 1.5] [--above 1.5] [--min-unclaimed 50] [--where <id>[,<id>]] [--verbose]   (the strip)
//   node tools/area.mjs north tools/claims-draw-audit.mjs ...                                                                                                                  (another area: the loader remap of section 2)
// Builds the static modules of the page's MODULES list on the CPU exactly as tools/check.mjs does (DOM stubs, no GPU; ctx.buildList is the FULL page list, so lib/claims.js owns what the
// browser owns; the dynamic modules of tools/modules-list.mjs DYNAMIC are left out), takes the centroid of every triangle each module adds to the scene (an InstancedMesh: every instance,
// or its origin when the product count is huge) and tests them against the FOOTPRINT of every claimed object and of every building of the data facade:
//   * a building / area / water polygon: inside the outer ring and outside its holes, optionally shrunk by an inset (so a neighbour's shared wall, cornice or sign does not count);
//   * a way (ROADS / STEPS / ...): within half its width of the polyline (a one-vertex way: a 2.5 m disc);  * a point (monument, bench ...): a 2.5 m disc.
// Asserts:
//   1. OWNER DRAWS: the module whose sub-group claims the id (when it is in the list and owns the sub-group) draws the building ITSELF. Graded like rule 3 since M7 polish (the first version
//      counted every centroid inside the footprint, at any height, and was fooled by a tree or a lamp whose centroid happened to fall in it, by a neighbour's cornice overhanging the shared
//      outline and by a floor): a centroid counts for the claimed BUILDING only when it is (a) not foliage (a mesh whose name chain says tree / trunk / foliage / hedge / lilac ...: FOLIAGE_RE),
//      (b) higher than --above m and deeper than --inset m inside the footprint (the band rules 2 and 3 use; for a small building both scale down with its size: the inset to 0.3 x the deepest
//      point of the footprint, the height to 0.4 x its mapped height, so a 5 m2 kiosk or a 1.2 m flight of steps is not graded by the band of a house), and (c) not nearer the heart of ANOTHER
//      building: when the centroid lies in the footprint of a building of another claim group (or an unclaimed one) deeper than in this one, it belongs to that neighbour (overlapping outlines of
//      the data, a neighbour's wall inside the shared outline). Red for a claimed BUILDING with no such centroid (a hole in the scene, however many trees stand in it). A PART of a claimed building
//      (rec.part / a parent) without a centroid of its own is covered by its parent when the parent has one (the owner draws the wall on the shared outline: a NOTE). A warning for a claimed point,
//      a tiny building part (< 5 m2: no centroid can land in it), a way or a lawn / wood polygon (a claim that keeps the generic modules off it: the castle's footways, the garden benches a later
//      phase draws), which keep the loose count. --loose-rule1 grades the buildings the old way (to see what the old rule let through). OWNER_SKIPS lists the records an owner skips on purpose.
//      Mutants of this rule: `--mutant undraw:<id>` removes the owner's OWN centroids (rule 1 (a)-(c)) of the claimed building from the audit's view while its foliage, slivers and the neighbour's
//      overhang stay (the building drawn by nobody, or by the neighbour next to it): the audit must go red, and with --loose-rule1 it does not (the proof that the old rule was fooled);
//      `--mutant citydraw:<id>` moves those centroids to `city` (the claimed building drawn by the generic module instead of its owner): red by rule 1 and rule 2.
//   2. GENERIC DRAWS NOTHING of a claimed BUILDING: `city`, `streets` and `props` have no triangle centroid higher than --above m inside the polygon shrunk by --inset m that is not also inside
//      an UNCLAIMED building (inset 0: the data has overlapping outlines, OVERLAPS). The inset is what makes the test honest: a neighbour's cornice, balcony or name plate overhangs the shared
//      outline by up to a metre, a blockout of the claimed building has walls and a roof deep inside it. Claimed polygons that are not buildings (a park, a paving area, a pond) and claimed ways
//      are REPORTED, not graded: the streets module lays the pavement of the street along the garden's boundary footway and the service lane through the park, which is its own record and
//      no blockout of the claim.
//   3. NOBODY BUT THE GENERIC MODULES DRAWS AN UNCLAIMED BUILDING: no landmark module has >= --min-unclaimed triangle centroids higher than --above m deeper than --deep m inside an unclaimed
//      building polygon (a floor, a deck or a lawn a landmark module lays under its neighbours lies below --above; an ornament reaching over the outline lies within --deep). A mutant (an id
//      claimed by nobody while its old owner still draws it) turns red; --mutant unclaim:<id> removes the id from the claim tables of the audit (the modules build as they are), so the red path
//      of the audit itself can be proved:   node tools/area.mjs north tools/claims-draw-audit.mjs --mutant unclaim:r5802451   -> RED: landmarksNorthFull draws the cathedral though nothing claims it.
//      KNOWN_UNCLAIMED lists the unclaimed records a landmark module is known to cover (with the reason); they are printed, not red.
// `environment` (the ground plane covers every footprint), `rail`, `metro` and `bridges` are reported, never graded. --where <id> prints sample centroids (x, y, z, distance to the outline,
// mesh name) per module inside that footprint. Prints one block per module and a RESULT: OK / FAIL line; exit 1 on FAIL.
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- DOM stubs (tools/check.mjs)
class Ctx2D {
  constructor(c) { this.canvas = c; this.font = '10px sans-serif'; }
  measureText(t) { const m = /(\d+(?:\.\d+)?)px/.exec(this.font); const s = m ? Number(m[1]) : 10; return { width: [...String(t)].length * s * 0.92, actualBoundingBoxAscent: s * 0.8, actualBoundingBoxDescent: s * 0.2 }; }
  createLinearGradient() { return { addColorStop() {} }; }
  createRadialGradient() { return { addColorStop() {} }; }
  createConicGradient() { return { addColorStop() {} }; }
  createPattern() { return {}; }
  getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }; }
  createImageData(w, h) { return { data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }; }
  putImageData() {} getTransform() { return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; }
  isPointInPath() { return false; }
  getLineDash() { return []; }
}
const ctxProxy = (c) => new Proxy(new Ctx2D(c), { get(t, k) { if (k in t) return t[k]; return () => {}; }, set(t, k, v) { t[k] = v; return true; } });
class FakeCanvas {
  constructor() { this.width = 300; this.height = 150; this.style = {}; this._ctx = null; }
  getContext(type) { if (type !== '2d') return null; return this._ctx || (this._ctx = ctxProxy(this)); }
  toDataURL() { return 'data:,'; } addEventListener() {} removeEventListener() {}
}
globalThis.window = globalThis;
globalThis.self = globalThis;
const stubEl = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, children: [], textContent: '', innerHTML: '', addEventListener() {}, removeEventListener() {}, appendChild() {}, setAttribute() {}, getAttribute: () => null, querySelector: () => null, querySelectorAll: () => [], remove() {} });
globalThis.document = {
  createElement: (t) => (t === 'canvas' ? new FakeCanvas() : stubEl()),
  createElementNS: (ns, t) => (t === 'canvas' ? new FakeCanvas() : { style: {} }),
  fonts: { load: async () => [] }, body: { appendChild() {} }, head: { appendChild() {} }, addEventListener() {}, getElementById: () => null, querySelector: () => null,
};
globalThis.Image = class { constructor() { this.width = 1; this.height = 1; } addEventListener() {} };
globalThis.HTMLCanvasElement = FakeCanvas; globalThis.OffscreenCanvas = FakeCanvas;
globalThis.requestAnimationFrame = (f) => setTimeout(() => f(Date.now()), 16);
globalThis.addEventListener = () => {};
globalThis.innerWidth = 1280; globalThis.innerHeight = 720; globalThis.devicePixelRatio = 1;
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
globalThis.performance = globalThis.performance || { now: () => Date.now() };

// ---------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const INSET = Number(opt('inset', 1.0)), DEEP = Number(opt('deep', 1.5)), ABOVE = Number(opt('above', 1.5)), MIN_UNCLAIMED = Number(opt('min-unclaimed', 50)), MIN_GENERIC = Number(opt('min-generic', 5)), VERBOSE = argv.includes('--verbose');
const WHERE = new Set(String(opt('where', '')).split(',').filter(Boolean));
const STRICT = argv.includes('--strict');      // review fix: a warning (a claimed point / way / lawn that its owner draws nothing in) fails; the North has 0 warnings today, the strip's 10 are the castle's footways, so the strip does not run it
const mutantIds = new Set(), undrawIds = new Set(), citydrawIds = new Set(), LOOSE_RULE1 = argv.includes('--loose-rule1');
for (const m of String(opt('mutant', '')).split(',').filter(Boolean)) { const [kind, id] = m.split(':'); if (!['unclaim', 'undraw', 'citydraw'].includes(kind) || !id) { console.log(`unknown --mutant "${m}" (unclaim:<id> | undraw:<id> | citydraw:<id>)`); process.exit(2); } (kind === 'unclaim' ? mutantIds : kind === 'undraw' ? undrawIds : citydrawIds).add(id); }
/** a mesh whose name (or an ancestor's) says it is a plant: its centroids are never "the claimed building" (rule 1) */
const FOLIAGE_RE = /tree|trunk|foliage|crown|canopy|leaf|leaves|bush|shrub|hedge|lilac|birch|linden|larch|spruce|reed|grass|tuft|flower|petal|plant|vine|ivy|moss/i;
const AREA = process.env.AREA || 'strip';
const GENERIC = ['city', 'streets', 'props'];                   // graded: must draw nothing of a claimed building
const REPORTED = ['environment', 'rail', 'metro', 'bridges'];   // reported only (the ground plane / tracks / decks cover footprints by design)
const DISC_R = 2.5, MIN_AREA = 5;      // m2: a claimed building part smaller than this is graded like a point
/** claimed records an owner skips on purpose (never graded as "owner draws nothing"); keyed by area then id, the value is the reason (docs/AREAS.md) */
const OWNER_SKIPS = {
  north: { w30198549: 'landmarksSuvorov skips the folly on purpose (docs/AREAS.md 8.3)' },
  smolny: { w30198549: 'landmarksSuvorov skips the folly on purpose (docs/AREAS.md 8.3; the same module as the North)' },
  strip: {},
  palace: {},      // checked at 320efb6: every claimed record of the owners that are drawn is drawn; the NOT-drawn ones are warnings (the castle's lines, the Summer Garden's lawns, a point), none is an owner skip
  smolny: {},      // same: only a warning (the station's point n21596808)
  admiralty: {},      // checked at the first run: every claimed record of the owners that are drawn is drawn; the NOT-drawn ones are warnings (two lawns of the Alexander Garden w1252216144 / w1252216153 in landmarksH, one lawn of the Teatralnaya gardens w1287359790), none is an owner skip
};
/** posts of a GENERIC module (streets lamps / kerb masts) that stand inside the outline of a claimed building (printed as a note, not red); keyed by area then 'id|module': the reason. These are placements along the kerb
 *  runs of a way whose arc length starts at the edge of THIS territory (the lamp / mast phase differs per area), so the same building is clean in the other areas; the post stands in the wall mass of the facade the owner draws. */
const GENERIC_WAIVERS = {
  vladimirsky: {
    'r15081493|streets': 'a kerb mast of the Nevsky overhead wire (pt-poles, 9.7 m) stands 4.8 m inside the outline of the Nevsky Atrium at its north-east corner (193.7, 92.5): hidden in the wall mass; the lamp / mast phase along Nevsky differs from Palace-Liteyny, where the same building is clean',
    'r6147391|streets': 'street lamps (lamps-D) of the Lavra internal roads stand 1 .. 1.3 m inside the outline of the Metropolitan Corps wing (1950, 1188): hidden in the wall mass of the wing landmarksEast draws',
    'r6147392|streets': 'street lamps (lamps-D) of the Lavra internal roads stand up to 3.4 m inside the outline of the Metropolitan Corps (1904, 1207): the lamp phase of the Lavra roads; hidden in the wall mass of the wing landmarksEast draws (Smolninskoye leaves the wings to the city module)',
  },
};
/** unclaimed buildings a landmark module is known to cover (printed, not red); keyed by area then id: { module, why } */
const KNOWN_UNCLAIMED = {
  smolny: {
    w102153010: { module: 'landmarksTauride', why: 'the raised court deck of the Paradny quarter (paradny-courts) covers Kirochnaya 35, drawn by city: the same documented source behaviour as in the North (docs/AREAS.md 8.9)' },
  },
  north: {
    w102153010: { module: 'landmarksTauride', why: 'the raised court deck of the Paradny quarter (paradny-courts, y 3.3) covers Kirochnaya 35 (h 6.6, not one of the 11 claimed buildings of T1, drawn by city): the verbatim source behaviour, docs/AREAS.md 8.9' },
  },
  smolny: {
    // the same module and data as the north: checked at 320efb6 with --where (the centroids are 'paradny-courts' at y 3.3, 1..4 m inside the outline), docs/AREAS.md 8.9 and 13
    w102153010: { module: 'landmarksTauride', why: 'the raised court deck of the Paradny quarter (paradny-courts, y 3.3) covers Kirochnaya 35 (h 6.6, not one of the 11 claimed buildings of T1, drawn by city): the verbatim source behaviour, as in the north (docs/AREAS.md 8.9)' },
  },
  palace: {
    // checked at 320efb6 with --where; both are visual notes, not double draws of a claimed building. They are listed so that the audit prints them; a claim or a fix by the owner turns the note off
    w30353981: { module: 'landmarksK', why: 'the Winkler fence piers of the Mikhailovsky garden (landmarksK/fence.js winklerRun) run along and through the OSM outline of the Marso Polo restaurant (Griboedov quay 2v, h 3.3), which city draws: a fence, not a second building (same module and data as the strip)' },
    w93445471: { module: 'northBridges', why: 'the Liteyny Bridge (module northBridges, a verbatim port; 36 m wide deck, x -150 .. -114) clips the west corner of Shpalernaya 22 (h 9.9, bbox x -115 .. -87, z -1928 .. -1869) along its ramp edge (centroids y 0.5 .. 2 m and above, up to about 2 m inside the outline): the OSM outline overlaps the modelled carriageway, city draws the house. A real, small clip (docs/AREAS.md 13), not a second building' },
    w93452391: { module: 'northBridges', why: 'the Liteyny Bridge deck clips the east corner of Liteyny 1/20 (h 9.9, bbox x -231 .. -146, z -1916 .. -1862) along its ramp edge (y about 0 .. 2 m and above, up to about 4 m inside the outline): the same overlap of the OSM outline and the modelled carriageway. A real, small clip, not a second building' },
  },
  admiralty: {
    // St Isaac's Square: the same module and the same data as the strip (landmarksJ/houses.js draws its own house walls on the outline of Bolshaya Morskaya 37 and its parts, which city draws too): the strip's finding of M7, unchanged
    r1251285: { module: 'landmarksJ', why: 'landmarksJ/houses.js draws its own house walls on the outline of Bolshaya Morskaya 37 (r1251285, skip: 1, and its parts w232367033 / w232367034, which city draws): the M7 finding of the strip, the same module and data in Admiralty-Haymarket' },
    w232367033: { module: 'landmarksJ', why: 'part of r1251285, see above' },
    w232367034: { module: 'landmarksJ', why: 'part of r1251285, see above' },
  },
  strip: {
    // findings of the first run (M7): pre-existing conditions of the strip, listed here so that the audit prints them as notes; a claim (or a removal) by the owner turns the note off
    w30353981: { module: 'landmarksK', why: 'the Winkler fence piers of the Mikhailovsky garden (landmarksK/fence.js winklerRun) run along and through the OSM outline of the Marso Polo restaurant (Griboedov quay 2v, h 3.3), which city draws: a fence, not a second building' },
    r1251285: { module: 'landmarksJ', why: 'landmarksJ/houses.js draws its own house walls on the outline of Bolshaya Morskaya 37 (r1251285, skip: 1, and its parts w232367033 / w232367034, which city draws): a possible double draw at St Isaac\'s Square, to be claimed by landmarksJ or left to city (finding of M7)' },
    w232367033: { module: 'landmarksJ', why: 'part of r1251285, see above' },
    w232367034: { module: 'landmarksJ', why: 'part of r1251285, see above' },
  },
};
// Vasilyevsky-Okrug 7, cluster M2 (docs/vo-m2.md); the rows are added with Object.assign so that the clusters of the other ports merge without a conflict
Object.assign(OWNER_SKIPS.vasilyevsky ||= {}, {
  w216655313: 'landmarksMakarova draws the bell frame of St Catherine (a 2.6 m frame of 12 cm steel posts and thin rails, 41 m2) with its triangle centroids within 1 m of the outline or under the 1.5 m band: nothing of it counts as the building, but it is drawn on the footprint (catherine.js bellFrame; the claim keeps the generic city from drawing a solid block there)',
  w82802180: 'landmarksNavalCorps claims the 42 m2 shed in courtyard H2 of the Naval Cadet Corps on purpose (the source project removes it from the generic city and draws nothing in its place: groups.js note)',
});
Object.assign(KNOWN_UNCLAIMED.vasilyevsky ||= {}, {
  r4164970: { module: 'landmarksNavalCorps', why: 'the outline of the Optina compound (Lieutenant Schmidt emb. 27/2, skip: 1: the generic city draws only its parts) is not claimed by design (groups.js): the module claims and draws its parts, the church r17488566 and the front house r4164973, which lie inside the outline' },
});

// Vasilyevsky-Okrug 7, cluster M4 (Smolensky cemetery, Kirov Palace of Culture / Erarta / garden, Sevkabel Port, Sea Terminal; docs/vo-m4.md). Written as separate statements (not inside the tables above) so that the
// blocks of the parallel port branches merge by keeping all of them. Checked with --where / --where-high at the first run.
OWNER_SKIPS.vasilyevsky = { ...(OWNER_SKIPS.vasilyevsky || {}),
  w1423396925: 'landmarksKirova / kirova-garden draws the ruin (building=ruins) as a flat crushed-stone decal with rubble stumps below 1.5 m (garden.js ruin(): a patch, not a mass)',
};
GENERIC_WAIVERS.vasilyevsky = { ...(GENERIC_WAIVERS.vasilyevsky || {}),
  'w45966107|streets': 'street lamps of the Bolshoy pr. V.O. kerb (lamps-D, 2.2 .. 4 m) stand about 2.3 m inside the outline of the Kirov Palace of Culture at its west corner (-5332, -196): hidden in the wall mass of the front that landmarksKirova draws; the lamp phase along the kerb differs per territory',
};
KNOWN_UNCLAIMED.vasilyevsky = { ...(KNOWN_UNCLAIMED.vasilyevsky || {}),
  w820265264: { module: 'landmarksSevkabel', why: 'one of the eight timber cable-spool towers (SPOOL_TOWERS of public-life-plan.js, yard.js props: 4.9 m, larch drums + a lamp) and the festoons of culture.js stand on the OSM outline of the bicycle shop Electra (92 m2, 2 levels), which city draws: verbatim source behaviour, a tower beside a kiosk, not a second building' },
  w133084710: { module: 'landmarksSevkabel', why: 'the portal crane T1a of the Baltic Shipyard (cranes.js, 60 m, instanced silhouette on its runway) reaches into the OSM outline of the yard hall Kosaya liniya 16 k43 (the source leaves the hall to city: "the yard hall w133084710 stays generic"): the crane gantry passes over the hall roof, verbatim source behaviour' },
};

// Gavan (docs/AREAS.md 15.g): the territory lists the same Kirov Palace of Culture / Erarta / garden and Sevkabel modules as vasilyevsky, on the same data, so the audit finds the same three conditions (68 street-lamp triangles inside the Kirov DK outline,
// the ruin decal, 1,078 spool-tower / festoon triangles on the Electra kiosk): the waivers of vasilyevsky above, repeated for this area. Separate statements (the blocks of the parallel port branches merge by keeping all of them).
OWNER_SKIPS.gavan = { ...(OWNER_SKIPS.gavan || {}),
  w1423396925: 'landmarksKirova / kirova-garden draws the ruin (building=ruins) as a flat crushed-stone decal with rubble stumps below 1.5 m (garden.js ruin(): a patch, not a mass); the same module and data as vasilyevsky',
};
GENERIC_WAIVERS.gavan = { ...(GENERIC_WAIVERS.gavan || {}),
  'w45966107|streets': 'street lamps of the Bolshoy pr. V.O. kerb (lamps-D, 2.2 .. 4 m) stand inside the outline of the Kirov Palace of Culture at its west corner (-5332, -196): hidden in the wall mass of the front that landmarksKirova draws (the same finding as in vasilyevsky: 68 triangles)',
};
KNOWN_UNCLAIMED.gavan = { ...(KNOWN_UNCLAIMED.gavan || {}),
  w820265264: { module: 'landmarksSevkabel', why: 'one of the eight timber cable-spool towers (SPOOL_TOWERS of public-life-plan.js, yard.js props: 4.9 m, larch drums + a lamp) and the festoons of culture.js stand on the OSM outline of the bicycle shop Electra (92 m2, 2 levels), which city draws: verbatim source behaviour, a tower beside a kiosk, not a second building (the same finding as in vasilyevsky)' },
};

// ---------------------------------------------------------------- engine
const THREE = await import('three');
const { createContext } = await import(pathToFileURL(path.join(root, 'src/core/ctx.js')).href);
const { createAudio } = await import(pathToFileURL(path.join(root, 'src/core/audio.js')).href);
const { createKnock } = await import(pathToFileURL(path.join(root, 'src/core/knock.js')).href);
const L = await import(pathToFileURL(path.join(root, 'src/world/layout.js')).href);
const D = await import(pathToFileURL(path.join(root, 'src/world/data/city.js')).href);       // the facade of the loaded area (tools/area.mjs remaps this URL)
const { mainModules, DYNAMIC } = await import('./modules-list.mjs');
const pageList = mainModules(AREA);
const only = opt('modules', null) ? new Set(String(opt('modules')).split(',')) : null;
const names = pageList.filter((m) => !DYNAMIC.includes(m) && (!only || only.has(m)));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 2500);
camera.position.set(0, 1.6, 30);
const sunDir = new THREE.Vector3(...L.SUN_DIR).normalize();
let audio; try { audio = createAudio(); } catch (e) { audio = null; }
const quality = { name: 'medium', pixelRatio: 1, msaa: 4, shadowMap: 2048, shadowSize: 70, petals: 0.6 };
const ctx = createContext({ scene, camera, renderer: null, audio, quality, sunDir });
ctx.buildList = pageList;      // lib/claims.js: a landmark group counts as owned when its module is in the page's list, as in the browser
ctx.sky = { sun: new THREE.DirectionalLight(), hemi: new THREE.HemisphereLight(), uniforms: {} };
ctx.knock = createKnock(ctx);

// ---------------------------------------------------------------- the claim tables (with the mutant applied to the audit's own view, never to the modules)
const claimedBy = new Map();       // id -> { module, key, viaParent? }
for (const [m, list] of Object.entries(L.GROUPS)) for (const g of list) { for (const id of g.ids || []) claimedBy.set(id, { module: m, key: g.key }); for (const id of g.osm || []) claimedBy.set(id, { module: m, key: g.key }); }
for (const b of D.BUILDINGS) if (b.parent && claimedBy.has(b.parent) && !claimedBy.has(b.id)) claimedBy.set(b.id, { ...claimedBy.get(b.parent), viaParent: b.parent });
for (const id of mutantIds) { if (!claimedBy.has(id)) { console.log(`--mutant unclaim:${id}: the id is not claimed in area ${AREA}`); process.exit(2); } claimedBy.delete(id); }
const { OWNS_TABLE } = await import(pathToFileURL(path.join(root, 'src/world/lib/owns-table.js')).href);
const ownsKey = (m, key) => { const o = OWNS_TABLE[m]; return o === true || (Array.isArray(o) && o.includes(key)); };

// every record of the facade by id (BUILDINGS first: a building outline is also a POI)
const byId = new Map();
const arrays = Object.entries(D).filter(([k, v]) => /^[A-Z_]+$/.test(k) && Array.isArray(v)).sort(([a], [b]) => (a === 'BUILDINGS' ? -1 : 0) - (b === 'BUILDINGS' ? -1 : 0));
for (const [, v] of arrays) for (const r of v) if (r && typeof r.id === 'string' && !byId.has(r.id)) byId.set(r.id, r);
const buildingIds = new Set(D.BUILDINGS.map((b) => b.id));

// ---------------------------------------------------------------- footprints
/** { kind: 'poly' | 'line' | 'point', polys: [{ o, h: [] }] | pts, hw | x, z, r;  bbox } */
function footprintOf(r) {
  if (!r) return null;
  const polys = r.polys && r.polys.length ? r.polys : r.o && r.o.length >= 6 ? [{ o: r.o, h: [] }] : null;
  if (polys) { const ps = polys.filter((p) => p.o && p.o.length >= 6).map((p) => ({ o: p.o, h: (p.h || []).filter((h) => h.length >= 6) })); if (ps.length) return { kind: 'poly', polys: ps, bbox: bboxOf(ps.flatMap((p) => p.o)) }; }
  if (r.pts && r.pts.length >= 4) { const hw = Math.max(0.6, (Number(r.w) || 2.4) / 2); return { kind: 'line', pts: r.pts, hw, bbox: grow(bboxOf(r.pts), hw) }; }
  if (r.pts && r.pts.length === 2) return { kind: 'point', x: r.pts[0], z: r.pts[1], r: DISC_R, bbox: grow(bboxOf(r.pts), DISC_R) };
  if (Number.isFinite(r.x) && Number.isFinite(r.z)) return { kind: 'point', x: r.x, z: r.z, r: DISC_R, bbox: grow([r.x, r.z, r.x, r.z], DISC_R) };
  if (Number.isFinite(r.cx) && Number.isFinite(r.cz)) return { kind: 'point', x: r.cx, z: r.cz, r: DISC_R, bbox: grow([r.cx, r.cz, r.cx, r.cz], DISC_R) };
  return null;
}
function bboxOf(flat) { let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity; for (let i = 0; i + 1 < flat.length; i += 2) { const x = flat[i], z = flat[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; } return [x0, z0, x1, z1]; }
const grow = (b, m) => [b[0] - m, b[1] - m, b[2] + m, b[3] + m];
function inRing(ring, x, z) { let inside = false; for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) { const xi = ring[i], zi = ring[i + 1], xj = ring[j], zj = ring[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside; } return inside; }
function distRing(ring, x, z) { let best = Infinity; for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) { const d = distSeg(x, z, ring[j], ring[j + 1], ring[i], ring[i + 1]); if (d < best) best = d; } return best; }
function distSeg(x, z, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz; let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; return Math.hypot(x - (ax + dx * t), z - (az + dz * t)); }
function distLine(pts, x, z) { let best = Infinity; for (let i = 2; i < pts.length; i += 2) { const d = distSeg(x, z, pts[i - 2], pts[i - 1], pts[i], pts[i + 1]); if (d < best) best = d; } return best; }
/** depth of (x, z) inside the footprint: the distance to its outline (or hole) when inside, -1 when outside (a point / line: the distance to the disc / ribbon edge) */
function depthIn(fp, x, z) {
  if (x < fp.bbox[0] - 1e-9 || x > fp.bbox[2] + 1e-9 || z < fp.bbox[1] - 1e-9 || z > fp.bbox[3] + 1e-9) return -1;
  if (fp.kind === 'point') { const d = fp.r - Math.hypot(x - fp.x, z - fp.z); return d >= 0 ? d : -1; }
  if (fp.kind === 'line') { const d = fp.hw - distLine(fp.pts, x, z); return d >= 0 ? d : -1; }
  for (const p of fp.polys) {
    if (!inRing(p.o, x, z)) continue;
    let inHole = false; for (const h of p.h) if (inRing(h, x, z)) { inHole = true; break; }
    if (inHole) continue;
    let d = distRing(p.o, x, z); for (const h of p.h) { const dh = distRing(h, x, z); if (dh < d) d = dh; }
    return d;
  }
  return -1;
}

const targets = [];      // { id, fp, claim: { module, key } | null, building, rec }
const missing = [];
for (const [id, claim] of claimedBy) { const r = byId.get(id); const fp = footprintOf(r); if (!r || !fp) { missing.push(id); continue; } targets.push({ id, fp, claim, building: buildingIds.has(id), rec: r }); }
for (const b of D.BUILDINGS) { if (claimedBy.has(b.id)) continue; const fp = footprintOf(b); if (fp) targets.push({ id: b.id, fp, claim: null, building: true, rec: b }); }
for (const id of [...undrawIds, ...citydrawIds]) { const t = targets.find((q) => q.id === id); if (!t || !t.claim || !t.building) { console.log(`--mutant undraw / citydraw:${id}: not a claimed building of area ${AREA}`); process.exit(2); } }
for (const id of WHERE) if (!targets.some((t) => t.id === id)) { console.log(`--where ${id}: no footprint (not claimed and not a building of area ${AREA})`); process.exit(2); }
// a grid over the footprint bboxes (10 m cells) so a centroid tests only the footprints whose bbox covers its cell
const CELL = 10, grid = new Map();
const ck = (cx, cz) => cx * 1e5 + cz;
targets.forEach((t, i) => { const b = t.fp.bbox; for (let cx = Math.floor(b[0] / CELL); cx <= Math.floor(b[2] / CELL); cx++) for (let cz = Math.floor(b[1] / CELL); cz <= Math.floor(b[3] / CELL); cz++) { const k = ck(cx, cz); let l = grid.get(k); if (!l) grid.set(k, (l = [])); l.push(i); } });
const targetIdx = new Map(targets.map((t, i) => [t.id, i]));
/** the deepest point of a footprint (a 12 x 12 sampling of its bbox): decides how much of the band of rule 2 / 3 a small building can bear */
function maxDepthOf(fp) { let best = 0; const [x0, z0, x1, z1] = fp.bbox; for (let a = 0; a <= 12; a++) for (let b = 0; b <= 12; b++) { const d = depthIn(fp, x0 + (x1 - x0) * a / 12, z0 + (z1 - z0) * b / 12); if (d > best) best = d; } return best; }
for (const t of targets) { t.inset = INSET; t.above = ABOVE; if (t.building && t.claim) { t.maxDepth = maxDepthOf(t.fp); t.inset = Math.min(INSET, 0.3 * t.maxDepth); const h = Number(t.rec.hEst || t.rec.h); if (h > 0 && h < ABOVE / 0.4) t.above = 0.4 * h; } }
const unclaimedBuildings = targets.filter((t) => !t.claim).length;
console.log(`claims-draw-audit area ${AREA}: ${claimedBy.size} claimed ids (${targets.length - unclaimedBuildings} with a record and a footprint, ${missing.length} without a record: ${missing.join(', ') || '-'}), ${unclaimedBuildings} unclaimed buildings; modules ${names.join(', ')}${mutantIds.size ? `; MUTANT unclaimed by the audit: ${[...mutantIds].join(', ')}` : ''}${undrawIds.size ? `; MUTANT undraw (the owner's own geometry of the building left out): ${[...undrawIds].join(', ')}` : ''}${citydrawIds.size ? `; MUTANT citydraw (the owner's own geometry moved to city): ${[...citydrawIds].join(', ')}` : ''}${LOOSE_RULE1 ? '; rule 1 graded LOOSE (the pre-M7-polish rule)' : ''}`);

// ---------------------------------------------------------------- build and count
// counts: `${module}|${targetIndex}` -> { n: centroids inside (inset 0), hi: above ABOVE and deeper than INSET, deep: above ABOVE and deeper than DEEP, overlap: of hi, those also inside an unclaimed building,
//   own: of hi, those that are not foliage and belong to THIS building and not to a deeper neighbour of another claim group (rule 1) }
const counts = new Map();
//   fol / low / shallow / stolen: of the centroids inside a claimed building that are NOT own, why (a plant; at or below the band; within the inset of the outline; deeper inside a neighbour of another claim group)
const bump = (m, i, f) => { const k = m + '|' + i; let c = counts.get(k); if (!c) counts.set(k, (c = { n: 0, hi: 0, deep: 0, overlap: 0, own: 0, fol: 0, low: 0, shallow: 0, stolen: 0 })); c.n++; if (f.hi) c.hi++; if (f.deep) c.deep++; if (f.overlap) c.overlap++; if (f.own) c.own++; else if (f.why) c[f.why]++; };
const groupOf = (t) => (t.claim ? t.claim.module + '/' + t.claim.key : 'unclaimed:' + t.id);
const V = new THREE.Vector3(), M = new THREE.Matrix4(), tmpM = new THREE.Matrix4();
const centroidsOf = (o, out, meshIdx, owners) => {
  const g = o.geometry; if (!g || !g.attributes || !g.attributes.position) return 0;
  const pos = g.attributes.position.array, idx = g.index ? g.index.array : null, nTri = idx ? idx.length / 3 : g.attributes.position.count / 3;
  const push = (mat) => { for (let t = 0; t < nTri; t++) { let x = 0, y = 0, z = 0; for (let c = 0; c < 3; c++) { const vi = idx ? idx[t * 3 + c] : t * 3 + c; x += pos[vi * 3]; y += pos[vi * 3 + 1]; z += pos[vi * 3 + 2]; } V.set(x / 3, y / 3, z / 3).applyMatrix4(mat); if (Number.isFinite(V.x) && Number.isFinite(V.z)) { out.push(V.x, V.y, V.z); owners.push(meshIdx); } } };
  if (o.isInstancedMesh) {
    const n = o.count; if (n * nTri > 3e6) { for (let i = 0; i < n; i++) { o.getMatrixAt(i, tmpM); M.multiplyMatrices(o.matrixWorld, tmpM); V.set(0, 0, 0).applyMatrix4(M); out.push(V.x, V.y, V.z); owners.push(meshIdx); } return n; }      // huge products: one point per instance
    for (let i = 0; i < n; i++) { o.getMatrixAt(i, tmpM); M.multiplyMatrices(o.matrixWorld, tmpM); push(M); } return n * nTri;
  }
  push(o.matrixWorld); return nTri;
};
const perModule = {}, samples = {};
let failed = false; const problems = [], warnings = [], notes = [];
for (const name of names) {
  const before = new Set(); scene.traverse((o) => before.add(o));
  const t0 = Date.now(); let err = null;
  try { const mod = await import(pathToFileURL(path.join(root, `src/world/${name}.js`)).href); if (typeof mod.build !== 'function') throw new Error('no exported build(ctx)'); await mod.build(ctx); } catch (e) { err = e; }
  if (err) { failed = true; problems.push(`${name}: failed to build: ${String(err && err.message).split('\n')[0]}`); perModule[name] = { error: true }; continue; }
  scene.updateMatrixWorld(true);
  const pts = [], owners = [], meshNames = [], meshFoliage = []; let tris = 0, meshes = 0;
  scene.traverse((o) => { if (before.has(o) || !(o.isMesh || o.isInstancedMesh)) return; meshes++; let nm = o.name, p = o.parent, chain = o.name || ''; while (p && p !== scene) { if (!nm) nm = p.name; chain += ' ' + (p.name || ''); p = p.parent; } meshNames.push(nm || (o.isInstancedMesh ? 'instanced' : 'mesh')); meshFoliage.push(FOLIAGE_RE.test(chain)); tris += centroidsOf(o, pts, meshNames.length - 1, owners); });
  let tested = 0;
  for (let p = 0, q = 0; p < pts.length; p += 3, q++) {
    const x = pts[p], y = pts[p + 1], z = pts[p + 2], l = grid.get(ck(Math.floor(x / CELL), Math.floor(z / CELL))); if (!l) continue;
    let inUnclaimed = false; const hits = [];
    for (const i of l) { const d = depthIn(targets[i].fp, x, z); if (d >= 0) { hits.push(i, d); if (!targets[i].claim) inUnclaimed = true; } }
    if (hits.length) tested++;
    for (let h = 0; h < hits.length; h += 2) {
      const i = hits[h], d = hits[h + 1], t = targets[i], hi = y > ABOVE && d >= INSET;
      // rule 1: the centroid is "the building itself" when it is not a plant, stands in the band of rule 2 / 3 and is not deeper inside a building of another claim group
      let own = false, why = null;
      if (t.claim && t.building) {
        if (meshFoliage[owners[q]]) why = 'fol'; else if (y <= t.above) why = 'low'; else if (d < t.inset) why = 'shallow';
        else { own = true; for (let h2 = 0; h2 < hits.length; h2 += 2) { const j = hits[h2]; if (j !== i && targets[j].building && hits[h2 + 1] > d && groupOf(targets[j]) !== groupOf(t)) { own = false; why = 'stolen'; break; } } }
      }
      if (own && t.claim && name === t.claim.module && undrawIds.has(t.id)) continue;                       // --mutant undraw: the owner's own geometry of this building is left out of the audit's view
      if (own && t.claim && name === t.claim.module && citydrawIds.has(t.id) && names.includes('city')) { bump('city', i, { hi, deep: y > ABOVE && d >= DEEP, overlap: false, own, why }); continue; }          // --mutant citydraw: ... and counted as city's
      bump(name, i, { hi, deep: y > ABOVE && d >= DEEP, overlap: hi && t.claim && inUnclaimed, own, why });
      if (WHERE.size && WHERE.has(t.id) && (!argv.includes('--where-high') || hi)) { const k = t.id + '|' + name; const s = samples[k] || (samples[k] = []); if (s.length < 10) s.push(`(${x.toFixed(1)}, ${y.toFixed(2)}, ${z.toFixed(1)}) d ${d.toFixed(2)} ${meshNames[owners[q]]}`); }
    }
  }
  perModule[name] = { meshes, tris, centroids: pts.length / 3, inFootprints: tested, ms: Date.now() - t0 };
}

// ---------------------------------------------------------------- grade
const get = (m, i) => counts.get(m + '|' + i) || { n: 0, hi: 0, deep: 0, overlap: 0, own: 0, fol: 0, low: 0, shallow: 0, stolen: 0 };
const skips = OWNER_SKIPS[AREA] || {}, known = KNOWN_UNCLAIMED[AREA] || {};
const why = (m, i) => { const c = get(m, i); return `${c.fol} foliage, ${c.stolen} taken by a deeper neighbour of another claim, ${c.shallow} within ${INSET} m of the outline, ${c.low} below the height band`; };
const covered = [];    // parts without a centroid of their own, covered by a drawn parent
const rows = [];       // per claimed target
for (let i = 0; i < targets.length; i++) {
  const t = targets[i]; if (!t.claim) continue;
  const owner = t.claim.module, inList = pageList.includes(owner), owned = inList && ownsKey(owner, t.claim.key);
  const oc = get(owner, i).n, own = get(owner, i).own;
  const tinyB = t.building && Number(t.rec.area) > 0 && Number(t.rec.area) < MIN_AREA;
  const parentI = t.rec.parent ? targetIdx.get(t.rec.parent) : undefined, viaParent = parentI !== undefined && targets[parentI].claim && targets[parentI].claim.module === owner && get(owner, parentI).own > 0;
  let drawn = t.building && !tinyB && !LOOSE_RULE1 ? own > 0 : oc > 0;       // a building of some size: its OWN geometry (rule 1); a point, a way, a lawn, a tiny part: any centroid inside
  if (!drawn && t.building && viaParent) { drawn = true; covered.push(`${t.id} (${t.rec.area} m2) <- ${t.rec.parent} (${owner} / ${t.claim.key})`); }
  const gen = {}; for (const m of GENERIC) if (names.includes(m)) gen[m] = get(m, i);
  rows.push({ i, t, owner, owned, oc, own, drawn, gen });
  if (!names.includes(owner)) continue;        // --modules left the owner out: nothing to grade for it
  const what = `${t.id}${t.claim.viaParent ? ` (part of ${t.claim.viaParent})` : ''} (${t.fp.kind}${t.rec.name ? ', ' + t.rec.name : ''})`;
  if (owned && !drawn && !skips[t.id]) {
    // red only for a BUILDING of some size (a hole in the scene); a point, a tiny part (an abacus of 1 m2: no triangle centroid can land in it), a way or a lawn / wood polygon the owner claims to
    // keep the generic modules off it (the castle's footways, the garden woods) is a warning
    const tiny = t.building && Number(t.rec.area) > 0 && Number(t.rec.area) < MIN_AREA;
    if (t.building && !tiny) { failed = true; problems.push(`${owner} / ${t.claim.key}: owns the building ${what} but ${oc ? `draws none of its own geometry inside its footprint (${oc} centroids lie in it, none of them the building: ${why(owner, i)}; the old rule counted them)` : 'draws nothing inside its footprint'}${undrawIds.has(t.id) ? ' (the --mutant undraw)' : ''}${citydrawIds.has(t.id) ? ' (the --mutant citydraw: city draws it)' : ''}`); }
    else warnings.push(`${owner} / ${t.claim.key}: owns ${what}${tiny ? ` of ${t.rec.area} m2` : ''} but draws nothing ${t.fp.kind === 'point' ? `within ${DISC_R} m of it` : 'inside its footprint'}`);
  }
  if (!t.building) continue;                   // the generic modules inside a claimed park / paving / way / point: reported only (see the header)
  for (const [m, c] of Object.entries(gen)) {
    const n = c.hi - c.overlap;
    const msg = `${m} draws ${n} triangles above ${ABOVE} m and deeper than ${INSET} m inside the claimed building ${t.id} of ${owner} / ${t.claim.key}${t.rec.name ? ' (' + t.rec.name + ')' : ''}${c.overlap ? ` (+ ${c.overlap} in an overlapping unclaimed building, not graded)` : ''}`;
    const waiver = (GENERIC_WAIVERS[AREA] || {})[t.id + '|' + m];
    if (owned && n >= MIN_GENERIC && waiver) notes.push(msg + ` (waived: ${waiver})`);
    else if (owned && n >= MIN_GENERIC) { failed = true; problems.push(msg); } else if (owned && n > 0) notes.push(msg + ` (below --min-generic ${MIN_GENERIC}: a corner of a neighbour's cornice or plate, not a blockout)`);
  }
}
// unclaimed buildings drawn by a landmark module (the mutant)
const landmarkMods = names.filter((m) => !GENERIC.includes(m) && !REPORTED.includes(m));
const unclaimedHits = [];
for (let i = 0; i < targets.length; i++) {
  const t = targets[i]; if (t.claim) continue;
  for (const m of landmarkMods) {
    const c = get(m, i); if (!c.n) continue;
    const label = `${t.id}${t.rec.name ? ' (' + t.rec.name + ')' : ''}${t.rec.addr ? ' ' + JSON.stringify(t.rec.addr) : ''}`;
    if (c.deep >= MIN_UNCLAIMED) {
      const k = known[t.id];
      if (k && k.module === m) { unclaimedHits.push({ m, id: t.id, n: c.deep, known: true }); notes.push(`${m} draws ${c.deep} triangles deep inside the unclaimed building ${label}: known, ${k.why}`); }
      else { unclaimedHits.push({ m, id: t.id, n: c.deep }); failed = true; problems.push(`${m} draws ${c.deep} triangles above ${ABOVE} m and deeper than ${DEEP} m inside the UNCLAIMED building ${label}: claimed by nobody${mutantIds.has(t.id) ? ' (the --mutant)' : ''}`); }
    } else if (VERBOSE) unclaimedHits.push({ m, id: t.id, n: c.deep, edge: c.hi - c.deep, low: c.n - c.hi, minor: true });      // low: on the outline (a party wall), within the inset, or below ABOVE (a floor)
  }
}

// ---------------------------------------------------------------- report, per module
for (const name of names) {
  const pm = perModule[name]; if (pm.error) { console.log(`== ${name}: FAILED TO BUILD`); continue; }
  const mine = rows.filter((r) => r.owner === name);
  const drawn = mine.filter((r) => r.drawn).length, notDrawn = mine.filter((r) => !r.drawn);
  const inClaimed = rows.filter((r) => r.owner !== name && get(name, r.i).n);
  const inUnclaimed = unclaimedHits.filter((h) => h.m === name);
  const role = GENERIC.includes(name) ? 'generic' : REPORTED.includes(name) ? 'reported only' : 'landmark';
  console.log(`== ${name} (${role}): ${pm.meshes} meshes, ${pm.tris} triangles (${pm.centroids} centroids, ${pm.inFootprints} inside some footprint), build ${pm.ms} ms`);
  if (mine.length) console.log(`   owns ${mine.length} claimed ids: ${drawn} drawn${notDrawn.length ? `, NOT drawn: ${notDrawn.map((r) => r.t.id + (skips[r.t.id] ? ' (skip: ' + skips[r.t.id] + ')' : !r.owned ? ' (not owned here)' : r.t.fp.kind === 'point' ? ' (point: warning)' : '')).join(', ')}` : ''}`);
  if (role !== 'reported only') console.log(`   inside claimed footprints of others: ${inClaimed.length ? inClaimed.map((r) => { const c = get(name, r.i); return `${r.t.id} ${c.n}${r.t.building ? ` (${c.hi} graded${c.overlap ? ', ' + c.overlap + ' overlap' : ''})` : r.t.fp.kind === 'point' ? ' (point: reported)' : ' (' + r.t.fp.kind + ': reported)'}${!r.owned ? ' (unowned: a blockout)' : ''}`; }).join(', ') : 'none'}`);
  if (role === 'landmark') console.log(`   inside unclaimed buildings (above ${ABOVE} m, deeper than ${DEEP} m): ${inUnclaimed.length ? inUnclaimed.map((h) => `${h.id} ${h.n}${h.known ? ' (known)' : ''}${h.minor ? ' (minor' + (h.edge ? ', ' + h.edge + ' between ' + INSET + ' and ' + DEEP + ' m' : '') + (h.low ? ', ' + h.low + ' on the outline or at floor level' : '') + ')' : ''}`).join(', ') : 'none'}`);
  if (VERBOSE && mine.length) for (const r of mine) console.log(`   ${r.t.id.padEnd(14)} ${r.t.claim.key.padEnd(28)} ${r.t.fp.kind.padEnd(5)} owner ${String(r.oc).padStart(6)} own ${String(r.own).padStart(6)}${r.t.building && r.oc > 0 && r.own === 0 ? ' LOOSE-ONLY' : ''}${r.t.building ? ` [fol ${get(r.owner, r.i).fol} stolen ${get(r.owner, r.i).stolen} shallow ${get(r.owner, r.i).shallow} low ${get(r.owner, r.i).low}]` : ''}  ${Object.entries(r.gen).map(([m, c]) => m + ' ' + c.n + '/' + c.hi + (c.overlap ? '(' + c.overlap + ' overlap)' : '')).join('  ')}`);
}
for (const [k, s] of Object.entries(samples)) { const [id, m] = k.split('|'); const c = get(m, targets.findIndex((t) => t.id === id)); console.log(`where ${id} / ${m}: ${c.n} centroids (${c.hi} above ${ABOVE} m and deeper than ${INSET} m, ${c.deep} deeper than ${DEEP} m), e.g. ${s.join('; ')}`); }
const unowned = rows.filter((r) => !r.owned).map((r) => r.t.id);
if (unowned.length) console.log(`claimed but not owned on this page (the generic modules draw the blockout, as designed): ${unowned.join(', ')}`);
console.log(`claimed ids: ${rows.length} (${rows.filter((r) => r.t.building).length} buildings graded for the generic modules, ${rows.filter((r) => r.t.fp.kind === 'point').length} points: owner warning only); generic modules graded: ${GENERIC.filter((m) => names.includes(m)).join(', ')}; inset ${INSET} m, deep ${DEEP} m, above ${ABOVE} m, unclaimed-building threshold ${MIN_UNCLAIMED} triangles`);
if (covered.length) console.log(`NOTE: ${covered.length} claimed PARTS have no centroid of their own (the owner draws the wall on the shared outline, or the part is a step / a base below the band) and are covered by their drawn parent${VERBOSE ? ': ' + covered.join(', ') : ' (--verbose lists them)'}`);
for (const n of notes) console.log('NOTE:', n);
for (const w of VERBOSE ? warnings : warnings.slice(0, 12)) console.log('WARNING:', w);
if (!VERBOSE && warnings.length > 12) console.log(`WARNING: ... and ${warnings.length - 12} more claimed points nobody draws (--verbose lists them)`);
for (const p of problems) console.log('PROBLEM:', p);
if (STRICT && warnings.length) { failed = true; console.log(`STRICT: ${warnings.length} warnings count as failures (a claimed id that nobody draws leaves a hole)`); }
console.log(failed ? `RESULT: FAIL (${problems.length} problems, ${warnings.length} warnings)` : `RESULT: OK (${warnings.length} warnings, ${notes.length} notes)`);
process.exit(failed ? 1 : 0);
