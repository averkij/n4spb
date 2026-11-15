import assert from 'node:assert/strict';
import { createSimulation } from './simulation.js';

const idle = { forward: false, back: false, left: false, right: false, run: false, jump: false };
const sim = await createSimulation();
const advance = (seconds, input = {}, yaw = 0) => { for (let i = 0; i < Math.round(seconds * 60); i++) sim.step({ ...idle, ...input }, yaw); };
const pose = (x, z) => { sim.person.setTranslation({ x, y: .92, z }, true); sim.person.setNextKinematicTranslation({ x, y: .92, z }); advance(.1); };
try {
  // Regression: wide thin-box floor contacts used to discard occasional steps,
  // flashing Idle and restarting the loop even with uninterrupted input.
  for (const run of [false, true]) {
    sim.reset(); pose(22,24);
    for (let frame=0; frame<1200; frame++) {
      sim.step({ ...idle, forward:true, run }, frame/60*.6);
      if (frame>30) {
        assert.equal(sim.state.animation, run ? 'Run' : 'Walk', `Uninterrupted locomotion at frame ${frame}`);
        assert(sim.state.speed > (run ? 7.7 : 2.6), 'Faster walking/running without dropped movement steps');
      }
    }
  }
  sim.reset();
  advance(.3);
  const startZ = sim.state.z; advance(1, { forward: true }); const straight = startZ - sim.state.z;
  sim.reset(); advance(.3); const start = { x: sim.state.x, z: sim.state.z }; advance(1, { forward: true, right: true });
  const diagonal = Math.hypot(sim.state.x - start.x, sim.state.z - start.z);
  assert(Math.abs(diagonal - straight) < .03, 'Diagonal input must not increase walking speed');
  sim.reset(); advance(.3); sim.jump(); advance(.25); assert(sim.state.y > .6, 'Jump rises');
  advance(1); assert(sim.state.grounded && Math.abs(sim.state.y) < .06, 'Jump lands at the floor');
  sim.reset();advance(.3);sim.jump();advance(.08);assert.equal(sim.state.jump.phase,'anticipation');assert(sim.state.grounded&&sim.state.y<.06,'Anticipation precedes the physics impulse');
  advance(.14);assert.equal(sim.state.jump.phase,'air');assert(!sim.state.grounded&&sim.state.y>.3);advance(.8);assert.equal(sim.state.jump,null);
  sim.reset(); pose(-10, -7); advance(2, { forward: true }); assert(sim.state.z > -8.55, 'Capsule stops at wall');
  assert(sim.cameraFraction({ x: -10, y: 1.2, z: -8 }, { x: 0, y: .5, z: -5 }) < .15, 'Camera is blocked by wall');
  assert.equal(sim.cameraFraction({ x: 0, y: 1.2, z: 5 }, { x: 0, y: 1, z: 4 }), 1, 'Camera is unobstructed at spawn');
  sim.reset(); assert.equal(sim.enterExit(), false, 'Cannot enter a distant car');
  pose(2.2, 1); assert(sim.enterExit());advance(4);assert.equal(sim.state.mode,'drive'); advance(3, { forward: true });
  assert(sim.state.carSpeed > 10, 'Car reaches driving speed'); assert.equal(sim.enterExit(), false, 'Cannot exit at speed');
  advance(2, { jump: true }); assert(Math.abs(sim.state.carSpeed) < .2, 'Handbrake stops the car');
  assert(sim.enterExit(), 'Can exit when stopped');
  sim.reset(); pose(2.2, 1); sim.enterExit();advance(4); advance(10, { forward: true });
  assert(sim.state.carZ > -45.1, 'Car cannot tunnel through boundary at full throttle');
  sim.reset(); assert.equal(sim.state.mode, 'foot'); assert(Math.abs(sim.state.x) < .01 && Math.abs(sim.state.z - 5) < .01);
  for(const index of [1,2]){
    sim.reset();const car=sim.vehicles[index];pose(car.x-1.7,car.z+.6);assert(sim.enterExit());assert.equal(sim.state.mode,'enter');
    const phases=new Set();let previous={x:sim.state.x,z:sim.state.z},maxStep=0;
    for(let i=0;i<480;i++){
      if(sim.state.interaction)phases.add(sim.state.interaction.phase);
      if(i===40)assert.equal(sim.enterExit(),false,'Repeated E cannot restart entry');
      sim.step({...idle,forward:true},0);
      if(sim.state.mode==='enter')maxStep=Math.max(maxStep,Math.hypot(sim.state.x-previous.x,sim.state.z-previous.z));
      previous={x:sim.state.x,z:sim.state.z};
      if(sim.state.mode==='drive')break;
    }
    assert.equal(sim.state.mode,'drive');assert.equal(car.occupied,false);assert(car.npcTime>0);
    for(const phase of ['approach','open','reach','extract','recover','climb','close','settle'])assert(phases.has(phase),phase);
    assert(maxStep<.13,`No entry teleport: ${maxStep}`);assert.equal(car.door,0);
    assert.equal(sim.vehicles.filter(v=>!v.occupied&&v.spec.occupied).length,1,'Other driver stays in their car');
    assert(sim.enterExit());assert.equal(sim.state.mode,'exit');advance(3);assert.equal(sim.state.mode,'foot');
    assert(sim.capsule.isEnabled());assert.equal(car.door,0);
    assert(sim.enterExit());advance(4);assert.equal(sim.state.mode,'drive','Can reenter the now-empty car');
  }
  sim.reset();pose(11.7,1.5);assert(sim.enterExit());advance(9);assert.equal(sim.state.mode,'drive','Approach from passenger side routes around the car');
  sim.reset();pose(10,-2);assert(sim.enterExit());
  for(let i=0;i<480&&sim.state.mode!=='drive';i++){
    advance(1/60);
    if(sim.state.interaction?.phase==='approach')assert(Math.abs(sim.state.x-10)>.94||Math.abs(sim.state.z-1)>2.12,'Front approach does not cut through the bonnet');
  }
  assert.equal(sim.state.mode,'drive');
  sim.reset();assert(sim.vehicles[1].occupied&&sim.vehicles[2].occupied);assert(sim.vehicles.every(v=>v.door===0&&v.npcTime===-1));
  console.log('PASS: diagonal speed, jump/landing, wall collision, camera sweep, vehicle proximity, acceleration, safe exit, handbrake, high-speed boundary collision, reset');
} finally { sim.dispose(); }
