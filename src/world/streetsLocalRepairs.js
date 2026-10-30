// Small reviewed asphalt repairs in the Semyonovsky area; built after streets.
import * as THREE from 'three';
import { MB } from './streets/util.js';
import { ASPHALT_TILE, makeStreetTextures } from './streets/tex.js';
import { ROAD_Y } from './streets/surface.js';
import { localGapSections } from './streets/local-gaps.js';

export function build(ctx) {
  const net=ctx.services.streets?.net;
  if (!net) throw new Error('streetsLocalRepairs requires streets to be built first');
  const B=new MB(),rows=localGapSections(net),tile=ASPHALT_TILE;
  for(let i=1;i<rows.length;i++) if(rows[i-1]&&rows[i]) {
    const a=rows[i-1].a,b=rows[i-1].b,c=rows[i].b,d=rows[i].a;
    B.quad(B.vert(a[0],ROAD_Y,a[1],a[0]/tile,a[1]/tile),B.vert(b[0],ROAD_Y,b[1],b[0]/tile,b[1]/tile),B.vert(c[0],ROAD_Y,c[1],c[0]/tile,c[1]/tile),B.vert(d[0],ROAD_Y,d[1],d[0]/tile,d[1]/tile));
  }
  if(B.empty) return;
  const tex=makeStreetTextures(ctx).asphalt;
  const mat=ctx.mat.toon('#ffffff',{map:tex,polygonOffset:-2.2,paint:0.03,name:'pt-asphalt'});
  const m=new THREE.Mesh(B.build(),mat);m.name='pt-asphalt';m.receiveShadow=true;ctx.addStatic(m);
}
