// environment/far.js - Saint Petersburg beyond the data extent, out to ~5 km: the horizon of a flat city of 5-6 storey perimeter blocks (docs/research/streets.md,
// architecture.md; photos refs/nevsky / architecture of the roofline).
//   * ~8000 instanced boxes on the continuation of the street grid in the Nevsky frame (farconf.js): perimeter blocks of 4 long sides (14 m deep, 19-26 m high: 5-6 storeys,
//     the cornice line and a dark mansard band at the top), a window-grid shader with a darker ground-floor band, pastel stucco colours (ochre, salmon, mint, grey-blue, cream),
//     grey / green / rust sheet-iron roof tones; denser near the centre, thinning out to 4 km, 9-storey panel slabs in the outskirts; keeps clear of the Fontanka / Neva, the
//     rail corridor south-east of the Moscow station (the rail module draws the yard) and the landmark footprints
//   * landmarks in the right directions (lon / lat -> metres, 1-3 draw calls each, merged vertex-coloured meshes) of the sights that no module of the strip builds: Peter and Paul cathedral spire, the Strelka (Exchange,
//     Rostral columns) and the Universitetskaya embankment across the Neva, Smolny Cathedral, the TV tower (316 m); drawn only while the module of the sight is not built (sightIsReal)
//   * distant street trees / park groves (20-triangle blobs), a dim green-grey suburb ring at the horizon (broken where the Neva scenery of water.js / quay.js runs through it)
// Everything is cheap (instanced boxes / strips, ctx.noOutline) and uses the far fog (FAR_FOG): the horizon stays readable while the sky shader fades to the same fog
// colour. Nothing here is closer than ~130 m to the playable area.
import * as THREE from 'three';
import * as L from '../layout.js';
import { EXTENT, EXTENT_RECTS, BUILDINGS } from '../data/city.js';
import { waterfrontCoverage } from './waterfront-coverage.js';
import { FAR_FOG, FAR_GRID, fromGrid } from './farconf.js';
import { farFogPatch, FAR_FOG_GLSL } from './ground.js';
import { Acc, hash2, mix, sstep, lonLatToXZ, pointInRing, distToRing, coneCulled } from './util.js';
import { canopyGeometry } from './treegeo.js';
import { waterRings } from './river.js';
import { coverageDistance, horizonRadii, HORIZON_JITTER } from './far-coverage.js';
import { ZONES } from '../lib/area-tables.js';

const SQ = L.SQUARE;
// Continue the distant city around the complete coverage union. A fixed 4.7 km
// backdrop crossed Moskovsky Prospekt when only P/V rectangles were protected.
// Keep the original cell ordering/seeds, but use every rectangle for its belt
// and horizon clearance, so future districts cannot encounter the same wall.
const FAR_BELT = 1700;
/** distance (m) from (x, z) to the coverage union (0 inside) */
const distanceToCoverage = (x, z) => coverageDistance(EXTENT_RECTS, x, z);
const onWaterfront = waterfrontCoverage(BUILDINGS);
const TV = [30.3207, 59.9766];
/** a far silhouette of a sight stands only while no landmark module draws the sight: the module is in the build list (ctx.buildList) and its claims (layout.GROUPS.<module>) exist. The strip builds none of the five sights
 *  that have a silhouette here (Peter and Paul, Smolny, the Strelka, the University embankment, the TV tower), so all of them are drawn across the Neva / on the horizon */
const sightIsReal = (ctx, m) => ((ctx.buildList || []).includes(m) && (L.GROUPS[m] || []).length > 0) ||
  ((ctx.buildList || []).includes('landmarksRiverfront') && (L.GROUPS.landmarksRiverfront||[]).some(g=>g.sourceModule===m));
const WALL = [['#e3c288', 3], ['#d9917f', 2], ['#cfd6c4', 1.6], ['#b9d0b0', 1.5], ['#e6e2d8', 2.2], ['#e6d2a0', 2.6], ['#cc7f6c', 1.4], ['#aab2c0', 1.4], ['#e8b898', 1.6], ['#d8b8a0', 1.2], ['#c9b48a', 1.4]];
const PANEL = [['#c9c5bb', 2], ['#d7c8aa', 1.5], ['#b8c4cc', 1.5], ['#cfc2b4', 1.2]];
const pickFrom = (tab, r) => { let t = 0; for (const [, w] of tab) t += w; let x = r * t; for (const [c, w] of tab) { x -= w; if (x <= 0) return c; } return tab[0][0]; };

// ---------------------------------------------------------------- the block material (window grid, cornice, mansard band, cel light, far fog)
function blockMaterial(ctx) {
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uFogK: { value: new THREE.Vector2(FAR_FOG.D0, FAR_FOG.K) } }]);
  uniforms.uSunDir = ctx.shared.uSunDir; uniforms.uNight = ctx.shared.uNight;
  return new THREE.ShaderMaterial({
    uniforms, fog: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 aDim;           // width, height, depth, floor height
      varying vec3 vN; varying vec3 vLn; varying vec3 vLp; varying vec3 vCol; varying vec4 vDim; varying vec3 vW;
      void main(){
        vec4 p = vec4(position, 1.0); vLp = position * aDim.xyz; vDim = aDim; vLn = normal;
        #ifdef USE_INSTANCING_COLOR
          vCol = instanceColor;
        #else
          vCol = vec3(1.0);
        #endif
        p = instanceMatrix * p;
        vec4 wp = modelMatrix * p; vW = wp.xyz;
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSunDir; uniform float uNight; uniform vec2 uFogK;
      varying vec3 vN; varying vec3 vLn; varying vec3 vLp; varying vec3 vCol; varying vec4 vDim; varying vec3 vW;
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      vec3 roofTone(float r){
        if (r < 0.36) return vec3(0.54, 0.56, 0.58);        // grey sheet iron
        if (r < 0.62) return vec3(0.40, 0.55, 0.43);        // green
        if (r < 0.82) return vec3(0.60, 0.35, 0.28);        // rust red
        return vec3(0.34, 0.36, 0.38);                      // dark
      }
      void main(){
        vec3 N = normalize(vN), S = normalize(uSunDir);
        float nl = dot(N, S);
        vec3 col = vCol;
        float lit = nl > 0.32 ? 1.0 : (nl > 0.02 ? 0.84 : 0.62);
        float rr = h21(vec2(vDim.x, vDim.z) + 3.1);
        vec3 roof = roofTone(rr);
        if (N.y > 0.5) {                                                        // roof top
          col = roof * 0.9;
          lit = nl > 0.32 ? 1.0 : 0.8;
        } else {
          float horiz = abs(vLn.x) > 0.5 ? vLp.z : vLp.x;
          float h = vLp.y;
          vec2 cell = vec2(horiz / 2.3, h / vDim.w);
          float fw = max(length(fwidth(cell)), 1e-4);
          float wa = 1.0 - smoothstep(0.35, 0.9, fw);
          vec2 f = fract(cell);
          float upper = step(vDim.w * 1.25, h) * step(h, vDim.y - 3.6);          // windows only on the upper storeys, below the mansard band
          float win = step(0.26, f.x) * step(f.x, 0.74) * step(0.22, f.y) * step(f.y, 0.82) * upper;
          float rnd = h21(floor(cell) + vec2(vDim.x * 0.37, vDim.z * 0.51));
          float on = step(0.7, rnd) * uNight;
          vec3 glass = mix(vec3(0.27, 0.35, 0.44), vec3(0.62, 0.70, 0.78), step(0.86, rnd));
          col = mix(col, glass, win * wa * 0.8 * (1.0 - on));
          col = mix(col, vec3(1.0, 0.82, 0.5), win * wa * on * 0.9);
          float cornice = step(vDim.y - 3.9, h) * step(h, vDim.y - 3.5);       // light cornice line
          col = mix(col, vec3(0.93, 0.9, 0.84), cornice * 0.8);
          float mansard = step(vDim.y - 3.5, h);                               // dark roof band
          col = mix(col, roof, mansard * 0.92);
          float base = step(h, vDim.w * 1.2);                                  // rusticated ground floor + shopfronts
          col = mix(col, col * vec3(0.8, 0.77, 0.74), base * 0.8);
          col *= mix(0.78, 1.0, smoothstep(0.0, 4.0, h));                      // dust / shadow at the foot
        }
        col *= lit * mix(vec3(1.0), vec3(0.86, 0.91, 1.06), step(lit, 0.7));
        col *= mix(1.0, 0.45, uNight * 0.85);
        gl_FragColor = vec4(col, 1.0);
        ${FAR_FOG_GLSL}
      }`,
  });
}

function boxGeometry() {
  const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); g.deleteAttribute('uv');
  return g;
}

// ---------------------------------------------------------------- the world pieces that blocks must avoid
const LANDMARKS = [                                   // [name, lon, lat]: the footprints are cleared of blocks
  ['peterpaul', 30.3166, 59.9500], ['smolny', 30.3956, 59.9486], ['tv', TV[0], TV[1]],
];
function distToPolyline(x, z, pts) {
  let best = 1e9;
  for (let i = 0; i + 1 < pts.length; i++) {
    const ax = pts[i][0], az = pts[i][1], dx = pts[i + 1][0] - ax, dz = pts[i + 1][1] - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    best = Math.min(best, Math.hypot(ax + dx * t - x, az + dz * t - z));
  }
  return best;
}

// ---------------------------------------------------------------- distant blocks
function genBlocks(ctx) {
  const E = EXTENT, items = [], parks = [], G = FAR_GRID;
  const inE = (x, z, m) => L.inExtent(x, z, -m);                                  // inside the data extent (the union of its rectangles), or within m metres outside it
  const rings = waterRings().map((r) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < r.o.length; i += 2) { x0 = Math.min(x0, r.o[i]); x1 = Math.max(x1, r.o[i]); z0 = Math.min(z0, r.o[i + 1]); z1 = Math.max(z1, r.o[i + 1]); } return { ...r, box: [x0 - 60, x1 + 60, z0 - 60, z1 + 60] }; }), lm = LANDMARKS.map(([n, lon, lat]) => lonLatToXZ(lon, lat));
  const nearRiver = (x, z) => rings.some((r) => x > r.box[0] && x < r.box[1] && z > r.box[2] && z < r.box[3] && (pointInRing(x, z, r.o) || distToRing(x, z, r.o) < (r.key === 'neva' ? 30 : 38)));
  const nearNeva = () => false;
  const overWater = (x, z) => rings.some((r) => x > r.box[0] && x < r.box[1] && z > r.box[2] && z < r.box[3] && pointInRing(x, z, r.o));
  /** a long block must not lie across a canal: its centre is tested with a margin by nearRiver, its ends and quarter points only for being over the water */
  const spansWater = (x, z, rot, bw, bd) => { const c = Math.cos(rot), sn = Math.sin(rot); for (const t of [-0.5, -0.25, 0.25, 0.5]) { if (overWater(x + t * bw * c, z - t * bw * sn) || overWater(x + t * bd * sn, z + t * bd * c)) return true; } return false; };
  const rail = (x, z) => { const t = (z - 900) / 0.974; if (t < -150) return false; const cx = 690 + 0.225 * t; return Math.abs(x - cx) < 150; };
  const rot0 = Math.PI / 2 - (L.GRID_DEG * Math.PI) / 180;
  const RMAX = 4300;
  const q = ctx.quality && (ctx.quality.level || ctx.quality.name), thin = q === 'low' ? 0.5 : q === 'medium' ? 0.75 : 1;
  const N = 31, NP = 72;                                                          // 31 cells each way round the Square; the belt round the strip's far ends needs up to 72 (its cells come AFTER the inner ones: the inner blocks keep their order)
  const cells = []; for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) cells.push([i, j]);
  for (let i = -NP; i <= NP; i++) for (let j = -NP; j <= NP; j++) if (Math.abs(i) > N || Math.abs(j) > N) cells.push([i, j]);
  for (const [i, j] of cells) {
    const u0 = G.u0 + G.pu * i, v0 = G.v0 + G.pv * j, uc = u0 + G.pu / 2, vc = v0 + G.pv / 2, c = fromGrid(uc, vc);
    const d = Math.hypot(c.x - SQ.x, c.z - SQ.z), pd = d > RMAX ? distanceToCoverage(c.x, c.z) : 1e9, belt = d > RMAX; if (belt && pd > FAR_BELT) continue;
    if (inE(c.x, c.z, 60) || onWaterfront(c.x,c.z)) continue;
    if (nearRiver(c.x, c.z) || nearNeva(c.x, c.z) || rail(c.x, c.z) || lm.some((p) => Math.hypot(p[0] - c.x, p[1] - c.z) < 130)) continue;
    let dm = d; for (const q of ZONES.farCentres) dm = Math.min(dm, Math.hypot(c.x - q.x, c.z - q.z) + q.bias);      // the area's ZONES.farCentres (the strip: the historic centre reaches the Admiralty and over the Neva (Vasilievsky, Petrograd side): dense stone blocks there too)
    const dens = belt ? 0.92 * (1 - 0.55 * sstep(FAR_BELT * 0.5, FAR_BELT, pd)) : dm < 2600 ? 0.95 : dm < 3400 ? 0.82 : 0.82 * (1 - 0.85 * sstep(3400, RMAX, dm));
    if (hash2(i, j, 901) > dens * thin) continue;
    const t = hash2(i, j, 902), outer = belt ? pd > FAR_BELT * 0.6 : dm > 2600;      // the belt: perimeter blocks of the old districts near the play edge, panel slabs further out
    if (t < 0.06) { parks.push({ x: c.x, z: c.z, w: G.pu - 40, d: G.pv - 40, rot: rot0 }); continue; }                 // a park / garden: trees only
    const ub = u0 + 9, ue = u0 + G.pu - 9, vb = v0 + 9, ve = v0 + G.pv - 9;
    const place = (lu, lv, w, dd, h, along, col, fh = 3.9) => {                    // lu / lv: centre in grid coords; along: 0 = long side along u, 1 = along v
      const p = fromGrid(lu, lv), rot = rot0 + (along ? Math.PI / 2 : 0);
      if (inE(p.x, p.z, 8) || onWaterfront(p.x,p.z) || nearRiver(p.x, p.z) || nearNeva(p.x, p.z)) return;
      const bw = along ? dd : w, bd = along ? w : dd;
      if (spansWater(p.x, p.z, rot, bw, bd)) return;
      items.push({ x: p.x, z: p.z, rot, w: bw, d: bd, h, col, fh });
    };
    const base = pickFrom(WALL, hash2(i, j, 903)), alt = pickFrom(WALL, hash2(i, j, 904));
    if (outer && t > 0.6) {                                                           // 9-storey panel slabs, two or three in a yard
      const n = 2 + (hash2(i, j, 905) < 0.4 ? 1 : 0), col = pickFrom(PANEL, hash2(i, j, 906)), al = hash2(i, j, 907) < 0.5 ? 0 : 1;
      for (let k = 0; k < n; k++) {
        const lu = ub + (ue - ub) * (0.2 + 0.6 * hash2(i, j, 908 + k)), lv = vb + (ve - vb) * ((k + 0.5) / n);
        place(lu, lv, 54 + hash2(i, j, 911 + k) * 30, 12.5, 25.5 + hash2(i, j, 914 + k) * 3, al, col, 2.9);
      }
      continue;
    }
    // perimeter block: four sides around a courtyard (some blocks have a gap or a lower wing)
    const dep = 14 + hash2(i, j, 920) * 2, hh = 20.5 + Math.floor(hash2(i, j, 921) * 3) * 1.6 + (hash2(i, j, 922) < 0.15 ? 3 : 0), lowSide = hash2(i, j, 923) < 0.2 ? 1 + Math.floor(hash2(i, j, 924) * 4) : 0;
    const sides = [
      [(ub + ue) / 2, vb + dep / 2, ue - ub, dep, 0], [(ub + ue) / 2, ve - dep / 2, ue - ub, dep, 0],
      [ub + dep / 2, (vb + ve) / 2, ve - vb - 2 * dep, dep, 1], [ue - dep / 2, (vb + ve) / 2, ve - vb - 2 * dep, dep, 1],
    ];
    sides.forEach(([lu, lv, len, dd, al], k) => {
      if (hash2(i, j, 930 + k) < 0.06) return;                                          // a gap in the street wall (a gate yard, a demolished house)
      const h = k + 1 === lowSide ? hh - 4 : hh + (hash2(i, j, 940 + k) - 0.5) * 1.6;
      place(lu, lv, len, dd, h, al, hash2(i, j, 950 + k) < 0.3 ? alt : base);
    });
    if (hash2(i, j, 960) < 0.18) place((ub + ue) / 2, (vb + ve) / 2, 22 + hash2(i, j, 961) * 20, 12, 12 + hash2(i, j, 962) * 4, hash2(i, j, 963) < 0.5 ? 0 : 1, base);   // a yard annex
  }
  return { items, parks, rot0 };
}

function buildBlocks(ctx, group, gen) {
  const items = gen.items;
  if (!items.length) return 0;
  buildFarTrees(ctx, group, items, gen.parks);
  const mat = blockMaterial(ctx);
  const im = new THREE.InstancedMesh(boxGeometry(), mat, items.length);
  const dims = new Float32Array(items.length * 4), m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  items.forEach((b, k) => {
    qt.setFromAxisAngle(up, b.rot); m4.compose(pos.set(b.x, 0, b.z), qt, sc.set(b.w, b.h, b.d)); im.setMatrixAt(k, m4);
    im.setColorAt(k, col.set(b.col).multiplyScalar(0.94 + 0.12 * hash2(k, 3, 77)));
    dims[k * 4] = b.w; dims[k * 4 + 1] = b.h; dims[k * 4 + 2] = b.d; dims[k * 4 + 3] = b.fh;
  });
  im.geometry.setAttribute('aDim', new THREE.InstancedBufferAttribute(dims, 4));
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false; im.name = 'env-far-blocks'; im.castShadow = false; im.receiveShadow = false;
  ctx.noOutline(im); ctx.noBatch(im); group.add(im);
  coneCulled(ctx, im, [im.geometry.getAttribute('aDim')], { near: 300, move: 80 });                    // only the blocks in front of the camera reach the GPU
  return items.length;
}

// ---------------------------------------------------------------- distant trees: 20-triangle blobs (limes / maples) in the park cells and a few between the blocks
function buildFarTrees(ctx, group, items, parks) {
  const q = ctx.quality && (ctx.quality.level || ctx.quality.name), cap = q === 'low' ? 1200 : q === 'medium' ? 2400 : 3600, E = EXTENT;
  const list = [];
  for (const p of parks) {                                                           // park cells: a loose grove
    const c = Math.cos(p.rot), s = Math.sin(p.rot), n = 26 + Math.floor(hash2(Math.round(p.x), Math.round(p.z), 311) * 16);
    for (let i = 0; i < n && list.length < cap; i++) {
      const lx = (hash2(i, Math.round(p.x), 312) - 0.5) * p.w, lz = (hash2(i, Math.round(p.z), 313) - 0.5) * p.d;
      list.push([p.x + lx * c + lz * s, p.z - lx * s + lz * c, hash2(i, Math.round(p.x + p.z), 314), 1.5]);
    }
  }
  for (let k = 0; k < items.length && list.length < cap; k += 3) {                    // street trees at the corners of some blocks
    const b = items[k], n = 1 + Math.floor(hash2(k, 1, 301) * 3), c = Math.cos(b.rot), s = Math.sin(b.rot);
    for (let i = 0; i < n; i++) {
      const lx = (hash2(k, i, 302) - 0.5) * (b.w + 24), lz = (hash2(k, i, 303) < 0.5 ? -1 : 1) * (b.d / 2 + 6 + hash2(k, i, 308) * 4);
      const x = b.x + lx * c + lz * s, z = b.z - lx * s + lz * c;
      if (L.inExtent(x, z, -4)) continue;
      list.push([x, z, hash2(k, i, 304), 1.0]);
    }
  }
  if (!list.length) return;
  const mat = farFogPatch(ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0.03, name: 'env-fartrees-pb' }), 'fartrees-pb');
  const kinds = [['limeA', 0.62, ['#46702a', '#3f6a2a', '#52783a', '#486e30']], ['mapleA', 0.38, ['#5a8e36', '#63963c', '#548a30']]];
  const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  let lo = 0;
  for (const [fam, frac, hexes] of kinds) {
    const n = Math.min(list.length - lo, Math.round(list.length * frac));
    if (!n) continue;
    const im = new THREE.InstancedMesh(canopyGeometry(fam, 3), mat, n);
    for (let i = 0; i < n; i++) {
      const [x, z, h, big] = list[lo + i], s = (0.7 + 0.6 * h) * big;
      qt.setFromAxisAngle(up, h * 40); m4.compose(pos.set(x, 0, z), qt, sc.set(s, s * (0.9 + 0.3 * hash2(i, lo, 305)), s)); im.setMatrixAt(i, m4);
      im.setColorAt(i, col.set(hexes[Math.floor(hash2(i, lo, 306) * hexes.length)]).multiplyScalar(0.9 + 0.2 * hash2(i, lo, 307)));
    }
    lo += n; im.count = n; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false; im.name = 'env-far-trees-' + fam;
    ctx.noOutline(im); ctx.noBatch(im); group.add(im);
    coneCulled(ctx, im, [], { near: 300, move: 80 });
  }
}

// ---------------------------------------------------------------- suburb ring on the horizon (low dim green-grey rows of trees and 9-storey panel houses)
function ringStrip(ctx, group, name, R0, rJit, hBase, hJit, colA, colB, opts = {}) {
  const A = new Acc(true), N = opts.n || 900, ca = new THREE.Color(colA), cb = new THREE.Color(colB);
  const arc = opts.arc || [0, Math.PI * 2];
  const hAt = (a, i) => Math.max(2, hBase + hJit * (0.55 * Math.sin(a * 41 + 1.3) + 0.3 * Math.sin(a * 97 + 2.1) + 0.5 * (hash2(i, 5, 7) - 0.5) * 2));
  let prev = null;
  for (let i = 0; i <= N; i++) {
    const a = arc[0] + (arc[1] - arc[0]) * i / N, r = (opts.radius ? opts.radius(a) : R0) + rJit * Math.sin(a * 7 + 0.4), x = SQ.x + Math.cos(a) * r, z = SQ.z + Math.sin(a) * r, h = hAt(a, i);
    if (opts.skip && opts.skip(x, z)) { prev = null; continue; }                     // (the strip is broken where it would stand on water: the Neva scenery runs through the ring)
    const nx = -Math.cos(a), nz = -Math.sin(a), k = 0.85 + 0.3 * hash2(i, 9, 8), t = hash2(i, 3, 8);
    const bot = A.vert(x, -4, z, nx, 0.2, nz, mix(ca.r, cb.r, t) * 0.7 * k, mix(ca.g, cb.g, t) * 0.7 * k, mix(ca.b, cb.b, t) * 0.7 * k);
    const top = A.vert(x, h, z, nx, 0.6, nz, mix(ca.r, cb.r, t) * k, mix(ca.g, cb.g, t) * k, mix(ca.b, cb.b, t) * k);
    if (prev) { A.raw(prev[0], prev[1], top); A.raw(prev[0], top, bot); A.raw(prev[0], bot, prev[1]); A.raw(prev[1], top, bot); }
    prev = [bot, top];
  }
  const m = new THREE.Mesh(A.geometry(), farFogPatch(ctx.mat.toon('#ffffff', { vertexColors: true, side: 'double', paint: 0.03, name: 'env-far-' + name }), name));
  m.name = 'env-far-' + name; m.castShadow = false; m.receiveShadow = false; ctx.noOutline(m); ctx.noBatch(m); m.frustumCulled = false; group.add(m);
}

// ---------------------------------------------------------------- landmarks: small, simple, vertex-coloured
function landmarks(ctx, group) {
  const A = new Acc(true), C = (h) => new THREE.Color(h);
  const quadN = (a, b, c, d) => { A.tri(a, b, c); A.tri(a, c, d); };
  const box = (cx, cz, w, d, y0, y1, rot, hex, topHex) => {
    const c = C(hex), t = C(topHex || hex), co = Math.cos(rot), si = Math.sin(rot);
    const P = (lx, lz) => [cx + lx * co + lz * si, cz - lx * si + lz * co];
    const cs = [P(-w / 2, -d / 2), P(w / 2, -d / 2), P(w / 2, d / 2), P(-w / 2, d / 2)];
    for (let e = 0; e < 4; e++) {
      const p = cs[e], q = cs[(e + 1) % 4], nx = (q[1] - p[1]), nz = -(q[0] - p[0]), nl = Math.hypot(nx, nz) || 1;
      const k = e % 2 ? 0.86 : 1;
      const v = [A.vert(p[0], y0, p[1], nx / nl, 0, nz / nl, c.r * k, c.g * k, c.b * k), A.vert(q[0], y0, q[1], nx / nl, 0, nz / nl, c.r * k, c.g * k, c.b * k), A.vert(q[0], y1, q[1], nx / nl, 0, nz / nl, c.r * k, c.g * k, c.b * k), A.vert(p[0], y1, p[1], nx / nl, 0, nz / nl, c.r * k, c.g * k, c.b * k)];
      quadN(v[0], v[1], v[2], v[3]);
    }
    const tp = cs.map((p) => A.vert(p[0], y1, p[1], 0, 1, 0, t.r, t.g, t.b)); quadN(tp[0], tp[1], tp[2], tp[3]);
  };
  const cyl = (cx, cz, y0, y1, r0, r1, seg, hex, topHex) => {
    const c = C(hex), t = C(topHex || hex);
    for (let s = 0; s < seg; s++) {
      const a0 = s / seg * 6.2832, a1 = (s + 1) / seg * 6.2832, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const slope = (r0 - r1) / Math.max(1e-3, y1 - y0), nm = Math.hypot(1, slope);
      const v = [A.vert(cx + c0 * r0, y0, cz + s0 * r0, c0 / nm, slope / nm, s0 / nm, c.r, c.g, c.b), A.vert(cx + c1 * r0, y0, cz + s1 * r0, c1 / nm, slope / nm, s1 / nm, c.r, c.g, c.b), A.vert(cx + c1 * r1, y1, cz + s1 * r1, c1 / nm, slope / nm, s1 / nm, c.r, c.g, c.b), A.vert(cx + c0 * r1, y1, cz + s0 * r1, c0 / nm, slope / nm, s0 / nm, c.r, c.g, c.b)];
      quadN(v[0], v[1], v[2], v[3]);
      if (r1 > 0.05) { const tv = [A.vert(cx, y1, cz, 0, 1, 0, t.r, t.g, t.b), A.vert(cx + c0 * r1, y1, cz + s0 * r1, 0, 1, 0, t.r, t.g, t.b), A.vert(cx + c1 * r1, y1, cz + s1 * r1, 0, 1, 0, t.r, t.g, t.b)]; A.tri(tv[0], tv[2], tv[1]); }
    }
  };
  const dome = (cx, cz, y0, r, hy, seg, hex, litHex) => {                           // a spherical cap: 4 rings
    const c = C(hex), l = C(litHex || hex), rings = 4; let prev = null;
    for (let k = 0; k <= rings; k++) {
      const a = k / rings * Math.PI / 2, rr = Math.cos(a) * r, yy = y0 + Math.sin(a) * hy, row = [];
      for (let s = 0; s < seg; s++) { const b = s / seg * 6.2832, nx = Math.cos(a) * Math.cos(b), nz = Math.cos(a) * Math.sin(b), ny = Math.sin(a), mixk = 0.6 + 0.4 * ny; row.push(A.vert(cx + Math.cos(b) * rr, yy, cz + Math.sin(b) * rr, nx, ny, nz, mix(c.r, l.r, mixk), mix(c.g, l.g, mixk), mix(c.b, l.b, mixk))); }
      if (prev) for (let s = 0; s < seg; s++) { const s1 = (s + 1) % seg; A.tri(prev[s], prev[s1], row[s1]); A.tri(prev[s], row[s1], row[s]); }
      prev = row;
    }
  };
  const needle = (cx, cz, y0, y1, w0, hex) => cyl(cx, cz, y0, y1, w0, 0.02, 4, hex);
  const at = (lon, lat) => lonLatToXZ(lon, lat);
  // a silhouette is drawn only where no real model can stand: the sights inside (or within 250 m of) PLAY (Admiralty, St Isaac's, Kazan, the Saviour church) are built by the landmark modules
  const outsidePlay = (lon, lat) => { const [px, pz] = at(lon, lat); return !L.inPlay(px, pz, -250); };
  const YEL = '#e3c288', WHT = '#f1ece0', GOLD = '#e0b13c', GREY = '#a29a92';
  // The sights INSIDE the play area (Admiralty, St Isaac's, Kazan Cathedral, the Saviour on Blood ...) are drawn by their own modules from real footprints: no placeholders here.
  // Only what lies outside the data: the Neva panorama from the Palace Embankment (docs/research/palace-square-hermitage.md section 11) and the far east.
  // ---- Peter and Paul Cathedral (spire 122.5 m at the WEST end of the church, (-1946, -1981)) + the fortress: long dark-brown bastion wall 5.5 m, sand beach, trees behind
  // The island, its shore and the footprints of the fortress are DATA (environment draws the shore, city the footprints as plain houses); the strip builds no fortress module, so what is drawn here is the bell tower with
  // the gilded spire that no generic module can draw (sightIsReal: only until a fortress module has its model).
  if (!sightIsReal(ctx, 'landmarksFortress')) { const x = -1946, z = -1981, rot = -0.12;
    box(x, z, 14, 14, 0, 56, rot, '#e2dac2', '#6f7a6a'); cyl(x, z, 56, 66, 4.2, 3, 8, '#e2dac2');
    needle(x, z, 66, 118, 2.6, GOLD); cyl(x, z, 118, 123, 0.4, 0.1, 4, GOLD);
    if (!L.insideBuilding(x + 36, z, 0)) { box(x + 36, z, 66, 28, 0, 20, rot, '#d8d0b8', '#6f7a6a'); dome(x + 30, z, 20, 7, 8, 10, '#c9993a', GOLD); }
  }
  // ---- Smolny Cathedral: pale blue and white, five domes, the central one 85 m
  if (!sightIsReal(ctx, 'landmarksSmolny')) { const [x, z] = at(30.3956, 59.9486), rot = 0.5;
    box(x, z, 56, 56, 0, 38, rot, '#9fc0dc', '#7a9ab4'); box(x, z, 40, 40, 38, 52, rot, '#b4cfe4', '#7a9ab4'); cyl(x, z, 52, 72, 9, 9, 12, '#c8dceb'); dome(x, z, 72, 9, 10, 12, '#4a82b8', '#78a8d4'); cyl(x, z, 82, 90, 0.9, 0.4, 4, GOLD);
    for (const [ox, oz] of [[-24, -24], [24, -24], [-24, 24], [24, 24]]) { cyl(x + ox, z + oz, 34, 54, 5, 4.5, 8, '#c8dceb'); dome(x + ox, z + oz, 54, 5, 7, 8, '#4a82b8', '#78a8d4'); } }
  // ---- the Strelka of Vasilievsky Island: the Old Stock Exchange (pale yellow temple, 25 m) between the two Rostral columns (red-ochre shafts, 32 m, green prows, flame bowls)
  // (until landmarksStrelka has its model: the two columns, which no generic module draws; the Exchange box only where the data has no building footprint for the city module)
  if (!sightIsReal(ctx, 'landmarksStrelka')) { const rot = -0.52;
    if (!L.insideBuilding(-2540, -1288, 0)) { box(-2540, -1288, 78, 44, 0, 17, rot, '#e8dcaa', '#7a8a70'); box(-2540, -1288, 62, 8, 17, 22, rot, '#f0e6c4', '#f0e6c4'); }
    for (const [cx, cz] of [[-2481, -1190], [-2586, -1365]]) { box(cx, cz, 10, 10, 0, 4, 0, '#b09b88'); cyl(cx, cz, 4, 31, 2.4, 1.5, 10, '#d65a3a'); cyl(cx, cz, 31, 33, 2.9, 2.9, 10, '#4a6a52'); cyl(cx, cz, 33, 34.5, 1.8, 1.0, 8, '#c9993a'); }
  }
  // ---- the Vasilievsky embankment (Universitetskaya): Kunstkamera (pale blue-white, tower), the Academy of Sciences, the Menshikov Palace, the Twelve Collegia, the University
  // (until landmarksUniversity has its model; a box is left out where the data has a building footprint: the city module draws that house)
  if (!sightIsReal(ctx, 'landmarksUniversity')) { const row = [['kunst', -2619, -1036, 62, 34, 19, -0.62, '#cfd8e0'], ['acad', -2735, -975, 84, 26, 18, -0.6, '#e6dcb0'], ['mensh', -2900, -905, 52, 20, 15, -0.58, '#e0c47a'], ['colleg', -3080, -770, 320, 26, 19, -0.7, '#d4b0a0'], ['univ', -3300, -610, 110, 24, 17, -0.72, '#d8c8a8']];
    // QA: the long Twelve Collegia box stood 60 m in the Neva where the bank bends: keep only the longest stretch whose whole depth (+ 3 m) is dry
    const dry = (n, x, z, w, d, rot) => {
      const co = Math.cos(rot), si = Math.sin(rot), ok = (lx) => [-d / 2 - 3, 0, d / 2 + 3].every((lz) => !L.inRiver(x + lx * co + lz * si, z - lx * si + lz * co));
      let best = null, cur = null;
      for (let lx = -w / 2; lx <= w / 2 + 0.01; lx += 4) { if (ok(lx)) { if (!cur) cur = [lx, lx]; else cur[1] = lx; if (!best || cur[1] - cur[0] > best[1] - best[0]) best = cur.slice(); } else cur = null; }
      if (!best || best[1] - best[0] < 8) return [x, z, w];
      const mid = (best[0] + best[1]) / 2, len = Math.min(w, best[1] - best[0] + 4);
      return [x + mid * co, z - mid * si, len];
    };
    for (const [n, x0, z0, w0, d, h, rot, hex] of row) { if (L.insideBuilding(x0, z0, 0) || L.insideBuilding(x0 + 12, z0 + 8, 0) || L.insideBuilding(x0 - 12, z0 - 8, 0)) continue; const [x, z, w] = dry(n, x0, z0, w0, d, rot); box(x, z, w, d, 0, h, rot, hex, '#7a8a78'); box(x, z, w * 0.98, 2, h, h + 1.6, rot, '#f1ece0'); if (n === 'kunst') { box(x + 6, z - 5, 12, 12, h, h + 18, rot, '#e8e4dc', '#6a7a6a'); cyl(x + 6, z - 5, h + 18, h + 22, 5, 3, 8, '#6d8a78'); dome(x + 6, z - 5, h + 22, 3.4, 4, 8, '#c9993a', GOLD); } }
    if (!L.insideBuilding(-2850, -940, 0)) box(-2850, -940, 18, 60, 0, 22, -0.6, '#cdbba0'); }
  const m = new THREE.Mesh(A.geometry(), farFogPatch(ctx.mat.toon('#ffffff', { vertexColors: true, side: 'double', paint: 0.02, name: 'env-landmarks-pb' }), 'landmarks-pb'));
  m.name = 'env-far-landmarks'; m.castShadow = false; m.receiveShadow = false; ctx.noOutline(m); ctx.noBatch(m); m.frustumCulled = false; group.add(m);
}

// ---------------------------------------------------------------- TV tower (316 m, red-white lattice) on Aptekarsky island
function buildTVTower(ctx, group) {
  const [tx, tz] = lonLatToXZ(TV[0], TV[1]);
  const A = new Acc(true), RED = new THREE.Color('#cc3a2c'), WHITE = new THREE.Color('#efede6'), GREY = new THREE.Color('#8a8f94'), DARK = new THREE.Color('#4d5258');
  const bar = (ax, ay, az, bx, by, bz, t, c) => {
    const dx = bx - ax, dy = by - ay, dz = bz - az, l = Math.hypot(dx, dy, dz) || 1;
    let ux = -dz, uy = 0, uz = dx;
    if (Math.hypot(ux, uy, uz) < 1e-3) { ux = 1; uy = 0; uz = 0; }
    const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
    const vx = (dy * uz - dz * uy) / l, vy = (dz * ux - dx * uz) / l, vz = (dx * uy - dy * ux) / l;
    const h = t / 2, P = [];
    for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.push([ux * su * h + vx * sv * h, uy * su * h + vy * sv * h, uz * su * h + vz * sv * h]);
    for (let e = 0; e < 4; e++) {
      const p = P[e], q = P[(e + 1) % 4], nx = (p[0] + q[0]) / 2, ny = (p[1] + q[1]) / 2, nz = (p[2] + q[2]) / 2, nl = Math.hypot(nx, ny, nz) || 1;
      const v0 = A.vert(ax + p[0], ay + p[1], az + p[2], nx / nl, ny / nl, nz / nl, c.r, c.g, c.b), v1 = A.vert(bx + p[0], by + p[1], bz + p[2], nx / nl, ny / nl, nz / nl, c.r, c.g, c.b);
      const v2 = A.vert(bx + q[0], by + q[1], bz + q[2], nx / nl, ny / nl, nz / nl, c.r, c.g, c.b), v3 = A.vert(ax + q[0], ay + q[1], az + q[2], nx / nl, ny / nl, nz / nl, c.r, c.g, c.b);
      A.tri(v0, v1, v2); A.tri(v0, v2, v3);
    }
  };
  const wAt = (y) => (y < 70 ? mix(14, 5.5, y / 70) : y < 175 ? mix(5.5, 2.4, (y - 70) / 105) : 2.4);       // half width of the square mast
  const colAt = (y) => (Math.floor(y / 26) % 2 === 0 ? RED : WHITE);
  const H = 190, panel = 14;
  for (let y = 0; y < H; y += panel) {
    const y1 = Math.min(H, y + panel), w0 = wAt(y), w1 = wAt(y1), c = colAt(y + 1);
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (const [sx, sz] of cs) bar(tx + sx * w0, y, tz + sz * w0, tx + sx * w1, y1, tz + sz * w1, y < 70 ? 1.1 : 0.7, c);
    for (let e = 0; e < 4; e++) {
      const [ax, az] = cs[e], [bx, bz] = cs[(e + 1) % 4];
      bar(tx + ax * w1, y1, tz + az * w1, tx + bx * w1, y1, tz + bz * w1, 0.35, c);
      bar(tx + ax * w0, y, tz + az * w0, tx + bx * w1, y1, tz + bz * w1, 0.26, c);
      bar(tx + bx * w0, y, tz + bz * w0, tx + ax * w1, y1, tz + az * w1, 0.26, c);
    }
  }
  for (const [y0, y1, w, c] of [[172, 175, 5.2, DARK], [175, 192, 4.2, GREY], [192, 195, 5.2, DARK]]) {          // observation platform
    const p = [[-w, -w], [w, -w], [w, w], [-w, w]];
    for (let e = 0; e < 4; e++) { const [ax, az] = p[e], [bx, bz] = p[(e + 1) % 4], nx = (ax + bx) / 2 / w, nz = (az + bz) / 2 / w; const v = [A.vert(tx + ax, y0, tz + az, nx, 0, nz, c.r, c.g, c.b), A.vert(tx + bx, y0, tz + bz, nx, 0, nz, c.r, c.g, c.b), A.vert(tx + bx, y1, tz + bz, nx, 0, nz, c.r, c.g, c.b), A.vert(tx + ax, y1, tz + az, nx, 0, nz, c.r, c.g, c.b)]; A.tri(v[0], v[1], v[2]); A.tri(v[0], v[2], v[3]); }
    const top = [A.vert(tx - w, y1, tz - w, 0, 1, 0, c.r, c.g, c.b), A.vert(tx + w, y1, tz - w, 0, 1, 0, c.r, c.g, c.b), A.vert(tx + w, y1, tz + w, 0, 1, 0, c.r, c.g, c.b), A.vert(tx - w, y1, tz + w, 0, 1, 0, c.r, c.g, c.b)]; A.tri(top[0], top[2], top[1]); A.tri(top[0], top[3], top[2]);
  }
  for (let y = 195; y < 316; y += 14) bar(tx, y, tz, tx, Math.min(316, y + 14), tz, y < 240 ? 1.9 : 0.6, Math.floor(y / 14) % 2 ? WHITE : RED);
  const m = new THREE.Mesh(A.geometry(), farFogPatch(ctx.mat.toon('#ffffff', { vertexColors: true, side: 'double', paint: 0.02, name: 'env-tvtower-pb' }), 'tvtower-pb'));
  m.name = 'env-tvtower'; m.castShadow = false; m.receiveShadow = false; ctx.noOutline(m); ctx.noBatch(m); m.frustumCulled = false; group.add(m);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 6), ctx.mat.emissive('#ff3a2a', 1.6, { fog: true })); lamp.position.set(tx, 317, tz); ctx.noOutline(lamp); ctx.noBatch(lamp); group.add(lamp);
  return { x: tx, z: tz, h: 318 };
}

export function buildFar(ctx, root) {
  const group = new THREE.Group(); group.name = 'env-far'; root.add(group);
  const gen = genBlocks(ctx);
  const blocks = buildBlocks(ctx, group, gen);
  // The cheap horizon curtain remains beyond all coverage, including jitter
  // and segment interiors. Its search limit follows the actual outer corners.
  const NR = 1100, rs = horizonRadii(EXTENT_RECTS, SQ, NR);
  const river = waterRings().filter((r) => r.kind === 'far'), onRiver = (x, z) => river.some((r) => pointInRing(x, z, r.o));      // the Neva scenery runs through the ring: the strip is broken where it would stand on the water
  ringStrip(ctx, group, 'suburb', 4700, HORIZON_JITTER, 22, 8, '#6a7a60', '#5c6c54', { n: NR, radius: (a) => rs[Math.min(NR, Math.max(0, Math.round(a / (Math.PI * 2) * NR)))], skip: onRiver });
  landmarks(ctx, group);
  const tower = sightIsReal(ctx, 'landmarksTVTower') ? null : buildTVTower(ctx, group);      // the TV tower module draws the real tower (its claim w49489011 is registered)
  return { blocks, tower, parks: gen.parks.length };
}
