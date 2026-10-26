// Provenance: copied verbatim from 102_3d_piter commit 0568f7af (src/world/bridges/sites-vo.js) for Admiralty-Haymarket (docs/AREAS.md 15.2); this line is the only change.
// bridges/sites-vo.js - PURE DATA (no imports, runs in node and in the page): the bridges of Vasilievsky Island (docs/research/vo-roster-bridges.md section 2, docs/research/vo-bridges-wave1.md).
//   BLAG        the Blagoveshchensky Bridge (1850, 1938, 2007) over the Bolshaya Neva, bank to bank, a hand-built spec for bridges/blag.js (NOT a generic site: 334.7 m, ten openings, a bascule in
//               mid-river).  Frame: origin = the deck centre at the abutment of the left (Admiralty) bank, +u toward Vasilievsky Island (bearing 334.3), +v to the right of travel (east, upstream).
//   BLAG_ZONE   a record of SITES with the id the environment already knows (river.js SITE_OF 'blagoveshchensky'): it makes the quay of the south landing open exactly over the deck (the old
//               BRIDGE_ZONES row stood 8.4 m off the axis), kind 'zone' = no geometry of its own (bridges.js skips it, streets/decks.js only reads kind 'road').
//   VO_SITES    the Smolenka bridges drawn by the generic machinery of arch.js: Uralsky (style `uralsky`) and Smolensky (`smolensky`), merged into SITES by sites.js.
//   blagDeckY(x, z)  the deck height of the Blagoveshchensky Bridge under a world point or null (pure data: streets / people / props may import it to stand masts and furniture on the humped deck).
// Sources: docs/research/vo-roster-bridges.md 2.1 / 2.2 (OSM ways w117802271 / w117802278 / w352605114 / w352605119, deck relation r3284878, [W-ru] span scheme 37.6 + 41.3 + 47.1 | 25.56 + 25.56 |
// 47.1 + 41.3 + 37.6 | 5.91 | 25.7 = 334.7 m), photos refs/bridges b01 .. b14 (see docs/research/vo-bridges-wave1.md).  Estimates [E]: girder depths, crown, pier widths, pavilion sizes.

/** monotone cubic (Fritsch-Carlson) through keys [[u, y] ...] -> y(u) (flat outside): the same maths as bridges/long.js profile() without the import */
export function profileOf(keys) {
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

// The [W-ru] span scheme (abutment 0 | 37.6 | 78.9 | 126.0 | 177.1 | 224.2 | 265.5 | 303.1 | 309.0 | 334.7) is laid on the real banks as follows.  MEASURED on the OSM deck polygon r3284878 (its balcony circles):
// the two bascule piers stand at u 126.35 and 177.5 on the axis of this frame, 51.15 m apart = the 51.12 m trunnion spacing of the scheme + 0.38 m: so the scheme holds from the south abutment to the second
// bascule pier with a shift of +0.38 m; from there to the north bank (OSM ways end at u 332.6, the water of the Neva polygon at 332.5) the 157.6 m of the scheme (177.1 .. 334.7) are squeezed to 155.1 m
// (x 0.984).  The OSM carriageways (332.6 m) are shorter than the scheme (334.7 m): the roster's "stretch" note.
const mapU = (u) => (u <= 177.1 ? u + 0.38 : 177.48 + (u - 177.1) * (332.6 - 177.48) / (334.7 - 177.1)), r2 = (x) => +x.toFixed(2);
const S1 = (a) => a.map((x) => r2(mapU(x))), S2 = (a) => a.map(([u, y]) => [r2(mapU(u)), y]);
export const BLAG = {
  id: 'blagoveshchensky', name: 'Благовещенский мост', nameEn: 'Blagoveshchensky Bridge', ww: 'neva',
  cx: -3376.35, cz: -112.95, b: 334.3, len: 332.6, scheme: 334.7, scheme2osm: 'mapU: +0.38 m up to the second bascule pier, x 0.984 beyond',
  hw: 18.7, road: 15.7, kerbW: 0.3, kerbH: 0.45, median: 0.7,           // 2 x 15.0 m roadway + a 1.4 m dividing strip + two 3 m pavements = 37.4 m rail to rail [W-ru]
  // deck profile: street level at the abutments, +3.4 over the bascule (the real approaches rise 2.0 - 3 m [E]; our streets are flat; the bascule soffit then stands 5.2 m over the water like the 5.3 / 5.7 boards of the photos)
  deck: S2([[-6, 0.05], [0, 0.05], [37.6, 0.6], [78.9, 1.7], [126.0, 3.05], [151.5, 3.4], [177.1, 3.05], [224.2, 2.0], [265.5, 1.05], [303.1, 0.45], [334.7, 0.05], [341, 0.05]]),
  // the support lines (u of the pier centres / trunnions): abutment, 37.6, 78.9, 126.0 | bascule 51.12 | 177.1, 224.2, 265.5, 303.1, the old thick pier block to 309.0, the 25.7 m end span to the abutment
  sup: [0, ...S1([37.6, 78.9]), 126.35, 177.5, ...S1([224.2, 265.5, 303.1, 309.0, 334.7])],
  // spans between the support lines: kind, depth of the girder at the supports / at mid-span (fascia + lattice + rib) [E]
  spans: [
    // (review 2026-10-07: the haunches beside the bascule piers deepened 2.6 -> 3.3 m (the photos show about 3.5 m) where the deck stands high enough to keep 1.5 - 2.9 m over the water)
    { kind: 'haunch', dSup: 2.3, dMid: 1.05 }, { kind: 'haunch', dSup: 2.7, dMid: 1.05 }, { kind: 'haunch', dSup: 3.3, dMid: 1.1 },
    { kind: 'bascule', dSup: 1.8, dMid: 1.4 },
    { kind: 'haunch', dSup: 3.3, dMid: 1.1 }, { kind: 'haunch', dSup: 2.7, dMid: 1.05 }, { kind: 'haunch', dSup: 2.3, dMid: 1.05 },
    { kind: 'block' },
    { kind: 'end', dSup: 1.5, dMid: 1.3 },
  ],
  // pier bodies on the axis [u0, u1, kind]: round-nosed granite piers; the two bascule piers (counterweight pits behind the trunnions) are round towers with the pavilions
  piers: [[35.0, 40.2, 'slim'], [76.3, 81.5, 'slim'], [121.5, 131.2, 'tower'], [172.8, 182.2, 'tower'], [221.6, 226.8, 'slim'], [262.9, 268.1, 'slim'], [300.2, 309.0, 'block']].map(([a, b, k]) => (k === 'tower' ? [a, b, k] : [r2(mapU(a)), r2(mapU(b)), k])),
  pavilions: [{ u: 126.35, sg: 1 }, { u: 177.5, sg: 1 }],       // the two glazed control pavilions of the heritage list on the big round upstream (east) balconies of the bascule piers [OSM deck polygon: balcony circles of radius 4.9 centred at u 126.4 / 177.5, v 22.0]
  // 11 historic lamp standards per side (22 in all [W-ru]): at the pier tumbas and between
  lamps: S1([3, 37.6, 78.9, 119.5, 133.5, 169.5, 184.0, 224.2, 265.5, 304.6, 330.5]),
  boards: [{ u: 133.4, txt: '5.7', sg: -1 }, { u: 170.4, txt: '5.3', sg: -1 }, { u: 133.4, txt: '5.7', sg: 1 }, { u: 170.4, txt: '5.3', sg: 1 }],     // the clearance boards on the fascia of the bascule leaves beside the piers (photo b12)
  osm: ['r3284878', 'w117802271', 'w117802278', 'w352605114', 'w352605119'],
};
const _blagY = profileOf(BLAG.deck);
const _bT = (BLAG.b - 90) * Math.PI / 180, _bc = Math.cos(_bT), _bs = Math.sin(_bT);
/** deck height of the Blagoveshchensky Bridge at u along the axis */
export const blagY = (u) => _blagY(Math.max(0, Math.min(BLAG.len, u)));
/** the deck height of the Blagoveshchensky Bridge under the world point (x, z) (the deck rectangle |v| <= hw + 0.3, u from -1.2 to len + 1.2), or null */
export function blagDeckY(x, z) {
  const dx = x - BLAG.cx, dz = z - BLAG.cz, u = dx * _bc + dz * _bs, v = -dx * _bs + dz * _bc;
  return Math.abs(v) <= BLAG.hw + 0.3 && u >= -1.2 && u <= BLAG.len + 1.2 ? blagY(u) : null;
}

const HV = BLAG.hw + 0.35;
/** the zone record (see the header): frame of the bridge, the deck faces as v0 / v1 (river.js opens the quay for |u| <= 30 round the origin), the pavement bands for people / nav */
export const BLAG_ZONE = { id: 'blagoveshchensky', name: BLAG.name, nameEn: BLAG.nameEn, kind: 'zone', style: 'zone', water: 'r1114249', ww: 'neva', cx: BLAG.cx, cz: BLAG.cz, b: BLAG.b, v0: -HV, v1: HV,
  zones: [[-HV, -16.0, 'pave'], [-16.0, 16.0, 'asphalt'], [16.0, HV, 'pave']], hump: 0.05, soffitCrown: -1, spring: 0.5, at: [-3448, -263], long: true };

/** the Smolenka bridges built by the generic arch machinery (arch.js + styles4.js): `bank` is read from the Smolenka polygon (WATER r1576084) per v; the frame = the OSM deck polygon centroid and the road bearing */
export const VO_SITES = [
  // Уральский мост (1973-74, E. A. Boltunova / L. A. Noskov): RC three-hinged frame, 24.6 x 31.0 m (roadway 21 + 2 x 5), pink granite faces, four pale granite obelisks on tumbas with gilded sailing ships, black railing
  { id: 'uralsky', name: 'Уральский мост', nameEn: 'Uralsky Bridge', kind: 'road', style: 'uralsky', look: 'ural', water: 'r1576084', ww: 'smolenka',
    cx: -4626.9, cz: -1826.9, b: 144.3, v0: -15.5, v1: 15.5,
    zones: [[-15.5, -10.5, 'pave'], [-10.5, 10.5, 'asphalt'], [10.5, 15.5, 'pave']], hump: 0.18, soffitCrown: -0.35, spring: 0.45, at: [-4627, -1827] },
  // Смоленский мост (1959-61, A. D. Gutsait / L. A. Noskov): RC arch R 19.28 (span 19.2), 31.1 x 28.25 m, granite faces, four art-cast torcheres with arrow-bracket lanterns
  { id: 'smolensky', name: 'Смоленский мост', nameEn: 'Smolensky Bridge', kind: 'road', style: 'smolensky', look: 'smol', stone: true, water: 'r1576084', ww: 'smolenka',
    cx: -5286.9, cz: -1645.8, b: 149.5, v0: -14.1, v1: 14.1,
    zones: [[-14.1, -10.1, 'pave'], [-10.1, 10.1, 'asphalt'], [10.1, 14.1, 'pave']], hump: 0.22, soffitCrown: -0.3, spring: 0.4, at: [-5287, -1646] },
];
