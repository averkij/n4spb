// landmarksMining/street.js - the street furniture in front of the Mining University (docs/research/mining.md 5.1, photos refs/mining 01 02 04 10 12): the BOLLARD CHAIN (black iron stump posts 0.9 m with round caps, two sagging
// chain swags between neighbours, every ~4.5 m along the whole front of both wings and the portico, one metre inside the kerb: found by marching from the facade outward until net.cover reports 1 m of clearance)
// and the two ORNATE LAMPS at the ends of the stair (deep teal cast iron `#0f4f45`, a fluted shaft on a bulbous ribbed base, gilded collars, FIVE hexagonal lanterns on a cross of arms).  Nothing stands on a
// carriageway (road integrity rules: every post is tested against net.cover < -0.5 at its FINAL position).  Published: svc.lamps, svc.bollards.
import * as THREE from 'three';
import * as L from '../layout.js';
import { P as FP, coverOf } from './frame.js';

export async function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics, cover = coverOf(ctx);
  const sph = new THREE.SphereGeometry(1, 8, 6);
  const step = (name, fn) => { const t0 = performance.now(); try { fn(); if (typeof process !== 'undefined' && process.env && process.env.MINING_DEBUG) console.log('  [street] ' + name + ' ' + Math.round(performance.now() - t0) + ' ms'); } catch (e) { console.error(`[landmarksMining/street] ${name}:`, e); } };
  const free = (x, z, m = 0.5) => cover(x, z) < -m && !L.insideBuilding(x, z, 0.3);
  // ------------------------------------------------------------------------------------------ the guide rays: the facade fronts in frame P, each with its outward normal and the start offset
  const segs = [
    { a: [-74.8, -23.6], b: [-61.2, -18.1], d0: 1.6 }, { a: [-61.2, -18.1], b: [-34.4, -8.9], d0: 1.6 }, { a: [-34.2, -6.1], b: [-22.0, -6.5], d0: 1.6 },
    { a: [-38, 0], b: [38, 0], d0: 7.0, n: [0, 1] },
    { a: [21.7, -4.5], b: [32.4, -4.9], d0: 1.6 }, { a: [32.3, -7.7], b: [71.9, -25.1], d0: 1.6 },
  ];
  const nodes = [];
  step('rays', () => {
    for (const s of segs) {
      const du = s.b[0] - s.a[0], dw = s.b[1] - s.a[1], len = Math.hypot(du, dw);
      const n = s.n || [dw / len, -du / len];
      const nn = n[1] >= 0 ? n : [-n[0], -n[1]];                              // every front faces the river (+w)
      const k = Math.max(1, Math.round(len / 1.5));
      for (let i = 0; i <= k; i++) {
        const u = s.a[0] + du * i / k, w = s.a[1] + dw * i / k;
        let t = s.d0, ok = false;
        for (; t < 45; t += 1.0) { const p = FP.W(u + nn[0] * t, w + nn[1] * t); if (cover(p.x, p.z) > -1.0) { ok = true; break; } }      // coarse march (1 m) ...
        if (ok) { t -= 1.0; ok = false; for (let k = 0; k < 6; k++, t += 0.2) { const p = FP.W(u + nn[0] * t, w + nn[1] * t); if (cover(p.x, p.z) > -1.0) { ok = true; break; } } }   // ... then 0.2 m
        if (!ok || t - s.d0 < (s.n ? 0.55 : 1.2)) continue;
        const q = FP.W(u + nn[0] * (t - 0.25), w + nn[1] * (t - 0.25));
        nodes.push([q.x, q.z]);
      }
    }
  });
  // resample the guide polyline every 4.5 m
  const posts = [];
  step('posts', () => {
    if (nodes.length < 2) return;
    let acc = 4.5, prev = nodes[0];
    const emit = (p) => { if (free(p[0], p[1])) posts.push(p); };
    emit(prev);
    for (let i = 1; i < nodes.length; i++) {
      const b = nodes[i]; let dx = b[0] - prev[0], dz = b[1] - prev[1], l = Math.hypot(dx, dz);
      if (l > 14) { prev = b; acc = 4.5; emit(b); continue; }                         // a jump (the portico gap): start afresh
      while (l >= acc) { const t = acc / l; prev = [prev[0] + dx * t, prev[1] + dz * t]; emit(prev); dx = b[0] - prev[0]; dz = b[1] - prev[1]; l = Math.hypot(dx, dz); acc = 4.5; }
      acc -= l; prev = b;
    }
  });
  step('draw', () => {
    const y0 = 0.1;
    for (const [x, z] of posts) {
      P.cyl(M.bollard, [x, y0, z], [x, y0 + 0.68, z], 0.1, 0.075, 8, true);
      P.cyl(M.bollard, [x, y0 + 0.68, z], [x, y0 + 0.74, z], 0.115, 0.115, 8, true);
      P.geo(M.bollard, sph, x, y0 + 0.84, z, 0, 0, 0, 0.095, 0.095, 0.095);
      ph.addCylinder(x, z, 0.1, 0, 0.9);
    }
    svc.bollards = posts.length;
    // chains: two swags between neighbours within 6 m (sag 0.25 m, 5 straight links each)
    for (let i = 0; i + 1 < posts.length; i++) {
      const a = posts[i], b = posts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (l > 6.2 || l < 1.0) continue;
      let pv = null;
      for (let k = 0; k <= 6; k++) {
        const t = k / 6, y = y0 + 0.72 - 0.25 * 4 * t * (1 - t), p = [a[0] + (b[0] - a[0]) * t, y, a[1] + (b[1] - a[1]) * t];
        if (pv) P.cyl(M.chain, pv, p, 0.014, 0.014, 4, false);
        pv = p;
      }
    }
  });
  // ------------------------------------------------------------------------------------------ the two ornate lamps at the stair ends
  step('lamps', () => {
    const lantern = (x, y, z, s = 1) => {
      P.cyl(M.lampGlass, [x, y, z], [x, y + 0.5 * s, z], 0.17 * s, 0.15 * s, 6, true);
      P.cyl(M.lampCap, [x, y + 0.5 * s, z], [x, y + 0.7 * s, z], 0.2 * s, 0.03 * s, 6, true);
      P.cyl(M.lampShade, [x, y - 0.06 * s, z], [x, y, z], 0.1 * s, 0.17 * s, 6, true);
      P.geo(M.gold, sph, x, y + 0.74 * s, z, 0, 0, 0, 0.04 * s, 0.05 * s, 0.04 * s);
    };
    // the carriageway of this world's OSM reaches w ~ 8.5 at the portico and w ~ 6 beyond the cheeks (net.cover), so the lamps stand 3 m beyond the outer cheek ends on the strip in front of the links
    for (const [u, w, id] of [[-25.2, 2.6, 'n8754378141'], [25.2, 2.6, 'n8754378142']]) {
      let p = FP.W(u, w), pw = w;
      for (; pw > 0.5 && !free(p.x, p.z, 1.2); pw -= 0.3) p = FP.W(u, pw - 0.3);
      if (!free(p.x, p.z, 1.2)) continue;
      const x = p.x, z = p.z, y0 = 0.1;
      P.cyl(M.lampPost, [x, y0, z], [x, y0 + 0.25, z], 0.5, 0.42, 10, true);                     // round step
      P.cyl(M.lampPost, [x, y0 + 0.25, z], [x, y0 + 0.9, z], 0.42, 0.26, 10, false);             // bulbous ribbed base
      P.cyl(M.lampPost, [x, y0 + 0.9, z], [x, y0 + 1.25, z], 0.26, 0.2, 10, false);
      P.cyl(M.lampPost, [x, y0 + 1.25, z], [x, y0 + 5.0, z], 0.12, 0.08, 8, true);               // the shaft
      for (const yy of [1.3, 1.7, 4.6]) P.cyl(M.gold, [x, y0 + yy, z], [x, y0 + yy + 0.07, z], 0.15, 0.15, 8, true);
      const rot = FP.rot;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {                                // the cross of four arms with four lanterns + one on top
        const c = Math.cos(rot), s2 = Math.sin(rot), ax = x + (dx * c + dz * s2) * 0.85, az = z + (-dx * s2 + dz * c) * 0.85;
        P.cyl(M.lampPost, [x, y0 + 4.55, z], [ax, y0 + 4.75, az], 0.04, 0.03, 5, false);
        lantern(ax, y0 + 4.78, az, 0.85);
      }
      lantern(x, y0 + 5.0, z, 1.0);
      ph.addCylinder(x, z, 0.5, 0, 5.5);
      svc.lamps.push({ id, x, z, h: 6 });
    }
  });
}
