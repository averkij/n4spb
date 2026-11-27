import * as THREE from 'three';
import { winterTreeGeometry } from './environment/treegeo.js';

// The two cemetery forests repack thousands of trees. Far winter broadleaves
// share a unit tapering branch fan, scaled back to each local species' size.
// Conifers continue using the original camera-dependent crown buckets.
const farBranches=new Map();
export function winterForest(ctx,species) {
  if(ctx.season!=='winter') return null;
  const material=ctx.mat.toon('#ffffff',{name:'west-dormant-branches'});
  const bare=fam=>species[fam].kind!=='tiers';
  const bark=new THREE.Color('#827164'), fir=new THREE.Color('#879e95');
  function tint(t) {
    const c=bare(t.fam) ? bark : fir, k=.91+Math.abs(Math.sin(t.yaw||0))*.12;
    return [c.r*k,c.g*k,c.b*k];
  }
  function far(lod) {
    if(farBranches.has(lod)) return farBranches.get(lod);
    const pos=[];
    function limb(x,y,z,tx,ty,tz,r) {
      for(let k=0;k<3;k++) {
        const a=k*Math.PI*2/3,b=(k+1)*Math.PI*2/3;
        pos.push(x+r*Math.cos(b),y,z+r*Math.sin(b),x+r*Math.cos(a),y,z+r*Math.sin(a),tx,ty,tz);
      }
    }
    limb(0,0,0,.06,1,0,.075);
    const n=lod===2 ? 8 : 4;
    for(let k=0;k<n;k++) {
      const u=k/n, a=k*2.40, dx=Math.cos(a)*(1-u*.48), dz=Math.sin(a)*(1-u*.48);
      const h=.24+u*.46;limb(0,h,0,dx,h+.28,dz,.047);
      if(lod===2) limb(dx*.54,h+.15,dz*.54,dx*.62,h+.36,dz*.67,.026);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.computeVertexNormals();
    farBranches.set(lod,geo);return geo;
  }
  return {material,bare,tint,far,near:(fam,lod)=>winterTreeGeometry(fam,lod,species[fam])};
}

// The horizontal fills of individual grave plots use the same atlas in both
// seasons. Keep vertical stone, fences and permanent flower offerings intact.
export function paintPlotSnow(g,w,h,r) {
  g.fillStyle='#e1e8eb';
  g.fillRect(0,0,w,h);
  for(let i=0;i<130;i++) {
    g.fillStyle=i%3?'rgba(255,255,255,.30)':'rgba(145,170,185,.18)';
    g.beginPath();g.ellipse(r()*w,r()*h,3+r()*6,1+r()*3,-.2,0,2*Math.PI);g.fill();
  }
}
