import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeModel} from '../traffic/models.js';
import {ARTIC_REAR_OFFSET,archOf} from '../traffic/fleetdata.js';

let articulated=null;
/** Owned articulated buses use the complete three-axle body with a rigid
 * full-length collision footprint. Routed traffic keeps its articulated solver. */
export function trafficSource(kind){
  if(kind!=='artic')return makeModel(kind,0);
  if(!articulated){
    const front=makeModel('artic_f',0),rear=makeModel('artic_r',0);
    const merge=key=>{const tail=rear[key].clone().translate(0,0,ARTIC_REAR_OFFSET),g=mergeGeometries([front[key],tail]);tail.dispose();return g;};
    articulated={...front,kind:'artic',paint:merge('paint'),glass:merge('glass'),lamps:merge('lamps'),
      wheelAxles:[archOf('artic_f').wb/2,-archOf('artic_f').wb/2,ARTIC_REAR_OFFSET-archOf('artic_r').wb/2]};
  }
  return articulated;
}
