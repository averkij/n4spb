// landmarksTransfiguration/terrace.js - the CHURCH MOUND of the Transfiguration, in the flat city a 1 m terrace: the church stands on an artificial mound (3 m in reality [W]) held up against Instrumentalnaya ul.
// by a granite RUBBLE retaining wall (photos 65 66 14 16: grey-brown rough stones, a pale ledge on top, a dense hedge above it).  The terrace is a rectangle in the church frame CH (frame.js TERRACE): rubble walls on
// four sides, a granite coping ledge, the mown lawn on top (drawn over the generic ground lawn, walkable through one stair), the hedge (instanced-free chunks of an octagonal prism, ctx.rng heights) and the 7-tread
// stair on the entrance axis between two rubble cheek walls (the OSM steps way w1456389724 runs along it).  The church plinth stands on the lawn at y = 1 (church.js pushes PL.TY).
// Collectors: K.P = the shell (walls, lawn, stair; LOD 1100 m), K.N = the hedge and the coping detail (LOD 350 m).  Colliders: one walk box (the terrace is a solid platform of height 1 m), the stair treads.
import { CH, PL, TERRACE as T } from './frame.js';
import { band, ringEdges } from './kit.js';
import { shapeOf } from './geo.js';

const TY = PL.TY;

/** a hedge chunk along the local segment (x0,z0)-(x1,z1) at height y0: an octagonal prism of height h and half width w, closed by end caps */
function hedgeChunk(P, mat, x0, z0, x1, z1, y0, h, w) {
  const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz), tx = dx / len, tz = dz / len, nx = tz, nz = -tx;
  const prof = [[w * 0.9, 0], [w, h * 0.45], [w * 0.8, h * 0.85], [w * 0.4, h], [-w * 0.4, h], [-w * 0.8, h * 0.85], [-w, h * 0.45], [-w * 0.9, 0]];
  const pt = (k, t) => [x0 + tx * len * t + nx * prof[k][0], y0 + prof[k][1], z0 + tz * len * t + nz * prof[k][0]];
  for (let k = 0; k + 1 < prof.length; k++) {
    const dd = prof[k + 1][0] - prof[k][0], dy = prof[k + 1][1] - prof[k][1], nrm = [nx * dy, -dd, nz * dy];              // outward normal of the profile segment
    P.quad(mat, pt(k, 0), pt(k + 1, 0), pt(k + 1, 1), pt(k, 1), nrm, [[0, k * 0.4], [0, (k + 1) * 0.4], [len / 2, (k + 1) * 0.4], [len / 2, k * 0.4]]);
  }
  for (const [t, s] of [[0, -1], [1, 1]]) P.fan(mat, prof.map((p, k) => pt(k, t)), [tx * s, 0, tz * s], (p) => [p[0] * 0.5, p[1] * 0.5]);
}

export function build(K) {
  const { ctx, M, P, N, svc } = K, ph = ctx.physics, rng = ctx.rng(6551);
  const { mx0, mx1, mz0, mz1, stairZ1, stairW, stairN } = T;
  const sw = stairW + 0.8;                                                // the opening in the wall: the stair plus two cheeks of 0.5 m
  for (const C of [P, N]) C.push(CH.ox, 0, CH.oz, CH.rot);

  // ---------------------------------------------------------------- the rubble walls with the opening of the stair, the coping ledge, the lawn on top
  const ring = [[mx0, mz0], [mx1, mz0], [mx1, mz1], [sw / 2, mz1], [-sw / 2, mz1], [mx0, mz1]];
  const edges = ringEdges({ o: ring.flat(), h: [] });
  const gap = (e) => Math.abs(e.a[1] - mz1) < 0.01 && Math.abs(e.b[1] - mz1) < 0.01 && Math.abs(e.len - sw) < 0.05;
  band(P, edges, 0, TY, 0, { front: M.rubble }, { uvs: 3, draw: (e) => !gap(e) });
  band(N, edges, TY - 0.04, TY + 0.1, 0.12, { front: M.granite, top: M.granite, under: M.granite }, { uvs: 2.5, draw: (e) => !gap(e) });
  P.cap(M.lawn, [[mx0, mz0], [mx1, mz0], [mx1, mz1], [mx0, mz1]], TY, true, 4);

  // ---------------------------------------------------------------- the stair: 7 granite treads between rubble cheek walls
  const rise = TY / stairN, run = (stairZ1 - mz1) / stairN, hw = stairW / 2;
  for (let j = 1; j <= stairN; j++) P.box(M.granite, -hw, hw, 0, j * rise, stairZ1 - j * run, stairZ1 - (j - 1) * run, 'klr', 2.5);
  const cheek = shapeOf([[mz1, 0], [stairZ1, 0], [stairZ1, 0.45], [mz1, TY + 0.45]]);
  for (const s of [-1, 1]) {
    P.push(s > 0 ? hw + 0.4 : -hw, 0, 0, -Math.PI / 2);                    // local +x -> church +z, extrusion toward church -x
    P.extrude(M.rubble, cheek, 0, 0.4, 3, 4);
    P.pop();
  }

  // ---------------------------------------------------------------- the hedge on the terrace edge (inset 0.55 m): chunks of 2-3 m with their own heights; not in front of the stair
  const cut = hw + 0.4 + 0.9;
  const side = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 2.6));
    for (let i = 0; i < n; i++) {
      const a = i / n, b = (i + 1) / n, ax = x0 + (x1 - x0) * a, az = z0 + (z1 - z0) * a, bx = x0 + (x1 - x0) * b, bz = z0 + (z1 - z0) * b;
      if (Math.abs(az - (mz1 - 0.55)) < 0.01 && Math.abs(bz - az) < 0.01 && Math.min(ax, bx) < cut && Math.max(ax, bx) > -cut) continue;      // the gap in front of the stair
      hedgeChunk(N, M.hedge, ax, az, bx, bz, TY, 0.95 + rng() * 0.35, 0.5);
    }
  };
  const i0 = 0.55;
  side(mx0 + i0, mz0 + i0, mx1 - i0, mz0 + i0);          // NE edge
  side(mx1 - i0, mz0 + i0, mx1 - i0, mz1 - i0);          // SE edge (the street side of photo 65)
  side(mx1 - i0, mz1 - i0, mx0 + i0, mz1 - i0);          // SW edge (broken at the stair)
  side(mx0 + i0, mz1 - i0, mx0 + i0, mz0 + i0);          // NW edge

  for (const C of [P, N]) C.pop();

  // ---------------------------------------------------------------- colliders: the platform and the stair (rising toward the church = local -z)
  CH.walk(ph, (mx0 + mx1) / 2, (mz0 + mz1) / 2, mx1 - mx0, mz1 - mz0, 0, TY);
  CH.stairs(ph, 0, (mz1 + stairZ1) / 2, stairW, stairZ1 - mz1, Math.PI, 0, TY, stairN);
  CH.box(ph, -hw - 0.2, (mz1 + stairZ1) / 2, 0.4, stairZ1 - mz1, 0, 0, TY + 0.5);
  CH.box(ph, hw + 0.2, (mz1 + stairZ1) / 2, 0.4, stairZ1 - mz1, 0, 0, TY + 0.5);
  svc.terrace = { cx: CH.W((mx0 + mx1) / 2, (mz0 + mz1) / 2), w: mx1 - mx0, d: mz1 - mz0 };
}
