import { CONTEXT, CONTEXT_NAMES } from './water-context.js';
import { makeHooks } from '../north/hooks.js';
import { GROUPS_LIST as TROITSKY } from '../../world/landmarksTroitsky/groups.js';
import { scopeGroups } from '../petro/groups.js';
// Kronverkskoye–Vvedensky–Petrovsky: source landmarks adapted to n4spb water and knock contracts.
import * as G0 from '../../world/landmarksFortress/groups.js';
import * as G1 from '../../world/landmarksKronverk/groups.js';
import * as G2 from '../../world/landmarksVladimir/groups.js';
import * as G3 from '../../world/landmarksPetroCompletion/groups.js';
import * as G4 from '../../world/landmarksPetrovskyStadium/groups.js';
import * as G5 from '../../world/landmarksPetrovskyYacht/groups.js';
import * as G6 from '../../world/landmarksPetrovskyWest/groups.js';
import * as G7 from '../../world/landmarksZhdanovka/groups.js';
import { WATER_TABLE, BRIDGE_GROUPS } from '../petro/water.js';
export const ID = 'kronverk';
export const BAKE_DIR = 'baked/kronverk/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  "environment",
  "streets",
  "city",
  "landmarksFortress",
  "landmarksKronverk",
  "landmarksVladimir",
  "landmarksPetroCompletion",
  "landmarksPetrovskyStadium",
  "landmarksPetrovskyYacht",
  "landmarksPetrovskyWest",
  "landmarksZhdanovka",
  "bridges",
  "bridgesPetro",
  "landmarksTroitsky",
  "props",
  "traffic",
  "people",
  "wildlife",
  "drive"
];
export const LABELS = {"landmarksFortress":"Fortress","landmarksKronverk":"Kronverk","landmarksVladimir":"Vladimir","landmarksPetroCompletion":"PetroCompletion","landmarksPetrovskyStadium":"PetrovskyStadium","landmarksPetrovskyYacht":"PetrovskyYacht","landmarksPetrovskyWest":"PetrovskyWest","landmarksZhdanovka":"Zhdanovka"};
export const NAMES = {
  place: 'Санкт-Петербург', placeEn: 'Saint Petersburg',
  square: 'площадь Восстания', squareEn: 'Vosstaniya Square',
  station: 'Московский вокзал', stationEn: 'Moscow Railway Station',
  streets: { nevsky: 'Невский проспект', fontanka: 'набережная реки Фонтанки', moika: 'набережная реки Мойки', griboedov: 'набережная канала Грибоедова' },
};
export const SQUARE = { x: 589, z: 173, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };

export const GROUPS = { landmarksTroitsky:scopeGroups(TROITSKY), landmarksFortress: scopeGroups(G0.GROUPS_LIST),
  landmarksKronverk: scopeGroups(G1.GROUPS_LIST),
  landmarksVladimir: scopeGroups(G2.GROUPS_LIST),
  landmarksPetroCompletion: scopeGroups(G3.GROUPS_LIST),
  landmarksPetrovskyStadium: scopeGroups(G4.GROUPS_LIST),
  landmarksPetrovskyYacht: scopeGroups(G5.GROUPS_LIST),
  landmarksPetrovskyWest: scopeGroups(G6.GROUPS_LIST),
  landmarksZhdanovka: scopeGroups(G7.GROUPS_LIST), bridges: BRIDGE_GROUPS };
export function makeAreas() { return [{name:"Кронверкское–Введенский–Петровский · Kronverkskoye–Vvedensky–Petrovsky",x0:-99999,x1:99999,z0:-99999,z1:99999}]; }
export function makeViews() { const HERO={"x":-2233,"z":-2515,"yaw":0,"pitch":0}; return {HERO,VIEWS:[{key:'Digit1',label:"Кронверкское–Введенский–Петровский",...HERO},{key:'Place.hero',label:'Прогулка',...HERO}]}; }
export const TEST = {claimed:[],viewKeys:['Digit1','Place.hero'],mustHaveAreas:[]};
const OWNERS=[['landmarksFortress',G0],['landmarksKronverk',G1],['landmarksVladimir',G2],['landmarksPetroCompletion',G3],['landmarksPetrovskyStadium',G4],['landmarksPetrovskyYacht',G5],['landmarksPetrovskyWest',G6],['landmarksZhdanovka',G7]];
const collect=(key)=>OWNERS.flatMap(([owner,g])=>(g[key]||[]).map(w=>({...w,owner})));
export const PAVED_RINGS=OWNERS.map(([module,g])=>({module,rings:(g.PAVED_RINGS||[]).map(w=>w.ring||w)}));
export const WATER = {...WATER_TABLE,dataRings:CONTEXT,skipRiverNames:CONTEXT_NAMES,skipRiverKeys:['malaya-neva'],ownerRings:collect('WATER_RINGS'),bankRings:collect('BANK_RINGS'),keepOut:collect('KEEP_OUT')};
export const ZONES = {peopleDensity:{west:{off:true,scale:1,platforms:1},mars:{off:true,zones:[],scale:1}},peopleHot:[],crowHaunts:[{x:-2230,z:-2520,r:120}],farCentres:[]};
export const GARAGE = {"poses":{"lada":{"x":-2237,"z":-2522,"yaw":0}},"spawn":{"x":-2237,"z":-2522,"yaw":0},"boats":[{"id":"boat-kronverk","dock":"kronverk","x":-3584.3948255495384,"z":-2300.3269857633773,"yaw":-2.2092102701703262}]};
export const PRUNE_SERVICES = ["city","landmarksFortress","landmarksKronverk","landmarksVladimir","landmarksPetroCompletion","landmarksPetrovskyStadium","landmarksPetrovskyYacht","landmarksPetrovskyWest","landmarksZhdanovka"];
export const HOOKS = {deckServices:['landmarksTroitsky'],...makeHooks(MODULES)};
export const HEIGHT_PATCHES = [];
export const CROSS_PLACES = [];
