// streets/furn.js - shared helpers of the road-furniture builders: instanced meshes, textured sign panels merged per texture,
// positions along the kerb runs, the common colours. (VB = vertex-colour merged geometry, streets/vb.js.)
import * as THREE from 'three';
import { MB, UP } from './util.js';
import { hash2, clamp } from './util.js';
import { atlasableTex, buildAtlas } from '../../core/batch2.js';
import * as L from '../layout.js';
import { deckAt } from './decks.js';
import { segInfo, coverLocal } from './net.js';
import { cg, mtx, VB } from './vb.js';
import { WALK_Y } from './surface.js';
import { knockInstances } from '../lib/knock-inst.js';

export const COL = {
  pole: '#8d9298', poleD: '#6e747b', black: '#2a2c31', blackL: '#3a3d43', base: '#a3a8ae', lampBody: '#9aa0a6', steel: '#7f858c',
  lime: '#cfe03a', blue: '#1f56a8', plate: '#27409a', white: '#f2f1ec', wood: '#7d3b24', woodS: '#5b2d1f', rail: '#25282c',
};

/** instanced mesh of `geo` / `mat` at list [{x, y?, z, rotY?, s?}] (static scenery, kept out of the merge: instanced) */
export const INST_STATS = {};
export function instances(ctx, geo, mat, list, name, o = {}) {
  if (!list.length || !geo) return null;
  INST_STATS[name] = { n: list.length, tris: Math.round((geo.index ? geo.index.count : geo.attributes.position.count) / 3 * list.length) };
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
  list.forEach((it, i) => { E.set(0, it.rotY || 0, 0); Q.setFromEuler(E); P.set(it.x, it.y || 0, it.z); S.set(it.sx ?? it.scale ?? 1, it.sy ?? it.scale ?? 1, it.sz ?? it.scale ?? 1); M.compose(P, Q, S); im.setMatrixAt(i, M); });
  im.instanceMatrix.needsUpdate = true; im.castShadow = o.shadow !== false; im.receiveShadow = true; im.name = name;
  im.computeBoundingSphere();
  ctx.addStatic(im);
  return im;
}

const MOUNT_TH = 0.028, MOUNT_GAP = 0.008;          // the back plate of a mounted sign (thick) and the gap between it and the face

/** The metal of a sign bolted to a pole, without the face: the thin galvanised back plate (a disc for round signs) just behind the face and, on a real pole (o.pole > 0, not o.kind 'plate'),
 *  the TWO CLAMP BANDS around the pole. Same arguments as panels.mount; `poles` is any VB (the shared poles VB, or the local VB of a knockable model). */
export const mountBody = (poles, x, y, z, nx, nz, wd, ht, o = {}) => {
  const r = o.pole || 0, th = MOUNT_TH, ry = Math.atan2(nx, nz);
  // the back plate = ONE one-sided quad (a disc for round signs) just behind the face, facing away: it hides the mirrored back of the face from behind, edge-on from the side (a 12-triangle box x 5000 signs was 60 k triangles)
  const bx = x + nx * (r + th * 0.4), bz = z + nz * (r + th * 0.4);
  if (o.round) poles.add(cg('backdisc', () => new THREE.CircleGeometry(1, 8)), COL.steel, mtx([bx, y, bz], [0, ry + Math.PI, 0], [wd * 0.5, wd * 0.5, 1]));
  else poles.add(cg('band', () => new THREE.PlaneGeometry(1, 1)), COL.steel, mtx([bx, y, bz], [0, ry + Math.PI, 0], [wd * 0.985, ht * 0.985, 1]));
  if (r > 0 && o.kind !== 'plate') for (const f of [-0.28, 0.28]) {                              // the clamp bands: a lighter strip across the pole on the rear of the plate, 4 cm high, a little wider than the pole
    poles.add(cg('band', () => new THREE.PlaneGeometry(1, 1)), '#b9bec4', mtx([x - nx * (r + 0.004), y + ht * f, z - nz * (r + 0.004)], [0, ry + Math.PI, 0], [2 * r + 0.03, 0.04, 1]));
  }
};
/** the face of a sign mounted with mountBody / panels.mount: { tex, x, y, z, nx, nz, w, h } (the centre of the textured quad, 3.6 cm in front of the pole axis for a standard pole) */
export const faceOf = (tex, x, y, z, nx, nz, wd, ht, o = {}) => {
  const s = (o.pole || 0) + MOUNT_TH + MOUNT_GAP;
  return { tex, x: x + nx * s, y, z: z + nz * s, nx, nz, w: wd, h: ht };
};

/** textured quads merged per texture: panel(tex, x, y, z, nx, nz, w, h) with the normal (nx,nz) pointing at the viewer; double-sided basic material that brightens at night.
 *  claim(tex): a texture that is drawn by INSTANCED faces (makeKnockPosts) joins the atlas without any merged quad; tileOf(tex) after finish() -> { mat, u0, v0, su, sv } the page material and the tile of the atlas. */
export function makePanels(ctx) {
  const map = new Map(), mats = [], tiles = new Map();
  const get = (tex, opts = {}) => {
    let m = map.get(tex); if (m) return m;
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false, name: 'pt-sign', alphaTest: 0.45 });
    mats.push(mat); m = { tex, mb: new MB(), mat, claimed: false }; map.set(tex, m); return m;
  };
  const claim = (tex) => { get(tex).claimed = true; };
  const panel = (tex, x, y, z, nx, nz, wd, ht, o = {}) => {
    const { mb } = get(tex, o); const tx = nz, tz = -nx;
    const hx = tx * wd / 2, hz = tz * wd / 2;
    const flip = o.flip ? -1 : 1;
    const [u0, v0, u1, v1] = o.uv || [0, 0, 1, 1];
    const a = mb.vert(x - hx * flip, y - ht / 2, z - hz * flip, u0, v0, [nx, 0, nz]), b = mb.vert(x + hx * flip, y - ht / 2, z + hz * flip, u1, v0, [nx, 0, nz]);
    const c = mb.vert(x + hx * flip, y + ht / 2, z + hz * flip, u1, v1, [nx, 0, nz]), d = mb.vert(x - hx * flip, y + ht / 2, z - hz * flip, u0, v1, [nx, 0, nz]);
    mb.quad(a, b, c, d, [nx, 0, nz]);
  };
  const finish = (root) => {
    // ~90 sign textures would be ~90 draw calls (a mesh per texture): the canvases are packed into 4096 px atlas pages (core/batch2.js buildAtlas) and merged into ONE mesh per page
    const entries = [...map.values()].filter((e) => !e.mb.empty || e.claimed);
    const packable = entries.filter((e) => atlasableTex(e.tex) && e.mb.uv.every((u) => u >= -0.002 && u <= 1.002));
    const atlas = packable.length > 1 ? buildAtlas(new Set(packable.map((e) => e.tex))) : { map: new Map(), texs: [] };
    const pageMB = atlas.texs.map(() => new MB()), pageMat = atlas.texs.map((t) => { const m = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false, name: 'pt-sign-atlas', alphaTest: 0.45 }); mats.push(m); return m; });
    const done = new Set();
    for (const e of packable) {
      const tile = atlas.map.get(e.tex); if (!tile) continue;
      const P = pageMB[tile.page], mb = e.mb, base = P.n;
      for (let i = 0; i < mb.pos.length; i++) P.pos.push(mb.pos[i]);
      for (let i = 0; i < mb.nrm.length; i++) P.nrm.push(mb.nrm[i]);
      for (let i = 0; i < mb.uv.length; i += 2) P.uv.push(tile.u0 + Math.min(1, Math.max(0, mb.uv[i])) * tile.su, tile.v0 + Math.min(1, Math.max(0, mb.uv[i + 1])) * tile.sv);
      for (let i = 0; i < mb.idx.length; i++) P.idx.push(mb.idx[i] + base);
      P.n += mb.n; done.add(e);
      tiles.set(e.tex, { mat: pageMat[tile.page], u0: tile.u0, v0: tile.v0, su: tile.su, sv: tile.sv });
    }
    pageMB.forEach((P, i) => { if (P.empty) return; const m = new THREE.Mesh(P.build(), pageMat[i]); m.name = 'pt-signpanel'; m.castShadow = false; m.receiveShadow = false; ctx.noBatch(m); ctx.noOutline(m); root.add(m); });
    for (const e of entries) {
      if (done.has(e)) continue;
      tiles.set(e.tex, { mat: e.mat, u0: 0, v0: 0, su: 1, sv: 1 });
      if (e.mb.empty) continue;                                          // a claimed texture that no merged quad uses (instanced faces only) and that stays out of the atlas: its own material, no mesh
      const m = new THREE.Mesh(e.mb.build(), e.mat); m.name = 'pt-signpanel'; m.castShadow = false; m.receiveShadow = false; ctx.noBatch(m); ctx.noOutline(m); root.add(m);
    }
    ctx.onUpdate(() => { const n = ctx.shared.uNight ? ctx.shared.uNight.value : 0; for (const m of mats) m.color.setScalar(0.86 + 0.5 * n); });
  };
  /** A sign bolted to a pole: mount(poles, tex, x, y, z, nx, nz, w, h, { pole: radius, round }) with (x, z) = the pole axis, (nx, nz) = the face normal. The face stands in front of the pole on a thin
   *  galvanised back plate (hides the mirrored back of the quad) held by TWO CLAMP BANDS around the pole (flat strips 4 cm high, seen from behind; 4 triangles: the bands of the real mount, without the
   *  geometry of a ring); pole = 0: a sign hanging from a rod / wire, back plate only. Standard poles: plain grey round tube (streets/signals.js post()). Same as the Yakutsk fix fafd4c9. */
  const mount = (poles, tex, x, y, z, nx, nz, wd, ht, o = {}) => {
    const r = o.pole || 0;
    panel(tex, x + nx * (r + MOUNT_TH + MOUNT_GAP), y, z + nz * (r + MOUNT_TH + MOUNT_GAP), nx, nz, wd, ht, o);
    mountBody(poles, x, y, z, nx, nz, wd, ht, o);
  };
  return { panel, mount, finish, claim, tileOf: (tex) => tiles.get(tex) || null };
}

/** walk along the kerb runs of the net (kind 'edge'): cb({x,z,nx,nz,w,side,s}) at ~spacing m with a per-run phase; nx,nz = outward normal at the kerb */
export function alongKerbs(net, spacing, cb, o = {}) {
  let runIdx = -1;
  for (const run of net.kerbRuns) {
    runIdx++;
    if (run.kind !== 'edge') continue;
    const w = run.w;
    if (o.rank && w.rank < o.rank) continue;
    if (o.filter && !o.filter(w)) continue;
    const sp = typeof spacing === 'function' ? spacing(w) : spacing;
    let acc = sp * (0.3 + 0.35 * hash2(w.i, run.side === 'L' ? 1 : 2)) * (o.phase ?? 1);
    for (let i = 1; i < run.pts.length; i++) {
      const a = run.pts[i - 1], b = run.pts[i], seg = Math.hypot(b.x - a.x, b.z - a.z); if (seg < 1e-6) continue;
      acc += seg;
      while (acc > sp) {
        acc -= sp;
        const f = 1 - acc / seg, x = a.x + (b.x - a.x) * f, z = a.z + (b.z - a.z) * f;
        const nx = a.ox + (b.ox - a.ox) * f, nz = a.oz + (b.oz - a.oz) * f, nl = Math.hypot(nx, nz) || 1;
        cb({ x, z, nx: nx / nl, nz: nz / nl, w, side: run.side, s: a.s + (b.s - a.s) * f, run: runIdx });
      }
    }
  }
}
/** true when a junction node (3+ arms) lies within r of (x, z); the nodes are hashed once per net (the placers asked every node for every candidate) */
function nodeGrid(net) {
  if (net._ng && net._ngN === net.nodes.length) return net._ng;
  const g = new Map();
  for (const n of net.nodes) if (n.arms.length >= 3) { const k = Math.floor(n.x / 16) * 4096 + Math.floor(n.z / 16); let l = g.get(k); if (!l) g.set(k, (l = [])); l.push(n); }
  net._ng = g; net._ngN = net.nodes.length; return g;
}
/** distance to the nearest junction node (3+ arms) within maxR (maxR + 1 when none) */
export function nodeDist(net, x, z, maxR = 48) {
  const g = nodeGrid(net); let best = maxR + 1;
  for (let cx = Math.floor((x - maxR) / 16); cx <= Math.floor((x + maxR) / 16); cx++) for (let cz = Math.floor((z - maxR) / 16); cz <= Math.floor((z + maxR) / 16); cz++) for (const n of g.get(cx * 4096 + cz) || []) { const d = Math.hypot(n.x - x, n.z - z); if (d < best) best = d; }
  return best;
}
export const nodeNear = (net, x, z, r) => nodeDist(net, x, z, r) < r;

/** MERGED STRIP: the ground between two carriageways of ONE street that are closer than 7.5 m (streets/net.js fillMedians merges them into one roadway) is no median and no pavement: no furniture base there
 *  (the audit tools/roads-furniture-audit.mjs 'median gap<7.5' rows). Same measure as the audit, in the asphalt of the network (net.cover / segInfo, incl. pockets and fillets): from the point, along the normal
 *  of its nearest way, the first asphalt on each side within 9 m; two DIFFERENT ways of the same name that run in opposite directions with an asphalt-to-asphalt gap < 7.5 m (0.15 m ray steps: tested < 7.9 m). */
const stripProbe = (net, x, z) => {
  let best = null;
  net.each(x, z, 3, (w, i) => {
    if (w.skipDraw || w.pedestrianOnly) return;
    const q = segInfo(w, i, x, z), m = q.h - q.c.d;
    if (!best || m > best.m) best = { m, w, tx: q.dx, tz: q.dz };
  });
  if (!best) return null;
  const f = net.cover(x, z, {});
  if (f > best.m + 0.01) best.m = f;
  return best;
};
export const inMergedStrip = (net, x, z, step = 0.15, lim = 7.9) => {      // match the audit's ray step, including short angled carriageway ends
  const cen = stripProbe(net, x, z); if (!cen) return false;
  // The march (up to 90 probes on the pavement): a local cover round the base (net.js coverLocal, exact above -0.3) says 'no asphalt here' without the segment walk of stripProbe.
  // Exact: net.cover is >= the segInfo measure of every way stripProbe sees (same segments, same arithmetic, no exclusions), so a probe whose cover is <= 0.02 can never be a hit; only a
  // probe that can be a hit runs the full stripProbe (the hit itself, the same way / direction as before).
  const cl = coverLocal(net, x, z, 9.4, {});
  const probe = (px, pz) => (cl(px, pz) > 0.02 - 1e-6 ? stripProbe(net, px, pz) : null);
  const nx = -cen.tz, nz = cen.tx; let kr = null, kl = null, pr = null, pl = null;
  for (let k = step; k < 9; k += step) {
    if (kr == null) { const p = probe(x + nx * k, z + nz * k); if (p && p.m > 0.02) { kr = k; pr = p; } }
    if (kl == null) { const p = probe(x - nx * k, z - nz * k); if (p && p.m > 0.02) { kl = k; pl = p; } }
    if (kr != null && kl != null) break;
    if ((kr == null) !== (kl == null) && (kr == null ? kl : kr) + (k + step) >= lim) return false;      // the other side can only be found at k + step or beyond: kr + kl would reach lim (the same answer, sooner)
  }
  if (kr == null || kl == null || pl.w === pr.w || kr + kl >= lim) return false;
  return !!pl.w.name && pl.w.name === pr.w.name && pl.tx * pr.tx + pl.tz * pr.tz <= -0.5;
};
const RING = [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]];

/** ROAD CLEARANCE RULE of the furniture: a pole base at (x, z) stands clear of every asphalt (own way with its pocket, other carriageways, junction fillets: net.cover without a skip), of a bridge deck and of a facade */
export const poleClear = (net, x, z, gap = 0.5) => {
  // one local cover for the base and its 0.3 m ring (net.js coverLocal: with R = 0.5 + gap it is exact above -(0.5 + gap) for probes within 0.3 m; every test here is at -gap or 0.3 - gap)
  const cl = coverLocal(net, x, z, 0.5 + gap, {});
  return cl(x, z) <= -gap && !deckAt(x, z, 1) && !L.insideBuilding(x, z, 0.3)
  && RING.every(([dx, dz]) => cl(x + dx, z + dz) <= 0.3 - gap) && !inMergedStrip(net, x, z);        // (a base right on the edge of a junction fillet polygon is not clear: its footprint would straddle it)
};

/** the nearest clear base to (x, z) within maxR (rings of 1 m): ok(px, pz) narrows the search (e.g. one side of a road); null when none.
 *  A pole is moved to the nearest clear pavement instead of standing in the roadway and is only dropped when nothing is clear within reach. */
export function clearNear(net, x, z, maxR, ok = null, gap = 0.5) {
  for (let R = 1; R <= maxR; R++) {
    const n = Math.max(6, Math.round(R * 6.283));
    for (let i = 0; i < n; i++) { const a = i / n * 6.283, px = x + Math.cos(a) * R, pz = z + Math.sin(a) * R; if ((!ok || ok(px, pz)) && poleClear(net, px, pz, gap)) return [px, pz]; }
  }
  return null;
}

/** a clear base near (x, z) found by shifting along the kerb (unit t, +-1 m steps up to `reach`, `first` = the preferred sign) and outward (unit n, 0.4 m steps up to 1.2 m); null when none */
export function nudgeClear(net, x, z, tx, tz, nx, nz, reach = 6, first = 1, gap = 0.5) {
  for (let a = 0; a <= reach; a++) for (const sg of a ? [first, -first] : [1]) for (let o = 0; o <= 1.21; o += 0.4) {
    const px = x + tx * a * sg + nx * o, pz = z + tz * a * sg + nz * o;
    if (poleClear(net, px, pz, gap)) return [px, pz];
  }
  return null;
}

// ================================================================ KNOCKABLE POSTS (ctx.knock): sign posts, traffic-signal poles, mast arms, speed cameras, bus-stop poles
// With ctx.knock the posts of the street furniture are INSTANCES instead of parts of the shared pt-poles VB, so the driven car can knock them over (core/knock.js). The API (streets.js makes it
// once, shared.kposts; it is null without ctx.knock and every builder then keeps its merged-VB path, R1):
//   K.model(key, build)   a canonical body in a LOCAL frame: origin = the foot of the post at the pavement level, +z = the way the sign faces, build(V) fills a VB (the shaft, the clamps, a signal
//                         head ...). Built once per key, instanced by every post that names it.
//   K.signPost({ x, z, nx, nz, h, r, col, tex, w, ht, my, mount, base, variant, item, rec })   the whole sign post in one call: a round shaft h x r, a sign tex (w x ht) mounted at the height my
//                         (mount = { kind, round } as panels.mount, pole = r), `base` an optional (V) => void for more body geometry (a ring), `variant` names it. Makes the collider unless `item`
//                         is given, queues the record (kind 'sign', 28 kg, anchored 10 km/h, hitK 0.15 unless `rec` overrides). A caller must NOT also call poles.cyl / panels.mount (no ghost pole).
//   K.add({ group, model, x, z, y, rotY, faces, parts, rec, item | items, extra, onKnock })   the general form: `model` the body at (x, y, z) turned by rotY; faces = [faceOf(...)] the textured
//                         quads (instanced in the atlas page material, panels.claim joins the atlas); parts = [{ model, x, y, z, rotY }] more instances of other models (a signal head on a mast arm);
//                         extra() -> [{ mesh, index }] parts that live in other meshes (the lens and countdown instances of signals.js), evaluated when the record is registered.
//   K.finish()            ONCE, after panels.finish(root) (the atlas exists then): builds the cell-split dynamic meshes per model and per face (knockInstances, cells and ranges per group below, registerLOD, no attach) and
//                         registers the records. Returns { records, meshes, byGroup }.
// Groups (cell, far): 'post' 512 / 280 m, 'signal' 512 / 280, 'arm' 768 / 380, 'camera' 768 / 320 (measured on 60 poses at the signal heads: the knock meshes plus the rest of pt-poles are 47 visible draws against 46 for the old pt-poles pieces). A bus-stop pole (stops.js) is K.signPost({ ..., item: its collider, base: ring, rec: { h: 3, mass: 30 } }).
const KP_GROUPS = { post: { cell: 512, far: 280 }, signal: { cell: 512, far: 280 }, arm: { cell: 768, far: 380 }, camera: { cell: 768, far: 320 } };
export function makeKnockPosts(ctx, panels, mat) {
  const models = new Map(), faceDefs = new Map(), texId = new Map(), groups = new Map(), stats = { posts: 0, byKind: {}, meshes: 0, records: 0 };
  const UPV = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1);
  const pose = (x, y, z, ry) => new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromAxisAngle(UPV, ry), ONE);
  const model = (key, build) => { if (!models.has(key)) { const V = new VB(); build(V); models.set(key, { V }); } return key; };
  const put = (pl, key, m) => { let a = pl.get(key); if (!a) pl.set(key, (a = [])); a.push(m); };
  const add = (o) => {
    if (!models.has(o.model)) return null;
    const pl = new Map(), y = o.y ?? WALK_Y;
    put(pl, o.model, pose(o.x, y, o.z, o.rotY || 0));
    for (const p of o.parts || []) if (models.has(p.model)) put(pl, p.model, pose(p.x, p.y, p.z, p.rotY || 0));
    for (const f of o.faces || []) {
      if (!texId.has(f.tex)) texId.set(f.tex, texId.size);
      const key = 'face' + texId.get(f.tex) + '-' + f.w + 'x' + f.h;
      if (!faceDefs.has(key)) { faceDefs.set(key, { tex: f.tex, w: f.w, h: f.h }); panels.claim(f.tex); }
      put(pl, key, pose(f.x, f.y, f.z, Math.atan2(f.nx, f.nz)));
    }
    const group = o.group || 'post', spot = { x: o.x, y, z: o.z, rotY: o.rotY || 0, pl, rec: { ...o.rec, onKnock: o.onKnock || null }, items: o.items || (o.item ? [o.item] : []), extra: o.extra || null };
    let g = groups.get(group); if (!g) groups.set(group, (g = []));
    g.push(spot); stats.posts++; stats.byKind[spot.rec.kind || 'thing'] = (stats.byKind[spot.rec.kind || 'thing'] || 0) + 1;
    return spot;
  };
  const signPost = (o) => {
    const r = o.r, h = o.h, col = o.col || COL.pole, mo = { pole: r, ...o.mount };
    const key = model(['sp', h, r, col, o.my, o.w, o.ht, mo.kind || '', mo.round ? 1 : 0, o.variant || ''].join('|'), (V) => {
      V.cyl(r, r * 1.1, h, col, [0, h / 2, 0], null, 5, null, true);
      mountBody(V, 0, o.my, 0, 0, 1, o.w, o.ht, mo);
      if (o.base) o.base(V);
    });
    const y = o.y ?? WALK_Y, item = o.item || ctx.physics.addCylinder(o.x, o.z, Math.max(r * 1.2, 0.08), 0, h);
    return add({ model: key, x: o.x, z: o.z, y, rotY: Math.atan2(o.nx, o.nz), faces: [faceOf(o.tex, o.x, y + o.my, o.z, o.nx, o.nz, o.w, o.ht, mo)], item,
      rec: { kind: 'sign', mass: 28, h, r: 0.06, anchored: 10, hitK: 0.15, metal: true, ...o.rec } });
  };
  const finish = () => {
    const out = { records: 0, meshes: 0, byGroup: {} };
    for (const [gname, spots] of groups) {
      const G = KP_GROUPS[gname] || KP_GROUPS.post, keys = new Set(), parts = [];
      for (const s of spots) for (const k of s.pl.keys()) keys.add(k);
      for (const key of keys) {
        const part = { name: key.replace(/[^A-Za-z0-9.]+/g, '_'), when: (s) => s.pl.has(key), place: (s) => s.pl.get(key) };
        if (faceDefs.has(key)) {
          const f = faceDefs.get(key), tile = panels.tileOf(f.tex); if (!tile) continue;
          const g = new THREE.PlaneGeometry(f.w, f.h), uv = g.attributes.uv;
          for (let i = 0; i < uv.count; i++) uv.setXY(i, tile.u0 + uv.getX(i) * tile.su, tile.v0 + uv.getY(i) * tile.sv);
          Object.assign(part, { geo: g, mat: tile.mat, shadow: false, receive: false, noOutline: true });
        } else {
          const geo = models.get(key).V.build(); if (!geo) continue;
          Object.assign(part, { geo, mat });
        }
        parts.push(part);
      }
      const res = knockInstances(ctx, { name: 'pt-kp-' + gname, parts, spots, items: (i, s) => s.items, rec: (s) => s.rec, far: G.far, cell: G.cell, extraParts: (i, s) => (s.extra ? s.extra() : null) });
      const n = res.records.filter(Boolean).length;
      out.records += n; out.meshes += res.meshes.length; out.byGroup[gname] = { spots: spots.length, records: n, meshes: res.meshes.length, models: parts.length };
    }
    groups.clear(); stats.records += out.records; stats.meshes += out.meshes;
    return out;
  };
  return { model, add, signPost, finish, stats };
}

export { hash2, clamp, UP };
