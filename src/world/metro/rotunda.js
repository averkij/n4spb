// metro/rotunda.js — the surface vestibule of Ploshchad Vosstaniya: the 1955 round colonnaded rotunda with a spire (OSM w28962850 + roof part w310869151), docs/research/metro.md
// section 3 (photos 09-15), station.md (rotunda 24 m, 12-16 fluted columns, spire). Built from the OSM footprint: ochre stucco walls with arched windows between pilasters (a canvas tile,
// 4.8 m x 10.5 m), a cornice with a frieze, the roof, the drum with its colonnade ring, an iron balustrade, the flat dome and the thin steel spire with a gold collar. The doors (DOORWAYS)
// are real openings (the wall quad is split, a lintel closes the top), the interior is a ticket hall + the escalator head hall, see vestibule.js.
import * as THREE from 'three';
import { MeshBuilder, ringFromFlat, signedArea, addCap, polyBounds } from '../lib/massing.js';

const BAY = 4.8, STOREY = 10.5;

/** exterior / interior wall strips along a ring with door openings. inward = normals point into the building. */
export function wallRing(B, ring, y0, y1, o = {}) {
  let r = ring.slice();
  const area = signedArea(r);
  if ((area > 0) === !!o.inward) r = r.reverse();                  // outward normal = (dz, -dx) for area > 0
  const n = r.length, bay = o.bay ?? BAY, floor = o.floor ?? STOREY, doors = o.doors || [];
  const nm = [], len = [];
  for (let i = 0; i < n; i++) { const a = r[i], b = r[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1e-6; len.push(l); nm.push([dz / l, -dx / l]); }
  const cosS = Math.cos(35 * Math.PI / 180);
  const smooth = (i) => { const p = nm[(i + n - 1) % n], q = nm[i]; return p[0] * q[0] + p[1] * q[1] >= cosS; };      // corner i between edge i-1 and edge i
  const avg = (p, q) => { const x = p[0] + q[0], z = p[1] + q[1], l = Math.hypot(x, z) || 1; return [x / l, z / l]; };
  let s = 0;
  for (let i = 0; i < n; i++) {
    const a = r[i], b = r[(i + 1) % n], L = len[i], ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
    const nA = smooth(i) ? avg(nm[(i + n - 1) % n], nm[i]) : nm[i], nB = smooth((i + 1) % n) ? avg(nm[i], nm[(i + 1) % n]) : nm[i];
    // door gaps on this edge
    const gaps = [];
    for (const d of doors) { const px = d.x - a[0], pz = d.z - a[1], t = px * ux + pz * uz, off = Math.abs(-px * uz + pz * ux); if (off < 1.6 && t > -d.w / 2 && t < L + d.w / 2) gaps.push([Math.max(0, t - d.w / 2), Math.min(L, t + d.w / 2), d.h ?? 3.5]); }
    gaps.sort((p, q) => p[0] - q[0]);
    const quad = (t0, t1, ya, yb) => {
      if (t1 - t0 < 0.01 || yb - ya < 0.01) return;
      const f0 = t0 / L, f1 = t1 / L, mix = (p, q, f) => { const x = p[0] * (1 - f) + q[0] * f, z = p[1] * (1 - f) + q[1] * f, l = Math.hypot(x, z) || 1; return [x / l, z / l]; };
      const n0 = mix(nA, nB, f0), n1 = mix(nA, nB, f1);
      const x0 = a[0] + ux * t0, z0 = a[1] + uz * t0, x1 = a[0] + ux * t1, z1 = a[1] + uz * t1;
      const v0 = B.vert(x0, ya, z0, n0[0], 0, n0[1], (s + t0) / bay, ya / floor), v1 = B.vert(x1, ya, z1, n1[0], 0, n1[1], (s + t1) / bay, ya / floor);
      const v2 = B.vert(x1, yb, z1, n1[0], 0, n1[1], (s + t1) / bay, yb / floor), v3 = B.vert(x0, yb, z0, n0[0], 0, n0[1], (s + t0) / bay, yb / floor);
      B.tri(v0, v2, v1); B.tri(v0, v3, v2);
    };
    let t = 0;
    for (const g of gaps) { quad(t, g[0], y0, y1); quad(g[0], g[1], g[2], y1); t = g[1]; }      // wall, then the lintel over the door
    quad(t, L, y0, y1);
    s += L;
  }
}

/** the facade tile: pilaster, rusticated base, arched window with a lattice, frieze + cornice. 4.8 m x 10.5 m */
function facadeTexture(ctx) {
  const PPM = 76;
  return ctx.tex.draw(Math.round(BAY * PPM), Math.round(STOREY * PPM), (g, w, h) => {
    const Y = (v) => h - v * PPM, X = (u) => u * PPM;
    g.fillStyle = '#e3cf94'; g.fillRect(0, 0, w, h);
    const rnd = ctx.rng('rotunda-tile'); for (let i = 0; i < 220; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(160,120,60,0.06)' : 'rgba(255,250,220,0.10)'; g.fillRect(rnd() * w, rnd() * h, 14 + rnd() * 60, 6 + rnd() * 30); }
    // rusticated base (joints every 0.55 m)
    g.fillStyle = 'rgba(120,90,40,0.28)'; for (let v = 0.55; v < 2.5; v += 0.55) g.fillRect(0, Y(v) - 1, w, 2);
    g.fillStyle = '#d3bd80'; g.fillRect(0, Y(0.35), w, X(0.35));
    // arched window: width 2.5 m, sill 2.9 m, springing 6.3 m, crown 7.55 m
    const cx = w / 2, ww = X(2.5) / 2;
    g.fillStyle = '#efe0ae'; g.beginPath(); g.moveTo(cx - ww - X(0.28), Y(2.6)); g.lineTo(cx - ww - X(0.28), Y(6.3)); g.arc(cx, Y(6.3), ww + X(0.28), Math.PI, 0); g.lineTo(cx + ww + X(0.28), Y(2.6)); g.closePath(); g.fill();
    g.fillStyle = '#3a3836'; g.beginPath(); g.moveTo(cx - ww, Y(2.9)); g.lineTo(cx - ww, Y(6.3)); g.arc(cx, Y(6.3), ww, Math.PI, 0); g.lineTo(cx + ww, Y(2.9)); g.closePath(); g.fill();
    const grd = g.createLinearGradient(0, Y(7.5), 0, Y(2.9)); grd.addColorStop(0, 'rgba(255,214,150,0.55)'); grd.addColorStop(1, 'rgba(255,214,150,0.15)'); g.fillStyle = grd; g.fill();
    g.strokeStyle = '#1a1816'; g.lineWidth = 2; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(cx + i * ww / 3.2, Y(2.9)); g.lineTo(cx + i * ww / 3.2, Y(7.5)); g.stroke(); } for (let v = 3.5; v < 7.2; v += 0.7) { g.beginPath(); g.moveTo(cx - ww, Y(v)); g.lineTo(cx + ww, Y(v)); g.stroke(); }
    g.fillStyle = '#d9c78a'; g.fillRect(cx - ww - X(0.32), Y(2.9), X(0.32) + 2, X(0.2)); g.fillRect(cx + ww - 2, Y(2.9), X(0.32) + 2, X(0.2));   // sill blocks
    // pilaster on the left edge (0.55 m, fluted) with base and capital, mirrored half on the right edge so tiles join
    const pil = (x0, w0) => { g.fillStyle = '#ecdcab'; g.fillRect(x0, Y(9.05), w0, X(8.6)); g.fillStyle = 'rgba(130,100,50,0.30)'; for (let k = 1; k < 5; k++) g.fillRect(x0 + k * w0 / 5, Y(8.8), 2, X(8.1)); g.fillStyle = '#d8c488'; g.fillRect(x0 - 3, Y(0.7), w0 + 6, X(0.4)); g.fillRect(x0 - 3, Y(9.2), w0 + 6, X(0.4)); };
    pil(0, X(0.28)); pil(w - X(0.28), X(0.28));
    // frieze + cornice
    g.fillStyle = '#d8c488'; g.fillRect(0, Y(9.5), w, X(0.5)); g.fillStyle = '#e8d8a4'; g.fillRect(0, Y(10.1), w, X(0.6));
    g.fillStyle = 'rgba(120,90,40,0.35)'; for (let x = 4; x < w; x += X(0.32)) g.fillRect(x, Y(9.5), X(0.14), X(0.22));
    g.fillStyle = '#cdb877'; g.fillRect(0, Y(10.5), w, X(0.25));
  }, { key: 'metro-rotunda-facade' });
}
function metroSignTexture(ctx, key, line2) {
  return ctx.tex.draw(512, 160, (g, w, h) => {
    g.fillStyle = '#1d4e9b'; ctx.tex.roundRect(g, 0, 0, w, h, 18); g.fill();
    g.fillStyle = '#ffffff'; ctx.tex.roundRect(g, 14, 14, 132, 132, 22); g.fill();
    g.fillStyle = '#1d4e9b'; g.font = '800 120px "Rubik","Noto Sans",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('М', 80, 86);
    g.fillStyle = '#ffffff'; g.textAlign = 'left'; ctx.tex.fitText(g, 'МЕТРО', 170, line2 ? 56 : 80, w - 190, 66, '"Rubik","Noto Sans",sans-serif', 800);
    if (line2) { ctx.tex.fitText(g, line2, 170, 116, w - 190, 36, '"Rubik","Noto Sans",sans-serif', 500); }
  }, { key });
}

/**
 * o: { poly: footprint { o: [...] } of w28962850, drum: { o: [...] } of w310869151, doors: [{x, z, w, rotY, kind}], floorHole: [[x,z] x 4] (world corners of the shaft opening) }
 * returns { group, ceilingY, drumCentre, ... }
 */
export function buildRotunda(ctx, M, o) {
  const { mat } = ctx;
  const R = new THREE.Group(); R.name = 'vosstaniya-rotunda'; R.userData.zone = 'vosstaniya-rotunda'; ctx.addStatic(R);
  const k = ctx.kit(R);
  const ring = ringFromFlat(o.poly.o), b = polyBounds(o.poly);
  const fTex = facadeTexture(ctx); fTex.wrapS = fTex.wrapT = THREE.RepeatWrapping; const facade = mat.toon('#ffffff', { map: fTex }), roofM = mat.toon('#7d8791'), stone = mat.toon('#e6d49a'), stoneLight = mat.toon('#eadca8'), steel = mat.toon('#a9b2ba'), goldM = mat.toon('#d9b050');
  const doors = o.doors.map((d) => ({ ...d, h: 3.5 }));
  const TOP = STOREY;

  // ---- exterior walls (door gaps with lintels), the roof ring, the interior faces
  const W = new MeshBuilder(); wallRing(W, ring, 0, TOP, { doors });
  R.add(new THREE.Mesh(W.build(), facade));
  const Wi = new MeshBuilder(); wallRing(Wi, ring, 0, 6.8, { doors, inward: true, bay: 6, floor: 6.8 });
  R.add(new THREE.Mesh(Wi.build(), M.rotundaInner));
  const roofB = new MeshBuilder(); addCap(roofB, o.poly, TOP + 0.02, { uvScale: 4 }); R.add(new THREE.Mesh(roofB.build(), roofM));
  // lower cornice cap: a 0.35 m band slightly proud of the wall (a strip along the ring top)
  const cap = new MeshBuilder(); {
    const r = ring.slice(); if (signedArea(r) < 0) r.reverse(); const n = r.length;
    for (let i = 0; i < n; i++) {
      const a = r[i], c = r[(i + 1) % n], dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = dz / l, nz = -dx / l, off = 0.18;
      const p0 = [a[0] + nx * off, a[1] + nz * off], p1 = [c[0] + nx * off, c[1] + nz * off];
      const v0 = cap.vert(p0[0], TOP - 0.05, p0[1], nx, 0, nz, 0, 0), v1 = cap.vert(p1[0], TOP - 0.05, p1[1], nx, 0, nz, 1, 0), v2 = cap.vert(p1[0], TOP + 0.38, p1[1], nx, 0, nz, 1, 1), v3 = cap.vert(p0[0], TOP + 0.38, p0[1], nx, 0, nz, 0, 1);
      cap.tri(v0, v2, v1); cap.tri(v0, v3, v2);
      const t0 = cap.vert(p0[0], TOP + 0.38, p0[1], 0, 1, 0, 0, 0), t1 = cap.vert(p1[0], TOP + 0.38, p1[1], 0, 1, 0, 1, 0), t2 = cap.vert(a[0], TOP + 0.38, a[1], 0, 1, 0, 1, 1), t3 = cap.vert(c[0], TOP + 0.38, c[1], 0, 1, 0, 0, 1);
      cap.tri(t0, t1, t3); cap.tri(t0, t3, t2);
    }
  }
  R.add(new THREE.Mesh(cap.build(), stoneLight));

  // ---- the drum: wall, 12 fluted columns, entablature, balustrade, flat dome, spire
  const dring = ringFromFlat(o.drum.o); const db = polyBounds(o.drum);
  const cx = db.cx, cz = db.cz, Rd = Math.max(db.w, db.d) / 2 - 0.5;
  const DY0 = TOP + 0.4, DH = 9.4;
  k.cyl(Rd, Rd, DH, mat.toon('#e0cb8e'), [cx, DY0 + DH / 2, cz], null, 40);
  // dark window slits on the drum wall between the columns
  for (let i = 0; i < 12; i++) { const a = (i + 0.5) * Math.PI / 6; k.box(1.0, 3.6, 0.2, M.glassDark, [cx + (Rd + 0.06) * Math.sin(a), DY0 + 4.2, cz + (Rd + 0.06) * Math.cos(a)], [0, a, 0]); }
  const RC = Rd + 1.9, NC = 16;
  for (let i = 0; i < NC; i++) {
    const a = i * 2 * Math.PI / NC, x = cx + RC * Math.sin(a), z = cz + RC * Math.cos(a);
    k.cyl(0.52, 0.56, DH - 0.7, stone, [x, DY0 + (DH - 0.7) / 2 + 0.2, z], null, 14);
    k.box(1.3, 0.4, 1.3, stoneLight, [x, DY0 + 0.2, z], [0, a, 0]); k.box(1.35, 0.5, 1.35, stoneLight, [x, DY0 + DH - 0.25, z], [0, a, 0]);
  }
  // iron balustrade ring at the base of the colonnade and the entablature ring above
  const BR = RC + 1.7;
  for (let i = 0; i < 64; i++) { const a = i * 2 * Math.PI / 64; k.box(0.05, 0.95, 0.05, M.black, [cx + BR * Math.sin(a), TOP + 0.4 + 0.5, cz + BR * Math.cos(a)]); }
  k.cyl(BR + 0.05, BR + 0.05, 0.08, M.black, [cx, TOP + 0.4 + 1.0, cz], null, 48);
  k.cyl(RC + 1.5, RC + 1.5, 1.7, stone, [cx, DY0 + DH + 0.85, cz], null, 48);
  k.cyl(RC + 1.9, RC + 1.9, 0.5, stoneLight, [cx, DY0 + DH + 1.95, cz], null, 48);
  // relief frieze band (dark rosettes) just under the cornice
  for (let i = 0; i < 24; i++) { const a = (i + 0.5) * Math.PI / 12; k.cyl(0.36, 0.36, 0.06, mat.toon('#cdb878'), [cx + (RC + 1.52) * Math.sin(a), DY0 + DH + 0.9, cz + (RC + 1.52) * Math.cos(a)], [Math.PI / 2, 0, 0], 8).rotation.set(Math.PI / 2, 0, 0); void a; }
  const domeY = DY0 + DH + 2.2;
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(3.5, RC + 1.5, 1.5, 48), roofM); dome.position.set(cx, domeY + 0.75, cz); dome.castShadow = true; R.add(dome);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.5, 0.6, 32), roofM); lamp.position.set(cx, domeY + 1.8, cz); R.add(lamp);
  k.cyl(0.45, 0.8, 1.4, goldM, [cx, domeY + 2.8, cz], null, 14); k.cyl(0.16, 0.45, 0.7, goldM, [cx, domeY + 3.8, cz], null, 14);
  const spire = k.cyl(0.04, 0.2, 12.5, steel, [cx, domeY + 10.4, cz], null, 10); void spire;
  k.cyl(0.12, 0.12, 0.35, goldM, [cx, domeY + 6.2, cz], null, 10);

  // ---- doors (outside leaf + inside leaf), the name boards above them, bracket signs
  const signMat = mat.emissive('#ffffff', 0.9, { map: metroSignTexture(ctx, 'metro-sign-vosst', 'Площадь Восстания') }), signMat2 = mat.emissive('#ffffff', 0.9, { map: metroSignTexture(ctx, 'metro-sign-exit', 'Выход в город') });
  const bigTex = ctx.tex.draw(1024, 320, (g, w, h) => { g.fillStyle = '#1d4e9b'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; ctx.tex.roundRect(g, 24, 24, 272, 272, 40); g.fill(); g.fillStyle = '#1d4e9b'; g.font = '800 250px "Rubik","Noto Sans",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('М', 160, 172); g.fillStyle = '#fff'; g.textAlign = 'left'; ctx.tex.fitText(g, 'МЕТРО', 330, 120, 650, 150, '"Rubik","Noto Sans",sans-serif', 800); ctx.tex.fitText(g, 'Площадь Восстания', 330, 245, 650, 70, '"Rubik","Noto Sans",sans-serif', 500); }, { key: 'metro-rotunda-big' });
  const totTex = ctx.tex.draw(128, 256, (g, w, h) => { g.fillStyle = '#1d4e9b'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; ctx.tex.roundRect(g, 10, 10, w - 20, w - 20, 16); g.fill(); g.fillStyle = '#1d4e9b'; g.font = '800 96px "Rubik","Noto Sans",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('М', w / 2, w / 2 + 4); g.fillStyle = '#fff'; ctx.tex.fitText(g, 'МЕТРО', w / 2, h - 52, w - 14, 30, '"Rubik","Noto Sans",sans-serif', 700); }, { key: 'metro-rotunda-totem' });
  for (const d of doors) {
    const nx = Math.sin(d.rotY), nz = Math.cos(d.rotY);
    const jx = -nz, jz = nx;
    const sm = k.plane(2.7, 0.84, d.kind === 'exit' ? signMat2 : signMat, [d.x + nx * 0.34, 4.5, d.z + nz * 0.34], [0, Math.atan2(nx, nz), 0]); sm.castShadow = false;
    const bracket = k.plane(0.7, 0.7, signMat, [d.x + nx * 0.9 + jx * (d.w / 2 + 1.6), 4.4, d.z + nz * 0.9 + jz * (d.w / 2 + 1.6)], [0, Math.atan2(nx, nz), 0]); void bracket;
    // big lit roof sign (blue M in a white box + МЕТРО + the station name) over the door, a tall lit pylon beside the entrance walk
    const bigSign = k.plane(7.2, 2.25, mat.emissive('#ffffff', 1.1, { map: bigTex }), [d.x + nx * 0.45, TOP + 2.3, d.z + nz * 0.45], [0, Math.atan2(nx, nz), 0]); bigSign.castShadow = false;
    k.box(7.4, 2.4, 0.3, mat.toon('#1d4e9b'), [d.x + nx * 0.2, TOP + 2.3, d.z + nz * 0.2], [0, Math.atan2(nx, nz), 0]);
    const px = d.x + nx * 5.2 + jx * 5.5, pz = d.z + nz * 5.2 + jz * 5.5;
    k.cyl(0.14, 0.14, 4.6, M.steelBlack, [px, 2.3, pz], null, 8); k.box(1.3, 2.3, 0.2, mat.toon('#1d4e9b'), [px, 5.7, pz], [0, Math.atan2(nx, nz), 0]);
    for (const f of [1, -1]) k.plane(1.2, 2.2, mat.emissive('#ffffff', 1.1, { map: totTex }), [px + nx * 0.11 * f, 5.7, pz + nz * 0.11 * f], [0, Math.atan2(nx, nz) + (f > 0 ? 0 : Math.PI), 0]);
    ctx.physics.addCylinder(px, pz, 0.2, 0, 7);
  }
  ctx.services.rotunda = { drum: { x: cx, z: cz, r: Rd }, topY: TOP };
  return { group: R, TOP, drum: { x: cx, z: cz, r: Rd }, bounds: b };
}
