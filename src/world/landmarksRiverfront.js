// Static architectural views across the Neva, using the SAME researched
// shells as the opposite area's landmarks. No copied approximation, crowds,
// frame loops, gardens or navigation services are created by this module.
export const OWNS_GROUPS = true;
import * as THREE from 'three';
import { registerLOD, featureClass } from '../core/spatial.js';
import { Parts as FortressParts } from './landmarksFortress/kit.js';
import { makeMats as fortressMats } from './landmarksFortress/mats.js';
import { build as fortressWalls } from './landmarksFortress/walls.js';
import { build as fortressGates } from './landmarksFortress/gates.js';
import { build as fortressCathedral } from './landmarksFortress/cathedral.js';
import { build as fortressVault } from './landmarksFortress/vault.js';
import { build as fortressBuildings } from './landmarksFortress/buildings.js';
import { Parts as StrelkaParts } from './landmarksStrelka/kit.js';
import { makeMats as strelkaMats } from './landmarksStrelka/mats.js';
import { exchange } from './landmarksStrelka/exchange.js';
import { rostral } from './landmarksStrelka/rostral.js';
import { warehouses } from './landmarksStrelka/warehouses.js';
import { customs } from './landmarksStrelka/customs.js';
import { Parts as UniversityParts } from './landmarksUniversity/kit.js';
import { makeMats as universityMats } from './landmarksUniversity/mats.js';
import { kunstkamera } from './landmarksUniversity/kunstkamera.js';
import { academy,museumWing } from './landmarksUniversity/academy.js';
import { collegia } from './landmarksUniversity/collegia.js';
import { rector,peter2,gostiny } from './landmarksUniversity/fronts.js';
import { makeKit as palaceKit } from './landmarksI/common.js';
import { makePalaceMats } from './landmarksI/mats.js';
import { buildPalace } from './landmarksI/palace.js';
import { buildRoof } from './landmarksI/roof.js';
import { buildHermitage } from './landmarksI/hermitage.js';
import { makeKit as admiraltyKit } from './landmarksH/common.js';
import { makeH } from './landmarksH/mats.js';
import { build as admiraltyTower } from './landmarksH/tower.js';
import { build as admiraltyFacades } from './landmarksH/facade.js';
import { build as senate } from './landmarksH/senate.js';

export async function build(ctx) {
  const groups=ctx.L.GROUPS.landmarksRiverfront||[],active=new Set(groups.map(g=>g.sourceModule));
  const root=new THREE.Group();root.name='landmarksRiverfront';
  const physics={items:[]};
  for(const kind of ['addBox','addCylinder','addRamp','addPolygon','addWalkBox','addWalkTriangles','addWalkCylinder','addWalkRamp','addStairs'])physics[kind]=()=>({});
  const visual=Object.assign(Object.create(ctx),{physics,knock:null,services:{},onUpdate:()=>{},addStatic:o=>root.add(o)});
  const svc=()=>({monuments:[],photoSpots:[],entrances:[],crowd:[],fences:[],benches:[],lamps:[],houses:[],gates:[],bridges:[],spots:{},statueSpots:[],colliders:[]});
  let triangles=0;const parts={};
  const runParts=async(module,Parts,mats,list)=>{
    if(!active.has(module))return;
    const M=mats(visual),S=svc();
    for(const [key,fn]of list){
      const K={ctx:visual,M,THREE,P:new Parts(),svc:S,root,extraTris:0};await fn(K);
      for(const m of K.P.build(root,{name:'riverfront-'+key}))if(M.cutouts?.has(m.material)||M.decals?.has(m.material))ctx.noOutline(m);
      parts[key]=Math.round(K.P.tris+K.extraTris);triangles+=parts[key];
    }
  };
  await runParts('landmarksFortress',FortressParts,fortressMats,[['fortress-walls',fortressWalls],['fortress-gates',fortressGates],['fortress-cathedral',fortressCathedral],['fortress-vault',fortressVault],['fortress-houses',fortressBuildings]]);
  await runParts('landmarksStrelka',StrelkaParts,strelkaMats,[['exchange',exchange],['rostral',rostral],['warehouses',warehouses],['customs',customs]]);
  await runParts('landmarksUniversity',UniversityParts,universityMats,[['kunstkamera',kunstkamera],['academy',academy],['museum-wing',museumWing],['collegia',collegia],['rector',rector],['peter2',peter2],['gostiny',gostiny]]);
  if(active.has('landmarksI')){
    const K=palaceKit(visual),S=svc();K.svc=svc();const M=makePalaceMats(K);
    for(const [key,fn]of [['winter-palace',()=>buildPalace(K,M,S)],['palace-roofs',()=>buildRoof(K,M,visual,S)],['hermitage',()=>buildHermitage(K,M,visual,S)]]){
      K.begin();const before=K.tris;await fn();K.flush(root,'riverfront-'+key);parts[key]=Math.round(K.tris-before);triangles+=parts[key];
    }
  }
  if(active.has('landmarksH')){
    const K=admiraltyKit(visual);K.svc=svc();K.root=root;const M=makeH(K);
    for(const [key,fn]of [['admiralty-tower',admiraltyTower],['admiralty',admiraltyFacades],['senate',senate]]){
      K.begin();const before=K.tris;await fn(K,visual,M);K.flush(root,'riverfront-'+key);parts[key]=Math.round(K.tris-before);triangles+=parts[key];
    }
  }
  root.updateMatrixWorld(true);
  root.traverse(m=>{if(m.isMesh){
    m.castShadow=false;
    m.geometry.computeBoundingBox();const b=m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
    const skyline=b.max.y>65&&(b.max.y-b.min.y)>24;
    const cls=featureClass(m.geometry,m.matrixWorld);
    // A whole material stream can span a building while containing only tiny
    // ornament. Feature size distinguishes those streams from actual walls.
    registerLOD(m,skyline?2500:cls==='S'?350:cls==='M'?900:1800);
  }});
  ctx.addStatic(root);ctx.services.landmarksRiverfront={triangles,parts};
}
