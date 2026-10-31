// landmarksYelaginRossi/groups.js - the layout.GROUPS sub-groups of module landmarksYelaginRossi (pure data, no imports: layout.js merges them) and the HAND-OVER data to environment (environment/owners.js
// reads WATER_RINGS / KEEP_OUT / PAVED_RINGS from here once the module is registered there: docs/research/islands2-requests-landmarksYelaginRossi.md).  Dossier docs/research/yelagin-park-2026.md.
// Fields as in layout.GROUPS: { key, name, nameEn, ids: [OSM building ids + parents], osm: [non-building OSM ids], at: [x, z], note }.
// A part of the module is built only when its key is listed here (landmarksYelaginRossi.js PARTS), so a claim is on together with the drawing: claims are flipped on only for objects the module draws.
//   * rossi-music  w194544053                          the Music Pavilion (redrawn from the OSM ring)
//   * rossi-east   r2590124 + the footway area r2590123 (the paved spit) + the pedestrian area r12316492 (the granite pier = the stair notch): the East pavilion, the spit terrace, the railing, the stair
//   * rossi-guard  w100822197 (building=ruins)         the Guardhouse SITE: bare earth behind a printed hoarding, nothing standing
//   * rossi-island w181430159 (the unnamed building "4 литАЖ" on the west islet of the 3rd Southern pond = the Small Island Pavilion, Wikidata Q136065240)
// Not claimed on purpose: the quay walls of the east tip (w907143572-74, water owner), the footways round the pavilions (streets), the fences w907143570/71 (the module draws its own railing along the shore).
export const GROUPS_LIST = [
  { key: 'rossi-music', name: 'Музыкальный павильон (К. И. Росси)', nameEn: 'Music Pavilion: two cubic wings, a loggia of six grey marble columns, a half rotunda', ids: ['w194544053'], osm: [], at: [-4616.75, -4923.8],
    note: 'OSM building=public w194544053 (9-vertex ring, 221 m2); redrawn from the ring and the photos rossi 01-06' },
  { key: 'rossi-east', name: 'Павильон под флагом и Гранитная пристань на Восточной стрелке', nameEn: 'East pavilion (oval Doric portico of 10 columns, 8 on the park face; no flagstaff), the spit terrace, the ring railing and the granite stair', ids: ['r2590124'], osm: ['r2590123', 'r12316492'], at: [-4362.55, -5375.95],
    note: 'OSM r2590124 (pavilion ring), r2590123 (footway area of the spit), r12316492 (the granite pier = the stair notch)' },
  { key: 'rossi-guard', name: 'Место Гауптвахты (сгорела в 1996 г.)', nameEn: 'Guardhouse site: a cleared plot of bare earth behind a printed hoarding (the pavilion is not standing)', ids: ['w100822197'], osm: [], at: [-4568.7, -5015.3],
    note: 'OSM building=ruins w100822197; no building is drawn' },
  { key: 'rossi-island', name: 'Павильон на острове 3-го Южного пруда', nameEn: 'Small Island Pavilion: four white square piers under a hipped sheet-metal roof, on the west islet of the 3rd Southern pond', ids: ['w181430159'], osm: [], at: [-5339.9, -5112.3],
    note: 'OSM building=yes w181430159 (addr 4 литАЖ, 34 m2): the pavilion roof outline; Wikidata Q136065240 P625 (-5343.1,-5115.7); heritage id 7810363024' },
];

// ---------------------------------------------------------------------------------------------------- hand-over to environment
// WATER_RINGS: the pit of the granite stair at the east shore (the ring of r12316492 plus the stair head): the module draws the treads, cheeks and colliders (spit.js stair()).
export const WATER_RINGS = [{ id: 'granite-pier-stair', key: 'neva', ring: [[-4331.2, -5376.1], [-4335.5, -5378.5], [-4335.9, -5383.6], [-4337, -5387.7], [-4334.3, -5391], [-4332.2, -5386], [-4331.1, -5380.4]] }];
// KEEP_OUT: no generated descent, landing stage or boat at the pier
export const KEEP_OUT = [{ id: 'granite-pier', c: [-4338, -5382], r: 20 }];
// PAVED_RINGS: ground the module paves itself (gravel of the spit, the earth of the Guardhouse plot): no trunks, hedges, beds or grass tufts there
export const PAVED_RINGS = [
  { id: 'music-apron', ring: [[-4621.45, -4916.12], [-4611.55, -4931.15], [-4604.29, -4926.37], [-4614.18, -4911.34]] },
  { id: 'east-spit', ring: [[-4365.3, -5384.4], [-4359.2, -5391.8], [-4344.2, -5393.8], [-4340.2, -5397], [-4334.3, -5391], [-4337, -5387.7], [-4335.9, -5383.6], [-4335.5, -5378.5], [-4331.2, -5376.1], [-4331.9, -5371.7], [-4333.8, -5367.4], [-4339.6, -5369.1], [-4357.2, -5364.5], [-4359.8, -5367.5]] },
  { id: 'guard-plot', ring: [[-4574.7, -5025.5], [-4559.6, -5022.9], [-4562.6, -5005.1], [-4577.7, -5007.6]] },
];
