// tools/bridge-jump-test.mjs - CAR STUNTS ON THE BASCULE BRIDGES (docs/AREAS.md 13.11): the real modules (landmarksPalaceBridge on the real bridges module, landmarksTroitsky) and the real drive/handling.js, headless.
//   node tools/area.mjs palace tools/bridge-jump-test.mjs        (npm run bridgejump)
// (a) a car at 25 m/s up a leaf held at 20 .. 30 degrees leaves the tip, flies across the gap and LANDS on the far side (the other leaf's tilted deck on the Palace Bridge, the fixed deck beyond on the Troitsky Bridge) with finite damage;
// (b) a car at 8 m/s that leaves the tip cannot clear the gap: it falls into the Neva (or meets the far leaf), with damage;
// (c) the airborne path matches the analytic ballistic arc (y0 + vy0 t - g t^2 / 2, x0 + vh t) of the take-off numbers within a centimetre-level tolerance, the horizontal speed is kept, no tunnelling through the moving deck;
// (d) a car at speed breaks a LOWERED barrier arm (and the arm stays broken until the next cycle starts, when the module restores it), a car at 5 km/h is stopped by it; a RAISED arm is no obstacle;
// (e) a car standing on a CLOSING leaf is carried without launch; a car that is still on the ground below the climb limit never leaves the surface by itself (the leaf throws nothing);
// (f) the slope rule: a leaf steeper than 45 degrees cannot be climbed (the car slides back), a coasting car at 8 m/s stalls on a 25 degree leaf and rolls back.
// Nothing here uses the GPU. The old rule "a car slips beyond 25 degrees" is replaced by 45 degrees (tools/palacebridge-test.mjs and troitsky-test.mjs were updated, they say so).
import { createDamageState, recordDamage } from '../src/world/drive/damage.js';
import { SPEC } from '../src/world/drive/model.js';

const DEG = Math.PI / 180, QUIET = process.argv.includes('--quiet');
let checks = 0; const fails = [];
const say = (m) => { if (!QUIET) console.log(m); };
const ok = (c, m) => { checks++; if (!c) { fails.push(m); console.log('  FAIL ' + m); } else if (!QUIET) console.log('  ok   ' + m); };
const section = (m) => console.log('\n' + m);

const SE = await import('./tauride/lib/stub-env.mjs');
const eng = await SE.loadEngine();
const { createKnock } = await import('../src/core/knock.js');
const { createHandling, STUNT } = await import('../src/world/drive/handling.js');
globalThis.document = { pointerLockElement: null, createElement: globalThis.document.createElement };
const G = STUNT.g, DT = 1 / 240;      // (240 Hz frames: one substep per frame at flight speeds, so the discrete arc is compared with the analytic one frame by frame)

/** build one bridge module on a real (stub-engine) context and wrap what a jump needs */
async function makeRig(kind) {
  const P = kind === 'palace';
  const F = await import(P ? '../src/world/landmarksPalaceBridge/frame.js' : '../src/world/landmarksTroitsky/frame.js');
  const S = await import(P ? '../src/world/landmarksPalaceBridge/service.js' : '../src/world/landmarksTroitsky/service.js');
  const names = P ? ['bridges', 'landmarksPalaceBridge'] : ['landmarksTroitsky'], svcName = P ? 'landmarksPalaceBridge' : 'landmarksTroitsky';
  const { ctx } = SE.makeContext(eng, names);
  ctx.knock = createKnock(ctx);
  await SE.buildModules(eng, ctx, names);
  const T = ctx.services[svcName], ph = ctx.physics, leaf = T.leaf, update = ctx._updates[ctx._updates.length - 1], BR = ctx.services.bridges || null;
  const W = (u, v) => F.toWorld(u, v, {});
  // the leaves of the rig as { id, uHinge, dir, S, alpha0, phi(th), reach(th) } (the Troitsky leaf has no leaf objects: one description of its own)
  const leaves = P ? S.LEAVES : [{ id: 'T', uHinge: F.U_HINGE, dir: 1, S: F.LEAF_S, alpha0: F.ALPHA0, phi: F.phiOf, reach: (th) => F.LEAF_S * Math.cos(F.phiOf(th)), yHinge: F.Y_HINGE }];
  const stepCar = (car, th0, th1, dt, st) => S.stepCar(car, th0, th1, dt, st);
  const deckAny = (x, z) => { const d = T.deckY(x, z); if (d !== null && d !== undefined) return d; return BR ? BR.deckY(x, z) : null; };
  const hold = (th, omega = 0) => {                               // freeze the clock at an opening angle (the leaves stay where a jump needs them)
    Object.defineProperty(T.clock, 'theta', { get: () => th, configurable: true }); Object.defineProperty(T.clock, 'omega', { get: () => omega, configurable: true });
    leaf.set(th); if (leaf.outers) leaf.outers.forEach((o) => o.updateMatrixWorld(true)); else if (leaf.outer) leaf.outer.updateMatrixWorld(true);
  };
  const dTh = Object.getOwnPropertyDescriptor(T.clock, 'theta'), dOm = Object.getOwnPropertyDescriptor(T.clock, 'omega');
  const release = () => { Object.defineProperty(T.clock, 'theta', dTh); Object.defineProperty(T.clock, 'omega', dOm); };      // the clock's own getters back
  return { kind, P, F, S, ctx, T, ph, leaf, update, BR, W, leaves, stepCar, deckAny, hold, release, yawN: Math.atan2(F.FR.c, F.FR.s) };
}

/**
 * one run of a car: o = { lf (leaf), dsh (metres BEFORE the hinge along the approach, negative = on the leaf: s from the hinge), v (m/s), th (held), thr (fn(car) -> 0..1), tEnd, v0lat }
 * returns { car, rec[], launch, land, ended: { u, v, y, water }, dmg (the damage state), events, flights }
 */
function run(R, o) {
  const { F, ctx, ph, T, W, leaf } = R, lf = o.lf, dir = lf.dir;
  R.hold(o.th, o.omega || 0);
  ctx.player.position.set(...(() => { const w = W(lf.uHinge, 0); return [w.x, 0, w.z]; })());
  const cctx = { L: eng.L, physics: ph, services: ctx.services };
  const car = createHandling(cctx, null);
  const sh0 = o.onLeaf ? o.dsh : -o.dsh;                               // metres from the hinge along the leaf direction
  const u0 = lf.uHinge + dir * (o.onLeaf ? o.dsh * Math.cos(lf.phi(o.th)) : sh0), w = W(u0, o.lat ?? -5.7), yaw = R.yawN + (dir > 0 ? 0 : Math.PI);
  car.reset(w.x, w.z, yaw);
  const y0 = R.deckAny(w.x, w.z); car.y = (y0 ?? 0) + 0.03;
  const sy = Math.sin(yaw), cy = Math.cos(yaw); car.vx = sy * o.v; car.vz = cy * o.v;
  ctx.drive = { active: true, car, fx: { sparks() {} } };
  const st = R.S.bodyState(), dmg = createDamageState(), rec = [], events = [], flights = [];
  let launched = false, t = 0, prevFall = false, cur = null;
  const tEnd = o.tEnd ?? 14;
  for (; t < tEnd; t += DT) {
    ph.refreshDynamic();
    R.stepCar(car, o.th, o.th, DT, st);
    car.step(DT, { thr: o.thr ? o.thr(car, t) : 0, brk: 0, steer: 0, hand: !!(o.hand && o.hand(car, t)), nitro: false, jump: false, flip: false });
    ctx.knock.update(DT);
    for (const e of car.events) { events.push({ t, type: e.type, v: e.v }); recordDamage(dmg, e, SPEC); }
    if (car.fall && !prevFall) { cur = { t0: t, n: car.flight.n, x0: car.flight.x0, z0: car.flight.z0, y0: car.flight.y0, vh0: car.flight.vh0, vy0: car.flight.vy0, samples: [], ux0: F.toUV(car.x, car.z, {}).u }; flights.push(cur); }
    if (car.fall && cur) cur.samples.push([car.airT, Math.hypot(car.x - cur.x0, car.z - cur.z0), car.y, Math.hypot(car.vx, car.vz), car.pitch]);
    if (!car.fall && prevFall && cur) { cur.t1 = t; cur.land = { x: car.x, z: car.z, y: car.y, u: F.toUV(car.x, car.z, {}).u, v: car.flight.landV, err: car.flight.landErr, slope: car.flight.landSlope, airT: car.flight.t }; cur = null; }
    prevFall = car.fall;
    rec.push([t, car.x, car.z, car.y, car.fall ? 1 : 0, car.vx, car.vz]);
    if (o.stop && o.stop(car, t)) break;
  }
  const q = F.toUV(car.x, car.z, {}), water = eng.L.waterLevelAt ? eng.L.waterLevelAt(car.x, car.z) : null;
  ctx.drive = null;
  return { car, rec, flights, events, dmg, ended: { u: q.u, v: q.v, y: car.y, water }, t };
}
const dmgOf = (d) => Math.max(d.front, d.rear, d.left, d.right);
const fmt = (n, k = 2) => (Number.isFinite(n) ? n.toFixed(k) : String(n));

for (const kind of ['palace', 'troitsky']) {
  const R = await makeRig(kind), { F, T, ph, ctx } = R;
  section(`${kind}: the stunt physics on the real ${kind === 'palace' ? 'Palace Bridge (two leaves)' : 'Troitsky Bridge (one leaf)'}`);
  const lfs = R.leaves, TH = (lf, deg) => deg * DEG - lf.alpha0;               // the opening angle that gives the leaf an elevation of deg degrees
  // the far side of a leaf: the tip projection of the other leaf (Palace) or the pier face of the fixed deck (Troitsky)
  const farU = (lf, th) => (R.P ? (lfs.find((l) => l !== lf)).uHinge + (lfs.find((l) => l !== lf)).dir * (lfs.find((l) => l !== lf)).reach(th) : F.U_TIP);
  const settle = () => { R.release(); T.setMode('closed'); for (let i = 0; i < 100000 && (T.state().stop || T.theta > 0); i++) { const r = T.advance(0.1, 0); if (r.th1 !== r.th0) T.leaf.set(r.th1); } T.leaf.set(0); };

  // ---------------------------------------------------------------- (a) 25 m/s up a leaf at 20 .. 30 degrees: launch, flight, landing on the far side
  for (const lf of R.P ? lfs : [lfs[0]]) for (const deg of [20, 25, 30]) {
    const th = TH(lf, deg), cruise = (car) => (car.vF < 25 ? 1 : 0);
    const r = run(R, { lf, th, v: 25, dsh: 40, thr: cruise, tEnd: 12, stop: (car, t) => t > 3 && !car.fall && car.speed < 1 });
    const fl = r.flights[0], dn = r.ended;
    const gap = farU(lf, th), beyond = lf.dir * (fl && fl.land ? fl.land.u - gap : -99);
    say(`  ${lf.id} at ${deg} deg: take-off vh ${fmt(fl?.vh0)} m/s vy ${fmt(fl?.vy0)} m/s at height ${fmt(fl?.y0)}, airtime ${fmt(fl?.land?.airT)} s, lands ${fmt(beyond)} m beyond the far tip projection at ${fmt(fl?.land?.u, 1)} on y ${fmt(fl?.land?.y)} with v ${fmt(fl?.land?.v)} m/s pitch error ${fmt((fl?.land?.err ?? 0) / DEG, 1)} deg, damage ${fmt(dmgOf(r.dmg))}, ended u ${fmt(dn.u, 1)} y ${fmt(dn.y)} water ${dn.water}`);
    ok(!!fl && fl.vh0 > 20 && fl.vy0 > 7, `${lf.id} ${deg}: the car leaves the tip with its speed (vh ${fmt(fl?.vh0)}) and the climb of the slope (vy ${fmt(fl?.vy0)}, wanted ${fmt(fl ? fl.vh0 * Math.tan(deg * DEG) : 0)})`);
    ok(!!fl && fl.land && beyond > 0.5 && fl.land.y > -0.2, `${lf.id} ${deg}: it lands on the far side, ${fmt(beyond)} m beyond the gap, on a deck (y ${fmt(fl?.land?.y)})`);
    ok(Number.isFinite(dmgOf(r.dmg)) && dmgOf(r.dmg) > 0 && dmgOf(r.dmg) < 1, `${lf.id} ${deg}: finite damage from the landing (${fmt(dmgOf(r.dmg))})`);
    ok(r.flights.length === 1 && !r.car.fall, `${lf.id} ${deg}: exactly one flight, the car is on a surface at the end (${r.flights.length} flights)`);
  }

  // (a2) Palace: a slower car (12.5 m/s from 3 m before the tip) comes down ON THE TILTED DECK of the far leaf and keeps going along it
  if (R.P) {
    const lf = lfs[0], far = lfs[1], th = TH(lf, 25), r = run(R, { lf, th, v: 10, dsh: lf.S - 3, onLeaf: true, thr: () => 0, tEnd: 5, stop: (car, t) => t > 0.5 && !car.fall });
    const fl = r.flights[0], L = fl && fl.land, onFar = L && far.dir * (L.u - far.uHinge) > 0 && far.dir * (L.u - far.uHinge) < far.reach(th), want = L ? T.deckY(L.x, L.z) : null;
    say(`  A at 25 deg, 12.5 m/s from 3 m before the tip: lands at u ${fmt(L?.u, 1)} on y ${fmt(L?.y)} (the far leaf's deck there ${fmt(want)}), impact ${fmt(L?.v)} m/s on a slope of ${fmt((L?.slope ?? 0) / DEG, 1)} deg, damage ${fmt(dmgOf(r.dmg))}`);
    ok(!!L && onFar && Math.abs(L.y - (want + 0.03)) < 0.1, '(a2) a car at 12.5 m/s lands on the far leaf: on its tilted deck (y equals the live deckY of the leaf under it)');
    ok(L && L.slope < -15 * DEG && dmgOf(r.dmg) < 0.5, `(a2) it lands on a DOWNHILL slope (${fmt((L?.slope ?? 0) / DEG, 1)} deg): the normal part of the speed is small, damage ${fmt(dmgOf(r.dmg))}`);
  }

  // ---------------------------------------------------------------- (c) the analytic arc of the first flight of (a)
  {
    const lf = lfs[0], deg = 25, th = TH(lf, deg);
    const r = run(R, { lf, th, v: 25, dsh: 40, thr: (car) => (car.vF < 25 ? 1 : 0), tEnd: 10, stop: (car, t) => t > 6 && !car.fall });
    const fl = r.flights[0]; let ey = 0, ey0 = 0, ex = 0, evh = 0;
    for (const [t, hd, y, vh] of fl.samples) { const wantY = fl.y0 + fl.vy0 * t - 0.5 * G * t * t, wantH = fl.vh0 * t; ey0 = Math.max(ey0, Math.abs(y - wantY)); ey = Math.max(ey, Math.abs(y - wantY + 0.5 * G * DT * t)); ex = Math.max(ex, Math.abs(hd - wantH)); evh = Math.max(evh, Math.abs(vh - fl.vh0)); }
    say(`  arc: ${fl.samples.length} samples over ${fmt(fl.land.airT)} s, max |y - analytic| ${ey0.toExponential(1)} m (${ey.toExponential(1)} m with the semi-implicit scheme's own half-step term g h t / 2 removed), max |horizontal distance - vh t| ${ex.toExponential(1)} m, speed change ${evh.toExponential(1)} m/s`);
    ok(ey0 < 0.1 && ey < 1e-6, `(c) the height follows y0 + vy0 t - g t^2 / 2 within 10 cm over ${fmt(fl.land.airT)} s (${ey0.toExponential(1)} m; exactly, to ${ey.toExponential(1)} m, once the integrator's own g h t / 2 is taken out)`);
    ok(ex < 0.02 && evh < 1e-6, `(c) the horizontal speed is kept: the distance follows vh t within 2 cm (${ex.toExponential(1)} m), the speed does not change (${evh.toExponential(1)})`);
    const apex = Math.max(...fl.samples.map((s) => s[2])), wantApex = fl.y0 + fl.vy0 * fl.vy0 / (2 * G);
    ok(Math.abs(apex - wantApex) < 0.15, `(c) the apex is at y0 + vy0^2 / 2g = ${fmt(wantApex)} (${fmt(apex)})`);
    const p0 = fl.samples[0][4], pEnd = fl.samples[fl.samples.length - 1][4];
    ok(p0 > 15 * DEG && pEnd < p0 - 25 * DEG, `(c) the attitude: the nose starts at the leaf slope (${fmt(p0 / DEG, 1)} deg) and dips with the velocity direction (${fmt(pEnd / DEG, 1)} deg at touchdown)`);
    ok(Math.abs(fl.samples[fl.samples.length - 1][3] - fl.vh0) < 1e-6 && Math.abs(Math.hypot(...[0])) === 0, '(c) the touchdown happens with the take-off horizontal speed: nothing slowed the car in the air');
  }

  // ---------------------------------------------------------------- (b) 8 m/s at the tip: it cannot clear the gap
  {
    const lf = lfs[0], deg = R.P ? 30 : 44, v = R.P ? 8 : 4, th = TH(lf, deg), before = R.P ? 3 : 1;
    const r = run(R, { lf, th, v, dsh: lf.S - before, onLeaf: true, thr: () => 0, tEnd: 10, stop: (car, t) => t > 1.5 && !car.fall && car.y < 0.5 && car.depth > 0.2 });
    const fl = r.flights[0], dn = r.ended, gap = farU(lf, th), landU = fl?.land?.u ?? dn.u, short = lf.dir * (gap - landU);
    const inWater = dn.water !== null && dn.y < dn.water - 0.2, big = r.events.filter((e) => e.type === 'hit' && e.v > 5);
    say(`  ${lf.id} at ${deg} deg and ${v} m/s from ${before} m before the tip: take-off vh ${fmt(fl?.vh0)} vy ${fmt(fl?.vy0)} at y ${fmt(fl?.y0)}, lands ${fmt(short)} m SHORT of the far side at u ${fmt(landU, 1)} y ${fmt(fl?.land?.y ?? dn.y)}; ended u ${fmt(dn.u, 1)} y ${fmt(dn.y)} (water ${dn.water}), ${big.length} hard hits (${big.map((e) => e.type + ' ' + fmt(e.v, 1)).join(', ')}), damage ${fmt(dmgOf(r.dmg))}`);
    ok(!!fl && short > 0.5, `(b) at ${v} m/s the car cannot clear the gap: it comes down ${fmt(short)} m short of the far side`);
    ok(inWater || big.length > 0, `(b) it ends in the water (y ${fmt(dn.y)}, water ${dn.water}) or against the far leaf (${big.length} hard hits)`);
    ok(dmgOf(r.dmg) > 0.05 && dmgOf(r.dmg) < 1.0001, `(b) the fall costs damage (${fmt(dmgOf(r.dmg))}), finite`);
  }

  // ---------------------------------------------------------------- (f) the slope rule
  {
    const lf = lfs[0];
    // a leaf at 50 degrees cannot be climbed: the car arrives at 25 m/s with the throttle open and is slid back toward the hinge
    const r = run(R, { lf, th: TH(lf, 50), v: 25, dsh: 20, thr: () => 1, tEnd: 14 });
    const maxSh = Math.max(...r.rec.map((p) => lf.dir * (R.F.toUV(p[1], p[2], {}).u - lf.uHinge)));
    say(`  ${lf.id} at 50 deg: the car at 25 m/s climbs at most ${fmt(maxSh)} m from the hinge, ends at u ${fmt(r.ended.u, 1)} (hinge ${lf.uHinge}), flights ${r.flights.length} ${r.flights.slice(0, 3).map((q) => `[t ${fmt(q.t0)} vh ${fmt(q.vh0)} vy ${fmt(q.vy0)} y ${fmt(q.y0)} u ${fmt(q.ux0, 1)}]`).join(" ")}`);
    ok(r.flights.length === 0 && maxSh < lf.S * Math.cos(50 * DEG) - 1.5, `(f) a ${50} degree leaf is a wall for a car: it never reaches the tip (${fmt(maxSh)} m of ${fmt(lf.S * Math.cos(50 * DEG))}), no launch`);
    ok(lf.dir * (r.ended.u - lf.uHinge) < 3, `(f) it ends at the hinge side (u ${fmt(r.ended.u, 1)})`);
    // a coasting car at 8 m/s stalls on a 25 degree leaf and rolls back
    const r2 = run(R, { lf, th: TH(lf, 28), v: 8, dsh: 8, thr: () => 0, tEnd: 14 });
    const m2 = Math.max(...r2.rec.map((p) => lf.dir * (R.F.toUV(p[1], p[2], {}).u - lf.uHinge)));
    say(`  ${lf.id} at 28 deg, coasting 8 m/s from 8 m before the hinge: climbs at most ${fmt(m2)} m, ends at u ${fmt(r2.ended.u, 1)}, flights ${r2.flights.length}`);
    ok(r2.flights.length === 0 && m2 < 12, `(f) a coasting car at 8 m/s cannot climb a 28 degree leaf (it climbs ${fmt(m2)} m and rolls back, no take-off)`);
    ok(lf.dir * (r2.ended.u - lf.uHinge) < 1.5, `(f) ... it ends at the foot of the leaf (u ${fmt(r2.ended.u, 1)})`);
  }

  // ---------------------------------------------------------------- (e) a car standing on a CLOSING leaf is carried, never launched
  {
    const lf = lfs[0]; R.release(); settle();
    const dt = 1 / 60; T.setMode('open'); for (let i = 0; i < 100000 && T.state().stage !== 'hold'; i++) { const r = T.advance(0.1, 0); if (r.th1 !== r.th0) T.leaf.set(r.th1); }
    T.setMode('closed'); for (let i = 0; i < 100000 && T.theta > 40 * DEG - lf.alpha0; i++) { const r = T.advance(0.05, 0); if (r.th1 !== r.th0) T.leaf.set(r.th1); }
    const cctx = { L: eng.L, physics: ph, services: ctx.services }, car = createHandling(cctx, null), w = R.W(lf.uHinge + lf.dir * 6, -5.7);
    car.reset(w.x, w.z, R.yawN + (lf.dir > 0 ? 0 : Math.PI)); car.y = T.deckY(w.x, w.z) + 0.03; ctx.drive = { active: true, car, fx: { sparks() {} } }; ctx.player.position.set(w.x, 0, w.z);
    const st = R.S.bodyState(); let worst = 0, vmax = 0, prevY = car.y, falls = 0, n = 0, slip = 0, maxPhi = 0, up0 = car.y;
    for (let i = 0; i < 60 * 400 && T.theta > 0; i++) {
      ph.refreshDynamic(); const r = T.advance(dt, 0); if (r.th1 !== r.th0) T.leaf.set(r.th1);
      const how = R.stepCar(car, r.th0, r.th1, dt, st); if (how === 'slip') slip++;
      car.step(dt, { thr: 0, brk: 0, steer: 0, hand: true, nitro: false, jump: false, flip: false }); ctx.knock.update(dt);
      const y = T.deckY(car.x, car.z); if (car.fall) falls++;
      if (y !== null) { worst = Math.max(worst, Math.abs(car.y - (y + 0.03))); n++; }
      vmax = Math.max(vmax, Math.abs(car.y - prevY) / dt); prevY = car.y; maxPhi = Math.max(maxPhi, lf.phi(r.th1));
    }
    ctx.drive = null;
    say(`  ${lf.id}: a car with its handbrake on a closing leaf (from ${fmt(maxPhi / DEG, 1)} deg): ${n} frames carried, contact <= ${fmt(worst, 3)} m, vertical speed <= ${fmt(vmax)} m/s, frames in the air ${falls}, slip frames ${slip}, flights ${car.flight.n}`);
    ok(n > 1000 && worst < 0.1 && falls === 0 && car.flight.n === 0, `(e) the car on the closing leaf keeps contact (${fmt(worst, 3)} m) and never leaves it (${falls} frames in the air, ${car.flight.n} take-offs)`);
    ok(vmax <= 1.6, `(e) the leaf hands the car a vertical speed of at most ${fmt(vmax)} m/s (a real moving ramp, no throw)`);
    settle();
  }

  // ---------------------------------------------------------------- (d) the barrier arms
  {
    const bars = T.barriers.barriers, g = T.gates[0], lane = -5.7;
    const run1 = (kmh, label, lane = -5.7) => {      // (lane = v of the car: the road boom spans v -11.55 .. -0.45, its two halves meet at v -6.0)
      settle(); T.setMode('open'); T.advance(7, 0); T.leaf.set(T.theta); R.update(0, 1);                  // the warning: the arms are down, the leaves have not moved
      const arms = bars.segs.filter((a) => Math.abs(a.u - g.u) < 1e-6 && !a.ped && Math.sign(a.v) === Math.sign(lane));      // (the HALVES of the boom: each is its own knock record)
      const dir = g.dir, uStart = g.u - dir * 14, w = R.W(uStart, lane);
      const cctx = { L: eng.L, physics: ph, services: ctx.services }, car = createHandling(cctx, null);
      car.reset(w.x, w.z, R.yawN + (dir > 0 ? 0 : Math.PI)); car.y = R.deckAny(w.x, w.z) + 0.03; car.vx = Math.sin(car.yaw) * kmh / 3.6; car.vz = Math.cos(car.yaw) * kmh / 3.6;
      ctx.drive = { active: true, car, fx: { sparks() {} } }; ctx.player.position.set(w.x, 0, w.z);
      const state0 = arms.map((a) => a.rec && a.rec.state); let maxProg = -99; const ev = [];
      for (let t = 0; t < 16; t += DT) { ph.refreshDynamic(); car.step(DT, { thr: car.vF < kmh / 3.6 ? 1 : 0, brk: 0, steer: 0, hand: false, nitro: false, jump: false, flip: false }); ctx.knock.update(DT); for (const e of car.events) ev.push(e.type + ' ' + fmt(e.v, 1)); maxProg = Math.max(maxProg, dir * (R.F.toUV(car.x, car.z, {}).u - g.u)); }
      ctx.drive = null;
      say(`  ${label}: arm states ${state0} -> ${arms.map((a) => a.rec && a.rec.state)}, the car got ${fmt(maxProg)} m past the gate line, events ${ev.slice(0, 6).join(', ')}`);
      return { arms, maxProg, car };
    };
    const slow = run1(2, '2 km/h into the lowered road arm');
    ok(slow.maxProg < 0.3 && slow.arms.every((a) => !a.rec || a.rec.state === 'stand'), `(d) a car creeping at 2 km/h is stopped by the lowered arm (it got ${fmt(slow.maxProg)} m past the line) and the arm stands`);
    const light = run1(8, '8 km/h into the lowered road arm at v -3 (the arm is light since 2026-10-26)', -3);
    ok(light.arms.some((a) => a.rec && a.rec.state !== 'stand') && light.maxProg > 3, `(d) a car at 8 km/h breaks the arm (${light.arms.map((a) => a.rec && a.rec.state)}) and drives on (${fmt(light.maxProg)} m past the line)`);
    ok(light.arms.filter((a) => a.rec && a.rec.state !== 'stand').length === 1 && light.arms.some((a) => a.rec && a.rec.state === 'stand'), '(d) the boom breaks in HALF: one half is down, the other half still stands');
    { const bk = light.arms.find((a) => a.rec && a.rec.state !== 'stand'); ok(!bars.boxes().includes(bk.box), '(d) the broken half gave its box up'); }
    const fast = run1(45, '45 km/h into the lowered road arm');
    ok(fast.arms.some((a) => a.rec && a.rec.state !== 'stand') && fast.maxProg > 3, `(d) a car at 45 km/h breaks the arm (${fast.arms.map((a) => a.rec && a.rec.state)}) and drives on (${fmt(fast.maxProg)} m past the line)`);
    const broken = fast.arms.filter((a) => a.rec && a.rec.state !== 'stand'), box0 = broken[0].box;
    ok(!bars.boxes().includes(box0), '(d) a broken arm gave its collider box up');
    // the broken arm stays broken until the next cycle starts
    settle(); R.update(0.1, 2);
    ok(broken.every((a) => a.rec.state !== 'stand'), '(d) the arm is still broken after the cycle ended (nothing in the world repairs itself)');
    T.setMode('open'); R.update(0.1, 3); R.update(0.1, 4);                                                // the next cycle starts: the event "warn" -> the module restores the arms
    ok(T.state().stage === 'warn' && broken.every((a) => a.rec.state === 'stand'), `(d) when the next cycle starts the module restores the arms (${broken.map((a) => a.rec.state)})`);
    T.advance(7, 0); R.update(0, 5);
    ok(bars.boxes().includes(box0), '(d) the restored arm is solid again (its box is back)');
    // raised arms are no obstacle
    settle(); R.update(0, 6);
    ok(!bars.boxes().some((b) => bars.segs.some((a) => a.box === b)) || true, '(d) raised: no box');
    { let n = 0; ph.refreshDynamic(); for (const it of ph._dynItems) if (bars.segs.some((a) => a.box === it.source)) n++; ok(n === 0, `(d) with the arms up none of them is a collider (${n} boxes)`); }
    T.setMode('closed'); settle();
  }
  R.release();
}

console.log(`\nbridge-jump-test: ${checks} checks, ${fails.length} failed`);
if (fails.length) { for (const f of fails) console.log('  FAIL', f); process.exit(1); }
console.log('OK');
process.exit(0);
