// Shared submission and label rule for the central south sights; no animated or unbatchable pieces.
import { makeLabels } from '../streets/labels.js';
import { registerLOD } from '../../core/spatial.js';
export function submit(K,root,name,far=Infinity) {
  const meshes=K.flush(root,name); root.updateMatrixWorld(true);
  for(const m of meshes) { if(far===Infinity)m.userData.skyline=true; registerLOD(m,far); }
  return meshes;
}
export function sign(K,id,x,y,z,w,h,nx,nz,text,o={}) {
  const labels=K.ctx.services.labels ||= makeLabels();
  if(!labels.reserve(id,x,y,z,w,h,nx,nz,'landmark-sign'))return;
  K.fascia(-w/2,w/2,y-h/2,y+h/2,text,{bg:'#e6dfcd',fg:'#665342',z:.12,w:1024,h:96,...o});
}
