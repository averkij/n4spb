// Lakhta Center's five square petals rotate about their OWN centres, rather
// than rotating a whole star. Based on GORPROJECT's four-stage geometry diagram
// and the designer's 2019 structural paper; dimensions/photos in the dossier.
import * as THREE from 'three';
import { ringFromFlat, addPolyColliders } from '../lib/massing.js';
import { LAKHTA_CENTER } from './groups.js';

const TAU = Math.PI * 2, [CX, CZ] = LAKHTA_CENTER;
// Surveyed first-floor five-point star: each outer corner defines its wing
// axis. The 16th floor is 4% wider; the shoulders then diminish continuously.
const BASE_ANGLE = -175.8805471337 * Math.PI / 180;
const PROFILE = [[0, 36.2], [12, 36.6], [64, 37.65], [115, 35.0],
  [231, 30.0], [300, 24.4], [344.4, 20.3], [377.35, 14.8],
  [404, 10.1], [433, 5.1], [461.1, 0.40], [462, 0.035]];
export const TOWER_SPEC = { x: CX, z: CZ, height: 462, floors: 87, facadeBay: 1.5,
  facadeFloor: 4.2, petalTwistDegrees: 90, widestRadius: 37.65,
  spireBase: 344.4, meshCrownBase: 377.35, callbacks: 0 };

function radiusAt(y) {
  let i = 1; while (i < PROFILE.length - 1 && PROFILE[i][0] < y) i++;
  const A = PROFILE[i - 1], B = PROFILE[i], t = Math.max(0, Math.min(1, (y - A[0]) / (B[0] - A[0])));
  // C1 smoothstep removes angular shelves at the old OSM level boundaries.
  // The closely spaced upper samples keep the crown taper pointed.
  return A[1] + (B[1] - A[1]) * t;
}

// A ray from the core through each rotated square petal. Its union with the
// core gives the real five-wing form: the lobes change their exposed faces
// while the tower's centre stays fixed. Rotation is counter-clockwise in plan.
const profiles = new Map();
function connectedPetal(spin) {
  const key = Math.round(spin * 1e7);
  if (profiles.has(key)) return profiles.get(key);
  const pts = [];
  for (let i = 0; i < 32; i++) pts.push([Math.cos(i * TAU / 32) * .693, Math.sin(i * TAU / 32) * .693]);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 - spin;
    pts.push([.60 + .4 * Math.cos(a), .4 * Math.sin(a)]);
  }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const lower = [], upper = [];
  for (const p of pts) { while (lower.length > 1 && cross(lower.at(-2), lower.at(-1), p) <= 0) lower.pop(); lower.push(p); }
  for (const p of [...pts].reverse()) { while (upper.length > 1 && cross(upper.at(-2), upper.at(-1), p) <= 0) upper.pop(); upper.push(p); }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  const planes = hull.map((p, i) => {
    const q = hull[(i + 1) % hull.length], dx = q[0] - p[0], dz = q[1] - p[1];
    return [dz, -dx, dz * p[0] - dx * p[1]];
  });
  // Authoring-only immutable cross sections. The cache is bounded and is
  // released after build; nothing survives into the frame loop.
  if (profiles.size >= 512) profiles.delete(profiles.keys().next().value);
  profiles.set(key, planes); return planes;
}
function wingExit(angle, wing, planes) {
  const a = angle - BASE_ANGLE - wing * TAU / 5, dx = Math.cos(a), dz = Math.sin(a);
  let exit = Infinity;
  for (const [nx, nz, c] of planes) {
    const d = nx * dx + nz * dz;
    if (d > 1e-9) exit = Math.min(exit, c / d);
  }
  return exit;
}

export function towerPoint(y, a, offset = 0) {
  const t = Math.min(1, Math.max(0, y / 377.35)), spin = t * Math.PI / 2;
  const planes = connectedPetal(spin);
  let r = 0.693;
  for (let i = 0; i < 5; i++) r = Math.max(r, wingExit(a, i, planes));
  // The upper technical crown has a five-sided, steel-mesh enclosure. Blend
  // its ring into the inhabited shoulders; there is no separate floating cap.
  const crown = Math.max(0, Math.min(1, (y - 344.4) / 32.95));
  const phase = BASE_ANGLE - 0.255;
  const rel = ((a - phase + Math.PI / 5) % (TAU / 5) + TAU / 5) % (TAU / 5) - Math.PI / 5;
  const pent = Math.cos(Math.PI / 5) / Math.cos(rel);
  r = r * (1 - crown) + pent * crown;
  r = r * radiusAt(y) + offset;
  return [CX + Math.cos(a) * r, y, CZ + Math.sin(a) * r];
}

// Smooth normals on the curved glass preserve its long reflected highlights.
// The shell is immutable, one material, with a bounded indexed buffer.
function shell(P, mat, y0, y1, step, sections = 100) {
  const pos = [], nrm = [], uv = [], idx = [], rows = Math.ceil((y1 - y0) / step);
  for (let j = 0; j <= rows; j++) {
    const y = y0 + (y1 - y0) * j / rows;
    for (let i = 0; i <= sections; i++) {
      const a = BASE_ANGLE + i / sections * TAU, p = towerPoint(y, a);
      const A = towerPoint(y, a - 0.0004), B = towerPoint(y, a + 0.0004);
      const C = towerPoint(Math.max(0, y - 0.03), a), D = towerPoint(Math.min(462, y + 0.03), a);
      const n = new THREE.Vector3(B[0] - A[0], 0, B[2] - A[2])
        .cross(new THREE.Vector3(D[0] - C[0], D[1] - C[1], D[2] - C[2])).normalize();
      if (n.x * Math.cos(a) + n.z * Math.sin(a) < 0) n.negate();
      pos.push(...p); nrm.push(n.x, n.y, n.z);
      // 16,505 actual cold-bent panes are represented in the shared curtain
      // wall shader, rather than thousands of separate meshes/materials.
      uv.push(i / sections * 158, y / 4.2);
      if (i < sections && j < rows) {
        const k = j * (sections + 1) + i;
        idx.push(k, k + sections + 1, k + 1, k + 1, k + sections + 1, k + sections + 2);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  P.far = Infinity; P.geo(mat, g); g.dispose();
}

export function buildTower({ ctx, P, M, record, service }) {
  const start = P.tris;
  shell(P, M.towerGlass, 0, 377.35, 4.2);
  shell(P, M.crown, 377.35, 462, 4.2, 50);
  // Ten fine maintenance-rail seams trace the petal corners. The major five
  // dark/silver reveals stay in the skyline; narrow ribs have authored ranges.
  for (let wing = 0; wing < 5; wing++) for (const corner of [0, Math.PI / 2]) {
    const path = [];
    for (let y = 0; y <= 377.35 + 0.01; y += 4.2) {
      const h = Math.min(y, 377.35), spin = Math.min(1, h / 377.35) * Math.PI / 2;
      const local = corner - spin, a0 = BASE_ANGLE + wing * TAU / 5;
      const a = a0 + Math.atan2(0.4 * Math.sin(local), 0.60 + 0.4 * Math.cos(local));
      path.push(towerPoint(h, a, 0.11));
    }
    // The last occupied facade row and the technical crown share one seam.
    const last = path[path.length - 1], aLast = Math.atan2(last[2] - CZ, last[0] - CX);
    for (let y = 377.35; y <= 462; y += 4.2) path.push(towerPoint(Math.min(y, 462), aLast, 0.08));
    path.push(towerPoint(462, aLast, 0.02));
    P.far = corner === 0 ? Infinity : 2100;
    P.beam(M.reveal, path, corner === 0 ? 0.48 : 0.28, 0.20);
    P.far = 2200; P.beam(M.silver, path, 0.12, 0.24);
  }
  // The upper 85m is steel mesh rather than a stack of opaque office floors.
  // Lattice is separate short-range detail, never a replacement for the spire.
  P.far = 1600;
  for (let j = 0; j < 10; j++) {
    const ya = 377.55 + j * 8.35, yb = Math.min(461.2, ya + 8.35);
    for (let i = 0; i < 10; i++) {
      const a = BASE_ANGLE + i * TAU / 10, b = a + TAU / 10;
      P.cyl(M.mesh, towerPoint(ya, a, 0.06), towerPoint(yb, b, 0.06), 0.045, 0.045, 4, false);
      P.cyl(M.mesh, towerPoint(ya, b, 0.06), towerPoint(yb, a, 0.06), 0.045, 0.045, 4, false);
    }
  }
  // Building-wall colliders follow the mapped ground footprint. Upper tapered
  // surfaces are captured by the normal roof map; no 462m rectangular barrier.
  for (const poly of record('r18102140').polys) addPolyColliders(ctx, poly, 0, 8.4, 0.28);
  // A narrow lower edge fills every mapped facade edge exactly. It bridges the
  // surveyed polygon and the smoothly curving outer glass without stone walls.
  P.far = 1000;
  for (const poly of record('r18102140').polys) {
    const ring = ringFromFlat(poly.o);
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      P.cyl(M.silver, [a[0], .18, a[1]], [b[0], .18, b[1]], .11, .11, 4);
    }
  }
  service.parts.tower = { ...TOWER_SPEC, triangles: P.tris - start };
  service.monuments.push({ id: 'r18102137', name: 'Лахта Центр', x: CX, z: CZ, h: 462 });
  profiles.clear();
}
