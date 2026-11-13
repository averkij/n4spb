// District 64: current mapped Finlyandsky, its riverfront and street overlaps.
import { GROUPS_LIST as STATION_GROUPS } from '../../world/landmarksFinlyandskyStation/groups.js';
import { GROUPS_LIST as DISTRICT_GROUPS } from '../../world/landmarksFinlyandsky/groups.js';
import { GROUPS_LIST as NEVA_BRIDGES } from '../../world/northBridges/groups.js';
import { RIVER } from './data/city.js';

export const ID = 'finlyandsky';
export const BAKE_DIR = 'baked/finlyandsky/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  'environment',
  'northBridges',
  'streets',
  'city',
  'landmarksFinlyandskyStation',
  'landmarksFinlyandsky',
  'props',
  'traffic',
  'people',
  'wildlife',
  'drive',
];
export const LABELS = { northBridges:'Литейный мост', landmarksFinlyandskyStation:'Финляндский вокзал и площадь Ленина', landmarksFinlyandsky:'Кресты и храм на Минеральной', drive:'Машина и катер' };
export const NAMES = { place:'Санкт-Петербург', placeEn:'Saint Petersburg', square:'площадь Ленина', squareEn:'Lenin Square', station:'Финляндский вокзал', stationEn:'Finland Station', streets:{ nevsky:'улица Комсомола', fontanka:'Арсенальная набережная', moika:'Кондратьевский проспект', griboedov:'Минеральная улица' } };
export const SQUARE = { x:233.4, z:-2407.8, name:NAMES.square, nameEn:NAMES.squareEn };
export const OBELISK = { x:233.4, z:-2407.8, h:10 };
// The engine's Moscow rail-yard fallback stays in its established world frame.
// Finland Station's surveyed railway geometry belongs to its landmark builder.
export const STATION = { x:612,z:300,facadeBearing:348,trackBearing:167,tower:{x:602.1,z:246.4} };
export const GROUPS = { landmarksFinlyandskyStation:STATION_GROUPS, landmarksFinlyandsky:DISTRICT_GROUPS, northBridges:NEVA_BRIDGES.filter(g=>g.key==='north-liteyny'&&g.osm.length) };
export function makeAreas(){ return [
  {name:'Финляндский вокзал · Finland Station',c:[286.8,-2578.1],r:100},
  {name:'Площадь Ленина · Lenin Square',c:[233.4,-2407.8],r:120},
  {name:'Кресты · Kresty',c:[713.6,-2336.3],r:200},
  {name:'Храм Посещения · Church of the Visitation',c:[995,-3770],r:80},
  {name:'Литейный мост · Liteyny Bridge',c:[-100,-2164],r:200},
  {name:'Финляндский · Finlyandsky',x0:-20000,x1:20000,z0:-20000,z1:20000},
]; }
export function makeViews({yawToward}){
  const pose=(x,z,tx,tz,pitch=8)=>({x,z,yaw:yawToward(x,z,tx,tz),pitch});
  const HERO=pose(270,-2484,286.8,-2578.1,12);
  return {HERO,VIEWS:[
    {key:'Digit1',label:'Финляндский вокзал',...HERO},
    {key:'Digit2',label:'Площадь Ленина и фонтаны',...pose(225,-2346,233.4,-2407.8,6)},
    {key:'Digit3',label:'Кресты',...pose(729,-2262,713.6,-2336.3,14)},
    {key:'Digit4',label:'Храм на Минеральной',...pose(1037,-3725,995,-3770,17)},
    {key:'Digit5',label:'Литейный мост',...pose(-32,-2380,-100,-2164,4)},
    {key:'Place.finland-station',label:'Финляндский вокзал',...HERO},
  ]};
}
export const TEST={claimed:[{id:'r2123616',by:'landmarksFinlyandskyStation',group:'finlyandsky-station'},{id:'r17026343',by:'landmarksFinlyandsky',group:'finlyandsky-kresty'},{id:'r17026341',by:'landmarksFinlyandsky',group:'finlyandsky-kresty'},{id:'w366423247',by:'landmarksFinlyandsky',group:'finlyandsky-visitation'}],viewKeys:['Digit1','Digit2','Digit3','Digit4','Digit5','Place.finland-station'],mustHaveAreas:[{x:233.4,z:-2407.8,has:'lenin'}],riverAny:[[480,-2160]],riverBed:[[480,-2160]],farPoint:[1800,-5200]};
export const WATER = {
  farCenter:[1600,-3500],farRadius:7000,
  riverKeys:Object.fromEntries(RIVER.filter(r=>r.name).map(r=>[r.name,r.kind==='pond'?'moat':'neva'])),
  isolatedKeys:{moat:'Mapped isolated inland ponds.'},isolatedLevels:{moat:{water:-1.2,bed:-2.4}},
  bridgeZones:[{id:'liteyny',name:'Литейный мост',key:'neva',c:[-100.6,-2164.4],axis:173.17,w:35.6,len:550,own:true}],
  bridgeShades:[{id:'liteyny',key:'neva',c:[-100.6,-2164.4],axis:173.17,w:34.6,len:387}],
};
export const ZONES={peopleDensity:{west:{scale:1,platforms:1,off:true},mars:{scale:1,zones:[],off:true}},peopleHot:[[270,-2484,1,35],[233.4,-2407.8,.6,45]],clearDiscs:[{x:233.4,z:-2407.8,r:12}],crowHaunts:[{x:233,z:-2400,r:120}],farCentres:[{x:1600,z:-3500,bias:500}]};
export const GARAGE={poses:{lada:{x:270,z:-2484,yaw:0}},spawn:{x:270,z:-2484,yaw:0},boats:[{id:'boat-finlyandsky',dock:'finlyandsky-neva',x:480,z:-2160,yaw:Math.PI/2}]};
export const PRUNE_SERVICES=['city','landmarksFinlyandskyStation','landmarksFinlyandsky'];
export const HOOKS={deckServices:['northBridges']};
export const HEIGHT_PATCHES=[];
export const CROSS_PLACES=[];
