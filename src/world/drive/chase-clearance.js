// A wall-retracted chase boom may end inside a long bus. Lift it above the
// actual body immediately; cabin cameras and the existing boat boom are separate.
export function busChaseFloor(spec,car,x,z){
  if(!spec.bus)return null;
  const s=Math.sin(car.yaw),c=Math.cos(car.yaw),dx=x-car.x,dz=z-car.z;
  const localX=dx*c-dz*s,localZ=dx*s+dz*c;
  const front=spec.front??spec.len/2,rear=spec.rear??-spec.len/2;
  if(Math.abs(localX)>spec.W/2+.35||localZ<rear-.35||localZ>front+.35)return null;
  return car.y+spec.hgt+.35+Math.abs(Math.sin(car.pitch||0))*Math.max(Math.abs(front),Math.abs(rear))+Math.abs(Math.sin(car.roll||0))*spec.W/2;
}
