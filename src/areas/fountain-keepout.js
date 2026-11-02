// Environment grows before props adds mapped fountain water. Clear planting
// from those measured basins at placement time, including mapped tree nodes.
// Keep the other area hooks and all dry islands of polygon basins intact.

const inRing=(x,z,r)=>{let inside=false;for(let i=0,j=r.length-2;i<r.length;j=i,i+=2){const ax=r[i],az=r[i+1],bx=r[j],bz=r[j+1];if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;}return inside;};
const nearRing=(x,z,r,margin)=>{const limit=margin*margin;for(let i=0;i<r.length;i+=2){const ax=r[i],az=r[i+1],dx=r[(i+2)%r.length]-ax,dz=r[(i+3)%r.length]-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));if((x-ax-t*dx)**2+(z-az-t*dz)**2<=limit)return true;}return false;};

export function makeFountainKeepout(sites){
  const regions=[];
  for(const f of sites){
    if(!f.polys.length){regions.push({x:f.x,z:f.z,r:1.4});continue;}
    for(const p of f.polys){
      const xs=p.o.filter((_,i)=>i%2===0),zs=p.o.filter((_,i)=>i%2);
      regions.push({p,x0:Math.min(...xs),x1:Math.max(...xs),z0:Math.min(...zs),z1:Math.max(...zs)});
    }
  }
  return (x,z,margin=.75)=>{
    for(const r of regions){
      if(r.r){if((x-r.x)**2+(z-r.z)**2<=(r.r+margin)**2)return true;continue;}
      if(x<r.x0-margin||x>r.x1+margin||z<r.z0-margin||z>r.z1+margin)continue;
      if(inRing(x,z,r.p.o)){
        const hole=r.p.h.find(h=>inRing(x,z,h));
        if(!hole||nearRing(x,z,hole,margin))return true;
      }else if(nearRing(x,z,r.p.o,margin))return true;
    }
    return false;
  };
}

export function withFountainKeepouts(base,sites){
  const fountain=makeFountainKeepout(sites);
  return {...base,
    treeReject(ctx){const previous=base.treeReject?.(ctx);return (x,z)=>previous?.(x,z)||(fountain(x,z,.75)?'fountain':null);},
    tuftReject(ctx){const previous=base.tuftReject?.(ctx);return (x,z)=>!!previous?.(x,z)||fountain(x,z,.25);},
  };
}
