// bridges/arch.js - the generic single-span arch road bridge of the west (Kazansky, Green, Pevchesky, Red, Blue, Novo-Konyushenny, Hermitage, 1st / 2nd Winter).
// makeArch(env, site) -> B: B.draw() adds everything into the Parts collector in the site frame (u along the road, v across, see sites.js):
//   * bank lines of the canal at the deck read from the OSM water polygon (ray casts along u at every ~3.5 m of v), so the vault follows skew / flaring banks
//   * the arch soffit (segmental, brick or painted iron), the abutment faces below the springing (inset 4 cm in front of the quay wall that the environment may draw there)
//   * the two FASCIA faces (v0 / v1): spandrel, voussoir ring + rolled string course (stone) or the painted fascia band with its ornament (iron), cornice, clearance boards
//   * the deck: asphalt / granite pavement / sett / plaza zones with kerbs, lane markings, the humped crown (hump m), parapets (granite) or railing panels (instanced) with posts
//   * physics: the deck as chunked walk ramps (never over open water), a solid box along each face
// The generic part draws NO lamps / pylons / sculpture: bridges.js adds the per-bridge extras (styles.js) with the helpers B exposes (B.yDeck, B.bank, B.railLine, B.parapet, ...).
import * as THREE from 'three';
import { WATER } from '../data/city.js';
import { EXT, frameOf, toUV, frameBounds } from './sites.js';
import { railSpec, railWorld } from './rails.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const segCache = new Map();
/** the edges of the water polygons of the site's waterway in the site frame, ONE list per polygon (a polygon = its outer ring and its holes): the area data may cut one waterway into several polygons whose rims overlap or
 *  touch at a region seam (admiralty: the Fontanka at the Lomonosov Bridge is four pieces, the seam at x -880 lies under the west end of the bridge), so the crossings are paired per polygon and the intervals united */
function localSegs(site) {
  const key = site.id; if (segCache.has(key)) return segCache.get(key);
  const out = [], w = WATER.find((q) => q.id === site.water);
  if (w) for (const p of w.polys) {
    const segs = [];
    for (const ring of [p.o, ...(p.h || [])]) {
      const n = ring.length / 2;
      for (let i = 0; i < n; i++) { const j = (i + 1) % n, a = toUV(site, ring[2 * i], ring[2 * i + 1]), b = toUV(site, ring[2 * j], ring[2 * j + 1]); segs.push([a.u, a.v, b.u, b.v]); }
    }
    out.push(segs);
  }
  segCache.set(key, out); return out;
}
/** [uL, uR] of the water interval around u = 0 at cross coordinate v (null when the polygon has no water there) */
export function waterAt(site, v) {
  const iv = [];      // the water intervals of every polygon (even-odd pairs of its crossings), united below
  for (const segs of localSegs(site)) {
    const us = [];
    for (const [u0, v0, u1, v1] of segs) if ((v0 - v) * (v1 - v) <= 0 && v0 !== v1) us.push(u0 + (u1 - u0) * (v - v0) / (v1 - v0));
    us.sort((a, b) => a - b);
    for (let i = 0; i + 1 < us.length; i += 2) if (us[i + 1] - us[i] >= 0.5) iv.push([us[i], us[i + 1]]);
  }
  iv.sort((a, b) => a[0] - b[0]);
  const un = [];      // overlapping or touching (within 0.5 m) intervals of two pieces of one waterway are one interval
  for (const q of iv) { const l = un[un.length - 1]; if (l && q[0] <= l[1] + 0.5) l[1] = Math.max(l[1], q[1]); else un.push([q[0], q[1]]); }
  let best = null, bs = 1e9;
  for (const [a, b] of un) { const m = (a + b) / 2, s = a <= 0 && b >= 0 ? 0 : Math.abs(m); if (s < bs) { bs = s; best = [a, b]; } }
  return best && bs < 14 && best[1] - best[0] < 70 ? best : null;
}

export function makeArch(env, site) {
  const { ctx, P, M, rails } = env;
  const f = frameOf(site), T = f.T;
  const waterY = env.waterY, springY = waterY + site.spring, crownY = site.soffitCrown;
  const v0 = site.v0, v1 = site.v1, stone = !!site.stone || site.style === 'stone' || site.style === 'stone2' || site.style === 'novo';
  const look = M.looks && M.looks[site.look || site.style];
  const beam = site.style === 'beam3';                                          // the Kryukov three-span continuous beam on two round granite drum piers (site.spans / site.pier / site.bank)                                  // the Mars Field reach: per-bridge fascia / soffit / band materials (mats.js M.looks)

  // ------------------------------------------------------------------ bank lines
  const nSl = Math.max(1, Math.ceil((v1 - v0) / 3.5)), vs = [], bL = [], bR = [];
  let last = null;
  for (let k = 0; k <= nSl; k++) {
    const v = v0 + (v1 - v0) * k / nSl, w = site.bank || waterAt(site, v) || last || [-8.5, 8.5];
    vs.push(v); bL.push(w[0]); bR.push(w[1]); last = w;
  }
  const uMin = Math.min(...bL) - EXT, uMax = Math.max(...bR) + EXT, uc = (uMin + uMax) / 2, hwD = (uMax - uMin) / 2;
  /** bank interval at v (linear between the samples) */
  const bank = (v) => {
    const t = clamp((v - v0) / (v1 - v0 || 1) * nSl, 0, nSl), i = Math.min(nSl - 1, Math.floor(t)), a = t - i;
    if (nSl === 1 && i === 0) return [bL[0] + (bL[1] - bL[0]) * a, bR[0] + (bR[1] - bR[0]) * a];
    return [bL[i] + (bL[i + 1] - bL[i]) * a, bR[i] + (bR[i + 1] - bR[i]) * a];
  };
  const Y0 = 0.05;
  const yDeck = (u) => { const t = clamp(Math.abs(u - uc) / hwD, 0, 1); return Y0 + site.hump * (1 - t * t); };
  const slope = (u) => (Math.abs(u - uc) >= hwD ? 0 : -2 * site.hump * (u - uc) / (hwD * hwD));
  /** soffit height of the arch over [a, b] at u */
  const archY = (a, b, u, crown = crownY) => {
    const hw = (b - a) / 2, mid = (a + b) / 2, h = crown - springY, d = u - mid;
    if (Math.abs(d) >= hw) return springY;
    const R = (hw * hw + h * h) / (2 * h);
    return crown - R + Math.sqrt(R * R - d * d);
  };
  /** the arch openings of a (multi-span) bridge between the banks a, b: [[from, to, crown], ...] (spans scaled to the bank interval, piers between) */
  const openings = (a, b) => {
    if (!site.spans) return [[a, b, crownY]];
    const n = site.spans.length, tot = site.spans.reduce((q, w) => q + w, 0) + (n - 1) * site.pier, k = (b - a) / tot, out = []; let u = a;
    for (let i = 0; i < n; i++) { out.push([u, u + site.spans[i] * k, site.crowns[i]]); u += (site.spans[i] + site.pier) * k; }
    return out;
  };
  const B = { site, f, T, waterY, springY, crownY, vs, bL, bR, bank, yDeck, slope, uMin, uMax, uc, hwD, archY, openings, stone, info: { tris0: 0, rails: 0, colliders: 0 } };
  B.world = (u, v) => ({ x: f.cx + u * f.c - v * f.s, z: f.cz + u * f.s + v * f.c });
  B.bounds = frameBounds(site, uMin, uMax, v0, v1, 1.5);       // (bridges.js deckY prefilter: a superset of where deckAt answers)
  B.deckAt = (x, z) => {
    const q = toUV(site, x, z);
    if (q.v < v0 - 0.01 || q.v > v1 + 0.01) return null;
    const [a, b] = bank(q.v);
    return q.u >= a - EXT && q.u <= b + EXT ? yDeck(q.u) : null;
  };

  // ------------------------------------------------------------------ helpers
  const tile = 2.2;
  /** flat shape (u, y) at v with its normal toward sg (+1 / -1 along v) */
  const faceShape = (mat, pts, v, sg, ut = tile, ou = 0, oy = 0) => {
    const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
    const g = new THREE.ShapeGeometry(sh, 1), pa = g.attributes.position, ua = g.attributes.uv, na = g.attributes.normal;
    for (let i = 0; i < pa.count; i++) { ua.setXY(i, (pa.getX(i) + ou) / ut, (pa.getY(i) - oy) / ut); na.setZ(i, sg); }
    if (sg < 0) { const ix = g.index; if (ix) for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } }
    P.geo(mat, g, 0, 0, v); g.dispose();
  };
  B.faceShape = faceShape;
  const archPts = (a, b, n = 20, crown = crownY) => { const out = []; for (let i = 0; i <= n; i++) { const u = a + (b - a) * i / n; out.push([u, archY(a, b, u, crown)]); } return out; };
  B.archPts = archPts;
  /** a rolled moulding (tube of radius r) along 2D points [u, y] at depth v */
  const tube = (mat, pts, v, r, seg = 6) => { for (let i = 0; i + 1 < pts.length; i++) P.cyl(mat, [pts[i][0], pts[i][1], v], [pts[i + 1][0], pts[i + 1][1], v], r, r, seg, false); };
  B.tube = tube;

  // ------------------------------------------------------------------ the vault: soffit strips, abutment faces
  function vault() {
    if (beam) return beamVault();
    const nA = 14, soffit = look && look.soffit ? look.soffit : stone ? M.vault : (site.style === 'green' ? M.fasGreenDark : site.style === 'blue' ? M.soffitDark : site.style === 'red' ? M.fasRed : site.style === 'pevchesky' ? M.fasPev : M.vault);   // (second pass: a stone site's look may name its own soffit: the RC frames of the Smolenka)
    for (let k = 0; k < nSl; k++) {
      const va = vs[k], vb = vs[k + 1];
      const op0 = openings(bL[k], bR[k]), op1 = openings(bL[k + 1], bR[k + 1]);
      for (let oi = 0; oi < op0.length; oi++) {
      const [a0, b0, cr0] = op0[oi], [a1, b1, cr1] = op1[oi];
      for (let i = 0; i < nA; i++) {
        const t0 = i / nA, t1 = (i + 1) / nA;
        const ua0 = a0 + (b0 - a0) * t0, ub0 = a0 + (b0 - a0) * t1, ua1 = a1 + (b1 - a1) * t0, ub1 = a1 + (b1 - a1) * t1;
        const ya0 = archY(a0, b0, ua0, cr0), yb0 = archY(a0, b0, ub0, cr0), ya1 = archY(a1, b1, ua1, cr1), yb1 = archY(a1, b1, ub1, cr1);
        P.quad(soffit, [ua0, ya0, va], [ub0, yb0, va], [ub1, yb1, vb], [ua1, ya1, vb], [0, -1, 0], [[va / 1.2, t0 * 6], [va / 1.2, t1 * 6], [vb / 1.2, t1 * 6], [vb / 1.2, t0 * 6]]);
      }
      // abutment walls below the springing (4 cm in front of the quay wall)
      const yb = waterY - 0.6, ins = 0.04;
      P.quad(M.wet, [a0 + ins, yb, va], [a1 + ins, yb, vb], [a1 + ins, springY, vb], [a0 + ins, springY, va], [1, 0, 0], [[va / tile, 0], [vb / tile, 0], [vb / tile, (springY - yb) / tile], [va / tile, (springY - yb) / tile]]);
      P.quad(M.wet, [b1 - ins, yb, vb], [b0 - ins, yb, va], [b0 - ins, springY, va], [b1 - ins, springY, vb], [-1, 0, 0], [[vb / tile, 0], [va / tile, 0], [va / tile, (springY - yb) / tile], [vb / tile, (springY - yb) / tile]]);
      }
    }
  }

  // ------------------------------------------------------------------ the two faces
  const corniceDrop = stone ? 0.0 : 0.2;
  /** a flat shape WITH holes (u, y) at depth v facing sg */
  const faceShapeH = (mat, outer, holes, v, sg, ut = tile, oy = 0) => {
    const sh = new THREE.Shape(outer.map((p) => new THREE.Vector2(p[0], p[1])));
    for (const h of holes) sh.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2(p[0], p[1]))));
    const g = new THREE.ShapeGeometry(sh, 1), pa = g.attributes.position, ua = g.attributes.uv, na = g.attributes.normal;
    for (let i = 0; i < pa.count; i++) { ua.setXY(i, pa.getX(i) / ut, (pa.getY(i) - oy) / ut); na.setZ(i, sg); }
    if (sg < 0) { const ix = g.index; if (ix) for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } }
    P.geo(mat, g, 0, 0, v); g.dispose();
  };
  // ---- beam3: girder depth 0.85 m at the supports / 0.6 m at mid-span (concave bottom), supports = the banks and two drum piers (diameter site.pier) at +-(spans[1] / 2 + pier / 2) from the middle
  const BH = [0.85, 0.6];
  const beamEdges = (a, b) => { const c = (a + b) / 2, d = site.spans[1] / 2 + site.pier / 2; return [a, c - d, c + d, b]; };
  const beamBottom = (a, b, u) => {
    const e = beamEdges(a, b), k = u < e[1] ? 0 : u < e[2] ? 1 : 2, lo = e[k], hi = e[k + 1], t = clamp((u - (lo + hi) / 2) / ((hi - lo) / 2), -1, 1);
    return yDeck(u) - (BH[0] - (BH[0] - BH[1]) * (1 - t * t));
  };
  B.beamBottom = (u) => beamBottom(bL[0], bR[0], u);
  B.pierU = () => { const e = beamEdges(bL[0], bR[0]); return [e[1], e[2]]; };
  function beamVault() {
    const a = bL[0], b = bR[0], e = beamEdges(a, b), soff = look ? look.soffit : M.soffitIron, yb = waterY - 0.6, ins = 0.04;
    for (let k = 0; k < 3; k++) {
      const n = 8; for (let i = 0; i < n; i++) {
        const u0 = e[k] + (e[k + 1] - e[k]) * i / n, u1 = e[k] + (e[k + 1] - e[k]) * (i + 1) / n, y0 = beamBottom(a, b, u0) - 0.02, y1 = beamBottom(a, b, u1) - 0.02;
        P.quad(soff, [u0, y0, v0], [u1, y1, v0], [u1, y1, v1], [u0, y0, v1], [0, -1, 0]);
      }
    }
    P.quad(M.wet, [a + ins, yb, v0], [a + ins, yb, v1], [a + ins, beamBottom(a, b, a), v1], [a + ins, beamBottom(a, b, a), v0], [1, 0, 0], [[v0 / tile, 0], [v1 / tile, 0], [v1 / tile, 1], [v0 / tile, 1]]);
    P.quad(M.wet, [b - ins, yb, v1], [b - ins, yb, v0], [b - ins, beamBottom(a, b, b), v0], [b - ins, beamBottom(a, b, b), v1], [-1, 0, 0], [[v1 / tile, 0], [v0 / tile, 0], [v0 / tile, 1], [v1 / tile, 1]]);
    const hp = site.pier / 2;
    for (const pu of [e[1], e[2]]) {
      const ytop = beamBottom(a, b, pu);
      P.box(M.pylon, pu - hp, pu + hp, yb, ytop, v0, v1, 'b', 2.2);
      for (const vv of [v0, v1]) {                                                   // the round pier heads project 1.3 m beyond the faces up to deck level
        P.col(M.pylon, pu, vv, yb, yDeck(pu) - 0.14, hp * 1.04, hp, 16, true);
        P.col(M.coping, pu, vv, yDeck(pu) - 0.14, yDeck(pu) - 0.04, hp + 0.07, hp + 0.07, 16, true);
      }
    }
  }
  function beamFace(sg, v, a, b, uA, uB, yFoot) {
    const top = (u) => yDeck(u) - 0.2, fas = look ? look.fas : M.fasIron;
    faceShape(M.granite, [[uA, yFoot], [a, yFoot], [a, top(a)], [uA, top(uA)]], v, sg, tile, 0, yFoot);
    faceShape(M.granite, [[b, yFoot], [uB, yFoot], [uB, top(uB)], [b, top(b)]], v, sg, tile, 0, yFoot);
    const n = Math.max(12, Math.round((b - a) / 0.8)), pts = [];
    for (let i = 0; i <= n; i++) { const u = a + (b - a) * i / n; pts.push([u, beamBottom(a, b, u)]); }
    for (let i = n; i >= 0; i--) { const u = a + (b - a) * i / n; pts.push([u, top(u)]); }
    faceShape(fas, pts, v, sg, tile, 0, yFoot);
    // the granite below the girder at the abutments and a lighter lower flange line
    for (let i = 0; i < n; i++) { const u0 = a + (b - a) * i / n, u1 = a + (b - a) * (i + 1) / n; P.quad(M.copingDark, [u0, beamBottom(a, b, u0) - 0.07, v + sg * 0.04], [u1, beamBottom(a, b, u1) - 0.07, v + sg * 0.04], [u1, beamBottom(a, b, u1), v + sg * 0.04], [u0, beamBottom(a, b, u0), v + sg * 0.04], [0, 0, sg]); }
  }
  /** the stone face of a multi-span bridge (Laundry Bridge): the spandrel wall with one hole per arch, a voussoir ring + rolled string course round each opening */
  function multiFace(sg, v, a, b, uA, uB, yFoot, topL, topR) {
    const ops = openings(a, b), nTop = 8, outer = [[uA, yFoot], [uB, yFoot], [uB, topR]];
    for (let i = nTop - 1; i >= 1; i--) { const u = uA + (uB - uA) * i / nTop; outer.push([u, yDeck(u) - corniceDrop]); }
    outer.push([uA, topL]);
    const holes = ops.map(([a1, b1, c1]) => [[a1, yFoot + 0.02], ...archPts(a1, b1, 18, c1), [b1, yFoot + 0.02]]);
    faceShapeH(look ? look.fas : M.granite, outer, holes, v, sg, tile, yFoot);
    const sd = sg * 0.02;
    for (const [a1, b1, c1] of ops) {
      const ring = archPts(a1, b1, 22, c1), w = 0.45, out = ring.map((p, i) => { const q = ring[Math.min(ring.length - 1, i + 1)], r = ring[Math.max(0, i - 1)]; const du = q[0] - r[0], dy = q[1] - r[1], l = Math.hypot(du, dy) || 1; return [p[0] - dy / l * w, p[1] + du / l * w]; });
      for (let i = 0; i + 1 < ring.length; i++) P.quad(M.voussoir, [ring[i][0], ring[i][1], v + sd], [ring[i + 1][0], ring[i + 1][1], v + sd], [out[i + 1][0], out[i + 1][1], v + sd], [out[i][0], out[i][1], v + sd], [0, 0, sg], [[ring[i][0] / 1.2, 0], [ring[i + 1][0] / 1.2, 0], [ring[i + 1][0] / 1.2, 0.8], [ring[i][0] / 1.2, 0.8]]);
      tube(M.coping, out.map((p) => [p[0], p[1] + 0.02]), v + sg * 0.08, 0.14, 6);
      for (let i = 0; i <= 11; i++) { const j = Math.round(i * (ring.length - 1) / 11); P.quad(M.graniteDark, [ring[j][0] - 0.02, ring[j][1], v + sd * 1.5], [ring[j][0] + 0.02, ring[j][1], v + sd * 1.5], [out[j][0] + 0.02, out[j][1], v + sd * 1.5], [out[j][0] - 0.02, out[j][1], v + sd * 1.5], [0, 0, sg]); }
    }
  }
  function faces() {
    for (const sg of [-1, 1]) {
      const v = sg < 0 ? v0 : v1, [a, b] = bank(v), uA = a - EXT, uB = b + EXT, yFoot = waterY - 0.6;
      const topL = yDeck(uA) - corniceDrop, topR = yDeck(uB) - corniceDrop;
      if (beam) beamFace(sg, v, a, b, uA, uB, yFoot);
      else if (site.spans) multiFace(sg, v, a, b, uA, uB, yFoot, topL, topR);
      else {
      const arch = archPts(a, b, 22);
      const outline = [[uA, yFoot], [a, yFoot], ...arch.map((p, i) => (i === 0 ? [a, springY] : p)), [b, springY], [b, yFoot], [uB, yFoot], [uB, topR]];
      const nTop = 8; for (let i = nTop - 1; i >= 1; i--) { const u = uA + (uB - uA) * i / nTop; outline.push([u, yDeck(u) - corniceDrop]); }
      outline.push([uA, topL]);
      // outline polygon must not repeat the springing point
      const clean = []; for (const p of outline) if (!clean.length || Math.hypot(p[0] - clean[clean.length - 1][0], p[1] - clean[clean.length - 1][1]) > 1e-4) clean.push(p);
      const fmat = look ? look.fas : stone ? (site.style === 'stone2' ? M.graniteRed : M.graniteDark) : (site.style === 'green' ? M.fasGreen : site.style === 'blue' ? M.fasBlue : site.style === 'red' ? M.fasRed : site.style === 'pevchesky' ? M.fasPev : M.granite);
      // for iron bridges the lower abutment columns are granite, the spandrel above the springing the painted fascia: the opening is bounded by the soffit curve
      if (stone) faceShape(fmat, clean, v, sg, tile, 0, yFoot);
      else if (look && look.abut) {
        // cast-iron arch between two full-height granite abutments (look.abut, 1st Engineer Bridge): the ashlar runs up to the cornice at both ends, the iron fascia spans bank to bank only
        const topAt = (u) => yDeck(u) - corniceDrop, col = (u0, u1, k) => { const pts = [[u0, yFoot], [u1, yFoot]]; for (let i = 0; i <= k; i++) { const u = u1 + (u0 - u1) * i / k; pts.push([u, topAt(u)]); } faceShape(look.abut, pts, v, sg, tile, 0, yFoot); };
        col(uA, a, 3); col(b, uB, 3);
        const up = [...arch]; up.push([b, topAt(b)]);
        for (let i = nTop - 1; i >= 1; i--) { const u = a + (b - a) * i / nTop; up.push([u, topAt(u)]); }
        up.push([a, topAt(a)]);
        faceShape(fmat, up, v, sg, tile, 0, yFoot);
      } else {
        const col = (pts) => faceShape(M.granite, pts, v, sg, tile, 0, yFoot);
        col([[uA, yFoot], [a, yFoot], [a, springY], [uA, springY]]); col([[b, yFoot], [uB, yFoot], [uB, springY], [b, springY]]);
        // fascia: above the springing line, between the arch curve and the deck, over the whole length
        const up = [[uA, springY], [a, springY], ...arch.slice(1, -1), [b, springY], [uB, springY], [uB, topR]];
        for (let i = nTop - 1; i >= 1; i--) { const u = uA + (uB - uA) * i / nTop; up.push([u, yDeck(u) - corniceDrop]); }
        up.push([uA, topL]);
        faceShape(fmat, up, v, sg, tile, 0, yFoot);
      }
      // the extrados ring: voussoirs (lighter, radial joints) + rolled string course
      const sd = sg * 0.02;
      if (stone) {
        const w = 0.45, ring = arch, out = ring.map((p, i) => { const q = ring[Math.min(ring.length - 1, i + 1)], r = ring[Math.max(0, i - 1)]; const du = q[0] - r[0], dy = q[1] - r[1], l = Math.hypot(du, dy) || 1; return [p[0] - dy / l * w, p[1] + du / l * w]; });
        for (let i = 0; i + 1 < ring.length; i++) P.quad(M.voussoir, [ring[i][0], ring[i][1], v + sd], [ring[i + 1][0], ring[i + 1][1], v + sd], [out[i + 1][0], out[i + 1][1], v + sd], [out[i][0], out[i][1], v + sd], [0, 0, sg], [[ring[i][0] / 1.2, 0], [ring[i + 1][0] / 1.2, 0], [ring[i + 1][0] / 1.2, 0.8], [ring[i][0] / 1.2, 0.8]]);
        tube(M.coping, out.map((p) => [p[0], p[1] + 0.02]), v + sg * 0.08, 0.17, 6);
        for (let i = 0; i <= 11; i++) { const j = Math.round(i * (ring.length - 1) / 11); P.quad(M.graniteDark, [ring[j][0] - 0.02, ring[j][1], v + sd * 1.5], [ring[j][0] + 0.02, ring[j][1], v + sd * 1.5], [out[j][0] + 0.02, out[j][1], v + sd * 1.5], [out[j][0] - 0.02, out[j][1], v + sd * 1.5], [0, 0, sg]); }
      } else {
        // painted band along the deck edge (the ornament strip) + a plain cornice with a dentil row
        const bandMat = look ? look.band : site.style === 'green' ? M.bandGreen : site.style === 'blue' ? M.bandBlue : site.style === 'red' ? M.bandRed : M.bandPev;
        const nb = 10;
        if (bandMat) for (let i = 0; i < nb; i++) {
          const ua = uA + (uB - uA) * i / nb, ub = uA + (uB - uA) * (i + 1) / nb, ya = yDeck(ua) - 0.2, yb2 = yDeck(ub) - 0.2, h = 0.4;
          P.quad(bandMat, [ua, ya - h, v + sd], [ub, yb2 - h, v + sd], [ub, yb2, v + sd], [ua, ya, v + sd], [0, 0, sg], [[ua / 2.6, 0], [ub / 2.6, 0], [ub / 2.6, 1], [ua / 2.6, 1]]);
                  }
        // arch ring edge (a light rolled moulding along the soffit line)
        tube(look && look.mould || M.copingDark, arch, v + sg * 0.03, 0.07, 5);
      }
      }
      // cornice slab along the deck edge (projects 0.12 m beyond the face); a look with granite abutments (look.abut) has a stone cornice over them and its own iron cornice between
      const runs = look && look.abut ? [[uA, a, 2, true], [a, b, 6, false], [b, uB, 2, true]] : [[uA, uB, 10, stone]];
      for (const [r0, r1, nr, stoneRun] of runs) for (let i = 0; i < nr; i++) {
        const ua = r0 + (r1 - r0) * i / nr, ub = r0 + (r1 - r0) * (i + 1) / nr, ya = yDeck(ua), yb2 = yDeck(ub), yt = -0.03, dy = stoneRun && !(look && look.abut) ? 0.16 : 0.2;
        const cm = stoneRun ? M.coping : (look && look.cornice) || M.copingDark, o = sg * (stoneRun ? 0.07 : 0.12);
        P.quad(cm, [ua, ya - dy, v + o], [ub, yb2 - dy, v + o], [ub, yb2 + yt, v + o], [ua, ya + yt, v + o], [0, 0, sg], [[ua / 2.2, 0], [ub / 2.2, 0], [ub / 2.2, 0.2], [ua / 2.2, 0.2]]);
        P.quad(cm, [ua, ya + yt, v + o], [ub, yb2 + yt, v + o], [ub, yb2 + yt, v - sg * 0.5], [ua, ya + yt, v - sg * 0.5], [0, 1, 0]);
        P.quad(cm, [ua, ya - dy, v], [ub, yb2 - dy, v], [ub, yb2 - dy, v + o], [ua, ya - dy, v + o], [0, -1, 0]);
      }
    }
  }
  B.faceInfo = (sg) => { const v = sg < 0 ? v0 : v1, [a, b] = bank(v); return { v, a, b, uA: a - EXT, uB: b + EXT }; };

  // ------------------------------------------------------------------ deck surface
  const zoneAt = (v) => site.zones.find((z) => v >= z[0] - 1e-6 && v <= z[1] + 1e-6) || site.zones[0];
  const zoneLift = { asphalt: 0, pave: 0.12, sett: 0.02, plaza: 0.1, slab: 0.0, plank: 0.0, tram: 0.0, barrier: 0.45, verge: 0.0, walk: 0.12 };           // (tram / barrier / verge / walk: the second pass, sites-vo2.js; the pavements of the Smolenka bridges are asphalt)
  const zoneMat = { asphalt: M.asphalt, pave: M.pave, sett: M.sett, plaza: M.pave, slab: M.pave, plank: M.plank, tram: M.tramSlab || M.asphalt, barrier: M.graniteGrey || M.pave, verge: M.footAsphalt, walk: M.footAsphalt };
  function deck() {
    // v breakpoints: sample stations + zone borders
    const set = new Set(vs.map((x) => +x.toFixed(3)));
    for (const z of site.zones) { set.add(+z[0].toFixed(3)); set.add(+z[1].toFixed(3)); }
    const bv = [...set].sort((a, b) => a - b);
    for (let k = 0; k + 1 < bv.length; k++) {
      const va = bv[k], vb = bv[k + 1]; if (vb - va < 0.02) continue;
      const vm = (va + vb) / 2, zone = zoneAt(vm), kind = zone[2], lift = zoneLift[kind] ?? 0;
      const [a0, b0] = bank(va), [a1, b1] = bank(vb), ua = Math.min(a0, a1) - EXT, ub = Math.max(b0, b1) + EXT;
      const n = Math.max(2, Math.ceil((ub - ua) / 3));
      for (let i = 0; i < n; i++) {
        const u0 = ua + (ub - ua) * i / n, u1 = ua + (ub - ua) * (i + 1) / n, y0 = yDeck(u0) + lift, y1 = yDeck(u1) + lift;
        const mat = zoneMat[kind], s = kind === 'asphalt' ? 4 : kind === 'sett' ? 1.9 : 2.4;
        P.quad(mat, [u0, y0, va], [u1, y1, va], [u1, y1, vb], [u0, y0, vb], [0, 1, 0], [[u0 / s, va / s], [u1 / s, va / s], [u1 / s, vb / s], [u0 / s, vb / s]]);
      }
      // kerb faces where the neighbouring zone is lower / higher
      for (const [vk, side] of [[va, -1], [vb, 1]]) {
        const vn = vk + side * 0.05, zn = zoneAt(vn), ln = zoneLift[zn[2]] ?? 0;
        if (zn === zone || Math.abs(ln - lift) < 0.01 || ln > lift) continue;                 // draw once, from the higher zone
        const [kk0, kk1] = bank(vk);
        for (let i = 0; i < n; i++) {
          const u0 = ua + (ub - ua) * i / n, u1 = ua + (ub - ua) * (i + 1) / n;
          if (u1 < kk0 - EXT || u0 > kk1 + EXT) continue;
          P.quad(M.kerb, [u0, yDeck(u0) + ln, vk], [u1, yDeck(u1) + ln, vk], [u1, yDeck(u1) + lift, vk], [u0, yDeck(u0) + lift, vk], [0, 0, side], [[0, 0], [1, 0], [1, 0.1], [0, 0.1]]);
        }
      }
    }
  }
  /** road markings: dashes between lanes, a double centre line in wide roadways (decals +2.5 cm) */
  function markings() {
    if (site.noMarks) return;                                        // (the carriageways cross this deck at a skew: no lane paint along u)
    for (const z of site.zones) {
      if (z[2] !== 'asphalt') continue;
      const w = z[1] - z[0]; if (w < 5.2) continue;
      const lanes = Math.max(2, Math.round(w / 3.4));
      const strip = (u0, u1, vc, hw, mat = M.mark) => {
        const n = Math.max(1, Math.ceil((u1 - u0) / 5));
        for (let i = 0; i < n; i++) { const a = u0 + (u1 - u0) * i / n, b = u0 + (u1 - u0) * (i + 1) / n; P.quad(mat, [a, yDeck(a) + 0.03, vc - hw], [b, yDeck(b) + 0.03, vc - hw], [b, yDeck(b) + 0.03, vc + hw], [a, yDeck(a) + 0.03, vc + hw], [0, 1, 0]); }
      };
      for (let k = 1; k < lanes; k++) {
        const vc = z[0] + w * k / lanes, [a, b] = bank(vc);
        if (lanes % 2 === 0 && k === lanes / 2 && lanes >= 4) { strip(a + 0.2, b - 0.2, vc - 0.1, 0.06); strip(a + 0.2, b - 0.2, vc + 0.1, 0.06); }
        else for (let u = a + 1.0; u + 3 < b - 1; u += 9) strip(u, u + 3, vc, 0.06);
      }
    }
  }

  // ------------------------------------------------------------------ granite parapet (Kazansky, Winter Canal): solid, rough blocks, bullnose top, rolled coping
  /** parapet of height h along face sg from uA to uB (outer face flush with the spandrel at v) */
  B.parapet = (sg, uA, uB, h = 1.1, th = 0.52, mat = M.parapet) => {
    // WATER IS REACHABLE (docs/AREAS.md 13.7): the parapet is a row of breakable SECTIONS (bridges/rails.js parapet(): a swept cross-section, instanced, one knock record and one collider per section), no longer merged quads
    const v = sg < 0 ? v0 : v1, vi = v - sg * th, n = Math.max(1, Math.ceil((uB - uA) / 2.8));
    for (let i = 0; i < n; i++) {
      const ua = uA + (uB - uA) * i / n, ub = uA + (uB - uA) * (i + 1) / n, p = B.world(ua, v), q = B.world(ub, v);
      rails.parapet({ x0: p.x, z0: p.z, x1: q.x, z1: q.z, y: yDeck(ua), ye: yDeck(ub), h, th, mat, mirror: sg > 0 });
    }
    B.info.parapet = (B.info.parapet || 0) + 1;
    return { v, vi, uA, uB, h };
  };

  // ------------------------------------------------------------------ railing: instanced panels between posts
  /** railing along face sg from uA to uB (the line stands at v +- inset); kind = pattern, hex = colour; posts: box posts at every bay boundary */
  B.railLine = (sg, uA, uB, kind, hex, o = {}) => {
    const spec = railSpec(kind), v = (sg < 0 ? v0 : v1) - sg * (o.inset ?? 0.18), len = uB - uA, n = Math.max(1, Math.round(len / (o.bay ?? spec.W))), bw = len / n;
    const postMat = o.postMat || M.black, ph = o.postH ?? (spec.H + 0.12), pw = o.postW ?? 0.22;
    const gap = 0.05;
    for (let i = 0; i < n; i++) {
      const uCtr = uA + bw * (i + 0.5), ua = uA + bw * i, ub = ua + bw;
      const slope_ = slope(uCtr), w = B.world(ua + gap, v), yy = yDeck(ua + gap) + (o.lift ?? 0.04);
      rails.add({ kind, hex, x: w.x, y: yy, z: w.z, rotY: -T, roll: Math.atan(slope_), len: bw - 2 * gap, h: o.h });
      B.info.rails++;
      if (o.gold) for (const dv of [0.012, -0.012]) { const wg = B.world(ua + gap, v + dv); rails.add({ kind: o.gold.kind, hex: o.gold.hex, x: wg.x, y: yy, z: wg.z, rotY: -T, roll: Math.atan(slope_), len: bw - 2 * gap, h: o.h, over: true }); }   // gilded details: same panel, 1.2 cm in front on both sides
    }
    for (let i = 0; i <= n; i++) {
      const u = uA + bw * i, y = yDeck(u);
      if (i === 0 && o.noEndPosts) continue;
      P.box(postMat, u - pw / 2, u + pw / 2, y, y + ph, v - pw / 2, v + pw / 2, 'b', 1);
      P.box(postMat, u - pw * 0.62, u + pw * 0.62, y + ph, y + ph + 0.07, v - pw * 0.62, v + pw * 0.62, 'b', 1);
      P.box(postMat, u - pw * 0.7, u + pw * 0.7, y, y + 0.14, v - pw * 0.7, v + pw * 0.7, 'b', 1);
    }
    // a continuous hand rail on top of the panels (clean silhouette from far away)
    const capMat = o.capMat || postMat;
    for (let i = 0; i < n; i++) {
      const ua = uA + bw * i, ub = ua + bw, ya = yDeck(ua) + 0.04 + spec.H, yb = yDeck(ub) + 0.04 + spec.H;
      P.quad(capMat, [ua, ya + 0.05, v - 0.05], [ub, yb + 0.05, v - 0.05], [ub, yb + 0.05, v + 0.05], [ua, ya + 0.05, v + 0.05], [0, 1, 0]);
      P.quad(capMat, [ua, ya, v + 0.05], [ub, yb, v + 0.05], [ub, yb + 0.05, v + 0.05], [ua, ya + 0.05, v + 0.05], [0, 0, 1]);
      P.quad(capMat, [ub, yb, v - 0.05], [ua, ya, v - 0.05], [ua, ya + 0.05, v - 0.05], [ub, yb + 0.05, v - 0.05], [0, 0, -1]);
    }
    return { v, n, bw };
  };

  // ------------------------------------------------------------------ colliders
  B.colliders = () => {
    const ph = ctx.physics; let n = 0;
    const rampRot = Math.atan2(f.c, f.s);
    // deck: chunks of ~6 m along v, each with its own bank limits, stations every ~5 m along u
    const skew = Math.max(...bL) - Math.min(...bL) > 2.5;                            // a skewed bridge: thin chunks keep the walk ramps close to the slanted bank lines
    const nC = Math.max(1, Math.ceil((v1 - v0) / (skew ? 1.0 : 6)));
    for (let c = 0; c < nC; c++) {
      const va = v0 + (v1 - v0) * c / nC, vb = v0 + (v1 - v0) * (c + 1) / nC, [a0, b0] = bank(va), [a1, b1] = bank(vb);
      // the chunk may only reach as far as the banks of BOTH of its ends (never over open water): use the narrowest interval
      const ua = Math.max(a0, a1) - EXT, ub = Math.min(b0, b1) + EXT;
      if (ub - ua < 1) continue;
      const m = Math.max(2, Math.ceil((ub - ua) / 4));
      for (let i = 0; i < m; i++) {
        const u0 = ua + (ub - ua) * i / m, u1 = ua + (ub - ua) * (i + 1) / m, w = B.world((u0 + u1) / 2, (va + vb) / 2);
        ph.addWalkRamp(w.x, w.z, vb - va + 0.04, u1 - u0 + 0.04, rampRot, yDeck(u0), yDeck(u1), 2.5); n++;
      }
    }
    B.info.colliders += n;
  };
  /** solid box along face sg (rail line / parapet): from uA to uB, 0.5 m thick, y -6 .. 1.4 */
  B.faceCollider = (sg, uA, uB, inset = 0.25, th = 0.5) => {
    // the solid box along a face (rail line / parapet): now a request to the fence batch (rails.wall): it becomes a collider only where no drawn panel / parapet section covers its line (those bays have their own),
    // and then a ghost bay, breakable like the rest (docs/AREAS.md 13.7)
    const v = (sg < 0 ? v0 : v1) - sg * inset, p = B.world(uA, v), q = B.world(uB, v), ya = yDeck(uA), yb = yDeck(uB);
    rails.wall({ x0: p.x, z0: p.z, x1: q.x, z1: q.z, th, y0: Math.min(ya, yb) - 0.8, y1: Math.max(1.45, Math.max(ya, yb) + 1.3), y: Math.min(ya, yb) }); B.info.colliders++;
  };

  /** the environment may leave the quay open over a longer stretch than the deck (BRIDGE_ZONES w): close the rest with a posts + loop railing on both bank lines and a solid collider */
  B.closeQuay = (zone) => {
    if (!zone) return 0;
    const c = toUV(site, zone.c[0], zone.c[1]), hw = zone.w / 2, ranges = [[c.v - hw, v0 - 0.3], [v1 + 0.3, c.v + hw]];
    let n = 0;
    for (const [va, vb] of ranges) {
      if (vb - va < 0.8) continue;
      const nP = Math.max(1, Math.ceil((vb - va) / 2.4));
      let last = null;
      for (const side of [-1, 1]) {
        const pts = [];
        for (let i = 0; i <= nP; i++) { const v = va + (vb - va) * i / nP, w = waterAt(site, v) || (last ? last : [-8.5, 8.5]); last = w; pts.push([side < 0 ? w[0] - 0.45 : w[1] + 0.45, v]); }
        P.push(f.cx, 0, f.cz, -T);
        for (let i = 0; i <= nP; i++) P.box(M.pylon, pts[i][0] - 0.23, pts[i][0] + 0.23, 0.14, 1.12, pts[i][1] - 0.23, pts[i][1] + 0.23, 'b', 1.1);
        P.pop();
        for (let i = 0; i < nP; i++) {
          const A = B.world(pts[i][0], pts[i][1]), Bw = B.world(pts[i + 1][0], pts[i + 1][1]);
          railWorld(rails, A.x, A.z, Bw.x, Bw.z, 0.2, 'loops', '#202428', { bay: 2.4 }); B.info.rails++; n++;
        }
        for (let i = 0; i < nP; i += 4) {                                                // (the solid box of every four panels is gone: each railing panel is a breakable bay with its own collider, bridges/rails.js)
          const j = Math.min(nP, i + 4), A = B.world(pts[i][0], pts[i][1]), Bw = B.world(pts[j][0], pts[j][1]);
          rails.wall({ x0: A.x, z0: A.z, x1: Bw.x, z1: Bw.z, th: 0.5, y0: 0.0 - 0.8, y1: 1.25, y: 0 }); B.info.colliders++;
        }
      }
    }
    return n;
  };

  B.drawDeck = () => {
    P.push(f.cx, 0, f.cz, -T);
    deck(); markings();
    P.pop();
  };
  B.draw = () => {
    P.push(f.cx, 0, f.cz, -T);
    vault(); faces(); deck(); markings();
    P.pop();
  };
  return B;
}
