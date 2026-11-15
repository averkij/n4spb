// Detailed promoted cars are a small nearby cache. The traffic record remains
// authoritative when a parked model returns to its instanced representation.
export const PROMOTED_LIMIT=12;
export function retirementCandidates(vehicles,{x,z,forward=null,active=null,interacting=null,reserve=0}){
  const promoted=vehicles.filter(v=>v.kind==='traffic'&&!v.retired),out=[];
  const candidates=promoted.filter(v=>v.source&&v!==active&&v!==interacting).map(v=>({v,d:(v.parked.x-x)**2+(v.parked.z-z)**2})).sort((a,b)=>b.d-a.d);
  for(const {v,d} of candidates){
    // An ejected driver may still be reacting beside the player, even after
    // their former car has been driven far away. Let that nearby reaction end.
    const origin=v.cabin?.npcOrigin;
    if(v.cabin?.npc&&origin&&(origin.x-x)**2+(origin.z-z)**2<65**2)continue;
    const behind=forward&&(v.parked.x-x)*forward.x+(v.parked.z-z)*forward.z<0;
    if(d>120**2||promoted.length-out.length+reserve>PROMOTED_LIMIT&&d>65**2&&behind)out.push(v);
  }
  return out;
}
export function disposePromotedModel(model){
  model.root.removeFromParent();
  const geometries=new Set();model.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});
  for(const geometry of geometries)geometry.dispose();
  // Toon materials and atlas textures belong to ctx caches. Only materials
  // explicitly created by this model are private and safe to dispose here.
  for(const material of model.ownedMaterials||[])material.dispose();
  model.root.clear();
}
