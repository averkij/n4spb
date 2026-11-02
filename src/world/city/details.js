// details.js - everything that is not wall / cornice / deck, in the order it is built:
//   balconies.js    stone slabs + iron railings on the piano nobile, iron roof railings
//   erkers.js       polygonal bay windows (erkers) on the tenements, corner turrets
//   gables.js       shaped attic gables of the Northern Modern houses, roof balustrades / attic parapets of the neoclassical revival (Petrograd side)
//   roofdetail.js   mansards + dormers, chimney comb
//   shops.js        shop fascias (POIS), awnings, address plates, shop / parade-door entrances    (one sign atlas for the whole city)
//   entrances.js    steps + canopies at the parade doors, downpipes
//   scaffold.js     restoration scaffolding (printed canvas nets are painted by the wall shader)
import { SignAtlas } from './signs.js';
import { BUILDINGS } from '../data/city.js';
import { isOwned } from '../lib/claims.js';
import { buildBalconies } from './balconies.js';
import { buildErkers } from './erkers.js';
import { buildGables } from './gables.js';
import { buildRoofDetail } from './roofdetail.js';
import { buildShops } from './shops.js';
import { buildEntranceGeo } from './entrances.js';
import { buildScaffolds } from './scaffold.js';
import { buildClutter } from './clutter.js';

export function buildDetails(ctx, { root, M, info, styles, owned, net }) {
  const out = { triangles: 0, entrances: [], report: {} };
  // the margin of the data (beyond the play area + 50 m; the play area is the union of the eight rectangles) only gets walls / cornices / decks / colliders
  const near = info.filter((r) => !r.b.waterfront && ctx.L.inPlay(r.st.ob.cx, r.st.ob.cz, -50));
  const run = (name, fn) => {
    const started = performance.now();
    if (ctx.recordBake) console.log(`[city-detail] ${name} start`);
    try { const r = fn(); out.triangles += r.triangles || 0; out.report[name] = r; return r; }
    catch (e) { console.warn('[city] ' + name + ' failed:', e && e.stack || e); out.report[name] = { error: String(e && e.message) }; return {}; }
    finally {
      const cells = M.seal();
      if (ctx.recordBake) console.log(`[city-detail] ${name} complete ${Math.round(performance.now() - started)} ms; sealed ${cells} cells`);
    }
  };
  run('balconies', () => buildBalconies(ctx, { M, info: near }));
  run('erkers', () => buildErkers(ctx, { M, info: near }));
  run('gables', () => buildGables(ctx, { M, info: near }));
  run('roof', () => buildRoofDetail(ctx, { M, info: near }));
  const avoid = [];
  for (const dw of ctx.L.DOORWAYS) avoid.push({ x: dw.x, z: dw.z, r: 14 });
  for (const b of BUILDINGS) if (b.skip === 0 && owned && isOwned(owned, b.id)) for (const p of b.polys) for (let i = 0; i < p.o.length; i += 2) avoid.push({ x: p.o[i], z: p.o[i + 1], r: 7 });
  const atlas = new SignAtlas(ctx);
  const sh = run('shops', () => buildShops(ctx, { M, info: near, atlas, avoid, net }));
  if (sh.entrances) out.entrances = sh.entrances;
  if (typeof process !== 'undefined' && process.env && process.env.CITY_DEBUG) console.log('[city] sign atlas pages', atlas.pages.length, 'rects', atlas.count);
  atlas.finish(root);
  run('entrances', () => buildEntranceGeo(ctx, { M, info: near, net }));
  run('scaffold', () => buildScaffolds(ctx, { M, info: near }));
  run('clutter', () => buildClutter(ctx, { M, info: near }));
  return out;
}
