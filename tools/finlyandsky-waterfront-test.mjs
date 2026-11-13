// CPU integration regression for the surveyed right-bank promenade and landings.
// node tools/area.mjs finlyandsky tools/finlyandsky-waterfront-test.mjs
// Uses real built triangles, Physics, Player and knock records, without a bake/GPU.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

assert.equal(process.env.AREA, 'finlyandsky', 'run through tools/area.mjs finlyandsky');
const { ctx, L, THREE, marks, errors } = await buildWorld();
const { FRAMES, WALK_WIDTH, bankHeight, APRON_FRAMES, APRON_Y } = await import('../src/areas/finlyandsky/bank-profile.js');
const { LENIN, LENIN_BACK, GROTTO, point } = await import('../src/world/finlyandskyWaterfront/sites.js');
const { UPPER_Y, LOWER_Y } = await import('../src/world/finlyandskyWaterfront/kit.js');
const { NAVIGABLE_WATER_Y } = await import('../src/world/environment/water-level.js');
const { Player } = await import('../src/core/player.js');
const { createHandling } = await import('../src/world/drive/handling.js');
const ph = ctx.physics, owned = name => ph.items.slice(...marks[name]);
const bankItems = owned('finlyandskyBanks'), landingItems = owned('finlyandskyWaterfront');
let passed = 0, failed = 0;
function check(name, fn) { try { fn(); passed++; console.log('PASS', name); } catch (e) { failed++; console.log('FAIL', name, '\n    ' + e.message); } }
const close = (a, b, message, tolerance = .025) => assert(Number.isFinite(a) && Math.abs(a - b) <= tolerance, `${message}: ${a} != ${b}`);

// Index the actual built triangles. This intentionally does not use SURFACES as
// the height oracle: it catches missing geometry, failed ground cuts and stale
// flat paving that an authored height-function-only check would miss.
ctx.scene.updateMatrixWorld(true);
const cell = 16, grids = new Map(), v = new THREE.Vector3();
function indexMesh(mesh, group) {
  const geo = mesh.geometry, attr = geo.getAttribute('position'), ix = geo.index;
  const world = new Float64Array(attr.count * 3);
  for (let i = 0; i < attr.count; i++) { v.fromBufferAttribute(attr, i).applyMatrix4(mesh.matrixWorld); world.set([v.x, v.y, v.z], i * 3); }
  let grid = grids.get(group); if (!grid) grids.set(group, grid = new Map());
  for (let i = 0, n = ix ? ix.count : attr.count; i + 2 < n; i += 3) {
    const a = (ix ? ix.getX(i) : i) * 3, b = (ix ? ix.getX(i + 1) : i + 1) * 3, c = (ix ? ix.getX(i + 2) : i + 2) * 3;
    const t = [world[a], world[a + 1], world[a + 2], world[b], world[b + 1], world[b + 2], world[c], world[c + 1], world[c + 2]];
    const den = (t[5] - t[8]) * (t[0] - t[6]) + (t[6] - t[3]) * (t[2] - t[8]);
    if (Math.abs(den) < 1e-8 || Math.min(t[1], t[4], t[7]) > 1) continue;
    t.push(den);
    const x0 = Math.min(t[0], t[3], t[6]), x1 = Math.max(t[0], t[3], t[6]), z0 = Math.min(t[2], t[5], t[8]), z1 = Math.max(t[2], t[5], t[8]);
    // Only the two landing districts and the continuous bank need indexing.
    if (!((x1 > 120 && x0 < 290 && z1 > -2340 && z0 < -2240) || (x1 > 840 && x0 < 2950 && z1 > -3150 && z0 < -2270))) continue;
    for (let x = Math.floor(x0 / cell); x <= Math.floor(x1 / cell); x++) for (let z = Math.floor(z0 / cell); z <= Math.floor(z1 / cell); z++) {
      const key = x + ',' + z; let bucket = grid.get(key); if (!bucket) grid.set(key, bucket = []); bucket.push(t);
    }
  }
}
ctx.staticRoot.traverse(mesh => {
  if (!mesh.isMesh || mesh.isInstancedMesh) return;
  if (mesh.name === 'env-ground') indexMesh(mesh, 'base');
  else if (/^pt-(?:asphalt|service|cobble|brickroad|slab|paver|strip|ramp|foot|steps|area|lots)/.test(mesh.name)) indexMesh(mesh, 'paving');
  else if (mesh.name === 'finlyandsky-bank-terrain') indexMesh(mesh, 'bank');
  else if (mesh.name === LENIN.id + '-masonry' || mesh.name === GROTTO.id + '-masonry') indexMesh(mesh, 'landing');
});
function drawnAt(group, x, z, ceiling = Infinity) {
  let y = -Infinity;
  for (const t of grids.get(group)?.get(Math.floor(x / cell) + ',' + Math.floor(z / cell)) || []) {
    const u = ((t[5] - t[8]) * (x - t[6]) + (t[6] - t[3]) * (z - t[8])) / t[9];
    const w = ((t[8] - t[2]) * (x - t[6]) + (t[0] - t[6]) * (z - t[8])) / t[9];
    // Float32 world vertices near x=2700 drift by fractions of a millimetre.
    if (u < -2e-4 || w < -2e-4 || u + w > 1.0002) continue;
    const h = u * t[1] + w * t[4] + (1 - u - w) * t[7];
    if (h <= ceiling && h > y) y = h;
  }
  return y;
}
check('the real bank and both landing modules build without errors', () => {
  assert.equal(errors.length, 0, errors.join('\n')); assert(bankItems.length > 500); assert(landingItems.length > 100);
  assert.equal(ctx.services.finlyandskyWaterfront.sites.length, 2);
});

check('the curved Lenin upper apron meets the street without a wet slit or unsupported strip', () => {
  let n=0;
  for(let i=0;i+1<LENIN_BACK.length;i++){
    const a=LENIN_BACK[i],b=LENIN_BACK[i+1],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.35);
    for(let j=0;j<steps;j++)for(const off of[-.18,.05,.3,.55]){
      const t=(j+.5)/steps,[x,z]=point(LENIN,a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+off);
      const drawn=Math.max(drawnAt('paving',x,z,.3),drawnAt('landing',x,z,.3),drawnAt('base',x,z,.3));
      assert(drawn>=-.01&&drawn<=.2,`uncovered kerb join ${x.toFixed(3)},${z.toFixed(3)}: ${drawn}`);
      assert(ph.groundHeight(x,z,.3,false)>=-.01,`unsupported kerb join ${x},${z}`);
      if(off<.3)assert.equal(ph.waterLevel(x,z),null,`water slit at dry upper edge ${x},${z}`);
      n++;
    }
  }
  console.log(`  ${n} street/slab join probes at<=0.35m intervals`);
});

check('the real car follows polygonal upper slabs instead of dropping to the Neva bed', () => {
  const car=createHandling(ctx),forward=LENIN.rot-Math.PI/2;
  for(const v of[-14,-16]){
    const start=point(LENIN,-28,v);car.reset(...start,forward);let min=car.y,max=car.y,falls=0;
    for(let i=0;i<240;i++){car.step(1/60,{thr:.3,brk:0,steer:0,hand:false,nitro:false});min=Math.min(min,car.y);max=Math.max(max,car.y);if(car.fall)falls++;}
    const distance=Math.hypot(car.x-start[0],car.z-start[1]);
    assert(distance>8,`car failed to travel the upper apron: ${distance}`);
    assert(min>=-.05&&max<.25&&falls===0,`car dropped through visible paving at v${v}: y${min}..${max}, ${falls} fall frames`);
    console.log(`  upper-apron car row ${v}: ${distance.toFixed(1)}m, y${min.toFixed(3)}..${max.toFixed(3)}, no fall`);
  }
  close(car.groundAt(176.3,-2314,.2),.03,'reported kerb coordinate remains supported',.12);
  assert(car.groundAt(176.3,-2311,.2)>=.08,'polygon slab next to reported kerb is ignored by car handling');
});

check('the Kresty descent approach has continuous dry granite above the old patchwork', () => {
  let n=0;
  for(let i=1;i+2<APRON_FRAMES.length;i++){
    const a=APRON_FRAMES[i],b=APRON_FRAMES[i+1];
    for(const d of[1.25,Math.min(a.width,b.width)-.8]){
      const x=(a.x+b.x)/2+a.nx*d,z=(a.z+b.z)/2+a.nz*d;
      close(drawnAt('bank',x,z,.3),APRON_Y,`upper granite at ${x.toFixed(2)},${z.toFixed(2)}`);
      close(L.heightAt(x,z),APRON_Y,'upper granite terrain');close(ph.groundHeight(x,z,.3,false),APRON_Y,'upper granite physics');
      assert(drawnAt('base',x,z,.3)<=APRON_Y-.01,'old painted ground covers the apron');
      assert.equal(ph.waterLevel(x,z),null,'dry granite is classified as water');n++;
    }
  }
  assert(n>90);console.log(`  ${n} independently drawn dry-granite approach probes`);
});

check('lower walk and green slope agree with visible triangles, terrain and Physics; no flat ground covers them', () => {
  let walk = 0, grass = 0;
  for (let i = 2; i + 2 < FRAMES.length; i += 2) {
    const a = FRAMES[i], b = FRAMES[i + 1], f = Object.fromEntries(['x', 'z', 'nx', 'nz', 'width', 'y'].map(k => [k, (a[k] + b[k]) / 2]));
    for (const [kind, d] of [['walk', Math.min(1.8, f.width / 2)], ...(a.green && b.green && f.width > WALK_WIDTH + 1 ? [['grass', (WALK_WIDTH + f.width) / 2]] : [])]) {
      const x = f.x + f.nx * d, z = f.z + f.nz * d; if (bankHeight(x, z) === null) continue;
      const drawn = drawnAt('bank', x, z), ground = L.heightAt(x, z), at = `(${x.toFixed(2)},${z.toFixed(2)}) ${kind}`;
      close(drawn, ground, at + ' visible/terrain'); close(ph.groundHeight(x, z, 30, false), ground, at + ' physics/terrain');
      assert(drawnAt('base', x, z) <= drawn + .025, at + ' hidden by old flat ground');
      assert(drawnAt('paving', x, z) <= drawn + .15, at + ' hidden by an old flat paving ribbon');
      if (kind === 'walk') { if (a.y === LOWER_Y && b.y === LOWER_Y) close(ground, LOWER_Y, at + ' lower datum'); else assert(ground >= LOWER_Y - .025 && ground <= .025, at + ' end ramp leaves its levels'); walk++; } else { assert(ground > f.y + .1 && ground < -.1, at + ' is not a real green slope'); grass++; }
    }
  }
  assert(walk > 100 && grass > 30, `insufficient coverage: ${walk} walk, ${grass} slope samples`);
  console.log(`  ${walk} lower-walk and ${grass} grass-slope samples`);
});

check('the lower promenade remains continuous through every bank segment and its end ramps', () => {
  let n = 0, previous = null;
  for (let i = 0; i + 1 < FRAMES.length; i++) {
    const a = FRAMES[i], b = FRAMES[i + 1], steps = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / .5));
    for (let j = 0; j < steps; j++) {
      const t = j / steps, x = a.x + (b.x - a.x) * t + (a.nx + (b.nx - a.nx) * t) * 1.8, z = a.z + (b.z - a.z) * t + (a.nz + (b.nz - a.nz) * t) * 1.8;
      if (bankHeight(x, z) === null) { previous = null; continue; }
      const y = ph.groundHeight(x, z, 30, false); close(drawnAt('bank', x, z), y, `path surface at ${x.toFixed(2)},${z.toFixed(2)}`);
      if (previous) assert(Math.abs(y - previous.y) < .16, `path discontinuity at ${x.toFixed(2)},${z.toFixed(2)}: ${previous.y} -> ${y}`);
      previous = { y }; n++;
    }
  }
  assert(n > 2500, `only ${n} continuous path samples`); console.log(`  ${n} samples at <=0.5m spacing`);
});

check('both landings have the common dry lower datum and correctly drawn walk floors', () => {
  close(LOWER_Y, NAVIGABLE_WATER_Y + 1.4, 'landing above Neva');
  for (const [site, probes] of [[LENIN, [[0,-14,UPPER_Y],[0,3,LOWER_Y],[-20,3,LOWER_Y]]], [GROTTO, [[0,-9.5,UPPER_Y],[0,-4,UPPER_Y],[0,9,LOWER_Y],[0,-2,LOWER_Y]]]]) {
    for (const [u, v, y] of probes) {
      const [x, z] = point(site, u, v), at = `${site.id} local ${u},${v}`;
      close(drawnAt('landing', x, z, y + .025), y, at + ' visible floor'); close(ph.groundHeight(x, z, y, false), y, at + ' physical floor');
      assert(L.heightAt(x, z) <= y + .025, at + ' has phantom higher terrain');
      assert(drawnAt('base', x, z) <= y + .025, at + ' base covers its floor');
    }
  }
  let n = 0;
  for (const it of [...bankItems, ...landingItems].filter(it => it.type === 'walk')) {
    assert(it.y0 < it.top, `inverted walk volume at ${it.cx},${it.cz}: ${it.y0}..${it.top}`);
    close(drawnAt(bankItems.includes(it) ? 'bank' : 'landing', it.cx, it.cz, it.top + .025), it.top, `walk box/visible floor at ${it.cx.toFixed(2)},${it.cz.toFixed(2)}`, .035); n++;
  }
  assert(n > 100); console.log(`  ${n} actual walk boxes match drawn floors`);
});

check('every bank barrier is breakable and the shore contains no permanent above-ground wall', () => {
  const solids = bankItems.filter(it => it.type === 'box' || it.type === 'cyl');
  assert(solids.length > 500);
  for (const it of solids) assert(it.source?.knock?.kind === 'fence', `permanent bank solid ${it.cx},${it.cz}`);
  const records = new Set(solids.map(it => it.source.knock));
  for (const r of records) assert(r.items.length && r.items.every(it => ph.items.includes(it)), `orphan bank fence ${r.x},${r.z}`);
  console.log(`  ${records.size} independently breakable bank bays`);
});

function walker(x, z, dx, dz) {
  const p = new Player(new THREE.PerspectiveCamera(), { addEventListener() {}, requestPointerLock() {} }, ph, L.WORLD.play);
  p.enabled = true; p.clampXZ = L.clampToPlay; p.solidAt = L.insideBuilding; p.smoothing = 0;
  p.setPose(x, z, Math.atan2(-dx, -dz) * 180 / Math.PI, 0); return p;
}
check('both six-metre boarding openings lead from the dry lower landing directly into reachable Neva water', () => {
  for (const site of [LENIN, GROTTO]) {
    const start = point(site, 0, site.front - 2), end = point(site, 0, site.front + 6), dx = (end[0] - start[0]) / 8, dz = (end[1] - start[1]) / 8;
    close(ph.groundHeight(...start, LOWER_Y, false), LOWER_Y, site.id + ' start');
    close(ph.waterLevel(...end), NAVIGABLE_WATER_Y, site.id + ' open water');
    const p = walker(...start, dx, dz); p.keys.add('KeyW');
    for (let t = 0; t < 5; t += 1 / 60) { p.time += 1 / 60; p.update(1 / 60); }
    assert(p.depth > .3 && p.onGround && p.pos.y < NAVIGABLE_WATER_Y - .3, `${site.id} blocked from water at ${p.pos.x},${p.pos.z},${p.pos.y}, depth ${p.depth}`);
    console.log(`  ${site.id}: entered Neva, depth ${p.depth.toFixed(2)}m`);
  }
});
check('a real lower-bank parapet stops the walker, then knocks down and opens the water', () => {
  const records = [...new Set(bankItems.map(it => it.source?.knock).filter(Boolean))];
  const r = records.filter(r => r.x > 2100 && r.x < 2400).sort((a, b) => Math.abs(a.x - 2250) - Math.abs(b.x - 2250))[0];
  assert(r, 'no lower-bank bay in the surveyed green reach');
  const f = FRAMES.reduce((a, b) => Math.hypot(a.x - r.x, a.z - r.z) < Math.hypot(b.x - r.x, b.z - r.z) ? a : b);
  const start = [r.x + f.nx * 1.8, r.z + f.nz * 1.8], run = () => {
    const p = walker(...start, -f.nx, -f.nz); p.keys.add('KeyW');
    for (let t = 0; t < 3; t += 1 / 60) { p.time += 1 / 60; p.update(1 / 60); }
    return p;
  };
  close(ph.groundHeight(...start, 30, false), LOWER_Y, 'lower-bank run-up');
  assert.equal(ph.waterLevel(...start), null, 'run-up must be dry');
  const before = run(); assert(before.depth < .01 && ph.waterLevel(before.pos.x, before.pos.z) === null, 'unbroken parapet did not stop the walker');
  const items = r.items.slice(); assert.equal(ctx.knock.hit(r.x, r.z, 45, -f.nx, -f.nz, 'fence'), r, 'hit selected bay');
  for (let t = 0; t < 4; t += 1 / 60) ctx.knock.update(1 / 60);
  assert(items.every(it => !ph.items.includes(it)), 'upright bay colliders remain after knock');
  const after = run(); assert(after.depth > .3 && after.onGround && after.pos.y < NAVIGABLE_WATER_Y - .3, `knocked bank bay still blocks water: depth ${after.depth}`);
  console.log(`  lower-bank bay (${r.x.toFixed(1)},${r.z.toFixed(1)}): stopped before, entered Neva after knock`);
});
console.log(`\nfinlyandsky-waterfront: ${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
