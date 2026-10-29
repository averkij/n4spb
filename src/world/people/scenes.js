// people/scenes.js - who is on the streets of the centre of Saint Petersburg at 16:30 on a July weekday: the population plan (simulation half).
// Counts follow docs/research/people.md S1 / S2 / S3 (~1250 people on 'high'; zone weights of zones.js put 8-14 per 10 m of pavement on Nevsky between Mayakovskaya and Vosstaniya and
// the crowds on the square and at the station): singles (tourists, office workers, students, mid-aged, elders), pairs, small groups, families with prams, dog walkers, riders (bikes,
// e-scooters, kids on kick scooters), couriers, tour groups (a guide with a plain coloured umbrella + 10-14 followers, no flags), photographers at the Klodt groups / the obelisk / the
// sights, people queueing for the metro (they walk in and out through services.metro.entrances), smokers at doors, bus stops, benches.  The scripted places (the station hall, the
// forecourt, the taxi rank, the platforms, the buskers, the wedding, the police pair ...) are vignettes.js.  Everybody comes from look.js makeSpec; everything scales with the quality tier.
import { makeSpec } from './chars.js';
import { GESTURE as G } from './contract.js';
import { addVignettes } from './vignettes.js';

export function populate(ctx, nav, sim, opts = {}) {
  const R = ctx.rng('people-pop'), N = nav.N, f = opts.density ?? 1;
  const n = (base) => Math.max(0, Math.round(base * f));
  const rr = (a, b) => a + (b - a) * R();
  const stats = {}, zf = (x, z) => (nav.densityFactor ? nav.densityFactor(x, z) : 1), keep = (x, z) => R() < zf(x, z);          // station-zone thinning (people.js DENSITY.station)
  const count = (k) => { stats[k] = (stats[k] || 0) + 1; };

  // weighted random start node over the big components (zone weights: the avenue, the square and the station are busy)
  const comps = []; let totW = 0;
  for (const c of sim.bigComps) { const ids = sim.compNodes.get(c), cum = new Float32Array(ids.length); let w = 0; ids.forEach((id, i) => { w += nav.zoneW(N.x[id], N.z[id]); cum[i] = w; }); comps.push({ c, ids, cum, w }); totW += w; }
  // the castle zone (people.js DENSITY.mars): the generic walkers start in them only up to 40 % of the head-count cap (the scripted places of mars.js come on top)
  const mz = (nav.marsCfg && nav.marsCfg.zones) || [], mzN = mz.map(() => 0);
  const startNode = (pred) => {
    for (let tries = 0; tries < 12; tries++) {
      let x = R() * totW, cm = comps[comps.length - 1];
      for (const e of comps) { x -= e.w; if (x <= 0) { cm = e; break; } }
      const y = R() * cm.w; let lo = 0, hi = cm.ids.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cm.cum[m] < y) lo = m + 1; else hi = m; }
      const id = cm.ids[lo]; if ((!pred || pred(id)) && R() < zf(N.x[id], N.z[id])) { const k = mz.length ? nav.marsZone(N.x[id], N.z[id]) : -1; if (k >= 0 && k < mz.length) { if (mzN[k] >= mz[k].maxPeople * 0.4) continue; mzN[k]++; } return id; }
    }
    return comps[0].ids[0];
  };
  const streetNode = (id) => { const k = N.k[id]; return k === 's' || k === 'a' || k === 'p' || k === 'k'; };
  // no riders in the garden (people.js DENSITY.garden.noRiders: the Smolensky cemetery): a walker with a vehicle, and the parent a kid on a scooter follows (ride = true), starts on a street node outside it
  const noRide = nav.gardenActive === true && nav.gardenCfg.noRiders === true, outsideNode = (id) => streetNode(id) && !nav.inGarden(N.x[id], N.z[id]);
  const walker = (specOpts, prefs, scene = 'walk', tweak = null, ride = false) => {
    const spec = makeSpec(R, specOpts); if (tweak) tweak(spec);
    const a = sim.spawn(spec, { prefs, scene }); sim.placeAtNode(a, startNode(noRide && (ride || spec.vehicle) ? outsideNode : streetNode)); count(scene); return a;
  };
  /** put follower b beside its leader a (a walkable spot within d metres, else on the leader) */
  const nextTo = (b, a, d) => { let x = a.x, z = a.z; for (const k of [d, -d, d * 0.5, -d * 0.5, 0.2]) { const px = a.x + Math.cos(a.yaw) * k, pz = a.z - Math.sin(a.yaw) * k; if (nav.walkable(px, pz) && nav.obstDist(px, pz, 0.6) > 0.3 && nav.cover(px, pz) < -0.4) { x = px; z = pz; break; } } sim.place(b, x, z, a.yaw, a.y); b.comp = a.comp; };

  const P_STROLL = { wander: 10, door: 1.2, bench: 0.6, stop: 0.6, spot: 0.9, metro: 1.4 };
  const P_BUSY = { wander: 12, door: 2.0, bench: 0.2, stop: 1.2, spot: 0.2, metro: 2.6 };
  const P_TOURIST = { wander: 5, door: 0.4, bench: 0.6, stop: 0.2, spot: 5, metro: 0.5 };
  const P_TOUR = { wander: 3.5, door: 0, bench: 0, stop: 0, spot: 6, metro: 0.2 };
  const P_ELDER = { wander: 6, door: 0.8, bench: 4, stop: 1, spot: 0.3, metro: 0.5 };
  const P_RIDER = { wander: 10, door: 0, bench: 0, stop: 0, spot: 0, metro: 0 };
  const P_COURIER = { wander: 4, door: 9, bench: 0, stop: 0, spot: 0, metro: 0.3 };
  const P_METRO = { wander: 3, door: 0.3, bench: 0, stop: 0, spot: 0, metro: 9 };

  // ---- singles: tourists, office workers, students, the mid-aged, elders, teens (the mix is look.js ARCH)
  for (let i = 0; i < n(250); i++) walker({ role: 'walk' }, R() < 0.4 ? P_BUSY : R() < 0.5 ? P_STROLL : P_TOURIST, 'single');
  for (let i = 0; i < n(60); i++) walker({ role: 'tourist' }, P_TOURIST, 'tourist');
  for (let i = 0; i < n(26); i++) walker({ role: 'office' }, P_BUSY, 'office');
  for (let i = 0; i < n(26); i++) walker({ role: 'elder' }, P_ELDER, 'elder');
  for (let i = 0; i < n(22); i++) walker({ role: 'student' }, P_STROLL, 'student');
  for (let i = 0; i < n(30); i++) walker({ role: 'walk' }, P_METRO, 'commuter');
  for (let i = 0; i < n(14); i++) walker({ role: 'dogwalker' }, P_STROLL, 'dog');
  for (let i = 0; i < n(12); i++) walker({ role: 'parent' }, P_STROLL, 'pram');

  // ---- pairs: friends, couples, a parent with a child (the follower slaves to the leader)
  for (let i = 0; i < n(88); i++) {
    const kind = R(), a = walker({ role: kind < 0.3 ? 'student' : kind < 0.6 ? 'tourist' : 'walk' }, kind < 0.55 ? P_TOURIST : P_STROLL, 'pair');
    let b;
    if (kind < 0.18) { b = sim.spawn(makeSpec(R, { role: 'kid' }), { prefs: a.prefs, scene: 'pair' }); b.vpref = Math.min(b.vpref, a.vpref * 1.15); sim.follow(b, a, (R() < 0.5 ? 1 : -1) * 0.7, 0.2); }
    else { b = sim.spawn(makeSpec(R, { role: kind < 0.6 ? 'tourist' : 'walk', fem: kind < 0.55 ? !a.spec.fem : a.spec.fem }), { prefs: a.prefs, scene: 'pair' }); const v = Math.min(a.vpref, b.vpref); a.vpref = b.vpref = v; sim.follow(b, a, (R() < 0.5 ? 1 : -1) * 0.8, 0.15); }
    nextTo(b, a, 0.8); count('pair');
  }
  // ---- small groups (3-4 friends, students, a family with two kids)
  for (let i = 0; i < n(20); i++) {
    const a = walker({ role: R() < 0.5 ? 'student' : 'tourist' }, P_STROLL, 'group'), k = 2 + (R() < 0.5 ? 1 : 0), v = a.vpref;
    for (let j = 0; j < k; j++) { const b = sim.spawn(makeSpec(R, { role: R() < 0.3 ? 'kid' : R() < 0.5 ? 'student' : 'tourist' }), { prefs: a.prefs, scene: 'group' }); b.vpref = Math.min(b.vpref, v); const side = (j % 2 ? 1 : -1) * (0.8 + 0.7 * Math.floor(j / 2)); sim.follow(b, a, side, 0.4 + 0.3 * j); b.delay = 4 + 3 * j; nextTo(b, a, side); count('group'); }
  }
  // ---- guided tour groups: a guide with a plain coloured umbrella (NO flag) walking 1 m ahead of a two-wide column of 10-14 followers, stopping at the sights; some with matching caps
  const GUIDE_COLS = ['#d33a2a', '#f0cf45', '#2f6fc0'];
  for (let g = 0; g < n(6); g++) {
    const gc = GUIDE_COLS[g % 3], asian = g % 3 === 2 || R() < 0.25, capCol = asian ? (R() < 0.5 ? '#d94a3a' : '#2f6fc0') : (R() < 0.5 ? gc : '#f0eee8');
    const lead = walker({ role: 'guide', guideCol: gc }, P_TOUR, 'tourguide'); lead.vpref = Math.min(lead.vpref, 1.0);
    const m = 10 + Math.floor(R() * 5);
    for (let j = 0; j < m; j++) {
      const row = Math.floor(j / 2), side = (j % 2 ? 1 : -1) * 0.62;
      const b = sim.spawn(makeSpec(R, { role: asian && R() < 0.8 ? 'asian' : 'follower', cap: capCol }), { prefs: P_TOUR, scene: 'tour' });
      b.vpref = lead.vpref * 1.04; sim.follow(b, lead, side, 0.9 + 0.75 * row); b.delay = Math.round((1.2 + 0.8 * row) / (lead.vpref * 0.1)); b.arc = { ang: (j - (m - 1) / 2) * 0.28, rad: 2.2 + 0.55 * row };
      nextTo(b, lead, side); count('tour');
    }
  }
  // ---- riders and kids with toys (the kids ride behind a walking parent)
  for (let i = 0; i < n(8); i++) walker({ role: 'rider', vehicle: 'bike' }, P_RIDER, 'bike');
  for (let i = 0; i < n(14); i++) walker({ role: 'rider', vehicle: 'escooter' }, P_RIDER, 'escooter');
  for (let i = 0; i < n(7); i++) {
    const a = walker({ role: 'walk' }, P_STROLL, 'family', null, true), b = sim.spawn(makeSpec(R, { role: 'kid', vehicle: R() < 0.7 ? 'kick' : 'balance' }), { prefs: a.prefs, scene: 'family' });
    b.vpref = Math.min(b.vpref, a.vpref * 1.3); sim.follow(b, a, (R() < 0.5 ? 1 : -1) * 0.9, 0.3); nextTo(b, a, 0.9); count('kidrider');
  }
  for (let i = 0; i < n(10); i++) walker({ role: 'courier', vehicle: R() < 0.4 ? 'escooter' : null }, P_COURIER, 'courier');
  for (let i = 0; i < n(5); i++) walker({ role: 'cleaner' }, { wander: 10, door: 0, bench: 0, stop: 0, spot: 0, metro: 0 }, 'cleaner', (sp) => { sp.speed = 0.6; });

  // ---- sitters on the benches (about a third of the seats, staggered)
  {
    const seats = []; for (const b of nav.benches) b.seats.forEach((s, si) => seats.push([b, si]));
    for (let i = seats.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [seats[i], seats[j]] = [seats[j], seats[i]]; }
    const want = Math.min(seats.length, n(40));
    for (let i = 0, k = 0; k < want && i < seats.length; i++) {
      const [b, si] = seats[i]; if (b.seats[si].taken >= 0 || b.where === 'hall' || b.where === 'platform') continue;
      const role = R() < 0.25 ? 'elder' : 'walk';
      const spec = makeSpec(R, { role }); const a = sim.spawn(spec, { prefs: role === 'elder' ? P_ELDER : P_STROLL, scene: 'sitter' });
      sim.sitAt(a, b, si, 0); count('sitter'); k++;
    }
  }
  // ---- photographers at the Klodt groups, the obelisk and the sights: couples photograph each other, singles shoot the horses
  {
    // `share` caps the part of a type's free spots this pass may take: the plinth count (n(38)) was calibrated for the 48 Klodt spots of the full city, the strip has the 22 of the Anichkov Bridge, and the scripted
    // guests of the plinths (the guided Asian tour group, the photo couples: vignettes.js) need free spots that this pass must leave
    const take = (type, k, share = 1) => { const free = nav.spots.filter((p) => p.type === type && p.taken < 0 && keep(p.x, p.z)); free.sort(() => R() - 0.5); return free.slice(0, Math.min(k, Math.floor(free.length * share))); };
    for (const [type, k, role, share] of [['plinth', n(38), 'tourist', 0.6], ['obelisk', n(14), 'tourist'], ['monument', n(6), 'tourist'], ['view', n(18), 'tourist']]) {
      for (const p of take(type, k, share)) {
        const a = sim.spawn(makeSpec(R, { role }), { prefs: P_TOURIST, scene: 'photo-' + type }); p.taken = a.i;
        sim.standAt(a, p.x, p.z, p.yaw, [G.PHOTO, G.PHOTO, G.SELFIE, G.PHONE, G.LOOKAROUND, G.POINT], rr(12, 80), { type: 'spot', p }); count('photo');
      }
    }
  }
  // ---- smokers at office doors, bus stops
  {
    const es = nav.entrances.filter((e) => e.kind === 'door' && nav.comp[e.node] === nav.main && keep(e.x, e.z)).sort((p, q) => q.w * (0.5 + R()) - p.w * (0.5 + R()));
    for (let i = 0; i < Math.min(es.length, n(14)); i++) {
      const e = es[i]; if (nav.cover(e.ax, e.az) > -0.5) continue; const spec = makeSpec(R, { role: 'office' }); spec.smokes = true; const a = sim.spawn(spec, { prefs: P_BUSY, scene: 'smoker', smoker: true });
      sim.standAt(a, e.ax + (R() - 0.5), e.az + (R() - 0.5), e.rotY + Math.PI, [G.SMOKE, G.SMOKE, G.PHONE], rr(10, 100), { type: 'door', e }); count('smoker');
    }
    for (const s of nav.stops) {
      const k = Math.min(s.spots.length, Math.round(n(3) * (0.6 + R() * 0.8)));
      for (let i = 0; i < k; i++) {
        const p = s.spots[i]; if (p.taken >= 0 || !keep(p.x, p.z)) continue; const a = sim.spawn(makeSpec(R, { role: R() < 0.2 ? 'elder' : 'walk' }), { prefs: P_STROLL, scene: 'busstop' }); p.taken = a.i;
        sim.standAt(a, p.x, p.z, s.rotY, [G.PHONE, G.WATCH, G.LOOKAROUND, G.NONE], rr(5, 80), { type: 'stop', s, si: i }); count('busstop');
      }
    }
  }
  // ---- the scripted places: the station, the forecourt, the platforms, performers, the wedding, the police pair ...
  const S2 = { R, rr, n, f, west: opts.west || { scale: 1, platforms: 1 }, mars: opts.mars || { scale: 1 }, qf: opts.qf ?? 1, stats, count, walker, startNode, nextTo, P: { P_STROLL, P_BUSY, P_TOURIST, P_TOUR, P_ELDER, P_RIDER, P_COURIER, P_METRO } };
  addVignettes(ctx, nav, sim, S2);
  stats.total = sim.agents.length;
  if (S2.westInfo) { stats.west = S2.westInfo.places; stats.westMs = S2.westInfo.ms; } if (S2.marsInfo) { stats.mars = S2.marsInfo.places; stats.marsMs = S2.marsInfo.ms; } if (S2.metroInfo) { stats.metroPlatforms = S2.metroInfo.stations; stats.metroMs = S2.metroInfo.ms; }
  return stats;
}
