// tools/lib/headless-world.mjs - a CPU-only world of the area for the tests that need the REAL colliders, physics and modules (docs/AREAS.md 13.7, tools/water-reachable-test.mjs): the DOM stubs of
// tools/check.mjs, a real createContext + createKnock, the area's own module list in the order of its page. `buildWorld({ modules })` builds the named modules (default: SKIP, i.e. every module
// of the page that builds colliders and is cheap on the CPU: no `city` (its colliders are plain baked data, buildings), no traffic / people / wildlife / metro / drive) and returns
// { ctx, L, THREE, built, marks }. Run it under tools/area.mjs (AREA=<id>): the layout and the data facade follow the import map of that area. Never imported by the game.
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
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
const stubEl = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, children: [], textContent: '', innerHTML: '', addEventListener() {}, removeEventListener() {}, appendChild() {}, setAttribute() {}, querySelector: () => stubEl(), querySelectorAll: () => [], getBoundingClientRect: () => ({ left: 0, top: 0, width: 1, height: 1 }), setPointerCapture() {}, remove() {}, width: 1, height: 1, getContext: () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } }) });
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

const imp = (p) => import(pathToFileURL(path.join(root, p)).href);
/** the modules of a page that a CPU test leaves out: the baked city, the moving crowds, the metro and the car interface */
export const SKIP = ['city', 'traffic', 'people', 'wildlife', 'metro', 'drive'];
export async function buildWorld({ modules = null, skip = SKIP, quiet = true, log = null, season = 'summer' } = {}) {
  const THREE = await import('three');
  const { createContext } = await imp('src/core/ctx.js');
  const { createKnock } = await imp('src/core/knock.js');
  const L = await imp('src/world/layout.js');
  const { mainModules } = await imp('tools/modules-list.mjs');
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 2500);
  camera.position.set(0, 1.6, 30);
  const quality = { name: 'medium', pixelRatio: 1, msaa: 4, shadowMap: 2048, shadowSize: 70, petals: 0.6 };
  const ctx = createContext({ scene, camera, renderer: null, audio: null, quality, sunDir: new THREE.Vector3(...L.SUN_DIR).normalize() });
  ctx.season = ctx.shared.season = season;
  ctx.physics.frozenRivers = season === 'winter';
  const all = mainModules(), want = modules ? all.filter((m) => modules.includes(m)) : all.filter((m) => !skip.includes(m));
  ctx.buildList = want.slice();      // lib/claims.js: a landmark group counts as owned when its module is in the build list
  ctx.sky = { sun: new THREE.DirectionalLight(), hemi: new THREE.HemisphereLight(), uniforms: {} };
  ctx.knock = createKnock(ctx);
  const origWarn = console.warn, origLog = console.log, origErr = console.error;
  if (quiet) { console.warn = () => {}; console.log = () => {}; }
  const built = [], marks = {}, errors = [];
  console.error = (...a) => { errors.push(a.map((x) => (x && x.stack) || String(x)).join(' ').slice(0, 300)); };
  try {
    for (const name of want) {
      const before = ctx.physics.items.length, t0 = Date.now();
      const mod = await imp(`src/world/${name}.js`);
      await mod.build(ctx);
      marks[name] = [before, ctx.physics.items.length]; built.push(name);
      if (log) log(`  built ${name}: ${ctx.physics.items.length - before} colliders, ${Date.now() - t0} ms`);
    }
  } finally { console.warn = origWarn; console.log = origLog; console.error = origErr; }
  return { ctx, L, THREE, built, marks, errors };
}
