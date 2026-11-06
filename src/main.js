import { openBakedWorld, installBaker, bakedData, setBakeDir } from './core/baked-world.js';
import { createRegionStreamer } from './core/region-streamer.js';
// Bootstrap: renderer, sky, context, module build, batching, main loop, HUD. (adapted from the Sakuragaoka Station engine)
// Underground engine (docs/UNDERGROUND.md): indoor zones (core/zones.js) are blended over the time-of-day look each frame, ctx.interact / ctx.ui (core/ui.js) give the
// metro module its prompts and panels, the player can ride a moving frame (player.board / alight), and the frame order is player -> updates -> zones -> time of day -> sky -> render.
import * as THREE from 'three';
import * as L from './world/layout.js';
import * as A from './world/area.js';      // the area module of this page (docs/AREAS.md): the page of another area remaps this URL with an import map
import { createContext } from './core/ctx.js';
import { createRenderPipeline, assignShadowMaterials, unifyInstanceColor } from './core/renderer.js';
import { createSky } from './core/sky.js';
import { Player } from './core/player.js';
import { captureRoofMap } from './core/roofmap.js';
import { batchStatic } from './core/batch.js';
import { batchStatic as batchStatic2 } from './core/batch2.js';
import { buildNDProxy, NDLazy } from './core/ndproxy.js';
import { splitInstanced, releasedStats } from './core/spatial.js';
import { LOD } from './core/lod.js';
import { batchFixtureCells } from './core/fixture-cells.js';
import { compactStaticAttributes } from './core/compact-static.js';
import { createAudio } from './core/audio.js';
import { createKnock } from './core/knock.js';
import { createTimeOfDay } from './core/timeofday.js';
import { createZones } from './core/zones.js';
import { createUI, createInteract } from './core/ui.js';
import { createMinimap } from './core/minimap.js';
import { createWaterView } from './core/water-view.js';      // the underwater tint (docs/AREAS.md 13.7: water is reachable)
import { createTouchControls } from './core/touch.js';      // phones / tablets: the touch UI (does nothing on desktop)
import { installBootGuard } from './core/boot-guard.js';      // fatal card, lost-context handler, phone warning + crash-loop guard
import { REGISTRY } from './areas/registry.js';      // runtime-only (tools/baked-revision.mjs): only this file may import it and core/gates.js / core/handoff.js
import { VERSION } from './core/version.js';      // runtime-only (tools/baked-revision.mjs): the number on the preloader, CLAUDE.md "Versioning"
import { createGates, planArrival, backLink, createSeam, grabFrame } from './core/gates.js';      // the area gates: the seamless hand-off to the neighbour's page, the freeze veil (docs/AREAS.md)

export const MODULES = [
  // order matters: later modules read services of earlier ones (see docs/DESIGN.md)
  'environment',  // ground, embankment granite, Fontanka / Moika / Neva water, trees, lawns, flowerbeds, far skyline
  'landmarksNorth', // Podpisnye Izdaniya bookstore and the Mayakovskogo / Vosstaniya corridor houses
  'streets',      // roads, markings, kerbs, granite pavements, crossings, road furniture, trolleybus overhead wires
  'city',         // every OSM building that no landmark module owns: Petersburg facade grammar, roofs, courtyards, entrances
  'rail',         // Moscow Railway Station tracks, platforms, canopies, catenary, signals, trains
  'landmarksA',   // Moscow Railway Station building + clock tower + Vosstaniya Square (obelisk, hotel Oktyabrskaya)
  'landmarksB',   // Nevsky Prospekt landmarks between Vosstaniya Square and Fontanka
  'landmarksC',   // Fontanka embankment, Anichkov Bridge + horse tamers, palaces, boats
  'landmarksD',   // sights in the north and south: National Library, Mariinsky block, Vladimirsky Cathedral, Tolstoy House
  'landmarksE',   // Gostiny Dvor, Ostrovsky Square, Alexandrinsky Theatre, Rossi Street, Anichkov Palace
  'landmarksF',   // Kazan Cathedral + square, Singer House
  'landmarksG',   // Palace Square: Winter Palace, General Staff, Alexander Column
  'landmarksH',   // Admiralty, Alexander Garden, Senate Square, St Isaac's Cathedral
  'landmarksI',   // Winter Palace + Hermitage
  'landmarksJ',   // St Isaac's Cathedral + square, Mariinsky Palace
  'landmarksBelinsky', // Ciniselli Circus
  'landmarksK',   // Church of the Saviour on Blood, Mikhailovsky Garden, Russian Museum
  'landmarksCastle', // Engineering (Mikhailovsky) Castle and the Peter I monument
  'landmarksOktyabrsky', // Bolshoy Concert Hall Oktyabrsky on Ligovsky Prospekt
  'bridges',      // the bridges of the strip: Kazansky, Green, Blue, Palace, Hermitage ...
  'metro',        // underground: vestibules, escalators, station halls, tunnels, trains, ride + network map (the seven stations of the strip)
  'props',        // benches, bins, kiosks, bus shelters, tourist stalls, billboards, flower baskets
  'traffic',      // moving cars, buses, trolleybuses + parked cars
  'people',       // pedestrians, tourists, groups with guides, station crowd, cyclists, scooters
  'wildlife',     // pigeons, gulls, crows, sparrows, ducks + ambience triggers
  'drive',        // the red sports car at the Moscow station (E to get in) + the driving interface
];
// The modules this page builds: the strip's list above, or the list of another area (src/areas/<id>/area.js exports MODULES; docs/AREAS.md). tools/modules-list.mjs reads the strip's list from here.
const MODULE_LIST = A.MODULES || MODULES;

const params = new URLSearchParams(location.search);
const SHOT = params.has('shot');
const ONLY = params.get('only') ? params.get('only').split(',').map(s => s.trim()).filter(Boolean) : null;
const $ = (id) => document.getElementById(id);

const isTouch = document.documentElement.classList.contains('tc');      // the inline script of index.html: (pointer: coarse) or ?touch=1 (?touch=0 forces it off)
// Tiers: pixelRatio / msaa / shadow map + box are the GPU side; ndFar = distance of the outline (normal / depth) pass (the outline fades out at 190 m anyway), lod scales the distance LOD of the
// city details (balconies, railings ...), cull scales the vehicle / people / bird render radii on top of their own tier tables, petals = flower petals. (The population / tree / bird counts
// of each module scale with quality.level (falls back to quality.name) inside the module.)
// TWO TIERS (2026-10-17, as in 102_3d_piter): only `medium` and `performance` are offered, tested and baked; `high` and `low` are retired (kept commented for reference). The shipping bake
// (tools/bake-scene.mjs) runs its base stage at medium (+ nav-medium) and a nav stage at performance (nav-low); ?q=high / ?q=low fall back to the default, performance.
const QUALITY = {
  // high: { name: 'high', pixelRatio: Math.min(devicePixelRatio, 1.5), msaa: 4, shadowMap: 4096, shadowSize: 90, petals: 1.0, ndFar: 200, lod: 1, cull: 1 },
  medium: { name: 'medium', pixelRatio: Math.min(devicePixelRatio, 1.0), msaa: 4, shadowMap: 2048, shadowSize: 70, petals: 0.6, ndFar: 150, lod: 0.8, cull: 0.75 },
  // low: { name: 'low', pixelRatio: Math.min(devicePixelRatio, 0.75), msaa: 0, shadowMap: 2048, shadowSize: 50, petals: 0.35, ndFar: 110, lod: 0.6, cull: 0.55 },
  // performance: the frame-rate tier (docs/PERFORMANCE.md: the frame is CPU draw-submission bound, so fewer draws is what helps, not fewer pixels). level 'low' = the population / tree /
  // bird / lawn counts and the nav product of the low tier (ctx.quality.level); far = the camera far plane (1.8 km instead of 7 km: the colour calls beyond it were about half of the
  // render at street level); fogScale thickens the fog so that the cut is hidden (~97 % at the far plane, day: 500 m 24 %, 1 km 66 %). The GPU side stays at medium (pixel ratio 1, MSAA).
  // ?far= and ?fogx= override the two for tuning (any tier).
  performance: { name: 'performance', level: 'low', pixelRatio: Math.min(devicePixelRatio, 1.0), msaa: 4, shadowMap: 2048, shadowSize: 50, petals: 0.35, ndFar: 110, lod: 0.6, cull: 0.55, far: 1800, fogScale: 2.5 },
};
let qName = params.get('q') || (() => { try { return localStorage.getItem('piter.q'); } catch (e) { return null; } })() || 'performance';      // Performance is the default tier everywhere (a remembered choice or ?q=medium still wins)
if (!QUALITY[qName]) qName = 'performance';                       // (a remembered 'high' / 'low' from before the two-tier policy lands here too)
const quality = { ...QUALITY[qName] };
if (isTouch) Object.assign(quality, { pixelRatio: Math.min(quality.pixelRatio, 1), shadowMap: Math.min(quality.shadowMap, 1024), msaa: Math.min(quality.msaa ?? 4, 2) });      // phones: the GPU side only (shadow map, MSAA, pixel ratio), so the bake and the `level` stay valid
if (SHOT) { quality.pixelRatio = 1; }

// ------------------------------------------------------------------ renderer & scene
const canvas = $('scene');
const guard = installBootGuard({ canvas, params, isTouch, qName });      // before anything can fail: the fatal card (an error while loading, a lost WebGL context), the phone warning, the crash-loop guard
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false, preserveDrawingBuffer: SHOT });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.info.autoReset = false;

const scene = new THREE.Scene();
const CAM_FAR = params.has('far') ? Number(params.get('far')) || 7000 : (quality.far || 7000);      // ?far= m: the camera far plane (the performance tier shortens it; pair it with ?fogx=)
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.25, CAM_FAR);
const sunDir = new THREE.Vector3(...L.SUN_DIR).normalize();
const sky = createSky(scene, sunDir, quality);
const pipeline = createRenderPipeline(renderer, quality);
pipeline.ndFar = quality.ndFar;
if (params.has('ndfar')) pipeline.ndFar = Number(params.get('ndfar')) || 1e9;      // debug / A-B: distance of the normal / depth pass (default 200 m)
const audio = createAudio();
const ctx = createContext({ scene, camera, renderer, audio, quality, sunDir });
ctx.area = A;      // the area module of this page: ctx.area.ID, BAKE_DIR, MODULES ... (a test hook: __ctx.area.ID)
ctx.sky = sky;
ctx.knock = createKnock(ctx);      // the knockable street furniture (core/knock.js): modules register their instances during the build (guard: if (ctx.knock))
const zones = createZones({ scene, camera, sky, pipeline, shared: ctx.shared, staticRoot: ctx.staticRoot, dynamicRoot: ctx.dynamicRoot, indoor: ctx.indoor, heightAt: L.heightAt });
ctx.zones = zones;
if (params.get('nofreeze') === '1' || params.get('nofreeze') === 'zones') zones.config.freezeHidden = false;
if (params.has('freezekinds')) zones.config.freezeKinds = params.get('freezekinds');      // debug / A-B
const tod = createTimeOfDay({ sky, scene, shared: ctx.shared, sunDir, pipeline, overlay: zones.overlay, fogScale: params.has('fogx') ? Number(params.get('fogx')) || 1 : (quality.fogScale || 1) });      // ?fogx= multiplies every preset's fog density
if (params.has('tod')) tod.set(params.get('tod'), true);
if (params.has('nofog')) Object.defineProperty(scene.fog, 'density', { get: () => 0, set: () => {} });   // debug: clear air (tools/overlay.mjs looks from 1+ km)
window.__ctx = ctx; window.__tod = tod; window.__zones = zones; window.THREE = THREE; window.__pipeline = pipeline; window.__camera = camera;   // debug / test hooks

function resize() {
  const w = SHOT ? Number(params.get('w') || 1280) : innerWidth, h = SHOT ? Number(params.get('h') || 720) : innerHeight;
  renderer.setSize(w, h, !SHOT);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  pipeline.setSize(w, h, quality.pixelRatio);
  ctx.wires.setResolution(pipeline.size.x, pipeline.size.y);
}
addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------ fonts
async function loadFonts() {
  if (!document.fonts || !document.fonts.load) return;
  const faces = ['700 32px "Rubik"', '500 32px "Rubik"', '900 32px "Rubik"', '400 32px "Noto Sans"', '700 32px "Noto Sans"', '700 32px "Noto Serif"', '400 32px "Caveat"'];
  // the cyrillic slice of the fonts is fetched before any canvas text is drawn (every letter of the signage the modules draw is listed)
  const ru = 'Санкт-Петербург Невский проспект Площадь Восстания Московский вокзал Лиговский Маяковская Достоевская Владимирская Фонтанка Аничков мост Метро Выход Вход Касса Кафе Аптека Магазин Ё ё Й й Щ щ Ъ ъ Ы ы Э э Ю ю Я я Saint Petersburg Metro 0123456789';
  await Promise.race([Promise.all(faces.map(f => document.fonts.load(f, ru).catch(() => null))), new Promise(r => setTimeout(r, 6000))]);
}

// ------------------------------------------------------------------ build
const errors = []; window.__errors = errors;
const stats = { modules: {} }; window.__stats = stats;
const seam = createSeam();      // the veil of a seamless hand-off (index.html #seam): on a page reached by one it is already up (the inline script), setProgress drives its bar, the end of main() fades it out
function setProgress(frac, label) {
  seam.progress(frac);
  const bar = $('bar'); if (bar) bar.style.transform = `scaleX(${frac})`;
  const pct = $('loadpct'); if (pct) pct.textContent = `${Math.round(frac * 100)}%`;
  const lab = $('loadlabel'); if (lab && label !== undefined) lab.textContent = label;   // '' clears the text (the 'Ready' line is CSS)
}
const LABELS = {
  environment: 'земля, набережные и деревья', streets: 'улицы, мостовые и провода', city: 'городские кварталы', rail: 'пути, платформы и поезда', landmarksA: 'Московский вокзал · площадь Восстания',
  landmarksNorth: 'Подписные Издания · дома улицы Маяковского',
  landmarksBelinsky: 'Цирк Чинизелли',
  landmarksB: 'Невский проспект', landmarksC: 'Фонтанка · Аничков мост', landmarksD: 'Владимирский собор · библиотека', landmarksE: 'Гостиный Двор · площадь Островского', landmarksF: 'Казанский собор', landmarksG: 'Дворцовая площадь · Главный штаб', landmarksH: 'Адмиралтейство · Сенатская площадь', landmarksI: 'Зимний дворец · Эрмитаж', landmarksJ: 'Исаакиевский собор', landmarksK: 'Спас на Крови · Михайловский сад', landmarksCastle: 'Михайловский замок', bridges: 'мосты', metro: 'метрополитен', props: 'скамейки, урны и киоски', traffic: 'машины, автобусы и троллейбусы',
  landmarksOktyabrsky: 'БКЗ «Октябрьский»',
  people: 'прохожие и туристы', wildlife: 'голуби, чайки и вороны', drive: 'красная машина',
};

async function build() {
  const T0 = performance.now(); stats.timing = { startMs: Math.round(T0) };      // ms since navigation start where the build began (page load + scripts), then per phase
  await loadFonts();
  stats.timing.fontsMs = Math.round(performance.now() - T0);
  const list = ONLY ? MODULE_LIST.filter(m => ONLY.includes(m)).concat(ONLY.filter(m => !MODULE_LIST.includes(m))) : MODULE_LIST;
  ctx.buildList = list;      // lib/claims.js: a landmark group only counts as owned when its module is really built
  // every module file (and its imports) is fetched and parsed in the background while the earlier modules build
  const imports = new Map(list.map((n) => { const p = import(`./world/${n}.js`); p.catch(() => {}); return [n, p]; }));
  // shader programs are compiled in parallel by the driver (KHR_parallel_shader_compile) as soon as the materials exist: the compile of the earlier modules' materials overlaps the build of the later ones
  stats.timing.earlyCompileMs = 0;
  const kickCompile = (roots) => {
    const t = performance.now(), pending = new THREE.Group();
    // Compile only this module's meshes. Recompiling the growing city after
    // every landmark repeats the same driver work dozens of times. This is
    // a traversal view, without reparenting objects or duplicating scene lights.
    for (const root of roots) root.traverse(o => { if (o.isMesh || o.isPoints || o.isLine || o.isSprite) pending.children.push(o); });
    try { renderer.setRenderTarget(pipeline.targets.rtColor); renderer.compile(pending, camera, scene); }
    catch (e) { /* the final compile reports it */ }
    finally { renderer.setRenderTarget(null); stats.timing.earlyCompileMs += performance.now() - t; }
  };
  let i = 0;
  for (const name of list) {
    setProgress(i / (list.length + 1), `${(A.LABELS && A.LABELS[name]) || LABELS[name] || name}…`);
    await new Promise(r => setTimeout(r, 0));
    const t0 = performance.now();
    try {
      const mod = await imports.get(name);
      const beforeStatic = ctx.staticRoot.children.length, beforeDynamic = ctx.dynamicRoot.children.length;
      const before = beforeStatic + beforeDynamic;
      if (typeof mod.build !== 'function') throw new Error('module has no build(ctx) export');
      await mod.build(ctx);
      if (ctx.recordBake) await Promise.all(ctx.bakeUploads); // release encoded module snapshots before constructing the next one
      stats.modules[name] = { ms: Math.round(performance.now() - t0), objects: ctx.staticRoot.children.length + ctx.dynamicRoot.children.length - before };
      if (!ctx.recordBake && params.get('earlycompile') !== '0') kickCompile([...ctx.staticRoot.children.slice(beforeStatic), ...ctx.dynamicRoot.children.slice(beforeDynamic)]);
    } catch (e) {
      console.error(`[module ${name}]`, e);
      errors.push({ module: name, message: String(e && e.stack || e) });
      if (ctx.recordBake) throw e;
    }
    i++;
  }
  if (SHOT && ctx.regions) await ctx.regions.ensureAll();
  setProgress(list.length / (list.length + 1), 'последние штрихи…');
  await new Promise(r => setTimeout(r, 0));
  const TF = performance.now(); stats.timing.modulesMs = Math.round(TF - T0);
  stats.timing.earlyCompileMs = Math.round(stats.timing.earlyCompileMs);
  stats.timing.moduleWorkMs = Object.values(stats.modules).reduce((sum, m) => sum + m.ms, 0);
  // Navigation is serialized by its builder. Baking it needs neither GPU
  // uploads nor static render proxies for an otherwise unused scene.
  if (ctx.bakeNavOnly) return;
  // Roof capture reads the original static geometry with a depth override.
  // Runtime colour batches duplicate that geometry and its atlas textures;
  // constructing them for an offline bake needlessly doubles peak memory.
  if (ctx.recordBake) { zones.refresh(); return; }
  const wm = ctx.wires.build(); if (wm) { scene.add(wm); ctx.wires.setResolution(pipeline.size.x, pipeline.size.y); }
  pipeline.sectorsRoot = LOD.init(ctx.staticRoot);      // the sector groups of the visibility registry (core/lod.js): batch pieces, instanced pieces and proxies are parented per 320 m sector
  pipeline.ndSectorsRoot = LOD.ndRoot;
  const b = params.get('batch') === '1' ? batchStatic(ctx.staticRoot) : batchStatic2(ctx.staticRoot, { mat: ctx.mat, nearCell: Number(params.get('bcell')) || 192, farCell: Number(params.get('bfar')) || 640 });
  stats.batch = b; stats.timing.batchMs = Math.round(performance.now() - TF);
  LOD.scale = quality.lod || 1; if (params.has('lodscale')) LOD.scale = Number(params.get('lodscale')) || 1;      // distance LOD of the city details / static batches / street furniture (core/lod.js); ?lodscale= for A/B
  if (params.get('split') !== '0') stats.split = splitInstanced(ctx.staticRoot);       // city-wide instanced lamps / benches / posts -> one InstancedMesh per 192 m cell + distance LOD (core/spatial.js; ?split=0 to compare)
  if (params.get('fixturecells') !== '0') stats.fixtureCells = batchFixtureCells(ctx.staticRoot);
  if (params.get('compactstatic') !== '0') stats.compactStatic = compactStaticAttributes(ctx.staticRoot);
  // lazy outline proxies: scanned now, built per cell once the camera nears the ND range (core/ndproxy.js; ?ndlazy=0 = the eager build, ?ndnever=0 keeps the never-drawn far-proxy cells,
  // ?ndbudget= ms per frame, ?ndprefetch= m beyond ndFar). lodMin: the smallest LOD.scale of play (quality / ?lodscale x the drive mode factor) for the never-drawn test.
  const ndOpts = { material: pipeline.ndMat, lazy: params.get('ndlazy') !== '0', ndFar: pipeline.ndFar, lodMin: params.get('ndnever') === '0' ? 0 : (params.has('lodscale') ? Number(params.get('lodscale')) || 1 : (quality.lod || 1)) * Math.min(1, params.has('drivelod') ? Number(params.get('drivelod')) : 0.7) };
  Object.assign(NDLazy, { ndFar: pipeline.ndFar, onBuilt: (m) => zones.attach(m) }); ctx.ndLazy = NDLazy;
  if (params.has('ndbudget')) NDLazy.budget = Number(params.get('ndbudget')); if (params.has('ndprefetch')) NDLazy.prefetch = Number(params.get('ndprefetch'));
  if (params.get('nd') !== '0') stats.nd = buildNDProxy(ctx.staticRoot, ndOpts);       // one normal / depth draw per cell instead of one per mesh (core/ndproxy.js; ?nd=0 turns it off)
  stats.unifiedColor = unifyInstanceColor(scene);        // instanced meshes sharing a material all carry an instance colour (no program flips, core/renderer.js)
  stats.shadowMats = assignShadowMaterials(scene);      // instanced casters get their own depth material (core/renderer.js)
  pipeline.ndRoots = [ctx.dynamicRoot]; stats.ndStatic = pipeline.refreshND(ctx.staticRoot);      // the un-proxied layer-0 meshes draw the outline source with per-state nd materials (core/renderer.js)
  if (params.get('nofreeze') !== '1' && params.get('nofreeze') !== 'static') { ctx.staticRoot.traverse((o) => { if (!o.userData.dynamic) { o.updateMatrix(); o.matrixAutoUpdate = false; } }); ctx.staticRoot.updateMatrixWorld(true); pipeline.frozenRoot = ctx.staticRoot; }     // the static scene never moves: no per-frame matrix work for ~2 700 objects
  if (params.get('noempty') !== '1') ctx.dynamicRoot.traverse((o) => { if (o.isInstancedMesh && !o.userData.noEmptyCull) pipeline.emptyCull.push(o); });      // empty instanced meshes are not drawn (core/renderer.js)
  ctx.onRegionAttach = group => {
    if (params.get('nd') !== '0') buildNDProxy(group, ndOpts);      // (lazy: a scan only, the cells are built by NDLazy.update)
    assignShadowMaterials(group);
    group.traverse(o => { if (!o.userData.dynamic) { o.updateMatrix(); o.matrixAutoUpdate = false; } });
    group.updateMatrixWorld(true);
    if (pipeline.ndRoots) pipeline.addND(group);
  };
  zones.refresh();           // collect the undergroundOnly / surfaceOnly objects (after the batching merged them) and apply the visibility for the camera
  const TC = performance.now();
  stats.timing.finalizeMs = Math.round(TC - TF - stats.timing.batchMs);
  // the colour pass draws into a render target (linear output colour space): compiling against the canvas would build every program twice (once here, once in the first frame: ~10 s)
  try { renderer.setRenderTarget(pipeline.targets.rtColor); if (params.get('async') === '0') renderer.compile(scene, camera); else await renderer.compileAsync(scene, camera); } catch (e) { console.warn(e); } finally { renderer.setRenderTarget(null); }
  stats.timing.compileMs = Math.round(performance.now() - TC); stats.timing.buildMs = Math.round(performance.now() - T0);
  setProgress(1, '');
}

// ------------------------------------------------------------------ player / camera
const player = new Player(camera, canvas, ctx.physics, L.WORLD.play);
ctx.playerObj = player;
player.solidAt = L.insideBuilding;
player.clampXZ = L.clampToPlay;                       // the play area is a union of rectangles (layout.js): nobody walks into the empty notches
createWaterView({ ctx, camera, physics: ctx.physics });      // the veil under the water surface (walking, driving, flying alike: it follows the camera)
ctx.ui = createUI({ player, toast: showToast });
ctx.interact = createInteract({ camera, player, ui: ctx.ui });
createTouchControls({ ctx, player, canvas, params });      // null on desktop; on a phone it owns every touch element and feeds player / ctx.interact / ctx.drive (core/touch.js)
if (params.has('smooth')) player.smoothing = Math.max(0, Number(params.get('smooth')) || 0) / 1000;      // look easing in ms (default 40, 0 = raw)
// ?cam=x,z,yaw,pitch (standing)  |  x,y,z,yaw,pitch (free camera at eye height y, also underground)  |  x,y,z,yaw,pitch,1 (STANDING on the highest surface not above y: feet level)
function parseCam(s) {
  const v = s.split(',').map(Number);
  if (v.length === 4) player.setPose(v[0], v[1], v[2], v[3]);
  else if (v.length >= 5) player.setPose(v[0], v[2], v[3], v[4], v[1], { stand: v.length >= 6 && !!v[5] });
}
window.__setCam = (x, y, z, yaw, pitch, stand = false) => { if (y === null || y === undefined) player.setPose(x, z, yaw, pitch); else player.setPose(x, z, yaw, pitch, y, { stand: !!stand }); };

const VIEWS = Object.fromEntries(L.VIEWS.map((v) => [v.key, v]));

async function goToView(v) {
  if (ctx.gates && ctx.gates.traveling) return;      // an area hop is under way (preflight / veil): no other travel may clear its freeze
  ctx.travelPending = true;
  try {
    if (ctx.regions) { showToast('Загрузка места…'); await ctx.regions.ensureAt(v.x, v.z); }
    let placed = true;      // review fix: drive.place() answers false when no free spot is within 40 m (the garden keeps the cars out): the car stays, so the label and the area name must not say it arrived
    if (ctx.drive?.active) placed = ctx.drive.place(v.x, v.z, v.yaw) !== false; else player.setPose(v.x, v.z, v.yaw, v.pitch);
    if (!placed) { showToast('Сюда на машине нельзя: выйдите из неё (E) · Cars cannot go there: get out first (E)'); return; }
    if (ctx.gates) ctx.gates.teleported();      // (a jump is no speed: the gate's velocity estimate starts over)
    showToast(v.label); areaName = areaAt(v.x, v.z);      // the place label keeps its 3.8 s: the area toast fires only when the player walks into a different area
  } catch (e) { console.error('[travel]', e); showToast('Не удалось загрузить место. Попробуйте ещё раз.'); }
  finally { ctx.travelPending = false; }
}

// ------------------------------------------------------------------ simulation
let simT = params.has('t') ? Number(params.get('t')) : 10; // sim seconds at the start (animations are pure functions of t)
function stepUpdates(dt, t) {
  ctx.time = t; ctx.shared.uTime.value = t;
  ctx.shared.uGust.value = 0.5 + 0.28 * Math.sin(t * 0.37) + 0.14 * Math.sin(t * 1.13 + 1.7) + 0.08 * Math.sin(t * 2.9 + 0.4);
  ctx.player.position.copy(player.pos);
  for (const fn of ctx._updates) { try { fn(dt, t); } catch (e) { if (!fn.__err) { fn.__err = 1; console.error('update error', e); errors.push({ module: 'update', message: String(e && e.stack || e) }); } } }
}
/** GPU benchmark: renders n frames back-to-back (forcing sync) and returns ms/frame + counts. */
window.__bench = (n = 30) => {
  const gl = renderer.getContext(); const px = new Uint8Array(4);
  if (NDLazy.update(camera.position, { budget: 0 })) LOD.update(player.pos, camera, lodOpts);      // (a pose set without a frame in between: its outline cells exist before the timed renders, core/ndproxy.js)
  pipeline.render(scene, camera, sunDir, simT); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const t0 = performance.now(); let js = 0;
  for (let i = 0; i < n; i++) { renderer.info.reset(); sky.update(simT, camera); const a = performance.now(); pipeline.render(scene, camera, sunDir, simT); js += performance.now() - a; }
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const ms = (performance.now() - t0) / n;
  // ms = wall time per frame including the GPU; jsMs = the JavaScript / driver time of pipeline.render alone (frames queue up when the GPU is slower: jsMs << ms means GPU bound)
  return { ms: +ms.toFixed(2), jsMs: +(js / n).toFixed(2), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, programs: renderer.info.programs?.length };
};
/** Draw-call diagnostics: mesh counts by root / material kind (for performance work). */
window.__diag = () => {
  const out = { static: {}, dynamic: {}, other: {} };
  const kind = (o) => {
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    let k = o.isInstancedMesh ? 'inst:' : '';
    k += m.type.replace('Material', '');
    if (m.map) k += '+map'; if (m.transparent) k += '+transp'; if (m.alphaTest > 0) k += '+atest'; if (m.vertexColors) k += '+vc';
    return k;
  };
  const walk = (root, bucket) => root.traverse((o) => { if (o.isMesh || o.isLine || o.isPoints) { const k = kind(o); bucket[k] = (bucket[k] || 0) + 1; } });
  walk(ctx.staticRoot, out.static); walk(ctx.dynamicRoot, out.dynamic);
  scene.children.forEach((c) => { if (c !== ctx.staticRoot && c !== ctx.dynamicRoot) walk(c, out.other); });
  // dynamic by top-level child name
  out.dynamicTop = {}; ctx.dynamicRoot.children.forEach((c) => { let n = 0; c.traverse((o) => { if (o.isMesh) n++; }); const k = c.name || c.type; out.dynamicTop[k] = (out.dynamicTop[k] || 0) + n; });
  out.textures = new Set(); ctx.staticRoot.traverse((o) => { if (o.material && o.material.map) out.textures.add(o.material.map.uuid); }); out.textures = out.textures.size;
  return out;
};
/** test hook: advance the simulation by dt seconds and run the updates (used by the flicker tests; no render) */
window.__advance = (dt) => { simT += dt; player.time = simT; if (player.ride) player.update(0); stepUpdates(dt, simT); return simT; };
window.__sim = (target, dt = 1 / 30) => { let t = 0; while (t < target) { stepUpdates(dt, t); t += dt; } simT = target; stepUpdates(0, simT); };

// ------------------------------------------------------------------ HUD
let areaName = '';
const areaAt = (x, z) => L.areaAt(x, z);      // squares, landmark buildings, then the nearest named street (layout.AREAS)
let toastTimer = 0;
function showToast(name) {
  if (isTouch && ctx.minimap) { ctx.minimap.showNotice(name); return; }
  const el = $('toast'); if (!el) return;
  el.querySelector('.t-name').textContent = name;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3800);
}
// Flight HUD: the Fly chip shows the mode and the altitude, toasts explain take-off, landing and a refused landing.
const flyBtn = $('fly');
const FLY_TOAST = {
  on: isTouch ? 'Полёт · Flying' : 'Полёт · Flying — Space/E up · Q/C down · F lands',
  off: 'Посадка · Landing',
  roof: isTouch ? 'На крыше · Rooftop' : 'На крыше · On the roof — F to take off',
  blocked: 'Здесь не приземлиться · No room to land here',
  underground: 'Под землёй не полететь · No flight underground',
  ride: 'В вагоне не полететь · No flight on board',
};
player.onFly = (r) => showToast(FLY_TOAST[r]);
player.onRescue = () => showToast('Вернули на твёрдый пол · Back on solid ground');
let flyLabel = '';
function flyTick() {
  const on = player.fly;
  if (on !== document.body.classList.contains('flying')) { document.body.classList.toggle('flying', on); if (flyBtn) flyBtn.setAttribute('aria-pressed', String(on)); }
  if (!flyBtn) return;
  const label = on ? `Fly · ${Math.round(camera.position.y)} m` : 'Fly';
  if (label !== flyLabel) { flyLabel = label; flyBtn.textContent = label; }
}
let coordsText = '';
function coordsTick() {      // tiny debug readout, bottom right: the same x / z / yaw / pitch that ?cam=x,z,yaw,pitch takes (plus the eye height y)
  const el = $('coords'); if (!el) return;
  const p = camera.position, deg = 180 / Math.PI, yaw = ((player.yaw * deg) % 360 + 540) % 360 - 180;
  const text = `x ${p.x.toFixed(1)} · z ${p.z.toFixed(1)} · y ${p.y.toFixed(1)} · yaw ${yaw.toFixed(0)}° · pitch ${(player.pitch * deg).toFixed(0)}°`;
  if (text !== coordsText) { coordsText = text; el.textContent = text; }
}
/** L: copy the current pose silently (no toast) as `x,y,z,yaw,pitch`, the 5-number form of ?cam= and tools/shot.mjs --cams */
function copyPose() {
  const p = camera.position, deg = 180 / Math.PI, f = (v, d) => +v.toFixed(d);
  const text = [f(p.x, 1), f(p.y, 1), f(p.z, 1), f(player.yaw * deg, 1), f(player.pitch * deg, 1)].join(',');
  const fallback = () => { try { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } catch (e) {} };
  try { navigator.clipboard.writeText(text).catch(fallback); } catch (e) { fallback(); }
}
// The street map (core/minimap.js): the same round map on foot, flying and driving; it follows the car while driving, hides underground / in the metro (street names would be wrong there).
const minimap = createMinimap();
ctx.minimap = minimap; window.__minimap = minimap;
let mmLast = performance.now();
function minimapTick() {
  const now = performance.now(), dt = Math.min(0.1, (now - mmLast) / 1000); mmLast = now;
  const hide = player.isUnderground() || player.riding;
  minimap.setActive(!hide);
  if (hide) return;
  const car = ctx.drive && ctx.drive.active ? ctx.drive.car : null;
  if (car) minimap.update({ x: car.x, z: car.z, yaw: car.yaw, diam: 260 + Math.min(1, car.speed / 200) * 260, car: true }, dt);
  else minimap.update({ x: player.pos.x, z: player.pos.z, yaw: player.yaw + Math.PI, diam: player.fly ? THREE.MathUtils.clamp(300 + Math.max(0, camera.position.y - 6) * 2, 300, 640) : 300, car: false }, dt);      // walker yaw: forward = (-sin, -cos), the car's is (sin, cos)
}
function hudTick(t) {
  coordsTick();
  minimapTick();
  const n = player.isUnderground() || player.riding ? '' : areaAt(player.pos.x, player.pos.z);      // the street names above are wrong underground (the metro module names its own places)
  if (n && n !== areaName) { areaName = n; if (started) showToast(n); }
  flyTick();
}

// ------------------------------------------------------------------ main loop
let started = false, last = performance.now(), fpsAcc = 0, fpsN = 0, fps = 0;
let snapWait = null;      // a pending request for the frozen frame (ctx.captureFrame, core/gates.js go()): answered by the next frame() right after pipeline.render
ctx.captureFrame = () => new Promise((resolve) => {
  const t = setTimeout(() => { if (snapWait === fn) snapWait = null; resolve(null); }, 800), fn = () => { clearTimeout(t); resolve(grabFrame(canvas)); };      // (a hidden tab draws no frames: the plain dark veil after 0.8 s)
  snapWait = fn;
});
const lodOpts = { shadowR: (quality.shadowSize || 75) * 1.6, ndFar: pipeline.ndFar };      // sectors within the sun shadow box stay drawn behind the camera (casters); proxies only within the outline range
const lodBase = params.has('lodscale') ? Number(params.get('lodscale')) || 1 : (quality.lod || 1), DRIVE_LOD = params.has('drivelod') ? Number(params.get('drivelod')) : 0.7; let driveLod = 1;      // ?drivelod=1 turns the drive mode off
function frame(now) {
  requestAnimationFrame(frame);
  if (guard.dead || document.hidden) { last = now; return; }      // a fatal card is up / the tab is hidden (the browser pauses rAF anyway; iOS standalone does not always)
  let dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (ctx.regions) ctx.regions.update(player.pos.x, player.pos.z);
  if (SHOT || ctx.travelPending || (ctx.regions && !ctx.regions.readyAt(player.pos.x, player.pos.z))) dt = 0;
  simT += dt;
  player.time = simT;
  if (!SHOT || player.ride) player.update(dt);        // screenshots do not walk, but a rider follows its frame (dt = 0)
  // depth precision (z-fighting of roads / roofs): the 24-bit buffer resolves ~z^2/(near*2^24), so the near plane grows with the eye height (0.25 m on foot, 6 m at 200 m)
  if (!window.__fixedNear) { const ny = player.ride ? 0.12 : THREE.MathUtils.clamp(0.25 + Math.max(0, camera.position.y - 4) * 0.03, 0.25, 6);      /* riding: the car wall is 0.4 m from the eye */ if (Math.abs(ny - camera.near) > 0.005) { camera.near = ny; camera.updateProjectionMatrix(); } }
  ctx.physics.refreshDynamic();
  // drive mode: above ~40 km/h the LOD distances shrink to 70 % (small things, far proxies): fewer pieces to draw while the city rushes by; eased so that nothing pops when the car brakes
  { const kmh = ctx.drive && ctx.drive.active && ctx.drive.car ? Math.abs(ctx.drive.car.speed) : 0, want = kmh > 40 ? DRIVE_LOD : 1; driveLod += (want - driveLod) * Math.min(1, dt * 2); LOD.scale = lodBase * driveLod; }
  NDLazy.update(camera.position);      // outline proxy cells near the camera: the visible ones now, the next ones within the frame budget (core/ndproxy.js), before LOD.update registers their visibility
  LOD.update(player.pos, camera, lodOpts);      // sector culling + distance LOD of the static scene (core/lod.js)
  ctx.frameStep = true; stepUpdates(dt, simT); ctx.frameStep = false;      // (a live frame: the people sim caps its micro steps per frame, world/people.js)
  try { audio.update(camera, dt); } catch (e) { if (!audio.__err) { audio.__err = 1; console.error('audio', e); } }
  ctx.interact.update();
  zones.update(dt);
  tod.update(dt);
  sky.update(simT, camera);
  renderer.info.reset();
  pipeline.render(scene, camera, sunDir, simT);
  if (snapWait) { const f = snapWait; snapWait = null; f(); }      // the frozen frame of a hand-off is read HERE, in the task of the render that drew it (the drawing buffer is not preserved)
  if (!SHOT) hudTick(simT);
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 0.5) { fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; const s = $('stats'); if (s && !s.hidden) s.textContent = `${fps.toFixed(0)} fps · ${renderer.info.render.calls} calls · ${(renderer.info.render.triangles / 1e6).toFixed(2)}M tris`; }
  stats.fps = fps; stats.calls = renderer.info.render.calls; stats.triangles = renderer.info.render.triangles;
}

/** The place teleports (keys 1..0 / Shift / Alt = the VIEWS, the Places list) are OFF for now (owner, 2026-10-25: the player walks to the places himself); ?teleports=1 brings them back for development and the tools. R (respawn at the start) stays: the way back when the player has walked or driven somewhere he cannot return from (water is walkable, docs/AREAS.md 13.7). */
{ const v = document.getElementById('ver'); if (v) v.textContent = 'v' + VERSION; }
const TELEPORTS = params.get('teleports') === '1';
if (TELEPORTS) document.documentElement.classList.add('teleports'); else { const pl = document.getElementById('places'); if (pl) pl.remove(); }

/** auto: the page started by itself after a seamless hand-off (no user gesture: no pointer lock, which the first click takes; no area toast; the audio waits for the first key / pointer, see main()) */
function start(auto) {
  if (started) { if (!auto) player.requestLock(); return; }
  started = true;
  player.enabled = true;
  document.body.classList.add('playing');
  if (!auto) player.requestLock();
  try { audio.start(); } catch (e) { console.warn(e); }
  applyHandoffAtStart();
  if (ctx.gates) ctx.gates.machine.grace(6);      // no trigger in the first seconds
  if (!auto) showToast(areaAt(player.pos.x, player.pos.z) || L.NAMES.place);
}
/** What the standard parameters cannot say, applied when the player presses Start on a page reached by a hand-off: mute, the HUD toggle, the car (docs/AREAS.md), then the URL is cleaned. */
function applyHandoffAtStart() {
  const h = ctx.handoff; if (!h || h.applied) return; h.applied = true;
  if (h.ho.mute) { audio.muted = true; const b = $('mute'); if (b) b.setAttribute('aria-pressed', 'true'); }
  if (h.ho.noui) document.body.classList.add('noui');
  if (h.mode === 'car') {
    const ok = ctx.drive && ctx.drive.arrive(h.ho.car, h.pose.x, h.pose.z, h.pose.yaw);
    if (!ok) showToast('Машину сюда не поставить: вы пешком · The car could not come along: you are on foot');
  }
  try { const u = new URL(location.href); u.searchParams.delete('ho'); u.searchParams.delete('cam'); u.searchParams.delete('fly'); u.searchParams.delete('tod'); history.replaceState(null, '', u.pathname + (u.search || '') + u.hash); } catch (e) { /* ignore */ }      // F5 now goes to the area's own start
}

/** Roofs become a walkable surface: one top-down depth capture of the drawn scene (see core/roofmap.js). Not needed for screenshots (?shot), ?noroof skips it. */
async function buildRoofMap() {
  if ((SHOT && !params.has('bake')) || params.has('noroof')) return;
  const roof = await bakedData(ctx, 'roof');
  if (roof) { ctx.physics.setRoofMap(roof); stats.roof = { cells: roof.cells, grid: `${roof.w}x${roof.h}`, res: roof.res, cached: true }; return; }
  if (ctx.regions) await ctx.regions.ensureAll();
  try {
    const rm = captureRoofMap(renderer, scene, ctx.staticRoot, L.groundFootprints(), ctx.physics, { res: isTouch ? 1 : 0.5 });   // 0.5 m cells (~70 MB while capturing); 1 m on phones
    if (rm) { ctx.physics.setRoofMap(rm); stats.roof = { cells: rm.cells, grid: `${rm.w}x${rm.h}`, res: rm.res, ms: Math.round(rm.ms) }; }
  } catch (e) { console.warn('roof map failed (roofs stay unwalkable):', e); }
}

async function main() {
  // a page and its area module must agree (a stale cached HTML with another page's modules, or a wrong import map, would otherwise build the wrong world): <html data-area> names the area
  const pageArea = document.documentElement.dataset.area || 'strip';
  if (pageArea !== A.ID) throw new Error(`This page is the area "${pageArea}" but its area module is "${A.ID}" (reload the page; docs/AREAS.md)`);
  setBakeDir(A.BAKE_DIR);
  // a page reached by a hand-off (docs/AREAS.md): ?cam= plus a valid ?ho= for THIS area. The arrival pose is resolved on this area's own map (never inside a building or the river), and the
  // streamer pre-waits for the regions around it. A bad ho is ignored: the page boots from ?cam alone, as before.
  { const h = planArrival({ L, A, params });
    if (h && h.invalid) console.warn('[handoff] ignored:', h.invalid);
    else if (h) {
      ctx.handoff = h;
      guard.back = backLink(h.ho, { qName, base: location.href });      // the way back to the area he came from: the arrival card and the fatal card offer it (core/gates.js; ho is untrusted)
    } }
  const initial = ctx.handoff ? null : params.get('cam')?.split(',').map(Number);
  ctx.initialPosition = ctx.handoff ? { x: ctx.handoff.pose.x, z: ctx.handoff.pose.z } : initial ? { x: initial[0], z: initial.length === 4 ? initial[1] : initial[2] } : L.HERO;
  if (params.has('bake')) installBaker(ctx);
  ctx.baked = await openBakedWorld(ctx, params, { required: !!(ctx.handoff || A.REQUIRE_BAKE || params.has('requirebake')) });      // required: a missing or stale bake is an error card, never a minutes-long procedural build
  if (ctx.baked) ctx.regions = createRegionStreamer(ctx, ctx.baked);
  window.__regions = ctx.regions;
  await build();
  if (ctx.bakeNavOnly) { await Promise.all(ctx.bakeUploads); window.__bakeReady = true; return; }
  const TR = performance.now();
  await buildRoofMap();
  if (ctx.recordBake && ctx.physics.roof) { const { ms, ...roof } = ctx.physics.roof; ctx.recordBake('roof', roof); }      // (no wall-clock field in a product: two bakes of one source must be byte-identical)
  stats.timing.roofMs = Math.round(performance.now() - TR);
  if (ctx.recordBake) { await Promise.all(ctx.bakeUploads); window.__bakeReady = true; return; }
  if (ctx.handoff) { const p = ctx.handoff.pose; if (p.y !== null) player.setPose(p.x, p.z, p.yaw, p.pitch, p.y); else player.setPose(p.x, p.z, p.yaw, p.pitch); }
  else if (params.get('cam')) parseCam(params.get('cam')); else player.setPose(L.HERO.x, L.HERO.z, L.HERO.yaw, L.HERO.pitch);
  if (params.has('fly') && !(ctx.handoff && ctx.handoff.pose.y === null)) player.fly = true;
  player.time = simT;
  const TS = performance.now();
  if (simT > 0) window.__sim(simT, SHOT ? 1 / 30 : 0.1); else stepUpdates(0, 0);      // the start state is simulated in 0.1 s steps (the longest frame step of the loop)
  stats.timing.simMs = Math.round(performance.now() - TS);
  zones.update(0);
  tod.update(0);
  sky.update(simT, camera);
  NDLazy.update(camera.position, { budget: Infinity, prefetch: params.has('ndstart') ? Number(params.get('ndstart')) : 40 });      // the outline cells within ndFar + 40 m of the start pose, behind the loading bar (core/ndproxy.js; ?ndstart= m); the frame pump prefetches the rest
  if (stats.nd) stats.timing.ndStartMs = stats.nd.ms;
  LOD.update(player.pos, camera, lodOpts);
  // warm-up frame (in the start pose, so the zone / shadow state is the one the first real frame has): uploads the geometry / textures and builds the programs of the normal / depth and shadow
  // passes now, behind the loading bar (not as a hitch after 'Start')
  { const gl = renderer.getContext(), px = new Uint8Array(4); const tf = performance.now(); pipeline.render(scene, camera, sunDir, simT); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); stats.timing.firstFrameMs = Math.round(performance.now() - tf); }
  // upload frame: every proxy (normal / depth + far) is drawn once, so three.js uploads them all now and their CPU copies (~0.5 GB) are released at once (core/spatial.js releaseOnUpload,
  // ?keepcpu=1 keeps them) instead of staying in the heap until the player's first visit of each sector
  if (!params.has('keepcpu') && !ctx.recordBake) {
    const tu = performance.now(), gl = renderer.getContext(), px = new Uint8Array(4), proxies = [];
    ctx.staticRoot.traverse((o) => { if (o.isMesh && (o.userData.ndProxy || o.userData.farProxy)) proxies.push(o); });
    for (const s of LOD.sectors.values()) { if (s.group) s.group.visible = true; if (s.ndGroup) s.ndGroup.visible = true; }
    const was = proxies.map((o) => o.visible);
    for (const o of proxies) { o.visible = true; o.frustumCulled = false; }
    pipeline.render(scene, camera, sunDir, simT); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    proxies.forEach((o, i) => { o.frustumCulled = true; o.visible = was[i]; });      // (the zone system's hidden state must survive: it restores visibility itself)
    LOD.update(player.pos, camera, lodOpts);
    stats.timing.uploadMs = Math.round(performance.now() - tu);
  }
  stats.releasedMB = () => +(releasedStats.bytes / 1048576).toFixed(1);
  requestAnimationFrame(frame);
  if (SHOT) {
    document.body.classList.add('shot');
    // give textures/shaders a few frames, then signal readiness
    let n = 0; const wait = () => { if (++n > 6) { window.__ready = true; } else requestAnimationFrame(wait); }; requestAnimationFrame(wait);
    return;
  }
  stats.timing.readyMs = Math.round(performance.now());      // since navigation start: the intro is ready
  document.body.classList.add('loaded');
  if (ctx.regions) { stats.regions = ctx.regions.stats; ctx.regions.start(); }
  ctx.gates = createGates({ ctx, player, camera, ui: ctx.ui, tod, audio, guard, params, A, seam, inPlay: L.inPlay, captureFrame: ctx.captureFrame, isStarted: () => started, toast: showToast }); window.__gates = ctx.gates;      // null when this area has no gate (or ?gates=0)
  // a seamless hand-off (index.html: the inline script put the veil up and hid the splash, html.seam-in): the page starts BY ITSELF, no 'Continue'. A bad ho (no ctx.handoff) is no hand-off: the splash comes back.
  const seamless = document.documentElement.classList.contains('seam-in') && !!ctx.handoff;
  if (!seamless && document.documentElement.classList.contains('seam-in')) seam.remove();
  const go = $('go'); if (go) { go.disabled = false; if (ctx.handoff && !seamless) { go.textContent = 'Продолжить · Continue'; guard.arrivalLink(); } if (!seamless) go.focus(); go.addEventListener('click', () => start()); }
  canvas.addEventListener('click', () => { if (started) player.requestLock(); });
  document.addEventListener('pointerlockchange', () => { document.body.classList.toggle('locked', document.pointerLockElement === canvas); });
  addEventListener('keydown', (e) => {
    if (e.code === 'Enter' && !started) start();
    if (!started || ctx.ui.modalOpen || (ctx.gates && ctx.gates.traveling) || /^(SELECT|INPUT|TEXTAREA)$/.test(e.target?.tagName)) return;
    if (e.code === 'KeyH') document.body.classList.toggle('noui');
    if (e.code === 'KeyL' && !e.repeat && !e.ctrlKey && !e.metaKey) copyPose();
    if (e.code === 'KeyT') showToast(tod.cycle());
    if (e.code === 'KeyM') { audio.muted = !audio.muted; const b = $('mute'); if (b) b.setAttribute('aria-pressed', String(audio.muted)); }
    const drv = ctx.drive && ctx.drive.active;      // while driving the places / R move the car instead of the walker
    if (e.code === 'KeyR') { if (drv) ctx.drive.place(L.HERO.x, L.HERO.z, L.HERO.yaw); else player.setPose(L.HERO.x, L.HERO.z, L.HERO.yaw, L.HERO.pitch); if (ctx.gates) ctx.gates.teleported(); }
    if (e.code === 'Backquote' && !e.altKey && !e.shiftKey) { const s = $('stats'); if (s) s.hidden = !s.hidden; }
    const v = VIEWS[(e.altKey && e.shiftKey ? 'AltShift' : e.altKey ? 'Alt' : e.shiftKey ? 'Shift' : '') + e.code]; if (v && !e.repeat && TELEPORTS) goToView(v);     // standing on the ground there (setPose without y ends a flight); with the baked scene the regions around the destination stream in first (the Admiralty end is 2.6 km from the start pose)
  });
  if (flyBtn) flyBtn.addEventListener('click', () => { player.toggleFly(); flyBtn.blur(); });   // for touch screens / a free mouse (blur: Space must not click it again)
  const places = $('places');
  if (places && TELEPORTS) {
    for (const v of L.VIEWS) { const o = document.createElement('option'); o.value=v.key; o.textContent=v.label; places.append(o); }
    // the places of the other areas (the area module's CROSS_PLACES, docs/AREAS.md M7): one optgroup per area under its registry title; a pick asks the gate question (core/gates.js offerPlace)
    if (ctx.gates && ctx.gates.places.length) for (const id of [...new Set(ctx.gates.places.map((p) => p.area))]) {
      const og = document.createElement('optgroup'); og.label = `${REGISTRY[id].title} · ${REGISTRY[id].titleEn}`;
      for (const p of ctx.gates.places) if (p.area === id) { const o = document.createElement('option'); o.value = 'cross:' + p.key; o.textContent = p.label; og.append(o); }
      places.append(og);
    }
    places.addEventListener('change', () => {
      if (places.value.startsWith('cross:')) { const k = places.value.slice(6); places.value=''; places.blur(); if (ctx.gates) ctx.gates.offerPlace(k); return; }
      const v=VIEWS[places.value]; if (!v) return;
      goToView(v); places.value=''; places.blur();
    });
  }
  const q = $('quality');
  if (q) { q.value = qName; q.addEventListener('change', () => { try { localStorage.setItem('piter.q', q.value); } catch (e) {} location.reload(); }); }
  const mute = $('mute'); if (mute) mute.addEventListener('click', () => { audio.muted = !audio.muted; mute.setAttribute('aria-pressed', String(audio.muted)); });
  if (params.has('stats')) $('stats').hidden = false;
  if (errors.length) console.warn('module errors', errors);
  if (seamless) {
    start(true);
    // a fresh page has no user gesture: the AudioContext may start suspended and the pointer lock was skipped. The first key / pointer resumes the audio (audio.start() on a started engine only resumes it);
    // the first click on the canvas takes the pointer lock (the handler above); walking with the keys works at once.
    const kick = () => { try { audio.start(); } catch (e) { /* silent */ } if (audio.context && audio.context.state === 'running') for (const t of ['pointerdown', 'keydown']) removeEventListener(t, kick, true); };
    for (const t of ['pointerdown', 'keydown']) addEventListener(t, kick, true);
    // two frames under the veil (the live scene is drawn once at the start pose), then the blur relaxes and the frozen frame cross-fades into it
    requestAnimationFrame(() => requestAnimationFrame(() => seam.finish()));
  }
}
// a page reached by a hand-off has no pre-start warning card (the player passed it on the page he came from; with storage blocked it would come back as a second preloader): only a real crash loop still asks
(document.documentElement.classList.contains('seam-in') && !guard.crashLoop ? Promise.resolve() : guard.gate()).then(() => main()).catch(guard.fatal);
