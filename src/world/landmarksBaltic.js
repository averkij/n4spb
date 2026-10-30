// Baltic Railway Station (A. Krakau, 1855–1857), main facade. The station's
// OSM parent r2210356 has many long wings; only r3225591 is replaced here.
// References: https://www.encspb.ru/object/2804001907?dv=1000000000&lc=en
// Modern facade: https://zhd-peterburg.ru/wp-content/uploads/2017/08/baltijskij.jpg
import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksD/kit.js';
import { addPolyColliders } from './lib/massing.js';
import { registerLOD } from '../core/spatial.js';

export const OWNS_GROUPS = ['baltic-entrance'];

// The footprint's long north-facing edge anchors the front and rotation.
export function entranceFrame(rec) {
  const ring = rec.polys[0].o; let best = null;
  for (let i = 0; i < ring.length; i += 2) {
    const j = (i + 2) % ring.length, dx = ring[j] - ring[i], dz = ring[j + 1] - ring[i + 1];
    const len = dx*dx + dz*dz;
    if (!best || len > best.len) best = { dx, dz, len };
  }
  let rot = Math.atan2(-best.dz, best.dx); if (Math.cos(rot) < 0) rot += Math.PI;
  return { x: rec.cx, z: rec.cz, rot };
}

export function buildEntrance(ctx, rec) {
  const { x, z, rot } = entranceFrame(rec), root = new THREE.Group(); root.name = 'landmarksBaltic';
  const body = new Parts(), detail = new Parts();
  const wall = ctx.mat.toon('#ddd4c0', { paint: .025 });
  const trim = ctx.mat.toon('#eee7d6', { paint: .025 });
  const shade = ctx.mat.toon('#bcb2a0', { paint: .025 });
  const roof = ctx.mat.toon('#87958e', { paint: .025 });
  const glass = ctx.mat.toon('#344c53', { paint: .015 });
  const metal = ctx.mat.toon('#40565b', { paint: .015 });
  const blue = ctx.mat.toon('#224fa4', { paint: 0 });
  const sign = ctx.tex?.sign && ctx.mat.decal ? ctx.mat.decal('#ffffff', { map: ctx.tex.sign({ text: 'БАЛТИЙСКИЙ ВОКЗАЛ', bg: '#ddd4c0', fg: '#2149a8', w: 1024, h: 128, font: 'serif' }) }) : null;
  for (const p of [body, detail]) p.push(x, 0, z, rot);
  // The single claimed low entrance is replaced, including the footprint's
  // ground-level wall collider. The adjacent generic wings remain intact.
  body.box(wall, -15.2, 15.2, 0, 8, -3.7, 3.7);
  body.box(shade, -15.35, 15.35, 0, .6, -3.85, 3.85);
  for (const poly of rec.polys) addPolyColliders(ctx, poly, 0, 8);
  // Upper arched hall and two Renaissance pavilions above the mapped wings.
  body.box(wall, -10.8, 10.8, 8, 15.8, -3.45, 3.35);
  body.box(shade, -10.95, 10.95, 15.7, 16.2, -3.65, 3.6);
  const pediment = new THREE.Shape();
  pediment.moveTo(-10.8, 16.2); pediment.lineTo(0, 20.0); pediment.lineTo(10.8, 16.2); pediment.closePath();
  body.extrude(wall, pediment, -3.5, 6.8, 2, 1);
  for (const side of [-1, 1]) {
    const u = side * 14.1;
    body.box(wall, u-3.3, u+3.3, 6.65, 19.8, -3.25, 3.2);
    body.box(shade, u-3.5, u+3.5, 19.6, 20.2, -3.5, 3.45);
    body.box(roof, u-3.2, u+3.2, 20.2, 20.45, -3.2, 3.2);
  }
  // Front faces north. This separate facade frame reverses X, which is safe
  // because the frontage is symmetrical. Window glazing stands off the wall.
  detail.push(0, 0, -3.76, Math.PI);
  detail.box(trim, -15.1, 15.1, 7.55, 8.0, .03, .26);
  detail.box(shade, -15.1, 15.1, 1.0, 1.13, .03, .22);
  for (let u = -13.5; u <= 13.5; u += 3) {
    // Ground-storey arched lights / entrance doors.
    const arch = new THREE.Shape();
    arch.moveTo(u-.86, 1.2); arch.lineTo(u+.86, 1.2); arch.lineTo(u+.86, 4.8);
    arch.absarc(u, 4.8, .86, 0, Math.PI, false); arch.closePath();
    detail.face(glass, arch, .05, 1, 12);
    detail.box(trim, u-.98, u-.86, 1.0, 4.8, .06, .20);
    detail.box(trim, u+.86, u+.98, 1.0, 4.8, .06, .20);
    for (let i=0; i<12; i++) {
      const a = Math.PI*i/12, b = Math.PI*(i+1)/12;
      detail.cyl(trim, [u+.92*Math.cos(a),4.8+.92*Math.sin(a),.14], [u+.92*Math.cos(b),4.8+.92*Math.sin(b),.14], .08, .08, 5);
    }
    detail.box(metal, u-.035, u+.035, 1.2, 5.5, .07, .14);
  }
  // Large semicircular fanlight, clock and metal glazing bars above the sign.
  const fan = new THREE.Shape(); fan.moveTo(-8.4,8.15); fan.lineTo(8.4,8.15); fan.lineTo(8.4,9.7);
  fan.absarc(0,9.7,8.4,0,Math.PI,false); fan.closePath();
  detail.face(glass, fan, .34, 1, 24);
  for (const u of [-6,-4,-2,0,2,4,6]) {
    const top = 9.7 + Math.sqrt(8.4*8.4-u*u);
    detail.box(metal, u-.045, u+.045, 8.15, top, .36, .43);
  }
  detail.box(metal, -8.2, 8.2, 9.65, 9.75, .36, .43);
  detail.geo(trim, new THREE.CircleGeometry(.9, 24), 0, 13.1, .46);
  detail.cyl(metal, [0,13.1,.48], [.36,13.48,.48], .035, .035, 5);
  detail.cyl(metal, [0,13.1,.48], [-.42,13.14,.48], .035, .035, 5);
  if (sign) detail.quad(sign, [-9.4,7.85,.48], [9.4,7.85,.48], [9.4,8.75,.48], [-9.4,8.75,.48], [0,0,1]);
  else detail.box(blue, -8, 8, 8.05, 8.3, .40, .45);
  for (const side of [-1,1]) {
    const u = side*14.1;
    detail.box(trim, u-2.95, u+2.95, 17.6, 17.95, .03, .28);
    detail.box(shade, u-2.9, u+2.9, 19.2, 19.5, .03, .25);
    const win = new THREE.Shape(); win.moveTo(u-1.05,13); win.lineTo(u+1.05,13); win.lineTo(u+1.05,16.2); win.absarc(u,16.2,1.05,0,Math.PI,false); win.closePath();
    detail.face(glass, win, .05, 1, 12);
    detail.box(trim, u-1.18, u-1.04, 12.9, 16.2, .06, .22);
    detail.box(trim, u+1.04, u+1.18, 12.9, 16.2, .06, .22);
  }
  detail.pop();
  for (const p of [body, detail]) p.pop();
  for (const [p, far] of [[body,2600],[detail,500]]) for (const mesh of p.build(root, { name:'baltic-entrance' })) {
    if (mesh.material === sign) ctx.noOutline(mesh);
    mesh.updateMatrixWorld(true); registerLOD(mesh,far);
  }
  ctx.addStatic(root);
  const svc = { triangles: body.tris + detail.tris, houses: [{ id: 'r2210356', name:'Балтийский вокзал', x, z }], entrances: [], photoSpots: [] };
  ctx.services.landmarksBaltic = svc;
  return { root, frame: { x,z,rot }, triangles: svc.triangles };
}

export function build(ctx) {
  const rec = L.groupMembers('baltic-entrance').find(b => b.id === 'r3225591');
  if (rec) buildEntrance(ctx, rec);
}
