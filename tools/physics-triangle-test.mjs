// Exact sloped bridge faces: no invisible enclosing-box floors or side walls.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Physics } from '../src/core/physics.js';
import { convexContains } from '../src/core/convex-footprint.js';
import { carContact } from '../src/world/drive/collision.js';
import { captureRoofMap, NONE } from '../src/core/roofmap.js';
import { encodeBaked, decodeBaked } from '../src/core/baked-codec.js';

const near=(a,b,msg)=>assert(Math.abs(a-b)<1e-6,`${msg}: ${a} vs${b}`);
const ph=new Physics(()=>-10),points=[[0,6,0],[10,7,0],[0,6.5,10]],item=ph.addWalkTriangle(points,.6);
assert.equal(item.type,'ramp');assert.equal(item.sticky,true);
let samples=0;
for(let x=-.5;x<=10.5;x+=.5)for(let z=-.5;z<=10.5;z+=.5){
 const inside=x>=0&&z>=0&&x+z<=10,expected=inside?6+x*.1+z*.05:-10;
 near(ph.groundHeight(x,z,8,false),expected,'exact triangle surface');samples++;
}
assert(!ph.columnBlocked(8,8,.2,6,7),'empty OBB corner has no column wall');
assert(!ph.columnBlocked(2,2,.2,2,5),'underbridge head clearance');
assert(!ph.columnBlocked(8,.1,.01,6.0,6.15),'local high-end soffit stays above the head, independently of the low-end bounding minimum');
assert(ph.columnBlocked(8,.1,.01,6.22,6.28),'actual local high-end soffit remains solid');
assert(ph.columnBlocked(2,2,.2,6,6.4),'actual slab volume is solid');
assert(!ph.columnBlocked(2,2,.2,6.31,8),'standing above surface is clear');
const empty={x:8,z:8};ph.resolve(empty,.3,6,1);assert.deepEqual(empty,{x:8,z:8});
const blocked={x:4.9,z:4.9};ph.resolve(blocked,.3,6,1);assert(!convexContains(item.clip,blocked.x,blocked.z),'walker resolves against actual diagonal edge');
const spec={W:1,len:2,hgt:.7,centerZ:0},car=(x,z,y)=>({x,z,y,yaw:0,floats:false});
assert.equal(carContact(car(8,8,6),spec,item),null,'car crosses empty bounding-box corner');
assert(carContact(car(2,2,5.7),spec,item),'car contacts actual triangle volume');
assert.equal(carContact(car(2,2,2),spec,item),null,'car passes under bridge');
assert.equal(carContact(car(2,2,6.3),spec,item),null,'car stands on ramp');
assert.equal(carContact({...car(2,2,5),floats:true},spec,item),null,'ordinary hull preserves shared thin bridge passage');
const encoded=encodeBaked({item}),saved=decodeBaked(encoded.buffer.slice(encoded.byteOffset,encoded.byteOffset+encoded.byteLength)).item,copy=new Physics(()=>-10);copy._insert(saved);
assert.deepEqual(saved.clip,item.clip);near(copy.groundHeight(2,2,8,false),6.3,'clip survives generic bake codec');
assert.equal(copy.groundHeight(8,8,8,false),-10);
assert(ph.remove(item));assert.equal(ph.groundHeight(2,2,8,false),-10,'remove clears surface index');

// Exercise the REAL roof raster/exclusion function with deterministic packed
// readback, without invoking a GPU. The fake renderer supplies a uniform roof.
const renderer={capabilities:{maxTextureSize:4096},shadowMap:{enabled:true},getRenderTarget:()=>null,getClearColor:out=>out.set('#000000'),getClearAlpha:()=>1,
 setRenderTarget(){},setClearColor(){},clear(){},render(){},readRenderTargetPixels(rt,x,y,w,h,buf){for(let i=0;i<buf.length;i+=4)buf.set([168,0,0,0],i);}};
const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
const foot=[{o:[0,0,10,0,10,10,0,10],h:[]}],rp=new Physics(()=>0);rp.addWalkTriangle([[0,6,0],[10,6,0],[0,6,10]],.6);
const raster=captureRoofMap(renderer,scene,root,foot,rp,{res:.5,margin:0});
const cell=(x,z)=>raster.data[Math.floor(z/.5)*raster.w+Math.floor(x/.5)];
assert.equal(cell(2,2),NONE,'actual triangle excluded from building roof map');
assert.notEqual(cell(8,8),NONE,'empty OBB corner keeps its actual building roof');
const ordinary=new Physics(()=>0);ordinary.addWalkRamp(5,5,10,10,0,6,6,.6);
const oldRaster=captureRoofMap(renderer,scene,root,foot,ordinary,{res:.5,margin:0});
assert(oldRaster.data.every(v=>v===NONE),'ordinary rectangular ramp exclusion unchanged');
console.log(`PASS exact triangle ramps: ${samples} floor probes, circle/car narrow phases, head clearance, boat passage, codec, removal and real roof exclusion.`);
