// landmarksMining/portico.js - the PORTICO BLOCK of the Mining University (dossier docs/research/mining.md sections 4, 5; photos refs/mining 01 03 04 10 11 12 13 14 16 17 and the critic photos):
// the granite stair of 13 steps (grey, 31.8 m wide) between two ashlar cheeks, the stylobate, twelve fluted conical Doric columns without bases (shaft 7.5 m, three annulets, echinus, abacus), two end antae,
// the plain Doric entablature (architrave, a yellow frieze with 25 white triglyphs, a cornice with mutules and lion mascarons), the pediment with its raking cornice, mutules and the black double-headed
// eagle, the gabled copper roof of the central block, and the GALLERY behind the columns: golden back wall with 11 ground windows / arched windows between 12 fluted pilasters, the door with its plaque,
// white cross beams, 13 hanging lanterns.  Frame P of frame.js (x = u along the front, z = w out to the Neva, y = 0 street).  No flags; the three Soviet frieze discs are NOT drawn (lead decision).
import * as THREE from 'three';
import * as L from '../layout.js';
import { P as FP, HT, COLS, BAYS } from './frame.js';

const Y0 = HT.stair, WB = HT.back;            // stylobate level 1.95, back wall w = -5.5
const SX = 21.8;                              // half width of the entablature / front line

// ------------------------------------------------------------------------------------------------ geometry builders
/** a fluted conical shaft: `seg` radial facets (alternating arris / flute bottom, 16 flutes), a slight entasis, flat shaded, from y = 0 to H */
function flutedShaft(H, r0, r1, seg = 32, rings = 3, depth = 0.07) {
  const pos = [], uv = [], ring = (t) => r0 + (r1 - r0) * t + 0.012 * Math.sin(Math.PI * t);
  const pt = (i, j) => { const t = i / (rings - 1), a = (j % seg) / seg * Math.PI * 2, r = ring(t) * (j % 2 ? 1 - depth : 1); return [Math.cos(a) * r, t * H, Math.sin(a) * r, j / seg * 16, t * H / 2.0]; };
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < seg; j++) {
    const a = pt(i, j), b = pt(i, j + 1), c = pt(i + 1, j), d = pt(i + 1, j + 1);
    for (const v of [a, c, b, b, c, d]) { pos.push(v[0], v[1], v[2]); uv.push(v[3], v[4]); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
/** the Doric capital: three annulets, an echinus (a convex disc), the square abacus is a box added by the caller */
function capitalGeo(y0) {
  const pts = [[0.60, 0], [0.645, 0.03], [0.645, 0.075], [0.615, 0.09], [0.645, 0.115], [0.645, 0.16], [0.615, 0.175], [0.645, 0.2], [0.645, 0.24], [0.69, 0.25], [0.74, 0.29], [0.775, 0.36], [0.785, 0.43], [0.775, 0.48], [0.7, 0.5], [0.0001, 0.5]]
    .map(([r, y]) => new THREE.Vector2(r, y0 + y * 1.3));      // review fix: stretched 1.3 x so that the echinus meets the abacus (it ended 0.15 m below it: a see-through gap above every capital)
  return new THREE.LatheGeometry(pts, 20);
}
const shaftG = flutedShaft(HT.shaftTop - Y0, HT.colFoot, HT.colNeck), capG = capitalGeo(HT.shaftTop), boxG = new THREE.BoxGeometry(1, 1, 1);

/** the double-headed eagle with the imperial crown: a flat black silhouette 8.0 m across and 3.2 m high, origin at the feet (middle), facing +z */
function eagleShape() {
  // right half from the crown (review 2026-10-08: the first outline was a blob, a bat: no heads, no crown; photo 01 shows two heads turned outward with open beaks under a crown, wings spread and arched with
  // scalloped feather fingers, a central shield body, two legs with talons and a tail): crown, head + beak, neck notch, the arched upper wing edge to the tip, six feather fingers, wing root, leg + talon, tail
  const R = [[0, 3.2], [0.14, 3.14], [0.27, 3.2], [0.35, 3.05], [0.36, 2.9],
    [0.55, 2.97], [0.8, 3.03], [1.04, 2.98], [1.2, 2.84], [1.62, 2.7], [1.3, 2.6], [1.18, 2.45], [1.05, 2.3],
    [1.7, 2.34], [2.4, 2.6], [3.1, 2.86], [3.7, 3.04], [4.0, 3.08],
    [3.78, 2.55], [3.7, 2.62], [3.6, 2.1], [3.42, 2.22], [3.28, 1.7], [3.08, 1.86], [2.88, 1.32], [2.68, 1.5], [2.35, 1.02], [2.1, 1.22], [1.65, 0.82],
    [1.3, 0.62], [1.55, 0.2], [1.72, 0.0], [1.35, 0.0], [1.12, 0.3], [0.95, 0.45], [0.8, 0.1], [0.55, 0.0], [0.0, 0.0]];
  const k = 1, s = new THREE.Shape(), L = R.map(([x, y]) => [-x, y]).reverse();
  const all = R.concat(L.slice(1, L.length - 1)).map(([x, y]) => [x * k, y * k]);
  s.moveTo(all[0][0], all[0][1]); for (let i = 1; i < all.length; i++) s.lineTo(all[i][0], all[i][1]); s.closePath();
  return s;
}

export async function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics;
  const trig = ctx.tex.draw(64, 76, (g, w, h) => { g.fillStyle = '#f1eee4'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(95,90,80,0.55)'; for (let i = 0; i < 3; i++) g.fillRect(8 + i * 18, 5, 8, h - 20); g.fillStyle = 'rgba(95,90,80,0.35)'; for (let i = 0; i < 6; i++) g.fillRect(8 + i * 9, h - 12, 3, 8); }, { key: 'lmMin-trig', repeat: [1, 1] });
  const trigM = ctx.mat.toon('#ffffff', { map: trig, name: 'lmMin-trigM', paint: 0.03 });
  const label = ctx.services.labels;
  P.push(FP.x, 0, FP.z, FP.rot);
  const step = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMining/portico] ${name}:`, e); } };
  try {
    // ------------------------------------------------------------------------------------------ stair: 13 steps, grey granite (riser 0.15, tread 0.48) from w 6.6 to the stylobate
    step('stair', () => {
      const u0 = -15.9, u1 = 15.9;
      for (let k = 0; k < HT.nSteps; k++) {
        const wF = HT.stairW1 - HT.tread * k, wB = wF - HT.tread, y0 = HT.riser * k, y1 = HT.riser * (k + 1);
        P.quad(M.riser, [u0, y0, wF], [u1, y0, wF], [u1, y1, wF], [u0, y1, wF], [0, 0, 1], [[u0 / 1.6, y0 / 1.6], [u1 / 1.6, y0 / 1.6], [u1 / 1.6, y1 / 1.6], [u0 / 1.6, y1 / 1.6]]);
        P.quad(M.tread, [u0, y1, wF + 0.02], [u1, y1, wF + 0.02], [u1, y1, wB], [u0, y1, wB], [0, 1, 0], [[u0 / 1.6, wF / 1.6], [u1 / 1.6, wF / 1.6], [u1 / 1.6, wB / 1.6], [u0 / 1.6, wB / 1.6]]);
      }
    });
    // ------------------------------------------------------------------------------------------ cheeks (ashlar, dark granite coping) and the stylobate
    step('cheeks', () => {
      for (const s of [-1, 1]) {
        const a = s > 0 ? 15.9 : -21.9, b = s > 0 ? 21.9 : -15.9;
        P.box(M.cheek, a, b, 0, 1.75, 0.36, 6.6, 'bt', 1.6);
        const ca = s > 0 ? 15.9 : -22.0, cb = s > 0 ? 22.0 : -15.9;
        P.box(M.coping, ca, cb, 1.75, 1.95, 0.36, 6.7, 'b', 1.6);
      }
    });
    step('stylobate', () => {
      P.quad(M.stylobate, [-SX, Y0, 0.36], [SX, Y0, 0.36], [SX, Y0, WB], [-SX, Y0, WB], [0, 1, 0], [[-SX / 1.8, 0.2], [SX / 1.8, 0.2], [SX / 1.8, WB / 1.8], [-SX / 1.8, WB / 1.8]]);
    });
    // ------------------------------------------------------------------------------------------ the twelve columns and the antae
    step('columns', () => {
      for (const u of COLS) {
        P.geo(M.flute1, shaftG, u, Y0, HT.colW);
        P.geo(M.white, capG, u, 0, HT.colW);
        P.box(M.white, u - 0.85, u + 0.85, 10.1, HT.colTop, HT.colW - 0.85, HT.colW + 0.85, 'b');
      }
      for (const s of [-1, 1]) {                                           // the antae: fluted piers at the front ends of the gallery side walls
        const a = s > 0 ? 20.95 : -21.8, b = s > 0 ? 21.8 : -20.95;
        P.box(M.flutes, a, b, Y0, 10.1, -1.05, -0.1, 'tb', 0.9);
        P.box(M.white, a - 0.12, b + 0.12, 10.1, HT.colTop, -1.17, -0.0, 'b');
      }
    });
    // ------------------------------------------------------------------------------------------ the gallery: back wall (11 bays + 2 end strips), door, pilasters, ceiling, beams, lanterns
    step('gallery', () => {
      const y1 = HT.ceil + 0.15, h = y1 - Y0;                              // wall up to the ceiling (10.45): the tile is 8.35 tall, the top 0.15 is stretched
      for (const c of BAYS) {
        const x0 = c - 1.7725, x1 = c + 1.7725, mat = Math.abs(c) < 0.01 ? M.galleryDoor : M.galleryWin;
        P.quad(mat, [x0, Y0, WB], [x1, Y0, WB], [x1, y1, WB], [x0, y1, WB], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      }
      for (const s of [-1, 1]) { const x0 = s > 0 ? 19.5 : -SX, x1 = s > 0 ? SX : -19.5; P.quad(M.galleryEnd, [x0, Y0, WB], [x1, Y0, WB], [x1, y1, WB], [x0, y1, WB], [0, 0, 1], [[0, 0], [(x1 - x0) / 3.545, 0], [(x1 - x0) / 3.545, 1], [0, 1]]); }
      void h;
      // the 12 fluted pilasters behind the columns (capital top +9.3, shaft 6.95 m)
      for (const u of COLS) {
        P.box(M.flutes, u - 0.45, u + 0.45, Y0, 8.9, WB, WB + 0.45, 'bt', 0.9);
        P.box(M.white, u - 0.55, u + 0.55, 8.9, 9.3, WB, WB + 0.62, 'b');
      }
      // door: leaf pair 1.75 x 2.9 proud of the wall, white architrave, a plaque over it
      P.box(M.door, -0.875, 0.875, Y0, 4.85, WB, WB + 0.1, 'kb');
      P.quad(M.door, [-0.875, Y0, WB + 0.101], [0.875, Y0, WB + 0.101], [0.875, 4.85, WB + 0.101], [-0.875, 4.85, WB + 0.101], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.box(M.white, -1.05, -0.875, Y0, 5.0, WB, WB + 0.16, 'kb'); P.box(M.white, 0.875, 1.05, Y0, 5.0, WB, WB + 0.16, 'kb'); P.box(M.white, -1.05, 1.05, 4.85, 5.0, WB, WB + 0.16, 'kb');
      const plaqueTex = ctx.tex.draw(512, 128, (g, w, hh) => {
        g.clearRect(0, 0, w, hh); g.fillStyle = '#6d5a38'; g.textAlign = 'center'; g.textBaseline = 'middle';
        ctx.tex.fitText(g, 'САНКТ-ПЕТЕРБУРГСКИЙ', w / 2, hh * 0.3, w - 12, 50, ctx.tex.FONTS.serif, 700); ctx.tex.fitText(g, 'ГОРНЫЙ УНИВЕРСИТЕТ', w / 2, hh * 0.72, w - 12, 50, ctx.tex.FONTS.serif, 700);
      }, { key: 'lmMin-doorPlaque' });
      const plaqueM = ctx.mat.toon('#ffffff', { map: plaqueTex, name: 'lmMin-doorPlaque', paint: 0, alphaTest: 0.5, polygonOffset: -2 });
      const pw = FP.W(0, WB + 0.02);
      if (!label || label.reserve('mining-door', pw.x, 5.2, pw.z, 2.3, 0.6, FP.B[0], FP.B[1], 'plate-landmark')) {
        P.quad(plaqueM, [-1.15, 4.95, WB + 0.025], [1.15, 4.95, WB + 0.025], [1.15, 5.45, WB + 0.025], [-1.15, 5.45, WB + 0.025], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        K.M.cutouts.add(plaqueM); K.M.decals.add(plaqueM);
      }
      // the ceiling (soffit) between white cross beams: one beam per column axis from the capital to the wall
      P.quad(M.ceil, [-SX, HT.colTop, WB], [SX, HT.colTop, WB], [SX, HT.colTop, 0], [-SX, HT.colTop, 0], [0, -1, 0], [[0, 0], [10, 0], [10, 2], [0, 2]]);
      for (const u of COLS) P.box(M.white, u - 0.25, u + 0.25, 10.0, HT.colTop, WB, HT.colW, 't');
      // 13 hanging lanterns: a chain 0.5 m, a hexagonal body 0.45 x 0.8 m, a pointed cap
      const lampsU = BAYS.concat([-20.65, 20.65]);
      for (const u of lampsU) {
        P.cyl(M.iron, [u, HT.colTop, -2.7], [u, 9.95, -2.7], 0.015, 0.015, 4, false);
        P.cyl(M.lanternGlass, [u, 9.12, -2.7], [u, 9.88, -2.7], 0.22, 0.2, 6, true);
        P.cyl(M.iron, [u, 9.88, -2.7], [u, 10.1, -2.7], 0.26, 0.04, 6, true); P.cyl(M.iron, [u, 9.04, -2.7], [u, 9.12, -2.7], 0.16, 0.16, 6, true);
      }
      // the two gallery end walls (both faces): granite plinth to the stylobate, plaster above up to the frieze
      // review fix: the OUTER face of the west end wall runs back to the west link front (w -6.5: ring vertex 19), the east one to -5.5 (the east link front is at -4.5); the plaster reaches the cornice bed (13.35):
      // before, a 1 m wide slit (w -5.5 .. -6.5) and a 0.55 m strip under the cornice showed the sky / the far link from the west and the east
      for (const [x, z0, z1, s, zo] of [[21.75, -5.5, 0, 1, -5.5], [-21.9, -5.5, 0, -1, -6.6]]) {
        P.quad(M.plinth, [x, 0, z1], [x, 0, zo], [x, Y0, zo], [x, Y0, z1], [s, 0, 0]);
        P.quad(M.plaster, [x, Y0, z1], [x, Y0, zo], [x, 13.35, zo], [x, 13.35, z1], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        P.quad(M.backWall, [x, Y0, z0], [x, Y0, z1], [x, 10.45, z1], [x, 10.45, z0], [-s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      }
    });
    // ------------------------------------------------------------------------------------------ the entablature: architrave, frieze with 25 triglyphs, cornice with mutules and mascarons
    step('entablature', () => {
      P.box(M.white, -SX, SX, HT.colTop, HT.archTop, -1.2, 0.0, 'b', 3);
      P.quad(M.plaster, [-SX, HT.archTop, 0.0], [SX, HT.archTop, 0.0], [SX, HT.friezeTop, 0.0], [-SX, HT.friezeTop, 0.0], [0, 0, 1], [[0, 0], [10, 0], [10, 1], [0, 1]]);
      const tu = []; for (let k = -12; k <= 12; k++) tu.push(k * 1.7725 * (Math.abs(k) === 12 ? 0.9985 : 1));
      for (const u of tu) P.box(trigM, u - 0.5, u + 0.5, 11.65, 12.7, 0.0, 0.09, 'kb', 1);
      P.box(M.white, -SX, SX, HT.friezeTop, 13.35, 0.0, 0.12, 'k', 3);
      P.box(M.white, -SX - 0.65, SX + 0.65, 13.35, 13.85, 0.0, 0.65, 'k', 3);
      P.box(M.white, -SX - 0.7, SX + 0.7, 13.85, HT.corniceTop, 0.0, 0.72, 'k', 3);
      for (const u of tu) P.box(M.white, u - 0.375, u + 0.375, 13.0, 13.35, 0.1, 0.6, 'kt', 1);                 // mutules (pitch 1.77 m)
      for (let k = -5; k <= 5; k++) P.geo(M.white, new THREE.SphereGeometry(1, 6, 4), k * 3.545, 14.07, 0.45, 0, 0, 0, 0.17, 0.2, 0.12);   // lion mascarons on the crown band (one per bay)
      for (const s of [-1, 1]) {                                          // side returns: bed, corona, crown along the central block
        const a = s > 0 ? SX : -SX - 0.65, b = s > 0 ? SX + 0.65 : -SX;
        P.box(M.white, a, b, 13.35, 13.85, -25, 0.0, 'fb', 3); P.box(M.white, s > 0 ? SX : -SX - 0.7, s > 0 ? SX + 0.7 : -SX, 13.85, HT.corniceTop, -25, 0.0, 'f', 3);
        P.quad(M.plaster, [s * (SX + 0.001), 9.0, -4.7], [s * (SX + 0.001), 9.0, -25], [s * (SX + 0.001), 13.35, -25], [s * (SX + 0.001), 13.35, -4.7], [s, 0, 0], [[0, 0], [5, 0], [5, 1], [0, 1]]);
      }
    });
    // ------------------------------------------------------------------------------------------ pediment: tympanum, raking cornice (+ mutules), eagle
    step('pediment', () => {
      const yb = HT.corniceTop, yt = HT.tymp;
      P.fan(M.plaster, [[-SX + 0.2, yb, -0.5], [SX - 0.2, yb, -0.5], [0, yt, -0.5]], [0, 0, 1], (p) => [p[0] / 3, p[1] / 3]);
      const sl = (yt - yb) / SX;                                          // 0.2248 (12.7 deg)
      for (const s of [1, -1]) {
        const sh = new THREE.Shape(); const E = SX + 0.55;
        const pts = [[0, yt], [0, yt + 0.9], [E, yt + 0.9 - sl * E], [E, yt - sl * E]].map(([x, y]) => [x * s, y]);
        if (s < 0) pts.reverse();
        sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); sh.closePath();
        P.extrude(M.white, sh, -0.5, 1.15, 3);
        const ang = Math.atan(sl), len = E / Math.cos(ang);
        for (let t = 0.9; t < len - 0.4; t += 1.7725) {                    // mutules under the raking cornice
          const x = s * t * Math.cos(ang), y = yt - sl * Math.abs(x) - 0.14;
          P.geo(M.white, boxG, x, y, 0.22, 0, 0, -s * ang, 0.75, 0.3, 0.6);
        }
      }
      // the eagle: black bronze silhouette 8 x 3.2 m, 0.35 thick, standing on the cornice line in the middle of the tympanum
      const es = eagleShape();
      P.push(0, yb + 0.02, -0.3, 0); P.extrude(M.eagle, es, 0, 0.35, 3, 4); P.pop();
      P.box(M.eagle, -1.1, 1.1, yb, yb + 0.12, -0.35, 0.1, 'b', 3);
    });
    // ------------------------------------------------------------------------------------------ the gabled copper roof of the central block (ridge along w, to the rear gable)
    step('roof', () => {
      const E = SX + 0.65, yE = 14.2, yR = 19.1, zF = -0.55, zB = -25;
      const n = [0.2205, 1, 0];
      for (const s of [1, -1]) {
        P.quad(M.roof, [s * E, yE, zF], [s * E, yE, zB], [0, yR, zB], [0, yR, zF], [s * 0.2205 / 1.0, 1, 0], [[0, 0], [(zF - zB) / 0.6, 0], [(zF - zB) / 0.6, 6], [0, 6]]);
      }
      void n;
      P.fan(M.plaster, [[-SX, 14.0, zB], [SX, 14.0, zB], [0, yR - 0.1, zB]], [0, 0, -1], (p) => [p[0] / 3, p[1] / 3]);
      P.box(M.roofRidge, -0.12, 0.12, yR - 0.02, yR + 0.1, zB, zF, 'b');
    });
    // ------------------------------------------------------------------------------------------ colliders
    step('colliders', () => {
      FP.walk(ph, 0, -2.57, 2 * SX, 5.86, 0, Y0, 0);                                           // the stylobate / gallery floor
      FP.stairs(ph, 0, 3.48, 31.8, 6.24, Math.PI, 0, Y0, HT.nSteps);                           // 13 steps, rising toward -w
      for (const s of [-1, 1]) FP.box(ph, s * 18.9, 3.48, 6.0, 6.24, 0, -1, Y0);                // the cheeks
      for (const u of COLS) FP.cyl(ph, u, HT.colW, 0.8, Y0 - 0.5, 14);                         // the columns
      FP.box(ph, 0, -5.55, 2 * SX + 0.4, 0.9, 0, 0, 14);                                       // the back wall with the pilasters and the (closed) door
      for (const s of [-1, 1]) FP.box(ph, s * 21.4, -0.6, 0.9, 1.0, 0, 0, 14);                // the antae
    });
    // ------------------------------------------------------------------------------------------ services
    const door = FP.W(-0.8, WB + 0.3), cd = FP.W(0, 4.0);
    svc.entrances.push({ x: door.x, z: door.z, rotY: FP.rot, name: 'Главный вход Горного университета', closed: true });
    svc.crowd.push({ x: cd.x, z: cd.z, r: 9, n: 8, kind: 'stair', y: 1.0, name: 'Лестница Горного университета' });
    const gal = FP.W(0, -2.6); svc.crowd.push({ x: gal.x, z: gal.z, r: 11, n: 5, kind: 'colonnade', y: Y0, name: 'Колоннада' });
    const sp = (name, u, w, tu, tw, y = 0, pitch = 3) => { const p = FP.W(u, w), t = FP.W(tu, tw); svc.photoSpots.push({ name, x: p.x, z: p.z, yaw: L.yawToward(p.x, p.z, t.x, t.z), pitch, y }); };
    sp('Горный университет: у подножия лестницы', -2.4, 7.6, 0, -12, 0, 3);
    sp('Горный университет: колоннада', 11.8, -2.6, -6, -1, Y0, 0);
  } finally { P.pop(); }
}
