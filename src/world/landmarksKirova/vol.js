// landmarksKirova/vol.js - the box partition of a footprint: volumes { id, x: [x0, x1], z: [z0, z1], h, y0?, sk: { f, k, l, r } } in the LOCAL frame of a pushed Parts frame (x to the right as seen from the front, z toward
// the front = +z).  Side keys: f = the face toward +z, k = toward -z, l = toward -x, r = toward +x.  A skin { mat, tu, tv, v0 } textures a side (uv in metres / tile); null = drawn by a detail file or hidden.
// topAt / exposed: a probe 6 cm outside every 0.5 m cell of a side finds the neighbouring volume; the wall of a volume there runs from the neighbour's top (or the ground) to its own top, so the outline of the
// whole building is closed with no double faces (docs/rules/FACADE-INTEGRITY.md).  Used by dk.js (frame FD) and erarta.js (frame FE).
/** the highest volume covering the local point (x, z), ignoring `skipId`; 0 when none */
export function topAt(vols, x, z, skipId) {
  let best = 0;
  for (const v of vols) { if (v.id === skipId) continue; if (x >= v.x[0] - 1e-6 && x <= v.x[1] + 1e-6 && z >= v.z[0] - 1e-6 && z <= v.z[1] + 1e-6 && v.h > best) best = v.h; }
  return best;
}

/** exposed runs of one side: [{ a0, a1, ya, yb }] with a = x (sides f, k) or z (sides l, r) */
export function exposed(vols, v, side, cell = 0.5) {
  const alongX = side === 'f' || side === 'k';
  const A0 = alongX ? v.x[0] : v.z[0], A1 = alongX ? v.x[1] : v.z[1], n = Math.max(1, Math.ceil((A1 - A0) / cell)), runs = [];
  const fixed = side === 'f' ? v.z[1] + 0.06 : side === 'k' ? v.z[0] - 0.06 : side === 'l' ? v.x[0] - 0.06 : v.x[1] + 0.06;
  let cur = null;
  for (let i = 0; i < n; i++) {
    // review 2026-10-09: a cell is covered only where ALL of its probes (both ends and the middle) are covered: the centre probe alone dropped the 0.1 .. 0.2 m return of a front that steps 0.1 / 0.2 m
    // against its neighbour (pavilion / centre block / east wing: FRONT.line -32.4, -32.2, -32.1), which left a hairline slot that showed the sky from oblique angles (rv shots c_4, dk_8)
    const a = A0 + (i + 0.5) * (A1 - A0) / n, h2 = (A1 - A0) / n / 2 - 0.02, pr = (t) => (alongX ? topAt(vols, t, fixed, v.id) : topAt(vols, fixed, t, v.id));
    const o = Math.min(pr(a), pr(a - h2), pr(a + h2)), ya = Math.max(o, v.y0 || 0);
    if (ya >= v.h - 0.01) { cur = null; continue; }
    if (cur && Math.abs(cur.ya - ya) < 0.01) cur.a1 = A0 + (i + 1) * (A1 - A0) / n;
    else { cur = { a0: A0 + i * (A1 - A0) / n, a1: A0 + (i + 1) * (A1 - A0) / n, ya, yb: v.h }; runs.push(cur); }
  }
  return runs;
}

/** a wall rectangle on a side of a volume: a from a0 to a1, y from ya to yb, textured with the skin */
export function sideQuad(P, mat, v, side, a0, a1, ya, yb, sk, lift = 0) {
  const tu = sk.tu, tv = sk.tv, v0 = sk.v0 || 0, vv = (y) => y / tv + v0;
  if (side === 'f' || side === 'k') {
    const z = side === 'f' ? v.z[1] + lift : v.z[0] - lift, n = [0, 0, side === 'f' ? 1 : -1];
    P.quad(mat, [a0, ya, z], [a1, ya, z], [a1, yb, z], [a0, yb, z], n, [[a0 / tu, vv(ya)], [a1 / tu, vv(ya)], [a1 / tu, vv(yb)], [a0 / tu, vv(yb)]]);
  } else {
    const x = side === 'l' ? v.x[0] - lift : v.x[1] + lift, n = [side === 'l' ? -1 : 1, 0, 0];
    P.quad(mat, [x, ya, a0], [x, ya, a1], [x, yb, a1], [x, yb, a0], n, [[a0 / tu, vv(ya)], [a1 / tu, vv(ya)], [a1 / tu, vv(yb)], [a0 / tu, vv(yb)]]);
  }
}

/** a 0.5 m parapet along an exposed run (outer face flush with the wall, material of the skin) with a pale coping lip */
export function parapet(P, M, v, s, run, sk, o = {}) {
  const t = o.t ?? 0.3, hh = o.hh ?? 0.5, y = v.h, wm = M[sk.mat] || M.wall, cm = o.coping || M.coping;
  if (s === 'f' || s === 'k') {
    const z = s === 'f' ? v.z[1] : v.z[0], z0 = s === 'f' ? z - t : z, z1 = s === 'f' ? z : z + t;
    P.box(wm, run.a0, run.a1, y, y + hh, z0, z1, 'b', 4);
    P.box(cm, run.a0 - 0.02, run.a1 + 0.02, y + hh, y + hh + 0.07, z0 - 0.05, z1 + 0.05, 'b', 1);
  } else {
    const x = s === 'l' ? v.x[0] : v.x[1], x0 = s === 'l' ? x : x - t, x1 = s === 'l' ? x + t : x;
    P.box(wm, x0, x1, y, y + hh, run.a0, run.a1, 'b', 4);
    P.box(cm, x0 - 0.05, x1 + 0.05, y + hh, y + hh + 0.07, run.a0 - 0.02, run.a1 + 0.02, 'b', 1);
  }
}

/** walls of every skinned side (with parapets when o.parapet) + the roof cap (when o.roof !== false) of one volume */
export function drawVolume(K, vols, v, o = {}) {
  const { P, M } = K;
  for (const s of ['f', 'k', 'l', 'r']) {
    const sk = v.sk[s]; if (!sk) continue;
    for (const run of exposed(vols, v, s)) {
      sideQuad(P, M[sk.mat], v, s, run.a0, run.a1, run.ya, run.yb, sk);
      if (o.parapet && run.yb - run.ya > 0.5 && v.y0 === undefined) parapet(P, M, v, s, run, sk, o);
    }
  }
  if (o.roof !== false && !v.noRoof) { const [x0, x1] = v.x, [z0, z1] = v.z; P.cap(M[o.roofMat || 'roof'], [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], v.h, true, 2); }
}
