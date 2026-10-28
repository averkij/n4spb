// wildlife/ducks.js - mallards on the canals (July: drakes in eclipse plumage are not modelled, hens lead broods of ducklings). Six groups swim slow back-and-forth lanes along the
// quay walls of the Fontanka, the Moika, the Griboedov Canal, the Winter Canal and the Swan Canal: a LANE is a stretch of a bank line (environment/waterways.js bank chains: the water
// on the left of travel) offset 3.8-4.6 m into the water, 36-64 m long, validated sample by sample (every 2.5 m): in the water with 2.5 m of free water beyond it, inside the play area,
// never nearer than 3.6 m to a boat hull at any time of the boats' lap (boats.js: the hulls of every boat, spatial hash), 16.5 m of a landing stage, 12 m + half the deck width of a bridge
// or 7 m of a descent. The groups FOLLOW THE PLAYER like the birds: every 2 s a group whose lane is farther than 230 m moves to a free lane 60-190 m away (out of the view cone when it is
// closer than 170 m). Everything is a PURE FUNCTION of t inside a lane: s(t) = span (1 - cos(w t + phi)) / 2 along the lane, the heading follows the direction of travel and turns through the
// side while the group nearly stops at the end of its lane; members hold a small formation (pair / hen with 4-6 ducklings / trio) with their own bobbing and slow dabbling (head down, tail
// up). Instanced (drake / hen bodies, heads, folded wings), a pale wake ellipse under each (decal, no outline). ~23 ducks, ~8 k triangles.
// PONDS (T4b of the Tauride remake, docs/AREAS.md 9.1 HOOKS.duckPonds): an area may name ponds of a landmark module: their shore lines give lanes exactly like the bank chains (the water on the left of travel, offset into
// the water, every sample asked env.waterAt and kept `margin` m off every shore by the hook's exact shore distance, 2.5 m of free water beyond, no bridge deck near), key 'pond', at the ponds' own water level (lane.y).
// The strip exports no such hook: its lanes are the waterway lanes as before.
import * as THREE from 'three';
import { birdModel, shadowGeometry } from './models.js';
import { instanced } from './geom.js';
import { collectBoats, hullBoxes, makeHullIndex } from './boats.js';
import { allBanks } from '../environment/waterways.js';
import { HOOKS } from '../lib/area-tables.js';
import { NO_THREAT } from './threat.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sm = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const LANE_KEYS = new Set(['fontanka', 'moika', 'griboedov', 'winter-canal', 'swan-canal']);
const STEP = 2.5;

export function buildDucks(ctx, W, say, opts = {}) {
  const T = THREE, rng = ctx.rng('wildlife-ducks'), L = ctx.L, WATER = L.RIVER_Y.water;
  const threat = opts.threat || NO_THREAT;      // the vehicle the player drives (threat.js): a group it comes at takes off
  const qn = ctx.quality?.level || ctx.quality?.name, Q = qn === 'low' ? 0.5 : qn === 'medium' ? 0.75 : 1;
  const group = new T.Group(); group.name = 'wildlife-ducks';
  const out = { group, ducks: [], groups: [], lanes: [], update() {}, triangles: 0, flushes: 0 };
  const matSolid = ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0, name: 'wl-duck' });
  const matWing = ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0, name: 'wl-duck-wing', side: 'double' });
  const matWake = ctx.mat.decal('#e8f0f4', { transparent: true, opacity: 0.34, name: 'wl-wake' });
  const start = (() => { const p = W.player; return (p.x || p.z) && L.inPlay(p.x, p.z) ? { x: p.x, z: p.z } : { x: L.HERO.x, z: L.HERO.z }; })();

  // ---- obstacles: boats (every hull of every lap), landing stages, bridge decks, descents ----------------------------------------
  const boats = collectBoats(ctx, L);
  const hullGap = makeHullIndex(hullBoxes(boats, 480, 2.5));
  out.hullGap = hullGap;
  const S = ctx.services, env = S.environment;
  const piers = [...(env?.piers || []).map((p) => ({ x: p.x, z: p.z, r: p.len / 2 + 9 })), ...(S.landmarksC?.piers || []).map((p) => ({ x: p.x, z: p.z, r: 16.5 }))];
  const decks = [...(env?.quay?.bridges || []).map((z) => ({ x: z.c[0], z: z.c[1], r: (z.w || 12) / 2 + 12 }))];
  const bd = S.landmarksC?.bridge?.deck; if (bd) decks.push({ x: bd.x, z: bd.z, r: 50 });
  const stairs = (env?.quay?.allStairs || []).map((s) => ({ x: s.x, z: s.z, r: 7 }));
  const ponds = typeof HOOKS.duckPonds === 'function' ? HOOKS.duckPonds() : null;       // T4b: the ponds of the area's landmark module (null for the strip: nothing below runs for it)
  if (ponds) for (const k of ponds.keepOut || []) decks.push({ x: k.x, z: k.z, r: k.r });   // no lane under a garden bridge deck or the dam
  // the obstacles go into a 40 m hash (an obstacle is entered into every cell its circle's box touches): every lane sample used to be tested against all piers, decks and stairs of the map (~150 ms)
  const OC = 40, ogrid = new Map(), okey = (i, j) => i * 40009 + j;
  for (const o of [...piers, ...decks, ...stairs]) {
    const i0 = Math.floor((o.x - o.r) / OC), i1 = Math.floor((o.x + o.r) / OC), j0 = Math.floor((o.z - o.r) / OC), j1 = Math.floor((o.z + o.r) / OC);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = okey(i, j); (ogrid.get(k) || ogrid.set(k, []).get(k)).push(o); }
  }
  const blocked = (x, z) => { const a = ogrid.get(okey(Math.floor(x / OC), Math.floor(z / OC))); if (a) for (const o of a) if (Math.hypot(o.x - x, o.z - z) < o.r) return true; return false; };

  // ---- lanes ------------------------------------------------------------------------------------------------------------------
  /** the points of a bank chain every STEP metres: { x, z, tx, tz, wx, wz } (wx, wz = the unit normal into the water) */
  function resample(pts) {
    const o = []; let nextAt = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 1e-6) continue;
      const tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len;
      while (nextAt < len) { o.push({ x: a[0] + tx * nextAt, z: a[1] + tz * nextAt, tx, tz, wx: -tz, wz: tx }); nextAt += STEP; }
      nextAt -= len;
    }
    return o;
  }
  const lanes = [];
  for (const bank of allBanks()) {
    if (!LANE_KEYS.has(bank.key) || bank.far || bank.len < 60) continue;
    const P = resample(bank.pts);
    const d0 = bank.key === 'fontanka' ? 4.6 : 3.9;
    for (let i0 = Math.floor(rng.range(6, 22)); i0 + 20 < P.length; i0 += Math.floor(rng.range(26, 38))) {
      const n = Math.min(P.length - i0, Math.floor(rng.range(15, 26))), xs = [], zs = [], tx = [], tz = [];
      let good = n >= 15;
      for (let k = 0; k < n && good; k++) {
        const p = P[i0 + k], d = d0 + 0.4 * Math.sin(k * 0.5);
        const x = p.x + p.wx * d, z = p.z + p.wz * d;
        if (!L.inPlay(x, z, 6) || !L.inRiver(x, z) || !L.inRiver(p.x + p.wx * (d + 2.5), p.z + p.wz * (d + 2.5)) || !L.inRiver(x + p.tx * 2, z + p.tz * 2)) { good = false; break; }
        if (hullGap(x, z) < 3.6 || blocked(x, z)) { good = false; break; }
        xs.push(x); zs.push(z); tx.push(p.tx); tz.push(p.tz);
      }
      if (!good) continue;
      const mid = (xs.length >> 1);
      lanes.push({ id: lanes.length, key: bank.key, n: xs.length, span: (xs.length - 1) * STEP, xs, zs, tx, tz, cx: xs[mid], cz: zs[mid], taken: null, bank: bank.id });
    }
  }
  // T4b: the pond lanes (HOOKS.duckPonds): the same lane rule on the shore rings of the ponds; a sample must be water for the field (env.waterAt) AND at least `margin` m off every shore by the hook's exact distance
  if (ponds) {
    const wet = (x, z) => !!(env && env.waterAt && env.waterAt(x, z)) && ponds.shoreDist(x, z) <= -ponds.margin;
    (ponds.rings || []).forEach((ring, ri) => {
      let len = 0; for (let i = 0; i + 1 < ring.length; i++) len += Math.hypot(ring[i + 1][0] - ring[i][0], ring[i + 1][1] - ring[i][1]);
      if (len < 60) return;
      const P = resample(ring), d0 = ponds.offset;
      for (let i0 = Math.floor(rng.range(6, 22)); i0 + 20 < P.length; i0 += Math.floor(rng.range(26, 38))) {
        const n = Math.min(P.length - i0, Math.floor(rng.range(15, 26))), xs = [], zs = [], tx = [], tz = [];
        let good = n >= 15;
        for (let k = 0; k < n && good; k++) {
          const p = P[i0 + k], d = d0 + 0.4 * Math.sin(k * 0.5);
          const x = p.x + p.wx * d, z = p.z + p.wz * d;
          if (!L.inPlay(x, z, 6) || !wet(x, z) || !wet(p.x + p.wx * (d + 2.5), p.z + p.wz * (d + 2.5)) || !wet(x + p.tx * 2, z + p.tz * 2)) { good = false; break; }
          if (hullGap(x, z) < 3.6 || blocked(x, z)) { good = false; break; }
          xs.push(x); zs.push(z); tx.push(p.tx); tz.push(p.tz);
        }
        if (!good) continue;
        const mid = (xs.length >> 1);
        lanes.push({ id: lanes.length, key: 'pond', y: ponds.y, n: xs.length, span: (xs.length - 1) * STEP, xs, zs, tx, tz, cx: xs[mid], cz: zs[mid], taken: null, bank: 'pond-' + ri });
      }
    });
  }
  out.lanes = lanes;
  const near = (a, b) => Math.hypot(a.cx - b.cx, a.cz - b.cz) < (a.span + b.span) / 2 + 14;
  const free = (lane, g) => { if (lane.taken && lane.taken !== g) return false; for (const o of groups) if (o !== g && o.lane && near(o.lane, lane)) return false; return true; };
  const laneAt = (lane, u) => {                                            // position / tangent at u metres along the lane (written into the shared LP: read it before the next call)
    const f = clamp(u / STEP, 0, lane.n - 1.001), i = Math.floor(f), k = f - i;
    LP.x = lane.xs[i] * (1 - k) + lane.xs[i + 1] * k; LP.z = lane.zs[i] * (1 - k) + lane.zs[i + 1] * k; LP.tx = lane.tx[i]; LP.tz = lane.tz[i];
    return LP;
  };

  const kinds = ['pair', 'family', 'pair', 'family', 'trio', 'family'];
  const nGroups = lanes.length ? Math.max(3, Math.round(kinds.length * Q)) : 0;
  const groups = [];
  const dP = (l) => Math.hypot(l.cx - start.x, l.cz - start.z);
  for (let gi = 0; gi < nGroups; gi++) {
    const g = { kind: kinds[gi], lane: null, w: 0, phi: 0, seed: rng(), members: [], span: 0, st: 'swim', fl: null, home: null, tBack: 0 };
    const cand = lanes.filter((l) => !l.taken && free(l, g)).sort((a, b) => dP(a) - dP(b));
    const pick = cand.length ? cand[Math.min(cand.length - 1, Math.floor(rng() * rng() * Math.min(cand.length, 12)))] : null;
    if (!pick) continue;
    assign(g, pick);
    groups.push(g);
  }
  function assign(g, lane) {
    if (g.lane) g.lane.taken = null;
    g.lane = lane; lane.taken = g; g.span = lane.span; g.w = Math.PI * rng.range(0.28, 0.4) / lane.span; g.phi = rng() * TAU;
  }

  // ---- members ------------------------------------------------------------------------------
  const specs = [];                                    // { model, scale, off:[ox, oz], tint }
  const addGroup = (g) => {
    const m = [];
    if (g.kind === 'pair') m.push({ model: 'drake', scale: 1, off: [0.0, 0.0] }, { model: 'hen', scale: 1, off: [0.55, -0.7] });
    else if (g.kind === 'trio') m.push({ model: 'drake', scale: 1, off: [0.0, 0.2] }, { model: 'drake', scale: 1, off: [0.8, -0.6] }, { model: 'hen', scale: 1, off: [-0.7, -0.5] });
    else { m.push({ model: 'hen', scale: 1, off: [0, 0.3] }); const n = Math.max(3, Math.round(rng.range(4, 7) * (0.6 + 0.4 * Q))); for (let i = 0; i < n; i++) m.push({ model: 'hen', scale: 0.3, duck: true, off: [(i % 2 ? 0.28 : -0.28) + rng.range(-0.1, 0.1), -0.7 - 0.38 * Math.floor(i / 2) + rng.range(-0.1, 0.1)] }); }
    for (const q of m) { q.g = g; q.seed = rng(); q.ph = rng() * TAU; g.members.push(q); specs.push(q); }
  };
  groups.forEach(addGroup);
  const count = {}; for (const q of specs) count[q.model] = (count[q.model] || 0) + 1;
  const M = {};
  for (const [name, cnt] of Object.entries(count)) {
    const m = birdModel(name);
    M[name] = { sp: m.sp, body: instanced(m.body, matSolid, cnt, 'wl-' + name + '-body'), head: instanced(m.head, matSolid, cnt, 'wl-' + name + '-head'), wing: instanced(m.wing, matWing, cnt * 2, 'wl-' + name + '-wing'), n: 0 };
    for (const x of [M[name].body, M[name].head, M[name].wing]) group.add(x);
  }
  const wakeGeo = shadowGeometry();
  const wakes = instanced(wakeGeo, matWake, Math.max(1, specs.length), 'wl-wakes'); ctx.noOutline(wakes); group.add(wakes);
  const tint = new T.Color(); const duckling = new T.Color('#e8d18a');
  for (const q of specs) {
    q.slot = M[q.model].n++;
    if (q.duck) { for (const k of ['body', 'head']) M[q.model][k].setColorAt(q.slot, duckling); M[q.model].wing.setColorAt(q.slot * 2, duckling); M[q.model].wing.setColorAt(q.slot * 2 + 1, duckling); }
    else { tint.setRGB(1, 1, 1); for (const k of ['body', 'head']) M[q.model][k].setColorAt(q.slot, tint); M[q.model].wing.setColorAt(q.slot * 2, tint); M[q.model].wing.setColorAt(q.slot * 2 + 1, tint); }
  }
  for (const o of Object.values(M)) { o.body.count = o.n; o.head.count = o.n; o.wing.count = o.n * 2; for (const x of [o.body, o.head, o.wing]) if (x.instanceColor) x.instanceColor.needsUpdate = true; }
  wakes.count = specs.length;

  // ---- the pose of a member: swimming is a pure function of t on the lane, a flush (below) a flight from one swim pose to another ------------
  const _M0 = new T.Matrix4(), _A = new T.Matrix4(), _B = new T.Matrix4(), _Q = new T.Quaternion(), _E = new T.Euler(), _V = new T.Vector3(), _S = new T.Vector3(), _wing = new T.Matrix4();
  const pose = { x: 0, z: 0, yaw: 0 };
  const LP = { x: 0, z: 0, tx: 0, tz: 0 };                                // laneAt used to allocate one object per member and frame; the swim and the flights read it at once
  const levelOf = (lane) => lane.y ?? (L.WATERWAYS[lane.key]?.water ?? WATER);      // (T4b: a pond lane carries its own level; the waterway lanes have none, so the expression is the old one for them)
  const uAt = (fr, t) => fr.span * 0.5 * (1 - Math.cos(fr.w * t + fr.phi));
  /** position and heading of the centre of group g at t on the lane frame `fr` ({ lane, span, w, phi }; default: the group's own), written into `pose` */
  function groupPose(g, t, fr = g) {
    const ph = fr.w * t + fr.phi, u = fr.span * 0.5 * (1 - Math.cos(ph)), sg = Math.sin(ph), p = laneAt(fr.lane, u);
    const side = 0.35 * Math.sin(0.11 * t + g.seed * 20);                       // a little drift across the lane (the lane keeps 2.5 m of free water beyond it)
    pose.x = p.x - p.tz * side; pose.z = p.z + p.tx * side;
    pose.yaw = Math.atan2(p.tx, p.tz) + Math.PI * (1 - sm((sg + 0.12) / 0.24));
    return pose;
  }
  const O = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, dab: 0, air: 0, wk: 1, wl: 0, tt: 0, fp: 0 };      // the member pose in the making (emit() turns it into matrices)
  function swimPose(q, gp, t, lane, o) {
    const cy = Math.cos(gp.yaw), sy = Math.sin(gp.yaw);
    const tt = t + q.seed * 60, wob = 0.12 * Math.sin(tt * 0.35 + q.ph);
    const ox = q.off[0] + wob, oz = q.off[1] + 0.1 * Math.sin(tt * 0.27 + q.ph * 2);
    const dab = (() => { const per = 17 + q.seed * 12, u = ((tt / per) % 1) * per; return u < 2.2 && !q.duck ? Math.sin(Math.PI * u / 2.2) : (q.duck ? Math.max(0, Math.sin(tt * 1.1)) * 0.5 * (Math.sin(tt * 0.13) > 0.6 ? 1 : 0) : 0); })();
    const bob = 0.012 * Math.sin(tt * 1.6 + q.ph), s = q.scale;
    o.x = gp.x + ox * cy + oz * sy; o.z = gp.z - ox * sy + oz * cy;
    o.pitch = 0.04 * Math.sin(tt * 0.9 + q.ph) + 0.6 * dab; o.roll = 0.03 * Math.sin(tt * 1.15 + q.ph * 3);
    o.wl = levelOf(lane); o.y = o.wl - 0.035 * s + bob - 0.02 * dab;
    o.yaw = gp.yaw; o.dab = dab; o.air = 0; o.wk = 1; o.tt = tt; o.fp = 0;
  }

  // ---- the flush: a vehicle that comes at a group (threat.js: a motor boat, a car) puts it into the air ----------------------------------------
  // Each member flies from where it swims to where it WILL swim when the group lands on a lane 14-130 m away (a lane point away from the vehicle, not in its path, a straight low flight that
  // crosses no building footprint, bridge deck, pier or stair), so nothing teleports and the landing is the lane's own swim at that time. The group is then AWAY for 14-26 s and flies back to
  // the place it left once the vehicle is gone or heading elsewhere (the pigeons' circle-and-return). Ducklings skitter over the surface instead (a 6 cm arc, fast wing beats). While the group is in the air
  // or away the director leaves it alone; with no vehicle driven none of this runs and the swim is exactly the old function of t.
  const FLY_V = 10, SHY = 7;
  const landings = [];
  const lerp = (a, b, u) => a + (b - a) * u;
  const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  /** the swim frame on `lane` that is at u metres at time t (forward = toward larger u) */
  function frameAt(lane, u, fwd, t) {
    const w = Math.PI * rng.range(0.28, 0.4) / lane.span, a = Math.acos(clamp(1 - 2 * u / lane.span, -1, 1));
    return { lane, span: lane.span, w, phi: (fwd ? a : -a) - w * t };
  }
  /** a straight low flight clear of building footprints (wildlife/world.js flightClear), bridge decks, piers and stairs (the obstacle hash of the lanes) */
  function flightOk(x0, z0, x1, z1) {
    if (!W.flightClear(x0, z0, x1, z1)) return false;
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 4));
    for (let i = 1; i < n; i++) { const u = i / n; if (blocked(x0 + (x1 - x0) * u, z0 + (z1 - z0) * u)) return false; }
    return true;
  }
  /** the lane point the group at (cx, cz) lands on when it flees the vehicle: { lane, i } or null */
  function refuge(g, cx, cz) {
    landings.length = 0;
    const th = threat, ax = cx - th.x, az = cz - th.z, am = Math.hypot(ax, az) || 1;
    for (const l of lanes) {
      if (l.taken && l.taken !== g) continue;
      if (l !== g.lane && !(g.home && l === g.home.lane) && !free(l, g)) continue;
      for (let i = 1; i < l.n - 1; i += 3) {
        const x = l.xs[i], z = l.zs[i], d = Math.hypot(x - cx, z - cz);
        if (d < 14 || d > 130) continue;
        const tl = d / FLY_V + 1.4, px = th.x + th.vx * tl, pz = th.z + th.vz * tl;
        let cost = Math.abs(d - 48) * 0.5 - 30 * ((x - cx) * ax + (z - cz) * az) / (d * am);      // about 48 m, away from the vehicle
        if (Math.hypot(x - px, z - pz) < 24) cost += 70;                                              // the vehicle will be there when the group lands
        if (th.scares(x, z, th.y, SHY)) cost += 90;                                                   // it is heading for the spot now
        landings.push({ lane: l, i, cost });
      }
    }
    landings.sort((a, b) => a.cost - b.cost);
    for (let k = 0; k < landings.length && k < 24; k++) { const c = landings[k]; if (flightOk(cx, cz, c.lane.xs[c.i], c.lane.zs[c.i])) return c; }
    return null;
  }
  /** group g (swim / away) takes off for `lane` at u metres; kind 'flush' (fleeing) | 'home' (back to the lane it left) */
  function takeOff(g, t, lane, u, kind) {
    const gp = groupPose(g, t), cx = gp.x, cz = gp.z, p = laneAt(lane, u), dist = Math.hypot(p.x - cx, p.z - cz), dur = Math.max(2.2, dist / FLY_V + 1.4);
    const fr = frameAt(lane, u, u < lane.span / 2, t + dur);
    g.fl = { t0: t, dur, kind, from: g.lane, fr, H: clamp(0.09 * dist + 1.2, 2, 4.5) };
    lane.taken = g;
    for (const q of g.members) {
      const f = q.fl || (q.fl = { x0: 0, y0: 0, z0: 0, yaw0: 0, p0: 0, r0: 0, wl0: 0, x1: 0, y1: 0, z1: 0, yaw1: 0, wl1: 0, h: 0, dly: 0 });
      swimPose(q, groupPose(g, t), t, g.lane, O); f.x0 = O.x; f.y0 = O.y; f.z0 = O.z; f.yaw0 = O.yaw; f.p0 = O.pitch; f.r0 = O.roll; f.wl0 = O.wl;
      swimPose(q, groupPose(g, t + dur, fr), t + dur, lane, O); f.x1 = O.x; f.y1 = O.y; f.z1 = O.z; f.yaw1 = O.yaw; f.wl1 = O.wl;
      f.h = Math.atan2(f.x1 - f.x0, f.z1 - f.z0); f.dly = q.duck ? 0.1 + 0.25 * q.seed : 0.35 * q.seed;
    }
    g.st = 'fly';
    const d = Math.hypot(cx - W.player.x, cz - W.player.z);
    if (kind === 'flush' && d < 90) { const at = { x: cx, y: levelOf(g.lane) + 0.3, z: cz }; say('wings', at, 1); say('duck', at, 0.9); }
  }
  /** a group that has flown its time lands: from now on it swims the lane frame it was aiming at */
  function land(g, t) {
    const F = g.fl, fr = F.fr; g.fl = null;
    if (F.from !== fr.lane && !(g.home && F.from === g.home.lane)) F.from.taken = null;
    g.lane = fr.lane; g.span = fr.span; g.w = fr.w; g.phi = fr.phi; fr.lane.taken = g;
    if (F.kind === 'home') { g.home = null; g.st = 'swim'; }
    else { g.st = 'away'; g.tBack = t + rng.range(14, 26); }
  }
  function flush(g, t) {
    const gp = groupPose(g, t), c = refuge(g, gp.x, gp.z);
    if (!c) return false;
    if (g.st === 'swim') g.home = { lane: g.lane, u: uAt(g, t) };
    out.flushes++; takeOff(g, t, c.lane, c.i * STEP, 'flush');
    return true;
  }
  function goHome(g, t) {
    const h = g.home, p = laneAt(h.lane, h.u), gp = groupPose(g, t);
    if (!flightOk(gp.x, gp.z, p.x, p.z)) { if (h.lane !== g.lane) h.lane.taken = null; g.home = null; g.st = 'swim'; return; }      // the way home is blocked: settle where it is
    takeOff(g, t, h.lane, h.u, 'home');
  }
  /** every frame: the groups in the air land when their time is up; a group the vehicle comes at takes off; an away group goes home once the vehicle is gone */
  function fear(t) {
    const hot = threat.active && !opts.noFear;
    for (const g of groups) {
      if (g.st === 'fly') { if (t >= g.fl.t0 + g.fl.dur) land(g, t); continue; }
      if (hot) { const gp = groupPose(g, t); if (threat.scares(gp.x, gp.z, levelOf(g.lane), SHY) && flush(g, t)) continue; }
      if (g.st === 'away' && t >= g.tBack) {
        const p = laneAt(g.home.lane, g.home.u);
        if (!hot || !threat.scares(p.x, p.z, levelOf(g.home.lane), 18)) goHome(g, t);
      }
    }
  }
  /** the pose of member q in the air at t */
  function flyPose(q, t, o) {
    const F = q.g.fl, f = q.fl, u = clamp((t - F.t0 - f.dly) / Math.max(0.5, F.dur - f.dly), 0, 1), s = 0.3 * u + 0.7 * sm(u), k = q.duck ? 0.3 : 1;
    o.x = lerp(f.x0, f.x1, s); o.z = lerp(f.z0, f.z1, s);
    o.y = lerp(f.y0, f.y1, s) + (q.duck ? 0.06 : F.H) * Math.pow(Math.sin(Math.PI * u), 0.85);
    const mid = f.yaw0 + angDiff(f.yaw0, f.h) * sm(u / 0.2);
    o.yaw = mid + angDiff(mid, f.yaw1) * sm((u - 0.78) / 0.22);
    const lift = 1 - sm(u / 0.15);
    o.pitch = f.p0 * lift - k * (0.45 * Math.sin(Math.PI * clamp(u / 0.4, 0, 1)) + 0.5 * Math.sin(Math.PI * clamp((u - 0.76) / 0.24, 0, 1))); o.roll = f.r0 * lift;
    o.dab = 0; o.air = sm(u / 0.1) * (1 - sm((u - 0.9) / 0.1)); o.wk = Math.max(1 - sm(u / 0.08), sm((u - 0.92) / 0.08)); o.wl = lerp(f.wl0, f.wl1, s);
    o.tt = t + q.seed * 60; o.fp = t * TAU * (q.duck ? 14 : 7.5) + q.ph * 3;
  }
  const tcall = { next: 25 };
  function emit(q, o) {
    const E = M[q.model].sp, om = M[q.model], s = q.scale, a = o.air, cy = Math.cos(o.yaw), sy = Math.sin(o.yaw), tt = o.tt;
    _E.set(o.pitch, o.yaw, o.roll, 'YXZ'); _Q.setFromEuler(_E);
    _M0.compose(_V.set(o.x, o.y, o.z), _Q, _S.set(s, s, s));
    om.body.setMatrixAt(q.slot, _M0);
    _B.copy(_M0).multiply(_A.makeTranslation(0, E.neck[1], E.neck[0]));
    _E.set((0.1 + 1.0 * o.dab) * (1 - a), 0.5 * Math.sin(tt * 0.5 + q.ph) * (Math.sin(tt * 0.21) > 0 ? 1 : 0.2) * (1 - a), 0, 'YXZ'); _B.multiply(_A.makeRotationFromEuler(_E));
    om.head.setMatrixAt(q.slot, _B);
    const sh = E.wing.shoulder, cs = Math.cos(o.fp), sn = Math.sin(o.fp), open = Math.max(0, cs);
    const wAl = lerp(1.42, 0.2 + 0.28 * open, a), wTh = lerp(-0.95, 0.18 + 0.95 * sn, a), wSs = lerp(0.82, 1 - 0.3 * open, a), wBe = -0.12 * cs * a;
    for (let k = 0; k < 2; k++) {
      const side = k === 0 ? 1 : -1;
      _wing.copy(_M0).multiply(_A.makeTranslation(side * sh[0], sh[1], sh[2]));
      _E.set(0, side * wAl, side * wTh, 'ZYX'); _wing.multiply(_A.makeRotationFromEuler(_E));
      if (wBe) _wing.multiply(_A.makeRotationX(wBe));
      _wing.multiply(_A.makeScale(side * wSs, 1, 1));
      om.wing.setMatrixAt(q.slot * 2 + k, _wing);
    }
    // the wake: a pale ellipse a little longer than the body, drifting behind (gone while the member is in the air)
    _E.set(0, o.yaw, 0, 'YXZ'); _Q.setFromEuler(_E);
    const ws = (0.42 + 0.1 * Math.sin(tt * 0.8)) * s * (q.duck ? 1.4 : 1) * o.wk;
    _A.compose(_V.set(o.x - sy * 0.12 * s, o.wl + 0.02, o.z - cy * 0.12 * s), _Q, _S.set(ws * 0.9, 1, ws * 1.5));
    wakes.setMatrixAt(q.slot + q.wOff, _A);
    q.px = o.x; q.pz = o.z;
  }
  function write(q, t) {
    const g = q.g;
    if (g.st === 'fly') flyPose(q, t, O); else swimPose(q, groupPose(g, t), t, g.lane, O);
    emit(q, O);
  }
  // wake slots follow the global order of `specs`
  specs.forEach((q, i) => { q.wOff = i - q.slot; q.px = 0; q.pz = 0; });

  // ---- the groups follow the player: every 2 s a group left more than 230 m behind moves to a free lane 60-190 m away
  const P = W.player, cam = ctx.camera, fwd = new T.Vector3();
  let nextDir = 0, inited = false, moves = 0, lastX = 0, lastZ = 0;
  function direct(t) {
    if (t < nextDir || !(P.x || P.z) || !lanes.length) return;
    nextDir = t + 2;
    const jump = inited && Math.hypot(P.x - lastX, P.z - lastZ) > 90; lastX = P.x; lastZ = P.z;      // a teleport: populate the new place at once
    const init = !inited || jump; inited = true;
    try { cam.getWorldDirection(fwd); } catch (e) { fwd.set(0, 0, -1); }
    const seen = (l) => { const dx = l.cx - P.x, dz = l.cz - P.z, d = Math.hypot(dx, dz); return d < 80 && (dx * fwd.x + dz * fwd.z) / (d || 1) > 0.25; };
    for (const g of groups) {
      if (g.st !== 'swim') continue;                                       // (a group in the air or away from a flush belongs to the flush until it is home)
      const d0 = Math.hypot(g.lane.cx - P.x, g.lane.cz - P.z);
      if (d0 < (init ? 150 : 230)) continue;
      const cand = lanes.filter((l) => { const d = Math.hypot(l.cx - P.x, l.cz - P.z); return d > (init ? 10 : 60) && d < (init ? 300 : 190) && free(l, g) && (init || !seen(l)); });
      if (!cand.length) continue;
      assign(g, cand[Math.floor(rng() * cand.length)]); moves++;
      if (!init) return;
    }
  }
  // an occasional quack, from the nearest group of the player
  function update(dt, t) {
    if (!opts.noDirector) direct(t);
    fear(t);
    for (const q of specs) write(q, t);
    for (const o of Object.values(M)) { o.body.instanceMatrix.needsUpdate = true; o.head.instanceMatrix.needsUpdate = true; o.wing.instanceMatrix.needsUpdate = true; }
    wakes.instanceMatrix.needsUpdate = true;
    if (t >= tcall.next) {
      tcall.next = t + 14 + rng.range(0, 26);
      let best = null, bd = 1e9; for (const q of specs) { if (q.duck || q.model === 'drake') continue; const fl = q.g.st === 'fly', gp = fl ? null : groupPose(q.g, t), x = fl ? q.px : gp.x, z = fl ? q.pz : gp.z, d = Math.hypot(x - W.player.x, z - W.player.z); if (d < bd) { bd = d; best = { x, y: (q.g.lane.y ?? WATER) + 0.2, z }; } }
      if (best && bd < 90) say('duck', best, 0.7 + 0.3 * rng());
    }
  }
  if (specs.length) update(0, 0);
  out.update = update; out.ducks = specs; out.groups = groups; out.groupPose = (g, t) => {      // (a group in the air: the mean of its members as last drawn)
    if (g.st !== 'fly') return { ...groupPose(g, t) };
    let x = 0, z = 0; for (const q of g.members) { x += q.px; z += q.pz; }
    return { x: x / g.members.length, z: z / g.members.length, yaw: 0 };
  };
  out.flush = (g, t) => flush(g, t); out.threat = threat; out.triangles = specs.length * 330;
  Object.defineProperty(out, 'moves', { get: () => moves });
  return out;
}
