// Surveyed OSM points in WGS84; fallback only while the new map is being baked.
// Runtime prefers the mapped city record by exact ID. Metres use the same fixed
// equirectangular origin as tools/osm-lib.mjs; never an invented scene offset.
import * as CITY from '../data/city.js';
import { polyCentroid, ringFromFlat } from '../lib/massing.js';
const lat0=CITY.ORIGIN.lat*Math.PI/180;
const KX=111412.84*Math.cos(lat0)-93.5*Math.cos(3*lat0)+.118*Math.cos(5*lat0);
const KY=111132.954-559.822*Math.cos(2*lat0)+1.175*Math.cos(4*lat0);
export function ll(lon,lat) {return {x:(lon-CITY.ORIGIN.lon)*KX,z:-(lat-CITY.ORIGIN.lat)*KY};}
const byId=new Map([...(CITY.MONUMENTS||[]),...(CITY.FOUNTAINS||[]),...(CITY.BUILDINGS||[])].map(o=>[o.id,o]));
export function site(id,lon,lat) {const q=byId.get(id);return q?{...q,x:q.x??q.cx,z:q.z??q.cz}: {...ll(lon,lat),id};}
/** The real entrance roofs are multipolygon relations, not individual tagged
 * ways. Use their centroid, longest eastward edge and projected dimensions. */
export function porticoFrame(id, south = false) {
 const b=byId.get(id);if(!b?.polys?.[0])throw new Error('Missing Victory Park portico roof '+id);
 const poly=b.polys[0],ring=ringFromFlat(poly.o),[x,z]=polyCentroid(poly);let edge=null;
 for(let i=0;i<ring.length;i++){
  let dx=ring[(i+1)%ring.length][0]-ring[i][0],dz=ring[(i+1)%ring.length][1]-ring[i][1];const len=Math.hypot(dx,dz);
  if(!edge||len>edge.len){if(dx<0){dx=-dx;dz=-dz;}edge={len,rot:Math.atan2(-dz,dx)};}
 }
 const c=Math.cos(edge.rot),s=Math.sin(edge.rot),pts=ring.map(p=>[(p[0]-x)*c-(p[1]-z)*s,(p[0]-x)*s+(p[1]-z)*c]);
 const w=Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),d=Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1]));
 return {id,x,z,w,d,rot:edge.rot+(south?Math.PI:0),ring};
}
export function entranceApproach(x) {
 const way=CITY.ROADS.find(r=>r.id==='w1205036900'),pts=way?.pts;
 if(!pts||pts.length<4)throw new Error('Missing mapped Victory Park entrance approach');
 const ax=pts[0],az=pts[1],bx=pts[pts.length-2],bz=pts[pts.length-1];
 const z=az+(x-ax)*(bz-az)/(bx-ax),yaw=Math.atan2(-(bx-ax),-(bz-az))*180/Math.PI;
 return {x,z,yaw};
}
export const HEROES=[
 ['n3039562533','В. М. Голубев',30.3238289,59.8690648],['n3039562534','С. И. Богданов',30.3241029,59.8690682],['n3039562536','Е. П. Фёдоров',30.3243833,59.8690717],
 ['n3039562537','В. Н. Осипов',30.3238340,59.8688711],['n3039562538','Н. В. Челноков',30.3241119,59.8688745],['n3039562539','В. И. Раков',30.3243887,59.8688765],
 ['n3039562535','Г. М. Гречко',30.3249110,59.8692021],['n3039594770','Г. С. Уланова',30.3300011,59.8691608],['n3039594771','А. Н. Чилингаров',30.3300027,59.8689594],
 ['n3039594772','А. Н. Косыгин',30.3313124,59.8692224],['n3039594773','А. В. Чуев',30.3322693,59.8691820],['n3039594774','А. Н. Щукин',30.3325184,59.8691865],
 ['n3039594775','Н. Н. Исанин',30.3328026,59.8691919],['n3039594776','В. А. Смирнов',30.3330732,59.8691941],['n3039594777','А. П. Виноградов',30.3322752,59.8690031],
 ['n3039594778','Ю. Б. Харитон',30.3325350,59.8690043],['n3039594779','С. Н. Ковалёв',30.3328129,59.8690134],['n3039594780','Н. А. Пилюгин',30.3330840,59.8690129],
 ['n4485911838','В. С. Чичеров',30.3340536,59.8691986],['n4485911839','М. П. Панфилов',30.3340686,59.8690434],['n5141526656','Н. С. Майданов',30.3304296,59.8691613],['n11209562878','С. К. Крикалёв',30.3338088,59.8693105],
];
