// Container stacks occupy only the surveyed container-yard polygons. Probe all
// corners and the middle against roads, water and buildings before placing one.
// Every stack remains a movable/breakable knock fixture, with no runtime scan.
import { VB } from '../traffic/vb.js';
import { knockInstances } from '../lib/knock-inst.js';
import { CONTAINER_YARDS } from './survey.js';
import { RAILS } from '../data/city.js';

const COLORS = ['#a55e4c', '#8d5146', '#506d74', '#8d9b8c', '#ba8056', '#6d6763'];
function inside(ring, x, z) {
  let yes = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) yes = !yes;
  }
  return yes;
}

export function buildYard(ctx, mat, svc) {
  const railGrid = new Map(), cell = 64;
  for (const rail of RAILS || []) {
    if (rail.tunnel || rail.layer < 0) continue;
    const pts = rail.pts || [];
    for (let i = 0; i + 3 < pts.length; i += 2) {
      const seg = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]];
      for (let x = Math.floor((Math.min(seg[0], seg[2]) - 8) / cell); x <= Math.floor((Math.max(seg[0], seg[2]) + 8) / cell); x++)
        for (let z = Math.floor((Math.min(seg[1], seg[3]) - 8) / cell); z <= Math.floor((Math.max(seg[1], seg[3]) + 8) / cell); z++) {
          const key = x + ',' + z; let list = railGrid.get(key); if (!list) railGrid.set(key, (list = [])); list.push(seg);
        }
    }
  }
  const nearRail = (x, z) => (railGrid.get(Math.floor(x / cell) + ',' + Math.floor(z / cell)) || []).some(([ax, az, bx, bz]) => {
    const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    return Math.hypot(x - ax - t * dx, z - az - t * dz) < 8;
  });
  const map = ctx.tex?.draw?.(512, 256, (g, w, h) => {
    g.fillStyle = '#e1e1e1'; g.fillRect(0, 0, w, h);
    for (let x = 10; x < w; x += 22) {
      g.fillStyle = '#8f8f8f'; g.fillRect(x, 5, 3, h - 10);
      g.fillStyle = '#ffffff'; g.fillRect(x + 3, 5, 2, h - 10);
    }
    g.strokeStyle = '#777777'; g.lineWidth = 5; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = '#d5d2c9'; g.fillRect(w - 70, h - 44, 48, 25);
    g.fillStyle = '#777777'; g.fillRect(w - 66, h - 38, 37, 3); g.fillRect(w - 66, h - 30, 23, 3);
  }, { key: 'sea-gates-yard-container-plates' });
  const cargoMat = map ? ctx.mat.toon('#ffffff', { vertexColors: true, map, paint: .025 }) : mat;
  const positions = [[], [], []];
  for (const yard of CONTAINER_YARDS) {
    const ring = yard.ring, x0 = Math.min(...ring.map(p => p[0])), x1 = Math.max(...ring.map(p => p[0])), z0 = Math.min(...ring.map(p => p[1])), z1 = Math.max(...ring.map(p => p[1]));
    let accepted = 0;
    // Wide lanes remain between rows, including open routes down to the quays.
    for (let x = Math.ceil(x0 / 16) * 16; x < x1 && accepted < 78; x += 16) for (let z = Math.ceil(z0 / 26) * 26; z < z1 && accepted < 78; z += 26) {
      const probes = [[0, 0], [-1.8, -6.8], [1.8, -6.8], [-1.8, 6.8], [1.8, 6.8], [0, -3.5], [0, 3.5]];
      const clear = probes.every(([dx, dz]) => {
        const px = x + dx, pz = z + dz;
        return inside(ring, px, pz) && (!ctx.L.inPlay || ctx.L.inPlay(px, pz)) && !ctx.L.insideBuilding?.(px, pz, 1)
          && ctx.L.waterLevelAt?.(px, pz) == null && !ctx.L.isOnRoad?.(px, pz, 4, { all: true });
      });
      if (!clear || nearRail(x, z)) continue;
      const n = ((Math.round(x / 16) * 7 + Math.round(z / 26) * 3) % 3 + 3) % 3;
      positions[n].push({ x, z, y: .05, rotY: 0 }); accepted++;
    }
  }
  for (let kind = 0; kind < positions.length; kind++) {
    const spots = positions[kind]; if (!spots.length) continue;
    const V = new VB(0), levels = kind + 2;
    for (let tier = 0; tier < levels; tier++) {
      const y = (tier + .5) * 2.6, col = COLORS[(kind * 2 + tier) % COLORS.length];
      V.box(2.44, 2.55, 12.19, col, [0, y, 0]);
      // Corrugations are the shared plate texture, rather than tens of thousands
      // of tiny ribs. Only the door locking bars need their close silhouette.
      for (const end of [-1, 1]) for (const x of [-.75, .75]) V.box(.055, 2.25, .08, '#b5afa1', [x, y, end * 6.13]);
    }
    const geo = V.build(), h = levels * 2.6;
    const items = spots.map(p => ctx.physics.addBox(p.x, p.z, 2.5, 12.25, p.rotY, 0, h));
    const r = knockInstances(ctx, { name: 'sea-gates-yard-' + levels + '-tier', parts: [{ geo, mat: cargoMat }], spots, items,
      rec: { kind: 'container-stack', mass: 2100 * levels, w: 2.5, d: 12.25, h, anchored: 25, hitK: .7, metal: true, minDv: .4 }, far: 1100 });
    svc.containerStacks += spots.length; svc.containers += spots.length * levels; svc.knockRecords += r.records.filter(Boolean).length;
    svc.triangles += V.tris * spots.length;
  }
}
