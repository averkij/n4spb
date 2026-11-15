// Source-clip landmarks, inspected on both exported rigs. Physics owns the
// launch/landing; source time is fitted to those events instead of free-running.
export const JUMPS={
  Jump:{anticipation:.14,takeoff:.24,apex:.47,landing:.79,end:1.04,recovery:.16},
  RunningJump:{anticipation:.12,takeoff:.30,apex:.60,landing:1.08,end:1.24,recovery:.12},
};
const clamp=t=>Math.max(0,Math.min(1,t));
export function jumpClipTime(jump,velocity) {
  const t=JUMPS[jump.clip];
  if(jump.phase==='anticipation')return t.takeoff*clamp(jump.time/t.anticipation);
  if(jump.phase==='land')return t.landing+(t.end-t.landing)*clamp(jump.time/t.recovery);
  return velocity>=0?t.takeoff+(t.apex-t.takeoff)*(1-clamp(velocity/6.5)):
    t.apex+(t.landing-t.apex)*clamp(-velocity/6.5);
}
