// environment/ground.js - THE GROUND: one tessellated plane (16 m cells over the data, growing to +-7.6 km) with a painterly world-space shader. Between the
// roads and the buildings it shows what a Petersburg yard really is: worn dark-grey asphalt with patches and cracks, granite setts and red-brown block pavers
// (per-stone tone, running-bond joints that fade out at distance), trimmed lawn with a few trampled patches, dark ballast gravel (the rail yard, building sites),
// a grey dust strip at every road edge and a darker strip at the foot of the walls. Streets / city draw the carriageways and the granite pavements ON TOP of it.
// How it works: field.js rasterises the OSM data into four weights per metre (grass / asphalt / setts / gravel) and the distances to buildings, carriageways and
// water. The fragment shader picks ONE category per pixel from a noise tile (warped, cel-hard edges), then paints it with its own variation: no repeating
// texture, no blur. The same noise tile is sampled on the CPU (field.categoryAt) so trees / tufts agree with what the shader paints.
// HOLES: the mesh is cut (convex-piece subtraction, exact edges) wherever the Fontanka trench runs (river.js ring, the quay walls close the edge) and wherever
// layout.GROUND_HOLES has a rectangle (metro shafts: the metro module draws the stairwell). Cells that do not touch a cut stay plain quads (no huge triangles: the
// world-space paint shader flickers on two giant triangles, see DESIGN.md section 10).
// Layers: this plane is y = 0 with polygonOffset +2 (everything else - footways 0.02, asphalt 0.03, pavement 0.12 - always wins, also far away).
// Beyond the data it continues as the street grid of the city (farconf.js) and, past ~4.5 km, as a dim green-grey suburb colour.
import * as THREE from 'three';
import * as L from '../layout.js';
import { EXTENT_RECTS } from '../data/city.js';
import { FAR_FOG, FAR_GRID } from './farconf.js';
import { waterCuts } from './river.js';
import { CLASS_PALETTE_GLSL } from './class-palette.js';
import { DIST_ATLAS_GLSL, distanceUniforms } from './distance-atlas.js';
import { clipHalf, subtractConvex, area2, bucketCuts, triangulateRing, boxOfPoly } from './clip.js';
import { HOOKS } from '../lib/area-tables.js';
import { splitGeometryByCell, registerLOD, superCells } from '../../core/spatial.js';
export { clipHalf };

const FAR = 7600;
const CELL = 16;
// WHERE THE SHADER PAINTS THE DATA (class mask, dust strips at the roads) and where the "city beyond the data" starts (default yard mix + the continued street grid): the union of the EXTENT rectangles
// (the eight rectangles of the strip, each its play area + 120 m).
const SH_RECTS = EXTENT_RECTS;
const RECT_COUNT = Math.max(1, SH_RECTS.length);

const PRE = /* glsl */`
uniform sampler2D uCls; uniform sampler2D uDist; uniform sampler2D uNoise;
${CLASS_PALETTE_GLSL}
${DIST_ATLAS_GLSL}
uniform vec4 uBox; uniform vec4 uRects[${RECT_COUNT}]; uniform vec2 uClsInv; uniform vec2 uDistInv; uniform vec2 uFogK;
uniform vec2 uC; uniform vec4 uAx; uniform vec4 uPitch; uniform vec4 uDefault; uniform float uRoadW; uniform float uCityR;
uniform vec3 uGrassA; uniform vec3 uGrassB; uniform vec3 uGrassC; uniform vec3 uGrassD; uniform vec3 uEarth;
uniform vec3 uAsphA; uniform vec3 uAsphB; uniform vec3 uAsphC; uniform vec3 uCrack;
uniform vec3 uSettA; uniform vec3 uSettB; uniform vec3 uPaverA; uniform vec3 uPaverB; uniform vec3 uJoint;
uniform vec4 uRail; uniform float uRailW;
uniform vec3 uGravA; uniform vec3 uGravB; uniform vec3 uGravC; uniform vec3 uBelt; uniform vec3 uDust; uniform vec3 uSuburb;
vec4 nz(vec2 p, float s) { return texture2D(uNoise, p * s); }
float eh21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
// running-bond stone grid of size stS at P: x = joint mask (0..1, fades with patF), y = stone tone hash
vec2 stonePat(vec2 P, vec2 stS, float mpp, float patF) {
  vec2 sl = P / stS; sl.x += floor(sl.y) * 0.5;
  vec2 sid = floor(sl), sfr = fract(sl);
  float e = min(min(sfr.x, 1.0 - sfr.x) * stS.x, min(sfr.y, 1.0 - sfr.y) * stS.y);   // metres to the nearest joint
  return vec2((1.0 - smoothstep(0.008, 0.008 + max(mpp * 1.1, 0.006), e)) * patF, eh21(sid + 7.0));
}
`;

const BODY = /* glsl */`
{
  vec2 P = vPWorld.xz;
  float mpp = max(length(dFdx(P)), length(dFdy(P)));                       // metres per pixel
  vec2 q = P - uBox.xy;
  float exd = 1.0e5;                                                       // distance outside the union of the data rectangles (< 0 inside)
  for (int ri = 0; ri < ${RECT_COUNT}; ri++) {
    vec4 R = uRects[ri]; float dR = max(max(R.x - P.x, P.x - R.z), max(R.y - P.y, P.y - R.w));
    exd = min(exd, dR);
  }
  float outd = exd - 40.0;
  float farT = smoothstep(0.0, 110.0, outd);
  vec4 W = mix(clsFiltered(q * uClsInv), uDefault, farT);
  vec4 Dm = mix(distFiltered(q * uDistInv), vec4(1.0, 1.0, 1.0, 1.0), farT);

  vec4 n1 = nz(P + vec2(23.0, 71.0), 0.021);
  vec4 n2 = nz(P, 0.083);
  vec4 n3 = nz(P, 0.37);
  vec4 n4 = nz(P, 0.17);
  vec4 n5 = nz(P, 1.9);
  vec4 n6 = nz(P, 6.1);

  // ---- which ground is it? the four categories compete: score = ln(weight + 0.04) + 9 * (smooth noise - 0.5); each category has its own noise field, so the
  //      territories are blotches (not contour bands). The CPU twin is field.categoryAt (same fetches, same formula).
  vec4 Wn = W / (W.x + W.y + W.z + W.w + 1e-4);
  vec4 nA = nz(P, 0.021), nB = nz(P + vec2(61.0, 37.0), 0.021);
  vec4 sc = log(Wn + 0.04) + 9.0 * (vec4(nA.r, nA.g, nB.r, nB.g) - 0.5);     // x grass, y asphalt, z setts, w gravel
  float smx = max(max(sc.x, sc.y), max(sc.z, sc.w));
  float ae = max(fwidth(smx) * 1.3, 0.05);
  vec4 mk = smoothstep(vec4(smx - ae), vec4(smx), sc);
  float ms = mk.x + mk.y + mk.z + mk.w + 1e-4;
  float mG = mk.x / ms, mA = mk.y / ms, mS = mk.z / ms, mV = mk.w / ms;

  // ---- trimmed lawn: lighter and darker mown patches, a few clumps, trampled earth showing through
  vec3 cg = mix(uGrassA, uGrassB, smoothstep(0.48, 0.66, n2.g));
  cg = mix(cg, uGrassC, smoothstep(0.62, 0.78, n3.r) * 0.6);
  cg = mix(cg, uGrassD, smoothstep(0.66, 0.84, n2.r) * 0.5);
  float bare = smoothstep(0.74, 0.86, n5.g * 0.55 + n2.g * 0.5);
  cg = mix(cg, uEarth, bare * 0.55);
  cg *= 0.95 + 0.10 * n5.r;
  // ---- worn courtyard asphalt: light / dark patches, tar cracks, drifting dust
  vec3 ca = mix(uAsphA, uAsphB, smoothstep(0.45, 0.72, n2.g));
  ca = mix(ca, uAsphC, smoothstep(0.64, 0.78, n3.r) * 0.55);
  float cr = min(n4.b, nz(P + vec2(5.0, 9.0), 0.113).b);
  float crack = (1.0 - smoothstep(0.008, 0.026, cr)) * (1.0 - smoothstep(0.02, 0.22, mpp)) * smoothstep(0.46, 0.62, n2.r);
  ca = mix(ca, uCrack, crack * 0.7);
  ca *= 0.95 + 0.10 * n5.r;
  // ---- granite setts (grey) or block pavers (red-brown): per-stone tone, running-bond joints (fade out with distance)
  float redK = smoothstep(0.64, 0.74, n1.r);
  // the two stone grids are evaluated separately and their COLOURS blended (a stone size that varies with the position makes P / size sweep through the pattern: grain at every grey / red border)
  float patF = 1.0 - smoothstep(0.012, 0.085, mpp);
  vec2 pgy = stonePat(P, vec2(0.32, 0.16), mpp, patF), prd = stonePat(P, vec2(0.21, 0.105), mpp, patF);
  vec3 stG = mix(uSettA, uSettB, smoothstep(0.35, 0.65, n2.g));
  vec3 stR = mix(uPaverA, uPaverB, smoothstep(0.35, 0.65, n2.g));
  stG = mix(stG * mix(1.0, 0.86 + 0.26 * pgy.y, patF), uJoint, pgy.x * 0.7);
  stR = mix(stR * mix(1.0, 0.86 + 0.26 * prd.y, patF), uJoint, prd.x * 0.7);
  vec3 cs = mix(stG, stR, redK) * (0.96 + 0.08 * n5.g);
  // ---- gravel / ballast / dark earth: speckle
  vec3 cv = mix(uGravA, uGravB, smoothstep(0.42, 0.68, n3.g));
  cv = mix(cv, uGravC, smoothstep(0.62, 0.8, n2.r) * 0.6);
  // (no pebble speckle: features of ~2 mm flicker between frames, float32 world coordinates jitter by 0.1-0.25 mm at x = -900 ... -2800 and the z-fight probe flags them)
  cv = mix(cv, cv * 1.18, smoothstep(0.62, 0.78, n4.g) * 0.5);
  cv *= 0.95 + 0.10 * n5.r;
  vec3 col = cg * mG + ca * mA + cs * mS + cv * mV;

  // ---- along the walls: a darker worn strip at the foot of the facades (blind area)
  float bd = Dm.r * 16.0;
  float bw = (n5.r - 0.5) * 0.4;
  float belt = (1.0 - smoothstep(0.55 + bw, 1.10 + bw, bd)) * (1.0 - mV);
  col = mix(col, uBelt * (0.9 + 0.2 * n5.g), belt * 0.8);
  // ---- grey dust blown to every road edge (the roads and pavements are drawn on top, this is only the verge / courtyard mouth)
  float rd = Dm.g * 16.0;
  float dust = 1.0 - smoothstep(0.15, 1.2 + n2.g * 1.8 + n3.r * 1.4 + n5.r * 0.5, rd);
  dust *= 0.4 + 0.6 * smoothstep(0.25, 0.6, n4.r + 0.3 * n3.g);
  col = mix(col, uDust * (0.9 + 0.2 * n5.g), dust * 0.5 * (1.0 - mG * 0.5));

  // ---- beyond the data: the street grid continues (Nevsky frame), blocks are drawn by far.js; past the last block it is a dim suburb
  float roadT = smoothstep(0.0, 24.0, exd);
  if (roadT > 0.001) {
    vec2 PC = P - uC;
    float gu = dot(PC, uAx.xy), gv = dot(PC, uAx.zw);
    float du = abs(fract((gu - uPitch.z) / uPitch.x + 0.5) - 0.5) * uPitch.x;
    float dv = abs(fract((gv - uPitch.w) / uPitch.y + 0.5) - 0.5) * uPitch.y;
    float dd = min(du, dv);
    float hw = uRoadW * 0.5;
    float road = 1.0 - smoothstep(hw - mpp, hw + mpp, dd);
    float walk = 1.0 - smoothstep(hw + 2.0 - mpp, hw + 2.0 + mpp, dd);
    vec3 rc = mix(uAsphA, uAsphB, smoothstep(0.45, 0.72, n2.g)) * (0.95 + 0.1 * n5.r);
    col = mix(col, uSettA * 1.1, walk * roadT * 0.9);
    col = mix(col, rc, road * roadT);
  }
  { // the rail corridor south-east of the Moscow station: a ballast band (the rail module draws the tracks); the street grid does not cross it
    vec2 rq = P - uRail.xy; float along = dot(rq, uRail.zw), side = abs(dot(rq, vec2(-uRail.w, uRail.z)));
    float rb = (1.0 - smoothstep(uRailW - 4.0, uRailW + 2.0, side)) * smoothstep(-30.0, 10.0, along) * roadT;
    col = mix(col, mix(uGravA, uGravB, smoothstep(0.4, 0.7, n3.g)) * (0.95 + 0.1 * n5.r), rb);
  }
  float rr = length(P - uC);
  float cityT = max(1.0 - smoothstep(uCityR, uCityR + 1200.0, rr), 1.0 - smoothstep(1800.0, 2500.0, exd));      // the city reaches 4.6 km from Vosstaniya Square and 1.8 km round the strip (far.js belt + the suburb ring: the west end of the strip is 3.6 km from the Square)
  vec3 sub = mix(uSuburb, uSuburb * vec3(1.2, 1.15, 1.0), smoothstep(0.35, 0.7, n2.r)) * (0.9 + 0.2 * n3.g);
  col = mix(col, sub, roadT * (1.0 - cityT));

  // far away the patchwork melts into its mean colour (atmospheric perspective, no shimmer)
  vec3 mean = Wn.x * (uGrassA * 0.95) + Wn.y * uAsphA + Wn.z * mix(uSettA, uPaverA, 0.3) + Wn.w * uGravA;
  col = mix(col, mean, smoothstep(160.0, 1100.0, vFogDepth) * 0.8);
  #ifdef DECEMBER
    float depth = clamp(0.28 + 0.67 * mG + 0.45 * mV - 0.24 * mA + 0.25 * dust, 0.0, 1.0);
    col = mix(col, mix(vec3(0.54,0.64,0.73), vec3(0.83,0.88,0.91), n2.g), depth);
  #endif
  diffuseColor.rgb = col;
}
`;

const FOG = /* glsl */`
#ifdef USE_FOG
  float efd = min(vFogDepth, uFogK.x) + uFogK.y * max(vFogDepth - uFogK.x, 0.0);
  float fogFactor = 1.0 - exp(-fogDensity * fogDensity * efd * efd);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
#endif
`;

/** thin the fog beyond FAR_FOG.D0 in any patched fragment shader (used by the far scenery as well): replaces <fog_fragment> */
export const FAR_FOG_GLSL = FOG;

/** patch a toon material so that its fog is the far fog (distance-thinned); returns the material */
export function farFogPatch(mat, key) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(mat, shader, renderer);
    shader.uniforms.uFogK = { value: new THREE.Vector2(FAR_FOG.D0, FAR_FOG.K) };
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec2 uFogK;').replace('#include <fog_fragment>', FOG);
  };
  mat.customProgramCacheKey = () => 'paint|env-farfog|' + key;
  return mat;
}

/** the convex cuts of the ground: every convex piece of every water body (river.js waterCuts) + the metro shaft rectangles; each { poly (CCW for the half-plane test), box } */
function groundCuts() {
  const cuts = waterCuts().map((c) => ({ poly: c.poly, box: c.box }));
  for (const h of L.GROUND_HOLES) {
    const c = Math.cos(h.rotY || 0), s = Math.sin(h.rotY || 0), hw = h.w / 2, hd = h.d / 2;
    let pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, lz]) => [h.x + lx * c + lz * s, h.z - lx * s + lz * c]);
    if (Math.abs(area2(pts)) < 1e-6) continue; if (area2(pts) < 0) pts = pts.slice().reverse();
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
    cuts.push({ poly: pts, box: [x0, x1, z0, z1] });
  }
  // the rings that a landmark module draws the ground of itself (HOOKS.groundHoles, docs/AREAS.md 9.1: the Tauride Garden floor of the North): triangulated into convex cuts like a water body; the strip has no such hook
  const rings = HOOKS.groundHoles ? HOOKS.groundHoles() : null;
  if (rings) for (const r of rings) for (const t of triangulateRing(r)) cuts.push({ poly: t, box: boxOfPoly(t) });
  return cuts;
}

/** the grid axis: 16 m cells over [lo, hi] (+ a margin), then cells that grow x1.35 (max 400 m) out to +-FAR */
export function axisFor(lo, hi) {
  const a0 = Math.floor((lo - 64) / CELL) * CELL, a1 = Math.ceil((hi + 64) / CELL) * CELL, inner = [];
  for (let v = a0; v <= a1 + 1e-6; v += CELL) inner.push(v);
  const left = [], right = [];
  { let r = a0, st = CELL * 3; while (r > -FAR) { st = Math.min(st * 1.35, 400); r = Math.max(-FAR, r - st); left.push(r); } }
  { let r = a1, st = CELL * 3; while (r < FAR) { st = Math.min(st * 1.35, 400); r = Math.min(FAR, r + st); right.push(r); } }
  return [...left.reverse(), ...inner, ...right];
}

/** the four corners of the cell [xa, xb] x [za, zb] lie inside the convex cut (counter-clockwise): the cell is wholly cut away (the same answer as subtracting the cut from it, without clipping: the Gulf of Vasilievsky Island fills 80 000 cells) */
function cellInside(poly, xa, xb, za, zb) {
  for (let e = 0; e < poly.length; e++) {
    const a = poly[e], b = poly[(e + 1) % poly.length], ex = b[0] - a[0], ez = b[1] - a[1];
    if (ex * (za - a[1]) - ez * (xa - a[0]) < 0 || ex * (za - a[1]) - ez * (xb - a[0]) < 0 || ex * (zb - a[1]) - ez * (xa - a[0]) < 0 || ex * (zb - a[1]) - ez * (xb - a[0]) < 0) return false;
  }
  return true;
}

export function buildGround(ctx, root, field) {
  const { THREE: T } = ctx;
  const mat = ctx.mat.toon('#ffffff', { paint: 0.02, polygonOffset: 2, name: 'env-ground' });
  const col = (h) => new T.Color(h);
  const prev = mat.onBeforeCompile;
  const f = field, G = FAR_GRID;
  const U = {
    ...distanceUniforms(f.dist),
    uCls: { value: f.cls.texture }, uDist: { value: f.dist.texture }, uNoise: { value: f.noise.texture },
    uClsPalette: { value: f.cls.paletteTexture || f.cls.texture }, uClsSize: { value: new T.Vector2(f.cls.W, f.cls.H) }, uClsIndexed: { value: f.cls.indices ? 1 : 0 },
    uBox: { value: new T.Vector4(f.box.x0, f.box.z0, f.box.x1, f.box.z1) }, uRects: { value: SH_RECTS.map(r => new T.Vector4(r.x0, r.z0, r.x1, r.z1)) },
    uClsInv: { value: new T.Vector2(1 / (f.cls.W * f.cls.res), 1 / (f.cls.H * f.cls.res)) }, uDistInv: { value: new T.Vector2(1 / (f.dist.W * f.dist.res), 1 / (f.dist.H * f.dist.res)) },
    uFogK: { value: new T.Vector2(FAR_FOG.D0, FAR_FOG.K) },
    uC: { value: new T.Vector2(G.cx, G.cz) }, uAx: { value: new T.Vector4(G.ux, G.uz, G.vx, G.vz) }, uPitch: { value: new T.Vector4(G.pu, G.pv, G.u0, G.v0) },
    uRail: { value: new T.Vector4(690, 900, 0.2250, 0.9744) }, uRailW: { value: 62 }, uDefault: { value: new T.Vector4(0.10, 0.44, 0.38, 0.08) }, uRoadW: { value: G.roadW }, uCityR: { value: 4600 },
    uGrassA: { value: col('#5f8a34') }, uGrassB: { value: col('#78a043') }, uGrassC: { value: col('#4a7430') }, uGrassD: { value: col('#8ba84a') }, uEarth: { value: col('#7a6a50') },
    uAsphA: { value: col('#5e6266') }, uAsphB: { value: col('#6f7377') }, uAsphC: { value: col('#565a5e') }, uCrack: { value: col('#33363a') },
    uSettA: { value: col('#807d77') }, uSettB: { value: col('#938f88') }, uPaverA: { value: col('#80594d') }, uPaverB: { value: col('#92685a') }, uJoint: { value: col('#56534f') },
    uGravA: { value: col('#6a675f') }, uGravB: { value: col('#58554f') }, uGravC: { value: col('#7d776a') },
    uBelt: { value: col('#6e6c68') }, uDust: { value: col('#a9a59b') }, uSuburb: { value: col('#5d6b52') },
  };
  mat.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(mat, shader, renderer);
    Object.assign(shader.uniforms, U);
    if (ctx.season === 'winter') shader.defines = { ...shader.defines, DECEMBER: 1 };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + PRE)
      .replace('#include <map_fragment>', '#include <map_fragment>\n' + BODY)
      .replace('#include <fog_fragment>', FOG);
  };
  mat.customProgramCacheKey = () => 'paint|env-ground-pb10-strip-dist-atlas';

  return buildGroundMesh(ctx, root, field, mat, U);
}

// Keep transient number arrays/cut buckets outside the shader closure's scope.
// The material lives for the whole visit; its compiler needs only the uniforms.
function buildGroundMesh(ctx, root, field, mat, U) {
  const T = ctx.THREE, f = field;

  // ---- the mesh: a tensor-product grid; cells that touch a cut are replaced by their convex pieces (fans)
  const xs = axisFor(f.box.x0, f.box.x1), zs = axisFor(f.box.z0, f.box.z1);
  const cuts = groundCuts(), P = [], UV = [], buckets = bucketCuts(cuts, xs, zs), nx = xs.length - 1;
  let quads = 0, clipped = 0, tris = 0, capped = 0;
  // overlapping far-scenery cuts can shatter one big far cell into tens of thousands of slivers (an out-of-memory crash seen when the water zones moved the data edge of Palace-Liteyny): past MAX_CELL_PIECES the
  // rest of the cuts of that cell are dropped, i.e. a little far ground stays over far water
  const MAX_CELL_PIECES = 600;
  const vert = (x, z) => { P.push(x, 0, z); UV.push(x / (FAR * 2) + 0.5, 0.5 - z / (FAR * 2)); };
  // pieces are counter-clockwise in the (x, z) plane = clockwise seen from above (+Y looking down has +Z toward the viewer): emit them reversed so the normal is +Y
  const fan = (poly) => { for (let k = 1; k + 1 < poly.length; k++) { if (Math.abs((poly[k][0] - poly[0][0]) * (poly[k + 1][1] - poly[0][1]) - (poly[k + 1][0] - poly[0][0]) * (poly[k][1] - poly[0][1])) < 1e-3) continue; vert(poly[0][0], poly[0][1]); vert(poly[k + 1][0], poly[k + 1][1]); vert(poly[k][0], poly[k][1]); tris++; } };
  // Uncut cells of the uniform 16 m part of the grid are merged into aligned blocks of 8 x 8 (4 x 4) cells: the block is a fan from its centre to the boundary vertices of ITS 16 m cells
  // (all the vertices of the border stay, so the seams to the neighbouring cells are watertight, no T-junctions); a block of 64 cells costs 32 triangles instead of 128.
  const nz = zs.length - 1, uniX = new Uint8Array(nx), uniZ = new Uint8Array(nz);
  for (let i = 0; i < nx; i++) uniX[i] = Math.abs(xs[i + 1] - xs[i] - CELL) < 1e-6 ? 1 : 0;
  for (let j = 0; j < nz; j++) uniZ[j] = Math.abs(zs[j + 1] - zs[j] - CELL) < 1e-6 ? 1 : 0;
  const done = new Uint8Array(nx * nz);
  let blocks = 0;
  const tryBlock = (i0, j0, B) => {
    if (i0 + B > nx || j0 + B > nz) return false;
    for (let j = j0; j < j0 + B; j++) for (let i = i0; i < i0 + B; i++) if (!uniX[i] || !uniZ[j] || done[j * nx + i] || buckets.has(j * nx + i)) return false;
    const ring = [];                                                        // counter-clockwise in (x, z) like the cell quads: bottom edge (z = za) west -> east, east edge, top edge, west edge
    const xa = xs[i0], xb = xs[i0 + B], za = zs[j0], zb = zs[j0 + B];
    for (let i = i0; i < i0 + B; i++) ring.push([xs[i], za]);
    for (let j = j0; j < j0 + B; j++) ring.push([xb, zs[j]]);
    for (let i = i0 + B; i > i0; i--) ring.push([xs[i], zb]);
    for (let j = j0 + B; j > j0; j--) ring.push([xa, zs[j]]);
    const c = [(xa + xb) / 2, (za + zb) / 2];
    for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length]; vert(c[0], c[1]); vert(b[0], b[1]); vert(a[0], a[1]); tris++; }
    for (let j = j0; j < j0 + B; j++) for (let i = i0; i < i0 + B; i++) done[j * nx + i] = 1;
    quads += B * B; blocks++;
    return true;
  };
  for (const B of [8, 4]) for (let j0 = 0; j0 + B <= nz; j0 += B) for (let i0 = 0; i0 + B <= nx; i0 += B) tryBlock(i0, j0, B);
  for (let j = 0; j + 1 < zs.length; j++) {
    for (let i = 0; i < nx; i++) {
      if (done[j * nx + i]) continue;
      const xa = xs[i], xb = xs[i + 1], za = zs[j], zb = zs[j + 1];
      let pieces = [[[xa, za], [xb, za], [xb, zb], [xa, zb]]];
      const here = buckets.get(j * nx + i);
      if (here) { for (const c of here) { if (cellInside(c.poly, xa, xb, za, zb)) { pieces = []; break; } pieces = subtractConvex(pieces, c.poly); if (pieces.length > MAX_CELL_PIECES) { capped++; break; } if (!pieces.length) break; } clipped++; } else quads++;
      for (const pc of pieces) fan(pc);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(UV, 2));
  const nor = new Float32Array(P.length); for (let k = 1; k < nor.length; k += 3) nor[k] = 1; g.setAttribute('normal', new T.BufferAttribute(nor, 3));
  g.computeBoundingSphere();
  // The long southern corridor must not double city-wide ground vertex work.
  // Retain the field shader's material (generic far proxies lose its painted
  // classes), but split immutable triangles with the shared engine helper and
  // register conservative cell bounds. Every triangle/UV/hole is preserved.
  const chunks = splitGeometryByCell(g, 640) || [g], group = new T.Group();
  group.name = 'env-ground'; root.add(group);
  for (const piece of chunks) {
    const m = new T.Mesh(piece, mat); m.name = 'env-ground'; m.receiveShadow = true; m.castShadow = false;
    ctx.noBatch(m); group.add(m); m.updateMatrixWorld(true); registerLOD(m, Infinity);
  }
  if (chunks[0] !== g) g.dispose();
  // Far super-cells (plan 2026-10-15 item 1b; core/spatial.js superCells): 3 x 3 pieces become one draw once the camera is 1.5 km (x the quality scale) outside them.
  // Same material, triangles, UVs and normals; near the player the 640 m pieces draw as before. ?supercells=0 = none.
  const superN = superCells(group.children.filter(m => m.isMesh), 1920, 1500, m => { m.receiveShadow = true; m.castShadow = false; ctx.noOutline(m); });
  return { mesh: group, superCells: superN, uniforms: U, cells: quads + clipped, clipped, triangles: tris, blocks, chunks: chunks.length, capped };
}
