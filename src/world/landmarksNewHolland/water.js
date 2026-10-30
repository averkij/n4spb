// landmarksNewHolland/water.js - the water of the island: the KOVSH basin (r1648982), the East canal (r1648987) and the South canal (r1648986, under the Arch), their granite quay walls with copings and the black
// looped railing, the timber pier (w507817412) with its two wooden terrace stairs, and the four island footbridges (two timber, two flat granite).  Dossier docs/research/new-holland.md sections 3, 8
// (photos 25 27 32 35 44 46 61 11 12 50).
// LEVELS.  The environment's ground plane has no hole under the Kovsh / inner canals (layout.WATERWAYS knows only the Moika there), so by default the water is drawn FLUSH with the street (y 0.03 under a
// 0.3 m granite coping, "flush" mode).  When layout.waterwayAt() reports a waterway at the Kovsh the environment draws water + walls itself (mode "env": only railings, deck, stairs, bridges are mine) and when
// layout.heightAt() is below -1 there but nobody draws, I draw the sunk water (-2.8) with 2.8 m quay walls ("deep" mode).  Colliders: boxes along every coped bank, open at the bridges.
import * as L from '../layout.js';
import { WATER, BRIDGES } from '../data/city.js';
import { RING, inRing, ARCH, toArch, WATER_DEEP, pairs } from './frame.js';
import { fillPolyFine, wall3D, ribbon, inflate, roadTest } from './surfaces.js';
import { addInstanced } from './inst.js';
import * as G from './geo.js';
import * as THREE_ from 'three';
import { knockBays, splitBays, unitPanel } from '../lib/fence-bays.js';

const IDS = { kovsh: 'r1648982', south: 'r1648986', east: 'r1648987' };
export const PIER = [[-3384.1, 318.8], [-3377.2, 338.2], [-3413.5, 351.1], [-3412.6, 353.7], [-3372.4, 378.9], [-3374.3, 382], [-3396.3, 368.2], [-3406.6, 361.8], [-3415.5, 356.2], [-3420.1, 343.3], [-3417, 342.2], [-3415.8, 345.6], [-3393.7, 337.7], [-3398.6, 324]];
export const STAIRS = [{ a: [-3411.8, 370.8], b: [-3406.6, 361.8], n: 19 }, { a: [-3401.6, 377.1], b: [-3396.3, 368.2], n: 19 }];   // a = the top on the quay, b = the foot on the pier

export function waterRings() {
  const out = {};
  for (const w of WATER) for (const [k, id] of Object.entries(IDS)) if (w.id === id) out[k] = pairs(w.polys[0].o);
  return out;
}
const key = (a, b) => { const r = (v) => Math.round(v * 2); const p = `${r(a[0])},${r(a[1])}`, q = `${r(b[0])},${r(b[1])}`; return p < q ? p + '|' + q : q + '|' + p; };
const dseg = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t); };
const distToIsland = (x, z) => { let m = 1e9; for (let i = 0; i < RING.length; i++) m = Math.min(m, dseg(x, z, RING[i], RING[(i + 1) % RING.length])); return m; };

export async function build(K) {
  const { ctx, M, P, svc, root, THREE } = K, ph = ctx.physics, T = ctx.mat.toon;
  const rings = waterRings();
  const kov = rings.kovsh; if (!kov) throw new Error('Kovsh polygon r1648982 missing from the baked data');
  const kc = [kov.reduce((s, p) => s + p[0], 0) / kov.length, kov.reduce((s, p) => s + p[1], 0) / kov.length];
  const envOwns = !!(L.waterwayAt && L.waterwayAt(kc[0], kc[1]));
  const deep0 = envOwns || L.heightAt(kc[0], kc[1]) < -1;
  const forced = (typeof process !== 'undefined' && process.env && process.env.NH_WATER) || (typeof location !== 'undefined' && new URLSearchParams(location.search).get('nhwater')) || '';   // test switch: env | deep | flush
  const mode = ['env', 'deep', 'flush'].includes(forced) ? forced : envOwns ? 'env' : deep0 ? 'deep' : 'flush';
  const WY = mode !== 'flush' ? WATER_DEEP : 0.03;           // water surface
  const DECK = mode !== 'flush' ? WATER_DEEP + 0.8 : 0.1;    // timber deck top
  svc.waterMode = mode; svc.waterY = WY;
  const loops = ctx.tex.draw(256, 128, (g, w, h) => {      // the black looped quay railing: top / bottom rail, a chain of tall ovals (alpha cut-out), tile 2.4 m x 1.1 m
    g.clearRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(0, 8); g.lineTo(w, 8); g.stroke(); g.beginPath(); g.moveTo(0, h - 6); g.lineTo(w, h - 6); g.stroke();
    g.lineWidth = 5; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(i * 43 + 22, h / 2, 17, 49, 0, 0, 6.3); g.stroke(); }
    g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(i * 43 + 22, 8); g.lineTo(i * 43 + 22, h - 6); g.stroke(); }
  }, { key: 'lmNH-loops', repeat: [1, 1] });
  const railMat = T('#26262a', { map: loops, alphaTest: 0.5, side: 'double', name: 'lmNH-rail' });
  M.cutouts.add(railMat);
  svc.railMat = railMat;

  // ---------------------------------------------------------------- edges: which ring edges get a coping + railing + collider
  const all = Object.entries(rings), count = new Map();
  for (const [, r] of all) for (let i = 0; i < r.length; i++) { const k = key(r[i], r[(i + 1) % r.length]); count.set(k, (count.get(k) || 0) + 1); }
  const banks = [];                                                                                             // [{ a, b, name, kovsh }]
  for (const [name, r] of all) for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    if (count.get(key(a, b)) > 1) continue;                                                                    // the mouth shared by two water rings
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.25) continue;
    if (distToIsland(a[0], a[1]) < 1.2 && distToIsland(b[0], b[1]) < 1.2 && distToIsland(mx, mz) < 1.2) continue;   // the island perimeter belongs to the Moika / canal quays of environment
    const ar = toArch(mx, mz); if (Math.abs(ar.u) <= 5.2 && ar.v >= -8 && ar.v <= 0.8) continue;                 // inside the passage under the Arch
    const ddx = b[0] - a[0], ddz = b[1] - a[1], dl = Math.hypot(ddx, ddz); let nx = ddz / dl, nz = -ddx / dl;
    if (pointIn(r, mx + nx * 0.6, mz + nz * 0.6)) { nx = -nx; nz = -nz; }                                      // normal pointing away from the water
    banks.push({ a, b, name, n: [nx, nz] });
  }
  // bridges (baked BRIDGES inside the island): centre lines with their widths
  const myBridges = ['w373488750', 'w472268625', 'w513847294', 'w514294331', 'w1000013399'].map((id) => BRIDGES.find((b) => b.id === id)).filter(Boolean)
    .map((b) => ({ id: b.id, a: [b.pts[0], b.pts[1]], b: [b.pts[2], b.pts[3]], w: b.w || 2.4, kind: b.hw === 'footway' ? 'timber' : 'stone' }));
  const nearBridge = (x, z, m = 0) => myBridges.some((b) => dseg(x, z, b.a, b.b) < b.w / 2 + 0.9 + m);
  const gapLines = [...myBridges.map((b) => ({ a: b.a, b: b.b, h: b.w / 2 + 0.9 })), ...STAIRS.map((q) => ({ a: q.a, b: q.b, h: 2.0 }))];
  const blocked = (x, z) => gapLines.some((g) => dseg(x, z, g.a, g.b) < g.h);
  const onRoad = roadTest(ctx);
  // Test the entire collider footprint, including its overhang, against the
  // actual street network. A bay that crosses asphalt would obstruct driving;
  // keep the geometry, collision and knock record together when omitting it.
  const roadClear = (bay, thick, off = 0) => {
    const dx = bay.x1 - bay.x0, dz = bay.z1 - bay.z0, len = Math.hypot(dx, dz) || 1;
    const tx = dx / len, tz = dz / len, nx = -tz, nz = tx, n = Math.max(1, Math.ceil((len + 0.1) / 0.3));
    for (let i = 0; i <= n; i++) {
      const u = -0.05 + (len + 0.1) * i / n;
      for (const v of [off - thick / 2, off, off + thick / 2]) {
        if (onRoad(bay.x0 + tx * u + nx * v, bay.z0 + tz * u + nz * v, 0.05)) return false;
      }
    }
    return true;
  };
  /** the pieces of a bank edge outside the bridge / stair gaps: [{ a, b }] */
  const pieces = (a, b) => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(l / 0.4)), out = []; let st = null;
    const at = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = at(t), bl = blocked(p[0], p[1]);
      if (!bl && st === null) st = t;
      if ((bl || i === n) && st !== null) { const t1 = bl ? (i - 1) / n : t; if ((t1 - st) * l > 0.7) out.push({ a: at(st), b: at(t1) }); st = null; }
    }
    return out;
  };

  // ---------------------------------------------------------------- water surfaces + quay walls
  const ringsFlat = all.map(([, r]) => r);
  if (mode === 'flush') {
    if (!(await envWater(K, all.map((a) => a[1]), WY))) for (const [, r] of all) P.cap(M.water, r, WY, true, 4);
    for (const bk of banks) for (const pc of pieces(bk.a, bk.b)) wall3D(P, [pc.a, pc.b], { hw: 0.24, h: 0.3, side: M.quay, top: M.quayCoping, tile: 2.5 });   // coping: a raised granite curb 0.3 m, 0.48 wide
  } else if (mode === 'deep') {
    const envOk = await envWater(K, all.map((a) => a[1]), WY);
    for (const [name, r] of all) {
      if (!envOk) P.cap(M.water, r, WY, true, 4);
      P.cap(M.graniteStone, r, WY - 1.4, true, 4);
      const n = r.length;
      for (let i = 0; i < n; i++) {
        const a = r[i], b = r[(i + 1) % n];
        if (count.get(key(a, b)) > 1) continue;
        const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; if (l < 0.3) continue;
        const nx = dz / l, nz = -dx / l;                                                                        // either side: draw the face toward the water (both windings are tested below)
        const mx = (a[0] + b[0]) / 2 + nx * 0.5, mz = (a[1] + b[1]) / 2 + nz * 0.5;
        const inside = pointIn(r, mx, mz), sg = inside ? 1 : -1;                                               // face normal pointing INTO the water
        P.quad(M.quay, [a[0], WY - 1.4, a[1]], [b[0], WY - 1.4, b[1]], [b[0], 0, b[1]], [a[0], 0, a[1]], [-nx * sg, 0, -nz * sg], [[0, 0], [l / 2.5, 0], [l / 2.5, (0 - WY + 1.4) / 2.5], [0, (0 - WY + 1.4) / 2.5]]);
      }
    }
    for (const bk of banks) for (const pc of pieces(bk.a, bk.b)) wall3D(P, [pc.a, pc.b], { hw: 0.24, h: 0.14, side: M.quay, top: M.quayCoping, tile: 2.5 });
  }
  // ---------------------------------------------------------------- the black looped railing on every coped bank (1.1 m, posts every 2.4 m)
  // WATER IS REACHABLE (docs/AREAS.md 13.7, the owner's world rule of 2026-10-25): the railing is a row of BREAKABLE bays (lib/fence-bays.js): one bay per 2.4 m panel between two posts (the texture tile of the loops), its own
  // thin collider (-6 .. 1.6, 0.5 m) and ONE knock record (a car above 22 km/h breaks the bay off at the foot, the gap is passable). The geometry is the same as before.
  const railTop = mode === 'flush' ? 0.3 : 0.17;                            // the quay coping top of the environment is +0.17
  const railBays = [];
  for (const bk of banks) for (const pc of pieces(bk.a, bk.b)) {
    const a = pc.a, b = pc.b, l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (l < 0.5) continue;
    railBays.push(...splitBays(a[0], a[1], b[0], b[1], 2.4, { y: railTop }).filter((bay) => roadClear(bay, 0.5)));
  }
  const postGeo = new THREE_.BoxGeometry(0.14, 1.18, 0.14).translate(0, 0.59, 0);
  const railR = knockBays(ctx, { name: 'lmNH-bank-rail', bays: railBays, far: 300,
    parts: [{ geo: unitPanel(0, 1.1), mat: railMat, name: 'panel', stretch: true, shadow: false, receive: false }, { geo: postGeo, mat: M.iron, name: 'post', ats: (b) => (b.last ? ['start', 'end'] : ['start']) }],
    collider: { y0: -6, y1: 1.6, thick: 0.5, e0: 0.05, e1: 0.05 },
    rec: () => ({ kind: 'fence', mass: 400, h: 1.1, anchored: 22, hitK: 0.5, metal: true, minDv: 0 }) });
  const railTris = railBays.length * (2 + 10 + 2);
  void railR;
  svc.fences.push({ kind: 'kovsh-rail', count: banks.length });
  // ---------------------------------------------------------------- the timber pier: deck (flush with the street at 0.1 in flush mode), edge board, black railing on the water edge, two wooden stair flights
  {
    const pier = PIER, n = pier.length, pierBays = [];
    P.cap(M.deck, pier, DECK, true, 1.4);
    for (let i = 0; i < n; i++) {
      const a = pier[i], b = pier[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.3) continue;
      const nx = dz / l, nz = -dx / l, mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, out = pointIn(pier, mx + nx * 0.4, mz + nz * 0.4) ? -1 : 1;
      P.quad(M.deckEdge, [a[0], DECK - 0.6, a[1]], [b[0], DECK - 0.6, b[1]], [b[0], DECK, b[1]], [a[0], DECK, a[1]], [nx * out, 0, nz * out], [[0, 0], [l, 0], [l, 0.5], [0, 0.5]]);
      // the pier edge railing (skip the short joints and where the pier meets the stairs / the quay)
      const nearStair = STAIRS.some((q) => dseg(a[0], a[1], q.b, q.b) < 3.2 || dseg(b[0], b[1], q.b, q.b) < 3.2);
      if (l > 2.2 && !nearStair) {
        pierBays.push(...splitBays(a[0], a[1], b[0], b[1], 2.4, { y: DECK }));      // breakable bays (lib/fence-bays.js): the same panel and collider as before, one bay per 2.4 m
      }
    }
    knockBays(ctx, { name: 'lmNH-pier-rail', bays: pierBays, far: 260,
      parts: [{ geo: unitPanel(0, 1.0), mat: railMat, name: 'panel', stretch: true, shadow: false, receive: false }],
      collider: { y0: DECK - 0.5, y1: Math.max(DECK + 1.2, 1.3), thick: 0.3, e0: 0.05, e1: 0.05 },
      rec: () => ({ kind: 'fence', mass: 300, h: 1.0, anchored: 22, hitK: 0.5, metal: true, minDv: 0 }) });
    // stairs: n steps from the quay down to the deck (the OSM way a -> b)
    for (const s of STAIRS) {
      const dx = s.b[0] - s.a[0], dz = s.b[1] - s.a[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l, w = 2.2;
      const top = mode === 'flush' ? DECK : 0.0;
      for (let i = 0; i < s.n; i++) {
        const t0 = i / s.n, t1 = (i + 1) / s.n, y = top - (top - DECK) * t1, cx = s.a[0] + dx * (t0 + t1) / 2, cz = s.a[1] + dz * (t0 + t1) / 2;
        const rot = Math.atan2(-dz, dx);
        P.push(cx, 0, cz, rot); P.box(M.deck, -l / s.n / 2, l / s.n / 2, Math.min(y, top) - 0.04, Math.max(y, DECK + 0.01), -w / 2, w / 2, 'b', 1.4); P.pop();
        void ux; void uz;
      }
      const cx = (s.a[0] + s.b[0]) / 2, cz = (s.a[1] + s.b[1]) / 2;
      ph.addStairs(cx, cz, w, l, Math.atan2(dx, dz), top, DECK, s.n);
      for (const sd of [-1, 1]) { const ox = -uz * sd * (w / 2), oz = ux * sd * (w / 2); P.cyl(M.iron, [s.a[0] + ox, top, s.a[1] + oz], [s.b[0] + ox, DECK, s.b[1] + oz], 0.03, 0.03, 4, false); P.cyl(M.iron, [s.a[0] + ox, top + 1.0, s.a[1] + oz], [s.b[0] + ox, DECK + 1.0, s.b[1] + oz], 0.03, 0.03, 4, false); }
    }
    if (mode !== 'flush') {                                                                                  // sunk deck: walkable strips (1.5 m rows of the polygon), top = deck
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of pier) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
      for (let z = z0; z < z1; z += 1.5) { let st = null; for (let x = x0; x <= x1 + 1.5; x += 1.5) { const ins = x <= x1 && pointIn(pier, x + 0.75, z + 0.75); if (ins && st === null) st = x; if (!ins && st !== null) { ph.addWalkBox((st + x) / 2, z + 0.75, x - st, 1.5, 0, DECK, -6); st = null; } } }
    }
    svc.pier = { ring: pier, deckY: DECK };
    svc.crowd.push({ x: -3398, z: 346, r: 8, n: 12, kind: 'pier', y: DECK });
  }
  // ---------------------------------------------------------------- the footbridges
  const bridgeTris0 = P.tris, footBays = [];
  for (const b of myBridges) {
    const dx = b.b[0] - b.a[0], dz = b.b[1] - b.a[1], l = Math.hypot(dx, dz) + 0.6, ux = dx / (l - 0.6), uz = dz / (l - 0.6), cx = (b.a[0] + b.b[0]) / 2, cz = (b.a[1] + b.b[1]) / 2, rot = Math.atan2(-dz, dx);
    const w = b.w, timber = b.kind === 'timber', span = l;
    P.push(cx, 0, cz, rot);
    // deck (top at street level 0.04), side fascias (granite arch bridge: segmental soffit approximated by a shallow box; timber: dark steel beam)
    P.box(timber ? M.deck : M.settWarm, -span / 2, span / 2, 0.0, 0.05, -w / 2, w / 2, 'b', 1.4);
    if (timber) { for (const sd of [-1, 1]) P.box(M.ironSoft, -span / 2, span / 2, -0.55, 0.05, sd * w / 2 - 0.05, sd * w / 2 + 0.05, '', 1); P.box(M.ironSoft, -span / 2, span / 2, -0.5, -0.45, -w / 2, w / 2, '', 1); }
    else {
      for (const sd of [-1, 1]) P.box(M.quay, -span / 2, span / 2, mode === 'flush' ? -0.45 : -1.1, 0.05, sd * w / 2 - 0.2, sd * w / 2 + 0.2, '', 2.5);
      P.box(M.quay, -span / 2, span / 2, mode === 'flush' ? -0.45 : -1.1, -0.35, -w / 2, w / 2, '', 2.5);
    }
    // parapet railing: black looped panels on both sides + posts: breakable bays below (lib/fence-bays.js), drawn in world coordinates
    P.pop();
    // walkable deck (the ground below the bridge is the canal bed in deep mode)
    ph.addWalkBox(cx, cz, span, w, rot, 0.04, timber ? -0.6 : mode === 'flush' ? -0.5 : -1.15);      // (the bottom is the drawn soffit: a solid column down to the bed walled the canal for a boat, docs/water-transport-bridges.md)
    for (const sd of [-1, 1]) {      // the parapet bays: the line of a side is the bridge centre line moved by zl across (left of the travel a -> b = (-uz, ux))
      const zl = sd * (w / 2 + (timber ? 0.0 : 0.2)), ox = -uz * zl, oz = ux * zl;
      footBays.push(...splitBays(cx - ux * span / 2 + ox, cz - uz * span / 2 + oz, cx + ux * span / 2 + ox, cz + uz * span / 2 + oz, 2.4, { y: 0.05, off: sd * (w / 2 + 0.05) - zl }).filter((bay) => roadClear(bay, 0.2, bay.off)));
    }
    svc.bridges.push({ id: b.id, x: cx, z: cz, rot, w: b.w, len: span, kind: b.kind });
  }
  knockBays(ctx, { name: 'lmNH-bridge-rail', bays: footBays, far: 260,
    parts: [{ geo: unitPanel(0, 1.1), mat: railMat, name: 'panel', stretch: true, shadow: false, receive: false }, { geo: new THREE_.BoxGeometry(0.14, 1.18, 0.14).translate(0, 0.59 - 0.01, 0), mat: M.iron, name: 'post', ats: (b) => (b.last ? ['start', 'end'] : ['start']) }],
    collider: (b) => ({ y0: 0, y1: 1.3, thick: 0.2, off: b.off, e0: 0.05, e1: 0.05 }),
    rec: () => ({ kind: 'fence', mass: 250, h: 1.1, anchored: 22, hitK: 0.5, metal: true, minDv: 0 }) });
  svc.bridgeTris = P.tris - bridgeTris0;
  // ---------------------------------------------------------------- the sandy / gravel banks at the Arch (photo 08) and the granite quay slabs in the passage are part of arch.js; the canal under it:
  svc.water = { mode, y: WY, kovsh: kov, east: rings.east, south: rings.south, centre: kc, banks: banks.flatMap((bk) => pieces(bk.a, bk.b).map((pc) => ({ ...bk, a: pc.a, b: pc.b }))) };
  void ringsFlat; void ribbon; void inflate; void fillPolyFine; void G; void addInstanced; void root; void THREE; void inRing; void ARCH;
}
function pointIn(r, x, z) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; }

/** the environment's toon water (ripples, sky reflection) as ONE mesh over the given rings at height y; false when it is not available (the caller draws a plain toon cap) */
async function envWater(K, rings, y) {
  const { ctx, root, THREE } = K;
  try {
    const mod = await import('../environment/water.js');
    const field = ctx.services.environment && ctx.services.environment.field;
    if (!mod.waterMaterial || !field) return false;
    const mat = mod.waterMaterial(ctx, field, { key: 'moika', wallH: 3.0, zones: [], cut: false });
    mat.polygonOffset = true; mat.polygonOffsetFactor = -3; mat.polygonOffsetUnits = -3;
    const pos = [];
    for (const r of rings) {
      const tris = THREE.ShapeUtils.triangulateShape(r.map((p) => new THREE.Vector2(p[0], p[1])), []);
      for (const [a, b, c] of tris) {
        const A = r[a], B = r[b], C = r[c], cy = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]);
        for (const q of cy > 0 ? [A, B, C] : [A, C, B]) pos.push(q[0], y, q[1]);
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const nor = new Float32Array(pos.length); for (let i = 1; i < nor.length; i += 3) nor[i] = 1; g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat); m.name = 'lmNH-water'; m.receiveShadow = false; m.castShadow = false; m.frustumCulled = false;
    ctx.noBatch(m); ctx.noOutline(m); root.add(m);
    return true;
  } catch (e) { console.warn('[landmarksNewHolland] environment water unavailable:', e && e.message); return false; }
}
