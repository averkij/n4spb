// landmarksD/fences.js - the iron fences of the sights, from the OSM BARRIERS (kind 'fence') that lie inside the church yard of the Vladimirsky cathedral, in front of the Mariinsky hospital
// (Liteyny pr.: dark green cast iron with granite posts, refs/landmarksD/hospital 01 03) and beside the National Library.  Nobody else draws OSM fences.  Thin colliders follow every segment.
import { BARRIERS } from '../data/city.js';
import * as THREE from 'three';
import { fence } from './parts.js';
import { Parts } from './kit.js';
import { knockBays } from '../lib/fence-bays.js';

// `bays: true` = the region is drawn as BREAKABLE BAYS (lib/fence-bays.js, docs/AREAS.md 13.7: every fence of a new area breaks like a bench: a car at 12 km/h snaps a bay off at the foot). The two regions of the library /
// hospital (Palace-Liteyny) keep their solid colliders and static meshes, so that area's output does not change.
const REGIONS = [
  { name: 'church yard', group: 'vladimirsky', box: [-206, -108, 388, 526], iron: '#1d1f22', h: 1.8, post: '#b9b4a6', bays: true },
  { name: 'hospital', group: 'library', box: [-140, -52, -372, -236], iron: '#2f5a42', h: 2.0, post: '#a9a79f' },
  { name: 'library', group: 'library', box: [-382, -282, -400, -196], iron: '#1d1f22', h: 1.6, post: '#a9a79f' },
];

export function build(K) {
  const ctx = K.ctx;
  let n = 0;
  const claimed = new Set((K.L.GROUPS.landmarksD || []).map((g) => g.key));      // the sub-groups of THIS area (the North claims only 'library'): no fences for a sight the area does not draw
  for (const rg of REGIONS) {
    if (!claimed.has(rg.group)) continue;
    const [x0, x1, z0, z1] = rg.box;
    const inb = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
    rg.runs = [];
    for (const b of BARRIERS) {
      if (b.kind !== 'fence' || !b.pts || b.pts.length < 4) continue;
      const pts = []; for (let i = 0; i < b.pts.length; i += 2) pts.push([b.pts[i], b.pts[i + 1]]);
      if (b.closed) pts.push(pts[0]);
      // keep the part of the polyline inside the region box
      let run = [];
      const flush = () => { if (run.length >= 2) for (const r of clearRuns(run)) { draw(r, rg); n++; } run = []; };
      for (const p of pts) { if (inb(p[0], p[1])) run.push(p); else flush(); }
      flush();
    }
    if (rg.bays && rg.runs.length) fenceBays(rg);
  }
  // Road integrity: a mapped fence that crosses a lane (OSM has no gate there) is opened over the asphalt (streets is built before this module; net.cover > -0.1 = on the carriageway incl. pocket / fillet):
  // neither the footing nor the collider closes the lane.
  function clearRuns(run) {
    const st = ctx.services && ctx.services.streets; if (!st) return [run];
    const out = []; let cur = [];
    const end = () => { if (cur.length >= 2) out.push(cur); cur = []; };
    for (let i = 0; i + 1 < run.length; i++) {
      const a = run[i], b = run[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(l / 0.4));
      const P = (k) => [a[0] + (b[0] - a[0]) * k / m, a[1] + (b[1] - a[1]) * k / m];
      const bad = []; for (let k = 0; k <= m; k++) { const p = P(k); bad.push(st.net.cover(p[0], p[1], {}) > -0.1); }
      if (!bad.some(Boolean)) { if (!cur.length) cur.push(a); cur.push(b); continue; }
      let k = 0;
      while (k <= m) {
        if (bad[k]) { k++; continue; }
        let k1 = k; while (k1 + 1 <= m && !bad[k1 + 1]) k1++;
        if (k === 0 && cur.length) { /* the stretch continues the previous segment */ } else { end(); cur = [P(k)]; }
        if (k1 === m) cur.push(b); else { cur.push(P(k1)); end(); }
        k = k1 + 1;
      }
    }
    end();
    return out;
  }
  /** the breakable form of the same fence (parts.js fence(): granite posts every ~3.4 m with a cap and a finial, two rails, a picket every 0.2 m): one bay per stretch between two posts, the geometry drawn once as templates */
  function fenceBays(rg) {
    const iron = K.mat(rg.iron), postMat = K.mat(rg.post), h = rg.h, gap = 3.4, bays = [];
    for (const run of rg.runs) {
      for (let i = 0; i + 1 < run.length; i++) {
        const a = run[i], b = run[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.5) continue;
        const nn = Math.max(1, Math.round(len / gap)), step = len / nn;
        for (let k = 0; k < nn; k++) {
          const m = Math.max(2, Math.round(step / 0.2)), pk = [];
          for (let q = 1; q < m; q++) { const x = (q / m) * step; if (x < 0.2 || step - x < 0.2) continue; pk.push(x / step); }
          bays.push({ x0: a[0] + dx * k / nn, z0: a[1] + dz * k / nn, x1: a[0] + dx * (k + 1) / nn, z1: a[1] + dz * (k + 1) / nn, y: 0, first: i === 0 && k === 0, pickets: pk });
        }
      }
    }
    const templ = (fn) => { const Q = new Parts(), g = new THREE.Group(); fn(Q); Q.build(g, { name: 'lmD-fence' }); return g.children.map((m) => ({ geo: m.geometry, mat: m.material })); };
    const parts = [];
    templ((Q) => { Q.box(postMat, -0.2, 0.2, 0, h + 0.15, -0.2, 0.2, 'b'); Q.box(postMat, -0.26, 0.26, h + 0.15, h + 0.3, -0.26, 0.26, 'b'); Q.cyl(postMat, [0, h + 0.3, 0], [0, h + 0.62, 0], 0.17, 0.04, 6, false); })
      .forEach((t, i) => parts.push({ geo: t.geo, mat: t.mat, name: 'post' + i, far: 300, ats: (q) => (q.first ? ['start', 'end'] : ['end']) }));
    templ((Q) => { Q.box(iron, 0, 1, h - 0.22, h - 0.16, -0.025, 0.025, ''); Q.box(iron, 0, 1, 0.28, 0.34, -0.025, 0.025, ''); })
      .forEach((t, i) => parts.push({ geo: t.geo, mat: t.mat, name: 'rails' + i, far: 300, stretch: true }));
    templ((Q) => { Q.box(iron, -0.012, 0.012, 0.05, h - 0.05, -0.012, 0.012, 'bt'); Q.cyl(iron, [0, h - 0.05, 0], [0, h + 0.16, 0], 0.03, 0.002, 4, false); })
      .forEach((t, i) => parts.push({ geo: t.geo, mat: t.mat, name: 'picket' + i, far: 220, ats: (q) => q.pickets }));
    knockBays(ctx, { name: 'lmD-churchyard-fence', bays, parts, far: 300,
      collider: () => ({ y0: 0, y1: h, thick: 0.3, e0: 0, e1: 0 }),
      rec: () => ({ kind: 'fence', mass: 300, h, r: 0.15, anchored: 12, hitK: 0.5, metal: true, minDv: 0 }) });
  }
  function draw(run, rg) {
    if (rg.bays) { rg.runs.push(run); return; }
    fence(K, run, { h: rg.h, iron: rg.iron, postMat: K.mat(rg.post), gap: 3.4 });
    for (let i = 0; i + 1 < run.length; i++) {
      const a = run[i], b = run[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.5) continue;
      ctx.physics.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, l, 0.3, Math.atan2(-dz, dx), 0, rg.h);
    }
  }
  K.svc.fences = n;
}
