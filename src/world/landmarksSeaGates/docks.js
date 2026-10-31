// Kanonersky's three mapped floating docks. Open end-to-end; each tower wall
// is a separate knockable steel section, including its top walkway rail.
import * as THREE from 'three';
import { VB } from '../traffic/vb.js';
import { knockBays } from '../lib/fence-bays.js';
import { DOCKS } from './survey.js';

export function buildDocks(ctx, mat, svc) {
  for (const dock of DOCKS) {
    const c = Math.cos(dock.rotY), s = Math.sin(dock.rotY), water = ctx.L.waterLevelAt?.(dock.x, dock.z) ?? -3.2;
    const world = (x, z) => [dock.x + x * c + z * s, dock.z - x * s + z * c];
    const pontoon = new VB(0);
    pontoon.box(dock.width, 1.2, dock.length, '#693d35', [0, water - 1.2, 0]);
    // End wing platforms project beyond the towers without closing the basin.
    for (const side of [-1, 1]) for (const end of [-1, 1]) pontoon.box(8, .8, 7, '#8d4d3f', [side * (dock.width / 2 - 2), water - .2, end * (dock.length / 2 + 2)]);
    const base = new THREE.Mesh(pontoon.build(), mat); base.name = 'sea-gates-' + dock.id + '-pontoon';
    base.position.set(dock.x, 0, dock.z); base.rotation.y = dock.rotY; base.receiveShadow = true;
    ctx.noOutline(base); ctx.addStatic(base); svc.triangles += pontoon.tris;
    const thickness = (dock.width - dock.inside) / 2, top = dock.id === 'w537286435' ? 11.7 : 9.4;
    const panel = new VB(0);
    panel.box(1, top, thickness, '#c5c4b8', [.5, top / 2 - .4, 0]);
    panel.box(1, .3, thickness + .35, '#817f6e', [.5, top - .35, 0]);
    // Tall steel tower exterior plates and vertical buttress seams.
    for (const side of [-1, 1]) {
      panel.box(.055, top - .2, .22, '#9a9f95', [0, top / 2, side * thickness / 2]);
      panel.box(1, .18, .09, '#abae9e', [.5, top * .45, side * (thickness / 2 + .05)]);
      panel.box(1, .18, .09, '#abae9e', [.5, top * .7, side * (thickness / 2 + .05)]);
      // Walkway guard rail is part of this same breakable bay.
      panel.box(.025, 1.1, .06, '#686d66', [0, top + .2, side * (thickness / 2 - .22)]);
      panel.box(1, .08, .06, '#686d66', [.5, top + .73, side * (thickness / 2 - .22)]);
    }
    const geo = panel.build(), bays = [], n = Math.ceil(dock.length / 12);
    for (const side of [-1, 1]) for (let i = 0; i < n; i++) {
      const x = side * (dock.inside / 2 + thickness / 2), z0 = -dock.length / 2 + dock.length * i / n, z1 = -dock.length / 2 + dock.length * (i + 1) / n;
      const a = world(x, z0), b = world(x, z1);
      bays.push({ x0: a[0], z0: a[1], x1: b[0], z1: b[1], y: water - .7 });
    }
    const V = new VB(0);
    V.box(5.5, 3, thickness * .7, '#bfc3ba', [0, 1.5, 0]);
    V.box(5.1, 1.1, .06, '#56656b', [0, 2, thickness * .35 + .04]);
    const hutGeo = V.build(), hasHut = (bay, i) => i % n === Math.floor(n * .14) || i % n === Math.floor(n * .86);
    const result = knockBays(ctx, { name: 'sea-gates-' + dock.id + '-tower-bays', bays,
      parts: [{ geo, mat, stretch: true }, { geo: hutGeo, mat, at: 'mid', y: top - .3, when: hasHut }],
      collider: (bay) => ({ thick: thickness, y0: water - 1, y1: bay.y + top - .2 }),
      rec: { kind: 'dock-tower-section', mass: 6500, h: top + 1, anchored: 52, hitK: .5, metal: true, minDv: .7 }, far: 1800 });
    svc.triangles += panel.tris * bays.length; svc.knockRecords += result.records.filter(Boolean).length;
    // Housings belong to the tower bay's knock record and fall with it.
    svc.triangles += V.tris * bays.filter(hasHut).length;
    svc.docks.push({ id: dock.id, x: dock.x, z: dock.z, length: dock.length, width: dock.width, inside: dock.inside });
  }
  svc.photoSpots.push({ x: -7235, z: 2745, name: 'Канонерские плавучие доки', nameEn: 'Kanonersky floating docks' });
}
