// landmarksFortress/walls.js - the fortifications of Zayachy Island on their baked OSM polygons (dossier docs/research/fortress.md sections 2, 5; photos refs/fortress 004 005 029-032 044 133 154 172 177 186-193):
//  * the MAIN RAMPART r227969 (six bastions, six curtains): battered outer face with a torus cordon and a parapet (granite to the Neva, red brick on a limestone socle to the strait, grey plaster on the
//    Zotov bastion), one-pitch mint-green sheet roofs falling to the yards, red chimney stacks, red casemate fronts with white-framed arches inside; the lawn terreplein of the Gosudarev bastion;
//  * the IOANNOVSKY (r2594679) and ALEKSEEVSKY (r2594690) ravelins with their half-counterguards and the two batardeaux (r16219162 / r16219164) with their turrets;
//  * the granite BARTIZANS on the salients (Gosudarev, Naryshkin x3, Trubetskoy, the Neva half-counterguards).
// rampart() is the generator: every edge of the polygon is one face (uv: u = bays along the edge, v = 0..1 over the height), cut where a gate portal stands (frame.js openingsOf), with a thin wall collider.
import * as THREE from 'three';
import { FORT, WALL, RAV, wallKind, windowed, offsetRing, edgeNormal, ringArea, pairs, byId, inRing, openingsOf, dseg, V, COL_GAPS } from './frame.js';

const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** pieces of the edge a -> b outside / inside the opening slabs: [{ t0, t1, yb }] (yb = 0: the whole face; yb > 0: only above the portal; pieces under a portal that reaches the top are dropped) */
function cutEdge(a, b, openings, top) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 1e-6) return [];
  let cuts = [];
  for (const o of openings) {
    if (dseg(o.c[0], o.c[1], a, b) > 3.2) continue;                                   // the slab belongs to another face of the wall
    const sa = (a[0] - o.c[0]) * o.t[0] + (a[1] - o.c[1]) * o.t[1], sb = (b[0] - o.c[0]) * o.t[0] + (b[1] - o.c[1]) * o.t[1];
    if (Math.abs(sb - sa) < 1e-6) { if (Math.abs(sa) < o.hw) cuts.push({ t0: 0, t1: 1, h: o.h }); continue; }
    let t0 = (-o.hw - sa) / (sb - sa), t1 = (o.hw - sa) / (sb - sa); if (t0 > t1) [t0, t1] = [t1, t0];
    t0 = Math.max(0, t0); t1 = Math.min(1, t1);
    if (t1 - t0 > 1e-4) cuts.push({ t0, t1, h: o.h });
  }
  if (!cuts.length) return [{ t0: 0, t1: 1, yb: 0 }];
  cuts.sort((p, q) => p.t0 - q.t0);
  const out = []; let t = 0;
  for (const c of cuts) { if (c.t0 > t + 1e-4) out.push({ t0: t, t1: c.t0, yb: 0 }); if (c.h < top - 0.3) out.push({ t0: Math.max(t, c.t0), t1: c.t1, yb: c.h }); t = Math.max(t, c.t1); }
  if (t < 1 - 1e-4) out.push({ t0: t, t1: 1, yb: 0 });
  return out;
}

/**
 * One fortification polygon. poly = { o: [[x,z]..], h: [rings] }, H = { cordon, top, roofHi, roofLo, inset, parapet },
 * o: { id, kind(i) -> 'granite' | 'brick' | 'plaster', win(i), inner(hole, i, len) -> 'inner2' | 'inner1' | 'flat' | null, roofAt(x, z) -> { mat, y } | null, chimneys, openings, solid: no holes drawn }
 */
export function rampart(K, poly, H, o = {}) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const R0 = poly.o, n = R0.length; if (n < 3) return;
  const R1 = offsetRing(R0, -H.inset), Rc = offsetRing(R0, -(H.inset - 0.2)), R2 = offsetRing(R0, -(H.inset + H.parapet));
  const openings = o.openings || [];
  const kindOf = o.kind || (() => 'brick');
  const faceMat = (k, win, len) => k === 'granite' ? (win ? M.graniteWin : M.granite) : k === 'plaster' ? M.plaster : k === 'ward' ? (len > 6 ? M.inner1 : M.innerFlat) : (win && len > 16 ? M.brickEmb : M.brick);
  const bayOf = (k) => (k === 'brick' ? 6.0 : 4.6);
  const flatOf = (k) => (k === 'granite' ? M.graniteFlat : k === 'plaster' ? M.plasterFlat : k === 'ward' ? M.innerFlat : M.brickFlat);
  const cordOf = (k) => (k === 'granite' ? M.graniteLit : k === 'plaster' ? M.plasterFlat : k === 'ward' ? M.white : M.limestone);
  const hc = H.cordon;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, a = R0[i], b = R0[j], A = R1[i], B = R1[j], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.05) continue;
    const nn = edgeNormal(R0, i), k = kindOf(i), mat = faceMat(k, o.win ? o.win(i) : false, len), nb = Math.max(1, Math.round(len / bayOf(k)));
    const N = [nn[0], 0.11, nn[1]];
    const pt = (t, y) => { const p = lerp2(a, b, t), q = lerp2(A, B, t), f = y / hc; return [p[0] + (q[0] - p[0]) * f, y, p[1] + (q[1] - p[1]) * f]; };
    const pieces = cutEdge(a, b, openings, H.top);
    for (const pc of pieces) {
      if (pc.yb < hc - 0.05) P.quad(mat, pt(pc.t0, pc.yb), pt(pc.t1, pc.yb), pt(pc.t1, hc), pt(pc.t0, hc), N, [[pc.t0 * nb, pc.yb / hc], [pc.t1 * nb, pc.yb / hc], [pc.t1 * nb, 1], [pc.t0 * nb, 1]]);
      // cordon (torus as a three-face band) and parapet
      const c0 = lerp2(Rc[i], Rc[j], pc.t0), c1 = lerp2(Rc[i], Rc[j], pc.t1), p0 = lerp2(A, B, pc.t0), p1 = lerp2(A, B, pc.t1), q0 = lerp2(R2[i], R2[j], pc.t0), q1 = lerp2(R2[i], R2[j], pc.t1);
      const cm = cordOf(k), fm = flatOf(k), y0 = hc - 0.14, y1 = hc + 0.22;
      if (pc.yb < hc) {
        P.quad(cm, [c0[0], y0, c0[1]], [c1[0], y0, c1[1]], [c1[0], y1, c1[1]], [c0[0], y1, c0[1]], [nn[0], 0, nn[1]]);
        P.quad(cm, [p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [c1[0], y0, c1[1]], [c0[0], y0, c0[1]], [0, -1, 0]);
        P.quad(cm, [c0[0], y1, c0[1]], [c1[0], y1, c1[1]], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]], [0, 1, 0]);
      }
      const yp = Math.max(y1, pc.yb);
      if (yp < H.top - 0.05) {
        const u0 = pc.t0 * len / 3, u1 = pc.t1 * len / 3;
        P.quad(fm, [p0[0], yp, p0[1]], [p1[0], yp, p1[1]], [p1[0], H.top, p1[1]], [p0[0], H.top, p0[1]], [nn[0], 0, nn[1]], [[u0, 0], [u1, 0], [u1, 0.4], [u0, 0.4]]);
        P.quad(fm, [p0[0], H.top, p0[1]], [p1[0], H.top, p1[1]], [q1[0], H.top, q1[1]], [q0[0], H.top, q0[1]], [0, 1, 0]);
        P.quad(fm, [q1[0], H.roofHi - 0.05, q1[1]], [q0[0], H.roofHi - 0.05, q0[1]], [q0[0], H.top, q0[1]], [q1[0], H.top, q1[1]], [-nn[0], 0, -nn[1]]);
      }
      // collider of the piece (thin box on the wall line)
      if (pc.yb === 0 && o.colliders !== false) { const m0 = lerp2(a, b, pc.t0), m1 = lerp2(a, b, pc.t1), l = Math.hypot(m1[0] - m0[0], m1[1] - m0[1]); if (l > 0.2) ph.addBox((m0[0] + m1[0]) / 2 - nn[0] * 0.45, (m0[1] + m1[1]) / 2 - nn[1] * 0.45, l + 0.3, 0.9, Math.atan2(-(m1[1] - m0[1]), m1[0] - m0[0]), -1, H.top + 1.2); }
    }
  }
  // ---- inner faces (yard side): vertical, from the ground to the eave
  const holes = o.solid ? [] : poly.h;
  holes.forEach((hr, hi) => {
    const m = hr.length;
    for (let i = 0; i < m; i++) {
      const a = hr[i], b = hr[(i + 1) % m], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.05) continue;
      const nw = edgeNormal(hr, i), nn = [-nw[0], -nw[1]];                                 // into the yard
      const style = o.inner ? o.inner(hi, i, len) : (len >= 8 ? 'inner2' : 'flat'); if (!style) continue;
      const mat = style === 'inner2' ? M.inner2 : style === 'inner1' ? M.inner1 : M.innerFlat, nb = Math.max(1, Math.round(len / 4.6));
      for (const pc of cutEdge(a, b, openings, H.roofLo)) {
        const p0 = lerp2(a, b, pc.t0), p1 = lerp2(a, b, pc.t1);
        if (pc.yb < H.roofLo - 0.05) P.quad(mat, [p0[0], pc.yb, p0[1]], [p1[0], pc.yb, p1[1]], [p1[0], H.roofLo, p1[1]], [p0[0], H.roofLo, p0[1]], [nn[0], 0, nn[1]], style === 'flat' ? [[0, 0], [len / 3, 0], [len / 3, 3], [0, 3]] : [[pc.t0 * nb, pc.yb / H.roofLo], [pc.t1 * nb, pc.yb / H.roofLo], [pc.t1 * nb, 1], [pc.t0 * nb, 1]]);
        if (pc.yb === 0 && o.colliders !== false) {
          // thin box on the yard face, left open at frame.js COL_GAPS (the stairs to the roof walk)
          const l = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), ns = Math.max(1, Math.ceil(l / 1.0)); let st = null;
          for (let q = 0; q <= ns; q++) {
            const t = q / ns, x = p0[0] + (p1[0] - p0[0]) * t, z = p0[1] + (p1[1] - p0[1]) * t, fr = !COL_GAPS.some((g) => Math.hypot(x - g.c[0], z - g.c[1]) < g.r);
            if (fr && st === null) st = t;
            if ((!fr || q === ns) && st !== null) { const t1 = fr ? t : (q - 1) / ns, ll = (t1 - st) * l; if (ll > 0.2) { const tm = (st + t1) / 2; ph.addBox(p0[0] + (p1[0] - p0[0]) * tm + nw[0] * 0.45, p0[1] + (p1[1] - p0[1]) * tm + nw[1] * 0.45, ll + (st === 0 && t1 === 1 ? 0.3 : 0), 0.9, Math.atan2(-(p1[1] - p0[1]), p1[0] - p0[0]), -1, H.roofLo + 1.5); } st = null; }
          }
        }
      }
      // red chimney stacks on the roof, 2.6 m behind the eave
      if (o.chimneys && len > 15 && style !== 'flat') {
        const nc = Math.max(1, Math.round(len / 11));
        for (let c = 0; c < nc; c++) { const t = (c + 0.5) / nc, p = lerp2(a, b, t), x = p[0] + nw[0] * 2.6, z = p[1] + nw[1] * 2.6, y = H.roofLo; P.push(x, 0, z, Math.atan2(nw[0], nw[1])); P.box(M.chimney, -0.45, 0.45, y, y + 1.9, -0.45, 0.45, 'b', 1); P.box(M.white, -0.55, 0.55, y + 1.9, y + 2.1, -0.55, 0.55, '', 1); P.pop(); }
      }
    }
  });
  // ---- roof: the parapet line high, the eaves low
  {
    const all = R2.concat(...holes), tris = THREE.ShapeUtils.triangulateShape(R2.map((p) => new THREE.Vector2(p[0], p[1])), holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1]))));
    const nO = R2.length, yOf = (idx) => (idx < nO ? H.roofHi : H.roofLo);
    for (const [ia, ib, ic] of tris) {
      const A = all[ia], B = all[ib], Cc = all[ic], cx = (A[0] + B[0] + Cc[0]) / 3, cz = (A[1] + B[1] + Cc[1]) / 3;
      const ov = o.roofAt ? o.roofAt(cx, cz) : null, mat = ov ? ov.mat : (o.roofMat || M.roofMint);
      const pa = [A[0], ov ? ov.y : yOf(ia), A[1]], pb = [B[0], ov ? ov.y : yOf(ib), B[1]], pc = [Cc[0], ov ? ov.y : yOf(ic), Cc[1]];
      const ux = pb[0] - pa[0], uy = pb[1] - pa[1], uz = pb[2] - pa[2], vx = pc[0] - pa[0], vy = pc[1] - pa[1], vz = pc[2] - pa[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
      P.fan(mat, [pa, pb, pc], [nx, ny, nz], (q) => [q[0] / 2.4, q[2] / 2.4]);
    }
  }
}

/** granite sentry box on a conical corbel: centre (x, z), floor at yF, pushed out along (nx, nz) */
export function bartizan(K, x, z, yF, nx, nz, o = {}) {
  const { P, M } = K, r = o.r ?? 1.0, body = o.mat || M.graniteFlat, lit = o.lit || M.graniteLit;
  P.push(x + nx * 0.55, 0, z + nz * 0.55, Math.atan2(nx, nz));
  P.col(body, 0, 0, yF - 2.5, yF - 0.2, 0.16, r * 0.98, 10, false);                       // conical corbel
  P.col(lit, 0, 0, yF - 0.3, yF + 0.05, r * 1.12, r * 1.12, 10, true);                    // lower ring
  P.col(body, 0, 0, yF + 0.05, yF + 2.55, r, r, 10, false);
  P.col(lit, 0, 0, yF + 2.55, yF + 2.85, r * 1.16, r * 1.16, 10, true);                   // cornice
  for (let k = 0; k < 5; k++) { const a0 = k / 5 * Math.PI / 2, a1 = (k + 1) / 5 * Math.PI / 2; P.col(M.lead, 0, 0, yF + 2.85 + Math.sin(a0) * 0.85, yF + 2.85 + Math.sin(a1) * 0.85, r * 1.08 * Math.cos(a0), r * 1.08 * Math.cos(a1), 10, false); }
  P.col(M.goldFlat, 0, 0, yF + 3.68, yF + 3.86, 0.05, 0.05, 5, false);
  { const g = new THREE.SphereGeometry(0.15, 8, 6); P.geo(M.goldFlat, g, 0, yF + 3.98, 0); g.dispose(); }
  for (const a of [0, 1.15, -1.15]) { const c = Math.cos(a), s = Math.sin(a); P.push(s * (r + 0.02), 0, c * (r + 0.02), a); P.box(M.dark, -0.14, 0.14, yF + 1.2, yF + 1.95, 0, 0.02, 'bk', 1); P.pop(); }
  P.pop();
}

const pointInPolyRec = (rec, x, z) => !!rec && rec.polys.some((p) => inRing(x, z, pairs(p.o)));

export function build(K) {
  const { M, svc } = K;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksFortress] walls/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };

  // ================================================================== the main rampart
  stage('rampart', () => {
    const lawn = ['r16804883', 'r17179766', 'r16804879'].map(byId).filter(Boolean);
    rampart(K, FORT, WALL, {
      id: 'r227969', kind: wallKind, win: (i) => windowed(i) || (wallKind(i) === 'brick'), openings: openingsOf('r227969'), chimneys: true,
      inner: (hi, i, len) => (hi === 1 ? null : len >= 9 ? 'inner2' : 'flat'),                         // hole 2 = the prison yard: the prison draws its own walls
      roofAt: (x, z) => (lawn.some((r) => pointInPolyRec(r, x, z)) ? { mat: M.lawn, y: WALL.roofHi + 0.1 } : null),
    });
    svc.walls = { top: WALL.top, cordon: WALL.cordon };
  });
  // bartizans of the main rampart: Gosudarev salient (the ring holds its tiny octagon 55-62), Naryshkin salient + shoulders, Trubetskoy salient
  stage('bartizans', () => {
    const R = FORT.o, R1 = offsetRing(R, -WALL.inset);
    const out = (i) => { const p = R[(i + R.length - 1) % R.length], q = R[i], s = R[(i + 1) % R.length]; const a = edgeNormal(R, (i + R.length - 1) % R.length), b = edgeNormal(R, i); let x = a[0] + b[0], z = a[1] + b[1]; const l = Math.hypot(x, z) || 1; void p; void q; void s; return [x / l, z / l]; };
    for (const i of [66, 67, 68, 72]) { const d = out(i); bartizan(K, R1[i][0], R1[i][1], WALL.cordon + 0.2, d[0], d[1]); }
    // Gosudarev: the centre of the octagon 55..62, outward = away from the bastion centre
    let gx = 0, gz = 0; for (let i = 55; i <= 62; i++) { gx += R[i][0]; gz += R[i][1]; } gx /= 8; gz /= 8;
    const dl = Math.hypot(gx + 1700, gz + 1975); bartizan(K, gx - (gx + 1700) / dl * 1.4, gz - (gz + 1975) / dl * 1.4, WALL.cordon + 0.2, (gx + 1700) / dl, (gz + 1975) / dl);
  });

  // ================================================================== ravelins, batardeaux
  stage('ioannovsky', () => {
    const rec = byId('r2594679'); if (!rec) return;
    const poly = { o: pairs(rec.polys[0].o), h: rec.polys[0].h.map(pairs) };
    const mid = (i) => { const a = poly.o[i], b = poly.o[(i + 1) % poly.o.length]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
    // the outer ring is a ribbon: faces that look at the water are brick (granite at the Neva end), faces that look into the ward are red casemate fronts
    const outerSide = (i) => edgeNormal(poly.o, i)[0] > -0.15;
    rampart(K, poly, RAV, {
      id: 'r2594679', openings: openingsOf('r2594679'), chimneys: false,
      kind: (i) => { const m = mid(i), nn = edgeNormal(poly.o, i); if (outerSide(i) && m[1] > -2000 && nn[0] * V[0] + nn[1] * V[1] > 0.2) return 'granite'; return outerSide(i) ? 'brick' : 'ward'; },
      win: () => true, inner: (hi, i, len) => (len > 6 ? 'inner1' : 'flat'),
    });
  });
  stage('alekseevsky', () => {
    const rec = byId('r2594690'); if (!rec) return;
    const poly = { o: pairs(rec.polys[0].o), h: rec.polys[0].h.map(pairs) };
    rampart(K, poly, RAV, { id: 'r2594690', openings: [], kind: (i) => { const nn = edgeNormal(poly.o, i); return nn[0] * V[0] + nn[1] * V[1] > 0.25 ? 'granite' : 'plaster'; }, win: () => false });
  });
  stage('batardeaux', () => {
    for (const [id, turret] of [['r16219162', 'w1199762901'], ['r16219164', 'w1199762906']]) {
      const rec = byId(id); if (!rec) continue;
      const poly = { o: pairs(rec.polys[0].o), h: [] }, south = rec.cz > -2050;
      rampart(K, poly, { cordon: 5.2, top: 6.0, roofHi: 5.9, roofLo: 5.9, inset: 0.35, parapet: 0.3 }, { id, kind: () => (south ? 'granite' : 'plaster'), roofMat: south ? M.graniteFlat : M.plasterFlat });
      const t = byId(turret); if (t) { const x = t.cx, z = t.cz; K.P.col(south ? M.graniteFlat : M.plasterFlat, x, z, 5.9, 8.2, 1.5, 1.5, 12, false); for (let k = 0; k < 4; k++) { const a0 = k / 4 * Math.PI / 2, a1 = (k + 1) / 4 * Math.PI / 2; K.P.col(M.lead, x, z, 8.2 + Math.sin(a0) * 1.2, 8.2 + Math.sin(a1) * 1.2, 1.62 * Math.cos(a0), 1.62 * Math.cos(a1), 12, false); } }
    }
  });
  // bartizan of the Neva half-counterguard of the Ioannovsky ravelin (OSM part r16312164)
  stage('ravelin-bartizans', () => {
    const b = byId('r16312164'); if (b) bartizan(K, b.cx - 0.8, b.cz + 0.3, RAV.cordon + 0.2, 0.86, -0.5);
  });
  void ringArea;
  if (errs.length) throw new Error(errs.join('\n'));
}
