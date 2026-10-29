// Headless (node) build check for world modules — no GPU needed.
// usage: node tools/check.mjs <module> [more modules...]   e.g. node tools/check.mjs railway
// Builds the module(s) with a stubbed DOM, runs update() for a while, and prints a report:
// errors, triangles, meshes, materials, textures, colliders, bounds, and warnings.
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- DOM stubs
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
const stubEl = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, children: [], textContent: '', innerHTML: '', addEventListener() {}, removeEventListener() {}, appendChild() {}, setAttribute() {}, querySelector: () => stubEl(), querySelectorAll: () => [], getBoundingClientRect: () => ({ left: 0, top: 0, width: 1, height: 1 }), setPointerCapture() {}, remove() {}, width: 1, height: 1, getContext: () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } }) });          // generic DOM node (the drive HUD builds a small DOM tree)
globalThis.document = {
  createElement: (t) => (t === 'canvas' ? new FakeCanvas() : stubEl()),
  createElementNS: (ns, t) => (t === 'canvas' ? new FakeCanvas() : { style: {} }),
  fonts: { load: async () => [] }, body: { appendChild() {} }, head: { appendChild() {} }, addEventListener() {},
};
globalThis.Image = class { constructor() { this.width = 1; this.height = 1; } addEventListener() {} };
globalThis.HTMLCanvasElement = FakeCanvas; globalThis.OffscreenCanvas = FakeCanvas;
globalThis.requestAnimationFrame = (f) => setTimeout(() => f(Date.now()), 16);
globalThis.addEventListener = () => {};
globalThis.innerWidth = 1280; globalThis.innerHeight = 720; globalThis.devicePixelRatio = 1;
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
globalThis.performance = globalThis.performance || { now: () => Date.now() };

// ---------------------------------------------------------------- run
const THREE = await import('three');
const { createContext } = await import(pathToFileURL(path.join(root, 'src/core/ctx.js')).href);
const { createAudio } = await import(pathToFileURL(path.join(root, 'src/core/audio.js')).href);
const { createKnock } = await import(pathToFileURL(path.join(root, 'src/core/knock.js')).href);
const { batchStatic } = await import(pathToFileURL(path.join(root, 'src/core/batch2.js')).href);
const L = await import(pathToFileURL(path.join(root, 'src/world/layout.js')).href);

// --area-modules: check every module of the area's page (the MODULES list of AREA = the area tools/area.mjs runs as; default the strip), in build order, e.g.
//   node tools/area.mjs north tools/check.mjs --area-modules          (npm run check:north)       --skip a,b leaves modules out
const argvRest = process.argv.slice(2), skipFlag = argvRest.indexOf('--skip'), skip = new Set(skipFlag >= 0 ? String(argvRest[skipFlag + 1] || '').split(',') : []);
let names = argvRest.filter((a, i) => !a.startsWith('--') && argvRest[i - 1] !== '--skip');
if (argvRest.includes('--area-modules')) names = [...new Set([...(await import('./modules-list.mjs')).mainModules(), ...names])].filter((n) => !skip.has(n));
if (!names.length) { console.log('usage: node tools/check.mjs <module> [...] | --area-modules [--skip a,b]   (other areas: node tools/area.mjs <id> tools/check.mjs ...)'); process.exit(1); }

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 2500);
camera.position.set(0, 1.6, 30);
const sunDir = new THREE.Vector3(...L.SUN_DIR).normalize();
let audio; try { audio = createAudio(); } catch (e) { console.log('audio createAudio() threw:', e.message); audio = null; }
const quality = { name: 'medium', pixelRatio: 1, msaa: 4, shadowMap: 2048, shadowSize: 70, petals: 0.6 };
const ctx = createContext({ scene, camera, renderer: null, audio, quality, sunDir });
ctx.buildList = names;      // lib/claims.js: landmark groups only count as owned when their module is checked together with city
ctx.sky = { sun: new THREE.DirectionalLight(), hemi: new THREE.HemisphereLight(), uniforms: {} };
ctx.knock = createKnock(ctx);      // the knockable street furniture register during the module build, as in main.js

function triCount(o) {
  const g = o.geometry; if (!g || !g.attributes.position) return 0;
  const n = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  return n * (o.isInstancedMesh ? o.count : 1);
}
function snapshot() {
  const set = new Set(); scene.traverse(o => set.add(o)); return set;
}
const warnings = [];
let failed = false;
// A module that catches a failing sub-part logs '[module] part failed ...' and goes on: the page then shows a scene with a hole. The check must not print OK for that.
const caught = [];
for (const k of ['error', 'warn']) { const orig = console[k].bind(console); console[k] = (...args) => { const line = args.map((x) => (x && x.stack) || String(x)).join(' '); if (/failed|is not a function|is not defined|Cannot read/.test(line) && !line.startsWith('[textures]')) caught.push(line.split(String.fromCharCode(10))[0].slice(0, 220)); orig(...args); }; }
// The triangle tripwires (the measure + 10 .. 20 %). BUDGET is keyed by MODULE, the strip's value for a module both pages build; BUDGET_AREA overrides it for ONE area, because a module can
// build different geometry per area (M7 polish, docs/AREAS.md 11.3: landmarksOktyabrsky also builds the Kapodistrias monument where the area claims it, 47.0 k in the North against 27,5 k in the
// strip, and the single 57e3 entry loosened the strip's tripwire to twice its measure). The area is the one tools/area.mjs sets (AREA; the strip when run directly). Modules that only one
// area builds (the North's landmarks below) stay in BUDGET: no other page lists them.
const AREA = process.env.AREA || 'strip';
const BUDGET_AREA = {
  north: { landmarksOktyabrsky: 57e3 },
  // the two live areas (measured at 320efb6 with `node tools/area.mjs <id> tools/check.mjs --area-modules`, + about 15 %): their territories are 7.0 and 9.4 km2 against the strip's ~2 km2, so the generic modules build 2 to 2.5 times the strip's triangles
  palace: { environment: 890e3, streets: 1.17e6, city: 1.3e6, props: 410e3 },      // measured: environment 776,743, streets 1,013,573, city 1,128,586, props 353,786 (the Summer Garden 392 k and the Mars Field 270 k have no entry: no other area builds them)
  // Admiralty-Haymarket (docs/AREAS.md 15.2; measured with `node tools/area.mjs admiralty tools/check.mjs --area-modules`, + about 15 %): 7.3 km2 with the Neva, the Moika, the Griboedov, Kryukov and Admiralty canals and the Fontanka
  admiralty: { environment: 1.25e6, streets: 1.27e6, city: 1.55e6, props: 380e3 },      // measured: environment 1,084,289, streets 1,104,532, city 1,342,315, props 329,830
  vladimirsky: { environment: 770e3, streets: 1.3e6, city: 1.65e6, landmarksD: 345e3 },      // measured (node tools/area.mjs vladimirsky tools/check.mjs --area-modules): environment 662,706, streets 1,133,535, city 1,432,842, landmarksD 300,686 (all four sub-groups: the cathedral and the bell tower, the Tolstoy House, the Passage, the library), + about 15 %
  smolny: { streets: 1.25e6, city: 1.42e6, landmarksOktyabrsky: 57e3 },      // measured: streets 1,088,461, city 1,237,047, landmarksOktyabrsky 47,001 (with the Kapodistrias monument, as in the north)
  // Vasilyevsky-Okrug 7 (docs/AREAS.md 15.v; foundation, measured with `node tools/area.mjs vasilyevsky tools/check.mjs --area-modules`, + about 15 %): 11.2 km2 with the Neva, the Malaya Neva, the Smolenka and the Gavan harbour
  // merged measured (all 13 ported modules + the bridge wave; environment re-measured after fix C, the Gulf and the Sea Terminal water: 1,036,903): environment 989,463, streets 994,103, city 1,175,519, landmarksAcademy 193,116, props 268,906; every row = measured + about 15 % (docs/AREAS.md 15.v).
  vasilyevsky: { environment: 1.19e6, streets: 1.15e6, city: 1.35e6, props: 310e3, landmarksAcademy: 222e3,
    landmarksStrelka: 213e3,      // measured 184,785 (the Exchange, the Rostral columns, the garden, the descent, the warehouses, the Customs house; docs/vo-m1.md) + 15 %
    bridges: 104e3,      // measured 89,974 (Palace + Blagoveshchensky + Birzhevoy, Tuchkov, Uralsky, Smolensky, Nalichny, Novo-Andreevsky; the foundation had 49,900) + about 15 %
    //
    landmarksUniversity: 67e3,      // measured 57,786 (Kunstkamera, Academy of Sciences, Twelve Collegia, monuments, Rector wing, Peter II palace, Gostiny Dvor) + 15 %
    //
    landmarksMenshikov: 303e3,      // measured 263,278 (palace, forecourt, Corps, Rumyantsev garden with the obelisk, the descent with its pontoons), + about 15 %
    //
    landmarksAndrew: 245e3,      // measured 212,917 (vo-m3: + 15 %)
    //
    landmarksMakarova: 112e3,      // measured 97,043 (all seven sub-groups), + about 15 %
    //
    landmarksNavalCorps: 83e3,      // measured 71,622 (all four sub-groups), + about 15 %
    //
    landmarksMining: 76e3,      // measured 65,610 (all three sub-groups), + about 15 %
    //
    landmarksSredny: 96e3,      // measured 83,139 (vo-m3 82,349 + the breakable yard-wall bays of fix A) + 15 %
    //
    landmarksModernVO: 177e3,      // measured 153,951 (vo-m3: + 15 %)
    //
    landmarksKirova: 218e3,      // measured 189,336 (Palace of Culture, Erarta, the garden, Sobchak; the garden fence / hedges / passage walls are knock bays) + 15 %
    //
    landmarksSmolensky: 320e3,      // measured 277,547 (6 groups: churches, chapels, 2.4 km fence as knock bays, the forest and 13,000 graves) + 15 %
    //
    landmarksSevkabel: 222e3,      // measured 192,892 (8 groups; the culture kit, stalls and tables are knock records) + 15 %
    //
    landmarksSeaTerminal: 34e3,      // measured 29,383 (sea-terminal only; torpedo-boat, d2-narodovolets and lenexpo-site are not claimed) + 15 %
    //
    landmarksVOStatues: 176e3,      // measured 153,116 (vo-m3: + 15 %)
  },
  // Gavan / Morskoy / Dekabristov Island (docs/AREAS.md 15.g; foundation, NOT measured yet): every row is the scouts' estimate (D:/git2/n4spb-work/gdm/scout-*.md section 'Triangles') + about 30 %, the base modules from the prototype builds of
  // scout-sea.md (environment 0.81 M / 0.93 M / 1.08 M for k=49 / 47 / 51, B600 territories). The port rounds replace each row by its measured value + 15 % (the PORT-BUDGET marker lines: one per module, replaced by the real row; the separating `//` line stays).
  gavan: { environment: 1.7e6, streets: 1.0e6, city: 650e3, props: 260e3,      // estimates: environment 1.0 - 1.3 M, streets ~0.75 M, city 0.42 - 0.50 M (2,009 buildings), props ~0.2 M
    // PORT-BUDGET: landmarksGavan
    //
    // PORT-BUDGET: landmarksPribaltiyskaya
    //
    landmarksKirova: 218e3,      // measured in vasilyevsky 189,336 (the same module and groups) + 15 %
    //
    landmarksSevkabel: 250e3,      // estimate ~190 k (192,892 in vasilyevsky minus the Baltic Shipyard cranes) + 30 %
    //
    landmarksSeaTerminal: 65e3,      // estimate ~50 k (29,383 in vasilyevsky + D-2 + boat + hoarding) + 30 %
    //
    landmarksModernVO: 34e3, landmarksSredny: 72e3, landmarksVOStatues: 33e3,      // estimates ~26 k / ~55 k / ~25 k (the groups that lie in this territory) + 30 %
    //
    bridges: 83e3,      // measured 71,830 (gdm cluster B: the WHSD part of this extent + 300 m: at-grade stretch, cutting, viaduct to the Korabelny pylon 36,688; Nalichny, Novo-Andreevsky; the Palace Bridge that every area builds 14,540; the Shkipersky Bridge of cluster G is not in it yet) + 15 %
  },
  morskoy: { environment: 1.3e6, streets: 720e3, city: 350e3, props: 130e3,      // estimates: environment 0.6 - 1.5 M (prototype 0.93 M), streets 0.45 - 0.55 M, city ~0.27 M (1,175 buildings), props ~0.1 M
    // PORT-BUDGET: landmarksMarineFacade
    //
    // PORT-BUDGET: landmarksPribaltiyskaya
    //
    landmarksVOStatues: 13e3,      // estimate < 10 k (the polar explorers' monument only) + 30 %
    //
    bridges: 92e3,      // measured 79,384 (gdm cluster B bridgesMo: Nalichny, Novo-Andreevsky, Korablestroiteley, 1st - 4th Smolensky, the WHSD from the portals to z 580 incl. the at-grade stretch 30,382; the Palace Bridge that every area builds 14,540) + 15 %
    //
    // (bridgesMo is in the `bridges` row above)
  },
  dekabristov: { environment: 1.5e6, streets: 1.04e6, city: 650e3, props: 200e3,      // estimates: environment 1.0 - 1.2 M (prototype 1.08 M), streets 0.6 - 0.8 M, city 0.5 - 0.7 M (589 buildings after the DK1..DK5 fetch: likely far less), props ~0.15 M
    landmarksSmolensky: 320e3,      // measured in vasilyevsky 277,547 (the same six groups: overlap parity, docs/AREAS.md 15.g) + 15 %
    //
    landmarksVOStatues: 26e3,      // estimate ~20 k (the Armenian church, the Komitas monument, the polar explorers) + 30 %
    //
    // PORT-BUDGET: landmarksDekabristov
    //
    // PORT-BUDGET: landmarksPrimorskaya
    //
    // PORT-BUDGET: landmarksFill
    //
    bridges: 102e3,      // measured 88,356 (gdm cluster B: Uralsky, Smolensky, Nalichny, Novo-Andreevsky, Korablestroiteley, 1st - 4th Smolensky, the WHSD portals, Betancourt 18,306, Serny, the WHSD fairway bridge 5,066; the Palace Bridge that every area builds 14,540) + 15 %
  },
};       // North: 47,001 triangles measured (the comment of M7 said 47,307: stale; 10.3 and the M7 polish re-measure say 47,001) + 20 %, rounded up
const budgetOf = (name) => (BUDGET_AREA[AREA] && BUDGET_AREA[AREA][name]) || BUDGET[name] || null;
const BUDGET = { environment: 500e3, streets: 500e3, city: 600e3, landmarksA: 400e3, landmarksB: 500e3, landmarksC: 500e3, landmarksD: 300e3, traffic: 400e3, props: 300e3, people: 200e3, wildlife: 100e3,
  // the North's landmark modules (M5, measured 2026-10-21: NorthFull 583 k incl. Dom Muruzi 241 k, Smolny 433 k, Kirochnaya 121 k, Suvorov 47 k, Oktyabrsky 27.5 k)
  landmarksNorthFull: 600e3, landmarksSmolny: 450e3, landmarksKirochnaya: 130e3, landmarksSuvorov: 55e3,
  // Oktyabrsky: the STRIP's value (27,542 measured, + 10 %); the North builds 47,001 with the Kapodistrias monument, its apron and its trees and has its own entry in BUDGET_AREA above.
  // landmarksBelinskyNorth (M7 C-landmarks, measured 2026-10-23, + 20 %): the Church of Simeon and Anna 27,955
  landmarksOktyabrsky: 30.3e3, landmarksBelinskyNorth: 34e3,
  // the Troitsky Bridge (docs/AREAS.md 13.8, measured 2026-10-25: 107,738 = the static bridge + the bascule leaf + the 22 knockable lamps + the barriers) + 11 %
  landmarksTroitsky: 120e3,
  // the Palace Bridge's two opening leaves + the barriers (docs/AREAS.md 13.10, measured 2026-10-25: 4,936) + about 15 %
  landmarksPalaceBridge: 5.7e3,
  // the south-west modules ported for Admiralty-Haymarket (measured 2026-10-26: Nikolsky 225,068, Mariinsky 201,843, New Holland 135,150, Yusupov 80,420, Trinity-Izmailovsky + the Technological Institute 164,863) + about 15 %
  landmarksNikolsky: 260e3, landmarksMariinsky: 232e3, landmarksNewHolland: 156e3, landmarksYusupov: 93e3, landmarksCentralSouth: 190e3,
  // the Academy sphinx pier + the Academy of Arts (Admiralty-Haymarket, docs/AREAS.md 15.z, measured: Academy 62,748 + pier 54,590 = 117,210) + about 15 %
  landmarksAcademy: 135e3,
  // the Tauride Palace + the Paradny quarter (T1 of docs/TAURIDE-REMAKE.md, measured: 621,713 incl. the courts 29 k and the palace 23 k; the garden is not in it, it comes with the later phases and gets its own allowance)
  landmarksTauride: 835e3 };      // T8b (the garden nursery, a user fix): measured 758,672 = 738,046 + the nursery's 20,626 (floor 20, frames 5,150, glass 3,714, trees 11,224, buildings and details 518); T6 (the Tauride remake): measured 741,242 after the fence, the furniture and the monuments (T5 695,581 + the fence 15.7 k + the furniture 19.1 k + the monuments 10.8 k), the tripwire = the measure + 10 % (T5: 765 k = 695,273 + 10 %); 815 k + the 20.6 k of the nursery = 835 k

for (const name of names) {
  const before = snapshot();
  const colBefore = ctx.physics.count, wiresBefore = ctx.wires.count, texBefore = ctx.tex.pixels, updBefore = ctx._updates.length;
  const t0 = Date.now();
  let err = null;
  try {
    const mod = await import(pathToFileURL(path.join(root, `src/world/${name}.js`)).href);
    if (typeof mod.build !== 'function') throw new Error('no exported build(ctx)');
    await mod.build(ctx);
  } catch (e) { err = e; failed = true; }
  const ms = Date.now() - t0;
  if (name === 'city' && ctx.physics.items.slice(colBefore).some((c) => c.source && c.source.knock)) { failed = true; console.log('KNOCK ERROR: a collider of the city module is registered as knockable (baked colliders are plain data: never register anything built by city/*)'); }
  scene.updateMatrixWorld(true);
  const added = []; scene.traverse(o => { if (!before.has(o)) added.push(o); });
  let tris = 0, meshes = 0, inst = 0, instances = 0, nan = 0;
  const mats = new Set(), matTypes = {}, box = new THREE.Box3(), tb = new THREE.Box3();
  const nonToon = new Set();
  for (const o of added) {
    if (!o.isMesh && !o.isLine && !o.isPoints) continue;
    meshes++; if (o.isInstancedMesh) { inst++; instances += o.count; }
    tris += triCount(o);
    const ms_ = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms_) { if (!m) continue; mats.add(m); matTypes[m.type] = (matTypes[m.type] || 0) + 1; if (m.type === 'MeshStandardMaterial' || m.type === 'MeshPhysicalMaterial' || m.type === 'MeshLambertMaterial' || m.type === 'MeshPhongMaterial') nonToon.add(m.type); }
    const g = o.geometry;
    if (g && g.attributes.position) {
      const a = g.attributes.position.array;
      for (let i = 0; i < a.length; i += 97) if (!Number.isFinite(a[i])) { nan++; break; }
      if (!o.isInstancedMesh && o.name !== 'wires') { if (!g.boundingBox) g.computeBoundingBox(); if (!g.boundingBox.isEmpty() && Number.isFinite(g.boundingBox.min.x)) { tb.copy(g.boundingBox).applyMatrix4(o.matrixWorld); box.union(tb); } }
    }
    if (!Number.isFinite(o.matrixWorld.elements[12]) || !Number.isFinite(o.matrixWorld.elements[13])) nan++;
  }
  // update loop
  let updErr = null;
  const upd = ctx._updates.slice(updBefore);
  try {
    let t = 0; const dt = 1 / 30;
    for (let i = 0; i < 900; i++) { ctx.time = t; ctx.shared.uTime.value = t; for (const f of upd) f(dt, t); t += dt; }
    for (const T of [60, 90, 120, 180, 300]) { ctx.time = T; for (const f of upd) f(0, T); }
  } catch (e) { updErr = e; failed = true; }
  const report = {
    module: name, ok: !err && !updErr, buildMs: ms,
    triangles: Math.round(tris), budget: budgetOf(name), meshes, instancedMeshes: inst, instances,
    materials: mats.size, materialTypes: matTypes,
    canvasPixels: ctx.tex.pixels - texBefore, colliders: ctx.physics.count - colBefore, wires: ctx.wires.count - wiresBefore,
    updateFns: upd.length, services: Object.keys(ctx.services),
    bounds: box.isEmpty() ? null : { min: [box.min.x, box.min.y, box.min.z].map(v => +v.toFixed(1)), max: [box.max.x, box.max.y, box.max.z].map(v => +v.toFixed(1)) },
  };
  if (nan) warnings.push(`${name}: ${nan} object(s) with NaN/Infinity positions`);
  if (nonToon.size) warnings.push(`${name}: non-toon lit materials used (${[...nonToon].join(', ')}) — use ctx.mat.toon()/emissive()/glass()`);
  if (report.budget && tris > report.budget) warnings.push(`${name}: ${Math.round(tris)} triangles exceeds budget ${report.budget}`);
  if (report.canvasPixels > 24e6) warnings.push(`${name}: canvas textures use ${(report.canvasPixels / 1e6).toFixed(1)}M px (> 24M)`);
  console.log(JSON.stringify(report, null, 1));
  if (err) console.log(`BUILD ERROR in ${name}:\n${err.stack || err}`);
  if (updErr) console.log(`UPDATE ERROR in ${name}:\n${updErr.stack || updErr}`);
}
// knock census: every registered record that has colliders must still own them in ctx.physics (nothing was lost or double-registered), none in the city slice (checked above)
{
  const ks = ctx.knock.stats, owners = new Set(); for (const c of ctx.physics.items) if (c.source && c.source.knock) owners.add(c.source.knock);
  const withItems = ctx.knock.list.filter((r) => r.items.length).length;
  console.log(`knock: registered ${ks.registered} by kind ${JSON.stringify(ks.byKind)}`);
  if (owners.size !== withItems) { failed = true; console.log(`KNOCK ERROR: ${withItems} records own colliders but ${owners.size} records are found on ctx.physics.items`); }
}
// batching sanity
try { const b = batchStatic(ctx.staticRoot, { mat: ctx.mat }); console.log('batch:', JSON.stringify(b)); } catch (e) { failed = true; console.log('BATCH ERROR:\n' + (e.stack || e)); }
try { if (ctx.wires.count) ctx.wires.build(); } catch (e) { failed = true; console.log('WIRES ERROR:\n' + (e.stack || e)); }
if (ctx.tex.collisions && ctx.tex.collisions.length) warnings.push('texture keys drawn by two different painters (the second module gets the first texture; use a unique key prefix): ' + ctx.tex.collisions.slice(0, 12).join(', ') + (ctx.tex.collisions.length > 12 ? ' ... ' + ctx.tex.collisions.length + ' keys' : ''));
for (const w of warnings) console.log('WARNING:', w);
if (caught.length) { failed = true; console.log('CAUGHT SUB-BUILD ERRORS (' + caught.length + '): a module logged a failure and went on:'); for (const c of caught.slice(0, 12)) console.log('  ' + c); }
console.log(failed ? 'RESULT: FAIL' : 'RESULT: OK');
process.exit(failed ? 1 : 0);
