import * as THREE from 'three';
import { registerLOD } from '../../core/spatial.js';
import { nearCrossing } from './net.js';
import { MB, PointGrid, rgb } from './util.js';

const crust = rgb('#eaedef'), packed = rgb('#c3cbd0'), grit = rgb('#99918a');

// Broken pieces of compacted plough snow have broad chipped faces. Embed
// the lower ring in the bank so the pieces still meet the slope on bends.
function snowBlock(b,x,y,z,size,angle,radii,sideColour) {
  const foot=[],cap=[];
  for(let i=0;i<5;i++){
    const a=angle+i*2*Math.PI/5;
    const dx=size*radii[i]*Math.cos(a), dz=.84*size*radii[i]*Math.sin(a);
    foot.push(b.vert(x+dx,y-size*.55,z+dz,0,0,undefined,sideColour));
    cap.push(b.vert(x+dx*.7+size*.10,y+size*(.42+.26*radii[(i+2)%5]),z+dz*.73,0,0,undefined,crust));
  }
  for(let i=0;i<5;i++){const next=(i+1)%5;b.quad(foot[i],foot[next],cap[next],cap[i]);}
  for(let i=1;i<4;i++)b.tri(cap[0],cap[i],cap[i+1]);
}

function bankHeight(b,row,p,offset) {
  let prevX,prevY;
  for(const index of row){
    const i=index*3;
    const lateral=(b.pos[i]-p.x)*p.ox+(b.pos[i+2]-p.z)*p.oz, y=b.pos[i+1];
    if(offset<=lateral){
      if(prevX===undefined)return y;
      return prevY+(y-prevY)*(offset-prevX)/(lateral-prevX);
    }
    prevX=lateral;prevY=y;
  }
  return prevY;
}

// Follow the actual kerb samples, including parking pockets. Interrupt piles
// at lowered kerbs, boarding areas and driveway mouths. Heights are in metres.
export function buildSnowbanks(ctx, net, stops, entrances) {
  const gaps = new PointGrid(16);
  for (const stop of stops) gaps.add(stop.x, stop.z);
  for (const [x, z] of entrances) gaps.add(x, z);
  const cells = new Map();
  for (const { w, kind, side, pts } of net.kerbRuns) {
    if (kind !== 'edge' || w.skipDraw || w.bridge || w.rank < 1 || pts.length < 6) continue;
    const rng = ctx.rng('plough-' + w.id + side + Math.round(pts[0].s));
    for (let from = 1; from + 4 < pts.length;) {
      const spans = Math.min(pts.length - 2 - from, 3 + Math.floor(rng() * 8));
      const height = 0.33 + rng() ** 2 * 0.61, width = 0.46 + 0.43 * rng();
      const heap = spans >= 5 && rng() < .09;
      let clear = true;
      for (let j = from; j <= from + spans; j++) {
        const p = pts[j];
        if (nearCrossing(net, p.x, p.z, 1.7) || gaps.any(p.x, p.z, 9) ||
            net.cover(p.x + p.ox * 0.7, p.z + p.oz * 0.7, {}) > -0.15) { clear = false; break; }
      }
      if (clear) {
        const start = pts[from], cell = Math.floor(start.x / 96) + ',' + Math.floor(start.z / 96);
        if (!cells.has(cell)) cells.set(cell, new MB(true));
        const b = cells.get(cell);
        let prev;
        for (let j = 0; j <= spans; j++) {
          const p = pts[from + j], taper = Math.min(1, j * 0.75, (spans - j) * 0.75);
          const h = 0.025 + taper * (heap ? 1.4 + .26 * rng() : height) * (0.7 + rng() * 0.48);
          const r = (heap ? width + .54 : width) * (0.42 + taper * (0.5 + rng() * 0.4));
          const v = (offset, y, col) => b.vert(p.x + p.ox * offset, y, p.z + p.oz * offset, 0, 0, undefined, col);
          const rim = 0.04 + 0.23 * rng();
          const row = heap ? [
            v(-r,.035,grit),v(-r*.65,.06+h*.49,grit),v(-r*.33,.10+h*.78,packed),
            v(rim-r*.14,.13+h,crust),v(rim+r*.22,.12+h*.96,crust),
            v(rim+r*.69,.12+h*.48,packed),v(rim+r,.116,packed),
          ] : [v(-r, 0.035, grit), v(-r * 0.55, 0.05 + h * 0.53, packed),
            v(rim, 0.14 + h, crust), v(rim + r * 0.49, 0.13 + h * 0.62, packed), v(rim + r, 0.116, crust)];
          if (heap && taper>.5) {
            for (let k=0;k<6;k++) {
              const offset=(rng()-.5)*2.05*r, size=.15+.25*rng();
              const along=(rng()-.5)*1.6, angle=rng()*Math.PI*2;
              const x=p.x+p.ox*offset+p.oz*along, z=p.z+p.oz*offset-p.ox*along;
              const y=bankHeight(b,row,p,offset);
              const radii=Array.from({length:5},()=>.68+.56*rng());
              snowBlock(b,x,y,z,size,angle,radii,k%3===0?grit:packed);
            }
          }
          if (prev) for (let k = 1; k < row.length; k++) b.quad(prev[k-1], prev[k], row[k], row[k-1]);
          prev = row;
        }
      }
      from += spans + 2 + Math.floor(rng() * 5);
    }
  }
  const material = ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0.09, name: 'ploughed-snow' });
  for (const b of cells.values()) {
    const mesh = new THREE.Mesh(b.build(true), material);
    mesh.name = 'kerb-snowbanks';
    mesh.receiveShadow = true;
    ctx.noOutline(mesh);
    ctx.addStatic(mesh);
    registerLOD(mesh, 165);
  }
}
