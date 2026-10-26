// bridges/sites-south.js - PURE DATA computed from the facade: the southern canal crossings (the Fontanka south of the Anichkov Bridge, the Obvodny canal), registered from the real OSM decks and bridge road axes.
// Copied from 102_3d_piter commit 0568f7af (src/world/bridges/sites-south.js); the n4spb edits are marked 'n4spb:'. Geometry + walk ramps + quay openings use this same frame. Mostotrest bridge references: docs/SOUTH-EXTENSION.md of the
// source project. No invented streets or city-wide updates.
// n4spb: the source picks the decks by its regions C1.. (REGIONS names, playRect); here a deck belongs to the area when its centre lies in the PLAY rectangles of THIS facade and the Anichkov Bridge (landmarksC) is left to its owner.
// Which of the sites an area really builds is the area's choice: sites.js adds only the ids that the area lists in GROUPS.bridges (BRIDGE_GROUP_KEYS), so the other areas (whose facades may hold such a deck in their margin) build none.
// Admiralty-Haymarket lists the six southern Fontanka decks (Lomonosov, Leshtukov, Semenovsky, Gorstkin, Krasnoarmeysky, Egyptian: bridges/groups-sw.js GROUPS_SOUTH), Vladimirsky-Ligovka its Fontanka and Obvodny canal ones (SOUTH_GROUPS below, computed from its own data).
import { BRIDGES, ROADS, WATER, EXTENT_RECTS } from '../data/city.js';
import { EAST_BRIDGE_ROADS } from '../eastBridges/groups.js';
const eastOwned = new Set(EAST_BRIDGE_ROADS.map(r => r.id));
const OTHER_OWNERS = new Set(['r5537267', 'w372394912', 'w372394928']);      // n4spb: the Anichkov Bridge deck and its two ways belong to landmarksC
const insideRect = (r,x,z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
function contains(o,x,z) { let yes=false; for(let a=0,b=o.length-2;a<o.length;b=a,a+=2) if((o[a+1]>z)!==(o[b+1]>z) && x<(o[b]-o[a])*(z-o[a+1])/(o[b+1]-o[a+1])+o[a]) yes=!yes; return yes; }
function centre(o) { let a=0,x=0,z=0; for(let i=0,j=o.length-2;i<o.length;j=i,i+=2){const k=o[j]*o[i+1]-o[i]*o[j+1];a+=k;x+=(o[j]+o[i])*k;z+=(o[j+1]+o[i+1])*k;}return Math.abs(a)>1e-6?[x/(3*a),z/(3*a)]:[o[0],o[1]]; }
function waterAt(x,z) { return WATER.find(w => /^(river|canal)$/.test(w.kind) && w.polys.some(p => contains(p.o,x,z) && !(p.h||[]).some(h=>contains(h,x,z)))); }
const waterways = {'Фонтанка':'fontanka','Обводный канал':'neva','канал Грибоедова':'griboedov','Канал Грибоедова':'griboedov','Мойка':'moika'};
const candidates = ROADS.filter(r=>r.bridge&&!r.tunnel&&!['steps','service','cycleway'].includes(r.hw));
export const SOUTH_SITES = [];
for(const deck of BRIDGES) {
  if(!deck.name || !deck.polys?.length || OTHER_OWNERS.has(deck.id)) continue;
  const o=deck.polys[0].o,[cx,cz]=centre(o);
  if(!EXTENT_RECTS.some(r=>insideRect(r,cx,cz))) continue;
  const ways=candidates.filter(r=>!eastOwned.has(r.id)&&!OTHER_OWNERS.has(r.id)&&r.name===deck.name&&r.pts.some((v,i)=>i%2===0&&Math.hypot(v-cx,r.pts[i+1]-cz)<150));
  if(!ways.length) continue;
  const road=ways.find(r=>!['footway','path','pedestrian'].includes(r.hw)) || ways[0],p=road.pts;
  let dx=p[p.length-2]-p[0],dz=p[p.length-1]-p[1];if(dz<0){dx=-dx;dz=-dz;}const length=Math.hypot(dx,dz);if(length<1)continue;
  const ux=dx/length,uz=dz/length,vx=-uz,vz=ux;
  const cross=[];for(let i=0;i<o.length;i+=2)cross.push((o[i]-cx)*vx+(o[i+1]-cz)*vz);
  let v0=Math.min(...cross),v1=Math.max(...cross);const foot=['footway','path','pedestrian'].includes(road.hw);
  // OSM bridge polygons include flared approach aprons / tower projections.
  // Use documented clear deck widths for these two heritage crossings instead
  // of asphalt-filling their monument projections (Mostotrest dimensions).
  const clearWidth={'r5489278':27.6,'r5586238':16.1}[deck.id];
  if(clearWidth){v0=-clearWidth/2;v1=clearWidth/2;}
  const water=waterAt(cx,cz);if(!water || !waterways[water.name])continue;
  const pavement=foot?0:Math.min(3,(v1-v0)*.13);
  SOUTH_SITES.push({id:'south-'+deck.id,name:deck.name,nameEn:deck.name,kind:foot?'foot':'road',style:foot?'italyansky':'rcarch',
    water:water.id,ww:waterways[water.name],cx,cz,b:Math.atan2(ux,-uz)*180/Math.PI,v0,v1,
    zones:foot?[[v0,v1,'asphalt']]:[[v0,v0+pavement,'pave'],[v0+pavement,v1-pavement,'asphalt'],[v1-pavement,v1,'pave']],
    deckW:v1-v0,gapW:v1-v0+.6,hump:0,soffitCrown:-.55,spring:1.5,hex:'#394843',at:[cx,cz],
    osm:[deck.id,...ways.map(r=>r.id)],south:true});
  if(deck.id==='r5586238') Object.assign(SOUTH_SITES.at(-1), {style:'stone2',stone:true,spans:[18,17,18],pier:2.2,crowns:[-.35,-.5,-.35]});
}
export const SOUTH_GROUPS = SOUTH_SITES.map(s=>({key:s.id,name:s.name,nameEn:s.nameEn,ids:[],osm:s.osm,at:s.at,note:'OSM deck/road axis, bank-to-bank asphalt, walkable ramps and bounded rails.'}));
