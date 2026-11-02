// Streaming scheduling contract: nearby first, bounded speculative work,
// destination changes honored after idle, explicit teleports still work.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRegionStreamer } from '../src/core/region-streamer.js';

const idle = [];
globalThis.requestIdleCallback = fn => { idle.push(fn); };
const loaded = [], released = [];
const ctx = { initialPosition: { x: 0, z: 0 }, mat: { toon: () => new THREE.MeshBasicMaterial() } };
const streamer = createRegionStreamer(ctx, {
  async load(name) { loaded.push(name); return { geometries: [], objects: [] }; },
  release(name) { released.push(name); },
});
const region = (asset, x) => ({ asset, bounds: [x, -10, x + 10, 10] });
await streamer.register({ materials: [], textures: [], regions: [region('start', 0), region('ahead', 1000), region('far', 5000)] }, new THREE.Group());
assert.deepEqual(loaded, ['start']);
assert.equal(streamer.readyAt(5000, 0), false);
streamer.start();
const flush = async () => { while (idle.length) { idle.shift()(); await new Promise(resolve => setImmediate(resolve)); } };
await flush();
assert.deepEqual(loaded, ['start', 'ahead'], 'background loading must stop outside the nearby ring');
streamer.update(5000, 0);
// Move again before the pending idle callback. It must honor the latest pose.
streamer.update(0, 0);
await flush();
assert.deepEqual(loaded, ['start', 'ahead']);
await streamer.ensureAt(5000, 0);
assert.equal(streamer.readyAt(5000, 0), true);
assert.deepEqual(loaded, ['start', 'ahead', 'far']);
await streamer.ensureAll();
assert.equal(loaded.length, 3, 'explicit loads must share requests');
assert.deepEqual(released, loaded, 'hydrated regions must release packed metadata exactly once');
assert.equal(streamer.stats.failed, 0);
delete globalThis.requestIdleCallback;

// Simulate driving while a distant city decode is still outstanding. Road
// surfaces need the other slot immediately, even when the browser has no idle
// time. A road beyond the bounded near ring must remain unloaded.
const idle2 = [], calls = [];
globalThis.requestIdleCallback = fn => idle2.push(fn);
let finishCity, active = 0, maxActive = 0;
const slow = createRegionStreamer(ctx, {
  async load(name) {
    calls.push(name); active++; maxActive = Math.max(maxActive, active);
    if (name === 'city-slow') await new Promise(resolve => { finishCity = resolve; });
    active--; return { geometries: [], objects: [] };
  },
});
await slow.register({ materials: [], textures: [], regions: [region('city-slow', 1000), region('street-surfaces-ahead', 1600), region('street-surfaces-far', 6000)] }, new THREE.Group());
slow.start(); idle2.shift()(); await new Promise(resolve => setImmediate(resolve));
assert.deepEqual(calls, ['city-slow']);
slow.update(1300, 0); await new Promise(resolve => setImmediate(resolve));
assert.deepEqual(calls, ['city-slow', 'street-surfaces-ahead'], 'driving cannot wait for the in-flight speculative city request or an idle callback');
assert(slow.readyAt(1600, 0, 20), 'near road is fully hydrated');
assert(!calls.includes('street-surfaces-far'), 'road priority does not load the entire area');
assert(maxActive <= 2, 'road priority shares the two-slot decoding budget');
finishCity(); await new Promise(resolve => setImmediate(resolve));
while(idle2.length){idle2.shift()();await new Promise(resolve=>setImmediate(resolve));}
delete globalThis.requestIdleCallback;
console.log('RESULT: OK (nearby streaming, deferred destination, teleport, deduplication, road priority under stalled city decoding)');
