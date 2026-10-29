// landmarksSredny/yard.js - the YARD of the tram depot (dossier docs/research/sredny.md sections 3.4 and 3.5, photos refs/sredny 59 62 63 64-71 79, frame D):
//   * the BRUSH PLOT on Sredny pr. (a 66 .. 95.7, b 103 .. 123): the monument "tram Brush" (OSM n1497507516, wikidata Q124152233): a replica of the first electric tram of 1907 (car "1031": 8.8 x 2.2 m, burgundy lower body,
//     cream pillars, black roof with a clerestory of ten small windows, gold number, blue signal lamps, a destination board with the old orthography) on a granite plinth 11 x 3.6 x 0.25 m over the stub track, a red-brown
//     paver plaza, a lawn, park lamps, benches, urns; the black spear fence with festoon arches and ball-topped posts along the street, plaster walls on the other sides;
//   * the Leonov bust (n4349495292): a bronze bust on a white pedestal 0.7 x 0.7 x 1.5 m with the incised name; the memorial stone (n8955444708); the steel lattice clock mast of the east apron;
//   * the yard fences and walls of OSM (w117122066 the east wall a ~ 95 from b 103 down to -81, the north end wall, w117122404 / w117122405 the fences round the pedestrian entrance, the plot walls);
//   * the static museum CARS on the east apron (modern working cars, LM-47, LM-33, MS-1), placed on their rails by two bogie points (cars.js).
// The tram gate (a 55 .. 61 at b 124: the lead w117830851 to Sredny) stays OPEN, so the east apron is reachable (decision of the dossier option: static cars and the bust are solid).  Rails, wires and the ground are streets'.
import * as THREE from 'three';
import * as L from '../layout.js';
import { FR } from './frame.js';
import { cached, figureMats, bust } from '../lib/figures.js';
import { fenceLine, panelBays, band, panel } from './wall.js';
import { knockBays, unitBox, splitBays } from '../lib/fence-bays.js';
import { fillPolyClipped, coverFn } from './surfaces.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';
import { carBody, wayPts, carOn } from './cars.js';

const D = FR.D;
const BRUSH = { a: 77.1, b: 117.7 };

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSredny] yard/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('plot', () => plot(K));
  stage('walls', () => walls(K));
  stage('bust', () => leonov(K));
  stage('mast', () => mast(K));
  stage('cars', () => cars(K));
  stage('services', () => services(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the Brush plot
function plot(K) {
  const { P, M, ctx } = K, ph = ctx.physics, cover = coverFn(ctx);
  const xz = (a, b) => D.xz(a, b);
  // ground: a lawn over the plot and the red-brown pavers round the monument (clipped at the asphalt)
  const lawn = [xz(66.9, 103.7), xz(95.0, 103.2), xz(95.2, 122.4), xz(66.9, 123.0)];
  fillPolyClipped(P, M.lawn, lawn, 0.04, (x, z) => cover(x, z), { margin: 0.3, maxEdge: 4, tile: 4 });
  const pav = [xz(68.2, 111.2), xz(87.2, 111.0), xz(87.0, 122.2), xz(68.0, 122.4)];
  fillPolyClipped(P, M.pavers, pav, 0.07, (x, z) => cover(x, z), { margin: 0.3, maxEdge: 4, tile: 3 });
  K.S.pavedRings = (K.S.pavedRings || []).concat([pav]);
  // the monument: plinth 11 x 3.6 x 0.25 m, the car on it (long axis along a, the long side faces Sredny pr.)
  D.enter(P);
  try {
    P.box(M.plinthGranite, BRUSH.a - 5.5, BRUSH.a + 5.5, 0, 0.25, BRUSH.b - 1.8, BRUSH.b + 1.8, 'b', 2);
    P.push(BRUSH.a, 0.25, BRUSH.b, 0);
    carBody(P, M, {
      L: 8.8, W: 2.2, ride: 0.5, belt: 1.5, top: 2.5, chamfer: 0.18, pillars: 6, wheels: true, clerestory: true, platforms: true,
      lower: M.burgundy, upper: M.tramCream, glass: M.tramGlassLight, roof: M.tramBlack, stripe: M.gold, pillarW: 0.11,
      number: (Q) => { for (const s of [-1, 1]) Q.quad(M.num1031, [-3.7 * s, 0.85, s * 1.115], [-2.6 * s, 0.85, s * 1.115], [-2.6 * s, 1.15, s * 1.115], [-3.7 * s, 1.15, s * 1.115], [0, 0, s], [[0, 0], [1, 0], [1, 1], [0, 1]]); },
    });
    // a cream band under the windows (the car is burgundy below, cream pillars above), the destination boards on the roof at both ends, two blue signal lamps on the front corners
    for (const s of [-1, 1]) {
      P.quad(M.brushBoard, [s * 3.7, 2.68, -0.7 * s], [s * 3.7, 2.68, 0.7 * s], [s * 3.7, 3.02, 0.7 * s], [s * 3.7, 3.02, -0.7 * s], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.box(M.white, s * 3.7 - 0.03, s * 3.7 + 0.03, 2.64, 3.06, -0.72, 0.72, '', 1);
      for (const t of [-1, 1]) { const g = new THREE.SphereGeometry(0.12, 8, 6); P.geo(M.blueLamp, g, s * 3.85, 2.75, t * 0.62); g.dispose(); }
    }
    P.pop();
  } finally { D.leave(P); }
  const mc = D.W(BRUSH.a, BRUSH.b);
  ph.addBox(mc.x, mc.z, 11.0, 3.6, D.rot, 0, 3.6);
  // park lamps (3.4 m, one lantern), two benches, two poster boards, four urns at the street gate
  const lampGeo = partsGeos((Q) => { Q.cyl(M.urnLamp, [0, 0, 0], [0, 0.4, 0], 0.16, 0.1, 8, true); Q.cyl(M.urnLamp, [0, 0.4, 0], [0, 3.1, 0], 0.05, 0.035, 8, false); const g = new THREE.CylinderGeometry(0.17, 0.12, 0.42, 6); Q.geo(M.whiteLamp, g, 0, 3.3, 0); g.dispose(); Q.cyl(M.urnLamp, [0, 3.5, 0], [0, 3.62, 0], 0.2, 0.02, 6, true); });
  const lSp = [], lIt = [];
  for (const [a, b] of [[70.0, 112.6], [86.0, 112.4], [70.0, 120.5], [86.0, 120.5]]) { const p = D.W(a, b); if (cover(p.x, p.z) < -0.6) { lSp.push({ x: p.x, y: 0.07, z: p.z, rotY: 0 }); lIt.push(ph.addCylinder(p.x, p.z, 0.2, 0, 3.6)); K.svc.lamps.push({ x: p.x, z: p.z, h: 3.6 }); } }
  K.extraTris += knockFurniture(ctx, 'lmsredn-parklamps', lampGeo, lSp, lIt, FURNITURE_REC.lamp(3.6), 300);      // knock records (docs/AREAS.md 13.7)
  D.enter(P);
  try {
    // the two park benches are knock records (they had no collider before): the same boxes, built once as a Parts geometry list
    const benchGeo = partsGeos((Q) => { Q.box(M.bench, -0.9, 0.9, 0.42, 0.47, -0.2, 0.2, 'b', 1); Q.box(M.bench, -0.9, 0.9, 0.62, 0.92, 0.18, 0.22, 'b', 1); for (const s of [-0.85, 0.85]) Q.box(M.iron, s - 0.03, s + 0.03, 0, 0.9, -0.2, 0.22, 'b', 1); });
    const bSp = [], bIt = [];
    for (const [a, b, rot] of [[72.0, 108.6, 0], [84.0, 108.6, 0]]) { const w = D.W(a, b); bSp.push({ x: w.x, y: 0.05, z: w.z, rotY: D.rot + rot }); bIt.push(ph.addBox(w.x, w.z, 1.9, 0.6, D.rot + rot, 0, 0.9)); K.svc.benches.push({ x: w.x, z: w.z }); }
    K.extraTris += knockFurniture(ctx, 'lmsredn-parkbenches', benchGeo, bSp, bIt, { ...FURNITURE_REC.bench, w: 1.9 }, 200);
    for (const a of [74.5, 92.0]) { P.box(M.boardWhite, a - 0.7, a + 0.7, 0.9, 2.1, 121.0, 121.08, '', 1); P.box(M.iron, a - 0.72, a + 0.72, 0.8, 0.9, 120.95, 121.13, '', 1); P.box(M.iron, a - 0.05, a + 0.05, 0, 0.9, 121.0, 121.08, '', 1); }
    for (const a of [80.4, 83.4]) for (const b of [122.2]) {                                   // cast-iron goblet urns (photo 79): a foot, a stem, a flared bowl (the first version read as a bucket)
      P.cyl(M.urn, [a, 0.07, b], [a, 0.15, b], 0.2, 0.18, 10, true); P.cyl(M.urn, [a, 0.15, b], [a, 0.5, b], 0.07, 0.06, 8, false);
      P.cyl(M.urn, [a, 0.5, b], [a, 0.82, b], 0.1, 0.3, 12, true); P.cyl(M.urn, [a, 0.82, b], [a, 0.88, b], 0.32, 0.32, 12, true);
    }
  } finally { D.leave(P); }
  // the black spear fence along the street (pickets with festoon arches, square posts with ball finials every 4.1 m)
  const line = [xz(95.7, 122.8), xz(88.7, 123.0), xz(66.5, 123.7), xz(60.9, 123.9)];
  const bays = [], r = fenceLine(P, ph, M.fenceBlack, line, { pw: 4.1, h: 2.0, y0: 0.0, gaps: [], bays });
  panelBays(ctx, 'lmsredn-brush-fence', bays, M.fenceBlack, { h: 2.0, y0: 0.0 });      // breakable bays (docs/AREAS.md 13.7)
  K.svc.fences.push({ id: 'brush-plot', pts: line, h: 2.0, kind: 'iron', gates: [] });
  for (const [x, z, rotY] of r.posts) { P.push(x, 0, z, rotY); P.box(M.iron, -0.06, 0.06, 0, 2.05, -0.06, 0.06, 'b', 1); const g = new THREE.SphereGeometry(0.09, 8, 6); P.geo(M.iron, g, 0, 2.14, 0); g.dispose(); P.pop(); }
  // the return fences: the west return round the pedestrian entrance (w117122404) and the fence w117122405 beside the east end of 79A
  for (const pts of [[xz(54.8, 124.0), xz(53.1, 106.0)], [xz(37.2, 119.3), xz(36.5, 106.5), xz(46.0, 106.3)]]) {
    const bays2 = [], rr = fenceLine(P, ph, M.fenceBlack, pts, { pw: 4.1, h: 2.0, y0: 0.0, gaps: [], bays: bays2 });
    panelBays(ctx, 'lmsredn-entry-fence', bays2, M.fenceBlack, { h: 2.0, y0: 0.0 });
    K.svc.fences.push({ id: 'depot-entry', pts, h: 2.0, kind: 'iron', gates: [] });
    for (const [x, z, rotY] of rr.posts) { P.push(x, 0, z, rotY); P.box(M.iron, -0.06, 0.06, 0, 2.05, -0.06, 0.06, 'b', 1); P.pop(); }
  }
}

// ------------------------------------------------------------------------------------------------ plaster walls (2.4 m, grey cap, pilasters every 8 m) with fence colliders
function wallRun(K, pts, o = {}) {
  const { M, ctx } = K, h = o.h || 2.4, t = o.t || 0.4, bays = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const A = pts[i], B = pts[i + 1], len = Math.hypot(B[0] - A[0], B[1] - A[1]); if (len < 0.3) continue;
    bays.push(...splitBays(A[0], A[1], B[0], B[1], 8, { y: 0 }));
  }
  // n4spb (the owner's rule: every wall breaks; docs/AREAS.md 13.7, the pattern of landmarksKirova/eryard.js): the plaster body, the grey cap and the pilaster (one per 8 m bay, at its middle) are the parts
  // of breakable bays (a thin collider flagged `fence`, one anchored knock record per bay: a car breaks a bay off at the foot, the gap is passable)
  const pil = new THREE.BoxGeometry(0.5, h + 0.05, t + 0.16); pil.translate(0, (h + 0.05) / 2, 0);
  knockBays(ctx, { name: 'lmsredn-yard-wall', bays, far: 300,
    parts: [{ geo: unitBox(0, h, -t / 2, t / 2, { uLen: 8, uvs: 2 }), mat: M.plasterPink, name: 'wall', stretch: true },
      { geo: unitBox(h, h + 0.12, -t / 2 - 0.06, t / 2 + 0.06, { uLen: 8, uvs: 1 }), mat: M.cap, name: 'cap', stretch: true, inset: -0.05 },
      { geo: pil, mat: M.plasterPink, name: 'pilaster', at: 'mid', when: (b) => Math.hypot(b.x1 - b.x0, b.z1 - b.z0) > 5 }],
    collider: { y0: 0, y1: h, thick: t, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: 1500, h, anchored: 28, hitK: 0.5, metal: false, minDv: 0 }) });
}
function walls(K) {
  const xz = (a, b) => D.xz(a, b);
  // the plot walls (east, south, west) and the yard walls: the east wall (a ~ 95 down to b = -81) and the north end wall
  wallRun(K, [xz(95.7, 122.8), xz(94.9, 102.7), xz(66.0, 103.3), xz(66.5, 123.7)].slice(0, 4));
  wallRun(K, [xz(94.9, 102.7), xz(90.1, -81.3), xz(51.8, -80.7), xz(33.3, -80.2)]);
  K.svc.fences.push({ id: 'depot-yard-wall', pts: [xz(94.9, 102.7), xz(90.1, -81.3), xz(51.8, -80.7), xz(33.3, -80.2)], h: 2.4, kind: 'stucco', gates: [] });
}

// ------------------------------------------------------------------------------------------------ the Leonov bust and the memorial stone
function leonov(K) {
  const { P, M, ctx } = K, ph = ctx.physics, p = D.W(29.7, 83.5);
  P.push(p.x, 0, p.z, D.rot - Math.PI / 2);
  P.box(M.pedWhite, -0.35, 0.35, 0, 1.5, -0.35, 0.35, 'b', 1);
  P.box(M.pedWhite, -0.42, 0.42, 1.5, 1.58, -0.42, 0.42, 'b', 1);
  P.quad(M.leonovPlate, [-0.3, 0.9, 0.355], [0.3, 0.9, 0.355], [0.3, 1.12, 0.355], [-0.3, 1.12, 0.355], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.pop();
  const fm = figureMats(ctx), mk = { main: M.bronze, dark: fm.dark, accent: fm.gold };                 // dark brown bronze (the kit's patina bronze is green-black)
  cached('lmsredn-leonov', () => bust({ style: 'civil', detail: 0.8, turn: 0.1, face: { hair: 'short', beard: 'none', age: 0.5, mouth: 'stern', brow: 0.8, jaw: 1.0, seed: 41 } })).place(P, mk, p.x, 1.58, p.z, D.rot - Math.PI / 2, 1.4);                 // 1.4 = a plinth bust of about 0.85 m (photo 62: the bust is over half the height of the pedestal; the first version was 1.15 = 0.7 m)
  ph.addBox(p.x, p.z, 0.9, 0.9, D.rot, 0, 2.5);
  // the small granite boulder (memorial stone, n8955444708)
  const g = new THREE.SphereGeometry(1, 8, 6); P.geo(M.plinthGranite, g, -5004, 0.3, -716, 0, 0.4, 0, 0.5, 0.42, 0.45); g.dispose();
  ph.addCylinder(-5004, -716, 0.5, 0, 0.8);
  K.svc.monuments.push({ id: 'n4349495292', name: 'Бюст А. П. Леонова', x: p.x, z: p.z, h: 2.5 });
}

// ------------------------------------------------------------------------------------------------ the steel lattice clock mast of the east apron (a 40, b 78): a double-faced clock d 0.9 m on a scroll bracket
function mast(K) {
  const { M, ctx } = K, ph = ctx.physics;
  // n4spb: the mast is a knock record (a tall thin pole: docs/AREAS.md 13.7); the same boxes / cylinders, built once at the origin (a = b = 0) and placed at frame (40, 78)
  const geo = partsGeos((P) => {
    const a = 0, b = 0, H = 9, w = 0.35;
    for (const [dx, dz] of [[-w, -w], [w, -w], [w, w], [-w, w]]) P.box(M.steelMast, a + dx - 0.04, a + dx + 0.04, 0, H, b + dz - 0.04, b + dz + 0.04, 'b', 1);
    for (let y = 0.5; y < H; y += 1.5) {
      P.box(M.steelMast, a - w, a + w, y, y + 0.05, b - w - 0.02, b - w + 0.02, '', 1); P.box(M.steelMast, a - w, a + w, y, y + 0.05, b + w - 0.02, b + w + 0.02, '', 1);
      P.box(M.steelMast, a - w - 0.02, a - w + 0.02, y, y + 0.05, b - w, b + w, '', 1); P.box(M.steelMast, a + w - 0.02, a + w + 0.02, y, y + 0.05, b - w, b + w, '', 1);
      P.cyl(M.steelMast, [a - w, y, b - w - 0.02], [a + w, y + 1.5, b - w - 0.02], 0.02, 0.02, 4, false); P.cyl(M.steelMast, [a + w, y, b - w - 0.02], [a - w, y + 1.5, b - w - 0.02], 0.02, 0.02, 4, false);
    }
    P.box(M.steelMast, a - 0.6, a + 0.6, 0, 0.12, b - 0.6, b + 0.6, 'b', 1);
    P.cyl(M.iron, [a, 6.2, b - 0.4], [a, 6.2, b - 0.75], 0.03, 0.03, 5, false);
    P.cyl(M.white, [a - 0.05, 6.2, b - 0.75], [a + 0.05, 6.2, b - 0.75], 0.45, 0.45, 20, true);
    P.cyl(M.white, [a, 6.2, b - 0.8], [a, 6.2, b - 0.82], 0.46, 0.46, 20, true);
  });
  const c = D.W(40, 78);
  K.extraTris += knockFurniture(ctx, 'lmsredn-clock-mast', geo, [{ x: c.x, y: 0, z: c.z, rotY: D.rot }], [ph.addCylinder(c.x, c.z, 0.55, 0, 9)], { kind: 'mast', mass: 380, h: 9, r: 0.45, anchored: 24, hitK: 0.5, metal: true }, 300);
}

// ------------------------------------------------------------------------------------------------ static museum cars on the east apron
function cars(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const modern = (P_, o = {}) => carBody(P_, M, { L: 15.4, W: 2.5, ride: 0.55, belt: 0.95, top: 2.95, chamfer: 0.9, pillars: 9, lower: M.tramRed, upper: M.tramGrey, glass: M.tramGlass, roof: M.tramGrey, stripe: M.tramRed, doors: [-4.6, 0.3, 5.2], doorMat: M.tramRed, roofBox: M.tramGrey, ...o });
  const lm47 = (P_) => carBody(P_, M, { L: 14.0, W: 2.5, ride: 0.6, belt: 1.05, top: 2.5, chamfer: 0.7, pillars: 9, lower: M.tramRed, upper: M.tramCream, glass: M.tramGlass, roof: M.tramCream, doors: [-4.2, 4.6], doorMat: M.tramRed });
  const lm33 = (P_) => carBody(P_, M, { L: 12.5, W: 2.45, ride: 0.6, belt: 1.05, top: 2.5, chamfer: 0.5, pillars: 8, lower: M.burgundy, upper: M.tramCream, glass: M.tramGlass, roof: M.tramBlack, stripe: M.gold, wheels: true, doors: [-3.8, 4.0], doorMat: M.wood });
  const ms1 = (P_) => carBody(P_, M, { L: 9.8, W: 2.2, ride: 0.5, belt: 1.2, top: 2.35, chamfer: 0.2, pillars: 6, lower: M.tramRed2, upper: M.wood, glass: M.tramGlass, roof: M.tramBlack, clerestory: true, platforms: true, wheels: true });
  const list = [['w420560144', 9.5, 8.5, lm47, 14.0], ['w420560114', 9.0, 9.0, modern, 15.4], ['w90798881', 10.0, 8.0, lm33, 12.5], ['w90798878', 9.0, 9.0, (Q) => modern(Q, { lower: M.tramRed2 }), 15.4], ['w420560107', 8.0, 6.0, ms1, 9.8]];
  const placed = [];
  for (const [id, s, bogie, fn, len] of list) {
    const pts = wayPts(id); if (!pts) continue;
    const r = carOn(P, pts, s, bogie, fn);
    ph.addBox(r.x, r.z, len, 2.6, r.rotY, 0, 3.4);
    placed.push({ id, x: r.x, z: r.z });
  }
  K.svc.staticTrams = placed;
}

function services(K) {
  const svc = K.svc, cover = coverFn(K.ctx), mb = D.W(BRUSH.a, BRUSH.b);
  svc.monuments.push({ id: 'n1497507516', name: 'Памятник трамваю «Брюш» (вагон № 1031)', x: mb.x, z: mb.z, h: 3.6 });
  const spot = (x, z, yaw, pitch, name) => { if (cover(x, z) < -0.5 && !L.insideBuilding(x, z, 0.5)) svc.photoSpots.push({ x, z, yaw, pitch, name }); };
  spot(-4975.4, -678.9, 30, 4, 'Трамвайный парк: памятник трамваю «Брюш»');
  spot(-5013, -700, -150, 6, 'Трамвайный парк: торцы вагонных сараев');
  svc.crowd.push({ id: 'brush-plot', kind: 'photo', x: D.W(77, 128.5).x, z: D.W(77, 128.5).z, r: 5, n: 3 });
  svc.crowd.push({ id: 'depot-apron', kind: 'photo', x: D.W(70, 60).x, z: D.W(70, 60).z, r: 8, n: 3 });
}
