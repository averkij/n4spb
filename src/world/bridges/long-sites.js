// Pure long-bridge descriptors and profiles shared by bridge and street builders.
/** monotone cubic (Fritsch-Carlson) through keys [[u, y] ...] -> y(u) (flat outside) */
export function profile(keys) {
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
/** the usual hump: +0.05 at both bank lines, +crown at mid-bridge */
export const hump = (len, crown) => profile([[0, 0.05], [len * 0.1, 0.05 + crown * 0.3], [len * 0.28, 0.05 + crown * 0.8], [len / 2, 0.05 + crown], [len * 0.72, 0.05 + crown * 0.8], [len * 0.9, 0.05 + crown * 0.3], [len, 0.05]]);


// ---------------------------------------------------------------------------------------------------- the three bridges (pure data)
export const BIRZHEVOY = { id: 'birzhevoy', name: 'Биржевой мост', nameEn: 'Exchange (Birzhevoy) Bridge', cx: -2686.29, cz: -1425.70, b: 3.63, len: 238.7, hw: 13.65, road: 10.5, kerbW: 0.3, kerbH: 0.55, tightKerb: true, crown: 3.0,
  piers: [[35.6, 38.9, 'slim'], [83.1, 92.2, 'tower'], [145.0, 154.3, 'tower'], [197.4, 201.0, 'slim']], spans: ['arch', 'arch', 'bascule', 'arch', 'arch'], rise: [3.2, 3.6, 0, 3.6, 3.2],
  look: { fas: 'fasBirzh', dark: 'fasBirzhDark', granite: 'granitePink', parapet: 'parapetPink', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'trident', hex: '#4e7558', bay: 2.5 }, depth: { fascia: 0.95, pier: 3.3, mid: 1.25 },
  marks: { solid: [3.38, 3.62], dash: [-7, -3.5, 0, 7] }, tracks: null,
  lamps: { kind: 'cross', u: [4, 37.25, 84.6, 90.7, 146.5, 152.8, 199.2, 234.7], opts: { h: 11.8, n: 2, mat: 'fasBirzh' } },
  osm: ['r4074054', 'w362785969', 'w362785970', 'w102582397', 'w128494897'] };
export const TUCHKOV = { id: 'tuchkov', name: 'Тучков мост', nameEn: 'Tuchkov Bridge', cx: -3739.33, cz: -1752.05, b: 34.69, len: 219.6, hw: 18.0, road: 14.5, kerbW: 0.3, kerbH: 0.75, tightKerb: true, crown: 3.2,
  piers: [[74.5, 82.3, 'tower'], [134.7, 142.5, 'tower']], spans: ['girder', 'bascule', 'girder'],
  look: { fas: 'fasTuchkov', dark: 'fasTuchkovDark', granite: 'granitePink', parapet: 'parapetPink', pave: 'footAsphalt', kerb: 'steel' },
  rail: { kind: 'hairpin', hex: '#56665e', bay: 2.4 }, depth: { fascia: 0, pier: 2.9, mid: 1.05, bank: 2.4 }, pavilions: 1,
  marks: { solid: [-3.3, 3.3], dash: [-11, -7.4, 7.4, 11] }, tracks: [[-3736.9, -1749.9, -3612.0, -1932.0, 1.75], [-3740.9, -1752.4, -3617.9, -1935.3, -1.75]],
  tramWires: true,                                                  // (Vasilievsky Island second pass) contact wires of the two tracks over the deck, hung from the lamps: streets stops its wires at the bridge
  lamps: { kind: 'cobra', u: [6, 34, 62, 96, 121, 158, 186, 213], opts: { h: 10, mat: 'steel' } },
  osm: ['r4074067', 'w305504281', 'w305509466', 'w305504282', 'w305509467', 'w305504283', 'w305504284'] };
export const SAMPS = { id: 'samps', name: 'Сампсониевский мост', nameEn: 'Sampsonievsky Bridge', cx: -885.02, cz: -2841.68, b: 85.84, len: 207, hw: 13.5, road: 10.5, kerbW: 0.3, kerbH: 0.4, crown: 2.4,
  piers: [[16.5, 25.5, 'abut'], [51.5, 56.5, 'slim'], [83.5, 88.5, 'slim'], [118.5, 123.5, 'slim'], [150.5, 155.5, 'slim'], [181.5, 190.5, 'abut']], spans: ['stone', 'girder', 'girder', 'bascule', 'girder', 'girder', 'stone'],
  stone: [[4.5, 16.5], [190.5, 202.5]],
  look: { fas: 'fasSamps', dark: 'fasSampsDark', granite: 'graniteSalmon', parapet: 'parapetPink', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'ringbal', hex: '#35543f', bay: 2.0, posts: 'round' }, depth: { fascia: 0, pier: 2.3, mid: 1.0 },
  marks: { solid: [-3.3, 3.3], dash: [-6.9, 6.9] }, tracks: [[-884.8, -2839.2, -679.3, -2854.3, 1.75], [-885.0, -2842.6, -680.2, -2857.7, -1.75]],
  lamps: { kind: 'ring', u: [21, 54, 86, 121, 153, 186], opts: { h: 9.5, n: 5, mat: 'fasSampsDark' }, onPier: true },
  osm: ['w117802281', 'w333119579', 'w333119586', 'w1172626338', 'w1172626340', 'w333119581', 'w333119584'] };
// ---- the Zhdanovka (Petrograd side <-> Petrovsky Island): two single-span bridges (docs/research/petro-bridges.md section 6, photos 49 - 52)
//   zhdanovsky  Ждановский мост (1989-92): the 35 m wide pedestrian deck to the Petrovsky stadium, a flat blue-grey girder with a curved soffit on light grey granite abutments, thin silver railing,
//               four corner poles with five white globes; asphalt deck without a roadway (ped: no kerb barriers, no markings)
//   kursant     мост Красного Курсанта (1962): a shallow haunched pale concrete girder (2.2 m at the abutments, 0.8 m at mid-span), grey granite abutments with a solid parapet block over each,
//               dark green railing `barsring` (bars under a double rail with small rings), four plain grey poles; 2 lanes
export const ZHDANOVSKY = { id: 'zhdanovsky', name: 'Ждановский мост', nameEn: 'Zhdanovsky Bridge', ww: 'zhdanovka', cx: -3613.39, cz: -2368.99, b: 215.11, len: 32.2, hw: 17.5, road: 17.0, kerbW: 0.2, kerbH: 0.15, crown: 0.45, ped: true, lowKerb: true,
  piers: [], spans: ['girder'], look: { fas: 'fasZhdan', dark: 'fasTuchkovDark', granite: 'graniteGrey', parapet: 'parapet', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'hpipes', hex: '#a9b8c2', bay: 2.0 }, depth: { fascia: 0, pier: 1.7, mid: 0.75 }, marks: { solid: [], dash: [] }, tracks: null, walk: [6, 14],
  lamps: { kind: 'globes5', u: [1.2, 31.0], v: 16.6, opts: { h: 6.6, mat: 'steel' } }, osm: ['w305509688', 'w78518198', 'w305509687'] };
export const KURSANT = { id: 'kursant', name: 'мост Красного Курсанта', nameEn: 'Krasnogo Kursanta Bridge', ww: 'zhdanovka', cx: -3944.14, cz: -2525.85, b: 34.62, len: 42.0, hw: 11.0, road: 6.0, kerbW: 0.3, kerbH: 0.15, crown: 0.4, lowKerb: true,
  piers: [], spans: ['girder'], solidEnds: 6.4, look: { fas: 'concrete', dark: 'fasTuchkovDark', granite: 'graniteGrey', parapet: 'parapet', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'barsring', hex: '#3f6048', bay: 2.25 }, depth: { fascia: 0, pier: 2.2, mid: 0.8 }, marks: { solid: [0], dash: [] }, tracks: null,
  lamps: { kind: 'cobra', u: [5, 37], opts: { h: 9, mat: 'steel' } }, osm: ['w305509759', 'w5133174', 'w117969579', 'w379599213'] };
// ---- the Malaya Nevka (Petrogradsky Island <-> Krestovsky Island; docs/research/petro-bridges.md section 7, photos 59 60 61 63 65)
//   bkrest      Большой Крестовский мост (1949-51, Noskov): 135 m, 25.5 m (roadway 21 = 6 lanes, pavements 2.25, a high granite barrier between), five spans with a double-leaf bascule in the
//               middle (22.9 m clear); welded green girders of constant depth; rectangular rusticated CONCRETE piers, the bascule piers PAIRED and joined by a decorative concrete arch; cast-iron
//               railing of slender balusters under interlaced pointed arches between square posts with a rosette (`lancetarc`), granite blocks over the piers with green two-lantern standards.
//               No source gives the span lengths: laid out symmetrically from the 22.9 m opening and photo 61 [E].
//   lazarev     Лазаревский мост (2008-09, Stroyproekt): one cable-stayed span (OSM 120.5 m bank to bank), silver-grey steel; the pylon = TWO parabolic arches across the roadway on common feet
//               at the Krestovsky end (the tall one leans over the span and carries five tube stays per side to the deck edges, the low one leans to the shore and carries the back stays), V struts
//               between them; 2 + 2 lanes, white barrier panels, steel tube railing, plain grey poles.  [E]: arch heights (30 / 18 m), stay anchor spacing.
export const BKREST = { id: 'bkrest', name: 'Большой Крестовский мост', nameEn: 'Bolshoy Krestovsky Bridge', cx: -3917.79, cz: -3808.84, b: 315.89, len: 133.0, hw: 12.75, road: 10.5, kerbW: 0.3, kerbH: 0.75, crown: 2.2,
  piers: [[18.3, 20.7, 'block'], [39.05, 42.85, 'block'], [51.25, 55.05, 'block'], [77.95, 81.75, 'block'], [90.15, 93.95, 'block'], [112.3, 114.7, 'block']], spans: ['girder', 'girder', 'stone', 'bascule', 'stone', 'girder', 'girder'],
  look: { fas: 'fasKrest', dark: 'fasKrestDark', granite: 'concreteRust', parapet: 'parapetPink', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'lancetarc', hex: '#4e8259', bay: 2.4, posts: 'square' }, depth: { fascia: 0, pier: 1.7, mid: 1.6 },
  marks: { solid: [-0.12, 0.12], dash: [-7, -3.5, 3.5, 7] }, tracks: null,
  lamps: { kind: 'cross', u: [2.5, 19.5, 40.95, 53.15, 79.85, 92.05, 113.5, 130.5], opts: { h: 8.5, n: 2, mat: 'fasKrest' }, onPier: true },
  osm: ['r5477979', 'w509508604', 'w509508606', 'w1082134872', 'w368644234', 'w368644239'] };
export const LAZAREV = { id: 'lazarev', name: 'Лазаревский мост', nameEn: 'Lazarevsky Bridge', cx: -4313.03, cz: -3576.86, b: 341.07, len: 120.5, hw: 11.4, road: 7.5, kerbW: 0.5, kerbH: 0.8, crown: 1.6,
  piers: [], spans: ['girder'], look: { fas: 'fasLazarev', dark: 'fasTuchkovDark', granite: 'graniteGrey', parapet: 'parapet', pave: 'footAsphalt', kerb: 'white' },
  rail: { kind: 'hpipes', hex: '#c3c8cc', bay: 2.0 }, depth: { fascia: 0, pier: 1.7, mid: 1.7 }, marks: { solid: [-0.12, 0.12], dash: [-3.75, 3.75] }, tracks: null,
  lamps: { kind: 'cobra', u: [12, 38, 64, 90], opts: { h: 10, mat: 'steel' } },
  walk: [4.1, 10.2],
  pylon: { u: 117.5, v: 8.5, tall: [30, -8], low: [18, 6], main: [[0.86, 22], [0.74, 42], [0.6, 62], [0.44, 82], [0.26, 100]], back: [[0.72, 12], [0.45, 22]] },
  osm: ['r5478186', 'w403795446', 'w403795447', 'w368663466', 'w368663469'] };
// ---- P7 / P9 (docs/research/petro-bridges.md section 8)
//   grenadersky  Гренадерский мост (1971-75) over the Bolshaya Nevka: 75.75 + 32.0 (double-leaf bascule, 30 m clear) + 75.75, 218.8 m between the abutment backs, 27 m; slender grey-olive steel
//                girders with a curved lower chord (depth 1/61 of the span), two pink granite bascule piers with round towers close together in the middle (OSM relation r3312311), two tram tracks
//   malopetr     Мало-Петровский мост (2016-18) over the Zhdanovka: one 37.5 m span, 36 m wide (12 + 2.6 + 12 m roadway, pavements 3.5), a plain light grey girder of constant depth, concrete barriers,
//                galvanised tube railing, tall poles
//   zhdanovsky4  4-й Ждановский мост (1983-84): a slender humped steel footbridge (66.7 x 2.7 m with its ramps), pale girders, thin dark green bar railing; here the steps of both ends are ramps
//                (the frame is the whole OSM deck way, 49.8 m: 4.5 m / 6.3 m of it lie on the banks, over the grass slopes of the Zhdanovka; the water is 39 m wide)
export const GRENADER = { id: 'grenadersky', name: 'Гренадерский мост', nameEn: 'Grenadersky Bridge', cx: -1022.52, cz: -3928.90, b: 71.2, len: 190.8, hw: 13.5, road: 10.2, kerbW: 0.3, kerbH: 0.5, crown: 2.6, towerRv: 3.6,
  piers: [[71.8, 79.3, 'tower'], [111.4, 118.8, 'tower']], spans: ['girder', 'bascule', 'girder'],
  look: { fas: 'fasGren', dark: 'fasGrenDark', granite: 'granitePink', parapet: 'parapetPink', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'plainrods', hex: '#56665e', bay: 2.0 }, depth: { fascia: 0, pier: 2.4, mid: 1.25, bank: 1.8 },
  marks: { solid: [-4.7, 3.5], dash: [-7.4, 6.6] }, tracks: [[-1022.0, -3927.5, -841.5, -3988.8, 1.55], [-1023.5, -3931.9, -842.5, -3992.5, -2.7]],
  lamps: { kind: 'cobra', u: [6, 36, 64, 127, 155, 185], opts: { h: 10, mat: 'steel' } },
  osm: ['r3312311', 'w36921682', 'w374827148', 'w153720344', 'w194247745', 'w157166680', 'w194299296'] };
export const MALOPETR = { id: 'malopetr', name: 'Мало-Петровский мост', nameEn: 'Malo-Petrovsky Bridge', ww: 'zhdanovka', cx: -4442.11, cz: -3201.61, b: 211.4, len: 36.3, hw: 18.0, road: 13.3, kerbW: 0.4, kerbH: 0.75, crown: 0.5,
  piers: [], spans: ['girder'], look: { fas: 'fasLazarev', dark: 'fasTuchkovDark', granite: 'graniteGrey', parapet: 'parapet', pave: 'footAsphalt', kerb: 'concrete' },
  rail: { kind: 'hpipes', hex: '#b9bfc4', bay: 2.0 }, depth: { fascia: 0, pier: 1.4, mid: 1.4 }, marks: { solid: [-1.3, 1.3], dash: [-8.8, -5.3, 5.3, 8.8] }, tracks: null,
  lamps: { kind: 'cobra', u: [5, 31], opts: { h: 12, mat: 'steel' } }, osm: ['w305511980', 'w403606022', 'w403606030', 'w253037052', 'w305511982'] };
export const ZHD4 = { id: 'zhdanovsky4', name: '4-й Ждановский мост', nameEn: '4th Zhdanovsky Bridge (footbridge)', ww: 'zhdanovka', cx: -4176.12, cz: -2872.69, b: 65.3, len: 49.8, hw: 1.45, road: 1.25, kerbW: 0.05, kerbH: 0.15, crown: 2.0, ped: true, lowKerb: true,
  piers: [], spans: ['girder'], look: { fas: 'fasPale', dark: 'fasTuchkovDark', granite: 'granitePink', parapet: 'parapetPink', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'plainrods', hex: '#3f5a46', bay: 2.0 }, depth: { fascia: 0, pier: 1.6, mid: 0.8 }, marks: { solid: [], dash: [] }, tracks: null, walk: [0.2, 0.5],
  lamps: { kind: 'cobra', u: [], opts: { h: 5, mat: 'steel' } }, osm: ['w305509975', 'w265080324', 'w933617464', 'w933617465'] };
export const LONG = [BIRZHEVOY, TUCHKOV, SAMPS, ZHDANOVSKY, KURSANT, BKREST, LAZAREV, GRENADER, MALOPETR, ZHD4];

