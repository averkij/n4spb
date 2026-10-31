// Survey coordinates from O65's 2026-10-31 OSM snapshot, ODbL contributors.
// Structural dimensions: Lenmontazh (manufacturer) and Giprostroymost-SPb's
// PGS_16-2024 dossier, pp. 5–7. Site ground belongs to the waterfront builder.
export const MAST_BASE_Y = 1.1; // Neva −3.4 + hydraulic island's 4.5 m height
export const MAST_HEIGHT = 175;
export const MAST_DIAMETER_BASE = 3.9;
export const MAST_DIAMETER_TOP = 1.8;
export const FLAG_WIDTH = 60;
export const FLAG_HEIGHT = 40;

export const SITES = [
  {
    key: 'imperial', id: 'n11012205951', name: 'Исторический флаг Российской империи',
    x: -9103.3, z: -5670.7, y: MAST_BASE_Y,
    platformId: 'w1426773312', platformRadius: 25,
    bankIds: ['w1359856862', 'w1426775563'], bridgeId: 'w1426773313',
  },
  {
    key: 'ussr', id: 'n11012205952', name: 'Исторический флаг СССР',
    x: -8849.3, z: -5388.9, y: MAST_BASE_Y,
    platformId: 'w1426773298', platformRadius: 25,
    bankIds: ['w1359856861', 'w1426775562'], bridgeId: 'w1426773301',
  },
  {
    key: 'russia', id: 'n11012205953', name: 'Флаг Российской Федерации',
    x: -8233.9, z: -5170.4, y: MAST_BASE_Y,
    platformId: 'w1426773294', platformRadius: 25,
    bankIds: ['w1359856860', 'w1426775560'], bridgeId: 'w1426773295',
  },
];

export const GROUPS_LIST = [
  {
    key: 'okrug65-three-flags', name: 'Три флагштока', nameEn: 'Three waterfront flagpoles',
    ids: [], osm: SITES.map(s => s.id), at: [-8849.3, -5388.9],
    note: 'Three 175 m steel masts (179.5 m above sea), exposed diameter 3.90 to 1.80 m, with 60 × 40 m historical flag cloths. Explicit user exception for these three reference landmarks only. Hydraulic islands and access bridges belong to the waterfront ground group.',
  },
];
