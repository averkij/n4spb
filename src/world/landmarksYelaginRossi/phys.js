// landmarksYelaginRossi/phys.js - small physics helpers: stairs built from walk boxes with a 3 cm overlap (physics.addStairs leaves a hairline gap between treads that a walker can fall through on a
// box boundary), flagged `sticky` like the engine's own stairs.
/** n steps rising along the local +z of the footprint (w x d, centre cx, cz, rotation rotY) from y0 to y1 */
export function stairs(ph, cx, cz, w, d, rotY, y0, y1, n) {
  const c = Math.cos(rotY), s = Math.sin(rotY), out = [];
  for (let i = 0; i < n; i++) {
    const lz = -d / 2 + d * (i + 0.5) / n;
    const it = ph.addWalkBox(cx + lz * s, cz + lz * c, w, d / n + 0.03, rotY, y0 + (y1 - y0) * (i + 1) / n);
    it.sticky = true; out.push(it);
  }
  return out;
}
