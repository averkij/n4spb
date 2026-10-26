// landmarksAcademy/pier.js - the EGYPTIAN SPHINX PIER (Пристань с сфинксами, K. A. Thon 1831-34): docs/research/academy.md 4 (critic-corrected), photos ac_035 sq_074 sq_047 cr_sq075..079 gr_*.
// A stair PIT cut into the Neva wall: groups.js WATER_RINGS hands the ring (p +-19.2 about the axis u -1.2, v 104.3 .. 109.8) to environment as water (a hole in the ground and in the quay), this
// file fills it with solid granite: the UPPER FLIGHT (22 m wide, 6 risers of 0.38 m: street 0 -> landing -2.28), the LANDING (y -2.28) with two concave stone BENCHES against the back wall (v 106.4)
// whose ends carry four bronze GRIFFINS, the LOWER FLIGHT (full width, 7 visible steps of 0.14 m to the lowest walkable tread at y -3.26... the water is -3.4), the cheek walls, the two red-granite
// PEDESTALS (6.2 x 3.1 m, +1.8 m above the pavement, the 4-line inscription on the landward face) with the plinths (hieroglyph bands) and the SPHINXES (crown tip +6.3 m), the two bronze LAMP
// COLUMNS on granite blocks at the stair head, the black cast-iron railing along the landward edge of the pit (not across the flight).  Coordinates: the academy frame (u, v), p = u + 1.2.
import { ACAD, W, AF, PIER } from './frame.js';
import { lathe } from './prims.js';
import { sphinxFig, griffinFig } from './sphinx.js';
import { figureMats } from '../lib/figures.js';
import { knockBays, splitBays, unitPanel } from '../lib/fence-bays.js';        // n4spb (docs/AREAS.md 13.7, 15.z): the railing is a row of breakable bays,
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';      // the two bronze lamp columns are knock records

const U0 = PIER.u, YL = PIER.yLand, YW = PIER.yWater;
const pu = (p) => U0 + p;

export async function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, fm = figureMats(ctx);
  const top = (mat, x0, x1, z0, z1, y, tile = 2.4) => P.quad(mat, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0], [[x0 / tile, z1 / tile], [x1 / tile, z1 / tile], [x1 / tile, z0 / tile], [x0 / tile, z0 / tile]]);
  /** a granite block: sides in M.pink, the top in `topMat` (a separate quad: no coplanar faces), no bottom */
  const blk = (x0, x1, y0, y1, z0, z1, topMat = M.steps, skip = 'b') => { P.box(M.pink, x0, x1, y0, y1, z0, z1, skip + 't', 2.4); if (!skip.includes('t')) top(topMat, x0, x1, z0, z1, y1); };
  P.push(ACAD.x, 0, ACAD.z, ACAD.rot);
  try {
    const vT = PIER.vTop, vB = PIER.vBack;                                           // 104.3 pit edge, 106.4 back wall of the bench recess
    // ------------------------------------------------------------------------------------------ the upper flight: 5 treads (tops -0.38 .. -1.90) + the landing from v 107.05 (-2.28); risers 0.38 m, treads 0.55 m
    const Ltop = (j) => -0.38 * (j + 1), vS = (j) => vT + 0.55 * j;
    blk(pu(-11), pu(11), Ltop(0), 0.03, vT - 0.3, vT, M.slabs);                                      // the lip of the pavement at the head of the stair
    for (let j = 0; j < 5; j++) blk(pu(-11), pu(11), Ltop(j + 1), Ltop(j), vS(j), vS(j + 1));
    P.box(M.pink, pu(-11), pu(11), -3.6, YL, vT, vS(5), 'bt', 2.4);                                    // the core under the flight
    // ------------------------------------------------------------------------------------------ the landing slab (y -2.28) and the lower flight (7 steps of 0.14 m)
    blk(pu(-11), pu(11), -3.6, YL, vS(5), 108.7);                                                      // the landing in front of the flight
    blk(pu(-19.2), pu(-11), -3.6, YL, vB, 108.7); blk(pu(11), pu(19.2), -3.6, YL, vB, 108.7);          // the landings of the bench recesses (one slab each: no seam)
    const nLow = 7, dv = (PIER.vEnd - 108.7) / 8;
    for (let k = 1; k <= nLow; k++) { const y = YL - 0.14 * k, v0 = 108.7 + dv * (k - 1); blk(pu(-19.2), pu(19.2), -3.6, y, v0, 108.7 + dv * k); }
    // the submerged last step and the toe of the flight (below the water)
    P.box(M.pinkShade, pu(-19.2), pu(19.2), -3.9, -3.5, 108.7 + dv * nLow, PIER.vEnd + 0.1, 'b', 2.4);
    // ------------------------------------------------------------------------------------------ the shelves between the flight and the pedestals (y 0), the back wall of the bench recess
    for (const s of [-1, 1]) {
      const a = s < 0 ? pu(-19.2) : pu(11), b = s < 0 ? pu(-11) : pu(19.2);
      blk(a, b, -3.6, 0.03, vT, vB, M.slabs);
      // coping along the lip of the shelf toward the flight
    }
    // ------------------------------------------------------------------------------------------ cheek walls of the lower flight beyond the quay line (v 109.3 .. 111.9)
    for (const s of [-1, 1]) { const x0 = s < 0 ? pu(-20.9) : pu(19.2), x1 = s < 0 ? pu(-19.2) : pu(21.1); blk(x0, x1, -3.6, -1.9, 109.38, 112.1, M.pinkTop); }
    // ------------------------------------------------------------------------------------------ benches: concave segments against the back wall, seat top -1.83 (0.45 above the landing)
    const benches = [];
    for (const s of [-1, 1]) {
      const pc = s * 15.2, half = 3.5, n = 8, pts = [];
      for (let i = 0; i <= n; i++) { const t = -1 + 2 * i / n; pts.push([pu(pc + t * half), vB + 0.3 + 0.9 * t * t]); }       // the middle touches the wall zone, the ends swing out 0.9 m
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = dz / l, nz = -dx / l, w = 0.28;      // (nx, nz): toward the landing (+v side)
        const s2 = nz > 0 ? 1 : -1, ox = nx * s2 * w, oz = nz * s2 * w;
        const q = (p, d) => [p[0] + (d > 0 ? ox : -ox), p[1] + (d > 0 ? oz : -oz)];
        const A = q(a, 1), B = q(b, 1), C = q(b, -1), D = q(a, -1), y0 = YL, y1 = YL + 0.45;
        P.quad(M.steps, [A[0], y1, A[1]], [B[0], y1, B[1]], [C[0], y1, C[1]], [D[0], y1, D[1]], [0, 1, 0], [[0, 0], [l / 1.2, 0], [l / 1.2, 0.6], [0, 0.6]]);
        P.quad(M.pink, [A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]], [nx * s2, 0, nz * s2], [[0, 0], [l / 1.2, 0], [l / 1.2, 0.4], [0, 0.4]]);
        P.quad(M.pink, [D[0], y0, D[1]], [C[0], y0, C[1]], [C[0], y1, C[1]], [D[0], y1, D[1]], [-nx * s2, 0, -nz * s2], [[0, 0], [l / 1.2, 0], [l / 1.2, 0.4], [0, 0.4]]);
      }
      // the bench end blocks (griffin plinths) and the back wall coping
      for (const e of [-1, 1]) { const px = pu(pc + e * (half + 0.15)), pz = vB + 0.3 + 0.9 + 0.1; blk(px - 0.4, px + 0.4, YL, YL + 0.5, pz - 0.4, pz + 0.4, M.steps); benches.push({ x: W(px, pz).x, z: W(px, pz).z, u: px, v: pz }); }
    }
    // ------------------------------------------------------------------------------------------ the griffins on the bench ends: 1.1 m, facing the river, heads turned toward the axis
    {
      const mk = { main: M.griffinBody, dark: fm.dark, accent: M.griffin };
      const mkHi = { main: M.griffinHi, dark: fm.dark, accent: M.griffin };
      for (const b of benches) {
        const side = b.u < U0 ? -1 : 1;                                                // the west pair turns its head east (toward +u = the figure's right when facing +v... see griffinFig)
        const fig = griffinFig(side < 0 ? 1 : -1);
        fig.place(P, mk, b.u, YL + 0.5, b.v, 0, 0.68);
        void mkHi;
      }
    }
    // ------------------------------------------------------------------------------------------ pedestals, plinths, sphinxes
    const mkS = { main: M.sphinx, dark: M.sphinxDark, accent: M.crown };
    const sphinx = sphinxFig();
    const peds = [{ u: PIER.ped[0], faceU: 1, name: 'west' }, { u: PIER.ped[1], faceU: -1, name: 'east' }];
    for (const pd of peds) {
      const hw = PIER.pedW / 2, x0 = pd.u - hw, x1 = pd.u + hw, v0 = 106.3, v1 = 109.38;
      P.box(M.pink, x0 - 0.22, x1 + 0.22, -3.6, 0.5, v0 - 0.22, v1, 'bt', 2.4); top(M.pinkTop, x0 - 0.22, x1 + 0.22, v0 - 0.22, v1, 0.5);                // the base course
      P.box(M.pink, x0, x1, 0.5, PIER.pedY, v0, v1, 'bt', 2.4); top(M.pinkTop, x0, x1, v0, v1, PIER.pedY);                                          // the pedestal
      // the polished faces: a lighter slab inset on the long faces would z-fight: the grain texture does it.  The inscription on the landward long face (reads toward +v)
      P.quad(M.inscrPed, [pd.u + 2.0, 0.52, v0 - 0.02], [pd.u - 2.0, 0.52, v0 - 0.02], [pd.u - 2.0, 1.77, v0 - 0.02], [pd.u + 2.0, 1.77, v0 - 0.02], [0, 0, -1]);
      // the plinth with hieroglyph bands on four faces (5.8 m x 2.4 m, 0.6 m high)
      const pl = 2.9, pw = 1.2, pc = (v0 + v1) / 2 - 0.05, py0 = PIER.pedY, py1 = py0 + 0.6;
      P.box(M.sphinxPlinth, pd.u - pl, pd.u + pl, py0, py1, pc - pw, pc + pw, 'b', 2.4);
      const hq = (a, b, y0, y1, z, nrm, ua, ub) => P.quad(M.hiero, [a, y0, z], [b, y0, z], [b, y1, z], [a, y1, z], nrm, [[ua, 0], [ub, 0], [ub, 1], [ua, 1]]);
      hq(pd.u + pl, pd.u - pl, py0 + 0.03, py1 - 0.03, pc - pw - 0.012, [0, 0, -1], 0, pl * 2 / 0.8);
      hq(pd.u - pl, pd.u + pl, py0 + 0.03, py1 - 0.03, pc + pw + 0.012, [0, 0, 1], 0, pl * 2 / 0.8);
      for (const e of [-1, 1]) P.quad(M.hiero, [pd.u + e * (pl + 0.012), py0 + 0.03, e > 0 ? pc - pw : pc + pw], [pd.u + e * (pl + 0.012), py0 + 0.03, e > 0 ? pc + pw : pc - pw], [pd.u + e * (pl + 0.012), py1 - 0.03, e > 0 ? pc + pw : pc - pw], [pd.u + e * (pl + 0.012), py1 - 0.03, e > 0 ? pc - pw : pc + pw], [e, 0, 0], [[0, 0], [3, 0], [3, 1], [0, 1]]);
      // the sphinx: heads toward the stair axis (west faces +u, east faces -u)
      sphinx.place(P, mkS, pd.u, py1, pc, pd.faceU > 0 ? Math.PI / 2 : -Math.PI / 2, 1.0);
      // colliders: the pedestal (full box), the base course
      AF.box(ph, pd.u, (v0 + v1) / 2, PIER.pedW + 0.5, v1 - v0 + 0.4, -4, PIER.pedY + 2.5);
      const w = W(pd.u, pc);
      K.svc.monuments.push({ id: 'sphinx-' + pd.name, name: 'Сфинкс (' + (pd.name === 'west' ? 'западный' : 'восточный') + ')', x: w.x, z: w.z, h: 6.3, r: 3.2 });
    }
    // ------------------------------------------------------------------------------------------ the two lamp columns on granite blocks at the head of the stair (dark-green bronze, flared fluted shaft, a dished top)
    // n4spb (docs/AREAS.md 13.7): the granite block stays a solid structure, the bronze column on it is a KNOCK record (a lamp: a car or a hard shove tips it over)
    const lampSpots = [], lampItems = [];
    for (const s of [-1, 1]) {
      const cx = pu(s * 11.55), cz = 104.95;
      blk(cx - 0.55, cx + 0.55, 0, 0.9, cz - 0.55, cz + 0.55, M.pinkTop);
      AF.box(ph, cx, cz, 1.1, 1.1, -4, 0.9);                                                              // the granite block (a structure)
      const w = W(cx, cz);
      lampSpots.push({ x: w.x, y: 0.9, z: w.z, rotY: 0 });
      lampItems.push(ph.addCylinder(w.x, w.z, 0.3, 0.9, 2.8));                                              // the column (the knock record removes it)
      K.svc.lamps.push({ x: w.x, z: w.z, h: 2.7, kind: 'pier-column' });
    }
    // the shaft is FLUTED from the foot to the relief band (12 flutes, sq_074 / cr_sq075), the cup on top is dished; three small brackets round the foot (one geometry, the foot at y 0 = the top of the block)
    {
      const shaft = flutedLathe([[0.44, 0], [0.44, 0.1], [0.3, 0.22], [0.21, 0.4], [0.2, 1.0], [0.165, 1.4], [0.22, 1.5], [0.36, 1.62], [0.47, 1.72], [0.48, 1.8], [0.34, 1.8], [0.26, 1.72], [0.2, 1.6]], 48, 12, 0.07, 0.3, 1.1);
      const parts = [shaft];
      for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3 + 0.4, b = new THREE.BoxGeometry(0.18, 0.18, 0.18); b.deleteAttribute('uv'); b.translate(Math.cos(a) * 0.34, 0.09, Math.sin(a) * 0.34); parts.push(b); }
      const geo = mergeGeometries(parts);
      K.extraTris += knockFurniture(ctx, 'lmacade-pier-lamps', { list: [{ mat: M.lampGreen, geo }] }, lampSpots, lampItems, FURNITURE_REC.lamp(1.8), 260);
    }
    // ------------------------------------------------------------------------------------------ the black cast-iron railing along the landward edge of the pit (two stretches beside the flight; not across it)
    // n4spb (docs/AREAS.md 13.7): the two stretches are rows of BREAKABLE bays (panel + posts with ball tops, one thin collider and one knock record each: a car breaks a bay off at the foot, the gap is passable)
    {
      const bays = [];
      for (const [a, b] of [[pu(-20.4), pu(-12.0)], [pu(9.6), pu(18.0)]]) {
        const A = W(a, vT - 0.18), B = W(b, vT - 0.18);
        bays.push(...splitBays(A.x, A.z, B.x, B.z, 2.8, { y: 0 }));
      }
      const postGeo = new THREE.CylinderGeometry(0.045, 0.05, 1.08, 6, 1, false); postGeo.translate(0, 0.54, 0);
      const ballG = new THREE.SphereGeometry(1, 8, 6);
      const panelGeo = unitPanel(0.04, 1.04, { u1: 2.8 });
      knockBays(ctx, { name: 'lmacade-pier-rail', bays, far: 260,
        parts: [
          { geo: panelGeo, mat: M.railing, name: 'panel', stretch: true, shadow: false, receive: false },
          { geo: postGeo, mat: M.iron, name: 'post', ats: (bay) => (bay.last ? ['start', 'end'] : ['start']), shadow: false, receive: false },
          { geo: ballG, mat: M.iron, name: 'ball', ats: (bay) => (bay.last ? ['start', 'end'] : ['start']), y: 1.12, sx: 0.075, sy: 0.075, sz: 0.075, shadow: false, receive: false },
        ],
        collider: { y0: 0, y1: 1.3, thick: 0.4, e0: 0, e1: 0 },
        rec: () => ({ kind: 'fence', mass: 120, h: 1.1, anchored: 16, hitK: 0.4, metal: true, minDv: 0 }) });
      K.extraTris += bays.length * 122 + 2 * 120;                                                          // (panel 2 + post 24 + ball 96 per bay, the closing post and ball of each stretch)
    }
    // solid masses: the shelves (blocked by the railing), the lamp blocks
    AF.box(ph, pu(-15.1), (vT + vB) / 2, 8.2, vB - vT, -4, 2); AF.box(ph, pu(12.9), (vT + vB) / 2, 8.2, vB - vT, -4, 2);
    // ------------------------------------------------------------------------------------------ walk boxes: the upper flight, the landing, the bench recesses, the lower flight, guards
    for (let j = 0; j < 5; j++) AF.walk(ph, pu(0), (vS(j) + vS(j + 1)) / 2, 22, 0.65, Ltop(j), -3.7);
    AF.walk(ph, pu(0), (vS(5) + 108.7) / 2, 38.4, 108.7 - vS(5) + 0.1, YL, -3.7);
    for (const s of [-1, 1]) AF.walk(ph, pu(s * 15.1), (vB + 108.7) / 2, 8.4, 108.7 - vB + 0.1, YL, -3.7);
    for (let k = 1; k <= nLow; k++) AF.walk(ph, pu(0), 108.7 + dv * (k - 0.5), 38.4, dv + 0.1, YL - 0.14 * k, -3.7);
    // (the source's invisible guard along the last step, "nobody walks on the water", is gone: water is reachable, docs/AREAS.md 13.7; the walker steps off the last tread into the Neva)
    for (const s of [-1, 1]) AF.box(ph, pu(s * 20.1), 110.8, 2.2, 3.4, -4, YL + 0.5);                     // the cheek walls of the lower flight
    for (const b of benches) AF.box(ph, b.u, b.v - 0.7, 3.0, 1.2, YL, YL + 0.6);                          // the benches are solid
    // services
    const lc = W(pu(0), 108.0), lp = W(pu(0), 102.6);
    K.svc.crowd.push({ x: lc.x, z: lc.z, r: 8, n: 12, kind: 'quay', y: YL, name: 'Пристань со сфинксами: площадка' });
    K.svc.photoSpots.push({ x: lc.x, z: lc.z, yaw: ctx.L.yawToward(lc.x, lc.z, W(pu(0), 50).x, W(pu(0), 50).z), y: YL, name: 'Пристань со сфинксами: вид на Академию' });
    K.svc.photoSpots.push({ x: lp.x, z: lp.z, yaw: ctx.L.yawToward(lp.x, lp.z, W(pu(0), 140).x, W(pu(0), 140).z), name: 'Сфинксы и Нева' });
    K.svc.benches.push(...benches.map((b) => ({ x: b.x, z: b.z, len: 7.5, y: YL + 0.45 })));
    K.svc.pier = { axis: [W(pu(0), 108).x, W(pu(0), 108).z], landingY: YL, lowestY: YL - 0.14 * nLow, ring: 'sphinx-pit' };
  } finally { P.pop(); }
}

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** a lathe body with vertical flutes between y0 and y1: profile [[r, y]..] bottom to top, seg sides, `flutes` scallops of relative depth `depth` (smoothly faded at both ends of the fluted range) */
function flutedLathe(profile, seg, flutes, depth, y0, y1) {
  const pos = [], idx = [], n = profile.length, k1 = seg + 1;
  for (let j = 0; j < n; j++) {
    const [r, y] = profile[j], fade = Math.max(0, Math.min(1, Math.min((y - y0) / 0.12, (y1 - y) / 0.12)));
    for (let k = 0; k <= seg; k++) {
      const a = k / seg * Math.PI * 2, f = 1 - depth * fade * (0.5 + 0.5 * Math.cos(a * flutes)) ** 1.6;
      pos.push(Math.sin(a) * r * f, y, Math.cos(a) * r * f);
    }
  }
  for (let j = 0; j + 1 < n; j++) for (let k = 0; k < seg; k++) { const a = j * k1 + k, b = a + 1, c = a + k1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // the winding must face outward: flip when the first normal points to the axis
  const nr = g.attributes.normal, p = g.attributes.position; let s = 0;
  for (let i = 0; i < nr.count; i++) s += nr.getX(i) * p.getX(i) + nr.getZ(i) * p.getZ(i);
  if (s < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
  return g;
}
