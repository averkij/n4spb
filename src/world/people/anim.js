// people/anim.js - poses as PURE FUNCTIONS of (state, spec, t) and forward kinematics writing instance matrices (characters half).
// Angles in radians. Positive shoulder / hip angle swings the limb FORWARD (+Z of the figure), elbow / knee flex bends it (knee: shin goes backward, elbow: forearm forward).
//   * The walk phase is dist / stride, the hip amplitude A = asin(stride / (4 L)) and the hip angle a smoothed triangle wave (constant angular velocity during stance), so a
//     planted foot stays put on the ground at every speed; the pelvis height is SOLVED from the legs (the lowest ankle touches the floor), the feet are pitched flat in stance.
//   * Every pose function writes EVERY field of the pose (the Moscow head-flick lesson: the scratch pose is shared by all people).
//   * Seat / bike / scooter / pram poses use planar two-link IK (legs: knee forward; arms: elbow back) in the figure's own frame (rig units = metres of the 1.78 m reference).
import * as THREE from 'three';
import { H } from './rig.js';
import { clamp, lerp, smooth, TAU } from './kit.js';
import { GESTURE as G, MODE } from './contract.js';

// ------------------------------------------------------------------ vehicle geometry constants (world metres at vehicle scale 1; see items.js)
export const VEH = {
  bike: { wheelR: 0.34, wheelZ: [-0.5, 0.5], bb: [-0.05, 0.3], crank: 0.17, saddle: [-0.2, 0.97], grip: [0.33, 0.98, 0.29] },
  escooter: { wheelR: 0.12, wheelZ: [-0.33, 0.42], deck: [-0.3, 0.18, 0.16], grip: [0.3, 1.1, 0.24], stem: [[0, 0.16, 0.38], [0, 1.1, 0.3]] },
  kick: { wheelR: 0.07, wheelZ: [-0.28, 0.36], deck: [-0.25, 0.15, 0.1], grip: [0.3, 0.8, 0.17], stem: [[0, 0.1, 0.34], [0, 0.8, 0.3]] },
  balance: { wheelR: 0.14, wheelZ: [-0.3, 0.3], saddle: [-0.1, 0.4], grip: [0.24, 0.55, 0.12] },
  pram: { handle: [0.5, 0.98, 0.25] },
};

// ------------------------------------------------------------------ pose struct
export const FIELDS = ['hipY', 'hipZ', 'hipUp', 'lean', 'twist', 'roll', 'legAbd', 'hipL', 'hipR', 'kneeL', 'kneeR', 'fL', 'fR', 'shL', 'shR', 'abdL', 'abdR', 'elbL', 'elbR', 'hy', 'hp', 'hr', 'rootRoll'];
export function newPose() { const P = {}; for (const f of FIELDS) P[f] = 0; P.hipY = H.hip; return P; }
function clearPose(P) { for (const f of FIELDS) P[f] = 0; P.hipY = H.hip; return P; }
const mix = (P, A, B, k) => { for (let i = 0; i < FIELDS.length; i++) { const f = FIELDS[i]; P[f] = A[f] + (B[f] - A[f]) * k; } };
const sinf = (t, f, ph = 0) => Math.sin(TAU * (f * t + ph));

// ------------------------------------------------------------------ leg geometry
const SIN_K = 0.985, SIN_D = Math.asin(SIN_K);
const tri = (w) => Math.asin(SIN_K * Math.sin(w)) / SIN_D;                                 // smoothed triangle wave: constant angular velocity in stance and swing
/** height the ankle joint must keep above the floor for foot pitch f (toes up positive): heel / toe contact */
function need(f) {
  const c = Math.cos(f), s = Math.sin(f);
  if (f >= 0) return H.ankle * c + .068 * s;
  // As the heel rises the contact moves from the ball over the bevel to the toe.
  return Math.max(H.ankle * c - .119 * s, .087 * c - .178 * s, .081 * c - .20 * s);
}
/** vertical extent hip joint -> ankle joint of a leg with thigh angle th and knee flexion k (rig units) */
const ext = (th, k, legK) => (H.thigh * Math.cos(th) + H.shin * Math.cos(th - k)) * legK;
function footPitch(w) {
  const u = (((w - Math.PI / 2) % TAU) + TAU) % TAU;                                         // 0..pi stance (foot moving backward under the body), pi..2pi swing
  if (u < Math.PI) { const s = u / Math.PI; return 0.3 * (1 - smooth(0, 0.18, s)) - 0.55 * smooth(0.78, 1, s); }
  return -0.55 + 0.85 * smooth(0.1, 0.9, (u - Math.PI) / Math.PI);
}
/** pelvis height so that the lowest ankle (plus its heel / toe contact) touches the floor */
function solveHip(P, legK) {
  const a = ext(P.hipL, P.kneeL, legK) + need(P.fL), b = ext(P.hipR, P.kneeR, legK) + need(P.fR);
  P.hipY = Math.max(a, b);
}
/** planar IK of a two-link limb from the joint to a target; dz forward, dy DOWN (both from the joint). Returns the first-link angle from vertical (forward +) and the bend (>= 0). */
const _ik = { a: 0, b: 0 };
function ik(L1, L2, dz, dy, kneeForward) {
  let d = Math.hypot(dz, dy); d = clamp(d, Math.abs(L1 - L2) + 0.01, L1 + L2 - 0.004);
  const line = Math.atan2(dz, dy), c1 = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1), c2 = clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1);
  const delta = Math.acos(c1), bend = Math.PI - Math.acos(c2);
  _ik.a = kneeForward ? line + delta : line - delta; _ik.b = bend; return _ik;
}
/** set the leg `s` ('L' | 'R') to put the ankle at (tz, ty) in the hip frame (rig units, ty = ankle height above the floor in the figure's frame, hipY given) */
function legTo(P, s, hz, hy, tz, ty, legK, f = 0) {
  const r = ik(H.thigh * legK, H.shin * legK, tz - hz, hy - ty, true);
  P['hip' + s] = r.a; P['knee' + s] = r.b; P['f' + s] = f;
}
/** arm `s` to a hand target (tz, ty) given the shoulder position (sz, sy) in the hip frame; the torso lean is added to the shoulder angle */
function armTo(P, s, sz, sy, tz, ty, lean) {
  const r = ik(H.upper, H.fore + 0.03, tz - sz, sy - ty, false);
  P['sh' + s] = r.a + lean; P['elb' + s] = r.b;
}
const shoulderPos = (hipZ, hipY, lean, o) => { o[0] = hipZ + H.sh * Math.sin(lean); o[1] = hipY + H.sh * Math.cos(lean); return o; };
const _sp = [0, 0];

// ------------------------------------------------------------------ base poses
/** standing idle with weight shift, breathing and a slow look around */
export function idlePose(P, t, seed) {
  clearPose(P);
  const sh = sinf(t, 0.09, seed), br = sinf(t, 0.23, seed * 1.7);
  P.hipL = 0.04 + 0.03 * sh; P.hipR = -0.03 - 0.03 * sh; P.kneeL = 0.06 + 0.05 * Math.max(0, sh); P.kneeR = 0.06 + 0.05 * Math.max(0, -sh);
  P.roll = 0.035 * sh; P.twist = 0.05 * sinf(t, 0.05, seed * 2.3); P.lean = 0.02 + 0.012 * br;
  P.shL = 0.03 + 0.03 * br; P.shR = 0.03 - 0.03 * br; P.abdL = P.abdR = 0.08; P.elbL = P.elbR = 0.2; P.legAbd = 0.06;
  P.hy = 0.45 * sinf(t, 0.045, seed) * (0.6 + 0.4 * sinf(t, 0.11, seed * 3)); P.hp = 0.04 * br; P.hr = 0.03 * sh;
}
/** walking / jogging cycle; ph = cycle phase (cycles). A = hip amplitude */
export function walkPose(P, ph, A, legK, jog, armK = 1) {
  clearPose(P);
  const w = TAU * ph, K = jog ? 1.55 : 1.0, kb = jog ? 0.28 : 0.07;
  for (let i = 0; i < 2; i++) {
    const wi = i ? w + Math.PI : w, s = i ? 'R' : 'L';
    P['hip' + s] = A * tri(wi);
    P['knee' + s] = kb + K * Math.pow(Math.max(0, Math.cos(wi - 0.35)), 1.4);
    P['f' + s] = jog ? 0.15 * Math.sin(wi) - 0.25 : footPitch(wi);
  }
  const sn = Math.sin(w), aa = (jog ? 0.85 : 0.62) * A * armK;
  P.shL = -aa * sn; P.shR = aa * sn;
  P.elbL = (jog ? 1.35 : 0.22) + (jog ? 0 : 0.2 * Math.max(0, sn)); P.elbR = (jog ? 1.35 : 0.22) + (jog ? 0 : 0.2 * Math.max(0, -sn));
  P.abdL = P.abdR = jog ? 0.12 : 0.06; P.legAbd = 0.03;
  P.twist = (jog ? 0.16 : 0.07) * sn; P.lean = jog ? 0.15 : 0.035; P.roll = (jog ? 0.05 : 0.03) * sn;
  P.hipUp = jog ? 0.045 * Math.abs(Math.cos(w)) : 0;
}
const POSE_I = newPose(), POSE_W = newPose(), POSE_J = newPose(), POSE_X = newPose();

// ------------------------------------------------------------------ gestures (blend arms / head toward a target by weight k)
const raise = (t, seed, period, dur) => { const u = (((t + seed * 7.3) % period) + period) % period; return smooth(0, 0.5, u) * (1 - smooth(dur - 0.5, dur, u)); };     // 0..1 window of `dur` seconds every `period`
function gesture(P, g, k, t, p) {
  if (k <= 0.002) return;
  const m = (cur, tgt) => lerp(cur, tgt, k), sd = p.seed;
  switch (g) {
    case G.PHONE: P.shR = m(P.shR, 0.95); P.elbR = m(P.elbR, 1.75); P.abdR = m(P.abdR, 0.06); P.hp = m(P.hp, 0.42); P.shL = m(P.shL, 0.12); P.elbL = m(P.elbL, 0.5); P.lean = m(P.lean, 0.07); break;
    case G.CALL: P.shR = m(P.shR, 0.45); P.abdR = m(P.abdR, 0.12); P.elbR = m(P.elbR, 2.5); P.hr = m(P.hr, -0.12); P.hy = m(P.hy, 0.2 * sinf(t, 0.07, sd)); break;
    case G.TALK: {
      const s1 = sinf(t, 0.55, sd), s2 = sinf(t, 0.38, sd + 0.3);
      P.shR = m(P.shR, 0.5 + 0.28 * s1); P.abdR = m(P.abdR, 0.36); P.elbR = m(P.elbR, 1.75 + 0.45 * s2);
      P.shL = m(P.shL, 0.3 + 0.2 * s2); P.abdL = m(P.abdL, 0.2); P.elbL = m(P.elbL, 1.3 + 0.3 * s1);
      P.hy = m(P.hy, 0.22 * sinf(t, 0.23, sd)); P.hp = m(P.hp, 0.05 * s1); P.hr = m(P.hr, 0.08 * s2); break;
    }
    case G.PHOTO: P.shL = m(P.shL, 1.42); P.shR = m(P.shR, 1.42); P.elbL = m(P.elbL, 0.95); P.elbR = m(P.elbR, 0.95); P.abdL = m(P.abdL, 0.1); P.abdR = m(P.abdR, 0.1); P.hp = m(P.hp, -0.02); P.hy = m(P.hy, 0); P.lean = m(P.lean, -0.02); break;
    case G.SELFIE: P.shR = m(P.shR, 1.2); P.elbR = m(P.elbR, 0.35); P.abdR = m(P.abdR, 0.3); P.shL = m(P.shL, 0.2); P.hy = m(P.hy, -0.18); P.hr = m(P.hr, -0.1); P.hp = m(P.hp, -0.04); break;
    case G.SMOKE: { const r = raise(t, sd, 6.5, 2.4); P.shR = m(P.shR, lerp(0.35, 0.8, r)); P.elbR = m(P.elbR, lerp(1.1, 2.3, r)); P.abdR = m(P.abdR, 0.08); P.hp = m(P.hp, 0.05 * r); break; }
    case G.EAT: { const r = raise(t, sd, 5.5, 2.0); P.shR = m(P.shR, lerp(0.5, 0.75, r)); P.elbR = m(P.elbR, lerp(1.3, 2.2, r)); P.abdR = m(P.abdR, 0.1); P.hp = m(P.hp, 0.06 * r); break; }
    case G.POINT: P.shR = m(P.shR, 1.5); P.abdR = m(P.abdR, 0.28); P.elbR = m(P.elbR, 0.12); P.hy = m(P.hy, -0.3); break;
    case G.WAVE: P.shR = m(P.shR, 2.5); P.abdR = m(P.abdR, 0.5); P.elbR = m(P.elbR, 0.55 + 0.45 * sinf(t, 2.2, sd)); P.hr = m(P.hr, 0.08); break;
    case G.SPLASH: P.shL = m(P.shL, 2.3 + 0.2 * sinf(t, 1.6, sd)); P.shR = m(P.shR, 2.3 - 0.2 * sinf(t, 1.6, sd)); P.abdL = m(P.abdL, 0.75); P.abdR = m(P.abdR, 0.75); P.elbL = m(P.elbL, 0.35); P.elbR = m(P.elbR, 0.35); P.hp = m(P.hp, -0.12); break;
    case G.PLAY: { const s1 = sinf(t, 2.1, sd), s2 = sinf(t, 0.7, sd + 0.2); P.shR = m(P.shR, 0.5 + 0.1 * s1); P.abdR = m(P.abdR, 0.14); P.elbR = m(P.elbR, 1.15 + 0.12 * s1); P.shL = m(P.shL, 0.95); P.abdL = m(P.abdL, 0.12); P.elbL = m(P.elbL, 0.75 + 0.1 * s2); P.hp = m(P.hp, 0.12); P.hy = m(P.hy, 0.3 * sinf(t, 0.09, sd)); P.roll = m(P.roll, 0.05 * s2); break; }
    case G.PAINT: { const s1 = sinf(t, 0.9, sd), s2 = sinf(t, 0.31, sd + 0.4); P.shR = m(P.shR, 1.2 + 0.12 * s1); P.abdR = m(P.abdR, 0.18); P.elbR = m(P.elbR, 0.55 + 0.25 * s1); P.shL = m(P.shL, 0.75); P.abdL = m(P.abdL, 0.2); P.elbL = m(P.elbL, 1.35); P.hp = m(P.hp, 0.04 + 0.06 * s2); P.hy = m(P.hy, 0.25 * Math.sign(s2) * Math.min(1, Math.abs(s2) * 3)); break; }
    case G.SWEEP: { const s1 = sinf(t, 0.7, sd); P.shL = m(P.shL, 0.62 + 0.2 * s1); P.shR = m(P.shR, 0.82 + 0.2 * s1); P.abdL = m(P.abdL, 0.1); P.abdR = m(P.abdR, 0.12); P.elbL = m(P.elbL, 0.45); P.elbR = m(P.elbR, 0.4); P.lean = m(P.lean, 0.2); P.hp = m(P.hp, 0.12); P.twist = m(P.twist, 0.22 * s1); break; }
    case G.GUIDE: { const s2 = sinf(t, 0.33, sd), s3 = sinf(t, 0.12, sd + 0.5); P.shR = m(P.shR, 2.3); P.abdR = m(P.abdR, 0.16); P.elbR = m(P.elbR, 0.25); P.shL = m(P.shL, 0.55 + 0.3 * s2); P.abdL = m(P.abdL, 0.28); P.elbL = m(P.elbL, 1.55 + 0.3 * s2); P.hy = m(P.hy, 0.5 * s3); P.hp = m(P.hp, -0.05); break; }
    case G.POSE: P.shR = m(P.shR, 0.15); P.abdR = m(P.abdR, 0.62); P.elbR = m(P.elbR, 1.75); P.shL = m(P.shL, 0.15); P.abdL = m(P.abdL, 0.62); P.elbL = m(P.elbL, 1.75); P.hr = m(P.hr, 0.07); P.hy = m(P.hy, 0.1); break;
    case G.WATCH: { const r = raise(t, sd, 9, 3); P.shL = m(P.shL, lerp(0.05, 0.62, r)); P.elbL = m(P.elbL, lerp(0.2, 2.0, r)); P.abdL = m(P.abdL, lerp(0.08, 0.02, r)); P.hp = m(P.hp, 0.18 * r); break; }
    case G.LOOKAROUND: P.hy = m(P.hy, 0.85 * sinf(t, 0.16, sd) * (0.5 + 0.5 * sinf(t, 0.31, sd))); P.hp = m(P.hp, -0.04 + 0.05 * sinf(t, 0.2, sd)); break;
    default: break;
  }
}

// ------------------------------------------------------------------ seated
/** seated on a bench / rim; seatRig = seat surface height in rig units (m / scale); style: 0 feet forward, 1 feet tucked back, 2 one foot back, 3 elbows on knees */
function sitPose(P, t, p, seatRig) {
  clearPose(P);
  const sd = p.seed, st = p.sitStyle, legK = p.legK;
  let th = 1.40 + 0.06 * Math.sin(sd * 3.1);
  const hipY = seatRig + 0.1, Tl = H.thigh * legK, Sl = H.shin * legK;
  let val = (hipY - need(0) - Tl * Math.cos(th)) / Sl;
  if (val >= 1) { th = Math.acos(clamp((hipY - need(0) - Sl) / Tl, 0.62, 1)); val = (hipY - need(0) - Tl * Math.cos(th)) / Sl; }          // short legs on a high seat: the thighs slope down to reach the floor
  const delta = val >= 1 ? 0 : Math.acos(clamp(val, -1, 1));
  P.hipY = hipY; P.hipL = P.hipR = th;
  P.kneeL = th - delta * (st === 1 ? -1 : 1); P.kneeR = th - delta * (st === 1 || st === 2 ? -1 : 1);
  P.fL = P.fR = 0; P.legAbd = 0.05 + p.kneeSpread;
  P.lean = (st === 3 ? 0.38 : -0.04 + 0.05 * Math.sin(sd * 1.7)) + 0.025 * sinf(t, 0.04, sd); P.twist = 0.06 * sinf(t, 0.05, sd * 2);
  if (st === 3) { P.shL = P.shR = 0.65; P.elbL = P.elbR = 1.3; P.abdL = P.abdR = 0.12; } else { P.shL = P.shR = 0.45; P.elbL = P.elbR = 1.05; P.abdL = P.abdR = 0.1; }
  P.hy = 0.55 * sinf(t, 0.04, sd) * (0.5 + 0.5 * sinf(t, 0.1, sd)); P.hp = 0.03 + (st === 3 ? -0.3 : 0); P.hr = 0.03 * sinf(t, 0.07, sd);
}

// ------------------------------------------------------------------ vehicles and pram
/** ground-contact foot path for a push / pedal-less stride: u in 0..1; contact for u < c (the foot moves back relative to the vehicle by `sweep`), then a lifted swing forward */
function footPath(u, z0, sweep, c, lift, out) {
  if (u < c) { out[0] = z0 - sweep * (u / c); out[1] = 0; }
  else { const s = (u - c) / (1 - c); out[0] = z0 - sweep + sweep * smooth(0, 1, s); out[1] = lift * Math.sin(Math.PI * smooth(0, 1, s)); }
}
const _fp = [0, 0];
function bikePose(P, st, p, t) {
  clearPose(P);
  const V = VEH.bike, k = p.vs / p.sc, sp = p.spdS, ph = st.dist * TAU / 2.3;
  const hz = V.saddle[0] * k, hy = V.saddle[1] * k + 0.07;
  P.hipY = hy; P.hipZ = hz;
  for (let i = 0; i < 2; i++) {
    const a = ph + (i ? Math.PI : 0), s = i ? 'R' : 'L';
    const pz = (V.bb[0] + V.crank * Math.cos(a)) * k, py = (V.bb[1] + V.crank * Math.sin(a)) * k;
    legTo(P, s, hz, hy, pz - 0.09, py + H.ankle + 0.015, p.legK, -0.1 * Math.sin(a));
  }
  P.legAbd = 0.05;
  const lean = 0.2 + 0.35 * smooth(0, 1.5, sp); P.lean = lean; P.hp = -0.25 * smooth(0, 1.5, sp);
  shoulderPos(hz, hy, lean, _sp);
  for (const s of ['L', 'R']) armTo(P, s, _sp[0], _sp[1], V.grip[0] * k, V.grip[1] * k, lean);
  P.abdL = P.abdR = 0.12; P.hy = 0.1 * sinf(t, 0.25, p.seed);
  P.rootRoll = -clamp(sp * st.turn / 9.8 * 0.9, -0.4, 0.4); P.roll = 0;
  P.twist = 0.04 * Math.sin(ph);
}
function scooterPose(P, st, p, t, V, kick) {
  clearPose(P);
  const k = p.vs / p.sc, sp = p.spdS, hipZ = -0.1 * k;
  const deckTop = V.deck[2] * k, aY = deckTop + H.ankle, wide = 0.04;
  if (!kick) {
    const lead = p.fem ? 1 : -1;                                                 // which foot leads (L = +x side)
    const hy = aY + 0.93 * (H.thigh + H.shin) * p.legK;
    P.hipY = hy; P.hipZ = hipZ;
    legTo(P, lead > 0 ? 'L' : 'R', hipZ, hy, 0.06 * k + 0.05, aY, p.legK); legTo(P, lead > 0 ? 'R' : 'L', hipZ, hy, -0.2 * k - 0.05, aY, p.legK);
    P.legAbd = wide;
    P.twist = 0.0; P.lean = 0.1 + 0.08 * smooth(0, 3, sp);
  } else {
    // child kick scooter: the right foot stays on the deck, the left pushes off the ground every ~2.2 m while moving, otherwise both feet on the deck
    const u = (((st.dist / 2.2) % 1) + 1) % 1, moving = smooth(0.25, 0.9, sp);
    footPath(clamp((u - 0.06) / 0.94, 0, 1), -0.15, (0.94 * 0.26 * 2.2) / p.sc, 0.26, 0.12, _fp);
    const hy = aY + 0.9 * (H.thigh + H.shin) * p.legK;
    P.hipY = hy; P.hipZ = hipZ;
    legTo(P, 'R', hipZ, hy, 0.03 * k, aY, p.legK);
    const deckRearZ = -0.16 * k, deckY = aY;
    const pushZ = lerp(deckRearZ, _fp[0], moving), pushY = lerp(deckY, H.ankle + _fp[1], moving);
    legTo(P, 'L', hipZ, hy, pushZ, pushY, p.legK, moving * (-0.35 * smooth(0, 1, _fp[1] / 0.12)));
    P.legAbd = wide; P.lean = 0.1 + 0.1 * moving * (1 - u);
    P.twist = 0.1 * moving;
  }
  shoulderPos(hipZ, P.hipY, P.lean, _sp);
  for (const s of ['L', 'R']) armTo(P, s, _sp[0], _sp[1], V.grip[0] * k, V.grip[1] * k, P.lean);
  P.abdL = P.abdR = 0.1; P.hy = 0.1 * sinf(t, 0.2, p.seed); P.hp = -0.08;
  P.rootRoll = -clamp(sp * st.turn / 9.8 * 0.8, -0.35, 0.35);
}
function balancePose(P, st, p, t) {
  clearPose(P);
  const V = VEH.balance, k = p.vs / p.sc, sp = p.spdS;
  const hz = V.saddle[0] * k, hy = V.saddle[1] * k + 0.08;
  P.hipY = hy; P.hipZ = hz; P.legAbd = 0.08;
  const ph = st.dist / 0.8;
  for (let i = 0; i < 2; i++) {
    const u = (((ph + i * 0.5) % 1) + 1) % 1, moving = smooth(0.2, 0.7, sp);
    footPath(u, 0.1 * k, 0.4 / p.sc, 0.5, 0.07 * k, _fp);
    legTo(P, i ? 'R' : 'L', hz, hy, lerp(0.12 * k, _fp[0], moving), H.ankle + lerp(0, _fp[1], moving), p.legK);
  }
  P.lean = 0.2; shoulderPos(hz, hy, P.lean, _sp);
  for (const s of ['L', 'R']) armTo(P, s, _sp[0], _sp[1], V.grip[0] * k, V.grip[1] * k, P.lean);
  P.abdL = P.abdR = 0.12; P.hy = 0.12 * sinf(t, 0.3, p.seed); P.hp = -0.1;
  P.rootRoll = -clamp(sp * st.turn / 9.8 * 0.8, -0.3, 0.3);
}
/** pushing a pram: both hands on the handle */
function pramArms(P, p, lean) {
  const V = VEH.pram.handle;
  shoulderPos(0, P.hipY, lean, _sp);
  for (const s of ['L', 'R']) armTo(P, s, _sp[0], _sp[1], V[0] / p.sc, V[1] / p.sc, lean);
  P.abdL = P.abdR = 0.1;
}

// ------------------------------------------------------------------ the person
const _look = { v: 0 };
/** compute the full pose for person p in state st at time t into P (every field written). Returns P. */
export function posePerson(P, p, st, t) {
  const sp = p.spdS;
  if (st.mode === MODE.SIT) {
    sitPose(P, t, p, st.seatH / p.sc);
  } else if (st.mode === MODE.RIDE && p.vehicle) {
    const V = p.vehicle;
    if (V === 'bike') bikePose(P, st, p, t); else if (V === 'escooter') scooterPose(P, st, p, t, VEH.escooter, false);
    else if (V === 'kick') scooterPose(P, st, p, t, VEH.kick, true); else balancePose(P, st, p, t);
  } else {
    const vw = smooth(0.1, 0.55, sp), jw = smooth(1.9, 2.5, sp);
    if (vw >= 0.999 && jw <= 0.001) walkPose(P, st.dist / p.strideW, p.A, p.legK, false, p.armK);                     // steady walking: no blending
    else if (vw <= 0.001) idlePose(P, t, p.seed);                                                                     // standing
    else {
      idlePose(POSE_I, t, p.seed); walkPose(POSE_W, st.dist / p.strideW, p.A, p.legK, false, p.armK); mix(POSE_X, POSE_I, POSE_W, vw);
      if (jw > 0.001) { walkPose(POSE_J, st.dist / p.strideJ, p.AJ, p.legK, true); mix(P, POSE_X, POSE_J, jw); } else mix(P, POSE_X, POSE_X, 0);
    }
    solveHip(P, p.legK); P.hipY += P.hipUp;
    // carrying poses: pram / leash override the arms
    if (p.pram) { P.lean += 0.05; pramArms(P, p, P.lean); }
    else if (p.dog) { P.shL = lerp(P.shL, 0.5, 0.85); P.elbL = lerp(P.elbL, 0.45, 0.85); P.abdL = lerp(P.abdL, 0.14, 0.85); }
    else if (p.pull) { P.shL = lerp(P.shL, 0.3, 0.9); P.abdL = lerp(P.abdL, 0.08, 0.9); P.elbL = lerp(P.elbL, 0.3, 0.9); }
    else if (p.carry === 'hand') { P.shL = lerp(P.shL, 0.1, 0.6); P.abdL = lerp(P.abdL, 0.06, 0.6); P.elbL = lerp(P.elbL, 0.2, 0.6); }
  }
  // gestures: the fading previous one, then the current
  if (p.gB.k > 0.002) gesture(P, p.gB.g, p.gB.k, t, p);
  if (p.gA.k > 0.002) gesture(P, p.gA.g, p.gA.k, t, p);
  // splash: little jumps with straight legs, a squat on landing (feet stay on the floor / above it)
  if (p.gA.g === G.SPLASH && p.gA.k > 0.01 && st.mode === MODE.WALK) {
    const u = Math.sin(TAU * (1.7 * t + p.seed * 0.37)), jump = Math.max(0, u) * 0.16 * p.gA.k, squat = Math.max(0, -u) * 0.05 * p.gA.k;
    if (squat > 0.001) { const hy = P.hipY - squat; const val = clamp((hy - need(0) - H.thigh * p.legK * Math.cos(0.25)) / (H.shin * p.legK), -1, 1); const k2 = 0.25 - Math.acos(val); P.hipL = P.hipR = 0.25; P.kneeL = P.kneeR = Math.max(0.05, k2); P.fL = P.fR = 0; P.hipY = hy; }
    else { P.hipY += jump; P.kneeL = P.kneeR = 0.12; P.hipL = P.hipR = 0.06; }
  }
  // head look (glance toward the camera / traffic / partner), smoothed per person by the caller
  P.hy += clamp(p.lookS, -1.2, 1.2) * p.lookKS;
  return P;
}

// ------------------------------------------------------------------ forward kinematics -> instance matrices
const _root = new THREE.Matrix4(), _hip = new THREE.Matrix4(), _tor = new THREE.Matrix4(), _a = new THREE.Matrix4(), _b = new THREE.Matrix4(), _c = new THREE.Matrix4(), _d = new THREE.Matrix4(), _f = new THREE.Matrix4();
const _rx = new THREE.Matrix4(), _ry = new THREE.Matrix4(), _rz = new THREE.Matrix4(), _tr = new THREE.Matrix4(), _sc = new THREE.Matrix4(), _v = new THREE.Vector3();
const RX = (a) => _rx.makeRotationX(a), RY = (a) => _ry.makeRotationY(a), RZ = (a) => _rz.makeRotationZ(a), T = (x, y, z) => _tr.makeTranslation(x, y, z);
export const HIDE = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -500, 0, 1]);

/** write the part matrices of one person. slots = { torso, head, uaL, uaR, faL, faR, thL, thR, shL, shR, ftL, ftR } each {arr, off}; out collects the matrices that items attach to:
 *  out.root (world placement without the body scale), out.tor, out.handL / handR (wrist, y down along the forearm), out.head */
export function writeFigure(p, P, st, S, out) {
  const sc = p.sc, wid = p.wid, legK = p.legK;
  _root.makeRotationY(st.yaw); if (P.rootRoll) _root.multiply(RZ(P.rootRoll));
  _root.setPosition(st.x, st.y, st.z);
  if (out) out.root.copy(_root);
  _root.multiply(_sc.makeScale(sc * wid, sc, sc * wid));
  _hip.multiplyMatrices(_root, T(0, P.hipY, P.hipZ)); _hip.multiply(RZ(P.roll));
  _tor.multiplyMatrices(_hip, RY(P.twist)); _tor.multiply(RX(P.lean));
  const put = (s, m) => { if (s) m.toArray(s.arr, s.off); };
  put(S.torso, _tor); if (out) out.tor.copy(_tor);
  _a.multiplyMatrices(_tor, T(0, H.neck, 0)); _a.multiply(RY(P.hy)); _a.multiply(RX(P.hp)); _a.multiply(RZ(P.hr));
  if (out) out.head.copy(_a);
  if (p.headK !== 1) _a.multiply(_sc.makeScale(p.headK, p.headK, p.headK));
  put(S.head, _a);
  for (let i = 0; i < 2; i++) {
    const sd = i ? -1 : 1, ua = i ? S.uaR : S.uaL, fa = i ? S.faR : S.faL, th = i ? S.thR : S.thL, sh = i ? S.shR : S.shL, ft = i ? S.ftR : S.ftL;
    const abd = i ? P.abdR : P.abdL, shA = i ? P.shR : P.shL, elb = i ? P.elbR : P.elbL, hip = i ? P.hipR : P.hipL, knee = i ? P.kneeR : P.kneeL, fp = i ? P.fR : P.fL;
    _a.multiplyMatrices(_tor, T(sd * H.shX, H.sh, 0)); _a.multiply(RZ(sd * abd)); _a.multiply(RX(-shA)); put(ua, _a);
    _b.multiplyMatrices(_a, T(0, -H.upper, 0)); _b.multiply(RX(-elb)); put(fa, _b);
    if (out) { const h = i ? out.handR : out.handL; h.multiplyMatrices(_b, T(0, -H.fore - 0.03, 0)); }
    _c.multiplyMatrices(_hip, T(sd * 0.09, 0, 0)); _c.multiply(RZ(sd * P.legAbd)); _c.multiply(RX(-hip));
    if (legK !== 1) { _f.copy(_c).multiply(_sc.makeScale(1, legK, 1)); put(th, _f); } else put(th, _c);
    _d.multiplyMatrices(_c, T(0, -H.thigh * legK, 0)); _d.multiply(RX(knee));
    if (legK !== 1) { _f.copy(_d).multiply(_sc.makeScale(1, legK, 1)); put(sh, _f); } else put(sh, _d);
    _d.multiply(T(0, -H.shin * legK, 0)); _d.multiply(RX((hip - knee) - fp)); put(ft, _d);
  }
}
export { clamp, smooth, lerp };
