// Supplemental houses lie outside EXTENT but are real surveyed waterfront,
// so the synthetic horizon grid must give their entire footprint room.
// Build this immutable cell index once; far-grid probes never scan the city.
export function waterfrontCoverage(buildings, cell=160) {
  const cells=new Map();
  for(const b of buildings)if(b.waterfront&&!b.skip&&!b.dupOf)for(const p of b.polys||[]){
    let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;
    for(let i=0;i<p.o.length;i+=2){x0=Math.min(x0,p.o[i]);x1=Math.max(x1,p.o[i]);z0=Math.min(z0,p.o[i+1]);z1=Math.max(z1,p.o[i+1]);}
    // A background grid building can be 100m long. Its centre must remain
    // clear as well, otherwise it protrudes through a surveyed facade.
    const box=[x0-90,x1+90,z0-90,z1+90];
    for(let x=Math.floor(box[0]/cell);x<=Math.floor(box[1]/cell);x++)for(let z=Math.floor(box[2]/cell);z<=Math.floor(box[3]/cell);z++){
      const key=x+','+z;let a=cells.get(key);if(!a)cells.set(key,a=[]);a.push(box);
    }
  }
  return (x,z)=>(cells.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[]).some(b=>x>=b[0]&&x<=b[1]&&z>=b[2]&&z<=b[3]);
}
