// streets/paths.js - mapped footways / paths / steps (ROADS hw footway, path, steps, pedestrian) and the pedestrian-area paving (AREAS)
// that is not claimed by a landmark module. Ordinary ground uses flat ribbons;
// natural park banks use terrain triangles, with water and bridge decks clear.
import { pairs, chaikin, densify, dpKeep } from './util.js';
import { ROADS, CROSSINGS, AREAS } from '../data/city.js';
import { profMax } from './style.js';
import * as THREE from 'three';
import { addCap } from '../lib/massing.js';
import { SLAB_TILE, PAVER_TILE, ASPHALT_TILE, BRICK_TILE } from './tex.js';
import { deckAt, deckRings } from './decks.js';
import { triangulateRing, subtractConvex, ccw, boxOfPoly } from '../environment/clip.js';
import { WATER as WATER_TABLE } from '../lib/area-tables.js';
import { heightAt, WATERWAYS } from '../layout.js';
import { terrainRibbon } from './terrain-ribbon.js';
import { slopeGroundHeightAt } from '../environment/waterways.js';

const FOOT_W = { footway: 2.4, path: 1.8, pedestrian: 5, steps: 2.2, cycleway: 2.2 };
export const PATH_Y = 0.04;

/** mitred ribbon along a polyline [[x,z],...] of width w at height y; uv = metres / tile */
export function ribbon(B, pts, w, y, tile = 2, col = null) {
  const hw = w / 2;
  let prev = null;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const nx = -tz, nz = tx, x = pts[i][0], z = pts[i][1];
    const lx = x - nx * hw, lz = z - nz * hw, rx = x + nx * hw, rz = z + nz * hw;
    const va = B.vert(lx, y, lz, lx / tile, lz / tile, undefined, col), vb = B.vert(rx, y, rz, rx / tile, rz / tile, undefined, col);
    if (prev) B.quad(prev[0], prev[1], vb, va);
    prev = [va, vb];
  }
}

/** surface class of a mapped footway -> [builder key, uv tile]: compacted / gravel / ground = pink-tan gravel (Alexander Garden, the Neva gardens), asphalt = asphalt, in the west (x < -595: the granite city)
 *  paving_stones / paved / unknown = grey granite slabs like the pavements, sett = granite pavers; the old east keeps the red-brown block paving of its courtyards (streets.md) */
const GRAVEL = new Set(['compacted', 'fine_gravel', 'gravel', 'ground', 'dirt', 'unpaved', 'pebblestone', 'sand']);
function footClass(r) {
  const sf = r.surface;
  if (GRAVEL.has(sf)) return ['gravel', 2];
  if (sf === 'asphalt') return ['asph', ASPHALT_TILE];
  if (r.pts[0] < -595 && sf !== 'wood' && sf !== 'building_passage') return sf === 'sett' ? ['paver', PAVER_TILE] : ['slab', SLAB_TILE];
  return ['brick', BRICK_TILE];
}

/** Is (x, z) inside the pavement band that walks.js lays beside a ranked street? The nearest ranked way (nearestWay(net, x, z, 9, 1), the smallest distance beyond the asphalt edge) decides:
 *  not a bridge, outside its asphalt (off > -0.1) and within the nominal pavement width + 0.6 m. Same answer as nearestWay, but a plain scan of the segment grid without the per-segment
 *  allocations (it ran for every 2.5 m sample of every mapped footway: 1.2 s of the build). */
function inPavementBand(net, px, pz) {
  const c = net.cell, st = ++net.stamp, R = 9 + 14;
  const x0 = Math.floor((px - R) / c), x1 = Math.floor((px + R) / c), z0 = Math.floor((pz - R) / c), z1 = Math.floor((pz + R) / c);
  let best = 1e9, bw = null;
  for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
    const list = net.grid.get((cx + 300) * 2048 + (cz + 300)); if (!list) continue;
    for (let q = 0; q < list.length; q++) {
      const e = list[q]; if (e.st === st) continue; e.st = st;
      const w = e.w; if (w.rank < 1) continue;
      const ax = e.ax, az = e.az, dx = e.dx, dz = e.dz, l2 = e.l2;
      let t = l2 < 1e-12 ? 0 : ((px - ax) * dx + (pz - az) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = px - (ax + dx * t), ez = pz - (az + dz * t), d2 = ex * ex + ez * ez;
      const h = (ex * -dz + ez * dx) > 0 ? e.hR0 + (e.hR1 - e.hR0) * t : e.hL0 + (e.hL1 - e.hL0) * t;       // (the side of the segment's own normal, as segInfo)
      const lim = 9 + h; if (d2 > lim * lim) continue;                                                        // off > 9: nearestWay ignores it
      const off = Math.sqrt(d2) - h;
      if (off < best) { best = off; bw = w; }
    }
  }
  return !!bw && !bw.bridge && best > -0.1 && best < profMax(bw) + 0.6;
}

/** mapped footways / paths / steps as ribbons; the parts that lie on a carriageway (crossing ways, pavements mapped on the road edge) are left out because the
 *  zebra and the sidewalk generator draw those. Returns the centrelines for the pedestrian service. */
export function buildPaths(Bfoot, Bsteps, net, X = {}, owned = () => false) {
  const lines = [];
  const region=WATER_TABLE.naturalShoreRegion, heights=new Map();let terrainCuts=null;
  const ground=(x,z)=>{const key=x+','+z;if(!heights.has(key))heights.set(key,slopeGroundHeightAt(x,z)??heightAt(x,z));return heights.get(key);};
  const waterY=region?Math.max(...WATER_TABLE.slopeReaches.filter(r=>r.continuous).map(r=>WATERWAYS[r.key].water)):0;
  // Named squares already have one paving surface. Do not draw lower path
  // ribbons under it: differing slope-based depth offsets make them bleed
  // through at grazing angles. Keep the complete path for pedestrian routing.
  const squares = AREAS.filter(a => a.hw === 'square' && !a.tunnel && !a.bridge).flatMap(a => a.polys);
  const ringHas = (o, x, z) => {
    let inside = false;
    for (let i = 0, j = o.length-2; i < o.length; j=i, i+=2)
      if ((o[i+1]>z)!==(o[j+1]>z) && x<(o[j]-o[i])*(z-o[i+1])/(o[j+1]-o[i+1])+o[i]) inside=!inside;
    return inside;
  };
  const inSquare = p => squares.some(q => ringHas(q.o,p[0],p[1]) && !q.h.some(h => ringHas(h,p[0],p[1])));
  const cross = new Set(CROSSINGS.map((c) => c.id));
  for (const r of ROADS) {
    if (!(r.hw in FOOT_W) || r.tunnel || r.layer < 0 || r.bridge || cross.has(r.id) || r.sub === 'crossing') continue;
    let pts = pairs(r.pts); if (pts.length < 2) continue;
    if (pts.length > 2) pts = chaikin(pts, 1, 60);
    pts = densify(pts, 2.5);
    const natural=region&&pts.some(p=>region(p[0],p[1]));
    const w = r.w ?? FOOT_W[r.hw];
    // split into runs outside the asphalt
    let run = [];
    const flush = () => {
      // a path claimed by a landmark module (owned) and the parts inside a named square are not drawn here (the square / the module owns the surface); the complete line stays for pedestrian routing
      const drawRun = (sub, steps) => {
        if(natural&&!steps) {
          if(!terrainCuts)terrainCuts=deckRings().map(d=>{const poly=ccw(pairs(d.ring));return{poly,box:boxOfPoly(poly)};});
          const [fk,ft]=footClass(r),FB=X[fk]||Bfoot;
          terrainRibbon(FB,sub,w,PATH_Y+.001*(parseInt(String(r.id).replace(/D/g,'').slice(-3),10)%9),FB===Bfoot?2:ft,{heightAt:ground,waterY,cuts:terrainCuts});
          return;
        }
        if (sub.length > 2 && !steps) { const kp = dpKeep([sub], 0.05); sub = sub.filter((_, i) => kp[i]); }          // the 2.5 m samples were only for the clipping tests: draw straight pieces as single quads
        if (sub.length < 2) return;
        if (steps) ribbon(Bsteps, sub, w, PATH_Y + 0.05, 1.5);
        else { const [fk, ft] = footClass(r), FB = X[fk] || Bfoot; ribbon(FB, sub, w, PATH_Y + 0.001 * (parseInt(String(r.id).replace(/D/g, '').slice(-3), 10) % 9), FB === Bfoot ? 2 : ft); }   /* QA: mapped footways overlap each other at forks / crossings: 0..8 mm apart per way */
      };
      if (run.length >= 2) {
        const steps = r.hw === 'steps';
        if (!owned(r.id)) {
          let visible = [];
          for (const p of run) { if ((!(natural&&!steps)&&deckAt(p[0],p[1],w/2)) || (!steps && inSquare(p))) { drawRun(visible, steps); visible = []; } else visible.push(p); }
          drawRun(visible, steps);
        }
        if (!steps) lines.push({ id: r.id, pts: run, w, hw: r.hw });
      }
      run = [];
    };
    for (const p of pts) {
      // on a carriageway, or inside the pavement band that walks.js lays beside a street: the pavement already covers it
      let skip = net.cover(p[0], p[1], { noFillets: false }) > Math.min(0.2, 0.05 - w / 2);                  // no part of the ribbon (half its width) on asphalt
      if (!skip) skip = inPavementBand(net, p[0], p[1]);
      if (skip) flush(); else run.push(p);
    }
    flush();
  }
  return lines;
}

const ROAD_AREA = new Set(['primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'service', 'living_street']);
const allIn = (o, inside) => { for (let i = 0; i < o.length; i += 2) if (!inside(o[i], o[i + 1])) return false; return true; };
const SCRAP = 1.0;                                       // m2: a carved piece of a raised polygon smaller than this is a scrap (capCarved)
const WALL_CLEAR = 0.3;                                // a wall stands this far outside the asphalt edge at least (the kerb stone is 0.2 m wide + 0.1 m): inside that band the kerb is the face
const ringBox = (o) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < o.length; i += 2) { x0 = Math.min(x0, o[i]); x1 = Math.max(x1, o[i]); z0 = Math.min(z0, o[i + 1]); z1 = Math.max(z1, o[i + 1]); } return [x0, x1, z0, z1]; };
const pointInRing = (o, x, z) => { let ins = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) { const xi = o[i], zi = o[i + 1], xj = o[j], zj = o[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } return ins; };
const ringArea = (o) => { let a = 0; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) a += o[j] * o[i + 1] - o[i] * o[j + 1]; return a / 2; };

/** AREAS polygons that no landmark module owns (squares, pedestrian paving, traffic islands, area:highway road surfaces).
 *  Layers (every height used once per overlapping stack, so two polygons never share a plane: the Isaac's Square / Blue Bridge plaza flickered because a footway polygon and the square lay at
 *  the same 0.10):  squares (hw 'square': the whole square INCLUDING its carriageways, flush paving, no skirt) 0.012 < road areas 0.02 < the asphalt ribbons 0.03 < raised paving of footways /
 *  pedestrian areas 0.10 (+ 0.004 per larger polygon it lies in, a vertical edge down to the ground, 2 cm under the pavements which sit at 0.12) < traffic islands 0.15 (granite-kerbed paving).
 *  B = { road, slab, paver, island } MeshBuilders, skirt = MB with vertex colour. net (optional): the raised paving and the islands are carved out where a carriageway runs (a footway polygon
 *  mapped across a courtyard road, an island that the mapped lanes cross): the asphalt of every drivable road stays the visible surface; without net the polygons are drawn whole.
 *  Walls (skirts) stand only where the outline borders bare ground: never on a carriageway or in the kerb band (WALL_CLEAR), cut exactly along each edge. Carving scraps (pieces < SCRAP m2) are dropped.
 *  inOwned(x, z) (optional): true inside an area a landmark module owns; a traffic island whose whole outline is inside one is not drawn (the owner paves it flush: Vosstaniya Square). */
export function buildAreas(B, AREAS, skip, skirt, net, inOwned = null) {
  let n = 0;
  const clear = net ? clearCells(net) : null;
  const decks=deckRings({longOnly:true}).map(d=>({ring:d.ring,box:ringBox(d.ring),tris:null}));
  const offDeck = p => {
    const box=ringBox(p.o), cuts=decks.filter(d=>!(d.box[1]<box[0]||d.box[0]>box[1]||d.box[3]<box[2]||d.box[2]>box[3]));
    if(!cuts.length)return[p];
    let pieces=triangulateRing(p.o,p.h||[]);
    for(const d of cuts)for(const t of(d.tris??=triangulateRing(d.ring)))pieces=subtractConvex(pieces,t);
    return pieces.map(o=>({o:o.flat(),h:[]}));
  };
  const cap = (MB, p, y, uvScale, fine = 2, carveRoad=true) => { for(const q of offDeck(p)) { if (net&&carveRoad) capCarved(MB, q, y, uvScale, (x, z) => net.cover(x, z), clear, fine); else addCap(MB, q, y, { uvScale }); } };
  // The wall under the edge of a raised polygon is drawn only where it stands beside bare ground: the parts of an outline edge that lie on a carriageway or inside the kerb band (the asphalt
  // edge + WALL_CLEAR) are cut away exactly (bisection on net.cover), because the road's own kerb is the face there. The old rule asked only the MIDDLE of a whole edge: a 10 m chord of the
  // Vosstaniya Square island ran over the asphalt, across the kerb and on through the paving as a pale 0.4 m "ribbon" (2026-10-07), long footway-polygon edges crossed whole streets.
  const wallRuns = (ax, az, bx, bz, l) => {
    const free = (t) => {const x=ax+(bx-ax)*t,z=az+(bz-az)*t;return !deckAt(x,z,.4)&&(!net||net.cover(x,z)<=-WALL_CLEAR);};
    const m = Math.max(1, Math.ceil(l / 0.5)), runs = [];
    const cut = (ta, tb, fa) => { let lo = ta, hi = tb; for (let it = 0; it < 9; it++) { const mid = (lo + hi) / 2; if (free(mid) === fa) lo = mid; else hi = mid; } return (lo + hi) / 2; };
    let prev = free(0), start = prev ? 0 : -1;
    for (let k = 1; k <= m; k++) {
      const t = k / m, f = free(t);
      if (f !== prev) { const e = cut((k - 1) / m, t, prev); if (f) start = e; else { runs.push([start, e]); start = -1; } prev = f; }
    }
    if (prev && start >= 0) runs.push([start, 1]);
    return runs.filter(([a, b]) => (b - a) * l >= 0.12);
  };
  const wall = (ring, top, col, ccw) => {
    for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
      const ax = ring[j], az = ring[j + 1], bx = ring[i], bz = ring[i + 1], l = Math.hypot(bx - ax, bz - az); if (l < 0.05) continue;
      let nx = (bz - az) / l, nz = -(bx - ax) / l; if (!ccw) { nx = -nx; nz = -nz; }
      for (const [t0, t1] of wallRuns(ax, az, bx, bz, l)) {
        const px = ax + (bx - ax) * t0, pz = az + (bz - az) * t0, qx = ax + (bx - ax) * t1, qz = az + (bz - az) * t1;
        const v0 = skirt.vert(px, 0, pz, 0, 0, [nx, 0, nz], col), v1 = skirt.vert(qx, 0, qz, 1, 0, [nx, 0, nz], col), v2 = skirt.vert(qx, top, qz, 1, 0.1, [nx, 0, nz], col), v3 = skirt.vert(px, top, pz, 0, 0.1, [nx, 0, nz], col);
        skirt.quad(v0, v1, v2, v3, [nx, 0, nz]);
      }
    }
  };
  const list = [];
  for (const a of AREAS) {
    if (skip(a.id) || a.tunnel || a.bridge) continue;
    const isRoad = ROAD_AREA.has(a.hw), isIsland = a.hw === 'traffic_island', isSquare = a.hw === 'square';
    for (const p of a.polys) {
      // A traffic island whose whole outline lies inside an area a landmark module owns (the paved square w638352776: the five refuges of Vosstaniya Square) is paved by that owner, flush
      // with the rest of the square: no raised cap of ours. The mapped outline is smaller than the refuge that the kerb ring encloses, so the cap ended in a chord inside the kerbs (a step
      // wall across flat paving of the same pattern) and left bare strips beside the kerb: two surfaces for one island that could not agree.
      if (isIsland && inOwned && p.o.length >= 6 && allIn(p.o, inOwned)) continue;
      list.push({ a, p, isRoad, isIsland, isSquare, area: Math.abs(ringArea(p.o)), box: ringBox(p.o), level: 0 });
    }
  }
  // raised polygons: lift a polygon 4 mm per larger raised polygon that contains one of its points (overlaps of mapped footways)
  const raised = list.filter((e) => !e.isRoad && !e.isIsland && !e.isSquare).sort((p, q) => q.area - p.area);
  raised.forEach((e, i) => {
    let lvl = 0;
    for (let k = 0; k < i; k++) {
      const o = raised[k]; if (e.box[0] > o.box[1] || e.box[1] < o.box[0] || e.box[2] > o.box[3] || e.box[3] < o.box[2]) continue;
      const q = e.p.o; let inside = false;
      for (let t = 0; t < q.length && !inside; t += 2) inside = pointInRing(o.p.o, q[t], q[t + 1]);
      if (inside) lvl = Math.max(lvl, o.level + 1);
    }
    e.level = Math.min(lvl, 3);
  });
  for (const e of list) {
    const { a, p } = e;
    if (e.isRoad) { cap(B.road,p,0.02,8,2,false); }
    else if (e.isIsland) { cap(B.island, p, 0.15, 1.6, 2); wall(p.o, 0.15, [0.62, 0.61, 0.6], ringArea(p.o) > 0); }
    else if (e.isSquare) { cap(B.slab,p,0.012,2.8,2,false); }
    else {
      const slab = a.surface === 'sett', y = 0.10 + 0.004 * e.level;
      cap(slab ? B.slab : B.paver, p, y, slab ? 2.8 : 1.6);
      wall(p.o, y, [0.55, 0.54, 0.52], ringArea(p.o) > 0);
      for (const h of p.h) wall(h, y, [0.55, 0.54, 0.52], ringArea(h) < 0);
    }
    n++;
  }
  return n;
}

/** Drive-through arches and passages (ROADS tunnel + passage: building gateways to the courtyards): the surface continues under the house as a drawn ribbon of granite pavers
 *  (y 0.02, under the service asphalt at 0.03: the ribbon must not show on the road outside the arch; the arch is hollow), 3.2-4.2 m wide for vehicles, the mapped width for footways. B = MB with the paver material. */
export function buildPassages(B, tile = 1.6) {
  let n = 0;
  for (const r of ROADS) {
    if (!r.tunnel || !r.passage || r.layer < 0) continue;
    let pts = pairs(r.pts); if (pts.length < 2) continue;
    pts = densify(pts, 3);
    const w = r.hw === 'service' ? Math.max(3.4, Math.min(r.w || 4, 4.4)) : (r.w || 2.4);
    ribbon(B, pts, w, 0.02, tile); n++;
  }
  return n;
}

/** clear(x, z): true when (x, z) certainly lies off every carriageway, fillet and parking pocket (net.cover(x, z) <= -0.1), decided per 8 m cell and cached: the cell is clear when no
 *  segment of the network comes within (its widest half width + 0.1 m) of the cell (centre distance - the cell's half diagonal) and no fillet box touches it. A false answer says nothing (the caller
 *  asks net.cover). Same decisions as calling net.cover for every sample, a fraction of the work: most of a polygon's lattice lies far from any road. */
function clearCells(net) {
  const CS = 8, RHO = CS * Math.SQRT1_2 + 0.01, cache = new Map(), fil = new Set();
  for (const f of net.fillets) for (let cx = Math.floor(f.box[0] / CS); cx <= Math.floor(f.box[1] / CS); cx++) for (let cz = Math.floor(f.box[2] / CS); cz <= Math.floor(f.box[3] / CS); cz++) fil.add(cx * 65536 + cz);
  return (x, z) => {
    const cx = Math.floor(x / CS), cz = Math.floor(z / CS), key = cx * 65536 + cz;
    let v = cache.get(key);
    if (v === undefined) {
      v = !fil.has(key);
      if (v) {
        const mx = (cx + 0.5) * CS, mz = (cz + 0.5) * CS;
        net.each(mx, mz, RHO + 1, (w, i) => {
          if (!v) return;
          const ax = w.x[i], az = w.z[i], dx = w.x[i + 1] - ax, dz = w.z[i + 1] - az, l2 = dx * dx + dz * dz;
          let t = l2 < 1e-12 ? 0 : ((mx - ax) * dx + (mz - az) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
          const ex = mx - (ax + dx * t), ez = mz - (az + dz * t), D = Math.sqrt(ex * ex + ez * ez);
          const hm = Math.max(w.hL[i], w.hL[i + 1], w.hR[i], w.hR[i + 1]);
          if (D - RHO < hm + 0.1) v = false;
        });
      }
      cache.set(key, v);
    }
    return v;
  };
}

/** A polygon cap without the parts that lie on a carriageway: every triangle is sampled on a 2 m lattice; one that is wholly on asphalt is dropped, one that is wholly clear is kept, and one
 *  that straddles a road edge is split (longest edge first) down to 2 m edges, the pieces whose middle or a corner lies on asphalt are dropped. cover(x, z) = how far inside the asphalt (net.cover,
 *  negative = outside). Same vertex layout as addCap (flat, up-facing, uv = metres / uvScale). */
function capCarved(B, poly, y, uvScale, cover, clear, fine = 2) {
  const ring = (f) => { const r = []; for (let i = 0; i < f.length; i += 2) r.push([f[i], f[i + 1]]); return r; };
  const outer = ring(poly.o), holes = poly.h.map(ring).filter((h) => h.length >= 3);
  if (outer.length < 3) return;
  const v2 = (p) => new THREE.Vector2(p[0], p[1]);
  const tris = THREE.ShapeUtils.triangulateShape(outer.map(v2), holes.map((h) => h.map(v2)));
  const pts = outer.concat(...holes);
  const acc = [];
  const emit = (a, b, c) => { acc.push([a, b, c]); };           // (collected: the scraps are dropped before anything is written, see below)
  const place = (a, b, c) => {
    const flip = (b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1]) > 0;
    const v = (p) => B.vert(p[0], y, p[1], 0, 1, 0, p[0] / uvScale, p[1] / uvScale);
    const i = v(a), j = v(b), k = v(c);
    if (flip) B.tri(i, k, j); else B.tri(i, j, k);
  };
  const walk = (a, b, c, depth) => {
    const edges = [[a, b], [b, c], [c, a]].map(([p, q]) => [Math.hypot(p[0] - q[0], p[1] - q[1]), p, q]).sort((p, q) => q[0] - p[0]);
    const e = edges[0][0], n = Math.max(1, Math.ceil(e / fine));
    let on = 0, off = 0;
    for (let i = 0; i <= n && !(on && off); i++) for (let j = 0; i + j <= n; j++) {        // (only whether both kinds occur matters: stop at the first of each)
      const u = i / n, v = j / n, w = 1 - u - v, x = a[0] * w + b[0] * u + c[0] * v, z = a[1] * w + b[1] * u + c[1] * v;
      if (!(clear && clear(x, z)) && cover(x, z) > -0.1) on++; else off++;
      if (on && off) break;
    }
    if (!on) { emit(a, b, c); return; }
    if (!off) return;
    if (e > fine && depth < (fine < 2 ? 16 : 12)) {
      const [, p, q] = edges[0], r = [a, b, c].find((t) => t !== p && t !== q), m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      walk(p, m, r, depth + 1); walk(m, q, r, depth + 1); return;
    }
    if (cover((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3) <= -0.1 && cover(a[0], a[1]) <= 0.15 && cover(b[0], b[1]) <= 0.15 && cover(c[0], c[1]) <= 0.15) emit(a, b, c);      // (a piece of <= 2 m: its middle and its corners clear of the asphalt)
  };
  for (const t of tris) walk(pts[t[0]], pts[t[1]], pts[t[2]], 0);
  // scraps: the carving leaves connected pieces smaller than SCRAP m2 (a corner of the polygon that pokes between two kerbs): a sliver of paving with a thin dark outline, not a surface. They are
  // dropped, unless the whole polygon is that small (then it is what the map says).
  const key = (p) => Math.round(p[0] * 500) + ',' + Math.round(p[1] * 500), par = new Map();
  const find = (k) => { let r = k; while (par.get(r) !== r) r = par.get(r); while (par.get(k) !== r) { const nx = par.get(k); par.set(k, r); k = nx; } return r; };
  for (const t of acc) for (const p of t) { const k = key(p); if (!par.has(k)) par.set(k, k); }
  for (const t of acc) for (let i = 1; i < 3; i++) { const ra = find(key(t[0])), rb = find(key(t[i])); if (ra !== rb) par.set(rb, ra); }
  const comp = new Map(); let total = 0;
  for (const [a, b, c] of acc) { const ar = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2, r = find(key(a)); comp.set(r, (comp.get(r) || 0) + ar); total += ar; }
  for (const t of acc) if (total < 2 * SCRAP || comp.get(find(key(t[0]))) >= SCRAP) place(t[0], t[1], t[2]);
}
