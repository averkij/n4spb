import * as THREE from 'three';
import {cutBox,addDoorInterior} from './geometry-cut.js';
import {deformPoint} from './damage.js';

// Fittings in the character frame (-Z forward, -X driver side). The native
// vehicle factories keep their established +Z/+X frame and damage coordinates.
const GARAGE_CABINS={
  coupe:{seat:[-.4,.35,.23],wheel:[-.4,.88,-.16],floor:.19,front:.58,rear:-.62,roof:1.27,handleY:.70,handleZ:.28},
  truck:{seat:[-.37,.75,-.55],wheel:[-.37,1.06,-.98],floor:.49,front:1.25,rear:-.08,roof:1.80,handleY:1.10,handleZ:-.22},
  lada:{seat:[-.34,.45,.20],wheel:[-.34,.82,-.26],floor:.19,front:.64,rear:-.65,roof:1.40,handleY:.84,handleZ:.12},
  roadster:{seat:[-.36,.27,-.20],wheel:[-.36,.68,-.65],floor:.13,front:.92,rear:-.80,roof:1.22,handleY:.78,handleZ:.10},
};
export function createVehicleCabin(ctx,vehicle){
  if(vehicle.kind==='boat'||vehicle.model.placeholder)return null;
  const model=vehicle.model,spec=vehicle.spec;
  let fit=vehicle.def.traffic?null:GARAGE_CABINS[vehicle.id];
  if(!fit&&model.cabin){const c=model.cabin;fit={seat:[-c.seat[0],c.seat[1],-c.seat[2]],wheel:[-c.wheel[0],c.wheel[1],-c.wheel[2]],floor:c.floor,front:c.doorFront,rear:c.doorRear,roof:model.seat?.roofY||spec.hgt,entrySide:c.entrySide??-1,entryZ:c.entryZ,entryFloor:c.entryFloor,cabinFront:c.cabinFront,cabinRear:c.cabinRear};}
  if(!fit){
    const seat=model.seat||{},roof=seat.roofY||Math.min(spec.hgt,2.35),x=seat.x||Math.min(.42,spec.W*.22);
    const hipY=Math.max(.3,roof-.91),z=seat.z??-.10,wheelY=seat.wy??hipY+.48,wheelZ=seat.wz??z+.48;
    fit={seat:[-x,hipY,-z],wheel:[-x,wheelY,-wheelZ],floor:Math.max(.15,hipY-.28),front:wheelZ+.38,rear:z-.58,roof};
  }
  const hw=spec.W/2,frame=new THREE.Group();frame.rotation.y=Math.PI;model.root.add(frame);
  const side=fit.entrySide??-1,doorFloor=fit.entryFloor??fit.floor;
  const config={...fit,id:vehicle.id,halfWidth:hw,halfLength:Math.max(spec.front,-spec.rear),frontExtent:spec.front,height:fit.roof,doorBottom:doorFloor+.10,
    hinge:[side*hw,doorFloor+.4,-fit.front],handle:[side*(hw+.025),fit.handleY??doorFloor+(side===1?.78:.48),fit.handleZ??-fit.rear-.16]};
  const cabin={root:frame,spec:config,door:new THREE.Group(),handle:new THREE.Vector3(),npc:null,panels:[],occupied:true,npcTime:-1,npcOrigin:null,doorAmount:0};
  let roofRevision=-2,roofHeight=fit.roof;const roofPoint=new THREE.Vector3();
  cabin.roofHeight=()=>{
    const damage=vehicle.damage?.state,revision=damage?.revision??-1;if(revision===roofRevision)return roofHeight;
    roofRevision=revision;roofHeight=fit.roof;
    if(damage)for(const dx of [-.2,.2])for(const dz of [-.22,.22])roofHeight=Math.min(roofHeight,deformPoint(roofPoint.set(-fit.seat[0]+dx,fit.roof,-fit.seat[2]+dz),damage,spec).y);
    return roofHeight;
  };
  cabin.door.position.set(...config.hinge);frame.add(cabin.door);
  cabin.handle.set(...config.handle).sub(cabin.door.position);
  model.root.updateMatrixWorld(true);
  if(model.body?.geometry&&model.glass?.geometry){
    // Factories provide private body/glass/livery buffers for each model.
    // Release each replaced shell after the splitter has copied its attributes.
    const shell=model.body.geometry,hollow=cutBox(shell,[-hw+.17,doorFloor+.06,(fit.cabinRear??fit.rear)-.22],[hw-.17,fit.roof-.07,(fit.cabinFront??fit.front)+.10]);
    model.body.geometry=hollow.outside;shell.dispose();hollow.inside.dispose();
    for(const mesh of [model.body,model.glass,...(model.liveryMeshes||[])]){
      // The sill, side skirt and underfloor rails belong to the fixed chassis,
      // not the hinge. Cutting from floor-.01 captured disconnected low strips
      // which swung out separately below the actual door panel.
      const original=mesh.geometry,split=cutBox(original,[side===1?-hw-.3:hw*.63,config.doorBottom,fit.rear],[side===1?-hw*.63:hw+.3,Math.min(fit.roof-.045,side===1?2.55:Infinity),fit.front]);
      if(mesh===model.body)addDoorInterior(split.inside);
      mesh.geometry=split.outside;original.dispose();const panel=new THREE.Mesh(split.inside,mesh.material);panel.name=mesh.name;panel.castShadow=mesh.castShadow;panel.receiveShadow=true;
      model.root.add(panel);model.root.updateMatrixWorld(true);cabin.door.attach(panel);cabin.panels.push(panel);
    }
  }
  const material=ctx.mat.toon('#30343a',{paint:0,name:'vehicle-cabin'});
  const box=(w,h,d,x,y,z)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;frame.add(mesh);return mesh;};
  for(const x of (spec.bus?[fit.seat[0]]:[fit.seat[0],-fit.seat[0]])){box(.43,.08,.43,x,fit.seat[1]-.07,fit.seat[2]+.04);box(.43,.48,.08,x,fit.seat[1]+.2,fit.seat[2]+.25);box(.25,.14,.08,x,fit.seat[1]+.48,fit.seat[2]+.26);}
  box(spec.bus?spec.W*.5:spec.W-.38,.04,(fit.cabinFront??fit.front)-(fit.cabinRear??fit.rear),spec.bus?-spec.W*.2:0,fit.floor-.04,-((fit.cabinFront??fit.front)+(fit.cabinRear??fit.rear))/2);
  if(spec.bus){box(.42,.16,.9,hw-.17,.28,fit.entryZ);box(.4,.16,.9,hw-.52,.51,fit.entryZ);box(.4,.16,.9,hw-.86,.76,fit.entryZ);}
  // Factory setView() knows only the original shell. Keep added panels/cabin
  // aligned with cockpit visibility and never resurrect the old dummy driver.
  const setView=model.setView.bind(model);model.setView=inside=>{setView(inside);frame.visible=!!vehicle.def.traffic||!inside;if(vehicle.def.traffic)for(const panel of cabin.panels)if(panel.material===model.glass.material)panel.visible=!inside;if(model.driver)model.driver.visible=false;};
  if(model.driver)model.driver.visible=false;
  vehicle.cabin=cabin;return cabin;
}

export function cabinDamageMeshes(model,cabin){
  const meshes=model.root.children.filter(m=>m.isMesh&&(m===model.body||m===model.glass||['drive-head','drive-tail','drive-plate','drive-logo'].includes(m.material?.name)));
  return cabin?meshes.concat(cabin.panels):meshes;
}
