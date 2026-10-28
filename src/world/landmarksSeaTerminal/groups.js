// landmarksSeaTerminal/groups.js - the layout.GROUPS sub-groups of module landmarksSeaTerminal (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (docs/research/seaterminal.md section 1.3).
// A part of the module is built only when its key is listed here (landmarksSeaTerminal.js PARTS): flip a claim on together with its part.
//   sea-terminal   terminal.js deck.js top.js quay.js: the relation r6702553 (outline + the seven parts through the parent id: the generic city drew stacked slabs and a thin 78 m prism), the hotel POI n1520110813, the four
//                  `bridge=yes` / covered service ways of the deck and the NW ramp (streets skips claimed bridge ways: the module draws the deck, the ramp and the asphalt under it), the port fences of the lot.
//   d2-narodovolets sub.js: the ship relation r14595064 (+ parts), the three open-air exhibits and the foundation stone.
//   torpedo-boat   boat.js: the monument boat w53500959 (a historic-ship polygon; MONUMENTS only cleared trees).
//   lenexpo-site   site.js: the perimeter fences of the former Lenexpo site (hoarding + closed gates + guard booth); the pavilions and the site polygon stay generic (lead decision).
// NOT claimed on purpose: the square polygon w638354338 (it carries the junction roads), the lot w60989201, the footways, the port shed w128448740, the Lenexpo pavilions, BUS_STOPS r6702553 (same id as the building).
// n4spb: Vasilyevsky-Okrug 7 claims only the Sea Terminal. The D-2 museum (476 m out) and the Lenexpo site (272 m out, half of it outside the data) are not drawn; the torpedo-boat monument at (-6565, 355) lies 125 m
// beyond the play rectangles, 5 m beyond the 120 m data margin (tools/landmarks-groups-check.mjs: 'at' outside the data extent; no ground, lawn or footpath data around it), so it is not drawn either.
// The rings of an unclaimed group are not handed over (ON, as in landmarksAcademy/groups.js): add the key here together with the area claim.
const ON = ['sea-terminal'];
const ALL = [
  { key: 'sea-terminal', name: 'Морской вокзал', nameEn: 'Sea Terminal (Sokhin, Kalyagin et al., 1982): the prism with its sails, hotel tiers, spine, needle, the two-tier deck, the NW ramp and the port fence of the lot',
    ids: ['r6702553', 'w128448740'], osm: ['n1520110813', 'w452522613', 'w452522620', 'w452522610', 'w118994411', 'w452522616', 'w508629492', 'w696745611'], at: [-6519, 709],
    note: 'outline + 7 parts claimed through the parent id; w128448740 = the blue-roofed port shed NW of the deck (shed.js: the generic city drew a yellow tenement there); n1520110813 = the hotel POI; the four elevated service ways are replaced by the deck and the NW ramp; the three port fences are drawn by the module (green mesh, lift gate open)' },
  { key: 'd2-narodovolets', name: 'Подводная лодка-музей Д-2 «Народоволец»', nameEn: 'Submarine museum D-2 Narodovolets with the pavilion, yard fence and open-air exhibits',
    ids: ['r14595064'], osm: ['w1095638979', 'w1095638980', 'w1095638981', 'n10033881447'], at: [-6598, -66],
    note: 'ship ring + parts; the three exhibit vehicles and the foundation stone are drawn by the module; the museum plot fences w1095638978 / w372463179 are drawn with the gates open (not claimed: no generic module draws them)' },
  { key: 'torpedo-boat', name: 'Торпедный катер «Комсомолец»', nameEn: 'Torpedo-boat monument', ids: [], osm: ['w53500959'], at: [-6565, 355], note: 'boat, plinth, bollard chain, brick footpath, plaque' },
  { key: 'lenexpo-site', name: 'Участок бывшего Ленэкспо (забор стройплощадки)', nameEn: 'Former Lenexpo site: hoarding, closed gates, guard booth', ids: [], osm: ['w133197188', 'w60989199'], at: [-6564, 200],
    note: 'perimeter fences only; the pavilions stay the generic city\'s by decision of the lead' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));

// Ground that this module paves or lays itself (claims.js: no trunks, hedges, beds or grass tufts there; listed only while the module is in the build list):
//  * the asphalt floor under / in front of the NE deck (frame T u 3.4 .. 117.5, v -21 .. -0.3),
//  * the torpedo-boat lawn, plinth and brick footpath (frame B x -4.5 .. 8.7, z -13 .. 13),
//  * the round gravel plaza of the D-2 foundation stone (r 3 at frame D (-32.9, -4.8)).
const tw = (u, v) => [-6542.4 + 0.87327 * u - 0.48723 * v, 652.9 + 0.48723 * u + 0.87327 * v];
const bw = (a, b) => { const c = Math.cos(-0.5236), s = Math.sin(-0.5236); return [-6565.1 + c * a + s * b, 354.5 - s * a + c * b]; };
const dw = (a, b) => { const c = Math.cos(-1.1361), s = Math.sin(-1.1361); return [-6600.65 + c * a + s * b, -59.75 - s * a + c * b]; };
export const PAVED_RINGS = [
  [tw(3.4, -21), tw(117.5, -21), tw(117.5, -0.3), tw(3.4, -0.3)],
  ...(ON.includes('torpedo-boat') ? [[bw(-4.9, -13), bw(8.9, -13), bw(8.9, 13), bw(-4.9, 13)]] : []),
  ...(ON.includes('d2-narodovolets') ? [Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2, p = dw(-32.9 + Math.cos(a) * 3.2, -4.8 + Math.sin(a) * 3.2); return p; })] : []),
];
// no generated landing stage, boat or pontoon at the five berths in front of the terminal and at the quay corner of the D-2 (the hull stands on land, the bow is 6 m from the Gavan quay)
export const KEEP_OUT = [
  { id: 'berths', c: [-6510.4, 776.1], ax: [0.8733, 0.4872], hl: 125, hw: 30 },
  ...(ON.includes('d2-narodovolets') ? [{ id: 'd2-bow', c: [-6638, -44], r: 22 }] : []),
];
