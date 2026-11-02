// passages.js - carriage arches (проезды / арки) and metro doorways.
//   planPassages(ctx, net, list): every OSM passage way (ROADS with passage = 1: the part of a service road / footway that runs under a building) whose ends touch a visible street /
//     courtyard wall becomes a GATE on that edge (edge.gates = [{ s, w, ... }]): walls.js cuts the wall there and builds the piece above the arch. layout.DOORWAYS (the metro portals
//     inside Nevsky Atrium etc.) become gates too (no tunnel: the metro module draws everything behind them).
//   buildPassages: the tunnel behind a gate pair: two side walls to the spring line (2.55 m) and a semicircular vault, aged plaster, plus colliders for the side walls (the building
//     interior is hollow: without them the player could step sideways out of the passage into the empty volume).
//   edgeGaps(edge, t0, t1): the collider intervals of a piece around its gates.
import * as THREE from 'three';
import { ROADS } from '../data/city.js';
import { DOORWAYS } from '../data/metro.js';
import { ColorBuilder } from './cornice.js';
import { GATE_SPRING } from './walls.js';

const GRID = 16;

export function planPassages(ctx, net, list) {
  const grid = new Map();
  for (const [, r] of net.rec) for (const ring of r.rings) for (const e of ring.edges) {
    if(r.b.waterfront)continue; // panorama never adds gates, tunnel colliders or navigation
    if ((r.b.minH || 0) > 0.5) continue;                 // a raised part (room over the arch) is the roof of the passage: the arch belongs to the body below it, never cut into the part (its spring line is above the part's top: a hole)
    if (!e.pieces.some((p) => p.yLow < 0.2 && p.t1 - p.t0 > 3)) continue;
    const x0 = Math.min(e.a[0], e.b[0]) - 2, x1 = Math.max(e.a[0], e.b[0]) + 2, z0 = Math.min(e.a[1], e.b[1]) - 2, z1 = Math.max(e.a[1], e.b[1]) + 2;
    for (let cx = Math.floor(x0 / GRID); cx <= Math.floor(x1 / GRID); cx++) for (let cz = Math.floor(z0 / GRID); cz <= Math.floor(z1 / GRID); cz++) { const k = cx + ',' + cz; let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(e); }
  }
  const nearEdge = (x, z, tol, gw) => {
    const cell = grid.get(Math.floor(x / GRID) + ',' + Math.floor(z / GRID)); if (!cell) return null;
    let best = null;
    for (const e of cell) {
      const t = (x - e.a[0]) * e.dx + (z - e.a[1]) * e.dz, off = (x - e.a[0]) * e.nx + (z - e.a[1]) * e.nz;
      if (Math.abs(off) > tol || t < gw / 2 + 0.9 || t > e.len - gw / 2 - 0.9) continue;
      if (!e.pieces.some((p) => p.yLow < 0.2 && t - gw / 2 > p.t0 + 0.5 && t + gw / 2 < p.t1 - 0.5)) continue;
      if (!best || Math.abs(off) < best.off) best = { e, t, off: Math.abs(off) };
    }
    return best;
  };
  const gates = [], tunnels = [];
  const addGate = (e, t, gw, extra) => {
    e.gates = e.gates || [];
    if (e.gates.some((g) => Math.abs(g.s - t) < (g.w + gw) / 2 + 1.2)) return null;
    const g = { s: t, w: gw, ...extra }; e.gates.push(g); gates.push({ e, g }); return g;
  };
  for (const r of ROADS) {
    if (!r.passage || !r.pts || r.pts.length < 4) continue;
    const gw = r.hw === 'footway' || r.hw === 'path' ? 2.6 : Math.max(3.0, Math.min(3.8, (r.w || 4) * 0.9));
    const n = r.pts.length / 2;
    const ends = [[r.pts[0], r.pts[1]], [r.pts[(n - 1) * 2], r.pts[(n - 1) * 2 + 1]]];
    const made = [];
    for (const [x, z] of ends) {
      const hit = nearEdge(x, z, 1.8, gw);
      made.push(hit ? addGate(hit.e, hit.t, gw, { road: r.id }) : null);
    }
    if (made[0] || made[1]) tunnels.push({ pts: r.pts, w: gw, id: r.id });
  }
  // carriage gates the research photographs show (known.js: gate = [fraction along the street front, width]): a vault from the street front to the courtyard (a hole ring of the
  // same building) when one lies straight behind the gate; no courtyard behind -> no gate (a blind tunnel would be worse than a plain wall)
  let dossierGates = 0;
  for (const [, rec] of net.rec) {
    if(rec.b.waterfront)continue;
    const spec = rec.st && rec.st.gate; if (!spec || rec.b.minH > 0.5) continue;
    let best = null;
    for (const ring of rec.rings) if (!ring.hole) for (const e of ring.edges) { if (e.street && !e.gates && e.pieces.some((p) => p.yLow < 0.2) && (!best || e.len > best.len)) best = e; }
    const dbg = (m) => { if (typeof process !== 'undefined' && process.env && process.env.CITY_DEBUG) console.log('[city] dossier gate skipped:', rec.b.id, rec.st.name, m); };
    const e = best; if (!e) { dbg('no street edge'); continue; }
    const gw = Math.min(5, spec[1]), pc = e.pieces.filter((p) => p.yLow < 0.2).sort((p, q) => (q.t1 - q.t0) - (p.t1 - p.t0))[0];
    let t = e.len * spec[0]; t = Math.max(pc.t0 + gw / 2 + 1.2, Math.min(pc.t1 - gw / 2 - 1.2, t));
    if (pc.t1 - pc.t0 < gw + 2.6) { dbg('piece too short'); continue; }
    const px = e.a[0] + e.dx * t, pz = e.a[1] + e.dz * t;
    // ray inwards (-normal) to the nearest other edge of the footprint (courtyard side or rear wall), max 45 m
    let dmin = 1e9;
    for (const ring of rec.rings) for (const h of ring.edges) {
      if (h === e || !h.pieces.some((p) => p.yLow < 0.2)) continue;
      const den = (-e.nx) * (-h.dz) - (-e.nz) * (-h.dx); // ray dir d = -n ; edge dir = h.d : solve p + d*s = h.a + h.d*u
      const dx = -e.nx, dz = -e.nz, ex = h.dx, ez = h.dz, cr = dx * ez - dz * ex;
      if (Math.abs(cr) < 1e-6) continue;
      const wx = h.a[0] - px, wz = h.a[1] - pz, s2 = (wx * ez - wz * ex) / cr, u2 = (wx * dz - wz * dx) / cr;
      if (s2 > 2 && s2 < 45 && u2 > 0.5 && u2 < h.len - 0.5 && s2 < dmin) dmin = s2;
      void den;
    }
    if (dmin > 44) { dbg('nothing behind'); continue; }
    const qx = px - e.nx * dmin, qz = pz - e.nz * dmin;
    const hit2 = nearEdge(qx, qz, 1.8, gw);
    if (!hit2 || hit2.e === e) { dbg('no edge at the far end ' + Math.round(dmin)); continue; }
    const g1 = addGate(e, t, gw, { dossier: 1 }); if (!g1) { dbg('gate rejected'); continue; }
    addGate(hit2.e, hit2.t, gw, { dossier: 1 });
    tunnels.push({ pts: [px, pz, qx, qz], w: gw, id: rec.b.id });
    dossierGates++; if (typeof process !== 'undefined' && process.env && process.env.CITY_DEBUG) console.log('[city] dossier gate', rec.b.id, rec.st.name, Math.round(px), Math.round(pz), 'to courtyard', Math.round(dmin), 'm');
  }
  ctx._cityDossierGates = dossierGates;
  for (const d of DOORWAYS) {
    const hit = nearEdge(d.x, d.z, 1.8, d.w || 3);
    if (hit) addGate(hit.e, hit.t, d.w || 3, { metro: true, id: d.id });
  }
  ctx._cityTunnels = tunnels;
  return gates;
}

/** Collider intervals of the piece [t0, t1] of an edge: [[a, b, under]] - solid pieces between the gates, and 'under' boxes above the arch openings. */
export function edgeGaps(e, t0, t1) {
  const gs = (e.gates || []).filter((g) => g.s + g.w / 2 > t0 && g.s - g.w / 2 < t1).sort((a, b) => a.s - b.s);
  const out = []; let cur = t0;
  for (const g of gs) {
    const a = Math.max(t0, g.s - g.w / 2), b = Math.min(t1, g.s + g.w / 2);
    if (a - cur > 0.05) out.push([cur, a, false]);
    out.push([a, b, true]);
    cur = b;
  }
  if (t1 - cur > 0.05) out.push([cur, t1, false]);
  return out;
}

export function buildPassages(ctx, { M }) {
  const tunnels = ctx._cityTunnels || [];
  if (!tunnels.length) return { triangles: 0 };
  let tris = 0;
  const wallC = new THREE.Color('#6d604c'), vaultC = new THREE.Color('#7a6d58'), floorC = new THREE.Color('#554f40');
  for (const tn of tunnels) {
    const n = tn.pts.length / 2, r = tn.w / 2, cy = GATE_SPRING;
    const cB = M.core(tn.pts[0], tn.pts[1]);
    for (let i = 0; i + 1 < n; i++) {
      const ax = tn.pts[i * 2], az = tn.pts[i * 2 + 1], bx = tn.pts[i * 2 + 2], bz = tn.pts[i * 2 + 3], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
      if (L < 0.5) continue;
      const ux = dx / L, uz = dz / L, mx = -uz, mz = ux;                 // axis and lateral
      const P = (t, lat, y) => [ax + ux * t + mx * lat, y, az + uz * t + mz * lat];
      // side walls (facing the axis)
      cB.quad([P(0, r, 0), P(L, r, 0), P(L, r, cy), P(0, r, cy)], [-mx, 0, -mz], wallC);
      cB.quad([P(0, -r, 0), P(L, -r, 0), P(L, -r, cy), P(0, -r, cy)], [mx, 0, mz], wallC);
      // floor (paving, a hair above the ground plane)
      cB.quad([P(0, -r, 0.03), P(L, -r, 0.03), P(L, r, 0.03), P(0, r, 0.03)], [0, 1, 0], floorC);
      // vault: semicircle, 8 segments, facing down / inward
      const K = 8;
      for (let k = 0; k < K; k++) {
        const t0 = (k / K) * Math.PI, t1 = ((k + 1) / K) * Math.PI;
        const l0 = Math.cos(t0) * r, y0 = cy + Math.sin(t0) * r, l1 = Math.cos(t1) * r, y1 = cy + Math.sin(t1) * r;
        const tm = (t0 + t1) / 2, nl = -Math.cos(tm), ny = -Math.sin(tm);
        cB.quad([P(0, l0, y0), P(L, l0, y0), P(L, l1, y1), P(0, l1, y1)], [mx * nl, ny, mz * nl], vaultC);
      }
      // colliders: the side walls (the hollow building interior must not be reachable from the passage)
      for (const side of [-1, 1]) ctx.physics.addBox(ax + ux * L / 2 + mx * (r + 0.15) * side, az + uz * L / 2 + mz * (r + 0.15) * side, L, 0.3, Math.atan2(-uz, ux), 0, 5);
    }
  }
  return { triangles: tunnels.length * 140 };
}
