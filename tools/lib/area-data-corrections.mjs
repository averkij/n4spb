// Maintained local scene corrections applied after cutting the source city.
// n9307113823 is the real layer=1 fountain of the Small Hermitage Hanging
// Garden (OSM w67548566). The generic flower top must leave its basin open.
export function clearHermitageFountainBed(green, fountains) {
  const fountain=fountains.find(f=>f.id==='n9307113823');
  if(!fountain)return green;
  const {x,z}=fountain,inside=(o)=>{
    let yes=false;for(let i=0,j=o.length-2;i<o.length;j=i,i+=2)
      if((o[i+1]>z)!==(o[j+1]>z)&&x<(o[j]-o[i])*(z-o[i+1])/(o[j+1]-o[i+1])+o[i])yes=!yes;
    return yes;
  };
  // 1.4 m water radius plus its 0.18 m coping and a small planting clearance.
  const hole=Array.from({length:32},(_,i)=>[x+1.7*Math.cos(i*Math.PI/16),z+1.7*Math.sin(i*Math.PI/16)]).flat();
  return green.map(g=>g.id!=='w67548566'?g:{...g,polys:g.polys.map(p=>
    !inside(p.o)||(p.h||[]).some(inside)?p:{...p,h:[...(p.h||[]),hole]})});
}

export function applyAreaDataCorrections(area,parts) {
  if(!['palace','admiralty'].includes(area))return;
  const fountains=parts.flatMap(p=>p.arrays.get('FOUNTAINS')||[]);
  for(const part of parts){const green=part.arrays.get('GREEN');if(green)part.arrays.set('GREEN',clearHermitageFountainBed(green,fountains));}
}
