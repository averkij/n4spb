// landmarksMarineFacade/groups.js - the layout.GROUPS sub-groups of module landmarksMarineFacade (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/marinefacade.md section 10).
// A part of the module is built only when its key is listed here (landmarksMarineFacade.js PARTS): flip a claim on together with its part.
export const GROUPS_LIST = [
  { key: 'mf-terminals', name: 'Морской вокзал: четыре терминала и ЦУП', nameEn: 'Passenger port Marine Facade: terminals 1-4 and the control centre',
    ids: ['w41575292', 'w95606143', 'w95606141', 'w157323819', 'w95606142'], osm: [], at: [-9040, -1750],
    note: 'four wedge terminals (measured roof rectangles) + the control centre; the generic city drew four 17.5 m rent-house boxes' },
  { key: 'mf-galleries', name: 'Морской вокзал: крытые галереи причалов', nameEn: 'Passenger port: seven covered quay galleries and the elevated ferry gallery',
    ids: ['w704139101', 'w704139100', 'w704139096', 'w704139097', 'w704139098', 'w704139085', 'w1278049992', 'w1278049984'], osm: [], at: [-8950, -1700],
    note: 'seven building=roof strips (the generic city drew 5 m canopies) + the elevated ferry gallery w1278049984 (baked as kind yes, 22 vertices)' },
  { key: 'mf-furniture', name: 'Морской вокзал: ограждение, ворота, мачты освещения', nameEn: 'Passenger port: security fences, precast walls, gates, the 18 floodlight masts',
    ids: [], at: [-9100, -1700],
    osm: ['w1278051833', 'w1278050004', 'w1278050003', 'w1278050002', 'w1278051835', 'w1278050019', 'w1278051842', 'w1278051831', 'w1278050025', 'w1286786905', 'w1278049975', 'w1278050027', 'w1278051829', 'w1278049988', 'w1278051828', 'w1278049985', 'w1278050017', 'w1278049990',
      'w704139084', 'w704139087', 'w704139089', 'w704139076', 'w704139099', 'w704139081', 'w704139082', 'w704139086',
      'n6611648052', 'n6611648053', 'n6611648054', 'n6611648055', 'n6611648056', 'n6611648057', 'n6611648058', 'n6611648046', 'n6611648047', 'n6611648048', 'n6611648049', 'n6611648050', 'n6611648051', 'n11865421649', 'n6611648062', 'n6611648059', 'n6611648060', 'n6611648061',
      'n3283815699', 'n5235032090', 'n5235032091', 'n5235032097', 'n5235032100', 'n11865405969', 'n11865405981', 'n11865405984', 'n11865405985', 'n11865421581', 'n11865406186', 'n6611626374', 'n3283815681', 'n11865421618', 'n11865406106'],
    note: 'nobody else draws the BARRIERS / MANMADE masts / BARRIER_NODES gates of the closed port (environment/field.js only stamps the ground raster under fences)' },
  { key: 'mf-checkpoints', name: 'Морской вокзал: КПП и залы досмотра', nameEn: 'Passenger port: vehicle checkpoint canopies, passport / vehicle inspection hall, customs and check halls',
    ids: ['w359652785', 'w1112880827', 'w359652787', 'w157323822', 'w157323823', 'w981598902', 'w1192416737', 'w1278049986', 'w157323818', 'w157323815', 'w157323814'], osm: [], at: [-8760, -1750],
    note: 'canopies built from the baked corner lists; halls are flat-roofed boxes of 6.5-9 m (misc.js)' },
  { key: 'mf-sheds', name: 'Морской вокзал: будки, павильоны и склады', nameEn: 'Passenger port: booths, kiosks, technical pavilions and sheds (plain boxes)',
    ids: ['w1278051836', 'w1278051837', 'w1278051840', 'w1278051841', 'w1278051843', 'w1278069033', 'w1278051834', 'w359652781', 'w1278051830', 'w1278049982', 'w1278050020', 'w359652783', 'w704139080', 'w359652779', 'w157323816', 'w1278049978', 'w157323825', 'w157323827', 'w157323828', 'w1278050016', 'w1278049991', 'w157323820', 'w157323821', 'w1278049994', 'w1168230262', 'w1278050013'], osm: [], at: [-9000, -1500],
    note: 'tier 2: flat boxes with the heights of table 4.9 (the generic city drew 6.5-9 m house blocks)' },
  { key: 'mf-tip', name: 'Морской вокзал: ангар на мысе', nameEn: 'Passenger port: the tip hangar and the two yard sheds', ids: ['w1435530846', 'w704139077', 'w704139079'], osm: [], at: [-9640, -1300],
    note: 'hangar 40.2 x 59.2 m (double-pitch white roof), sheds of the closed yard' },
  { key: 'mf-shore', name: 'Яхтенная марина порта и арт-объекты «Маяк»', nameEn: 'Yacht marina on the north shore of the land fill (main pier + five fingers) and the two Mayak art objects',
    ids: [], osm: ['w1278050005', 'w1278050006', 'w1278050007', 'w1278050008', 'w1278050009', 'w1278050010', 'w1278050011', 'w1278050012', 'n13416353221', 'n12149444658'], at: [-8900, -2300],
    note: 'piers are LINES in the data (environment/boats.js ignores them); the Mayak design is undocumented: a tier-3 placeholder column on a plaza clipped at the asphalt' },
  { key: 'golden-city-spire', name: 'ЖК Golden City, квартал 6 со шпилем', nameEn: 'Golden City quarter 6 (Chelyuskina 2): U-block with the 52 m gold spire and the gold crown',
    ids: ['r7378335'], osm: [], at: [-8745, -955],
    note: 'outline r7378335 + parts r10034568 / 69 / 70 / 71 (claimed through the parent id) with the real heights 19.2 / 19.2 / 43.2 / 52.2 m; the spire stands on r10034571, the box crown on r10034570; the crowns of r12001859 / r12001860 are overlays (not claimed)' },
];

// Ground that this module paves or lays itself (claims.js: no trunks, hedges, beds or grass tufts there; listed only while the module is in the build list).
// the helipad apron (concrete 36 x 36 m round the pad at the tip, frame F (643, -99)), the Mayak plazas (placeholder discs r 4.5 m) and the roundabout island (R 8.1 m, lawn)
const ring = (cx, cz, r, n = 12) => Array.from({ length: n }, (_, i) => [Math.round((cx + Math.cos(i / n * Math.PI * 2) * r) * 10) / 10, Math.round((cz + Math.sin(i / n * Math.PI * 2) * r) * 10) / 10]);
// the berth apron: 21 m between the measured quay edge and the land (tools/landmarksMarineFacade-rings.mjs prints this array; quay.js lays the berth strip + the apron on it)
export const BERTH_RINGS = [[[-9011.6,-1249.8],[-9039.4,-1258.1],[-9067.1,-1266.5],[-9094.9,-1274.9],[-9122.7,-1283.2],[-9150.4,-1291.6],[-9178.2,-1300],[-9206,-1308.3],[-9233.7,-1316.7],[-9261.5,-1325.1],[-9289.3,-1333.4],[-9317,-1341.8],[-9344.8,-1350.2],[-9372.6,-1358.5],[-9400.3,-1366.9],[-9428.1,-1375.3],[-9455.9,-1383.6],[-9483.6,-1392],[-9511.4,-1400.4],[-9539.2,-1408.7],[-9566.9,-1417.1],[-9573,-1397],[-9545.2,-1388.6],[-9517.5,-1380.3],[-9489.7,-1371.9],[-9461.9,-1363.5],[-9434.2,-1355.2],[-9406.4,-1346.8],[-9378.6,-1338.4],[-9350.9,-1330.1],[-9323.1,-1321.7],[-9295.3,-1313.3],[-9267.6,-1305],[-9239.8,-1296.6],[-9212,-1288.2],[-9184.3,-1279.9],[-9156.5,-1271.5],[-9128.7,-1263.1],[-9101,-1254.8],[-9073.2,-1246.4],[-9045.4,-1238],[-9017.7,-1229.7]],[[-8993.5,-1254.9],[-8985.1,-1282.6],[-8976.5,-1310.3],[-8968.1,-1338.1],[-8959.5,-1365.8],[-8951.2,-1393.6],[-8942.8,-1421.3],[-8934.4,-1449.1],[-8926.1,-1476.9],[-8917.7,-1504.6],[-8909.3,-1532.4],[-8901,-1560.2],[-8892.6,-1587.9],[-8884.2,-1615.7],[-8876.1,-1643.5],[-8867.7,-1671.3],[-8859.4,-1699.1],[-8851,-1726.8],[-8842.6,-1754.6],[-8834.3,-1782.4],[-8825.9,-1810.1],[-8817.5,-1837.9],[-8809.4,-1865.7],[-8801,-1893.5],[-8792.7,-1921.3],[-8784.3,-1949],[-8775.9,-1976.8],[-8767.6,-2004.6],[-8747.5,-1998.5],[-8755.8,-1970.8],[-8764.2,-1943],[-8772.6,-1915.2],[-8780.9,-1887.5],[-8789.3,-1859.7],[-8797.4,-1831.8],[-8805.8,-1804.1],[-8814.2,-1776.3],[-8822.5,-1748.5],[-8830.9,-1720.8],[-8839.3,-1693],[-8847.6,-1665.2],[-8856,-1637.5],[-8864.1,-1609.6],[-8872.5,-1581.9],[-8880.9,-1554.1],[-8889.2,-1526.3],[-8897.6,-1498.6],[-8906,-1470.8],[-8914.3,-1443],[-8922.7,-1415.3],[-8931.1,-1387.5],[-8939.4,-1359.7],[-8948,-1332],[-8956.4,-1304.3],[-8965,-1276.6],[-8973.4,-1248.8]],[[-8836.7,-2079.6],[-8864.6,-2087.7],[-8892.5,-2095.6],[-8920.3,-2103.7],[-8948.2,-2111.9],[-8976,-2120],[-9003.8,-2128.1],[-9031.8,-2136],[-9059.6,-2144.1],[-9087.4,-2152.3],[-9115.3,-2160.4],[-9143.1,-2168.5],[-9171,-2176.4],[-9198.9,-2184.5],[-9226.7,-2192.7],[-9254.5,-2200.8],[-9282.4,-2208.9],[-9310.3,-2216.8],[-9338.1,-2224.9],[-9366,-2233.1],[-9359.9,-2253.2],[-9332.1,-2245.1],[-9304.2,-2236.9],[-9276.3,-2229],[-9248.5,-2220.9],[-9220.6,-2212.8],[-9192.8,-2204.7],[-9165,-2196.5],[-9137.1,-2188.6],[-9109.2,-2180.5],[-9081.4,-2172.4],[-9053.5,-2164.3],[-9025.7,-2156.1],[-8997.8,-2148.2],[-8969.9,-2140.1],[-8942.1,-2132],[-8914.3,-2123.9],[-8886.4,-2115.7],[-8858.5,-2107.8],[-8830.7,-2099.7]]];
export const PAVED_RINGS = [
  ...BERTH_RINGS,
  [[-9264.6, -1303.8], [-9254.4, -1300.7], [-9260.8, -1279.7], [-9270.9, -1282.7]], [[-8893.4, -1503.6], [-8890.4, -1513.7], [-8869.3, -1507.4], [-8872.4, -1497.2]],           // the brick forecourts of terminals 1 and 2
  [[-8713.2, -1798.5], [-8703, -1795.5], [-8696.7, -1816.5], [-8706.8, -1819.6]], [[-9060, -2179.5], [-9049.9, -2176.4], [-9043.5, -2197.5], [-9053.7, -2200.6]],             // terminals 3 and 4
  [[-9634.2,-1315.5],[-9668.7,-1325.9],[-9658.3,-1360.4],[-9623.8,-1350]],            // helipad pad + apron: frame F u 625 .. 661, v -117 .. -81 (square, aligned with the quay walls)
  ring(-8683.7, -810.8, 4.5), ring(-8666.9, -541.2, 4.5),
  ring(-9577.7, -1330.5, 8.4, 16),
];
// No generated landing stage, boat or pontoon at the berths (environment/boats.js reads KEEP_OUT): the two moored liners.
export const KEEP_OUT = [
  { id: 'liner-a', c: [-8897.0, -1633.1], ax: [-0.2885, 0.9575], hl: 150, hw: 22 },               // east wall, berths 4-5: hull axis bearing 197 deg (bow SSW)
  { id: 'liner-b', c: [-9150.3, -1309.4], ax: [-0.9575, -0.2885], hl: 130, hw: 22 },              // south wall, berth 6: hull axis bearing 287 deg (bow WNW)
];
