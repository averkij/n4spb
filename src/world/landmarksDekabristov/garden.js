// landmarksDekabristov/garden.js - the DECEMBRISTS' GARDEN (Сад Декабристов, the island's namesake; GREEN w16237335, park, 57 137 m2, 417 x 245 m): the grounds of site.js (the mown lawn, 45 walkways of compacted gravel laid as ribbons,
// the planting of lime / maple / birch / ash that keeps clear of the 41 mapped trees and of the wood / playground polygons that environment plants itself, the picket railings w702732780 / w702732781 1.2 m in breakable bays) and:
//  * the OBELISK TO THE EXECUTED DECEMBRISTS n1846769112 (OSM: memorial=stele, material=stone) in its fenced enclosure w1309425609 (7 x 7 m, gate n12124907315): a tapered granite obelisk (7.2 m) on a two-step base on
//    a paved square, a blank bronze plate, flowers; the fence is four breakable bays with the gate gap;
//  * the memorial "Детям блокадного Ленинграда" n5025736127 at the south edge (the Anfisa garden): a granite slab wall with the OSM inscription "ДЕТЯМ БЛОКАДЫ" on a plate;
//  * the 9 benches and 9 litter bins of the data (knock records; props skips the claimed nodes), the benches turned to the nearest alley.
// Heights are generic (OWNER CHECK: the obelisk is drawn 7.2 m, no photo).  Solid on purpose: the obelisk and its base, the memorial wall, the trunks.  Breakable: the railings, the enclosure fence, the benches and bins.
import { buildSite } from './site.js';
import { gardenSite, GARDEN } from './sites.js';
import { monumentById, furnitureInBox, barrierPts } from './data.js';
import { plateMat } from './art.js';
import { inRing } from './plan.js';
import { furnish } from './furniture.js';
import * as MON from './mon.js';
import { fillPolyFine } from './surfaces.js';

export async function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  const S = gardenSite(); if (!S) { console.warn('[landmarksDekabristov] garden: the GREEN polygon w16237335 is missing'); return; }
  const pl = buildSite(K, S);
  // ---- the obelisk in its enclosure
  const ob = monumentById(GARDEN.obelisk);
  if (ob) {
    const ring = Array.from({ length: 16 }, (_, i) => [ob.x + Math.cos(i * Math.PI / 8) * 5.0, ob.z + Math.sin(i * Math.PI / 8) * 5.0]);
    fillPolyFine(P, M.pavers, ring, 0.036, { maxEdge: 3, tile: 2 });
    const fb = barrierPts(GARDEN.fenceBox), rot = fb && fb.length > 1 ? Math.atan2(fb[1][0] - fb[0][0], fb[1][1] - fb[0][1]) : 0;      // the enclosure is turned 11 degrees: the obelisk stands square in it
    P.push(ob.x, 0, ob.z, rot);
    const y = MON.steps(P, M.graniteGrey, 3.4, 3.4, 2, 0.18, 0.4);
    P.box(M.graniteGrey, -0.75, 0.75, y, y + 1.0, -0.75, 0.75, 'b', 2);
    P.quad(M.bronzeGreen, [-0.4, y + 0.3, 0.77], [0.4, y + 0.3, 0.77], [0.4, y + 0.75, 0.77], [-0.4, y + 0.75, 0.77], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    MON.obelisk(P, M.graniteGrey, M.graniteDark, y + 1.0, 7.0, 1.0, 0.5, 0.7);
    MON.bunches(P, M, -0.9, 1.0, 0.45, 0, 5, y, 1);
    P.pop();
    ph.addBox(ob.x, ob.z, 3.4, 3.4, rot, 0, 0.4); ph.addBox(ob.x, ob.z, 1.6, 1.6, rot, 0, 8.0);
    K.svc.monuments.push({ id: ob.id, name: ob.name, x: ob.x, z: ob.z, h: 7.7 });
    K.svc.photoSpots.push({ x: ob.x, z: ob.z + 9, yaw: 0, name: 'Сад Декабристов · Decembrists\' Garden' });
    K.svc.crowd.push({ id: 'garden-obelisk', kind: 'photo', x: ob.x, z: ob.z + 7, r: 6, n: 3 });
  }
  // ---- the memorial to the children of the siege
  const ch = monumentById(GARDEN.children);
  if (ch) {
    const pm = plateMat(ctx, [ch.inscription || 'ДЕТЯМ БЛОКАДЫ'], { ratio: 3.2, key: 'children' }); M.decals.add(pm);
    P.push(ch.x, 0, ch.z, 0);
    MON.steps(P, M.graniteGrey, 4.6, 1.4, 2, 0.15, 0.25);
    P.box(M.graniteGrey, -1.8, 1.8, 0.3, 1.9, -0.25, 0.25, 'b', 2);
    P.box(M.graniteDark, -1.9, 1.9, 1.9, 2.0, -0.3, 0.3, 'b', 2);
    P.quad(pm, [-1.3, 0.95, 0.27], [1.3, 0.95, 0.27], [1.3, 1.77, 0.27], [-1.3, 1.77, 0.27], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    MON.bunches(P, M, -1.2, 0.8, 0.6, 0, 5, 0.3, 7);
    P.pop();
    ph.addBox(ch.x, ch.z, 4.2, 0.8, 0, 0, 2.2);
    K.svc.monuments.push({ id: ch.id, name: ch.name || 'Детям блокадного Ленинграда', x: ch.x, z: ch.z, h: 2.0 });
  }
  // ---- benches and bins of the data inside the polygon
  const b = pl.box, fu = furnitureInBox(b.x0, b.x1, b.z0, b.z1).filter((f) => inRing(pl.ring, f.x, f.z));
  K.svc.furniture = furnish(K, 'garden', { benches: fu.filter((f) => f.kind === 'bench'), bins: fu.filter((f) => f.kind === 'waste_basket') }, pl);
  return pl;
}
