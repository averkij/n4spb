// landmarksH/gtrees.js - the trees of the Alexander Garden, the Admiralty (Neva) garden and the Senate Square verges: placement under OUR rules (the environment module leaves the claimed GREEN polygons
// to us) and the instanced meshes with distance LOD + wind sway (treegeo.js / leafmat.js / util.js are copies of the environment files).
// Rules (dossier admiralty-stisaac.md section 4.3, photos 007 033 041 047 049): old lindens, elms, maples, ash, English oak 15-25 m in dense rows along the alleys and thickets on the wood polygons,
// lilac / privet shrubs; the OPEN axes stay clear: the gate avenue in front of the Admiralty arch (a +-14, b -12 .. -150), the Nevsky sight line to the spire (bearing 283.6 deg from the Nevsky mouth),
// the fountain circle, every monument, the paths (footways) and the buildings.  The list is published as ctx.services.landmarksH.trees.
import * as THREE from 'three';
import { prepareTreeLods } from '../lib/tree-bounds.js';
import { landmarkTreeSeason } from '../lib/landmark-tree-season.js';
import * as L from '../layout.js';
import { SPECIES, FAMILIES, canopyGeometry, trunkGeometry } from './treegeo.js';
import { canopyMaterial, trunkMaterial } from './leafmat.js';
import { pointInPoly, polyBox, polyArea, hash2 } from './util.js';
import { AB, W } from './frame.js';

const LEAF = {
  lime: ['#4f7a2e', '#5a8434', '#467028', '#62893a', '#3f6a2a'], maple: ['#5e9a35', '#6aa43c', '#548e2f', '#74a840', '#5a9234'], elm: ['#4a7430', '#527c36', '#446c2c', '#58803a'],
  ash: ['#5a8a38', '#639240', '#4e7e30', '#6a9a44'], oak: ['#4a6e2c', '#53773a', '#42642a', '#5a7e3a'], chestnut: ['#3f6a3f', '#386038', '#46743f', '#3a6838'],
  poplar: ['#3f6b2a', '#4a7633', '#365e24'], birch: ['#668f3a', '#5e9a35', '#729a42', '#628a38', '#6b9440'], shrub: ['#52763a', '#5f8641', '#456b32', '#6a9248', '#4e7a3a'],
};
const MIX_ALLEY = { limeA: 0.34, limeB: 0.2, mapleA: 0.14, elm: 0.12, ash: 0.1, oak: 0.06, chestnut: 0.04 };
const MIX_WOOD = { limeA: 0.2, limeB: 0.12, mapleA: 0.16, elm: 0.12, ash: 0.12, oak: 0.06, birchA: 0.08, poplar: 0.06, shrub: 0.08 };
const LOD_D = [42, 150, 360];

function barkTexture(ctx, kind) {
  return ctx.tex.draw(128, 256, (g, w, h) => {
    const r = ctx.rng('bark-h-' + kind);
    const furrows = (base, dark, n, wmin) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (let i = 0; i < n; i++) { const x = r() * w; g.strokeStyle = dark.replace('A', (0.35 + r() * 0.35).toFixed(2)); g.lineWidth = wmin + r() * 4; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y * 0.07 + i) * 5 + (r() - 0.5) * 4, y); g.stroke(); }
    };
    if (kind === 'birch') {
      g.fillStyle = '#ece8dc'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 52; i++) { const x = r() * w, y = r() * h, ww = 8 + r() * 26, hh = 2 + r() * 5; g.fillStyle = `rgba(34,31,29,${0.75 + r() * 0.2})`; g.beginPath(); g.ellipse(x, y, ww / 2, hh / 2, (r() - 0.5) * 0.25, 0, 6.3); g.fill(); }
    } else if (kind === 'pale') { g.fillStyle = '#948c7c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(60,54,48,${0.25 + r() * 0.3})`; g.fillRect(r() * w, r() * h, 2 + r() * 3, 8 + r() * 26); } }
    else if (kind === 'lime') furrows('#5e5044', 'rgba(32,26,20,A)', 38, 2);
    else if (kind === 'oak') furrows('#6c5e4e', 'rgba(34,28,22,A)', 30, 3);
    else if (kind === 'ash') furrows('#8a857c', 'rgba(52,48,42,A)', 34, 2);
    else if (kind === 'maple') furrows('#7a6e62', 'rgba(46,40,34,A)', 30, 2);
    else furrows('#6f645a', 'rgba(46,40,36,A)', 34, 2);
  }, { key: 'env-bark-pb-' + kind, repeat: [1, 1], anisotropy: 4 });
}
const pick = (R, table) => { let tot = 0; for (const k in table) tot += table[k]; let x = R() * tot; for (const k in table) { x -= table[k]; if (x <= 0) return k; } return Object.keys(table)[0]; };

/** corridors that stay free of trees: [{ax, ay, bx, by, hw}] capsules in world (x, z) */
function clearings(extra) {
  const cl = [];
  const seg = (a, b, hw) => cl.push({ ax: a[0], az: a[1], bx: b[0], bz: b[1], hw });
  seg(W(0, -12), W(0, -150), 14);                                                    // the gate avenue (arch -> fountain -> beyond)
  seg([-2185, -516], W(0, -12), 13);                                                  // the Nevsky axis to the spire (bearing 283.6 deg)
  { const F = W(-1.3, -87.5); seg(F, F, 27); }                                       // the fountain circle (basin r 13.3 + path ring + busts)
  for (const e of extra || []) seg(e.a, e.b, e.hw);
  return cl;
}
const nearSeg = (c, x, z) => { const dx = c.bx - c.ax, dz = c.bz - c.az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - c.ax) * dx + (z - c.az) * dz) / l2)); return Math.hypot(c.ax + dx * t - x, c.az + dz * t - z); };

export function buildGardenTrees(K, ctx, H, o) {
  const R = ctx.rng('landmarksH-trees');
  const quality = ctx.quality && (ctx.quality.level || ctx.quality.name), density = quality === 'low' ? 0.55 : quality === 'medium' ? 0.78 : 1;
  const list = [], grid = new Map(), key = (i, j) => i * 100003 + j, cellOf = (v) => Math.floor(v / 8);
  const near = (x, z) => { const out = []; const ci = cellOf(x), cj = cellOf(z); for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) { const a = grid.get(key(i, j)); if (a) out.push(...a); } return out; };
  const CL = clearings(o.clear);
  const colors = {}; for (const k in LEAF) colors[k] = LEAF[k].map((h) => new THREE.Color(h));
  const avoidPts = o.avoid || [];                                                       // [x, z, r]
  const okSpot = (x, z, r, shrub) => {
    if (L.insideBuilding(x, z, shrub ? 1.6 : 3.2)) return false;
    if (L.isOnRoad(x, z, shrub ? 1.0 : 1.6, { all: true })) return false;
    for (const c of CL) if (nearSeg(c, x, z) < c.hw + r * 0.4) return false;
    for (const p of avoidPts) if (Math.hypot(p[0] - x, p[1] - z) < p[2] + r * 0.5) return false;
    if (L.inRiver(x, z) || L.shoreDist(x, z) < 6) return false;
    for (const q of o.noTree || []) if (pointInPoly(x, z, q)) return false;
    return true;
  };
  function plant(x, z, fam, s0, src) {
    const F = SPECIES[fam], s = s0 ?? R.range(1.1, 1.6), r = F.R * s;
    if (!okSpot(x, z, r, !!F.shrub)) return false;
    for (const nb of near(x, z)) if (Math.hypot(nb.x - x, nb.z - z) < (nb.r + r) * (nb.shrub || F.shrub ? 0.42 : 0.5)) return false;
    const pal = colors[F.sp], c = pal[Math.floor(R() * pal.length)];
    const t = { x, z, fam, sp: F.sp, shrub: !!F.shrub, s, sy: s * R.range(0.92, 1.1), yaw: R() * 6.283, r, h: F.H * s, tr: F.trunk * Math.min(1.1, 0.7 + 0.35 * s), hex: c, bright: R.range(0.93, 1.07), src };
    list.push(t); const k = key(cellOf(x), cellOf(z)); let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(t);
    return true;
  }
  const inAny = (x, z, polys) => polys.some((p) => pointInPoly(x, z, p));
  // ---- wood polygons (thickets and the thin alley rows)
  for (const poly of o.woods) {
    const bb = polyBox(poly), area = polyArea(poly), thin = area < 400;
    if (thin) {                                                                          // rows of trees along an alley: one tree every ~7 m along the principal axis of the strip
      const o2 = poly.o, n2 = o2.length / 2; let mx = 0, mz = 0; for (let i = 0; i < o2.length; i += 2) { mx += o2[i]; mz += o2[i + 1]; } mx /= n2; mz /= n2;
      let sxx = 0, sxz = 0, szz = 0; for (let i = 0; i < o2.length; i += 2) { const dx = o2[i] - mx, dz = o2[i + 1] - mz; sxx += dx * dx; sxz += dx * dz; szz += dz * dz; }
      const ang = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(ang), uz = Math.sin(ang);
      let lo = 1e9, hi = -1e9; for (let i = 0; i < o2.length; i += 2) { const t = (o2[i] - mx) * ux + (o2[i + 1] - mz) * uz; lo = Math.min(lo, t); hi = Math.max(hi, t); }
      const n = Math.max(1, Math.round((hi - lo) / 7));
      for (let i = 0; i < n; i++) { const t = lo + (hi - lo) * (i + 0.5) / n; plant(mx + ux * t + R.range(-0.7, 0.7), mz + uz * t + R.range(-0.7, 0.7), pick(R, MIX_ALLEY), R.range(1.25, 1.75), 'row'); }
      continue;
    }
    for (let z = bb.z0; z < bb.z1; z += 5.6) for (let x = bb.x0; x < bb.x1; x += 5.6) {
      const px = x + R.range(-1.7, 1.7), pz = z + R.range(-1.7, 1.7);
      if (!pointInPoly(px, pz, poly) || R() > 0.72 * density) continue;
      const fam = pick(R, MIX_WOOD);
      plant(px, pz, fam, SPECIES[fam].shrub ? R.range(0.8, 1.3) : R.range(1.05, 1.6), 'wood');
    }
  }
  // ---- the lawns of the parks between the thickets: scattered specimens
  for (const poly of o.parks) {
    const bb = polyBox(poly), area = polyArea(poly); let want = Math.round(area / (o.parkDensity || 260) * density);
    for (let tries = 0; tries < want * 25 && want > 0; tries++) {
      const px = R.range(bb.x0, bb.x1), pz = R.range(bb.z0, bb.z1);
      if (!pointInPoly(px, pz, poly) || inAny(px, pz, o.woods)) continue;
      const fam = pick(R, R() < 0.12 ? { shrub: 1 } : MIX_ALLEY);
      if (plant(px, pz, fam, SPECIES[fam].shrub ? R.range(0.8, 1.2) : R.range(1.1, 1.6), 'lawn')) want--;
    }
  }
  for (const [x, z, fam, s] of o.fixed || []) plant(x, z, fam, s, 'fixed');

  // ---------------------------------------------------------------- meshes (instanced, LOD by distance, sway)
  const T = THREE, col = new T.Color();
  const byFam = {}; for (const f of FAMILIES) byFam[f] = [];
  for (const t of list) byFam[t.fam].push(t);
  const matLobe = canopyMaterial(ctx);
  const barkMat = {};
  const group = new T.Group(); group.name = 'lmH-trees'; ctx.addStatic(group);
  const M = {}, TR = {};
  for (const fam of FAMILIES) {
    const n = byFam[fam].length; if (!n) continue;
    const F = SPECIES[fam]; if (F.kind === 'tiers') continue;
    const season = landmarkTreeSeason(ctx, fam, F, colors[F.sp], matLobe, canopyGeometry);
    for (const t of byFam[fam]) {
      col.set(season.bare ? season.palette[0] : t.hex).multiplyScalar(t.bright);
      t.rgb = [col.r, col.g, col.b];
    }
    M[fam] = []; TR[fam] = [];
    for (let l = 0; l < 4; l++) {
      const im = new T.InstancedMesh(season.geometry(l), season.material, n);
      im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.setColorAt(0, col.setRGB(1, 1, 1)); im.instanceColor.setUsage(T.DynamicDrawUsage);
      im.count = 0; im.castShadow = l <= 1; im.receiveShadow = l <= 1; im.name = `lmH-tree-${fam}-${l}`; im.visible = false;
      group.add(im); M[fam].push(im);
      if (l <= 1) {
        const tg = season.bare ? null : trunkGeometry(fam, l);
        if (tg) barkMat[F.bark] ??= trunkMaterial(ctx, barkTexture(ctx, F.bark), 'env-bark-pb-' + F.bark);
        if (tg) { const tm = new T.InstancedMesh(tg, barkMat[F.bark], n); tm.instanceMatrix = im.instanceMatrix; tm.count = 0; tm.castShadow = true; tm.receiveShadow = true; tm.name = `lmH-trunk-${fam}-${l}`; tm.visible = false; group.add(tm); TR[fam].push(tm); }
        else TR[fam].push(null);
      }
    }
    const matrices = byFam[fam].map(t => new T.Matrix4().compose(new T.Vector3(t.x, 0, t.z),
      new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), t.yaw), new T.Vector3(t.s, t.sy, t.s)));
    prepareTreeLods(M[fam].map((im, l) => ({ im, tm: TR[fam][l] })), matrices);
  }
  let colliders = 0;
  for (const t of list) if (L.inPlay(t.x, t.z, -5)) { ctx.physics.addCylinder(t.x, t.z, t.tr, 0, t.shrub ? 1.3 : 4.5); colliders++; }
  const state = new Int8Array(list.length).fill(-1), cnt = {}; for (const f in M) cnt[f] = [0, 0, 0, 0];
  function assign(cx, cz) {
    for (const f in cnt) cnt[f][0] = cnt[f][1] = cnt[f][2] = cnt[f][3] = 0;
    for (let i = 0; i < list.length; i++) {
      const t = list[i], d = Math.hypot(t.x - cx, t.z - cz);
      let l = d < LOD_D[0] ? 0 : d < LOD_D[1] ? 1 : d < LOD_D[2] ? 2 : 3;
      const pv = state[i];
      if (pv >= 0 && pv !== l) { const lo = pv === 0 ? 0 : LOD_D[pv - 1] * 0.9, hi = pv === 3 ? 1e9 : LOD_D[pv] * 1.1; if (d >= lo && d < hi) l = pv; }
      state[i] = l;
      const im = M[t.fam][l], k = cnt[t.fam][l]++;
      const a = im.instanceMatrix.array, oo = k * 16, c = Math.cos(t.yaw), s = Math.sin(t.yaw), sx = t.s, sy = t.sy;
      a[oo] = sx * c; a[oo + 1] = 0; a[oo + 2] = -sx * s; a[oo + 3] = 0; a[oo + 4] = 0; a[oo + 5] = sy; a[oo + 6] = 0; a[oo + 7] = 0;
      a[oo + 8] = sx * s; a[oo + 9] = 0; a[oo + 10] = sx * c; a[oo + 11] = 0; a[oo + 12] = t.x; a[oo + 13] = 0; a[oo + 14] = t.z; a[oo + 15] = 1;
      const ca = im.instanceColor.array; ca[k * 3] = t.rgb[0]; ca[k * 3 + 1] = t.rgb[1]; ca[k * 3 + 2] = t.rgb[2];
    }
    for (const f in M) for (let l = 0; l < 4; l++) {
      const im = M[f][l], c = cnt[f][l]; im.count = c; im.visible = c > 0; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
      if (l <= 1 && TR[f][l]) { TR[f][l].count = c; TR[f][l].visible = c > 0; }
    }
  }
  let lx = 1e9, lz = 1e9, lt = -10;
  const first = L.HERO; assign(first.x, first.z); lx = first.x; lz = first.z;
  ctx.onUpdate((dt, t) => {
    const p = ctx.camera.position;
    if (Math.hypot(p.x - lx, p.z - lz) > 2.5 || (Math.abs(t - lt) > 1.5 && Math.hypot(p.x - lx, p.z - lz) > 0.5)) { assign(p.x, p.z); lx = p.x; lz = p.z; lt = t; }
  });
  void AB; void hash2;
  return { list, count: list.length, colliders, info: list.map((t) => ({ x: t.x, z: t.z, r: t.r, h: t.h, tr: t.tr, sp: t.sp, ...(t.shrub ? { shrub: true } : {}) })) };
}
