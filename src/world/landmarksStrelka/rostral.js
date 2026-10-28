// landmarksStrelka/rostral.js - the two Rostral columns (Thomas de Thomon, 1805-10; 32 m): docs/research/strelka.md 2.3, photos refs/strelka rc_02 rc_05 rc_09 fig_01 fig_02 fig_12 fig_14 q_14.
// A column in its own frame (= the ensemble frame moved to the column centre: +z along the axis of the Exchange, +x toward the Malaya Neva):
//   the round granite island R 12.25 with 24 bollards and chains (the monument is fenced off: one cylinder collider); the stepped granite base 10.4 m, the figure pedestals on the +-x sides with the
//   seated river gods (statues.js), the iron doors under small pedimented blocks on the +-z sides; the cubic pedestal 6.1 m to y 6.0 with the two NAIAD prows on its +-z faces;
//   the vermilion shaft 6.8 .. 26.2 (d 3.9 -> 3.4) with the prow pairs at 13.3 (+-x), 17.1 (+-z), 24.3 (+-x) and the anchors between them; the dark green echinus and platform 6.6 m with a black
//   railing, the red drum, the tripod and the bowl (no flame: user rule and reality by day).  Top 31.96.
// Figures: north column +x Dnieper, -x Volga; south column +x Volkhov, -x Neva (rc_05, rc_02).
import * as THREE from 'three';
import { ROT, W, COL_N, COL_S, boxAt } from './frame.js';
import { lathe, plate, wall, vquad, vpoly, arcFlat, arcWall, pol, gbox } from './prims.js';
import { partsGeos } from './inst.js';
import { prow, anchor } from './prows.js';
import { riverGod } from './statues.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { knockBays } from '../lib/fence-bays.js';            // n4spb (docs/AREAS.md 13.7, docs/vo-m1.md): the bollards are knock records, the chains between them breakable bays
import { knockFurniture } from '../lib/knock-furniture.js';

const R_ISLAND = 12.25, R_CHAIN = 11.7, N_BOLLARD = 24;
const rShaft = (y) => 1.95 - (y - 6.8) * (0.25 / 19.4);

export function rostral(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  const figMats = { main: M.figure, dark: M.figureDark, accent: M.rostra }, green = { main: M.rostra };
  const bollards = [], chainBays = [];
  for (const [ci, C] of [COL_N, COL_S].entries()) {
    const o = W(C[0], C[1]);
    P.push(o.x, 0, o.z, ROT);
    try {
      base(P, M);
      shaftAndTop(P, M);
      // ---- rostra: tier 1 on the pedestal (+-z), tier 2 (+-x), tier 3 (+-z), tier 4 (+-x); anchors on the free faces
      for (const s of [1, -1]) {
        prow('naiad').place(P, green, 0, 5.3, s * 2.95, s > 0 ? 0 : Math.PI, 1);
        prow('monster').place(P, green, s * (rShaft(12) - 0.12), 13.3, 0, s * Math.PI / 2, 1);
        prow('slender').place(P, green, 0, 17.1, s * (rShaft(16.5) - 0.12), s > 0 ? 0 : Math.PI, 1);
        prow('monster').place(P, green, s * (rShaft(23) - 0.12), 24.3, 0, s * Math.PI / 2, 0.83);
        anchor().place(P, green, 0, 12.3, s * (rShaft(12.3) + 0.07), s > 0 ? 0 : Math.PI, 1);
        anchor().place(P, green, s * (rShaft(17.4) + 0.07), 17.4, 0, s * Math.PI / 2, 1);
        anchor().place(P, green, 0, 23.4, s * (rShaft(23.4) + 0.07), s > 0 ? 0 : Math.PI, 0.9);
      }
      // ---- the river gods on the +-x sides: seat rock on the upper step, feet on the figure plinth (top 1.85)
      for (const s of [1, -1]) {
        const k = ci === 0 ? (s > 0 ? 0 : 1) : (s > 0 ? 2 : 3);
        P.box(M.figure, s > 0 ? 3.05 : -4.75, s > 0 ? 4.75 : -3.05, 2.2, 3.25, -1.25, 1.25, 'b');
        riverGod(k).place(P, figMats, s * 4.3, 1.85, 0, s * Math.PI / 2, 3.1);
      }
      // ---- chains between the bollards (sagging, six links each as short black bars)
      for (let k = 0; k < N_BOLLARD; k++) {
        const a0 = (k + 0.5) / N_BOLLARD * Math.PI * 2, a1 = (k + 1.5) / N_BOLLARD * Math.PI * 2, p = pol([0, 0], R_CHAIN, a0), q = pol([0, 0], R_CHAIN, a1);
        bollards.push(W(C[0] + p[0], C[1] + p[1]));
        const wp = W(C[0] + p[0], C[1] + p[1]), wq = W(C[0] + q[0], C[1] + q[1]);      // the chain (sagging, six links as short black bars) is the bay between two bollards
        chainBays.push({ x0: wp.x, z0: wp.z, x1: wq.x, z1: wq.z, y: 0 });
      }
    } finally { P.pop(); }
    // colliders: the column (a monument) and its stepped granite base with the figure pedestals and the door blocks (structures). The source's one solid disc of 11.7 m round the whole island ("the monument is fenced off")
    // is gone: the fence is the ring of bollards and chains (knock records / bays below), the paved island inside it is walkable once a chain is down.
    ph.addCylinder(o.x, o.z, 5.4, 0, 34);
    boxAt(ph, C[0], C[1], 10.4, 10.4, 0, 0, 2.2);                                                      // the stepped base (its corners lie outside the circle of the column)
    for (const s of [1, -1]) {
      boxAt(ph, C[0] + s * 6.4, C[1], 2.4, 4.9, 0, 0, 1.9);                                            // the figure pedestals on the +-x sides (4.9 x 2.4, top 1.85)
      boxAt(ph, C[0], C[1] + s * 5.8, 4.4, 1.2, 0, 0, 2.95);                                           // the door blocks on the +-z sides (4.4 x 1.2, to the keystone)
    }
    K.svc.monuments.push({ id: ci === 0 ? 'rostral-north' : 'rostral-south', name: ci === 0 ? 'Ростральная колонна (северная)' : 'Ростральная колонна (южная)', x: o.x, z: o.z, h: 32, r: R_ISLAND });
  }
  // the 48 bollards: one InstancedMesh (pink granite post 0.5 m square, 1.25 m, a pyramidal cap)
  const bol = partsGeos((Q) => { Q.box(M.bollard, -0.27, 0.27, 0, 0.16, -0.27, 0.27, 'b'); Q.box(M.bollard, -0.23, 0.23, 0.16, 1.2, -0.23, 0.23, 'bt'); Q.fan(M.bollard, [[-0.23, 1.2, 0.23], [0.23, 1.2, 0.23], [0, 1.34, 0]], [0, 0.5, 1]); Q.fan(M.bollard, [[0.23, 1.2, 0.23], [0.23, 1.2, -0.23], [0, 1.34, 0]], [1, 0.5, 0]); Q.fan(M.bollard, [[0.23, 1.2, -0.23], [-0.23, 1.2, -0.23], [0, 1.34, 0]], [0, 0.5, -1]); Q.fan(M.bollard, [[-0.23, 1.2, -0.23], [-0.23, 1.2, 0.23], [0, 1.34, 0]], [-1, 0.5, 0]); });
  // n4spb: knockable (core/knock.js, lib/knock-furniture.js): a granite bollard of 250 kg, anchored (holds a bump, breaks off at the foot above 30 km/h), with its own collider
  const bSpots = bollards.map((b, i) => ({ x: b.x, y: 0.1, z: b.z, rotY: ROT + (i % N_BOLLARD + 0.5) / N_BOLLARD * Math.PI * 2 }));
  K.extraTris += knockFurniture(ctx, 'lmSt-bollards', bol, bSpots, bollards.map((b) => ph.addCylinder(b.x, b.z, 0.28, 0.1, 1.5)), { kind: 'bollard', mass: 250, h: 1.3, r: 0.28, anchored: 30, hitK: 0.5 }, 320);
  // the chains: one geometry of six short black bars with a sag of 0.42 m, built at the true chord length and squeezed to x 0..1 (every bay of the ring has the same chord, so the stretch restores it exactly)
  {
    const chord = 2 * R_CHAIN * Math.sin(Math.PI / N_BOLLARD), n = 6, bars = []; let prev = [0, 1.12];
    for (let i = 1; i <= n; i++) {
      const t = i / n, cur = [chord * t, 1.12 - 0.42 * 4 * t * (1 - t)], dx = cur[0] - prev[0], dy = cur[1] - prev[1], L = Math.hypot(dx, dy);
      const g = new THREE.CylinderGeometry(0.045, 0.045, L, 5, 1, false); g.rotateZ(Math.atan2(-dx, dy)); g.translate((prev[0] + cur[0]) / 2, (prev[1] + cur[1]) / 2, 0); bars.push(g); prev = cur;
    }
    const chainGeo = mergeGeometries(bars); chainGeo.scale(1 / chord, 1, 1); chainGeo.computeBoundingSphere();
    knockBays(ctx, { name: 'lmSt-chains', bays: chainBays, far: 320,
      parts: [{ geo: chainGeo, mat: M.iron, name: 'chain', stretch: true, shadow: false, receive: false }],
      collider: { y0: 0, y1: 1.2, thick: 0.12, e0: 0, e1: 0 }, rec: () => ({ kind: 'fence', mass: 25, h: 1.1, anchored: 10, hitK: 0.2, metal: true, minDv: 0 }) });
    K.extraTris += chainBays.length * n * 16;
  }
  K.svc.photoSpots.push({ ...W(-80, 112), yaw: 0, name: 'Южная ростральная колонна' }, { ...W(80, 112), yaw: 0, name: 'Северная ростральная колонна' });
}

// -------------------------------------------------------------------------------------------------- island, stepped base, doors, cubic pedestal
function base(P, M) {
  const g = M.granite, gp = M.granitePlain;
  // the round island: slab paving 10 cm above the square, a kerb ring
  arcFlat(P, M.slab, [0, 0], 5.0, R_ISLAND, 0, Math.PI * 2, 0.1, true, { tile: 2.4, step: 3.2, cellR: 4 });
  arcWall(P, gp, [0, 0], R_ISLAND, 0, Math.PI * 2, 0, 0.1, true, { step: 3.2 });
  const sq = (h, y0, y1, mat = g) => { for (const s of [1, -1]) { wall(P, mat, [s * h, -h], [s * h, h], y0, y1, [s, 0]); wall(P, mat, [-h, s * h], [h, s * h], y0, y1, [0, s]); } };
  sq(5.2, 0.1, 1.8); plate(P, gp, -5.2, 5.2, -5.2, 5.2, 1.8, { tile: 2.4 });
  sq(4.7, 1.8, 2.2); plate(P, gp, -4.7, 4.7, -4.7, 4.7, 2.2, { tile: 2.4 });
  sq(3.05, 2.2, 5.9); P.box(gp, -3.15, 3.15, 5.9, 6.0, -3.15, 3.15, '');
  for (const s of [1, -1]) {
    // figure pedestal on the +-x side: 4.9 m wide, 2.4 m deep, top 1.5, with the plinth 1.5 .. 1.85
    const x0 = s > 0 ? 5.2 : -7.6, x1 = s > 0 ? 7.6 : -5.2;
    gbox(P, g, gp, x0, x1, 0.1, 1.5, -2.45, 2.45, s > 0 ? 'l' : 'r'); P.box(gp, s > 0 ? 5.2 : -7.1, s > 0 ? 7.1 : -5.2, 1.5, 1.85, -1.9, 1.9, 'b' + (s > 0 ? 'l' : 'r'));
    // door block on the +-z side: 4.4 m wide, 1.2 m deep, the iron double door in a recess, the low pedimented cap with a keystone
    const z0 = s > 0 ? 5.2 : -6.4, z1 = s > 0 ? 6.4 : -5.2, zf = s > 0 ? 6.4 : -6.4;
    gbox(P, g, gp, -2.2, -0.85, 0.1, 1.9, z0, z1, s > 0 ? 'k' : 'f'); gbox(P, g, gp, 0.85, 2.2, 0.1, 1.9, z0, z1, s > 0 ? 'k' : 'f');
    P.box(gp, -0.85, 0.85, 1.75, 1.9, z0, z1, s > 0 ? 'k' : 'f');
    vquad(P, M.ironDoor, [-0.85, zf - s * 0.3], [0.85, zf - s * 0.3], 0.1, 1.75, [0, s]);
    for (const dx of [-0.42, 0.42]) { const zz = zf - s * 0.27; P.fan(M.glass, [[dx, 0.95, zz], [dx + 0.2, 1.25, zz], [dx, 1.55, zz], [dx - 0.2, 1.25, zz]], [0, 0, s]); }
    P.box(M.iron, -0.02, 0.02, 0.1, 1.75, Math.min(zf - s * 0.3, zf - s * 0.26), Math.max(zf - s * 0.3, zf - s * 0.26), 'b');
    vpoly(P, gp, [0, zf + s * 0.06], [1, 0], [[-2.35, 1.9], [2.35, 1.9], [2.35, 2.15], [0, 2.75], [-2.35, 2.15]], [0, s]);
    P.quad(gp, [-2.35, 2.15, zf + s * 0.06], [0, 2.75, zf + s * 0.06], [0, 2.75, s * 4.7], [-2.35, 2.15, s * 4.7], [-0.4, 1, 0]); P.quad(gp, [2.35, 2.15, zf + s * 0.06], [0, 2.75, zf + s * 0.06], [0, 2.75, s * 4.7], [2.35, 2.15, s * 4.7], [0.4, 1, 0]);
    for (const t of [1, -1]) vquad(P, gp, [t * 2.35, zf + s * 0.06], [t * 2.35, s * 4.7], 1.9, 2.15, [t, 0]);
    P.box(gp, -0.3, 0.3, 1.9, 2.95, Math.min(zf, zf + s * 0.16), Math.max(zf, zf + s * 0.16), 'b');                      // keystone
  }
}

// -------------------------------------------------------------------------------------------------- shaft, capital, platform, drum, tripod and bowl
function shaftAndTop(P, M) {
  lathe(P, M.granitePlain, 0, 0, [[2.25, 6.0], [2.3, 6.2], [2.25, 6.45], [2.1, 6.62], [2.0, 6.8]], 28);
  lathe(P, M.shaft, 0, 0, [[1.95, 6.78], [1.93, 9], [1.87, 14], [1.79, 20], [1.70, 26.23]], 28);
  lathe(P, M.capital, 0, 0, [[1.70, 26.1], [1.8, 26.2], [1.8, 26.4], [1.95, 26.47], [2.5, 26.72], [2.55, 26.74]], 28);
  P.box(M.capital, -3.3, 3.3, 26.73, 27.33, -3.3, 3.3, '');
  // railing on the platform edge: posts every 0.55 m, two rails
  const e = 3.18, yb = 27.33, yt = 28.12;
  for (const s of [1, -1]) {
    P.box(M.iron, s * e - 0.03, s * e + 0.03, yt - 0.05, yt, -e, e, ''); P.box(M.iron, -e, e, yt - 0.05, yt, s * e - 0.03, s * e + 0.03, '');
    P.box(M.iron, s * e - 0.02, s * e + 0.02, yb + 0.12, yb + 0.16, -e, e, ''); P.box(M.iron, -e, e, yb + 0.12, yb + 0.16, s * e - 0.02, s * e + 0.02, '');
    for (let k = 0; k <= 12; k++) { const u = -e + 2 * e * k / 12; P.box(M.iron, s * e - 0.02, s * e + 0.02, yb, yt, u - 0.02, u + 0.02, 'tb'); if (k > 0 && k < 12) P.box(M.iron, u - 0.02, u + 0.02, yb, yt, s * e - 0.02, s * e + 0.02, 'tb'); }
  }
  lathe(P, M.shaft, 0, 0, [[1.3, 27.33], [1.3, 28.15]], 20);
  lathe(P, M.capital, 0, 0, [[1.3, 28.15], [1.42, 28.18], [1.42, 28.27], [0.2, 28.3]], 20);
  // tripod: three curved legs and a ring, the bowl on top
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * Math.PI * 2 + 0.5, c = Math.sin(a), s = Math.cos(a);
    P.cyl(M.bowl, [c * 1.0, 28.27, s * 1.0], [c * 0.62, 29.4, s * 0.62], 0.09, 0.08, 6, false); P.cyl(M.bowl, [c * 0.62, 29.4, s * 0.62], [c * 0.75, 30.45, s * 0.75], 0.08, 0.07, 6, false);
  }
  lathe(P, M.bowl, 0, 0, [[0.66, 29.36], [0.7, 29.4], [0.66, 29.44]], 14);
  lathe(P, M.bowl, 0, 0, [[0.12, 30.2], [0.55, 30.36], [0.95, 30.75], [1.2, 31.4], [1.24, 31.9], [1.16, 31.96], [1.08, 31.8], [0.02, 31.74]], 20);
  void THREE;
}
