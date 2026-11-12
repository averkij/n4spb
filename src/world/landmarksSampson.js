// St Sampson's Cathedral: the long five-domed church, street gate and tented
// belfry. Dimensions and positions follow the mapped OSM building parts; the
// pale blue arcades and open bell stage follow exterior photographs.
import * as THREE from 'three';
import { Parts, archPath } from './landmarksD/kit.js';
import { registerLOD } from '../core/spatial.js';

export const OWNS_GROUPS = true;
const CATHEDRAL = [-463.1, -4010.2], TOWER = [-509.3, -4001.2], CHAPEL = [-495.6, -4034.3];
const CHURCH_ROT = .270;

function archShape(y, w, h) {
  const s = new THREE.Shape();
  archPath(s, 0, y, w, h);
  return s;
}
function archBorder(y, w, h, t = .35) {
  const s = archShape(y, w, h), hole = new THREE.Path();
  archPath(hole, 0, y + t, w - 2 * t, h - t, true);
  s.holes.push(hole);
  return s;
}
// Wall above an open semicircular arcade or gate. The arch is a real void,
// not a dark decal, so the portico is readable from oblique views.
function archSpandrel(w, spring, top) {
  const r = w / 2, s = new THREE.Shape();
  s.moveTo(-r, top); s.lineTo(r, top); s.lineTo(r, spring);
  s.absarc(0, spring, r, 0, Math.PI, false);
  s.lineTo(-r, top); s.closePath();
  return s;
}
// A facade plane in local x/y, with +z facing the viewer.
function archPanel(P, M, x, z, rot, y, w, h) {
  P.push(x, 0, z, rot);
  P.face(M.white, archShape(y, w, h), 0);
  P.face(M.blueWall, archShape(y + .32, w - .64, h - .3), .035);
  P.pop();
}
function framedWindow(P, M, x, z, rot, y, w, h) {
  P.push(x, 0, z, rot);
  P.face(M.white, archShape(y, w, h), 0);
  P.face(M.window, archShape(y + .23, w - .46, h - .25), .035);
  P.box(M.white, -.06, .06, y + .25, y + h + w / 2 - .12, .045, .11);
  P.box(M.white, -w / 2 + .2, w / 2 - .2, y + h * .58, y + h * .58 + .09, .045, .11);
  P.pop();
}
function onion(P, M, x, z, base, radius, top) {
  P.cyl(M.blue, [x, base, z], [x, base + .7, z], radius * .4, radius * .62, 10);
  P.cyl(M.blue, [x, base + .7, z], [x, base + 1.65, z], radius * .62, radius * 1.12, 10);
  P.cyl(M.blue, [x, base + 1.65, z], [x, base + 2.75, z], radius * 1.12, radius * .89, 10);
  P.cyl(M.blue, [x, base + 2.75, z], [x, base + 4.2, z], radius * .89, .12, 10);
  P.cyl(M.gold, [x, base + 4.2, z], [x, top, z], .11, .07, 6);
  P.cyl(M.gold, [x - .65, top - .9, z], [x + .65, top - .9, z], .065, .065, 5);
  P.cyl(M.gold, [x - .43, top - 1.3, z], [x + .43, top - 1.3, z], .055, .055, 5);
}

function church(shell, detail, M, ctx) {
  const [x, z] = CATHEDRAL;
  // The OSM nave runs east-southeast for 45 m. Its low metal roof carries a
  // compact cluster of five drums near the eastern end.
  shell.push(x, 0, z, CHURCH_ROT);
  detail.push(x, 0, z, CHURCH_ROT);
  shell.box(M.blueWall, -22.6, 22.6, 0, 12.1, -8.15, 8.15);
  shell.box(M.white, -22.9, 22.9, 0, .65, -8.35, 8.35, 'b');
  shell.box(M.white, -22.95, 22.95, 11.7, 12.5, -11.1, 11.1);
  for (const side of [-1, 1]) {
    shell.quad(M.tent, [-23, 12.5, side * 11.25], [23, 12.5, side * 11.25], [23, 15.6, 0], [-23, 15.6, 0], [0, 1, 0]);
    const front = side * 10.78, rot = side < 0 ? Math.PI : 0;
    shell.box(M.tent, -22.8, 22.8, 0, .10, side < 0 ? -11.2 : 8.15, side < 0 ? -8.15 : 11.2, 'b');
    for (const u of [-18.5, -11.5, -4.5, 2.5, 9.5, 16.5]) {
      shell.push(u, 0, front, rot);
      shell.extrude(M.blueWall, archSpandrel(6.6, 6.35, 12.1), -.33, .66, 1, 8);
      shell.pop();
      detail.push(u, 0, front, rot);
      detail.face(M.white, archBorder(.16, 6.6, 6.35, .26), .38);
      detail.pop();
      framedWindow(detail, M, u, side * 8.19, rot, 2.0, 2.25, 4.2);
    }
    for (const u of [-22, -15, -8, -1, 6, 13, 20]) {
      shell.box(M.white, u - .52, u + .52, 0, 11.8, front - .48, front + .48);
      detail.box(M.white, u - .76, u + .76, 9.3, 9.75, front - .62, front + .62);
    }
  }
  // West entrance and rounded eastern sanctuary project from the main roof.
  shell.box(M.blueWall, -26.0, -22.6, 0, 8.8, -4.3, 4.3);
  shell.box(M.white, -26.25, -22.5, 8.5, 9.1, -4.55, 4.55);
  shell.cyl(M.blueWall, [23.2, 0, 0], [23.2, 12.3, 0], 5.1, 5.1, 12);
  shell.cyl(M.tent, [23.2, 12.3, 0], [23.2, 15.5, 0], 5.35, 1.2, 12);
  detail.box(M.white, -26.27, -26.0, 1.0, 7.8, -2.2, 2.2);
  detail.box(M.door, -26.35, -26.27, 1.0, 6.2, -1.5, 1.5);
  // OSM dome parts place the five crowns within a roughly 12 m square.
  const cx = 4.7, cz = 0;
  shell.cyl(M.blueWall, [cx, 15.6, cz], [cx, 23.6, cz], 2.8, 2.8, 8);
  shell.cyl(M.white, [cx, 15.55, cz], [cx, 16.05, cz], 2.98, 2.98, 8);
  shell.cyl(M.white, [cx, 23.3, cz], [cx, 24.0, cz], 3.02, 3.02, 8);
  onion(shell, M, cx, cz, 24.0, 1.75, 31.0);
  for (const [du, dv] of [[-4.4, -4.1], [4.4, -4.1], [-4.4, 4.1], [4.4, 4.1]]) {
    shell.cyl(M.blueWall, [cx + du, 15.6, cz + dv], [cx + du, 20.8, cz + dv], 1.65, 1.65, 8);
    shell.cyl(M.white, [cx + du, 20.5, cz + dv], [cx + du, 21.1, cz + dv], 1.82, 1.82, 8);
    onion(shell, M, cx + du, cz + dv, 21.1, 1.15, 27.8);
  }
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    detail.cyl(M.white, [cx + 2.8 * Math.cos(a), 16.0, cz + 2.8 * Math.sin(a)],
      [cx + 2.8 * Math.cos(a), 23.35, cz + 2.8 * Math.sin(a)], .12, .12, 5);
  }
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 8 + i * Math.PI / 2, nx = Math.cos(a), nz = Math.sin(a);
    framedWindow(detail, M, cx + 2.62 * nx, cz + 2.62 * nz, Math.atan2(nx, nz), 17.0, 1.45, 3.15);
  }
  shell.pop(); detail.pop();
  ctx.physics.addBox(x, z, 45.2, 16.3, CHURCH_ROT, 0, 12.5);
  for (const side of [-1, 1]) for (const u of [-22, -15, -8, -1, 6, 13, 20]) {
    const v = side * 10.78;
    ctx.physics.addBox(x + Math.cos(CHURCH_ROT) * u + Math.sin(CHURCH_ROT) * v,
      z - Math.sin(CHURCH_ROT) * u + Math.cos(CHURCH_ROT) * v, 1.04, .96, CHURCH_ROT, 0, 11.8);
  }
  const ax = x + Math.cos(CHURCH_ROT) * 23.2;
  const az = z - Math.sin(CHURCH_ROT) * 23.2;
  ctx.physics.addBox(ax, az, 9.8, 9.8, CHURCH_ROT, 0, 12.5);
}

function bellTower(shell, detail, M, ctx) {
  const [x, z] = TOWER;
  // A passage runs east-west through the gateway; the two small side wings
  // carry a narrower square tower, then an open four-sided bell stage.
  for (const side of [-1, 1]) {
    const a = side < 0 ? -8.4 : 3.0, b = side < 0 ? -3.0 : 8.4;
    shell.box(M.blueWall, x - 4.2, x + 4.2, 0, 9.8, z + a, z + b);
    shell.box(M.white, x - 4.5, x + 4.5, .15, .65, z + a - .2, z + b + .2, 'b');
    shell.cyl(M.tent, [x, 9.8, z + (a + b) / 2], [x, 11.7, z + (a + b) / 2], 4.4, 1.8, 4);
  }
  shell.push(x, 0, z, -Math.PI / 2);
  shell.extrude(M.blueWall, archSpandrel(6.0, 5.4, 10.0), -4.2, 8.4, 1, 8);
  shell.pop();
  for (const side of [-1, 1]) {
    const xx = x + side * 4.27, rot = side < 0 ? -Math.PI / 2 : Math.PI / 2;
    detail.push(xx, 0, z, rot);
    detail.face(M.white, archBorder(.1, 6.35, 5.35, .34), .02);
    detail.pop();
    for (const dz of [-5.7, 5.7]) {
      detail.push(xx, 0, z + dz, rot);
      detail.box(M.white, -1.22, 1.22, .65, 5.45, 0, .1);
      detail.box(M.door, -.86, .86, 1.0, 4.85, .11, .17);
      detail.fan(M.white, [[-1.35, 5.45, .13], [0, 6.15, .13], [1.35, 5.45, .13]], [0, 0, 1]);
      detail.cyl(M.white, [0, 7.25, .1], [0, 7.25, .17], .64, .64, 10);
      detail.cyl(M.window, [0, 7.25, .18], [0, 7.25, .22], .42, .42, 10);
      detail.pop();
    }
  }
  shell.box(M.white, x - 4.55, x + 4.55, 9.8, 10.5, z - 8.7, z + 8.7);
  shell.box(M.blueWall, x - 3.8, x + 3.8, 10.5, 22.8, z - 4.5, z + 4.5);
  for (const y of [10.5, 22.4]) shell.box(M.white, x - 4.15, x + 4.15, y, y + .65, z - 4.85, z + 4.85);
  for (const side of [-1, 1]) {
    const xx = x + side * 3.85;
    // White corner pilasters and a blue blind arch with a narrow window.
    for (const zz of [-3.8, 3.8]) detail.box(M.white, xx - .16, xx + .16, 10.9, 22.4, z + zz - .38, z + zz + .38);
    archPanel(detail, M, xx + side * .04, z, side < 0 ? -Math.PI / 2 : Math.PI / 2, 13.3, 4.2, 5.5);
    framedWindow(detail, M, xx + side * .16, z, side < 0 ? -Math.PI / 2 : Math.PI / 2, 16.0, 1.5, 2.7);
  }
  for (const side of [-1, 1]) {
    const zz = z + side * 4.55, rot = side < 0 ? Math.PI : 0;
    archPanel(detail, M, x, zz, rot, 13.3, 4.2, 5.5);
    framedWindow(detail, M, x, zz + side * .12, rot, 16.0, 1.5, 2.7);
    for (const dx of [-3.2, 3.2]) detail.box(M.white, x + dx - .22, x + dx + .22, 10.9, 22.4, zz - .18, zz + .18);
  }
  // The belfry walls have true round-arched openings, so the sky and bells
  // are visible through them from the street.
  const wall = new THREE.Shape();
  wall.moveTo(-4.1, 23.05); wall.lineTo(4.1, 23.05); wall.lineTo(4.1, 30.9); wall.lineTo(-4.1, 30.9); wall.closePath();
  const opening = new THREE.Path(); archPath(opening, 0, 24.6, 4.7, 3.0, true); wall.holes.push(opening);
  for (const rot of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const wx = x + Math.sin(rot) * 3.75, wz = z + Math.cos(rot) * 3.75;
    shell.push(wx, 0, wz, rot);
    shell.extrude(M.blueWall, wall, -.33, .66, 1, 8);
    shell.box(M.white, -4.3, -3.8, 23.1, 30.9, -.45, .45);
    shell.box(M.white, 3.8, 4.3, 23.1, 30.9, -.45, .45);
    shell.pop();
    detail.push(wx, 0, wz, rot);
    detail.face(M.white, archBorder(24.6, 5.05, 3.1, .3), .38);
    detail.box(M.bell, -2.05, 2.05, 24.55, 24.68, .39, .47);
    detail.pop();
  }
  shell.box(M.white, x - 4.35, x + 4.35, 30.7, 31.3, z - 4.35, z + 4.35);
  shell.cyl(M.tent, [x, 31.3, z], [x, 37.6, z], 4.55, .48, 8);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    shell.cyl(M.white, [x + 4.53 * Math.cos(a), 31.4, z + 4.53 * Math.sin(a)],
      [x + .49 * Math.cos(a), 37.6, z + .49 * Math.sin(a)], .055, .055, 5);
  }
  onion(shell, M, x, z, 37.3, .9, 43.2);
  shell.cyl(M.gold, [x, 29.0, z], [x, 28.2, z], .07, .07, 5);
  shell.cyl(M.bell, [x, 27.2, z], [x, 28.2, z], .78, .46, 8);
  shell.cyl(M.bell, [x, 27.1, z], [x, 27.3, z], .9, .9, 8);
  ctx.physics.addBox(x, z - 5.7, 8.4, 5.4, 0, 0, 10);
  ctx.physics.addBox(x, z + 5.7, 8.4, 5.4, 0, 0, 10);
}

function chapel(shell, detail, M, ctx) {
  const [x, z] = CHAPEL;
  shell.box(M.blueWall, x - 3.2, x + 3.2, 0, 8.1, z - 3.7, z + 3.7);
  shell.box(M.white, x - 3.38, x + 3.38, 0, .48, z - 3.88, z + 3.88, 'b');
  shell.box(M.white, x - 3.4, x + 3.4, 7.7, 8.25, z - 3.9, z + 3.9);
  for (const dx of [-2.95, 2.95]) for (const dz of [-3.43, 3.43]) {
    detail.box(M.white, x + dx - .25, x + dx + .25, .5, 7.7, z + dz - .28, z + dz + .28);
    detail.box(M.white, x + dx - .38, x + dx + .38, 6.9, 7.25, z + dz - .4, z + dz + .4);
  }
  for (const side of [-1, 1]) {
    framedWindow(detail, M, x, z + side * 3.78, side < 0 ? Math.PI : 0, 1.35, 2.35, 3.7);
    framedWindow(detail, M, x + side * 3.28, z, side < 0 ? -Math.PI / 2 : Math.PI / 2, 1.35, 2.35, 3.7);
  }
  // The 1909 chapel has a curved Baroque pediment, a short lantern with
  // circular windows and a dark onion crown rather than one plain roof cone.
  for (const side of [-1, 1]) {
    const zz = z + side * 3.93;
    detail.fan(M.white, [[x - 3.45, 8.15, zz], [x - 2.7, 9.05, zz], [x - 1.4, 9.45, zz],
      [x, 9.6, zz], [x + 1.4, 9.45, zz], [x + 2.7, 9.05, zz], [x + 3.45, 8.15, zz]], [0, 0, side]);
    detail.cyl(M.white, [x, 6.85, z + side * 3.95], [x, 6.85, z + side * 4.01], .48, .48, 10);
    detail.cyl(M.blueWall, [x, 6.85, z + side * 4.02], [x, 6.85, z + side * 4.06], .3, .3, 10);
  }
  shell.cyl(M.tent, [x, 8.25, z], [x, 9.35, z], 3.55, 2.42, 8);
  shell.box(M.blueWall, x - 2.15, x + 2.15, 9.35, 12.25, z - 2.15, z + 2.15);
  shell.box(M.white, x - 2.35, x + 2.35, 12.05, 12.55, z - 2.35, z + 2.35);
  for (const side of [-1, 1]) {
    for (const dx of [-1.9, 1.9]) detail.box(M.white, x + dx - .15, x + dx + .15, 9.4, 12.05, z + side * 2.17 - .1, z + side * 2.17 + .1);
    detail.cyl(M.white, [x, 10.9, z + side * 2.18], [x, 10.9, z + side * 2.26], .67, .67, 10);
    detail.cyl(M.window, [x, 10.9, z + side * 2.27], [x, 10.9, z + side * 2.31], .45, .45, 10);
    detail.cyl(M.white, [x + side * 2.18, 10.9, z], [x + side * 2.26, 10.9, z], .67, .67, 10);
    detail.cyl(M.window, [x + side * 2.27, 10.9, z], [x + side * 2.31, 10.9, z], .45, .45, 10);
  }
  onion(shell, M, x, z, 12.55, 1.45, 19.1);
  ctx.physics.addBox(x, z, 6.4, 7.4, 0, 0, 8.1);
}

export function build(ctx) {
  const M = {
    blueWall: ctx.mat.toon('#77b9c6', { paint: .035 }),
    white: ctx.mat.toon('#e9e2d1', { paint: .02 }),
    tent: ctx.mat.toon('#acb9b2', { paint: .025 }),
    blue: ctx.mat.toon('#264773', { paint: .025 }),
    gold: ctx.mat.toon('#c6ab68', { paint: .015 }),
    window: ctx.mat.toon('#465a62', { paint: .01 }),
    bell: ctx.mat.toon('#746343', { paint: .015 }),
    door: ctx.mat.toon('#4e443b', { paint: .01 }),
  };
  const root = new THREE.Group(); root.name = 'landmarksSampson';
  const shell = new Parts(), detail = new Parts();
  church(shell, detail, M, ctx);
  bellTower(shell, detail, M, ctx);
  chapel(shell, detail, M, ctx);
  for (const mesh of shell.build(root, { name: 'sampson-shell' })) registerLOD(mesh, 1300);
  for (const mesh of detail.build(root, { name: 'sampson-detail' })) registerLOD(mesh, 380);
  ctx.addStatic(root);
  const svc = { monuments: [{ id: 'r9907863', name: 'Сампсониевский собор', x: CATHEDRAL[0], z: CATHEDRAL[1], h: 31 }], photoSpots: [{ name: 'Сампсониевский собор', x: -460, z: -4070, yaw: 161.3, pitch: 11 }], houses: [], entrances: [], triangles: shell.tris + detail.tris };
  ctx.services.landmarksSampson = svc;
  const shared = (ctx.services.landmarks ||= {});
  shared.monuments = (shared.monuments || []).concat(svc.monuments);
  shared.photoSpots = (shared.photoSpots || []).concat(svc.photoSpots);
}
