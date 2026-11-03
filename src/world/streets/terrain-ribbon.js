// Paving on a continuous bank follows the actual terrain triangles. A flat
// ribbon, even with densely sampled centre points, can bridge a pond or cut
// through the bank between its two edges.
import { clipHalf, ccw, area2, boxOfPoly, subtractConvex } from '../environment/clip.js';
import { SHORE_TERRAIN_CELL as CELL } from '../environment/shore-terrain.js';

function above(poly, height, level) {
  const out=[];
  for(let i=0;i<poly.length;i++) {
    const a=poly[i],b=poly[(i+1)%poly.length],ha=height(a)-level,hb=height(b)-level;
    if(ha>=0)out.push(a);
    if(ha*hb<0){const t=ha/(ha-hb);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
  }
  return out;
}

export function terrainPolygon(B, polygon, lift, tile, { heightAt, waterY, cuts=[] }) {
  const poly=ccw(polygon),box=boxOfPoly(poly);
  let pieces=[poly];
  for(const c of cuts)if(c.box[0]<box[1]&&c.box[1]>box[0]&&c.box[2]<box[3]&&c.box[3]>box[2])pieces=subtractConvex(pieces,c.poly);
  for(let ix=Math.floor(box[0]/CELL);ix<Math.ceil(box[1]/CELL);ix++)for(let iz=Math.floor(box[2]/CELL);iz<Math.ceil(box[3]/CELL);iz++) {
    const x0=ix*CELL,z0=iz*CELL,A=[x0,z0],D=[x0+CELL,z0],C=[x0+CELL,z0+CELL],E=[x0,z0+CELL];
    for(const tri of [[A,E,C],[A,C,D]]) {
      const [a,b,c]=tri,ha=heightAt(...a),hb=heightAt(...b),hc=heightAt(...c),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
      const height=p=>{const u=((b[1]-c[1])*(p[0]-c[0])+(c[0]-b[0])*(p[1]-c[1]))/den,v=((c[1]-a[1])*(p[0]-c[0])+(a[0]-c[0])*(p[1]-c[1]))/den;return ha*u+hb*v+hc*(1-u-v);};
      const edges=ccw(tri);
      for(const piece of pieces) {
        let p=piece;
        for(let j=0;j<3&&p.length>=3;j++)p=clipHalf(p,edges[j],edges[(j+1)%3],true);
        p=above(p,height,waterY+.02);
        if(p.length<3||Math.abs(area2(p))<1e-8)continue;
        const ids=p.map(q=>B.vert(q[0],height(q)+lift,q[1],q[0]/tile,q[1]/tile));
        // Positive XZ winding is downward in XYZ.
        for(let j=1;j+1<ids.length;j++)B.tri(ids[0],ids[j+1],ids[j]);
      }
    }
  }
}

export function terrainRibbon(B, pts, width, lift, tile, options) {
  let prev=null;
  const half=width/2;
  for(let i=0;i<pts.length;i++) {
    const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
    const nx=-(b[1]-a[1])/len,nz=(b[0]-a[0])/len,[x,z]=pts[i];
    const left=[x-nx*half,z-nz*half],right=[x+nx*half,z+nz*half];
    if(prev)terrainPolygon(B,[prev[0],prev[1],right,left],lift,tile,options);
    prev=[left,right];
  }
}
