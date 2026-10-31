// landmarksBotanicalGarden/gazebo.js - the GAZEBO of the park (OSM w141260379, a 7 m round roof beside the ponds east of the Palm House at (-1271, -4093); photo D9 "Ботанический сад, беседка"):
//   an octagonal timber pavilion with six red-brown posts, a railing of crossed bars all round with one opening, a bench ring inside and a low pyramidal roof of grey sheet metal with a plain finial
//   (no flag), standing on a granite-edged platform 0.55 m high with three steps (the real one sits on a mound with a stair: the ground here is flat, so the mound is reduced to the platform).
//   Frame GZ: centre (-1271.1, -4093.2); the opening and the steps face the south-west (towards the ponds).
import { Frame } from './frame.js';
import { stage } from './shell.js';

export const GZ = new Frame(-1271.1, -4093.2, -0.5236);
const R = 3.3, Y0 = 0.55, HP = 2.55, N = 8;

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics;
  stage(K, 'gazebo', () => {
    P.push(GZ.cx, 0, GZ.cz, GZ.rot);
    // the platform: an octagonal slab with a granite edge, three steps towards +z
    const pts = Array.from({ length: N }, (_, i) => { const a = i * Math.PI * 2 / N + Math.PI / N; return [(R + 0.55) * Math.sin(a), (R + 0.55) * Math.cos(a)]; });
    P.cap(M.plinth, pts, Y0, true, 3);
    for (let i = 0; i < N; i++) { const a = pts[i], b = pts[(i + 1) % N], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); P.quad(M.plinth, [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], Y0, b[1]], [a[0], Y0, a[1]], [-dz / l, 0, dx / l], [[0, 0], [l / 3, 0], [l / 3, 0.2], [0, 0.2]]); }
    for (let k = 1; k <= 3; k++) P.box(M.plinth, -1.0, 1.0, 0, Y0 - k * 0.1375, 3.5 + (k - 1) * 0.4, 3.5 + k * 0.4, 'b', 3);
    // posts at the 8 corners (the facet at +z is the entrance: its two posts are shorter railings-free), railing between neighbours except the entrance facet
    const corner = (i) => { const a = i * Math.PI * 2 / N + Math.PI / N; return [R * Math.sin(a), R * Math.cos(a)]; };
    const cs = Array.from({ length: N }, (_, i) => corner(i));
    for (const c of cs) { P.box(M.timber, c[0] - 0.09, c[0] + 0.09, Y0, Y0 + HP, c[1] - 0.09, c[1] + 0.09, 'b', 1); P.box(M.timber, c[0] - 0.14, c[0] + 0.14, Y0 + HP - 0.25, Y0 + HP, c[1] - 0.14, c[1] + 0.14, '', 1); }
    for (let i = 0; i < N; i++) {
      const a = cs[i], b = cs[(i + 1) % N], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      if (mz > R * 0.9) continue;                                                // the entrance facet
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx);
      P.push(mx, Y0, mz, rot);
      P.box(M.timber, -l / 2, l / 2, 0.82, 0.92, -0.05, 0.05, '', 1); P.box(M.timber, -l / 2, l / 2, 0.3, 0.38, -0.05, 0.05, '', 1);
      for (let k = -2; k <= 2; k++) P.box(M.timber, k * l / 5.4 - 0.025, k * l / 5.4 + 0.025, 0.38, 0.82, -0.03, 0.03, '', 1);
      P.box(M.timber, -l / 2, l / 2, 2.1, 2.3, -0.05, 0.05, '', 1);                       // the frieze beam under the roof
      P.pop();
    }
    // the roof: an octagonal pyramid with 0.45 m eaves
    const ey = Y0 + HP, ap = [0, ey + 1.5, 0], eaves = Array.from({ length: N }, (_, i) => { const a = i * Math.PI * 2 / N + Math.PI / N; return [(R + 0.55) * Math.sin(a), ey - 0.1, (R + 0.55) * Math.cos(a)]; });
    for (let i = 0; i < N; i++) { const a = eaves[i], b = eaves[(i + 1) % N], am = (i + 0.5) * Math.PI * 2 / N + 0; void am; P.fan(M.zincD, [a, b, ap], [(a[0] + b[0]) / 2, 1.6, (a[2] + b[2]) / 2], (p) => [p[0] / 1.2, p[2] / 1.2]); }
    P.cyl(M.iron, [0, ey + 1.5, 0], [0, ey + 2.1, 0], 0.05, 0.0, 5, false);
    // the benches round the inside: two curved plank seats on the back facets
    for (const s of [-1, 1]) P.box(M.timber, s * 2.0 - 0.9, s * 2.0 + 0.9, Y0 + 0.42, Y0 + 0.5, -2.2, -1.7, '', 1);
    P.pop();
  });
  stage(K, 'colliders', () => {
    ph.addWalkBox(GZ.cx, GZ.cz, 7.0, 7.0, GZ.rot, Y0);
    const cs = Array.from({ length: N }, (_, i) => { const a = i * Math.PI * 2 / N + Math.PI / N; return GZ.w(R * Math.sin(a), R * Math.cos(a)); });
    for (const c of cs) ph.addCylinder(c[0], c[1], 0.2, 0, Y0 + HP);
    for (let i = 0; i < N; i++) {
      const a = cs[i], b = cs[(i + 1) % N], loc = GZ.l((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); if (loc[1] > R * 0.9) continue;
      ph.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.hypot(b[0] - a[0], b[1] - a[1]), 0.14, Math.atan2(-(b[1] - a[1]), b[0] - a[0]), 0, Y0 + 1.0);
    }
    const st = [1, 2, 3].map((k) => ({ k }));
    for (const { k } of st) { const p = GZ.w(0, 3.5 + (k - 0.5) * 0.4); const it = ph.addWalkBox(p[0], p[1], 2.0, 0.44, GZ.rot, Y0 - k * 0.1375); it.sticky = true; }
  });
  K.svc.monuments.push({ id: 'w141260379', name: 'Беседка Ботанического сада', x: GZ.cx, z: GZ.cz, h: 5 });
  K.svc.photoSpots.push({ x: GZ.w(0, 14)[0], z: GZ.w(0, 14)[1], yaw: Math.round(GZ.rot * 180 / Math.PI), name: 'Беседка в Ботаническом саду' });
  if (K.errs && K.errs.length) throw new Error('gazebo: ' + K.errs.join('\n'));
}
