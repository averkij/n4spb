// Reuse the tested bounded static collector. Singleton authored roof profiles
// are ordinary meshes, allowing the engine to merge/split them by material.
// Repeated columns, frames and furniture retain 192 m instance buckets.
import * as THREE from 'three';
import { ParkKit } from '../landmarksVictoryPark/kit.js';
import { registerLOD } from '../../core/spatial.js';

export class SightKit extends ParkKit {
  finish() {
    let tris=0;const meshes=[];
    for(const b of this.buckets.values()){
      let mesh;
      if(b.matrices.length===1){mesh=new THREE.Mesh(b.geo,b.mat);b.matrices[0].decompose(mesh.position,mesh.quaternion,mesh.scale);}
      else{mesh=new THREE.InstancedMesh(b.geo,b.mat,b.matrices.length);b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.computeBoundingBox();mesh.computeBoundingSphere();}
      mesh.name='krestovsky-'+b.key;mesh.castShadow=mesh.receiveShadow=true;
      if(b.key.startsWith('label-')||this.noOutlineMaterials.has(b.mat))this.ctx.noOutline(mesh);
      this.root.add(mesh);mesh.updateMatrixWorld(true);registerLOD(mesh,b.far);
      tris+=(b.geo.index?.count??b.geo.attributes.position.count)/3*b.matrices.length;meshes.push(mesh);
    }
    return {tris,meshes};
  }
}
