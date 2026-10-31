// landmarksBotanicalGarden/japan.js - the JAPANESE GARDEN (Японский сад, OSM r14150174, x -1448 .. -1372, z -4318 .. -4272, school of Ikenobo, photos 54 56): the structures by position (the garden polygon, its
// lawn, paths and the two ponds w413677927 / w413677928 are the environment's):
//   * the low SLAT FENCE round the garden (OSM w413383847, closed ring, 1.1 m: weathered pickets between square posts, an open gate of two taller posts where the mapped gate n4149525173 is);
//   * the YATSUHASHI plank bridge over the big pond: three offset runs of three planks (1.0 m wide, 0.34 m above the ground) with short square posts at the corners (photo 56);
//   * the PAVILION (an open timber hall on a raised deck, hip roof of grey ceramic tiles with a deep overhang, square posts, a plank back wall and a bench; photo 56 on the right);
//   * two stone lanterns (ishidoro) and a handful of granite boulders on the banks.
// Colliders: the fence runs, the pavilion posts and wall; walk boxes for the bridge and the pavilion deck (+ its two steps).
import { BARRIERS, BARRIER_NODES } from '../data/city.js';
import { Frame } from './frame.js';
import { stage } from './shell.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { revolve } from './geo.js';
import { hipRect } from './roof.js';
import { planRun, at, pairs, panel } from './fence.js';

// the two OSM `building=roof` shelters of the garden (w413384047 7.0 x 4.6 m at (-1408.1, -4294.9), w413742268 4.8 x 4.1 m at (-1408.4, -4305.5)): the roofs ARE the eaves, the module draws a pavilion under each
// (claimed in groups.js so that the generic city stops drawing two bare slabs on poles).  Front (+z, steps) faces west / south, towards the bridge pond and the path.
export const JP_PAV = new Frame(-1408.1, -4294.9, Math.atan2(-0.921, 0.388));
export const JP_PAV2 = new Frame(-1408.4, -4305.5, Math.atan2(0.397, 0.918));
export const BRIDGE = { z0: -4284.1, xc: -1427.6, segs: [{ l: 2.9, dx: 0 }, { l: 2.7, dx: 0.95 }, { l: 2.9, dx: 0 }], w: 1.0, y: 0.34 };
const LANTERNS = [[-1421.8, -4283.3], [-1404.6, -4299.4]];

export function lanternParts(Q, M) {                                              // an ishidoro 1.55 m: base, post, fire box with openings, roof, jewel (grey granite)
  Q.box(M.plinth, -0.3, 0.3, 0, 0.1, -0.3, 0.3, 'b', 1);
  revolve(Q, M.plinth, [[0.0, 0.1], [0.24, 0.1], [0.26, 0.18], [0.2, 0.3], [0.13, 0.4], [0.12, 0.8], [0.2, 0.84], [0.3, 0.92], [0.0, 0.92]], 8, { crease: 50, uRep: 1, vTile: 1 });
  Q.box(M.plinth, -0.19, 0.19, 0.92, 1.18, -0.19, 0.19, 'b', 1);
  for (const [dx, dz] of [[0, 0.195], [0, -0.195], [0.195, 0], [-0.195, 0]]) { if (dx) Q.box(M.iron, dx * 0.99 - 0.004, dx * 0.99 + 0.004, 0.98, 1.12, -0.07, 0.07, ''); else Q.box(M.iron, -0.07, 0.07, 0.98, 1.12, dz * 0.99 - 0.004, dz * 0.99 + 0.004, ''); }
  revolve(Q, M.plinth, [[0.0, 1.18], [0.46, 1.18], [0.5, 1.26], [0.34, 1.38], [0.12, 1.46], [0.1, 1.5], [0.0, 1.56]], 8, { crease: 50, uRep: 1, vTile: 1 });
}
function stakeParts(Q, M) { Q.box(M.timber, -0.05, 0.05, 0, 1.15, -0.05, 0.05, 'b', 1); Q.box(M.timber, -0.07, 0.07, 1.15, 1.21, -0.07, 0.07, '', 1); }
function gatePostParts(Q, M) {
  Q.box(M.timber, -0.1, 0.1, 0, 1.85, -0.1, 0.1, 'b', 1); Q.box(M.timber, -0.15, 0.15, 1.85, 1.95, -0.15, 0.15, '', 1);
  Q.cyl(M.kawara, [0, 1.95, 0], [0, 2.2, 0], 0.18, 0.0, 4, false);
}

function pavilion(K, fr, spec) {
  const P = K.P, M = K.M, ph = K.ctx.physics;
  P.push(fr.cx, 0, fr.cz, fr.rot);
  const { hx, hz, dk, py, over, rise, bench } = spec, nst = dk > 0.4 ? 2 : 1;
  // the deck: granite kerb + plank floor, two steps at the front
  P.box(M.plinth, -hx - 0.15, hx + 0.15, 0, dk - 0.05, -hz - 0.15, hz + 0.15, 'b', 2);
  P.quad(M.planks, [-hx, dk, hz], [hx, dk, hz], [hx, dk, -hz], [-hx, dk, -hz], [0, 1, 0], [[-hx, hz], [hx, hz], [hx, -hz], [-hx, -hz]]);
  const sw = Math.min(1.2, hx - 0.5);
  for (let k = 1; k <= nst; k++) P.box(M.plinth, -sw, sw, 0, dk - k * 0.15, hz + 0.15 + (k - 1) * 0.35, hz + 0.15 + k * 0.35, 'b', 2);
  // posts, beams, the back wall of planks and a bench
  const postsAt = [[-hx + 0.25, -hz + 0.3], [0, -hz + 0.3], [hx - 0.25, -hz + 0.3], [-hx + 0.25, hz - 0.3], [hx - 0.25, hz - 0.3]];            // the middle of the front is open (the steps)
  for (const [x, z] of postsAt) P.box(M.timber, x - 0.11, x + 0.11, dk, dk + py, z - 0.11, z + 0.11, 'b', 1);
  for (const z of [-hz + 0.3, hz - 0.3]) P.box(M.timber, -hx, hx, dk + py, dk + py + 0.28, z - 0.14, z + 0.14, '', 1);
  for (const x of [-hx + 0.25, 0, hx - 0.25]) P.box(M.timber, x - 0.12, x + 0.12, dk + py, dk + py + 0.24, -hz, hz, '', 1);
  P.box(M.planks, -hx + 0.25, hx - 0.25, dk, dk + py, -hz + 0.1, -hz + 0.2, 'b', 1.2);
  if (bench) P.box(M.timber, -hx + 0.4, hx - 0.4, dk + 0.4, dk + 0.47, -hz + 0.2, -hz + 0.75, '', 1);
  // the hip roof of grey ceramic tiles, eaves `over` beyond the posts (the OSM roof ring is the eaves line)
  hipRect(P, M.kawaraD, -hx, hx, -hz, hz, dk + py + 0.28, rise, { over, tile: 1.2 });       // double-sided: the player stands on the deck and looks up at the underside of the roof
  P.pop();
  const c = fr.w(0, 0);
  ph.addWalkBox(c[0], c[1], 2 * hx, 2 * hz, fr.rot, dk);
  for (let k = 1; k <= nst; k++) { const p = fr.w(0, hz + 0.15 + (k - 0.5) * 0.35); const it = ph.addWalkBox(p[0], p[1], 2 * sw, 0.37, fr.rot, dk - k * 0.15); it.sticky = true; }
  for (const [x, z] of postsAt) { const p = fr.w(x, z); ph.addCylinder(p[0], p[1], 0.13, dk, dk + py); }
  const bw = fr.w(0, -hz + 0.15); ph.addBox(bw[0], bw[1], 2 * hx - 0.4, 0.2, fr.rot, dk, dk + py);
}

function bridge(K) {
  const P = K.P, M = K.M, ph = K.ctx.physics, B = BRIDGE;
  let z = B.z0, prevX = null;
  for (const s of B.segs) {
    const x = B.xc + s.dx, z1 = z - s.l;
    // the plank deck: a box 1.0 x 0.14, the top at y; planks along the run (uv v along it)
    P.box(M.planks, x - B.w / 2, x + B.w / 2, B.y - 0.14, B.y, z1, z, 'b', 1.0);
    P.box(M.timber, x - B.w / 2 + 0.08, x - B.w / 2 + 0.2, B.y - 0.3, B.y - 0.14, z1 + 0.1, z - 0.1, '', 1);                      // the two stringers under the planks
    P.box(M.timber, x + B.w / 2 - 0.2, x + B.w / 2 - 0.08, B.y - 0.3, B.y - 0.14, z1 + 0.1, z - 0.1, '', 1);
    for (const [px, pz] of [[x - B.w / 2 - 0.02, z - 0.12], [x + B.w / 2 + 0.02, z1 + 0.12]]) P.box(M.timber, px - 0.07, px + 0.07, -0.25, B.y + 0.22, pz - 0.07, pz + 0.07, 'b', 1);          // short square posts at the corners
    ph.addWalkBox(x, (z + z1) / 2, B.w, s.l + 0.04, 0, B.y);
    prevX = x; z = z1;
  }
  void prevX;
}

function stoneWork(K) {
  const P = K.P, M = K.M, ph = K.ctx.physics, rng = K.ctx.rng(4417);
  const lan = partsGeos((Q) => lanternParts(Q, M));
  K.extraTris += addInstanced(K.ctx, K.root, 'bg-jp-lanterns', lan, LANTERNS.map(([x, z], i) => mat4(x, 0, z, i * 1.1, 1))).tris;
  for (const [x, z] of LANTERNS) ph.addCylinder(x, z, 0.4, 0, 1.6);
  // boulders on the banks of the two ponds: irregular granite lumps
  const spots = [[-1432.6, -4287.4, 0.9], [-1430.4, -4291.9, 0.7], [-1422.0, -4290.6, 0.8], [-1427.6, -4283.9, 0.5], [-1426.0, -4293.0, 0.6], [-1417.6, -4293.6, 0.5], [-1415.3, -4300.8, 0.8], [-1412.2, -4297.4, 0.6], [-1421.6, -4285.2, 0.4]];
  for (const [x, z, r] of spots) {
    const g = new K.THREE.IcosahedronGeometry(r, 1), p = g.attributes.position;
    const hs = (x, y, z) => { const h = Math.sin(Math.round(x * 50) * 127.1 + Math.round(y * 50) * 311.7 + Math.round(z * 50) * 74.7 + r * 13) * 43758.5453; return h - Math.floor(h); };      // a hash of the POSITION: the duplicated vertices of the non-indexed icosahedron move together (no cracks)
    for (let i = 0; i < p.count; i++) { const k = 0.8 + hs(p.getX(i), p.getY(i), p.getZ(i)) * 0.4; p.setXYZ(i, p.getX(i) * k * 1.1, p.getY(i) * k * 0.62, p.getZ(i) * k); }
    g.computeVertexNormals();
    P.geo(M.boulder, g, x, r * 0.3, z, 0, rng() * 6, 0); g.dispose();                // mid-grey granite (photos 54 56); the pale 'plinth' tint read as snowballs
    ph.addCylinder(x, z, r * 0.8, 0, r * 0.7);
  }
}

function slatFence(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics;
  const b = BARRIERS.find((q) => q.id === 'w413383847'); if (!b) return;
  const pts = pairs(b.pts); pts.push(pts[0].slice());
  const gates = BARRIER_NODES.filter((n) => n.kind === 'gate' && Math.hypot(n.x - -1417.5, n.z - -4280.9) < 12).map((n) => ({ id: n.id, x: n.x, z: n.z, closed: false }));
  const net = ctx.services.streets && ctx.services.streets.net, onRoad = (x, z) => !!net && net.cover(x, z, {}) > -0.3;
  const plan = planRun(pts, gates), { info, nodes } = plan, stakes = [], gposts = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i], p = at(info, Math.min(info.len - 1e-3, n.s)), rot = Math.atan2(-p.dz, p.dx);
    if (!onRoad(p.x, p.z)) (n.kind === 'gate' ? gposts : stakes).push(mat4(p.x, 0, p.z, rot, 1));
    if (i + 1 < nodes.length) {
      const m = nodes[i + 1], mid = (n.s + m.s) / 2;
      if (plan.open.some((o) => mid > o.s - o.half && mid < o.s + o.half)) continue;
      const a = at(info, n.s + 0.06), c = at(info, m.s - 0.06), la = Math.hypot(c.x - a.x, c.z - a.z);
      if (la < 0.3) continue;
      panel(P, M.picket, a, c, 0.05, 1.1);
      ph.addBox((a.x + c.x) / 2, (a.z + c.z) / 2, la + 0.08, 0.14, Math.atan2(-(c.z - a.z), c.x - a.x), 0, 1.15);
    }
  }
  const sg = partsGeos((Q) => stakeParts(Q, M)), gg = partsGeos((Q) => gatePostParts(Q, M));
  K.extraTris += addInstanced(ctx, K.root, 'bg-jp-stakes', sg, stakes).tris + addInstanced(ctx, K.root, 'bg-jp-gateposts', gg, gposts).tris;
  for (const m of gposts) ph.addCylinder(m.elements[12], m.elements[14], 0.17, 0, 2.0);
  K.svc.fences = (K.svc.fences || []).concat([{ id: 'w413383847', pts, h: 1.1, kind: 'slat' }]);
  K.svc.gates = (K.svc.gates || []).concat(plan.open.map((o) => { const g = at(info, o.s); return { id: o.g.id, x: g.x, z: g.z, rot: Math.atan2(-g.dz, g.dx), closed: false, half: o.half }; }));
}

export function build(K) {
  stage(K, 'pavilion', () => pavilion(K, JP_PAV, { hx: 2.8, hz: 1.55, dk: 0.45, py: 2.75, over: 0.75, rise: 1.45, bench: true }));
  stage(K, 'pavilion2', () => pavilion(K, JP_PAV2, { hx: 1.7, hz: 1.3, dk: 0.3, py: 2.5, over: 0.7, rise: 1.2, bench: false }));
  stage(K, 'bridge', () => bridge(K));
  stage(K, 'stone', () => stoneWork(K));
  stage(K, 'fence', () => slatFence(K));
  const c = JP_PAV.w(0, 6);
  K.svc.monuments.push({ id: 'jp-pavilion', name: 'Павильон Японского сада', x: JP_PAV.cx, z: JP_PAV.cz, h: 5.2 }, { id: 'jp-pavilion-2', name: 'Малый павильон Японского сада', x: JP_PAV2.cx, z: JP_PAV2.cz, h: 4.6 });
  K.svc.photoSpots.push({ x: BRIDGE.xc, z: BRIDGE.z0 + 5, yaw: 0, name: 'Японский сад: мост-ятцухаси через пруд' }, { x: c[0], z: c[1], yaw: Math.round(JP_PAV.rot * 180 / Math.PI), name: 'Японский сад: павильон' });
  if (K.errs && K.errs.length) throw new Error('japan: ' + K.errs.join('\n'));
}
