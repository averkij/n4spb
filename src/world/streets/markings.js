// streets/markings.js - ROAD MARKINGS BY RULE (Russian GOST R 51256-2018 as used in Saint Petersburg; the rule set, its numbers and the audit are documented in docs/rules/ROAD-MARKINGS.md).
// planMarkings(net, graph, opts) turns the network into a PLAN (pure data, no three.js geometry): lines, stop bars, lane arrows. drawPlan() paints the plan into the decal MB of surface.js.
// The plan is the single source of the markings: tools/streets-markings-audit.mjs reads it too (centre-line types per road class, coverage, paint in junction boxes ...).
//
// THE RULES (one rule per class of carriageway, never per spot):
//   centre line     two-way carriageways only. T = lanes both ways.  T >= 4: double solid 1.3 (two 0.10 m lines, 0.10 m gap);  T = 3: single solid 1.1;  T = 2: secondary and up (rank >= 3) solid 1.1,
//                   tertiary (rank 2) dashed 1.5, side street (rank 1) dashed 1.5 only when the carriageway is >= 6.5 m wide;  carriageways < 5.5 m wide or T < 2: no centre line.
//                   Two one-way carriageways that meet (net.js fillMedians: Nevsky has no median) are ONE roadway: the shared edge gets the centre line of T = lanes of both (4+ lanes: the double solid), drawn once.
//   lane lines      between two lanes of the same direction: dashed 1.5 (1 m dash, 3 m gap) when the lane is >= 2.6 m wide; the bus lane of west Nevsky is cut off by a solid 1.1.
//   edge lines      none along kerbs (the city centre has kerbs everywhere); a continuous 0.10 m line only between the lane and a parking pocket.
//   junction box    every junction of public streets (a node with 3+ arms and a way of rank >= 1 besides this one) is a no-marking zone: lines of the approach end at its STOP LINE, the lines of the
//                   departure restart behind the far zebra (exactly the lane ranges of the lane graph, lanegraph.js arm.dIn / dOut). A courtyard gateway (rank-0 way only) is no junction: the lines run through.
//   zebra           1.14.1 across every crossing (buildCrossings, surface.js); centre / lane lines stop 0.5 m before the bars and resume behind them.
//   stop line       1.12: one continuous bar across all lanes of an approach, 0.4 m (0.6 m on the primary streets), at the end of the lane range (1.5 m before the zebra when there is one), at every
//                   signalised approach and every give-way approach of a public street (the lane graph's `give`: the minor street meeting a higher-ranked one).
//   arrows          straight-ahead arrows 30 m before the stop line, one per lane, on the approaches of the wide streets (rank >= 3, carriageway >= 10 m) to a junction.
//   no stubs        a solid centre / median / bus-lane piece shorter than RULES.stubMin (6 m) is dropped unless both its ends meet a stop bar, a zebra or a bridge deck (and then it is at least 1.5 m long); a dashed lane / centre stretch of which
//                   at most ONE dash is visible (or 2 dashes with at least twice as many hidden under other carriageways' asphalt) is dropped: the interior of a wide junction (several overlapping carriageways,
//                   6-30 m links between two junctions) otherwise shows orphan double-line stubs and lone dashes (pruneStubs, docs/rules/ROAD-MARKINGS.md).
//   nothing on      rank-0 ways (courtyards, service), living streets, pedestrian ways, bridge decks drawn by the bridges module (decks.js).
import { wayAt, nearCrossing } from './net.js';
import { prepLanes, latAt } from './lanes.js';
import { deckAt } from './decks.js';
import { UP, rgb, dpKeep, clamp } from './util.js';
import { ROAD_Y, LIFT, WEST_X } from './surface.js';

export const RULES = { dash: 1.0, period: 4.0, lane: 0.14, thin: 0.1, gap: 0.1, laneMin: 2.6, narrow: 5.5, sideDash: 6.5, stopMinApproach: 12, stopW: 0.4, stopWPrimary: 0.6, arrowBefore: 30, zebraClear: 1.0, stubMin: 6, stubAnchor: 3, sliver: 1.5 };
const WHITE = rgb('#e9e6dc');

/** centre-line type of a roadway by its lane count, rank and width (null = none): 'double' | 'solid' | 'dash' */
export function centreKindFor(T, rank, wid) {
  if (T >= 4) return 'double';
  if (T === 3) return 'solid';
  if (T === 2) { if (wid < RULES.narrow) return null; if (rank >= 3) return 'solid'; if (rank === 2) return 'dash'; return wid >= RULES.sideDash ? 'dash' : null; }
  return null;
}
/** the road class label of the audit: rank + direction + lanes */
export const classOf = (w) => `r${w.rank}${w.oneway ? '-1way' : '-2way'}-${w.lanes ? w.lanes.nF : '?'}+${w.lanes ? w.lanes.nB : '?'}`;
export const eligible = (w) => w.rank >= 1 && !w.skipDraw && !w.pedestrianOnly && w.hw !== 'living_street';
export const isBusLaneWay = (w) => w.oneway && w.name === 'Невский проспект' && w.rank >= 3 && w.lanes.nF >= 3 && w.x[0] < WEST_X && w.x[w.n - 1] < WEST_X;

/** the ways that carry way w on at its two ends under the same name and rank (one road cut into ways at a seam, Kirochnaya at -42): their asphalt is no 'other carriageway' that hides w's paint */
function continuations(net, w) {
  if (w._cont) return w._cont;
  const set = new Set(), ends = [[w.x[0], w.z[0]], [w.x[w.n - 1], w.z[w.n - 1]]];
  if (w.name) for (const v of net.ways) {
    if (v === w || v.name !== w.name || v.rank !== w.rank || v.oneway !== w.oneway) continue;
    if (ends.some(([x, z]) => (Math.hypot(v.x[0] - x, v.z[0] - z) < 0.5 || Math.hypot(v.x[v.n - 1] - x, v.z[v.n - 1] - z) < 0.5))) set.add(v);
  }
  return (w._cont = set.size ? set : null);
}
const realNode = (nd, w) => nd.arms.length >= 3 && (nd.arms.some((a) => a.w !== w && a.w.rank >= 1) || nd.arms.some((a) => a.cross && a.cross.signalised));     // (a signalised pedestrian crossing at a courtyard gateway stops the traffic: its stop line ends the lines)
const armOf = (nd, w, along) => nd.arms.find((a) => a.w === w && a.along === along) || nd.arms.find((a) => a.w === w) || null;

/** the stretches of way w between its junctions of public streets, with the lane range of each direction (the lane graph's trimming: forward lanes start dOut behind the first junction and end dIn
 *  before the next, backward the other way round; the two junction mouths shorten together when the edge is short). [{ A, B, f: {lo, hi} | null, b: {lo, hi} | null }] in arclength s of w */
export function edgesOf(w) {
  const st = [];
  for (const q of w.nodes) if (realNode(q.node, w)) st.push({ s: q.s, nd: q.node });
  if (!st.length || st[0].s > 0.05) st.unshift({ s: 0, nd: null });
  if (st[st.length - 1].s < w.L - 0.05) st.push({ s: w.L, nd: null });
  const out = [];
  for (let i = 0; i + 1 < st.length; i++) {
    const A = st[i], B = st[i + 1], avail = B.s - A.s;
    const aA = A.nd && armOf(A.nd, w, 1), aB = B.nd && armOf(B.nd, w, -1);
    const trim = (o, n) => { if (o + n > 0 && o + n + 6 > avail) { const k = Math.max(0, avail - 6) / (o + n); return [o * k, n * k]; } return [o, n]; };
    const d = (a, k) => (a ? (a[k] ?? 6) : 0);
    const [fo, fi] = trim(d(aA, 'dOut'), d(aB, 'dIn')), [bo, bi] = trim(d(aB, 'dOut'), d(aA, 'dIn'));
    const ok = (r) => (r.hi - r.lo >= 2.5 ? r : null);
    out.push({ A, B, f: ok({ lo: A.s + fo, hi: B.s - fi }), b: ok({ lo: A.s + bi, hi: B.s - bo }) });
  }
  return out;
}

/** true when carriageway v (the one across the left edge of way w) draws the shared line at (x, z) itself: v has the lower index, its lane range covers the point and it names w as its partner there.
 *  Exactly one of the two draws at every point; where the lower-numbered one has no range (its junction box, a different split of the two ways) the other draws: the line has no gaps and no duplicates. */
function partnerDraws(w, v, x, z) {
  if (!v || v.i > w.i || !v.med) return false;
  let best = null;
  for (let i = 0; i + 1 < v.n; i++) {
    const dx = v.x[i + 1] - v.x[i], dz = v.z[i + 1] - v.z[i], l2 = dx * dx + dz * dz || 1e-12, t = Math.max(0, Math.min(1, ((x - v.x[i]) * dx + (z - v.z[i]) * dz) / l2));
    const d = Math.hypot(x - v.x[i] - dx * t, z - v.z[i] - dz * t); if (!best || d < best.d) best = { d, i, t, s: v.s[i] + (v.s[i + 1] - v.s[i]) * t };
  }
  if (!best || !v.med[best.i] || !v.med[best.i + 1] || v.medPartner[best.i] !== w) return false;
  return edgesOf(v).some((e) => e.f && best.s >= e.f.lo - 0.2 && best.s <= e.f.hi + 0.2);
}

/** lateral position (in the frame of way w, + = right) of the line shared with the carriageway across w's left edge, at every vertex: the middle between the two asphalt edges (they touch where net.js
 *  fillMedians closed the gap, and overlap by up to 1.4 m where the data's carriageways overlap: the line must not run along only one of the two edges, inside the lane of the other) */
function medOffsets(w) {
  if (w._medOff) return w._medOff;
  w._medOff = w.x.map((_, k) => {
    const v = w.medPartner && w.medPartner[k];
    if (!v || !w.med[k]) return -w.hL[k];
    let best = null;
    for (let i = 0; i + 1 < v.n; i++) {
      const dx = v.x[i + 1] - v.x[i], dz = v.z[i + 1] - v.z[i], l2 = dx * dx + dz * dz || 1e-12, t = Math.max(0, Math.min(1, ((w.x[k] - v.x[i]) * dx + (w.z[k] - v.z[i]) * dz) / l2));
      const px = v.x[i] + dx * t, pz = v.z[i] + dz * t, d = Math.hypot(w.x[k] - px, w.z[k] - pz);
      if (!best || d < best.d) best = { d, i, t, side: ((w.x[k] - px) * -dz + (w.z[k] - pz) * dx) };
    }
    if (!best || best.side > 0) return -w.hL[k];                      // (the partner's right side faces us: not a head-on pair)
    const hLv = v.hL[best.i] + (v.hL[best.i + 1] - v.hL[best.i]) * best.t, edgeV = best.d - hLv;      // the partner's left edge: edgeV metres from our centre line, to our left
    return -Math.max(Math.min(w.hL[k], edgeV), (w.hL[k] + edgeV) / 2);
  });
  // a junction mouth widens the half width hL over ONE or TWO vertices (Kirochnaya at -52.8 and -80.9: 5 and 8.5 m against 4.7 m around), which throws the shared line 1-2 m out in a kink: a vertex that
  // lies more than 0.8 m from the median of its five-vertex window (all of them with a partner) takes that median
  const o = w._medOff, src = o.slice();
  for (let k = 2; k + 2 < o.length; k++) {
    if (!(w.med[k] && w.medPartner[k - 2] && w.medPartner[k - 1] && w.medPartner[k] && w.medPartner[k + 1] && w.medPartner[k + 2])) continue;
    const m = [src[k - 2], src[k - 1], src[k], src[k + 1], src[k + 2]].sort((p, q) => p - q)[2];
    if (Math.abs(src[k] - m) > 0.8) o[k] = m;
  }
  return w._medOff;
}

/** distance from (x, z) to the nearest stop bar / zebra / bridge deck: the things a line legitimately ENDS at (the range end of a line is a junction mouth, which is no anchor: a link between two junctions is all mouths) */
function anchorDist(net, bars, x, z) {
  if (deckAt(x, z, 1)) return 0;
  if (nearCrossing(net, x, z, RULES.stubAnchor)) return 0;
  let m = 1e9;
  for (const b of bars) {
    if (Math.abs(x - b.x) > 40 || Math.abs(z - b.z) > 40) continue;
    const u = (x - b.x) * b.tx + (z - b.z) * b.tz, c = (x - b.x) * -b.tz + (z - b.z) * b.tx;
    m = Math.min(m, Math.hypot(u > 0 ? u : u < -b.depth ? -b.depth - u : 0, c < b.a ? b.a - c : c > b.b ? c - b.b : 0));
  }
  return m;
}
/** STUBS: what is left of a rule after the other carriageways' asphalt, the zebras and the partner's share took their parts. In the interior of a wide junction (the 6-way node of Birzhevaya ploshchad: seven
 *  overlapping carriageways, links of 5-30 m between its nodes) that leaves orphans: a 2-5 m piece of a double line hanging on the asphalt, a lone dash. Drop
 *   - a solid centre / median / bus-lane piece shorter than RULES.stubMin unless BOTH its ends meet a stop bar / zebra / deck and it is at least RULES.sliver (1.5 m) long (a short piece between two of those is a real line); the two lines of a double go together;
 *   - the dashes of a dashed stretch of which at most ONE dash shows, or 2 dashes show with at least twice as many hidden under other asphalt.
 *  Pocket lines (bay edges) stay. rec.pruned / rec.drawn keep the books of the audit (coverage = drawn / (asked - deck - zebra - pruned)). */
function pruneStubs(net, lines, bars, recs, stats, dropped) {
  const drop = new Set(), st = { solid: 0, solidLen: 0, dashes: 0, dashAsks: 0 };
  const byRid = new Map();
  for (const l of lines) if (l.rid !== undefined && !l.dash) { let a = byRid.get(l.rid); if (!a) byRid.set(l.rid, (a = [])); a.push(l); }
  for (const l of lines) {
    if (l.dash || l.rid === undefined || !/^(centre|median|lane-solid)/.test(l.kind)) continue;
    let len = l.len;
    if (/double$/.test(l.kind)) for (const m of byRid.get(l.rid)) if (m !== l && Math.hypot(m.pts[0].x - l.pts[0].x, m.pts[0].z - l.pts[0].z) < 0.5) len = Math.max(len, m.len);
    if (len >= RULES.stubMin) continue;
    const a = l.pts[0], b = l.pts[l.pts.length - 1];
    if (len >= RULES.sliver && anchorDist(net, bars, a.x, a.z) < RULES.stubAnchor && anchorDist(net, bars, b.x, b.z) < RULES.stubAnchor) continue;
    drop.add(l); st.solid++; st.solidLen += l.len;
    if (!l.oi) { const r = recs[l.rid]; r.drawn -= l.len; r.pruned += l.len; }
  }
  for (const r of recs) {
    if (!/dash$/.test(r.kind)) continue;
    const d = Math.round(r.drawn / RULES.dash), c = Math.round(r.cover / RULES.dash);
    if (d < 1 || !(d <= 1 || (d <= 2 && c >= 2 * d))) continue;
    st.dashAsks++; st.dashes += d; r.pruned += r.drawn; r.drawn = 0; r.dropDash = true;
  }
  stats.pruned = st;
  const keep = [];
  for (const l of lines) { if (drop.has(l)) dropped.push(l); else if (!(l.dash && recs[l.rid].dropDash)) keep.push(l); }
  return keep;
}

export function planMarkings(net, graph, o = {}) {
  const lines = [], arrows = [], bars = [], recs = [];
  const stats = { classes: {}, ways: 0 }, rules = [];                // rules: every stretch a rule asked a line for: { way, kind, want, drawn, deck, cross, cover } in metres (the audit: coverage = drawn / (want - deck - cross))
  const push = (kind, w, pts, width, extra = {}) => {
    if (pts.length < 2) return 0;
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    lines.push({ kind, way: w.i, cls: classOf(w), pts, width, len, ...extra });
    return len;
  };
  const sample = (w, s, latFn) => { const q = wayAt(w, s), off = latFn(q), nx = -q.tz, nz = q.tx; return { x: q.x + nx * off, z: q.z + nz * off, nx, nz, s, q }; };
  /** why a point carries no paint: 'gate' (the rule itself does not ask for it there), 'deck' (a bridge deck of the bridges module), 'cross' (zebra bars), 'cover' (another carriageway's asphalt) or '' */
  const hidOf = (w, skip2, gate) => (p) => (gate && gate(p) ? 'gate' : deckAt(p.x, p.z, 0.3) ? 'deck' : nearCrossing(net, p.x, p.z, RULES.zebraClear) ? 'cross' : net.cover(p.x, p.z, { skip: w, skip2, skipSet: continuations(net, w) }) > 0.2 ? 'cover' : '');
  /** ask for a line of `kind` along w between arclengths lo and hi at the lateral position latFn(q): dashed (1 m / 3 m from `anchor`), or solid at the offsets `offs` (a double line = two thin lines);
   *  o.hid tells where there is no paint. Records the rule (what was asked / drawn / hidden by what) and pushes the drawn pieces. */
  const ask = (kind, w, lo, hi, latFn, width, o) => {
    const rec = { way: w.i, kind, want: 0, drawn: 0, deck: 0, cross: 0, cover: 0, pruned: 0, id: recs.length }, hid = o.hid; recs.push(rec);
    if (o.dash) {
      const P = RULES.period, D = RULES.dash, a = o.anchor;
      for (let s = a + 1.5 + P * Math.ceil((lo - a - 1.5) / P - 1e-9); s + D <= hi + 1e-6; s += P) {
        const pts = [sample(w, s, latFn), sample(w, s + D / 2, latFn), sample(w, s + D, latFn)]; let why = '';
        for (const p of pts) { why = hid(p); if (why) break; }
        if (why === 'gate') continue;
        rec.want += D;
        if (why) rec[why] += D; else { push(kind, w, pts, width, { dash: true, rid: rec.id }); rec.drawn += D; }
      }
    } else {
      const n = Math.max(2, Math.ceil((hi - lo) / 3) + 1), wt = (hi - lo) / n;
      rec.want = hi - lo;
      (o.offs || [0]).forEach((off, oi) => {
        const lat = off ? (q) => latFn(q) + off : latFn; let cur = null, prev = null;
        const flush = () => { if (cur && cur.length >= 2) { const l = push(kind, w, cur, width, off ? { off, rid: rec.id, oi } : { rid: rec.id, oi }); if (!oi) rec.drawn += l; } cur = null; };
        const edge = (sv, sh) => { for (let it = 0; it < 8; it++) { const m = (sv + sh) / 2; if (hid(sample(w, m, lat))) sh = m; else sv = m; } return sample(w, sv, lat); };       // where the paint really starts / ends: the sample grid (3 m) is refined to 2 cm
        for (let k = 0; k < n; k++) {
          const sk = lo + (hi - lo) * k / (n - 1), p = sample(w, sk, lat), why = hid(p);
          if (why) {
            if (cur && prev && !prev.why) cur.push(edge(prev.s, sk));
            flush(); if (!oi) { if (why === 'gate') rec.want -= wt; else rec[why] += wt; }
          } else {
            if (prev && prev.why) { cur = [edge(sk, prev.s)]; }
            (cur ||= []).push(p);
          }
          prev = { s: sk, why };
        }
        flush();
      });
    }
    if (rec.want > 0.01) rules.push(rec);
  };
  const DBL = [-(RULES.thin + RULES.gap) / 2, (RULES.thin + RULES.gap) / 2];

  for (const w of net.ways) {
    prepLanes(w);
    if (!eligible(w)) continue;
    stats.ways++;
    const { nF, nB } = w.lanes, T = nF + nB, K = w.bnd[0].b.length, mid = w.bnd[0].mid;
    const c0 = (stats.classes[classOf(w)] ||= { ways: 0, len: 0 }); c0.ways++; c0.len += w.L;
    const hid = hidOf(w);
    const bus = o.bus && isBusLaneWay(w);
    const edges = edgesOf(w);
    const centre = nB > 0 ? centreKindFor(T, w.rank, w.w) : null;
    const dr = w.med && w.medPartner ? true : null;
    for (const e of edges) {
      const anchor = Math.min(e.f ? e.f.lo : 1e9, e.b ? e.b.lo : 1e9);
      const rng = nB > 0 ? (e.f && e.b ? { lo: Math.min(e.f.lo, e.b.lo), hi: Math.max(e.f.hi, e.b.hi) } : (e.f || e.b)) : e.f;     // union of both directions for the centre line
      // ---- centre line of a two-way carriageway
      if (centre && rng) {
        const lat = (q) => latAt(w, q, mid);
        if (centre === 'double') ask('centre-double', w, rng.lo, rng.hi, lat, RULES.thin, { hid, offs: DBL });
        else if (centre === 'solid') ask('centre-solid', w, rng.lo, rng.hi, lat, RULES.lane, { hid });
        else ask('centre-dash', w, rng.lo, rng.hi, lat, RULES.lane, { hid, dash: true, anchor });
      }
      // ---- lane lines between lanes of the same direction (the kerb lane of west Nevsky is the bus lane: solid)
      if (w.bnd[0].lw >= RULES.laneMin) for (let j = 1; j < K - 1; j++) {
        if (nB > 0 && j === mid) continue;
        const dir = w.bnd[0].dir[j], r = dir > 0 ? e.f : e.b; if (!r) continue;
        const lat = (q) => latAt(w, q, j);
        if (bus && j === K - 2) ask('lane-solid', w, r.lo, r.hi, lat, RULES.lane, { hid });
        else ask('lane-dash', w, r.lo, r.hi, lat, RULES.lane, { hid, dash: true, anchor });
      }
      // ---- the shared edge of two one-way carriageways that meet: ONE roadway, ONE line (drawn by the carriageway that medDraws() names)
      if (dr && e.f) {
        let kind = null;
        for (let k = 0; k < w.n; k++) if (w.med[k]) {            // kind of the roadway: this carriageway + the one across the edge (two lanes in all: the dashed / solid centre line of a 2-lane road)
          const v = w.medPartner && w.medPartner[k];
          kind = centreKindFor(nF + (v ? v.lanes.nF : nF), Math.max(w.rank, v ? v.rank : 0), w.w + (v ? v.w : w.w)) || kind;
        }
        if (kind) {
          const gate = (p) => { const k = p.q.k, k1 = Math.min(w.n - 1, k + 1); return !w.med[k] || !w.med[k1] || partnerDraws(w, w.medPartner[k], p.x, p.z); };
          const mo = medOffsets(w), hidM = (p) => hidOf(w, w.medPartner && w.medPartner[p.q.k], gate)(p), lat = (q) => mo[q.k] + (mo[Math.min(w.n - 1, q.k + 1)] - mo[q.k]) * q.f;
          if (kind === 'double') ask('median-double', w, e.f.lo, e.f.hi, lat, RULES.thin, { hid: hidM, offs: DBL });
          else if (kind === 'solid') ask('median-solid', w, e.f.lo, e.f.hi, lat, RULES.lane, { hid: hidM });
          else ask('median-dash', w, e.f.lo, e.f.hi, lat, RULES.lane, { hid: hidM, dash: true, anchor });
        }
      }
      // ---- the continuous line between the lane and a parking pocket (where the pocket is deeper than 1.8 m)
      for (const side of ['L', 'R']) {
        const park = side === 'R' ? w.parkR : w.parkL; if (!park.some((v) => v > 1)) continue;
        const r = side === 'R' ? e.f : (nB > 0 ? e.b : e.f); if (!r) continue;
        const lat = side === 'R' ? (q) => latAt(w, q, K - 1) : (q) => latAt(w, q, 0);
        ask('pocket', w, r.lo, r.hi, lat, RULES.thin, { hid: hidOf(w, null, (p) => (side === 'R' ? p.q.parkR : p.q.parkL) < 1.8) });
      }
      // ---- straight arrows 30 m before the stop line of an approach to a junction (wide streets)
      if (o.arrows && w.rank >= 3 && w.w >= 10) for (const dir of [1, -1]) {
        const r = dir > 0 ? e.f : (nB > 0 ? e.b : null), nd = dir > 0 ? e.B.nd : e.A.nd;
        if (!r || !nd || r.hi - r.lo < RULES.arrowBefore + 20) continue;
        const s = dir > 0 ? r.hi - RULES.arrowBefore : r.lo + RULES.arrowBefore, q = wayAt(w, s);
        for (let j = dir > 0 ? nB : 0; j < (dir > 0 ? K - 1 : nB); j++) {
          const c = (latAt(w, q, j) + latAt(w, q, j + 1)) / 2, x = q.x - q.tz * c, z = q.z + q.tx * c;
          if (net.cover(x, z, { skip: w }) > -1.5 || nearCrossing(net, x, z, 3) || deckAt(x, z, 2)) continue;
          arrows.push({ x, z, dx: q.tx * dir, dz: q.tz * dir, y: ROAD_Y, way: w.i });
        }
      }
    }
  }

  // ---- stop lines 1.12: one bar per approach (all its lanes)
  const groups = new Map();
  for (const sl of graph.stopLines) {
    const lane = graph.laneById.get(sl.lane); if (!lane || lane.rank < 1 || lane.len < RULES.stopMinApproach) continue;       // (an approach lane shorter than 12 m lies inside a junction complex: a micro lane between two carriageways)
    if (!(sl.signal || sl.give)) continue;
    const key = (sl.junction || sl.signal) + '|' + sl.approach; let g = groups.get(key); if (!g) groups.set(key, (g = { sl, lanes: [] })); g.lanes.push({ lane, sl });
  }
  for (const g of groups.values()) {
    const L0 = g.lanes[0].lane, p0 = L0.pts[L0.pts.length - 1], q0 = L0.pts[L0.pts.length - 2] || L0.pts[0];
    let tx = p0[0] - q0[0], tz = p0[1] - q0[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    const rx = -tz, rz = tx;
    let a = 1e9, b = -1e9;
    for (const { sl, lane } of g.lanes) { const c = (sl.x - p0[0]) * rx + (sl.z - p0[1]) * rz; a = Math.min(a, c - lane.width / 2 + 0.06); b = Math.max(b, c + lane.width / 2 - 0.06); }
    if (b - a < 1) continue;
    const deck = deckAt(p0[0], p0[1], 1);
    // The southern flat decks have signalised junctions at their mouths.
    // Keep the same 1.12 approach rule there and paint at the actual deck datum;
    // the older arched bridges retain their authored markings.
    if (deck && !deck.south) continue;
    const depth = L0.rank >= 4 ? RULES.stopWPrimary : RULES.stopW;
    bars.push({ x: p0[0], z: p0[1], tx, tz, a, b, depth, y: deck ? 0.05 + LIFT : ROAD_Y + LIFT, signal: !!g.sl.signal, give: !!g.sl.give, rank: L0.rank, junction: g.sl.junction, approach: g.sl.approach, name: L0.name || null });
  }
  const dropped = [], kept = pruneStubs(net, lines, bars, recs, stats, dropped);
  stats.counts = { lines: kept.length, bars: bars.length, arrows: arrows.length };
  return { lines: kept, bars, arrows, rules, stats, dropped };
}

// ------------------------------------------------------------------ painting
/** a strip along pts (x, z, nx, nz): u across, v along; collinear interior points are dropped (a dash = one quad) */
export function strip(B, pts, width, col, lift, uvLen = 3) {
  if (pts.length > 2) { const keep = dpKeep([pts.map((p) => [p.x, p.z])], 0.012); pts = pts.filter((_, i) => keep[i]); }
  let prev = null, s = 0;
  pts.forEach((p, i) => {
    if (i) s += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
    const a = B.vert(p.x + p.nx * width / 2, ROAD_Y + lift, p.z + p.nz * width / 2, 0, s / uvLen, UP, col), b = B.vert(p.x - p.nx * width / 2, ROAD_Y + lift, p.z - p.nz * width / 2, 1, s / uvLen, UP, col);
    if (prev) B.quad(prev[0], prev[1], b, a);
    prev = [a, b];
  });
}

/** the lines and stop bars of a plan into the paint MB P (vertex colour); returns the stop-bar count */
export function drawPlan(plan, P) {
  for (const l of plan.lines) strip(P, l.pts, l.width, WHITE, LIFT, l.dash ? RULES.dash : 6);
  let n = 0;
  for (const b of plan.bars) {
    const rx = -b.tz, rz = b.tx, V = (u, c, tu, tv) => P.vert(b.x + b.tx * u + rx * c, b.y ?? ROAD_Y + LIFT, b.z + b.tz * u + rz * c, tu, tv, UP, WHITE);
    P.quad(V(-b.depth, b.a, 0, 0), V(0, b.a, 1, 0), V(0, b.b, 1, 1), V(-b.depth, b.b, 0, 1)); n++;
  }
  return n;
}
export { clamp };
