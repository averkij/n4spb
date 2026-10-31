// landmarksFortress/frame.js - constants, frames and small geometry helpers of Zayachy Island (docs/research/fortress.md section 2).
//   The hexagon of the ramparts and every building inside are rotated 25.7 deg from east-west: U = (0.901, -0.434) points ENE (to the Petrovsky Gate), V = (0.434, 0.901) SSE (to the Neva).
//   FORT = the main rampart polygon r227969 (outer ring 85 vertices + 2 holes) from the baked data; vertex ranges of the bastions / curtains are in the dossier and in WALL_KIND below.
//   Kit convention: P.push(x, y, z, rotY) maps local +x to world (cos, -sin) and local +z to world (sin, cos); rotOf(dx, dz) = the rotY whose local +x is (dx, dz); rotOut(nx, nz) = the rotY whose local +z is (nx, nz).
import { BUILDINGS } from '../data/city.js';
import { ISLAND_RING } from './osm-data.js';

export const RING = ISLAND_RING;
export const U = [0.901, -0.434], V = [0.434, 0.901];
export const rotOf = (dx, dz) => Math.atan2(-dz, dx);
export const rotOut = (nx, nz) => Math.atan2(nx, nz);
export const pairs = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
export const byId = (id) => BUILDINGS.find((b) => b.id === id);
export const inRing = (x, z, r = RING) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
export const ringArea = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const q = r[(i + 1) % r.length]; a += r[i][0] * q[1] - q[0] * r[i][1]; } return a / 2; };
export const dseg = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t); };
/** nearest edge of a ring to (x, z): { i, d, t (0..1 along the edge), px, pz } */
export function nearestEdge(ring, x, z) {
  let best = { i: -1, d: 1e9, t: 0, px: 0, pz: 0 };
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)), px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(x - px, z - pz);
    if (d < best.d) best = { i, d, t, px, pz };
  }
  return best;
}
/** ring offset by d along the OUTWARD normals (negative = inward), mitred (limit 2.2), any winding */
export function offsetRing(ring, d) {
  const n = ring.length, sgn = ringArea(ring) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i + n - 1) % n], p1 = ring[i], p2 = ring[(i + 1) % n];
    const nrm = (p, q) => { const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return [dz / l * sgn, -dx / l * sgn]; };
    const n1 = nrm(p0, p1), n2 = nrm(p1, p2);
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = Math.min(2.2, 1 / Math.max(0.4, mx * n1[0] + mz * n1[1]));
    out.push([p1[0] + mx * d * k, p1[1] + mz * d * k]);
  }
  return out;
}
/** outward unit normal of edge i of a ring (any winding) */
export function edgeNormal(ring, i) {
  const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, sgn = ringArea(ring) > 0 ? 1 : -1;
  return [dz / l * sgn, -dx / l * sgn];
}

// ---------------------------------------------------------------- the main rampart
const fortRec = byId('r227969');
export const FORT = fortRec ? { o: pairs(fortRec.polys[0].o), h: fortRec.polys[0].h.map(pairs) } : { o: [], h: [] };
/** heights of the main rampart (street level 0): cordon, parapet top, roof at the parapet, inner eave */
export const WALL = { cordon: 9.2, top: 10.6, roofHi: 10.25, roofLo: 9.3, inset: 1.05, parapet: 0.85 };
export const RAV = { cordon: 7.4, top: 8.8, roofHi: 8.45, roofLo: 7.6, inset: 0.85, parapet: 0.8 };
/** facing of the outer edge i of the main rampart: 'granite' (Neva side, 1779-85), 'plaster' (Zotov bastion + Vasilievskaya curtain, "like granite"), 'brick' (strait side) */
export function wallKind(i) {
  if (i >= 54 && i <= 80) return 'granite';                 // Gosudarev faces, Neva curtain, Naryshkin, Catherine curtain, Trubetskoy up to its orillon
  if (i >= 81 || i <= 8) return 'plaster';                  // Vasilievskaya curtain, Zotov bastion
  return 'brick';
}
/** curtains whose outer face shows a row of arched casemate windows */
export const windowed = (i) => i === 64 || i === 69 || i === 65 || i === 68;
/**
 * The passages through the walls (where the OSM ways cross the wall polygons): `outer` = the point on the outside face, `inner` = the point on the yard face, w / h = clear width and crown height of the vaulted
 * passage, hwO / hwI = half width of the portal on the outer / inner face (the wall face is left out there: gates.js draws the portal), hO / hI = portal heights (the wall face continues above them).
 */
export const GATES = [
  { key: 'petrovsky', poly: 'r227969', name: 'Петровские ворота', nameEn: 'Petrovsky Gate', outer: [-1729.2, -2049.5], inner: [-1750.2, -2043.3], w: 4.2, h: 5.6, hwO: 8.6, hO: 99, hwI: 5.2, hI: 99 },
  { key: 'nevsky', poly: 'r227969', name: 'Невские ворота', nameEn: 'Nevsky Gate', outer: [-1836.7, -1875.7], inner: [-1849.2, -1890.1], w: 4.0, h: 5.4, hwO: 6.1, hO: 99, hwI: 5.0, hI: 8.2 },
  { key: 'kronverksky', poly: 'r227969', name: 'Кронверкские ворота', nameEn: 'Kronverksky Gate', outer: [-1910.1, -2131.7], inner: [-1910.3, -2113.5], w: 4.0, h: 4.8, hwO: 4.2, hO: 7.4, hwI: 3.6, hI: 6.6 },
  { key: 'nikolsky', poly: 'r227969', name: 'Никольские ворота', nameEn: 'Nikolsky Gate', outer: [-2085.9, -2027.0], inner: [-2075.7, -2015.6], w: 5.0, h: 5.8, hwO: 7.4, hO: 99, hwI: 7.4, hI: 99 },
  { key: 'vasilievsky', poly: 'r227969', name: 'Васильевские ворота', nameEn: 'Vasilievsky Gate', outer: [-2150.4, -1871.4], inner: [-2134.4, -1877.8], w: 4.0, h: 4.8, hwO: 4.6, hO: 6.2, hwI: 3.6, hI: 6.6 },
  { key: 'ioannovsky', poly: 'r2594679', name: 'Иоанновские ворота', nameEn: 'Ioannovsky Gate', outer: [-1642.9, -2115.3], inner: [-1650.0, -2098.2], w: 4.0, h: 5.5, hwO: 5.6, hO: 8.0, hwI: 3.6, hI: 6.4 },
];
for (const g of GATES) {
  const dx = g.inner[0] - g.outer[0], dz = g.inner[1] - g.outer[1], l = Math.hypot(dx, dz);
  g.len = l; g.d = [dx / l, dz / l];                       // unit axis from the outside to the inside
  g.t = [-g.d[1], g.d[0]];                                 // unit tangent of the wall faces
}
/** openings of a wall polygon (id) for walls.js: slabs { c, t, hw, h, d } on the outer and inner faces of every gate through it */
export const openingsOf = (id) => GATES.filter((g) => g.poly === id).flatMap((g) => [{ c: g.outer, t: g.t, hw: g.hwO, h: g.hO, gate: g.key }, { c: g.inner, t: g.t, hw: g.hwI, h: g.hI, gate: g.key }]);

// ---------------------------------------------------------------- the cathedral frame: origin = the bell tower centre, local +x = U (to the altar, ENE), local +z = V (SSE, the south side)
export const CATH = { x: -1970.6, z: -1970.0, rot: rotOf(U[0], U[1]) };
export const cathW = (lx, lz) => ({ x: CATH.x + U[0] * lx + V[0] * lz, z: CATH.z + U[1] * lx + V[1] * lz });
export const toCath = (x, z) => ({ lx: (x - CATH.x) * U[0] + (z - CATH.z) * U[1], lz: (x - CATH.x) * V[0] + (z - CATH.z) * V[1] });

// ---------------------------------------------------------------- banks of the island by ring edge (edge i = vertex i -> i + 1): 'quay' granite banquette, 'beach' sand apron (walkable), 'grass' slope
export function bankKind(i) {
  if (i >= 60 && i <= 64) return 'quay';
  if (i >= 34 && i <= 59) return 'beach';
  return 'grass';
}

/** places where a wall collider must stay open although the wall face is drawn: the top of the timber stairs of the Naryshkin yard (details.js roof walk) */
export const COL_GAPS = [{ c: [-1885.7, -1791.4], r: 2.1 }];

/** distance from the outer face of a gate along its axis (outwards) to the island ring: where the passage axis reaches the bank (Nevsky Gate: the foot of the Commandant pier) */
export function axisToRing(g) {
  let best = null; const o = g.outer, dx = -g.d[0], dz = -g.d[1];
  for (let i = 0; i < RING.length; i++) {
    const a = RING[i], b = RING[(i + 1) % RING.length], ex = b[0] - a[0], ez = b[1] - a[1], den = dx * ez - dz * ex; if (Math.abs(den) < 1e-9) continue;
    const s = ((a[0] - o[0]) * ez - (a[1] - o[1]) * ex) / den, t = ((a[0] - o[0]) * dz - (a[1] - o[1]) * dx) / den;
    if (s > 0.5 && t >= 0 && t <= 1 && (best === null || s < best)) best = s;
  }
  return best ?? 8;
}
