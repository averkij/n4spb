// landmarksKirova/garden.js - the VASILEOSTROVETS GARDEN (сад «Василеостровец», OSM park w28473627, 4.7 ha, frame K): orchestrates fence.js (plinth wall, iron panels, round posts, colliders), gate.js (the south gate
// with its two pavilions), lawns.js (two long lawns with hedges, 20 ovoid thuja, two round flower beds), roerich.js (plaza + monument), furn.js (16 benches, park lamps) and draws here the smaller things of
// docs/research/kirova.md 10.2: the PLAYGROUND (w65623813, rubber surface #9a5a4a, a slide, two swings, a spring rider, a low green fence), the small COURT (w65623751, asphalt with white lines, no nets), the TOILET CABIN
// (w65623809, 4.0 x 3.5 m, pale yellow plaster, hipped grey roof, one door), the RUIN patch (building=ruins w1423396925: pale crushed stone with low rubble stumps) and the bare-earth clearing of the playground node
// n5153880821.  The park polygon itself, the alleys (OSM footways) and the generic trees stay with environment / streets (not claimed): the alleys are the gravel footways that streets draws; the trees of the
// garden are the generic park trees of environment (the lawns / beds / playground / court / ruin are claimed so that it plants nothing there).
import * as THREE from 'three';
import { FK, ringOf } from './frame.js';
import { GREEN, PITCHES } from '../data/city.js';
import { coverFn, fillPolyClipped } from './surfaces.js';
import { ringEdges, onEdge } from './kit.js';

const ringFlat = (id) => { const g = GREEN.find((q) => q.id === id) || PITCHES.find((q) => q.id === id); return g && g.polys && g.polys[0] ? g.polys[0].o : null; };
const toRing = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };

function playground(K) {
  const { ctx, P, M } = K, ph = ctx.physics, cover = coverFn(ctx);
  const o = ringFlat('w65623813'); if (!o) throw new Error('playground ring missing');
  const ring = toRing(o);
  fillPolyClipped(P, M.rubber, ring, 0.05, cover, { margin: 0.2, maxEdge: 4, tile: 2 });
  // low green fence round the area (0.9 m, posts every 3 m, a rail and pickets as a cut-out box): thin boxes
  const runs = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.5) continue;
    P.push(a[0], 0, a[1], Math.atan2(-dz, dx));
    P.box(M.fenceLow, 0, len, 0.05, 0.14, -0.03, 0.03, 'b', 1); P.box(M.fenceLow, 0, len, 0.82, 0.9, -0.03, 0.03, 'b', 1);
    for (let s = 0.1; s < len; s += 0.3) P.box(M.fenceLow, s, s + 0.035, 0.14, 0.84, -0.0175, 0.0175, '', 1);
    P.pop(); runs.push([[a[0], a[1], b[0], b[1]]]);
  }
  // equipment in the area (frame K): a slide, two swings, a spring rider
  FK.push(P);
  const loc = (r, q) => [r, -q];
  { const [x, z] = loc(181.5, 18);                                                                       // slide: a ladder platform 1.5 m and a chute
    P.push(x, 0, z, 0);
    for (const sx of [-0.45, 0.45]) { P.box(M.swing, sx - 0.04, sx + 0.04, 0, 1.5, -0.45, -0.37, '', 1); P.box(M.swing, sx - 0.04, sx + 0.04, 0, 1.5, 0.37, 0.45, '', 1); }
    P.box(M.slide, -0.5, 0.5, 1.45, 1.52, -0.45, 0.45, '', 1);
    P.quad(M.slide, [-0.4, 1.5, 0.45], [0.4, 1.5, 0.45], [0.4, 0.25, 2.6], [-0.4, 0.25, 2.6], [0, 1, 0.5]);
    for (const sx of [-0.42, 0.42]) P.quad(M.slide, [sx, 1.5, 0.45], [sx, 0.25, 2.6], [sx, 0.5, 2.6], [sx, 1.75, 0.45], [sx > 0 ? 1 : -1, 0, 0]);   // the side rails of the chute (review: the old quad was degenerate: a zero normal lit as a white glare with bloom)
    for (let i = 1; i <= 5; i++) P.box(M.swing, -0.4, 0.4, i * 0.27, i * 0.27 + 0.04, -0.7, -0.45, '', 1);   // ladder rungs
    P.pop(); }
  for (const [r, q] of [[193, 27], [196, 27]]) {                                                         // swings: an A-frame 2.3 m and two seats on chains
    const [x, z] = loc(r, q); P.push(x, 0, z, 0);
    for (const sx of [-1.2, 1.2]) { P.cyl(M.swing, [sx, 0, -0.6], [sx * 0.9, 2.3, 0], 0.045, 0.045, 6, false); P.cyl(M.swing, [sx, 0, 0.6], [sx * 0.9, 2.3, 0], 0.045, 0.045, 6, false); }
    P.cyl(M.swing, [-1.08, 2.3, 0], [1.08, 2.3, 0], 0.05, 0.05, 6, true);
    for (const sx of [-0.4, 0.4]) { P.box(M.lampBlack, sx - 0.02, sx - 0.01, 0.55, 2.3, 0, 0.01, '', 1); P.box(M.lampBlack, sx + 0.01, sx + 0.02, 0.55, 2.3, 0, 0.01, '', 1); P.box(M.slide, sx - 0.2, sx + 0.2, 0.5, 0.55, -0.1, 0.1, '', 1); }
    P.pop(); { const p = FK.W(r, q); ph.addBox(p.x, p.z, 2.6, 1.4, FK.rot, 0, 2.4); }
  }
  { const [x, z] = loc(184.5, 28.5);                                                                     // spring rider: a coil spring and a bird-like body
    P.push(x, 0, z, 0.6); P.cyl(M.lampBlack, [0, 0, 0], [0, 0.45, 0], 0.07, 0.07, 6, false); P.box(M.swing, -0.15, 0.15, 0.4, 0.75, -0.5, 0.5, '', 1); P.box(M.slide, -0.1, 0.1, 0.7, 1.0, 0.3, 0.5, '', 1); P.pop(); }
  P.pop();
  { const p = FK.W(181.5, 18 + 1.2); ph.addBox(p.x, p.z, 1.2, 4.0, FK.rot, 0, 1.6); }
  const pc = FK.W(188.3, 22.5); K.svc.crowd.push({ id: 'playground', kind: 'play', x: pc.x, z: pc.z, r: 9, n: 4 });
  return runs;
}

function court(K) {
  const { P, M, ctx } = K, cover = coverFn(ctx), o = ringFlat('w65623751'); if (!o) throw new Error('court ring missing');
  const ring = toRing(o);
  fillPolyClipped(P, M.court, ring, 0.05, cover, { margin: 0.2, maxEdge: 4, tile: 3 });
  // white lines: the rectangle of the play area (inset 0.6 m) and the centre line, drawn along the long axis of the ring in frame K
  const k = ring.map(([x, z]) => { const m = FK.M(x, z); return [m.a, m.b]; });
  const r0 = Math.min(...k.map((p) => p[0])) + 0.7, r1 = Math.max(...k.map((p) => p[0])) - 0.7, q0 = Math.min(...k.map((p) => p[1])) + 0.7, q1 = Math.max(...k.map((p) => p[1])) - 0.7;
  const line = (ra, qa, rb, qb) => { const a = FK.W(ra, qa), b = FK.W(rb, qb), dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz); P.push(a.x, 0.062, a.z, Math.atan2(-dz, dx)); P.quad(M.courtLine, [0, 0, -0.04], [len, 0, -0.04], [len, 0, 0.04], [0, 0, 0.04], [0, 1, 0]); P.pop(); };
  line(r0, q0, r1, q0); line(r1, q0, r1, q1); line(r1, q1, r0, q1); line(r0, q1, r0, q0); line((r0 + r1) / 2, q0, (r0 + r1) / 2, q1);
}

/** the toilet cabin: a 4.0 x 3.5 m box with pale yellow plaster, a hipped grey roof and one door (drawn from the baked ring of w65623809) */
function toilet(K) {
  const { ctx, P, M } = K, o = ringOf('w65623809'); if (!o) throw new Error('toilet ring missing');
  const poly = { o: Array.from(o), h: [] }, edges = ringEdges(poly), h = 2.7;
  let big = null; for (const e of edges) if (!big || e.len > big.len) big = e;
  for (const e of edges) onEdge(P, e, (len) => { P.quad(M.toilet, [0, 0, 0], [len, 0, 0], [len, h, 0], [0, h, 0], [0, 0, 1], [[0, 0], [len / 2, 0], [len / 2, h / 2], [0, h / 2]]); P.box(M.eCap, -0.05, len + 0.05, h - 0.1, h + 0.05, 0, 0.08, 'k', 1); });
  const ring = toRing(o), cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const roof = ring.map(([x, z]) => [cx + (x - cx) * 1.1, cz + (z - cz) * 1.1]);
  // hipped roof: every edge of the enlarged ring rises to a ridge point above the centre
  for (let i = 0; i < roof.length; i++) { const a = roof[i], b = roof[(i + 1) % roof.length]; P.fan(M.toiletRoof, [[a[0], h, a[1]], [b[0], h, b[1]], [cx, h + 0.9, cz]], [0, 1, 0], (p) => [p[0], p[2]]); }
  onEdge(P, big, (len) => { P.box(M.eDoorFrame, len * 0.5 - 0.5, len * 0.5 + 0.5, 0, 2.1, 0, 0.05, 'k', 1); });
  addPolyCollidersLocal(ctx, poly);
}
function addPolyCollidersLocal(ctx, poly) {
  const ph = ctx.physics, edges = ringEdges(poly);
  for (const e of edges) { const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1], l = Math.hypot(dx, dz); if (l < 0.2) continue; ph.addBox((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2, l, 0.3, Math.atan2(-dz, dx), 0, 3); }
}

/** the ruin: a pale crushed-stone patch (decal) with rubble stumps along the edges (building=ruins w1423396925) */
function ruin(K) {
  const { ctx, P, M } = K, cover = coverFn(ctx), o = ringOf('w1423396925'); if (!o) throw new Error('ruin ring missing');
  const ring = toRing(Array.from(o)); fillPolyClipped(P, M.rubble, ring, 0.052, cover, { margin: 0.2, maxEdge: 4, tile: 3 });
  const rng = ctx.rng(4417);
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.floor(len / 2.2));
    for (let k = 0; k < n; k++) { const t = (k + 0.5 + (rng() - 0.5) * 0.4) / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, w = 0.5 + rng() * 0.6, hh = 0.15 + rng() * 0.3; P.push(x, 0, z, rng() * 3.1); P.box(M.stump, -w / 2, w / 2, 0, hh, -0.2, 0.2, 'b', 0.5); P.pop(); }
  }
  K.svc.ruins = [{ id: 'w1423396925', x: FK.W(186.9, 51.5).x, z: FK.W(186.9, 51.5).z }];
}

function earth(K) {                                                                                       // the bare-earth clearing of the OSM playground node n5153880821 (K (218, 146), ~10 x 8 m)
  const { ctx, P, M } = K, cover = coverFn(ctx), ring = [[213, 142], [223, 142], [223, 150], [213, 150]].map(([r, q]) => { const p = FK.W(r, q); return [p.x, p.z]; });
  fillPolyClipped(P, M.dirt, ring, 0.05, cover, { margin: 0.2, maxEdge: 4, tile: 3 });
}

export async function build(K) {
  const errs = [], stage = async (name, fn) => { try { return await fn(); } catch (e) { console.error(`[landmarksKirova] garden/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  for (const f of ['fence', 'gate', 'lawns', 'roerich', 'furn', 'gardentrees']) await stage(f, async () => (await import(`./${f}.js`)).build(K));
  await stage('playground', () => playground(K)); await stage('court', () => court(K)); await stage('toilet', () => toilet(K)); await stage('ruin', () => ruin(K)); await stage('earth', () => earth(K));
  const sv = K.svc, c = FK.W(191, -71);
  sv.entrances.push({ id: 'garden-north', x: FK.W(188.7, 196.9).x, z: FK.W(188.7, 196.9).z, rotY: FK.rot, closed: false, name: 'Сад «Василеостровец» (Средний пр.)' });
  void THREE; void c;
  if (errs.length) throw new Error(errs.join('\n'));
}
