// wildlife/birds.js - the bird engine of Saint Petersburg: hooded crows, pigeon flocks, sparrow flocks, black-headed gulls (on the posts of every embankment, the Neva parapet roll and the
// Palace Pier lions, on the roofs of the tourist boats, gliding over the water and escorting the moving boats) and a swift flock at golden hour.
// Every species is a handful of InstancedMeshes (body, head, mirrored wing pair, shared legs, shared contact shadows); every bird is a tiny state machine
// (perch / ground / fly / orbit / soar / boat / hide) advanced with dt and posed as a PURE function of t inside its state (flap, hop, peck, preen, head bob, tail pump).
// Flocks react to the player: pigeons lift off together at ~4.5 m, circle for 9-15 s and resettle once the player has left; sparrows scatter into the nearest tree (or a lamp
// top) and trickle back; crows flee to a lamp top, tree top or cornice 15-50 m away; gulls leave their post / boat for another post, circle over the water and come back
// (a boat gull lands again on the predicted spot of a moving boat: boat state(t) is a pure function of t).
// Spawn counts scale with ctx.quality (high / medium / low). Never uses Math.random (ctx.rng); nothing is placed in a building, a trunk, on a carriageway or in the water.
// Swifts only show at golden hour (sun elevation low, not night): the count follows ctx.sunDir.y and ctx.shared.uNight.
// WEST (wave 3): the map is 2.4x bigger but the budget (129 birds) is the same, so the animals FOLLOW THE PLAYER: zones.js lists where they like to be (Kazan lawn, Palace Square, the
// Alexander Garden, St Isaac's garden, Catherine Garden, Gostiny Dvor, the Neva parapet ...), the flocks start at the zones nearest the player and director.js moves every resting flock /
// perched bird / gull that the player left far behind to a zone 70-230 m away, out of the view. boats.js gives every boat of the map (Fontanka, Moika, Griboedov, Winter Canal, Neva) a
// roof / railing slot list; two gulls escort the moving boats.
import * as THREE from 'three';
import { birdModel, BIRD_SPECIES, legGeometry, shadowGeometry } from './models.js';
import { instanced } from './geom.js';
import { POIS, ROADS } from '../data/city.js';
import { collectBoats, BOAT_KEY as BK } from './boats.js';
import { zoneTable, CROW_HAUNTS } from './zones.js';
import { makeDirector } from './director.js';
import { NO_THREAT } from './threat.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sm = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

/** species table: model = geometry family, scale = size vs the model, speeds in m/s, scare = flight distance (m), kinds = perch kinds a bird may fly to */
export const SP = {
  crow: { model: 'crow', scale: 0.84, walk: 0.6, fly: 9.5, flap: 3.4, scare: 5.5, perchScare: 7, call: 'crow', legs: '#23252c', kinds: ['lamp', 'tree', 'roof'] },
  pigeon: { model: 'pigeon', scale: 0.9, walk: 0.5, fly: 11, flap: 7.5, scare: 4.5, legs: '#c76f78' },
  sparrow: { model: 'sparrow', scale: 0.75, hop: 1.6, fly: 8, flap: 14, scare: 3.2, legs: '#b48c78' },
  gull: { model: 'gull', scale: 1.0, walk: 0.45, fly: 10.5, flap: 3.2, scare: 6, perchScare: 8, call: 'gull', legs: '#c4372f', kinds: ['post', 'lion', 'roof'] },
  swift: { model: 'swift', scale: 1.9, fly: 13, flap: 9 },                          // stylised: a real swift spans 42 cm, which is a dot at 30 m
};
const GROUND = new Set(['crow', 'pigeon', 'sparrow', 'gull']);
const FOOD_SUBS = ['cafe', 'restaurant', 'fast_food', 'bar', 'bakery', 'ice_cream', 'pub', 'coffee'];

export function buildBirds(ctx, W, say, opts = {}) {
  const T = THREE, rng = ctx.rng('wildlife-birds'), L = ctx.L;
  const qn = ctx.quality?.level || ctx.quality?.name, Q = qn === 'low' ? 0.45 : qn === 'medium' ? 0.7 : 1;
  const group = new T.Group(); group.name = 'wildlife-birds';
  const matSolid = ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0, name: 'wl-bird' });
  const matWing = ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0, name: 'wl-bird-wing', side: 'double' });
  const matShadow = ctx.mat.decal('#202538', { transparent: true, opacity: 0.38, name: 'wl-shadow' });
  const birds = [], flocks = [];
  const hero = L.HERO, OB = L.OBELISK, WATER = L.RIVER_Y.water;
  const NOFEAR = !!opts.noFear;
  const threat = opts.threat || NO_THREAT;      // the vehicle the player drives (threat.js): the gulls of the water (posts, boat roofs) go from a hull that is COMING at them, from further than the walker's radius
  // every boat of the map (Fontanka + Moika + Griboedov + Winter Canal + Neva): descriptors with roof / railing slots (boats.js)
  const boatList = collectBoats(ctx, L);
  const boatTaken = new Set();
  const boatSlots = (bt) => bt.n;
  const boatPos = (bt, slot, t) => bt.pose(slot, t);
  /** where the player stands when the world is built (the animals start around there); the hero view when the player is still at the origin */
  const start = (() => { const p = W.player; return (p.x || p.z) && L.inPlay(p.x, p.z) ? { x: p.x, z: p.z } : { x: hero.x, z: hero.z }; })();

  // ------------------------------------------------------------------ spawn plan
  const n = (v) => Math.max(1, Math.round(v * Q));
  const plan = [];
  const add = (sp, count, extra) => { for (let i = 0; i < count; i++) plan.push({ sp, ...extra }); };
  add('crow', n(9), { mode: 'solo' });
  const nPost = W.perches.some((p) => p.kind === 'post') ? n(12) : 0;
  add('gull', nPost, { mode: 'post' });
  if (boatList.length) add('gull', Math.min(n(6), boatList.reduce((s, b) => s + boatSlots(b), 0)), { mode: 'boat' });
  if (W.waterPts.length) { add('gull', n(4), { mode: 'sky' }); if (boatList.some((b) => b.moving)) add('gull', n(2), { mode: 'escort' }); }
  add('swift', n(12), { mode: 'sky' });
  // flocks are added below (they need sites)

  // ------------------------------------------------------------------ instanced meshes
  const models = {};      // model name -> { body, head, wing, list: [bird] }
  const legGeo = legGeometry(), shGeo = shadowGeometry();
  const need = {};        // model -> count (birds + flock members)
  const countFor = (sp) => { need[SP[sp].model] = (need[SP[sp].model] || 0) + 1; };

  // ------------------------------------------------------------------ sites
  const R = rng;
  /** a free spot within [r0,r1] of (cx,cz) whose ground kind is in `kinds` (default any); tries up to 60 times */
  function spot(cx, cz, r0, r1, kinds, o = {}) {
    for (let k = 0, kn = o.tries || 60; k < kn; k++) {
      const a = R() * TAU, d = r0 + (r1 - r0) * Math.sqrt(R()), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (!W.ok(x, z, o)) continue;
      if (kinds && !kinds.includes(W.kind(x, z))) continue;
      return { x, z };
    }
    return null;
  }
  /** sort a list by the position hash (a stable shuffle); the key is computed once per element */
  const byHash = (arr) => { const k = arr.map((p) => ({ p, k: W.hash2(Math.round(p.x), Math.round(p.z)) })); k.sort((a, b) => a.k - b.k); for (let i = 0; i < arr.length; i++) arr[i] = k[i].p; return arr; };
  const sq = W.landmarks?.squareCentre || { x: L.SQUARE.x, z: L.SQUARE.z };
  const far = (arr, x, z, d) => !arr.some((p) => Math.hypot(p.x - x, p.z - z) < d);
  const dStart = (p) => Math.hypot(p.x - start.x, p.z - start.z);
  // cafes / bakeries / fast food on the pavements: the places where crumbs fall (crows forage there, pigeons and sparrows gather at the terraces)
  const tmB = {}; let tlB = performance.now(); const lapB = (k) => { const n = performance.now(); tmB[k] = (tmB[k] || 0) + n - tlB; tlB = n; };      // build time per phase (returned as .timing, ms)
  lapB('boats+start');
  const cafes = [];
  {
    const CG = 22, seen = new Map(), ck = (x, z) => Math.floor(x / CG) * 40009 + Math.floor(z / CG);        // the taken cafe points in a 22 m hash (this was a linear scan of up to 420 points for every POI)
    const farSeen = (x, z, d) => { const i = Math.floor(x / CG), j = Math.floor(z / CG); for (let a = i - 1; a <= i + 1; a++) for (let b = j - 1; b <= j + 1; b++) for (const p of seen.get(a * 40009 + b) || []) if (Math.hypot(p.x - x, p.z - z) < d) return false; return true; };
    const take = (q) => { const k = ck(q.x, q.z); (seen.get(k) || seen.set(k, []).get(k)).push(q); };
    for (const tr of ctx.services.props?.terraces || []) {                         // the summer verandas of the props module: the crumbs fall there
      if (!Number.isFinite(tr.x) || !L.inPlay(tr.x, tr.z) || !farSeen(tr.x, tr.z, 18)) continue;
      const q = W.ok(tr.x, tr.z, { road: 1.2 }) ? { x: tr.x, z: tr.z } : spot(tr.x, tr.z, 0.5, 3.5, null, { road: 1.2 });
      if (q) { take(q); cafes.push({ x: q.x, z: q.z, name: tr.name, terrace: true }); }
    }
    const list = POIS.filter((p) => FOOD_SUBS.includes(p.sub) && L.inPlay(p.x, p.z)).map((p) => ({ p, k: W.hash2(Math.round(p.x), Math.round(p.z)) })).sort((a, b) => a.k - b.k).map((e) => e.p);
    for (const p of list) {
      if (!farSeen(p.x, p.z, 10)) continue;                                        // (a POI within 10 m of a taken cafe point cannot give another: the 25 m pavement search below was the cost of the many rejected POIs)
      const s = W.streets?.nearestSidewalk?.(p.x, p.z, 25); if (!s) continue;
      if (!farSeen(s.x, s.z, 22)) continue;
      const q = W.ok(s.x, s.z, { road: 1.2 }) ? { x: s.x, z: s.z } : spot(s.x, s.z, 0.5, 3.5, null, { road: 1.2, tries: 10 });
      if (!q) continue;
      take({ x: q.x, z: q.z }); cafes.push({ x: q.x, z: q.z, name: p.name });
      if (cafes.length >= 320) break;
    }
  }
  lapB('cafes');
  // foraging sites for crows: cafe pavements, the benches and bins the rail / props modules publish, a few open places on the squares (zones.js) and the station forecourt
  const fsites = cafes.map((c) => ({ x: c.x, z: c.z, r: 5, tag: 'cafe' }));
  for (const b of [...(ctx.services.rail?.bins || []), ...(ctx.services.props?.bins || [])]) if (Number.isFinite(b.x) && L.inPlay(b.x, b.z)) fsites.push({ x: b.x, z: b.z, r: 4.5, tag: 'bin' });
  for (const b of [...(ctx.services.rail?.benches || []), ...(ctx.services.props?.benches || []), ...(ctx.services.landmarksF?.benchPoints || [])]) if (Number.isFinite(b.x) && L.inPlay(b.x, b.z)) fsites.push({ x: b.x, z: b.z, r: 4, tag: 'bench' });
  for (let i = 0; i < 10; i++) { const s = spot(sq.x, sq.z, 12, 80, null, { road: 1.5 }); if (s) fsites.push({ x: s.x, z: s.z, r: 6, tag: 'open' }); }
  const Z = zoneTable(ctx);
  for (const zn of Z) { const s = spot(zn.x, zn.z, zn.min || 0, zn.spread + 6, null, { road: 1.5 }); if (s) fsites.push({ x: s.x, z: s.z, r: 6, tag: 'open' }); }
  // the foraging sites are validated LAZILY, when a bird picks one (s.v: 1 = free ground, -1 = no free ground within 4 m): ~2 000 candidates were tested at build time, of which a flock of crows uses a handful
  const okSites = fsites;
  function siteOk(s) {
    if (s.v === undefined) {
      if (W.ok(s.x, s.z, { road: 1.5 })) s.v = 1;
      else { const q = spot(s.x, s.z, 0.5, 4); if (q) { s.x = q.x; s.z = q.z; s.v = 1; } else s.v = -1; }
    }
    return s.v === 1;
  }
  /** pick a foraging site; the first few are taken near the start; `from` = near the bird (within 150 m) */
  function pickSite(i, from) {
    let pool = i < 3 ? okSites.filter((s) => s.v !== -1 && dStart(s) < 160) : okSites;
    if (from) { const loc = okSites.filter((s) => s.v !== -1 && Math.hypot(s.x - from.x, s.z - from.z) < 150 && Math.hypot(s.x - from.x, s.z - from.z) > 12); if (loc.length) pool = loc; }
    const all = pool.length ? pool : okSites;
    for (let k = 0; k < 14 && all.length; k++) { const s = all[Math.floor(R() * all.length)]; if (siteOk(s)) return s; }
    return { x: sq.x, z: sq.z, r: 8 };
  }

  lapB('forage sites');
  // pigeon sites: every pigeon zone of zones.js (Kazan, Palace Square, the gardens, Gostiny Dvor, the obelisk, the station forecourt, the Anichkov Bridge ...) becomes a few free sites
  const pgSites = [], pgFar = (x, z, d = 10) => far(pgSites, x, z, d);
  const addPg = (s, r, tag, extra) => { if (s && pgFar(s.x, s.z)) { pgSites.push({ x: s.x, z: s.z, r, tag, w: 1, ...extra }); return true; } return false; };
  for (const zn of Z) {
    if (zn.kind !== 'pigeon') continue;
    for (let k = 0; k < zn.n; k++) for (let tries = 0; tries < 4; tries++) if (addPg(spot(zn.x, zn.z, zn.min || 0, zn.spread, null, { road: 1.5 }), zn.r, zn.tag, { w: zn.w, name: zn.name })) break;      // (a spot within 10 m of a site of the zone is tried again: a zone keeps its n sites)
  }
  const bridge = ctx.services.landmarksC?.bridge;
  if (bridge?.frame) {
    const bf = bridge.frame, cs = Math.cos(bf.theta), sn = Math.sin(bf.theta);
    for (const [u, v] of [[-14, 17.3], [13, -17.3], [-4, -17.3]]) addPg({ x: bf.cx + u * cs - v * sn, z: bf.cz + u * sn + v * cs }, 3.2, 'bridge', { w: 1, name: 'Голуби на Аничковом мосту · Pigeons on the Anichkov Bridge' });
  }
  // Nevsky: the benches of the props module on the avenue (the road beside a bench is "Невский проспект"), at least 110 m apart; and the cafe pavements of Nevsky
  {
    // (the bounding box of the avenue first: the candidates are the benches and cafes of the whole map, and a road query for each of them was the cost of this loop)
    let nb = null; for (const r of ROADS) if (r.name === 'Невский проспект' && r.pts) for (let i = 0; i < r.pts.length; i += 2) { nb = nb || { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 }; nb.x0 = Math.min(nb.x0, r.pts[i]); nb.x1 = Math.max(nb.x1, r.pts[i]); nb.z0 = Math.min(nb.z0, r.pts[i + 1]); nb.z1 = Math.max(nb.z1, r.pts[i + 1]); }
    const nevsky = (x, z) => !!nb && x > nb.x0 - 30 && x < nb.x1 + 30 && z > nb.z0 - 30 && z < nb.z1 + 30 && L.roadsNear(x, z, 25, { drivable: true }).some((h) => h.road.name === 'Невский проспект');
    const cand = [...(ctx.services.props?.benches || []).filter((b) => Number.isFinite(b.x) && L.inPlay(b.x, b.z)), ...cafes];
    byHash(cand);
    const nev = [];
    for (const bn of cand) {
      if (nev.length >= 9) break;
      if (!far(nev, bn.x, bn.z, 110) || !far(pgSites, bn.x, bn.z, 40) || !nevsky(bn.x, bn.z)) continue;
      const q = spot(bn.x, bn.z, 0.8, 2.5, null, { road: 1.5 }); if (q) nev.push({ x: q.x, z: q.z });
    }
    for (const q of nev) pgSites.push({ x: q.x, z: q.z, r: 4, tag: 'nevsky', w: 1.1, name: 'Голуби на Невском · Pigeons on Nevsky' });
  }
  lapB('pigeon sites');
  // sparrow sites: the garden zones and the cafe terraces, each with a shelter to dive into (the nearest tall tree within 35 m, else the nearest lamp top)
  const spSites = [];
  const shelterOf = (c, lampR = 25) => {
    let sh = null, bd = 35;
    W.treesNear(c.x, c.z, 35, (t) => { if (t.shrub || t.h < 6) return; const d = Math.hypot(t.x - c.x, t.z - c.z); if (d < bd) { bd = d; sh = t; } });
    if (!sh) { bd = 20; W.treesNear(c.x, c.z, 20, (t) => { if (!t.shrub || t.r < 0.8) return; const d = Math.hypot(t.x - c.x, t.z - c.z); if (d < bd) { bd = d; sh = t; } }); }       // a bush will do
    if (!sh) { bd = lampR; for (const p of W.perchesNear(c.x, c.z, 0, lampR, { kinds: ['lamp'] })) { const d = Math.hypot(p.x - c.x, p.z - c.z); if (d < bd) { bd = d; sh = { x: p.x, z: p.z, r: 0.3, h: p.y / 0.5, fixedY: p.y - 0.05 }; } } }
    return sh;
  };
  for (const zn of Z) {
    if (zn.kind !== 'sparrow') continue;
    const q = spot(zn.x, zn.z, 0, zn.spread, null, { road: 1.5 }); if (!q) continue;
    const sh = shelterOf(q, 48); if (sh) spSites.push({ x: q.x, z: q.z, r: zn.r, shelter: sh, tag: 'garden', w: zn.w, name: zn.name });   // a garden whose trees / lamps nobody publishes has no sparrow flock
  }
  const benchC = [...(ctx.services.props?.benches || []), ...(ctx.services.landmarksF?.benchPoints || [])].filter((b) => Number.isFinite(b.x) && L.inPlay(b.x, b.z));
  for (const c of byHash([...cafes, ...benchC])) {
    if (spSites.length >= 44) break;
    if (!far(spSites, c.x, c.z, 70) || !far(pgSites, c.x, c.z, 25)) continue;
    const q = c.terrace !== undefined || c.name ? c : (W.ok(c.x, c.z, { road: 1.5 }) ? c : spot(c.x, c.z, 0.8, 2.5, null, { road: 1.5 }));
    if (!q) continue;
    const sh = shelterOf(q);
    if (sh) spSites.push({ x: q.x, z: q.z, r: 3, shelter: sh, tag: c.name ? 'terrace' : 'bench', w: 1, name: c.name ? 'Воробьи у кафе · Sparrows at a cafe terrace' : 'Воробьи у скамеек · Sparrows at the benches' });
  }
  /** the flock sites nearest the start, heavier zones first (the director does the same around the player later) */
  const bestSites = (list, count) => {
    const sc = list.map((s) => ({ s, k: s.w * Math.exp(-dStart(s) / 130) * (0.75 + 0.5 * R()) })).sort((a, b) => b.k - a.k);
    const out = []; for (const e of sc) { if (out.length >= count) break; out.push(e.s); } return out;
  };

  lapB('sparrow sites');
  // flocks (the whole bird budget is 132: the flocks get what the solitary birds leave)
  const nPigeonFlocks = Math.min(pgSites.length, Math.max(1, Math.round(11 * Q)));
  const nSparrowFlocks = Math.min(spSites.length, Math.max(1, Math.round(4 * Q)));
  const fspec = [];
  for (const site of bestSites(pgSites, nPigeonFlocks)) fspec.push({ sp: 'pigeon', site, cnt: Math.max(3, Math.round(R.range(5, 7.5) * (0.6 + 0.4 * Q))), min: 4 });
  for (const site of bestSites(spSites, nSparrowFlocks)) fspec.push({ sp: 'sparrow', site, cnt: Math.max(3, Math.round(R.range(3, 5) * (0.6 + 0.4 * Q))), min: 3 });
  for (let guard = 0; guard < 99 && plan.length + fspec.reduce((n2, e) => n2 + e.cnt, 0) > Math.round(140 * Math.max(Q, 0.45)); guard++) { const big = fspec.filter((e) => e.cnt > e.min).sort((x, y) => y.cnt - x.cnt)[0]; if (!big) break; big.cnt--; }
  for (const e of fspec) {
    const f = { sp: e.sp, site: e.site, state: 'rest', t0: 0, away: 0, birds: [], scare: SP[e.sp].scare };
    e.site.taken = f; flocks.push(f); for (let k = 0; k < e.cnt; k++) plan.push({ sp: e.sp, mode: 'flock', flock: f });
  }
  for (const p of plan) countFor(p.sp);


  lapB('flock plan');
  // ------------------------------------------------------------------ create the meshes now that the counts are known
  for (const [model, cnt] of Object.entries(need)) {
    const m = birdModel(model), cap = cnt;
    const body = instanced(m.body, matSolid, cap, 'wl-' + model + '-body'), head = m.head ? instanced(m.head, matSolid, cap, 'wl-' + model + '-head') : null;
    const wing = instanced(m.wing, matWing, cap * 2, 'wl-' + model + '-wing');
    const o = { body, head, wing, list: [], sp: m.sp, cy: m.sp.y };
    for (const x of [body, head, wing]) if (x) group.add(x);
    models[model] = o;
  }
  const nGround = plan.filter((p) => GROUND.has(p.sp)).length;
  const legs = instanced(legGeo, matSolid, nGround * 2, 'wl-legs'); group.add(legs);
  const shadows = instanced(shGeo, matShadow, plan.length, 'wl-shadows'); ctx.noOutline(shadows); group.add(shadows);
  ctx.noOutline(legs);

  // ------------------------------------------------------------------ create the birds
  const WHITE = new T.Color(1, 1, 1), pigeonTint = [new T.Color(1, 1, 1), new T.Color(0.95, 0.95, 1.0), new T.Color(1.12, 1.08, 1.04), new T.Color(0.85, 0.86, 0.9), new T.Color(2.3, 2.3, 2.4)];
  let idc = 0;
  for (const p of plan) {
    const cfg = SP[p.sp], M = models[cfg.model];
    const b = {
      id: idc++, sp: p.sp, mode: p.mode, cfg, M, slot: M.list.length, x: 0, y: 0, z: 0, yaw: R() * TAU, st: 'ground', t0: 0, until: 0, ph: R() * TAU, seed: R(), flock: p.flock || null,
      act: 'idle', actEnd: 0, actT0: 0, tgt: null, home: null, perch: null, fl: null, orb: null, nextCall: 20 + R() * 80, callT0: -9, callDur: 0,
      tint: p.sp === 'pigeon' ? (R() < 0.12 ? pigeonTint[4] : pigeonTint[Math.floor(R() * 4)]) : null,
      py: 0, gy: 0, sx: 1,
    };
    M.list.push(b); birds.push(b);
    if (b.flock) b.flock.birds.push(b);
    p.bird = b; p.cfg = cfg;
  }

  // ------------------------------------------------------------------ placing / state changes
  const gY = (x, z) => W.groundY(x, z) + 0.01;                 // 1 cm above the paving: feet never coplanar with the surface
  function setGround(b, x, z, t, home) {
    b.st = 'ground'; b.x = x; b.z = z; b.y = gY(x, z); b.gy = b.y; b.home = home || b.home || { x, z, r: 5 }; b.tgt = null; b.act = 'idle'; b.actT0 = t; b.actEnd = t + R.range(0.5, 4); b.until = t + R.range(10, 30);
    if (b.perch) { if (b.perch.occ === b) b.perch.occ = null; b.perch = null; }
  }
  function setPerch(b, p, t) {
    if (b.perch && b.perch.occ === b) b.perch.occ = null;
    b.st = 'perch'; b.perch = p; p.occ = b; b.x = p.x; b.y = p.y; b.z = p.z; b.yaw = p.yaw + R.range(-0.4, 0.4); b.until = t + R.range(14, 45); b.act = 'idle'; b.actT0 = t; b.fl = null;
  }
  const dist2 = (b) => Math.hypot(b.x - W.player.x, b.z - W.player.z);

  /** start a flight from the bird's current pose to (tx,ty,tz); `perch` = the perch to take over on arrival */
  function launch(b, tx, ty, tz, t, o = {}) {
    if (b.perch && b.perch.occ === b) b.perch.occ = null;
    const dx = tx - b.x, dz = tz - b.z, D = Math.hypot(dx, dz), v = (b.cfg.fly || 9) * (o.fast ? 1.25 : 1);
    const dur = Math.max(o.minDur ?? 0.9, D / v + 0.7);
    b.fl = { x0: b.x, y0: b.y, z0: b.z, x1: tx, y1: ty, z1: tz, t0: t + (o.delay || 0), dur, D, arc: clamp(0.1 * D, 0.3, 4.5) * (o.flat ? 0.4 : 1), yaw0: b.yaw, yaw1: D > 0.05 ? Math.atan2(dx, dz) : b.yaw, perch: o.perch || null, flare: o.flare ?? true, glideF: D > 14 ? 1 : 0, home: o.home || null, done: o.done || null };
    if (o.perch) o.perch.occ = b;
    b.prevSt = b.st; b.st = 'fly'; b.perch = null; b.act = 'fly';
  }
  /** the perches of `cand` that a low straight flight from b reaches without crossing a building (tries a few random ones) */
  function reachable(b, cand) {
    for (let k = 0; k < 6 && cand.length; k++) { const i = Math.floor(R() * cand.length), p = cand[i]; if (W.flightClear(b.x, b.z, p.x, p.z)) return p; cand.splice(i, 1); }
    return null;
  }
  /** a bird's flight away from the player: to a perch 15-50 m off (away from the player), else along the ground. Returns false when a gull finds no post (it stays). */
  function flee(b, t, o = {}) {
    const px = W.player.x, pz = W.player.z, kinds = b.cfg.kinds || null;
    let cand = b.cfg.call ? W.perchesNear(b.x, b.z, o.r0 ?? 14, o.r1 ?? 55, { avoid: W.player, avoidR: 14, self: b, kinds }) : [];
    if (!cand.length && b.sp === 'gull') cand = W.perchesNear(b.x, b.z, 14, 200, { avoid: W.player, avoidR: 14, self: b, kinds });
    if (cand.length) {
      const ax = b.x - px, az = b.z - pz, am = Math.hypot(ax, az) || 1;
      const away = cand.filter((p) => ((p.x - b.x) * ax + (p.z - b.z) * az) / (am * (Math.hypot(p.x - b.x, p.z - b.z) || 1)) > 0.2);
      if (away.length) cand = away;
      const p = b.sp === 'gull' ? reachable(b, cand.slice()) : cand[Math.floor(R() * cand.length)];
      if (p) { launch(b, p.x, p.y, p.z, t, { perch: p, fast: true }); return true; }
    }
    if (b.sp === 'gull') return false;
    const a0 = Math.atan2(b.x - px, b.z - pz);
    for (let k = 0; k < 12; k++) {
      const a = a0 + R.range(-1.2, 1.2), d = R.range(12, 28), x = b.x + Math.sin(a) * d, z = b.z + Math.cos(a) * d;
      if (W.ok(x, z, { road: 1.5 })) { launch(b, x, gY(x, z), z, t, { fast: true, flat: true, home: { x, z, r: 6 } }); return true; }
    }
    launch(b, b.x + Math.sin(a0) * 10, 6, b.z + Math.cos(a0) * 10, t, { fast: true });
    return true;
  }

  // ------------------------------------------------------------------ boats: a gull on the roof of a tourist boat is a pure function of the boat's state(t)
  const br0 = bridge?.deck || null;
  const nearBridge = (x, z, r = 52) => !!br0 && Math.hypot(x - br0.x, z - br0.z) < r;
  function takeBoat(b, bi, slot) { b.st = 'boat'; b.boat = { bt: boatList[bi], bi, slot }; boatTaken.add(bi * BK + slot); b.act = 'idle'; b.perch = null; b.fl = null; }
  function leaveBoat(b) { if (b.boat) boatTaken.delete(b.boat.bi * BK + b.boat.slot); b.boat = null; }
  /** fly to a free boat roof within 90 m, aiming at the spot the boat will have reached on arrival */
  function boatReturn(b, t) {
    const order = boatList.map((_, i) => i).sort((i, j) => { const pi = boatPos(boatList[i], 0, t), pj = boatPos(boatList[j], 0, t); return Math.hypot(pi.x - b.x, pi.z - b.z) - Math.hypot(pj.x - b.x, pj.z - b.z); });
    for (const bi of order) {
      const bt = boatList[bi];
      for (let slot = 0; slot < boatSlots(bt); slot++) {
        if (boatTaken.has(bi * BK + slot)) continue;
        let dur = 2.5, P = null, D = 0;
        for (let k = 0; k < 3; k++) { P = boatPos(bt, slot, t + dur); D = Math.hypot(P.x - b.x, P.z - b.z); dur = Math.max(0.9, D / (b.cfg.fly || 9) + 0.7); }
        if (D > 90 || Math.hypot(P.x - W.player.x, P.z - W.player.z) < 10 || nearBridge(P.x, P.z, 85)) continue;
        boatTaken.add(bi * BK + slot);
        launch(b, P.x, P.y, P.z, t, { done: (bb, tt) => { boatTaken.delete(bi * BK + slot); takeBoat(bb, bi, slot); } });
        return true;
      }
    }
    return false;
  }

  // ------------------------------------------------------------------ gulls that circle: over the open Neva / Fontanka, or round a moving boat (escort)
  const openWater = W.waterPts.filter((q) => (q.key === 'neva' || q.key === 'fontanka') && q.clear >= 20);
  const movingBoats = boatList.filter((bt) => bt.moving);
  /** put a gull into a soaring orbit: round the water point `c` (open water: radius 25-60 m, height 11-24 m), or round the moving boat `follow` (radius 7-14 m, height 4-8 m) */
  function soarGull(b, c, follow) {
    b.st = 'soar'; b.perch = null; b.fl = null; b.boat = b.boat || null;
    const dir = R() < 0.5 ? 1 : -1;
    if (follow) {
      const Rr = R.range(7, 14);
      b.orb = { cx: 0, cz: 0, follow, R: Rr, h: R.range(4.5, 8), w: dir * R.range(6, 8) / Rr, th0: R() * TAU, hw: R.range(0.05, 0.1), ha: R.range(0.8, 2), tilt: 0 };
    } else {
      const Rmax = Math.max(14, Math.min(60, c.clear * 0.8)), Rr = R.range(Math.min(25, Rmax), Rmax);
      b.orb = { cx: c.x, cz: c.z, R: Rr, h: R.range(11, 24), w: dir * R.range(8.5, 10.5) / Rr, th0: R() * TAU, hw: R.range(0.05, 0.1), ha: R.range(2, 5), tilt: 0 };
    }
  }
  /** a moving boat near (x,z) (within r), the nearest first */
  function boatNear(x, z, r, t, skip) {
    let best = null, bd = r;
    for (const bt of movingBoats) { if (bt === skip) continue; const a = bt.at(t), d = Math.hypot(a.x - x, a.z - z); if (d < bd) { bd = d; best = bt; } }
    return best;
  }

  // ------------------------------------------------------------------ initial placement
  /** lay the flock out on its (new) site: free slots in the site circle, the members on them */
  function layoutFlock(f, t = 0) {
    f.slots = [];
    for (let k = 0; k < f.birds.length + 4; k++) { const q = spot(f.site.x, f.site.z, 0.3, f.site.r + (f.sp === 'pigeon' ? 1.5 : 0), null, { road: 1.5 }); if (q) f.slots.push(q); }
    for (const b of f.birds) {
      const q = f.slots.length ? f.slots[Math.floor(R() * f.slots.length)] : { x: f.site.x, z: f.site.z };
      setGround(b, q.x + R.range(-0.4, 0.4), q.z + R.range(-0.4, 0.4), t, { x: f.site.x, z: f.site.z, r: f.site.r });
      if (!W.ok(b.x, b.z, { road: 1 })) { b.x = q.x; b.z = q.z; }
      b.y = gY(b.x, b.z); b.gy = b.y; b.until = 1e9; b.hid = false;
    }
  }
  function placeInitial() {
    let ci = 0, gi = 0, si = 0;
    // posts: the ones nearest the start first (a third of the post gulls within 130 m of the start), the rest along the quays near it
    const byStart = (arr) => arr.map((p) => ({ p, d: Math.hypot(p.x - start.x, p.z - start.z) })).sort((a, c) => a.d - c.d).map((e) => e.p);      // (distances once: the comparator used to call hypot twice per comparison)
    const postsNear = byStart(W.perchesNear(start.x, start.z, 0, 900, { kinds: ['post', 'lion'] }));
    const boatsByStart = boatList.map((bt, i) => ({ i, d: Math.hypot(bt.at(0).x - start.x, bt.at(0).z - start.z) })).sort((a, c) => a.d - c.d).map((e) => e.i);
    const owc = byStart(openWater);
    for (const p of plan) {
      const b = p.bird; if (b.flock) continue;
      if (b.sp === 'swift') {
        const c = ci++ < 8 ? { x: start.x + R.range(-110, 110), z: start.z + R.range(-90, 120) } : { x: start.x + R.range(-600, 600), z: start.z + R.range(-300, 300) };
        b.st = 'soar';
        const Rr = R.range(55, 130), dir = R() < 0.5 ? 1 : -1;
        b.orb = { cx: c.x, cz: c.z, R: Rr, h: R.range(20, 45), w: dir * 13 / Rr, th0: R() * TAU, hw: R.range(0.05, 0.11), ha: R.range(3, 7), tilt: R.range(0.3, 0.9), ph2: R() * TAU, wob: R.range(0.15, 0.3) };
        continue;
      }
      if (b.sp === 'gull' && p.mode === 'sky') {
        const pool = owc.slice(0, Math.max(4, Math.floor(owc.length / 3)));
        if (pool.length) soarGull(b, pool[Math.floor(R() * pool.length)]); else b.st = 'dead';
        continue;
      }
      if (b.sp === 'gull' && p.mode === 'escort') {
        const bt = boatNear(start.x, start.z, 1e5, 0) || movingBoats[0];
        if (bt) soarGull(b, null, bt); else b.st = 'dead';
        continue;
      }
      if (b.sp === 'gull' && p.mode === 'boat') {
        let done = false;
        for (let i = 0; i < boatsByStart.length * 3 && !done; i++) { const bi = boatsByStart[(gi + i) % boatsByStart.length], bt = boatList[bi]; for (let s = 0; s < boatSlots(bt); s++) if (!boatTaken.has(bi * BK + s)) { takeBoat(b, bi, s); done = true; break; } }
        gi++;
        if (!done) b.st = 'dead';
        continue;
      }
      if (b.sp === 'gull') {                                                   // post gulls: the posts and lions nearest the start (every other one among the 40 nearest)
        const pool = postsNear.filter((q) => !q.occ && !q.dead).slice(0, 40);
        const cand = pool.length ? pool : W.perches.filter((q) => q.kind === 'post' && !q.occ && !q.dead);
        const pick = cand.length ? cand[Math.min(cand.length - 1, Math.floor(R() * R() * cand.length))] : null;
        if (pick) { setPerch(b, pick, R.range(-20, 0)); b.until = R.range(4, 30); } else b.st = 'dead';
        si++; continue;
      }
      if (b.sp === 'crow') {
        const onPerch = ci++ % 2 === 0 || R() < 0.15;
        const near = ci <= 6;
        if (onPerch) {
          const hz = CROW_HAUNTS[Math.floor(R() * CROW_HAUNTS.length)];
          const cand = W.perchesNear(near ? start.x : hz.x + R.range(-hz.r, hz.r), near ? start.z : hz.z + R.range(-hz.r, hz.r), 0, near ? 110 : 140, { kinds: b.cfg.kinds });
          if (cand.length) { setPerch(b, cand[Math.floor(R() * cand.length)], R.range(-20, 0)); b.until = R.range(4, 30); continue; }
        }
        const s = pickSite(ci); const q = spot(s.x, s.z, 0, s.r, null, { road: 1.5 }); if (q) { setGround(b, q.x, q.z, 0, { x: s.x, z: s.z, r: s.r }); continue; }
        const q2 = spot(sq.x, sq.z, 5, 60); if (q2) setGround(b, q2.x, q2.z, 0, { x: q2.x, z: q2.z, r: 6 }); else { b.st = 'dead'; }
        continue;
      }
    }
    // flocks: members scatter inside the site
    for (const f of flocks) layoutFlock(f, 0);
    for (let i = birds.length - 1; i >= 0; i--) if (birds[i].st === 'dead') birds[i].dead = true;
  }
  lapB('meshes+birds');
  placeInitial();
  lapB('placeInitial');


  // ------------------------------------------------------------------ pose output (reused)
  const P = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, pivot: 0, hy: 0, hp: 0, hz: 0, wTh: -0.4, wAl: 1.4, wBe: 0.2, wSs: 1, lSw: 0, lLift: 0, lTuck: 0, sh: 0, sx: 1, shy: 0, show: true };
  const reset = () => { P.pitch = 0; P.roll = 0; P.pivot = 0; P.hy = 0; P.hp = 0; P.hz = 0; P.wTh = -0.95; P.wAl = 1.42; P.wBe = 0.0; P.wSs = 0.82; P.lSw = 0; P.lLift = 0; P.lTuck = 0; P.sh = 1; };

  // ------------------------------------------------------------------ per-state update + pose
  let pSpeed = 0, lastPX = W.player.x, lastPZ = W.player.z;
  const playerEye = () => W.player.y + 1.52;
  /** distance to the player used for scaring (3D, so a crow on a lamp ignores people below it) */
  const dist3 = (b) => Math.hypot(b.x - W.player.x, b.z - W.player.z, (b.y + 0.2 - playerEye()) * 1.0);
  /** a gull (the bird of the quay posts and the boat roofs) that the player's boat / car is heading for; every other species keeps the walker's radius above (a car scares them through W.player as before) */
  const vScare = (b) => b.sp === 'gull' && threat.active && threat.scares(b.x, b.z, b.y, 4);
  const scareR = (b, perched) => (perched ? b.cfg.perchScare : b.cfg.scare) * (1 + 0.45 * clamp(pSpeed / 4, 0, 1.4));

  function updGround(b, t, dt) {
    const c = b.cfg;
    // --- fear
    if (!NOFEAR && b.act !== 'launch') {
      if (b.flock) { /* the flock decides */ }
      else if (dist3(b) < scareR(b, false) || vScare(b)) { flee(b, t); return; }
    }
    // --- scheduled call (crows / gulls): head thrown up, a sound at the start
    if (c.call && t >= b.nextCall && b.act !== 'walk') { if (startCall(b, t)) return; }
    if (t >= b.actEnd) nextAct(b, t);
    const walking = b.act === 'walk' || b.act === 'hop' || b.act === 'run';
    if (walking && b.tgt) {
      const dx = b.tgt.x - b.x, dz = b.tgt.z - b.z, d = Math.hypot(dx, dz);
      const v = (b.act === 'walk' ? c.walk : b.act === 'hop' ? c.hop : c.run) * (b.act === 'hop' ? 1 : 1);
      const want = Math.atan2(dx, dz);
      b.yaw += angDiff(b.yaw, want) * Math.min(1, dt * 9);
      const step = Math.min(d, v * dt);
      if (step > 1e-6) {
        const nx = b.x + dx / d * step, nz = b.z + dz / d * step;
        if (W.ok(nx, nz, { road: 1.0, tree: 0.1 })) { b.x = nx; b.z = nz; } else { b.act = 'idle'; b.actEnd = t + R.range(0.6, 2); b.tgt = null; }
      }
      b.ph += dt * (b.act === 'walk' ? (c.walk / (b.sp === 'pigeon' ? 0.1 : 0.16)) * 0.5 : b.act === 'hop' ? 0 : 7);
      if (d < 0.05) { b.act = 'idle'; b.actEnd = t + R.range(0.4, 2.5); b.tgt = null; }
    }
    // smooth ground level (pavements are +0.12)
    const gy = gY(b.x, b.z); b.y += clamp(gy - b.y, -0.5 * dt, 0.5 * dt) + (Math.abs(gy - b.y) < 0.003 ? gy - b.y : 0);
    // --- forage session over: go somewhere else
    if (t > b.until && !b.flock && b.act !== 'walk') {
      const r = R();
      if (r < 0.55 && c.call) { const cand = W.perchesNear(b.x, b.z, 8, 60, { self: b, avoid: W.player, avoidR: 10, kinds: c.kinds }); if (cand.length) { const p = cand[Math.floor(R() * cand.length)]; launch(b, p.x, p.y, p.z, t, { perch: p }); return; } }
      const s = pickSite(Math.floor(R() * 10) + 3, b), q = spot(s.x, s.z, 0, s.r, null, { road: 1.5 });
      if (q && Math.hypot(q.x - W.player.x, q.z - W.player.z) > 8) { launch(b, q.x, gY(q.x, q.z), q.z, t, { flat: true, home: { x: s.x, z: s.z, r: s.r } }); return; }
      b.until = t + R.range(10, 25);
    }
  }
  function nextAct(b, t) {
    const c = b.cfg, r = R();
    b.tgt = null;
    const target = (dmin, dmax) => {
      for (let k = 0; k < 8; k++) {
        const a = R() * TAU, d = R.range(dmin, dmax), x = b.x + Math.sin(a) * d, z = b.z + Math.cos(a) * d;
        if (Math.hypot(x - b.home.x, z - b.home.z) > b.home.r) continue;
        if (W.clear(b.x, b.z, x, z, { road: 1.2, tree: 0.1, step: 0.8 })) return { x, z };
      }
      return null;
    };
    b.actT0 = t;
    switch (b.sp) {
      case 'sparrow': {
        if (r < 0.5) { const q = target(0.3, 1.4); if (q) { b.act = 'hop'; b.tgt = q; b.actEnd = t + Math.hypot(q.x - b.x, q.z - b.z) / c.hop + 0.15; b.hopT0 = t; return; } }
        if (r < 0.85) { b.act = 'peck'; b.actEnd = t + R.range(0.5, 1.6); return; }
        b.act = 'idle'; b.actEnd = t + R.range(0.3, 1.2); return;
      }
      case 'pigeon': {
        if (r < 0.45) { const q = target(0.6, 3); if (q) { b.act = 'walk'; b.tgt = q; b.actEnd = t + Math.hypot(q.x - b.x, q.z - b.z) / c.walk + 0.3; return; } }
        if (r < 0.8) { b.act = 'peck'; b.actEnd = t + R.range(0.8, 3.2); return; }
        b.act = 'idle'; b.actEnd = t + R.range(0.8, 3); return;
      }
      default: {   // crows
        if (r < 0.42) { const q = target(1, 4.5); if (q) { b.act = 'walk'; b.tgt = q; b.actEnd = t + Math.hypot(q.x - b.x, q.z - b.z) / c.walk + 0.4; return; } }
        if (r < 0.68) { b.act = 'peck'; b.actEnd = t + R.range(1, 3.2); return; }
        if (r < 0.76) { b.act = 'preen'; b.actEnd = t + R.range(1.5, 3.5); return; }
        b.act = 'idle'; b.actEnd = t + R.range(1.5, 5);
      }
    }
  }
  function startCall(b, t) {
    if (t < callGate) { b.nextCall = callGate + R.range(0.5, 3); return false; }
    callGate = t + 2.2;
    b.nextCall = t + R.range(28, 95); b.callT0 = t; b.callDur = 1.1 + R() * 0.5; b.actEnd = Math.max(b.actEnd, t + b.callDur); b.act = 'call'; b.tgt = null;
    if (Math.hypot(b.x - W.player.x, b.z - W.player.z) < 110) say(b.cfg.call, { x: b.x, y: b.y + 0.3, z: b.z }, 0.85 + 0.3 * R());
    return false;
  }
  let callGate = 0;

  function updPerch(b, t, dt) {
    const c = b.cfg;
    if (b.perch && b.perch.kind === 'tree' && b.perch.tree && b.perch.tree.crown) b.y = b.perch.y;                  // a garden crown perch rides the LOD of the crown the camera draws (the y getter of wildlife/world.js): the crow stays on the leaves when the level pops (T7 fix round 2)
    if (!NOFEAR && (dist3(b) < scareR(b, true) * (b.perch?.kind === 'tree' ? 0.8 : 1) || vScare(b))) { if (flee(b, t, { r0: 18, r1: 70 })) return; }
    if (c.call && t >= b.nextCall && b.act !== 'call') startCall(b, t);
    if (b.act === 'call' && t > b.callT0 + b.callDur) { b.act = 'idle'; b.actT0 = t; }
    if (t > b.until) {
      const r = R();
      if (b.sp === 'gull' && r < 0.3 && boatList.length && boatReturn(b, t)) return;                       // back to a boat roof
      if (r < 0.55) { const cand = W.perchesNear(b.x, b.z, 10, 90, { self: b, avoid: W.player, avoidR: 10, kinds: c.kinds }); const p = cand.length ? (b.sp === 'gull' ? reachable(b, cand) : cand[Math.floor(R() * cand.length)]) : null; if (p) { launch(b, p.x, p.y, p.z, t, { perch: p }); return; } }
      if (r < 0.9 && b.sp !== 'gull') { const s = pickSite(Math.floor(R() * 12) + 3, b), q = spot(s.x, s.z, 0, s.r, null, { road: 1.5 }); if (q && Math.hypot(q.x - W.player.x, q.z - W.player.z) > 9) { const home = { x: s.x, z: s.z, r: s.r }; launch(b, q.x, gY(q.x, q.z), q.z, t, { home }); return; } }
      b.until = t + R.range(10, 35);
    }
  }
  /** a gull on a boat roof: carried by the boat (pure function of its state), leaves when the player comes near or the boat nears the Anichkov Bridge (the arches clear the roof by 35 cm) */
  
  function updBoat(b, t) {
    const bo = b.boat; if (!bo) return;
    const p = boatPos(bo.bt, bo.slot, t); b.x = p.x; b.y = p.y; b.z = p.z; b.yaw = p.yaw + (b.seed - 0.5) * 0.7;
    const c = b.cfg;
    if (nearBridge(p.x, p.z) || (!NOFEAR && (dist3(b) < scareR(b, true) || vScare(b)))) {
      const keep = bo; leaveBoat(b);
      if (flee(b, t, { r0: 10, r1: 70 })) return;
      takeBoat(b, keep.bi, keep.slot); return;
    }
    if (c.call && t >= b.nextCall && b.act !== 'call') startCall(b, t);
    if (b.act === 'call' && t > b.callT0 + b.callDur) { b.act = 'idle'; b.actT0 = t; }
  }
  function updFly(b, t, dt) {
    const f = b.fl; if (t < f.t0) return;
    const u = clamp((t - f.t0) / f.dur, 0, 1);
    if (u >= 1) {
      b.x = f.x1; b.z = f.z1; b.y = f.y1; b.fl = null;
      if (f.done) { f.done(b, t); return; }
      if (f.perch && !f.perch.dead) { setPerch(b, f.perch, t); b.until = t + R.range(12, 45); return; }
      setGround(b, f.x1, f.z1, t, f.home || { x: f.x1, z: f.z1, r: 6 });
      b.until = t + R.range(12, 30); if (b.flock) b.until = 1e9;
      return;
    }
    const s = 0.3 * u + 0.7 * sm(u);
    b.x = lerp(f.x0, f.x1, s); b.z = lerp(f.z0, f.z1, s);
    const dy = f.y1 - f.y0, yb = dy >= 0 ? 1 - Math.pow(1 - u, 2) : Math.pow(u, 2);
    b.y = f.y0 + dy * yb + f.arc * Math.sin(Math.PI * u) * (dy > 3 ? 0.4 : 1);
    b.yaw = f.yaw0 + angDiff(f.yaw0, f.yaw1) * sm(u / 0.22);
  }

  // flocks -----------------------------------------------------------------
  function flockUpdate(f, t) {
    if (f.state === 'rest') {
      if (NOFEAR) return;
      let hit = false;
      const R2 = f.scare * (1 + 0.5 * clamp(pSpeed / 4, 0, 1.4));
      for (const b of f.birds) if (!b.dead && b.st === 'ground' && Math.hypot(b.x - W.player.x, b.z - W.player.z) < R2 && Math.abs(W.player.y + 1.0 - b.y) < 7) { hit = true; break; }
      if (hit) flockScare(f, t);
    } else if (f.state === 'away') {
      if (t >= f.t0 + f.away) {
        if (Math.hypot(f.site.x - W.player.x, f.site.z - W.player.z) < (f.sp === 'pigeon' ? 13 : 7)) { f.away += 2.5; return; }
        flockReturn(f, t);
      }
    } else if (f.state === 'back') {
      if (f.birds.every((b) => b.dead || b.st === 'ground')) f.state = 'rest';
    }
  }
  function flockScare(f, t) {
    f.state = 'away'; f.t0 = t; f.away = f.sp === 'pigeon' ? R.range(9, 15) : R.range(8, 12);
    const px = W.player.x, pz = W.player.z, ax = f.site.x - px, az = f.site.z - pz, am = Math.hypot(ax, az) || 1;
    let nx = ax / am, nz = az / am;
    if (f.sp === 'pigeon') {
      // the loop must stay in the open: of a few candidate circles take the one with the fewest samples inside a building (the streets of Petersburg are canyons)
      let Rr = R.range(11, 17), cx = f.site.x + nx * Rr * 0.9, cz = f.site.z + nz * Rr * 0.9, bestB = 99;
      for (let k = 0; k < 24 && bestB > 0; k++) {
        const r2 = k === 0 ? Rr : k < 10 ? R.range(9, 17) : R.range(4.5, 9), a2 = k === 0 ? Math.atan2(nz, nx) : R() * TAU, x2 = f.site.x + Math.cos(a2) * r2 * 0.9, z2 = f.site.z + Math.sin(a2) * r2 * 0.9;
        let bl = 0; for (let q = 0; q < 16; q++) { const th = q / 16 * TAU; if (L.insideBuilding(x2 + r2 * Math.cos(th), z2 + r2 * Math.sin(th), 2.5)) bl++; }
        if (bl < bestB) { bestB = bl; Rr = r2; cx = x2; cz = z2; }
      }
      const th0 = Math.atan2(f.site.z - cz, f.site.x - cx), dir = R() < 0.5 ? 1 : -1, H = R.range(5.5, 9);
      f.loop = { cx, cz, R: Rr, th0, dir, H, t0: t };
      f.birds.forEach((b, i) => {
        if (b.dead || b.st !== 'ground') return;
        if (b.perch && b.perch.occ === b) b.perch.occ = null;
        b.st = 'orbit'; b.act = 'orbit';
        b.orb = { t0: t + R() * 0.55, x0: b.x, z0: b.z, y0: b.y, R: Rr + R.range(-2.2, 2.2), cx, cz, th0: th0 + R.range(-0.3, 0.3), dir, H: H + R.range(-1.2, 1.6), w: 11 * (0.9 + 0.2 * R()), in: 1.3 + R() * 0.6, ph0: R() * TAU };
        b.orb.w = dir * b.orb.w / b.orb.R; b.until = 0;
      });
      if (Math.hypot(f.site.x - W.player.x, f.site.z - W.player.z) < 60) say('wings', { x: f.site.x, y: 1.5, z: f.site.z }, 1);
    } else {      // sparrows: dive into the nearest bush / tree, one by one
      const sh = f.site.shelter;
      f.birds.forEach((b) => {
        if (b.dead || b.st !== 'ground') return;
        let tx, ty, tz;
        if (sh && Math.hypot(sh.x - b.x, sh.z - b.z) < 42) { const a = R() * TAU, d = Math.sqrt(R()) * sh.r * 0.55; tx = sh.x + Math.cos(a) * d; tz = sh.z + Math.sin(a) * d; ty = sh.fixedY ?? Math.max(0.9, sh.h * R.range(0.35, 0.7)); }
        else { const a = Math.atan2(b.x - px, b.z - pz) + R.range(-0.6, 0.6), d = R.range(9, 16); tx = b.x + Math.sin(a) * d; tz = b.z + Math.cos(a) * d; ty = R.range(1.5, 4); if (!W.ok(tx, tz)) { tx = b.x; tz = b.z; } }
        launch(b, tx, ty, tz, t, { delay: R() * 0.35, fast: true, done: (bb, tt) => { bb.st = 'hide'; bb.x = tx; bb.y = ty; bb.z = tz; bb.act = 'idle'; bb.hideT = tt; bb.yaw = R() * TAU; } });
      });
    }
  }
  function flockReturn(f, t) {
    f.state = 'back';
    for (const b of f.birds) {
      if (b.dead) continue;
      let q = f.slots.length ? f.slots[Math.floor(R() * f.slots.length)] : f.site;
      for (let k = 0; k < 6 && Math.hypot(q.x - W.player.x, q.z - W.player.z) < 3.5; k++) q = f.slots[Math.floor(R() * f.slots.length)] || q;
      const home = { x: f.site.x, z: f.site.z, r: f.site.r };
      if (b.st === 'orbit') {
        let jx = q.x + R.range(-0.3, 0.3), jz = q.z + R.range(-0.3, 0.3); if (!W.ok(jx, jz, { road: 1 })) { jx = q.x; jz = q.z; }
        b.orb.land = { t0: t + R() * 0.6, x1: jx, z1: jz, dur: 0 };
      } else if (b.st === 'hide') {
        launch(b, q.x, gY(q.x, q.z), q.z, t, { delay: R() * 4, flat: true, home });
        b.until = 1e9;
      } else if (b.st === 'ground') { /* nothing */ }
    }
  }
  function updOrbit(b, t, dt) {
    const o = b.orb; if (t < o.t0) return;
    const e = t - o.t0;
    if (o.land && t >= o.land.t0) {          // descent to the landing spot
      const l = o.land;
      if (!l.started) {                          // freeze the starting point once
        l.started = true; l.sx = b.x; l.sy = b.y; l.sz = b.z; l.sd = Math.hypot(l.x1 - b.x, l.z1 - b.z); l.dur = Math.max(1.6, l.sd / 8 + 0.6);
        l.gy = gY(l.x1, l.z1); l.yaw0 = b.yaw; l.yaw1 = Math.atan2(l.x1 - b.x, l.z1 - b.z);
      }
      const u = clamp((t - l.t0) / l.dur, 0, 1);
      if (u >= 1) { setGround(b, l.x1, l.z1, t, { x: b.flock.site.x, z: b.flock.site.z, r: b.flock.site.r }); b.until = 1e9; b.orb = null; b.fl = null; return; }
      const s = 0.25 * u + 0.75 * sm(u);
      b.x = lerp(l.sx, l.x1, s); b.z = lerp(l.sz, l.z1, s); b.y = lerp(l.sy, l.gy, Math.pow(u, 1.6)) + 0.8 * Math.sin(Math.PI * u);
      b.yaw = l.yaw0 + angDiff(l.yaw0, l.yaw1) * sm(u / 0.3);
      b.landU = u;
      return;
    }
    const th = o.th0 + o.w * e, cx = o.cx + o.R * Math.cos(th), cz = o.cz + o.R * Math.sin(th);
    const hh = o.H * sm(e / o.in), k = sm(e / o.in);
    b.x = lerp(o.x0, cx, k); b.z = lerp(o.z0, cz, k); b.y = lerp(o.y0, hh + 0.6 * Math.sin(e * 0.9 + o.ph0), k);
    // heading = tangent of the circle (counter / clockwise)
    const hx = -Math.sin(th) * Math.sign(o.w), hz = Math.cos(th) * Math.sign(o.w);
    const want = Math.atan2(hx, hz);
    b.yaw = e < o.in ? b.yaw + angDiff(b.yaw, want) * Math.min(1, dt * 4) : want;
    b.landU = -1;
  }

  // sky-high soarers ---------------------------------------------------------
  function posSoar(b, t) {
    const o = b.orb, th = o.th0 + o.w * t;
    if (b.sp === 'gull') {
      let cx = o.cx, cz = o.cz; if (o.follow) { const a = o.follow.at(t); cx = a.x; cz = a.z; }                       // an escort gull circles the moving boat
      b.x = cx + o.R * Math.cos(th); b.z = cz + o.R * Math.sin(th); b.y = o.h + o.ha * Math.sin(t * o.hw + o.th0);
      const tx = -Math.sin(th) * Math.sign(o.w), tz = Math.cos(th) * Math.sign(o.w); b.yaw = Math.atan2(tx, tz); return;
    }
    // swifts: a wide loop with a lissajous wobble so that the track is not a circle
    const wob = 1 + o.wob * Math.sin(th * 1.7 + o.ph2);
    b.x = o.cx + o.R * wob * Math.cos(th); b.z = o.cz + o.R * wob * Math.sin(th) * (0.6 + 0.4 * Math.cos(o.ph2));
    b.y = o.h + o.ha * Math.sin(t * o.hw * TAU * 0.3 + o.th0) + 0.25 * o.ha * Math.sin(t * 0.7 + o.ph2);
    const e = 0.02, th2 = th + o.w * e, wob2 = 1 + o.wob * Math.sin(th2 * 1.7 + o.ph2);
    const x2 = o.cx + o.R * wob2 * Math.cos(th2), z2 = o.cz + o.R * wob2 * Math.sin(th2) * (0.6 + 0.4 * Math.cos(o.ph2));
    b.yaw = Math.atan2(x2 - b.x, z2 - b.z);
  }

  // hidden sparrows (in the bush) ---------------------------------------------
  // (a hidden bird is simply drawn small and still, perched at its twig; the flock return launches it)

  // ------------------------------------------------------------------ poses (pure functions of t within the state)
  function poseGround(b, t) {
    const c = b.cfg, E = BIRD_SPECIES[c.model], ph = b.ph + b.seed * 6, tt = t + b.seed * 50;
    reset();
    P.x = b.x; P.y = b.y; P.z = b.z; P.yaw = b.yaw;
    const walking = (b.act === 'walk' || b.act === 'run') && b.tgt;
    const hopping = b.act === 'hop' && b.tgt;
    const legL = E.legs ? E.legs.len : 0.1;
    if (b.sp === 'pigeon') {
      if (walking) {
        const cyc = ph / TAU * 2, u = cyc - Math.floor(cyc), A = 0.028;                    // head bob: thrust forward fast, then hold while the body catches up
        P.hz = A * (u < 0.3 ? -1 + 2 * sm(u / 0.3) : 1 - 2 * (u - 0.3) / 0.7);
        P.lSw = 0.6 * Math.sin(ph); P.lLift = 0.5;
        P.y += 0.004 * Math.abs(Math.sin(ph));
      } else if (b.act === 'peck') {
        const k = pulse(tt, 0.55 + b.seed * 0.2, 0.28); P.pitch = 0.75 * k; P.hp = 0.6 * k; P.y -= 0.02 * k; P.hz = 0.02 * k;
      } else { P.hy = 0.5 * Math.sin(tt * 0.9) * (Math.sin(tt * 0.31) > 0.1 ? 1 : 0.2); P.hz = 0.012 * Math.sin(tt * 5) * (Math.sin(tt * 0.5) > 0.7 ? 1 : 0); }
    } else if (b.sp === 'crow' || b.sp === 'gull') {
      if (walking) {
        P.lSw = 0.5 * Math.sin(ph); P.lLift = 0.45; P.hz = 0.006 * Math.sin(ph * 2); P.y += 0.006 * Math.abs(Math.sin(ph)); P.pitch = 0.04 * Math.sin(ph);
        P.hy = 0.15 * Math.sin(tt * 0.8);
      } else if (b.act === 'peck') {
        const k = pulse(tt, 0.9 + b.seed * 0.3, 0.3); P.pitch = 0.55 * k; P.hp = 0.75 * k; P.y -= 0.015 * k; P.hz = 0.03 * k; P.hy = 0.25 * Math.sin(tt * 1.7);
      } else if (b.act === 'preen') {
        const k = sm(((t - b.actT0) % 3.4) / 0.35) * (1 - sm(((t - b.actT0) % 3.4 - 2.2) / 0.3)); P.hp = 0.9 * k; P.hy = 1.2 * k * (b.seed < 0.5 ? 1 : -1) + 0.15 * Math.sin(tt * 14) * k;
      } else if (b.act === 'call') { callPose(b, t, tt); }
      else { P.hy = 0.7 * Math.sin(tt * 0.6) * (0.3 + 0.7 * Math.max(0, Math.sin(tt * 0.19))); P.hp = -0.05 + 0.05 * Math.sin(tt * 0.7); P.pitch = 0.03 * Math.sin(tt * 1.7); }
    }
    P.pivot = 0; P.sh = 1;
    void legL;
  }
  function pulse(t, period, duty) { const u = (t / period) % 1; return u < duty ? Math.sin((u / duty) * Math.PI) : 0; }
  function hopU(b, t, per) { const u = ((t - (b.actT0 || 0)) / per) % 1; return u; }
  function callPose(b, t, tt) {
    const e = t - b.callT0, d = b.callDur, k = sm(e / 0.15) * (1 - sm((e - d + 0.2) / 0.2));
    const n = 3, bob = Math.max(0, Math.sin(clamp(e / d, 0, 1) * n * Math.PI));
    P.hp = (-0.4 - 0.35 * bob) * k; P.pitch = (0.14 + 0.12 * bob) * k; P.hz = 0.01 * bob * k; P.y += 0.01 * bob * k;
  }
  function posePerch(b, t) {
    const tt = t + b.seed * 50, ph = b.ph;
    reset();
    P.x = b.x; P.y = b.y; P.z = b.z; P.yaw = b.yaw;
    P.lSw = 0; P.lLift = 0;
    if (b.act === 'call') { callPose(b, t, tt); P.hy = 0; }
    else {
      P.hy = 0.75 * Math.sin(tt * 0.55 + ph) * (0.35 + 0.65 * Math.max(0, Math.sin(tt * 0.17 + ph)));
      P.hp = -0.05 + 0.06 * Math.sin(tt * 0.7);
      const pre = (tt / 19) % 1;                                                                       // a preen every ~19 s
      if (pre < 0.09) { const k = Math.sin(pre / 0.09 * Math.PI); P.hp = 0.9 * k; P.hy = 1.15 * k * (b.seed < 0.5 ? 1 : -1) + 0.12 * Math.sin(tt * 15) * k; }
      P.pitch = 0.05 * Math.sin(tt * 1.3 + 2) * (Math.sin(tt * 0.4) > 0.5 ? 1 : 0);                      // tail flick
    }
    P.pivot = 0; P.sh = 0;
  }
  function poseFly(b, t, dt) {
    const f = b.fl, c = b.cfg, u = f ? clamp((t - f.t0) / f.dur, 0, 1) : 0, E = BIRD_SPECIES[c.model];
    reset();
    P.x = b.x; P.y = b.y; P.z = b.z; P.yaw = b.yaw; P.pivot = E.y;
    const dy = f ? (f.y1 - f.y0) : 0;
    const climb = f ? clamp(Math.atan2(f.y1 - f.y0, Math.max(0.5, f.D)) * 0.9, -0.6, 0.8) * Math.sin(Math.PI * u) : 0;
    let flare = 0, glide = 0;
    if (f) {
      flare = f.flare ? sm((u - 0.84) / 0.16) : 0;
      glide = f.glideF * sm((u - 0.28) / 0.12) * (1 - sm((u - 0.7) / 0.12)) * 0.85;
    }
    const lowSpeed = u < 0.18 ? 1 : 0;
    P.pitch = -climb * 0.8 - 0.75 * flare + (dy < -3 ? 0.15 * Math.sin(Math.PI * u) : 0);
    wingFlap(b, t, glide, flare, lowSpeed);
    P.lTuck = 1 - 0.5 * flare; P.lSw = 0; P.lLift = 0;
    P.roll = 0;
    P.hy = 0; P.hp = 0.1 * flare;
    P.sh = clamp(1 - b.y / 4, 0, 1);
    if (f && flare > 0.1) { P.lTuck = 1 - flare; P.lSw = -0.3 * flare; }
  }
  function wingFlap(b, t, glide, flare, strong) {
    const c = b.cfg, ph = b.ph;
    const s = Math.sin(ph), cs = Math.cos(ph);
    const A = (b.sp === 'sparrow' ? 0.85 : 0.95) * (1 + 0.25 * strong) * (1 - glide) + 0.1 * glide;
    const th0 = 0.18 + 0.5 * flare;
    P.wTh = th0 + A * s; P.wAl = 0.2 + 0.28 * Math.max(0, cs) * (1 - glide) + 0.15 * glide - 0.1 * flare; P.wBe = -0.12 * cs; P.wSs = 1 - 0.3 * Math.max(0, cs) * (1 - glide);
    if (b.sp === 'sparrow') { const burst = Math.sin(t * 9 + b.seed * 30) > -0.3 ? 1 : 0; if (!burst) { P.wTh = 0.05; P.wAl = 1.0; P.wSs = 0.55; } }   // bounding flight: flap bursts, wings pulled in between
  }
  function poseOrbit(b, t, dt) {
    const o = b.orb, c = b.cfg, E = BIRD_SPECIES[c.model];
    reset();
    P.x = b.x; P.y = b.y; P.z = b.z; P.yaw = b.yaw; P.pivot = E.y;
    if (t < o.t0) { poseGround(b, t); b.landU = -1; return; }
    const e = t - o.t0, takeoff = 1 - sm(e / 1.2), landing = b.landU > 0 ? sm(b.landU / 0.7) : 0;
    const glide = sm((e - 3) / 1) * (Math.sin(e * 0.45 + o.ph0) > 0.5 ? 0.9 : 0) * (landing > 0 ? 0 : 1);
    wingFlap(b, t, glide, landing > 0.4 ? landing : 0, takeoff);
    P.roll = -Math.sign(o.w) * 0.32 * (1 - takeoff) * (landing > 0 ? 1 - landing : 1);
    P.pitch = -0.2 * takeoff - 0.7 * (b.landU > 0.7 ? sm((b.landU - 0.7) / 0.3) : 0);
    P.lTuck = 1 - (b.landU > 0.7 ? sm((b.landU - 0.7) / 0.3) : 0); P.sh = clamp(1 - b.y / 5, 0, 1);
  }
  function poseSoar(b, t) {
    const c = b.cfg, o = b.orb, E = BIRD_SPECIES[c.model];
    reset();
    P.x = b.x; P.y = b.y; P.z = b.z; P.yaw = b.yaw; P.pivot = 0;
    const bank = Math.sign(o.w) * (b.sp === 'gull' ? 0.3 : 0.5 * (o.tilt || 0.5) + 0.12 * Math.sin(t * 0.6 + b.seed * 20));
    P.roll = -bank;
    if (b.sp === 'swift') {
      // flap bursts: a few quick beats, then a long glide with the sickle wings swept back
      const g = (t * 0.42 + b.seed * 9) % 1, burst = g < 0.22 ? Math.sin(Math.PI * g / 0.22) : 0;
      const ph = t * 24 + b.seed * 40, s = Math.sin(ph);
      P.wTh = 0.1 + 0.55 * burst * s; P.wAl = 0.35 - 0.1 * burst; P.wSs = 1 - 0.1 * burst * Math.max(0, Math.cos(ph)); P.pitch = -0.04 * burst;
    } else {
      // gull: long glides on level wings, now and then a run of slow deep wing beats
      const ph = t * 0.9 + b.seed * 9, fa = sm((Math.sin(t * 0.33 + b.seed * 40) - 0.1) / 0.3);
      P.wTh = 0.1 + 0.07 * Math.sin(t * 0.7 + b.seed) + 0.8 * fa * Math.sin(t * TAU * 2.6 + b.seed * 10); P.wAl = 0.16 + 0.12 * fa * Math.max(0, Math.cos(t * TAU * 2.6 + b.seed * 10)); P.wBe = 0.05 * Math.sin(ph) * (1 - fa); P.pitch = -0.06 * fa;
    }
    P.lTuck = 1; P.sh = 0; void E;
  }
  function poseHide(b, t) {
    reset();
    const tt = t + b.seed * 50;
    P.x = b.x; P.y = b.y - 0.04; P.z = b.z; P.yaw = b.yaw + 0.5 * Math.sin(tt * 0.7); P.pivot = 0;
    P.hy = 0.9 * Math.sin(tt * 2.6); P.hp = 0.1 * Math.sin(tt * 4); P.lTuck = 0.2; P.sh = 0;
  }

  // ------------------------------------------------------------------ writing the instance matrices
  const _M0 = new T.Matrix4(), _A = new T.Matrix4(), _B = new T.Matrix4(), _Q = new T.Quaternion(), _E = new T.Euler(), _V = new T.Vector3(), _S = new T.Vector3(), _C = new T.Color();
  const _wing = new T.Matrix4(), _leg = new T.Matrix4(), _sh = new T.Matrix4();
  function writeBird(b, t) {
    const M = b.M, c = b.cfg, E = M.sp, s = c.scale;
    _E.set(P.pitch, P.yaw, P.roll, 'YXZ'); _Q.setFromEuler(_E);
    _M0.compose(_V.set(P.x, P.y, P.z), _Q, _S.set(s, s, s));
    if (P.pivot) _M0.multiply(_A.makeTranslation(0, -P.pivot, 0));
    M.body.setMatrixAt(b.slot, _M0);
    if (M.head) {
      _B.copy(_M0).multiply(_A.makeTranslation(0, E.neck[1], E.neck[0] + P.hz));
      _E.set(P.hp, P.hy, 0, 'YXZ'); _B.multiply(_A.makeRotationFromEuler(_E));
      M.head.setMatrixAt(b.slot, _B);
    }
    const sh = E.wing.shoulder;
    for (let k = 0; k < 2; k++) {
      const side = k === 0 ? 1 : -1;
      _wing.copy(_M0).multiply(_A.makeTranslation(side * sh[0], sh[1], sh[2]));
      _E.set(0, side * P.wAl, side * P.wTh, 'ZYX'); _wing.multiply(_A.makeRotationFromEuler(_E));
      if (P.wBe) _wing.multiply(_A.makeRotationX(P.wBe));
      _wing.multiply(_A.makeScale(side * P.wSs, 1, 1));
      M.wing.setMatrixAt(b.slot * 2 + k, _wing);
    }
    if (E.legs && b.legSlot !== undefined) {
      const lg = E.legs;
      for (let k = 0; k < 2; k++) {
        const side = k === 0 ? 1 : -1, sw = P.lSw * (k ? -1 : 1), tuck = P.lTuck;
        const lift = P.lLift * Math.max(0, Math.cos(b.ph + (k ? Math.PI : 0))) * 0;       // (foot lift is baked into the swing / scale)
        _leg.copy(_M0).multiply(_A.makeTranslation(side * lg.hip[0], lg.hip[1] - (P.pivot ? 0 : 0), lg.hip[2]));
        _leg.multiply(_A.makeRotationX(sw + tuck * 1.25));
        const len = lg.len * (1 - 0.45 * tuck - 0.22 * P.lLift * Math.max(0, Math.sin(b.ph + (k ? 0 : Math.PI)))) + lift;
        _leg.multiply(_A.makeScale(lg.r, len, lg.r));
        legs.setMatrixAt(b.legSlot * 2 + k, _leg);
      }
    }
    // contact shadow
    if (P.sh > 0.02 && !b.noShadow && !L.inRiver(P.x, P.z)) {
      const gy = b.st === 'perch' ? 0 : (b.gy || 0), size = (E.bs[2] * 2.4 + 0.1) * s * P.sh;
      _E.set(0, P.yaw, 0, 'YXZ'); _Q.setFromEuler(_E);
      _sh.compose(_V.set(P.x, (b.st === 'ground' ? P.y : gY(P.x, P.z)) + 0.012, P.z), _Q, _S.set(size * 0.8, 1, size));
      shadows.setMatrixAt(b.shSlot, _sh);
    } else { _sh.makeScale(0, 0, 0); shadows.setMatrixAt(b.shSlot, _sh); }
  }

  // ------------------------------------------------------------------ slots
  let li = 0, si = 0;
  for (const b of birds) { if (GROUND.has(b.sp)) b.legSlot = li++; b.shSlot = si++; }
  // instance colours: legs (per species), pigeons (tint)
  for (const b of birds) if (b.legSlot !== undefined) for (let k = 0; k < 2; k++) legs.setColorAt(b.legSlot * 2 + k, _C.set(b.cfg.legs));
  if (legs.instanceColor) legs.instanceColor.needsUpdate = true;
  for (const b of birds) if (b.sp === 'pigeon' || b.sp === 'crow') {
    const M = b.M, tc = b.tint || WHITE; M.body.setColorAt(b.slot, tc); M.head.setColorAt(b.slot, tc); M.wing.setColorAt(b.slot * 2, tc); M.wing.setColorAt(b.slot * 2 + 1, tc);
  }
  for (const m of [models.pigeon, models.crow]) if (m) for (const k of ['body', 'head', 'wing']) if (m[k].instanceColor) m[k].instanceColor.needsUpdate = true;
  for (const M of Object.values(models)) { M.body.count = M.list.length; if (M.head) M.head.count = M.list.length; M.wing.count = M.list.length * 2; }
  legs.count = nGround * 2; shadows.count = birds.length;

  // swifts: rank among the swifts (the count that is visible follows the golden hour), hidden ones are scaled to nothing once
  let swiftK = 0; const swiftList = birds.filter((b) => b.sp === 'swift' && !b.dead), swiftN = swiftList.length;
  swiftList.forEach((b, i) => { b.rank = i; b.hid = false; });
  function hideBird(b) {
    const Mt = b.M; _A.makeScale(0, 0, 0);
    Mt.body.setMatrixAt(b.slot, _A); if (Mt.head) Mt.head.setMatrixAt(b.slot, _A); Mt.wing.setMatrixAt(b.slot * 2, _A); Mt.wing.setMatrixAt(b.slot * 2 + 1, _A); shadows.setMatrixAt(b.shSlot, _A);
  }

  // ------------------------------------------------------------------ the update
  let tPrev = 0, first = true;
  function update(dt, t) {
    if (first) { first = false; tPrev = t; lastPX = W.player.x; lastPZ = W.player.z; }
    dt = clamp(dt, 0, 0.1);
    if (!opts.noDirector) director.update(t);
    // player speed (smoothed) for the scare radius
    const inst = dt > 1e-4 ? Math.hypot(W.player.x - lastPX, W.player.z - lastPZ) / dt : 0; lastPX = W.player.x; lastPZ = W.player.z;
    pSpeed += (clamp(inst, 0, 12) - pSpeed) * Math.min(1, dt * 5);
    for (const f of flocks) flockUpdate(f, t);
    // swifts fly in the golden hour only: the sun low (ctx.sunDir.y < ~0.55) and not the white night
    const sy = ctx.sunDir?.y ?? 0.7, nightV = ctx.shared?.uNight?.value ?? 0;
    swiftK = opts.swifts ? 1 : clamp((0.55 - sy) / 0.2, 0, 1) * (1 - clamp(nightV * 1.5, 0, 1));
    for (const b of birds) {
      if (b.sp === 'swift' && !b.dead) {
        const on = b.rank < Math.round(swiftN * swiftK);
        if (!on) { if (!b.hid) { b.hid = true; hideBird(b); } continue; }
        b.hid = false;
      }
      if (b.dead) { b.noShadow = true; _V.set(0, -50, 0); const Mt = b.M; _A.makeScale(0, 0, 0); Mt.body.setMatrixAt(b.slot, _A); if (Mt.head) Mt.head.setMatrixAt(b.slot, _A); Mt.wing.setMatrixAt(b.slot * 2, _A); Mt.wing.setMatrixAt(b.slot * 2 + 1, _A); if (b.legSlot !== undefined) { legs.setMatrixAt(b.legSlot * 2, _A); legs.setMatrixAt(b.legSlot * 2 + 1, _A); } shadows.setMatrixAt(b.shSlot, _A); continue; }
      // flap phase advances with dt (continuous) whenever the wings beat
      const fl = b.st === 'fly' || b.st === 'orbit';
      if (fl) b.ph += dt * TAU * b.cfg.flap * (b.st === 'fly' && b.fl && t - b.fl.t0 < 0.5 ? 1.3 : 1);
      switch (b.st) {
        case 'ground': updGround(b, t, dt); break;
        case 'perch': updPerch(b, t, dt); break;
        case 'fly': updFly(b, t, dt); break;
        case 'orbit': updOrbit(b, t, dt); break;
        case 'soar': posSoar(b, t); break;
        case 'boat': updBoat(b, t); break;
        default: break;
      }
      b.gy = b.st === 'ground' ? b.y : b.gy;
      switch (b.st) {
        case 'ground': poseGround(b, t); break;
        case 'perch': case 'boat': posePerch(b, t); break;
        case 'fly': if (b.fl && t < b.fl.t0) { if (b.prevSt === 'hide') poseHide(b, t); else if (b.prevSt === 'perch' || b.prevSt === 'boat') posePerch(b, t); else poseGround(b, t); } else poseFly(b, t, dt); break;
        case 'orbit': poseOrbit(b, t, dt); break;
        case 'soar': poseSoar(b, t); break;
        case 'hide': poseHide(b, t); break;
        default: poseGround(b, t);
      }
      writeBird(b, t);
    }
    for (const M of Object.values(models)) { M.body.instanceMatrix.needsUpdate = true; if (M.head) M.head.instanceMatrix.needsUpdate = true; M.wing.instanceMatrix.needsUpdate = true; }
    legs.instanceMatrix.needsUpdate = true; shadows.instanceMatrix.needsUpdate = true;
    tPrev = t;
  }

  /** debug: put one bird of every species in a row near (x,z) standing still (the ?wl=gallery view) */
  function gallery(x, z) {
    NOFEAR_ALL = true; void x; void z;
  }
  let NOFEAR_ALL = false; void NOFEAR_ALL;

  // the density director: the animals follow the player (director.js)
  const director = makeDirector(ctx, W, { birds, flocks, sites: { pigeon: pgSites, sparrow: spSites }, R, spot, layoutFlock, setGround, setPerch, takeBoat, leaveBoat, boatList, boatTaken, soarGull, boatNear, okSites, siteOk, openWater, gY });
  // a knocked lamp / bollard / sign (core/knock.js): its perch is gone for good and the bird on it takes off at once (a bird still flying to it lands on the ground)
  if (ctx.knock && ctx.knock.listen) ctx.knock.listen((rec) => {
    const kinds = rec.kind === 'lamp' ? ['lamp'] : rec.kind === 'bollard' || rec.kind === 'sign' || rec.kind === 'post' ? ['post'] : null;
    if (!kinds) return;
    for (const p of W.dropPerches(rec.x, rec.z, kinds)) {
      const b = p.occ; if (!b) continue;
      if (b.st === 'perch' && b.perch === p) { if (!flee(b, tPrev, { r0: 10, r1: 70 })) launch(b, b.x, gY(b.x, b.z), b.z, tPrev, { fast: true, flat: true }); }
      else if (b.st === 'fly' && b.fl && b.fl.perch === p) p.occ = null;
    }
  });
  update(0, 0);
  return { group, birds, flocks, update, SP, models, say, gallery, launch, flee, setPerch, setGround, poseGround, posePerch, P, writeBird, cafes, director, sites: { pigeon: pgSites, sparrow: spSites }, zones: Z, boatList, start, openWater, timing: tmB, siteOk, takeBoat, leaveBoat, boatTaken };
}
