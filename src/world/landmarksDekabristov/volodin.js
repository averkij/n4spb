// landmarksDekabristov/volodin.js - the SQUARE OF ALEXANDER VOLODIN (сквер Александра Володина, GREEN r10331754, park, 21 763 m2, 189 x 171 m, the Smolenka mouth) with the LIGHT-AND-MUSIC FOUNTAIN (Светомузыкальный фонтан,
// OSM w1396274666, amenity=fountain, a round basin 16 m across at (-7994.7, -2078.9)): the grounds of site.js (the lawn, 15 walkways, the trees along them, the three benches of the data) and the fountain:
//  * the BASIN is WATER, never a wall (docs/AREAS.md 13.7, the Andrew-boulevard recipe): ctx.physics.addWater({ ring, level: 0.30 }) - a walker wades in and a car drives in; the 0.4 m granite rim is drawn and its collider is a
//    ring of 16 breakable GHOST bays (lib/fence-bays.js: a car breaks one off and drives through); the basin floor, the 0.30 m water film, the jets (one tall central plume, eight ring jets, sixteen low jets: static slim cones with
//    foam heads, no collider) and the ring of 24 coloured floor lights (emissive discs: the "light" of the Light-and-Music fountain; no sound: the fountain music is not played) are drawn;
//  * the paved PLAZA round the rim (R 8.6 .. 13.6 m, PAVED_RINGS in groups.js) with six lantern posts (knock records) and the benches turned to the basin.
// The jets and the number of lights are generic (OWNER CHECK: no photo of the real nozzle pattern).  Solid on purpose: nothing (the trunks only); breakable: the rim bays, the lanterns, the benches.
import { buildSite } from './site.js';
import { volodinSite, VOLODIN } from './sites.js';
import { fountainById, furnitureInBox } from './data.js';
import { inRing } from './plan.js';
import { furnish } from './furniture.js';
import { knockBays } from '../lib/fence-bays.js';
import * as G from './geo.js';
import { fillPolyFine } from './surfaces.js';

const N = 28;

export async function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  const f = fountainById(VOLODIN.fountain);
  const S = volodinSite(f); if (!S) { console.warn('[landmarksDekabristov] volodin: the GREEN polygon r10331754 is missing'); return; }
  // the basin first: it is WATER (walkable, drivable), registered BEFORE the planting so that no trunk and no bush with a collider is planted within reach of it (plan.js / forest.js ask ctx.physics.waterLevel)
  let R = 0; const cx = f ? f.x : 0, cz = f ? f.z : 0, ring = (r, n = N) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i * 2 * Math.PI / n) * r, cz + Math.sin(i * 2 * Math.PI / n) * r]);
  if (f) { const o = f.polys[0].o; for (let i = 0; i < o.length; i += 2) R += Math.hypot(o[i] - cx, o[i + 1] - cz); R /= o.length / 2; if (ph.addWater) ph.addWater({ ring: ring(R * 0.97, N).flat(), level: 0.3 }); }    // the mapped radius (8.1 m)
  const pl = buildSite(K, S);
  if (f) {
    const Rin = R - 0.05, Rout = R + 0.55, Rj = R * 0.97;
    // the paved plaza (R + 0.5 .. R + 5.5) with the rim as its hole
    fillPolyFine(P, M.pavers, ring(Rout + 5.0, 36), 0.034, { maxEdge: 3, tile: 2, holes: [ring(Rout - 0.05, 36).reverse()] });
    P.push(cx, 0, cz, 0);
    // the granite rim: outer wall, top, inner wall (inward normals)
    for (let i = 0; i < N; i++) {
      const a0 = i * 2 * Math.PI / N, a1 = (i + 1) * 2 * Math.PI / N, am = (a0 + a1) / 2, pt = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
      P.quad(M.graniteGrey, pt(a0, Rout, 0), pt(a1, Rout, 0), pt(a1, Rout, 0.4), pt(a0, Rout, 0.4), [Math.cos(am), 0, Math.sin(am)], [[i, 0], [i + 1, 0], [i + 1, 0.4], [i, 0.4]]);
      P.quad(M.graniteGrey, pt(a0, Rout, 0.4), pt(a1, Rout, 0.4), pt(a1, Rin, 0.4), pt(a0, Rin, 0.4), [0, 1, 0], [[i, 0], [i + 1, 0], [i + 1, 1], [i, 1]]);
      P.quad(M.graniteGrey, pt(a1, Rin, 0.04), pt(a0, Rin, 0.04), pt(a0, Rin, 0.4), pt(a1, Rin, 0.4), [-Math.cos(am), 0, -Math.sin(am)], [[i + 1, 0], [i, 0], [i, 0.4], [i + 1, 0.4]]);
    }
    P.fan(M.graniteDark, ring(Rin, N).map(([x, z]) => [x - cx, 0.04, z - cz]), [0, 1, 0], (q) => [q[0] / 3, q[2] / 3]);                    // the basin floor
    P.fan(M.water, ring(Rj, N).map(([x, z]) => [x - cx, 0.3, z - cz]), [0, 1, 0], (q) => [q[0] / 3, q[2] / 3]);                         // the water film
    // the floor lights: 24 emissive discs on two rings (colours alternate)
    const L = [M.lightBlue, M.lightRed, M.lightGreen, M.lightWhite];
    for (let i = 0; i < 24; i++) { const r = i % 2 ? R * 0.74 : R * 0.9, a = i * 2 * Math.PI / 24; G.tube(P, L[i % 4], Math.cos(a) * r, Math.sin(a) * r, 0.04, 0.09, 0.2, 0.16, 8, 1, 1, { capTop: L[i % 4] }); }
    // the jets: slim plumes with a foam head: the central one 4.5 m, eight at 0.45 R (2.0 m), sixteen at 0.78 R (0.9 m)
    const jet = (x, z, h) => { G.tube(P, M.foam, x, z, 0.09, 0.09 + h, 0.05, 0.02, 7, 1, 1, {}); G.ball(P, M.foam, x, 0.09 + h, z, 0.1 + h * 0.02, 6); };
    jet(0, 0, 4.5); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; jet(Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.45, 2.0 + (i % 2) * 0.4); }
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 + 0.2; jet(Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.78, 0.9); }
    P.pop();
    // the breakable ghost rim (the water of the basin was registered above)
    const rimR = (Rin + Rout) / 2, vs = ring(rimR, 16), bays = vs.map((a, i) => { const b = vs[(i + 1) % 16]; return { x0: a[0], z0: a[1], x1: b[0], z1: b[1], y: 0, ghost: true }; });
    knockBays(ctx, { name: 'lmdek-volodin-rim', bays, parts: [], collider: { y0: 0, y1: 0.45, thick: 0.6, e0: 0.1, e1: 0.1 }, far: 300,
      rec: () => ({ kind: 'fence', mass: 900, h: 0.45, r: 0.3, anchored: 14, hitK: 0.3, metal: false, minDv: 0 }) });
    K.svc.monuments.push({ id: f.id, name: f.name || 'Светомузыкальный фонтан', x: cx, z: cz, h: 4.6 });
    K.svc.photoSpots.push({ x: cx, z: cz + Rout + 3.5, yaw: 0, name: 'Светомузыкальный фонтан · Light-and-Music fountain' });
    K.svc.crowd.push({ id: 'volodin-fountain', kind: 'photo', x: cx, z: cz + Rout + 2.5, r: 7, n: 5 });
    // six lantern posts round the plaza, the benches of the data turned to the basin
    const lamps = Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3 + 0.3; return { x: cx + Math.cos(a) * (Rout + 4.0), z: cz + Math.sin(a) * (Rout + 4.0) }; });
    const bb = pl.box, fu = furnitureInBox(bb.x0, bb.x1, bb.z0, bb.z1).filter((q) => q.kind === 'bench' && inRing(pl.ring, q.x, q.z));
    K.svc.furniture = furnish(K, 'volodin', { lamps, benches: fu.map((q) => ({ x: q.x, z: q.z })) }, pl);
  }
  return pl;
}
