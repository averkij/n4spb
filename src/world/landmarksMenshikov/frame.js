// landmarksMenshikov/frame.js - the model frames and the fixed dimensions of the module (docs/research/menshikov.md sections 1.2, 2, 3, 4, 5; frames checked on the baked footprints to 0.0-0.1 m).
//   PF  palace frame      origin (-3090.3, -705.5), rotation.y +30 deg: local +x = a along the river front (bearing 60, ENE), local +z = b toward the Neva (bearing 150, SSE); the fronts face +z.
//   KF  Corps frame       origin (-3211.4, -732.7), rotation.y -60 deg: local +x = a along the Kadetskaya line (bearing 150, SSE, toward the Neva end), local +z = b toward the street (bearing 240); the
//                         facade of range R1 faces +z, the building lies at b < 0.
//   GF  garden frame      origin (-3286.0, -672.0) = the obelisk, rotation.y +30 deg: local +x bearing 60, local +z bearing 150 (toward the Universitetskaya embankment, the south gate).
//   DF  descent frame     origin A (-3306.2, -555.1) = the west end of the apron wall, rotation.y +30 deg: local +x along the wall A -> B (bearing 60), local +z toward the river (bearing 150).
// three.js: world x = ox + a cos(rot) + b sin(rot), z = oz - a sin(rot) + b cos(rot).  Every frame object has W(a, b) -> { x, z } and M(x, z) -> { a, b } plus the rotation `rot` for P.push.
const DEG = Math.PI / 180;
function mk(x, z, rotDeg) {
  const rot = rotDeg * DEG, c = Math.cos(rot), s = Math.sin(rot);
  return {
    x, z, rot,
    W: (a, b) => ({ x: x + a * c + b * s, z: z - a * s + b * c }),
    M: (wx, wz) => { const dx = wx - x, dz = wz - z; return { a: dx * c - dz * s, b: dx * s + dz * c }; },
    /** world direction of the local +x / +z axes */
    ax: [c, -s], bz: [s, c],
  };
}
export const PF = mk(-3090.3, -705.5, 30);
export const KF = mk(-3211.4, -732.7, -60);
export const GF = mk(-3286.0, -672.0, 30);
export const DF = mk(-3306.2, -555.1, 30);

/** the baked footprints (fallback: the numbers of the dossier, frames P / K) */
export const PALACE_ID = 'w216655164', CORPS_ID = 'w28691170';
export const PALACE_RING = [[-32.7, -26.3], [-32.5, -40.7], [-18.9, -40.6], [-19.1, -16.2], [-6.1, -16.1], [-6.0, -21.2], [6.1, -21.1], [6.0, -16.0], [19.6, -15.9], [19.7, -40.8], [33.4, -40.9], [32.9, -28.0], [32.9, -12.9], [20.2, -13.0], [20.1, 2.7], [12.1, 2.7], [12.1, -0.1], [-12.7, -0.3], [-12.7, 2.5], [-20.1, 2.5], [-20.0, -14.6], [-32.8, -14.6]];

/** HEIGHTS (m above the pavement; dossier 2.3: palace [E +-1 m]; 3.3: Corps [E +-1.5 m]) */
export const HP = {
  plinth: 1.0,            // granite plinth / cellar zone (the entrance floor is +1.0: six steps of 0.17 m)
  s1: 4.1, s1t: 4.45,     // string course under the piano nobile
  s2: 8.2, s2t: 8.55,     // string course under the second storey
  cornice: 11.5, eave: 12.5,
  atticTop: 14.3,         // the attic of the recess (a in [-7.3, +7.3], set back 2.5 m)
  brk: 16.3, top: 18.3,   // mansard break and the flat top
  gableApex: 15.5, crown: 17.3, chimney: 19.5,
  wingRidge: 16.7,
  gallery: 8.8,           // the 2-storey galleries west / east of the palace (eaves 8.5-9 m with the oculi row)
};
export const HC = {
  eave: 10.4, ridge: 12.4, // R1 (the Kadetskaya front)
  base: 2.5,              // rusticated base
  porticoTop: 11.4,       // entablature of the porticoes
  wing: 9.2,              // the courtyard ranges (R3-R5), plain
  r2: 11.2,               // the south block R2 (heavier cornice)
};
export const HG = { fence: 2.1, post: 2.5, plinth: 0.55, obelisk: 21.3, pavilionFloor: 1.0 };
