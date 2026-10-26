// Node-only check of the landmark claims that the strip keeps: every building id and every OSM id named by a
// kept module's sub-groups (layout.GROUPS) must exist in the strip data, and every claimed building must lie
// inside the data extent (a building cut by the extent edge would be drawn half). It also tells how much of
// each group is in the play rectangles. usage: node tools/landmarks-groups-check.mjs   (exit 1 on a problem)
//   node tools/area.mjs north tools/landmarks-groups-check.mjs      another area: its data facade, its layout, and ITS list of kept modules (TEST.kept of the area module; default: every
//   owner in its GROUPS). The strip's list is the fallback in tools/lib/area-test-data.mjs.
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTest } from './lib/area-test-data.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CITY = await import(pathToFileURL(path.join(root, 'src/world/data/city.js')).href);
const L = await import(pathToFileURL(path.join(root, 'src/world/layout.js')).href);
const A = await import(pathToFileURL(path.join(root, 'src/world/area.js')).href);
const TESTD = resolveTest(A, L), KEPT = TESTD.kept;
// TEST.extentSlack { group key: metres }: a claimed building may reach that far beyond the data extent. The data cut never cuts a building (it takes it whole when its centroid lies in the extent: docs/AREAS-DATA.md),
// so a vertex beyond the extent edge is no half-drawn building; the area lists the group and the reason (Admiralty-Haymarket: the Academy of Arts, whose north tip lies 7 m beyond the 120 m margin)
const SLACK = TESTD.extentSlack || {};
console.log(`area ${A.ID}: ${KEPT.length} kept modules`);

// every id of every data array (buildings, roads, monuments, POIs, water, green ...)
const known = new Map();
for (const [k, v] of Object.entries(CITY)) if (Array.isArray(v)) for (const r of v) if (r && typeof r.id === 'string') known.set(r.id, k);
const byId = new Map(CITY.BUILDINGS.map((b) => [b.id, b]));

const inRects = (rs, x, z, m = 0) => rs.some((r) => x >= r.x0 - m && x <= r.x1 + m && z >= r.z0 - m && z <= r.z1 + m);
let problems = 0;
const bad = (m) => { problems++; console.log('PROBLEM', m); };
for (const mod of KEPT) {
  const groups = L.GROUPS[mod];
  if (!groups) { bad(`${mod}: no GROUPS entry in layout.js`); continue; }
  for (const g of groups) {
    const missIds = g.ids.filter((id) => !byId.has(id));
    const missOsm = g.osm.filter((id) => !known.has(id));
    if (missIds.length) bad(`${mod}/${g.key}: building ids missing from the data: ${missIds.join(', ')}`);
    if (missOsm.length) bad(`${mod}/${g.key}: osm ids missing from the data: ${missOsm.join(', ')}`);
    if (!g.ids.length && !g.osm.length) bad(`${mod}/${g.key}: claims nothing`);
    if (!g.at || !inRects(CITY.EXTENT_RECTS, g.at[0], g.at[1])) bad(`${mod}/${g.key}: 'at' ${JSON.stringify(g.at)} is outside the data extent`);
    // geometry of the members (ids + parts): vertices inside the play rectangles / the extent
    let n = 0, inPlay = 0, inExt = 0;
    for (const b of L.groupMembers(g.key)) for (const p of b.polys || []) for (let i = 0; i < p.o.length; i += 2) {
      n++; if (inRects(CITY.PLAY_RECTS, p.o[i], p.o[i + 1])) inPlay++; if (inRects(CITY.EXTENT_RECTS, p.o[i], p.o[i + 1], SLACK[g.key] || 0)) inExt++;
    }
    if (n && inExt < n) bad(`${mod}/${g.key}: ${n - inExt} of ${n} footprint vertices lie outside the data extent`);
    console.log(`${mod.padEnd(20)} ${g.key.padEnd(24)} ids ${g.ids.length - missIds.length}/${g.ids.length} osm ${g.osm.length - missOsm.length}/${g.osm.length} members ${L.groupMembers(g.key).length} verts in play ${n ? Math.round(100 * inPlay / n) : '-'}% extent ${n ? Math.round(100 * inExt / n) : '-'}%`);
  }
}
console.log(problems ? `RESULT: ${problems} PROBLEM(S)` : 'RESULT: OK');
process.exit(problems ? 1 : 0);
