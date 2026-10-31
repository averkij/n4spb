// Source groups are scoped to the area's data facade. A source group may span
// two territories; only identifiers present in this cut may be claimed here.
import * as CITY from '../../world/data/city.js';
const ids=new Set(Object.values(CITY).filter(Array.isArray).flatMap(a=>a.filter(v=>v&&typeof v==='object'&&v.id).map(v=>v.id)));
const buildings=new Set(CITY.BUILDINGS.map(b=>b.id));
export function scopeGroups(groups) {
  return groups.map(g=>({...g,ids:(g.ids||[]).filter(id=>buildings.has(id)),osm:(g.osm||[]).filter(id=>ids.has(id))}))
    .filter(g=>g.ids.length||g.osm.length)
    .map(g=>{if(!g.at||CITY.EXTENT_RECTS.some(r=>g.at[0]>=r.x0&&g.at[0]<=r.x1&&g.at[1]>=r.z0&&g.at[1]<=r.z1))return g;
      const b=CITY.BUILDINGS.find(b=>g.ids.includes(b.id));return {...g,at:b?[b.cx,b.cz]:undefined};});
}
