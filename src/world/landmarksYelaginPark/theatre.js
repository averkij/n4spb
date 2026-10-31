// landmarksYelaginPark/theatre.js - the ESTRADNY (VARIETY) THEATRE of the Yelagin park, the summer open-air stage (Летний театр эстрады; rebuilt from 2014 on an old dance floor, 280 seats, the
// historic look revived).  OSM: two roof outlines w717885285 (east arc, 30.9 x 11.9 m, 15 vertices) and w717885286 (north arc, 31.8 x 12.7 m, 16 vertices) as curved bands round a round arena,
// the stage w717885287 (24.7 x 18.6 m, a convex apron with an arc side to the audience) and the 198 m lattice fence w717885288 (stays the generic fence, not claimed).
// Photos (docs/research/yelagin-park-2026.md park 28, rossi 18, Commons "Эстрадный театр ... Места для зрителей под навесом. 2026" in SP/refs/yelagin-park-build/theatre_seats.jpg): each roof is a
// laminated-timber WAVE: a pale plywood soffit between glulam ribs that fan out from a low wavy lip (about 3 m) to a high back edge (about 5.4 m), the back carried by huge CURVED GLULAM ARCHES
// (about 0.45 x 0.28 m) that spring from concrete feet on sand-earth mounds outside the roof and sweep up under it; thin steel poles hold the lip; under it long wooden bench rows step up
// in green-rubber terraces (white garden benches with diamond-lattice ends at the front), the round arena floor is dark rubber with green edge strips.  The stage is NOT photographed: [E] a 1.05 m
// timber deck with a back and side wall of glulam planks, steps at both ends and a roof of the same wave language (lower lip over the apron, higher back); flagged in the dossier.
// Heights [E]: lip 3.05 m (+- 0.3 wave), back 5.35 m.  Triangles about 14 k, materials: glulam, panel, membrane, steel, concrete, earth, rubber, rubberGreen, benchWood, white, deck.
import * as THREE from 'three';
import { BUILDINGS } from '../data/city.js';
import { resample, ringOf, hash } from './kit.js';

const ROOF_IDS = ['w717885285', 'w717885286'], STAGE_ID = 'w717885287';
const N = 25;                                                              // samples along a band
const rec = (id) => BUILDINGS.find((b) => b.id === id && b.polys && b.polys.length);

/** [inner chain, outer chain] of a roof band from its outline vertices: roof1 (15 vertices) inner v0..v6, outer v7..v14; roof2 (16) inner v0..v6, outer v7..v15; resampled to n points each, paired end to end */
function chains(b, n = N) {
  const o = ringOf(b.polys[0].o), inner = o.slice(0, 7), outer = o.slice(7);
  let a = resample(inner, n), c = resample(outer, n);
  if (Math.hypot(a[0][0] - c[0][0], a[0][1] - c[0][1]) > Math.hypot(a[0][0] - c[n - 1][0], a[0][1] - c[n - 1][1])) c = c.reverse();
  return { inner: a, outer: c };
}
const curve = (pts, n) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))).getPoints(n).map((p) => [p.x, p.y, p.z]);

export function build(K) {
  const { ctx, P, M, svc } = K;
  const bR = ROOF_IDS.map(rec), bS = rec(STAGE_ID);
  if (bR.some((b) => !b)) { console.warn('[landmarksYelaginPark] theatre roofs missing in the baked data'); return; }
  const C = bR.map((b) => chains(b));
  const stats = { roofs: 0, arches: 0, poles: 0, benches: 0, tiers: 0, walk: 0, polePos: [], archFeet: [], stageBoxes: 0 };
  C.forEach((ch, k) => roof(K, ch, k, stats));
  arena(K, C, bS);
  if (bS) stage(K, bS, stats);
  svc.theatre = { ...stats, centre: [-5232, -5342] };
  svc.monuments.push({ id: 'w717885288', name: 'Летний театр эстрады', nameEn: 'Estradny (Variety) Theatre, open-air', x: -5235.1, z: -5340.5, h: 6.0, r: 28 });
  svc.photoSpots.push({ x: -5214, z: -5372, yaw: ctx.L.yawToward(-5214, -5372, -5232, -5348), name: 'Эстрадный театр на Елагином острове' });
}

// ------------------------------------------------------------------------------------------------ one roof band
function roof(K, ch, k, stats) {
  const { ctx, P, M } = K, { inner, outer } = ch, n = inner.length;
  const S = [0]; for (let i = 1; i < n; i++) S.push(S[i - 1] + Math.hypot(inner[i][0] - inner[i - 1][0], inner[i][1] - inner[i - 1][1]));
  const len = S[n - 1], T = (i) => i / (n - 1);
  const yLip = (i) => 3.05 + 0.3 * Math.sin(S[i] / 6.2 * Math.PI * 2 + k * 1.7) + 0.35 * (1 - Math.sin(Math.PI * T(i))) ;     // the wavy lip; it lifts a little at both ends
  const yBack = (i) => 5.35 + 0.18 * Math.sin(S[i] / 9.0 * Math.PI * 2 + 0.6 + k) - 0.25 * (1 - Math.sin(Math.PI * T(i)));
  const th = 0.34;                                                                                         // the roof package: membrane over plywood over the rib tops
  const lip = inner.map((p, i) => [p[0], yLip(i), p[1]]), back = outer.map((p, i) => [p[0], yBack(i), p[1]]);
  const lipU = lip.map((p) => [p[0], p[1] - th, p[2]]), backU = back.map((p) => [p[0], p[1] - th, p[2]]);
  P.ranged(950, () => {
    P.ribbon(M.membrane, lip, back, [0, 1, 0], 3);                                                         // the roof seen from above
    P.ribbon(M.panel, lipU, backU, [0, -1, 0], 3);                                                         // the pale soffit
  });
  // fascias: the lip face (towards the arena) and the back face (away), the two ends
  const out = (i) => { const dx = inner[i][0] - outer[i][0], dz = inner[i][1] - outer[i][1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };   // towards the arena
  P.ranged(950, () => {
    for (let i = 0; i + 1 < n; i++) {
      const [ox, oz] = out(i);
      P.quad(M.glulam, lipU[i], lipU[i + 1], lip[i + 1], lip[i], [ox, 0, oz], [[S[i] / 2, 0], [S[i + 1] / 2, 0], [S[i + 1] / 2, 0.17], [S[i] / 2, 0.17]]);
      P.quad(M.glulam, back[i], back[i + 1], backU[i + 1], backU[i], [-ox, 0, -oz], [[S[i] / 2, 0.17], [S[i + 1] / 2, 0.17], [S[i + 1] / 2, 0], [S[i] / 2, 0]]);
    }
    for (const [i, sg] of [[0, -1], [n - 1, 1]]) {                                                            // the two end faces
      const tx = (inner[Math.min(n - 1, i + 1)][0] - inner[Math.max(0, i - 1)][0]), tz = (inner[Math.min(n - 1, i + 1)][1] - inner[Math.max(0, i - 1)][1]), tl = Math.hypot(tx, tz) || 1;
      P.quad(M.glulam, lipU[i], backU[i], back[i], lip[i], [sg * tx / tl, 0, sg * tz / tl], [[0, 0], [1, 0], [1, 0.34], [0, 0.34]]);
    }
  });
  // glulam ribs under the soffit, fanning from the lip to the back (every ~3.1 m)
  const nr = Math.max(6, Math.round(len / 3.1));
  P.ranged(520, () => {
    for (let r = 0; r <= nr; r++) {
      const i = Math.round(r / nr * (n - 1)), a = lipU[i], b = backU[i];
      const d = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1, dx = (b[0] - a[0]) / d, dz = (b[2] - a[2]) / d;
      const pa = [a[0] + dx * 0.15, a[1] - 0.22, a[2] + dz * 0.15], pb = [b[0], b[1] - 0.3, b[2]];
      P.beam(M.glulam, [pa, pb], 0.15, 0.4, [-dz, 0, dx], 2, 1.7);
    }
  });
  stats.roofs++;
  // the curved glulam arches carrying the back: four per roof, feet 2.7 m behind the back edge on concrete blocks and sand mounds
  const archAt = [0.1, 0.37, 0.63, 0.9];
  P.ranged(900, () => {
    for (const t of archAt) {
      const i = Math.round(t * (n - 1)), b = back[i], a = lip[i], d = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1, dx = (b[0] - a[0]) / d, dz = (b[2] - a[2]) / d;
      const at = (u, y) => [b[0] + dx * u, y, b[2] + dz * u];
      const path = curve([at(3.1, 0.12), at(3.0, 1.3), at(2.55, 2.9), at(1.6, 4.2), at(0.6, b[1] - th - 0.35), at(0.12, b[1] - th - 0.05)], 14);
      P.beam(M.glulam, path, 0.5, 0.3, [-dz, 0, dx], 2, 0.75);
      const fx = b[0] + dx * 3.1, fz = b[2] + dz * 3.1;
      P.tbox(M.concrete, fx, fz, 1.0, 0.7, 0, 0.18, Math.atan2(dx, dz));
      P.geo(M.earth, K.dome(), fx - dx * 0.9, -0.05, fz - dz * 0.9, 0, Math.atan2(dx, dz), 0, 1.5, 0.55, 2.1);              // the mound beside the foot
      ctx.physics.addBox(fx, fz, 0.9, 0.6, Math.atan2(dx, dz), 0, 2.4);
      stats.arches++; stats.archFeet.push([fx, fz]);
    }
  });
  // steel poles under the lip (every ~3.1 m, between the ribs)
  P.ranged(320, () => {
    for (let r = 0; r < nr; r++) {
      const i = Math.round((r + 0.5) / nr * (n - 1)), p = lipU[i];
      P.col(M.steel, p[0], p[2], 0.0, p[1] + 0.08, 0.045, 0.045, 6);
      ctx.physics.addCylinder(p[0], p[2], 0.1, 0, 3.4);
      stats.poles++; stats.polePos.push([p[0], p[2]]);
    }
  });
  // tiered seating: four terraces of green rubber (rise 0.25 m), a bench row on each
  const at = (i, u) => [inner[i][0] + (outer[i][0] - inner[i][0]) * u, inner[i][1] + (outer[i][1] - inner[i][1]) * u];
  const tiers = [[0.1, 0.3, 0.15], [0.3, 0.5, 0.4], [0.5, 0.7, 0.65], [0.7, 0.9, 0.9]];
  P.ranged(420, () => {
    // floor strip from the lip to the first terrace
    P.ribbon(M.rubber, inner.map((p) => [p[0], 0.03, p[1]]), inner.map((p, i) => { const q = at(i, 0.1); return [q[0], 0.03, q[1]]; }), [0, 1, 0], 3);
    tiers.forEach(([u0, u1, y], ti) => {
      const A = [], B = [];
      for (let i = 0; i < n; i++) { const p = at(i, u0), q = at(i, u1); A.push([p[0], y, p[1]]); B.push([q[0], y, q[1]]); }
      P.ribbon(M.rubberGreen, A, B, [0, 1, 0], 3);                                                           // the terrace
      // riser (the front face, towards the arena)
      for (let i = 0; i + 1 < n; i++) {
        const ox = out(i)[0], oz = out(i)[1], p0 = at(i, u0), p1 = at(i + 1, u0), yb = ti ? tiers[ti - 1][2] : 0.03;
        P.quad(M.rubberGreen, [p0[0], yb, p0[1]], [p1[0], yb, p1[1]], [p1[0], y, p1[1]], [p0[0], y, p0[1]], [ox, 0, oz], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      }
      // a bench row along the terrace middle: bench modules of ~2.5 m (seat 0.42 m high, back to 0.85)
      const um = (u0 + u1) / 2 + 0.03, white = ti === 0;
      const mat = white ? M.white : M.benchWood;
      for (let i = 0; i + 1 < n; i += 2) {
        const a = at(i, um), c = at(Math.min(n - 1, i + 2), um), mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2, dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) - 0.12;
        if (l < 1.2) continue;
        const o = out(i);
        let rot = Math.atan2(-dz, dx);
        if (Math.sin(rot) * o[0] + Math.cos(rot) * o[1] < 0) rot += Math.PI;                              // the bench frame: +z looks at the arena
        P.push(mx, y, mz, rot);
        for (const sx of [-l / 2 + 0.2, l / 2 - 0.2]) P.box(white ? M.white : M.steelDark, sx - 0.04, sx + 0.04, 0, 0.42, -0.2, 0.2, '', 1);          // the end frames
        P.box(mat, -l / 2, l / 2, 0.42, 0.47, -0.2, 0.22, '', 2);                                                                                       // the seat
        P.box(mat, -l / 2, l / 2, 0.62, 0.92, -0.28, -0.24, '', 2);                                                                                     // the back
        P.pop();
        stats.benches++;
      }
      stats.tiers++;
    });
  });
  // walk boxes along each terrace (chords of 8 intervals)
  tiers.forEach(([u0, u1, y]) => {
    const seg = 8;
    for (let s = 0; s < seg; s++) {
      const i0 = Math.round(s / seg * (n - 1)), i1 = Math.round((s + 1) / seg * (n - 1)), a = at(i0, (u0 + u1) / 2), b = at(i1, (u0 + u1) / 2);
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
      const wid = Math.hypot(at(i0, u1)[0] - at(i0, u0)[0], at(i0, u1)[1] - at(i0, u0)[1]);
      ctx.physics.addWalkBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, l + 0.3, wid, Math.atan2(-dz, dx), y, 0);
      stats.walk++;
    }
  });
}

// ------------------------------------------------------------------------------------------------ the arena floor
function arena(K, C, bS) {
  const { P, M } = K;
  const i2 = C[1].inner, i1 = C[0].inner;
  const pts = [];
  for (const p of i2) pts.push(p);                                           // north arc inner edge W -> E
  for (const p of i1) pts.push(p);                                           // east arc inner edge N -> S
  if (bS) { const o = ringOf(bS.polys[0].o); for (let i = 3; i < o.length; i++) pts.push(o[i]); pts.push(o[0]); }   // the stage apron arc (from the south end back round to the west end)
  // drop near-duplicates
  const poly = pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.25);
  P.ranged(420, () => { P.cap(M.rubber, poly, 0.032, true, 3); });
  K.svc.theatreArena = poly;
}

// ------------------------------------------------------------------------------------------------ the stage [E]
function stage(K, b, stats) {
  const { ctx, P, M } = K, o = ringOf(b.polys[0].o);
  // vertices of the outline: v0 (-5249.2,-5338) west end of the apron arc, v1 (-5260.8,-5350.1) and v2 (-5250.1,-5365.7) the back corners, v3 (-5235.8,-5358.8) the south end, v4..v8 the apron arc back to v0
  const deck = 1.05, wall = 5.6;
  const arc = [o[3], ...o.slice(4), o[0]];                                    // from the south end to the west end (the apron arc, convex towards the audience)
  const backPts = [o[0], o[1], o[2], o[3]];                                   // the three straight sides (west end -> back -> south end)
  P.ranged(800, () => {
    P.cap(M.deck, o, deck, true, 2);                                          // the deck
    // the fascia round the deck (glulam planks, 1.05 m)
    for (let i = 0; i < o.length; i++) {
      const a = o[i], c = o[(i + 1) % o.length], dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
      P.quad(M.glulam, [a[0], 0, a[1]], [c[0], 0, c[1]], [c[0], deck, c[1]], [a[0], deck, a[1]], [dz / l, 0, -dx / l], [[0, 0], [l / 2, 0], [l / 2, 0.5], [0, 0.5]]);
      P.quad(M.glulam, [c[0], 0, c[1]], [a[0], 0, a[1]], [a[0], deck, a[1]], [c[0], deck, c[1]], [-dz / l, 0, dx / l], [[0, 0], [l / 2, 0], [l / 2, 0.5], [0, 0.5]]);     // (double: the polygon winding is not known)
    }
    // back and side walls of glulam planks, 4.4 m high above the deck
    for (let i = 0; i + 1 < backPts.length; i++) {
      const a = backPts[i], c = backPts[i + 1], dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
      const rotW = Math.atan2(dx, dz) + Math.PI / 2;
      P.tbox(M.battens, (a[0] + c[0]) / 2, (a[1] + c[1]) / 2, l, 0.25, deck, deck + wall, rotW, '', 1);
      P.tbox(M.steel, (a[0] + c[0]) / 2, (a[1] + c[1]) / 2, l + 0.1, 0.36, deck, deck + 0.5, rotW, '', 1);                                  // the concrete base band
      for (let u = 0.6; u < l - 0.3; u += 4.2) {                                                                                           // glulam piers every ~4 m
        const px = a[0] + dx / l * u, pz = a[1] + dz / l * u;
        P.tbox(M.glulam, px, pz, 0.5, 0.5, deck, deck + wall + 0.1, rotW, '', 1);
      }
      ctx.physics.addBox((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, l + 0.3, 0.4, Math.atan2(-dz, dx), 0, deck + wall);
    }
    // the wave roof: lip on the apron arc (4.6 m +- 0.25), back on the walls (6.9 m)
    const n = 21, arcS = resample(arc, n), backS = resample(backPts.slice().reverse(), n);                // arc south -> west; the back polyline south -> west
    const lip = arcS.map((p, i) => [p[0], 4.7 + 0.25 * Math.sin(i / (n - 1) * Math.PI * 4), p[1]]), bk = backS.map((p, i) => [p[0], 7.0 + 0.15 * Math.sin(i / (n - 1) * Math.PI * 3), p[1]]);
    const th = 0.36, lipU = lip.map((p) => [p[0], p[1] - th, p[2]]), bkU = bk.map((p) => [p[0], p[1] - th, p[2]]);
    P.ribbon(M.membrane, lip, bk, [0, 1, 0], 3);
    P.ribbon(M.panel, lipU, bkU, [0, -1, 0], 3);
    for (let i = 0; i + 1 < n; i++) {
      const dx = lip[i + 1][0] - lip[i][0], dz = lip[i + 1][2] - lip[i][2], l = Math.hypot(dx, dz) || 1;
      P.quad(M.glulam, lipU[i], lipU[i + 1], lip[i + 1], lip[i], [dz / l, 0, -dx / l], [[0, 0], [1, 0], [1, 0.17], [0, 0.17]]);
    }
    for (let r = 0; r <= 10; r++) {
      const i = Math.round(r / 10 * (n - 1)), a = lipU[i], c = bkU[i], d = Math.hypot(c[0] - a[0], c[2] - a[2]) || 1, dx = (c[0] - a[0]) / d, dz = (c[2] - a[2]) / d;
      P.beam(M.glulam, [[a[0], a[1] - 0.22, a[2]], [c[0], c[1] - 0.3, c[2]]], 0.16, 0.42, [-dz, 0, dx], 2, 1.6);
    }
    // the front: four curved glulam arches from the apron edge feet (outside the deck) to the lip, so the audience sees the wave frame
    for (const t of [0.1, 0.37, 0.63, 0.9]) {
      const i = Math.round(t * (n - 1)), a = lip[i], bkp = bk[i], d = Math.hypot(a[0] - bkp[0], a[2] - bkp[2]) || 1, dx = (a[0] - bkp[0]) / d, dz = (a[2] - bkp[2]) / d;
      const at = (u, y) => [a[0] + dx * u, y, a[2] + dz * u];
      const path = curve([at(2.2, 0.12), at(2.1, 1.5), at(1.5, 3.1), at(0.7, 4.1), at(0.1, a[1] - th - 0.05)], 12);
      P.beam(M.glulam, path, 0.4, 0.26, [-dz, 0, dx], 2, 0.8);
      ctx.physics.addBox(a[0] + dx * 2.2, a[2] + dz * 2.2, 0.6, 0.6, Math.atan2(dx, dz), 0, 3.0);
      P.tbox(M.steel, a[0] + dx * 2.2, a[2] + dz * 2.2, 0.9, 0.7, 0, 0.16, Math.atan2(dx, dz));
      stats.arches++;
    }
  });
  // collision of the deck: the polygon is cut into 2.2 m strips along its long axis and each strip is one walk box (the outline is not a rectangle: the apron is an arc)
  const cx = o.reduce((s, p) => s + p[0], 0) / o.length, cz = o.reduce((s, p) => s + p[1], 0) / o.length;
  let sxx = 0, sxz = 0, szz = 0; for (const p of o) { const dx = p[0] - cx, dz = p[1] - cz; sxx += dx * dx; sxz += dx * dz; szz += dz * dz; }
  const th2 = 0.5 * Math.atan2(2 * sxz, sxx - szz), ax = Math.cos(th2), az = Math.sin(th2);
  stats.stageBoxes = deckBoxes(ctx, o, cx, cz, ax, az, deck, 2.2);
  // steps near the two ends of the apron arc: 1.8 m wide, rising 0.35 m per tread towards the stage
  const arcF = resample(arc, 41);
  for (const t of [0.07, 0.93]) {
    const i = Math.round(t * 40), p = arcF[i], q0 = arcF[i - 1], q1 = arcF[i + 1];
    const dx = q1[0] - q0[0], dz = q1[1] - q0[1], l = Math.hypot(dx, dz) || 1;
    let nx = -dz / l, nz = dx / l; if ((p[0] - cx) * nx + (p[1] - cz) * nz < 0) { nx = -nx; nz = -nz; }          // outwards (away from the stage centre)
    const rotY = Math.atan2(-nx, -nz), run = 0.4;
    for (let j = 0; j < 2; j++) {                                                                                 // the two visible treads (the third is the deck)
      const dd = run * (j + 0.5), top = deck - 0.35 * (j + 1);
      P.tbox(M.glulam, p[0] + nx * dd, p[1] + nz * dd, 1.8, run, 0, top, rotY);
    }
    ctx.physics.addStairs(p[0] + nx * run, p[1] + nz * run, 1.8, run * 2, rotY, 0, deck - 0.35, 2);
  }
  stats.stage = true;
}

/** walk boxes over a convex-ish polygon: strips of width `step` along the axis (ax, az); each strip is the extent of the polygon across the axis at the strip centre.  Returns the count. */
export function deckBoxes(ctx, o, cx, cz, ax, az, top, step = 2.2, shrink = 0.06) {
  const n = o.length, uv = o.map((p) => [(p[0] - cx) * ax + (p[1] - cz) * az, -(p[0] - cx) * az + (p[1] - cz) * ax]);
  let u0 = 1e9, u1 = -1e9; for (const q of uv) { u0 = Math.min(u0, q[0]); u1 = Math.max(u1, q[0]); }
  const rot = Math.atan2(-az, ax);
  let count = 0;
  for (let u = u0; u < u1 - 0.05; u += step) {
    const a = u, b = Math.min(u1, u + step);
    let vmin = 1e9, vmax = -1e9;
    for (const uc of [a + 0.15, (a + b) / 2, b - 0.15]) {                    // the extent across the axis at three cuts through the strip (the polygon is nearly convex: the narrowest cut is safe)
      let lo = 1e9, hi = -1e9;
      for (let i = 0; i < n; i++) {
        const p = uv[i], q = uv[(i + 1) % n];
        if ((p[0] - uc) * (q[0] - uc) > 0 || p[0] === q[0]) continue;
        const t = (uc - p[0]) / (q[0] - p[0]), v = p[1] + (q[1] - p[1]) * t; lo = Math.min(lo, v); hi = Math.max(hi, v);
      }
      if (lo < hi) { vmin = Math.min(vmin, lo); vmax = Math.max(vmax, hi); }
    }
    if (vmin >= vmax) continue;
    // use the narrowest of the three cuts for the box so that the box never leaves the outline: recompute
    let nlo = -1e9, nhi = 1e9;
    for (const uc of [a + 0.15, (a + b) / 2, b - 0.15]) {
      let lo = 1e9, hi = -1e9;
      for (let i = 0; i < n; i++) { const p = uv[i], q = uv[(i + 1) % n]; if ((p[0] - uc) * (q[0] - uc) > 0 || p[0] === q[0]) continue; const t = (uc - p[0]) / (q[0] - p[0]), v = p[1] + (q[1] - p[1]) * t; lo = Math.min(lo, v); hi = Math.max(hi, v); }
      if (lo < hi) { nlo = Math.max(nlo, lo); nhi = Math.min(nhi, hi); }
    }
    if (nlo >= nhi) continue;
    const um = (a + b) / 2, vm = (nlo + nhi) / 2;
    ctx.physics.addWalkBox(cx + ax * um - az * vm, cz + az * um + ax * vm, (b - a) + 0.1, nhi - nlo - 2 * shrink, rot, top, 0); count++;
  }
  return count;
}
