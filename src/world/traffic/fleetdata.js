// traffic/fleetdata.js - the Saint Petersburg fleet as DATA (no three.js): archetype dimensions, colour palettes and frequencies, plate generator, route list.
// Source: docs/research/transport.md (vehicle catalogue: Autostat fleet / colour statistics, 91 photos in SP/refs/transport).
// Dimensions are L x W x H in metres without mirrors. `front` / `rear` are the extents of the body along the model Z axis (origin = ground point midway between the
// axles, +Z forward), so the front overhang beyond the front axle is front - wb/2 (the simulation steers a bicycle model on the lane polyline from these) and len = front - rear.
// `w` = share of the non-public traffic stream (docs/research/transport.md "Freq %"); `bus` marks the public vehicles (route board, stop dwell).
// All cars are left-hand drive (the Yakutsk right-hand-drive imports do not exist here); cars are rain-washed, no dust (only a darker sill, fleet.js).
export const ARCH = {
  // ---- private cars (transport.md catalogue numbers 1-11)
  sedan:   { name: 'compact sedan (Solaris / Rio / Polo / Rapid / Logan)',          len: 4.40, wid: 1.74, hgt: 1.47, wb: 2.60, front: 2.12, rear: -2.28, w: 9 },
  lada:    { name: 'Lada Granta / Vesta sedan',                                     len: 4.41, wid: 1.76, hgt: 1.50, wb: 2.64, front: 2.18, rear: -2.23, w: 8.2 },
  ladasw:  { name: 'Lada Largus / Vesta SW / Niva Travel',                          len: 4.47, wid: 1.76, hgt: 1.68, wb: 2.70, front: 2.18, rear: -2.29, w: 3 },
  cross_c: { name: 'compact Chinese crossover (Haval Jolion / Tiggo 7 / Coolray)',  len: 4.50, wid: 1.84, hgt: 1.64, wb: 2.67, front: 2.22, rear: -2.28, w: 14 },
  cross_s: { name: 'small crossover (Creta / Duster / Seltos / Kamiq)',             len: 4.33, wid: 1.80, hgt: 1.63, wb: 2.60, front: 2.14, rear: -2.19, w: 7 },
  cross_m: { name: 'mid crossover (Sportage / Tucson / RAV4 / Tiguan / Tiggo 8)',   len: 4.65, wid: 1.86, hgt: 1.69, wb: 2.74, front: 2.30, rear: -2.35, w: 13 },
  suv:     { name: 'large SUV / premium (Prado / LC 300 / X5 / GLE / RX)',          len: 4.92, wid: 1.95, hgt: 1.85, wb: 2.85, front: 2.45, rear: -2.47, w: 5 },
  liftback:{ name: 'mid sedan / liftback (Octavia / Camry / K5 / Elantra / Jetta)', len: 4.70, wid: 1.83, hgt: 1.46, wb: 2.78, front: 2.36, rear: -2.34, w: 6 },
  prem:    { name: 'premium sedan (BMW 3 / 5, Mercedes C / E, Audi A4 / A6)',       len: 4.85, wid: 1.87, hgt: 1.45, wb: 2.90, front: 2.42, rear: -2.43, w: 2 },
  hatch:   { name: 'city hatch (Rio X / Fabia / Sandero / Mini)',                   len: 3.95, wid: 1.72, hgt: 1.48, wb: 2.50, front: 1.96, rear: -1.99, w: 3 },
  mpv:     { name: 'MPV / tourist van (V-Class / Multivan / Staria / Carnival)',    len: 5.15, wid: 1.93, hgt: 1.90, wb: 3.10, front: 2.55, rear: -2.60, w: 3 },
  // ---- vans and trucks (13, 14, 22; the police van and the ambulance are livery variants of `van`)
  van:     { name: 'delivery van (GAZelle Next / Transit / Boxer / Sprinter)',      len: 5.60, wid: 2.05, hgt: 2.35, wb: 3.30, front: 2.72, rear: -2.88, w: 5 },
  truck:   { name: 'light box truck (GAZon Next / Isuzu / Mighty)',                 len: 6.90, wid: 2.30, hgt: 3.10, wb: 3.90, front: 2.85, rear: -4.05, w: 2 },
  minibus: { name: 'minibus (GAZelle City / Sprinter / Volgabus-4298)',             len: 6.60, wid: 2.10, hgt: 2.75, wb: 3.60, front: 3.05, rear: -3.55, w: 1.5 },
  // ---- public transport (PT1-PT3, TB1-TB2, 20, 21)
  bus:     { name: 'city bus 12 m (Volgabus-5270 / LiAZ-5292), turquoise',          len: 12.0, wid: 2.55, hgt: 3.15, wb: 5.90, front: 5.70, rear: -6.30, bus: true },
  midi:    { name: 'midi bus 9.5 m (MAZ-206 / LiAZ-4292), turquoise',               len: 9.50, wid: 2.50, hgt: 3.05, wb: 4.60, front: 4.60, rear: -4.90, bus: true },
  artic:   { name: 'articulated bus 18 m (Volgabus CityRhythm-18 / MAZ-216)',       len: 18.0, wid: 2.55, hgt: 3.15, wb: 5.80, front: 5.55, rear: -12.45, bus: true, parts: ['artic_f', 'artic_r'] },
  trolley: { name: 'trolleybus, azure with white chevrons (PKTS-6281 / VMZ-5298)',  len: 12.0, wid: 2.55, hgt: 3.40, wb: 5.90, front: 5.70, rear: -6.30, bus: true, trolley: true },
  trolley2:{ name: 'trolleybus, white with a blue lower band (BKM-321)',            len: 12.0, wid: 2.55, hgt: 3.40, wb: 5.90, front: 5.70, rear: -6.30, bus: true, trolley: true },
  dd:      { name: 'sightseeing double-decker "Сити Тур"',                          len: 12.0, wid: 2.55, hgt: 4.10, wb: 6.00, front: 5.80, rear: -6.20, bus: true, tour: true },
  coach:   { name: 'tourist coach 12 m (Yutong / Higer / Neoplan)',                 len: 12.2, wid: 2.55, hgt: 3.70, wb: 6.10, front: 5.90, rear: -6.30, bus: true, tour: true },
  // ---- tram (TR): one four-axle car on two bogies (wb = the distance between the bogie pivots); it runs on the rails of streets.tram, never on the lane graph (traffic/trams.js)
  tram:    { name: 'tram, one section 15.4 m (LM-99 / LVS-97 class), red with a cream top', len: 15.4, wid: 2.50, hgt: 3.30, wb: 7.50, front: 7.70, rear: -7.70, bus: true, tram: true },
};
// the two bodies of an articulated bus are models of their own (fleet.js draws both from one vehicle; origin = midpoint of the two axles of the section)
export const PART_ARCH = {
  artic_f: { len: 9.2, wid: 2.55, hgt: 3.15, wb: 5.80, front: 5.55, rear: -3.20, bus: true, part: true },
  artic_r: { len: 8.8, wid: 2.55, hgt: 3.15, wb: 6.30, front: 2.70, rear: -5.65, bus: true, part: true },
};
export const ARTIC = { hinge: 9.2, rearAxle: 15.5, frontAxle: 2.65, midAxle: 8.45 };   // distances behind the front bumper along the path
export const CAR_KINDS = Object.keys(ARCH).filter((k) => !ARCH[k].bus);
export const BUS_KINDS = Object.keys(ARCH).filter(k=>ARCH[k].bus&&!ARCH[k].tram);
export const DRIVABLE_KINDS = [...CAR_KINDS,...BUS_KINDS];
export const ARTIC_REAR_OFFSET = ARCH.artic.front-(ARTIC.hinge+ARTIC.rearAxle)/2;
/** Passenger-door centre in the native +Z-forward frame. */
export const busDoorZ = kind=>({midi:3.55,coach:4.3,dd:4.1}[kind]??4);
export const MODEL_KINDS = [...Object.keys(ARCH).filter((k) => !ARCH[k].parts), ...Object.keys(PART_ARCH)];
export const archOf = (k) => ARCH[k] || PART_ARCH[k];

// shared hex values (research table "Palette"); white #eceae4, silver #b9bcbf, grey #4a4d52 / #5a5e63, black #1d1f23
const W = '#eceae4', S = '#b9bcbf', K = '#1d1f23', G = '#4f5358', RD = '#a52a2b', BL = '#2c4a86', BR = '#6b5a4a', GR = '#2c4a3a';
export const PALETTE = {
  sedan:   [[W, 30], [S, 14], ['#4a4d52', 20], [K, 18], [RD, 6], [BL, 6], [BR, 3], [GR, 3]],
  lada:    [[W, 34], [S, 14], ['#55595e', 18], [K, 10], ['#c9622a', 6], [RD, 6], ['#2f5ba8', 7], ['#8aae2c', 5]],
  ladasw:  [[W, 34], [S, 20], [G, 20], ['#3b4a35', 14], [K, 12]],
  cross_c: [[W, 28], [K, 22], ['#5a5e63', 20], [S, 8], ['#2f5f6c', 6], ['#9a2630', 6], ['#b7a58a', 4], ['#2d6fb5', 6]],
  cross_s: [[W, 30], [G, 22], [K, 16], ['#cf6a22', 8], [RD, 8], [BL, 8], [S, 8]],
  cross_m: [[W, 27], [K, 26], [G, 22], [S, 8], ['#243e63', 6], ['#6a2a30', 4], ['#31453a', 4], ['#7a6a58', 3]],
  suv:     [['#17191c', 40], [W, 24], [G, 16], [S, 10], ['#243e63', 6], [BR, 4]],
  liftback:[[W, 30], [K, 22], [G, 22], [S, 12], [BL, 6], [RD, 4], ['#6a2a30', 4]],
  prem:    [[K, 38], [W, 20], [G, 24], [S, 10], ['#243e63', 8]],
  hatch:   [[W, 22], [RD, 14], [BL, 12], ['#cf6a22', 10], [S, 14], [K, 14], ['#d9b92f', 6], ['#2f7d4a', 8]],
  mpv:     [[K, 40], [W, 30], [S, 20], ['#243e63', 10]],
  van:     [[W, 60], ['#c82a28', 10], ['#31475f', 10], [S, 10], ['#2f6a3d', 10]],
  truck:   [[W, 50], ['#2c4f94', 20], [S, 10], ['#cf6a22', 10], ['#2f6a3d', 10]],
  minibus: [[W, 55], ['#5fc4b8', 25], [S, 20]],
  bus:     [['#5fc4b8', 1]],
  midi:    [['#5fc4b8', 1]],
  artic:   [['#5fc4b8', 1]],
  trolley: [['#1f7fd6', 1]],
  trolley2:[['#2a74c8', 1]],
  dd:      [['#d8352a', 1]],
  coach:   [['#f1f1ee', 70], ['#2a6fd0', 20], ['#c9ced3', 10]],
  tram:    [['#b52a2a', 1]],
};
export const KINDS_W = CAR_KINDS.map((k) => [k, ARCH[k].w]);
/** kinds that may be taxis (white + yellow stripe + roof lamp): 12 % of the moving cars on Nevsky */
export const TAXI_KINDS = ['sedan', 'liftback', 'cross_c', 'hatch', 'cross_m', 'lada'];
export const TAXI_WHITE = '#f2f1ec';

/** weighted pick from [[value, weight], ...] with a seeded rng() */
export function pickW(list, r) {
  let tot = 0; for (const e of list) tot += e[1];
  let x = r() * tot;
  for (const e of list) { x -= e[1]; if (x <= 0) return e[0]; }
  return list[list.length - 1][0];
}

// plates: white 520 x 112 plates `А123ВС 178 RUS` (invented numbers). Letters from the permitted set А В Е К М Н О Р С Т У Х. Local regions 78 / 178 / 98 / 198 (60 %), 47, Moscow, others.
export const PLATE_LETTERS = 'АВЕКМНОРСТУХ';
export const PLATES_COUNT = 36;
const REGIONS = [['78', 24], ['178', 24], ['98', 6], ['198', 6], ['47', 6], ['77', 3], ['97', 2], ['177', 3], ['777', 2], ['50', 4], ['10', 3], ['60', 3], ['35', 3], ['69', 3], ['11', 2], ['53', 2], ['29', 2], ['61', 2]];
export function makePlateText(r) {
  const L = () => PLATE_LETTERS[Math.floor(r() * PLATE_LETTERS.length)];
  const d = () => Math.floor(r() * 10);
  return { main: `${L()}${d()}${d()}${d()}${L()}${L()}`, region: pickW(REGIONS, r) };
}

// LED route boards (amber on black): trolleybus routes of Nevsky (1, 5, 7, 10, 11, 16, 22, 42 on Ligovsky) and bus routes (3, 7, 24, 27, 54, 65, 181, 191, 15); termini of the photographed
// headsigns (`1 Ул. Маршала Тухачевского`, `5 Конногвардейский бульвар`, `11 Смольный`, `7 Площадь Восстания`) + metro-station names for the rest.
// West (docs/research/west-life-furniture.md 3.1, OSM relations of the stops of streets.busStops): trolleybuses 1 5 7 10 11 22 (Nevsky), 17 (Kazan Cathedral loop), 3 8 12 15 28 (Five Corners / Liteyny area);
// buses 2 3 7 10 22 24 27 191 49 181 ... The headsign is one terminus per route (the real boards alternate with the direction).
export const ROUTES = [
  { n: '1', t: 'Ул. Маршала Тухачевского', trolley: true }, { n: '5', t: 'Конногвардейский бульвар', trolley: true }, { n: '7', t: 'Площадь Александра Невского', trolley: true },
  { n: '10', t: 'Морская набережная', trolley: true }, { n: '11', t: 'Смольный', trolley: true }, { n: '16', t: 'Улица Блохина', trolley: true }, { n: '22', t: 'Хасанская улица', trolley: true },
  { n: '42', t: 'Сортировочная', trolley: true }, { n: '17', t: 'Казанский собор', trolley: true }, { n: '3', t: 'Пять углов', trolley: true }, { n: '8', t: 'Пять углов', trolley: true },
  { n: '12', t: 'Пять углов', trolley: true }, { n: '15', t: 'Пять углов', trolley: true }, { n: '28', t: 'Университет', trolley: true },
  { n: '7', t: 'Площадь Восстания' }, { n: '24', t: 'Станция метро «Василеостровская»' }, { n: '27', t: 'Ленская улица' }, { n: '54', t: 'Площадь Восстания' },
  { n: '65', t: 'Станция метро «Невский проспект»' }, { n: '181', t: 'Станция метро «Лиговский проспект»' }, { n: '191', t: 'Товарищеский проспект' }, { n: '3', t: 'Проспект Римского-Корсакова' },
  { n: '2', t: 'Лигово' }, { n: '10', t: 'Крестовский остров' }, { n: '15', t: 'Улица Жуковского' }, { n: '22', t: 'Двинская улица' }, { n: '26', t: 'Московский вокзал' },
  { n: '46', t: 'Летний сад' }, { n: '49', t: 'Улица Ломоносова' }, { n: '70', t: 'Канонерский остров' }, { n: '71', t: 'Канонерский остров' }, { n: '74', t: 'БКЗ «Октябрьский»' },
  { n: '76', t: 'БКЗ «Октябрьский»' }, { n: '105', t: 'Ковенский переулок' }, { n: '141', t: 'Московский вокзал' }, { n: '225', t: 'Пять углов' }, { n: '290', t: 'Владимирская площадь' },
  // trams of the strip (2026: 3 площадь Репина - площадь Ленина over Gostiny Dvor and the Italyanskaya; 43 and 49 on ulitsa Marata / Ligovsky pr., OSM TRAM_ROUTES: 43 ulitsa Marata - Tramvainy park 1,
  // 49 ulitsa Marata - ulitsa Yuriya Gagarina): the two boards of a route are its two termini (a = towards the first terminus of traffic/trams.js TRAM_LINES, b = the other way). The Marata line runs
  // southbound only (see TRAM_LINES), so only the b boards are drawn; the a rows keep the index layout
  { n: '3', t: 'Площадь Ленина', tram: true, way: 'a' }, { n: '3', t: 'Площадь Репина', tram: true, way: 'b' },
  { n: '43', t: 'Улица Марата', tram: true, way: 'a' }, { n: '43', t: 'Трамвайный парк № 1', tram: true, way: 'b' },
  { n: '49', t: 'Улица Марата', tram: true, way: 'a' }, { n: '49', t: 'Улица Юрия Гагарина', tram: true, way: 'b' },
  // Vasilievsky Island (2026-10-09; docs/research/vo-roster-metro.md 3.3 / 3.4, OSM route relations of the 2026 mapper state [L]): APPENDED, so every older index stays; the termini are the ones
  // the dossier names (the loops 41 42 151 152 168 220 show the western terminus ulitsa Korablestroiteley); the random route picks of the older districts draw from LEGACY_ROUTES only
  { n: '9', t: 'Морская набережная', trolley: true, isl: true }, { n: '12', t: 'Смольный', trolley: true, isl: true },       // (12 since 30 Oct 2023: Korablestroiteley - Smolny; this entry wins ROUTE_BY_REF over the old board)
  { n: '1', t: 'Новосибирская улица', isl: true }, { n: '6', t: 'Станция метро «Нарвская»', isl: true }, { n: '41', t: 'Улица Кораблестроителей', isl: true }, { n: '42', t: 'Улица Кораблестроителей', isl: true },
  { n: '100', t: 'Балтийский вокзал', isl: true }, { n: '128', t: 'Аптекарская набережная', isl: true }, { n: '151', t: 'Улица Кораблестроителей', isl: true }, { n: '152', t: 'Улица Кораблестроителей', isl: true },
  { n: '158', t: 'Морской вокзал', isl: true }, { n: '168', t: 'Улица Кораблестроителей', isl: true }, { n: '220', t: 'Улица Кораблестроителей', isl: true }, { n: '230', t: 'Пискарёвка', isl: true },
  { n: '249', t: 'Ручьи', isl: true }, { n: '261', t: 'Морская набережная', isl: true }, { n: '262', t: 'Улица Константина Заслонова', isl: true }, { n: '275', t: 'Станция метро «Василеостровская»', isl: true },
];
/** index of the first Vasilievsky Island board: the vehicles of the older districts pick their (random) route among the entries before it only */
export const LEGACY_ROUTES = ROUTES.findIndex((r) => r.isl);
export const TROLLEY_ROUTES = ROUTES.map((r, i) => (r.trolley && i < LEGACY_ROUTES ? i : -1)).filter((i) => i >= 0);
export const BUS_ROUTES = ROUTES.map((r, i) => (r.trolley || r.tram || i >= LEGACY_ROUTES ? -1 : i)).filter((i) => i >= 0);
/** route index by kind + reference ('T5' = trolleybus 5, 'A24' = bus 24, 'R3a' / 'R3b' = tram 3 towards its first / second terminus) */
export const ROUTE_BY_REF = new Map(ROUTES.map((r, i) => [(r.tram ? 'R' : r.trolley ? 'T' : 'A') + r.n + (r.way || ''), i]));
