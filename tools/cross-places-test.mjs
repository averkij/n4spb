// tools/cross-places-test.mjs - CPU test of the CROSS_PLACES tables of the area modules and of the door gates (milestone M7, docs/AREAS.md; core/gates.js offerPlace / the door items).
// Runs AS ONE AREA (the destination): node tools/area.mjs <area> tools/cross-places-test.mjs  (or for every real area: node tools/each-area.mjs tools/cross-places-test.mjs; the strip is the default).
//   1. the SHAPE of every area's table (all areas, loaded like areas-test does): rows with key / Russian label / area / gate / view / x / z / yaw / pitch, unique keys, the area is another real area, the gate
//      leaves the table's area and leads to the row's area, 4-6 rows toward each real neighbour, the row equals the VIEWS row it names (x, z, pitch exact, yaw within 0.01 degrees);
//   2. every row that points AT THIS AREA, with the static world of this area built headless (the predicates of tools/views-check.mjs: 10 m inside the play area, off the roadway, on the ground, not in a collider,
//      not inside a building, a free 6 m ahead, a HUD area name) and the arrival contract of core/handoff.js (resolveArrival with the real probe: a walker lands exactly there (direct), a car within the 60 m ring
//      on a lane, never at the HERO);
//   3. every door gate TO this area: its pose passes the same checks and planArrival with a door hand-off lands there on foot; every door gate FROM this area: a walker can stand within r of the door point
//      (a spot around it that is on the ground, outside every collider and building: the interact item is reachable);
//   4. (the North) the real indoor zone of the Podpisnye Izdaniya bookstore (core/zones.js, registered by landmarksNorthFull) against the gate g2: a walker inside the shop walking toward the border is never
//      offered the strip, on the street at the same depth he is (docs/AREAS.md 8.7; the gates-test case uses a rectangle, this one the module's own zone test).
// NODE_OPTIONS=--max-old-space-size=8000. RESULT: OK / FAIL.
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { REGISTRY, GATES } from '../src/areas/registry.js';
import { makeProbe, resolveArrival, makeHo, encodeHo, camParam } from '../src/core/handoff.js';
import { planArrival, createGateMachine, isDoor, crossPlaces } from '../src/core/gates.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const here = process.env.AREA || 'strip';
let fails = 0, passes = 0;
const check = (name, fn) => { try { fn(); passes++; console.log('  ok   ' + name); } catch (e) { fails++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n').slice(0, 8).join('\n       ')); } };
const num = (v) => typeof v === 'number' && Number.isFinite(v);
const real = Object.values(REGISTRY).filter((a) => a.status !== 'planned');

// ---------------------------------------------------------------- DOM stubs (the same as tools/views-check.mjs: the static modules draw labels on canvases)
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
globalThis.document = {
  createElement: (t) => (t === 'canvas' ? new FakeCanvas() : { style: {}, addEventListener() {}, appendChild() {}, setAttribute() {} }),
  createElementNS: (ns, t) => (t === 'canvas' ? new FakeCanvas() : { style: {} }),
  fonts: { load: async () => [] }, body: { appendChild() {} }, addEventListener() {},
};
globalThis.Image = class { constructor() { this.width = 1; this.height = 1; } addEventListener() {} };
globalThis.HTMLCanvasElement = FakeCanvas; globalThis.OffscreenCanvas = FakeCanvas;
globalThis.requestAnimationFrame = (f) => setTimeout(() => f(Date.now()), 16);
globalThis.addEventListener = () => {};
globalThis.innerWidth = 1280; globalThis.innerHeight = 720; globalThis.devicePixelRatio = 1;
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
globalThis.performance = globalThis.performance || { now: () => Date.now() };

// ---------------------------------------------------------------- 1. the tables of every area (shape, gates, the VIEWS row they copy)
const L = await import(pathToFileURL(path.join(root, 'src/world/layout.js')).href);      // this area's layout (the remap of tools/area.mjs)
/** the area module of a registry row from its real file. This process may run under a remap that points src/world/area.js at another area's file, so the strip's module is imported with a
 *  query string (a different URL: the loader hook of tools/lib/area-hooks.mjs matches resolved URLs; src/world/area.js has no import of its own that the remap could touch). */
async function areaModule(row) {
  const file = row.id === 'strip' ? 'src/world/area.js' : row.remap?.['src/world/area.js'];
  if (!file) throw new Error(`area ${row.id}: no area module file`);
  return import(pathToFileURL(path.join(root, file)).href + (row.id === 'strip' ? '?cross-places' : ''));
}
const modules = new Map();
for (const a of real) { try { modules.set(a.id, await areaModule(a)); } catch (e) { check(`area ${a.id}: its area module loads`, () => { throw e; }); } }
const viewsOf = (id) => modules.get(id).makeViews({ yawToward: L.yawToward }).VIEWS;
console.log(`cross places (this process is the area ${here}):`);
const toHere = [];      // rows of other areas' tables that point at this area
for (const a of real) {
  const A = modules.get(a.id); if (!A) continue;
  const table = A.CROSS_PLACES;
  check(`area ${a.id}: CROSS_PLACES is an array of well-formed rows with unique keys (key, Russian label, area, gate, view, x, z, yaw, pitch)`, () => {
    assert(Array.isArray(table), 'CROSS_PLACES must be an array (empty when the area offers nothing)');
    const keys = new Set();
    for (const p of table) {
      assert(p && typeof p === 'object', 'row'); assert(typeof p.key === 'string' && /^[a-z0-9-]{2,40}$/.test(p.key), 'key ' + p.key); assert(!keys.has(p.key), 'duplicate key ' + p.key); keys.add(p.key);
      assert(typeof p.label === 'string' && /[А-Яа-яЁё]/.test(p.label) && p.label.length <= 80, `${p.key}: label`);
      assert(REGISTRY[p.area] && REGISTRY[p.area].status !== 'planned' && p.area !== a.id, `${p.key}: area ${p.area} is not another real area`);
      assert(typeof p.gate === 'string' && typeof p.view === 'string', `${p.key}: gate / view`);
      for (const k of ['x', 'z', 'yaw', 'pitch']) assert(num(p[k]), `${p.key}.${k}`);
      assert(Math.abs(p.yaw) <= 180 && p.pitch >= -30 && p.pitch <= 60, `${p.key}: yaw / pitch range`);
    }
  });
  check(`area ${a.id}: every row's gate leaves ${a.id} and leads to the row's area (crossPlaces of core/gates.js keeps every row), 4-7 rows toward each real neighbour`, () => {
    const kept = crossPlaces(table, a.id, GATES); assert.equal(kept.length, table.length, 'a row names a gate that does not lead from this area to its area');
    for (const b of real) if (b.id !== a.id && GATES.some((g) => !g.dev && g.from === a.id && g.to === b.id)) { const n = table.filter((p) => p.area === b.id).length; if (n === 0 && GATES.some((g) => g.kind === 'edge' && g.from === a.id && g.to === b.id)) continue; /* the Places list is off in the live areas (docs/AREAS.md 13.5): an edge-gate pair needs rows only where some are authored */ assert(n >= 4 && n <= 7, `${n} rows toward ${b.id} (4-6 wanted)`); }
  });
  check(`area ${a.id}: every row copies the VIEWS row it names in its area (x, z, pitch exact, yaw within 0.01 degrees)`, () => {
    for (const p of table) {
      if (!modules.get(p.area)) continue;
      const v = viewsOf(p.area).find((q) => q.key === p.view); assert(v, `${p.key}: no VIEWS row ${p.view} in ${p.area}`);
      assert.equal(p.x, v.x, `${p.key}.x`); assert.equal(p.z, v.z, `${p.key}.z`); assert.equal(p.pitch, v.pitch, `${p.key}.pitch`); assert(Math.abs(p.yaw - v.yaw) < 0.01, `${p.key}.yaw ${p.yaw} vs ${v.yaw.toFixed(3)}`);
    }
  });
  for (const p of table) if (p.area === here) toHere.push({ ...p, from: a.id });
}

// ---------------------------------------------------------------- 2. the world of this area (the static modules, like views-check)
const THREE = await import('three');
const { createContext } = await import(pathToFileURL(path.join(root, 'src/core/ctx.js')).href);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 2500);
const sunDir = new THREE.Vector3(...L.SUN_DIR).normalize();
const quality = { name: 'high', pixelRatio: 1, msaa: 4, shadowMap: 4096, shadowSize: 75, petals: 1 };
const ctx = createContext({ scene, camera, renderer: null, audio: null, quality, sunDir });
ctx.sky = { sun: new THREE.DirectionalLight(), hemi: new THREE.HemisphereLight(), uniforms: {} };
const zonesAdded = []; ctx.zones = { add(def) { zonesAdded.push(def); return { ...def, remove() {} }; }, reveal() { return { remove() {} }; } };      // the indoor zones the modules register (core/zones.js on the page)
const { mainModules, DYNAMIC } = await import(pathToFileURL(path.join(root, 'tools/modules-list.mjs')).href);
ctx.buildList = mainModules();
const t0 = Date.now();
for (const m of ctx.buildList) { if (DYNAMIC.includes(m)) continue; const mod = await import(pathToFileURL(path.join(root, 'src/world/' + m + '.js')).href); await mod.build(ctx); }
console.log(`  (the static world of ${here} built headless in ${((Date.now() - t0) / 1000).toFixed(0)} s: ${ctx.buildList.filter((m) => !DYNAMIC.includes(m)).length} modules)`);
const net = ctx.services.streets && ctx.services.streets.net, ph = ctx.physics;
const dir = (yaw) => { const b = -yaw * Math.PI / 180; return [Math.sin(b), -Math.cos(b)]; };
/** the problems of a pose (empty = fine): the predicates of tools/views-check.mjs */
function problems(v) {
  const notes = [];
  const cover = net && net.cover ? net.cover(v.x, v.z, {}) : null;
  if (cover === null) notes.push('NO streets net.cover');
  else if (cover > -0.6) notes.push(`on the roadway (cover ${cover.toFixed(2)})`);
  if (!L.inPlay(v.x, v.z, 10)) notes.push('not 10 m inside the play area');
  const g = ph.groundHeight(v.x, v.z, 10, false);
  if (!Number.isFinite(g)) notes.push('no ground'); else if (g < -0.5 || g > 1.5) notes.push(`ground height ${g.toFixed(2)}`);
  const p = { x: v.x, z: v.z }; ph.resolve(p, 0.35, Number.isFinite(g) ? g : 0, 1.7);
  const push = Math.hypot(p.x - v.x, p.z - v.z); if (push > 0.05) notes.push(`inside a collider (pushed ${push.toFixed(2)} m)`);
  if (L.insideBuilding(v.x, v.z, 0.8)) notes.push('inside a building');
  const [dx, dz] = dir(v.yaw); let wall = Infinity; for (let d = 1; d < 250; d += 0.5) { if (L.buildingAt(v.x + dx * d, v.z + dz * d)) { wall = d; break; } }
  if (wall < 6) notes.push(`a wall ${wall.toFixed(1)} m ahead`);
  const area = L.areaAt(v.x, v.z); if (/^Санкт-Петербург/.test(area)) notes.push('HUD area is the city fallback');
  return notes;
}
const probe = makeProbe(L);
console.log(`places that point at ${here} (${toHere.length} rows), with the real world:`);
if (!toHere.length) console.log('  (no table of another area lists a place of this area)');
for (const p of toHere) {
  check(`${p.from} -> ${here} "${p.label}" (${p.key}, ${p.x}, ${p.z}, yaw ${p.yaw}): the pose passes the views-check predicates`, () => { const n = problems(p); assert.equal(n.length, 0, n.join('; ')); });
  check(`${p.key}: the arrival contract lands exactly there (resolveArrival direct; planArrival via place, on foot and with a car: the pose is a walker's, drive.arrive parks the car beside it)`, () => {
    const w = resolveArrival(probe, { x: p.x, z: p.z, yaw: p.yaw }, 'walk', null); assert.equal(w.how, 'direct', `walk: ${w.how}, moved ${w.moved.toFixed(1)} m`);
    assert.equal(p.yaw, Math.round(p.yaw * 100) / 100, 'yaw with more than 2 decimals: ?cam= carries 2');
    for (const car of [null, { id: 'coupe', view: 0, d: [0, 0, 0, 0] }]) {
      const q = new URLSearchParams({ cam: camParam({ x: p.x, z: p.z, yaw: p.yaw, pitch: p.pitch }, false), ho: encodeHo(makeHo({ from: p.from, to: here, via: 'place', gate: p.gate, car })) });
      const h = planArrival({ L, A: { ID: here }, params: q }); assert(h && !h.invalid, JSON.stringify(h)); assert.equal(h.how, 'direct', (car ? 'car: ' : 'walk: ') + h.how); assert.equal(h.mode, car ? 'car' : 'walk');
      assert.deepEqual([h.pose.x, h.pose.z, h.pose.yaw, h.pose.pitch, h.pose.y], [p.x, p.z, p.yaw, p.pitch, null]);
    }
  });
}

// ---------------------------------------------------------------- 3. the door gates
console.log('door gates:');
const doors = GATES.filter(isDoor);
if (!doors.some((d) => d.from === here || d.to === here)) console.log('  (no door leads from or to this area)');
for (const d of doors.filter((g) => g.to === here)) {
  check(`door ${d.id} -> ${here}: the arrival pose (${d.pose.x}, ${d.pose.z}) passes the views-check predicates and planArrival lands there on foot`, () => {
    const n = problems(d.pose); assert.equal(n.length, 0, n.join('; '));
    const q = new URLSearchParams({ cam: camParam(d.pose, false), ho: encodeHo(makeHo({ from: d.from, to: here, via: 'door', gate: d.id })) });
    const h = planArrival({ L, A: { ID: here }, params: q }); assert(h && !h.invalid, JSON.stringify(h)); assert.equal(h.mode, 'walk'); assert.equal(h.how, 'direct'); assert.deepEqual([h.pose.x, h.pose.z], [d.pose.x, d.pose.z]);
  });
}
for (const d of doors.filter((g) => g.from === here)) {
  check(`door ${d.id} from ${here}: a walker can stand within ${d.r} m of the door point (${d.at.x}, ${d.at.z}): a spot around it on the ground, outside every collider and building, inside the play area`, () => {
    const spots = [];
    for (let a = 0; a < 16; a++) for (const r of [1.5, 2.5, d.r - 0.5]) {
      const x = d.at.x + Math.cos(a / 16 * 2 * Math.PI) * r, z = d.at.z + Math.sin(a / 16 * 2 * Math.PI) * r;
      if (!L.inPlay(x, z, 10) || L.insideBuilding(x, z, 0.3)) continue;
      const g = ph.groundHeight(x, z, 10, false); if (!Number.isFinite(g) || g < -0.5 || g > 1.5) continue;
      const p = { x, z }; ph.resolve(p, 0.35, g, 1.7); if (Math.hypot(p.x - x, p.z - z) > 0.05) continue;
      spots.push([+x.toFixed(1), +z.toFixed(1)]);
    }
    assert(spots.length >= 3, `only ${spots.length} standing spots within ${d.r} m of the door`);
    console.log(`       ${spots.length} standing spots, e.g. ${spots.slice(0, 3).map((s) => `(${s[0]}, ${s[1]})`).join(' ')}`);
  });
}

// ---------------------------------------------------------------- 4. the indoor zone of the bookstore against g2 (the North)
const shop = zonesAdded.find((z) => z.id === 'podpisnye-shop'), g2 = GATES.find((g) => g.id === 'g2');
if (here === 'north') {
  check('the bookstore registers its indoor zone (podpisnye-shop) and publishes its frame (ctx.services.podpisnye)', () => { assert(shop && typeof shop.test === 'function'); assert(ctx.services.podpisnye && ctx.services.podpisnye.world); });
  if (shop && ctx.services.podpisnye && g2) {
    const S = ctx.services.podpisnye, B = S.bounds, mid = S.world((B.u0 + B.u1) / 2, (B.v0 + B.v1) / 2);
    const DT = 1 / 30, eye = 1.7;
    const walk = (x, zA, zB, indoors) => {      // standing 2 s, then walking north toward the border at 1.5 m/s; the gate's own state machine with the real g2 row
      const m = createGateMachine({ gates: [g2], config: { graceS: 0 } }); let offer = null, chip = false;
      for (let i = 0; i < 2 / DT; i++) m.update({ dt: DT, x, z: zA, mode: 'walk', blocked: false, indoors: indoors(x, zA) });
      const n = Math.ceil(Math.abs(zB - zA) / 1.5 / DT);
      for (let i = 0; i <= n && !offer; i++) { const z = zA + (zB - zA) * i / n; const r = m.update({ dt: DT, x, z, mode: 'walk', blocked: false, indoors: indoors(x, z) }); if (r.chip) chip = true; if (r.offer) offer = { z }; }
      return { offer, chip };
    };
    const inside = (x, z) => !!shop.test(x, eye, z);
    check(`the shop's own zone test: its middle (${mid.x.toFixed(1)}, ${mid.z.toFixed(1)}) is indoors, the street in front of the facade is not, and the interior lies inside the 30 m zone of g2`, () => {
      assert(inside(mid.x, mid.z)); const door = S.entrance; const street = S.world(0, 3); assert(!inside(street.x, street.z), 'the street is indoors?');
      assert(mid.z > g2.seg[0][1] - 30 - 20 && mid.z < g2.seg[0][1], `the shop middle z ${mid.z.toFixed(1)} is not inside the zone of g2 (border z ${g2.seg[0][1]})`); void door;
    });
    check('a walker inside the bookstore walking toward the border (the real zone test as indoors) gets no chip and no offer; on the street at the same depth he gets both', () => {
      const z0 = mid.z - 12, z1 = Math.min(mid.z + 8, -208);      // from deeper inside the North toward the border (the strip lies south: z grows)
      const insideRun = walk(mid.x, z0, z1, inside); assert(!insideRun.offer && !insideRun.chip, 'offered inside the shop');
      const street = S.world(0, 4); const streetRun = walk(street.x, z0, z1, inside); assert(streetRun.offer && streetRun.chip, 'not offered on the street at ' + street.x.toFixed(1));
    });
  }
} else console.log(`  (the bookstore zone check runs as the North: node tools/area.mjs north tools/cross-places-test.mjs)`);

// ---------------------------------------------------------------- 5. a CROSS_PLACES row routed through a DOOR gate (M7 polish, docs/AREAS.md 11.1)
// crossPlaces() keeps a row whose gate is a door (g3 leaves the North and leads to the strip), so the HUD list may offer it; picking it must land at the PLACE. go() used to take the door's own pose
// whenever the gate was a door (dest = door ? g.pose : ...), whatever the hand-off said: the player of such a row came out at the metro rotunda. The pin drives the real core/gates.js with fake DOM
// dependencies (no world needed); the mutant is the same source with the old line put back, and it must fail the pin.
console.log('a CROSS_PLACES row through a door gate (core/gates.js, fake DOM):');
const osMod = await import('node:os'), fsMod = await import('node:fs');
const doorG = GATES.find((g) => g.id === 'g3'), northTable = modules.get('north') ? modules.get('north').CROSS_PLACES : [];
const doorRow = northTable.length ? { ...northTable.find((p) => p.area === 'strip'), key: 'door-fixture', gate: doorG.id } : null;
const fakeUi = () => ({ open: false, asked: [], confirm(o) { this.asked.push(o); } });
/** the pin: what a pick of `row` (a place of the strip through the door g3) hands over; throws when the hand-off is wrong */
async function doorPlacePin(gatesMod) {
  const A = { ID: 'north', CROSS_PLACES: [doorRow] };
  const mk = (over = {}) => {
    const dom = { getElementById: () => null, documentElement: { classList: { contains: () => false } }, body: { classList: { contains: () => false } }, createElement: () => ({ className: '', textContent: '', append() {} }) };
    const w = { location: { href: 'http://h/north.html', search: '' }, addEventListener() {} };
      // (?gateprompt=1: this pin is about the CONTENT of the place question and the hand-off it books; the default asks nothing, see tools/gates-test.mjs)
    const api = gatesMod.createGates({ ctx: { onUpdate() {}, drive: null, ...(over.ctx || {}) }, player: { inputLock: 0, riding: false, fly: false, pos: { x: 458, z: -1350 }, yaw: 0.5, pitch: 0.1, isUnderground: () => false }, camera: { position: {} },
      ui: over.ui || fakeUi(), tod: { k: 0, variant: null }, audio: { muted: false }, guard: null, params: new URLSearchParams('devgates=1&baked=0&gateprompt=1'), A, isStarted: () => true, toast() {}, win: w, doc: dom });
    return api;
  };
  const ui = fakeUi(), api = mk({ ui });
  assert(api && api.places.length === 1 && api.places[0].key === doorRow.key && api.doors.length === 1, 'the door row is a place of the North (crossPlaces keeps it) and the door gate g3 is still registered');
  assert.equal(api.offerPlace(doorRow.key), true); assert.equal(ui.asked.length, 1);
  assert(!/Метро/.test(ui.asked[0].title) && /Новая область: Невский проспект/.test(ui.asked[0].title), 'the question of a place names the area, not the metro ride: ' + ui.asked[0].title);
  const body = (() => { const t = []; const el = () => ({ className: '', textContent: '', kids: [], append(...k) { this.kids.push(...k); } }); const dom = { createElement: el }; const b = gatesMod.promptBody(dom, gatesMod.promptTexts('strip', { gate: doorG, place: doorRow })); const walk = (n) => { if (n.textContent) t.push(n.textContent); (n.kids || []).forEach(walk); }; walk(b); return t.join(' | '); })();
  assert(body.includes(doorRow.label) && !/ротонд/.test(body), 'the sights line names the place and the scene line does not promise the rotunda: ' + body);
  let url = null; api.navigate = (u) => { url = u; };
  assert.equal(await api.go(doorG, 'place', doorRow), true); assert(url, 'no navigation');
  const [page, qs] = url.split('?'), q = new URLSearchParams(qs);
  assert.equal(page, 'strip.html'); assert.equal(q.get('cam'), camParam({ x: doorRow.x, z: doorRow.z, yaw: doorRow.yaw, pitch: doorRow.pitch }, false), `the hand-off lands at ${q.get('cam')}, not at the place ${doorRow.x},${doorRow.z} (the door pose is ${doorG.pose.x},${doorG.pose.z})`);
  const ho = (await import(pathToFileURL(path.join(root, 'src/core/handoff.js')).href)).decodeHo(q.get('ho'), { to: 'strip' }); assert(ho.ok, ho.why);
  assert.equal(ho.ho.via, 'place'); assert.equal(ho.ho.gate, doorG.id); assert.equal(ho.ho.car, null); assert.deepEqual([ho.ho.ret.x, ho.ho.ret.z], [458, -1350], 'the return pose is where the player stood');
  // a driver who picks the row walks (the door has no car) and still lands at the place; a flyer too
  const drive = { active: true, car: { x: 470, z: -1370, yaw: 0 }, vehicle: { id: 'lada' }, view: { mode: 0 }, damage: { state: { front: 0, rear: 0, left: 0, right: 0 } } };
  const d = mk({ ctx: { drive } }); let url2 = null; d.navigate = (u) => { url2 = u; }; await d.go(doorG, 'place', doorRow);
  const q2 = new URLSearchParams(url2.split('?')[1]); assert.equal(q2.get('cam'), q.get('cam')); assert.equal((await import(pathToFileURL(path.join(root, 'src/core/handoff.js')).href)).decodeHo(q2.get('ho'), { to: 'strip' }).ho.car, null, 'the car stays behind at the door');
  // the same door used as a door (E at the vestibule) is unchanged: the door's pose
  const e = mk(); let url3 = null; e.navigate = (u) => { url3 = u; }; await e.go(doorG, 'door');
  assert.equal(new URLSearchParams(url3.split('?')[1]).get('cam'), camParam(doorG.pose, false), 'via door still lands at the door pose');
}
if (doorRow) {
  const gatesUrl = pathToFileURL(path.join(root, 'src/core/gates.js')).href;
  check('the door gate g3 leaves the North for the strip, so crossPlaces keeps a row of the North\'s table that names it', () => { assert(doorG && isDoor(doorG)); assert.equal(crossPlaces([doorRow], 'north', GATES).length, 1); });
  let pinErr = null; try { await doorPlacePin(await import(gatesUrl)); } catch (e) { pinErr = e; }
  check('a place picked through the door g3 asks the place question (no metro title) and lands at the PLACE (cam, via place, gate g3, no car), a door E still lands at the door pose', () => { if (pinErr) throw pinErr; });
  {
    const src = fsMod.readFileSync(path.join(root, 'src/core/gates.js'), 'utf8').replaceAll('\r\n', '\n');
    const fixed = "const dest = via === 'place' && place ? place : door ? g.pose : null;", old = "const dest = door ? g.pose : via === 'place' && place ? place : null;";
    let mutantOk = false, why = '';
    if (!src.includes(fixed)) why = 'the fixed line was not found in core/gates.js (the mutant cannot be built; update this test)';
    else {
      const abs = (p) => pathToFileURL(path.join(root, 'src', p)).href;
      const text = src.replace(fixed, old).replace("from '../areas/registry.js'", `from '${abs('areas/registry.js')}'`).replace("from './handoff.js'", `from '${abs('core/handoff.js')}'`);
      const tmp = path.join(osMod.tmpdir(), `gates-mutant-${process.pid}.mjs`); fsMod.writeFileSync(tmp, text);
      try { await doorPlacePin(await import(pathToFileURL(tmp).href)); why = 'the pin PASSED on the mutant: it does not detect a door pose taking over a place'; } catch (e) { mutantOk = /the hand-off lands at/.test(e.message); why = mutantOk ? '' : 'the mutant failed for another reason: ' + String(e.message).slice(0, 200); }
      finally { try { fsMod.unlinkSync(tmp); } catch (e) { /* gone */ } }
    }
    check('the mutant (core/gates.js with the old line  dest = door ? g.pose : ...  put back) fails the pin at the cam assertion', () => { assert(mutantOk, why); });
  }
} else console.log('  (the North\'s table is not loaded: no door-routed row can be built)');

console.log(`cross-places-test (${here}): ${passes} passed, ${fails} failed`);
console.log(fails ? 'RESULT: FAIL' : 'RESULT: OK');
process.exit(fails ? 1 : 0);
