import { registerLOD } from '../core/spatial.js';
import { westDetail } from './west-landmark-details.js';

// The three landmark kits share this collector interface. Keep a whole
// ornament together per material and range it separately from its building.
export function westDetailBatch(K, name, far) {
  const part=new K.P.constructor();
  return {
    add(key,mat,x,y,z,yaw=0,scale=1) {
      part.m.copy(K.P.m);
      part.geo(mat,westDetail(key),x,y,z,0,yaw,0,scale);
    },
    finish() {
      for(const mesh of part.build(K.root,{name})) {
        mesh.updateMatrixWorld(true);registerLOD(mesh,far);
      }
      K.extraTris+=part.tris;
    },
  };
}
