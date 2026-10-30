// Checks intro-data.json (run after the whole rebuild) against what the edits of edits.json promise. Exit code 1 on a failure.
//   node check-edits.mjs [path to intro-data.json]
// 1  every merge: the merged area is there once and its parts are gone; a "stable" merge leaves the live areas at the registry mapId (46 47 48 49 51 96 97 98) and the merged area at the k of its first district
// 2  the walkable territory (fp) of a merged area reaches at most REACH_M beyond the bbox of its own land (before the 'cut' of Bolshoy prospekt V.O. the south-west tip of Okrug 7 reached 1.75 km west along the harbour)
// 3  every 'carve': the target area gained a piece of each district (km2), the remainders keep their k, the target is ONE outer ring without new holes, the pieces tile exactly (build-intro measured it on the full-precision geometry: overlap, gap, extra < 1e-6 km2),
//    and the same on the rings of the page (simplified, 18 m) with python/shapely: along the cut the overlap and the gap between the areas are thin (mean width under MEAN_W_M metres)
import fs from 'node:fs';
import path from 'node:path';
import { here, toM, pyCarve, inRings } from './lib.mjs';

const D = JSON.parse(fs.readFileSync(process.argv[2] || path.join(here, 'intro-data.json'), 'utf8'));
const EDITS = JSON.parse(fs.readFileSync(path.join(here, 'edits.json'), 'utf8'));
const REACH_M = 450;
const MEAN_W_M = 12;                                 // the page rings are simplified with a 18 m tolerance, each independently: the mean offset of a shared edge stays well below that
const LIVE_K = { 46: 'A', 47: 'M', 48: 'W', 49: 'G', 51: 'D', 96: 'S', 97: 'V', 98: 'P' };   // the registry mapIds of the live areas (src/areas/registry.js)
const KX = toM([1, 0])[0], KY = toM([0, 1])[1];
const bbox = (rs) => { const b = [1e9, 1e9, -1e9, -1e9]; for (const r of rs) for (const p of r) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); } return b; };
const reachM = (a) => { const c = bbox(a.outer), f = bbox(a.fp); return Math.round(Math.max((c[0] - f[0]) * KX, (c[1] - f[1]) * KY, (f[2] - c[2]) * KX, (f[3] - c[3]) * KY)); };
const fails = [];
const plain = (n) => n.replace(/^округ\s+/i, '').trim();
const fix = (v, n = 3) => Math.round(v * 10 ** n) / 10 ** n;

// 1. merges
for (const mg of EDITS.merge || []) {
  const merged = D.areas.filter((a) => a.ru === mg.ru);
  if (merged.length !== 1) { fails.push(`merge ${mg.ru}: ${merged.length} areas of that name (want 1)`); continue; }
  for (const n of mg.names.slice(1)) if (D.areas.some((a) => plain(a.ru) === n)) fails.push(`merge ${mg.ru}: the part ${n} is still an area of its own`);
  if (mg.stable) {
    for (const e of D.existing) { const a = D.areas[e.mapId]; if (!a || a.live !== e.id) fails.push(`merge ${mg.ru}: the live area ${e.id} is not at k=${e.mapId} any more`); }
    for (const [k, id] of Object.entries(LIVE_K)) { const a = D.areas[k]; if (!a || a.live !== id) fails.push(`merge ${mg.ru}: the live area ${id} (registry mapId ${k}) is not at k=${k}`); }
  }
  console.log(`ok merge ${mg.ru}: k=${merged[0].k}, ${merged[0].km2} km2 (${merged[0].kind}), ${merged[0].rayon}`);
}
for (const [k, id] of Object.entries(LIVE_K)) if (!D.areas[k] || D.areas[k].live !== id) fails.push(`live area ${id} is not at k=${k}`);
// the stable merges keep the k of the first district: Kolomna-Yekateringofsky at 42, Semyonovsky-Izmaylovsky at 45 (tools/area-shape.mjs --k and the docs name them so)
for (const [k, ru] of [[42, 'Коломна–Екатерингофский'], [45, 'Семёновский–Измайловский']]) if (!D.areas[k] || D.areas[k].ru !== ru) fails.push(`k=${k} is ${D.areas[k] && D.areas[k].ru}, expected ${ru}`);

// Representative points in the three large southern pockets formerly enclosed
// by the Kolomna–Yekateringofsky walkable outline.
for (const p of [[30.27315, 59.90956], [30.28001, 59.90217], [30.26414, 59.89943]]) {
  if (!inRings(p, D.areas[42].fp)) fails.push(`Коломна–Екатерингофский: southern pocket ${p} is outside the footprint`);
}

// 2. the area of the cut: Okrug 7 (before the merge) or the merged Vasilyevsky-Okrug 7
for (const a of D.areas) if (a.ru === 'Округ № 7' || a.ru === 'Васильевский–Округ № 7') { const r = reachM(a); if (r > REACH_M) fails.push(`${a.ru}: the territory reaches ${r} m beyond its land (max ${REACH_M})`); else console.log(`ok ${a.ru}: reach ${r} m`); }

// 3. carves
const geomOf = (a) => ({ outer: a.outer, inner: a.inner });
(EDITS.carve || []).forEach((cv, i) => {
  const rep = D.edits && D.edits.carve && D.edits.carve[i];
  if (!rep) { fails.push(`carve ${cv.street}: no report in the data (rebuild with build-intro.mjs)`); return; }
  const into = D.areas.find((a) => a.ru === cv.into);
  if (!into) { fails.push(`carve ${cv.street}: the target area ${cv.into} is missing`); return; }
  const rems = cv.from.map((n) => D.areas.find((a) => plain(a.ru) === n));
  cv.from.forEach((n, j) => { if (!rems[j]) fails.push(`carve ${cv.street}: the remainder of ${n} is missing`); });
  if (fails.length && rems.some((r) => !r)) return;
  let gain = 0;
  rep.from.forEach((f, j) => {
    gain += f.carvedKm2;
    if (!(f.carvedKm2 > 0.05)) fails.push(`carve: ${f.name} gave only ${f.carvedKm2} km2 to ${cv.into}`);
    if (!(f.restKm2 > 0.05)) fails.push(`carve: nothing of ${f.name} is left (${f.restKm2} km2)`);
    if (f.restPieces !== 1) fails.push(`carve: the remainder of ${f.name} is ${f.restPieces} pieces (want 1)`);
    if (Math.abs(f.carvedKm2 + f.restKm2 - f.srcKm2) > 1e-3) fails.push(`carve: ${f.name} ${f.carvedKm2} + ${f.restKm2} != ${f.srcKm2} km2`);
    // the page's own number (land cells of the 40 m raster) is the land part of the exact area
    if (rems[j].km2 > f.restKm2 + 0.05 || rems[j].km2 < f.restKm2 * 0.7) fails.push(`carve: ${f.name} remainder land ${rems[j].km2} km2 vs exact ${f.restKm2} km2`);
    console.log(`ok carve ${f.name} (k=${rems[j].k}): ${f.srcKm2} -> ${f.restKm2} km2 (page land ${rems[j].km2}), ${f.carvedKm2} km2 to ${cv.into}`);
  });
  if (rep.targetOuter !== 1) fails.push(`carve: ${cv.into} has ${rep.targetOuter} outer rings (want 1)`);
  if (rep.targetHolesAfter > rep.targetHolesBefore) fails.push(`carve: ${cv.into} got ${rep.targetHolesAfter - rep.targetHolesBefore} new hole(s)`);
  if (into.outer.length !== 1) fails.push(`carve: ${cv.into} is ${into.outer.length} outer rings on the page (want 1)`);
  for (const [what, v] of [['overlap', rep.exactOverlapKm2], ['gap', rep.exactGapKm2], ['extra', rep.exactExtraKm2]]) if (!(v < 1e-6)) fails.push(`carve: exact ${what} ${v} km2 (want < 1e-6)`);
  console.log(`ok carve ${cv.into}: +${fix(gain)} km2 -> ${rep.targetKm2} km2 exact (page land ${into.km2}), ${rep.targetOuter} outer ring, holes ${rep.targetHolesBefore} -> ${rep.targetHolesAfter}; exact overlap ${rep.exactOverlapKm2.toExponential(1)} gap ${rep.exactGapKm2.toExponential(1)} extra ${rep.exactExtraKm2.toExponential(1)} km2`);
  // the same on the page rings (python / shapely; fails loudly when it is missing)
  for (const [line, j] of rep.cut.map((l, j) => [l, j])) {
    const au = pyCarve({ op: 'audit', areas: [into, ...rems].map((a) => ({ name: a.ru, geom: geomOf(a) })), line, gapM: 20 });
    const ovW = au.overlapKm2 * 1e6 / (au.lineKm * 1000), gapW = au.gapKm2 * 1e6 / (au.lineKm * 1000);
    console.log(`${ovW <= MEAN_W_M && gapW <= MEAN_W_M ? 'ok' : 'FAIL'} cut ${j + 1} (${fix(au.lineKm, 2)} km) on the page rings: overlap ${fix(au.overlapKm2, 4)} km2 (mean ${fix(ovW, 1)} m), gap ${fix(au.gapKm2, 4)} km2 (mean ${fix(gapW, 1)} m)`);
    if (ovW > MEAN_W_M) fails.push(`carve: the areas overlap along the cut by ${fix(ovW, 1)} m on average (max ${MEAN_W_M})`);
    if (gapW > MEAN_W_M) fails.push(`carve: the areas leave a gap along the cut of ${fix(gapW, 1)} m on average (max ${MEAN_W_M})`);
  }
});
console.log(`areas ${D.areas.length}, land ${D.areas.reduce((s, a) => s + a.km2, 0).toFixed(2)} km2`);
if (fails.length) { console.error('FAIL\n ' + fails.join('\n ')); process.exit(1); }
console.log('check-edits ok');
