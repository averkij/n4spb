// bridges/piers.js - SOLID PILLARS for a floating hull (docs/water-transport-bridges.md): the piers, cutwaters, abutment heads and caissons of a bridge that stand in open water get colliders FROM WHAT IS DRAWN,
// so a bridge builder cannot draw a pillar and forget the solid (the Prachechny, Belinsky, Palace and Troitsky bridges drew theirs without one: a boat sailed through the stone).
//   solidPiers(ctx, meshes) - the meshes (or groups) a bridge has just built, in WORLD coordinates (the bridge modules draw in the world frame, root at the origin).
// The wall triangles that cross the water surface in open water (nearly vertical, from under the surface to 0.5 m or more above it (a kerb that a hull steps over, STEP_HEIGHT 0.45, is no pillar), 1.2 m or more from the bank so the quay wall is not taken for a pier) are
// clustered into pillars; each pillar becomes ONE oriented box (a pier with a pointed or round nose: the minimum-area rectangle of the hull of its outline) or a row of narrow boxes along its long axis where the
// rectangle would wall off much more than the pillar covers (a concave or very elongated footing). The boxes run from the bed up to 1.6 m over the water: above the hull (SPEC_BOAT.hgt) and far below any deck, so
// nothing on the deck is touched (the same range as the Anichkov piers, landmarksC/bridge.js: a walker or a car on the deck never meets them). A pillar that a solid already covers (the hand-made Anichkov piers) is left alone.
// The passages between the pillars stay open (no collider outside the drawn footing), and the piers are structure: not knockable (the knock rule is for fences, parapets, railings, benches and lamps).
import { carContact } from '../drive/collision.js';

const RISE = 0.5, CELL = 0.8, BANK = 1.2, MIN_EXT = 0.8, MAX_EXT = 80, UP = 1.6, FILL = 0.72, PAD = 0.05;
const _probe = { x: 0, z: 0, y: 0, yaw: 0, floats: true }, _tiny = { W: 0.6, len: 0.6, centerZ: 0, hgt: 0.95 }, _out = {};

/** the convex hull of [x, z] points (monotone chain), counter clockwise */
function hullOf(P) {
  const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop(); return lo.concat(up);
}
const area = (H) => { let a = 0; for (let i = 0; i < H.length; i++) { const j = (i + 1) % H.length; a += H[i][0] * H[j][1] - H[j][0] * H[i][1]; } return Math.abs(a) / 2; };
/** the minimum-area rectangle of a convex polygon: { ax, az (the long axis), u0, u1 (along it), v0, v1 (across), area } */
function obbOf(H) {
  let best = null;
  for (let i = 0; i < H.length; i++) {
    const j = (i + 1) % H.length, dx = H[j][0] - H[i][0], dz = H[j][1] - H[i][1], l = Math.hypot(dx, dz); if (l < 1e-6) continue;
    const ax = dx / l, az = dz / l; let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const [x, z] of H) { const u = x * ax + z * az, v = -x * az + z * ax; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const a = (u1 - u0) * (v1 - v0); if (!best || a < best.area) best = { ax, az, u0, u1, v0, v1, area: a };
  }
  if (best && best.v1 - best.v0 > best.u1 - best.u0) { const { ax, az, u0, u1, v0, v1 } = best; best = { ax: -az, az: ax, u0: v0, u1: v1, v0: -u1, v1: -u0, area: best.area }; }      // the long side is `u`
  return best;
}
/** the extent [v0, v1] of the polygon H across the axis (ax, az) within the slab u in [a, b] */
function acrossIn(H, ax, az, a, b) {
  let v0 = 1e9, v1 = -1e9; const take = (u, v) => { if (u >= a - 1e-9 && u <= b + 1e-9) { v0 = Math.min(v0, v); v1 = Math.max(v1, v); } };
  for (let i = 0; i < H.length; i++) {
    const p = H[i], q = H[(i + 1) % H.length], up = p[0] * ax + p[1] * az, vp = -p[0] * az + p[1] * ax, uq = q[0] * ax + q[1] * az, vq = -q[0] * az + q[1] * ax;
    take(up, vp);
    for (const e of [a, b]) if ((up - e) * (uq - e) < 0) take(e, vp + (vq - vp) * (e - up) / (uq - up));
  }
  return v1 >= v0 ? [v0, v1] : null;
}

/** register the pillars of the meshes `roots` (an array of Object3D, or one); returns { pillars, boxes, covered } */
export function solidPiers(ctx, roots) {
  const ph = ctx.physics, list = Array.isArray(roots) ? roots : [roots];
  const stat = { pillars: 0, boxes: 0, covered: 0 };
  const pts = [], cellOf = new Map();
  const wet = (x, z) => ph.waterLevel(x, z) !== null;
  for (const root of list) {
    root.updateWorldMatrix(true, true);
    root.traverse((m) => {
      if (!m.isMesh || m.isInstancedMesh || !m.geometry || (m.userData && m.userData.submerged)) return;
      const pos = m.geometry.attributes.position, idx = m.geometry.index; if (!pos) return;
      const e = m.matrixWorld.elements, n = idx ? idx.count : pos.count, V = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let t = 0; t + 2 < n; t += 3) {
        let ymin = 1e9, ymax = -1e9;
        for (let k = 0; k < 3; k++) {
          const i = idx ? idx.getX(t + k) : t + k, x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), v = V[k];
          v[0] = e[0] * x + e[4] * y + e[8] * z + e[12]; v[1] = e[1] * x + e[5] * y + e[9] * z + e[13]; v[2] = e[2] * x + e[6] * y + e[10] * z + e[14];
          if (v[1] < ymin) ymin = v[1]; if (v[1] > ymax) ymax = v[1];
        }
        const cx = (V[0][0] + V[1][0] + V[2][0]) / 3, cz = (V[0][2] + V[1][2] + V[2][2]) / 3, w = ph.waterLevel(cx, cz);
        if (w === null || !(ymin < w + 0.05 && ymax > w + RISE)) continue;
        // a wall, not a floor or a roof (the normal of the triangle is nearly horizontal)
        const ux = V[1][0] - V[0][0], uy = V[1][1] - V[0][1], uz = V[1][2] - V[0][2], vx = V[2][0] - V[0][0], vy = V[2][1] - V[0][1], vz = V[2][2] - V[0][2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz) || 1; if (Math.abs(ny / nl) > 0.5) continue;
        // open water around it: the quay wall (dry ground within BANK m) is the environment's
        let bank = false; for (let a = 0; a < 8 && !bank; a++) if (!wet(cx + Math.cos(a * Math.PI / 4) * BANK, cz + Math.sin(a * Math.PI / 4) * BANK)) bank = true;
        if (bank) continue;
        for (let k = 0; k < 3; k++) { const i = pts.length; pts.push({ x: V[k][0], z: V[k][2], w, top: ymax }); const key = Math.floor(V[k][0] / CELL) + ',' + Math.floor(V[k][2] / CELL); (cellOf.get(key) || cellOf.set(key, []).get(key)).push(i); }
      }
    });
  }
  if (!pts.length) return stat;
  // pillars = points that touch (cells of CELL m, eight neighbours)
  const parent = pts.map((_, i) => i), find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  for (let i = 0; i + 2 < pts.length; i += 3) { parent[find(i + 1)] = find(i); parent[find(i + 2)] = find(i); }      // (the three corners of one wall triangle are one piece)
  for (const [key, ids] of cellOf) {
    const [cx, cz] = key.split(',').map(Number);
    for (let k = 1; k < ids.length; k++) parent[find(ids[k])] = find(ids[0]);
    for (const [dx, dz] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { const o = cellOf.get((cx + dx) + ',' + (cz + dz)); if (o) parent[find(o[0])] = find(ids[0]); }
  }
  const groups = new Map(); for (let i = 0; i < pts.length; i++) { const r = find(i); (groups.get(r) || groups.set(r, []).get(r)).push(pts[i]); }
  for (const g of groups.values()) {
    const H = hullOf(g.map((p) => [p.x, p.z]));
    // (a lone wall, such as the end face of a pier that stands mostly on the bank, has two distinct corners: a 0.5 m thick box along it)
    let ob = null;
    if (H.length === 2) { const dx = H[1][0] - H[0][0], dz = H[1][1] - H[0][1], l = Math.hypot(dx, dz); if (l > 0) { const ax = dx / l, az = dz / l, u = H[0][0] * ax + H[0][1] * az, v = -H[0][0] * az + H[0][1] * ax; ob = { ax, az, u0: u, u1: u + l, v0: v - 0.25, v1: v + 0.25, area: l * 0.5 }; } } else if (H.length >= 3) ob = obbOf(H);
    if (!ob || ob.u1 - ob.u0 < MIN_EXT || ob.u1 - ob.u0 > MAX_EXT) continue;
    const w = g[0].w, top = Math.max(...g.map((p) => p.top)), y1 = w + Math.min(UP, top - w), y0 = -8;
    const rot = Math.atan2(ob.ax, ob.az), bx = -ob.az, bz = ob.ax;       // the box's local z is the long axis (ax, az), its local x is (az, -ax) (physics _obb)
    // already protected? (a hand-made collider covers the footing)
    let hit = 0, tot = 0;
    for (let u = ob.u0 + 0.3; u <= ob.u1 - 0.3 + 1e-9; u += Math.max(0.6, (ob.u1 - ob.u0) / 8)) for (let v = ob.v0 + 0.3; v <= ob.v1 - 0.3 + 1e-9; v += Math.max(0.6, (ob.v1 - ob.v0) / 4)) {
      _probe.x = ob.ax * u + bx * v; _probe.z = ob.az * u + bz * v; _probe.y = w; tot++;
      for (const b of ph.querySolids(_probe.x, _probe.z, 1.5)) if (carContact(_probe, _tiny, b, _out)) { hit++; break; }
    }
    if (tot && hit / tot >= 0.9) { stat.covered++; continue; }
    const fill = H.length < 3 ? 1 : area(H) / Math.max(ob.area, 1e-6), add = (u0, u1, v0, v1) => {
      const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;       // (the rectangle in the frame (ax, az) x (-az, ax); the world point is u * (ax, az) + v * (-az, ax))
      ph.addBox(cu * ob.ax - cv * ob.az, cu * ob.az + cv * ob.ax, (v1 - v0) + 2 * PAD, (u1 - u0) + 2 * PAD, rot, y0, y1); stat.boxes++;
    };
    stat.pillars++;
    if (fill >= FILL || ob.u1 - ob.u0 < 2.5) { add(ob.u0, ob.u1, ob.v0, ob.v1); continue; }
    const n = Math.ceil((ob.u1 - ob.u0) / 1.0);
    for (let i = 0; i < n; i++) {
      const a = ob.u0 + (ob.u1 - ob.u0) * i / n, b = ob.u0 + (ob.u1 - ob.u0) * (i + 1) / n, ext = acrossIn(H, ob.ax, ob.az, a, b);
      if (ext) add(a, b, ext[0], ext[1]);
    }
  }
  return stat;
}
