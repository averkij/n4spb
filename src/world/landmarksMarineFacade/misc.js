// landmarksMarineFacade/misc.js - the small buildings and the ground marks of the port (dossier 4.4 checkpoints, 4.7, 4.8, 4.9):
//   * the three vehicle CHECKPOINT CANOPIES (flat ribbed grey roof 4.5 m clear on 0.5 m columns, edge beam 1.2 m, a grey panel booth between the lanes; built from the baked corner boxes),
//   * the passport / vehicle inspection hall w157323822 (9 m) and the customs / check halls (7 m, flat roofs), the ~45 small booths, kiosks and sheds as plain flat-roofed boxes with the heights of table 4.9,
//   * the TIP HANGAR w1435530846 (40.2 x 59.2 m, eave 7 m, ridge 11.5 m, white roof, grey metal walls, a lower side wing) and the two yard sheds,
//   * the HELIPAD (28 x 28 m dark asphalt square with the yellow ring d 12 m and the white H, corner brackets, a pale concrete apron clipped at the asphalt) at the tip,
//   * the ROUNDABOUT island (R 8.1 m lawn with a kerb ring and three granite boulders; its mast belongs to masts.js).
// Everything claimed in groups.js ('mf-checkpoints', 'mf-sheds', 'mf-tip') is drawn here and nowhere else.  Solid exteriors, no doors to enter.
import * as THREE from 'three';
import * as L from '../layout.js';
import { FW, FM } from './frame.js';
import { ringOf, obb, prism, rotYOf } from './geo.js';
import { addPolyColliders } from '../lib/massing.js';
import { coverFn, fillPolyClipped } from './surfaces.js';

const BOOTHS = { w1278051836: 3.2, w1278051837: 3.2, w1278051840: 2.8, w1278051841: 3.0, w1278051843: 4.2, w1278069033: 3.0, w1278051834: 3.0, w359652781: 3.0, w1278051830: 2.8, w1278049982: 3.5, w1278050020: 3.0, w704139080: 3.8, w359652779: 3.6, w157323816: 3.8, w1278049978: 3.5, w157323825: 3.2, w157323827: 3.0, w157323828: 3.2, w1278050016: 2.8, w1278049991: 3.6, w704139077: 5.0, w704139079: 3.5 };
const HALLS = { w157323823: 7.0, w981598902: 6.5, w1192416737: 7.0, w1278049986: 7.5, w157323818: 7.0, w157323815: 6.8, w157323814: 6.5, w157323822: 9.0 };
const NW = { w157323820: 5.0, w157323821: 5.0, w1278049994: 4.0, w1168230262: 5.0, w1278050013: 6.0 };
const CANOPIES = ['w359652785', 'w1112880827', 'w359652787'];
const HANGAR = [[-9680.5, -1299.0], [-9628.2, -1326.6], [-9609.4, -1291.2], [-9661.7, -1263.5]];

export function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics, cover = coverFn(ctx);
  const step = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMarineFacade/misc] ${name}:`, e); } };
  const box = (id, h, wall, roof, o = {}) => step(id, () => {
    const ring = ringOf(id); if (!ring) { console.warn('[landmarksMarineFacade/misc] no ring', id); return; }
    prism(P, ring, 0, h, { wall, roof }, { tile: 4, capTile: 4 });
    prism(P, ring, h, h + 0.25, { wall: M.dark }, { tile: 4, skipCap: true });                  // a dark eave line
    addPolyColliders(ctx, { o: ring.flat(), h: [] }, 0, h, 0.6);
    svc.counts.smallBuildings = (svc.counts.smallBuildings || 0) + 1;
  });
  for (const [id, h] of Object.entries(BOOTHS)) box(id, h, id === 'w704139077' || id === 'w704139079' ? M.hallWall : M.shedWall, M.shedRoof);
  box('w359652783', 4.5, M.tentWall, M.shedRoof);
  for (const [id, h] of Object.entries(HALLS)) box(id, h, M.hallWall, id === 'w157323822' ? M.rib : M.hallRoof);
  for (const [id, h] of Object.entries(NW)) box(id, h, id === 'w1168230262' ? M.darkWall : M.shedWall, M.shedRoof);
  // ---------------------------------------------------------------------------------------- the vehicle checkpoint canopies
  for (const id of CANOPIES) step(id, () => {
    const ring = ringOf(id); if (!ring) return;
    const B = obb(ring), hl = B.hl, hw = B.hw;
    P.push(B.cx, 0, B.cz, rotYOf(B.ux, B.uz));
    try {
      P.box(M.rib, -hl, hl, 4.5, 5.2, -hw, hw, '', 3);                                         // the roof slab (ribbed grey panels)
      P.box(M.concrete, -hl, hl, 5.2, 5.9, -hw, hw, 'b', 3);                                    // the 1.5 m edge beam, seen as a pale band
      const nx = Math.max(2, Math.round(2 * hl / 9));
      for (let i = 0; i <= nx; i++) for (const z of [-hw + 0.5, hw - 0.5]) { const x = -hl + 0.5 + (2 * hl - 1.0) * i / nx; P.box(M.concrete, x - 0.25, x + 0.25, 0, 4.5, z - 0.25, z + 0.25, 'b', 1); }
      P.box(M.booth, -3.5, 3.5, 0, 2.6, -1.0, 1.0, 'b', 2); P.box(M.dark, -3.6, 3.6, 2.6, 2.75, -1.1, 1.1, 'b', 2);                // the booth between the lanes
      P.box(M.yellow, -hl + 1.5, -hl + 1.9, 0, 1.1, -hw + 1.3, -hw + 1.7, 'b', 1);                                              // a lift barrier housing at the lane entrance (boom raised: not drawn)
    } finally { P.pop(); }
    const cx = B.cx, cz = B.cz;
    for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const x = cx + B.ux * dx * (hl - 0.5) + B.vx * dz * (hw - 0.5), z = cz + B.uz * dx * (hl - 0.5) + B.vz * dz * (hw - 0.5); ph.addBox(x, z, 0.6, 0.6, 0, 0, 5.2); }
    svc.counts.canopies = (svc.counts.canopies || 0) + 1;
  });
  // ---------------------------------------------------------------------------------------- the tip hangar and the lower wing
  step('hangar', () => {
    const cx = HANGAR.reduce((s, p) => s + p[0], 0) / 4, cz = HANGAR.reduce((s, p) => s + p[1], 0) / 4;
    const a = [HANGAR[1][0] - HANGAR[0][0], HANGAR[1][1] - HANGAR[0][1]], b = [HANGAR[3][0] - HANGAR[0][0], HANGAR[3][1] - HANGAR[0][1]];
    const la = Math.hypot(...a), lb = Math.hypot(...b);                                         // 59.2 x 40.2: the long side is a
    const ux = a[0] / la, uz = a[1] / la;
    P.push(cx, 0, cz, rotYOf(ux, uz));
    try {
      const hl = la / 2, hw = lb / 2, ridge = 11.5, eave = 7.0;
      P.box(M.hangarWall, -hl, hl, 0, eave, -hw, hw, 'tb', 4);
      // the double-pitch roof (ridge along the long axis): two slopes + two gables
      P.quad(M.hangarRoofLit, [-hl - 0.4, eave, -hw - 0.4], [hl + 0.4, eave, -hw - 0.4], [hl + 0.4, ridge, 0], [-hl - 0.4, ridge, 0], [0, 0.9, -0.45], [[0, 0], [la / 4, 0], [la / 4, hw / 4], [0, hw / 4]]);
      P.quad(M.hangarRoofShade, [hl + 0.4, eave, hw + 0.4], [-hl - 0.4, eave, hw + 0.4], [-hl - 0.4, ridge, 0], [hl + 0.4, ridge, 0], [0, 0.9, 0.45], [[0, 0], [la / 4, 0], [la / 4, hw / 4], [0, hw / 4]]);
      for (const sx of [-1, 1]) P.fan(M.hangarWall, [[sx * hl, eave, -hw], [sx * hl, eave, hw], [sx * hl, ridge, 0]], [sx, 0, 0], (p) => [p[2] / 4, p[1] / 4]);
      P.box(M.grey, -hl + 6, hl - 6, 0, 4.2, hw, hw + 14, '', 4); P.box(M.hangarRoofShade, -hl + 6, hl - 6, 4.2, 4.35, hw - 0.1, hw + 14.1, 'b', 4);         // the lower wing (grey)
    } finally { P.pop(); }
    addPolyColliders(ctx, { o: HANGAR.flat(), h: [] }, 0, 11, 0.9);
    ph.addBox(cx - uz * (lb / 2 + 7), cz + ux * (lb / 2 + 7), la - 12, 14, rotYOf(ux, uz), 0, 4.4);
  });
  // ---------------------------------------------------------------------------------------- the helipad at the tip: pad (28 m + the corner brackets: 30 x 30 m texture), the concrete apron clipped at the asphalt
  step('helipad', () => {
    const c = { x: -9646.6, z: -1337.8 }, f = FM(c.x, c.z), W = (du, dv) => FW(f.u + du, f.v + dv);
    const apron = [W(-18, -18), W(18, -18), W(18, 18), W(-18, 18)].map((p) => [p.x, p.z]);
    fillPolyClipped(P, M.hard, apron, 0.045, cover, { margin: 0.4, maxEdge: 4, tile: 3 });
    // the pad texture (30 x 30 m) as a grid of 2 m cells: a cell with a corner or its centre on the asphalt of the service spur (the way w157323809 ends inside the square) is left out (road integrity)
    { const n = 15, c = 30 / n; let kept = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const a = [-15 + i * c, -15 + j * c], pts = [[a[0], a[1]], [a[0] + c, a[1]], [a[0] + c, a[1] + c], [a[0], a[1] + c]].map((p) => W(p[0], p[1]));
        const mid = W(a[0] + c / 2, a[1] + c / 2);
        if (pts.some((p) => cover(p.x, p.z) > -0.15) || cover(mid.x, mid.z) > -0.15) continue;
        P.quad(M.helipad, [pts[0].x, 0.07, pts[0].z], [pts[1].x, 0.07, pts[1].z], [pts[2].x, 0.07, pts[2].z], [pts[3].x, 0.07, pts[3].z], [0, 1, 0], [[i / n, j / n], [(i + 1) / n, j / n], [(i + 1) / n, (j + 1) / n], [i / n, (j + 1) / n]]); kept++;
      }
      svc.counts.helipadCells = kept; }
    svc.helipad = { x: c.x, z: c.z };
  });
  // ---------------------------------------------------------------------------------------- the roundabout island (OSM grass w1278069035: centre (-9577.7, -1330.5), R 8.1 m): lawn, kerb ring, three boulders
  step('roundabout', () => {
    const cx = -9577.7, cz = -1330.5, R = 8.1, n = 20;
    const ring = Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * Math.PI * 2) * R, cz + Math.sin(i / n * Math.PI * 2) * R]);
    fillPolyClipped(P, M.lawn, ring, 0.2, cover, { margin: 0.45, maxEdge: 2.5, tile: 5 });
    for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = dz / l, nz = -dx / l; if (cover((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) > -0.6 || cover(a[0], a[1]) > -0.6 || cover(b[0], b[1]) > -0.6) continue; P.quad(M.kerb, [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], 0.2, b[1]], [a[0], 0.2, a[1]], [nx, 0, nz], [[0, 0], [l / 2, 0], [l / 2, 0.1], [0, 0.1]]); }
    const g = new THREE.IcosahedronGeometry(1, 0);
    for (const [dx, dz, s, ry] of [[3.4, 2.0, 0.95, 0.4], [-2.6, 3.4, 0.7, 1.7], [1.4, -4.1, 0.55, 2.6]]) { P.geo(M.stone, g, cx + dx, 0.4 + s * 0.25, cz + dz, 0.3, ry, 0.1, s * 1.15, s * 0.75, s); ph.addCylinder(cx + dx, cz + dz, s, 0, 1.2); }
    g.dispose();
  });
}
