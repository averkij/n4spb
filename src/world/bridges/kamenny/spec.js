// bridges/kamenny/spec.js - DATA of the Kamenny Island bridges (pure data, no imports except sites.js frames): the two big bridges over the Malaya / Bolshaya Nevka and the small canal bridges of the island.
// Dossier: docs/research/kamenny-bridges.md (evidence tags [OSM] [W] [V] [E] [?], photo table refs/bridges-kamenny 01 - 40).
//
// BIG BRIDGES (builder: bridges/kamenny/big.js, derived from long.js buildLong): the frame is the MID-LINE of the two one-way carriageways (OSM ways), bank frame: u = 0 at the first bank line (the
// water edge measured on the axis in the environment, tools/kamenny-bridge-frame.mjs), +u toward the far bank, +v right of travel; `s0` / `s1` = the metres of the OSM way that lie on land before /
// after the bank lines (the deck carries on at the bank level there: the ways are claimed, so streets stops drawing them).
//   KAM  Каменноостровский мост (Malaya Nevka, Kamenny -> Aptekarsky; OSM r3274694, bearing 150.8 deg from the Kamenny end): 1953-54 (Demchenko, Levin, Areshev, Vasilkovsky), five spans 27.45 + 30.14 +
//        36.7 (the middle one a rolling two-leaf bascule) + 30.14 + 27.45 m between the pier axes (151.9 m [W]; scaled to the measured 148 m between the banks), haunched pale blue-grey steel girders
//        with a green soffit on four pink-grey granite piers with round-nosed towers at both faces (corbelled cornice, a granite pedestal block over each carrying a green two-lantern standard),
//        granite abutments with obelisk-stelae, cast green railing with ring medallions between granite blocks, 27 m wide (carriageways 2 x 2 lanes at v = +-6.6 m, two tram tracks at v = -1.8 / +1.9, pavements
//        to +-13.5).
//   USH  Ушаковский мост (Bolshaya Nevka, Kamenny -> Primorsky; OSM r5011811, bearing 8.1 deg, 214.6 m): five steel spans between two big round bastions and a rusticated granite arcade at each end
//        (two arches at the Kamenny end, one at the north end: the right-bank span was filled in 1999-2000 [W]), fluted dark-green cast-iron columns with bronze trophies (the Order of Ushakov) on the
//        four bastion drums, pale haunched girders, round piers, green railing, two-lantern standards.
export const VER = 1;

const sinD = (d) => Math.sin(d * Math.PI / 180), cosD = (d) => Math.cos(d * Math.PI / 180);
/** world point of the frame origin: the OSM start point moved by `u0` metres along the bearing */
const org = (start, bearing, u0) => ({ cx: start[0] + sinD(bearing) * u0, cz: start[1] - cosD(bearing) * u0 });

export const KAM = {
  id: 'kamennoostrovsky', name: 'Каменноостровский мост', nameEn: 'Kamennoostrovsky Bridge', ww: 'neva', osmStart: [-2830.3, -5096.3], b: 150.8,
  bank0: 10.25, len: 148.0, s0: 10.25, s1: 7.75,
  hw: 13.5, road: 10.1, kerbW: 0.3, kerbH: 0.15, crown: 2.3,
  // piers: [u0, u1, kind, towerRv]
  piers: [[24.14, 29.34, 'tower', 2.7], [53.51, 58.71, 'tower', 2.7], [89.27, 94.47, 'tower', 2.7], [118.63, 123.83, 'tower', 2.7]],
  spans: ['girder', 'girder', 'bascule', 'girder', 'girder'],
  depth: { fascia: 0, pier: 2.6, mid: 1.05, bank: 2.0 },
  look: { fas: 'fasKam', dark: 'soffitIron', granite: 'granitePink', parapet: 'parapetPink', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'ringbal', hex: '#34523f', bay: 2.0 },
  marks: { solid: [-3.5, 3.5], dash: [-6.6, 6.6] },
  // tram tracks (centre lines in the OSM-start frame: [u, v] from the Kamenny end) from the OSM ways w142824560 / w142824552
  tracks: [[[0, 1.8], [161.5, 2.2], [167.6, 2.9]], [[0, -1.8], [161.4, -1.9], [167.6, -1.6]]],
  lamps: { kind: 'kam', piers: true, spans: [] },
  obelisks: [[-1.8, 1], [-1.8, -1], [149.8, 1], [149.8, -1]],
  plates: [[-4.0, 1], [152.0, -1]],
  claims: ['r3274694', 'w156494598', 'w156494599', 'w156494615', 'w156494632', 'w202238302', 'w202238303', 'w142824552', 'w142824560'],
};
KAM.cx = org(KAM.osmStart, KAM.b, KAM.bank0).cx; KAM.cz = org(KAM.osmStart, KAM.b, KAM.bank0).cz;

export const USH = {
  id: 'ushakovsky', name: 'Ушаковский мост', nameEn: 'Ushakovsky Bridge', ww: 'neva', osmStart: [-2870.7, -5482.5], b: 8.14,
  bank0: 0.4, len: 214.1, s0: 1.6, s1: 1.4,
  hw: 13.5, road: 10.0, kerbW: 0.3, kerbH: 0.15, crown: 2.6,
  piers: [[12.0, 15.0, 'abut'], [27.0, 35.4, 'tower', 4.3], [60.3, 63.9, 'slim'], [91.2, 97.4, 'tower', 3.1], [130.7, 136.9, 'tower', 3.1], [164.2, 167.8, 'slim'], [192.7, 201.1, 'tower', 4.3]],
  spans: ['stone', 'stone', 'girder', 'girder', 'bascule', 'girder', 'girder', 'stone'],
  depth: { fascia: 0, pier: 2.5, mid: 1.0, bank: 1.6 },
  look: { fas: 'fasKam', dark: 'soffitIron', granite: 'graniteUsh', parapet: 'parapetUsh', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'ringbal', hex: '#34523f', bay: 2.0 },
  marks: { solid: [-4.1, 3.7], dash: [-6.2, 6.2] },
  tracks: [[[0, -2.6], [214.6, -2.2]], [[0, 1.6], [214.6, 2.1]]],
  lamps: { kind: 'ush', piers: false, spans: [48, 77.6, 114, 150.5, 180] },
  columns: [[31.2, 1], [31.2, -1], [196.9, 1], [196.9, -1]],
  plates: [[-1.0, 1], [215.0, -1]],
  claims: ['r5011811', 'w156494646', 'w156494647', 'w294040739', 'w294040741', 'w294040740', 'w294040742'],
};
USH.cx = org(USH.osmStart, USH.b, USH.bank0).cx; USH.cz = org(USH.osmStart, USH.b, USH.bank0).cz;
export const BIG = [KAM, USH];

// ---------------------------------------------------------------------------------------------------- the small bridges (data: kmb_small.json of the dossier, environment zone polygons + OSM ways)
// frame: origin = centre of the OSM deck polygon, +u along the way (bearing b), +v right of travel; len = the deck (OSM way) length; strips = [v0, v1, surface] across the deck
// (asphalt | pave (footway asphalt) | cobble | concrete | flags); rail = { kind, hex }; piers = u of a pile row; lamps = [[su, sg]] corner park lamps (u = su * (len / 2 + 0.8), v = sg * (hw - 0.7))
const R2 = (kind, hex, bay = 2.0) => ({ kind, hex, bay });
export const SMALL = [
  { id: 'kam11', name: '11-й Каменноостровский мост', nameEn: '11th Kamennoostrovsky Bridge (Bolshoy canal)', cx: -3800.8, cz: -5128.3, b: -40.2, len: 17.0, strips: [[-4.75, -3.6, 'pave'], [-3.6, 2.8, 'asphalt'], [2.8, 4.75, 'pave']], rail: R2('plainrods', '#cfd3d4'), piers: [0], lamps: [[1, 1], [-1, -1]], claims: ['r3274685', 'w242395693'] },
  { id: 'kam14', name: '14-й Каменноостровский мост', nameEn: '14th Kamennoostrovsky Bridge (Bolshoy canal)', cx: -4108.9, cz: -4861.2, b: -47.3, len: 18.0, strips: [[-7.0, -4.3, 'pave'], [-4.3, 4.0, 'asphalt'], [4.0, 6.8, 'pave']], rail: R2('plainrods', '#eef1f2'), piers: [], lamps: [[1, 1], [1, -1], [-1, 1], [-1, -1]], claims: ['r3274686', 'w100143034', 'w242395694', 'w681459269'] },
  { id: 'kam9', name: '9-й Каменноостровский мост', nameEn: '9th Kamennoostrovsky Bridge (Bolshoy canal)', cx: -3623.8, cz: -5285.2, b: -40.0, len: 13.8, strips: [[-4.3, -3.1, 'pave'], [-3.1, 3.5, 'asphalt'], [3.5, 4.3, 'pave']], rail: R2('loops', '#a39d66'), piers: [0], lamps: [[1, 1], [-1, -1]], claims: ['r3274677', 'w242395136'] },
  { id: 'kam7', name: '7-й Каменноостровский мост', nameEn: '7th Kamennoostrovsky Bridge (Bolshoy canal, private)', cx: -3630.7, cz: -5387.0, b: 47.3, len: 7.2, strips: [[-3.1, 3.1, 'asphalt']], rail: R2('loops', '#a39d66'), piers: [], lamps: null, claims: ['r3274669', 'w242393942'] },
  { id: 'kam20', name: '20-й Каменноостровский мост', nameEn: '20th Kamennoostrovsky Bridge (Maly canal)', cx: -3695.3, cz: -5469.1, b: 75.4, len: 5.2, strips: [[-5.4, -2.9, 'pave'], [-2.9, 2.1, 'asphalt'], [2.1, 5.4, 'pave']], rail: R2('ovalchain', '#a8975a'), piers: [], lamps: [[1, 1], [-1, -1]], claims: ['r3267056', 'w102676678', 'w242398359', 'w242398360'] },
  { id: 'kam3', name: '3-й Каменноостровский мост', nameEn: '3rd Kamennoostrovsky Bridge (footbridge)', cx: -3348.6, cz: -5473.5, b: -3.0, len: 13.4, strips: [[-1.75, 1.75, 'pave']], rail: R2('plainrods', '#7e8488'), piers: [0], lamps: null, claims: ['r3274653', 'w242393473'] },
  { id: 'kam4', name: '4-й Каменноостровский мост', nameEn: '4th Kamennoostrovsky Bridge (private)', cx: -3565.6, cz: -5467.6, b: 178.7, len: 4.4, strips: [[-2.8, -1.5, 'pave'], [-1.5, 2.8, 'asphalt']], rail: R2('ringbal', '#262a2d'), piers: [], lamps: null, claims: ['r3274654', 'w242393474', 'w984685428'] },
  { id: 'kam5', name: '5-й Каменноостровский мост', nameEn: '5th Kamennoostrovsky Bridge (private)', cx: -3641.5, cz: -5465.1, b: 177.7, len: 5.0, strips: [[-2.4, 2.4, 'asphalt']], rail: R2('ringbal', '#262a2d'), piers: [], lamps: null, claims: ['r3274655', 'w242393475'] },
  { id: 'kam6', name: '6-й Каменноостровский мост', nameEn: '6th Kamennoostrovsky Bridge (footbridge)', cx: -3657.8, cz: -5419.1, b: 49.1, len: 7.0, strips: [[-2.3, 2.3, 'cobble']], rail: R2('ringbal', '#24272a'), piers: [], lamps: null, claims: ['r3274668', 'w242393941'] },
  { id: 'kam19', name: '19-й Каменноостровский мост', nameEn: '19th Kamennoostrovsky Bridge (Maly canal)', cx: -3215.7, cz: -5501.7, b: 88.6, len: 4.0, strips: [[-5.7, -0.5, 'concrete'], [-0.5, 2.5, 'asphalt'], [2.5, 5.7, 'concrete']], rail: R2('ovalchain', '#a8975a'), piers: [], lamps: [[1, 1], [-1, -1]], claims: ['r3267059', 'w128181064', 'w242398357', 'w242398358'] },
  { id: 'kam2', name: '2-й Каменноостровский мост', nameEn: '2nd Kamennoostrovsky Bridge (footbridge)', cx: -3246.8, cz: -5480.2, b: -179.3, len: 8.0, strips: [[-1.7, 1.7, 'concrete']], rail: R2('plainrods', '#7c8286'), piers: [], lamps: null, claims: ['r3274652', 'w242393472'] },
  { id: 'kamsvc1', name: 'Служебный мост (Тихий отдых)', nameEn: 'Service bridge of the Tikhy Otdykh park (w158062957)', cx: -3512.4, cz: -5384.1, b: -40.5, len: 5.4, strips: [[-2.2, 2.2, 'asphalt']], rail: R2('loops', '#a39d66'), piers: [], lamps: null, claims: ['w158062957'] },
  { id: 'kamsvc2', name: 'Служебный мост (Большой канал)', nameEn: 'Service bridge of the Bolshoy canal (w158062958)', cx: -3461.1, cz: -5427.5, b: -42.3, len: 7.6, strips: [[-2.2, 2.2, 'asphalt']], rail: R2('loops', '#a39d66'), piers: [], lamps: null, claims: ['w158062958'] },
];
