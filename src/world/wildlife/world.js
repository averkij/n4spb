// wildlife/world.js - what the animals know about the world of Saint Petersburg: placement tests (never inside a building / trunk / solid, never on a carriageway or in the
// water, never in an empty notch of the play area, the obelisk steps kept free), the list of PERCHES (lamp tops, the parapet posts of every embankment, the Neva parapet roll, the
// copper lions of the Palace Pier, tree tops, cornices of the street facades), the ground level (square paving 0.02, pavements +0.12, low steps / plinths read from the physics, the
// humped deck of the Anichkov Bridge), water points for the gulls and the player.
// All reads of other modules go through ctx.services with optional chaining and fall back to layout.js, so the module also works alone.
// West extension (wave 3): PLAY is a union of rectangles (L.inPlay); posts exist on every waterway (environment quay segments carry their waterway key: the post height / bay
// follow the quay.js post types: Fontanka pyramid 1.30 m, Griboedov / Swan Canal two-step 1.24, Moika 1.12, Winter Canal pylon 1.09; the Neva has no posts but a granite roll
// parapet whose crown is 1.04 m high 0.44 m behind the wall line); the ground tests also ask ctx.physics.columnBlocked (benches, plinths, fountains, steps, trunks).
// Sources: docs/research/people.md (O10 species, spots), fontanka.md (parapet: granite posts 0.45 x 1.0 m every ~3.2 m, coping top +0.17), architecture.md (cornice 1.0 m),
// west-canals-bridges.md (Moika / Griboedov posts), west-life-furniture.md section 8 (birds per zone).
import { BUILDINGS, AREAS, PARKING } from '../data/city.js';

const hash2 = (a, b) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const ringHas = (o, x, z) => { let ins = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) { const xi = o[i], zi = o[i + 1], xj = o[j], zj = o[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } return ins; };
/** crown height of a post above the street (quay.js: base y 0.14 + the post body; the pyramid peak is a point: the bird sits on its flat shoulder) */
const POST_Y = { fontanka: 1.30, griboedov: 1.24, 'swan-canal': 1.24, moika: 1.12, 'winter-canal': 1.09, zhdanovka: 1.24, kryukov: 1.24, admiralty: 1.24, smolenka: 1.24, gavan: 1.24 };

export function makeWorld(ctx) {
  const { L } = ctx, svc = ctx.services, phys = ctx.physics;
  const env = svc.environment, streets = svc.streets, landmarks = svc.landmarks, city = svc.city, lmC = svc.landmarksC;
  const OB = L.OBELISK;
  const timing = {}; let tl = performance.now(); const lap = (k) => { const n = performance.now(); timing[k] = (timing[k] || 0) + n - tl; tl = n; };      // build time per phase (W.timing, ms)

  // ---------------------------------------------------------------- trunks grid (trees / shrubs the animals must not stand in)
  const tgrid = new Map(); const TC = 8;
  const tk = (i, j) => i * 40009 + j;
  // the landmark gardens that plant their own trees publish services.<module>.treeList = [{ x, z, h, tr, r, shrub?, y? }] (y = the terrain under the trunk; absent = 0): their trunks join the grid
  // (the ground birds keep out of them, the sparrows find their shelter) and their crowns are perches. An absent module = an empty list = the grid of the environment alone.
  const GARDEN_TREE_MODULES = ['landmarksE', 'landmarksF', 'landmarksH', 'landmarksJ', 'landmarksTauride'];
  const gardenTrees = GARDEN_TREE_MODULES.flatMap((k) => (Array.isArray(svc[k]?.treeList) ? svc[k].treeList : []));
  for (const t of [...(env?.trees || []), ...gardenTrees]) { const k = tk(Math.floor(t.x / TC), Math.floor(t.z / TC)); (tgrid.get(k) || tgrid.set(k, []).get(k)).push(t); }
  const inTree = (x, z, pad = 0.3) => {
    const ci = Math.floor(x / TC), cj = Math.floor(z / TC);
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) for (const t of tgrid.get(tk(i, j)) || []) {
      const rr = (t.shrub ? t.r * 0.7 : (t.tr || 0.15)) + pad; if ((t.x - x) ** 2 + (t.z - z) ** 2 < rr * rr) return true;
    }
    return false;
  };
  /** the trees / shrubs of the environment within r metres of (x,z) (the 8 m grid: the sparrow shelters used to scan all of them for every candidate) */
  const treesNear = (x, z, r, fn) => {
    const i0 = Math.floor((x - r) / TC), i1 = Math.floor((x + r) / TC), j0 = Math.floor((z - r) / TC), j1 = Math.floor((z + r) / TC);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (const t of tgrid.get(tk(i, j)) || []) fn(t);
  };

  lap('trunks');
  // ---------------------------------------------------------------- the Anichkov Bridge (landmarksC): deck height under a point, pavement strips at the two sides
  const br = lmC?.bridge;
  const bf = br?.frame, bcos = bf ? Math.cos(bf.theta) : 1, bsin = bf ? Math.sin(bf.theta) : 0;
  /** (u along the bridge axis, v across it) or null without the bridge */
  const bridgeUV = (x, z) => (bf ? { u: (x - bf.cx) * bcos + (z - bf.cz) * bsin, v: -(x - bf.cx) * bsin + (z - bf.cz) * bcos } : null);
  const onBridge = (x, z) => { const q = bridgeUV(x, z); return !!q && Math.abs(q.u) <= 29.5 && Math.abs(q.v) <= 18.95; };   // 29.5 = the ramp extent (landmarksC/frame.js EXT)
  /** pavement strip of the bridge: |v| 16.3 .. 18.5 (roadway half width 15.95, parapet / cornice at 18.95) */
  const onBridgePavement = (x, z, pad = 0) => { const q = bridgeUV(x, z); return !!q && Math.abs(q.u) <= 29.5 && Math.abs(q.v) >= 16.3 + pad && Math.abs(q.v) <= 18.4 - pad; };

  // ---------------------------------------------------------------- the obelisk steps and the river
  const nearObelisk = (x, z, r) => (x - OB.x) ** 2 + (z - OB.z) ** 2 < r * r;
  const gaps = env?.quay?.gaps || [];

  /** may a small animal stand / walk here? opts.road = metres of margin from carriageways (default 1.2), opts.pad from buildings */
  // the static part of the test (play area, river, buildings, carriageways, lanes, the coping) is memoised on a 0.25 m grid per (pad, road) pair: the animals ask
  // a few thousand times a second
  const memo = new Map();
  const solid = (x, z) => { try { return !!phys && phys.columnBlocked(x, z, 0.2, 0.32, 0.9); } catch (e) { return false; } };
  // on a carriageway of the streets net: streets.laneAt's test (a way whose half width covers the point) for the centre and the four corners of the 0.25 m memo cell, in ONE pass over the segments near the cell
  // (laneAt scans the grid cells and builds a lane record for every probe: five scans per cell were the biggest cost of the build); without the net the service itself answers
  const LP = [[0, 0], [0.13, 0.13], [-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13]], net = streets?.net;
  const onLaneSlow = (x, z) => !!streets?.laneAt && (streets.laneAt(x, z) || streets.laneAt(x + 0.13, z + 0.13) || streets.laneAt(x - 0.13, z - 0.13) || streets.laneAt(x + 0.13, z - 0.13) || streets.laneAt(x - 0.13, z + 0.13));
  const onLane = net && typeof net.each === 'function' ? (x, z) => {
    let hit = false;
    net.each(x, z, 14, (w, i) => {
      if (hit || w.rank < 0 || !w.hR || !w.hL) return;
      const ax = w.x[i], az = w.z[i], dx = w.x[i + 1] - ax, dz = w.z[i + 1] - az, l2 = dx * dx + dz * dz, l = Math.sqrt(l2) || 1;
      for (let k = 0; k < 5 && !hit; k++) {
        const px = x + LP[k][0], pz = z + LP[k][1], t0 = l2 < 1e-12 ? 0 : ((px - ax) * dx + (pz - az) * dz) / l2, t = t0 < 0 ? 0 : t0 > 1 ? 1 : t0;
        const cx = ax + dx * t, cz = az + dz * t, d = Math.hypot(px - cx, pz - cz), side = (px - cx) * (-dz / l) + (pz - cz) * (dx / l);
        const h = side > 0 ? w.hR[i] + (w.hR[i + 1] - w.hR[i]) * t : w.hL[i] + (w.hL[i + 1] - w.hL[i]) * t;
        if (d - h <= 0) hit = true;
      }
    });
    return hit;
  } : onLaneSlow;
  // surface car parks (PARKING polygons: asphalt with white bay lines, streets/extras.js): a vehicle floor, not a feeding floor (a 32 m hash of the lot outlines)
  const LOTC = 32, lots = new Map(), lk = (i, j) => i * 40009 + j;
  for (const p of PARKING) {
    if (p.kind === 'underground' || !p.polys) continue;
    for (const q of p.polys) {
      const o = q.o; if (!o || o.length < 6) continue;
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < o.length; i += 2) { x0 = Math.min(x0, o[i]); x1 = Math.max(x1, o[i]); z0 = Math.min(z0, o[i + 1]); z1 = Math.max(z1, o[i + 1]); }
      const e = { o, h: q.h || null }; for (let i = Math.floor(x0 / LOTC); i <= Math.floor(x1 / LOTC); i++) for (let j = Math.floor(z0 / LOTC); j <= Math.floor(z1 / LOTC); j++) { const k = lk(i, j); (lots.get(k) || lots.set(k, []).get(k)).push(e); }
    }
  }
  const inLot = (x, z) => { const a = lots.get(lk(Math.floor(x / LOTC), Math.floor(z / LOTC))); if (a) for (const e of a) if (ringHas(e.o, x, z) && !(e.h && e.h.some((h) => ringHas(h, x, z)))) return true; return false; };
  const staticOk = (x, z, pad, road) => {
    const key = pad + '|' + road; let m = memo.get(key); if (!m) memo.set(key, m = new Map());
    const k = Math.round(x * 4) * 100003 + Math.round(z * 4); let v = m.get(k);
    if (v === undefined) {
      v = L.inPlay(x, z, 2) && !L.inRiver(x, z) && !L.insideBuilding(x, z, pad) && !L.isOnRoad(x, z, road) && !inLot(x, z) && !onLane(x, z);
      if (v && env?.quay?.top != null && L.shoreDist && L.shoreDist(x, z) < 0.9) v = false;   // the quay coping / parapet
      m.set(k, v);
    }
    return v;
  };
  function ok(x, z, o = {}) {
    if (br && onBridge(x, z)) return onBridgePavement(x, z, 0.3);
    if (!staticOk(x, z, o.pad ?? 0.5, o.road ?? 1.2)) return false;
    if (inTree(x, z, o.tree ?? 0.3)) return false;
    if (solid(x, z)) return false;                                                   // benches, plinths, fountain rims, steps, lamp posts: exact (not memoised: the columns are thin)
    if (env?.kindAt) { const k = env.kindAt(x, z); if (k === 'water') return false; }
    if (nearObelisk(x, z, 9.2)) return false;                                         // the three steps of the stylobate (R 8.6) are not a feeding floor
    return true;
  }
  /** a straight walk from (x0,z0) to (x1,z1) stays on free ground (sampled every `step` metres) */
  function clear(x0, z0, x1, z1, o = {}) {
    const d = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(d / (o.step ?? 1.5)));
    for (let i = 0; i <= n; i++) { const u = i / n; if (!ok(x0 + (x1 - x0) * u, z0 + (z1 - z0) * u, o)) return false; }
    return true;
  }
  const kind = (x, z) => (env?.kindAt ? env.kindAt(x, z) : 'asphalt');
  /** a flight at a low altitude from (x0,z0) to (x1,z1) keeps out of the building footprints (sampled every 3 m) */
  function flightClear(x0, z0, x1, z1) {
    const d = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(d / 3));
    for (let i = 1; i < n; i++) { const u = i / n; if (L.insideBuilding(x0 + (x1 - x0) * u, z0 + (z1 - z0) * u, 0.4)) return false; }
    return true;
  }

  // ---------------------------------------------------------------- ground level
  const sqArea = AREAS.find((a) => a.id === 'w638352776');
  const inSquare = (x, z) => { if (!sqArea) return false; for (const p of sqArea.polys) if (ringHas(p.o, x, z) && !p.h.some((h) => ringHas(h, x, z))) return true; return false; };
  const gmemo = new Map(), sf = { y: 0, kind: null, item: null };
  function groundY(x, z) {
    if (br && onBridge(x, z)) { const dy = br.deckY(x, z); return (dy ?? 0) + L.SURFACE.sidewalk; }
    const k = Math.round(x * 2) * 100003 + Math.round(z * 2); let v = gmemo.get(k);
    if (v === undefined) {
      v = 0;
      if (inSquare(x, z) && !L.isOnRoad(x, z, 0.3)) v = 0.02;
      else if (streets?.nearestSidewalk) { const s = streets.nearestSidewalk(x, z, 4); if (s && s.dist < s.w * 0.5) v = L.SURFACE.sidewalk; }
      if (phys) { try { phys.surfaceAt(x, z, 0.2, false, sf); if ((sf.kind === 'walk' || sf.kind === 'ramp') && sf.y > v && sf.y < 0.7) v = sf.y; } catch (e) { /* the physics is optional */ } }
      gmemo.set(k, v);
    }
    return v;
  }

  // ---------------------------------------------------------------- perches
  const perches = [];
  const addPerch = (p) => { p.occ = null; p.id = perches.length; perches.push(p); return p; };

  // lamp tops: the Nevsky pedestal lamp ends in a finial 7.65 m up, the swan-neck lamps in a lantern cap; a crow sits on the finial / cap
  for (const l of streets?.lamps || []) {
    if (hash2(Math.round(l.x * 3), Math.round(l.z * 3)) > 0.5) continue;
    addPerch({ kind: 'lamp', x: l.x, y: l.h + (l.kind === 'A' ? 0.27 : 0.12), z: l.z, yaw: hash2(Math.round(l.x), Math.round(l.z)) * 6.283, size: 2 });
  }
  // the torchere lamps / lanterns of the landmark gardens (landmarksE / H / J publish { x, z, h })
  for (const l of [...(svc.landmarksE?.lamps || []), ...(svc.landmarksH?.lamps || []), ...(svc.landmarksJ?.lamps || [])]) {
    if (!Number.isFinite(l.x) || !Number.isFinite(l.h) || l.h < 3 || hash2(Math.round(l.x * 3), Math.round(l.z * 3)) > 0.6 || !L.inPlay(l.x, l.z)) continue;
    addPerch({ kind: 'lamp', x: l.x, y: l.h + 0.1, z: l.z, yaw: hash2(Math.round(l.x), Math.round(l.z)) * 6.283, size: 2 });
  }
  // tree tops (lime / maple / elm crowns of the side streets, the embankments and the gardens): a bird sits just under the top of a tall crown. The trees of the landmark gardens are
  // drawn by their modules: they may publish services.landmarksX.treeList = [{ x, z, h }] (not yet: the Alexander Garden, Kazan and St Isaac's gardens then have lamps only)
  for (const t of [...(env?.trees || []), ...gardenTrees]) {
    if (t.shrub || t.h < 9) continue;
    if (hash2(Math.round(t.x * 7), Math.round(t.z * 7)) > 0.22) continue;
    if (!L.inPlay(t.x, t.z, 0)) continue;
    const p = addPerch({ kind: 'tree', x: t.x, y: (t.y || 0) + t.h - 0.6, z: t.z, yaw: hash2(Math.round(t.x), Math.round(t.z)) * 6.283, size: 2, tree: t });
    // a garden tree publishes crown = [the drawn crown top above its terrain at LOD0, 1, 2, 3] and lod (the level on the screen now): the crow stands ON the crown that is drawn (T7 fix round 1; the nominal t.h lay 0.6 .. 2 m inside it)
    if (Array.isArray(t.crown)) Object.defineProperty(p, 'y', { enumerable: true, get: () => (t.y || 0) + t.crown[Math.min(t.lod | 0, 2)] + 0.05, set() { /* the crown decides */ } });
  }
  lap('lamps+trees');
  // the quay: granite posts of the Fontanka parapet (a post every ~3.2 m), the posts / railing tops of the canals, the roll parapet of the Neva: the gulls' favourites. quay.js publishes
  // its pieces with the waterway key; the bay of a waterway is layout.WATERWAYS[key].bay, the post sits 0.26 m behind the line (the Neva roll crown 0.44 m behind it, 1.04 m up)
  const quay = env?.quay;
  const stairs = quay?.allStairs || quay?.stairs || [];
  const inGap = (x, z) => gaps.some((g) => ringHas(g, x, z));
  const posts = [];
  const nearStair = (x, z) => { for (const st of stairs) if (Math.abs(st.x - x) < 6 && Math.abs(st.z - z) < 6 && Math.hypot(st.x - x, st.z - z) < 4.5) return true; return false; };
  for (const s of quay?.segments || []) {
    const dx = s.bx - s.ax, dz = s.bz - s.az, len = Math.hypot(dx, dz); if (len < 1) continue;
    const key = s.key || 'fontanka', neva = key === 'neva', bay = L.WATERWAYS[key]?.bay || 3.2, off = neva ? 0.44 : 0.26;
    if (s.slope !== undefined || key === 'kronverk-moat' || key === 'moat' || key === 'nh-inner' || key === 'karpovka') continue;      // a natural bank / a moat wall without a parapet: no post to sit on
    const tx = dx / len, tz = dz / len, bays = Math.max(1, Math.round(len / bay));
    for (let j = 0; j < bays; j++) {
      const u = (j / bays) * len, x = s.ax + tx * u + s.nx * off, z = s.az + tz * u + s.nz * off;
      if (hash2(Math.round(x * 5), Math.round(z * 5)) > (neva ? 0.12 : 0.2)) continue;
      if (!L.inPlay(x, z, 0) || inGap(x, z) || nearStair(x, z)) continue;
      posts.push({ x, z, nx: s.nx, nz: s.nz, key });
    }
  }
  for (const p of posts) addPerch({ kind: 'post', key: p.key, x: p.x, y: p.key === 'neva' ? 1.03 : (POST_Y[p.key] ?? 1.2), z: p.z, yaw: Math.atan2(-p.nx, -p.nz) + (hash2(Math.round(p.x), 7) - 0.5) * 1.6, size: 2 });   // facing the water, give or take
  // the two copper lions of the Palace Pier (the Lions Descent, quay.js: pedestals 3.4 x 2.4 m, 2.42 m high, a lion ~2.2 m long facing the gate): a gull stands on the back
  const lions = [];
  for (const st of stairs) {
    if (st.key !== 'neva' || Math.abs(st.w - 4.6) > 0.05) continue;
    for (const side of [-1, 1]) {
      const u = side < 0 ? -2.0 - 1.7 : 1.8 + 1.7, cx = st.x + st.tx * u + st.nx * 1.2, cz = st.z + st.tz * u + st.nz * 1.2, fx = -side * st.tx, fz = -side * st.tz;
      const lx = cx - fx * 0.45, lz = cz - fz * 0.45;
      lions.push({ x: cx, z: cz });
      addPerch({ kind: 'lion', x: lx, y: 2.42 + 1.74, z: lz, yaw: Math.atan2(fx, fz) + (side < 0 ? 0.3 : -0.3), size: 2 });
    }
    break;
  }
  lap('posts');
  // cornices of the street facades: the flat top moulding is 0.6 m deep, 1.0 m above the cornice line (city/cornice.js CORNICE)
  const styles = city?.styles;
  const roofs = [];
  for (const b of BUILDINGS) {
    if (b.skip || (b.minH || 0) > 3 || (b.layer != null && b.layer < 0)) continue;
    let H = null;                                                                       // the height (style table / heightOf) only for a building that has a picked edge: the hash test is the cheap one
    for (const p of b.polys) {
      const o = p.o, n = o.length / 2; if (n < 4) continue;
      for (let i = 0; i < n; i++) {
        if (hash2(Math.round(o[2 * i] * 3), Math.round(o[2 * i + 1] * 3)) > 0.07) continue;
        const a = [o[2 * i], o[2 * i + 1]], c = [o[2 * ((i + 1) % n)], o[2 * ((i + 1) % n) + 1]], len = Math.hypot(c[0] - a[0], c[1] - a[1]); if (len < 8) continue;
        const u = 0.25 + 0.5 * hash2(i, Math.round(a[0])), x = a[0] + (c[0] - a[0]) * u, z = a[1] + (c[1] - a[1]) * u;
        let nx = (c[1] - a[1]) / len, nz = -(c[0] - a[0]) / len;                          // a normal of the edge: make it point out of the footprint
        if (ringHas(o, x + nx * 0.3, z + nz * 0.3)) { nx = -nx; nz = -nz; }
        const rx = x + nx * 0.3, rz = z + nz * 0.3, kk = hash2(Math.round(rx), Math.round(rz));
        if (kk > 0.12) continue;                                                           // only the first eighth of the shuffled list is ever tested (260 roofs are taken): the rest needs neither its height nor a place in the sort
        if (H === null) { H = styles?.get?.(b.id)?.H ?? L.heightOf(b); if (!(H >= 11)) H = -1; }
        if (H < 0) break;
        roofs.push({ kind: 'roof', x: rx, y: H + 1.02, z: rz, nx, nz, yaw: Math.atan2(nx, nz) + (hash2(i, 3) < 0.5 ? 0 : Math.PI), size: 2, k: kk });
      }
      if (H !== null && H < 0) break;
    }
  }
  roofs.sort((a, b) => a.k - b.k);
  let nRoof = 0;
  for (const r of roofs) {                                                             // street facades only (courtyard roofs are not seen): tested lazily, the list is already shuffled
    if (nRoof >= 260) break;
    if (!L.inPlay(r.x, r.z, 0)) continue;
    if (L.roadsNear(r.x + r.nx * 9, r.z + r.nz * 9, 12).length === 0) continue;
    addPerch(r); nRoof++;
  }

  lap('roofs');
  // spatial hash for "perches near here"
  const PC = 30, pgrid = new Map();
  for (const p of perches) { const k = tk(Math.floor(p.x / PC), Math.floor(p.z / PC)); (pgrid.get(k) || pgrid.set(k, []).get(k)).push(p); }
  /** free perches within [r0, r1] of (x,z), optionally only some kinds / away from the point `avoid` (the player) */
  function perchesNear(x, z, r0, r1, o = {}) {
    const out = [], ci = Math.floor(x / PC), cj = Math.floor(z / PC), R = Math.ceil(r1 / PC);
    for (let i = ci - R; i <= ci + R; i++) for (let j = cj - R; j <= cj + R; j++) for (const p of pgrid.get(tk(i, j)) || []) {
      if (p.dead) continue;
      if (p.occ && p.occ !== o.self) continue;
      const d = Math.hypot(p.x - x, p.z - z); if (d < r0 || d > r1) continue;
      if (o.kinds && !o.kinds.includes(p.kind)) continue;
      if (o.avoid && Math.hypot(p.x - o.avoid.x, p.z - o.avoid.z) < (o.avoidR ?? 12)) continue;
      out.push(p);
    }
    return out;
  }

  /** a knocked lamp / post (core/knock.js): the perches of `kinds` within r of (x,z) are gone for good (p.dead); returns them so the birds on them can leave */
  function dropPerches(x, z, kinds, r = 0.6) {
    const out = [], ci = Math.floor(x / PC), cj = Math.floor(z / PC);
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) for (const p of pgrid.get(tk(i, j)) || []) {
      if (p.dead || !kinds.includes(p.kind) || Math.hypot(p.x - x, p.z - z) > r) continue;
      p.dead = true; out.push(p);
    }
    return out;
  }

  // ---------------------------------------------------------------- water for the gulls: sample points over the water (data polygons) and offshore of the Neva banks (the Neva scenery
  // ring lies beyond the data: it is 300-400 m wide there), each with the waterway key and a clearance: open water (Neva, Fontanka) takes circling gulls
  const waterPts = [];
  {
    // distance to the nearest quay line (buckets of 64 m over the published quay segments): the clearance of a water point
    const SC = 64, sg = new Map(), segs = env?.quay?.segments || [];
    const sk = (i, j) => i * 40009 + j;
    for (const s of segs) {
      const len = Math.hypot(s.bx - s.ax, s.bz - s.az), n = Math.max(1, Math.ceil(len / 32));
      for (let k = 0; k <= n; k++) { const x = s.ax + (s.bx - s.ax) * k / n, z = s.az + (s.bz - s.az) * k / n, id = sk(Math.floor(x / SC), Math.floor(z / SC)); const a = sg.get(id) || sg.set(id, []).get(id); if (a[a.length - 1] !== s) a.push(s); }
    }
    const segDist = (x, z, s) => { const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz, u = l2 ? Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / l2)) : 0; return Math.hypot(x - s.ax - dx * u, z - s.az - dz * u); };
    const bankClear = (x, z) => { let d = 1e4; const ci = Math.floor(x / SC), cj = Math.floor(z / SC); for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) for (const s of sg.get(sk(i, j)) || []) { const e = segDist(x, z, s); if (e < d) d = e; } return d; };
    const STEP = 64, seen = new Set();                                                  // (30 m before the island: the orbit radii are 25 - 60 m, a 64 m lattice of centres is as good and the lattice over the Gulf side made the build 50 ms longer)
    for (const r of L.WORLD.dataRects || []) for (let x = Math.ceil(r.x0 / STEP) * STEP; x <= r.x1; x += STEP) for (let z = Math.ceil(r.z0 / STEP) * STEP; z <= r.z1; z += STEP) {
      const k = x * 100003 + z; if (seen.has(k)) continue; seen.add(k);
      const key = L.waterwayAt(x, z); if (!key) continue;
      waterPts.push({ x, z, key, off: 0, clear: key === 'neva' || key === 'fontanka' ? bankClear(x, z) : 0 });
    }
  }
  const nevaBanks = [];
  if (env?.quay?.segments) {
    const per = [];
    for (const s of env.quay.segments) if (s.key === 'neva') per.push(s);
    for (const s of per) {
      const mx = (s.ax + s.bx) / 2, mz = (s.az + s.bz) / 2;
      if (hash2(Math.round(mx), Math.round(mz)) > 0.16) continue;
      for (const d of [45, 95, 150]) { const x = mx - s.nx * d, z = mz - s.nz * d; waterPts.push({ x, z, key: 'neva', off: d, clear: d }); }
      nevaBanks.push({ x: mx, z: mz });
    }
  }

  lap('water');
  // ---------------------------------------------------------------- the player
  const player = ctx.player.position;
  return { timing, ok, clear, kind, groundY, perches, perchesNear, dropPerches, inTree, treesNear, onLane, player, env, streets, landmarks, hash2, L, ringHas, posts, lions, onBridge, onBridgePavement, bridgeUV, inSquare, flightClear, waterPts, nevaBanks, solid };
}
