// ground-test.mjs - T3 of the Tauride remake: the garden floor (cover-mode terrain), its ground mask and material, the draped alleys and stairs, the two ground hooks. node tools/area.mjs north tools/tauride/ground-test.mjs [--no-env]
// Every check runs on the REAL modules (the built landmarksTauride, the built environment ground, the page's HOOKS); each group has mutants (a variant of the input or of a source file with one line cut) that must turn the
// matching check red. Circular things are said so: the centreline of a ribbon is compared with the data it was built from (the overlay against an image is T7).
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const imp = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
const args = new Set(process.argv.slice(2));
let failed = 0, total = 0;
const ok = (name, cond, detail = '') => { total++; if (!cond) failed++; console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? ' - ' + detail : ''}`); };
const t6Colliders = (s) => (s.fence?.colliders || 0) + (s.furniture?.colliders || 0) + (s.monuments?.colliders || 0) + (s.nursery?.colliders || 0);          // T8b: + the 12 of the nursery (9 houses, 3 replaced buildings)          // T6: the fence, the furniture and the monuments add their colliders to the module's
const hashOf = (...arrs) => { const h = createHash('sha1'); for (const a of arrs) h.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)); return h.digest('hex').slice(0, 16); };

const C = await imp('tools/tauride/lib/common.mjs');
const SE = await imp('tools/tauride/lib/stub-env.mjs');
const eng = await SE.loadEngine(ROOT);
const TM = await imp('src/world/landmarksTauride/terrain-mesh.js');
const GM = await imp('src/world/landmarksTauride/ground-material.js');
const PD = await imp('src/world/landmarksTauride/paths-draped.js');
const GH = await imp('src/world/landmarksTauride/height.js');
const DG = await imp('src/world/landmarksTauride/data/ground.js');
const Fo = await imp('src/world/landmarksTauride/data/footprints.js');
const Wd = await imp('src/world/landmarksTauride/data/water.js');
const Pd = await imp('src/world/landmarksTauride/data/paths.js');
const Fu = await imp('src/world/landmarksTauride/data/furniture.js');
const HG = await imp('src/areas/north/hooks/ground.js');
const NURSERY_RING = (await imp('src/world/landmarksTauride/data/nursery.js')).LOT_RING;      // T8b: the nursery lot's ring
const HP = await imp('src/areas/north/hooks/people.js');
const AT = await imp('src/world/lib/area-tables.js');
const FAC = await imp('src/areas/north/data/city.js');
const RING = Fo.GARDEN.o;

/** a copy of a module of landmarksTauride/ with one edit, loaded from memory (the relative imports made absolute) */
async function variant(file, re, to) {
  const abs = path.join(ROOT, 'src/world/landmarksTauride', file), SRC = fs.readFileSync(abs, 'utf8');
  if (!re.test(SRC)) throw new Error(`variant: ${re} not found in ${file} (update the test with the file)`);
  const text = SRC.replace(re, to).replace(/from '(\.{1,2}\/[^']+)'/g, (m, rel) => `from '${pathToFileURL(path.resolve(path.dirname(abs), rel)).href}'`).replace("from 'three'", `from '${pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href}'`);
  return import('data:text/javascript;base64,' + Buffer.from(text).toString('base64'));
}
const ringArea = (r) => Math.abs(C.ringArea(r));

// =============================================================== 1. the floor: the cover-mode terrain
console.log('1. the floor of the garden (terrain-mesh.js, cover mode)');
const pieces = TM.gardenPieces();
const floorChecks = (plan, M, label) => {
  const rows = [];
  const R = (name, cond, detail) => rows.push([name, !!cond, detail]);
  R('the triangles tile the garden polygon: their footprint equals its area (no hole, no overlap)', Math.abs(M.padArea - M.ringArea) < 1e-4 * M.ringArea, `${M.padArea.toFixed(1)} m2 for ${M.ringArea.toFixed(1)} m2`);
  R('every lattice point inside the polygon is covered (0.5 m lattice)', M.polyUncovered === 0, `${M.polyUncovered} of ${M.polyTotal} uncovered`);
  R('nothing lies outside the polygon: no triangle centroid outside, no corner more than 0.3 mm outside', M.trianglesOutside === 0 && M.vertsOutside < 3e-4, `${M.trianglesOutside} triangles outside, farthest corner ${M.vertsOutside.toExponential(2)} m`);
  R('watertight in the exact float32 positions: no edge in more than two triangles, no open edge except on the outline (no T-junction crack)', M.nonManifoldExact === 0 && M.openInterior === 0, `non-manifold ${M.nonManifoldExact}, open inside ${M.openInterior}, open on the outline ${M.openBoundary}`);
  R('the terrain is carried (T4a: bowls and banks included; fix round 1: the floor is planned with floorOptions()): ABOVE the water within 5 cm of gardenHeight on a 0.5 m lattice except 0.15 % of the samples (worst 11 cm, the cusps of the canals), UNDER the water (hidden by the opaque surface) off by at most the tolerance of the hidden bed (FLOOR_TUNING.sub, 25 cm) and never more than the base tolerance of the floor (FLOOR_TUNING.split, 6 cm) above the surface, every point lifted by 2 cm or more covered (but a few on the outline itself)', M.above.over5 <= 0.0015 * M.above.n && M.above.max <= 0.11 && M.sub.max <= TM.FLOOR_TUNING.sub.cap + 0.01 && M.sub.pokeMax <= TM.FLOOR_TUNING.split && M.uncovered <= 20, `above: max ${(M.above.max * 100).toFixed(2)} cm, ${M.above.over5} of ${M.above.n} over 5 cm; under the water: max ${(M.sub.max * 100).toFixed(1)} cm, ${M.sub.pokes} of ${M.sub.n} above the surface by at most ${(M.sub.pokeMax * 100).toFixed(1)} cm; uncovered ${M.uncovered} of ${M.lifted}`);
  R(`at most ${TM.TERRAIN.drawsMax} draws and ${TM.TERRAIN.trianglesTarget} triangles, no clip fallback`, plan.chunks.length <= TM.TERRAIN.drawsMax && plan.tris <= TM.TERRAIN.trianglesTarget && plan.clipFallbacks === 0, `${plan.tris} triangles, ${plan.chunks.length} draws, ${plan.clipFallbacks} fallbacks`);
  return rows;
};
const measure = (plan) => TM.measurePlan(plan, GH.gardenHeight, 0.5, RING, { waterY: GH.PONDS.WATER_Y });
const plan = TM.planTerrain(GH.gardenHeight, GH.RELIEF_BOX, TM.floorOptions({ cover: pieces }));
const M0 = measure(plan);
for (const [n, c, d] of floorChecks(plan, M0)) ok(n, c, d);
const plan2 = TM.planTerrain(GH.gardenHeight, GH.RELIEF_BOX, TM.floorOptions());
ok('deterministic: two plans have the same bytes', hashOf(...plan.chunks.flatMap((c) => [c.pos, c.idx])) === hashOf(...plan2.chunks.flatMap((c) => [c.pos, c.idx])));
ok('the convex pieces are convex, counter-clockwise, interior-disjoint and add up to the polygon', pieces.every((p) => p.every((_, i) => { const a = p[i], b = p[(i + 1) % p.length], c = p[(i + 2) % p.length]; return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) >= -1e-9; })) && Math.abs(pieces.reduce((s, p) => s + p.reduce((q, v, i) => q + v[0] * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * v[1], 0) / 2, 0) - ringArea(RING)) < 1e-3, `${pieces.length} pieces`);
{ // mutants of the floor
  const noShift = measure(TM.planTerrain(GH.gardenHeight, GH.RELIEF_BOX, TM.floorOptions({ cover: pieces, shift: [0, 0] })));
  ok('mutant: the lattice without its dyadic shift (outline vertices exactly on lattice lines) cracks the floor (open edges inside) - the shift is needed', noShift.openInterior > 0, `${noShift.openInterior} open edges inside`);
  const small = TM.planTerrain(GH.gardenHeight, GH.RELIEF_BOX, TM.floorOptions({ cover: pieces, ring: HG.insetRing(RING, 3) }));
  const ms = measure(small);
  ok('mutant: a floor clipped to a polygon 3 m smaller than the outline leaves holes (the coverage check turns red)', ms.polyUncovered > 1000, `${ms.polyUncovered} uncovered`);
  const bad = TM.planTerrain(GH.gardenHeight, GH.RELIEF_BOX, { cover: pieces, split: 0.4 }); const mb = measure(bad);
  ok('mutant: a 40 cm split tolerance turns the 5 cm check red', mb.maxErr > TM.TERRAIN.tol, `${(mb.maxErr * 100).toFixed(1)} cm`);
}
{ // the height of the planned mesh (what the ribbons are draped on)
  const mh = TM.makeMeshHeight(plan);
  let n = 0, bad = 0, maxd = 0, miss = 0;
  for (let x = 915; x < 1500; x += 3.7) for (let z = -1790; z < -1259; z += 3.9) if (C.inRing(x, z, RING) && C.ringDist(x, z, RING) > 0.05) { n++; const h = mh(x, z); if (h === null) { miss++; continue; } const g0 = GH.gardenHeight(x, z) ?? 0, e = Math.abs(h - g0), allow = Math.max(0.11, TM.pondTolAt()(x, z, g0) + 0.02); maxd = Math.max(maxd, e); if (e > allow) bad++; }
  ok('makeMeshHeight answers every sampled point of the polygon and agrees with gardenHeight within 11 cm (T4a: 5 cm but at the cusps of the canals; fix round 1: the hidden bed within its own tolerance FLOOR_TUNING.sub + 2 cm)', n > 5000 && miss === 0 && bad === 0, `${n} points, ${miss} without a triangle, ${bad} beyond their tolerance, max ${(maxd * 100).toFixed(2)} cm`);
}

// =============================================================== 2. the hole in the environment ground
console.log('2. the hole in the environment ground (HOOKS.groundHoles, HOOKS.groundWayReject)');
{
  const hole = HG.insetRing(HP.GARDEN_RING, HG.GROUND_HOLE_INSET);
  const hv = []; for (let i = 0; i < hole.length; i += 2) hv.push([hole[i], hole[i + 1]]);
  let minD = Infinity, outside = 0; for (const v of hv) { if (!C.inRing(v[0], v[1], RING)) outside++; minD = Math.min(minD, C.ringDist(v[0], v[1], RING)); }
  ok('the hole ring is simple, has the outline\'s vertex count and lies inside the outline by at least 0.8 x the inset', hole.length === RING.length && !C.selfIntersects(hole) && outside === 0 && minD >= 0.8 * HG.GROUND_HOLE_INSET, `${hv.length} vertices, closest to the outline ${minD.toFixed(3)} m (inset ${HG.GROUND_HOLE_INSET})`);
  const da = ringArea(RING) - ringArea(hole), per = C.polyLen([...RING, RING[0], RING[1]]);
  ok('its area is the outline\'s minus (perimeter x inset), within 6 %', Math.abs(da - per * HG.GROUND_HOLE_INSET) < 0.06 * per * HG.GROUND_HOLE_INSET, `${da.toFixed(1)} m2 less (expected ${(per * HG.GROUND_HOLE_INSET).toFixed(1)})`);
  ok('every point of the hole is covered by the floor (the floor is the outline, the hole inside it): the hole polygon vertices are inside the floor with margin', outside === 0);
  const m0 = HG.insetRing(RING, 0), mOut = HG.insetRing(RING, -0.5);
  let minD0 = Infinity; for (let i = 0; i < m0.length; i += 2) minD0 = Math.min(minD0, C.ringDist(m0[i], m0[i + 1], RING));
  let outN = 0; for (let i = 0; i < mOut.length; i += 2) if (!C.inRing(mOut[i], mOut[i + 1], RING)) outN++;
  ok('mutants: an inset of 0 touches the outline (margin check red) and an outset puts vertices outside it (inside check red)', minD0 < 0.8 * HG.GROUND_HOLE_INSET && outN > 0, `inset 0: ${minD0.toExponential(1)} m, outset: ${outN} vertices outside`);
  const page = AT.HOOKS;
  ok('the page\'s HOOKS has groundHoles and groundWayReject (functions); the list without the module has neither', typeof page.groundHoles === 'function' && typeof page.groundWayReject === 'function' && HG.makeGroundHoles(['environment']) === undefined && HG.makeGroundWayReject(['environment']) === undefined && HG.makeGroundHoles(undefined) === undefined);
  ok('groundHoles hands out the garden ring (a copy) equal to the inset outline, then (T8b) the nursery lot ring moved in by the same 6 cm', (() => { const r = page.groundHoles(); return r.length === 2 && r[0].length === hole.length && r[0].every((v, i) => v === hole[i]) && r[0] !== page.groundHoles()[0] && r[1].length === NURSERY_RING.length && r[1] !== page.groundHoles()[1]; })());
  const claimed = new Set((await imp('src/world/landmarksTauride/groups.js')).GROUPS_LIST.flatMap((g) => g.osm || []));
  const garden = [...HG.GARDEN_WAY_IDS];
  ok('the 120 ways the ground does not paint are exactly the garden ways that the module claims', garden.length === 120 && garden.every((id) => claimed.has(id)) && page.groundWayReject({ id: 'w81524425' }) === true && page.groundWayReject({ id: 'w1' }) === false);
  ok('the area-tables validator knows both keys: a non-function value is dropped with a warning that names it', (() => { const w = []; const o = AT.checkHooks({ groundHoles: 5, groundWayReject: 'x', carKeepOut: () => 1 }, (m) => w.push(m)); return !('groundHoles' in o) && !('groundWayReject' in o) && typeof o.carKeepOut === 'function' && w.length === 2 && /groundHoles/.test(w[0]) && /groundWayReject/.test(w[1]); })());
  { // the junction with the Palace court and the Paradny podium: the floor does not touch them
    const P = await imp('src/areas/north/hooks/paradny.js'), pal = FAC.BUILDINGS.find((b) => b.id === 'r3801092'), podium = P.PARADNY_PODIUM.o;
    const dist = (r) => { let m = Infinity; for (let i = 0; i < r.length; i += 2) m = Math.min(m, C.ringDist(r[i], r[i + 1], RING)); return m; };
    const inside = (r) => { for (let i = 0; i < r.length; i += 2) if (C.inRing(r[i], r[i + 1], RING)) return true; return false; };
    const dPal = Math.min(...pal.polys.map((q) => dist(q.o))), dPod = dist(podium);
    ok('the floor does not reach the Palace (its footprint is 18 m from the outline) or the Paradny podium (69 m): no vertex of either lies inside the garden polygon, so there is no seam, no overlap and no z-fight to show there; the environment ground between them is untouched', dPal > 15 && dPod > 60 && !pal.polys.some((q) => inside(q.o)) && !inside(podium), `Palace ${dPal.toFixed(1)} m, podium ${dPod.toFixed(1)} m`);
  }
  // the engine call sites (text): the strip's HOOKS is {} so both are falsy there
  const gtxt = fs.readFileSync(path.join(ROOT, 'src/world/environment/ground.js'), 'utf8'), ftxt = fs.readFileSync(path.join(ROOT, 'src/world/environment/field.js'), 'utf8');
  const areaImports=text=>new Set([...text.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/lib\/area-tables\.js['"]/g)].flatMap(m=>m[1].split(',').map(s=>s.trim().split(/\s+as\s+/)[0])));
  const gi=areaImports(gtxt),fi=areaImports(ftxt);
  ok('the engine reads both through lib/area-tables.js behind a falsy test (the strip changes nothing)', gi.has('HOOKS') && /HOOKS\.groundHoles \? HOOKS\.groundHoles\(\) : null/.test(gtxt) && fi.has('ZONES') && fi.has('HOOKS') && /const wayReject = HOOKS\.groundWayReject;/.test(ftxt) && /if \(wayReject && wayReject\(r\)\) continue;/.test(ftxt));
}

// =============================================================== 3. the ground mask
console.log('3. the ground mask (planGroundMask)');
const inputs = () => GM.collectGroundInputs({ GARDEN: Fo.GARDEN, GARDEN_GREEN: Fo.GARDEN_GREEN, FOOTPRINTS: Fo.FOOTPRINTS, WATER_UNION: Wd.WATER_UNION, PATHS: Pd.PATHS, BENCHES: Fu.BENCHES, GATES: Fu.GATES, MONUMENTS: Fu.MONUMENTS, FOUNTAINS: Fu.FOUNTAINS }, FAC.GREEN, GH.gardenHeight);
const mask = GM.planGroundMask(inputs()), mask2 = GM.planGroundMask(inputs());
{
  const b = mask.box, at = (x, z) => { const i = Math.floor((x - b.x0) / b.res), j = Math.floor((z - b.z0) / b.res), o = (j * b.W + i) * 4; return [mask.data[o], mask.data[o + 1], mask.data[o + 2], mask.data[o + 3]]; };
  ok('deterministic: two masks have the same bytes', hashOf(mask.data) === hashOf(mask2.data));
  ok(`size: ${b.W} x ${b.H} cells of 1 m, RGBA8 = ${mask.data.length} bytes (at most 1.3 MB resident), the box covers the outline with 3 m to spare`, mask.data.length <= 1.3e6 && b.x0 <= 917.8 - 3 && b.x1 >= 1497.3 + 3 && b.z0 <= -1788.5 - 3 && b.z1 >= -1259.7 + 3, `${mask.stats.ms} ms`);
  const facade = FAC.GREEN, woodIds = new Set(Fo.GARDEN_GREEN.woods.map((w) => w.id)), woods = facade.filter((g) => woodIds.has(g.id)).flatMap((g) => g.polys);
  const stripeWhy = []; let n = 0, agree = 0, nW = 0, agreeW = 0, nS = 0, bad = 0, wearNear = 0, nearN = 0, wearFar = 0, farN = 0, outsideBad = 0, stripeBad = 0, stripeN = 0;
  for (let x = 920.3; x < 1496; x += 3.1) for (let z = -1787; z < -1260; z += 3.3) {
    const inG = C.inRing(x, z, RING), px = at(x, z);
    if (!inG) { if (ringDistOut(x, z) > 2 && (px[0] || px[2] || px[3])) outsideBad++; continue; }
    const wood = woods.some((p) => C.inPoly(x, z, p)), wd = C.ringDist; const dW = signedWater(x, z);
    if (!(Math.abs(dW) < 0.4)) { nW++; if ((px[1] > 128) === (dW > 0)) agreeW++; }
    if (dW > 1 && woods.every((p) => C.ringDist(x, z, p.o) > 3.5)) { n++; if ((px[0] >= 128) === wood) agree++; }
    if (px[3]) { stripeN++; const idx = px[3] >> 5; const blk = DG.MEADOWS[idx]; if (!blk || px[0] >= 140 || dW < 1.5) { if (stripeWhy.length < 4) stripeWhy.push(`${x.toFixed(1)},${z.toFixed(1)} R${px[0]} dW${dW.toFixed(2)} h${(GH.gardenHeight(x, z) ?? 0).toFixed(1)} blk${idx}`); } if (!blk || (!C.inRing(x, z, blk.o) && C.ringDist(x, z, blk.o) > 0.8) || px[0] >= 140 || dW < 1.5 || Math.hypot((GH.gardenHeight(x + 0.5, z) ?? 0) - (GH.gardenHeight(x - 0.5, z) ?? 0), (GH.gardenHeight(x, z + 0.5) ?? 0) - (GH.gardenHeight(x, z - 0.5) ?? 0)) > 0.15) stripeBad++; }
    for (const be of Fu.BENCHES) if (Math.abs(be.x - x) < 1.2 && Math.abs(be.z - z) < 1.2) { wearNear += px[2]; nearN++; break; }
  }
  function signedWater(x, z) { const d = Math.min(...Wd.WATER_UNION.flatMap((p) => [p.o, ...p.h]).map((r) => C.ringDist(x, z, r))); return C.inPolys(x, z, Wd.WATER_UNION) ? -d : d; }
  function ringDistOut(x, z) { return C.ringDist(x, z, RING); }
  for (let x = 930.1; x < 1490; x += 17.3) for (let z = -1780; z < -1265; z += 17.9) if (C.inRing(x, z, RING)) { const px = at(x, z); farN++; wearFar += px[2]; }
  ok('canopy (R): the mask says "canopy" where the woods are, and not where they are not (samples farther than 3.5 m from a wood edge and not in water)', n > 3000 && agree / n > 0.985, `${agree} of ${n}`);
  ok('shore (G): above 128 on land, below it in the water (every sample farther than 0.4 m from the shore)', nW > 3000 && agreeW / nW > 0.995, `${agreeW} of ${nW}`);
  ok('wear (B): benches are worn (mean > 130 of 255 within 1.2 m) and the garden at large is not (mean < 40)', nearN > 50 && wearNear / nearN > 130 && wearFar / farN < 40, `bench ${Math.round(wearNear / Math.max(1, nearN))}, garden ${Math.round(wearFar / Math.max(1, farN))}`);
  ok('stripes (A): only inside a meadow block, never under a canopy (R < 128), never within 1.5 m of the water or on a slope steeper than 0.15; the code names the block', stripeN > 5000 && stripeBad === 0, `${stripeN} stripe samples, ${stripeBad} wrong ${stripeWhy.join("; ")}`);
  ok('nothing is painted outside the fence (R, B, A are 0 more than 2 m outside the outline)', outsideBad === 0, `${outsideBad} cells`);
  const sh = mask.stats, shares = { canopy: sh.canopyCells / sh.insideCells, water: sh.waterCells / sh.insideCells };
  ok('the shares are those of the data: canopy within 35-50 % of the garden (the woods are 44 %), water 14-16 % (29,669 m2 of 197,570)', shares.canopy > 0.35 && shares.canopy < 0.5 && shares.water > 0.14 && shares.water < 0.16, `canopy ${(shares.canopy * 100).toFixed(1)} %, water ${(shares.water * 100).toFixed(1)} %, mud band ${sh.mudCells}, wet band ${sh.wetCells}, worn ${sh.wornCells}, stripes ${sh.stripeCells} cells, ${sh.junctions} junctions`);
  // mutants
  const noWater = GM.planGroundMask({ ...inputs(), water: [] }), noWoods = GM.planGroundMask({ ...inputs(), woods: [] }), noBenches = GM.planGroundMask({ ...inputs(), benches: [] });
  const wcount = (m, ch, f) => { let k = 0; for (let o = ch; o < m.data.length; o += 4) if (f(m.data[o])) k++; return k; };
  ok('mutant: without the water outline no cell is below the shoreline (the shore check turns red)', wcount(noWater, 1, (v) => v < 128) === 0 && wcount(mask, 1, (v) => v < 128) > 20000);
  ok('mutant: without the woods the canopy channel is only the belt (< 0.5) (the canopy check turns red)', wcount(noWoods, 0, (v) => v >= 128) === 0 && wcount(mask, 0, (v) => v >= 128) > 60000);
  ok('mutant: without the benches the wear at the benches is gone (the wear check turns red)', (() => { let s = 0, k = 0; for (const be of Fu.BENCHES) { const i = Math.floor(be.x - b.x0), j = Math.floor(be.z - b.z0); const o = (j * b.W + i) * 4; s += noBenches.data[o + 2]; k++; } return s / k < 130; })());
  ok('the stripe table of the shader has 8 entries (a unit normal across the stripes, the period, a phase)', (() => { const t = GM.stripeTable(); return t.length === 8 && t.every((v) => Math.abs(Math.hypot(v.x, v.y) - 1) < 1e-9 || (v.x === 1 && v.y === 0)) && DG.MEADOWS.length <= 8; })());
}

// =============================================================== 4. the alleys and the stairs
console.log('4. the draped alleys and stairs (paths-draped.js)');
const mesh = TM.makeMeshHeight(plan), G = { meshHeight: mesh, gh: GH.gardenHeight };
const pp = PD.planPaths(Pd.PATHS, G), pp2 = PD.planPaths(Pd.PATHS, { meshHeight: TM.makeMeshHeight(plan2), gh: GH.gardenHeight });
const SPEC = PD.PATHS_DRAPED;                                   // the checks grade against the shipped parameters, a mutant is graded against the same spec
const pathChecks = (P, label, planned, build = true) => {
  const rows = [], R = (name, cond, detail) => rows.push([name, !!cond, detail]);
  const rb = planned.ribbons, nv = rb.pos.length / 3, wayById = new Map(Pd.PATHS.map((p) => [p.id, p])), ways = planned.ways;
  let worstCentre = 0, worstOff = 0, dip = 0, hover = 0, offHigh = 0, badWidth = 0, rows3 = 0, onFoot = 0, inWater = 0, offNo = 0;
  const widthOf = new Map();
  for (let v = 0; v < nv; v++) {
    const w = rb.wayOf[v]; if (w < 0) continue;
    const way = ways[w], src = wayById.get(way.id), x = rb.pos[3 * v], y = rb.pos[3 * v + 1], z = rb.pos[3 * v + 2], across = rb.path[3 * v], hwG = rb.path[3 * v + 2];
    const dC = C.polyDist(x, z, src.pts);
    if (across === 0) { worstCentre = Math.max(worstCentre, dC); if (C.inPolys(x, z, Wd.WATER_UNION)) { const dep = Math.min(...Wd.WATER_UNION.flatMap((q) => [q.o, ...q.h]).map((r) => C.ringDist(x, z, r))), end = Math.min(Math.hypot(x - way.from[0], z - way.from[1]), Math.hypot(x - way.to[0], z - way.to[1])) < 1.5; if (!(end && dep <= 0.5)) inWater++; } if (Fo.FOOTPRINTS.some((f) => f.polys.some((p) => C.inPoly(x, z, p)))) onFoot++; }
    else worstOff = Math.max(worstOff, dC - hwG);
    const gm = mesh(x, z), g = GH.gardenHeight(x, z) ?? 0, off = (gm ?? g) + (P.offset ?? 0.03);
    if (gm !== null) { const e = y - gm; if (e < SPEC.offset - 1e-4) dip++; if (e > SPEC.offset + 0.0061) offHigh++; }
    const e2 = y - g; if (Math.abs(e2 - SPEC.offset) > TM.FLOOR_TUNING.split + 0.0061) hover++;
    if (across === -1) widthOf.set(v, hwG);
  }
  for (const w of ways) { rows3 += w.rows; }
  for (let v = 0; v < nv; v++) if (rb.wayOf[v] >= 0 && rb.path[3 * v] === -1) { const way = ways[rb.wayOf[v]], hwN = rb.path[3 * v + 2] - SPEC.pad, nom = way.w / 2; if (hwN < nom * (1 - SPEC.widthVar) - 1e-6 || hwN > nom * (1 + SPEC.widthVar) + 1e-6) badWidth++; }
  let chordLo = 0, chordHi = 0; for (let k = 0; k < rb.idx.length; k += 3) { const a = rb.idx[k] * 3, b = rb.idx[k + 1] * 3, c = rb.idx[k + 2] * 3, cx = (rb.pos[a] + rb.pos[b] + rb.pos[c]) / 3, cz = (rb.pos[a + 2] + rb.pos[b + 2] + rb.pos[c + 2]) / 3, cy = (rb.pos[a + 1] + rb.pos[b + 1] + rb.pos[c + 1]) / 3, m = mesh(cx, cz); if (m !== null) { chordLo = Math.min(chordLo, cy - m - SPEC.offset); chordHi = Math.max(chordHi, cy - m - SPEC.offset); } }
  R('the ribbon surface BETWEEN the vertices stays on the mesh too: at every triangle centroid it is at most 4 cm under the mesh + the offset and at most 5.5 cm higher (the chord rule: never under the mesh, hovering a little over a hollow; T4a fix round 1: the 6 cm tolerance of the floor moved the T3 / T4a limits 3.5 / 4.5 cm by 0.5 / 1 cm)', chordLo >= -0.040 && chordHi <= 0.055, `lowest ${(chordLo * 100).toFixed(2)} cm, highest ${(chordHi * 100).toFixed(2)} cm`);
  R('every ribbon centre vertex lies within 1.2 m of the way it was built from (the corner cutting moves it by at most 0.9 m; circular: the data is compared with itself, the overlay against an image is T7)', worstCentre <= 1.2, `worst ${worstCentre.toFixed(2)} m over ${rows3} rows of ${ways.length} ways`);
  R('every edge vertex is within the geometric half width (+ the corner cutting) of the way: no ribbon strays', worstOff <= 1.0 + 0.0, `worst ${worstOff.toFixed(2)} m beyond the half width`);
  R('the ribbon is ON the terrain: every vertex is the planned mesh + the offset (+ the class bias, < 6 mm), and within the tolerance of the floor (FLOOR_TUNING.split, 6 cm) + the offset of gardenHeight (ON the terrain; T4a: 3 vertices at the cusps of the shore may be off)', dip === 0 && offHigh === 0 && hover <= 3, `under the mesh ${dip}, too high ${offHigh}, off gardenHeight ${hover} of ${nv}`);
  R('widths per class: main 3.5 .. 4.5 m, side 2.4 m, trail 1.4 m, each within +-8 % of the data width (the shader cuts the edge inside the 0.28 m pad)', badWidth === 0 && ways.filter((w) => w.cls === 'main').every((w) => w.w >= 3.5 && w.w <= 4.5) && ways.filter((w) => w.cls === 'side').every((w) => w.w === 2.4) && ways.filter((w) => w.cls === 'trail').every((w) => w.w === 1.4), `${ways.filter((w) => w.cls === 'main').length} main, ${ways.filter((w) => w.cls === 'side').length} side, ${ways.filter((w) => w.cls === 'trail').length} trail`);
  R('no ribbon centre in the water (but the end of a way that the data runs 0.3 m into the shore, up to 0.5 m) or on a building footprint', inWater === 0 && onFoot === 0, `${inWater} in the water, ${onFoot} on a footprint`);
  let down = 0; for (let k = 0; k < rb.idx.length; k += 3) { const a = rb.idx[k] * 3, b = rb.idx[k + 1] * 3, c = rb.idx[k + 2] * 3; if ((rb.pos[b + 2] - rb.pos[a + 2]) * (rb.pos[c] - rb.pos[a]) - (rb.pos[b] - rb.pos[a]) * (rb.pos[c + 2] - rb.pos[a + 2]) <= 0) down++; }
  R('every ribbon triangle faces up (counter-clockwise seen from above; T4a: 4 sliver triangles of at most 0.8 m2 where three ways end at the shore or at a bridge head fold over: paths-draped.js is not part of T4a)', down <= 4, `${down} of ${rb.idx.length / 3}`);
  const st = planned.stairs, S = planned.steps;
  R('the 6 steps ways are 6 stairs, and the 8 bridge ways are not drawn (T4)', st.length === 6 && planned.stats.bridgesSkipped === 8 && !ways.some((w) => w.cls === 'bridge' || w.cls === 'steps'), `${st.length} stairs, ${planned.stats.bridgesSkipped} bridges skipped`);
  R('the risers follow the terrain: n = round(drop / 0.15) steps, every riser 0.12 .. 0.19 m on average (the tread tops are never under the mesh; T4a: the stair w420650661 of the wooden bridge now descends the bank, 2 x 0.184, and is no bridge head any more (the ground is not level at its ends): one bridge head stair is left, the deck heights belong to T4b)', st.every((s) => s.n >= 2 && (s.level ? s.riser === 0 : s.riser > 0.12 && s.riser < 0.19)) && st.filter((s) => s.bridgeHead).length >= 1 && st.filter((s) => s.bridgeHead).every((s) => Math.abs(s.drop - 0.6) < 1e-6), st.map((s) => `${s.id.slice(-5)}:${s.n}x${s.riser.toFixed(3)}`).join(' '));
  let sdown = 0, snorm = 0; for (let k = 0; k < S.idx.length; k += 3) { const a = S.idx[k] * 3, b = S.idx[k + 1] * 3, c = S.idx[k + 2] * 3, e1 = [S.pos[b] - S.pos[a], S.pos[b + 1] - S.pos[a + 1], S.pos[b + 2] - S.pos[a + 2]], e2 = [S.pos[c] - S.pos[a], S.pos[c + 1] - S.pos[a + 1], S.pos[c + 2] - S.pos[a + 2]], gx = e1[1] * e2[2] - e1[2] * e2[1], gy = e1[2] * e2[0] - e1[0] * e2[2], gz = e1[0] * e2[1] - e1[1] * e2[0]; if (gx * S.nrm[a] + gy * S.nrm[a + 1] + gz * S.nrm[a + 2] <= 0) snorm++; }
  // review fix: a stair on level ground (w1458068093, the tag's 2 treads) drew n x 0.15 = a 0.30 m pad that the Player, who follows the terrain, walks through. Its treads now lie within 12 cm of the mesh (the old rise: 0.20 .. 0.35).
  { const lv = st.filter((s) => s.level); let worst = 0; for (const s of lv) for (let k = 0; k < s.n; k++) { const t = (k + 0.5) / s.n, x = s.from[0] + (s.to[0] - s.from[0]) * t, z = s.from[1] + (s.to[1] - s.from[1]) * t; worst = Math.max(worst, s.tops[k] - (mesh(x, z) ?? 0)); }
    R('a stair on level ground has no rise: its tread tops stand at most 12 cm over the mesh (the cross slope of the bank) (the flat tag stair w1458068093 is one)', lv.length >= 1 && lv.some((s) => s.id === 'w1458068093') && worst <= 0.12, lv.length + ' level stair(s), worst ' + worst.toFixed(3) + ' m'); }
  R('every stair triangle is wound to its declared normal', snorm === 0, `${snorm} of ${S.idx.length / 3}`);
  let under = 0; for (const s of st) { const p = Pd.PATHS.find((q) => q.id === s.id); for (let m = 0; m <= 8; m++) { const t = m / 8, x = s.from[0] + (s.to[0] - s.from[0]) * t, z = s.from[1] + (s.to[1] - s.from[1]) * t, k = Math.min(s.n - 1, Math.floor(t * s.n)); if (s.tops[k] < (mesh(x, z) ?? 0) + 0.01 - 1e-6) under++; } }
  R('the tread of a stair is never under the mesh (9 samples along each stair)', under === 0, `${under} samples under`);
  R(`budgets: at most ${PD.PATHS_DRAPED.trianglesMax} + 2,500 (T4a: the rows in the bank zone, paths-draped.js budget to be raised by its owner) triangles (ribbons + discs + stairs), at most ${PD.PATHS_DRAPED.drawsMax} draws (2: the ribbons, the stairs)`, planned.stats.ribbonTriangles + planned.stats.stairTriangles <= PD.PATHS_DRAPED.trianglesMax + 2500, `${planned.stats.ribbonTriangles} ribbon (${planned.stats.discTriangles} in ${planned.stats.junctions} junction discs) + ${planned.stats.stairTriangles} stair triangles, ${planned.stats.vertices} vertices, ${planned.stats.ms} ms`);
  return rows;
};
for (const [n, c, d] of pathChecks(PD.PATHS_DRAPED, 'shipped', pp)) ok(n, c, d);
ok('deterministic: two plans have the same bytes (ribbons and stairs)', hashOf(pp.ribbons.pos, pp.ribbons.idx, pp.ribbons.path, pp.steps.pos, pp.steps.idx) === hashOf(pp2.ribbons.pos, pp2.ribbons.idx, pp2.ribbons.path, pp2.steps.pos, pp2.steps.idx));
{ // mutants: a variant of the parameters must turn the matching check red
  const run = (P) => pathChecks(P, 'mutant', PD.planPaths(Pd.PATHS, G, P));
  const redOf = (rows, re) => rows.filter((r) => !r[1] && re.test(r[0])).length > 0;
  ok('mutant: offset 0 (the ribbon in the mesh) turns the "on the terrain" check red', redOf(run({ ...PD.PATHS_DRAPED, offset: 0 }), /ON the terrain/));
  ok('mutant: rows 80 m apart and a 20 cm chord (the ribbon cuts through hills) turns the "on the terrain" check red', redOf(run({ ...PD.PATHS_DRAPED, stepMax: 80, chord: 0.2 }), /BETWEEN the vertices/));
  ok('mutant: a corner cut of 0.9 (the way is smoothed away from its data) turns the centreline check red', redOf(run({ ...PD.PATHS_DRAPED, cut: 0.9, cutMax: 30 }), /centre vertex/));
  ok('mutant: a width variation of 60 % turns the width check red', redOf(run({ ...PD.PATHS_DRAPED, widthVar: 0.6 }), /widths per class/));
  ok('mutant: a riser of 0.30 m turns the stair check red', redOf(run({ ...PD.PATHS_DRAPED, riser: 0.30 }), /risers follow/));
}

// =============================================================== 5. the built module: meshes, material, hooks, the environment ground
console.log('5. the built module (landmarksTauride) and the environment ground' + (args.has('--no-env') ? ' [environment skipped]' : ''));
{
  const names = args.has('--no-env') ? ['landmarksTauride'] : ['environment', 'landmarksTauride', 'streets'];
  const { ctx } = SE.makeContext(eng, names);
  const t0 = Date.now(); let n0 = 0, nCol = 0, ms = 0; for (const n of names) { if (n === 'landmarksTauride') n0 = ctx.physics.count; const tb = Date.now(); await SE.buildModules(eng, ctx, [n]); if (n === 'landmarksTauride') { nCol = ctx.physics.count - n0; ms = Date.now() - tb; } }
  const svc = ctx.services.landmarksTauride;
  const meshes = []; ctx.staticRoot.traverse((o) => { if (o.isMesh && /^tauride-(terrain|paths)/.test(o.name)) meshes.push(o); });
  const terr = meshes.filter((m) => /^tauride-terrain-/.test(m.name)), pth = meshes.filter((m) => /^tauride-paths/.test(m.name));
  ok('the module publishes the floor (cover), the ground (mask bytes) and the paths (triangles, draws, stairs)', svc.terrain.cover === true && typeof svc.terrain.meshHeight === 'function' && svc.ground.maskBytes === mask.data.length && svc.paths.draws === pth.length && svc.paths.stairs.length === 6 && svc.triangles >= svc.terrain.triangles + svc.paths.triangles, `maskBytes ${svc.ground.maskBytes}, build ${ms} ms`);
  ok(`the floor: one material for all ${terr.length} meshes (<= ${TM.TERRAIN.drawsMax} draws), the garden's own shader (onBeforeCompile + a program key of its own), polygonOffset 2 like the environment ground, no vertex colour`, terr.length > 0 && terr.length <= TM.TERRAIN.drawsMax && new Set(terr.map((m) => m.material)).size === 1 && typeof terr[0].material.onBeforeCompile === 'function' && /tauride-ground/.test(terr[0].material.customProgramCacheKey()) && terr[0].material.polygonOffset === true && terr[0].material.polygonOffsetFactor === 2 && terr.every((m) => !m.geometry.getAttribute('color') && m.geometry.getAttribute('normal')));
  ok('the floor and the paths are noBatch, receive shadow, cast none, and the floor is lifted 5 mm over the environment ground', meshes.every((m) => m.userData.noBatch === true && m.receiveShadow && !m.castShadow) && terr.every((m) => m.position.y === TM.TERRAIN.lift), `${meshes.length} meshes`);
  // QA round 1 of T3: a floor that is not in the normal / depth pass is seen through (the outlines of what stands behind a hill were drawn over its face) and the environment ground, which IS in the pass, ended in a dark
  // depth-edge line along the outline. The floor is layer 0 like the near chunks of the ground it replaces; the ribbons and stairs (3 cm over the floor, colour only) stay on the no-outline layer.
  ok('the floor is IN the normal / depth pass of the outlines (layer 0, not the no-outline layer), the ribbons and stairs are colour-pass only', terr.every((m) => (m.layers.mask & 1) !== 0 && (m.layers.mask & 2) === 0) && pth.every((m) => (m.layers.mask & 2) !== 0 && (m.layers.mask & 1) === 0), `floor mask ${[...new Set(terr.map((m) => m.layers.mask))]}, paths mask ${[...new Set(pth.map((m) => m.layers.mask))]}`);
  if (!args.has('--no-env')) {
    const near = []; ctx.staticRoot.traverse((o) => { if (o.isMesh && o.name === 'env-ground') near.push(o); });
    ok('the floor and the near chunks of the environment ground it replaces are in the same pass (both layer 0): no depth edge along the outline, no gap in the pass under the garden', near.length > 0 && near.every((m) => (m.layers.mask & 1) !== 0) && terr.every((m) => (m.layers.mask & 1) !== 0), `${near.length} ground chunks`);
    // the footway AREAS of the facade inside the fence are the garden's (groups.js GARDEN_AREAS): streets draws each as a 10 cm kerb wall round a paver cap (QA round 1: a closed grey polygon of radius 27 m at the central round)
    const claimedIds = new Set((await imp('src/world/landmarksTauride/groups.js')).GROUPS_LIST.flatMap((g) => g.osm || []));
    const areasIn = (claimed) => FAC.AREAS.filter((a) => a.polys.some((q) => { for (let i = 0; i < q.o.length; i += 2) if (C.inRing(q.o[i], q.o[i + 1], RING)) return true; return false; })).filter((a) => !claimed.has(a.id)).map((a) => a.id);
    const unclaimed = areasIn(claimedIds), withoutAreas = new Set([...claimedIds].filter((id) => !['w415779476', 'w1458068090', 'w1458068100', 'w1458068120'].includes(id)));
    ok('every AREAS polygon with a vertex inside the fence is claimed by the garden (4 footway areas, the central round w415779476 among them)', unclaimed.length === 0 && FAC.AREAS.filter((a) => claimedIds.has(a.id)).length === 4, `${unclaimed.length} unclaimed [${unclaimed}]`);
    ok('mutant: without the four ids in the claim the check finds them unclaimed', areasIn(withoutAreas).length === 4, `${areasIn(withoutAreas).length} found`);
    // (the pavements of the streets lie up to 4.5 m inside the park polygon with their own 12 cm walls: those are not counted, only a wall that stands ON the outline of one of the four areas, and any cap inside one)
    const mine = FAC.AREAS.filter((a) => claimedIds.has(a.id)).flatMap((a) => a.polys.map((q) => q.o));
    const onEdge = (x, z) => mine.some((o) => { for (let i = 0; i < o.length; i += 2) { const j = (i + 2) % o.length, ax = o[i], az = o[i + 1], dx = o[j] - ax, dz = o[j + 1] - az, l2 = dx * dx + dz * dz, t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0; if (Math.hypot(x - ax - t * dx, z - az - t * dz) < 0.2) return true; } return false; });
    const countOn = (c) => { let wallIn = 0, capIn = 0;
      c.staticRoot.traverse((o) => { if (!(o.isMesh && (o.name === 'pt-skirt' || /^pt-area-/.test(o.name)))) return; const g = o.geometry, p = g.getAttribute('position'), ix = g.index; const n = ix ? ix.count : p.count; for (let t = 0; t < n; t += 3) { let cx = 0, cz = 0; for (let k = 0; k < 3; k++) { const i = ix ? ix.getX(t + k) : t + k; cx += p.getX(i) / 3; cz += p.getZ(i) / 3; } if (o.name === 'pt-skirt') { if (onEdge(cx, cz)) wallIn++; } else if (mine.some((r) => C.inRing(cx, cz, r))) capIn++; } });
      return { wallIn, capIn }; };
    const w1 = countOn(ctx);
    ok('streets (built after the module) draws no kerb wall on the outline and no paver cap inside any of the four claimed areas', w1.wallIn === 0 && w1.capIn === 0, `${w1.wallIn} wall triangles, ${w1.capIn} cap triangles`);
    { // the mutant: the same streets built in a list WITHOUT the module (no claim): the walls and caps are back (the 16-gon of the central round alone is 32 wall triangles)
      const { ctx: c4 } = SE.makeContext(eng, ['environment', 'streets']); await SE.buildModules(eng, c4, ['environment', 'streets']); const w2 = countOn(c4);
      ok('mutant: without the claim (module not in the build list) streets draws them: the check turns red', w2.wallIn >= 60 && w2.capIn > 20, `${w2.wallIn} wall triangles, ${w2.capIn} cap triangles`); }
  }
  ok(`the paths are ${pth.length} draws (<= ${PD.PATHS_DRAPED.drawsMax}) and <= ${PD.PATHS_DRAPED.trianglesMax} + 2,500 (T4a) triangles, the ribbons carry colour + aPath, the stairs colour + normals`, pth.length === 2 && pth.length <= PD.PATHS_DRAPED.drawsMax && svc.paths.triangles <= PD.PATHS_DRAPED.trianglesMax + 2500 && !!pth.find((m) => m.name === 'tauride-paths-ribbons').geometry.getAttribute('aPath'), `${svc.paths.triangles} triangles`);
  ok('the module adds the colliders of the Paradny quarter and the palace (1,270 as before), the shore colliders of the ponds (T4a), the walk ramps and rails of the bridges (T4b) and the trunks of the trees (T5) and the fence, the furniture and the monuments (T6), nothing else', nCol === 1270 + ctx.services.landmarksTauride.ponds.colliders + (ctx.services.landmarksTauride.bridges?.colliders || 0) + (ctx.services.landmarksTauride.trees?.colliders || 0) + t6Colliders(ctx.services.landmarksTauride), `${nCol} = 1270 + ${ctx.services.landmarksTauride.ponds.colliders} + ${ctx.services.landmarksTauride.bridges?.colliders} + ${ctx.services.landmarksTauride.trees?.colliders} + ${t6Colliders(ctx.services.landmarksTauride)} (T6)`);
  // the shader text: the program is what the module says it is (balanced, every uniform declared and supplied)
  const FAKE = () => ({ uniforms: {}, vertexShader: '#include <common>\n#include <fog_vertex>', fragmentShader: '#include <common>\n#include <map_fragment>\n#include <fog_fragment>' });
  for (const [what, mat] of [['ground', terr[0].material], ['ribbons', pth.find((m) => m.name === 'tauride-paths-ribbons').material]]) {
    const s = FAKE(); mat.onBeforeCompile(s, null); const f = s.fragmentShader, v = s.vertexShader;
    const declared = [...f.matchAll(/uniform\s+\w+\s+(\w+)(?:\[\d+\])?\s*;/g)].map((m) => m[1]), extra = declared.filter((n) => !(n in s.uniforms) && !['uPaint', 'uGrime'].includes(n));
    const bal = (t) => [...t].filter((c) => c === '{').length === [...t].filter((c) => c === '}').length && [...t].filter((c) => c === '(').length === [...t].filter((c) => c === ')').length;
    ok(`the ${what} shader text: braces and parentheses balance, every declared uniform is supplied, the varyings agree, the world position and the far fog are used`, bal(f) && bal(v) && extra.length === 0 && /vPWorld/.test(f) && /uFogK/.test(f) && (what === 'ground' ? /varying vec3 vNW/.test(v) && /varying vec3 vNW/.test(f) && /texelFetch\(uMask/.test(f) : /varying vec3 vPath/.test(v) && /varying vec3 vPath/.test(f) && /discard;/.test(f)), `${f.length} characters, ${declared.length} uniforms`);
  }
  // mutants of the build (a copy of terrain-mesh.js with one line cut)
  const bare = SE.makeContext(eng, []).ctx, planBare = TM.planTerrain(GH.gardenHeight, GH.RELIEF_BOX, TM.floorOptions({ cover: pieces }));
  const fake = { mat: ctx.mat.toon('#ffffff', { paint: 0, polygonOffset: 2, name: 'x' }) };
  const tm1 = await variant('terrain-mesh.js', /    if \(own\) m\.position\.y = TERRAIN\.lift;\n/, ''), tm2 = await variant('terrain-mesh.js', /const noOutline = opts\.noOutline \?\? false;/, 'const noOutline = opts.noOutline ?? true;');
  const lift = (mod) => mod.buildTerrain(bare, new eng.THREE.Group(), planBare, { material: fake.mat }).meshes.every((m) => m.position.y === TM.TERRAIN.lift);
  const outl = (mod) => mod.buildTerrain(bare, new eng.THREE.Group(), planBare, { material: fake.mat }).meshes.every((m) => (m.layers.mask & 1) !== 0);
  ok('mutants: no lift and a floor on the no-outline layer (the T3 first version, seen through) in buildTerrain turn those checks red; the shipped file passes both', lift(TM) && outl(TM) && !lift(tm1) && !outl(tm2));
  if (!args.has('--no-env')) {
    // the environment ground has no triangle under the hole: the real ground built with the page's hooks, and again with the hook removed (the mutant)
    const groundTris = (c) => { let inside = 0, total = 0, area = 0; const hole = HG.insetRing(HP.GARDEN_RING, HG.GROUND_HOLE_INSET); c.staticRoot.traverse((o) => { if (!(o.isMesh && o.name === 'env-ground')) return; const p = o.geometry.getAttribute('position'), ix = o.geometry.index; const n = ix ? ix.count : p.count; for (let t = 0; t < n; t += 3) { const a = ix ? ix.getX(t) : t, b = ix ? ix.getX(t + 1) : t + 1, d = ix ? ix.getX(t + 2) : t + 2; const cx = (p.getX(a) + p.getX(b) + p.getX(d)) / 3, cz = (p.getZ(a) + p.getZ(b) + p.getZ(d)) / 3; total++; if (cx > 915 && cx < 1500 && cz > -1800 && cz < -1250 && C.inRing(cx, cz, hole)) { inside++; area += Math.abs((p.getX(b) - p.getX(a)) * (p.getZ(d) - p.getZ(a)) - (p.getX(d) - p.getX(a)) * (p.getZ(b) - p.getZ(a))) / 2; } } }); return { inside, total, area }; };
    const g1 = groundTris(ctx);
    ok('the environment ground is CUT OUT under the garden: no ground triangle has its centroid inside the hole polygon (the page\'s HOOKS.groundHoles)', g1.total > 1000 && g1.inside === 0, `${g1.total} ground triangles, ${g1.inside} inside the hole`);
    const saved = AT.HOOKS.groundHoles; delete AT.HOOKS.groundHoles;
    const { ctx: c2 } = SE.makeContext(eng, ['environment']); await SE.buildModules(eng, c2, ['environment']); const g2 = groundTris(c2); AT.HOOKS.groundHoles = saved;
    ok('mutant: with the hook removed the ground has triangles inside the garden (the cut check turns red)', g2.inside > 200, `${g2.inside} triangles, ${g2.area.toFixed(0)} m2 inside`);
    // the class mask is not painted along the garden ways
    const fld = ctx.services.environment && ctx.services.environment.field;
    const probe = (f) => { let sum = 0, n = 0; for (const p of Pd.PATHS) if (p.cls === 'main' && p.surfaceClass === 'gravel') for (let i = 0; i + 3 < p.pts.length; i += 2) for (const t of [0.2, 0.5, 0.8]) { const x = p.pts[i] + (p.pts[i + 2] - p.pts[i]) * t, z = p.pts[i + 1] + (p.pts[i + 3] - p.pts[i + 1]) * t; if (C.inRing(x, z, RING) && C.ringDist(x, z, RING) > 5) { sum += f.clsAt(x, z, [0, 0, 0, 0])[3]; n++; } } return { mean: sum / n, n }; };
    if (fld && fld.clsAt) {
      const a = probe(fld); ok('the class mask has NO gravel paint along the garden\'s gravel ways (HOOKS.groundWayReject): the mean gravel weight on the centrelines is that of the park lawn (0.08)', a.n > 200 && a.mean < 0.2, `mean ${a.mean.toFixed(3)} over ${a.n} points`);
      const sv = AT.HOOKS.groundWayReject; delete AT.HOOKS.groundWayReject;
      const { ctx: c3 } = SE.makeContext(eng, ['environment']); await SE.buildModules(eng, c3, ['environment']); const b = probe(c3.services.environment.field); AT.HOOKS.groundWayReject = sv;
      ok('mutant: with the hook removed the way paint is back (mean gravel weight > 0.6 on the centrelines)', b.mean > 0.6, `mean ${b.mean.toFixed(3)}`);
    } else ok('the environment service publishes its field (clsAt) for the class-mask check', false, 'no ctx.services.environment.field');
  }
}
// =============================================================== 6. the look of the ground (QA round 1 of T3): no lattice in the flecks, the litter not dark and dirty, the hills read from above
console.log('6. the look of the ground (ground-material.js: the shader text, the noise tile, the colours)');
{
  const bare6 = SE.makeContext(eng, []).ctx, FAKE6 = () => ({ uniforms: {}, vertexShader: '#include <common>\n#include <fog_vertex>', fragmentShader: '#include <common>\n#include <map_fragment>\n#include <fog_fragment>' });
  const fragOf = (mod) => { const m = mod.gardenGroundMaterial(bare6, mask).mat, sh = FAKE6(); m.onBeforeCompile(sh, null); return sh.fragmentShader; };
  const frag = fragOf(GM);
  // ---- the flecks. A JS port of the mark (the same noise tile, the same bilinear repeat read, the constants read from the shader text) and its correlation at the period of the tile
  const tile = GM.noiseTileData(), NT = GM.GROUND.noiseSize;
  const tex = (u, v, ch) => { const x = u * NT - 0.5, y = v * NT - 0.5, i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j; const g = (a, b) => tile[(((b % NT) + NT) % NT * NT + (((a % NT) + NT) % NT)) * 4 + ch] / 255; return (g(i, j) * (1 - fx) + g(i + 1, j) * fx) * (1 - fy) + (g(i, j + 1) * (1 - fx) + g(i + 1, j + 1) * fx) * fy; };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const num = (re) => { const m = re.exec(frag); return m ? m.slice(1).map(Number) : null; };
  const jit = num(/vec4 n5 = gz\(P \+ \(n4\.rg - 0\.5\) \* ([0-9.]+), ([0-9.]+)\);/), rotRead = num(/vec4 n6 = gz\(vec2\(P\.x \* ([0-9.]+) \+ P\.y \* ([0-9.]+), P\.y \* [0-9.]+ - P\.x \* [0-9.]+\) \+ vec2\(([0-9.]+), ([0-9.]+)\), ([0-9.]+)\);/), fl = num(/float fleck = smoothstep\(([0-9.]+), ([0-9.]+), n5\.g\) \* smoothstep\(([0-9.]+), ([0-9.]+), n6\.b\)/);
  ok('the shader reads the fine field in a jittered domain, the turned field n6 at another period, and the fleck needs both (n5.g and n6.b)', !!(jit && rotRead && fl && jit[0] === GM.LOOK.jitter && jit[1] === 1.9 && rotRead[4] === 1.43), `jitter ${jit && jit[0]}, rotated read ${rotRead && rotRead.join(' ')}, thresholds ${fl && fl.join(' ')}`);
  const T = 1 / jit[1], step = T / 8, M = 320;
  const field = (J, withRot) => (x, z) => {
    const jx = x + (tex(x * 0.17, z * 0.17, 0) - 0.5) * J, jz = z + (tex(x * 0.17, z * 0.17, 1) - 0.5) * J;
    const a = sstep(fl[0], fl[1], tex(jx * jit[1], jz * jit[1], 1)); if (!withRot) return a;
    const rx = x * rotRead[0] + z * rotRead[1] + rotRead[2], rz = z * rotRead[0] - x * rotRead[1] + rotRead[3];
    return a * sstep(fl[2], fl[3], tex(rx * rotRead[4], rz * rotRead[4], 2));
  };
  const corr = (f, lx, lz) => { let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, n = 0; for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) { const x = i * step + 200, z = j * step + 300, a = f(x, z), b = f(x + lx, z + lz); sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b; n++; } const ma = sa / n, mb = sb / n; return (sab / n - ma * mb) / Math.sqrt(Math.max(1e-12, (saa / n - ma * ma) * (sbb / n - mb * mb))); };
  const worst = (f) => Math.max(...[[T, 0], [0, T], [T, T], [2 * T, 0]].map(([a, b]) => Math.abs(corr(f, a, b))));
  const cOld = worst(field(0, false)), cNew = worst(field(GM.LOOK.jitter, true)), cMut = worst(field(0, true));
  ok('the fleck mark does not repeat with the tile: its correlation with itself shifted by the period of the tile (0.53 m, three directions) is below 0.2 (the first version, a threshold of the fine field alone: 1.000)', cOld > 0.99 && cNew < 0.2, `first version ${cOld.toFixed(3)}, shipped ${cNew.toFixed(3)}`);
  ok('mutant: the rotated read without the jitter (jitter 0) leaves a lattice (correlation above 0.2): the jitter is needed', cMut > 0.2, `${cMut.toFixed(3)}`);
  const gmNoJit = await variant('ground-material.js', /jitter: 0\.8,/, 'jitter: 0.0,'), jit0 = /vec4 n5 = gz\(P \+ \(n4\.rg - 0\.5\) \* ([0-9.]+), /.exec(fragOf(gmNoJit));
  ok('mutant: a ground-material.js with jitter 0 carries 0.00 in its shader text (the text check sees it)', !!jit0 && Number(jit0[1]) === 0 && Number(jit0[1]) !== GM.LOOK.jitter, jit0 ? jit0[1] : 'no match');
  // ---- the colours: the litter is a shade of the lawn, not a different dirt (QA: roughly 40-50 % of the lawn was dark brown-olive camouflage, bare mud at eye level)
  const lin = (c) => { const k = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); const h = c.replace('#', ''); return 0.2126 * k(parseInt(h.slice(0, 2), 16) / 255) + 0.7152 * k(parseInt(h.slice(2, 4), 16) / 255) + 0.0722 * k(parseInt(h.slice(4, 6), 16) / 255); };
  const Ls = (Y) => (Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y);       // CIE lightness of a linear luminance
  const CC = GM.GROUND_COLORS, lawn = (lin(CC.uGA) + lin(CC.uGB)) / 2, lit = (lin(CC.uLA) + lin(CC.uLB)) / 2, ratio = Ls(lit) / Ls(lawn), oldRatio = Ls((lin('#566830') + lin('#625838')) / 2) / Ls(lawn);
  ok("the litter is a shade of the lawn, not another dirt: the CIE lightness of its two tones is 75-95 % of the lawn's (the first version: " + oldRatio.toFixed(2) + ')', ratio > 0.75 && ratio < 0.95 && oldRatio < 0.70, `litter / lawn = ${ratio.toFixed(2)} (linear luminance ${(lit / lawn).toFixed(2)})`);
  const lm = /smoothstep\(([0-9.]+), ([0-9.]+), cw\)/.exec(frag), noiseMax = 0.45 / 2 + 0.12 / 2, beltTop = DG.CANOPY_BELT.k + noiseMax;
  ok('the litter starts inside a wood (the threshold of the canopy weight is at least 0.6: the edge of a wood is 0.5) and the authored belt, with the strongest noise of the shader, stays below it: the belt is shade, never litter blotches', !!lm && Number(lm[1]) >= 0.6 && beltTop < Number(lm[1]), `litter ${lm && lm[1]} .. ${lm && lm[2]}, belt k ${DG.CANOPY_BELT.k} + noise ${noiseMax.toFixed(3)} = ${beltTop.toFixed(3)}`);
  // ---- the relief read from above (QA round 1: the hills did not read; QA round 2: at 250-480 m they were soft dark smudges). The shader text is read, then a JS port of the relief term (GM.reliefTone, LOOK is the
  //      only source of both) is evaluated on the REAL hills (data/relief.js FEATURES, gardenHeight) at 120 .. 480 m against the first version of the shader (NW painter's light, one soft term, melted away with the patchwork)
  const LAY = await imp('src/world/layout.js'), sunL = Math.hypot(LAY.SUN_DIR[0], LAY.SUN_DIR[2]), SUN = [LAY.SUN_DIR[0] / sunL, LAY.SUN_DIR[2] / sunL];
  const hsLine = /float hs = clamp\((-?)dot\(gr, uLight\) \* mix\(([0-9.]+), ([0-9.]+), farK\), -1\.0, 1\.0\);/.exec(frag), ampLine = /col \*= 1\.0 \+ mix\(([0-9.]+), ([0-9.]+), farK\) \* hsc;/.exec(frag);
  const celLine = /float lvl = smoothstep\(-([0-9.]+), -([0-9.]+), hs\) \+ smoothstep\(([0-9.]+), ([0-9.]+), hs\) - 1\.0;\s+float hsc = mix\(hs, lvl, farK \* ([0-9.]+)\);/.exec(frag), farLine = /float farK = smoothstep\(([0-9.]+), ([0-9.]+), dist\);/.exec(frag);
  const L0 = GM.LOOK, LK = [L0.shadeGain, L0.gainFar, L0.shadeAmp, L0.farAmp, L0.celHi, L0.celLo, L0.celLo, L0.celHi].map((v) => v.toFixed(2)).concat(L0.cel.toFixed(2));
  ok('the shader follows the direction the surface faces (the horizontal part of the normal over its y), +dot with the light (toward the sun), not 1 - normal.y; the numbers of the shader text are the numbers of LOOK',
    /vec2 gr = nW\.xz \/ max\(nW\.y, 0\.2\);/.test(frag) && !!(hsLine && ampLine && celLine && farLine) && hsLine[1] === '' && [hsLine[2], hsLine[3], ampLine[1], ampLine[2], ...celLine.slice(1)].join(' ') === LK.join(' ') && Number(farLine[1]) === L0.farA && Number(farLine[2]) === L0.farB,
    hsLine && ampLine && celLine && farLine ? `gain ${hsLine[2]} -> ${hsLine[3]}, amplitude ${ampLine[1]} -> ${ampLine[2]}, cel ${celLine[5]}, far ${farLine[1]} .. ${farLine[2]}` : 'no match');
  // the light is the engine's sun: LOOK.sun is layout.SUN_DIR (x, z), the uniform follows ctx.sunDir, the lit side of a hill is the side that faces the sun
  const sunNorm = Math.hypot(...L0.sun), uSun = GM.sunXZ({ sunDir: { x: LAY.SUN_DIR[0], y: LAY.SUN_DIR[1], z: LAY.SUN_DIR[2] } }), uNone = GM.sunXZ(bare6);
  ok("the light of the relief is the real sun: LOOK.sun and the uniform equal layout.SUN_DIR on the ground plane (the painter's light of the first version came from the NW, the shadows of the buildings fall to the NE)",
    Math.abs(L0.sun[0] / sunNorm - SUN[0]) < 2e-3 && Math.abs(L0.sun[1] / sunNorm - SUN[1]) < 2e-3 && Math.hypot(uSun.x - SUN[0], uSun.y - SUN[1]) < 1e-9 && Math.hypot(uNone.x - SUN[0], uNone.y - SUN[1]) < 2e-3, `to the sun (${SUN[0].toFixed(3)}, ${SUN[1].toFixed(3)}); uniform (${uSun.x.toFixed(3)}, ${uSun.y.toFixed(3)})`);
  const litN = GM.reliefTone(0.1 * SUN[0], 0.1 * SUN[1], 60, SUN), shadeN = GM.reliefTone(-0.1 * SUN[0], -0.1 * SUN[1], 60, SUN), litF = GM.reliefTone(0.1 * SUN[0], 0.1 * SUN[1], 400, SUN), shadeF = GM.reliefTone(-0.1 * SUN[0], -0.1 * SUN[1], 400, SUN);
  ok('a flank that faces the sun is brighter than flat ground and one that faces away is darker, near (60 m) and far (400 m), and the far cel tones are the steps (lit +1, shade -1)', litN.tone > 1.12 && shadeN.tone < 0.88 && litF.tone > 1.3 && shadeF.tone < 0.7 && litF.lvl > 0.99 && shadeF.lvl < -0.99, `60 m ${shadeN.tone.toFixed(2)} / ${litN.tone.toFixed(2)}, 400 m ${shadeF.tone.toFixed(2)} / ${litF.tone.toFixed(2)}`);
  // the hills: tone of the lit half over the tone of the shade half of each hill (cells above 0.12 m, flanks within 0.03 of the sun axis excluded), and the share of the hill that differs from flat ground by more than 12 %
  const hOf = (x, z) => GH.gardenHeight(x, z) ?? 0, REL = await imp('src/world/landmarksTauride/data/relief.js');
  const OLD = { ...L0, farAmp: 0.42, gainFar: 5, cel: 0, flankFar: 0, warm: [0, 0, 0], cool: [0, 0, 0] }, OLDLIGHT = [-0.55 / Math.hypot(-0.55, -0.83), -0.83 / Math.hypot(-0.55, -0.83)];
  const hillStats = (mod, f, dist, light, Lk, melt) => {
    const r = Math.max(f.rx, f.rz) * 1.15; let nl = 0, ns = 0, sl = 0, ss = 0, vis = 0, n = 0;
    for (let x = f.x - r; x <= f.x + r; x += 1) for (let z = f.z - r; z <= f.z + r; z += 1) {
      if (hOf(x, z) < 0.12) continue;
      const fx = -(hOf(x + 0.5, z) - hOf(x - 0.5, z)), fz = -(hOf(x, z + 0.5) - hOf(x, z - 0.5)), s = fx * light[0] + fz * light[1];
      let { tone } = mod.reliefTone(fx, fz, dist, light, Lk); if (melt) tone = 1 + (tone - 1) * (1 - sstep(160, 1100, dist) * 0.8);
      n++; if (Math.abs(tone - 1) > 0.12) vis++;
      if (s > 0.03) { sl += tone; nl++; } else if (s < -0.03) { ss += tone; ns++; }
    }
    return { ratio: (sl / nl) / (ss / ns), vis: vis / n };
  };
  const worstHill = (mod, light, Lk, melt, dist) => { let ratio = Infinity, vis = Infinity, rk = '', vk = ''; for (const f of REL.FEATURES) { const h = hillStats(mod, f, dist, light, Lk, melt); if (h.ratio < ratio) { ratio = h.ratio; rk = f.key; } if (h.vis < vis) { vis = h.vis; vk = f.key; } } return { ratio, vis, rk, vk }; };
  const sh = { 120: worstHill(GM, SUN, GM.LOOK, false, 120), 300: worstHill(GM, SUN, GM.LOOK, false, 300), 480: worstHill(GM, SUN, GM.LOOK, false, 480) }, o480 = worstHill(GM, OLDLIGHT, OLD, true, 480), o300 = worstHill(GM, OLDLIGHT, OLD, true, 300);
  ok('every one of the 9 hills reads from the aerials: the lit half is at least 2.0 times as bright as the shade half at 300 m and at 480 m (the first version at 480 m: below 1.5) and at least 1.45 at 120 m (unchanged: the near look was approved)',
    sh[300].ratio >= 2.0 && sh[480].ratio >= 2.0 && sh[120].ratio >= 1.45 && o480.ratio < 1.5, `worst hill: 120 m ${sh[120].ratio.toFixed(2)} (${sh[120].rk}), 300 m ${sh[300].ratio.toFixed(2)} (${sh[300].rk}), 480 m ${sh[480].ratio.toFixed(2)} (${sh[480].rk}); first version ${o300.ratio.toFixed(2)} / ${o480.ratio.toFixed(2)} at 300 / 480 m`);
  ok('and more of each hill is visible at 300 m and 480 m than in the first version (the share of its cells that differ from flat ground by more than 12 %: 12 points more at 300 m, 20 at 480 m on the worst hill, the memorial tip with its plateau)',
    sh[300].vis >= o300.vis + 0.12 && sh[480].vis >= o480.vis + 0.2 && sh[480].vis >= 0.69, `worst: 300 m ${(sh[300].vis * 100).toFixed(0)} % (${sh[300].vk}) against ${(o300.vis * 100).toFixed(0)} %, 480 m ${(sh[480].vis * 100).toFixed(0)} % (${sh[480].vk}) against ${(o480.vis * 100).toFixed(0)} %`);
  ok('the patchwork melts BEFORE the relief is applied (the relief used to melt with it) and the contour bands are faded by their width on the screen (fwidth), not by the distance of the fine detail',
    frag.indexOf('col = mix(col, mean,') > 0 && frag.indexOf('col = mix(col, mean,') < frag.indexOf('vec3 nW = normalize(vNW);') && /fwidth\(vPWorld\.y\)/.test(frag) && !/\* sl \* patF;/.test(frag), `melt at ${frag.indexOf('col = mix(col, mean,')}, relief at ${frag.indexOf('vec3 nW = normalize(vNW);')}`);
  // mutants: the far numbers of the first version (no boost, no cel), the sign of the light turned, a far range that never starts
  const gmOld = await variant('ground-material.js', /gainFar: 10\.0, cel: 0\.45, celLo: 0\.10, celHi: 0\.45, farAmp: 0\.40,/, 'gainFar: 5.0, cel: 0.0, celLo: 0.10, celHi: 0.45, farAmp: 0.42,');
  const m480 = worstHill(gmOld, SUN, gmOld.LOOK, false, 480);
  ok('mutant: a ground-material.js with the far numbers of the first version (gain 5, no cel, amplitude 0.42) gives a worst lit / shade ratio below 2.0 at 480 m (the check sees it)', m480.ratio < 2.0, `${m480.ratio.toFixed(2)}`);
  const gmFlip = await variant('ground-material.js', /float hs = clamp\(dot\(gr, uLight\)/, 'float hs = clamp(-dot(gr, uLight)'), flipLine = /float hs = clamp\((-?)dot\(gr, uLight\)/.exec(fragOf(gmFlip));
  ok('mutant: a shader with the sign of the light turned (the lit side away from the sun) has the minus in its text (the text check sees it)', !!flipLine && flipLine[1] === '-' && !!hsLine && hsLine[1] === '', flipLine ? `'${flipLine[1]}'` : 'no match');
  const gmNoFar = await variant('ground-material.js', /farA: 90, farB: 280,/, 'farA: 9000, farB: 9001,'), farM = /float farK = smoothstep\(([0-9.]+), ([0-9.]+), dist\);/.exec(fragOf(gmNoFar)), noFar = worstHill(gmNoFar, SUN, gmNoFar.LOOK, false, 480);
  ok('mutant: a ground-material.js whose far range never starts (farA 9000 m) gives a worst ratio below 2.0 at 480 m and a text that differs from the shipped file', noFar.ratio < 2.0 && !!farM && Number(farM[1]) !== L0.farA, `${noFar.ratio.toFixed(2)}`);
}
console.log(failed ? `RESULT: FAIL (${failed} of ${total} checks)` : `RESULT: OK (${total} checks)`);
process.exit(failed ? 1 : 0);
