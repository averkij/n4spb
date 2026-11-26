import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Physics} from '../src/core/physics.js';
import {Player} from '../src/core/player.js';
import {JUMPS,jumpClipTime} from '../src/world/character/jump-timing.js';
import {loadCharacterChoice,saveCharacterChoice,CHARACTER_STORAGE_KEY} from '../src/world/character/settings.js';

const keys=new EventTarget();
globalThis.addEventListener=keys.addEventListener.bind(keys);
const key=(type,code,options={})=>{
 const e=Object.assign(new Event(type,{cancelable:true}),{code,...options});
 keys.dispatchEvent(e);
 return e.defaultPrevented;
};
const listeners=new Map();
const dom={addEventListener(type,listener){listeners.set(type,listener);},requestPointerLock(){}},bounds={x0:-100,z0:-100,x1:100,z1:100};
const physics=new Physics(()=>0,()=>null),camera=new THREE.PerspectiveCamera(60,1,.1,500);
const player=new Player(camera,dom,physics,bounds);player.enabled=true;player.setPose(0,0);
const step=(seconds)=>{for(let i=0;i<Math.round(seconds*60);i++)player.update(1/60);};
assert.equal(player.view,0);assert(camera.position.distanceTo(player.pos)>4.5,'Default camera shows the character');
player.cycleView();assert.equal(player.view,1);assert(camera.position.distanceTo(player.pos)>7,'Second view is farther');
player.cycleView();assert.equal(player.view,2);assert(Math.abs(camera.position.y-player.eye)<.01);assert.equal(camera.position.x,0);assert.equal(camera.position.z,0);
player.cycleView();const wall=physics.addBox(0,2,5,.4,0,0,5);player.applyCamera(0);assert(camera.position.z<1.7,'Chase camera contracts before a wall');physics.remove(wall);
step(.5);assert(camera.position.z>4.3,'Camera extends after obstruction clears');

const wheel=(deltaY,options={})=>{
 let consumed=false;
 listeners.get('wheel')({deltaY,deltaMode:0,preventDefault(){consumed=true;},...options});
 return consumed;
};
assert(wheel(-1000));step(.5);assert.equal(player.cameraZoom,.5);assert(Math.abs(camera.position.z-2.3)<.01);
assert(wheel(1000));step(1);assert.equal(player.cameraZoom,1.5);assert(Math.abs(camera.position.z-6.9)<.01);
player.setView(1);assert(Math.abs(camera.position.z-10.8)<.01,'Far camera uses the same zoom range');
player.setView(2);assert(!wheel(-1000));assert.equal(player.cameraZoom,1.5);
player.setView(1);player.inputLock=1;assert(!wheel(-1000));player.inputLock=0;
assert(!wheel(-1000,{ctrlKey:true}),'Browser pinch zoom is left alone');
player.setPose(0,0,0,85);
assert(camera.position.y>=.299&&camera.position.z<5,'Low camera retracts before crossing the terrain');
player.setPose(0,0);assert(camera.position.z>10,'An unobstructed chase view recovers its selected zoom');
const underground=physics.addWalkBox(0,0,30,30,0,-10,-11);
player.setPose(0,0,0,85,-10,{stand:true});
assert(camera.position.y>-10&&camera.position.y<-9,'Underground camera follows the local floor');
physics.remove(underground);
player.cameraZoom=1;player.setView(0);

for(const running of [false,true]){
 player.setPose(0,0);player.keys.clear();if(running){player.keys.add('KeyW');player.keys.add('ShiftLeft');step(.5);}
 assert(player.requestJump());const clip=running?'RunningJump':'Jump',trace=[];
 for(let i=0;i<90;i++){player.update(1/60);trace.push({y:player.pos.y,onGround:player.onGround,jump:player.jump?{...player.jump}:null,animation:player.animation,clipTime:player.jump?jumpClipTime(player.jump,player.vy):null});}
 const anticipation=trace.filter(f=>f.jump?.phase==='anticipation'),air=trace.filter(f=>f.jump?.phase==='air');
 assert(anticipation.length>=6);assert(anticipation.every(f=>f.onGround&&f.y===0));
 assert(air.length>30);assert(Math.max(...air.map(f=>f.y))>.65&&Math.max(...air.map(f=>f.y))<.8,'Existing game jump height is preserved');
 assert(trace.filter(f=>f.jump).every(f=>f.animation===clip),'Jump clip remains selected throughout its phases');
 assert(trace.some(f=>f.jump?.phase==='land'));assert(trace.at(-1).onGround&&!trace.at(-1).jump);
 assert(air[0].clipTime>=JUMPS[clip].takeoff);assert(air.at(-1).clipTime>JUMPS[clip].apex);
}
player.keys.clear();player.setPose(0,0);player.inputLock=1;assert.equal(player.requestJump(),false);player.inputLock=0;
assert(player.requestJump());player.setPose(1,1);assert.equal(player.jump,null,'Respawn cancels pending jump');

player.setPose(0,0);player.setView(2);
assert(key('keydown','ControlRight',{ctrlKey:true}));
step(.3);assert(player.crouched);assert.equal(player.animation,'CrouchIdle');
assert(camera.position.y<1.17,'First-person camera lowers with the stance');
assert(!player.requestJump(),'A held crouch keeps the character grounded');
let commands=0;keys.addEventListener('keydown',()=>commands++);
assert(key('keydown','KeyR',{ctrlKey:true}));assert.equal(commands,0,'Ctrl chords do not reach other game controls');
assert(!player.keys.has('KeyR'));
assert(key('keydown','KeyW',{ctrlKey:true}));assert(player.keys.has('KeyW'),'Ctrl+W still moves when the browser delivers it');
player.keys.add('ShiftLeft');step(.8);
assert.equal(player.animation,'CrouchWalk');assert(player.pos.z<-.8&&player.speed>1.5&&player.speed<1.6,'Crouch walking stays slower even with Shift');
key('keyup','KeyW');player.keys.delete('ShiftLeft');key('keyup','ControlRight');step(.3);
assert(!player.crouched);assert(camera.position.y>1.49);

const lowLintel=physics.addBox(0,-3,1.5,2,0,1.38,1.55);
player.setPose(0,0);player.keys.add('KeyW');step(1);
assert(player.pos.z>=-1.701,'Standing avatar stops at the low ceiling');
player.keys.add('ControlLeft');step(.7);assert(player.pos.z<-2.5,'Crouched avatar fits under the ceiling');
player.keys.delete('ControlLeft');step(.2);
assert(player.crouched,'Releasing Ctrl keeps the lower stance under the ceiling');
step(1.3);assert(!player.crouched&&player.pos.z<-4.3,'Avatar stands back up once clear');
physics.remove(lowLintel);
player.keys.clear();player.setView(0);
const beforeModal=commands;
player.inputLock=1;
assert(!key('keydown','KeyR',{ctrlKey:true}));assert.equal(commands,beforeModal+1,'Modal controls keep native shortcuts');
key('keyup','KeyR');player.inputLock=0;

player.toggleFly(true);assert(player.firstPerson,'Flight preserves its existing free camera');player.setPose(0,0);
player.board({frame:()=>({x:0,y:0,z:0,yaw:0}),local:{x:0,y:0,z:0}});assert(player.firstPerson,'Train interior preserves first person');player.alight();assert.equal(player.view,0);
const wet=new Physics(()=>-2,()=>0),wader=new Player(new THREE.PerspectiveCamera(),dom,wet,bounds);wader.enabled=true;wader.setPose(0,0);wader.update(1/60);assert.equal(wader.depth,2);assert(wader.requestJump());assert.equal(wader.jump.launchSpeed,3,'Water keeps its weaker bed push-off');
wader.setPose(0,0,0,85);
assert(wader.camera.position.y>=-1.701&&wader.camera.position.y<0,'The sweep stops at the bed while allowing an underwater view');

const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
assert.equal(loadCharacterChoice(storage),0,'Girl is default');saveCharacterChoice(storage,1);assert.equal(memory.get(CHARACTER_STORAGE_KEY),'man-jacket');assert.equal(loadCharacterChoice(storage),1);
memory.set(CHARACTER_STORAGE_KEY,'invalid');assert.equal(loadCharacterChoice(storage),0);assert.equal(loadCharacterChoice({getItem(){throw Error('blocked');}}),0);
console.log('PASS: character views/camera collision, walk/run jumps, Ctrl crouch movement and headroom, input lock, flight/train/water compatibility and settings persistence');
