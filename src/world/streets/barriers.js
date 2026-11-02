// streets/barriers.js - the kerb barriers of the centre (docs/research/streets.md summary 3, nevsky.md section 7, photos P03 P25 P49 P67 P70-72):
//   * CHAIN BOLLARDS along the Nevsky kerbs: black cast iron post 0.85 m (flared base, collar, ball finial) every 2.6 m, a black chain sagging 0.22 m between neighbours;
//     interrupted at crossings, bus stops and junction mouths (walks.js decides where). Instanced (posts and chain spans), colliders on the posts.
//   * GUARD RAILS along Ligovsky and around Vosstaniya Square: black cast-iron panels 2.5 m x 1.0 m (top rail, pickets, bottom rail, posts) with a hanging flower box of pink
//     petunias on the street side. Each panel breaks off with its pickets and flower box, opening its own collider gap (12 km/h anchor).
// KNOCKABLE (core/knock.js, docs/DRIVING-COLLISIONS.md): the bollard posts break off at the foot; the chain spans are single light bodies of their own (one thin collider per SPAN, not the merged boxes of the rails:
//   a car meeting the chain between two posts pushes it down and drives on) and fall with their post (the onKnock of a post takes the one or two spans that hang on it). Without ctx.knock (headless tools)
//   the spans are one static mesh again; the colliders are per span in both cases.
// A block has chains OR rails, never both. Returns { guardRails: [{id, pts}], stats }.
// SOLID (2026-10-07, "people walk through the fences"): panels and chain spans have individual thin colliders (addFenceBoxes, flagged `fence`), so the player
//   and, through people/nav.js (obstacles -> segBlocked / pushOut), every pedestrian is stopped by them; before, only the bollard posts were solid and the whole railing was open. The runs end where
//   the pavement has its openings (walks.js: crossings, bus stops, junction mouths). Two further rules live here: (1) a panel is cut to the stretch that no placed panel covers (the old "drop the panel
//   whose middle is near another's" test punched holes of up to 1.1 m into the rails: the middle of the short last panel of a run was computed as 1.25 m from its start), (2) a run longer than
//   GATE_EVERY gets a GATE_W wide gate every GATE_EVERY m (splitAtGates; a chain run leaves one span out): the long rails of the square and of Ligovsky would otherwise wall the player in for
//   60-100 m (measured: the walk from the start pose to the red car 38 -> 80 m, to the station doors 57 -> 108 m; with the gates 41 / 58 m). A/B switch: ?fences=off.
import * as THREE from 'three';
import { VB } from './vb.js';
import { PointGrid } from './util.js';
import { INST_STATS } from './furn.js';
import { knockInstances } from '../lib/knock-inst.js';
import { WALK_Y } from './surface.js';

const IRON = '#1c1e1d', IRON_L = '#2d3031';
const FENCES_OFF = !!globalThis.__fenceOff || (typeof location !== 'undefined' && new URLSearchParams(location.search).get('fences') === 'off');          // A/B switch (?fences=off, tools/people-fence-test.mjs --fenceoff): no colliders on the rails / chains
const SOLID_CHAINS = true;                     // the chain spans get thin colliders too (the bollard posts alone leave 2.4 m gaps between them)
const SPAN_PULL_KMH = 8;                       // the speed at which a falling post drags the chain spans next to it (a gentle throw: they drop and tumble a little)
const GATE_EVERY = 40, GATE_W = 2.6;           // a rail run longer than 40 m gets ceil(len / 40) - 1 gates of 2.6 m (an opening of one panel), evenly spaced

/** the pieces of a rail run (polyline of [x, z]) that are left when its gates are cut out: [[x, z] ...] per piece; a run of up to `every` metres stays whole, a piece shorter than 1.2 m is dropped */
export function splitAtGates(pts, every, gate) {
  const seg = []; let total = 0;
  for (let i = 0; i + 1 < pts.length; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(l); total += l; }
  const n = total > every ? Math.ceil(total / every) - 1 : 0; if (!n) return [pts];
  const at = (s) => { let acc = 0; for (let i = 0; i < seg.length; i++) { if (s <= acc + seg[i] || i === seg.length - 1) { const t = seg[i] ? Math.min(1, Math.max(0, (s - acc) / seg[i])) : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]; } acc += seg[i]; } return pts[pts.length - 1]; };
  const bounds = [0]; for (let k = 1; k <= n; k++) { const s = total * k / (n + 1); bounds.push(s - gate / 2, s + gate / 2); } bounds.push(total);
  const out = [];
  for (let b = 0; b < bounds.length; b += 2) {
    const s0 = bounds[b], s1 = bounds[b + 1]; if (s1 - s0 < 1.2) continue;
    const piece = [at(s0)]; let acc = 0;
    for (let i = 0; i < seg.length; i++) { acc += seg[i]; if (acc > s0 + 1e-6 && acc < s1 - 1e-6) piece.push(pts[i + 1]); }
    piece.push(at(s1)); out.push(piece);
  }
  return out;
}

function bollardModel() {
  const V = new VB();
  V.cyl(0.1, 0.15, 0.68, IRON, [0, 0.34, 0], null, 5, null, true);  // flared post (open: 10 triangles)
  V.ball(0.1, IRON_L, [0, 0.78, 0], null, 'oct');                   // ball finial (octahedron, 8 triangles)
  return V.build();
}

/** a chain span of unit length along +Z hanging between two eyes at y = 0.66, sagging 0.22 m (scaled along Z to the real distance) */
function chainModel() {
  const V = new VB(), n = 3, y0 = 0.66, sag = 0.22;
  const at = (u) => [0, y0 - sag * 4 * u * (1 - u), u];
  for (let i = 0; i < n; i++) V.rod(at(i / n), at((i + 1) / n), 0.016, IRON, 3, true);
  return V.build();
}

/** one 2.5 m guard-rail panel along +Z: posts at both ends, top rail 1.0 m, bottom rail, finials (the pickets are an alpha-cut plane, see picketTex); the flower box hangs on the +X side */
function railModel() {
  const V = new VB(), F = new VB(), len = 2.5;
  V.box(0.07, 1.05, 0.07, IRON, [0, 0.525, 0]); V.box(0.07, 1.05, 0.07, IRON, [0, 0.525, len]);
  V.box(0.05, 0.05, len, IRON, [0, 1.0, len / 2]); V.box(0.04, 0.04, len, IRON, [0, 0.16, len / 2]);
  // flower box (street side, +X): dark green trough with a dome of petunias
  F.box(0.24, 0.2, 0.96, '#33463a', [0.22, 0.87, len / 2]);
  F.ball(0.3, '#e0457b', [0.2, 1.0, len / 2], [0.8, 0.6, 2.4], 'oct');
  const pk = new THREE.PlaneGeometry(len, 0.84); pk.rotateY(Math.PI / 2); pk.translate(0, 0.58, len / 2);
  return { iron: V.build(), box: F.build(), pickets: pk, len };
}

export function buildBarriers(ctx, net, walks, poles, root, lamps = []) {
  const out = { guardRails: [], stats: { posts: 0, chains: 0, rails: 0 } };
  const mVC = ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0.02, name: 'pt-barrier' });
  // ---- chain bollards
  const post = bollardModel();
  // a lamp pedestal replaces the bollard nearest to it: posts closer than 0.8 m to a lamp are dropped, the chain then runs to the pedestal
  const lampGrid = new PointGrid(4); for (const l of lamps) if (l.kind === 'A') lampGrid.add(l.x, l.z, l);           // (every post asked every lamp)
  const lampAt = (x, z) => lampGrid.first(x, z, 0.85);
  const RING8 = Array.from({ length: 8 }, (_, k) => [Math.cos(k * Math.PI / 4) * 0.13, Math.sin(k * Math.PI / 4) * 0.13]);
  const onRoad = (x, z) => net.cover(x, z, {}) > 0.05 || RING8.some(([dx, dz]) => net.cover(x + dx, z + dz, {}) > 0.05);       // road clearance rule: no post (nor a chain to it) on the asphalt: the footprint (post radius 0.11) counts, not only the centre (a fillet corner)
  const posts = walks.chainPosts.filter((p) => !lampAt(p.x, p.z) && !onRoad(p.x, p.z));
  const postSpots = posts.map((p) => ({ x: p.x, y: WALK_Y, z: p.z, rotY: p.rotY }));
  const postItems = posts.map((p) => ctx.physics.addCylinder(p.x, p.z, 0.11, 0, 0.85));
  const spansAt = new Map(), chainRecs = [];                       // 'x,z' of a post -> the indices (in `ch`) of the spans that end on it; chainRecs[i] = the knock record of span i (filled below, read by the post onKnock)
  const pkey = (x, z) => x + ',' + z;
  // a knocked post pulls down the chain spans that hang on it (103: "a knocked post takes the wire colliders next to it"): each is thrown gently along the fall of the post
  const dropSpans = (rec, body) => {
    if (!ctx.knock) return;
    for (const si of spansAt.get(pkey(rec.x, rec.z)) || []) {
      const sr = chainRecs[si]; if (!sr || sr.state !== 'stand') continue;
      const nx = Math.sin(sr.rotY), nz = Math.cos(sr.rotY), side = nx * body.dx + nz * body.dz < 0 ? -1 : 1;       // (across the span, to the side the post falls: a span topples about its own length and lies flat, never on its end)
      ctx.knock.hit(sr.x, sr.z, SPAN_PULL_KMH, nx * side, nz * side, 'chain');            // (the span's own centre is the nearest standing chain to itself)
    }
  };
  // knockable (core/knock.js): cast iron, anchored: holds a bump, breaks off at the foot above 30 km/h (103: streets/bollards.js); without ctx.knock it is the one static mesh of before
  knockInstances(ctx, { name: 'pt-chain-posts', parts: [{ geo: post, mat: mVC }], spots: postSpots, items: postItems, far: 240,
    rec: (spot) => ({ kind: 'bollard', mass: 60, h: 0.85, r: 0.11, anchored: 30, hitK: 0.4, metal: true, onKnock: dropSpans }) });
  if (postSpots.length) INST_STATS['pt-chain-posts'] = { n: postSpots.length, tris: Math.round((post.index ? post.index.count : post.attributes.position.count) / 3 * postSpots.length) };
  const chain = chainModel(), ch = [], chainRuns0 = [];
  for (let [x0, z0, x1, z1] of walks.chains) {
    if (onRoad(x0, z0) || onRoad(x1, z1)) continue;
    const o0 = pkey(x0, z0), o1 = pkey(x1, z1), l0 = lampAt(x0, z0), l1 = lampAt(x1, z1);
    if (l0) { x0 = l0.x; z0 = l0.z; } if (l1) { x1 = l1.x; z1 = l1.z; }
    const dx = x1 - x0, dz = z1 - z0, d = Math.hypot(dx, dz) || 1; if (d < 0.5) continue;
    const last = chainRuns0.length ? chainRuns0[chainRuns0.length - 1] : null;        // (the spans of one kerb come in order: a span that starts where the previous one ends continues its run)
    const seg = [x0, z0, x1, z1]; seg.posts = [o0, o1];
    if (last && last.length && Math.hypot(last[last.length - 1][2] - x0, last[last.length - 1][3] - z0) < 0.05) last.push(seg); else chainRuns0.push([seg]);
  }
  // a gate every GATE_EVERY m of a run, like the rails: the span nearest to the even spacing is left out (its two bollards stay as the gate posts: 2.4 m clear), the run is cut there
  let chainGates = 0;
  for (const run of chainRuns0) {
    const len = run.map((s) => Math.hypot(s[2] - s[0], s[3] - s[1])), total = len.reduce((p, q) => p + q, 0), n = total > GATE_EVERY ? Math.ceil(total / GATE_EVERY) - 1 : 0, gate = new Set();
    for (let k = 1; k <= n; k++) { const target = total * k / (n + 1); let acc = 0, best = -1, bd = 1e9; run.forEach((s, i) => { const d = Math.abs(acc + len[i] / 2 - target); if (d < bd && !gate.has(i)) { bd = d; best = i; } acc += len[i]; }); if (best >= 0) gate.add(best); }
    run.forEach((s, i) => {
      if (gate.has(i)) { chainGates++; return; }
      const dx = s[2] - s[0], dz = s[3] - s[1];
      ch.push({ x: s[0], y: WALK_Y, z: s[1], x1: s[2], z1: s[3], rotY: Math.atan2(dx, dz), sz: len[i], posts: s.posts });
    });
  }
  // solid, per SPAN: a thin `fence` box each (people/nav.js reads them as walls: nobody steps through the chain between two bollards; the runs end at the crossings), the handle kept for the knock record
  // The span ends are a hand's breadth beyond the posts; a junction fillet may shorten a box or leave a span without one.
  const clearOfRoad = (x, z) => net.cover(x, z, {}) < -0.1;                         // (net.cover: > 0 on the asphalt incl. parking pockets and junction fillets)
  const tFence = (typeof performance !== 'undefined' ? performance : Date).now();
  const spanBox = new Array(ch.length).fill(null);
  out.stats.chainBoxes = SOLID_CHAINS && !FENCES_OFF ? addFenceBoxes(ctx, ch.map((c) => [[c.x, c.z, c.x1, c.z1]]), 0.12, 0.8, clearOfRoad, (box, i) => { spanBox[i] = box; }) : 0;
  ch.forEach((c, i) => { for (const k of c.posts) { let l = spansAt.get(k); if (!l) spansAt.set(k, (l = [])); l.push(i); } });
  // the chain links: knockable, one light body per span (any touch of a moving car knocks it: it topples and lies on the pavement); the instance origin is the span start
  // (the geometry runs 1 m along +Z, scaled to the span), the record sits at the middle of the span with the collider's turn. `anchored: 0.5` (km/h: any moving car) selects the TOPPLE body of core/knock.js, not a
  // post: a free body tumbles about a pivot 0.4 m up and rests on a quarter turn, i.e. the chain would hang unchanged, float 0.4 m over the pavement or sink into it; the topple always ends flat on the ground,
  // the chain 0.5 m beside where it hung (r 0.02: the strand lies on its thickness)
  knockInstances(ctx, { name: 'pt-chain-links', far: 240,
    parts: [{ geo: chain, mat: mVC, shadow: false, place: (c) => new THREE.Matrix4().compose(new THREE.Vector3(c.x, c.y, c.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), c.rotY), new THREE.Vector3(1, 1, c.sz)) }],
    spots: ch, items: (i) => spanBox[i],
    rec: (c) => {
      const l = Math.hypot(c.x1 - c.x, c.z1 - c.z) || 1;
      return { kind: 'chain', x: (c.x + c.x1) / 2, z: (c.z + c.z1) / 2, rotY: Math.atan2(-(c.z1 - c.z) / l, (c.x1 - c.x) / l), mass: 6, h: 0.5, r: 0.02, w: l + 0.1, d: 0.12, anchored: 0.5, hitK: 0.05, minDv: 0 };
    } }).records.forEach((r, i) => { chainRecs[i] = r; });
  if (ch.length) INST_STATS['pt-chain-links'] = { n: ch.length, tris: Math.round((chain.index ? chain.index.count : chain.attributes.position.count) / 3 * ch.length) };
  out.stats.posts = posts.length; out.stats.chains = ch.length; out.stats.chainGates = chainGates;
  // ---- guard rails: panels along every run
  const rail = railModel(), pan = [];
  // the segments of the placed panels by 4 m cell (the neighbour test of the runs that share a kerb line)
  const placed = new Map(), PC = 4;
  const eachCell = (x0, z0, x1, z1, fn) => { for (let a = Math.floor((Math.min(x0, x1) - 0.7) / PC); a <= Math.floor((Math.max(x0, x1) + 0.7) / PC); a++) for (let b = Math.floor((Math.min(z0, z1) - 0.7) / PC); b <= Math.floor((Math.max(z0, z1) + 0.7) / PC); b++) fn(a * 8192 + b); };
  const markPlaced = (x0, z0, x1, z1) => { const s = [x0, z0, x1, z1]; eachCell(x0, z0, x1, z1, (k) => { let l = placed.get(k); if (!l) placed.set(k, (l = [])); l.push(s); }); };
  /** the stretches [u0, u1] (m along the candidate panel A + u * (dx, dz), u in [0, l]) that no placed panel covers: a placed panel covers where it is nearly parallel (< 10 deg) and both its ends are within 0.6 m
   *  of the candidate's line; stretches shorter than 0.3 m are not drawn (the end posts overlap them) */
  const uncovered = (ax, az, dx, dz, l) => {
    const cov = [], seen = new Set();
    eachCell(ax, az, ax + dx * l, az + dz * l, (k) => {
      for (const s of placed.get(k) || []) {
        if (seen.has(s)) continue; seen.add(s);
        const sx = s[2] - s[0], sz = s[3] - s[1], sl = Math.hypot(sx, sz); if (sl < 1e-6 || Math.abs((sx * dz - sz * dx) / sl) > 0.17) continue;
        if (Math.abs((s[0] - ax) * dz - (s[1] - az) * dx) > 0.6 || Math.abs((s[2] - ax) * dz - (s[3] - az) * dx) > 0.6) continue;
        let t0 = (s[0] - ax) * dx + (s[1] - az) * dz, t1 = (s[2] - ax) * dx + (s[3] - az) * dz; if (t0 > t1) { const q = t0; t0 = t1; t1 = q; }
        t0 = Math.max(0, t0); t1 = Math.min(l, t1); if (t1 - t0 > 0.02) cov.push([t0, t1]);
      }
    });
    cov.sort((p, q) => p[0] - q[0]);
    const out = []; let t = 0;
    for (const [a, b] of cov) { if (a - t > 0.3) out.push([t, a]); if (b > t) t = b; }
    if (l - t > 0.3) out.push([t, l]);
    return out;
  };
  const railRuns = [];                                                  // the runs of walks.js with their gates cut out (a piece keeps the id of its run + 'g<k>')
  walks.rails.forEach((r, idx) => splitAtGates(r.pts, GATE_EVERY, GATE_W).forEach((pts, k) => railRuns.push({ r, pts, id: 'rail' + idx + (k ? 'g' + k : '') })));
  out.stats.gates = railRuns.length - walks.rails.length;
  railRuns.forEach(({ r, pts, id }) => {
    out.guardRails.push({ id, pts });
    // the street side of a run on side `r.side` of a way: the road is on the -normal side; the flower box hangs toward the road
    for (let i = 0; i + 1 < pts.length; i++) {
      let [ax, az] = pts[i]; const [bx, bz] = pts[i + 1]; let dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz); if (len < 0.3) continue;
      dx /= len; dz /= len;
      let left = len;
      while (left > 0.2) {
        const l = Math.min(rail.len, left), rotY = Math.atan2(dx, dz);
        // local +X = (cos rotY, -sin rotY) -> flip the model so the +X side faces the road
        const roadSide = r.side === 'R' ? -1 : 1;                           // the polyline offset sits on the outward side; the road is behind it (toward the way axis)
        const rx = Math.cos(rotY), rz = -Math.sin(rotY);
        // the outward normal of the run is (dz, -dx) for right-side runs ... pick the sign whose +X points to the road
        const nx = (r.side === 'R' ? -dz : dz), nz = (r.side === 'R' ? dx : -dx);
        void roadSide;
        const toRoad = -(rx * nx + rz * nz) >= 0;
        // runs of neighbouring ways can lie on the same kerb line (coplanar duplicates flicker): only the part of the panel that no placed panel covers is drawn. (The old test dropped a WHOLE panel
        // whose middle lay within 1.1 m of another one, and computed that middle as 1.25 m from the start for every length: the short last panel of a run was dropped as a "duplicate" of its own
        // neighbour and the rail had a hole of up to 1.1 m, which people and the collider below then used as a gate.)
        for (const [u0, u1] of uncovered(ax, az, dx, dz, l)) {
          const sx = ax + dx * u0, sz0 = az + dz * u0, ex = ax + dx * u1, ez = az + dz * u1;
          const it = { x: toRoad ? sx : ex, y: WALK_Y, z: toRoad ? sz0 : ez, rotY: toRoad ? rotY : rotY + Math.PI, sz: (u1 - u0) / rail.len };
          pan.push(it); markPlaced(sx, sz0, ex, ez);
        }
        ax += dx * l; az += dz * l; left -= l;
      }
    }
    for (const [x, z] of pts.filter((_, i) => i % 3 === 0)) void x, z;
  });
  const picketTex = ctx.tex.draw(256, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff';
    for (let i = 0; i < 17; i++) { const x = (i + 0.5) / 17 * w; g.fillRect(x - 1.4, 0, 2.8, h); g.beginPath(); g.moveTo(x - 3.2, 4); g.lineTo(x, 0); g.lineTo(x + 3.2, 4); g.fill(); }
    g.fillRect(0, h * 0.28, w, 3);
  }, { key: 'pt-pickets' });
  const mPick = ctx.mat.toon(IRON, { map: picketTex, alphaTest: 0.5, side: 'double', name: 'pt-pickets' });
  // One body and collider per visible panel: an impact carries the iron,
  // pickets and flower box together and opens only that panel's gap.
  const panelItems = new Array(pan.length).fill(null);
  const panelRuns = pan.map(p => [[p.x, p.z, p.x + Math.sin(p.rotY) * rail.len * p.sz, p.z + Math.cos(p.rotY) * rail.len * p.sz]]);
  out.stats.railBoxes = FENCES_OFF ? 0 : addFenceBoxes(ctx, panelRuns, 0.12, 1.1, clearOfRoad, (box, i) => { panelItems[i] = box; });
  const placePanel = p => new THREE.Matrix4().compose(new THREE.Vector3(p.x, p.y, p.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rotY), new THREE.Vector3(1, 1, p.sz));
  const panels = knockInstances(ctx, { name: 'pt-guard-rails', spots: pan, items: panelItems, far: 360,
    parts: [
      { geo: rail.pickets, mat: mPick, name: 'pickets', shadow: false, noOutline: true, place: placePanel },
      { geo: rail.iron, mat: mVC, name: 'iron', place: placePanel },
      { geo: rail.box, mat: mVC, name: 'flowers', shadow: false, place: placePanel },
    ],
    rec: p => ({ kind: 'fence', x: p.x + Math.sin(p.rotY) * rail.len * p.sz / 2, z: p.z + Math.cos(p.rotY) * rail.len * p.sz / 2,
      rotY: p.rotY - Math.PI / 2, mass: 45, h: 1.1, w: rail.len * p.sz + 0.1, d: 0.3, r: 0.15, anchored: 12, hitK: 0.2, metal: true }),
  });
  out.stats.knockRails = panels.records.filter(Boolean).length;
  out.stats.rails = pan.length;
  out.stats.fenceMs = Math.round((typeof performance !== 'undefined' ? performance : Date).now() - tFence);
  return out;
}

/** thin solid boxes along fence runs: the panel segments of a run ([[ax, az, bx, bz] ...] in order) are merged while they stay collinear (every joint within 4 cm of the chord, chord <= 14 m) into ONE box each
 *  (a box per 2.5 m panel would put ~1000 solids into the collision grid and the pedestrian obstacle set); the box is `thick` m thick, 0 .. y1 high, flagged `fence` for people/nav.js. Returns the box count. `onBox(box, runIndex)` gets every box made (the chain spans pass one single-segment run each and keep the handle of their box). */
export function addFenceBoxes(ctx, runs, thick, y1, clear = null, onBox = null) {
  let n = 0, run = 0;
  const emit = (pts) => {
    const a = pts[0], b = pts[pts.length - 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.2) return;
    const ux = dx / len, uz = dz / len, nx = -uz, nz = ux, h = thick / 2;
    let s0 = -0.05, s1 = len + 0.05;                                                    // (a hand's breadth beyond both end posts closes the joint between two runs)
    // road clearance rule (docs/AGENT-BRIEF.md): the footprint keeps off the asphalt, fillets included: a box end that would reach into a junction corner is shortened (the panel end post is a few cm beyond)
    if (clear) {                                                                        // the longest stretch whose two long edges stay clear (a junction fillet may nick the middle of a stub, not only its ends)
      const cnt = Math.max(1, Math.ceil((s1 - s0) / 0.08)), okAt = (s) => clear(a[0] + ux * s + nx * h, a[1] + uz * s + nz * h) && clear(a[0] + ux * s - nx * h, a[1] + uz * s - nz * h);
      let best0 = 0, best1 = -1, run0 = -1;
      for (let i = 0; i <= cnt + 1; i++) { const good = i <= cnt && okAt(s0 + (s1 - s0) * i / cnt); if (good && run0 < 0) run0 = i; if (!good && run0 >= 0) { if (i - 1 - run0 > best1 - best0) { best0 = run0; best1 = i - 1; } run0 = -1; } }
      if (best1 < 0) return;
      const t0 = s0 + (s1 - s0) * best0 / cnt, t1 = s0 + (s1 - s0) * best1 / cnt; s0 = t0; s1 = t1;
      if (s1 - s0 < 0.4) return;
    }
    const m = (s0 + s1) / 2, box = ctx.physics.addBox(a[0] + ux * m, a[1] + uz * m, s1 - s0, thick, Math.atan2(-uz, ux), 0, y1); box.fence = true; n++;
    if (onBox) onBox(box, run);
  };
  for (run = 0; run < runs.length; run++) {
    const segs = runs[run]; let cur = null;
    for (const s of segs) {
      if (cur && Math.hypot(s[0] - cur[cur.length - 1][0], s[1] - cur[cur.length - 1][1]) < 0.05) {
        const a = cur[0], dx = s[2] - a[0], dz = s[3] - a[1], len = Math.hypot(dx, dz) || 1;
        if (len <= 14 && cur.every((p) => Math.abs((p[0] - a[0]) * dz - (p[1] - a[1]) * dx) / len < 0.04)) { cur.push([s[2], s[3]]); continue; }
      }
      if (cur) emit(cur);
      cur = [[s[0], s[1]], [s[2], s[3]]];
    }
    if (cur) emit(cur);
  }
  return n;
}
