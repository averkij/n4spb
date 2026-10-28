// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/bridges/styles5.js) for Vasilyevsky-Okrug 7 (docs/vo-br.md); the lines marked 'n4spb' are the world-rule adaptations (docs/AREAS.md 13.7), the rest is verbatim.
// bridges/styles5.js - what makes the second-pass Smolenka bridges of Vasilievsky Island recognisable, drawn on top of the generic arch of arch.js (docs/research/vo-bridges-wave2.md, photos refs/bridges2):
//   nalichny    Наличный мост (1973-75): pink-grey granite faces, 6 lanes + 2 tram tracks laid flush in a concrete slab, high granite parapets between the roadway and the pavements, a black welded
//               lattice of long hexagons ending in granite parapets, FOUR massive granite-faced obelisks at the approaches, galvanised poles with twin cobra heads on the verges, wing walls that close the opened quay (the wide corner stairs are NOT drawn:
//               the quay below belongs to the environment, see docs/research/vo-requests-bridges.md SECOND PASS -> environment 4)
//   korable     мост Кораблестроителей (1981-82): the twin of Nalichny without trams and obelisks: a median, wide pavements behind a high granite parapet, the same railing, RC pedestals faced with granite
//               that carry the steel lamp poles over the abutments (its corner stairs are not drawn either)
//   mouth       1-4 Смоленские мосты (1986-90): pale grey frame bridges with a sheet-metal fascia, solid granite parapets all along both faces and wing walls that close the quay opening (the real stepped corner
//               blocks and the wide stairs down to the lower promenade are the environment's quay: not drawn here)
// NO flags / flagpoles / beacons (user rules).  Every function runs on the B of arch.js (B.faceInfo, B.railLine, B.parapet, B.faceCollider ...) inside the site frame.
import { closeBank, bankU } from './long.js';
import { tramTracks } from './styles2.js';
import { obeliskGranite, lampTwin, pedestalLamp } from './sculpt6.js';
import { drawPits } from './stairs.js';
import { postBatch } from './knock-posts.js';      // n4spb: the lamp poles are knock records (bridges/knock-posts.js)

const frame = (B, P, fn) => { P.push(B.f.cx, 0, B.f.cz, -B.T); try { fn(); } finally { P.pop(); } };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** how far beside the deck the quay is still open (river.js bridgeZones tests): the length of the wing wall that closes it, 2.4 m minimum (blag.js openLen) */
function openLen(e, B, sg, u0, dir) {
  const zs = e.zones || [], L = e.ctx.L, hv = Math.abs(sg < 0 ? B.site.v0 : B.site.v1);
  if (!zs.length) return 2.4;
  let last = -1;
  for (let k = 0; k <= 30; k++) {
    const v = sg * (hv + k * 0.5), ub = bankU(L, B.site, v, u0, dir); if (ub === null) break;
    const w = B.world(ub - dir * 0.25, v);
    if (zs.some((z) => z.test(w.x, w.z, 0.15))) last = k;
  }
  return last < 0 ? 2.4 : Math.min(15, Math.max(2.4, (last + 1) * 0.5 + 1.0));
}

/** the four wing walls (granite face + parapet along the bank line outward from the deck faces) and their colliders; returns the list for the collider wrapper */
function wings(e, B, mat, parapet) {
  const { P, M, ctx } = e, L = ctx.L, out = [];
  for (const [dir, uB] of [[1, B.bank(0)[0]], [-1, B.bank(0)[1]]]) for (const sg of [-1, 1]) {
    const hv = Math.abs(sg < 0 ? B.site.v0 : B.site.v1), len = openLen(e, B, sg, uB, dir);
    closeBank({ site: B.site, P, M, L, u: uB, dir, sg, v0: hv + 0.05, len, yTop: 0.05, yb: B.waterY - 0.45, mat, parapet, collide: false });
    out.push({ u: uB, dir, sg, len, hv });
  }
  return out;
}

/** wrap B.colliders: the wing colliders + what a style adds (list of fn(ph)) */
function addColliders(e, B, wl, extra) {
  const old = B.colliders;
  B.colliders = () => {
    old();
    const ph = e.ctx.physics, L = e.ctx.L;
    for (const w of wl) B.info.colliders += closeBank({ site: B.site, L, ph, ctx: e.ctx, u: w.u, dir: w.dir, sg: w.sg, v0: w.hv - 0.3, len: w.len, yTop: 0.05, draw: false });
    for (const fn of extra) fn(ph);
  };
}

/** raised barrier strips along the 'barrier' zones (the deck chunk only): n4spb (docs/AREAS.md 13.7) a request to the fence batch (rails.wall) = breakable ghost bays, no longer one solid box from the bed */
function barrierColliders(e, B, hgt) {
  for (const z of B.site.zones) {
    if (z[2] !== 'barrier') continue;
    const [a, b] = B.bank((z[0] + z[1]) / 2), u0 = a - 0.4, u1 = b + 0.4, vm = (z[0] + z[1]) / 2, p = B.world(u0, vm), q = B.world(u1, vm);
    e.rails.wall({ x0: p.x, z0: p.z, x1: q.x, z1: q.z, th: z[1] - z[0], y0: B.yDeck(B.uc) - 0.8, y1: B.yDeck(B.uc) + hgt, y: B.yDeck(B.uc) - 0.8 }); B.info.colliders++;
  }
}

const lampsAt = (e, B, list, kind) => {
  const { P, M } = e, cols = [];
  for (const [u, v, arm] of list) {
    const y = B.yDeck(u) + 0.0, w = B.world(u, v);
    if (kind === 'pedestal') { const hp = pedestalLamp(P, M, u, y - 0.05, v, 0, { h: 9, hp: 1.15, arm }); cols.push({ w, hp, ped: true, y }); }
    else { (B.KP ||= postBatch('brg-' + B.site.id)).add('twin' + arm, (Q) => lampTwin(Q, M, 0, 0, 0, 0, { h: 10, arm }), { x: w.x, y, z: w.z, rotY: -B.T }, { x: w.x, z: w.z, r: 0.28, y0: y - 1, y1: y + 9 }, 10); cols.push({ w, y, knock: true }); }      // n4spb: a knock record
    B.masts = B.masts || []; B.masts.push({ x: w.x, z: w.z, y, h: 10, kind: 'cobra' });
  }
  return cols;
};

/**
 * the contact wires of the tram tracks over the deck (streets stops its wires 0.5 m before every deck: "the bridges module owns the decks"): one wire 5.7 m over each track from one end of the deck to
 * the other, hung from two cross-spans that run between the lamp poles of the verges (vp0 .. vp1 at u = us) with a hanger to every wire; thin ribbons through ctx.wires (built after every module)
 */
function tramWires(e, B, tracks, us, vp0, vp1, hPole) {
  const W = e.ctx.wires; if (!W) return 0;
  const ua = B.uMin - 0.6, ub = B.uMax + 0.6, sup = [ua, ...us, ub], H = 5.7;
  const yw = (u) => B.yDeck(clamp(u, B.uMin, B.uMax)) + H - 0.05;
  for (const v of tracks) {
    const pts = [];
    for (let k = 0; k + 1 < sup.length; k++) {
      const n = Math.max(2, Math.round((sup[k + 1] - sup[k]) / 3));
      for (let i = k ? 1 : 0; i <= n; i++) { const t = i / n, u = sup[k] + (sup[k + 1] - sup[k]) * t, w = B.world(u, v); pts.push([w.x, yw(u) - 0.14 * 4 * t * (1 - t), w.z]); }
    }
    W.add(pts, { width: 0.03, color: '#1d1f22' });
  }
  for (const u of us) {
    const cab = [], n = 12;
    for (let i = 0; i <= n; i++) { const t = i / n, v = vp0 + (vp1 - vp0) * t, w = B.world(u, v); cab.push([w.x, B.yDeck(u) + hPole - 1.3 - 0.9 * 4 * t * (1 - t), w.z]); }
    W.add(cab, { width: 0.022, color: '#2a2d31' });
    for (const v of tracks) { const t = (v - vp0) / (vp1 - vp0), w = B.world(u, v); W.add([[w.x, B.yDeck(u) + hPole - 1.3 - 0.9 * 4 * t * (1 - t), w.z], [w.x, yw(u), w.z]], { width: 0.018, color: '#2a2d31' }); }
  }
  return tracks.length;
}

// ------------------------------------------------------------------------------------------------ Nalichny
const nalichny = (e, B) => {
  const { P, M } = e;
  let wl = [], pit = null;
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), a = fi.a, b = fi.b;
      B.railLine(sg, a - 0.3, b + 0.3, 'hexlat', '#1b1f21', { postMat: M.ironBlack, postW: 0.2, h: 1.05 });
      for (const [u0, u1] of [[a - 1.7, a - 0.3], [b + 0.3, b + 1.7]]) B.parapet(sg, u0, u1, 1.05, 0.55, M.parapetPink);
      B.faceCollider(sg, a - 3.2, b + 3.2, 0.25, 0.6);
      for (const [uo, ts] of [[a - 3.1, -1], [b + 3.1, 1]]) obeliskGranite(P, M, uo, B.yDeck(uo) - 0.1, sg * (Math.abs(fi.v) - 1.4), ts > 0 ? 0 : 0, { h: 8.6 });
    }
    tramTracks(e, B, B.site.tracks);
    tramWires(e, B, B.site.tracks, [-10, 10], -20.9, 19.9, 10);
    B.lampCols = lampsAt(e, B, [[-10, -20.9, 2.7], [10, -20.9, 2.7], [-10, 19.9, 2.7], [10, 19.9, 2.7]], 'twin');
    wl = wings(e, B, M.graniteNal, M.parapetPink);
    pit = drawPits(e, B);
  });
  addColliders(e, B, wl, [
    (ph) => pit && pit.colliders(ph, e),
    () => barrierColliders(e, B, 0.45),
    () => { if (B.KP) { const r = B.KP.flush(e.ctx); B.info.colliders += r.colliders; B.extraTris = (B.extraTris || 0) + r.tris; } },      // the lamp poles: colliders + knock records
    (ph) => { for (const sg of [-1, 1]) { const fi = B.faceInfo(sg); for (const uo of [fi.a - 3.1, fi.b + 3.1]) { const w = B.world(uo, sg * (Math.abs(fi.v) - 1.4)); ph.addBox(w.x, w.z, 2.7, 2.7, -B.T, -3, B.yDeck(uo) + 9); B.info.colliders++; } } },
  ]);
};

// ------------------------------------------------------------------------------------------------ Korablestroiteley
const korable = (e, B) => {
  const { P, M } = e;
  let wl = [], ped = [], pit = null;
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), a = fi.a, b = fi.b;
      B.railLine(sg, a - 0.3, b + 0.3, 'hexlat', '#1b1f21', { postMat: M.ironBlack, postW: 0.2, h: 1.05 });
      for (const [u0, u1] of [[a - 3.3, a - 0.3], [b + 0.3, b + 3.3]]) B.parapet(sg, u0, u1, 1.05, 0.55, M.parapetPink);
      B.faceCollider(sg, a - 3.4, b + 3.4, 0.25, 0.6);
      for (const uo of [a - 1.9, b + 1.9]) ped.push([uo, sg * (Math.abs(fi.v) - 1.0)]);
    }
    B.lampCols = lampsAt(e, B, ped.map(([u, v]) => [u, v, 1.7]), 'pedestal').concat(lampsAt(e, B, [[-9, 0.65, 3.4], [9, 0.65, 3.4]], 'twin'));
    wl = wings(e, B, M.graniteKor, M.parapetPink);
    pit = drawPits(e, B);
  });
  addColliders(e, B, wl, [
    (ph) => pit && pit.colliders(ph, e),
    () => barrierColliders(e, B, 0.45),
    () => { if (B.KP) { const r = B.KP.flush(e.ctx); B.info.colliders += r.colliders; B.extraTris = (B.extraTris || 0) + r.tris; } },
    (ph) => { for (const c of B.lampCols) if (c.ped) { ph.addBox(c.w.x, c.w.z, 1.8, 1.8, -B.T, -3, c.y + 1.2); B.info.colliders++; } },      // the RC pedestal block (a structure; Korablestroiteley lies outside Vasilyevsky-Okrug 7: not built here)
  ]);
};

// ------------------------------------------------------------------------------------------------ the mouth bridges
const mouth = (e, B) => {
  const { P, M } = e;
  let wl = [], pit = null;
  frame(B, P, () => {
    for (const sg of [-1, 1]) {
      const fi = B.faceInfo(sg), a = fi.a, b = fi.b;
      B.parapet(sg, a - 3.0, b + 3.0, 0.95, 0.5, M.parapetGrey);              // solid granite parapet all along the face (photos m01 m02: a row of plain blocks under a rolled coping)
      B.faceCollider(sg, a - 3.2, b + 3.2, 0.25, 0.6);
    }
    wl = wings(e, B, M.graniteGrey2, M.parapetGrey);
    pit = drawPits(e, B);                                                      // the 3rd / 4th bridge: a wide stair on each bank beside the south-west abutment (pits.js)
  });
  addColliders(e, B, wl, [(ph) => pit && pit.colliders(ph, e)]);
};

export const STYLES5 = { nalichny, korable, mouth };
void clamp;
