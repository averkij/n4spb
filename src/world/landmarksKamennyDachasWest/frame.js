// landmarksKamennyDachasWest/frame.js - frames, footprints, fence chains and gates of the module (dossier docs/research/kamenny-2026.md 5.4 and the BUILD LOG "landmarksKamennyDachasWest"; photos V02..V08 F01..F12 G01..G08).
//   Every building is drawn in its own frame: local +x runs along a long wall of the OSM ring, local +z points to the INSIDE of the ring (the wall at z = 0 faces outward toward -z), y is metres above the lawn
//   (the island is flat: ground y = 0).  World(x, z) = O + x * (cos th, sin th) + z * (-sin th, cos th); Parts.push(O.x, 0, O.z, -th) puts a Parts collector into the frame.
//   FW  Follenweider mansion (w108026879): O = ring vertex 0, th 49.69 deg; the long 27.7 m wall z = 0 faces NE (the canal), the stepped front (the gable block with the tall tent roof, the round bay) faces WSW to the gate.
//   FG  Gauswald dacha (w108029314): O = ring vertex 1, th 64.53 deg; the 25.8 m wall z = 0 is the STREET front (faces ENE to the alley), z = 21.8 is the COURT front (WSW: the elevation of G01 G03 G08, seen from the court the tower is on the right = high x).
//   Polovtsov (w60703042) is drawn straight in world axes (the ring is within 0.3 deg of them): frame O = the middle of the ring, rot 0.
//   Compound houses of the Gauswald plot (w158330617 / 618 / 619) are drawn from their own rings, world coordinates.
const R2D = Math.PI / 180;
export const mkFrame = (ox, oz, thDeg) => {
  const th = thDeg * R2D, c = Math.cos(th), s = Math.sin(th);
  return { ox, oz, th, rot: -th, c, s,
    W: (x, z) => ({ x: ox + x * c - z * s, z: oz + x * s + z * c }),
    L: (wx, wz) => { const dx = wx - ox, dz = wz - oz; return [dx * c + dz * s, -dx * s + dz * c]; },
    /** world yaw (camera convention: 0 north, 90 west, 180 south, -90 east) of the local direction (dx, dz) */
    yaw: (dx, dz) => { const wx = dx * c - dz * s, wz = dx * s + dz * c; return Math.atan2(-wx, -wz) / R2D; } };
};
export const FW = mkFrame(-3778, -5210.9, 49.69);
export const FG = mkFrame(-3782.6, -5069.8, 64.53);
export const FP = mkFrame(-4182, -5197, 0);

/** footprints in the frame of the building (the OSM rings, re-measured from src/world/data) */
export const RING_FW = [[0, 0], [27.67, 0], [27.49, 2.07], [28.93, 3.3], [28.67, 8.72], [27.07, 9.98], [26.48, 19.18], [27.35, 20.32], [27.46, 23.43], [25.76, 23.43], [25.99, 28.87], [19.78, 28.32], [19.79, 26.76],
  [15.03, 26.65], [14.76, 25.11], [11.57, 25.16], [9.26, 27.26], [6.47, 27], [3.84, 20.83], [1.34, 21.46], [0.7, 19.74], [1.78, 17.38], [2.01, 8.92], [-2.19, 7.06], [-2.35, 2.46]];
export const RING_FG = [[0, 21.83], [0, 0], [25.81, 0], [25.87, 21.74]];
/** Polovtsov: world coordinates re-expressed in FP (origin (-4182,-5197)) */
const POL_W = [[-4157.1, -5207.4], [-4157.2, -5185.1], [-4174.2, -5185.2], [-4174.2, -5174.4], [-4156.7, -5174.3], [-4156.8, -5159.6], [-4185, -5159.8], [-4184.8, -5181.4], [-4207.1, -5181.6], [-4207.1, -5191.5],
  [-4212.4, -5193.6], [-4214.5, -5199.4], [-4212.9, -5205.6], [-4207.2, -5208.6], [-4206.8, -5222.4], [-4183.6, -5222.3], [-4183.6, -5235.4], [-4155.6, -5235.2], [-4155.7, -5218.6], [-4173.9, -5218.7], [-4174, -5207.6]];
export const RING_POL = POL_W.map(([x, z]) => [+(x - FP.ox).toFixed(2), +(z - FP.oz).toFixed(2)]);

/** the Gauswald compound: the three small houses of Bolshaya alleya 12-14/32 (world rings) */
export const COMPOUND = {
  w158330618: [[-3785.3, -5023.4], [-3782, -5027.7], [-3777.1, -5025.2], [-3775.4, -5027.3], [-3768.4, -5021.4], [-3769.6, -5018.3], [-3767.4, -5017.1], [-3770, -5013.2]],   // lit. R (the gabled house, G02 right)
  w158330619: [[-3764.4, -5026.7], [-3756.5, -5031.8], [-3752.4, -5027], [-3754.1, -5025.2], [-3751.8, -5019.9], [-3763.2, -5012.8], [-3764.8, -5015.2], [-3760.3, -5018.8]],          // lit. N (the hip-roof half-timber block, G02 middle)
  w158330617: [[-3742.1, -5040.5], [-3735.1, -5031.7], [-3739.4, -5028.7], [-3746.3, -5037.7]],                                                                                          // lit. P (the gate lodge, G04 left)
};

/** fence chains (world metres): { id: OSM way, pts, side: [x, z] a point on the INSIDE of the plot (the piers / cartouches look away from it), kind: 'pol' | 'fol' | 'gau' } */
export const CHAINS = [
  // Polovtsov: the shore fence along the Srednyaya Nevka embankment road (w128092326, baked simplified)
  { id: 'w128092326', kind: 'pol', inside: [-4180, -5200], pts: [[-4235.4, -4979.5], [-4238.8, -4981.3], [-4243.6, -4972.7], [-4258.8, -4981], [-4262.7, -4983.8], [-4266.1, -4988.7], [-4269.3, -4996.5], [-4269.8, -5004.7], [-4261.1, -5168.8],
      [-4252.1, -5194.7], [-4242.1, -5213.2], [-4230.7, -5227.6], [-4219.5, -5237.1], [-4193.3, -5256], [-4171.7, -5269.3], [-4149.5, -5284.8], [-4130.8, -5295.9], [-4113.8, -5303.7], [-4095.7, -5311.5], [-4062.8, -5324.4]] },
  // Follenweider: the front fence along Bolshaya alleya and the north-west run
  { id: 'w108026876', kind: 'fol', inside: [-3780, -5190], pts: [[-3798.6, -5141.5], [-3802.9, -5144.8], [-3815.1, -5159.2], [-3852.9, -5207.7]] },
  { id: 'w242395135', kind: 'fol', inside: [-3780, -5190], pts: [[-3852.9, -5207.7], [-3816.3, -5235.5], [-3784.4, -5249.5], [-3779.6, -5248.7], [-3763.5, -5247.4], [-3753.1, -5248]] },
  // Gauswald compound: the closed fence ring (two OSM ways)
  { id: 'w793224546', kind: 'gau', inside: [-3770, -5030], pts: [[-3850.8, -5050.1], [-3818.5, -5069.1], [-3803.4, -5078], [-3780.8, -5097.3], [-3744.4, -5052.8], [-3727.3, -5031.8], [-3671.9, -4964.1], [-3686, -4960.9],
      [-3732.4, -4964.9], [-3759.1, -4967.2], [-3768.6, -4968.1], [-3833.1, -4973.6]] },
  { id: 'w440416235', kind: 'gau', inside: [-3770, -5030], pts: [[-3832.7, -4977.4], [-3829.6, -5005], [-3827.3, -5025.2], [-3850.8, -5050.1], [-3852.7, -5049.1], [-3860.1, -5045.3], [-3886.6, -5024.1], [-3889.9, -5021.5], [-3910.8, -5002.6],
      [-3924.9, -4979.8], [-3878.3, -4976.7], [-3837.6, -4974.1]] },
];
/** gates: { id: OSM node, p: [x, z] on a chain, kind, w: clear opening width (m) } */
export const GATES = [
  { id: 'n1711539200', kind: 'pol', p: [-4149.5, -5284.8], w: 4.2 },                 // Polovtsov, the carriage gate at the road w257396786
  { id: 'n1240226402', kind: 'fol', p: [-3815.1, -5159.2], w: 4.4 },                 // Follenweider main gate (photos F07 F08 F12)
  { id: 'n1240226393', kind: 'folw', p: [-3802.9, -5144.8], w: 1.2 },               // the pedestrian gate at the footway
  { id: 'n7417184218', kind: 'gau', p: [-3744.4, -5052.8], w: 4.0 },                 // Gauswald carriage gate on the alley side
  { id: 'n7417184219', kind: 'gaub', p: [-3727.3, -5031.8], w: 4.4 },                // the brick-pier gate with the lodge (G04 G07)
  { id: 'n7417184216', kind: 'gau', p: [-3852.7, -5049.1], w: 3.6 },
];
