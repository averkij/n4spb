// landmarksStrelka/customs.js - the Customs house on Makarova embankment 4 (Таможня, I. F. Luchini 1829-32; since 1927 the Institute of Russian Literature "Pushkin House"):
// docs/research/strelka.md 2.6, photos refs/strelka cu_11 cu_12 cu_02 cu_03 cu_04 aer_03 q_03.
//   the three-storey cream block on the OSM footprint w28566721 (rusticated ground floor with round-headed grilled windows, two storeys of plain windows, cornice 16.6 m, red hipped roof);
//   the PORTICO on the centre projection: eight white Ionic columns standing on the ground-floor arcade (terrace at 6.2 m with a balustrade), entablature, pediment with an oculus among trophies,
//   three green copper statues (Mercury on the apex, Ceres and Neptune on the corners: statues.js); the round DRUM (d 12.2 m, twelve windows) with the red-brown DOME and a spire (top ~39 m);
//   the bronze bust of Pushkin (I. N. Schroeder, 1999 copy) on its granite pedestal in front of the door, two plaques.  No flag on the spire (user rule).
import * as THREE from 'three';
import * as L from '../layout.js';
import { onEdge } from './kit.js';
import { shellWalls, shellCornice, shellRoof, shellColliders, edgeNear } from './facade.js';
import { lathe } from './prims.js';
import { customsStatue } from './statues.js';
import { bust, cached, figureMats } from '../lib/figures.js';

const ID = 'w28566721', EAVE = 16.6, TEXH = 16.6, YT = 6.2;
const PORTICO = [-2805.0, -1400.6, -2779.8, -1392.4], RET_W = [-2806.1, -1397.3, -2805.0, -1400.6], RET_E = [-2779.8, -1392.4, -2780.9, -1389.1];
const DOME = { x: -2797.4, z: -1380.9, r: 6.1 }, BUST = { x: -2789.9, z: -1402.3 };

export function customs(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  const b = L.buildingById ? L.buildingById(ID) : null; if (!b || !b.polys || !b.polys.length) { console.warn('[landmarksStrelka] Customs house footprint missing'); return; }
  const poly = b.polys[0], stat = { main: M.statue, dark: M.statueDark, accent: M.statue };
  const isRet = (e) => edgeNear([e], ...RET_W) || edgeNear([e], ...RET_E), isPort = (e) => edgeNear([e], ...PORTICO);
  const edges = shellWalls(P, poly, { mat: M.cuBay, plain: M.customs, bayW: 4.4, texH: TEXH, eave: EAVE, skip: (e) => isRet(e) || isPort(e) });
  for (const e of edges) if (isRet(e)) onEdge(P, e, (len) => P.quad(M.cuBay, [0, 0, 0], [len, 0, 0], [len, YT, 0], [0, YT, 0], [0, 0, 1], [[0.02, 0], [0.12, 0], [0.12, YT / TEXH], [0.02, YT / TEXH]]));
  const pe = edges.find(isPort);
  if (pe) onEdge(P, pe, (len, f) => {
    const n = 7, v = YT / TEXH, D = 3.5;
    // ground-floor arcade of the projection, the terrace on it, the recessed upper wall
    P.quad(M.cuBay, [0, 0, 0], [len, 0, 0], [len, YT, 0], [0, YT, 0], [0, 0, 1], [[0, 0], [n, 0], [n, v], [0, v]]);
    P.quad(M.cuBay, [0, YT, -D], [len, YT, -D], [len, EAVE, -D], [0, EAVE, -D], [0, 0, 1], [[0, v], [n, v], [n, 1], [0, 1]]);
    P.quad(M.granitePlain, [0, YT, 0], [len, YT, 0], [len, YT, -D], [0, YT, -D], [0, 1, 0]);
    for (const x of [0, len]) P.quad(M.customs, [x, YT, -D], [x, YT, 0], [x, EAVE, 0], [x, EAVE, -D], [x ? 1 : -1, 0, 0]);
    // the door in the second bay from the left, with the two plaques (cu_02)
    const bw = len / n, dx = 1.5 * bw;
    P.box(M.white, dx - 1.0, dx + 1.0, 0.5, 4.75, 0, 0.07, 'kb'); P.box(M.door, dx - 0.82, dx + 0.82, 0.5, 3.5, 0.07, 0.1, 'kb'); P.box(M.glass, dx - 0.82, dx + 0.82, 3.6, 4.6, 0.07, 0.09, 'kb'); P.box(M.granitePlain, dx - 1.3, dx + 1.3, 0, 0.5, 0, 0.9, 'kb');
    plaques(K, f, pe, dx, bw);
    // balustrade between the column bases
    P.box(M.white, 0.1, len - 0.1, YT + 0.82, YT + 0.95, -0.42, -0.2, ''); P.box(M.white, 0.1, len - 0.1, YT, YT + 0.12, -0.42, -0.2, 'b');
    for (let x = 0.3; x < len - 0.2; x += 0.42) P.box(M.white, x - 0.06, x + 0.06, YT + 0.12, YT + 0.82, -0.36, -0.26, 'tb');
    // eight Ionic columns
    const yc = 15.2;
    for (let k = 0; k < 8; k++) {
      const x = 1.15 + k * (len - 2.3) / 7, z = -0.85;
      P.box(M.white, x - 0.8, x + 0.8, YT, YT + 0.3, z - 0.8, z + 0.8, 'b'); P.cyl(M.white, [x, YT + 0.3, z], [x, YT + 0.5, z], 0.74, 0.66, 14, false);
      P.cyl(M.white, [x, YT + 0.5, z], [x, yc - 0.55, z], 0.64, 0.55, 14, false);
      for (const s of [1, -1]) P.cyl(M.white, [x + s * 0.62, yc - 0.36, z - 0.62], [x + s * 0.62, yc - 0.36, z + 0.62], 0.22, 0.22, 8, true);
      P.box(M.white, x - 0.72, x + 0.72, yc - 0.55, yc - 0.2, z - 0.6, z + 0.6, ''); P.box(M.white, x - 0.82, x + 0.82, yc - 0.2, yc, z - 0.82, z + 0.82, '');
    }
    // entablature, ceiling, pediment (tympanum with the oculus), raking cornices, the portico roof running back to the main roof
    P.box(M.white, -0.15, len + 0.15, yc, EAVE - 0.3, -1.75, 0.05, 't'); P.quad(M.soffit, [0, yc + 0.02, -D], [len, yc + 0.02, -D], [len, yc + 0.02, -1.75], [0, yc + 0.02, -1.75], [0, -1, 0]);
    P.box(M.white, -0.7, len + 0.7, EAVE - 0.3, EAVE + 0.15, -2.0, 0.6, 'b');
    const ya = EAVE + 0.15, apex = ya + 3.5, mid = len / 2, x0 = -0.7, x1 = len + 0.7;
    P.fan(tympanum(ctx), [[x0, ya, 0.1], [x1, ya, 0.1], [mid, apex, 0.1]], [0, 0, 1], (p) => [(p[0] - x0) / (x1 - x0), (p[1] - ya) / (apex - ya)]);
    for (const s of [1, -1]) {
      const xe = s > 0 ? x1 : x0, nx = -s * 3.5 / 14, top = [mid, apex + 0.32, 0.62], eav = [xe + s * 0.1, ya + 0.3, 0.62];
      P.quad(M.white, [xe, ya, 0.6], [mid, apex, 0.6], [mid, apex + 0.3, 0.6], [xe, ya + 0.3, 0.6], [0, 0, 1]);
      P.quad(M.dent, [xe, ya, 0.1], [mid, apex, 0.1], [mid, apex, 0.6], [xe, ya, 0.6], [0, -1, 0], [[0, 0], [14, 0], [14, 0.5], [0, 0.5]]);
      P.quad(M.roofRed, eav, top, [mid, apex + 0.32, -9.5], [xe + s * 0.1, ya + 0.3, -9.5], [nx, 1, 0], [[0, 0], [24, 0], [24, 16], [0, 16]]);
    }
    // statues: Mercury on the apex, Ceres on the left corner, Neptune on the right one (cu_11); 3.2 m
    P.box(M.customs, mid - 0.45, mid + 0.45, apex + 0.1, apex + 0.75, -0.6, 0.3, 'b'); customsStatue(0).place(P, stat, mid, apex + 0.75, -0.15, 0, 1.85);
    P.box(M.customs, x0 + 0.1, x0 + 1.0, ya + 0.2, ya + 0.75, -0.6, 0.3, 'b'); customsStatue(2).place(P, stat, x0 + 0.55, ya + 0.75, -0.15, 0.25, 1.75);
    P.box(M.customs, x1 - 1.0, x1 - 0.1, ya + 0.2, ya + 0.75, -0.6, 0.3, 'b'); customsStatue(1).place(P, stat, x1 - 0.55, ya + 0.75, -0.15, -0.25, 1.75);
  });
  shellCornice(P, poly, EAVE, M);
  shellRoof(P, poly, EAVE, M.roofRed, { chimney: M.customs, cap: M.whiteShade });
  shellColliders(ctx, poly, EAVE + 3);

  // ---------------------------------------------------------------------------------------------- drum, dome, spire
  const { x, z, r } = DOME;
  lathe(P, M.customs, x, z, [[r, EAVE], [r, 20.2], [r + 0.5, 20.3], [r + 0.5, 20.5], [r, 20.6], [r, 27.6], [r + 0.25, 27.7], [r + 0.45, 28.1], [r + 0.45, 28.4]], 28);
  for (let k = 0; k < 12; k++) {
    const a = (k + 0.5) / 12 * Math.PI * 2;
    P.push(x + Math.sin(a) * (r + 0.02), 0, z + Math.cos(a) * (r + 0.02), a);
    P.box(M.white, -0.85, 0.85, 21.3, 26.2, 0, 0.07, 'kb'); P.box(M.glass, -0.62, 0.62, 21.55, 25.95, 0.07, 0.09, 'kb'); P.box(M.white, -0.04, 0.04, 21.55, 25.95, 0.09, 0.11, 'kb'); P.box(M.white, -0.62, 0.62, 23.7, 23.78, 0.09, 0.11, 'kb');
    P.pop();
  }
  // the iron railing of the gallery round the foot of the drum (cu_04)
  lathe(P, M.iron, x, z, [[r + 0.48, 20.5], [r + 0.48, 21.4]], 28); lathe(P, M.customs, x, z, [[r + 0.46, 20.5], [r + 0.46, 21.38]], 28);
  lathe(P, M.dome, x, z, [[r + 0.45, 28.4], [r + 0.2, 29.3], [r - 0.2, 30.4], [r - 1.0, 31.6], [r - 2.1, 32.6], [r - 3.4, 33.35], [r - 4.8, 33.8], [0.9, 33.95]], 28, 14);
  lathe(P, M.customs, x, z, [[0.95, 33.9], [0.95, 34.5], [1.1, 34.55], [1.1, 34.65], [0.2, 34.7]], 12);
  lathe(P, M.iron, x, z, [[0.12, 34.65], [0.07, 37.4], [0.01, 39.2]], 6); lathe(P, M.iron, x, z, [[1.08, 34.65], [1.08, 35.3]], 12);
  P.geo(M.iron, new THREE.SphereGeometry(0.2, 8, 6), x, 37.5, z);

  // ---------------------------------------------------------------------------------------------- the bust of Pushkin
  const ne = pe ? pe.n : [0.31, -0.951], rot = Math.atan2(ne[0], ne[1]);
  P.push(BUST.x, 0, BUST.z, rot);
  P.box(M.granitePlain, -1.3, 1.3, 0, 0.28, -1.3, 1.3, 'b'); P.box(M.granitePlain, -0.85, 0.85, 0.28, 0.85, -0.85, 0.85, 'b'); P.box(M.granitePlain, -0.62, 0.62, 0.85, 3.0, -0.62, 0.62, 'b'); P.box(M.granitePlain, -0.74, 0.74, 3.0, 3.2, -0.74, 0.74, '');
  P.box(M.bronze, -0.36, 0.36, 3.2, 3.48, -0.3, 0.3, 'b');
  const fm = figureMats(ctx).keys ? figureMats(ctx).keys('bronze') : { main: M.bronze, dark: M.iron, accent: M.bronze };
  cached('lmSt-pushkin', () => bust({ style: 'civil', detail: 0.8, turn: 0.2, face: { age: 0.3, hair: 'curly', beard: 'sideburns', seed: 77 } })).place(P, fm, 0, 3.48, 0, 0, 1.55);
  P.pop();
  ph.addBox(BUST.x, BUST.z, 2.6, 2.6, rot, 0, 0.3); ph.addBox(BUST.x, BUST.z, 1.5, 1.5, rot, 0, 4.6);
  K.svc.monuments.push({ id: 'pushkin-bust', name: 'Бюст А. С. Пушкина', x: BUST.x, z: BUST.z, h: 4.6, r: 1.3 }, { id: 'customs-house', name: 'Таможня (Пушкинский Дом)', x: b.cx, z: b.cz, h: 39, r: 0 });
  K.svc.entrances.push({ x: BUST.x + ne[0] * -4, z: BUST.z + ne[1] * -4, rotY: rot, name: 'Пушкинский Дом', closed: true });
  K.svc.photoSpots.push({ x: BUST.x + ne[0] * 22, z: BUST.z + ne[1] * 22, yaw: 0, name: 'Пушкинский Дом' });
}

function tympanum(ctx) {
  const t = ctx.tex.draw(512, 128, (g, w, h) => {
    g.fillStyle = '#ece0c2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f4efe2'; g.beginPath(); g.arc(256, 74, 30, 0, 6.3); g.fill(); g.fillStyle = '#3c4a56'; g.beginPath(); g.arc(256, 74, 19, 0, 6.3); g.fill(); g.fillStyle = '#f4efe2'; g.fillRect(254, 55, 4, 38); g.fillRect(237, 72, 38, 4);
    // trophies: sprays of leaves, anchors and cornucopias on both sides of the oculus
    g.strokeStyle = '#f7f3e8'; g.lineCap = 'round';
    for (const s of [1, -1]) for (let k = 0; k < 9; k++) { const x = 256 + s * (44 + k * 15), y = 104 - k * 3.2; g.lineWidth = 7 - k * 0.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + s * 10, y - 14 - (k % 3) * 5, x + s * 20, y - 4); g.stroke(); }
  }, { key: 'lmSt-tympanum' });
  return ctx.mat.toon('#ffffff', { map: t, name: 'lmSt-tympanum', paint: 0.02 });
}

/** two dark plaques beside the door with the real names of the house (labels registry: skipped when the place is taken) */
function plaques(K, f, e, dx, bw) {
  const { ctx, P, M } = K, labels = ctx.services.labels;
  const mk = (lines, key) => ctx.mat.toon('#ffffff', { name: key, paint: 0.01, map: ctx.tex.draw(256, 192, (g, w, h) => {
    g.fillStyle = '#23262a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a7a4a'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#d9c88a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((t, i) => ctx.tex.fitText(g, t, w / 2, 40 + i * (h - 70) / Math.max(1, lines.length - 1), w - 36, i === lines.length - 1 ? 24 : 19, ctx.tex.FONTS.serif, 700));
  }, { key }) });
  const list = [[dx - bw * 0.62, ['РОССИЙСКАЯ АКАДЕМИЯ НАУК', 'ИНСТИТУТ', 'РУССКОЙ ЛИТЕРАТУРЫ', 'ПУШКИНСКИЙ ДОМ'], 'lmSt-plaque1'], [dx + bw * 0.62, ['РОССИЙСКАЯ АКАДЕМИЯ НАУК', 'ЛИТЕРАТУРНЫЙ', 'МУЗЕЙ', 'ПУШКИНСКОГО ДОМА'], 'lmSt-plaque2']];
  for (const [x, lines, key] of list) {
    const wx = f.x + f.xa[0] * x + e.n[0] * 0.05, wz = f.z + f.xa[1] * x + e.n[1] * 0.05;
    if (labels && !labels.reserve(ID, wx, 2.5, wz, 0.95, 0.7, e.n[0], e.n[1], 'plate-landmark')) continue;
    P.box(M.iron, x - 0.475, x + 0.475, 2.15, 2.85, 0, 0.04, 'kb'); P.quad(mk(lines, key), [x - 0.45, 2.17, 0.045], [x + 0.45, 2.17, 0.045], [x + 0.45, 2.83, 0.045], [x - 0.45, 2.83, 0.045], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
}
