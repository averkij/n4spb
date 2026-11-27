// Holiday squares at the Spit and the two ends of pedestrian 6th–7th Lines.
// BERKANO's Parade of Planets and the district programme are documented in
// docs/research/vasilyevsky-winter.md. Coordinates use the shared city frame.
import * as THREE from 'three';
import { Wa } from './landmarksStrelka/frame.js';
import { knockInstances } from './lib/knock-inst.js';
import { VB, mtx } from './traffic/vb.js';

export const VASILYEVSKY_SQUARES = [
  { id: 'birzhevaya', tree: [...Wa(0, 170), 20], snow: Wa(-7.8, 168) },
  { id: 'vasileostrovskaya', tree: [-4041.6, -1142.8, 12],
    arches: [[-4046.4, -1155.1, 0.527], [-4029.5, -1136, 0.527]],
    orbs: [[-4031.2, -1154.7], [-4026.7, -1146.9]] },
  { id: 'andreevsky-market', tree: [-3831.5, -778.0, 11],
    arches: [[-3828.9, -793.4, 0.527], [-3817.8, -774.4, 0.527]],
    orbs: [[-3818.5, -791.4], [-3813.9, -783.6]] },
];

// Freestanding illuminated globes and short chains of white ground lights
// frame the gravel walks. The granite model, anchor and waterfront stay clear.
const planets = [
  [-36, 118, 1.58, '#ff9868'], [-18, 124, 1.12, '#f8ce77'],
  [12, 117, 1.40, '#72d9e7'], [35, 124, 1.05, '#be7184'],
  [-30, 143, 1.70, '#e7ab6f'], [-11, 140, 1.55, '#f2d5a4'],
  [13, 138, 1.45, '#70c9cd'], [32, 146, 1.30, '#7998cd'],
];

export function buildVasilyevskyPlanets(ctx, glow) {
  if (!ctx.L.inPlay(...Wa(0, 140))) return;
  const spots = [];
  function place(mx, mz, radius, color, star = false) {
    const [x, z] = Wa(mx, mz), net = ctx.services.streets?.net || ctx._roadPlan;
    if (!ctx.L.inPlay(x, z) || ctx.L.waterLevelAt(x, z) != null ||
        ctx.L.insideBuilding(x, z, radius) || ctx.physics.columnBlocked(x, z, radius, 0.2, 2.5*radius) ||
        (net ? net.cover(x, z, {}) >= -radius - 0.5 : ctx.L.isOnRoad(x, z, radius + 0.5))) return;
    spots.push({ x, z, y: 0.10, s: radius, color, star, rotY: mx * 0.19 });
  }
  for (const [x, z, radius, color] of planets) place(x, z, radius, color);
  for (const [a, b] of [[0,1], [2,3], [4,5], [6,7]]) {
    const [x0,z0] = planets[a], [x1,z1] = planets[b];
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      place(x0 + (x1-x0)*t, z0 + (z1-z0)*t + Math.sin(Math.PI*t)*1.8, i % 2 ? 0.21 : 0.27, '#d6e9f9', true);
    }
  }
  if (!spots.length) return;
  const frame = new VB(), shell = new VB(), star = new VB();
  frame.cyl(0.52, 0.61, 0.23, '#687981', [0,0.115,0], null, 12);
  const sphere = new THREE.SphereGeometry(1, 28, 18);
  shell.add(sphere, '#ffffff', mtx([0,1.14,0]), (p, c) => {
    // Light bands and mottled cloud belts follow the sphere without a UV seam.
    const latitude = p.y - 1.14;
    const wave = Math.sin(23*latitude + 2.6*p.x + 1.4*Math.sin(3*p.z));
    c.multiplyScalar(0.49 + 0.46*(wave + 1)/2 + 0.09*Math.sin(p.y*31 - p.z*4));
  });
  sphere.dispose();
  star.sph(1, '#f2efe3', [0, 1.14, 0], 8);
  const mat = ctx.mat.toon('#ffffff', { vertexColors: true, name: 'spit-festival-stands' });
  knockInstances(ctx, {
    name: 'strelka-planets', spots, far: 270,
    parts: [{ geo: frame.build(), mat, name: 'stand' },
      { geo: shell.build(), mat: glow, name: 'globes', when: s => !s.star, color: s => s.color, shadow: false, noOutline: true },
      { geo: star.build(), mat: glow, name: 'stars', when: s => s.star, color: s => s.color, far: 155, shadow: false, noOutline: true }],
    items: (_, s) => ctx.physics.addCylinder(s.x, s.z, s.s, s.y, s.y + 2.14*s.s),
    rec: s => ({ kind: s.star ? 'festival-star' : 'festival-planet', mass: 35*s.s, r: s.s, h: 2.14*s.s }),
  });
}
