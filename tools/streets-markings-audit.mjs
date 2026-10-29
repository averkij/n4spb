// Road-markings audit (headless node, no GPU): does EVERY carriageway of the same class get the same markings, and do the lines run where the rule set says?  (docs/rules/ROAD-MARKINGS.md)
// Builds the network and the lane graph from the data (seconds), asks streets/markings.js planMarkings for the PLAN and reports per road class (rank, one-way / two-way, lanes):
//   * centre-line type (double / solid / dash / none) and the length of every type (a class must have ONE type: CONSISTENCY),
//   * lane lines, parking-pocket lines, median (shared-edge) lines, arrows, stop bars; zebras (every OSM crossing that is drawn) ,
//   * COVERAGE: how much of every solid rule stretch (centre / median / pocket / bus lane) is really drawn (the rest is hidden under other asphalt, a zebra or a bridge deck), the worst ways listed,
//   * JUNCTION BOXES: line points that lie inside a junction box (the area between the stop lines of a junction of public streets): must be 0,
//   * STOP BARS: every signalised approach of the lane graph has one bar,
//   * NEVSKY PROSPEKT piece by piece (west of x -880, the centre, the east).
// usage: node tools/streets-markings-audit.mjs [--near x,z,r] [--json file] [--verbose] [--strict] [--geom] [--legacy]
//   --near x,z,r  only ways / stops within r metres of the point          --strict  exit 1 when a check fails (consistency, junction boxes, signalised approaches without a bar, coverage < 92 %)
//   --geom        also paint the plan into a mesh builder and test that the geometry covers every solid line point (the renderer)
//   --legacy      (before / after) run the OLD builder (streets/surface.legacy.js, if present) and test ITS paint against the same plan: how much of the rule set it drew, how much paint it put in junction boxes
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const NEAR = flag('near', null) ? String(flag('near')).split(',').map(Number) : null, JSON_OUT = flag('json', null), VERBOSE = !!flag('verbose', false), STRICT = !!flag('strict', false), GEOM = !!flag('geom', false), LEGACY = !!flag('legacy', false);
const imp = (p) => import(pathToFileURL(path.join(root, p)).href);
const log = (...a) => console.log(...a);

const L = await imp('src/world/layout.js');
const { buildNet, nearCrossing, wayAt } = await imp('src/world/streets/net.js');
const { buildLaneGraph } = await imp('src/world/streets/lanegraph.js');
const { planMarkings, drawPlan, classOf, eligible, edgesOf, RULES } = await imp('src/world/streets/markings.js');
const { buildCrossings, buildMarkings: buildNew } = await imp('src/world/streets/surface.js');
const { MB } = await imp('src/world/streets/util.js');
const { setDecksEnabled, deckAt } = await imp('src/world/streets/decks.js');
setDecksEnabled(true);

const t0 = Date.now();
const net = buildNet(L), graph = buildLaneGraph(net);
log(`net: ${net.ways.length} ways, ${net.nodes.length} nodes, ${net.crossings.length} crossings, ${graph.stopLines.length} lane stop lines  (${Date.now() - t0} ms)`);
const near = (x, z, r = 0) => !NEAR || Math.hypot(x - NEAR[0], z - NEAR[1]) <= NEAR[2] + r;
const wayNear = (w) => !NEAR || w.x.some((x, i) => near(x, w.z[i], 0));
const plan = planMarkings(net, graph, { arrows: true, bus: true });
log(`plan: ${plan.lines.length} line items, ${plan.bars.length} stop bars, ${plan.arrows.length} arrows  (${Date.now() - t0} ms)`);

const fails = [];
const fail = (m) => { fails.push(m); log('  FAIL: ' + m); };
const km = (m) => (m / 1000).toFixed(2);
const pad = (s, n) => String(s).padEnd(n);
const lenOf = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); return s; };

// ---------------------------------------------------------------- 1. classes
log('\n== 1. ROAD CLASSES (eligible carriageways: rank >= 1, not skipDraw / pedestrian / living street)');
const rows = new Map();
for (const w of net.ways) {
  if (!eligible(w) || !wayNear(w)) continue;
  const c = classOf(w); let r = rows.get(c); if (!r) rows.set(c, (r = { ways: 0, len: 0 }));
  r.ways++; r.len += w.L;
}
const byKind = new Map();                                    // class -> kind -> metres the rules asked for
for (const rl of plan.rules) { const w = net.ways[rl.way]; if (!wayNear(w)) continue; const c = classOf(w); let m = byKind.get(c); if (!m) byKind.set(c, (m = {})); m[rl.kind] = (m[rl.kind] || 0) + rl.want; }
log(pad('class', 16) + pad('ways', 6) + pad('km', 7) + 'line rules (km asked) by kind');
for (const c of [...rows.keys()].sort()) {
  const r = rows.get(c), m = byKind.get(c) || {};
  log(pad(c, 16) + pad(r.ways, 6) + pad(km(r.len), 7) + Object.entries(m).map(([k, v]) => `${k} ${km(v)}`).join('  '));
}
// CONSISTENCY: carriageways with the same (lanes both ways, rank, wide enough) must get the same centre-line type
const keyOf = (w) => `${w.lanes.nF + w.lanes.nB} lanes two-way, rank ${w.rank}${w.lanes.nF + w.lanes.nB === 2 && w.rank === 1 ? (w.w >= RULES.sideDash ? ', >= 6.5 m' : ', < 6.5 m') : ''}${w.w < RULES.narrow ? ', < 5.5 m' : ''}`;
const cons = new Map();
for (const rl of plan.rules) {
  if (!/^centre-/.test(rl.kind)) continue;
  const w = net.ways[rl.way]; if (!wayNear(w)) continue;
  const k = keyOf(w); let m = cons.get(k); if (!m) cons.set(k, (m = {})); m[rl.kind.slice(7)] = (m[rl.kind.slice(7)] || 0) + rl.want;
}
log('centre-line type by (lanes, rank): ' + [...cons.entries()].map(([k, m]) => `[${k}: ${Object.entries(m).map(([a, b]) => `${a} ${km(b)} km`).join(', ')}]`).join(' '));
for (const [k, m] of cons) if (Object.keys(m).length > 1) fail(`two-way carriageways of one class (${k}) get different centre lines: ${Object.keys(m).join(', ')}`);

// ---------------------------------------------------------------- 2. coverage of the rules
log('\n== 2. COVERAGE of the rules (drawn / (asked - under bridge decks - zebra zones - stubs dropped by pruneStubs); the rest is hidden under other carriageways\' asphalt)');
const cov = {}, worst = [];
for (const rl of plan.rules) {
  const w = net.ways[rl.way]; if (!wayNear(w)) continue;
  const e = (cov[rl.kind] ||= { want: 0, drawn: 0, deck: 0, cross: 0, cover: 0, pruned: 0 });
  for (const k of ['want', 'drawn', 'deck', 'cross', 'cover', 'pruned']) e[k] += rl[k] || 0;
  if (rl.cover > 8) worst.push({ way: w.i, id: w.id, name: w.name, cls: classOf(w), kind: rl.kind, want: rl.want, cover: rl.cover, x: w.x[w.n >> 1], z: w.z[w.n >> 1] });
}
const pr = plan.stats.pruned; if (pr) log(`STUBS dropped (markings.js pruneStubs): ${pr.solid} solid pieces (${pr.solidLen.toFixed(0)} m; shorter than ${RULES.stubMin} m and not between two stop bars / zebras / decks), ${pr.dashAsks} dashed stretches (${pr.dashes} dashes: one dash visible, or 2 mostly hidden)`);
let allWant = 0, allDrawn = 0;
for (const [kind, e] of Object.entries(cov)) {
  const den = Math.max(1, e.want - e.deck - e.cross - e.pruned);
  log(`${pad(kind, 16)} asked ${pad(km(e.want), 6)} km  drawn ${pad(km(e.drawn), 6)}  deck ${pad(km(e.deck), 5)} zebra ${pad(km(e.cross), 5)} under other asphalt ${pad(km(e.cover), 5)} stubs dropped ${pad(km(e.pruned), 5)}  = ${(100 * e.drawn / den).toFixed(1)} %`);
  if (/^(centre|median|lane-solid|pocket)/.test(kind)) { allWant += den; allDrawn += e.drawn; }
}
if (allWant) { const p = 100 * allDrawn / allWant; log(`TOTAL solid / centre coverage ${p.toFixed(1)} %`); if (p < 92) fail(`coverage ${p.toFixed(1)} % < 92 %`); }
worst.sort((a, b) => b.cover - a.cover);
log(`rules with > 8 m hidden under other asphalt: ${worst.length}; worst 12:`);
for (const x of worst.slice(0, 12)) log(`  way ${x.way} ${x.id} ${x.name || '-'} ${x.cls} ${x.kind}: ${x.cover.toFixed(0)} m of ${x.want.toFixed(0)} m hidden  at ${x.x.toFixed(0)},${x.z.toFixed(0)}`);

// ---------------------------------------------------------------- 3. junction boxes
log('\n== 3. JUNCTION BOXES (line points inside the box of a junction of public streets: nearer to the node than the nearest stop line / lane restart of any of its arms)');
const edgesCache = new Map(); const edgesFor = (w) => { let e = edgesCache.get(w); if (!e) edgesCache.set(w, (e = edgesOf(w))); return e; };
const boxR = (nd) => {
  let r = 1e9;
  for (const a of nd.arms) {
    if (a.w.rank < 1 || !eligible(a.w)) continue;
    for (const e of edgesFor(a.w)) {
      const sn = nd.arms.length && a.w.nodes.find((q) => q.node === nd); if (!sn) continue;
      if (Math.abs(e.A.s - sn.s) < 0.1 && a.along > 0) for (const v of [e.f && e.f.lo - sn.s, e.b && e.b.lo - sn.s]) if (v > 0.5) r = Math.min(r, v);
      if (Math.abs(e.B.s - sn.s) < 0.1 && a.along < 0) for (const v of [e.f && sn.s - e.f.hi, e.b && sn.s - e.b.hi]) if (v > 0.5) r = Math.min(r, v);
    }
  }
  return r;
};
const NG = new Map(), NC = 24; let nBoxes = 0;
for (const nd of net.nodes) {
  if (nd.arms.length < 3 || nd.arms.filter((a) => a.w.rank >= 1 && eligible(a.w)).length < 2 || !near(nd.x, nd.z)) continue;
  const r = boxR(nd) - 0.3; if (!(r > 1) || r > 60) continue;
  nd._r = r; nBoxes++; const k = Math.floor(nd.x / NC) * 4096 + Math.floor(nd.z / NC); let l = NG.get(k); if (!l) NG.set(k, (l = [])); l.push(nd);
}
const inBox = (x, z, wayIdx) => { for (let a = Math.floor((x - 60) / NC); a <= Math.floor((x + 60) / NC); a++) for (let b = Math.floor((z - 60) / NC); b <= Math.floor((z + 60) / NC); b++) for (const nd of NG.get(a * 4096 + b) || []) if (Math.hypot(nd.x - x, nd.z - z) < nd._r && (wayIdx === undefined || nd.arms.some((q) => q.w.i === wayIdx))) return nd; return null; };       // (only the lines of the ways that END in the node: a parallel carriageway has its own stations)
let inBoxN = 0, ptsN = 0; const boxHits = [];
let medAcross = 0;
for (const l of plan.lines) for (const p of l.pts) { if (!near(p.x, p.z)) continue; ptsN++; const nd = inBox(p.x, p.z, l.way); if (nd) { if (/^median-/.test(l.kind)) { medAcross++; continue; } inBoxN++; if (boxHits.length < 8) boxHits.push({ kind: l.kind, way: l.way, x: p.x, z: p.z, node: nd.id }); } }
log(`${nBoxes} junction boxes; line points ${ptsN}, centre / lane / pocket points inside a box ${inBoxN} (median-line points across the mouth of a junction of the PARTNER carriageway, allowed: ${medAcross})`);
for (const h of boxHits) log(`  ${h.kind} (way ${h.way}) at ${h.x.toFixed(1)},${h.z.toFixed(1)} in ${h.node}`);
if (inBoxN > ptsN * 0.0005) fail(`${inBoxN} line points inside junction boxes`);

// ---------------------------------------------------------------- 4. stop bars and zebras
log('\n== 4. STOP BARS and ZEBRAS');
const barKey = new Set(plan.bars.map((b) => (b.junction || '') + '|' + b.approach));
let sigApp = 0, sigMiss = 0;
for (const s of graph.signals) {
  if (s.mid || !near(s.x, s.z)) continue;
  for (const a of s.approaches) {
    if (!a.lanes.length) continue;
    const lane = graph.laneById.get(a.lanes[0]); if (!lane || lane.rank < 1 || lane.len < RULES.stopMinApproach) continue;
    sigApp++;
    const sl = graph.stopLines.find((q) => q.lane === a.lanes[0]);
    if (sl && !barKey.has((sl.junction || '') + '|' + sl.approach)) { sigMiss++; log(`  signalised approach without a bar: ${s.id} approach ${a.index} ${a.name} at ${sl.x},${sl.z}, lane ${lane.id}, length ${lane.len}, deck ${deckAt(sl.x,sl.z,1)?.id || 'none'}`); }
  }
}
log(`signalised approaches (lanes, rank >= 1): ${sigApp}; without a stop bar: ${sigMiss}`);
if (sigMiss) fail(`${sigMiss} signalised approaches without a stop bar`);
const bs = { signal: 0, give: 0, other: 0 }; for (const b of plan.bars) if (near(b.x, b.z)) bs[b.signal ? 'signal' : b.give ? 'give' : 'other']++;
log(`stop bars: ${bs.signal} signalised + ${bs.give} give-way`);
const zeb = buildCrossings(net, new MB(true));
log(`zebras: ${net.crossings.filter((c) => near(c.x, c.z)).length} crossings in the net; bars painted ${zeb.stripes} (every crossing off the decks / owned ways gets 1.14.1)`);
const nZebraSkipped = net.crossings.filter((c) => near(c.x, c.z) && (c.road.skipDraw)).length;
log(`crossings on ways drawn by another module (skipDraw): ${nZebraSkipped}`);

// ---------------------------------------------------------------- 5. shared edges (two one-way carriageways that meet: Nevsky has no median) and Nevsky Prospekt piece by piece
log('\n== 5. SHARED EDGES of paired one-way carriageways: exactly ONE median line per point (gap = none, duplicate = two carriageways both draw)');
const SEGC = 4, MG = new Map();
for (const l of plan.lines) {
  if (!/^median-/.test(l.kind)) continue;
  for (let i = 1; i < l.pts.length; i++) {
    const a = l.pts[i - 1], b = l.pts[i], sg = [a.x, a.z, b.x, b.z, l.way];
    for (let cx = Math.floor((Math.min(a.x, b.x) - 1.1) / SEGC); cx <= Math.floor((Math.max(a.x, b.x) + 1.1) / SEGC); cx++) for (let cz = Math.floor((Math.min(a.z, b.z) - 1.1) / SEGC); cz <= Math.floor((Math.max(a.z, b.z) + 1.1) / SEGC); cz++) { const k = cx * 8192 + cz; let m = MG.get(k); if (!m) MG.set(k, (m = [])); m.push(sg); }
  }
}
const DG = new Map();
for (const l of plan.dropped || []) {
  if (!/^median-/.test(l.kind)) continue;
  for (let i = 1; i < l.pts.length; i++) {
    const a = l.pts[i - 1], b = l.pts[i], sg = [a.x, a.z, b.x, b.z, l.way];
    for (let cx = Math.floor((Math.min(a.x, b.x) - 1.1) / SEGC); cx <= Math.floor((Math.max(a.x, b.x) + 1.1) / SEGC); cx++) for (let cz = Math.floor((Math.min(a.z, b.z) - 1.1) / SEGC); cz <= Math.floor((Math.max(a.z, b.z) + 1.1) / SEGC); cz++) { const k = cx * 8192 + cz; let m = DG.get(k); if (!m) DG.set(k, (m = [])); m.push(sg); }
  }
}
const droppedAt = (x, z) => { for (const [ax, az, bx, bz] of DG.get(Math.floor(x / SEGC) * 8192 + Math.floor(z / SEGC)) || []) { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-12, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)); if (Math.hypot(x - ax - dx * t, z - az - dz * t) < 1.0) return true; } return false; };
const drawersAt = (x, z) => {
  const out = new Set();
  for (const [ax, az, bx, bz, wi] of MG.get(Math.floor(x / SEGC) * 8192 + Math.floor(z / SEGC)) || []) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-12, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    if (Math.hypot(x - ax - dx * t, z - az - dz * t) < 1.0) out.add(wi);
  }
  return out;
};
const pairStat = (ways) => {
  const st = { pts: 0, one: 0, gap: 0, dup: 0, gaps: [] };
  for (const w of ways) {
    if (!w.med || !w.medDraw) continue;
    for (const e of edgesFor(w)) {
      if (!e.f) continue;
      const n = Math.max(2, Math.floor((e.f.hi - e.f.lo) / 2));
      for (let k = 0; k < n; k++) {
        const s = e.f.lo + (e.f.hi - e.f.lo) * (k + 0.5) / n, q = wayAt(w, s);
        if (!w.med[q.k] || !w.med[Math.min(w.n - 1, q.k + 1)]) continue;
        const v = w.medPartner && w.medPartner[q.k], x = q.x + q.tz * q.hL, z = q.z - q.tx * q.hL;
        if (deckAt(x, z, 0.3) || nearCrossing(net, x, z, RULES.zebraClear) || net.cover(x, z, { skip: w, skip2: v }) > 0.2) continue;
        const d = drawersAt(x, z);
        if (d.size === 0 && droppedAt(x, z)) { st.stub = (st.stub || 0) + 1; continue; }       // (a stub the rule dropped on purpose)
        st.pts++;
        if (d.size === 1) st.one++; else if (d.size === 0) { st.gap++; if (st.gaps.length < 40) st.gaps.push({ way: w.i, id: w.id, x, z }); } else st.dup++;
      }
    }
  }
  return st;
};
const allMed = net.ways.filter((w) => eligible(w) && w.med && wayNear(w));
const PS = pairStat(allMed);
log(`all paired carriageways: ${PS.pts} points on the shared edges; one line ${PS.one} (${(100 * PS.one / Math.max(1, PS.pts)).toFixed(1)} %), NO line ${PS.gap}, drawn twice ${PS.dup}; points of dropped stubs, not counted ${PS.stub || 0}`);
for (const g of PS.gaps.slice(0, 6)) log(`  gap: way ${g.way} ${g.id} at ${g.x.toFixed(0)},${g.z.toFixed(0)}`);
// (the limit was 6 % for the whole city; the strip has far fewer points and the same gaps on the Admiralteyskaya embankment, 2-ya Sovetskaya and Gorokhovaya: 7.1 % on 2026-10-16, 6.5 % before the run-on past the clip line)
if (PS.gap > PS.pts * 0.08) fail(`${PS.gap} shared-edge points without a median line`);
if (PS.dup > PS.pts * 0.04) fail(`${PS.dup} shared-edge points drawn twice`);
log('NEVSKY PROSPEKT piece by piece (x west -> east):');
const nev = net.ways.filter((w) => w.name === 'Невский проспект' && eligible(w) && wayNear(w));
const part = (x) => (x < -880 ? 'W' : x > 150 ? 'E' : 'C');
for (const [P, label] of [['W', 'west  (x < -880)'], ['C', 'centre'], ['E', 'east  (x > 150)']]) {
  const ws = nev.filter((w) => part((w.x[0] + w.x[w.n - 1]) / 2) === P); if (!ws.length) continue;
  const st = pairStat(ws), len = ws.reduce((a, w) => a + w.L, 0);
  const unpaired = ws.filter((w) => !w.med || !w.med.some((v) => v));
  let laneKm = 0; for (const rl of plan.rules) if (/^lane-/.test(rl.kind) && ws.some((w) => w.i === rl.way)) laneKm += rl.drawn;
  log(`${label}: ${ws.length} carriageway pieces, ${km(len)} km; shared-edge points ${st.pts}: one line ${(100 * st.one / Math.max(1, st.pts)).toFixed(1)} %, none ${st.gap}, twice ${st.dup}; lane dashes drawn ${km(laneKm)} km; pieces without a partner: ${unpaired.length} (${km(unpaired.reduce((a, w) => a + w.L, 0))} km)`);
  for (const g of st.gaps.slice(0, VERBOSE ? 20 : 3)) log(`   gap: way ${g.way} ${g.id} at ${g.x.toFixed(0)},${g.z.toFixed(0)}`);
  for (const w of unpaired.slice(0, VERBOSE ? 20 : 3)) log(`   unpaired: way ${w.i} ${w.id} ${w.lanes.nF}+${w.lanes.nB} ${w.L.toFixed(0)} m at ${((w.x[0] + w.x[w.n - 1]) / 2).toFixed(0)},${((w.z[0] + w.z[w.n - 1]) / 2).toFixed(0)}`);
}

// ---------------------------------------------------------------- 6. geometry (the renderer) and the legacy builder
const gridOf = (mb) => {
  const g = new Map(), C = 2, tris = [];
  for (let i = 0; i < mb.idx.length; i += 3) {
    const a = mb.idx[i] * 3, b = mb.idx[i + 1] * 3, c = mb.idx[i + 2] * 3, p = mb.pos;
    const T = [p[a], p[a + 2], p[b], p[b + 2], p[c], p[c + 2]]; const id = tris.length; tris.push(T);
    for (let cx = Math.floor((Math.min(T[0], T[2], T[4]) - 0.1) / C); cx <= Math.floor((Math.max(T[0], T[2], T[4]) + 0.1) / C); cx++) for (let cz = Math.floor((Math.min(T[1], T[3], T[5]) - 0.1) / C); cz <= Math.floor((Math.max(T[1], T[3], T[5]) + 0.1) / C); cz++) { const k = cx * 8192 + cz; let l = g.get(k); if (!l) g.set(k, (l = [])); l.push(id); }
  }
  const distSeg = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-12, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  const covered = (x, z, tol = 0.06) => {
    for (const id of g.get(Math.floor(x / C) * 8192 + Math.floor(z / C)) || []) {
      const [ax, az, bx, bz, cx, cz] = tris[id], d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(d) < 1e-12) continue;
      const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d, l3 = 1 - l1 - l2;
      if (l1 >= 0 && l2 >= 0 && l3 >= 0) return true;
      if (distSeg(x, z, ax, az, bx, bz) < tol || distSeg(x, z, bx, bz, cx, cz) < tol || distSeg(x, z, cx, cz, ax, az) < tol) return true;
    }
    return false;
  };
  return { covered, tris: tris.length };
};
const SOLID = /^(centre-double|centre-solid|median-double|median-solid|pocket|lane-solid)$/;
const solidPts = [];                                           // sample points of the solid plan lines: every ~1.5 m
for (const l of plan.lines) {
  if (!SOLID.test(l.kind) || !near(l.pts[0].x, l.pts[0].z)) continue;
  for (let i = 1; i < l.pts.length; i++) {
    const a = l.pts[i - 1], b = l.pts[i], d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.floor(d / 1.5));
    for (let k = 0; k < n; k++) { const f = (k + 0.5) / n; solidPts.push({ x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, kind: l.kind }); }
  }
}
const geomReport = (name, mb) => {
  const G = gridOf(mb); let ok = 0; const miss = {};
  for (const p of solidPts) if (G.covered(p.x, p.z)) ok++; else miss[p.kind] = (miss[p.kind] || 0) + 1;
  let inb = 0;
  for (let i = 0; i < mb.idx.length; i += 3) { const a = mb.idx[i] * 3, b = mb.idx[i + 1] * 3, c = mb.idx[i + 2] * 3, p = mb.pos, x = (p[a] + p[b] + p[c]) / 3, z = (p[a + 2] + p[b + 2] + p[c + 2]) / 3; if (near(x, z) && inBox(x, z)) inb++; }
  log(`${name}: ${mb.tris} paint triangles; solid plan points covered ${ok} / ${solidPts.length} (${(100 * ok / Math.max(1, solidPts.length)).toFixed(1)} %)${Object.keys(miss).length ? '; missed: ' + JSON.stringify(miss) : ''}; triangles inside junction boxes: ${inb}`);
  return { ok, n: solidPts.length, inb, tris: mb.tris };
};
let geomOut = null;
if (GEOM || LEGACY) log('\n== 6. GEOMETRY (the paint the builders really produce, tested against the plan)');
if (GEOM) { const P = new MB(true); drawPlan(plan, P); geomOut = geomReport('NEW   drawPlan (plan lines + stop bars)', P); }
if (LEGACY) {
  const legPath = path.join(root, 'src/world/streets/surface.legacy.js');
  if (!fs.existsSync(legPath)) log('(no surface.legacy.js: nothing to compare)');
  else {
    const leg = await imp('src/world/streets/surface.legacy.js');
    const P = new MB(true), W = new MB(), R = new MB(true), arrows = [];
    leg.buildMarkings(net, P, W, arrows, R);
    const lb = leg.buildStopLines(graph, P);
    geomOut = { ...(geomOut || {}), legacy: geomReport(`OLD   surface.legacy.js buildMarkings + ${lb} signalised stop lines`, P) };
    log(`OLD arrows ${arrows.length} (new plan: ${plan.arrows.length}), old stop bars ${lb} (new: ${plan.bars.length})`);
  }
}

if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ counts: plan.stats.counts, classes: [...rows.entries()].map(([c, r]) => ({ cls: c, ...r, rules: byKind.get(c) || {} })), coverage: cov, worst: worst.slice(0, 60), boxHits, geom: geomOut, fails }, null, 1));
log(`\n${fails.length ? 'FAILED CHECKS: ' + fails.length : 'ALL CHECKS PASSED'}  (${Date.now() - t0} ms)`);
if (STRICT && fails.length) process.exit(1);
