// Portal cranes follow the mapped crane rail strips, not invented quay lines.
// Cream dock cranes and olive/mustard cargo cranes follow the official KSZ
// dock photo and the terminal operator's equipment photographs (dossier).
import * as THREE from 'three';
import { VB } from '../traffic/vb.js';
import { knockInstances } from '../lib/knock-inst.js';
import { CRANE_RAILS, DOCK_CRANES, DOCKS } from './survey.js';

const C = { steel: '#b9c1b6', dark: '#555d57', rust: '#765244', window: '#34444b', yellow: '#b9a35c', olive: '#738f87' };

function lattice(V, a, b, halfWidth, count, col) {
  for (const side of [-1, 1]) V.rod([a[0] + side * halfWidth, a[1], a[2]], [b[0] + side * halfWidth * .55, b[1], b[2]], .17, col, 5);
  for (let i = 0; i < count; i++) {
    const t = i / count, t2 = (i + 1) / count, at = (u, side) => [a[0] + (b[0] - a[0]) * u + side * halfWidth * (1 - .45 * u), a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    V.rod(at(t, -1), at(t, 1), .10, col, 5);
    V.rod(at(t, i % 2 ? -1 : 1), at(t2, i % 2 ? 1 : -1), .10, col, 5);
  }
}

function portalGeometry(dock) {
  const V = new VB(0), col = dock ? C.steel : C.olive, top = dock ? 18 : 22;
  // Four rail bogies, splayed legs, and an open portal: no solid collision box
  // across the access road under the crane.
  for (const x of [-4.2, 4.2]) for (const z of [-4.5, 4.5]) {
    V.box(1.4, .9, 3.1, C.dark, [x, .45, z]);
    for (const dz of [-.9, .9]) V.cyl(.45, .45, .5, C.rust, [x, .45, z + dz], [0, 0, Math.PI / 2], 8);
    lattice(V, [x, 1, z], [x * .45, 10, z * .35], .45, 4, col);
  }
  V.box(5.4, 1.2, 6.5, C.dark, [0, 10.3, 0]);
  V.cyl(1.6, 2, top - 11, col, [0, (top + 11) / 2, 0], null, 10);
  V.box(7, .8, 6.5, C.dark, [0, top, 0]);
  V.box(3.1, 3.4, 3.8, col, [1.7, top + 2, 2.5]);
  V.box(2.8, 1.7, .06, C.window, [1.7, top + 2.55, 4.43]);
  V.box(.06, 1.7, 3.3, C.window, [3.28, top + 2.55, 2.5]);
  V.box(5.5, 3.8, 4.1, C.rust, [0, top + 2.3, -4]);
  const hinge = [0, top + 2.4, 2], tip = [0, top + (dock ? 23 : 20), dock ? 27 : 34];
  lattice(V, hinge, tip, 1.15, 10, dock ? C.steel : C.yellow);
  V.rod([-1.8, top + 2.5, -2], [0, top + 13, 0], .23, col, 6);
  V.rod([1.8, top + 2.5, -2], [0, top + 13, 0], .23, col, 6);
  V.rod([0, top + 13, 0], tip, .06, C.dark, 5);
  V.rod([0, top + 13, 0], [0, top + 4, -5], .06, C.dark, 5);
  V.rod(tip, [0, 11, tip[2]], .06, C.dark, 5);
  V.box(.9, 1.4, .65, C.yellow, [0, 10.3, tip[2]]);
  V.torus(.4, .09, C.dark, [0, 9.4, tip[2]], null, 5, 8, Math.PI * 1.6);
  return V.build();
}

function gantryGeometry() {
  const V = new VB(0), steel = '#d0ba70';
  for (const x of [-13, 13]) for (const z of [-6, 6]) {
    V.box(1.6, 1.1, 4, C.dark, [x, .55, z]);
    V.rod([x, 1, z], [x * .7, 25, z * .7], .6, steel, 6);
    V.rod([x, 2, z], [-x * .7, 25, z * .7], .22, steel, 5);
  }
  V.box(32, 2.5, 3.2, steel, [0, 26, 0]);
  V.box(7, 2.5, 8, '#aeb8b1', [3, 28.5, 0]);
  V.box(4, 2.6, 3, C.window, [4, 25, 5]);
  for (const x of [-2, 2]) V.rod([x + 3, 26, 0], [x + 3, 8, 0], .08, C.dark, 5);
  V.box(11.8, .8, 2.6, '#ac8e4d', [3, 7.6, 0]);
  return V.build();
}

export function buildCranes(ctx, mat, svc) {
  const variants = { dock: [], portal: [], gantry: [] }, rails = new VB(0);
  const bigDock = DOCKS.find(d => d.id === 'w537286435');
  for (const p of DOCK_CRANES) {
    const water = ctx.L.waterLevelAt?.(p.x, p.z) ?? -3.2;
    const s = Math.sin(bigDock.rotY), c = Math.cos(bigDock.rotY);
    const side = (p.x - bigDock.x) * c - (p.z - bigDock.z) * s;
    variants.dock.push({ ...p, y: water + 11, rotY: bigDock.rotY + (side > 0 ? -Math.PI / 2 : Math.PI / 2) });
  }
  for (const line of CRANE_RAILS) {
    const dx = line.b[0] - line.a[0], dz = line.b[1] - line.a[1], len = Math.hypot(dx, dz), tx = dx / len, tz = dz / len;
    const dock = line.id.startsWith('w747'), kind = dock ? 'dock' : line.kind;
    for (const side of [-1, 1]) rails.rod([line.a[0] - tz * side * 4.5, .12, line.a[1] + tx * side * 4.5], [line.b[0] - tz * side * 4.5, .12, line.b[1] + tx * side * 4.5], .07, '#746358', 5);
    for (let i = 0; i < line.count; i++) {
      const t = (i + .5) / line.count, x = line.a[0] + dx * t, z = line.a[1] + dz * t;
      // The boom faces the water side of its actual quay. The coordinate table
      // remains useful in the isolated authoring scene without water services.
      let yaw = Math.atan2(-tz, tx);
      const waterDistance = side => {
        for (let d = 10; d <= 130; d += 10) if (ctx.L.waterLevelAt?.(x - tz * d * side, z + tx * d * side) != null) return d;
        return Infinity;
      };
      if (waterDistance(-1) < waterDistance(1)) yaw += Math.PI;
      // Rail-strip stations are representative, while warehouse footprints are
      // actual mapped buildings. Do not put a crane's pedestal/portal in one.
      const c = Math.cos(yaw), s = Math.sin(yaw), half = kind === 'gantry' ? 13 : 4.2, depth = kind === 'gantry' ? 6 : 4.5;
      if (ctx.L.insideBuilding?.(x, z, 2) || [-half, half].some(lx => [-depth, depth].some(lz => ctx.L.insideBuilding?.(x + lx * c + lz * s, z - lx * s + lz * c, 1.5)))) continue;
      variants[kind].push({ x, z, y: .12, rotY: yaw });
    }
  }
  const railMesh = new THREE.Mesh(rails.build(), mat); railMesh.name = 'sea-gates-crane-rails'; railMesh.receiveShadow = true; ctx.addStatic(railMesh);
  svc.triangles += rails.tris;
  for (const [kind, spots] of Object.entries(variants)) {
    const geo = kind === 'gantry' ? gantryGeometry() : portalGeometry(kind === 'dock');
    const items = spots.map((p) => {
      const c = Math.cos(p.rotY), s = Math.sin(p.rotY), leg = kind === 'gantry' ? 13 : 4.2, depth = kind === 'gantry' ? 6 : 4.5;
      const out = [];
      for (const x of [-leg, leg]) for (const z of [-depth, depth]) out.push(ctx.physics.addBox(p.x + x * c + z * s, p.z - x * s + z * c, 1.7, 3.2, p.rotY, p.y, p.y + 11));
      return out;
    });
    const r = knockInstances(ctx, { name: 'sea-gates-' + kind + '-cranes', parts: [{ geo, mat }], spots, items,
      rec: { kind: 'port-crane', mass: 60000, w: kind === 'gantry' ? 28 : 11, d: 13, h: kind === 'gantry' ? 31 : 47, anchored: 65, hitK: .45, metal: true, minDv: .5 }, far: 2400 });
    svc.cranes += spots.length; svc.knockRecords += r.records.filter(Boolean).length;
    svc.triangles += geo.index.count / 3 * spots.length;
  }
}
