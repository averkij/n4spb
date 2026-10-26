// landmarksNewHolland/buildings.js - the small buildings of the island on their baked OSM footprints (dossier docs/research/new-holland.md section 7, photos 62 20 53 54 41 38 37 39 40 43):
//  * the Commandant's House (litera L, r3164895, 23.4 x 15.2 m): three storeys of red brick with cream quoins, cream window surrounds, a cream cornice, limestone plinth, a dark hip roof, entrance canopy,
//  * the Kuznya (forge, litera M, w97821646): one storey, round-headed windows, rusticated corners, a big hipped roof of dark red metal with a dozen brick chimneys, awnings and café tables,
//  * the Pavilion (w472268626): silver-grey timber cladding, a big arched black window, low dark gable roof,
//  * the open-air Stage (w472268623): timber platform, dark rear wall, a shell roof, steps; WALKABLE platform,
//  * kiosks (timber), two round WC pavilions with zinc domes, the pyramidal info centre, the guardhouse,
//  * the Frigate playground "Фрегат" (w1000013403): 26 m ship hull on scaffolding: pale timber ribs, partial planking, deck, scaffold posts with rails, ladders, a slide.
import { BUILDINGS } from '../data/city.js';
import { onEdge, ringEdges } from './kit.js';
import { hipRoof, hull } from './roofs.js';
import * as G from './geo.js';

const byId = (id) => BUILDINGS.find((b) => b.id === id);
const pairs = (f) => { const r = []; for (let i = 0; i < f.length; i += 2) r.push([f[i], f[i + 1]]); return r; };

/** minimum-area bounding rectangle: { cx, cz, ang (long axis atan2(dz, dx)), L, D } */
function minRect(poly) {
  const r = pairs(poly.o); let best = null;
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), c = Math.cos(ang), s = Math.sin(ang);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const p of r) { const u = p[0] * c + p[1] * s, v = -p[0] * s + p[1] * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const area = (u1 - u0) * (v1 - v0);
    if (!best || area < best.area) best = { area, ang, u0, u1, v0, v1, c, s };
  }
  let { ang, u0, u1, v0, v1, c, s } = best;
  let L = u1 - u0, D = v1 - v0; const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  let cx = cu * c - cv * s, cz = cu * s + cv * c;
  if (D > L) { ang += Math.PI / 2; [L, D] = [D, L]; }
  return { cx, cz, ang, L, D };
}
/** frame: model +x along the long axis, +z to the right of it (three's Ry convention: rot = atan2(-dz, dx)) */
function frameOf(id) {
  const b = byId(id); if (!b) return null;
  const r = minRect(b.polys[0]);
  return { id, x: r.cx, z: r.cz, rot: Math.atan2(-Math.sin(r.ang), Math.cos(r.ang)), L: r.L, D: r.D, rec: b };
}

export function build(K) {
  const { ctx, M, P, svc, THREE } = K, ph = ctx.physics;
  const place = (f, fn) => { P.push(f.x, 0, f.z, f.rot); try { fn(); } finally { P.pop(); } };
  const box = (mat, x0, x1, y0, y1, z0, z1, skip = '', t = 2) => G.tbox(P, mat, x0, x1, y0, y1, z0, z1, t, t, skip);
  const wq = (mat, x0, x1, y0, y1, z, t = 2) => P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], [[x0 / t, y0 / t], [x1 / t, y0 / t], [x1 / t, y1 / t], [x0 / t, y1 / t]]);
  const win = (xc, y0, w, h, frameMat, hood) => {
    P.quad(M.glass, [xc - w / 2, y0, 0.03], [xc + w / 2, y0, 0.03], [xc + w / 2, y0 + h, 0.03], [xc - w / 2, y0 + h, 0.03], [0, 0, 1]);
    const f = 0.14, d = 0.1;
    P.box(frameMat, xc - w / 2 - f, xc - w / 2, y0 - 0.05, y0 + h + f, 0, d, 'bk', 1); P.box(frameMat, xc + w / 2, xc + w / 2 + f, y0 - 0.05, y0 + h + f, 0, d, 'bk', 1);
    P.box(frameMat, xc - w / 2 - f, xc + w / 2 + f, y0 + h, y0 + h + f, 0, d, 'bk', 1); P.box(frameMat, xc - w / 2 - f * 1.5, xc + w / 2 + f * 1.5, y0 - 0.12, y0 - 0.03, 0, d + 0.06, 'bk', 1);
    P.box(M.white, xc - 0.025, xc + 0.025, y0, y0 + h, 0.03, 0.07, 'bk', 1); P.box(M.white, xc - w / 2, xc + w / 2, y0 + h * 0.6 - 0.025, y0 + h * 0.6 + 0.025, 0.03, 0.07, 'bk', 1);
    if (hood) P.box(frameMat, xc - w / 2 - 0.35, xc + w / 2 + 0.35, y0 + h + f, y0 + h + f + 0.2, 0, 0.3, 'b', 1);
  };
  const archWin = (xc, y0, w, h, frameMat) => {
    G.planeShape(P, M.glass, G.archPts(xc, y0, w, h, 8), 0.03);
    G.frameRing(P, frameMat, G.archPts(xc, y0 - 0.1, w + 0.3, h + 0.2, 8), G.archPts(xc, y0, w, h, 8), 0, 0.1, 1);
    P.box(M.frame, xc - 0.025, xc + 0.025, y0, y0 + h - w / 2, 0.03, 0.07, 'bk', 1);
  };

  // ================================================================== the Commandant's House
  try {
    const f = frameOf('r3164895'); const rec = f.rec, hc = 12.6;
    const edges = ringEdges(rec.polys[0], 0.3);
    for (const e of edges) onEdge(P, e, (len) => {
      wq(M.brick, 0, len, 0, hc, 0, 2);
      P.box(M.stone, 0, len, 0, 0.9, 0, 0.06, 'bk', 2.4); P.box(M.limestone, -0.01, len + 0.01, 0.9, 1.0, 0, 0.12, 'bk', 1);
      const nb = Math.max(2, Math.round(len / 3.3)), p = len / nb, long = len > 18;
      for (let i = 0; i < nb; i++) {
        const xc = (i + 0.5) * p, mid = long && i === (nb >> 1);
        if (mid) {                                                                                         // central entrance, a tall window over it, the pediment above the cornice
          P.box(M.iron, xc - 1.0, xc + 1.0, 3.0, 3.1, 0, 1.5, 'b', 1); P.box(M.glassLit, xc - 0.95, xc + 0.95, 3.02, 3.08, 0.02, 1.45, '', 1);
          for (const sx of [-1, 1]) P.cyl(M.iron, [xc + sx * 0.95, 0, 1.4], [xc + sx * 0.95, 3.0, 1.4], 0.035, 0.035, 5, false);
          P.box(M.frame, xc - 0.8, xc + 0.8, 1.0, 2.7, 0.0, 0.12, 'b', 1); P.quad(M.glass, [xc - 0.7, 1.0, 0.13], [xc + 0.7, 1.0, 0.13], [xc + 0.7, 2.6, 0.13], [xc - 0.7, 2.6, 0.13], [0, 0, 1]);
          win(xc, 4.7, 1.2, 2.0, M.cream, false); win(xc, 8.6, 1.2, 2.0, M.cream, false);
        } else {
          win(xc, 1.25, 1.2, 1.9, M.cream, false); win(xc, 5.0, 1.2, 2.0, M.cream, true); win(xc, 8.6, 1.2, 2.0, M.cream, false);
        }
      }
      // cream corner quoins (alternating) and the cornice
      for (let k = 0; k < 11; k++) { const y0 = 1.1 + k * 1.0, w = k % 2 ? 0.45 : 0.8; P.box(M.cream, 0, w, y0, y0 + 0.5, 0, 0.07, 'bk', 1); P.box(M.cream, len - w, len, y0, y0 + 0.5, 0, 0.07, 'bk', 1); }
      P.box(M.cream, -0.1, len + 0.1, hc - 0.9, hc - 0.2, 0, 0.55, 'b', 1); P.box(M.creamShade, -0.1, len + 0.1, hc - 1.15, hc - 0.9, 0, 0.3, 'b', 1);
      P.box(M.cream, -0.05, len + 0.05, 4.25, 4.5, 0, 0.09, 'bk', 1);
      if (long) {                                                                                          // pediment with a half-round window (the long sides)
        const xc = len / 2, pw = 7.4, ph0 = 2.1;
        P.fan(M.cream, [[xc - pw / 2, hc - 0.2, 0.55], [xc + pw / 2, hc - 0.2, 0.55], [xc, hc - 0.2 + ph0, 0.55]], [0, 0, 1]);
        P.fan(M.brickDark, [[xc - pw / 2 + 0.5, hc - 0.2, 0.58], [xc + pw / 2 - 0.5, hc - 0.2, 0.58], [xc, hc - 0.2 + ph0 - 0.55, 0.58]], [0, 0, 1]);
        G.planeShape(P, M.glass, G.archPts(xc, hc + 0.1, 1.0, 0.75, 8), 0.6);
      }
    });
    hipRoof(P, M.roofBrown, pairs(rec.polys[0].o), hc - 0.2, 3.3, 0.6);
    const ch = (x, z) => { P.box(M.brick, x - 0.45, x + 0.45, hc + 2.2, hc + 5.0, z - 0.45, z + 0.45, 'b', 1); P.box(M.white, x - 0.55, x + 0.55, hc + 5.0, hc + 5.2, z - 0.55, z + 0.55, 'b', 1); };
    ch(f.rec.cx - 3, f.rec.cz - 1); ch(f.rec.cx + 3.5, f.rec.cz + 1.5);
    for (const e of edges) { const mx = (e.a[0] + e.b[0]) / 2, mz = (e.a[1] + e.b[1]) / 2; ph.addBox(mx, mz, e.len + 0.2, 0.9, Math.atan2(e.n[0], e.n[1]), 0, 14); }
    svc.monuments.push({ id: 'r3164895', name: 'Дом коменданта (Новая Голландия)', x: rec.cx, z: rec.cz, h: 15 });
  } catch (e) { console.error('[landmarksNewHolland] commandant:', e); }

  // ================================================================== the Kuznya (forge)
  try {
    const rec = byId('w97821646'), poly = rec.polys[0], ring = pairs(poly.o), hc = 5.3;
    const edges = ringEdges(poly, 0.3);
    for (const e of edges) onEdge(P, e, (len) => {
      wq(M.brick, 0, len, 0, hc, 0, 2);
      P.box(M.stone, 0, len, 0, 0.8, 0, 0.06, 'bk', 2.4); P.box(M.limestone, -0.01, len + 0.01, 0.8, 0.9, 0, 0.12, 'bk', 1);
      if (len > 3.4) { const nb = Math.max(1, Math.round(len / 3.4)), p = len / nb; for (let i = 0; i < nb; i++) archWin((i + 0.5) * p, 1.2, 1.0, 2.5, M.limestone); }
      P.box(M.limestone, -0.05, len + 0.05, hc - 0.45, hc - 0.1, 0, 0.35, 'b', 1);
      for (let k = 0; k < 5; k++) { const y0 = 0.9 + k * 0.9; P.box(M.limestone, 0, 0.5, y0, y0 + 0.45, 0, 0.06, 'bk', 1); P.box(M.limestone, len - 0.5, len, y0, y0 + 0.45, 0, 0.06, 'bk', 1); }
    });
    hipRoof(P, M.roofKuznya, hull(ring), hc - 0.1, 5.0, 0.6);
    const cx = rec.cx, cz = rec.cz;
    for (let k = 0; k < 9; k++) { const t = (k - 4) / 4, x = cx + t * 1.2 - 2.0 + (k % 2) * 3.0, z = cz + t * 14.5; P.box(M.brick, x - 0.4, x + 0.4, hc + 4.0, hc + 6.6, z - 0.4, z + 0.4, 'b', 1); P.box(M.white, x - 0.5, x + 0.5, hc + 6.6, hc + 6.8, z - 0.5, z + 0.5, 'b', 1); }
    for (const e of edges) { const mx = (e.a[0] + e.b[0]) / 2, mz = (e.a[1] + e.b[1]) / 2; ph.addBox(mx, mz, e.len + 0.2, 0.9, Math.atan2(e.n[0], e.n[1]), 0, 7); }
    // awnings and café tables on the park (east) side
    for (let k = 0; k < 4; k++) { const z = cz - 8 + k * 5.2, x = cx + 10.5; P.push(x, 0, z, -Math.PI / 2); P.quad(k % 2 ? M.awnB : M.awnA, [-2.2, 2.6, 0.0], [2.2, 2.6, 0.0], [2.2, 2.0, 2.4], [-2.2, 2.0, 2.4], [0, 0.4, 1]); for (const sx of [-2.1, 2.1]) P.cyl(M.iron, [sx, 0, 2.3], [sx, 2.0, 2.3], 0.03, 0.03, 4, false); P.pop(); svc.crowd.push({ x: x + 1.2, z, r: 2.4, n: 3, kind: 'cafe' }); }
    svc.monuments.push({ id: 'w97821646', name: 'Кузня (Новая Голландия)', x: cx, z: cz, h: 10 });
  } catch (e) { console.error('[landmarksNewHolland] kuznya:', e); }

  // ================================================================== the Pavilion (timber, silver-grey)
  try {
    const f = frameOf('w472268626'), hl = f.L / 2, hd = f.D / 2;
    place(f, () => {
      box(M.silver, -hl, hl, 0, 4.3, -hd, hd, 'b', 1.6); box(M.stone, -hl - 0.1, hl + 0.1, 0, 0.35, -hd - 0.1, hd + 0.1, 'b', 2.4);
      P.push(0, 0, hd, 0); archWin(0, 0.7, 3.6, 3.0, M.frame); for (const x of [-1.2, 1.2]) P.box(M.frame, x - 0.03, x + 0.03, 0.7, 3.4, 0.03, 0.08, 'bk', 1); P.pop();
      P.fan(M.roofDark, [[-hl - 0.4, 4.3, -hd - 0.4], [hl + 0.4, 4.3, -hd - 0.4], [hl + 0.4, 5.0, 0], [-hl - 0.4, 5.0, 0]], [0, 0.9, -0.4]);
      P.fan(M.roofDark, [[-hl - 0.4, 4.3, hd + 0.4], [-hl - 0.4, 5.0, 0], [hl + 0.4, 5.0, 0], [hl + 0.4, 4.3, hd + 0.4]], [0, 0.9, 0.4]);
      P.fan(M.silver, [[-hl, 4.3, -hd], [-hl, 4.3, hd], [-hl, 5.0, 0]], [-1, 0, 0]); P.fan(M.silver, [[hl, 4.3, hd], [hl, 4.3, -hd], [hl, 5.0, 0]], [1, 0, 0]);
    });
    ph.addBox(f.x, f.z, f.L, f.D, f.rot, 0, 5.2);
  } catch (e) { console.error('[landmarksNewHolland] pavilion:', e); }

  // ================================================================== the open-air Stage (a grey gabled shell with an arched opening, facing the lawn: south-west) [photos 40, 45]
  try {
    const f = frameOf('w472268623'); const hl = f.L / 2, hd = f.D / 2;
    const zw = [Math.sin(f.rot), Math.cos(f.rot)];                                   // +z of the frame must point to the lawn centre (-3425, 262)
    if ((-3425 - f.x) * zw[0] + (262 - f.z) * zw[1] < 0) f.rot += Math.PI;
    const hw = hd, hx = hl;                                                          // the gable front is the SHORT side facing the lawn: swap so the shell's depth is the long side
    place(f, () => {
      const W = 2 * hl, front = hd, XW = hl;                                         // width across the opening (long side), depth 2 * hd (front = +z, the lawn)
      G.tbox(P, M.deck, -XW - 0.6, XW + 0.6, 0, 0.9, -front, front + 0.6, 1.4, 1.4, '');                    // the timber platform (apron 0.6 m in front)
      G.tbox(P, M.roofDark, -XW, XW, 0.9, 6.2, -front, -front + 0.35, 2, 2, 'b');                           // black rear wall
      for (const sx of [-1, 1]) G.tbox(P, M.roofDark, sx * XW - (sx > 0 ? 0.3 : 0), sx * XW + (sx > 0 ? 0 : 0.3), 0.9, 5.2, -front, front, 2, 2, 'b');   // side walls
      // the front gable: a pentagon with the arched opening cut out
      const sh = new K.THREE.Shape(); sh.moveTo(-XW, 0.9); sh.lineTo(-XW, 5.2); sh.lineTo(0, 7.0); sh.lineTo(XW, 5.2); sh.lineTo(XW, 0.9); sh.lineTo(-XW, 0.9);
      sh.holes.push(new K.THREE.Path(G.archPts(0, 0.9, W - 2.0, 4.6, 12).map((q) => new K.THREE.Vector2(q[0], q[1])).reverse()));
      P.push(0, 0, front, 0); P.face(M.roofDark, sh, 0, 2, 10); G.frameRing(P, M.ironSoft, G.archPts(0, 0.9, W - 1.7, 4.8, 12), G.archPts(0, 0.9, W - 2.0, 4.6, 12), 0.0, 0.25, 1); P.pop();
      // gabled roof: ridge along the depth, eaves 5.2, ridge 7.0, overhang 0.5
      P.quad(M.roofDark, [-XW - 0.4, 5.1, front + 0.5], [-XW - 0.4, 5.1, -front - 0.1], [0, 7.05, -front - 0.1], [0, 7.05, front + 0.5], [-0.5, 0.85, 0]);
      P.quad(M.roofDark, [XW + 0.4, 5.1, -front - 0.1], [XW + 0.4, 5.1, front + 0.5], [0, 7.05, front + 0.5], [0, 7.05, -front - 0.1], [0.5, 0.85, 0]);
      P.fan(M.roofDark, [[-XW, 5.2, -front], [0, 7.0, -front], [XW, 5.2, -front]], [0, 0, -1]);
      for (let k = 0; k < 4; k++) P.box(M.deck, -2.6, 2.6, 0, 0.2 * (k + 1), front + 0.6 + (3 - k) * 0.3, front + 0.9 + (3 - k) * 0.3, 'b', 1);
    });
    ph.addWalkBox(f.x, f.z, f.L - 0.2, f.D - 0.2, f.rot, 0.9, 0);
    const c = (u, v) => ({ x: f.x + Math.cos(f.rot) * u + Math.sin(f.rot) * v, z: f.z - Math.sin(f.rot) * u + Math.cos(f.rot) * v });
    svc.crowd.push({ x: c(0, hd + 11).x, z: c(0, hd + 11).z, r: 10, n: 14, kind: 'lawn' });
    svc.stage = { x: f.x, z: f.z, rot: f.rot };
    svc.monuments.push({ id: 'w472268623', name: 'Сцена (Новая Голландия)', x: f.x, z: f.z, h: 7.5 });
    void hw; void hx;
  } catch (e) { console.error('[landmarksNewHolland] stage:', e); }

  // ================================================================== kiosks, WC domes, info centre, guardhouse
  try {
    for (const id of ['w507817415', 'w507817417']) {
      const f = frameOf(id); if (!f) continue; const hl = f.L / 2, hd = f.D / 2;
      place(f, () => {
        box(M.silver, -hl, hl, 0, 2.9, -hd, hd, 'b', 1.6);
        for (const sz of [1, -1]) { P.push(0, 0, sz * hd, sz > 0 ? 0 : Math.PI); const n = Math.max(2, Math.round(f.L / 1.6)); for (let i = 0; i < n; i++) { const x = -hl + (i + 0.5) * f.L / n; archWin(x, 0.9, f.L / n - 0.5, 1.6, M.frame); } P.pop(); }
        P.quad(M.roofDark, [-hl - 0.3, 2.9, hd + 0.35], [hl + 0.3, 2.9, hd + 0.35], [hl + 0.3, 4.1, 0], [-hl - 0.3, 4.1, 0], [0, 0.8, 0.6]);
        P.quad(M.roofDark, [hl + 0.3, 2.9, -hd - 0.35], [-hl - 0.3, 2.9, -hd - 0.35], [-hl - 0.3, 4.1, 0], [hl + 0.3, 4.1, 0], [0, 0.8, -0.6]);
        P.fan(M.silver, [[-hl, 2.9, -hd], [-hl, 2.9, hd], [-hl, 4.0, 0]], [-1, 0, 0]); P.fan(M.silver, [[hl, 2.9, hd], [hl, 2.9, -hd], [hl, 4.0, 0]], [1, 0, 0]);
        box(M.pot, -hl + 0.2, hl - 0.2, 0.75, 0.95, hd, hd + 0.35, 'b', 1);                                // flower box under the counter window
      });
      ph.addBox(f.x, f.z, f.L, f.D, f.rot, 0, 3.5);
    }
    for (const id of ['w507817416', 'w507817418']) {                                                         // round WC pavilions with zinc domes
      const b = byId(id); if (!b) continue; const R = Math.sqrt(b.area / Math.PI), x = b.cx, z = b.cz;
      G.tube(P, M.silver, x, z, 0, 3.0, R, R, 20, 5, 2); P.fan(M.zincDome, Array.from({ length: 20 }, (_, i) => [x + Math.sin(i / 20 * 6.2832) * (R + 0.3), 3.0, z + Math.cos(i / 20 * 6.2832) * (R + 0.3)]), [0, -1, 0]);
      for (let k = 0; k < 4; k++) { const rr = (R + 0.3) * (1 - k * 0.22), r2 = (R + 0.3) * (1 - (k + 1) * 0.22), y0 = 3.0 + k * 0.55, y1 = 3.0 + (k + 1) * 0.55; G.tube(P, M.zincDome, x, z, y0, y1, rr, r2, 20, 4, 1); }
      P.box(M.frame, x - 0.5, x + 0.5, 0, 2.2, z + R - 0.1, z + R + 0.05, 'b', 1);
      ph.addCylinder(x, z, R + 0.1, 0, 4);
    }
    const ic = byId('w507817409'); if (ic) { const R = Math.sqrt(ic.area / 4), x = ic.cx, z = ic.cz;
      box(M.silver, x - R, x + R, 0, 2.6, z - R, z + R, 'b', 1.6);
      for (const [a, b2, c2, d2, nn] of [[[x - R, 2.6, z + R], [x + R, 2.6, z + R], [x, 4.6, z], [x, 4.6, z], [0, 0.6, 0.8]], [[x + R, 2.6, z - R], [x - R, 2.6, z - R], [x, 4.6, z], [x, 4.6, z], [0, 0.6, -0.8]], [[x + R, 2.6, z + R], [x + R, 2.6, z - R], [x, 4.6, z], [x, 4.6, z], [0.8, 0.6, 0]], [[x - R, 2.6, z - R], [x - R, 2.6, z + R], [x, 4.6, z], [x, 4.6, z], [-0.8, 0.6, 0]]]) P.fan(M.roofDark, [a, b2, c2], nn);
      P.quad(M.glass, [x - R * 0.7, 0.6, z + R + 0.02], [x + R * 0.7, 0.6, z + R + 0.02], [x + R * 0.7, 2.2, z + R + 0.02], [x - R * 0.7, 2.2, z + R + 0.02], [0, 0, 1]);
      ph.addBox(x, z, 2 * R, 2 * R, 0, 0, 3); }
    const gh = byId('w507817408'); if (gh) { const x = gh.cx, z = gh.cz; box(M.white, x - 1.2, x + 1.2, 0, 2.5, z - 1.2, z + 1.2, 'b', 1); box(M.roofDark, x - 1.45, x + 1.45, 2.5, 2.7, z - 1.45, z + 1.45, 'b', 1); P.quad(M.glass, [x - 0.8, 0.9, z + 1.23], [x + 0.8, 0.9, z + 1.23], [x + 0.8, 2.1, z + 1.23], [x - 0.8, 2.1, z + 1.23], [0, 0, 1]); ph.addBox(x, z, 2.4, 2.4, 0, 0, 3); }
  } catch (e) { console.error('[landmarksNewHolland] kiosks:', e); }

  // ================================================================== the Frigate playground "Фрегат": a 26 m replica hull of the frigate "Peter and Paul" on the slip, as if still being built [photo 43]
  try {
    const f = frameOf('w1000013403');
    const LEN = 26, B = 5.2, ns = 27;                                   // model frame: +x along the keel
    place(f, () => {
      const prof = (s) => { const q = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, s))), 0.7); return { w: B * (0.22 + 0.78 * q), top: 3.6 + 2.6 * (s * s + (1 - s) * (1 - s) * 0.5), keel: 0.5 + 1.8 * Math.pow(Math.abs(s - 0.5) * 2, 3) }; };
      const ribPts = (w, top, keel, grow) => {                          // a U-shaped rib outline in the cross-section plane (x across, y up)
        const hw = w / 2 + grow, R = Math.min(hw * 0.9, (top - keel) * 0.7), pts = [[-hw, top + grow]];
        pts.push([-hw, keel + R - grow * 0.2]);
        for (let i = 1; i < 8; i++) { const a = Math.PI + (Math.PI / 2) * i / 8; pts.push([-hw + R + Math.cos(a) * R, keel + R + Math.sin(a) * R - grow]); }
        pts.push([0, keel - grow]);
        for (let i = 1; i < 8; i++) { const a = 1.5 * Math.PI + (Math.PI / 2) * i / 8; pts.push([hw - R + Math.cos(a) * R, keel + R + Math.sin(a) * R - grow]); }
        pts.push([hw, keel + R - grow * 0.2], [hw, top + grow]);
        return pts;
      };
      const ribs = [];
      for (let k = 0; k < ns; k++) {
        const s = k / (ns - 1), pr = prof(s), x = -LEN / 2 + s * LEN;
        P.push(x - 0.07, 0, 0, Math.PI / 2);                              // rib plane = the cross-section; its thickness runs along the keel
        const outer = ribPts(pr.w, pr.top, pr.keel, 0), inner = ribPts(pr.w, pr.top - 0.16, pr.keel + 0.16, -0.16).map((q) => [q[0] * 0.99, q[1]]);
        G.frameRing(P, M.timber, outer, inner.slice(0, 0).length ? inner : ribPts(pr.w - 0.32, pr.top - 0.16, pr.keel + 0.16, 0), -0.07, 0.14, 1.4);
        P.pop(); ribs.push(pr);
      }
      // keel beam, planking: both sides over the first 11 stations, two strakes on the stern half, a deck, the stem / stern posts
      P.box(M.timberDark, -LEN / 2 + 0.8, LEN / 2 - 0.8, 0.28, 0.6, -0.22, 0.22, '', 1.4);
      for (let k = 0; k < 11; k++) {
        const a = ribs[k], b = ribs[k + 1], x0 = -LEN / 2 + (k / (ns - 1)) * LEN, x1 = -LEN / 2 + ((k + 1) / (ns - 1)) * LEN;
        for (const sd of [-1, 1]) for (let st = 0; st < 5; st++) {
          const ya = a.keel + 0.5 + st * 0.55, yb = b.keel + 0.5 + st * 0.55;
          const xa2 = Math.min(a.w / 2, Math.sqrt(Math.max(0.01, 1 - Math.pow(Math.max(0, 1 - (ya - a.keel) / Math.max(0.6, a.w / 2)), 2))) * a.w / 2), xb2 = Math.min(b.w / 2, Math.sqrt(Math.max(0.01, 1 - Math.pow(Math.max(0, 1 - (yb - b.keel) / Math.max(0.6, b.w / 2)), 2))) * b.w / 2);
          P.quad(M.timberDark, [x0, ya, sd * xa2], [x1, yb, sd * xb2], [x1, yb + 0.42, sd * xb2], [x0, ya + 0.42, sd * xa2], [0, 0.3, sd], [[0, 0], [1, 0], [1, 0.3], [0, 0.3]]);
        }
      }
      P.box(M.deck, -LEN / 2 + 5, LEN / 2 - 4, 3.0, 3.12, -B / 2 + 0.7, B / 2 - 0.7, '', 1.4);
      for (const s of [-1, 1]) P.box(M.timber, s * (LEN / 2 - 0.15) - 0.14, s * (LEN / 2 - 0.15) + 0.14, 1.2, 6.9, -0.14, 0.14, '', 1.4);
      // scaffolding: posts every 3 m both sides, three rails, diagonal braces, ladders, a rope-net ladder, a slide
      for (let i = 0; i <= 8; i++) {
        const x = -LEN / 2 + 1.4 + i * 3.0;
        for (const sd of [-1, 1]) { const z = sd * (B / 2 + 1.6); P.cyl(M.timber, [x, 0, z], [x, 7.4, z], 0.07, 0.07, 5, false); }
        for (const y of [2.3, 4.6, 6.9]) P.box(M.timber, x - 0.04, x + 0.04, y, y + 0.1, -B / 2 - 1.6, B / 2 + 1.6, 'b', 1.4);
      }
      for (const sd of [-1, 1]) for (const y of [2.3, 4.6, 6.9]) P.box(M.timber, -LEN / 2 + 1.4, LEN / 2 - 1.6, y, y + 0.09, sd * (B / 2 + 1.6) - 0.04, sd * (B / 2 + 1.6) + 0.04, 'b', 1.4);
      for (let k = 0; k < 5; k++) { const x0 = -LEN / 2 + 3 + k * 4.4; P.quad(M.timber, [x0, 0, B / 2 + 1.62], [x0 + 0.1, 0, B / 2 + 1.62], [x0 + 3.1, 4.6, B / 2 + 1.62], [x0 + 3.0, 4.6, B / 2 + 1.62], [0, 0, 1]); }
      for (let r = 0; r < 8; r++) P.box(M.rope, -LEN / 2 + 8.6 - 0.35, -LEN / 2 + 8.6 + 0.35, 0.4 + r * 0.5, 0.45 + r * 0.5, B / 2 + 1.6, B / 2 + 1.66, 'b', 1);
      for (const x of [-0.35, 0.35]) P.box(M.rope, -LEN / 2 + 8.6 + x - 0.02, -LEN / 2 + 8.6 + x + 0.02, 0, 4.6, B / 2 + 1.6, B / 2 + 1.66, 'b', 1);
      P.quad(M.ironSoft, [LEN / 2 - 4.5, 4.6, -B / 2 - 1.2], [LEN / 2 - 4.5, 4.6, -B / 2 - 2.0], [LEN / 2 + 3.5, 0.3, -B / 2 - 2.0], [LEN / 2 + 3.5, 0.3, -B / 2 - 1.2], [0, 1, 0]);      // the slide
    });
    ph.addBox(f.x, f.z, 22, 3.8, f.rot, 0, 7);                    // the hull core (the scaffold posts stay walk-through so the footway round the slip stays open)
    svc.crowd.push({ x: f.x, z: f.z, r: 9, n: 8, kind: 'playground' });
    svc.monuments.push({ id: 'w1000013403', name: 'Детская площадка «Фрегат»', x: f.x, z: f.z, h: 7 });
    void THREE;
  } catch (e) { console.error('[landmarksNewHolland] frigate:', e); }
}
