// The real boomerang/courtyard plan, negatively inclined curtain walls,
// membrane roofs and glass atria. All ground edges follow the OSM survey.
// References: official roof close-ups, GORPROJECT elevations and aerial views.
import * as THREE from 'three';
import { ringFromFlat, signedArea, polyCentroid } from '../lib/massing.js';

const PATH = [[-9898, -6083], [-9820, -6085], [-9795, -6085], [-9780, -6096], [-9755, -6130], [-9714, -6185]];
function nearestPath(x, z, path) {
  let best = null, along = 0, total = 0;
  for (let i = 0; i < path.length - 1; i++) total += Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (len * len)));
    const px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(x - px, z - pz);
    if (!best || d < best.d) best = { d, s: (along + len * t) / total, x: px, z: pz, nx: -dz / len, nz: dx / len };
    along += len;
  }
  return best;
}

function roofHeight(x, z, admin = false) {
  if (admin) {
    // The third building has two cranked wings enclosing a courtyard; its
    // mapped 46.2m top is retained, with inclined tips and a low central bend.
    const t = Math.max(0, Math.min(1, (-x - 9959.6) / 263.7));
    return 25 + 21.2 * Math.abs(t - .43) / .57;
  }
  const p = nearestPath(x, z, PATH), t = p.s;
  const arm = t < .53 ? Math.pow((.53 - t) / .53, 1.14) : Math.pow((t - .53) / .47, 1.10) * .82;
  // The official varying height is23–85m. Adjacent membrane wings rise away
  // from the glazed longitudinal atrium, like the two sides of an iceberg.
  return Math.min(85, 23 + 62 * arm + Math.min(6, p.d * .15));
}

function pointIn(x, z, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

function roofTriangles(P, ring, height, materialAt) {
  const flat = ring.map(p => new THREE.Vector2(p[0], p[1]));
  const tris = THREE.ShapeUtils.triangulateShape(flat, []);
  function tri(a, b, c, level = 0) {
    const lengths = [Math.hypot(b[0] - a[0], b[1] - a[1]), Math.hypot(c[0] - b[0], c[1] - b[1]), Math.hypot(a[0] - c[0], a[1] - c[1])];
    const longest = Math.max(...lengths), mid = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
    if (longest > 9 && level < 7) {
      const i = lengths.indexOf(longest);
      if (i === 0) { const m = mid(a, b); tri(a, m, c, level + 1); tri(m, b, c, level + 1); }
      else if (i === 1) { const m = mid(b, c); tri(a, b, m, level + 1); tri(a, m, c, level + 1); }
      else { const m = mid(c, a); tri(a, b, m, level + 1); tri(m, b, c, level + 1); }
      return;
    }
    const points = [a, b, c].map(p => [p[0], height(...p), p[1]]);
    P.fan(materialAt((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3), points, [0, 1, 0]);
  }
  for (const t of tris) tri(ring[t[0]], ring[t[1]], ring[t[2]]);
}

function envelope(K, rec, height, roofMaterial, lean = 2.8) {
  const { ctx, P, M } = K;
  for (const poly of rec.polys) {
    let ring = ringFromFlat(poly.o); if (signedArea(ring) > 0) ring = [...ring].reverse();
    const centre = polyCentroid(poly);
    P.far = Infinity;
    roofTriangles(P, ring, height, roofMaterial);
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
      if (len < .1) continue;
      const norm = [-dz / len, 0, dx / len];
      const inward = p => { const d = Math.hypot(p[0] - centre[0], p[1] - centre[1]); return [p[0] + (centre[0] - p[0]) * lean / d, p[1] + (centre[1] - p[1]) * lean / d]; };
      const A = inward(a), B = inward(b), ya = height(...a), yb = height(...b);
      P.quad(M.complexGlass, [A[0], 0, A[1]], [B[0], 0, B[1]], [b[0], yb, b[1]], [a[0], ya, a[1]], norm,
        [[0, 0], [len / 1.5, 0], [len / 1.5, yb / 4.2], [0, ya / 4.2]]);
      // Silver membrane coping is a true lifted seam, not coplanar paint.
      P.far = 1400;
      P.cyl(M.silver, [a[0], ya + .12, a[1]], [b[0], yb + .12, b[1]], .19, .19, 5);
      P.far = 700;
      const bays = Math.max(1, Math.floor(len / 9));
      for (let j = 1; j < bays; j++) {
        const t = j / bays, u = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
        const v = [a[0] + dx * t, a[1] + dz * t], top = height(...v);
        P.cyl(M.silverShade, [u[0], .3, u[1]], [v[0], top, v[1]], .055, .055, 4);
      }
      // Sloping walls use bounded 4.2m bands rather than tall boxes outside
      // the visible negative-inclination facade. Thin wall colliders stay hollow.
      const rows = Math.ceil(Math.min(ya, yb) / 4.2);
      for (let j = 0; j < rows; j++) {
        const y0 = j * 4.2, y1 = Math.min(Math.min(ya, yb), (j + 1) * 4.2), t = (y0 + y1) / (ya + yb);
        const p = [A[0] + (a[0] - A[0]) * t, A[1] + (a[1] - A[1]) * t];
        const q = [B[0] + (b[0] - B[0]) * t, B[1] + (b[1] - B[1]) * t];
        ctx.physics.addBox((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, Math.hypot(q[0] - p[0], q[1] - p[1]), .28, Math.atan2(-(q[1] - p[1]), q[0] - p[0]), y0, y1);
      }
    }
  }
}

function roofRibs(K, rec, height, path) {
  const { P, M } = K;
  P.far = 1100;
  for (const poly of rec.polys) {
    const ring = ringFromFlat(poly.o);
    // Continuous glazed atrium and its curved white ribs are visible between
    // the two membrane wings. Sample in plan, clip to the actual roof outline.
    let accum = 0;
    for (let i = 0; i + 1 < path.length; i++) {
      const a = path[i], b = path[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nx = -(b[1] - a[1]) / len, nz = (b[0] - a[0]) / len;
      const count = Math.ceil(len / 5);
      for (let j = 0; j < count; j++) {
        const t = j / count, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
        const left = [x - nx * 7.5, z - nz * 7.5], right = [x + nx * 7.5, z + nz * 7.5];
        if (!pointIn(...left, ring) || !pointIn(...right, ring)) continue;
        const p = [];
        for (let k = 0; k <= 8; k++) {
          const s = k / 8, xx = left[0] + (right[0] - left[0]) * s, zz = left[1] + (right[1] - left[1]) * s;
          p.push([xx, height(xx, zz) + .16 + Math.sin(s * Math.PI) * 1.1, zz]);
        }
        P.beam(M.silver, p, .16, .20);
      }
      accum += len;
    }
    // Broad membranes have sparse raised parallel seams, not dark stone caps.
    P.far = 850;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length], c = polyCentroid(poly);
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 16) continue;
      const count = Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / 7);
      for (let j = 1; j < count; j++) {
        const t = j / count, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
        const q = nearestPath(x, z, path), ex = x + (q.x - x) * .73, ez = z + (q.z - z) * .73;
        if (!pointIn(ex, ez, ring)) continue;
        P.cyl(M.silverShade, [x, height(x, z) + .09, z], [ex, height(ex, ez) + .09, ez], .07, .07, 4);
      }
    }
  }
}

export function buildComplex(K) {
  const { P, M, record, service } = K;
  const start = P.tris, mfb = record('w305677141'), admin = record('w674245127');
  envelope(K, mfb, roofHeight, (x, z) => nearestPath(x, z, PATH).d < 7.5 ? M.atriumGlass : M.membrane);
  roofRibs(K, mfb, roofHeight, PATH);
  const adminPath = [[-9970, -6101], [-10089, -6105], [-10142, -6110], [-10165, -6071], [-10160, -6017]];
  const adminH = (x, z) => roofHeight(x, z, true);
  envelope(K, admin, adminH, (x, z) => nearestPath(x, z, adminPath).d < 8 ? M.atriumGlass : M.membrane);
  roofRibs(K, admin, adminH, adminPath);

  // Eastern entrance: a broad low, compound-curved glass canopy. The official
  // engineer's account gives23.8m west/17.81m east and98m between convergence
  // axes (>125m in projection). Its mapped wings descend to the waterfront.
  const arch = record('r18102141');
  const archH = (x, z) => {
    const t = Math.max(-1, Math.min(1, (z + 6109.6) / 105.65));
    const across = Math.max(0, Math.min(1, (x + 9646.6) / 74.2));
    return 2.6 + (21.2 - across * 5.99) * Math.pow(Math.max(0, 1 - t * t), .62);
  };
  envelope(K, arch, archH, () => M.atriumGlass, .35);
  P.far = 1100;
  for (let j = 0; j <= 28; j++) {
    const z = -6213 + j * 7.35, poly = arch.polys[0], ring = ringFromFlat(poly.o), path = [];
    for (let x = -9647; x <= -9570; x += 1.3) if (pointIn(x, z, ring)) path.push([x, archH(x, z) + .12, z]);
    if (path.length > 1) P.beam(M.silver, path, .16, .24);
  }
  service.parts.complex = { triangles: P.tris - start, boomerangMin: 23, boomerangMax: 85,
    archSpan: 98, archWestHeight: 23.8, archEastHeight: 17.81, adminTop: 46.2 };
}
