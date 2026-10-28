// landmarksMakarova/lions.js - the LIONS PIER ("Спуск со львами", 1806-09, I. V. Roginsky; OSM r15853951 + the steps ways w1193456678 / 79 / 80; docs/research/makarova.md section 6; photos l02 l04 l05 l07 l09 crit_n01 crit_n02).
// Frame P (frame.js): origin = the middle of the stair head on the street edge line, u east, v toward the street, the river and the flights at -v; the pit is u -7.5..7.5 (the WATER_RINGS ring, groups.js), v -6.15..0.
//   * the stair: THREE flights of 17 treads (riser 0.1706, tread 0.3618: top y 0 at v = 0, the lowest tread -2.9 at v = -6.15, the summer water -3.4): a broad middle flight u -2.8..2.8, two narrow side flights
//     u 4.1..7.0 / -7.0..-4.1, split by two barriers of rectangular granite blocks 1.3 m wide (u 2.8..4.1) whose top descends in blocks every two treads from the lion pedestal (+1.15 m) to -2.1 m at the foot,
//     where each barrier ends in a pier with a diamond-point (four-sided pyramid) river face; massive cheek walls 0.5 m thick (u +-7.0..7.5, flush with the water ring) carry the quay level down to the water.
//   * two PEDESTALS (plinth step 0.3 + dado 0.7 + cap 0.15 = 1.15 m, bush-hammered pink-grey granite) at the heads of the barriers (u +-3.45, v -1.4) and the two LIONS lying on them (lionfig.js), muzzles toward the Malaya Neva,
//     heads turned ~12 degrees toward the axis of the stair.  The info plaque "Спуск со львами" on a post beside the east cheek.
//   * colliders: three stair runs (physics.addStairs), the barrier blocks, the pedestals, the cheek walls, a wall along the toe (nobody walks on the water).
// The pit is LAND in the generic ground: groups.js WATER_RINGS turn it into water (the quay opens at the ring); everything the player stands on is drawn here.
import * as L from '../layout.js';
import { FP, colliders } from './frame.js';
import { lyingLion } from './lionfig.js';
import { figureMats } from '../lib/figures.js';
import { knockBays } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7, docs/vo-m2.md): the cheek walls are breakable (ghost) bays; the old guard wall along the toe of the stair is gone (water is reachable)

const N = 17, RISE = 2.9 / N, TREAD = 6.15 / N, Y_LOW = -3.6;
const FLIGHTS = [[-2.8, 2.8], [4.1, 7.0], [-7.0, -4.1]];
const BARRIERS = [[2.8, 4.1], [-4.1, -2.8]];
const LION_V = -1.4, LION_U = 3.45, PED_V0 = -2.5;
const Y_PED = 1.15;
const yStep = (k) => -k * RISE;

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, CL = colliders(FP, ph);
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMakarova] lions/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  P.push(FP.x, 0, FP.z, FP.rot);
  try {
    stage('stair', () => stair(K));
    stage('barriers', () => barriers(K));
    stage('cheeks', () => cheeks(K));
    stage('board', () => board(K));
    stage('lions', () => lions(K));
    stage('posts', () => posts(K));
  } finally { P.pop(); }
  stage('colliders', () => colliders_(K, CL));
  // ---- services
  const e = FP.W(0, -3), c = FP.W(0, -1);
  K.svc.crowd.push({ x: -2851, z: -1441, r: 4, n: 4, kind: 'quay', name: 'Спуск со львами' });
  K.svc.photoSpots.push({ x: -2851.3, z: -1437.6, yaw: 0, name: 'Спуск со львами' });
  void e; void c; void L;
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the three flights (profile boxes: top + riser, solid below)
function stair(K) {
  const { P, M } = K;
  for (const [ua, ub] of FLIGHTS) {
    for (let k = 1; k <= N; k++) {
      const y = yStep(k), v1 = -(k - 1) * TREAD, v0 = -k * TREAD;
      // a solid profile box: top and the riser facing the river (-v); 1.6 m of granite per texture repeat
      P.box(M.gP, ua, ub, Y_LOW, y, v0, v1, 'flrb', 1.6);
    }
    // the riser of the top step (from the street edge down to the first tread) and the river face of the lowest tread
    P.box(M.gP, ua, ub, yStep(1), 0.035, 0, 0.15, 'flrb', 1.6);                                 // the sill stone: flush with the street edge
  }
}

// ------------------------------------------------------------------------------------------------ barriers, pedestals, diamond-point piers
function barriers(K) {
  const { P, M } = K;
  for (const [ua, ub] of BARRIERS) {
    const sgn = ua > 0 ? 1 : -1;
    // the body of the head: from the water level up to the street, the full 2.5 m of the pedestal block
    P.box(M.gP, ua, ub, Y_LOW, 0, PED_V0, 0.12, 'fkbt', 1.6);
    // pedestal: plinth step (0.3), dado (0.7), cap (0.15), the lion on top
    const uc = (ua + ub) / 2, hw = (ub - ua) / 2;
    P.box(M.gP, uc - hw - 0.1, uc + hw + 0.1, 0, 0.3, PED_V0 - 0.1, 0.12, '', 1.6);
    P.box(M.gP, uc - hw, uc + hw, 0.3, 1.0, PED_V0, 0.0, 'b', 1.6);
    P.box(M.gP, uc - hw - 0.08, uc + hw + 0.08, 1.0, Y_PED, PED_V0 - 0.08, 0.08, '', 1.6);
    // the stepped top: blocks every ~0.365 m descending from +0.825 (just after the pedestal) to -2.1 at the foot
    const nb = 10, bl = (6.15 + PED_V0) / nb;                                                    // PED_V0 is negative: the stretch from -2.5 to -6.15 = 3.65 m
    for (let j = 0; j < nb; j++) {
      const v1 = PED_V0 - bl * j, v0 = PED_V0 - bl * (j + 1), top = Y_PED - 0.325 * (j + 1);
      P.box(M.gP, ua, ub, Y_LOW, top, v0, v1, 'fb', 1.6);
    }
    // the diamond-point face of the pier at the river end: a four-sided pyramid (rise 0.35 m) on the block face
    const vf = -6.15, y0 = -3.4, y1 = -2.1, ym = (y0 + y1) / 2, um = uc, apex = [um, ym, vf - 0.35], inside = [um, ym, vf + 0.3];
    const c = [[ua, y0, vf], [ub, y0, vf], [ub, y1, vf], [ua, y1, vf]];
    for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; P.fan(M.gP, [a, b, apex], triNormal(a, b, apex, inside), (p) => [(p[0] + p[2]) / 1.6, p[1] / 1.6]); }
    P.quad(M.gP, [ua, Y_LOW, vf], [ub, Y_LOW, vf], [ub, y0, vf], [ua, y0, vf], [0, 0, -1], [[0, 0], [0.8, 0], [0.8, 0.2], [0, 0.2]]);
    void sgn;
  }
}
/** unit normal of the triangle a b c pointing away from the interior point `inside` */
function triNormal(a, b, c, inside) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  const g = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
  return (nx * (g[0] - inside[0]) + ny * (g[1] - inside[1]) + nz * (g[2] - inside[2]) < 0) ? [-nx, -ny, -nz] : [nx, ny, nz];
}

// ------------------------------------------------------------------------------------------------ cheek walls (flush with the water ring) with a coping
function cheeks(K) {
  const { P, M } = K;
  for (const s of [1, -1]) {
    const ua = s > 0 ? 7.0 : -7.5, ub = s > 0 ? 7.5 : -7.0;
    P.box(M.gP, ua, ub, Y_LOW, 0.035, -6.7, 0.1, '', 1.6);
    P.box(M.parapet, ua - 0.06, ub + 0.06, 0.035, 0.12, -6.7, 0.1, 'b', 2);                     // a thin coping stone
  }
}

// ------------------------------------------------------------------------------------------------ the information plaque on a post (OSM n10896438099)
function board(K) {
  const { P, M } = K;
  const u = 8.1, v = 0.5;
  P.box(M.iron, u - 0.03, u + 0.03, 0, 1.0, v - 0.03, v + 0.03, 'b', 1);
  P.box(M.iron, u - 0.27, u + 0.27, 1.0, 1.9, v - 0.025, v + 0.025, 'b', 1);
  P.quad(M.lionBoard, [u - 0.25, 1.03, v + 0.03], [u + 0.25, 1.03, v + 0.03], [u + 0.25, 1.87, v + 0.03], [u - 0.25, 1.87, v + 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}

// ------------------------------------------------------------------------------------------------ the lions
function lions(K) {
  const { ctx, P, M } = K;
  const fm = figureMats(ctx);
  const mats = { main: M.gP, dark: M.gShade };
  void fm;
  const E = lyingLion({ turn: 0.21, detail: 0.9 }), Wl = lyingLion({ turn: -0.21, detail: 0.9, tailSide: -1 });
  for (const [s, fig, id, name] of [[1, E, 'lions-pier-east', 'Лев (восточный) на спуске'], [-1, Wl, 'lions-pier-west', 'Лев (западный) на спуске']]) {
    const w = FP.W(s * LION_U, LION_V);
    // the figure faces +z: turn it to face -v (the river): rotation pi about y in the pier frame
    fig.place(P, mats, s * LION_U, Y_PED, LION_V + 0.0, Math.PI, 1.1);
    K.svc.monuments.push({ id, name, x: w.x, z: w.z, h: Y_PED + 0.85, r: 1.0 });
  }
  K.extraTris += 0;
}

// ------------------------------------------------------------------------------------------------ the two granite posts where the quay parapet ends at the pit (0.7 x 0.7 x 1.3 m, chamfered cap)
function posts(K) {
  const { P, M } = K;
  for (const s of [1, -1]) {
    const ua = s > 0 ? 7.55 : -8.25, ub = ua + 0.7, va = -6.95, vb = -6.25;
    P.box(M.parapet, ua, ub, 0, 1.18, va, vb, 'b', 2);
    P.box(M.gP, ua - 0.04, ub + 0.04, 1.18, 1.3, va - 0.04, vb + 0.04, 'b', 2);
  }
}

// ------------------------------------------------------------------------------------------------ colliders
function colliders_(K, CL) {
  const { ctx } = K, ph = ctx.physics;
  // the three stair runs (physics.addStairs: the run goes along local +z of the given rotation: descending toward -v = the pier frame turned by pi)
  for (const [ua, ub] of FLIGHTS) {
    const c = FP.W((ua + ub) / 2, -3.075);
    ph.addStairs(c.x, c.z, ub - ua - 0.05, 6.15, FP.rot + Math.PI, 0, -2.9, N);
  }
  // the head sill (flush with the street edge)
  CL.walk(0, 0.075, 14.0, 0.15, 0.035, -0.5);
  // barrier blocks, pedestals (granite structures: the stepped barrier is three blocks of 1.3 x 1.2 m, each as high as its highest step, no thin wall)
  for (const [ua, ub] of BARRIERS) {
    const uc = (ua + ub) / 2;
    CL.box(uc, (PED_V0 + 0.1) / 2, ub - ua + 0.2, 2.7, -4, Y_PED + 0.1);
    const nb = 3, bl = (6.15 + PED_V0) / nb;
    for (let j = 0; j < nb; j++) CL.box(uc, PED_V0 - bl * (j + 0.5), ub - ua, bl, -4, Y_PED - 0.325 * (Math.round(j * 10 / nb) + 1));
    CL.box(uc, -6.3, ub - ua, 0.4, -4, -2.1);
  }
  // the cheek walls (0.5 m of granite flush with the water ring, drawn only 0.12 m over the street): breakable ghost bays (the collider is higher than the drawn coping); the guard along the toe of the stair
  // ("nobody walks on the water") is gone: the walker steps off the last tread into the Neva
  const cheeks = [1, -1].map((s) => { const a = FP.W(s * 7.25, -3.3 + 3.45), b = FP.W(s * 7.25, -3.3 - 3.45); return { x0: a.x, z0: a.z, x1: b.x, z1: b.z, y: 0, ghost: true }; });
  knockBays(K.ctx, { name: 'lmMak-lions-cheeks', bays: cheeks, parts: [], far: 260, collider: { y0: -4, y1: 0.8, thick: 0.5, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: 4000, h: 0.8, anchored: 40, hitK: 0.7, minDv: 0 }) });
}
