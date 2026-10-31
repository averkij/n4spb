// bridges/sites-petro.js - PURE DATA: the seven bridges of the Karpovka (Petrogradsky Island <-> Aptekarsky Island; docs/research/petro-bridges.md section 8), merged into SITES by sites.js (same
// fields as there and in sites-sw.js).  The baked data has a Karpovka water polygon only east of x -2462 (WATER r1312676): every site carries a FIXED bank interval `bank`, measured
// on the Karpovka that environment draws (L.waterwayAt 'karpovka' along the three lines v0 / 0 / v1 of the site, the widest interval; re-measure when its banks move).  All are single-span city bridges of 1950-1997 in the family of
// the Moika / Kryukov sites: style `rcarch` (grey frame / beam with a cast or welded railing between granite parapets, a clearance board as on the photos), the Silin Bridge a grey granite arch (stone).
// (The Aptekarsky Bridge shows a granite-faced arch only toward the Bolshaya Nevka; both faces are the concrete frame of its Karpovka side here.)
// Extra field: noMarks (no lane paint on the deck: the carriageways cross the Aptekarsky deck at a skew).
export const PETRO_SITES = [
  { id: 'aptekarsky', name: 'Аптекарский мост', nameEn: 'Aptekarsky Bridge', kind: 'road', style: 'rcarch', look: 'aptek', water: 'r1312676', ww: 'karpovka', noMarks: true, clear: '2.8',
    cx: -1066.2, cz: -3896.7, b: 7.4, v0: -40.5, v1: 52.5, bank: [-13.8, 7.3],
    zones: [[-40.5, -37.2, 'pave'], [-37.2, 49.2, 'asphalt'], [49.2, 52.5, 'pave']], hump: 0.2, soffitCrown: -0.5, spring: 0.5, at: [-1066, -3897] },
  { id: 'petropavlovsky', name: 'Петропавловский мост', nameEn: 'Petropavlovsky Bridge', kind: 'road', style: 'rcarch', look: 'petropav', water: 'r1312676', ww: 'karpovka', clear: '2.8',
    cx: -2078.1, cz: -3957.4, b: 12.5, v0: -12.4, v1: 12.4, bank: [-8.8, 8.9],
    zones: [[-12.4, -7.6, 'pave'], [-7.6, 7.6, 'asphalt'], [7.6, 12.4, 'pave']], hump: 0.25, soffitCrown: -0.4, spring: 0.6, at: [-2078, -3957] },
  { id: 'silin', name: 'Силин мост', nameEn: 'Silin Bridge', kind: 'road', style: 'rcarch', look: 'silin', stone: true, water: 'r1312676', ww: 'karpovka',
    cx: -2433.6, cz: -4160.9, b: 154.3, v0: -13.5, v1: 13.5, bank: [-10.3, 10.0],
    zones: [[-13.5, -9.0, 'pave'], [-9.0, 7.8, 'asphalt'], [7.8, 13.5, 'pave']], hump: 0.4, soffitCrown: -0.3, spring: 0.4, at: [-2434, -4161] },
  { id: 'geslerovsky', name: 'Геслеровский мост', nameEn: 'Geslerovsky Bridge', kind: 'road', style: 'rcarch', look: 'gesler', water: 'r1312676', ww: 'karpovka',
    cx: -2629.8, cz: -4121.3, b: 12.0, v0: -14.45, v1: 14.45, bank: [-11.8, 11.2],
    zones: [[-14.45, -8.2, 'pave'], [-8.2, 8.9, 'asphalt'], [8.9, 14.45, 'pave']], hump: 0.2, soffitCrown: -0.45, spring: 0.6, at: [-2630, -4121] },
  { id: 'karpovsky', name: 'Карповский мост', nameEn: 'Karpovsky Bridge', kind: 'road', style: 'rcarch', look: 'karpov', water: 'r1312676', ww: 'karpovka', trams: [-3.35, -0.2], clear: '2.9',
    cx: -2795.8, cz: -4200.9, b: 193.1, v0: -11.5, v1: 11.3, bank: [-11.3, 11.0],
    zones: [[-11.5, -7.6, 'pave'], [-7.6, 4.0, 'asphalt'], [4.0, 11.3, 'pave']], hump: 0.2, soffitCrown: -0.45, spring: 0.6, at: [-2796, -4201] },
  { id: 'barochny', name: 'Барочный мост', nameEn: 'Barochny Bridge', kind: 'road', style: 'rcarch', look: 'baroch', water: 'r1312676', ww: 'karpovka', clear: '2.0',
    cx: -3498.15, cz: -4037.84, b: 180.2, v0: -8.5, v1: 8.5, bank: [-7.2, 7.2],
    zones: [[-8.5, -3.7, 'pave'], [-3.7, 3.7, 'asphalt'], [3.7, 8.5, 'pave']], hump: 0.2, soffitCrown: -0.5, spring: 0.6, at: [-3498, -4038] },
  { id: 'molodyozhny', name: 'Молодёжный мост', nameEn: 'Molodyozhny Bridge', kind: 'road', style: 'rcarch', look: 'molod', water: 'r1312676', ww: 'karpovka', clear: '3.3',
    cx: -3829.1, cz: -3959.1, b: 9.3, v0: -10.5, v1: 10.4, bank: [-11.7, 11.7],
    zones: [[-10.5, -7.0, 'pave'], [-7.0, 7.0, 'asphalt'], [7.0, 10.4, 'pave']], hump: 0.3, soffitCrown: -0.3, spring: 0.6, at: [-3829, -3959] },
];
