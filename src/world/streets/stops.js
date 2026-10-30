// streets/stops.js - bus / trolleybus stops (BUS_STOPS platforms): small black steel shelter with glass sides, a slatted back, bench, route board, bin, and a blue stop sign on a black post
// 2.4 m before it; the stop name on the fascia. Sources: docs/research/streets.md section 5 and nevsky.md section 7 (photos nevsky 59 61, P25 P18), transport.md section 8 (kerb-lane bays
// with yellow zig-zag marking). planStops() also gives the bay position (kerb lane, travel direction) that the traffic module needs.
import * as THREE from 'three';
import { VB } from './vb.js';
import { MB, UP, clamp } from './util.js';
import { COL, instances, hash2, nodeNear } from './furn.js';
import { BUS_STOPS } from '../data/city.js';
import { nearestWay, wayAt } from './net.js';
import { WALK_Y, KERB_W } from './surface.js';
import { knockInstances } from '../lib/knock-inst.js';
import { registerLOD } from '../../core/spatial.js';
import * as L from '../layout.js';

const SHEL_W = 3.0, SHEL_D = 1.4;                                      // the shelter (shelterModel): along the road x deep
/** the shelter place of a stop beside way w at arclength s on `side`: the platform node is a hint (its lateral distance is kept when it lies 1.4 .. 6 m behind the kerb, else 1.0 m + half the depth) */
function kerbSpot(b, w, s, side) {
  const at = wayAt(w, s), edge = side > 0 ? at.hR : at.hL, nOut = [-at.tz * side, at.tx * side];
  const dNode = Math.hypot(b.x - at.x, b.z - at.z) - edge;
  const d = clamp(dNode > 1.4 && dNode < 6 ? dNode : KERB_W + 1.0 + SHEL_D / 2, KERB_W + 1.0 + SHEL_D / 2, 6);
  return { at, edge, cx: at.x + nOut[0] * (edge + d), cz: at.z + nOut[1] * (edge + d), tx: at.tx, tz: at.tz, nOut, dirT: w.oneway ? 1 : (side > 0 ? 1 : -1) };
}
/** Keep the entire shelter, sign and associated bin clear of all carriageways,
 * including other roads, parking pockets and junction fillets. The mapped
 * platform is a hint: shift along / away from the kerb only when needed. */
function clearStop(net, b, w, s, side, shelter) {
  const clear = (sp, cx, cz) => {
    const { tx, tz, nOut, dirT } = sp;
    const pts = [[-2.4 * dirT, -0.6], [1.95, 0.2]]; // pole, bin
    if (shelter) for (const u of [-1.55, 0, 1.55]) for (const v of [-0.75, 0, 0.75]) pts.push([u, v]);
    else for (const u of [-0.85, 0, 0.85]) for (const v of [0.05, 0.55]) pts.push([u, v]);
    return pts.every(([u, v]) => { const x = cx + tx * u + nOut[0] * v, z = cz + tz * u + nOut[1] * v; return net.cover(x, z, {}) <= -0.25 && !L.insideBuilding(x, z, 0.2); });
  };
  for (let along = 0; along <= 6; along++) for (const sign of along ? [1, -1] : [1]) {
    const ss = clamp(s + along * sign, 0, w.L), sp = kerbSpot(b, w, ss, side);
    if (nodeNear(net, sp.at.x, sp.at.z, 14)) continue;
    for (let away = 0; away <= 6; away += 0.5) {
      const cx = sp.cx + sp.nOut[0] * away, cz = sp.cz + sp.nOut[1] * away;
      if (clear(sp, cx, cz)) return { ...sp, s: ss, cx, cz };
    }
  }
  return null;
}
/** stops whose platform lies beside a road: { x, z, name, shelter, w, side, s } (the cycle track gives way to the shelter there) */
export function planStops(net) {
  const out = [];
  for (const b of BUS_STOPS) {
    if (b.kind !== 'platform') continue;
    const h = nearestWay(net, b.x, b.z, 22, 2); if (!h) continue;
    const { w, i, q } = h;
    const s = w.s[i] + (w.s[i + 1] - w.s[i]) * q.t, at = wayAt(w, s);
    const side = q.side >= 0 ? 1 : -1;
    // skip platforms that sit in the middle of a junction mouth
    if (nodeNear(net, at.x, at.z, 14)) continue;                        // (furn.js: the junction nodes hashed once; this scanned every node per platform)
    const sp = clearStop(net, b, w, s, side, !!b.shelter); if (!sp) continue;
    if (out.some((p) => Math.hypot(p.x - sp.cx, p.z - sp.cz) < 6)) continue;
    const rec = { id: b.id, x: sp.cx, z: sp.cz, name: b.name || '', shelter: !!b.shelter, bench: !!b.bench, bin: !!b.bin, bus: !!b.bus, trolley: !!b.trolley, tram: !!b.tram, routes: b.routes || {}, w, s: sp.s, side, at: sp.at, edge: sp.edge, cx: sp.cx, cz: sp.cz, sp };
    out.push(rec);
  }
  return out;
}

function shelterModel(width = 3.0) {
  const V = new VB(), W = new VB(), G = new MB();
  const D = 1.4, H = 2.6;                                              // local frame: +Z toward the road (open side), X along the road
  const steel = COL.black, wood = COL.woodS, bench = COL.wood;
  for (const x of [-width / 2 + 0.05, 0, width / 2 - 0.05]) for (const z of [-D / 2 + 0.05, D / 2 - 0.05]) V.box(0.08, H, 0.08, steel, [x, H / 2, z]);
  V.box(width + 0.3, 0.12, D + 0.3, steel, [0, H + 0.04, 0.05]);                            // flat roof slab
  V.box(width + 0.3, 0.34, 0.06, steel, [0, H - 0.17, D / 2 + 0.2]);                         // fascia with the name (panel added separately)
  V.box(width, 0.06, 0.06, steel, [0, 0.12, D / 2 - 0.05]); V.box(width, 0.06, 0.06, steel, [0, 0.12, -D / 2 + 0.05]);
  // wood slat panel in the back (centre part), glass elsewhere
  for (let k = 0; k < 9; k++) W.box(0.17, 1.9, 0.04, wood, [-0.9 + k * 0.225, 1.2, -D / 2 + 0.04]);
  V.box(2.1, 0.06, 0.07, steel, [0, 2.2, -D / 2 + 0.05]); V.box(2.1, 0.06, 0.07, steel, [0, 0.22, -D / 2 + 0.05]);
  // bench: three slats on a black frame, against the back
  for (let k = 0; k < 3; k++) W.box(1.7, 0.05, 0.12, bench, [-0.25, 0.46, -D / 2 + 0.2 + k * 0.14]);
  V.box(0.05, 0.45, 0.45, steel, [-1.0, 0.22, -D / 2 + 0.38]); V.box(0.05, 0.45, 0.45, steel, [0.5, 0.22, -D / 2 + 0.38]);
  // route map board (white) + litter bin
  V.box(0.62, 0.86, 0.03, '#f0efe9', [-1.15, 1.45, -D / 2 + 0.07]);
  // glass: back, left, right (centre of the back is wood: leave the panes beside it)
  const quadTo = (M, a, b, c, d, n) => { const v = [a, b, c, d].map((p, i) => M.vert(p[0], p[1], p[2], i === 1 || i === 2 ? 1 : 0, i > 1 ? 1 : 0, n)); M.quad(v[0], v[1], v[2], v[3], n); };
  const quad = (a, b, c, d, n) => quadTo(G, a, b, c, d, n);
  quad([-width / 2 + 0.05, 0.15, -D / 2 + 0.02], [width / 2 - 0.05, 0.15, -D / 2 + 0.02], [width / 2 - 0.05, 2.45, -D / 2 + 0.02], [-width / 2 + 0.05, 2.45, -D / 2 + 0.02], [0, 0, 1]);
  quad([-width / 2 + 0.05, 0.15, -D / 2 + 0.05], [-width / 2 + 0.05, 0.15, D / 2 - 0.05], [-width / 2 + 0.05, 2.45, D / 2 - 0.05], [-width / 2 + 0.05, 2.45, -D / 2 + 0.05], [1, 0, 0]);
  quad([width / 2 - 0.05, 0.15, D / 2 - 0.05], [width / 2 - 0.05, 0.15, -D / 2 + 0.05], [width / 2 - 0.05, 2.45, -D / 2 + 0.05], [width / 2 - 0.05, 2.45, D / 2 - 0.05], [-1, 0, 0]);
  return { body: V.build(), wood: W.build(), glass: G, W: width, D, H };
}

/** the free-standing stop furniture: the bench of a stop without a shelter and the litter bin beside a shelter (local frame: foot at y 0, the bench's length along x) */
function benchModel() {
  const V = new VB();
  V.box(1.6, 0.05, 0.4, COL.wood, [0, 0.45, 0]);                                                  // seat
  V.box(0.06, 0.45, 0.36, COL.black, [-0.7, 0.22, 0]); V.box(0.06, 0.45, 0.36, COL.black, [0.7, 0.22, 0]);
  return V.build();
}
function binModel() {
  const V = new VB();
  V.cyl(0.17, 0.15, 0.78, COL.black, [0, 0.39, 0], null, 6);
  return V.build();
}

export function buildStops(ctx, net, stops, shared, root) {
  const { panels, poles } = shared;
  const K = shared.kposts || null;                                              // knockable posts (furn.js makeKnockPosts): the bus-stop poles; null without ctx.knock = the merged pt-poles path
  const F = ctx.tex.FONTS;
  const out = { stops: 0, shelters: 0, list: [], bollards: 0, rails: 0, tris: 0, knockPoles: 0 };
  const busTex = shared.signs.tex('5.16'), [BUS_W, BUS_H] = shared.signs.size('5.16');
  const nameTex = (name) => ctx.tex.draw(512, 64, (g, w, h) => {
    g.fillStyle = '#16181c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f3f2ee'; g.textAlign = 'center'; g.textBaseline = 'middle'; ctx.tex.fitText(g, name, w / 2, h / 2 + 2, w - 40, 40, F.sans, 500);
  }, { key: 'pt-stopname-' + name, anisotropy: 4 });
  const shel = shelterModel(3.0);
  const mVC = ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0.02, name: 'pt-shelter' });
  const glassM = ctx.mat.glass({ tint: '#a9bccb', opacity: 0.26, streaks: true });
  const woodM = mVC;
  const list = [];
  const dummy = new THREE.Object3D();
  const shelterSpots = [], bandMats = [];                                       // with ctx.knock: the shelters are knockable instances, their name band a detached mesh that travels with the record
  const bandGeo = ctx.knock ? new THREE.PlaneGeometry(3.1, 0.31) : null;
  const benchSpots = [], binSpots = [];                                         // with ctx.knock: the stop benches and the shelter bins are knockable instances (below), not merged pole parts
  for (const st of stops) {
    const { at, side, edge } = st;
    // the shelter place: beside the kerb of the stop's way, away from the road on the stop's side (kerbSpot)
    const sp = st.sp;
    const tx = sp.tx, tz = sp.tz, nOut = sp.nOut;
    const frontX = -nOut[0], frontZ = -nOut[1];
    const { cx, cz } = sp;
    const rotY = Math.atan2(frontX, frontZ);
    // pole + blue sign 2.4 m before the shelter (looking along the travel direction of the nearest lane)
    const dirT = sp.dirT;                                                         // direction the traffic nearest the stop travels (one-way carriageways: with the polyline)
    const px = cx + tx * dirT * -2.4 + frontX * (shel.D / 2 - 0.1), pz = cz + tz * dirT * -2.4 + frontZ * (shel.D / 2 - 0.1);
    const pitem = ctx.physics.addCylinder(px, pz, 0.1, 0, 3);
    if (K) { K.signPost({ x: px, z: pz, nx: tx * dirT * -1, nz: tz * dirT * -1, h: 3.0, r: 0.05, col: COL.black, tex: busTex, w: BUS_W, ht: BUS_H, my: 2.58, variant: 'stop', item: pitem,
      base: (V) => V.cyl(0.09, 0.1, 0.1, COL.blackL, [0, 0.05, 0], null, 6, null, true), rec: { mass: 30, h: 3.0 } }); out.knockPoles++; }                // knockable: shaft, ring, clamps and the blue face are one instance (no ghost pole in pt-poles)
    else {
      poles.cyl(0.05, 0.06, 3.0, COL.black, [px, WALK_Y + 1.5, pz], null, 6, null, true); poles.cyl(0.09, 0.1, 0.1, COL.blackL, [px, WALK_Y + 0.05, pz], null, 6, null, true);
      panels.mount(poles, busTex, px, WALK_Y + 2.58, pz, tx * dirT * -1, tz * dirT * -1, BUS_W, BUS_H, { pole: 0.05 });
    }
    st.pole = { x: px, z: pz };
    if (st.shelter) {
      list.push({ x: cx, z: cz, rotY, st });
      const items = [];
      { const c = Math.cos(rotY), sn = Math.sin(rotY), back = -shel.D / 2 + 0.05;       // colliders: back panel + the two glass sides (the front stays open)
        items.push(ctx.physics.addBox(cx + back * sn, cz + back * c, shel.W, 0.14, rotY, 0, 2.6));
        for (const sx of [-1, 1]) { const lx = sx * (shel.W / 2 - 0.05); items.push(ctx.physics.addBox(cx + lx * c, cz - lx * sn, 0.12, shel.D, rotY, 0, 2.6)); } }
      // name band on the front fascia
      const ntex = nameTex(st.name || 'Остановка'), bx0 = cx + frontX * (shel.D / 2 + 0.24), by0 = WALK_Y + shel.H - 0.17, bz0 = cz + frontZ * (shel.D / 2 + 0.24);
      if (ctx.knock) {                                                          // a mesh of its own (the dynamic root): the knocked shelter takes its band; the same quad as panels.panel with its own material
        const mat = new THREE.MeshBasicMaterial({ map: ntex, side: THREE.DoubleSide, toneMapped: false, name: 'pt-stopname', alphaTest: 0.45 }); bandMats.push(mat);
        const band = new THREE.Mesh(bandGeo, mat); band.name = 'pt-stop-band'; band.castShadow = false; band.receiveShadow = false;
        band.position.set(bx0, by0, bz0); band.rotation.y = Math.atan2(frontX, frontZ); ctx.noOutline(band); ctx.add(band);
        shelterSpots.push({ x: cx, y: WALK_Y, z: cz, rotY, items, band });
      } else panels.panel(ntex, bx0, by0, bz0, frontX, frontZ, 3.1, 0.31);
      // litter bin beside the shelter
      const bnx = cx + tx * 1.95 + nOut[0] * 0.2, bnz = cz + tz * 1.95 + nOut[1] * 0.2;
      if (ctx.knock) binSpots.push({ x: bnx, y: WALK_Y, z: bnz, rotY });
      else poles.cyl(0.17, 0.15, 0.78, COL.black, [bnx, WALK_Y + 0.39, bnz], null, 6);
      out.shelters++;
    } else {
      // no shelter: a bench + bin
      const bx = cx + nOut[0] * 0.3, bz = cz + nOut[1] * 0.3, ry = Math.atan2(frontX, frontZ);
      if (ctx.knock) benchSpots.push({ x: bx, y: WALK_Y, z: bz, rotY: ry });
      else {
        poles.box(1.6, 0.05, 0.4, COL.wood, [bx, WALK_Y + 0.45, bz], [0, ry, 0]);
        poles.box(0.06, 0.45, 0.36, COL.black, [bx + tx * 0.7, WALK_Y + 0.22, bz + tz * 0.7], [0, ry, 0]); poles.box(0.06, 0.45, 0.36, COL.black, [bx - tx * 0.7, WALK_Y + 0.22, bz - tz * 0.7], [0, ry, 0]);
      }
    }
    out.stops++;
    // the bay on the kerb lane where the vehicles stop: 1.75 m inside the road edge, and the direction they travel there (one-way carriageways: with the polyline)
    const bayT = st.w.oneway ? 1 : (side > 0 ? 1 : -1), kn = [-at.tz * side, at.tx * side];
    out.list.push({ id: st.id, name: st.name, x: cx, z: cz, rotY, shelter: st.shelter, side, road: st.w.id, kind: st.trolley ? (st.bus ? 'both' : 'trolley') : 'bus', routes: st.routes, tram: st.tram ? 1 : 0, s: st.s,
      bay: { x: at.x + kn[0] * (edge - 1.75), z: at.z + kn[1] * (edge - 1.75), tx: at.tx * bayT, tz: at.tz * bayT }, pole: st.pole || null });
  }
  // knockable stop furniture (core/knock.js): a mass-based throw by the driven car; colliders exist only with ctx.knock (the headless collider counts stay as they were)
  if (ctx.knock) {
    if (benchSpots.length) knockInstances(ctx, { name: 'pt-stop-bench', parts: [{ geo: benchModel(), mat: mVC }], spots: benchSpots, far: 200,
      items: (i, p) => ctx.physics.addBox(p.x, p.z, 1.6, 0.4, p.rotY, 0, WALK_Y + 0.5),
      rec: { kind: 'bench', mass: 35, h: 0.5, w: 1.6, d: 0.4, hitK: 0.2, minDv: 0.5 } });
    if (binSpots.length) knockInstances(ctx, { name: 'pt-stop-bin', parts: [{ geo: binModel(), mat: mVC }], spots: binSpots, far: 170,
      items: (i, p) => ctx.physics.addCylinder(p.x, p.z, 0.2, 0, WALK_Y + 0.78),
      rec: { kind: 'bin', mass: 14, h: 0.78, r: 0.17, hitK: 0.12, metal: true } });
    out.knockBenches = benchSpots.length; out.knockBins = binSpots.length;
    if (shelterSpots.length) {                                                  // body + wood + glass share one index; the 3 colliders go as items, the name band as the detached part
      knockInstances(ctx, { name: 'pt-shelter', cell: 1024, far: 300,
        parts: [{ name: 'body', geo: shel.body, mat: mVC }, { name: 'wood', geo: shel.wood, mat: woodM }, { name: 'glass', geo: shel.glass.build(), mat: glassM, shadow: false, receive: false, noOutline: true }],
        spots: shelterSpots, items: (i, s) => s.items, extraParts: (i, s) => [{ obj: s.band }],
        rec: { kind: 'shelter', mass: 350, h: shel.H, w: shel.W, d: shel.D, anchored: 28, hitK: 0.6, metal: true, minDv: 0 } });
      for (const sp of shelterSpots) { sp.band.updateMatrixWorld(true); registerLOD(sp.band, 330); }     // the band goes with its shelter (300 m + the throw reach); a loose draw, no attach
      ctx.onUpdate(() => { const n = ctx.shared.uNight ? ctx.shared.uNight.value : 0; for (const m of bandMats) m.color.setScalar(0.86 + 0.5 * n); });   // the bands brighten at night like the merged sign panels
      out.tris += shel.body.index.count / 3 * shelterSpots.length; out.knockShelters = shelterSpots.length;
    }
    return out;                                                                 // (the merged shelter meshes below are the build without ctx.knock)
  }
  // shelters: bake the model into every placement and merge (one mesh per material instead of one per shelter)
  const bake = (geo) => {
    const geos = [];
    for (const it of list) { dummy.position.set(it.x, WALK_Y, it.z); dummy.rotation.set(0, it.rotY, 0); dummy.updateMatrix(); const g = geo.clone(); g.applyMatrix4(dummy.matrix); geos.push(g); }
    return geos;
  };
  const bodies = bake(shel.body), woods = bake(shel.wood);
  const mergeG = (gs) => { if (!gs.length) return null; const m = ctx.geo.mergeGeometries(gs.map((g) => { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k); return g; }), false); return m; };
  const bodyG = mergeG(bodies), woodG = mergeG(woods);
  if (bodyG) { const m = new THREE.Mesh(bodyG, mVC); m.castShadow = true; m.receiveShadow = true; m.name = 'pt-shelters'; root.add(m); out.tris += bodyG.index.count / 3; }
  if (woodG) { const m = new THREE.Mesh(woodG, woodM); m.castShadow = true; m.receiveShadow = true; m.name = 'pt-shelter-wood'; root.add(m); }
  // glass panes
  {
    const gb = new MB();
    for (const it of list) {
      const c = Math.cos(it.rotY), s = Math.sin(it.rotY);
      const g = shel.glass;
      const base = gb.n;
      for (let i = 0; i < g.n; i++) {
        const x = g.pos[i * 3], y = g.pos[i * 3 + 1], z = g.pos[i * 3 + 2];
        const nx = g.nrm[i * 3], nz = g.nrm[i * 3 + 2];
        gb.vert(it.x + x * c + z * s, WALK_Y + y, it.z - x * s + z * c, g.uv[i * 2], g.uv[i * 2 + 1], [nx * c + nz * s, 0, -nx * s + nz * c]);
      }
      for (let i = 0; i < g.idx.length; i++) gb.idx.push(base + g.idx[i]);
    }
    if (!gb.empty) { const m = new THREE.Mesh(gb.build(), glassM); m.name = 'pt-shelter-glass'; ctx.noOutline(m); ctx.noBatch(m); root.add(m); }
  }
  return out;
}

export { hash2, UP };
