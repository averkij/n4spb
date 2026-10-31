import { CONTEXT, CONTEXT_NAMES } from './water-context.js';
import { scopeGroups } from '../petro/groups.js';
// Krestovsky–Kamenny–Yelagin: source landmarks adapted to n4spb water and knock contracts.
import * as G0 from '../../world/landmarksKrestovsky/groups.js';
import * as G1 from '../../world/landmarksYelaginPalace/groups.js';
import * as G2 from '../../world/landmarksYelaginKitchen/groups.js';
import * as G3 from '../../world/landmarksYelaginServices/groups.js';
import * as G4 from '../../world/landmarksYelaginRossi/groups.js';
import * as G5 from '../../world/landmarksYelaginSpits/groups.js';
import * as G6 from '../../world/landmarksYelaginPark/groups.js';
import * as G7 from '../../world/landmarksKamennyPalace/groups.js';
import * as G8 from '../../world/landmarksKamennyChurch/groups.js';
import * as G9 from '../../world/landmarksKamennyTheatre/groups.js';
import * as G10 from '../../world/landmarksKamennyDachasEast/groups.js';
import * as G11 from '../../world/landmarksKamennyDachasWest/groups.js';
import { WATER_TABLE, BRIDGE_GROUPS } from '../petro/water.js';
export const ID = 'islands';
export const BAKE_DIR = 'baked/islands/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  "environment",
  "streets",
  "city",
  "landmarksKrestovsky",
  "landmarksYelaginPalace",
  "landmarksYelaginKitchen",
  "landmarksYelaginServices",
  "landmarksYelaginRossi",
  "landmarksYelaginSpits",
  "landmarksYelaginPark",
  "landmarksKamennyPalace",
  "landmarksKamennyChurch",
  "landmarksKamennyTheatre",
  "landmarksKamennyDachasEast",
  "landmarksKamennyDachasWest",
  "bridges",
  "bridgesPetro",
  "props",
  "traffic",
  "people",
  "wildlife",
  "drive"
];
export const LABELS = {"landmarksKrestovsky":"Krestovsky","landmarksYelaginPalace":"YelaginPalace","landmarksYelaginKitchen":"YelaginKitchen","landmarksYelaginServices":"YelaginServices","landmarksYelaginRossi":"YelaginRossi","landmarksYelaginSpits":"YelaginSpits","landmarksYelaginPark":"YelaginPark","landmarksKamennyPalace":"KamennyPalace","landmarksKamennyChurch":"KamennyChurch","landmarksKamennyTheatre":"KamennyTheatre","landmarksKamennyDachasEast":"KamennyDachasEast","landmarksKamennyDachasWest":"KamennyDachasWest"};
export const NAMES = {
  place: 'Санкт-Петербург', placeEn: 'Saint Petersburg',
  square: 'площадь Восстания', squareEn: 'Vosstaniya Square',
  station: 'Московский вокзал', stationEn: 'Moscow Railway Station',
  streets: { nevsky: 'Невский проспект', fontanka: 'набережная реки Фонтанки', moika: 'набережная реки Мойки', griboedov: 'набережная канала Грибоедова' },
};
export const SQUARE = { x: 589, z: 173, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };

export const GROUPS = { landmarksKrestovsky: scopeGroups(G0.GROUPS_LIST),
  landmarksYelaginPalace: scopeGroups(G1.GROUPS_LIST),
  landmarksYelaginKitchen: scopeGroups(G2.GROUPS_LIST),
  landmarksYelaginServices: scopeGroups(G3.GROUPS_LIST),
  landmarksYelaginRossi: scopeGroups(G4.GROUPS_LIST),
  landmarksYelaginSpits: scopeGroups(G5.GROUPS_LIST),
  landmarksYelaginPark: scopeGroups(G6.GROUPS_LIST),
  landmarksKamennyPalace: scopeGroups(G7.GROUPS_LIST),
  landmarksKamennyChurch: scopeGroups(G8.GROUPS_LIST),
  landmarksKamennyTheatre: scopeGroups(G9.GROUPS_LIST),
  landmarksKamennyDachasEast: scopeGroups(G10.GROUPS_LIST),
  landmarksKamennyDachasWest: scopeGroups(G11.GROUPS_LIST), bridges: BRIDGE_GROUPS };
export function makeAreas() { return [{name:"Крестовский—Каменный—Елагин · Krestovsky–Kamenny–Yelagin",x0:-99999,x1:99999,z0:-99999,z1:99999}]; }
export function makeViews() { const HERO={"x":-5140,"z":-4250,"yaw":0,"pitch":0}; return {HERO,VIEWS:[{key:'Digit1',label:"Крестовский—Каменный—Елагин",...HERO},{key:'Place.hero',label:'Прогулка',...HERO}]}; }
export const TEST = {claimed:[],viewKeys:['Digit1','Place.hero'],mustHaveAreas:[]};
const OWNERS=[['landmarksKrestovsky',G0],['landmarksYelaginPalace',G1],['landmarksYelaginKitchen',G2],['landmarksYelaginServices',G3],['landmarksYelaginRossi',G4],['landmarksYelaginSpits',G5],['landmarksYelaginPark',G6],['landmarksKamennyPalace',G7],['landmarksKamennyChurch',G8],['landmarksKamennyTheatre',G9],['landmarksKamennyDachasEast',G10],['landmarksKamennyDachasWest',G11]];
const collect=(key)=>OWNERS.flatMap(([owner,g])=>(g[key]||[]).map(w=>({...w,owner})));
export const PAVED_RINGS=OWNERS.map(([module,g])=>({module,rings:(g.PAVED_RINGS||[]).map(w=>w.ring||w)}));
export const WATER = {...WATER_TABLE,dataRings:CONTEXT,skipRiverNames:CONTEXT_NAMES,skipRiverKeys:['malaya-neva'],ownerRings:collect('WATER_RINGS'),bankRings:collect('BANK_RINGS'),keepOut:collect('KEEP_OUT')};
export const ZONES = {peopleDensity:{west:{off:true,scale:1,platforms:1},mars:{off:true,zones:[],scale:1}},peopleHot:[],crowHaunts:[{x:-5140,z:-4250,r:120}],farCentres:[]};
export const GARAGE = {"poses":{"lada":{"x":-5132,"z":-4250,"yaw":0}},"spawn":{"x":-5132,"z":-4250,"yaw":0},"boats":[{"id":"boat-islands","dock":"islands","x":-5188.672320133853,"z":-4742.703816836817,"yaw":-1.4615027411394266}]};
export const PRUNE_SERVICES = ["city","landmarksKrestovsky","landmarksYelaginPalace","landmarksYelaginKitchen","landmarksYelaginServices","landmarksYelaginRossi","landmarksYelaginSpits","landmarksYelaginPark","landmarksKamennyPalace","landmarksKamennyChurch","landmarksKamennyTheatre","landmarksKamennyDachasEast","landmarksKamennyDachasWest"];
export const HOOKS = {};
export const HEIGHT_PATCHES = [];
export const CROSS_PLACES = [];
