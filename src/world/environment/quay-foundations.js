// A join between different water datums exposes the underside of the higher
// basin. Close that vertical grade face along the lower ring's existing edge,
// below the higher surface only. Equal-level navigable joins stay open.
export function waterLevelSeams(rings, levelOf, foot = .12) {
  const inside = (x,z,o) => {
    let hit=false;
    for(let i=0,j=o.length-2;i<o.length;j=i,i+=2)
      if((o[i+1]>z)!==(o[j+1]>z)&&x<(o[j]-o[i])*(z-o[i+1])/(o[j+1]-o[i+1])+o[i])hit=!hit;
    return hit;
  };
  const signedArea=o=>{let a=0;for(let i=0;i<o.length;i+=2){const j=(i+2)%o.length;a+=o[i]*o[j+1]-o[j]*o[i+1];}return a/2;};
  const boxes=rings.map(g=>{const b=[Infinity,-Infinity,Infinity,-Infinity];for(let i=0;i<g.o.length;i+=2){b[0]=Math.min(b[0],g.o[i]);b[1]=Math.max(b[1],g.o[i]);b[2]=Math.min(b[2],g.o[i+1]);b[3]=Math.max(b[3],g.o[i+1]);}return b;});
  const out=[],seen=new Set();
  for(let gi=0;gi<rings.length;gi++){
    const g=rings[gi];if(g.owner)continue;
    const low=levelOf(g.key),higher=rings.map((h,i)=>({g:h,b:boxes[i]})).filter(h=>h.g!==g&&!h.g.owner&&levelOf(h.g.key)>low+1e-6);
    if(!higher.length)continue;
    const side=signedArea(g.o)>0?1:-1;
    for(let i=0;i<g.o.length;i+=2){
      const j=(i+2)%g.o.length,a=[g.o[i],g.o[i+1]],b=[g.o[j],g.o[j+1]],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
      if(len<.05)continue;
      const nx=-dz/len*side,nz=dx/len*side;
      let high=Infinity;
      for(const h of higher){
        if(Math.max(a[0],b[0])<h.b[0]-.03||Math.min(a[0],b[0])>h.b[1]+.03||Math.max(a[1],b[1])<h.b[2]-.03||Math.min(a[1],b[1])>h.b[3]+.03)continue;
        // Both ends and the middle must meet the higher water on the far side.
        // Testing the lower side too excludes overlapping triangulation seams.
        if([.15,.5,.85].every(t=>{const x=a[0]+dx*t,z=a[1]+dz*t;return inside(x-nx*.02,z-nz*.02,h.g.o)&&!inside(x+nx*.02,z+nz*.02,h.g.o);}))high=Math.min(high,levelOf(h.g.key));
      }
      if(!Number.isFinite(high))continue;
      const k=[...a,...b].map(v=>Math.round(v*1e4)).join(',');if(seen.has(k))continue;seen.add(k);
      out.push({key:g.key,a,b,n:[nx,nz],bottom:low-foot,top:high-foot});
    }
  }
  return out;
}
