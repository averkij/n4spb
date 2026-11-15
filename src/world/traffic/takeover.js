import {archOf} from './fleetdata.js';
import {bindParkedImpact} from './impact.js';

// Identity and ownership for instanced cars. Queries touch a few local cells;
// they do not scan the city's thousands of parked cars on every input frame.
export function createTrafficTakeovers({physics,sim,parkedRecords,wrecks,refresh=()=>{},reservedIds=[]}) {
  const CELL=16,grid=new Map(),records=new WeakMap(),moving=new Set();
  const reserved=new Set(reservedIds);
  let serial=0,epoch=0;
  const key=(x,z)=>`${Math.floor(x/CELL)},${Math.floor(z/CELL)}`;
  function unindex(d){const cell=grid.get(d.cell);if(cell){cell.delete(d);if(!cell.size)grid.delete(d.cell);}d.cell=null;}
  function index(d){const next=key(d.x,d.z);if(next===d.cell)return;unindex(d);let cell=grid.get(next);if(!cell)grid.set(next,cell=new Set());cell.add(d);d.cell=next;}
  function sync(d){
    const r=d.record;d.x=r.x;d.y=r.y;d.z=r.z;d.rotY=Math.atan2(r.s,r.c);
    d.speed=r.wreckSource?.speed??d.vehicle?.v??0;d.occupied=!!r.driver;
    d.color=r.color;d.plate=r.plate;d.taxi=!!r.taxi;d.police=!!r.police;d.amb=!!r.amb;
    d.damageState=r.damageState;d.wrecked=!!r.wrecked;return d;
  }
  function register(record,vehicle=null,collider=null){
    const spec=archOf(record.kind);if(!spec||spec.bus||spec.part||record.claimed)return null;
    let d=records.get(record);
    if(!d){let id;do{id=`traffic-car-${++serial}`;}while(reserved.has(id));d={id,kind:record.kind,spec,record,vehicle,collider,status:'available',cell:null};records.set(record,d);}
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
        const dd=(d.x-x)**2+(d.z-z)**2;if(dd<distance){distance=dd;best=d;}
      }
    }
    return best;
  }
  function claim(d){
    if(!valid(d)||d.status!=='available'||d.vehicle?.retired)return null;
    // Wreck release synchronizes the final Rapier pose before removing physics.
    wrecks?.release?.(d.record);sync(d);
    if(d.vehicle&&!sim?.detach(d.vehicle))return null;
    if(d.collider)physics.remove(d.collider);
    unindex(d);moving.delete(d);d.status='claimed';d.wasOccupied=d.occupied;
    d.record.claimed=true;d.record.driver=false;d.occupied=false;d.speed=0;
    refresh();return d;
  }
  function commitClaim(d){if(!valid(d)||d.status!=='claimed')return false;d.status='owned';return true;}
  function restore(d,pose,occupant){
    if(!valid(d)||!['claimed','owned'].includes(d.status))return false;
    const r=d.record,a=d.spec;
    if(pose){for(const k of ['x','y','z'])if(Number.isFinite(pose[k]))r[k]=pose[k];if(Number.isFinite(pose.rotY??pose.yaw)){r.c=Math.cos(pose.rotY??pose.yaw);r.s=Math.sin(pose.rotY??pose.yaw);}}
    r.claimed=false;r.driver=occupant;r.wrecked=false;r.wreckBody=null;
    d.vehicle=null;d.status='available';sync(d);
    const offset=(a.front+a.rear)/2;
    d.collider=physics.addBox(r.x+r.s*offset,r.z+r.c*offset,a.wid+.08,a.len+.08,d.rotY,r.y,r.y+a.hgt);
    bindParkedImpact(d.collider,r,a,wrecks);
    if(!parkedRecords.includes(r))parkedRecords.push(r);
    index(d);refresh();return true;
  }
  function cancelClaim(d){return valid(d)&&d.status==='claimed'?restore(d,null,!!d.wasOccupied):false;}
  function release(d,pose){return restore(d,pose,!!pose?.occupied);}
  function begin(){epoch++;}
  function end(){for(const d of moving)if(d.seen!==epoch||d.vehicle.retired){unindex(d);moving.delete(d);}}
  return {register,begin,end,nearestEnterable,claim,commitClaim,cancelClaim,release};
}
