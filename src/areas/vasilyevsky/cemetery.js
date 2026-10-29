// areas/vasilyevsky/cemetery.js - the Smolensky Orthodox Cemetery as a plain polygon, for the crowd (HOOKS.inGarden of area.js: the people simulation reads it as "the garden of the area", people.js DENSITY.garden).
// The ring is the OSM record GREEN r2736670 (kind cemetery, 33 vertices, one ring, no holes, 540 647 m2, bbox x -6298.1 .. -5308.7, z -1698.1 .. -743.7), copied vertex for vertex from the data of the area
// (data/city-vo19.js) as src/areas/north/hooks/people.js does for the Tauride Garden: the area module must not import a data facade. PURE DATA + ONE PURE FUNCTION (no three.js, no imports).
export const CEMETERY_RING = [
  -5535.9, -1462.9, -5308.7, -1069.8, -5388.4, -1020.9, -5694, -844.6, -5867.5, -743.7, -5889.4, -782.2, -5903.2, -796.2, -5919.6, -800.3, -5985.8, -774.3, -6289.9, -1264.4, -6298.1, -1278.8,
  -6291.7, -1291.4, -6148.9, -1385.2, -6034.3, -1463.5, -6005.3, -1470.6, -5964.8, -1487.8, -5908.7, -1522.1, -5755.6, -1621.9, -5696.1, -1657.1, -5658.8, -1673.1, -5594.4, -1694.2, -5559.9, -1698.1,
  -5541.3, -1692.3, -5519.9, -1676.6, -5495.2, -1654.1, -5461.8, -1622.3, -5446.2, -1613, -5423.2, -1604.3, -5403.6, -1600.4, -5392.9, -1573, -5495.3, -1532.4, -5480.2, -1491.9, -5491.5, -1486.4,
];
/** True when (x, z) is inside the cemetery polygon (bbox first, then the even-odd ring test). */
export function inCemetery(x, z) {
  if (!(x > -6298.2 && x < -5308.6 && z > -1698.2 && z < -743.6)) return false;
  let c = false; const r = CEMETERY_RING;
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < (r[j] - r[i]) * (z - r[i + 1]) / (r[j + 1] - r[i + 1]) + r[i]) c = !c;
  }
  return c;
}
