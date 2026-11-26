// Headless (no GPU) wall-integrity audit of the generic city module.
//   node tools/city-wall-audit.mjs [--owned all|none] [--near x,z,r] [--json file] [--max-unexplained N] [--list N] [--quiet] [--ref HEAD]
//
// Question: is the surface of the union of all drawn building masses closed? For every ring edge of every drawn building record (the same pipeline as city.js: prep.prepare ->
// archetypes.describe -> edges.analyse -> passages.planPassages -> walls.buildWalls) it samples points along the edge (every 0.3 m) at three heights (low, middle, just under the
// cornice) and asks
//   1. is the point 2 cm OUTSIDE the wall exposed to air, i.e. not inside any other mass (other drawn record, landmark-owned occluder, custom tower) at that height?
//   2. if exposed: does a real wall face exist there? The faces are the quads / faces that buildWalls() really emitted (a recording stand-in for the FacadeBuilder), from ANY
//      building, facing the same way, between 6 cm in front of and 30 cm behind the wall line (a coincident same-facing neighbour draws it), covering that height.
// Options: --step 0.3 --off 0.02 (probe distance in front of the wall; the old 12 cm tolerance of edges.js hid real cracks) --owned all|none (landmark modules own their groups, as in the shipped scene).
// An exposed point without a face is a GAP (you see through the building / into its hollow body). Every gap gets a cause; the allow-list below holds the legitimate reasons
// (the ALLOW table below: arch openings, embedded corner slivers <= 3 m, rooms over passages, low steps, custom towers, landmark-owned masses). Everything else is UNEXPLAINED and fails (exit 1).
// Also checked: ROOF (every drawn record has a deck, or a same-footprint duplicate does), FLOOR (a raised part has a body under it or a passage way), WINDING (the face normal
// points to the outside of its own ring).
// Causes (see docs/rules/FACADE-INTEGRITY.md): opening / arch / doorway = allowed; the rest are generator defects.
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = (p) => import(pathToFileURL(path.join(root, p)).href);
const args = {}; for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; args[k] = v; } }

const { BUILDINGS, OVERLAPS } = await imp('src/world/data/city.js');
const L = await imp('src/world/layout.js');
// --ref <git ref>: audit the module as committed at that ref over the current data (tools/city-ref.mjs): is a failure new, or was it there before your change?
let cityDir = 'src/world/city/', refMod = null;
if (args.ref) { const { extractCityRef } = await imp('tools/city-ref.mjs'); refMod = extractCityRef(root, args.ref); cityDir = refMod.path('city') + '/'; console.log('[wall-audit] module of', args.ref, 'over the current data'); process.on('exit', () => refMod.cleanup()); }
const { prepare, support } = await imp(cityDir + 'prep.js');
const { describe, assignColours } = await imp(cityDir + 'archetypes.js');
const { analyse } = await imp(cityDir + (args.edges || 'edges') + '.js');
const { planPassages } = await imp(cityDir + 'passages.js');
const { buildWalls, GATE_SPRING } = await imp(cityDir + 'walls.js');
const { ringFromFlat, signedArea } = await imp('src/world/lib/massing.js');
const { isOwned } = await imp('src/world/lib/claims.js');

// ---- which groups the shipped scene owns (landmark modules' OWNS_GROUPS)
const owned = new Set();
if ((args.owned || 'all') === 'all') {
  for (const m of L.MODULE_KEYS) {
    try { const mod = await imp(`src/world/${m}.js`); const o = mod.OWNS_GROUPS; if (o === true) for (const g of L.GROUPS[m]) owned.add(g.key); else if (Array.isArray(o)) for (const k of o) owned.add(k); } catch (e) { /* module needs the browser: treated as not owning */ }
  }
}
const near = args.near ? args.near.split(',').map(Number) : null;
const inNear = (x, z) => !near || Math.hypot(x - near[0], z - near[1]) <= near[2];

// ---- the pipeline (city.js steps 1-4, without meshes)
const prep = prepare(BUILDINGS, (b) => isOwned(owned, b.id));
const described = prep.list.map((b) => ({ b, st: describe(b) }));
const customs = described.filter((r) => r.st.custom);
const list = described.filter((r) => !r.st.custom && !r.st.special);      // canopies / moored ships (canopies.js) have no walls
const occluders = prep.occluders.concat(customs.map((r) => ({ b: r.b, H: r.st.H })));
const net = analyse(list, occluders);
assignColours(new Map(list.map((r) => [r.b.id, r.st])), net.adj, list.map((r) => r.b));
planPassages({}, net, list);

// ---- faces really emitted by the wall builder
const faces = [], FCELL = 24, fgrid = new Map();
const addFace = (f) => {
  faces.push(f);
  const x0 = Math.min(f.a[0], f.b[0]) - 0.2, x1 = Math.max(f.a[0], f.b[0]) + 0.2, z0 = Math.min(f.a[1], f.b[1]) - 0.2, z1 = Math.max(f.a[1], f.b[1]) + 0.2;
  for (let cx = Math.floor(x0 / FCELL); cx <= Math.floor(x1 / FCELL); cx++) for (let cz = Math.floor(z0 / FCELL); cz <= Math.floor(z1 / FCELL); cz++) { const k = cx + ',' + cz; let g = fgrid.get(k); if (!g) fgrid.set(k, (g = [])); g.push(f); }
};
let curOwner = null;
const recorder = {
  quad(a, b, y0, y1, nx, nz) { addFace({ a, b, y0, y1, nx, nz, owner: curOwner }); },
  face(pts, n) {
    let lo = 1e9, hi = -1e9; for (const p of pts) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }
    // a face strip of a gate piece: its horizontal extent is the farthest pair of points
    let best = [pts[0], pts[0]], d = -1; for (const p of pts) for (const q of pts) { const dd = Math.hypot(p[0] - q[0], p[2] - q[2]); if (dd > d) { d = dd; best = [p, q]; } }
    const l = Math.hypot(n[0], n[2]) || 1;
    addFace({ a: [best[0][0], best[0][2]], b: [best[1][0], best[1][2]], y0: lo, y1: hi, nx: n[0] / l, nz: n[2] / l, owner: curOwner, gate: true });
  },
};
for (const item of list) {
  const rec = net.rec.get(item.b.id); curOwner = rec;
  rec.walls = buildWalls({}, rec, () => recorder, {});
}
// hand-built towers (towers.js, st.custom) draw their own walls: allow-listed reason 'custom-tower' = their footprint edges count as faces over the full height
if (customs.length) { const cn = analyse(customs, []); for (const [, r] of cn.rec) for (const ring of r.rings) for (const e of ring.edges) addFace({ a: e.a, b: e.b, y0: 0, y1: r.st.H, nx: e.nx, nz: e.nz, owner: null, custom: true }); }
const faceAt = (x, z, h, nx, nz) => {
  const g = fgrid.get(Math.floor(x / FCELL) + ',' + Math.floor(z / FCELL)); if (!g) return null;
  for (const f of g) {
    if (f.nx * nx + f.nz * nz < 0.5) continue;
    if (h < f.y0 - 0.05 || h > f.y1 + 0.05) continue;
    const dx = f.b[0] - f.a[0], dz = f.b[1] - f.a[1], l2 = dx * dx + dz * dz; if (l2 < 1e-9) continue;
    const u = ((x - f.a[0]) * dx + (z - f.a[1]) * dz) / l2;
    if (u < -0.02 / Math.sqrt(l2) - 1e-6 || u > 1 + 0.02 / Math.sqrt(l2) + 1e-6) continue;
    // the face may lie up to 6 cm in front of the wall line or up to 30 cm BEHIND it (a same-facing duplicate wall of the overlapping neighbour draws it)
    const d = (x - f.a[0]) * f.nx + (z - f.a[1]) * f.nz;
    if (d > -0.06 && d < 0.30) return f;
  }
  return null;
};

// ---- masses (for the exposure test): drawn records + landmark-owned occluders + customs
const CORN = 0.4;
const SC = 32, sgrid = new Map();
const masses = [];
const addMass = (b, H, kind, rec) => {
  const y0 = Math.max(0, b.minH || 0);
  for (const poly of b.polys) {
    const outer = ringFromFlat(poly.o); if (outer.length < 3) continue;
    const holes = poly.h.map(ringFromFlat).filter((h) => h.length >= 3);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of outer) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
    const m = { id: b.id, kind, y0, y1: y0 + H + CORN, outer, holes, box: [x0, x1, z0, z1], rec };
    masses.push(m);
    for (let cx = Math.floor(x0 / SC); cx <= Math.floor(x1 / SC); cx++) for (let cz = Math.floor(z0 / SC); cz <= Math.floor(z1 / SC); cz++) { const k = cx + ',' + cz; let g = sgrid.get(k); if (!g) sgrid.set(k, (g = [])); g.push(m); }
  }
};
for (const r of list) addMass(r.b, r.st.H, 'drawn', net.rec.get(r.b.id));
for (const o of occluders) addMass(o.b, o.H, 'owned');
const ringHas = (r, x, z) => { let ins = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins; } return ins; };
const massAt = (x, z, h, skipId, skipMass) => {
  const g = sgrid.get(Math.floor(x / SC) + ',' + Math.floor(z / SC)); if (!g) return null;
  for (const m of g) {
    if (m.id === skipId || m === skipMass) continue;
    if (h < m.y0 - 0.01 || h > m.y1) continue;
    const b = m.box; if (x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue;
    if (!ringHas(m.outer, x, z)) continue;
    if (m.holes.some((hh) => ringHas(hh, x, z))) continue;
    return m;
  }
  return null;
};

// ---- the audit
const STEP = Number(args.step || 0.3), OFF = Number(args.off || 0.02);
const gaps = [], stats = { edges: 0, samples: 0, exposed: 0, drawn: 0, allowed: 0, gaps: 0 };
const ALLOW = {
  'arch-opening': 'inside a carriage arch / metro doorway opening below the vault (own edge or a coincident neighbour wall: passages.js draws the tunnel)',
  'embedded-sliver': 'a corner sliver <= 3 m of a wall hidden by an embedded neighbour (the neighbour in front draws the corner)',
  'below-raised': 'a raised part (room over an arch) over an OSM passage way / a ground body: the underside is the passage, nothing to close',
  'low-steps': 'records lower than 0.6 m (stair treads / kerbs mapped as buildings)',
  'custom-tower': 'hand-built towers (towers.js) draw their own walls',
  'landmark-owned': 'masses of landmark modules (occluders): their owner draws the wall',
};
// every arch / doorway opening of every edge as a world segment: a hidden duplicate wall behind a neighbour's arch has the same hole
const GC = 24, ggrid = new Map();
for (const [, rec] of net.rec) for (const ring of rec.rings) for (const e of ring.edges) {
  const openings = (e.gates || []).map(g => ({
    t0: g.s - g.w / 2, t1: g.s + g.w / 2, h0: GATE_SPRING + g.w / 2, h1: GATE_SPRING + g.w / 2,
  }));
  // Interior walls crossed by a mapped driveway follow its graded vault.
  openings.push(...e.pieces.filter(p => p.h0 != null));
  for (const {t0,t1,h0,h1} of openings) {
    const a = [e.a[0] + e.dx * t0, e.a[1] + e.dz * t0], b = [e.a[0] + e.dx * t1, e.a[1] + e.dz * t1];
    const f = {a,b,nx:e.nx,nz:e.nz,h0,h1};
    for (let x = Math.floor((Math.min(a[0],b[0])-.4)/GC); x <= Math.floor((Math.max(a[0],b[0])+.4)/GC); x++)
      for (let z = Math.floor((Math.min(a[1],b[1])-.4)/GC); z <= Math.floor((Math.max(a[1],b[1])+.4)/GC); z++) {
        const key = x + ',' + z;
        if (!ggrid.has(key)) ggrid.set(key, []);
        ggrid.get(key).push(f);
      }
  }
}
const gateNear = (x, z, h, nx, nz) => {
  const a = ggrid.get(Math.floor(x / GC) + ',' + Math.floor(z / GC)); if (!a) return false;
  for (const f of a) {
    if (f.nx * nx + f.nz * nz < 0.5) continue;
    const dx = f.b[0] - f.a[0], dz = f.b[1] - f.a[1], l2 = dx * dx + dz * dz, u = ((x - f.a[0]) * dx + (z - f.a[1]) * dz) / l2;
    if (u < -0.03 || u > 1.03 || h > f.h0 + u * (f.h1-f.h0) + .05) continue;
    const d = (x - f.a[0]) * f.nx + (z - f.a[1]) * f.nz;
    if (d > -0.4 && d < 0.4) return true;
  }
  return false;
};
const gateAt = (e, t, h) => (e.gates || []).some((g) => t > g.s - g.w / 2 - 0.05 && t < g.s + g.w / 2 + 0.05 && h < GATE_SPRING + g.w / 2 + 0.05);
for (const [id, rec] of net.rec) {
  const { b, st } = rec, y0 = Math.max(0, b.minH || 0);
  if (st.H < 0.6) { stats.lowSteps = (stats.lowSteps || 0) + 1; continue; }              // allow-list 'low-steps': records lower than 0.6 m (stair treads, kerbs mapped as buildings) are not masses
  const hs = [y0 + 0.4, y0 + st.H * 0.5, y0 + st.H - 0.4];
  for (const ring of rec.rings) for (const e of ring.edges) {
    if (!inNear(e.a[0] + e.dx * e.len / 2, e.a[1] + e.dz * e.len / 2)) continue;
    stats.edges++;
    const ns = Math.max(1, Math.ceil(e.len / STEP));
    for (let k = 0; k < ns; k++) {
      const t = e.len * (k + 0.5) / ns, wx = e.a[0] + e.dx * t, wz = e.a[1] + e.dz * t, px = wx + e.nx * OFF, pz = wz + e.nz * OFF;
      for (let hi = 0; hi < 3; hi++) {
        const h = hs[hi]; stats.samples++;
        if (massAt(px, pz, h, id, null)) continue;                         // interior face between two masses
        stats.exposed++;
        if (faceAt(wx, wz, h, e.nx, e.nz)) { stats.drawn++; continue; }
        if (gateAt(e, t, h) || gateNear(wx, wz, h, e.nx, e.nz)) { stats.allowed++; continue; }
        // a gap: classify
        const inner = massAt(wx - e.nx * 0.25, wz - e.nz * 0.25, h, id, null);     // another mass behind the wall (overlap)
        const overlapSame = inner ? (inner.y1 >= y0 + st.H) : false;
        const inPiece = e.pieces.some((p) => t >= p.t0 - 0.01 && t <= p.t1 + 0.01 && h - y0 >= p.yLow - 0.05);
        const cause = inPiece ? 'builder-dropped-piece' : inner ? (overlapSame ? 'analyse-hid-embedded-taller-or-equal' : 'analyse-hid-embedded-lower') : 'analyse-hid-no-inner-cover';
        let gapD = null; for (let d = 0.04; d <= 0.6; d += 0.02) { if (massAt(wx + e.nx * d, wz + e.nz * d, h, id, null)) { gapD = Math.round(d * 100) / 100; break; } }
        gaps.push({ gapD, id, kind: b.kind, ei: e.i, hole: ring.hole, t, h: Math.round(h * 10) / 10, hi, x: Math.round(wx * 10) / 10, z: Math.round(wz * 10) / 10, cause, inner: inner ? inner.id : null, innerKind: inner ? inner.kind : null, street: e.street ? e.street.name : null, len: e.len });
        stats.gaps++;
      }
    }
  }
}

// ---- merge gap samples into runs (same building edge + cause + height class, adjacent in t)
const runs = [];
const key = (g) => `${g.id}|${g.ei}|${g.hole}|${g.cause}|${g.hi}`;
gaps.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : a.t - b.t));
for (const g of gaps) {
  const last = runs[runs.length - 1];
  if (last && last.key === key(g) && g.t - last.t1 < STEP * 1.6) { last.t1 = g.t; last.n++; last.x1 = g.x; last.z1 = g.z; }
  else runs.push({ key: key(g), id: g.id, kind: g.kind, ei: g.ei, hole: g.hole, cause: g.cause, hi: g.hi, h: g.h, t0: g.t, t1: g.t, n: 1, x0: g.x, z0: g.z, x1: g.x, z1: g.z, inner: g.inner, street: g.street, len: g.len });
}
// ---- roof / floor / winding
const roofIssues = [], floorIssues = [], windIssues = []; let allowedFloor = 0;
const byId = new Map(list.map((r) => [r.b.id, r]));
const { deckPlan } = await imp(cityDir + 'roofs.js');
const { regionOf: regionOfRec } = await imp(cityDir + 'district.js').catch(() => ({ regionOf: () => null }));
const dupSkip = deckPlan ? deckPlan(OVERLAPS, new Set(byId.keys()), (id) => { const q = L.buildingById(id); return !!q && !!regionOfRec(q); }).skip
  : new Set(OVERLAPS.filter((o) => o.same && byId.has(o.a)).map((o) => o.b));                        // same rule as city.js (roofs.deckPlan); a ref older than deckPlan: the old rule
for (const r of list) {
  if (near && !inNear(r.b.cx, r.b.cz)) continue;
  // roof: a deck-less record needs a twin of the same footprint that keeps its deck (not itself deck-less)
  if (dupSkip.has(r.b.id) && !OVERLAPS.some((o) => o.same && ((o.b === r.b.id && byId.has(o.a) && !dupSkip.has(o.a)) || (o.a === r.b.id && byId.has(o.b) && !dupSkip.has(o.b))))) roofIssues.push({ id: r.b.id, why: 'deck-less without a twin that has a deck' });
  // winding: the outward normal of the first edge must point away from the ring interior
  const rec = net.rec.get(r.b.id);
  for (const ring of rec.rings) {
    const e = ring.edges.find((q) => q.len > 1); if (!e) continue;
    const mx = e.a[0] + e.dx * e.len / 2, mz = e.a[1] + e.dz * e.len / 2;
    const inside = ringHas(ring.pts, mx + e.nx * 0.05, mz + e.nz * 0.05);
    if (ring.hole ? !inside : inside) windIssues.push({ id: r.b.id, hole: ring.hole });
  }
  // floor: a raised record needs a body below it (drawn mass starting at <= 0.5 reaching its y0) or a passage / bridge under it
  const y0 = Math.max(0, r.b.minH || 0);
  if (y0 > 2.5 && (r.b.area || 0) > 6) {                                              // allow-list 'balcony-part': raised parts of <= 6 m2 are balconies / oriels (prep.js builds no body under them)
    let n = 0, bad = 0;
    for (const poly of r.b.polys) {
      const o = ringFromFlat(poly.o); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of o) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      const stp = Math.max(1.5, Math.sqrt((x1 - x0) * (z1 - z0) / 60));
      for (let x = x0 + stp / 2; x < x1; x += stp) for (let z = z0 + stp / 2; z < z1; z += stp) {
        if (!ringHas(o, x, z) || poly.h.some((h) => ringHas(ringFromFlat(h), x, z))) continue;
        n++;
        const m = massAt(x, z, y0 - 0.3, r.b.id, null);
        if (!m || m.y1 < y0 - 0.5) bad++;
      }
    }
    const sup = n && bad / n > 0.4 ? support(r.b) : null;
    if (sup && (sup.pass >= 0.4 || sup.cover >= 0.5)) allowedFloor++;                    // below-raised: a room over an OSM passage way / over a ground body (the metre sampling of both tests differs)
    else if (n && bad / n > 0.4 && r.b.kind !== 'bridge') floorIssues.push({ id: r.b.id, y0: Math.round(y0 * 10) / 10, share: Math.round(bad / n * 100) / 100, c: [r.b.cx, r.b.cz] });
  }
}

// ---- CLAIMS: no city output for anything a landmark module owns. A drawn record must not be claimed itself (id or parent), and must not stand inside the footprint of an owned (occluder) building:
// a raised part / part with a missing parent link / synthesised base ('~f') of a claimed house keeps drawing deck, railings and walls in the air (landmarksNewHolland roof terrace at (-3390,160)).
const claimIssues = [];
{
  const occ = occluders.filter((o) => !o.b._tiny).map((o) => ({ o, polys: o.b.polys.map((p) => ({ outer: ringFromFlat(p.o), holes: p.h.map(ringFromFlat).filter((h) => h.length >= 3) })) }));
  const inOcc = (x, z) => { for (const q of occ) for (const p of q.polys) if (ringHas(p.outer, x, z) && !p.holes.some((h) => ringHas(h, x, z))) return q.o; return null; };
  for (const r of list) {
    const b = r.b, base = String(b.id).replace(/~f$/, '');
    if (near && !inNear(b.cx, b.cz)) continue;
    if (L.isClaimed(base) || (b.parent && L.isClaimed(b.parent)) || (b._fillOf && L.isClaimed(b._fillOf))) { if (isOwned(owned, base) || (b.parent && isOwned(owned, b.parent))) claimIssues.push({ id: b.id, why: 'claimed and owned but still drawn' }); continue; }
    // centroid-ish samples of the first polygon
    const o = ringFromFlat(b.polys[0].o); let n = 0, hitN = 0, who = null;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of o) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
    const st = Math.max(0.8, Math.sqrt((x1 - x0) * (z1 - z0) / 30));
    for (let x = x0 + st / 2; x < x1; x += st) for (let z = z0 + st / 2; z < z1; z += st) { if (!ringHas(o, x, z)) continue; n++; const q = inOcc(x, z); if (q) { hitN++; who = q.b.id; } }
    if (n && hitN / n > 0.6) claimIssues.push({ id: b.id, why: 'inside the footprint of owned ' + who + ' (' + Math.round(hitN / n * 100) + ' %)', y0: b.minH || 0 });
  }
}
// ---- report
const byCause = {};
for (const g of gaps) byCause[g.cause] = (byCause[g.cause] || 0) + 1;
const runsByCause = {}; for (const r of runs) runsByCause[r.cause] = (runsByCause[r.cause] || 0) + 1;
const hist = {}; for (const g of gaps) { const k = g.gapD == null ? 'none<=0.6' : g.gapD <= 0.06 ? '<=0.06' : g.gapD <= 0.12 ? '<=0.12' : g.gapD <= 0.2 ? '<=0.2' : '<=0.6'; hist[k] = (hist[k] || 0) + 1; }
const gapLen = {}; for (const r of runs) gapLen[r.cause] = (gapLen[r.cause] || 0) + Math.max(0.6, r.t1 - r.t0 + 0.6);
// allow-listed: an embedded corner sliver (wall hidden by `ci` within 25 cm of a neighbour's boundary, <= 1 m long): the neighbour's own wall is the one in front
const slivers = runs.filter((r) => r.cause.startsWith('analyse-hid-embedded') && r.t1 - r.t0 + STEP <= 3.0);
const unexplained = runs.length - slivers.length;
if (!args.quiet) {
  console.log(`[wall-audit] records ${list.length} (owned groups ${owned.size}, occluders ${occluders.length}) edges ${stats.edges} samples ${stats.samples} exposed ${stats.exposed} drawn ${stats.drawn} allowed ${stats.allowed} GAP samples ${stats.gaps}`);
  console.log('[wall-audit] allowed reasons:', Object.keys(ALLOW).join(', '));
  console.log('[wall-audit] gap runs by cause:', JSON.stringify(runsByCause), ' metres of gap (samples x height class):', JSON.stringify(Object.fromEntries(Object.entries(gapLen).map(([k, v]) => [k, Math.round(v)]))));
  console.log('[wall-audit] distance to the covering mass behind the gap (samples):', JSON.stringify(hist));
  console.log(`[wall-audit] allow-listed embedded corner slivers (<= 3 m): ${slivers.length}`);
  console.log(`[wall-audit] raised parts over a passage / body (allowed below-raised): ${allowedFloor}`);
  console.log(`[wall-audit] roof issues ${roofIssues.length}, floor issues ${floorIssues.length}, winding issues ${windIssues.length}`);
  const top = runs.filter((r) => !slivers.includes(r)).sort((a, b) => (b.t1 - b.t0 + 0.6) - (a.t1 - a.t0 + 0.6)).slice(0, Number(args.list || 25));
  for (const r of top) console.log(`  GAP ${r.cause} ${r.id} ${r.kind} edge ${r.ei}${r.hole ? ' (hole)' : ''} h~${r.h} t ${r.t0.toFixed(1)}..${r.t1.toFixed(1)} of ${r.len.toFixed(1)} at (${r.x0},${r.z0})..(${r.x1},${r.z1}) behind=${r.inner || '-'} street=${r.street || '-'}`);
  for (const f of floorIssues.slice(0, 10)) console.log('  FLOOR', JSON.stringify(f));
  for (const f of roofIssues.slice(0, 10)) console.log('  ROOF', JSON.stringify(f));
  for (const f of windIssues.slice(0, 10)) console.log('  WINDING', JSON.stringify(f));
  console.log(`[wall-audit] claim issues (city output inside an owned landmark): ${claimIssues.length}`);
  for (const f of claimIssues.slice(0, 20)) console.log('  CLAIM', JSON.stringify(f));
}
if (args.json) fs.writeFileSync(path.resolve(root, args.json), JSON.stringify({ stats, runsByCause, runs, floorIssues, roofIssues, windIssues }, null, 1));
const maxU = Number(args['max-unexplained'] || 0);
const bad = unexplained + roofIssues.length + floorIssues.length + windIssues.length + claimIssues.length;
console.log(`[wall-audit] RESULT: ${bad <= maxU ? 'OK' : 'FAIL'} (unexplained gap runs ${unexplained}, roof ${roofIssues.length}, floor ${floorIssues.length}, winding ${windIssues.length}, claims ${claimIssues.length})`);
process.exit(bad <= maxU ? 0 : 1);
