// landmarksKirova/gardentrees.js - the TREES of the Vasileostrovets garden (docs/research/kirova.md 10.3: an almost closed canopy of spruce, lime, maple, birch and elm; a spruce belt 8 .. 14 m wide along the Klubny
// lane side, the north end and behind the Roerich plaza, blue spruce for 1 in 6) planted with the instancing of trees.js (families of the environment module, frustum culled).  The park polygon w28473627
// is claimed (groups.js), so environment plants nothing there; this file keeps everything clear that the garden needs: the alleys (2.6 m from the OSM footway axes), the two lawns, the beds, the plaza and
// platform, the playground, the court, the ruin patch, the toilet cabin, the gate apron, the benches / lamps / fence line, every building and every carriageway (net.cover).  Deterministic (ctx.rng).
import * as L from '../layout.js';
import { FK } from './frame.js';
import { ROADS } from '../data/city.js';
import { RING_K } from './fence.js';
import { coverFn, distToLine, inRing } from './surfaces.js';
import { SPECIES } from './trees.js';

const inRect = (a, b, r0, r1, q0, q1, m = 0) => a > r0 - m && a < r1 + m && b > q0 - m && b < q1 + m;

export function build(K) {
  const { ctx } = K, cover = coverFn(ctx), rng = ctx.rng(5521);
  const ring = RING_K;                                                                 // frame K polygon (r, q)
  // footway polylines inside the park (frame K)
  const ways = [];
  for (const r of ROADS) {
    if (!r.pts || !(r.hw === 'footway' || r.hw === 'path' || r.hw === 'pedestrian' || r.hw === 'service')) continue;
    const pts = []; let any = false;
    for (let i = 0; i + 1 < r.pts.length; i += 2) { const m = FK.M(r.pts[i], r.pts[i + 1]); pts.push([m.a, m.b]); if (m.a > 120 && m.a < 260 && m.b > -300 && m.b < 215) any = true; }
    if (any && pts.length > 1) ways.push(pts);
  }
  const keep = [...K.svc.benches.map((b) => FK.M(b.x, b.z)).map((m) => [m.a, m.b, 2.2]), ...K.svc.lamps.map((l) => FK.M(l.x, l.z)).map((m) => [m.a, m.b, 1.6]),
    [240.6, -142.1, 5.5], [190.7, -182, 6.6], [189.3, -99.1, 6.6]];
  const excluded = (a, b) => {
    if (inRect(a, b, 182.2, 198.7, -224.1, -92.3, 2.0)) return true;                                    // the two lawns + hedges
    if (inRect(a, b, 174, 210, -92, -50, 2.5)) return true;                                              // the Roerich plaza
    if (inRect(a, b, 176.7, 200, 12, 33, 3.5)) return true;                                              // playground
    if (inRect(a, b, 155, 172, 134, 162, 3)) return true;                                                // court
    if (inRect(a, b, 178, 195, 44, 61, 2)) return true;                                                  // ruin patch
    if (inRect(a, b, 180, 203, -246, -222, 1.5)) return true;                                            // the south gate apron and the first metres of the alley
    if (inRect(a, b, 213, 223, 142, 150, 2)) return true;                                                // bare-earth clearing
    for (const [ka, kb, kr] of keep) if (Math.hypot(a - ka, b - kb) < kr) return true;
    for (const w of ways) if (distToLine(w, a, b) < 2.7) return true;
    return false;
  };
  const trees = [];
  const near = [];                                                                        // accepted: [a, b, r]
  for (let b = -240; b <= 196; b += 5.6) for (let a = 138; a <= 244; a += 5.6) {
    const ja = a + (rng() - 0.5) * 4.6, jb = b + (rng() - 0.5) * 4.6;
    if (!inRing(ring, ja, jb)) continue;
    // keep 2 m inside the fence: distance to the ring polyline
    if (distToLine(ring, ja, jb, true) < 2.2) continue;
    if (excluded(ja, jb)) continue;
    const w = FK.W(ja, jb); if (cover(w.x, w.z) > -2 || L.insideBuilding(w.x, w.z, 3.5)) continue;
    // species by zone: spruce belt at the west (Klubny) edge, the north end and behind the plaza
    const west = ja < 150, north = jb > 150, plazaBack = inRect(ja, jb, 170, 214, -52, -30), spruceP = west ? 0.62 : north ? 0.45 : plazaBack ? 0.55 : 0.1;
    const u = rng();
    let fam, s, col;
    if (u < spruceP) { const blue = rng() < 0.17; fam = 'spruceB'; s = 1.5 + rng() * 0.85; col = blue ? '#5f9288' : '#2f5a3d'; }
    else { const v = rng(); if (v < 0.24) { fam = 'birchA'; s = 0.95 + rng() * 0.45; } else { fam = 'limeA'; s = (v < 0.5 ? 0.85 : v < 0.75 ? 0.8 : 1.05) + rng() * 0.5; col = v < 0.5 ? '#4f8a3c' : v < 0.75 ? '#5d9a3e' : '#4f7a32'; } }
    const tr = Math.max(0.25, SPECIES[fam].trunk * s * 0.7);                                                    // the trunk collider radius of trees.js: clear of the asphalt by that and 0.8 m
    if (cover(w.x, w.z) > -Math.max(tr + 0.8, fam === 'spruceB' ? SPECIES[fam].R * s + 1.3 : 0)) continue;       // a spruce's lowest tier (radius R x s) must clear the asphalt as well (review: +0.3 and +0.7 left one spruce 9 cm inside the Klubny lane in the furniture audit: the audit measures the footprint of the distant crown, a bit wider than R x s)
    const rad = (fam === 'limeA' ? 4.0 : fam === 'birchA' ? 2.3 : 1.9) * s;
    if (near.some(([na, nb, nr]) => Math.hypot(na - ja, nb - jb) < (nr + rad) * 0.45)) continue;
    near.push([ja, jb, rad]);
    trees.push({ x: w.x, z: w.z, y: 0.02, fam, s, yaw: rng() * 6.28, col });
  }
  K.trees.push(...trees);
  K.svc.trees.push(...trees.map((t) => { const F = SPECIES[t.fam]; return { x: t.x, z: t.z, r: F.R * t.s, h: F.H * (t.sy ?? t.s) }; }));
  K.svc.gardenTrees = trees.length;
}
