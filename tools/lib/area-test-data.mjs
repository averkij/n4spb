// The expectations of the per-area CPU tests (tools/layout-test.mjs, tools/landmarks-groups-check.mjs, tools/areas-test.mjs): what must be true of an area's tables.
// An area module (src/areas/<id>/area.js) EXPORTS them as `TEST`; the strip's module has none (yet), so its expectations live HERE as the strip's fallback (they are the checks that
// layout-test.mjs and landmarks-groups-check.mjs hard-coded before the areas existed, unchanged).
//
// export const TEST = {
//   claimed:       [ { id: 'r2404499', by: 'landmarksA', group: 'station' }, 'w123' ... ],   // OSM ids that must be claimed: by (module), group (sub-group key); a bare string = claimed by anything
//   viewKeys:      [ 'Digit1', ... 'Digit0', 'Place.oktyabrsky' ],    // the exact keys of VIEWS in order: the keyed views first, then Place.<id> views (a Place.<id> entry only has to EXIST)
//   mustHaveAreas: [ { x, z, has: 'substring' } ... ],                 // L.areaAt(x, z) (lower case) must contain `has` (a tuple [x, z, has] is accepted too)
//   kept:          [ 'landmarksA', ... ],                              // modules whose GROUPS entries are verified against the data (also accepted: a separate `export const KEPT`; default: every key of GROUPS)
//   // optional, only when the area has such a thing (skipped when absent):
//   nearestRoad:   { at: [x, z], names: [ 'road name', ... ] },        // L.nearestRoad(at, { drivable, named }) is one of these
//   roadsNear:     { at: [x, z], r: 75, min: 3 },                      // at least `min` drivable roads within r metres
//   riverAny:      [ [x, z], ... ],                                    // L.inRiver is true for at least one point
//   riverBed:      [ [x, z], ... ],                                    // for an in-river point heightAt is below -1
//   streetLevelAt: [x, z],                                             // heightAt === 0 there (default: the HERO pose)
//   onRoadNote:    [ [x, z, 'text'] ],                                 // a NOTE (not a failure) when the point is not on a road
//   farPoint:      [x, z],                                             // far end of the area for the baked-check streaming test (default: the farthest play rectangle)
// };
export const STRIP_KEPT = ['landmarksA', 'landmarksB', 'landmarksC', 'landmarksD', 'landmarksE', 'landmarksF', 'landmarksG', 'landmarksH', 'landmarksI', 'landmarksJ', 'landmarksK',
  'landmarksCastle', 'landmarksBelinsky', 'landmarksOktyabrsky', 'landmarksNorth'];

/** The strip's expectations: the keyed views are 1..9, 0 (centre, west), Shift+1..9, Alt+1..5 (metro entrances, the castle); the rest are Places-list views (key Place.<id>). */
export function stripTest(L) {
  const viewKeys = [...Array(9)].map((_, i) => 'Digit' + (i + 1)).concat(['Digit0'], [...Array(9)].map((_, i) => 'ShiftDigit' + (i + 1)), [...Array(5)].map((_, i) => 'AltDigit' + (i + 1)));
  return {
    claimed: [{ id: 'r2404499', by: 'landmarksA', group: 'station' }, { id: 'r16492039', group: 'station' }, { id: 'w28962850', by: 'metro' }],
    viewKeys,
    mustHaveAreas: [{ x: L.OBELISK.x, z: L.OBELISK.z, has: 'обелиск' }, { x: -441, z: -93, has: 'Аничков' }, { x: L.STATION.x, z: L.STATION.z, has: 'вокзал' }],
    kept: STRIP_KEPT,
    nearestRoad: { at: [L.OBELISK.x, L.OBELISK.z], names: ['Невский проспект', 'площадь Восстания', 'Лиговский проспект'] },
    roadsNear: { at: [L.SQUARE.x, L.SQUARE.z], r: 75, min: 3 },
    riverAny: [[-480, 0], [-440, -90]],
    riverBed: [[-470, 0]],
    streetLevelAt: [0, 0],
    onRoadNote: [[L.SQUARE.x - 60, 150, 'is not on a road (check Nevsky position)']],
  };
}

/** Shape check of a TEST object (areas-test runs it on every real area). Returns a list of problems. */
export function testShapeProblems(t) {
  const p = [], pt = (v) => Array.isArray(v) && v.length === 2 && v.every(Number.isFinite);
  if (!t || typeof t !== 'object') return ['TEST is not an object'];
  if (!Array.isArray(t.claimed) || t.claimed.some((c) => !(typeof c === 'string' || (c && typeof c.id === 'string')))) p.push('claimed: a list of ids or { id, by?, group? }');
  if (!Array.isArray(t.viewKeys) || !t.viewKeys.length || t.viewKeys.some((k) => typeof k !== 'string')) p.push('viewKeys: a non-empty list of VIEWS keys');
  else if (new Set(t.viewKeys).size !== t.viewKeys.length) p.push('viewKeys: a key twice');
  if (!Array.isArray(t.mustHaveAreas) || t.mustHaveAreas.some((a) => { const [x, z, has] = Array.isArray(a) ? a : [a?.x, a?.z, a?.has]; return !Number.isFinite(x) || !Number.isFinite(z) || typeof has !== 'string' || !has; })) p.push('mustHaveAreas: a list of { x, z, has } (or [x, z, has])');
  if (t.kept !== undefined && (!Array.isArray(t.kept) || t.kept.some((k) => typeof k !== 'string'))) p.push('kept: a list of module names');
  if (t.nearestRoad !== undefined && !(pt(t.nearestRoad.at) && Array.isArray(t.nearestRoad.names) && t.nearestRoad.names.length)) p.push('nearestRoad: { at: [x, z], names: [...] }');
  if (t.roadsNear !== undefined && !(pt(t.roadsNear.at) && t.roadsNear.r > 0 && t.roadsNear.min >= 1)) p.push('roadsNear: { at: [x, z], r, min }');
  for (const k of ['riverAny', 'riverBed']) if (t[k] !== undefined && !(Array.isArray(t[k]) && t[k].length && t[k].every(pt))) p.push(`${k}: a list of [x, z]`);
  if (t.extentSlack !== undefined && !(t.extentSlack && typeof t.extentSlack === 'object' && Object.values(t.extentSlack).every((m) => Number.isFinite(m) && m >= 0))) p.push('extentSlack: { group key: metres >= 0 }');
  if (t.streetLevelAt !== undefined && !pt(t.streetLevelAt)) p.push('streetLevelAt: [x, z]');
  if (t.farPoint !== undefined && !pt(t.farPoint)) p.push('farPoint: [x, z]');
  return p;
}

/** The expectations of the area whose tables are loaded: its own TEST export, else the strip's fallback. Throws for an area without any. */
export function resolveTest(A, L) {
  const t = A.TEST || (A.ID === 'strip' ? stripTest(L) : null);
  if (!t) throw new Error(`area "${A.ID}": its area module exports no TEST (docs/AREAS.md section 5: claimed, viewKeys, mustHaveAreas)`);
  const bad = testShapeProblems(t);
  if (bad.length) throw new Error(`area "${A.ID}": TEST is malformed:\n  - ${bad.join('\n  - ')}`);
  return {
    ...t,
    claimed: t.claimed.map((c) => (typeof c === 'string' ? { id: c } : c)),
    mustHaveAreas: t.mustHaveAreas.map((a) => (Array.isArray(a) ? { x: a[0], z: a[1], has: a[2] } : a)),
    kept: t.kept || A.KEPT || Object.keys(L.GROUPS),      // TEST.kept, or a separate `export const KEPT = [...]` of the area module, or every owner in GROUPS
  };
}
