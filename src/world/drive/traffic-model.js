// Promote one instanced road car to the normal drive-model contract. Geometry
// recipes and atlases are shared with traffic; source buffers are never mutated.
import * as THREE from 'three';
import {trafficSource} from './traffic-source.js';
import {archOf,DRIVABLE_KINDS,busDoorZ,ROUTES} from '../traffic/fleetdata.js';
import {plateAtlas,liveryAtlas,routeAtlas,PLATE_CELL,ROUTE_CELL} from '../traffic/plates.js';
import {TYRE,HUB} from '../traffic/mk.js';
import {trafficSpec,trafficTuning} from './vehicle-profiles.js';

const names={sedan:'City sedan',lada:'Lada sedan',ladasw:'Lada estate',cross_c:'Compact crossover',cross_s:'Small crossover',cross_m:'Family crossover',suv:'Large SUV',liftback:'City liftback',prem:'Premium sedan',hatch:'City hatchback',mpv:'Passenger van',van:'Delivery van',truck:'Box truck',minibus:'Minibus'};
Object.assign(names,{bus:'City bus',midi:'Midi bus',artic:'Articulated bus',trolley:'Azure trolleybus',trolley2:'White trolleybus',dd:'Sightseeing double-decker',coach:'Tourist coach'});
const colorOf=value=>value?.isColor?`#${value.getHexString()}`:typeof value==='string'?value:'#b9bcbf';
function selectedGeometry(g,indices){
  const out=new THREE.BufferGeometry();
  for(const [name,a] of Object.entries(g.attributes)){
    const data=new Float32Array(indices.length*a.itemSize);
    for(let i=0;i<indices.length;i++)for(let j=0;j<a.itemSize;j++)data[i*a.itemSize+j]=a.getComponent(indices[i],j);
    out.setAttribute(name,new THREE.BufferAttribute(data,a.itemSize));
  }
  out.computeBoundingBox();out.computeBoundingSphere();return out;
}
function triangleBuckets(g,classify,n){
  const buckets=Array.from({length:n},()=>[]),ids=g.index?.array;
  for(let i=0;i<(ids?.length??g.attributes.position.count);i+=3){const tri=[ids?ids[i]:i,ids?ids[i+1]:i+1,ids?ids[i+2]:i+2];buckets[classify(tri)].push(...tri);}
  return buckets.map(indices=>selectedGeometry(g,indices));
}
function preparePaint(source,color,plate){
  const g=source.clone(),p=g.attributes.position,c=g.attributes.color,k=g.attributes.aKind,uv=g.attributes.uv,tint=new THREE.Color(color),cell=PLATE_CELL;
  const cc=plate%cell.cols,rr=Math.floor(plate/cell.cols);
  for(let i=0;i<p.count;i++){
    const kind=Math.round(k.getX(i));
    if(kind===1)c.setXYZ(i,c.getX(i)*tint.r,c.getY(i)*tint.g,c.getZ(i)*tint.b);
    if(kind===1||kind===3){let t=Math.max(0,Math.min(1,(p.getY(i)-.30)/.16));t=t*t*(3-2*t);const shade=.9+.1*t;c.setXYZ(i,c.getX(i)*shade,c.getY(i)*shade,c.getZ(i)*shade);}
    if(kind===2)uv.setXY(i,(cc*cell.w+1+uv.getX(i)*(cell.w-2))/cell.W,1-(rr*cell.h+cell.h-1-uv.getY(i)*(cell.h-2))/cell.H);
    else uv.setXY(i,.5,.008);
  }
  return g;
}
function splitWheels(g,axles){
  const tyre=new THREE.Color(TYRE),hub=new THREE.Color(HUB),c=g.attributes.color,p=g.attributes.position,k=g.attributes.aKind;
  const matches=(i,col)=>Math.abs(c.getX(i)-col.r)+Math.abs(c.getY(i)-col.g)+Math.abs(c.getZ(i)-col.b)<1e-4;
  return triangleBuckets(g,tri=>{
    if(!tri.every(i=>k.getX(i)<.5&&(matches(i,tyre)||matches(i,hub))))return 0;
    const x=tri.reduce((a,i)=>a+p.getX(i),0),z=tri.reduce((a,i)=>a+p.getZ(i),0)/3;
    let axle=0;for(let j=1;j<axles.length;j++)if(Math.abs(z-axles[j])<Math.abs(z-axles[axle]))axle=j;
    return 1+(x>0?0:1)+axle*2;
  },1+axles.length*2);
}

export function createTrafficCarModel(ctx,descriptor){
  const meta=descriptor.traffic||descriptor,kind=meta.model||descriptor.kind||descriptor.record?.kind;
  if(!DRIVABLE_KINDS.includes(kind))throw new Error(`Unsupported drivable traffic kind: ${kind}`);
  const record=descriptor.record||descriptor,livery=meta.livery??((record.taxi?1:0)|(record.police?2:0)|(record.amb?4:0));
  const color=colorOf(meta.color??record.color),plate=Math.max(0,Math.min(35,Math.round(meta.plate??record.plate??0)));
  const source=trafficSource(kind),spec=trafficSpec(kind,archOf(kind)),root=new THREE.Group();root.name=`drive-traffic-${kind}`;root.rotation.order='YXZ';
  const paint=preparePaint(source.paint,color,plate),parts=splitWheels(paint,source.wheelAxles||[spec.wb/2,-spec.wb/2]);paint.dispose();
  const material=ctx.mat.toon('#ffffff',{vertexColors:true,map:plateAtlas(ctx),paint:.02,name:'drive-body'});
  const body=new THREE.Mesh(parts[0],material);body.name='drive-body';root.add(body);
  const glassMat=ctx.mat.glass({tint:'#0f1a24',opacity:.72,streaks:true}).clone();glassMat.name='pb-car-glass';
  if(glassMat.fragmentShader)glassMat.fragmentShader=glassMat.fragmentShader.replace('0.35 + 0.45 * fres','0.12 + 0.5 * fres').replace('streak * 0.55','streak * 0.36');
  if(ctx.shared?.uSkyMid&&glassMat.uniforms){glassMat.uniforms.uSkyTop=ctx.shared.uSkyMid;glassMat.uniforms.uSkyLow=ctx.shared.uSkyLow;}
  const glass=new THREE.Mesh(source.glass.clone(),glassMat);glass.name='drive-glass';glass.renderOrder=2;root.add(glass);ctx.noOutline?.(glass);
  const headMat=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false,name:'drive-head'}),tailMat=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false,name:'drive-tail'});
  const lampParts=triangleBuckets(source.lamps,tri=>source.lamps.attributes.aKind.getX(tri[0])<.5?0:1,2);
  const headlights=new THREE.Mesh(lampParts[0],headMat),tailLights=new THREE.Mesh(lampParts[1],tailMat);headlights.name='drive-head';tailLights.name='drive-tail';root.add(headlights,tailLights);ctx.noOutline?.(headlights);ctx.noOutline?.(tailLights);
  const liveryMeshes=[];
  for(const [name,g] of Object.entries(source.extras||{})){
    if(name==='taxi'&&!(livery&1)||['police','pdec'].includes(name)&&!(livery&2)||['amb','adec'].includes(name)&&!(livery&4))continue;
    const decal=name.endsWith('dec'),m=ctx.mat.toon('#ffffff',{vertexColors:true,paint:decal?0:.02,name:decal?'drive-plate':'drive-livery',...(decal?{map:liveryAtlas(ctx),alphaTest:.5,side:'double',polygonOffset:-2}:{})});
    const mesh=new THREE.Mesh(g.clone(),m);mesh.name=`traffic-${name}`;root.add(mesh);liveryMeshes.push(mesh);if(decal)ctx.noOutline?.(mesh);
  }
  const wheels=[];
  for(let i=1;i<parts.length;i++){
    const geometry=parts[i];if(!geometry.attributes.position.count){geometry.dispose();continue;}
    const center=geometry.boundingBox.getCenter(new THREE.Vector3());geometry.translate(-center.x,-center.y,-center.z);
    const pivot=new THREE.Group();pivot.position.copy(center);const mesh=new THREE.Mesh(geometry,material);mesh.name='drive-wheel';pivot.add(mesh);root.add(pivot);wheels.push({pivot,mesh,front:center.z>0});
  }
  const seat={...source.seat};
  const cabin={seat:[seat.x,Math.max(.34,seat.y-.65),seat.z],wheel:[seat.x,seat.wy,seat.wz],floor:Math.max(.18,seat.y-.95),doorFront:seat.wz+.22,doorRear:seat.z-.52};
  if(spec.bus)Object.assign(cabin,{entrySide:1,entryZ:-busDoorZ(kind),entryFloor:.36,doorFront:busDoorZ(kind)+.56,doorRear:busDoorZ(kind)-.56,cabinFront:seat.wz+.25,cabinRear:busDoorZ(kind)-.8});
  const steerWheel=new THREE.Group();steerWheel.position.set(...cabin.wheel);steerWheel.rotation.x=-1.05;
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.18,.021,6,20),ctx.mat.toon('#22272c',{name:'traffic-steering'}));rim.rotation.x=Math.PI/2;steerWheel.add(rim);root.add(steerWheel);
  const driver=new THREE.Group();driver.name='drive-driver';root.add(driver);
  if(livery&1){const light=new THREE.Mesh(new THREE.BoxGeometry(.32,.12,.14),ctx.mat.toon('#f6c316',{name:'traffic-taxi-light'}));light.position.set(0,seat.roofY+.1,seat.roofZ);root.add(light);}
  const glow=new THREE.Group();glow.visible=false;root.add(glow);
  const ownedMaterials=[glassMat,headMat,tailMat],route=meta.route??record.route;
  if(source.board&&Number.isInteger(route)&&route>=0&&route<ROUTES.length){
    const g=new THREE.PlaneGeometry(1.4,.26),uv=g.attributes.uv,C=ROUTE_CELL,col=Math.floor(route/C.per),row=route%C.per;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(col+uv.getX(i))*C.w/C.W,(row+uv.getY(i))*C.h/C.H);
    const m=new THREE.MeshBasicMaterial({map:routeAtlas(ctx),toneMapped:false,name:'traffic-route'}),board=new THREE.Mesh(g,m);board.name='traffic-route';board.position.set(0,source.board.y,source.board.z);root.add(board);ctx.noOutline?.(board);ownedMaterials.push(m);
  }
  if(source.pole){
    // A commandeered trolleybus leaves its wire route: retain both poles folded
    // along the roof, matching the fleet's off-wire pose.
    const p=source.pole,material=ctx.mat.toon('#41454a',{name:'traffic-poles'});
    for(const side of [-1,1]){const start=new THREE.Vector3(side*p.x,p.y,p.z),end=new THREE.Vector3(side*p.x,p.y+.25,p.z-3.4),delta=end.clone().sub(start);
      const rod=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,delta.length(),5),material);rod.name='traffic-trolley-pole';rod.position.copy(start).lerp(end,.5);rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());root.add(rod);}
  }
  root.traverse(o=>{if(o.isMesh){o.castShadow=o!==glass&&o!==headlights&&o!==tailLights;o.receiveShadow=o!==glass;}});
  return {root,body,glass,driver,steerWheel,wheels,seat,cabin,liveryMeshes,headMat,tailMat,ownedMaterials,flames:[],glow,spec,
    set(p){root.position.set(p.x,p.y,p.z);root.rotation.set(-(p.pitch||0),p.yaw,p.roll||0);for(const w of wheels){if(w.front)w.pivot.rotation.y=p.steerAngle||0;w.mesh.rotation.x+=p.spin||0;}steerWheel.rotation.z=-(p.steer||0)*2.2;
      const night=ctx.shared?.uNight?.value||0;headMat.color.setScalar(p.lights ? .9+1.6*night : .55);const br=p.brake>.05?2.2+.5*night:.45+.9*night;tailMat.color.setRGB(br,br*.1,br*.08);},
    setView(inside){driver.visible=!inside;glass.visible=!inside;},
  };
}

export function trafficDefinition(descriptor){
  const data=descriptor.traffic||descriptor,r=descriptor.record||descriptor,kind=data.model||descriptor.kind||r.kind;
  if(!DRIVABLE_KINDS.includes(kind))return null;
  const seat=trafficSource(kind).seat,spec=trafficSpec(kind,archOf(kind));
  spec.eye={x:seat.x,y:seat.y+.02,z:seat.z+.08};spec.fovRest=72;
  const traffic={model:kind,color:colorOf(data.color??r.color),plate:Math.max(0,Math.min(35,Math.round(data.plate??r.plate??0))),livery:data.livery??((r.taxi?1:0)|(r.police?2:0)|(r.amb?4:0))};
  const route=data.route??r.route;if(Number.isInteger(route)&&route>=0&&route<ROUTES.length)traffic.route=route;
  const name=names[kind],tuning=trafficTuning(kind,spec);
  return {id:descriptor.id||`traffic-${kind}-${traffic.plate}`,kind:'traffic',name,nameEn:name,label:'Сесть в машину',labelEn:`Get in the ${name}`,toast:name,
    spec,tuning,traffic,parked:{x:descriptor.x??r.x,z:descriptor.z??r.z,yaw:descriptor.rotY??descriptor.yaw??Math.atan2(r.s||0,r.c??1)},
    boarding:spec.bus?{x:-spec.W/2-.4,y:.8,z:busDoorZ(kind)}:null,
    reach:Math.max(4.6,spec.W/2+3),sound:spec.mass>2500?{f0:20,fk:80,volume:.85}: {},hud:{boost:'NITRO',gearD:false},exhaust:spec.trolley?[]:[{x:spec.W*.29,y:Math.max(.22,spec.R*.7),z:spec.rear-.08}],
    makeModel:ctx=>createTrafficCarModel(ctx,{traffic}),
  };
}
