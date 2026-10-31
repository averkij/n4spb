// landmarksYelaginKitchen/frame.js - the model frame and the fixed numbers of the Kitchen block (Кухонный корпус, Елагин остров 4 литВ; K. Rossi 1818-22).
// Dossier docs/research/yelagin-palace-2026.md section 6.1 / 12 (the CRITIC LOG wins), photos kit_01 .. kit_16, misc_01, statue photos 5929.1-14 (Commons "<Name> statue at Yelagin Island").
//
// FRAME K.  The building is turned 4.27 deg against the world axes (every straight edge of the OSM ring r1444351 and the passage way w739448361 run along the same direction: dz/dx = -0.0745), so the
// whole module is drawn in its own frame and placed once: origin = the centre of the drum, local +x = u (east-ish), local +z = w (SOUTH-ish: the way out of the south portico toward the palace and the
// Oil Meadow), +y up, rotation.y = TH.  world(x, z) = C + u * e + w * s with e = (cos TH, -sin TH), s = (sin TH, cos TH).
// Measured from the baked ring (least squares on the arc vertices, tools/landmarksYelaginKitchen-* notes in the dossier BUILD LOG): outer arc R 29.83 about the origin (the dossier's R 26.5 /
// centre (-4628.0,-5294.3) was a rough first estimate; the statue nodes lie at R 28.4-28.8 = inside the niches of a 29.83 wall, which confirms the fit), courtyard circle R 20.0 about (-1.2, -2.0),
// north (flat) wall plane w = -0.35, south portico front edge w = +31.38 and north portico front edge w = -3.32 (both 18.3 m wide: OSM kinks), both porticos 3.0 m deep from the back wall.
const DEG = Math.PI / 180;
export const C = { x: -4628.43, z: -5298.68 };
export const TH = 0.07455;                                 // rotation.y of the frame (rad)
const cs = Math.cos(TH), sn = Math.sin(TH);
/** K (u, w) -> world { x, z } */
export const W = (u, w) => ({ x: C.x + u * cs + w * sn, z: C.z - u * sn + w * cs });
/** world (x, z) -> K { u, w } */
export const M = (x, z) => { const dx = x - C.x, dz = z - C.z; return { u: dx * cs - dz * sn, w: dx * sn + dz * cs }; };
/** world yaw (camera convention: 0 north, 90 west, 180 south, -90 east) of a camera at K (u, w) that looks toward the building centre */

export const D = {
  R: 29.83,                  // outer radius of the half drum
  wN: -0.35,                 // the flat north wall plane
  Rc: 20.0, cu: -1.2, cw: -2.0, wCN: 1.9,   // courtyard circle (centre u, w) and the chord of its north wall
  // heights above the lawn
  plinth: 1.1,               // limestone course (0 .. 0.55) + three grooved bands (to 1.1) = the sill of every niche
  wallTop: 5.7,              // top of the plain wall / the bottom of the entablature
  archi: 0.5, frieze: 0.9, mutule: 0.3, corona: 0.35, cyma: 0.15,   // entablature of the drum (sum 2.2): top = 7.9
  top: 7.9,
  proj: 0.85,                // projection of the drum cornice
  // niches of the arc (statues): opening 1.30 x 2.55, depth 0.8
  nicheW: 1.30, nicheH: 2.55, nicheD: 0.8, pil: 0.28,
  // arch vase niches of the north wall: opening 2.0 wide, springing at 2.9, crown 3.9 + the archivolt
  archW: 2.0, archSpring: 2.9,
};
/** the porticos: back wall plane, front edge of the entablature, floor level, column axis depth, column heights */
export const PS = { back: 28.4, front: 31.38, floor: 0.5, colW: 30.6, steps: 3, sign: 1 };      // south (faces the palace)
export const PN = { back: -0.35, front: -3.32, floor: 1.0, colW: -2.57, steps: 5, sign: -1 };    // north (faces the Orangery)
export const POR = {
  halfW: 9.15,                                   // the entablature spans u = -9.15 .. 9.15 (OSM 18.3 m)
  cols: [-8.2, -5.2, -2.2, 2.2, 5.2, 8.2],       // column axes: sides 3.0 m, the middle bay 4.4 m (photos kit_02 / kit_09)
  H: 6.2, D: 1.07, Dtop: 0.86,                   // column with base and capital 6.2 m, lower diameter 1.07 (critic re-measurement)
  entTop: 1.65,                                  // architrave 0.45 + frieze 0.65 + cornice 0.55
  pedRise: 3.0,
  door: { w: 2.5, h: 3.7 },                      // double door under the round-headed recess
};
/** the 14 statues of S. S. Pimenov (1822, Pudozh stone), see statues.js.  place: 'arc' (phi = angle from the south axis toward east, degrees, on the drum) or 'portico' (u in the south portico) */
export const STATUES = [
  { id: 'n6905536550', key: 'vestal',   name: 'Весталка',  place: 'arc', phi: 79.7 },
  { id: 'n6905536551', key: 'juno',     name: 'Юнона',     place: 'arc', phi: 66.4 },
  { id: 'n6905536552', key: 'bacchus',  name: 'Вакх',      place: 'arc', phi: 53.1 },
  { id: 'n6905536553', key: 'flora',    name: 'Флора',     place: 'arc', phi: 39.8 },
  { id: 'n6905536554', key: 'meleager', name: 'Мелеагр',   place: 'arc', phi: 26.5 },
  { id: 'n6905536555', key: 'athena',   name: 'Афина',     place: 'portico', u: 6.7 },
  { id: 'n6905536556', key: 'psyche',   name: 'Психея',    place: 'portico', u: 3.7 },
  { id: 'n6905536557', key: 'ceres',    name: 'Церера',    place: 'portico', u: -3.7 },
  { id: 'n6905536558', key: 'priestess', name: 'Жрица',    place: 'portico', u: -6.7 },
  { id: 'n6905536559', key: 'adonis',   name: 'Адонис',    place: 'arc', phi: -26.5 },
  { id: 'n4353687690', key: 'latona',   name: 'Латона',    place: 'arc', phi: -39.8 },
  { id: 'n6905536560', key: 'mercury',  name: 'Меркурий',  place: 'arc', phi: -53.1 },
  { id: 'n6905536561', key: 'artemis',  name: 'Артемида',  place: 'arc', phi: -66.4 },
  { id: 'n6905536562', key: 'apollo',   name: 'Аполлон',   place: 'arc', phi: -79.7 },
];
export const DEGR = DEG;
export const KITCHEN_ID = 'r1444351';
