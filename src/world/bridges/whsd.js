// Provenance: copied from the source project 102_3d_piter, commit 0568f7af (src/world/bridges/whsd.js), for the Morskoy / Gavan / Dekabristov areas (docs/gdm-B.md); the lines marked 'n4spb' are the world-rule adaptations
// (docs/AREAS.md 13.7) and the area clip:
//   * CLIP: the source builds the whole 2.9 km line (and the far part is scenery there). The three new areas hold different parts of the corridor, so every area builds the stations that lie in ITS data extent grown by WHSD_MARGIN = 300 m
//     (EXTENT_RECTS of data/city.js, the play rectangles + 120 m): the stations, columns, lamps and chunks come from the SAME indexes of the whole line in every area, so the parts of two areas that overlap are the same triangles
//     and the seams are continuous; a cut end gets a cap across the girder; the pylons and the portals are built where their centre lies in that range. B.deckAt answers only on the built part.
//   * KNOCK: the barriers of the decks (both sides) are breakable bays (bridges/rails.js parapet bays: collider + knock record + the drawn concrete section), the 9 m cobra lamps are knock posts (bridges/knock-posts.js).
//     Solid on purpose: the twin round columns on land, the soffit box where the girder hangs lower than 1.8 m, the portal headwalls (all structures); the columns over water have no collider of their own and are solid pillars
//     for a hull through bridges/piers.js (flush), a walker wades between them.
// bridges/whsd.js - the far scenery of the Western High-Speed Diameter (ЗСД, 2016) on Vasilievsky Island (docs/research/vo-bridges-wave2.md section 5, photos refs/bridges2 z01 .. z07):
//   * the TWIN VIADUCT: two separate box-girder decks (14.6 m, four lanes each, a 7.4 m gap) that rise from the end of the at-grade section (z -300) over the land fill and the Gulf shore (z 440) to the 35 m
//     clearance of the Korabelny fairway: pale concrete trapezoid box girders on twin round columns every 55 m, concrete barriers, lamp poles, lane paint; the drivable part gives services.bridges.deckY (traffic and
//     the red car ride it), NOTHING is walkable (no walk surface; the barriers and the columns are solid): nobody walks over the Gulf
//   * the KORABELNY CABLE-STAYED BRIDGE as skyline: two portal pylons of two tapering concrete legs leaning inward (124 m, about (-7850, 1275) and (-7883, 1594)), diamond bracing, 2 x 2 x 13 stays per pylon,
//     water caissons; the deck continues south to z 2600 (a long line of slender piers fading into the haze)
//   * the PORTALS of the Smolenka mouth tunnel (south (-8158, -1981) / (-8136, -1973), north (-8073, -2259) / (-8052, -2254)): a concrete headwall with two openings, solid, no tunnel traffic
// Data: sites-vo2.js WHSD (lines, y(z), pylons, portals).  NO flags / flagpoles / beacons / aviation lights (user rules).
import * as THREE from 'three';
import { WHSD, whsdY, whsdDeckY } from './sites-vo2.js';
import { lampCobra } from './sculpt4.js';
import { buildGround } from './whsd-ground.js';
import { EXTENT_RECTS } from '../data/city.js';      // n4spb: the data extent of the area (the clip of the corridor)
import { postBatch } from './knock-posts.js';      // n4spb: the cobra lamps are knock posts

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
void THREE;
/** n4spb: true when (x, z) lies in the data extent of this area (play rectangles + the 120 m margin); `m` grows it */
export const inExtent = (x, z, m = 0) => EXTENT_RECTS.some((r) => x >= r.x0 - m && x <= r.x1 + m && z >= r.z0 - m && z <= r.z1 + m);
/** n4spb: the corridor is built this far (m) beyond the data extent of the area (the extent already holds the 120 m margin of the play rectangles): a viaduct that ends 120 m behind the edge of the walkable area is a
 *  stump in the sky; 300 m more lets the Korabelny pylon of Gavan (35 m outside its extent) stand with the deck its stays hang from. The columns, caps and lamps of that margin are scenery (no data there: water or void). */
export const WHSD_MARGIN = 300;

export function buildWhsd(env) {
  const { ctx, P, M } = env, L = ctx.L, hw = WHSD.hw, DEPTH = WHSD.depth, keep = env.keep || ((x, z) => inExtent(x, z, WHSD_MARGIN)), rails = env.rails;
  const B = { id: WHSD.id, info: { rails: 0, colliders: 0, tris: 0 }, masts: [], anchors: [], KP: postBatch('brg-whsd') };
  const bays = [];      // n4spb: the barrier bays of the decks (registered with rails.parapet in colliders())
  const conc = M.whsdConcrete, soff = M.whsdSoffit, barr = M.whsdBarrier;
  const isWater = (x, z) => z > 448 || !!(L.waterwayAt && L.waterwayAt(x, z));

  // ------------------------------------------------------------------ stations along each carriageway (6 m)
  const decks = [];
  for (const k of ['W', 'E']) {
    const pts = WHSD.lines[k], so = k === 'W' ? 1 : -1, st = [];
    let s = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dz), n = Math.max(1, Math.round(l / 6));
      for (let j = 0; j < n; j++) { const t = j / n; st.push({ x: pts[i][0] + dx * t, z: pts[i][1] + dz * t, s: s + l * t }); }
      s += l;
    }
    st.push({ x: pts[pts.length - 1][0], z: pts[pts.length - 1][1], s });
    for (let i = 0; i < st.length; i++) {                                                // tangent (central difference), normal to the right of travel (south-going: west), height
      const a = st[Math.max(0, i - 1)], b = st[Math.min(st.length - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
      st[i].tx = dx / l; st[i].tz = dz / l; st[i].nx = -st[i].tz; st[i].nz = st[i].tx; st[i].y = whsdY(st[i].z); st[i].in = keep(st[i].x, st[i].z);      // n4spb: .in = the station lies in the data extent of the area
    }
    decks.push({ k, so, st, drawn: st.map((a, i) => i + 1 < st.length && (a.in || st[i + 1].in)) });      // n4spb: drawn[i] = the segment i -> i + 1 is built in this area
  }
  const at = (d, i, q, y) => [d.st[i].x + d.st[i].nx * d.so * q, y, d.st[i].z + d.st[i].nz * d.so * q];     // a point of station i at the lateral offset q (+ = outer side of the deck)

  // ------------------------------------------------------------------ the decks: asphalt, barriers, trapezoid box girder
  for (const d of decks) {
    const N = d.st.length;
    for (let i = 0; i + 1 < N; i++) {
      if (!d.drawn[i]) continue;                                                                          // n4spb: outside the data extent of the area
      const a = d.st[i], b = d.st[i + 1], ya = a.y, yb = b.y;
      const Q = (mat, q0, y0, q1, y1, nrm) => P.quad(mat, at(d, i, q0, ya + y0), at(d, i + 1, q0, yb + y0), at(d, i + 1, q1, yb + y1), at(d, i, q1, ya + y1), nrm);   // a strip between lateral offsets q0 / q1 and relative heights y0 / y1, from station i to i + 1
      const up = [0, 1, 0];
      // the asphalt between the barriers
      Q(M.asphalt, -hw + 0.45, 0.02, hw - 0.45, 0.02, up);
      // barriers (0.95 m high, 0.45 m thick): top and the two faces, both outer edges (n4spb: drawn as knock bays, see the chunks below, not as quads of the deck)
      for (const sgq of [-1, 1]) {
        const q1 = sgq * hw, nOut = [d.so * sgq * a.nx, 0, d.so * sgq * a.nz];
        // the lip of the deck below the barrier, the sloped web and the soffit
        Q(conc, q1, -0.55, q1, 0, nOut);
        Q(conc, q1, -0.55, sgq * 4.3, -DEPTH, [nOut[0] * 0.8, -0.6, nOut[2] * 0.8]);
      }
      Q(soff, -4.3, -DEPTH, 4.3, -DEPTH, [0, -1, 0]);
      // lane paint every second station: edge lines + dashes (decals), only near the player's reach
      if (a.z < 1300 && i % 2 === 0) {
        for (const q of [-6.25, 6.25]) Q(M.mark, q - 0.08, 0.04, q + 0.08, 0.04, up);
        for (const q of [-3.4, 0, 3.4]) P.quad(M.mark, at(d, i, q - 0.07, ya + 0.045), at(d, i + 1, q - 0.07, yb + 0.045), at(d, i + 1, q + 0.07, yb + 0.045), at(d, i, q + 0.07, ya + 0.045), up);
      }
    }
    // n4spb: the barriers of the deck as breakable bays of one chunk (2 stations, 12 m) each, both outer edges; the chunk grid is that of the whole line (the same bays in every area that builds the place)
    for (let i = 0; i + 1 < N; i += 2) {
      const j = Math.min(N - 1, i + 2); if (!d.drawn[i] && !(j - 1 > i && d.drawn[i + 1])) continue;
      const a = d.st[i], b = d.st[j];
      for (const sgq of [-1, 1]) { const p0 = at(d, i, sgq * (hw - 0.225), 0), p1 = at(d, j, sgq * (hw - 0.225), 0); bays.push({ x0: p0[0], z0: p0[2], x1: p1[0], z1: p1[2], y: a.y, ye: b.y, h: 0.95, th: 0.45, center: true, box: true, mat: barr }); }
    }
    // the end caps of the deck (the first station: it rises out of the ground; the last: it ends in the haze; n4spb: and the two ends of the part that this area builds, where the line goes on beyond the data extent)
    const capAt = [];
    for (let i = 0; i + 1 < N; i++) if (d.drawn[i]) { if (i === 0 ? !WHSD.ground : !d.drawn[i - 1]) capAt.push([i, -1]); if (i + 2 >= N || !d.drawn[i + 1]) capAt.push([i + 1, 1]); }
    for (const [i, sgn] of capAt) {
      const a = d.st[i], y = a.y, nrm = [a.tx * sgn, 0, a.tz * sgn];
      P.quad(conc, at(d, i, -7.3, y - 0.55), at(d, i, 7.3, y - 0.55), at(d, i, 7.3, y + 0.95), at(d, i, -7.3, y + 0.95), nrm);
      P.quad(soff, at(d, i, -4.3, y - DEPTH), at(d, i, 4.3, y - DEPTH), at(d, i, 7.3, y - 0.55), at(d, i, -7.3, y - 0.55), nrm);
    }
  }

  // ------------------------------------------------------------------ columns: twin round columns with a cross-head every ~55 m (over the water they stand on the sea bed)
  const cols = [];
  for (const d of decks) {
    let nextS = 40;
    for (let i = 0; i < d.st.length; i++) {
      const a = d.st[i]; if (a.s < nextS) continue; nextS += 55;
      if (!a.in) continue;                                                                               // n4spb: outside the data extent of the area (nextS above runs along the whole line: the same columns in every area)
      const yTop = a.y - DEPTH; if (yTop < 2.2) continue;
      const w = isWater(a.x, a.z), yFoot = w ? -7 : 0, big = a.y > 14;
      const r0 = big ? 1.55 : 1.25, r1 = big ? 1.3 : 1.1;
      for (const q of [-3.2, 3.2]) {
        const p = at(d, i, q, 0);
        P.cyl(conc, [p[0], yFoot, p[2]], [p[0], yTop + 0.1, p[2]], r0, r1, 10, false);
        if (!w) cols.push({ x: p[0], z: p[2], r: r0, y1: yTop });
        if (w) P.cyl(conc, [p[0], -3.6, p[2]], [p[0], -2.6, p[2]], r0 + 0.5, r0 + 0.35, 10, true);                  // a collar at the water line
      }
      if (w) {
        // n4spb: the twin columns of a pier in the water stand on ONE pile cap (a 10.7 x 4 m block from the bed to 0.8 m over the water, round the two collars): without it the 2.3 m gap between the two collars is a slot that a boat can
        // enter (boat-passage-test b: the pair is ONE pillar of the oracle, a boat driven through the slot ends inside its footing); the open water between the piers (55 m along the deck, 21 m between the decks) is untouched
        const hq = 3.2 + r0 + 0.6, hu = 2.0, y0 = -5.0, y1 = -2.6, tx = a.tx, tz = a.tz, nx = d.so * a.nx, nz = d.so * a.nz;      // (lateral axis = the outer normal times the side sign, along = the tangent)
        const c = at(d, i, 0, 0), K = (u, v, y) => [c[0] + tx * u + nx * v, y, c[2] + tz * u + nz * v];
        for (const [u0, v0, u1, v1, nrm] of [[-hu, -hq, hu, -hq, [-nx, 0, -nz]], [hu, -hq, hu, hq, [tx, 0, tz]], [hu, hq, -hu, hq, [nx, 0, nz]], [-hu, hq, -hu, -hq, [-tx, 0, -tz]]]) P.quad(conc, K(u0, v0, y0), K(u1, v1, y0), K(u1, v1, y1), K(u0, v0, y1), nrm);
        P.quad(conc, K(-hu, -hq, y1), K(hu, -hq, y1), K(hu, hq, y1), K(-hu, hq, y1), [0, 1, 0]);
      }
    }
  }

  // ------------------------------------------------------------------ lamp poles on the inner barriers (every 40 m, only where a visitor may look closely)
  for (const d of decks) {
    let nextS = 20;
    for (let i = 0; i < d.st.length; i++) {
      const a = d.st[i]; if (a.s < nextS || a.z > 1150) continue; nextS += 40;
      if (!a.in) continue;                                                                               // n4spb: outside the data extent of the area
      const p = at(d, i, -hw + 0.25, a.y + 0.95), rot = Math.atan2(d.so * a.nx, d.so * a.nz);
      // n4spb: a knock post (bridges/knock-posts.js) instead of the solid-less lamp of the source; the pole stands on the inner barrier, its collider reaches down to the deck
      B.KP.add('whsd-cobra', (Q) => lampCobra(Q, M, 0, 0, 0, 0, { h: 9, mat: M.poleGalv, arm: 1.6 }), { x: p[0], y: p[1], z: p[2], rotY: rot }, { x: p[0], z: p[2], r: 0.2, y0: a.y, y1: p[1] + 9 }, 9);
      B.masts.push({ x: p[0], z: p[2], y: p[1], h: 9, kind: 'cobra' });
    }
  }

  // ------------------------------------------------------------------ the at-grade stretch from the portals to the first station of the viaduct (whsd-ground.js)
  if (WHSD.ground) { try { buildGround({ ...env, keep }, B); } catch (err) { console.error('[whsd] at-grade stretch failed:', err); } }

  // ------------------------------------------------------------------ the Korabelny cable-stayed bridge: portal pylons (two tapering legs leaning inward), bracing, stays, caissons
  const stays = [];
  const pylon = (cx, cz) => {
    // the centre line direction at the pylon (from the two decks)
    const d = decks[0]; let bi = 0, bd = 1e9; for (let i = 0; i < d.st.length; i++) { const dd = Math.hypot(d.st[i].x - cx, d.st[i].z - cz); if (dd < bd) { bd = dd; bi = i; } }
    const tx = d.st[bi].tx, tz = d.st[bi].tz, nx = -tz, nz = tx, H = WHSD.pylonH, yTop = H - 4;
    const yb = -6;
    const pos = (u, q, y) => [cx + tx * u + nx * q, y, cz + tz * u + nz * q];
    // the water caisson: a chamfered block 56 x 16 x 10 (from the sea bed to 3.5 m above the water)
    const ca = (u0, u1, q0, q1, y0, y1) => { for (const [m, nrm] of [[[[u0, q0], [u1, q0]], [-nx, 0, -nz]], [[[u1, q1], [u0, q1]], [nx, 0, nz]], [[[u0, q1], [u0, q0]], [-tx, 0, -tz]], [[[u1, q0], [u1, q1]], [tx, 0, tz]]]) P.quad(conc, pos(m[0][0], m[0][1], y0), pos(m[1][0], m[1][1], y0), pos(m[1][0], m[1][1], y1), pos(m[0][0], m[0][1], y1), nrm); P.quad(conc, pos(u0, q0, y1), pos(u1, q0, y1), pos(u1, q1, y1), pos(u0, q1, y1), [0, 1, 0]); };
    ca(-9, 9, -30, 30, yb, 3.5);
    // the legs: rectangular rings from the caisson up, tapering 3.6 x 5.4 -> 2.0 x 2.8, leaning from q = +-22 at the base to +-8.5 at the top
    const legs = [];
    for (const sg of [-1, 1]) {
      const ring = (y) => { const t = (y - 3.5) / (yTop - 3.5), q = sg * (22 - 13.5 * Math.pow(t, 1.15)), wu = 4.6 - 2.2 * t, wq = 2.7 - 1.2 * t; return [pos(-wu, q - wq, y), pos(wu, q - wq, y), pos(wu, q + wq, y), pos(-wu, q + wq, y)]; };
      const n = 12; let prev = ring(3.5);
      for (let k = 1; k <= n; k++) {
        const y = 3.5 + (yTop - 3.5) * k / n, cur = ring(y);
        for (let e = 0; e < 4; e++) { const e2 = (e + 1) % 4; P.quad(conc, prev[e], prev[e2], cur[e2], cur[e], [(prev[e][0] + prev[e2][0]) / 2 - (prev[0][0] + prev[2][0]) / 2, 0, (prev[e][2] + prev[e2][2]) / 2 - (prev[0][2] + prev[2][2]) / 2]); }
        prev = cur;
      }
      P.quad(conc, prev[0], prev[1], prev[2], prev[3], [0, 1, 0]);
      legs.push((y) => { const t = (y - 3.5) / (yTop - 3.5); return sg * (22 - 13.5 * Math.pow(t, 1.15)); });
    }
    // diamond bracing between the legs at 70 .. 112 m: X members
    const brace = (y0, y1) => {
      const qa0 = legs[0](y0), qb0 = legs[1](y0), qa1 = legs[0](y1), qb1 = legs[1](y1);
      for (const [pa, pb] of [[pos(0, qa0, y0), pos(0, qb1, y1)], [pos(0, qb0, y0), pos(0, qa1, y1)]]) P.cyl(conc, pa, pb, 0.7, 0.7, 6, false);
      P.cyl(conc, pos(0, qa1, y1), pos(0, qb1, y1), 0.8, 0.8, 6, false);
    };
    brace(62, 80); brace(80, 98); brace(98, 112);
    // the stays: 13 per leg per side, from the leg (62 .. 116 m) to the outer edge of the nearest deck at 25 .. 165 m from the pylon
    const stay = (leg, sgLeg, sgDir, i) => {
      const y = 62 + 4.5 * i, q = legs[leg](y), du = sgDir * (24 + 12.3 * i), dq = sgLeg * 18.4 - sgLeg * 0;     // the deck edge: the outer barrier of the carriageway on that side (q = +-18.3)
      const anchorU = du, a = pos(0, q, y), b = pos(anchorU, dq, whsdY(cz + tz * anchorU) + 0.9);
      stays.push([a, b]);
    };
    for (let leg = 0; leg < 2; leg++) for (const sgDir of [-1, 1]) for (let i = 0; i < 13; i++) stay(leg, leg === 0 ? -1 : 1, sgDir, i);
    return { tx, tz, cx, cz };
  };
  const pyl = WHSD.pylons.filter(([x, z]) => keep(x, z)).map(([x, z]) => pylon(x, z));      // n4spb: a pylon is built by the area whose data extent holds its centre
  for (const [a, b] of stays) ctx.wires.add([a, b], { width: 0.22, color: '#e4e7ea' });
  B.info.stays = stays.length;

  // ------------------------------------------------------------------ the tunnel portals: a headwall with two openings, solid
  const dark = M.tunnelDark, rim = M.whsdRim;
  const portal = (pA, pB, outDir) => {
    const mx = (pA[0] + pB[0]) / 2, mz = (pA[1] + pB[1]) / 2, ax = Math.sin(WHSD.portals.axis * Math.PI / 180), az = -Math.cos(WHSD.portals.axis * Math.PI / 180);   // the tunnel axis (toward the north-north-east)
    const ox = ax * outDir, oz = az * outDir, px = -oz, pz = ox;                                                                                              // out of the tunnel / along the wall
    const pos = (o, l, y) => [mx + ox * o + px * l, y, mz + oz * o + pz * l];
    const W = 27, T = 6.0, Hh = 9.2, ow = 7.6, oh = 6.1, oc = [-11.7, 11.7], SD = T - 0.4;
    // the wall front: pieces between the openings (as quads with the openings left out) + a lintel
    const seg = (l0, l1, y0, y1, o) => P.quad(conc, pos(o, l0, y0), pos(o, l1, y0), pos(o, l1, y1), pos(o, l0, y1), [ox, 0, oz]);
    seg(-W, oc[0] - ow, 0, Hh, 0); seg(oc[0] + ow, oc[1] - ow, 0, Hh, 0); seg(oc[1] + ow, W, 0, Hh, 0);
    for (const c of oc) {
      seg(c - ow, c + ow, oh, Hh, 0);
      // the rim of the opening (a lighter frame 0.7 m wide) and the dark tunnel mouth (a recess inside the headwall)
      for (const [l0, l1, y0, y1] of [[c - ow - 0.7, c - ow, 0, oh + 0.7], [c + ow, c + ow + 0.7, 0, oh + 0.7], [c - ow - 0.7, c + ow + 0.7, oh, oh + 0.7]]) P.quad(rim, pos(0.12, l0, y0), pos(0.12, l1, y0), pos(0.12, l1, y1), pos(0.12, l0, y1), [ox, 0, oz]);
      P.quad(dark, pos(0, c - ow, 0.02), pos(-SD, c - ow, 0.02), pos(-SD, c + ow, 0.02), pos(0, c + ow, 0.02), [0, 1, 0]);
      P.quad(dark, pos(0, c - ow, oh), pos(0, c + ow, oh), pos(-SD, c + ow, oh), pos(-SD, c - ow, oh), [0, -1, 0]);
      P.quad(dark, pos(0, c - ow, 0), pos(0, c - ow, oh), pos(-SD, c - ow, oh), pos(-SD, c - ow, 0), [px, 0, pz]);
      P.quad(dark, pos(0, c + ow, 0), pos(-SD, c + ow, 0), pos(-SD, c + ow, oh), pos(0, c + ow, oh), [-px, 0, -pz]);
      P.quad(dark, pos(-SD, c - ow, 0), pos(-SD, c + ow, 0), pos(-SD, c + ow, oh), pos(-SD, c - ow, oh), [ox, 0, oz]);
    }
    // the body behind the face (top, sides, back): T metres deep, with a 1 m parapet
    P.quad(conc, pos(0, -W, Hh), pos(0, W, Hh), pos(-T, W, Hh), pos(-T, -W, Hh), [0, 1, 0]);
    P.quad(conc, pos(0, W, 0), pos(-T, W, 0), pos(-T, W, Hh), pos(0, W, Hh), [px, 0, pz]);
    P.quad(conc, pos(-T, -W, 0), pos(0, -W, 0), pos(0, -W, Hh), pos(-T, -W, Hh), [-px, 0, -pz]);
    P.quad(conc, pos(-T, W, 0), pos(-T, -W, 0), pos(-T, -W, Hh), pos(-T, W, Hh), [-ox, 0, -oz]);
    P.quad(barr, pos(0, -W, Hh), pos(0, W, Hh), pos(0, W, Hh + 1.0), pos(0, -W, Hh + 1.0), [ox, 0, oz]);
    P.quad(barr, pos(0, -W, Hh + 1.0), pos(0, W, Hh + 1.0), pos(-0.5, W, Hh + 1.0), pos(-0.5, -W, Hh + 1.0), [0, 1, 0]);
    return { mx, mz, ox, oz, px, pz, W, T, Hh };
  };
  const ports = [[WHSD.portals.south, -1], [WHSD.portals.north, 1]].filter(([p]) => keep((p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2)).map(([p, dir]) => portal(p[0], p[1], dir));      // n4spb: a portal is built by the area whose data extent holds it

  // ------------------------------------------------------------------ bounds, anchors (traffic prefilters deckY by a 190 m radius round every list entry), deckAt
  // n4spb: from the part of the line that this area builds (the viaduct stations are the first ones of the line that lie in the extent: the same traffic anchors as in the area next door)
  const xs = [], zs = [];
  for (const d of decks) d.st.forEach((s, i) => { if (s.in || d.drawn[i]) { xs.push(s.x); zs.push(s.z); } });
  if (!xs.length) { xs.push(0); zs.push(0); }
  B.bounds = [Math.min(...xs) - 12, Math.min(...zs) - 12, Math.max(...xs) + 12, Math.max(...zs) + 12];
  const mid = decks[0], midIn = mid.st.map((s, i) => i).filter((i) => mid.st[i].in);
  for (let i = 0; i < mid.st.length; i += Math.round(220 / 6)) if (mid.st[i].in) B.anchors.push({ x: (mid.st[i].x + decks[1].st[Math.min(i, decks[1].st.length - 1)].x) / 2, z: mid.st[i].z });
  const c0 = midIn.length ? mid.st[midIn[Math.floor(midIn.length / 2)]] : mid.st[Math.round(mid.st.length * 0.25)];
  B.x = c0.x; B.z = c0.z; B.at = [B.x, B.z];
  B.yDeck = (x, z) => whsdY(z);
  B.deckAt = (x, z) => (keep(x, z) ? whsdDeckY(x, z) : null);      // n4spb: a deck answers only where it is built (the area next door answers for its own part)

  // ------------------------------------------------------------------ colliders: the barriers of both decks (cars stay on them), the girder body where it hangs lower than a person is tall, the land columns, the portals
  B.colliders = () => {
    const ph = ctx.physics;
    for (const d of decks) {
      const N = d.st.length, step = 2;                                                                       // chunks of 2 stations (12 m)
      for (let i = 0; i + 1 < N; i += step) {
        const j = Math.min(N - 1, i + step), a = d.st[i], b = d.st[j], yMin = Math.min(a.y, b.y), yMax = Math.max(a.y, b.y), l = Math.hypot(b.x - a.x, b.z - a.z) || 1, rot = Math.atan2(b.x - a.x, b.z - a.z) - Math.PI / 2;
        if (!d.drawn[i] && !(j - 1 > i && d.drawn[i + 1])) continue;                                         // n4spb: outside the data extent of the area
        const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
        // (n4spb: the two 0.45 m barrier boxes of the chunk are the bays registered below, breakable; the soffit box is a structure and stays solid)
        if (yMax - DEPTH < 1.8) { ph.addBox(mx, mz, l + 0.3, 2 * hw - 0.2, rot, yMin - DEPTH - 0.5, yMin - 0.15); B.info.colliders++; }
      }
    }
    for (const b of bays) { rails.parapet(b); B.info.colliders++; }                                         // n4spb: the breakable barrier bays of the decks (built by rails.flush at the end of bridges.js)
    if (B.groundColliders) B.groundColliders();
    { const k = B.KP.flush(ctx); B.info.colliders += k.colliders; B.extraTris = k.tris; }                   // n4spb: the cobra lamps, colliders + knock records
    for (const c of cols) { ph.addCylinder(c.x, c.z, c.r + 0.1, -1, c.y1); B.info.colliders++; }
    for (const p of ports) { const rot = Math.atan2(p.ox, p.oz) + Math.PI / 2; ph.addBox(p.mx - p.ox * p.T / 2, p.mz - p.oz * p.T / 2, 2 * p.W + 2, p.T + 0.4, Math.atan2(-p.pz, p.px), -2, p.Hh + 1); B.info.colliders++; void rot; }
  };
  return B;
}
