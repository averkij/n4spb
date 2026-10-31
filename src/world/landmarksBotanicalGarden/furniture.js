// landmarksBotanicalGarden/furniture.js - the PARK FURNITURE KIT of the garden (a kit local to the module; the props owner takes it over later, dossier 4.1d / 7, photos 53 84 90):
//   * BENCHES: the 62 OSM bench nodes inside the park polygon r11561805 (every one of the dossier's "98 benches in the bbox" that stands in the garden itself): a black cast-iron frame (two flat end
//     frames with a cross bar and a diagonal) and green-painted slats (3 for the seat, 3 for the back), 1.8 m, the front towards the nearest path, nudged off any carriageway;
//   * LAMPS: black cast-iron posts 3.6 m with a collar, a bracket scroll and a cage lantern with a white globe every ~26 m along the paved alleys (the Central alley w141255459, the Alley of the
//     Caring Petersburgers, the paving-stone and asphalt footways of the park), alternating sides 1.7 m off the axis, never on a carriageway, never inside a building.
// Instanced (one InstancedMesh per material, split in the engine's cells); services: benches [{ x, z, rotY, len }] and lamps [{ x, z, h }] (props skips its OSM bench nodes at the same points once the
// lead lists this module, docs/research/islands2-requests-landmarksBotanicalGarden.md).  Colliders: a thin box per bench, a cylinder per lamp.
import { GREEN, ROADS, FURNITURE } from '../data/city.js';
import { PAVED_RINGS } from './groups.js';
import * as L from '../layout.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { revolve } from './geo.js';
import { stage } from './shell.js';
import { onRoad } from './frame.js';

function benchParts(Q, M) {                                                 // frame: bench centre on the ground, the seat faces +z, length 1.8 along x (about 60 triangles)
  for (const s of [-1, 1]) {
    const x = s * 0.82;
    Q.box(M.iron, x - 0.025, x + 0.025, 0, 0.44, 0.17, 0.23, 'b', 1);                // front leg
    Q.box(M.iron, x - 0.025, x + 0.025, 0, 0.92, -0.25, -0.19, 'b', 1);              // rear leg / back post
    Q.box(M.iron, x - 0.025, x + 0.025, 0.40, 0.46, -0.22, 0.2, 'b', 1);             // seat rail
  }
  Q.box(M.slat, -0.88, 0.88, 0.46, 0.5, -0.22, 0.24, 'b', 1);                          // the seat: three slats in one textured box
  Q.box(M.slat, -0.88, 0.88, 0.58, 0.88, -0.28, -0.25, 'b', 1);                        // the back
}
function lampParts(Q, M) {                                                  // a cast-iron post 3.6 m with a lantern (frame: foot at the origin; about 130 triangles)
  revolve(Q, M.iron, [[0.0, 0.0], [0.24, 0.0], [0.17, 0.3], [0.08, 0.55], [0.065, 0.62], [0.065, 2.45], [0.1, 2.52], [0.0, 2.58]], 6, { crease: 40, uRep: 1, vTile: 1 });
  Q.cyl(M.iron, [0.0, 2.55, 0.0], [0.0, 3.05, 0.0], 0.05, 0.04, 5, false);
  Q.cyl(M.lampGlass, [0, 3.05, 0], [0, 3.5, 0], 0.17, 0.2, 6, false);                 // the globe / lantern glass
  revolve(Q, M.iron, [[0.0, 3.5], [0.24, 3.5], [0.14, 3.68], [0.0, 3.8]], 6, { crease: 50, uRep: 1, vTile: 1 });
}

const park = GREEN.find((g) => g.id === 'r11561805');
const inRing = (o, x, z) => { let c = false; for (let i = 0, j = o.length / 2 - 1; i < o.length / 2; j = i++) { const xi = o[i * 2], zi = o[i * 2 + 1], xj = o[j * 2], zj = o[j * 2 + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
const inPark = (x, z) => !!park && park.polys.some((p) => inRing(p.o, x, z) && !(p.h || []).some((h) => inRing(h, x, z)));

/** the footprint of a bench (1.9 x 0.6 m, long axis along its local x) must clear the asphalt: nine sample points */
function benchClear(ctx, x, z, rot, margin = 0.15) {
  const c = Math.cos(rot), sn = Math.sin(rot);
  for (const [u, v] of [[0, 0], [-0.95, 0], [0.95, 0], [-0.95, -0.3], [0.95, -0.3], [-0.95, 0.3], [0.95, 0.3], [0, -0.3], [0, 0.3]]) if (onRoad(ctx, x + u * c + v * sn, z - u * sn + v * c, margin)) return false;
  return true;
}

function benches(K) {
  const ctx = K.ctx, M = K.M, ph = ctx.physics, list = [], mats = [], net = ctx.services.streets && ctx.services.streets.net;
  let moved = 0, dropped = 0;
  for (const f of FURNITURE) {
    if (f.kind !== 'bench' || !inPark(f.x, f.z)) continue;
    let x = f.x, z = f.z, rot = 0;
    const faceNearest = () => { const near = L.roadsNear(x, z, 9, {}).filter((r) => r.road && L.WALKWAYS.has(r.road.hw))[0]; return near ? Math.atan2(near.x - x, near.z - z) : 0; };
    rot = faceNearest();
    for (let k = 0; k < 6 && !benchClear(ctx, x, z, rot) && net; k++) {                  // slide off the asphalt of the park's service drives (the OSM node stands on the lane edge)
      const gx = net.cover(x + 0.3, z, {}) - net.cover(x - 0.3, z, {}), gz = net.cover(x, z + 0.3, {}) - net.cover(x, z - 0.3, {}), l = Math.hypot(gx, gz) || 1;
      x -= gx / l * 0.5; z -= gz / l * 0.5; rot = faceNearest(); moved++;
    }
    if (!benchClear(ctx, x, z, rot) || L.insideBuilding(x, z, 0.4)) { dropped++; continue; }
    list.push({ x, z, rotY: rot, len: 1.8, id: f.id }); mats.push(mat4(x, 0, z, rot, 1));
    ph.addBox(x, z, 1.9, 0.6, rot, 0, 0.9);
  }
  const parts = partsGeos((Q) => benchParts(Q, M));
  K.extraTris += addInstanced(ctx, K.root, 'bg-benches', parts, mats).tris;
  K.svc.benches = list; K.svc.benchStats = { placed: list.length, moved, dropped };
}

function lamps(K) {
  const ctx = K.ctx, M = K.M, ph = ctx.physics, out = [], mats = [];
  const paved = (r) => ['footway', 'path', 'pedestrian'].includes(r.hw) && (r.name || r.surface === 'paving_stones' || r.surface === 'asphalt') && !r.bridge && !r.tunnel && r.w >= 2.2;
  const taken = [], keepFree = PAVED_RINGS.filter((r) => r.id === 'institute-forecourt' || r.id === 'director-lawn').map((r) => r.ring);       // the open forecourts in front of the Institute porch and the Director's loggia carry no lamps (photos 49 50 43)
  const free = (x, z) => !taken.some((t) => Math.hypot(t[0] - x, t[1] - z) < 14);
  for (const r of ROADS) {
    if (!paved(r)) continue;
    const p = r.pts; let carry = 13, side = 1;
    for (let i = 0; i + 3 < p.length; i += 2) {
      const ax = p[i], az = p[i + 1], bx = p[i + 2], bz = p[i + 3], l = Math.hypot(bx - ax, bz - az); if (l < 0.5) continue;
      const ux = (bx - ax) / l, uz = (bz - az) / l;
      let t = carry;
      for (; t < l; t += 26) {
        const x = ax + ux * t - uz * 1.7 * side, z = az + uz * t + ux * 1.7 * side; side = -side;
        if (!inPark(x, z) || keepFree.some((r) => inRing(r, x, z)) || onRoad(ctx, x, z, 0.1) || L.insideBuilding(x, z, 0.8) || !free(x, z)) continue;
        taken.push([x, z]); out.push({ x, z, h: 3.8, kind: 'garden' }); mats.push(mat4(x, 0, z, 0, 1)); ph.addCylinder(x, z, 0.22, 0, 3.8);
      }
      carry = t - l;
    }
  }
  const parts = partsGeos((Q) => lampParts(Q, M));
  K.extraTris += addInstanced(ctx, K.root, 'bg-lamps', parts, mats).tris;
  K.svc.lamps = out;
}

export function build(K) {
  stage(K, 'benches', () => benches(K));
  stage(K, 'lamps', () => lamps(K));
  if (K.errs && K.errs.length) throw new Error('furniture: ' + K.errs.join('\n'));
}
