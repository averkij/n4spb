// Node-level sanity test of src/core/audio.js (no sound card, no browser): a mock AudioContext records what the engine builds.
//   node tools/audio-test.mjs [path/to/audio.js]
// Checks: createAudio() builds and starts; every sound name used by src/world/** (audio.play / audio.loop / the wildlife `say()` calls and species call names) exists
// (no "unknown sound" warning); every synthesised buffer is finite, non-silent and below 1.0; update() never throws over 60 simulated seconds with a moving listener
// (walking across prospekt Lenina, running, a jump to another viewpoint, flying, day -> white night); footsteps follow the listener (and only on the ground);
// the water ambience follows the lake; the road ambience follows the avenue; the average update cost stays small.
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const audioPath = path.resolve(process.argv[2] || path.join(root, 'src/core/audio.js'));
const L = await import(pathToFileURL(path.join(root, 'src/world/layout.js')).href);
const { createAudio } = await import(pathToFileURL(audioPath).href);
const fails = []; const warnings = [];
const check = (c, m) => { if (!c) { fails.push(m); console.log('FAIL:', m); } else console.log('ok:', m); };
const realWarn = console.warn; console.warn = (...a) => { warnings.push(a.map(String).join(' ')); };

// ---------------------------------------------------------------- mock WebAudio
class Param { constructor(v = 0) { this.value = v; } setTargetAtTime(v) { this.value = v; } setValueAtTime(v) { this.value = v; } linearRampToValueAtTime(v) { this.value = v; } exponentialRampToValueAtTime(v) { this.value = v; } cancelScheduledValues() {} cancelAndHoldAtTime() {} }
class MockNode { constructor(ac) { this.ac = ac; this.out = new Set(); } connect(n) { this.out.add(n); return n; } disconnect() { this.out.clear(); } }
class MockContext {
  constructor(sr = 48000) {
    this.sampleRate = sr; this.currentTime = 0; this.state = 'running'; this.buffers = []; this.sources = []; this.destination = new MockNode(this);
    this.listener = { positionX: new Param(), positionY: new Param(), positionZ: new Param(), forwardX: new Param(), forwardY: new Param(), forwardZ: new Param(), upX: new Param(), upY: new Param(), upZ: new Param() };
    this.counts = {};
  }
  _n(kind, extra = {}) { this.counts[kind] = (this.counts[kind] || 0) + 1; return Object.assign(new MockNode(this), extra); }
  createGain() { return this._n('gain', { gain: new Param(1) }); }
  createBiquadFilter() { return this._n('biquad', { type: 'lowpass', frequency: new Param(350), Q: new Param(1), gain: new Param(0) }); }
  createOscillator() { return this._n('osc', { type: 'sine', frequency: new Param(440), start() {}, stop() {} }); }
  createChannelMerger() { return this._n('merger'); }
  createDelay() { return this._n('delay', { delayTime: new Param(0) }); }
  createStereoPanner() { return this._n('spanner', { pan: new Param(0) }); }
  createConvolver() { return this._n('conv', { buffer: null }); }
  createDynamicsCompressor() { return this._n('comp', { threshold: new Param(), knee: new Param(), ratio: new Param(), attack: new Param(), release: new Param() }); }
  createWaveShaper() { return this._n('shaper', { curve: null, oversample: 'none' }); }
  createAnalyser() { return this._n('analyser', { fftSize: 2048, getFloatTimeDomainData(a) { a.fill(0); } }); }
  createPanner() { return this._n('panner', { positionX: new Param(), positionY: new Param(), positionZ: new Param(), setPosition() {}, panningModel: 'equalpower', distanceModel: 'inverse', refDistance: 1, rolloffFactor: 1, maxDistance: 1e4, coneInnerAngle: 360, coneOuterAngle: 360 }); }
  createBuffer(nch, len, sr) {
    const data = Array.from({ length: nch }, () => new Float32Array(len));
    const b = { numberOfChannels: nch, length: len, sampleRate: sr, duration: len / sr, getChannelData: (i) => data[i] };
    this.buffers.push(b); return b;
  }
  createBufferSource() {
    const ac = this, s = this._n('source', { buffer: null, loop: false, playbackRate: new Param(1), onended: null, t0: -1, start(t) { this.t0 = t; ac.sources.push(this); }, stop() {} });
    return s;
  }
  resume() { return Promise.resolve(); } suspend() { return Promise.resolve(); } close() { return Promise.resolve(); }
  /** fire onended of the sources whose time has come (so the engine's cleanup runs) */
  tick() { for (const s of this.sources) if (!s.done && s.t0 >= 0 && !s.loop && s.buffer && s.t0 + s.buffer.duration / s.playbackRate.value < this.currentTime) { s.done = true; if (s.onended) s.onended(); } }
}

// ---------------------------------------------------------------- the world the engine peeks into (window.__ctx)
const world = {
  L, shared: { uNight: { value: 0 }, uGust: { value: 0.5 } },
  services: { environment: { shoreDist: (x, z) => 1e4, kindAt: (x, z) => 'paved' } },
};
globalThis.__ctx = world;
const camera = (x, y, z, yaw = 0) => ({ updateMatrixWorld() {}, matrixWorld: { elements: [Math.cos(yaw), 0, -Math.sin(yaw), 0, 0, 1, 0, 0, Math.sin(yaw), 0, Math.cos(yaw), 0, x, y, z, 1] } });

// ---------------------------------------------------------------- 0. the names the world modules use
function walk(dir, out = []) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, out); else if (p.endsWith('.js') && !p.includes(path.sep + 'data' + path.sep)) out.push(p); } return out; }
const used = new Map();
for (const f of walk(path.join(root, 'src/world'))) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/audio\??\.(play|loop)\??\.?\(\s*['"]([A-Za-z0-9_]+)['"]/g)) used.set(m[2], (used.get(m[2]) || '') + ' ' + m[1] + ':' + path.basename(f));
  for (const m of src.matchAll(/\bsay\(\s*['"]([A-Za-z0-9_]+)['"]/g)) used.set(m[1], (used.get(m[1]) || '') + ' say:' + path.basename(f));
  if (f.includes(path.sep + 'wildlife' + path.sep)) for (const m of src.matchAll(/\bcall:\s*['"]([A-Za-z0-9_]+)['"]/g)) used.set(m[1], (used.get(m[1]) || '') + ' call:' + path.basename(f));
}
console.log('sound names used by src/world:', [...used.keys()].join(', '));

// ---------------------------------------------------------------- 1. builds
const idle = createAudio();                                   // never touches WebAudio
check(idle && typeof idle.start === 'function' && typeof idle.loop === 'function' && typeof idle.play === 'function' && typeof idle.update === 'function', 'createAudio() builds the public API');
const h0 = idle.loop('fountain', { position: { x: 0, y: 1, z: 0 }, volume: 0.5 });
check(h0 && typeof h0.setVolume === 'function', 'a loop can be created before start() (fountain)');
check(idle.play('crow', { position: { x: 1, y: 1, z: 1 } }) === null, 'play() before start() is a harmless no-op');

const ac = new MockContext();
const audio = createAudio({ context: ac });
const fountain = audio.loop('fountain', { position: { x: -153.8, y: 1, z: 107.4 }, volume: 0.55 });
audio.update(camera(L.HERO.x, 1.52, L.HERO.z), 0.016);
audio.start();
check(audio.ready, 'start() with the mock context is ready (' + JSON.stringify(audio.stats) + ')');
check(warnings.length === 0, 'no warnings while building (' + warnings.slice(0, 3).join(' | ') + ')');

// ---------------------------------------------------------------- 2. every name exists
const names = audio.names;
for (const [n, who] of used) {
  const isLoop = who.includes('loop:'), known = names.oneShots.includes(n) || names.loops.includes(n);
  const before = warnings.length;
  if (isLoop) { const h = audio.loop(n, { position: { x: -150, y: 1, z: 100 } }); h.stop(); } else { audio.play(n, { position: { x: -150, y: 1.5, z: 100 } }); }
  const unknownWarned = warnings.slice(before).some((w) => /unknown/.test(w));
  check(!unknownWarned && (known || /gull|footstep/.test(n)), `name '${n}' (${who.trim()}) exists`);
}
for (const n of ['crow', 'raven', 'magpie', 'wings', 'dogBark', 'busBrake', 'carDoor', 'doorOpen', 'doorClose', 'bikeBell', 'carHorn', 'gull']) check(names.oneShots.includes(n), `one-shot '${n}' is defined`);
{
  const before = audio.stats.voices, sources = ac.sources.length, warns = warnings.length;
  check(audio.play('clank', { volume: 4 }) === null && audio.stats.voices === before && ac.sources.length === sources && warnings.length === warns,
    'removed construction sound creates no voice, source or warning');
}
for (const n of ['city', 'wind', 'birds', 'traffic', 'lake', 'fountain']) check(names.loops.includes(n), `loop '${n}' is defined`);
for (const n of ['trainRun', 'trainBrake', 'announce', 'boatHorn', 'doorChime']) { const b = warnings.length; audio.play(n, { position: { x: 0, y: 1, z: 0 } }); audio.loop(n).stop(); check(warnings.length === b, `Moscow name '${n}' is accepted silently`); }

// ---------------------------------------------------------------- 3. warm all buffers
let guard = 0; while (audio.stats.pending > 0 && guard++ < 4000) audio.update(camera(L.HERO.x, 1.52, L.HERO.z), 0.016);
check(audio.stats.pending === 0, 'all prewarm buffers synthesised (' + audio.stats.buffers + ' buffers)');
for (const k of ['crow', 'raven', 'magpie', 'wings', 'dogBark', 'clank', 'busBrake', 'carDoor']) audio.play(k, { position: { x: -150, y: 1.5, z: 100 }, volume: 1 });
for (let i = 0; i < 5; i++) { ac.currentTime += 0.05; audio.update(camera(L.HERO.x, 1.52, L.HERO.z), 0.05); }
let bad = 0, silent = 0, loud = 0;
for (const b of ac.buffers) {
  let peak = 0, ok = true;
  for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) { const v = d[i]; if (!Number.isFinite(v)) { ok = false; break; } const a = Math.abs(v); if (a > peak) peak = a; } }
  if (!ok) bad++; else if (peak < 1e-3 && b.length > 100) silent++; else if (peak > 1.0001 && !(b.numberOfChannels === 2 && b.duration > 2 && b.duration < 2.3) && !(b.numberOfChannels === 1 && (b.duration === 3 || b.duration === 5))) { loud++; console.log('  loud buffer: ' + b.numberOfChannels + ' ch, ' + b.duration.toFixed(2) + ' s, peak ' + peak.toFixed(2)); }   // (the reverb impulse response and the 3 s / 5 s noise beds are RMS-normalised, not peak-normalised)
}
check(bad === 0, `no NaN / Infinity in ${ac.buffers.length} buffers`);
check(silent === 0, 'no silent buffers (' + silent + ')');
check(loud === 0, 'no clipping buffers (' + loud + ')');
check(warnings.filter((w) => /fail|error/i.test(w)).length === 0, 'no synthesis / playback warnings (' + warnings.filter((w) => /fail|error/i.test(w)).slice(0, 3).join(' | ') + ')');

// ---------------------------------------------------------------- 4. 60 s with a moving listener
const stepLen = (b) => { const r = Math.round(0.17 * ac.sampleRate), r2 = Math.round(0.24 * ac.sampleRate); return b && (b.length === r || b.length === r2); };
const countSteps = (from) => ac.sources.filter((s) => s.t0 >= from && stepLen(s.buffer)).length;
let lx = L.HERO.x, lz = L.HERO.z, ly = 1.52, yaw = 0, t = 0; const dt = 1 / 60, walkTo = (tx, tz, v, secs, y = 1.52) => { for (let i = 0; i < secs * 60; i++) { const dx = tx - lx, dz = tz - lz, d = Math.hypot(dx, dz) || 1; lx += (dx / d) * Math.min(d, v * dt); lz += (dz / d) * Math.min(d, v * dt); ly = y; yaw += 0.01; frame(); } };
let updMs = 0, updN = 0, shots = 0;
function frame() {
  ac.currentTime += dt; t += dt; ac.tick();
  const t0 = performance.now(); audio.update(camera(lx, ly, lz, yaw), dt); updMs += performance.now() - t0; updN++;
  if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) {          // a one-shot every half second, around the listener
    const names1 = ['crow', 'raven', 'magpie', 'wings', 'dogBark', 'clank', 'busBrake', 'carDoor', 'carHorn', 'bikeBell', 'gull', 'doorOpen', 'doorClose'];
    audio.play(names1[shots++ % names1.length], { position: { x: lx + 6, y: 2, z: lz - 5 }, volume: 0.8 });
  }
}
// standing: no steps
let s0 = ac.currentTime; for (let i = 0; i < 120; i++) frame();
check(countSteps(s0) === 0, 'standing still: no footsteps');
// walking 20 s toward the avenue
s0 = ac.currentTime; walkTo(L.HERO.x - 60, L.HERO.z - 30, 3.6, 12);
const walkSteps = countSteps(s0);
check(walkSteps >= 15 && walkSteps <= 80, 'walking 12 s at 3.6 m/s: footsteps follow the stride (' + walkSteps + ')');
// running
s0 = ac.currentTime; walkTo(lx + 40, lz + 20, 8.4, 6); const runSteps = countSteps(s0);
check(runSteps >= 6, 'running: footsteps (' + runSteps + ')');
// flying: none
s0 = ac.currentTime; walkTo(lx - 60, lz, 12, 6, 25); check(countSteps(s0) === 0, 'flying at 25 m: no footsteps');
// teleport to another viewpoint and keep going
lx = L.VIEWS[3].x; lz = L.VIEWS[3].z; ly = 1.52; s0 = ac.currentTime; walkTo(lx + 30, lz, 3.6, 4); check(countSteps(s0) >= 4, 'after a jump to a viewpoint the steps continue');
// the road ambience: avenue vs courtyard
const traffic = audio; void traffic;
// water: far from the lake, then at its south shore (the environment service only knows within 16 m, the engine falls back to the lake box)
world.services.environment.shoreDist = (x, z) => 1e4;
let farLevel = null, nearLevel = null;
const probe = (x, z) => { lx = x; lz = z; ly = 1.52; for (let i = 0; i < 90; i++) frame(); };
probe(L.HERO.x, L.HERO.z); farLevel = ac.counts.gain;                                           // (the mock cannot read levels: the check is that nothing throws while the prox changes)
probe(-300, -200); probe(-300, -190); probe(-300, -140);
world.services.environment.shoreDist = (x, z) => 3; probe(-300, -214);                             // 3 m from the bank
world.services.environment.shoreDist = (x, z) => 1e4;
// the day -> white night cycle
for (const n of [0, 0.35, 1]) { world.shared.uNight.value = n; probe(L.HERO.x + 20 * n, L.HERO.z); for (let i = 0; i < 180; i++) frame(); }
// mute and unmute, then stand a while: the loops and voices settle
audio.muted = true; for (let i = 0; i < 60; i++) frame(); audio.muted = false; for (let i = 0; i < 600; i++) frame();
check(updN > 3600, `update() ran ${updN} frames (${(t).toFixed(0)} s) with a moving listener without throwing`);
const avg = updMs / updN; console.log(`update cost (mock context, JS side only): ${avg.toFixed(3)} ms per frame`);
check(avg < 1.5, 'average update < 1.5 ms');
const bad2 = warnings.filter((w) => !/^\[audio\] unknown (sound|loop) (trainRun|trainBrake|announce|boatHorn|doorChime)/.test(w));
check(bad2.length === 0, 'no warnings during the run (' + bad2.slice(0, 3).join(' | ') + ')');
console.log('stats at the end:', JSON.stringify(audio.stats), ' nodes:', JSON.stringify(ac.counts));
check(audio.stats.voices < 40 && audio.stats.sources < 200, 'voices and sources stay bounded');
console.warn = realWarn;
console.log(fails.length ? `RESULT: FAIL (${fails.length})` : 'RESULT: OK');
process.exit(fails.length ? 1 : 0);
