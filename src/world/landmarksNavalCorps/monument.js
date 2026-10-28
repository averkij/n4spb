// landmarksNavalCorps/monument.js - the KRUSENSTERN MONUMENT (Памятник И. Ф. Крузенштерну, OSM n1612810138; I. N. Schroder, architect I. A. Monighetti, 1873; cast-iron railing F. K. San-Galli) on the tumba of the stair.
// Dossier docs/research/navalcorps.md 5.1 / 5.3 / 5.4 / 5.5, photos refs/navalcorps b02 b03 b05 b09 b11 (plates).  Frame K, the pedestal frame is turned by PI: local +z = the FRONT = towards the Corps (the statue
// faces the Corps, its back is to the Neva; the coat of arms and the inscription are on the landward face).
//   PEDESTAL red-brown polished granite, 2.56 m above the tumba top: lower block 1.75 m (the stepped bronze inscription plate on its front), an ogee-like taper, the die 1.30 m with chamfered corners and the
//            bronze coat-of-arms relief on the front (WITHOUT its two banners), plain bronze panels on the two sides, the cornice with a flat chamfered top, the bronze plinth plate 1.15 m.
//   RAILING  black cast iron on the tumba top, 3.7 x 3.65 m, 1.05 m high: corner and middle posts (pyramid cap and ball), two panels per side with X lattice and two ship's-wheel medallions each.
//   STATUE   krusensternFig() (figure.js) at scale 1.71 = 3.0 m on the plate.
import { K, MON, STAIR } from './frame.js';
import { krusensternFig } from './figure.js';
import { figureMats } from '../lib/figures.js';
import * as L from '../layout.js';
import { knockBays, unitPanel, unitBox } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7, docs/vo-m2.md): the eight railing panels are breakable bays; the eight cast-iron posts stay solid

const Y_TOP = 0.15;
const oct = (h, c) => [[-h + c, -h], [h - c, -h], [h, -h + c], [h, h - c], [h - c, h], [-h + c, h], [-h, h - c], [-h, -h + c]];
/** an octagonal (chamfered square) frustum: half-width h0 at y0, h1 at y1, chamfer c0 / c1; faces textured by metres; top cap optional */
function chamBox(P, mat, h0, h1, y0, y1, c0, c1, cap = true, capMat = mat) {
  const A = oct(h0, c0), B = oct(h1, c1), n = A.length;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const a = A[i], b = A[(i + 1) % n], a2 = B[i], b2 = B[(i + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, l = Math.hypot(mx, mz) || 1;
    P.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b2[0], y1, b2[1]], [a2[0], y1, a2[1]], [mx / l, (h0 - h1) / (y1 - y0 || 1), mz / l], [[acc, y0], [acc + len, y0], [acc + len, y1], [acc, y1]]);
    acc += len;
  }
  if (cap) P.cap(capMat, B, y1, true, 1);
}

export function build(Q) {
  const P = Q.P, M = Q.M, ph = Q.ctx.physics, T = STAIR.tumba, [tu0, tu1, tv0, tv1] = T;
  const mk = { main: M.verdi, dark: figureMats(Q.ctx).dark, accent: M.verdiDark };
  P.push(K.x, 0, K.z, K.rot);
  try {
    // ---------------------------------------------------------------------------------------- the railing on the tumba top
    railing(Q, tu0, tu1, tv0, tv1);
    // ---------------------------------------------------------------------------------------- the pedestal (frame turned by PI: local +z = towards the Corps = -v)
    P.push(MON.u, Y_TOP, MON.v, Math.PI);
    chamBox(P, M.graniteRed, 0.875, 0.875, 0, 0.8, 0.14, 0.14, true, M.graniteRed);                       // lower block (the inscription plate stands on its front face)
    chamBox(P, M.graniteRed, 0.93, 0.93, 0.8, 0.88, 0.14, 0.14, false);                                    // the projecting ledge
    chamBox(P, M.graniteRed, 0.82, 0.68, 0.88, 1.05, 0.14, 0.16, true);                                    // the ogee taper to the die
    chamBox(P, M.graniteRed, 0.65, 0.65, 1.05, 2.05, 0.16, 0.16, false);                                   // the die
    chamBox(P, M.graniteRed, 0.69, 0.82, 2.05, 2.2, 0.16, 0.18, false);                                    // the cornice flares
    chamBox(P, M.graniteRed, 0.82, 0.82, 2.2, 2.43, 0.18, 0.18, true);                                     // its flat chamfered top
    chamBox(P, M.bronzeBack, 0.575, 0.575, 2.43, 2.56, 0.05, 0.05, true);                                  // the bronze plinth plate
    // plates (front = +z): the stepped inscription plate and the coat of arms
    P.quad(M.plate, [-0.625, 0.3, 0.875 + 0.02], [0.625, 0.3, 0.875 + 0.02], [0.625, 0.8, 0.875 + 0.02], [-0.625, 0.8, 0.875 + 0.02], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.box(M.bronzeBack, -0.64, 0.64, 0.29, 0.81, 0.875, 0.875 + 0.018, 'bk', 1);
    P.quad(M.arms, [-0.35, 1.12, 0.65 + 0.02], [0.35, 1.12, 0.65 + 0.02], [0.35, 1.99, 0.65 + 0.02], [-0.35, 1.99, 0.65 + 0.02], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.box(M.bronzeBack, -0.37, 0.37, 1.1, 2.0, 0.65, 0.65 + 0.018, 'bk', 1);
    for (const s of [-1, 1]) P.box(M.bronzeBack, s * 0.65, s * 0.65 + s * 0.02, 1.2, 1.9, -0.28, 0.28, s > 0 ? 'l' : 'r', 1);           // the plain bronze panels on the two sides
    // the statue
    krusensternFig().place(P, mk, 0, 2.56, 0, 0, 1.71);
    P.pop();
  } finally { P.pop(); }
  // colliders: the pedestal (the railing has its own boxes in railing()) and a keep-clear disc round the figure
  { const c = K.W(MON.u, MON.v); ph.addBox(c.x, c.z, 1.9, 1.9, K.rot, Y_TOP - 0.1, 6.0); }
  // services: the monument, photo spots, a crowd disc at the stair top and under the colonnade
  const mw = K.W(MON.u, MON.v);
  Q.svc.monuments.push({ id: 'n1612810138', name: 'Памятник И. Ф. Крузенштерну', x: mw.x, z: mw.z, r: 3.2, h: 5.7 });
  const spot = (name, x, z, yaw, pitch = 0, y) => Q.svc.photoSpots.push({ name, x, z, yaw, pitch, ...(y != null ? { y } : {}) });
  const A = K.W(66.9, 37.0), B = K.W(66.1, 12), C = K.W(40, 44), D = K.W(66, 12);
  void B; void C; void D;
  spot('Крузенштерн: лицом к Корпусу', -3988.4, -248.1, -150.2, 12);
  spot('Лестница к Неве: ось Корпуса', -3982.5, -237.7, 30.5, 4, -1.8);
  spot('Набережная от лестницы', -4001.4, -237.2, 119.8);
  { const f = K.W(45, 29), t = K.W(66, 0); spot('Фасад Корпуса с набережной', f.x, f.z, L.yawToward(f.x, f.z, t.x, t.z), 6); }
  spot('Корпус: западный ракурс', -4059.2, -213.3, -39.0);
  spot('Корпус: восточный ракурс', -3918.6, -293.8, 102.5);
  spot('Под колоннадой', -4003.8, -273.8, 29.8);
  const s1 = K.W(66.5, 37.3), s2 = K.W(66.5, 4.6);
  Q.svc.crowd.push({ id: 'krusenstern-top', kind: 'photo', x: s1.x, z: s1.z, r: 4.5, n: 5 }, { id: 'corps-colonnade', kind: 'stand', x: s2.x, z: s2.z, r: 5, n: 4 });
  void A; void L;
}

/** the cast-iron railing on the tumba top (frame K): square tu0..tu1 x tv0..tv1, 1.05 m high, posts 0.2 m square 1.15 m tall with a pyramid cap and a ball, two panels per side */
function railing(Q, tu0, tu1, tv0, tv1) {
  const P = Q.P, M = Q.M, ph = Q.ctx.physics, y0 = Y_TOP, hh = 1.05, eps = 0.1;
  const xs = [tu0 + eps, (tu0 + tu1) / 2, tu1 - eps], zs = [tv0 + eps, (tv0 + tv1) / 2, tv1 - eps];
  const post = (x, z) => {
    P.box(M.ironRail, x - 0.1, x + 0.1, y0, y0 + 1.1, z - 0.1, z + 0.1, 'b', 1);
    P.fan(M.ironRail, [[x - 0.12, y0 + 1.1, z - 0.12], [x + 0.12, y0 + 1.1, z - 0.12], [x, y0 + 1.22, z]], [0, 0.5, -1]);
    P.fan(M.ironRail, [[x + 0.12, y0 + 1.1, z - 0.12], [x + 0.12, y0 + 1.1, z + 0.12], [x, y0 + 1.22, z]], [1, 0.5, 0]);
    P.fan(M.ironRail, [[x + 0.12, y0 + 1.1, z + 0.12], [x - 0.12, y0 + 1.1, z + 0.12], [x, y0 + 1.22, z]], [0, 0.5, 1]);
    P.fan(M.ironRail, [[x - 0.12, y0 + 1.1, z + 0.12], [x - 0.12, y0 + 1.1, z - 0.12], [x, y0 + 1.22, z]], [-1, 0.5, 0]);
    P.box(M.ironRail, x - 0.12, x + 0.12, y0 + 1.1, y0 + 1.14, z - 0.12, z + 0.12, 'b', 1);
  };
  for (const x of xs) for (const z of zs) { if (x === xs[1] && z === zs[1]) continue; post(x, z); }
  // panels: between consecutive posts of each side
  const bays = [];
  const panel = (xa, za, xb, zb) => { const A = K.W(xa, za), B = K.W(xb, zb); bays.push({ x0: A.x, z0: A.z, x1: B.x, z1: B.z, y: y0 }); };      // (the wheel panel + its top bar: the parts of the knock bays below)
  for (let i = 0; i < 2; i++) {
    panel(xs[i], zs[0], xs[i + 1], zs[0]); panel(xs[i], zs[2], xs[i + 1], zs[2]);
    panel(xs[0], zs[i], xs[0], zs[i + 1]); panel(xs[2], zs[i], xs[2], zs[i + 1]);
  }
  { const ring = [[tu0 + eps, tv0 + eps], [tu1 - eps, tv0 + eps], [tu1 - eps, tv1 - eps], [tu0 + eps, tv1 - eps], [tu0 + eps, tv0 + eps]].map(([u, v]) => { const w = K.W(u, v); return [w.x, w.z]; }); Q.svc.fences.push({ id: 'krusenstern-railing', pts: ring, h: hh, kind: 'iron' }); }
  // colliders: the panels are breakable bays (the water is near: this railing keeps nobody off the Neva), the posts are small solid blocks of cast iron
  knockBays(Q.ctx, { name: 'lmnaval-krusenstern-railing', bays, far: 280,
    parts: [{ geo: unitPanel(0.08, hh, { u1: 1 }), mat: M.wheelPanel, name: 'panel', stretch: true, inset: 0.1, shadow: false, receive: false, noOutline: true },
      { geo: unitBox(hh - 0.06, hh, -0.04, 0.04, { uLen: 3, uvs: 1 }), mat: M.ironRail, name: 'bar', stretch: true, inset: 0.1, shadow: false, receive: false }],
    collider: { y0: Y_TOP - 0.1, y1: Y_TOP + 1.3, thick: 0.3, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: 160, h: 1.1, anchored: 14, hitK: 0.35, metal: true, minDv: 0 }) });
  Q.extraTris = (Q.extraTris || 0) + bays.length * 6;
  for (const x of xs) for (const z of zs) { if (x === xs[1] && z === zs[1]) continue; const w = K.W(x, z); ph.addBox(w.x, w.z, 0.24, 0.24, K.rot, Y_TOP - 0.1, Y_TOP + 1.3); }
}
