// Cosmetic deformation invariants on a private mesh; real car rendering is covered
// by drive-collision-browser.mjs using the production drive module in a small yard.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCarDamage, deformPoint, DURABILITY_MULTIPLIER } from '../src/world/drive/damage.js';
import { bindCarImpact } from '../src/world/traffic/impact.js';
const root = new THREE.Group();
const g = new THREE.BoxGeometry(1.82, 1, 4.14, 4, 3, 12).toNonIndexed(); g.translate(0, .65, .05);
const colors = new Float32Array(g.attributes.position.count * 3).fill(.6); g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const body = new THREE.Mesh(g, new THREE.MeshBasicMaterial()); root.add(body);
const original = g.attributes.position.array.slice(), originalColor = colors.slice(), originalNormals = g.attributes.normal.array.slice();
const damage = createCarDamage({ root, body });
damage.hit({ type: 'scrape', v: 1 }); assert.deepEqual(g.attributes.position.array, original);
damage.hit({ type: 'hit', v: 35, localX: .7, localZ: 2.1, localNX: 0, localNZ: -1 });
assert(Math.abs(damage.amount - (35-3)/(45*DURABILITY_MULTIPLIER))<1e-9,'50% larger impact budget');
assert(damage.amount > .3 && damage.smoke === 0,'More durable body has not reached the smoke threshold after one hit'); assert.notDeepEqual(g.attributes.position.array, original); assert.notDeepEqual(colors, originalColor);
let untouched = 0;
for (let i = 0; i < original.length; i += 3) if (original[i + 2] < -1) { assert.equal(g.attributes.position.array[i + 2], original[i + 2]); untouched++; }
assert(untouched > 0, 'unhit rear stays intact');
for (let i = 0; i < 50; i++) damage.hit({ type: 'hit', v: 60, localX: .7, localZ: 2.1, localNX: 0, localNZ: -1 });
for (let i = 0; i < original.length; i++) assert(Math.abs(g.attributes.position.array[i] - original[i]) < 1.05);
assert.equal(damage.amount, 1); assert(Math.abs(damage.smoke - 1) < 1e-9);
damage.repair(); assert.equal(damage.amount, 0); assert.equal(damage.smoke, 0);assert.deepEqual(g.attributes.position.array, original);assert.deepEqual(colors, originalColor);
assert.deepEqual(g.attributes.normal.array, originalNormals);
damage.hit({type:'hit',v:60});assert.equal(damage.amount,0,'map boundaries do not dent the car');
const vehicle = { v: 14 }, box = { rotY: Math.PI / 2 };bindCarImpact(box, vehicle, 5);box.onCarHit(12);
assert.equal(vehicle.v, 0);assert.equal(vehicle.brake, true);assert.equal(vehicle.collisionUntil, 5.8);assert.equal(box.vx,0);
// A fully crushed front/back must retain vertex order, rather than folding metal
// through itself. Duplicate positions map identically regardless of mesh identity.
const spec={W:1.82,front:2.12,rear:-2.02,hgt:1.3,wb:2.62};
const wreck={front:1,rear:1,left:1,right:1};
for(const x of [-.91,0,.91])for(const y of [.3,.7,1]){
 let previous=-Infinity;
 for(let z=-2.02;z<=2.12;z+=.01){const p=deformPoint({x,y,z},wreck,spec);assert(p.z>previous,'no inverted longitudinal folds');previous=p.z;}
}
console.log('PASS maximum-damage shell mapping stays monotonic');
console.log('PASS localized dents, scuffs, bounded repeated damage, front smoke, exact repair and traffic reaction');
