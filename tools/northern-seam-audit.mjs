// Inspect prospective handoffs of the two northern areas before generating gates.
import { REGISTRY } from '../src/areas/registry.js';
import { edgeLens, territoryProblems } from './lib/edge-geometry.mjs';

for (const id of ['komendantsky', 'sampson']) {
  console.log(`${id} territory: ${territoryProblems(REGISTRY[id].play).join('; ') || 'OK'}`);
  for (const to of Object.keys(REGISTRY)) {
    if (to === id || !REGISTRY[to].play?.length || REGISTRY[to].parked) continue;
    const a = REGISTRY[id].play, b = REGISTRY[to].play;
    if (!a.some(p => b.some(q => p.x0 < q.x1 && q.x0 < p.x1 && p.z0 < q.z1 && q.z0 < p.z1))) continue;
    const l = edgeLens(a, b);
    const near = l.back.filter(d => d < 100).length / l.back.length * 100;
    console.log(`${id} -> ${to}: works ${l.works}, dead ${l.dead}, worst ${JSON.stringify(l.strips[0] || null)}, bounce ${near.toFixed(1)}%`);
    if (l.works < 1000) {
      const intersections = a.flatMap(p => b.map(q => ({ x0: Math.max(p.x0, q.x0), x1: Math.min(p.x1, q.x1), z0: Math.max(p.z0, q.z0), z1: Math.min(p.z1, q.z1) })))
        .filter(r => r.x1 > r.x0 && r.z1 > r.z0);
      console.log(`  overlap boxes: ${JSON.stringify(intersections)}`);
    }
  }
}
