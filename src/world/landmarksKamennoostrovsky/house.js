// landmarksKamennoostrovsky/house.js - the scaffolding every landmark house goes through: footprint edges, party walls (not drawn), per-edge facade styles, plinth, mitred cornice tiers,
// parapet / roof railing / sheet roof, wall colliders (lib/massing addPolyColliders) and the metro doorways in the walls.
import { buildingEdgesAt as allEdges } from '../lib/building-edges.js';
import { addPolyColliders, ringFromFlat } from '../lib/massing.js';
import { ringEdges, onEdge, band } from './kit.js';

// ---------------------------------------------------------------- neighbours: edges of buildings that are NOT in the set being built
const dseg = (px, pz, e) => { const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1], t = Math.max(0, Math.min(1, ((px - e.a[0]) * dx + (pz - e.a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - e.a[0] - dx * t, pz - e.a[1] - dz * t); };
/** CONTACT RULE (docs/rules/FACADE-INTEGRITY.md): a wall is not drawn only where the WHOLE edge touches (within 1.2 cm) an antiparallel edge of another building that is at least as tall as this facade.
 *  A neighbour that merely comes near (OSM nodes of a shared wall are rounded to ~0.1 m: cracks of 2-12 cm; the old 0.7 m tolerance + "2 of 3 samples" hid walls of which a third was exposed) leaves the wall DRAWN:
 *  both hidden walls would show the sky through the hollow bodies. `o.tol` is ignored on purpose. `mine` = ids of the records being drawn by the caller, `selfId` = this record. */
export const CONTACT = 0.012;
export function sharedWall(e, selfId, mine, o = {}) {
  const pts = [0.02, 0.14, 0.26, 0.38, 0.5, 0.62, 0.74, 0.86, 0.98].map((t) => [e.a[0] + (e.b[0] - e.a[0]) * t, e.a[1] + (e.b[1] - e.a[1]) * t]);
  for (const q of pts) {
    let touch = false;
    for (const o2 of allEdges(q[0], q[1])) {
      if (o2.id === selfId) continue;
      if (o.neighbours === false && !mine.has(o2.id)) continue;
      if (e.hc != null && o2.h < e.hc - 0.3) continue;                               // a low neighbour cannot hide the exposed upper storeys of this facade
      const f = o2.e; if (f.n[0] * e.n[0] + f.n[1] * e.n[1] > -0.8) continue;       // antiparallel normals
      if (Math.abs(q[0] - f.a[0]) > 90 || Math.abs(q[1] - f.a[1]) > 90) continue;
      if (dseg(q[0], q[1], f) < CONTACT) { touch = true; break; }
    }
    if (!touch) return false;
  }
  return true;
}

/**
 * ROAD RULE (docs/AGENT-BRIEF.md "Road integrity rules": nothing stands on a carriageway; the wall, its plinth and its collider are placed together).  OSM footprints are a few decimetres off the
 * modelled asphalt here and there (a corner beside a junction fillet, a widened carriageway): such a corner of the outer ring is pulled back INTO the house until the wall line keeps `need` metres
 * from the asphalt of every real street (streets net.cover with minRank 1: service lanes and the passages through the houses do not count).  need = 1.15 m: the wall collider of lib/massing
 * (0.9 m thick, centred on the wall, 0.22 m longer at both ends) then stays 0.5 m off the asphalt.  A corner that another building touches (party wall), one that a facade label of streets hangs
 * beside, or one that would have to move more than `max` metres is left alone (reported in the console).  Without the streets module (a headless check of this module alone) nothing moves.
 * Returns the polygon itself when nothing had to move.
 */
export function clearOfRoad(ctx, poly, selfId, o = {}) {
  const net = ctx.services.streets && ctx.services.streets.net; if (!net || !net.cover) return poly;
  const RK = { minRank: 1 }, need = -(o.need ?? 1.15), max = o.max ?? 2.5, cov = (x, z) => net.cover(x, z, RK);
  const ring = ringFromFlat(poly.o), n = ring.length, out = ring.map((p) => p.slice()), labels = ctx.services.labels && ctx.services.labels.list ? ctx.services.labels.list() : [];
  const inRing = (x, z) => { let c = false; for (let i = 0, j = n - 1; i < n; j = i++) { const a = ring[i], b = ring[j]; if ((a[1] > z) !== (b[1] > z) && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  let moved = 0;
  for (let i = 0; i < n; i++) {
    const p = ring[i]; let c = cov(p[0], p[1]); if (c <= need) continue;
    const prev = ring[(i + n - 1) % n], next = ring[(i + 1) % n];
    if (allEdges(p[0], p[1]).some((q) => q.id !== selfId && q.parent !== selfId && dseg(p[0], p[1], q.e) < 0.05)) continue;                 // a party wall starts here: the neighbour would lose its contact
    if (labels.some((l) => Math.min(dseg(l.x, l.z, { a: prev, b: p }), dseg(l.x, l.z, { a: p, b: next })) < 0.7 && Math.hypot(l.x - p[0], l.z - p[1]) < 12)) { console.warn(`[landmarksKamennoostrovsky] ${selfId}: corner (${p[0]}, ${p[1]}) is ${(c + 0).toFixed(2)} m on the asphalt but carries a street plate: left in place`); continue; }
    // steepest descent of the asphalt cover; inside a fillet (flat cover) along the inward bisector of the corner
    const bx = (prev[0] - p[0]) / Math.hypot(prev[0] - p[0], prev[1] - p[1]) + (next[0] - p[0]) / Math.hypot(next[0] - p[0], next[1] - p[1]), bz = (prev[1] - p[1]) / Math.hypot(prev[0] - p[0], prev[1] - p[1]) + (next[1] - p[1]) / Math.hypot(next[0] - p[0], next[1] - p[1]);
    let bl = Math.hypot(bx, bz) || 1, ix = bx / bl, iz = bz / bl; if (!inRing(p[0] + ix * 0.2, p[1] + iz * 0.2)) { ix = -ix; iz = -iz; }
    let x = p[0], z = p[1];
    for (let k = 0; k < 80 && c > need; k++) {
      let gx = cov(x + 0.1, z) - cov(x - 0.1, z), gz = cov(x, z + 0.1) - cov(x, z - 0.1); const gl = Math.hypot(gx, gz);
      if (gl > 0.02 && -(gx * ix + gz * iz) / gl > 0.2) { x -= (gx / gl) * 0.05; z -= (gz / gl) * 0.05; } else { x += ix * 0.05; z += iz * 0.05; }
      c = cov(x, z);
    }
    if (c > need || Math.hypot(x - p[0], z - p[1]) > max || !inRing(x, z)) { console.warn(`[landmarksKamennoostrovsky] ${selfId}: corner (${p[0]}, ${p[1]}) stays ${cov(p[0], p[1]).toFixed(2)} m on the asphalt (cannot clear it within ${max} m)`); continue; }
    out[i] = [Math.round(x * 100) / 100, Math.round(z * 100) / 100]; moved++;
  }
  if (!moved) return poly;
  return { o: out.flat(), h: poly.h };
}

/**
 * Build the walls of a house made of footprint records.
 * cfg: { name, recs: [record], hc (cornice height), hcOf?: (rec) => hc, wall (hex), court (hex), plinth (m), floors: [floor heights for default windows],
 *        front: (edge, ctx) => true when the facade of that edge was drawn by the caller, party?: (edge) => bool override, cornice: 'classic'|'none'|fn(K, edges, hc),
 *        roof: 'flat'|'none', roofMat, collide (default true), minH: records / polys filter, railing (default true), clearRoad: false | { need, max } (clearOfRoad above) }
 * returns { edges: [{...edge, party, rec, poly}], hc }
 */
export function buildHouse(K, cfg) {
  const { ctx, P, mats } = { ctx: K.ctx, P: K.P, mats: K.mats };
  const mine = new Set(cfg.recs.map((r) => r.id));
  const out = { edges: [], hc: cfg.hc };
  const courtMat = K.wall(cfg.court || cfg.wall);
  const up = cfg.upstand ?? 0.45;
  for (const rec of cfg.recs) {
    const hc = cfg.hcOf ? cfg.hcOf(rec) : cfg.hc;
    for (const poly0 of (cfg.polysOf ? cfg.polysOf(rec) : rec.polys)) {
      const poly = cfg.clearRoad === false ? poly0 : clearOfRoad(ctx, poly0, rec.id, cfg.clearRoad || {});        // ROAD RULE: corners on the asphalt are pulled back (wall, plinth, cornice, roof and collider follow)
      const edges = ringEdges(poly, 0.05);
      // group by ring (outer first, then the courtyard holes): ringEdges numbers the edges of every ring from 0
      const groups = []; let cur = [];
      for (let i = 0; i < edges.length; i++) { cur.push(edges[i]); if (i + 1 === edges.length || edges[i + 1].i <= edges[i].i) { groups.push(cur); cur = []; } }
      for (const g of groups) for (const e of g) {
        e.rec = rec; e.poly = poly; e.hc = (cfg.hcEdge && cfg.hcEdge(e, rec)) || hc; e.ringEdges = g;
        const p = cfg.party ? cfg.party(e, rec) : null;
        e.party = p ?? sharedWall(e, rec.id, mine, cfg.partyOpts || {});
        e.noBand = !!(cfg.noBand && cfg.noBand(e, rec)); e.noPlinth = !!(cfg.noPlinth && cfg.noPlinth(e, rec));
      }
      // facades
      for (const e of edges) {
        if (e.party || e.len < 0.3) continue;
        const handled = cfg.front && onEdge(P, e, (len, f) => cfg.front(e, { len, f, hc: e.hc, rec, K }));
        if (!handled) onEdge(P, e, (len) => defaultWall(K, e, len, e.hc, cfg, courtMat));
      }
      // plinth, string courses, cornice per ring
      for (const g of groups) {
        const draw = (e) => !e.party && e.len >= 0.3 && !e.noBand;
        const plinthH = cfg.plinth ?? 0.9;
        if (plinthH > 0) band(P, g, 0, plinthH, 0.1, { front: cfg.plinthMat || mats.granite, top: cfg.plinthMat || mats.granite }, { draw: (e) => draw(e) && !e.noPlinth, uvs: 1 });
        if (cfg.bands) for (const b of cfg.bands) band(P, g, b.y0, b.y1, b.d, { front: b.mat, top: b.mat, under: b.under ?? b.mat }, { draw: b.draw ? (e) => draw(e) && b.draw(e) : draw, uvs: b.uvs ?? 1 });
        if (cfg.cornice !== 'none') corniceBands(K, g, draw, cfg);
      }
      if (cfg.roof !== 'none') {
        const outer = ringFromFlat(poly.o), holes = poly.h.map(ringFromFlat).filter((h) => h.length >= 3);
        P.cap(cfg.roofMat || mats.roofSilver, outer, (cfg.roofHc ?? hc) + up, true, 4, holes);
      }
      if (cfg.railing !== false) {
        for (const g of groups) {
          for (const e of g) { if (e.party || e.len < 0.3 || e.noBand) continue; K.railing([shiftIn(e.a, e.n, 0.12), shiftIn(e.b, e.n, 0.12)], (e.hc ?? hc) + up, 0.9); }
        }
      }
      if (cfg.collide !== false) addPolyColliders(ctx, poly, 0, (cfg.collideH ?? Math.max(hc, ...edges.map((e) => e.hc))) + 1, 0.9);
      out.edges.push(...edges);
    }
  }
  return out;
}
const shiftIn = (p, n, d) => [p[0] - n[0] * d, p[1] - n[1] * d];

/** classic Petersburg cornice: a frieze band with dentils, a cyma, a projecting corona, and a stone upstand (heights follow each edge's own cornice height e.hc) */
function corniceBands(K, g, draw, cfg) {
  const m = K.mats, P = K.P;
  const c = cfg.corniceMat || m.cornice, sh = m.corniceShade;
  const s = cfg.corniceScale ?? 1, up = cfg.upstand ?? 0.45;
  const H = (k) => (e) => e.hc + k;
  band(P, g, H(-1.15 * s), H(-0.85 * s), 0.10 * s, { front: c, top: c, under: c }, { draw });
  band(P, g, H(-0.85 * s), H(-0.5 * s), 0.14 * s, { front: m.dentil, top: c, under: sh }, { draw, uvs: 0.6 });
  band(P, g, H(-0.5 * s), H(-0.05 * s), 0.42 * s, { front: c, top: c, under: sh }, { draw });
  band(P, g, H(-0.05 * s), H(up), 0.2 * s, { front: c, top: c, under: sh }, { draw });
}

/** plain wall of a courtyard / side edge: stucco + small regular windows */
function defaultWall(K, e, len, hc, cfg, courtMat) {
  const floors = cfg.floors || [4.2, 3.8, 3.5, 3.3];
  const P = K.P;
  K.wallQuad(courtMat, 0, len, 0, hc + (cfg.upstand ?? 0.45), 3);
  if (len < 3 || (cfg.noWin && cfg.noWin(e))) return;
  let y = (cfg.plinth ?? 0.9) + 0.3;
  const xs = K.bays(1.0, len - 1.0, cfg.courtPitch ?? 3.4);
  for (let f = 0; f < floors.length; f++) {
    const fh = floors[f], wh = Math.min(1.7, fh * 0.5);
    if (y + fh > hc + 0.1) break;
    for (const x of xs) K.glass(K.mats.winWhite, x, y + fh * 0.3, 1.0, wh, 'flat', Math.floor(K.hash(x, y, len) * 4) % 4);   // courtyard windows: the pane only (this module has ~2 km of courtyard walls)
    y += fh;
  }
}
