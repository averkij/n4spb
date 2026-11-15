import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Physics} from '../src/core/physics.js';
import {createVisualFloor} from '../src/core/visual-floor.js';
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-5,`${message}: ${a} vs ${b}`);
const material=new THREE.MeshBasicMaterial();
function quad(x0,z0,x1,z1,y0,y1=y0,mat=material){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([x0,y0,z0,x0,y1,z1,x1,y0,z0,x1,y1,z1],3));g.setIndex([0,1,2,2,1,3]);return new THREE.Mesh(g,mat);
}
{
  const ph=new Physics(()=>0),floor=createVisualFloor(ph),root=new THREE.Group();
  root.add(quad(0,0,4,4,.12),quad(4,0,8,4,.03),quad(0,4,4,8,.03,.12));floor.addGroup(root);
  near(floor.heightAt(2,2,0),.12,'paving top');near(floor.heightAt(6,2,0),.03,'asphalt top');
  near(floor.heightAt(2,6,0),.075,'dropped kerb interpolates its actual triangle plane');
  near(floor.heightAt(8.1,2,0),0,'no extension beyond drawn paving');
  near(floor.heightAt(2,2,-3),-3,'same XZ while wading stays on water bed');
  near(floor.heightAt(2,2,4),4,'no downward snap from raised physical support');
  near(floor.heightAt(20,20,NaN),0,'finite fallback');
  const count=floor.stats.triangles;floor.addGroup(root);assert.equal(floor.stats.triangles,count,'same sources cannot be indexed twice');
  root.children.forEach(m=>m.geometry.attributes.position.array=null);
  near(floor.heightAt(2,2,0),.12,'lookup owns compact data after renderer releases source arrays');
  const late=new THREE.Group();late.add(quad(10,0,14,4,.15));floor.addGroup(late);near(floor.heightAt(12,2,0),.15,'late hydrated region is included');
}
{
  const ph=new Physics(()=>-3);ph.addWalkRamp(0,0,4,10,0,1,2,1);
  const floor=createVisualFloor(ph),root=new THREE.Group();root.add(quad(-2,-5,2,5,1.12,2.12));floor.addGroup(root);
  const y=ph.groundHeight(0,0,1.5,false);near(y,1.5,'physical ramp unchanged');near(floor.heightAt(0,0,y),1.62,'raised bridge sidewalk');
  near(floor.heightAt(0,0,-3),-3,'bridge does not lift walker beneath it');
  near(floor.heightAt(2.1,0,-3),-3,'bridge does not extend over adjacent water');
  assert.equal(ph.items.length,1,'visual service never adds physics support');
}
{
  const ph=new Physics((x,z)=>x>=20&&x<=30&&z>=0&&z<=10?3:0);
  const floor=createVisualFloor(ph,{heightPatches:[{box:[20,30,0,10],at:()=>3}]}),root=new THREE.Group();
  root.add(quad(20,0,30,10,3.12),quad(0,0,10,10,20),quad(0,0,10,10,.8));floor.addGroup(root);
  near(floor.heightAt(25,5,3),3.12,'authored elevated terrain');assert.equal(floor.stats.triangles,2,'roofs and furniture excluded before indexing');
}
{
  const ph=new Physics(()=>0),floor=createVisualFloor(ph),root=new THREE.Group();
  const dynamic=new THREE.Group();dynamic.userData.dynamic=true;dynamic.add(quad(0,0,4,4,.3));root.add(dynamic);
  root.add(quad(0,0,4,4,.2,new THREE.MeshBasicMaterial({transparent:true,opacity:.7})));
  const down=quad(0,0,4,4,.15);down.geometry.setIndex([0,2,1,2,3,1]);root.add(down);
  const transformed=new THREE.Group();transformed.position.set(10,0,2);transformed.rotation.y=Math.PI/2;transformed.add(quad(0,0,4,4,.12));root.add(transformed);
  const slab=new THREE.Mesh(new THREE.BoxGeometry(2,.12,2),material);slab.position.set(-5,.06,0);root.add(slab);
  floor.addGroup(root);near(floor.heightAt(2,2,0),0,'dynamic bridge, water and downward faces excluded');
  near(floor.heightAt(12,0,0),.12,'world transforms applied');near(floor.heightAt(-5,0,0),.12,'single-material grouped box retains its top face');
}
{
  const ph=new Physics(()=>0),floor=createVisualFloor(ph),root=new THREE.Group();
  // One broad plaza uses coarse bins; hundreds of distant patches do not add
  // work to a local foot query.
  root.add(quad(-200,-200,200,200,.1));for(let i=0;i<400;i++)root.add(quad(1000+i*20,0,1002+i*20,2,.12));floor.addGroup(root);
  near(floor.heightAt(0,0,0),.1,'large paving remains exact');assert(floor.stats.maxQueryTests<5,'local query does not traverse distant geometry');assert(floor.stats.references<5000,'large triangles use bounded coarse bins');
  assert(floor.stats.bytes>0&&floor.stats.bytes<1024*1024,'compact payload measured');
  const warnings=[],bounded=createVisualFloor(ph,{maxTriangles:2,maxReferences:10,warn:m=>warnings.push(m)});bounded.addGroup(root);assert(bounded.stats.truncated>0);assert(bounded.stats.triangles<=2&&bounded.stats.references<=10,'hard memory bounds');
  const extra=new THREE.Group();extra.add(quad(20000,0,20002,2,.12));bounded.addGroup(extra);assert.equal(warnings.length,1,'exhausted capacity warns once across streamed attachments');assert(warnings[0].includes('Capacity reached'));
}
console.log('PASS: exact paving/kerbs, raised bridge/terrain, water/underpass safety, source release, streamed regions, material/transform exclusions and bounded local lookup');
