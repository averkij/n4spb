// landmarksPetrovskyYacht/savfence.js - the CAST-IRON FENCE of the Savina Veterans' Home estate (photo v03 "Дом ветеранов сцены": black cast fence of linked tall ovals between a top and a bottom rail, on a low granite
// footing, with square pale-stucco piers carrying a flat cap and a ball; OSM barrier ways w112174612 (metal, h 1.5 m, from the Petrovskaya square corner (-5422,-3482) round the west side of the park to (-5344,-3269))
// and w501166129 (to (-5236,-3234)); the generic city does not draw OSM fences, so this is purely additive).  Panels are alpha quads (both faces), piers every ~5 m, a thin collider per panel run (the estate is
// closed territory).  Road integrity: a panel or pier whose centre lies on a carriageway (layout.isOnRoad) is left out together with its collider, so the fence never stands in the roadway.
import { BARRIERS } from '../data/city.js';
import * as L from '../layout.js';

export const FENCE_IDS = ['w112174612', 'w501166129'];
const H = 1.55, PIER = 5.0;

export function build(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const runs = BARRIERS.filter((b) => FENCE_IDS.includes(b.id));
  let panels = 0, skipped = 0;
  const net = ctx.services.streets && ctx.services.streets.net;
  const okAt = (x, z, extra = 0.3) => (net && net.cover ? net.cover(x, z, {}) < -(0.5 + extra) : !L.isOnRoad(x, z, 0.8 + extra));
  P.far = 380;
  P.push(0, 0, 0, 0);
  for (const b of runs) {
    const pts = []; for (let i = 0; i < b.pts.length; i += 2) pts.push([b.pts[i], b.pts[i + 1]]);
    let acc = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], c = pts[i + 1], len = Math.hypot(c[0] - a[0], c[1] - a[1]); if (len < 0.3) continue;
      const n = Math.max(1, Math.round(len / 2.5)), dx = (c[0] - a[0]) / len, dz = (c[1] - a[1]) / len, rot = -Math.atan2(dz, dx), step = len / n;
      for (let k = 0; k < n; k++) {
        const x0 = a[0] + dx * step * k, z0 = a[1] + dz * step * k, mx = x0 + dx * step / 2, mz = z0 + dz * step / 2;
        // road integrity: the panel (and its collider) must keep clear of the asphalt; a panel too near it is slid away along its normal (up to 0.9 m, the OSM line is only +-1 m accurate), else left out
        let off = null;
        for (const sh of [0, 0.3, -0.3, 0.6, -0.6, 0.9, -0.9]) { if (okAt(x0 - dz * sh, z0 + dx * sh) && okAt(mx - dz * sh, mz + dx * sh) && okAt(x0 + dx * step - dz * sh, z0 + dz * step + dx * sh)) { off = sh; break; } }
        if (off === null) { skipped++; continue; }
        const ox = -dz * off, oz = dx * off;
        P.push(x0 + ox, 0, z0 + oz, rot);
        P.box(M.granite, 0, step, 0, 0.32, -0.12, 0.12, 'b', 1.5);                                        // the granite footing
        P.quad(M.railRing, [0, 0.32, 0], [step, 0.32, 0], [step, 0.32 + H, 0], [0, 0.32 + H, 0], [0, 0, 1], [[0, 0], [step / 2.5, 0], [step / 2.5, 1], [0, 1]]);
        P.pop();
        if (ph) ph.addBox(mx + ox, mz + oz, step + 0.1, 0.25, rot, 0, H);
        panels++;
      }
      // piers: at the start of the run, at every corner and every PIER metres of the arc length
      const piers = [];
      if (i === 0) piers.push(0);
      let s = Math.ceil((acc + 0.01) / PIER) * PIER - acc; while (s < len - 0.5) { piers.push(s); s += PIER; }
      piers.push(len);
      for (const s2 of piers) {
        const x = a[0] + dx * s2, z = a[1] + dz * s2; if (!okAt(x, z, 0.5)) continue;
        P.push(x, 0, z, rot);
        P.box(M.granite, -0.3, 0.3, 0, 0.4, -0.3, 0.3, 'b', 1.5);
        P.box(M.white, -0.24, 0.24, 0.4, 1.7, -0.24, 0.24, 'b', 1.5);
        P.box(M.white, -0.32, 0.32, 1.7, 1.82, -0.32, 0.32, 'b', 1.5);
        P.box(M.white, -0.18, 0.18, 1.82, 1.95, -0.18, 0.18, 'b', 1.5);
        P.col(M.white, 0, 0, 1.95, 2.22, 0.14, 0.02, 8, true);
        P.pop();
      }
      acc += len;
    }
  }
  P.pop();
  K.shared.savfence = { panels, skipped };
}
