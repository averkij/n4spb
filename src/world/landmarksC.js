// landmarksC - the Fontanka at Nevsky Prospekt (docs/research/fontanka.md, nevsky.md): the Anichkov Bridge with its green cast-iron railings and the four Klodt horse-tamer groups,
// the Beloselsky-Belozersky Palace (Nevsky 41), the quay buildings Fontanka 33 and 50, and the tourist boats + landing stages on the river.
//   Files: landmarksC/frame.js (the bridge frame and profile) · bridgemats.js (granite / railing textures + materials) · bridge.js (arches, deck, railing, markings, colliders) ·
//   closure.js (the quay gap beside the deck: coping, parapet, colliders) · horses.js (pedestals + bronze groups) · palace.js · bank.js · boats.js · kit.js / common.js / house.js /
//   reliefs.js (the stucco-facade vocabulary copied from landmarksB).
//   Owns every sub-group of layout.GROUPS.landmarksC (anichkov-bridge, beloselsky, fontanka-bank).  Publishes ctx.services.landmarksC = { bridge: { cutwaters, deck, ... }, boats, piers }
//   and merges monuments / photoSpots into ctx.services.landmarks.  NO flags / flagpoles, no alarm sounds (user rules).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { makeKit } from './landmarksC/common.js';
import { makeBridgeMats } from './landmarksC/bridgemats.js';
import * as F from './landmarksC/frame.js';
import { solidPiers } from './bridges/piers.js';

const PARTS = [
  ['bridge', () => import('./landmarksC/bridge.js'), async (m, K, M, ctx, root, svc) => {
    m.buildBridge(K, M); m.buildMarkings(K, M);
    svc.railPanels = m.buildRailing(ctx, M, root);
    svc.deckColliders = m.bridgeColliders(ctx);
  }],
  ['closure', () => import('./landmarksC/closure.js'), async (m, K, M, ctx, root, svc) => { svc.closure = m.buildClosure(K, M, ctx); }],
  ['lamps', () => import('./landmarksC/lamps.js'), async (m, K, M, ctx, root, svc) => { svc.lamps = m.buildLamps(K, M, ctx); }],
  ['horses', () => import('./landmarksC/horses.js'), async (m, K, M, ctx, root, svc) => { svc.groups = m.buildHorses(K, M, ctx); }],
  ['palace', () => import('./landmarksC/palace.js'), async (m, K) => { m.build(K); }],
  ['bank', () => import('./landmarksC/bank.js'), async (m, K) => { m.build(K); }],
];

export async function build(ctx) {
  const K = makeKit(ctx);
  K.svc = { houses: [], entrances: [], monuments: [], photoSpots: [] };
  const M = makeBridgeMats(ctx);
  for (const m of [M.mark, M.markY, M.scar, M.signAnchor, M.foam]) K.decalMats.add(m);
  const root = new THREE.Group(); root.name = 'landmarksC';
  const svc = {}, failed = [];
  for (const [name, load, run] of PARTS) {
    try {
      const m = await load();
      K.begin();
      await run(m, K, M, ctx, root, svc);
      K.flush(root, name);
      if (name === 'bridge') solidPiers(ctx, root.children.filter((c) => c.name === 'bridge'));      // the abutment feet that bridgeColliders' piers do not cover (bridges/piers.js leaves what a solid covers already)
    } catch (e) { console.error(`[landmarksC] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); K.begin(); }
  }
  ctx.addStatic(root);
  // dynamic parts (boats) are added by boats.js through ctx.add
  try {
    const bm = await import('./landmarksC/boats.js');
    svc.boats = bm.buildBoats(K, M, ctx);
  } catch (e) { console.error('[landmarksC] boats failed:', e); failed.push('boats: ' + (e && e.stack || e)); }

  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(K.svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(K.svc.photoSpots);
  const cut = F.ARCHES.length ? [[-8.05, -1], [-8.05, 1], [8.05, -1], [8.05, 1]].map(([u, s]) => F.toWorld(u, s * (F.FACE + 0.2))) : [];
  ctx.services.landmarksC = {
    bridge: { cutwaters: cut, deck: { ...F.toWorld(0, 0), hx: F.HALF, hz: F.EDGE, rotY: F.BOX_ROT }, frame: { cx: F.CX, cz: F.CZ, theta: F.TH },
      /** roadway height of the humped deck at a world point (null off the deck): for traffic / people that must ride over the bridge */
      deckY: (x, z) => { const q = F.toUV(x, z); return Math.abs(q.u) <= F.EXT && Math.abs(q.v) <= F.EDGE ? F.yDeck(q.u) : null; } },
    boats: svc.boats && svc.boats.service ? svc.boats.service : [], piers: svc.boats && svc.boats.piers ? svc.boats.piers : [],
    houses: K.svc.houses, triangles: K.tris, parts: svc,
  };
  if (failed.length) throw new Error('landmarksC parts failed:\n' + failed.join('\n'));
}
