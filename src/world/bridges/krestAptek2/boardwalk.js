// bridges/krestAptek2/boardwalk.js - the OSM "bridge=boardwalk" footways of the Krestovsky / Yelagin shore parks: plank walkways 2.4 - 3 m wide laid 9 cm over the ground (tile 1.0 x 0.9 m planks, 0.12 m edge
// beams), the wet stretches (a piece of the path that leaves the shore: the boardwalk of the west tip crosses a 4 m inlet, the south boardwalk ends in a pier 12 m into the water) get a walkable box, side
// colliders and a low timber rail.  The environment's invisible fallback deck (a walk box 9 m wide) made nobody fall but let the walker step off its edge into the water (tools/environment-banks.mjs zone walk: open edges
// at (-7027, -5409) and (-7025, -5403)); the claimed ways are drawn here and fenced where the water is within 1.6 m of the walkway.
// Ways (OSM, wood): w1321576957 (the west tip promenade, path 3 m), w1459136325 / 28 / 29 / 33 / 34 / 35 + w1284616904 (the south-shore network round the yacht clubs, 2.4 m), w1460564661 / 62 / 63 (the north
// shore of Yelagin Island, 2.4 m), w1461661721 (the Victory Park pond shore).  NO lamps / furniture (the paths keep theirs from `streets`).
import { ROADS } from '../../data/city.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const BOARDWALKS = ['w1321576957', 'w1459136325', 'w1459136328', 'w1459136329', 'w1459136333', 'w1459136334', 'w1459136335', 'w1284616904', 'w1460564661', 'w1460564662', 'w1460564663', 'w1461661721'];

/** The quay walls the environment lays along the coast of the islands (thin boxes y -8 .. 1.25) close the mouth of a boardwalk spur that runs out to the shore (w1459136334, w1459136335: the walker stopped at the wall).
 *  Where a wall box CROSSES a claimed way (angle > 17 deg: a wall that runs along the way stays) the part inside the strip |v| <= hw + 0.35 is cut out and the pieces outside the strip are put back. */
function openQuayWalls(ph, byId, B) {
  let cut = 0;
  for (const r of byId.values()) {
    const pts = r.pts, n = pts.length / 2, hw = (r.w || 2.4) / 2, strip = hw + 0.35;
    for (let i = 0; i + 1 < n; i++) {
      const ax = pts[i * 2], az = pts[i * 2 + 1], bx = pts[i * 2 + 2], bz = pts[i * 2 + 3], len = Math.hypot(bx - ax, bz - az); if (len < 0.2) continue;
      const tx = (bx - ax) / len, tz = (bz - az) / len, mx = (ax + bx) / 2, mz = (az + bz) / 2;
      for (const it of Array.from(ph._query(mx, mz, len / 2 + strip + 6))) {
        if (it.type !== 'box' || it.y0 !== -8 || it.y1 !== 1.25 || it.hd > 0.6) continue;
        const bxd = it.c, bzd = -it.s;                                            // the box axis
        if (Math.abs(bxd * tz - bzd * tx) < 0.3) continue;                        // within ~17 deg of the way: a wall along the walkway stays
        // the box centre line in the way frame (u along, v across)
        const U = (x, z) => (x - ax) * tx + (z - az) * tz, V = (x, z) => -(x - ax) * tz + (z - az) * tx;
        const p0 = [it.cx - bxd * it.hw, it.cz - bzd * it.hw], p1 = [it.cx + bxd * it.hw, it.cz + bzd * it.hw];
        const u0 = U(...p0), v0 = V(...p0), u1 = U(...p1), v1 = V(...p1), du = u1 - u0, dv = v1 - v0; let t0 = 0, t1 = 1;
        if (Math.abs(du) > 1e-6) { const ta = (-0.3 - u0) / du, tb = (len + 0.3 - u0) / du; t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb)); } else if (u0 < -0.3 || u0 > len + 0.3) continue;
        if (t1 <= t0) continue;
        if (Math.abs(dv) > 1e-6) { const ta = (-strip - v0) / dv, tb = (strip - v0) / dv; t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb)); } else if (Math.abs(v0) > strip) continue;
        if (t1 <= t0) continue;
        const L2 = 2 * it.hw, wl = (a, b) => { const q0 = [p0[0] + (p1[0] - p0[0]) * a, p0[1] + (p1[1] - p0[1]) * a], q1 = [p0[0] + (p1[0] - p0[0]) * b, p0[1] + (p1[1] - p0[1]) * b]; return [q0, q1]; };
        if(it.source?.knock)continue; ph.remove(it); cut++;
        const ang = Math.atan2(-bzd, bxd), y0 = it.y0, y1 = it.y1;
        for (const [a, b] of [[0, t0], [t1, 1]]) { if ((b - a) * L2 < 0.3) continue; const [q0, q1] = wl(a, b), l = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]); ph.addBox((q0[0] + q1[0]) / 2, (q0[1] + q1[1]) / 2, l + 0.1, it.hd * 2, ang, y0, y1); }
      }
    }
  }
  B.info.wallsCut = cut;
}

export function buildBoardwalks(env) {
  const { ctx, P, M, rails } = env, L = ctx.L, ph = ctx.physics, TM = ctx.mat.toon;
  const wetAt = (x, z) => !!(L.waterwayAt ? L.waterwayAt(x, z) : L.inRiver(x, z)) || L.heightAt(x, z) < -0.8;
  if (!M.bwBeam) M.bwBeam = TM('#7a6448', { paint: 0.05, name: 'brg-bw-beam' });
  const plank = M.plank, beam = M.bwBeam, Y0 = 0.09;
  const B = { id: 'ka-boardwalks', x: 0, z: 0, at: [-7016, -5398], info: { ways: 0, tris: 0, colliders: 0, wetSegments: 0, rails: 0 }, masts: [], list: [] };
  const colls = [], byId = new Map(); for (const r of ROADS) if (BOARDWALKS.includes(r.id)) byId.set(r.id, r);
  let sx = 0, sz = 0, sn = 0;
  for (const id of BOARDWALKS) {
    const r = byId.get(id); if (!r) continue;
    const pts = r.pts, n = pts.length / 2, hw = (r.w || 2.4) / 2; B.info.ways++;
    // cumulative length for the uv
    const S = [0]; for (let i = 1; i < n; i++) S.push(S[i - 1] + Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]));
    // mitred side points
    const side = [];
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1), dx = pts[b * 2] - pts[a * 2], dz = pts[b * 2 + 1] - pts[a * 2 + 1], l = Math.hypot(dx, dz) || 1;
      side.push([-dz / l, dx / l]);
    }
    for (let i = 0; i + 1 < n; i++) {
      const ax = pts[i * 2], az = pts[i * 2 + 1], bx = pts[i * 2 + 2], bz = pts[i * 2 + 3], len = Math.hypot(bx - ax, bz - az); if (len < 0.05) continue;
      sx += ax; sz += az; sn++;
      const na = side[i], nb = side[i + 1], p = (x, z, nn, v, y) => [x + nn[0] * v, y, z + nn[1] * v];
      P.quad(plank, p(ax, az, na, -hw, Y0), p(bx, bz, nb, -hw, Y0), p(bx, bz, nb, hw, Y0), p(ax, az, na, hw, Y0), [0, 1, 0], [[S[i], -hw / 0.9], [S[i + 1], -hw / 0.9], [S[i + 1], hw / 0.9], [S[i], hw / 0.9]]);
      for (const sg of [-1, 1]) {                                                // edge beams: the outer face and a 0.12 m top strip, down to the ground
        const v0 = sg * hw, v1 = sg * (hw + 0.1);
        P.quad(beam, p(ax, az, na, v1, 0), p(bx, bz, nb, v1, 0), p(bx, bz, nb, v1, Y0 + 0.02), p(ax, az, na, v1, Y0 + 0.02), [sg * na[0], 0, sg * na[1]]);
        P.quad(beam, p(ax, az, na, v0, Y0 + 0.02), p(bx, bz, nb, v0, Y0 + 0.02), p(bx, bz, nb, v1, Y0 + 0.02), p(ax, az, na, v1, Y0 + 0.02), [0, 1, 0]);
      }
      // wet runs along the segment: the centre line / 1.6 m beyond either edge, sampled every 0.5 m; a bend at a vertex keeps the fences hw + 0.35 m away from it (the walker turns the corner there)
      const th = Math.atan2(bz - az, bx - ax), nn = [-(bz - az) / len, (bx - ax) / len], nS = Math.max(1, Math.round(len / 0.5)), flags = [];
      for (let t = 0; t <= nS; t++) {
        const f = t / nS, x = ax + (bx - ax) * f, z = az + (bz - az) * f;
        flags.push([wetAt(x, z), wetAt(x - nn[0] * (hw + 1.6), z - nn[1] * (hw + 1.6)), wetAt(x + nn[0] * (hw + 1.6), z + nn[1] * (hw + 1.6))]);
      }
      const angAt = (v) => { const p = v - 1, q = v + 1; if (p < 0 || q >= n) return 0; const d1 = Math.atan2(pts[v * 2 + 1] - pts[p * 2 + 1], pts[v * 2] - pts[p * 2]), d2 = Math.atan2(pts[q * 2 + 1] - pts[v * 2 + 1], pts[q * 2] - pts[v * 2]); let d = Math.abs(d2 - d1); if (d > Math.PI) d = 2 * Math.PI - d; return d; };
      // a bend at a vertex: the fence on the INNER side of the turn stops hw + 0.4 m before the vertex (the next segment starts there), the OUTER side runs hw + 0.1 m past it (closes the corner)
      const turnAt = (v) => { if (v < 1 || v >= n - 1) return 0; const d1x = pts[v * 2] - pts[v * 2 - 2], d1z = pts[v * 2 + 1] - pts[v * 2 - 1], d2x = pts[v * 2 + 2] - pts[v * 2], d2z = pts[v * 2 + 3] - pts[v * 2 + 1], l1 = Math.hypot(d1x, d1z) || 1; return Math.sign((d2x * -d1z + d2z * d1x) / l1); };
      const b0 = angAt(i) > 0.45, b1 = angAt(i + 1) > 0.45, t0s = turnAt(i), t1s = turnAt(i + 1);
      const lim = (sg, isStart) => { const bend = isStart ? b0 : b1; if (!bend) return isStart ? -0.1 : 0.1; const inner = isStart ? t0s : t1s; return sg === inner ? (isStart ? hw + 0.4 : -(hw + 0.4)) : (isStart ? -(hw + 0.1) : hw + 0.1); };
      for (let k = 0; k < 3; k++) {                                        // k 0 = centre (walk box + both fences), 1 = left side fence, 2 = right side fence
        let t0 = -1;
        for (let t = 0; t <= nS + 1; t++) {
          const on = t <= nS && (k === 0 ? (flags[t][0] || flags[t][1] || flags[t][2]) : flags[t][k]);
          if (on && t0 < 0) t0 = t; if ((!on || t === nS + 1) && t0 >= 0) {
            const sg0 = k === 1 ? -1 : 1, lo = k === 0 ? 0 : lim(sg0, true), hi = k === 0 ? len : len + lim(sg0, false), u0 = clamp(t0 * len / nS - 1.5, lo, hi), u1 = clamp((t - 1) * len / nS + 1.5, lo, hi); t0 = -1; if (u1 - u0 < 0.6) continue;
            const mu = (u0 + u1) / 2, cx = ax + (bx - ax) / len * mu, cz = az + (bz - az) / len * mu, ll = u1 - u0;
            if (k === 0) { B.info.wetSegments++; colls.push((ph2) => { ph2.addWalkBox(cx, cz, ll + 0.5, 2 * hw + 0.1, -th, Y0, -1.2); }); continue; }
            const sg = k === 1 ? -1 : 1, wx = cx - Math.sin(th) * sg * (hw + 0.05), wz = cz + Math.cos(th) * sg * (hw + 0.05);
            colls.push((ph2) => { ph2.addBox(wx, wz, ll + 0.1, 0.2, -th, -2, 1.2); });
            P.push(wx, 0, wz, -th);
            P.box(beam, -ll / 2, ll / 2, Y0 + 0.9, Y0 + 1.0, -0.05, 0.05, '', 1); P.box(beam, -ll / 2, ll / 2, Y0 + 0.45, Y0 + 0.52, -0.04, 0.04, '', 1);
            const np = Math.max(1, Math.round(ll / 2));
            for (let q = 0; q <= np; q++) { const u = -ll / 2 + ll * q / np; P.box(beam, u - 0.05, u + 0.05, Y0, Y0 + 1.0, -0.05, 0.05, 'b', 1); }
            P.pop(); B.info.rails++;
          }
        }
      }
    }
    // the end of a way that stands in the water: a cap rail across the end
    for (const [i, dir] of [[0, -1], [n - 1, 1]]) {
      const x = pts[i * 2], z = pts[i * 2 + 1], j = i + (i ? -1 : 1), dx = (x - pts[j * 2]), dz = (z - pts[j * 2 + 1]), l = Math.hypot(dx, dz) || 1, th = Math.atan2(dz, dx);
      if (!wetAt(x + dx / l * 1.5, z + dz / l * 1.5) && !wetAt(x, z)) continue;
      colls.push((ph2) => { ph2.addBox(x + dx / l * 0.1, z + dz / l * 0.1, 0.2, 2 * hw + 0.3, -th, -2, 1.2); });
      P.push(x, 0, z, -th); P.box(beam, 0, 0.1, Y0 + 0.9, Y0 + 1.0, -hw, hw, '', 1); P.box(beam, 0, 0.1, Y0, Y0 + 1.0, -hw - 0.05, -hw + 0.05, 'b', 1); P.box(beam, 0, 0.1, Y0, Y0 + 1.0, hw - 0.05, hw + 0.05, 'b', 1); P.pop(); void dir;
    }
  }
  B.x = sn ? sx / sn : 0; B.z = sn ? sz / sn : 0;
  B.colliders = () => { openQuayWalls(ph, byId, B); for (const c of colls) { c(ph); B.info.colliders++; } };
  void rails; void clamp;
  return B;
}
