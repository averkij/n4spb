// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/bridges/sites-vo2.js) for Vasilyevsky-Okrug 7 (docs/vo-br.md); the lines marked 'n4spb' are the world-rule adaptations (docs/AREAS.md 13.7), the rest is verbatim.
// bridges/sites-vo2.js - PURE DATA (no imports, runs in node and in the page): the SECOND PASS of the bridges of Vasilievsky Island (docs/research/vo-bridges-wave2.md, docs/research/vo-roster-bridges.md 2.2):
//   VO2_SITES   the remaining Smolenka bridges drawn by the generic arch machinery (arch.js + styles5.js), merged into SITES by sites.js:
//               Nalichny (1973-75, RC frame, 70.9 x 40 m, 6 lanes + 2 tram tracks, four granite obelisks) and Korablestroiteley (1981-82, 70.8 x 39 m, 6 lanes, granite pedestals with lamp poles),
//               the four bridges over the arms of the Smolenka mouth (1986-90, RC frame-cantilever with a curved soffit and a sheet fascia, granite abutments and parapets)
//   FOOT        the Novo-Andreevsky footbridge (2009, steel plate girders with a curved lower chord, 34.8 x 3.3 m) as a hand-built spec for bridges/foot3.js
//   WHSD        the far scenery of the Western High-Speed Diameter (viaduct decks over the Gulf edge, tunnel portals, the open cutting, the Korabelny cable-stayed bridge pylons) for bridges/whsd.js
//   deckY2(x, z)  the deck height under a world point of one of the sites above (flat street level plus the hump), or null: pure data for streets / people / props (the same maths as arch.js yDeck)
// FRAME of a site (as sites.js): origin = the middle of the OSM deck polygon, +u along the road (compass bearing b), +v to the right of travel, v0 / v1 = the two faces of the bridge, `bank` = the water
// interval along u (measured on the baked Smolenka polygons r1576084 / r1576086, the two pieces join at the Korablestroiteley bridge).  Heights: street level y 0, water -3.4 (WATER_Y smolenka).
// Cross sections (zones = [v from, v to, kind]) are the OSM carriageways / tram tracks / footways laid in the frame of each bridge (offsets measured, docs/research/vo-bridges-wave2.md section 1).
// New zone kinds of arch.js: 'tram' (the flush slab of the tram corridor), 'barrier' (the high granite parapet between the roadway and the pavement, +0.45 m), 'verge' (granite slabs, flush).
// Sources: ru.wikipedia Наличный мост / Мост Кораблестроителей / Смоленские мосты / Ново-Андреевский мост, OSM (r5574920, r5574927, w386219560, w452791087, w452791047, w300952664, w300952668),
// photos refs/bridges2 n01 .. n07 k01 .. k04 f01 f02 m01 .. m09 (see the dossier).  [E] = estimate, [?] = not verified.

const deg = Math.PI / 180;
/** the 8 OSM way ids of Nalichny: carriageways w374756503 / w374756505, side lanes w374756494 / w374756501, footways w374756496 / w374756497, tram tracks w1079781304 / w1079781308, deck r5574920 */
export const VO2_OSM = {
  nalichny: ['r5574920', 'w374756503', 'w374756505', 'w374756494', 'w374756501', 'w374756496', 'w374756497', 'w1079781304', 'w1079781308'],
  korablestroiteley: ['r5574927', 'w374757408', 'w374757414', 'w374757413', 'w374757402'],
  foot: ['w386219560', 'w54858344'],
  smol1: ['w452791087', 'w350477983'], smol2: ['w452791047', 'w350477982'],
  smol3: ['w300952664', 'w1419130491', 'w1216234891', 'w1053534564'], smol4: ['w300952668', 'w362259166', 'w1286551406'],
};

export const VO2_SITES = [
  // Наличный мост (1973-75, E. A. Boltunova / S. I. Evdokimov / P. M. Kharitonov): RC frame with a sliding hinge, granite faces, 6 lanes + 2 tram tracks, high granite parapets between roadway and pavement, black
  // lattice railing ending in granite parapets, four massive granite-faced obelisks, wide granite stairs at the corners.  Deck polygon 70.9 x 40.3 m; water at the bridge u -20.3 .. 19.8.
  { id: 'nalichny', name: 'Наличный мост', nameEn: 'Nalichny Bridge', kind: 'road', style: 'nalichny', look: 'nalichny', stone: true, water: 'r1576084', ww: 'smolenka',
    cx: -6701.99, cz: -1708.10, b: 16.3, v0: -35.45, v1: 35.45, bank: [-20.3, 19.8],
    zones: [[-35.45, -26.1, 'walk'], [-26.1, -22.3, 'asphalt'], [-22.3, -19.5, 'verge'], [-19.5, -18.7, 'barrier'], [-18.7, -8.1, 'asphalt'], [-8.1, 6.9, 'tram'], [6.9, 17.5, 'asphalt'],
      [17.5, 18.3, 'barrier'], [18.3, 21.5, 'verge'], [21.5, 25.3, 'asphalt'], [25.3, 35.45, 'walk']],
    tracks: [-0.9, 3.2], hump: 0.3, soffitCrown: -1.15, spring: 1.1, at: [-6702, -1708], big: true },
  // мост Кораблестроителей (1981-82, L. N. Sobolev / B. E. Eduardov): the twin of Nalichny without trams: three-hinged RC frame with a curved soffit, granite-faced abutments, 6 lanes (2 x 10.6 m, a 8.7 m median),
  // wide pavements behind a high granite parapet, black railing like Nalichny, RC pedestals faced with granite that carry steel lamp poles, wide granite stairs at the four corners.  Deck 70.8 x 39.1 m.
  { id: 'korablestroiteley', name: 'мост Кораблестроителей', nameEn: 'Korablestroiteley Bridge', kind: 'road', style: 'korable', look: 'korable', stone: true, water: 'r1576084', ww: 'smolenka',
    cx: -7532.20, cz: -1948.00, b: 16.5, v0: -35.4, v1: 35.4, bank: [-19.6, 19.5],
    zones: [[-35.4, -27.0, 'walk'], [-27.0, -15.2, 'verge'], [-15.2, -14.3, 'barrier'], [-14.3, -3.7, 'asphalt'], [-3.7, 5.0, 'plaza'], [5.0, 15.6, 'asphalt'], [15.6, 16.5, 'barrier'], [16.5, 27.0, 'verge'], [27.0, 35.4, 'walk']],
    hump: 0.2, soffitCrown: -1.1, spring: 1.1, at: [-7532, -1948], big: true },
  // the four bridges over the arms of the Smolenka mouth (1986-87 / 1989-90, A. A. Sokolov / V. I. Eduardov): single-span RC frame-cantilever with a hinge at mid-span, the curved lower chord clad in sheet metal
  // (pale blue-grey, photos m08 m09), granite-faced abutments, granite parapet blocks, wide granite stairs down to the lower promenade.  The OSM deck polygons (not the Wikipedia numbering) give the extents:
  // '1st' / '2nd' 29 x 16 m, '3rd' / '4th' 30 x 51 m.  The roads of the unbuilt Morskaya embankment are not in the data: asphalt strip + slab pavements on the narrow pair, a granite plaza on the wide pair.
  { id: 'smol1', name: '1-й Смоленский мост', nameEn: '1st Smolensky Bridge', kind: 'road', style: 'mouth', look: 'mouth', water: 'r1576086', ww: 'smolenka',
    cx: -8059.55, cz: -2005.15, b: 15.7, v0: -8.2, v1: 8.2, bank: [-14.3, 14.85],
    zones: [[-8.2, -6.3, 'walk'], [-6.3, 6.3, 'asphalt'], [6.3, 8.2, 'walk']], hump: 0.12, soffitCrown: -0.85, spring: 0.9, at: [-8060, -2005], noMarks: true },
  { id: 'smol2', name: '2-й Смоленский мост', nameEn: '2nd Smolensky Bridge', kind: 'road', style: 'mouth', look: 'mouth', water: 'r1576086', ww: 'smolenka',
    cx: -8008.80, cz: -2182.36, b: 17.4, v0: -7.9, v1: 7.9, bank: [-14.5, 15.4],
    zones: [[-7.9, -6.1, 'walk'], [-6.1, 6.1, 'asphalt'], [6.1, 7.9, 'walk']], hump: 0.12, soffitCrown: -0.85, spring: 0.9, at: [-8009, -2182], noMarks: true },
  { id: 'smol3', name: '3-й Смоленский мост', nameEn: '3rd Smolensky Bridge', kind: 'road', style: 'mouth', look: 'mouth', water: 'r1576086', ww: 'smolenka',
    cx: -7955.64, cz: -1975.20, b: 16.3, v0: -25.7, v1: 25.7, bank: [-15.1, 15.5],
    zones: [[-25.7, -23.7, 'walk'], [-23.7, 23.7, 'plaza'], [23.7, 25.7, 'walk']], hump: 0.12, soffitCrown: -0.85, spring: 0.9, at: [-7956, -1975], noMarks: true, big: true },
  { id: 'smol4', name: '4-й Смоленский мост', nameEn: '4th Smolensky Bridge', kind: 'road', style: 'mouth', look: 'mouth', water: 'r1576086', ww: 'smolenka',
    cx: -7903.08, cz: -2151.47, b: 16.3, v0: -25.5, v1: 25.5, bank: [-15.3, 14.35],
    zones: [[-25.5, -23.5, 'walk'], [-23.5, 23.5, 'plaza'], [23.5, 25.5, 'walk']], hump: 0.12, soffitCrown: -0.85, spring: 0.9, at: [-7903, -2151], noMarks: true, big: true },
];

/** Novo-Andreevsky footbridge (Ново-Андреевский мост, 2009, Lenmostostroy / Mostotrest): welded steel plate girders with a curved lower chord (30 m span, 34.8 m long, 3.3 m wide), orthotropic deck, a simple
 *  forged railing, stairs at both ends, four steel torcheres with lanterns.  Frame: origin = the middle of the OSM deck polygon w386219560 (31.5 x 3.4 m), +u toward SSW (b 201.7), +v to the right. */
export const FOOT = { id: 'novo-andreevsky', name: 'Ново-Андреевский мост', nameEn: 'Novo-Andreevsky Bridge', ww: 'smolenka', cx: -6328.15, cz: -1604.65, b: 201.7, len: 34.8, hw: 1.65, bank: [-8.6, 12.1],
  crown: 1.25, osm: ['w386219560', 'w54858344'], at: [-6328, -1605] };

/**
 * WHSD (Западный скоростной диаметр, opened 2016) far scenery of bridges/whsd.js: the twin viaduct decks from the end of the open cutting over the land fill and the shore to the Korabelny cable-stayed bridge,
 * the portals of the Smolenka mouth tunnel, the grass banks of the open cutting.  The two carriageways run as separate decks (14.6 m, 4 lanes each): W = southbound (the right-hand side when heading to the Gulf),
 * E = northbound.  lines: [x, z] centre lines of the decks (z < 1020 = the OSM ways w688149996 + w119176958 and w688149995 + w373871040 exactly, beyond: the roster scheme 150 + 320 + 150 laid on the OSM
 * line, pylons about (-7850, 1275) and (-7883, 1594)); y: deck top over the street level by z (our streets are flat: the real viaduct rises from the at-grade section to the 35 m clearance of the Korabelny
 * fairway) [E].  Tunnel: w350477987 / w130068396 (layer -1), portals as listed; banks: OSM embankment ways w350477973 / w350477975 (the portal cutting), w303684563 / w303684565 (the long cutting).
 */
export const WHSD = {
  hw: 7.3, depth: 2.6, id: 'whsd',
  lines: {
    W: [[-7867, -300], [-7860, -238], [-7855, -175], [-7848, -67], [-7838, 93], [-7835, 157], [-7828, 295], [-7822, 450], [-7815, 549], [-7809, 718], [-7810, 802], [-7814, 905], [-7823, 1020], [-7839, 1126], [-7861, 1275], [-7894, 1594], [-7908, 1745], [-7916, 1900], [-7918, 2100], [-7916, 2400], [-7912, 2600]],
    E: [[-7844, -302], [-7833, -186], [-7817, 88], [-7814, 155], [-7812, 209], [-7807, 292], [-7802, 385], [-7789, 633], [-7787, 717], [-7787, 804], [-7793, 908], [-7804, 1020], [-7822, 1126], [-7839, 1275], [-7872, 1594], [-7886, 1745], [-7894, 1900], [-7896, 2100], [-7894, 2400], [-7890, 2600]],
  },
  y: [[-310, 0.0], [-60, 3.0], [157, 6.8], [440, 11.5], [800, 20], [1126, 28], [1275, 33], [1594, 34.5], [1745, 33.5], [1900, 30], [2200, 22], [2600, 12]],
  // the AT-GRADE stretch (second pass, review): the OSM motorway ways between the tunnel portals and the first viaduct station chained north -> south (W: w1257246774 + 73 + 69 + 68 + w130068395 + w165035750; E: w1257246771 + 72 +
  // 66 + 67 reversed + w130062822 reversed + w222395960 reversed; 14.6 m, 4 lanes each, 1.77 km), laid flush on the street level (y 0.025: the red car's groundAt is 0.03).  gap = z range where the street deck of the
  // Mikhmanskaya overpass (streets draws it at y 0; OSM decks w1257246775 / w1257246770, z -1646 .. -1605) crosses the corridor: nothing is drawn there (two asphalts at 2 cm flicker).
  // decks: the oriented rectangles (principal axes of the OSM polygons) of the two park footbridge decks w1428211376 (75 x 15 m) / w1428213485 (72 x 15 m) that cross the corridor in the real cutting: under them the
  // motorway is not drawn (our street level is flat: the crossing is at ground level; environment-vo-seal --decks must cross both decks over the whole width): c = centre, dir = unit vector of the long axis, t / w = extent along / across
  ground: {
    y: 0.025, gap: [-1652, -1601],
    decks: [{ c: [-7904.2, -515.8], dir: [0.913, -0.408], t: [-44.6, 29.8], w: [-7.4, 7.5] }, { c: [-7970.5, -648.9], dir: [0.912, -0.411], t: [-36.1, 36.1], w: [-7.4, 7.4] },
      // (review of bridges-3) the third footbridge over the cutting: OSM footway w345740719 (bridge, layer 1, 2.4 m wide, (-8098.7, -1021.6) -> (-8169, -988.1), 77.9 m) crosses both carriageways at z about -1005; the grass
      // embankments of cutting.js walled it off (the walker stopped at the foot of the east bank).  The rectangle is the way grown to 4 m wide: the carriageways are not drawn under it, the embankments fade out round it.
      { c: [-8133.85, -1004.85], dir: [-0.9025, 0.4300], t: [-39.0, 39.0], w: [-2.0, 2.0], way: 'w345740719' }],
    W: [[-8157.9, -1980.5], [-8209.7, -1815.7], [-8243.7, -1669.4], [-8247.9, -1643.9], [-8253.1, -1610.2], [-8253.9, -1602.1], [-8255.0, -1590.9], [-8260.1, -1528.3], [-8262.3, -1460.1], [-8259.1, -1384.4], [-8252.1, -1326.4], [-8238.3, -1257.2], [-8222.9, -1189.4], [-8204.0, -1133.7], [-8125.7, -953.3], [-8025.1, -747.0], [-7974.2, -638.8], [-7925.2, -528.0], [-7889.6, -412.8], [-7880.3, -372.4], [-7871.7, -327.7], [-7866.9, -299.8]],
    E: [[-8136.1, -1972.8], [-8207.1, -1740.5], [-8223.9, -1665.6], [-8228.5, -1642.7], [-8232.6, -1613.7], [-8233.5, -1607.6], [-8234.1, -1603.3], [-8234.4, -1600.1], [-8235.6, -1589.1], [-8240.3, -1527.1], [-8239.1, -1458.9], [-8234.0, -1388.3], [-8226.2, -1330.7], [-8214.0, -1261.5], [-8197.6, -1195.0], [-8177.7, -1141.5], [-8103.2, -961.8], [-8006.2, -756.1], [-7903.9, -535.4], [-7878.7, -460.4], [-7855.9, -375.6], [-7846.4, -325.8], [-7843.5, -301.9]],
  },
  pylons: [[-7850, 1275], [-7883, 1594]], pylonH: 124, pylonLegV: 10.5,
  portals: { south: [[-8158, -1981], [-8136, -1973]], north: [[-8073, -2259], [-8052, -2254]], axis: 17 },
  banks: { portal: ['w350477973', 'w350477975'], cutting: ['w303684563', 'w303684565'] },
  osm: ['w688149995', 'w688149996', 'w119176958', 'w373871040'],
  ghosts: ['w1377364608', 'w1360562178', 'w1377364609', 'w1377367596', 'w172999967', 'w119176958', 'w373871040', 'w688149995', 'w688149996'],
};

// ---------------------------------------------------------------------------------------------------- deck height under a point (pure data: arch.js yDeck over the bank interval)
const F = VO2_SITES.map((s) => { const T = (s.b - 90) * deg; return { s, c: Math.cos(T), sn: Math.sin(T), uc: (s.bank[0] + s.bank[1]) / 2 }; });
const FT = (() => { const T = (FOOT.b - 90) * deg; return { c: Math.cos(T), sn: Math.sin(T) }; })();
const EXT = 0.8, Y0 = 0.05;
/** deck height of a VO2 bridge at (x, z) or null (the arch.js rule: Y0 + hump (1 - t^2), t = |u - uc| / half deck length) */
export function deckY2(x, z) {
  for (const { s, c, sn, uc } of F) {
    const dx = x - s.cx, dz = z - s.cz;
    if (Math.abs(dx) > 90 || Math.abs(dz) > 90) continue;
    const u = dx * c + dz * sn, v = -dx * sn + dz * c;
    const a = s.bank[0] - EXT, b = s.bank[1] + EXT, hw = (b - a) / 2;
    if (v < s.v0 - 0.01 || v > s.v1 + 0.01 || u < a || u > b) continue;
    const t = Math.min(1, Math.abs(u - uc) / hw);
    return Y0 + s.hump * (1 - t * t);
  }
  const dx = x - FOOT.cx, dz = z - FOOT.cz;
  if (Math.abs(dx) < 40 && Math.abs(dz) < 40) {
    const u = dx * FT.c + dz * FT.sn, v = -dx * FT.sn + dz * FT.c;
    if (Math.abs(v) <= FOOT.hw + 0.05 && Math.abs(u) <= FOOT.len / 2) return footY(u);
  }
  return whsdDeckY(x, z);
}
/** the deck height of the footbridge at u: street level at both ends, a smooth hump of FOOT.crown at the middle (u = 0) */
export function footY(u) { const t = Math.min(1, Math.abs(u) / (FOOT.len / 2)); return Y0 + FOOT.crown * (1 - t * t); }

// ---------------------------------------------------------------------------------------------------- the WHSD viaduct decks: height under a point (pure data, same maths for traffic / drive / the builder)
function monotone(keys) {                                     // Fritsch-Carlson monotone cubic through [[z, y]...] (flat outside), as sites-vo.js profileOf
  const x = keys.map((k) => k[0]), y = keys.map((k) => k[1]), d = [], m = [], n = x.length;
  for (let i = 0; i + 1 < n; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  for (let i = 0; i < n; i++) m.push(i === 0 ? d[0] : i === n - 1 ? d[i - 1] : d[i - 1] * d[i] <= 0 ? 0 : 2 / (1 / d[i - 1] + 1 / d[i]));
  return (u) => {
    if (u <= x[0]) return y[0]; if (u >= x[n - 1]) return y[n - 1];
    let i = 0; while (u > x[i + 1]) i++;
    const h = x[i + 1] - x[i], t = (u - x[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * y[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
export const whsdY = monotone(WHSD.y);
const WSEG = [];
for (const k of ['W', 'E']) { const p = WHSD.lines[k]; for (let i = 0; i + 1 < p.length; i++) { const dx = p[i + 1][0] - p[i][0], dz = p[i + 1][1] - p[i][1], l = Math.hypot(dx, dz); WSEG.push({ k, x0: p[i][0], z0: p[i][1], tx: dx / l, tz: dz / l, l }); } }
/** deck height of a WHSD viaduct carriageway under (x, z) or null (|lateral| <= 7.6 m of one of the two centre lines, from the first station (z -300) to the end of the drawn deck) */
export function whsdDeckY(x, z) {
  if (x < -7960 || x > -7760 || z < -305 || z > 2610) return null;
  for (const s of WSEG) {
    const dx = x - s.x0, dz = z - s.z0, t = dx * s.tx + dz * s.tz;
    if (t < -1.5 || t > s.l + 1.5) continue;                                  // (a wedge of 0.9 m beyond the outer side of a bend of the centre line belongs to the deck: the corner probes of the car)
    if (Math.abs(-dx * s.tz + dz * s.tx) <= WHSD.hw + 0.3) return whsdY(z);
  }
  return null;
}
