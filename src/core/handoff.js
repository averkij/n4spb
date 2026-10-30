// ============================================================================
//  HAND-OFF between areas (docs/AREAS.md, section "Hand-off contract"). PURE: no DOM, no three.js, no import. RUNTIME-ONLY (tools/baked-revision.mjs RUNTIME_ONLY): only src/main.js, through
//  core/gates.js, imports it, so editing it never makes a bake stale.
//
//  A hand-off is a page navigation: the page of the area we leave builds the URL of the page of the destination area, and the destination page boots at that pose.
//    <page>?cam=x,z,yaw,pitch                (walking or driving)      <page>?cam=x,y,z,yaw,pitch&fly=1     (flying; y = eye height)
//          &tod=<k>&look=<variant>           (the time of day: tod.k, the weather variant)
//          &ho=<base64url JSON>              (what the standard parameters cannot say: the car, mute, the return pose ...)
//          &<every other parameter of the page we leave, except the denied ones>      (so ?q=medium, the FAST test harness flags, ?touch=1 ... survive a hop)
//  yaw is the camera yaw in degrees, 0 = north (-z), 90 = west, in EVERY mode (drive.place(x, z, yawDeg) uses the same convention).
// ============================================================================
export const HANDOFF_V = 1;
export const MAX_HO_CHARS = 600;
/** parameters that describe ONE arrival and must not be copied from the page we leave */
export const DENIED_PARAMS = ['ho', 'cam', 'fly', 'tod', 'look', 't', 'hop'];
const AREA_RE = /^[a-z][a-z0-9-]{0,31}$/;
const VIA = ['gate', 'door', 'place', 'return'];
const LIMIT = 20000;                                                   // |x|, |z| above this is not a place of this city
const num = (v) => typeof v === 'number' && Number.isFinite(v);
const r2 = (v) => Math.round(v * 100) / 100;

// ---------------------------------------------------------------- base64url of a UTF-8 string (browser and Node)
export function b64uEncode(str) {
  const bytes = new TextEncoder().encode(str); let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function b64uDecode(s) {
  const b = String(s).replace(/-/g, '+').replace(/_/g, '/'); const bin = atob(b + '==='.slice((b.length + 3) % 4));
  const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

// ---------------------------------------------------------------- the ho object
/** Build a hand-off object from what the origin page knows. Unknown / missing fields get their neutral values. */
export function makeHo({ from, to, via = 'gate', gate = '', car = null, mute = false, noui = false, ret = null, n = 1 }) {
  const ho = { v: HANDOFF_V, from, to, via, gate, car: null, mute: !!mute, noui: !!noui, ret: null, n: Math.max(1, Math.min(50, Math.round(n) || 1)) };
  if (car) {
    ho.car = { id: String(car.id), view: car.view ?? 0, d: (car.d || [0, 0, 0, 0]).slice(0, 4).map((x) => Math.round((Number(x) || 0) * 1000) / 1000) };
    if (car.kind === 'boat') {
      ho.car.kind = 'boat';
      if (typeof car.dock === 'string' && car.dock) ho.car.dock = car.dock;
    }
  }
  if (ret) ho.ret = { x: r2(ret.x), z: r2(ret.z), yaw: r2(ret.yaw), pitch: r2(ret.pitch ?? 0) };
  return ho;
}
/** { ok, ho } or { ok: false, why } - a hand-off is trusted only after this check, and an invalid one is ignored (the page then boots from ?cam alone) */
export function validateHo(ho, { to } = {}) {
  const bad = (why) => ({ ok: false, why });
  if (!ho || typeof ho !== 'object' || Array.isArray(ho)) return bad('not an object');
  if (ho.v !== HANDOFF_V) return bad('version ' + ho.v);
  if (typeof ho.from !== 'string' || !AREA_RE.test(ho.from)) return bad('from');
  if (typeof ho.to !== 'string' || !AREA_RE.test(ho.to)) return bad('to');
  if (to && ho.to !== to) return bad(`for area ${ho.to}, this page is ${to}`);
  if (!VIA.includes(ho.via)) return bad('via');
  if (typeof ho.gate !== 'string' || ho.gate.length > 40) return bad('gate');
  if (typeof ho.mute !== 'boolean' || typeof ho.noui !== 'boolean') return bad('flags');
  if (!Number.isInteger(ho.n) || ho.n < 1 || ho.n > 50) return bad('n');
  if (ho.car !== null) {
    const c = ho.car;
    if (!c || typeof c.id !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(c.id)) return bad('car.id');
    if (c.kind !== undefined && c.kind !== 'boat') return bad('car.kind');
    if (c.dock !== undefined && (c.kind !== 'boat' || typeof c.dock !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(c.dock))) return bad('car.dock');
    if (!(typeof c.view === 'number' || typeof c.view === 'string') || String(c.view).length > 16) return bad('car.view');
    if (!Array.isArray(c.d) || c.d.length !== 4 || !c.d.every((x) => num(x) && x >= 0 && x <= 100)) return bad('car.d');
  }
  if (ho.ret !== null) { const r = ho.ret; if (!r || !['x', 'z', 'yaw', 'pitch'].every((k) => num(r[k])) || Math.abs(r.x) > LIMIT || Math.abs(r.z) > LIMIT) return bad('ret'); }
  return { ok: true, ho };
}
export function encodeHo(ho) {
  const s = b64uEncode(JSON.stringify(ho));
  if (s.length > MAX_HO_CHARS) throw new Error(`hand-off too long (${s.length} > ${MAX_HO_CHARS})`);
  return s;
}
export function decodeHo(s, opts) {
  if (typeof s !== 'string' || !s || s.length > MAX_HO_CHARS) return { ok: false, why: 'missing or too long' };
  let ho; try { ho = JSON.parse(b64uDecode(s)); } catch (e) { return { ok: false, why: 'undecodable' }; }
  return validateHo(ho, opts);
}

// ---------------------------------------------------------------- the URL
/** the value of ?cam= for a pose { x, y?, z, yaw, pitch }: 4 numbers when walking or driving, 5 (x, y, z, yaw, pitch) when flying */
export function camParam(pose, fly) {
  const f = (v) => String(r2(v));
  return fly ? [pose.x, pose.y, pose.z, pose.yaw, pose.pitch ?? 0].map(f).join(',') : [pose.x, pose.z, pose.yaw, pose.pitch ?? 0].map(f).join(',');
}
/** every [key, value] of a query string except the denied ones (what a page passes on to the next) */
export function passThrough(search) {
  const out = []; for (const [k, v] of new URLSearchParams(search)) if (!DENIED_PARAMS.includes(k)) out.push([k, v]);
  return out;
}
/** The URL (relative to the site root of the current page) of an arrival: page ('north.html'), pose, flight flag, time of day, weather look, the ho object and the page's current query string. */
export function arrivalUrl({ page, pose, fly = false, tod = null, look = null, ho = null, search = '' }) {
  const q = new URLSearchParams();
  q.set('cam', camParam(pose, fly));
  if (fly) q.set('fly', '1');
  if (tod !== null && num(tod)) q.set('tod', String(Math.round(tod * 1000) / 1000));
  if (look) q.set('look', String(look));
  if (ho) q.set('ho', encodeHo(ho));
  for (const [k, v] of passThrough(search)) q.set(k, v);
  return `${page}?${q}`;
}
/** Parse ?cam= back into { x, y|null, z, yaw, pitch, fly: boolean } (4 numbers: walking / driving, 5: free camera), or null. The inverse of camParam. */
export function parseCamParam(s) {
  const a = String(s || '').split(',').map(Number); if (!a.every(num)) return null;
  if (a.length === 4) return { x: a[0], y: null, z: a[1], yaw: a[2], pitch: a[3] };
  if (a.length === 5) return { x: a[0], y: a[1], z: a[2], yaw: a[3], pitch: a[4] };
  return null;
}

// ---------------------------------------------------------------- the arrival pose
const DEG = Math.PI / 180;
/** unit forward vector of a camera yaw (degrees; 0 = north = -z, 90 = west = -x) */
export const forwardOf = (yawDeg) => [-Math.sin(yawDeg * DEG), -Math.cos(yawDeg * DEG)];

/**
 * A probe over a layout module L (src/world/layout.js of the DESTINATION page): the questions resolveArrival asks, kept apart so that tests can pass a fake.
 * inset (m): how far inside the play area an arrival must be (the invisible wall is silent, an arrival at the wall would be a trap).
 */
export function makeProbe(L, { inset = 25 } = {}) {
  return {
    inside: (x, z) => L.inPlay(x, z, inset),
    blocked: (x, z) => L.insideBuilding(x, z, 1.5),      // (water is reachable, docs/AREAS.md 13.7: a player in the river arrives in the river; a car still needs a lane, so it is put on the nearest road)
    /** the carriageway under (x,z): { tx, tz } unit tangent, or null when it is not on a vehicle road */
    lane: (x, z) => { const r = L.roadsNear(x, z, 0, { drivable: true }); const h = r.find((q) => q.gap <= 0); return h ? { tx: h.tx, tz: h.tz } : null; },
    hero: L.HERO,
  };
}

/**
 * Where does the player really arrive? `desired` {x, z, yaw} is the pose the origin page asked for; `mode` is 'walk' | 'fly' | 'car'; `rect` {x0,x1,z0,z1} the part of the destination
 * where an arrival is meant to be (null: anywhere). 1. clamp into the rect; 2. valid there (probe.inside, not blocked, a car also on a lane within 30 degrees of its heading, either
 * direction)? take it; 3. else the nearest valid point of a ring search (3..60 m, 12 angles); 4. else the destination HERO with how = 'hero'. Never throws; pure.
 */
export function resolveArrival(probe, desired, mode, rect, { ringMax = 60, ringStep = 3, angles = 12, laneDeg = 30 } = {}) {
  const clampRect = (x, z) => (rect ? [Math.min(rect.x1, Math.max(rect.x0, x)), Math.min(rect.z1, Math.max(rect.z0, z))] : [x, z]);
  const [fx, fz] = forwardOf(desired.yaw), cosMax = Math.cos(laneDeg * DEG);
  const valid = (x, z) => {
    if (!probe.inside(x, z) || probe.blocked(x, z)) return false;
    if (mode === 'car') { const l = probe.lane(x, z); if (!l) return false; if (Math.abs(l.tx * fx + l.tz * fz) < cosMax) return false; }
    return true;
  };
  const [cx, cz] = clampRect(desired.x, desired.z);
  const res = (x, z, how) => ({ x, z, yaw: desired.yaw, how, moved: Math.hypot(x - desired.x, z - desired.z) });
  if (valid(cx, cz)) return res(cx, cz, 'direct');
  for (let r = ringStep; r <= ringMax; r += ringStep) {
    let best = null;
    for (let a = 0; a < angles; a++) {
      const th = a / angles * 2 * Math.PI; const [x, z] = clampRect(cx + Math.cos(th) * r, cz + Math.sin(th) * r);
      if (!valid(x, z)) continue;
      const d = Math.hypot(x - cx, z - cz); if (!best || d < best.d) best = { x, z, d };
    }
    if (best) return res(best.x, best.z, 'ring');
  }
  const h = probe.hero; return { x: h.x, z: h.z, yaw: h.yaw, how: 'hero', moved: Math.hypot(h.x - desired.x, h.z - desired.z) };
}
