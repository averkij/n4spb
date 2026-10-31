// landmarksYelaginSpits/lions.js - the two Pudost limestone lions of the spit (18th century, from the Stroganov dacha, restored 1925 and 2004; paw on a ball; photos spit 01, 10, 13-15, 17-21, 26-28).
// Built with the figure kit (lib/figures.js `lion`, pose 'walk' with a ball: the right forepaw rests on a stone ball, the body is long and low, the mane falls in thick locks); the kit figure faces +z, so the north
// lion turns +90 deg (looks along the wall to the SOUTH lion) with the head turned toward the terrace; the south lion is the MIRROR IMAGE (a mirrored copy of the geometry, so its ball paw is on the water
// side too) and faces north.  Whitewashed limestone (#e6e2d8), black-brown eyes and nostrils.  Two detail levels (shared by both): near (5-6 k triangles each) up to 120 m, far (2.9 k) up to 450 m.
// Scale 1.0 (broadened x1.1 and lowered x0.92 against the slender kit lion, review 2026-10-13): with the head and the ball the figure is 2.25 m long, 1.33 m high on a 2.08 m slab (the dossier says 1.8 m, taken for the length).
import * as THREE from 'three';
import { lion, cached } from '../lib/figures.js';
import { TERRACE, PLINTH, PLINTH_CZ } from './frame.js';
import { CORNERS } from './wall.js';

const SCALE = 1.0, SX = 1.1, SY = 0.92;      // the kit lion is slender-legged: a little broader and lower is closer to the heavy Pudost lions of photos 13-15, 28
const make = (detail) => lion({ pose: 'walk', ball: true, head: { turn: 0.5, pitch: 0.2, open: 0.2 }, detail, mane: 1.3, maneCount: 70, fullMane: true, headScale: 1.5, tail: 'curl' });

/** x -> -x copy of a kit figure's geometries (winding reversed): the south lion */
function mirrored(fig) {
  const geos = {};
  for (const [k, g] of Object.entries(fig.geos)) {
    const m = g.clone(), p = m.attributes.position, n = m.attributes.normal;
    for (let i = 0; i < p.count; i++) { p.setX(i, -p.getX(i)); n.setX(i, -n.getX(i)); }
    const ix = m.index; for (let i = 0; i < ix.count; i += 3) { const t = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, t); }
    p.needsUpdate = n.needsUpdate = ix.needsUpdate = true; m.computeBoundingBox(); m.computeBoundingSphere(); geos[k] = m;
  }
  return { geos, tris: fig.tris };
}
const boxOf = (fig) => { const b = new THREE.Box3(); for (const g of Object.values(fig.geos)) { if (!g.boundingBox) g.computeBoundingBox(); b.union(g.boundingBox); } return b; };

/** place both lions into the collector P (a near or a far one); detail 0.7 = near, 0.3 = far */
export function placeLions(P, M, detail) {
  const north = cached('lmYS-lion-' + detail, () => make(detail)), south = cached('lmYS-lion-' + detail + 'm', () => mirrored(north));
  const ytop = TERRACE + PLINTH.h + PLINTH.slabH;
  for (const c of CORNERS) {
    const fig = c.sx > 0 ? north : south, th = c.sx > 0 ? Math.PI / 2 : -Math.PI / 2;
    const bb = boxOf(fig), ctr = new THREE.Vector3((bb.min.x + bb.max.x) / 2 * SX, 0, (bb.min.z + bb.max.z) / 2).multiplyScalar(SCALE).applyAxisAngle(new THREE.Vector3(0, 1, 0), th);
    const sx = (c.sx > 0 ? PLINTH.w : -PLINTH.w) / 2;                                   // slab centre in the corner frame
    P.push(c.a, 0, c.b, c.psi);
    for (const [key, g] of Object.entries(fig.geos)) P.geo(key === 'dark' ? M.lionDark : M.lime, g, sx - ctr.x, ytop, PLINTH_CZ - ctr.z, 0, th, 0, SCALE * SX, SCALE * SY, SCALE);
    P.pop();
  }
}
