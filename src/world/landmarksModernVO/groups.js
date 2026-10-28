// landmarksModernVO/groups.js - the layout.GROUPS sub-groups of module landmarksModernVO (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/modernvo.md 14.5).
// A part of the module is built only when its key is listed here (landmarksModernVO.js PARTS): flip a claim on together with its part.
export const GROUPS_LIST = [
  { key: 'modernvo-smirnov', name: 'Доходный дом А. А. Смирнова (дом с атлантами)', nameEn: 'Smirnov / Bennigsen house, the house with the atlantes (Sredny pr. 53 / 12th Line 29) + the 1950s replica wing (Sredny 51)',
    ids: ['w108204300', 'w108204307'], osm: [], at: [-4470, -990], note: 'house + replica wing on the Sredny front; the yard sheds w108204303 / w108204306 stay generic' },
  { key: 'modernvo-teodoridi', name: 'Дом меблированных комнат Ф. Ф. Теодориди', nameEn: 'Teodoridi house (Mining University dormitory no. 1, Volodikhin 1903-05): 118 m of relief brick, rounded corner with ribbon bows, the slotted zinc lantern',
    ids: ['r1541864'], osm: [], at: [-4809, -1296], note: 'relation with a courtyard hole' },
  { key: 'modernvo-erem46', name: 'Доходный дом А. А. Еремеевой («дом со шпицами»)', nameEn: 'Eremeeva house with the spires, 5th Line 46 (M. F. Eremeev 1903-05): an 86 m brick wall with four steep roofs and silver needles',
    ids: ['w108091608'], osm: [], at: [-4007, -1376], note: 'baked in the OLD region file city-v2.js (V2) although the site lies in the V5 play rect: the frozen-region proof (city-signature --ref) must be re-run' },
  { key: 'modernvo-erem82', name: 'Доходный дом А. А. Еремеевой («дом со шпилем»)', nameEn: 'Eremeeva house with the spire, Bolshoy pr. 82 (M. F. Eremeev 1902-05): red brick neo-Gothic, three-tier oriel tower with a round turret and the tent spire, 35 pinnacles',
    ids: ['r15473499'], osm: [], at: [-5529, 282], note: 'the sheds w52650684 / w65763922 and the rear block w65763853 stay generic; listed in kirova-houses.json as a KNOWN house (the city owner skips claimed ids)' },
  { key: 'modernvo-demidov', name: 'Доходный дом Н. П. Демидова', nameEn: 'Demidov house, Bolshoy pr. 50 (Kosyakov 1910-11): grey tile, wine-red upper floors, canted bay with lattice-vent blocks',
    ids: ['w32273617'], osm: [], at: [-4575, -254], note: 'tier B of the dossier; the 1879 yard wings are not mapped' },
  { key: 'modernvo-kudryavtsev', name: 'Доходный дом М. М. Кудрявцева (дом с подсолнухами)', nameEn: 'House with sunflowers, 15th Line 70 (Eremeev 1910-11): majolica panels of the Vaulin workshop, khaki brick, green belt, gable with the scarred oval',
    ids: ['r1538751'], osm: [], at: [-4957, -1321], note: 'relation with two courtyard holes' },
  { key: 'modernvo-borkhov', name: 'Доходные дома Х. Г. Борхова', nameEn: 'Borkhov houses, Bolshoy pr. 54 (corner tower with the grey dome) and 56 (cream front, maroon base)',
    ids: ['w160229193', 'r2144616'], osm: [], at: [-4660, -180], note: 'twin houses (Baranovsky 1911-12); r2144616 has a courtyard hole' },
  { key: 'modernvo-kornilova', name: 'Доходный дом А. П. Корниловой', nameEn: 'Kornilova house, Sredny pr. 56 (Baranovsky 1909-10): granite base, khaki tile with panel strips, round tower with glazed lantern and dome',
    ids: ['w96579812'], osm: [], at: [-4594, -858], note: 'footprint is the front L only; the courtyard wing is not mapped' },
  { key: 'modernvo-karlmay', name: 'Гимназия и реальное училище К. И. Мая', nameEn: 'Karl May school (Grimm 1909-10, now SPIIRAS): arches, S-curved crest, raised-letter inscription, studded gate',
    ids: ['w96579819'], osm: [], at: [-4567, -831], note: 'footprint is the U of the OSM way (wing A 28.9 m, middle block 19 m, SSE wing 67 m deep)' },
  { key: 'modernvo-zavarzin', name: 'Доходный дом А. А. и А. С. Заварзиных', nameEn: 'Zavarzin house, Sredny pr. 47 (Baranovsky 1910-11): granite base, buff tile, turquoise frieze, five-sided corner bay with the onion turret',
    ids: ['r1537672'], osm: [], at: [-4392, -1044], note: 'HIDDEN outline (skip 1) with 7 parts w977040753 / 754 / 757 / 749 / 750 / 752, w819603148: all claimed through the parent' },
  { key: 'modernvo-kornilov', name: 'Доходный дом М. Д. Корнилова', nameEn: 'Kornilov house, Sredny pr. 45 (Baranovsky 1914-15): white tile, five-sided corner bay with the ribbed crown, 21 dormers',
    ids: ['w108132180'], osm: [], at: [-4328, -1067], note: 'part w819603149 (the corner bay pier) is claimed through the parent' },
  { key: 'modernvo-kollan', name: 'Дом Ю. П. Коллана', nameEn: 'Kollan house by Lidval (Bolshoy pr. 92): mauve roughcast, three cream oriels, cobble mosaics',
    ids: ['w65710570'], osm: [], at: [-5738, 399], note: 'regional monument since 2025; the baked 13.2 m is replaced by the corrected 13.7 m eaves and the hip roof' },
];
