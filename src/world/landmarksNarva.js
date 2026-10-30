// Narva Triumphal Gate (Stasov, 1827–1834), at its OSM footprint.
// Dimensions and sculpture: https://gmgs.ru/post/17574
// Photographic reference: https://gmgs.ru/narva_gate
import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksD/kit.js';
import { horse, cached } from './lib/figures.js';
import { registerLOD } from '../core/spatial.js';

export const OWNS_GROUPS = ['narva-gate'];

// The longest edge of the mapped rectangle gives the long axis. Three's Y
// rotation takes local +X to (cos(rot), -sin(rot)) in the world XZ frame.
export function gateFrame(rec) {
  const ring = rec.polys?.[0]?.o || [];
  let best = null;
  for (let i = 0; i < ring.length; i += 2) {
    const j = (i + 2) % ring.length, dx = ring[j] - ring[i], dz = ring[j + 1] - ring[i + 1];
    if (!best || dx * dx + dz * dz > best.len) best = { dx, dz, len: dx * dx + dz * dz };
  }
  let rot = best ? Math.atan2(-best.dz, best.dx) : 0;
  if (Math.cos(rot) < 0) rot += Math.PI;
  return { x: rec.cx, z: rec.cz, rot };
}

const horseFigure = () => cached('narva-six-horse', () => horse({ pose: 'prance', detail: .5, seed: 4, mane: 'short' }));

export function buildGate(ctx, rec) {
  const { x, z, rot } = gateFrame(rec), c = Math.cos(rot), s = Math.sin(rot);
  const point = (u, v) => ({ x: x + c * u + s * v, z: z - s * u + c * v });
  const root = new THREE.Group(); root.name = 'landmarksNarva';
  const body = new Parts(), detail = new Parts(), sculpture = new Parts();
  const copper = ctx.mat.toon('#718c7c', { paint: .025 });
  const shade = ctx.mat.toon('#536f60', { paint: .025 });
  const bronze = ctx.mat.toon('#4a6557', { paint: .025 });
  const gold = ctx.mat.toon('#c8ac6a', { paint: .02 });
  const lettering = ctx.tex?.sign && ctx.mat.decal ? [
    'ПОБЕДОНОСНОЙ РОССИЙСКОЙ ИМПЕРАТОРСКОЙ ГВАРДИИ',
    'ПРИЗНАТЕЛЬНОЕ ОТЕЧЕСТВО · 17 АВГУСТА 1834',
  ].map(text => ctx.mat.decal('#ffffff', { map: ctx.tex.sign({ text, bg: '#718c7c', fg: '#ddc37b', w: 2048, h: 128, font: 'serif' }) })) : [];
  for (const p of [body, detail, sculpture]) p.push(x, 0, z, rot);

  // Two solid piers and a truly open 8.4 m passage. The curved spandrel is
  // extruded above the spring line; its collision leaves the arch unobstructed.
  for (const side of [-1, 1]) {
    const a = side < 0 ? [-11.2, -4.2] : [4.2, 11.2];
    body.box(copper, a[0], a[1], 0, 10.8, -3.55, 3.55);
    body.box(shade, a[0] - .12, a[1] + .12, 0, .65, -3.72, 3.72);
    const q = point((a[0] + a[1]) / 2, 0);
    ctx.physics.addBox(q.x, q.z, a[1] - a[0], 7.1, rot, 0, 10.8);
  }
  const shell = new THREE.Shape();
  shell.moveTo(-11.2, 10.8); shell.lineTo(-4.2, 10.8);
  shell.absarc(0, 10.8, 4.2, Math.PI, 0, true);
  shell.lineTo(11.2, 10.8); shell.lineTo(11.2, 18.1); shell.lineTo(-11.2, 18.1); shell.closePath();
  body.extrude(copper, shell, -3.55, 7.1, 2, 24);
  body.box(shade, -11.6, 11.6, 18.1, 18.8, -3.85, 3.85);
  body.box(copper, -11.25, 11.25, 18.8, 22.7, -3.62, 3.62);
  body.box(shade, -11.65, 11.65, 22.7, 23.3, -3.9, 3.9);
  body.box(copper, -11.4, 11.4, 23.3, 23.7, -3.75, 3.75);
  ctx.physics.addBox(x, z, 22.4, 7.1, rot, 15.15, 23.7);

  // Six columns on each face; all columns and warrior pedestals are solid,
  // while the opening between the piers remains a walkable passage.
  for (const face of [-1, 1]) for (const u of [-10, -8, -6, 6, 8, 10]) {
    const v = face * 4.25, q = point(u, v);
    body.col(copper, u, v, .55, 15.6, .72, .62, 16);
    body.col(shade, u, v, .35, .75, .82, .82, 16);
    body.col(copper, u, v, 15.6, 16.15, .78, .95, 12);
    detail.box(shade, u - .88, u + .88, 16.12, 16.42, v - .88, v + .88);
    ctx.physics.addCylinder(q.x, q.z, .78, 0, 16.4);
  }
  // Four warriors on pedestals in the outer bays; simplified patinated figures.
  for (const face of [-1, 1]) for (const u of [-8.9, 8.9]) {
    const v = face * 5.1, q = point(u, v);
    body.box(shade, u - .58, u + .58, 0, 1.45, v - .55, v + .55);
    detail.col(bronze, u, v, 1.45, 4.45, .42, .28, 8);
    detail.geo(bronze, new THREE.SphereGeometry(.34, 8, 6), u, 4.76, v);
    detail.cyl(bronze, [u-.38,3.95,v], [u-.62,2.7,v], .13, .09, 6);
    detail.cyl(bronze, [u+.38,3.95,v], [u+.62,2.7,v], .13, .09, 6);
    ctx.physics.addCylinder(q.x, q.z, .68, 0, 1.45);
  }
  // Raised moulding around the arch, and the gilded dedication on both faces.
  for (const face of [-1, 1]) {
    const v = face * 3.59;
    for (const side of [-1, 1]) detail.box(shade, side < 0 ? -4.48 : 4.2, side < 0 ? -4.2 : 4.48, .7, 10.8, v-.06, v+.06);
    for (let i = 0; i < 24; i++) {
      const a = Math.PI * i / 24, b = Math.PI * (i + 1) / 24;
      detail.cyl(shade, [4.35*Math.cos(a),10.8+4.35*Math.sin(a),v], [4.35*Math.cos(b),10.8+4.35*Math.sin(b),v], .14, .14, 5);
    }
    if (lettering.length) {
      detail.push(0, 0, face * 3.64, face < 0 ? Math.PI : 0);
      for (let i = 0; i < lettering.length; i++) {
        const y = 20.52 - i * .65;
        detail.quad(lettering[i], [-9,y-.22,0], [9,y-.22,0], [9,y+.22,0], [-9,y+.22,0], [0,0,1]);
      }
      detail.pop();
    } else {
      detail.box(gold, -5.8, 5.8, 20.35, 20.46, v-.03, v+.03);
      detail.box(gold, -4.8, 4.8, 19.83, 19.92, v-.03, v+.03);
    }
  }
  // Six horses and the winged Victory stand on the attic. Horse geometry is
  // shared and submitted in the distant silhouette collector.
  const H = horseFigure(), hm = { main: bronze, dark: bronze, accent: bronze };
  for (let i = 0; i < 6; i++) H.place(sculpture, hm, (i - 2.5) * 1.8, 23.7, .2, 0, 1.8);
  sculpture.box(bronze, -1.15, 1.15, 23.7, 24.7, -2.95, -1.4);
  sculpture.col(bronze, 0, -2.2, 24.5, 28.3, .52, .32, 10);
  sculpture.geo(bronze, new THREE.SphereGeometry(.38, 8, 6), 0, 28.65, -2.2);
  for (const side of [-1, 1]) {
    sculpture.cyl(bronze, [side*.35,27.7,-2.2], [side*1.2,29.6,-2.35], .19, .08, 6);
    for (let j = 0; j < 4; j++) sculpture.cyl(bronze, [side*.25,27.2-j*.22,-2.48], [side*(1.45+j*.13),28.5-j*.34,-2.5], .17, .045, 5);
  }
  for (const p of [body, detail, sculpture]) p.pop();
  let triangles = 0;
  for (const [part, far] of [[body, 2600], [detail, 500], [sculpture, 2600]]) {
    triangles += part.tris;
    for (const mesh of part.build(root, { name: 'narva-gate' })) {
      if (lettering.includes(mesh.material)) ctx.noOutline(mesh);
      mesh.updateMatrixWorld(true); registerLOD(mesh, far);
    }
  }
  ctx.addStatic(root);
  const svc = { triangles, monuments: [{ id: rec.id, name: 'Нарвские триумфальные ворота', x, z, h: 31 }], photoSpots: [] };
  const all = ctx.services.landmarks ||= {};
  (all.monuments ||= []).push(...svc.monuments);
  ctx.services.landmarksNarva = svc;
  return { root, frame: { x, z, rot }, triangles };
}

export function build(ctx) {
  const rec = L.groupMembers('narva-gate').find(b => b.id === 'w73174258');
  if (rec) buildGate(ctx, rec);
}
