// Exercise the real driving camera against a real segmented bridge collider.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { Physics } from '../src/core/physics.js';
import { Player } from '../src/core/player.js';
import { createInteract } from '../src/core/ui.js';
import { build } from '../src/world/drive.js';
import { boatCameraFraction } from '../src/world/drive/boat/camera.js';
let queries=0;
assert.equal(boatCameraFraction(0,0,0,430,110,0,()=>{queries++;return false;}),1);
assert(queries<=128,'large ship camera must bound collision queries');
const {ctx,L}=await buildWorld({modules:[]});
const ph=ctx.physics=new Physics(()=>-5);
ph.waterLevel=()=>-3.4;
ctx.L={...L,insideBuilding:()=>false,heightAt:()=>-5,inPlay:()=>true};
document.body.classList={toggle(){},add(){},remove(){},contains:()=>false};
ctx.audio={context:null,muted:true,play(){}};
ctx.ui={toast(){},modalOpen:false};
const player=new Player(ctx.camera,{addEventListener(){},requestPointerLock(){}},ph,L.WORLD.play);
player.enabled=true;ctx.playerObj=player;
ctx.interact=createInteract({camera:ctx.camera,player,ui:ctx.ui,doc:null});
await build(ctx);
const d=ctx.drive, boat=d.boats.find(b=>b.spec.len<20);
assert(boat,'test area needs a small boat');d.enter(boat.id);
assert(d.active,'boat boarding failed');
const frame=ctx._updates.at(-1);
// Two deck pieces with a small construction seam must not flicker the camera.
for(const x of[23,27.05])ph.addWalkBox(x,0,4,18,0,.3,-1.6);
for(const mode of [0,1]){
d.setView(mode);d.teleport(-20,0,Math.PI/2);
d.car.step=()=>{};
let prev=null,maxStep=0,lowered=false,restored=false,openY=null;
for(let i=0;i<660;i++){
  d.car.x=-20+i*.2;d.car.z=0;d.car.y=-3.4;d.car.yaw=Math.PI/2;d.car.vx=12;d.car.vz=0;d.car.vF=12;
  d.car.carCenter.x=d.car.x+boat.spec.centerZ;d.car.carCenter.z=0;
  frame(1/60,i/60);
  const p=ctx.camera.position;
  if(i===10)openY=p.y;
  assert(!ph.columnBlocked(p.x,p.z,.18,p.y-.18,p.y+.18),'camera intersects bridge at boat x'+d.car.x);
  if(p.x>20.5&&p.x<29.5){assert(p.y<-1.84,'camera did not lower before bridge: '+JSON.stringify({boatX:d.car.x,camera:p}));lowered=true;}
  if(d.car.x>70&&Math.abs(p.y-openY)<.05)restored=true;
  if(prev&&i>3)maxStep=Math.max(maxStep,Math.hypot(p.x-prev.x-.2,p.y-prev.y,p.z-prev.z));
  prev={x:p.x,y:p.y,z:p.z};
}
assert(lowered&&restored,'camera must lower and return to chase view');
assert(maxStep<.22,'camera snapped relative to boat: '+maxStep+'m/frame');
console.log('PASS boat camera view '+mode+': anticipates bridge, clears segmented underside, eases back; max relative step '+maxStep.toFixed(3)+'m/frame');
}
