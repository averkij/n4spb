// traffic/sim.js (Saint Petersburg) - the car-following simulation on the lane graph of the streets module (pure data, no three.js: runs in node for tools/traffic-test.mjs).
//
// WHAT IT DOES
//   * Every lane of ctx.services.streets.lanes and every connector (the curve through a junction box) is a SEGMENT with an ordered list of vehicles.
//     A vehicle is positioned by the arclength `s` of its FRONT bumper on its segment; its rear lies `len` metres behind, possibly still on the previous segment (`trail`).
//   * Longitudinal control = IDM (intelligent driver model) against the nearest leader on the own segment / the chosen next connector / the exit lane, plus "virtual
//     obstacles": a stop line while its signal is red (amber only if the car can still stop comfortably), a give-way line while a conflicting stream has priority,
//     the end of a junction exit that is full (no box blocking), a bus stop (dwell 10-18 s), and a speed limit ahead for the curve of the connector.
//   * Junctions: every connector knows the connectors it crosses / merges with (polyline distance < 2.2 m). A car enters its connector only when no conflicting connector
//     is occupied and, if it has to yield (left turn, side street, lower rank, id tie-break), no priority vehicle reaches its stop line within GAP_T seconds.
//     A signalised junction only compares streams of the same signal group (the plan gives the groups exclusive greens, see streets-api.md).
//     A LANE DROP (two lanes of one carriageway going straight on into the same lane: three lanes into two) is a zipper: the lane that fed the
//     shared lane last waits while the head of the other lane stands at its line (before, the lane with the higher id starved and its queue grew across the bridge).
//   * Routing: a car picks a connector when it enters a lane (weights: straight 1 / right .38 / left .32 x road rank), never one that leads to a dead end.
//     Cars are born at the lane ends at the data edge (Poisson per source lane by road rank) and die at the sink ends: the network is an open system.
//   * REGIONAL simulation (opts.centre = () => [x, z]): only the lanes within `radius` (default 420 m, +90 m hysteresis) of the camera exist. A lane that enters the region is seeded with a
//     relaxed population, a lane whose upstream neighbours are outside is a boundary SOURCE (like the data edge), a vehicle that leaves the region on a lane whose exits are outside dies
//     there; a jump of the camera (metro, teleport) re-seeds and pre-rolls the new region. Without opts.centre the whole network is simulated (tools/traffic-test.mjs).
//   * Lane ids that occur twice in streets.lanes (a way that enters / leaves the data extent several times) are told apart by the geometry of their connectors and stop lines.
//   * DETERMINISTIC: the state is a function of the number of fixed steps (DT = 1/15 s) since the start; `advanceTo(t)` re-simulates from the seed when t goes backwards
//     (screenshots call window.__sim(t) which restarts at 0). The start state is a pre-populated, relaxed network (no empty streets at t = 0).
//   * Poses are produced for the renderer by a bicycle model (front / rear axle on the path); `x,z,rot` + the previous step `px,pz,prot` for interpolation.
//   * TRAMS (traffic/trams.js) run on the rails of streets.tram, on their own long `rail` segments (never in the active region list): they are in sim.vehicles (v.tram, negative ids), so the
//     collision net makes cars and trams see each other; opts.trams === false switches them off, opts.tramStops = the tram stop positions of the map.
//   * OPEN WATER (opts.wet(x, z) -> true over a waterway without a deck, asked only OUTSIDE the play area: opts.inPlay): a lane that reaches the data edge over such water (a road cut by the
//     extent in the middle of a river crossing) ends / begins on the last dry metre: cars leave and are born there, nobody drives on the water of the far scenery.
import { ARCH, PALETTE, KINDS_W, pickW, TAXI_KINDS, TAXI_WHITE, ARTIC, PLATES_COUNT, TROLLEY_ROUTES, BUS_ROUTES } from './fleetdata.js';
import { buildWireIndex } from './wireindex.js';
import { buildTramNet, createTrams } from './trams.js';

export const DT = 1 / 15;
const GAP_T = 3.8, S_LINE = 0.7, MICRO = 24;                      // MICRO: lanes shorter than this between two nodes of one junction cluster
const RANK_W = { 4: 1, 3: 0.9, 2: 0.6, 1: 0.2, 0: 0 };           // yard / service roads are not driven (their tiny mapped links cross main roads without a node)
const TURN_W = { straight: 1, right: 0.16, left: 0.05 };
const SPAWN_MEAN = { 4: 34, 3: 60, 2: 110, 1: 300 };            // seconds between cars per source lane at density 1 (the avenues carry the traffic; the side streets are quiet)
const SEED_SPACING = { 4: 72, 3: 92, 2: 150, 1: 290, 0: 1e9 };    // initial m per car per lane
const BUS_MEAN = 80;                                                 // seconds between buses per big source lane (idx 0)
const TROLLEY_MEAN = 42;                                             // seconds between trolleybuses per wired kerb lane (transport.md: one every 30-50 s per direction)
const TAXI_SHARE = 0.14, POLICE_SHARE = 0.004, AMB_SHARE = 0.004;
const BUS_MIX = [['bus', 46], ['artic', 16], ['midi', 22], ['dd', 9], ['coach', 4]];
const TOUR_STOP = /Дворцовая площадь|Исаакиев|Гостиный двор|Казанск|Адмиралтейск|Конюшенн/;      // the pick-up points of the sightseeing buses / coaches (west-life-furniture.md 3.5): they stop at these bays only

const hyp = (a, b, c) => c === undefined ? Math.sqrt(a * a + b * b) : Math.sqrt(a * a + b * b + c * c);      // (round 4, 2026-10-16: Math.hypot allocates in V8; the same values for two or three arguments)
const PROF = typeof process !== 'undefined' && !!process.env && !!process.env.SIM_PROF;

function mkSeg(kind, id, pts) {
  const n = pts.length, xs = new Float64Array(n), zs = new Float64Array(n), cum = new Float64Array(n);
  for (let i = 0; i < n; i++) { xs[i] = pts[i][0]; zs[i] = pts[i][1]; if (i) cum[i] = cum[i - 1] + hyp(xs[i] - xs[i - 1], zs[i] - zs[i - 1]); }
  return { kind, id, xs, zs, cum, n, len: cum[n - 1], veh: [], conns: [], okConns: [], stops: [], bus: [], reach: false, rank: 0, speed: 8, vmax: 99 };
}
const _p = { x: 0, z: 0, tx: 0, tz: 1 };
/** point + unit tangent at arclength s (linear extrapolation beyond both ends) */
function evalSeg(seg, s, o = _p) {
  const { xs, zs, cum, n } = seg;
  let lo = 0, hi = n - 1;
  if (s <= 0) hi = 1; else if (s >= seg.len) lo = n - 2;
  else while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
  const dx = xs[lo + 1] - xs[lo], dz = zs[lo + 1] - zs[lo], l = cum[lo + 1] - cum[lo] || 1e-9, f = (s - cum[lo]) / l;
  o.x = xs[lo] + dx * f; o.z = zs[lo] + dz * f; o.tx = dx / l; o.tz = dz / l;
  return o;
}
/** closest approach of two polylines sampled at ~1 m */
function sampleSeg(seg, step = 1) { const out = []; for (let s = 0; s <= seg.len + 1e-6; s += step) { const q = evalSeg(seg, Math.min(s, seg.len), {}); out.push(q.x, q.z); } return out; }
function minDist(a, b) { let m = 1e9; for (let i = 0; i < a.length; i += 2) for (let j = 0; j < b.length; j += 2) { const d = hyp(a[i] - b[j], a[i + 1] - b[j + 1]); if (d < m) m = d; } return m; }
/** minDist(a, b) <= d, leaving at the first pair that is close enough (the conflict test only needs the threshold, not the minimum) */
function within(a, b, d) { for (let i = 0; i < a.length; i += 2) for (let j = 0; j < b.length; j += 2) if (hyp(a[i] - b[j], a[i + 1] - b[j + 1]) <= d) return true; return false; }
void minDist;
function curveVmax(seg, vLane) {
  if (seg.n < 3) return vLane;
  let rmin = 1e9;
  for (let i = 1; i < seg.n - 1; i++) {
    const ax = seg.xs[i] - seg.xs[i - 1], az = seg.zs[i] - seg.zs[i - 1], bx = seg.xs[i + 1] - seg.xs[i], bz = seg.zs[i + 1] - seg.zs[i];
    const la = hyp(ax, az), lb = hyp(bx, bz); if (la < 0.4 || lb < 0.4) continue;
    const th = Math.abs(Math.atan2(ax * bz - az * bx, ax * bx + az * bz)); if (th < 1e-3) continue;
    rmin = Math.min(rmin, ((la + lb) / 2) / th);
  }
  return Math.min(vLane, Math.max(3.2, Math.sqrt(2.3 * rmin)));
}

/** a few right-turn curves of the lane graph cut the corner over the pavement (up to 4 m): push their interior points back onto the asphalt (finite-difference gradient of the road cover) */
function relaxConnector(pts, cover) {
  if (!cover || pts.length < 5) return pts;
  let worst = 1e9; for (const p of pts) worst = Math.min(worst, cover(p[0], p[1]));
  if (worst > -0.3) return pts;
  let q = pts.map((p) => [p[0], p[1]]);
  { const d = [q[0]]; for (let i = 1; i < q.length; i++) { const a = q[i - 1], b = q[i], n = Math.ceil(hyp(b[0] - a[0], b[1] - a[1]) / 1.0); for (let k = 1; k <= n; k++) d.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } q = d; }      // (a chord of 4 m would still cut across an island between two points)
  for (let it = 0; it < 24; it++) {
    for (let i = 1; i < q.length - 1; i++) {
      const [x, z] = q[i], c = cover(x, z);
      if (c > 0.6) continue;
      const gx = cover(x + 0.6, z) - cover(x - 0.6, z), gz = cover(x, z + 0.6) - cover(x, z - 0.6), gl = hyp(gx, gz);
      if (gl < 1e-3) continue;
      const step = Math.min(1.5, 0.75 - c);
      q[i][0] += gx / gl * step; q[i][1] += gz / gl * step;
    }
    if (it % 3 === 2) for (let i = 2; i < q.length - 2; i++) { q[i][0] = (q[i - 1][0] + 2 * q[i][0] + q[i + 1][0]) / 4; q[i][1] = (q[i - 1][1] + 2 * q[i][1] + q[i + 1][1]) / 4; }
  }
  let w2 = 1e9; for (const p of q) w2 = Math.min(w2, cover(p[0], p[1]));
  q.worst = w2;                                                    // (a hole in the asphalt that the path cannot avoid, e.g. a narrow island: the connector is used only when it is the only way)
  return q;
}

/** speed limit of a lane (m/s): the free speed of streets.lanes, lowered where the dossier (west-life-furniture.md 3.3) says so: squares 30 km/h, canal embankments 30, living streets 20, Neva embankments 40 */
function limitFor(l) {
  const nm = l.name || '', v = l.speed;
  if (l.hw === 'living_street') return Math.min(v, 5.5);
  if (/площадь|Дворцовый проезд|Конюшенная пл/i.test(nm) && l.rank < 4) return Math.min(v, 8.3);
  if (/набережная реки Мойки|набережная канала Грибоедова|набережная Лебяжьей|Зимней канавки|набережная реки Фонтанки/i.test(nm)) return Math.min(v, 8.3);
  if (/Дворцовая набережная|Адмиралтейская набережная|Университетская набережная|Английская набережная/i.test(nm)) return Math.min(v, 11);
  return v;
}

export function createSim(st, makeRng, opts = {}) {
  const density = opts.density ?? 1;
  const centreFn = opts.centre || null;                       // () => [x, z] | null: regional simulation around that point (the camera); null: the whole network
  const regional = !!centreFn;
  const R_ON = opts.radius ?? 420, R_OFF = R_ON + 90;
  const CAP = opts.cap ?? (regional ? 420 : 340);
  const hidden = opts.hidden || ((x, z) => !lastC || hyp(x - lastC[0], z - lastC[1]) > 150);           // (x, z) -> true when nobody can see a vehicle there (traffic.js passes a camera test)
  const pedBusy = opts.pedBusy || null;                       // (crosswalkId) -> bool: somebody is on that zebra now (people module); cars wait at the line / before the exit zebra
  // a lane end without a node is a SINK / SOURCE only at the data edge (cars are born and die there, out of sight); elsewhere it is a dead end that is never driven into.
  // opts.atEdge(x, z) knows the (non-rectangular) data extent of the west; without it the bounding box of opts.extent is used
  const E = opts.extent;
  const edgeTest = opts.atEdge || ((x, z, m = 70) => !E || x < E.x0 + m || x > E.x1 - m || z < E.z0 + m || z > E.z1 - m);
  const atEdge = (p) => edgeTest(p[0], p[1], 70);
  const signalState = (PROF && process.env.SIM_GREEN) ? (() => 'green') : (st.signalState || (() => 'green'));
  const segs = [], laneSeg = new Map(), connSeg = new Map(), lanesById = new Map();
  let nDups = 0, nBadConns = 0;
  const tm = {}, T0 = (typeof performance !== 'undefined' ? performance.now() : 0), lap = (k) => { if (typeof performance !== 'undefined') tm[k] = Math.round(performance.now() - T0); };
  for (const l of st.lanes) {
    if (!l.pts || l.pts.length < 2 || l.len < 3 || !(l.rank > 0)) continue;           // (yard / service lanes are never driven: no segment, their connectors drop out below)
    const s = mkSeg('lane', l.id, l.pts); s.lane = l; s.rank = l.rank; s.speed = limitFor(l); s.idx = l.idx; s.sink = l.to === null && atEdge(l.pts[l.pts.length - 1]); s.edgeStart = l.from === null && atEdge(l.pts[0]);
    s.inConns = []; s.on = false; s.ai = -1; s.routes = null;
    const dup = lanesById.get(l.id);
    if (dup) { dup.push(s); s.id = l.id + '~' + dup.length; nDups++; } else lanesById.set(l.id, [s]);
    laneSeg.set(s.id, s); segs.push(s);
  }
  /** the lane of that id whose end (end = true) / start lies at (x, z): ids occur twice when a way leaves and re-enters the data extent */
  const pickLane = (id, x, z, end) => {
    const arr = lanesById.get(id); if (!arr) return null;
    let best = null, bd = 1e9;
    for (const q of arr) { const i = end ? q.n - 1 : 0, d = hyp(q.xs[i] - x, q.zs[i] - z); if (d < bd) { bd = d; best = q; } }
    return bd < 3.5 ? best : null;
  };
  const cover = st.net && st.net.cover ? (x, z) => st.net.cover(x, z, {}) : null;
  for (const c of st.connectors) {
    if (c.pts.length < 2) continue;
    const a = pickLane(c.from, c.pts[0][0], c.pts[0][1], true), b = pickLane(c.to, c.pts[c.pts.length - 1][0], c.pts[c.pts.length - 1][1], false); if (!a || !b) { if (lanesById.has(c.from) && lanesById.has(c.to)) nBadConns++; continue; }
    const key = connSeg.has(c.id) ? c.id + '~' + a.id + '~' + b.id : c.id;
    const relaxed = a.rank > 0 ? relaxConnector(c.pts, cover) : c.pts, s = mkSeg('conn', key, relaxed); /* service-road links are never driven: no relaxing */
    s.c = c; s.from = a; s.to = b; s.turn = c.turn; s.signal = c.signal; s.approach = c.approach; s.junction = c.junction;
    s.badCover = relaxed.worst !== undefined && relaxed.worst < -1.6;
    s.rank = a.rank; s.vmax = curveVmax(s, Math.min(a.speed, b.speed)); s.on = false; s.ai = -1;
    s.conf = []; s.yieldTo = []; s.confSet = new Set();
    connSeg.set(key, s); segs.push(s); a.conns.push(s); b.inConns.push(s);
  }
  // ---- lanes over open water outside the play area: s.cut = where a car leaves (the last dry metre before the water), s.s0 = where a car is born (the first dry metre after it)
  let nWet = 0;
  if (opts.wet) {
    const wet = opts.wet, inPlay = opts.inPlay || (() => false);
    for (const l of laneSeg.values()) {
      l.cut = Infinity; l.s0 = 0.5;
      if (l.rank <= 0) continue;
      let first = -1, last = -1;
      for (let q = 0; q <= l.len + 12; q += 2) { const e = evalSeg(l, q, {}); if (inPlay(e.x, e.z) || !wet(e.x, e.z)) continue; if (first < 0) first = q; if (q <= l.len) last = q; }
      if (first < 0) continue;
      nWet++; l.wet = true;
      if (first > l.len * 0.5 || first > l.len - 40) l.cut = Math.max(2, first - 3);       // the water lies at the far end: the lane ends before it
      else { l.s0 = Math.min(l.len - 1, last + 3); if (l.s0 > l.len - 8) l.dry = false; }      // the water lies at the start: cars are born behind it (a lane that is water all along carries nobody)
    }
  }
  lap('segs');
  // ---- reachability: only lanes that lead to a sink (data edge) are ever driven into; service roads (courtyards, yard links) are never driven
  const rev = new Map(); for (const c of connSeg.values()) { if (c.from.rank > 0 && c.to.rank > 0) (rev.get(c.to) || rev.set(c.to, []).get(c.to)).push(c.from); }
  for (const l of laneSeg.values()) if (l.wet && l.cut < Infinity && l.rank > 0) l.sink = true;      // (a lane cut at the water of the far scenery is a way out of the network)
  const queue = []; for (const l of laneSeg.values()) if (l.sink && l.rank > 0 && l.dry !== false) { l.reach = true; queue.push(l); }
  while (queue.length) { const l = queue.pop(); for (const p of rev.get(l) || []) if (!p.reach) { p.reach = true; queue.push(p); } }
  for (const l of laneSeg.values()) { l.okConns = l.conns.filter((c) => c.to.reach && c.to.rank > 0); { const good = l.okConns.filter((c) => !c.badCover); if (good.length) l.okConns = good; } l.defNext = l.okConns.find((c) => c.turn === 'straight') || l.okConns[0] || null; l.lastOut = null; }

  // ---- trolleybus network: lanes that run under a contact-wire pair of streets.wires (kerb lane of the big streets, every wired lane of the small ones), and which of them reach the data edge
  let sim_wired = null, sim_nCL = 0;
  const wi = buildWireIndex(st.wires && st.wires.pairs);
  const trRoads = new Set((st.roads || []).filter((r) => r.trolley && r.trolley.length).map((r) => r.id));
  const grp = new Map(); for (const l of laneSeg.values()) { const k = l.lane.id.slice(0, l.lane.id.lastIndexOf(':') + 2); grp.set(k, (grp.get(k) || 0) + 1); }
  for (const l of laneSeg.values()) {
    l.nLanes = grp.get(l.lane.id.slice(0, l.lane.id.lastIndexOf(':') + 2)) || 1;
    let hit = 0, n = 0;
    for (let q = 1.0; q < l.len; q += Math.max(2.5, l.len / 8)) { const e = evalSeg(l, q, {}); n++; if (wi.query(e.x, e.z, e.tx, e.tz, 1.3, 0.9)) hit++; }
    l.wired = n > 0 && hit >= Math.max(1, n * 0.34);
    l.tw = (l.wired || trRoads.has(l.lane.road)) && (l.rank < 3 || l.idx === 0 || (l.idx === 1 && l.nLanes >= 3));      // the wire pair hangs over the kerb lane and the next one; the joints of ways (CB connectors) shift a lane index          // the data of some junction boxes has the route tag but no wire pair
    l.twReach = false;
  }
  // a short unwired lane between two wired ones (the junction boxes of the Fontanka quay, the Anichkov Bridge ends) carries the trolleybuses on: the wire arcs of streets.wires cover it
  {
    const incoming = new Map(); for (const c of connSeg.values()) (incoming.get(c.to) || incoming.set(c.to, []).get(c.to)).push(c.from);
    for (let pass = 0; pass < 2; pass++) for (const l of laneSeg.values()) {
      if (l.tw || l.len > 45 || l.rank < 3) continue;
      if ((incoming.get(l) || []).some((f) => f.tw) && l.conns.some((c) => c.to.tw)) { l.tw = true; l.twPass = true; }
    }
  }
  for (const c of connSeg.values()) c.twOk = false;
  {
    // the ends of the wired network near the data edge (the wires of the data stop at the last junction; the avenue goes on beyond the map): a wired lane there may leave onto any lane that
    // reaches the edge (the poles lie folded for the last metres, out of sight), and a wired lane without a wired predecessor there is a source
    const nearEdge = (x, z) => edgeTest(x, z, 140);
    const trev = new Map(), q2 = [], hasPred = new Set();
    for (const c of connSeg.values()) if (c.from.tw && c.to.tw) { (trev.get(c.to) || trev.set(c.to, []).get(c.to)).push(c); hasPred.add(c.to); }
    for (const l of laneSeg.values()) {
      l.twEdge = false;
      if (!l.tw) continue;
      if (l.sink) l.twReach = true;
      else if (nearEdge(l.xs[l.n - 1], l.zs[l.n - 1]) && !l.conns.some((c) => c.to.tw) && l.conns.some((c) => c.to.reach)) { l.twEdge = true; l.twReach = true; }
      if (l.twReach) q2.push(l);
    }
    while (q2.length) { const l = q2.pop(); for (const c of trev.get(l) || []) { c.twOk = true; if (!c.from.twReach) { c.from.twReach = true; q2.push(c.from); } } }
    for (const l of laneSeg.values()) l.twStart = l.tw && l.reach && l.idx === 0 && !hasPred.has(l) && l.lane.from !== null && nearEdge(l.xs[0], l.zs[0]);
  }
  sim_wired = { lanes: [...laneSeg.values()].filter((l) => l.tw).length, reach: [...laneSeg.values()].filter((l) => l.twReach).length, index: wi };

  // crosswalk on the exit arm of every connector (a person on it blocks the entry into the box)
  const outCross = new Map(); for (const j of st.junctions || []) for (const a of j.arms || []) if (a.crossing) for (const lid of a.out || []) outCross.set(lid, a.crossing);
  for (const c of connSeg.values()) c.exitCross = outCross.get(c.to.lane.id) || null;
  lap('reach');
  // ---- stop lines (+ an implicit one at the end of every lane that continues into a connector)
  for (const sl of st.stopLines) {
    let l = laneSeg.get(sl.lane); if (!l) continue;
    const dl = lanesById.get(sl.lane);
    if (dl && dl.length > 1) {                                   // the stop line belongs to the lane of that id that passes through its point
      let bd = 1e9; for (const q of dl) { const e = evalSeg(q, Math.min(sl.s, q.len), {}), d = hyp(e.x - sl.x, e.z - sl.z); if (d < bd) { bd = d; l = q; } }
      if (bd > 6) continue;
    }
    l.stops.push({ s: Math.min(sl.s, l.len), signal: sl.signal, approach: sl.approach, give: sl.give, junction: sl.junction, atEnd: sl.s >= l.len - 0.6, crossing: sl.crossing });
  }
  for (const l of laneSeg.values()) {
    if (l.conns.length && !l.stops.some((s) => s.atEnd)) l.stops.push({ s: l.len, signal: null, approach: 0, give: false, junction: null, atEnd: true, implicit: true });
    l.stops.sort((a, b) => a.s - b.s);
  }
  lap('stops');
  // ---- junction conflicts / priorities
  const sigGroup = new Map(); for (const s of st.signals) for (const a of s.approaches) sigGroup.set(s.id + '|' + a.index, a.group);
  const byJ = new Map(); for (const c of connSeg.values()) if (c.from.rank > 0 && c.to.rank > 0 && c.from.reach && c.to.reach) (byJ.get(c.junction) || byJ.set(c.junction, []).get(c.junction)).push(c);      // (links of service roads / dead ends are never driven: no conflicts needed)
  let nConf = 0, nCross = 0, nZip = 0;
  for (const list of byJ.values()) {
    if (list.length < 2) continue;
    const pts = new Map(list.map((c) => [c, sampleSeg(c)]));
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (a.from === b.from) {                                         // diverge from the same lane: they conflict only if they come together again after the first 10 m
        const pa = pts.get(a).slice(20), pb = pts.get(b).slice(20);
        if (pa.length < 4 || pb.length < 4 || !within(pa, pb, 2.0)) continue;
      } else if (a.to !== b.to && !within(pts.get(a), pts.get(b), 2.2)) continue;
      a.conf.push(b); b.conf.push(a); a.confSet.add(b); b.confSet.add(a); nConf++;
      // a lane drop: two lanes of one carriageway that go straight on into the SAME lane take turns (zipper; entryState)
      if (a.to === b.to && a.from !== b.from && a.turn === 'straight' && b.turn === 'straight' && a.from.lane.road === b.from.lane.road) { (a.zip || (a.zip = [])).push(b); (b.zip || (b.zip = [])).push(a); nZip++; }
    }
    for (const a of list) {
      const signalised = !!a.signal;
      const prio = (c) => (signalised ? (c.turn === 'left' ? 1 : 2) : c.from.rank * 10 + (c.turn === 'left' ? 0 : 5));
      for (const b of a.conf) {
        if (signalised && sigGroup.get(a.signal + '|' + a.approach) !== sigGroup.get(b.signal + '|' + b.approach)) continue;      // never green together
        const pa = prio(a), pb = prio(b);
        if (pa < pb || (pa === pb && a.id > b.id)) a.yieldTo.push(b);
      }
    }
  }

  lap('conf1');
  // conflicts between connectors of NEIGHBOURING junction nodes: complex crossings are split into several nodes (Nevsky x Sadovaya, the Fontanka corners, Isaac's Square): same geometric test, found through a grid
  {
    const CS = 14, cell = new Map(), sp = new Map(), seen = new Set(); let ci = 0;
    const conns = [...connSeg.values()].filter((c) => c.from.rank > 0 && c.to.rank > 0 && c.from.reach && c.to.reach);
    for (const c of conns) {
      c.ci = ci++; const p = sampleSeg(c, 1); sp.set(c, p); let last = -1;
      for (let i = 0; i < p.length; i += 2) { const k = Math.floor(p[i] / CS) * 8192 + Math.floor(p[i + 1] / CS); if (k !== last) { const l = cell.get(k) || cell.set(k, []).get(k); if (l[l.length - 1] !== c) l.push(c); last = k; } }
    }
    for (const list of cell.values()) {
      if (list.length < 2) continue;
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (a.junction === b.junction || a.from === b.from || a.confSet.has(b)) continue;
        const key = a.ci < b.ci ? a.ci * 32768 + b.ci : b.ci * 32768 + a.ci; if (seen.has(key)) continue; seen.add(key);
        if (minDist(sp.get(a), sp.get(b)) > 2.2) continue;
        a.conf.push(b); b.conf.push(a); a.confSet.add(b); b.confSet.add(a); nConf++; nCross++;
        for (const [x, y] of [[a, b], [b, a]]) {
          if (x.signal && y.signal && sigGroup.get(x.signal + '|' + x.approach) !== sigGroup.get(y.signal + '|' + y.approach)) continue;
          const px = x.signal ? (x.turn === 'left' ? 1 : 2) : x.from.rank * 10 + (x.turn === 'left' ? 0 : 5), py = y.signal ? (y.turn === 'left' ? 1 : 2) : y.from.rank * 10 + (y.turn === 'left' ? 0 : 5);
          if (px < py || (px === py && x.id > y.id)) x.yieldTo.push(y);
        }
      }
    }
  }
  lap('conf2');
  // micro lanes (a few metres between two nodes of one junction cluster: the strip between the carriageways, the box of a split crossing) are part of the box: a car standing on one is an obstacle for
  // every connector whose path crosses it (the junction conflicts above only know connectors); c.confLanes = the micro lanes that c crosses
  {
    const micro = []; for (const l of laneSeg.values()) if (l.len < MICRO && l.rank > 0 && l.conns.length && l.inConns.length) micro.push(l);
    const CS = 6, cell = new Map(), ms = new Map();
    for (const m of micro) { const p = sampleSeg(m, 1); ms.set(m, p); const ks = new Set(); for (let i = 0; i < p.length; i += 2) ks.add(Math.floor(p[i] / CS) * 8192 + Math.floor(p[i + 1] / CS)); for (const k of ks) (cell.get(k) || cell.set(k, []).get(k)).push(m); }
    let nCL = 0;
    for (const c of connSeg.values()) {
      c.confLanes = [];
      if (c.from.rank <= 0 || c.to.rank <= 0 || !c.from.reach || !c.to.reach) continue;
      const cp = sampleSeg(c, 1), inner = []; for (let i = 3; i + 3 < cp.length / 2; i++) inner.push(cp[i * 2], cp[i * 2 + 1]);
      if (inner.length < 2) continue;
      const cand = new Set(); for (let i = 0; i < cp.length; i += 4) { const cx = Math.floor(cp[i] / CS), cz = Math.floor(cp[i + 1] / CS); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const m of cell.get((cx + a) * 8192 + cz + b) || []) cand.add(m); }
      for (const m of cand) { if (m === c.from || m === c.to) continue; if (minDist(inner, ms.get(m)) < 2.0) { c.confLanes.push(m); nCL++; } }
    }
    sim_nCL = nCL;
  }
  lap('conflicts');
  // ---- bus stops: nearest right-most lane of a road of rank >= 2 on the stop's side
  const busLanes = [];
  const stopLanes = [];
  for (const l of laneSeg.values()) {
    if (l.idx !== 0 || l.rank < 2 || !l.reach || l.len < 25) continue;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < l.n; i++) { x0 = Math.min(x0, l.xs[i]); x1 = Math.max(x1, l.xs[i]); z0 = Math.min(z0, l.zs[i]); z1 = Math.max(z1, l.zs[i]); }
    stopLanes.push({ l, x0: x0 - 9, x1: x1 + 9, z0: z0 - 9, z1: z1 + 9 });
  }
  for (const bs of st.busStops || []) {
    let best = null;
    for (const { l, x0, x1, z0, z1 } of stopLanes) {
      if (bs.x < x0 || bs.x > x1 || bs.z < z0 || bs.z > z1) continue;
      for (let s = 0; s <= l.len; s += 2) {
        const q = evalSeg(l, s, {});
        const dx = bs.x - q.x, dz = bs.z - q.z, d = hyp(dx, dz);
        if (d > 9 || (best && d >= best.d)) continue;
        if (dx * -q.tz + dz * q.tx < 0.8) continue;                      // the stop must be on the RIGHT of the lane
        best = { d, l, s };
      }
    }
    if (best && best.s > 8 && best.s < best.l.len - 14) { best.l.bus.push({ id: bs.id, s: best.s, name: bs.name, kind: bs.kind }); busLanes.push(best.l); }
  }
  for (const l of laneSeg.values()) l.bus.sort((a, b) => a.s - b.s);

  // ================================================================== simulation state
  const sim = { segs, laneSeg, connSeg, DT, time: 0, vehicles: [], stats: { timing: tm, spawned: 0, despawned: 0, steps: 0, nConf, nCross, nConfLanes: sim_nCL, nZip, busStops: new Set(busLanes.flatMap((l) => l.bus.map((b) => b.id))).size, wired: sim_wired, dupLaneIds: nDups, badConnectors: nBadConns, activeLanes: 0, activeSegs: 0, regionJumps: 0 }, onCross: null, regional, radius: R_ON };
  let rng = null, nextId = 1, sources = [], pending = [];
  sim.stats.wetLanes = nWet;
  // trams: built lazily at the first reset (place / remove are defined below)
  let trams = null, rolling = false;
  const tramNet = opts.trams === false ? null : buildTramNet(st, { atEdge: edgeTest, stops: opts.tramStops || [] });
  sim.stats.trams = tramNet ? tramNet.stats : null;
  // tram lanes: a lane of a carriageway with >= 2 lanes that lies on the rails of a tram route (>= 60 % of its samples within 1.1 m, same direction) is left to the trams
  { let nTL = 0;
    if (tramNet && tramNet.routes.length) for (const l of laneSeg.values()) {
      if (l.rank <= 0 || l.nLanes < 2 || l.len < 20) continue;
      let hit = 0, n = 0; for (let q = 2; q < l.len; q += Math.max(4, l.len / 12)) { const e = evalSeg(l, q, {}); n++; if (tramNet.onRails(e.x, e.z, e.tx, e.tz, 1.1)) hit++; }
      if (n && hit >= n * 0.6) { l.tramLane = true; nTL++; }
    }
    sim.stats.tramLanes = nTL; }
  const dead = [];
  const act = [];                                                  // the active segments (lanes + connectors); the whole network when not regional
  const actAdd = (q) => { q.ai = act.length; act.push(q); };
  const actDel = (q) => { const i = q.ai, last = act.pop(); if (last !== q) { act[i] = last; last.ai = i; } q.ai = -1; };

  // ---- long vehicles (len >= 9 m: buses, trolleybuses, articulated buses) and the tight corners of the lane graph. The bicycle model of a 12 m bus (wheelbase 5.9 m, front overhang 2.75 m) cuts a corner of
  // ~6 m radius (Konnogvardeysky pereulok -> bulvar, tools/traffic-test.mjs "off-lane trolley at -3101,24") 2.3 m over the pavement. busBad(c): the middle of such a bus would stand more than 1.5 m outside the
  // asphalt somewhere on connector c. choose() keeps long vehicles off such turns when another exit exists; nobody seeds or spawns a bus on a lane whose exits are all bad (a real bus does not drive there).
  const BUS_FO = 2.75, BUS_WB = 5.9;
  const busBad = (c) => {
    if (c.busBad !== undefined) return c.busBad;
    let bad = false;
    if (cover && c.from && c.to && c.len > 4) {
      const ax = (sa) => (sa < 0 ? (c.from.len + sa < 0 ? null : evalSeg(c.from, c.from.len + sa, {})) : sa > c.len ? evalSeg(c.to, sa - c.len, {}) : evalSeg(c, sa, {}));
      for (let s = 2; s <= c.len + 3 && !bad; s += 1) { const f = ax(s - BUS_FO), r = ax(s - BUS_FO - BUS_WB); if (f && r && cover((f.x + r.x) / 2, (f.z + r.z) / 2) < -1.5) bad = true; }
    }
    return (c.busBad = bad);
  };
  // a lane is fine for a long vehicle when it leaves the data (the lane ends at the extent) or some exit that is not a bad corner leads on to a fine lane (looked ahead 3 lanes: a bus must not be led into a lane whose only exits are such corners)
  const busGood = (l, d, seen) => { if (!l.okConns.length) return l.lane.to === null; if (d <= 0) return true; seen.add(l); for (const c of l.okConns) { if (busBad(c)) continue; if (seen.has(c.to) || busGood(c.to, d - 1, seen)) return true; } return false; };
  const busOkLane = (l) => { if (l.busOk === undefined) l.busOk = busGood(l, 3, new Set()); return l.busOk; };
  const choose = (v, seg) => {
    let cs = seg.okConns; if (!cs.length) return null;
    if (regional) { cs = cs.filter((c) => c.on); if (!cs.length) return null; }
    if (v.len >= 9 && cs.length) { const g = cs.filter((c) => !busBad(c) && busOkLane(c.to)); if (g.length) cs = g; }
    if (v.trolley) {                                              // a trolleybus follows the wires: wired successors (kept in the bus lane when it can), else it rolls on under folded poles
      let w = cs.filter((c) => c.to.tw); if (w.length > 1 && w.some((c) => c.to.idx === 0)) w = w.filter((c) => c.to.idx === 0 || c.from.idx !== 0); if (w.length) cs = w;
    }
    if (cs.length > 1) { const main = cs.filter((c) => c.to.rank > 0); if (main.length) cs = main; }
    if (cs.length === 1) return cs[0];
    let tot = 0; const w = cs.map((c) => { const x = (v.bus ? (c.turn === 'straight' ? 1 : 0.12) : TURN_W[c.turn]) * (RANK_W[c.to.rank] ?? 0.2) *(!v.bus && !v.taxi && isBusLane(c.to) ? 0.08 : 1) * (c.to.tramLane ? 0.03 : 1) + 1e-4; tot += x; return x; });
    let r = rng() * tot; for (let i = 0; i < cs.length; i++) { r -= w[i]; if (r <= 0) return cs[i]; }
    return cs[cs.length - 1];
  };
  /** the route boards that fit a lane (traffic.js builds the lists from fleetdata.ROUTES and the stops beside the lane); a vehicle keeps its route while the lane carries it */
  const routeOf = opts.routes || null;                              // (seg, trolley) -> [route index]
  const pickRoute = (v, seg) => {
    if (!routeOf) return;
    const list = routeOf(seg, v.trolley);
    if (!list || !list.length) return;
    if (v.route !== null && v.route !== undefined && list.includes(v.route)) return;
    v.route = list[Math.floor(rng() * list.length)];
  };
  const mkVeh = (kind, seg, s, v, o = {}) => {
    const a = ARCH[kind];
    const r = rng;
    const taxi = TAXI_KINDS.includes(kind) && (o.taxi || r() < TAXI_SHARE);
    const police = !taxi && (kind === 'liftback' ? r() < POLICE_SHARE * 4 : kind === 'van' && r() < POLICE_SHARE * 1.5);
    const amb = !taxi && !police && kind === 'van' && r() < AMB_SHARE * 4;
    const veh = {
      id: nextId++, born: sim.time, die: sim.time + 200 + r() * 240, passS: -1, pass: null, sigOk: false, cgOn: false, cgGap: 0, cgVl: 0, sn: 0, cs: 1, why: '', kind, arch: a, len: a.len, wid: a.wid, wb: a.wb, fo: a.front - a.wb / 2, bus: !!a.bus, trolley: !!a.trolley, seg, s, v, vf: 0.78 + r() * 0.24, T: 1.05 + r() * 0.5, A: a.bus ? 1.0 : 1.5 + r() * 0.4, B: a.bus ? 1.7 : 2.3,
      next: null, trail: [], x: 0, z: 0, rot: 0, px: 0, pz: 0, prot: 0, x2: 0, z2: 0, rot2: 0, px2: 0, pz2: 0, prot2: 0, acc: 0, brake: false, wait: 0, dwell: 0, served: new Set(), door: 0, doorT: 0,
      color: pickW(PALETTE[kind], r), taxi, police, amb, plate: Math.floor(r() * PLATES_COUNT), seat: r(), pax: r() < 0.35,
      route: a.trolley ? TROLLEY_ROUTES[Math.floor(r() * TROLLEY_ROUTES.length)] : a.bus && !a.tour ? BUS_ROUTES[Math.floor(r() * BUS_ROUTES.length)] : null,
    };
    if (a.bus && !a.tour) pickRoute(veh, seg);
    if (police || amb) veh.color = '#f4f4f1';
    else if (taxi) veh.color = r() < 0.92 ? TAXI_WHITE : '#b9bcbf';
    veh.doors = 0;
    return veh;
  };
  const insert = (seg, v) => { const arr = seg.veh; let i = arr.length; while (i > 0 && arr[i - 1].s > v.s) i--; arr.splice(i, 0, v); v.seg = seg; };
  const place = (v) => { poseOf(v); v.px = v.x; v.pz = v.z; v.prot = v.rot; v.px2 = v.x2; v.pz2 = v.z2; v.prot2 = v.rot2; };
  if (tramNet && tramNet.routes.length) { trams = createTrams(tramNet, { vehicles: sim.vehicles, mkSeg, place, signalState, DT, remove: (v) => remove(v), eachNear: (x, z, r, fn) => eachNear(x, z, r, fn), hidden: (x, z) => hidden(x, z) }); sim.trams = trams; }

  function axle(v, sa) {
    let seg = v.seg;
    for (let k = 0; sa < 0; k++) { const p = v.trail[k]; if (!p) return evalSeg(seg, sa, _p); sa += p.len; seg = p; }
    return evalSeg(seg, sa, _p);
  }
  function poseOf(v) {
    if (v.wrecked) return;
    const sf = v.s - v.fo;
    let q = axle(v, sf); const fx = q.x, fz = q.z;
    q = axle(v, sf - v.wb); const rx = q.x, rz = q.z;
    v.x = (fx + rx) / 2; v.z = (fz + rz) / 2;
    v.rot = Math.atan2(fx - rx, fz - rz);
    if (v.arch.parts) {                                          // articulated bus: the rear body stands on the hinge and the rear axle
      q = axle(v, v.s - ARTIC.hinge); const hx = q.x, hz = q.z;
      q = axle(v, v.s - ARTIC.rearAxle); const ax = q.x, az = q.z;
      v.x2 = (hx + ax) / 2; v.z2 = (hz + az) / 2; v.rot2 = Math.atan2(hx - ax, hz - az);
    }
  }

  // ---------------------------------------------------------------- spawning / seeding
  const busKind = () => pickW(BUS_MIX, rng);
  const spawnVehicle = (seg, type, s0, vInit) => {
    const kind = type === 'trolley' ? (rng() < 0.55 ? 'trolley' : 'trolley2') : type === 'bus' ? busKind() : type === 'taxi' ? TAXI_KINDS[Math.floor(rng() * TAXI_KINDS.length)] : pickW(KINDS_W, rng);
    const v = mkVeh(kind, seg, s0, vInit, { taxi: type === 'taxi' });
    v.next = choose(v, seg);
    insert(seg, v); place(v); sim.vehicles.push(v); sim.stats.spawned++;
    return v;
  };
  const WEST_X = -880;                                              // west of Sadovaya: the kerb lane of Nevsky is the red-brown bus lane (streets): cars keep out of it
  // traffic density of the west (docs/research/west-life-furniture.md 3.4: Nevsky 8-12 vehicles per 100 m of a carriageway, busy but flowing; the Palace Square roads nearly empty, the Dvortsovy proezd / bridge trunk and Isaac's Square busy)
  const WEST_DENS = { 4: 3.1, 3: 2.3, 2: 1.6, 1: 1.3, 0: 1 };   // QA: was 2.6 / 1.9 / 1.5 (Nevsky measured 5.5-8 vehicles per 100 m in the camera region, dossier 8-12; now 8-9 near the camera); node tools/traffic-test.mjs passes at these values, but the test is chaotic (3.0 / 2.2 reported stuck cars)
  const densOf = (l) => {
    if (l.dens !== undefined) return l.dens;
    let d = 1;
    if (l.xs[0] < WEST_X) {
      d = WEST_DENS[l.rank] ?? 1; const nm = l.lane.name || '';
      if (/Дворцовая площадь/.test(nm)) d = 0.25; else if (/Дворцовый проезд|Дворцовый мост|Дворцовая набережная|Адмиралтейский проспект/.test(nm)) d *= 1.2; else if (/Исаакиевская площадь|Сенатская площадь/.test(nm)) d *= 1.1;
    }
    return (l.dens = d * density);
  };
  /** the red-brown bus lane of Nevsky west of Sadovaya (streets paints it): buses, trolleybuses and taxis only */
  const isBusLane = (l) => { if (l.bl === undefined) l.bl = l.idx === 0 && l.rank >= 3 && l.nLanes >= 3 && l.xs[0] < WEST_X && /Невск/.test(l.lane.name || ''); return l.bl; };
  const busLaneShare = (l) => (l.idx === 0 && l.rank >= 3 && l.nLanes >= 3 ? (l.xs[0] < WEST_X && /Невск/.test(l.lane.name || '') ? 7 : 2.4) : 1);       // the right lane of Nevsky is the bus lane: few cars
  /** a relaxed starting population along one lane (rank-dependent spacing) */
  function seedLane(l) {
    if (!l.reach || l.len < 14 || l.tramLane) return;
    const bl = isBusLane(l);
    const sp = bl ? 95 : SEED_SPACING[l.rank] * busLaneShare(l) / densOf(l); if (sp > 1e8) return;
    let s = 8 + rng() * sp * 0.8;
    const stopAt = l.len - 6;
    while (s < stopAt) {
      if (rng() < 0.9) {
        // (the bus lane carries a public-transport vehicle or a taxi every ~60 m, no private cars: west-life-furniture.md 3.1 / 3.4)
        const longOk = busOkLane(l);                                           // (no bus on a lane whose every exit is a corner a bus cannot take)
        const trolley = longOk && l.tw && l.idx === 0 && rng() < (bl ? 0.42 : 0.075);
        const bus = longOk && !trolley && l.rank >= 3 && l.idx === 0 && rng() < (bl ? 0.45 : 0.04);
        const taxi = bl && !trolley && !bus;
        const kind = trolley ? (rng() < 0.55 ? 'trolley' : 'trolley2') : bus ? busKind() : taxi ? TAXI_KINDS[Math.floor(rng() * TAXI_KINDS.length)] : pickW(KINDS_W, rng);
        const v = mkVeh(kind, l, s, l.speed * 0.55, { taxi }); v.next = choose(v, l); v.die = sim.time + 30 + rng() * 330;
        const last = l.veh[l.veh.length - 1];
        if ((!last || s - v.len - last.s > 5) && !(s > l.cut) && !(s < l.s0)) { insert(l, v); place(v); sim.vehicles.push(v); sim.stats.spawned++; for (const sl of l.stops) if (!sl.atEnd && sl.s < s && sl.s > v.passS) v.passS = sl.s; }      // (a car seeded beyond a mid-lane line has passed it: no red run is counted when the region follows a moving camera)
      }
      s += sp * (0.4 + rng() * 1.2);
    }
  }

  // ---------------------------------------------------------------- the active region
  const CELL = 128, cgridL = new Map();
  const driven = [...laneSeg.values()].filter((l) => l.rank > 0);
  if (regional) {
    for (const l of driven) {
      const n = Math.max(2, Math.ceil(l.len / 36) + 1), sx = new Float32Array(n), sz = new Float32Array(n); let lastK = -1, lastK2 = -1;
      for (let i = 0; i < n; i++) {
        const q = evalSeg(l, l.len * i / (n - 1), {}); sx[i] = q.x; sz[i] = q.z;
        const k = Math.floor(q.x / CELL) * 8192 + Math.floor(q.z / CELL);
        if (k !== lastK && k !== lastK2) { (cgridL.get(k) || cgridL.set(k, []).get(k)).push(l); lastK2 = lastK; lastK = k; }
      }
      l.sx = sx; l.sz = sz;
    }
  }
  const laneDist = (l, cx, cz) => { let m = 1e9; for (let i = 0; i < l.sx.length; i++) { const d = hyp(l.sx[i] - cx, l.sz[i] - cz); if (d < m) m = d; } return m; };
  let epoch = 0, lastC = null;
  const fresh = [];
  function onConn(c) { if (c.on || !c.from.on || !c.to.on) return; c.on = true; actAdd(c); }
  function turnOn(l) { l.on = true; actAdd(l); for (const c of l.conns) onConn(c); for (const c of l.inConns) onConn(c); fresh.push(l); }
  function offConn(c) { for (const v of c.veh.slice()) remove(v); c.on = false; actDel(c); }
  function turnOff(l) {
    for (const v of l.veh.slice()) remove(v);
    for (const c of l.conns) if (c.on) offConn(c);
    for (const c of l.inConns) if (c.on) offConn(c);
    l.on = false; actDel(l); l.lastOut = null;
  }
  /** Poisson sources: lanes that start at the data edge, boundary lanes of the active region (their upstream lanes are outside), the wired lane starts */
  function rebuildSources() {
    const old = new Map(); for (const q of sources) old.set(q.key, q.next);
    sources = [];
    const add = (l, mean, type) => { const key = l.id + '|' + type; sources.push({ seg: l, mean, next: old.has(key) ? old.get(key) : sim.time + rng() * mean, type, key }); };
    for (const l of act) {
      if (l.kind !== 'lane' || !l.reach || l.rank <= 0) continue;
      const edge = l.lane.from === null && l.edgeStart;
      const bnd = !edge && regional && l.lane.from !== null && l.inConns.length > 0 && l.inConns.some((c) => c.from.rank > 0 && c.from.reach && !c.from.on) && !l.inConns.some((c) => c.from.on);
      if (edge || bnd) {
        const mean = l.tramLane ? 0 : SPAWN_MEAN[l.rank];
        if (mean) {
          add(l, isBusLane(l) ? 60 : mean * busLaneShare(l) / densOf(l), isBusLane(l) ? 'taxi' : 'car');
          if (l.rank >= 3 && l.idx === 0) add(l, BUS_MEAN, 'bus');
          if (l.tw && l.idx === 0) add(l, TROLLEY_MEAN, 'trolley');
        }
      } else if (l.twStart && l.lane.from !== null) add(l, TROLLEY_MEAN, 'trolley');
    }
    sim.stats.srcTrolley = sources.filter((q) => q.type === 'trolley').length; sim.stats.srcBus = sources.filter((q) => q.type === 'bus').length; sim.stats.srcCar = sources.filter((q) => q.type === 'car').length;
  }
  /** make the lanes within R_ON of (cx, cz) exist (seeded) and drop the ones beyond R_OFF */
  function updateRegion(cx, cz) {
    lastC = [cx, cz];
    const offs = []; for (const q of act) if (q.kind === 'lane' && laneDist(q, cx, cz) > R_OFF) offs.push(q);
    for (const l of offs) turnOff(l);
    epoch++; fresh.length = 0;
    const r = R_ON + 20, i0 = Math.floor((cx - r) / CELL), i1 = Math.floor((cx + r) / CELL), j0 = Math.floor((cz - r) / CELL), j1 = Math.floor((cz + r) / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const list = cgridL.get(i * 8192 + j); if (!list) continue;
      for (const l of list) { if (l.on || l.mark === epoch) continue; l.mark = epoch; if (laneDist(l, cx, cz) <= R_ON) turnOn(l); }
    }
    for (const l of fresh) seedLane(l);
    fresh.length = 0;
    sim.stats.activeLanes = act.reduce((n, q) => n + (q.kind === 'lane' ? 1 : 0), 0); sim.stats.activeSegs = act.length;
    rebuildSources();
  }
  const syncPrev = () => { for (const v of sim.vehicles) { v.px = v.x; v.pz = v.z; v.prot = v.rot; v.px2 = v.x2; v.pz2 = v.z2; v.prot2 = v.rot2; } };
  const PRE_RESET = opts.preroll ?? (regional ? 25 : 40), PRE_JUMP = opts.prerollJump ?? 14;
  /** the camera moved: follow it (a jump re-seeds the region and pre-rolls it so that queues stand at the lights) */
  function recentre(force) {
    if (!regional) return;
    const c = centreFn(); if (!c || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) return;
    const d = lastC ? hyp(c[0] - lastC[0], c[1] - lastC[1]) : 1e9;
    if (!force && d < 30) return;
    const big = d > R_ON * 0.6;
    if (big && PRE_JUMP > 0) {
      const t0 = sim.time, n = Math.round(PRE_JUMP / DT);
      sim.time -= n * DT; updateRegion(c[0], c[1]);
      rolling = true; for (let i = 0; i < n; i++) step(); rolling = false;      // (the trams do not take part in the pre-roll of a new region: their clock is the simulation time)
      sim.time = t0; syncPrev(); sim.stats.regionJumps++;
    } else updateRegion(c[0], c[1]);
  }
  function reset() {
    for (const vehicle of sim.vehicles) { vehicle.retired = true; vehicle.wreckCleanup?.(); }
    rng = makeRng();
    nextId = 1; sim.time = 0; sim.vehicles.length = 0; pending.length = 0;
    for (const s of segs) { s.veh.length = 0; s.lastOut = null; s.lastFrom = null; s.on = false; s.ai = -1; }
    act.length = 0; sources = []; lastC = null;
    const pre = Math.round(PRE_RESET / DT);
    sim.time = -pre * DT;
    if (regional) {
      const c = centreFn() || [0, 0];
      updateRegion(c[0], c[1]);
    } else {
      fresh.length = 0;
      for (const l of driven) turnOn(l);
      for (const l of driven) seedLane(l);                         // (all lanes are on before the first car chooses its connector)
      fresh.length = 0; sim.stats.activeLanes = driven.length; sim.stats.activeSegs = act.length;
      rebuildSources();
    }
    for (const src of sources) src.next = sim.time + rng() * src.mean;
    if (trams) trams.reset(sim.time);
    for (let i = 0; i < pre; i++) step();
    sim.time = 0;
    syncPrev();
  }

  // ---------------------------------------------------------------- junction logic
  const occupied = (c) => {
    if (c.veh.length) return true;
    const u = c.to.veh[0]; return !!(u && u.trail[0] === c && u.s - u.len < -1.5);        // a tail that overhangs the box by less than 1.5 m does not block it (short links)
  };
  /** free metres behind the connector c along the default chain (exit lane, then the next connector + lane when the exit is short), up to `need` */
  function roomAhead(c, need) {
    let free = 0, seg = c.to;
    for (let hop = 0; seg && free < need && hop < 5; hop++) {
      if (seg.sink) return 1e9;                                  // the data edge swallows everything
      if (regional && seg.kind === 'lane' && seg.okConns.length && !seg.okConns.some((c) => c.on)) return 1e9;      // so does the border of the active region
      const u = seg.veh[0];
      if (u) { if (u.v > 1.5 && u.s - u.len > 0.8) return 1e9; free += Math.max(0, u.s - u.len); break; }       // a car that is rolling away clears the exit: no jam to wait for
      if (seg.kind === 'lane') { const lo = seg.lastOut; if (lo && lo.trail[0] === seg && lo.s - lo.len < 0 && lo.v <= 1.5) { free += Math.max(0, seg.len + lo.s - lo.len); break; } }      // (the tail of a slow vehicle that just left the lane)
      free += seg.len;
      if (seg.kind === 'lane') {                                  // beyond a lane only through an uncontrolled node; a real stop line (signal / give way) ends the room
        const ex = seg.stops.find((x) => x.atEnd);
        if (ex && !ex.implicit) { if (hop === 0) free = Math.max(free, need * (seg.len >= 3 ? 1 : 0)); break; }   // a short exit lane in front of a stop line may be overhung
        seg = seg.defNext && (!regional || seg.defNext.on) ? seg.defNext : null;
        if (!seg) return 1e9;                                     // (the chain leaves the active region: nobody can block it)
      } else seg = seg.to;
    }
    return free;
  }
  /** is the light red, or amber with less time left than the car needs to reach the line `dist` metres ahead? */
  const sigInfo = st.signalInfo || null;
  function lightBlocks(sig, ap, dist, speed, time) {
    const stt = signalState(sig, ap, time);
    if (stt === 'red') return true;
    const rem = sigInfo ? sigInfo(sig, ap, time).remain : (stt === 'green' ? 99 : 1), reach = dist / Math.max(speed, 4) + (speed < 3 ? 1.5 : 0);                // (a car that starts from standing needs longer)
    return stt === 'green' ? reach > rem + 2.5 : reach > rem - 0.4;                // green: the car must get there before the amber ends
  }
  /** would a car entering connector c have to stop on its micro exit lane (red / amber light at its end, a zebra in use, an occupied crossing beyond)? it then waits before the box instead of standing in it */
  function throughBlocked(v, c, time, depth) {
    const M = c.to, pass = depth > 0 || v.pass === c.from || !!(c.from.stops.find((x) => x.atEnd && x.signal));      // entered on a signal's green: the micro lanes of the cluster do not stop it again
    const sl = M.stops.find((x) => x.atEnd);
    if (sl && !pass && sl.signal && lightBlocks(sl.signal, sl.approach, c.len + M.len, v.v, time)) return true;
    if (sl && sl.crossing && pedBusy && pedBusy(sl.crossing)) return true;
    const n = M.defNext; if (!n || (regional && !n.on)) return false;
    for (const o of n.conf) if (occupied(o)) return true;
    for (const m of n.confLanes) if (m !== M && m.veh.length) return true;
    if (n.to.len < MICRO && depth < 2) return throughBlocked(v, n, time, depth + 1);
    return false;
  }
  /** 2 = hard block (box / exit), 1 = soft (priority traffic approaching), 0 = free */
  function entryState(v, c, time) {
    for (const x of c.to.stops) {                                                       // a pedestrian light / zebra line just behind the junction exit (mid-block signals sit 3-12 m into the exit lane): a car must not roll past it on red
      if (x.atEnd) continue; if (x.s > 14) break;
      if (x.signal && lightBlocks(x.signal, x.approach, c.len + x.s, v.v, time)) return 2;
      if (x.crossing && pedBusy && pedBusy(x.crossing)) return 2;
    }
    if (!c.conf.length && !c.confLanes.length && !c.exitCross && c.to.len >= MICRO) return 0;      // a node that nobody crosses (a way split mid-street, a link between two lanes): no box to block, the car just follows its leader
    for (const o of c.conf) if (occupied(o) && !(v.eWait > 25)) return 2;                  // (a car blocked 25 s by the box rules while its light is not red squeezes in: gridlock breaker)
    if (!(v.eWait > 25)) for (const m of c.confLanes) if (m.veh.length) return 2;          // (a car standing on a micro lane inside the box)
    if (c.to.len < MICRO && !(v.wait > 30) && throughBlocked(v, c, time, 0)) return 2;      // it would have to stand inside the box (red light / occupied crossing beyond the micro link): wait before it
    if (pedBusy && c.exitCross && pedBusy(c.exitCross)) return 2;
    const room = roomAhead(c, v.len + 1.5), w = v.wait || 0;
    if (room < v.len + 1.5 && !(w > 20 && room >= v.len * 0.5) && !(w > 45)) return 2;       // exit full: do not block the box (a long wait relaxes it: gridlock breaker)
    // zipper at a lane drop: when our lane fed the shared exit lane last and the head of the partner lane stands at its line, it goes first
    // (only while the partner may really go: its light is not red; and for 12 s at most: the partner may be held by something this lane does not see)
    if (c.zip && c.to.lastFrom === c && !(v.wait > 12)) for (const o of c.zip) { const ls = o.from, w = ls.veh[ls.veh.length - 1]; if (w && w.next === o && ls.len - w.s < 3 && w.v < 1.0 && !(o.signal && signalState(o.signal, o.approach, time) === 'red')) return 1; }
    for (const o of c.yieldTo) {
      if (c.zip && c.to.lastFrom === o && c.zip.includes(o)) continue;                 // (the partner lane of the lane drop went last: our turn)
      const ls = o.from, w = ls.veh[ls.veh.length - 1]; if (!w || w.next !== o) continue;
      if (o.signal && signalState(o.signal, o.approach, time) === 'red') continue;
      const dd = ls.len - w.s, tta = dd / Math.max(w.v, 0.5);
      if (dd < -0.5) continue;
      if (tta < GAP_T && !(v.wait > 9)) return 1;
    }
    return 0;
  }

  // ---------------------------------------------------------------- one step
  const idmA = (v, v0, gap, vl, s0) => { const dv = v.v - vl; const sStar = s0 + Math.max(0, v.v * v.T + v.v * dv / (2 * Math.sqrt(v.A * v.B))); const r = sStar / Math.max(gap, 0.05); return v.A * (1 - Math.pow(v.v / v0, 4) - r * r); };
  const WHY = () => !!sim.debugWhy;
  function accel(v, arr, i, time) {
    const seg = v.seg, lane = seg.kind === 'lane';
    let v0 = lane ? seg.speed * v.vf : Math.min(seg.vmax, seg.from.speed * v.vf);
    const front = v.s;
    let acc = v.A * (1 - Math.pow(v.v / Math.max(v0, 0.5), 4));
    // ---- leader: the next vehicle on this segment, else on the following segments (the chosen connector / the exit lane / short lanes behind it)
    let hasLead = false, leadGap = 0, leadV = 0;
    if (i + 1 < arr.length) { const u = arr[i + 1]; hasLead = true; leadGap = u.s - u.len - front; leadV = u.v; }
    else {
      let ns = lane ? v.next : seg.to, dist = seg.len - front;
      for (let hop = 0; ns && dist < 75 && hop < 4; hop++) {
        if (ns.veh.length) { const u = ns.veh[0]; hasLead = true; leadGap = dist + u.s - u.len; leadV = u.v; break; }
        // the tail of the vehicle that left this (short) lane last still lies on it: a bus turning out of a 6 m link of a split junction fills the link for seconds after its nose is gone
        if (ns.kind === 'lane') { const lo = ns.lastOut; if (lo && lo !== v && lo.trail[0] === ns && lo.s - lo.len < 0) { hasLead = true; leadGap = dist + ns.len + lo.s - lo.len; leadV = lo.v; break; } }
        dist += ns.len;
        ns = ns.kind === 'conn' ? ns.to : ns.defNext;
      }
      if (lane && i === arr.length - 1) {              // a car that just left this lane by ANOTHER connector (diverging paths share the first metres)
        const lo = seg.lastOut;
        if (lo && lo.trail[0] === seg && lo.seg !== v.next && lo.s - lo.len < 10) { const g = seg.len - front + lo.s - lo.len; if (!hasLead || g < leadGap) { hasLead = true; leadGap = g; leadV = lo.v; } }
      }
    }
    if (WHY()) v.why = '';
    if (v.cgOn) { const al = idmA(v, v0, v.cgGap, v.cgVl, 1.2); if (al < acc) { acc = al; if (WHY()) v.why = `col gap ${v.cgGap.toFixed(1)}`; } }
    if (hasLead) { const al = idmA(v, v0, leadGap, leadV, 2.0); if (al < acc) { acc = al; if (WHY()) v.why = `lead gap ${leadGap.toFixed(1)} v ${leadV.toFixed(1)}`; } }
    // ---- speed limit of the connector ahead
    if (lane && v.next && v.next.vmax < v0) {
      const d = Math.max(0, seg.len - front), lim = Math.sqrt(v.next.vmax * v.next.vmax + 2 * v.B * d);
      if (lim < v0) { v0 = lim; acc = Math.min(acc, v.A * (1 - Math.pow(v.v / Math.max(v0, 0.5), 4))); }
    }
    let holding = false;
    if (lane) {
      // ---- stop lines
      for (let k = 0; k < seg.stops.length; k++) {
        const sl = seg.stops[k], d = sl.s - front;
        if (d < -0.35) continue;
        if (sl.s <= v.passS) continue;                              // (a mid-lane line already crossed)
        if (d > 150) break;
        let stop = 0;
        if (sl.signal && v.pass !== seg) {
          const stt = signalState(sl.signal, sl.approach, time);
          if (stt === 'red') stop = 2;
          else if (stt === 'amber' && d > v.v * v.v / (2 * 3.2) + v.v * 0.12 + 0.9) stop = 1;
        }
        v.entryBlock = false;
        if (!stop && pedBusy && sl.crossing && d < 45 && pedBusy(sl.crossing)) stop = 2;          // give way to pedestrians on the zebra (also when the light is green for the car)
        if (!stop && sl.atEnd && v.next && d < 70) {
          const es = entryState(v, v.next, time);
          if (es === 2) { stop = 2; v.entryBlock = true; }
          else if (es === 1 && d > v.v * v.v / (2 * 5.0) + 1.0) { stop = 1; v.entryBlock = true; }
        }
        if (stop) {
          const as = idmA(v, v0, Math.max(0.05, d - S_LINE), 0, S_LINE); if (as < acc) { acc = as; if (WHY()) v.why = `stop ${stop} d ${d.toFixed(1)} sig ${sl.signal}`; }
          if (d < 4 && v.v < 1.0) holding = true;
          break;
        }
      }
      // ---- bus stops
      if (v.bus && seg.bus.length) {
        for (const bs of seg.bus) {
          if (v.served.has(bs.id) || (v.trolley ? bs.kind === 'bus' : bs.kind === 'trolley') || (v.arch.tour && !TOUR_STOP.test(bs.name || ''))) continue;
          const d = bs.s + 2.5 - front;
          if (d < -3) continue;
          if (v.dwell > 0 || (d < 1.2 && v.v < 0.35)) { acc = Math.min(acc, -3); v.at = bs; holding = true; break; }
          if (d < 90) { acc = Math.min(acc, idmA(v, v0, Math.max(0.05, d), 0, 0.3)); }
          break;
        }
      }
    }
    v.holding = holding;
    return Math.max(-9, acc);
  }

  // ---- safety net: vehicles of DIFFERENT segments that would run into each other (odd junction boxes, ways that cross without a node): the one behind brakes; for crossing paths the higher id yields
  const CGS = 10, HSZ = 2048; let cgNext = new Int32Array(1024); const cgHead = new Int32Array(HSZ);
  const cgHash = (ia, ib) => (Math.imul(ia, 73856093) ^ Math.imul(ib, 19349663)) & (HSZ - 1);
  /** the vehicles in the grid cells within r of (x, z) as the last collide() filed them (a cell bucket may hold far vehicles too, and an entry may be stale after a removal: fn tests the geometry) */
  function eachNear(x, z, r, fn) {
    const vs = sim.vehicles, c0 = Math.floor((x - r) / CGS), c1 = Math.floor((x + r) / CGS), r0 = Math.floor((z - r) / CGS), r1 = Math.floor((z + r) / CGS);
    for (let ia = c0; ia <= c1; ia++) for (let ib = r0; ib <= r1; ib++) for (let j = cgHead[cgHash(ia, ib)]; j >= 0; j = cgNext[j]) if (j < vs.length) fn(vs[j]);
  }
  function collide() {
    const vs = sim.vehicles, n = vs.length;
    if (cgNext.length < n) cgNext = new Int32Array(n * 2);
    cgHead.fill(-1);
    for (let i = 0; i < n; i++) { const v = vs[i]; v.sn = Math.sin(v.rot); v.cs = Math.cos(v.rot); const h = cgHash(Math.floor(v.x / CGS), Math.floor(v.z / CGS)); cgNext[i] = cgHead[h]; cgHead[h] = i; }
    for (let i = 0; i < n; i++) {
      const v = vs[i];
      if (v.tram) continue;                                                           // (a tram looks along its own rails: trams.js)
      v.cgOn = false;
      if (v.seg.kind === 'lane' && v.s > v.seg.len - 1.6 && v.v < 0.5) continue;
      const a = v.arch, fx = v.sn, fz = v.cs, rx = fz, rz = -fx, P = 2.0 + 1.3 * v.v;
      const pcx = v.x + fx * (a.front + P / 2), pcz = v.z + fz * (a.front + P / 2), phl = P / 2, phw = v.wid / 2 + 0.08;
      const bx = v.x + fx * a.front, bz = v.z + fz * a.front;                       // front bumper centre
      const cx = Math.floor(pcx / CGS), cz = Math.floor(pcz / CGS), rr = Math.ceil((P + 12) / CGS);
      let best = 1e9, bvl = 0;
      for (let ia = cx - rr; ia <= cx + rr; ia++) for (let ib = cz - rr; ib <= cz + rr; ib++) {
        for (let j = cgHead[cgHash(ia, ib)]; j >= 0; j = cgNext[j]) {
          const u = vs[j];
          if (u === v || u.seg === v.seg) continue;
          if (u.seg.kind === 'lane' && u.s > u.seg.len - 1.6 && u.v < 0.5) continue;       // a car queued at its stop line is the junction logic's business (lane ends of different ways overlap there)
          const ua = u.arch, ufx = u.sn, ufz = u.cs, urx = ufz, urz = -ufx;
          const du = ufx * fx + ufz * fz;
          if (!(u.v < 0.4 && v.v > 0.2)) {                                          // (a standing vehicle in the way is an obstacle whatever its heading: turns through a queue)
            if (du <= 0.35 ? !(du > -0.5 && u.id < v.id) : false) continue;          // oncoming: never; crossing: only when u has the lower id; same direction: always
            if (du <= -0.5) continue;
          }
          const ucx = u.x + ufx * (ua.front + ua.rear) / 2, ucz = u.z + ufz * (ua.front + ua.rear) / 2, uhl = (ua.front - ua.rear) / 2, uhw = u.wid / 2;
          const dx = ucx - pcx, dz = ucz - pcz;
          if (Math.abs(dx) > P + 20 || Math.abs(dz) > P + 20) continue;
          // separating axis test on the four axes (f, r of v; f, r of u)
          let sep = false;
          for (let k = 0; k < 4 && !sep; k++) {
            const nx = k === 0 ? fx : k === 1 ? rx : k === 2 ? ufx : urx, nz = k === 0 ? fz : k === 1 ? rz : k === 2 ? ufz : urz;
            const pa = phl * Math.abs(fx * nx + fz * nz) + phw * Math.abs(rx * nx + rz * nz), pb = uhl * Math.abs(ufx * nx + ufz * nz) + uhw * Math.abs(urx * nx + urz * nz);
            if (Math.abs(dx * nx + dz * nz) > pa + pb) sep = true;
          }
          if (sep) continue;
          let gap = 1e9;
          for (let k = 0; k < 4; k++) { const sl = k < 2 ? 1 : -1, sw = k & 1 ? -1 : 1; const qx = ucx + ufx * uhl * sl + urx * uhw * sw, qz = ucz + ufz * uhl * sl + urz * uhw * sw; const g = (qx - bx) * fx + (qz - bz) * fz; if (g < gap) gap = g; }
          if (gap < 0) gap = 0;
          if (gap < best) { best = gap; bvl = u.v; }
        }
      }
      if (best < 1e8) { v.cgOn = true; v.cgGap = best; v.cgVl = bvl; }
    }
  }

  function step() {
    const time = sim.time, newTime = time + DT;
    const t0 = PROF ? performance.now() : 0;
    collide();
    if (PROF) sim.stats.tCollide = (sim.stats.tCollide || 0) + performance.now() - t0;
    // spawn
    for (const src of sources) {
      if (time < src.next) continue;
      if (sim.vehicles.length - (trams ? trams.count() : 0) >= CAP) { src.next = time + 1.0; continue; }                           // the network is full: nobody enters (a jam must not grow without bound)
      const l = src.seg, last = l.veh[0], s0 = l.s0 || 0.5;
      if ((src.type === 'bus' || src.type === 'trolley') && !busOkLane(l)) { src.next = time + src.mean; continue; }
      const need = (src.type === 'car' ? 14 : 22) + s0 - 0.5;
      if (last && last.s - last.len < need) { src.next = time + 1.0; continue; }
      src.next = time + Math.max(1.5, -Math.log(1 - rng()) * src.mean);
      spawnVehicle(l, src.type, s0, Math.min(l.speed * 0.8, last ? last.v + 1.5 : 99));
    }
    pending.length = 0; dead.length = 0;
    const walker = opts.walker?.();
    for (let si = 0; si < act.length; si++) {
      const seg = act[si], arr = seg.veh; if (!arr.length) continue;
      for (let i = arr.length - 1; i >= 0; i--) {
        const v = arr[i];
        if (v.wrecked) { v.v = 0; v.brake = true; continue; }
        if (regional && seg.kind === 'lane') {                                  // the exits of the lane changed with the region
          if (v.next ? !v.next.on : (seg.okConns.length > 0 && v.s < seg.len - 6)) v.next = choose(v, seg);
        }
        // dwelling bus
        if (v.dwell > 0 || (v.at && v.v < 0.2 && v.holding)) {
          if (v.dwell <= 0 && v.at) { v.dwell = v.arch.tour ? 28 + rng() * 22 : 12 + rng() * 16; v.doorT = 0; }
          if (v.dwell > 0) { v.dwell -= DT; v.door = Math.min(1, v.door + DT / 1.2); if (v.dwell <= 0) { v.served.add(v.at.id); v.at = null; } }
        } else v.door = Math.max(0, v.door - DT / 1.2);
        const a = accel(v, arr, i, time);
        v.acc = a;
        v.v = Math.max(0, v.v + a * DT);
        if (v.dwell > 0 || v.collisionUntil > time) v.v = 0;
        let yielding = false;
        if (walker && Math.abs(walker.x-v.x)<35 && Math.abs(walker.z-v.z)<35) {
          const dx=walker.x-v.x, dz=walker.z-v.z;
          const ahead=dx*v.sn+dz*v.cs, side=dx*v.cs-dz*v.sn;
          if (ahead>=v.arch.rear-.32 && Math.abs(side)<=v.wid/2+.34) {
            const y=opts.roadHeight?.(v.x,v.z,v.rot) ?? 0;
            if (walker.y<y+2.1 && walker.y+1.65>y) {
              const gap=Math.max(0,ahead-v.arch.front-.55);
              const safe=Math.min(gap/DT,Math.sqrt(9*gap));
              yielding=v.v>safe || gap<.08;
              v.v=Math.min(v.v,safe);
            }
          }
        }
        v.s += v.v * DT;
        v.brake = yielding || a < -0.7 || (v.v < 0.25 && v.holding) || v.dwell > 0 || v.collisionUntil > time;
        if (v.v < 0.25 && v.holding) v.wait += DT; else if (v.v > 1) v.wait = 0;
        // a turning car that cannot find a gap for 10 s gives up and drives straight on (a shared left / straight lane must not stay blocked)
        if (v.v < 0.25 && v.holding && v.entryBlock) { v.eWait = (v.eWait || 0) + DT; if (v.eWait > 10 && v.next && v.next.turn !== 'straight') { const alt = seg.okConns.find((c) => c.turn === 'straight'); if (alt) { v.next = alt; v.eWait = 0; } } } else v.eWait = 0;
        // A long red/blocked queue is not permission to delete a car in front
        // of the player. Recover stale queues only after the car is out of view.
        if (v.wait > 170 && hidden(v.x, v.z)) dead.push(v);
        if (v.s > seg.cut) {
          if(hidden(v.x,v.z)){dead.push(v);sim.stats.deadlocks=(sim.stats.deadlocks||0)-1;}
          else {v.s=seg.cut;v.v=0;v.brake=true;}
        }      // (left the map at the water's edge: not a deadlock)
        else if (v.s > seg.len) pending.push(v);
      }
    }
    for (const v of dead) { remove(v); sim.stats.deadlocks = (sim.stats.deadlocks || 0) + 1; }
    // transitions
    for (const v of pending) {
      if (dead.includes(v)) continue;
      const seg = v.seg;
      if (seg.kind === 'lane') {
        const c = v.next;
        if (!c || (regional && !c.on)) {
          const end=seg.len+Math.min(v.len+3,8);
          if(v.s>end){if(hidden(v.x,v.z))remove(v);else{v.s=end;v.v=0;v.brake=true;}}
          continue;
        }
        // may the car really enter? (it is "committed" on amber, but a red light / occupied box is a hard stop)
        let ok = true;
        const sl = seg.stops.find((x) => x.atEnd);
        const thru = v.pass === seg;                                  // (entered the node cluster on a green: the micro links inside it have no light of their own for this car)
        if (sl && sl.signal && !thru) { const stt = signalState(sl.signal, sl.approach, time); if (stt === 'red') ok = false; }
        if (ok && pedBusy && sl && sl.crossing && pedBusy(sl.crossing)) ok = false;
        if (ok && entryState(v, c, time) === 2) ok = false;
        if (!ok) { v.s = seg.len; v.v = 0; v.brake = true; v.holding = true; continue; }
        if (sim.onCross && sl) sim.onCross(v, sl, sl.signal && !thru ? signalState(sl.signal, sl.approach, time) : 'none', time);
        v.sigOk = !!(sl && sl.signal);                               // crossed a signalled line on green / amber (or rolls on inside the cluster)
        const o = v.s - seg.len;
        seg.veh.splice(seg.veh.indexOf(v), 1); seg.lastOut = v;
        v.trail.unshift(seg); if (v.trail.length > 3) v.trail.pop();
        v.s = o; v.passS = -1; insert(c, v); v.next = null; if (c.zip) c.to.lastFrom = c;
        if (v.bus && !v.arch.tour && routeOf) pickRoute(v, c.to);
      } else {
        const to = seg.to, o = v.s - seg.len;
        seg.veh.splice(seg.veh.indexOf(v), 1);
        v.trail.unshift(seg); if (v.trail.length > 3) v.trail.pop();
        v.s = o; v.passS = -1; v.next = choose(v, to); insert(to, v);
        v.pass = v.sigOk && to.len < MICRO ? to : null; v.sigOk = v.pass !== null;
      }
    }
    if (trams && !rolling) trams.step(time);
    // trips end: a vehicle older than its lifespan that nobody can see leaves (one-way rings and loops of the lane graph would otherwise fill up with cars that never find the way out of the region)
    if (regional && hidden && sim.stats.steps % 15 === 0) for (let i = sim.vehicles.length - 1; i >= 0; i--) { const v = sim.vehicles[i]; if (time > v.die && !v.dwell && hidden(v.x, v.z)) { remove(v); sim.stats.retired = (sim.stats.retired || 0) + 1; } }
    // mid-lane stop lines already passed
    for (const v of sim.vehicles) { if (v.seg.kind === 'lane') for (const sl of v.seg.stops) { if (!sl.atEnd && v.s > sl.s + 0.35 && sl.s > v.passS) { if (sim.onCross && sl.signal) sim.onCross(v, sl, signalState(sl.signal, sl.approach, time), time); v.passS = sl.s; } } }
    // poses
    for (const v of sim.vehicles) { v.px = v.x; v.pz = v.z; v.prot = v.rot; v.px2 = v.x2; v.pz2 = v.z2; v.prot2 = v.rot2; poseOf(v); }
    sim.time = newTime; sim.stats.steps++;
  }
  function remove(v) {
    v.retired = true;
    v.wreckCleanup?.();
    const arr = v.seg.veh, i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1);
    if (v.trail[0] && v.trail[0].lastOut === v) v.trail[0].lastOut = null;
    const j = sim.vehicles.indexOf(v); if (j >= 0) { sim.vehicles[j] = sim.vehicles[sim.vehicles.length - 1]; sim.vehicles.pop(); }
    sim.stats.despawned++;
  }

  sim.reset = reset;
  // Promotion to the player's driving controller transfers identity and damage;
  // it is not a normal despawn and must not invoke wreck cleanup on that record.
  sim.detach = v => {
    if(!sim.vehicles.includes(v)||v.tram||v.arch?.tram)return false;
    const i=v.seg.veh.indexOf(v);if(i>=0)v.seg.veh.splice(i,1);
    for(const segment of [v.seg,...v.trail])if(segment.lastOut===v)segment.lastOut=null;
    const j=sim.vehicles.indexOf(v);sim.vehicles[j]=sim.vehicles.at(-1);sim.vehicles.pop();
    v.claimed=true;v.v=0;v.brake=true;v.dwell=0;v.at=null;v.door=0;v.pax=false;v.route=null;v.next=null;v.trail=[];v.served?.clear();
    sim.stats.claimed=(sim.stats.claimed||0)+1;return true;
  };
  sim.step = step;
  /** advance (or restart + fast-forward) so that sim.time <= t < sim.time + DT; returns the interpolation factor 0..1 */
  let started = false;
  sim.advanceTo = (t) => {
    if (!started) { started = true; reset(); }                  // lazy: the first call knows where the camera is
    else if (t < sim.time - 1e-6) reset();
    else recentre(false);
    let guard = 0, k = 0;
    while (sim.time + DT <= t + 1e-9 && guard++ < 40000) { step(); if (regional && ++k % 15 === 0) recentre(false); }
    return Math.max(0, Math.min(1, (t - sim.time) / DT));
  };
  sim.recentre = recentre;
  sim.signalState = signalState; sim.entryState = entryState; sim.roomAhead = roomAhead; sim.occupied = occupied;
  sim.start = () => { if (!started) { started = true; reset(); } };       // (tools that call step() themselves)
  sim.active = act;
  lap('ready');
  return sim;
}
