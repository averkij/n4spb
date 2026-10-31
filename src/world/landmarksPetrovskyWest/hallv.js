// landmarksPetrovskyWest/hallv.js - the GOTE ROPE WORKS production hall "Петровский проспект, 20 лит. В" (OSM w44425062, 1898, F. Nagel): a long one-storey red-brick hall with tall ARCHED windows under a dentil brick frieze on a
// limestone plinth, light-grey standing-seam hipped roof, white downpipes.  Photos refs/petrovsky-west g01 (the east end: a rectangular steel window over the entrance door, the "20-в" plate), g09 (the south side: one arched window
// per 5 m bay between brick pilasters, a stepped lower annex at the west end), g10 (the roof from above: grey hip roof, lower rust-red sheds behind).  The plan is the baked ring (10 vertices: the long south wall and a notched north
// side); every edge gets the bay tile (hallBay: pilasters, plinth, arched window, dentil frieze) or the plain tile for edges shorter than 3.8 m.  Eaves 6.6 m (OSM 2 levels), pitch 25 deg, overhang 0.4 m.
// The hall is working industrial territory: exterior only, solid (collider along the footprint's main rectangle).
import * as L from '../layout.js';
import { IDS, ringOf, ringEdges, edgeFrame, toLocal, toWorld } from './frame.js';
import { wallsOfRing, hipRoof } from './shapes.js';

const H = 6.6;

export function build(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const ring = ringOf(IDS.hallV);
  if (!ring) return;
  const edges = ringEdges(ring), longest = edges.reduce((a, e) => (e.len > a.len ? e : a)), lf = edgeFrame(longest);
  P.far = 900;
  const ends = new Set();                                                                              // the east end wall (the entrance) = the edge after the longest one
  const endE = edges[(longest.i + 1) % edges.length]; ends.add(endE.i);
  wallsOfRing(P, ring, 0, H, M.hallBay, M.ruinPlain, { pitch: 5.1, th: H, minBay: 3.8, each: (f, e) => {
    if (e.i === endE.i) {                                                                             // g01: the rectangular steel window and the door of the east end
      const c = f.len / 2;
      P.far = 420;
      P.box(M.stone, c - 1.45, c + 1.45, 3.7, 5.8, 0, 0.07, 'kb', 1); P.box(M.dark, c - 1.3, c + 1.3, 3.85, 5.65, 0, 0.1, 'kb', 1);
      P.box(M.dark, c - 0.85, c + 0.85, 0.9, 3.3, 0, 0.12, 'kb', 1); P.box(M.dark, c - 0.68, c + 0.68, 0.9, 3.15, 0, 0.16, 'kb', 1);
      P.box(M.stone, c - 1.2, c + 1.2, 3.3, 3.5, 0, 0.5, 'k', 1);                                    // a small canopy slab
      P.far = 900;
    }
    // white downpipes at both ends of the edge
    if (f.len > 6) { P.far = 380; for (const x of [0.3, f.len - 0.3]) P.cyl(M.stone, [x, 0.1, 0.1], [x, H - 0.3, 0.1], 0.07, 0.07, 6, false); P.far = 900; }
  } });
  // hip roof over the main rectangle behind the longest edge
  // the ring has small bumps behind the main rectangle (depth 10.9 m main body, 13.0 / 14.1 m bays): the hip covers the main body only (a hip over the deepest vertex overhung the recessed walls by 3 m and showed a dark soffit
  // band from the street); the deeper bays get a flat zinc roof flush with the eaves
  const loc = ring.map((p) => toLocal(lf, p[0], p[1]));
  let D = 0; for (const q of loc) D = Math.max(D, -q.lz);
  const Dr = Math.min(...loc.map((q) => -q.lz).filter((d) => d > 3));
  P.push(lf.S.x, 0, lf.S.z, lf.rot);
  hipRoof(P, M.zincRoof, lf.len, Dr, H - 0.05, 0.47, 0.4, { under: M.dark });
  if (D > Dr + 0.5) P.cap(M.zincRoof, loc.map((q) => [q.lx, q.lz]), H - 0.08, true, 1.2);
  P.pop();
  if (ph) {
    const c = toWorld(lf, lf.len / 2, -D / 2);
    ph.addBox(c.x, c.z, lf.len + 0.2, D + 0.2, lf.rot, 0, H + 3);
  }
  K.shared.hallV = { lf, D };
  { const sp = toWorld(lf, lf.len * 0.5, 12), c = toWorld(lf, lf.len * 0.5, -D / 2);
    K.svc.photoSpots.push({ x: sp.x, z: sp.z, yaw: Math.round(L.yawToward(sp.x, sp.z, c.x, c.z)), name: 'Канатный завод Готе: кирпичный корпус с арочными окнами' }); }
  K.svc.monuments.push({ id: IDS.hallV, name: 'Канатный завод Готе: производственный корпус, 1898', x: lf.S.x, z: lf.S.z, h: H + 3 });
}
