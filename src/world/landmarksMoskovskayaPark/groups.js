// Claims for authored park monuments / fountain and the present-day arena.
// OpenStreetMap API map extract 2026-10-11; park lawns, nine pond outlines,
// paths and trees remain environment/street data, with no duplicate terrain.
export const HERO_IDS = ['n3039562533','n3039562534','n3039562536','n3039562537','n3039562538','n3039562539','n3039562535','n3039594770','n3039594771','n3039594772','n3039594773','n3039594774','n3039594775','n3039594776','n3039594777','n3039594778','n3039594779','n3039594780','n4485911838','n4485911839','n5141526656','n11209562878'];
export const GROUPS_LIST = [
  {key:'victory-park-memorials',name:'Московский парк Победы: пропилеи, фонтан и Аллея Героев',nameEn:'Moscow Victory Park memorial ensemble',ids:['r15756570','r15756569'],osm:['w32073130','n360040747','n3162854862','n4485862678','n1521009686',...HERO_IDS],at:[-1683,7074],note:'Mapped roof relations own the paired open four-column propylea; Glory wreath fountain, wartime/later hero busts, Zhukov, Matrosov, Zoya and trolley. OSM greens/ponds/paths remain generic.'},
  {key:'victory-ska-arena',name:'СКА Арена',nameEn:'SKA Arena exterior',ids:['w1024552165'],osm:[],at:[-561,7045],note:'Present-day oval silver roof and inclined exterior truss colonnade. OSM footprint determines scale and position; closed exterior only.'},
  {key:'victory-pond-pavilions',name:'Павильоны и львы Московского парка Победы',nameEn:'Victory Park pond pavilions and lions',ids:['w30899425','w621507834','r11008642'],osm:['n1520977370','n4484392661','n4484392662','n4485866600','n4369354189'],at:[-1466,7302],note:'Mapped chess/Globus pavilion with open northern colonnade, square 1995 Memory portico, All Saints chapel, two lions beside Ochki Pond and western park sculptures. No pond ownership or blocking water collision.'},
];

// Only actual architectural footprints, not the whole formal plaza: generic
// mapped approach paving and the surrounding historic trees remain intact.
// Surveyed once from the mapped source records. Area contract imports must be
// pure data, including when a verifier imports them without a page import map.
const f={x:-1625.5,z:7071.9};
export const PAVED_RINGS = [
 {id:'victory-north-portico',ring:[[-1689.4,7064.6],[-1689.5,7056.7],[-1677.5,7056.6],[-1677.5,7064.5]]},
 {id:'victory-south-portico',ring:[[-1688.8,7083.4],[-1676.7,7082.9],[-1676.4,7090.1],[-1688.5,7090.6]]},
 {id:'victory-glory-basin',ring:Array.from({length:48},(_,i)=>[f.x+12.6*Math.cos(i*Math.PI/24),f.z+12.6*Math.sin(i*Math.PI/24)])},
 {id:'victory-main-pavilion',ring:[[-1451.7,7309.5],[-1480.3,7310.5],[-1480.9,7295.3],[-1452.2,7294.3]]},
 {id:'victory-memory-portico',ring:[[-1289.6,7455.9],[-1292.8,7452.7],[-1289.3,7449.3],[-1286.2,7452.5]]},
 {id:'victory-chapel',ring:[[-1426.7,7404.9],[-1426.7,7389.3],[-1411.2,7389.3],[-1411.2,7404.9]]},
];

// Above-ground shallow water: the source disk collider is deliberately absent.
// Reachable on foot/in a car, with an ordinary shallow floor at +0.23 m.
export const FOUNTAIN_WATER_BODIES = [{ id:'victory-glory-basin', x:f.x,z:f.z,r:11.9,waterY:.29,bedY:.23,
  o:Array.from({length:48},(_,i)=>[f.x+11.9*Math.cos(i*Math.PI/24),f.z+11.9*Math.sin(i*Math.PI/24)]).flat(),h:[] }];
