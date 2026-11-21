// landmarksA/tower.js - the clock tower of the Moscow Railway Station (photos SP/refs/station 02, 10, 82; docs/research/station.md "Tower").
// Square 7 m shaft over the middle of the facade, rising from an iron balcony on two consoles at roof level: stage 1 with a pedimented window on every face,
// stage 2 with a 3 m dial on every face, dentil cornice, a short attic with louvres and a low slate hip roof with a rod: apex 32.4 m, rod tip 36.5 m.
// The four dials show the HUD clock (core/timeofday.js clockText + the sim seconds); the hands are the only moving parts (ctx.add, pure function of t).
import * as THREE from 'three';
import { Parts, TH, O, C } from './common.js';
import { dialTex } from './tex.js';

const U = 3.45, D0 = 0.45, D1 = 7.35, DC = (D0 + D1) / 2;     // shaft: u -U..U, d D0..D1
const Y0 = 18.9, Y1 = 23.3, Y2 = 23.75, Y3 = 27.5, Y4 = 29.4, Y5 = 30.5, YR = 32.5;
export const TOWER = { u: 0, d: DC, apex: YR, rod: 36.5, dialY: 25.6, dialR: 1.5 };

export function buildTower(Cc) {
  const { ctx, M, T } = Cc;
  const P = new Parts();
  const dialMat = Cc.lit('dial', dialTex(ctx), dialTex(ctx, true), 0.9);
  const dialRim = T('#2a2a2e', { paint: 0 });
  const slate = M.towerRoof;

  // ---- balcony on two consoles: slab, railing
  const bx = 4.6, bz0 = -1.7, bz1 = D1 + 1.2;
  P.box(M.trim, -bx, bx, 18.55, 18.9, bz0, bz1);
  P.box(M.trimShade, -bx - 0.1, bx + 0.1, 18.45, 18.55, bz0 - 0.1, bz1 + 0.1);
  for (const s of [-1, 1]) {            // consoles under the front edge
    P.box(M.trim, s * 2.6 - 0.45, s * 2.6 + 0.45, 17.0, 18.45, -1.55, -0.2);
    P.box(M.trimShade, s * 2.6 - 0.35, s * 2.6 + 0.35, 16.5, 17.0, -1.3, -0.2);
  }
  const rail = (x0, z0, x1, z1) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.22));
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; P.box(M.iron, x - 0.02, x + 0.02, 18.9, 19.85, z - 0.02, z + 0.02, 'b'); }
    P.box(M.iron, Math.min(x0, x1) - 0.04, Math.max(x0, x1) + 0.04, 19.82, 19.92, Math.min(z0, z1) - 0.04, Math.max(z0, z1) + 0.04);
    P.box(M.iron, Math.min(x0, x1) - 0.03, Math.max(x0, x1) + 0.03, 18.95, 19.02, Math.min(z0, z1) - 0.03, Math.max(z0, z1) + 0.03);
  };
  rail(-bx + 0.05, bz0 + 0.05, bx - 0.05, bz0 + 0.05); rail(-bx + 0.05, bz1 - 0.05, bx - 0.05, bz1 - 0.05);
  rail(-bx + 0.05, bz0 + 0.05, -bx + 0.05, bz1 - 0.05); rail(bx - 0.05, bz0 + 0.05, bx - 0.05, bz1 - 0.05);

  // ---- shaft
  P.box(M.stucco, -U, U, Y0, Y4, D0, D1, 'bt');
  // Two engaged columns turn each corner, one on each face; the shaft
  // restarts above the clock-stage string course (central facade survey).
  for (const side of [-1, 1]) for (const end of [-1, 1]) {
    const z = end < 0 ? D0 : D1;
    for (const [x, d] of [[side * (U - 0.20), z], [side * U, z - end * 0.20]]) {
      for (const [bottom, top] of [[Y0, Y1], [Y2, Y3 + 0.72]]) {
        P.cyl(M.trim, x, d, bottom, top - 0.42, 0.25, 0.22, 14);
        P.cyl(M.trimShade, x, d, bottom + 1.40, bottom + 1.48, 0.26, 0.26, 14);
        P.cyl(M.trim, x, d, top - 0.42, top - 0.10, 0.22, 0.34, 14);
        P.box(M.trim, x - 0.35, x + 0.35, top - 0.10, top, d - 0.35, d + 0.35);
      }
    }
  }
  // string courses and cornices
  P.box(M.trim, -U - 0.3, U + 0.3, Y1, Y2, D0 - 0.3, D1 + 0.3);
  P.box(M.trimShade, -U - 0.2, U + 0.2, Y1 - 0.15, Y1, D0 - 0.2, D1 + 0.2);
  P.box(M.trim, -U - 0.3, U + 0.3, Y3, Y3 + 0.25, D0 - 0.3, D1 + 0.3);
  P.box(M.stuccoShade, -U - 0.12, U + 0.12, Y3 + 0.25, Y3 + 0.75, D0 - 0.12, D1 + 0.12);
  // dentils all around
  for (let u = -U + 0.2; u < U; u += 0.52) {
    P.box(M.trim, u - 0.14, u + 0.14, Y3 + 0.75, Y3 + 1.15, D0 - 0.62, D0 - 0.1, 'b');
    P.box(M.trim, u - 0.14, u + 0.14, Y3 + 0.75, Y3 + 1.15, D1 + 0.1, D1 + 0.62, 'b');
  }
  for (let d = D0 + 0.2; d < D1; d += 0.52) {
    P.box(M.trim, -U - 0.62, -U - 0.1, Y3 + 0.75, Y3 + 1.15, d - 0.14, d + 0.14, 'b');
    P.box(M.trim, U + 0.1, U + 0.62, Y3 + 0.75, Y3 + 1.15, d - 0.14, d + 0.14, 'b');
  }
  P.box(M.trim, -U - 0.7, U + 0.7, Y3 + 1.15, Y3 + 1.5, D0 - 0.7, D1 + 0.7);
  P.box(M.trimShade, -U - 0.6, U + 0.6, Y3 + 1.5, Y3 + 1.62, D0 - 0.6, D1 + 0.6);
  // attic: slightly narrower, louvre openings
  P.box(M.stucco, -U + 0.1, U - 0.1, Y3 + 1.62, Y4 + 0.9, D0 + 0.1, D1 - 0.1, 'b');
  P.box(M.trim, -U - 0.15, U + 0.15, Y4 + 0.9, Y5, D0 - 0.15, D1 + 0.15);
  P.box(M.trimShade, -U - 0.3, U + 0.3, Y5, Y5 + 0.18, D0 - 0.3, D1 + 0.3);
  // ---- faces: window with pediment (stage 1), louvre (attic)
  const faces = [
    { name: 'front', ox: 0, oz: D0, nx: 0, nz: -1, rotY: 0 },
    { name: 'back', ox: 0, oz: D1, nx: 0, nz: 1, rotY: Math.PI },
    { name: 'west', ox: -U, oz: DC, nx: -1, nz: 0, rotY: Math.PI / 2 },
    { name: 'east', ox: U, oz: DC, nx: 1, nz: 0, rotY: -Math.PI / 2 },
  ];
  for (const f of faces) {
    P.push(f.ox, 0, f.oz, f.rotY);          // local z = INTO the tower on every face (front: rotY 0); x = along the face
    P.box(M.trim, -0.72, -0.5, 19.9, 22.9, -0.12, 0.2, 'r'); P.box(M.trim, 0.5, 0.72, 19.9, 22.9, -0.12, 0.2, 'l');
    P.box(M.trim, -0.72, 0.72, 22.4, 22.75, -0.12, 0.2, 'b');
    P.quad(M.pane, [0.5, 20.0, -0.035], [-0.5, 20.0, -0.035], [-0.5, 22.4, -0.035], [0.5, 22.4, -0.035], [0, 0, -1]);
    P.box(M.frame, -0.02, 0.02, 20.0, 22.4, -0.075, -0.035);
    for (const y of [20.8, 21.65]) P.box(M.frame, -0.5, 0.5, y, y + 0.05, -0.075, -0.035);
    // pediment
    const tri = new THREE.Shape(); tri.moveTo(-0.95, 0); tri.lineTo(0.95, 0); tri.lineTo(0, 0.5); tri.lineTo(-0.95, 0);
    P.extrude(M.trim, tri, 0.3, 0, 22.75, -0.32);
    P.box(M.trim, -0.95, 0.95, 22.7, 22.78, -0.32, 0.0);
    // sill
    P.box(M.trim, -0.82, 0.82, 19.75, 19.95, -0.2, 0.2, 'b');
    // louvre in the attic
    P.box(M.trim, -0.62, 0.62, Y4 - 0.15, Y4 + 0.75, -0.08, 0.2, 'r'); P.box(M.frame, -0.5, 0.5, Y4 - 0.05, Y4 + 0.65, -0.01, 0.1);
    for (let y = Y4 + 0.0; y < Y4 + 0.62; y += 0.14) P.box(M.trimShade, -0.5, 0.5, y, y + 0.05, -0.06, 0.0);
    P.pop();
  }
  // ---- hip roof (two stages for a slightly concave profile) + rod
  const ring = (ins, y) => [[-U - 0.3 + ins, y, D0 - 0.3 + ins], [U + 0.3 - ins, y, D0 - 0.3 + ins], [U + 0.3 - ins, y, D1 + 0.3 - ins], [-U - 0.3 + ins, y, D1 + 0.3 - ins]];
  const r0 = ring(0.0, Y5 + 0.18), r1 = ring(1.2, Y5 + 1.4), r2 = ring(2.4, YR);
  for (const [a, b] of [[r0, r1], [r1, r2]]) for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4, ox = [0, 1, 0, -1][i], oz = [-1, 0, 1, 0][i];
    const n = a === r0 ? 0.8 : 0.55;
    P.quad(slate, a[i], a[j], b[j], b[i], [ox * 0.9, n, oz * 0.9]);
  }
  P.quad(slate, r2[0], r2[1], r2[2], r2[3], [0, 1, 0]);
  P.cyl(M.iron, 0, DC, YR, 36.5, 0.045, 0.02, 6);
  P.cyl(M.gold, 0, DC, YR + 0.05, YR + 0.35, 0.16, 0.16, 8);

  // ---- dials (static faces) on the four sides
  const dialG = new THREE.CylinderGeometry(TOWER.dialR, TOWER.dialR, 0.06, 40), rimG = new THREE.CylinderGeometry(TOWER.dialR + 0.17, TOWER.dialR + 0.17, 0.12, 40);
  const dialPlace = [
    { x: 0, z: D0, nx: 0, nz: -1 }, { x: 0, z: D1, nx: 0, nz: 1 }, { x: -U, z: DC, nx: -1, nz: 0 }, { x: U, z: DC, nx: 1, nz: 0 },
  ];
  for (const f of dialPlace) {
    // cylinder axis y -> outward normal: tilt about the axis perpendicular to (n, y)
    const ry = Math.atan2(f.nx, f.nz);                       // yaw that points local +z at the outward normal
    P.push(f.x, TOWER.dialY, f.z, ry);
    P.geo(dialRim, rimG, 0, 0, 0.05, Math.PI / 2, 0, 0);
    P.geo(dialMat, dialG, 0, 0, 0.1, Math.PI / 2, Math.PI, 0);
    P.pop();
  }

  const g = new THREE.Group(); g.name = 'station-tower'; g.position.set(O.x, 0, O.z); g.rotation.y = TH;
  P.build(g, {});
  ctx.addStatic(g);

  // ---- hands (dynamic): one group per face; pure function of the HUD clock
  const hands = new THREE.Group(); hands.name = 'station-clock-hands'; hands.position.set(O.x, 0, O.z); hands.rotation.y = TH;
  const hm = new THREE.MeshToonMaterial({ color: '#17171b' });
  const mk = (len, w, tail) => { const geo = new THREE.BoxGeometry(w, len + tail, 0.03); geo.translate(0, (len - tail) / 2, 0); const m = new THREE.Mesh(geo, hm); m.castShadow = false; return m; };
  const hourH = [], minH = [];
  for (const f of dialPlace) {
    const fg = new THREE.Group();
    fg.position.set(f.x, TOWER.dialY, f.z);
    fg.rotation.y = Math.atan2(f.nx, f.nz);                       // local +z = outward
    const hh = mk(0.85, 0.2, 0.2), mh = mk(1.3, 0.12, 0.25);
    hh.position.z = 0.16; mh.position.z = 0.2;
    // brass boss
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 10), hm); boss.rotation.x = Math.PI / 2; boss.position.z = 0.22;
    fg.add(hh, mh, boss); hands.add(fg); hourH.push(hh); minH.push(mh);
  }
  ctx.add(hands);
  const clockMinutes = (t) => {
    try {
      const s = window.__tod && window.__tod.clockText ? window.__tod.clockText(t) : null;
      if (s) { const [h, m] = s.split(':').map(Number); return h * 60 + m + (t % 60) / 60; }
    } catch (e) { /* no tod */ }
    return 15 * 60 + 20 + t / 60;
  };
  const setHands = (t) => {
    const mins = clockMinutes(t), ma = (mins % 60) / 60 * Math.PI * 2, ha = ((mins / 60) % 12) / 12 * Math.PI * 2;
    for (let i = 0; i < hourH.length; i++) { hourH[i].rotation.z = -ha; minH[i].rotation.z = -ma; }
  };
  setHands(0);
  ctx.onUpdate((dt, t) => setHands(t));
  Cc.svc.photoSpots.push({ x: O.x - 8, z: O.z - 62, yaw: 0, name: 'Часовая башня Московского вокзала · Station clock tower', clock: true });
  return { height: YR, rod: 36.5 };
}
