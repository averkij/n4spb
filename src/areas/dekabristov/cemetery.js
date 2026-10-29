// areas/dekabristov/cemetery.js - the cemeteries of the island as plain polygons, for the crowd (HOOKS.inGarden of area.js: the people simulation reads them as "the garden of the area", people.js DENSITY.garden): calm places with a
// quarter of the density and nobody on wheels. FOUR rings, one function:
//   SMOLENSKY  the Smolensky Orthodox Cemetery, GREEN r2736670 (kind cemetery, one ring, 33 vertices): copied from src/areas/vasilyevsky/cemetery.js (the same place stands in both areas, the seam is the same crowd rule)
//   LUTHERAN   the Smolensky Lutheran Cemetery, GREEN r7738342 (39 vertices, 94 572 m2, bbox x -5659.4 .. -5208.5, z -2160.8 .. -1698)
//   ARMENIAN   the Smolensky Armenian Cemetery with the church of the Resurrection, GREEN r7738341 (15 vertices, 11 235 m2)
//   SIEGE      the memorial cemetery "Ostrov Dekabristov" of the siege of Leningrad, GREEN w23426250 (21 vertices, 48 723 m2)
// The three island rings are copied vertex for vertex from the data of this area (data/city-d3x.js ..., the GREEN records of those ids; the OSM ways were completed by the DK fetch, docs/research/dekabristov-data.md), as
// src/areas/north/hooks/people.js does for the Tauride Garden: the area module must not import a data facade. PURE DATA + PURE FUNCTIONS (no three.js, no imports).
export const CEMETERY_RING = [
  -5535.9, -1462.9, -5308.7, -1069.8, -5388.4, -1020.9, -5694, -844.6, -5867.5, -743.7, -5889.4, -782.2, -5903.2, -796.2, -5919.6, -800.3, -5985.8, -774.3, -6289.9, -1264.4, -6298.1, -1278.8,
  -6291.7, -1291.4, -6148.9, -1385.2, -6034.3, -1463.5, -6005.3, -1470.6, -5964.8, -1487.8, -5908.7, -1522.1, -5755.6, -1621.9, -5696.1, -1657.1, -5658.8, -1673.1, -5594.4, -1694.2, -5559.9, -1698.1,
  -5541.3, -1692.3, -5519.9, -1676.6, -5495.2, -1654.1, -5461.8, -1622.3, -5446.2, -1613, -5423.2, -1604.3, -5403.6, -1600.4, -5392.9, -1573, -5495.3, -1532.4, -5480.2, -1491.9, -5491.5, -1486.4,
];
export const LUTHERAN_RING = [
  -5615.3, -2066.3, -5618, -2076, -5620, -2134.5, -5615.9, -2134.7, -5616.2, -2142, -5608.6, -2144.4,
  -5586.5, -2145.8, -5574, -2155.1, -5487.5, -2158.5, -5416.5, -2159.5, -5403.9, -2160.8, -5378.3, -2112.1,
  -5361.7, -2114.1, -5342.8, -2079.2, -5338.5, -2067.1, -5308.3, -1990.8, -5308.4, -1981.9, -5262.9, -1896.6,
  -5256.8, -1880.9, -5253.2, -1878.1, -5208.5, -1753, -5216.6, -1747.3, -5223.6, -1743.9, -5245.5, -1736,
  -5251.1, -1754.3, -5310.2, -1733.5, -5305.5, -1718.4, -5313.9, -1715.4, -5374.3, -1698, -5413.3, -1812.5,
  -5439.4, -1896.3, -5458.8, -1945.3, -5459.1, -1951, -5477.4, -1961, -5659.4, -2005.8, -5657.8, -2023.7,
  -5635.4, -2035.8, -5615.5, -2053.4, -5611, -2058.1,
];
export const ARMENIAN_RING = [
  -5492.6, -1841.2, -5495.4, -1847.8, -5494.9, -1856.1, -5475.5, -1855.8, -5470.5, -1854, -5440.9, -1864.7,
  -5385.3, -1701.3, -5389.2, -1698.4, -5419.8, -1700.7, -5420.4, -1710, -5473.2, -1713.5, -5472.6, -1737.2,
  -5475, -1758.4, -5474.8, -1764.4, -5500, -1765.4,
];
export const SIEGE_RING = [
  -6006.4, -1504.1, -6018, -1500.6, -6047.5, -1494.6, -6057, -1493.2, -6071.4, -1493.2, -6071.7, -1499.8,
  -6098.3, -1595.5, -6079.6, -1611.5, -6077.5, -1619.3, -6080.4, -1628.1, -6062.1, -1639.9, -5975.7, -1641.4,
  -5871.5, -1731, -5866.2, -1725.6, -5833.6, -1741.1, -5761.7, -1789.9, -5726.6, -1743.8, -5679.6, -1693,
  -5766.9, -1652.6, -5843.1, -1604.2, -5995.3, -1509.2,
];

// Two more rings for the HUD rows of landmarksDekabristov (area.js makeAreas): NOT cemeteries, not part of inCemetery (the crowd rule stays as it was). Copied vertex for vertex from the GREEN records of the data:
//   GARDEN   the Decembrists' Garden, GREEN w16237335 (park, 33 vertices, 57 137 m2);  VOLODIN  the square of Alexander Volodin, GREEN r10331754 (park, 10 vertices, 21 763 m2)
export const GARDEN_RING = [
  -6389.3, -2420, -6408.9, -2415.9, -6406.7, -2406, -6422.8, -2402.8, -6461, -2413.9, -6434.4, -2502.1, -6426.1, -2531.9, -6366.2, -2516.2, -6339.2, -2512, -6310.6, -2510.2, -6096.5, -2506.1,
  -6089.2, -2505.3, -6082.4, -2501.5, -6077.9, -2494.6, -6044.1, -2430.2, -6178.7, -2364.9, -6210.3, -2392.5, -6248.8, -2382, -6222.3, -2332.6, -6254.9, -2317.6, -6361, -2287.2,
];
export const VOLODIN_RING = [
  -7863.3, -2112.9, -7868.8, -2095, -7858.6, -2091.9, -7885.8, -2002.2, -7892, -2004.1, -7897.7, -1985.8, -7925.9, -1994.5, -7928.1, -1987.4, -8047.6, -2024.1, -8006.6, -2156.9,
];

/** The rings with their bounding boxes: [{ ring, x0, x1, z0, z1 }]. */
const RINGS = [CEMETERY_RING, LUTHERAN_RING, ARMENIAN_RING, SIEGE_RING].map((ring) => {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < ring.length; i += 2) { x0 = Math.min(x0, ring[i]); x1 = Math.max(x1, ring[i]); z0 = Math.min(z0, ring[i + 1]); z1 = Math.max(z1, ring[i + 1]); }
  return { ring, x0: x0 - 0.1, x1: x1 + 0.1, z0: z0 - 0.1, z1: z1 + 0.1 };
});
const inRing = (r, x, z) => {
  if (!(x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1)) return false;
  let c = false; const q = r.ring;
  for (let i = 0, j = q.length - 2; i < q.length; j = i, i += 2) {
    if ((q[i + 1] > z) !== (q[j + 1] > z) && x < (q[j] - q[i]) * (z - q[i + 1]) / (q[j + 1] - q[i + 1]) + q[i]) c = !c;
  }
  return c;
};
/** True when (x, z) is inside the Smolensky Orthodox Cemetery polygon (bbox first, then the even-odd ring test). */
export const inSmolensky = (x, z) => inRing(RINGS[0], x, z);
/** True when (x, z) is inside any cemetery of the island (HOOKS.inGarden of area.js). */
export function inCemetery(x, z) {
  for (let i = 0; i < RINGS.length; i++) if (inRing(RINGS[i], x, z)) return true;
  return false;
}
