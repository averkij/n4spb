import * as THREE from 'three';
import {createCarModel} from '../../src/world/drive/model.js';
import {makeModel} from '../../src/world/traffic/models.js';
import {cutBox} from './geometry-cut.js';
import {VEHICLES} from './vehicle-specs.js';

const toon=(color,options={})=>{
  const {paint,side,polygonOffset,...rest}=options;
  return new THREE.MeshToonMaterial({color,...rest,side:side==='double'?THREE.DoubleSide:(side??THREE.FrontSide),...(polygonOffset?{polygonOffset:true,polygonOffsetFactor:polygonOffset,polygonOffsetUnits:polygonOffset}:{})});
};
// The city factory customizes its glass shader text. This isolated preview uses
// standard transparent glass, so the text hook is a harmless empty string.
const glassMaterial=()=>{const m=new THREE.MeshStandardMaterial({color:'#aec7d3',transparent:true,opacity:.17,depthWrite:false,side:THREE.DoubleSide});m.fragmentShader='';return m;};
const ctx={mat:{toon,glass:glassMaterial},shared:{uNight:{value:0}},noOutline(){}};
const box=(root,w,h,d,x,y,z,color)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),toon(color));m.position.set(x,y,z);root.add(m);return m;};
function interior(root,spec) {
  for(const x of [spec.seat[0],-spec.seat[0]]) {
    box(root,.43,.09,.43,x,spec.seat[1]-.07,spec.seat[2]+.04,'#34373b');
    const back=box(root,.43,.5,.09,x,spec.seat[1]+.20,spec.seat[2]+.25,'#30343a');back.rotation.x=-.12;
    box(root,.25,.16,.09,x,spec.seat[1]+.49,spec.seat[2]+.27,'#30343a');
  }
  box(root,1.3,.045,1.55,0,spec.floor-.05,.1,'#262b30');
  box(root,1.3,.14,.25,0,spec.wheel[1]+.03,spec.wheel[2]-.22,'#303840');
}
function attachDoor(vehicle,parts) {
  const pivot=new THREE.Group();pivot.position.set(...vehicle.spec.hinge);vehicle.root.add(pivot);vehicle.root.updateMatrixWorld(true);
  for(const part of parts)pivot.attach(part);
  vehicle.door=pivot;vehicle.handle=new THREE.Vector3(...vehicle.spec.handle).sub(pivot.position);
}
function cutCityBody(vehicle,visual,body,glass) {
  const coupe=vehicle.spec.id==='coupe';
  // Remove the old solid belt-line deck and decorative interior shell. Supply
  // real seats/floor below so an entering character occupies an actual opening.
  const hollow=cutBox(body.geometry,[-.74,.30,-1.02],[.74,coupe?1.20:1.40,.65]);body.geometry=hollow.outside;
  const parts=[];
  for(const mesh of [body,glass]) {
    const split=cutBox(mesh.geometry,[.58,.30,coupe?-.62:-.42],[1.2,coupe?1.20:1.40,coupe ? .58 : .82]);
    mesh.geometry=split.outside;
    const panel=new THREE.Mesh(split.inside,mesh.material);visual.add(panel);parts.push(panel);
  }
  attachDoor(vehicle,parts);
  interior(vehicle.root,vehicle.spec);
}
function prepareBlue(gltf) {
  const root=new THREE.Group(),visual=gltf.scene;visual.rotation.y=Math.PI;root.add(visual);
  visual.traverse(o=>{if(o.isMesh){const convert=m=>toon(m.name==='Chassis'?'#52798b':m.color,{map:m.map,side:m.side,transparent:/Windows/i.test(m.name),opacity:/Windows/i.test(m.name)?.2:1,depthWrite:!/Windows/i.test(m.name)});o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);}});
  const vehicle={root,spec:VEHICLES[0],wheels:[]};root.updateMatrixWorld(true);
  for(const name of ['FL_Wheel','FR_Wheel','RL_Wheel','RR_Wheel']) {
    const mesh=visual.getObjectByName(name);if(!mesh)continue;
    const pivot=new THREE.Group();pivot.position.copy(new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3()));root.add(pivot);
    const roll=new THREE.Group();pivot.add(roll);roll.attach(mesh);vehicle.wheels.push({pivot,mesh:roll,front:name.startsWith('F')});
  }
  const door=visual.getObjectByName('FL_Door');attachDoor(vehicle,door?[door]:[]);
  const steer=visual.getObjectByName('Steerwheel');
  vehicle.steer=new THREE.Group();vehicle.steer.position.set(...vehicle.spec.wheel);root.add(vehicle.steer);if(steer)vehicle.steer.attach(steer);
  return vehicle;
}
function prepareCoupe() {
  const model=createCarModel(ctx,{logoUrl:'/assets/bibliotochka.png',plate:['А777АА','178']}),root=new THREE.Group();
  model.root.rotation.y=Math.PI;root.add(model.root);model.driver.removeFromParent();
  model.cockpit.group.visible=false;model.glow.visible=false;for(const f of model.flames)f.visible=false;
  const vehicle={root,spec:VEHICLES[1],wheels:model.wheels};
  cutCityBody(vehicle,model.root,model.body,model.glass);
  vehicle.steer=new THREE.Group();vehicle.steer.position.set(...vehicle.spec.wheel);root.add(vehicle.steer);root.updateMatrixWorld(true);vehicle.steer.attach(model.steerWheel);
  return vehicle;
}
function prepareTraffic() {
  const model=makeModel('sedan',0),root=new THREE.Group(),visual=new THREE.Group();visual.rotation.y=Math.PI;root.add(visual);
  const geometry=model.paint.clone(),colors=geometry.attributes.color,kinds=geometry.attributes.aKind,tint=new THREE.Color('#939da7');
  for(let i=0;i<colors.count;i++)if(Math.round(kinds.getX(i))===1){colors.setXYZ(i,colors.getX(i)*tint.r,colors.getY(i)*tint.g,colors.getZ(i)*tint.b);}
  const body=new THREE.Mesh(geometry,toon('#ffffff',{vertexColors:true}));
  const glass=new THREE.Mesh(model.glass.clone(),ctx.mat.glass());visual.add(body,glass);
  const vehicle={root,spec:VEHICLES[2],wheels:[]};cutCityBody(vehicle,visual,body,glass);
  // The traffic recipe merges its tyres. Rotating hub overlays add visible wheel
  // motion while preserving the same tyre silhouettes and original paint mesh.
  for(const x of [-.77,.77])for(const z of [-1.3,1.3]) {
    const pivot=new THREE.Group();pivot.position.set(x,.31,z);root.add(pivot);
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(.15,.025,5,10).rotateY(Math.PI/2),toon('#b6bbc1'));pivot.add(mesh);
    box(mesh,.04,.22,.035,0,0,0,'#59616a');vehicle.wheels.push({pivot,mesh,front:z<0});
  }
  vehicle.steer=new THREE.Group();vehicle.steer.position.set(...vehicle.spec.wheel);root.add(vehicle.steer);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.17,.018,6,20),toon('#20252b'));rim.rotation.x=-.35;vehicle.steer.add(rim);
  box(vehicle.steer,.31,.025,.025,0,0,0,'#20252b');
  return vehicle;
}
export function createVehicles(gltf) {
  return [prepareBlue(gltf),prepareCoupe(),prepareTraffic()].map(vehicle=>{
    vehicle.root.name=vehicle.spec.id;vehicle.root.traverse(o=>{if(o.isMesh){o.castShadow=!o.material.transparent;o.receiveShadow=true;}});
    vehicle.root.position.set(vehicle.spec.x,0,vehicle.spec.z);return vehicle;
  });
}
export function updateVehicle(vehicle,pose,dt) {
  vehicle.root.position.set(pose.x,pose.y,pose.z);vehicle.root.rotation.y=pose.yaw;
  vehicle.door.rotation.y=-1.15*pose.door;
  vehicle.steer.quaternion.setFromAxisAngle(new THREE.Vector3(0,.35,.94).normalize(),pose.steering*.6);
  for(const wheel of vehicle.wheels){wheel.mesh.rotation.x-=pose.speed*dt/vehicle.spec.radius;if(wheel.front)wheel.pivot.rotation.y=pose.steering*.4;}
  vehicle.root.updateMatrixWorld(true);
}
