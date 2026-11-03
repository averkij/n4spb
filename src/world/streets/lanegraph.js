// streets/lanegraph.js - the road LOGIC for the traffic and people modules (pure data, no three.js):
//   lanes       directed lane centrelines of every drivable way, in the driving direction (right-hand traffic), one record per way edge
//               (between two junction nodes) and lane, trimmed at the junction mouths (stop line / after the zebra)
//   junctions   nodes with >= 3 arms (and the degree-2 joints, trivial: true): incoming / outgoing lanes, connector curves, signal id
//   connectors  curves through the junction box from an incoming lane to an outgoing lane (straight / left / right)
//   stopLines   one per incoming lane at a junction + per signalised mid-block crossing (s = distance from the lane start)
//   signals     { id, x, z, approaches: [{ index, bearing, group, lanes, crossing }] }; signalState / pedState are PURE functions of t
// A lane: { id, road (OSM way id), way, dir (+1 with the polyline / -1 against), idx (0 = right-most lane in its travel direction), width,
//           rank, hw, name, pts: [[x,z]...], len, from, to (node ids | null), speed (m/s) }
import { wrapPI, clamp, PointGrid } from './util.js';
import { wayAt } from './net.js';
import { prepWay } from './surface.js';
import { latAt } from './lanes.js';
import { SIGNALS } from '../data/city.js';

const SPEED = { 4: 13.5, 3: 12, 2: 11, 1: 8, 0: 4.5 };            // free speed by rank (m/s): 40-50 km/h on the avenue, 30 on side streets

// ------------------------------------------------------------------ signal plan (shared by every signalised node; docs/research/transport.md section 8: cycles of 100-120 s, green 50-60 s,
// pedestrian phase 30-40 s with a countdown)
export const CYCLE = 110;
const SPEED_NOTE = 'vehicle phases: group 0 (the through street, Nevsky) green 0-54, amber 54-57; group 1 (the cross street) green 62-98, amber 98-101';
/** vehicle head state of group g (0 = through street, 1 = cross street) at time t for a plan offset ofs */
export function groupState(g, t, ofs = 0) {
  const u = (((t + ofs) % CYCLE) + CYCLE) % CYCLE;
  if (g === 0) return u < 54 ? 'green' : u < 57 ? 'amber' : 'red';
  return u >= 62 && u < 98 ? 'green' : u >= 98 && u < 101 ? 'amber' : 'red';
}
/** seconds until the head of group g changes its colour (the number on the countdown timer: remaining green / remaining red) */
export function groupRemain(g, t, ofs = 0) {
  const u = (((t + ofs) % CYCLE) + CYCLE) % CYCLE, edges = g === 0 ? [0, 54, 57] : [62, 98, 101];
  let best = 1e9; for (const e of edges) { const d = ((e - u) % CYCLE + CYCLE) % CYCLE; if (d > 0 && d < best) best = d; }
  return Math.ceil(best);
}
/** pedestrian head of a crossing over an arm of group g: walk while that group's vehicles are red and the other group has green, flashing green for the last 7 s */
export function pedGroupState(g, t, ofs = 0) {
  const u = (((t + ofs) % CYCLE) + CYCLE) % CYCLE;
  if (g === 0) return u >= 64 && u < 91 ? 'walk' : u >= 91 && u < 98 ? 'flash' : 'dont';      // crossing a through-street arm: while the cross street runs
  return u >= 2 && u < 47 ? 'walk' : u >= 47 && u < 54 ? 'flash' : 'dont';                    // crossing a cross-street arm: while the through street runs
}
export function pedRemain(g, t, ofs = 0) {
  const u = (((t + ofs) % CYCLE) + CYCLE) % CYCLE, edges = g === 0 ? [64, 98] : [2, 54];
  let best = 1e9; for (const e of edges) { const d = ((e - u) % CYCLE + CYCLE) % CYCLE; if (d > 0 && d < best) best = d; }
  return Math.ceil(best);
}
/** stand-alone pedestrian signal (mid-block crossing): vehicles red 47..60, walk 49..56, flash 56..59 of a 60 s cycle */
export const midState = (t, ofs = 0) => { const u = (((t + ofs) % 60) + 60) % 60; return u < 44 ? 'green' : u < 47 ? 'amber' : 'red'; };
export const midPed = (t, ofs = 0) => { const u = (((t + ofs) % 60) + 60) % 60; return u >= 49 && u < 56 ? 'walk' : u >= 56 && u < 59 ? 'flash' : 'dont'; };

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const polyLen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };

function bezier(p0, t0, p3, t3, n = 14, kf = 0.4) {
  const d = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]), k = d * kf;
  const p1 = [p0[0] + t0[0] * k, p0[1] + t0[1] * k], p2 = [p3[0] - t3[0] * k, p3[1] - t3[1] * k];
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, e = u * u * u;
    out.push([a * p0[0] + b * p1[0] + c * p2[0] + e * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + e * p3[1]]);
  }
  return out;
}

export function buildLaneGraph(net) {
  const lanes = [], laneById = new Map(), junctions = [], connectors = [], stopLines = [], signals = [];
  const graphStats = {};
  for (const w of net.ways) prepWay(w);

  // ---- arm geometry: where the lanes end (stop line) and restart (beyond the zebra) on every arm of every node
  const crossOf = new Map(); for (const c of net.crossings) { let l = crossOf.get(c.road); if (!l) crossOf.set(c.road, (l = [])); l.push(c); }
  for (const nd of net.nodes) {
    const hCross = Math.max(0, ...nd.arms.map((a) => a.hb ?? a.w.hb[0]));
    for (const a of nd.arms) {
      a.node = nd;
      a.cross = null;
      let best = 1e9;
      for (const c of crossOf.get(a.w) || []) {
        const d = (c.s - a.sN) * a.along;
        if (!(d > 2 && d < 34 && d < best)) continue;
        // a crossing belongs to the nearest node of its way
        let dn = 1e9; for (const q of a.w.nodes) dn = Math.min(dn, Math.abs(c.s - q.s));
        if (d > dn + 0.8) continue;
        best = d; a.cross = c;
      }
      if (nd.arms.length < 3) {
        // OSM way seams can change lane width/offset by 1-2 m. Joining the
        // offset endpoints sideways at the node makes a car swing left/right
        // almost in place. Leave longitudinal room for a tangent-continuous
        // transition, also at ordinary two-arm bends. Short links share the
        // available room through the existing mouth-shortening rule below.
        a.dIn = a.dOut = nd.arms.length === 2 ? Math.max(8,hCross*1.5) : 0;
        continue;
      }
      if (a.cross) { const half = clamp(a.cross.w + 1, 3.5, 6) / 2; a.dIn = best + half + 1.5; a.dOut = best + half + 0.4; }
      else { const m = Math.max(a.box || 0, hCross + 1.5, 6); a.dIn = m + 1.2; a.dOut = m + 0.5; }
    }
  }
  const armOf = (nd, w, along) => nd.arms.find((a) => a.w === w && a.along === along) || null;

  // ---- lanes
  for (const w of net.ways) {
    if (w.pedestrianOnly) continue;
    const { nF, nB } = w.lanes, K = nF + nB;
    // stations along the way: start, interior nodes, end
    const st = [];
    if (!w.nodes.length || w.nodes[0].k !== 0) st.push({ s: 0, node: null });
    for (const q of w.nodes) st.push({ s: q.s, node: q.node });
    if (!w.nodes.length || w.nodes[w.nodes.length - 1].k !== w.n - 1) st.push({ s: w.L, node: null });
    for (let e = 0; e + 1 < st.length; e++) {
      const A = st[e], B = st[e + 1];
      for (const dir of [1, -1]) {
        const nLane = dir > 0 ? nF : nB; if (!nLane) continue;
        const stS = dir > 0 ? A : B, enS = dir > 0 ? B : A;
        const aS = stS.node ? armOf(stS.node, w, dir) : null, aE = enS.node ? armOf(enS.node, w, -dir) : null;
        let dOut = aS ? aS.dOut : 0, dIn = aE ? aE.dIn : 0;
        const avail = Math.abs(enS.s - stS.s);
        if (dOut + dIn > 0 && dOut + dIn + 6 > avail) { const k = Math.max(0, avail - 6) / (dOut + dIn); dOut *= k; dIn *= k; }     // two junctions close together: shorten both mouths
        const sStart = stS.s + dir * dOut, sEnd = enS.s - dir * dIn;
        if ((sEnd - sStart) * dir < 2.5) continue;
        for (let kk = 0; kk < nLane; kk++) {
          const j = dir > 0 ? nB + kk : kk;                            // boundary index of the lane (left to right across the carriageway)
          const idx = dir > 0 ? nLane - 1 - kk : kk;                   // 0 = right-most in the travel direction
          const pts = [];
          const n = Math.max(2, Math.ceil(Math.abs(sEnd - sStart) / 4) + 1);
          for (let i = 0; i < n; i++) {
            const s = sStart + (sEnd - sStart) * i / (n - 1), q = wayAt(w, s), off = (latAt(w, q, j) + latAt(w, q, j + 1)) / 2;
            pts.push([q.x - q.tz * off, q.z + q.tx * off]);
          }
          const id = `L${w.id}:${e}:${dir > 0 ? 'f' : 'b'}${idx}`;
          const lane = { id, road: w.id, way: w.i, dir, idx, n: nLane, width: w.bnd[0].lw, rank: w.rank, hw: w.hw, name: w.name, pts, len: polyLen(pts),
            from: stS.node ? stS.node.id : null, to: enS.node ? enS.node.id : null, armStart: aS, armEnd: aE, speed: SPEED[w.rank] ?? 8, s0: sStart, s1: sEnd, oneway: !!w.oneway };
          lanes.push(lane); laneById.set(id, lane);
        }
      }
    }
  }
  const bearingOf = (dx, dz) => ((Math.atan2(dx, -dz) * 180 / Math.PI) + 360) % 360;
  const tanAt = (pts, i, fwd) => { const a = pts[fwd ? i - 1 : i], b = pts[fwd ? i : i + 1]; const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };

  // ---- junctions, connectors, stop lines
  const sigNodes = SIGNALS.map((s) => ({ ...s }));
  const lanesTo = new Map(), lanesFrom = new Map();                    // lanes by node (was a scan of every lane for every node: 0.5 s)
  for (const l of lanes) {
    if (l.to) { let a = lanesTo.get(l.to); if (!a) lanesTo.set(l.to, (a = [])); a.push(l); }
    if (l.from) { let a = lanesFrom.get(l.from); if (!a) lanesFrom.set(l.from, (a = [])); a.push(l); }
  }
  // cluster followers (west only): Nevsky and Sadovaya cross in a cluster of four nodes 10-15 m apart (two carriageways each); OSM signals only two of them, so the Sadovaya cars crossed the first
  // Nevsky carriageway unchecked and stopped on the 6 m micro lane between the carriageways. An unsignalised node of 4 arms that are all main streets and lies within 20 m of a signalised node
  // joins that signal as a group-1 / group-0 node (same complex, same plan): the stop lines of its cross arm sit before the first Nevsky carriageway, the micro lanes inside are passed on green.
  const sigGrid = new PointGrid(16); for (const s of sigNodes) sigGrid.add(s.x, s.z, s);          // (every node asked every SIGNALS record)
  const sigAtNode = new Set();
  for (const nd of net.nodes) if (nd.arms.length >= 3 && (sigGrid.any(nd.x, nd.z, 14) || nd.arms.some((a) => a.cross && a.cross.signalised))) sigAtNode.add(nd);
  const follows = (nd) => nd.x < -600 && nd.arms.length >= 4 && nd.arms.filter((a) => a.w.rank >= 3).length >= 4 && !sigAtNode.has(nd) && [...sigAtNode].some((o) => Math.hypot(o.x - nd.x, o.z - nd.z) < 20);
  for (const nd of net.nodes) {
    const arms = nd.arms; if (arms.length < 2) continue;
    const incoming = new Map(), outgoing = new Map();
    for (const l of lanesTo.get(nd.id) || []) { const k = l.armEnd; if (!k) continue; (incoming.get(k) || incoming.set(k, []).get(k)).push(l); }
    for (const l of lanesFrom.get(nd.id) || []) { const k = l.armStart; if (!k) continue; (outgoing.get(k) || outgoing.set(k, []).get(k)).push(l); }
    const maxRank = Math.max(...arms.map((a) => a.w.rank));
    // signalised? a SIGNALS node close to the junction, or a signalised crossing on one of its arms
    const sn = sigGrid.first(nd.x, nd.z, 14);
    const sigX = arms.some((a) => a.cross && a.cross.signalised);
    const J = { id: nd.id, x: nd.x, z: nd.z, lanes: [], out: [], signal: null, trivial: arms.length < 3, rank: maxRank, connectors: [], arms: [] };
    if (arms.length >= 3 && (sn || sigX || follows(nd))) {
      // group: arms along the axis of the highest-rank road are group 0
      const ref = arms.reduce((b, a) => (a.w.rank > b.w.rank || (a.w.rank === b.w.rank && a.w.w > b.w.w) ? a : b));
      const refAxis = Math.atan2(ref.dz, ref.dx);
      const sig = { id: sn ? sn.id : 'S' + nd.id, x: nd.x, z: nd.z, node: nd.id, ofs: 0, cycle: CYCLE, approaches: [], crossings: [] };
      arms.forEach((a, i) => {
        const g = Math.abs(Math.sin(Math.atan2(a.dz, a.dx) - refAxis)) < 0.55 ? 0 : 1;
        a.group = g; a.index = i;
        sig.approaches.push({ index: i, bearing: bearingOf(-a.dx, -a.dz), group: g, lanes: (incoming.get(a) || []).map((l) => l.id), crossing: a.cross ? a.cross.id : null, name: a.w.name });
        if (a.cross) sig.crossings.push({ id: a.cross.id, approach: i, group: g });
      });
      J.signal = sig.id; signals.push(sig);
    }
    arms.forEach((a, i) => {
      const inl = (incoming.get(a) || []).sort((p, q) => p.idx - q.idx), outl = (outgoing.get(a) || []).sort((p, q) => p.idx - q.idx);
      a.inl = inl; a.outl = outl;
      J.arms.push({ index: i, bearing: bearingOf(a.dx, a.dz), road: a.w.id, name: a.w.name, rank: a.w.rank, crossing: a.cross ? a.cross.id : null, in: inl.map((l) => l.id), out: outl.map((l) => l.id) });
      for (const l of inl) {
        J.lanes.push(l.id);
        if (!J.trivial) {
          const end = l.pts[l.pts.length - 1];
          stopLines.push({ lane: l.id, s: l.len, x: end[0], z: end[1], signal: J.signal, approach: i, give: l.rank < maxRank, junction: J.id, crossing: a.cross ? a.cross.id : null });
        }
      }
      for (const l of outl) J.out.push(l.id);
    });
    // connectors
    for (const A of arms) for (const B of arms) {
      if (A === B || !A.inl.length || !B.outl.length) continue;
      const li = A.inl[0], lo = B.outl[0];
      const vin = tanAt(li.pts, li.pts.length - 1, true), vout = tanAt(lo.pts, 0, false);
      const cross = vin[0] * vout[1] - vin[1] * vout[0], dot = vin[0] * vout[0] + vin[1] * vout[1], th = Math.atan2(cross, dot);
      if (Math.abs(th) > 2.6) continue;                              // no U-turns
      const turn = Math.abs(th) < 0.6 ? 'straight' : th > 0 ? 'right' : 'left';
      // does a straight arm exist for this approach?
      const hasStraight = arms.some((X) => X !== A && X.outl.length && (() => { const t2 = tanAt(X.outl[0].pts, 0, false); const c2 = vin[0] * t2[1] - vin[1] * t2[0], d2 = vin[0] * t2[0] + vin[1] * t2[1]; return Math.abs(Math.atan2(c2, d2)) < 0.6; })());
      const n = A.inl.length, m = B.outl.length;
      const pairs = [];
      if (turn === 'straight') for (const l of A.inl) pairs.push([l, B.outl[Math.min(l.idx, m - 1)]]);
      else if (turn === 'right') { pairs.push([A.inl[0], B.outl[0]]); }
      else { pairs.push([A.inl[n - 1], B.outl[m - 1]]); if (!hasStraight && n > 1) pairs.push([A.inl[Math.max(0, n - 2)], B.outl[Math.max(0, m - 2)]]); }
      for (const [a, b] of pairs) {
        if (!a || !b) continue;
        const p0 = a.pts[a.pts.length - 1], p3 = b.pts[0], t0 = tanAt(a.pts, a.pts.length - 1, true), t3 = tanAt(b.pts, 0, false);
        let pts = bezier(p0, t0, p3, t3, turn === 'straight' ? 8 : 14);
        // a turn whose curve swings out of the carriageway (the inside of a right turn between two streets at an odd angle: Rastrelli Sq. / Kvarengi Lane at Smolny, Liteyny / Bolsheokhtinsky
        // approaches): try wider and tighter curves, keep the one that stays best on the asphalt (the test of traffic-test.mjs: more than 2.2 m outside = off-lane)
        if (nd.arms.length >= 3 && net.cover) {
          const worst = (q) => { let w = 0; for (const p of q) w = Math.min(w, net.cover(p[0], p[1], {})); return w; };
          let w0 = worst(pts);
          if (w0 < -2.2) for (const kf of [0.6, 0.8, 1.0, 0.2]) { const alt = bezier(p0, t0, p3, t3, turn === 'straight' ? 8 : 14, kf), w1 = worst(alt); if (w1 > w0) { pts = alt; w0 = w1; if (w0 >= -2.2) break; } }
        }
        const c = { id: `C${a.id}>${b.id}`, from: a.id, to: b.id, junction: J.id, turn, pts, len: polyLen(pts), signal: J.signal, approach: A.index ?? arms.indexOf(A), give: a.rank < maxRank };
        connectors.push(c); J.connectors.push(c.id);
      }
    }
    junctions.push(J);
  }

  // ---- micro gaps: two junction nodes so close together that no lane fits between them (node clusters of the OSM data, the 6 m bridge ways between the two embankment crossings of a bridge:
  // Kazan Bridge, Green Bridge ...): the lanes that END in the first node and have no way on, and the lanes that START in the second and have no way in, are linked by straight connectors
  // (traffic would otherwise dead-end in the middle of Nevsky)
  {
    const hasOut = new Set(connectors.map((c) => c.from)), hasIn = new Set(connectors.map((c) => c.to));
    const orph = lanes.filter((l) => l.from && !hasIn.has(l.id));
    const slOf = new Map(); for (const q of stopLines) if (!slOf.has(q.lane)) slOf.set(q.lane, q);
    const jOf = new Map(junctions.map((j) => [j.id, j]));
    const used = new Set();
    let n = 0;
    for (const T of lanes) {
      if (!T.to || hasOut.has(T.id)) continue;
      const e = T.pts[T.pts.length - 1], te = tanAt(T.pts, T.pts.length - 1, true);
      let best = null;
      for (const O of orph) {
        const st = O.pts[0], dx = st[0] - e[0], dz = st[1] - e[1], d = Math.hypot(dx, dz); if (d > 34 || d < 0.3) continue;
        const to = tanAt(O.pts, 0, false); if (te[0] * to[0] + te[1] * to[1] < 0.88 || (dx * te[0] + dz * te[1]) / d < 0.7) continue;     // the same direction, ahead
        const lat = Math.abs(dx * -te[1] + dz * te[0]); if (lat > 3.6 + 0.12 * d || O.rank < T.rank - 1 || O.rank > T.rank + 1) continue;
        const sc = d + lat * 2 + (used.has(O.id) ? 6 : 0); if (!best || sc < best.sc) best = { O, sc };
      }
      if (!best) continue;
      const O = best.O; used.add(O.id);
      const p0 = e, p3 = O.pts[0], t3 = tanAt(O.pts, 0, false), sl = slOf.get(T.id);
      const pts = bezier(p0, te, p3, t3, 8);
      const c = { id: `CB${T.id}>${O.id}`, from: T.id, to: O.id, junction: T.to, turn: 'straight', pts, len: polyLen(pts), signal: sl ? sl.signal : null, approach: sl ? sl.approach : 0, give: sl ? !!sl.give : false };
      connectors.push(c); const J = jOf.get(T.to); if (J) J.connectors.push(c.id); n++;
    }
    graphStats.microGaps = n;
  }

  // ---- every incoming lane of a junction leaves it somewhere: a lane that the turn rules gave no connector (the right-most lane of a wide approach that only the right turn may use, and
  // the right-most lane of the straight street when it holds no right turn) is connected to the nearest outgoing lane of the junction (smallest turn, no U turn)
  {
    const outFrom = new Set(connectors.map((c) => c.from));
    let n = 0;
    for (const J of junctions) {
      if (J.trivial || !J.lanes.length || !J.out.length) continue;
      for (const lid of J.lanes) {
        if (outFrom.has(lid)) continue;
        const A = laneById.get(lid), vin = tanAt(A.pts, A.pts.length - 1, true);
        let best = null;
        for (const oid of J.out) {
          const B = laneById.get(oid); if (!B || B.way === A.way && B.dir === -A.dir) continue;
          const vout = tanAt(B.pts, 0, false), th = Math.atan2(vin[0] * vout[1] - vin[1] * vout[0], vin[0] * vout[0] + vin[1] * vout[1]);
          if (Math.abs(th) > 2.6) continue;
          const sc = Math.abs(th) + Math.abs(A.idx - B.idx) * 0.15; if (!best || sc < best.sc) best = { B, th, sc };
        }
        if (!best) continue;
        const B = best.B, p0 = A.pts[A.pts.length - 1], p3 = B.pts[0], t3 = tanAt(B.pts, 0, false), sl = stopLines.find((q) => q.lane === lid);
        const turn = Math.abs(best.th) < 0.6 ? 'straight' : best.th > 0 ? 'right' : 'left', pts = bezier(p0, vin, p3, t3, turn === 'straight' ? 8 : 14);
        const c = { id: `CX${lid}>${B.id}`, from: lid, to: B.id, junction: J.id, turn, pts, len: polyLen(pts), signal: sl ? sl.signal : J.signal, approach: sl ? sl.approach : 0, give: sl ? !!sl.give : false };
        connectors.push(c); J.connectors.push(c.id); outFrom.add(lid); n++;
      }
    }
    graphStats.exitConnectors = n;
  }

  // ---- stand-alone signalised crossings (mid-block): pedestrian signal that halts both directions
  const midSignals = [];
  const sigCrossIds = new Set(); for (const s of signals) for (const q of s.crossings || []) sigCrossIds.add(q.id);        // (was: every signal and every node scanned per crossing, every lane per direction)
  const armCross = new Set(); for (const n of net.nodes) if (n.arms.length >= 3) for (const a of n.arms) if (a.cross) armCross.add(a.cross);
  const lanesByWay = new Map(); for (const l of lanes) { let a = lanesByWay.get(l.way); if (!a) lanesByWay.set(l.way, (a = [])); a.push(l); }
  for (const c of net.crossings) {
    if (!c.signalised) continue;
    if (sigCrossIds.has(c.id)) continue;
    if (armCross.has(c)) continue;
    const sig = { id: 'P' + c.id, x: c.x, z: c.z, mid: true, ofs: Math.floor(((c.x * 7 + c.z * 3) % 60 + 60) % 60), cycle: 60, approaches: [], crossings: [{ id: c.id, approach: 0, group: 0 }] };
    for (const dir of [1, -1]) {
      const cand = (lanesByWay.get(c.road.i) || []).filter((l) => l.dir === dir && l.s0 !== undefined && ((c.s - l.s0) * dir > 0) && ((l.s1 - c.s) * dir > 0));
      const half = clamp(c.w + 1, 3.5, 6) / 2;
      const ids = [];
      for (const l of cand) {
        // stop line: 1.5 m before the near edge of the zebra, measured along the lane
        const sLine = Math.abs(c.s - l.s0) - half - 1.5;
        if (sLine < 1) continue;
        let acc = 0, x = l.pts[0][0], z = l.pts[0][1];
        for (let i = 1; i < l.pts.length; i++) { const d = Math.hypot(l.pts[i][0] - l.pts[i - 1][0], l.pts[i][1] - l.pts[i - 1][1]); if (acc + d >= sLine) { const f = (sLine - acc) / d; x = l.pts[i - 1][0] + (l.pts[i][0] - l.pts[i - 1][0]) * f; z = l.pts[i - 1][1] + (l.pts[i][1] - l.pts[i - 1][1]) * f; break; } acc += d; }
        stopLines.push({ lane: l.id, s: sLine, x, z, signal: sig.id, approach: sig.approaches.length, give: false, junction: null, crossing: c.id });
        ids.push(l.id);
      }
      sig.approaches.push({ index: sig.approaches.length, bearing: bearingOf(c.tx * dir, c.tz * dir), group: 0, lanes: ids, crossing: c.id });
    }
    signals.push(sig); midSignals.push(sig);
  }

  // junction offsets: signals within 45 m of each other belong to ONE complex (the two carriageways of Nevsky crossing Liteyny / Vladimirsky, the corners of the square) and share
  // their plan; complexes are offset against each other as a green wave of sorts
  {
    const cl = signals.filter((s) => !s.mid).map((s, i) => ({ s, c: i }));
    const find = (i) => (cl[i].c === i ? i : (cl[i].c = find(cl[i].c)));
    for (let i = 0; i < cl.length; i++) for (let j = i + 1; j < cl.length; j++) if (Math.hypot(cl[i].s.x - cl[j].s.x, cl[i].s.z - cl[j].s.z) < 45) cl[find(j)].c = find(i);
    const groups = new Map(); cl.forEach((e, i) => { const r = find(i); let g = groups.get(r); if (!g) groups.set(r, (g = [])); g.push(e.s); });
    for (const g of groups.values()) {
      const cx = g.reduce((a, s) => a + s.x, 0) / g.length, cz = g.reduce((a, s) => a + s.z, 0) / g.length, ofs = (Math.round(cx * 0.045 + cz * 0.03) * 9 % CYCLE + CYCLE) % CYCLE;
      for (const s of g) { s.ofs = ofs; s.complex = Math.round(cx) + ',' + Math.round(cz); }
    }
  }
  const sigById = new Map(signals.map((s) => [s.id, s]));
  const signalState = (id, approachIndex, t) => {
    const s = sigById.get(id); if (!s) return 'green';
    if (s.mid) return midState(t, s.ofs);
    const a = s.approaches[approachIndex]; if (!a) return 'green';
    return groupState(a.group, t, s.ofs);
  };
  /** { state, remain } of the vehicle head of an approach: remain = seconds to the next colour change (the countdown number) */
  const signalInfo = (id, approachIndex, t) => {
    const s = sigById.get(id); if (!s) return { state: 'green', remain: 99 };
    if (s.mid) { const u = (((t + s.ofs) % 60) + 60) % 60; return { state: midState(t, s.ofs), remain: Math.ceil(u < 44 ? 44 - u : u < 47 ? 47 - u : 60 - u) }; }
    const a = s.approaches[approachIndex]; if (!a) return { state: 'green', remain: 99 };
    return { state: groupState(a.group, t, s.ofs), remain: groupRemain(a.group, t, s.ofs) };
  };
  /** pedestrian head at a crossing (by crossing id): 'walk' | 'flash' | 'dont' (signalised) | 'free' (unsignalised zebra) */
  const sigOfCrossing = new Map();                                         // crossing id -> { s, c } (pedInfo runs for every head every frame: no scan of all signals)
  for (const s of signals) for (const c of s.crossings || []) if (!sigOfCrossing.has(c.id)) sigOfCrossing.set(c.id, { s, c });
  const pedState = (crossingId, t) => {
    const hit = sigOfCrossing.get(crossingId);
    if (hit) { const { s, c } = hit; return s.mid ? midPed(t, s.ofs) : pedGroupState(c.group, t, s.ofs); }
    return 'free';                                                         // unsignalised zebra: pedestrians cross when no car is close, cars give way
  };
  const pedInfo = (crossingId, t) => {
    const hit = sigOfCrossing.get(crossingId);
    if (hit) {
      const { s, c } = hit;
      if (s.mid) { const u = (((t + s.ofs) % 60) + 60) % 60; return { state: midPed(t, s.ofs), remain: Math.ceil(u < 49 ? 49 - u : u < 59 ? 59 - u : 60 - u + 49) }; }
      return { state: pedGroupState(c.group, t, s.ofs), remain: pedRemain(c.group, t, s.ofs) };
    }
    return { state: 'free', remain: 0 };
  };
  return { graphStats, lanes, laneById, junctions, connectors, stopLines, signals, signalState, pedState, signalInfo, pedInfo, signalById: (id) => sigById.get(id) || null };
}
export { sub };
