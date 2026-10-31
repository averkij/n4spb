// environment/lawns.js - the low vegetation and the sports / flower surfaces on top of the ground plane (ground.js paints the lawn colour itself). Adapted from the Yakutsk sibling
// for Saint Petersburg in July (docs/research/streets.md section 6: petunia pink #e0457b / #f08cb4, geranium red #d0242e, white #f5f1f0, lobelia blue #5a6fd0; trimmed lawn; clipped privet / box):
//   * sports pitches (GREEN kind "pitch"): artificial turf with white markings (goals / fences are props'); playgrounds are dark earth / rubber in the ground shader
//   * flowerbeds: GREEN "flowerbed" / "garden" polygons as raised beds with white kerbs and painted petunia / geranium / lobelia tops, plus a few round
//     beds (red geranium centre, white and pink petunia rings, blue lobelia edge) on the bigger garden lawns
//   * hedges: clipped privet / box runs (0.9-1.2 m) along some garden edges, with collision boxes
//   * grass tufts: a camera-centred pool of ~3000 blade clumps (trimmed lawn: fresh green, 6-30 cm; a few tall wild tufts at the walls) re-scattered at 2 m of walking, only where the
//     ground shader paints grass (field.categoryAt), never on roads / paving / belts. Wind sway from ctx.shared. This is what makes the
//     lawns read as grass at eye height.
// Claimed objects (the square's lawn beds, the amphitheatre hill) are skipped when their owner module is built (lib/claims.js).
import * as THREE from 'three';
import { GREEN } from '../data/city.js';
import * as L from '../layout.js';
import { MeshBuilder, addCap, addWalls, ringFromFlat } from '../lib/massing.js';
import { isOwned } from '../lib/claims.js';
import { HOOKS } from '../lib/area-tables.js';
import { Acc, hash2, clamp, mix, sstep, polyArea, ringCentroid, longestEdge, pointInPoly, distToRing, polyBox } from './util.js';
import { canopyMaterial, tuftMaterial } from './leafmat.js';

// ---------------------------------------------------------------- textures
function flowerTexture(ctx) {
  return ctx.tex.draw(256, 256, (g, w, h) => {
    const r = ctx.rng('env-flowers-pb');
    g.fillStyle = '#3f6428'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.5 ? '#35572a' : '#4f7a35'; g.beginPath(); g.ellipse(r() * w, r() * h, 8 + r() * 18, 6 + r() * 12, r() * 3, 0, 6.3); g.fill(); }
    const cols = ['#e0457b', '#f08cb4', '#e0457b', '#d0242e', '#f5f1f0', '#f08cb4', '#5a6fd0', '#e0457b', '#d0242e'];
    for (let i = 0; i < 640; i++) {
      const x = r() * w, y = r() * h, k = (Math.sin(x * 0.045) * Math.cos(y * 0.05) + 1) * 0.5, c = cols[Math.floor((k * cols.length + r() * 1.8)) % cols.length], rad = 2.6 + r() * 3.2;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        if (x + ox < -rad || x + ox > w + rad || y + oy < -rad || y + oy > h + rad) continue;
        g.fillStyle = c; g.beginPath(); g.arc(x + ox, y + oy, rad, 0, 6.3); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.arc(x + ox - rad * 0.25, y + oy - rad * 0.3, rad * 0.45, 0, 6.3); g.fill();
      }
    }
  }, { key: 'env-flowers-pb', repeat: [1, 1], anisotropy: 4 });
}
/** radial bed: red geranium centre, white and pink petunia rings, blue lobelia edge (uv 0..1 over the disc) */
function roundBedTexture(ctx) {
  return ctx.tex.draw(256, 256, (g, w, h) => {
    const r = ctx.rng('env-roundbed-pb'), c = w / 2;
    g.fillStyle = '#3b5a29'; g.fillRect(0, 0, w, h);
    const dot = (x, y, rad, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, rad, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.arc(x - rad * 0.25, y - rad * 0.3, rad * 0.45, 0, 6.3); g.fill(); };
    for (let i = 0; i < 1100; i++) {
      const a = r() * 6.283, d = Math.sqrt(r()) * c * 0.98, x = c + Math.cos(a) * d, y = c + Math.sin(a) * d, k = d / c;
      let col;
      if (k > 0.8) col = '#5a6fd0';                                                            // lobelia edge
      else if (k > 0.55) col = r() < 0.7 ? '#e0457b' : '#f08cb4';                              // petunia ring
      else if (k > 0.3) col = r() < 0.75 ? '#f5f1f0' : '#f08cb4';                              // white ring
      else col = r() < 0.8 ? '#d0242e' : '#f5f1f0';                                            // geranium centre
      dot(x, y, 3.2 + r() * 2.6, col);
    }
  }, { key: 'env-roundbed-pb', anisotropy: 4 });
}

// ---------------------------------------------------------------- pitches + beds
/** thin quad strip along a polyline [x,z,...] */
function line(B, pts, w, y) {
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const ax = pts[i], az = pts[i + 1], bx = pts[i + 2], bz = pts[i + 3], dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2;
    const a = B.vert(ax + nx, y, az + nz, 0, 1, 0), b = B.vert(ax - nx, y, az - nz, 0, 1, 0), c = B.vert(bx - nx, y, bz - nz, 0, 1, 0), d = B.vert(bx + nx, y, bz + nz, 0, 1, 0);
    B.tri(a, c, b); B.tri(a, d, c);
  }
}
/** ribbon of width w along the inside of a flat ring (probing the polygon for the inward side) */
function rimInward(B, poly, ring, w, y) {
  const n = ring.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, ax = ring[i * 2], az = ring[i * 2 + 1], bx = ring[j * 2], bz = ring[j * 2 + 1], dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz); if (l < 0.05) continue;
    let nx = -dz / l, nz = dx / l;
    if (!pointInPoly((ax + bx) / 2 + nx * 0.3, (az + bz) / 2 + nz * 0.3, poly)) { nx = -nx; nz = -nz; }
    const a0 = B.vert(ax, y, az, 0, 1, 0), a1 = B.vert(bx, y, bz, 0, 1, 0), b0 = B.vert(ax + nx * w, y, az + nz * w, 0, 1, 0), b1 = B.vert(bx + nx * w, y, bz + nz * w, 0, 1, 0);
    B.tri(a0, b1, a1); B.tri(a0, b0, b1);
  }
}

/** share of a polygon's area (sampled on a <= 8 x 8 grid) that lies in a drivable carriageway of the layout: a raised bed must not cover a lane */
function roadShare(p) {
  const bb = polyBox(p), step = Math.max(0.4, Math.min(bb.x1 - bb.x0, bb.z1 - bb.z0) / 8);
  let inside = 0, onRoad = 0;
  for (let x = bb.x0 + step / 2; x < bb.x1; x += step) for (let z = bb.z0 + step / 2; z < bb.z1; z += step) if (pointInPoly(x, z, p)) { inside++; if (L.isOnRoad(x, z, -0.2)) onRoad++; }
  return inside ? onRoad / inside : 0;
}

export function buildSurfaces(ctx, root, field, owned) {
  const T = ctx.THREE;
  const turf = new MeshBuilder(), lines = new MeshBuilder(), bedTop = new MeshBuilder(), bedWall = new MeshBuilder(), bedRim = new MeshBuilder();
  let pitches = 0, beds = 0;
  for (const g of GREEN) {
    if (isOwned(owned, g.id)) continue;
    for (const p of g.polys) {
      if (g.kind === 'pitch') {
        addCap(turf, p, 0.012, { uvScale: 8 }); pitches++;
        // markings: boundary inset 0.5 m, halfway line, centre circle on the long-edge rectangle
        const { ang } = longestEdge(p.o), c = Math.cos(ang), s = Math.sin(ang), [cx, cz] = ringCentroid(p.o);
        let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
        for (let i = 0; i < p.o.length; i += 2) { const u = (p.o[i] - cx) * c + (p.o[i + 1] - cz) * s, v = -(p.o[i] - cx) * s + (p.o[i + 1] - cz) * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
        u0 += 0.6; u1 -= 0.6; v0 += 0.6; v1 -= 0.6;
        const P = (u, v) => [cx + u * c - v * s, cz + u * s + v * c];
        const rect = [...P(u0, v0), ...P(u1, v0), ...P(u1, v1), ...P(u0, v1), ...P(u0, v0)];
        line(lines, rect, 0.11, 0.02);
        const um = (u0 + u1) / 2; line(lines, [...P(um, v0), ...P(um, v1)], 0.11, 0.02);
        const rc = Math.min(2.8, (v1 - v0) * 0.14), circ = []; for (let k = 0; k <= 24; k++) { const a = k / 24 * 6.2832; circ.push(...P(um + Math.cos(a) * rc, (v0 + v1) / 2 + Math.sin(a) * rc)); }
        line(lines, circ, 0.11, 0.02);
        for (const side of [-1, 1]) {                                     // penalty boxes and goal areas (small pitches: one box per end)
          const ue = side < 0 ? u0 : u1, d = side * -1, bw = (v1 - v0) * 0.55, bd = Math.min(5, (u1 - u0) * 0.2);
          line(lines, [...P(ue, (v0 + v1) / 2 - bw / 2), ...P(ue + d * bd, (v0 + v1) / 2 - bw / 2), ...P(ue + d * bd, (v0 + v1) / 2 + bw / 2), ...P(ue, (v0 + v1) / 2 + bw / 2)], 0.11, 0.02);
        }
      } else if ((g.kind === 'garden' || g.kind === 'flowerbed') && polyArea(p) > 3 && roadShare(p) < 0.1) {
        addCap(bedTop, p, 0.19, { uvScale: 1.5 }); addWalls(bedWall, ringFromFlat(p.o), 0, 0.21, { bay: 3, floor: 3 }); rimInward(bedRim, p, p.o, 0.14, 0.212); beds++;
      }
    }
  }
  // round beds on the bigger lawns near the square (not claimed, not tiny): one per lawn at its roomiest point
  const round = [];
  const cands = GREEN.filter((g) => (g.kind === 'grass' || g.kind === 'park') && !isOwned(owned, g.id) && !L.isClaimed(g.id)).flatMap((g) => g.polys.map((p) => ({ id: g.id, p })))
    .filter(({ p }) => polyArea(p) > 700).map((c) => ({ ...c, c: ringCentroid(c.p.o) })).sort((a, b) => polyArea(b.p) - polyArea(a.p)).slice(0, 8);
  for (const { p } of cands) {
    const bb = polyBox(p); let best = null, bd = 0;
    for (let k = 0; k < 160; k++) { const x = bb.x0 + (bb.x1 - bb.x0) * hash2(k, 3, 91), z = bb.z0 + (bb.z1 - bb.z0) * hash2(k, 7, 92); if (!pointInPoly(x, z, p)) continue; const d = Math.min(distToRing(x, z, p.o), field.pathDist(x, z) + 0.2, field.roadDist(x, z) + 0.6, field.hardOnlyDist(x, z) + 0.4); if (d > bd) { bd = d; best = [x, z]; } }
    if (best && bd >= 3.4) round.push({ x: best[0], z: best[1], r: Math.min(2.8, bd - 0.8) });
  }
  const mk = (B, mat, name, o = {}) => { if (B.empty) return null; const m = new T.Mesh(B.build(), mat); m.name = name; m.receiveShadow = true; m.castShadow = !!o.cast; if (o.noOutline) ctx.noOutline(m); root.add(m); return m; };
  mk(turf, ctx.mat.toon('#4a8a3a', { paint: 0.05, polygonOffset: -1, name: 'env-turf' }), 'env-turf');
  mk(lines, ctx.mat.decal('#ebe9de', { polygonOffset: -3, name: 'env-pitch-lines' }), 'env-pitch-lines', { noOutline: true });
  mk(bedTop, ctx.mat.toon('#ffffff', { map: flowerTexture(ctx), paint: 0.02, name: 'env-flowerbed' }), 'env-flowerbed');
  mk(bedWall, ctx.mat.toon('#ece9df', { paint: 0.04, name: 'env-bed-kerb' }), 'env-bed-kerb', { cast: true });
  mk(bedRim, ctx.mat.toon('#f2f0e8', { paint: 0.03, name: 'env-bed-rim' }), 'env-bed-rim');
  if (round.length) {
    const tex = roundBedTexture(ctx), kerbMat = ctx.mat.toon('#ece9df', { paint: 0.04, name: 'env-bed-kerb' }), topMat = ctx.mat.toon('#ffffff', { map: tex, paint: 0.02, name: 'env-roundbed' });
    for (const b of round) {
      // soil at 0.19 m (kerbs / footway surfaces beside a bed lie at 0.12-0.15: a top at 0.15 z-fought with them), the kerb ring stands to 0.22
      const kerb = new T.Mesh(new T.CylinderGeometry(b.r, b.r, 0.22, 28, 1, true), kerbMat); kerb.position.set(b.x, 0.11, b.z); kerb.castShadow = true; kerb.receiveShadow = true;
      const rim = new T.Mesh(new T.RingGeometry(b.r - 0.15, b.r, 28), kerbMat); rim.rotation.x = -Math.PI / 2; rim.position.set(b.x, 0.222, b.z); rim.receiveShadow = true;
      const top = new T.Mesh(new T.CircleGeometry(b.r - 0.15, 28), topMat); top.rotation.x = -Math.PI / 2; top.rotation.z = hash2(Math.round(b.x), Math.round(b.z), 5) * 6; top.position.set(b.x, 0.19, b.z); top.receiveShadow = true;
      root.add(kerb, rim, top);
      ctx.physics.addCylinder(b.x, b.z, b.r, 0, 0.3); field.addBlock(b.x, b.z, b.r + 0.2);
    }
  }
  return { pitches, beds: beds + round.length, round };
}

// ---------------------------------------------------------------- hedges
function hedgeGeometry(runs) {
  const P = [], N = [], C = [], I = [];
  const prof = [[-0.34, 0.0, -1, 0.1], [-0.25, 0.68, -0.6, 0.8], [0.25, 0.68, 0.6, 0.8], [0.34, 0.0, 1, 0.1]];                 // 4-point trapezoid: 6 triangles per section (the old 6-point round profile cost 10)
  const c0 = new THREE.Color('#34502a'), c1 = new THREE.Color('#5f8a3a');
  for (const r of runs) {
    const { ax, az, bx, bz, h, tint } = r, l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(l / 2.4)), tx = (bx - ax) / l, tz = (bz - az) / l, nx = -tz, nz = tx;
    const base = P.length / 3, tc = new THREE.Color(tint);
    const put = (i, x, z, end, wob) => {            // one profile ring at section i
      for (const [d, y, pnx, pny] of prof) {
        const w = d * end, yy = y * h * wob;
        P.push(x + nx * w, yy, z + nz * w);
        { const nl = Math.hypot(pnx, pny) || 1; N.push(nx * pnx / nl, pny / nl, nz * pnx / nl); }
        const t = Math.min(1, y / 0.68), k = 0.66 + 0.34 * t; C.push(mix(c0.r, c1.r, t) * k * tc.r * 1.1, mix(c0.g, c1.g, t) * k * tc.g * 1.1, mix(c0.b, c1.b, t) * k * tc.b * 1.1);
      }
    };
    for (let i = 0; i <= n; i++) put(i, ax + (bx - ax) * i / n, az + (bz - az) * i / n, i === 0 || i === n ? 0.7 : 1, 0.92 + 0.16 * hash2(i, Math.round(ax), 3));
    for (let i = 0; i < n; i++) for (let j = 0; j < prof.length - 1; j++) { const a = base + i * prof.length + j, b = a + 1, c = a + prof.length, d = c + 1; I.push(a, b, d, a, d, c); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(P.length / 3 * 2), 2));
  g.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1)); g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

/** hedge runs along lawn edges; returns [{ax,az,bx,bz,h}] too (the tree placer keeps clear of them) */
export function buildHedges(ctx, root, field, owned) {
  const runs = [];
  const lawns = GREEN.filter((g) => (g.kind === 'grass' || g.kind === 'park' || g.kind === 'garden') && !isOwned(owned, g.id));
  const TINT = ['#6f9a48', '#5a8a3a', '#7aa04e', '#4e7a3a'];   // clipped privet / box
  for (const g of lawns) for (const poly of g.polys) {
    if (polyArea(poly) < 90) continue;
    const ring = poly.o, n = ring.length / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, ax = ring[i * 2], az = ring[i * 2 + 1], bx = ring[j * 2], bz = ring[j * 2 + 1], l = Math.hypot(bx - ax, bz - az);
      if (l < 8) continue;
      const tx = (bx - ax) / l, tz = (bz - az) / l; let nx = -tz, nz = tx;
      const mx = (ax + bx) / 2, mz = (az + bz) / 2;
      if (!pointInPoly(mx + nx * 0.6, mz + nz * 0.6, poly)) { nx = -nx; nz = -nz; }
      const nearBld = field.bldDist(mx - nx * 1.5, mz - nz * 1.5) < 9;
      if (hash2(i, Math.round(ax * 7), 17) > (nearBld ? 0.42 : 0.16)) continue;
      const s0 = 1.2 + hash2(i, 4, 18) * 2, s1 = l - 1.2 - hash2(i, 5, 18) * 2; if (s1 - s0 < 4) continue;
      const inset = 0.8, a = [ax + tx * s0 + nx * inset, az + tz * s0 + nz * inset], b = [ax + tx * s1 + nx * inset, az + tz * s1 + nz * inset], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (![a, [(a[0] + m[0]) / 2, (a[1] + m[1]) / 2], m, [(m[0] + b[0]) / 2, (m[1] + b[1]) / 2], b].every(([x, z]) => field.clear(x, z, 0.9) && field.shore(x, z) > 2.4 && pointInPoly(x, z, poly) && !L.isOnRoad(x, z, 2.0))) continue;      // 2 m off the layout asphalt: the net widens junction mouths / parking pockets       // never on the quay edge (a hedge there would wall off the descents)
      const h = 0.9 + hash2(i, 6, 19) * 0.55, tint = TINT[Math.floor(hash2(i, 8, 20) * TINT.length)];
      runs.push({ ax: a[0], az: a[1], bx: b[0], bz: b[1], h, tint });
    }
  }
  if (!runs.length) return { runs };
  const m = new THREE.Mesh(hedgeGeometry(runs), canopyMaterial(ctx)); m.name = 'env-hedges'; m.castShadow = true; m.receiveShadow = true; ctx.noBatch(m); root.add(m);
  for (const r of runs) { const l = Math.hypot(r.bx - r.ax, r.bz - r.az); ctx.physics.addBox((r.ax + r.bx) / 2, (r.az + r.bz) / 2, l + 0.4, 0.7, Math.atan2(-(r.bz - r.az), r.bx - r.ax), 0, 1.1); }
  return { runs };
}

// ---------------------------------------------------------------- grass tufts (camera pool)
function clumpGeometry() {
  const A = new Acc(true), B = 8;
  for (let k = 0; k < B; k++) {
    const a = (k / B) * 6.2832 + hash2(k, 1, 7) * 0.9, r0 = 0.02 + 0.05 * hash2(k, 2, 7), lean = 0.08 + 0.26 * hash2(k, 3, 7), h = 0.7 + 0.3 * hash2(k, 4, 7), w = 0.032 + 0.02 * hash2(k, 5, 7);
    const ca = Math.cos(a), sa = Math.sin(a), bx = ca * r0, bz = sa * r0, tx = -sa, tz = ca;
    const up = (x, y, z, c) => A.vert(x, y, z, ca * 0.35, 0.94, sa * 0.35, c, c, c);
    const b0 = up(bx - tx * w / 2, 0, bz - tz * w / 2, 0.46), b1 = up(bx + tx * w / 2, 0, bz + tz * w / 2, 0.46);
    const m0 = up(bx - tx * w * 0.32 + ca * lean * 0.3 * h, 0.52 * h, bz - tz * w * 0.32 + sa * lean * 0.3 * h, 0.78), m1 = up(bx + tx * w * 0.32 + ca * lean * 0.3 * h, 0.52 * h, bz + tz * w * 0.32 + sa * lean * 0.3 * h, 0.78);
    const tip = up(bx + ca * lean * h, h, bz + sa * lean * h, 1.0);
    A.raw(b0, b1, m1); A.raw(b0, m1, m0); A.raw(m0, m1, tip);
  }
  return A.geometry();
}

export function buildTufts(ctx, root, field) {
  const T = ctx.THREE;
  const q = ctx.quality && (ctx.quality.level || ctx.quality.name);
  const scale = q === 'low' ? 0.5 : q === 'medium' ? 0.75 : 1;
  const SHORT_R = 7 * scale + 1, RIN = 11 * scale + 3, ROUT = 30 * scale + 6, CELL_IN = q === 'low' ? 0.85 : 0.62, CELL_OUT = 1.25;
  const MAX = Math.round(4800 * scale * scale + 500);
  const mesh = new T.InstancedMesh(clumpGeometry(), tuftMaterial(ctx, 'env-tuft'), MAX);
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.setColorAt(0, new T.Color(1, 1, 1)); mesh.instanceColor.setUsage(T.DynamicDrawUsage);
  mesh.count = 0; mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = true; mesh.name = 'env-tufts';
  ctx.noOutline(mesh); ctx.noBatch(mesh); root.add(mesh);
  const TONES = ['#5f8f2a', '#6e9a34', '#4f7f26', '#7aa83a', '#82a540', '#5a8a30', '#6a9a3a', '#4a7a2a'].map((h) => new T.Color(h));
  const STRAW = ['#8aa240', '#7a9a3a', '#98aa4c', '#82a038'].map((h) => new T.Color(h));
  const m4 = new T.Matrix4(), qt = new T.Quaternion(), pos = new T.Vector3(), scl = new T.Vector3(), up = new T.Vector3(0, 1, 0), col = new T.Color();
  let n = 0;
  const tmp = [0, 0, 0, 0];
  // ground the landmark owners lay themselves: claimed AREAS / GREEN / courtyards of owned buildings (field.claimed) and, once landmarksI is built, the floor of the Great Courtyard
  // (its setts lie at y 0.05, blades from y 0 would stand through them)
  let court = null, courtSvc = null;
  const inCourt = (x, z) => {
    const S = ctx.services && ctx.services.landmarksI, c = S && S.courtyard;
    if (c !== courtSvc) { courtSvc = c; court = c && c.length > 2 ? { o: c.flatMap((q) => (Array.isArray(q) ? q : [q.x, q.z])), h: [] } : null; if (court) court.box = polyBox(court); }
    return !!court && x >= court.box.x0 && x <= court.box.x1 && z >= court.box.z0 && z <= court.box.z1 && pointInPoly(x, z, court);
  };
  // Per-cell verdict cache (perf plan item 2, ?lawncache=0 to disable): a candidate's position, field queries,
  // category, height, width, yaw and colour depend only on its layer and cell, so a toroidal grid per layer
  // (sized to the layer's window) keeps them while the cell stays near the camera. Only the claimed / courtyard
  // tests and the rim thinning, which can change, run on every repack. No allocation per repack.
  const CACHE = typeof location === 'undefined' || new URLSearchParams(location.search).get('lawncache') !== '0';
  const LAYERS = [[0, SHORT_R, 0.4, 0.75, true], [0, RIN, CELL_IN, 1.0, false], [RIN, ROUT, CELL_OUT, 1.9, false]].map(([R0, R1, cell, sz, short]) => {
    const W = Math.ceil(2 * R1 / cell) + 4, N = W * W;
    return { R0, R1, cell, sz, short, W, tagI: new Int32Array(N).fill(0x7fffffff), tagJ: new Int32Array(N), ok: new Uint8Array(N), mat: new Float32Array(N * 16), rgb: new Float32Array(N * 3) };
  });
  // the field part of put(): false when rejected, else (h, w, yaw, r, g, b) in out
  function verdict(x, z, ring, ix, iz, short, out, o) {
    if (field.roadDist(x, z) < 0.5 || field.pathDist(x, z) < 0.8 || field.bldDist(x, z) < 0.9 || field.hardDist(x, z) < 0.3 || field.shore(x, z) < 0.6) return false;
    if (field.paveDist(x, z) < 0.3 && field.clsAt(x, z, tmp)[0] < 0.8) return false;
    const cat = field.categoryAt(x, z), r = hash2(ix, iz, 33);
    if (short && cat !== 'grass') return false;
    if (cat === 'grass') { /* always */ } else if (cat === 'gravel') { if (r > 0.1) return false; } else if (cat === 'setts') { if (r > 0.025) return false; } else return false;
    const tallN = field.noise.noiseAt(1, x, z, 0.045), tall = sstep(0.55, 0.75, tallN) * 0.6, wild = clamp(1 - field.bldDist(x, z) / 6, 0, 1) * 0.3;
    const h = short ? 0.045 + 0.07 * hash2(ix, iz, 34) : (0.1 + (0.4 * tall + 0.22 * wild) * (0.45 + 0.9 * hash2(ix, iz, 34))) * (0.8 + 0.4 * hash2(ix, iz, 35)) * (cat === 'grass' ? 1 : 0.8);
    const straw = sstep(0.6, 0.72, field.noise.noiseAt(0, x, z, 0.19));
    const pal = straw > 0.5 ? STRAW : TONES;
    col.copy(pal[Math.floor(hash2(ix, iz, 36) * pal.length)]).multiplyScalar(0.92 + 0.16 * hash2(ix, iz, 37));
    out[o] = h; out[o + 1] = ring * (0.8 + 0.5 * hash2(ix, iz, 38)) * (0.5 + 0.45 * Math.min(1, h / 0.4)); out[o + 2] = hash2(ix, iz, 39) * 6.2832;
    out[o + 3] = col.r; out[o + 4] = col.g; out[o + 5] = col.b;
    return true;
  }
  const one = new Float64Array(6);
  // the live part of put(): claims and courtyards can change; ANDed with the cached verdict, so the order is free
  const keepOut = HOOKS.tuftReject?.(ctx);                                         // the area's no-grass places (the North: the Paradny podium, the Kirochnaya campus; hooks/keep-out.js), once per build
  const live = (x, z) => !(field.claimed(x, z) || inCourt(x, z) || (keepOut && keepOut(x, z)) || (ctx._roadPlan ? ctx._roadPlan.cover(x,z,{}) > -0.8 : L.roadsNear(x,z,0.8,{drivable:true}).some(q=>q.gap<0.8)));
  function emit(x, z, out, o) {
    const h = out[o], w = out[o + 1];
    col.setRGB(out[o + 3], out[o + 4], out[o + 5]);
    qt.setFromAxisAngle(up, out[o + 2]);
    m4.compose(pos.set(x, 0.0, z), qt, scl.set(w, h, w));
    mesh.setMatrixAt(n, m4); mesh.setColorAt(n, col); n++;
  }
  // a cached cell: the float32 instance row composed on its miss, copied as is (bit-identical to emit)
  function emitCached(layer, c) {
    const ma = mesh.instanceMatrix.array, ca = mesh.instanceColor.array, mat = layer.mat, rgb = layer.rgb, mo = n * 16, so = c * 16;
    for (let k = 0; k < 16; k++) ma[mo + k] = mat[so + k];
    ca[n * 3] = rgb[c * 3]; ca[n * 3 + 1] = rgb[c * 3 + 1]; ca[n * 3 + 2] = rgb[c * 3 + 2];
    n++;
  }
  function put(x, z, ring, ix, iz, short) {
    if (n >= MAX || !live(x, z) || !verdict(x, z, ring, ix, iz, short, one, 0)) return;
    emit(x, z, one, 0);
  }
  // upload the drawn prefix only (plus any range still pending from a frame that was not rendered)
  function markPrefix(attribute, len) {
    let end = len; const ranges = attribute.updateRanges;
    for (let k = 0; k < ranges.length; k++) end = Math.max(end, ranges[k].start + ranges[k].count);
    if (end === 0) return;
    attribute.clearUpdateRanges(); attribute.addUpdateRange(0, end); attribute.needsUpdate = true;
  }
  function repack(cx, cz) {
    n = 0;
    for (let L = 0; L < LAYERS.length; L++) {
      const layer = LAYERS[L], R0 = layer.R0, R1 = layer.R1, cell = layer.cell, sz = layer.sz, short = layer.short, W = layer.W, tagI = layer.tagI, tagJ = layer.tagJ, ok = layer.ok;
      const i0 = Math.floor((cx - R1) / cell), i1 = Math.floor((cx + R1) / cell), j0 = Math.floor((cz - R1) / cell), j1 = Math.floor((cz + R1) / cell);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const x = (i + hash2(i, j, 31)) * cell, z = (j + hash2(i, j, 32)) * cell, ddx = x - cx, ddz = z - cz, d = Math.sqrt(ddx * ddx + ddz * ddz);
        if (d < R0 || d >= R1) continue;
        if (R0 > 0 && hash2(i, j, 40) > 1 - sstep(R1 - 8, R1, d)) continue;       // thin out toward the rim
        if (!CACHE) { put(x, z, sz, i + (R0 > 0 ? 7777 : short ? 3333 : 0), j, short); continue; }
        if (n >= MAX) continue;
        // cache lookup inline: a rejected cell costs no call at all (double arguments are boxed on calls)
        const c = (((i % W) + W) % W) * W + (((j % W) + W) % W);
        if (tagI[c] !== i || tagJ[c] !== j) {
          tagI[c] = i; tagJ[c] = j; ok[c] = verdict(x, z, sz, i + (R0 > 0 ? 7777 : short ? 3333 : 0), j, short, one, 0) ? 1 : 0;
          if (ok[c]) {
            col.setRGB(one[3], one[4], one[5]); qt.setFromAxisAngle(up, one[2]); m4.compose(pos.set(x, 0.0, z), qt, scl.set(one[1], one[0], one[1]));
            m4.toArray(layer.mat, c * 16); col.toArray(layer.rgb, c * 3);
          }
        }
        if (ok[c] && live(x, z)) emitCached(layer, c);
      }
    }
    mesh.count = n;
    if (CACHE) { markPrefix(mesh.instanceMatrix, n * 16); if (mesh.instanceColor) markPrefix(mesh.instanceColor, n * 3); }
    else { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
  }
  let lx = 1e9, lz = 1e9;
  ctx.onUpdate(() => {
    const p = ctx.camera.position, S = ctx.services && ctx.services.landmarksI;
    if (S && S.courtyard !== courtSvc) lx = 1e9;                                    // the Great Courtyard polygon appeared: re-scatter once
    if (Math.hypot(p.x - lx, p.z - lz) > 2.2) { lx = p.x; lz = p.z; repack(lx, lz); }
  });
  const h = ctx.L.HERO; repack(h.x, h.z); lx = h.x; lz = h.z;
  return { mesh, repack, count: () => n };
}
