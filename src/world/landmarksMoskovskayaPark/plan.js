// Pure garden planning data, shared with the area vegetation keep-out hook.
// Geometry follows the mapped Heroes' Alley axis. Pond islands stay generic.
export const AXIS = { x0:-1563,z0:7069.8,x1:-947,z1:7051.6 };
const {x0,z0,x1,z1}=AXIS,dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz);
export const FORMAL_LIMES=[];
for(let dist=18;dist<len-10;dist+=15.5)for(const side of [-1,1]) {
  const off=24;
  FORMAL_LIMES.push({x:x0+dx/len*dist-dz/len*off*side,z:z0+dz/len*dist+dx/len*off*side});
}
export function inFormalTreeClearing(x,z) {
  // The reference chapel has an open lawn approach and tall trees beyond it;
  // the generic random forest must not fill that short architectural apron.
  if((x+1419)**2+(z-7397)**2<17**2)return true;
  // Preserve the centre of the pavilion's actual pond-facing porch view, with
  // trees at either end as in the summer photographic reference.
  if(x>-1475&&x<-1458&&z>7286&&z<7295)return true;
  return FORMAL_LIMES.some(p=>(p.x-x)**2+(p.z-z)**2<30.25);
}
