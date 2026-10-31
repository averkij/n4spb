// ============================================================================
//  AREA GATES (docs/AREAS.md): when the player reaches the border toward another area the game loads it WITHOUT any question (docs/AREAS.md "Seamless hand-off"): the frame freezes and blurs under a
//  progress bar, the browser navigates to that area's page (core/handoff.js builds the URL), where the same veil carries on and the player continues at the same pose. (?gateprompt=1 restores the old
//  chip + yes / no question for development.) RUNTIME-ONLY (tools/baked-revision.mjs RUNTIME_ONLY): only src/main.js imports it, so editing it never makes a bake stale.
//
//  Three layers, so that the logic can be tested without a browser:
//    1. pure geometry   gateCoords, depthFor, chipFor, inUnion                (street frame: x east, z south; a gate's `inward` points from the border into its OWN area)
//    2. the state machine  createGateMachine({ gates })                       when does the chip show, when does the gate trigger, when is a decline over: the BORDER gates (a straight segment) and the EDGE gates (kind 'edge': the
//                                                                             territory of the area is a union of rectangles that overlaps its neighbour's; a probe point ahead of the player is outside FROM's territory and well inside TO's)
//    3. the DOM layer   createGates(deps)                                     preflight, the freeze veil (createSeam / grabFrame), navigation, window.__gates (chip + ui.confirm only with ?gateprompt=1); the DOOR gates (kind 'door': a ctx.interact item,
//                                                                             E / USE at a door, no chip, no zone) and the PLACES of the other area (the area module's CROSS_PLACES: the HUD list offers
//                                                                             them, a pick travels at once and lands at that place's pose; milestone M7)
//  plus planArrival (the destination side: ?cam= + ?ho= -> the pose the player really starts at).
//  Indoors (M7): while the player is inside a walk-in interior (ctx.indoor.zone, core/zones.js: the Podpisnye Izdaniya bookstore of the North lies inside the prompt zone of g2) there is no chip and no
//  question; the machine keeps running, so the gate re-arms the moment he steps out. The predicate is a dependency (deps.isIndoors), so the machine stays pure.
// ============================================================================
import { REGISTRY, GATES as ALL_GATES, GATES_ENABLED } from '../areas/registry.js';
import { makeHo, arrivalUrl, decodeHo, parseCamParam, camParam, resolveArrival, makeProbe } from './handoff.js';

// ---------------------------------------------------------------- tuning (m, s, m/s); the registry's zone (walking depth) overrides DEPTH_WALK per gate
export const DEFAULTS = {
  depthWalk: 30,          // the prompt zone for a walker: this far from the border
  chipWalk: 90,           // the passive chip shows from here
  exitMargin: 20,         // after a decline the player must get this far beyond the zone before the next question
  cooldownS: 45,          // ... and this long (game time) must have passed
  graceS: 6,              // no question in the first seconds after an arrival
  holdS: 1.5,             // after a teleport the velocity estimate is ignored for this long
  emaS: 0.5,              // time constant of the speed estimate
  approachV: 0.5,         // m/s toward the border that count as "approaching"
  nearD: 8,               // ... or this close to the border
  lateralTol: 0,          // a walker / car must be between the ends of the segment
  flyTol: 100,            // a flyer may overshoot the border by up to this much (core/player.js)
  behind: 120,            // d below zero (outside the area, a flyer) still counts down to this
  failCooldownS: 30,      // after a failed preflight
  edgeZone: 40,           // an EDGE gate: how far ahead of a walker the probe point lies (a vehicle uses depthFor)
  edgeIn: 60,             // ... and how deep inside the destination's territory that point must be (the arrival is never at the destination's edge)
  edgeAlign: 0.92,        // ... a moving player probes only the direction he heads in (cos 22.5 degrees: his octant): walking ALONG an edge triggers nothing
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------------------------------------------------------------- 1. geometry
/** depth of the prompt zone (m from the border) for a mode ('walk' | 'fly' | 'car') at speed v (m/s): a walker 30 m, a vehicle or flyer clamp(30 + 0.5 v + v^2/60, 40, 160) (92 m at 48 m/s: the coupe stops in 38 m at full brake) */
export function depthFor(mode, v, C = DEFAULTS) { return mode === 'walk' ? C.depthWalk : clamp(30 + 0.5 * v + v * v / 60, 40, 160); }
/** distance from which the passive chip shows */
export function chipFor(mode, v, C = DEFAULTS) { return mode === 'walk' ? C.chipWalk : depthFor(mode, v, C) + 30; }
/** (x,z) in the frame of a gate: d = metres from the border into the gate's own area, s = metres along the segment from its first end, len = segment length */
export function gateCoords(g, x, z) {
  const [a, b] = g.seg, ex = b[0] - a[0], ez = b[1] - a[1], len = Math.hypot(ex, ez) || 1, tx = ex / len, tz = ez / len;
  const px = x - a[0], pz = z - a[1];
  return { d: px * g.inward[0] + pz * g.inward[1], s: px * tx + pz * tz, len, tx, tz };
}

// ---- territories: a union of axis-aligned rectangles { x0, x1, z0, z1 } (REGISTRY[id].play); inUnion has the semantics of src/world/layout.js _inUnion
const _inR = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const _bcache = new WeakMap();
function _boundary(rs) {      // boundary segments [ax, az, bx, bz] of the union (an edge shared by two rectangles is interior)
  let c = _bcache.get(rs); if (c) return c; c = [];
  const sub = (a, b, cut) => { let rem = [[a, b]]; for (const [c0, c1] of cut) { const nr = []; for (const [s, e] of rem) { if (c1 <= s || c0 >= e) { nr.push([s, e]); continue; } if (c0 > s) nr.push([s, c0]); if (c1 < e) nr.push([c1, e]); } rem = nr; } return rem.filter(([s, e]) => e - s > 1e-9); };
  rs.forEach((r, i) => {
    const o = rs.filter((_, j) => j !== i);
    for (const [s, e] of sub(r.x0, r.x1, o.filter((q) => q.z0 < r.z0 && q.z1 >= r.z0).map((q) => [q.x0, q.x1]))) c.push([s, r.z0, e, r.z0]);
    for (const [s, e] of sub(r.x0, r.x1, o.filter((q) => q.z0 <= r.z1 && q.z1 > r.z1).map((q) => [q.x0, q.x1]))) c.push([s, r.z1, e, r.z1]);
    for (const [s, e] of sub(r.z0, r.z1, o.filter((q) => q.x0 < r.x0 && q.x1 >= r.x0).map((q) => [q.z0, q.z1]))) c.push([r.x0, s, r.x0, e]);
    for (const [s, e] of sub(r.z0, r.z1, o.filter((q) => q.x0 <= r.x1 && q.x1 > r.x1).map((q) => [q.z0, q.z1]))) c.push([r.x1, s, r.x1, e]);
  });
  _bcache.set(rs, c); return c;
}
function _distBoundary(rs, x, z) { let d = Infinity; for (const [ax, az, bx, bz] of _boundary(rs)) { const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz, t = l ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l)) : 0; d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return d; }
/** (x,z) inside the union of rectangles `rs`, at least `margin` metres from its boundary (margin < 0: also up to -margin outside); the same semantics as src/world/layout.js _inUnion */
export function inUnion(rs, x, z, margin = 0) {
  if (!rs || !rs.length) return false;
  if (margin > 0) for (let i = 0; i < rs.length; i++) { const r = rs[i]; if (x >= r.x0 + margin && x <= r.x1 - margin && z >= r.z0 + margin && z <= r.z1 - margin) return true; }      // margin deep inside ONE rectangle: no boundary walk
  let ins = false; for (let i = 0; i < rs.length && !ins; i++) ins = _inR(rs[i], x, z);
  if (margin === 0) return ins; return margin > 0 ? ins && _distBoundary(rs, x, z) >= margin : ins || _distBoundary(rs, x, z) <= -margin;
}
/** the 8 probe directions of an edge gate, every 45 degrees from north (-z) clockwise (x east, z south): k = 0 N, 1 NE, 2 E, 3 SE, 4 S, 5 SW, 6 W, 7 NW */
export const EDGE_DIRS = (() => { const h = Math.SQRT1_2; return [[0, -1], [h, -h], [1, 0], [h, h], [0, 1], [-h, h], [-1, 0], [-h, -h]]; })();
/** an EDGE gate: a registry row { id, kind: 'edge', from, to, zone?, reverse } (a border between the territories of two areas that overlap) */
export const isEdge = (g) => !!g && g.kind === 'edge';

// ---------------------------------------------------------------- 2. the state machine
/**
 * createGateMachine({ gates, config, rectsOf, inFrom }). gates: border rows (seg / inward) and edge rows (kind 'edge'). Edge gates read the territories from rectsOf(areaId) (default: REGISTRY[id].play;
 * injectable for tests); inFrom(gate, x, z) overrides the test "is the player inside FROM's territory" (the page passes its own layout.js inPlay).
 */
export function createGateMachine({ gates, config = {}, rectsOf = (id) => (Object.hasOwn(REGISTRY, id) ? REGISTRY[id].play : null), inFrom = null }) {
  const C = { ...DEFAULTS, ...config };
  const st = new Map(gates.map((g) => [g.id, { until: -1e9, needExit: false, open: false }]));
  // review fix: update() runs every frame on the strip too and used to allocate ~750 bytes per call (two spreads of the 13-key config, a gateCoords object per gate, three Math.hypot): the per-gate geometry is computed once and the loop is plain arithmetic
  const geo = gates.map((g) => {
    if (isEdge(g)) { const from = rectsOf(g.from), to = rectsOf(g.to); return { edge: !!(from && to), from, to, zone: g.zone || C.edgeZone }; }
    const [a, b] = g.seg, ex = b[0] - a[0], ez = b[1] - a[1], len = Math.hypot(ex, ez) || 1; return { a0: a[0], a1: a[1], len, tx: ex / len, tz: ez / len, zone: g.zone || C.depthWalk, chipW: Math.max(C.chipWalk, (g.zone || C.depthWalk) * 3) };
  });
  const insideFrom = (g, q, x, z) => (inFrom ? inFrom(g, x, z) : inUnion(q.from, x, z, 0));
  /**
   * The edge rule: the index (EDGE_DIRS) of a direction whose probe point p + depth * dir is OUTSIDE FROM's territory and INSIDE TO's by at least C.edgeIn, or -1. With a velocity (vx, vz, speed) the
   * direction must also be the one the player moves in (his component along it >= approachV and >= edgeAlign * speed) or he must stand within nearD of the edge in that direction.
   */
  function edgeDir(g, q, x, z, depth, vel, vx, vz, speed) {
    for (let k = 0; k < 8; k++) {
      const dx = EDGE_DIRS[k][0], dz = EDGE_DIRS[k][1];
      if (insideFrom(g, q, x + depth * dx, z + depth * dz) || !inUnion(q.to, x + depth * dx, z + depth * dz, C.edgeIn)) continue;
      if (!vel || vx * dx + vz * dz >= Math.max(C.approachV, C.edgeAlign * speed) || !insideFrom(g, q, x + C.nearD * dx, z + C.nearD * dz)) return k;
    }
    return -1;
  }
  let clock = 0, lastX = null, lastZ = null, vx = 0, vz = 0, holdUntil = 0, graceUntil = C.graceS;
  const machine = {
    config: C,
    get clock() { return clock; },
    get speed() { return clock < holdUntil ? 0 : Math.sqrt(vx * vx + vz * vz); },
    /**
     * One step. inp = { dt, x, z, mode: 'walk'|'fly'|'car', blocked: bool (not started, travelling, a panel open, underground, riding ...), indoors?: bool (inside a walk-in interior: no chip, no
     * question, the state keeps running so the gate re-arms on stepping out), teleported?: bool }.
     * Returns { chip: { gate, d, depth } | null (show the passive chip), offer: gate | null (ask now) }.
     */
    update(inp) {
      const { dt, x, z, mode } = inp, blocked = inp.blocked || !!inp.indoors;
      clock += dt;
      if (lastX === null) { lastX = x; lastZ = z; }
      else if (dt > 0) {
        const dx = x - lastX, dz = z - lastZ;
        if (inp.teleported || Math.sqrt(dx * dx + dz * dz) > 40 + 80 * dt) { vx = vz = 0; holdUntil = clock + C.holdS; }      // a jump is a teleport, not a motion
        else { const k = Math.min(1, dt / C.emaS); vx += (dx / dt - vx) * k; vz += (dz / dt - vz) * k; }
        lastX = x; lastZ = z;
      }
      const held = clock < holdUntil, v = held ? 0 : Math.sqrt(vx * vx + vz * vz);
      let chip = null, offer = null, dir = -1;
      const walk = mode === 'walk', vehDepth = walk ? 0 : depthFor(mode, v, C), tol = mode === 'fly' ? C.flyTol : C.lateralTol;      // (depthFor / chipFor of a vehicle do not read the zone)
      for (let gi = 0; gi < gates.length; gi++) {
        const g = gates[gi], q = geo[gi], s = st.get(g.id);
        if (isEdge(g)) {      // the territory gate: no chip, no segment
          if (!q.edge) continue;
          if (!insideFrom(g, q, x, z)) { s.needExit = false; continue; }      // outside FROM's own territory (a flyer over the wall, a teleport): nothing to do
          const eDepth = walk ? q.zone : vehDepth;
          if (s.needExit && edgeDir(g, q, x, z, eDepth + C.exitMargin, false) < 0) s.needExit = false;      // the player has left the zone by the margin: a decline is over (the time must also have passed)
          if (blocked || s.open || clock < graceUntil || offer || clock < s.until || s.needExit) continue;
          const k = edgeDir(g, q, x, z, eDepth, true, held ? 0 : vx, held ? 0 : vz, v); if (k >= 0) { offer = g; dir = k; }
          continue;
        }
        const px = x - q.a0, pz = z - q.a1, cd = px * g.inward[0] + pz * g.inward[1], cs = px * q.tx + pz * q.tz;
        const depth = walk ? q.zone : vehDepth, chipD = walk ? q.chipW : vehDepth + 30;
        const lateral = cs >= -tol && cs <= q.len + tol;
        if (!lateral || cd > depth + C.exitMargin) s.needExit = false;       // the player has left the zone by the margin: a decline is over (the time must also have passed)
        if (blocked || !lateral || cd < -C.behind || cd > chipD) continue;
        if (!chip || cd < chip.d) chip = { gate: g, d: cd, depth };
        if (s.open || clock < graceUntil) continue;
        const vIn = held ? 0 : vx * g.inward[0] + vz * g.inward[1];
        if (cd <= depth && (vIn <= -C.approachV || cd <= C.nearD) && clock >= s.until && !s.needExit && !offer) offer = g;
      }
      return { chip, offer, v, dir };
    },
    /** the question is on screen for gate g / the travel has begun (a gate the machine does not run, a door, is ignored by these three) */
    markOpen(g) { const s = st.get(g.id); if (s) s.open = true; },
    /** declined: no question for cooldownS and until the player has left the zone by exitMargin */
    decline(g) { const s = st.get(g.id); if (!s) return; s.open = false; s.until = clock + C.cooldownS; s.needExit = true; },
    /** the question ended without a decision by the player (a failed preflight, a cancelled travel): wait `seconds`, no exit needed */
    cooldown(g, seconds = C.failCooldownS) { const s = st.get(g.id); if (!s) return; s.open = false; s.until = clock + seconds; s.needExit = false; },
    /** no question for `seconds` from now (an arrival) */
    grace(seconds) { graceUntil = clock + seconds; },
    /** forget the speed estimate (a teleport) */
    teleported() { vx = vz = 0; holdUntil = clock + C.holdS; lastX = lastZ = null; },
    state: (g) => (st.has(g.id) ? { ...st.get(g.id) } : null),
  };
  return machine;
}
/** a registry row the machine runs: a stretch of the border or an edge (a door is a ctx.interact item: isDoor) */
export const isDoor = (g) => !!g && g.kind === 'door';
export const isBorderGate = (g) => !!g && !isDoor(g) && !isEdge(g);
/** the rows of the area module's CROSS_PLACES that this area can really travel through: the gate exists, leaves this area and leads to the place's area */
export function crossPlaces(table, areaId, gates = ALL_GATES) {
  return (Array.isArray(table) ? table : []).filter((p) => p && typeof p.key === 'string' && gates.some((g) => g.id === p.gate && g.from === areaId && g.to === p.area));
}

// ---------------------------------------------------------------- the destination side
/**
 * The arrival at THIS page: ?cam= plus a valid ?ho= for this area -> { ho, mode, fly, pose { x, y|null, z, yaw, pitch }, how, moved, gate } or null (no hand-off) or { invalid } (a bad ho is ignored).
 * L is this page's layout module; the arrival rect comes from the registry gate named by ho.gate (a dev gate, a gate of another page, an EDGE gate: none, the same x,z is walkable by construction and the
 * ring search of resolveArrival moves the player only if something blocks it).
 */
export function planArrival({ L, A, params, gates = ALL_GATES }) {
  const raw = params.get('ho'); if (!raw) return null;
  const dec = decodeHo(raw, { to: A.ID }); if (!dec.ok) return { invalid: dec.why };
  const cam = parseCamParam(params.get('cam')); if (!cam) return { invalid: 'cam' };
  const ho = dec.ho, gate = gates.find((g) => g.id === ho.gate && g.to === A.ID) || null;
  // a door (the metro ride) arrives ON FOOT at the door's pose (?cam= carries it; no car, no flight); a place (via 'place') lands at the place's pose, never clamped into the gate's arrival
  // rectangle (plan 3.4): the pose is a pedestrian viewpoint (a VIEWS row), so it is resolved as a walker's even when the car comes along (drive.arrive then parks the car at the nearest free
  // spot within 40 m, as the in-area places list does with drive.place); a border gate clamps into its rectangle and a car needs a lane there
  const door = isDoor(gate), place = ho.via === 'place';
  const fly = !door && params.has('fly') && cam.y !== null, mode = door ? 'walk' : ho.car ? 'car' : fly ? 'fly' : 'walk';
  const probe = makeProbe(L); if (fly) probe.blocked = () => false;      // a flyer over a building or the river is fine, only the border matters
  // A boat crosses on water, not a road. Its final hull placement is checked
  // by drive.arrive after the destination's water and colliders are built.
  const r = resolveArrival(probe, { x: cam.x, z: cam.z, yaw: cam.yaw }, place || mode === 'fly' || ho.car?.kind === 'boat' ? 'walk' : mode, gate && !door && !place ? gate.arrive : null);
  return { ho, mode, fly, gate, how: r.how, moved: r.moved, pose: { x: r.x, y: fly && r.how !== 'hero' ? cam.y : null, z: r.z, yaw: r.how === 'hero' ? r.yaw : cam.yaw, pitch: r.how === 'hero' ? 8 : cam.pitch } };
}

/**
 * The way back to the area the player came from: { text, url } or null (no valid origin, or the origin left no return pose). url is the origin's page at the pose he left from (ho.ret) -
 * the metro door g3 leaves him within 4 m of the vestibule door, so the strip's arrival card returns him to the North at the door. The same plain ?cam= URL on every page, no new protocol; `qName`
 * keeps the quality tier. Shown on the arrival card (core/boot-guard.js arrivalLink) and on the fatal card. `ho` is untrusted: 'constructor' must not find a row.
 */
export function backLink(ho, { qName = 'medium', base = 'http://localhost/' } = {}) {
  const row = ho && typeof ho.from === 'string' && Object.hasOwn(REGISTRY, ho.from) ? REGISTRY[ho.from] : null;
  if (!row || !ho.ret) return null;
  return { text: `Вернуться: ${row.title} · Back to ${row.titleEn}`, url: new URL(`${row.page}?${new URLSearchParams({ cam: camParam(ho.ret), q: qName })}`, base).href };
}

// ---------------------------------------------------------------- texts (Russian first, English after the dot)
/** the texts of the question for area `to`; a door gate brings its own title / sights / scene / fine (registry row `prompt`), a place of CROSS_PLACES names itself in the sights line */
export function promptTexts(to, { gate = null, place = null } = {}) {
  const a = REGISTRY[to], mb = a.approxMB;
  const T = {
    title: `Новая область: ${a.title} · New area: ${a.titleEn}`, sights: a.sights.join(' · '),
    scene: `Отдельная сцена, около ${mb} МБ, 25–40 с, страница перезагрузится · A separate scene, about ${mb} MB, 25–40 s; the page reloads`,
    fine: 'Машина, время суток и звук поедут с вами, припаркованное останется · Your car, time of day and sound come along; anything parked stays here',
    yes: 'Загрузить · Load', no: 'Не сейчас · Not now', chip: `${a.title} впереди · ${a.titleEn} ahead · N`, travelKicker: 'Загрузка области · Loading the area',
    stalled: 'Версия области устарела: обновите страницу · The area is out of date: reload the page', offline: 'Нет связи с областью · Cannot reach the area', unavailable: 'Область недоступна · The area is not available',
  };
  if (isDoor(gate) && gate.prompt) for (const k of ['title', 'sights', 'scene', 'fine']) if (gate.prompt[k] && !(place && (k === 'title' || k === 'scene'))) T[k] = gate.prompt[k];      // (a place picked through a door: the door's title and scene describe the metro ride and the rotunda, so the area's own lines stay; its walk-out 'fine' line is true for both)
  if (place) T.sights = `Сразу к месту: ${place.label}${place.labelEn ? ` · Straight to ${place.labelEn}` : ''}`;
  return T;
}
/** the body of the question as DOM (text nodes only: the strings above are never parsed as HTML) */
export function promptBody(doc, T) {
  const body = doc.createElement('div');
  const sights = doc.createElement('div'); sights.className = 'sights'; sights.textContent = T.sights; body.append(sights);
  const p = doc.createElement('p'); p.textContent = T.scene; body.append(p);
  const fine = doc.createElement('p'); fine.className = 'fine'; fine.textContent = T.fine; body.append(fine);
  return body;
}


// ---------------------------------------------------------------- the freeze veil (docs/AREAS.md "Seamless hand-off"): no text, a frozen blurred frame and a progress bar
/** sessionStorage key of the hand-over between the two pages: { img (a data: URL of the frozen frame, JPEG), w, h, t (Date.now()), from, to } */
export const SEAM_KEY = 'n4spb.seam';
export const SEAM_FRESH_MS = 60000;
/** where the origin page leaves the bar (0..1) when it hands over; the destination continues from the entry's p */
export const SEAM_LEAD = 0.12;
/** may the destination page paint this stored entry? (a data: image, written less than a minute ago, for THIS area when `to` is given) */
export function seamEntryOk(e, { now = Date.now(), to = null } = {}) {
  return !!e && typeof e === 'object' && typeof e.img === 'string' && e.img.startsWith('data:image/') && e.img.length < 6e6 && Number.isFinite(e.t) && now - e.t < SEAM_FRESH_MS && now - e.t > -5000 && (!to || e.to === to);
}
/** store / read / drop the entry; every call is wrapped (private mode, quota, a blocked storage): false / null, never a throw */
export function seamWrite(win, entry) { try { win.sessionStorage.setItem(SEAM_KEY, JSON.stringify(entry)); return true; } catch (e) { try { win.sessionStorage.removeItem(SEAM_KEY); } catch (e2) { /* nothing to drop */ } return false; } }
export function seamRead(win) { try { const raw = win.sessionStorage.getItem(SEAM_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
export function seamClear(win) { try { win.sessionStorage.removeItem(SEAM_KEY); } catch (e) { /* ignore */ } }
/**
 * The frozen frame of a WebGL canvas as { img (JPEG data: URL), w, h } (at most maxW wide), or null. MUST be called in the same task as the render that drew the frame (main.js frame(): the drawing buffer
 * is not preserved, a later read is black); a frame that is entirely black (a lost context, a failed read) is refused.
 */
export function grabFrame(canvas, { maxW = 1280, quality = 0.72, doc = globalThis.document } = {}) {
  try {
    const w0 = canvas.width, h0 = canvas.height; if (!(w0 > 0 && h0 > 0)) return null;
    const k = Math.min(1, maxW / w0), w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k));
    const c = doc.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(canvas, 0, 0, w, h);
    const t = doc.createElement('canvas'); t.width = 8; t.height = 8; const tg = t.getContext('2d'); tg.drawImage(c, 0, 0, 8, 8);
    const px = tg.getImageData(0, 0, 8, 8).data; let sum = 0; for (let i = 0; i < px.length; i += 4) sum += px[i] + px[i + 1] + px[i + 2];
    if (sum === 0) return null;      // black: nothing worth freezing
    return { img: c.toDataURL('image/jpeg', quality), w, h };
  } catch (e) { return null; }
}
/**
 * The veil element of index.html (#seam: .seam-snap the frozen frame, .seam-shade, .seam-track > .seam-fill, .seam-pct) and its classes: `on` (shown), `anim` (the transitions run), `blur` (the blurred, darkened
 * state), `plain` (no picture: a dark blurred veil), `out` (fading away). The origin page animates 0 -> blur; the destination page's inline script (index.html) starts at `on blur` with no animation and the same
 * picture, so there is no flash between the pages. Without the element (a test, a fake document) every call does nothing.
 */
export function createSeam({ doc = globalThis.document, win = globalThis.window } = {}) {
  const el = () => doc.getElementById('seam');
  const q = (s) => { const e = el(); return e && e.querySelector ? e.querySelector(s) : null; };
  let timer = null, raf = 0, shown = null, target = 0;
  const hasRaf = () => !!win && typeof win.requestAnimationFrame === 'function';
  /** the bar's base: the value the origin page left it at (the destination's inline script writes it to #seam data-base); real progress 0..1 maps onto base..1, so the bar continues instead of restarting */
  const base = () => { const e = el(), b = e && e.dataset ? Number(e.dataset.base) : 0; return Number.isFinite(b) ? Math.min(0.9, Math.max(0, b)) : 0; };
  /** ONE drawn value feeds the fill and the label (no CSS transition on the fill: the label can never run ahead of the bar) */
  function paint(v) {
    const fill = q('.seam-fill'), pct = q('.seam-pct'), tr = q('.seam-track'), e = el(); shown = v;
    if (fill) fill.style.transform = `scaleX(${Math.round(v * 1000) / 1000})`;
    if (pct) pct.textContent = `${Math.round(v * 100)}%`;
    if (tr) tr.setAttribute('aria-valuenow', String(Math.round(v * 100)));
    if (e && e.dataset) e.dataset.p = String(Math.round(v * 1000) / 1000);
  }
  function step() {
    raf = 0; const d = target - shown;
    if (Math.abs(d) < 0.004) { paint(target); return; }
    paint(shown + d * 0.2); raf = win.requestAnimationFrame(step);
  }
  /** move the drawn value toward t (0..1, absolute): at once without animation frames (tests, a hidden tab), eased by a frame loop otherwise */
  function aim(t, now = false) {
    target = Math.min(1, Math.max(0, Number(t) || 0));
    if (shown === null) { const f = q('.seam-fill'), m = f && f.style && /scaleX\(([\d.]+)\)/.exec(f.style.transform || ''); shown = m ? Number(m[1]) : 0; }
    if (now || !hasRaf()) { if (raf && win.cancelAnimationFrame) win.cancelAnimationFrame(raf); raf = 0; paint(target); return; }
    if (!raf) raf = win.requestAnimationFrame(step);
  }
  const api = {
    get active() { const e = el(); return !!e && !!e.classList && e.classList.contains('on'); },
    /** the origin page: show the veil over the frozen frame `snap` ({ img } or null: a plain dark veil) and let it blur in */
    show(snap) {
      const e = el(); if (!e) return false; clearTimeout(timer);
      const s = q('.seam-snap'); if (snap && snap.img && s) s.style.backgroundImage = `url("${snap.img}")`; else e.classList.add('plain');
      if (e.dataset) e.dataset.base = '0';
      e.classList.remove('out', 'blur'); e.classList.add('on', 'anim'); aim(0, true);
      void e.offsetWidth;      // a style flush between `on` and `blur`: the blur and the darkening animate from 0
      e.classList.add('blur'); return true;
    },
    /** the origin page: the bar rises to SEAM_LEAD while the new page is on its way; the same value goes into the sessionStorage entry (p) and the destination continues from it */
    lead(v = SEAM_LEAD) { aim(Math.max(shown || 0, v)); },
    /** the real progress 0..1 (src/main.js setProgress), mapped onto base..1 and eased; fill and label are drawn from one value */
    progress(f) { const frac = Math.min(1, Math.max(0, Number(f) || 0)), b = base(); aim(b + (1 - b) * frac); },
    /** the destination page is ready and running: the blur relaxes while the frozen frame cross-fades into the live one, then the element goes and the stored picture is dropped */
    finish() {
      seamClear(win); const e = el(); if (!e) return;
      aim(1); e.classList.add('anim', 'out');
      clearTimeout(timer); timer = setTimeout(() => { const x = el(); if (x && x.remove) x.remove(); }, 900);      // (html.seam-in stays: the splash must not come back behind a running game)
    },
    /** gone at once (a failed travel, a fatal error, a bad hand-off): the splash card may come back */
    remove() { clearTimeout(timer); const e = el(); if (e && e.remove) e.remove(); try { doc.documentElement.classList.remove('seam-in'); } catch (err) { /* a fake document */ } },
    /** back to the hidden state without removing the element (a failed preflight after the veil was up: the origin page plays on) */
    hide() { const e = el(); if (!e) return; clearTimeout(timer); e.classList.remove('on', 'blur', 'out', 'plain', 'anim'); const s = q('.seam-snap'); if (s) s.style.backgroundImage = ''; if (e.dataset) e.dataset.base = '0'; aim(0, true); },
  };
  return api;
}

// ---------------------------------------------------------------- 3. the DOM layer
/**
 * deps = { ctx, player, camera, ui, tod, audio, guard, params, A, isStarted: () => bool, toast: (text) => void, win = window, doc = document, fetchImpl = fetch,
 *          isIndoors = () => !!ctx.indoor?.zone (inside a walk-in interior: no trigger; core/zones.js tracks the camera's zone),
 *          inPlay = (x, z) => bool (this page's own territory, src/world/layout.js inPlay: the edge gates' "inside FROM"; default REGISTRY[A.ID].play),
 *          captureFrame = () => Promise<{ img, w, h } | null> (the frozen frame, read right after a render: src/main.js), seam = createSeam(), rectsOf (tests) }
 * Returns the API that is also exposed as window.__gates (tests replace api.navigate / api.preflight and drive api.machine). null when the gates are off or this area has none
 * (neither a border / edge gate, nor a door, nor a place to offer).
 * NO question is asked: a gate that triggers (the zone of a border gate, the probe of an edge gate), E at a door, a pick from the HUD list of places all call go() at once. ?gateprompt=1 (development) restores the old
 * passive chip and the ui.confirm question.
 */
export function createGates(deps) {
  const { ctx, player, camera, ui, tod, audio, guard, params, A, isStarted, toast } = deps;
  const win = deps.win || window, doc = deps.doc || document, fetchImpl = deps.fetchImpl || ((...a) => fetch(...a));
  const isIndoors = deps.isIndoors || (() => !!(ctx.indoor && ctx.indoor.zone));
  const off = params.get('gates') === '0' || (params.get('gates') !== '1' && !GATES_ENABLED);
  const PROMPT = params.has('gateprompt') && params.get('gateprompt') !== '0';      // development: the old chip + question
  const mine = (deps.gates || ALL_GATES).filter((g) => g.from === A.ID && (!g.dev || params.has('devgates')));      // (deps.gates: tests)
  const gates = mine.filter((g) => !isDoor(g)), doors = mine.filter(isDoor), places = crossPlaces(A.CROSS_PLACES, A.ID, mine);      // gates: the rows the machine runs (border and edge)
  if (off || (!gates.length && !doors.length && !places.length)) return null;
  const inFrom = deps.inPlay ? (g, x, z) => deps.inPlay(x, z) : null;
  const machine = createGateMachine({ gates, inFrom, ...(deps.rectsOf ? { rectsOf: deps.rectsOf } : {}) });
  const chipEl = doc.getElementById('gatechip'), seam = deps.seam || createSeam({ doc, win });
  let traveling = false, chipGate = null, watchdog = null;
  const DEG = 180 / Math.PI;

  const mode = () => (ctx.drive && ctx.drive.active ? 'car' : player.fly ? 'fly' : 'walk');
  /** the pose to hand over: { x, y|null, z, yaw (deg, camera convention), pitch (deg) } */
  function currentPose() {
    const d = ctx.drive;
    if (d && d.active) { const c = d.car; return { x: c.x, y: null, z: c.z, yaw: ((c.yaw + Math.PI) * DEG + 540) % 360 - 180, pitch: 0 }; }
    if (player.fly) return { x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw: player.yaw * DEG, pitch: player.pitch * DEG };
    return { x: player.pos.x, y: null, z: player.pos.z, yaw: player.yaw * DEG, pitch: player.pitch * DEG };
  }
  const xz = () => { const d = ctx.drive; return d && d.active ? { x: d.car.x, z: d.car.z } : { x: player.pos.x, z: player.pos.z }; };
  const isBlocked = () => !isStarted() || traveling || !!(guard && guard.dead) || !!ctx.travelPending || ui.open || player.riding || player.isUnderground();

  function setChip(c) {
    chipGate = c ? c.gate : null;
    if (!chipEl) return;
    const touch = doc.documentElement.classList.contains('tc');
    const txt = c ? promptTexts(c.gate.to).chip.replace(touch ? / · N$/ : /$^/, '') : '';      // (no key hint on a touch screen)
    if (chipEl.textContent !== txt) chipEl.textContent = txt;
    chipEl.classList.toggle('show', !!c);
  }
  function tick(dt) {
    if (dt <= 0) return;
    if (!gates.length) return;      // doors and places only: nothing to arm
    const p = xz(), r = machine.update({ dt, x: p.x, z: p.z, mode: mode(), blocked: isBlocked(), indoors: isIndoors() });
    if (PROMPT) setChip(r.chip);      // (the passive chip exists only with ?gateprompt=1)
    if (r.offer && !ui.open && !traveling) prompt(r.offer, 'gate');
  }
  /**
   * A gate triggered (via 'gate': the zone / the probe), E at a door (via 'door') or a HUD list pick (via 'place'): travel now. via 'gate' books the machine's state (so that it does not trigger again while
   * the preflight runs); a door or a place does not (a failed place travel must not silence the border gate it goes through). With ?gateprompt=1 the old question comes first.
   */
  function prompt(g, via = 'gate', place = null) {
    if (traveling || ui.open) return false;
    if (via === 'gate') machine.markOpen(g);
    if (!PROMPT) { api.go(g, via, place); return true; }
    const T = promptTexts(g.to, { gate: g, place });
    ui.confirm({ title: T.title, body: promptBody(doc, T), yes: T.yes, no: T.no, onYes: () => api.go(g, via, place), onNo: () => { if (via === 'gate') machine.decline(g); } });
    return true;
  }
  /** the HUD list picked a place of the other area (CROSS_PLACES key or row): travel at once, the arrival at that place's pose */
  function offerPlace(keyOrRow) {
    const p = typeof keyOrRow === 'string' ? places.find((q) => q.key === keyOrRow) : places.includes(keyOrRow) ? keyOrRow : null;
    if (!p || !isStarted()) return false;
    const g = mine.find((q) => q.id === p.gate);
    return prompt(g, 'place', p);
  }

  // ---- preflight: is the destination there, and does it match this version of the page? (silent: a failure is a short toast)
  async function preflight(to) {
    const row = REGISTRY[to];
    if (!row) return { ok: false, why: 'unknown area' };
    if (params.has('baked') || params.has('only') || params.has('allcity')) return { ok: true, dev: true };      // development flags run without a bake
    const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
    try {
      const head = await Promise.race([fetchImpl(new URL(row.page, win.location.href), { method: 'HEAD', cache: 'no-cache' }), timeout(4000)]);
      if (!head.ok) return { ok: false, why: 'page', status: head.status };
      const peekManifest = deps.peekManifest || (await import('./baked-world.js')).peekManifest, REVS = deps.bakedRevisions ?? (await import('./baked-revision.js')).BAKED_REVISIONS;      // (injectable for tests) REVS: the bake revision of EVERY live area (generated map): the target's manifest is compared with the TARGET's own entry, not with the revision of this page's area
      const m = await Promise.race([peekManifest(row.bake), timeout(4000)]);
      if (!m) return { ok: false, why: 'manifest' };
      if (m.area && m.area !== to) return { ok: false, why: 'area' };
      const want = REVS?.[row.id];      // a target that has no entry (a parked or unknown area), or a page whose cached map is older than the bake: stale, the safe side
      if (!want || m.revision !== want) return { ok: false, why: 'stale' };
      return { ok: true };
    } catch (e) { return { ok: false, why: 'offline' }; }
  }
  function endTravel(g) { traveling = false; ctx.travelPending = false; player.inputLock = Math.max(0, player.inputLock - 1); clearTimeout(watchdog); seam.hide(); if (g) machine.cooldown(g); }

  /**
   * preflight (silent), freeze the frame, show the veil over it, hand the picture to sessionStorage, navigate. The origin page stays alive (frozen behind the veil) until the browser commits the new page.
   * A border / edge gate hands over the current pose in the current mode; a door (via 'door') hands over the door's arrival pose ON FOOT (no car, no flight: the player walks out of the metro); a place
   * (via 'place') hands over the place's pose, in the car when the player drove, standing when he walked or flew. The return pose (ho.ret) is always where he stood here.
   */
  async function go(g, via = 'gate', place = null) {
    if (traveling) return false;
    traveling = true; ctx.travelPending = true; player.inputLock++;
    const pf = await api.preflight(g.to);
    if (!pf.ok) {
      endTravel(g);
      { const T = promptTexts(g.to); toast(pf.why === 'stale' ? T.stalled : pf.why === 'offline' ? T.offline : T.unavailable); }
      return false;
    }
    const here = currentPose(), d = ctx.drive, m0 = mode(), door = isDoor(g);
    const dest = via === 'place' && place ? place : door ? g.pose : null;      // (a place picked from the HUD list wins over the door's own pose: a CROSS_PLACES row may name a door gate, and then the player walks out at the PLACE, not at the metro rotunda)
    const m = door ? 'walk' : dest && m0 === 'fly' ? 'walk' : m0;
    const pose = dest ? { x: dest.x, y: null, z: dest.z, yaw: dest.yaw, pitch: dest.pitch ?? 0 } : here;
    const incoming = ctx.handoff && ctx.handoff.ho ? ctx.handoff.ho.n : 0;
    const ho = makeHo({ from: A.ID, to: g.to, via, gate: g.id, n: incoming + 1, mute: !!audio.muted, noui: doc.body.classList.contains('noui'), ret: { x: here.x, z: here.z, yaw: here.yaw, pitch: here.pitch },
      car: m === 'car' ? { id: d.vehicle.id, kind: d.vehicle.kind, vessel: d.vehicle.def?.vessel, dock: d.vehicle.def?.dock, view: d.view.mode, d: [d.damage.state.front, d.damage.state.rear, d.damage.state.left, d.damage.state.right] } : null });
    const url = arrivalUrl({ page: REGISTRY[g.to].page, pose, fly: m === 'fly', tod: tod.k, look: tod.variant, ho, search: win.location.search });
    let snap = null; try { snap = deps.captureFrame ? await deps.captureFrame() : null; } catch (e) { snap = null; }      // the frozen frame (null: the plain dark veil)
    seam.show(snap); if (snap && snap.img && seam.lead) seam.lead(SEAM_LEAD);      // the bar rises to SEAM_LEAD: the destination continues from there (entry.p)
    if (snap && snap.img) seamWrite(win, { img: snap.img, w: snap.w, h: snap.h, t: Date.now(), from: A.ID, to: g.to, p: SEAM_LEAD }); else seamClear(win);      // (a full / blocked storage: the destination shows the plain veil)
    clearTimeout(watchdog);
    watchdog = setTimeout(() => {      // the new page has not committed in 25 s: the player stays, the game goes on
      if (!traveling) return;
      try { win.stop(); } catch (e) { /* a fake window in tests */ }      // stop(): the pending location.replace must not complete behind the player's back
      seamClear(win); endTravel(g); toast(promptTexts(g.to).offline);
    }, 25000);
    api.lastUrl = url;
    api.navigate(url);
    return true;
  }
  const api = {
    machine, gates, edges: gates.filter(isEdge), doors, places, prompt, offerPlace, go, preflight, mode, currentPose, tick, isIndoors, seam, promptMode: PROMPT,
    lastUrl: null,
    /** replaceable in tests: the navigation itself (location.replace keeps ONE history entry, so a page that holds a gigabyte cannot be restored from the back/forward cache) */
    navigate: (url) => win.location.replace(new URL(url, win.location.href)),
    get traveling() { return traveling; }, get chipGate() { return chipGate; },
    /** the player teleported (views, R, the hand-off): forget the speed */
    teleported: () => machine.teleported(),
  };
  ctx.onUpdate((dt) => tick(dt));
  // the doors: an interact item each (core/ui.js createInteract: the chip "[E] label" within r metres of the door point, for a walker who is not flying and not held; the item is enabled only while
  // the game runs and no travel or question is open). Without ctx.interact (a test) the doors are listed but not offered.
  if (ctx.interact && doors.length) for (const d of doors) {
    const P = d.prompt || {};
    ctx.interact.add({ id: 'gate-' + d.id, x: d.at.x, z: d.at.z, radius: d.r, label: P.label || promptTexts(d.to).title, labelEn: P.labelEn || '',
      enabled: () => isStarted() && !traveling && !ui.open && !ctx.travelPending && !(guard && guard.dead), onUse: () => prompt(d, 'door') });
  }
  if (PROMPT) {      // development only: N asks again whenever the chip shows; a tap on the chip too
    win.addEventListener('keydown', (e) => {
      if (e.code !== 'KeyN' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !isStarted() || ui.open || traveling) return;
      if (e.target && /^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (chipGate) { e.preventDefault(); prompt(chipGate, 'gate'); }
    });
    if (chipEl) chipEl.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (chipGate && isStarted() && !ui.open && !traveling) prompt(chipGate, 'gate'); });
  }
  win.addEventListener('pageshow', (e) => { if (e.persisted && traveling) endTravel(null); });      // restored from the back/forward cache after a travel: the veil must go
  return api;
}
