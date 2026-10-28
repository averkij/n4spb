// landmarksSeaTerminal/terminal.js - the SEA TERMINAL block (Морской вокзал, V. A. Sokhin, L. V. Kalyagin et al., 1982; OSM r6702553 + parts): the seven-storey prism with its three hotel tiers of arched
// hood windows, the ONE band of big fluted aluminium sails (the technical floor) hung in arches of 2-3 bays with down-curved claws, the recessed hall glazing, the spine, the roof with its parapet and the two atria.
// Dossier docs/research/seaterminal.md sections 4.1-4.4 (CRITIC-corrected heights: parapet 29.0 [?]), photos a01 a03 a07 a17 a23.  Frame T (frame.js): u along the long faces, v toward the sea, y up.
// LAYERS (y above the lot): 0 .. 6.0 the ground block (a rectangle u 0 .. 117.6, v 0 .. 55.7: podium stone on the NE face, glazing behind the apron on the SW face, stone on the end);
//   6.0 .. 18.0 hall glazing set back 1.0 m (the octagon inset by 1.0 m; the spine face is the same plane), the ledge at y 6.0 and the dark soffit at y 18.0;
//   18.0 .. 28.4 three tiers (pitch 3.0): the bay wall (aluminium with 5.0 x 1.5 m glazing, texture) behind INSTANCED arched hood frames (0.6 m deep) and the plain band 27.0 .. 28.4;
//   28.4 roof (membrane with the two atrium holes), 28.4 .. 29.0 parapet upstand.   The big sails (smooth fluted grid surfaces, 0.6 m out at the top, 1.6 m at the bottom) hang from y 18.0 to the arched bottom edge
//   (apex 14.8, claws 9.6) in the spans of frame.js SAILS_*; the claw fins are concrete.  The spine (u 34.4 .. 40.3) is a concrete face recessed 1.0 m, from y 6 to the roof (the clock tower rises on the NE, the pylon on the SW).
// Faces: the 8 edges of the octagon PRISM; face frame = x along the wall to the RIGHT as seen from outside, y up, z OUT of the wall (kit.js frames); built inside the T frame (Parts.push).
import * as THREE from 'three';
import * as L from '../layout.js';
import { T, PRISM, H, SPINE, BAY, SAILS_LONG, SAILS_END, outlineWorld } from './frame.js';
import { archFrame, gridGeo, insetConvex } from './geo.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';

const O8 = PRISM, I8 = insetConvex(PRISM, 1.0);
const KINDS = ['ne', 'cNE-SE', 'se', 'cSE-SW', 'sw', 'cSW-NW', 'nw', 'cNW-NE'];
export const FACES = O8.map((a, i) => {
  const b = O8[(i + 1) % 8], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
  const n = [dz / len, -dx / len], t = [-dx / len, -dz / len];
  return { i, id: KINDS[i], O: b, E: a, n, t, L: len, th: Math.atan2(n[0], n[1]), long: i === 0 || i === 4, chamfer: i % 2 === 1 };
});
/** (u, v) -> [s, d] in the frame of face F */
export const loc = (F, p) => [(p[0] - F.O[0]) * F.t[0] + (p[1] - F.O[1]) * F.t[1], (p[0] - F.O[0]) * F.n[0] + (p[1] - F.O[1]) * F.n[1]];
/** face point (s, d) -> (u, v) */
export const at = (F, s, d = 0) => [F.O[0] + F.t[0] * s + F.n[0] * d, F.O[1] + F.t[1] * s + F.n[1] * d];

// the spine (u 34.4 .. 40.3) as s ranges of the two long faces
const SPINE_S = { 0: [98.0 - SPINE.u1, 98.0 - SPINE.u0], 4: [SPINE.u0 - 2.9, SPINE.u1 - 2.9] };             // NE: s = 98 - u; SW: s = u - 2.9
/** the bays of a face: [{ s0, s1, pitch }]; fillers are not bays */
function bayList(F) {
  const out = [];
  if (F.long) {
    const sp = SPINE_S[F.i];
    if (F.i === 0) { for (let k = 0; k < 9; k++) out.push({ s0: 1.0 + k * BAY, pitch: BAY }); for (let k = 0; k < 5; k++) out.push({ s0: sp[1] + k * BAY, pitch: BAY }); }
    else { for (let k = 0; k < 5; k++) out.push({ s0: k * BAY, pitch: BAY }); for (let k = 0; k < 9; k++) out.push({ s0: sp[1] + k * BAY, pitch: BAY }); }
  } else if (F.chamfer) out.push({ s0: 0, pitch: F.L });
  else for (let k = 0; k < 8; k++) out.push({ s0: k * (F.L / 8), pitch: F.L / 8 });
  return out.map((b) => ({ ...b, s1: b.s0 + b.pitch }));
}
/** sail spans of a face as s ranges (frame.js SAILS_*; the end sails run to the face ends) */
function sailList(F) {
  if (F.i === 0) return [[0, 98 - 78.1], [98 - 78.1, 98 - 59.2], [98 - 59.2, 98 - 40.3], [98 - 34.4, 98 - 18.65], [98 - 18.65, F.L]];
  if (F.i === 4) return [[0, 18.65 - 2.9], [18.65 - 2.9, 34.4 - 2.9], [40.3 - 2.9, 59.2 - 2.9], [59.2 - 2.9, 78.1 - 2.9], [78.1 - 2.9, F.L]];
  if (F.chamfer) return [[0, F.L]];
  const k = F.L / 4; return [[0, k], [k, 2 * k], [2 * k, 3 * k], [3 * k, F.L]];
}

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSeaTerminal] terminal/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = K.P;
  P.push(T.x, 0, T.z, T.rot);
  try {
    stage('ground', () => ground(K));
    stage('faces', () => faces(K));
    stage('roof', () => roofDeck(K));
  } finally { P.pop(); }
  stage('hoods', () => hoods(K));
  stage('colliders', () => colliders(K));
  stage('services', () => {
    const c = T.W(50, 28), sp = (name, x, z, tx, tz) => K.svc.photoSpots.push({ name, x, z, yaw: L.yawToward(x, z, tx, tz), pitch: 6 });
    const n = T.W(37.35, 51), face = T.W(60, 0), se = T.W(105, 5), nw = T.W(0, 20);
    sp('Морской вокзал: северо-восточный фасад с парковки', -6469.0, 613.7, face.x, face.z);
    sp('Морской вокзал: юго-восточный торец с площади', -6371.5, 685.3, se.x, se.z);
    sp('Площадь Морской Славы: перспектива Большого проспекта к игле', -6300.0, 640.0, n.x, n.z);
    sp('Морской вокзал: северо-западный торец и въезд', -6568.5, 586.8, nw.x, nw.z);
    K.svc.monuments.push({ id: 'r6702553', name: 'Морской вокзал', x: c.x, z: c.z, h: H.top });
    K.svc.entrances.push({ id: 'lift-gate', x: -6486.9, z: 540.0, rotY: 0, kind: 'checkpoint', closed: false });
  });
  K.svc.terminal = { prism: O8, inset: I8, faces: FACES.map((f) => f.id) };
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the ground block (y 0 .. 6.0), the ledge at y 6.0
function ground(K) {
  const P = K.P, M = K.M, Y = H.slabTop;
  const W = 117.6, V = 55.7;
  // NE face v = 0: podium stone, u 0 .. 117.6, facing -z (the lot); the stone is read left to right as seen from the lot (u runs against the viewer's right): uv.u = (W - u) / 2.4
  P.quad(M.podium, [W, 0, 0], [0, 0, 0], [0, Y, 0], [W, Y, 0], [0, 0, -1], [[0, 0], [W / 2.4, 0], [W / 2.4, Y / 1.2], [0, Y / 1.2]]);
  // NW end u = 0 (facing -x): stone
  P.quad(M.podium, [0, 0, 0], [0, 0, V], [0, Y, V], [0, Y, 0], [-1, 0, 0], [[0, 0], [V / 2.4, 0], [V / 2.4, Y / 1.2], [0, Y / 1.2]]);
  // SE end u = 117.6 (the annex face, facing +x): grey concrete with the vehicle opening 4.2 x 4.2 m at v 24 .. 30 drawn dark
  P.quad(M.concreteLight, [W, 0, V], [W, 0, 0], [W, Y, 0], [W, Y, V], [1, 0, 0], [[0, 0], [V / 2, 0], [V / 2, Y / 4], [0, Y / 4]]);
  P.quad(M.glassDark, [W + 0.02, 0.0, 30], [W + 0.02, 0.0, 24], [W + 0.02, 4.2, 24], [W + 0.02, 4.2, 30], [1, 0, 0]);
  // SW face v = 55.7 (facing +z): the glazed ground floor behind the apron piers (y 0 .. 3.5) and the concrete band under the slab edge (3.5 .. 6.0)
  P.quad(M.hall, [0, 0, V], [W, 0, V], [W, H.slabBot, V], [0, H.slabBot, V], [0, 0, 1], [[0, 0], [W / 12.6, 0], [W / 12.6, H.slabBot / 4], [0, H.slabBot / 4]]);
  P.quad(M.concrete, [0, H.slabBot, V], [W, H.slabBot, V], [W, Y, V], [0, Y, V], [0, 0, 1], [[0, H.slabBot / 4], [W / 2, H.slabBot / 4], [W / 2, Y / 4], [0, Y / 4]]);
  // the roof of the ground block / the ledge at y = 6.0: the rectangle minus the inset octagon (the hall glazing ring)
  P.cap(M.quayDeck, [[0, 0], [W, 0], [W, V], [0, V]], Y, true, 5, [I8.map((p) => [p[0], p[1]]).reverse()]);
  // the ground block walls on the three sides facing the deck get a dark door strip decal every ~20 m on the NE face (entrances under the deck; closed): glazed double doors 2.4 x 2.6 m at u 20, 47, 65, 90
  for (const u of [20, 47, 65, 90]) {
    P.quad(M.glassDark, [u + 1.2, 0, -0.03], [u - 1.2, 0, -0.03], [u - 1.2, 2.6, -0.03], [u + 1.2, 2.6, -0.03], [0, 0, -1]);
    P.quad(M.frame, [u + 0.02, 0, -0.04], [u - 0.02, 0, -0.04], [u - 0.02, 2.6, -0.04], [u + 0.02, 2.6, -0.04], [0, 0, -1]);
  }
  // storefront strips (dark glass 4 m wide, 2.3 m tall) between the doors
  for (const u of [8, 33, 56, 78, 104]) P.quad(M.glassDark, [u + 2.2, 0.5, -0.03], [u - 2.2, 0.5, -0.03], [u - 2.2, 2.8, -0.03], [u + 2.2, 2.8, -0.03], [0, 0, -1]);
}

// ------------------------------------------------------------------------------------------------ the eight faces of the prism: glazing, spine, tier wall, ledges, sails, claw fins, top band
function faces(K) {
  const P = K.P, M = K.M, Y = H.slabTop;
  for (const F of FACES) {
    const a = loc(F, I8[(F.i + 1) % 8]), b = loc(F, I8[F.i]);                    // the inset edge in the face frame: s from a[0] to b[0] (d = -1.0)
    const s0 = a[0], s1 = b[0], sp = SPINE_S[F.i];
    P.push(F.O[0], 0, F.O[1], F.th);
    try {
      // ---- hall glazing, y 6 .. 18, at d = -1.0 (the octagon inset); the spine zone is concrete
      const gl = (sa, sb) => { if (sb - sa < 0.02) return; P.quad(M.hall, [sa, Y, -1], [sb, Y, -1], [sb, H.sailTop, -1], [sa, H.sailTop, -1], [0, 0, 1], [[(sa - s0) / 12.6, 0], [(sb - s0) / 12.6, 0], [(sb - s0) / 12.6, (H.sailTop - Y) / 4], [(sa - s0) / 12.6, (H.sailTop - Y) / 4]]); };
      if (sp) {
        gl(s0, sp[0]); gl(sp[1], s1);
        // the spine: concrete face at d = -1.0 from y 6 to the roof + the parapet, with returns (d -1 .. 0) over the tiers
        P.quad(M.concrete, [sp[0], Y, -1], [sp[1], Y, -1], [sp[1], H.parapet, -1], [sp[0], H.parapet, -1], [0, 0, 1], [[0, 0], [(sp[1] - sp[0]) / 2, 0], [(sp[1] - sp[0]) / 2, (H.parapet - Y) / 4], [0, (H.parapet - Y) / 4]]);
        P.quad(M.concrete, [sp[0], H.sailTop, 0], [sp[0], H.sailTop, -1], [sp[0], H.parapet, -1], [sp[0], H.parapet, 0], [1, 0, 0], [[0, 0], [0.5, 0], [0.5, 2.8], [0, 2.8]]);
        P.quad(M.concrete, [sp[1], H.sailTop, -1], [sp[1], H.sailTop, 0], [sp[1], H.parapet, 0], [sp[1], H.parapet, -1], [-1, 0, 0], [[0, 0], [0.5, 0], [0.5, 2.8], [0, 2.8]]);
      } else gl(s0, s1);
      // ---- the tier wall, y 18 .. 28.4, at d = 0: bays (bayWall texture, one bay = 6.3 m, four bays per tile), fillers plain aluminium
      const bays = bayList(F), runs = [];
      for (const bay of bays) { const last = runs[runs.length - 1]; if (last && Math.abs(last.s1 - bay.s0) < 1e-6 && Math.abs(last.pitch - bay.pitch) < 1e-6) { last.s1 = bay.s1; last.n++; } else runs.push({ s0: bay.s0, s1: bay.s1, pitch: bay.pitch, n: 1 }); }
      for (const r of runs) {
        const tile = 25.2 * r.pitch / BAY;
        P.quad(M.bayWall, [r.s0, H.tierBase, 0], [r.s1, H.tierBase, 0], [r.s1, H.roof, 0], [r.s0, H.roof, 0], [0, 0, 1], [[0, 0], [(r.s1 - r.s0) / tile, 0], [(r.s1 - r.s0) / tile, (H.roof - H.tierBase) / 3.0], [0, (H.roof - H.tierBase) / 3.0]]);
      }
      // fillers: from the face end to the first bay and the last bay to the end (long faces: 1.0 m at the SE corner), plain
      const covered = runs.map((r) => [r.s0, r.s1]).sort((p, q) => p[0] - q[0]);
      const gaps = []; let cur = 0;
      for (const [x0, x1] of covered) { if (x0 - cur > 0.02) gaps.push([cur, x0]); cur = Math.max(cur, x1); }
      if (F.L - cur > 0.02) gaps.push([cur, F.L]);
      for (const [x0, x1] of gaps) { if (sp && x0 >= sp[0] - 0.01 && x1 <= sp[1] + 0.01) continue; P.quad(M.alu, [x0, H.tierBase, 0], [x1, H.tierBase, 0], [x1, H.roof, 0], [x0, H.roof, 0], [0, 0, 1], [[x0 / 1.8, 0], [x1 / 1.8, 0], [x1 / 1.8, (H.roof - H.tierBase) / 1.8], [x0 / 1.8, (H.roof - H.tierBase) / 1.8]]); }
      // ---- the soffit at y = 18 between the glazing (d -1) and the tier wall (d 0), dark aluminium underside
      const soff = (sa, sb) => { if (sb - sa > 0.02) P.quad(M.aluUnder, [sa, H.sailTop, -1], [sb, H.sailTop, -1], [sb, H.sailTop, 0], [sa, H.sailTop, 0], [0, -1, 0]); };
      if (sp) { soff(Math.max(0, s0 - 0.42), sp[0]); soff(sp[1], Math.min(F.L, s1 + 0.42)); } else soff(Math.max(0, s0 - 0.42), Math.min(F.L, s1 + 0.42));
      // ---- the top band (the plain aluminium fascia over the third tier, y 27 .. 28.4, 0.6 m out) with its upper ledge and the concrete parapet upstand
      const band = (xa, xb) => {
        if (xb - xa < 0.02) return;
        const t0 = H.tierBase + H.tiers * H.tierPitch;
        P.quad(M.alu, [xa, t0, 0.6], [xb, t0, 0.6], [xb, H.roof, 0.6], [xa, H.roof, 0.6], [0, 0, 1], [[xa / 1.8, 0], [xb / 1.8, 0], [xb / 1.8, (H.roof - t0) / 1.8], [xa / 1.8, (H.roof - t0) / 1.8]]);
        P.quad(M.concreteLight, [xa, H.roof, 0.6], [xb, H.roof, 0.6], [xb, H.roof, 0.1], [xa, H.roof, 0.1], [0, 1, 0]);
        P.quad(M.concrete, [xa, H.roof, 0.1], [xb, H.roof, 0.1], [xb, H.parapet, 0.1], [xa, H.parapet, 0.1], [0, 0, 1], [[xa / 2, 0], [xb / 2, 0], [xb / 2, 0.15], [xa / 2, 0.15]]);
        P.quad(M.roofGrey, [xa, H.parapet, 0.1], [xb, H.parapet, 0.1], [xb, H.parapet, -0.2], [xa, H.parapet, -0.2], [0, 1, 0]);
        P.quad(M.concrete, [xb, H.roof, -0.2], [xa, H.roof, -0.2], [xa, H.parapet, -0.2], [xb, H.parapet, -0.2], [0, 0, -1]);                // the inner face of the upstand (seen from the roof)
      };
      if (sp) { band(0, sp[0]); band(sp[1], F.L); } else band(0, F.L);
      // ---- the big sails: smooth grid surfaces from y 18 (0.6 m out) to the arched bottom edge, leaning out 1.0 m more at the bottom
      for (const [sa, sb] of sailList(F)) {
        const Ls = sb - sa;
        const g = gridGeo(Math.max(4, Math.round(Ls / 1.4)), 5, (s, t) => {
          const x = sa + s * Ls, yb = H.claw + (H.sailApex - H.claw) * Math.pow(Math.sin(Math.PI * s), 0.55);
          const y = H.sailTop - t * (H.sailTop - yb), lean = 0.6 + 1.0 * Math.pow(t, 1.3) * (1 + 0.25 * Math.sin(Math.PI * s));
          return [x, y, lean];
        }, (s, t, p) => [p[0] / 1.8, p[1] / 1.8]);
        P.geo(M.aluSail, g); g.dispose();
        // the underside of the sail's top (a strip closing the gap to the glazing at y 18): none needed (the soffit above)
      }
      // ---- claw fins at the junctions (concrete, 0.8 m wide, from the deck up into the sail); the face ends carry one too
      const joints = new Set(); for (const [sa, sb] of sailList(F)) { joints.add(+sa.toFixed(3)); joints.add(+sb.toFixed(3)); }
      for (const sj of joints) {
        if (sj < 0.3 || sj > F.L - 0.3) continue;                                                   // the corner junction belongs to the neighbouring face's fin
        P.box(M.concrete, sj - 0.4, sj + 0.4, Y, H.claw + 3.2, -0.9, 0.9, 'b', 2);
      }
    } finally { P.pop(); }
  }
}

// ------------------------------------------------------------------------------------------------ the roof: membrane with the two atrium holes, the clock-tower / pylon bases are drawn by top.js
function roofDeck(K) {
  const P = K.P, M = K.M, Y = H.roof;
  // outline with the 1.0 m notches of the spine (NE v 0 -> 1.0 at u 34.4 .. 40.3, SW v 55.7 -> 54.7)
  const ring = [[2.9, 0], [SPINE.u0, 0], [SPINE.u0, 1.0], [SPINE.u1, 1.0], [SPINE.u1, 0], [98, 0], [100.9, 2.9], [100.9, 52.8], [98, 55.7], [SPINE.u1, 55.7], [SPINE.u1, 54.7], [SPINE.u0, 54.7], [SPINE.u0, 55.7], [2.9, 55.7], [0, 52.8], [0, 2.9]];
  const atria = [[[12.6, 17.8], [34.5, 17.8], [34.5, 40.3], [12.6, 40.3]], [[49.5, 17.9], [82.5, 17.9], [82.5, 40.2], [49.5, 40.2]]];
  P.cap(M.roofMem, ring, Y, true, 2, atria.map((a) => a.slice().reverse()));
  // the atrium wells: dark inner walls down to y 20 and a dark floor (nobody can see in; closes the holes under the glass lanterns)
  for (const a of atria) {
    const n = a.length;
    for (let i = 0; i < n; i++) { const p = a[i], q = a[(i + 1) % n], cx = (a[0][0] + a[2][0]) / 2, cz = (a[0][1] + a[2][1]) / 2; P.quad(M.glassDark, [p[0], 20, p[1]], [q[0], 20, q[1]], [q[0], Y, q[1]], [p[0], Y, p[1]], [cx - (p[0] + q[0]) / 2, 0, cz - (p[1] + q[1]) / 2]); }
    P.quad(M.glassDark, [a[0][0], 20, a[0][1]], [a[1][0], 20, a[1][1]], [a[2][0], 20, a[2][1]], [a[3][0], 20, a[3][1]], [0, 1, 0]);
  }
}

// ------------------------------------------------------------------------------------------------ hotel hood frames: 144 instances of one arched frame (0.6 m deep) per bay and tier
function hoods(K) {
  const M = K.M, ctx = K.ctx;
  const parts = partsGeos((P) => { P.geo(M.alu, archFrame(-2.95, 2.95, 0, 3.0, 2.5, 0.5, 2.1, 0.85, 0.6, 1.8)); });
  const mats = [];
  for (const F of FACES) {
    for (const bay of bayList(F)) {
      const sc = bay.pitch >= 5 ? Math.min(1, (bay.pitch - 0.4) / 5.9) : (bay.pitch - 0.4) / 5.9;                // chamfers are squeezed (4.1 m: opening 3.1 m)
      const sMid = (bay.s0 + bay.s1) / 2, p = at(F, sMid, 0), w = T.W(p[0], p[1]);
      for (let k = 0; k < H.tiers; k++) {
        const m = mat4(w.x, H.tierBase + k * H.tierPitch, w.z, T.rot + F.th, 1);
        m.multiply(new THREE.Matrix4().makeScale(sc / 1, 1, 1));
        mats.push(m);
      }
    }
  }
  const r = addInstanced(ctx, K.root, 'lmseate-hoods', parts, mats);
  K.extraTris += r.tris;
  K.svc.hoodCount = mats.length;
}

// ------------------------------------------------------------------------------------------------ colliders: thin walls on the baked outline (the terminal is port territory: exterior only and solid)
function colliders(K) {
  const ph = K.ctx.physics, ring = outlineWorld();
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    if (len < 0.05) continue;
    ph.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, len, 0.5, Math.atan2(-dz, dx), 0, H.parapet + 12);
  }
}
