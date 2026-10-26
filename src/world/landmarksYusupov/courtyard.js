// landmarksYusupov/courtyard.js - the courtyard of the palace (the "oval" of Vallin de la Mothe) and its enclosure, docs/research/yusupov.md section 5, photos refs/yusupov 42 43 65 66.
//   * W1 = OSM wall w123243374 (52 m): the 7 m rusticated wall between courtyard and garden, blind arched niches with round medallions on the courtyard side (pitch 4.4 m), a plain yellow garden face,
//     a granite plinth, a white cornice; in the middle the OPEN garden gate (OSM gate node (-2923.3, 387)): rusticated piers, an arched passage, two porches of two Doric columns, a taller attic block
//     with pilasters and a red-brown roof, iron leaves folded back.
//   * the SE closure: the rounded corner + straight run of the wall polyline (OSM w123243374 tail) is a curved Doric COLONNADE (9 columns, 5.6 m, entablature, copper roof over the walk) in front of a panelled
//     back wall, ending at the SE gate block (OSM w123243375, 15.4 x 4.8 m: an arched passage, porches with paired columns, an attic).
//   * the courtyard floor (pinkish-grey gravel / asphalt) and the colliders (wall pieces, columns, gate piers; the passages stay free).
// Everything is drawn in world coordinates or in a tangent frame (lines.js).  No flags.
import * as THREE from 'three';
import * as L from '../layout.js';
import { BARRIERS, BUILDINGS } from '../data/city.js';
import { archPath } from './kit.js';
import { strip3D, offsetLine, sampleLine, lineLen, dist, project, leftIsInside, frameAngle, inRingPts } from './lines.js';
import { ROT, toUD, fromUD } from './frame.js';
import { fillPolyFine, chaikin } from './surfaces.js';
import { bust, cached, figureMats } from '../lib/figures.js';

const COURT_RING = [[-2944.7, 366.2], [-2917, 339], [-2914.7, 341.5], [-2908.5, 335.3], [-2901.1, 331.4], [-2892.2, 346.9], [-2882.5, 356], [-2874.5, 369.7], [-2877, 372.2], [-2877.8, 387.8], [-2881.7, 394.9], [-2888.9, 398.5], [-2893.1, 401.4], [-2896.2, 402], [-2899.6, 401.8], [-2902.3, 400.7], [-2904.4, 399.2], [-2907.5, 402.3]];

function niche(P, M, cx, zf) {
  const w = 2.5, hs = 3.2, y0 = 0.9;
  const sh = new THREE.Shape(); archPath(sh, cx, y0 - 0.02, w + 0.44, hs + 0.2, false);
  const hole = new THREE.Path(); archPath(hole, cx, y0, w, hs, true); sh.holes.push(hole);
  P.extrude(M.trim, sh, zf - 0.08, 0.08, 1.8, 8);
  P.cyl(M.trim, [cx, y0 + hs + 0.3, zf - 0.07], [cx, y0 + hs + 0.3, zf - 0.02], 0.5, 0.5, 14, true);                    // the round medallion in the tympanum: a white ring round an ochre field
  P.cyl(M.rustY, [cx, y0 + hs + 0.3, zf - 0.1], [cx, y0 + hs + 0.3, zf - 0.07], 0.34, 0.34, 14, true);
  const fr = (x0, x1, ya, yb) => P.box(M.trim, cx + x0, cx + x1, ya, yb, zf - 0.07, zf, 'kb');
  fr(-0.95, -0.85, y0 + 0.3, y0 + 2.8); fr(0.85, 0.95, y0 + 0.3, y0 + 2.8); fr(-0.95, 0.95, y0 + 0.3, y0 + 0.4); fr(-0.95, 0.95, y0 + 2.7, y0 + 2.8);   // sunk panel frame
}
function doricColumn(P, M, x, z, y0, y1, r) {
  P.box(M.graniteWarm, x - r * 1.5, x + r * 1.5, y0 - 0.2, y0 + 0.3, z - r * 1.5, z + r * 1.5, 'b');
  P.cyl(M.trim, [x, y0 + 0.3, z], [x, y1 - 0.5, z], r, r * 0.86, 14, false);
  P.cyl(M.trim, [x, y1 - 0.5, z], [x, y1 - 0.25, z], r * 0.9, r * 1.2, 14, false);
  P.box(M.trim, x - r * 1.35, x + r * 1.35, y1 - 0.25, y1, z - r * 1.35, z + r * 1.35, 'b');
}

/** the wall W1 with its open gate; returns the frame description for colliders */
function wall1(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const A = [-2944.7, 366.2], B = [-2907.5, 402.3], Ln = dist(A, B), tx = (B[0] - A[0]) / Ln, tz = (B[1] - A[1]) / Ln, th = frameAngle(tx, tz);
  const g = project([A, B], -2923.3, 387.0).s;                           // distance of the gate along the wall
  const pierW = 6.0, pass = 2.2;
  P.push(A[0], 0, A[1], th);                                              // local +x along the wall, -z = courtyard side, +z = garden side
  const run = (x0, x1) => {
    if (x1 - x0 < 0.5) return;
    P.box(M.graniteWarm, x0, x1, 0, 0.5, -0.55, 0.5, 'b');
    P.box(M.rustY, x0, x1, 0.5, 6.4, -0.45, 0.4, 'bf', 1.8);                        // courtyard face (-z) rusticated, the +z face is drawn plain below
    P.quad(M.wallY, [x0, 0.5, 0.4], [x1, 0.5, 0.4], [x1, 6.4, 0.4], [x0, 6.4, 0.4], [0, 0, 1], [[x0 / 3, 0.17], [x1 / 3, 0.17], [x1 / 3, 2.1], [x0 / 3, 2.1]]);
    P.box(M.trim, x0, x1, 6.4, 6.8, -0.8, 0.75, 'b'); P.box(M.wallY, x0, x1, 6.8, 7.2, -0.4, 0.4, 'b');
    P.box(M.trim, x0, x1, 7.2, 7.35, -0.5, 0.5, 'b');
    const n = Math.max(1, Math.round((x1 - x0 - 1.0) / 4.4)), step = (x1 - x0 - 1.0) / n;
    for (let i = 0; i < n; i++) niche(P, M, x0 + 0.5 + step * (i + 0.5), -0.45);
  };
  run(0, g - pierW); run(g + pierW, Ln);
  // ---- the gate block: piers + arched passage + attic block + porches on the courtyard side
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? g - pierW : g + pass + 0.0, x1 = s < 0 ? g - pass : g + pierW;
    P.box(M.graniteWarm, x0, x1, 0, 0.5, -0.55, 0.5, 'b'); P.box(M.rustY, x0, x1, 0.5, 6.4, -0.45, 0.4, 'bf', 1.8);
    P.quad(M.wallY, [x0, 0.5, 0.4], [x1, 0.5, 0.4], [x1, 6.4, 0.4], [x0, 6.4, 0.4], [0, 0, 1], [[x0 / 3, 0.17], [x1 / 3, 0.17], [x1 / 3, 2.1], [x0 / 3, 2.1]]);
    P.box(M.trim, x0, x1, 6.4, 6.8, -0.8, 0.75, 'b'); P.box(M.wallY, x0, x1, 6.8, 7.2, -0.4, 0.4, 'b'); P.box(M.trim, x0, x1, 7.2, 7.35, -0.5, 0.5, 'b');
    // iron leaves folded back against the reveals
    P.box(M.iron, g + s * (pass - 0.1) - 0.05, g + s * (pass - 0.1) + 0.05, 0.1, 3.9, -0.4, 0.4, 'b');
    // porch: two columns 1.8 m in front, entablature, copper roof
    const px = (x0 + x1) / 2;
    for (const dx of [-1.25, 1.25]) doricColumn(P, M, px + dx, -1.9, 0.0, 5.5, 0.34);
    P.box(M.trim, px - 2.05, px + 2.05, 5.5, 6.4, -2.45, -0.45, 'k');
    P.box(M.trim, px - 2.2, px + 2.2, 6.4, 6.7, -2.6, -0.45, 'b');
    P.box(M.copper, px - 2.3, px + 2.3, 6.7, 6.85, -2.7, -0.5, 'b');
  }
  // the arch over the passage (a rusticated tympanum) + the attic block
  const sh = new THREE.Shape(); sh.moveTo(g - pass, 0); sh.lineTo(g + pass, 0); sh.lineTo(g + pass, 6.4); sh.lineTo(g - pass, 6.4); sh.lineTo(g - pass, 0);
  const hole = new THREE.Path(); archPath(hole, g, 0, pass * 2, 3.4, true); sh.holes.push(hole);
  P.extrude(M.rustY, sh, -0.45, 0.85, 1.8, 10);
  P.box(M.trim, g - pass - 0.1, g + pass + 0.1, 6.4, 6.8, -0.8, 0.75, 'b'); P.box(M.trim, g - pass - 0.12, g + pass + 0.12, 5.2, 5.4, -0.55, 0.5, 'b');
  const ax0 = g - 3.7, ax1 = g + 3.7, ay1 = 11.2;
  P.box(M.wallY, ax0, ax1, 7.35, ay1, -0.55, 0.55, 'b');
  for (const x of [ax0 + 0.35, ax1 - 0.35, g - 1.0, g + 1.0]) { P.box(M.trim, x - 0.3, x + 0.3, 7.35, ay1 - 0.5, -0.65, -0.55, 'kb'); P.box(M.trim, x - 0.4, x + 0.4, ay1 - 0.9, ay1 - 0.5, -0.7, -0.55, 'kb'); }
  const sh2 = new THREE.Shape(); archPath(sh2, g, 8.2, 1.3, 1.0, false); const h2 = new THREE.Path(); archPath(h2, g, 8.25, 1.1, 0.95, true); sh2.holes.push(h2);
  P.extrude(M.trim, sh2, -0.63, 0.08, 1.8, 8);
  P.box(M.trim, ax0 - 0.4, ax1 + 0.4, ay1 - 0.5, ay1, -0.9, 0.9, 'b'); P.box(M.copper, ax0 - 0.2, ax1 + 0.2, ay1, ay1 + 0.35, -0.7, 0.7, 'b');
  P.box(M.chimney, g - 0.5, g + 0.5, ay1 + 0.35, ay1 + 2.6, -0.5, 0.5, 'b'); P.box(M.chimneyCap, g - 0.62, g + 0.62, ay1 + 2.6, ay1 + 2.8, -0.62, 0.62, 'b');
  P.pop();
  // colliders: wall pieces without the passage
  const seg = (t0, t1, y1) => { if (t1 - t0 < 0.3) return; const c = [A[0] + tx * (t0 + t1) / 2, A[1] + tz * (t0 + t1) / 2]; ph.addBox(c[0], c[1], t1 - t0, 1.0, th, 0, y1); };
  seg(0, g - pass, 7.4); seg(g + pass, Ln, 7.4);
  for (const s of [-1, 1]) { const px = g + s * (pierW + pass) / 2; for (const dx of [-1.25, 1.25]) { const lx = px + dx; ph.addCylinder(A[0] + tx * lx + tz * 1.9, A[1] + tz * lx - tx * 1.9, 0.5, 0, 6); } }
  return { A, B, g, tx, tz, th };
}

/** the curved colonnade + back wall along the SE closure polyline */
function colonnade(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const wall = BARRIERS.find((b) => b.id === 'w123243374');
  const pts = []; for (let i = 0; i < wall.pts.length; i += 2) pts.push([wall.pts[i], wall.pts[i + 1]]);
  let Q = pts.slice(1);                                                    // from the end of the straight run: rounded corner + the run towards the SE gate block
  Q.push([-2889.6, 398.0]);
  Q = chaikin(Q, 2, false);                                               // the OSM points zigzag by 1-3 m: smooth them (the strips below would overlap on the inside of the bends)
  Q = leftIsInside(Q, COURT_RING);
  // plinth + back wall (panelled ochre), the wall stands on the OSM line
  strip3D(P, Q, -0.45, 0.45, 0, 0.5, { left: M.graniteWarm, right: M.graniteWarm, top: M.graniteWarm }, 2);
  strip3D(P, Q, -0.4, 0.4, 0.5, 6.6, { left: M.wallY, right: M.wallY }, 3);
  strip3D(P, Q, -0.7, 0.7, 6.6, 7.0, { left: M.trim, right: M.trim, top: M.trim, under: M.trimShade }, 2);
  // panels: pale rectangles between the columns on the courtyard face
  const colLine = offsetLine(Q, 1.9);
  const cols = sampleLine(colLine, 3.0, 0.9, 0.9);
  const panels = sampleLine(offsetLine(Q, 0.43), 3.0, 1.5, 1.5);
  for (let i = 0; i + 1 < panels.length; i++) {
    const a = panels[i], b = panels[i + 1], m = [(a.x + b.x) / 2, (a.z + b.z) / 2], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz);
    if (l < 1.2) continue;
    const tx = dx / l, tz = dz / l, nx = tz, nz = -tx;                                                   // left normal = courtyard side
    const w = l * 0.78, x0 = m[0] - tx * w / 2, z0 = m[1] - tz * w / 2, x1 = m[0] + tx * w / 2, z1 = m[1] + tz * w / 2, o = 0.015;
    P.quad(M.trimWarm, [x0 + nx * o, 1.0, z0 + nz * o], [x1 + nx * o, 1.0, z1 + nz * o], [x1 + nx * o, 5.2, z1 + nz * o], [x0 + nx * o, 5.2, z0 + nz * o], [nx, 0, nz]);
    const ins = 0.12, y0 = 1.12, y1 = 5.08, xa = x0 + tx * ins, za = z0 + tz * ins, xb = x1 - tx * ins, zb = z1 - tz * ins;
    P.quad(M.wallY, [xa + nx * 0.03, y0, za + nz * 0.03], [xb + nx * 0.03, y0, zb + nz * 0.03], [xb + nx * 0.03, y1, zb + nz * 0.03], [xa + nx * 0.03, y1, za + nz * 0.03], [nx, 0, nz]);
  }
  // columns (Doric, 5.5 m) with an entablature beam over them and a copper roof sloping to the wall
  for (const c of cols) doricColumn(P, M, c.x, c.z, 0, 5.6, 0.36);
  strip3D(P, Q, 0.4, 2.45, 5.6, 6.5, { left: M.trim, top: M.trim, under: M.trimShade }, 2);
  strip3D(P, Q, 0.4, 2.7, 6.5, 6.75, { left: M.copper, top: M.copper }, 3);
  for (const c of cols) ph.addCylinder(c.x, c.z, 0.5, 0, 6);
  for (let i = 0; i + 1 < Q.length; i++) { const a = Q[i], b = Q[i + 1], l = dist(a, b); if (l < 0.3) continue; ph.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, l + 0.4, 1.0, frameAngle((b[0] - a[0]) / l, (b[1] - a[1]) / l), 0, 7.2); }
  return { Q, cols };
}

/** the SE gate block (OSM w123243375): 15.4 x 4.8 m, passage along d, porches with paired columns on the courtyard (-d) side */
function gateBlock(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const rec = BUILDINGS.find((b) => b.id === 'w123243375'), o = rec.polys[0].o;
  let cx = 0, cz = 0; for (let i = 0; i < o.length; i += 2) { cx += o[i] / (o.length / 2); cz += o[i + 1] / (o.length / 2); }
  const uw = 15.4, dw = 4.8, pass = 2.2, H = 8.2;
  P.push(cx, 0, cz, ROT);                                                // local x = u (along the front, to the NE), local z = d (to the SE); the courtyard is at -z
  const pier = (x0, x1) => {
    P.box(M.graniteWarm, x0, x1, 0, 0.5, -dw / 2 - 0.1, dw / 2 + 0.1, 'b'); P.box(M.rustY, x0, x1, 0.5, 6.4, -dw / 2, dw / 2, 'b', 1.8);
    P.box(M.trim, x0 - 0.15, x1 + 0.15, 6.4, 6.8, -dw / 2 - 0.3, dw / 2 + 0.3, 'b'); P.box(M.wallY, x0, x1, 6.8, H, -dw / 2 + 0.1, dw / 2 - 0.1, 'b');
    P.box(M.trim, x0 - 0.2, x1 + 0.2, H, H + 0.3, -dw / 2 - 0.2, dw / 2 + 0.2, 'b');
  };
  pier(-uw / 2, -pass); pier(pass, uw / 2);
  const sh = new THREE.Shape(); sh.moveTo(-pass, 0); sh.lineTo(pass, 0); sh.lineTo(pass, 6.4); sh.lineTo(-pass, 6.4); sh.lineTo(-pass, 0);
  const hole = new THREE.Path(); archPath(hole, 0, 0, pass * 2, 3.6, true); sh.holes.push(hole);
  // extrude along z through the block: the shape lies in the (x, y) plane
  P.extrude(M.rustY, sh, -dw / 2, dw, 1.8, 10);
  P.box(M.trim, -pass - 0.15, pass + 0.15, 6.4, 6.8, -dw / 2 - 0.3, dw / 2 + 0.3, 'b'); P.box(M.wallY, -pass, pass, 6.8, H, -dw / 2 + 0.1, dw / 2 - 0.1, 'b');
  // porches (two columns each) on the courtyard side
  for (const s of [-1, 1]) {
    const px = s * (pass + (uw / 2 - pass) / 2);
    for (const dx of [-1.15, 1.15]) doricColumn(P, M, px + dx, -dw / 2 - 1.6, 0.0, 5.6, 0.34);
    P.box(M.trim, px - 1.95, px + 1.95, 5.6, 6.4, -dw / 2 - 2.2, -dw / 2, 'k'); P.box(M.copper, px - 2.1, px + 2.1, 6.4, 6.55, -dw / 2 - 2.35, -dw / 2 + 0.1, 'b');
  }
  // two marble busts on pedestals at the outer corners of the attic cornice (photo 65), facing the courtyard (-z)
  const mk = figureMats(ctx).keys('marble', 'marble');
  [[-uw / 2 + 0.7, 91], [uw / 2 - 0.7, 92]].forEach(([bx, seed], i) => {
    P.box(M.trim, bx - 0.4, bx + 0.4, H + 0.3, H + 1.15, -1.8, -1.0, 'b');
    cached('lmY-bust' + i, () => bust({ detail: 0.5, style: 'bare', turn: i ? -0.3 : 0.3, pitch: 0.02, face: { age: 0.45, hair: 'curly', seed } })).place(P, mk, bx, H + 1.15, -1.4, Math.PI, 1.4);
  });
  P.pop();
  // colliders: the two piers (box in the P frame) + the porch columns
  const wbox = (u0, u1, y1) => { const c = fromUD(toUD(cx, cz).u + (u0 + u1) / 2, toUD(cx, cz).d); ph.addBox(c.x, c.z, u1 - u0, dw + 0.4, ROT, 0, y1); };
  wbox(-uw / 2, -pass, H); wbox(pass, uw / 2, H);
  const c0 = toUD(cx, cz);
  for (const s of [-1, 1]) { const px = s * (pass + (uw / 2 - pass) / 2); for (const dx of [-1.15, 1.15]) { const w = fromUD(c0.u + px + dx, c0.d - dw / 2 - 1.6); ph.addCylinder(w.x, w.z, 0.5, 0, 6); } }
  return { cx, cz };
}

export function build(K) {
  const { ctx, P, M, svc } = K;
  const w = wall1(K);
  const c = colonnade(K);
  const g = gateBlock(K);
  // courtyard floor: pinkish-grey gravel / asphalt, fine-tessellated (the service roads inside are asphalt ribbons of `streets`, 1.5 cm higher)
  fillPolyFine(P, M.court, COURT_RING, 0.012, { maxEdge: 14, tile: 3 });
  // services: the gate passages (people walk through), the courtyard crowd spot, a photo spot
  const gp = (t) => ({ x: w.A[0] + w.tx * t, z: w.A[1] + w.tz * t });
  svc.fences.push({ id: 'w123243374', pts: [w.A, w.B] }, { id: 'colonnade', pts: c.Q });
  svc.gates = [{ x: gp(w.g).x, z: gp(w.g).z, w: 4.4, name: 'ворота в сад' }, { x: g.cx, z: g.cz, w: 4.4, name: 'южные ворота двора' }];
  svc.crowd.push({ x: -2900, z: 366, r: 8, n: 6, name: 'court' });
  svc.photoSpots.push({ x: -2899, z: 372, yaw: -45, name: 'Юсуповский дворец: двор и колоннада' });
  void L; void inRingPts; void lineLen;
}
