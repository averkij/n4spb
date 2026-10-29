// landmarksMarineFacade/quay.js - the berth-wall furniture of the passenger port (dossier 4.5; photos V 16, V 83): blue cylindrical rubber fenders hung on the concrete wall face every 12 m (instanced, top 0.6 m
// below the coping), the yellow / black hazard strip on the coping, and a few white-blue pilot kiosks on the edge.  The wall, its coping and the cast-iron bollards belong to environment (vo-banks STYLE.PORT);
// this module never redraws the wall: the edge is measured from the water raster (frame.js quayEdge).  Yellow mushroom bollards: request to environment (docs/research/vo-requests-landmarksMarineFacade.md).
import { FW, quayEdge, U_DIR, V_DIR } from './frame.js';
import * as L from '../layout.js';
import { addInstanced, partsGeos, mat4, kFurn } from './inst.js';
import { coverFn } from './surfaces.js';

const WALLS = [
  { key: 'south', from: 10, to: 596, out: V_DIR, sign: 1 },                 // param u; the water is on the +v side of the edge
  { key: 'east', from: 10, to: 800, out: U_DIR, sign: 1 },                  // param v; the water is on the +u side
  { key: 'north', from: 82, to: 636, out: V_DIR, sign: -1 },               // param u; the water is on the -v side
];
const at = (w, s, e) => (w.key === 'south' ? FW(s, e) : w.key === 'east' ? FW(e, s) : FW(s, e));

/** the measured quay edge of one wall, sampled every `step` m and smoothed: [{ s, e, x, z }] */
export function edgeLine(w, step = 3) {
  const raw = [];
  for (let s = w.from; s <= w.to + 1e-6; s += step) { const e = quayEdge(w.key, s); if (e != null) raw.push({ s, e }); }
  return raw.map((p, i) => { const q = raw[Math.max(0, i - 1)], r = raw[Math.min(raw.length - 1, i + 1)]; const e = (q.e + p.e + r.e) / 3, w0 = at(w, p.s, e); return { s: p.s, e, x: w0.x, z: w0.z }; });
}

/** a flat strip along a polyline with the uv running along it (tile metres per repeat) */
function strip(P, mat, pts, width, y, tile) {
  let acc = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz); if (l < 0.05) continue;
    const nx = -dz / l * width / 2, nz = dx / l * width / 2;
    P.quad(mat, [a.x + nx, y, a.z + nz], [b.x + nx, y, b.z + nz], [b.x - nx, y, b.z - nz], [a.x - nx, y, a.z - nz], [0, 1, 0], [[acc / tile, 0], [(acc + l) / tile, 0], [(acc + l) / tile, 1], [acc / tile, 1]]);
    acc += l;
  }
}

/** the berth apron on the ground behind the wall: a light concrete strip 5.3 m wide (0.75 .. 6 m inland of the edge, 3 m slabs with dark joints) and the dark asphalt apron up to 21 m; pieces with a corner or the
 *  middle on the carriageway, inside a building or on a fence line are left out (road integrity; the real roads are asphalt anyway) */
function apron(K, w, line, cover) {
  const { P, M, svc } = K, o = [w.out[0] * w.sign, w.out[1] * w.sign];
  const ok = (x, z) => cover(x, z) < -0.15 && !L.insideBuilding(x, z, 0.3);
  let n = 0;
  for (let i = 0; i + 1 < line.length; i++) {
    const a = line[i], b = line[i + 1];
    const pt = (p, d) => [p.x - o[0] * d, p.z - o[1] * d];
    for (const [d0, d1, mat, y] of [[0.75, 6.0, M.berth, 0.052], [6.0, 21.0, M.apron, 0.048]]) {
      const c = [pt(a, d0), pt(b, d0), pt(b, d1), pt(a, d1)], mx = (c[0][0] + c[2][0]) / 2, mz = (c[0][1] + c[2][1]) / 2;
      if (!c.every((q) => ok(q[0], q[1])) || !ok(mx, mz)) continue;
      P.quad(mat, [c[0][0], y, c[0][1]], [c[1][0], y, c[1][1]], [c[2][0], y, c[2][1]], [c[3][0], y, c[3][1]], [0, 1, 0], c.map((q) => [q[0] / 3, q[1] / 3]));
      n++;
    }
  }
  svc.counts.apronQuads = (svc.counts.apronQuads || 0) + n;
}

export function build(K) {
  const { ctx, P, M, svc } = K, cover = coverFn(ctx);
  const geo = partsGeos((Q) => {
    Q.col(M.fender, 0, 0, -0.5, 0.5, 0.35, 0.35, 8, true);                                    // the rubber cylinder d 0.7 m, 1.0 m long (axis vertical)
    Q.box(M.black, -0.42, 0.42, -0.55, 0.55, -0.58, -0.36, '', 1);                            // the dark frame plate on the wall (local -z = the wall side)
  });
  const list = [];
  let nHaz = 0;
  for (const w of WALLS) {
    const line = edgeLine(w, 3);
    if (line.length < 4) { console.warn('[landmarksMarineFacade/quay] no edge for', w.key); continue; }
    const o = [w.out[0] * w.sign, w.out[1] * w.sign], rotY = Math.atan2(o[0], o[1]);
    // hazard strip on the coping: 0.30 m wide, centred 0.3 m inland of the water edge (the coping is flat at +0.17)
    const hz = line.map((p) => ({ x: p.x - o[0] * 0.32, z: p.z - o[1] * 0.32 }));
    strip(P, M.hazard, hz, 0.3, 0.2, 1.2); nHaz += hz.length - 1;
    apron(K, w, line, cover);
    // fenders every 12 m: hung 0.38 m in front of the wall face, centre 1.1 m below the coping
    for (let i = 4; i < line.length - 2; i += 4) { const p = line[i]; list.push(mat4(p.x + o[0] * 0.40, -1.1, p.z + o[1] * 0.40, rotY, 1)); }
    svc.edges = svc.edges || {}; svc.edges[w.key] = line.filter((p, i) => i % 10 === 0).map((p) => [Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10]);
  }
  K.extraTris += addInstanced(ctx, K.root, 'lmmarin-fenders', geo, list).tris;
  svc.counts.fenders = list.length; svc.counts.hazardSegments = nHaz;
  // pilot / gangway kiosks (white, blue roof 1.2 x 1.2 x 2.4 m) beside the berths where the liners lie
  // n4spb (docs/gdm-M.md): the kiosks are knock records (drawn once at the origin, placed per kiosk; the collider stays where it was)
  const ks = [{ w: WALLS[0], s: 150 }, { w: WALLS[1], s: 90 }, { w: WALLS[1], s: 420 }], kspots = [], kitems = [];
  for (const k of ks) {
    const e = quayEdge(k.w.key, k.s); if (e == null) continue;
    const o = [k.w.out[0] * k.w.sign, k.w.out[1] * k.w.sign], c = at(k.w, k.s, e), x = c.x - o[0] * 3.2, z = c.z - o[1] * 3.2, rot = Math.atan2(o[0], o[1]);
    kspots.push({ x, y: 0, z, rotY: rot }); kitems.push(ctx.physics.addBox(x, z, 1.4, 1.4, rot, 0, 2.5));
  }
  const kgeo = partsGeos((Q) => { Q.box(M.kiosk, -0.6, 0.6, 0, 2.4, -0.6, 0.6, 'b', 1); Q.box(M.kioskRoof, -0.7, 0.7, 2.4, 2.55, -0.7, 0.7, 'b', 1); Q.box(M.doorGlass, -0.4, 0.4, 0.9, 1.9, 0.6, 0.62, '', 1); });
  kFurn(K, 'lmmarin-kiosk', kgeo, kspots, kitems, { kind: 'booth', mass: 450, h: 2.55, w: 1.4, d: 1.4, hitK: 0.6, minDv: 0.5 }, 300);
}
