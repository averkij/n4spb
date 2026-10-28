// landmarksStrelka/warehouses.js - the two warehouses of the Exchange (пакгаузы, I. F. Luchini 1826-32; the concave back wings by Quarenghi 1795-97): docs/research/strelka.md 2.6,
// photos refs/strelka wh_01 .. wh_06 wh_10 ex_09 aer_01 q_14.  Mirror twins on the OSM footprints:
//   NORTH  w97552311 (Makarova emb. 2: the east block on the square + the embankment wing, eaves 16 m) and w28566717 (Birzhevoy proezd 6: the wing along the Exchange and the horseshoe, eaves 11 m);
//          pale yellow, RED roofs; Institute of Silicate Chemistry, Dokuchaev Soil Science Museum;
//   SOUTH  r19826133 (Universitetskaya emb. 1: the whole complex, eaves 16 m), ochre yellow, light GREY roofs: the Zoological Museum.
// One facade vocabulary (facade.js + the bay textures of mats.js): rusticated socle with small windows, tall round-headed bays with white archivolts, small square windows above (only where the eaves
// are at 16 m), a white cornice, a low hipped roof with chimneys.  The embankment fronts carry the 12-column white loggia between two pavilions.
import * as L from '../layout.js';
import { onEdge } from './kit.js';
import { shellWalls, shellCornice, shellRoof, shellColliders, edgeNear } from './facade.js';

const SPEC = [
  { id: 'w97552311', side: 'N', eave: 16.0, loggia: [-2734.5, -1371.4, -2646.9, -1342.9], centre: 46, party: [-2643.1, -1292.0, -2656.0, -1313.8], name: 'Северный пакгауз Биржи' },
  { id: 'w28566717', side: 'N', eave: 11.0, skipParty: [-2643.1, -1292.0, -2656.0, -1313.8], name: 'Северный пакгауз Биржи (Биржевой проезд, 6)' },
  { id: 'r19826133', side: 'S', eave: 16.0, loggia: [-2543.0, -1122.5, -2560.2, -1083.9], centre: 0, name: 'Южный пакгауз Биржи (Зоологический музей)' },
];

export function warehouses(K) {
  const { ctx, P, M } = K;
  for (const S of SPEC) {
    const b = L.buildingById ? L.buildingById(S.id) : null; if (!b || !b.polys || !b.polys.length) { console.warn('[landmarksStrelka] warehouse footprint missing: ' + S.id); continue; }
    const north = S.side === 'N', mat = north ? M.whN : M.whS, matL = north ? M.whNL : M.whSL, plain = north ? M.whNPlain : M.whSPlain, roof = north ? M.roofRed : M.roofGrey;
    for (const poly of b.polys) {
      const special = (e) => (S.loggia && edgeNear([e], ...S.loggia)) || (S.party && edgeNear([e], ...S.party)) || (S.skipParty && edgeNear([e], ...S.skipParty));
      const edges = shellWalls(P, poly, { mat, plain, bayW: 5.6, texH: 16, eave: S.eave, skip: special });
      // the party wall with the lower wing: only the part above its eaves
      const pe = S.party && edgeNear(edges, ...S.party); if (pe) onEdge(P, pe, (len) => P.quad(plain, [0, 10.9, 0], [len, 10.9, 0], [len, S.eave, 0], [0, S.eave, 0], [0, 0, 1]));
      // the embankment front: pavilions with the ordinary bays, the centre with plain windows behind twelve white columns
      const le = S.loggia && edgeNear(edges, ...S.loggia);
      if (le) onEdge(P, le, (len) => {
        const cw = S.centre || len, x0 = (len - cw) / 2, x1 = x0 + cw, v1 = S.eave / 16;
        for (const [a, c] of [[0, x0], [x1, len]]) { if (c - a < 1) continue; const n = Math.max(1, Math.round((c - a) / 5.6)); P.quad(mat, [a, 0, 0], [c, 0, 0], [c, S.eave, 0], [a, S.eave, 0], [0, 0, 1], [[0, 0], [n, 0], [n, v1], [0, v1]]); }
        const nb = 11, pitch = cw / nb;
        P.quad(matL, [x0, 0, 0], [x1, 0, 0], [x1, S.eave, 0], [x0, S.eave, 0], [0, 0, 1], [[0, 0], [nb, 0], [nb, v1], [0, v1]]);
        // the stylobate ledge on the socle, the columns (3.2 .. 14.3), the architrave under the cornice
        P.box(M.white, x0 - 0.5, x1 + 0.5, 2.95, 3.2, 0, 1.25, 'kb');
        for (let k = 0; k <= nb; k++) { const x = x0 + k * pitch; P.cyl(M.white, [x, 3.2, 0.62], [x, 13.9, 0.62], 0.58, 0.5, 12, false); P.box(M.white, x - 0.66, x + 0.66, 13.9, 14.3, -0.02, 1.28, ''); P.box(M.white, x - 0.66, x + 0.66, 3.2, 3.36, -0.02, 1.28, 'b'); }
        P.box(M.white, x0 - 0.7, x1 + 0.7, 14.3, S.eave - 0.55, 0, 1.2, 'k');
      });
      shellCornice(P, poly, S.eave, M);
      shellRoof(P, poly, S.eave, roof, { chimney: M.chimney, cap: M.whiteShade });
      shellColliders(ctx, poly, S.eave + 3);
    }
    K.svc.monuments.push({ id: 'warehouse-' + S.id, name: S.name, x: b.cx, z: b.cz, h: S.eave + 3, r: 0 });
  }
}
