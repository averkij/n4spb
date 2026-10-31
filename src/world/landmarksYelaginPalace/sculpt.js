// landmarksYelaginPalace/sculpt.js - the small things of the palace, each built once and placed as its own mesh (objs.js): the two WHITE CAST-IRON LIONS (Medici type, right forepaw on a ball, plinth on the
// upper cheek block of the west stair; dossier 5.5, photos pal_02 lion_02 lion_05 lion_07), the FOUR MARBLE VASES of the east stair (amphorae with mask handles on stepped pedestals) and the two lattice
// PLANTERS (lion_08 lion_09 pal_20), the ROSSI LANTERN POSTS (hooked swan-neck arm, black lantern with milk glass, octagonal pedestal; pal_06 pal_27 stb_11), the granite BALLS on stone posts at the ramp feet
// (pal_27 pal_28) and the two park GATES (open leaves).  Also the museum plate beside the west door (labels registry).
import * as THREE from 'three';
import { lion, cached } from '../lib/figures.js';
import { PA, W, F, P as PL, EAST_STAIR } from './frame.js';
import { revolve } from './geo.js';
import { geosOf, put, mirrorSet } from './objs.js';
import * as L from '../layout.js';

const stage = (K, name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksYelaginPalace] sculpt/${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };

// ------------------------------------------------------------------------------------------------ the lion
function lions(K) {
  const M = K.M, root = K.root;
  const fig = cached('yepal-lion', () => lion({ ball: true, mane: 1.6, detail: 0.9, headScale: 1.25, maneCount: 90, fullMane: true, head: { turn: 0.5, pitch: 0.3 } }));
  const mats = { main: M.lion, dark: M.dark, accent: M.lion };
  const south = geosOf((P) => fig.place(P, mats, 0, 0, 0, 0, 1.2));
  const north = mirrorSet(south);
  K.shared.lionBounds = fig.bounds();
  let tris = 0;
  const S = PL.stair, y = S.top + 0.06 + 0.35;
  for (const s of [1, -1]) {
    const p = W(s * 6.85, 13.8);
    tris += put(root, s > 0 ? south : north, p.x, y, p.z, PA.rot, 1, 'yel-lion');
    K.svc.monuments.push({ id: s > 0 ? 'n3761709952' : 'n3761709953', name: 'Лев Елагина дворца', x: p.x, z: p.z, h: 2.1 });
  }
  K.extraTris += tris;
}

// ------------------------------------------------------------------------------------------------ vases and planters
function vaseGeo(M) {
  return geosOf((P) => {
    const prof = [[0, 0], [0.34, 0], [0.34, 0.1], [0.27, 0.14], [0.27, 0.2], [0.15, 0.26], [0.12, 0.34], [0.12, 0.44], [0.17, 0.5], [0.29, 0.6], [0.39, 0.75], [0.45, 0.92], [0.44, 1.08], [0.37, 1.24],
      [0.29, 1.33], [0.29, 1.4], [0.37, 1.45], [0.37, 1.52], [0.24, 1.56], [0.14, 1.62], [0.1, 1.7], [0.05, 1.82], [0, 1.9]];
    revolve(P, M.marble, prof, 24, { crease: 50 });
    // gadroons: a ring of 12 low ribs on the belly; the band of relief figures is a ring of small blobs
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; P.cyl(M.marble, [Math.sin(a) * 0.4, 0.62, Math.cos(a) * 0.4], [Math.sin(a) * 0.47, 0.98, Math.cos(a) * 0.47], 0.035, 0.05, 5, false); }
    // two handles with bearded masks
    for (const s of [-1, 1]) {
      const pts = [[s * 0.4, 1.22], [s * 0.56, 1.3], [s * 0.6, 1.14], [s * 0.5, 0.98]];
      for (let i = 0; i + 1 < pts.length; i++) P.cyl(M.marble, [pts[i][0], pts[i][1], 0], [pts[i + 1][0], pts[i + 1][1], 0], 0.045, 0.045, 6, false);
      const g = new THREE.SphereGeometry(0.1, 8, 6); P.geo(M.marble, g, s * 0.5, 0.98, 0, 0, 0, 0, 1, 1.25, 0.8); g.dispose();
    }
  });
}
function planterGeo(M) {
  return geosOf((P) => {
    const w = 1.6, d = 0.5, h = 0.42;
    P.box(M.whiteFlat, -w / 2 - 0.04, w / 2 + 0.04, 0, 0.08, -d / 2 - 0.04, d / 2 + 0.04, 'b', 1);                       // foot
    for (const [z, nz] of [[d / 2, 1], [-d / 2, -1]]) P.quad(M.trellis, [-w / 2, 0.08, z], [w / 2, 0.08, z], [w / 2, h, z], [-w / 2, h, z], [0, 0, nz], [[0, 0], [3, 0], [3, 1], [0, 1]]);
    for (const [x, nx] of [[w / 2, 1], [-w / 2, -1]]) P.quad(M.trellis, [x, 0.08, -d / 2], [x, 0.08, d / 2], [x, h, d / 2], [x, h, -d / 2], [nx, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.box(M.whiteFlat, -w / 2 - 0.05, w / 2 + 0.05, h, h + 0.06, -d / 2 - 0.05, d / 2 + 0.05, 'b', 1);                   // rim
    P.box(M.soil, -w / 2, w / 2, 0.08, h + 0.02, -d / 2, d / 2, 'b', 1);                                                  // soil + foliage cushion
    for (let i = 0; i < 14; i++) { const g = new THREE.SphereGeometry(0.09, 5, 4); P.geo(i % 3 ? M.flower : M.whiteFlat, g, -0.7 + (i % 7) * 0.23, h + 0.1 + (i % 2) * 0.05, -0.12 + Math.floor(i / 7) * 0.24); g.dispose(); }
  });
}
function vases(K) {
  const M = K.M, root = K.root, vase = vaseGeo(M), planter = planterGeo(M), S = EAST_STAIR;
  let tris = 0;
  const pedestal = geosOf((P) => { P.box(M.limestone, -0.5, 0.5, 0, 0.9, -0.5, 0.5, 'b', 1.8); P.box(M.limestone, -0.58, 0.58, 0.9, 1.0, -0.58, 0.58, 'b', 1.8); });
  const pedLow = geosOf((P) => { P.box(M.limestone, -0.46, 0.46, 0, 0.55, -0.46, 0.46, 'b', 1.8); P.box(M.limestone, -0.54, 0.54, 0.55, 0.65, -0.54, 0.54, 'b', 1.8); });
  for (const s of [-1, 1]) {
    const uC = s * (S.half + 1.2);
    // upper cheek (top at F): a vase on a pedestal at the building end, a planter beside it
    let p = W(uC, S.wTop - 0.9); tris += put(root, pedestal, p.x, F, p.z, 0, 1, 'yel-ped'); tris += put(root, vase, p.x, F + 1.0, p.z, 0, 0.82, 'yel-vase');
    p = W(uC, S.wTop - 2.7); tris += put(root, planter, p.x, F, p.z, 0, 1, 'yel-planter');
    // lower cheek (top at 1.3): a vase on a low pedestal at the foot
    p = W(uC, S.wTop - 3.6 - 3.7); tris += put(root, pedLow, p.x, 1.3, p.z, 0, 1, 'yel-ped'); tris += put(root, vase, p.x, 1.3 + 0.65, p.z, 0, 0.78, 'yel-vase');
    K.svc.monuments.push({ id: 'yelagin-vase-' + (s > 0 ? 's' : 'n'), name: 'Мраморная ваза Елагина дворца', x: p.x, z: p.z, h: 2.1 });
  }
  K.extraTris += tris;
  K.shared.vaseSpots = [];
}

// ------------------------------------------------------------------------------------------------ the Rossi lantern post
function lampGeo(M) {
  return geosOf((P) => {
    // octagonal stone pedestal with rosette plates
    const R = 0.36, h = 1.05, o8 = [];
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) * Math.PI / 4; o8.push([Math.sin(a) * R / Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8), Math.cos(a) * R]); }
    for (let i = 0; i < 8; i++) {
      const a = o8[i], b = o8[(i + 1) % 8], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
      P.quad(M.whiteFlat, [a[0] * 1.05, 0, a[1] * 1.05], [b[0] * 1.05, 0, b[1] * 1.05], [b[0], h, b[1]], [a[0], h, a[1]], [dz / l, 0, -dx / l], null);
    }
    P.fan(M.whiteFlat, o8.map((p) => [p[0], h, p[1]]), [0, 1, 0]);
    // the post: a slim tapered shaft with two collars; the tear-shaped palmette scrolls at the foot (two lobes in the plane of the arm)
    P.cyl(M.whiteFlat, [0, h, 0], [0, h + 0.12, 0], 0.17, 0.12, 8, true);
    P.cyl(M.whiteFlat, [0, h + 0.12, 0], [0, h + 3.1, 0], 0.075, 0.045, 8, false);
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([s * (0.04 + 0.26 * Math.sin(t * Math.PI) * (1 - t * 0.5)), h + 0.15 + t * 1.45, 0]); }
      for (let i = 0; i < 10; i++) P.cyl(M.whiteFlat, [pts[i][0], pts[i][1], 0], [pts[i + 1][0], pts[i + 1][1], 0], 0.022, 0.022, 4, false);
      const g = new THREE.TorusGeometry(0.07, 0.016, 4, 10); P.geo(M.whiteFlat, g, s * 0.1, h + 0.28, 0, 0, 0, 0, 1, 1, 1); g.dispose();
    }
    // the hooked arm: a swan neck over to +x with the lantern hanging at its end
    const top = h + 3.1, arm = [];
    for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 0.95; arm.push([0.5 - 0.5 * Math.cos(a), top + 0.5 * Math.sin(a) * 0.9, 0]); }
    for (let i = 0; i < 12; i++) P.cyl(M.whiteFlat, [arm[i][0], arm[i][1], 0], [arm[i + 1][0], arm[i + 1][1], 0], 0.035 - i * 0.0008, 0.034 - i * 0.0008, 5, false);
    const ex = arm[12][0], ey = arm[12][1];
    P.cyl(M.whiteFlat, [ex, ey, 0], [ex, ey - 0.25, 0], 0.012, 0.012, 4, false);
    // lantern: square milk-glass box in a black frame with a pyramid cap
    P.box(M.lampGlass, ex - 0.15, ex + 0.15, ey - 0.78, ey - 0.3, -0.15, 0.15, '', 1);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.box(M.lantern, ex + sx * 0.15 - 0.02, ex + sx * 0.15 + 0.02, ey - 0.8, ey - 0.28, sz * 0.15 - 0.02, sz * 0.15 + 0.02, '', 1);
    P.box(M.lantern, ex - 0.2, ex + 0.2, ey - 0.84, ey - 0.78, -0.2, 0.2, 'b', 1); P.box(M.lantern, ex - 0.2, ex + 0.2, ey - 0.3, ey - 0.26, -0.2, 0.2, 'b', 1);
    const cap = [[ex - 0.2, ey - 0.26, -0.2], [ex + 0.2, ey - 0.26, -0.2], [ex + 0.2, ey - 0.26, 0.2], [ex - 0.2, ey - 0.26, 0.2]], apex = [ex, ey - 0.06, 0];
    for (let i2 = 0; i2 < 4; i2++) P.fan(M.lantern, [cap[i2], cap[(i2 + 1) % 4], apex], [(cap[i2][0] + cap[(i2 + 1) % 4][0]) / 2 - ex, 0.6, (cap[i2][2] + cap[(i2 + 1) % 4][2]) / 2], null);
  });
}
function lamps(K) {
  const M = K.M, root = K.root, lamp = lampGeo(M), S = PL.stair;
  let tris = 0;
  // the stair foot: two posts a little outside the cheek blocks, the arms curve toward the stair axis (-x / +x of the local frame: the arm points to +x local = toward +u)
  const spots = [];
  for (const s of [-1, 1]) spots.push({ u: s * 7.6, w: S.wFoot + 1.7, dirU: -s });
  // the ramp tips: one on each outer kerb end
  for (const R of K.shared.ramps || []) spots.push({ u: R.B[R.n - 1][0] + (R.name === 'N' ? 1.2 : 1.2), w: R.B[R.n - 1][1] + 1.0, dirU: R.name === 'N' ? 1 : -1, ramp: R });
  for (const sp of spots) {
    const p = W(sp.u, sp.w);
    // arm toward the world direction of +u (south) or -u: rotation about y so that local +x -> (0, 0, dirU) world
    const rot = sp.dirU > 0 ? -Math.PI / 2 : Math.PI / 2;
    const stoneY = 0;
    tris += put(root, lamp, p.x, stoneY, p.z, rot, 1, 'yel-lamp');
    K.svc.lamps.push({ x: p.x, z: p.z, h: 4.7 });
  }
  K.shared.lampSpots = spots;
  K.extraTris += tris;
}

// ------------------------------------------------------------------------------------------------ balls on stone posts, gates
function balls(K) {
  const M = K.M, root = K.root;
  const ball = geosOf((P) => { P.box(M.limestone, -0.42, 0.42, 0, 0.5, -0.42, 0.42, 'b', 1.8); P.box(M.limestone, -0.5, 0.5, 0.5, 0.6, -0.5, 0.5, 'b', 1.8); const g = new THREE.SphereGeometry(0.4, 16, 10); P.geo(M.sphere, g, 0, 1.0, 0); g.dispose(); });
  let tris = 0; const spots = [];
  for (const R of K.shared.ramps || []) {
    // the tip of each kerb: the block stands on the lawn at the end of the kerb
    for (const q of [R.B[R.n - 1], R.A[R.n - 1]]) { const p = W(q[0], q[1]); spots.push([p.x, 0, p.z]); }
  }
  for (const sp of spots) tris += put(root, ball, sp[0], sp[1], sp[2], 0, 1, 'yel-ball');
  K.extraTris += tris; K.shared.ballSpots = spots;
}

function gates(K) {
  const M = K.M, root = K.root;
  // the two mapped park gates (OSM n6750356708, n6750344129): two white piers with ball finials and the two lattice leaves swung open against the paths
  const pier = geosOf((P) => { P.box(M.limestone, -0.38, 0.38, 0, 2.1, -0.38, 0.38, 'b', 1.8); P.box(M.limestone, -0.46, 0.46, 2.1, 2.25, -0.46, 0.46, 'b', 1.8); const g = new THREE.SphereGeometry(0.28, 12, 8); P.geo(M.sphere, g, 0, 2.5, 0); g.dispose(); });
  const leaf = geosOf((P) => { P.quad(M.lattice, [0, 0.15, 0], [1.9, 0.15, 0], [1.9, 2.05, 0], [0, 2.05, 0], [0, 0, 1], [[0, 0], [1, 0], [1, 1.3], [0, 1.3]]); P.box(M.whiteFlat, 0, 1.9, 2.05, 2.1, -0.03, 0.03, 'b', 1); P.box(M.whiteFlat, 0, 1.9, 0.1, 0.15, -0.03, 0.03, 'b', 1); });
  let tris = 0;
  for (const g of [{ x: -4582.0, z: -5186.5, dx: 9.8, dz: 6.5 }, { x: -4637.5, z: -5166.1, dx: -0.595, dz: -0.803 }]) {
    const l = Math.hypot(g.dx, g.dz), tx = g.dx / l, tz = g.dz / l, nx = -tz, nz = tx;       // along the path / across
    for (const s of [-1, 1]) {
      tris += put(root, pier, g.x + nx * s * 2.1, 0, g.z + nz * s * 2.1, Math.atan2(tx, tz), 1, 'yel-gate');
      tris += put(root, leaf, g.x + nx * s * 1.9 - tx * 0.0, 0, g.z + nz * s * 1.9, Math.atan2(tx, tz) + (s > 0 ? 0 : Math.PI), 1, 'yel-gate');
    }
  }
  K.extraTris += tris;
}

// ------------------------------------------------------------------------------------------------ the museum plate
function plate(K) {
  const ctx = K.ctx, M = K.M;
  const lab = ctx.services.labels;
  const p = W(11.46, 0);                              // on the wall between the columns right of the arched windows (pal_01: the dark plate at the right)
  const y = F + 1.7, w = 0.62, h = 0.46, wx = PA.x;
  if (lab && !lab.reserve('w717881701', wx - 0.05, y, p.z, w, h, -1, 0, 'plate')) return;
  const tex = ctx.tex.draw(256, 192, (g, tw, th) => {
    g.fillStyle = '#1d2a36'; g.fillRect(0, 0, tw, th); g.strokeStyle = '#8fa4b5'; g.lineWidth = 4; g.strokeRect(6, 6, tw - 12, th - 12);
    g.fillStyle = '#e8eef3'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ctx.tex.fitText(g, 'ЕЛАГИН ДВОРЕЦ', tw / 2, th * 0.26, tw * 0.84, 34, ctx.tex.FONTS.sans, 700);
    ctx.tex.fitText(g, 'Архитектор К. И. Росси', tw / 2, th * 0.52, tw * 0.84, 24, ctx.tex.FONTS.sans, 500);
    ctx.tex.fitText(g, '1818 — 1822', tw / 2, th * 0.78, tw * 0.6, 28, ctx.tex.FONTS.sans, 500);
  }, { key: 'lmyepal-plate' });
  const mat = ctx.mat.toon('#ffffff', { map: tex, name: 'lmyepal-plate', paint: 0, polygonOffset: -2 });
  K.P.quad(mat, [wx - 0.05, y - h / 2, p.z + w / 2], [wx - 0.05, y - h / 2, p.z - w / 2], [wx - 0.05, y + h / 2, p.z - w / 2], [wx - 0.05, y + h / 2, p.z + w / 2], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  K.shared.plateMat = mat;
}

export function build(K) {
  stage(K, 'lions', () => lions(K));
  stage(K, 'vases', () => vases(K));
  stage(K, 'lamps', () => lamps(K));
  stage(K, 'balls', () => balls(K));
  stage(K, 'gates', () => gates(K));
  stage(K, 'plate', () => plate(K));
  if (K.errs) throw new Error(K.errs.join('\n'));
  void L;
}
