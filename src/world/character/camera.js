// A bounded sphere sweep through the existing collision service. The same
// building, train, car and breakable-wall solids block the camera and walker.
export function footCameraFraction(physics,origin,delta) {
  const length=Math.hypot(delta.x,delta.y,delta.z),steps=Math.max(1,Math.ceil(length/.28));
  const blocked=f=>{
    const x=origin.x+delta.x*f,y=origin.y+delta.y*f,z=origin.z+delta.z*f;
    return physics.columnBlocked(x,z,.2,y-.2,y+.2);
  };
  if(blocked(0))return 0;
  let clear=0;
  for(let i=1;i<=steps;i++){
    const f=i/steps;
    if(blocked(f)){
      let lo=clear,hi=f;
      for(let k=0;k<6;k++){const mid=(lo+hi)/2;if(blocked(mid))hi=mid;else lo=mid;}
      return lo;
    }
    clear=f;
  }
  return 1;
}
