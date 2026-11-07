import * as L from './layout.js';
import { buildGate } from './landmarksNarvsky/gate.js';
import { buildConstructivism } from './landmarksNarvsky/constructivism.js';
export const OWNS_GROUPS = true;
export function build(ctx){
  const svc={houses:[],monuments:[],photoSpots:[],entrances:[],parts:{},triangles:0};
  const rec=L.groupMembers('narva-gate').find(b=>b.id==='w73174258');
  if(rec){const gate=buildGate(ctx,rec);svc.triangles+=gate.triangles;svc.parts.gate=gate.frame;svc.monuments.push(...(ctx.services.landmarksNarva?.monuments||[]));}
  buildConstructivism(ctx,svc);
  ctx.services.landmarksNarvsky=svc;
}
