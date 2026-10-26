// environment/river.js - the geometry of the waterways for the builders (ground holes, water meshes, quay walls, field water mask, far scene). Built on waterways.js
// (stitched bank chains, the real Neva scenery of data/east-water.js), which is pure data shared with layout.js.
//   * riverBanks()    the bank chains of the FONTANKA (compat: landmarksC/closure.js re-derives the quay pieces beside the Anichkov Bridge from them), { name, pts, landSide, ... }
//   * waterBanks(key) bank chains of one waterway (or all)
//   * waterCuts()     the convex pieces (triangles, the Neva scenery clipped outside the EXTENT rectangles) of every water body: { key, y, poly, box }: the ground is cut by them, the
//                     water meshes are clipped by them
//   * waterPolys()    flat rings for the rasterising field
//   * waterRings()    the water bodies as rings (far.js keeps its blocks off them)
//   * deckPoly()      the Anichkov Bridge deck polygon r5537267 (claimed by landmarksC): the quay leaves the parapet / collider open there
//   * bridgeZones()   every bridge crossing of the quay (BRIDGE_ZONES rows + the decks over the castle moat)
import { BRIDGES, ROADS } from '../data/city.js';
import { WATERWAYS, BRIDGE_ZONES, DATA_RECTS, FAR_WIN, allBanks, banksOf, waterPieces, slopeQuads } from './waterways.js';
import { SITES, toWorld as siteToWorld, inDeck as siteInDeck } from '../bridges/sites.js';
import { triangulateRing, subtractConvex, clipHalf, ccw, boxOfPoly } from './clip.js';

/** the bank chains of the Fontanka (water on the left of travel; landSide -1 = the landward normal is (tz, -tx)) */
export const riverBanks = () => banksOf('fontanka').filter((b) => b.len > 60);
export const waterBanks = (key) => (key ? banksOf(key) : allBanks());

let _cuts = null;
export function waterCuts() {
  if (_cuts) return _cuts;
  const rectPoly = (r) => ccw([[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]]), data = DATA_RECTS.map(rectPoly), win = rectPoly(FAR_WIN);
  const cuts = [];
  for (const p of waterPieces()) {
    const y = WATERWAYS[p.key].water;
    for (const tri of triangulateRing(p.o)) {
      let pieces = [tri];
      if (p.excludeData) {                                         // the Neva scenery: only outside the data region (the data polygons rule inside it) and inside the window of the far scenery
        for (const r of data) { pieces = subtractConvex(pieces, r); if (!pieces.length) break; }
        pieces = pieces.map((q) => { for (let k = 0; k < 4 && q.length >= 3; k++) q = clipHalf(q, win[k], win[(k + 1) % 4], true); return q; });
      }
      for (const poly of pieces) { if (poly.length < 3) continue; cuts.push({ key: p.key, y, poly: ccw(poly), box: boxOfPoly(poly), kind: p.kind }); }
    }
  }
  for (const sq of slopeQuads()) cuts.push({ key: sq.key, y: WATERWAYS[sq.key].water, poly: ccw(sq.q), box: boxOfPoly(sq.q), kind: 'slope' });     // the grass slopes of the Swan Canal / the Moika: the ground is cut away over them, no water there
  return (_cuts = cuts);
}
/** the water as flat convex polygons { id, key, kind, o, h: [] } for the rasterising field: exactly the area that the ground is cut by (the Neva scenery only outside the data) */
export const waterPolys = () => waterCuts().filter((c) => c.kind !== 'slope').map((c, i) => ({ id: 'w' + i, key: c.key, kind: c.kind, o: c.poly.flat(), h: [] }));
/** the water bodies as rings (data pieces, plugs, continuations, the Neva scenery ring): far.js keeps its blocks off them */
export const waterRings = () => waterPieces().map((p) => ({ id: p.id, key: p.key, kind: p.kind, o: p.o }));
/** the Anichkov Bridge deck polygon (OSM relation r5537267, claimed by landmarksC) as a flat ring, or null */
export function deckPoly() {
  const b = BRIDGES.find((d) => d.id === 'r5537267');
  return b && b.polys && b.polys[0] ? b.polys[0].o : null;
}

// zone id of BRIDGE_ZONES -> id of the bridge in the bridges module's sites.js (bridges/sites.js keeps the ~24 sites of the strip)
const SITE_OF = { belinsky: 'belinsky', kazansky: 'kazansky', green: 'green', pevchesky: 'pevchesky', red: 'red', blue: 'blue', 'novo-konyushenny': 'novo', hermitage: 'hermitage', 'zimny-1': 'zimny1', 'zimny-2': 'zimny2', bankovsky: 'bankovsky', muchnoy: 'mucny', italyansky: 'italyansky',
  // the Mars Field / Summer Garden reach inside the extent margin
  'swan-lower': 'swan-lower', panteleymonovsky: 'panteleymonovsky', eng1: 'eng1', garden1: 'garden1', garden2: 'garden2', 'bolshoy-konyushenny': 'bolsh-konyushenny', teatralny: 'teatralny', 'malo-konyushenny': 'malo-konyushenny',
  kamenny: 'kamenny', pochtamtsky: 'pochtamtsky', fonarny: 'fonarny',
  // the south-west reach (Admiralty-Haymarket; zone id = site id, bridges/sites-sw.js): the sites of an area that does not list these zones are filtered out by sites.js siteInArea, so the rows are inert elsewhere
  demidov: 'demidov', sennoy: 'sennoy', kokushkin: 'kokushkin', voznesensky: 'voznesensky', podyachesky: 'podyachesky', lviny: 'lviny', kharlamov: 'kharlamov', 'novo-nikolsky': 'novo-nikolsky', pikalov: 'pikalov', krasnogvardeysky: 'krasnogvardeysky',
  'staro-nikolsky': 'staro-nikolsky', mogilevsky: 'mogilevsky', kashin: 'kashin', torgovy: 'torgovy', dekabristov: 'dekabristov', matveev: 'matveev', krasnoflotsky: 'krasnoflotsky', potseluev: 'potseluev', khrapovitsky: 'khrapovitsky',
  krushtein1: 'krushtein1', krushtein2: 'krushtein2', admiralteysky: 'admiralteysky', obukhovsky: 'obukhovsky', izmailovsky: 'izmailovsky' };
let _zones = null;
/** Every bridge crossing of the quay: { id, name, key (waterway), c: [x, z] (middle of the deck), axis (compass deg of the road), w (deck width along the water), len, own (a bridge the bridges module draws),
 *  foot, test(x, z, grow) (a point lies in the gap of the quay) }. The bridges module's sites.js (the real decks) wins over the dossier table where both exist. */
export function bridgeZones() {
  if (_zones) return _zones;
  const out = [];
  for (const z of BRIDGE_ZONES) {
    const site = SITES.find((s) => s.id === SITE_OF[z.id]);
    if (site) {
      const mid = (site.v0 + site.v1) / 2, c = siteToWorld(site, 0, mid), foot = site.kind === 'foot';
      const pad = z.pad || 0;      // a zone row may widen the opening (asphalt flares of a bridge mouth that run to the wall beside the deck)
      out.push({ id: z.id, name: z.name, key: z.key, c: [c.x, c.z], axis: site.b, w: site.v1 - site.v0 + 2 * pad, len: z.len, own: true, foot, site, test: (x, zz, grow = 0) => siteInDeck(site, x, zz, 30, grow + pad + (foot ? 0.8 : 0.0)) });
    } else {
      const a = z.axis * Math.PI / 180, ux = Math.sin(a), uz = -Math.cos(a), hl = z.len / 2 + 14, hw = z.w / 2;
      out.push({ id: z.id, name: z.name, key: z.key, c: z.c, axis: z.axis, w: z.w, len: z.len, own: z.own && z.id !== 'anichkov', foot: false, test: (x, zz, grow = 0) => { const px = x - z.c[0], pz = zz - z.c[1], u = px * ux + pz * uz, v = -px * uz + pz * ux; return Math.abs(u) <= hl + grow && Math.abs(v) <= hw + grow; } });
    }
  }
  for (const z of moatBridgeZones()) out.push(z);
  for (const z of nhBridgeZones()) out.push(z);
  // the southern Fontanka decks (bridges/sites-south.js, site.south): the opening is the owner's deck frame (|u| <= 30 along the water, 60 m of quay), as in the source project
  for (const site of SITES.filter((s) => s.south)) {
    const foot = site.kind === 'foot';
    out.push({ id: site.id, name: site.name, key: site.ww, c: [site.cx, site.cz], axis: site.b, w: site.v1 - site.v0, len: 60, own: true, foot, site, test: (x, z, grow = 0) => siteInDeck(site, x, z, 30, grow + (foot ? 0.4 : 0)) });
  }
  return (_zones = out);
}

/** The decks over the castle moat (key 'moat'): every mapped bridge road piece (OSM bridge=yes, 2.4 - 7.2 m wide) inside the moat's window; landmarksCastle (Three-part bridge, footbridges) and the 2nd Engineer bridge draw them: the quay only leaves its
 *  wall / collider open under them (auto zone, test = distance to the polyline < half width + 3 m). No splits, no fallback deck. */
let _moatZones = null, _nhZones = null;
function moatBridgeZones() { return _moatZones || (_moatZones = windowBridgeZones('moat', [-800, -600, -885, -795], 'moat-')); }
/** the footbridges over the inner canals of New Holland (drawn by landmarksNewHolland): bridge=yes roads inside the island's canal window (the window is empty in every other area's data) */
function nhBridgeZones() { return _nhZones || (_nhZones = windowBridgeZones('nh-inner', [-3460, -3250, 265, 475], 'nh-')); }
function windowBridgeZones(key, win, prefix) {
  const out = [];
  for (const r of ROADS) {
    if (!r.bridge || r.tunnel || r.pts.length < 4) continue;
    const pts = r.pts, n = pts.length / 2;
    let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9; for (let i = 0; i < n; i++) { bx0 = Math.min(bx0, pts[i * 2]); bx1 = Math.max(bx1, pts[i * 2]); bz0 = Math.min(bz0, pts[i * 2 + 1]); bz1 = Math.max(bz1, pts[i * 2 + 1]); }
    if (bx0 < win[0] || bx1 > win[1] || bz0 < win[2] || bz1 > win[3]) continue;
    const hw = (r.w || 4) / 2 + 3, cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2, diag = Math.hypot(bx1 - bx0, bz1 - bz0) + 2 * hw;
    const test = (x, z, grow = 0) => {
      if (x < bx0 - hw - grow || x > bx1 + hw + grow || z < bz0 - hw - grow || z > bz1 + hw + grow) return false;
      for (let i = 0; i + 3 < pts.length; i += 2) { const ax = pts[i], az = pts[i + 1], dx = pts[i + 2] - ax, dz = pts[i + 3] - az, l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)); if (Math.hypot(ax + dx * t - x, az + dz * t - z) < hw + grow) return true; }
      return false;
    };
    out.push({ id: prefix + r.id, name: r.name || r.id, key, c: [cx, cz], axis: 0, w: diag, len: 0, own: true, foot: false, auto: true, test });
  }
  return out;
}
