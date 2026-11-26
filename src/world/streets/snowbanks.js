import * as THREE from 'three';
import { registerLOD } from '../../core/spatial.js';
import { nearCrossing } from './net.js';
import { MB, PointGrid, rgb } from './util.js';

const crust = rgb('#eaedef'), packed = rgb('#c3cbd0'), grit = rgb('#989997');

// Follow the actual kerb samples, including parking pockets. Interrupt piles
// at lowered kerbs, boarding areas and driveway mouths. Heights are in metres.
export function buildSnowbanks(ctx, net, stops, entrances) {
  const gaps = new PointGrid(16);
  for (const stop of stops) gaps.add(stop.x, stop.z);
  for (const [x, z] of entrances) gaps.add(x, z);
  const cells = new Map();
  for (const { w, kind, side, pts } of net.kerbRuns) {
    if (kind !== 'edge' || w.skipDraw || w.bridge || w.rank < 1 || pts.length < 6) continue;
    const rng = ctx.rng('plough-' + w.id + side + Math.round(pts[0].s));
    for (let from = 1; from + 4 < pts.length;) {
      const spans = Math.min(pts.length - 2 - from, 3 + Math.floor(rng() * 8));
      const height = 0.33 + rng() ** 2 * 0.61, width = 0.46 + 0.43 * rng();
      let clear = true;
      for (let j = from; j <= from + spans; j++) {
        const p = pts[j];
        if (nearCrossing(net, p.x, p.z, 1.7) || gaps.any(p.x, p.z, 9) ||
            net.cover(p.x + p.ox * 0.7, p.z + p.oz * 0.7, {}) > -0.15) { clear = false; break; }
      }
      if (clear) {
        const start = pts[from], cell = Math.floor(start.x / 96) + ',' + Math.floor(start.z / 96);
        if (!cells.has(cell)) cells.set(cell, new MB(true));
        const b = cells.get(cell);
        let prev;
        for (let j = 0; j <= spans; j++) {
          const p = pts[from + j], taper = Math.min(1, j * 0.75, (spans - j) * 0.75);
          const h = 0.025 + taper * height * (0.7 + rng() * 0.48);
          const r = width * (0.42 + taper * (0.5 + rng() * 0.4));
          const v = (offset, y, col) => b.vert(p.x + p.ox * offset, y, p.z + p.oz * offset, 0, 0, undefined, col);
          const rim = 0.04 + 0.23 * rng();
          const row = [v(-r, 0.035, grit), v(-r * 0.55, 0.05 + h * 0.53, packed),
            v(rim, 0.14 + h, crust), v(rim + r * 0.49, 0.13 + h * 0.62, packed), v(rim + r, 0.116, crust)];
          if (prev) for (let k = 1; k < row.length; k++) b.quad(prev[k-1], prev[k], row[k], row[k-1]);
          prev = row;
        }
      }
      from += spans + 2 + Math.floor(rng() * 5);
    }
  }
  const material = ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0.09, name: 'ploughed-snow' });
  for (const b of cells.values()) {
    const mesh = new THREE.Mesh(b.build(true), material);
    mesh.name = 'kerb-snowbanks';
    mesh.receiveShadow = true;
    ctx.noOutline(mesh);
    ctx.addStatic(mesh);
    registerLOD(mesh, 165);
  }
}
