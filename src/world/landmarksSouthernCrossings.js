// Visual companions to the Kolomna fallback bridge floors. These use
// the existing roads, walk ramps and water openings; they do not claim OSM ways
// or replace collision floors. See docs/research/kolomna-fallback-bridges.md.
import * as THREE from 'three';
import { Parts } from './bridges/kit.js';
import { makeRailBatch, railWorld } from './bridges/rails.js';
import { registerLOD } from '../core/spatial.js';

// Centre, road bearing, width and water span are aligned to the current area
// floors and OSM water cuts, rather than treating published overall length as
// the length of open water. b follows bridges/sites.js (u points across water).
export const SOUTHERN_CROSSINGS = [
  { id: 'matisov', c: [-4044.1, 598.9], b: -112.62, w: 12.2, bank: [-15.5, 15.5], rail: 'moika', body: 'steel', profile: 'arch' },
  { id: 'banny', c: [-3923.65, 1028.75], b: 101.59, w: 12.2, bank: [-14.75, 15.25], rail: 'hairpin', body: 'concrete', profile: 'flat' },
  { id: 'bumazhny', c: [-4993.45, 2935.35], b: 20.5, w: 20, bank: [-6.5, 3.25], rail: 'hairpin', body: 'concrete', profile: 'flat' },
  { id: 'molvinsky', c: [-5256.1, 3562.7], b: 31.7, w: 27, bank: [-3.75, 6.25], rail: 'plainrods', body: 'granite', profile: 'arch' },
  { id: 'yekateringofsky', c: [-4995.3, 2188.95], b: 85.8, w: 19, bank: [-21.5, 25], rail: 'whip', body: 'steel', profile: 'flat' },
  { id: 'gutuevsky', c: [-5133.4, 2604.5], b: 95.5, w: 20, bank: [-45.25, 44.75], rail: 'plainrods', body: 'concrete', profile: 'shallow' },
];

// Horizontal side members sit below the asphalt and do not introduce a second
// walk floor. Open water stays navigable; bank and girder solids are visual.
export function collectSouthernCrossings(P, mats, rails) {
  for (const s of SOUTHERN_CROSSINGS) {
    const t = (s.b - 90) * Math.PI / 180, ct = Math.cos(t), st = Math.sin(t);
    const point = (u, v) => [s.c[0] + u * ct - v * st, s.c[1] + u * st + v * ct];
    const [a, b] = s.bank, n = Math.max(6, Math.ceil((b - a) / 3));
    const bottom = (u) => {
      const q = Math.abs((2 * u - a - b) / (b - a));
      if (s.profile === 'arch') return -.36 - .48 * q * q;
      if (s.profile === 'shallow') return -.48 - .3 * q * q;
      return -.58;
    };
    P.push(s.c[0], 0, s.c[1], -t);
    for (const side of [-1, 1]) {
      const v = side * (s.w / 2 - .18), mat = mats[s.body];
      for (let i = 0; i < n; i++) {
        const u0 = a + (b-a)*i/n, u1 = a + (b-a)*(i+1)/n;
        P.quad(mat, [u0,bottom(u0),v], [u1,bottom(u1),v], [u1,-.1,v], [u0,-.1,v], [0,0,side]);
      }
      P.box(mats.edge, a, b, -.18, -.08, v-.1, v+.1, 'b');
      const p = point(a, v), q = point(b, v);
      railWorld(rails, p[0], p[1], q[0], q[1], .04, s.rail, '#293b39');
    }
    P.pop();
  }
}

export function build(ctx) {
  const root = new THREE.Group(); root.name = 'southern-crossings';
  const P = new Parts(), rails = makeRailBatch(ctx);
  const mats = {
    steel: ctx.mat.toon('#5e6d67', { paint: .025 }),
    concrete: ctx.mat.toon('#a8a8a0', { paint: .015 }),
    granite: ctx.mat.toon('#a69b91', { paint: .015 }),
    edge: ctx.mat.toon('#7d817a', { paint: .015 }),
  };
  collectSouthernCrossings(P, mats, rails);
  const triangles = P.tris;
  for (const mesh of P.build(root, { name: 'southern-crossing' })) { mesh.updateMatrixWorld(true); registerLOD(mesh, 1500); }
  ctx.addStatic(root);
  rails.flush(root);
  ctx.services.southernCrossings = { triangles, sites: SOUTHERN_CROSSINGS.map(s => s.id), rails: rails.stats };
  return { root, triangles, rails: rails.stats };
}
