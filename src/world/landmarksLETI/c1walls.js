// landmarksLETI/c1walls.js - the walls of Corpus 1 (everything except the porch block, the clock gable and the towers): one facade per ring edge in its own frame (x right along the wall, z out).
//   A holed panel of the striped wall (base collector), the glazing sheets at the back of the reveals (base), the stucco pylons, arched surrounds, sills, downpipes and plaques (detail collector, hidden beyond DETAIL_FAR).
//   Plaques: the OSM nodes n10200097305 (Popov) / 06 (Vologdin) on the south front, n10287840778 (Graftio) on the west front hang on a pylon placed at their position (labels registry).
import { holedWall, pane } from './facade.js';
import { arch, rect } from './shell.js';
import { H } from './frame.js';
import { layoutEdge, archRing, pylon, onBoth, TIER, localOnEdge } from './c1common.js';
import { plaqueUV } from './art.js';
import { makeLabels } from '../streets/labels.js';

const PLAQUES = [
  { id: 'n10200097305', x: -1717, z: -4307.8, tile: 0, edge: 14 }, { id: 'n10200097306', x: -1723.2, z: -4305.5, tile: 1, edge: 14 },
  { id: 'n10287840778', x: -1750.9, z: -4358.6, tile: 3, edge: 26 },
];
const CFG = { A: { pw: 1.5, pitch: 3.7, group: 3 }, B: { pw: 1.2, pitch: 3.8, group: 99, noEnds: true }, C: { pw: 1.4, pitch: 4.1, group: 3 } };

/** the facade of one edge; tier 'A' | 'B' | 'C' */
export function facade(K, e, tier, state) {
  const M = K.M, P = K.P, D = K.D, ctx = K.ctx, L = e.len;
  if (L < 0.9) return;
  onBoth(K, e, (len, f) => {
    if (L < 4.4) {                                                                          // a jog of the plan: a slit window at most
      const holes = L >= 2.2 ? [rect(L / 2, 8.3, 0.5, 1.7, 'winS')] : [];
      wall(P, M, L, holes, 0.5);
      return;
    }
    const cfg = CFG[tier] || CFG.B, forced = PLAQUES.filter((p) => p.edge === e.i).map((p) => localOnEdge(e, p.x, p.z).u);
    const lay = layoutEdge(L, { ...cfg, forced });
    if (state) {                                                                                  // roof furniture hooks: turrets on pylons, gablets over the middle of the bay groups
      lay.pylons.forEach((p, k) => state.pylons.push({ edge: e.i, wx: f.x + f.xa[0] * p.x, wz: f.z + f.xa[1] * p.x, nx: e.n[0], nz: e.n[1], turret: tier === 'A' && L >= 12 && (p.x < 2 || p.x > L - 2 || k % 2 === 0) }));
      if (tier === 'A') for (let k = 0; k + 1 < lay.pylons.length; k++) {
        const a = lay.pylons[k].x + lay.pylons[k].w / 2, b = lay.pylons[k + 1].x - lay.pylons[k + 1].w / 2;
        if (b - a >= 5) { const m = (a + b) / 2; (state.gablets ||= []).push({ wx: f.x + f.xa[0] * m, wz: f.z + f.xa[1] * m, nx: e.n[0], nz: e.n[1] }); }
      }
    }
    const holes = [];
    for (const b of lay.bays) {
      const w = b.x1 - b.x0, c = b.c;
      if (tier === 'A' && w >= 3.3) { holes.push(arch(c - 0.88, H.winG0, 1.15, 2.85, 'winA'), arch(c + 0.88, H.winG0, 1.15, 2.85, 'winA')); }
      else holes.push(arch(c, H.winG0, Math.min(1.5, w - 1.2), H.winG, 'winA'));
      holes.push(arch(c, H.winU0, Math.min(2.1, w - 1.1), H.winU, 'winB'));
    }
    if (!lay.bays.length && L >= 2.4) holes.push(rect(L / 2, 8.3, 0.5, 1.7, 'winS'));
    holedWall(P, M.stripe, 0, L, H.plinth - 0.05, H.wall, holes, { depth: 0.5, uvs: 2.4, noEnds: true, seg: 7 });
    for (const h of holes) pane(P, M[h.mat || 'winA'], h, 0.5);
    for (const h of holes) {
      if (!h.arch) { D.box(M.stucco, h.x0 - 0.1, h.x1 + 0.1, h.y0 - 0.12, h.y0 - 0.02, 0, 0.14, 'kb'); continue; }
      if (tier === 'A') {
        const upper = h.y0 > 5;
        archRing(D, M.stucco, h.cx, h.y0, h.w, h.h, upper ? 0.3 : 0.17, upper ? 0.1 : 0.07, 8);
        D.box(M.stucco, h.cx - h.w / 2 - (upper ? 0.34 : 0.2), h.cx + h.w / 2 + (upper ? 0.34 : 0.2), h.y0 - 0.13, h.y0 - 0.02, 0, upper ? 0.2 : 0.14, 'kb');          // the sill
      } else if (tier === 'B') D.box(M.stucco, h.cx - h.w / 2 - 0.12, h.cx + h.w / 2 + 0.12, h.y0 - 0.12, h.y0 - 0.02, 0, 0.12, 'kb');
    }
    if (tier === 'A' || tier === 'C') {
      for (const p of lay.pylons) pylon(D, M, p.x, p.w, tier === 'A' ? 0.5 : 0.42);
      // downpipes beside every interior pylon of the front tiers
      if (tier === 'A') for (const p of lay.pylons) if (p.x > 2.5 && p.x < L - 2.5) D.box(M.stucco, p.x + p.w / 2 + 0.2, p.x + p.w / 2 + 0.33, 0.3, H.wall + 0.4, 0, 0.17, 'kb', 1);
    }
    // plaques on their pylons
    const lab = ctx.services.labels || (ctx.services.labels = makeLabels());
    for (const pq of PLAQUES) {
      if (pq.edge !== e.i) continue;
      const u = localOnEdge(e, pq.x, pq.z).u, pr = tier === 'A' ? 0.5 : 0.42;
      const wx = f.x + f.xa[0] * u + e.n[0] * (pr + 0.02), wz = f.z + f.xa[1] * u + e.n[1] * (pr + 0.02);
      if (lab.reserve('lmleti-' + pq.id, wx, 3.4, wz, 0.66, 0.9, e.n[0], e.n[1], 'plate')) D.quad(M.plaques, [u - 0.33, 2.95, pr + 0.02], [u + 0.33, 2.95, pr + 0.02], [u + 0.33, 3.85, pr + 0.02], [u - 0.33, 3.85, pr + 0.02], [0, 0, 1], plaqueUV(pq.tile));
    }
  });
}

/** a plain wall panel without a layout (jogs) */
function wall(P, M, L, holes, depth) {
  holedWall(P, M.stripe, 0, L, H.plinth - 0.05, H.wall, holes, { depth, uvs: 2.4, noEnds: true, seg: 6 });
  for (const h of holes) pane(P, M[h.mat || 'winA'], h, depth);
}

export { TIER };
