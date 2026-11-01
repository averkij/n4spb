// streets/wires.js - the TROLLEYBUS OVERHEAD WIRE network of the centre, the visual signature of Nevsky (docs/research/nevsky.md section 4, transport.md section 5, streets.md 14;
// photos nevsky 26 27 31 78, transport trolley_electricnets):
//   * pairs of contact wires (+ / -, 0.5 m apart, ~5.8 m above the road) over the kerb lane and the next lane of every carriageway that carries trolleybus routes
//     (ROADS[].trolley; 7 routes on Nevsky), hung from CROSS-SPAN wires that run from facade rosette to facade rosette across the whole street every 24-34 m (no poles in the
//     roadway; one span serves both carriageways of Nevsky); where a side of the street is open (squares, the Fontanka) a plain black mast stands at the kerb instead;
//   * the span sags to ~6.4 m at mid, short vertical hangers (<= 0.9 m) tie the contact wires to it, the contact wires sag a little between the spans;
//   * at junctions (and at the joints between two OSM ways) the wires of routes that continue, turn or cross are joined by bezier arcs, X crossings get a small crossing frame ("frog");
//   * a few blue lane-use arrow signs hang from the spans on the approaches of Nevsky junctions (streets.md summary 7).
// INVARIANT (tools/wires-test.mjs): NO WIRE ENDS IN THE AIR. Every end of a contact wire is either joined to an arc / the next way's wire, or it stops exactly on a cross-span (the hanger
// stands there), or a tie leads it to a rosette / mast; every span ends on a facade rosette or a mast. How the builder guarantees it (generic: it only looks at the network, no coordinates):
//   1. wire records per (way, travel direction, lane); the nodes join them lane to lane (straight on: every lane, also across the joints of two OSM ways) or kerb to kerb (turns);
//   2. wire ends that stay free (route stops, lane that does not continue, data extent, junction that nothing leaves from) are TERMINATED: snapped to a span within 10 m, else a new
//      span (facade / mast) is created exactly at the end, else the end is tied to a rosette / a mast by a short tie wire (kind 'tie'), else the stub is deleted;
//   3. gaps longer than ~44 m between supports (open squares, bridges) get an extra span (facade anchors or masts on the kerb / on the bridge deck);
//   4. the span profile is clamped to <= 0.9 m above the contact wire wherever a hanger stands, so every hanger really reaches its span.
// Drawn through ctx.wires (one draw call; every polyline carries kind: contact | arc | span | hanger | tie, for the test) + a few merged boxes (rosettes, frogs, masts, signs).
// Published as service `wires`: contact-wire pair centrelines for traffic (trolleybus poles), the spans (landmarksC hangs pendant lamps on the Anichkov ones) and the anchors.
// KNOCKABLE MASTS (core/knock.js, lib/knock-inst.js): with ctx.knock the plain black kerb masts are instanced per 384 m cell (Dynamic, registerLOD 320 m, ONE geometry, the height is the
//   instance scale) and registered as kind 'mast' (350 kg, anchored: holds a bump, breaks off at the foot above 24 km/h of the car, steel clank), the physics collider is kept; the masts of
//   a bridge deck stay in the merged pole mesh (a deck is not a floor for a toppled pole). Without ctx.knock the masts are merged into the pole mesh exactly as before.
//   THE WIRES STAY: a knocked mast does not take its span along. The contact wires, hangers and spans are segments of the ONE ctx.wires draw (core/geo.js; in the shipped page that mesh
//   is the baked one), there is no per-span handle to collapse, and a span alone could not go anyway (the contact wires hang from it through the hangers and run on to the next
//   span): the strands stay in the air as in the 103 reference. A span that loses its mast keeps hanging on the rosette at its other end; the wire is not a physical rope.
import { wayAt } from './net.js';
import { prepWay, WALK_Y } from './surface.js';
import { latAt } from './lanes.js';
import { clearanceHit } from './bld.js';
import { hash2, clamp, inMergedStrip, INST_STATS } from './furn.js';
import { VB } from './vb.js';
import { knockInstances } from '../lib/knock-inst.js';
import { PointGrid, pairs } from './util.js';
import * as L from '../layout.js';
import * as PALACE_FR from '../landmarksPalaceBridge/frame.js';          // (pure frames of the two bascule bridges: toUV and the pier faces, for the span cut below)
import * as TROITSKY_FR from '../landmarksTroitsky/frame.js';
import { longDeckHeight } from './decks.js';

const H0 = 5.8;                                  // contact wire height above the road
const WIRE = '#1d1f22', SPANC = '#2a2d31';
const HANGER = 0.9;                              // the span is never higher than this above the contact wire where a hanger stands
const ENV = (typeof process !== 'undefined' && process.env) || {};          // WIRES_SNAP / WIRES_GAP: knobs for the robustness runs of tools/wires-test.mjs
const SNAP = Number(ENV.WIRES_SNAP) || 10;       // a free wire end moves to a span at most this far away
const GAP = Number(ENV.WIRES_GAP) || 44;         // longest unsupported run of a contact wire (m)
const BRIDGE_GAP = Math.min(GAP, 56);          // ... on a bridge: a few metres longer than on the street is not needed any more: the test limit is 60 m between hangers / ties / ends            // ... on a bridge (landmarksC draws the Anichkov Bridge without masts: its wires hang from the facades at both ends)
const CHAIN = Number(ENV.WIRES_CHAIN) || 70;     // longest run over a joint: last support of one way's wire + arc + first support of the next
const MAST_H = 9.0, MAST_FAR = 320;             // the instanced mast model stands 9 m (a tie mast of 8 m is the same model scaled), seen up to this far
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** the spans of the bascule bridges whose module is in the page's build list: { id, toUV, u0, u1 (the pier faces), hv (the half width of the zone) } */
function bridgeZones(ctx) {
  const list = Array.isArray(ctx.buildList) ? ctx.buildList : null, out = [];
  if (!list) return out;
  // (the Palace Bridge: from the last cross span of the fixed approach (u 62: two masts at the deck edges, hangers) to the first of the other one (u 186): everything between them hangs over the two bascule pier heads (u 85.3 .. 96.5, 153.9 .. 165.1) and the
  // leaves, which stand up on the inner pier faces, so the wires of the fixed spans end at that last cross span, in front of the barrier, and not loose against a raised leaf; the gap fill of the streets module put its midspan masts at u 124)
  if (list.includes('landmarksPalaceBridge')) out.push({ id: 'palace', toUV: PALACE_FR.toUV, u0: 62.5, u1: 185.5, hv: 30 });
  if (list.includes('landmarksTroitsky')) out.push({ id: 'troitsky', toUV: TROITSKY_FR.toUV, u0: TROITSKY_FR.U_HINGE, u1: TROITSKY_FR.U_TIP, hv: 30 });
  return out;
}
/** a polyline [[x, y, z], ...] against the span of zone q (clipped in u at the pier faces): null when no segment touches the span, else { keep: [polylines outside], cut: [polylines over the span] } */
function clipLine(pts, q) {
  const us = pts.map((p) => q.toUV(p[0], p[2])), pieces = []; let hit = false;
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], A = us[i - 1], B = us[i], ts = [0];
    for (const k of [q.u0, q.u1]) if ((A.u - k) * (B.u - k) < 0) ts.push((k - A.u) / (B.u - A.u));
    ts.push(1); ts.sort((x, y) => x - y);
    for (let j = 1; j < ts.length; j++) {
      const tm = (ts[j - 1] + ts[j]) / 2, u = A.u + (B.u - A.u) * tm, v = A.v + (B.v - A.v) * tm, inn = u > q.u0 && u < q.u1 && Math.abs(v) < q.hv;
      if (inn) hit = true;
      pieces.push({ a: lerp(a, b, ts[j - 1]), b: lerp(a, b, ts[j]), inn });
    }
  }
  if (!hit) return null;
  const keep = [], cutL = []; let cur = null, curIn = null;
  for (const pc of pieces) { if (!cur || pc.inn !== curIn) { cur = [pc.a]; curIn = pc.inn; (pc.inn ? cutL : keep).push(cur); } cur.push(pc.b); }
  return { keep, cut: cutL };
}

export function buildWires(ctx, net, lamps, opts = {}) {
  const T0 = now();
  const { avoid = [], inPlaza = () => false, poles = null, panels = null, signTex = null } = opts;
  const stats = { pairs: 0, spans: 0, rosettes: 0, masts: 0, hangers: 0, arcs: 0, frogs: 0, signs: 0, wireKm: 0, ties: 0, snapped: 0, terminals: 0, gapSpans: 0, dropped: 0, ms: 0 };
  const service = { height: H0, pairs: [], spans: [], arcs: [], masts: [], anchors: [] };
  // THE MOVING SPANS (docs/AREAS.md 13.8, 13.10): where the page builds the module of a bascule bridge (it draws and moves the leaves), nothing may hang over or stand on the span between the pier faces: the contact wires are
  // CLIPPED at the pier faces (the part over the span goes to service.cut[id], the module draws it as a dynamic object that is visible only while the leaves are down), the cross spans / hangers / masts of the span are not drawn
  // (the masts: no collider either). A page without the module (the strip, the parked area) has no zone: nothing changes.
  const zones = bridgeZones(ctx);
  // Streets build before bridges, so query their shared pure deck profile.
  // Lift every connected strand and its published traffic service equally;
  // moving only the visible mast would leave its anchor and collider below it.
  const raised = p => [p[0],p[1]+(longDeckHeight(p[0],p[2])??0),p[2]];
  const spanCut = service.cut = {}; for (const z of zones) spanCut[z.id] = [];
  const zoneAt = (x, z) => { for (const q of zones) { const p = q.toUV(x, z); if (p.u > q.u0 + 0.01 && p.u < q.u1 - 0.01 && Math.abs(p.v) < q.hv) return q; } return null; };
  const add = (pts, width, color, kind, grp) => {
    pts=pts.map(raised);
    if (zones.length) for (const q of zones) {
      const r = clipLine(pts, q); if (!r) continue;
      for (const l of r.keep) ctx.wires.add(l, { width, color, kind, grp });
      if (kind === 'contact') for (const l of r.cut) spanCut[q.id].push({ pts: l, width, color });
      return;
    }
    ctx.wires.add(pts, { width, color, kind, grp });
  };
  const refsOf = (w) => (w.rec && w.rec.trolley) || [];
  // a bridge way that the east bridges or the north bridges own (skipDraw) and that starts on their raised deck carries the module's own contact wires (eastBridges.js) or none at street height (northBridges: they would hang inside the deck), as in the source
  const onOwnDeck = (w) => w.skipDraw && (ctx.services.eastBridges?.deckY(w.x[0], w.z[0]) != null || ctx.services.northBridges?.deckY(w.x[0], w.z[0]) != null);
  const tw = net.ways.filter((w) => refsOf(w).length && w.rank >= 1 && w.L > 6 && !onOwnDeck(w));
  if (!tw.length) return { stats, service };
  for (const w of tw) prepWay(w);

  // ------------------------------------------------------------ wire records: one per (way, travel direction, lane)
  const wires = [];                                // { id, w, dir, j, refs, kerb, lo, hi (kept arclength range), jLo / jHi (joined to an arc), supports }
  for (const w of tw) {
    const K = w.lanes.nF + w.lanes.nB, refs = refsOf(w);
    const lanes = [];
    if (w.oneway) { lanes.push([1, K - 1]); if (K >= 3 && w.rank >= 3) lanes.push([1, K - 2]); }
    else { lanes.push([1, K - 1]); lanes.push([-1, 0]); }
    for (const [dir, j] of lanes) wires.push({ id: `W${w.id}:${dir > 0 ? 'f' : 'b'}${j}`, idx: wires.length, w, dir, j, refs, kerb: (dir > 0 ? j === K - 1 : j === 0), lo: 0, hi: w.L, jLo: false, jHi: false, dead: false, drawn: false, tLo: false, tHi: false, supports: [], supMap: new Map(), base: null, sups: [], hAt: () => H0 });
  }
  const latOf = (wr, q) => (latAt(wr.w, q, wr.j) + latAt(wr.w, q, wr.j + 1)) / 2;
  /** plan position of the wire (centre of the pair) of a record at arclength s; sub = -1 / +1 picks the left / right wire of the pair relative to the travel direction */
  const pt = (wr, s, sub = 0) => {
    const q = wayAt(wr.w, s), lat = latOf(wr, q) + sub * 0.25 * wr.dir, nx = -q.tz, nz = q.tx;
    return [q.x + nx * lat, q.z + nz * lat, q.tx * wr.dir, q.tz * wr.dir];
  };
  const step = 3.0;
  for (const wr of wires) {                        // plan samples of the pair centre along the whole way
    const w = wr.w, n = Math.max(2, Math.ceil(w.L / step) + 1), base = [];
    for (let i = 0; i < n; i++) { const s = w.L * i / (n - 1), p = pt(wr, s); base.push({ s, x: p[0], z: p[1] }); }
    wr.base = base;
  }
  // only the part of a way inside the data extent (the union of the eight extent rectangles) is wired: the 70 m run-on of a main street past the clip line (net.js rawWays) has no facade to hang a span on
  for (const wr of wires) {
    const ins = wr.base.filter((b) => L.inExtent(b.x, b.z));
    if (!ins.length) { wr.dead = true; continue; }
    wr.lo = ins[0].s; wr.hi = ins[ins.length - 1].s;
  }

  // ------------------------------------------------------------ cross-spans
  const spans = [];                                // { id, A:[x,z,y], B:[x,z,y], tx, tz, poleA, poleB, mid, len, knots }
  /** a facade hit on one side of (px,pz) along the normal (nx,nz) * sg: a rosette position (building height gives the height) or null */
  const facadeSide = (px, pz, nx, nz, sg) => {
    const hit = clearanceHit(px, pz, nx * sg, nz * sg, 66);
    if (hit && Math.abs(hit.nx * nx + hit.nz * nz) > 0.62) {
      const b = L.buildingAt(hit.x - hit.nx * 0.4, hit.z - hit.nz * 0.4);
      const h = b ? L.heightOf(b) : 0;
      if (b && h >= 8.2 && (b.minH || 0) < 0.5 && !L.insideBuilding(hit.x + hit.nx * 0.5, hit.z + hit.nz * 0.5, 0.1)) return { x: hit.x + hit.nx * 0.1, z: hit.z + hit.nz * 0.1, y: clamp(h - 1.0, 7.2, 9.6), nx: hit.nx, nz: hit.nz, t: hit.t, pole: false };
    }
    return null;
  };
  /** a mast on the pavement edge where the asphalt ends along the ray (kerb + 1.4 m) or null */
  const mastSide = (px, pz, nx, nz, sg, h = 9.0, maxD = 56) => {
    let d = 3;
    while (d < 60 && (net.cover(px + nx * sg * d, pz + nz * sg * d, {}) > -2.2 || net.cover(px + nx * sg * (d + 1.6), pz + nz * sg * (d + 1.6), {}) > -0.5 || inMergedStrip(net, px + nx * sg * (d + 1.6), pz + nz * sg * (d + 1.6)))) d += 1.0;     // the mast base itself must be clear too (a fillet, a pocket,
    d += 1.6;                                                                                                                                                             // the other carriageway behind a median gap)
    const x = px + nx * sg * d, z = pz + nz * sg * d;
    if (d > maxD || L.insideBuilding(x, z, 0.3) || L.inRiver(x, z)) return null;
    return { x, z, y: h, nx: -nx * sg, nz: -nz * sg, t: d, pole: true };
  };
  const makeSpan = (a, b) => {
    const len = Math.hypot(a.x - b.x, a.z - b.z);
    return { A: [a.x, a.z, a.y], B: [b.x, b.z, b.y], poleA: a.pole, poleB: b.pole, deckA: !!a.deck, deckB: !!b.deck, nxA: a.nx, nzA: a.nz, nxB: b.nx, nzB: b.nz, len, tx: (b.x - a.x) / len, tz: (b.z - a.z) / len, mid: [(a.x + b.x) / 2, (a.z + b.z) / 2], knots: [], id: -1 };
  };
  const spanAt = (px, pz, nx, nz) => {
    const A = facadeSide(px, pz, nx, nz, 1), B = facadeSide(px, pz, nx, nz, -1);
    if (!A && !B) return null;
    // one side open: a mast at the kerb
    const a = A || mastSide(px, pz, nx, nz, 1), b = B || mastSide(px, pz, nx, nz, -1);
    if (!a || !b || (A ? 0 : 1) + (B ? 0 : 1) > 1) return null;
    const len = Math.hypot(a.x - b.x, a.z - b.z);
    if (len < 12 || len > 96) return null;
    return makeSpan(a, b);
  };
  const NG = 16, nodeGrid = new Map();             // junction nodes by cell (nearNode used to scan every node for every candidate)
  for (const n of net.nodes) if (n.arms.length >= 3) { const k = Math.floor(n.x / NG) * 4096 + Math.floor(n.z / NG); let l = nodeGrid.get(k); if (!l) nodeGrid.set(k, (l = [])); l.push(n); }
  const nearNode = (x, z, r) => {
    for (let cx = Math.floor((x - r) / NG); cx <= Math.floor((x + r) / NG); cx++) for (let cz = Math.floor((z - r) / NG); cz <= Math.floor((z + r) / NG); cz++) for (const n of nodeGrid.get(cx * 4096 + cz) || []) if (Math.hypot(n.x - x, n.z - z) < r) return true;
    return false;
  };
  const registerSpan = (sp) => { sp.id = spans.length; spans.push(sp); return sp; };
  /** a terminal / gap span, or the identical span that already stands there (two wires asking for the same cross-span) */
  const registerOrReuse = (sp) => {
    const same = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.5;
    const ex = spans.find((o) => (same(o.A, sp.A) && same(o.B, sp.B)) || (same(o.A, sp.B) && same(o.B, sp.A)));
    return ex || registerSpan(sp);
  };
  for (const w of tw) {
    if (w.bridge) continue;
    let s = 8 + hash2(w.i, 11) * 14;
    for (; s < w.L - 8; s += 24 + hash2(w.i, Math.round(s)) * 12) {
      const q = wayAt(w, s);
      if (nearNode(q.x, q.z, 9.5) || inPlaza(q.x, q.z)) continue;
      const nx = -q.tz, nz = q.tx;
      // reuse a span that already crosses here (the other carriageway of the street)
      const ex = spans.find((sp) => { const dx = sp.mid[0] - q.x, dz = sp.mid[1] - q.z; return Math.abs(dx * sp.tx + dz * sp.tz) < 9 && Math.abs(sp.tx * q.tx + sp.tz * q.tz) < 0.35 && Math.abs(-dx * sp.tz + dz * sp.tx) < sp.len / 2 + 6; });
      if (ex) continue;
      const sp = spanAt(q.x, q.z, nx, nz);
      if (sp) registerSpan(sp);
    }
  }
  // bridge ways: spans anchored at both ends of the approaches are enough for short bridges (the contact wires stretch over the deck); landmarksC hangs pendants on them.
  // Long bridges / gaps get masts below (gap fill)

  // ------------------------------------------------------------ span crossings (supports) found through a grid of the wire segments
  const segX = (ax, az, bx, bz, cx, cz, dx, dz) => {                        // intersection of AB with CD -> {t,u} or null
    const rx = bx - ax, rz = bz - az, sx = dx - cx, sz = dz - cz, den = rx * sz - rz * sx; if (Math.abs(den) < 1e-9) return null;
    const t = ((cx - ax) * sz - (cz - az) * sx) / den, u = ((cx - ax) * rz - (cz - az) * rx) / den;
    return t >= -1e-6 && t <= 1 + 1e-6 && u >= 0 && u <= 1 ? { t: clamp(t, 0, 1), u } : null;
  };
  const WG = 16, wgrid = new Map(); let wstamp = 0;
  for (const wr of wires) for (let i = 0; i + 1 < wr.base.length; i++) {
    const a = wr.base[i], b = wr.base[i + 1], e = { wr, i, st: 0 };
    for (let cx = Math.floor(Math.min(a.x, b.x) / WG); cx <= Math.floor(Math.max(a.x, b.x) / WG); cx++) for (let cz = Math.floor(Math.min(a.z, b.z) / WG); cz <= Math.floor(Math.max(a.z, b.z) / WG); cz++) { const k = cx * 4096 + cz; let l = wgrid.get(k); if (!l) wgrid.set(k, (l = [])); l.push(e); }
  }
  /** a wire may cross a span twice (a hairpin: a U turn of the way); two hits within 2 m of arclength are one crossing (a hit on a vertex shared by two segments) */
  const addSupport = (wr, sp, s, u, x, z) => {
    let l = wr.supMap.get(sp.id); if (!l) wr.supMap.set(sp.id, (l = []));
    const ex = l.find((c) => Math.abs(c.s - s) < 2); if (ex) return ex;
    const q = { s, sp, u, x, z }; l.push(q); wr.supports.push(q); return q;
  };
  const supNear = (wr, sp, s) => { let b = null; for (const c of wr.supMap.get(sp.id) || []) if (!b || Math.abs(c.s - s) < Math.abs(b.s - s)) b = c; return b; };
  const crossSpan = (sp) => {
    const stamp = ++wstamp, n = Math.max(1, Math.ceil(sp.len / 4));
    for (let k = 0; k <= n; k++) {
      const px = sp.A[0] + (sp.B[0] - sp.A[0]) * k / n, pz = sp.A[1] + (sp.B[1] - sp.A[1]) * k / n, cx0 = Math.floor(px / WG), cz0 = Math.floor(pz / WG);
      for (let cx = cx0 - 1; cx <= cx0 + 1; cx++) for (let cz = cz0 - 1; cz <= cz0 + 1; cz++) for (const e of wgrid.get(cx * 4096 + cz) || []) {
        if (e.st === stamp) continue; e.st = stamp;
        if (e.wr.dead) continue;
        const a = e.wr.base[e.i], b = e.wr.base[e.i + 1], X = segX(a.x, a.z, b.x, b.z, sp.A[0], sp.A[1], sp.B[0], sp.B[1]);
        if (X) addSupport(e.wr, sp, a.s + (b.s - a.s) * X.t, X.u, a.x + (b.x - a.x) * X.t, a.z + (b.z - a.z) * X.t);
      }
    }
  };

  // ------------------------------------------------------------ junction arcs: join the wires of routes that continue, turn or cross
  const arcs = [];                                                           // { wx, wy, sub, refs, node, fx, fy, sx, sy }: fx / fy 'lo' | 'hi' = the end of the wire, else the fixed arclength sx / sy
  const arcPoints = (P, T, Q, U, n = 12) => {                                // bezier from P (tangent T) to Q (tangent U), plan
    const d = Math.hypot(Q[0] - P[0], Q[1] - P[1]), k = d * 0.4, out = [];
    const p1 = [P[0] + T[0] * k, P[1] + T[1] * k], p2 = [Q[0] - U[0] * k, Q[1] - U[1] * k];
    for (let i = 0; i <= n; i++) { const t = i / n, v = 1 - t; out.push([v * v * v * P[0] + 3 * v * v * t * p1[0] + 3 * v * t * t * p2[0] + t * t * t * Q[0], v * v * v * P[1] + 3 * v * v * t * p1[1] + 3 * v * t * t * p2[1] + t * t * t * Q[1]]); }
    return out;
  };
  const wiresOfWay = new Map(); for (const wr of wires) { let l = wiresOfWay.get(wr.w); if (!l) wiresOfWay.set(wr.w, (l = [])); l.push(wr); }
  /** the wires of an arm's way that travel in direction `dir`, kerb wire first */
  const armWires = (a, dir) => (wiresOfWay.get(a.w) || []).filter((wr) => wr.dir === dir).sort((p, q) => (q.kerb ? 1 : 0) - (p.kerb ? 1 : 0) || (dir > 0 ? q.j - p.j : p.j - q.j));
  const isEnd = (arm) => arm.k === 0 || arm.k === arm.w.n - 1;
  /** cut the wire record at arclength s, keeping the part that lies on the far side of the node (along = the arm direction: +1 keeps s >= cut, -1 keeps s <= cut) */
  const cut = (wr, s, along) => { if (along > 0) wr.lo = Math.max(wr.lo, s); else wr.hi = Math.min(wr.hi, s); };
  const join = (wr, along) => { if (along > 0) wr.jLo = true; else wr.jHi = true; };
  for (const nd of net.nodes) {
    if (nd.arms.length < 2) continue;
    const joint = nd.arms.length === 2;
    const ent = [], lea = [];                                                // arms that traffic can enter the node from / leave it along
    for (const a of nd.arms) {
      if (!wiresOfWay.has(a.w)) continue;
      if (!a.w.oneway || a.along < 0) ent.push(a);                           // travel with +s arrives from the arm at lower s (along = -1)
      if (!a.w.oneway || a.along > 0) lea.push(a);
    }
    const connected = new Set();
    for (const X of ent) for (const Y of lea) {
      if (X.w === Y.w) continue;
      const common = refsOf(X.w).filter((r) => refsOf(Y.w).includes(r)); if (!common.length) continue;
      const dot = X.dx * Y.dx + X.dz * Y.dz;
      if (dot > 0.82) continue;                                              // no U turns
      const straight = dot < -0.8;                                           // straight on: every lane continues into the same lane of the next way
      const xs = armWires(X, -X.along), ys = armWires(Y, Y.along);
      const nPair = straight ? Math.min(xs.length, ys.length) : 1;
      const dX = joint ? 0.01 : clamp((X.box || 6) + 3, 6, 15), dY = joint ? 0.01 : clamp((Y.box || 6) + 3, 6, 15);
      const sx = clamp(X.sN + X.along * dX, 0.5, X.w.L - 0.5), sy = clamp(Y.sN + Y.along * dY, 0.5, Y.w.L - 0.5);
      for (let k = 0; k < nPair; k++) {
        const wx = xs[k], wy = ys[k]; if (!wx || !wy || (!straight && (!wx.kerb || !wy.kerb))) continue;
        for (const sub of [-1, 1]) arcs.push({ wx, wy, sub, refs: common, node: nd.id, fx: isEnd(X) ? (X.along > 0 ? 'lo' : 'hi') : null, fy: isEnd(Y) ? (Y.along > 0 ? 'lo' : 'hi') : null, sx, sy });
        if (isEnd(X)) { if (!joint) cut(wx, sx, X.along); join(wx, X.along); }
        if (isEnd(Y)) { if (!joint) cut(wy, sy, Y.along); join(wy, Y.along); }
        connected.add(wx); connected.add(wy);
      }
    }
    // wires that end at a junction without a connection (second lanes, routes that stop there) stop 7 m before it (and are terminated by a span below)
    if (!joint) for (const a of nd.arms) {
      if (!isEnd(a) || !wiresOfWay.has(a.w)) continue;
      for (const wr of wiresOfWay.get(a.w)) if (!connected.has(wr)) cut(wr, clamp(a.sN + a.along * 7, 0.5, a.w.L - 0.5), a.along);
    }
  }
  // degenerate pieces: two junctions closer than the cut distances (the wire between them collapses to one point where both arcs meet), tiny stubs without any connection are deleted
  for (const wr of wires) {
    if (wr.hi < wr.lo + 0.5) {
      if (wr.jLo && wr.jHi) wr.lo = wr.hi = (wr.lo + wr.hi) / 2;
      else if (wr.jLo) wr.hi = wr.lo;
      else if (wr.jHi) wr.lo = wr.hi;
      else wr.dead = true;
    } else if (!wr.jLo && !wr.jHi && wr.hi - wr.lo < 4) wr.dead = true;
  }
  // an arc to a wire that was deleted above is not drawn: the surviving wire is no longer joined at that end (it is terminated below instead of ending in the air)
  /** a junction arc is live while both wires live AND each wire still reaches the arc's anchor (a wire cut back to its last support no longer touches an arc anchored mid-wire: no free ends) */
  const arcOk = (a) => !a.wx.dead && !a.wy.dead && (!!a.fx || (a.sx >= a.wx.lo - 0.3 && a.sx <= a.wx.hi + 0.3)) && (!!a.fy || (a.sy >= a.wy.lo - 0.3 && a.sy <= a.wy.hi + 0.3));
  const relink = () => {
    for (const wr of wires) wr.jLo = wr.jHi = false;
    for (const a of arcs) { if (!arcOk(a)) continue; if (a.fx) a.wx[a.fx === 'lo' ? 'jLo' : 'jHi'] = true; if (a.fy) a.wy[a.fy === 'lo' ? 'jLo' : 'jHi'] = true; }
  };
  relink();
  const arcS = (a, side) => { const wr = side === 'x' ? a.wx : a.wy, f = side === 'x' ? a.fx : a.fy; return f === 'lo' ? wr.lo : f === 'hi' ? wr.hi : (side === 'x' ? a.sx : a.sy); };

  // ------------------------------------------------------------ supports: the regular spans, then terminate every free wire end, then fill long gaps
  for (const sp of spans) crossSpan(sp);
  const sortSup = (wr) => wr.supports.sort((p, q) => p.s - q.s);
  /** a short tie from a free wire end to a rosette / mast (when no span fits): the support point, or null */
  const tieTarget = (px, pz, nx, nz) => {
    const A = facadeSide(px, pz, nx, nz, 1), B = facadeSide(px, pz, nx, nz, -1);
    let pick = null;
    if (A && (!B || A.t <= B.t)) pick = A; else if (B) pick = B;
    if (pick && pick.t <= 34) return pick;
    const M = [mastSide(px, pz, nx, nz, 1, 8.0, 36), mastSide(px, pz, nx, nz, -1, 8.0, 36)].filter(Boolean).sort((p, q) => p.t - q.t);
    return M[0] || (pick && pick.t <= 48 ? pick : null);                      // a tie is a SHORT wire: never longer than ~36 m (the test flags 60 m), else the end is cut back to its last support
  };
  const ties = [];                                                           // { wr, s, target }
  const terminate = (wr, atHi) => {
    const w = wr.w; sortSup(wr);
    const s0 = atHi ? wr.hi : wr.lo, setEnd = (s) => { if (atHi) wr.hi = s; else wr.lo = s; };
    // 1. a span within SNAP: the wire stops (or is extended) there
    let best = null;
    for (const q of wr.supports) {
      const d = q.s - s0; if (Math.abs(d) > SNAP) continue;
      const inside = atHi ? d <= 0 : d >= 0;                                 // shrinking the wire
      if (inside && (atHi ? q.s < wr.lo : q.s > wr.hi)) continue;
      if (!inside && (q.s < 0 || q.s > w.L)) continue;
      const score = Math.abs(d) + (inside ? 0 : 2);
      if (!best || score < best.score) best = { q, score };
    }
    if (best) { setEnd(best.q.s); stats.snapped++; wr[atHi ? 'doneHi' : 'doneLo'] = true; return; }
    // 2. a new span exactly at the end
    const q = wayAt(w, s0), nx = -q.tz, nz = q.tx;
    const sp = spanAt(q.x, q.z, nx, nz);
    if (sp) {
      const rsp = registerOrReuse(sp); crossSpan(rsp);
      const c = supNear(wr, rsp, s0);
      if (c) setEnd(c.s);
      else { const p = pt(wr, s0), u = clamp(((p[0] - sp.A[0]) * (sp.B[0] - sp.A[0]) + (p[1] - sp.A[1]) * (sp.B[1] - sp.A[1])) / (sp.len * sp.len), 0, 1); addSupport(wr, rsp, s0, u, p[0], p[1]); }
      stats.terminals++; wr[atHi ? 'doneHi' : 'doneLo'] = true; return;
    }
    // 3. a tie to a rosette / mast
    const tg = tieTarget(q.x, q.z, nx, nz);
    if (tg) { ties.push({ wr, s: s0, target: tg }); if (atHi) wr.tHi = true; else wr.tLo = true; stats.ties++; wr[atHi ? 'doneHi' : 'doneLo'] = true; return; }
    // 4. nothing: shorten the wire to its nearest support, or delete the stub
    const cand = wr.supports.filter((c) => c.s >= wr.lo && c.s <= wr.hi && (atHi ? c.s < s0 : c.s > s0));
    if (cand.length) { const c = atHi ? cand[cand.length - 1] : cand[0]; setEnd(c.s); wr[atHi ? 'doneHi' : 'doneLo'] = true; } else wr.dead = true;
    stats.dropped++;
  };
  for (const wr of wires) {
    if (wr.dead) continue;
    if (!wr.jLo) terminate(wr, false);
    if (!wr.dead && !wr.jHi) terminate(wr, true);
  }
  for (let again = 0; again < 3; again++) {                                  // a wire deleted by terminate() leaves its arc partners open: terminate those ends too
    const was = wires.map((wr) => (wr.jLo ? 1 : 0) + (wr.jHi ? 2 : 0));
    relink();
    let changed = false;
    wires.forEach((wr, i) => {
      if (wr.dead) return;
      const now = (wr.jLo ? 1 : 0) + (wr.jHi ? 2 : 0);
      if ((was[i] & 1) && !(now & 1)) { terminate(wr, false); changed = true; }
      if (!wr.dead && (was[i] & 2) && !(now & 2)) { terminate(wr, true); changed = true; }
    });
    if (!changed) break;
  }
  // gap fill: a wire may run unsupported for GAP metres at most (open squares, bridges)
  const addGapSpan = (wr, s, span = 0) => {
    const w = wr.w;
    const offs = [0, -6, 6, -12, 12, -18, 18];
    for (const off of offs) {
      const ss = s + off; if (ss < wr.lo + 3 || ss > wr.hi - 3) continue;
      const q = wayAt(w, ss); if (nearNode(q.x, q.z, 5)) continue;
      const nx = -q.tz, nz = q.tx;
      let sp = w.bridge ? null : spanAt(q.x, q.z, nx, nz);
      if (!sp && !w.bridge) {                                                // open on both sides (a square, the edge of the data): a mast at each kerb of the whole street
        const a = facadeSide(q.x, q.z, nx, nz, 1) || mastSide(q.x, q.z, nx, nz, 1), b = facadeSide(q.x, q.z, nx, nz, -1) || mastSide(q.x, q.z, nx, nz, -1);
        if (a && b) { const len = Math.hypot(a.x - b.x, a.z - b.z); if (len >= 8 && len <= 110) sp = makeSpan(a, b); }
      }
      if (!sp) {
        // a bridge deck (no facade, the river forbids mastSide): a mast just outside the asphalt of the whole deck on each side
        const out = (sg) => { let d = 1.5; while (d < 40 && (net.cover(q.x + nx * sg * d, q.z + nz * sg * d, {}) > -0.3 || net.cover(q.x + nx * sg * (d + 1.3), q.z + nz * sg * (d + 1.3), {}) > -0.5 || inMergedStrip(net, q.x + nx * sg * (d + 1.3), q.z + nz * sg * (d + 1.3)))) d += 0.5; d += 1.3; const x = q.x + nx * sg * d, z = q.z + nz * sg * d;
          return d > 40 || L.insideBuilding(x, z, 0.3) ? null : { x, z, y: 9.0, nx: -nx * sg, nz: -nz * sg, pole: true, deck: true }; };
        const a = out(1), b = out(-1);
        if (!a || !b) continue;
        sp = makeSpan(a, b);
      }
      const rsp = registerOrReuse(sp); crossSpan(rsp); stats.gapSpans++;
      return true;
    }
    return false;
  };
  const supportsIn = (wr) => { sortSup(wr); return wr.supports.filter((q) => q.s >= wr.lo - 0.3 && q.s <= wr.hi + 0.3).map((q) => q.s); };
  for (const wr of wires) {                                                  // pass 1: the gaps inside one wire (a bridge may run longer: it has no facades to hang on)
    if (wr.dead) continue;
    const lim = wr.w.bridge ? BRIDGE_GAP : GAP;
    for (let guard = 0; guard < 12; guard++) {
      const marks = supportsIn(wr);
      if (wr.jLo || wr.tLo) marks.push(wr.lo); if (wr.jHi || wr.tHi) marks.push(wr.hi);
      marks.sort((a, b) => a - b);
      let big = null;
      for (let i = 0; i + 1 < marks.length; i++) if (marks[i + 1] - marks[i] > lim && (!big || marks[i + 1] - marks[i] > big[1] - big[0])) big = [marks[i], marks[i + 1]];
      if (!big) break;
      if (!addGapSpan(wr, (big[0] + big[1]) / 2, big[1] - big[0])) { if (ENV.WIRES_DEBUG) { const q = wayAt(wr.w, (big[0] + big[1]) / 2); console.log(`[wires] gap ${big[0].toFixed(0)}..${big[1].toFixed(0)} on ${wr.id} (L ${wr.w.L.toFixed(0)}, bridge ${!!wr.w.bridge}) near (${q.x.toFixed(0)}, ${q.z.toFixed(0)}) could not be filled`); } break; }
    }
  }
  // pass 2: the wires of two ways that meet at a joint / junction are ONE wire (joined by an arc): the run from the last support of one over the arc to the first support of the other
  // may not exceed CHAIN either (a bridge between two approach spans 40 m away on each side: the spans move to the bridge ends)
  const partnersOf = new Map();                                              // wire -> { lo: [{ wr, end, arc }], hi: [...] }
  for (const a of arcs) {
    if (!a.fx || !a.fy || a.sub < 0) continue;
    const link = (u, eu, v, ev) => { let m = partnersOf.get(u); if (!m) partnersOf.set(u, (m = { lo: [], hi: [] })); m[eu].push({ wr: v, end: ev, arc: a }); };
    link(a.wx, a.fx, a.wy, a.fy); link(a.wy, a.fy, a.wx, a.fx);
  }
  const endRun = (wr, end) => { const ss = supportsIn(wr); if (!ss.length) return wr.hi - wr.lo; return end === 'lo' ? ss[0] - wr.lo : wr.hi - ss[ss.length - 1]; };
  const arcLen = (a) => { const P = pt(a.wx, arcS(a, 'x')), Q = pt(a.wy, arcS(a, 'y')); return Math.hypot(P[0] - Q[0], P[1] - Q[1]) * 1.1; };
  for (const wr of wires) {
    if (wr.dead || wr.w.bridge || !partnersOf.has(wr)) continue;
    for (const end of ['lo', 'hi']) {
      for (let it = 0; it < 4; it++) {
        const ps = partnersOf.get(wr)[end].filter((p) => !p.wr.dead); if (!ps.length) break;
        const own = endRun(wr, end), worst = Math.max(...ps.map((p) => arcLen(p.arc) + endRun(p.wr, p.end)));
        if (own < 7 || own + worst <= CHAIN) break;
        const d = Math.max(6, own / 2);
        if (!addGapSpan(wr, end === 'lo' ? wr.lo + d : wr.hi - d)) break;
      }
    }
  }

  // NO FREE ENDS ANYWHERE: an end that is neither joined to a live arc (an arc whose partner wire was dropped is gone), nor tied, nor already terminated on a support (a joint at the data edge whose partner
  // way lost its lanes) is terminated now: snapped to a support / a new span / a tie, else cut back to the nearest support, else the stub is deleted. Repeated: cutting an end can orphan the arc of its partner.
  for (let again = 0; again < 4; again++) {
    relink(); let changed = false;
    for (const wr of wires) {
      if (wr.dead) continue;
      if (!wr.jLo && !wr.tLo && !wr.doneLo) { terminate(wr, false); changed = true; }
      if (!wr.dead && !wr.jHi && !wr.tHi && !wr.doneHi) { terminate(wr, true); changed = true; }
    }
    if (!changed) break;
  }
  // ------------------------------------------------------------ final supports per wire, span knots
  for (const wr of wires) {
    if (wr.dead) continue;
    sortSup(wr);
    wr.sups = [];
    for (const q of wr.supports) if (q.s >= wr.lo - 0.3 && q.s <= wr.hi + 0.3 && (!wr.sups.length || q.s - wr.sups[wr.sups.length - 1].s > 0.4)) wr.sups.push(q);
    for (const q of wr.sups) {                                               // where each wire of the pair meets the span (the span may cross at an angle): the hanger tops
      q.hang = [-1, 1].map((sub) => {
        const p = pt(wr, q.s, sub), sp = q.sp, u = clamp(((p[0] - sp.A[0]) * (sp.B[0] - sp.A[0]) + (p[1] - sp.A[1]) * (sp.B[1] - sp.A[1])) / (sp.len * sp.len), 0, 1);
        sp.knots.push(u);
        return { u, p };
      });
    }
    const sLo = wr.lo, sHi = wr.hi, w = wr.w, sups = wr.sups.map((q) => q.s);
    wr.hAt = (s) => {
      let a = sLo, b = sHi;
      for (const t of sups) { if (t <= s) a = Math.max(a, t); if (t > s) { b = Math.min(b, t); break; } }
      const br = w.bridge ? 0.05 * Math.sin(Math.PI * clamp(s / w.L, 0, 1)) * 4 : 0;
      if (b - a < 1) return H0 - br;
      const u = (s - a) / (b - a), D = b - a;
      return H0 - Math.min(0.5, 0.0115 * D) * 4 * u * (1 - u) - br;
    };
  }
  const parab = (sp, u) => { const ya = sp.A[2], yb = sp.B[2], sag = Math.max(0.25, (ya + yb) / 2 - 6.45); return ya + (yb - ya) * u - sag * 4 * u * (1 - u); };
  /** span height at fraction u from A to B: the catenary through the anchors (6.45 m at the middle), pulled down to <= HANGER above the contact wires wherever a hanger stands */
  const spanY = (sp, u) => {
    if (u <= 0) return sp.A[2]; if (u >= 1) return sp.B[2];
    let d = 1e9; for (const k of sp.knots) d = Math.min(d, Math.abs(u - k) * sp.len);
    return Math.min(parab(sp, u), H0 + HANGER + 0.5 * d);
  };

  // ------------------------------------------------------------ supports hardware: rosettes and masts (drawn once per place)
  const placed = new Map();
  const knockMasts = !!(ctx.knock && poles), mastSpots = [];               // LONG decks supply physical knock floors; preserve older small-deck behavior
  const placeSupport = (P, nx, nz, pole, deck = false) => {
    const key = Math.round(P[0] * 4) + ',' + Math.round(P[1] * 4) + ',' + Math.round(P[2] * 2);
    if (placed.has(key)) return; placed.set(key, 1);
    if (zones.length && zoneAt(P[0], P[1])) return;                          // nothing stands on a moving bascule span (no mast, no collider)
    if (pole) {
      // plain black mast with a short bracket
      const base=longDeckHeight(P[0],P[1])??0;
      const item = ctx.physics.addCylinder(P[0], P[1], 0.22, base, base+4);
      if (knockMasts && (!deck || base)) mastSpots.push({ x: P[0], y: base+WALK_Y, z: P[1], rotY: 0, s: P[2] / MAST_H, item });
      else if (poles) { poles.cyl(0.11, 0.17, P[2], '#25282b', [P[0], base+0.12 + P[2] / 2, P[1]], null, 6, null, true); poles.box(0.3, 0.3, 0.3, '#3a3d42', [P[0], base+0.12 + P[2], P[1]]); }
      stats.masts++; service.masts.push({ x: P[0], z: P[1], y:base+0.12, h: P[2] });
    } else {
      // rosette: a round plate on the facade (white-grey) + a short eye with an insulator
      if (poles) {
        poles.cyl(0.13, 0.13, 0.05, '#bfc2c4', [P[0] + nx * 0.02, P[2], P[1] + nz * 0.02], [Math.PI / 2, Math.atan2(nx, nz), 0], 6);
        poles.cyl(0.035, 0.035, 0.22, '#e8e8e4', [P[0] + nx * 0.13, P[2] - 0.02, P[1] + nz * 0.13], [Math.PI / 2, Math.atan2(nx, nz), 0], 4, null, true);
      }
      stats.rosettes++; service.anchors.push({ x: P[0], y: P[2], z: P[1], nx, nz });
    }
  };

  // ------------------------------------------------------------ emit the contact wires
  const emitted = [];                                                        // plan segments for the crossing search
  const arcAnch = new Map();                                                 // wire -> the arclengths where an arc is anchored mid-wire: the contact wire gets a vertex there (a chord across a bend would miss the arc's end)
  for (const a of arcs) { if (!arcOk(a)) continue; for (const [wr, f, v] of [[a.wx, a.fx, a.sx], [a.wy, a.fy, a.sy]]) if (!f) { let l = arcAnch.get(wr); if (!l) arcAnch.set(wr, (l = [])); l.push(v); } }
  const hangerPts = [];
  for (const wr of wires) {
    if (wr.dead) continue;
    const w = wr.w, sLo = wr.lo, sHi = wr.hi;
    wr.drawn = sHi - sLo >= 0.5;
    if (!wr.drawn) continue;
    // sample positions: regular steps + the supports
    const S = []; const m = Math.max(2, Math.ceil((sHi - sLo) / step) + 1);
    for (let i = 0; i < m; i++) S.push(sLo + (sHi - sLo) * i / (m - 1));
    for (const q of wr.sups) S.push(q.s);
    for (const v of arcAnch.get(wr) || []) if (v > sLo && v < sHi) S.push(v);
    S.sort((a, b) => a - b);
    for (const sub of [-1, 1]) {
      const line = [];
      for (const s of S) { const p = pt(wr, s, sub); line.push([p[0], wr.hAt(s), p[1]]); }
      add(line, 0.028, WIRE, 'contact', wr.id);
      for (let i = 0; i + 1 < line.length; i++) emitted.push([line[i][0], line[i][2], line[i + 1][0], line[i + 1][2], wr.id, sub]);
    }
    if (sHi - sLo >= 4) {
      const cl = S.map((s) => { const p = pt(wr, s, 0); return [p[0], wr.hAt(s), p[1]]; });
      service.pairs.push({ id: wr.id, way: w.id, refs: wr.refs, dir: wr.dir, lane: wr.j, pts: cl.map(raised) });
      stats.pairs++; stats.wireKm += (sHi - sLo) / 1000;
    }
    // hangers: from the contact wire up to the span (the span polyline has a vertex right there)
    for (const q of wr.sups) {
      for (const h of q.hang) { const sp = q.sp; if (zones.length && (zoneAt(sp.A[0], sp.A[1]) || zoneAt(sp.B[0], sp.B[1]))) continue; hangerPts.push([[h.p[0], wr.hAt(q.s), h.p[1]], [sp.A[0] + (sp.B[0] - sp.A[0]) * h.u, spanY(sp, h.u), sp.A[1] + (sp.B[1] - sp.A[1]) * h.u]]); }
    }
  }
  // ties of the free ends nothing else fits (a short wire from the wire end to a rosette / mast)
  for (const t of ties) {
    const wr = t.wr; if (wr.dead) continue;
    const tg = t.target; placeSupport([tg.x, tg.z, tg.y], tg.nx, tg.nz, tg.pole);
    for (const sub of [-1, 1]) { const p = pt(wr, t.s, sub); add([[p[0], wr.hAt(t.s), p[1]], [tg.x, tg.y, tg.z]], 0.026, WIRE, 'tie', wr.id); }
  }
  for (const a of arcs) {
    if (!arcOk(a)) { stats.dropped++; continue; }
    const sx = arcS(a, 'x'), sy = arcS(a, 'y'), P = pt(a.wx, sx, a.sub), Q = pt(a.wy, sy, a.sub);
    const y0 = a.wx.hAt(sx), y1 = a.wy.hAt(sy);
    const pl = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
    if (pl < 0.08 && Math.abs(y1 - y0) < 0.08) continue;                     // the two wires already meet
    const ap = arcPoints([P[0], P[1]], [P[2], P[3]], [Q[0], Q[1]], [Q[2], Q[3]]);
    const line = ap.map((p, i) => { const u = i / (ap.length - 1); return [p[0], y0 + (y1 - y0) * u - 0.12 * 4 * u * (1 - u), p[1]]; });
    add(line, 0.028, WIRE, 'arc', a.wx.id + '>' + a.wy.id); stats.arcs++;
    for (let i = 0; i + 1 < line.length; i++) emitted.push([line[i][0], line[i][2], line[i + 1][0], line[i + 1][2], 'A' + a.node + a.wx.id + a.wy.id, a.sub]);
    if (a.sub > 0) service.arcs.push({ from: a.wx.id, to: a.wy.id, refs: a.refs, pts: line.map((p) => raised([p[0], H0, p[2]])) });
  }
  for (const h of hangerPts) { add(h, 0.02, WIRE, 'hanger'); stats.hangers++; }

  // ------------------------------------------------------------ spans, rosettes, masts
  for (const sp of spans) {
    if (!sp.knots.length) continue;
    const us = new Set([0, 1]); const n = Math.max(6, Math.ceil(sp.len / 4));
    for (let i = 1; i < n; i++) us.add(i / n);
    for (const k of sp.knots) us.add(k);
    const U = [...us].sort((a, b) => a - b), pts = [];
    for (const u of U) pts.push([sp.A[0] + (sp.B[0] - sp.A[0]) * u, spanY(sp, u), sp.A[1] + (sp.B[1] - sp.A[1]) * u]);
    if (zones.length && (zoneAt(sp.A[0], sp.A[1]) || zoneAt(sp.B[0], sp.B[1]))) { stats.spansCut = (stats.spansCut || 0) + 1; continue; }      // (a cross span of the moving bascule: not drawn, its masts neither)
    add(pts, 0.034, SPANC, 'span', 'S' + sp.id); stats.spans++;
    service.spans.push({ id: sp.id, a: raised([sp.A[0], sp.A[2], sp.A[1]]), b: raised([sp.B[0], sp.B[2], sp.B[1]]), mid: raised([sp.mid[0], parab(sp, 0.5), sp.mid[1]]), len: sp.len, poles: [sp.poleA, sp.poleB] });
    placeSupport(sp.A, sp.nxA, sp.nzA, sp.poleA, sp.deckA); placeSupport(sp.B, sp.nxB, sp.nzB, sp.poleB, sp.deckB);
  }
  if (mastSpots.length) {
    // the mast model (base at the origin): the same pole and cap box the merged mesh draws; the instance scale carries the height (9 m, the 8 m tie masts a touch slimmer)
    const V = new VB(); V.cyl(0.11, 0.17, MAST_H, '#25282b', [0, MAST_H / 2, 0], null, 6, null, true); V.box(0.3, 0.3, 0.3, '#3a3d42', [0, MAST_H, 0]);
    const geo = V.build(), mVC = ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0.02, name: 'pt-wire-mast' });
    // 350 kg of steel, anchored: a bump (a parking scrape) only makes it wobble, a car at 24 km/h breaks it off at the foot and it topples along the hit
    knockInstances(ctx, {
      name: 'pt-wire-masts', parts: [{ geo, mat: mVC, far: MAST_FAR }], spots: mastSpots, items: mastSpots.map((m) => m.item), far: MAST_FAR,
      rec: (m) => ({ kind: 'mast', mass: 350, h: MAST_H * m.s + 0.15, r: 0.17, anchored: 24, hitK: 0.4, metal: true }),
    });
    INST_STATS['pt-wire-masts'] = { n: mastSpots.length, tris: Math.round(geo.index.count / 3 * mastSpots.length) };
  }

  // ------------------------------------------------------------ crossing frames where wires of different routes cross
  if (poles) {
    const grid = new Map(), C = 10;
    emitted.forEach((e, i) => { const x0 = Math.floor(Math.min(e[0], e[2]) / C), x1 = Math.floor(Math.max(e[0], e[2]) / C), z0 = Math.floor(Math.min(e[1], e[3]) / C), z1 = Math.floor(Math.max(e[1], e[3]) / C); for (let a = x0; a <= x1; a++) for (let b = z0; b <= z1; b++) { const k = a * 4096 + b; let l = grid.get(k); if (!l) grid.set(k, (l = [])); l.push(i); } });
    const done = []; const seenPair = new Set();
    for (const list of grid.values()) for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      const i = list[a], j = list[b]; if (seenPair.has(i * 100003 + j)) continue; seenPair.add(i * 100003 + j);
      const E = emitted[i], F = emitted[j]; if (E[4] === F[4] || E[5] !== 1 || F[5] !== 1) continue;
      const X = segX(E[0], E[1], E[2], E[3], F[0], F[1], F[2], F[3]); if (!X) continue;
      const ex = E[2] - E[0], ez = E[3] - E[1], fx = F[2] - F[0], fz = F[3] - F[1], c = Math.abs(ex * fz - ez * fx) / (Math.hypot(ex, ez) * Math.hypot(fx, fz) || 1);
      if (c < 0.25) continue;
      const x = E[0] + ex * X.t, z = E[1] + ez * X.t;
      if (done.some((d) => Math.hypot(d[0] - x, d[1] - z) < 1.6)) continue;
      done.push([x, z]);
      const ang = Math.atan2(ex, ez),base=longDeckHeight(x,z)??0;
      poles.box(0.12, 0.07, 1.1, '#2d3034', [x, base+H0 + 0.04, z], [0, ang, 0]); poles.box(0.12, 0.07, 1.1, '#2d3034', [x, base+H0 + 0.04, z], [0, Math.atan2(fx, fz), 0]);
      poles.cyl(0.05, 0.05, 0.12, '#e8e8e4', [x, base+H0 + 0.13, z], null, 5, null, true);
      stats.frogs++;
    }
  }

  // ------------------------------------------------------------ blue lane-use signs hanging from the spans on Nevsky approaches
  if (panels && signTex && poles) {
    const jGrid = new PointGrid(64); for (const n of net.nodes) if (n.arms.length >= 3) jGrid.add(n.x, n.z, n);       // (every span asked every node)
    for (const sp of spans) {
      if (!sp.knots.length || sp.poleA || sp.poleB || hash2(sp.mid[0], sp.mid[1]) > 0.28) continue;
      // only spans over a Nevsky carriageway close to a signalised junction
      const near = jGrid.first(sp.mid[0], sp.mid[1], 70, (n) => avoid.some((a) => Math.hypot(a[0] - n.x, a[1] - n.z) < 20));
      if (!near) continue;
      for (const wr of wires) {
        if (wr.dead) continue;
        const q = wr.sups.find((c) => c.sp === sp); if (!q || !wr.kerb || wr.w.name !== 'Невский проспект') continue;
        const p = pt(wr, q.s, 0), ysp = spanY(sp, q.u);
        panels.mount(poles, signTex, p[0], ysp - 0.62, p[1], -p[2], -p[3], 0.7, 0.9, { kind: 'plate' }); stats.signs++;
      }
    }
  }
  service.wireKm = stats.wireKm;
  stats.ms = Math.round(now() - T0);
  return { stats, service };
}
export { clamp };
