// bridges/knock-posts.js - n4spb (docs/AREAS.md 13.7 / docs/vo-br.md): the lamp standards, torcheres and pedestal lamps of the bridges ported from the source project are KNOCK records.
// In the source they were drawn into the merged Parts of the bridge (bridges/kit.js) with a plain solid cylinder (or box) beside them: an unmovable pole in the middle of a footway.  Here a bridge builder
// collects them in a `PostBatch` instead of drawing them: `add(kind, draw, spot, collider)` where `draw(P)` draws ONE post at the origin (foot at y 0, no rotation) into a throw-away Parts, `spot` = { x, y, z, rotY }
// (the foot in the world) and `collider` = { r, y0, y1 } (a cylinder).  `flush(ctx, h)` (called from the builder's colliders()) adds the colliders and turns every kind into dynamic InstancedMeshes with one
// knock record per post (lib/knock-furniture.js: a car or a hard shove tips the standard over, the collider goes with it).  Without ctx.knock (the headless module tools) the structure is the static one of before.
import * as THREE from 'three';
import { Parts } from './kit.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';

/** the geometry of ONE post drawn at the origin by draw(P): { list: [{ mat, geo }], tris } (the buckets of a throw-away Parts as BufferGeometry) */
export function postGeos(draw) {
  const P = new Parts(); draw(P);
  const list = [];
  for (const k of P.b.values()) {
    if (!k.n) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(k.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(k.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(k.uv, 2));
    g.setIndex(k.n > 65535 ? new THREE.Uint32BufferAttribute(k.idx, 1) : new THREE.Uint16BufferAttribute(k.idx, 1));
    g.computeBoundingSphere();
    list.push({ mat: k.mat, geo: g });
  }
  return { list, tris: P.tris };
}

/** a collector of posts: add() while the bridge is drawn, flush() when its colliders are made */
export function postBatch(name) {
  const kinds = new Map();
  return {
    count: () => [...kinds.values()].reduce((n, k) => n + k.spots.length, 0),
    /** kind: a key (posts with the same key share the geometry of the first draw); h: the height for the knock record */
    add(kind, draw, spot, collider, h = 5) {
      let k = kinds.get(kind); if (!k) kinds.set(kind, (k = { draw, spots: [], cols: [], h }));
      k.spots.push(spot); k.cols.push(collider);
    },
    /** colliders + knock records; returns { colliders, tris } */
    flush(ctx) {
      let colliders = 0, tris = 0;
      for (const [kind, k] of kinds) {
        if (!k.spots.length) continue;
        const ph = ctx.physics, items = k.cols.map((c) => (c ? ph.addCylinder(c.x, c.z, c.r, c.y0, c.y1) : null));
        colliders += items.filter(Boolean).length;
        tris += knockFurniture(ctx, `${name}-${kind}`, postGeos(k.draw), k.spots, items, FURNITURE_REC.lamp(k.h), 320);
      }
      kinds.clear();
      return { colliders, tris };
    },
  };
}
