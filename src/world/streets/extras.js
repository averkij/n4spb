// streets/extras.js - parking lots (PARKING polygons: asphalt + white bay lines), blue 'P' signs at the ends of the parking pockets, the yellow zig-zag at the bus stops, and the tram rails
// flush in the asphalt (TRAMWAYS). Small builders that need data from the other street modules.
import { PARKING, TRAMWAYS, FURNITURE } from '../data/city.js';
import { deckAt } from './decks.js';
import { pairs, chaikin, densify, rgb, UP } from './util.js';
import { addCap, polyArea } from '../lib/massing.js';
import { ROAD_Y, WALK_Y, LIFT, KERB_W } from './surface.js';
import * as L from '../layout.js';
import { wayAt, nearestWay } from './net.js';
import { nudgeClear, poleClear } from './furn.js';

/** asphalt of the PARKING polygons (not inside a building; > 40 m2) into a massing MeshBuilder; returns the number of lots */
export function buildLots(B) {
  let n = 0;
  for (const p of PARKING) for (const poly of p.polys || []) {
    if (polyArea(poly) < 40 || p.id === 'r13353280') continue;                // the station forecourt is paved plaza (landmarksA), not an asphalt lot
    let cx = 0, cz = 0; const o = poly.o; for (let i = 0; i < o.length; i += 2) { cx += o[i]; cz += o[i + 1]; } cx /= o.length / 2; cz /= o.length / 2;
    if (L.insideBuilding(cx, cz, 0)) continue;
    addCap(B, poly, ROAD_Y - 0.002, { uvScale: 8 }); n++;
  }
  return n;
}

/** white bay separators (0.1 m) as decal quads in a MB with vertex colour */
export function buildBayLines(P, lines) {
  const col = [0.88, 0.87, 0.82];
  for (const [x0, z0, x1, z1] of lines) {
    const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l * 0.05, nz = dx / l * 0.05;
    const q = (x, z, u, v) => P.vert(x, ROAD_Y + LIFT, z, u, v, UP, col);
    P.quad(q(x0 + nx, z0 + nz, 0, 0), q(x0 - nx, z0 - nz, 1, 0), q(x1 - nx, z1 - nz, 1, 1), q(x1 + nx, z1 + nz, 0, 1));
  }
  return lines.length;
}

/** bicycle pictograms (1.0 x 1.5 m, upright for the direction of travel) on the cycle track */
export function buildBikeMarks(B, marks) {
  for (const m of marks) {
    for (const sg of [1, -1]) {                                           // the track is two-way: one pictogram each way, side by side
      const dx = m.dx * sg, dz = m.dz * sg, nx = -dz, nz = dx;
      const X = m.x + (-m.dz) * sg * 0.5, Z = m.z + m.dx * sg * 0.5;       // each direction rides on its own half
      const q = (a, b, u, v) => B.vert(X + dx * a + nx * b, WALK_Y + LIFT * 1.2, Z + dz * a + nz * b, u, v, UP);
      // quad corners: along a in [-0.7, 0.7] (v 0..1 toward the travel direction), across b in [-0.45, 0.45] (u 0..1)
      B.quad(q(-0.7, -0.45, 1, 0), q(-0.7, 0.45, 0, 0), q(0.7, 0.45, 0, 1), q(0.7, -0.45, 1, 1));
    }
  }
  return marks.length;
}

/** blue 'P' signs at both ends of every contiguous run of parking-pocket slots; roadSign(tex, x, z, nx, nz, size, h) from signals.js. A sign whose base would stand on the asphalt
 *  (the pocket ends, a fillet) shifts along the kerb (+-1 m steps, 6 m, the outer side first) and outward, else it is dropped. */
export function placeParkSigns(net, slots, roadSign, parkTex) {
  const pock = slots.filter((s) => s.kind === 'bay' || s.kind === 'parallel');
  const groups = new Map();
  for (const s of pock) { const k = s.road + s.side; let l = groups.get(k); if (!l) groups.set(k, (l = [])); l.push(s); }
  let n = 0;
  for (const list of groups.values()) {
    let a = 0;
    for (let i = 1; i <= list.length; i++) {
      if (i < list.length && Math.hypot(list[i].x - list[i - 1].x, list[i].z - list[i - 1].z) < 16) continue;
      if (list[a].kind === 'parallel' && i - a < 4) { a = i; continue; }
      const first = list[a], last = list[i - 1];
      if (i - a >= 3) {
        const dx = last.x - first.x, dz = last.z - first.z, l = Math.hypot(dx, dz) || 1, tx = dx / l, tz = dz / l;
        const off = first.depth / 2 + KERB_W + 0.55;
        for (const [e, sg] of [[first, -1], [last, 1]]) {
          const at = nudgeClear(net, e.x + tx * sg * 3 + e.nx * off, e.z + tz * sg * 3 + e.nz * off, tx, tz, e.nx, e.nz, 6, sg);
          if (at) { roadSign(parkTex, at[0], at[1], tx * sg, tz * sg, 0.7, 2.75); n++; }
        }
      }
      a = i;
    }
  }
  return n;
}

/** yellow zigzag (Russian marking 1.17) along the kerb at every bus stop, 12 m long, centred on the stop */
export function buildStopMarks(P, stops) {
  const col = [0.89, 0.78, 0.29];
  let n = 0;
  for (const st of stops) {
    const w = st.w, a = st.s - 6, b = st.s + 6; if (a < 3 || b > w.L - 3) continue;
    const pts = [];
    for (let i = 0, s = a; s <= b + 0.01; s += 0.7, i++) {
      const q = wayAt(w, s), e = st.side > 0 ? q.hR : q.hL, off = e - (i % 2 ? 0.55 : 0.2), sg = st.side;
      pts.push({ x: q.x - q.tz * sg * off, z: q.z + q.tx * sg * off, y: ROAD_Y, nx: -q.tz * 0.0 + q.tx * 0.7, nz: q.tz * 0.7 });
    }
    // thin strip along the zigzag polyline (normals are taken from the segment direction)
    for (let i = 0; i + 1 < pts.length; i++) {
      const A = pts[i], B = pts[i + 1], dx = B.x - A.x, dz = B.z - A.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * 0.05, nz = dx / l * 0.05;
      const q = (x, z, u, v) => P.vert(x, ROAD_Y + LIFT, z, u, v, UP, col);
      P.quad(q(A.x + nx, A.z + nz, 0, 0), q(A.x - nx, A.z - nz, 1, 0), q(B.x - nx, B.z - nz, 1, 1), q(B.x + nx, B.z + nz, 0, 1));
    }
    n++;
  }
  return n;
}


/** Tram rails flush in the asphalt (docs/research/streets.md section 2: two dark grooves with a steel rail head, gauge 1.52 m): decal strips along TRAMWAYS, hidden under buildings;
 *  where a track runs beside the asphalt (a median) a 3.2 m wide setts bed is laid under it (bed: MeshBuilder-compatible MB with the cobble material). Returns the number of ways. */
const BED_Y = 0.016;
export function buildTramRails(net, P, Bed, isOwned = null) {
  const GROOVE = rgb('#2a2c2f');
  let n = 0;
  // the bed of a tram reservation (net.js tramReservation: Kronverksky pr. along the Alexander Park): ONE ribbon of setts over the whole width of the double track instead of a road
  if (Bed) for (const w of net.ways) {
    if (!w.tramBed) continue;
    let prev = null;
    for (let i = 0; i < w.n; i++) {
      const nx = -w.tz[i], nz = w.tx[i], lx = w.x[i] - nx * w.hL[i], lz = w.z[i] - nz * w.hL[i], rx = w.x[i] + nx * w.hR[i], rz = w.z[i] + nz * w.hR[i];
      const v0 = Bed.vert(rx, BED_Y, rz, rx / 3.2, rz / 3.2), v1 = Bed.vert(lx, BED_Y, lz, lx / 3.2, lz / 3.2);       // (1.4 cm under the asphalt: a service road that crosses or runs along the
      if (prev) Bed.quad(prev[0], prev[1], v1, v0);                                                                    //  reservation keeps its asphalt on top; at 3 mm the setts won the depth tie)
      prev = [v0, v1];
    }
  }
  for (const t of TRAMWAYS) {
    if (t.tunnel || t.layer < 0) continue;
    if (isOwned && isOwned(t.id)) continue;                  // a tram way of a bridge that a module draws (the Troitsky Bridge, the 1st Sadovy Bridge): the module lays its own rails on its deck; here they would hang at ground level (y 0.05) over the river, in the gap of an open leaf, and their setts bed (3.2 m wide) would show as a grey strip across the water
    let pts = pairs(t.pts); if (pts.length < 2) continue;
    if (pts.length > 2) pts = chaikin(pts, 2, 40);
    pts = densify(pts, 2);
    const run = []; const flush = () => { if (run.length >= 2) draw(run.slice()); run.length = 0; };
    const draw = (r) => {
      const col = GROOVE, rw = 0.14;
      for (const off of [-0.76, 0.76]) {
        let prev = null;
        for (let i = 0; i < r.length; i++) {
          const a = r[Math.max(0, i - 1)], b = r[Math.min(r.length - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
          const nx = -tz, nz = tx, x = r[i][0] + nx * off, z = r[i][1] + nz * off, y = ROAD_Y + LIFT * 1.4;
          const v0 = P.vert(x + nx * rw / 2, y, z + nz * rw / 2, 0, 0, UP, col), v1 = P.vert(x - nx * rw / 2, y, z - nz * rw / 2, 1, 0, UP, col);
          if (prev) P.quad(prev[0], prev[1], v1, v0);
          prev = [v0, v1];
        }
      }
      n++;
      if (Bed) {
        let prev = null;
        for (let i = 0; i < r.length; i++) {
          const a = r[Math.max(0, i - 1)], b = r[Math.min(r.length - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
          if (net.cover(r[i][0], r[i][1], {}) > -0.3) { prev = null; continue; }               // over asphalt: no bed
          const nx = -tz, nz = tx, x = r[i][0], z = r[i][1];
          const h = 1.6, by = 0.027;
          const v0 = Bed.vert(x + nx * h, by, z + nz * h, (x + nx * h) / 3.2, (z + nz * h) / 3.2), v1 = Bed.vert(x - nx * h, by, z - nz * h, (x - nx * h) / 3.2, (z - nz * h) / 3.2);
          if (prev) Bed.quad(prev[0], prev[1], v1, v0);
          prev = [v0, v1];
        }
      }
    };
    for (const p of pts) { if (L.insideBuilding(p[0], p[1], 0)) flush(); else run.push(p); }
    flush();
  }
  return n;
}

/** speed-camera boxes (OSM FURNITURE kind speed_camera: 7 in the west, along Nevsky): a grey box on a slim black pole 5.5 m beside the kerb with a short arm over the lane, looking along
 *  the traffic (docs/research/west-life-furniture.md 3.3: "grey boxes on the mast arms, no flash"). Merged into the shared poles VB; with ctx.knock (kposts = shared.kposts of furn.js makeKnockPosts)
 *  each camera is a knockable record of its own model (a 5.5 m steel pole with the box on the arm: 120 kg, anchored 18 km/h). */
export function buildSpeedCameras(ctx, net, poles, kposts = null) {
  let n = 0;
  for (const f of FURNITURE) {
    if (f.kind !== 'speed_camera' || L.insideBuilding(f.x, f.z, 0.3) || deckAt(f.x, f.z, 1)) continue;
    const h = nearestWay(net, f.x, f.z, 14, 2); if (!h) continue;
    const { w, i, q } = h, s = w.s[i] + (w.s[i + 1] - w.s[i]) * q.t, at = wayAt(w, s);
    const side = q.side >= 0 ? 1 : -1, edge = side > 0 ? at.hR : at.hL, nx = -at.tz * side, nz = at.tx * side;
    const off = Math.max(edge + KERB_W + 0.45, Math.hypot(f.x - at.x, f.z - at.z));          // behind the kerb
    const x = at.x + nx * off, z = at.z + nz * off;
    if (!poleClear(net, x, z, 0.4)) continue;
    const dir = w.oneway ? 1 : (side > 0 ? 1 : -1), ry = Math.atan2(at.tx * dir, at.tz * dir);
    const draw = (V, ox, oy, oz) => {                                  // the camera relative to (ox, oy, oz): (0, 0, 0) = the shared VB in world coordinates; (x, WALK_Y, z) = a local model with its foot at the origin
      V.cyl(0.055, 0.085, 5.5, '#26292b', [x - ox, WALK_Y - oy + 2.75, z - oz], null, 6, null, true);
      V.rod([x - ox, WALK_Y - oy + 5.3, z - oz], [x - ox - nx * 1.0, WALK_Y - oy + 5.45, z - oz - nz * 1.0], 0.035, '#26292b', 3, true);
      V.box(0.3, 0.26, 0.55, '#8d9296', [x - ox - nx * 1.1, WALK_Y - oy + 5.35, z - oz - nz * 1.1], [0, ry, 0]);
      V.box(0.12, 0.1, 0.06, '#1b1d20', [x - ox - nx * 1.1 + Math.sin(ry) * 0.29, WALK_Y - oy + 5.33, z - oz - nz * 1.1 + Math.cos(ry) * 0.29], [0, ry, 0]);   // the lens window
    };
    if (!kposts) draw(poles, 0, 0, 0);
    const item = ctx.physics.addCylinder(x, z, 0.14, 0, 5.5);
    if (kposts) kposts.add({ group: 'camera', model: kposts.model('camera|' + n, (V) => draw(V, x, WALK_Y, z)), x, z, rotY: 0, item, rec: { kind: 'camera', mass: 120, h: 5.5, r: 0.1, anchored: 18, hitK: 0.25, metal: true } });
    n++;
  }
  return n;
}

/** Taxi-rank and coach-bay signs (blue P over a plate) at the places where the traffic module parks its taxis / tour coaches (traffic/parking.js: RANKS / TOURS; the positions below are the REAR
 *  car of every row as printed by `node tools/traffic-test.mjs --parked`, heading in degrees). The sign stands behind the kerb 3.9 m before the rear bumper, facing the approaching traffic.
 *  tallSign(tex, x, z, nx, nz) from signals.js. Returns the number of signs placed. */
export const TAXI_RANKS = [
  { x: -2273.6, z: -421.8, rot: -143, name: 'Admiralteysky corner' }, { x: -1001.9, z: -36.8, rot: 63, name: 'Gostiny Dvor, Sadovaya' }, { x: -1542.6, z: -162.3, rot: -111, name: 'Kazan' },
  { x: -2460.5, z: -126.5, rot: 121, name: 'Blue Bridge' }, { x: -1827.3, z: -317.1, rot: 154, name: 'Kazan Square north' },
];
export const COACH_BAYS = [
  { x: -2456.2, z: -222.0, rot: 37, name: "St Isaac's loop north" }, { x: -2493.0, z: -270.3, rot: 37, name: "St Isaac's loop south" },
];
export function placeBaySigns(net, tallSign, tex, list) {
  let n = 0;
  for (const r of list) {
    const a = r.rot * Math.PI / 180, fx = Math.sin(a), fz = Math.cos(a);
    let best = null;
    const bx = r.x - fx * 3.9, bz = r.z - fz * 3.9;                     // the sign's place along the row
    for (const side of [1, -1]) {                                       // the kerb side: the nearer edge of the asphalt, measured from that point across the pocket
      const nx = -fz * side, nz = fx * side;
      for (let k = 0.6; k < 14; k += 0.2) if (net.cover(bx + nx * k, bz + nz * k, {}) < -0.3) { if (!best || k < best.k) best = { k, nx, nz }; break; }
    }
    if (!best) continue;
    const off = best.k + KERB_W + 0.45, at = nudgeClear(net, bx + best.nx * off, bz + best.nz * off, fx, fz, best.nx, best.nz, 6, -1);       // clear of the asphalt: shifts along the row / outward, else dropped
    if (!at) continue;
    tallSign(tex, at[0], at[1], -fx, -fz); n++;
  }
  return n;
}
