// landmarksYelaginKitchen/iron.js - the small architecture round the Kitchen block: the two ROSSI LANTERN POSTS at the ends of the drum (white cast iron, hooked arm, black lantern with milk glass, octagonal pedestal:
// photos kit_02 kit_05 kit_11 kit_16), the squat white BOLLARDS along the lawn edge in front of the drum (kit_10: ~0.7 m, conical foot, rounded fluted head, every ~8 m), the white iron spear FENCES of the Kitchen yard
// (OSM w736544130 east / w372618017 west: 1.6 m, round pickets with spear heads) with their three GATES (n1918525491, n6896052612, n11288670467: two piers + two open leaves).  World coordinates (no frame K).
import * as THREE from 'three';
import { BARRIERS, BARRIER_NODES } from '../data/city.js';
import * as L from '../layout.js';
import { C, TH, D, W, PS } from './frame.js';
import { geosOf, put } from './objs.js';
import { revolve } from './geo.js';

const FENCES = ['w736544130', 'w372618017'];
const GATES = ['n1918525491', 'n6896052612', 'n11288670467'];

function lampGeo(M) {                                                                       // after landmarksYelaginPalace/sculpt.js lampGeo (Rossi lantern post, 5.1 m)
  return geosOf((P) => {
    const R = 0.36, h = 1.05, o8 = [];
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) * Math.PI / 4; o8.push([Math.sin(a) * R, Math.cos(a) * R]); }
    for (let i = 0; i < 8; i++) {
      const a = o8[i], b = o8[(i + 1) % 8], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
      P.quad(M.whiteFlat, [a[0] * 1.05, 0, a[1] * 1.05], [b[0] * 1.05, 0, b[1] * 1.05], [b[0], h, b[1]], [a[0], h, a[1]], [dz / l, 0, -dx / l], null);
    }
    P.fan(M.whiteFlat, o8.map((p) => [p[0], h, p[1]]), [0, 1, 0]);
    P.cyl(M.whiteFlat, [0, h, 0], [0, h + 0.12, 0], 0.17, 0.12, 8, true);
    P.cyl(M.whiteFlat, [0, h + 0.12, 0], [0, h + 3.1, 0], 0.075, 0.045, 8, false);
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([s * (0.04 + 0.26 * Math.sin(t * Math.PI) * (1 - t * 0.5)), h + 0.15 + t * 1.45, 0]); }
      for (let i = 0; i < 10; i++) P.cyl(M.whiteFlat, [pts[i][0], pts[i][1], 0], [pts[i + 1][0], pts[i + 1][1], 0], 0.022, 0.022, 4, false);
      const g = new THREE.TorusGeometry(0.07, 0.016, 4, 10); P.geo(M.whiteFlat, g, s * 0.1, h + 0.28, 0, 0, 0, 0, 1, 1, 1); g.dispose();
    }
    const top = h + 3.1, arm = [];
    for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 0.95; arm.push([0.5 - 0.5 * Math.cos(a), top + 0.5 * Math.sin(a) * 0.9, 0]); }
    for (let i = 0; i < 12; i++) P.cyl(M.whiteFlat, [arm[i][0], arm[i][1], 0], [arm[i + 1][0], arm[i + 1][1], 0], 0.035 - i * 0.0008, 0.034 - i * 0.0008, 5, false);
    const ex = arm[12][0], ey = arm[12][1];
    P.cyl(M.whiteFlat, [ex, ey, 0], [ex, ey - 0.25, 0], 0.012, 0.012, 4, false);
    P.box(M.lampGlass, ex - 0.15, ex + 0.15, ey - 0.78, ey - 0.3, -0.15, 0.15, '', 1);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.box(M.lantern, ex + sx * 0.15 - 0.02, ex + sx * 0.15 + 0.02, ey - 0.8, ey - 0.28, sz * 0.15 - 0.02, sz * 0.15 + 0.02, '', 1);
    P.box(M.lantern, ex - 0.2, ex + 0.2, ey - 0.84, ey - 0.78, -0.2, 0.2, 'b', 1); P.box(M.lantern, ex - 0.2, ex + 0.2, ey - 0.3, ey - 0.26, -0.2, 0.2, 'b', 1);
    const cap = [[ex - 0.2, ey - 0.26, -0.2], [ex + 0.2, ey - 0.26, -0.2], [ex + 0.2, ey - 0.26, 0.2], [ex - 0.2, ey - 0.26, 0.2]], apex = [ex, ey - 0.06, 0];
    for (let i2 = 0; i2 < 4; i2++) P.fan(M.lantern, [cap[i2], cap[(i2 + 1) % 4], apex], [(cap[i2][0] + cap[(i2 + 1) % 4][0]) / 2 - ex, 0.6, (cap[i2][2] + cap[(i2 + 1) % 4][2]) / 2], null);
  });
}

function bollardGeo(M) {
  return geosOf((P) => {
    const prof = [[0, 0], [0.13, 0], [0.13, 0.1], [0.095, 0.14], [0.09, 0.5], [0.12, 0.54], [0.12, 0.6], [0.09, 0.66], [0.0, 0.7]];
    revolve(P, M.whiteFlat, prof, 12, { crease: 50 });
  });
}

function lamps(K) {
  const { M, root, ctx, svc } = K, ph = ctx.physics, lamp = lampGeo(M);
  let tris = 0;
  for (const s of [-1, 1]) {
    const phi = s * 86.5 * Math.PI / 180, r = D.R + 3.0, p = W(r * Math.sin(phi), r * Math.cos(phi));
    // the arm points along the footway side: toward the south (the lawn): local +x of the lamp turned so that +x -> world direction of the tangent toward the portico
    const tu = -s * Math.cos(phi), tw = s * Math.sin(phi), tx = tu * Math.cos(TH) + tw * Math.sin(TH), tz = -tu * Math.sin(TH) + tw * Math.cos(TH);
    tris += put(root, lamp, p.x, 0, p.z, Math.atan2(-tz, tx), 1, 'yek-lamp');
    svc.lamps.push({ x: p.x, z: p.z, h: 5.0 });
    if (ph) ph.addCylinder(p.x, p.z, 0.4, 0, 4.5);
  }
  K.extraTris += tris;
}

function bollards(K) {
  const { M, root, ctx } = K, ph = ctx.physics, bol = bollardGeo(M);
  let tris = 0, n = 0;
  const place = (x, z) => { if (L.isOnRoad(x, z, 0.7, { all: true }) || L.inRiver(x, z)) return; tris += put(root, bol, x, 0, z, 0, 1, 'yek-bollard'); if (ph) ph.addCylinder(x, z, 0.16, 0, 0.7); n++; };
  // along an arc 4.6 m outside the wall, from the east end round the south front to the west end (about 8 m apart); the lawn edge of photos kit_02 / kit_10
  const r = D.R + 5.2, step = 8.0 / r;
  for (let a = -84 * Math.PI / 180; a <= 84 * Math.PI / 180 + 1e-6; a += step) {
    const p = W(r * Math.sin(a), r * Math.cos(a));
    place(p.x, p.z);
  }
  K.extraTris += tris; K.shared.bollards = n;
}

function fences(K) {
  const { M, P, ctx, svc } = K, ph = ctx.physics;
  const gates = BARRIER_NODES.filter((g) => GATES.includes(g.id)), Hf = 1.6, bay = 2.4;
  let total = 0;
  for (const id of FENCES) {
    const f = BARRIERS.find((b) => b.id === id); if (!f) continue;
    for (let i = 0; i + 3 < f.pts.length; i += 2) {
      const ax = f.pts[i], az = f.pts[i + 1], bx = f.pts[i + 2], bz = f.pts[i + 3], l = Math.hypot(bx - ax, bz - az); if (l < 0.5) continue;
      const tx = (bx - ax) / l, tz = (bz - az) / l, rot = Math.atan2(-tz, tx), n = Math.max(1, Math.round(l / bay)), w = l / n;
      for (let k = 0; k < n; k++) {
        const x0 = ax + tx * k * w, z0 = az + tz * k * w, xm = x0 + tx * w / 2, zm = z0 + tz * w / 2;
        if (gates.some((g) => Math.hypot(g.x - xm, g.z - zm) < 1.6 + w / 2 - 0.2) || L.isOnRoad(xm, zm, 0.3) || L.insideBuilding(xm, zm, 0.2)) continue;
        P.push(x0, 0, z0, rot);
        P.quad(M.spears, [0, 0.05, 0], [w, 0.05, 0], [w, Hf, 0], [0, Hf, 0], [0, 0, 1], [[0, 0], [w / bay, 0], [w / bay, 1], [0, 1]]);
        P.box(M.whiteFlat, -0.05, 0.05, 0, Hf + 0.14, -0.05, 0.05, 'b', 1);
        P.cyl(M.whiteFlat, [-0.0, Hf + 0.14, 0], [0, Hf + 0.3, 0], 0.03, 0.0, 5, false);
        P.pop();
        if (ph) ph.addBox(xm, zm, w, 0.16, rot, 0, Hf);
        total += w;
      }
    }
  }
  // gates: two white piers with ball finials 3.2 m apart, two open leaves folded back against the fence
  const pier = geosOf((Q) => { Q.box(M.plinth, -0.36, 0.36, 0, 0.5, -0.36, 0.36, 'b', 1.1); Q.box(M.white, -0.3, 0.3, 0.5, 2.1, -0.3, 0.3, 'b', 3); Q.box(M.whiteFlat, -0.4, 0.4, 2.1, 2.22, -0.4, 0.4, 'b', 3); const g = new THREE.SphereGeometry(0.26, 12, 8); Q.geo(M.whiteFlat, g, 0, 2.48, 0); g.dispose(); });
  const leaf = geosOf((Q) => { Q.quad(M.spears, [0, 0.1, 0], [1.5, 0.1, 0], [1.5, 1.9, 0], [0, 1.9, 0], [0, 0, 1], [[0, 0], [1.5 / bay, 0], [1.5 / bay, 1.12], [0, 1.12]]); Q.box(M.whiteFlat, 0, 1.5, 1.9, 1.95, -0.03, 0.03, 'b', 1); Q.box(M.whiteFlat, 0, 1.5, 0.08, 0.13, -0.03, 0.03, 'b', 1); });
  let tris = 0;
  for (const g of gates) {
    // fence direction at the gate: the nearest segment of the two fence lines
    let best = null;
    for (const id of FENCES) {
      const f = BARRIERS.find((b) => b.id === id); if (!f) continue;
      for (let i = 0; i + 3 < f.pts.length; i += 2) {
        const ax = f.pts[i], az = f.pts[i + 1], bx = f.pts[i + 2], bz = f.pts[i + 3], l = Math.hypot(bx - ax, bz - az); if (l < 0.3) continue;
        const t = Math.max(0, Math.min(1, ((g.x - ax) * (bx - ax) + (g.z - az) * (bz - az)) / (l * l))), d = Math.hypot(g.x - (ax + (bx - ax) * t), g.z - (az + (bz - az) * t));
        if (!best || d < best.d) best = { d, tx: (bx - ax) / l, tz: (bz - az) / l };
      }
    }
    if (!best || best.d > 4) continue;
    const { tx, tz } = best, rot = Math.atan2(-tz, tx), nx = -tz, nz = tx;
    for (const s of [-1, 1]) {
      const px = g.x + tx * s * 1.7, pz = g.z + tz * s * 1.7;
      tris += put(K.root, pier, px, 0, pz, rot, 1, 'yek-gate'); if (ph) ph.addCylinder(px, pz, 0.45, 0, 2.5);
      // the open leaf: hinged at the pier, swung 90 deg toward +n (the yard side); its far end 1.5 m away from the fence line
      const lx = px + nx * 0.35, lz = pz + nz * 0.35;
      tris += put(K.root, leaf, lx, 0, lz, Math.atan2(-nz, nx) + (s > 0 ? Math.PI : 0), 1, 'yek-gate');
    }
    svc.gates ||= []; svc.gates.push({ id: g.id, x: g.x, z: g.z });
  }
  K.extraTris += tris; K.shared.fenceLength = Math.round(total);
}

export function build(K) {
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksYelaginKitchen] iron/${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };
  stage('lamps', () => lamps(K));
  stage('bollards', () => bollards(K));
  stage('fences', () => fences(K));
  if (K.errs) throw new Error(K.errs.join('\n'));
  void C; void PS;
}
