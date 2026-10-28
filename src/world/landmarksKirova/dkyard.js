// landmarksKirova/dkyard.js - the COURTYARD of the Kirov Palace (frame FD: r along the front, q into the building; the rectangle between the wings r -52.5 .. 59.5, q -7.5 .. 89.5), docs/research/erarta-detail.md 4.3,
// photos dk12 (360 degree panorama of 6 June 2016) and dk05: the ground is DARK CRACKED ASPHALT in patches with worn bare-earth paths and grass patches, self-seeded ash / maple / lilac clumps (3 - 7 m,
// loose crowns), a black iron gate, graffiti on the brick annex.  The generic ground there was a blotchy grey with grass tufts.
// Recipe (flat decals of the decal kind, no new material): one asphalt polygon, worn earth ribbons between the doors, grass patches (irregular discs), self-seeded young trees and lilac clumps (instanced).
// Everything is clipped at the real asphalt of streets (the courtyard has none); PAVED_RINGS of groups.js keeps the generic tufts and trunks off it, this file plants its own.
import * as L from '../layout.js';
import { FD } from './frame.js';
import { fillPolyClipped, ribbon, coverFn } from './surfaces.js';

export const YARD_FD = [[-52.5, -7.5], [59.5, -7.5], [59.5, 89.5], [-52.5, 89.5]];
const PATHS = [[[-46, -6], [-30, 8], [-12, 36], [4, 52], [12, 70]], [[34, -6], [28, 18], [36, 44], [46, 66]], [[-44, 44], [-20, 58], [8, 72], [26, 82]], [[50, 6], [52, 30], [48, 58]], [[2, -6], [4, 30]]];

export function build(K) {
  const { ctx, P, M } = K, rng = ctx.rng(4417), cover = coverFn(ctx);
  const W = ([r, q]) => { const p = FD.W(r, q); return [p.x, p.z]; };
  fillPolyClipped(P, M.decal('#4d453c'), YARD_FD.map(W), 0.05, cover, { margin: 0.5, maxEdge: 3, tile: 6 });                     // the asphalt: dark, patched
  // asphalt patches of a lighter, cracked tone and bare earth: irregular discs
  const disc = (c, r0, n = 9) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, rr = r0 * (0.7 + 0.5 * rng()); return [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]; });
  const inYard = (x, z) => { const m = FD.M(x, z); return m.a > -50 && m.a < 57 && m.b > -5 && m.b < 87; };
  const free = (x, z, m = 1.2) => inYard(x, z) && !L.insideBuilding(x, z, m) && cover(x, z) < -0.6;
  const patches = [];
  for (let i = 0; i < 24; i++) {                                                                                             // grey patch repairs and cracks
    const c = W([-48 + 104 * rng(), -3 + 88 * rng()]); if (!free(c[0], c[1])) continue;
    fillPolyClipped(P, M.decal(i % 3 ? '#5a5248' : '#3f3830'), disc(c, 1.2 + 2.6 * rng(), 8), 0.058, cover, { margin: 0.5, maxEdge: 3, tile: 6 });
  }
  for (let i = 0; i < PATHS.length; i++) {                                                                                  // worn earth paths between the doors
    const pts = PATHS[i].map(W).filter(([x, z]) => free(x, z, 0.4)); if (pts.length < 2) continue;
    ribbon(P, M.decal(i % 2 ? '#6b5a48' : '#74634e'), pts, 0.9 + 0.5 * rng(), 0.066, { seg: 2.5, clip: (x, z) => cover(x, z) > -0.4, tile: 3 });
  }
  let ng = 0;
  for (let i = 0; i < 22; i++) {                                                                                             // grass patches, 1 - 3 m
    const c = W([-48 + 104 * rng(), -3 + 88 * rng()]); if (!free(c[0], c[1], 1.5)) continue;
    fillPolyClipped(P, M.decal(i % 4 ? '#6a8f45' : '#5a7f3a'), disc(c, 1.0 + 1.9 * rng(), 9), 0.078, cover, { margin: 0.5, maxEdge: 3, tile: 6 }); ng++;
    patches.push(c);
  }
  // self-seeded young trees (birch / lime 4 - 7 m) and lilac clumps in and around the grass patches
  let nt = 0;
  for (const c of patches) {
    if (rng() < 0.45) continue;
    const x = c[0] + (rng() - 0.5) * 2, z = c[1] + (rng() - 0.5) * 2; if (!free(x, z, 2.5)) continue;
    const fam = rng() < 0.55 ? 'birchA' : 'limeA', s = 0.4 + 0.3 * rng();                        // (the families the module plants anyway: every family is four instanced meshes)
    K.trees.push({ x, z, y: 0.05, fam, s, sy: s * (0.95 + 0.2 * rng()), tr: 0.2, yaw: rng() * 6.28 }); nt++;
  }
  for (let i = 0; i < 10; i++) {                                                                                             // lilac clumps: the crown of a shrub (R 1.0 x s) must clear the asphalt
    const x = W([-48 + 104 * rng(), -3 + 88 * rng()]), s = 1.0 + 0.8 * rng(); if (!free(x[0], x[1], 2) || cover(x[0], x[1]) > -(s + 1.0)) continue;
    K.trees.push({ x: x[0], z: x[1], y: 0.05, fam: 'shrub', s, yaw: rng() * 6.28, col: '#4d7f3a' }); nt++;
  }
  K.svc.stats = { ...(K.svc.stats || {}), yardGrass: ng, yardTrees: nt };
}
