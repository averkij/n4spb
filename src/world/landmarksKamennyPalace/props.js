// landmarksKamennyPalace/props.js - the furniture of the closed garden, drawn because it is seen over the fence and through the gates (dossier 5.1, 8: "the 45 benches inside the garden and the white slatted bench model,
// cast park lamps"; photos P12 P14 P20 P22 P05 P11):
//   the white slatted BENCH with cast-iron ends (1.9 m: five seat slats, four back slats, two S-shaped cast ends), placed at the 45 OSM nodes inside the garden (amenity=bench, x > -2830), turned to face the nearest path;
//   the cast-iron PARK LAMP (black fluted post 3.7 m, a square lantern with white glass and a pyramid cap) along the central alley (church gate -> court) and round the palace apron (lamps are not mapped in OSM);
//   the rough stone URN on the lawn (P11).
// Each bench / lamp is its own small mesh: the engine classes them by size, merges them per cell and hides them with distance.
import * as THREE from 'three';
import * as CITY from '../data/city.js';
import { geosOf, put } from './objs.js';
import { W } from './frame.js';

const stage = (K, name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksKamennyPalace] props/${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };

function benchGeo(M) {
  return geosOf((P) => {
    for (let i = 0; i < 5; i++) P.box(M.wood, -0.95, 0.95, 0.43 + 0.0, 0.5, -0.24 + i * 0.1, -0.24 + i * 0.1 + 0.085, 'b', 1);                // seat slats (z toward the sitter: the back is at -z)
    for (let i = 0; i < 4; i++) { const g = new THREE.BoxGeometry(1.9, 0.09, 0.03); P.geo(M.wood, g, 0, 0.62 + i * 0.12, -0.3 - i * 0.025, -0.2, 0, 0); g.dispose(); }
    for (const sx of [-0.9, 0.9]) {
      P.box(M.iron, sx - 0.03, sx + 0.03, 0, 0.45, -0.22, -0.16, 'b', 1); P.box(M.iron, sx - 0.03, sx + 0.03, 0, 0.45, 0.2, 0.26, 'b', 1);
      const g = new THREE.BoxGeometry(0.06, 0.62, 0.05); P.geo(M.iron, g, sx, 0.74, -0.31, -0.2, 0, 0); g.dispose();
      P.box(M.iron, sx - 0.035, sx + 0.035, 0.45, 0.49, -0.26, 0.28, 'b', 1);
      const sc = new THREE.TorusGeometry(0.07, 0.022, 5, 8, Math.PI * 1.5); P.geo(M.iron, sc, sx, 0.2, 0.3, 0, Math.PI / 2, 0); sc.dispose();
    }
  });
}
function lampGeo(M) {
  return geosOf((P) => {
    P.cyl(M.iron, [0, 0, 0], [0, 0.55, 0], 0.17, 0.11, 8, true);
    P.cyl(M.iron, [0, 0.55, 0], [0, 2.9, 0], 0.075, 0.055, 8, false);
    P.cyl(M.iron, [0, 2.9, 0], [0, 3.0, 0], 0.11, 0.11, 8, true);
    P.box(M.iron, -0.2, 0.2, 3.0, 3.06, -0.2, 0.2, 'b', 1);
    P.box(M.lampGlass, -0.17, 0.17, 3.06, 3.5, -0.17, 0.17, 'tb', 1);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.box(M.iron, sx * 0.17 - 0.015, sx * 0.17 + 0.015, 3.06, 3.5, sz * 0.17 - 0.015, sz * 0.17 + 0.015, 'b', 1);
    const a = 0.24, t = [[-a, -a], [a, -a], [a, a], [-a, a]];
    for (let i = 0; i < 4; i++) { const p = t[i], q = t[(i + 1) % 4], mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2, l = Math.hypot(mx, mz); P.fan(M.iron, [[p[0], 3.5, p[1]], [q[0], 3.5, q[1]], [0, 3.85, 0]], [mx / l * 0.8, 0.6, mz / l * 0.8]); }
    P.box(M.iron, -0.24, 0.24, 3.5, 3.54, -0.24, 0.24, 'b', 1);
  });
}

/** the nearest point of a path polyline to (x, z) within r: [px, pz] or null */
function nearestPath(paths, x, z, r) {
  let best = null, bd = r;
  for (const pts of paths) for (let i = 0; i + 3 < pts.length; i += 2) {
    const ax = pts[i], az = pts[i + 1], bx = pts[i + 2], bz = pts[i + 3], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(px - x, pz - z);
    if (d < bd) { bd = d; best = [px, pz]; }
  }
  return best;
}

function urnGeo(M) {
  return geosOf((P) => {
    P.box(M.surround, -0.27, 0.27, 0, 0.55, -0.27, 0.27, 'b', 1);
    P.box(M.surround, -0.33, 0.33, 0.55, 0.66, -0.33, 0.33, 'b', 1);
    const prof = [[0, 0.66], [0.16, 0.66], [0.2, 0.72], [0.22, 0.9], [0.34, 1.08], [0.42, 1.2], [0.38, 1.26], [0.3, 1.24], [0, 1.2]];
    const g = new THREE.LatheGeometry(prof.map((q) => new THREE.Vector2(q[0], q[1])), 14); P.geo(M.surround, g); g.dispose();
  });
}

export function build(K) {
  const M = K.M, root = K.root, svc = K.svc;
  let tris = 0;
  stage(K, 'benches', () => {
    const bench = benchGeo(M);
    const paths = CITY.ROADS.filter((r) => ['footway', 'path', 'service'].includes(r.hw) && r.pts.some((v, i) => i % 2 === 0 && v > -2860 && v < -2560 && r.pts[i + 1] > -5420 && r.pts[i + 1] < -5200)).map((r) => r.pts);
    for (const f of CITY.FURNITURE) {
      if (f.kind !== 'bench' || f.x < -2830 || f.x > -2540 || f.z > -5240 || f.z < -5430) continue;
      const q = nearestPath(paths, f.x, f.z, 14), tx = q ? q[0] : -2611, tz = q ? q[1] : -5284;
      const rot = Math.atan2(tx - f.x, tz - f.z);                                // local +z (the sitter side) toward the path
      tris += put(root, bench, f.x, 0, f.z, rot, 1, 'kpal-bench');
      svc.benches.push({ x: f.x, z: f.z, rotY: rot, id: f.id });
    }
  });
  stage(K, 'lamps', () => {
    const lamp = lampGeo(M), spots = [];
    // the central alley (church gate -> the court): w270366905 runs (-2816.2,-5391.7) -> (-2641.9,-5302.8): a lamp every 24 m, alternating sides 3.4 m off the axis
    const a = [-2816.2, -5391.7], b = [-2641.9, -5302.8], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
    for (let s = 14, i = 0; s < L - 10; s += 24, i++) { const sd = i % 2 ? 3.4 : -3.4; spots.push([a[0] + ux * s - uz * sd, a[1] + uz * s + ux * sd]); }
    // the apron of the palace (palace frame x, z): two on the river front, two at the court, two at the wing ends (P05: a lamp stands 2 m from the corner)
    for (const [x, z] of [[-30, 5.5], [30, 5.5], [-13, 6], [14, 6], [-12, -29], [12, -29], [-46, -17], [46, -17]]) { const w = W(x, z); spots.push([w.x, w.z]); }
    for (const [x, z] of spots) { tris += put(root, lamp, x, 0, z, 0, 1, 'kpal-lamp'); svc.lamps.push({ x, z, h: 3.85 }); }
  });
  stage(K, 'urns', () => {
    const urn = urnGeo(M);
    for (const [x, z] of [[-23, 11], [24, 11]]) { const w = W(x, z); tris += put(root, urn, w.x, 0, w.z, 0, 1, 'kpal-urn'); }
  });
  K.extraTris += tris;
  if (K.errs) throw new Error(K.errs.join('\n'));
}
