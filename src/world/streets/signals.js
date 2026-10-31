// streets/signals.js - traffic signals (black truss mast arms over the carriageway + stop-line poles with heads and LED countdown timers (countdown.js), pedestrian heads on the zebra poles),
// pedestrian-crossing signs (blue square with a fluorescent yellow-green frame), 'СТОП' plates, blue lane-use signs, red-white chevron posts on the traffic islands, and the navy
// street-name / house-number plates (plates.js). Lamps show the plan of streets/lanegraph.js (pure function of t). Look: docs/research/streets.md section 4, nevsky.md section 5, photos P09 P25 P48 P52 P53.
// KNOCKABLE (ctx.knock, shared.kposts of furn.js makeKnockPosts): every pole of this file can be knocked down by the driven car: the 840 signal poles (stop line, mid-block, signalised zebra: 90 kg of
// steel, anchored 18 km/h), the 268 mast arms (900 kg, anchored 40 km/h), the sign posts (zebra, 'P', island chevron, bay signs: 28 kg, anchored 10 km/h). Without ctx.knock the poles are merged into
// the shared pt-poles VB as ever. With it each pole is an instance of a LOCAL model (shaft + head housing + countdown panel + back plates + cabinet) plus an atlas FACE instance, and its heads carry their
// lens and countdown instances (the shared lens / digit meshes) as extra parts, so the whole pole flies and lies as one thing. The lens and the digit meshes never get a matrix write after the build in
// that mode (setLens writes the lens COLOUR: lit = white, off = dark; the digits are switched by the glyph cell): nothing snaps a knocked head back to the pole. The logical signal keeps cycling (the
// traffic obeys a lamp that lies in the grass: the simulation does not know about the pole).
import * as THREE from 'three';
import { VB } from './vb.js';
import { clamp } from './util.js';
import { COL, hash2, poleClear, clearNear, nudgeClear, mountBody, faceOf } from './furn.js';
import { WALK_Y, KERB_W } from './surface.js';
import { groupState, pedGroupState, midState, midPed } from './lanegraph.js';
import { buildPlates } from './plates.js';
import { buildCountdowns, countdownPanel } from './countdown.js';
import { createSignalDisplayClock } from './display-clock.js';
import { AREAS } from '../data/city.js';
import { wayAt, coverLocal } from './net.js';

export function buildSignals(ctx, net, graph, T, shared, opts = {}) {
  const { THREE: _t } = ctx; void _t;
  const out = { masts: 0, heads: 0, signs: 0, plates: 0, bilingual: 0, tris: 0, pedPoles: [], crossingSigns: 0, plateList: [] };
  const F = ctx.tex.FONTS;
  const { panels, poles } = shared;
  const K = shared.kposts || null;                                       // knockable poles (see the header); null = the merged pt-poles path

  // ================================================================ sign faces: signs.js (GOST R 52290, one source for every module of streets), sizes SIGN_SIZE
  const { signs: SG } = shared;
  const pedSign = SG.tex('5.19'), stopTex = SG.tex('6.16'), parkTex = SG.tex('6.4'), bikeTex = SG.tex('4.5'), taxiTex = SG.tex('bay-taxi'), coachTex = SG.tex('bay-coach'), laneTex = SG.tex('5.15.2'), chevTex = SG.tex('chevron');
  const speedTex = (v) => SG.tex('3.24', v);
  const [PED_W, PED_H] = SG.size('5.19'), [STOP_W, STOP_H] = SG.size('6.16'), [LANE_W, LANE_H] = SG.size('5.15.2');

  // ================================================================ lens instances (state per frame)
  const heads = [];                       // { kind: 'veh'|'ped', sig, ap, cross, x, y, z, dx, dz }
  const lensGeo = new THREE.CircleGeometry(0.095, 8);
  const pedGeo = new THREE.CircleGeometry(0.085, 8);
  const post = (x, z, h, r = 0.05, col = COL.pole) => { ctx.physics.addCylinder(x, z, Math.max(r * 1.2, 0.08), 0, h); return poles.cyl(r, r * 1.1, h, col, [x, WALK_Y + h / 2, z], null, 5, null, true); };
  const head3Boxes = (V, x, y, z, dx, dz) => {                           // the housing of a 3-lens vehicle head facing (dx,dz), black with a hood over every lens: V any VB (the shared poles, or a local model)
    const ry = Math.atan2(dx, dz);
    V.box(0.3, 0.92, 0.28, COL.black, [x, y, z], [0, ry, 0]);
    V.box(0.42, 1.04, 0.04, COL.black, [x - dx * 0.16, y, z - dz * 0.16], [0, ry, 0]);          // back plate: body + plate only (the old third box covered the lens discs)
  };
  const headPedBoxes = (V, x, y, z, dx, dz) => {
    const ry = Math.atan2(dx, dz);
    V.box(0.26, 0.5, 0.2, COL.black, [x, y, z], [0, ry, 0]);
    V.box(0.34, 0.58, 0.03, COL.black, [x - dx * 0.11, y, z - dz * 0.11], [0, ry, 0]);
  };
  const addHead3 = (x, y, z, dx, dz, sig, ap) => { const h = { kind: 'veh', sig, ap, x: x + dx * 0.15, y, z: z + dz * 0.15, dx, dz }; heads.push(h); out.heads++; return h; };
  const addHeadPed = (x, y, z, dx, dz, cross) => { const h = { kind: 'ped', cross, x: x + dx * 0.11, y, z: z + dz * 0.11, dx, dz }; heads.push(h); out.heads++; return h; };
  const head3 = (x, y, z, dx, dz, sig, ap) => { head3Boxes(poles, x, y, z, dx, dz); return addHead3(x, y, z, dx, dz, sig, ap); };      // 3-lens vehicle head facing (dx,dz)
  const headPed = (x, y, z, dx, dz, cross) => { headPedBoxes(poles, x, y, z, dx, dz); return addHeadPed(x, y, z, dx, dz, cross); };      // 2-lens pedestrian head (red man over green man)
  const cabinet = (x, y, z, ry) => poles.box(0.3, 0.45, 0.2, '#e7e6e1', [x, y, z], [0, ry, 0]);

  // ================================================================ KNOCKABLE models (K only): LOCAL frame, origin = the foot of the pole at the pavement level, +z = the way the head / sign faces
  // (the world pose of a pole is T(x, WALK_Y, z) R_y(atan2(face))); the parts are the ones the merged path draws, in the same places
  const SIGNAL = { kind: 'signal', mass: 90, h: 3.3, r: 0.07, anchored: 18, hitK: 0.2, metal: true };       // a traffic-signal pole with head, plate, cabinet (holds a parking scrape, a car at 18 km/h knocks it)
  /** a mast falls ACROSS its arm (along the traffic, +-z of its frame): the knock turns the whole rigid structure about one horizontal axis, and a truss that lay along the fall would swing into the ground or up into the sky */
  const fallAcross = (rotY) => (r, b) => { const fx = Math.sin(rotY), fz = Math.cos(rotY), sg = b.dx * fx + b.dz * fz < 0 ? -1 : 1; b.dx = fx * sg; b.dz = fz * sg; };
  const ARM_LEN = [4, 6, 8, 10, 11, 13];                                                                    // the arm lengths of the models (the real ones cluster at 8, 11 and 13 m): a mast takes the nearest, so a cell holds a handful of models
  const ARM = { kind: 'arm', mass: 900, h: 8, r: 0.15, anchored: 40, hitK: 0.8, metal: true };               // a mast arm: a heavy steel mast with an 8 m truss, holds below 40 km/h
  /** housing + countdown panel of a head at the local position (x, y, z) facing (dx, dz) */
  const headLocal = (V, kind, x, y, z, dx, dz) => {
    if (kind === 'veh') head3Boxes(V, x, y, z, dx, dz); else headPedBoxes(V, x, y, z, dx, dz);
    const o = kind === 'veh' ? 0.15 : 0.11;
    countdownPanel(V, kind, x + dx * o, y, z + dz * o, dx, dz);
  };
  const stopModel = (cab) => K.model(cab ? 'sig-stop' : 'sig-mid', (V) => {                              // the stop-line pole (+ cabinet) / the mid-block pole: shaft, head at 2.75 m, the back plate of the СТОП plate
    V.cyl(0.06, 0.066, 3.3, COL.black, [0, 1.65, 0], null, 5, null, true);
    headLocal(V, 'veh', 0, 2.75, 0, 0, 1);
    mountBody(V, 0, 1.55, 0, 0, 1, STOP_W, STOP_H, { pole: 0.06, kind: 'plate' });
    if (cab) V.box(0.3, 0.45, 0.2, '#e7e6e1', [0.2, 1.0, 0], [0, Math.PI / 2, 0]);
  });
  const zebraModel = () => K.model('sig-zebra', (V) => {                                                  // the signalised zebra pole: shaft, sign back plate, pedestrian head across the road (local -x), cabinet behind
    V.cyl(0.055, 0.0605, 3.3, COL.pole, [0, 1.65, 0], null, 5, null, true);
    mountBody(V, 0, 2.85, 0, 0, 1, PED_W, PED_H, { pole: 0.055 });
    headLocal(V, 'ped', 0, 2.0, 0, -1, 0);
    V.box(0.3, 0.45, 0.2, '#e7e6e1', [0, 1.0, -0.16], [0, 0, 0]);
  });
  const armModel = (L) => K.model('arm|' + L, (V) => {                                                    // mast + base ring + knee + truss of length L (the arm reaches to local -x)
    const H = 8.0, AH = 6.2, n = Math.max(3, Math.round(L / 1.3));
    V.cyl(0.095, 0.15, H, COL.black, [0, H / 2, 0], null, 6, null, true);
    V.cyl(0.24, 0.24, 0.5, COL.blackL, [0, 0.25, 0], null, 6);
    V.rod([0, AH - 1.4, 0], [-1.6, AH + 0.15, 0], 0.06, COL.black, 4, true);
    for (let i = 0; i < n; i++) {
      const d0 = 1.0 + (L - 1.0) * i / n, d1 = 1.0 + (L - 1.0) * (i + 1) / n, yU = AH + 0.34 - 0.18 * (i / n), yU1 = AH + 0.34 - 0.18 * ((i + 1) / n);
      V.rod([-d0, yU, 0], [-d1, yU1, 0], 0.04, COL.black, 3, true);
      V.rod([-d0, AH, 0], [-d1, AH, 0], 0.04, COL.black, 3, true);
      V.rod([-d0, i % 2 ? yU : AH, 0], [-d1, i % 2 ? AH : yU1, 0], 0.025, COL.black, 3, true);
    }
  });
  const headModel = () => K.model('head-veh', (V) => headLocal(V, 'veh', 0, 0, 0, 0, 1));                 // a vehicle head hanging from an arm (origin = the housing centre)
  const hangModel = () => K.model('hang-ped', (V) => { mountBody(V, 0, 0, 0, 0, 1, PED_W, PED_H); V.rod([0, 0.7, 0], [0, 0.35, 0], 0.02, COL.black, 3, true); });   // the pedestrian sign under the arm: back plate + hanger rod
  /** the lens and countdown instances of a head (shared meshes: they move with the record of the pole that carries the head) */
  const mkHead3 = K ? addHead3 : head3, mkHeadPed = K ? addHeadPed : headPed;                              // (K: the housing and the countdown panel belong to the pole model, the head record is all that is left)
  /** a knockable signal pole of the model `model`: the collider, the head (mkHead) and the record; (fx, fz) the facing of the pole = of its sign */
  const knockSignal = (model, x, z, fx, fz, face, mkHead) => {
    const item = ctx.physics.addCylinder(x, z, 0.08, 0, 3.3), hd = mkHead();
    return K.add({ group: 'signal', model, x, z, rotY: Math.atan2(fx, fz), faces: [face], item, rec: SIGNAL, extra: () => headParts(hd) });
  };
  const headParts = (h) => {
    const lens = h.kind === 'veh' ? vLens : pLens, cd = out.countdowns && out.countdowns.im, parts = lens.map((l) => ({ mesh: l.im, index: h.li }));
    if (cd) parts.push({ mesh: cd, index: h.ci * 2 }, { mesh: cd, index: h.ci * 2 + 1 });
    return parts;
  };

  // ================================================================ ROAD CLEARANCE RULE for the poles beside a lane: the offset is measured from the REAL asphalt edge to the right of the lane (own parking pocket,
  // junction fillet, and the foreign carriageway where a micro-gap junction cuts a mouth short), the base must be clear of every asphalt (poleClear); else the pole slides back along the arm
  // (1 m steps up to 30 m), else the nearest clear pavement on the right within 14 m (a mast within 8 m of the lane: its arm reaches the lanes), else it is dropped. Never a base in the roadway.
  const laneAtS = (lane, s) => {                                        // point + unit tangent of a lane polyline at arclength s
    const pts = lane.pts; let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0], dz = pts[i][1] - pts[i - 1][1], d = Math.hypot(dx, dz); if (d < 1e-6) continue;
      if (acc + d >= s || i === pts.length - 1) { const f = clamp((s - acc) / d, 0, 1); return { x: pts[i - 1][0] + dx * f, z: pts[i - 1][1] + dz * f, tx: dx / d, tz: dz / d }; }
      acc += d;
    }
    return null;
  };
  const rightEdge = (q) => {                                            // lateral offset of the asphalt edge right of the lane centre (cover is linear across a way: interpolated, 0.25 m steps)
    // one local cover for the 56 probes of the ray (net.js coverLocal, exact above -6.3 with R = 20 for probes within 14 m); a probe below that asks the full cover, so the interpolation
    // uses the same numbers as before
    const cl = coverLocal(net, q.x, q.z, 20, {}), cov = (px, pz) => { const c = cl(px, pz); return c < -6 ? net.cover(px, pz, {}) : c; };
    let prev = cov(q.x, q.z);
    if (prev < 0) return 0;
    for (let k = 0.25; k < 14; k += 0.25) {
      const c = cov(q.x - q.tz * k, q.z + q.tx * k);
      if (c < 0) return k - 0.25 + 0.25 * prev / (prev - c);
      prev = c;
    }
    return 14;
  };
  const laneNear = (lane, x, z) => {                                    // the point of the lane polyline nearest to (x, z) + its unit tangent
    let best = null;
    for (let i = 1; i < lane.pts.length; i++) {
      const ax = lane.pts[i - 1][0], az = lane.pts[i - 1][1], dx = lane.pts[i][0] - ax, dz = lane.pts[i][1] - az, l2 = dx * dx + dz * dz; if (l2 < 1e-9) continue;
      const t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1), d = Math.hypot(x - ax - dx * t, z - az - dz * t), l = Math.sqrt(l2);
      if (!best || d < best.d) best = { x: ax + dx * t, z: az + dz * t, tx: dx / l, tz: dz / l, d };
    }
    return best;
  };
  const clearSpot = (lane, s0, maxOff = 14, keep = null) => {
    const baseClear=(x,z)=>{for(let i=0;i<24;i++){const a=i*Math.PI/12;if(net.cover(x+Math.cos(a)*.35,z+Math.sin(a)*.35,{})>=-.05)return false;}return true;};
    const off0 = lane.width / 2 + KERB_W + 0.7;
    for (let back = 0; back <= 30 && s0 - back >= 0; back++) {
      const q = laneAtS(lane, s0 - back); if (!q) break;
      const off = Math.max(off0, rightEdge(q) + KERB_W + 0.7), x = q.x - q.tz * off, z = q.z + q.tx * off;
      if (poleClear(net, x, z) && net.cover(x,z,{})<-.35 && baseClear(x,z) && !(keep && Math.hypot(keep[0] - x, keep[1] - z) < 1.5)) return { x, z, off, tx: q.tx, tz: q.tz };
    }
    const q = laneAtS(lane, s0); if (!q) return null;
    const rx = -q.tz, rz = q.tx, c = clearNear(net, q.x + rx * off0, q.z + rz * off0, 14, (x, z) => (x - q.x) * rx + (z - q.z) * rz > 0.5 && (x - q.x) * rx + (z - q.z) * rz <= maxOff && !(keep && Math.hypot(keep[0] - x, keep[1] - z) < 1.5));
    const n = c && laneNear(lane, c[0], c[1]);
    return n && net.cover(c[0],c[1],{})<-.35 && baseClear(c[0],c[1]) ? { x: c[0], z: c[1], off: (c[0] - n.x) * -n.tz + (c[1] - n.z) * n.tx, tx: n.tx, tz: n.tz } : null;
  };

  // ================================================================ approaches of signalised junctions: stop-line pole with a head + (arterial arms) a black mast arm
  const nodeById = new Map(); for (const n of net.nodes) if (!nodeById.has(n.id)) nodeById.set(n.id, n);
  for (const sig of graph.signals) {
    if (sig.mid) continue;
    const nd = nodeById.get(sig.node); if (!nd) continue;
    for (const a of nd.arms) {
      if (!a.inl || !a.inl.length || a.group === undefined) continue;
      const lane0 = a.inl[0], lw = lane0.width;
      const hw = lw * a.inl.length;                                           // width of the approach carriageway
      // lower pole at the stop line: 3-lens head at 2.7 m, 'СТОП' plate, control cabinet
      const sp = clearSpot(lane0, lane0.len - 0.3);
      if (sp) {
        const { x: sx, z: sz, tx, tz } = sp, rx = -tz, rz = tx;
        if (K) knockSignal(stopModel(true), sx, sz, -tx, -tz, faceOf(stopTex, sx, WALK_Y + 1.55, sz, -tx, -tz, STOP_W, STOP_H, { pole: 0.06 }), () => mkHead3(sx, WALK_Y + 2.75, sz, -tx, -tz, sig.id, a.index));
        else {
          post(sx, sz, 3.3, 0.06, COL.black);
          head3(sx, WALK_Y + 2.75, sz, -tx, -tz, sig.id, a.index);
          panels.mount(poles, stopTex, sx, WALK_Y + 1.55, sz, -tx, -tz, STOP_W, STOP_H, { pole: 0.06, kind: "plate" });
          cabinet(sx + rx * 0.2, WALK_Y + 1.0, sz + rz * 0.2, Math.atan2(rx, rz));
        }
        out.signs++;
      }
      // mast arm (docs/research/streets.md L3): black pole 8 m, curved truss arm at 6.2 m over the carriageway, a head over the first lane and a pedestrian sign;
      // the heads, the arm length and the sign follow the REAL lateral distance of the mast to the lane (off), so a mast that had to move still hangs its heads over the lanes
      const mp = (a.inl.length >= 2 || a.w.rank >= 3) && clearSpot(lane0, lane0.len - 2.2, 8, sp && [sp.x, sp.z]);
      if (mp) {
        const { x: mx, z: mz, off, tx, tz } = mp, rx = -tz, rz = tx, H = 8.0, AH = 6.2, len = clamp(hw + 0.6 + off - (lw / 2 + KERB_W + 0.7), 4, 13);
        const ax = -rx, az = -rz;
        const mitem = ctx.physics.addCylinder(mx, mz, 0.2, 0, H);
        if (!K) {
          poles.cyl(0.095, 0.15, H, COL.black, [mx, WALK_Y + H / 2, mz], null, 6, null, true);
          poles.cyl(0.24, 0.24, 0.5, COL.blackL, [mx, WALK_Y + 0.25, mz], null, 6);
          // truss arm: curved knee up to the arm, two chords, zig-zag diagonals
          poles.rod([mx, WALK_Y + AH - 1.4, mz], [mx + ax * 1.6, WALK_Y + AH + 0.15, mz + az * 1.6], 0.06, COL.black, 4, true);
          const n = Math.max(3, Math.round(len / 1.3));
          for (let i = 0; i < n; i++) {
            const d0 = 1.0 + (len - 1.0) * i / n, d1 = 1.0 + (len - 1.0) * (i + 1) / n, yU = AH + 0.34 - 0.18 * (i / n), yU1 = AH + 0.34 - 0.18 * ((i + 1) / n);
            poles.rod([mx + ax * d0, WALK_Y + yU, mz + az * d0], [mx + ax * d1, WALK_Y + yU1, mz + az * d1], 0.04, COL.black, 3, true);
            poles.rod([mx + ax * d0, WALK_Y + AH, mz + az * d0], [mx + ax * d1, WALK_Y + AH, mz + az * d1], 0.04, COL.black, 3, true);
            poles.rod([mx + ax * d0, WALK_Y + (i % 2 ? yU : AH), mz + az * d0], [mx + ax * d1, WALK_Y + (i % 2 ? AH : yU1), mz + az * d1], 0.025, COL.black, 3, true);
          }
        }
        const mhead = [];                                                    // the heads of this arm (K: their lens / digit instances travel with the arm)
        // vehicle head over lane 1 (hangs from the arm), pedestrian sign + a second head over lane 2 on wide approaches
        const d1 = off + lw * 0.5;
        mhead.push(mkHead3(mx + ax * d1 + ax * 0.0, WALK_Y + AH - 0.75, mz + az * d1, -tx, -tz, sig.id, a.index));
        if (a.inl.length >= 2) mhead.push(mkHead3(mx + ax * (off + lw * 1.5), WALK_Y + AH - 0.75, mz + az * (off + lw * 1.5), -tx, -tz, sig.id, a.index));
        const dd = Math.min(len - 0.6, off + hw * 0.5 + 1.5);
        if (a.cross && !K) { panels.mount(poles, pedSign, mx + ax * dd, WALK_Y + AH - 0.7, mz + az * dd, -tx, -tz, PED_W, PED_H); poles.rod([mx + ax * dd, WALK_Y + AH, mz + az * dd], [mx + ax * dd, WALK_Y + AH - 0.35, mz + az * dd], 0.02, COL.black, 3, true); }
        if (a.cross) out.signs++;
        if (K) {                                                             // one record: the mast (the model of the nearest arm length), the heads, the hanging sign, all lenses and digits
          const mrot = Math.atan2(-tx, -tz), hang = a.cross;
          K.add({ group: 'arm', model: armModel(ARM_LEN.reduce((b, v) => (Math.abs(v - len) < Math.abs(b - len) ? v : b))), x: mx, z: mz, rotY: mrot, item: mitem, rec: ARM, onKnock: fallAcross(mrot),
            parts: [...mhead.map((h) => ({ model: headModel(), x: h.x - h.dx * 0.15, y: h.y, z: h.z - h.dz * 0.15, rotY: mrot })), ...(hang ? [{ model: hangModel(), x: mx + ax * dd, y: WALK_Y + AH - 0.7, z: mz + az * dd, rotY: mrot }] : [])],
            faces: hang ? [faceOf(pedSign, mx + ax * dd, WALK_Y + AH - 0.7, mz + az * dd, -tx, -tz, PED_W, PED_H)] : [], extra: () => mhead.flatMap(headParts) });
        }
        out.masts++;
      }
    }
  }

  // ================================================================ mid-block pedestrian signals: a head for every direction at the stop line
  for (const sig of graph.signals) {
    if (!sig.mid) continue;
    for (const ap of sig.approaches) {
      const sl = graph.stopLines.find((q) => q.signal === sig.id && q.approach === ap.index && graph.laneById.get(q.lane) && graph.laneById.get(q.lane).idx === 0); if (!sl) continue;
      const sp = clearSpot(graph.laneById.get(sl.lane), sl.s - 0.3); if (!sp) continue;
      const { x: sx, z: sz, tx, tz } = sp;
      if (K) knockSignal(stopModel(false), sx, sz, -tx, -tz, faceOf(stopTex, sx, WALK_Y + 1.55, sz, -tx, -tz, STOP_W, STOP_H, { pole: 0.06 }), () => mkHead3(sx, WALK_Y + 2.75, sz, -tx, -tz, sig.id, ap.index));
      else {
        post(sx, sz, 3.3, 0.06, COL.black);
        head3(sx, WALK_Y + 2.75, sz, -tx, -tz, sig.id, ap.index);
        panels.mount(poles, stopTex, sx, WALK_Y + 1.55, sz, -tx, -tz, STOP_W, STOP_H, { pole: 0.06, kind: "plate" });
      }
      out.signs++;
    }
  }

  // ================================================================ zebra crossings: poles with signs (+ pedestrian heads where signalised)
  const sigOfCross = new Map();
  for (const s of graph.signals) for (const c of s.crossings || []) sigOfCross.set(c.id, s);
  for (const c of net.crossings) {
    if (c.road.pedestrianOnly) continue;                                 // pedestrian decks / zones: no zebra poles
    const half = clamp(c.w + 1, 3.5, 6) / 2;
    const sg = sigOfCross.get(c.id) || sigOfCross.get(c.ids && c.ids.find((i) => sigOfCross.has(i)));
    for (const side of [1, -1]) {
      // pole beside the zebra: side +1 stands on the +n edge before the crossing (travel +t arrives from -t), side -1 on the -n edge after it. The kerb offset is taken at the pole's OWN s
      // (parking pocket, widened asphalt), and a base that is not clear moves outward (0.4 m steps, 1.2 m), then along the kerb away from the crossing (1 m steps, 4 m), then to the
      // nearest clear pavement on its side within 5 m: the sign is kept, never a base in the roadway
      const q = wayAt(c.road, c.s - side * (half + 0.9)), lat = side > 0 ? q.hR : q.hL, nx = -q.tz * side, nz = q.tx * side;
      const base = lat + KERB_W + 0.65, bx = q.x + nx * base, bz = q.z + nz * base;
      const spot = nudgeClear(net, bx, bz, -q.tx * side, -q.tz * side, nx, nz, 4, 1) || clearNear(net, bx, bz, 5, (x, z) => (x - q.x) * nx + (z - q.z) * nz > lat + KERB_W);
      if (!spot) continue;
      const [px, pz] = spot;
      const H = sg ? 3.3 : 2.9;
      // sign faces the arriving traffic (against its travel direction)
      const fx = -q.tx * side, fz = -q.tz * side;
      if (K && sg) knockSignal(zebraModel(), px, pz, fx, fz, faceOf(pedSign, px, WALK_Y + H - 0.45, pz, fx, fz, PED_W, PED_H, { pole: 0.055 }), () => mkHeadPed(px - nx * 0.0, WALK_Y + 2.0, pz, -nx, -nz, c.id));
      else if (K) K.signPost({ x: px, z: pz, nx: fx, nz: fz, h: H, r: 0.055, tex: pedSign, w: PED_W, ht: PED_H, my: H - 0.45 });
      else {
        post(px, pz, H, 0.055);
        panels.mount(poles, pedSign, px, WALK_Y + H - 0.45, pz, fx, fz, PED_W, PED_H, { pole: 0.055 });
      }
      out.crossingSigns++; out.signs++;
      if (sg) {
        if (!K) {
          headPed(px - nx * 0.0, WALK_Y + 2.0, pz, -nx, -nz, c.id);          // faces across the road
          cabinet(px + q.tx * side * 0.16, WALK_Y + 1.0, pz + q.tz * side * 0.16, Math.atan2(q.tx, q.tz));
        }
        out.pedPoles.push({ x: px, z: pz, cross: c.id });
      }
    }
  }

  // ================================================================ lens instanced meshes + per-frame states
  const mkLens = (geo, hexes) => hexes.map((c) => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.7), toneMapped: false });
    const list = geo === lensGeo ? heads.filter((h) => h.kind === 'veh') : heads.filter((h) => h.kind === 'ped');
    const im = new THREE.InstancedMesh(geo, m, Math.max(1, list.length)); im.frustumCulled = false; im.count = list.length; ctx.addStatic(im); ctx.noOutline(im); ctx.noBatch(im);
    return { im, list };
  });
  const vLens = mkLens(lensGeo, ['#ff2a1a', '#ffb31a', '#22e05a']), pLens = mkLens(pedGeo, ['#ff2a1a', '#33e86a']);
  { let vi = 0, pi = 0; heads.forEach((h, i) => { h.li = h.kind === 'veh' ? vi++ : pi++; h.ci = i; }); }       // the instance of a head in its lens meshes (li) and in the countdown mesh (ci * 2, ci * 2 + 1)
  const D = new THREE.Object3D();
  // Per head the 'on' (scale 1) and 'off' (scale 0.001) matrix of every lens is composed ONCE (the same D.updateMatrix() values the per-frame composition produced), the state of every
  // signal approach / crossing is computed once per frame and compared as a small code: the frame (and the 100 steps of the start simulation) no longer build string keys and matrices
  // for thousands of heads. The lenses show exactly what they showed.
  const prep = (list, n, dy) => list.map((h) => {
    const on = [], off = [];
    for (let k = 0; k < n; k++) {
      D.position.set(h.x, h.y + dy(k), h.z); D.rotation.set(0, Math.atan2(h.dx, h.dz), 0);
      D.scale.setScalar(1); D.updateMatrix(); on.push(D.matrix.clone());
      D.scale.setScalar(0.001); D.updateMatrix(); off.push(D.matrix.clone());
    }
    return { on, off, last: -1 };
  });
  const VH = prep(vLens[0].list, 3, (k) => (1 - k) * 0.3), PH = prep(pLens[0].list, 2, (k) => (0.5 - k) * 0.24);
  // KNOCKABLE poles (ctx.knock): the lens instances stay at their real pose for good and the state is a COLOUR (lit = white, off = dark glass), so core/knock.js owns the matrices of a head that flies and
  // no state change ever writes one back; without ctx.knock a lens is switched by its scale as it always was
  const KN = !!ctx.knock, LIT = new THREE.Color(1, 1, 1), DARK = new THREE.Color(0.02, 0.02, 0.02);
  if (KN) {
    for (const [lens, H, n] of [[vLens, VH, 3], [pLens, PH, 2]]) for (let k = 0; k < n; k++) {
      for (let i = 0; i < H.length; i++) { lens[k].im.setMatrixAt(i, H[i].on[k]); lens[k].im.setColorAt(i, DARK); }
      lens[k].im.instanceMatrix.needsUpdate = true; if (lens[k].im.instanceColor) lens[k].im.instanceColor.needsUpdate = true;
    }
  }
  const vUnique = [], vKey = new Map(), vIdx = vLens[0].list.map((h) => { const k = h.sig + '#' + h.ap; let j = vKey.get(k); if (j === undefined) { j = vUnique.length; vKey.set(k, j); vUnique.push(h); } return j; });
  const pUnique = [], pKey = new Map(), pIdx = pLens[0].list.map((h) => { let j = pKey.get(h.cross); if (j === undefined) { j = pUnique.length; pKey.set(h.cross, j); pUnique.push(h.cross); } return j; });
  const vStates = new Array(vUnique.length), pStates = new Array(pUnique.length);
  const codes = new Map(), codeOf = (s) => { let c = codes.get(s); if (c === undefined) { c = codes.size; codes.set(s, c); } return c; };
  const displayDue = createSignalDisplayClock(graph, 2);
  const setLens = (t) => {
    if (!displayDue(t)) return;
    for (let j = 0; j < vUnique.length; j++) vStates[j] = graph.signalState(vUnique[j].sig, vUnique[j].ap, t);
    for (let j = 0; j < pUnique.length; j++) pStates[j] = graph.pedState(pUnique[j], t);
    for (let i = 0; i < VH.length; i++) {
      const e = VH[i], st = vStates[vIdx[i]], code = codeOf(st);
      if (e.last === code) continue; e.last = code;
      for (let k = 0; k < 3; k++) {
        const on = (k === 0 && st === 'red') || (k === 1 && st === 'amber') || (k === 2 && st === 'green');
        if (KN) { vLens[k].im.setColorAt(i, on ? LIT : DARK); vLens[k].im.instanceColor.needsUpdate = true; continue; }
        vLens[k].im.setMatrixAt(i, on ? e.on[k] : e.off[k]); vLens[k].im.instanceMatrix.needsUpdate = true;
      }
    }
    const flashHalf = Math.floor(t * 2) % 2 === 0;
    for (let i = 0; i < PH.length; i++) {
      const e = PH[i], st = pStates[pIdx[i]], flashOn = st === 'flash' && flashHalf, code = codeOf(st) * 2 + (flashOn ? 1 : 0);
      if (e.last === code) continue; e.last = code;
      for (let k = 0; k < 2; k++) {
        const on = (k === 0 && st === 'dont') || (k === 1 && (st === 'walk' || flashOn));
        if (KN) { pLens[k].im.setColorAt(i, on ? LIT : DARK); pLens[k].im.instanceColor.needsUpdate = true; continue; }
        pLens[k].im.setMatrixAt(i, on ? e.on[k] : e.off[k]); pLens[k].im.instanceMatrix.needsUpdate = true;
      }
    }
  };
  setLens(0); ctx.onUpdate((dt, t) => setLens(t));
  out.countdowns = buildCountdowns(ctx, heads, graph, poles);
  out.headList = heads.map((h) => ({ kind: h.kind, sig: h.sig || null, x: h.x, y: h.y, z: h.z, dx: h.dx, dz: h.dz }));

  // ================================================================ road signs (blue 'P' parking squares at the parking pockets; round signs have alpha corners)
  const roadSign = (tex, x, z, nx, nz, size = 0.7, h = 2.75, round = false) => {
    if(net.cover(x,z,{})>-.3)return;
    if (K) K.signPost({ x, z, nx, nz, h, r: 0.045, tex, w: size, ht: size, my: h - size / 2 - 0.05, mount: { round } });
    else { post(x, z, h, 0.045); panels.mount(poles, tex, x, WALK_Y + h - size / 2 - 0.05, z, nx, nz, size, size, { pole: 0.045, round }); }
    out.signs++;
  };

  // ================================================================ street-name and house-number plates (plates.js)
  buildPlates(ctx, net, panels, out, { isOwned: opts.isOwned, post, poles });

  // red-white chevron plates on posts at the traffic islands (docs/research/streets.md summary 7, photos P08 P79 P84): one at each end of every island polygon
  out.islandPosts = 0;
  for (const a of AREAS) {
    if (a.hw !== 'traffic_island') continue;
    for (const p of a.polys) {
      const o = p.o; let best = null, far = null;                          // the two vertices farthest apart = the tips of the island
      for (let i = 0; i < o.length; i += 2) for (let j = i + 2; j < o.length; j += 2) { const d = Math.hypot(o[i] - o[j], o[i + 1] - o[j + 1]); if (!best || d > best) { best = d; far = [[o[i], o[i + 1]], [o[j], o[j + 1]]]; } }
      if (!far || best < 5) continue;
      let cx = 0, cz = 0; for (let i = 0; i < o.length; i += 2) { cx += o[i]; cz += o[i + 1]; } cx /= o.length / 2; cz /= o.length / 2;
      for (const [x, z] of far) {
        let nx = x - cx, nz = z - cz; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;                   // pointing out of the island along its axis
        const px = x - nx * 0.5, pz = z - nz * 0.5;
        if(net.cover(px,pz,{})>-.3)continue;
        if (K) K.signPost({ x: px, z: pz, nx, nz, h: 1.7, r: 0.035, tex: chevTex, w: 0.4, ht: 0.8, my: 0.15 + 1.35 - WALK_Y, mount: { kind: 'plate' }, rec: { mass: 15, anchored: 8 } });
        else { post(px, pz, 1.7, 0.035); panels.mount(poles, chevTex, px, 0.15 + 1.35, pz, nx, nz, 0.4, 0.8, { pole: 0.035, kind: "plate" }); }
        out.islandPosts++;
      }
    }
  }
  /** a tall bay sign (blue P over a plate, 0.6 x 0.9) on a 2.6 m post: tallSign(tex, x, z, nx, nz) with (nx, nz) = the face normal (towards the approaching traffic) */
  out.tallSign = (tex, x, z, nx, nz, wd = 0.6, ht = 0.9, H = 2.6) => {
    if(net.cover(x,z,{})>-.3)return;
    if (K) K.signPost({ x, z, nx, nz, h: H, r: 0.045, tex, w: wd, ht, my: H - ht / 2 - 0.08 });
    else { post(x, z, H, 0.045); panels.mount(poles, tex, x, WALK_Y + H - ht / 2 - 0.08, z, nx, nz, wd, ht, { pole: 0.045 }); }
    out.signs++;
  };
  out.roadSign = roadSign; out.panels = panels; out.signTex = { park: parkTex, bike: bikeTex, ped: pedSign, speed: speedTex, lane: laneTex, taxi: taxiTex, coach: coachTex, laneSize: [LANE_W, LANE_H] };
  return out;
}
export { groupState, pedGroupState, midState, midPed };
