// landmarksKamennyTheatre/props.js - the street furniture of the theatre square (photos T01 T02 T06 T09 T11 X09): six grey ventilation kiosks of the underground floor (a plinth, louvred walls, a pyramid cap) and the round
// BDT poster kiosk (hexagon of three posters, a grey dome) at the right end of the stylobate.  Frame T.  Publishes the solid footprints in K.shared.solids for walk.js.
import * as THREE from 'three';
import { T } from './frame.js';
import { frustum } from './geo.js';
import { Q } from './facade.js';

export const VENTS = [[-5.3, 30.2], [-15.1, 28.0], [15.3, 27.4], [-13.4, 15.2], [-3.9, -28.2], [-13.5, -19.8]];
export const POSTER = [12.2, 29.2];

export async function build(K) {
  const { M, P, N } = K;
  P.push(T.ox, 0, T.oz, T.rot); N.push(T.ox, 0, T.oz, T.rot);
  for (const [x, z] of VENTS) {
    P.push(x, 0, z, 0); N.push(x, 0, z, 0);
    P.box(M.grey, -0.95, 0.95, 0, 0.3, -0.95, 0.95, 'b', 2);
    P.box(M.grey, -0.78, 0.78, 0.3, 2.05, -0.78, 0.78, 'b', 2);
    for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const c = 0.8, pt = (u, y) => (nx ? [nx * c, y, u] : [u, y, nz * c]);
      Q(N, M.louvre, pt(-0.55, 0.55), pt(0.55, 0.55), pt(0.55, 1.75), pt(-0.55, 1.75), [nx, 0, nz]);
    }
    frustum(P, M.roof, 0, 0, 2.05, 2.75, 4, 1.35, 0.06, Math.PI / 4, 1.5, 1);
    P.box(M.iron, -0.02, 0.02, 2.75, 3.0, -0.02, 0.02, '', 1);
    P.pop(); N.pop();
  }
  // the poster kiosk: a hexagonal body with six posters (three designs twice), a grey base ring and a flattened dome
  {
    const [x, z] = POSTER, R = 0.9;
    P.push(x, 0, z, 0.3); N.push(x, 0, z, 0.3);
    frustum(P, M.grey, 0, 0, 0, 0.45, 6, 1.12, 1.05, 0, 3, 1);
    frustum(P, M.grey, 0, 0, 0.45, 2.15, 6, R * 1.04, R * 1.04, 0, 3, 3);
    const SS = [M.poster1, M.poster2, M.poster3, M.poster1, M.poster3, M.poster2];
    const Rc = R * 1.04, ap = Rc * Math.cos(Math.PI / 6), k = (ap + 0.025) / ap;
    for (let i = 0; i < 6; i++) {
      const a0 = i * Math.PI / 3, a1 = (i + 1) * Math.PI / 3, am = (a0 + a1) / 2;
      const q = (a, y) => [Math.sin(a) * Rc * k, y, Math.cos(a) * Rc * k];
      Q(P, SS[i], q(a0, 0.65), q(a1, 0.65), q(a1, 2.0), q(a0, 2.0), [Math.sin(am), 0, Math.cos(am)]);
    }
    frustum(P, M.grey, 0, 0, 2.15, 2.3, 6, 1.12, 1.12, 0, 3, 1);
    const g = new THREE.SphereGeometry(1, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2); P.geo(M.roof, g, 0, 2.3, 0, 0, 0, 0, 1.08, 0.5, 1.08); g.dispose();
    P.pop(); N.pop();
  }
  P.pop(); N.pop();
}
