import RAPIER from './vendor/rapier.mjs';

export const WALK = 2.7, RUN = 8, STEP = 1 / 60;
export const obstacles = [
  { x: -9, y: 1.9, z: -9, w: 10, h: 3.8, d: .5, kind: 'wall' },
  { x: -14, y: 1.9, z: -5.5, w: .5, h: 3.8, d: 7, kind: 'wall' },
  { x: -7, y: .22, z: -1, w: 2.5, h: .44, d: 2.5, kind: 'step' },
  { x: -7, y: .46, z: -3.5, w: 2.5, h: .92, d: 2.5, kind: 'step' },
  { x: -7, y: .7, z: -6, w: 2.5, h: 1.4, d: 2.5, kind: 'step' },
  { x: 0, y: .75, z: -47.5, w: 96, h: 1.5, d: 1, kind: 'boundary' },
  { x: 0, y: .75, z: 47.5, w: 96, h: 1.5, d: 1, kind: 'boundary' },
  { x: -47.5, y: .75, z: 0, w: 1, h: 1.5, d: 94, kind: 'boundary' },
  { x: 47.5, y: .75, z: 0, w: 1, h: 1.5, d: 94, kind: 'boundary' },
];
const identity = { x: 0, y: 0, z: 0, w: 1 };
const angleDelta = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

export async function createSimulation() {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -20, z: 0 });
  world.timestep = STEP;
  // An exact plane avoids GJK contact-normal noise from a very wide, thin box.
  // That noise occasionally discarded the entire horizontal capsule step.
  world.createCollider(new RAPIER.ColliderDesc(new RAPIER.HalfSpace({ x: 0, y: 1, z: 0 })).setFriction(.8));
  for (const b of obstacles) world.createCollider(RAPIER.ColliderDesc.cuboid(b.w / 2, b.h / 2, b.d / 2).setTranslation(b.x, b.y, b.z));
  const person = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, .92, 5));
  const capsule = world.createCollider(RAPIER.ColliderDesc.capsule(.6, .28), person);
  const controller = world.createCharacterController(.025);
  controller.enableAutostep(.3, .2, false);
  controller.enableSnapToGround(.25);
  controller.setMaxSlopeClimbAngle(Math.PI / 4);
  const car = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(4, .84, 1).enabledRotations(false, true, false).setCcdEnabled(true).setLinearDamping(.2));
  // Tire grip is resolved by the planar controller below. A low minimum contact
  // friction avoids the broad chassis/floor contact cancelling engine acceleration.
  const carCollider = world.createCollider(RAPIER.ColliderDesc.cuboid(.98, .8, 2.12).setMass(950).setFriction(.02).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min).setRestitution(.03), car);
  const state = { mode: 'foot', x: 0, y: 0, z: 5, yaw: 0, vx: 0, vz: 0, vy: 0, speed: 0, grounded: true, carX: 4, carY: 0, carZ: 1, carYaw: 0, carSpeed: 0, steering: 0, animation: 'Idle', message: '', messageTime: 0, distance: 0 };
  const exitShape = new RAPIER.Capsule(.6, .28);
  const cameraShape = new RAPIER.Ball(.19);
  let jumpQueued = false;
  const tell = text => { state.message = text; state.messageTime = 2; };
  function sync() {
    const p = person.translation(), c = car.translation(), q = car.rotation();
    state.carX = c.x; state.carY = c.y - .8; state.carZ = c.z;
    state.carYaw = 2 * Math.atan2(q.y, q.w);
    if (state.mode === 'foot') { state.x = p.x; state.y = p.y - .88; state.z = p.z; }
    else { state.x = c.x; state.y = c.y - .8; state.z = c.z; }
  }
  function reset() {
    state.mode = 'foot'; state.vx = state.vz = state.vy = state.speed = state.yaw = state.carSpeed = state.steering = 0;
    state.animation = 'Idle'; state.grounded = true; state.distance = 0; jumpQueued = false;
    capsule.setEnabled(true);
    person.setTranslation({ x: 0, y: .92, z: 5 }, true);
    person.setNextKinematicTranslation({ x: 0, y: .92, z: 5 });
    car.setTranslation({ x: 4, y: .84, z: 1 }, true); car.setRotation(identity, true);
    car.setLinvel({ x: 0, y: 0, z: 0 }, true); car.setAngvel({ x: 0, y: 0, z: 0 }, true);
    world.step(); sync();
  }
  function enterExit() {
    if (state.mode === 'foot') {
      if (Math.hypot(state.x - state.carX, state.z - state.carZ) > 3.8) { tell('Move closer to the car to enter'); return false; }
      state.mode = 'drive'; capsule.setEnabled(false); state.vx = state.vz = state.vy = 0; state.animation = 'Sitting';
      sync(); return true;
    }
    if (Math.abs(state.carSpeed) > 1.5) { tell('Stop the car before getting out'); return false; }
    for (const side of [-1, 1]) {
      const x = state.carX + Math.cos(state.carYaw) * 1.85 * side;
      const z = state.carZ - Math.sin(state.carYaw) * 1.85 * side;
      let blocked = false;
      world.intersectionsWithShape({ x, y: 1.02, z }, identity, exitShape, () => { blocked = true; return false; }, undefined, undefined, capsule, car);
      if (blocked) continue;
      state.mode = 'foot'; state.yaw = state.carYaw; state.vy = state.vx = state.vz = 0; state.animation = 'Idle';
      person.setTranslation({ x, y: 1.02, z }, true); person.setNextKinematicTranslation({ x, y: 1.02, z }); capsule.setEnabled(true);
      car.setLinvel({ x: 0, y: car.linvel().y, z: 0 }, true); car.setAngvel({ x: 0, y: 0, z: 0 }, true);
      sync(); return true;
    }
    tell('Both doors are blocked. Move the car into open space.'); return false;
  }
  function step(input, cameraYaw) {
    state.messageTime = Math.max(0, state.messageTime - STEP);
    const forward = Number(input.forward) - Number(input.back), sideways = Number(input.right) - Number(input.left);
    if (state.mode === 'foot') {
      let dx = -Math.sin(cameraYaw) * forward + Math.cos(cameraYaw) * sideways;
      let dz = -Math.cos(cameraYaw) * forward - Math.sin(cameraYaw) * sideways;
      const length = Math.hypot(dx, dz); if (length > 1) { dx /= length; dz /= length; }
      const speed = input.run ? RUN : WALK, response = 1 - Math.exp(-14 * STEP);
      state.vx += (dx * speed - state.vx) * response; state.vz += (dz * speed - state.vz) * response;
      if (jumpQueued && state.grounded) { state.vy = 6.5; state.grounded = false; }
      jumpQueued = false;
      state.vy = Math.max(-30, state.vy - 20 * STEP);
      const before = person.translation();
      controller.computeColliderMovement(capsule, { x: state.vx * STEP, y: state.vy * STEP, z: state.vz * STEP });
      const delta = controller.computedMovement();
      state.grounded = controller.computedGrounded();
      if (state.grounded && state.vy < 0) state.vy = -.5;
      person.setNextKinematicTranslation({ x: before.x + delta.x, y: before.y + delta.y, z: before.z + delta.z });
      state.speed = Math.hypot(delta.x, delta.z) / STEP;
      state.distance += state.speed * STEP;
      if (Math.hypot(state.vx, state.vz) > .15) state.yaw += angleDelta(state.yaw, Math.atan2(-state.vx, -state.vz)) * (1 - Math.exp(-14 * STEP));
      state.animation = !state.grounded ? (state.speed > WALK * 1.2 ? 'RunningJump' : 'Jump') : state.speed < .12 ? 'Idle' : state.speed > WALK * 1.2 ? 'Run' : 'Walk';
      // A parked car settles naturally, without rolling away on level ground.
      const v = car.linvel(); car.setLinvel({ x: v.x * .94, y: v.y, z: v.z * .94 }, true);
      car.setAngvel({ x: 0, y: 0, z: 0 }, true);
    } else {
      const v = car.linvel(), yaw = state.carYaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      let speed = v.x * fx + v.z * fz;
      const braking = forward && Math.sign(forward) !== Math.sign(speed) && Math.abs(speed) > .4;
      speed += forward * (braking ? 15 : forward < 0 ? 5 : 8) * STEP;
      speed *= Math.exp(-(input.jump ? 5 : forward ? .12 : .9) * STEP);
      speed = Math.max(-7, Math.min(23, speed));
      const lateral = (v.x * rx + v.z * rz) * Math.exp(-(input.jump ? 2.5 : 12) * STEP);
      car.setLinvel({ x: fx * speed + rx * lateral, y: v.y, z: fz * speed + rz * lateral }, true);
      state.steering += (-sideways - state.steering) * (1 - Math.exp(-9 * STEP));
      const turning = state.steering * speed / (3.8 + Math.abs(speed) * .65);
      car.setAngvel({ x: 0, y: turning, z: 0 }, true);
      state.speed = Math.abs(speed); state.animation = 'Sitting';
    }
    world.step(); sync();
    const v = car.linvel(); state.carSpeed = -Math.sin(state.carYaw) * v.x - Math.cos(state.carYaw) * v.z;
    if (state.y < -8 || Math.abs(state.x) > 70 || Math.abs(state.z) > 70) reset();
  }
  // Sweep a sphere, not just a ray: the camera's near plane also needs clearance.
  function cameraFraction(origin, delta) {
    const hit = world.castShape(origin, identity, delta, cameraShape, .04, 1, true, undefined, undefined, capsule, state.mode === 'drive' ? car : undefined);
    return hit ? Math.max(0, hit.time_of_impact - .025) : 1;
  }
  world.step(); sync();
  return { state, step, reset, enterExit, cameraFraction, jump() { jumpQueued = true; }, dispose() { world.free(); }, world, person, car, capsule, carCollider };
}
