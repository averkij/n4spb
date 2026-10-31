// landmarksKamennyDachasWest/fence.js - the plot FENCES of the three dachas along the baked OSM lines (frame.js CHAINS) and their closed gates (GATES):
//   pol  Polovtsov: black spear-headed bars with arcs and rings, 2.0 m on a 0.95 m rose granite socle, ball-topped posts every 4 m, granite gate piers (V05 V08)
//   gau  Gauswald: pale-green spear bars with C-scroll arcs, 1.55 m on a low limestone socle, brick piers (red with buff zig-zag ribbons, white stepped caps, green domes) at the gates and every ~30 m (G07 G12)
//   fol  Follenweider: black bars in groups with slot ornaments, 1.9 m, rough dark granite gate piers, a black pent roof over the wicket (F01 F07)
// Every run is solid (K.shared.fences -> walk.js) and every gate is a closed double leaf.  The line is cut at each gate by arc length.
import * as THREE from 'three';
import { CHAINS, GATES } from './frame.js';
import { Q } from './facade.js';
import { ball } from './util.js';
import * as L from '../layout.js';

const CFG = {
  pol: { cell: 'fenceP', leaf: 'leafP', h: 2.0, socle: 0.95, st: 0.5, socleMat: 'granP', post: 4, pier: 'pol' },
  gau: { cell: 'fenceG', leaf: 'leafG', h: 1.55, socle: 0.28, st: 0.3, socleMat: 'limestone', post: 4, pier: 'gau' },
  fol: { cell: 'fenceF', leaf: 'leafF', h: 1.9, socle: 0.3, st: 0.3, socleMat: 'graniteF', post: 4, pier: 'fol' },
};
const GATE_KIND = { pol: 'pol', fol: 'fol', folw: 'fol', gau: 'gau', gaub: 'gau' };

/** the line of a chain with every part that would stand on asphalt pushed inward (toward the plot) until it is clear of the carriageway / its parking pocket / the fillet (road integrity rules of docs/AGENT-BRIEF.md: nothing on a carriageway):
 *  the OSM fence of a plot hugs the street edge and the baked asphalt sometimes reaches 1-2 m over it.  The line is densified to <= 2.5 m first so that only the offending stretch moves. */
function clearer(ctx, margin) {
  const net = ctx.services.streets && ctx.services.streets.net;
  return (x, z) => !L.isOnRoad(x, z, margin) && !(net && net.cover && net.cover(x, z, {}) > -margin - 0.1);
}
/** true when (x, z) is NOT on a public carriageway: a private service drive may carry a closed gate (rank 0 roads are not furniture-audited), a street or its parking pocket may not */
function notPublic(ctx, margin) {
  const net = ctx.services.streets && ctx.services.streets.net;
  return (x, z) => {
    const hits = L.roadsNear(x, z, margin, { drivable: true });
    if (hits.some((q) => q.road.hw !== 'service')) return false;
    return hits.length > 0 || !(net && net.cover && net.cover(x, z, {}) > -margin - 0.1);
  };
}
function refine(ctx, pts, inside) {
  const clear = clearer(ctx, 0.9);
  const all = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], Lg = Math.hypot(dx, dz) || 1, n = Math.max(1, Math.ceil(Lg / 2.5));
    let nx = -dz / Lg, nz = dx / Lg; if (nx * (inside[0] - a[0]) + nz * (inside[1] - a[1]) < 0) { nx = -nx; nz = -nz; }
    for (let k = i === 0 ? 0 : 1; k <= n; k++) {
      let x = a[0] + dx * k / n, z = a[1] + dz * k / n;
      let moved = false;
      if (!clear(x, z)) { let s = 0; while (s < 5 && !clear(x + nx * s, z + nz * s)) s += 0.25; if (s <= 5 && clear(x + nx * s, z + nz * s)) { x += nx * s; z += nz * s; moved = true; } }
      all.push({ p: [x, z], moved, orig: k === n || (i === 0 && k === 0) });
    }
  }
  return all.filter((q, i) => q.orig || q.moved || (all[i - 1] && all[i - 1].moved) || (all[i + 1] && all[i + 1].moved)).map((q) => q.p);
}
/** a gate on a chain: arc length g of the nearest point and the direction there (null when farther than 3 m) */
function place(pts, S, gate) {
  let best = null;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
    const s = Math.max(0, Math.min(L, ((gate.p[0] - a[0]) * dx + (gate.p[1] - a[1]) * dz) / L)), px = a[0] + dx / L * s, pz = a[1] + dz / L * s, d = Math.hypot(px - gate.p[0], pz - gate.p[1]);
    if (!best || d < best.d) best = { d, g: S[i] + s, p: [px, pz], rot: Math.atan2(-dz, dx), ux: dx / L, uz: dz / L };
  }
  return best && best.d < 8 ? best : null;
}
function at(pts, S, g) {
  for (let i = 0; i + 1 < pts.length; i++) if (g <= S[i + 1] + 1e-6) { const a = pts[i], b = pts[i + 1], t = (g - S[i]) / ((S[i + 1] - S[i]) || 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  return pts[pts.length - 1];
}

export async function buildFence(K, kind) {
  const { M, P, N } = K, cfg = CFG[kind];
  const sh = (K.shared.fences ||= []);
  const free = clearer(K.ctx, 0.55), priv = notPublic(K.ctx, 0.3);                     // the strict test used to open the fence over a carriageway (a drive through the line stays open: nothing is drawn on asphalt)
  const chains = CHAINS.filter((c) => c.kind === kind);
  const gates = GATES.filter((g) => GATE_KIND[g.kind] === kind);
  for (const ch of chains) {
    const pts = refine(K.ctx, ch.pts, ch.inside), S = [0]; for (let i = 1; i < pts.length; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const cuts = [];
    for (const g of gates) { const pl = place(pts, S, g); if (pl) cuts.push({ ...pl, w: g.w, kind: g.kind }); }
    cuts.sort((a, b) => a.g - b.g);
    // pieces between the gate openings (by arc length)
    const spans = []; let from = 0;
    for (const c of cuts) { const g0 = c.g - c.w / 2, g1 = c.g + c.w / 2; if (g0 > from + 0.3) spans.push([from, g0]); from = Math.max(from, g1); }
    if (S[S.length - 1] > from + 0.3) spans.push([from, S[S.length - 1]]);
    for (const [s0, s1] of spans) {
      // samples every ~0.5 m along the arc length; the asphalt edge of a junction fillet is a cliff (net.cover jumps from -1 to +0.6 within 0.3 m), so a piece stops one sample before it
      const n = Math.max(1, Math.ceil((s1 - s0) / 0.5)), ok0 = [], ok = [];
      for (let i = 0; i < n; i++) { const p = at(pts, S, s0 + (s1 - s0) * (i + 0.5) / n); ok0.push(free(p[0], p[1])); }
      for (let i = 0; i < n; i++) ok.push(ok0[i] && (i === 0 || ok0[i - 1]) && (i === n - 1 || ok0[i + 1]));
      const runs = [];
      for (let i = 0; i < n;) {
        if (!ok[i]) { i++; continue; }
        let j = i; while (j < n && ok[j]) j++;
        const t0 = s0 + (s1 - s0) * i / n, t1 = s0 + (s1 - s0) * j / n, run = [at(pts, S, t0)];
        for (let k = 0; k < pts.length; k++) if (S[k] > t0 + 0.05 && S[k] < t1 - 0.05) run.push(pts[k]);
        run.push(at(pts, S, t1));
        for (let k = 0; k + 1 < run.length; k++) piece(run[k], run[k + 1]);
        runs.push([t0, t1]);
        i = j;
      }
      // every opening where the line crosses a PRIVATE drive (not a public street) is closed with a gate leaf: nobody walks into the closed plot
      let prev = s0;
      for (const [t0, t1] of runs.concat([[s1, s1]])) {
        if (t0 - prev > 0.4 && t0 - prev < 12) { const a = at(pts, S, prev), b = at(pts, S, t0), dx = b[0] - a[0], dz = b[1] - a[1], Lg = Math.hypot(dx, dz) || 1; leaf({ p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], rot: Math.atan2(-dz, dx), ux: dx / Lg, uz: dz / Lg }, t0 - prev + 0.1); }
        prev = Math.max(prev, t1);
      }
    }
    for (const c of cuts) gateGroup(c);
    if (kind === 'gau') for (let s = 18; s < S[S.length - 1] - 6; s += 30) { const p = at(pts, S, s), q = at(pts, S, s + 0.5); if (free(p[0], p[1]) && !cuts.some((c) => Math.abs(c.g - s) < 4)) pierGau(p[0], p[1], Math.atan2(-(q[1] - p[1]), q[0] - p[0]), false); }
  }

  function piece(a, b) {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.25) return;
    const rot = Math.atan2(-dz, dx), cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2;
    P.push(cx, 0, cz, rot); N.push(cx, 0, cz, rot);
    P.box(M[cfg.socleMat], -L / 2, L / 2, 0, cfg.socle, -cfg.st / 2, cfg.st / 2, 'b', 1.8);
    const n = Math.max(1, Math.round(L / 2.0)), k = L / n;
    for (let i = 0; i < n; i++) { const x0 = -L / 2 + i * k, x1 = x0 + k; Q(P, M[cfg.cell], [x0, cfg.socle, 0], [x1, cfg.socle, 0], [x1, cfg.socle + cfg.h, 0], [x0, cfg.socle + cfg.h, 0], [0, 0, 1]); }
    const np = Math.max(1, Math.round(L / cfg.post));
    for (let i = 0; i <= np; i++) {
      const x = -L / 2 + L * i / np, top = cfg.socle + cfg.h + (kind === 'pol' ? 0.25 : 0.12);
      N.box(kind === 'gau' ? M.greenD : M.iron, x - 0.07, x + 0.07, cfg.socle, top, -0.07, 0.07, 'b', 1);
      if (kind === 'pol') ball(N, M.iron, x, top + 0.12, 0, 0.14, 8);
    }
    P.pop(); N.pop();
    sh.push([a, b, 2.4]);
  }
  function leaf(c, w) {
    if (![-w / 2, 0, w / 2].every((s) => priv(c.p[0] + c.ux * s, c.p[1] + c.uz * s))) return;                      // a gate on a public street stays open
    const h = cfg.h, y0 = 0.06;
    P.push(c.p[0], 0, c.p[1], c.rot);
    Q(P, M[cfg.leaf], [-w / 2, y0, 0], [0, y0, 0], [0, y0 + h, 0], [-w / 2, y0 + h, 0], [0, 0, 1]);
    Q(P, M[cfg.leaf], [w / 2, y0, 0], [0, y0, 0], [0, y0 + h, 0], [w / 2, y0 + h, 0], [0, 0, 1]);
    P.pop();
    sh.push([[c.p[0] - c.ux * w / 2, c.p[1] - c.uz * w / 2], [c.p[0] + c.ux * w / 2, c.p[1] + c.uz * w / 2], 2.4]);
  }
  function gateGroup(c) {
    leaf(c, c.w);
    const off = c.w / 2 + 0.4;
    for (const s of [-1, 1]) {
      const x = c.p[0] + c.ux * s * off, z = c.p[1] + c.uz * s * off;
      if (!priv(x, z)) continue;
      const plinth = free(x, z);
      if (cfg.pier === 'pol') pierPol(x, z, c.rot);
      else if (cfg.pier === 'gau') pierGau(x, z, c.rot, true, plinth);
      else pierFol(x, z, c.rot, c.kind === 'folw' && s > 0);
    }
  }
  function pierPol(x, z, rot) {
    P.push(x, 0, z, rot); N.push(x, 0, z, rot);
    P.box(M.granP, -0.42, 0.42, 0, 3.0, -0.42, 0.42, 'b', 1.8);
    P.box(M.white, -0.5, 0.5, 3.0, 3.15, -0.5, 0.5, 'b', 1); P.box(M.white, -0.38, 0.38, 3.15, 3.3, -0.38, 0.38, 'b', 1);
    ball(N, M.iron, 0, 3.45, 0, 0.17, 8);
    P.pop(); N.pop();
  }
  function pierGau(x, z, rot, big, plinth = true) {
    const w = big ? 0.64 : 0.5, h = big ? 2.2 : 1.9;
    P.push(x, 0, z, rot); N.push(x, 0, z, rot);
    if (plinth) P.box(M.limestone, -w / 2 - 0.16, w / 2 + 0.16, 0, 0.45, -w / 2 - 0.16, w / 2 + 0.16, 'b', 1.8);
    P.box(M.pierBrick, -w / 2, w / 2, plinth ? 0.45 : 0, h, -w / 2, w / 2, 'b', 0.64);
    P.box(M.limestone, -w / 2 - 0.1, w / 2 + 0.1, h, h + 0.1, -w / 2 - 0.1, w / 2 + 0.1, 'b', 1.8);
    P.box(M.limestone, -w / 2 - 0.2, w / 2 + 0.2, h + 0.1, h + 0.22, -w / 2 - 0.2, w / 2 + 0.2, 'b', 1.8);
    ball(P, M.greenD, 0, h + 0.22, 0, big ? 0.44 : 0.36, 10, true, 0.75);
    P.pop(); N.pop();
  }
  function pierFol(x, z, rot, wicket) {
    P.push(x, 0, z, rot); N.push(x, 0, z, rot);
    P.box(M.graniteF, -0.5, 0.5, 0, 3.0, -0.5, 0.5, 'b', 1.2);
    P.box(M.iron, -0.56, 0.56, 3.0, 3.12, -0.56, 0.56, 'b', 1);
    N.box(M.iron, -0.16, 0.16, 2.0, 2.45, 0.5, 0.64, '', 1);
    if (wicket) {
      const g = new THREE.BoxGeometry(2.4, 0.12, 1.8); g.translate(-1.2, 0, 0); N.geo(M.iron, g, 0.4, 3.35, 0, 0, 0, -0.2); g.dispose();
    }
    P.pop(); N.pop();
  }
}
