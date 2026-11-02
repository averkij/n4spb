// Shared architectural datums, measured against r1806688 and the supplied
// seven photographs. +X faces Moskovsky Prospekt; all coordinates are metres.
export const LIBRARY_PLAN = Object.freeze({
  x: -1842.1, z: 7456.3, floor: 1.44,
  columnRadius: 29.6, columnWidth: 1.06, columnDepth: 1.16,
  columnTop: 16.5, drumTop: 23.2, bodyTop: 18.2, storageTop: 28.5,
  clerestoryBottom: 21.15, clerestoryTop: 21.9,
  stairToe: -1798.1, stairBack: -1806.1, stairWidth: 34, stairCount: 10,
  portalNorth: [7416.1, 7427], portalSouth: [7484.5, 7495],
});
export const LIBRARY_PIERS = Object.freeze(Array.from({length:9},(_,i)=>{
  const angle=(-64+i*16)*Math.PI/180;
  return Object.freeze({angle,x:LIBRARY_PLAN.x+LIBRARY_PLAN.columnRadius*Math.cos(angle),z:LIBRARY_PLAN.z+LIBRARY_PLAN.columnRadius*Math.sin(angle)});
}));
export const LIBRARY_STEPS = Object.freeze(Array.from({length:LIBRARY_PLAN.stairCount},(_,i)=>Object.freeze({
  x0:LIBRARY_PLAN.stairToe-(i+1)*.8,x1:LIBRARY_PLAN.stairToe-i*.8,
  z0:LIBRARY_PLAN.z-LIBRARY_PLAN.stairWidth/2,z1:LIBRARY_PLAN.z+LIBRARY_PLAN.stairWidth/2,
  y:(i+1)*LIBRARY_PLAN.floor/LIBRARY_PLAN.stairCount,
})));
export const libraryPoint=(radius,angle,y=0)=>[LIBRARY_PLAN.x+radius*Math.cos(angle),y,LIBRARY_PLAN.z+radius*Math.sin(angle)];
export const libraryFrontEdge=e=>!e.hole&&e.a[0]>-1831&&e.b[0]>-1831&&Math.min(e.a[1],e.b[1])>7427&&Math.max(e.a[1],e.b[1])<7484.5;
export const libraryPortalEdge=e=>!e.hole&&Math.min(e.a[0],e.b[0])>-1826&&(
  Math.min(e.a[1],e.b[1])>=7416&&Math.max(e.a[1],e.b[1])<=7427.1 ||
  Math.min(e.a[1],e.b[1])>=7484.4&&Math.max(e.a[1],e.b[1])<=7495.1);
export const libraryMainCourt=p=>p.h.reduce((best,h)=>h.length>best.length&&h.some((v,i)=>i%2===0&&v>-1865&&v<-1820)?h:best,[]);

// The curved entrance fronts a deep foyer in the existing western building
// volume. Its concave east edge follows the surveyed entrance curve; the
// smaller northern/southern light wells remain outside this indoor room.
export const LIBRARY_HALL = Object.freeze({
  floor: LIBRARY_PLAN.floor, mezzanine: 5.64, ceiling: 17.9,
  ring: Object.freeze([
    -1902,7434.4,-1840.2,7436.5,-1845.5,7436.7,-1850.4,7438.2,
    -1854.8,7441,-1858.4,7444.8,-1860.8,7449.5,-1862,7454.6,
    -1861.7,7459.8,-1860.2,7464.7,-1857.4,7469.2,-1853.6,7472.7,
    -1849,7475.1,-1843.9,7476.3,-1902,7479.8,
  ]),
});
