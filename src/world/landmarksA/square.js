// landmarksA/square.js - Vosstaniya Square (площадь Восстания): the granite paving (OSM w638352776, drawn in 2 m cells wherever no road lies), the Hero City obelisk
// «Городу-герою Ленинграду» (36 m, OSM w1214651505..10: pentagonal stylobate of three steps 0.2 / 0.4 / 1.0 m, polished pedestal with five bronze medallions,
// the 4.5 m bronze laurel wreath, a tapering granite shaft, gilded star 1.8 m), the hedge ring and flowers, the station forecourt (3-head cast-iron lamps, round
// planters, benches, taxi booths), the tourist bureau pavilion w353314781 and the kiosk w1215662501.  Photos SP/refs/station 77-81 (obelisk), 51, 53 (forecourt).
// Obelisk centre = layout.OBELISK (592.2, 164.9); pentagon apex points north (as OSM).  Services: monuments, flagpoles, photoSpots (merged into ctx.services.landmarks).
// KNOCKABLE (core/knock.js, lib/knock-inst.js): with ctx.knock the forecourt lamps (500 kg, static below 23 km/h), round planters, benches and bins are instances about their own foot
// (one dynamic InstancedMesh per part, a record each; the lamp lantern and its halos vanish with the post) and the advertising pillar on the forecourt is its own group in the dynamic
// root (1500 kg, breaks off above 40 km/h). Without ctx.knock the module merges them into the square meshes exactly as it always did.
import * as THREE from 'three';
import { Parts, TH, W, O, wbox, C } from './common.js';
import { cellCap, ringOf, centroid } from './geom.js';
import { AREAS } from '../data/city.js';
import * as L from '../layout.js';
import { knockInstances } from '../lib/knock-inst.js';

const OB = L.OBELISK;
const pent = (cx, cz, R, rot = 0) => Array.from({ length: 5 }, (_, k) => { const a = (-90 + 72 * k) * Math.PI / 180 + rot; return [cx + R * Math.cos(a), cz + R * Math.sin(a)]; });

export function buildSquare(Cc) {
  const { ctx, M, T } = Cc;
  const P = new Parts();
  const N = Cc.night;
  const gran = N.toon(T(C.obelisk, { paint: 0.09, name: 'ob-a' }), '#e8a860', 0.3), granD = N.toon(T(C.obeliskDark, { paint: 0.07, name: 'ob-b' }), '#e8a860', 0.28), granL = N.toon(T('#9a8e86', { paint: 0.06, name: 'ob-c' }), '#e8a860', 0.3);
  const bronze = T('#5b5a44', { paint: 0.05 }), bronzeL = T('#7a6a44', { paint: 0.05 });
  const gold = N.basic(ctx.mat.emissive('#e8b838', 0.85), 1.0, 2.0);
  const hedge = T(C.hedge, { paint: 0.12 });
  const iron = M.iron, glow = N.basic(ctx.mat.emissive('#ffe2a6', 1.0), 0.8, 2.2);

  // ------------------------------------------------------------------ paving texture + cells
  const pavTex = ctx.tex.draw(256, 256, (g, w, h) => {
    const r = ctx.rng('square-paving'); const n = 8, s = w / n;
    g.fillStyle = '#a89a90'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const t = 0.9 + r() * 0.2, pink = r() < 0.35; g.fillStyle = pink ? `rgb(${Math.round(176 * t)},${Math.round(150 * t)},${Math.round(146 * t)})` : `rgb(${Math.round(160 * t)},${Math.round(156 * t)},${Math.round(152 * t)})`; g.fillRect(i * s + 1, j * s + 1, s - 2, s - 2); }
    g.strokeStyle = 'rgba(90,86,82,0.6)'; g.lineWidth = 2; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * w / 2, 0); g.lineTo(i * w / 2, h); g.moveTo(0, i * h / 2); g.lineTo(w, i * h / 2); g.stroke(); }
  }, { key: 'sq_paving', repeat: [1, 1] });
  const pavMat = T('#ffffff', { map: pavTex, paint: 0.03, name: 'sq-paving' });
  const sq = AREAS.find((a) => a.id === 'w638352776');
  if (sq) {
    for (const poly of sq.polys) {
      const ring = ringOf(poly.o);
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of ring) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      const holes = poly.h.map(ringOf);
      const inPoly = (x, z) => { let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const a = ring[i], b = ring[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins; } return ins; };
      const CELL = 2.4, UVS = 4.8;
      for (let x = Math.floor(x0 / CELL) * CELL; x < x1; x += CELL) for (let z = Math.floor(z0 / CELL) * CELL; z < z1; z += CELL) {
        const cx = x + CELL / 2, cz = z + CELL / 2;
        if (!inPoly(cx, cz) || !inPoly(x + 0.2, z + 0.2) || !inPoly(x + CELL - 0.2, z + CELL - 0.2) || !inPoly(x + CELL - 0.2, z + 0.2) || !inPoly(x + 0.2, z + CELL - 0.2)) continue;
        if (L.isOnRoad(cx, cz, 0.3) || L.insideBuilding(cx, cz, 0)) continue;
        P.quad(pavMat, [x, 0.016, z], [x, 0.016, z + CELL], [x + CELL, 0.016, z + CELL], [x + CELL, 0.016, z], [0, 1, 0], [[x / UVS, z / UVS], [x / UVS, (z + CELL) / UVS], [(x + CELL) / UVS, (z + CELL) / UVS], [(x + CELL) / UVS, z / UVS]]);
      }
    }
  }

  // ------------------------------------------------------------------ the obelisk
  const cx = OB.x, cz = OB.z;
  // stylobate: three pentagonal steps (OSM heights 0.2 / 0.4 / 1.0)
  const prismP = (mat, R, y0, y1, rot = 0) => P.prism(mat, pent(cx, cz, R, rot), y0, y1, 't', 2);
  prismP(granL, 8.6, 0.02, 0.2); prismP(gran, 7.0, 0.2, 0.4); prismP(granD, 4.9, 0.4, 1.0);
  // pedestal: pentagonal frustum 1.0 .. 9.4 (R 3.1 -> 2.45) with five bronze medallions
  const frustum = (mat, R0, R1, y0, y1) => {
    const a = pent(cx, cz, R0), b = pent(cx, cz, R1);
    for (let i = 0; i < 5; i++) {
      const j = (i + 1) % 5, mx = (a[i][0] + a[j][0]) / 2 - cx, mz = (a[i][1] + a[j][1]) / 2 - cz, ml = Math.hypot(mx, mz), sl = (R0 - R1) / (y1 - y0);
      P.quad(mat, [a[i][0], y0, a[i][1]], [a[j][0], y0, a[j][1]], [b[j][0], y1, b[j][1]], [b[i][0], y1, b[i][1]], [mx / ml, sl * 0.8, mz / ml]);
    }
    P.cap(mat, b, y1, true);
  };
  frustum(granD, 3.1, 2.5, 1.0, 9.4);
  const ap = (R) => R * Math.cos(Math.PI / 5);                 // apothem of the pentagon
  for (let i = 0; i < 5; i++) {
    const ang = (-90 + 72 * i + 36) * Math.PI / 180, r = ap(2.95) - 0.05;
    const px = cx + Math.cos(ang) * r, pz = cz + Math.sin(ang) * r;
    // medallion: bronze oval (flat disc facing outward) with a lighter raised centre
    const g1 = new THREE.CylinderGeometry(1.0, 1.0, 0.16, 20), g2 = new THREE.CylinderGeometry(0.72, 0.72, 0.24, 16);
    P.push(px, 5.6, pz, -ang + Math.PI / 2);
    P.geo(bronze, g1, 0, 0, 0.0, Math.PI / 2, 0, 0, 0.9, 1.0, 1.25); P.geo(bronzeL, g2, 0, 0, 0.0, Math.PI / 2, 0, 0, 0.9, 1.0, 1.2);
    P.pop(); g1.dispose(); g2.dispose();
  }
  // Glory wreath: bronze laurel ring (dia 4.5 m) around the lower shaft, cartouche on the station side
  {
    const tg = new THREE.TorusGeometry(2.25, 0.42, 8, 28); P.geo(bronze, tg, cx, 9.7, cz, Math.PI / 2, 0, 0); tg.dispose();
    const tg2 = new THREE.TorusGeometry(2.25, 0.22, 6, 28); P.geo(bronzeL, tg2, cx, 10.02, cz, Math.PI / 2, 0, 0); tg2.dispose();
    const cg = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 14); P.geo(gold, cg, cx, 9.7, cz + 2.8, Math.PI / 2, 0, 0, 1, 1, 1.15); cg.dispose();
    const rg = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 10); P.geo(T('#a8262a'), rg, cx, 9.7, cz + 2.95, Math.PI / 2, 0, 0); rg.dispose();
  }
  // shaft: pentagonal, tapering R 1.95 -> 0.75 from 9.4 to 33.6, pyramidion to 34.3
  {
    const a = pent(cx, cz, 1.95), b = pent(cx, cz, 0.75), c = pent(cx, cz, 0.12);
    for (let i = 0; i < 5; i++) {
      const j = (i + 1) % 5, mx = (a[i][0] + a[j][0]) / 2 - cx, mz = (a[i][1] + a[j][1]) / 2 - cz, ml = Math.hypot(mx, mz);
      P.quad(gran, [a[i][0], 9.4, a[i][1]], [a[j][0], 9.4, a[j][1]], [b[j][0], 33.6, b[j][1]], [b[i][0], 33.6, b[i][1]], [mx / ml, 0.05, mz / ml]);
      P.quad(granL, [b[i][0], 33.6, b[i][1]], [b[j][0], 33.6, b[j][1]], [c[j][0], 34.3, c[j][1]], [c[i][0], 34.3, c[i][1]], [mx / ml, 0.7, mz / ml]);
    }
  }
  // gilded star 1.8 m (stainless steel, 2 t) on a short spike: a flat five-pointed star facing the square
  {
    const sh = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 + Math.PI / 2, r = k % 2 ? 0.36 : 0.92; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (k === 0) sh.moveTo(x, y); else sh.lineTo(x, y); }
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: false });
    P.geo(gold, g, cx, 35.05, cz - 0.11, 0, 0, 0); g.dispose();
    const g2 = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: false });
    P.geo(gold, g2, cx - 0.11, 35.05, cz, 0, Math.PI / 2, 0); g2.dispose();
    P.cyl(gold, cx, cz, 34.3, 34.5, 0.3, 0.12, 8);
  }
  // hedge ring (0.8 m, boxwood) and flowers on the island; the ring follows a rounded pentagon of R 10.2
  {
    const R = 10.2, N = 60, pts = [];
    for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; pts.push([cx + Math.cos(a) * R * 1.18, cz + Math.sin(a) * R * 0.92]); }
    for (let i = 0; i < N; i++) {
      const p = pts[i], q = pts[(i + 1) % N], dx = q[0] - p[0], dz = q[1] - p[1], len = Math.hypot(dx, dz);
      P.push((p[0] + q[0]) / 2, 0, (p[1] + q[1]) / 2, Math.atan2(-dz, dx));
      P.box(hedge, -len / 2 - 0.05, len / 2 + 0.05, 0, 0.85, -0.45, 0.45, 'b');
      P.pop();
    }
    // flower bands: red / yellow / white (inner side of the hedge) in 24 patches
    const flowers = [T('#c92f35', { paint: 0.12 }), T('#e9c73a', { paint: 0.12 }), T('#f1efe9', { paint: 0.1 })];
    for (let i = 0; i < 30; i++) {
      const a = i / 30 * Math.PI * 2, rr = 8.6; const x = cx + Math.cos(a) * rr * 1.18, z = cz + Math.sin(a) * rr * 0.92;
      P.push(x, 0, z, -a); P.box(flowers[i % 3], -1.0, 1.0, 0.0, 0.32, -0.4, 0.4, 'b'); P.pop();
    }
    // red carnations laid at the foot of the stele (5 bunches)
    for (let i = 0; i < 5; i++) { const a = (-90 + 72 * i + 36) * Math.PI / 180; P.box(T('#d0262e', { paint: 0.1 }), cx + Math.cos(a) * 5.4 - 0.3, cx + Math.cos(a) * 5.4 + 0.3, 0.4, 0.7, cz + Math.sin(a) * 5.4 - 0.3, cz + Math.sin(a) * 5.4 + 0.3); }
    ctx.physics.addCylinder(cx, cz, 5.2, 0, 40);
    ctx.physics.addCylinder(cx, cz, 7.2, 0, 1.2);
  }

  // ------------------------------------------------------------------ the forecourt of the station (station frame)
  // The frame ignores that Goncharnaya / Ligovsky / Nevsky run through it: an item of radius r stays only where the asphalt (streets is built before this module) is >= r + 0.3 m away.
  const st = ctx.services.streets;
  const clearXZ = (x, z, r) => !st || st.net.cover(x, z, {}) < -(r + 0.3);
  const clear = (u, d, r = 0.5) => { const [x, z] = W(u, d); return clearXZ(x, z, r); };
  P.push(O.x, 0, O.z, TH);
  // with ctx.knock the furniture is emitted ONCE about the origin of a template Parts and instanced per placement, KN.<family> = [{ x, z, rotY, item, v }]; otherwise into P in place
  const KN = ctx.knock ? { lamp: [], planter: [], bench: [], bin: [] } : null;
  const lampShape = (Q, u, d) => {
    const base = T('#1c1c1e');
    Q.box(base, u - 0.3, u + 0.3, 0, 0.9, d - 0.3, d + 0.3); Q.cyl(base, u, d, 0.9, 5.2, 0.13, 0.09, 8); Q.cyl(base, u, d, 0.9, 1.1, 0.2, 0.2, 8); Q.cyl(base, u, d, 3.2, 3.35, 0.16, 0.16, 8);
    // three arms (two curved sideways, one straight up) with lanterns
    for (const s of [-1, 0, 1]) {
      const ux = u + s * 0.95, top = s === 0 ? 5.9 : 5.45;
      if (s !== 0) { Q.box(base, Math.min(u, ux) - 0.04, Math.max(u, ux) + 0.04, 5.1, 5.18, d - 0.04, d + 0.04); Q.box(base, ux - 0.04, ux + 0.04, 5.1, 5.45, d - 0.04, d + 0.04); }
      else Q.cyl(base, u, d, 5.2, 5.6, 0.07, 0.07, 6);
      Q.cyl(glow, ux, d, top - 0.05, top + 0.5, 0.22, 0.16, 8); Q.cyl(base, ux, d, top + 0.5, top + 0.62, 0.26, 0.04, 8);
      Q.glow(Cc.halo, ux, top + 0.25, d, 2.8);
    }
  };
  const lamp3 = (u, d) => {
    if (!clear(u, d)) return;
    if (KN) KN.lamp.push({ x: W(u, d)[0], z: W(u, d)[1], rotY: TH });
    else lampShape(P, u, d);
    const item = wbox(ctx, u - 0.3, u + 0.3, d - 0.3, d + 0.3, 0, 6);
    if (KN) KN.lamp[KN.lamp.length - 1].item = item;
    Cc.svc.lamps.push({ x: W(u, d)[0], z: W(u, d)[1], h: 6 });
  };
  for (const u of [-62, -38, -14, 14, 38, 62]) lamp3(u, -11);
  for (const u of [-52, -26, 26, 52]) lamp3(u, -32);
  // round white planters with petunias
  const white = T('#f0ede6'), pet = (ctx.season === 'winter'
    ? ['#d4e0e4', '#cbdadf', '#dee6e7'] : ['#c63d8e', '#f3f1ec', '#7c4fa0']).map(color => T(color, { paint: 0.1 }));
  let pi = 0;
  for (const [u, d] of [[-50, -8], [-44, -26], [-20, -22], [20, -22], [44, -26], [50, -8], [-70, -16], [70, -16], [-30, -42], [30, -42]]) {
    if (!clear(u, d)) continue;
    if (KN) KN.planter.push({ x: W(u, d)[0], z: W(u, d)[1], rotY: TH, v: pi++ % 3 });
    else { P.cyl(white, u, d, 0, 0.5, 0.5, 0.44, 12); const g = new THREE.SphereGeometry(0.5, 10, 6); P.geo(pet[pi++ % 3], g, u, 0.5, d, 0, 0, 0, 1, 0.45, 1); g.dispose(); }
    const item = ctx.physics.addCylinder(W(u, d)[0], W(u, d)[1], 0.55, 0, 0.8);
    if (KN) KN.planter[KN.planter.length - 1].item = item;
  }
  // wooden benches (groups of three) facing the facade
  const wood = T(C.wood), metal = T(C.metal);
  const benchShape = (Q) => { Q.box(wood, -0.9, 0.9, 0.42, 0.48, -0.25, 0.25); Q.box(wood, -0.9, 0.9, 0.55, 0.95, 0.25, 0.3); for (const s of [-1, 1]) Q.box(metal, s * 0.85 - 0.04, s * 0.85 + 0.04, 0, 0.45, -0.22, 0.22); };
  const bench = (u, d, rot) => {
    if (!clear(u, d, 1.1)) return;
    if (KN) KN.bench.push({ x: W(u, d)[0], z: W(u, d)[1], rotY: TH + rot });
    else { P.push(u, 0, d, rot); benchShape(P); P.pop(); }
    const item = wbox(ctx, u - 0.95, u + 0.95, d - 0.3, d + 0.3, 0, 1.0);
    if (KN) KN.bench[KN.bench.length - 1].item = item;
  };
  for (const u of [-46, -43.6, -41.2]) bench(u, -14, Math.PI);
  for (const u of [41.2, 43.6, 46]) bench(u, -14, Math.PI);
  // taxi / parking booths at both ends of the forecourt (yellow-orange 2 x 3 m, white 1.5 x 2 m) with barrier arms
  if (clear(-73, -46.5, 1.5)) {
    P.box(T('#e6892b'), -74, -72, 0, 2.6, -48, -45); P.box(T('#4a6a8a'), -74.05, -71.95, 1.2, 2.1, -47.5, -45.5, '');
    P.box(T('#d33'), -72, -66, 1.0, 1.1, -47.5, -47.3); P.box(T('#fff'), -69, -66, 1.0, 1.1, -47.5, -47.3);
    wbox(ctx, -74, -72, -48, -45, 0, 3);
  }
  if (clear(72.75, -45, 1.5)) { P.box(T('#e8e6e0'), 72, 73.5, 0, 2.4, -46, -44); wbox(ctx, 72, 73.5, -46, -44, 0, 3); }
  // round bins and bike racks along the forecourt
  const binM = T('#2f3a36', { name: 'st-bin' });
  const binShape = (Q, u, d) => { Q.cyl(binM, u, d, 0, 0.9, 0.28, 0.3, 8); Q.cyl(iron, u, d, 0.9, 0.96, 0.32, 0.32, 8); };
  for (const [u, d] of [[-56, -12], [-30, -14], [30, -14], [56, -12], [-8, -4], [8, -4], [-66, -30], [66, -30]]) {
    if (!clear(u, d, 0.3)) continue;
    if (KN) KN.bin.push({ x: W(u, d)[0], z: W(u, d)[1], rotY: TH }); else binShape(P, u, d);
    const item = ctx.physics.addCylinder(W(u, d)[0], W(u, d)[1], 0.33, 0, 1);
    if (KN) KN.bin[KN.bin.length - 1].item = item;
  }
  for (const [u, d] of [[-64, -4], [64, -4]]) if (clear(u + 0.9, d, 0.9)) for (let i = 0; i < 4; i++) { P.box(iron, u + i * 0.6 - 0.02, u + i * 0.6 + 0.02, 0.0, 0.85, d - 0.02, d + 0.02); P.box(iron, u + i * 0.6 - 0.02, u + i * 0.6 + 0.02, 0.8, 0.85, d - 0.5, d + 0.5); }
  P.pop();
  if (KN) {
    const part = (Q, o = () => ({})) => Q.parts().map(({ mat, geo }) => ({ geo, mat, ...o(mat) }));
    const spots = (list) => list.map((s) => ({ x: s.x, y: 0, z: s.z, rotY: s.rotY }));
    if (KN.lamp.length) {
      const Q = new Parts(); lampShape(Q, 0, 0);
      knockInstances(ctx, { name: 'st-lamp', parts: part(Q, (m) => m === Cc.halo ? { name: 'halo', shadow: false, noOutline: true, hide: true, far: 500 } : m === glow ? { name: 'glow', hide: true, far: 500 } : { name: 'body' }),
        spots: spots(KN.lamp), items: KN.lamp.map((s) => s.item), far: 320, rec: { kind: 'lamp', mass: 500, h: 6.2, w: 0.6, d: 0.6, anchored: 23, hitK: 0.65, metal: true } });
    }
    if (KN.bench.length) {
      const Q = new Parts(); benchShape(Q);
      knockInstances(ctx, { name: 'st-bench', parts: part(Q), spots: spots(KN.bench), items: KN.bench.map((s) => s.item), far: 200, rec: { kind: 'bench', mass: 45, h: 0.9, w: 1.9, d: 0.6, hitK: 0.25 } });
    }
    if (KN.bin.length) {
      const Q = new Parts(); binShape(Q, 0, 0);
      knockInstances(ctx, { name: 'st-bin', parts: part(Q), spots: spots(KN.bin), items: KN.bin.map((s) => s.item), far: 170, rec: { kind: 'bin', mass: 14, h: 0.9, r: 0.3, hitK: 0.12, metal: true } });
    }
    if (KN.planter.length) {
      const Q = new Parts(); Q.cyl(white, 0, 0, 0, 0.5, 0.5, 0.44, 12);
      const bloom = new THREE.SphereGeometry(0.5, 10, 6); bloom.scale(1, 0.45, 1); bloom.translate(0, 0.5, 0);               // the petunias: one shape, a material per colour
      knockInstances(ctx, { name: 'st-planter', parts: [...part(Q), ...pet.map((mat, v) => ({ geo: bloom, mat, name: 'bloom' + v, when: (s, i) => KN.planter[i].v === v }))],
        spots: spots(KN.planter), items: KN.planter.map((s) => s.item), far: 170, rec: { kind: 'planter', mass: 250, h: 0.8, r: 0.55, hitK: 0.4 } });
    }
  }

  // advertising pillars (round, black domed "тумба" with a lit generic poster), one on the island next to the obelisk, one on the forecourt
  {
    const posterTex = ctx.tex.draw(256, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2a5fb0'); gr.addColorStop(1, '#e0713a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#fff4d8'; g.font = '700 38px "Noto Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Афиша', w * 0.25, h * 0.3); g.font = '600 24px "Noto Sans", sans-serif'; g.fillText('Концерты · Театр', w * 0.25, h * 0.62); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(w * 0.75, h * 0.5, 34, 0, 7); g.fill(); }, { key: 'sq_poster' });
    const pm = T('#ffffff', { map: posterTex, paint: 0, name: 'sq-poster' }); pm.emissiveMap = posterTex; N.toon(pm, '#ffffff', 0.95, 0.0);
    const domeM = T('#1d1e22', { name: 'sq-dome', paint: 0.02 });
    const pillarShape = (Q, x, z) => {
      Q.cyl(domeM, x, z, 0, 0.55, 0.9, 0.85, 14);
      const cg = new THREE.CylinderGeometry(0.82, 0.82, 1.9, 20, 1, true); Q.geo(pm, cg, x, 1.5, z); cg.dispose();
      const dg = new THREE.SphereGeometry(0.95, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); Q.geo(domeM, dg, x, 2.45, z, 0, 0, 0, 1, 0.8, 1); dg.dispose();
      Q.cyl(domeM, x, z, 3.1, 3.5, 0.05, 0.02, 6); Q.cyl(domeM, x, z, 2.42, 2.55, 0.9, 0.9, 14);
    };
    const pillar = (x, z) => {
      if (ctx.knock) {                                                         // its own group about the foot, in the dynamic root (the zero-size halo quad of old is dropped)
        const Q = new Parts(), grp = new THREE.Group(); grp.name = 'sq-ad-pillar'; pillarShape(Q, 0, 0); Q.build(grp, { name: 'sq-ad-pillar' }); grp.position.set(x, 0, z);
        const item = ctx.physics.addCylinder(x, z, 0.95, 0, 3.5);
        ctx.add(grp);
        ctx.knock.register({ kind: 'column', x, z, y: 0, rotY: 0, mass: 1500, h: 3.5, r: 0.95, anchored: 40, hitK: 1.0, item, parts: [{ obj: grp }] });
        return;
      }
      pillarShape(P, x, z);
      ctx.physics.addCylinder(x, z, 0.95, 0, 3.5);
      P.glow(Cc.halo, x, 1.5, z, 0.0);
    };
    for (const [x, z] of [[609.5, 171.5], W(-58, -26)]) if (clearXZ(x, z, 0.95)) pillar(x, z);
  }

  // ------------------------------------------------------------------ the tourist bureau (w353314781) and the "Ежедневник" kiosk (w1215662501)
  const kioskOf = (id, h, wall, signText, key, roof) => {
    const b = L.buildingById(id); if (!b) return;
    const ring = ringOf(b.polys[0].o), [kx, kz] = centroid(ring);
    P.prism(wall, ring, 0, h, 't');
    // sign band + glass front on the side that faces the nearest street: the long side facing -z (north) is fine
    let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9; for (const p of ring) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mnz = Math.min(mnz, p[1]); mxz = Math.max(mxz, p[1]); }
    const tex = ctx.tex.sign({ w: 512, h: 96, bg: '#1d3b6b', fg: '#ffffff', text: signText, size: 54, key, font: '"Noto Sans", sans-serif' });
    const m = N.toon(T('#ffffff', { map: tex, paint: 0, name: 'kiosk-' + key }), '#ffffff', 1.0, 0.35);
    P.quad(m, [mxx, h - 0.2, mnz - 0.04], [mnx, h - 0.2, mnz - 0.04], [mnx, h + 0.45, mnz - 0.04], [mxx, h + 0.45, mnz - 0.04], [0, 0, -1], [[1, 0], [0, 0], [0, 1], [1, 1]].map(([a, bb]) => [1 - a, bb]));
    P.quad(ctx.mat.emissive('#ffe7b0', 0.9), [mxx - 0.2, 0.9, mnz - 0.05], [mnx + 0.2, 0.9, mnz - 0.05], [mnx + 0.2, h - 0.35, mnz - 0.05], [mxx - 0.2, h - 0.35, mnz - 0.05], [0, 0, -1]);
    P.prism(roof, ring.map((p) => [p[0] + Math.sign(p[0] - kx) * 0.25, p[1] + Math.sign(p[1] - kz) * 0.25]), h, h + 0.25, 't');
    ctx.physics.addAABB(mnx, mnz, mxx, mxz, 0, h + 0.3);
  };
  kioskOf('w353314781', 3.3, T('#c9d3d8'), 'Туристско-информационное бюро', 'sq_tourist', T('#4a5560'));
  kioskOf('w1215662501', 2.8, T('#5d6670'), 'Ежедневник · пресса', 'sq_daily', T('#2e3338'));

  const g = new THREE.Group(); g.name = 'vosstaniya-square';
  P.build(g, {});
  g.traverse((o) => { if (o.isMesh && (o.material === gold || o.material === Cc.halo)) o.castShadow = false; });
  ctx.addStatic(g);
  Cc.parts.squareTris = P.tris;

  // ------------------------------------------------------------------ services
  Cc.svc.monuments.push({ id: 'w1214651508', name: 'Обелиск «Городу-герою Ленинграду» · Hero City obelisk', x: cx, z: cz, h: 36 });
  const fp = (u, d) => W(u, d);
  // user rule: no flags / flagpoles anywhere (services.landmarks.flagpoles stays empty)
  const yawFrom = (x0, z0, x1, z1) => L.yawToward(x0, z0, x1, z1);
  const spots = [
    { p: fp(0, -62), to: [OB.x, OB.z - 0], name: 'Фасад вокзала с площади · Station facade from the square', toStation: true },
    { p: [OB.x - 22, OB.z + 20], to: [OB.x, OB.z], name: 'Обелиск Городу-герою · Hero City obelisk' },
    { p: [520, 150], to: [OB.x, OB.z], name: 'Площадь Восстания с Невского · Vosstaniya Square from Nevsky' },
  ];
  for (const s of spots) {
    const to = s.toStation ? W(0, 4) : s.to;
    Cc.svc.photoSpots.push({ x: s.p[0], z: s.p[1], yaw: yawFrom(s.p[0], s.p[1], to[0], to[1]), name: s.name });
  }
  Cc.svc.squareCentre = { x: L.SQUARE.x, z: L.SQUARE.z };
  return g;
}
