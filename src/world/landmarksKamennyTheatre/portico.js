// landmarksKamennyTheatre/portico.js - the PORTICO of the theatre (photos T01 T05 T11 T13): the granite stylobate platform (1.2 m) with five steps along the whole front, eight smooth Corinthian columns (9.7 m, axis 2.874 m)
// and the soffit.  The entablature, the pediment and the front wall with the doors are in body.js.  Frame T.
import { T, TP, COLS } from './frame.js';
import { corinthian } from './orders.js';

export async function build(K) {
  const { M, P, N } = K;
  const { HW, ZF, platH, platEdge, colAxis } = TP;
  P.push(T.ox, 0, T.oz, T.rot); N.push(T.ox, 0, T.oz, T.rot);
  const PW = 11.1;                                                           // half width of the platform
  P.box(M.granite, -PW, PW, 0, platH, ZF - 0.2, platEdge, 'b', 1.8);
  P.box(M.granite, -PW - 0.12, PW + 0.12, platH - 0.18, platH, platEdge - 0.0, platEdge + 0.12, 'b', 1.8);   // the nosing
  const n = 5, tread = (TP.ZS - platEdge) / n;
  for (let j = 1; j <= n; j++) P.box(M.granite, -PW - 0.12, PW + 0.12, 0, platH - 0.2 * j, platEdge + (j - 1) * tread, platEdge + j * tread, 'b', 1.8);
  // the soffit of the portico: a plain ceiling between the architrave and the wall
  P.cap(M.soffit, [[-HW, ZF], [HW, ZF], [HW, TP.ZP - 0.95], [-HW, TP.ZP - 0.95]], TP.entab, false, 4);
  // eight columns
  P.push(0, platH, 0, 0); N.push(0, platH, 0, 0);
  for (let i = 0; i < COLS.n; i++) corinthian(P, N, M.white, -COLS.axis + i * COLS.step, colAxis, TP.colH);
  P.pop(); N.pop();
  P.pop(); N.pop();
}
