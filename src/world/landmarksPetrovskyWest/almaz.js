// landmarksPetrovskyWest/almaz.js - the office of the Almaz shipbuilding company, "Петровский проспект, 26" (OSM r20673867, 3 storeys): a Soviet-era (1930s) three-storey stuccoed block with the long front along the avenue.
// Photo refs/petrovsky-zhdanovka-2026/misc/m09_almaz26 (viewed from the carriageway): yellow stucco piers and white recessed panels each with a PAIR of windows, a darker ground floor with grilled windows, a flat roof with a
// stuccoed parapet; left of the middle a flat CANOPY over the entrance (glass doors, three granite steps) carrying the plain wordmark "АЛМАЗ" above it and "СУДОСТРОИТЕЛЬНАЯ ФИРМА" on its fascia; at the corner pier the two-tier STONE
// RELIEF of workers (hard hats, overalls, tools, ring buoys) on the first and second floors.  NOT drawn: the ship emblem and the Red Banner order on the wall (logos), the blue street plate, wires.
// The front is the ring edge (-5366.8,-3249.1) -> (-5328.7,-3237.1) (39.9 m, ten bays of 4.0 m); the other edges use the same bay tiles.  Floors 3.6 m, parapet to 11.4 m (OSM 3 levels).
import * as L from '../layout.js';
import { IDS, ringOf, ringEdges, edgeFrame, toLocal } from './frame.js';
import { wallsOfRing } from './shapes.js';
import { reserve } from './labels.js';

const FL = 3.6, HW = 10.8, HP = 11.4;

export function build(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const ring = ringOf(IDS.almaz);
  if (!ring) return;
  const edges = ringEdges(ring), front = edges.reduce((a, e) => (e.len > a.len ? e : a)), ff = edgeFrame(front);
  P.far = 900;
  // ground floor (darker, grilled) and the two upper floors, edge by edge; the front edge gets the full decoration below
  wallsOfRing(P, ring, 0, FL, M.almazBay0, M.almazBay0, { pitch: 4.0, th: FL, minBay: 3.0 });
  wallsOfRing(P, ring, FL, HW, M.almazBay, M.almazBay, { pitch: 4.0, th: FL, minBay: 3.0 });
  wallsOfRing(P, ring, HW, HP, M.almazBay, M.almazBay, { pitch: 4.0, th: FL, minBay: 3.0, skip: new Set([-1]) });
  // flat roof and parapet band
  let D = 0; for (const p of ring) D = Math.max(D, -toLocal(ff, p[0], p[1]).lz);
  const len = ff.len;
  P.push(ff.S.x, 0, ff.S.z, ff.rot);
  P.quad(M.conc, [0, HP, -D], [len, HP, -D], [len, HP, 0], [0, HP, 0], [0, 1, 0]);
  P.far = 420;
  P.box(M.stone, -0.1, len + 0.1, HW - 0.05, HW + 0.2, 0, 0.35, 'k', 1);                                // the cornice line under the parapet
  // the entrance canopy over bay 3 (x 8..14): flat slab, fascia with the plain wordmark, glass doors, three steps
  const cx0 = 8.2, cx1 = 14.4, cm = (cx0 + cx1) / 2;
  P.box(M.dark, cx0, cx1, 3.45, 3.78, 0, 2.2, 'k', 1);
  const wl = (lx, lz) => ({ x: ff.S.x + lx * ff.t[0] + lz * ff.n[0], z: ff.S.z + lx * ff.t[1] + lz * ff.n[1] });
  const free = (lx, lz, y, w, h, kind) => reserve(ctx, IDS.almaz, wl(lx, lz), y, w, h, ff.n, kind);          // the shared facade-label registry (docs/rules/LABELS-API.md): sign, canopy fascia and relief never overlap a street plate
  if (free(cm, 2.22, 3.62, cx1 - cx0 - 0.2, 0.24, 'sign')) P.quad(M.signs, [cx0 + 0.1, 3.5, 2.22], [cx1 - 0.1, 3.5, 2.22], [cx1 - 0.1, 3.74, 2.22], [cx0 + 0.1, 3.74, 2.22], [0, 0, 1], [[0.02, 0.02], [0.98, 0.02], [0.98, 0.4], [0.02, 0.4]]);
  if (free(cm, 0.06, 4.32, 3.4, 0.85, 'sign')) P.quad(M.signs, [cm - 1.7, 3.9, 0.06], [cm + 1.7, 3.9, 0.06], [cm + 1.7, 4.75, 0.06], [cm - 1.7, 4.75, 0.06], [0, 0, 1], [[0, 0.5], [1, 0.5], [1, 1], [0, 1]]);    // АЛМАЗ
  P.box(M.dark, cm - 1.6, cm + 1.6, 0.2, 3.0, 0, 0.06, 'kb', 1);                                         // the glazed door block (dark)
  P.box(M.stone, cm - 2.0, cm + 2.0, 0, 0.55, 0, 1.2, 'bk', 1.2);
  P.box(M.stone, cm - 2.3, cm + 2.3, 0, 0.35, 1.2, 2.0, 'bk', 1.2);
  for (const x of [cx0 + 0.2, cx1 - 0.2]) P.box(M.conc, x - 0.25, x + 0.25, 0, 3.5, 0, 0.5, 'b', 1);                // the two piers carrying the canopy
  // the two-tier stone relief at the west corner pier (x len-4.4 .. len-1.1) on the first and second floors
  const rx0 = len - 4.5, rx1 = len - 1.1;
  P.far = 380;
  P.box(M.stone, rx0 - 0.18, rx1 + 0.18, FL + 0.55, FL + 0.7, 0, 0.12, 'kb', 1); P.box(M.stone, rx0 - 0.18, rx1 + 0.18, HW - 0.7, HW - 0.55, 0, 0.12, 'kb', 1);
  if (free((rx0 + rx1) / 2, 0.1, (FL + HW) / 2, rx1 - rx0, HW - FL - 1.4, 'art')) P.quad(M.relief, [rx0, FL + 0.7, 0.1], [rx1, FL + 0.7, 0.1], [rx1, HW - 0.7, 0.1], [rx0, HW - 0.7, 0.1], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.box(M.stone, rx0 - 0.18, rx0, FL + 0.55, HW - 0.55, 0, 0.12, 'kb', 1); P.box(M.stone, rx1, rx1 + 0.18, FL + 0.55, HW - 0.55, 0, 0.12, 'kb', 1);
  // street-side downpipes at the piers
  P.far = 300;
  for (const x of [4.0, 20.0, 36.0]) P.cyl(M.conc, [x, 0.1, 0.1], [x, HW - 0.2, 0.1], 0.06, 0.06, 6, false);
  P.pop();
  if (ph) {
    const c = { x: ff.S.x + (len / 2) * ff.t[0] - (D / 2) * ff.n[0], z: ff.S.z + (len / 2) * ff.t[1] - (D / 2) * ff.n[1] };
    ph.addBox(c.x, c.z, len + 0.2, D + 0.2, ff.rot, 0, HP + 0.5);
  }
  K.shared.almaz = { ff, D };
  const pc = { x: ff.S.x + (len / 2) * ff.t[0] + 14 * ff.n[0], z: ff.S.z + (len / 2) * ff.t[1] + 14 * ff.n[1] };
  K.svc.monuments.push({ id: IDS.almaz, name: 'Судостроительная фирма «Алмаз», Петровский проспект, 26', x: ff.S.x + (len / 2) * ff.t[0], z: ff.S.z + (len / 2) * ff.t[1], h: HP });
  K.svc.photoSpots.push({ x: pc.x, z: pc.z, yaw: Math.round(L.yawToward(pc.x, pc.z, ff.S.x + (len / 2) * ff.t[0], ff.S.z + (len / 2) * ff.t[1])), name: 'Петровский проспект, 26: контора «Алмаза» и рельеф рабочих' });
}
