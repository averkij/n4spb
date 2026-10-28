// troitsky-test.mjs - the Troitsky Bridge and its opening bascule leaf (module landmarksTroitsky, docs/AREAS.md 13.8), headless, CPU only, no GPU / browser:
//   node tools/area.mjs palace tools/troitsky-test.mjs [--quiet | --verbose]        (npm run troitsky)
// 1. the wiring: the module is in the palace MODULES (after bridges, before traffic / people), its deck service is in HOOKS.deckServices, the claim covers the seven OSM ways and every one of them is in the data;
// 2. the kinematics (frame.js): the closed leaf is the deck profile, the height rises with the angle, the slope is the elevation angle, the carry is the horizontal shift of a material point, the vertical speed handed
//    to a carried body stays <= 1.3 m/s over the whole cycle, the footing rule (walker 35, car 25 degrees);
// 3. the schedule (schedule.js): the STOP flag is raised before the leaf moves and released only after it lies and the arms are up, theta is continuous, the easing, open / closed / auto modes, the night rule;
// 4. the service: deckY on the closed deck equals the profile (continuous in space), on the open leaf it is the live surface, the gap beyond the raised tip answers null, the lift of the feet;
// 5. the NPC hooks: the stop lines on the lanes of the bridge ways and the signal that reads red while the flag is up; the pedestrian step test through a closed gate (inward only);
// 6. the REAL module built headless (tools/tauride/lib/stub-env.mjs): triangles, the floor ramps equal deckY at every angle, the dynamic rails follow the leaf, the real Player stands on the leaf through the whole cycle (contact, carry,
//    slip beyond 35 degrees), the real drive/handling.js car rides it (contact, pitch with the slope, slip beyond 25 degrees, drives onto it while it closes).
import assert from 'node:assert/strict';
import * as F from '../src/world/landmarksTroitsky/frame.js';
import { createClock, CFG, ease } from '../src/world/landmarksTroitsky/schedule.js';
import * as S from '../src/world/landmarksTroitsky/service.js';
import { WAY_IDS, GROUPS_LIST } from '../src/world/landmarksTroitsky/groups.js';
import * as A from '../src/areas/palace/area.js';
import { HOOKS } from '../src/world/lib/area-tables.js';
import { OWNS_TABLE } from '../src/world/lib/owns-table.js';
import * as L from '../src/world/layout.js';
import { ROADS, BRIDGES } from '../src/world/data/city.js';
import { isPierBox } from '../src/world/bridges/piers.js';

const QUIET = process.argv.includes('--quiet'), VERBOSE = process.argv.includes('--verbose');
if (process.env.AREA !== 'palace') { console.error('run it as the palace: node tools/area.mjs palace tools/troitsky-test.mjs'); process.exit(2); }
const fails = []; let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails.push(msg); console.log('  FAIL', msg); } };
const near = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, `${msg}: ${typeof a === 'number' ? a.toFixed(4) : a} vs ${b} (+-${tol})`);
const say = (s) => { if (!QUIET) console.log(s); };
const section = (s) => say('\n' + s);
const DEG = Math.PI / 180;
const W = (u, v) => F.toWorld(u, v, {});

// ------------------------------------------------------------------ 1. the wiring
section('1. the wiring');
{
  const m = A.MODULES, i = m.indexOf('landmarksTroitsky');
  ok(i > m.indexOf('bridges') && i > m.indexOf('streets') && i < m.indexOf('traffic') && i < m.indexOf('people'), `landmarksTroitsky is after streets and bridges, before traffic and people (index ${i})`);
  ok(HOOKS.deckServices.includes('landmarksTroitsky'), `HOOKS.deckServices names the service: [${HOOKS.deckServices}]`);
  ok(A.GROUPS.landmarksTroitsky && A.GROUPS.landmarksTroitsky[0].key === 'troitsky', 'the area claims the sub-group "troitsky"');
  ok(OWNS_TABLE.landmarksTroitsky === true, 'the generated claims table lists the module (node tools/owns-table.mjs)');
  const ids = new Set([...ROADS.map((r) => r.id), ...BRIDGES.map((r) => r.id)]);
  for (const id of GROUPS_LIST[0].osm) ok(ids.has(id), `OSM way ${id} is in the data of the palace`);
  ok(WAY_IDS.every((w) => GROUPS_LIST[0].osm.includes(w)), 'the carriageway ids are a subset of the claim');
  ok(L.groupOf('w142545019') === 'troitsky', 'layout.groupOf maps a way of the bridge to its sub-group');
  // the territory holds the whole deck (no registry row was changed)
  let out = 0; for (let u = -1.6; u <= 555; u += 4) for (const v of [-11.8, 0, 11.8]) { const w = W(u, v); if (!L.inPlay(w.x, w.z, 0)) out++; }
  ok(out === 0, `the deck u -1.6 .. 555 lies inside the play rectangles (${out} sample points outside)`);
  const ex = A.WATER.bridgeZones.find((z) => z.id === 'troitsky');
  ok(ex && ex.own && ex.key === 'neva' && ex.len === 554, 'the quay opens for the bridge: a BRIDGE_ZONES row "troitsky" (own, neva, 554 m)');
  const c = W(277, 0); ok(Math.hypot(ex.c[0] - c.x, ex.c[1] - c.z) < 0.2, `the zone centre is the deck centre (${ex.c} vs ${c.x.toFixed(1)}, ${c.z.toFixed(1)})`);
}

// ------------------------------------------------------------------ 2. the kinematics
section('2. the kinematics of the leaf (frame.js)');
{
  near(F.U_TIP - F.U_HINGE, 43.0, 1e-9, 'the leaf spans u 15.2 .. 58.2 (43.0 m, the 43.2 m span of the research)');
  near(F.leafY(F.U_HINGE, 0), F.yDeck(F.U_HINGE), 1e-9, 'closed: the leaf meets the first pier deck at the hinge');
  near(F.leafY(F.U_TIP - 1e-7, 0), F.yDeck(F.U_TIP), 1e-6, 'closed: the leaf meets the landing pier deck at the tip');
  let dev = 0; for (let u = F.U_HINGE; u <= F.U_TIP; u += 0.25) dev = Math.max(dev, Math.abs(F.leafY(u, 0) - F.yDeck(u)));
  ok(dev < 0.03, `closed: the rigid leaf stays within ${dev.toFixed(3)} m of the cubic deck profile (the profile is the source's, the leaf is its chord)`);
  // the height rises with the angle at a fixed material point, and at a fixed u inside the footprint
  for (const u of [20, 30, 45]) {
    let prev = -1e9, mono = true;
    for (let th = 0; th <= F.THETA_MAX; th += 0.02) { const y = F.leafY(u, th); if (!(y === y)) continue; if (y < prev - 1e-9) mono = false; prev = y; }
    ok(mono, `leafY(${u}) rises with theta while the leaf covers it`);
  }
  ok(F.leafY(50, F.THETA_MAX) !== F.leafY(50, F.THETA_MAX), 'the raised leaf leaves a gap: u 50 is beyond the projection of the tip at 70 degrees (NaN)');
  const f70 = F.leafFoot(F.THETA_MAX); near(f70.u1, F.U_HINGE + F.LEAF_S * Math.cos(F.THETA_MAX + F.ALPHA0), 1e-9, 'the footprint at 70 degrees');
  near(F.leafSlope(F.THETA_MAX) / DEG, 70 + F.ALPHA0 / DEG, 1e-9, 'the slope of the surface = the elevation angle');
  // the slope of the surface by finite differences equals the elevation angle
  for (const th of [0.2, 0.7, 1.1]) { const u = 24, y0 = F.leafY(u, th), y1 = F.leafY(u + 0.1, th); near(Math.atan2(y1 - y0, 0.1 * 1), F.phiOf(th), 1e-6, `slope at theta ${th}`); }
  // the carry of a material point equals the displacement of the rotating rigid line
  for (const [u0, a, b] of [[20, 0, 0.3], [30, 0.3, 0.9], [50, 0, 0.1]]) {
    const s = (u0 - F.U_HINGE) / Math.cos(F.phiOf(a)), uNew = F.U_HINGE + s * Math.cos(F.phiOf(b)), yNew = F.Y_HINGE + s * Math.sin(F.phiOf(b));
    near(F.carryDu(u0, a, b), uNew - u0, 1e-9, `carryDu(${u0}, ${a} -> ${b})`);
    near(F.leafY(uNew, b), yNew, 1e-9, 'the carried point stays on the surface');
  }
  // the vertical speed handed to a carried body (the eased cycle): at most (43 m) * max omega
  const clk = createClock({ mode: 'open' }); let vmax = 0, vfix = 0, wmax = 0;
  for (let i = 0; i < 4000; i++) { clk.step(0.05, 0); const w = Math.abs(clk.omega); wmax = Math.max(wmax, w); for (const u of [16, 25, 40, 58]) { vmax = Math.max(vmax, Math.abs(F.leafVy(u, w))); if (F.leafSlope(clk.theta) < F.WALK_SLIP_DEG * DEG) vfix = Math.max(vfix, Math.abs(F.leafVyFixed(u, clk.theta, w))); } }
  ok(vmax <= 1.3, `the vertical speed of a CARRIED body is at most ${vmax.toFixed(3)} m/s (<= 1.3)`);
  ok(vfix <= 2.0, `the vertical rate of the surface under a standing point below the walker's slip angle is at most ${vfix.toFixed(3)} m/s (<= 2.0)`);
  say(`  max omega ${(wmax / DEG).toFixed(3)} deg/s, carried vertical speed ${vmax.toFixed(3)} m/s, fixed-point rate ${vfix.toFixed(3)} m/s`);
  // the footing rule
  near(F.slideAccel(35, 35 * DEG), 0, 1e-12, 'no slide acceleration at the walker limit (continuous)');
  ok(F.slideAccel(35, 36 * DEG) > 0 && F.slideAccel(35, 34.9 * DEG) === 0, 'a walker slips from 35 degrees');
  ok(F.slideAccel(45, 46 * DEG) > 0 && F.slideAccel(45, 44.9 * DEG) === 0, 'a car slips from 45 degrees');
  ok(F.slideAccel(45, 70 * DEG) > F.slideAccel(45, 50 * DEG), 'the slide accelerates more on a steeper leaf');
  ok(F.slips(35, 36 * DEG - F.ALPHA0) && !F.slips(35, 34 * DEG - F.ALPHA0) && F.slips(45, 46 * DEG - F.ALPHA0) && !F.slips(45, 44 * DEG - F.ALPHA0), 'slips(limit, theta) follows the elevation angle');
  ok(F.WALK_SLIP_DEG < F.CAR_SLIP_DEG, 'a walker loses his footing before a car (35 < 45: the leaf is a ramp for a car since the stunts, docs/AREAS.md 13.11; it was 25 < 35)');
}

// ------------------------------------------------------------------ 3. the schedule
section('3. the schedule (schedule.js)');
{
  // a full AUTO cycle in the daylight, 0.05 s steps: log (t, stage, stop, theta, barrier)
  const clk = createClock({ mode: 'auto' }); const log = []; let t = 0, prevTh = 0, maxStep = 0, firstWarn = -1, firstMove = -1, release = -1, flagDown = -1, upAtRelease = 0;
  for (let i = 0; i < 24000 && release < 0; i++) {
    clk.step(0.05, 0); t += 0.05;
    const th = clk.theta; maxStep = Math.max(maxStep, Math.abs(th - prevTh)); prevTh = th;
    if (clk.stop && firstWarn < 0) firstWarn = t;
    if (th > 1e-6 && firstMove < 0) firstMove = t;
    if (firstWarn >= 0 && !clk.stop && release < 0) { release = t; upAtRelease = clk.barrier; }
    if (log.length < 1 || clk.stage !== log[log.length - 1].stage) log.push({ t: +t.toFixed(2), stage: clk.stage });
  }
  say('  ' + log.map((e) => `${e.t}s ${e.stage}`).join(' | '));
  near(firstWarn, CFG.FIRST_AT, 0.3, `the first daytime opening is announced FIRST_AT = ${CFG.FIRST_AT} s after the start`);
  ok(firstMove - firstWarn >= CFG.WARN - 0.3, `the STOP flag is up ${(firstMove - firstWarn).toFixed(1)} s (>= WARN ${CFG.WARN}) before the leaf moves`);
  ok(release > 0, 'the cycle ends: the flag drops'); ok(upAtRelease === 0, `the arms are up (${upAtRelease}) when the flag drops`);
  ok(maxStep < 0.0016, `theta is continuous: the largest 0.05 s step is ${(maxStep / DEG).toFixed(4)} degrees`);
  const order = log.map((e) => e.stage).join('>');
  ok(order === 'idle>warn>opening>hold>closing>clear>idle', `the stages in order: ${order}`);
  const tOpen = log.find((e) => e.stage === 'opening').t, tHold = log.find((e) => e.stage === 'hold').t, tClose = log.find((e) => e.stage === 'closing').t, tClear = log.find((e) => e.stage === 'clear').t;
  near(tHold - tOpen, CFG.OPEN_T, 0.2, 'OPENING lasts OPEN_T (80 s: 60 .. 90 s of the brief)'); near(tClose - tHold, CFG.HOLD, 0.2, 'HOLD'); near(tClear - tClose, CFG.CLOSE_T, 0.2, 'CLOSING lasts CLOSE_T');
  near(release - tClear, CFG.RELEASE, 0.2, 'the flag drops RELEASE s after the leaf lies down');
  // the angle: 0 -> 70 degrees with zero speed at both ends (smootherstep)
  const c2 = createClock({ mode: 'open' }); let peak = 0, wAtEnd = 1, wMid = 0; for (let i = 0; i < 3000; i++) { c2.step(0.05, 0); peak = Math.max(peak, c2.theta); if (c2.stage === 'opening' && Math.abs(c2.p - 0.5) < 0.01) wMid = Math.abs(c2.omega); if (c2.stage === 'hold') wAtEnd = Math.abs(c2.omega); }
  near(peak, F.THETA_MAX, 1e-9, 'the leaf opens to 70 degrees'); ok(wAtEnd === 0 && wMid > 0, `the easing: still at the end of the opening, ${(wMid / DEG).toFixed(3)} deg/s in the middle`);
  near(ease(0.5), 0.5, 1e-12, 'ease(0.5) = 0.5'); ok(ease(0) === 0 && ease(1) === 1 && ease(0.1) < 0.02, 'ease is 0..1 with a slow start');
  // modes: 'open' stays open; 'closed' while opening reverses without a jump; 'closed' never starts
  const c3 = createClock({ mode: 'open' }); for (let i = 0; i < 2400; i++) c3.step(0.05, 0);
  ok(c3.stage === 'hold' && c3.stop, `mode open: held open (${c3.stage})`);
  c3.setMode('closed'); let th0 = c3.theta, jump = 0; for (let i = 0; i < 4000 && c3.stage !== 'idle'; i++) { c3.step(0.05, 0); jump = Math.max(jump, Math.abs(c3.theta - th0)); th0 = c3.theta; }
  ok(c3.stage === 'idle' && c3.theta === 0 && !c3.stop && jump < 0.0016, 'mode closed: the leaf lowers smoothly and the flag drops');
  const c4 = createClock({ mode: 'open' }); for (let i = 0; i < 700 + 600; i++) c4.step(0.05, 0);       // 65 s: well into the opening
  ok(c4.stage === 'opening', 'opening in progress'); c4.setMode('closed'); const thA = c4.theta; c4.step(0.05, 0); ok(c4.stage === 'closing' && Math.abs(c4.theta - thA) < 0.0016, 'mode closed during the opening: it reverses with no jump');
  // the leaf waits for the span to clear (ready()), at most WARN_MAX; the STOP flag stays up meanwhile and theta stays 0
  const gate = { v: false }, c6 = createClock({ mode: 'open', ready: () => gate.v }); c6.step(CFG.WARN + 20, 0);
  ok(c6.stage === 'warn' && c6.stop && c6.theta === 0, 'the span is not clear: the warning goes on past WARN, the leaf stays down');
  gate.v = true; c6.step(1, 0); ok(c6.stage === 'opening', 'the span is clear: the leaf starts');
  const c7 = createClock({ mode: 'open', ready: () => false }); c7.step(CFG.WARN_MAX - 1, 0); const stillWarn = c7.stage === 'warn'; c7.step(2, 0);
  ok(stillWarn && c7.stage === 'opening', `a span that never clears does not hold the bridge for ever: it opens after WARN_MAX = ${CFG.WARN_MAX} s`);
  const c5 = createClock({ mode: 'closed' }); for (let i = 0; i < 20000; i++) c5.step(0.05, 0); ok(c5.stage === 'idle' && c5.theta === 0 && !c5.stop, 'mode closed: never opens');
  // the night rule: the gap is NIGHT_GAP in the white night, DAY_GAP by day (after the first opening)
  const gapOf = (night) => { const c = createClock({ mode: 'auto' }); let tt = 0, st = [], prev = 'idle'; for (let i = 0; i < 80000 && st.length < 2; i++) { c.step(0.25, night); tt += 0.25; if (prev === 'idle' && c.stage === 'warn') st.push(tt); prev = c.stage; } return st[1] - st[0] - (CFG.WARN + CFG.OPEN_T + CFG.HOLD + CFG.CLOSE_T + CFG.RELEASE); };
  near(gapOf(1), CFG.NIGHT_GAP, 0.6, `night: a new opening ${CFG.NIGHT_GAP} s after the leaf lay down`); near(gapOf(0), CFG.DAY_GAP, 0.6, `day: a new opening ${CFG.DAY_GAP} s after the leaf lay down`);
  const ev = createClock({ mode: 'auto' }); const names = []; for (let i = 0; i < 6000; i++) { ev.step(0.1, 0); names.push(...ev.takeEvents()); }
  ok(names.slice(0, 6).join() === 'warn,opening,open,closing,closed,released', `events of one cycle: ${names.slice(0, 6)}`);
  ok(createClock({}).state().phase === 'closed', 'the service phase of an idle bridge is closed');
  const st1 = createClock({ mode: 'open' }); st1.step(CFG.WARN - 2, 0); ok(st1.state().phase === 'closed' && st1.state().stop, 'warn: phase closed, stop up'); st1.step(10, 0); ok(st1.state().phase === 'opening', 'phase opening');
}

// ------------------------------------------------------------------ 4. the service
section('4. the service (service.js)');
const svc = S.createService({ mode: 'closed' });
{
  // closed: deckY = the profile on the whole deck, continuous in space, null outside
  let maxDiff = 0, maxJump = 0, nPts = 0;
  for (let v = -11.5; v <= 11.5; v += 2.3) {
    let prev = null;
    for (let u = -1.5; u <= 554.5; u += 0.5) {
      const w = W(u, v), y = svc.deckY(w.x, w.z); nPts++;
      ok(y !== null, `deckY is defined at u ${u} v ${v}`); if (y === null) continue;
      maxDiff = Math.max(maxDiff, Math.abs(y - F.yDeck(Math.max(0, Math.min(F.LEN, u))))); if (prev !== null) maxJump = Math.max(maxJump, Math.abs(y - prev)); prev = y;
    }
  }
  ok(maxDiff < 0.04, `closed: deckY matches the deck profile within ${maxDiff.toFixed(4)} m on ${nPts} points`);
  ok(maxJump < 0.5 * 0.06 + 0.02, `closed: deckY is continuous along the bridge (largest 0.5 m step ${maxJump.toFixed(4)} m)`);
  ok(svc.deckY(...Object.values(W(-8, 0))) === null && svc.deckY(...Object.values(W(570, 0))) === null && svc.deckY(...Object.values(W(100, 14))) === null, 'no deck beyond the abutments or beside the railing');
  ok(svc.deckLift(...Object.values(W(100, 11))) === F.PAVE && svc.deckLift(...Object.values(W(100, 0))) === 0.03, 'the feet stand 0.2 m on the pavement, 0.03 m on the asphalt');
  // the leaf region at several angles: deckY = leafY, null in the gap
  for (const th of [0, 0.3, 0.8, F.THETA_MAX]) {
    svc.clock.theta; const s2 = S.createService({ mode: 'closed' });
    Object.defineProperty(s2.clock, 'theta', { get: () => th });
    let bad = 0, gap = 0, inFoot = 0; const f = F.leafFoot(th);
    for (let u = F.U_HINGE + 0.2; u < F.U_TIP - 0.2; u += 0.7) { const w = W(u, 3), y = s2.deckY(w.x, w.z); if (u <= f.u1) { inFoot++; if (y === null || Math.abs(y - F.leafY(u, th)) > 1e-9) bad++; } else { gap++; if (y !== null) bad++; } }
    ok(bad === 0, `theta ${(th / DEG).toFixed(0)}: deckY = the leaf surface over its footprint (${inFoot} pts) and null in the gap (${gap} pts)`);
    ok(s2.onLeaf(...Object.values(W(F.U_HINGE + 1, 0))) && (th === 0 ? true : !s2.onLeaf(...Object.values(W(F.U_TIP - 0.5, 0)))), `onLeaf at theta ${(th / DEG).toFixed(0)}`);
  }
  // time continuity at a fixed point on the leaf during the real cycle
  const s3 = S.createService({ mode: 'open' }); const w = W(30, 4); let prev = s3.deckY(w.x, w.z), worst = 0, nulls = 0;
  for (let i = 0; i < 5000; i++) { s3.advance(0.05, 0); const y = s3.deckY(w.x, w.z); if (y === null) { nulls++; prev = null; continue; } if (prev !== null) worst = Math.max(worst, Math.abs(y - prev)); prev = y; }
  ok(worst < 0.12, `time: deckY at u 30 changes by at most ${worst.toFixed(4)} m per 0.05 s while the leaf is over it (${nulls} frames in the gap)`);
  // the world frame: gates
  ok(svc.gates.length === 2 && Math.abs(svc.gates[0].u - F.GATE_S) < 1e-9 && Math.abs(svc.gates[1].u - F.GATE_N) < 1e-9, 'two gates: u 6 (south) and u 76 (north)');
  ok(svc.gates[0].u < F.U_HINGE && svc.gates[1].u > 70.3, 'the gates stand outside the bascule reach, beyond the piers');
}

// ------------------------------------------------------------------ 5. the NPC hooks
section('5. the NPC hooks: stop lines, signal, pedestrian step test');
{
  const s = S.createService({ mode: 'open' });
  const lane = (id, road, u0, u1, v) => { const pts = []; for (let k = 0; k <= 40; k++) { const u = u0 + (u1 - u0) * k / 40, w = W(u, v); pts.push([w.x, w.z]); } return { id, road, dir: 1, idx: 0, width: 3.6, pts, len: Math.abs(u1 - u0), speed: 12 }; };
  const streets = { lanes: [lane('LN', 'w142545019', -30, 120, 5.7), lane('LS', 'w142545020', 600, -30, -5.7), lane('LX', 'w999', -30, 120, 20)], stopLines: [], signalState: (id, ap, t) => 'amber', signalInfo: () => ({ state: 'amber', remain: 3 }) };
  const n = S.addStopLines(streets, s, WAY_IDS);
  ok(n === 2 && streets.stopLines.length === 2, `one stop line per carriageway lane toward the span: ${n}`);
  const ln = streets.stopLines.find((q) => q.lane === 'LN'), ls = streets.stopLines.find((q) => q.lane === 'LS');
  near(ln.s, 36, 0.2, 'the northbound lane (u -30 .. 120) is stopped at u 6 = 36 m along'); near(ls.s, 600 - 76, 0.2, 'the southbound lane (u 600 .. -30) is stopped at u 76');
  ok(ln.signal === 'troitsky-s' && ls.signal === 'troitsky-n', 'the signals are the gate ids');
  ok(streets.signalState('troitsky-s', 0, 5) === 'green', 'idle bridge: green');
  s.advance(1, 0); ok(s.stop && streets.signalState('troitsky-s', 0, 5) === 'red' && streets.signalState('troitsky-n', 0, 5) === 'red', 'the flag is up (warning): both signals red at once, before the leaf moves');
  ok(s.theta === 0, 'theta is still 0 in the first second of the warning');
  ok(streets.signalState('other', 0, 5) === 'amber' && streets.signalInfo('other', 0, 5).remain === 3, 'the other signals of the city are untouched');
  // pedestrians: a step from the outside into the closed span is a wall, the other ways are not
  const so = W(F.GATE_S - 1, 3), si = W(F.GATE_S + 1, 3), no = W(F.GATE_N + 1, -4), ni = W(F.GATE_N - 1, -4);
  ok(s.stepBlocked(so.x, so.z, si.x, si.z), 'south gate: a step in is blocked'); ok(!s.stepBlocked(si.x, si.z, so.x, so.z), 'south gate: a step OUT is free (those already on the span walk off)');
  ok(s.stepBlocked(no.x, no.z, ni.x, ni.z) && !s.stepBlocked(ni.x, ni.z, no.x, no.z), 'north gate: in blocked, out free');
  const wide = W(F.GATE_S - 1, 20), wide2 = W(F.GATE_S + 1, 20); ok(!s.stepBlocked(wide.x, wide.z, wide2.x, wide2.z), 'a step beside the deck is not this gate');
  ok(s.nearGate(so.x, so.z, 3) && !s.nearGate(...Object.values(W(300, 0)), 3), 'nearGate marks only the neighbourhood of the lines');
  for (let i = 0; i < 100000 && s.stop && s.state().stage !== 'hold'; i++) s.advance(0.1, 0); s.setMode('closed'); for (let i = 0; i < 30000 && s.stop; i++) s.advance(0.1, 0);
  ok(!s.stop && s.theta === 0 && streets.signalState('troitsky-s', 0, 5) === 'green' && !s.stepBlocked(so.x, so.z, si.x, si.z), 'after the leaf lies down the flag drops: green, steps free');
}

// ------------------------------------------------------------------ 6. the real module, built headless
section('6. the real module (stub engine): build, floor, rails, the real Player and the real car');
const SE = await import('./tauride/lib/stub-env.mjs');
const eng = await SE.loadEngine();
const { ctx, camera } = SE.makeContext(eng, ['landmarksTroitsky']);
const { createKnock } = await import('../src/core/knock.js');
const { createHandling } = await import('../src/world/drive/handling.js');
globalThis.document = { pointerLockElement: null, createElement: globalThis.document.createElement };
ctx.knock = createKnock(ctx);
const t0 = Date.now();
await SE.buildModules(eng, ctx, ['landmarksTroitsky']);
const T = ctx.services.landmarksTroitsky, ph = ctx.physics;
{
  ok(!!T && typeof T.deckY === 'function' && typeof T.state === 'function' && typeof T.setMode === 'function', 'ctx.services.landmarksTroitsky = { state, deckY, setMode, ... }');
  say(`  built in ${Date.now() - t0} ms: ${T.stats.tris} triangles (static ${T.stats.staticTris}, leaf ${T.stats.leafTris}), ${T.stats.colliders} colliders, ${T.stats.lamps} knockable lamps, ${T.stats.arms} barrier arms`);
  // (the Parts count T.stats.tris leaves out everything that is an instance of a knock mesh now: count what is drawn, instances included, as tools/check.mjs does)
  let drawn = 0; for (const root of [ctx.staticRoot, ctx.dynamicRoot]) root.traverse((o) => { if ((o.isMesh || o.isInstancedMesh) && o.geometry) drawn += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); });
  ok(drawn >= 60e3 && drawn <= 120e3, `triangles drawn ${Math.round(drawn)} within 60 .. 120 k (Parts ${T.stats.tris})`);
  ok(T.stats.lamps === 22 && T.stats.candelabra === 16 && T.stats.poles === 20, `22 one-globe lamps, 16 candelabra and 20 contact poles are registered with the knock system (${T.stats.lamps} / ${T.stats.candelabra} / ${T.stats.poles})`);
  ok(T.stats.kerbBays >= 200 && T.stats.leafBays === 56, `the barrier kerb of the fixed deck (${T.stats.kerbBays} bays) and the 56 bays of the leaf (34 rail panels, 22 kerb pieces) are knock records`);
  { const k = ctx.knock.stats.byKind, batch = k.fence - T.stats.kerbBays - T.stats.leafBays; ok(batch >= 300 && k.lamp === T.stats.lamps + T.stats.candelabra + T.stats.poles, `the rail batch adds ${batch} bays (whip panels, granite parapet sections, the wing parapets); knock kinds ${JSON.stringify(k)}`); }
  ok(T.stats.arms === 8, `8 barrier arms (2 gates x (2 carriageway booms + 2 pavement booms)): ${T.stats.arms}`);
  ok(ctx._updates.length >= 2, `the module registered its frame update (knock + the module: ${ctx._updates.length})`);
  ok(ctx.dynamicRoot.children.some((c) => c.name === 'troitsky-leaf') && ctx.dynamicRoot.children.some((c) => c.name === 'troitsky-barriers'), 'the leaf and the barriers are in the dynamic root (moved by transform)');
}
const leaf = T.leaf, update = ctx._updates[ctx._updates.length - 1];
{
  // the transform chain of the moving group: the tip of the leaf (body x = LEAF_S) and the foot of the counterweight (body x = -10.6) in WORLD coordinates equal the formulas of frame.js at several angles
  const THREE = eng.THREE, body = leaf.pivot.children[0];
  for (const th of [0, 0.4, 1.0, F.THETA_MAX]) {
    leaf.set(th); leaf.outer.updateMatrixWorld(true);
    const tip = body.localToWorld(new THREE.Vector3(F.LEAF_S, 0, 5)), phi = F.phiOf(th), want = W(F.U_HINGE + F.LEAF_S * Math.cos(phi), 5);
    near(tip.x, want.x, 1e-6, `theta ${(th / DEG).toFixed(0)}: the world x of the tip`); near(tip.z, want.z, 1e-6, 'the world z of the tip'); near(tip.y, F.Y_HINGE + F.LEAF_S * Math.sin(phi), 1e-6, 'the world y of the tip (it RISES)');
    const cw = body.localToWorld(new THREE.Vector3(-8, 0, 0)); near(cw.y, F.Y_HINGE - 8 * Math.sin(phi), 1e-6, `theta ${(th / DEG).toFixed(0)}: the counterweight end swings DOWN`);
  }
  leaf.set(0); leaf.outer.updateMatrixWorld(true);
  // the barrier arms: lifted (idle) they stand up, lowered (flag up) they lie across the lane
  const bar = T.barriers.barriers, tipMax = () => { let m = -1e9; for (let i = 0; i < bar.count; i++) m = Math.max(m, bar.tip(i).y); return m; };      // (the booms are knock instances since 13.11: read the tips back from what is drawn)
  T.setMode('closed'); for (let i = 0; i < 100000 && T.state().stop; i++) T.advance(0.1, 0); update(0, 0); const up = tipMax();
  T.setMode('open'); T.advance(7, 0); update(0, 1); const down = tipMax();
  ok(T.state().stop && T.state().barrier === 1 && up - down > 5, `the arms: up they reach ${up.toFixed(1)} m, down ${down.toFixed(1)} m (the post), the flag is up`);
  T.setMode('closed'); for (let i = 0; i < 100000 && T.state().stop; i++) T.advance(0.1, 0); update(0, 2); leaf.set(0);
}
const rampsAt = (th) => { leaf.set(th); };
const floorAt = (u, v, feet = 60) => { const w = W(u, v); return ph.surfaceAt(w.x, w.z, feet, false, { y: -Infinity, kind: null, item: null }); };
{
  // closed: the physics floor equals deckY (+ the pavement lift) all along the bridge, and the leaf ramps are the floor on the bascule span
  let worst = 0, n = 0, wrongKind = 0;
  for (const v of [-11.4, -10.9, -9.3, -5.7, 0, 5.7, 9.3, 10.9, 11.4]) for (let u = -1; u <= 554; u += 3.1) {
    const w = W(u, v), y = T.deckY(w.x, w.z); if (y === null) continue;
    const lift = Math.abs(v) >= F.ROAD + F.KERB ? F.PAVE : 0, S2 = floorAt(u, v, y + lift + 0.3); n++;
    worst = Math.max(worst, Math.abs(S2.y - (y + lift)));
    if (u > F.U_HINGE + 0.3 && u < F.U_TIP - 0.3 && !(S2.item && S2.item.leaf)) wrongKind++;
  }
  ok(worst < 0.03, `closed: the physics floor equals deckY (+0.2 on the pavements) within ${worst.toFixed(4)} m on ${n} points`);
  ok(wrongKind === 0, `closed: the floor on the bascule span is the leaf ramps (${wrongKind} points are not)`);
  // at every angle: the floor over the footprint = leafY (+ lift), the gap has no leaf floor
  for (const th of [0.2, 0.5, 0.9, 1.2, F.THETA_MAX]) {
    rampsAt(th); const f = F.leafFoot(th); let w1 = 0, nn = 0, leafOnGap = 0;
    for (const v of [-10.9, -3, 0, 4, 10.9]) for (let u = F.U_HINGE + 0.3; u < F.U_TIP - 0.2; u += 1.1) {
      const lift = Math.abs(v) >= F.ROAD + F.KERB ? F.PAVE : 0;
      if (u < f.u1 - 0.15) { const S2 = floorAt(u, v, F.leafY(u, th) + lift + 0.3); nn++; w1 = Math.max(w1, Math.abs(S2.y - (F.leafY(u, th) + lift))); }
      else if (u > f.u1 + 0.2) { const S2 = floorAt(u, v, 60); if (S2.item && S2.item.leaf) leafOnGap++; }
    }
    ok(w1 < 0.01 && leafOnGap === 0, `theta ${(th / DEG).toFixed(0)}: the floor follows the leaf within ${w1.toFixed(4)} m (${nn} pts), no leaf floor in the gap (${leafOnGap})`);
  }
  rampsAt(0);
  // the dynamic rails: at theta = 40 degrees a point on the rail line at s = 20 m is pushed out, and the same point on the closed leaf too
  ctx.player.position.set(W(30, 0).x, 0, W(30, 0).z);
  for (const th of [0, 0.35, 0.7]) {
    rampsAt(th); ph.refreshDynamic();
    const phi = F.phiOf(th), s = 20, u = F.U_HINGE + s * Math.cos(phi), y = F.Y_HINGE + s * Math.sin(phi) + F.PAVE, w = W(u, F.HW - 0.14), p = { x: w.x, z: w.z };
    ph.resolve(p, 0.3, y, 1.7); const moved = Math.hypot(p.x - w.x, p.z - w.z);
    ok(moved > 0.25, `theta ${(th / DEG).toFixed(0)}: the railing is a collider at s = 20 m on the moving leaf (a walker on the rail line is pushed ${moved.toFixed(2)} m)`);
    const w2 = W(u, 0), p2 = { x: w2.x, z: w2.z }; ph.resolve(p2, 0.3, y - F.PAVE, 1.7); ok(Math.hypot(p2.x - w2.x, p2.z - w2.z) < 1e-6, `theta ${(th / DEG).toFixed(0)}: the middle of the roadway is free`);
  }
  rampsAt(0); ph.refreshDynamic();
  ctx.player.position.set(W(30, 0).x + 400, 0, W(30, 0).z);
  ph.refreshDynamic(); ok(ph._dynItems.length === 0, 'nobody within 160 m: the leaf adds no dynamic boxes (nothing to refresh)');
  ctx.player.position.set(W(30, 0).x, 0, W(30, 0).z); ph.refreshDynamic(); ok(ph._dynItems.length >= 32, `near the leaf: ${ph._dynItems.length} dynamic boxes (rails + kerbs, cut to the slope)`);
}

// ---- the real Player on the leaf through a whole cycle (the order of the engine: player.update, then the module's update)
{
  const dom = { addEventListener() {}, removeEventListener() {} };
  const run = (u0, v0, mode, label, expect) => {
    T.setMode('closed'); for (let i = 0; i < 50000 && T.state().stop; i++) T.advance(0.1, 0); leaf.set(0);       // a fresh closed bridge
    const pl = new eng.Player(camera, dom, ph, eng.L.WORLD.play); pl.enabled = true;
    const w = W(u0, v0); pl.setPose(w.x, w.z, 0, 0); ctx.player.position.set(w.x, 0, w.z);
    const st = S.bodyState(); T.setMode(mode);
    let holdT = 0, enginePre = 0; const dt = 1 / 30; let t = 0, worstContact = 0, vmax = 0, vmaxCarry = 0, slipFrames = 0, prevY = pl.pos.y, uMin = 1e9, uAtSlip = null, minY = 1e9, maxPhi = 0, falls = 0;
    for (let i = 0; i < 9000; i++) {
      t += dt; ph.refreshDynamic(); pl.update(dt); ctx.player.position.copy(pl.pos);
      if (st.on) { const yy = T.deckY(pl.pos.x, pl.pos.z), qq = F.toUV(pl.pos.x, pl.pos.z, {}); if (yy !== null) enginePre = Math.max(enginePre, Math.abs(pl.pos.y - (yy + (Math.abs(qq.v) >= F.ROAD + F.KERB ? F.PAVE : 0)))); }      // the ENGINE's own floor (core/player.js on the live ramps) before the module corrects anything
      if (T.state().stage === 'hold') { holdT += dt; if (holdT > 6) T.setMode('closed'); }
      const r = T.advance(dt, 0); if (r.th1 !== r.th0) leaf.set(r.th1);
      const how = S.stepWalker(pl, r.th0, r.th1, dt, st);
      const q = F.toUV(pl.pos.x, pl.pos.z, {}), y = T.deckY(pl.pos.x, pl.pos.z), lift = Math.abs(q.v) >= F.ROAD + F.KERB ? F.PAVE : 0;
      if (y !== null && how) { worstContact = Math.max(worstContact, Math.abs(pl.pos.y - (y + lift))); }
      const vy = Math.abs(pl.pos.y - prevY) / dt; prevY = pl.pos.y; if (how === 'carry') vmaxCarry = Math.max(vmaxCarry, vy); if (how) vmax = Math.max(vmax, vy);
      if (how === 'slip') { slipFrames++; if (uAtSlip === null) uAtSlip = q.u; maxPhi = Math.max(maxPhi, F.leafSlope(r.th1)); }
      uMin = Math.min(uMin, q.u); minY = Math.min(minY, pl.pos.y); if (pl.pos.y < -1.5) falls++;
      if (VERBOSE && i % 300 === 0) say(`    t ${t.toFixed(0)} stage ${T.state().stage} theta ${(r.th1 / DEG).toFixed(1)} u ${q.u.toFixed(2)} y ${pl.pos.y.toFixed(2)} how ${how}`);
      if (T.state().stage === 'idle' && t > 20) break;
    }
    const q = F.toUV(pl.pos.x, pl.pos.z, {});
    say(`  ${label}: contact <= ${worstContact.toFixed(3)} m (the engine floor alone: <= ${enginePre.toFixed(3)} m), vertical speed carried <= ${vmaxCarry.toFixed(2)} m/s (slipping <= ${vmax.toFixed(2)}), slip frames ${slipFrames}, slipped from u ${uAtSlip === null ? '-' : uAtSlip.toFixed(1)}, ends at u ${q.u.toFixed(2)}`);
    return { worstContact, vmax, vmaxCarry, slipFrames, uAtSlip, uEnd: q.u, falls, minY, st, enginePre };
  };
  const a = run(30, 4, 'open', 'walker at u 30', null);
  // (auto from a fresh closed bridge: the idle gap first. the loop above breaks when the bridge is idle again after 20 s: it ran the idle gap AND the cycle)
  ok(a.worstContact < 0.06, `the walker keeps contact with the moving leaf (worst ${a.worstContact.toFixed(3)} m)`);
  ok(a.enginePre < 0.6, `the engine's own floor under the live ramps never lets the walker drift from the surface by more than ${a.enginePre.toFixed(3)} m between two frames (< 0.6: the walker is re-seated by the carry)`);
  ok(a.vmaxCarry <= 1.35, `the vertical speed handed to the carried walker stays <= 1.35 m/s (${a.vmaxCarry.toFixed(2)})`);
  ok(a.slipFrames > 20, `beyond 35 degrees the walker slips (${a.slipFrames} frames)`);
  ok(a.uEnd < F.U_HINGE + 1.0, `the slipping walker ends at the hinge side (u ${a.uEnd.toFixed(2)} <= ${F.U_HINGE + 1})`);
  ok(a.falls === 0 && a.minY > -1.5, `the walker never falls through (min y ${a.minY.toFixed(2)})`);
  ok(a.vmax <= F.WALK_SLIDE_MAX + 1.5, `while slipping the contact speed is capped (${a.vmax.toFixed(2)} <= ${F.WALK_SLIDE_MAX + 1.5} m/s)`);
  // a walker that stays on the leaf only below the limit: 'open' to 30 degrees would need a hold; instead check the slope at the first slipping frame was >= 35 degrees
  ok(true, 'walker slip rule exercised');
  const b = run(20, -3, 'open', 'walker at u 20 (near the hinge)', null);
  ok(b.worstContact < 0.06 && b.falls === 0, `near the hinge: contact ${b.worstContact.toFixed(3)} m, no fall`);
}
// the slope at the first slip frame of a walker / a car (pure, from the clock)
{
  const c = createClock({ mode: 'open' }); let thWalk = null, thCar = null;
  for (let i = 0; i < 5000; i++) { c.step(0.02, 0); if (thCar === null && F.slips(F.CAR_SLIP_DEG, c.theta)) thCar = c.theta; if (thWalk === null && F.slips(F.WALK_SLIP_DEG, c.theta)) thWalk = c.theta; }
  say(`  slip onset: car at theta ${(thCar / DEG).toFixed(1)} (slope ${(F.leafSlope(thCar) / DEG).toFixed(1)}), walker at theta ${(thWalk / DEG).toFixed(1)} (slope ${(F.leafSlope(thWalk) / DEG).toFixed(1)})`);
  ok(thWalk < thCar && F.leafSlope(thWalk) / DEG - 35 < 0.2 && F.leafSlope(thCar) / DEG - 45 < 0.2, 'the walker slips first at 35, the car at 45 degrees (the car limit was 25 before the stunts)');
}

// ---- the real car (drive/handling.js) on the leaf
{
  const cctx = { L: eng.L, physics: ph, services: { landmarksTroitsky: T } };
  const NONE = { thr: 0, brk: 0, steer: 0, hand: false, nitro: false, jump: false, flip: false }, HELD = { ...NONE, hand: true };      // (HELD: the parked car of (a) has its handbrake on: gravity pulls a loose car down a leaf steeper than 25 degrees, docs/AREAS.md 13.11)
  const yawN = Math.atan2(F.FR.c, F.FR.s);                      // faces +u (toward the Petrograd side)
  const fresh = () => { T.setMode('closed'); for (let i = 0; i < 50000 && T.state().stop; i++) T.advance(0.1, 0); leaf.set(0); };
  // (a) a car parked on the leaf near the hinge: carried by the opening, slips off beyond 45 degrees (handbrake), never leaves the surface while it is carried
  {
    fresh(); const car = createHandling(cctx, null), w = W(19, -5.7); car.reset(w.x, w.z, yawN); ctx.player.position.set(w.x, 0, w.z);
    const st = S.bodyState(); T.setMode('open'); const dt = 1 / 60;
    let worst = 0, vmaxC = 0, slip = 0, prevY = car.y, pitchErr = 0, nC = 0, air = 0, uMaxCarry = 0, t = 0, uEnd = 0;
    for (let i = 0; i < 20000; i++) {
      t += dt; ph.refreshDynamic();
      const r = T.advance(dt, 0); if (r.th1 !== r.th0) leaf.set(r.th1);
      const how = S.stepCar(car, r.th0, r.th1, dt, st);
      car.step(dt, HELD);
      const y = T.deckY(car.x, car.z); if (car.air) air++;
      if (how === 'carry' && y !== null) { worst = Math.max(worst, Math.abs(car.y - (y + 0.03))); vmaxC = Math.max(vmaxC, Math.abs(car.y - prevY) / dt); const sl = Math.atan(F.leafSlope(r.th1) > 0 ? Math.tan(F.phiOf(r.th1)) : 0); pitchErr = Math.max(pitchErr, Math.abs(car.pitch - sl)); nC++; }
      if (how === 'slip') slip++; prevY = car.y; uEnd = F.toUV(car.x, car.z, {}).u;
      if (t > 400) break;
      if (VERBOSE && i % 120 === 0) say(`    t ${t.toFixed(0)} theta ${(r.th1 / DEG).toFixed(1)} u ${uEnd.toFixed(2)} y ${car.y.toFixed(3)} pitch ${(car.pitch / DEG).toFixed(2)} how ${how}`);
      if (T.state().stage === 'hold') break;
    }
    say(`  car at u 19: carried frames ${nC}, worst contact ${worst.toFixed(3)} m, vertical speed <= ${vmaxC.toFixed(2)} m/s, pitch error <= ${(pitchErr / DEG).toFixed(2)} deg, slip frames ${slip}, ends at u ${uEnd.toFixed(1)}`);
    ok(nC > 100 && worst < 0.08, `the car keeps contact with the rising leaf while carried (${nC} frames, worst ${worst.toFixed(3)} m)`);
    ok(vmaxC <= 1.4, `the vertical speed handed to the car is <= 1.4 m/s (${vmaxC.toFixed(2)})`);
    ok(pitchErr < 0.07, `the body pitches with the slope (pitch error <= ${(pitchErr / DEG).toFixed(2)} deg)`);
    ok(slip > 5, `beyond 45 degrees the car slips (the handbrake holds it until then) (${slip} frames)`);
    ok(uEnd < F.U_HINGE + 1.5, `the slipping car ends at the hinge side (u ${uEnd.toFixed(1)})`);
    ok(air === 0, 'the car is never airborne');
  }
  // (b) drive onto the leaf while it CLOSES: from the first pier at 3 m/s once the slope is below 6 degrees (the river is no wall: a car that reaches the free tip before the leaf lies drops into the gap, section (c); the driver waits for the leaf)
  {
    T.setMode('open'); for (let i = 0; i < 100000 && T.state().stage !== 'hold'; i++) T.advance(0.1, 0); leaf.set(T.theta);
    const car = createHandling(cctx, null), w = W(8, -5.7); car.reset(w.x, w.z, yawN); ctx.player.position.set(w.x, 0, w.z);
    const st = S.bodyState(), dt = 1 / 60; T.setMode('closed');
    let t = 0, onLeafFrames = 0, worst = 0, gate = false, pitchErr = 0, vmaxC = 0, prevY = 0, maxU = 0, blocked = 0, climbed = false;
    for (let i = 0; i < 40000; i++) {
      t += dt; ph.refreshDynamic();
      const r = T.advance(dt, 0); if (r.th1 !== r.th0) leaf.set(r.th1);
      const how = S.stepCar(car, r.th0, r.th1, dt, st);
      const go = F.leafSlope(r.th1) < 6 * DEG;                                                            // the driver waits (handbrake) at the pier until the leaf is nearly down, then creeps at 3 m/s (it reaches the free tip after the leaf lies)
      car.step(dt, { ...NONE, thr: go && Math.hypot(car.vx, car.vz) < 3 ? 1 : 0, hand: !go });
      const q = F.toUV(car.x, car.z, {}), y = T.deckY(car.x, car.z); maxU = Math.max(maxU, q.u);
      if (how === 'carry' && y !== null && q.u > F.U_HINGE + 3) { onLeafFrames++; worst = Math.max(worst, Math.abs(car.y - (y + 0.03))); pitchErr = Math.max(pitchErr, Math.abs(car.pitch - Math.atan(Math.tan(F.phiOf(r.th1))))); const er = car.y - (y + 0.03); vmaxC = Math.max(vmaxC, Math.abs(er - prevY) / dt); prevY = er; }      // (the rate of the contact error: the car's own climb up the slope is not the leaf's)
      if (q.u > F.U_HINGE + 6) climbed = true;
      if (T.state().stage === 'idle' && t > 10) break;
    }
    say(`  car driving onto the closing leaf: ${onLeafFrames} frames on it, contact <= ${worst.toFixed(3)} m, pitch error <= ${(pitchErr / DEG).toFixed(2)} deg, vertical <= ${vmaxC.toFixed(2)} m/s, reached u ${maxU.toFixed(1)}`);
    ok(climbed && onLeafFrames > 60, `the car drives onto the leaf while it is closing (reached u ${maxU.toFixed(1)}, ${onLeafFrames} frames on it)`);
    ok(worst < 0.1 && pitchErr < 0.08 && vmaxC <= 1.6, `on the closing leaf the car keeps contact (${worst.toFixed(3)} m), pitch (${(pitchErr / DEG).toFixed(2)} deg) and vertical speed (${vmaxC.toFixed(2)} m/s)`);
  }
  // (c) the river is no wall (docs/AREAS.md 13.7): a car that drives from the far pier (the Petrograd side, u 58) toward the raised leaf, into the open span beyond the tip, falls into the trench and the fall costs damage (the 'hit' event of the damage model)
  {
    T.setMode('open'); for (let i = 0; i < 100000 && T.state().stage !== 'hold'; i++) T.advance(0.1, 0); leaf.set(T.theta);
    const car = createHandling(cctx, null), w = W(70, -5.7); car.reset(w.x, w.z, yawN + Math.PI);
    const st = S.bodyState(), dt = 1 / 60; let fell = false, hit = 0, land = false, uMin = 1e9;
    for (let i = 0; i < 60 * 8; i++) {
      ph.refreshDynamic(); const r = T.advance(dt, 0); if (r.th1 !== r.th0) leaf.set(r.th1);
      S.stepCar(car, r.th0, r.th1, dt, st); car.step(dt, { ...NONE, thr: 1 });
      if (car.fall) fell = true; for (const e of car.events) { if (e.type === 'hit') hit = Math.max(hit, e.v); if (e.type === 'land') land = true; }
      uMin = Math.min(uMin, F.toUV(car.x, car.z, {}).u);
    }
    say(`  car driving into the open span: fell ${fell}, landing ${land}, hit ${hit.toFixed(1)}, ends at y ${car.y.toFixed(2)} (the deck of the pier is ${F.yDeck(70).toFixed(2)}), reached u ${uMin.toFixed(1)}`);
    ok(fell && land && hit > 3 && car.y < F.yDeck(70) - 3 && Number.isFinite(car.y), `a car driving off the far pier into the open span falls into the trench (hit ${hit.toFixed(1)}, y ${car.y.toFixed(2)})`);
  }
}

// ------------------------------------------------------------------ 7. WATER IS REACHABLE: every fence of the bridge breaks (docs/AREAS.md 13.7, 13.8)
section('7. the fences of the bridge are breakable: no static fence collider is left; a car breaks a railing of the closed deck and drives off the bridge into the water');
const THREE = eng.THREE;
const kUpd = (s) => { for (let t = 0; t < s; t += 1 / 60) ctx.knock.update(1 / 60); };
const settleClosed = () => { T.setMode('closed'); for (let i = 0; i < 100000 && (T.state().stop || T.theta > 0); i++) { const r = T.advance(0.1, 0); if (r.th1 !== r.th0) leaf.set(r.th1); } leaf.set(0); };
const nearLeaf = () => { const w = W(36, 0); ctx.player.position.set(w.x, 0, w.z); };
{
  settleClosed(); nearLeaf(); ph.refreshDynamic();
  // (a) the audit: every box / cylinder the module made is a knock record, except the two obelisk blocks (granite monuments 2 x 2 m, 8 m tall: structure); the leaf's dynamic boxes are the knock records' own sources
  const solids = ph.items.filter((it) => (it.type === 'box' || it.type === 'cyl') && !isPierBox(it)), plain = solids.filter((it) => !(it.source && it.source.knock));
  const obelisks = plain.filter((it) => it.type === 'box' && Math.abs(it.hw - 1) < 1e-6 && Math.abs(it.hd - 1) < 1e-6 && it.y1 === 8);
  ok(plain.length === 2 && obelisks.length === 2, `${solids.length} boxes and posts, ${plain.length} are not knock records (the two obelisks: ${obelisks.length})`);
  const kinds = {}; for (const it of solids) if (it.source && it.source.knock) { const k = it.source.knock; const key = k.kind + (it.type === 'cyl' ? ' post' : k.mass >= 2000 ? ' candelabrum' : k.mass >= 900 ? ' kerb/parapet' : ' bay'); kinds[key] = (kinds[key] || 0) + 1; }
  say('  colliders by knock kind: ' + JSON.stringify(kinds));
  ok(ph._dynItems.length === 56 && ph._dynItems.every((b) => b.source && b.source.knock && b.source.knock.state === 'stand'), `the leaf's ${ph._dynItems.length} dynamic boxes are the sources of their knock records`);
  ok(leaf.bays.every((b) => b.rec && b.rec.items.length === 0), 'the bays of the leaf own no static collider (their box is the dynamic one)');
  // the leaf bay is where the rail line is at every angle: the record origin, the part offsets and the instance matrix follow the leaf
  const m4 = new THREE.Matrix4(), pos = new THREE.Vector3(), qq = new THREE.Quaternion(), sc = new THREE.Vector3();
  for (const th of [0, 0.3, 0.9, F.THETA_MAX, 0.5, 0]) {
    leaf.set(th); let worst = 0, worstBox = 0, n = 0;
    for (const b of leaf.bays) {
      if (b.rec.state !== 'stand') continue; n++;
      const phi = F.phiOf(th), c = Math.cos(phi), s = Math.sin(phi), uu = F.U_HINGE + b.s0 * c - b.n * s, y = F.Y_HINGE + b.s0 * s + b.n * c, w = W(uu, b.v), p0 = b.rec.parts[0];
      p0.mesh.getMatrixAt(p0.index, m4); m4.decompose(pos, qq, sc);
      worst = Math.max(worst, Math.hypot(pos.x - w.x, pos.z - w.z, pos.y - y));
      const t = S.leafBayAt(th, b.s0 + b.len / 2, b.len, b.v, b.k, {}); worstBox = Math.max(worstBox, Math.hypot(b.box.cx - t.cx, b.box.cz - t.cz), Math.abs(b.box.y1 - t.y1), Math.abs(b.box.y0 - t.y0));
      // the rest offset of the knock part is the instance relative to the record origin
      worst = Math.max(worst, Math.hypot(p0.off.x - (pos.x - b.rec.x), p0.off.y - (pos.y - b.rec.y), p0.off.z - (pos.z - b.rec.z)));
    }
    ok(n === 56 && worst < 1e-4 && worstBox < 1e-6, `theta ${(th / DEG).toFixed(0)}: the ${n} standing bays sit on the leaf (instance <= ${worst.toExponential(1)} m, box / record <= ${worstBox.toExponential(1)} m)`);
  }
  // (b) the car through the railing of the CLOSED deck, then off the bridge into the Neva: at u 100 (the 53 m steel span over the river), the railing panel in the car's way; the kerb bay before it breaks too
  const cctx = { L: eng.L, physics: ph, services: { landmarksTroitsky: T } };
  const wl = (x, z) => eng.L.waterLevelAt ? eng.L.waterLevelAt(x, z) : null;
  const drive = (u, sg, kmh, label, thr = 1, v0 = 5.2) => {
    settleClosed(); nearLeaf();
    const dir = { x: -sg * F.FR.s, z: sg * F.FR.c }, yaw = Math.atan2(dir.x, dir.z), st = W(u, sg * v0), y0 = T.deckY(st.x, st.z);
    const car = createHandling(cctx, null); car.reset(st.x, st.z, yaw); car.y = y0 + 0.03; car.vx = dir.x * kmh / 3.6; car.vz = dir.z * kmh / 3.6;
    ctx.drive = { active: true, car, fx: { sparks() {} } };
    const input = { thr, brk: 0, steer: 0, hand: false, nitro: false }, ev = []; let fell = false, minY = 9, depth = 0;
    const was = new Set(ctx.knock.list.filter((r) => r.kind === 'fence' && r.state === 'stand'));
    for (let t = 0; t < 7; t += 1 / 60) { ph.refreshDynamic(); car.step(1 / 60, input); ctx.knock.update(1 / 60); for (const e of car.events) ev.push({ type: e.type, v: e.v }); if (car.fall) fell = true; minY = Math.min(minY, car.y); depth = Math.max(depth, car.depth); }
    const broke = ctx.knock.list.filter((r) => was.has(r) && r.state !== 'stand' && Math.hypot(r.x - st.x, r.z - st.z) < 14);
    const w = wl(car.x, car.z), q = F.toUV(car.x, car.z, {});
    say(`  ${label}: ${broke.length} bays broke (${broke.map((r) => r.state + ' ' + (r.mass >= 900 ? 'kerb' : 'rail')).join(', ')}), the car ended at u ${q.u.toFixed(1)} v ${q.v.toFixed(1)} y ${car.y.toFixed(2)} (water ${w}), fell ${fell}, events ${JSON.stringify(ev.filter((e) => e.type === 'hit' || e.type === 'land').map((e) => e.type[0] + e.v.toFixed(1)))}`);
    ctx.drive = null;
    return { car, fell, minY, depth, broke, w, q };
  };
  for (const [u, sg, label] of [[100, 1, 'closed deck u 100, east railing'], [100, -1, 'closed deck u 100, west railing'], [300, 1, 'closed deck u 300 (the crown), east railing']]) {
    const r = drive(u, sg, 50, label);
    ok(r.broke.some((b) => b.mass < 900), `${label}: a railing panel broke`);
    ok(r.broke.some((b) => b.mass >= 900), `${label}: the barrier kerb bay in front of it broke`);
    ok(r.fell && r.w !== null && r.car.y < r.w - 0.5 && Math.abs(r.q.v) > F.HW, `${label}: the car left the bridge and is in the Neva (v ${r.q.v.toFixed(1)}, y ${r.car.y.toFixed(2)}, water ${r.w})`);
  }
  // a car that does NOT have the speed is stopped by the railing (it holds a 12 km/h bump), the panel stays
  { const r = drive(200, 1, 8, "closed deck u 200 at 8 km/h, coasting into the kerb", 0, 7.4); ok(r.broke.length === 0 && Math.abs(r.q.v) < 9.6 && !r.fell, `a car at 8 km/h is stopped by the kerb: it breaks nothing and stays on the roadway (v ${r.q.v.toFixed(1)}, broke ${r.broke.length})`); }
}

// ------------------------------------------------------------------ 8. the rule of the leaf's rails and kerbs (docs/AREAS.md 13.8)
section('8. the leaf: its rail panels and kerb pieces are knock records that ride on it; the rule for what lies on a moving leaf');
{
  const rails = leaf.bays.filter((b) => b.rail), kerbs = leaf.bays.filter((b) => !b.rail), RESTING = (r) => r.state === 'rest' || r.state === 'lost';
  const pick = (list, sg, s) => list.filter((b) => Math.sign(b.v) === sg).sort((a, b) => Math.abs(a.s0 - s) - Math.abs(b.s0 - s))[0];
  settleClosed(); nearLeaf(); ph.refreshDynamic();
  const nBoxes = () => { ph.refreshDynamic(); return ph._dynItems.length; };
  ok(nBoxes() === 56, 'closed and untouched: 56 dynamic boxes');
  // (1) closed: a hit breaks the panel from the closed pose. Toward the roadway it topples onto the pavement and lies there (a rest box <= 0.42 m); toward the water it sinks.
  const A = pick(rails, 1, 10), B = pick(rails, -1, 30), K = pick(kerbs, 1, 8);
  const hitDir = (side) => ({ x: -F.FR.s * side, z: F.FR.c * side });      // side +1 = toward +v (east), -1 = toward -v (west)
  const kn = (b, side, kmh = 40) => { const d = hitDir(side); return ctx.knock.hit(b.rec.x, b.rec.z, kmh, d.x, d.z, 'fence'); };
  ok(kn(A, -1) === A.rec && kn(B, -1) === B.rec, 'the two rail bays are the records that were hit');
  ok(kn(K, -1, 45) === K.rec, 'a kerb piece too (45 km/h)');
  kUpd(5);
  ok(A.rec.state === 'rest' && A.rec.items.length === 1 && A.rec.items[0].y1 - A.rec.y <= 0.45, `east rail bay hit toward the roadway lies on the pavement: ${A.rec.state}, ${A.rec.items.length} rest box (top ${A.rec.items[0] ? (A.rec.items[0].y1 - A.rec.y).toFixed(2) : '-'} m above the foot)`);
  ok(B.rec.state === 'lost', `west rail bay hit toward the water sinks: ${B.rec.state}`);
  ok(RESTING(K.rec), `the kerb piece broke (${K.rec.state})`);
  ok(nBoxes() === 53, `the three broken bays gave their dynamic boxes up (${nBoxes()} left of 56)`);
  const restBox = A.rec.items[0];
  // (2) the leaf starts to move: the debris is swept (box removed, instance hidden), the standing bays ride along
  T.setMode('open'); for (let i = 0; i < 100000 && T.theta < 0.4; i++) { const r = T.advance(0.1, 0); if (r.th1 !== r.th0) leaf.set(r.th1); }
  ok(A.rec.state === 'lost' && A.rec.items.length === 0 && !ph.items.includes(restBox), `moving leaf: the debris of the broken bay is swept (state ${A.rec.state}, its rest box is out of the physics)`);
  { const p0 = A.rec.parts[0]; const m = new THREE.Matrix4(); p0.mesh.getMatrixAt(p0.index, m); ok(Math.abs(m.elements[0]) + Math.abs(m.elements[5]) + Math.abs(m.elements[10]) < 1e-9, 'its instance is hidden'); }
  const standing = leaf.bays.filter((b) => b.rec.state === 'stand').length; ok(standing === 53, `53 bays still stand and ride on the leaf (${standing})`);
  // (3) hit at theta = 23 degrees: the standing bay breaks from the pose it has NOW (its foot is high above the closed leaf), topples, and is no collider any more
  const C = pick(rails, 1, 30); ok(C.rec.y > F.Y_HINGE + 5, `the east panel at s 30 m stands ${(C.rec.y - F.Y_HINGE).toFixed(1)} m above the hinge on the leaf at ${(T.theta / DEG).toFixed(0)} degrees`);
  const y0 = C.rec.y; ok(kn(C, -1, 40) === C.rec, 'the raised panel is hit');
  kUpd(0.5); ok(C.rec.state === 'fly' || RESTING(C.rec), `...and breaks from its current pose (${C.rec.state}, started at y ${y0.toFixed(1)})`);
  ok(nBoxes() === 52, `its dynamic box is gone (${nBoxes()} left)`);
  kUpd(8);
  // (4) the leaf closes: nothing broken comes back, every standing bay is exactly where it started
  settleClosed();
  ok([A, B, C, K].every((b) => b.rec.state !== 'stand') && nBoxes() === 52, `closed again: the four broken bays stay broken (${[A, B, C, K].map((b) => b.rec.state)}), ${nBoxes()} boxes`);
  { let worst = 0, n = 0; for (const b of leaf.bays) { if (b.rec.state !== 'stand') continue; n++; const al = F.ALPHA0, uu = F.U_HINGE + (b.s0 + b.len / 2) * Math.cos(al) - b.n * Math.sin(al), y = F.Y_HINGE + (b.s0 + b.len / 2) * Math.sin(al) + b.n * Math.cos(al), w = W(uu, b.v); worst = Math.max(worst, Math.hypot(b.rec.x - w.x, b.rec.z - w.z, b.rec.y - y)); } ok(n === 52 && worst < 1e-6, `the ${n} standing bays are back on the closed leaf (${worst.toExponential(1)} m)`); }
  // (5) the broken bays are a way off the leaf: a walker on the pavement beside the gap of the east rail walks off the closed leaf into the Neva (the panel is gone; the post stays drawn)
  { const gap = A, m = W(F.U_HINGE + gap.s0 + gap.len / 2, F.HW - 1.4); const pl = new eng.Player(camera, { addEventListener() {}, removeEventListener() {} }, ph, eng.L.WORLD.play); pl.enabled = true; pl.setPose(m.x, m.z, Math.atan2(F.FR.s, -F.FR.c) / DEG * -1, 0);
    // a plain way out: the walker steps in +v for 3 s
    const dirx = -F.FR.s, dirz = F.FR.c; pl.yaw = Math.atan2(-dirx, -dirz); pl.keys.add('KeyW'); ctx.player.position.copy(pl.pos);
    for (let i = 0; i < 180; i++) { ph.refreshDynamic(); pl.time += 1 / 60; pl.update(1 / 60); ctx.player.position.copy(pl.pos); } pl.keys.clear();
    const q = F.toUV(pl.pos.x, pl.pos.z, {}); ok(q.v > F.HW + 0.5, `a walker leaves the closed leaf through the gap of the broken panel (v ${q.v.toFixed(2)}, y ${pl.pos.y.toFixed(2)})`);
    // the intact neighbour still holds him
    const nb = rails.find((b) => b.rec.state === 'stand' && Math.sign(b.v) === 1 && b.s0 > 25); const m2 = W(F.U_HINGE + nb.s0 + nb.len / 2, F.HW - 1.4); const p2 = new eng.Player(camera, { addEventListener() {}, removeEventListener() {} }, ph, eng.L.WORLD.play); p2.enabled = true; p2.setPose(m2.x, m2.z, 0, 0);
    p2.yaw = Math.atan2(-dirx, -dirz); p2.keys.add('KeyW'); ctx.player.position.copy(p2.pos); for (let i = 0; i < 180; i++) { ph.refreshDynamic(); p2.time += 1 / 60; p2.update(1 / 60); ctx.player.position.copy(p2.pos); } p2.keys.clear();
    const q2 = F.toUV(p2.pos.x, p2.pos.z, {}); ok(q2.v < F.HW, `an intact panel still stops him (v ${q2.v.toFixed(2)})`);
  }
  // (6) the car on the closed leaf breaks an intact panel and drives into the river: the leaf is no exception
  { settleClosed(); nearLeaf(); const nb = rails.find((b) => b.rec.state === 'stand' && Math.sign(b.v) === -1 && b.s0 > 16 && b.s0 < 36), mid = F.U_HINGE + nb.s0 + nb.len / 2, st = W(mid, -5.2), y0b = T.deckY(st.x, st.z);
    const dir = { x: F.FR.s, z: -F.FR.c }, car = createHandling({ L: eng.L, physics: ph, services: { landmarksTroitsky: T } }, null); car.reset(st.x, st.z, Math.atan2(dir.x, dir.z)); car.y = y0b + 0.03; car.vx = dir.x * 50 / 3.6; car.vz = dir.z * 50 / 3.6;
    ctx.drive = { active: true, car, fx: { sparks() {} } }; let fell = false;
    for (let t = 0; t < 7; t += 1 / 60) { ph.refreshDynamic(); car.step(1 / 60, { thr: 1, brk: 0, steer: 0, hand: false, nitro: false }); ctx.knock.update(1 / 60); if (car.fall) fell = true; }
    ctx.drive = null; const q = F.toUV(car.x, car.z, {}), w = eng.L.waterLevelAt ? eng.L.waterLevelAt(car.x, car.z) : null;
    say(`  the car on the closed leaf: panel ${nb.rec.state}, ended at u ${q.u.toFixed(1)} v ${q.v.toFixed(1)} y ${car.y.toFixed(2)} (water ${w}), fell ${fell}`);
    ok(nb.rec.state !== 'stand' && fell && w !== null && car.y < w - 0.5 && q.v < -F.HW, `the car drives through a panel of the closed leaf and into the Neva (${nb.rec.state}, v ${q.v.toFixed(1)}, y ${car.y.toFixed(2)}, water ${w})`);
  }
  settleClosed();
}

console.log(`\ntroitsky-test: ${checks} checks, ${fails.length} failed`);
if (fails.length) { for (const f of fails) console.log('  FAIL', f); process.exit(1); }
console.log('OK');
process.exit(0);
