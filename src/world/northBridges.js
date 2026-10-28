// Neva bridges: mapped OSM axes; Mostotrest dimensions. Exterior, closed state.
// Two 136m steel arch trusses + 48m bascule: Bolsheokhtinsky. Six spans: Liteyny.
// Further source details in docs/research/north-smolny.md.
// n4spb: copy of the source's northBridges.js (102_3d_piter at 0568f7af). The only edits: the two bridges are separate claims (northBridges/groups.js: 'north-bolsheokhtinsky', 'north-liteyny'),
// and a bridge is built only where the AREA claims its key (layout.GROUPS.northBridges: the area module keeps the sub-groups with mapped ways in its data), so an area never draws a deck whose
// land and water lie in its neighbour (Smolninskoye: the Bolsheokhtinsky deck; Palace-Liteyny: the Liteyny deck).
import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksD/kit.js';
import { GROUPS_LIST } from './northBridges/groups.js';
import { knockBays } from './lib/fence-bays.js';
import { solidPiers } from './bridges/piers.js';      // the drawn piers in the water are solid for a floating hull
export const OWNS_GROUPS = true;

export function build(ctx) {
  const root = new THREE.Group(); root.name = 'north-bridges';
  const P = new Parts(), surfaces = [], rbays = [];      // rbays: the breakable railing bays (docs/AREAS.md 13.7)
  const stone = ctx.mat.toon('#999d97', { paint: 0.055 }), light = ctx.mat.toon('#bab6a9');
  const metal = ctx.mat.toon('#536863', { paint: 0.03 }), dark = ctx.mat.toon('#3f4a50');
  const asphalt = ctx.mat.toon('#535a62'), stripe = ctx.mat.toon('#dbd7bf');
  const torus = new THREE.TorusGeometry(0.3, 0.035, 4, 12);
  const claimed = new Set((L.GROUPS.northBridges || GROUPS_LIST).map((g) => g.key));      // the sub-groups THIS area claims
  const bridges = [
    // Bank-side ends are averages of the mapped opposing carriageways.
    { key: 'bolsheokhtinsky', x: 2622.4, z: -1150.1, ex: 2961.1, ez: -1131.1, width: 26, ramp: 110, h: 7.0 },
    { key: 'liteyny', x: -123.6, z: -1972.35, ex: -77.6, ez: -2356.45, width: 34.6, ramp: 80, h: 6.0 },
  ].filter((b) => claimed.has('north-' + b.key));
  for (const b of bridges) {
    const dx = b.ex - b.x, dz = b.ez - b.z, len = Math.hypot(dx, dz), tx = dx / len, tz = dz / len;
    const rot = Math.atan2(tx, tz), c = Math.cos(rot), s = Math.sin(rot), half = b.width / 2;
    const yAt = d => Math.max(0.035, b.h * Math.min(1, (d + b.ramp) / b.ramp, (len + b.ramp - d) / b.ramp));
    const pos = (u, d) => [b.x + tx * d + c * u, b.z + tz * d - s * u];
    P.push(b.x, 0, b.z, rot);
    const start = -b.ramp, finish = len + b.ramp, n = Math.ceil((finish - start) / 6);
    for (let i = 0; i < n; i++) {
      const a = start + (finish - start) * i / n, d = start + (finish - start) * (i + 1) / n, ya = yAt(a), yd = yAt(d);
      P.quad(asphalt, [-half, ya, a], [half, ya, a], [half, yd, d], [-half, yd, d], [0, 1, 0]);
      P.quad(stone, [-half, ya - 1.1, a], [-half, ya, a], [-half, yd, d], [-half, yd - 1.1, d], [-1, 0, 0]);
      P.quad(stone, [half, ya - 1.1, a], [half, ya, a], [half, yd, d], [half, yd - 1.1, d], [1, 0, 0]);
      P.quad(stone, [-half, ya - 1.1, a], [half, ya - 1.1, a], [half, yd - 1.1, d], [-half, yd - 1.1, d], [0, -1, 0]);
      for (const side of [-1, 1]) {
        const outer = side * half, inner = side * (half - 2.3);
        P.quad(light, [inner, ya + 0.12, a], [outer, ya + 0.12, a], [outer, yd + 0.12, d], [inner, yd + 0.12, d], [0, 1, 0]);
        P.quad(light, [inner, ya, a], [inner, ya + 0.12, a], [inner, yd + 0.12, d], [inner, yd, d], [-side, 0, 0]);
        P.quad(light, [outer, ya, a], [outer, ya + 0.12, a], [outer, yd + 0.12, d], [outer, yd, d], [side, 0, 0]);
      }
      const markA = ya + (yd - ya) * 0.9 / (d - a) + 0.045, markD = yd - (yd - ya) * 0.9 / (d - a) + 0.045;
      for (const u of [-7, -3.5, 0, 3.5, 7]) P.quad(stripe, [u - 0.055, markA, a + 0.9], [u + 0.055, markA, a + 0.9], [u + 0.055, markD, d - 0.9], [u - 0.055, markD, d - 0.9], [0, 1, 0]);
      const [x, z] = pos(0, (a + d) / 2), seglen = d - a;
      ctx.physics.addWalkRamp(x, z, b.width, seglen + 0.035, rot, ya, yd, 1.1);
      surfaces.push({ x, z, c, s, len: seglen, width: b.width, ya, yb: yd });
    }
    // End faces close the concrete deck, including undersides at each approach.
    for (const d of [start, finish]) P.box(stone, -half, half, yAt(d) - 1.1, yAt(d), d - 0.035, d + 0.035);
    // the railing along both edges: a BAY per 2.5 m (a post with the cast-iron ornament, two tubes, a thin collider; lib/fence-bays.js), the ramps at both ends included
    for (let d = start; d < finish; d += 2.5) for (const side of [-1, 1]) {
      const d1 = Math.min(finish, d + 2.5), p = pos(side * half, d), q = pos(side * half, d1);
      rbays.push({ x0: p[0], z0: p[1], x1: q[0], z1: q[1], y: yAt(d), ye: yAt(d1), key: b.key });
    }
    if (b.key === 'bolsheokhtinsky') {
      const offset = (len - 320) / 2;
      for (const a of [offset, offset + 184]) {
        const arch = t => b.h + 2.0 + 22.3 * Math.sin(Math.PI * t);
        const panels = 20;
        for (const side of [-1, 1]) for (let j = 0; j < panels; j++) {
          const d0 = a + 136 * j / panels, d1 = a + 136 * (j + 1) / panels;
          const y0 = arch(j / panels), y1 = arch((j + 1) / panels), u = side * 10.1;
          for (const lift of [0, 1.4]) P.cyl(metal, [u, y0 + lift, d0], [u, y1 + lift, d1], 0.37, 0.37, 6);
          P.cyl(metal, [u, b.h + 0.3, d0], [u, y0, d0], 0.18, 0.18, 6);
          P.cyl(metal, [u, y0, d0], [u, y1 + 1.4, d1], 0.12, 0.12, 4);
          if (j > 1 && j < panels - 2) {
            P.cyl(metal, [u, b.h + 0.5, d0], [u, y1 - 0.25, d1], 0.09, 0.09, 4);
            P.cyl(metal, [u, y0 - 0.25, d0], [u, b.h + 0.5, d1], 0.09, 0.09, 4);
          }
          if (side === 1 && j > 2 && j < panels - 2) P.cyl(metal, [-10.1, y0 + 1, d0], [10.1, y0 + 1, d0], 0.2, 0.2, 6);
        }
      }
      for (const d of [offset, offset + 136, offset + 184, offset + 320]) P.box(stone, -15, 15, -4.5, b.h - 1.15, d - 3.8, d + 3.8);
      for (const d of [offset + 136, offset + 184]) {
        // Both control towers stand on the upstream (north) side of the piers.
        const u = 14.7;
        P.box(stone, u - 3.6, u + 3.6, -3.5, 24.8, d - 3.8, d + 3.8);
        for (const y of [6.5, 17.5, 24.4, 27.1]) P.box(light, u - 3.85, u + 3.85, y, y + 0.5, d - 4.0, d + 4.0);
        P.box(stone, u - 3.2, u + 3.2, 24.9, 28.1, d - 3.35, d + 3.35);
        P.box(dark, u - 2.4, u + 2.4, 28.1, 31.0, d - 2.4, d + 2.4);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.box(light, u + sx * 2.45 - 0.15, u + sx * 2.45 + 0.15, 28, 31.3, d + sz * 2.45 - 0.15, d + sz * 2.45 + 0.15);
        P.cyl(light, [u, 31.2, d], [u, 32.8, d], 3.6, 0, 4);
        for (let side = 0; side < 4; side++) {
          P.push(u, 0, d, side * Math.PI / 2);
          for (const y of [10, 15, 20]) P.box(dark, -0.43, 0.43, y, y + 1.9, 3.81, 3.86);
          // Rusticated vertical seams and a corbel course below the lantern.
          for (const x of [-2.7, -1.35, 0, 1.35, 2.7]) P.box(light, x - 0.18, x + 0.18, 23.2, 24.6, 3.84, 4.15);
          P.pop();
        }
      }
    } else {
      const piers = [0, 42, 97.4, 170, 242, 314, len];
      for (const d of piers) P.box(stone, -half + 0.5, half - 0.5, -4.5, b.h - 1.1, d - 2.7, d + 2.7);
      // Shallow steel girders run below the roadway, not high arch trusses.
      for (const u of [-half + 0.6, -8, 0, 8, half - 0.6]) P.box(metal, u - 0.22, u + 0.22, b.h - 2.5, b.h - 1.12, 0, len);
    }
    for (let d = start + 18; d < finish; d += 32) for (const u of [-half + 0.45, half - 0.45]) {
      const y = yAt(d);
      P.cyl(metal, [u, y + 0.15, d], [u, y + 7.3, d], 0.095, 0.05, 8);
      for (const off of [-0.8, 0.8]) {
        P.cyl(metal, [u, y + 6.65, d], [u, y + 7.3, d + off], 0.055, 0.035, 6);
        P.box(light, u - 0.2, u + 0.2, y + 7.3, y + 7.9, d + off - 0.22, d + off + 0.22);
      }
    }
    if (b.key === 'liteyny') for (const u of [-5.2, -4.6, 4.6, 5.2]) {
      const points = [];
      for (let i = 0; i <= n; i++) {
        const d = start + (finish - start) * i / n, [x, z] = pos(u, d);
        points.push([x, yAt(d) + 5.8, z]);
      }
      ctx.wires.add(points, { width: 0.012, color: '#465650' });
    }
    P.pop();
  }
  if (rbays.length) {
    const T = ctx.THREE || THREE, tube = new T.CylinderGeometry(0.05, 0.05, 1, 4, 1).rotateZ(Math.PI / 2).translate(0.5, 0, 0), post = new T.BoxGeometry(0.1, 1.1, 0.1).translate(0, 0.55, 0);
    const orn = new Parts(); { const Q = orn; Q.geo(metal, torus, 1.2 - 0.65, 0.72, 0, 0, 0, 0, 1, 0.85, 1); Q.geo(metal, torus, 1.2 + 0.65, 0.72, 0, 0, 0, 0, 1, 0.85, 1); Q.geo(metal, torus, 1.2, 0.73, 0, 0, 0, 0, 0.7, 1.05, 0.7); Q.box(metal, 1.07, 1.33, 0.53, 0.94, -0.045, 0.045); }
    const bal = new Parts(); for (const off of [0.6, 1.2, 1.8]) bal.box(metal, off - 0.025, off + 0.025, 0.35, 1.18, -0.025, 0.025);
    const meshesOf = (Q) => { const g = new THREE.Group(); Q.build(g, { name: 'north-bridges-orn' }); return g.children.map((m) => ({ geo: m.geometry, mat: m.material })); };
    const parts = [
      { geo: tube, mat: metal, name: 'tube-lo', far: 420, stretch: true, y: 0.35 }, { geo: tube, mat: metal, name: 'tube-hi', far: 420, stretch: true, y: 1.18 },
      { geo: post, mat: metal, name: 'post', far: 420, y: 0.15 },
      ...meshesOf(orn).map((t, i) => ({ geo: t.geo, mat: t.mat, name: 'orn' + i, far: 300, when: (q) => q.key === 'liteyny' })),
      ...meshesOf(bal).map((t, i) => ({ geo: t.geo, mat: t.mat, name: 'bal' + i, far: 300, when: (q) => q.key !== 'liteyny' })),
    ];
    // (the ornament templates are drawn in the frame of a bay: x along the bridge, y up, z across)
    knockBays(ctx, { name: 'north-bridges-rail', bays: rbays, parts, far: 420,
      collider: (q) => ({ y0: Math.min(q.y, q.ye), y1: Math.max(q.y, q.ye) + 1.2, thick: 0.18, e0: 0.02, e1: 0.02 }),
      rec: () => ({ kind: 'fence', mass: 110, h: 1.15, r: 0.06, anchored: 12, hitK: 0.25, metal: true, minDv: 0 }) });
  }
  solidPiers(ctx, P.build(root, { name: 'north-bridges' })); ctx.addStatic(root);
  const deckY = (x, z) => {
    for (const r of surfaces) {
      const dx = x - r.x, dz = z - r.z, u = dx * r.c - dz * r.s, v = dx * r.s + dz * r.c;
      if (Math.abs(u) <= r.width / 2 && Math.abs(v) <= r.len / 2 + 0.03) return r.ya + (r.yb - r.ya) * (v / r.len + 0.5);
    }
    return null;
  };
  ctx.services.northBridges = { deckY, segments: surfaces.length, bridges: bridges.map(b => b.key) };
}
