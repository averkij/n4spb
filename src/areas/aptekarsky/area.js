import { CONTEXT, CONTEXT_NAMES } from './water-context.js';
import { makeHooks } from '../north/hooks.js';
import { GROUPS_LIST as TROITSKY } from '../../world/landmarksTroitsky/groups.js';
import { scopeGroups } from '../petro/groups.js';
// Apothecary–Posadsky: source landmarks adapted to n4spb water and knock contracts.
import * as G0 from '../../world/landmarksTroitskaya/groups.js';
import * as G1 from '../../world/landmarksAurora/groups.js';
import * as G2 from '../../world/landmarksKamennoostrovsky/groups.js';
import * as G3 from '../../world/landmarksKarpovka/groups.js';
import * as G4 from '../../world/landmarksBotanicalGreenhouses/groups.js';
import * as G5 from '../../world/landmarksBotanicalGarden/groups.js';
import * as G6 from '../../world/landmarksTVTower/groups.js';
import * as G7 from '../../world/landmarksLETI/groups.js';
import * as G8 from '../../world/landmarksTransfiguration/groups.js';
import { WATER_TABLE, BRIDGE_GROUPS } from '../petro/water.js';
export const ID = 'aptekarsky';
export const BAKE_DIR = 'baked/aptekarsky/';
export const REQUIRE_BAKE = true;
export const MODULES = [
  "environment",
  "streets",
  "city",
  "landmarksTroitskaya",
  "landmarksAurora",
  "landmarksKamennoostrovsky",
  "landmarksKarpovka",
  "landmarksBotanicalGreenhouses",
  "landmarksBotanicalGarden",
  "landmarksTVTower",
  "landmarksLETI",
  "landmarksTransfiguration",
  "bridges",
  "bridgesPetro",
  "landmarksTroitsky",
  "props",
  "traffic",
  "people",
  "wildlife",
  "drive"
];
export const LABELS = {"landmarksTroitskaya":"Troitskaya","landmarksAurora":"Aurora","landmarksKamennoostrovsky":"Kamennoostrovsky","landmarksKarpovka":"Karpovka","landmarksBotanicalGreenhouses":"BotanicalGreenhouses","landmarksBotanicalGarden":"BotanicalGarden","landmarksTVTower":"TVTower","landmarksLETI":"LETI","landmarksTransfiguration":"Transfiguration"};
export const NAMES = {
  place: 'Санкт-Петербург', placeEn: 'Saint Petersburg',
  square: 'площадь Восстания', squareEn: 'Vosstaniya Square',
  station: 'Московский вокзал', stationEn: 'Moscow Railway Station',
  streets: { nevsky: 'Невский проспект', fontanka: 'набережная реки Фонтанки', moika: 'набережная реки Мойки', griboedov: 'набережная канала Грибоедова' },
};
export const SQUARE = { x: 589, z: 173, name: NAMES.square, nameEn: NAMES.squareEn };
export const OBELISK = { x: 592.2, z: 164.9, h: 36 };
export const STATION = { x: 612, z: 300, facadeBearing: 348, trackBearing: 167, tower: { x: 602.1, z: 246.4 } };

export const GROUPS = { landmarksTroitsky:scopeGroups(TROITSKY), landmarksTroitskaya: scopeGroups(G0.GROUPS_LIST),
  landmarksAurora: scopeGroups(G1.GROUPS_LIST),
  landmarksKamennoostrovsky: scopeGroups(G2.GROUPS_LIST),
  landmarksKarpovka: scopeGroups(G3.GROUPS_LIST),
  landmarksBotanicalGreenhouses: scopeGroups(G4.GROUPS_LIST),
  landmarksBotanicalGarden: scopeGroups(G5.GROUPS_LIST),
  landmarksTVTower: scopeGroups(G6.GROUPS_LIST),
  landmarksLETI: scopeGroups(G7.GROUPS_LIST),
  landmarksTransfiguration: scopeGroups(G8.GROUPS_LIST), bridges: BRIDGE_GROUPS };
export function makeAreas() { return [{name:"Аптекарский–Посадский · Apothecary–Posadsky",x0:-99999,x1:99999,z0:-99999,z1:99999}]; }
export function makeViews() { const HERO={"x":-1894,"z":-3067,"yaw":0,"pitch":0}; return {HERO,VIEWS:[{key:'Digit1',label:"Аптекарский–Посадский",...HERO},{key:'Place.hero',label:'Прогулка',...HERO}]}; }
export const TEST = {claimed:[],viewKeys:['Digit1','Place.hero'],mustHaveAreas:[]};
const OWNERS=[['landmarksTroitskaya',G0],['landmarksAurora',G1],['landmarksKamennoostrovsky',G2],['landmarksKarpovka',G3],['landmarksBotanicalGreenhouses',G4],['landmarksBotanicalGarden',G5],['landmarksTVTower',G6],['landmarksLETI',G7],['landmarksTransfiguration',G8]];
const collect=(key)=>OWNERS.flatMap(([owner,g])=>(g[key]||[]).map(w=>({...w,owner})));
export const PAVED_RINGS=OWNERS.map(([module,g])=>({module,rings:(g.PAVED_RINGS||[]).map(w=>w.ring||w)}));
export const WATER = {...WATER_TABLE,dataRings:CONTEXT,skipRiverNames:CONTEXT_NAMES,skipRiverKeys:['malaya-neva'],ownerRings:collect('WATER_RINGS'),bankRings:collect('BANK_RINGS'),keepOut:collect('KEEP_OUT')};
export const ZONES = {peopleDensity:{west:{off:true,scale:1,platforms:1},mars:{off:true,zones:[],scale:1}},peopleHot:[],crowHaunts:[{x:-1900,z:-3065,r:120}],farCentres:[]};
export const GARAGE = {"poses":{"lada":{"x":-1886,"z":-3067,"yaw":0}},"spawn":{"x":-1886,"z":-3067,"yaw":0},"boats":[{"id":"boat-aptekarsky","dock":"aptekarsky","x":-810.2391421858604,"z":-3862.272264236836,"yaw":0.09543290837944174}]};
export const PRUNE_SERVICES = ["city","landmarksTroitskaya","landmarksAurora","landmarksKamennoostrovsky","landmarksKarpovka","landmarksBotanicalGreenhouses","landmarksBotanicalGarden","landmarksTVTower","landmarksLETI","landmarksTransfiguration"];
export const HOOKS = {deckServices:['landmarksTroitsky'],...makeHooks(MODULES)};
export const HEIGHT_PATCHES = [];
export const CROSS_PLACES = [];
