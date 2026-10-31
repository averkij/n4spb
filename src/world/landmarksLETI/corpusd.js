// landmarksLETI/corpusd.js - CORPUS D, the former professors' house of LETI (OSM r11983465: a zig-zag plan, 4 levels = 13.2 m) with the memorial flat of A. S. Popov (flat 33 on the second floor, museum since 1967, POI n649424601).
//   No photograph of the building itself exists in the dossier [?]: the look is an estimate [E] from the pale stucco block that stands beside the war memorial in photo B8 (cream plaster, moulded cornice, plain windows with white
//   frames, an arched blind recess) and from the family of the old campus buildings: a rusticated ground floor (3.6 m, grooved plaster), three upper storeys of 3.2 m with plain window surrounds, a dentilled cornice, a grey hip roof.
//   The memorial-flat entrance is a shut door at the east face near the POI.  Interiors closed.
import { ringOf, IDS } from './frame.js';
import { ringEdges, polyOf, onEdge, localOnEdge } from './kit.js';
import { hipRoof } from './roof.js';
import { offsetRing } from './ring.js';
import { wallRun, rect, bayCentres, stage } from './shell.js';
import { addPolyColliders } from '../lib/massing.js';
import { belt } from './brick.js';

export const CD = { ground: 3.6, storey: 3.2, h: 13.2 };

export function build(K) {
  const ctx = K.ctx, P = K.P, D = K.D, M = K.M;
  const ring = ringOf(IDS.cD);
  if (!ring) throw new Error('r11983465 missing');
  const edges = ringEdges(polyOf(ring, []));
  const cx = ring.reduce((a, p) => a + p[0], 0) / ring.length, cz = ring.reduce((a, p) => a + p[1], 0) / ring.length;
  stage(K, 'walls', () => {
    for (const e of edges) {
      if (e.len < 0.9) continue;
      onEdge(P, e, (L) => onEdge(D, e, () => {
        const m = 1.3, pitch = 3.4, n = L < 2 * m + 0.8 * pitch ? 0 : Math.max(1, Math.round((L - 2 * m) / pitch)), xs = n ? bayCentres(m, L - m, n) : [];
        const gh = [], uh = [];
        for (const c of xs) gh.push(rect(c, 0.95, 1.2, 1.75, 'winR', 0.12));
        for (const c of xs) for (let k = 0; k < 3; k++) uh.push(rect(c, CD.ground + k * CD.storey + 0.75, 1.3, 1.95, 'winR', 0.16));
        wallRun(K, M.drust, 0, L, 0, CD.ground, gh, { depth: 0.5, uvs: 2.4, surround: 'light', sMat: M.dtrim });
        wallRun(K, M.dwall, 0, L, CD.ground, CD.h, uh, { depth: 0.5, uvs: 3.6, surround: 'full', sMat: M.dtrim });
        belt(P, M.dtrim, 0, L, CD.ground - 0.14, CD.ground + 0.14, 0.16, 2.4);                              // the string course over the rusticated floor
        belt(P, M.dtrim, 0, L, CD.ground + 3 * CD.storey - 0.55, CD.h, 0.1, 2.4);                           // the frieze band
        belt(P, M.dtrim, 0, L, CD.h, CD.h + 0.55, 0.5, 2.4);                                                // the cornice
        P.quad(M.dtrim, [0, CD.h + 0.55, 0.5], [L, CD.h + 0.55, 0.5], [L, CD.h + 0.55, 0], [0, CD.h + 0.55, 0], [0, 1, 0], [[0, 0], [L / 2.4, 0], [L / 2.4, 0.2], [0, 0.2]]);
        for (const x of [0.4, L - 0.4]) D.box(M.dtrim, x - 0.4, x + 0.4, 0, CD.h, 0, 0.16, 'kb', 2.4);        // quoin pilasters at the ends
      }));
    }
  });
  stage(K, 'door', () => {                                                                                  // the memorial-flat entrance, east face near the POI (-1595, -4366.7)
    const e = edges.reduce((b, q) => (q.len > 30 && q.n[0] > 0.3 && (!b || q.len > b.len) ? q : b), null);
    if (!e) return;
    const { u } = localOnEdge(e, -1595, -4366.7), x = Math.max(3, Math.min(e.len - 3, u));
    onEdge(P, e, (L, f) => {
      P.box(M.dtrim, x - 1.2, x + 1.2, 0, 3.2, 0.0, 0.28, 'kb', 1);
      P.quad(M.dark, [x - 0.8, 0, 0.3], [x + 0.8, 0, 0.3], [x + 0.8, 2.5, 0.3], [x - 0.8, 2.5, 0.3], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.box(M.dtrim, x - 1.3, x + 1.3, 2.6, 2.85, 0, 0.7, 'k', 1);                                           // a flat canopy slab
      const w = [f.x + f.xa[0] * x + e.n[0] * 2.5, f.z + f.xa[1] * x + e.n[1] * 2.5];
      K.svc.entrances.push({ id: 'leti-cd', x: w[0], z: w[1], rotY: f.rot, name: 'Музей-квартира А. С. Попова: вход', closed: true });
      K.svc.photoSpots.push({ x: w[0] + e.n[0] * 8, z: w[1] + e.n[1] * 8, yaw: Math.round(f.rot * 180 / Math.PI), name: 'ЛЭТИ: профессорский дом (корпус Д), музей-квартира Попова' });
    });
  });
  stage(K, 'roof', () => { hipRoof(P, M.zinc, offsetRing(ring, 0.6), [], CD.h + 0.4, { slope: 0.55, R: 5.0, cell: 2.4, uvs: 1.2 }); });
  stage(K, 'colliders', () => { addPolyColliders(ctx, polyOf(ring, []), 0, 15); });
  K.svc.monuments.push({ id: 'r11983465', name: 'ЛЭТИ, корпус Д (профессорский дом), музей-квартира А. С. Попова', x: cx, z: cz, h: 15 });
  if (K.errs) throw new Error(K.errs.join('\n'));
}
