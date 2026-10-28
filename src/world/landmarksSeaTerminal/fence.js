// landmarksSeaTerminal/fence.js - fence runs of the module along OSM polylines in WORLD metres (the Parts collector must be in the identity frame): the black steel yard fence of the D-2 museum, the green welded-mesh
// panels of the port perimeter (posts every 3 m on white foot blocks), the galvanised ribbed hoarding of the Lenexpo site (panels 2.0 m on steel posts, a few shortened panels: "flimsy").  Every run is SOLID
// (thin colliders flagged `fence` like streets/barriers.js addFenceBoxes, so the people module treats them as walls), cut by gates (a gap of 2 x gateHalf round each gate point, which stays open).
import { BARRIERS } from '../data/city.js';
import { coverFn } from './frame.js';
import { unitBox, unitPanel } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7, 15.v): every piece of a run is a breakable bay (collider + drawing + knock record), the posts stay static
import { kBays } from './inst.js';

/** pts of a baked barrier by id (world, flat [x, z, ...]) or null */
export function barrierPts(id) { const b = BARRIERS.find((q) => q.id === id); return b && b.pts ? b.pts : null; }

const KINDS = {
  iron: { h: 1.2, step: 2.4, solidH: 1.3, thick: 0.12 },
  mesh: { h: 2.0, step: 3.0, solidH: 2.0, thick: 0.12 },
  hoard: { h: 2.0, step: 3.0, solidH: 2.1, thick: 0.15 },
};

/** draw + collide a fence run. o = { kind, gates: [[x, z]...], gateHalf, id }.  Returns the number of drawn pieces. */
export function fenceRun(K, pts, o = {}) {
  const P = K.P, M = K.M, ph = K.ctx.physics, cfg = KINDS[o.kind || 'iron'], gates = o.gates || [], gh = o.gateHalf || 2.0, cover = coverFn(K.ctx), closed = o.closed ?? (o.kind === 'hoard');
  let pieces = 0;
  const bays = [];
  const nearGate = (x, z) => gates.some((g) => Math.hypot(g[0] - x, g[1] - z) < gh);
  const matPost = o.kind === 'mesh' ? M.meshPost : o.kind === 'hoard' ? M.hoardPost : M.yardFence;
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const ax = pts[i], az = pts[i + 1], bx = pts[i + 2], bz = pts[i + 3], dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
    if (len < 0.2) continue;
    const ux = dx / len, uz = dz / len, rot = Math.atan2(-uz, ux), n = Math.max(1, Math.round(len / cfg.step)), st = len / n;
    // pieces between posts; a piece whose middle is within a gate radius is left out (the gate is open)
    // road integrity (docs/AGENT-BRIEF.md): nothing stands on a carriageway.  Where an OPEN fence line (the port fence, the museum yard fence) crosses real asphalt (the disused trolleybus loop, a service road) the piece
    // is left out = an open vehicle gate, and no post / foot block stands within 0.3 m of the asphalt edge (net.cover > -0.3).  CLOSED runs (o.closed: the Lenexpo hoarding with its four closed gates, the quay
    // closure) are the documented exception: a real closed gate across a private road, drawn and solid.
    const onRoad = (x, z, m) => cover(x, z) > -m;
    const live = [];
    for (let k = 0; k < n; k++) {
      const mx = ax + ux * (k + 0.5) * st, mz = az + uz * (k + 0.5) * st, ex0 = ax + ux * k * st, ez0 = az + uz * k * st, ex1 = ax + ux * (k + 1) * st, ez1 = az + uz * (k + 1) * st;
      const road = !closed && (onRoad(mx, mz, 0.15) || onRoad(ex0, ez0, 0.15) || onRoad(ex1, ez1, 0.15));
      if (road) { K.svc.fenceRoadGaps = (K.svc.fenceRoadGaps || 0) + 1; if (typeof process !== 'undefined' && process.env && process.env.SEATERM_DEBUG) console.log(`[landmarksSeaTerminal] fence ${o.id || '?'} piece at (${mx.toFixed(1)}, ${mz.toFixed(1)}) left out: asphalt (cover ${cover(mx, mz).toFixed(2)})`); }
      live.push(!nearGate(mx, mz) && !road);
    }
    for (let k = 0; k < n; k++) {
      if (!live[k]) continue;
      const x0 = k * st, x1 = (k + 1) * st;
      P.push(ax, 0, az, rot);
      try {
        // the piece itself (panel, rails, base / hoarding) is the BAY below; a shortened hoarding panel every 13th piece (a dent), deterministic
        bays.push({ x0: ax + ux * x0, z0: az + uz * x0, x1: ax + ux * x1, z1: az + uz * x1, y: 0, low: o.kind === 'hoard' && ((i / 2 + k) * 7) % 13 === 5 });
        // posts at both ends of the piece
        for (const x of [x0, x1]) {
          const roadPost = onRoad(ax + ux * x, az + uz * x, 0.3);
          if (!closed && roadPost) continue;                                                                      // an open run: no post / foot block on the asphalt
          if (o.kind === 'iron') P.box(matPost, x - 0.04, x + 0.04, 0, 1.28, -0.04, 0.04, 'b', 1);
          else if (o.kind === 'mesh') { P.box(matPost, x - 0.04, x + 0.04, 0.3, 2.1, -0.04, 0.04, 'b', 1); if (!roadPost) P.box(M.footBlock, x - 0.3, x + 0.3, 0, 0.3, -0.2, 0.2, 'b', 1); }
          else P.box(matPost, x - 0.05, x + 0.05, 0, 2.25, -0.07, 0.07, 'b', 1);
        }
        pieces++;
      } finally { P.pop(); }
    }
    K.svc.fences.push({ id: o.id || '', pts: [[ax, az], [bx, bz]], solid: true, gates: gates.length });
  }
  // the bays of the run (n4spb): the source merged the live pieces into solid boxes of at most 14 m
  if (bays.length) {
    const parts = o.kind === 'iron' ? [
      { geo: unitBox(0.32, 1.12, -0.015, 0.015, { uLen: 2.4, uvs: 1 }), mat: M.yardFence, name: 'panel', stretch: true, inset: 0.04 },
      { geo: unitBox(1.12, 1.2, -0.03, 0.03, { uLen: 2.4, uvs: 1 }), mat: M.yardFence, name: 'rail-top', stretch: true },
      { geo: unitBox(0.24, 0.32, -0.03, 0.03, { uLen: 2.4, uvs: 1 }), mat: M.yardFence, name: 'rail-low', stretch: true },
      { geo: unitBox(0, 0.24, -0.1, 0.1, { uLen: 2.4, uvs: 2 }), mat: M.pole, name: 'base', stretch: true, inset: 0.2 }]
      : o.kind === 'mesh' ? [{ geo: unitPanel(0.3, 2.0, { u1: 1 }), mat: M.meshPanel, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: true }]
      : [{ geo: unitBox(0, 2.0, -0.03, 0.03, { uLen: 3, uvs: 2 }), mat: M.hoard, name: 'panel', stretch: true, inset: 0.03, sy: (b) => (b.low ? 0.8 : 1) },
        { geo: unitBox(0, 0.05, -0.05, 0.05, { uLen: 3, uvs: 1 }), mat: M.hoardPost, name: 'cap', stretch: true, inset: 0.03, y: (b) => (b.low ? 1.6 : 2.0) }];
    kBays(K, { name: 'lmseate-fence-' + (o.id || o.kind || 'iron'), bays, far: 320, parts,
      collider: { y0: 0, y1: cfg.solidH, thick: cfg.thick, e0: 0, e1: 0 },
      rec: () => ({ kind: 'fence', mass: o.kind === 'hoard' ? 500 : 250, h: cfg.solidH, anchored: o.kind === 'hoard' ? 16 : 14, hitK: 0.4, metal: o.kind !== 'hoard', minDv: 0 }) });
  }
  return pieces;
}
