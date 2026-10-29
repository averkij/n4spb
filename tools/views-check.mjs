// tools/views-check.mjs - proves HERO and every VIEWS pose of src/world/layout.js with the real street network and colliders: every static module of src/main.js MODULES (environment, streets, city, the landmarks, bridges, props)
// built headless (NODE_OPTIONS=--max-old-space-size=14000); the dynamic modules (metro, traffic, people, wildlife, drive) are not needed.
// usage: node tools/views-check.mjs [--fix]   per pose: inside the play area (10 m margin), off the roadway (streets net.cover), on land (ground height), not inside a collider, a free 6 m ahead, the HUD area name; RESULT: OK / FAIL
// --land (additive) also fails a pose that stands in water (the camera would sit below the surface); every ok line then ends with the ground / water state. Without it a pose in water stays allowed (CLAUDE.md world rules).
// --fix prints the nearest passing pose (1 m grid, 30 m) for every failing one.
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

// ---------------------------------------------------------------- run
const THREE = await import('three');
const { createContext } = await import(pathToFileURL(path.join(root, 'src/core/ctx.js')).href);
const { createAudio } = await import(pathToFileURL(path.join(root, 'src/core/audio.js')).href);
const L = await import(pathToFileURL(path.join(root, 'src/world/layout.js')).href);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 2500);
const sunDir = new THREE.Vector3(...L.SUN_DIR).normalize();
const quality = { name: 'high', pixelRatio: 1, msaa: 4, shadowMap: 4096, shadowSize: 75, petals: 1 };
const ctx = createContext({ scene, camera, renderer: null, audio: null, quality, sunDir });
ctx.sky = { sun: new THREE.DirectionalLight(), hemi: new THREE.HemisphereLight(), uniforms: {} };
const { mainModules, DYNAMIC } = await import(pathToFileURL(path.join(root, 'tools/modules-list.mjs')).href);
ctx.buildList = mainModules();      // lib/claims.js: the owners of the landmark groups build, the city skips what they claim (as on the page)
for (const m of ctx.buildList) { if (DYNAMIC.includes(m)) continue; const mod = await import(pathToFileURL(path.join(root, 'src/world/' + m + '.js')).href); await mod.build(ctx); }
const net = ctx.services.streets && ctx.services.streets.net, ph = ctx.physics;
const dir = (yaw) => { const b = -yaw * Math.PI / 180; return [Math.sin(b), -Math.cos(b)]; };
const FIX = process.argv.includes('--fix'), LAND = process.argv.includes('--land');
/** the problems of a pose (empty = fine) */
function problems(v) {
  const notes = [];
  const cover = net && net.cover ? net.cover(v.x, v.z, {}) : null;
  if (cover === null) notes.push('NO streets net.cover');
  else if (cover > -0.6) notes.push(`on the roadway (cover ${cover.toFixed(2)})`);
  if (!L.inPlay(v.x, v.z, 10)) notes.push('not 10 m inside the play area');
  const g = ph.groundHeight(v.x, v.z, 10, false);
  // WATER IS REACHABLE (CLAUDE.md "World rules"): a pose in water is not a failure (the ground is then the bed, below the water level); a pose below the street that is NOT in water (a pit, a shaft) still is
  const wl = ph.waterLevel ? ph.waterLevel(v.x, v.z) : null, inWater = wl !== null && Number.isFinite(g) && g <= wl + 0.1;
  if (!Number.isFinite(g)) notes.push('no ground'); else if (g > 1.5 || (g < -0.5 && !inWater)) notes.push(`ground height ${g.toFixed(2)}`);
  if (LAND && inWater) notes.push(`in water (ground ${g.toFixed(2)} <= water level ${wl.toFixed(2)}): the eye is below the surface`);
  const p = { x: v.x, z: v.z }; ph.resolve(p, 0.35, Number.isFinite(g) ? g : 0, 1.7);
  const push = Math.hypot(p.x - v.x, p.z - v.z); if (push > 0.05) notes.push(`inside a collider (pushed ${push.toFixed(2)} m)`);
  if (L.insideBuilding(v.x, v.z, 0.8)) notes.push('inside a building');
  const [dx, dz] = dir(v.yaw); let wall = Infinity; for (let d = 1; d < 250; d += 0.5) { if (L.buildingAt(v.x + dx * d, v.z + dz * d)) { wall = d; break; } }
  if (wall < 6) notes.push(`a wall ${wall.toFixed(1)} m ahead`);
  const area = L.areaAt(v.x, v.z); if (/^Санкт-Петербург/.test(area)) notes.push('HUD area is the city fallback');
  return { notes, g, cover, area };
}
let bad = 0, n = 0;
for (const v of [{ key: 'HERO', label: 'start pose', ...L.HERO }, ...L.VIEWS]) {
  n++;
  const r = problems(v), notes = r.notes;
  if (notes.length) bad++;
  console.log((notes.length ? 'FAIL ' : 'ok   ') + v.key.padEnd(24) + ` (${v.x}, ${v.z}) ${r.area} | ${v.label}` + (notes.length ? ' :: ' + notes.join('; ') : ` (ground ${r.g.toFixed(2)}, cover ${r.cover.toFixed(1)})`));
  if (notes.length && FIX) {      // nearest pose (1 m grid, 30 m) that passes, keeping the yaw and pitch
    let best = null;
    for (let dx = -30; dx <= 30; dx++) for (let dz = -30; dz <= 30; dz++) {
      const d = Math.hypot(dx, dz); if (d > 30 || (best && d >= best.d)) continue;
      const q = { ...v, x: +(v.x + dx).toFixed(1), z: +(v.z + dz).toFixed(1) };
      const pr = problems(q); if (!pr.notes.length && pr.cover < -1.2) best = { d, q };
    }
    console.log(best ? `     fix: x: ${best.q.x}, z: ${best.q.z} (moved ${best.d.toFixed(1)} m)` : '     fix: none within 30 m');
  }
}
console.log(`${n} poses checked, ${bad} failing`);
console.log(bad ? 'RESULT: FAIL' : 'RESULT: OK');
process.exit(bad ? 1 : 0);
