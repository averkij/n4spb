// wildlife - the birds of central Saint Petersburg (July) and the audio triggers that belong to them.
//
// WHAT IT DRAWS (files in wildlife/):
//   models.js  low-poly cel-shaded birds: hooded crow (grey body, black head / wings), feral pigeon (grey, green neck sheen), house sparrow, swift, black-headed gull (white, pale grey
//              back, black wing tips, chocolate hood, red bill and legs), mallard drake and hen (+ ducklings). Body + head + mirrored wing + shared legs, 100-300 triangles each.
//   birds.js   the bird engine (InstancedMeshes, a state machine per bird, flocks that flee the player and resettle):
//                pigeon flocks (5-8) feeding on the zones of zones.js: Vosstaniya Square around the obelisk, the station forecourt, the Anichkov Bridge pavements (at deck height), cafes along
//                Nevsky, Gostiny Dvor, the Catherine Garden, the Kazan lawn / benches / Voronikhin garden, the setts round the Alexander Column and the General Staff arch, the Winter Palace
//                front, the Alexander Garden fountain, Senate Square, St Isaac's garden and the Nicholas I monument; they lift off at ~4.5 m, circle (the loop is chosen so that it stays
//                out of the houses) for 9-15 s and settle again;
//                sparrow flocks at the cafe terraces and in the gardens (they dive into the nearest tree, bush or the top of a lamp);
//                hooded crows on lamp tops, tree tops and the cornices of the street facades, walking / pecking at cafe pavements and the squares;
//                black-headed gulls on the granite posts of the Fontanka / Moika / Griboedov / Winter Canal parapets, on the roll parapet of the Neva and the backs of the two copper lions of
//                the Palace Pier, on the roofs and railings of the tourist boats of the whole map (riding with the boat: pure function of the boat's state(t); they take off before a boat
//                goes under the Anichkov Bridge and land again on the predicted spot of a boat), gliding over the Neva and the Fontanka, and two escort gulls that circle the moving boats;
//                a swift flock wheeling over the squares and Nevsky at golden hour only.
//   zones.js   the table of where the animals gather (weights from docs/research/west-life-furniture.md section 8).
//   director.js the DENSITY DIRECTOR: ~130 birds on a map 2.4x bigger than the first build, so what the player has left behind (> 240-420 m, never in the view cone) is moved to the zones, posts,
//              boats and waters 70-230 m from the player: the Kazan lawn is full when the player is at Kazan, the Neva parapet when he walks the Palace Embankment.
//   boats.js   one descriptor per boat of the map (landmarksC Fontanka boats + environment boats of the Moika / Griboedov / Winter Canal / Neva): roof / railing slots, hull boxes.
//   ducks.js   six groups of mallards (pairs, a trio, hens with 4-7 ducklings) swimming slow lanes 4-5 m off the quay walls of the Fontanka, the Moika and the Griboedov Canal (validated
//              lanes: clear of every boat hull of every lap, the landing stages, the bridges and the descents), with a wake each; the groups follow the player like the birds.
//   threat.js  the vehicle the player drives (ctx.drive: the motor boat, a car) as the water birds see it: speed + heading decide who flies away (docs/water-transport-birds-flee-boats.md).
//   world.js   placement tests (play area union, building / trunk / solid (physics columns) / carriageway / water / obelisk steps / bridge pavement), perch list (lamp tops, parapet posts of
//              every embankment, Neva roll, lions, tree tops, cornices), ground level (square paving, pavements +0.12, low steps read from the physics, humped bridge deck), water points.
// Sources: docs/research/people.md section O10 (species, looks, behaviour) and S8 (counts), west-life-furniture.md section 8 (birds per zone), fontanka.md (parapet posts), west-canals-bridges.md
// (boats, piers, quay), the Yakutsk sibling's wildlife (engine) and the Moscow sibling's boats / gulls (flap-glide cycles). No dogs (the people module has the dog walkers).
// Sounds: crows / gulls call from their real positions (ctx.audio.play('crow' | 'gull', { position })), pigeons clap their wings at take-off ('wings'), the hens quack now and then
// ('duck'); core/audio.js (same owner) synthesises all of them and the street / water / crowd / cafe / metro ambience; one 'boatHum' loop per tourist boat follows boats[i].state(t);
// the two big fountains (Kazan, Alexander Garden) get a positional 'fountain' loop.
// Services: ctx.services.wildlife = { birds, dogs: [], spots, crowds ([{ x, z, r, f, l }]: the tourist squares for core/audio.js 'crowd'), cafes (the cafe pavements where crumbs fall: core/audio.js plays a terrace murmur near them), ducks, perches, flocks, zones, sites,
//   debug } - `birds` are the live state objects ({ sp, st, x, y, z, yaw, ... }); `spots` are viewpoints { name, x, z, yaw, kind, target } from which a flock / the gulls / the ducks can be watched
//   (stand there, look along yaw; the flocks move with the player, so a flock zone spot shows its flock only when the player has been about for a few seconds).
// Quality: ctx.quality.level (or .name) 'medium' = 70 %, 'low' = 45 % of the animals.  Triangles: ~40 k static-equivalent (instanced), budget 100 k.  Draw calls: 16 birds + 7 ducks meshes (instanced).
// Build time: 0.25 - 0.6 s (svc.debug.timing: per part and per phase; tools/wildlife-test.mjs prints it and limits it to 700 ms). It was 1.8 s once the map had the island: the sparrow shelters scanned every tree of the map per
//   candidate, the lane test of the streets ran five full grid scans per 0.25 m memo cell (now one pass: world.js onLane), the foraging sites (~2 000) were validated one by one at build (now lazily: birds.js siteOk), the duck obstacles
//   were tested linearly (now a 40 m hash), the cafe search scanned its taken points linearly, and the roof / water lattices were denser than the animals need.
// URL switches: ?wl=nofear (animals ignore the player: close-ups), ?wl=gallery (one of each species in a row in front of the start view, implies nofear and swifts),
//               ?wl=nobirds, ?wl=noducks, ?wl=swifts (swifts at any time of day), ?wl=nodirector (the animals stay where they were put).
// Update-safe: every per-frame call is wrapped; a failing part switches itself off and logs once.
// TODO (not built): no pigeons on the Klodt horses / the Admiralty spire, the swifts do not scream at the player's position (the ambient 'birds' loop has them), no birds on the bridge decks
//   other than the Anichkov Bridge pavements, no tree-top perches in the gardens of the west whose trees the landmark modules draw themselves (they could publish services.landmarksX.treeList = [{ x, z, h }]; the island sights do),
//   no squirrels (no photo check: the dossier says none), no gulls on the Gulf shore
//   rocks (the shore is the Neva quay type: the gulls use its posts and the sky over the water), no bathers, no beach.
// Tests: node tools/wildlife-test.mjs (behaviour, headless), node tools/check.mjs wildlife; ?wl=gallery + shot.mjs for the models.
import { makeWorld } from './wildlife/world.js';
import { buildBirds } from './wildlife/birds.js';
import { buildDucks } from './wildlife/ducks.js';
import { crowdTable } from './wildlife/zones.js';
import { makeThreat } from './wildlife/threat.js';
import { ZONES } from './lib/area-tables.js';

export async function build(ctx) {
  const svc = (ctx.services.wildlife = { birds: [], dogs: [], spots: [], ducks: [], perches: [], flocks: [], debug: {} });
  const flags = new Set((typeof location !== 'undefined' && location.search ? new URLSearchParams(location.search).get('wl') || '' : '').split(',').filter(Boolean));
  const noFear = flags.has('nofear') || flags.has('gallery');
  const say = (name, pos, volume = 1) => { try { if (ctx.audio && ctx.audio.play) ctx.audio.play(name, { position: pos, volume }); } catch (e) { /* audio is optional */ } };
  const tm = { world: 0, birds: 0, ducks: 0, rest: 0 }, now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());      // build time per part (svc.debug.timing, ms)
  let tk = now();
  const W = makeWorld(ctx);
  const threat = makeThreat(ctx);      // the vehicle the player drives, as the water birds see it (wildlife/threat.js); refreshed once a frame below
  tm.world = now() - tk; tk = now();
  svc.perches = W.perches;
  svc.debug = { world: W, flags: [...flags], timing: tm, threat }; tm.worldPhases = W.timing;
  const parts = [];
  const L = ctx.L;

  if (!flags.has('nobirds')) {
    try {
      const B = buildBirds(ctx, W, say, { noFear, swifts: flags.has('swifts') || flags.has('gallery'), noDirector: flags.has('nodirector') || flags.has('gallery'), threat });
      ctx.add(B.group); parts.push(['birds', B]); tm.birds = now() - tk; tk = now(); tm.birdPhases = B.timing;
      svc.birds = B.birds.filter((b) => !b.dead); svc.flocks = B.flocks; svc.cafes = B.cafes; svc.zones = B.zones; svc.sites = B.sites; svc.debug.birds = B;
      if (flags.has('gallery')) gallery(ctx, W, B);
    } catch (e) { console.error('[wildlife] birds failed:', e); }
  }
  if (!flags.has('noducks')) {
    try {
      const D = buildDucks(ctx, W, say, { noFear, noDirector: flags.has('nodirector'), threat });
      if (D.ducks.length) { ctx.add(D.group); parts.push(['ducks', D]); svc.ducks = D.ducks; svc.debug.ducks = D; }
    } catch (e) { console.error('[wildlife] ducks failed:', e); }
    tm.ducks = now() - tk; tk = now();
  }
  svc.spots = makeSpots(ctx, W, svc);
  try { svc.crowds = crowdTable(ctx, W); } catch (e) { svc.crowds = []; console.error('[wildlife] crowd zones failed:', e); }   // read by the 'crowd' ambience of core/audio.js
  // the hum of the tourist boats: one positional loop per MOVING boat (core/audio.js 'boatHum'), its position follows boats[i].state(t); asleep beyond 150 m
  try {
    if (ctx.audio && ctx.audio.loop) {
      for (const b of ctx.services.landmarksC?.boats || []) if (b && b.state) ctx.audio.loop('boatHum', { position: () => { const st = b.state(ctx.time || 0); return { x: st.x, y: L.RIVER_Y.water + 0.8, z: st.z }; }, volume: 0.7 });
      for (const b of ctx.services.environment?.boats || []) if (b && b.moving && b.state) ctx.audio.loop('boatHum', { position: () => { const st = b.state(ctx.time || 0); return { x: st.x, y: (L.WATERWAYS[b.key]?.water ?? L.RIVER_Y.water) + 0.8, z: st.z }; }, volume: 0.6 });
    }
  } catch (e) { /* audio is optional */ }
  // the big fountains of the area (ZONES.fountains of the area module; the strip: the Kazan garden fountain (-1469, -279) and the Alexander Garden fountain (-2334.8, -494.8; landmarksH garden.js)): a positional 'fountain' loop each
  try {
    if (ctx.audio && ctx.audio.loop && !flags.has('nofountain')) {
      for (const [x, z, v] of ZONES.fountains) if (L.inPlay(x, z)) ctx.audio.loop('fountain', { position: { x, y: 1.2, z }, volume: v });
    }
  } catch (e) { /* audio is optional */ }

  const off = new Set();
  ctx.onUpdate((dt, t) => {
    try { threat.update(); } catch (e) { threat.active = false; }
    for (const [name, P] of parts) {
      if (off.has(name)) continue;
      try { P.update(dt, t); } catch (e) { off.add(name); console.error('[wildlife] ' + name + ' update failed, switched off:', e); }
    }
  });
  void L;
}

/** viewpoints: stand 7 m from the subject on free ground and look at it. The zones (pigeons / sparrows), the Neva parapet gulls, the lions, a boat gull, the ducks. */
function makeSpots(ctx, W, svc) {
  const L = ctx.L, out = [];
  const add = (name, kind, x, z, y = 0, r = 7) => {
    for (let k = 0; k < 24; k++) {
      const a = k * 0.5236 + 0.3, sx = x + Math.cos(a) * r, sz = z + Math.sin(a) * r;
      if (W.ok(sx, sz, { road: 1.5 })) { out.push({ name, kind, x: sx, z: sz, yaw: L.yawToward(sx, sz, x, z), pitch: 4, target: { x, z, y } }); return; }
    }
    out.push({ name, kind, x, z, yaw: 0, pitch: 4, target: { x, z, y } });
  };
  const sites = [...(svc.sites?.pigeon || []), ...(svc.sites?.sparrow || [])];
  const seen = new Set();
  for (const s of sites) {
    if (!s.name || seen.has(s.name) || s.tag === 'nevsky' && seen.has('nevsky') || s.tag === 'terrace') continue;
    seen.add(s.name); if (s.tag === 'nevsky') seen.add('nevsky');
    add(s.name, s.name.startsWith('Воробьи') ? 'sparrow' : 'pigeon', s.x, s.z);
  }
  const byKey = (key) => W.perches.find((p) => p.kind === 'post' && p.key === key && L.inPlay(p.x, p.z, 4));
  const g = byKey('neva'); if (g) add('Чайки на парапете Невы · Gulls on the Neva parapet', 'gull', g.x, g.z, g.y, 5);
  const g2 = byKey('moika'); if (g2) add('Чайки на ограде Мойки · Gulls on the Moika railing', 'gull', g2.x, g2.z, g2.y, 5);
  const ln = W.perches.find((p) => p.kind === 'lion'); if (ln) add('Чайка на льве Дворцовой пристани · A gull on the Palace Pier lion', 'gull', ln.x, ln.z, ln.y, 8);
  const bt = svc.debug?.birds?.boatList?.find((b) => b.key === 'neva' && !b.moving); if (bt) { const a = bt.at(0); add('Чайки на лодках у пристани · Gulls on the boats at the pier', 'gull', a.x, a.z, bt.y0 + 2, 9); }
  const dk = svc.debug?.ducks?.groups?.[0]; if (dk) { const p = svc.debug.ducks.groupPose(dk, 0); out.push({ name: 'Утки у набережной · Ducks by the quay', kind: 'duck', x: p.x, z: p.z, yaw: 0, pitch: 4, target: { x: p.x, z: p.z, y: L.RIVER_Y.water }, note: 'stand on the quay above the lane of the first group' }); }
  return out;
}

/** QA view (gallery): one bird of every species in a row 3 m in front of the start view, standing still; a second one ferries to and fro across the view */
function gallery(ctx, W, B) {
  const L = ctx.L, h = L.HERO, yaw = (h.yaw * Math.PI) / 180, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = -fz, rz = fx;
  const seen = new Set(); let k = 0;
  const at = (f, r) => ({ x: h.x + fx * f + rx * r, z: h.z + fz * f + rz * r });
  for (const b of B.birds) {
    if (b.dead || seen.has(b.sp) || b.st === 'soar') continue;
    seen.add(b.sp);
    const x = h.x + fx * 3 + rx * (k - 1.5) * 0.7, z = h.z + fz * 3 + rz * (k - 1.5) * 0.7; k++;
    B.setGround(b, x, z, 0, { x, z, r: 0.5 });
    b.until = 1e9; b.actEnd = 1e9; b.yaw = Math.atan2(rx, rz); b.flock = null;
  }
  const second = new Set(); k = 0;
  for (const b of B.birds) {
    if (b.dead || b.st === 'soar' || second.has(b.sp)) continue;
    if (!seen.has(b.sp) || b.st === 'ground' && Math.hypot(b.x - (h.x + fx * 3), b.z - (h.z + fz * 3)) < 4) continue;
    second.add(b.sp); b.flock = null;
    const f = 6 + 1.2 * k++, A = at(f, -9), C = at(f, 9), y = 1.4 + 0.5 * (k % 3);
    b.x = A.x; b.z = A.z; b.y = y; b.until = 1e9;
    const go = (bb, tt, to) => { const P = to ? C : A; B.launch(bb, P.x, y + 0.6 * Math.sin(tt), P.z, tt, { flare: false, done: (b2, t2) => go(b2, t2, !to) }); };
    go(b, 0, true);
  }
}
