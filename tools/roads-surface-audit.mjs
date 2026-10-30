// Road-surface audit (headless node, no GPU): is every DRIVABLE road drawn as ASPHALT?   (policy of the project owner: a drivable carriageway is asphalt)
// Builds the real scene (environment, landmark modules, bridges, streets, city: the order of src/main.js MODULES without the dynamic ones), collects every near-horizontal
// ground-level triangle of every built mesh (with its material / mesh / module), and for dense samples over the drivable surface finds which drawn surface is visible on TOP:
//   * every way of the street network (net.ways, not skipDraw): cross-sections every STEP metres at 5 lateral positions across the whole width (carriageway + parking pockets),
//   * the strip between paired one-way carriageways (opposite ways whose gap is < 16 m): category 'median',
//   * the junction fillets (corner asphalt patches).
// The top surface = largest y; inside 1.2 cm the more negative polygonOffset wins (layers: docs/streets-api.md); paint / wear / gutter decals (depthWrite off) are looked through.
// A sample whose top surface is not asphalt / service asphalt / lot asphalt / asphalt footway is an OFFENDER. Offenders are clustered per way and cause and classified by builder.
//
// usage: node tools/roads-surface-audit.mjs [--json file] [--report file.md] [--near x,z,r] [--step 3.5] [--cache file] [--probe x,z[,r]] [--verbose] [--census] [--max-fail N]
//   --cache f   first run builds the scene (~1 min) and stores the triangle soup in f (+ f.json); later runs reuse it (the network is rebuilt from data: seconds)
//   --probe x,z print the whole stack of drawn surfaces at that point (and 4 points around it at r m, default 0) - for pose analysis
//   --near x,z,r audit only samples within r metres of the point;   --census prints the list of ground-level meshes / materials
//   exit code 1 when offenders remain that are not on the EXCEPTIONS list (see below).
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { mainModules } from './modules-list.mjs';
import { partnerWidth, pairedStreet, projectsToSegment } from './lib/surface-median.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const JSON_OUT = flag('json', null), REPORT = flag('report', null), VERBOSE = !!flag('verbose', false), CENSUS = !!flag('census', false), CACHE = flag('cache', null);
const NEAR = flag('near', null) ? String(flag('near')).split(',').map(Number) : null;
const PROBE = flag('probe', null) ? String(flag('probe')).split(',').map(Number) : null;
const STEP = Number(flag('step', 3.5));
const log = (...a) => console.log(...a);

// ---------------------------------------------------------------- DOM stubs (as tools/check.mjs)
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
globalThis.window = globalThis; globalThis.self = globalThis;
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

const THREE = await import('three');
const imp = (p) => import(pathToFileURL(path.join(root, p)).href);
const L = await imp('src/world/layout.js');
const { AREAS, ROADS } = await imp('src/world/data/city.js');
const { buildNet, DRIVE, segInfo } = await imp('src/world/streets/net.js');
const { profMax } = await imp('src/world/streets/style.js');
const { deckAt, setDecksEnabled } = await imp('src/world/streets/decks.js');

// ---------------------------------------------------------------- 1. the scene: triangle soup of the ground-level horizontal surfaces
const ALL_MODULES = mainModules();            // the page's own list (src/main.js MODULES): never a stale copy
const BUILD = flag('modules', null) ? String(flag('modules')).split(',') : ALL_MODULES.filter((m) => !['metro', 'props', 'traffic', 'people', 'wildlife', 'drive', 'rail'].includes(m));

let MESHES = [], TRI = null, nT = 0, SKIP = new Set(), PEDONLY = new Set();
const cacheBin = CACHE && CACHE + '.bin', cacheJson = CACHE && CACHE + '.json';
if (CACHE && fs.existsSync(cacheBin) && fs.existsSync(cacheJson)) {
  const j = JSON.parse(fs.readFileSync(cacheJson, 'utf8'));
  MESHES = j.meshes; SKIP = new Set(j.skip); PEDONLY = new Set(j.pedOnly);
  const b = fs.readFileSync(cacheBin); TRI = new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4); nT = TRI.length;
  setDecksEnabled(true);
  log(`cache ${CACHE}: ${nT / 10} triangles, ${MESHES.length} (mesh, material) groups`);
} else {
  const { createContext } = await imp('src/core/ctx.js');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 2500);
  const quality = { name: 'high', pixelRatio: 1, msaa: 4, shadowMap: 4096, shadowSize: 75, petals: 1 };
  const ctx = createContext({ scene, camera, renderer: null, audio: null, quality, sunDir: new THREE.Vector3(...L.SUN_DIR).normalize() });
  ctx.buildList = ALL_MODULES;                       // claims / decks as in the page (every module counts as built)
  ctx.sky = { sun: new THREE.DirectionalLight(), hemi: new THREE.HemisphereLight(), uniforms: {} };
  const tagged = new WeakSet(), modOf = new Map();
  const tagNew = (m) => { scene.traverse((o) => { if (!tagged.has(o)) { tagged.add(o); modOf.set(o, m); } }); };
  tagNew('(boot)');
  const tBuild = Date.now();
  for (const m of BUILD) {
    const t0 = Date.now();
    try { const mod = await imp(`src/world/${m}.js`); await mod.build(ctx); log(`built ${m} ${Date.now() - t0} ms`); }
    catch (e) { log(`BUILD ERROR in ${m}: ${e && e.stack || e}`); }
    tagNew(m);
  }
  scene.updateMatrixWorld(true);
  const st = ctx.services.streets;
  if (!st) { log('FAIL: no streets service'); process.exit(1); }
  for (const w of st.net.ways) { if (w.skipDraw) SKIP.add(w.i); if (w.pedestrianOnly) PEDONLY.add(w.i); }
  log(`scene built in ${Date.now() - tBuild} ms; ${st.net.ways.length} ways`);
  // ---- collect
  TRI = new Float32Array(1 << 22);
  const pushTri = (a0, a1, a2, b0, b1, b2, c0, c1, c2, id) => {
    if (nT + 10 > TRI.length) { const n = new Float32Array(TRI.length * 2); n.set(TRI); TRI = n; }
    TRI[nT++] = a0; TRI[nT++] = a1; TRI[nT++] = a2; TRI[nT++] = b0; TRI[nT++] = b1; TRI[nT++] = b2; TRI[nT++] = c0; TRI[nT++] = c1; TRI[nT++] = c2; TRI[nT++] = id;
  };
  const meshId = new Map(), v3 = new THREE.Vector3();
  const parentsOf = (o) => { const n = []; for (let p = o.parent; p && n.length < 3; p = p.parent) if (p.name) n.push(p.name); return n.join('<'); };
  const tCol = Date.now();
  scene.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.position) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const g = o.geometry, pos = g.attributes.position, idx = g.index;
    const mw = o.matrixWorld;
    const wx = new Float32Array(pos.count), wy = new Float32Array(pos.count), wz = new Float32Array(pos.count);
    let lo = 1e9, hi = -1e9;
    for (let i = 0; i < pos.count; i++) { v3.fromBufferAttribute(pos, i).applyMatrix4(mw); wx[i] = v3.x; wy[i] = v3.y; wz[i] = v3.z; if (v3.y < lo) lo = v3.y; if (v3.y > hi) hi = v3.y; }
    if (hi < -0.3 || lo > 0.6) return;
    const groups = g.groups && g.groups.length ? g.groups : [{ start: 0, count: idx ? idx.count : pos.count, materialIndex: 0 }];
    for (const gr of groups) {
      const m = mats[gr.materialIndex || 0]; if (!m) continue;
      const decal = m.depthWrite === false;
      const key = o.name + '|' + m.name + '|' + (m.polygonOffset ? m.polygonOffsetFactor : 0) + '|' + decal + '|' + (modOf.get(o) || '?') + '|' + parentsOf(o);
      let id = meshId.get(key);
      if (id === undefined) { id = MESHES.length; meshId.set(key, id); MESHES.push({ name: o.name, mat: m.name || m.type, off: m.polygonOffset ? m.polygonOffsetFactor : 0, decal, mod: modOf.get(o) || '?', parents: parentsOf(o), tris: 0, area: 0, ymin: 1e9, ymax: -1e9 }); }
      const M = MESHES[id];
      for (let t = gr.start; t + 2 < gr.start + gr.count; t += 3) {
        const a = idx ? idx.getX(t) : t, b = idx ? idx.getX(t + 1) : t + 1, c = idx ? idx.getX(t + 2) : t + 2;
        const ux = wx[b] - wx[a], uy = wy[b] - wy[a], uz = wz[b] - wz[a], vx = wx[c] - wx[a], vy = wy[c] - wy[a], vz = wz[c] - wz[a];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz);
        if (nl < 1e-9 || Math.abs(ny) / nl < 0.85) continue;
        const ymax = Math.max(wy[a], wy[b], wy[c]), ymin = Math.min(wy[a], wy[b], wy[c]);
        if (ymax > 0.6 || ymin < -0.3) continue;
        pushTri(wx[a], wz[a], wy[a], wx[b], wz[b], wy[b], wx[c], wz[c], wy[c], id);
        M.tris++; M.area += nl / 2; if (ymin < M.ymin) M.ymin = ymin; if (ymax > M.ymax) M.ymax = ymax;
      }
    }
  });
  TRI = TRI.subarray(0, nT);
  log(`collect ${Date.now() - tCol} ms; ${nT / 10} ground-level horizontal triangles in ${MESHES.length} (mesh, material) groups`);
  if (CACHE) { fs.mkdirSync(path.dirname(path.resolve(CACHE)), { recursive: true }); fs.writeFileSync(cacheBin, Buffer.from(TRI.buffer, TRI.byteOffset, TRI.byteLength)); fs.writeFileSync(cacheJson, JSON.stringify({ meshes: MESHES, skip: [...SKIP], pedOnly: [...PEDONLY] })); log('cache written'); }
}
if (CENSUS) for (const m of MESHES.slice().sort((a, b) => b.area - a.area)) log(`  ${m.mod.padEnd(18)} ${m.name.padEnd(22)} ${String(m.mat).padEnd(20)} off ${String(m.off).padStart(5)} ${m.decal ? 'decal' : '     '} tris ${String(m.tris).padStart(7)} area ${Math.round(m.area).toString().padStart(9)} y ${m.ymin.toFixed(3)}..${m.ymax.toFixed(3)}  ${m.parents}`);

// ---------------------------------------------------------------- 2. spatial index + point query
const CELL = 4, KX = 8192;
const grid = new Map(), big = [];
const nTri = nT / 10;
for (let t = 0; t < nTri; t++) {
  const o = t * 10, x0 = Math.min(TRI[o], TRI[o + 3], TRI[o + 6]), x1 = Math.max(TRI[o], TRI[o + 3], TRI[o + 6]), z0 = Math.min(TRI[o + 1], TRI[o + 4], TRI[o + 7]), z1 = Math.max(TRI[o + 1], TRI[o + 4], TRI[o + 7]);
  const cx0 = Math.floor(x0 / CELL), cx1 = Math.floor(x1 / CELL), cz0 = Math.floor(z0 / CELL), cz1 = Math.floor(z1 / CELL);
  if ((cx1 - cx0 + 1) * (cz1 - cz0 + 1) > 900) { big.push(t); continue; }
  for (let cx = cx0; cx <= cx1; cx++) for (let cz = cz0; cz <= cz1; cz++) { const k = (cx + 2048) * KX + (cz + 2048); let l = grid.get(k); if (!l) grid.set(k, (l = [])); l.push(t); }
}
log(`index: ${grid.size} cells, ${big.length} big triangles`);
/** every drawn surface at (x, z): [{ m: mesh meta, y, t }] (decals included, flagged by m.decal) */
function stackAt(x, z) {
  const out = [], seen = new Set();
  const test = (t) => {
    const o = t * 10;
    const ax = TRI[o], az = TRI[o + 1], bx = TRI[o + 3], bz = TRI[o + 4], cx = TRI[o + 6], cz = TRI[o + 7];
    const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(d) < 1e-12) return;
    const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d, l3 = 1 - l1 - l2, e = -1e-4;
    if (l1 < e || l2 < e || l3 < e) return;
    out.push({ m: MESHES[TRI[o + 9]], y: l1 * TRI[o + 2] + l2 * TRI[o + 5] + l3 * TRI[o + 8], t });
  };
  for (const t of grid.get((Math.floor(x / CELL) + 2048) * KX + (Math.floor(z / CELL) + 2048)) || []) { if (seen.has(t)) continue; seen.add(t); test(t); }
  for (const t of big) test(t);
  return out;
}
const TIE = 0.012;
/** the visible non-decal surface: higher wins, inside TIE the more negative polygonOffset wins */
function topOf(stack) {
  let best = null;
  for (const h of stack) {
    if (h.m.decal) continue;
    if (!best || h.y > best.y + TIE || (Math.abs(h.y - best.y) <= TIE && (h.m.off < best.m.off || (h.m.off === best.m.off && h.y > best.y)))) best = h;
  }
  return best;
}
const fmtStack = (stack) => stack.slice().sort((a, b) => b.y - a.y).map((h) => `${h.m.decal ? '(decal) ' : ''}${h.m.mod}/${h.m.name}/${h.m.mat} y=${h.y.toFixed(3)} off=${h.m.off}`).join('\n      ');

if (PROBE) {
  const [px, pz, r = 0] = PROBE;
  const pts = r ? [[px, pz], [px + r, pz], [px - r, pz], [px, pz + r], [px, pz - r]] : [[px, pz]];
  for (const [x, z] of pts) { const s = stackAt(x, z), t = topOf(s); log(`probe ${x.toFixed(1)},${z.toFixed(1)}  top: ${t ? t.m.mod + '/' + t.m.name + '/' + t.m.mat + ' y=' + t.y.toFixed(3) : 'none'}\n      ${fmtStack(s)}`); }
}

// ---------------------------------------------------------------- 3. classification of the top surface
const ASPH = new Set(['pt-asphalt', 'pt-service', 'pt-lot', 'pt-foot-asph']);
const isAsphalt = (m) => (m.mod === 'streets' ? ASPH.has(m.mat) : /asphalt/i.test(m.mat));       // landmark / bridge modules name their own asphalt materials (lmG-asphaltV, lmC-asphalt, brg-asphalt)
const passages = ROADS.filter((r) => r.tunnel && r.passage && !(r.layer < 0));
const ringHas = (o, x, z) => { let ins = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) { const xi = o[i], zi = o[i + 1], xj = o[j], zj = o[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } return ins; };
const areaBoxes = [];
for (const a of AREAS) for (const p of a.polys) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < p.o.length; i += 2) { x0 = Math.min(x0, p.o[i]); x1 = Math.max(x1, p.o[i]); z0 = Math.min(z0, p.o[i + 1]); z1 = Math.max(z1, p.o[i + 1]); } areaBoxes.push({ a, p, b: [x0, x1, z0, z1] }); }
const areasAt = (x, z) => areaBoxes.filter((e) => x >= e.b[0] && x <= e.b[1] && z >= e.b[2] && z <= e.b[3] && ringHas(e.p.o, x, z) && !e.p.h.some((h) => ringHas(h, x, z))).map((e) => e.a);
const footways = ROADS.filter((r) => r.hw === 'footway' || r.hw === 'path' || r.hw === 'pedestrian' || r.hw === 'cycleway' || r.hw === 'steps');

/** cause key + explanation of a non-asphalt top surface */
function classify(top, x, z, way) {
  if (!top) return { cause: 'no-surface', builder: '(none: the environment ground is not even drawn here)', detail: '' };
  const { m, y } = top, nm = m.name, mat = m.mat;
  if (m.mod === 'environment') return { cause: 'bare-ground', builder: 'environment ground (no asphalt drawn)', detail: `${nm}/${mat} y=${y.toFixed(3)}` };
  if (m.mod === 'streets') {
    if (nm === 'pt-area-slab' || nm === 'pt-area-paver' || nm === 'pt-area-island' || mat === 'pt-area-slab' || mat === 'pt-area-paver' || mat === 'pt-area-island') {
      const ar = areasAt(x, z).filter((a) => a.hw === 'square' || a.hw === 'pedestrian' || a.hw === 'footway' || a.hw === 'traffic_island' || !a.hw || true);
      const d = ar.map((a) => `${a.id}:${a.hw || '?'}${a.surface ? '/' + a.surface : ''}${a.name ? ' "' + a.name + '"' : ''}`).slice(0, 4).join(', ');
      if (y < 0.03) return { cause: 'area-square-flush', builder: 'streets/paths.js buildAreas: AREAS hw=square polygon (flush slab 0.012, whole square incl. carriageways)', detail: d };
      if (y >= 0.14) return { cause: 'area-island', builder: 'streets/paths.js buildAreas: traffic_island polygon (paver at 0.15)', detail: d };
      return { cause: 'area-raised', builder: 'streets/paths.js buildAreas: raised pedestrian / footway AREAS polygon (0.10+)', detail: d };
    }
    if (nm === 'pt-slab' || nm === 'pt-paver' || nm === 'pt-strip' || nm === 'pt-ramp' || nm === 'pt-skirt') {
      // which way's pavement is it? the nearest OTHER way whose edge is within the pavement profile of that way
      let h = null;
      net.each(x, z, 30, (v, vi) => { if (v === way || v.rank < 1 || v.skipDraw) return; const q = segInfo(v, vi, x, z), off = q.c.d - q.h; if (off > -0.2 && off < profMax(v) + 1 && (!h || off < h.off)) h = { v, off, q }; });
      const d = h ? `pavement of ${h.v.id} ${h.v.hw} "${h.v.name || ''}" at ${h.off.toFixed(1)} m from its edge (profile ${profMax(h.v)} m)` : 'pavement of no other way (own side / corner patch / fillet)';
      let rel = 'adjacent-road';
      if (h && way) { if (h.v.oneway && way.oneway && h.v.name && h.v.name === way.name) rel = 'paired-carriageway'; else if (way.rank === 0) rel = 'service-road-in-pavement-band'; else if (h.v.name && h.v.name === way.name) rel = 'same-street'; }
      else if (!h) rel = 'corner-patch';
      return { cause: `pavement-${nm.replace('pt-', '')}/${rel}`, builder: `streets/walks.js buildWalks: ${nm} pavement of another way laid over this carriageway (${rel}); the strip is only clipped by facades, not by other roads' asphalt`, detail: d };
    }
    if (nm === 'pt-kerb') return { cause: 'kerb', builder: 'streets/surface.js buildKerbs (kerb stone on the carriageway)', detail: '' };
    if (nm.startsWith('pt-foot') || mat.startsWith('pt-foot')) {
      const f = footways.filter((r) => { const p = r.pts; for (let i = 0; i + 3 < p.length; i += 2) { const dx = p[i + 2] - p[i], dz = p[i + 3] - p[i + 1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - p[i]) * dx + (z - p[i + 1]) * dz) / l2)); if (Math.hypot(x - p[i] - dx * t, z - p[i + 1] - dz * t) < (r.w || 2.4) / 2 + 0.5) return true; } return false; }).slice(0, 3).map((r) => `${r.id}:${r.hw}${r.surface ? '/' + r.surface : ''}`).join(', ');
      return { cause: 'footway-ribbon', builder: `streets/paths.js buildPaths: mapped footway ribbon (${mat}) across a road`, detail: f };
    }
    if (nm === 'pt-cobble' || mat === 'pt-cobble') return { cause: way && way.cobble ? 'cobble-by-tag' : 'cobble-other', builder: way && way.cobble ? 'streets/surface.js buildAsphalt: OSM surface=cobblestone (way.cobble) -> pt-cobble' : 'streets/extras.js buildTramRails: cobble bed around tram rails (TRAMWAYS)', detail: way ? `surface=${way.rec.surface}` : '' };
    if (nm === 'pt-brickroad' || mat === 'pt-brickroad') { const ps = passages.filter((r) => { const p = r.pts; for (let i = 0; i + 3 < p.length; i += 2) { const dx = p[i + 2] - p[i], dz = p[i + 3] - p[i + 1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - p[i]) * dx + (z - p[i + 1]) * dz) / l2)); if (Math.hypot(x - p[i] - dx * t, z - p[i + 1] - dz * t) < 3) return true; } return false; }).slice(0, 2).map((r) => `${r.id}:${r.hw}`).join(', '); return { cause: 'passage-ribbon', builder: 'streets/paths.js buildPassages: building-arch paver ribbon (y 0.026, polygonOffset -1.9) runs on past the facade over the service asphalt (0.03, -1.8): ties / wins', detail: ps }; }
    if (nm === 'pt-steps') return { cause: 'steps', builder: 'streets/paths.js buildPaths steps ribbon', detail: '' };
    return { cause: 'streets-other:' + nm + '/' + mat, builder: 'streets (' + nm + '/' + mat + ')', detail: '' };
  }
  return { cause: `module:${m.mod}:${nm}/${mat}`, builder: `${m.mod} (${nm}/${mat}, ${m.parents})`, detail: `y=${y.toFixed(3)}` };
}

// ---------------------------------------------------------------- 4. the network and its samples
const net = buildNet(L);
for (const w of net.ways) { w.skipDraw = SKIP.has(w.i); w.pedestrianOnly = PEDONLY.has(w.i); }
log(`network: ${net.ways.length} ways (${net.ways.filter((w) => w.skipDraw).length} skipped by streets: bridge decks of landmarksC / pedestrian quarter), ${net.fillets.length} fillets`);

const ALL = !!flag('all', false);                      // default: only the play area (the part of the map a player / car can reach)
const MEDIAN_MAX = 7.5;                                // same threshold as net.js fillMedians (west): gaps below it are asphalt
const near = (x, z) => (!NEAR || Math.hypot(x - NEAR[0], z - NEAR[1]) <= NEAR[2]) && (ALL || L.inPlay(x, z));
const offenders = [];                              // one record per offending sample
const okMat = {};                                  // top material histogram of ALL samples (asphalt ones included)
let nSamples = 0, nDeck = 0, nBuilding = 0;
const deckMat = {};
function sample(x, z, ctxInfo) {
  if (!near(x, z)) return;
  if (L.insideBuilding(x, z, 0)) { nBuilding++; return; }
  const stack = stackAt(x, z), top = topOf(stack);
  const key = top ? `${top.m.mod}/${top.m.name}/${top.m.mat}` : 'none';
  if (deckAt(x, z, 0.3)) { nDeck++; deckMat[key] = (deckMat[key] || 0) + 1; return; }
  nSamples++; okMat[key] = (okMat[key] || 0) + 1;
  if (top && isAsphalt(top.m)) return;
  const way = ctxInfo.way || null;
  const c = classify(top, x, z, way);
  offenders.push({ x: +x.toFixed(2), z: +z.toFixed(2), y: top ? +top.y.toFixed(3) : null, kind: ctxInfo.kind, wayI: way ? way.i : null, id: way ? way.id : null, name: way ? way.name : null, hw: way ? way.hw : null, s: ctxInfo.s ?? null, lat: ctxInfo.lat ?? null, tx: ctxInfo.tx ?? 0, tz: ctxInfo.tz ?? 1, mesh: top ? `${top.m.mod}/${top.m.name}/${top.m.mat}` : 'none', cause: c.cause, builder: c.builder, detail: c.detail, gap: ctxInfo.gap ?? null });
}

const LAT = [0.1, 0.3, 0.5, 0.7, 0.9];
for (const w of net.ways) {
  if (w.skipDraw || w.pedestrianOnly) continue;
  const n = Math.max(2, Math.ceil(w.L / STEP) + 1);
  for (let k = 0; k < n; k++) {
    const s = w.L * k / (n - 1);
    // arclength sample (linear in the polyline)
    let i = 0; while (i < w.n - 2 && w.s[i + 1] < s) i++;
    const f = (s - w.s[i]) / Math.max(1e-9, w.s[i + 1] - w.s[i]);
    const px = w.x[i] + (w.x[i + 1] - w.x[i]) * f, pz = w.z[i] + (w.z[i + 1] - w.z[i]) * f;
    let tx = w.tx[i] + (w.tx[i + 1] - w.tx[i]) * f, tz = w.tz[i] + (w.tz[i + 1] - w.tz[i]) * f; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    const hL = w.hL[i] + (w.hL[i + 1] - w.hL[i]) * f, hR = w.hR[i] + (w.hR[i + 1] - w.hR[i]) * f, rx = -tz, rz = tx;
    for (const u of LAT) { const lat = -hL + (hL + hR) * u; sample(px + rx * lat, pz + rz * lat, { kind: 'carriageway', way: w, s, lat, tx, tz }); }
    // the strip between paired one-way carriageways: left of travel, beyond the left edge, up to the opposite carriageway (gap < 16 m)
    if (w.oneway && w.rank >= 2 && !w.bridge) {
      const lx = -rx, lz = -rz, ex = px + lx * hL, ez = pz + lz * hL;
      let best = null;
      net.each(ex, ez, 20, (v, vi) => {
        if (v === w || !v.oneway || v.rank < 2 || v.bridge || v.skipDraw) return;
        const dx = v.x[vi + 1] - v.x[vi], dz = v.z[vi + 1] - v.z[vi], l = Math.hypot(dx, dz) || 1;
        const dot = (dx * tx + dz * tz) / l;
        if (dot > -0.85) return;                                          // same opposing-direction guard as fillMedians
        const projection = ((ex - v.x[vi]) * dx + (ez - v.z[vi]) * dz) / (l * l);
        if (!projectsToSegment(projection, l)) return;
        const t = Math.max(0, Math.min(1, projection));
        const cx = v.x[vi] + dx * t, cz = v.z[vi] + dz * t;
        if ((cx - ex) * lx + (cz - ez) * lz <= 0) return;                // and lie on our left
        const hh = partnerWidth(v, vi, t, (-dz / l * (ex - cx) + dx / l * (ez - cz)) > 0);
        const dist = Math.hypot(cx - ex, cz - ez), gap = dist - hh;
        if (!pairedStreet(w, v, dot, gap, (ex + cx) / 2, (ez + cz) / 2, L)) return;
        // the samples run from our edge TOWARDS the partner's closest point (the measured gap): where the partner lies obliquely (a Y-split node: Lt Schmidt embankment at (-4550, 344), the pair begins) the old probe
        // along our left normal walked past the end of the pair into the corner pavement, a strip that is no gap between two carriageways
        if (gap > -1 && gap < 16 && (!best || gap < best.gap)) best = { gap, v, dx: dist > 1e-6 ? (cx - ex) / dist : lx, dz: dist > 1e-6 ? (cz - ez) / dist : lz };
      });
      if (best && best.gap > 0.4 && w.i < best.v.i) {                      // (each pair once)
        const g = best.gap;
        for (const u of [0.15, 0.35, 0.5, 0.65, 0.85]) { const d = g * u; sample(ex + best.dx * d, ez + best.dz * d, { kind: 'median', way: w, s, lat: -hL - d, tx, tz, gap: +g.toFixed(1) }); }
      }
    }
  }
}
for (const f of net.fillets) {
  if (f.ways[0].skipDraw || f.ways[1].skipDraw) continue;
  const a = f.arc, pts = [];                          // centroids of the fan triangles (P, arc[k], arc[k+1]): always inside the patch, even where the sliver is thin
  for (const k of new Set([0, Math.floor((a.length - 2) / 2), a.length - 2])) if (k >= 0 && k + 1 < a.length) pts.push([(f.P[0] + a[k][0] + a[k + 1][0]) / 3, (f.P[1] + a[k][1] + a[k + 1][1]) / 3]);
  for (const [x, z] of pts) sample(x, z, { kind: 'fillet', way: f.ways[0], tx: 0, tz: 1 });
}
log(`${nSamples} samples audited (${nDeck} on bridge decks of the bridges module skipped, ${nBuilding} inside buildings skipped); ${offenders.length} offending samples`);
log('top surface of ALL audited samples:'); for (const [k, v] of Object.entries(okMat).sort((a, b) => b[1] - a[1])) log(`  ${String(v).padStart(8)}  ${k}`);
log('bridge-deck samples (exception, drawn by the bridges module):'); for (const [k, v] of Object.entries(deckMat).sort((a, b) => b[1] - a[1])) log(`  ${String(v).padStart(8)}  ${k}`);

// ---------------------------------------------------------------- 5. exceptions
// (a) the polygon of a landmark-owned square where the landmark module draws its own paving ON TOP of a real road (Palace Square stone field, Kazan Square): cars do not drive there / the
//     asphalt is documented as drawn beneath (docs/streets-api.md "Claims"); (b) nothing else. The policy is: a drivable carriageway is asphalt.
const EXCEPTIONS = [
  { id: 'palace-square-stone-field', test: (o) => /lmG-(pave|flagMat|flagstone|stone-field)/.test(o.mesh), why: 'Palace Square stone field / arch flagstones (landmarksG): pedestrian square, the mapped living-street trace is drawn under it' },
  { id: 'kazan-square-garden', test: (o) => /lmF-slabs/.test(o.mesh) && /^Казанская площадь$/.test(o.name || ''), why: 'Kazan Square slabs (landmarksF) over the mapped Kazanskaya ploshchad way: pedestrian square' },
  { id: 'object-tops', test: (o) => o.mesh === 'city/city-fine/city-fine' && o.y >= 0.15, why: 'tops of 0.17 m stone corner guards / plinths in arch mouths (city module), not a surface' },
  { id: 'wide-median', test: (o) => o.kind === 'median' && o.gap >= MEDIAN_MAX, why: `central reservation wider than ${MEDIAN_MAX} m between two one-way carriageways: a real median (boulevard), pavement / lawn allowed` },
];
for (const o of offenders) { const e = EXCEPTIONS.find((x) => x.test(o)); o.exception = e ? e.id : null; }

// ---------------------------------------------------------------- 6. clusters
const clusters = [];
{
  const by = new Map();
  for (const o of offenders) { const k = `${o.kind}|${o.wayI}|${o.cause}`; let l = by.get(k); if (!l) by.set(k, (l = [])); l.push(o); }
  for (const l of by.values()) {
    l.sort((p, q) => (p.s ?? 0) - (q.s ?? 0));
    let cur = null;
    for (const o of l) {
      if (!cur || (o.s ?? 0) - cur.sMax > STEP * 3.2) { cur = { kind: o.kind, wayI: o.wayI, id: o.id, name: o.name, hw: o.hw, cause: o.cause, builder: o.builder, mesh: o.mesh, exception: o.exception, detail: new Set(), samples: [], sMin: o.s ?? 0, sMax: o.s ?? 0 }; clusters.push(cur); }
      cur.samples.push(o); cur.sMax = o.s ?? 0; if (o.detail) cur.detail.add(o.detail);
    }
  }
  for (const c of clusters) {
    const xs = c.samples.map((o) => o.x), zs = c.samples.map((o) => o.z), g = c.samples.map((o) => o.gap).filter((v) => v != null);
    c.n = c.samples.length; c.x0 = Math.min(...xs); c.x1 = Math.max(...xs); c.z0 = Math.min(...zs); c.z1 = Math.max(...zs);
    const sc = new Set(c.samples.map((o) => o.s)).size;
    c.length = +(Math.max(STEP, c.sMax - c.sMin + STEP)).toFixed(0); c.stations = sc;
    c.lat = c.kind === 'carriageway' ? +(new Set(c.samples.map((o) => o.lat)).size / (sc || 1)).toFixed(1) : null;       // average lateral positions hit per station (of 5)
    c.gap = g.length ? +(g.reduce((a, b) => a + b, 0) / g.length).toFixed(1) : null;
    const m = c.samples[Math.floor(c.samples.length / 2)];
    c.pose = poseOf(m);
    c.detail = [...c.detail].slice(0, 2).map((d) => d.slice(0, 160));
    c.score = c.n;
  }
}
function poseOf(o) { const dx = o.tx, dz = o.tz; const yaw = Math.atan2(-dx, -dz) * 180 / Math.PI; return `${(o.x - dx * 12).toFixed(1)},1.7,${(o.z - dz * 12).toFixed(1)},${yaw.toFixed(0)},-12`; }
clusters.sort((a, b) => b.n - a.n);

// summary by cause
const byCause = new Map();
for (const o of offenders) {
  const k = o.kind + ' | ' + o.cause;
  let e = byCause.get(k); if (!e) byCause.set(k, (e = { kind: o.kind, cause: o.cause, builder: o.builder, samples: 0, exception: o.exception, st: new Set(), ways: new Set(), hwM: {} }));
  e.samples++; const sk = o.wayI + ':' + o.s + ':' + o.kind; if (!e.st.has(sk)) { e.st.add(sk); e.hwM[o.hw || '(fillet)'] = (e.hwM[o.hw || '(fillet)'] || 0) + (o.kind === 'fillet' ? 0 : STEP); } e.ways.add(o.wayI);
}
const causeTotals = [...byCause.values()].map((e) => ({ kind: e.kind, cause: e.cause, builder: e.builder, samples: e.samples, exception: e.exception, metres: Math.round(e.st.size * STEP), ways: e.ways.size, byClassMetres: e.hwM })).sort((a, b) => b.metres - a.metres);
const byClass = {}; for (const o of offenders) { const k = o.hw || '(fillet)'; byClass[k] = (byClass[k] || 0) + 1; }
log('\noffenders by kind and cause (metres = unique cross-section stations x step; samples; ways):');
for (const c of causeTotals) log(`  ${String(c.metres).padStart(7)} m ${String(c.samples).padStart(7)} smp ${String(c.ways).padStart(5)} ways  ${c.kind.padEnd(11)} ${c.cause}${c.exception ? '  [EXCEPTION ' + c.exception + ']' : ''}\n           ${c.builder}\n           by class (m): ${JSON.stringify(c.byClassMetres)}`);
log('by road class: ' + JSON.stringify(byClass));
log(`\n${clusters.length} clusters (top 40):`);
for (const c of clusters.slice(0, 40)) log(`  ${String(c.n).padStart(4)} smp ${String(c.length).padStart(4)} m  ${c.kind.padEnd(11)} way ${c.id} ${c.hw} "${c.name || ''}"  x ${c.x0.toFixed(0)}..${c.x1.toFixed(0)} z ${c.z0.toFixed(0)}..${c.z1.toFixed(0)}  ${c.cause}${c.gap != null ? ' gap ' + c.gap : ''}\n           pose ${c.pose}  ${c.detail.join(' | ')}`);
if (VERBOSE) for (const o of offenders) log(`  ${o.x},${o.z} ${o.kind} ${o.id} ${o.name || ''} -> ${o.mesh} y=${o.y} ${o.cause}`);

// cobble-by-tag: drivable ways whose OSM tag says cobblestone / sett / paving_stones etc.
const surf = {};
const cobbleWays = [];
for (const r of ROADS) { if (!DRIVE.has(r.hw) || r.tunnel || r.layer < 0) continue; const k = `${r.hw}:${r.surface || '-'}`; surf[k] = (surf[k] || 0) + 1; }
for (const w of net.ways) if (w.cobble && !w.skipDraw) cobbleWays.push({ i: w.i, id: w.id, name: w.name, hw: w.hw, rank: w.rank, surface: w.rec.surface, smoothness: w.rec.smoothness || null, length: Math.round(w.L), x: Math.round(w.x[0]), z: Math.round(w.z[0]) });
log('\nOSM surface tags of the drivable ROADS (hw:surface -> count): ' + JSON.stringify(surf));
log(`cobble-by-tag ways drawn as pt-cobble: ${cobbleWays.length}, ${cobbleWays.reduce((a, b) => a + b.length, 0)} m`);
// ways whose OSM surface tag is a stone paving (sett / cobblestone / unhewn_cobblestone / paving_stones / concrete:plates) but that are drawn as asphalt: the user policy (asphalt) wins, listed for the owner to decide
const STONE = new Set(["sett", "cobblestone", "unhewn_cobblestone", "paving_stones", "concrete:plates", "paved"]);
const tagStone = net.ways.filter((w) => STONE.has(w.rec.surface) && !w.skipDraw).map((w) => ({ i: w.i, id: w.id, name: w.name, hw: w.hw, rank: w.rank, surface: w.rec.surface, smoothness: w.rec.smoothness || null, drawn: w.cobble ? "pt-cobble" : w.rank === 0 ? "pt-service asphalt" : "pt-asphalt", length: Math.round(w.L), x: Math.round(w.x[0]), z: Math.round(w.z[0]) }));
const tagStoneBy = {}; for (const t of tagStone) { const k = t.hw + ":" + t.surface + " -> " + t.drawn; const e = tagStoneBy[k] || (tagStoneBy[k] = { ways: 0, metres: 0 }); e.ways++; e.metres += t.length; }
log("stone-paving OSM tags drawn as: " + JSON.stringify(tagStoneBy));

const failing = offenders.filter((o) => !o.exception);
const result = { generated: new Date().toISOString(), step: STEP, near: NEAR, samples: nSamples, deckSamples: nDeck, offenders: offenders.length, failing: failing.length, causeTotals, byClass, clusters: clusters.map((c) => ({ ...c, samples: undefined })), cobbleByTag: cobbleWays, tagStonePaving: tagStone, tagStoneSummary: tagStoneBy, surfaceTags: surf, topMaterials: okMat, deckMaterials: deckMat, meshes: MESHES.filter((m) => !m.decal).map((m) => ({ mod: m.mod, name: m.name, mat: m.mat, off: m.off, tris: m.tris, area: Math.round(m.area), y: [m.ymin, m.ymax].map((v) => +v.toFixed(3)) })), offenderSamples: offenders };
if (JSON_OUT) { fs.mkdirSync(path.dirname(path.resolve(JSON_OUT)), { recursive: true }); fs.writeFileSync(JSON_OUT, JSON.stringify(result, null, 1)); log('json -> ' + JSON_OUT); }
if (REPORT) {
  const md = [`# Road-surface audit (${result.generated})`, '', `${nSamples} samples, ${offenders.length} offending (${failing.length} not excepted), step ${STEP} m`, '', '## Causes', ...causeTotals.map((c) => `- ${c.samples} samples: **${c.cause}** - ${c.builder}${c.exception ? ' [exception]' : ''}`), '', '## Clusters', '', '| samples | length m | kind | way | name | x | z | cause | pose |', '|---|---|---|---|---|---|---|---|---|',
    ...clusters.slice(0, 200).map((c) => `| ${c.n} | ${c.length} | ${c.kind} | ${c.id} ${c.hw} | ${c.name || ''} | ${c.x0.toFixed(0)}..${c.x1.toFixed(0)} | ${c.z0.toFixed(0)}..${c.z1.toFixed(0)} | ${c.cause} ${c.detail.join(' | ')} | ${c.pose} |`)];
  fs.writeFileSync(REPORT, md.join('\n')); log('report -> ' + REPORT);
}
const MAXF = Number(flag('max-fail', 0)) || 0;          // --max-fail N: a documented residue budget (samples) that does not fail the run (the plan's acceptance: <= 0.3 % of the samples)
log(failing.length > MAXF ? `RESULT: FAIL (${failing.length} offending samples in ${clusters.filter((c) => !c.exception).length} clusters${MAXF ? ', budget ' + MAXF : ''})` : `RESULT: OK${failing.length ? ` (${failing.length} residual samples within --max-fail ${MAXF})` : ''}`);
process.exit(failing.length > MAXF ? 1 : 0);
