import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Physics} from '../src/core/physics.js';
import {Player} from '../src/core/player.js';
import {JUMPS,jumpClipTime} from '../src/world/character/jump-timing.js';
import {loadCharacterChoice,saveCharacterChoice,CHARACTER_STORAGE_KEY} from '../src/world/character/settings.js';

globalThis.addEventListener=()=>{};
const dom={addEventListener(){},requestPointerLock(){}},bounds={x0:-100,z0:-100,x1:100,z1:100};
const physics=new Physics(()=>0,()=>null),camera=new THREE.PerspectiveCamera(60,1,.1,500);
const player=new Player(camera,dom,physics,bounds);player.enabled=true;player.setPose(0,0);
const step=(seconds)=>{for(let i=0;i<Math.round(seconds*60);i++)player.update(1/60);};
assert.equal(player.view,0);assert(camera.position.distanceTo(player.pos)>4.5,'Default camera shows the character');
player.cycleView();assert.equal(player.view,1);assert(camera.position.distanceTo(player.pos)>7,'Second view is farther');
player.cycleView();assert.equal(player.view,2);assert(Math.abs(camera.position.y-player.eye)<.01);assert.equal(camera.position.x,0);assert.equal(camera.position.z,0);
player.cycleView();const wall=physics.addBox(0,2,5,.4,0,0,5);player.applyCamera(0);assert(camera.position.z<1.7,'Chase camera contracts before a wall');physics.remove(wall);
step(.5);assert(camera.position.z>4.3,'Camera extends after obstruction clears');

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
player.toggleFly(true);assert(player.firstPerson,'Flight preserves its existing free camera');player.setPose(0,0);
player.board({frame:()=>({x:0,y:0,z:0,yaw:0}),local:{x:0,y:0,z:0}});assert(player.firstPerson,'Train interior preserves first person');player.alight();assert.equal(player.view,0);
const wet=new Physics(()=>-2,()=>0),wader=new Player(new THREE.PerspectiveCamera(),dom,wet,bounds);wader.enabled=true;wader.setPose(0,0);wader.update(1/60);assert.equal(wader.depth,2);assert(wader.requestJump());assert.equal(wader.jump.launchSpeed,3,'Water keeps its weaker bed push-off');

const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
assert.equal(loadCharacterChoice(storage),0,'Girl is default');saveCharacterChoice(storage,1);assert.equal(memory.get(CHARACTER_STORAGE_KEY),'man-jacket');assert.equal(loadCharacterChoice(storage),1);
memory.set(CHARACTER_STORAGE_KEY,'invalid');assert.equal(loadCharacterChoice(storage),0);assert.equal(loadCharacterChoice({getItem(){throw Error('blocked');}}),0);
console.log('PASS: character views/camera collision, walk/run jump anticipation/flight/landing, input lock, reset, flight/train/water compatibility and settings persistence');
