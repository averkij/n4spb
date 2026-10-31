// landmarksAurora/cabin.js - the CABIN OF PETER THE GREAT (Petrovskaya emb. 6): the red-brick case pavilion of 1844 (R. I. Kuzmin) on the baked footprint w28712275, its ticket booth
// w1229214445, the cast-iron fences of 1852 (OSM w1229214446 round the case, w28712277 round the garden; dark green-grey bars with gilded spear tips on a granite plinth, open gates with
// gilded medallions) and the bronze bust of Peter I (P. Zabello 1875, OSM n1558527389) on its pink granite pedestal inside a low ornamental fence, facing the Neva.
// Dossier docs/research/aurora.md section 4; photos 50 (bust, garden, gate), 55 (the case from the side, fence), 57 (gate).  Eaves 4.2 m, the raised middle roof to 6.9 m.
// The garden itself (lawn, old trees, paths) stays with environment / streets: the GREEN polygon w28712277 is NOT claimed.
import * as THREE from 'three';
import * as L from '../layout.js';
import { BARRIERS, BARRIER_NODES } from '../data/city.js';
import { addPolyColliders } from '../lib/massing.js';
import { bust, figureMats, cached } from '../lib/figures.js';
import { ringEdges, onEdge, band } from './kit.js';
import { hipRoof, hull } from './roofs.js';
import * as G from './geo.js';
import { CABIN_ID, BOOTH_ID, BUST, LIONS, pairs } from './frame.js';

const EAVE = 4.2;
const segPts = (cx, y0, w, h, rise, n = 8) => { const pts = [[cx - w / 2, y0], [cx + w / 2, y0]]; for (let i = 0; i <= n; i++) { const u = i / n; pts.push([cx + w / 2 - w * u, y0 + h - rise + rise * Math.sin(Math.PI * u)]); } return pts; };

export function build(K) {
  const { ctx, M, P, svc } = K, ph = ctx.physics;
  // ================================================================== the case
  const rec = L.buildingById(CABIN_ID); if (!rec) throw new Error('cabin footprint w28712275 missing');
  const poly = rec.polys[0], ring = pairs(poly.o), edges = ringEdges(poly, 0.05);
  band(P, edges, 0, 0.5, 0.07, { front: M.plinth, top: M.plinth }, { uvs: 2 });
  band(P, edges, EAVE - 0.32, EAVE, 0.12, { front: M.brickBand, top: M.brickBand, under: M.brickBand });
  for (const e of edges) onEdge(P, e, (len) => {
    P.quad(M.brick, [0, 0, 0], [len, 0, 0], [len, EAVE, 0], [0, EAVE, 0], [0, 0, 1], [[0, 0], [len / 2, 0], [len / 2, EAVE / 2], [0, EAVE / 2]]);
    if (len < 2.6) return;
    const nb = Math.max(1, Math.round(len / 4.0)), p = len / nb;
    for (let i = 0; i < nb; i++) {
      const xc = (i + 0.5) * p, w = p - 1.25;
      G.planeShape(P, M.win34, segPts(xc, 0.75, w, 3.0, 0.5), 0.03);
      G.frameRing(P, M.brickBand, segPts(xc, 0.63, w + 0.24, 3.2, 0.54), segPts(xc, 0.75, w, 3.0, 0.5), 0, 0.07, 1);
    }
    for (let i = 0; i <= nb; i++) {                                               // brick piers with three pale bands
      const x = Math.min(len - 0.36, Math.max(0.36, i * p));
      P.box(M.brick, x - 0.36, x + 0.36, 0.5, EAVE - 0.32, 0, 0.1, 'kb', 2);
      for (const y of [1.2, 2.2, 3.2]) P.box(M.brickBand, x - 0.37, x + 0.37, y, y + 0.16, 0, 0.115, 'kb');
    }
  });
  const H = hull(ring);
  hipRoof(P, M.cabinRoof, H, EAVE, 1.5, 0.55);
  { // the raised middle roof with its semicircular fan dormers
    const rot = Math.atan2(-(ring[2][1] - ring[1][1]), ring[2][0] - ring[1][0]);         // the long axis (edge 1 -> 2)
    P.push(rec.cx, 0, rec.cz, rot);
    P.box(M.brickBand, -4.2, 4.2, 5.1, 5.75, -2.9, 2.9, 'b');
    hipRoof(P, M.cabinRoof, [[-4.5, -3.2], [4.5, -3.2], [4.5, 3.2], [-4.5, 3.2]], 5.75, 1.15, 0.2);
    for (const s of [-1, 1]) { P.push(0, 0, s * 2.91, s > 0 ? 0 : Math.PI); const fan = [[-0.95, 5.15]]; for (let i = 0; i <= 8; i++) fan.push([Math.cos(Math.PI - i / 8 * Math.PI) * 0.95, 5.15 + Math.sin(i / 8 * Math.PI) * 0.55]); G.planeShape(P, M.win23, fan, 0.02); P.pop(); }
    P.pop();
  }
  addPolyColliders(ctx, poly, 0, 5);
  svc.monuments.push({ id: CABIN_ID, name: 'Домик Петра I', x: rec.cx, z: rec.cz, h: 6.9 });
  svc.entrances.push({ x: -1147.8, z: -2340.2, rotY: Math.PI, bldg: CABIN_ID, closed: true });
  // the ticket booth
  try {
    const b = L.buildingById(BOOTH_ID);
    if (b) { const x = b.cx, z = b.cz; P.push(x, 0, z, Math.atan2(-(ring[2][1] - ring[1][1]), ring[2][0] - ring[1][0])); P.box(M.fence, -1.3, 1.3, 0, 2.5, -1.3, 1.3, 'b'); P.box(M.port, -0.8, 0.8, 1.0, 2.0, 1.3, 1.33, 'kb'); hipRoof(P, M.cabinRoof, [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]], 2.5, 0.8, 0.1); P.pop(); ph.addBox(x, z, 2.6, 2.6, 0, 0, 3); }
  } catch (e) { console.warn('[landmarksAurora] booth:', e && e.message); }

  // ================================================================== fences
  const fenceTex = ctx.tex.draw(256, 256, (g, w, h) => {                            // tile 2 m: bars every 0.167 m, two rails, a ring band, gilded spear tips
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#3f5049'; g.fillRect(0, 46, w, 9); g.fillRect(0, h - 44, w, 8); g.fillRect(0, h - 12, w, 12);
    for (let i = 0; i < 12; i++) { const x = i * w / 12 + w / 24; g.fillStyle = '#3f5049'; g.fillRect(x - 3, 30, 6, h - 30); g.strokeStyle = '#3f5049'; g.lineWidth = 3.5; g.beginPath(); g.arc(x, h - 28, 9, 0, 6.3); g.stroke();
      g.fillStyle = '#d9a82c'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 8, 20); g.lineTo(x + 3, 30); g.lineTo(x - 3, 30); g.lineTo(x - 8, 20); g.closePath(); g.fill(); }
  }, { key: 'lmAu-fence' });
  const fenceMat = ctx.mat.toon('#ffffff', { map: fenceTex, alphaTest: 0.5, side: 'double', name: 'lmAu-fencePanel' }); M.cutouts.add(fenceMat);
  const gates = BARRIER_NODES.filter((n) => n.kind === 'gate' && n.x > -1185 && n.x < -1090 && n.z > -2360 && n.z < -2255);
  const nearGate = (x, z, m) => gates.some((q) => Math.hypot(q.x - x, q.z - z) < m);
  let fenceLen = 0;
  const fence = (id, h, plinth) => {
    const b = BARRIERS.find((q) => q.id === id); if (!b) return;
    const pts = pairs(b.pts); if (b.closed) pts.push(pts[0]);
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], c = pts[i + 1], dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.4) continue;
      const n = Math.max(1, Math.round(l / 2.5)), rot = Math.atan2(-dz, dx);
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n, x0 = a[0] + dx * t0, z0 = a[1] + dz * t0, x1 = a[0] + dx * t1, z1 = a[1] + dz * t1, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, sl = l / n;
        if (nearGate(mx, mz, 1.9) || nearGate(x0, z0, 1.2) || nearGate(x1, z1, 1.2)) continue;
        P.push(mx, 0, mz, rot);
        P.box(M.greyGranite, -sl / 2, sl / 2, 0, plinth, -0.18, 0.18, 'b', 1.5);
        P.quad(fenceMat, [-sl / 2, plinth, 0], [sl / 2, plinth, 0], [sl / 2, plinth + h, 0], [-sl / 2, plinth + h, 0], [0, 0, 1], [[0, 0], [sl / 2, 0], [sl / 2, 1], [0, 1]]);
        for (const sx of [-sl / 2, sl / 2]) { P.box(M.fence, sx - 0.07, sx + 0.07, plinth, plinth + h + 0.12, -0.07, 0.07, 'b'); G.ball(P, M.gold, sx, plinth + h + 0.2, 0, 0.085, 5); }
        P.pop();
        ph.addBox(mx, mz, sl, 0.3, rot, 0, plinth + h + 0.2); fenceLen += sl;
      }
    }
  };
  fence('w1229214446', 1.25, 0.4); fence('w28712277', 1.45, 0.45);
  // gates: two posts and two open leaves with a gilded medallion each (the garden is open to visitors)
  for (const q of gates) {
    let best = null;                                                               // direction of the fence at the gate
    for (const id of ['w1229214446', 'w28712277']) { const b = BARRIERS.find((r) => r.id === id); if (!b) continue; const pts = pairs(b.pts); if (b.closed) pts.push(pts[0]);
      for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], c = pts[i + 1], dx = c[0] - a[0], dz = c[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((q.x - a[0]) * dx + (q.z - a[1]) * dz) / l2)), d = Math.hypot(q.x - a[0] - dx * t, q.z - a[1] - dz * t); if (!best || d < best.d) best = { d, rot: Math.atan2(-dz, dx) }; } }
    if (!best || best.d > 3) continue;
    P.push(q.x, 0, q.z, best.rot);
    for (const s of [-1, 1]) {
      P.box(M.fence, s * 1.55 - 0.17, s * 1.55 + 0.17, 0, 2.5, -0.17, 0.17, 'b'); P.box(M.fence, s * 1.55 - 0.23, s * 1.55 + 0.23, 2.5, 2.62, -0.23, 0.23, ''); G.ball(P, M.gold, s * 1.55, 2.78, 0, 0.16, 8);
      P.push(s * 1.4, 0, 0, s * 1.35);                                              // an open leaf
      P.quad(fenceMat, [0, 0.12, 0], [-s * 1.35, 0.12, 0], [-s * 1.35, 2.0, 0], [0, 2.0, 0], [0, 0, 1], [[0, 0], [0.67, 0], [0.67, 1], [0, 1]]);
      const g = new THREE.CircleGeometry(0.3, 12); P.geo(M.gold, g, -s * 0.68, 1.1, 0.02); P.geo(M.gold, g, -s * 0.68, 1.1, -0.02, 0, Math.PI, 0); g.dispose();
      P.pop();
      const c = Math.cos(best.rot), sn = Math.sin(best.rot); ph.addBox(q.x + c * s * 1.55, q.z - sn * s * 1.55, 0.4, 0.4, best.rot, 0, 2.6);
    }
    P.pop();
  }
  svc.fences.push({ kind: 'cabin-fence', len: Math.round(fenceLen) });

  // ================================================================== the bust of Peter I
  {
    const rot = Math.atan2(LIONS.zx[0], LIONS.zx[1]);                               // facing the Neva
    P.push(BUST.x, 0, BUST.z, rot);
    P.box(M.pinkSlab, -1.75, 1.75, 0, 0.32, -1.75, 1.75, 'b', 2);
    P.box(M.pinkSlab, -0.95, 0.95, 0.32, 0.72, -0.95, 0.95, 'b', 2); P.box(M.pinkSlab, -0.8, 0.8, 0.72, 0.9, -0.8, 0.8, 'b', 2);
    for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {                    // the tapering die
      const a = 0.68, b = 0.58, y0 = 0.9, y1 = 3.0, q = sx ? [[sx * a, y0, -sx * a], [sx * a, y0, sx * a], [sx * b, y1, sx * b], [sx * b, y1, -sx * b]] : [[sz * a, y0, sz * a], [-sz * a, y0, sz * a], [-sz * b, y1, sz * b], [sz * b, y1, sz * b]];
      P.quad(M.pinkSlab, q[0], q[1], q[2], q[3], [sx, 0.05, sz], [[0, 0], [0.7, 0], [0.7, 1], [0, 1]]);
    }
    P.box(M.pinkSlab, -0.72, 0.72, 3.0, 3.22, -0.72, 0.72, '', 2);
    { const g = new THREE.TorusGeometry(0.17, 0.035, 5, 12); P.geo(M.gold, g, 0, 2.25, 0.64, -0.05, 0, 0); g.dispose(); P.box(M.gold, -0.2, 0.2, 1.75, 1.82, 0.655, 0.675, 'k'); }   // gilded crown / monogram and the date line
    const mk = figureMats(ctx).keys('bronze', 'bronze');
    cached('lmAu-peterBust', () => bust({ style: 'bare', detail: 0.9, turn: 0.2, face: { hair: 'curly', beard: 'moustache', age: 0.35 } })).place(P, mk, 0, 3.22, 0, 0, 2.05);
    for (const s of [-1, 1]) for (const d of [0, 1]) {                              // the low ornamental fence with gilded eagles on the corner posts
      P.push(0, 0, 0, d * Math.PI / 2);
      P.quad(fenceMat, [-1.6, 0.32, s * 1.6], [1.6, 0.32, s * 1.6], [1.6, 1.3, s * 1.6], [-1.6, 1.3, s * 1.6], [0, 0, s], [[0, 0], [1.6, 0], [1.6, 1], [0, 1]]);
      P.pop();
      const x = s * 1.6, z = (d ? 1 : -1) * 1.6;
      P.box(M.iron, x - 0.08, x + 0.08, 0.32, 1.42, z - 0.08, z + 0.08, 'b');
      const g = new THREE.SphereGeometry(1, 8, 6); P.geo(M.gold, g, x, 1.5, z, 0, 0, 0, 0.035, 0.07, 0.035); P.geo(M.gold, g, x - 0.055, 1.53, z, 0, 0, 0.6, 0.05, 0.025, 0.012); P.geo(M.gold, g, x + 0.055, 1.53, z, 0, 0, -0.6, 0.05, 0.025, 0.012); g.dispose();
    }
    P.pop();
    ph.addBox(BUST.x, BUST.z, 3.4, 3.4, rot, 0, 4.5);
    svc.monuments.push({ id: 'n1558527389', name: 'Бюст Петра I у Домика Петра', x: BUST.x, z: BUST.z, h: 4.5 });
    const sp = { x: BUST.x + LIONS.zx[0] * 9, z: BUST.z + LIONS.zx[1] * 9 };
    svc.photoSpots.push({ x: sp.x, z: sp.z, yaw: L.yawToward ? L.yawToward(sp.x, sp.z, BUST.x, BUST.z) : 0, name: 'Бюст Петра I и Домик Петра' });
    svc.crowd.push({ x: sp.x, z: sp.z, r: 5, n: 6, kind: 'tourists' });
  }
}
