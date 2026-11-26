// node tools/area.mjs palace tools/winter-palace-festival-test.mjs
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { Player } from '../src/core/player.js';
import { createInteract } from '../src/core/ui.js';
import { buildPalaceFestival } from '../src/world/winter-palace-square.js';

const { ctx, L, THREE, errors } = await buildWorld({ modules: ['streets', 'landmarksG'], season: 'winter' });
assert.deepEqual(errors, []);
const player = new Player(ctx.camera, { addEventListener() {} }, ctx.physics, L.WORLD.play);
player.enabled = true;
let stamped = '';
ctx.ui = { toast(text) { stamped = text; } };
ctx.interact = createInteract({ camera: ctx.camera, player, ui: ctx.ui, doc: null });
buildPalaceFestival(ctx, new THREE.MeshBasicMaterial({ vertexColors: true }));

const slide = ctx.dynamicRoot.getObjectByName('palace-christmas-slide');
assert(slide, 'the slide fits the staff pavement');
const yaw = slide.rotation.y, forwardYaw = 180 + yaw * 180 / Math.PI;
assert(ctx.dynamicRoot.getObjectByName('palace-snow-globe'));
for (const lane of [-1.5, 0, 1.5]) {
  const start = slide.localToWorld(new THREE.Vector3(lane, 0, -21));
  player.setPose(start.x, start.z, forwardYaw, 0, 0.1, { stand: true });
  player.keys.add('KeyW');
  let height = 0, coasted = false, travelled = 0;
  for (let i = 0; i < 1500 && travelled < 65; i++) {
    player.update(1 / 60);
    const local = slide.worldToLocal(player.pos.clone());
    assert(Math.abs(local.x - lane) < 0.10, 'a permanent lamp or barrier deflected the rider');
    height = Math.max(height, player.pos.y);
    travelled = local.z;
    if (travelled > 0.5) { player.keys.clear(); coasted = true; }
  }
  assert(height >= 8 && coasted && travelled >= 65, 'climb the steps and coast to the end of each lane');
  assert(player.pos.y < 0.3);
}

const mailbox = ctx.dynamicRoot.getObjectByName('palace-post-box');
const { x, z } = mailbox.position;
player.setPose(x, z + 1.05, 0, 0, 0.1, { stand: true });
assert.equal(ctx.interact.update()?.id, 'palace-holiday-post');
assert(ctx.interact.use());
assert.match(stamped, /штемпель/);
assert.equal(ctx.knock.hit(x, z, 32, 1, 0, 'post-box')?.state, 'fly');
assert.equal(ctx.interact.update(), null, 'knocking over the post box disables its prompt');
console.log('PASS: three clear rides, posted a card, knocked the box out of service');
