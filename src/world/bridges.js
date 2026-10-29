// bridges - the bridges of the Nevsky strip (docs/research/west-canals-bridges.md, palace-square-hermitage.md section 10, kazan-cathedral.md section 7, admiralty-stisaac.md, mars-bridges-canals.md):
//   Belinsky (Fontanka, three granite arches), Kazansky (Nevsky over the Griboyedov Canal: low granite arch, solid parapets), Green (Nevsky over the Moika: green cast-iron arch, four pylons with gilded lamp standards),
//   Pevchesky (palmette railing, dark green, 72 m wide), Red (red arch, four obelisks), Blue (97 m wide, ultramarine), Novo-Konyushenny, Hermitage + 1st / 2nd Winter bridges (granite),
//   the footbridges Bankovsky (four winged lions), Mucny, Italyansky, Pochtamtsky (chain), and the Palace Bridge (steel trusses on granite piers, COMPLETE as built: its last spans lie beyond the play rectangles and are scenery).
//   The Mars Field / Summer Garden reach (docs/research/mars-bridges-canals.md, docs/MARS-BRIEF.md): Lower Swan (swan-lower), Panteleymonovsky (gilded, eagle standards), 1st Engineer, 1st + 2nd Sadovy, Bolshoy Konyushenny,
//   the Triple Bridge (Teatralny + Malo-Konyushenny: pedestrian sett decks) = bridges/styles2.js + rails2.js (railing patterns) + sculpt2.js (standards, eagle, candelabra); and from the south-west the Kamenny and
//   Fonarny bridges (styles3.js) and the Pochtamtsky footbridge (foot.js).  Only the sites of the AREA are built (bridges/sites.js SITES = the sites that pass siteInArea: the id is a sub-group of the area's GROUPS.bridges or the centre lies in the data extent;
//   the strip has all 24 + the Palace Bridge, Palace-Liteyny 18 + the Prachechny, Upper Swan and 2nd Engineer bridges of bridges/sites-pal.js + the Palace Bridge); the ones that stand in the 120 m margin are scenery.  Every OSM way of those bridges is claimed in groups.js, so streets leaves the deck to this module while the lanes stay in the lane graph.
//   Files: bridges/sites.js (pure data: frames, widths, deck zones: other modules may import it) · groups.js (claims) · kit.js (geometry collector) · mats.js · rails.js (railing patterns,
//   instanced panels) · arch.js (the generic arch road bridge) · styles.js / styles2.js / styles3.js (per-bridge extras: pylons, lamps, obelisks, boards) · foot.js (footbridges) · sculpt*.js (griffins, lamps) · palace.js · deck.js (profile / closeBank).
//   Owns every sub-group of layout.GROUPS.bridges.  Publishes ctx.services.bridges = { list (+ extra entries along a long deck: traffic prefilters by 190 m), deckY(x, z), masts, spans } and wraps ctx.services.landmarksC.bridge.deckY so that traffic / people / drive
//   (which read the Anichkov deck height) also ride the decks of these bridges.  NO flags / flagpoles, no alarm sounds (user rules).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './bridges/kit.js';
import { makeMats } from './bridges/mats.js';
import { addVoMats } from './bridges/mats-vo.js';
import { buildBlag } from './bridges/blag.js';
import { LONG, buildLong } from './bridges/long.js';      // the long bridges (Birzhevoy, Tuchkov ...): a spec each, built where the area claims the id
import { STYLES4 } from './bridges/styles4.js';      // Uralsky, Smolensky (Smolenka, Vasilyevsky-Okrug 7)
import { STYLES5 } from './bridges/styles5.js';      // Nalichny (+ Korablestroiteley, the mouth bridges: not claimed by any area)
import { buildFoot3 } from './bridges/foot3.js';      // the Novo-Andreevsky footbridge
import { FOOT, VO2_SITES } from './bridges/sites-vo2.js';
import { openHedgeGaps } from './bridges/gaps.js';
import { BRIDGE_GROUP_KEYS } from './lib/area-tables.js';
import { makeRailBatch } from './bridges/rails.js';
import { SITES, WATER_Y } from './bridges/sites.js';
import { makeBelinsky } from './bridges/belinsky.js';
import { makeArch } from './bridges/arch.js';
import { STYLES } from './bridges/styles.js';
import { makeFoot } from './bridges/foot.js';
import { STYLES2 } from './bridges/styles2.js';
import { STYLES3 } from './bridges/styles3.js';
import { STYLES_PAL } from './bridges/styles-pal.js';
import { buildPalace } from './bridges/palace.js';
import { solidPiers } from './bridges/piers.js';
import { BRIDGE_ZONES } from './environment/waterways.js';
import { bridgeZones } from './environment/river.js';

export async function build(ctx) {
  const M = makeMats(ctx), rails = makeRailBatch(ctx);
  addVoMats(ctx, M);
  const root = new THREE.Group(); root.name = 'bridges';
  const decals = M.decalMats, failed = [], list = [], stats = { tris: 0, rails: 0, colliders: 0 };
  const env = ctx.services && ctx.services.environment;
  const waterY = (ww) => { const e = env && env.waterways && env.waterways[ww]; return e && Number.isFinite(e.y) ? e.y : WATER_Y[ww]; };
  const ZONES = BRIDGE_ZONES;
  const QZONES = bridgeZones();                                          // the quay openings as the environment computes them (river.js bridgeZones: test(x, z, grow))
  const ZID = { novo: 'novo-konyushenny', zimny1: 'zimny-1', zimny2: 'zimny-2', 'bolsh-konyushenny': 'bolshoy-konyushenny' };

  const flush = (P, name, waterAt = null, extraTris = 0) => {      // extraTris: the triangles of the knock posts of the bridge (bridges/knock-posts.js)
    stats.tris += P.tris + (extraTris || 0); (stats.per ||= {})[name] = P.tris + (extraTris || 0);                  // triangles per bridge (services.bridges.stats.per)
    for (const k of P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[bridges] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const meshes = P.build(root, { name: 'brg-' + name, waterY: waterAt, sub: waterAt === null ? null : (m) => ctx.noOutline(m) });      // waterAt: the piers of a bridge over a big river are cut at the water, the part under it takes no outline (kit.js build, docs/AREAS.md 15.z)
    // Bridge services retain their drawing closures for inspection. The
    // uploaded meshes own copies; construction arrays must not live with them.
    P.b.clear();
    for (const m of meshes) if (decals.has(m.material)) ctx.noOutline(m);
    const pr = solidPiers(ctx, meshes); stats.piers = (stats.piers || 0) + pr.boxes;      // the drawn pillars in open water are solid for a floating hull (bridges/piers.js)
    return meshes;
  };

  for (const site of SITES) {
    if (site.kind === 'zone') continue;                                  // a quay-zone record (sites-vo.js BLAG_ZONE): the bridge itself is drawn below by bridges/blag.js
    try {
      const P = new Parts();
      const e = { ctx, P, M, rails, waterY: waterY(site.ww), site, zones: QZONES };
      let B = null;
      if (site.kind === 'road') {
        B = site.id === 'belinsky' ? makeBelinsky(e, site) : makeArch(e, site); B.draw();
        const S = STYLES[site.id] || STYLES2[site.style] || STYLES3[site.style] || STYLES_PAL[site.style] || STYLES4[site.style] || STYLES5[site.style]; if (S) S(e, B);
        B.closeQuay(ZONES.find((z) => z.id === (ZID[site.id] || site.id)));
      } else {
        B = makeFoot(e, site); B.draw();
      }
      if (B.colliders) B.colliders();
      flush(P, site.id, null, B.extraTris);
      stats.rails += B.info.rails; stats.colliders += B.info.colliders;
      list.push({ id: site.id, name: site.name, nameEn: site.nameEn, x: site.cx, z: site.cz, at: site.at, site, B });
    } catch (err) { console.error(`[bridges] ${site.id} failed:`, err); failed.push(`${site.id}: ${err && err.stack || err}`); }
  }
  // the Blagoveshchensky Bridge, bank to bank (bridges/blag.js, data sites-vo.js BLAG), when the area lists it (its quay-zone record passes siteInArea)
  try {
    if (SITES.some((s) => s.id === 'blagoveshchensky')) { const P = new Parts(), info = buildBlag({ ctx, P, M, rails, waterY: waterY('neva'), zones: QZONES }); info.colliders(); flush(P, 'blagoveshchensky'); stats.colliders += info.info.colliders; list.push({ id: 'blagoveshchensky', name: 'Благовещенский мост', nameEn: 'Blagoveshchensky Bridge', x: info.x, z: info.z, at: [info.at.x, info.at.z], B: info }); }
  } catch (err) { console.error('[bridges] blagoveshchensky failed:', err); failed.push('blagoveshchensky: ' + (err && err.stack || err)); }
  // the long bridges of the Malaya Neva (bridges/long.js LONG: Birzhevoy, Tuchkov), bank to bank, for the ids the area claims (a spec each; the piers are cut at the water like the Palace Bridge's)
  for (const sp of LONG) {
    if (!BRIDGE_GROUP_KEYS.has(sp.id)) continue;
    try { const P = new Parts(), info = buildLong({ ctx, P, M, rails, waterY: waterY(sp.ww || 'neva'), zones: QZONES }, sp); info.colliders(); flush(P, sp.id, waterY(sp.ww || 'neva'), info.extraTris); stats.colliders += info.info.colliders; list.push({ id: sp.id, name: sp.name, nameEn: sp.nameEn, x: info.x, z: info.z, at: [info.at.x, info.at.z], B: info }); }
    catch (err) { console.error(`[bridges] ${sp.id} failed:`, err); failed.push(`${sp.id}: ${err && err.stack || err}`); }
  }
  // the Novo-Andreevsky footbridge (bridges/foot3.js, data sites-vo2.js FOOT) over the Smolenka
  try {
    if (BRIDGE_GROUP_KEYS.has(FOOT.id)) { const P = new Parts(), info = buildFoot3({ ctx, P, M, rails, waterY: waterY('smolenka'), zones: QZONES }); info.colliders(); flush(P, FOOT.id, null, info.extraTris); stats.colliders += info.info.colliders; list.push({ id: FOOT.id, name: FOOT.name, nameEn: FOOT.nameEn, x: info.x, z: info.z, at: info.at, B: info }); }
  } catch (err) { console.error('[bridges] novo-andreevsky failed:', err); failed.push('novo-andreevsky: ' + (err && err.stack || err)); }
  // the lawn hedges of the environment (thin 1.1 m boxes, up to 180 m long) may cross a foot path that leads onto the Nalichny / Novo-Andreevsky approaches: cut a gap into every hedge box that crosses an approach corridor (colliders only, bridges/gaps.js)
  try {
    const cor = VO2_SITES.filter((s) => BRIDGE_GROUP_KEYS.has(s.id)).map((s) => ({ cx: s.cx, cz: s.cz, b: s.b, u0: s.bank[0] - 2 - 28, u1: s.bank[1] + 2 + 28, v0: s.v0 - 0.4, v1: s.v1 + 0.4 }));
    if (BRIDGE_GROUP_KEYS.has(FOOT.id)) cor.push({ cx: FOOT.cx, cz: FOOT.cz, b: FOOT.b, u0: -FOOT.len / 2 - 28, u1: FOOT.len / 2 + 28, v0: -FOOT.hw - 1.2, v1: FOOT.hw + 1.2 });
    if (cor.length) stats.hedgeGaps = openHedgeGaps(ctx, cor);
  } catch (err) { console.warn('[bridges] approach gaps failed:', err); }
  // the bascule span of the Palace Bridge is built by module landmarksPalaceBridge when the page lists it (`leaves`, docs/AREAS.md 13.10); the strip keeps the closed bridge
  try {
    const P = new Parts(); const info = buildPalace({ ctx, P, M, rails, waterY: waterY('neva'), leaves: Array.isArray(ctx.buildList) && ctx.buildList.includes('landmarksPalaceBridge') }); info.colliders(); flush(P, 'palace', waterY('neva')); stats.colliders += info.info.colliders; list.push({ id: 'palace', name: 'Дворцовый мост', nameEn: 'Palace Bridge', x: info.x, z: info.z, at: info.at ? [info.at.x, info.at.z] : [info.x, info.z], B: info });
  } catch (err) { console.error('[bridges] palace failed:', err); failed.push('palace: ' + (err && err.stack || err)); }
  // The environment lays an invisible fallback deck (a walk box at y 0 + two parapet boxes y -2 .. 1.3) into a BRIDGE_ZONES row it believes unbuilt: the parapet boxes fence the pavements of the real deck.
  // Remove a fallback whose walk box centre lies on the Palace Bridge deck (colliders only).
  try {
    const ph = ctx.physics, longs = list.filter((b) => b.B && b.B.span); let removed = 0;
    for (const it of ph.items.slice()) {
      if (it.type !== 'walk' || it.y0 !== -1.2 || it.top !== 0 || !longs.some((b) => b.B.deckAt(it.cx, it.cz) !== null)) continue;
      for (const bx of ph.items.slice()) if (bx.type === 'box' && bx.y0 === -2 && bx.y1 === 1.3 && Math.abs(bx.hd * 2 - 0.5) < 0.05 && Math.abs(Math.hypot(bx.cx - it.cx, bx.cz - it.cz) - it.hd) < 1.5) { ph.remove(bx); removed++; }
      ph.remove(it); removed++;
    }
    stats.fallbackDecksRemoved = removed;
  } catch (err) { console.warn('[bridges] fallback deck removal failed:', err); }
  // The Triple Bridge sits on the corner where the Griboyedov Canal quay meets the Moika quay: the environment leaves short curved quay-wall colliders (0.5 m thick, y -8 .. 1.25) at the
  // corner that poke into the NW corner of the Malo-Konyushenny deck and block its left walkway.  Remove the quay colliders whose centre lies inside a Triple Bridge deck (collider only).
  try {
    const ph = ctx.physics, tri = SITES.filter((q) => q.style === 'aegis'); let removed = 0;
    for (const it of ph.items.slice()) {
      // the environment's invisible fallback deck of a Triple Bridge zone (a walk box 15.6 m wide + two 0.5 m parapet boxes y -2 .. 1.3) duplicates my deck and fences its walkways
      const fallback = tri.some((q) => Math.hypot(it.cx - q.cx, it.cz - q.cz) < 32) && ((it.type === 'walk' && it.y0 === -1.2 && Math.abs(it.hd * 2 - 15.6) < 0.05) || (it.type === 'box' && it.y0 === -2 && it.y1 === 1.3 && Math.abs(it.hd * 2 - 0.5) < 0.05));
      if (fallback) { ph.remove(it); removed++; continue; }
      if (it.type !== 'box' || it.y0 > -7 || it.y1 !== 1.25 || it.hd * 2 > 0.6 || it.hw * 2 > 4) continue;
      if (tri.some((q) => { const d = list.find((b) => b.id === q.id); return d && d.B.deckAt && [[0, 0], [1.4, 0], [-1.4, 0], [0, 1.4], [0, -1.4], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([dx, dz]) => d.B.deckAt(it.cx + dx, it.cz + dz) !== null); })) { ph.remove(it); removed++; }
    }
    stats.quayCollidersOpened = removed;
  } catch (err) { console.warn('[bridges] quay collider opening failed:', err); }
  rails.flush(root); stats.rails = rails.count();
  ctx.addStatic(root);

  // ---------------------------------------------------------------- services
  const decks = list.filter((b) => b.B && b.B.deckAt);
  // B.bounds (world AABB round the deck, set by the builders) prefilters the ~10^6 start-up queries of nav / lamps / parking / props; a deck without bounds is always asked
  const dB = decks.map((d) => d.B.bounds || null), nD = decks.length;
  // Gavan (docs/gdm-G.md; the source project's bridges.js `EXT`): decks that another module draws and a vehicle rides (the Shkipersky bridge is landmarksGavan's). Its `bridge.deckY` is asked at call time
  // (lazily); inert for every page whose area does not claim the module (the table is filtered by the area's GROUPS: no row, no list entry, no deck query).
  const claimsOf = (m) => ((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS[m]) || []).length > 0;
  const EXT = [{ id: 'shkipersky', name: 'Шкиперский мост', nameEn: 'Shkipersky Bridge (landmarksGavan)', x: -7009.5, z: -31.0, r: 24, svc: 'landmarksGavan' }].filter((e) => claimsOf(e.svc));
  const extY = (x, z) => {
    for (let i = 0; i < EXT.length; i++) {
      const e = EXT[i]; if (Math.abs(x - e.x) > e.r || Math.abs(z - e.z) > e.r) continue;
      const s = ctx.services[e.svc], f = s && s.bridge && s.bridge.deckY; if (typeof f !== 'function') continue;
      const y = f(x, z); if (y !== null && y !== undefined) return y;
    }
    return null;
  };
  const deckY = (x, z) => {
    for (let i = 0; i < nD; i++) {
      const b = dB[i]; if (b && (x < b[0] || x > b[2] || z < b[1] || z > b[3])) continue;
      const y = decks[i].B.deckAt(x, z); if (y !== null) return y;
    }
    return EXT.length ? extY(x, z) : null;
  };
  const lc = ctx.services.landmarksC && ctx.services.landmarksC.bridge;
  if (lc && typeof lc.deckY === 'function' && !lc.deckY.__bridges) {
    const orig = lc.deckY, wrapped = (x, z) => { const y = orig(x, z); return y !== null ? y : deckY(x, z); };
    wrapped.__bridges = true; lc.deckY = wrapped;
  }
  // traffic prefilters deckY by a 190 m radius round every list entry: a long bridge publishes extra entries (B.anchors) along its deck; masts = the lamp / contact-wire standards of the long
  // bridges ({ x, y, z, h, kind, id }), spans = their axes ({ id, a, b, hw })
  const pub = [];
  for (const b of list) { pub.push({ id: b.id, name: b.name, nameEn: b.nameEn, x: b.x, z: b.z }); for (const a of (b.B && b.B.anchors) || []) pub.push({ id: b.id, name: b.name, nameEn: b.nameEn, x: a.x, z: a.z, part: true }); }
  for (const e of EXT) pub.push({ id: e.id, name: e.name, nameEn: e.nameEn, x: e.x, z: e.z, external: e.svc });      // the 190 m prefilter of traffic / people must reach the decks of other modules too
  const masts = [], spans = [];
  for (const b of list) { for (const m of (b.B && b.B.masts) || []) masts.push({ id: b.id, ...m }); if (b.B && b.B.span) spans.push({ id: b.id, ...b.B.span }); }
  const pits = [];      // the wide corner stairs (bridges/stairs.js): { id, x, z, landing: { x, z, y }, top: { y }, site, bridge } for people / photo spots
  for (const b of list) for (const q of (b.B && b.B.pits) || []) pits.push({ ...q, bridge: b.id });
  ctx.services.bridges = { list: pub, deckY, stats, failed, masts, spans, pits };
  const S = (ctx.services.landmarks ||= {});
  S.photoSpots = (S.photoSpots || []).concat(list.map((b) => ({ x: b.at[0], z: b.at[1], yaw: 0, name: b.name })));
  if (failed.length) throw new Error('bridges parts failed:\n' + failed.join('\n'));
}
