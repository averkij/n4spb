// landmarksAndrew/market.js - the ANDREEVSKY MARKET (Андреевский рынок, Большой пр. 18, r1198837; gostiny dvor of 1789-90, restored 2003-05): a butter-yellow two-storey ring 150.8 x 58.7 m round a long courtyard,
// a round-arched ARCADE on the ground floor (arches 3.3 m, crown 4.45 m; a shallow vaulted gallery with shop fronts behind it), arched windows with wide white archivolts over it (crown 7.2 m), a white string
// course (4.65) and cornice (7.5 .. 7.9), a steep red hipped roof (eave 7.9, ridge 12.4) with one small hipped dormer per bay on the outer slopes and the plain-wordmark roof sign АНДРЕЕВСКИЙ ДВОР on the north slope.
// Dossier docs/research/andrew.md section 4 (critic-corrected), photos refs/andrew 63 65 61 60 66.  Frame M (frame.js): a across (59.5 m), b along (150.8 m); the walls are drawn edge by edge on the baked footprint
// (outer ring + courtyard hole), the roof between per-edge offset rings (ridge line of each wing at its own depth).  Colliders: the footprint wall boxes (the building is solid; the gallery is a visual recess).
import * as THREE from 'three';
import * as L from '../layout.js';
import { addPolyColliders } from '../lib/massing.js';
import { ringEdges, band, onEdge, polyOf, frameOf, localOnEdge } from './kit.js';
import * as G from './geo.js';
import * as D from './domes.js';
import { FM } from './frame.js';
import { footprintIn, offsetRing, nearestVertex, wallBoxes } from './ringkit.js';

const H = { fl: 0.12, spring: 2.8, crown: 4.45, str0: 4.65, str1: 4.9, sill: 5.0, wcrown: 7.2, cor0: 7.5, eave: 7.9, ridge: 12.4, gd: 1.8, rev: 0.9, archW: 3.3 };
const FALL = { outer: [[28.9, -75.5], [29.9, 75.2], [-28.8, 75.5], [-29.8, -75.2]], holes: [[[8.8, -61], [-10.2, -60.7], [-8.7, 49.3], [-5.7, 49.3], [-5.6, 57.9], [10.3, 57.7], [9.1, -48.6]]] };

/** textures + materials of this part (cached on M.mkt) */
function mats(K) {
  const { ctx, M } = K; if (M.mkt) return M.mkt;
  const T = ctx.mat.toon, tex = ctx.tex, F = tex.FONTS, W = '#ffffff';
  const draw = (w, h, fn, key) => tex.draw(w, h, fn, { key: 'lmAnd-' + key, repeat: [1, 1] });
  const shopTex = draw(256, 235, (g, w, h) => {                                       // the gallery back wall, one bay 4.9 x 4.5 m: pale wall, a dark glazed shop front, a door, a lit transom
    g.fillStyle = '#e3c473'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(120,90,40,0.10)'; g.fillRect(0, 0, w, 14);
    g.fillStyle = '#2a3236'; g.fillRect(34, 66, 188, h - 66);
    const gr = g.createLinearGradient(0, 66, 0, h); gr.addColorStop(0, '#f1d9a2'); gr.addColorStop(1, '#8a6a3a'); g.fillStyle = gr; g.fillRect(42, 74, 172, h - 74);
    g.fillStyle = '#2a3236'; for (const x of [42, 85, 128, 171, 212]) g.fillRect(x - 2, 66, 4, h - 66); g.fillRect(34, 112, 188, 4); g.fillRect(34, 66, 188, 8);
    g.fillStyle = '#3b2a1e'; g.fillRect(104, 118, 48, h - 118); g.fillStyle = '#d6b36b'; g.fillRect(106, 120, 20, h - 122); g.fillRect(130, 120, 20, h - 122);
    g.fillStyle = '#1d2326'; g.fillRect(0, h - 6, w, 6);
  }, 'mktShop');
  const signTex = draw(1024, 256, (g, w, h) => {                                      // the roof wordmark: plain white capitals (no logo)
    g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f7f4ec';
    let sz = 150; g.font = `800 ${sz}px ${F.sans}`; while (sz > 30 && g.measureText('АНДРЕЕВСКИЙ').width > w - 40) { sz -= 4; g.font = `800 ${sz}px ${F.sans}`; }
    g.fillText('АНДРЕЕВСКИЙ', w / 2, h * 0.32); g.font = `800 ${Math.round(sz * 0.78)}px ${F.sans}`; g.fillText('ДВОР', w / 2, h * 0.78);
  }, 'mktSign');
  const m = {
    wall: T('#ecd08a', { name: 'lmAnd-mktWall', paint: 0.05 }), plinth: T('#bba87a', { map: M.A.graniteGrain, name: 'lmAnd-mktPlinth', paint: 0.04 }),
    roof: T('#9a3a34', { map: M.A.seams, name: 'lmAnd-mktRoof', paint: 0.05, side: 'double' }), roofShade: T('#7c2e2a', { name: 'lmAnd-mktRoofShade', paint: 0.04, side: 'double' }),
    floor: T('#c9bda3', { name: 'lmAnd-mktFloor', paint: 0.04 }), vault: T('#efd9a0', { name: 'lmAnd-mktVault', paint: 0.03 }),
    shop: T(W, { map: shopTex, name: 'lmAnd-mktShop', paint: 0.02 }),
    sign: T(W, { map: signTex, name: 'lmAnd-mktSign', paint: 0, polygonOffset: -2, transparent: true, depthWrite: false }),
    win: T(W, { map: M.A.winBrown, name: 'lmAnd-mktWin', paint: 0, polygonOffset: -1 }),
  };
  M.decals.add(m.win); M.decals.add(m.sign); M.mkt = m; return m;
}

const planeNormal = (z) => [0, 0, z];
/** one arcade bay of the front wall (facade frame): wall rectangle with the round arch cut out (+ reveal of depth H.rev), x0..x1 */
function arcadeBay(P, mk, x0, x1, c) {
  const arch = G.archPts(c, H.fl, H.archW, H.crown - H.fl, 10), rect = [[x0, 0], [x1, 0], [x1, H.str0], [x0, H.str0]];
  P.face(mk.wall, G.shapeOf(rect, [arch]), 0, 3, 4);
  // reveal: the two jambs and the soffit of the arch, H.rev deep (z 0 .. -rev)
  const n = arch.length;                                             // arch = [bl, br, (br up), arc..., (bl up)]: counter-clockwise: bottom left -> bottom right -> up the right jamb -> over the top -> down the left jamb
  const ring = arch.slice(1);                                         // from the bottom right corner around to the top left, then the left jamb's start
  for (let i = 0; i + 1 < ring.length; i++) {
    const a = ring[i], b = ring[i + 1], mx = (a[0] + b[0]) / 2 - c, my = (a[1] + b[1]) / 2 - (H.fl + (H.crown - H.fl - H.archW / 2)), l = Math.hypot(mx, my) || 1;
    P.quad(mk.wall, [a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], -H.rev], [a[0], a[1], -H.rev], [-mx / l, -my / l, 0]);
  }
  // left jamb (down from the last arc point to the floor)
  const tl = arch[n - 1]; P.quad(mk.wall, [tl[0], tl[1], 0], [tl[0], H.fl, 0], [tl[0], H.fl, -H.rev], [tl[0], tl[1], -H.rev], [1, 0, 0]);
  return arch;
}

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, mk = mats(K);
  const fp = footprintIn('r1198837', FM, FALL), outer = fp.outer, hole = fp.holes[0] || null;
  const all = ringEdges(polyOf(outer, hole ? [hole] : []));                       // outward normals: out of the building on the outer ring, into the court on the hole ring
  const rings = [{ edges: all.filter((e) => !e.hole), hole: false }, ...(hole ? [{ edges: all.filter((e) => e.hole), hole: true }] : [])];
  // the SOUTH PASSAGE through the south wing (OSM gate n963714078 at M(0.5, 70.1)): the arch bay of the outer south front and the arch bay of the court niche that lie nearest to a = 2.4 are opened and joined by a tunnel
  const outerS = all.find((e) => !e.hole && e.len < 100 && e.a[1] + e.b[1] > 0), courtS = all.find((e) => e.hole && (e.a[1] + e.b[1]) / 2 > 55 && e.len > 12 && e.len < 20);
  const PASS = new Map();
  if (outerS && courtS) for (const e of [outerS, courtS]) {
    const n = Math.max(2, Math.round(e.len / 5.0)), pitch = e.len / n, f = frameOf(e), u = localOnEdge(e, 2.4, (e.a[1] + e.b[1]) / 2).u, c = (Math.max(0, Math.min(n - 1, Math.round(u / pitch - 0.5))) + 0.5) * pitch;
    PASS.set(e, { c, a: f.x + f.xa[0] * c, b: f.z + f.xa[1] * c, nx: e.n[0], nz: e.n[1] });
  }
  P.push(FM.ox, 0, FM.oz, FM.rot);
  try {
    // ------------------------------------------------------------------------ walls, arcade, windows, gallery
    for (const { edges, hole: isHole } of rings) {
      for (const e of edges) onEdge(P, e, (len, f) => {
        if (len < 7) { G.wall(P, mk.wall, 0, len, 0, H.eave, 0, 3); return; }
        const n = Math.max(2, Math.round(len / 5.0)), pitch = len / n;
        // the wall above the arcade up to the eave
        G.wall(P, mk.wall, 0, len, H.str0, H.eave, 0, 3);
        for (let i = 0; i < n; i++) {
          const c = (i + 0.5) * pitch;
          arcadeBay(P, mk, i * pitch, (i + 1) * pitch, c);
          D.archWin(P, M, c, H.sill, 2.6, H.wcrown - H.sill, { mat: mk.win, b: 0.3, depth: 0.1, sill: true });          // arched window, the wide white archivolt is the 0.3 m ring
        }
        // granite plinth on the piers (never across an arch)
        for (let i = 0; i <= n; i++) {
          const xa = i === 0 ? 0 : (i - 0.5) * pitch + H.archW / 2, xb = i === n ? len : (i + 0.5) * pitch - H.archW / 2;
          if (xb - xa > 0.1) P.box(mk.plinth, xa, xb, 0, 0.8, 0, 0.07, 'bk', 2);
        }
        // the gallery behind the arcade: floor, flat vault (pale), the shop-front back wall (trimmed at convex corners), end caps on the courtyard side
        const gd = H.gd;
        P.quad(mk.floor, [0, H.fl, -gd], [len, H.fl, -gd], [len, H.fl, 0], [0, H.fl, 0], [0, 1, 0]);
        P.quad(mk.vault, [0, H.str0 - 0.06, 0], [len, H.str0 - 0.06, 0], [len, H.str0 - 0.06, -gd], [0, H.str0 - 0.06, -gd], [0, -1, 0]);
        const t0 = 0, t1 = len;
        const ps = PASS.get(e), pieces = ps ? [[t0, ps.c - 1.65], [ps.c + 1.65, t1]] : [[t0, t1]];
        for (const [x0, x1] of pieces) if (x1 - x0 > 0.3) P.quad(mk.shop, [x0, H.fl, -gd], [x1, H.fl, -gd], [x1, H.str0 - 0.06, -gd], [x0, H.str0 - 0.06, -gd], [0, 0, 1], [[x0 / pitch, 0], [x1 / pitch, 0], [x1 / pitch, 1], [x0 / pitch, 1]]);
        if (isHole) for (const x of [0.02, len - 0.02]) P.quad(mk.wall, [x, H.fl, -gd], [x, H.fl, 0], [x, H.str0 - 0.06, 0], [x, H.str0 - 0.06, -gd], [x === 0.02 ? 1 : -1, 0, 0]);
        void f;
      });
      // string course (above the arcade) and the cornice, mitred round the ring
      band(P, edges, H.str0, H.str1, 0.1, { front: M.white, top: M.white }, { uvs: 3 });
      band(P, edges, H.cor0, H.eave, isHole ? 0.35 : 0.5, { front: M.white, top: M.white, under: M.underside }, { uvs: 3 });
      band(P, edges, H.eave - 0.55, H.cor0, 0.18, { front: M.white, top: M.white }, { uvs: 3 });
    }
    // ------------------------------------------------------------------------ the south passage tunnel: the arch profile extruded from the back wall of the outer gallery to the back wall of the court gallery
    if (outerS && courtS) {
      const po = PASS.get(outerS), pc = PASS.get(courtS), b0 = po.b - H.gd, b1 = pc.b + H.gd, arch = G.archPts(0, H.fl, H.archW, H.crown - H.fl, 10), na = arch.length, yc = H.fl + (H.crown - H.fl - H.archW / 2);
      for (let i = 1; i < na; i++) {
        const A = arch[i], B = arch[(i + 1) % na], mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
        P.quad(mk.wall, [po.a + A[0], A[1], b0], [po.a + B[0], B[1], b0], [pc.a + B[0], B[1], b1], [pc.a + A[0], A[1], b1], [-mx, yc - my, 0]);
      }
      P.quad(mk.floor, [po.a - 1.65, H.fl, b0], [po.a + 1.65, H.fl, b0], [pc.a + 1.65, H.fl, b1], [pc.a - 1.65, H.fl, b1], [0, 1, 0]);
    }
    // ------------------------------------------------------------------------ the roof
    const dOuter = outer.map((p, i) => { const q = outer[(i + 1) % outer.length], len = Math.hypot(q[0] - p[0], q[1] - p[1]), mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2; return len > 100 ? (mx > 0 ? 10.35 : 9.65) : (mz < 0 ? 7.25 : 8.8); });
    const R = offsetRing(outer, dOuter), n = outer.length, seam = 2.2;
    const roofQuad = (pts, uv) => P.quad(mk.roof, [pts[0][0], pts[0][1], pts[0][2]], [pts[1][0], pts[1][1], pts[1][2]], [pts[2][0], pts[2][1], pts[2][2]], [pts[3][0], pts[3][1], pts[3][2]], [0, 1, 0], uv);
    for (let i = 0; i < n; i++) {                                                                       // outer slopes (hips at the corners)
      const j = (i + 1) % n, a = outer[i], b = outer[j], ra = R[i], rb = R[j], len = Math.hypot(b[0] - a[0], b[1] - a[1]), d = dOuter[i], sl = Math.hypot(d, H.ridge - H.eave);
      roofQuad([[a[0], H.eave, a[1]], [b[0], H.eave, b[1]], [rb[0], H.ridge, rb[1]], [ra[0], H.ridge, ra[1]]], [[0, 0], [len / seam, 0], [len / seam, sl / seam], [0, sl / seam]]);
    }
    if (hole && hole.length === 7) {                                                                    // inner slopes: valley fans from the ridge corners (the baked hole has 7 vertices)
      const ne = nearestVertex(R, 30, -75), se = nearestVertex(R, 30, 75), sw = nearestVertex(R, -30, 75), nw = nearestVertex(R, -30, -75);
      const V = (p, ridge) => [p[0], ridge ? H.ridge : H.eave, p[1]], T = (a, b, c) => P.fan(mk.roof, [a, b, c], [0, 1, 0], (p) => [p[0] / seam, p[2] / seam]), h = hole;
      // order of the baked hole: 0 NE-N, 1 NW-N, 2 W-S, 3 step, 4 step, 5 SE, 6 E-mid
      T(V(nw, 1), V(ne, 1), V(h[0], 0)); T(V(nw, 1), V(h[0], 0), V(h[1], 0));                                // north wing
      T(V(nw, 1), V(h[1], 0), V(h[2], 0)); T(V(nw, 1), V(h[2], 0), V(sw, 1));                                // west wing
      T(V(ne, 1), V(h[0], 0), V(h[6], 0)); T(V(ne, 1), V(h[6], 0), V(h[5], 0)); T(V(ne, 1), V(h[5], 0), V(se, 1));   // east wing
      T(V(se, 1), V(sw, 1), V(h[2], 0)); T(V(se, 1), V(h[2], 0), V(h[3], 0)); T(V(se, 1), V(h[3], 0), V(h[4], 0)); T(V(se, 1), V(h[4], 0), V(h[5], 0));   // south wing
    } else if (hole) {
      for (let i = 0; i < hole.length; i++) { const j = (i + 1) % hole.length; P.fan(mk.roof, [[hole[i][0], H.eave, hole[i][1]], [hole[j][0], H.eave, hole[j][1]], [0, H.ridge, 0]], [0, 1, 0], (p) => [p[0] / seam, p[2] / seam]); }
    }
    // ------------------------------------------------------------------------ dormers: one per bay on the outer slopes (not at the hipped ends)
    const edgesO = ringEdges(polyOf(outer));
    const slopes = new Map(); outer.forEach((p, i) => slopes.set(i, (H.ridge - H.eave) / dOuter[i]));
    for (const e of edgesO) {
      const sl = slopes.get(e.i) ?? 0.5;
      onEdge(P, e, (len) => {
        if (len < 20) { /* short fronts too */ }
        const nb = Math.max(2, Math.round(len / 5.0)), pitch = len / nb;
        for (let i = 1; i < nb - 1; i++) { if (e.len < 100 && e.a[1] + e.b[1] < 0 && Math.abs((i + 0.5) * pitch - len / 2) < 4.6) continue; dormer(P, mk, (i + 0.5) * pitch, sl); }      // the roof wordmark replaces the dormers at the middle of the north front
      });
    }
    // the roof wordmark on the north slope (the short front toward Bolshoy pr.)
    const north = edgesO.filter((e) => e.len < 100).sort((p, q) => (p.a[1] + p.b[1]) - (q.a[1] + q.b[1]))[0];
    if (north) onEdge(P, north, (len) => {
      const sl = slopes.get(north.i) ?? 0.6, z0 = -3.7, z1 = -6.7, y = (z) => H.eave - sl * z + 0.08, cx = len / 2, hw = 4.3;
      P.quad(mk.sign, [cx - hw, y(z0), z0], [cx + hw, y(z0), z0], [cx + hw, y(z1), z1], [cx - hw, y(z1), z1], [0, 1, 0.8], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    });
  } finally { P.pop(); }
  // ------------------------------------------------------------------------ colliders and services: the building is solid
  try {
    const W = (a, b) => { const p = FM.W(a, b); return [p.x, p.z]; };
    for (const e of all) {
      const A = W(e.a[0], e.a[1]), B = W(e.b[0], e.b[1]), ps = PASS.get(e), dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1], l = Math.hypot(dx, dz) || 1;
      const gaps = ps ? [[((ps.a - e.a[0]) * dx + (ps.b - e.a[1]) * dz) / l - 1.85, ((ps.a - e.a[0]) * dx + (ps.b - e.a[1]) * dz) / l + 1.85]] : [];
      wallBoxes(ph, A, B, 0, 9, 1.0, gaps);
    }
    if (outerS && courtS) {
      const po = PASS.get(outerS), pc = PASS.get(courtS), b0 = po.b - H.gd, b1 = pc.b + H.gd, rotB = FM.rot - Math.PI / 2;
      for (const sg of [-1, 1]) {
        const m1 = FM.W((po.a + pc.a) / 2 + sg * 1.78, (b0 + b1) / 2); ph.addBox(m1.x, m1.z, Math.abs(b0 - b1) + 0.4, 0.2, rotB, 0, 6);        // tunnel side walls
        const m2 = FM.W(po.a + sg * 1.78, po.b - H.gd / 2); ph.addBox(m2.x, m2.z, H.gd + 0.2, 0.2, rotB, 0, 6);                                      // the outer gallery bay: closed left and right of the passage
        const m3 = FM.W(pc.a + sg * 1.78, pc.b + H.gd / 2); ph.addBox(m3.x, m3.z, H.gd + 0.2, 0.2, rotB, 0, 6);                                      // the court gallery bay
      }
      const me = FM.W(po.a, po.b + 0.4), ce = FM.W(pc.a, pc.b - 0.4);
      K.svc.entrances.push({ id: 'market-south-passage', x: me.x, z: me.z, rotY: FM.rot, name: 'Андреевский рынок: арка проезда во двор' }, { id: 'market-court', x: ce.x, z: ce.z, rotY: FM.rot + Math.PI, name: 'Андреевский двор' });
      K.svc.crowd.push({ id: 'market-court', kind: 'rest', x: FM.W(0, 10).x, z: FM.W(0, 10).z, r: 9, n: 6 });
    }
  } catch (e) { console.warn('[landmarksAndrew] market colliders:', e && e.message); }
  const c = FM.W(0, -80);
  K.svc.monuments.push({ id: 'r1198837', name: 'Андреевский рынок', x: FM.W(0, 0).x, z: FM.W(0, 0).z, h: 12.4 });
  K.svc.crowd.push({ id: 'market-north', kind: 'photo', x: c.x, z: c.z, r: 10, n: 6 });
  void THREE; void planeNormal;
}

/** a small hipped dormer on the outer slope (facade frame: x along the wall, z out, the roof rises toward -z with slope sl): front wall with a brown window, two cheeks, a gable roof meeting the main roof */
function dormer(P, mk, cx, sl) {
  const hw = 0.85, z0 = -0.7, yr = (z) => H.eave - sl * z, yb = yr(z0) - 0.03, yt = yb + 1.55, zE = z0 - (yt - yr(z0)) / sl, ry = yt + 0.65, zR = z0 - (ry - yr(z0)) / sl;
  // front wall (red) + the window decal + the gable end
  P.quad(mk.roofShade, [cx - hw, yb, z0], [cx + hw, yb, z0], [cx + hw, yt, z0], [cx - hw, yt, z0], [0, 0, 1]);
  P.quad(mk.win, [cx - 0.42, yb + 0.2, z0 + 0.02], [cx + 0.42, yb + 0.2, z0 + 0.02], [cx + 0.42, yb + 1.3, z0 + 0.02], [cx - 0.42, yb + 1.3, z0 + 0.02], [0, 0, 1]);
  P.fan(mk.roofShade, [[cx - hw - 0.08, yt, z0], [cx + hw + 0.08, yt, z0], [cx, ry, z0]], [0, 0, 1]);
  // cheeks (triangles down to the main roof) and the two roof planes of the dormer
  for (const s of [-1, 1]) {
    P.fan(mk.roofShade, [[cx + s * hw, yb, z0], [cx + s * hw, yt, z0], [cx + s * hw, yt, zE]], [s, 0, 0]);
    P.quad(mk.roof, [cx + s * (hw + 0.08), yt, z0], [cx, ry, z0], [cx, ry, zR], [cx + s * (hw + 0.08), yt, zE], [s * 0.5, 1, 0]);
  }
}
