// landmarksUniversity/monuments.js - the three monuments of the University quarter, built with the shared figure kit (lib/figures.js, docs/FIGURES.md):
//   LOMONOSOV (1986, V. Sveshnikov, B. Petrov; OSM n1584459525) on the square between the Academy and the Collegia: the seated bronze scholar, a manuscript on his knee, on a polished red
//     granite pedestal that flares down into a low sloped platform; he looks over the Neva.  Photos refs/university lo_16 (front three-quarter), lo_07 (back), mw_06.  Sizes are
//     estimates (figure 3.3 m, pedestal 3.4 m: dossier section 6).
//   SAKHAROV (2003, L. Lazarev; n703687330) on Sakharov Square north of the Collegia: a stooped slim figure with the hands behind the back on a rough boulder (sa_01).
//   "UNIVERSANTS" (2007) in the forecourt of the main door of the Collegia: a winged genius leaping up from a slim dark column (tc_09, lo_13).
import * as THREE from 'three';
import { human, extend, cached, figureMats, addWing } from '../lib/figures.js';
import { AC, TC, LOMO, SAKHAROV, GENIUS } from './frame.js';

function lomonosovFigure() {
  return cached('lmU-lomonosov', () => extend(human({
    detail: 0.75, body: { muscle: 0.15, bulk: 1.18 },
    pose: {
      pelvis: [0, 0.52, -0.06], pelvisRot: [0.02, 0, 0], spine: [0.03, -0.06, 0], head: [-0.06, -0.22, 0],
      legs: { L: { foot: [0.2, 0, 0.3], yaw: 0.2, pole: [0.15, 0.2, 1] }, R: { foot: [-0.22, 0, 0.46], yaw: -0.15, pole: [-0.15, 0.2, 1] } },
      arms: { L: { hand: [0.25, 0.68, 0.3], pole: [0.7, -0.4, -0.5], grip: 'flat', palm: [0, -1, 0.1] }, R: { hand: [-0.27, 0.68, 0.32], pole: [-0.7, -0.4, -0.5], grip: 'relaxed', palm: [0, -1, 0.1] } },
    },
    outfit: { torso: 'coat', hem: 0.5, flare: 0.3, folds: 0.05, open: 0.5, sleeves: 'long', trousers: 'breeches', boots: false, collar: 'fall', buttons: true },
    face: { age: 0.5, hair: 'long', beard: 'none', brow: 0.7, jaw: 1.2, mouth: 'stern', seed: 1711 },
  }), (S) => {
    S.blob('main', [0.25, 0.64, 0.24], [0.17, 0.02, 0.22], { w: 8, h: 4 });                            // the manuscript on the left knee
    S.blob('main', [0.3, 0.56, 0.4], [0.13, 0.1, 0.03], { w: 6, h: 4 });                               // its hanging sheet
  }));
}
function sakharovFigure() {
  return cached('lmU-sakharov', () => human({
    detail: 0.6, body: { muscle: 0.0, bulk: 0.82, shoulders: 0.9 },
    pose: {
      pelvis: [0, 0.95, 0.0], pelvisRot: [0.04, 0, 0], spine: [0.3, 0, 0], head: [-0.36, 0.1, 0],
      legs: { L: { foot: [0.1, 0, 0.0], yaw: 0.15 }, R: { foot: [-0.1, 0, 0.02], yaw: -0.15 } },
      arms: { L: { hand: [0.08, 0.93, -0.2], pole: [0.8, 0.1, -0.6], grip: 'relaxed', palm: [0, 0, -1] }, R: { hand: [-0.08, 0.95, -0.2], pole: [-0.8, 0.1, -0.6], grip: 'relaxed', palm: [0, 0, -1] } },
    },
    outfit: { torso: 'coat', hem: 0.12, flare: 0.02, sleeves: 'long', trousers: 'long', boots: 0.1, collar: 'fall', buttons: false },
    face: { age: 0.8, hair: 'short', beard: 'none', brow: 0.6, jaw: 0.85, seed: 1921 },
  }));
}
function geniusFigure() {
  return cached('lmU-genius', () => extend(human({
    detail: 0.6, body: { muscle: 0.7, bulk: 0.9 },
    pose: {
      pelvis: [0, 1.0, 0.05], pelvisRot: [-0.25, 0.15, 0.05], spine: [-0.3, 0.1, 0], head: [-0.4, 0.15, 0],
      legs: { L: { foot: [0.04, 0, 0.0], yaw: 0.1 }, R: { foot: [-0.2, 0, -0.5], lift: 0.42, toeUp: -0.7, pole: [-0.2, 0, 1] } },
      arms: { L: { hand: [0.3, 2.12, 0.18], pole: [0.8, 0, -0.4], grip: 'open', palm: [0, 0.3, 1] }, R: { hand: [-0.62, 1.55, -0.2], pole: [-0.6, -0.6, -0.5], grip: 'open', palm: [0, 0, 1] } },
    },
    outfit: { torso: 'nude', sleeves: 'none', trousers: 'none' }, face: { age: 0.2, hair: 'short', beard: 'none', seed: 2007 },
  }), (S) => {
    for (const sd of [1, -1]) addWing(S, { root: [sd * 0.1, 1.5, -0.1], side: sd, pose: 'raised', span: 1.15, key: 'main', boneKey: 'main', tilt: [0.2, 0.9, sd * 0.1] });
  }));
}

/** a frustum with a square plan: half sizes a0 (at y0) and a1 (at y1) */
function frustum(P, mat, a0, a1, y0, y1, top = true) {
  for (let k = 0; k < 4; k++) {
    const c = Math.cos((k * Math.PI) / 2), s = Math.sin((k * Math.PI) / 2), q = (x, z) => [x * c + z * s, 0, -x * s + z * c];
    const A = q(-a0, a0), B = q(a0, a0), C = q(a1, a1), D = q(-a1, a1), sl = Math.hypot(a0 - a1, y1 - y0) || 1, n = q(0, (y1 - y0) / sl);
    P.quad(mat, [A[0], y0, A[2]], [B[0], y0, B[2]], [C[0], y1, C[2]], [D[0], y1, D[2]], [n[0], (a0 - a1) / sl, n[2]]);
  }
  if (top) P.quad(mat, [-a1, y1, a1], [a1, y1, a1], [a1, y1, -a1], [-a1, y1, -a1], [0, 1, 0]);
}

export function monuments(K) {
  const { ctx, P, M } = K, ph = ctx.physics, bz = figureMats(ctx).keys('bronze', 'bronze');
  // ---------------------------------------------------------------------------------------------- Lomonosov
  {
    const rot = AC.rot, cs = Math.cos(rot), sn = Math.sin(rot), W = (x, z) => [LOMO.x + x * cs + z * sn, LOMO.z - x * sn + z * cs];
    P.push(LOMO.x, 0, LOMO.z, rot);
    frustum(P, M.redGranite, 4.5, 2.05, 0.03, 0.55);                                                  // the low sloped platform
    P.box(M.redGraniteDark, -1.75, 1.75, 0.55, 0.85, -1.75, 1.75, 'b');
    frustum(P, M.redGranite, 1.62, 1.26, 0.85, 1.5, false);                                           // the flaring base
    for (let k = 0; k < 4; k++) {                                                                      // the diamond-cut band: four facets a side
      P.push(0, 0, 0, (k * Math.PI) / 2);
      for (let i = 0; i < 4; i++) { const x0 = -1.26 + i * 0.63, x1 = x0 + 0.63, xm = (x0 + x1) / 2; for (const [a, b2, c] of [[[x0, 1.5, 1.26], [x1, 1.5, 1.26], [xm, 1.7, 1.36]], [[x1, 1.5, 1.26], [x1, 1.9, 1.26], [xm, 1.7, 1.36]], [[x1, 1.9, 1.26], [x0, 1.9, 1.26], [xm, 1.7, 1.36]], [[x0, 1.9, 1.26], [x0, 1.5, 1.26], [xm, 1.7, 1.36]]]) P.fan(M.redGraniteDark, [a, b2, c], [0, 0, 1]); }
      P.pop();
    }
    frustum(P, M.redGranite, 1.18, 0.98, 1.9, 3.28);                                                  // the tapering block with the name
    P.box(M.redGraniteDark, -1.05, 1.05, 3.28, 3.4, -1.05, 1.05, 'b');
    const t = ctx.tex.draw(512, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.fillStyle = '#3a2a22'; g.textAlign = 'center'; g.textBaseline = 'middle';
      ctx.tex.fitText(g, 'МИХАИЛ ВАСИЛЬЕВИЧ', w / 2, 86, w - 40, 58, ctx.tex.FONTS.serif, 700); ctx.tex.fitText(g, 'ЛОМОНОСОВ', w / 2, 170, w - 40, 76, ctx.tex.FONTS.serif, 700);
    }, { key: 'lmU-lomo-name' });
    const tm = ctx.mat.toon('#ffffff', { map: t, alphaTest: 0.5, name: 'lmU-lomo-name', paint: 0 }); M.decals.add(tm);
    P.quad(tm, [-0.82, 2.3, 1.14], [0.82, 2.3, 1.14], [0.82, 3.0, 1.03], [-0.82, 3.0, 1.03], [0, 0.15, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.box(bz.main, -0.82, 0.82, 3.4, 4.58, -0.95, 0.42, 'b'); P.box(bz.main, -0.9, 0.9, 3.4, 3.56, -1.02, 0.5, 'b');      // the block he sits on
    lomonosovFigure().place(P, bz, 0, 3.4, 0.0, 0, 2.42);
    P.pop();
    ph.addBox(LOMO.x, LOMO.z, 3.5, 3.5, rot, 0, 7.2);
    for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2, p = W(Math.sin(a) * 3.2, Math.cos(a) * 3.2); ph.addWalkRamp(p[0], p[1], 9, 2.5, rot + a + Math.PI, 0.03, 0.55, 2); }
    K.svc.monuments.push({ id: 'n1584459525', name: 'Памятник М. В. Ломоносову', x: LOMO.x, z: LOMO.z, h: 6.7, r: 4.5 });
    const ps = W(0, 13); K.svc.photoSpots.push({ x: ps[0], z: ps[1], yaw: 0, name: 'Памятник Ломоносову' });
    K.svc.crowd.push({ x: ps[0], z: ps[1], r: 5, name: 'у памятника Ломоносову' });
  }
  // ---------------------------------------------------------------------------------------------- Sakharov on his boulder
  {
    const rot = TC.rot;                                                                              // he faces the square and Mendeleevskaya line (east-north-east, photo sa_01)
    P.push(SAKHAROV.x, 0, SAKHAROV.z, rot);
    const g = new THREE.IcosahedronGeometry(1, 2), pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), n = 1 + 0.1 * Math.sin(x * 5.1 + z * 3.3) + 0.08 * Math.sin(y * 7.3 + x * 2.1) + 0.06 * Math.cos(z * 6.1 - y * 3.7); pa.setXYZ(i, x * n, Math.max(-0.35, y * n), z * n); }
    g.computeVertexNormals(); P.geo(M.boulder, g, 0, 0.42, 0, 0, 0, 0, 1.45, 0.82, 1.05); g.dispose();
    const t = ctx.tex.draw(512, 128, (gg, w, h) => { gg.clearRect(0, 0, w, h); gg.fillStyle = '#4a433f'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; ctx.tex.fitText(gg, 'АКАДЕМИК  А. САХАРОВ', w / 2, h / 2, w - 30, 64, ctx.tex.FONTS.sans, 700); }, { key: 'lmU-sakharov-name' });
    const tm = ctx.mat.toon('#ffffff', { map: t, alphaTest: 0.5, name: 'lmU-sakharov-name', paint: 0 }); M.decals.add(tm);
    P.quad(tm, [-0.75, 0.36, 1.27], [0.75, 0.36, 1.27], [0.75, 0.74, 1.2], [-0.75, 0.74, 1.2], [0, 0.2, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    sakharovFigure().place(P, bz, 0, 1.02, -0.05, 0, 1.6);
    P.pop();
    ph.addCylinder(SAKHAROV.x, SAKHAROV.z, 1.3, 0, 4.2);
    K.svc.monuments.push({ id: 'n703687330', name: 'Памятник А. Д. Сахарову', x: SAKHAROV.x, z: SAKHAROV.z, h: 3.9, r: 1.5 });
  }
  // ---------------------------------------------------------------------------------------------- the "universants" genius on its column
  {
    const rot = TC.rot;
    P.push(GENIUS.x, 0, GENIUS.z, rot);
    P.box(M.iron, -0.85, 0.85, 0, 0.3, -0.85, 0.85, 'b'); P.box(M.iron, -0.6, 0.6, 0.3, 0.5, -0.6, 0.6, 'b');
    P.col(bz.main, 0, 0, 0.5, 0.75, 0.34, 0.26, 12, false); P.col(bz.main, 0, 0, 0.75, 4.6, 0.2, 0.17, 12, false); P.col(bz.main, 0, 0, 4.6, 4.78, 0.2, 0.34, 12, true);
    const t = ctx.tex.draw(512, 64, (gg, w, h) => { gg.clearRect(0, 0, w, h); gg.fillStyle = '#d8b24a'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; ctx.tex.fitText(gg, 'Универсантам посвящается', w / 2, h / 2, w - 20, 44, ctx.tex.FONTS.serif, 600); }, { key: 'lmU-genius-name' });
    const tm = ctx.mat.toon('#ffffff', { map: t, alphaTest: 0.5, name: 'lmU-genius-name', paint: 0, emissive: '#5a4208', emissiveIntensity: 0.3 }); M.decals.add(tm);
    P.quad(tm, [-0.75, 0.07, 0.86], [0.75, 0.07, 0.86], [0.75, 0.25, 0.86], [-0.75, 0.25, 0.86], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    geniusFigure().place(P, bz, 0, 4.78, 0, 0, 1.25);
    P.pop();
    ph.addBox(GENIUS.x, GENIUS.z, 1.7, 1.7, rot, 0, 0.5); ph.addCylinder(GENIUS.x, GENIUS.z, 0.35, 0, 7.2);
    K.svc.monuments.push({ id: 'universants', name: 'Памятник универсантам', x: GENIUS.x, z: GENIUS.z, h: 7.2, r: 1.2 });
  }
}
