// landmarksKirova/fence.js - the FENCE of the Vasileostrovets garden (docs/research/kirova.md 10.1, photos gd03 gd09; critic-measured): along the whole ring of the park (OSM way w28473627, 109 x 440 m)
//   a 0.45 m cream stucco PLINTH WALL with a pale cap, black iron PANELS 2.0 m high (vertical bars with spear heads, two rails: one alpha cut-out quad per span) between ROUND TUSCAN-STYLE POSTS
//   (a 0.6 m square plinth, a base ring, a shaft D 0.45 m, an echinus and a square abacus: 2.9 m high) every ~4.6 m.  The runs are interrupted at the gates (GATES, in frame K): the main south gate
//   is built by gate.js (this file leaves the 10.4 m between the axes of its two pavilions open); the pedestrian gates are plain 2.4 - 3.0 m openings with a post on each side.
//   Colliders: one thin box per span, a knock bay (lib/fence-bays.js; the source used streets/barriers.js addFenceBoxes: plain solid boxes); the gate openings stay open.  Nothing is drawn on the asphalt (cover test).
// Frame K (frame.js FK): r ENE, q NNW; the fence stands on the ring line.  Published: svc.fences = [{ id, pts (world), gates: [{ x, z, w }] }].
import { FK } from './frame.js';
import { coverFn } from './surfaces.js';
import { unitBox, unitPanel } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7, 15.v): every span of the garden fence is a breakable bay (collider + drawing + knock record)
import { kBays } from './inst.js';

/** the ring of the park in frame K (r, q), dossier 10.1 (the baked way w28473627) */
export const RING_K = [[136.2, 197.1], [188.7, 196.9], [245.3, 197.9], [244.2, 26.4], [243.9, -135.9], [235.3, -135.6], [235.0, -151.3], [242.9, -151.5], [242.9, -157.5], [245.7, -157.9], [245.2, -244.0], [196.5, -242.2], [136.9, -242.2]];
/** gate openings: centre (r, q) and width; the main south gate (r 186.1 .. 196.5 at q -242.2, the axes of its two pavilions) is the opening of gate.js */
export const GATES = [
  { id: 'north', at: [188.7, 196.9], w: 3.0 }, { id: 'west1', at: [136.6, -63.8], w: 3.0 }, { id: 'west2', at: [136.5, -46.1], w: 3.0 },
  { id: 'east1', at: [244.2, 26.4], w: 3.0 }, { id: 'east2', at: [242.9, -155.7], w: 2.6 }, { id: 'south', at: [191.3, -242.2], w: 10.4 },
];

export const POST_H = 2.9, PLINTH_H = 0.45, PANEL_H = 2.0;
/** the two gate pavilions of the main south gate (frame K): the fence ends inside them */
export const PAV_K = [[186.1, -242.2], [196.5, -242.2]];

function postGeo(P, M, x, z, R = 1, Ry = R) {
  const s = R, t = Ry;
  P.box(M.cream, x - 0.3 * s, x + 0.3 * s, 0, 0.6 * t, z - 0.3 * s, z + 0.3 * s, 'b', 1);                                // square plinth
  P.cyl(M.cream, [x, 0.6 * t, z], [x, 0.7 * t, z], 0.29 * s, 0.29 * s, 8, false);                                         // base ring
  P.cyl(M.cream, [x, 0.7 * t, z], [x, 2.62 * t, z], 0.225 * s, 0.2 * s, 8, false);                                        // shaft
  P.cyl(M.cream, [x, 2.62 * t, z], [x, 2.78 * t, z], 0.2 * s, 0.31 * s, 8, false);                                        // echinus
  P.box(M.cream, x - 0.31 * s, x + 0.31 * s, 2.78 * t, 2.9 * t, z - 0.31 * s, z + 0.31 * s, '', 1);                       // abacus
}
export { postGeo };

/** pieces of the ring edges: [{ a: [x, z], b: [x, z], len }] in world metres with the gate openings cut out: returns { spans: [[x0, z0, x1, z1]], posts: [[x, z]], gates: [{ x, z, w, edge }] } */
export function layout() {
  const ring = RING_K.map(([r, q]) => { const p = FK.W(r, q); return [p.x, p.z]; });
  const gates = GATES.map((g) => { const p = FK.W(g.at[0], g.at[1]); return { ...g, x: p.x, z: p.z }; });
  const spans = [], posts = [], placed = [], runs = [];
  const addPost = (x, z) => { if (placed.some((p) => Math.hypot(p[0] - x, p[1] - z) < 0.5)) return; placed.push([x, z]); posts.push([x, z]); };
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
    // gate cuts on this edge: gates whose centre lies within 0.6 m of the edge line and between its ends (+- w/2)
    const cuts = [];
    for (const g of gates) { const s = (g.x - a[0]) * ux + (g.z - a[1]) * uz, d = Math.abs((g.x - a[0]) * -uz + (g.z - a[1]) * ux); if (d < 1.2 && s > -g.w / 2 && s < len + g.w / 2) cuts.push([Math.max(0, s - g.w / 2), Math.min(len, s + g.w / 2), g]); }
    cuts.sort((p, q) => p[0] - q[0]);
    // free stretches between the cuts
    const free = []; let s0 = 0;
    for (const [c0, c1] of cuts) { if (c0 > s0 + 0.01) free.push([s0, c0]); s0 = Math.max(s0, c1); }
    if (s0 < len - 0.01) free.push([s0, len]);
    const runSegs = [];
    for (const [f0, f1] of free) {
      const L = f1 - f0, n = Math.max(1, Math.round(L / 4.6)), p = L / n;
      for (let k = 0; k <= n; k++) { const s = f0 + p * k; addPost(a[0] + ux * s, a[1] + uz * s); }
      for (let k = 0; k < n; k++) { const sa = f0 + p * k, sb = sa + p; const seg = [a[0] + ux * sa, a[1] + uz * sa, a[0] + ux * sb, a[1] + uz * sb]; spans.push(seg); runSegs.push(seg); }
    }
    if (runSegs.length) runs.push(runSegs);
  }
  return { ring, gates, spans, posts, runs };
}

export function build(K) {
  const { ctx, P, M } = K, cover = coverFn(ctx), { spans, posts, runs, gates, ring } = layout();
  let nSpan = 0;
  const bays = [];      // one bay per span between two posts (about 4.6 m); the plinth wall, its cap and the iron panel are the parts of the bay, the posts stay static
  for (const [ax, az, bx, bz] of spans) {
    if (cover((ax + bx) / 2, (az + bz) / 2) > -0.4 || cover(ax, az) > -0.2 || cover(bx, bz) > -0.2) continue;                  // never on a carriageway
    bays.push({ x0: ax, z0: az, x1: bx, z1: bz, y: 0 }); nSpan++;
  }
  const y0 = PLINTH_H + 0.06;
  kBays(K, { name: 'lmKir-fence', bays, far: 360,
    parts: [{ geo: unitBox(0, PLINTH_H, -0.13, 0.13, { uLen: 4, uvs: 2 }), mat: M.cream, name: 'plinth', stretch: true, inset: 0.3 },
      { geo: unitBox(PLINTH_H, y0, -0.17, 0.17, { uLen: 4, uvs: 2 }), mat: M.eCap, name: 'cap', stretch: true, inset: 0.3 },
      { geo: unitPanel(y0, y0 + PANEL_H, { u1: 3.4 / 1.2 }), mat: M.fence, name: 'panel', stretch: true, inset: 0.3, shadow: false, receive: false, noOutline: true }],
    collider: { y0: 0, y1: y0 + PANEL_H, thick: 0.3, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: 600, h: y0 + PANEL_H, anchored: 24, hitK: 0.5, metal: true, minDv: 0 }) });
  let nPost = 0;
  const pav = PAV_K.map(([r, q]) => FK.W(r, q));
  for (const [x, z] of posts) { if (cover(x, z) > -0.3 || pav.some((p) => Math.hypot(p.x - x, p.z - z) < 1.7)) continue; postGeo(P, M, x, z); nPost++; }
  // colliders: the bays above (people/nav.js respects the `fence` flag of their boxes); the gates stay open
  void runs;
  K.svc.fences.push({ id: 'vasileostrovets', pts: ring, gates: gates.map((g) => ({ id: g.id, x: g.x, z: g.z, w: g.w })), spans: nSpan, posts: nPost, boxes: nSpan });
  K.extraTris += 0;
}
