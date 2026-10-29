// landmarksGavan/frame.js - the model frames of the module and a few shared plan helpers (docs/research/gavan.md section 2.1; every rotation was re-measured by the critic against the baked OSM polygons).
// Every frame: origin O (world x, z), rotation rot (three.js rotation.y): local +x = u -> world (cos rot, -sin rot), local +z = v -> world (sin rot, cos rot); world(u, v) = O + u U + v V.
//   K   the canal mouth: origin (-6955.35, 415.3), u east (bearing 82.8), v toward the sea (bearing 172.8 = the canal axis); both kronshpits, the moles, the MChS buildings
//   C   the canal: origin (-7011.6, -35.6) = the south end of the harbour; same rotation as K, v runs along the canal to the sea (the K origin is at C v = 454.6)
//   B   the Shkipersky bridge: origin (-7009.5, -31.0), u east (bearing 79.4), v south, north = -v
//   R   the steam crane (-7059.7, -101.4);  T  the water tower (-7148.9, -251.5), long axis along u;  G  the guardhouse (-6894.3, -145.8), front (portico) = +v = SSE
//   Rt  the rotunda (-6974.6, -13.3);  W  the workers' town (-6340, -620), u east (79.9), v south;  F  the fire reserve (-6176.3, -625.3), garage front = the WEST face
//   M   the church (-5936.4, 541.0), u toward the altar (NE, bearing 55.9), v to the right (SE); the west portal under the bell tower faces -u
import * as THREE from 'three';

export const DEG = Math.PI / 180;
const mkFrame = (x, z, rot) => {
  const c = Math.cos(rot), s = Math.sin(rot);
  return {
    x, z, rot,
    /** frame (u, v) -> world { x, z } */
    W: (u, v) => ({ x: x + c * u + s * v, z: z - s * u + c * v }),
    /** world (x, z) -> frame { u, v } */
    M: (px, pz) => ({ u: c * (px - x) - s * (pz - z), v: s * (px - x) + c * (pz - z) }),
    /** world direction of the axes */
    U: [c, -s], V: [s, c],
    /** wall box / cylinder / walk box helpers for physics (frame coordinates) */
    box(ph, u, v, du, dv, y0, y1) { const p = this.W(u, v); return ph.addBox(p.x, p.z, du, dv, rot, y0, y1); },
    walk(ph, u, v, du, dv, top, bottom) { const p = this.W(u, v); return ph.addWalkBox(p.x, p.z, du, dv, rot, top, bottom); },
    cyl(ph, u, v, r, y0, y1) { const p = this.W(u, v); return ph.addCylinder(p.x, p.z, r, y0, y1); },
    /** thin wall between two frame points a, b ([u, v]) */
    wall(ph, a, b, y0, y1, t = 0.5) {
      const A = this.W(a[0], a[1]), B = this.W(b[0], b[1]), len = Math.hypot(B.x - A.x, B.z - A.z);
      if (len < 0.05) return null;
      return ph.addBox((A.x + B.x) / 2, (A.z + B.z) / 2, len, t, Math.atan2(-(B.z - A.z), B.x - A.x), y0, y1);
    },
    /** run fn with the Parts stack pushed into this frame */
    on(P, fn) { P.push(x, 0, z, rot); try { return fn(); } finally { P.pop(); } },
  };
};
export const FK = mkFrame(-6955.35, 415.3, 0.1260);
export const FC = mkFrame(-7011.6, -35.6, 0.1260);
export const FB = mkFrame(-7009.5, -31.0, 0.1832);
export const FR = mkFrame(-7059.7, -101.4, 0.3457);
export const FT = mkFrame(-7148.9, -251.5, -1.1484);
export const FG = mkFrame(-6894.3, -145.8, 0.3512);
export const FRT = mkFrame(-6974.6, -13.3, 0.2851);
export const FW = mkFrame(-6340, -620, 0.1763);
export const FF = mkFrame(-6176.3, -625.3, 0.2077);
export const FM = mkFrame(-5936.4, 541.0, 0.5946);

// ------------------------------------------------------------------------------------------------ switches (dossier: BRIDGE_STATE, TOWER_TANK, PROMENADE_OPEN, STATE_OLD)
export const SW = {
  BRIDGE_STATE: 'mabey',        // the 1997 Mabey truss (still standing in Oct 2026); a temporary parallel bridge is not modelled
  TOWER_TANK: 'net',            // 'net' = green construction netting over the timber tank (every 2014-19 photo) | 'bare' = weathered boards (2012)
  PROMENADE_OPEN: true,         // true = the gate of the east promenade stands open and the strip along the canal is walkable; false = the gate is closed (collider) and the strip is seen over the fence
  STATE_OLD: false,             // the church before its 2022-25 restoration (ochre brick, red-brown domes): not drawn
};

// ------------------------------------------------------------------------------------------------ common plan helpers
/** the oriented bounding rectangle of a flat ring [x, z, ...] along its longest edge: { cx, cz, ang (atan2(dz, dx) of the long axis), len, wid } */
export function rectOf(flat) {
  let best = 0, ang = 0;
  for (let i = 0; i < flat.length; i += 2) {
    const j = (i + 2) % flat.length, dx = flat[j] - flat[i], dz = flat[j + 1] - flat[i + 1], l = Math.hypot(dx, dz);
    if (l > best) { best = l; ang = Math.atan2(dz, dx); }
  }
  const c = Math.cos(ang), s = Math.sin(ang);
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (let i = 0; i < flat.length; i += 2) { const u = c * flat[i] + s * flat[i + 1], v = -s * flat[i] + c * flat[i + 1]; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const um = (u0 + u1) / 2, vm = (v0 + v1) / 2;
  return { cx: c * um - s * vm, cz: s * um + c * vm, ang, len: u1 - u0, wid: v1 - v0 };
}
/** frame of a rectangle `r` (rectOf) whose local +x runs along the long axis and whose local +z points toward the world direction (dx, dz): { cx, cz, rotY, len, wid } */
export function rectFacing(r, dx, dz) {
  let rotY = -r.ang;
  if (Math.sin(rotY) * dx + Math.cos(rotY) * dz < 0) rotY += Math.PI;
  return { cx: r.cx, cz: r.cz, rotY, len: r.len, wid: r.wid };
}
/** three.js rotation.y that turns local +x along a world direction atan2(dz, dx) = ang */
export const rotOfAng = (ang) => -ang;

/** world flat ring from frame points [[u, v]..] */
export const ringW = (F, pts) => pts.flatMap(([u, v]) => { const p = F.W(u, v); return [p.x, p.z]; });
/** [[x, z]..] from a flat ring */
export const pairsOf = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };

void THREE;
