// Kresty grounds from the mapped wall chain, enclosing the historic crosses,
// hospital/service courts and the street entrance. Plan is survey-derived;
// the lawn edges and individual conifers are fitted to the supplied aerial.
export const COMPOUND_RING=[602.5,-2315.8,608.8,-2384.6,611.7,-2439.9,624.3,-2442.7,741.6,-2470,827.4,-2493.2,868,-2317.4,785.5,-2302.3,758.7,-2297.2,729.8,-2292.5,714,-2289.6,685.6,-2285.1,659.6,-2285.6,636.6,-2285.8,607.9,-2285.8,608.3,-2315.7];
export function inCompound(x,z){let yes=false;for(let i=0,j=COMPOUND_RING.length-2;i<COMPOUND_RING.length;j=i,i+=2)if((COMPOUND_RING[i+1]>z)!==(COMPOUND_RING[j+1]>z)&&x<(COMPOUND_RING[j]-COMPOUND_RING[i])*(z-COMPOUND_RING[i+1])/(COMPOUND_RING[j+1]-COMPOUND_RING[i+1])+COMPOUND_RING[i])yes=!yes;return yes;}
export const AUXILIARY_IDS=['w60557319','w60557331','w60557332','w60557312','w60557335','w60557412','w1239726592','w1239726595','w1538997281','w60557323','w60557390','w60557409'];
export const WALL_IDS=['w380103123','w1239726588','w380103115','w380103125','w1239726589'];
export const FRONT_FENCE_IDS=['w1239726556','w1239726557','w1239726560'];
// Only fully replaced small ways; the embankment sidewalk remains shared.
export const COURT_WAYS=['w715682524','w1328480068','w1328480069','w1328480070','w1328480071','w1328480072','w1328480073'];
export const LAWNS=[
  [676.5,-2319.8,712,-2326.4,705.2,-2342.7,682.2,-2340.0],
  [730.1,-2313.8,747.2,-2317.0,744.4,-2340.8,735.7,-2338.5],
  [683.6,-2348.8,701.7,-2352.3,697.0,-2374.1,676.8,-2369.6],
  [719.6,-2354.4,738.7,-2358.4,735.6,-2377.3,714.0,-2372.0],
  [626.2,-2439.1,652.6,-2444.0,660.7,-2397.0,640.9,-2393.0,627.5,-2405.0],
  [677.5,-2394.4,721.0,-2402.8,714.5,-2436.4,671.7,-2428.1],
  [745.7,-2309.5,794.0,-2318.8,788.5,-2341.0,744.5,-2335.9],
  [772.9,-2417.4,797.5,-2423.8,793.0,-2442.3,773.0,-2437.3],
  [753.5,-2444.7,803.4,-2458.2,799.3,-2468.2,749.6,-2456.0],
  [843.7,-2344.1,855.8,-2346.4,840.4,-2423.2,829.7,-2420.1],
];
// Spruces are prominent immediately behind the low street screen and beside
// the chapel. Broadleaf specimens occupy the larger rear/outer yard pockets.
export const TREES=[
  [699.0,-2319.5,24,'spruce'],[685.8,-2326.2,26,'spruce'],[737.3,-2320.9,24,'spruce'],[738.9,-2332.1,25,'spruce'],
  [694.2,-2359.0,23,'spruce'],[727.2,-2364.8,22,'spruce'],[684.5,-2362.4,22,'spruce'],
  [630.1,-2384.0,24,'lime'],[648.6,-2369.5,23,'lime'],[681.0,-2399.0,23,'lime'],
  [782.7,-2427.1,23,'lime'],[760.7,-2440.2,22,'lime'],[719.9,-2421.8,22,'lime'],
  [798.8,-2467.5,22,'lime'],[784.9,-2464.3,22,'lime'],[841.6,-2429.3,23,'lime'],
  [633.5,-2444.0,25,'lime'],[648.5,-2445.7,24,'lime'],[637.2,-2424.2,24,'lime'],
  [664.5,-2447.5,23,'lime'],[701,-2398,24,'lime'],[775.5,-2439.1,23,'lime'],
];
