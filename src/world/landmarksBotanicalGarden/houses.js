// landmarksBotanicalGarden/houses.js - the STAFF HOUSE lit B (Служебный дом литера Б, OSM r2123950 + the 4th-floor part r6189481; Dietrich 1912-14; Komarov lived here 1913-45; dossier 4.1b, not photographed [?]):
//   a long (63 x 17.6 m) three-storey stucco block (OSM colour #d9c06c, a rusticated stone base, a cornice) with a flat roof and, over its middle 37.5 m, a fourth storey under a hip roof (OSM 13.2 m).
//   Windows on every edge at a 3.2 m pitch; a plaque of V. L. Komarov (n9352981941) belongs to this house in the OSM; no entrance details are known.
import { ringOf } from './frame.js';
import { ringHouse } from './house.js';
import { stage } from './shell.js';

export function build(K) {
  const M = K.M, P = K.P;
  const ring = ringOf('r2123950'), top = ringOf('r6189481');
  stage(K, 'lower', () => ringHouse(K, ring, {
    baseH: 1.0, baseMat: M.plinth, wallMat: M.ochre, y1: 9.9, floors: [{ y0: 1.2, h: 1.9, w: 1.2 }, { y0: 4.5, h: 2.0, w: 1.25 }, { y0: 7.7, h: 1.9, w: 1.25 }], pitch: 3.2, margin: 1.6,
    cornice: { h: 0.35, d: 0.4 }, roofMat: null,
  }));
  stage(K, 'flat roof', () => { P.cap(M.iron, ring, 10.35, true, 4); });
  stage(K, 'fourth floor', () => ringHouse(K, top, {
    baseH: 0, y0: 10.2, wallMat: M.ochre, y1: 13.2, floors: [{ y0: 10.9, h: 1.7, w: 1.2 }], pitch: 3.2, margin: 1.6, cornice: { h: 0.3, d: 0.35 }, roofMat: M.roofRed, roofSlope: 0.45, over: 0.45, collide: false,
  }));
  const c = ring.reduce((a, p) => [a[0] + p[0] / ring.length, a[1] + p[1] / ring.length], [0, 0]);
  K.svc.monuments.push({ id: 'r2123950', name: 'Служебный дом (литера Б), здесь жил В. Л. Комаров', x: c[0], z: c[1], h: 13.2 });
  if (K.errs && K.errs.length) throw new Error('staff house: ' + K.errs.join('\n'));
}
