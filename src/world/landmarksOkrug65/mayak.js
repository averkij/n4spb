// The central fountain is a narrow rectangular water feature, not a circular
// basin. OSM r5255799 includes its central dry island. Photo-derived modelling
// retains the three tapered granite drums and the open slot at each collar.
import * as THREE from 'three';
import { Parts } from './kit.js';
import { SITES } from './sites.js';
import { ringFromFlat } from '../lib/massing.js';
import { knockInstances } from '../lib/knock-inst.js';

const X = -8415.3, Z = -5470.7, ROT = -0.252;
function buckets(P) {
  return [...P.b.values()].filter(k => k.n).map(k => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(k.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(k.nrm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(k.uv, 2));
    geo.setIndex(k.idx); geo.computeBoundingSphere(); geo.computeBoundingBox();
    return { geo, mat: k.mat };
  });
}

function lighthouse(K) {
  const { ctx, M, service } = K, C = new Parts();
  // No flag-bearing weather vane: the scene's flag rule also excludes the
  // actual flag-shaped finial. The granite lantern silhouette is retained.
  C.prism(M.coping, 0, 0, 2.6, 12, 0, 0.35);
  for (const [base, top, r0, r1] of [[0.35, 7.55, 1.72, 1.37], [8.2, 14.45, 1.36, 1.08], [15.1, 20.35, 1.07, 0.86]]) {
    C.cyl(M.granite, [0, base, 0], [0, top, 0], r0, r1, 16);
    // Stone courses and alternating narrow open slots under the flared caps.
    for (let y = base + 1.55; y < top - 0.4; y += 1.55) {
      const r = r0 + (r1 - r0) * (y - base) / (top - base);
      C.cyl(M.darkGranite, [0, y, 0], [0, y + 0.025, 0], r + 0.008, r + 0.008, 16, false);
    }
    C.cyl(M.darkGranite, [0, top + 0.02, 0], [0, top + 0.58, 0], r1 * 0.89, r1 * 0.89, 16);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      C.cyl(M.granite, [Math.cos(a) * r1 * 0.86, top, Math.sin(a) * r1 * 0.86], [Math.cos(a) * r1 * 1.1, top + 0.61, Math.sin(a) * r1 * 1.1], 0.105, 0.105, 5);
    }
    C.cyl(M.granite, [0, top + 0.52, 0], [0, top + 0.72, 0], r1 * 1.22, r1 * 1.3, 16);
  }
  C.cyl(M.granite, [0, 21.08, 0], [0, 21.28, 0], 1.2, 1.2, 20);
  C.cyl(M.granite, [0, 21.28, 0], [0, 21.55, 0], 1.2, 0.88, 20);
  const item = ctx.physics.addCylinder(X, Z, 1.78, 0.35, 21.9);
  knockInstances(ctx, {
    name: 'okrug65-mayak-column', parts: buckets(C), spots: [{ x: X, z: Z, y: 0.35 }], items: [item], far: 2200,
    rec: { kind: 'monument', mass: 12000, h: 21.55, r: 1.78, anchored: 48, hitK: 0.7, metal: false, minDv: 0.65 },
  });
  service.triangles += C.tris;
  service.monuments.push({ id: 'w163902553', name: 'Колонна-маяк', x: X, z: Z, h: 22 });
}

function benches(K) {
  const { ctx, M, service } = K, C = new Parts(), spots = [];
  C.box(M.granite, -1.1, 1.1, 0.48, 0.7, -0.35, 0.35, 'b');
  for (const u of [-0.75, 0.75]) C.box(M.coping, u - 0.18, u + 0.18, 0, 0.48, -0.28, 0.28, 'b');
  const c = Math.cos(ROT), s = Math.sin(ROT);
  for (const u of [-12.8, 12.8]) for (const v of [-32, -20, -8, 6]) spots.push({ x: X + c * u + s * v, z: Z - s * u + c * v, y: 0.12, rotY: ROT + Math.PI / 2 });
  const items = spots.map(p => ctx.physics.addBox(p.x, p.z, 2.2, 0.7, p.rotY, 0.12, 0.82));
  knockInstances(ctx, { name: 'okrug65-park-stone-benches', parts: buckets(C), spots, items, far: 300, rec: { kind: 'bench', mass: 330, h: 0.7, w: 2.2, d: 0.7, hitK: 0.2, minDv: 0.3 } });
  service.triangles += C.tris * spots.length; service.benches.push(...spots);
}

export function buildMayak(K) {
  const { P, M, ctx, service } = K, start = P.tris;
  const fountain = SITES.find(s => s.id === 'r5255799');
  P.far = 1500;
  for (const poly of fountain.polys) {
    const outer = ringFromFlat(poly.o), holes = poly.h.map(ringFromFlat);
    ctx.physics.addWater({ ring: poly.o, holes: poly.h, level: 0.077 });
    P.cap(M.water, outer, 0.077, true, 5, holes);
    // Granite lips are below the player's step height. No blocking basin wall,
    // navigation hole or water collider is added; feet and cars may enter it.
    for (const ring of [outer, ...holes]) for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), rot = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
      P.tbox(M.coping, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, len, 0.28, 0.04, 0.3, rot, 'b');
      ctx.physics.addWalkBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, len, 0.28, rot, 0.3, 0.04);
    }
  }
  P.push(X, 0, Z, ROT); P.far = 650;
  // The tower's square, low platform sits on the dry southern end of the pool.
  P.box(M.stone, -2.7, 2.7, 0.08, 0.35, -2.7, 2.7, 'b');
  ctx.physics.addWalkBox(X, Z, 5.4, 5.4, ROT, 0.35, 0.08);
  // Two long rows of inward-curving jets. Each is a static translucent tube;
  // no particle emitter, water wall or city-wide animation callback is needed.
  P.far = 400;
  for (const sign of [-1, 1]) for (let j = 0; j < 11; j++) {
    const x = sign * 6.6, z = -2 - j * 3.65;
    for (let k = 0; k < 8; k++) {
      const point = t => [x - sign * 4.7 * t, 0.19 + Math.sin(t * Math.PI) * (1.5 + (j % 3) * 0.22), z - t * 0.45];
      P.cyl(M.jets, point(k / 8), point((k + 1) / 8), 0.045, 0.035, 5, false);
    }
    P.cyl(M.steel, [x, 0.08, z], [x, 0.22, z], 0.1, 0.08, 6);
  }
  P.pop(); lighthouse(K); benches(K);
  service.photoSpots.push({ name: 'Маяк и фонтан Парка 300-летия', x: X + 15, z: Z + 35, yaw: 23, pitch: 12 });
  service.parts.mayak = { triangles: P.tris - start, waterOpen: true };
}
