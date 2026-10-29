// landmarksDekabristov/sites.js - the SITE records of the module (what site.js builds from): the Smolensky Lutheran cemetery (GREEN r7738342), the Smolensky Armenian cemetery (r7738341), the memorial cemetery of the siege
// "Ostrov Dekabristov" (w23426250), the Decembrists' garden (w16237335) and the square of Alexander Volodin (r10331754).  Every ring, way, fence and gate is READ from the data of the area (data/city.js: the real OSM
// ids, completed by the DK fetch of docs/research/dekabristov-data.md); what the data does not say (the fence height, the style of the graves, the tree mix) is a generic choice listed in docs/gdm-D1.md for the owner.
import { greenRing, barrierPts, gatesInBox, monumentById } from './data.js';
import { hash2 } from './util.js';
import { segDist, inRing } from './plan.js';

const vnoise = (x, z, s, seed) => { const gx = Math.floor(x / s), gz = Math.floor(z / s), fx = x / s - gx, fz = z / s - gz, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz); const h = (a, b) => hash2(gx + a, gz + b, seed); return (h(0, 0) * (1 - u) + h(1, 0) * u) * (1 - w) + (h(0, 1) * (1 - u) + h(1, 1) * u) * w; };
const bboxOf = (ring) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of ring) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); } return [x0, x1, z0, z1]; };
const edgeDist = (ring, x, z) => { let best = 1e9; for (let i = 0; i < ring.length; i++) best = Math.min(best, segDist(x, z, ring[i], ring[(i + 1) % ring.length])); return best; };
/** the gate nodes of the data that lie in the site or on its fence (within `m` m of its ring): fence.js opens the ones that sit on a fence run (2.5 m), the others only keep the grave planner clear */
const gatesOf = (ring, m = 6) => { const b = bboxOf(ring); return gatesInBox(b[0] - m, b[1] + m, b[2] - m, b[3] + m).filter((g) => inRing(ring, g.x, g.z) || edgeDist(ring, g.x, g.z) < m).map((g) => ({ id: g.id, x: g.x, z: g.z, closed: g.access === 'private' || g.access === 'no' })); };
const runOf = (id, kind, h) => { const pts = barrierPts(id); return pts && pts.length > 1 ? [{ id, pts, kind, h }] : []; };
const famMix = (h, edgeD) => { if (h < 0.3) return 'limeA'; if (h < 0.55) return 'mapleA'; if (h < 0.72) return 'birchA'; if (h < 0.8) return 'ash'; if (h < 0.88) return 'elm'; if (h < 0.93) return 'oak'; return 'spruceA'; };
const famPark = (h) => { if (h < 0.34) return 'limeA'; if (h < 0.6) return 'mapleA'; if (h < 0.78) return 'birchA'; if (h < 0.9) return 'ash'; return 'elm'; };
const famLawn = (h) => { if (h < 0.4) return 'birchA'; if (h < 0.7) return 'limeA'; if (h < 0.9) return 'mapleA'; return 'spruceA'; };

// ------------------------------------------------------------------------------------------------ the Lutheran cemetery
/** the named graves of the data (MONUMENTS tombs / memorials inside the polygon): clear discs for the grave planner, and the list for lutheran.js */
export const LUTHERAN_NAMED = ['n13002399501', 'n13002359701', 'n13002362201', 'n14155179601', 'n6558720506'];
export const GAZEBO = { id: 'w1167374971', poi: 'n9798534217', x: -5312.7, z: -1907.3 };
export function lutheranSite() {
  const ring = greenRing('r7738342'); if (!ring) return null;
  const named = LUTHERAN_NAMED.map(monumentById).filter(Boolean);
  const discs = [...named.map((m) => [m.x, m.z, m.id === 'n13002362201' ? 6 : 4.5]), [GAZEBO.x, GAZEBO.z, 6.5]];
  const gates = gatesOf(ring); for (const g of gates) discs.push([g.x, g.z, 3.4]);
  const zoneAt = (x, z) => { const d = Math.hypot(x - -5440, z - -2038); if (d < 40) return 'A'; if (vnoise(x, z, 70, 7) > 0.78 && z < -1850) return 'D'; return 'C'; };
  const densityAt = (x, z, zone) => { let d = 430 * (0.6 + 0.8 * vnoise(x, z, 45, 3)); if (zone === 'D') d = Math.max(d, 240) * 1.4; return d; };
  return {
    key: 'lutheran', id: 'r7738342', ring, discs, seed: 0, treeSP: 8, treeKeep: 0.95, treeFam: famMix, treeS: [1.05, 0.7], shrubKeep: 0.34,
    floor: { }, zoneAt, lawnAt: () => 0,
    fence: { runs: [...runOf('w10707043', 'bars', 1.8), ...runOf('w605081790', 'brick', 2.0)], gates },
    graves: { zoneAt, densityAt, fillReach: 46, farFill: 0.6, fillK: 0.55, minEdge: 3.5, waterClear: 9, rows: { A: 2, C: 2, D: 2 } },      // two rows at the alleys and a thin fill all over the blocks (the 18 mapped footways of 9.5 ha leave 80 m wide blocks); ~4 k colliders
  };
}

// ------------------------------------------------------------------------------------------------ the Armenian cemetery
export const ARMENIAN_CHURCH = { id: 'w111944528', x: -5443.6, z: -1730.6 };
export function armenianSite() {
  const ring = greenRing('r7738341'); if (!ring) return null;
  const gates = gatesOf(ring, 5), discs = [[ARMENIAN_CHURCH.x, ARMENIAN_CHURCH.z, 15]]; for (const g of gates) discs.push([g.x, g.z, 3.4]);
  const zoneAt = (x, z) => (Math.hypot(x - ARMENIAN_CHURCH.x, z - ARMENIAN_CHURCH.z) < 45 ? 'A' : 'C');
  const densityAt = (x, z) => 330 * (0.6 + 0.8 * vnoise(x, z, 30, 5));
  return {
    key: 'armenian', id: 'r7738341', ring, discs, seed: 100, treeSP: 9, treeKeep: 0.8, treeFam: (h) => famPark(h), treeS: [1.0, 0.6], shrubKeep: 0.2,
    floor: { }, zoneAt, lawnAt: (x, z) => (Math.hypot(x - ARMENIAN_CHURCH.x, z - ARMENIAN_CHURCH.z) < 22 ? 0.8 : 0.15),
    fence: { runs: runOf('w29044231', 'bars', 1.8), gates },
    graves: { zoneAt, densityAt, fillReach: 24, farFill: 0.3, fillK: 0.4, minEdge: 3.0, waterClear: 9 },
  };
}

// ------------------------------------------------------------------------------------------------ the siege memorial cemetery
export const SIEGE = {
  obelisk: 'n3188963779', sub: 'n1861951657', chaes: 'n3188961906',
  graves: ['n11510705243', 'n11510705244', 'n11510705245', 'n11510705246', 'n11510705247', 'n11510705248', 'n11510705249', 'n3188961950'],
};
export function siegeSite() {
  const ring = greenRing('w23426250'); if (!ring) return null;
  const gates = gatesOf(ring, 6), discs = [];
  for (const id of [SIEGE.obelisk, SIEGE.sub, SIEGE.chaes]) { const m = monumentById(id); if (m) discs.push([m.x, m.z, id === SIEGE.obelisk ? 12 : 7]); }
  for (const id of SIEGE.graves) { const m = monumentById(id); if (m) discs.push([m.x, m.z, 6.5]); }
  for (const g of gates) discs.push([g.x, g.z, 3.6]);
  return {
    key: 'siege', id: 'w23426250', ring, discs, seed: 200, treeSP: 12, treeKeep: 0.6, treeFam: famLawn, treeS: [1.0, 0.6], shrubKeep: 0.05, alleyShrubKeep: 0.25,
    floor: { }, zoneAt: () => 'D', lawnAt: () => 0.95, edgeClear: 3.0,
    fence: { runs: runOf('w23426250', 'rail', 1.3), gates },
    graves: false,
  };
}

// ------------------------------------------------------------------------------------------------ the Decembrists' garden
export const GARDEN = { obelisk: 'n1846769112', children: 'n5025736127', fenceBox: 'w1309425609', gate: 'n12124907315' };
export function gardenSite() {
  const ring = greenRing('w16237335'); if (!ring) return null;
  const ob = monumentById(GARDEN.obelisk), ch = monumentById(GARDEN.children), gates = gatesOf(ring, 5), discs = [];
  if (ob) discs.push([ob.x, ob.z, 9]);
  if (ch) discs.push([ch.x, ch.z, 6]);
  for (const g of gates) discs.push([g.x, g.z, 3]);
  return {
    key: 'garden', id: 'w16237335', ring, discs, seed: 300, treeSP: 9, treeKeep: 0.85, treeFam: famPark, treeS: [0.95, 0.6], shrubKeep: 0.12, alleyShrubKeep: 0.35, minHw: 1.2,
    floor: { }, zoneAt: () => 'E', lawnAt: () => 0.92, edgeClear: 2.0,
    fence: { runs: [...runOf('w702732780', 'rail', 1.2), ...runOf('w702732781', 'rail', 1.2), ...runOf(GARDEN.fenceBox, 'bars', 1.3)], gates },
    graves: false,
  };
}

// ------------------------------------------------------------------------------------------------ the Volodin square
export const VOLODIN = { fountain: 'w1396274666' };
export function volodinSite(fountain) {
  const ring = greenRing('r10331754'); if (!ring) return null;
  const discs = fountain ? [[fountain.x, fountain.z, 15]] : [];
  return {
    key: 'volodin', id: 'r10331754', ring, discs, seed: 400, treeSP: 9, treeKeep: 0.55, treeFam: famPark, treeS: [0.95, 0.6], shrubKeep: 0.1, alleyShrubKeep: 0.3, minHw: 1.2,
    floor: { }, zoneAt: () => 'E', lawnAt: () => 0.95, edgeClear: 2.0,
    fence: null, graves: false,
  };
}
