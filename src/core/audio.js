// Audio engine — fully synthesized WebAudio (no sample files). Nothing plays before start() (user gesture).
// Saint Petersburg edition (a summer day at Vosstaniya Square, Nevsky Prospekt, the Fontanka and, after the west extension, Kazan, Palace Square, the Admiralty and the Neva): the Yakutsk retune of the Sakuragaoka engine, re-voiced again by the wildlife
// specialist. CALM ambience only (user rule): no sirens, no alarms, no train horns / crossing bells, no harsh warning beeps; ordinary short car horns stay.
// The Moscow sounds (MCC train, platform chime + speech, steamer horn) are gone; their names are still accepted and silently ignored.
// Retune for Petersburg: a stone-canyon city bed that follows the distance to the roads (Nevsky is loud, a courtyard is quiet), hooded crows / pigeons / sparrows / swifts at golden
// hour / gulls over the water, the lapping of the Fontanka against its granite quay and the hum of the tourist boats, a quiet murmur near cafe terraces, and INDOOR beds: while the
// camera is in an indoor zone (window.__ctx.indoor.amount, docs/UNDERGROUND.md) the street beds fade out; in the metro halls / tunnels / escalators a quiet ventilation hum with a very
// soft far train rumble and a rare soft chime plays, in the station hall / the mall a soft hall murmur, in a vestibule a bit of both.
//
// API
//   audio.start()                       -> call from a user gesture; creates AudioContext, starts the ambience
//   audio.ready                          -> bool
//   audio.loop(name, opts) -> handle     -> opts: { position: Vector3 | {x,y,z} | [x,y,z] | () => Vector3, volume: 0..1, params: {} }
//        handle.setVolume(v, rampSeconds), handle.setParam(key, value), handle.setPosition(vec3), handle.stop()
//        Handles may be created before start(); they bind automatically once audio is ready.
//   audio.play(name, opts)               -> one-shot; opts: { position, volume, pan }
//   audio.update(camera, dt)             -> called by the core every frame (listener follows camera)
//   audio.setMaster(v), audio.muted (get/set)
//   None of these ever throw; unknown names are ignored (one console warning). Names that only existed in the Japanese / Moscow references (crossingBell, cafeMusic,
//   catMeow, sparrow, vendingDrop, departMelody, town, footsteps, trainRun, trainBrake, doorChime, announce, boatHorn) are accepted and silently ignored.
//
// Sound names   (metres / seconds; "ref" = distance at which a positional sound has its nominal level, inverse-distance falloff beyond it; "range" = not started /
//                silent beyond it, fading over its last 60 %)
//   ambient loops — start() runs loop(name, {volume: 1}) for 'city', 'wind', 'birds', 'traffic', 'lake', 'cafe', 'crowd', 'indoor'
//     'city'      the hum of a stone-canyon city: soft rumble, a faint 100 Hz substation tone, an activity haze (quieter at night); rare far events: a dog in a yard, a far horn.
//                 Fades out indoors (AMB.out)                                                                                                    [ambient]
//     'wind'      a soft summer breeze along the avenue (hiss + leaf rustle of the limes); follows the visual gust (window.__ctx.shared.uGust) when present   [ambient]
//     'birds'     the ambient bird layer: sparrows, great tits, pigeons cooing, far hooded crows, a rare far magpie, swifts screaming high overhead at golden hour only, gulls over
//                 the water (their rate follows waterProx(); a far one now and then anywhere). Events are placed around the listener on the audio clock (seeded PRNG); off indoors.
//                 The near birds are voiced by the wildlife module from their real positions.                                                     [ambient]
//     'traffic'   road roar bed (engine rumble + tyre roar + hiss) with slow platoon swells and baked stereo pass-bys (cars, a trolleybus whine, a delivery van). Ambient: its
//                 level follows the distance to the roads beside the listener (window.__ctx.L.roadsNear within 110 m: Nevsky loud, a side street 0.4-0.6, a courtyard faint),
//                 drops at night and fades indoors. With `position` a point source (ref 15, range 400; no pass-bys).
//     'lake'      the water of the city: soft lapping against the granite quay wall + droplets; ambient, follows the distance to the water (window.__ctx.services.environment.shoreDist:
//                 full at the parapet) and fades indoors. The reach and the voice depend on the nearest waterway (waterState / WATER_CH): the Neva carries 110 m with a slow big swell,
//                 the Fontanka 70 m, the Moika / Griboedov / Winter canals 45-55 m, quieter and with small slaps. With `position` a point source (ref 10, range 250). 'river' is an alias.
//     'crowd'     the murmur of a tourist square (Palace Square, Kazan garden, Gostiny Dvor, Alexander Garden, the Palace Embankment ...): far voices, a faint shuffle on the setts;
//                 ambient, level from window.__ctx.services.wildlife.crowds [{ x, z, r (full level within), f (fade length), l (0..1) }] (published by the wildlife module)   [ambient]
//     'cafe'      a quiet cafe terrace murmur with an occasional cup clink; ambient, level from the distance to the nearest terrace / cafe pavement (window.__ctx.services.wildlife.cafes
//                 and services.props.terraces, full within ~3 m, gone at ~15 m); asleep elsewhere                                                  [ambient]
//     'indoor'    the indoor beds: metro halls / tunnels (zone id 'metro-under', camera below -2.5 m): a quiet ventilation hum + a very soft far train rumble every 40-90 s +
//                 a rare soft two-note chime; station hall / mall: a soft hall murmur; vestibules: a bit of both. Weighted by window.__ctx.indoor.amount; asleep outdoors  [ambient]
//   positional loops (opts.position: Vector3 | () => Vector3; without it they play unspatialised)
//     'fountain'  falling water + droplets of a fountain (landmarksA); ref 6, range 140
//     'boatHum'   the idle diesel hum + burble of a tourist boat on the Fontanka (wildlife module: one per boat, position follows boats[i].state(t)); ref 10, range 150
//   one-shots      audio.play(name, { position, volume, pan })  (no position = flat, e.g. UI)
//     'crow'  'raven'  'magpie'   caws / croaks / rattle of the birds of the wildlife module (the hooded crow is 'crow')   ref 8-14, range 260
//     'gull'      one of three gull cries (black-headed gulls of the Fontanka)                        ref 10, range 380
//     'chime0' 'chime1' 'chime'   a soft two-note hall chime (metro platforms), calm, never an alarm                ref 6,  range 120
//     'duck'      a mallard hen's "quack-quack-quack"                                                  ref 8,  range 160
//     'wings'     a pigeon flock taking off (wing claps)                                              ref 6,  range 120
//     'dogBark'   one soft woof (or two) of a dog                                                     ref 8,  range 160
//     'clank'     removed construction / metal-strike sound; accepted silently
//     'busBrake'  bus squeal + air release at a stop;  'carDoor' a door shut                          ref 8 / 6
//     'doorOpen', 'doorClose'   pneumatic bus-door hiss + slide + thud (alias 'busDoorOpen' / 'busDoorClose')   ref 4, range 90
//     'bikeBell'  bicycle bell (alias 'bicycleBell')                                                  ref 3,  range 80
//     'carHorn'   two-tone car horn (short / long / double)                                           ref 12, range 320
//     The outdoor-only one-shots (birds, ducks, dog, horn) are dropped while the listener is indoors (AMB.out < 0.35).
//   footsteps: derived inside this file from the listener's own motion (one per stride while walking / running on the ground; the surface from
//   window.__ctx.services.environment.kindAt: setts / granite slabs = 'paved', asphalt, gravel = sand, grass); play('footstep') stays a silent no-op.
//
// Extras (optional, backwards compatible)
//   createAudio({ context, ambience = true, speech = true, master = 0.85, muted = false, seed, hrtf = true })
//     context: an existing (Offline)AudioContext used by start() instead of creating one (headless tests)
//   audio.context                 the AudioContext (null before start)
//   audio.meter() -> {rms, peak}  output level (debug), audio.stats -> {voices, loops, awake, sources, hrtf, buffers, state}
//   audio.names -> { loops: [...], oneShots: [...] }
//
// Design notes
//   * createAudio() never touches WebAudio; node / headless imports are safe. Everything is built in start().
//   * All sounds are synthesized: short sounds are rendered once in JS (additive / damped-phasor / formant
//     synthesis, seeded PRNG) into cached AudioBuffers and replayed with AudioBufferSourceNodes; continuous
//     sounds (wind, city, traffic, river, fountain, train motor, rolling noise, brake squeal) are small live node graphs
//     fed by three shared, seamlessly looping noise buffers. Car pass-bys are baked in JS with the physics in the loop
//     (1/distance level, Doppler pitch, air-absorption low-pass, equal-power pan from the azimuth). No ScriptProcessor / worklets.
//   * Timing uses AudioContext.currentTime with a 250 ms look-ahead scheduler; loop logic runs at a ~40 Hz
//     control rate on the audio clock (so it also works when the caller passes dt = 0).
//   * Positional sounds: PannerNode (inverse distance) + distance air-absorption low-pass + far fade; HRTF for
//     the loops and nearby one-shots, equal-power for ambient birds / city events / far sounds (CPU).
//     The listener follows the camera. A synthesized urban-canyon impulse response (facade slaps + a dark tail)
//     gives a light shared reverb.
//   * Loops that are out of range or at volume 0 are disconnected ("asleep") so the browser stops pulling them.
//   * Output: bus -> master -> compressor (glue/limiter) -> soft clipper (WaveShaper) -> mute -> destination.
//   * Voice caps per category; finished voices are stopped and disconnected.
//   * Runtime variation uses a seeded PRNG (never Math.random()).

const TAU = Math.PI * 2;
const LA = 0.25;                       // scheduler look-ahead (s)
const CTL = 0.024;                     // control-rate period (s, audio clock)
const SLEEP = 3;                       // an inaudible loop is disconnected after this many seconds
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const clamp01 = (v) => clamp(v, 0, 1);
const sm = (u) => { u = clamp01(u); return u * u * (3 - 2 * u); };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const nowMs = () => (globalThis.performance && performance.now ? performance.now() : Date.now());
const hasOwn = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);

function prng(seed) {
  let a = (seed >>> 0) || 1;
  const r = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  return r;
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

// =====================================================================================================
// Offline JS synthesis (pure functions: sample rate in, Float32Array(s) out)
// =====================================================================================================
const SIN_N = 4096; let SIN = null;
function sinT(ph) {                    // sine of a phase given in cycles (table + linear interpolation)
  if (SIN === null) { SIN = new Float32Array(SIN_N + 1); for (let i = 0; i <= SIN_N; i++) SIN[i] = Math.sin((i / SIN_N) * TAU); }
  ph -= Math.floor(ph); const x = ph * SIN_N, i = x | 0; return SIN[i] + (SIN[i + 1] - SIN[i]) * (x - i);
}
const arr = (sr, sec) => new Float32Array(Math.max(1, Math.round(sec * sr)));

/** add amp·e^(-t/tau)·sin(2πft) from t0 (damped phasor, 4 mults per sample) */
function addDamped(x, sr, t0, f, amp, tau, att = 0.001, phase = 0) {
  if (f <= 0 || f >= sr * 0.46 || !amp) return;
  const n0 = Math.max(0, Math.round(t0 * sr)), len = Math.min(x.length - n0, Math.ceil(tau * sr * 7));
  if (len <= 0) return;
  const w = (TAU * f) / sr, k = Math.exp(-1 / (tau * sr)), c = Math.cos(w) * k, s = Math.sin(w) * k;
  let re = Math.cos(phase), im = Math.sin(phase); const na = Math.max(1, Math.round(att * sr));
  for (let i = 0; i < len; i++) {
    x[n0 + i] += (i < na ? (amp * i) / na : amp) * im;
    const nr = re * c - im * s; im = re * s + im * c; re = nr;
  }
}
/** swept tone: frequency fFn(u,t), amplitude envFn(u,t), harmonic weights */
function addSwept(x, sr, t0, dur, fFn, envFn, harm = [1]) {
  const n0 = Math.round(t0 * sr), n = Math.round(dur * sr); let ph = 0;
  for (let i = 0; i < n; i++) {
    const j = n0 + i; if (j >= x.length) break;
    const t = i / sr, u = i / n; ph += fFn(u, t) / sr;
    const e = envFn(u, t); if (!e) continue;
    const s1 = sinT(ph), c2 = 2 * sinT(ph + 0.25); let sp = 0, sc = s1, s = harm[0] * s1;
    for (let k = 1; k < harm.length; k++) { const sn = c2 * sc - sp; sp = sc; sc = sn; s += harm[k] * sn; }
    x[j] += e * s;
  }
}
/** harmonic source f0Fn with a (time-varying) spectral envelope specFn(freq, u) — voices (crow, gull, pigeon) */
function addFormant(x, sr, t0, dur, f0Fn, envFn, specFn, maxF = 6000) {
  const n0 = Math.round(t0 * sr), n = Math.round(dur * sr), A = new Float32Array(40); let ph = 0, K = 1;
  for (let i = 0; i < n; i++) {
    const j = n0 + i; if (j >= x.length) break;
    const t = i / sr, u = i / n, f0 = f0Fn(u, t); ph += f0 / sr;
    if ((i & 63) === 0) { K = Math.max(1, Math.min(40, Math.floor(maxF / f0))); for (let k = 1; k <= K; k++) A[k - 1] = specFn(k * f0, u); }
    const e = envFn(u, t); if (!e) continue;
    const s1 = sinT(ph), c2 = 2 * sinT(ph + 0.25); let sp = 0, sc = s1, s = A[0] * s1;
    for (let k = 2; k <= K; k++) { const sn = c2 * sc - sp; sp = sc; sc = sn; s += A[k - 1] * sn; }
    x[j] += e * s;
  }
}
function noise(sr, sec, r) { const x = arr(sr, sec); for (let i = 0; i < x.length; i++) x[i] = r() * 2 - 1; return x; }
/** filtered, normalised, edge-faded noise segment */
function nseg(sr, sec, r, ...F) { const y = noise(sr, sec, r); for (const [type, f, q] of F) filt(y, sr, type, f, q); norm(y, 1); return fadeEdges(y, sr, 0.004, 0.06); }
function coef(type, f, Q, sr, db) {    // RBJ biquad
  const w0 = (TAU * clamp(f, 10, sr * 0.49)) / sr, cw = Math.cos(w0), al = Math.sin(w0) / (2 * Q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (type === 'bp') { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else { const A = Math.pow(10, db / 40); b0 = 1 + al * A; b1 = -2 * cw; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cw; a2 = 1 - al / A; }
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}
function filt(x, sr, type, f, Q = 0.707, db = 0) {
  const dyn = typeof f === 'function'; let c = dyn ? null : coef(type, f, Q, sr, db);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    if (dyn && (i & 31) === 0) c = coef(type, f(i / sr), Q, sr, db);
    const x0 = x[i], y0 = c[0] * x0 + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
    x2 = x1; x1 = x0; y2 = y1; y1 = y0; x[i] = y0;
  }
  return x;
}
function mixIn(x, y, sr, t0, gain = 1, envFn = null) {
  const n0 = Math.round(t0 * sr);
  for (let i = 0; i < y.length && n0 + i < x.length; i++) x[n0 + i] += y[i] * gain * (envFn ? envFn(i / sr) : 1);
}
function norm(x, peak) {
  let m = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > m) m = a; }
  if (m > 1e-9) { const k = peak / m; for (let i = 0; i < x.length; i++) x[i] *= k; }
  return x;
}
function normRms(x, target) {
  let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  const r = Math.sqrt(s / x.length); if (r > 1e-9) { const k = target / r; for (let i = 0; i < x.length; i++) x[i] *= k; }
  return x;
}
function fadeEdges(x, sr, fin = 0.002, fout = 0.02) {
  const a = Math.round(fin * sr), b = Math.round(fout * sr), n = x.length;
  for (let i = 0; i < a && i < n; i++) x[i] *= i / a;
  for (let i = 0; i < b && i < n; i++) x[n - 1 - i] *= i / b;
  return x;
}
/** pitch-dropping sine thud */
function thump(x, sr, t0, f1, f2, tau, amp) {
  const n0 = Math.round(t0 * sr), n = Math.min(x.length - n0, Math.round(tau * 7 * sr)), na = Math.round(0.0015 * sr); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / sr; ph += (f2 + (f1 - f2) * Math.exp(-t / (tau * 0.45))) / sr; x[n0 + i] += amp * Math.exp(-t / tau) * (i < na ? i / na : 1) * sinT(ph); }
}
/** filtered, normalised noise hit with exponential decay */
function burst(x, sr, r, t0, dur, type, f, Q, amp, tau, att = 0.0008) {
  const y = noise(sr, dur, r); filt(y, sr, type, f, Q); norm(y, 1);
  const na = Math.max(1, Math.round(att * sr));
  for (let i = 0; i < y.length; i++) y[i] *= Math.exp(-i / sr / tau) * (i < na ? i / na : 1);
  mixIn(x, y, sr, t0, amp);
}

// ---------------------------------------------------------------- noise beds (seamless loops) + reverb IR
function noiseLoop(sr, r, sec, kind) {
  const N = Math.round(sec * sr), X = Math.round(0.08 * sr), g = new Float32Array(N + X);
  if (kind === 'white') for (let i = 0; i < g.length; i++) g[i] = r() * 2 - 1;
  else if (kind === 'pink') {        // Paul Kellet's refined pink filter
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < g.length; i++) {
      const w = r() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      g[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    }
  } else { let y = 0; for (let i = 0; i < g.length; i++) { y = y * 0.9985 + (r() * 2 - 1) * 0.05; g[i] = y; } filt(g, sr, 'hp', 18, 0.7); }
  const b = new Float32Array(N);           // equal-power crossfade of the overhang into the start -> seamless loop
  for (let i = 0; i < N; i++) b[i] = g[i + X];
  for (let i = 0; i < X; i++) { const w = i / X, k = N - X + i; b[k] = g[k + X] * Math.sqrt(1 - w) + g[i] * Math.sqrt(w); }
  return normRms(b, kind === 'white' ? 0.3 : 0.25);
}
function makeIR(sr, r) {                   // glass-and-granite canyon: distinct facade slaps, then a dense dark tail (~1.8 s)
  const len = Math.round(2.2 * sr), pre = Math.round(0.012 * sr), L = new Float32Array(len), R = new Float32Array(len);
  for (const ch of [L, R]) {
    let y = 0;
    for (let i = pre; i < len; i++) {
      const t = (i - pre) / sr, a = 0.22 + 0.74 * Math.min(1, t / 1.5);          // one-pole low-pass closes over time (air + soft facades)
      y += (1 - a) * ((r() * 2 - 1) - y);
      ch[i] = y * Math.exp((-t * 6.9) / 1.7) * (1 + a) * 0.8;
    }
  }
  const taps = [[0.021, 0.5, 0.28], [0.034, 0.3, 0.55], [0.058, 0.42, 0.24], [0.083, 0.2, 0.4], [0.121, 0.34, 0.2], [0.17, 0.16, 0.26], [0.236, 0.2, 0.12], [0.31, 0.1, 0.14]];
  for (const [t, aL, aR] of taps) { L[Math.round(t * sr)] += aL * 8; R[Math.round((t + 0.0045) * sr)] += aR * 8; }
  fadeEdges(L, sr, 0, 0.06); fadeEdges(R, sr, 0, 0.06);
  return [L, R];
}
/** soft-clip transfer curve for a WaveShaper fed with x/4: linear to 0.75, smooth knee, never above 0.97 */
function clipCurve(n = 8192) {
  const c = new Float32Array(n), K = 0.75, H = 0.97 - K;
  for (let i = 0; i < n; i++) {
    const X = ((i / (n - 1)) * 2 - 1) * 4, a = Math.abs(X);
    c[i] = Math.sign(X) * (a <= K ? a : K + H * Math.tanh((a - K) / H));
  }
  return c;
}

// ---------------------------------------------------------------- sound effects
function sparrow(sr, r) {                  // chirp-chirp: 2–4 quick up-down chirps around 3–5.5 kHz
  const n = 2 + Math.floor(r() * 3), C = []; let t = 0.01;
  for (let c = 0; c < n; c++) {
    const dur = r.range(0.045, 0.085);
    C.push({ t, dur, fa: r.range(2700, 3500), fb: r.range(4300, 5500), fc: r.range(3200, 4300), up: r.range(0.25, 0.45), a: r.range(0.7, 1) });
    t += dur + (r() < 0.35 ? r.range(0.035, 0.07) : r.range(0.11, 0.2));
  }
  const x = arr(sr, t + 0.04);
  for (const c of C) addSwept(x, sr, c.t, c.dur, (u) => (u < c.up ? c.fa + (c.fb - c.fa) * sm(u / c.up) : c.fb + (c.fc - c.fb) * sm((u - c.up) / (1 - c.up))), (u) => c.a * Math.pow(Math.sin(Math.PI * u), 1.2), [1, 0.16, 0.05]);
  fadeEdges(x, sr, 0.001, 0.02); return norm(x, 0.8);
}
/** harmonic weights 1/n^p for n = 1..count, even harmonics scaled by `even` */
const harm = (count, p, even = 1) => Array.from({ length: count }, (_, k) => (1 / Math.pow(k + 1, p)) * ((k + 1) % 2 === 0 ? even : 1));

function tit(sr, r, v) {                   // great tit "tsi-tsi-tsü": a bright two-note phrase repeated 3–5 times, 3–5 kHz
  const reps = 3 + (v % 3), fh = r.range(4100, 4700), fl = r.range(3000, 3500), P = r.range(0.3, 0.36), x = arr(sr, reps * P + 0.14);
  for (let k = 0; k < reps; k++) {
    const t0 = 0.02 + k * P * r.range(0.97, 1.03);
    addSwept(x, sr, t0, 0.105, (u) => fh * (1.02 - 0.06 * u) + 60 * Math.sin(u * 9), (u) => Math.pow(Math.sin(Math.PI * u), 0.9) * 0.85, [1, 0.12, 0.04]);
    addSwept(x, sr, t0 + 0.135, 0.085, (u) => fl * (1.05 - 0.14 * u), (u) => Math.pow(Math.sin(Math.PI * u), 0.9) * 0.7, [1, 0.1]);
  }
  fadeEdges(x, sr, 0.001, 0.03); return norm(x, 0.8);
}
function pigeon(sr, r, v) {                // rock dove coo "kuk-KUUU-kuu": low and tonal (330–500 Hz), soft breathy edge
  const x = arr(sr, 1.15), f0 = r.range(330, 375) * (v ? 1.08 : 1);
  const note = (t0, dur, fa, fb, a) => addFormant(x, sr, t0, dur,
    (u, t) => (fa + (fb - fa) * sm(u)) * (1 + 0.012 * Math.sin(TAU * 5.5 * t)),
    (u) => a * sm(u / 0.12) * (1 - sm((u - 0.7) / 0.3)),
    (f) => Math.exp(-(((f - 520) / 240) ** 2)) + 0.25 * Math.exp(-(((f - 1150) / 300) ** 2)) + 0.01, 3000);
  note(0.02, 0.13, f0 * 1.15, f0 * 1.1, 0.55);
  note(0.2, 0.42, f0 * 1.1, f0 * 1.3, 1);
  note(0.68, 0.3, f0 * 1.25, f0 * 1.05, 0.8);
  const br = nseg(sr, 1.1, r, ['bp', 900, 0.7]); mixIn(x, br, sr, 0.05, 0.02);
  filt(x, sr, 'lp', 2400, 0.7); fadeEdges(x, sr, 0.004, 0.06); return norm(x, 0.7);
}
function crow(sr, r, v) {                  // carrion crow "кар-кар": hoarse, harmonic-rich caws around 360 Hz with a roughness AM
  const n = 2 + (v % 2), x = arr(sr, n * 0.46 + 0.4);
  for (let c = 0; c < n; c++) {
    const t0 = 0.03 + c * 0.44 * r.range(0.95, 1.08), dur = r.range(0.26, 0.34), fb = r.range(330, 400) * (c === n - 1 ? 0.93 : 1), p1 = r() * TAU;
    addFormant(x, sr, t0, dur,
      (u, t) => fb * (1 + 0.09 * Math.sin(Math.PI * Math.min(1, u * 1.3)) - 0.1 * u + 0.03 * Math.sin(TAU * 41 * t + p1)),
      (u, t) => sm(u / 0.05) * (1 - 0.35 * u) * (1 - sm((u - 0.8) / 0.2)) * (1 - 0.42 * (0.5 + 0.5 * Math.sin(TAU * 92 * t))),
      (f) => Math.exp(-(((f - 900) / 380) ** 2)) + 0.75 * Math.exp(-(((f - 1900) / 620) ** 2)) + 0.18 * Math.exp(-(((f - 3200) / 800) ** 2)) + 0.05, 6000);
  }
  const br = nseg(sr, x.length / sr, r, ['bp', 1700, 0.5]); mixIn(x, br, sr, 0, 0.035);
  filt(x, sr, 'lp', 3600, 0.7); fadeEdges(x, sr, 0.002, 0.05); return norm(x, 0.75);
}
function gull(sr, r, v) {                  // river gulls: long "kee-ah", laughing "ka-ka-ka-kaaa", double mew "kyow-kyow"
  let x;
  if (v === 0) {
    const D = 1.0, p1 = r() * TAU; x = arr(sr, D + 0.14);
    addFormant(x, sr, 0.03, D,
      (u, t) => { const c = u < 0.2 ? 1050 + 700 * sm(u / 0.2) : u < 0.55 ? 1750 + 60 * Math.sin(TAU * 6.5 * t) : 1750 - 900 * sm((u - 0.55) / 0.45); return c * (1 + 0.01 * Math.sin(TAU * 5.1 * t + p1)); },
      (u, t) => sm(u / 0.06) * (u < 0.6 ? 1 : 1 - 0.6 * sm((u - 0.6) / 0.4)) * (1 - sm((u - 0.92) / 0.08)) * (u > 0.55 ? 1 - 0.28 * (0.5 + 0.5 * Math.sin(TAU * 58 * t)) : 1),
      (f, u) => { const F = u < 0.55 ? 2600 + 700 * sm(u / 0.3) : 3300 - 1700 * sm((u - 0.55) / 0.45); return Math.exp(-(((f - F) / 1000) ** 2)) + 0.45 * Math.exp(-(((f - 1400) / 450) ** 2)) + 0.05; }, 8000);
  } else if (v === 1) {
    const n = 5; x = arr(sr, 1.15);
    for (let k = 0; k < n; k++) {
      const t0 = 0.03 + k * 0.155, dur = k === n - 1 ? 0.34 : 0.115, fa = 1650 - 70 * k, fb = fa - (k === n - 1 ? 650 : 330);
      addFormant(x, sr, t0, dur, (u) => fa + (fb - fa) * sm(u), (u) => sm(u / 0.1) * (1 - sm((u - 0.6) / 0.4)) * (0.9 - 0.06 * k),
        (f) => Math.exp(-(((f - 2100) / 900) ** 2)) + 0.4 * Math.exp(-(((f - 3800) / 900) ** 2)) + 0.05, 7000);
    }
  } else {
    x = arr(sr, 1.0);
    for (let k = 0; k < 2; k++) {
      addFormant(x, sr, 0.03 + k * 0.42, 0.34,
        (u, t) => (1150 + 350 * Math.sin(Math.PI * Math.min(1, u * 1.15)) - 200 * u) * (1 + 0.012 * Math.sin(TAU * 7 * t)),
        (u) => sm(u / 0.12) * (1 - sm((u - 0.65) / 0.35)) * (k ? 0.85 : 1),
        (f, u) => Math.exp(-(((f - (1900 + 800 * u)) / 700) ** 2)) + 0.35 * Math.exp(-(((f - 3600) / 900) ** 2)) + 0.05, 7000);
    }
  }
  const br = nseg(sr, x.length / sr, r, ['bp', 3000, 0.6]); mixIn(x, br, sr, 0, 0.03);
  filt(x, sr, 'hp', 450, 0.7); fadeEdges(x, sr, 0.002, 0.05); return norm(x, 0.75);
}
/** raven: a deep rolling "krruk-krruk": f0 150-190 Hz, strong roughness (68 Hz AM), nasal formants 700 / 1300 Hz. v = number of croaks (2 or 3) */
function raven(sr, r, v) {
  const n = 2 + (v % 2), x = arr(sr, n * 0.55 + 0.45);
  for (let c = 0; c < n; c++) {
    const t0 = 0.04 + c * 0.52 * r.range(0.95, 1.08), dur = r.range(0.34, 0.44), fb = r.range(150, 190) * (c === n - 1 ? 0.9 : 1), p1 = r() * TAU;
    addFormant(x, sr, t0, dur,
      (u, t) => fb * (1 + 0.12 * Math.sin(Math.PI * Math.min(1, u * 1.2)) - 0.18 * u + 0.04 * Math.sin(TAU * 37 * t + p1)),
      (u, t) => sm(u / 0.06) * (1 - 0.3 * u) * (1 - sm((u - 0.78) / 0.22)) * (1 - 0.5 * (0.5 + 0.5 * Math.sin(TAU * 68 * t))),
      (f) => Math.exp(-(((f - 700) / 300) ** 2)) + 0.8 * Math.exp(-(((f - 1300) / 500) ** 2)) + 0.25 * Math.exp(-(((f - 2400) / 700) ** 2)) + 0.04, 5000);
  }
  const br = nseg(sr, x.length / sr, r, ['bp', 1100, 0.5]); mixIn(x, br, sr, 0, 0.05);
  filt(x, sr, 'lp', 3000, 0.7); fadeEdges(x, sr, 0.002, 0.06); return norm(x, 0.78);
}
function magpie(sr, r, v) {                // magpie rattle "chak-chak-chak-chak-chak": 5-8 harsh pulses at ~10 Hz around 1.5-3 kHz
  const n = 5 + (v % 4), P = r.range(0.085, 0.105), x = arr(sr, n * P + 0.14), f0 = r.range(540, 640);
  for (let k = 0; k < n; k++) {
    const t0 = 0.02 + k * P * r.range(0.94, 1.06), fk = f0 * (1 - 0.1 * k / n);
    addFormant(x, sr, t0, 0.06, (u) => fk * (1.1 - 0.25 * u), (u) => sm(u / 0.1) * (1 - sm((u - 0.4) / 0.6)) * (1 - 0.5 * (0.5 + 0.5 * Math.sin(TAU * 230 * u * 0.06))),
      (f) => Math.exp(-(((f - 2000) / 700) ** 2)) + 0.6 * Math.exp(-(((f - 3200) / 800) ** 2)) + 0.1 * Math.exp(-(((f - 900) / 400) ** 2)) + 0.03, 6000);
    burst(x, sr, r, t0, 0.035, 'bp', 2400, 0.7, 0.25, 0.012);
  }
  filt(x, sr, 'hp', 500, 0.7); fadeEdges(x, sr, 0.002, 0.05); return norm(x, 0.75);
}
function wingClap(sr, r, v) {              // a pigeon take-off: 8-10 wing claps, quickening and fading, over a dry flutter
  const n = 8 + (v % 3), x = arr(sr, 1.4); let t = 0.02, gap = 0.11;
  for (let k = 0; k < n; k++) {
    const a = 1 - 0.07 * k;
    burst(x, sr, r, t, 0.05, 'bp', r.range(700, 1100), 0.8, 0.8 * a, 0.012, 0.0008); thump(x, sr, t, 220, 110, 0.015, 0.3 * a);
    t += gap; gap = Math.max(0.055, gap * 0.93);
  }
  const fl = nseg(sr, 1.2, r, ['bp', 2200, 0.5]); mixIn(x, fl, sr, 0, 0.08, (tt) => sm(tt / 0.1) * Math.exp(-tt / 0.45));
  fadeEdges(x, sr, 0.001, 0.15); return norm(x, 0.8);
}
function dogBark(sr, r, v) {               // a medium dog's "wuf": 0.16 s of voiced harmonics falling from f0 * 1.15 to f0 * 0.7 with vowel formants + breath. v: 0 / 2 single, 1 double
  const f0 = [420, 330, 260][v % 3] * r.range(0.95, 1.05), reps = v % 3 === 1 ? 2 : 1, x = arr(sr, reps * 0.28 + 0.25);
  for (let k = 0; k < reps; k++) {
    const t0 = 0.03 + k * 0.26;
    addFormant(x, sr, t0, 0.16, (u) => f0 * (1.15 - 0.45 * u), (u) => sm(u / 0.08) * (1 - sm((u - 0.45) / 0.55)),
      (f) => Math.exp(-(((f - 650) / 300) ** 2)) + 0.6 * Math.exp(-(((f - 1500) / 500) ** 2)) + 0.2 * Math.exp(-(((f - 2800) / 800) ** 2)) + 0.03, 4500);
    burst(x, sr, r, t0, 0.07, 'bp', 1800, 0.6, 0.18, 0.02);
  }
  filt(x, sr, 'lp', 4200, 0.7); filt(x, sr, 'hp', 150, 0.7); fadeEdges(x, sr, 0.002, 0.05); return norm(x, 0.8);
}
function swiftCall(sr, r) {                // a swift's shrill "sriiiii": 5-7 kHz trill with a 26 Hz flutter, ~0.9 s
  const D = 0.9, x = arr(sr, D + 0.1);
  addSwept(x, sr, 0.03, D, (u) => 5200 + 1500 * Math.sin(Math.PI * u), (u, t) => Math.pow(Math.sin(Math.PI * u), 0.8) * (0.6 + 0.4 * Math.sin(TAU * 26 * t)), [1, 0.12]);
  fadeEdges(x, sr, 0.005, 0.1); return norm(x, 0.6);
}
function wagtailCall(sr, r) {              // white wagtail "tsi-lik": two quick chirps
  const x = arr(sr, 0.4), f = r.range(3500, 3900);
  addSwept(x, sr, 0.02, 0.09, (u) => f + 900 * u, (u) => Math.sin(Math.PI * u), [1, 0.1]);
  addSwept(x, sr, 0.15, 0.08, (u) => f + 700 - 1300 * u, (u) => 0.85 * Math.sin(Math.PI * u), [1, 0.1]);
  fadeEdges(x, sr, 0.002, 0.03); return norm(x, 0.7);
}
function busBrake(sr, r) {                 // a city bus stopping: a short squeal, then the air release
  const x = arr(sr, 2.2);
  addSwept(x, sr, 0, 0.55, (u) => 3000 - 350 * u, (u) => 0.14 * Math.sin(Math.PI * u) * (0.8 + 0.2 * Math.sin(TAU * 7 * u)), [1, 0.15]);
  const hiss = nseg(sr, 1.6, r, ['hp', 1800, 0.7], ['bp', 4200, 0.5]);
  mixIn(x, hiss, sr, 0.55, 0.55, (t) => (t < 0.03 ? t / 0.03 : Math.exp(-t / 0.5)));
  thump(x, sr, 0.5, 75, 45, 0.1, 0.5);
  fadeEdges(x, sr, 0.002, 0.15); return norm(x, 0.8);
}
function carDoor(sr, r) {                  // a car door shut: a dull thump, a body ring, the latch click
  const x = arr(sr, 0.5);
  thump(x, sr, 0, 150, 70, 0.06, 0.9); addDamped(x, sr, 0, 340, 0.25, 0.05, 0.001); addDamped(x, sr, 0, 620, 0.12, 0.03, 0.001);
  burst(x, sr, r, 0, 0.05, 'lp', 900, 0.7, 0.35, 0.01); burst(x, sr, r, 0.045, 0.02, 'hp', 2800, 0.7, 0.2, 0.004);
  fadeEdges(x, sr, 0.001, 0.08); return norm(x, 0.85);
}
function footstep(sr, r, surf) {           // one footfall on granite pavers / asphalt / sand and gravel / dry grass
  const x = arr(sr, surf === 'sand' ? 0.24 : 0.17);
  if (surf === 'asphalt') { thump(x, sr, 0, 140, 70, 0.035, 0.8); burst(x, sr, r, 0, 0.05, 'bp', 1200, 0.8, 0.4, 0.012); }
  else if (surf === 'sand') {
    thump(x, sr, 0, 120, 70, 0.03, 0.4);
    for (let k = 0; k < 7; k++) burst(x, sr, r, 0.004 + k * r.range(0.008, 0.02), 0.06, 'bp', r.range(1500, 3600), 0.7, 0.3 + 0.1 * r(), 0.016);
  } else if (surf === 'grass') { burst(x, sr, r, 0, 0.15, 'bp', 2400, 0.4, 0.3, 0.05, 0.012); thump(x, sr, 0, 100, 60, 0.04, 0.3); }
  else { thump(x, sr, 0, 160, 80, 0.03, 0.7); burst(x, sr, r, 0, 0.05, 'bp', 1800, 0.9, 0.5, 0.008); addDamped(x, sr, 0, 780, 0.12, 0.02, 0.0008); }
  fadeEdges(x, sr, 0.001, 0.05); return norm(x, 0.8);
}
function carHorn(sr, r, v) {               // two tuned diaphragm horns (~418 / 523 Hz): buzzy odd-heavy harmonics; short, long, double
  const seq = v === 0 ? [[0, 0.22]] : v === 1 ? [[0, 0.8]] : [[0, 0.15], [0.23, 0.17]], last = seq[seq.length - 1], x = arr(sr, last[0] + last[1] + 0.25), hw = harm(10, 0.85, 0.6);
  for (const [t0, dur] of seq) for (const [f, a, dt] of [[418, 1, 0], [523, 0.9, 0.004]])
    addSwept(x, sr, t0 + dt, dur + 0.05, (u, t) => f * (1 + 0.006 * Math.sin(TAU * 13 * t)), (u, t) => a * sm(t / 0.008) * (1 - sm((t - dur) / 0.05)), hw);
  burst(x, sr, r, 0, 0.02, 'bp', 1500, 0.8, 0.15, 0.005);
  filt(x, sr, 'lp', 3400, 0.7); fadeEdges(x, sr, 0, 0.05); return norm(x, 0.8);
}
/** stereo pass-by of a road vehicle at lateral offset D, computed from the physics: 1/distance level, Doppler on the engine
 *  phase, air-absorption low-pass, equal-power pan from the azimuth. dir +1 = left -> right. */
const CARS = [
  { v: 11, D: 9, T: 4.8, f0: 66, dir: 1, kind: 'car' },      // Lada / Kia / Hyundai 4-cylinder in the Nevsky traffic, ~2000 rpm
  { v: 16, D: 12, T: 3.9, f0: 82, dir: -1, kind: 'car' },
  { v: 9, D: 10, T: 5.8, f0: 96, dir: 1, kind: 'cng' },      // trolleybus (ZiU / Trolza): a smooth, quiet electric whine, no engine knock
  { v: 12, D: 8, T: 4.0, f0: 44, dir: -1, kind: 'van' },     // delivery van: a rattling diesel
];
function carPass(sr, r, k) {
  const c = CARS[k % CARS.length], n = Math.round(c.T * sr), mono = new Float32Array(n), pan = new Float32Array(n);
  const rum = nseg(sr, c.T, r, ['lp', 260, 0.6]), roar = nseg(sr, c.T, r, ['bp', 1500, 0.55]), hiss = nseg(sr, c.T, r, ['hp', 3500, 0.6]);
  const W = c.kind === 'cng' ? 18 : c.kind === 'van' ? 16 : 9, wt = [];
  for (let h = 1; h <= W; h++) wt.push(c.kind === 'cng' ? 1 / Math.pow(h, 0.95) : c.kind === 'van' ? (1 / Math.pow(h, 0.75)) * (h % 2 ? 1 : 1.15) : (1 / Math.pow(h, 1.0)) * (h === 2 ? 1.5 : 1));
  const roll = (c.v / 15) ** 2; let ph = r();
  for (let i = 0; i < n; i++) {
    const t = i / sr, x = c.dir * c.v * (t - c.T / 2), d = Math.max(3, Math.hypot(x, c.D));
    const vr = (c.dir * c.v * x) / d;                         // d(distance)/dt (+ = receding)
    const dop = 343 / (343 + vr), g = Math.min(2.2, 8 / d);
    ph += (c.f0 * (1 + 0.07 * (t / c.T) + 0.02 * Math.sin(TAU * 0.9 * t)) * dop) / sr;
    let s = 0; for (let h = 1; h <= W; h++) s += wt[h - 1] * sinT(ph * h);
    if (c.kind === 'van') s *= 0.75 + 0.25 * sinT(ph * 0.5 + 0.1);   // diesel knock: every other firing is heavier
    mono[i] = g * (0.34 * s + 0.55 * rum[i] * (c.kind === 'van' ? 1.3 : c.kind === 'cng' ? 1.1 : 1) + 0.16 * roll * roar[i] + 0.05 * roll * hiss[i]);
    pan[i] = clamp(x / d, -1, 1);
  }
  filt(mono, sr, 'lp', (tt) => { const x = c.dir * c.v * (tt - c.T / 2), d = Math.max(3, Math.hypot(x, c.D)); return clamp(15000 / (1 + d / 22), 2600, 15000); }, 0.6);
  const L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = ((pan[i] + 1) * Math.PI) / 4; L[i] = mono[i] * Math.cos(p); R[i] = mono[i] * Math.sin(p); }
  let m = 0; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(L[i]), Math.abs(R[i]));
  const k2 = m > 1e-9 ? 0.9 / m : 1; for (let i = 0; i < n; i++) { L[i] *= k2; R[i] *= k2; }
  fadeEdges(L, sr, 0.5, 0.6); fadeEdges(R, sr, 0.5, 0.6);
  return [L, R];
}
function plip(sr, r) {                     // a water droplet: rising pure chirp with a tiny click
  const f = r.range(620, 1500), x = arr(sr, 0.18);
  addSwept(x, sr, 0.004, 0.14, (u) => f * (1 + 1.5 * Math.pow(u, 0.55)), (u) => sm(u / 0.05) * Math.exp(-u * 6.5), [1, 0.05]);
  burst(x, sr, r, 0, 0.012, 'hp', 2600, 0.7, 0.04, 0.002);
  fadeEdges(x, sr, 0, 0.04); return norm(x, 0.6);
}
function lap(sr, r, k) {                   // a small wave slapping the granite wall: soft low thud + a wet wash with a few bubbles
  const D = 0.55 + 0.1 * k, x = arr(sr, D);
  const wash = nseg(sr, D, r, ['bp', 620 + 240 * k, 0.6], ['lp', 2000, 0.6]);
  mixIn(x, wash, sr, 0, 1, (t) => sm(t / 0.05) * Math.exp(-t / (0.14 + 0.04 * k)));
  thump(x, sr, 0.008, 170 - 20 * k, 80, 0.07, 0.35);
  for (let j = 0; j < 3; j++) burst(x, sr, r, 0.05 + j * r.range(0.05, 0.12), 0.05, 'bp', r.range(900, 2200), 1.2, 0.12, 0.012);
  fadeEdges(x, sr, 0.001, 0.08); return norm(x, 0.8);
}
function doorOpen(sr, r) {                 // air hiss + slide + soft stop
  const x = arr(sr, 1.6);
  const air = nseg(sr, 0.9, r, ['hp', 1400, 0.7], ['bp', 3800, 0.7]);
  mixIn(x, air, sr, 0, 0.6, (t) => (t < 0.015 ? t / 0.015 : t < 0.12 ? 1 : Math.exp(-(t - 0.12) / 0.2)));
  const sl = nseg(sr, 1.0, r, ['bp', 700, 0.8], ['lp', 1600, 0.7]);
  mixIn(x, sl, sr, 0.1, 0.16, (t) => Math.pow(Math.sin(Math.PI * clamp01(t / 0.95)), 0.7));
  const rb = nseg(sr, 1.0, r, ['lp', 260, 0.7], ['hp', 60, 0.7]);
  mixIn(x, rb, sr, 0.1, 0.1, (t) => Math.pow(Math.sin(Math.PI * clamp01(t / 0.95)), 0.7));
  addSwept(x, sr, 0.1, 0.95, (u) => 140 + 25 * u, (u) => 0.05 * Math.sin(Math.PI * u), [1, 0.3, 0.1]);
  thump(x, sr, 1.06, 120, 65, 0.05, 0.45); addDamped(x, sr, 1.06, 310, 0.15, 0.03, 0.001);
  burst(x, sr, r, 1.06, 0.03, 'lp', 2000, 0.7, 0.12, 0.006);
  fadeEdges(x, sr, 0.001, 0.05); return norm(x, 0.85);
}
function doorClose(sr, r) {                // air hiss + slide + thud + small hiss
  const x = arr(sr, 1.9);
  const air = nseg(sr, 1.2, r, ['hp', 1200, 0.7], ['bp', 3200, 0.6]);
  mixIn(x, air, sr, 0, 0.55, (t) => (t < 0.02 ? t / 0.02 : t < 0.22 ? 1 : Math.exp(-(t - 0.22) / 0.17)));
  const sl = nseg(sr, 1.05, r, ['bp', 650, 0.8], ['lp', 1500, 0.7]);
  mixIn(x, sl, sr, 0.12, 0.17, (t) => sm(t / 0.2) * (0.6 + 0.4 * t) * (1 - sm((t - 0.95) / 0.07)));
  const rb = nseg(sr, 1.05, r, ['lp', 240, 0.7], ['hp', 60, 0.7]);
  mixIn(x, rb, sr, 0.12, 0.1, (t) => sm(t / 0.2) * (1 - sm((t - 0.95) / 0.07)));
  addSwept(x, sr, 0.12, 1.0, (u) => 130 + 30 * u, (u) => 0.05 * Math.sin(Math.PI * u), [1, 0.3, 0.1]);
  const T = 1.14;
  thump(x, sr, T, 100, 55, 0.08, 0.8); addDamped(x, sr, T, 230, 0.25, 0.05, 0.001); addDamped(x, sr, T, 520, 0.1, 0.02, 0.0008);
  burst(x, sr, r, T, 0.04, 'lp', 2400, 0.7, 0.25, 0.008);
  thump(x, sr, T + 0.07, 90, 55, 0.04, 0.2);
  const s2 = nseg(sr, 0.4, r, ['bp', 3500, 0.8]);
  mixIn(x, s2, sr, T + 0.18, 0.3, (t) => (t < 0.01 ? t / 0.01 : Math.exp(-(t - 0.01) / 0.08)));
  fadeEdges(x, sr, 0.001, 0.05); return norm(x, 0.9);
}
function airRelease(sr, r) {               // end of braking: bogie clunk + long air hiss
  const x = arr(sr, 2.6);
  thump(x, sr, 0, 75, 45, 0.1, 0.6); addDamped(x, sr, 0, 180, 0.2, 0.06, 0.002); addDamped(x, sr, 0, 920, 0.06, 0.04, 0.001);
  const air = nseg(sr, 2.2, r, ['hp', 1800, 0.7], ['bp', 4200, 0.5]);
  mixIn(x, air, sr, 0.35, 0.6, (t) => (t < 0.03 ? t / 0.03 : t < 0.35 ? 1 : Math.exp(-(t - 0.35) / 0.5)) * (1 - 0.1 * Math.sin(TAU * 23 * t)));
  fadeEdges(x, sr, 0.001, 0.08); return norm(x, 0.85);
}
function bikeBell(sr, r) {                 // ring-ring: rotary striker on a small dome
  const x = arr(sr, 1.5), f0 = 2250, P = [[1, 1, 0.5], [1.0035, 0.6, 0.5], [2.21, 0.35, 0.26], [3.58, 0.18, 0.14]];
  const hits = [[0, 0.9], [0.038, 0.55], [0.075, 0.7], [0.112, 0.45], [0.46, 0.85], [0.497, 0.5], [0.534, 0.65], [0.571, 0.4]];
  for (const [t, a] of hits) { for (const [m, pa, tau] of P) addDamped(x, sr, t, f0 * m, a * pa, tau, 0.0004, 0); burst(x, sr, r, t, 0.006, 'hp', 3000, 0.7, 0.15 * a, 0.0012); }
  fadeEdges(x, sr, 0, 0.08); return norm(x, 0.8);
}
function quack(sr, r, v) {                 // mallard hen "quaak-quak-quak": nasal, ~400 -> 280 Hz, 3-5 falling quacks of ~0.2 s
  const n = 3 + (v % 3), x = arr(sr, n * 0.24 + 0.3);
  for (let c = 0; c < n; c++) {
    const t0 = 0.03 + c * 0.235 * r.range(0.95, 1.06), dur = 0.2 - 0.015 * c, f0 = r.range(360, 420) * (1 - 0.07 * c), a = 1 - 0.1 * c;
    addFormant(x, sr, t0, dur, (u) => f0 * (1.08 - 0.3 * u), (u, t) => a * sm(u / 0.06) * (1 - sm((u - 0.5) / 0.5)) * (1 - 0.25 * (0.5 + 0.5 * Math.sin(TAU * 85 * t))),
      (f) => Math.exp(-(((f - 1050) / 380) ** 2)) + 0.7 * Math.exp(-(((f - 2000) / 600) ** 2)) + 0.25 * Math.exp(-(((f - 3300) / 800) ** 2)) + 0.04, 5000);
  }
  const br = nseg(sr, x.length / sr, r, ['bp', 1800, 0.5]); mixIn(x, br, sr, 0, 0.03);
  filt(x, sr, 'lp', 3800, 0.7); filt(x, sr, 'hp', 250, 0.7); fadeEdges(x, sr, 0.002, 0.05); return norm(x, 0.75);
}
function cupClink(sr, r, v) {              // a cup on a saucer / a spoon: one to three tiny damped porcelain rings (2.3-3.1 kHz fundamental), soft
  const x = arr(sr, 0.5), f0 = r.range(2300, 3100), hits = v % 3 === 0 ? [[0.01, 1]] : v % 3 === 1 ? [[0.01, 1], [0.09, 0.55]] : [[0.01, 0.8], [0.07, 1], [0.15, 0.4]];
  for (const [t, a] of hits) {
    for (const [m, pa, tau] of [[1, 1, 0.07], [1.52, 0.6, 0.045], [2.31, 0.35, 0.03], [3.4, 0.15, 0.02]]) addDamped(x, sr, t, f0 * m, a * pa * 0.5, tau, 0.0004);
    burst(x, sr, r, t, 0.006, 'hp', 3500, 0.7, 0.1 * a, 0.0015);
  }
  fadeEdges(x, sr, 0, 0.1); return norm(x, 0.7);
}
function softChime(sr, r, v) {             // a calm two-note hall chime (not an alarm): E5 -> C5 or D5 -> A4, bell-like sine partials, ~1.8 s
  const x = arr(sr, 2.2), notes = v % 2 ? [[587.3, 0], [440, 0.55]] : [[659.3, 0], [523.3, 0.55]];
  for (const [f, t] of notes) for (const [m, pa, tau] of [[1, 1, 0.55], [2, 0.3, 0.3], [3.01, 0.12, 0.18], [4.2, 0.05, 0.1]]) addDamped(x, sr, t, f * m, pa * 0.4, tau, 0.012);
  filt(x, sr, 'lp', 5200, 0.7); fadeEdges(x, sr, 0.002, 0.3); return norm(x, 0.7);
}

function synthKey(key, sr) {
  const r = prng(hashStr(key)); let m;
  if ((m = /^sp(\d)$/.exec(key))) return sparrow(sr, r);
  if ((m = /^tit(\d)$/.exec(key))) return tit(sr, r, +m[1]);
  if ((m = /^coo(\d)$/.exec(key))) return pigeon(sr, r, +m[1] % 2);
  if ((m = /^crow(\d)$/.exec(key))) return crow(sr, r, +m[1]);
  if ((m = /^raven(\d)$/.exec(key))) return raven(sr, r, +m[1]);
  if ((m = /^mag(\d)$/.exec(key))) return magpie(sr, r, +m[1]);
  if ((m = /^wing(\d)$/.exec(key))) return wingClap(sr, r, +m[1]);
  if ((m = /^dog(\d)$/.exec(key))) return dogBark(sr, r, +m[1]);
  if ((m = /^stp_(\w+)_(\d)$/.exec(key))) return footstep(sr, r, m[1]);
  if ((m = /^gull(\d)$/.exec(key))) return gull(sr, r, +m[1] % 3);
  if ((m = /^horn(\d)$/.exec(key))) return carHorn(sr, r, +m[1] % 3);
  if ((m = /^car(\d)$/.exec(key))) return carPass(sr, r, +m[1]);
  if ((m = /^plip(\d)$/.exec(key))) return plip(sr, r);
  if ((m = /^lap(\d)$/.exec(key))) return lap(sr, r, +m[1] % 3);
  if ((m = /^quack(\d)$/.exec(key))) return quack(sr, r, +m[1]);
  if ((m = /^cup(\d)$/.exec(key))) return cupClink(sr, r, +m[1]);
  if ((m = /^chime(\d)$/.exec(key))) return softChime(sr, r, +m[1]);
  switch (key) {
    case 'white': return noiseLoop(sr, r, 3, 'white');
    case 'pink': return noiseLoop(sr, r, 5, 'pink');
    case 'brown': return noiseLoop(sr, r, 5, 'brown');
    case 'ir': return makeIR(sr, r);
    case 'doorOpen': return doorOpen(sr, r);
    case 'doorClose': return doorClose(sr, r);
    case 'airRel': return airRelease(sr, r);
    case 'bike': return bikeBell(sr, r);
    case 'swc': return swiftCall(sr, r);
    case 'wag': return wagtailCall(sr, r);
    case 'bbrake': return busBrake(sr, r);
    case 'cdoor': return carDoor(sr, r);
    default: throw new Error('audio: unknown buffer ' + key);
  }
}

// =====================================================================================================
export function createAudio(options = {}) {
  const O = Object.assign({ context: null, ambience: true, speech: true, master: 0.85, muted: false, seed: 0x5a4b17, hrtf: true }, options && typeof options === 'object' ? options : {});
  const R = prng(Number(O.seed) >>> 0);
  R.pick = (a) => a[Math.floor(R() * a.length)];
  let ac = null, N = null, SR = 48000, offline = false, failed = false, lastCtl = -1, hooked = false;
  let masterVol = clamp(Number(O.master) || 0, 0, 2), muted = !!O.muted, srcLive = 0, hrtfLive = 0, suspendTimer = null, meterBuf = null;
  const LS = { x: 0, y: 1.6, z: 0, fx: 0, fy: 0, fz: -1, ux: 0, uy: 1, uz: 0 }, LA_ = { x: NaN };
  const handles = new Set(), voices = [], disposals = [], cache = new Map(), warm = [], warned = new Set();
  const CAP = { sfx: 16, bird: 5, amb: 4 };
  const HRTF_VOICES = 8;                                   // one-shots using HRTF at once (the rest: equal-power)
  const BIRD_LEVEL = 0.0625;                             // all bird layers: 1/8 of the previous half-volume mix, including wings and reverb
  const SILENT = new Set(['clank', 'footstep', 'footsteps', 'step', 'crossingBell', 'cafeMusic', 'catMeow', 'sparrow', 'vendingDrop', 'departMelody', 'town', 'trainRun', 'trainBrake', 'doorChime', 'announce', 'boatHorn']); // removed on purpose: accepted and ignored

  const warnOnce = (k, ...a) => { if (warned.has(k)) return; warned.add(k); try { console.warn('[audio]', ...a); } catch (e) { /* */ } };
  const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

  // ------------------------------------------------------------ node helpers
  const G = (v = 1) => { const g = ac.createGain(); g.gain.value = v; return g; };
  const BQ = (type, f, q = 0.707, db = 0) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; if (db) b.gain.value = db; return b; };
  const OSC = (type, f) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; return o; };
  function NOISE(kind, t) { const s = ac.createBufferSource(); s.buffer = buf(kind); s.loop = true; s.start(Math.max(ac.currentTime, t === undefined ? 0 : t), R() * s.buffer.duration * 0.9); return s; }
  /** smooth control-rate parameter tracking (skips negligible changes) */
  function set(param, v, tc, now) {
    if (!Number.isFinite(v)) return;
    if (param._lv !== undefined && Math.abs(param._lv - v) <= Math.abs(v) * 0.002 + 1e-6) return;
    param._lv = v; param.setTargetAtTime(v, now, tc);
  }
  /** interrupting exponential approach from the current value (volume changes) */
  function glide(param, v, tc, t = ac.currentTime) {
    try {
      if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(t);
      else { const cur = param.value; param.cancelScheduledValues(t); param.setValueAtTime(cur, t); }
      param.setTargetAtTime(v, t, Math.max(0.003, tc));
    } catch (e) { try { param.value = v; } catch (e2) { /* */ } }
    param._lv = v;
  }
  /** linear ramp from the current value that reaches v exactly (mute / stop) */
  function ramp(param, v, dur, t = ac.currentTime) {
    try {
      if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(t);
      else { const cur = param.value; param.cancelScheduledValues(t); param.setValueAtTime(cur, t); }
      param.linearRampToValueAtTime(v, t + Math.max(0.005, dur));
    } catch (e) { try { param.value = v; } catch (e2) { /* */ } }
    param._lv = v;
  }
  function buf(key) {
    let b = cache.get(key); if (b) return b;
    const data = synthKey(key, SR), ch = Array.isArray(data) ? data : [data];
    b = ac.createBuffer(ch.length, ch[0].length, SR);
    ch.forEach((d, i) => b.getChannelData(i).set(d));
    cache.set(key, b); return b;
  }
  function setPP(p, v) {
    if (p.positionX) { p.positionX.value = v.x; p.positionY.value = v.y; p.positionZ.value = v.z; } else p.setPosition(v.x, v.y, v.z);
  }
  function PAN(ref, roll, pos, hq) {
    const p = ac.createPanner();
    p.panningModel = hq && O.hrtf ? 'HRTF' : 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = ref; p.rolloffFactor = roll; p.maxDistance = 10000;
    p.coneInnerAngle = 360; p.coneOuterAngle = 360;
    if (pos) setPP(p, pos);
    return p;
  }
  function resolvePos(p) {
    try { if (typeof p === 'function') p = p(); } catch (e) { return null; }
    if (!p || typeof p !== 'object') return null;
    if (Array.isArray(p)) { const v = { x: +p[0], y: +p[1], z: +p[2] }; return Number.isFinite(v.x) && Number.isFinite(v.z) ? { x: v.x, y: Number.isFinite(v.y) ? v.y : 1.5, z: v.z } : null; }
    if (Number.isFinite(p.x) && Number.isFinite(p.z)) return Number.isFinite(p.y) ? p : { x: p.x, y: 1.5, z: p.z };
    return null;
  }
  const distTo = (p) => Math.hypot(p.x - LS.x, p.y - LS.y, p.z - LS.z);
  const airCut = (d) => clamp(19000 / Math.pow(1 + d / 40, 1.05), 1200, 20000);    // air absorption
  const farFade = (d, range) => sm((range - d) / (range * 0.6));                     // last 60 % of the range
  /** a scheduled buffer source that cleans itself up (loop sub-events: bell strikes, clicks, notes) */
  function playSrc(key, dest, t, gain = 1, rate = 1, cap = 96) {
    if (srcLive >= cap) return null;
    const s = ac.createBufferSource(); s.buffer = buf(key); s.playbackRate.value = rate;
    let g = null;
    if (gain !== 1) { g = G(gain); s.connect(g); g.connect(dest); } else s.connect(dest);
    srcLive++;
    s.onended = () => { srcLive = Math.max(0, srcLive - 1); try { s.disconnect(); if (g) g.disconnect(); } catch (e) { /* */ } };
    s.start(Math.max(t, ac.currentTime));
    return s;
  }

  // ------------------------------------------------------------ one-shot voices
  function voice(kind, { pos = null, dist = 0, gain = 1, ref = 3, roll = 1, wet = null, pa = false, bus = null, pan = 0, hq = false } = {}) {
    let n = 0, oldest = null;
    for (const v of voices) if (v.kind === kind && !v.dying) { n++; if (!oldest) oldest = v; }
    const now = ac.currentTime;
    if (n >= (CAP[kind] || 16)) {             // full: steal the oldest voice, but drop the newcomers of a burst (no churn)
      if (!oldest || now - oldest.born < 0.08) return null;
      killVoice(oldest);
    }
    const v = { kind, born: now, nodes: [], srcs: [], end: now + 0.25, tick: null, dying: false, panner: null, hrtf: false };
    const vg = G(gain); v.nodes.push(vg); v.out = vg; v.in = vg;
    let head = vg;
    if (pos) {
      if (dist > 22) { const lp = BQ('lowpass', airCut(dist), 0.5); head.connect(lp); head = lp; v.nodes.push(lp); }
      v.hrtf = !!(hq && O.hrtf && dist < 40 && hrtfLive < HRTF_VOICES); if (v.hrtf) hrtfLive++;
      const p = PAN(ref, roll, pos, v.hrtf); head.connect(p); p.connect(bus || N.sfx); if (wet) p.connect(wet);
      v.nodes.push(p); v.panner = p;
    } else if (pan && ac.createStereoPanner) {
      const sp = ac.createStereoPanner(); sp.pan.value = clamp(pan, -1, 1); head.connect(sp); sp.connect(bus || N.sfx); v.nodes.push(sp);
    } else head.connect(bus || N.sfx);
    if (pa) {   // platform PA speakers: band-limited, a little presence, a second speaker's slap
      const i = G(1), hp = BQ('highpass', 300, 0.6), hp2 = BQ('highpass', 300, 0.9), pk = BQ('peaking', 2600, 0.9, 3), lp = BQ('lowpass', 7200, 0.7), dl = ac.createDelay(0.2), dg = G(0.22);
      dl.delayTime.value = 0.052;
      i.connect(hp); hp.connect(hp2); hp2.connect(pk); pk.connect(lp); lp.connect(vg); i.connect(dl); dl.connect(dg); dg.connect(hp);
      v.nodes.push(i, hp, hp2, pk, lp, dl, dg); v.in = i;
    }
    voices.push(v);
    return v;
  }
  function vSrc(v, key, t, gain = 1, rate = 1, dest = v.in) {
    const b = buf(key), s = ac.createBufferSource(); s.buffer = b; s.playbackRate.value = rate;
    if (gain !== 1) { const g = G(gain); s.connect(g); g.connect(dest); v.nodes.push(g); } else s.connect(dest);
    s.start(Math.max(t, ac.currentTime)); v.srcs.push(s);
    v.end = Math.max(v.end, t + b.duration / rate + 0.08);
    return s;
  }
  function killVoice(v) {
    if (!ac || v.dying) return;
    v.dying = true; const now = ac.currentTime;
    glide(v.out.gain, 0, 0.02, now);
    for (const s of v.srcs) { try { s.stop(now + 0.12); } catch (e) { /* */ } }
    v.tick = null; v.end = Math.min(v.end, now + 0.16);
  }
  function disposeVoice(v) {
    for (const s of v.srcs) { try { s.stop(); } catch (e) { /* */ } try { s.disconnect(); } catch (e) { /* */ } }
    for (const n of v.nodes) { try { n.disconnect(); } catch (e) { /* */ } }
    if (v.hrtf) { hrtfLive = Math.max(0, hrtfLive - 1); v.hrtf = false; }
    v.srcs.length = 0; v.nodes.length = 0; v.tick = null;
  }

  // ------------------------------------------------------------ one-shot definitions
  // gain: level at refDistance (inverse distance model beyond it); range: not started beyond this distance
  const SFX = {
    doorOpen: { ref: 4, range: 90, gain: 0.55, wet: 'lo', buf: ['doorOpen'], jitter: 0.02 },
    doorClose: { ref: 4, range: 90, gain: 0.6, wet: 'lo', buf: ['doorClose'], jitter: 0.02 },
    bikeBell: { ref: 3, range: 80, gain: 0.5, wet: 'lo', buf: ['bike'], jitter: 0.03 },
    gull: { ref: 10, range: 380, gain: 0.4 * BIRD_LEVEL, wet: 'hi', buf: ['gull0', 'gull1', 'gull2'], jitter: 0.07 },
    duck: { ref: 8, range: 160, gain: 0.42 * BIRD_LEVEL, wet: 'hi', buf: ['quack0', 'quack1', 'quack2'], jitter: 0.07 },
    carHorn: { ref: 12, range: 320, gain: 0.42, wet: 'hi', buf: ['horn0', 'horn1', 'horn2'], jitter: 0.03 },
    crow: { ref: 8, range: 260, gain: 0.5 * BIRD_LEVEL, wet: 'hi', buf: ['crow0', 'crow1'], jitter: 0.05 },
    raven: { ref: 10, range: 300, gain: 0.55 * BIRD_LEVEL, wet: 'hi', buf: ['raven0', 'raven1', 'raven2'], jitter: 0.04 },
    magpie: { ref: 8, range: 220, gain: 0.45 * BIRD_LEVEL, wet: 'hi', buf: ['mag0', 'mag1', 'mag2', 'mag3'], jitter: 0.05 },
    wings: { ref: 6, range: 120, gain: 0.5 * BIRD_LEVEL, wet: 'lo', buf: ['wing0', 'wing1', 'wing2'], jitter: 0.04 },
    dogBark: { ref: 8, range: 160, gain: 0.5, wet: 'hi', buf: ['dog0', 'dog1', 'dog2'], jitter: 0.06 },
    busBrake: { ref: 8, range: 200, gain: 0.45, wet: 'lo', buf: ['bbrake'], jitter: 0.03 },
    carDoor: { ref: 6, range: 100, gain: 0.45, wet: 'lo', buf: ['cdoor'], jitter: 0.05 },
  };
  // a soft two-note hall chime (the metro platforms call play('chime0' | 'chime1')): calm, never an alarm; positional, short range
  SFX.chime0 = { ref: 6, range: 120, gain: 0.5, wet: 'lo', buf: ['chime0'], jitter: 0 };
  SFX.chime1 = { ref: 6, range: 120, gain: 0.5, wet: 'lo', buf: ['chime1'], jitter: 0 };
  SFX.chime = { ref: 6, range: 120, gain: 0.5, wet: 'lo', buf: ['chime0', 'chime1'], jitter: 0 };
  SFX.busDoorOpen = SFX.doorOpen; SFX.busDoorClose = SFX.doorClose;
  const OUTDOOR_ONLY = new Set(['gull', 'duck', 'crow', 'raven', 'magpie', 'wings', 'dogBark', 'clank', 'carHorn', 'busBrake', 'bikeBell']);   // dropped while the listener is indoors / underground
  SFX.bicycleBell = SFX.bikeBell;      // alias for callers written against the reference engine
  function play(name, o) {
    try {
      if (SILENT.has(name)) return null;
      if (!ac || failed || !N) return null;
      const def = hasOwn(SFX, name) ? SFX[name] : null;
      if (!def) { warnOnce('sfx:' + name, 'unknown sound', name); return null; }
      if (muted) return null;
      if (AMB.out < 0.35 && OUTDOOR_ONLY.has(name)) return null;
      o = o && typeof o === 'object' ? o : {};
      const pos = resolvePos(o.position), dist = pos ? distTo(pos) : 0;
      if (pos && dist > def.range) return null;
      const vol = clamp(o.volume === undefined ? 1 : Number(o.volume) || 0, 0, 4);
      if (vol <= 0) return null;
      const now = ac.currentTime, t0 = now + 0.01;
      const fade = pos ? farFade(dist, def.range) : 1;
      if (def.run) return def.run({ pos, dist, vol: vol * fade, t0 });
      const v = voice('sfx', { pos, dist, gain: vol * def.gain * fade, ref: def.ref, roll: def.roll || 1, wet: pos && def.wet ? (def.wet === 'hi' ? N.wetHi : N.wetLo) : null, pa: def.pa, pan: Number(o.pan) || 0, hq: true });
      if (!v) return null;
      v.name = name; v.base = vol * def.gain * fade; v.pos = pos ? { x: pos.x, y: pos.y, z: pos.z } : null;
      if (def.buf) vSrc(v, R.pick(def.buf), t0, 1, 1 + (R() * 2 - 1) * (def.jitter || 0));
      return { stop: () => { try { killVoice(v); } catch (e) { /* */ } } };
    } catch (e) { warnOnce('play:' + name, 'play failed', name, e); return null; }
  }
  // ------------------------------------------------------------ loops
  // ref / roll: PannerNode distance model; range: silent (and asleep) beyond it, fading over its last 60 %
  // amb: never spatial (ambient bed). Loops without `amb` are spatial when given a position, otherwise they play flat.
  const LOOPS = {
    city: { amb: true, build: buildCity, gate: () => AMB.out > 0.01 },                                  // the street beds go to sleep (disconnected) deep underground
    wind: { amb: true, build: buildWind, gate: () => AMB.wOut > 0.01 },
    birds: { amb: true, build: buildBirds, gate: () => AMB.wOut > 0.01 },
    traffic: { ref: 15, roll: 1, range: 400, wet: 'lo', build: buildTraffic, gate: () => AMB.out > 0.01 },
    lake: { ref: 10, roll: 1, range: 250, wet: 'lo', build: buildRiver, gate: () => AMB.out > 0.01 },
    fountain: { ref: 6, roll: 1, range: 140, wet: 'lo', build: buildFountain },
    boatHum: { ref: 10, roll: 1, range: 150, wet: 'lo', build: buildBoatHum },
    cafe: { amb: true, build: buildCafe, gate: () => AMB.cafe > 0.01 && AMB.out > 0.05 },
    crowd: { amb: true, build: buildCrowd, gate: () => AMB.crowd > 0.01 && AMB.out > 0.05 },
    indoor: { amb: true, build: buildIndoor, gate: () => AMB.amt > 0.01 },
  };
  LOOPS.river = LOOPS.lake;           // the Moscow name
  function bind(h) {
    const def = LOOPS[h.name], now = ac.currentTime;
    const I = { def, h, nodes: [], srcs: [], sends: [], tick: null, setParam: null, audible: true, awake: true, quiet: 0, dist: 0, lastPos: null, panner: null, lastT: now, errs: 0 };
    I.in = G(1); I.vg = G(0); I.in.connect(I.vg); I.nodes.push(I.in, I.vg);
    glide(I.vg.gain, h.vol, def.amb ? 0.8 : 0.03, now);
    /** extra output of the loop (e.g. a reverb send) whose level follows the loop volume */
    I.send = (dest, level) => { const s = G(0); s.connect(dest); I.nodes.push(s); I.sends.push([s, level]); glide(s.gain, h.vol * level, 0.05, now); return s; };
    const pos = def.amb ? null : resolvePos(h.pos);
    if (!pos) I.vg.connect(def.amb ? N.amb : N.sfx);
    else {
      I.fg = G(1); I.air = BQ('lowpass', 20000, 0.5); I.panner = PAN(def.ref, def.roll, null, true);
      I.vg.connect(I.fg); I.fg.connect(I.air); I.air.connect(I.panner); I.panner.connect(N.sfx);
      if (def.wet) I.panner.connect(def.wet === 'hi' ? N.wetHi : N.wetLo);
      I.nodes.push(I.fg, I.air, I.panner);
      placeLoop(I, now, true);
    }
    try { def.build(I, now); } catch (e) { disposeLoop(I); throw e; }
    if (h.stopped) { disposeLoop(I); return; }
    h.impl = I;
  }
  function volTo(I, v, tc) {
    glide(I.vg.gain, v, tc);
    for (const [s, level] of I.sends) glide(s.gain, v * level, tc);
  }
  function placeLoop(I, now, first) {
    const p = resolvePos(I.h.pos);
    if (!p) { I.audible = I.lastPos !== null && I.h.vol > 1e-4; return; }
    if (!I.lastPos || Math.abs(p.x - I.lastPos.x) + Math.abs(p.y - I.lastPos.y) + Math.abs(p.z - I.lastPos.z) > 0.01) { setPP(I.panner, p); I.lastPos = { x: p.x, y: p.y, z: p.z }; }
    const d = distTo(p), range = I.def.range || 500, fade = farFade(d, range), fc = airCut(d);
    I.dist = d;
    if (first) { I.fg.gain.value = fade; I.fg.gain._lv = fade; I.air.frequency.value = fc; I.air.frequency._lv = fc; } else { set(I.fg.gain, fade, 0.2, now); set(I.air.frequency, fc, 0.15, now); }
    I.audible = fade > 0.001 && I.h.vol > 1e-4;
  }
  /** asleep = the loop's sources are disconnected so the browser stops pulling (processing) them */
  function setAwake(I, on) {
    if (I.awake === on) return;
    I.awake = on;
    try { if (on) I.in.connect(I.vg); else I.in.disconnect(); } catch (e) { /* */ }
  }
  function disposeLoop(I) {
    I.tick = null; I.setParam = null;
    for (const s of I.srcs) { try { s.stop(); } catch (e) { /* */ } try { s.disconnect(); } catch (e) { /* */ } }
    for (const n of I.nodes) { try { n.disconnect(); } catch (e) { /* */ } }
    I.srcs.length = 0; I.nodes.length = 0; I.sends.length = 0;
  }
  function retire(I, fadeS) {       // fade a bound loop out, dispose it a little later
    const now = ac.currentTime; I.tick = null; I.setParam = null;
    ramp(I.vg.gain, 0, fadeS, now); for (const [s] of I.sends) ramp(s.gain, 0, fadeS, now);
    disposals.push({ at: now + fadeS + 0.25, I });
  }
  function loop(name, o) {
    const h = { name, vol: 0, params: {}, pos: null, stopped: false, impl: null };
    const handle = {
      get name() { return name; },
      get volume() { return h.vol; },
      get stopped() { return h.stopped; },
      setVolume(v, rampS = 0.1) {
        try {
          h.vol = clamp(Number(v) || 0, 0, 4);
          const I = h.impl;
          if (I && ac) { volTo(I, h.vol, Math.max(0.004, (Number(rampS) || 0) / 3)); if (h.vol > 1e-4 && (!I.panner || I.dist < (I.def.range || 500))) { I.quiet = 0; setAwake(I, true); } }
        } catch (e) { warnOnce('setVolume:' + name, 'setVolume failed', name, e); }
      },
      setParam(k, v) {
        try { h.params[k] = v; if (h.impl && h.impl.setParam) h.impl.setParam(k, v); } catch (e) { warnOnce('setParam:' + name, 'setParam failed', name, e); }
      },
      setPosition(p) {
        try {
          h.pos = p;
          const I = h.impl;
          if (I && ac && !h.stopped && !I.panner && !I.def.amb && resolvePos(p)) { h.impl = null; retire(I, 0.05); bind(h); }   // non-spatial -> spatial
        } catch (e) { warnOnce('setPosition:' + name, 'setPosition failed', name, e); }
      },
      stop() {
        try {
          if (h.stopped) return; h.stopped = true; handles.delete(h);
          const I = h.impl; h.impl = null;
          if (I && ac) retire(I, 0.15);
        } catch (e) { warnOnce('stop:' + name, 'stop failed', name, e); }
      },
    };
    try {
      o = o && typeof o === 'object' ? o : {};
      h.vol = clamp(o.volume === undefined ? 1 : Number(o.volume) || 0, 0, 4);
      h.params = Object.assign({}, o.params && typeof o.params === 'object' ? o.params : {});
      h.pos = o.position || null;
      if (!hasOwn(LOOPS, name)) { if (!SILENT.has(name)) warnOnce('loop:' + name, 'unknown loop', name); h.stopped = true; return handle; }
      handles.add(h);
      if (ac && N && !failed) { try { bind(h); } catch (e) { warnOnce('bind:' + name, 'loop failed', name, e); } }
    } catch (e) { warnOnce('loop:' + name, 'loop failed', name, e); }
    return handle;
  }

  // ---- wind: two decorrelated pink-noise bands (gust-driven cutoff/level) + leaf rustle + low body
  function buildWind(I, now) {
    const m = ac.createChannelMerger(2), hp = BQ('highpass', 110, 0.6); m.connect(hp); hp.connect(I.in); I.nodes.push(m, hp);
    const mk = (kind, type, f, q, ch) => { const s = NOISE(kind, now), fl = BQ(type, f, q), g = G(0); s.connect(fl); fl.connect(g); g.connect(m, 0, ch); I.srcs.push(s); I.nodes.push(fl, g); return { fl, g }; };
    const wL = mk('pink', 'lowpass', 400, 0.5, 0), wR = mk('pink', 'lowpass', 420, 0.5, 1);
    const rL = mk('white', 'bandpass', 3100, 0.5, 0), rR = mk('white', 'bandpass', 3900, 0.5, 1);   // soft rustle of lime and maple leaves
    const body = mk('brown', 'lowpass', 140, 0.6, 0); body.g.connect(m, 0, 1);
    let gs = 0.5, gr = 0.5;
    I.tick = (t, dt) => {
      const g = clamp01(gustNow(t));
      set(I.in.gain, AMB.wOut, 0.3, t);                                  // no wind indoors / underground
      gs += (g - gs) * Math.min(1, dt * 1.6); gr += (g - gr) * Math.min(1, dt * 0.9);
      const f1 = 0.62 + 0.38 * (0.5 + 0.5 * (0.6 * Math.sin(t * 9.1) + 0.4 * Math.sin(t * 14.3 + 1.3)));
      const f2 = 0.62 + 0.38 * (0.5 + 0.5 * (0.6 * Math.sin(t * 8.3 + 2) + 0.4 * Math.sin(t * 12.7 + 0.2)));
      set(wL.fl.frequency, 230 + 850 * Math.pow(gs, 1.6), 0.2, t); set(wR.fl.frequency, 250 + 800 * Math.pow(gr, 1.6), 0.2, t);
      set(wL.g.gain, 0.014 + 0.085 * gs * gs, 0.25, t); set(wR.g.gain, 0.014 + 0.085 * gr * gr, 0.25, t);
      set(rL.g.gain, (0.0035 + 0.024 * gs * gs) * f1, 0.05, t); set(rR.g.gain, (0.0035 + 0.024 * gr * gr) * f2, 0.05, t);
      set(body.g.gain, 0.008 + 0.026 * gs * gs, 0.3, t);
    };
  }
  function gustNow(t) {   // the core's visual gust (window.__ctx.shared.uGust) so audible gusts match swaying trees
    try { const c = globalThis.__ctx, g = c && c.shared && c.shared.uGust && c.shared.uGust.value; if (Number.isFinite(g)) return g; } catch (e) { /* */ }
    t += 14; return 0.5 + 0.28 * Math.sin(t * 0.37) + 0.14 * Math.sin(t * 1.13 + 1.7) + 0.08 * Math.sin(t * 2.9 + 0.4);
  }

  /** looping noise -> filters -> gain -> input `ch` of a 2-channel merger (decorrelated L / R beds); returns the gain node */
  function band(I, m, now, kind, filters, ch) {
    const s = NOISE(kind, now), g = G(0); let head = s;
    for (const [type, f, q] of filters) { const b = BQ(type, f, q); head.connect(b); head = b; I.nodes.push(b); }
    head.connect(g); g.connect(m, 0, ch); I.srcs.push(s); I.nodes.push(g);
    return g;
  }
  const around = (d0, d1, h0, h1) => { const az = R() * TAU, d = R.range(d0, d1); return { x: LS.x + Math.cos(az) * d, y: LS.y + R.range(h0, h1), z: LS.z + Math.sin(az) * d }; };
  // ---- world hooks (read through window.__ctx when the page provides it; every one has a harmless fallback)
  /** 0 (day) .. 1 (white night / night): the core's time of day */
  function nightNow() {
    try { const c = globalThis.__ctx, n = c && c.shared && c.shared.uNight && c.shared.uNight.value; if (Number.isFinite(n)) return clamp01(n); } catch (e) { /* */ }
    return 0;
  }
  /** the character of the water the listener stands at: which waterway is the nearest and how far it carries. The Neva is a 400 m wide open river (waves on the granite, a wide wash,
   *  heard from ~110 m), the Fontanka a 54 m trench (~70 m), the Moika / Griboedov / Winter / Swan canals narrow stone canyons (~45-55 m, quieter). Refreshed 4 times a second:
   *  the nearest waterway is found by looking for water in 8 directions at shoreDist + 1.5 m (L.waterwayAt). reach = metres at which the lapping is gone, wide = 0 (canal) .. 1 (Neva) */
  const WATER_CH = { neva: { reach: 110, wide: 1, gain: 1.0 }, fontanka: { reach: 70, wide: 0.35, gain: 1.0 }, moika: { reach: 55, wide: 0.15, gain: 0.85 }, griboedov: { reach: 50, wide: 0.1, gain: 0.8 }, 'winter-canal': { reach: 45, wide: 0, gain: 0.75 }, 'swan-canal': { reach: 40, wide: 0, gain: 0.7 } };
  const WATER_DEF = WATER_CH.fontanka;
  const WS = { next: 0, d: 1e4, ch: WATER_DEF, prox: 0 };
  function waterState(now) {
    if (now < WS.next) return WS;
    WS.next = now + 0.25;
    let d = 1e4, ch = WATER_DEF;
    try {
      const c = globalThis.__ctx, env = c && c.services && c.services.environment, L = c && c.L;
      if (env && typeof env.shoreDist === 'function') {
        d = env.shoreDist(LS.x, LS.z);
        if (!Number.isFinite(d)) d = 1e4;
        if (d < 110 && L && typeof L.waterwayAt === 'function') {
          let key = L.waterwayAt(LS.x, LS.z);
          if (!key) { const r = d + 1.5; for (let k = 0; k < 8 && !key; k++) key = L.waterwayAt(LS.x + Math.cos(k * 0.7854) * r, LS.z + Math.sin(k * 0.7854) * r); }
          if (key && hasOwn(WATER_CH, key)) ch = WATER_CH[key];
        }
      }
    } catch (e) { /* */ }
    WS.d = d; WS.ch = ch;
    WS.prox = d >= 1e4 ? 0 : d <= 0 ? 1 : Math.pow(sm((ch.reach - d) / ch.reach), 1.25);
    return WS;
  }
  /** 0..1: how close the listener is to the water (see waterState): full at the parapet, 0.35 at about a third of the reach, gone at the reach. Without the service: 0. */
  function waterProx() { return waterState(ac ? ac.currentTime : 0).prox; }

  /** 0..1: how busy the road beside the listener is (Nevsky and the primary roads 1, side streets 0.4-0.6, courtyards 0.15), fading over 110 m (the stone canyon carries the hum far) */
  function roadProx() {
    try {
      const c = globalThis.__ctx, L = c && c.L; if (!L || !L.roadsNear) return 0.5;
      let best = 0;
      for (const h of L.roadsNear(LS.x, LS.z, 110, { drivable: true })) {
        const hw = h.road.hw, w = hw === 'primary' ? 1 : hw === 'secondary' ? 0.92 : hw === 'tertiary' ? 0.62 : hw === 'residential' || hw === 'unclassified' || hw === 'living_street' ? 0.42 : 0.15;
        best = Math.max(best, w * sm((110 - Math.max(0, h.gap)) / 104));
      }
      return best;
    } catch (e) { return 0.5; }
  }
  /** 0..1 golden hour: the sun low (window.__ctx.sunDir.y < ~0.55) and not the white night: when the swifts scream over the roofs */
  function swiftNow() {
    try { const c = globalThis.__ctx, y = c && c.sunDir && c.sunDir.y; if (Number.isFinite(y)) return clamp01((0.55 - y) / 0.2) * (1 - clamp01(nightNow() * 1.5)); } catch (e) { /* */ }
    return 0;
  }
  /** the indoor / street state, refreshed at the control rate (ambState): amt = ctx.indoor.amount (0 outdoors .. 1 inside a zone), the kind of room (under = the metro below -2.5 m,
   *  vest = a vestibule, hall = the station hall / mall / anything else indoors), smoothed weights wUnder / wVest / wHall (sum = amt), out = the level of the street beds
   *  (1 outdoors, 0.3 in a vestibule, 0.1 in a hall, 0 below ground), wOut = 1 - amt (wind, birds), cafe = 0..1 closeness to a cafe terrace */
  const AMB = { amt: 0, out: 1, wOut: 1, wUnder: 0, wVest: 0, wHall: 0, cafe: 0, nextCafe: 0, crowd: 0 };
  let AMB_T = 0;
  function ambState(now, dt) {
    let amt = 0, id = '';
    try {
      const c = globalThis.__ctx, ind = c && c.indoor;
      if (ind) { amt = Number.isFinite(ind.amount) ? clamp01(ind.amount) : 0; const z = ind.zone; id = z ? String(z.id || (z.def && z.def.id) || '') : ''; }
    } catch (e) { /* */ }
    const under = LS.y < -2.5;
    if (under) amt = Math.max(amt, 0.999);
    const kind = under || /metro|under/.test(id) ? 'under' : /vestibule/.test(id) ? 'vest' : 'hall';
    const tU = amt * (kind === 'under' ? 1 : 0), tV = amt * (kind === 'vest' ? 1 : 0), tH = amt * (kind === 'hall' ? 1 : 0);
    const k = 1 - Math.exp(-Math.min(0.25, dt) * 3.5);
    AMB.wUnder += (tU - AMB.wUnder) * k; AMB.wVest += (tV - AMB.wVest) * k; AMB.wHall += (tH - AMB.wHall) * k;
    AMB.amt = AMB.wUnder + AMB.wVest + AMB.wHall;
    AMB.wOut = clamp01(1 - AMB.amt);
    AMB.out = clamp01(AMB.wOut + 0.3 * AMB.wVest + 0.1 * AMB.wHall);
    if (now >= AMB.nextCafe) {                                          // closeness to a cafe terrace: about 4 times a second
      AMB.nextCafe = now + 0.25;
      let dm = 1e9;
      try {
        const c = globalThis.__ctx, sv = c && c.services;
        if (LS.y < 6 && sv) for (const arr of [sv.wildlife && sv.wildlife.cafes, sv.props && sv.props.terraces]) if (arr) for (const q of arr) { const d = Math.hypot(q.x - LS.x, q.z - LS.z); if (d < dm) dm = d; }
      } catch (e) { /* */ }
      AMB.cafe = dm < 16 ? sm((16 - dm) / 13) * (1 - 0.45 * nightNow()) : 0;
      // the tourist crowds of the squares (services.wildlife.crowds: [{ x, z, r, f, l }]: full level l within r metres, fading to 0 over the next f metres); the loudest one counts
      let cl = 0;
      try {
        const c = globalThis.__ctx, arr = c && c.services && c.services.wildlife && c.services.wildlife.crowds;
        if (arr && LS.y < 30) for (const q of arr) { const d = Math.hypot(q.x - LS.x, q.z - LS.z); if (d < q.r + q.f) { const v = q.l * (d <= q.r ? 1 : sm((q.r + q.f - d) / q.f)); if (v > cl) cl = v; } }
      } catch (e) { /* */ }
      AMB.crowd = cl * (1 - 0.5 * nightNow());
    }
  }

  // ---- birds: the ambient layer (sparrows, tits, pigeons, far hooded crows, a rare far magpie, swifts screaming overhead at golden hour only, gulls over the water: their rate follows
  //      waterProx(), a far one now and then elsewhere). Off indoors. The birds near the player are voiced by the wildlife module from their real positions
  //      (audio.play('crow' | 'gull' | 'duck' | 'wings', { position })).
  function buildBirds(I, now) {
    const wet = I.send(N.wetAmb, 0.5);
    const st = { sp: now + R.range(0.6, 2.2), tt: now + R.range(8, 18), pg: now + R.range(6, 14), cr: now + R.range(8, 22), mg: now + R.range(60, 150), sw: now + R.range(3, 10), gl: now + R.range(4, 12) };
    const spawn = (key, t, pos, ref, gain, rate) => { const v = voice('bird', { pos, dist: distTo(pos), gain: gain * BIRD_LEVEL, ref, bus: I.in, wet }); if (v) vSrc(v, key, t, 1, rate); };
    I.tick = (t, dt, _d, aud) => {
      for (const k of Object.keys(st)) if (st[k] < t - 1) st[k] = t + 0.4 + (k === 'sp' ? 0 : 3);
      set(I.in.gain, AMB.wOut, 0.3, t);
      if (!aud || AMB.out < 0.25 || AMB.wOut < 0.25) return;
      const q = 1 - 0.5 * nightNow(), wp = waterProx(), gold = swiftNow();       // white nights: the birds are still about, a little quieter
      if (st.sp <= t + LA) {
        spawn('sp' + Math.floor(R() * 6), st.sp, around(5, 24, 2.5, 8), 3, R.range(0.2, 0.38) * q, R.range(0.93, 1.08));
        if (R() < 0.4) spawn('sp' + Math.floor(R() * 6), st.sp + R.range(0.35, 1.0), around(6, 26, 2.5, 8), 3, R.range(0.15, 0.3) * q, R.range(0.95, 1.1));
        st.sp += (R() < 0.18 ? R.range(5, 11) : R.range(1.2, 5.0)) / q;
      }
      if (st.tt <= t + LA) { spawn('tit' + Math.floor(R() * 3), st.tt, around(8, 30, 4, 12), 4, R.range(0.1, 0.18) * q, R.range(0.95, 1.06)); st.tt += R.range(22, 55); }
      if (st.pg <= t + LA) { spawn('coo' + Math.floor(R() * 2), st.pg, around(5, 20, 0.8, 5), 3, R.range(0.16, 0.28), R.range(0.95, 1.05)); st.pg += R() < 0.3 ? R.range(2.5, 4) : R.range(14, 34); }
      if (st.cr <= t + LA) { spawn('crow' + Math.floor(R() * 2), st.cr, around(50, 150, 6, 25), 14, R.range(0.28, 0.42), R.range(0.95, 1.05)); st.cr += R.range(30, 75); }
      if (st.mg <= t + LA) { spawn('mag' + Math.floor(R() * 4), st.mg, around(30, 90, 2, 8), 8, R.range(0.12, 0.2), R.range(0.96, 1.05)); st.mg += R.range(90, 220); }
      if (st.sw <= t + LA) { if (gold > 0.2) spawn('swc', st.sw, around(15, 60, 20, 45), 15, R.range(0.12, 0.22) * gold, R.range(0.94, 1.08)); st.sw += R.range(6, 16) / Math.max(0.2, gold); }
      if (st.gl <= t + LA) {
        if (wp > 0.12) { spawn('gull' + Math.floor(R() * 3), st.gl, around(25, 110, 6, 28), 14, R.range(0.2, 0.34) * Math.min(1, 0.4 + wp), R.range(0.95, 1.06)); st.gl += R.range(9, 26) / Math.max(0.25, wp); }
        else { spawn('gull' + Math.floor(R() * 3), st.gl, around(110, 260, 25, 55), 20, R.range(0.12, 0.2), R.range(0.95, 1.06)); st.gl += R.range(70, 200); }   // a far gull over the roofs
      }
    };
  }

  // ---- city: the hum of a stone-canyon city (5-6 storey rent houses): a soft rumble, a faint 100 Hz substation hum, an activity haze; rare far events: a dog barking in a
  //      courtyard, a short horn from a jammed street (no sirens, no alarms). Fades out indoors; at night (white night) quieter, more dogs.
  function buildCity(I, now) {
    const m = ac.createChannelMerger(2); m.connect(I.in); I.nodes.push(m);
    const wet = I.send(N.wetAmb, 1);
    const rL = band(I, m, now, 'brown', [['lowpass', 210, 0.5], ['highpass', 28, 0.7]], 0), rR = band(I, m, now, 'brown', [['lowpass', 190, 0.5], ['highpass', 28, 0.7]], 1);
    const hL = band(I, m, now, 'pink', [['bandpass', 520, 0.45]], 0), hR = band(I, m, now, 'pink', [['bandpass', 610, 0.45]], 1);
    const K = 0.24;      // level of the whole bed
    const tone = (f, g0, ch) => { const o = OSC('sine', f), g = G(g0 * K); o.connect(g); g.connect(m, 0, ch); o.start(now); I.srcs.push(o); I.nodes.push(g); };
    tone(100, 0.0018, 0); tone(100.35, 0.0015, 1);   // a substation's transformer hum, very faint
    const st = { ev: now + R.range(25, 50), ns: 0 };
    I.tick = (t, dt, _d, aud) => {
      set(I.in.gain, AMB.out, 0.3, t);
      if (t >= st.ns) {         // slow swells: 10 Hz parameter updates are plenty
        st.ns = t + 0.1;
        const a = 0.5 + 0.5 * Math.sin(t * 0.043 + 1), b = 0.5 + 0.5 * Math.sin(t * 0.031 + 4), c = 0.5 + 0.5 * Math.sin(t * 0.057 + 2), nf = 1 - 0.45 * nightNow();
        set(rL.gain, K * nf * (0.05 + 0.02 * a), 0.6, t); set(rR.gain, K * nf * (0.05 + 0.02 * b), 0.6, t);
        set(hL.gain, K * nf * (0.006 + 0.007 * a * c), 0.6, t); set(hR.gain, K * nf * (0.006 + 0.007 * b * c), 0.6, t);
      }
      if (st.ev < t - 2) st.ev = t + 20;
      if (!aud || AMB.out < 0.5) return;
      if (st.ev <= t + LA) { cityEvent(I, st.ev, wet); st.ev += R.range(30, 75); }
    };
  }
  function cityEvent(I, t, wet) {
    const night = nightNow(), r = R();
    if (r < 0.3 + 0.35 * night) {                                          // a dog barking in a far courtyard (a second bark half the time)
      const pos = around(120, 280, 0.5, 2), k = Math.floor(R() * 3), v = voice('amb', { pos, dist: distTo(pos), gain: 0.34, ref: 14, bus: I.in, wet });
      if (v) { vSrc(v, 'dog' + k, t, 1, R.range(0.9, 1.1)); if (R() < 0.5) vSrc(v, 'dog' + ((k + 1) % 3), t + R.range(0.6, 1.5), 0.85, R.range(0.9, 1.1)); }
    } else if (r >= 0.8) {                                                // a short horn from a jammed street (the 0.3-0.8 slice is silence: no sirens, no alarms)
      const pos = around(70, 180, 1, 6), v = voice('amb', { pos, dist: distTo(pos), gain: 0.3, ref: 12, bus: I.in, wet });
      if (v) vSrc(v, 'horn' + Math.floor(R() * 3), t, 1, R.range(0.97, 1.03));
    }
  }

  // ---- traffic: engine rumble + road roar + tyre hiss with slow platoon swells and baked stereo pass-bys (cars, a trolleybus whine, a delivery van). In the ambient mode the
  //      level follows the distance to the roads beside the listener (roadProx: Nevsky loud, a side street half, a courtyard faint), drops at night and fades indoors (AMB.out);
  //      positional: a plain point source.
  function buildTraffic(I, now) {
    const amb = !I.panner;
    const m = ac.createChannelMerger(2); m.connect(I.in); I.nodes.push(m);
    const wet = I.send(N.wetAmb, amb ? 0.6 : 0.25), K = 0.7;      // K: level of the bed
    const eL = band(I, m, now, 'brown', [['lowpass', 240, 0.5], ['highpass', 40, 0.7]], 0), eR = band(I, m, now, 'brown', [['lowpass', 260, 0.5], ['highpass', 40, 0.7]], 1);
    const rL = band(I, m, now, 'pink', [['bandpass', 700, 0.5]], 0), rR = band(I, m, now, 'pink', [['bandpass', 800, 0.5]], 1);
    const tL = band(I, m, now, 'white', [['bandpass', 3000, 0.7]], 0), tR = band(I, m, now, 'white', [['bandpass', 3400, 0.7]], 1);
    const st = { next: now + R.range(1.5, 4), horn: now + R.range(30, 80), sw: 0.6, ns: 0, prox: 0.5, lvl: 0.6, np: 0 };
    I.tick = (t, dt, _d, aud) => {
      const p1 = 0.5 + 0.5 * Math.sin(t * 0.16 + 0.7), p2 = 0.5 + 0.5 * Math.sin(t * 0.11 + 2.9), q1 = 0.5 + 0.5 * Math.sin(t * 0.13 + 4.1);
      const sw = st.sw = 0.35 + 0.65 * p1 * (0.6 + 0.4 * p2);        // green-wave platoons: swells every ~40 s
      if (amb && t >= st.np) { st.np = t + 0.25; st.prox += (roadProx() - st.prox) * 0.5; st.lvl = (0.14 + 0.86 * st.prox) * (1 - 0.65 * nightNow()); }
      const lv = amb ? st.lvl * AMB.out : 1;
      if (t >= st.ns) {
        st.ns = t + 0.1;
        set(eL.gain, K * lv * (0.02 + 0.03 * sw), 0.5, t); set(eR.gain, K * lv * (0.02 + 0.03 * (0.5 * sw + 0.5 * q1)), 0.5, t);
        set(rL.gain, K * lv * (0.006 + 0.014 * sw), 0.4, t); set(rR.gain, K * lv * (0.006 + 0.014 * (0.5 * sw + 0.5 * q1)), 0.4, t);
        set(tL.gain, K * lv * (0.0015 + 0.005 * sw * sw), 0.3, t); set(tR.gain, K * lv * (0.0015 + 0.005 * q1 * sw), 0.3, t);
      }
      if (st.next < t - 1) st.next = t + 0.5;
      if (st.horn < t - 1) st.horn = t + 10;
      if (!aud) return;
      if (amb) {
        while (st.next <= t + LA) {
          playSrc('car' + Math.floor(R() * 4), I.in, st.next, R.range(0.018, 0.05) * (0.6 + 0.6 * sw) * (0.3 + 0.7 * lv), R.range(0.94, 1.08));
          st.next += R.range(1.8, 6.5) / (0.5 + sw) / Math.max(0.2, lv * 1.5);
        }
        if (st.horn <= t + LA) { const pos = around(60, 200, 1, 3), v = voice('amb', { pos, dist: distTo(pos), gain: 0.1 * lv, ref: 12, bus: I.in, wet }); if (v) vSrc(v, 'horn' + Math.floor(R() * 3), st.horn, 1, R.range(0.97, 1.03)); st.horn += R.range(40, 110) / Math.max(0.3, lv); }
      }
    };
  }

  // ---- lake (= the Fontanka): soft lapping against the granite quay wall: pink wash, low swell, faint hiss, small waves slapping the stone and droplets. Ambient: follows
  //      waterProx() and fades indoors; positional: a point source (ref 10, range 250).
  function buildRiver(I, now) {
    const amb = !I.panner, K = 0.22;      // K: level of the whole bed
    const pg = G(amb ? 0 : 1); pg.connect(I.in); I.nodes.push(pg);        // ambient mode: follows the listener's distance to the water
    const m = ac.createChannelMerger(2); m.connect(pg); I.nodes.push(m);
    const wL = band(I, m, now, 'pink', [['bandpass', 560, 0.5]], 0), wR = band(I, m, now, 'pink', [['bandpass', 640, 0.5]], 1);
    const fL = band(I, m, now, 'brown', [['lowpass', 150, 0.5]], 0), fR = band(I, m, now, 'brown', [['lowpass', 170, 0.5]], 1);
    const hL = band(I, m, now, 'white', [['bandpass', 3400, 0.7]], 0), hR = band(I, m, now, 'white', [['bandpass', 3000, 0.7]], 1);
    const st = { next: now + 0.6, drop: now + 1.2, ns: 0 };
    I.tick = (t, dt, _d, aud) => {
      const prox = amb ? waterProx() * AMB.out * WS.ch.gain : 1;
      if (amb) set(pg.gain, prox, 0.5, t);
      if (t >= st.ns) {
        st.ns = t + 0.08;
        const wd = amb ? WS.ch.wide : 0;                                   // the Neva: a bigger swell (deeper, slower waves on the granite) and a wider wash; a canal: small slaps close to the stone
        const s1 = 0.5 + 0.5 * Math.sin(t * (0.83 - 0.3 * wd) + 1), s2 = 0.5 + 0.5 * Math.sin(t * (1.37 - 0.4 * wd) + 0.4), s3 = 0.5 + 0.5 * Math.sin(t * (0.61 - 0.2 * wd) + 2.2), sw = s1 * (0.5 + 0.5 * s2);
        set(wL.gain, K * (0.012 + 0.04 * sw) * (1 + 0.3 * wd), 0.35, t); set(wR.gain, K * (0.012 + 0.04 * s3 * (0.5 + 0.5 * s2)) * (1 + 0.3 * wd), 0.35, t);
        set(fL.gain, K * (0.02 + 0.012 * s3) * (1 + 0.6 * wd), 0.6, t); set(fR.gain, K * (0.02 + 0.012 * s1) * (1 + 0.6 * wd), 0.6, t);
        set(hL.gain, K * (0.0012 + 0.005 * sw * sw) * (1 - 0.4 * wd), 0.25, t); set(hR.gain, K * (0.0012 + 0.005 * s3 * s3) * (1 - 0.4 * wd), 0.25, t);
      }
      if (st.next < t - 1) st.next = t + 0.4;
      if (st.drop < t - 1) st.drop = t + 0.4;
      if (!aud || (amb && prox < 0.03)) return;
      while (st.next <= t + LA) { playSrc('lap' + Math.floor(R() * 3), pg, st.next, R.range(0.04, 0.1), R.range(0.92, 1.1)); st.next += R.range(0.7, 2.2); }
      while (st.drop <= t + LA) { playSrc('plip' + Math.floor(R() * 4), pg, st.drop, R.range(0.012, 0.035), R.range(0.9, 1.15)); st.drop += R.range(0.5, 2.8); }
    };
  }

  // ---- boatHum: a tourist boat's idle diesel on the Fontanka: a low brown rumble, a 58 Hz saw chug (a cylinder pulse ~9 Hz), a soft water burble. Positional (the wildlife module
  //      creates one per boat and moves it along boats[i].state(t)); calm, no horn.
  function buildBoatHum(I, now) {
    const s0 = NOISE('brown', now), f0 = BQ('lowpass', 150, 0.5), g0 = G(0.16); s0.connect(f0); f0.connect(g0); g0.connect(I.in); I.srcs.push(s0); I.nodes.push(f0, g0);
    const o = OSC('sawtooth', 58), fo = BQ('lowpass', 210, 0.7), go = G(0.035), lfo = OSC('sine', 9.3), lg = G(0.02);
    o.connect(fo); fo.connect(go); go.connect(I.in); lfo.connect(lg); lg.connect(go.gain); o.start(now); lfo.start(now); I.srcs.push(o, lfo); I.nodes.push(fo, go, lg);
    const s1 = NOISE('pink', now), f1 = BQ('bandpass', 380, 0.7), g1 = G(0.02); s1.connect(f1); f1.connect(g1); g1.connect(I.in); I.srcs.push(s1); I.nodes.push(f1, g1);
    I.tick = (t) => { set(g0.gain, 0.15 + 0.03 * Math.sin(t * 0.7 + 1), 0.4, t); set(g1.gain, 0.017 + 0.007 * Math.sin(t * 1.3), 0.3, t); };
  }

  /** a soft crowd babble: four band-passed pink-noise streams (300-3000 Hz) whose levels wobble at syllable rates; set(level, t) with level 0..1 */
  function babble(I, m, now) {
    const defs = [[320, 0.9, 2.7, 0.020], [640, 0.8, 3.9, 0.024], [1180, 0.9, 3.3, 0.016], [2400, 0.8, 4.7, 0.006]], parts = [];
    defs.forEach(([f, q, rate, base], i) => {
      const g = band(I, m, now, 'pink', [['bandpass', f, q]], i % 2), lfo = OSC('sine', rate * (0.88 + 0.24 * R())), lg = G(0);
      lfo.connect(lg); lg.connect(g.gain); lfo.start(now); I.srcs.push(lfo); I.nodes.push(lg);
      parts.push({ g, lg, base });
    });
    return { set(level, t) { for (const p of parts) { set(p.g.gain, level * p.base, 0.5, t); set(p.lg.gain, level * p.base * 0.8, 0.5, t); } } };
  }

  // ---- cafe: a quiet murmur of a few voices with an occasional cup clink; the level follows the distance to the nearest terrace / cafe pavement (AMB.cafe)
  function buildCafe(I, now) {
    const m = ac.createChannelMerger(2); m.connect(I.in); I.nodes.push(m);
    I.send(N.wetAmb, 0.5);
    const B = babble(I, m, now), st = { next: now + R.range(2, 6) };
    I.tick = (t, dt, _d, aud) => {
      const lv = AMB.cafe * AMB.out;
      B.set(lv, t);
      if (st.next < t - 1) st.next = t + 1;
      if (!aud || lv < 0.05) return;
      while (st.next <= t + LA) { playSrc('cup' + Math.floor(R() * 6), I.in, st.next, R.range(0.05, 0.12) * lv, R.range(0.9, 1.15)); st.next += R.range(2.5, 8) / Math.max(0.3, lv); }
    };
  }

  // ---- crowd: the murmur of a tourist square (Palace Square, the Kazan garden, Gostiny Dvor, the Alexander Garden, the Palace Embankment, Vosstaniya Square): many far voices in several
  //      languages as a broad babble that swells and ebbs slowly and a faint shuffle of soles on the setts; never a shout, never music, never an announcement.
  //      The level follows AMB.crowd (distance to the nearest crowd zone of services.wildlife.crowds).
  function buildCrowd(I, now) {
    const m = ac.createChannelMerger(2); m.connect(I.in); I.nodes.push(m);
    I.send(N.wetAmb, 0.7);
    const B = babble(I, m, now), st = { ns: 0 };
    const sL = band(I, m, now, 'pink', [['bandpass', 1500, 0.6]], 0), sR = band(I, m, now, 'pink', [['bandpass', 1700, 0.6]], 1);        // the shuffle of many soles on the setts
    I.tick = (t) => {
      if (t < st.ns) return;
      st.ns = t + 0.1;
      const lv = AMB.crowd * AMB.out, a = 0.5 + 0.5 * Math.sin(t * 0.07 + 2), b = 0.5 + 0.5 * Math.sin(t * 0.045 + 5), sw = 0.7 + 0.3 * a * (0.6 + 0.4 * b);
      B.set(lv * 1.5 * sw, t);
      set(sL.gain, lv * 0.004 * (0.6 + 0.8 * b), 0.8, t); set(sR.gain, lv * 0.004 * (0.6 + 0.8 * a), 0.8, t);
    };
  }

  // ---- indoor: the beds below the street (weights from ambState): metro = a quiet ventilation hum (brown rumble + soft air band + a faint 50 Hz mains tone) with a very soft far
  //      train rumble every 40-90 s and a rare soft two-note chime; hall = a soft murmur; vestibule = a bit of both. No beeps, nothing alarm-like.
  function buildIndoor(I, now) {
    const m = ac.createChannelMerger(2); m.connect(I.in); I.nodes.push(m);
    I.send(N.wetAmb, 1);
    const vL = band(I, m, now, 'brown', [['lowpass', 170, 0.5], ['highpass', 30, 0.7]], 0), vR = band(I, m, now, 'brown', [['lowpass', 150, 0.5], ['highpass', 30, 0.7]], 1);
    const aL = band(I, m, now, 'pink', [['bandpass', 420, 0.5]], 0), aR = band(I, m, now, 'pink', [['bandpass', 470, 0.5]], 1);
    const mains = []; for (const [f, ch] of [[50, 0], [50.2, 1], [100.1, 0], [100.4, 1]]) { const o = OSC('sine', f), g = G(0); o.connect(g); g.connect(m, 0, ch); o.start(now); I.srcs.push(o); I.nodes.push(g); mains.push([g, f > 60 ? 0.35 : 1]); }
    const rL = band(I, m, now, 'brown', [['lowpass', 95, 0.6]], 0), rR = band(I, m, now, 'brown', [['lowpass', 85, 0.6]], 1);
    const kL = band(I, m, now, 'pink', [['bandpass', 230, 0.6], ['lowpass', 520, 0.6]], 0), kR = band(I, m, now, 'pink', [['bandpass', 260, 0.6], ['lowpass', 520, 0.6]], 1);
    const B = babble(I, m, now);
    const st = { next: now + R.range(8, 25), t0: -1e9, dur: 1, chime: now + R.range(30, 80), ns: 0 };
    I.tick = (t, dt, _d, aud) => {
      const wU = AMB.wUnder, wV = AMB.wVest, wH = AMB.wHall;
      if (st.next < t - 200) st.next = t + 20;
      if (t >= st.ns) {
        st.ns = t + 0.1;
        const sw = 0.5 + 0.5 * Math.sin(t * 0.19 + 1), sw2 = 0.5 + 0.5 * Math.sin(t * 0.13 + 4), vent = 0.9 * wU + 0.4 * wV + 0.15 * wH;
        set(vL.gain, vent * (0.045 + 0.012 * sw), 0.5, t); set(vR.gain, vent * (0.045 + 0.012 * sw2), 0.5, t);
        set(aL.gain, vent * (0.005 + 0.003 * sw), 0.6, t); set(aR.gain, vent * (0.005 + 0.003 * sw2), 0.6, t);
        for (const [g, k] of mains) set(g.gain, vent * 0.0035 * k, 0.5, t);
        let e = 0; if (t > st.t0 && t < st.t0 + st.dur) e = Math.pow(Math.sin(Math.PI * (t - st.t0) / st.dur), 1.6);   // a far train: swells and fades over 14-24 s
        set(rL.gain, wU * e * 0.07, 0.4, t); set(rR.gain, wU * e * 0.07 * (0.9 + 0.1 * sw), 0.4, t);
        set(kL.gain, wU * e * 0.014, 0.4, t); set(kR.gain, wU * e * 0.014, 0.4, t);
        B.set(wH + 0.35 * wV + 0.12 * wU, t);
      }
      if (t > st.t0 + st.dur && t >= st.next) { st.t0 = t; st.dur = R.range(14, 24); st.next = t + st.dur + R.range(30, 70); }
      if (st.chime < t - 200) st.chime = t + 30;
      if (!aud) return;
      if (st.chime <= t + LA) { if (wU + wH > 0.5) playSrc('chime' + Math.floor(R() * 2), I.in, st.chime, R.range(0.05, 0.09), 1); st.chime = t + R.range(120, 240); }
    };
  }

  // ---- footsteps: no hook in the player, so they are derived from the listener's own motion (camera path): one footfall per stride while walking or running on the ground
  //      (camera under 2.4 m, not jumping or flying), the surface from the environment service (granite pavers / asphalt / sand and gravel / dry grass).
  const FS = { x: NaN, z: 0, y: 0, t: 0, acc: 0, flip: 0 };
  function footsteps(now) {
    if (muted) { FS.x = NaN; return; }
    if (!Number.isFinite(FS.x)) { FS.x = LS.x; FS.z = LS.z; FS.y = LS.y; FS.t = now; FS.acc = 0; return; }
    const dt = now - FS.t; if (dt < 0.05) return;
    const dx = LS.x - FS.x, dz = LS.z - FS.z, dy = LS.y - FS.y, d = Math.hypot(dx, dz), v = d / dt, vy = dy / dt;
    FS.x = LS.x; FS.z = LS.z; FS.y = LS.y; FS.t = now;
    if (dt > 0.5 || v > 14) { FS.acc = 0; return; }                          // a jump to a viewpoint, a tab that slept
    if (LS.y > 2.4 || Math.abs(vy) > 1.3 || v < 0.7 || v > 9.5) { if (v < 0.7) FS.acc = Math.min(FS.acc, 0.8); return; }
    const stride = v > 6 ? 2.4 : 1.65;
    FS.acc += d;
    if (FS.acc < stride) return;
    FS.acc -= stride; FS.flip ^= 1;
    let surf = 'paved';
    try { const c = globalThis.__ctx, env = c && c.services && c.services.environment; if (env && env.kindAt) { const k = env.kindAt(LS.x, LS.z); surf = k === 'asphalt' || k === 'grass' ? k : k === 'gravel' || k === 'sand' ? 'sand' : 'paved'; } } catch (e) { /* setts / granite slabs / anything else: paved */ }
    playSrc('stp_' + surf + '_' + Math.floor(R() * 4), N.sfx, now + 0.01, (v > 6 ? 0.2 : 0.14) * R.range(0.85, 1.1), (FS.flip ? 1.03 : 0.97) * R.range(0.97, 1.03));
  }

  // ---- fountain: falling water (white + pink bands), a burble, droplets on the basin
  function buildFountain(I, now) {
    const m = ac.createChannelMerger(2); m.connect(I.in); I.nodes.push(m);
    const hL = band(I, m, now, 'white', [['highpass', 1500, 0.6], ['lowpass', 9000, 0.6]], 0), hR = band(I, m, now, 'white', [['highpass', 1700, 0.6], ['lowpass', 8500, 0.6]], 1);
    const bL = band(I, m, now, 'pink', [['bandpass', 900, 0.5]], 0), bR = band(I, m, now, 'pink', [['bandpass', 1100, 0.5]], 1);
    const lL = band(I, m, now, 'brown', [['lowpass', 260, 0.5]], 0), lR = band(I, m, now, 'brown', [['lowpass', 240, 0.5]], 1);
    const st = { next: now + 0.2 };
    I.tick = (t, dt, _d, aud) => {
      const a = 0.5 + 0.5 * Math.sin(t * 1.9 + 1), b = 0.5 + 0.5 * Math.sin(t * 2.7 + 3), c = 0.5 + 0.5 * Math.sin(t * 0.7);
      set(hL.gain, 0.05 * (0.85 + 0.15 * a), 0.12, t); set(hR.gain, 0.05 * (0.85 + 0.15 * b), 0.12, t);
      set(bL.gain, 0.028 * (0.6 + 0.4 * b * c), 0.15, t); set(bR.gain, 0.028 * (0.6 + 0.4 * a * c), 0.15, t);
      set(lL.gain, 0.02, 0.5, t); set(lR.gain, 0.02, 0.5, t);
      if (st.next < t - 1) st.next = t + 0.3;
      if (!aud) return;
      while (st.next <= t + LA) { playSrc('plip' + Math.floor(R() * 4), I.in, st.next, R.range(0.05, 0.16), R.range(0.85, 1.25)); st.next += R.range(0.08, 0.35); }
    };
  }

  // ------------------------------------------------------------ graph, start, update
  const PREWARM = (() => {
    const k = ['sp0', 'sp1', 'sp2', 'sp3', 'sp4', 'sp5', 'tit0', 'tit1', 'tit2', 'coo0', 'coo1', 'crow0', 'crow1', 'raven0', 'raven1', 'raven2', 'mag0', 'mag1', 'wing0', 'wing1', 'dog0', 'dog1', 'dog2', 'swc', 'wag',
      'car0', 'car1', 'car2', 'car3', 'horn0', 'horn1', 'horn2', 'plip0', 'plip1', 'plip2', 'plip3', 'lap0', 'lap1', 'lap2', 'bike', 'bbrake', 'cdoor', 'doorOpen', 'doorClose', 'airRel',
      'gull0', 'gull1', 'gull2', 'quack0', 'quack1', 'quack2', 'cup0', 'cup1', 'cup2', 'cup3', 'cup4', 'cup5', 'chime0', 'chime1'];
    for (const s of ['paved', 'asphalt', 'sand', 'grass']) for (let i = 0; i < 4; i++) k.push('stp_' + s + '_' + i);
    return k;
  })();
  function buildGraph() {
    N = {};
    // HRTF database: load it now. (Chromium: a first HRTF panner created while an OfflineAudioContext is
    // suspended mid-render can stall that render forever; creating one up front avoids it.)
    if (O.hrtf) { try { N.hrtfWarm = ac.createPanner(); N.hrtfWarm.panningModel = 'HRTF'; } catch (e) { /* */ } }
    N.sfx = G(1); N.amb = G(1); N.bus = G(1);
    N.rvIn = G(1); N.conv = ac.createConvolver(); N.conv.buffer = buf('ir'); N.rvOut = G(0.8);
    N.wetLo = G(0.12); N.wetHi = G(0.3); N.wetAmb = G(0.2);
    N.wetLo.connect(N.rvIn); N.wetHi.connect(N.rvIn); N.wetAmb.connect(N.rvIn);
    N.rvIn.connect(N.conv); N.conv.connect(N.rvOut); N.rvOut.connect(N.bus);
    N.sfx.connect(N.bus); N.amb.connect(N.bus);
    N.master = G(masterVol);
    N.comp = ac.createDynamicsCompressor();       // glue + peak control (adds ~+4 dB make-up below threshold)
    N.comp.threshold.value = -10; N.comp.knee.value = 8; N.comp.ratio.value = 4; N.comp.attack.value = 0.002; N.comp.release.value = 0.25;
    N.pre = G(0.25); N.clip = ac.createWaveShaper(); N.clip.curve = clipCurve(); N.clip.oversample = 'none';   // hard ceiling 0.97
    N.mute = G(muted ? 0 : 1);
    N.bus.connect(N.master); N.master.connect(N.comp); N.comp.connect(N.pre); N.pre.connect(N.clip); N.clip.connect(N.mute); N.mute.connect(ac.destination);
    N.meter = ac.createAnalyser(); N.meter.fftSize = 2048; N.mute.connect(N.meter);
  }
  function hookPage() {
    if (hooked || typeof document === 'undefined' || !document.addEventListener) return;
    hooked = true;
    document.addEventListener('visibilitychange', () => {
      try {
        if (!ac || offline) return;
        if (hidden()) { ac.suspend().catch(() => {}); } else if (!muted) ac.resume().catch(() => {});
      } catch (e) { /* */ }
    });
  }
  function start() {
    try {
      if (failed) return;
      if (ac) { if (!offline && ac.state !== 'running' && !muted && !hidden()) ac.resume().catch(() => {}); return; }
      if (O.context) ac = O.context;
      else {
        const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AC) { failed = true; return; }
        try { ac = new AC({ latencyHint: 'balanced' }); } catch (e) { ac = new AC(); }
      }
      offline = typeof OfflineAudioContext !== 'undefined' && ac instanceof OfflineAudioContext;
      SR = ac.sampleRate;
      for (const k of ['white', 'pink', 'brown']) buf(k);
      buildGraph();
      applyListener(true);
      warm.push(...PREWARM);
      if (O.ambience) for (const n of ['city', 'wind', 'birds', 'traffic', 'lake', 'cafe', 'crowd', 'indoor']) loop(n, { volume: 1 });
      for (const h of handles) if (!h.impl && !h.stopped) { try { bind(h); } catch (e) { warnOnce('bind:' + h.name, 'loop failed', h.name, e); } }
      if (!offline) { if (ac.state !== 'running' && !muted) ac.resume().catch(() => {}); hookPage(); if (muted) applyMute(); }
    } catch (e) {
      warnOnce('start', 'start failed', e);
      failed = true; N = null;
      try { if (ac && !O.context && ac.close) ac.close(); } catch (e2) { /* */ }
      ac = null;
    }
  }
  function readCam(camera) {
    if (camera.updateMatrixWorld) camera.updateMatrixWorld();
    const e = camera.matrixWorld && camera.matrixWorld.elements;
    if (e && Number.isFinite(e[12]) && Number.isFinite(e[14])) {
      LS.x = e[12]; LS.y = e[13]; LS.z = e[14];
      const fl = Math.hypot(e[8], e[9], e[10]) || 1, ul = Math.hypot(e[4], e[5], e[6]) || 1;
      LS.fx = -e[8] / fl; LS.fy = -e[9] / fl; LS.fz = -e[10] / fl; LS.ux = e[4] / ul; LS.uy = e[5] / ul; LS.uz = e[6] / ul;
    } else if (camera.position && Number.isFinite(camera.position.x)) { LS.x = camera.position.x; LS.y = camera.position.y; LS.z = camera.position.z; }
  }
  function applyListener(force) {
    if (!force && Math.abs(LS.x - LA_.x) + Math.abs(LS.y - LA_.y) + Math.abs(LS.z - LA_.z) < 0.004 &&
      Math.abs(LS.fx - LA_.fx) + Math.abs(LS.fy - LA_.fy) + Math.abs(LS.fz - LA_.fz) + Math.abs(LS.ux - LA_.ux) + Math.abs(LS.uy - LA_.uy) + Math.abs(LS.uz - LA_.uz) < 0.002) return;
    Object.assign(LA_, LS);
    const l = ac.listener;
    if (l.positionX) {
      l.positionX.value = LS.x; l.positionY.value = LS.y; l.positionZ.value = LS.z;
      l.forwardX.value = LS.fx; l.forwardY.value = LS.fy; l.forwardZ.value = LS.fz;
      l.upX.value = LS.ux; l.upY.value = LS.uy; l.upZ.value = LS.uz;
    } else { l.setPosition(LS.x, LS.y, LS.z); l.setOrientation(LS.fx, LS.fy, LS.fz, LS.ux, LS.uy, LS.uz); }
  }
  /** control-rate work: loop placement / sleep / sequencing, voice ticks and clean-up */
  function control(now) {
    try { footsteps(now); } catch (e) { warnOnce('steps', 'footsteps failed', e); }
    try { ambState(now, now - AMB_T); AMB_T = now; } catch (e) { warnOnce('amb', 'indoor state failed', e); }
    for (const h of handles) {
      const I = h.impl; if (!I) continue;
      try {
        const dt = clamp(now - I.lastT, 0, 0.25); I.lastT = now;
        if (I.panner) placeLoop(I, now, false); else I.audible = h.vol > 1e-4 && (!I.def.gate || !!I.def.gate());
        // sleep only after SLEEP s of silence, so every strike / note / click already scheduled has finished
        if (I.audible) { I.quiet = 0; setAwake(I, true); } else if ((I.quiet += dt) > SLEEP) setAwake(I, false);
        if (I.tick) I.tick(now, dt, I.dist, I.audible && I.awake);
      } catch (e) {
        warnOnce('tick:' + h.name, 'loop error', h.name, e);
        if (++I.errs > 3) I.tick = null;
      }
    }
    for (let i = voices.length - 1; i >= 0; i--) {
      const v = voices[i];
      try { if (v.tick) v.tick(now); } catch (e) { warnOnce('vtick', 'voice error', e); v.tick = null; v.end = Math.min(v.end, now + 3); }
      if (now > v.end) { disposeVoice(v); voices.splice(i, 1); }
    }
    for (let i = disposals.length - 1; i >= 0; i--) if (now > disposals[i].at) { disposeLoop(disposals[i].I); disposals.splice(i, 1); }
  }
  function update(camera, dt) {
    try {
      if (camera && typeof camera === 'object') { try { readCam(camera); } catch (e) { /* */ } }
      if (!ac || failed || !N) return;
      const now = ac.currentTime;
      applyListener(false);
      if (lastCtl < 0 || now - lastCtl >= CTL || now < lastCtl) { lastCtl = now; control(now); }
      if (warm.length) { const t0 = nowMs(); do { const k = warm.shift(); try { buf(k); } catch (e) { warnOnce('warm:' + k, 'synth failed', k, e); } } while (warm.length && nowMs() - t0 < 2.5); }
    } catch (e) { warnOnce('update', 'update error', e); }
  }
  function applyMute() {
    if (!ac || !N) return;
    try {
      clearTimeout(suspendTimer);
      if (muted) {
        ramp(N.mute.gain, 0, 0.12);
        if (!offline) suspendTimer = setTimeout(() => { try { if (muted && ac && ac.state === 'running') ac.suspend().catch(() => {}); } catch (e) { /* */ } }, 700);
      } else {
        if (!offline && ac.state !== 'running' && !hidden()) ac.resume().catch(() => {});
        ramp(N.mute.gain, 1, 0.35);
      }
    } catch (e) { warnOnce('mute', 'mute failed', e); }
  }

  const api = {
    get ready() { return !!ac && !!N && !failed; },
    get context() { return ac; },
    get muted() { return muted; },
    set muted(v) { muted = !!v; applyMute(); },
    get master() { return masterVol; },
    setMaster(v) { try { masterVol = clamp(Number(v) || 0, 0, 2); if (ac && N) glide(N.master.gain, masterVol, 0.05); } catch (e) { /* */ } },
    start, update, loop, play,
    names: { loops: Object.keys(LOOPS), oneShots: Object.keys(SFX) },
    meter() {
      try {
        if (!N || !N.meter) return { rms: 0, peak: 0 };
        const n = N.meter.fftSize; if (!meterBuf || meterBuf.length !== n) meterBuf = new Float32Array(n);
        N.meter.getFloatTimeDomainData(meterBuf);
        let s = 0, p = 0; for (let i = 0; i < n; i++) { const x = meterBuf[i]; s += x * x; const a = Math.abs(x); if (a > p) p = a; }
        return { rms: Math.sqrt(s / n), peak: p };
      } catch (e) { return { rms: 0, peak: 0 }; }
    },
    get stats() {
      let awake = 0; for (const h of handles) if (h.impl && h.impl.awake) awake++;
      return { voices: voices.length, loops: handles.size, awake, sources: srcLive, hrtf: hrtfLive, buffers: cache.size, pending: warm.length, state: ac ? ac.state : 'none' };
    },
  };
  return api;
}
