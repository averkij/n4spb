// landmarksMenshikov/monuments.js - the sculpture and small architecture of the Rumyantsev Garden (docs/research/menshikov.md sections 4.4 - 4.7; photos refs/menshikov 70 71 76 79-83 89-91 92-98 123-126 130 132 135-137 N07 N10).  Frame GF (the plaque face looks +z, to the south gate).
//   OBELISK  «Румянцова победамъ» (Brenna 1798-99, moved here by Rossi 1818), 21.3 m: three granite steps (5.6 m square), a 3.2 m lower plinth of dark Serdobol granite, the pink Tivdia marble die with a grey Ruskeala foot
//            (2.0 .. 6.4 m) carrying the bronze plaque with the gilt old-orthography text under a laurel wreath, two trophy panels beside it and garlands below; the other three faces a trophy relief band with
//            three garlands; four corner blocks, the grey-green polished granite shaft tapering 1.35 -> 0.55 m, a pyramidion, a gilded ball and the gilded eagle.
//   FOUNTAINS  two cast-iron two-tier fountains (Carrier-Belleuse models, F. K. San-Galli): a granite basin ring 8.9 m, an octagonal plinth, a neck, two putti round the stem, the gadrooned lower bowl 3.6 m,
//            the upper bowl 2.0 m, a pine-cone finial; water in the basin.
//   BUSTS    Surikov (L. Eidlin) and Repin (M. Manizer), 1999: bronze busts (blue-grey patina) from the figure kit on light granite steles with a bronze medallion plate, on a granite slab with a chain fence.
//   PAVILION the music pavilion (1.0 m rusticated base, six steps, spiral cast-iron columns, lace balustrade, flat hip roof, grey radial soffit); the toilet block redrawn as a plain kiosk.
import * as THREE from 'three';
import * as L from '../layout.js';
import { GF, HG } from './frame.js';
import { revolve, frustum, tbox, ball } from './geo.js';
import { bust, cached } from '../lib/figures.js';
import { figureMats } from '../lib/figures.js';
import { FOUNT } from './garden.js';

const TAU = Math.PI * 2;
const sph = (() => { let g = null; return () => g || (g = new THREE.SphereGeometry(1, 8, 6)); })();
const S = (P, mat, x, y, z, rx, ry, rz) => P.geo(mat, sph(), x, y, z, 0, 0, 0, rx, ry, rz);

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { const t0 = K.P.tris; try { fn(); } catch (e) { console.error(`[landmarksMenshikov] monuments/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } if (typeof process !== 'undefined' && process.env && process.env.MEN_DEBUG) console.log('[monuments]', name, K.P.tris - t0); };
  const P = K.P;
  P.push(GF.x, 0, GF.z, GF.rot);
  try {
    stage('obelisk', () => obelisk(K));
    for (const f of FOUNT) stage('fountain-' + f.id, () => fountain(K, f));
    stage('busts', () => busts(K));
    stage('pavilion', () => pavilion(K));
  } finally { P.pop(); }
  stage('kiosk', () => kiosk(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ obelisk
function obelisk(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  // three granite steps 5.6 / 4.8 / 4.0 m, 0.233 m each, then the lower plinth 3.2 m
  const steps = [[5.6, 0.233], [4.8, 0.467], [4.0, 0.7]];
  for (const [w, y] of steps) tbox(P, M.granite, -w / 2, w / 2, 0, y, -w / 2, w / 2, 2.2, 2.2, 'b');
  tbox(P, M.graniteDark, -1.6, 1.6, 0.7, 1.82, -1.6, 1.6, 2.2, 2.2, 'b');
  tbox(P, M.graniteDark, -1.72, 1.72, 1.82, 2.0, -1.72, 1.72, 2.2, 2.2, '');                    // the profiled top moulding of the lower plinth
  // the die: grey Ruskeala foot band 2.0 .. 2.5, pink Tivdia marble 2.5 .. 6.2 tapering 2.6 -> 2.46, a cornice, four corner blocks
  tbox(P, M.ruskeala, -1.3, 1.3, 2.0, 2.5, -1.3, 1.3, 2.2, 2.2, 'b');
  const w0 = 1.3, w1 = 1.23;
  // tapering pink faces (four quads, uv in metres)
  const q = (p0, p1, p2, p3, n) => P.quad(M.die, p0, p1, p2, p3, n, [[0, 0], [2.6 / 2.2, 0], [2.6 / 2.2, 3.7 / 2.2], [0, 3.7 / 2.2]]);
  q([-w0, 2.5, w0], [w0, 2.5, w0], [w1, 6.2, w1], [-w1, 6.2, w1], [0, 0.03, 1]); q([w0, 2.5, -w0], [-w0, 2.5, -w0], [-w1, 6.2, -w1], [w1, 6.2, -w1], [0, 0.03, -1]);
  q([w0, 2.5, w0], [w0, 2.5, -w0], [w1, 6.2, -w1], [w1, 6.2, w1], [1, 0.03, 0]); q([-w0, 2.5, -w0], [-w0, 2.5, w0], [-w1, 6.2, w1], [-w1, 6.2, -w1], [-1, 0.03, 0]);
  tbox(P, M.ruskeala, -1.4, 1.4, 6.2, 6.4, -1.4, 1.4, 2.2, 2.2, '');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tbox(P, M.graniteDark, sx * 0.95 - 0.25, sx * 0.95 + 0.25, 6.4, 6.9, sz * 0.95 - 0.25, sz * 0.95 + 0.25, 1, 1, 'b');
  // the front (+z), photo 98: the bronze plaque 1.4 x 1.6 with four bolts and the gilt text, the laurel wreath with its palm sprays on the plaque top, a white marble trophy block at each side of the plaque (0.52 x 0.8),
  // and a bronze festoon hanging from each block (a drop along the plaque and a swag)
  const zf = w1 + 0.012, zp = zf + 0.05, UV = [[0, 0], [1, 0], [1, 1], [0, 1]], UVm = [[1, 0], [0, 0], [0, 1], [1, 1]];
  P.box(M.bronzeDark, -0.72, 0.72, 3.13, 4.77, zf, zp, 'k', 1);
  P.quad(M.plaqueObelisk, [-0.7, 3.15, zp + 0.004], [0.7, 3.15, zp + 0.004], [0.7, 4.75, zp + 0.004], [-0.7, 4.75, zp + 0.004], [0, 0, 1], UV);
  P.quad(M.laurel, [-1.0, 4.55, zp + 0.012], [1.0, 4.55, zp + 0.012], [1.0, 5.35, zp + 0.012], [-1.0, 5.35, zp + 0.012], [0, 0, 1], UV);
  for (const sg of [-1, 1]) {
    const x0 = sg * 0.74, x1 = sg * 1.25;
    P.box(M.creamFlat, Math.min(x0, x1), Math.max(x0, x1), 3.8, 4.66, zf, zf + 0.07, 'k', 1);
    P.quad(M.trophy, [Math.min(x0, x1) + 0.03, 3.84, zf + 0.077], [Math.max(x0, x1) - 0.03, 3.84, zf + 0.077], [Math.max(x0, x1) - 0.03, 4.62, zf + 0.077], [Math.min(x0, x1) + 0.03, 4.62, zf + 0.077], [0, 0, 1], UV);
    const fx0 = sg > 0 ? 0.7 : -1.3, fx1 = fx0 + 0.6;
    P.quad(M.garland, [fx0, 2.62, zf + 0.085], [fx1, 2.62, zf + 0.085], [fx1, 3.84, zf + 0.085], [fx0, 3.84, zf + 0.085], [0, 0, 1], sg > 0 ? UV : UVm);
  }
  // the other three faces: a white trophy relief band 1.84 x 0.55 with a festoon under each end
  for (const rot of [Math.PI, Math.PI / 2, -Math.PI / 2]) {
    P.push(0, 0, 0, rot);
    P.box(M.creamFlat, -1.0, 1.0, 4.1, 4.75, zf, zf + 0.04, 'k', 1);
    P.quad(M.trophyBand, [-0.92, 4.14, zf + 0.047], [0.92, 4.14, zf + 0.047], [0.92, 4.7, zf + 0.047], [-0.92, 4.7, zf + 0.047], [0, 0, 1], UV);
    P.quad(M.garland, [0.5, 2.9, zf + 0.085], [1.1, 2.9, zf + 0.085], [1.1, 4.12, zf + 0.085], [0.5, 4.12, zf + 0.085], [0, 0, 1], UV);
    P.quad(M.garland, [-1.1, 2.9, zf + 0.085], [-0.5, 2.9, zf + 0.085], [-0.5, 4.12, zf + 0.085], [-1.1, 4.12, zf + 0.085], [0, 0, 1], UVm);
    P.pop();
  }
  // the shaft: a square taper 1.35 m at 6.9 to 0.55 m at 20.3 (circumradius = half width x sqrt 2), a low pyramidion, the gilded ball and eagle
  frustum(P, M.shaft, 0, 0, 6.9, 20.3, 4, 0.675 * Math.SQRT2, 0.275 * Math.SQRT2, -Math.PI / 4, 1, 4);
  frustum(P, M.shaft, 0, 0, 20.3, 20.72, 4, 0.275 * Math.SQRT2, 0.03, -Math.PI / 4, 1, 1);
  ball(P, M.gold, 0, 20.95, 0, 0.23, 10);
  // the eagle: body, spread wings (two lofted wedges), head, tail
  const ey = 21.28;
  S(P, M.gold, 0, ey, 0, 0.1, 0.1, 0.17); S(P, M.gold, 0, ey + 0.13, 0.13, 0.055, 0.055, 0.06); S(P, M.gold, 0, ey - 0.02, -0.2, 0.06, 0.02, 0.14);
  for (const s of [-1, 1]) { S(P, M.gold, s * 0.28, ey + 0.1, 0.0, 0.3, 0.025, 0.11); S(P, M.gold, s * 0.52, ey + 0.2, 0.02, 0.22, 0.02, 0.08); }
  P.box(M.gold, -0.03, 0.03, ey + 0.2, ey + 0.26, 0.15, 0.2, '');
  // colliders: the steps are walkable, the plinth blocks
  for (const [w, y] of steps) ph.addWalkBox(GF.x, GF.z, w, w, GF.rot, y);
  ph.addBox(GF.x, GF.z, 3.3, 3.3, GF.rot, 0.65, 25);
  K.svc.monuments.push({ id: 'n1271445526', name: 'Румянцевский обелиск «Румянцова победамъ»', x: GF.x, z: GF.z, h: HG.obelisk });
}

// ------------------------------------------------------------------------------------------------ fountains
function putto(P, M, x, y, z, rot) {
  P.push(x, y, z, rot);
  S(P, M.castIron, 0, 0.5, 0, 0.17, 0.26, 0.15);                                 // body
  S(P, M.castIron, 0, 0.86, 0.02, 0.13, 0.13, 0.12);                             // head
  S(P, M.castIron, -0.1, 0.18, 0.04, 0.07, 0.22, 0.07); S(P, M.castIron, 0.1, 0.22, -0.02, 0.07, 0.2, 0.07);   // legs
  S(P, M.castIron, -0.2, 0.62, 0.06, 0.06, 0.16, 0.06); S(P, M.castIron, 0.2, 0.72, 0.04, 0.06, 0.16, 0.06);   // arms up to the stem
  P.pop();
}
function fountain(K, f) {
  const { P, M, ctx } = K, a = f.a, b = f.b;
  P.push(a, 0, b, 0);
  try {
    // granite basin ring: outer diameter 8.9 m, rim 0.45 m high, 0.5 m wide, polished top; the water 0.15 m under the rim
    revolve(P, M.granite, [[4.45, 0], [4.45, 0.2], [4.35, 0.43], [4.0, 0.47], [3.95, 0.44], [3.95, 0.04]], 36, { uRep: 12, vTile: 2.2, crease: 70 });
    const n = 36, ringp = Array.from({ length: n }, (_, i) => [Math.sin(i * TAU / n) * 3.96, Math.cos(i * TAU / n) * 3.96]);
    P.cap(M.water, ringp, 0.3, true, 4);
    // the cast-iron fountain (photo 79, N07, 89-91): an octagonal plinth 1.9 m with relief panels, a bulbous middle with four lion masks, the gadrooned lower bowl 3.6 m, a short urn with two putti round the stem,
    // the upper bowl 2.0 m and a pine-cone finial; 5.6 m in all
    const oct = (r, y0, y1, mat) => frustum(P, mat, 0, 0, y0, y1, 8, r, r, Math.PI / 8, 1, 1);
    oct(1.0, 0.04, 1.25, M.castIron); oct(1.1, 1.25, 1.4, M.castIronLit); oct(1.06, 0.04, 0.22, M.castIronLit);
    for (let i = 0; i < 8; i++) { const t = i * TAU / 8, r0 = 0.93; P.quad(M.castIronLit, [Math.sin(t - 0.3) * r0, 0.4, Math.cos(t - 0.3) * r0], [Math.sin(t + 0.3) * r0, 0.4, Math.cos(t + 0.3) * r0], [Math.sin(t + 0.3) * r0, 1.1, Math.cos(t + 0.3) * r0], [Math.sin(t - 0.3) * r0, 1.1, Math.cos(t - 0.3) * r0], [Math.sin(t), 0, Math.cos(t)]); }
    revolve(P, M.castIron, [[0, 1.4], [0.95, 1.4], [0.85, 1.55], [0.62, 1.8], [0.55, 2.1], [0.72, 2.25], [0.56, 2.4], [0.2, 2.45]], 16, { crease: 40 });
    for (let r = 0; r < 4; r++) { const t = r * TAU / 4; S(P, M.castIronLit, Math.sin(t) * 0.66, 1.95, Math.cos(t) * 0.66, 0.16, 0.14, 0.16); }              // lion masks
    revolve(P, M.castIron, [[0, 2.4], [0.6, 2.42], [1.0, 2.55], [1.5, 2.78], [1.82, 2.98], [1.84, 3.12], [1.7, 3.14], [1.3, 2.98], [0.45, 2.9]], 24, { crease: 45 });
    for (let i = 0; i < 12; i++) { const t = i * TAU / 12; S(P, M.castIronLit, Math.sin(t) * 1.8, 3.0, Math.cos(t) * 1.8, 0.1, 0.1, 0.1); }
    revolve(P, M.castIron, [[0, 2.9], [0.35, 2.95], [0.42, 3.15], [0.3, 3.35], [0.22, 3.4]], 12, { crease: 50 });
    P.cyl(M.castIron, [0, 3.35, 0], [0, 4.3, 0], 0.19, 0.16, 8, false);
    for (const t of [0.5, 0.5 + Math.PI]) putto(P, M, Math.sin(t) * 0.34, 3.2, Math.cos(t) * 0.34, t);
    revolve(P, M.castIron, [[0, 4.15], [0.35, 4.17], [0.7, 4.3], [1.0, 4.45], [1.02, 4.56], [0.9, 4.57], [0.5, 4.45], [0.2, 4.38]], 20, { crease: 45 });
    revolve(P, M.castIron, [[0.12, 4.5], [0.3, 4.65], [0.34, 4.9], [0.24, 5.05], [0.14, 5.15], [0.2, 5.25], [0.05, 5.5], [0, 5.6]], 10, { crease: 50 });
    // thin jets from the upper bowl rim into the lower one (silent)
    for (let i = 0; i < 6; i++) { const t = i * TAU / 6 + 0.3; P.cyl(M.water, [Math.sin(t) * 1.0, 4.5, Math.cos(t) * 1.0], [Math.sin(t) * 1.3, 3.1, Math.cos(t) * 1.3], 0.012, 0.012, 3, false); }
    ctx.physics.addCylinder(GF.W(a, b).x, GF.W(a, b).z, 4.6, 0, 0.5);                  // the basin rim blocks, the middle is not walkable either
    ctx.physics.addCylinder(GF.W(a, b).x, GF.W(a, b).z, 4.0, 0, 6);
  } finally { P.pop(); }
  const w = GF.W(a, b); K.svc.monuments.push({ id: f.id, name: 'Румянцевский сад: чугунный фонтан', x: w.x, z: w.z, h: 5.1 });
}

// ------------------------------------------------------------------------------------------------ busts
function busts(K) {
  const { P, M, ctx } = K, fm = figureMats(ctx), mk = { main: M.bronzeBlue, dark: M.bronzeDark, accent: M.bronzeBlue };
  const list = [
    // review fix: the 'long' hair of the kit hangs as tubes behind the head and read as a hood with ear flaps at 3 m; photo 82 shows wavy hair over the ears: 'curly' volume, and a heroic head (scale 1.3: the head is a third of the bust)
    { id: 'n2260468761', who: 'Василий Суриков', a: 29.6, b: 42.9, face: { age: 0.4, hair: 'curly', beard: 'full', seed: 3, scale: 1.3, mouth: 'stern' }, key: 'surikov', lines: [['ВАСИЛИЙ', 0.4], ['СУРИКОВ', 0.4]] },
    { id: 'n2260468762', who: 'Илья Репин', a: -38.7, b: 42.3, face: { age: 0.65, hair: 'curly', beard: 'full', seed: 9, scale: 1.3 }, key: 'repin', lines: [['ИЛЬЯ', 0.4], ['РЕПИН', 0.4]] },
  ];
  for (const s of list) {
    const front = Math.atan2(-s.a, -s.b);                                             // faces the central axis (the obelisk)
    P.push(s.a, 0, s.b, front);
    // granite slab 2.0 m, a stele 0.55 x 0.55 x 2.2 m with a bronze medallion plate, the bust on top
    tbox(P, M.graniteLight, -1.0, 1.0, 0, 0.1, -1.0, 1.0, 2.2, 2.2, 'b');
    tbox(P, M.graniteLight, -0.34, 0.34, 0.1, 0.4, -0.34, 0.34, 1.2, 1.2, 'b');
    tbox(P, M.graniteLight, -0.275, 0.275, 0.4, 2.2, -0.275, 0.275, 1.2, 1.2, 'b');
    tbox(P, M.graniteLight, -0.33, 0.33, 2.2, 2.32, -0.33, 0.33, 1.2, 1.2, '');
    const tex = M.A.plate('bust-' + s.key, s.lines.map(([t, k]) => [t, k, 70]), 256, 256, { bg: '#4b4a40', fg: '#c9b57a', rim: '#8a7f58' });
    const mat = ctx.mat.toon('#ffffff', { map: tex, name: 'lmmensh-bust-' + s.key, paint: 0.01 });
    P.cyl(M.bronzeDark, [0, 1.5, 0.275], [0, 1.5, 0.3], 0.23, 0.23, 14, true);
    P.quad(mat, [-0.2, 1.3, 0.305], [0.2, 1.3, 0.305], [0.2, 1.7, 0.305], [-0.2, 1.7, 0.305], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    cached('lmmensh-bust-' + s.key, () => bust({ detail: 1.0, style: 'civil', turn: 0.15, face: s.face })).place(P, mk, 0, 2.32, 0, 0, 1.4);
    P.pop();
    const w = GF.W(s.a, s.b); ctx.physics.addBox(w.x, w.z, 2.0, 2.0, GF.rot + front, 0, 3.3);
    K.svc.monuments.push({ id: s.id, name: 'Бюст: ' + s.who, x: w.x, z: w.z, h: 3.3 });
  }
  void L;
}

// ------------------------------------------------------------------------------------------------ the music pavilion (frame GF: stage a -3.8 .. 3.1, b -47.3 .. -41.8; the rear wall a -6.0 .. 5.4, b -50.3 .. -47.4)
function pavilion(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const yF = HG.pavilionFloor, yE = yF + 3.3, a0 = -3.8, a1 = 3.1, bB = -47.3, bF = -41.8, aw0 = -6.0, aw1 = 5.4, bW = -50.3;
  // base 1.0 m (rusticated granite), the rear wall block, side walls and back wall in grey-blue plaster
  tbox(P, M.granite, a0, a1, 0, yF, bB, bF, 1.1, 1.1, 'b');
  tbox(P, M.pavWall, aw0, aw1, 0, yE + 0.4, bW, bB, 3, 3, 'bf');
  tbox(P, M.pavWall, a0 - 0.0, a0 + 0.35, yF, yE + 0.4, bB, bF, 3, 3, '');
  tbox(P, M.pavWall, a1 - 0.35, a1, yF, yE + 0.4, bB, bF, 3, 3, '');
  P.quad(M.pavWall, [a0 + 0.35, yF, bB + 0.02], [a1 - 0.35, yF, bB + 0.02], [a1 - 0.35, yE + 0.4, bB + 0.02], [a0 + 0.35, yE + 0.4, bB + 0.02], [0, 0, 1], [[0, 0], [2, 0], [2, 1.5], [0, 1.5]]);
  // review fix: the street side (the back wall toward ul. Repina, the face people see from the pavement) was a blank slab: a granite plinth, two flat cream corner pilasters, a dark fascia band under the roof (like the front)
  tbox(P, M.granite, aw0 - 0.1, aw1 + 0.1, 0, 0.9, bW - 0.1, bW + 0.02, 1.1, 1.1, 'bf');
  for (const x of [aw0 + 0.3, aw1 - 0.3]) P.box(M.cream, x - 0.3, x + 0.3, 0.9, yE + 0.4, bW - 0.08, bW + 0.02, 'bf');
  P.box(M.pavFascia, aw0 - 0.25, aw1 + 0.25, yE + 0.0, yE + 0.5, bW - 0.3, bW + 0.0, 'b');
  P.box(M.cream, aw0 - 0.25, aw1 + 0.25, yE - 0.12, yE, bW - 0.34, bW + 0.0, 'b');
  // the stage floor (a wood deck) and six granite steps (risers 0.17 m, cheek blocks), width 1.5 m at a = -0.35
  P.quad(M.deck, [a0 + 0.35, yF + 0.005, bB], [a1 - 0.35, yF + 0.005, bB], [a1 - 0.35, yF + 0.005, bF], [a0 + 0.35, yF + 0.005, bF], [0, 1, 0], [[0, 0], [3, 0], [3, 3], [0, 3]]);
  const sa = -0.35, sw = 1.5, n = 6;
  for (let i = 0; i < n; i++) tbox(P, M.granite, sa - sw / 2, sa + sw / 2, 0, yF * (n - i) / n, bF + i * 0.3, bF + (i + 1) * 0.3, 1.1, 1.1, 'b');
  for (const s of [-1, 1]) tbox(P, M.granite, sa + s * (sw / 2 + 0.12) - 0.12, sa + s * (sw / 2 + 0.12) + 0.12, 0, yF * 0.9, bF, bF + 1.8, 1.1, 1.1, 'b');
  // the front colonnade: four spiral cast-iron columns (collar, barley-twist shaft, small capital) and the lace balustrade between them
  const cols = [a0 + 0.4, -1.3, 0.75, a1 - 0.4], cols2 = [a0 + 0.95, a1 - 0.95];            // four on the front line + the second column of each corner pair, a little behind (photo 81: six)
  const col = (x, z) => {
    P.cyl(M.castIron, [x, yF, z], [x, yF + 0.25, z], 0.12, 0.1, 8, true);
    P.cyl(M.castIron, [x, yF + 0.25, z], [x, yF + 2.83, z], 0.082, 0.082, 10, false);                                 // a straight shaft (a barley-twist drawn as a zigzag of radii looked wobbly) with collars
    for (let i = 0; i <= 6; i++) { const y = yF + 0.3 + i * 0.4; P.cyl(M.castIronLit, [x, y, z], [x, y + 0.07, z], 0.112, 0.112, 10, true); }
    P.cyl(M.castIron, [x, yF + 2.83, z], [x, yE - 0.1, z], 0.1, 0.14, 8, true); P.box(M.castIron, x - 0.18, x + 0.18, yE - 0.12, yE, z - 0.18, z + 0.18, '');
  };
  for (const x of cols) col(x, bF - 0.28);
  for (const x of cols2) col(x, bF - 0.95);
  // two ventilation grilles in the rusticated base beside the steps (photo 81)
  for (const x of [a0 + 1.3, a1 - 1.3]) P.box(M.iron, x - 0.45, x + 0.45, 0.25, 0.7, bF - 0.02, bF + 0.03, 'bk');
  for (let i = 0; i + 1 < cols.length; i++) {
    const x0 = cols[i] + 0.1, x1 = cols[i + 1] - 0.1, z = bF - 0.28, len = x1 - x0;
    if (Math.abs(x0 - (sa - sw / 2)) < 3 && x0 < sa && x1 > sa) { /* the middle bay is open at the steps */ }
    const lo = (x0 < sa + sw / 2 && x1 > sa - sw / 2);
    const seg = (xa, xb) => { if (xb - xa < 0.1) return; P.quad(M.fenceGarden, [xa, yF, z], [xb, yF, z], [xb, yF + 0.92, z], [xa, yF + 0.92, z], [0, 0, 1], [[0, 0.46], [(xb - xa) / 2.6, 0.46], [(xb - xa) / 2.6, 1], [0, 1]]); };
    if (lo) { seg(x0, sa - sw / 2); seg(sa + sw / 2, x1); } else seg(x0, x1);
    void len;
  }
  // the entablature: a deep dark carved fascia, the grey radial soffit, a flat hip roof
  P.box(M.pavFascia, a0 - 0.15, a1 + 0.15, yE, yE + 0.5, bF - 0.45, bF + 0.0, '');
  P.box(M.pavFascia, a0 - 0.15, a0 + 0.0, yE, yE + 0.5, bB, bF, ''); P.box(M.pavFascia, a1, a1 + 0.15, yE, yE + 0.5, bB, bF, '');
  P.quad(M.pavSoffit, [a0 - 0.15, yE - 0.01, bF - 0.45], [a1 + 0.15, yE - 0.01, bF - 0.45], [a1 + 0.15, yE - 0.01, bB], [a0 - 0.15, yE - 0.01, bB], [0, -1, 0], [[0, 0], [3, 0], [3, 3], [0, 3]]);
  const R0 = [[a0 - 0.2, bF - 0.5], [a1 + 0.2, bF - 0.5], [a1 + 0.2, bW], [aw0 - 0.2, bW], [aw0 - 0.2, bB], [a0 - 0.2, bB]];
  P.cap(M.pavRoof, [[aw0 - 0.25, bW - 0.0], [aw1 + 0.25, bW], [aw1 + 0.25, bB], [a1 + 0.25, bB], [a1 + 0.25, bF - 0.5], [a0 - 0.25, bF - 0.5], [a0 - 0.25, bB], [aw0 - 0.25, bB]], yE + 0.5, true, 3);
  void R0;
  // physics: the stage is walkable (steps up to 1.0, a deck), the columns and walls block
  const wc = (a, b) => GF.W(a, b);
  const c = wc(sa, bF + 0.9); ph.addStairs(c.x, c.z, sw, 1.8, GF.rot + Math.PI, 0, yF, n);
  const dc = wc((a0 + a1) / 2, (bB + bF) / 2 + 0.06); ph.addWalkBox(dc.x, dc.z, a1 - a0 - 0.7, bF - bB + 0.12, GF.rot, yF);        // the deck overlaps the top step by 0.06 m (no gap in the floor)
  for (const x of cols) { const p = wc(x, bF - 0.28); ph.addCylinder(p.x, p.z, 0.2, yF, yE); }
  for (const x of cols2) { const p = wc(x, bF - 0.95); ph.addCylinder(p.x, p.z, 0.2, yF, yE); }
  const wb = wc((aw0 + aw1) / 2, (bW + bB) / 2); ph.addBox(wb.x, wb.z, aw1 - aw0, bB - bW, GF.rot, 0, 6);
  for (const x of [a0 + 0.17, a1 - 0.17]) { const p = wc(x, (bB + bF) / 2); ph.addBox(p.x, p.z, 0.35, bF - bB, GF.rot, 0, 6); }
  const bs = wc((a0 + a1) / 2, (bB + bF) / 2); ph.addBox(bs.x, bs.z, a1 - a0, bF - bB, GF.rot, 0, yF - 0.45);          // the solid base (its top stays well under the stage floor so that the stair walker is never clipped by it)
  const m = wc(0, -46); K.svc.monuments.push({ id: 'r3277182', name: 'Румянцевский сад: музыкальный павильон', x: m.x, z: m.z, h: 5.2 });
  K.svc.entrances.push({ id: 'garden-pavilion-stage', x: wc(sa, bF + 0.5).x, z: wc(sa, bF + 0.5).z, rotY: GF.rot + Math.PI, open: true });
}

// ------------------------------------------------------------------------------------------------ the toilet block w216731109 as a plain kiosk
function kiosk(K) {
  const { P, M, ctx } = K, b = L.buildingById('w216731109');
  if (!b || !b.polys || !b.polys[0]) return;
  const o = b.polys[0].o, ring = []; for (let i = 0; i < o.length; i += 2) ring.push([o[i], o[i + 1]]);
  const H = 2.7, cx = ring.reduce((t, r) => t + r[0], 0) / ring.length, cz = ring.reduce((t, r) => t + r[1], 0) / ring.length;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length], dx = q[0] - p[0], dz = q[1] - p[1], len = Math.hypot(dx, dz); if (len < 0.1) continue;
    let nx = dz / len, nz = -dx / len; if (nx * ((p[0] + q[0]) / 2 - cx) + nz * ((p[1] + q[1]) / 2 - cz) < 0) { nx = -nx; nz = -nz; }
    P.quad(M.pavWall, [p[0], 0, p[1]], [q[0], 0, q[1]], [q[0], H, q[1]], [p[0], H, p[1]], [nx, 0, nz], [[0, 0], [len / 3, 0], [len / 3, H / 3], [0, H / 3]]);
    ctx.physics.addBox((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, len + 0.3, 0.5, Math.atan2(-dz, dx), 0, H);
  }
  P.cap(M.pavRoof, ring, H + 0.01, true, 2);
}
