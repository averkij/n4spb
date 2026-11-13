// Bakes data/osm-raw/*.json (tools/fetch-osm.mjs) into src/world/data/city.js (the facade) + one part file per region (city-east.js = the first build, city-w1.js, city-n1.js,
// city-w2a.js ...): ES modules in the engine's local frame (metres, +X east, +Z south). Data (c) OpenStreetMap contributors, ODbL.
// The area is a UNION of rectangles (tools/osm-lib.mjs PLAY_RECTS / EXTENT_RECTS): everything is clipped to the union of the EXTENT rectangles.
//   node tools/bake-osm.mjs [--out <dir>] [--lock <dir>]      (--out: write somewhere else, e.g. a scratch folder for a test bake: the engine reads src/world/data;
//   --lock: the previous bake whose part files the records keep (default src/world/data), see REGION LOCK below)
// Same export names / record shapes as the Yakutsk bake (ORIGIN, EXTENT, PLAY, BUILDINGS, ROADS, CROSSINGS, WATER, GREEN, TREES, TREE_ROWS,
// WALLS, BARRIERS, BRIDGES, ...) plus the Saint Petersburg additions: RAILS, PLATFORMS, STATIONS, SUBWAY, SUBWAY_ROUTES, ENTRANCES, TROLLEY,
// TRAM_ROUTES, BUS_ROUTES, TRAMWAYS, EMBANKMENTS, RIVER, STEPS, TUNNELS, RAIL_NODES (see the header that is written into city.js).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ORIGIN, EXTENT, PLAY, PLAY_RECTS, EXTENT_RECTS, RECT_NAMES, OLD_PLAY, OLD_EXTENT, EXTENT_GROW, proj, elementPolys, clipRingUnion, clipLineUnion, inExtent as inExtentXZ, regionOf, simplify, orient, ringArea, pointInPoly, pointInRing, centroid, bboxOf, flat, round1 } from './osm-lib.mjs';

import { LATE_ROAD_IDS } from './late-roads-ids.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = path.join(root, 'data', 'osm-raw');
const load = (n) => { const p = path.join(rawDir, n + '.json'); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')).elements : []; };
const num = (v) => { if (v == null) return null; const m = String(v).replace(',', '.').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };
const inExtent = (p) => inExtentXZ(p[0], p[1]);                                   // union of the EXTENT rectangles (osm-lib.mjs)
const clipLine = (pts, _R) => clipLineUnion(pts, EXTENT_RECTS);                // every call site clips against the UNION of the EXTENT rectangles
const compact = (o) => { for (const k of Object.keys(o)) if (o[k] == null || o[k] === '') delete o[k]; return o; };   // sparse records (POIs, furniture...)
const yes = (v) => v === 'yes' || v === 'true' || v === '1';
const isTunnel = (t) => (t.tunnel && t.tunnel !== 'no' && t.tunnel !== 'building_passage' ? 1 : 0);
const isPassage = (t) => (t.tunnel === 'building_passage' || t.covered === 'arcade' ? 1 : 0);
const isBridge = (t) => (t.bridge && t.bridge !== 'no' ? 1 : 0);

// ---- a polygon list -> clipped (against the UNION of the EXTENT rectangles), simplified, oriented, flat-number polygons
// A ring that lies inside the union stays whole; a ring that crosses the outer boundary is cut into disjoint pieces (osm-lib.mjs clipRingUnion); holes go to the piece that contains them.
function bakePolys(polys, tol = 0.12) {
  const out = [];
  for (const p of polys) {
    const pieces = [];
    for (let o of clipRingUnion(p.o, EXTENT_RECTS)) {
      o = simplify(o, tol); if (o.length < 4) continue;
      o = orient(o, true);
      if (Math.abs(ringArea(o)) < 0.5) continue;
      pieces.push({ ring: o, o: flat(o.slice(0, -1)), h: [] });
    }
    for (const h of p.h) for (let hh of clipRingUnion(h, EXTENT_RECTS)) {
      hh = simplify(hh, tol); if (hh.length < 4) continue;
      const owner = pieces.length === 1 ? pieces[0] : pieces.find((q) => pointInRing(hh[0], q.ring));
      if (owner) owner.h.push(flat(orient(hh, false).slice(0, -1)));
    }
    for (const q of pieces) out.push({ o: q.o, h: q.h });
  }
  return out;
}
const unflat = (a) => { const r = []; for (let i = 0; i < a.length; i += 2) r.push([a[i], a[i + 1]]); return r; };
const closeRing = (r) => (r.length && (r[0][0] !== r[r.length - 1][0] || r[0][1] !== r[r.length - 1][1]) ? r.concat([r[0]]) : r);
const polysArea = (polys) => polys.reduce((s, p) => s + Math.abs(ringArea(closeRing(unflat(p.o)))) - p.h.reduce((q, h) => q + Math.abs(ringArea(closeRing(unflat(h)))), 0), 0);
const polysCentre = (polys) => { // area-weighted centroid of the outer rings
  let a = 0, cx = 0, cz = 0;
  for (const p of polys) { const r = closeRing(unflat(p.o)); const w = Math.abs(ringArea(r)); const c = centroid(r); a += w; cx += c[0] * w; cz += c[1] * w; }
  return a ? [cx / a, cz / a] : [polys[0].o[0], polys[0].o[1]];
};
const pointPoly = (pt, p) => pointInPoly(pt, { o: unflat(p.o), h: p.h.map(unflat) });
const geomPts = (e) => (e.geometry || []).map((n) => proj(n.lon, n.lat));
const isClosed = (pts) => pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
const lineLen = (flatPts) => { let l = 0; for (let i = 2; i < flatPts.length; i += 2) l += Math.hypot(flatPts[i] - flatPts[i - 2], flatPts[i + 1] - flatPts[i - 1]); return l; };

/** Anchor point of any element in the local frame: node position, polygon centroid, or line midpoint. */
function elCentre(e) {
  if (e.type === 'node') return proj(e.lon, e.lat);
  if (e.type === 'way') { const pts = geomPts(e); if (!pts.length) return null; if (isClosed(pts)) return centroid(pts); return pts[Math.floor(pts.length / 2)]; }
  if (e.bounds) return proj((e.bounds.minlon + e.bounds.maxlon) / 2, (e.bounds.minlat + e.bounds.maxlat) / 2);
  const polys = elementPolys(e); if (polys.length) return centroid(polys[0].o);
  return null;
}
const nameEn = (t) => t['name:en'] || t.int_name || null;
const nameRu = (t) => t.name || t['name:ru'] || null;
const addrOf = (t) => (t['addr:housenumber'] || t['addr:street'] ? { street: t['addr:street'] || null, no: t['addr:housenumber'] || null } : null);
const idOf = (e) => e.type[0] + e.id;
const refList = (v) => (v ? String(v).split(/[;,]/).map((s) => s.trim()).filter(Boolean) : []);

// ================================================================== public-transport routes (trolleybus / tram / bus / subway)
// way id -> refs, node id -> refs (for ROADS / BUS_STOPS), plus the route tables
const routeWays = new Map(), routeStops = new Map();
const addTo = (map, key, kind, ref) => { let m = map.get(key); if (!m) map.set(key, m = { bus: new Set(), trolley: new Set(), tram: new Set() }); m[kind].add(ref); };
const sortRefs = (set) => [...set].sort((a, b) => (parseInt(a, 10) || 999) - (parseInt(b, 10) || 999) || a.localeCompare(b));
function bakeRoutes() {
  const trolley = [], tram = [], bus = [];
  // way geometry by id from the roads / rail layers (the route layer only has member ids)
  const wayGeom = new Map(); for (const e of [...load('roads'), ...load('rail')]) if (e.type === 'way' && e.geometry) wayGeom.set(e.id, e.geometry);
  const els = load('routes'); const nodes = new Map(); for (const e of els) if (e.type === 'node') nodes.set(e.id, e);
  for (const e of els) {
    const t = e.tags || {}; if (e.type !== 'relation') continue;
    const kind = t.route === 'trolleybus' ? 'trolley' : t.route === 'tram' ? 'tram' : t.route === 'bus' || t.route === 'share_taxi' ? 'bus' : null; if (!kind) continue;
    const ref = t.ref || t.name || '?';
    const lines = [], stops = [];
    for (const m of e.members || []) {
      if (m.type === 'way') {
        if (/^(platform|stop)/.test(m.role || '')) { addTo(routeStops, 'w' + m.ref, kind, ref); continue; }
        addTo(routeWays, 'w' + m.ref, kind, ref);
        const g = wayGeom.get(m.ref);
        if (kind !== 'bus' && g) for (const s of clipLine(g.map((n) => proj(n.lon, n.lat)))) { const q = simplify(s, 0.3); if (q.length >= 2) lines.push(flat(q)); }
      } else if (m.type === 'node') {
        if (/^(stop|platform)/.test(m.role || '')) {
          addTo(routeStops, 'n' + m.ref, kind, ref);
          const n = nodes.get(m.ref);
          if (kind !== 'bus' && n) { const [x, z] = proj(n.lon, n.lat); if (inExtent([x, z])) stops.push(compact({ id: 'n' + m.ref, name: nameRu(n.tags || {}), x: round1(x), z: round1(z), role: m.role })); }
        }
      }
    }
    const rec = compact({ id: 'r' + e.id, ref, name: nameRu(t), from: t.from || null, to: t.to || null, via: t.via || null, operator: t.operator || null, network: t.network || null, colour: t.colour || null, interval: t.interval || null, lines, stops });
    if (kind === 'trolley') trolley.push(rec); else if (kind === 'tram') tram.push(rec);
    else bus.push(compact({ id: 'r' + e.id, ref, name: nameRu(t), from: t.from || null, to: t.to || null, operator: t.operator || null, mode: t.route }));
  }
  const byRef = (a, b) => (parseInt(a.ref, 10) || 999) - (parseInt(b.ref, 10) || 999) || String(a.ref).localeCompare(String(b.ref));
  return { trolley: trolley.sort(byRef), tram: tram.sort(byRef), bus: bus.sort(byRef) };
}
const stopRoutesOf = (id) => { const m = routeStops.get(id); if (!m) return null; const o = {}; for (const k of ['bus', 'trolley', 'tram']) if (m[k].size) o[k] = sortRefs(m[k]); return Object.keys(o).length ? o : null; };

// subway: route relations (ordered stations, colour, ref) + the member nodes
const subwayWayInfo = new Map();   // way id -> { ref, colour, name, route }
function bakeSubwayRoutes() {
  const els = load('subwayroutes');
  const nodes = new Map(); for (const e of els) if (e.type === 'node') nodes.set(e.id, e);
  const masters = els.filter((e) => e.type === 'relation' && e.tags && e.tags.type === 'route_master');
  const out = [];
  for (const e of els) {
    const t = e.tags || {}; if (e.type !== 'relation' || t.type !== 'route') continue;
    const stops = [], segments = [];
    for (const m of e.members || []) {
      if (m.type === 'node' && /^stop/.test(m.role || '')) {
        const n = nodes.get(m.ref) || (m.lat != null ? { lat: m.lat, lon: m.lon, tags: {} } : null); if (!n) continue;
        const [x, z] = proj(n.lon, n.lat);
        stops.push(compact({ id: 'n' + m.ref, name: nameRu(n.tags || {}), nameEn: nameEn(n.tags || {}), x: round1(x), z: round1(z), role: m.role || null, inExtent: inExtent([x, z]) ? 1 : 0 }));
      } else if (m.type === 'way' && (m.role === '' || m.role == null) && m.geometry) {
        if (!subwayWayInfo.has(m.ref)) subwayWayInfo.set(m.ref, { ref: t.ref || null, colour: t.colour || null, name: t.name || null, route: 'r' + e.id });
        segments.push(flat(simplify(m.geometry.map((n) => proj(n.lon, n.lat)), 1.5)));
      }
    }
    const master = masters.find((ms) => (ms.members || []).some((mm) => mm.ref === e.id));
    out.push(compact({ id: 'r' + e.id, mode: t.route, ref: t.ref || (master && master.tags.ref) || null, name: nameRu(t), line: master ? nameRu(master.tags || {}) : null, colour: t.colour || (master && master.tags.colour) || null, from: t.from || null, to: t.to || null, network: t.network || null, operator: t.operator || null, stops, segments }));
  }
  return out;
}

// ================================================================== buildings
const BTAGS = ['shop', 'amenity', 'tourism', 'operator', 'brand', 'architect', 'architect:wikidata', 'ref:okn', 'wikipedia', 'architecture', 'heritage:operator', 'description', 'alt_name', 'old_name', 'official_name', 'name:de', 'name:fi', 'denomination', 'religion', 'building:architecture', 'level', 'building:flats', 'building:material', 'train', 'public_transport'];
function bakeBuildings() {
  const src = load('buildings').concat(load('rail').filter((e) => e.tags && e.tags.building));
  const seen = new Set();
  const recs = [];
  for (const e of src) {
    const t = e.tags || {};
    const key = e.type + e.id; if (seen.has(key)) continue; seen.add(key);
    if (!t.building && t['building:part'] == null) continue;
    const isPart = t['building:part'] != null && t.building == null;
    const rawPolys = elementPolys(e);
    if (!rawPolys.length) continue;
    const polys = bakePolys(rawPolys);
    if (!polys.length) continue;
    const levels = num(t['building:levels']), minLevel = num(t['building:min_level']), roofLevels = num(t['roof:levels']);
    const hTag = num(t.height) ?? num(t['building:height']);
    let h = hTag;
    let minH = num(t.min_height) ?? num(t['building:min_height']);
    if (h == null && levels != null) h = levels * 3.3 + (roofLevels || 0) * 1.5;
    if (minH == null && minLevel != null) minH = minLevel * 3.3;
    // hEst (documented estimate, never invented): the mapped height when there is one, else levels * 3.3 m, else null.
    const hEst = hTag != null ? hTag : levels != null ? round1(levels * 3.3) : null;
    const kind = isPart ? (t['building:part'] || 'yes') : t.building;
    const tags = {}; for (const k of BTAGS) if (t[k] != null) tags[k] = t[k];
    const c = polysCentre(polys);
    recs.push({
      id: idOf(e), name: nameRu(t), nameEn: nameEn(t), kind, part: isPart ? 1 : 0, parent: null, skip: 0, parts: 0,
      h: h ?? null, hEst, hSrc: hTag != null ? 'height' : levels != null ? 'levels' : null, minH: minH ?? 0, levels, minLevel,
      roof: t['roof:shape'] || null, roofH: num(t['roof:height']), roofDir: num(t['roof:direction']), roofColour: t['roof:colour'] || null, roofMaterial: t['roof:material'] || null, roofLevels,
      colour: t['building:colour'] || null, material: t['building:material'] || null, facade: t['building:facade:material'] || null, layer: num(t.layer),
      underground: t.location === 'underground' || (num(t.layer) ?? 0) < 0 && t.building == null ? 1 : 0,
      construction: t.building === 'construction' ? 1 : 0, wikidata: t.wikidata || null,
      addr: addrOf(t), tags: Object.keys(tags).length ? tags : null, startDate: t.start_date || null,
      heritage: t.heritage || (t.historic && t['heritage:operator'] ? 'yes' : null) || null, historic: t.historic || null,
      area: Math.round(polysArea(polys)), cx: round1(c[0]), cz: round1(c[1]),
      polys,
    });
  }
  // link parts to their outline building, and hide outlines that the parts already cover
  const outlines = recs.filter((r) => !r.part);
  const bbs = new Map(outlines.map((o) => [o.id, o.polys.map((p) => bboxOf(unflat(p.o)))]));
  const byPoint = (pt) => {
    let best = null;
    for (const o of outlines) {
      const bb = bbs.get(o.id);
      for (let k = 0; k < o.polys.length; k++) {
        const b = bb[k]; if (pt[0] < b.x0 || pt[0] > b.x1 || pt[1] < b.z0 || pt[1] > b.z1) continue;
        if (pointPoly(pt, o.polys[k])) { if (!best || o.area < best.area) best = o; break; }
      }
    }
    return best;
  };
  for (const r of recs.filter((x) => x.part)) {
    const c = centroid(closeRing(unflat(r.polys[0].o)));
    const o = byPoint(c) || byPoint(unflat(r.polys[0].o)[0]);
    if (o) { r.parent = o.id; o.parts++; }
  }
  const kids = new Map(); for (const r of recs) if (r.parent) { if (!kids.has(r.parent)) kids.set(r.parent, []); kids.get(r.parent).push(r); }
  for (const o of outlines.filter((x) => x.parts > 0)) {
    // fraction of the outline covered by its parts (grid sampling)
    const parts = kids.get(o.id) || [];
    const ring = closeRing(unflat(o.polys[0].o)); const b = bboxOf(ring); let hit = 0, tot = 0;
    for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) {
      const pt = [b.x0 + (i + 0.5) / 24 * (b.x1 - b.x0), b.z0 + (j + 0.5) / 24 * (b.z1 - b.z0)];
      if (!o.polys.some((p) => pointPoly(pt, p))) continue;
      tot++; if (parts.some((q) => q.polys.some((p) => pointPoly(pt, p)))) hit++;
    }
    o.coverage = tot ? Math.round(hit / tot * 100) / 100 : 0;
    if (o.coverage >= 0.5) o.skip = 1;
  }
  for (const r of recs) if (!r.underground) delete r.underground;
  return recs;
}

// ================================================================== roads / crossings / pedestrian areas
const ROAD_W = { motorway: 12, motorway_link: 6, trunk: 10, trunk_link: 6, primary: 9, primary_link: 5.5, secondary: 7.5, secondary_link: 5, tertiary: 6.5, tertiary_link: 4.5, residential: 6, unclassified: 5.5, living_street: 5, service: 4, pedestrian: 5, footway: 2.4, path: 1.8, steps: 2.2, cycleway: 2.2, track: 3, busway: 6 };
function roadWidth(t) {
  const w = num(t.width); if (w) return w;
  const lanes = num(t.lanes);
  if (lanes) { const base = lanes * 3.4 + (t.highway.startsWith('motorway') || t.highway.startsWith('trunk') ? 1 : 0.4); return t.oneway === 'yes' || t.oneway === '-1' ? base : Math.max(base, 5.5); }
  return ROAD_W[t.highway] || 4;
}
function sideOf(t, key) { // sidewalk / cycleway / parking:lane -> 'both' | 'left' | 'right' | 'no' | null
  const v = t[key], b = t[key + ':both'], l = t[key + ':left'], r = t[key + ':right'];
  if (v && v !== 'no' && v !== 'none') return ['both', 'left', 'right'].includes(v) ? v : 'yes';
  const L = l && l !== 'no' && l !== 'none', R = r && r !== 'no' && r !== 'none', B = b && b !== 'no' && b !== 'none';
  if (B || (L && R)) return 'both'; if (L) return 'left'; if (R) return 'right';
  return v === 'no' || v === 'none' || b === 'no' ? 'no' : null;
}
function parkingOf(t) {
  let side = null, ori = null;
  const pick = (s) => t['parking:lane:' + s] || t['parking:' + s] || null;
  const vals = { left: pick('left'), right: pick('right'), both: pick('both') };
  const on = (v) => v && v !== 'no' && v !== 'no_parking' && v !== 'no_stopping' && v !== 'no_standing';
  if (on(vals.both) || (on(vals.left) && on(vals.right))) side = 'both'; else if (on(vals.left)) side = 'left'; else if (on(vals.right)) side = 'right';
  if (side) { const v = vals[side] || vals.left || vals.right; ori = t['parking:' + side + ':orientation'] || t['parking:lane:' + side + ':orientation'] || (['parallel', 'diagonal', 'perpendicular'].includes(v) ? v : null); }
  return { side, ori };
}
function maxspeed(t) { const v = t.maxspeed; if (!v) return null; if (/urban/i.test(v)) return 60; return num(v); }
let skippedIndoor = 0;
function bakeRoads() {
  const out = [], crossings = [], areas = [], steps = [], tunnels = [], lateRoads = [];
  for (const e of load('roads')) {
    let t = e.tags || {};
    // pedestrian areas / squares (polygons): highway=pedestrian|footway|service + area=yes, multipolygon relations, place=square
    if (e.type === 'relation' || t.place === 'square' || t['area:highway'] || (t.area === 'yes' && t.highway)) {
      const polys = bakePolys(elementPolys(e), 0.2);
      if (polys.length) areas.push({ id: idOf(e), hw: t.highway || t['area:highway'] || (t.place === 'square' ? 'square' : 'area'), name: nameRu(t), surface: t.surface || null, sub: t.footway || t.service || null, layer: num(t.layer) ?? 0, tunnel: isTunnel(t), bridge: isBridge(t), polys });
      continue;
    }
    if (!t.highway || !e.geometry || e.geometry.length < 2) continue;
    if (t.highway === 'corridor' || t.indoor) { skippedIndoor++; continue; }
    // LATE ROADS (tools/late-roads-ids.mjs): a few real streets of Vasilievsky Island are mapped as highway=construction (the Birzhevoy proezd of the Spit, a stub of the 6-7 line, Kadetsky pereulok): they are kept
    // as roads (class = construction=* when that is a road class, else residential), flagged late:1, and go to the LAST part file after every other record (partOf): the END of the ROADS list, so that the index
    // of every other way stays what it was (the streets module hashes it). Everything else under construction or proposed stays out.
    const late = e.type === 'way' && (t.highway === 'construction' || t.highway === 'proposed') && LATE_ROAD_IDS.has(e.id);
    if (late) t = { ...t, highway: ['secondary', 'tertiary', 'residential', 'unclassified', 'service'].includes(t.construction) ? t.construction : 'residential' };
    if (['proposed', 'construction', 'razed', 'abandoned', 'platform', 'bus_stop', 'elevator'].includes(t.highway)) continue;
    const pts = geomPts(e);
    const isCross = t.footway === 'crossing' || (t.crossing != null && t.highway === 'footway');
    const pk = parkingOf(t);
    const hwSub = t.service || t.footway || t.cycleway || (t.highway === 'path' ? t.path : null) || null;
    const tun = isTunnel(t), pas = isPassage(t);
    const rt = routeWays.get('w' + e.id);
    for (const seg of clipLine(pts)) {
      const s = simplify(seg, 0.3); if (s.length < 2) continue;
      if (isCross) { crossings.push(compact({ id: 'w' + e.id, kind: t.crossing || t['crossing:markings'] || null, w: 3, signals: t.crossing === 'traffic_signals' ? 1 : 0, pts: flat(s) })); continue; }
      const rec = compact({
        id: 'w' + e.id, hw: t.highway, sub: hwSub, name: nameRu(t), nameEn: nameEn(t), w: round1(roadWidth(t)), lanes: num(t.lanes), lanesFwd: num(t['lanes:forward']), lanesBwd: num(t['lanes:backward']),
        oneway: t.oneway === 'yes' || t.junction === 'roundabout' ? 1 : t.oneway === '-1' ? -1 : 0,
        surface: t.surface || null, bridge: isBridge(t), tunnel: tun || pas ? 1 : 0, passage: pas ? 1 : 0, layer: num(t.layer) ?? 0, area: 0,
        lit: yes(t.lit) ? 1 : 0, sidewalk: sideOf(t, 'sidewalk'), cycleway: sideOf(t, 'cycleway') || (t.highway === 'cycleway' ? 'self' : null), maxspeed: maxspeed(t),
        parkingLane: pk.side, parkingOri: pk.ori, priv: ['private', 'no', 'customers', 'permit'].includes(t.access) || t.vehicle === 'private' ? 1 : 0, covered: yes(t.covered) ? 1 : 0, steps: num(t.step_count), ref: t.ref || null,
        bus: rt && rt.bus.size ? sortRefs(rt.bus) : null, trolley: rt && rt.trolley.size ? sortRefs(rt.trolley) : null, tram: rt && rt.tram.size ? sortRefs(rt.tram) : null,
        pts: flat(s),
      });
      if (late) { rec.late = 1; lateRoads.push(rec); } else out.push(rec);
      if (t.highway === 'steps') steps.push(compact({ id: rec.id, w: rec.w, count: num(t.step_count), tunnel: tun || pas ? 1 : 0, layer: rec.layer, bridge: rec.bridge, incline: t.incline || null, handrail: t.handrail || null, ramp: t.ramp || null, covered: rec.covered, surface: t.surface || null, lit: rec.lit, name: rec.name, pts: rec.pts }));
      if (tun) tunnels.push(compact({ id: rec.id, hw: t.highway, sub: hwSub, name: rec.name, w: rec.w, lanes: rec.lanes, oneway: rec.oneway, layer: rec.layer, level: t.level || null, pts: rec.pts }));
    }
  }
  out.push(...lateRoads);
  return { roads: out, crossings, areas, steps, tunnels };
}

// ================================================================== street furniture nodes (signals, crossings, bus stops, lamps, calming, doors, benches...)
function bakeStreet() {
  const signals = [], crossingNodes = [], lamps = [], calming = [], doors = [], furniture = [], stopsById = new Map();
  const seen = new Set();
  const addStop = (e) => {
    const t = e.tags || {}; const c = elCentre(e); if (!c || !inExtent(c)) return;
    const isStop = t.highway === 'bus_stop' || t.public_transport === 'platform' || t.public_transport === 'stop_position' || t.public_transport === 'station' || t.amenity === 'bus_station';
    if (!isStop) return;
    if (t.railway === 'platform' && (t.subway === 'yes' || t.train === 'yes')) return;                      // rail / metro platforms live in PLATFORMS
    if (t.railway === 'station' || t.station === 'subway') return;                                          // stations live in STATIONS
    const id = idOf(e); if (stopsById.has(id)) return;
    const pt = t.public_transport; const kind = t.amenity === 'bus_station' || pt === 'station' ? 'station' : pt === 'stop_position' ? 'stop_position' : pt === 'platform' || t.highway === 'platform' ? 'platform' : 'stop';
    stopsById.set(id, compact({ id, name: nameRu(t), kind, x: round1(c[0]), z: round1(c[1]), shelter: yes(t.shelter) ? 1 : 0, bench: yes(t.bench) ? 1 : 0, covered: yes(t.covered) ? 1 : 0, bin: yes(t.bin) ? 1 : 0, ref: t.ref || null, operator: t.operator || null, bus: t.bus === 'yes' || t.trolleybus === 'yes' || t.highway === 'bus_stop' ? 1 : 0, trolley: yes(t.trolleybus) ? 1 : 0, tram: yes(t.tram) ? 1 : 0, routes: stopRoutesOf(id), wheelchair: t.wheelchair || null }));
  };
  for (const e of [...load('street'), ...load('transit')]) {
    if (e.type === 'node' || e.type === 'way' || e.type === 'relation') addStop(e);
  }
  for (const e of load('street')) {
    const t = e.tags || {}; const k = idOf(e); if (seen.has(k)) continue; seen.add(k);
    const c = elCentre(e); if (!c || !inExtent(c)) continue;
    const x = round1(c[0]), z = round1(c[1]);
    if (t.railway === 'subway_entrance') continue;                                                          // ENTRANCES
    if (t.highway === 'traffic_signals') signals.push(compact({ id: idOf(e), x, z, kind: t.traffic_signals === 'crossing' ? 'crossing' : 'junction', dir: t['traffic_signals:direction'] || t.direction || null, sound: yes(t['traffic_signals:sound']) ? 1 : 0 }));
    else if (t.highway === 'crossing' || t.railway === 'crossing') crossingNodes.push(compact({ id: idOf(e), x, z, kind: t.crossing || (t['crossing:markings'] ? 'marked' : 'yes'), signals: t.crossing === 'traffic_signals' || t['crossing:signals'] === 'yes' ? 1 : 0, island: t['crossing:island'] || null, markings: t['crossing:markings'] || null, tactile: t.tactile_paving || null }));
    else if (t.highway === 'street_lamp' || t.man_made === 'street_lamp') lamps.push(compact({ id: idOf(e), x, z, h: num(t.height), support: t.support || null, lamp: t.lamp_type || t.lamp_mount || null }));
    else if (t.traffic_calming) { const pts = e.type === 'way' ? flat(simplify(geomPts(e), 0.2)) : null; calming.push(compact({ id: idOf(e), kind: t.traffic_calming, x, z, pts })); }
    else if (t.entrance) doors.push(compact({ id: idOf(e), x, z, kind: t.entrance, ref: t.ref || null, door: t.door || null, access: t.access || null, wheelchair: t.wheelchair || null, name: nameRu(t), level: t.level || null, addr: t['addr:housenumber'] ? { street: t['addr:street'] || null, no: t['addr:housenumber'] } : null }));
    else if (t.highway === 'bus_stop' || t.highway === 'platform') continue;                 // bus stops live in BUS_STOPS
    else if (t.amenity || t.leisure || t.emergency || t.advertising || t.highway) {
      const kind = t.amenity || t.leisure || (t.emergency ? 'emergency:' + t.emergency : null) || (t.advertising ? 'advertising:' + t.advertising : null) || t.highway;
      if (['stop', 'give_way', 'speed_camera', 'traffic_mirror', 'mini_roundabout', 'turning_circle', 'elevator', 'bus_stop', 'platform'].includes(kind) && !t.amenity) { furniture.push(compact({ id: idOf(e), kind: t.highway, x, z, dir: t.direction || null })); continue; }
      furniture.push(compact({ id: idOf(e), kind, x, z, name: nameRu(t), backrest: t.backrest || null, material: t.material || null, seats: num(t.seats), capacity: num(t.capacity), shelter: yes(t.shelter) ? 1 : 0, covered: yes(t.covered) ? 1 : 0, height: num(t.height), operator: t.operator || null }));
    }
  }
  return { signals, crossingNodes, lamps, calming, doors, furniture, stops: [...stopsById.values()] };
}

// ================================================================== water / green / landuse / pitches / parking
// RIVER = one record per named river / canal, the Fontanka FIRST (the old code reads RIVER[0] as "the river"): { id, name, nameEn, kind: 'river'|'canal', key, width, length, drop, line: [flat polylines], polys }
//   key  = stable short id of the waterway ('fontanka', 'moika', 'griboedov', 'winter-canal', 'swan-canal', 'neva' ...; Bolshaya Neva and the Neva share 'neva'),
//   width = mean width (polygon area / centre-line length inside the extent), length = centre line inside the extent (m), polys = the water polygons clipped to EXTENT (the Neva ones are
//   huge: 400-500 m wide), drop = ESTIMATED height (m) of the street / quay coping above the water surface (Fontanka 3.2 = layout RIVER_Y.water, canals 2.4, Neva 3.0):
//   a hint for the environment owner, the research dossiers decide.
const RIVER_KEY = { 'Фонтанка': 'fontanka', 'Мойка': 'moika', 'канал Грибоедова': 'griboedov', 'Зимняя канавка': 'winter-canal', 'Лебяжья канавка': 'swan-canal', 'Нева': 'neva', 'Большая Нева': 'neva', 'Малая Нева': 'malaya-neva', 'Воскресенский канал': 'voskresensky' };
const RIVER_DROP = { fontanka: 3.2, moika: 2.4, griboedov: 2.4, 'winter-canal': 2.4, 'swan-canal': 2.0, neva: 3.0 };
function bakeWater() {
  const out = [], streams = [], rivers = new Map();
  const rec = (name, nameEn, kind) => rivers.get(name) || rivers.set(name, { name, nameEn, kind, line: [], polys: [], id: null }).get(name);
  const pending = [];                                                       // unnamed canal / river polygons: matched to the nearest named centre line afterwards
  for (const e of load('water')) {
    const t = e.tags || {};
    const isFountain = t.amenity === 'fountain' || t.water === 'fountain';
    if (t.waterway && !(t.waterway === 'riverbank' || t.waterway === 'dock') && e.type === 'way') {
      if (e.geometry && t.waterway !== 'dock') for (const s of clipLine(geomPts(e))) {
        const r = compact({ id: 'w' + e.id, kind: t.waterway, name: nameRu(t), tunnel: t.tunnel && t.tunnel !== 'no' ? 1 : 0, culvert: t.tunnel === 'culvert' ? 1 : 0, w: num(t.width), pts: flat(simplify(s, 0.3)) });
        streams.push(r);
        if ((t.waterway === 'river' || t.waterway === 'canal') && t.name) rec(t.name, nameEn(t), t.waterway).line.push(r.pts);
      }
      if (!isFountain && t.natural !== 'water') continue;
    }
    const isPoly = t.natural === 'water' || t.waterway === 'riverbank' || t.landuse === 'basin' || isFountain || t.water;
    if (!isPoly) continue;
    const polys = bakePolys(elementPolys(e), t.water === 'river' || t.waterway === 'riverbank' ? 0.4 : 0.15); if (!polys.length) continue;
    const kind = isFountain ? 'fountain' : (t.water === 'river' || t.waterway === 'riverbank' || e.type === 'relation' && t.water !== 'canal' && polys.some((p) => Math.abs(ringArea(closeRing(unflat(p.o)))) > 20000)) ? 'river' : t.water || (t.landuse === 'basin' ? 'basin' : 'pond');
    out.push({ id: idOf(e), kind, name: nameRu(t), polys });
    if ((kind === 'river' || kind === 'canal') && t.name) { const r = rec(t.name, nameEn(t), kind); r.polys.push(...polys); r.id = r.id || idOf(e); if (kind === 'river') r.kind = 'river'; }
    else if (kind === 'canal' || kind === 'river') pending.push({ id: idOf(e), kind, polys });
  }
  // unnamed canal polygons (the Winter Canal has two): the named waterway whose centre line passes through / within 25 m of the polygon
  const segDist = (px, pz, l) => { let d = 1e9; for (let i = 0; i + 3 < l.length; i += 2) { const ax = l[i], az = l[i + 1], dx = l[i + 2] - ax, dz = l[i + 3] - az, q = dx * dx + dz * dz, t = q ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / q)) : 0; d = Math.min(d, Math.hypot(px - ax - dx * t, pz - az - dz * t)); } return d; };
  for (const p of pending) {
    const c = polysCentre(p.polys); let best = null, bd = 25;
    for (const r of rivers.values()) for (const l of r.line) { const d = segDist(c[0], c[1], l); if (d < bd) { bd = d; best = r; } }
    if (best) { best.polys.push(...p.polys); best.id = best.id || p.id; }
  }
  // RIVER: one record per named river / canal = centre line(s) + banks polygon(s) + mean width (polygon area / centre-line length)
  const river = [];
  for (const r of rivers.values()) {
    if (!r.polys.length && !r.line.length) continue;
    const len = r.line.reduce((s, l) => s + lineLen(l), 0), area = polysArea(r.polys), key = RIVER_KEY[r.name] || null;
    river.push({ id: r.id || null, name: r.name, nameEn: r.nameEn, kind: r.kind, width: len > 0 && area > 0 ? round1(area / len) : null, length: Math.round(len), line: r.line, polys: r.polys, key, drop: key ? RIVER_DROP[key] ?? 2.4 : 2.4 });
  }
  river.sort((a, b) => (b.key === 'fontanka') - (a.key === 'fontanka') || (b.polys.length ? 1 : 0) - (a.polys.length ? 1 : 0) || a.name.localeCompare(b.name));   // the Fontanka stays RIVER[0]
  return { water: out, streams, river };
}
const GREEN_KINDS = new Set(['park', 'garden', 'pitch', 'playground', 'stadium', 'track', 'dog_park', 'recreation_ground', 'grass', 'forest', 'meadow', 'village_green', 'flowerbed', 'greenfield', 'greenery', 'wood', 'scrub', 'grassland', 'heath', 'cemetery', 'shrubbery', 'orchard', 'allotments', 'wetland', 'nature_reserve', 'fitness_station']);
function bakeGreen() {
  const areas = [], rows = [], landuse = [], pitches = [];
  for (const e of load('green')) {
    const t = e.tags || {};
    const kind = t.leisure || t.landuse || t.natural;
    if (t.natural === 'tree_row') { if (e.geometry) for (const seg of clipLine(geomPts(e))) rows.push(flat(simplify(seg, 0.3))); continue; }
    if (e.type === 'node') continue;
    const polys = bakePolys(elementPolys(e), 0.3); if (!polys.length) continue;
    if (GREEN_KINDS.has(kind)) areas.push({ id: idOf(e), kind, name: nameRu(t), polys });
    else landuse.push({ id: idOf(e), kind, name: nameRu(t), polys });
    if (['pitch', 'track', 'stadium', 'playground', 'sports_centre', 'fitness_station', 'swimming_pool', 'ice_rink'].includes(t.leisure)) {
      const c = polysCentre(polys);
      pitches.push(compact({ id: idOf(e), kind: t.leisure, sport: t.sport || null, surface: t.surface || null, name: nameRu(t), lit: yes(t.lit) ? 1 : 0, x: round1(c[0]), z: round1(c[1]), area: Math.round(polysArea(polys)), polys }));
    }
  }
  const trees = [];
  for (const e of load('trees')) { const [x, z] = proj(e.lon, e.lat); if (inExtent([x, z])) trees.push(round1(x), round1(z)); }
  return { areas, rows, trees, landuse, pitches };
}
function bakeParking() {
  const out = [];
  for (const e of load('parking')) {
    const t = e.tags || {};
    if (!['parking', 'parking_space', 'motorcycle_parking', 'bicycle_parking'].includes(t.amenity)) continue;
    const c = elCentre(e); if (!c || !inExtent(c)) continue;
    const polys = e.type === 'node' ? [] : bakePolys(elementPolys(e), 0.2);
    if (e.type !== 'node' && !polys.length) continue;
    out.push(compact({ id: idOf(e), amenity: t.amenity, kind: t.parking || null, name: nameRu(t), capacity: num(t.capacity), fee: t.fee || null, access: t.access || null, surface: t.surface || null, x: round1(c[0]), z: round1(c[1]), area: polys.length ? Math.round(polysArea(polys)) : null, polys }));
  }
  return out;
}

// ================================================================== bridges / walls / embankments / barriers / man-made / monuments
// BRIDGES: man_made=bridge decks (polygons, kind "deck") + bridge=yes ways (centre lines: kind road | path | rail | tram | subway | canal, with layer and width).
function bakeBridges() {
  const out = [], seen = new Set();
  for (const e of [...load('bridges'), ...load('roads'), ...load('rail')]) {
    const t = e.tags || {}; const k = idOf(e); if (seen.has(k)) continue;
    if (t.man_made === 'bridge') {
      seen.add(k);
      const polys = bakePolys(elementPolys(e), 0.2);
      if (polys.length) out.push(compact({ id: k, kind: 'deck', name: nameRu(t), layer: num(t.layer) ?? 0, structure: t['bridge:structure'] || t.bridge || null, material: t.material || null, polys, pts: [] }));
    } else if (isBridge(t) && e.type === 'way' && e.geometry && (t.highway || t.railway)) {
      seen.add(k);
      const kind = t.highway ? (['footway', 'path', 'steps', 'pedestrian', 'cycleway'].includes(t.highway) ? 'path' : 'road') : t.railway === 'rail' || t.railway === 'light_rail' ? 'rail' : t.railway;
      for (const s of clipLine(geomPts(e))) { const q = simplify(s, 0.2); if (q.length >= 2) out.push(compact({ id: k, kind, hw: t.highway || null, name: nameRu(t), nameEn: nameEn(t), layer: num(t.layer) ?? 1, w: t.highway ? round1(roadWidth(t)) : null, lanes: num(t.lanes), oneway: t.oneway === 'yes' ? 1 : 0, structure: t['bridge:structure'] || t.bridge || null, material: t.material || null, maxweight: num(t.maxweight), wikidata: t.wikidata || null, polys: [], pts: flat(q) })); }
    }
  }
  return out;
}
function bakeBarriers() {
  const walls = [], barriers = [], nodes = [], emb = [];
  const seen = new Set();
  for (const e of [...load('barriers'), ...load('manmade')]) {
    const t = e.tags || {}; const k = idOf(e); if (seen.has(k)) continue; seen.add(k);
    if (e.type === 'node') { if (t.barrier && e.lat != null) { const [x, z] = proj(e.lon, e.lat); if (inExtent([x, z])) nodes.push(compact({ id: idOf(e), kind: t.barrier, x: round1(x), z: round1(z), access: t.access || null, material: t.material || null, h: num(t.height) })); } continue; }
    if (!e.geometry) continue;
    const pts = geomPts(e);
    const isEmb = t.man_made === 'embankment' || t.man_made === 'quay' || t.waterway === 'bank' || t.embankment === 'yes';
    if (t.barrier === 'retaining_wall' || t.man_made === 'embankment') {
      for (const s of clipLine(pts)) walls.push(compact({ id: 'w' + e.id, kind: t.man_made || 'wall', h: num(t.height), material: t.material || null, pts: flat(simplify(s, 0.2)) }));
    }
    if (isEmb || t.barrier === 'retaining_wall') for (const s of clipLine(pts)) emb.push(compact({ id: 'w' + e.id, kind: t.man_made || t.waterway || t.barrier, h: num(t.height), material: t.material || null, name: nameRu(t), surface: t.surface || null, wikidata: t.wikidata || null, pts: flat(simplify(s, 0.2)) }));
    if (t.barrier === 'retaining_wall') continue;
    if (t.barrier && e.type === 'way') {
      const closed = isClosed(pts);
      for (const s of (closed ? [pts] : clipLine(pts))) { const ss = simplify(s, 0.15); if (ss.length < 2) continue; if (closed && !ss.some(inExtent)) continue; barriers.push(compact({ id: 'w' + e.id, kind: t.barrier, h: num(t.height), material: t.material || null, access: t.access || null, closed: closed ? 1 : 0, pts: flat(closed ? ss.slice(0, -1) : ss) })); }
    }
  }
  return { walls, barriers, barrierNodes: nodes, embankments: emb };
}
function bakeManmade() {
  const pipes = [], structs = [], piers = [];
  const seen = new Set();
  for (const e of load('manmade')) {
    const t = e.tags || {}; const k = idOf(e); if (seen.has(k)) continue; seen.add(k);
    const mm = t.man_made;
    if (mm === 'pipeline' || t.pipeline) {
      if (e.type !== 'way' || !e.geometry) continue;
      for (const s of clipLine(geomPts(e))) pipes.push(compact({ id: 'w' + e.id, name: nameRu(t), loc: t.location || null, substance: t.substance || null, h: num(t.height), d: num(t.diameter), layer: num(t.layer), pts: flat(simplify(s, 0.2)) }));
      continue;
    }
    if (!mm && !t.power) {
      if (t.waterway === 'dock' && e.geometry) { const polys = bakePolys(elementPolys(e), 0.2); if (polys.length) piers.push({ id: idOf(e), kind: 'dock', name: nameRu(t), polys, pts: [] }); }
      continue;
    }
    if (mm === 'pier' || mm === 'quay') { if (e.geometry) { const polys = bakePolys(elementPolys(e), 0.2); const pts = geomPts(e); if (polys.length) piers.push({ id: idOf(e), kind: mm, name: nameRu(t), polys, pts: [] }); else if (pts.some(inExtent)) piers.push({ id: idOf(e), kind: mm, name: nameRu(t), polys: [], pts: flat(simplify(pts, 0.2)) }); } continue; }
    if (['embankment', 'breakwater', 'groyne', 'bridge', 'monument', 'obelisk', 'street_lamp'].includes(mm)) continue;
    const c = elCentre(e); if (!c || !inExtent(c)) continue;
    const polys = e.type === 'node' ? [] : bakePolys(elementPolys(e), 0.15);
    structs.push(compact({ id: idOf(e), kind: mm || ('power:' + t.power), sub: t['tower:type'] || t['tower:construction'] || t.substance || t.power || null, name: nameRu(t), x: round1(c[0]), z: round1(c[1]), h: num(t.height), polys: polys.length ? polys : null, operator: t.operator || null, material: t.material || null }));
  }
  return { pipes, structs, piers };
}
const MON_HIST = new Set(['monument', 'memorial', 'statue', 'cannon', 'wayside_cross', 'wayside_shrine', 'tomb', 'ship', 'aircraft', 'locomotive', 'tank', 'vehicle', 'stone', 'boundary_stone', 'milestone', 'fort', 'archaeological_site', 'ruins', 'cross', 'bust', 'plaque']);
function bakeMonuments() {
  const out = [], seen = new Set();
  for (const e of [...load('historic'), ...load('manmade'), ...load('pois')]) {
    const t = e.tags || {}; const k = idOf(e); if (seen.has(k)) continue;
    const isMon = MON_HIST.has(t.historic) || t.man_made === 'monument' || t.man_made === 'obelisk' || t.tourism === 'artwork' || t.memorial;
    if (!isMon || t.building) continue;
    seen.add(k);
    const c = elCentre(e); if (!c || !inExtent(c)) continue;
    const polys = e.type === 'node' ? [] : bakePolys(elementPolys(e), 0.15);
    out.push(compact({ id: idOf(e), kind: t.historic || (t.man_made ? 'man_made:' + t.man_made : 'artwork'), sub: t.memorial || t.artwork_type || t.monument || null, name: nameRu(t), x: round1(c[0]), z: round1(c[1]), h: num(t.height), material: t.material || null, startDate: t.start_date || null, subject: t.subject || t['subject:wikidata'] || null, artist: t.artist_name || null, inscription: t.inscription || null, description: t.description || null, wikidata: t.wikidata || null, wikipedia: t.wikipedia || null, heritage: t.heritage || null, polys: polys.length ? polys : null }));
  }
  return out;
}
function bakeFountains() {
  const out = [], seen = new Set();
  for (const e of [...load('water'), ...load('pois')]) {
    const t = e.tags || {}; if (!(t.amenity === 'fountain' || t.water === 'fountain')) continue;
    const k = idOf(e); if (seen.has(k)) continue; seen.add(k);
    const c = elCentre(e); if (!c || !inExtent(c)) continue;
    const polys = e.type === 'node' ? [] : bakePolys(elementPolys(e), 0.15);
    out.push(compact({ id: k, name: nameRu(t), x: round1(c[0]), z: round1(c[1]), area: polys.length ? Math.round(polysArea(polys)) : null, polys }));
  }
  return out;
}

// ================================================================== POIs (named amenity / shop / tourism / office ... points, signage)
const POI_KEYS = ['shop', 'amenity', 'tourism', 'office', 'craft', 'healthcare', 'leisure', 'historic'];
const POI_SKIP = new Set(['parking', 'parking_space', 'parking_entrance', 'motorcycle_parking', 'bicycle_parking', 'bench', 'shelter', 'waste_basket', 'waste_disposal', 'fountain', 'artwork', 'pitch', 'playground', 'park', 'garden', 'track', 'bus_station', 'taxi', 'loading_dock']);
function bakePois(B) {
  const outlines = B.filter((b) => !b.part);
  const byId = new Map(outlines.map((b) => [b.id, b]));
  const findBuilding = (pt) => { let best = null; for (const o of outlines) { if (pt[0] < o.cx - 200 || pt[0] > o.cx + 200 || pt[1] < o.cz - 200 || pt[1] > o.cz + 200) continue; if (o.polys.some((p) => pointPoly(pt, p))) { if (!best || o.area < best.area) best = o; } } return best; };
  const out = [], seen = new Set();
  for (const e of [...load('pois'), ...load('historic')]) {
    const t = e.tags || {}; const id = idOf(e); if (seen.has(id)) continue;
    let kind = null, sub = null;
    for (const k of POI_KEYS) if (t[k] && t[k] !== 'no') { kind = k; sub = t[k]; break; }
    if (!kind || POI_SKIP.has(sub)) continue;
    if (kind === 'historic' && (MON_HIST.has(sub) || t.memorial)) continue;          // monuments have their own table
    if (kind === 'leisure' && !t.name) continue;
    const name = nameRu(t);
    if (!name && !t.brand && !t.operator && kind !== 'shop' && kind !== 'amenity') continue;
    seen.add(id);
    const c = elCentre(e); if (!c || !inExtent(c)) continue;
    const self = e.type !== 'node' && t.building ? byId.get(id) : null;
    const bld = self || findBuilding(c);
    out.push(compact({ id, name, nameEn: nameEn(t), kind, sub, x: round1(c[0]), z: round1(c[1]), bldg: bld ? bld.id : null, brand: t.brand || null, operator: t.operator || null, cuisine: t.cuisine || null, oh: t.opening_hours || null, street: t['addr:street'] || null, no: t['addr:housenumber'] || null, level: t.level || null, phone: t.phone || t['contact:phone'] || null, website: t.website || t['contact:website'] || null, heritage: t.heritage || null, wikidata: t.wikidata || null, area: e.type === 'node' ? null : 1 }));
  }
  for (const p of out) if (p.bldg === undefined) p.bldg = null;
  return out;
}

// ================================================================== railway: main line + yard (RAILS), platforms, stations, subway tunnels, entrances, tramways
const RAIL_KINDS = new Set(['rail', 'light_rail', 'narrow_gauge', 'monorail', 'construction', 'disused', 'abandoned']);
function platformKind(t) { return yes(t.subway) ? 'subway' : yes(t.tram) ? 'tram' : yes(t.train) ? 'rail' : yes(t.bus) || yes(t.trolleybus) ? 'bus' : 'rail'; }
function bakeRail() {
  const rails = [], tramways = [], subway = [], platforms = [], stations = [], entrances = [], nodes = [];
  const seen = new Set();
  const all = [...load('rail'), ...load('transit'), ...load('street')];
  for (const e of all) {
    const t = e.tags || {}; const k = idOf(e); if (seen.has(k)) continue; seen.add(k);
    // ---- platforms (railway=platform / public_transport=platform with a railway or subway tag; bus platforms are in BUS_STOPS)
    if (t.railway === 'platform' || (t.public_transport === 'platform' && (yes(t.train) || yes(t.subway) || yes(t.tram)) && t.highway !== 'bus_stop')) {
      const polys = e.type === 'node' ? [] : bakePolys(elementPolys(e), 0.1);
      const pts = e.type === 'way' && !polys.length ? flat(simplify(geomPts(e), 0.1)) : [];
      const c = elCentre(e); if (!c) continue;
      if (!polys.length && !(pts.length && geomPts(e).some(inExtent)) && !inExtent(c)) continue;
      platforms.push(compact({ id: k, kind: platformKind(t), name: nameRu(t), ref: t.ref || null, layer: num(t.layer) ?? 0, underground: t.location === 'underground' ? 1 : 0, covered: yes(t.covered) || yes(t.shelter) || t.shelter === 'yes' ? 1 : 0, height: num(t.height), length: num(t.length), surface: t.surface || null, level: t.level || null, network: t.network || null, x: round1(c[0]), z: round1(c[1]), area: polys.length ? Math.round(polysArea(polys)) : null, polys, pts }));
      continue;
    }
    // ---- stations / halts / metro stations
    if (t.railway === 'station' || t.railway === 'halt' || t.railway === 'tram_stop' || t.station === 'subway' || (t.public_transport === 'station' && !yes(t.bus) && t.amenity !== 'bus_station' && (t.train || t.subway || t.railway || t.station))) {
      const c = elCentre(e); if (!c || !inExtent(c)) continue;
      const polys = e.type === 'node' ? [] : bakePolys(elementPolys(e), 0.15);
      const kind = t.station === 'subway' || yes(t.subway) ? 'subway' : t.railway === 'tram_stop' ? 'tram' : t.railway === 'halt' ? 'halt' : t.station === 'light_rail' ? 'light_rail' : 'rail';
      stations.push(compact({ id: k, kind, name: nameRu(t), nameEn: nameEn(t), network: t.network || null, operator: t.operator || null, colour: t.colour || null, ref: t.ref || null, line: t.line || null, depth: num(t.depth), layer: num(t.layer) ?? 0, wheelchair: t.wheelchair || null, startDate: t.start_date || null, wikidata: t.wikidata || null, uic: t.uic_ref || null, x: round1(c[0]), z: round1(c[1]), polys: polys.length ? polys : null }));
      continue;
    }
    // ---- subway entrances / exits
    if (t.railway === 'subway_entrance') {
      const c = elCentre(e); if (!c || !inExtent(c)) continue;
      entrances.push(compact({ id: k, name: nameRu(t), ref: t.ref || null, kind: t.entrance || 'yes', colour: t.colour || null, network: t.network || null, wheelchair: t.wheelchair || null, layer: num(t.layer) ?? 0, level: t.level || null, oh: t.opening_hours || null, operator: t.operator || null, lift: yes(t.elevator) ? 1 : 0, x: round1(c[0]), z: round1(c[1]) }));
      continue;
    }
    // ---- other railway nodes: buffer stops, switches, crossings, signals
    if (e.type === 'node' && t.railway) {
      const [x, z] = proj(e.lon, e.lat); if (!inExtent([x, z])) continue;
      if (['buffer_stop', 'switch', 'railway_crossing', 'level_crossing', 'signal', 'tram_crossing', 'tram_level_crossing', 'crossing', 'derail'].includes(t.railway)) nodes.push(compact({ id: k, kind: t.railway, x: round1(x), z: round1(z), ref: t.ref || null, signal: t['railway:signal:main'] || t['railway:signal:minor'] || null }));
      continue;
    }
    if (e.type !== 'way' || !t.railway || !e.geometry) continue;
    // ---- track ways
    const pts = geomPts(e);
    const base = { id: k, name: nameRu(t), ref: t.ref || null, service: t.service || null, usage: t.usage || null, tunnel: isTunnel(t), bridge: isBridge(t), layer: num(t.layer) ?? 0, gauge: num(t.gauge), electrified: t.electrified || null, voltage: num(t.voltage), tracks: num(t.tracks), maxspeed: num(t.maxspeed), embedded: t.embedded_rails || null };
    if (t.railway === 'subway') {
      const info = subwayWayInfo.get(e.id) || {};
      for (const seg of clipLine(pts)) { const s = simplify(seg, 0.2); if (s.length >= 2) subway.push(compact({ ...base, name: nameRu(t) || info.name || null, line: info.ref || null, colour: info.colour || t.colour || null, route: info.route || null, depth: num(t.depth), location: t.location || null, pts: flat(s) })); }
    } else if (t.railway === 'tram') {
      for (const seg of clipLine(pts)) { const s = simplify(seg, 0.15); if (s.length >= 2) tramways.push(compact({ ...base, pts: flat(s) })); }
    } else if (RAIL_KINDS.has(t.railway)) {
      for (const seg of clipLine(pts)) { const s = simplify(seg, 0.15); if (s.length >= 2) rails.push(compact({ ...base, kind: t.railway, pts: flat(s) })); }
    }
  }
  // stations of the metro: attach the lines that call there (route stop member names) so that the lead can colour them
  return { rails, tramways, subway, platforms, stations, entrances, nodes };
}

// ================================================================== write
const routes = bakeRoutes();
const subwayRoutes = bakeSubwayRoutes();
const B = bakeBuildings();
const { roads, crossings, areas, steps, tunnels } = bakeRoads();
const { signals, crossingNodes, lamps, calming, doors, furniture, stops } = bakeStreet();
const { water, streams, river } = bakeWater();
const { areas: green, rows: treeRows, trees, landuse, pitches } = bakeGreen();
const parking = bakeParking();
const bridges = bakeBridges();
const { walls, barriers, barrierNodes, embankments } = bakeBarriers();
const { pipes, structs, piers } = bakeManmade();
const monuments = bakeMonuments();
const fountains = bakeFountains();
const pois = bakePois(B);
const { rails, tramways, subway, platforms, stations, entrances, nodes: railNodes } = bakeRail();
// entrances: the building that contains them (or the nearest outline within 12 m) - the vestibule / the house the stairs are built into
{
  const outl = B.filter((b) => !b.part && !b.underground);
  const dist = (pt, b) => { let m = 1e9; for (const p of b.polys) { const r = unflat(p.o); for (let i = 0; i < r.length; i++) { const a = r[i], c = r[(i + 1) % r.length]; const dx = c[0] - a[0], dz = c[1] - a[1], l = dx * dx + dz * dz; let t = l ? ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dz) / l : 0; t = Math.max(0, Math.min(1, t)); m = Math.min(m, Math.hypot(a[0] + t * dx - pt[0], a[1] + t * dz - pt[1])); } } return m; };
  for (const e of entrances) {
    const pt = [e.x, e.z]; let best = null;
    for (const b of outl) { if (pt[0] < b.cx - 150 || pt[0] > b.cx + 150 || pt[1] < b.cz - 150 || pt[1] > b.cz + 150) continue; if (b.polys.some((p) => pointPoly(pt, p))) { if (!best || b.area < best.b.area) best = { b, d: 0 }; } }
    if (!best) for (const b of outl) { if (Math.abs(pt[0] - b.cx) > 80 + Math.sqrt(b.area) || Math.abs(pt[1] - b.cz) > 80 + Math.sqrt(b.area)) continue; const d = dist(pt, b); if (d <= 12 && (!best || d < best.d)) best = { b, d }; }
    if (best) { e.bldg = best.b.id; e.bldgDist = Math.round(best.d * 10) / 10; }
  }
}
// metro stations: the route lines that call there (by name), for line colours / refs
for (const s of stations.filter((x) => x.kind === 'subway')) {
  const lines = subwayRoutes.filter((r) => r.stops.some((p) => p.name === s.name)).map((r) => r.ref).filter(Boolean);
  const uniq = [...new Set(lines)]; if (uniq.length) s.lines = uniq;
}

// ---- z-fighting audit of the data (coplanar / duplicated geometry the renderer would flicker on):
//  * OVERLAPS = pairs of VISIBLE buildings / parts (skip=0) whose footprints overlap by >= 25 % of the smaller one and are not parent / child
//    ({a, b, frac, areaA, areaB, hA, hB, same}: same = 1 when the heights agree within 0.5 m, i.e. the roofs / walls are coplanar and WILL z-fight);
//    b.dupOf = id of the building whose footprint AND vertical interval it duplicates
//    (>= 85 % footprint overlap, similar area, comparable mapped bottom/top): drop one;
//  * DUP_ROADS = road ways drawn twice (same end points and length within 1 m)
const OVERLAPS = [];
{
  const vis = B.filter((b) => !b.skip && !b.underground);
  const cell = 40, grid = new Map(); const bb = new Map();
  for (const b of vis) { const r = bboxOf(unflat(b.polys[0].o)); bb.set(b.id, r); for (let i = Math.floor(r.x0 / cell); i <= Math.floor(r.x1 / cell); i++) for (let k = Math.floor(r.z0 / cell); k <= Math.floor(r.z1 / cell); k++) { const key = i + ',' + k; if (!grid.has(key)) grid.set(key, []); grid.get(key).push(b); } }
  const seenPair = new Set();
  const inB = (pt, b) => b.polys.some((p) => pointPoly(pt, p));
  for (const lst of grid.values()) for (let i = 0; i < lst.length; i++) for (let k = i + 1; k < lst.length; k++) {
    const A = lst[i], C = lst[k]; const key = A.id < C.id ? A.id + '|' + C.id : C.id + '|' + A.id; if (seenPair.has(key)) continue; seenPair.add(key);
    if (A.parent === C.id || C.parent === A.id) continue;
    const ra = bb.get(A.id), rc = bb.get(C.id); if (ra.x1 < rc.x0 || rc.x1 < ra.x0 || ra.z1 < rc.z0 || rc.z1 < ra.z0) continue;
    const small = A.area <= C.area ? A : C, big = small === A ? C : A; const rs = bb.get(small.id);
    let hit = 0, tot = 0; const st = Math.max(0.7, Math.sqrt(small.area) / 14);
    for (let x = rs.x0 + st / 2; x < rs.x1; x += st) for (let z = rs.z0 + st / 2; z < rs.z1; z += st) { if (!inB([x, z], small)) continue; tot++; if (inB([x, z], big)) hit++; }
    if (!tot) continue; const frac = hit / tot; if (frac < 0.25) continue;
    const hA = A.h ?? A.hEst, hC = C.h ?? C.hEst;
    OVERLAPS.push({ a: A.id, b: C.id, frac: Math.round(frac * 100) / 100, areaA: A.area, areaB: C.area, hA: hA ?? null, hB: hC ?? null, same: (hA == null && hC == null) || (hA != null && hC != null && Math.abs(hA - hC) < 0.5) ? 1 : 0 });
    // Equal plan outlines can describe separate stacked floors, not duplicate
    // geometry (e.g. Europolis' 0–6.6, 6.6–9.9 and 9.9–13.2 m storeys).
    // Unknown top heights are insufficient evidence to discard a building.
    const loA = A.minH ?? 0, loC = C.minH ?? 0;
    const sameInterval = Number.isFinite(hA) && Number.isFinite(hC) &&
      Math.abs(loA - loC) < 0.5 && Math.abs(hA - hC) < 0.5 &&
      Math.min(hA, hC) > Math.max(loA, loC);
    if (sameInterval && frac >= 0.85 && Math.min(A.area, C.area) / Math.max(A.area, C.area) >= 0.7) { const later = A.id > C.id ? A : C; later.dupOf = (later === A ? C : A).id; }
  }
}
const dupRoads = [];
{ const seen = new Map(); for (const r of roads) { if (r.tunnel) continue; const n = r.pts.length; const k = [r.hw, Math.round(Math.min(r.pts[0] + r.pts[1], r.pts[n - 2] + r.pts[n - 1]) * 1), Math.round(lineLen(r.pts))].join(':'); const o = seen.get(k); if (o && Math.hypot(o.pts[0] - r.pts[0], o.pts[1] - r.pts[1]) < 1.5) dupRoads.push([o.id, r.id]); else seen.set(k, r); } }
// ---- height statistics (outline buildings that are not hidden by their parts, and parts)
const stat = (list) => { const s = { total: list.length, height: 0, levelsOnly: 0, neither: 0 }; for (const b of list) { if (b.hSrc === 'height') s.height++; else if (b.hSrc === 'levels') s.levelsOnly++; else s.neither++; } return s; };
const visible = B.filter((b) => !b.skip);
const statAll = stat(visible), statOutl = stat(B.filter((b) => !b.part && !b.skip)), statParts = stat(B.filter((b) => b.part));
const named = { name: B.filter((b) => b.name).length, addr: B.filter((b) => b.addr && b.addr.no).length, startDate: B.filter((b) => b.startDate).length, heritage: B.filter((b) => b.heritage).length, colour: B.filter((b) => b.colour).length, material: B.filter((b) => b.material).length, roof: B.filter((b) => b.roof).length, architect: B.filter((b) => b.tags && b.tags.architect).length };

const j = (v) => JSON.stringify(v);
const counts = `buildings ${B.length} (outlines ${B.filter((b) => !b.part).length}, parts ${B.filter((b) => b.part).length}, hidden outlines ${B.filter((b) => b.skip).length}) · roads ${roads.length} (tunnels ${tunnels.length}, steps ${steps.length}, indoor corridors skipped ${skippedIndoor}) · crossings ${crossings.length} (+${crossingNodes.length} nodes) · areas ${areas.length} · signals ${signals.length} · bus stops ${stops.length} · lamps ${lamps.length} · calming ${calming.length} · doors ${doors.length} · furniture ${furniture.length}`;
const counts2 = `water ${water.length} (streams ${streams.length}, river records ${river.length}) · fountains ${fountains.length} · green ${green.length} · landuse ${landuse.length} · pitches ${pitches.length} · parking ${parking.length} · tree rows ${treeRows.length} · trees ${trees.length / 2} · bridges ${bridges.length} · walls ${walls.length} · embankments ${embankments.length} · barriers ${barriers.length} (+${barrierNodes.length} nodes) · structures ${structs.length} · monuments ${monuments.length} · pois ${pois.length}`;
const zf = `z-fight audit: ${OVERLAPS.length} overlapping visible building pairs (${OVERLAPS.filter((o) => o.same).length} with the same height = coplanar, ${B.filter((b) => b.dupOf).length} marked dupOf), ${dupRoads.length} duplicated road ways`;
const counts3 = `rails ${rails.length} · rail nodes ${railNodes.length} · platforms ${platforms.length} · stations ${stations.length} · subway ways ${subway.length} · subway routes ${subwayRoutes.length} · entrances ${entrances.length} · trolleybus routes ${routes.trolley.length} · tram routes ${routes.tram.length} · bus routes ${routes.bus.length} · tramways ${tramways.length} · piers ${piers.length}`;

const HEADER = [
  '// GENERATED by tools/bake-osm.mjs from OpenStreetMap data (c) OpenStreetMap contributors, ODbL (https://www.openstreetmap.org/copyright) — do not edit by hand.',
  '// Saint Petersburg centre (Moscow Railway Station, Vosstaniya Square, Nevsky Prospekt, Fontanka) and the western extension along Nevsky to the Admiralty / Palace Square / St Isaacs (Moika, Griboedov Canal, Winter Canal, Neva). Local frame: metres from ORIGIN, +X east, +Z south (so -Z is north), no rotation. Polygons: {o: outer ring, h: [holes]} as flat [x,z,x,z,...] (not closed).',
  `// ORIGIN = Yandex ll of docs/reference/yandex-center.png (not its centre: see docs/reference/calibration.md). PLAY = the walkable area = a UNION of rectangles PLAY_RECTS (${RECT_NAMES.map((n, i) => n + ' ' + j(PLAY_RECTS[i])).join('; ')}; the PLAY export is only their bounding box: use inPlay / clampToPlay of layout.js to test a point); EXTENT_RECTS = every PLAY rectangle grown by ${EXTENT_GROW} m of scenery (EXTENT = bounding box). Everything is clipped to the UNION of EXTENT_RECTS (a ring inside the union stays whole). The ground is flat (y = 0).`,
  `// SPLIT: the records are stored in part files by region (REGIONS = [{name, file, playRect, extentRect}]; a record belongs to the first EXTENT rectangle, in RECT_NAMES order, that contains its representative point: centroid / x,z / first vertex). This facade concatenates the arrays in that order, so the records of the first build (region OLD, file city-east.js) come first and keep their order. SUBWAY_ROUTES, TROLLEY, TRAM_ROUTES, BUS_ROUTES and RIVER are not split (RIVER[0] is the Fontanka).`,
  '// RIVER = [{id, name, nameEn, kind: "river"|"canal", width, length, line, polys, key, drop}] (key: fontanka | moika | griboedov | winter-canal | swan-canal | neva ...; drop = estimated street-to-water height in m).',
  `// Counts: ${counts}`,
  `// Counts: ${counts2}`,
  `// Counts: ${counts3}`,
  `// ${zf}. OVERLAPS = [{a, b, frac, areaA, areaB, hA, hB, same}] footprint overlaps of visible buildings/parts (same=1: equal heights, coplanar roofs: z-fighting); BUILDINGS[].dupOf = id of the building it duplicates (draw only one).`,
  `// Height coverage (visible buildings + parts, ${statAll.total}): mapped height ${statAll.height}, levels only ${statAll.levelsOnly}, neither ${statAll.neither}. Outlines ${j(statOutl)}. Parts ${j(statParts)}. Other fields ${j(named)}.`,
  '// BUILDINGS: h = mapped height else levels*3.3 (+roof:levels*1.5) else null; hEst = mapped height else levels*3.3 else null (no invention); hSrc = "height"|"levels"|null; minH; roof/roofH/roofDir/roofColour/roofMaterial; colour (building:colour) / material / facade; addr {street,no}; tags {shop,amenity,tourism,operator,brand,architect,ref:okn,wikipedia,alt_name,old_name,description,...}; startDate; heritage; wikidata; area (m2); cx,cz centroid; underground:1 for subterranean parts. Parts are linked to outlines (parent/parts/skip/coverage). Moscow Railway Station = BUILDINGS r2404499 (+ r2404500, r2404501: building=train_station).',
  '// ROADS: hw = OSM highway value (footway, pedestrian, service, steps, ...), sub = service/footway subtype, w = width (m, from width/lanes/class; Nevsky is two one-way carriageways), sidewalk/cycleway = both|left|right|yes|no, parkingLane = both|left|right + parkingOri, oneway 1/-1/0, bridge / tunnel (1 = tunnel, culvert or building passage: keep these out of the surface network) / passage (1 = building_passage, drive-through arch), layer, bus / trolley / tram = route refs that use the way (from route relations). Indoor highway=corridor ways are dropped. Sparse records omit empty fields.',
  '// AREAS = pedestrian / square / footway polygons (paving; tunnel/bridge/layer flags). WATER keeps fountains (kind "fountain") and the Fontanka polygon (kind "river"); FOUNTAINS lists fountains with centre; STREAMS = waterway lines. RIVER = [{name, kind, width (polygon area / centre-line length), length, line: [flat polylines], polys}] one per named river/canal. PITCHES duplicates the pitch/playground/stadium entries of GREEN with sport/surface.',
  '// SIGNALS traffic lights; CROSSING_NODES zebra/signal crossing nodes (CROSSINGS = crossing ways); BUS_STOPS bus/trolleybus/tram stops and platforms ({kind, bus, trolley, tram, shelter, routes:{bus,trolley,tram}}); LAMPS street lamps; CALMING humps etc.; DOORS entrance=* nodes (subway entrances excluded: see ENTRANCES); FURNITURE benches/bins/shelters/racks/...; PARKING polygons; BARRIERS lines + BARRIER_NODES.',
  '// RAILS = railway=rail/light_rail ways clipped to EXTENT ({kind, service (yard|siding|spur|crossover), usage, electrified, voltage, tracks, gauge, tunnel, bridge, layer}); RAIL_NODES = buffer stops, switches, signals, crossings; PLATFORMS = railway=platform / public_transport=platform for rail, metro and tram ({kind rail|subway|tram, ref (e.g. "6;7"), covered, height, underground, layer, polys|pts}); STATIONS = railway=station|halt|tram_stop, station=subway ({kind rail|subway|tram|halt, name, colour, ref, depth m, layer, lines[], network, wikidata}); ENTRANCES = railway=subway_entrance nodes ({name, ref, kind entrance|exit, colour, wheelchair, oh, x, z, bldg = id of the containing / nearest (<= 12 m) building outline, bldgDist}).',
  '// SUBWAY = railway=subway ways ({line = route ref, colour, route, name, tunnel, layer, service (crossover|siding), depth}); SUBWAY_ROUTES = route=subway relations ({ref, name, line, colour, from, to, stops: ordered station stop members with x,z (also outside EXTENT), segments: simplified member-way polylines for the whole line}); TRAMWAYS = railway=tram ways; TROLLEY / TRAM_ROUTES = route relations {ref, name, from, to, lines: flat polylines of the member ways clipped to EXTENT, stops: stop members inside EXTENT}; BUS_ROUTES = {ref,name,from,to} (the bus refs per road are in ROADS[].bus).',
  '// BRIDGES = man_made=bridge decks (kind "deck", polys) + bridge=yes ways (kind road|path|rail|..., layer, w, lanes, name: e.g. Anichkov Bridge); TUNNELS = tunnel=yes road/footway ways (underpasses, road tunnels); STEPS = highway=steps ways ({count, tunnel, layer, handrail, ramp}); WALLS = barrier=retaining_wall + man_made=embankment; EMBANKMENTS = man_made=embankment|quay, waterway=bank, barrier=retaining_wall with height/material (granite quays of the canals); PIERS = piers / quays / docks polygons.',
  `// PIPES = man_made=pipeline polylines as mapped (kept for compatibility, ${pipes.length} lines); MANMADE = towers/masts/flagpoles/chimneys/cabinets...; MONUMENTS = memorials/statues/artworks (inscription, description, wikidata); POIS = {id,name,nameEn,kind,sub,x,z,bldg}.`,
];
const EXPORTS = [
  ['WATER', water], ['STREAMS', streams], ['RIVER', river], ['FOUNTAINS', fountains],
  ['ROADS', roads], ['AREAS', areas], ['CROSSINGS', crossings], ['CROSSING_NODES', crossingNodes], ['STEPS', steps], ['TUNNELS', tunnels], ['BRIDGES', bridges],
  ['SIGNALS', signals], ['BUS_STOPS', stops], ['LAMPS', lamps], ['CALMING', calming], ['DOORS', doors], ['FURNITURE', furniture],
  ['RAILS', rails], ['RAIL_NODES', railNodes], ['PLATFORMS', platforms], ['STATIONS', stations], ['ENTRANCES', entrances],
  ['SUBWAY', subway], ['SUBWAY_ROUTES', subwayRoutes], ['TRAMWAYS', tramways], ['TROLLEY', routes.trolley], ['TRAM_ROUTES', routes.tram], ['BUS_ROUTES', routes.bus],
  ['GREEN', green], ['LANDUSE', landuse], ['PITCHES', pitches], ['PARKING', parking], ['TREE_ROWS', treeRows], ['TREES', trees],
  ['WALLS', walls], ['EMBANKMENTS', embankments], ['BARRIERS', barriers], ['BARRIER_NODES', barrierNodes], ['PIERS', piers], ['PIPES', pipes], ['MANMADE', structs], ['MONUMENTS', monuments], ['POIS', pois],
  ['BUILDINGS', B], ['OVERLAPS', OVERLAPS],
];
// ---- split by region: a record goes to the part of the first EXTENT rectangle (RECT_NAMES order) that contains its representative point
const NOSPLIT = new Set(['SUBWAY_ROUTES', 'TROLLEY', 'TRAM_ROUTES', 'BUS_ROUTES', 'RIVER']);   // whole-network / whole-river records: all in the first part
const PART_FILE = RECT_NAMES.map((n) => 'city-' + (n === 'OLD' ? 'east' : n.toLowerCase()) + '.js');
const bById = new Map(B.map((b) => [b.id, b]));
const inOld = (x, z) => x >= OLD_EXTENT.x0 - 0.3 && x <= OLD_EXTENT.x1 + 0.3 && z >= OLD_EXTENT.z0 - 0.3 && z <= OLD_EXTENT.z1 + 0.3;
// the region of a record: a record of the first build (any vertex inside the OLD extent: the records that were cut at its edge and are longer now stay with the old ones, in the old order),
// else the first EXTENT rectangle that contains its first vertex / x,z / centroid
function regionIdx(name, r) {
  if (name === 'OVERLAPS') { const b = bById.get(r.a); return b ? regionIdx('BUILDINGS', b) : 0; }
  const geo = []; if (r.pts && r.pts.length) geo.push(r.pts); if (r.polys) for (const p of r.polys) geo.push(p.o);
  for (const f of geo) for (let i = 0; i + 1 < f.length; i += 2) if (inOld(f[i], f[i + 1])) return 0;
  const p = geo.length ? [geo[0][0], geo[0][1]] : r.cx != null ? [r.cx, r.cz] : r.x != null ? [r.x, r.z] : null;
  if (!p) return 0;
  const g = regionOf(p[0], p[1]); const i = g ? RECT_NAMES.indexOf(g) : 0; return i < 0 ? 0 : i;
}
// ---- REGION LOCK (2026-10-07, the Vasilievsky frame): a record that exists in the PREVIOUS bake keeps its part file. Without it a record that is longer now (cut by the old edge of the union before, whole
// now) gets another first vertex, moves to the region of its far end and leaves a gap in the old file: every later record of the concatenated arrays shifts, and the streets module, whose output
// depends on the order of ROADS (lamp / pole competition along the kerbs), redrew lamps, wires and colliders in reviewed districts 2 km away (tools/streets-signature.mjs, 15 old cells).
// The previous bake is read from --lock <dir> (default: the part files in src/world/data that are about to be overwritten). A record is matched by id; when one id has several pieces (a way or a ring
// cut by the edge of the union) a new piece takes the region of the old piece with which it shares most vertices. Records that are new, pieces that match nothing, and every record of a bake
// without a previous one follow the rules above.
const lockArg = process.argv.indexOf('--lock');
const lockDir = lockArg > 0 ? path.resolve(process.argv[lockArg + 1]) : path.join(root, 'src', 'world', 'data');
const lockPart = new Map();                     // record object of this bake -> part index of its counterpart in the previous bake
const lockStats = { read: 0, locked: 0, moved: 0 };
{
  const vertKeys = (r) => { const out = []; const add = (f) => { for (let i = 0; i + 1 < f.length; i += 2) out.push(f[i] + ',' + f[i + 1]); }; if (r.pts) add(r.pts); if (r.polys) for (const p of r.polys) { add(p.o); for (const h of p.h || []) add(h); } if (!out.length && r.x !== undefined) out.push(r.x + ',' + r.z); return out; };
  const newBy = new Map();
  for (const [k, v] of EXPORTS) { if (NOSPLIT.has(k) || k === 'TREES' || k === 'OVERLAPS') continue; for (const r of v) if (r && r.id !== undefined) { const key = k + '|' + r.id; const a = newBy.get(key); if (a) a.push(r); else newBy.set(key, [r]); } }
  const oldBy = new Map();
  for (const [pi, f] of PART_FILE.entries()) {
    const file = path.join(lockDir, f); if (!fs.existsSync(file)) continue;
    const M = await import(pathToFileURL(file).href);
    for (const [k] of EXPORTS) { if (NOSPLIT.has(k) || k === 'TREES' || k === 'OVERLAPS' || !Array.isArray(M[k])) continue; for (const r of M[k]) if (r && r.id !== undefined) { const key = k + '|' + r.id; if (!newBy.has(key)) continue; lockStats.read++; const a = oldBy.get(key); if (a) a.push({ pi, r }); else oldBy.set(key, [{ pi, r }]); } }
  }
  for (const [key, olds] of oldBy) {
    const news = newBy.get(key);
    if (olds.length === 1 && news.length === 1) { lockPart.set(news[0], olds[0].pi); continue; }
    // several pieces on either side: match by shared vertices (greedy, most shared first)
    const sets = olds.map((o) => new Set(vertKeys(o.r)));
    const cand = [];
    news.forEach((n, ni) => { const vs = vertKeys(n); sets.forEach((s, oi) => { let c = 0; for (const q of vs) if (s.has(q)) c++; if (c) cand.push([c, ni, oi]); }); });
    cand.sort((x, y) => y[0] - x[0]);
    const usedN = new Set(), usedO = new Set();
    for (const [, ni, oi] of cand) { if (usedN.has(ni) || usedO.has(oi)) continue; usedN.add(ni); usedO.add(oi); lockPart.set(news[ni], olds[oi].pi); }
  }
}
function partOf(name, r) {
  if (NOSPLIT.has(name)) return 0;
  if (name === 'OVERLAPS') { const b = bById.get(r.a); return b ? partOf('BUILDINGS', b) : 0; }
  const pi = lockPart.get(r);
  if (pi !== undefined) { lockStats.locked++; if (pi !== regionIdx(name, r)) lockStats.moved++; return pi; }
  // An extension must not move reviewed late roads into its new last region:
  // preserving their previous part keeps existing road indices/seeds stable.
  if (name === 'ROADS' && r.late) return RECT_NAMES.length - 1;
  return regionIdx(name, r);
}
const parts = RECT_NAMES.map(() => ({}));       // part index -> { EXPORT: records[] }
for (const [k, v] of EXPORTS) {
  for (const P of parts) P[k] = [];
  if (k === 'TREES') { for (let i = 0; i < v.length; i += 2) { const g = regionOf(v[i], v[i + 1]); const pi = Math.max(0, RECT_NAMES.indexOf(g)); parts[pi][k].push(v[i], v[i + 1]); } }
  else for (const r of v) parts[partOf(k, r)][k].push(r);
}
const j2 = (v) => `JSON.parse(${JSON.stringify(j(v))})`;                       // JSON.parse of a string literal parses ~2x faster than the same object literal
const outArg = process.argv.indexOf('--out');                                   // --out <dir>: write the files somewhere else (test bakes: the engine reads src/world/data)
const outDir = outArg > 0 ? path.resolve(process.argv[outArg + 1]) : path.join(root, 'src', 'world', 'data'); fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (/^city(-.*)?\.js$/.test(f)) fs.rmSync(path.join(outDir, f));
const files = [];
PART_FILE.forEach((f, i) => {
  const lines = [`// GENERATED by tools/bake-osm.mjs (part ${i + 1}/${PART_FILE.length} of src/world/data/city.js, region ${RECT_NAMES[i]}: see the header of city.js) - OpenStreetMap data (c) OpenStreetMap contributors, ODbL`];
  for (const [k] of EXPORTS) if (i === 0 || !NOSPLIT.has(k)) lines.push(`export const ${k} = ${j2(parts[i][k])};`);
  fs.writeFileSync(path.join(outDir, f), lines.join('\n') + '\n'); files.push(f);
});
const SPLIT = EXPORTS.filter(([k]) => !NOSPLIT.has(k)).map(([k]) => k);
const REGIONS = RECT_NAMES.map((n, i) => ({ name: n, file: PART_FILE[i], playRect: PLAY_RECTS[i], extentRect: EXTENT_RECTS[i] }));
const facade = [
  ...HEADER,
  ...PART_FILE.map((f, i) => `import * as P${i} from './${f}';`),
  `export const ORIGIN = ${j(ORIGIN)};`,
  `export const PLAY = ${j(PLAY)};`,
  `export const EXTENT = ${j(EXTENT)};`,
  `export const PLAY_RECTS = ${j(PLAY_RECTS)};`,
  `export const EXTENT_RECTS = ${j(EXTENT_RECTS)};`,
  `export const RECT_NAMES = ${j(RECT_NAMES)};`,
  `export const REGIONS = ${j(REGIONS)};`,
  `export { ${[...NOSPLIT].join(', ')} } from './${PART_FILE[0]}';`,
  ...SPLIT.map((k) => `export const ${k} = P0.${k}.concat(${PART_FILE.slice(1).map((_, i) => `P${i + 1}.${k}`).join(', ')});`),
  '',
];
fs.writeFileSync(path.join(outDir, 'city.js'), facade.join('\n')); files.push('city.js');
for (const f of files) console.log(`wrote src/world/data/${f} (${(fs.statSync(path.join(outDir, f)).size / 1024).toFixed(0)} KB)`);
console.log(`region lock: ${lockStats.read} records of the previous bake in ${lockDir} found again; ${lockStats.locked} records kept their part file, ${lockStats.moved} of them would have moved by the geometric rule`);
console.log('records per part (BUILDINGS / ROADS / POIS / TREES):', RECT_NAMES.map((n, i) => `${n}: ${parts[i].BUILDINGS.length} / ${parts[i].ROADS.length} / ${parts[i].POIS.length} / ${parts[i].TREES.length / 2}`).join(' | '));
console.log(counts); console.log(counts2); console.log(counts3); console.log(zf, dupRoads.slice(0, 5));
console.log('height coverage, visible buildings+parts:', j(statAll), '\n  outlines:', j(statOutl), '\n  parts:', j(statParts), '\n  other fields:', j(named));
