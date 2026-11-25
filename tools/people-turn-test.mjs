// Drive the crowd renderer with a steady corner and with alternating steering
// ticks. Capture the same yaw and turn rate that pose the rider and vehicle.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createSim, STEP } from '../src/world/people/sim.js';

const camera = new THREE.PerspectiveCamera();
const nav = { N: { x: [] }, E: [], PAVE: .12, surfaceY: (x, z, y) => y };
const angle = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

for (const vehicle of [null, 'bike', 'escooter', 'kick']) {
  let pose;
  const crowd = { add: () => 0, render: (i, state) => { pose = { ...state }; }, endFrame() {} };
  const ctx = { THREE, camera, L: {}, services: {}, rng: () => () => .5 };
  const sim = createSim(ctx, nav, crowd);
  const agent = sim.spawn({ r: .4, speed: 4, vehicle });
  sim.place(agent, 0, -5, Math.PI - .15);
  agent.speed = agent.pspeed = 4;
  sim.render(0);
  agent.yaw = -Math.PI + .15;
  let previous = pose.yaw;
  for (let i = 1; i <= 30; i++) {
    sim.render(i / 60);
    const delta = angle(pose.yaw, previous);
    assert(delta >= 0 && delta < .06, 'Take the short path across the angle wrap');
    previous = pose.yaw;
  }
  assert(Math.abs(angle(pose.yaw, agent.yaw)) < .02, 'The visible heading catches up to the turn');

  const samples = [];
  for (let tick = 0; tick < 20; tick++) {
    agent.tu = .5 + tick * STEP;
    agent.pyaw = agent.yaw;
    agent.yaw = (tick % 2 ? -.2 : .2) - Math.PI;
    for (let frame = 1; frame <= 6; frame++) {
      sim.render(agent.tu + frame / 60);
      if (tick > 10) samples.push({ yaw: angle(pose.yaw, -Math.PI), turn: pose.turn });
    }
  }
  assert(samples.every(sample => Math.abs(sample.yaw) < .115), `${vehicle || 'walker'}: damp quick heading reversals`);
  assert(samples.every(sample => Math.abs(sample.turn) < .65), `${vehicle || 'walker'}: damp quick banking reversals`);
  sim.place(agent, 2, -5, Math.PI / 2);
  sim.render(2.6);
  assert.equal(pose.yaw, Math.PI / 2, 'Placement resets the displayed heading immediately');
}
console.log('PASS: smooth heading wrap, damped steering and banking for walkers, cyclists and scooter riders');
