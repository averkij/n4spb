// landmarksJ/garden.js - the garden of St Isaac's Square (Исаакиевский сквер, OSM park w23076273, 7363 m2): lawn, gravel paths of the mapped footways, the oval central lawn (w132656347) with its rose bed and black posts
// with chains (photo refs/admiralty 085, 103), small-leaved limes / maples / elms (instanced, the environment's tree geometry copied into this folder: the generic modules paint the whole OSM `square`
// polygon w638328792 as paving and plant nothing on it, so the garden is drawn here), a kerb round the garden.  Benches / bins are the props module's (OSM nodes).
import * as THREE from 'three';
import { landmarkTreeSeason } from '../lib/landmark-tree-season.js';
import { prepareTreeLods } from '../lib/tree-bounds.js';
import { GREEN, ROADS, FURNITURE } from '../data/city.js';
import * as L from '../layout.js';
import { Mdl } from './frame.js';
import { SPECIES, canopyGeometry, trunkGeometry } from './treegeo.js';
import { canopyMaterial, trunkMaterial } from './leafmat.js';

const PARK = 'w23076273', OVAL = 'w132656347', LAWN2 = 'w132656345';
const LAWN_Y = 0.14, PATH_Y = 0.158, TAU = Math.PI * 2;
const ringOf = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); if (r.length > 1 && Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 0.05) r.pop(); return r; };
const pointIn = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
const signedA = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return a / 2; };
const greenRing = (id) => { const g = GREEN.find((q) => q.id === id); return g ? ringOf(g.polys[0].o) : null; };
const centroid = (r) => { let x = 0, z = 0; for (const p of r) { x += p[0]; z += p[1]; } return [x / r.length, z / r.length]; };

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics, svc = K.svc;
  const park = greenRing(PARK); if (!park) return;
  const rng = ctx.rng(5521);
  // ---- lawn + kerb
  P.cap(M.lawn, park, LAWN_Y, true, 4);
  const ccw = signedA(park) > 0;
  for (let i = 0, j = park.length - 1; i < park.length; j = i++) {
    const a = park[j], b = park[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.05) continue;
    let nx = (b[1] - a[1]) / l, nz = -(b[0] - a[0]) / l; if (!ccw) { nx = -nx; nz = -nz; }
    P.quad(M.slabRim, [a[0], 0.0, a[1]], [b[0], 0.0, b[1]], [b[0], LAWN_Y, b[1]], [a[0], LAWN_Y, a[1]], [nx, 0, nz]);
  }
  // ---- gravel paths: the mapped 'compacted' footways inside the park
  const seen = new Set(), uvf = (p) => [p[0] / 3, p[2] / 3];
  for (const r of ROADS) {
    if ((r.hw !== 'footway' && r.hw !== 'path') || r.surface === 'paving_stones') continue;
    const pts = []; for (let i = 0; i < r.pts.length; i += 2) pts.push([r.pts[i], r.pts[i + 1]]);
    const w = 3.2;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      if (!(pointIn(park, a[0], a[1]) && pointIn(park, b[0], b[1]) && pointIn(park, mx, mz))) continue;
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.05) continue;
      const nx = -dz / l * w / 2, nz = dx / l * w / 2;
      P.quad(M.gravel, [a[0] - nx, PATH_Y, a[1] - nz], [a[0] + nx, PATH_Y, a[1] + nz], [b[0] + nx, PATH_Y, b[1] + nz], [b[0] - nx, PATH_Y, b[1] - nz], [0, 1, 0],
        [[(a[0] - nx) / 3, (a[1] - nz) / 3], [(a[0] + nx) / 3, (a[1] + nz) / 3], [(b[0] + nx) / 3, (b[1] + nz) / 3], [(b[0] - nx) / 3, (b[1] - nz) / 3]]);
      for (const q of [a, b]) {
        const key = q[0].toFixed(1) + ',' + q[1].toFixed(1); if (seen.has(key)) continue; seen.add(key);
        const ring = []; for (let k = 0; k < 10; k++) { const t = k / 10 * TAU; ring.push([q[0] + Math.cos(t) * w / 2, PATH_Y, q[1] + Math.sin(t) * w / 2]); }
        P.fan(M.gravel, ring, [0, 1, 0], uvf);
      }
    }
  }
  // ---- the oval central lawn: brighter lawn, a rose bed ring and black posts with chains
  const oval = greenRing(OVAL);
  const blossom = ctx.season === 'winter' ? null : new THREE.SphereGeometry(1, 5, 4);
  let oc = [-2455, -76];
  if (oval) {
    oc = centroid(oval);
    const scaleRing = (k) => oval.map((p) => [oc[0] + (p[0] - oc[0]) * k, oc[1] + (p[1] - oc[1]) * k]);
    P.cap(M.lawnOval, oval, LAWN_Y + 0.015, true, 4);                                           // the central lawn (a slightly different green)
    const bed = scaleRing(1.09), ob = [];
    for (let i = 0; i < bed.length; i++) { const a = bed[i], b = bed[(i + 1) % bed.length]; ob.push([a, b]); }
    for (const [a, b] of ob) {                                                                // a low clipped rose bed: a green hedge-like mound with small pink / red / white blooms on top
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.3) continue;
      const sgn = ccwOf(oval) ? 1 : -1, nx = dz / l * sgn, nz = -dx / l * sgn, w = 1.5, yb = PATH_Y;
      P.quad(M.soil, [a[0], yb - 0.01, a[1]], [b[0], yb - 0.01, b[1]], [b[0] + nx * w, yb - 0.01, b[1] + nz * w], [a[0] + nx * w, yb - 0.01, a[1] + nz * w], [0, 1, 0]);
      P.quad(M.hedge2, [a[0], yb + 0.28, a[1]], [b[0], yb + 0.28, b[1]], [b[0] + nx * w * 0.8, yb + 0.28, b[1] + nz * w * 0.8], [a[0] + nx * w * 0.8, yb + 0.28, a[1] + nz * w * 0.8], [0, 1, 0]);
      const k = Math.max(2, Math.round(l / 0.45));
      for (let j = 0; j < k; j++) {
        const t = (j + rng()) / k, off = 0.15 + rng() * w * 0.65;
        const x = a[0] + dx * t + nx * off, z = a[1] + dz * t + nz * off;
        const bloom = [M.rose1, M.rose2, M.rose3, M.white2][(j + (rng() * 3 | 0)) & 3];
        if (blossom) P.geo(bloom, blossom, x, yb + 0.33, z, 0, 0, 0, 0.17, 0.12, 0.17);
      }
    }
    // posts + chains on the path side of the bed (every ~3.2 m)
    const fence = scaleRing(1.2), pts = [];
    let acc = 0;
    for (let i = 0; i < fence.length; i++) {
      const a = fence[i], b = fence[(i + 1) % fence.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let t = (3.2 - acc) / l; if (acc === 0) t = 0;
      while (t < 1) { pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); t += 3.2 / l; }
      acc = (acc + l) % 3.2;
    }
    pts.forEach((p, i) => {
      P.cyl(M.iron, [p[0], PATH_Y, p[1]], [p[0], PATH_Y + 0.8, p[1]], 0.1, 0.08, 6, false);
      P.cyl(M.iron, [p[0], PATH_Y + 0.8, p[1]], [p[0], PATH_Y + 0.92, p[1]], 0.11, 0.11, 6, true);
      const q = pts[(i + 1) % pts.length]; if (Math.hypot(q[0] - p[0], q[1] - p[1]) > 4.5) return;
      for (let k = 0; k < 4; k++) { const t0 = k / 4, t1 = (k + 1) / 4, y = (t) => PATH_Y + 0.7 - 0.2 * 4 * t * (1 - t); P.cyl(M.iron, [p[0] + (q[0] - p[0]) * t0, y(t0), p[1] + (q[1] - p[1]) * t0], [p[0] + (q[0] - p[0]) * t1, y(t1), p[1] + (q[1] - p[1]) * t1], 0.016, 0.016, 3, false); }
    });
  }
  // ---- trees: limes, maples, elms (instanced)
  const lawn2 = greenRing(LAWN2);
  const benches = FURNITURE.filter((f) => f.kind === 'bench' && pointIn(park, f.x, f.z));
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of park) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
  const footLines = []; for (const r of ROADS) if ((r.hw === 'footway' || r.hw === 'path') && r.pts.length >= 4) { const q = []; for (let i = 0; i < r.pts.length; i += 2) q.push([r.pts[i], r.pts[i + 1]]); footLines.push(q); }
  const dSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const nearPath = (x, z) => { for (const q of footLines) { let bb = false; for (const p of q) if (Math.abs(p[0] - x) < 40 && Math.abs(p[1] - z) < 40) { bb = true; break; } if (!bb) continue; for (let i = 0; i + 1 < q.length; i++) if (dSeg(x, z, q[i], q[i + 1]) < 2.4) return true; } return false; };
  const trees = [], FAM = [['limeA', 0.42], ['limeB', 0.18], ['mapleA', 0.2], ['elm', 0.1], ['ash', 0.1]];
  const pick = () => { let r = rng(), s = 0; for (const [f, w] of FAM) { s += w; if (r < s) return f; } return 'limeA'; };
  const okIn = (x, z) => Math.abs(Mdl(x, z).mx) > 11 && pointIn(park, x, z) && !(oval && pointIn(oval, x, z)) && !(Math.hypot(x - oc[0], z - oc[1]) < 24.5) && !nearPath(x, z) && !benches.some((b) => Math.hypot(b.x - x, b.z - z) < 2.2);
  for (let z = z0; z <= z1; z += 6.6) for (let x = x0; x <= x1; x += 6.6) {
    const px = x + (rng() - 0.5) * 3.6, pz = z + (rng() - 0.5) * 3.6;
    if (!okIn(px, pz)) continue;
    if (rng() > 0.72) continue;
    if (trees.some((t) => Math.hypot(t.x - px, t.z - pz) < 5.0)) continue;
    const fam = pick(), s = 0.75 + rng() * 0.45;
    // keep the sight lines to the cathedral open: no big crowns within 5 m of the axis of the south portico (bearing 143.5 deg through the dome axis)
    trees.push({ x: px, z: pz, fam, s, yaw: rng() * TAU });
  }
  K.svc.gardenTrees = trees.length;
  const byFam = {}; for (const t of trees) (byFam[t.fam] ||= []).push(t);
  const matLobe = canopyMaterial(ctx);
  const LEAF = { limeA: ['#4f7a2e', '#5a8434', '#62893a'], limeB: ['#467028', '#4f7a2e', '#5a8434'], mapleA: ['#5e9a35', '#6aa43c', '#548e2f'], elm: ['#4a7430', '#527c36', '#58803a'], ash: ['#5a8a38', '#639240', '#4e7e30'] };
  const col = new THREE.Color(), m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const barkMats = {};
  const group = new THREE.Group(); group.name = 'landmarksJ-garden-trees';
  for (const [fam, list] of Object.entries(byFam)) {
    const F = SPECIES[fam], matrices = [];
    const crown = landmarkTreeSeason(ctx, fam, F, LEAF[fam], matLobe, canopyGeometry);
    const im = new THREE.InstancedMesh(crown.geometry(0), crown.material, list.length);
    im.setColorAt(0, col.setRGB(1, 1, 1));
    list.forEach((t, i) => {
      qt.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.yaw); m4.compose(v.set(t.x, LAWN_Y, t.z), qt, sc.set(t.s, t.s, t.s)); im.setMatrixAt(i, m4); matrices.push(m4.clone());
      const hex = crown.palette[i % crown.palette.length]; col.set(hex).multiplyScalar(0.94 + rng() * 0.12); im.setColorAt(i, col);
    });
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; im.name = 'lmJ-tree-' + fam;
    ctx.noBatch(im); group.add(im);
    const tg = crown.bare ? null : trunkGeometry(fam, 0); let tm = null;
    if (tg) {
      const bk = F.bark;
      const bm = barkMats[bk] || (barkMats[bk] = trunkMaterial(ctx, ctx.tex.draw(128, 256, (g, w, h) => {
        const r = ctx.rng('bark-lmJ-' + bk); g.fillStyle = bk === 'ash' ? '#8a857c' : bk === 'oak' ? '#6c5e4e' : bk === 'maple' ? '#7a6e62' : '#5e5044'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 36; i++) { const x = r() * w; g.strokeStyle = `rgba(32,26,20,${0.35 + r() * 0.35})`; g.lineWidth = 2 + r() * 3; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 32) g.lineTo(x + (r() - 0.5) * 8, y); g.stroke(); }
      }, { key: 'lmJ-bark-' + bk, repeat: [1, 1] }), 'lmJ-bark-' + bk));
      tm = new THREE.InstancedMesh(tg, bm, list.length); tm.instanceMatrix = im.instanceMatrix; tm.castShadow = true; tm.receiveShadow = true; tm.name = 'lmJ-trunk-' + fam;
      ctx.noBatch(tm); group.add(tm);
    }
    prepareTreeLods([{ im, tm }], matrices);
    for (const t of list) ph.addCylinder(t.x, t.z, Math.max(0.25, F.trunk * t.s * 0.7), 0, 4.5);
  }
  K.root.add(group);
  void lawn2; void L;
  svc.photoSpots.push({ x: -2430, z: -45, yaw: L.yawToward(-2430, -45, -2524, -186), pitch: 10, name: 'Исаакиевский собор с площади' });
}
const ccwOf = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return a > 0; };
