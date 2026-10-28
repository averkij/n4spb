// landmarksMakarova/groups.js - the layout.GROUPS sub-groups of module landmarksMakarova (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/makarova.md section 11).
// A part of the module is built only when its key is listed here (landmarksMakarova.js PARTS): ON lists the parts that exist, flip a claim on together with its part.
// NOT claimed on purpose: the quay walls w1172768000 / w1172767994 (environment), w91863048 / w1317863357 (not baked), the metro pits' nodes n5930135059 n5930135058 n3566607212, the rear / courtyard buildings of the row
// (w107454303 w1077493335 w1077493329 w1077493337 w107454290 w107454312), the footways, roads and the tram stop, the ordinary houses of makarova-houses.json (city).
const ON = ['sportivnaya2', 'lions-pier', 'catherine-church', 'makarova-row', 'lutheran-catherine', 'lutheran-michael', 'brullov-house'];

const ALL = [
  { key: 'sportivnaya2', name: 'Станция «Спортивная»: выходы № 6 и № 7', nameEn: 'Sportivnaya-2 exits 6 and 7: the two oval glazed pavilions (2015)',
    ids: ['w627859233', 'w627859229'], osm: ['n3566607199', 'n5927391593'], at: [-3773, -1695],
    note: 'exit 6 w627859233 (a solid 3.3 m shell with no door in the generic city) and exit 7 w627859229 (a roof cone); the metro owner draws the room, the well, the stair and the escalators inside' },
  { key: 'lions-pier', name: 'Спуск со львами', nameEn: 'Lions pier (1806-09): the granite stair in three flights, the stepped barriers with diamond-point piers, two granite lions on pedestals',
    ids: [], osm: ['r15853951', 'w1193456678', 'w1193456679', 'w1193456680', 'w1172767996', 'w1172767998', 'n10896438099'], at: [-2851, -1442],
    note: 'the pier is LAND at street level in the generic scene (WATER_RINGS below turn the pit into water; the module draws the flights, the cheeks and the lions); the OSM STEPS ways are drawn by streets as flat strips: claimed (the untagged river-front edges w1172767997 / w1172767999 are not baked: not listed)' },
  { key: 'catherine-church', name: 'Церковь Св. Екатерины у Тучкова моста', nameEn: 'Church of St Catherine at the Tuchkov Bridge (A. Mikhailov 1811-23, bell tower 1861-63): cube with pedimented arms, colonnaded drum, ribbed dome with the angel, bell tower, chapel, gatehouse, fence',
    ids: ['w74284443', 'w107454308', 'w107454291', 'w216655313'], osm: [], at: [-3651, -1556],
    note: 'outline w74284443 (skip) + the six parts follow through the parent id; the gatehouse w107454308, the transformer chapel w107454291 and the bell frame w216655313 are drawn by the module' },
  { key: 'makarova-row', name: 'Дома Яковлевых и дом Стенбок-Фермора (наб. Макарова 12-16)', nameEn: 'Yakovlev houses nos. 14 and 16/2 (A. Melnikov 1823-26) and the Stenbock-Fermor house no. 12 (V. Zeidler 1900-01)',
    ids: ['w107454297', 'w107454310', 'w107454280'], osm: [], at: [-3392, -1500],
    note: 'no. 12 w107454297 (+ parts w1058170858 w1077493336), no. 14 w107454310, no. 16/2 w107454280' },
  { key: 'lutheran-catherine', name: 'Лютеранская церковь Св. Екатерины', nameEn: 'Lutheran Church of St Catherine (Yu. Felten 1768-71): four-column Doric portico, stair wings with the apostles, domed drum',
    ids: ['w54949806'], osm: [], at: [-3460, -1041], note: 'outline w54949806 + the dome circle w875603833 (parent id)' },
  { key: 'brullov-house', name: 'Дом Брюллова (Кадетская линия, 21)', nameEn: 'Brullov (Suzor) house, Kadetskaya liniya 21 (A. Bryullov 1845): seven axes, a giant order of four composite pilasters, a pediment, dormers; restored and repainted pale yellow',
    ids: ['r1257269'], osm: [], at: [-3565, -1396], note: 'the 943 m2 outline with the court hole: the street front is the 22.1 m side with seven axes; the 63.7 m side runs along Tuchkov per.' },
  { key: 'lutheran-michael', name: 'Лютеранская церковь Св. Михаила', nameEn: 'Lutheran Church of St Michael (K. Bulmering 1871-76): neo-Gothic nave, tower with a dark steel spire',
    ids: ['r18085303'], osm: [], at: [-3791, -1325], note: 'relation r18085303 (skip) + the parts w216851328 w874900374 w874900375 r18085302 (parent id)' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));

// ---- hand-over to environment (environment/owners.js): active only while the module has claims; filled when the Lions pier part exists
const PIER_ON = ON.includes('lions-pier');
export const WATER_RINGS = PIER_ON ? [{ id: 'lions-pit', key: 'neva', ring: [[-2857.6, -1447.0], [-2842.7, -1444.9], [-2843.7, -1438.2], [-2858.5, -1440.2]] }] : [];
export const KEEP_OUT = PIER_ON ? [{ id: 'lions-pier', c: [-2851.1, -1442.4], ax: [0.9903, 0.1392], hl: 9, hw: 5 }] : [];
// ground the module paves itself (claims.js: no trunks, hedges, beds or grass tufts there): filled per part
export const PAVED_RINGS = [];
