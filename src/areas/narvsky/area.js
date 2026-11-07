// Narvsky, planning-map area 73. Exact mapped land and water; no water exclusion.
import { GROUPS_LIST as GATE } from '../../world/landmarksNarva/groups.js';
import { GROUPS_LIST as CLUB } from '../../world/landmarksNarvsky/constructivism-groups.js';
import { COASTAL_BRIDGE_GROUPS, COASTAL_BRIDGE_ZONES } from './bridge-sites.js';
import { RIVER } from './data/city.js';

export const ID = 'narvsky';
export const BAKE_DIR = 'baked/narvsky/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  'environment',
  'streets',
  'city',
  'landmarksNarvsky',
  'coastalBridges',
  'props',
  'traffic',
  'people',
  'wildlife',
  'drive',
];
export const LABELS = { landmarksNarvsky:'Нарвские ворота и Дворец культуры имени Горького', coastalBridges:'Мосты Нарвского района', drive:'Машина и катера' };
export const NAMES = { place:'Санкт-Петербург',placeEn:'Saint Petersburg',square:'площадь Стачек',squareEn:'Stachek Square',station:'Нарвская',stationEn:'Narvskaya',streets:{nevsky:'проспект Стачек',fontanka:'набережная реки Екатерингофки',moika:'Бумажная улица',griboedov:'Промышленная улица'} };
export const SQUARE = { x:-4329.2,z:3510.4,name:NAMES.square,nameEn:NAMES.squareEn };
export const OBELISK = { x:-4329.2,z:3510.4,h:31 };
export const STATION = { x:612,z:300,facadeBearing:348,trackBearing:167,tower:{x:602.1,z:246.4} };
export const GROUPS = { landmarksNarvsky:[...GATE,...CLUB,{key:'narvsky-toll-canopy',name:'Навес над съездом ЗСД',ids:['w685882720'],osm:[],at:[-3182.1,6038.7]}],coastalBridges:COASTAL_BRIDGE_GROUPS };
export function makeAreas(){return [
  {name:'Нарвские триумфальные ворота · Narva Triumphal Gate',c:[-4329.2,3510.4],r:75},
  {name:'Дворец культуры имени Горького · Gorky Palace of Culture',c:[-4220.5,3556.6],r:75},
  {name:'Нарвский · Narvsky',x0:-20000,x1:20000,z0:-20000,z1:20000},
];}
export function makeViews({yawToward}){
  const HERO={x:-4361,z:3546,yaw:yawToward(-4361,3546,-4329.2,3510.4),pitch:13};
  const club={x:-4277,z:3571,yaw:yawToward(-4277,3571,-4237,3568),pitch:10};
  const north={x:-4325,z:3480,yaw:yawToward(-4325,3480,-4329.2,3510.4),pitch:14};
  return {HERO,VIEWS:[{key:'Digit1',label:'Нарвские триумфальные ворота',...HERO},{key:'Digit2',label:'Дворец культуры имени Горького',...club},{key:'Digit3',label:'Нарвские ворота · северный фасад',...north},{key:'Place.narva-gate',label:'Нарвские триумфальные ворота',...HERO},{key:'Place.gorky-palace',label:'Дворец культуры имени Горького',...club}]};
}
export const TEST={claimed:[{id:'w73174258',by:'landmarksNarvsky',group:'narva-gate'},{id:'w42342130',by:'landmarksNarvsky',group:'narvsky-gorky'},{id:'w685882720',by:'landmarksNarvsky',group:'narvsky-toll-canopy'}],viewKeys:['Digit1','Digit2','Digit3','Place.narva-gate','Place.gorky-palace'],mustHaveAreas:[{x:-4329.2,z:3510.4,has:'narva'}],farPoint:[-5000,6000]};
export const WATER={farCenter:[-4900,4300],farRadius:7000,farSources:[],bridgeZones:COASTAL_BRIDGE_ZONES,
  riverKeys:Object.fromEntries(RIVER.map(r=>[r.name,r.key||'neva'])),
  isolatedKeys:{moat:'Mapped isolated garden ponds, with no navigable river outlet.'},isolatedLevels:{moat:{water:-1.2,bed:-2.4}},
  slopeReaches:[{id:'narvsky-pond-banks',key:'moat',run:6,kerb:.1,lip:.04,test:()=>true,rail:()=>null}],
};
export const ZONES={peopleDensity:{west:{scale:1,platforms:1,off:true},mars:{scale:1,zones:[],off:true}},peopleHot:[[-4330,3530,1,32],[-4255,3570,.6,24]],crowHaunts:[{x:-4329,z:3510,r:110}],farCentres:[{x:-4350,z:4000,bias:700}]};
// Follow the avenue tangent: a south-facing car used to meet the facade after
// 19m. The 25-degree exit is verified through acceleration and full braking.
export const GARAGE={poses:{lada:{x:-4363,z:3547,yaw:25*Math.PI/180}},spawn:{x:-4363,z:3547,yaw:25*Math.PI/180},boats:[{id:'boat-narvsky',dock:'narvsky-ekateringofka',x:-5596,z:3476,yaw:-Math.PI/2}]};
export const PRUNE_SERVICES=['city','landmarksNarvsky'];
// The gate is an arch, so the data's elevated footprint must not reserve a
// ground building collider or plant a tree inside the open through passage.
export const OPEN_GROUND_BUILDING_IDS=['w73174258'];
export const HOOKS={deckServices:['coastalBridges'],treeReject:()=> (x,z)=>Math.hypot(x+4329.2,z-3510.4)<24};
export const HEIGHT_PATCHES=[];
export const CROSS_PLACES=[];
