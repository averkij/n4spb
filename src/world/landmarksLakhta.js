// Lakhta Center: a continuous five-wing 462m glass tower and the surveyed
// boomerang/arch/administrative complex. Primary photographic/technical sources
// are documented in docs/research/lakhta-center.md. Static, bounded geometry;
// no frame callbacks, logos, ground coverage or impassable waterfront fences.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksOkrug65/kit.js';
import { SITES } from './landmarksLakhta/sites.js';
import { GROUPS_LIST } from './landmarksLakhta/groups.js';
import { buildTower } from './landmarksLakhta/tower.js';
import { buildComplex } from './landmarksLakhta/complex.js';

export function build(ctx) {
  const started = performance.now(), root = new THREE.Group(); root.name = 'landmarksLakhta';
  const selected = new Set((ctx.L?.GROUPS?.landmarksLakhta || GROUPS_LIST).map(g => g.key));
  if (!selected.has('okrug65-lakhta')) return;
  const P = new Parts(), mapped = ctx.L?.groupMembers?.('okrug65-lakhta') || [];
  const record = id => mapped.find(b => b.id === id) || SITES.find(b => b.id === id);
  const M = {
    towerGlass: ctx.mat.facade({ glass: '#537b8c', glassLit: '#c0d3dd', frame: '#8b9da5',
      spandrel: '#64808e', bay: 1.5, floor: 4.2, mullion: .055, transom: .065, spandrelH: .21,
      reflect: .80, metal: .4, lit: .025, blinds: .018, streak: .13, sparkle: .16,
      sunWarm: .08, grad: { bottom: .92, top: 1.07, height: 462 }, seed: 65, name: 'lakhta-cold-bent-glass' }),
    complexGlass: ctx.mat.facade({ glass: '#4d727e', glassLit: '#b7ced7', frame: '#91a5ad',
      spandrel: '#5d7781', bay: 1.5, floor: 4.2, mullion: .06, transom: .07, spandrelH: .16,
      reflect: .74, metal: .35, lit: .025, blinds: .02, streak: .08, sparkle: .15,
      sunWarm: .08, grad: { bottom: .94, top: 1.04, height: 85 }, seed: 66, name: 'lakhta-complex-glass' }),
    crown: ctx.mat.toon('#7d929c', { paint: .01 }), mesh: ctx.mat.toon('#aebbc0'),
    silver: ctx.mat.toon('#c8d0d2', { paint: .01 }), silverShade: ctx.mat.toon('#a5b2b8'),
    reveal: ctx.mat.toon('#59717f'), membrane: ctx.mat.toon('#c9cfd1', { paint: .01 }),
    atriumGlass: ctx.mat.facade({ glass: '#486b7c', glassLit: '#b2c8d5', frame: '#aebdc4',
      bay: 3, floor: 4.2, mullion: .09, transom: .08, spandrelH: .03, reflect: .82,
      streak: .08, metal: .3, sunWarm: .08, lit: 0, blinds: 0, seed: 67, name: 'lakhta-atrium-glass' }),
  };
  const service = { monuments: [], photoSpots: [
    { name: 'Лахта Центр с парка', x: -8980, z: -5590, yaw: 55, pitch: 13 },
    { name: 'Входная арка Лахта Центра', x: -9515, z: -6100, yaw: 88, pitch: 18 },
  ], parts: {}, triangles: 0, callbacks: 0 };
  const K = { ctx, P, M, record, service };
  buildTower(K); buildComplex(K);
  const meshes = P.build(root, { name: 'lakhta' }); ctx.addStatic(root);
  root.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(root);
  service.triangles = P.tris; service.meshes = meshes.length;
  service.bounds = { min: box.min.toArray(), max: box.max.toArray() };
  service.buildMs = Math.round(performance.now() - started);
  ctx.services.landmarksLakhta = service;
  const all = (ctx.services.landmarks ||= {});
  all.monuments = (all.monuments || []).concat(service.monuments);
  all.photoSpots = (all.photoSpots || []).concat(service.photoSpots);
}
