// landmarksKamennoostrovsky/groups.js - the layout.GROUPS sub-groups of module landmarksKamennoostrovsky (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }. Claim only what the module really draws.
// Everything listed here is DRAWN by landmarksKamennoostrovsky (docs/research/kamennoostrovsky.md). All other houses of Kamennoostrovsky pr. / Bolshoy pr. P. S. stay with `city`
// (docs/research/kamennoostrovsky-houses.json describes them for the KNOWN table).
export const GROUPS_LIST = [
  { key: 'kam-towers', name: 'Дом с башнями (дом Розенштейна)', nameEn: 'House with Towers: Rosenstein house on Lev Tolstoy Square (K. Rosenstein + A. Belogrud 1913-15), two hexagonal neo-Gothic towers, the lancet arcade of the Mironov theatre',
    ids: ['r2139268'], osm: [], at: [-2134, -3728],
    note: 'OSM r2139268 (outline, parts r4080817..r4080821 + two courtyard sheds are claimed with it); Kamennoostrovsky 35 / Bolshoy 75 / ul. Lva Tolstogo 2' },
  { key: 'kam-austrian', name: 'Австрийская площадь', nameEn: 'Austrian Square: the five houses of the octagon (Keldal 13, Liphart 16, Lepenberg 18, Gorbov 20 by V. Schaub and A. Kovsharov 1899-1906, and the 1952 house 15)',
    ids: ['w42422601', 'r1267606', 'r1267607', 'w52104048', 'w27046419'], osm: [], at: [-1906, -3065],
    note: 'Kamennoostrovsky 13/2 w42422601, 16 r1267606 (+ parts r15442351 / r15442352), 18/11 r1267607 (+ part r15979826), ul. Mira 10 = Kamennoostrovsky 20 w52104048, 15 w27046419' },
  { key: 'kam-tolstoy', name: 'Площадь Льва Толстого', nameEn: 'Lev Tolstoy Square: the Chubakov house with the domed belvedere, the Korzinin house, the Maizel house, the House of Fashion with the Petrogradskaya metro vestibule, the former Oldenburg institute, the second Rosenstein house (Bolshoy 77)',
    ids: ['r1249813', 'w163290692', 'r1257106', 'r1256096', 'r1256097', 'w40260868', 'r4080836'], osm: [], at: [-2198, -3714],
    note: 'Kamennoostrovsky 38/96 r1249813, ul. Lva Tolstogo 1-3 w163290692, Bolshoy 98 r1257106, Kamennoostrovsky 37 r1256096 + litera D r1256097, Kamennoostrovsky 36/73 w40260868, Bolshoy 77 r4080836' },
  { key: 'kam-owls', name: 'Дом с совами (дом Путиловой)', nameEn: 'House with Owls: Putilova house, Bolshoy pr. P. S. 44 (I. Pretro 1906-07, Northern Modern)',
    ids: ['r3570513'], osm: [], at: [-2827, -3003], note: 'OSM r3570513 (+ the courtyard part r17142428)' },
  { key: 'kam-benois', name: 'Дом Бенуа', nameEn: 'Benois house, Kamennoostrovsky 26-28 (L., Yu. and A. Benois with A. Gunst 1911-14)',
    ids: ['r1263723'], osm: [], at: [-2106, -3345], note: 'OSM r1263723 (9 100 m2, 180 vertices, two courtyards + the court of honour open to the avenue)' },
  { key: 'kam-voeykova', name: 'Дом Воейковой', nameEn: 'Voeykova house, Kamennoostrovsky 19 / Bolshaya Monetnaya 13 (S. Minash 1911-12)',
    ids: ['r1263830'], osm: [], at: [-1933, -3205], note: 'OSM r1263830' },
  { key: 'kam-emir', name: 'Дом эмира Бухарского', nameEn: 'House of the Emir of Bukhara, Kamennoostrovsky 44b (S. Krichinsky 1913-14): marble front, gate arches, the two-storey loggia',
    ids: ['r406242'], osm: [], at: [-2388, -4036], note: 'OSM r406242 (region P8: whole since the island re-bake)' },
  { key: 'kam-lensovet', name: 'Дворец культуры имени Ленсовета', nameEn: 'Lensovet Palace of Culture, Kamennoostrovsky 42 (E. Levinson, V. Munts 1931-38): glazed front, the tower, the cafe wing with the frieze',
    ids: ['w41169889'], osm: [], at: [-2311, -3868], note: 'outline w41169889 (skip) with the parts w1303547572 / 573 / 574 / 575 (drawn) and the overhang w1303547577 (not drawn)' },
  { key: 'kam-lenfilm', name: '«Ленфильм» и дома Александрова', nameEn: 'Lenfilm: the studio portico in the garden behind Kamennoostrovsky 10, and the Aleksandrov tenements 10 and 12 (D. Kryzhanovsky, P. Mulkhanov 1905-06)',
    ids: ['r1268688', 'r3419529'], osm: [], at: [-1885, -2859],
    note: 'r1268688 = house 10 AND the studio complex behind it in one outline (8 200 m2): the portico is its 15.9 m edge at (-1885,-2859), at the end of the garden south of house 10; r3419529 = house 12' },
  { key: 'kam-fronts', name: 'Доходные дома Каменноостровского и Большого проспектов', nameEn: 'Further fronts: Bykhovsky house (Kamennoostrovsky 9), Cavos house (24 / B. Monetnaya 10), Alyushinsky house (Bolshoy 69), Badaev house (Bolshoy 49), Antonova house (Bolshoy 74)',
    ids: ['r5986712', 'w59965741', 'r2142991', 'r1248810', 'r2106382'], osm: [], at: [-2288, -3531], note: 'five tenements built through tenement.js from the houses table (photos opened)' },
];
