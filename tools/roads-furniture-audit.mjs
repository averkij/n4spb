// Furniture-on-road audit: finds every standing object (lamp, traffic-light pole / mast, sign, bollard, bus-stop pole / shelter, trolleybus mast, bench, bin, tree, speed camera ...)
// that stands ON the drivable surface of the streets module or so close to its edge that a car cannot drive past it.
// Headless (node, no GPU). Builds the real world modules (same stubs as tools/check.mjs), then collects
//   A. every physics collider (cylinder / box) registered during the build, tagged with the module and the calling file (stack trace),
//   B. the base footprint (vertices below 1.2 m) of every instance of every InstancedMesh (lamps, chain posts, benches, bins, ... even without a collider), tagged with the mesh name,
//   C. the guard-rail runs and the trolleybus masts of ctx.services.streets,
// and tests each one against the asphalt of the network (streets/net.js: ways incl. parking pockets hL / hR, junction fillets via net.cover) and the lane polylines.
//   clearance = gap between the object's footprint and the asphalt edge (metres, negative = inside the carriageway)
//   on_road : footprint intrudes the asphalt by more than 5 cm;  edge : 0 .. 0.2 m from the asphalt edge (--edge; 0.2 m = the granite kerb itself: the footprint stands on the kerb line)
//   free    : widest remaining gap of the carriageway at that point (m): a car is ~2 m wide
// Excluded (stated reasons, counted separately, never failures): 'island' (inside a traffic_island polygon: a real raised island), 'bridge_owned' (on a bridge deck of bridges/sites.js or an object of a bridge module: that module//   draws its own railings / lamps), 'courtyard' (landmark / advert objects on rank-0 service ways: courtyard alleys the landmark modules own), 'building' (facade colliders of the city module), 'big' (footprint > 6 m: houses / landmarks),//   colliders lower than 0.45 m (kerbs, flush things). Squares that a landmark module paves (Vosstaniya, Palace, Kazan) are NOT excluded: their roads are real asphalt; the row carries plaza = <OSM id> so you can judge.
// usage: node tools/roads-furniture-audit.mjs [--json out.json] [--near x,z,r] [--modules a,b,c] [--top N] [--all] [--edge 0.2] [--edge-fails] [--median-fails] [--strict] [--extras-fail] [--allow tokens|none] [--verbose]
//          --strict implies --allow GUARD_STONE,PROP,BIN,TREE,FACADE_COLLIDER (documented residue, printed per category; explicit --allow tokens extend it, --allow none = nothing allowed);  --allow QUAY_RAIL,GUARD_STONE : on_road rows whose category / root cause contains a token do not fail (documented residue);  --strict = on_road + median(gap<7.5) + lot slots in a street fail;
//          extras (always printed): signalised stop points inside a foreign carriageway, parking-lot slots inside a street (--extras-fail also fails on the stop points)
//          diagnostics: --inspect x,z,r (network around a point)  --why-signals x,z,r (replay of the stop-line poles)  --simulate-fix (would sliding the pole back along its lane clear it?)
//          (a quick run on the streets module only: --modules streets,bridges ; the full 26-module build takes ~70 s)
//   MEDIAN: an object that stands between two carriageways of the SAME named street that run in opposite directions (asphalt on both sides within 9 m, gap < 14 m); with gap < 7.5 m there is no real median (docs: net.js fillMedians)
//   rc (root-cause code) per row: SIGNAL_STOPLINE / MEDIAN_STRIP / ZEBRA_POLE / QUAY_RAIL / LANDMARK_FURNITURE / WIRE_MAST / KERB_LAMP / TREE ... see summary.byRootCause
//   exit code 1 when any non-excluded object is on_road (or on the edge with --edge-fails).
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { mainModules, DYNAMIC } from './modules-list.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k, d = null) => { const i = argv.indexOf('--' + k); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '1') : d; };
const INSPECT = opt('inspect') ? opt('inspect').split(',').map(Number) : null;
const JSON_OUT = opt('json'), NEAR = opt('near') ? opt('near').split(',').map(Number) : null, TOP = Number(opt('top', 25)), ALLROWS = argv.includes('--all'), EDGE_FAILS = argv.includes('--edge-fails'), VERBOSE = argv.includes('--verbose');
const DEFAULT_MODULES = mainModules().filter((m) => !DYNAMIC.includes(m));   // the page's own list (src/main.js MODULES) without the dynamic modules: never a stale copy
const MODULES = opt('modules') ? opt('modules').split(',') : DEFAULT_MODULES;

// ---------------------------------------------------------------- DOM stubs (same as tools/check.mjs)
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
globalThis.performance = globalThis.performance || { now: () => Date.now() };

const THREE = await import('three');
const imp = (p) => import(pathToFileURL(path.join(root, p)).href);
const { createContext } = await imp('src/core/ctx.js');
const { createAudio } = await imp('src/core/audio.js');
const L = await imp('src/world/layout.js');
const { AREAS } = await imp('src/world/data/city.js');
const { deckAt } = await imp('src/world/streets/decks.js');
const { segInfo } = await imp('src/world/streets/net.js');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 2500);
let audio; try { audio = createAudio(); } catch { audio = null; }
const quality = { name: 'high', pixelRatio: 1, msaa: 4, shadowMap: 4096, shadowSize: 75, petals: 1 };
const ctx = createContext({ scene, camera, renderer: null, audio, quality, sunDir: new THREE.Vector3(...L.SUN_DIR).normalize() });
ctx.buildList = MODULES.slice();
ctx.sky = { sun: new THREE.DirectionalLight(), hemi: new THREE.HemisphereLight(), uniforms: {} };

// ---------------------------------------------------------------- record the colliders with their owner (module + calling files from the stack)
let curModule = '?';
const colliders = [];
{
  const ins = ctx.physics._insert.bind(ctx.physics);
  ctx.physics._insert = (it) => {
    const lim = Error.stackTraceLimit; Error.stackTraceLimit = 14;
    const st = new Error().stack || ''; Error.stackTraceLimit = lim;
    const frames = [];
    for (const ln of st.split('\n').slice(2)) {
      const m = /at (?:async )?(?:(\S+) )?\(?(?:file:\/\/\/)?([^)]*?)[:](\d+):\d+\)?$/.exec(ln.trim()); if (!m) continue;
      const f = m[2].replace(/\\/g, '/'); const i = f.indexOf('/src/'); const rel = i >= 0 ? f.slice(i + 5) : f;
      if (rel.endsWith('core/physics.js')) continue;
      frames.push({ fn: m[1] || '', file: rel, line: Number(m[3]) });
    }
    colliders.push({ it, mod: curModule, frames });
    return ins(it);
  };
}

// ---------------------------------------------------------------- build the modules
const snapshot = () => { const s = new Set(); scene.traverse((o) => s.add(o)); return s; };
const meshOwner = new Map();             // InstancedMesh -> module
const buildLog = [];
for (const name of MODULES) {
  curModule = name;
  const before = snapshot(), t0 = Date.now();
  let err = null;
  try { const mod = await imp(`src/world/${name}.js`); await mod.build(ctx); } catch (e) { err = e; }
  scene.traverse((o) => { if (!before.has(o) && o.isInstancedMesh) meshOwner.set(o, name); });
  buildLog.push({ module: name, ms: Date.now() - t0, error: err ? String(err.message || err).split('\n')[0] : null });
  if (VERBOSE || err) console.log(`built ${name} ${Date.now() - t0} ms${err ? '  ERROR ' + (err.stack || err).split('\n').slice(0, 3).join(' | ') : ''}`);
}
scene.updateMatrixWorld(true);
const st = ctx.services.streets;
if (!st || !st.net) { console.log('FAIL: the streets module published no network'); process.exit(1); }
const net = st.net;

// ---------------------------------------------------------------- road probe
const ringHas = (o, x, z) => { let ins = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) { const xi = o[i], zi = o[i + 1], xj = o[j], zj = o[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } return ins; };
const islandRings = AREAS.filter((a) => a.hw === 'traffic_island').flatMap((a) => a.polys.map((p) => p.o));
const ownedAreas = (() => { const out = []; const sq = AREAS.filter((a) => (a.hw === 'square' || a.hw === 'pedestrian' || a.hw === 'footway') && L.groupOf(a.id)); for (const a of sq) for (const p of a.polys) out.push({ id: a.id, o: p.o }); return out; })();
const inIsland = (x, z) => islandRings.some((o) => ringHas(o, x, z));
const inPlaza = (x, z) => { const a = ownedAreas.find((r) => ringHas(r.o, x, z)); return a ? a.id : null; };

/** the best covering way at (x,z): { m (margin: h - d, > 0 = inside the asphalt), w, i, side (signed lateral offset, + = right), hL, hR, hb, t } or null */
function probe(x, z) {
  let best = null;
  net.each(x, z, 3, (w, i) => {
    if (w.skipDraw || w.pedestrianOnly) return;
    const q = segInfo(w, i, x, z), m = q.h - q.c.d;
    if (!best || m > best.m) best = { m, w, i, q };
  });
  const f = net.cover(x, z, {});
  if (!best) {
    if (!(f > -1e8)) return null;
    // net.cover also counts the bodies and junction fillets of ways that are NOT carriageways (pedestrian-only / not drawn: the service ways a landmark claims, e.g. every way of
    // Zayachy Island; tram beds). A fillet is asphalt only when a drawable way takes part in it: look for one within the reach of a fillet (14 m beyond its half width).
    let drivable = false;
    net.each(x, z, 20, (w, i) => { if (drivable || w.skipDraw || w.pedestrianOnly) return; const q = segInfo(w, i, x, z); if (q.c.d <= q.h + 14) drivable = true; });
    return drivable ? { m: f, w: null, fillet: true } : null;
  }
  const w = best.w, i = best.i, t = best.q.t;
  const lerp = (a) => a[i] + (a[i + 1] - a[i]) * t;
  // segInfo's clamped projection has a round end cap. The drawn network has
  // clipped junction ends; an obstacle beyond that cap is beside the asphalt.
  const out = { m: Math.min(best.m,f), w, side: best.q.side, hL: lerp(w.hL), hR: lerp(w.hR), hb: lerp(w.hb), t, i, cx: best.q.c.x, cz: best.q.c.z, tx: best.q.dx, tz: best.q.dz };
  if (f > out.m + 0.01) { out.m = f; out.fillet = true; }
  return out;
}

// lane polylines in a hash grid (the nearest lane of an object that is inside the carriageway)
const LG = 16, laneGrid = new Map();
for (const ln of st.lanes) for (let i = 0; i + 1 < ln.pts.length; i++) {
  const a = ln.pts[i], b = ln.pts[i + 1];
  for (let cx = Math.floor((Math.min(a[0], b[0]) - 2) / LG); cx <= Math.floor((Math.max(a[0], b[0]) + 2) / LG); cx++) for (let cz = Math.floor((Math.min(a[1], b[1]) - 2) / LG); cz <= Math.floor((Math.max(a[1], b[1]) + 2) / LG); cz++) {
    const k = cx * 8192 + cz; let l = laneGrid.get(k); if (!l) laneGrid.set(k, (l = [])); l.push([ln, i]);
  }
}
function nearestLane(x, z) {
  let best = null; const cx = Math.floor(x / LG), cz = Math.floor(z / LG);
  for (const [ln, i] of laneGrid.get(cx * 8192 + cz) || []) {
    const a = ln.pts[i], b = ln.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
    const d = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
    if (!best || d < best.d) best = { d, id: ln.id, idx: ln.idx, width: ln.width, dir: ln.dir };
  }
  return best;
}
const sidewalkNear = (x, z) => { const q = st.nearestSidewalk(x, z, 12); return q ? { dist: +q.dist.toFixed(2), w: q.w } : null; };

// ---------------------------------------------------------------- --inspect x,z,r : dump the network around a point (ways with per-vertex widths, lamps, signals, fillets)
if (INSPECT) {
  const [ix, iz, ir] = INSPECT; const R = ir || 20;
  console.log(`INSPECT (${ix}, ${iz}) r=${R}`);
  net.each(ix, iz, R + 10, (w, i) => {
    const d = Math.hypot(w.x[i] - ix, w.z[i] - iz); if (d > R + 12) return;
    console.log(`  way ${w.id} "${w.name || ''}" ${w.hw} rank${w.rank} w${w.w} oneway${w.oneway} seg${i}/${w.n} at ${w.x[i].toFixed(1)},${w.z[i].toFixed(1)} t=(${w.tx[i].toFixed(2)},${w.tz[i].toFixed(2)}) hb=${w.hb[i].toFixed(2)} hL=${w.hL[i].toFixed(2)} hR=${w.hR[i].toFixed(2)} parkL=${w.parkL[i].toFixed(2)} parkR=${w.parkR[i].toFixed(2)} fillL=${w.fillL ? w.fillL[i].toFixed(2) : '-'} pin=${w.pin[i] ? 1 : 0} skipDraw=${!!w.skipDraw} lanes=${w.lanes ? w.lanes.nF + '+' + w.lanes.nB : '-'}`);
  });
  for (const l of st.lamps) if (Math.hypot(l.x - ix, l.z - iz) < R) console.log(`  lamp ${l.kind} ${l.x.toFixed(1)},${l.z.toFixed(1)} h${l.h}`);
  for (const sg of st.signals) if (Math.hypot(sg.x - ix, sg.z - iz) < R + 20) console.log(`  signal ${sg.id} ${sg.x.toFixed(1)},${sg.z.toFixed(1)} mid=${sg.mid}`);
  for (const f of net.fillets) if (f.box[0] - R < ix && f.box[1] + R > ix && f.box[2] - R < iz && f.box[3] + R > iz) console.log(`  fillet at ${f.P[0].toFixed(1)},${f.P[1].toFixed(1)} R=${f.R.toFixed(1)} ways ${f.ways[0].id}/${f.ways[1].id}`);
}

// ---------------------------------------------------------------- replay of streets/signals.js: where every approach puts its stop-line pole (and mast) and why it lands where it lands
const KERB_W = 0.2;
const probeWay = (x, z, want) => { let best = null; net.each(x, z, 3, (w, i) => { if (w !== want) return; const q = segInfo(w, i, x, z), m = q.h - q.c.d; if (!best || m > best.m) best = { m, side: q.side, hL: q.h, t: q.t }; }); return best; };
const signalArms = [];                                   // { kind: 'pole'|'mast', x, z, ... }
for (const nd of net.nodes) for (const a of nd.arms) {
  if (!a.inl || !a.inl.length || a.group === undefined) continue;
  const lane0 = a.inl[0], p = lane0.pts[lane0.pts.length - 1], q = lane0.pts[lane0.pts.length - 2];
  let tx = p[0] - q[0], tz = p[1] - q[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
  const rx = -tz, rz = tx, lw = lane0.width, off = lw / 2 + KERB_W + 0.7;
  const cands = [{ kind: 'pole', x: p[0] + rx * off - tx * 0.3, z: p[1] + rz * off - tz * 0.3 }];
  if (a.inl.length >= 2 || a.w.rank >= 3) cands.push({ kind: 'mast', x: p[0] + rx * off - tx * 2.2, z: p[1] + rz * off - tz * 2.2 });
  for (const c of cands) {
    const any = probe(c.x, c.z), own = probeWay(c.x, c.z, a.w);
    const ownIn = own && own.m > 0.05, anyIn = any && any.m > 0.05;
    signalArms.push({ kind: c.kind, x: +c.x.toFixed(2), z: +c.z.toFixed(2), node: nd.id, nodeX: +nd.x.toFixed(1), nodeZ: +nd.z.toFixed(1), deg: nd.arms.length, armRoad: a.w.id, armName: a.w.name || '', armRank: a.w.rank, armW: a.w.w, along: a.along, group: a.group, inl: a.inl.length,
      lane0: lane0.id, lw: +lw.toFixed(2), stopToNode: +Math.hypot(p[0] - nd.x, p[1] - nd.z).toFixed(1), dIn: a.dIn != null ? +a.dIn.toFixed(1) : null, armLen: a.len != null ? +a.len.toFixed(0) : null,
      margin: any ? +any.m.toFixed(2) : null, ownMargin: own ? +own.m.toFixed(2) : null, coveredBy: !anyIn ? 'none' : (any.fillet ? 'fillet' : any.w === a.w ? 'own' : 'foreign'), foreign: anyIn && !any.fillet && any.w !== a.w ? { id: any.w.id, name: any.w.name || '', rank: any.w.rank, w: any.w.w } : null, ownIn: !!ownIn });
  }
}
{
  const bad = signalArms.filter((s) => s.coveredBy !== 'none'), n = (f) => bad.filter(f).length;
  console.log(`signal replay: ${signalArms.length} pole / mast positions (${signalArms.filter((s) => s.kind === 'pole').length} poles), ${bad.length} stand inside asphalt: own way ${n((s) => s.coveredBy === 'own')}, foreign way ${n((s) => s.coveredBy === 'foreign')}, fillet ${n((s) => s.coveredBy === 'fillet')}`);
  if (opt('why-signals')) {
    const [ix, iz, ir] = opt('why-signals').split(',').map(Number);
    for (const s of signalArms) if (Math.hypot(s.x - ix, s.z - iz) <= ir) console.log('  ' + JSON.stringify(s));
  }
}
// --simulate-fix: how many of the bad stop-line poles find a clear kerb spot when the pole slides BACK along its own lane (same lateral offset, up to 30 m, 1 m steps)?
if (argv.includes('--simulate-fix')) {
  const res = { bad: 0, solved: 0, shifts: [], unsolved: [] };
  for (const nd of net.nodes) for (const a of nd.arms) {
    if (!a.inl || !a.inl.length || a.group === undefined) continue;
    const lane0 = a.inl[0], pts = lane0.pts, off = lane0.width / 2 + KERB_W + 0.7;
    const at = (back) => {                                   // point on the lane polyline 'back' metres before the stop line + its travel direction
      let acc = 0;
      for (let i = pts.length - 1; i > 0; i--) { const dx = pts[i][0] - pts[i - 1][0], dz = pts[i][1] - pts[i - 1][1], l = Math.hypot(dx, dz) || 1e-9; if (acc + l >= back) { const u = (back - acc) / l; return { x: pts[i][0] - dx * u, z: pts[i][1] - dz * u, tx: dx / l, tz: dz / l }; } acc += l; }
      const dx = pts[1][0] - pts[0][0], dz = pts[1][1] - pts[0][1], l = Math.hypot(dx, dz) || 1;
      return { x: pts[0][0], z: pts[0][1], tx: dx / l, tz: dz / l, short: true };
    };
    const ok = (back) => { const q = at(back), x = q.x - q.tz * off - q.tx * 0.3, z = q.z + q.tx * off - q.tz * 0.3, p = probe(x, z); return !(p && p.m > -0.5) && !L.insideBuilding(x, z, 0.3) && !deckAt(x, z, 1); };
    if (ok(0)) continue;
    res.bad++;
    let found = null; for (let b = 1; b <= 30; b++) if (ok(b)) { found = b; break; }
    if (found) { res.solved++; res.shifts.push(found); }
    else {
      // second stage: the nearest clear pavement spot (0.6 .. 2.5 m outside every asphalt edge, not in a building) within 14 m of the stop line, on the right-hand side of the arm
      const q0 = at(0), rx = -q0.tz, rz = q0.tx; let near = null;
      for (let r = 1; r <= 14 && near == null; r += 0.5) for (let k = 0; k < 24; k++) {
        const ang = k * Math.PI / 12, x = q0.x + Math.cos(ang) * r, z = q0.z + Math.sin(ang) * r;
        if ((x - q0.x) * rx + (z - q0.z) * rz < -0.5) continue;
        const p = probe(x, z); if (p && p.m > -0.6) continue;
        let clear = true; for (let a2 = 0; a2 < 8 && clear; a2++) { const p2 = probe(x + Math.cos(a2 * Math.PI / 4) * 0.3, z + Math.sin(a2 * Math.PI / 4) * 0.3); if (p2 && p2.m > -0.45) clear = false; }
        if (clear && !L.insideBuilding(x, z, 0.4) && !deckAt(x, z, 1) && (!p || p.m > -2.5)) { near = r; break; }
      }
      if (near != null) { res.corner = (res.corner || 0) + 1; (res.cornerR ||= []).push(near); }
      else res.unsolved.push({ node: nd.id, road: a.w.id, name: a.w.name || '', x: +nd.x.toFixed(1), z: +nd.z.toFixed(1), armLen: a.len });
    }
  }
  res.shifts.sort((p, q) => p - q);
  console.log('simulate-fix: ' + res.bad + ' approaches have no clear pole spot at the stop line; sliding back <= 30 m solves ' + res.solved + ' (shift median ' + (res.shifts[res.shifts.length >> 1] ?? '-') + ' m, p90 ' + (res.shifts[Math.floor(res.shifts.length * 0.9)] ?? '-') + ' m); ' + res.unsolved.length + ' stay blocked; nearest clear pavement spot within 14 m for ' + (res.corner || 0) + ' more (median ' + (((res.cornerR || []).sort((p, q) => p - q))[((res.cornerR || []).length >> 1)] ?? '-') + ' m from the stop line)');
  globalThis.__simFix = res;
}
// kerb runs hashed in 4 m cells: the owner (way + side) of the kerb a lamp / bollard / sign was placed along
const KG = new Map();
for (const run of net.kerbRuns) { if (run.kind !== 'edge') continue; for (const p of run.pts) { const k = Math.floor(p.x / 4) + ',' + Math.floor(p.z / 4); let l = KG.get(k); if (!l) KG.set(k, (l = [])); l.push([p.x, p.z, run]); } }
const kerbOwner = (x, z) => {
  let best = null; const cx = Math.floor(x / 4), cz = Math.floor(z / 4);
  for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) for (const [px, pz, run] of KG.get(a + ',' + b) || []) { const d = Math.hypot(px - x, pz - z); if (d < 2.4 && (!best || d < best.d)) best = { d, w: run.w, side: run.side }; }
  return best ? { way: best.w.id, name: best.w.name || '', side: best.side, d: +best.d.toFixed(2), rank: best.w.rank, wW: best.w.w } : null;
};
const armAt = (x, z) => signalArms.find((s) => Math.hypot(s.x - x, s.z - z) < 0.08) || null;

// ---------------------------------------------------------------- footprints -> samples
const samplesCyl = (cx, cz, r) => { const s = [[cx, cz, 0]]; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; s.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r, 0]); } return s; };
function samplesRect(corners) {          // 4 corners (xz) -> corners, edge midpoints every <= 0.6 m, centre
  const s = []; let cx = 0, cz = 0; for (const c of corners) { cx += c[0] / 4; cz += c[1] / 4; }
  s.push([cx, cz, 0]);
  for (let k = 0; k < 4; k++) {
    const a = corners[k], b = corners[(k + 1) % 4], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.6));
    for (let j = 0; j < n; j++) s.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n, 0]);
  }
  return s;
}

// ---------------------------------------------------------------- collect objects
const objs = [];
const HELPERS = [/streets\/signals\.js:85$/, /props\/state\.js:\d+$/, /lib\/massing\.js:\d+$/];     // shared one-liners (post(), S.solidBox ...): the caller one frame up names the placer
const siteOf = (frames) => { for (const f of frames) { const k = `${f.file}:${f.line}`; if (!HELPERS.some((h) => h.test(k))) return f; } return frames[0] || { file: '?', line: 0 }; };
const catOfFile = (rel, line, h, kind) => {
  if (/streets\/lamps\.js/.test(rel)) return 'lamp';
  if (/streets\/signals\.js/.test(rel)) return line === 123 ? 'signal_mast' : (line === 114 || line === 156) ? 'signal_pole' : line === 175 ? 'zebra_pole' : 'sign_pole';
  if (/streets\/barriers\.js/.test(rel)) return 'bollard';
  if (/streets\/stops\.js/.test(rel)) return kind === 'cyl' ? 'busstop_pole' : 'busstop_shelter';
  if (/streets\/wires\.js/.test(rel)) return 'wire_mast';
  if (/streets\/extras\.js/.test(rel)) return /:(?:63|64)$/.test(rel + ':' + line) ? 'sign_pole' : 'speed_camera';
  if (/streets\/quay\.js/.test(rel)) return 'guard_stone';
  if (/streets\//.test(rel)) return 'street_other';
  if (/environment\/trees\.js/.test(rel)) return 'tree';
  if (/environment\/lawns\.js/.test(rel)) return 'lawn_edge';
  if (/environment\/quay\.js/.test(rel)) return 'quay_rail';
  if (/props\/ads\.js/.test(rel)) return 'ad_pillar';
  if (/props\/osm\.js/.test(rel)) return line === 54 ? 'bin' : line === 65 ? 'post_box' : 'prop';
  if (/props\//.test(rel)) return 'prop';
  if (/^world\/city\//.test(rel) || /world\/city\.js/.test(rel)) return 'building';
  // Bridge module names also include coastalBridges. Their owner draws edge
  // furniture; supports still obey its actual ground-network footprint rule.
  if (/bridges/i.test(rel)) return 'bridge_item';
  if (/landmarks|rail\//.test(rel)) return 'landmark_item';
  return 'other';
};
const meshCat = (name) => {
  const n = name.toLowerCase();
  if (/env-quay/.test(n)) return /sign/.test(n) ? 'sign_pole' : 'quay_rail';
  if (/chain-post|pt-chain|bollard/.test(n)) return 'bollard';
  if (/lamps?-/.test(n) || /lamp|lantern|candelabr/.test(n)) return 'lamp';
  if (/bench/.test(n)) return 'bench';
  if (/(^|-)bin|urn|trash/.test(n)) return 'bin';
  if (/^brg-rail|^coastal-rail/.test(n)) return 'bridge_item'; // bridge railings, including the coastal modules
  if (/tub|planter|pot/.test(n)) return 'planter';
  if (/sign|plate|pole/.test(n)) return 'sign_pole';
  if (/tree|trunk/.test(n)) return 'tree';
  if (/brg-|lmk-|lm[a-z]-/.test(n)) return 'bridge_item';
  return 'inst:' + name;
};
const SKIP_MESH = /glow|pool|leaf|crown|foliage|canopy|petal|grass|cloud|bird|^car|veh|people|ped-|decal|paint|marking|shadow|wire|water|^dynamic$|^env-tree-/i;      // (trees: the trunk colliders of environment/trees.js stand for them; the crown overhangs a road legitimately)

const baseCache = new Map();           // geometry -> the footprint of the vertices below 1.2 m (the standing part without arms / crown)
function baseBox(geo) {
  let e = baseCache.get(geo.uuid); if (e !== undefined) return e;
  const p = geo.attributes.position; if (!p) { baseCache.set(geo.uuid, null); return null; }
  let miny = 1e9, maxy = -1e9; for (let i = 0; i < p.count; i++) { const y = p.getY(i); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, n = 0;
  for (let i = 0; i < p.count; i++) { if (p.getY(i) > miny + 1.2) continue; const x = p.getX(i), z = p.getZ(i); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); n++; }
  e = n ? { x0, x1, z0, z1, miny, h: maxy - miny } : null; baseCache.set(geo.uuid, e); return e;
}

// A. colliders
const RAISED_Y0 = 2.5;                                                                    // collider bottom above this = on a raised deck, not on the road (counted: 'raised' in the report)
let raisedSkipped = 0;
for (const c of colliders) {
  const it = c.it;
  if (it.type !== 'cyl' && it.type !== 'box') continue;
  if (it.y1 < 0.45) continue;                                                           // kerb-high things are not obstacles for a car
  if (it.y0 > RAISED_Y0) { raisedSkipped++; continue; }                                  // stands on a raised deck / podium (e.g. the Tauride lanterns at y 3.3): a car below cannot touch it
  const site = siteOf(c.frames);
  const h = it.y1 > 300 ? 99 : it.y1;
  let samples, ext;
  if (it.type === 'cyl') { samples = samplesCyl(it.cx, it.cz, it.r); ext = 2 * it.r; }
  else {
    const cs = [[-it.hw, -it.hd], [it.hw, -it.hd], [it.hw, it.hd], [-it.hw, it.hd]];
    samples = samplesRect(cs.map(([lx, lz]) => [it.cx + lx * it.c + lz * it.s, it.cz - lx * it.s + lz * it.c])); ext = Math.max(2 * it.hw, 2 * it.hd);
  }
  objs.push({ src: 'collider', module: c.mod, file: site.file.replace(/^world\//, ''), line: site.line, chain: c.frames.slice(0, 4).map((f) => `${f.file.replace(/^world\//, '')}:${f.line}`).join(' < '),
    cat: it.bridgeItem ? 'bridge_item' : catOfFile(site.file, site.line, h, it.type), shape: it.type, x: it.cx, z: it.cz, r: it.type === 'cyl' ? it.r : null, size: it.type === 'box' ? [+(2 * it.hw).toFixed(2), +(2 * it.hd).toFixed(2)] : null,
    h: it.y1 > 300 ? null : +it.y1.toFixed(2), ext, samples });
}
// B. instanced meshes (visible furniture, also where no collider exists)
let instCount = 0, undergroundSkipped = 0, elevatedSkipped = 0;
scene.traverse((o) => {
  if (!o.isInstancedMesh || o.count < 1 || o.count > 60000) return;
  const name = o.name || (o.parent && o.parent.name) || 'unnamed';
  if (SKIP_MESH.test(name)) return;
  const bb = baseBox(o.geometry); if (!bb || bb.h < 0.45) return;
  if ((bb.x1 - bb.x0) > 6 || (bb.z1 - bb.z0) > 6) return;
  o.updateWorldMatrix(true, false);
  const M = new THREE.Matrix4(), W = new THREE.Matrix4(), V = new THREE.Vector3(), mod = meshOwner.get(o) || '?';
  for (let i = 0; i < o.count; i++) {
    o.getMatrixAt(i, M); W.multiplyMatrices(o.matrixWorld, M);
    V.set((bb.x0 + bb.x1) / 2, bb.miny, (bb.z0 + bb.z1) / 2).applyMatrix4(W);
    if (V.y < -2) { undergroundSkipped++; continue; }                                    // underground furniture (the metro halls: benches, lamp-box mullions at -70 m) is never on a carriageway: the audit tests the street ABOVE it (request of the metro owner, 2026-10-08)
    if (V.y > 2.5) { elevatedSkipped++; continue; }                                       // ELEVATED instances (roof pinnacles, finials and crowns of the sights, furniture on a viaduct deck: base more than 2.5 m above the street) do not stand on the carriageway below: the audit has no notion of height (landmarksModernVO erem46 pinnacles, third pass of streets)
    const corners = [[bb.x0, bb.z0], [bb.x1, bb.z0], [bb.x1, bb.z1], [bb.x0, bb.z1]].map(([x, z]) => { V.set(x, bb.miny, z).applyMatrix4(W); return [V.x, V.z]; });
    let cx = 0, cz = 0; for (const c of corners) { cx += c[0] / 4; cz += c[1] / 4; }
    const sc = Math.max(Math.hypot(W.elements[0], W.elements[2]), 1e-6);
    objs.push({ src: 'mesh', module: mod, file: name, line: 0, chain: name, cat: meshCat(name), shape: 'mesh', x: cx, z: cz, r: null, size: [+(bb.x1 - bb.x0).toFixed(2), +(bb.z1 - bb.z0).toFixed(2)], h: +bb.h.toFixed(2), ext: Math.max(bb.x1 - bb.x0, bb.z1 - bb.z0) * sc, samples: samplesRect(corners) });
    instCount++;
  }
});
// C. guard rails (visual runs, no collider) and trolleybus masts
for (const g of st.guardRails || []) for (let i = 0; i + 1 < g.pts.length; i++) {
  const a = g.pts[i], b = g.pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.0));
  const samples = []; for (let j = 0; j <= n; j++) samples.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n, 0]);
  objs.push({ src: 'service', module: 'streets', file: 'streets/barriers.js', line: 0, chain: g.id, cat: 'guard_rail', shape: 'seg', x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, r: null, size: null, h: 1.05, ext: 0.1, samples });
}

// ---------------------------------------------------------------- evaluate
const EDGE = Number(opt('edge', 0.2));                                                   // 0.2 m = the granite kerb itself: a footprint closer than that to the asphalt stands ON the kerb line
const regionOf = (x, z) => (x < -880 ? 'west' : x < 640 ? 'centre' : x < 1000 ? 'east' : 'far-east') + (z < -700 ? '/north' : z > 700 ? '/south' : '');
const excluded = { island: 0, plaza: 0, bridge_owned: 0, courtyard: 0, building: 0, big: 0, offroad: 0 }, exRows = [];
const NOT_FURNITURE = new Set(['building']);
const rows = [];
const medianProbe = (x, z, cen) => {                                                      // asphalt on BOTH sides within 9 m reached by two DIFFERENT ways of the SAME named street that run in opposite directions (a strip between the two carriageways) -> { gap, ... }
  const nx = -cen.tz, nz = cen.tx; let kr = null, kl = null, pr = null, pl = null;
  for (let k = 0.15; k < 9; k += 0.15) {
    if (kr == null) { const p = probe(x + nx * k, z + nz * k); if (p && p.m > 0.02 && p.w) { kr = k; pr = p; } }
    if (kl == null) { const p = probe(x - nx * k, z - nz * k); if (p && p.m > 0.02 && p.w) { kl = k; pl = p; } }
    if (kr != null && kl != null) break;
  }
  if (kr == null || kl == null || pl.w === pr.w) return null;
  if (!pl.w.name || pl.w.name !== pr.w.name || pl.tx * pr.tx + pl.tz * pr.tz > -0.5) return null;
  return { gap: +(kr + kl).toFixed(2), left: pl.w.id, right: pr.w.id, kl: +kl.toFixed(2), kr: +kr.toFixed(2), street: pl.w.name };
};
for (const o of objs) {
  if (NEAR && Math.hypot(o.x - NEAR[0], o.z - NEAR[1]) > NEAR[2]) continue;
  if (o.cat === 'building') { excluded.building++; continue; }
  if (o.ext > 6) { excluded.big++; continue; }
  let ev = null;
  for (const s of o.samples) { const p = probe(s[0], s[1]); if (!p) continue; if (!ev || p.m > ev.p.m) ev = { p, s }; }
  const cen = probe(o.x, o.z);
  let intr = ev ? ev.p.m : -99;                                                           // > 0 : the footprint reaches that far inside the asphalt edge
  let status = null, med = null;
  if (intr > -EDGE) status = intr > 0.05 ? 'on_road' : 'edge';
  else if (cen && cen.w && !o.rail && o.cat !== 'quay_rail') { med = medianProbe(o.x, o.z, cen); if (med && med.gap < 14) status = 'median'; }
  if (!status) { excluded.offroad++; continue; }
  let reason = null;
  if (o.src !== 'service' && inIsland(o.x, o.z)) reason = 'island';
  else if (deckAt(o.x, o.z, 0.3) || ctx.services.bridges?.deckY(o.x,o.z)!=null || o.cat === 'bridge_item') reason = 'bridge_owned';
  else if ((o.cat === 'landmark_item' || o.cat === 'ad_pillar') && ev && ev.p.w && ev.p.w.rank === 0) reason = 'courtyard';
  if (reason) { excluded[reason]++; if (ALLROWS) exRows.push({ cat: o.cat, x: +o.x.toFixed(1), z: +o.z.toFixed(1), reason, file: o.file }); continue; }
  const w = (cen && cen.w) || (ev && ev.p.w) || null;
  let free = null, total = null, lane = null, inPocket = false;
  if (cen && cen.w) {
    const e = o.shape === 'cyl' ? o.r : (o.ext || 0.3) / 2;
    total = cen.hL + cen.hR;
    free = Math.max(0, (cen.side - e) + cen.hL, cen.hR - (cen.side + e));                     // widest gap left beside the object (left of it / right of it)
    lane = nearestLane(o.x, o.z);
    inPocket = (cen.side > cen.hb && cen.side < cen.hR) || (cen.side < -cen.hb && -cen.side < cen.hL);
  }
  rows.push({
    cat: o.cat, status, x: +o.x.toFixed(1), z: +o.z.toFixed(1), clearance: +(-intr).toFixed(2), intrusion: +Math.max(0, intr).toFixed(2),
    road: w ? { id: w.id, name: w.name, hw: w.hw, rank: w.rank, w: w.w, oneway: w.oneway, bridge: !!w.bridge } : { fillet: true },
    hL: cen && cen.w ? +cen.hL.toFixed(2) : null, hR: cen && cen.w ? +cen.hR.toFixed(2) : null, hb: cen && cen.w ? +cen.hb.toFixed(2) : null, side: cen && cen.w ? +cen.side.toFixed(2) : null,
    total: total != null ? +total.toFixed(2) : null, free: free != null ? +free.toFixed(2) : null, fillet: !!(ev && ev.p.fillet), inPocket, median: med,
    lane: lane ? { id: lane.id, d: +lane.d.toFixed(2), idx: lane.idx } : null, pavement: sidewalkNear(o.x, o.z), kerb: ['lamp', 'bollard', 'sign_pole', 'zebra_pole', 'busstop_pole', 'speed_camera', 'guard_rail'].includes(o.cat) ? kerbOwner(o.x, o.z) : null, arm: (o.cat === 'signal_pole' || o.cat === 'signal_mast') ? armAt(o.x, o.z) : null,
    plaza: inPlaza(o.x, o.z), module: o.module, src: o.src, file: o.file, line: o.line, chain: o.chain, h: o.h, shape: o.shape, r: o.r, size: o.size, region: regionOf(o.x, o.z),
  });
}
/** root-cause code of a row (see the report: one code = one place in the code to fix) */
const rcOf = (r) => {
  if (r.status === 'median') return 'MEDIAN_STRIP/' + (r.median && r.median.gap < 7.5 ? 'gap<7.5 (no real median)' : 'gap>=7.5 (boulevard)') + '/' + r.cat;
  if (r.cat === 'signal_pole' || r.cat === 'signal_mast') return 'SIGNAL_STOPLINE/' + (r.arm ? { foreign: 'foreign carriageway (junction cluster / micro arm / twin carriageway)', fillet: 'junction fillet', own: 'parking-pocket taper', none: 'edge' }[r.arm.coveredBy] : 'unmatched');
  if (r.cat === 'zebra_pole') return 'ZEBRA_POLE/' + (r.fillet ? 'junction fillet' : r.inPocket ? 'parking pocket' : 'kerb offset vs widened asphalt');
  if (r.cat === 'quay_rail') return 'QUAY_RAIL/' + (r.road.bridge ? 'across a road bridge deck' : 'road on the quay edge');
  // FACADE_COLLIDER: the wall collider of a landmark house (landmarksD/house.js buildHouse -> lib/massing addPolyColliders, one box per footprint edge). The OSM footprint of that building overlaps a MAPPED lane
  // (Monastyrki embankment, a junction fillet corner): the facade is the real building and stays; its collider cannot be cut against the lane because the callers build
  // before streets and no net exists yet (a second buildNet costs 2.4 s). Documented residue, allowed by --strict; every OTHER landmark item on a road keeps failing.
  if (r.cat === 'landmark_item' && r.shape === 'box' && /landmarksD\/house\.js$/.test(r.file || '')) return 'FACADE_COLLIDER/' + r.file;
  if (r.cat === 'landmark_item') return 'LANDMARK_FURNITURE/' + r.file;
  if (r.cat === 'wire_mast') return 'WIRE_MAST/' + (r.fillet ? 'junction fillet' : 'beside carriageway');
  if (r.cat === 'lamp' || r.cat === 'bollard') return 'KERB_' + r.cat.toUpperCase() + '/' + (r.inPocket ? 'parking pocket' : r.kerb && r.road.id !== r.kerb.way ? 'kerb of another way' : 'own kerb');
  if (r.cat === 'tree') return 'TREE/' + (r.inPocket ? 'parking pocket' : 'edge of asphalt');
  return r.cat.toUpperCase() + '/' + r.file;
};
for (const r of rows) r.rc = rcOf(r);
// one physical object seen as a collider AND as an instance (within 0.7 m): keep the collider row (it names the placer), remember the other
rows.sort((a, b) => (a.src === 'collider' ? 0 : a.src === 'service' ? 1 : 2) - (b.src === 'collider' ? 0 : b.src === 'service' ? 1 : 2));
const kept = [], hash = new Map();
for (const r of rows) {
  const gx = Math.floor(r.x), gz = Math.floor(r.z); let dup = null;
  if (r.src !== 'service') for (let a = gx - 1; a <= gx + 1 && !dup; a++) for (let b = gz - 1; b <= gz + 1 && !dup; b++) for (const q of hash.get(a + ',' + b) || []) if (Math.hypot(q.x - r.x, q.z - r.z) < 0.7 && q.src !== r.src && q.src !== 'service') { dup = q; break; }
  if (dup) { (dup.alsoSeenAs ||= []).push(r.file); continue; }
  const k = gx + ',' + gz; let l = hash.get(k); if (!l) hash.set(k, (l = [])); l.push(r); kept.push(r);
}
kept.sort((a, b) => a.clearance - b.clearance);

// ---------------------------------------------------------------- summary
const by = (list, f) => { const m = new Map(); for (const r of list) { const k = f(r); m.set(k, (m.get(k) || 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1]); };
const onRoad = kept.filter((r) => r.status === 'on_road'), edge = kept.filter((r) => r.status === 'edge'), median = kept.filter((r) => r.status === 'median');
const site = (r) => `${r.file}${r.line ? ':' + r.line : ''}`;
const summary = {
  raisedSkipped, modulesBuilt: buildLog, objectsTested: objs.length, colliders: colliders.length, meshInstances: instCount, excluded, edgeThreshold: EDGE,
  onRoad: onRoad.length, edge: edge.length, onMedian: median.length,
  blocking: onRoad.filter((r) => r.free != null && r.free < 3.0).length, onNarrow: onRoad.filter((r) => r.road.w != null && r.road.w < 7).length,
  onRoadByCategory: by(onRoad, (r) => r.cat), edgeByCategory: by(edge, (r) => r.cat), onMedianByCategory: by(median, (r) => r.cat),
  onRoadBySite: by(onRoad, site), edgeBySite: by(edge, site), onMedianBySite: by(median, site),
  onRoadByRank: by(onRoad, (r) => (r.road.fillet ? 'fillet' : `rank${r.road.rank} ${r.road.hw}`)),
  byRootCause: by(kept, (r) => r.status + " " + r.rc),
  onRoadByRegion: by(onRoad, (r) => r.region), onMedianByRegion: by(median, (r) => r.region),
};
const agg = new Map();
for (const r of [...onRoad, ...median]) {
  const k = r.road.fillet ? 'fillet' : `${r.road.name || '(unnamed ' + r.road.hw + ')'} [${r.road.id}] rank${r.road.rank} w${r.road.w}`;
  let e = agg.get(k); if (!e) agg.set(k, (e = { road: k, onRoad: 0, onMedian: 0, minFree: 99, cats: {} }));
  if (r.status === 'on_road') e.onRoad++; else e.onMedian++; if (r.free != null) e.minFree = Math.min(e.minFree, r.free); e.cats[r.cat] = (e.cats[r.cat] || 0) + 1;
}
summary.roads = [...agg.values()].sort((a, b) => b.onRoad + b.onMedian - a.onRoad - a.onMedian).slice(0, 80);
const narrow = new Map();
for (const r of onRoad) if (r.road.w != null && r.road.w < 7) { const k = `${r.road.name || '(unnamed ' + r.road.hw + ')'} [${r.road.id}] w${r.road.w}`; let e = narrow.get(k); if (!e) narrow.set(k, (e = { road: k, n: 0, minFree: 99, total: r.total })); e.n++; e.minFree = Math.min(e.minFree, r.free ?? 99); }
summary.narrowRoads = [...narrow.values()].sort((a, b) => b.n - a.n).slice(0, 40);

const fmt = (l) => l.map(([k, v]) => `${k} ${v}`).join(', ');
console.log(`roads-furniture-audit: ${objs.length} objects tested (${colliders.length} colliders, ${instCount} mesh instances) from ${MODULES.length} modules`);
console.log(`  excluded: ${Object.entries(excluded).map(([k, v]) => k + ' ' + v).join(', ')}`);
console.log(`  ON ROAD: ${onRoad.length} (blocking, free < 3 m: ${summary.blocking}; on narrow roads w < 7: ${summary.onNarrow})   EDGE (< ${EDGE} m): ${edge.length}   ON MEDIAN STRIP: ${median.length}`);
console.log('  on_road by category : ' + fmt(summary.onRoadByCategory));
console.log('  edge by category    : ' + fmt(summary.edgeByCategory));
console.log('  median by category  : ' + fmt(summary.onMedianByCategory));
console.log('  by root cause       :'); for (const [k, v] of summary.byRootCause.slice(0, 30)) console.log('    ' + String(v).padStart(5) + '  ' + k);
console.log('  on_road by region   : ' + fmt(summary.onRoadByRegion));
console.log('  on_road by placer   : ' + fmt(summary.onRoadBySite.slice(0, 14)));
console.log('  on_road by road kind: ' + fmt(summary.onRoadByRank));
console.log('  worst roads:'); for (const r of summary.roads.slice(0, 12)) console.log(`    ${r.road}: ${r.onRoad} on road, ${r.onMedian} on median, min free ${r.minFree}  ${JSON.stringify(r.cats)}`);
console.log(`  worst ${TOP} (status cat x,z clearance road free/total placer):`);
for (const r of kept.slice(0, TOP)) console.log(`    ${r.status.padEnd(7)} ${r.cat.padEnd(13)} ${String(r.x).padStart(8)},${String(r.z).padStart(8)} ${String(r.clearance).padStart(6)}  ${(r.road.name || r.road.hw || 'fillet').slice(0, 26).padEnd(26)} w${r.road.w ?? '-'} rk${r.road.rank ?? '-'} free ${r.free ?? '-'}/${r.total ?? '-'}  ${site(r)}`);
// ---------------------------------------------------------------- extra road checks (plan critic): things that are not objects but stand / stop on the carriageways
const wayById = new Map(net.ways.map((w) => [w.id, w])), laneById = new Map(st.lanes.map((l) => [l.id, l]));
const extras = { stopLinesForeign: [], lotSlotsInStreet: [] };
for (const sl of st.stopLines) {                                   // a signalised stop point (lane end) inside ANOTHER carriageway: the stop line paint / the cars stop in the cross road
  if (!sl.signal) continue;
  const c = net.cover(sl.x, sl.z, { skip: wayById.get(laneById.get(sl.lane)?.road), noFillets: true });
  if (c > 1.5) extras.stopLinesForeign.push({ x: +sl.x.toFixed(1), z: +sl.z.toFixed(1), cover: +c.toFixed(1), lane: sl.lane });
}
for (const ps of st.parkedSlots) {                                 // parking-lot slots whose centre is inside the asphalt of a street (rank >= 1): cars parked in the carriageway
  if (ps.kind !== 'lot') continue;
  let hit = null; net.each(ps.x, ps.z, 14, (w, i) => { if (w.rank < 1 || w.skipDraw) return; const q = segInfo(w, i, ps.x, ps.z), m = q.h - q.c.d; if (m > 1.0 && (!hit || m > hit.m)) hit = { m, w }; });
  if (hit) extras.lotSlotsInStreet.push({ x: +ps.x.toFixed(1), z: +ps.z.toFixed(1), inside: +hit.m.toFixed(1), road: hit.w.name || hit.w.hw });
}
console.log(`  extra: signalised stop points inside a foreign carriageway (> 1.5 m): ${extras.stopLinesForeign.length};  lot parking slots inside a street (rank >= 1, > 1 m): ${extras.lotSlotsInStreet.length}   (--strict fails on the lot slots, --extras-fail on both)`);
// --allow a,b : on_road rows whose "<cat>" or "<rc>" starts with / contains one of the tokens do not fail the run (the whitelist of the plan: documented residue only)
// DEFAULT_ALLOW is applied with --strict (the plain 'node tools/roads-furniture-audit.mjs --strict' of the briefs); explicit --allow tokens extend it;  --allow none switches everything off.
// Documented residue (see docs/ROADS-FIX-PLAN.md): GUARD_STONE (kerb stones of the quays), PROP (osm props the props module owns), BIN (litter bins at the kerb), TREE (trunks in parking pockets / at the asphalt edge), FACADE_COLLIDER (wall collider of a landmark house whose OSM footprint overlaps a mapped lane; the facade stays).
// What was allowed is printed row by row (category + count) so the residue stays visible.
const DEFAULT_ALLOW = ['GUARD_STONE', 'PROP', 'BIN', 'TREE', 'FACADE_COLLIDER'];
const ALLOW = opt('allow') === 'none' ? [] : [...new Set([...(argv.includes('--strict') ? DEFAULT_ALLOW : []), ...(opt('allow') || '').split(',').filter(Boolean)])];     // explicit tokens EXTEND the strict default
const allowed = onRoad.filter((r) => ALLOW.some((a) => r.cat === a || r.rc.includes(a)));
const blocking = onRoad.filter((r) => !allowed.includes(r));
if (ALLOW.length) {
  console.log(`  allow ${ALLOW.join(',')}: ${allowed.length} on_road rows allowed, ${blocking.length} still failing`);
  for (const [k, v] of by(allowed, (r) => r.cat + ' / ' + r.rc.split('/')[0])) console.log(`      allowed ${String(v).padStart(3)}  ${k}`);
}
console.log(`  strict criteria: on_road failing ${blocking.length}, median gap<7.5 ${median.filter((r) => r.rc.includes('gap<7.5')).length}, lot slots in a street ${extras.lotSlotsInStreet.length}`);
console.log(`  raised colliders skipped (bottom y0 > ${RAISED_Y0} m): ${raisedSkipped}; underground instances skipped (base y < -2 m): ${undergroundSkipped}; elevated instances skipped (base y > 2.5 m): ${elevatedSkipped}`);
if (blocking.length) { console.log('  failing on_road rows:'); for (const r of blocking.slice(0, 40)) console.log(`      ${r.cat.padEnd(13)} ${String(r.x).padStart(8)},${String(r.z).padStart(8)} intrusion ${r.intrusion}  ${r.rc}  ${site(r)}`); }
const fail = blocking.length > 0 || (EDGE_FAILS && edge.length > 0) || ((argv.includes('--median-fails') || argv.includes('--strict')) && median.filter((r) => r.rc.includes('gap<7.5')).length > 0)
  || ((argv.includes('--extras-fail') && extras.stopLinesForeign.length > 0) || ((argv.includes('--extras-fail') || argv.includes('--strict')) && extras.lotSlotsInStreet.length > 0));
if (JSON_OUT) { fs.mkdirSync(path.dirname(path.resolve(JSON_OUT)), { recursive: true }); fs.writeFileSync(path.resolve(JSON_OUT), JSON.stringify({ summary, extras, offenders: kept, signalArms, simulateFix: globalThis.__simFix || null, excludedRows: exRows }, null, 1)); console.log('wrote ' + JSON_OUT); }
console.log(fail ? 'RESULT: FAIL' : 'RESULT: OK');
process.exit(fail ? 1 : 0);
