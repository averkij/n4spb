import {archOf,DRIVABLE_KINDS,ARTIC_REAR_OFFSET,busDoorZ} from './fleetdata.js';
import {bindParkedImpact} from './impact.js';
import {createDamageState} from '../drive/damage.js';

// A bus that has been driven uses one rigid 18 m body, including after returning
// to the instanced fleet. Its trailer has no independent collision source.
function syncArtic(r){
  const tail=r.trailer;if(!r.rigidArtic||!tail)return;
  Object.assign(tail,{x:r.x+r.s*ARTIC_REAR_OFFSET,y:r.y,z:r.z+r.c*ARTIC_REAR_OFFSET,s:r.s,c:r.c,cp:r.cp,sp:r.sp});
  const state=r.damageState;if(!state)return;
  const front=r.visualDamageState||(r.visualDamageState=createDamageState()),rear=tail.visualDamageState||(tail.visualDamageState=createDamageState());
  if(front.revision===state.revision&&rear.revision===state.revision)return;
  Object.assign(front,{front:state.front,rear:0,left:state.left,right:state.right,revision:state.revision});
  Object.assign(rear,{front:0,rear:state.rear,left:state.left,right:state.right,revision:state.revision});
}

// Identity and ownership for instanced cars. Queries touch a few local cells;
// they do not scan the city's thousands of parked cars on every input frame.
export function createTrafficTakeovers({physics,sim,parkedRecords,wrecks,refresh=()=>{},reservedIds=[]}) {
  const CELL=16,grid=new Map(),records=new WeakMap(),moving=new Set();
  const reserved=new Set(reservedIds);
  let serial=0,epoch=0;
  const key=(x,z)=>`${Math.floor(x/CELL)},${Math.floor(z/CELL)}`;
  function unindex(d){const cell=grid.get(d.cell);if(cell){cell.delete(d);if(!cell.size)grid.delete(d.cell);}d.cell=null;}
  function index(d){const next=key(d.entryX,d.entryZ);if(next===d.cell)return;unindex(d);let cell=grid.get(next);if(!cell)grid.set(next,cell=new Set());cell.add(d);d.cell=next;}
  function sync(d){
    const r=d.record;syncArtic(r);d.x=r.x;d.y=r.y;d.z=r.z;d.rotY=Math.atan2(r.s,r.c);
    d.speed=r.wreckSource?.speed??d.vehicle?.v??0;d.occupied=!!r.driver;
    d.color=r.color;d.plate=r.plate;d.taxi=!!r.taxi;d.police=!!r.police;d.amb=!!r.amb;
    const ex=d.spec.bus?-d.spec.wid/2-.4:0,ez=d.spec.bus?busDoorZ(d.kind):0;
    d.entryX=r.x+r.c*ex+r.s*ez;d.entryZ=r.z-r.s*ex+r.c*ez;d.route=r.route;
    d.damageState=r.damageState;d.wrecked=!!r.wrecked;return d;
  }
  function register(record,vehicle=null,collider=null){
    const kind=record.logicalKind||vehicle?.kind||record.kind,spec=archOf(kind);if(!DRIVABLE_KINDS.includes(kind)||record.claimed)return null;
    let d=records.get(record);
    if(!d){let id;do{id=`traffic-car-${++serial}`;}while(reserved.has(id));d={id,kind,spec,record,vehicle,collider,status:'available',cell:null};records.set(record,d);}
    d.trailer=record.trailer||vehicle?.rec2||null;
    if(d.status!=='available')return d;
    if(collider)d.collider=collider;
    d.seen=epoch;sync(d);index(d);if(vehicle)moving.add(d);return d;
  }
  const valid=d=>d&&records.get(d.record)===d;
  function nearestEnterable(x,z,radius=5){
    let best=null,distance=radius*radius;
    for(let i=Math.floor((x-radius)/CELL);i<=Math.floor((x+radius)/CELL);i++)for(let j=Math.floor((z-radius)/CELL);j<=Math.floor((z+radius)/CELL);j++){
      for(const d of grid.get(`${i},${j}`)||[]){
        if(d.status!=='available'||d.record.claimed||d.vehicle?.retired)continue;
        const dd=(d.entryX-x)**2+(d.entryZ-z)**2;if(dd<distance){distance=dd;best=d;}
      }
    }
    return best;
  }
  function claim(d){
    if(!valid(d)||d.status!=='available'||d.vehicle?.retired)return null;
    if(d.vehicle&&!sim?.vehicles.includes(d.vehicle))return null;
    // Wreck release synchronizes the final Rapier pose before removing physics.
    wrecks?.release?.(d.record);sync(d);
    if(d.trailer){wrecks?.release?.(d.trailer);d.trailer.claimed=true;if(d.trailer.trafficCollider)physics.remove(d.trailer.trafficCollider);
      const tail=d.trailer.damageState;if(tail&&!d.record.rigidArtic){const state=d.record.damageState||(d.record.damageState=createDamageState());state.rear=Math.max(state.rear||0,tail.front||0,tail.rear||0);for(const k of ['left','right'])state[k]=Math.max(state[k]||0,tail[k]||0);state.revision++;d.damageState=state;}}
    if(d.vehicle&&!sim?.detach(d.vehicle))return null;
    if(d.collider)physics.remove(d.collider);
    unindex(d);moving.delete(d);d.status='claimed';d.wasOccupied=d.occupied;
    d.wasPax=!!d.record.pax;d.record.claimed=true;d.record.driver=false;d.record.pax=false;d.record.door=0;d.occupied=false;d.speed=0;
    refresh();return d;
  }
  function commitClaim(d){if(!valid(d)||d.status!=='claimed')return false;d.status='owned';return true;}
  function restore(d,pose,occupant){
    if(!valid(d)||!['claimed','owned'].includes(d.status))return false;
    const r=d.record;
    if(pose){for(const k of ['x','y','z'])if(Number.isFinite(pose[k]))r[k]=pose[k];if(Number.isFinite(pose.rotY??pose.yaw)){r.c=Math.cos(pose.rotY??pose.yaw);r.s=Math.sin(pose.rotY??pose.yaw);}}
    r.claimed=false;r.driver=occupant;r.wrecked=false;r.wreckBody=null;
    if(r.pole){const p=r.pole;r.tips=new Float32Array(8);for(let i=0;i<2;i++){const x=i?-p.x:p.x;r.tips[i*3]=r.x+r.c*x+r.s*(p.z-3.4);r.tips[i*3+1]=r.y+p.y+.25;r.tips[i*3+2]=r.z-r.s*x+r.c*(p.z-3.4);}r.tips[6]=r.c;r.tips[7]=r.s;}
    d.vehicle=null;d.status='available';sync(d);
    const primary=d.trailer?d.spec:archOf(r.kind),primaryOffset=(primary.front+primary.rear)/2;
    d.collider=physics.addBox(r.x+r.s*primaryOffset,r.z+r.c*primaryOffset,primary.wid+.08,primary.len+.08,d.rotY,r.y,r.y+primary.hgt);
    const source=bindParkedImpact(d.collider,r,primary,wrecks);
    if(d.trailer){const tail=d.trailer;
      r.rigidArtic=true;Object.assign(tail,{claimed:false,driver:false,pax:false,trafficCollider:null});
      source.syncParts=()=>syncArtic(r);syncArtic(r);
      if(!parkedRecords.includes(tail))parkedRecords.push(tail);
    }
    if(!parkedRecords.includes(r))parkedRecords.push(r);
    index(d);refresh();return true;
  }
  function cancelClaim(d){if(!valid(d)||d.status!=='claimed')return false;d.record.pax=d.wasPax;return restore(d,null,!!d.wasOccupied);}
  function release(d,pose){return restore(d,pose,!!pose?.occupied);}
  function begin(){epoch++;}
  function end(){for(const d of moving)if(d.seen!==epoch||d.vehicle.retired){unindex(d);moving.delete(d);}}
  return {register,begin,end,nearestEnterable,claim,commitClaim,cancelClaim,release};
}
