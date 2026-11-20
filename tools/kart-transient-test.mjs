// Real handling on flat asphalt: path curvature, brake-first turn-in and release.
import assert from 'node:assert/strict';
import { Physics } from '../src/core/physics.js';
import { createHandling } from '../src/world/drive/handling.js';
import { createKart } from '../src/world/karting/karts.js';
const ctx = { physics: new Physics(() => 0), services: {},
  L: { WORLD: { play: {} }, inPlay: () => true, heightAt: () => 0, insideBuilding: () => false } };
function vehicle(id, kmh) {
  const def=createKart(ctx,id,{}), c=createHandling(ctx,{...def.tuning,roughnessAt:()=>0});
  c.reset(0,0,0); c.vz=kmh/3.6; return c;
}
function run(c, seconds, {thr=0,brk=0,steer=0}, fps=60) {
  const n=Math.round(seconds*fps), gains=[]; let peakSlip=0;
  for(let i=0;i<n;i++) {
    const heading=Math.atan2(c.vx,c.vz), speed=Math.hypot(c.vx,c.vz);
    c.step(1/fps,{thr,brk,steer});
    const delta=Math.atan2(Math.sin(Math.atan2(c.vx,c.vz)-heading),Math.cos(Math.atan2(c.vx,c.vz)-heading));
    const ideal=Math.tan(c.steerAngle)/c.spec.wb;
    if(i>=n-Math.max(1,Math.round(fps*.1)) && Math.abs(ideal)>.002) gains.push(delta*fps/Math.max(.1,speed)/ideal);
    peakSlip=Math.max(peakSlip,Math.atan2(Math.abs(c.vL),Math.abs(c.vF)));
    assert.ok(Math.abs(c.aLat)<=1.2*9.81+1e-6,'flat asphalt exceeds the 1.2g force limit');
  }
  return {gain:gains.length?gains.reduce((a,b)=>a+b)/gains.length:null,peakSlip,
    slip:Math.atan2(Math.abs(c.vL),Math.abs(c.vF)),speed:c.speed,yaw:c.yaw};
}
const gasRatios=[],trailAngles=[];
function powerExit(id, sign, pulse, fps=60) {
  const c=vehicle(id,55);run(c,.4,{brk:1},fps);run(c,.5,{brk:1,steer:sign*.6},fps);
  let peak=0, atTwoTenths=0;
  for(let i=0;i<Math.round(fps*1.5);i++) {
    run(c,1/fps,{thr:i/fps<pulse?1:0,steer:sign*.6},fps);
    const angle=Math.atan2(Math.abs(c.vL),Math.abs(c.vF));peak=Math.max(peak,angle);
    if(i===Math.round(.2*fps)-1)atTwoTenths=angle;
  }
  return {peak,atTwoTenths};
}
function catchSlide(id,sign,fps=60,throttle=0,trigger=.21) {
  const c=vehicle(id,72);run(c,.4,{brk:1},fps);
  let frames=0;
  while(Math.abs(Math.atan2(c.vL,c.vF))<trigger && frames++<fps*2)run(c,1/fps,{brk:1,steer:sign*.6},fps);
  assert.ok(frames<fps*2,`${id}: could not reproduce the brake-induced slide`);
  let peak=0, settled=null, wheelRange=0;
  for(let i=0;i<fps;i++) {
    const motion=Math.atan2(c.vL+c.tyreYaw*c.spec.wb*.58,Math.max(2.2,Math.abs(c.vF)));
    const steer=Math.max(-1,Math.min(1,(motion-.12*c.tyreYaw)/c.tuning.steerLock));
    run(c,1/fps,{thr:throttle,steer},fps);
    const slip=Math.abs(Math.atan2(c.vL,c.vF));peak=Math.max(peak,slip);
    wheelRange=Math.max(wheelRange,Math.abs(c.steerAngle));
    if(settled===null && slip<.0524 && Math.abs(c.tyreYaw)<.2)settled=(i+1)/fps;
  }
  assert.ok(peak<trigger+.09 && settled!==null && settled<.85,`${id}: timely countersteer cannot catch the braking slide (${peak}, ${settled})`);
  if(trigger>.3)assert.ok(wheelRange>.23,'the speed comfort limiter still blocks the wheel angle needed to catch the slide');
  assert.ok(Math.abs(c.tyreYaw)<.12 && Math.abs(c.vL)<.2,`${id}: countersteer leaves a continuing rotation`);
  return settled;
}
const recoveries=[];
for(const fleet of ['rental','club']) for(let number=1;number<=10;number++) {
  const id=`narvskaya-${fleet}-${number}`;
  const straight=vehicle(id,0);run(straight,5,{thr:1});
  assert.ok(Math.abs(straight.yaw)<1e-9 && Math.abs(straight.vL)<1e-9,`${id}: sustained straight-line power invents a spin`);
  for(const sign of [-1,1]) {
    for(const [speed,steer,seconds]of [[0,.6,2],[40,.25,3],[40,.6,3]]) {
      const normal=vehicle(id,speed);let maximum=0;
      for(let i=0;i<seconds*60;i++) {
        run(normal,1/60,{thr:1,steer:sign*steer});
        if(Math.hypot(normal.vx,normal.vz)>3)maximum=Math.max(maximum,Math.abs(Math.atan2(normal.vL,normal.vF)));
      }
      assert.ok(maximum<.16,`${id}: normal powered corner/launch develops an unwanted spin (${maximum})`);
    }
    for(const [kmh,minimum] of [[15,.94],[25,.90],[35,.84]]) {
      const c=vehicle(id,kmh), before=run(c,1,{steer:sign*.25}), after=run(c,.3,{thr:1,steer:sign*.25});
      const ratio=after.gain/before.gain;
      assert.ok(ratio>minimum,`${id} ${kmh}km/h: throttle abruptly widens a lightly loaded turn (${ratio})`);
      if(kmh===15)assert.ok(after.gain>.90,`${id}: low-speed steering should remain close to the wheel's geometric arc`);
      gasRatios.push(ratio);
      const b=vehicle(id,kmh);run(b,.75,{steer:sign*.25});run(b,.2,{brk:1,steer:sign*.25});
      const exit=run(b,.3,{thr:1,steer:sign*.25});
      assert.ok(exit.gain>(kmh===35?.78:.88),`${id}: low-speed brake-to-gas loses the requested turn (${exit.gain})`);
    }
    const c=vehicle(id,72);
    run(c,.4,{brk:1});
    assert.ok(Math.abs(c.yaw)<1e-9 && Math.abs(c.vL)<1e-9,`${id}: straight braking invents a yaw kick`);
    const trail=run(c,.5,{brk:1,steer:sign*.3});
    assert.ok(trail.peakSlip>.096 && trail.peakSlip<.25,`${id}: brake-first turn-in must produce controlled 5.5–14 degree rotation (${trail.peakSlip})`);
    assert.ok(c.yaw*sign>.15,`${id}: trail braking turns away from the requested corner`);
    trailAngles.push(trail.peakSlip*180/Math.PI);
    const low=vehicle(id,15), high=vehicle(id,72);
    const lowTurn=run(low,1,{steer:sign*.25}), highTurn=run(high,1,{steer:sign*.25});
    assert.ok(lowTurn.gain>highTurn.gain*1.7,`${id}: high-speed grip saturation must remain speed dependent`);
    const coastExit=powerExit(id,sign,0), tapExit=powerExit(id,sign,.08), heldExit=powerExit(id,sign,1.5);
    assert.ok(tapExit.peak<.20 && heldExit.peak<.20,`${id}: throttle after a modest braking slide invents a self-sustaining spin`);
    assert.ok(heldExit.atTwoTenths<.15 && coastExit.peak<.20,`${id}: rear grip does not recover after brake release`);
    recoveries.push(catchSlide(id,sign));
    recoveries.push(catchSlide(id,sign,60,1));
  }
}
const frameResults=[];
for(const fps of [30,60,120]) {
  const c=vehicle('narvskaya-club-1',72);run(c,.4,{brk:1},fps);
  frameResults.push(run(c,.5,{brk:1,steer:.3},fps));
}
for(const r of frameResults)assert.ok(Math.abs(r.peakSlip-frameResults[1].peakSlip)<.015 && Math.abs(r.yaw-frameResults[1].yaw)<.025,'trail braking depends on render frame rate');
const catchFrames=[30,60,120].map(fps=>catchSlide('narvskaya-club-1',1,fps));
for(const seconds of catchFrames)assert.ok(Math.abs(seconds-catchFrames[1])<.1,'countersteer recovery depends on render frame rate');
catchSlide('narvskaya-club-1',1,60,0,.31);
const resetKart=vehicle('narvskaya-club-1',55);
run(resetKart,.4,{brk:1});run(resetKart,.5,{brk:1,steer:.6});run(resetKart,1,{thr:1,steer:.6});
resetKart.reset(0,0,0);resetKart.vz=40/3.6;
const freshKart=vehicle('narvskaya-club-1',40);
run(resetKart,.5,{thr:1,steer:.6});run(freshKart,.5,{thr:1,steer:.6});
assert.ok(Math.abs(resetKart.yaw-freshKart.yaw)<1e-6 && Math.abs(resetKart.vL-freshKart.vL)<1e-6,'respawn retains the previous braking/slide state');
console.log(`PASS all 20 karts, both steering directions: low-speed throttle/brake-to-gas curvature, progressive brake-first rotation, straight-brake stability, 1.2g and 30/60/120Hz`);
console.log(`Throttle curvature retention ${Math.min(...gasRatios).toFixed(3)}–${Math.max(...gasRatios).toFixed(3)}; brake-first rear slip ${Math.min(...trailAngles).toFixed(1)}–${Math.max(...trailAngles).toFixed(1)} degrees`);
console.log(`Normal throttle/launch stays stable; countersteer catches the braking slide in ${Math.min(...recoveries).toFixed(2)}–${Math.max(...recoveries).toFixed(2)} s, including with power`);
