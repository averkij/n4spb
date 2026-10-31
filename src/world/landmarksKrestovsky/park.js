// A restrained first park pass: timber benches beside the real pedestrian axis.
// Ponds, lawns and tree masses remain with environment and its shared tree bounds.
import * as CITY from '../data/city.js';
import { safeSpot } from '../landmarksVictoryPark/kit.js';

export function park(ctx,P,M,svc) {
  // The central park avenue is split into unnamed footway segments in OSM;
  // select its exact mapped ways rather than assuming a street-name tag.
  const axis=CITY.ROADS.filter(r=>['w23642426','w110461351'].includes(r.id));
  // Park axis must be mapped pedestrian-only; never furnish a guessed carriageway.
  const paths=axis.filter(r=>r.hw==='footway'||r.hw==='pedestrian');
  for(const path of paths){
    for(let i=0;i<path.pts.length-2;i+=2){
      const ax=path.pts[i],az=path.pts[i+1],bx=path.pts[i+2],bz=path.pts[i+3],len=Math.hypot(bx-ax,bz-az);
      if(len<18)continue;
      const tx=(bx-ax)/len,tz=(bz-az)/len;
      for(let dist=12;dist<len-4;dist+=42)for(const side of [-1,1]){
        const off=(path.w||2.4)/2+1.3,x=ax+tx*dist-tz*side*off,z=az+tz*dist+tx*side*off,rot=Math.atan2(-tz,tx)+(side>0?Math.PI:0);
        if(ctx.L.insideBuilding(x,z,2)||ctx.L.inRiver?.(x,z)||!safeSpot(ctx,x,z,2.5,.85,rot))continue;
        if(ctx.services.environment?.trees?.some(t=>Math.hypot(t.x-x,t.z-z)<2))continue;
        P.push(x,0,z,rot);
        for(const u of [-.8,.8]){P.box(M.dark,u,.23,0,.14,.43,.70,240);P.box(M.dark,u,.74,-.29,.13,.57,.14,240);}
        for(let j=0;j<4;j++)P.box(M.wood,0,.48,-.27+j*.17,2.3,.095,.13,300);
        for(let j=0;j<3;j++)P.box(M.wood,0,.65+j*.16,-.32,2.3,.12,.08,300);
        P.pop();ctx.physics.addBox(x,z,2.35,.80,rot,0,1.1);svc.benches.push({x,z,rotY:rot,len:2.3});
      }
    }
  }
  svc.park={pathIds:paths.map(p=>p.id),genericTrees:true,genericPonds:true};
  const photo={x:-6441.8,z:-4456.8,yaw:85,name:'Липовая ось Приморского парка Победы'};
  if(!ctx.L.insideBuilding(photo.x,photo.z,1)&&!ctx.L.isOnRoad(photo.x,photo.z,.5))svc.photoSpots.push(photo);
}
