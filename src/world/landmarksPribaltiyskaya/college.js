// landmarksPribaltiyskaya/college.js - the COLLEGE WING behind the Kirov memorial (КСиПТ, Корабелов 18; OSM w17561581 + parts w611888545 front block 5 levels 20 m, w611888543 rear wing 8 m, w611888540 raised tower part 8 .. 10 m):
// cream limestone plates (#cfc3a3), 12 bays of 6.0 m on the front with 1.0 m pilasters, a granite plinth, four floors of 2.4 x 1.5 m windows, the plain band and the black recessed FRIEZE
// «ПОДВИГУ МОРЯКОВ КРАСНОЗНАМЁННОГО БАЛТИЙСКОГО ФЛОТА / В ВЕЛИКОЙ ОТЕЧЕСТВЕННОЙ ВОЙНЕ 1941 - 1945 г.г. / ★ ГЕРОИЧЕСКОМУ ЭКИПАЖУ КРЕЙСЕРА „КИРОВ“ ★» (38 m, three lines, capitals 0.55 m), the attic ribbon windows.
// A closed building: exterior only, solid.  Dossier docs/research/pribaltiyskaya.md section 8.4, photos 45 52 44 n15.  Frame KF (frame.js): local +z = toward the college, the front face stands at z 72.0 .. 72.2.
import * as L from '../layout.js';
import { KF, COLLEGE, ringOf } from './frame.js';
import { edgesOf, wallQuad, ringBoxes } from './ring.js';

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx;
  const loc = (id, fb) => { const r = ringOf(id, null); return r ? r.map(([x, z]) => { const q = KF.M(x, z); return [q.a, q.b]; }) : fb; };
  const front = loc('w611888545', [[37.8, 87.3], [-34.2, 87.5], [-34.2, 72.2], [37.8, 72.0]]);
  const wing = loc('w611888543', [[35.4, 87.4], [35.5, 149.4], [-31.5, 149.5], [-31.5, 128.3], [29.6, 128.1], [29.6, 123.5], [22.4, 123.5], [22.4, 87.4]]);
  const tower = loc('w611888540', [[27.1, 142.6], [14.5, 142.6], [14.4, 128.2], [27.1, 128.1]]);
  P.push(KF.x, 0, KF.z, KF.rot);
  try {
    // ---- the front block 20 m: the front face (-z) carries the 12-bay facade, the others the plain window grid
    for (const e of edgesOf(front)) {
      if (e.n[1] < -0.9) wallQuad(P, M.college, e.a, e.b, e.n, 0, COLLEGE.h, 0, e.len / 6.0, 0, 1);
      else wallQuad(P, M.collegeSide, e.a, e.b, e.n, 0, COLLEGE.h, 0, e.len / 6.0, 0, COLLEGE.h / 5.8);
    }
    P.cap(M.collegeRoof, front, COLLEGE.h, true, 4);
    P.box(M.kcap, -34.3, 37.9, COLLEGE.h, COLLEGE.h + 0.5, 72.05, 72.35, '', 2);                                  // the cornice course
    // ---- the rear wing 8 m (L-shaped) and the raised tower part 8 .. 10 m
    for (const e of edgesOf(wing)) { const my = (e.a[1] + e.b[1]) / 2; if (my < 87.9) continue; wallQuad(P, M.collegeSide, e.a, e.b, e.n, 0, 8, 0, e.len / 6.0, 0, 8 / 5.8); }
    P.cap(M.collegeRoof, wing, 8, true, 4);
    for (const e of edgesOf(tower)) wallQuad(P, M.collegeSide, e.a, e.b, e.n, 8, 10, 0, e.len / 6.0, 8 / 5.8, 10 / 5.8);
    P.cap(M.collegeRoof, tower, 10, true, 4);
    // ---- the frieze: black capitals 0.55 m on the plain band (y 15.2 .. 18.3), 38 m long, centred on the axis of the wing (x 1.85); reading from the memorial (looking +z) runs toward -x
    const cx = (COLLEGE.x0 + COLLEGE.x1) / 2, zf = 72.1 - 0.05, y0 = 15.2, y1 = 18.3, hw = 19;
    P.quad(M.frieze, [cx + hw, y0, zf], [cx - hw, y0, zf], [cx - hw, y1, zf], [cx + hw, y1, zf], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  } finally { P.pop(); }
  const c = KF.W(cx0(), 72.05), nx = -KF.B[0], nz = -KF.B[1];
  const labels = ctx.services && ctx.services.labels;
  if (labels && labels.reserve) labels.reserve('w17561581', c.x, (15.2 + 18.3) / 2, c.z, 38, 3.1, nx, nz, 'frieze');
  const ph = ctx.physics;
  ringBoxes(ph, KF, front, 0, 22, 0.8, true); ringBoxes(ph, KF, wing, 0, 10, 0.8, true); ringBoxes(ph, KF, tower, 0, 12, 0.8, true);
  const m = KF.W((COLLEGE.x0 + COLLEGE.x1) / 2, (COLLEGE.z0 + COLLEGE.z1) / 2);
  K.svc.monuments.push({ id: 'w17561581', name: 'Колледж судостроения и прикладных технологий (фриз памятника крейсеру «Киров»)', x: m.x, z: m.z, h: 20 });
  void L;
}
const cx0 = () => (COLLEGE.x0 + COLLEGE.x1) / 2;
