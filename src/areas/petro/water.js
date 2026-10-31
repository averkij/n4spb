// Northern water ownership: mapped water and source context stay traversable.
import { RIVER, WATER, ROADS, EXTENT_RECTS } from '../../world/data/city.js';
import { PETRO_WATER } from '../../world/environment/petro-water.js';
import { ISLANDS2_WATER } from '../../world/environment/islands2-context.js';
import { GROUPS } from './bridge-groups.js';
import { ZONES, SHADES } from './zones.js';
import { scopeGroups } from './groups.js';
import { CHANNELS } from './channels.js';
import { triangulateRing } from './triangulate-ring.js';
const near = p => p && EXTENT_RECTS.some(r => p[0]>=r.x0-100 && p[0]<=r.x1+100 && p[1]>=r.z0-100 && p[1]<=r.z1+100);
export const BRIDGE_GROUPS = scopeGroups(GROUPS.filter(g => near(g.at)).concat(ROADS.some(r=>r.id==='w589047643')?[{key:'whsd-petrovsky',name:'ЗСД · Петровский фарватер',nameEn:'WHSD Petrovsky fairway and northern approaches',ids:[],osm:['w589047643','w589047646','w589047648','w589047650','w123232666','w123232674'],at:[-7540,-3800]}]:[]));
const keyByName = Object.fromEntries(RIVER.filter(r=>r.name).map(r=>[r.name,r.name==='Карповка'?'karpovka':r.name==='Ждановка'?'zhdanovka':r.name==='Чухонка'?'park-pond':'neva']));
const riverIds=new Set(RIVER.map(r=>r.id));
// The source keeps smaller ponds (including water directly under park bridges)
// in WATER rather than RIVER. Bring those polygons into the same water model.
const contextIds=new Set(ISLANDS2_WATER.map(p=>p.rel||p.id.split('.')[0]).concat(['r1266760','r1312629']));
const pieces=p=>p.h?.length?triangulateRing(p.o,p.h).map(t=>t.flat()):[p.o];
const riverRings=Object.fromEntries(RIVER.filter(r=>r.id&&r.polys.some(p=>p.h?.length)).map(r=>[r.id,r.polys.flatMap(pieces)]));
const ponds=WATER.filter(w=>w.kind!=='fountain'&&!riverIds.has(w.id)&&!contextIds.has(w.id)).flatMap(w=>w.polys.flatMap((p,i)=>{
 const key=w.kind!=='pond'||(p.o[0]<-4400&&p.o[1]<-4800)?'neva':'park-pond';
 return pieces(p).map((ring,j)=>({id:w.id+'-pond-'+i+'-'+j,key,ring}));
}));
const mappedZones=BRIDGE_GROUPS.flatMap(g=>ROADS.filter(r=>(g.osm||[]).includes(r.id)&&r.bridge&&r.pts).flatMap(r=>{
 const out=[];for(let i=0;i+3<r.pts.length;i+=2){const [ax,az,bx,bz]=r.pts.slice(i,i+4);out.push({id:g.key+'-'+r.id+'-'+i,key:'*',c:[(ax+bx)/2,(az+bz)/2],axis:Math.atan2(bx-ax,az-bz)*180/Math.PI,w:(r.w||7)+4,len:Math.hypot(bx-ax,bz-az),own:true,quayOnly:true});}return out;
}));
export const WATER_TABLE = {
  keyByName, riverKeys:keyByName, riverRings,channels:[...CHANNELS,...ponds],precisePiers:['w158360714','w107077410'],
  isolatedKeys:{'park-pond':'Mapped inland park ponds without a river outlet; small scenery-side fragments remain shared with the neighbouring territory.'},
  quayOpenings:[...CHANNELS,{ring:[-3860,-3990,-3810,-3990,-3810,-3935,-3860,-3935]},{ring:[-3655,-1970,-3620,-1970,-3620,-1930,-3655,-1930]}],
  dataWater: WATER.filter(w=>w.id==='r2893409').map(w=>({id:w.id,key:'kronverk-moat'})),
  dataRings: [
    {id:'malaya-neva',key:'neva',source:'neva-malaya'},
    ...PETRO_WATER.filter(p=>p.id==='r1312629'||p.id==='r1266760').map(p=>({id:'petro-'+p.id,key:p.key,ring:p.o})),
    ...ISLANDS2_WATER.map(p=>({id:'north-'+p.id,key:'neva',ring:p.o})),
  ],
  bridgeZones: [...ZONES.filter(z=>near(z.c)),...mappedZones], bridgeShades: SHADES.filter(z=>near(z.c)),
  farCenter:[-4000,-3500],farRadius:7000,
};
