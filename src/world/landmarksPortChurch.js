// The Epiphany Church, Dvinskaya 2, Gutuevsky Island: V. A. Kosyakov 1892–99.
// Exact OSM footprint w34863504. Silver scale onion with gilded lower scallops,
// red-brick clerestory, slate tents, open west belfry, layered brick arches and
// authored mosaic panels. References: docs/research/port-church-landmark.md.
// Approximate photographic heights: summit45 m, bell tent40 m, side tents31 m.
// No animation, sound, flags, fence or road furniture. All immutable geometry
// is material/range-bucketed and goes through the ordinary static batcher.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksPortChurch/kit.js';
import { materials } from './landmarksPortChurch/art.js';
import { SITE } from './landmarksPortChurch/site.js';
import { ringFromFlat, signedArea, addPolyColliders } from './lib/massing.js';
import { arch, archedPane, iconPanel, cross, onion, tent, openArch } from './landmarksPortChurch/shapes.js';

const OX = -5257.5, OZ = 2633.2, ROT = -0.028, TAU = Math.PI * 2;
function local(x, z) { const c = Math.cos(ROT), s = Math.sin(ROT), dx = x - OX, dz = z - OZ; return [c * dx - s * dz, s * dx + c * dz]; }

function lowerWalls(K, rec) {
  const { ctx, P, M } = K;
  for (const poly of rec.polys) {
    let ring = ringFromFlat(poly.o); if (signedArea(ring) > 0) ring.reverse();
    P.far = Infinity; P.cap(M.slate, ring, 11.5, true, 6);
    for (let k = 0; k < ring.length; k++) {
      const a = ring[k], b = ring[(k + 1) % ring.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.4) continue;
      const rot = Math.atan2(-(b[1] - a[1]), b[0] - a[0]), mid = local((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      P.push(a[0], 0, a[1], rot);
      P.box(M.brick, 0, len, 0.9, 11.5, -0.3, 0, 'bk');
      P.box(M.stone, 0, len, 0, 0.9, -0.3, 0.13, 'b');
      for (const [y, depth, h] of [[1.25, 0.18, 0.25], [3.05, 0.22, 0.28], [3.5, 0.14, 0.18], [10.85, 0.24, 0.2], [11.18, 0.35, 0.32]]) P.box(M.trim, 0, len, y, y + h, 0.02, depth, 'bk');
      P.far = 400;
      // Avoid a window behind the west entrance portal. Long north/south
      // facades instead have tall slim windows and recessed maiolica panels.
      if (!(mid[0] < -19 && Math.abs(mid[1]) < 5) && len > 3.4) {
        const n = Math.max(1, Math.floor(len / 5.1));
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) * len / n;
          archedPane(P, M, u, 4.05, Math.min(1.15, len / n * 0.27), 5.7, 0.035);
          P.box(M.darkBrick, u - 0.6, u + 0.6, 1.6, 2.55, 0.03, 0.08, 'bk');
          P.box(M.tile, u - 0.48, u + 0.48, 1.76, 2.4, 0.085, 0.10, 'bklrt');
        }
      }
      for (let i = 0; i < len / 0.45; i++) P.box(M.lightBrick, i * 0.45, Math.min(len, i * 0.45 + 0.18), 10.5, 10.76, 0.02, 0.17, 'bk');
      for (const u of [0.16, len - 0.16]) P.box(M.trim, u - 0.14, u + 0.14, 1, 10.8, 0.02, 0.21, 'bk');
      P.pop();
    }
    addPolyColliders(ctx, poly, 0, 11.5, 0.35);
  }
}

function drum(K) {
  const { P, M } = K; P.far = Infinity;
  P.prism(M.brick, 0, 0, 9.2, 8, 11.5, 17.2, Math.PI / 8);
  for (const [y, r, h] of [[16.8, 9.4, 0.3], [17.15, 9.65, 0.3], [17.5, 9.4, 0.35]]) P.prism(M.trim, 0, 0, r, 8, y, y + h, Math.PI / 8);
  // The photographed shoulders are richly articulated, even where the side
  // tents overlap them. Blind arches, paired shafts and small green maiolica
  // fields keep the diagonal faces from becoming a large blank brick drum.
  P.ranged(650, () => {
    const apothem = 9.2 * Math.cos(Math.PI / 8);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      P.push(Math.sin(a) * apothem, 0, Math.cos(a) * apothem, a);
      for (const x of [-2.7, 2.7]) {
        P.box(M.darkBrick, x - 0.22, x + 0.22, 11.7, 16.65, 0.02, 0.2, 'bk');
        for (let j = 0; j < 10; j++) P.box(M.lightBrick, x - 0.27, x + 0.27, 11.8 + j * 0.48, 11.95 + j * 0.48, 0.04, 0.27, 'bk');
      }
      for (const [r, w, mat] of [[1.6, 0.15, M.lightBrick], [1.86, 0.18, M.darkBrick], [2.16, 0.21, M.trim]]) arch(P, mat, 0, 13.8, r, w, 0.24);
      for (const x of [-1.72, 1.72]) P.box(M.lightBrick, x - 0.10, x + 0.10, 12.05, 13.8, 0.13, 0.26, 'bk');
      P.box(M.darkBrick, -1.1, 1.1, 12.6, 13.75, 0.03, 0.11, 'bk');
      P.box(M.tile, -0.91, 0.91, 12.79, 13.56, 0.115, 0.13, 'bklrt');
      for (const x of [-0.56, 0, 0.56]) P.tbox(M.tileLight, x, 0.15, 0.22, 0.025, 12.97, 13.35, 0, 'bklrt');
      for (let j = 0; j < 15; j++) P.box(M.lightBrick, -3.3 + j * 0.45, -3.12 + j * 0.45, 16.1, 16.34, 0.03, 0.19, 'bk');
      P.pop();
    }
  });
  // Sixteen tall clerestory windows around a cylindrical red-brick drum.
  // Metre UVs keep the brick courses at the same scale as the lower walls;
  // the collector's generic cylinder UVs would stretch one map round a drum.
  for (let i = 0; i < 48; i++) {
    const a = i * TAU / 48, b = (i + 1) * TAU / 48, r = 7.2;
    P.quad(M.brick, [Math.sin(a) * r, 17.8, Math.cos(a) * r], [Math.sin(b) * r, 17.8, Math.cos(b) * r], [Math.sin(b) * r, 31.7, Math.cos(b) * r], [Math.sin(a) * r, 31.7, Math.cos(a) * r], [Math.sin((a + b) / 2), 0, Math.cos((a + b) / 2)], [[a * r, 17.8], [b * r, 17.8], [b * r, 31.7], [a * r, 31.7]]);
  }
  for (const [y, r, h] of [[19.1, 7.5, 0.28], [20.5, 7.7, 0.35], [29.6, 7.5, 0.3], [31.1, 7.65, 0.4], [31.55, 7.85, 0.3]]) P.cyl(M.trim, [0, y, 0], [0, y + h, 0], r, r, 48);
  P.far = 650;
  for (let i = 0; i < 16; i++) {
    const a = i * TAU / 16;
    P.push(Math.sin(a) * 7.18, 0, Math.cos(a) * 7.18, a);
    archedPane(P, M, 0, 22.05, 1.0, 6.1, 0.08);
    // Narrow vertical brick pilaster shafts and carved capitals between lights.
    for (const x of [-1.05, 1.05]) {
      P.box(M.darkBrick, x - 0.13, x + 0.13, 21.1, 29.5, 0.04, 0.28, 'bk');
      for (let j = 0; j < 16; j++) P.box(M.lightBrick, x - 0.17, x + 0.17, 21.15 + j * 0.49, 21.29 + j * 0.49, 0.03, 0.33, 'bk');
    }
    arch(P, M.lightBrick, 0, 29.7, 0.44, 0.16, 0.25, 10);
    P.pop();
  }
  // Broad decorative kokoshnik band below the clerestory.
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12;
    P.push(Math.sin(a) * 7.35, 0, Math.cos(a) * 7.35, a);
    arch(P, M.trim, 0, 19.2, 1.5, 0.3, 0.2);
    arch(P, M.lightBrick, 0, 19.25, 1.15, 0.16, 0.24);
    P.pop();
  }
}

function mainDome(K) {
  const { P, M } = K, profile = [[31.85, 7.7], [32.05, 8.0], [33.6, 8.3], [35.05, 7.95], [36.5, 6.75], [38.0, 4.7], [39.25, 2.2], [40.3, 0.8], [41.0, 0.15]];
  P.far = Infinity;
  for (let i = 0; i + 1 < profile.length; i++) {
    const a = profile[i], b = profile[i + 1];
    P.cyl(i < 3 ? M.gold : M.silver, [0, a[0], 0], [0, b[0], 0], a[1], b[1], 64, false);
  }
  P.far = 650;
  // Gilded scallops rise over the broad rim against the silver scale surface.
  for (let i = 0; i < 32; i++) {
    const a = i * TAU / 32;
    P.push(Math.sin(a) * 7.93, 0, Math.cos(a) * 7.93, a);
    arch(P, M.goldLight, 0, 34.78, 0.47, 0.13, 0.03, 10);
    arch(P, M.goldDark, 0, 33.2, 0.29, 0.075, 0.29, 8);
    P.pop();
  }
  // A sparse diamond scale engraving follows the upper dome and disappears
  // at an authored near range; it does not inflate the distant silhouette.
  P.ranged(300, () => {
    for (let j = 3; j < profile.length - 2; j++) for (let i = 0; i < 48; i++) {
      const a = i * TAU / 48, b = (i + 0.5) * TAU / 48, c = (i + 1) * TAU / 48;
      const A = profile[j], B = profile[j + 1], ym = (A[0] + B[0]) / 2, rm = (A[1] + B[1]) / 2 + 0.035;
      const p = (angle, y, r) => [Math.sin(angle) * r, y, Math.cos(angle) * r];
      P.cyl(M.seam, p(a, A[0], A[1] + 0.035), p(b, ym, rm), 0.025, 0.025, 3, false);
      P.cyl(M.seam, p(b, ym, rm), p(c, A[0], A[1] + 0.035), 0.025, 0.025, 3, false);
    }
  });
  P.far = Infinity;
  P.cyl(M.gold, [0, 40.45, 0], [0, 41.2, 0], 0.84, 0.14, 24);
  P.geo(M.gold, new THREE.SphereGeometry(0.3, 10, 6), 0, 41.55, 0);
  cross(P, M, 0, 41.85, 0, 3.15);
}

function sideTents(K) {
  const { P, M } = K;
  for (const sign of [-1, 1]) {
    const z = sign * 10.0;
    P.far = Infinity;
    P.prism(M.brick, 0, z, 4.05, 8, 11.5, 17.6, Math.PI / 8);
    P.prism(M.trim, 0, z, 4.3, 8, 16.8, 17.1, Math.PI / 8);
    P.prism(M.lightBrick, 0, z, 4.1, 8, 17.25, 17.55, Math.PI / 8);
    tent(P, M, 0, z, 18.1, 27.6, 3.5);
    onion(P, M, 0, z, 28.5, 0.65, 1.65);
    P.far = 600;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      P.push(Math.sin(a) * 3.75, 0, z + Math.cos(a) * 3.75, a);
      arch(P, M.trim, 0, 16.9, 1.02, 0.23, 0.05);
      arch(P, M.lightBrick, 0, 16.9, 0.75, 0.13, 0.1);
      if (i % 2 === 0) archedPane(P, M, 0, 13.3, 0.65, 2.5, 0.08, false);
      P.pop();
    }
    // The north/south pediment each carries a gilt ground mosaic.
    P.push(0, 0, sign * 13.9, sign > 0 ? 0 : Math.PI);
    iconPanel(P, M, 0, 13.5, 1.35, 2.2, 0.05, sign > 0 ? 0 : 1);
    P.pop();
  }
}

function belfry(K) {
  const { P, M } = K, x = -15.3;
  P.far = Infinity;
  P.prism(M.brick, x, 0, 4.8, 8, 11.5, 16.2, Math.PI / 8);
  for (const [y, r, h] of [[15.6, 4.95, 0.3], [16.1, 5.15, 0.3], [20.6, 4.65, 0.35], [25.5, 4.2, 0.35]]) P.prism(M.trim, x, 0, r, 8, y, y + h, Math.PI / 8);
  // Two genuinely open tiers. Each face has an extruded arched opening.
  for (const [y, r, h] of [[16.5, 4.1, 3.7], [21.1, 3.65, 4.05]]) for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, side = 2 * r * Math.tan(Math.PI / 8);
    P.push(x + Math.sin(a) * r, 0, Math.cos(a) * r, a);
    openArch(P, M, side, h, 0.75, y, 0);
    for (const u of [-side / 2 + 0.12, side / 2 - 0.12]) P.box(M.lightBrick, u - 0.12, u + 0.12, y, y + h, 0.02, 0.19, 'bk');
    P.pop();
  }
  P.far = 500;
  for (const [z, r] of [[0, 0.65], [-1.6, 0.37], [1.6, 0.44]]) {
    P.cyl(M.dark, [x, 21.7, z], [x, 23, z], r, r * 0.5, 14);
    P.cyl(M.goldDark, [x, 21.63, z], [x, 21.74, z], r * 1.12, r * 1.12, 14);
  }
  P.far = Infinity;
  tent(P, M, x, 0, 26, 36.1, 3.55);
  onion(P, M, x, 0, 37, 0.67, 1.65, M.gold);
}

function eastChapel(K) {
  const { P, M } = K; P.far = Infinity;
  P.prism(M.brick, 10, 0, 6.6, 10, 11.5, 15.5, Math.PI / 10);
  P.cyl(M.slate, [10, 15.55, 0], [10, 17.5, 0], 6.85, 0.7, 10);
  onion(P, M, 10, 0, 18, 0.64, 1.4);
  P.prism(M.brick, 17.4, 0, 2.55, 8, 6.6, 10.9, Math.PI / 8);
  tent(P, M, 17.4, 0, 11.4, 16.7, 2.2);
  onion(P, M, 17.4, 0, 17.6, 0.44, 1.3, M.gold);
  P.far = 500;
  P.push(19.3, 0, 0, Math.PI / 2);
  archedPane(P, M, 0, 3.7, 0.7, 3.2, 0.2);
  P.pop();
}

function portal(K, rec) {
  const { P, M, ctx } = K; P.far = 650;
  // Anchor to the live mapped facade, not a photographic depth estimate.
  // The old -21.4 m origin sat behind its -21.72..-21.81 m west wall and
  // concealed the entire entrance. Keep every portal layer outside the wall.
  let wallU = Infinity;
  for (const poly of rec.polys) for (let i = 0; i < poly.o.length; i += 2) wallU = Math.min(wallU, local(poly.o[i], poly.o[i + 1])[0]);
  const portalU = wallU - 0.12;
  P.push(portalU, 0, 0, -Math.PI / 2);
  P.box(M.darkBrick, -3.8, 3.8, 0.65, 7.5, -0.2, 0, 'bk');
  P.box(M.dark, -1.6, 1.6, 0.7, 4.2, 0.02, 0.06, 'bk');
  arch(P, M.dark, 0, 4.1, 1.6, 0.2, 0.09);
  // Recess the inner orders and step each outer order forward by 4 cm. The
  // faces are separated from their backing and adjoining pilaster fronts.
  let depth = 0.15;
  for (const [r, band, m] of [[1.9, 0.18, M.lightBrick], [2.18, 0.20, M.darkBrick], [2.5, 0.22, M.trim], [2.85, 0.17, M.lightBrick], [3.16, 0.24, M.trim]]) {
    arch(P, m, 0, 4.15, r, band, depth);
    for (const sign of [-1, 1]) P.box(m, sign * (r + band / 2) - band / 2, sign * (r + band / 2) + band / 2, 0.7, 4.15, depth - 0.06, depth + 0.02, 'bk');
    depth += 0.04;
  }
  P.box(M.goldDark, -0.03, 0.03, 0.8, 4.8, 0.10, 0.12, 'bk');
  for (const u of [-5.0, 5.0]) iconPanel(P, M, u, 8.2, 1.3, 2.5, 0.08, u < 0 ? 2 : 3);
  // The entrance's low steps project into the parish forecourt, keeping the
  // Dvinskaya carriageway and river approach clear. Visual and walk boxes move
  // with the facade origin, so there is no invisible flight left inside it.
  for (let i = 0; i < 4; i++) {
    P.box(M.stone, -3.5, 3.5, 0, (i + 1) * 0.18, -0.2 - i * 0.32, 0.9 - i * 0.32, 'b');
    const u = portalU - (0.35 - i * 0.32);
    ctx.physics.addWalkBox(OX + Math.cos(ROT) * u, OZ - Math.sin(ROT) * u, 7, 1.1, ROT - Math.PI / 2, (i + 1) * 0.18, 0);
  }
  P.pop();
}

export function build(ctx) {
  const t0 = performance.now(), root = new THREE.Group(); root.name = 'landmarksPortChurch';
  const P = new Parts(), M = materials(ctx), rec = ctx.L?.groupMembers?.('port-epiphany')?.find(b => b.id === SITE.id) || SITE;
  const K = { ctx, P, M };
  lowerWalls(K, rec);
  P.push(OX, 0, OZ, ROT);
  drum(K); mainDome(K); sideTents(K); belfry(K); eastChapel(K); portal(K, rec);
  P.pop();
  for (const { mesh, mat } of P.build(root, { name: 'port-church' })) if (mat === M.mosaic) ctx.noOutline(mesh);
  ctx.addStatic(root);
  const service = {
    monuments: [{ id: SITE.id, name: 'Храм Богоявления на Гутуевском острове', x: OX, z: OZ, h: 45 }],
    photoSpots: [{ name: 'Западный портал Богоявленской церкви', x: -5320, z: 2630, yaw: -93, pitch: 12 }],
    entrances: [], triangles: P.tris, buildMs: Math.round(performance.now() - t0),
  };
  const all = (ctx.services.landmarks ||= {}); all.monuments = (all.monuments || []).concat(service.monuments); all.photoSpots = (all.photoSpots || []).concat(service.photoSpots);
  ctx.services.landmarksPortChurch = service;
}
