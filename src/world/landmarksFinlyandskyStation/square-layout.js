// Pure plan/keep-out data for the area hooks and the square's surface owner.
import { ROADS, GREEN, WATER } from '../../areas/finlyandsky/data/city.js';
export const FRAME={x:284.7,z:-2570.85,rot:-Math.atan2(27.5,97.4)};
const c=Math.cos(FRAME.rot),s=Math.sin(FRAME.rot);
export const point=(u,v)=>({x:FRAME.x+c*u+s*v,z:FRAME.z-s*u+c*v});
export const local=(x,z)=>[c*(x-FRAME.x)-s*(z-FRAME.z),s*(x-FRAME.x)+c*(z-FRAME.z)];
// This envelope is clipped to the surveyed flanking streets by square.js,
// including their curved southern junctions. It covers boundary footways too.
export const SQUARE_OUTLINE=[[-56,52],[40,52],[40,246],[-56,246]];
export const SQUARE_RING=SQUARE_OUTLINE.map(p=>{const q=point(...p);return[q.x,q.z];}).flat();
export const LAWN_IDS=['r8850278','r8850277','r8850276'];
export const SMALL_BASIN=/^r88502(?:5[89]|6[0-7]|69|7[0-4])$/;
export const contains=(ring,x,z)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++)if((ring[i][1]>z)!==(ring[j][1]>z)&&x<(ring[j][0]-ring[i][0])*(z-ring[i][1])/(ring[j][1]-ring[i][1])+ring[i][0])yes=!yes;return yes;};
const pairs=r=>Array.from({length:r.length/2},(_,i)=>r.slice(i*2,i*2+2));
const lawns=GREEN.filter(g=>[...LAWN_IDS,'w240014031'].includes(g.id)).flatMap(g=>g.polys.map(p=>pairs(p.o)));
const basins=WATER.filter(w=>SMALL_BASIN.test(w.id)).flatMap(w=>w.polys.map(p=>{
  const q=pairs(p.o).map(p=>local(...p)),us=q.map(p=>p[0]),vs=q.map(p=>p[1]);return[Math.min(...us)-3.2,Math.max(...us)+3.2,Math.min(...vs)-1.35,Math.max(...vs)+1.35];
}));
export function inSquare(x,z){const[u,v]=local(x,z);return contains(SQUARE_OUTLINE,u,v)||(u>=-50&&u<=50&&v>=1&&v<=26);}
export function inSquareHardscape(x,z){
  if(!inSquare(x,z))return false;
  if(lawns.some(p=>contains(p,x,z)))return false;
  const[u,v]=local(x,z);return!basins.some(b=>u>b[0]&&u<b[1]&&v>b[2]&&v<b[3]);
}
// The complete replaced paths stay in the pedestrian graph; ownership merely
// prevents old flat brick/asphalt ribbons being laid over the new paving.
export const SQUARE_WAY_IDS=ROADS.filter(r=>['footway','path','steps','pedestrian'].includes(r.hw)&&!r.bridge&&!r.tunnel&&r.pts.every((v,i)=>i%2||(()=>{const[u,w]=local(v,r.pts[i+1]);return u>=-56.5&&u<=40.5&&w>=51.5&&w<=245;})())).map(r=>r.id);
