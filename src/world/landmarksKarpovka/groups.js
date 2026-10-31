// landmarksKarpovka/groups.js - the layout.GROUPS sub-groups of module landmarksKarpovka (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }. Claim only what the module really draws (docs/research/karpovka.md).
// A part of the module is built only when its key is listed here (landmarksKarpovka.js PARTS): flip a claim on together with its part.
export const GROUPS_LIST = [
  { key: 'ioannovsky', name: 'Иоанновский монастырь на Карповке', nameEn: 'Ioannovsky convent (N. Nikonov, 1900-08): striped Neo-Byzantine church with five helmet domes and a bell tower, cell ranges, the Holy Gate',
    ids: ['r3274778'], osm: ['w1109643209', 'w101406617'], at: [-2848, -4245],
    note: 'the whole complex r3274778 (parts r3274777 cathedral, r6875903 ranges, r3274779 clergy house are claimed with the parent); the pink wall with the Holy Gate w1109643209, the wall with the yard gate w101406617' },
  { key: 'lensovet', name: 'Первый жилой дом Ленсовета', nameEn: 'First Lensovet House (Levinson, Fomin, 1931-34): concave constructivist slab on a terrace, gallery on columns, two outside stairs, wings',
    ids: ['w50053711', 'w1109066990'], osm: ['w187371636', 'w187371633', 'w261068501', 'w1109059112'], at: [-2168, -4035],
    note: 'footprint w50053711, the court pavilion w1109066990; the two lawns of the terrace w187371636 / w187371633 (GREEN), the stone fence of the court w261068501, the fountain bowl w1109059112' },
];
